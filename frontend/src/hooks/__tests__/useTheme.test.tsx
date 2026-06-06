import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

/**
 * useTheme Hook 测试
 *
 * 验证主题切换功能的正确性，包括：
 * - 初始状态（localStorage 无值时默认 dark）
 * - toggleTheme 切换为 light
 * - 再次 toggleTheme 切换回 dark
 */

describe('useTheme', () => {
  beforeEach(() => {
    // 每个测试前清空 localStorage
    localStorage.clear();
    // 移除 documentElement 上可能残留的 dark 类名
    document.documentElement.classList.remove('dark');
  });

  it('localStorage 无值时初始状态应为 dark 主题', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    // 验证 dark 类名已添加到 documentElement
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // 验证 localStorage 已保存
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('调用 toggleTheme 应切换为 light', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    // light 主题时不应有 dark 类名
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    // localStorage 应更新
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('再次调用 toggleTheme 应切换回 dark', () => {
    const { result } = renderHook(() => useTheme());

    // 第一次切换：dark -> light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');

    // 第二次切换：light -> dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    // 验证 dark 类名恢复
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // localStorage 应更新为 dark
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
