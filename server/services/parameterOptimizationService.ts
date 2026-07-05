import BacktestingService, {
  OHLCV,
  BacktestMetrics,
  StrategyFunction,
  StrategyParams,
} from "./backtestingService";

/**
 * Parameter Optimization Service
 * Finds optimal strategy parameters using various optimization techniques
 */

export interface OptimizationRange {
  min: number;
  max: number;
  step: number;
}

export interface OptimizationResult {
  parameters: StrategyParams;
  metrics: BacktestMetrics;
  score: number;
}

export interface OptimizationReport {
  bestResult: OptimizationResult;
  worstResult: OptimizationResult;
  averageScore: number;
  totalCombinations: number;
  optimizationTime: number; // in milliseconds
  results: OptimizationResult[];
}

export class ParameterOptimizationService {
  /**
   * Grid search optimization - tests all combinations
   */
  static gridSearch(
    historicalData: OHLCV[],
    strategy: StrategyFunction,
    paramRanges: Record<string, OptimizationRange>,
    initialCapital: number = 10000,
    fitnessMetric: "totalReturn" | "sharpeRatio" | "profitFactor" = "totalReturn"
  ): OptimizationReport {
    const startTime = Date.now();
    const results: OptimizationResult[] = [];

    // Generate all parameter combinations
    const combinations = this.generateCombinations(paramRanges);

    for (const params of combinations) {
      try {
        const metrics = BacktestingService.runBacktest(
          historicalData,
          strategy,
          params,
          initialCapital
        );

        const score = this.calculateFitnessScore(metrics, fitnessMetric);

        results.push({
          parameters: params,
          metrics,
          score,
        });
      } catch (error) {
        console.error("Error during grid search:", error);
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    const bestResult = results[0];
    const worstResult = results[results.length - 1];
    const averageScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const endTime = Date.now();

    return {
      bestResult,
      worstResult,
      averageScore,
      totalCombinations: combinations.length,
      optimizationTime: endTime - startTime,
      results,
    };
  }

  /**
   * Random search optimization - tests random combinations
   */
  static randomSearch(
    historicalData: OHLCV[],
    strategy: StrategyFunction,
    paramRanges: Record<string, OptimizationRange>,
    iterations: number = 100,
    initialCapital: number = 10000,
    fitnessMetric: "totalReturn" | "sharpeRatio" | "profitFactor" = "totalReturn"
  ): OptimizationReport {
    const startTime = Date.now();
    const results: OptimizationResult[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const params = this.generateRandomParams(paramRanges);
        const metrics = BacktestingService.runBacktest(
          historicalData,
          strategy,
          params,
          initialCapital
        );

        const score = this.calculateFitnessScore(metrics, fitnessMetric);

        results.push({
          parameters: params,
          metrics,
          score,
        });
      } catch (error) {
        console.error("Error during random search:", error);
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    const bestResult = results[0];
    const worstResult = results[results.length - 1];
    const averageScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const endTime = Date.now();

    return {
      bestResult,
      worstResult,
      averageScore,
      totalCombinations: iterations,
      optimizationTime: endTime - startTime,
      results,
    };
  }

  /**
   * Genetic algorithm optimization
   */
  static geneticAlgorithm(
    historicalData: OHLCV[],
    strategy: StrategyFunction,
    paramRanges: Record<string, OptimizationRange>,
    populationSize: number = 50,
    generations: number = 20,
    initialCapital: number = 10000,
    fitnessMetric: "totalReturn" | "sharpeRatio" | "profitFactor" = "totalReturn"
  ): OptimizationReport {
    const startTime = Date.now();
    const allResults: OptimizationResult[] = [];

    // Initialize population
    let population: OptimizationResult[] = [];
    for (let i = 0; i < populationSize; i++) {
      const params = this.generateRandomParams(paramRanges);
      const metrics = BacktestingService.runBacktest(
        historicalData,
        strategy,
        params,
        initialCapital
      );
      const score = this.calculateFitnessScore(metrics, fitnessMetric);

      population.push({
        parameters: params,
        metrics,
        score,
      });
    }

    allResults.push(...population);

    // Evolution
    for (let gen = 0; gen < generations; gen++) {
      // Sort by fitness
      population.sort((a, b) => b.score - a.score);

      // Keep best individuals (elitism)
      const elite = population.slice(0, Math.ceil(populationSize * 0.2));

      // Create new population
      const newPopulation: OptimizationResult[] = [...elite];

      while (newPopulation.length < populationSize) {
        // Select parents
        const parent1 = this.selectParent(population);
        const parent2 = this.selectParent(population);

        // Crossover
        const child = this.crossover(parent1, parent2, paramRanges);

        // Mutation
        const mutated = this.mutate(child, paramRanges, 0.1);

        // Evaluate
        const metrics = BacktestingService.runBacktest(
          historicalData,
          strategy,
          mutated,
          initialCapital
        );
        const score = this.calculateFitnessScore(metrics, fitnessMetric);

        newPopulation.push({
          parameters: mutated,
          metrics,
          score,
        });

        allResults.push({
          parameters: mutated,
          metrics,
          score,
        });
      }

      population = newPopulation.slice(0, populationSize);
    }

    // Sort all results by score
    allResults.sort((a, b) => b.score - a.score);

    const bestResult = allResults[0];
    const worstResult = allResults[allResults.length - 1];
    const averageScore =
      allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;

    const endTime = Date.now();

    return {
      bestResult,
      worstResult,
      averageScore,
      totalCombinations: allResults.length,
      optimizationTime: endTime - startTime,
      results: allResults.slice(0, 100), // Return top 100
    };
  }

  /**
   * Calculate fitness score based on metric
   */
  private static calculateFitnessScore(
    metrics: BacktestMetrics,
    fitnessMetric: string
  ): number {
    switch (fitnessMetric) {
      case "totalReturn":
        return metrics.totalReturn;
      case "sharpeRatio":
        return metrics.sharpeRatio;
      case "profitFactor":
        return metrics.profitFactor;
      default:
        return metrics.totalReturn;
    }
  }

  /**
   * Generate all parameter combinations (grid)
   */
  private static generateCombinations(
    paramRanges: Record<string, OptimizationRange>
  ): StrategyParams[] {
    const keys = Object.keys(paramRanges);
    const combinations: StrategyParams[] = [];

    const generateRecursive = (
      index: number,
      current: StrategyParams
    ) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const range = paramRanges[key];

      for (let value = range.min; value <= range.max; value += range.step) {
        current[key] = value;
        generateRecursive(index + 1, current);
      }
    };

    generateRecursive(0, {});
    return combinations;
  }

  /**
   * Generate random parameters
   */
  private static generateRandomParams(
    paramRanges: Record<string, OptimizationRange>
  ): StrategyParams {
    const params: StrategyParams = {};

    for (const [key, range] of Object.entries(paramRanges)) {
      const randomValue =
        Math.random() * (range.max - range.min) + range.min;
      params[key] = Math.round(randomValue / range.step) * range.step;
    }

    return params;
  }

  /**
   * Select parent using tournament selection
   */
  private static selectParent(population: OptimizationResult[]): OptimizationResult {
    const tournamentSize = Math.max(2, Math.floor(population.length * 0.1));
    let best = population[0];

    for (let i = 1; i < tournamentSize; i++) {
      const candidate =
        population[Math.floor(Math.random() * population.length)];
      if (candidate.score > best.score) {
        best = candidate;
      }
    }

    return best;
  }

  /**
   * Crossover two parents
   */
  private static crossover(
    parent1: OptimizationResult,
    parent2: OptimizationResult,
    paramRanges: Record<string, OptimizationRange>
  ): StrategyParams {
    const child: StrategyParams = {};

    for (const key of Object.keys(paramRanges)) {
      const p1Value = parent1.parameters[key] as number;
      const p2Value = parent2.parameters[key] as number;

      // Single-point crossover
      if (Math.random() < 0.5) {
        child[key] = p1Value;
      } else {
        child[key] = p2Value;
      }
    }

    return child;
  }

  /**
   * Mutate parameters
   */
  private static mutate(
    params: StrategyParams,
    paramRanges: Record<string, OptimizationRange>,
    mutationRate: number
  ): StrategyParams {
    const mutated: StrategyParams = { ...params };

    for (const key of Object.keys(paramRanges)) {
      if (Math.random() < mutationRate) {
        const range = paramRanges[key];
        const randomValue =
          Math.random() * (range.max - range.min) + range.min;
        mutated[key] = Math.round(randomValue / range.step) * range.step;
      }
    }

    return mutated;
  }
}

export default ParameterOptimizationService;
