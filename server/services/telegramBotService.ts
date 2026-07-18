import axios from 'axios';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: any;
}

interface TelegramAlert {
  chatId: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  confidence: number;
  timestamp: Date;
}

export class TelegramBotService {
  /**
   * Send a text message to a Telegram user
   */
  static async sendMessage(message: TelegramMessage): Promise<any> {
    try {
      const response = await axios.post(
        `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`,
        {
          chat_id: message.chatId,
          text: message.text,
          parse_mode: message.parseMode || 'HTML',
          reply_markup: message.replyMarkup,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send Telegram message: ${String(error)}`);
    }
  }

  /**
   * Send a trading alert to Telegram
   */
  static async sendTradingAlert(alert: TelegramAlert): Promise<any> {
    try {
      const emoji = alert.signal === 'BUY' ? '🟢' : alert.signal === 'SELL' ? '🔴' : '🟡';
      const text = `
${emoji} <b>${alert.signal} Signal</b>

<b>Symbol:</b> ${alert.symbol}
<b>Price:</b> $${alert.price.toFixed(2)}
<b>Confidence:</b> ${(alert.confidence * 100).toFixed(1)}%
<b>Time:</b> ${alert.timestamp.toLocaleString()}
      `.trim();

      return await this.sendMessage({
        chatId: alert.chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send trading alert: ${String(error)}`);
    }
  }

  /**
   * Send portfolio update to Telegram
   */
  static async sendPortfolioUpdate(
    chatId: string,
    portfolioData: {
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
      topGainer: string;
      topGainerPercent: number;
      topLoser: string;
      topLoserPercent: number;
    }
  ): Promise<any> {
    try {
      const dayChangeEmoji = portfolioData.dayChange >= 0 ? '📈' : '📉';
      const text = `
${dayChangeEmoji} <b>Portfolio Update</b>

<b>Total Value:</b> $${portfolioData.totalValue.toLocaleString()}
<b>Day Change:</b> $${portfolioData.dayChange.toFixed(2)} (${portfolioData.dayChangePercent.toFixed(2)}%)

<b>Top Gainer:</b> ${portfolioData.topGainer} +${portfolioData.topGainerPercent.toFixed(2)}%
<b>Top Loser:</b> ${portfolioData.topLoser} ${portfolioData.topLoserPercent.toFixed(2)}%
      `.trim();

      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send portfolio update: ${String(error)}`);
    }
  }

  /**
   * Send backtesting result to Telegram
   */
  static async sendBacktestResult(
    chatId: string,
    result: {
      strategy: string;
      symbol: string;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      profitFactor: number;
      totalReturn: number;
    }
  ): Promise<any> {
    try {
      const text = `
📊 <b>Backtest Result</b>

<b>Strategy:</b> ${result.strategy}
<b>Symbol:</b> ${result.symbol}

<b>Metrics:</b>
• Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}
• Max Drawdown: ${(result.maxDrawdown * 100).toFixed(2)}%
• Win Rate: ${(result.winRate * 100).toFixed(1)}%
• Profit Factor: ${result.profitFactor.toFixed(2)}
• Total Return: ${(result.totalReturn * 100).toFixed(2)}%
      `.trim();

      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send backtest result: ${String(error)}`);
    }
  }

  /**
   * Send sentiment analysis to Telegram
   */
  static async sendSentimentAnalysis(
    chatId: string,
    sentiment: {
      symbol: string;
      overallScore: number;
      sources: {
        twitter: number;
        reddit: number;
        news: number;
        telegram: number;
      };
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    }
  ): Promise<any> {
    try {
      const trendEmoji = sentiment.trend === 'BULLISH' ? '🚀' : sentiment.trend === 'BEARISH' ? '📉' : '➡️';
      const text = `
${trendEmoji} <b>Sentiment Analysis</b>

<b>Symbol:</b> ${sentiment.symbol}
<b>Overall Score:</b> ${(sentiment.overallScore * 100).toFixed(1)}/100
<b>Trend:</b> ${sentiment.trend}

<b>Source Scores:</b>
• Twitter: ${(sentiment.sources.twitter * 100).toFixed(1)}
• Reddit: ${(sentiment.sources.reddit * 100).toFixed(1)}
• News: ${(sentiment.sources.news * 100).toFixed(1)}
• Telegram: ${(sentiment.sources.telegram * 100).toFixed(1)}
      `.trim();

      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send sentiment analysis: ${String(error)}`);
    }
  }

  /**
   * Send price alert to Telegram
   */
  static async sendPriceAlert(
    chatId: string,
    alert: {
      symbol: string;
      currentPrice: number;
      targetPrice: number;
      alertType: 'ABOVE' | 'BELOW';
    }
  ): Promise<any> {
    try {
      const alertEmoji = alert.alertType === 'ABOVE' ? '📈' : '📉';
      const text = `
${alertEmoji} <b>Price Alert</b>

<b>Symbol:</b> ${alert.symbol}
<b>Current Price:</b> $${alert.currentPrice.toFixed(2)}
<b>Target Price:</b> $${alert.targetPrice.toFixed(2)}
<b>Alert Type:</b> ${alert.alertType === 'ABOVE' ? 'Price above target' : 'Price below target'}
      `.trim();

      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send price alert: ${String(error)}`);
    }
  }

  /**
   * Send copy trading update to Telegram
   */
  static async sendCopyTradingUpdate(
    chatId: string,
    update: {
      traderName: string;
      signal: 'BUY' | 'SELL';
      symbol: string;
      entryPrice: number;
      quantity: number;
      stopLoss: number;
      takeProfit: number;
    }
  ): Promise<any> {
    try {
      const signalEmoji = update.signal === 'BUY' ? '🟢' : '🔴';
      const text = `
${signalEmoji} <b>Copy Trading Signal</b>

<b>Trader:</b> ${update.traderName}
<b>Signal:</b> ${update.signal}
<b>Symbol:</b> ${update.symbol}

<b>Details:</b>
• Entry Price: $${update.entryPrice.toFixed(2)}
• Quantity: ${update.quantity}
• Stop Loss: $${update.stopLoss.toFixed(2)}
• Take Profit: $${update.takeProfit.toFixed(2)}
      `.trim();

      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
      });
    } catch (error) {
      throw new Error(`Failed to send copy trading update: ${String(error)}`);
    }
  }

  /**
   * Send inline keyboard message
   */
  static async sendInlineKeyboardMessage(
    chatId: string,
    text: string,
    buttons: Array<Array<{ text: string; callbackData: string }>>
  ): Promise<any> {
    try {
      return await this.sendMessage({
        chatId,
        text,
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: buttons,
        },
      });
    } catch (error) {
      throw new Error(`Failed to send inline keyboard message: ${String(error)}`);
    }
  }

  /**
   * Handle Telegram webhook
   */
  static async handleWebhook(update: any): Promise<void> {
    try {
      if (update.message) {
        const { chat, text } = update.message;
        console.log(`Received message from ${chat.id}: ${text}`);
        // Handle different commands
        if (text === '/start') {
          await this.sendMessage({
            chatId: chat.id.toString(),
            text: 'Welcome to CAN SLIM Crypto Scanner Bot! 🚀',
          });
        } else if (text === '/portfolio') {
          // Send portfolio update
          console.log('Portfolio command received');
        } else if (text === '/alerts') {
          // Send active alerts
          console.log('Alerts command received');
        }
      }
    } catch (error) {
      throw new Error(`Failed to handle webhook: ${String(error)}`);
    }
  }

  /**
   * Register webhook
   */
  static async registerWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await axios.post(
        `${TELEGRAM_API_URL}${BOT_TOKEN}/setWebhook`,
        {
          url: webhookUrl,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to register webhook: ${String(error)}`);
    }
  }

  /**
   * Get webhook info
   */
  static async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${TELEGRAM_API_URL}${BOT_TOKEN}/getWebhookInfo`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get webhook info: ${String(error)}`);
    }
  }
}
