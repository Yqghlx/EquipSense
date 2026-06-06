import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '../useOfflineStatus';

/**
 * useOfflineStatus Hook 测试
 *
 * 验证浏览器网络状态监听的正确性，包括：
 * - 初始状态读取 navigator.onLine
 * - offline 事件切换为离线
 * - online 事件恢复在线
 * - isOffline 与 isOnline 的互斥关系
 */

// Mock navigator.onLine 为可控属性
Object.defineProperty(window.navigator, 'onLine', {
  value: true,
  writable: true,
  configurable: true,
});

describe('useOfflineStatus', () => {
  beforeEach(() => {
    // 每个测试前重置为在线状态
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it('初始状态应为在线（navigator.onLine 为 true 时）', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('触发 offline 事件后 isOnline 应为 false', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      // 模拟浏览器离线事件
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('触发 online 事件后 isOnline 应恢复 true', () => {
    const { result } = renderHook(() => useOfflineStatus());

    // 先切换到离线
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    // 再切换回在线
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('isOffline 应与 isOnline 互斥', () => {
    const { result } = renderHook(() => useOfflineStatus());

    // 在线状态：isOnline=true, isOffline=false
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOnline).not.toBe(result.current.isOffline);

    // 触发离线
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // 离线状态：isOnline=false, isOffline=true
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOnline).not.toBe(result.current.isOffline);
  });
});
