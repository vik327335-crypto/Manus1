# Volatility Compression Breakout — Preregistered Research Protocol

## Hypothesis

When a liquid crypto asset is in a market-wide uptrend, a price breakout following a compressed recent trading range and accompanied by elevated volume may produce an asymmetric continuation payoff after explicit costs. The hypothesis is tested and can be rejected.

## Fixed signal family

The market regime is positive only when BTC/USDT's prior completed close is above its 200-day SMA and that SMA is above its value 20 completed days earlier. For each asset, the prior completed close must exceed the high of the selected preceding breakout window. The immediately preceding compression window's high-low range divided by its mean close must be below the selected compression threshold. The prior completed volume must exceed the selected multiple of its preceding 20-day mean volume.

The predeclared grid includes breakout lookback (20 or 40 days), compression threshold (8% or 12%), volume multiple (1.2 or 1.5), exit SMA (10 or 20 days), and stop loss (10% or 15%). Signals use information completed through day *t−1* and execute at day *t* open. A stop loss may trigger during day *t*. If a stop and a signal exit are both possible, the stop convention takes precedence. Fees are 0.10% per side; no slippage beyond that fee is modelled.

## Validation design

Selection is limited to BTC/USDT, ETH/USDT, and SOL/USDT in purged annual folds: 2019-08-11—2020-08-09, 2020-08-11—2021-08-09, and 2021-08-11—2022-08-09, separated by one-day embargoes. The independent validation universe is EOS/USDT, XLM/USDT, ALGO/USDT, and SAND/USDT from 2024-08-12—2026-08-11. No validation outcome may alter selection parameters.

## Falsification and acceptance criteria

The hypothesis is rejected if no pre-test candidate has at least 18 completed trades, positive mean asset return in two or more folds, a finite Profit Factor, and maximum fold-level gross-profit-contribution HHI at or below 0.70. The independent basket must have at least 12 completed trades, Profit Factor of 1.50 or higher, positive return in at least two assets, HHI at or below 0.55, and stress-test Profit Factor of 1.30 or higher at a 0.25% fee per side. A pass is historical evidence only and does not guarantee future performance.
