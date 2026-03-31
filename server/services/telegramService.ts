/**
 * Telegram bot service for sending alerts and managing subscriptions
 */

import TelegramBot from "node-telegram-bot-api";

// Initialize bot (token should be in environment variables)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-token";
let bot: TelegramBot | null = null;

// Store user subscriptions in memory (in production, use database)
const userSubscriptions: Map<
  number,
  {
    userId: number;
    cryptoScannerId: string;
    watchlistAlerts: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    sentimentAlerts: boolean;
  }
> = new Map();

/**
 * Initialize Telegram bot
 */
export function initializeTelegramBot(): TelegramBot | null {
  if (bot) {
    return bot;
  }

  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "test-token") {
    console.warn("[Telegram] Bot token not configured. Running in test mode.");
    return null;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    // Handle /start command
    bot.onText(/\/start/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
Welcome to CAN SLIM Crypto Scanner Bot! 🚀

Available commands:
/help - Show all commands
/watchlist - View your watchlist
/alerts - Manage alert preferences
/portfolio - View your portfolio
/settings - Configure bot settings
/unsubscribe - Unsubscribe from alerts
      `;
      bot?.sendMessage(chatId, welcomeMessage);
    });

    // Handle /help command
    bot.onText(/\/help/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📚 **CAN SLIM Crypto Scanner Bot Commands:**

/start - Start the bot
/watchlist - View your watchlist
/alerts - Manage alert preferences
  - watchlist_alerts - Price alerts for watchlist items
  - news_alerts - News sentiment alerts
  - sentiment_alerts - AI sentiment analysis alerts
/portfolio - View portfolio summary
/settings - Configure preferences
/unsubscribe - Stop receiving alerts
      `;
      bot?.sendMessage(chatId, helpMessage);
    });

    // Handle /watchlist command
    bot.onText(/\/watchlist/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const watchlistMessage = `
📊 **Your Watchlist:**

Bitcoin (BTC) - $45,230 (+2.5%)
Ethereum (ETH) - $2,850 (-1.2%)
Cardano (ADA) - $0.95 (+5.3%)

Use /portfolio to see detailed analysis.
      `;
      bot?.sendMessage(chatId, watchlistMessage);
    });

    // Handle /alerts command
    bot.onText(/\/alerts/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const alertsMessage = `
🔔 **Alert Preferences:**

Current settings:
✅ Watchlist price alerts - ON
✅ News sentiment alerts - ON
✅ AI sentiment alerts - ON

Reply with:
- "watchlist_alerts on/off"
- "news_alerts on/off"
- "sentiment_alerts on/off"
      `;
      bot?.sendMessage(chatId, alertsMessage);
    });

    // Handle /portfolio command
    bot.onText(/\/portfolio/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const portfolioMessage = `
💼 **Your Portfolio Summary:**

Total Value: $50,000
24h Change: +3.2%
Allocation:
- Bitcoin: 40%
- Ethereum: 35%
- Altcoins: 25%

CAN SLIM Score: 7.2/10
      `;
      bot?.sendMessage(chatId, portfolioMessage);
    });

    // Handle /settings command
    bot.onText(/\/settings/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const settingsMessage = `
⚙️ **Bot Settings:**

Notification frequency: Every hour
Price alert threshold: 5%
Sentiment alert threshold: 0.7

Use /alerts to modify alert preferences.
      `;
      bot?.sendMessage(chatId, settingsMessage);
    });

    // Handle /unsubscribe command
    bot.onText(/\/unsubscribe/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      userSubscriptions.delete(chatId);
      bot?.sendMessage(
        chatId,
        "You have been unsubscribed from all alerts. Use /start to re-subscribe."
      );
    });

    // Handle text messages for alert configuration
    bot.on("message", (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const text = msg.text || "";

      if (text.includes("_alerts")) {
        const [alertType, state] = text.split(" ");
        const isOn = state?.toLowerCase() === "on";

        const subscription = userSubscriptions.get(chatId) || {
          userId: chatId,
          cryptoScannerId: "",
          watchlistAlerts: true,
          priceAlerts: true,
          newsAlerts: true,
          sentimentAlerts: true,
        };

        if (alertType === "watchlist_alerts") {
          subscription.watchlistAlerts = isOn;
        } else if (alertType === "news_alerts") {
          subscription.newsAlerts = isOn;
        } else if (alertType === "sentiment_alerts") {
          subscription.sentimentAlerts = isOn;
        }

        userSubscriptions.set(chatId, subscription);
        bot?.sendMessage(
          chatId,
          `✅ Alert preference updated: ${alertType} is now ${isOn ? "ON" : "OFF"}`
        );
      }
    });

    console.log("[Telegram] Bot initialized successfully");
    return bot;
  } catch (error) {
    console.error("[Telegram] Failed to initialize bot:", error);
    return null;
  }
}

