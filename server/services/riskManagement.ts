/**
 * Risk Management Service для Day Trading
 * Управление позициями, стоп-лоссами и take-profits
 */

export interface Position {
  id: string;
  asset: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: number;
  status: 'OPEN' | 'CLOSED' | 'STOPPED';
  pnl: number;
  pnlPercentage: number;
}

export interface RiskParameters {
  accountBalance: number;
  riskPercentage: number; // % от баланса (обычно 1-2%)
  maxPositions: number; // Максимум открытых позиций
  maxDrawdown: number; // Максимальная просадка в %
  dailyLossLimit: number; // Лимит потерь в день
}

export interface StopLoss {
  type: 'fixed' | 'percentage' | 'trailing';
  value: number;
  triggerPrice?: number;
}

export interface TakeProfit {
  levels: Array<{
    price: number;
    percentageToClose: number; // % позиции для закрытия
  }>;
}

export interface RiskRewardRatio {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  rewardAmount: number;
  ratio: number;
  isValid: boolean; // ratio >= 1.5
}

/**
 * Расчёт размера позиции на основе риска
 * @param accountBalance - Баланс счёта
 * @param riskPercentage - % риска от баланса
 * @param entryPrice - Цена входа
 * @param stopLossPrice - Цена стоп-лосса
 * @returns Размер позиции
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);

  if (riskPerUnit === 0) {
    return 0;
  }

  return riskAmount / riskPerUnit;
}

/**
 * Расчёт соотношения риск/прибыль
 * @param entry - Цена входа
 * @param stopLoss - Цена стоп-лосса
 * @param takeProfit - Цена take-profit
 * @returns Объект с расчётами R:R
 */
export function calculateRiskRewardRatio(
  entry: number,
  stopLoss: number,
  takeProfit: number
): RiskRewardRatio {
  const riskAmount = Math.abs(entry - stopLoss);
  const rewardAmount = Math.abs(takeProfit - entry);
  const ratio = rewardAmount / riskAmount;

  return {
    entry,
    stopLoss,
    takeProfit,
    riskAmount,
    rewardAmount,
    ratio: Math.round(ratio * 100) / 100,
    isValid: ratio >= 1.5, // Минимальное соотношение 1:1.5
  };
}

/**
 * Проверка, должна ли позиция быть закрыта по стоп-лоссу
 * @param position - Позиция
 * @param stopLoss - Параметры стоп-лосса
 * @returns true если позиция должна быть закрыта
 */
export function shouldCloseByStopLoss(
  position: Position,
  stopLoss: StopLoss
): boolean {
  if (stopLoss.type === 'fixed') {
    // Фиксированный стоп-лосс
    return position.currentPrice <= position.stopLoss;
  } else if (stopLoss.type === 'percentage') {
    // Процентный стоп-лосс
    const stopPrice =
      position.entryPrice * (1 - stopLoss.value / 100);
    return position.currentPrice <= stopPrice;
  } else if (stopLoss.type === 'trailing') {
    // Trailing stop
    const trailingStopPrice =
      position.currentPrice - stopLoss.value;
    return position.currentPrice <= trailingStopPrice;
  }

  return false;
}

/**
 * Проверка, должна ли позиция быть закрыта по take-profit
 * @param position - Позиция
 * @param takeProfit - Параметры take-profit
 * @returns Объект с информацией о закрытии
 */
export function shouldCloseTakeProfit(
  position: Position,
  takeProfit: TakeProfit
): { shouldClose: boolean; percentageToClose: number } {
  for (const level of takeProfit.levels) {
    if (position.currentPrice >= level.price) {
      return {
        shouldClose: true,
        percentageToClose: level.percentageToClose,
      };
    }
  }

  return { shouldClose: false, percentageToClose: 0 };
}

/**
 * Расчёт текущего P&L позиции
 * @param position - Позиция
 * @returns Объект с P&L информацией
 */
export function calculatePnL(position: Position): {
  pnl: number;
  pnlPercentage: number;
  status: 'profit' | 'loss' | 'breakeven';
} {
  const pnl = (position.currentPrice - position.entryPrice) * position.quantity;
  const pnlPercentage =
    ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;

  let status: 'profit' | 'loss' | 'breakeven' = 'breakeven';
  if (pnl > 0) {
    status = 'profit';
  } else if (pnl < 0) {
    status = 'loss';
  }

  return {
    pnl: Math.round(pnl * 100) / 100,
    pnlPercentage: Math.round(pnlPercentage * 100) / 100,
    status,
  };
}

/**
 * Проверка, превышена ли максимальная просадка
 * @param positions - Массив позиций
 * @param accountBalance - Баланс счёта
 * @param maxDrawdownPercentage - Максимальная просадка в %
 * @returns true если просадка превышена
 */
