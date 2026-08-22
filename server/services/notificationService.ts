import { notifyOwner } from "../_core/notification";

/**
 * Notification types and interfaces
 */

export type NotificationType = "price_alert" | "score_change" | "catalyst_detected" | "portfolio_update";

export interface NotificationPreferences {
  userId: number;
  emailAlerts: boolean;
  pushAlerts: boolean;
  priceAlerts: boolean;
  scoreAlerts: boolean;
  catalystAlerts: boolean;
  portfolioAlerts: boolean;
  alertThreshold: number; // percentage change to trigger alert
}

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  assetTicker?: string;
  assetName?: string;
  data?: Record<string, any>;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  email: string,
  subject: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Use built-in notifyOwner for system notifications
    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    const htmlContent = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${
        data
          ? `<pre>${JSON.stringify(data, null, 2)}</pre>`
          : ""
      }
      <hr />
      <p><small>CAN SLIM Crypto Scanner</small></p>
    `;

    await notifyOwner({
      title: subject,
      content: htmlContent,
    });

    console.info(`[NotificationService] Email sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[NotificationService] Error sending email:", error);
    return false;
  }
}

/**
 * Send push notification
 */
export async function sendPushNotification(
  userId: number,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // In production, integrate with push notification service
    // (Firebase Cloud Messaging, OneSignal, Pusher, etc.)
    console.info(`[NotificationService] Push notification for user ${userId}: ${title}`);
    console.info(`Message: ${message}`);
    if (data) {
      console.info(`Data: ${JSON.stringify(data)}`);
    }
    return true;
  } catch (error) {
    console.error("[NotificationService] Error sending push notification:", error);
    return false;
  }
}

/**
 * Send price alert notification
 */
export async function sendPriceAlert(
  userId: number,
  email: string,
  ticker: string,
  name: string,
  currentPrice: number,
  previousPrice: number,
  priceChange: number,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.priceAlerts) {
    return false;
  }

  const direction = priceChange > 0 ? "📈 UP" : "📉 DOWN";
  const subject = `${ticker} Price Alert: ${direction} ${Math.abs(priceChange).toFixed(2)}%`;
  const message = `
    ${name} (${ticker}) has moved ${direction} by ${Math.abs(priceChange).toFixed(2)}%.
    Previous: $${previousPrice.toFixed(2)}
    Current: $${currentPrice.toFixed(2)}
  `;

  let success = false;

  if (preferences.emailAlerts) {
    success = await sendEmailNotification(email, subject, message, {
      ticker,
      name,
      currentPrice,
      previousPrice,
      priceChange,
    });
  }

  if (preferences.pushAlerts) {
    await sendPushNotification(userId, subject, message, {
      ticker,
      currentPrice,
      priceChange,
    });
  }

  return success;
}

/**
 * Send CAN SLIM score change notification
 */
export async function sendScoreChangeAlert(
  userId: number,
  email: string,
  ticker: string,
  name: string,
  oldScore: number,
  newScore: number,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.scoreAlerts) {
    return false;
  }

  const scoreChange = newScore - oldScore;
  const direction = scoreChange > 0 ? "📈 IMPROVED" : "📉 DECLINED";
  const subject = `${ticker} CAN SLIM Score ${direction}: ${Math.abs(scoreChange)} points`;
  const message = `
    ${name} (${ticker}) CAN SLIM score has ${direction.toLowerCase()}.
    Previous: ${oldScore}/100
    Current: ${newScore}/100
    Change: ${scoreChange > 0 ? "+" : ""}${scoreChange} points
  `;

  let success = false;

  if (preferences.emailAlerts) {
    success = await sendEmailNotification(email, subject, message, {
      ticker,
      name,
      oldScore,
      newScore,
      scoreChange,
    });
  }

  if (preferences.pushAlerts) {
    await sendPushNotification(userId, subject, message, {
      ticker,
      oldScore,
      newScore,
      scoreChange,
    });
  }

  return success;
}

/**
 * Send catalyst detected notification
 */
export async function sendCatalystAlert(
  userId: number,
  email: string,
  ticker: string,
  name: string,
  catalyst: string,
  sentiment: "positive" | "negative" | "neutral",
  source: string,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.catalystAlerts) {
    return false;
  }

  const sentimentEmoji =
    sentiment === "positive" ? "🟢" : sentiment === "negative" ? "🔴" : "🟡";
  const subject = `${sentimentEmoji} New Catalyst Detected: ${ticker} - ${catalyst}`;
  const message = `
    A new catalyst has been detected for ${name} (${ticker}).
    Catalyst: ${catalyst}
    Sentiment: ${sentiment}
    Source: ${source}
  `;

  let success = false;

  if (preferences.emailAlerts) {
    success = await sendEmailNotification(email, subject, message, {
      ticker,
      name,
      catalyst,
      sentiment,
      source,
    });
  }

  if (preferences.pushAlerts) {
    await sendPushNotification(userId, subject, message, {
      ticker,
      catalyst,
      sentiment,
      source,
    });
  }

  return success;
}

/**
 * Send portfolio update notification
 */
export async function sendPortfolioUpdateAlert(
  userId: number,
  email: string,
  portfolioName: string,
  totalReturn: number,
  bestPerformer: string,
  worstPerformer: string,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.portfolioAlerts) {
    return false;
  }

  const returnEmoji = totalReturn > 0 ? "📈" : "📉";
  const subject = `${returnEmoji} Portfolio Update: ${portfolioName} - ${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(2)}%`;
  const message = `
    Your portfolio "${portfolioName}" has been updated.
    Total Return: ${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(2)}%
    Best Performer: ${bestPerformer}
    Worst Performer: ${worstPerformer}
  `;

  let success = false;

  if (preferences.emailAlerts) {
    success = await sendEmailNotification(email, subject, message, {
      portfolioName,
      totalReturn,
      bestPerformer,
      worstPerformer,
    });
  }

  if (preferences.pushAlerts) {
    await sendPushNotification(userId, subject, message, {
      portfolioName,
      totalReturn,
      bestPerformer,
      worstPerformer,
    });
  }

  return success;
}

/**
 * Get default notification preferences
 */
export function getDefaultPreferences(userId: number): NotificationPreferences {
  return {
    userId,
    emailAlerts: true,
    pushAlerts: true,
    priceAlerts: true,
    scoreAlerts: true,
    catalystAlerts: true,
    portfolioAlerts: true,
    alertThreshold: 5, // 5% price change
  };
}

/**
 * Validate notification preferences
 */
export function validatePreferences(prefs: Partial<NotificationPreferences>): boolean {
  if (prefs.alertThreshold !== undefined && (prefs.alertThreshold < 0 || prefs.alertThreshold > 100)) {
    return false;
  }
  return true;
}
