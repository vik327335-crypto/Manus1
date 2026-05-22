/**
 * Конфигурация для Day Trading модуля
 */

export interface DayTradingConfig {
  // Параметры риска
  risk: {
    riskPercentagePerTrade: number; // % от баланса на одну сделку (1-2%)
    maxPositions: number; // Максимум открытых позиций одновременно
    maxDrawdown: number; // Максимальная просадка в %
    dailyLossLimit: number; // Дневной лимит потерь в %
    maxLeverage: number; // Максимальное плечо
  };

  // Параметры индикаторов
  indicators: {
    rsi: {
      period: number;
      overbought: number; // Обычно 70
      oversold: number; // Обычно 30
    };
    macd: {
      fastPeriod: number; // Обычно 12
      slowPeriod: number; // Обычно 26
      signalPeriod: number; // Обычно 9
    };
    bollingerBands: {
      period: number; // Обычно 20
      stdDeviation: number; // Обычно 2
    };
    volumeProfile: {
      enabled: boolean;
      levels: number; // Количество уровней
    };
  };

  // Параметры стратегий
  strategies: {
    scalping: {
      enabled: boolean;
      minProfitPoints: number; // Минимальная прибыль в пунктах
      maxHoldTime: number; // Максимальное время удержания в минутах
      targetRR: number; // Целевое соотношение риск/прибыль
    };
    momentum: {
      enabled: boolean;
      volumeThreshold: number; // Порог объёма
      priceChangeThreshold: number; // Порог изменения цены в %
      holdTime: number; // Время удержания в минутах
    };
    breakout: {
      enabled: boolean;
      lookbackPeriod: number; // Период для определения уровней в свечах
      confirmationCandles: number; // Количество свечей для подтверждения
      targetRR: number; // Целевое соотношение риск/прибыль
    };
    rangeTrading: {
      enabled: boolean;
      rangeSize: number; // Размер диапазона в пунктах
      bouncePercentage: number; // % отскока от уровня
    };
  };

  // Параметры WebSocket
  websocket: {
    enabled: boolean;
    updateInterval: number; // Интервал обновления в миллисекундах
    reconnectAttempts: number;
    reconnectDelay: number; // Задержка переподключения в миллисекундах
  };

  // Параметры кэша
  cache: {
    maxSize: number; // Максимальный размер кэша
    ttl: number; // Time to live в миллисекундах
    cleanupInterval: number; // Интервал очистки в миллисекундах
  };

  // Параметры логирования
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    logTrades: boolean;
    logIndicators: boolean;
    logSignals: boolean;
  };

  // Параметры бэктестинга
  backtesting: {
    enabled: boolean;
    startDate: string; // ISO format
    endDate: string; // ISO format
    initialBalance: number;
    commission: number; // Комиссия в %
  };

  // Параметры уведомлений
  notifications: {
    enabled: boolean;
    onSignal: boolean;
    onTradeOpen: boolean;
    onTradeClose: boolean;
    onStopLoss: boolean;
    onTakeProfit: boolean;
    onError: boolean;
  };
}

/**
 * Конфигурация по умолчанию
 */
export const DEFAULT_DAY_TRADING_CONFIG: DayTradingConfig = {
  risk: {
    riskPercentagePerTrade: 2,
    maxPositions: 5,
    maxDrawdown: 10,
    dailyLossLimit: 5,
    maxLeverage: 1,
  },

  indicators: {
    rsi: {
      period: 14,
      overbought: 70,
      oversold: 30,
    },
    macd: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    },
    bollingerBands: {
      period: 20,
      stdDeviation: 2,
    },
    volumeProfile: {
      enabled: true,
      levels: 20,
    },
  },

  strategies: {
    scalping: {
      enabled: true,
      minProfitPoints: 5,
      maxHoldTime: 5,
      targetRR: 1.5,
    },
    momentum: {
      enabled: true,
      volumeThreshold: 1.5,
      priceChangeThreshold: 1,
      holdTime: 15,
    },
    breakout: {
      enabled: true,
      lookbackPeriod: 20,
      confirmationCandles: 2,
      targetRR: 2,
    },
    rangeTrading: {
      enabled: true,
      rangeSize: 100,
      bouncePercentage: 0.5,
    },
  },

  websocket: {
    enabled: true,
    updateInterval: 1000,
    reconnectAttempts: 5,
    reconnectDelay: 3000,
  },

  cache: {
    maxSize: 10000,
    ttl: 60000,
    cleanupInterval: 30000,
  },

  logging: {
    enabled: true,
    level: 'info',
    logTrades: true,
    logIndicators: false,
    logSignals: true,
  },

  backtesting: {
    enabled: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialBalance: 10000,
    commission: 0.1,
  },

  notifications: {
    enabled: true,
    onSignal: true,
    onTradeOpen: true,
    onTradeClose: true,
    onStopLoss: true,
    onTakeProfit: true,
    onError: true,
  },
};

