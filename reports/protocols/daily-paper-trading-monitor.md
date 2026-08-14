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
