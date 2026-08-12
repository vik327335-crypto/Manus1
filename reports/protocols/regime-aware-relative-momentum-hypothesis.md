# Regime-Aware Relative Momentum — Preregistered Research Protocol

## Hypothesis

When the aggregate crypto market is in an established uptrend, restricting entries to assets with the strongest recent cross-sectional momentum will produce a higher **gross-profit-to-gross-loss ratio** than an unfiltered momentum rule. The hypothesis is tested, not assumed true.

## Fixed signal family

The market regime is positive only when BTC/USDT's prior completed close is above its 200-day SMA and that SMA is higher than 20 completed days earlier. An asset becomes eligible only if its prior completed close is above its 100-day SMA, its RSI(14) is at or above the selected threshold, and its selected lookback return ranks in the selected top rank within the training universe. The only predeclared grid dimensions are momentum lookback (20 or 40 days), minimum return (5% or 10%), top rank (1 or 2), RSI threshold (50 or 55), exit momentum lookback (10 or 20 days), and stop loss (10% or 15%).

Signals use completed daily information through day *t−1* and execute at day *t* open. A stop order can trigger within day *t*; if stop and exit conditions coexist, the stop execution convention is applied first. The simulation applies a 0.10% fee on each side and does not model slippage beyond that fee.

## Validation design

Parameter selection uses only BTC/USDT, ETH/USDT, and SOL/USDT in three annual pre-test folds: 2020-08-11—2021-08-09, 2021-08-11—2022-08-09, and 2022-08-11—2023-08-09. A one-day embargo separates adjacent folds. The independent validation universe is DOGE/USDT, LINK/USDT, AVAX/USDT, and LTC/USDT over 2024-08-12—2026-08-11. These validation asset records are not used to select or alter parameters.

## Falsification and acceptance criteria

The hypothesis is rejected if no pre-test candidate has at least 15 total completed trades, positive returns in at least two folds, and a finite Profit Factor; or if the independently validated basket has fewer than 12 completed trades, Profit Factor below 1.5, fewer than two assets with positive returns, or an HHI of gross-profit contribution above 0.55. A pass means only that this specified historical test did not falsify the rule; it is not evidence of guaranteed future performance.