/**
 * Конфигурация для агрессивного трейдинга
 */
export const AGGRESSIVE_DAY_TRADING_CONFIG: DayTradingConfig = {
  ...DEFAULT_DAY_TRADING_CONFIG,
  risk: {
    riskPercentagePerTrade: 3,
    maxPositions: 10,
    maxDrawdown: 15,
    dailyLossLimit: 10,
    maxLeverage: 2,
  },
  strategies: {
    ...DEFAULT_DAY_TRADING_CONFIG.strategies,
    scalping: {
      ...DEFAULT_DAY_TRADING_CONFIG.strategies.scalping,
      minProfitPoints: 2,
      maxHoldTime: 2,
      targetRR: 1,
    },
  },
};

/**
 * Конфигурация для консервативного трейдинга
 */
export const CONSERVATIVE_DAY_TRADING_CONFIG: DayTradingConfig = {
  ...DEFAULT_DAY_TRADING_CONFIG,
  risk: {
    riskPercentagePerTrade: 1,
    maxPositions: 3,
    maxDrawdown: 5,
    dailyLossLimit: 2,
    maxLeverage: 1,
  },
  strategies: {
    ...DEFAULT_DAY_TRADING_CONFIG.strategies,
    scalping: {
      ...DEFAULT_DAY_TRADING_CONFIG.strategies.scalping,
      minProfitPoints: 10,
      maxHoldTime: 10,
      targetRR: 2.5,
    },
  },
};

/**
 * Получить конфигурацию по типу
 */
export function getConfigByType(
  type: 'default' | 'aggressive' | 'conservative'
): DayTradingConfig {
  switch (type) {
    case 'aggressive':
      return AGGRESSIVE_DAY_TRADING_CONFIG;
    case 'conservative':
      return CONSERVATIVE_DAY_TRADING_CONFIG;
    default:
      return DEFAULT_DAY_TRADING_CONFIG;
  }
}

/**
 * Валидация конфигурации
 */
export function validateConfig(config: DayTradingConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Проверка параметров риска
  if (config.risk.riskPercentagePerTrade < 0.5 || config.risk.riskPercentagePerTrade > 5) {
    errors.push('Risk percentage должен быть от 0.5 до 5');
  }

  if (config.risk.maxPositions < 1 || config.risk.maxPositions > 50) {
    errors.push('Max positions должен быть от 1 до 50');
  }

  if (config.risk.maxDrawdown < 1 || config.risk.maxDrawdown > 50) {
    errors.push('Max drawdown должен быть от 1 до 50');
  }

  // Проверка параметров индикаторов
  if (config.indicators.rsi.period < 5 || config.indicators.rsi.period > 50) {
    errors.push('RSI period должен быть от 5 до 50');
  }

  if (config.indicators.rsi.overbought <= config.indicators.rsi.oversold) {
    errors.push('Overbought должен быть больше oversold');
  }

  // Проверка параметров WebSocket
  if (config.websocket.updateInterval < 100 || config.websocket.updateInterval > 60000) {
    errors.push('Update interval должен быть от 100 до 60000 миллисекунд');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Объединить конфигурации
 */
export function mergeConfigs(
  baseConfig: DayTradingConfig,
  overrides: Partial<DayTradingConfig>
): DayTradingConfig {
  return {
    ...baseConfig,
    ...overrides,
    risk: { ...baseConfig.risk, ...overrides.risk },
    indicators: { ...baseConfig.indicators, ...overrides.indicators },
    strategies: { ...baseConfig.strategies, ...overrides.strategies },
    websocket: { ...baseConfig.websocket, ...overrides.websocket },
    cache: { ...baseConfig.cache, ...overrides.cache },
    logging: { ...baseConfig.logging, ...overrides.logging },
    backtesting: { ...baseConfig.backtesting, ...overrides.backtesting },
    notifications: { ...baseConfig.notifications, ...overrides.notifications },
  };
}
