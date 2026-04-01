/**
 * Strategy Export Service
 * Exports CAN SLIM strategies to JSON and YAML formats for use in trading bots
 */

export interface StrategyParameter {
  name: string;
  value: number | string | boolean;
  type: 'number' | 'string' | 'boolean';
  description: string;
  min?: number;
  max?: number;
}

export interface StrategyRule {
  criterion: 'C' | 'A' | 'N' | 'S' | 'L' | 'I' | 'M';
  name: string;
  condition: string;
  threshold: number;
  weight: number;
}

export interface CANSLIMStrategy {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  
  // Strategy parameters
  parameters: StrategyParameter[];
  
  // CAN SLIM rules
  rules: StrategyRule[];
  
  // Performance metrics
  performance: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    backtestPeriod: {
      startDate: string;
      endDate: string;
    };
  };
  
  // Entry/Exit signals
  signals: {
    entry: {
      minScore: number;
      conditions: string[];
    };
    exit: {
      stopLoss: number;
      takeProfit: number;
      conditions: string[];
    };
  };
  
  // Portfolio settings
  portfolio: {
    maxPositions: number;
    positionSize: number;
    rebalanceFrequency: string;
  };
  
  // Risk management
  riskManagement: {
    maxDrawdown: number;
    maxLeverage: number;
    correlationThreshold: number;
  };
}

/**
 * Export strategy to JSON format
 */
export function exportToJSON(strategy: CANSLIMStrategy): string {
  return JSON.stringify(strategy, null, 2);
}

/**
 * Export strategy to YAML format
 */