export function isMaxDrawdownExceeded(
  positions: Position[],
  accountBalance: number,
  maxDrawdownPercentage: number
): boolean {
  const totalLoss = positions
    .filter((p) => p.pnl < 0)
    .reduce((sum, p) => sum + p.pnl, 0);

  const drawdownPercentage = Math.abs(totalLoss / accountBalance) * 100;
  return drawdownPercentage > maxDrawdownPercentage;
}

/**
 * Расчёт статистики портфеля
 * @param positions - Массив позиций
 * @returns Объект со статистикой
 */
export function calculatePortfolioStats(positions: Position[]): {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  openPositions: number;
  closedPositions: number;
} {
  const closedPositions = positions.filter((p) => p.status === 'CLOSED');
  const openPositions = positions.filter((p) => p.status === 'OPEN');

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnLPercentage =
    positions.length > 0
      ? (totalPnL / (positions.length * 1000)) * 100
      : 0;

  const winCount = closedPositions.filter((p) => p.pnl > 0).length;
  const winRate =
    closedPositions.length > 0
      ? (winCount / closedPositions.length) * 100
      : 0;

  const profits = closedPositions
    .filter((p) => p.pnl > 0)
    .reduce((sum, p) => sum + p.pnl, 0);
  const losses = Math.abs(
    closedPositions
      .filter((p) => p.pnl < 0)
      .reduce((sum, p) => sum + p.pnl, 0)
  );

  const profitFactor = losses > 0 ? profits / losses : profits > 0 ? Infinity : 0;

  const averageWin =
    winCount > 0
      ? profits / winCount
      : 0;
  const lossCount = closedPositions.length - winCount;
  const averageLoss =
    lossCount > 0
      ? losses / lossCount
      : 0;

  return {
    totalPnL: Math.round(totalPnL * 100) / 100,
    totalPnLPercentage: Math.round(totalPnLPercentage * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    openPositions: openPositions.length,
    closedPositions: closedPositions.length,
  };
}

/**
 * Проверка, может ли быть открыта новая позиция
 * @param currentPositions - Текущие открытые позиции
 * @param riskParams - Параметры риска
 * @param accountBalance - Баланс счёта
 * @param dailyLoss - Потери за день
 * @returns Объект с результатом проверки
 */
export function canOpenPosition(
  currentPositions: Position[],
  riskParams: RiskParameters,
  accountBalance: number,
  dailyLoss: number
): { canOpen: boolean; reason?: string } {
  // Проверка количества открытых позиций
  if (currentPositions.length >= riskParams.maxPositions) {
    return {
      canOpen: false,
      reason: `Достигнут максимум открытых позиций (${riskParams.maxPositions})`,
    };
  }

  // Проверка дневного лимита потерь
  if (dailyLoss > riskParams.dailyLossLimit) {
    return {
      canOpen: false,
      reason: 'Превышен дневной лимит потерь',
    };
  }

  // Проверка максимальной просадки
  if (
    isMaxDrawdownExceeded(
      currentPositions,
      accountBalance,
      riskParams.maxDrawdown
    )
  ) {
    return {
      canOpen: false,
      reason: 'Превышена максимальная просадка',
    };
  }

  return { canOpen: true };
}

/**
 * Рекомендация по размеру позиции
 * @param riskParams - Параметры риска
 * @param entryPrice - Цена входа
 * @param stopLossPrice - Цена стоп-лосса
 * @returns Рекомендуемый размер позиции
 */
export function getRecommendedPositionSize(
  riskParams: RiskParameters,
  entryPrice: number,
  stopLossPrice: number
): number {
  return calculatePositionSize(
    riskParams.accountBalance,
    riskParams.riskPercentage,
    entryPrice,
    stopLossPrice
  );
}

/**
 * Расчёт оптимальных уровней take-profit
 * @param entryPrice - Цена входа
 * @param riskAmount - Размер риска
 * @returns Массив рекомендуемых уровней take-profit
 */
export function getOptimalTakeProfitLevels(
  entryPrice: number,
  riskAmount: number
): Array<{ price: number; percentageToClose: number }> {
  return [
    {
      price: entryPrice + riskAmount * 1.5,
      percentageToClose: 50,
    },
    {
      price: entryPrice + riskAmount * 2.5,
      percentageToClose: 30,
    },
    {
      price: entryPrice + riskAmount * 3.5,
      percentageToClose: 20,
    },
  ];
}

/**
 * Расчёт оптимального стоп-лосса
 * @param entryPrice - Цена входа
 * @param riskPercentage - Процент риска
 * @param direction - Направление ('long' или 'short')
 * @returns Цена стоп-лосса
 */
export function getOptimalStopLoss(
  entryPrice: number,
  riskPercentage: number,
  direction: 'long' | 'short' = 'long'
): number {
  const riskAmount = entryPrice * (riskPercentage / 100);

  if (direction === 'long') {
    return entryPrice - riskAmount;
  } else {
    return entryPrice + riskAmount;
  }
}
