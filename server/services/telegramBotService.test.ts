import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramBotService } from './telegramBotService';

describe('TelegramBotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a Telegram user', async () => {
      const result = await TelegramBotService.registerUser('user123', 'chat456', 'john_doe', 'John');

      expect(result).toEqual({
        userId: 'user123',
        chatId: 'chat456',
        username: 'john_doe',
        firstName: 'John',
        isActive: true,
      });
    });

    it('should register user without optional fields', async () => {
      const result = await TelegramBotService.registerUser('user123', 'chat456');

      expect(result).toEqual({
        userId: 'user123',
        chatId: 'chat456',
        username: undefined,
        firstName: undefined,
        isActive: true,
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message to Telegram', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 123 } }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendMessage('chat123', 'Hello World');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ ok: true, result: { message_id: 123 } });
    });

    it('should handle send message errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await expect(TelegramBotService.sendMessage('chat123', 'Hello')).rejects.toThrow(
        'Failed to send Telegram message'
      );
    });
  });

  describe('sendAlertNotification', () => {
    it('should send price alert notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendAlertNotification(
        'chat123',
        'ABOVE',
        'BTC',
        45000,
        50000
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendTradingSignal', () => {
    it('should send BUY signal', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendTradingSignal(
        'chat123',
        'ETH',
        'BUY',
        85.5,
        2500,
        2800
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should send SELL signal', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendTradingSignal(
        'chat123',
        'BTC',
        'SELL',
        75.2,
        45000,
        40000
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendPortfolioUpdate', () => {
    it('should send portfolio update with positive change', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendPortfolioUpdate(
        'chat123',
        10000,
        500,
        5.0
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should send portfolio update with negative change', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendPortfolioUpdate(
        'chat123',
        10000,
        -300,
        -3.0
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendBacktestCompletion', () => {
    it('should send backtest completion notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendBacktestCompletion(
        'chat123',
        'SMA Strategy',
        65.5,
        2.1,
        1.5
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendSentimentUpdate', () => {
    it('should send bullish sentiment update', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendSentimentUpdate(
        'chat123',
        'BTC',
        0.75,
        'UPTREND',
        15
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should send bearish sentiment update', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendSentimentUpdate(
        'chat123',
        'ETH',
        -0.6,
        'DOWNTREND',
        12
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendNFTAlert', () => {
    it('should send NFT price alert', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendNFTAlert(
        'chat123',
        'Bored Ape #1234',
        'Bored Ape Yacht Club',
        15.5,
        85000
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendCopyTradingUpdate', () => {
    it('should send copy trading BUY update', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendCopyTradingUpdate(
        'chat123',
        'Top Trader',
        'BUY',
        'BTC',
        0.5,
        45000
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should send copy trading SELL update', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendCopyTradingUpdate(
        'chat123',
        'Top Trader',
        'SELL',
        'ETH',
        2.0,
        2500
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendDeFiNotification', () => {
    it('should send DeFi transaction notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.sendDeFiNotification(
        'chat123',
        'Uniswap',
        'Swap ETH to USDC',
        1.5,
        'ETH'
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('sendBatchMessages', () => {
    it('should send multiple messages', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const messages = [
        { chatId: 'chat1', text: 'Message 1' },
        { chatId: 'chat2', text: 'Message 2' },
        { chatId: 'chat3', text: 'Message 3' },
      ];

      const results = await TelegramBotService.sendBatchMessages(messages);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.ok === true)).toBe(true);
    });
  });

  describe('getBotInfo', () => {
    it('should get bot information', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          ok: true,
          result: {
            id: 123456,
            is_bot: true,
            first_name: 'CryptoBot',
            username: 'crypto_scanner_bot',
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await TelegramBotService.getBotInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/getMe')
      );
      expect(result.ok).toBe(true);
      expect(result.result.username).toBe('crypto_scanner_bot');
    });

    it('should handle get bot info errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await expect(TelegramBotService.getBotInfo()).rejects.toThrow(
        'Failed to get bot info'
      );
    });
  });
});
