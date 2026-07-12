/**
 * Alert Service
 * Manages price alerts, signal alerts, and notifications
 */

export interface Alert {
  id: string;
  userId: string;
  type: "PRICE" | "SIGNAL" | "PORTFOLIO" | "NEWS";
  ticker: string;
  condition: "ABOVE" | "BELOW" | "CHANGE_PERCENT";
  targetValue: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationMethods: ("EMAIL" | "PUSH" | "SMS" | "IN_APP")[];
}

export interface AlertTrigger {
  alertId: string;
  userId: string;
  ticker: string;
  currentPrice: number;
  targetPrice: number;
  message: string;
  timestamp: Date;
}

export interface NotificationTemplate {
  type: "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT";
  subject: string;
  body: string;
  icon?: string;
}

export class AlertService {
  /**
   * Check if alert should be triggered
   */
  static shouldTriggerAlert(
    alert: Alert,
    currentPrice: number
  ): boolean {
    if (!alert.isActive) return false;

    switch (alert.condition) {
      case "ABOVE":
        return currentPrice >= alert.targetValue;
      case "BELOW":
        return currentPrice <= alert.targetValue;
      case "CHANGE_PERCENT":
        // This would need historical price data
        return false;
      default:
        return false;
    }
  }

  /**
   * Generate alert trigger
   */
  static generateAlertTrigger(
    alert: Alert,
    currentPrice: number
  ): AlertTrigger {
    return {
      alertId: alert.id,
      userId: alert.userId,
      ticker: alert.ticker,
      currentPrice,
      targetPrice: alert.targetValue,
      message: this.generateAlertMessage(alert, currentPrice),
      timestamp: new Date(),
    };
  }

  /**
   * Generate alert message
   */
  static generateAlertMessage(alert: Alert, currentPrice: number): string {
    const conditionText =
      alert.condition === "ABOVE"
        ? `reached or exceeded $${alert.targetValue}`
        : `dropped to or below $${alert.targetValue}`;

    return `${alert.ticker} ${conditionText}. Current price: $${currentPrice.toFixed(2)}`;
  }

  /**
   * Generate email template
   */
  static generateEmailTemplate(
    trigger: AlertTrigger,
    alertType: "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT"
  ): NotificationTemplate {
    const templates: Record<string, NotificationTemplate> = {
      PRICE_ALERT: {
        type: "PRICE_ALERT",
        subject: `Price Alert: ${trigger.ticker} reached target price`,
        body: `
          <h2>Price Alert Triggered</h2>
          <p><strong>Ticker:</strong> ${trigger.ticker}</p>
          <p><strong>Current Price:</strong> $${trigger.currentPrice.toFixed(2)}</p>
          <p><strong>Target Price:</strong> $${trigger.targetPrice.toFixed(2)}</p>
          <p><strong>Time:</strong> ${trigger.timestamp.toLocaleString()}</p>
          <p>${trigger.message}</p>
        `,
        icon: "📊",
      },
      SIGNAL_ALERT: {
        type: "SIGNAL_ALERT",
        subject: `Trading Signal: ${trigger.ticker}`,
        body: `
          <h2>Trading Signal Generated</h2>
          <p><strong>Ticker:</strong> ${trigger.ticker}</p>
          <p><strong>Signal:</strong> ${trigger.message}</p>
          <p><strong>Time:</strong> ${trigger.timestamp.toLocaleString()}</p>
        `,
        icon: "🎯",
      },
      PORTFOLIO_ALERT: {
        type: "PORTFOLIO_ALERT",
        subject: `Portfolio Alert: ${trigger.ticker}`,
        body: `
          <h2>Portfolio Alert</h2>
          <p><strong>Asset:</strong> ${trigger.ticker}</p>
          <p><strong>Current Price:</strong> $${trigger.currentPrice.toFixed(2)}</p>
          <p><strong>Alert:</strong> ${trigger.message}</p>
          <p><strong>Time:</strong> ${trigger.timestamp.toLocaleString()}</p>
        `,
        icon: "💼",
      },
      NEWS_ALERT: {
        type: "NEWS_ALERT",
        subject: `News Alert: ${trigger.ticker}`,
        body: `
          <h2>News Alert</h2>
          <p><strong>Ticker:</strong> ${trigger.ticker}</p>
          <p><strong>Alert:</strong> ${trigger.message}</p>
          <p><strong>Time:</strong> ${trigger.timestamp.toLocaleString()}</p>
        `,
        icon: "📰",
      },
    };

    return templates[alertType] || templates.PRICE_ALERT;
  }

