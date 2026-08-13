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