export function exportToYAML(strategy: CANSLIMStrategy): string {
  const lines: string[] = [];

  // Header
  lines.push(`# CAN SLIM Trading Strategy`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Metadata
  lines.push(`strategy:`);
  lines.push(`  id: "${strategy.id}"`);
  lines.push(`  name: "${strategy.name}"`);
  lines.push(`  description: "${strategy.description}"`);
  lines.push(`  version: "${strategy.version}"`);
  lines.push(`  author: "${strategy.author}"`);
  lines.push(`  created_at: "${strategy.createdAt}"`);
  lines.push(`  updated_at: "${strategy.updatedAt}"`);
  lines.push('');

  // Parameters
  lines.push(`parameters:`);
  strategy.parameters.forEach((param) => {
    lines.push(`  - name: "${param.name}"`);
    lines.push(`    value: ${formatYAMLValue(param.value)}`);
    lines.push(`    type: "${param.type}"`);
    lines.push(`    description: "${param.description}"`);
    if (param.min !== undefined) {
      lines.push(`    min: ${param.min}`);
    }
    if (param.max !== undefined) {
      lines.push(`    max: ${param.max}`);
    }
  });
  lines.push('');

  // CAN SLIM Rules
  lines.push(`can_slim_rules:`);
  strategy.rules.forEach((rule) => {
    lines.push(`  - criterion: "${rule.criterion}"`);
    lines.push(`    name: "${rule.name}"`);
    lines.push(`    condition: "${rule.condition}"`);
    lines.push(`    threshold: ${rule.threshold}`);
    lines.push(`    weight: ${rule.weight}`);
  });
  lines.push('');

  // Performance
  lines.push(`performance:`);
  lines.push(`  win_rate: ${strategy.performance.winRate}`);
  lines.push(`  profit_factor: ${strategy.performance.profitFactor}`);
  lines.push(`  sharpe_ratio: ${strategy.performance.sharpeRatio}`);
  lines.push(`  max_drawdown: ${strategy.performance.maxDrawdown}`);
  lines.push(`  total_return: ${strategy.performance.totalReturn}`);
  lines.push(`  backtest_period:`);
  lines.push(`    start_date: "${strategy.performance.backtestPeriod.startDate}"`);
  lines.push(`    end_date: "${strategy.performance.backtestPeriod.endDate}"`);
  lines.push('');

  // Entry/Exit Signals
  lines.push(`signals:`);
  lines.push(`  entry:`);
  lines.push(`    min_score: ${strategy.signals.entry.minScore}`);
  lines.push(`    conditions:`);
  strategy.signals.entry.conditions.forEach((cond) => {
    lines.push(`      - "${cond}"`);
  });
  lines.push(`  exit:`);
  lines.push(`    stop_loss: ${strategy.signals.exit.stopLoss}`);
  lines.push(`    take_profit: ${strategy.signals.exit.takeProfit}`);
  lines.push(`    conditions:`);
  strategy.signals.exit.conditions.forEach((cond) => {
    lines.push(`      - "${cond}"`);
  });
  lines.push('');

  // Portfolio
  lines.push(`portfolio:`);
  lines.push(`  max_positions: ${strategy.portfolio.maxPositions}`);
  lines.push(`  position_size: ${strategy.portfolio.positionSize}`);
  lines.push(`  rebalance_frequency: "${strategy.portfolio.rebalanceFrequency}"`);
  lines.push('');

  // Risk Management
  lines.push(`risk_management:`);
  lines.push(`  max_drawdown: ${strategy.riskManagement.maxDrawdown}`);
  lines.push(`  max_leverage: ${strategy.riskManagement.maxLeverage}`);
  lines.push(`  correlation_threshold: ${strategy.riskManagement.correlationThreshold}`);

  return lines.join('\n');
}

/**
 * Helper function to format YAML values
 */
function formatYAMLValue(value: number | string | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return `"${value}"`;
}

/**
 * Create a sample CAN SLIM strategy
 */
export function createSampleStrategy(): CANSLIMStrategy {
  return {
    id: 'canslim-sample-001',
    name: 'CAN SLIM Momentum Strategy',
    description: 'A momentum-based strategy using CAN SLIM criteria for cryptocurrency selection',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'CAN SLIM Scanner',

    parameters: [
      {
        name: 'minScore',
        value: 70,
        type: 'number',
        description: 'Minimum CAN SLIM score to consider an asset',
        min: 0,
        max: 100,
      },
      {
        name: 'lookbackPeriod',
        value: 90,
        type: 'number',
        description: 'Lookback period in days for technical analysis',
        min: 30,
        max: 365,
      },
      {
        name: 'rsiThreshold',
        value: 70,
        type: 'number',
        description: 'RSI threshold for overbought conditions',
        min: 50,
        max: 100,
      },
      {
        name: 'macdSignal',
        value: 'bullish_crossover',
        type: 'string',
        description: 'MACD signal type',
      },
    ],

    rules: [
      {
        criterion: 'C',
        name: 'Current Earnings',
        condition: 'EPS growth > 25% YoY',
        threshold: 25,
        weight: 0.15,
      },
      {
        criterion: 'A',
        name: 'Annual Earnings',
        condition: 'EPS growth > 20% over 3 years',
        threshold: 20,
        weight: 0.15,
      },
      {
        criterion: 'N',
        name: 'New',
        condition: 'Recent breakout or new ATH',
        threshold: 0,
        weight: 0.15,
      },
      {
        criterion: 'S',
        name: 'Supply/Demand',
        condition: 'Volume increase > 50%',
        threshold: 50,
        weight: 0.15,
      },
      {
        criterion: 'L',
        name: 'Leader/Laggard',
        condition: 'Outperforming sector',
        threshold: 0,
        weight: 0.15,
      },
      {
        criterion: 'I',
        name: 'Institutional Support',
        condition: 'Whale accumulation detected',
        threshold: 0,
        weight: 0.15,
      },
      {
        criterion: 'M',
        name: 'Market Direction',
        condition: 'BTC above 200-day EMA',
        threshold: 0,
        weight: 0.1,
      },
    ],

    performance: {
      winRate: 0.62,
      profitFactor: 1.85,
      sharpeRatio: 1.42,
      maxDrawdown: -18.5,
      totalReturn: 156.3,
      backtestPeriod: {
        startDate: '2023-01-01',
        endDate: '2024-12-31',
      },
    },

    signals: {
      entry: {
        minScore: 70,
        conditions: [
          'CAN SLIM score > 70',
          'Price above 50-day EMA',
          'RSI < 70',
          'Volume > 20-day average',
          'Market trend is bullish',
        ],
      },
      exit: {
        stopLoss: -8,
        takeProfit: 25,
        conditions: [
          'CAN SLIM score drops below 50',
          'Price breaks below 20-day EMA',
          'RSI > 80',
          'Negative catalyst detected',
        ],
      },
    },

    portfolio: {
      maxPositions: 10,
      positionSize: 10,
      rebalanceFrequency: 'weekly',
    },

    riskManagement: {
      maxDrawdown: -20,
      maxLeverage: 2,
      correlationThreshold: 0.7,
    },
  };
}

/**
 * Export strategy with metadata
 */
export function exportStrategyWithMetadata(
  strategy: CANSLIMStrategy,
  format: 'json' | 'yaml'
): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const timestamp = new Date().toISOString().split('T')[0];
  const content = format === 'json' ? exportToJSON(strategy) : exportToYAML(strategy);
  const filename = `canslim-strategy-${strategy.id}-${timestamp}.${format}`;
  const mimeType = format === 'json' ? 'application/json' : 'text/yaml';

  return {
    content,
    filename,
    mimeType,
  };
}

/**
 * Parse strategy from JSON
 */
export function parseFromJSON(jsonString: string): CANSLIMStrategy {
  try {
    return JSON.parse(jsonString) as CANSLIMStrategy;
  } catch (error) {
    throw new Error(`Failed to parse JSON strategy: ${error}`);
  }
}

/**
 * Validate strategy structure
 */
export function validateStrategy(strategy: unknown): strategy is CANSLIMStrategy {
  if (typeof strategy !== 'object' || strategy === null) {
    return false;
  }

  const s = strategy as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.version === 'string' &&
    Array.isArray(s.parameters) &&
    Array.isArray(s.rules) &&
    typeof s.performance === 'object' &&
    typeof s.signals === 'object' &&
    typeof s.portfolio === 'object' &&
    typeof s.riskManagement === 'object'
  );
}