/**
 * Get bot instance
 */
export function getTelegramBot(): TelegramBot | null {
  return bot;
}

/**
 * Send price alert
 */
export async function sendPriceAlert(
  chatId: number,
  ticker: string,
  price: number,
  change: number
): Promise<boolean> {
  if (!bot) {
    console.warn("[Telegram] Bot not initialized");
    return false;
  }

  try {
    const emoji = change > 0 ? "📈" : "📉";
    const message = `
${emoji} **Price Alert: ${ticker.toUpperCase()}**

Current Price: $${price.toFixed(2)}
24h Change: ${change > 0 ? "+" : ""}${change.toFixed(2)}%

Check your watchlist for more details.
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    return true;
  } catch (error) {
    console.error(`[Telegram] Failed to send price alert to ${chatId}:`, error);
    return false;
  }
}

/**
 * Send news alert
 */
export async function sendNewsAlert(
  chatId: number,
  title: string,
  sentiment: number,
  link: string
): Promise<boolean> {
  if (!bot) {
    console.warn("[Telegram] Bot not initialized");
    return false;
  }

  try {
    const sentimentEmoji =
      sentiment > 0.5 ? "😊" : sentiment < -0.5 ? "😞" : "😐";
    const message = `
${sentimentEmoji} **News Alert**

${title}

Sentiment: ${(sentiment * 100).toFixed(0)}%

[Read More](${link})
    `;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
    return true;
  } catch (error) {
    console.error(`[Telegram] Failed to send news alert to ${chatId}:`, error);
    return false;
  }
}

/**
 * Send watchlist alert
 */
export async function sendWatchlistAlert(
  chatId: number,
  ticker: string,
  reason: string
): Promise<boolean> {
  if (!bot) {
    console.warn("[Telegram] Bot not initialized");
    return false;
  }

  try {
    const message = `
⚠️ **Watchlist Alert: ${ticker.toUpperCase()}**

${reason}

Check your dashboard for more details.
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    return true;
  } catch (error) {
    console.error(`[Telegram] Failed to send watchlist alert to ${chatId}:`, error);
    return false;
  }
}

/**
 * Send CAN SLIM score update
 */
export async function sendScoreUpdate(
  chatId: number,
  ticker: string,
  score: number,
  changes: string[]
): Promise<boolean> {
  if (!bot) {
    console.warn("[Telegram] Bot not initialized");
    return false;
  }

  try {
    const scoreEmoji = score > 7 ? "🌟" : score > 5 ? "⭐" : "⚠️";
    const changesList = changes.map((c) => `• ${c}`).join("\n");

    const message = `
${scoreEmoji} **CAN SLIM Score Update: ${ticker.toUpperCase()}**

New Score: ${score.toFixed(1)}/10

Changes:
${changesList}

View full analysis on your dashboard.
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    return true;
  } catch (error) {
    console.error(`[Telegram] Failed to send score update to ${chatId}:`, error);
    return false;
  }
}

/**
 * Get user subscription status
 */
export function getUserSubscription(chatId: number) {
  return userSubscriptions.get(chatId);
}

/**
 * Get all subscribed users
 */
export function getAllSubscribedUsers(): number[] {
  const keys: number[] = [];
  userSubscriptions.forEach((_, key) => {
    keys.push(key);
  });
  return keys;
}

/**
 * Broadcast alert to all subscribed users
 */
export async function broadcastAlert(
  message: string,
  alertType: "price" | "news" | "watchlist" | "score"
): Promise<number> {
  if (!bot) {
    console.warn("[Telegram] Bot not initialized");
    return 0;
  }

  let sentCount = 0;

  userSubscriptions.forEach(async (subscription, chatId) => {
    let shouldSend = false;

    if (alertType === "price" && subscription.priceAlerts) {
      shouldSend = true;
    } else if (alertType === "news" && subscription.newsAlerts) {
      shouldSend = true;
    } else if (alertType === "watchlist" && subscription.watchlistAlerts) {
      shouldSend = true;
    } else if (alertType === "score" && subscription.sentimentAlerts) {
      shouldSend = true;
    }

      if (shouldSend) {
        try {
          await bot!.sendMessage(chatId, message, { parse_mode: "Markdown" });
          sentCount++;
        } catch (error) {
          console.error(`[Telegram] Failed to send broadcast to ${chatId}:`, error);
        }
      }
    });

  return sentCount;
}

/**
 * Stop bot polling
 */
export function stopTelegramBot() {
  if (bot) {
    bot.stopPolling();
    console.log("[Telegram] Bot stopped");
  }
}
