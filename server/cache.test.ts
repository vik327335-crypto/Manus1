import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheService, cacheKeys } from './cache';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('set and get', () => {
    it('should set and retrieve data from cache', () => {
      const testData = { value: 'test', number: 42 };
      cacheService.set('test-key', testData);

      const retrieved = cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired data', async () => {
      cacheService.set('expiring-key', { data: 'test' }, 1); // 1 second TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = cacheService.get('expiring-key');
      expect(result).toBeNull();
    });

    it('should use default TTL of 300 seconds', () => {
      const testData = { value: 'test' };
      cacheService.set('default-ttl', testData);

      const result = cacheService.get('default-ttl');
      expect(result).toEqual(testData);
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cacheService.set('exists', { data: 'test' });
      expect(cacheService.has('exists')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cacheService.has('does-not-exist')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cacheService.set('will-expire', { data: 'test' }, 1);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(cacheService.has('will-expire')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cacheService.set('to-delete', { data: 'test' });
      expect(cacheService.has('to-delete')).toBe(true);

      const deleted = cacheService.delete('to-delete');
      expect(deleted).toBe(true);
      expect(cacheService.has('to-delete')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheService.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheService.set('key1', { data: 1 });
      cacheService.set('key2', { data: 2 });
      cacheService.set('key3', { data: 3 });

      expect(cacheService.size()).toBe(3);

      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('size and keys', () => {
    it('should return correct cache size', () => {
      expect(cacheService.size()).toBe(0);

      cacheService.set('key1', { data: 1 });
      expect(cacheService.size()).toBe(1);

      cacheService.set('key2', { data: 2 });
      expect(cacheService.size()).toBe(2);
    });

    it('should return all cache keys', () => {
      cacheService.set('key1', { data: 1 });
      cacheService.set('key2', { data: 2 });
      cacheService.set('key3', { data: 3 });

      const keys = cacheService.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });
  });

  describe('cache key generators', () => {
    it('should generate strategy metrics cache key', () => {
      const key = cacheKeys.strategyMetrics(1, 'Strategy A');
      expect(key).toBe('metrics:1:Strategy A');
    });

    it('should generate all metrics cache key', () => {
      const key = cacheKeys.allMetrics(1);
      expect(key).toBe('metrics:all:1');
    });

    it('should generate strategy comparison cache key', () => {
      const key = cacheKeys.strategyComparison(1, ['Strategy B', 'Strategy A']);
      expect(key).toContain('comparison:1:');
      expect(key).toContain('Strategy A');
      expect(key).toContain('Strategy B');
    });

    it('should generate strategy trend cache key', () => {
      const key = cacheKeys.strategyTrend(1, 'Strategy A', 'week');
      expect(key).toBe('trend:1:Strategy A:week');
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple sets and gets', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        key: `key-${i}`,
        value: `value-${i}`,
      }));

      // Set all
      data.forEach(({ key, value }) => {
        cacheService.set(key, { data: value });
      });

      expect(cacheService.size()).toBe(100);

      // Get all
      data.forEach(({ key, value }) => {
        const cached = cacheService.get(key);
        expect(cached).toEqual({ data: value });
      });
    });

    it('should handle mixed operations', () => {
      cacheService.set('key1', { data: 1 });
      cacheService.set('key2', { data: 2 });

      expect(cacheService.get('key1')).toEqual({ data: 1 });
      expect(cacheService.has('key2')).toBe(true);

      cacheService.delete('key1');
      expect(cacheService.has('key1')).toBe(false);

      cacheService.set('key3', { data: 3 });
      expect(cacheService.size()).toBe(2);
    });
  });

  describe('data types', () => {
    it('should cache objects', () => {
      const obj = { a: 1, b: 'test', c: [1, 2, 3] };
      cacheService.set('obj', obj);
      expect(cacheService.get('obj')).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arr = [1, 'test', { nested: true }];
      cacheService.set('arr', arr);
      expect(cacheService.get('arr')).toEqual(arr);
    });

    it('should cache primitives', () => {
      cacheService.set('string', 'test-string');
      cacheService.set('number', 42);
      cacheService.set('boolean', true);

      expect(cacheService.get('string')).toBe('test-string');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('boolean')).toBe(true);
    });

    it('should cache null and undefined', () => {
      cacheService.set('null', null);
      cacheService.set('undefined', undefined);

      expect(cacheService.get('null')).toBeNull();
      expect(cacheService.get('undefined')).toBeUndefined();
    });
  });
});
