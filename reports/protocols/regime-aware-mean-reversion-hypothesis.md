# Regime-Aware Mean Reversion — Preregistered Research Protocol

## Hypothesis

Within a broad market uptrend, an asset that is itself above its long-term trend but temporarily oversold by both RSI and Bollinger-band measures will exhibit a favourable short-horizon mean-reversion profile. The hypothesis is explicitly falsifiable and is not assumed to be true.

## Fixed signal family

The market regime is positive only when BTC/USDT's prior completed close is above its 200-day SMA and that SMA is above its value 20 completed days earlier. The asset must also have a prior completed close above its own 200-day SMA. An entry is eligible only if prior RSI(14) is below the selected threshold and the prior close is below the selected lower 20-day Bollinger band.

The predeclared grid comprises RSI entry threshold (25, 30, or 35), Bollinger standard-deviation multiplier (1.5 or 2.0), RSI exit threshold (50 or 60), maximum holding period (5 or 10 days), and stop loss (8% or 12%). Entries and signal exits occur at the next daily open; a stop may trigger intraday. If a stop and an exit are simultaneously possible, the stop convention takes precedence. The simulation charges 0.10% per side and models no slippage beyond that fee.

## Validation design

Parameter selection uses only BTC/USDT, ETH/USDT, and SOL/USDT in purged annual folds: 2019-08-11—2020-08-09, 2020-08-11—2021-08-09, and 2021-08-11—2022-08-09. One calendar day is embargoed between folds. The independent validation universe is ATOM/USDT, UNI/USDT, AAVE/USDT, and NEAR/USDT over 2024-08-12—2026-08-11; none of those records are used to select parameters.

## Falsification and acceptance criteria

The hypothesis is rejected if no pre-test candidate has at least 18 total completed trades, positive mean asset return in two or more folds, finite Profit Factor, and pre-test gross-profit-contribution HHI of 0.70 or below. The independent basket must have at least 20 completed trades, Profit Factor of 1.50 or higher, positive return in at least two assets, profit-contribution HHI of 0.55 or below, and Profit Factor of 1.30 or higher under a 0.25% fee per side. A pass does not imply a guaranteed future result.
