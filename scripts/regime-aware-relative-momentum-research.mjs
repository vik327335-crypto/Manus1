const DAY_MS = 86_400_000;
const INITIAL_CAPITAL = 100_000;
const BASE_FEE_RATE = 0.001;
const TRAIN_UNIVERSE = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const VALIDATION_UNIVERSE = ["DOGEUSDT", "LINKUSDT", "AVAXUSDT", "LTCUSDT"];
const PRETEST_FOLDS = [
  { name: "fold_1", start: "2020-08-11", end: "2021-08-09" },
  { name: "fold_2", start: "2021-08-11", end: "2022-08-09" },
  { name: "fold_3", start: "2022-08-11", end: "2023-08-09" },
];
const HOLDOUT = { start: "2024-08-12", end: "2026-08-11" };
const MIN_PRETEST_TRADES = 15;
const MIN_HOLDOUT_TRADES = 12;

function toTimestamp(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rsi(candles, index, period = 14) {
  const closes = candles.slice(index - period - 1, index).map((candle) => candle.close);
  let gains = 0;
  let losses = 0;
  for (let closeIndex = 1; closeIndex < closes.length; closeIndex += 1) {
    const change = closes[closeIndex] - closes[closeIndex - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function makeIndexByTime(candles) {
  return new Map(candles.map((candle, index) => [candle.openTime, index]));
}

export function runRelativeMomentumBasket(dataBySymbol, symbols, period, parameters, feeRate = BASE_FEE_RATE) {
  const { momentumLookback, momentumThreshold, topRank, rsiMinimum, exitLookback, stopLossPct } = parameters;
  const btcCandles = dataBySymbol.BTCUSDT;
  const indexByTime = Object.fromEntries(Object.entries(dataBySymbol).map(([symbol, candles]) => [symbol, makeIndexByTime(candles)]));
  const states = Object.fromEntries(symbols.map((symbol) => [symbol, { cash: INITIAL_CAPITAL, quantity: 0, entry: null, highWatermark: INITIAL_CAPITAL, maxDrawdown: 0, trades: [] }]));
  const startTimestamp = toTimestamp(period.start);
  const endTimestamp = toTimestamp(period.end);
  const requiredHistory = Math.max(220, 101, momentumLookback + 2, exitLookback + 2, 16);

  for (let btcIndex = requiredHistory; btcIndex < btcCandles.length; btcIndex += 1) {
    const timestamp = btcCandles[btcIndex].openTime;
    if (timestamp < startTimestamp || timestamp > endTimestamp) continue;
    const btcTrend = average(btcCandles.slice(btcIndex - 200, btcIndex).map((candle) => candle.close));
    const btcPriorTrend = average(btcCandles.slice(btcIndex - 220, btcIndex - 20).map((candle) => candle.close));
    const marketRegimePasses = btcCandles[btcIndex - 1].close > btcTrend && btcTrend > btcPriorTrend;

    const snapshot = symbols.flatMap((symbol) => {
      const assetIndex = indexByTime[symbol].get(timestamp);
      const candles = dataBySymbol[symbol];
      if (assetIndex === undefined || assetIndex < requiredHistory) return [];
      const priorClose = candles[assetIndex - 1].close;
      const assetTrend = average(candles.slice(assetIndex - 100, assetIndex).map((candle) => candle.close));
      return [{
        symbol,
        index: assetIndex,
        candles,
        priorClose,
        aboveAssetTrend: priorClose > assetTrend,
        rsi: rsi(candles, assetIndex),
        momentum: priorClose / candles[assetIndex - 1 - momentumLookback].close - 1,
        exitMomentum: priorClose / candles[assetIndex - 1 - exitLookback].close - 1,
      }];
    });
    const rankBySymbol = new Map([...snapshot].sort((left, right) => right.momentum - left.momentum).map((item, index) => [item.symbol, index + 1]));

    for (const asset of snapshot) {
      const state = states[asset.symbol];
      const current = asset.candles[asset.index];
      if (state.quantity > 0 && state.entry) {
        const stopPrice = state.entry.rawEntryPrice * (1 - stopLossPct);
        const stoppedOut = current.low <= stopPrice;
        const signalExit = !marketRegimePasses || asset.exitMomentum < 0;
        if (stoppedOut || signalExit) {
          const rawExitPrice = stoppedOut ? Math.min(current.open, stopPrice) : current.open;
          const proceeds = state.quantity * rawExitPrice * (1 - feeRate);
          const pnl = proceeds - state.entry.capital;
          state.trades.push({ entryDate: state.entry.date, exitDate: toDate(timestamp), pnl, pnlPercent: (pnl / state.entry.capital) * 100, exitReason: stoppedOut ? "stop_loss" : "momentum_or_regime_exit" });
          state.cash = proceeds;
          state.quantity = 0;
          state.entry = null;
        }
      }
      const eligible = marketRegimePasses
        && asset.aboveAssetTrend
        && asset.rsi >= rsiMinimum
        && asset.momentum >= momentumThreshold
        && rankBySymbol.get(asset.symbol) <= topRank;
      if (state.quantity === 0 && eligible) {
        state.quantity = state.cash / (current.open * (1 + feeRate));
        state.entry = { date: toDate(timestamp), rawEntryPrice: current.open, capital: state.cash };
        state.cash = 0;
      }
      const markToMarket = state.quantity > 0 ? state.quantity * current.close * (1 - feeRate) : state.cash;
      state.highWatermark = Math.max(state.highWatermark, markToMarket);
      state.maxDrawdown = Math.max(state.maxDrawdown, 1 - markToMarket / state.highWatermark);
    }
  }

  for (const symbol of symbols) {
    const state = states[symbol];
    if (state.quantity > 0 && state.entry) {
      const candles = dataBySymbol[symbol];
      const finalIndex = indexByTime[symbol].get(endTimestamp);
      const finalCandle = finalIndex === undefined ? candles.findLast((candle) => candle.openTime <= endTimestamp) : candles[finalIndex];
      const proceeds = state.quantity * finalCandle.close * (1 - feeRate);
      const pnl = proceeds - state.entry.capital;
      state.trades.push({ entryDate: state.entry.date, exitDate: toDate(finalCandle.openTime), pnl, pnlPercent: (pnl / state.entry.capital) * 100, exitReason: "end_of_period" });
      state.cash = proceeds;
      state.quantity = 0;
      state.entry = null;
    }
  }

  const assets = symbols.map((symbol) => {
    const state = states[symbol];
    const wins = state.trades.filter((trade) => trade.pnl > 0);
    const losses = state.trades.filter((trade) => trade.pnl < 0);
    const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
    return { symbol, trades: state.trades, metrics: { completedTrades: state.trades.length, winningTrades: wins.length, losingTrades: losses.length, grossProfit, grossLoss, profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss, totalReturn: state.cash / INITIAL_CAPITAL - 1, maxDrawdown: state.maxDrawdown } };
  });
  const grossProfit = assets.reduce((sum, asset) => sum + asset.metrics.grossProfit, 0);
  const grossLoss = assets.reduce((sum, asset) => sum + asset.metrics.grossLoss, 0);
  const profitContribution = assets.map((asset) => ({ symbol: asset.symbol, share: grossProfit === 0 ? 0 : asset.metrics.grossProfit / grossProfit }));
  const hhi = profitContribution.reduce((sum, item) => sum + item.share ** 2, 0);
  return {
    period,
    parameters,
    assets,
    aggregate: {
      completedTrades: assets.reduce((sum, asset) => sum + asset.metrics.completedTrades, 0),
      grossProfit,
      grossLoss,
      profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
      meanAssetReturn: average(assets.map((asset) => asset.metrics.totalReturn)),
      positiveReturnAssets: assets.filter((asset) => asset.metrics.totalReturn > 0).length,
      profitConcentrationHhi: hhi,
      largestProfitContributor: profitContribution.reduce((largest, item) => item.share > largest.share ? item : largest, { symbol: "", share: 0 }),
    },
  };
}

function parameterGrid() {
  const grid = [];
  for (const momentumLookback of [20, 40]) {
    for (const momentumThreshold of [0.05, 0.1]) {
      for (const topRank of [1, 2]) {
        for (const rsiMinimum of [50, 55]) {
          for (const exitLookback of [10, 20]) {
            for (const stopLossPct of [0.1, 0.15]) grid.push({ momentumLookback, momentumThreshold, topRank, rsiMinimum, exitLookback, stopLossPct });
          }
        }
      }
    }
  }
  return grid;
}

function aggregateFolds(folds) {
  const grossProfit = folds.reduce((sum, fold) => sum + fold.aggregate.grossProfit, 0);
  const grossLoss = folds.reduce((sum, fold) => sum + fold.aggregate.grossLoss, 0);
  return { completedTrades: folds.reduce((sum, fold) => sum + fold.aggregate.completedTrades, 0), positiveFolds: folds.filter((fold) => fold.aggregate.meanAssetReturn > 0).length, grossProfit, grossLoss, profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss, meanAssetReturn: average(folds.map((fold) => fold.aggregate.meanAssetReturn)), maxHhi: Math.max(...folds.map((fold) => fold.aggregate.profitConcentrationHhi)) };
}

export function selectCandidate(candidates) {
  return candidates
    .filter((candidate) => candidate.metrics.completedTrades >= MIN_PRETEST_TRADES)
    .filter((candidate) => candidate.metrics.positiveFolds >= 2)
    .filter((candidate) => candidate.metrics.profitFactor !== null && candidate.metrics.meanAssetReturn > 0)
    .sort((left, right) => right.metrics.profitFactor - left.metrics.profitFactor || right.metrics.positiveFolds - left.metrics.positiveFolds || right.metrics.completedTrades - left.metrics.completedTrades)[0] ?? null;
}

async function fetchDailyKlines(symbol, startTime, endTime) {
  const candles = [];
  let cursor = startTime;
  while (cursor < endTime) {
    const url = new URL("https://api.binance.com/api/v3/klines");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", "1d");
    url.searchParams.set("startTime", String(cursor));
    url.searchParams.set("endTime", String(endTime - 1));
    url.searchParams.set("limit", "1000");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${symbol} klines request failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    candles.push(...rows.map((row) => ({ openTime: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })));
    cursor = candles[candles.length - 1].openTime + DAY_MS;
  }
  return candles;
}

function cleanMetrics(metrics) {
  return Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));
}

async function main() {
  const symbols = [...new Set(["BTCUSDT", ...TRAIN_UNIVERSE, ...VALIDATION_UNIVERSE])];
  const startTime = toTimestamp("2019-12-01");
  const endTime = toTimestamp("2026-08-12");
  const dataBySymbol = Object.fromEntries(await Promise.all(symbols.map(async (symbol) => [symbol, await fetchDailyKlines(symbol, startTime, endTime)])));
  const grid = parameterGrid();
  const candidates = grid.map((parameters) => {
    const folds = PRETEST_FOLDS.map((period) => runRelativeMomentumBasket(dataBySymbol, TRAIN_UNIVERSE, period, parameters));
    return { parameters, folds, metrics: aggregateFolds(folds) };
  });
  const candidate = selectCandidate(candidates);
  if (!candidate) throw new Error("No relative-momentum candidate survived the pre-registered pre-test gates");
  const validation = runRelativeMomentumBasket(dataBySymbol, VALIDATION_UNIVERSE, HOLDOUT, candidate.parameters);
  const stress = runRelativeMomentumBasket(dataBySymbol, VALIDATION_UNIVERSE, HOLDOUT, candidate.parameters, 0.0025);
  const targetMet = validation.aggregate.completedTrades >= MIN_HOLDOUT_TRADES
    && validation.aggregate.profitFactor !== null
    && validation.aggregate.profitFactor >= 1.5
    && validation.aggregate.positiveReturnAssets >= 2
    && validation.aggregate.profitConcentrationHhi <= 0.55;

  console.log(JSON.stringify({
    source: "Binance Spot /api/v3/klines",
    protocol: "Preregistered protocol is stored in reports/protocols/regime-aware-relative-momentum-hypothesis.md. Parameter selection uses only BTC, ETH and SOL pre-test folds; validation uses independent DOGE, LINK, AVAX and LTC records.",
    assumptions: { baseFeeRate: BASE_FEE_RATE, stressFeeRate: 0.0025, slippageBeyondFee: "not modelled", initialCapitalPerAsset: INITIAL_CAPITAL },
    preTestFolds: PRETEST_FOLDS,
    holdout: HOLDOUT,
    parameterCombinationsTested: grid.length,
    selectedOnPreTestOnly: { parameters: candidate.parameters, metrics: cleanMetrics(candidate.metrics), folds: candidate.folds.map((fold, index) => ({ name: PRETEST_FOLDS[index].name, aggregate: cleanMetrics(fold.aggregate) })) },
    independentValidation: { aggregate: cleanMetrics(validation.aggregate), assets: validation.assets.map((asset) => ({ symbol: asset.symbol, metrics: cleanMetrics(asset.metrics), trades: asset.trades.map((trade) => ({ ...trade, pnl: round(trade.pnl), pnlPercent: round(trade.pnlPercent) })) })) },
    costStress: { aggregate: cleanMetrics(stress.aggregate) },
    targetMet,
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
