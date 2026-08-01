/**
 * Telegram Bot Service
 * Manages Telegram bot notifications and interactions
 */

export interface TelegramUser {
  userId: string;
  chatId: string;
  username?: string;
  firstName?: string;
  isActive: boolean;
}

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: Record<string, any>;
}

export class TelegramBotService {
  private static readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  private static readonly API_URL = 'https://api.telegram.org/bot';

  /**
   * Send message to Telegram user
   */
  static async sendMessage(chatId: string, text: string, parseMode: string = 'HTML'): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}${this.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to send Telegram message: ${String(error)}`);
    }
  }

  /**
   * Send alert notification
   */
  static async sendAlertNotification(
    chatId: string,
    alertType: string,
    symbol: string,
    price: number,
    threshold: number
  ): Promise<any> {
    const message = `
🚨 <b>Price Alert</b>
Symbol: <code>${symbol}</code>
Current Price: $${price.toFixed(2)}
Alert Threshold: $${threshold.toFixed(2)}
Type: <b>${alertType}</b>
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send trading signal notification
   */
  static async sendTradingSignal(
    chatId: string,
    symbol: string,
    signal: 'BUY' | 'SELL' | 'HOLD',
    confidence: number,
    entryPrice: number,
    targetPrice: number
  ): Promise<any> {
    const signalEmoji = signal === 'BUY' ? '📈' : signal === 'SELL' ? '📉' : '⏸️';
    const message = `
${signalEmoji} <b>Trading Signal</b>
Symbol: <code>${symbol}</code>
Signal: <b>${signal}</b>
Confidence: ${confidence.toFixed(1)}%
Entry Price: $${entryPrice.toFixed(2)}
Target Price: $${targetPrice.toFixed(2)}
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send portfolio update
   */
  static async sendPortfolioUpdate(
    chatId: string,
    totalValue: number,
    dayChange: number,
    dayChangePercent: number
  ): Promise<any> {
    const changeEmoji = dayChange >= 0 ? '📈' : '📉';
    const message = `
${changeEmoji} <b>Portfolio Update</b>
Total Value: <b>$${totalValue.toFixed(2)}</b>
24h Change: <b>${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} (${dayChangePercent.toFixed(2)}%)</b>
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send backtest completion notification
   */
  static async sendBacktestCompletion(
    chatId: string,
    strategyName: string,
    winRate: number,
    profitFactor: number,
    sharpeRatio: number
  ): Promise<any> {
    const message = `
✅ <b>Backtest Completed</b>
Strategy: <code>${strategyName}</code>
Win Rate: ${winRate.toFixed(2)}%
Profit Factor: ${profitFactor.toFixed(2)}
Sharpe Ratio: ${sharpeRatio.toFixed(2)}
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send sentiment analysis update
   */
  static async sendSentimentUpdate(
    chatId: string,
    symbol: string,
    sentiment: number,
    trend: string,
    sources: number
  ): Promise<any> {
    const sentimentLabel = sentiment > 0.5 ? 'BULLISH' : sentiment < -0.5 ? 'BEARISH' : 'NEUTRAL';
    const sentimentEmoji = sentiment > 0.5 ? '🟢' : sentiment < -0.5 ? '🔴' : '🟡';
    const message = `
${sentimentEmoji} <b>Sentiment Analysis</b>
Symbol: <code>${symbol}</code>
Sentiment: <b>${sentimentLabel}</b>
Score: ${(sentiment * 100).toFixed(1)}
Trend: ${trend}
Sources Analyzed: ${sources}
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send NFT portfolio alert
   */
  static async sendNFTAlert(
    chatId: string,
    nftName: string,
    collection: string,
    priceChange: number,
    currentPrice: number
  ): Promise<any> {
    const changeEmoji = priceChange >= 0 ? '📈' : '📉';
    const message = `
${changeEmoji} <b>NFT Price Alert</b>
NFT: <code>${nftName}</code>
Collection: ${collection}
Current Price: $${currentPrice.toFixed(2)}
24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send copy trading update
   */
  static async sendCopyTradingUpdate(
    chatId: string,
    traderName: string,
    action: 'BUY' | 'SELL',
    symbol: string,
    quantity: number,
    price: number
  ): Promise<any> {
    const actionEmoji = action === 'BUY' ? '🟢' : '🔴';
    const message = `
${actionEmoji} <b>Copy Trading Update</b>
Trader: <code>${traderName}</code>
Action: <b>${action}</b>
Symbol: <code>${symbol}</code>
Quantity: ${quantity}
Price: $${price.toFixed(2)}
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send DeFi transaction notification
   */
  static async sendDeFiNotification(
    chatId: string,
    protocol: string,
    action: string,
    amount: number,
    token: string
  ): Promise<any> {
    const message = `
🔄 <b>DeFi Transaction</b>
Protocol: <code>${protocol}</code>
Action: ${action}
Amount: ${amount} ${token}
Time: ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Register Telegram user
   */
  static async registerUser(userId: string, chatId: string, username?: string, firstName?: string): Promise<TelegramUser> {
    return {
      userId,
      chatId,
      username,
      firstName,
      isActive: true,
    };
  }

  /**
   * Send batch messages
   */
  static async sendBatchMessages(messages: TelegramMessage[]): Promise<any[]> {
    return Promise.all(
      messages.map((msg) =>
        this.sendMessage(msg.chatId, msg.text, msg.parseMode || 'HTML')
      )
    );
  }

  /**
   * Get bot info
   */
  static async getBotInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}${this.BOT_TOKEN}/getMe`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get bot info: ${String(error)}`);
    }
  }
}

export default TelegramBotService;