  /**
   * Generate push notification template
   */
  static generatePushTemplate(
    trigger: AlertTrigger,
    alertType: "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT"
  ): {
    title: string;
    body: string;
    data: Record<string, string>;
  } {
    const templates: Record<
      string,
      { title: string; body: string; data: Record<string, string> }
    > = {
      PRICE_ALERT: {
        title: `${trigger.ticker} Price Alert`,
        body: `${trigger.message}`,
        data: {
          type: "PRICE_ALERT",
          ticker: trigger.ticker,
          price: trigger.currentPrice.toString(),
        },
      },
      SIGNAL_ALERT: {
        title: `${trigger.ticker} Trading Signal`,
        body: `New trading signal generated`,
        data: {
          type: "SIGNAL_ALERT",
          ticker: trigger.ticker,
          message: trigger.message,
        },
      },
      PORTFOLIO_ALERT: {
        title: `Portfolio Alert`,
        body: `${trigger.ticker}: ${trigger.message}`,
        data: {
          type: "PORTFOLIO_ALERT",
          ticker: trigger.ticker,
        },
      },
      NEWS_ALERT: {
        title: `News: ${trigger.ticker}`,
        body: `${trigger.message}`,
        data: {
          type: "NEWS_ALERT",
          ticker: trigger.ticker,
        },
      },
    };

    return templates[alertType] || templates.PRICE_ALERT;
  }

  /**
   * Calculate alert frequency
   */
  static calculateAlertFrequency(alerts: Alert[]): {
    byType: Record<string, number>;
    byTicker: Record<string, number>;
    total: number;
  } {
    const byType: Record<string, number> = {
      PRICE: 0,
      SIGNAL: 0,
      PORTFOLIO: 0,
      NEWS: 0,
    };
    const byTicker: Record<string, number> = {};

    alerts.forEach((alert) => {
      byType[alert.type]++;
      byTicker[alert.ticker] = (byTicker[alert.ticker] || 0) + 1;
    });

    return {
      byType,
      byTicker,
      total: alerts.length,
    };
  }

  /**
   * Filter alerts by criteria
   */
  static filterAlerts(
    alerts: Alert[],
    criteria: {
      type?: Alert["type"];
      ticker?: string;
      isActive?: boolean;
    }
  ): Alert[] {
    return alerts.filter((alert) => {
      if (criteria.type && alert.type !== criteria.type) return false;
      if (criteria.ticker && alert.ticker !== criteria.ticker) return false;
      if (criteria.isActive !== undefined && alert.isActive !== criteria.isActive)
        return false;
      return true;
    });
  }

  /**
   * Batch check alerts
   */
  static batchCheckAlerts(
    alerts: Alert[],
    priceData: Map<string, number>
  ): AlertTrigger[] {
    const triggers: AlertTrigger[] = [];

    alerts.forEach((alert) => {
      const currentPrice = priceData.get(alert.ticker);
      if (currentPrice !== undefined && this.shouldTriggerAlert(alert, currentPrice)) {
        triggers.push(this.generateAlertTrigger(alert, currentPrice));
      }
    });

    return triggers;
  }

  /**
   * Get alert statistics
   */
  static getAlertStatistics(alerts: Alert[], triggers: AlertTrigger[]) {
    const activeAlerts = alerts.filter((a) => a.isActive).length;
    const inactiveAlerts = alerts.filter((a) => !a.isActive).length;
    const triggeredToday = triggers.filter(
      (t) =>
        new Date(t.timestamp).toDateString() === new Date().toDateString()
    ).length;

    return {
      totalAlerts: alerts.length,
      activeAlerts,
      inactiveAlerts,
      triggeredToday,
      averageAlertsPerTicker:
        alerts.length > 0
          ? alerts.length / new Set(alerts.map((a) => a.ticker)).size
          : 0,
    };
  }

  /**
   * Recommend alerts based on portfolio
   */
  static recommendAlerts(
    portfolio: Array<{ ticker: string; entryPrice: number; currentPrice: number }>
  ): Array<{
    ticker: string;
    recommendedAlerts: Array<{
      type: "TAKE_PROFIT" | "STOP_LOSS" | "BREAKEVEN";
      targetPrice: number;
      reason: string;
    }>;
  }> {
    return portfolio.map((position) => {
      const recommendations = [];

      // Take profit at 20% gain
      recommendations.push({
        type: "TAKE_PROFIT" as const,
        targetPrice: position.entryPrice * 1.2,
        reason: "20% profit target",
      });

      // Stop loss at 10% loss
      recommendations.push({
        type: "STOP_LOSS" as const,
        targetPrice: position.entryPrice * 0.9,
        reason: "10% stop loss",
      });

      // Breakeven alert
      recommendations.push({
        type: "BREAKEVEN" as const,
        targetPrice: position.entryPrice,
        reason: "Breakeven point",
      });

      return {
        ticker: position.ticker,
        recommendedAlerts: recommendations,
      };
    });
  }
}

export default AlertService;
