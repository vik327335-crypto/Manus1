# Daily Paper Trading and Rolling-Stability Protocol

## Scope

The monitor evaluates the existing `technical_composite_v1` signal on a user-selected basket of Binance Spot pairs. It is **research-only**: it stores virtual long positions and never reads exchange credentials, sends orders, or performs account actions.

## Daily execution rule

The scheduled callback is designed for **00:10 UTC** after the daily candle boundary. Indicators use only completed daily closes through day *t−1*. A new virtual BUY or SELL decision executes at day *t* open, creating at least a one-day information gap and avoiding future-price leakage. Each entry and exit applies a configurable default fee of 10 basis points; additional slippage is not modelled.

## Benchmark and rolling window

At the first completed run, the monitor fixes an equal-weight buy-and-hold baseline for the monitored symbols. Every subsequent run compares virtual-account equity with this baseline. The default rolling window is 90 calendar days and reports closed-trade count, profit factor, win rate, and maximum drawdown.

## Stability states

| State | Rule |
|---|---|
| `healthy` | At least five closed trades, rolling PF at or above 1.50, and model return not below the benchmark. |
| `watch` | Insufficient history, undefined PF, PF below 1.50, or modest underperformance versus benchmark. |
| `degraded` | At least five closed trades and PF below 1.00, or model return trails benchmark by 500 bps or more. |

> A status is evidence about a virtual research process, not a trade recommendation or a performance guarantee.

## Security and idempotency

Each schedule is owned by a user and stored with the platform-issued task UID. The cron callback authenticates the task, resolves the monitor only through that verified UID, ignores caller-supplied monitor IDs, and skips an already processed daily candle through a unique `(monitorId, asOfDate)` constraint.

## Data-quality and failure controls

Before any virtual entry or exit, the service validates that the last completed daily candle is no older than 36 hours. An outdated candle blocks the run; it never creates a virtual trade from stale market data. A failed callback is persisted as an idempotent diagnostic run with an error summary, freshness status, candle age when known, and diagnostic flags.

Every successful run records the latest completed-candle age and checks the virtual-account identity `cash + marked open positions = equity`. A non-zero delta is stored as a diagnostic flag for review. The dashboard exposes the most recent freshness and equity-check outcome.

## Notification safeguards

A project-owner notification is sent only when the model transitions into `degraded`. Data-stale and operational-error notifications are rate-limited per monitor and alert kind to at most one accepted notification per 24 hours. A failed notification delivery does not block monitor persistence and is eligible to retry on a later run. All messages explicitly state that the monitor is virtual and that no real order was sent.

## Governance controls

Every owner-alert attempt is retained in the monitor's delivery audit with `sent`, `failed`, or `suppressed` status. The monitor owner can review this audit in the dashboard together with schedule and diagnostic status.

The owner may adjust four monitoring-only controls: minimum closed trades, watch PF, degraded PF, and the lag versus the benchmark that triggers degradation. Validation requires a minimum of three trades, a watch PF at or above the degraded PF, and bounded values. These controls change only labels and notifications; they never alter the technical composite signal, the virtual execution rule, or any real-world order flow.

## Audit export and weekly evidence

The monitor dashboard provides a CSV export of owner-alert delivery records. Each row includes the timestamp, alert kind, delivery outcome, and retained message, enabling external review of notification behavior without exposing exchange credentials or order data.

The weekly digest is a read-only summary of processed runs, alert events, latest rolling PF, and the model's current gap versus the equal-weight benchmark. Configuration health is checked on every dashboard retrieval: the monitor requires a non-empty asset basket, valid threshold ordering, and a linked cron task whenever it is marked enabled.

## Reporting and comparison controls

The monitor can export a rolling-metrics CSV with one row per daily run, including virtual model return, benchmark return, performance gap, rolling PF, closed-trade count, drawdown, and data-freshness state. The dashboard also provides a read-only comparison across every monitor owned by the user. It is descriptive only: it does not rank strategies for execution, modify any configuration, or trigger an order.

Before a weekly report is rendered, the service validates run counts, alert counts, PF, and closed-trade counts for impossible negative or internally inconsistent values. A failed report-integrity check is shown as a diagnostic condition rather than being silently exported.

## Twenty-cycle development guardrails

The next development cycles may add lifecycle controls, historical comparisons, operational diagnostics, audit artifacts, and read-only digest delivery. They must retain the following non-negotiable boundaries: no exchange credentials, no order submission, no mutation of an evaluated signal by monitoring thresholds, no future-price leakage, and no automatic promotion of a research result into an investment recommendation. Any new historical analytics remain descriptive until separately preregistered and independently validated.

## Archive lifecycle

Archiving is non-destructive. It pauses the linked schedule when one exists, disables new virtual runs, preserves every prior run, alert, and virtual trade, and exposes the preserved record as read-only evidence. An archived monitor cannot be enabled or run until it is explicitly restored in a later lifecycle action.

Restoring removes only the archive marker and always returns the monitor to a paused state. It does not reactivate a Heartbeat job, execute a catch-up virtual trade, or otherwise change signal, capital, historical records, or configured thresholds. The owner must explicitly re-enable daily updates after restoration.

## List discovery controls

The dashboard can filter user-owned monitors by active, paused, or archived lifecycle state and search their names or configured symbols. These controls only narrow what is displayed; they do not alter persisted monitor configuration, schedule state, virtual positions, evidence, or research results.

## Observed-period comparison

The dashboard reports read-only 30, 60, and 90-day comparisons from persisted virtual run snapshots. Each comparison uses a snapshot no later than the window cutoff when available; it otherwise labels the result as partial history. It presents virtual model return, equal-weight benchmark return, their gap, latest rolling PF, closed-trade count, and latest rolling drawdown. These descriptive measurements do not select a strategy, revise a signal, or imply an expected return.

## Stability visualisation

The rolling-stability graph visualises persisted rolling PF snapshots and displays PF 1.50 as a dashed monitoring reference. It shows no line until at least two defined PF observations exist, avoiding an implied trend from a single point. The reference is descriptive and does not cause a trade, parameter update, or any forecast.

Historical comparison points select the nearest persisted run at or before 30-, 60-, and 90-day reference dates. Benchmark-gap drift is the arithmetic change between the current gap and the 30-day historical gap; it is reported only as a change in past virtual outcomes. The comparative CSV includes observed periods, milestone values, and drift evidence without adding non-persisted records.

Historical quality checks flag future dates, duplicate completed-candle dates, stale runs not marked as errors, and missing benchmark data for completed runs. Cadence diagnostics count gaps above 36 hours between persisted daily runs; alert summaries separately count suppressed and failed notifications. These controls expose data and delivery conditions only and do not change the fixed signal or virtual execution.

Lifecycle archive/restore and monitoring-threshold updates write a durable configuration audit record with a timestamp, action, and non-secret change details. The owner can inspect recent records and export the complete audit in CSV. The audit concerns governance controls only; it does not record exchange credentials, send orders, or alter virtual trade history.
