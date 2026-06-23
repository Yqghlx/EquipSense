import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  persistTokenExpiry,
  clearTokenExpiry,
  readRemainingMs,
  TOKEN_EXPIRES_AT_KEY,
  DEFAULT_EXPIRES_IN_SECONDS,
} from '../tokenExpiry';

/**
 * tokenExpiry 持久化辅助测试
 *
 * 核心不变量：存【绝对过期时间戳】而非 expiresIn 时长。
 * 这样页面刷新后，Date.now() 推进多少，readRemainingMs() 就减多少，
 * 剩余时间反映真实令牌寿命。旧版存时长 + 用页面加载时间近似"签发时间"，
 * 刷新后会把已用大半的令牌误判为满额，主动刷新被排到真实过期之后。
 */
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('tokenExpiry', () => {
  describe('persistTokenExpiry', () => {
    it('存入的过期时间戳 = 当前时间 + expiresIn（绝对时间戳，非时长）', () => {
      persistTokenExpiry(900);
      const stored = Number(sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY));
      // 绝对时间戳，而非裸 900（时长）
      expect(stored).toBe(Date.now() + 900 * 1000);
      expect(stored).not.toBe(900);
    });

    it('缺省 expiresIn 时用默认值 900s 兜底', () => {
      persistTokenExpiry();
      const stored = Number(sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY));
      expect(stored).toBe(Date.now() + DEFAULT_EXPIRES_IN_SECONDS * 1000);
    });

    it('非法 expiresIn（负数 / NaN）用默认值兜底，避免写入坏时间戳', () => {
      persistTokenExpiry(-1);
      expect(Number(sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY))).toBe(
        Date.now() + DEFAULT_EXPIRES_IN_SECONDS * 1000,
      );
      persistTokenExpiry(NaN);
      expect(Number(sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY))).toBe(
        Date.now() + DEFAULT_EXPIRES_IN_SECONDS * 1000,
      );
    });
  });

  describe('readRemainingMs（核心不变量）', () => {
    it('持久化后立即读取，剩余时间 ≈ expiresIn', () => {
      persistTokenExpiry(900);
      expect(readRemainingMs()).toBeCloseTo(900 * 1000, -2);
    });

    it('【回归】时间流逝后剩余时间应随真实时间递减，而非恒等于初始 expiresIn', () => {
      // 本次修复的核心：模拟"登录后使用 10 分钟再刷新页面"。
      // 旧版（存时长 + 用 performance.timeOrigin 近似签发时间）刷新后会重新算出 900s，
      // 但真实令牌只剩 300s → 主动刷新被排到真实过期之后，过期到刷新窗口内吃 401。
      persistTokenExpiry(900); // 签发：剩余 900s

      // 推进 600s（模拟使用 10 分钟后页面刷新，timeOrigin 已非签发时刻）
      vi.advanceTimersByTime(600 * 1000);
      const remaining = readRemainingMs();

      // 应只剩 ~300s，证明剩余随真实时间流逝递减
      expect(remaining).toBeGreaterThan(290 * 1000);
      expect(remaining).toBeLessThan(310 * 1000);
    });

    it('已过期返回负数（表示需立即刷新）', () => {
      persistTokenExpiry(60);
      vi.advanceTimersByTime(120 * 1000);
      expect(readRemainingMs()).toBeLessThan(0);
    });

    it('无记录返回 null（首次加载 / 已清空 / 旧版残留）', () => {
      expect(readRemainingMs()).toBeNull();
    });
  });

  describe('clearTokenExpiry', () => {
    it('清除后 readRemainingMs 返回 null', () => {
      persistTokenExpiry(900);
      expect(readRemainingMs()).not.toBeNull();
      clearTokenExpiry();
      expect(readRemainingMs()).toBeNull();
    });
  });
});
