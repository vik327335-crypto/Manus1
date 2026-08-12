const DAY_MS = 86_400_000;
const INITIAL_CAPITAL = 100_000;
const BASE_FEE_RATE = 0.001;
const TRAIN_UNIVERSE = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const VALIDATION_UNIVERSE = ["ATOMUSDT", "UNIUSDT", "AAVEUSDT", "NEARUSDT"];
const PRETEST_FOLDS = [
  { name: "fold_1", start: "2019-08-11", end: "2020-08-09" },
  { name: "fold_2", start: "2020-08-11", end: "2021-08-09" },
  { name: "fold_3", start: "2021-08-11", end: "2022-08-09" },
];
const HOLDOUT = { start: "2024-08-12", end: "2026-08-11" };
const MIN_PRETEST_TRADES = 18;
const MIN_HOLDOUT_TRADES = 20;

function toTimestamp(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

export function calculateRsi(candles, index, period = 14) {
  const closes = candles.slice(index - period - 1, index).map((candle) => candle.close);
  let gains = 0;
  let losses = 0;
  for (let closeIndex = 1; closeIndex < closes.length; closeIndex += 1) {
    const change = closes[closeIndex] - closes[closeIndex - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function indexByTime(candles) {
  return new Map(candles.map((candle, index) => [candle.openTime, index]));
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

export function runMeanReversionBasket(dataBySymbol, symbols, period, parameters, feeRate = BASE_FEE_RATE) {
  const { rsiEntry, bandMultiplier, rsiExit, maxHoldingDays, stopLossPct } = parameters;
  const btcCandles = dataBySymbol.BTCUSDT;
  const indices = Object.fromEntries(Object.entries(dataBySymbol).map(([symbol, candles]) => [symbol, indexByTime(candles)]));
  const states = Object.fromEntries(symbols.map((symbol) => [symbol, { cash: INITIAL_CAPITAL, quantity: 0, entry: null, lastExitTimestamp: null, highWatermark: INITIAL_CAPITAL, maxDrawdown: 0, trades: [] }]));
  const startTimestamp = toTimestamp(period.start);
  const endTimestamp = toTimestamp(period.end);
  const requiredHistory = 222;

  for (let btcIndex = requiredHistory; btcIndex < btcCandles.length; btcIndex += 1) {
    const timestamp = btcCandles[btcIndex].openTime;
    if (timestamp < startTimestamp || timestamp > endTimestamp) continue;
    const btcTrend = average(btcCandles.slice(btcIndex - 200, btcIndex).map((candle) => candle.close));
    const btcPriorTrend = average(btcCandles.slice(btcIndex - 220, btcIndex - 20).map((candle) => candle.close));
    const marketRegimePasses = btcCandles[btcIndex - 1].close > btcTrend && btcTrend > btcPriorTrend;

    for (const symbol of symbols) {
      const assetIndex = indices[symbol].get(timestamp);
      const candles = dataBySymbol[symbol];
      if (assetIndex === undefined || assetIndex < requiredHistory) continue;
      const state = states[symbol];
      const current = candles[assetIndex];
      const priorClose = candles[assetIndex - 1].close;
      const assetTrend = average(candles.slice(assetIndex - 200, assetIndex).map((candle) => candle.close));
      const bandCloses = candles.slice(assetIndex - 20, assetIndex).map((candle) => candle.close);
      const bandMean = average(bandCloses);
      const lowerBand = bandMean - bandMultiplier * standardDeviation(bandCloses);
      const assetRsi = calculateRsi(candles, assetIndex);

      if (state.quantity > 0 && state.entry) {
        const stopPrice = state.entry.rawEntryPrice * (1 - stopLossPct);
        const stoppedOut = current.low <= stopPrice;
        const holdingDays = Math.round((timestamp - state.entry.timestamp) / DAY_MS);
        const signalExit = assetRsi >= rsiExit || holdingDays >= maxHoldingDays || !marketRegimePasses;
        if (stoppedOut || signalExit) {
          const rawExitPrice = stoppedOut ? Math.min(current.open, stopPrice) : current.open;
          const proceeds = state.quantity * rawExitPrice * (1 - feeRate);
          const pnl = proceeds - state.entry.capital;
          state.trades.push({ entryDate: state.entry.date, exitDate: toDate(timestamp), pnl, pnlPercent: (pnl / state.entry.capital) * 100, exitReason: stoppedOut ? "stop_loss" : assetRsi >= rsiExit ? "rsi_exit" : holdingDays >= maxHoldingDays ? "time_exit" : "regime_exit" });
          state.cash = proceeds;
          state.quantity = 0;
          state.entry = null;
          state.lastExitTimestamp = timestamp;
        }
      }

      const eligible = marketRegimePasses
        && priorClose > assetTrend
        && assetRsi <= rsiEntry
        && priorClose < lowerBand
        && state.quantity === 0
        && state.lastExitTimestamp !== timestamp;
      if (eligible) {
        state.quantity = state.cash / (current.open * (1 + feeRate));
        state.entry = { date: toDate(timestamp), timestamp, rawEntryPrice: current.open, capital: state.cash };
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
      const finalIndex = indices[symbol].get(endTimestamp);
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
  const contribution = assets.map((asset) => ({ symbol: asset.symbol, share: grossProfit === 0 ? 0 : asset.metrics.grossProfit / grossProfit }));
  return { period, parameters, assets, aggregate: { completedTrades: assets.reduce((sum, asset) => sum + asset.metrics.completedTrades, 0), grossProfit, grossLoss, profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss, meanAssetReturn: average(assets.map((asset) => asset.metrics.totalReturn)), positiveReturnAssets: assets.filter((asset) => asset.metrics.totalReturn > 0).length, profitConcentrationHhi: contribution.reduce((sum, item) => sum + item.share ** 2, 0), largestProfitContributor: contribution.reduce((largest, item) => item.share > largest.share ? item : largest, { symbol: "", share: 0 }) } };
}

function parameterGrid() {
  const grid = [];
  for (const rsiEntry of [25, 30, 35]) {
    for (const bandMultiplier of [1.5, 2]) {
      for (const rsiExit of [50, 60]) {
        for (const maxHoldingDays of [5, 10]) {
          for (const stopLossPct of [0.08, 0.12]) grid.push({ rsiEntry, bandMultiplier, rsiExit, maxHoldingDays, stopLossPct });
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
    .filter((candidate) => candidate.metrics.profitFactor !== null && candidate.metrics.meanAssetReturn > 0 && candidate.metrics.maxHhi <= 0.7)
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

function clean(metrics) {
  return Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));
}

async function main() {
  const allSymbols = [...new Set(["BTCUSDT", ...TRAIN_UNIVERSE, ...VALIDATION_UNIVERSE])];
  const dataBySymbol = Object.fromEntries(await Promise.all(allSymbols.map(async (symbol) => [symbol, await fetchDailyKlines(symbol, toTimestamp("2019-01-01"), toTimestamp("2026-08-12"))])));
  const grid = parameterGrid();
  const candidates = grid.map((parameters) => {
    const folds = PRETEST_FOLDS.map((period) => runMeanReversionBasket(dataBySymbol, TRAIN_UNIVERSE, period, parameters));
    return { parameters, folds, metrics: aggregateFolds(folds) };
  });
  const candidate = selectCandidate(candidates);
  const preTestGateCounts = {
    total: candidates.length,
    sufficientTrades: candidates.filter((item) => item.metrics.completedTrades >= MIN_PRETEST_TRADES).length,
    positiveFolds: candidates.filter((item) => item.metrics.positiveFolds >= 2).length,
    positiveFiniteProfitFactor: candidates.filter((item) => item.metrics.profitFactor !== null && item.metrics.meanAssetReturn > 0).length,
    diversifiedProfit: candidates.filter((item) => item.metrics.maxHhi <= 0.7).length,
  };
  if (!candidate) {
    console.log(JSON.stringify({
      source: "Binance Spot /api/v3/klines",
      protocol: "Preregistered protocol is stored in reports/protocols/regime-aware-mean-reversion-hypothesis.md. The independent validation universe is not evaluated because no candidate passed the pre-test gates.",
      assumptions: { baseFeeRate: BASE_FEE_RATE, slippageBeyondFee: "not modelled", initialCapitalPerAsset: INITIAL_CAPITAL },
      preTestFolds: PRETEST_FOLDS,
      parameterCombinationsTested: grid.length,
      preTestGateCounts,
      hypothesisStatus: "rejected_on_pretest",
      targetMet: false,
    }, null, 2));
    return;
  }
  const validation = runMeanReversionBasket(dataBySymbol, VALIDATION_UNIVERSE, HOLDOUT, candidate.parameters);
  const stress = runMeanReversionBasket(dataBySymbol, VALIDATION_UNIVERSE, HOLDOUT, candidate.parameters, 0.0025);
  const targetMet = validation.aggregate.completedTrades >= MIN_HOLDOUT_TRADES && validation.aggregate.profitFactor !== null && validation.aggregate.profitFactor >= 1.5 && validation.aggregate.positiveReturnAssets >= 2 && validation.aggregate.profitConcentrationHhi <= 0.55 && stress.aggregate.profitFactor !== null && stress.aggregate.profitFactor >= 1.3;
  console.log(JSON.stringify({
    source: "Binance Spot /api/v3/klines",
    protocol: "Preregistered protocol is stored in reports/protocols/regime-aware-mean-reversion-hypothesis.md. Parameter selection is limited to BTC, ETH and SOL pre-test folds; independent validation uses ATOM, UNI, AAVE and NEAR.",
    assumptions: { baseFeeRate: BASE_FEE_RATE, stressFeeRate: 0.0025, slippageBeyondFee: "not modelled", initialCapitalPerAsset: INITIAL_CAPITAL },
    preTestFolds: PRETEST_FOLDS,
    holdout: HOLDOUT,
    parameterCombinationsTested: grid.length,
    preTestGateCounts,
    selectedOnPreTestOnly: { parameters: candidate.parameters, metrics: clean(candidate.metrics), folds: candidate.folds.map((fold, index) => ({ name: PRETEST_FOLDS[index].name, aggregate: clean(fold.aggregate) })) },
    independentValidation: { aggregate: clean(validation.aggregate), assets: validation.assets.map((asset) => ({ symbol: asset.symbol, metrics: clean(asset.metrics), trades: asset.trades.map((trade) => ({ ...trade, pnl: round(trade.pnl), pnlPercent: round(trade.pnlPercent) })) })) },
    costStress: { aggregate: clean(stress.aggregate) },
    targetMet,
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
