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
