import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from '../usePWA';

/**
 * usePWAInstall Hook 测试
 *
 * 验证 PWA 安装提示功能的正确性，包括：
 * - 初始状态（不可安装、未安装）
 * - beforeinstallprompt 事件触发后可安装
 * - 调用 install 应触发 deferredPrompt.prompt
 */

// jsdom 没有 matchMedia，需要手动定义并 mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('usePWAInstall', () => {
  it('初始状态 isInstallable 应为 false, isInstalled 应为 false', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('触发 beforeinstallprompt 事件后 isInstallable 应为 true', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      // 创建模拟的 BeforeInstallPromptEvent
      const event = new Event('beforeinstallprompt') as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      };
      event.prompt = vi.fn().mockResolvedValue(undefined);
      event.userChoice = Promise.resolve({ outcome: 'accepted' });

      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('调用 install 应触发 deferredPrompt.prompt', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const { result } = renderHook(() => usePWAInstall());

    // 先触发 beforeinstallprompt 以保存 deferredPrompt
    act(() => {
      const event = new Event('beforeinstallprompt') as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      };
      event.prompt = mockPrompt;
      event.userChoice = mockUserChoice;

      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);

    // 调用 install 方法
    await act(async () => {
      await result.current.install();
    });

    // 验证 prompt 被调用
    expect(mockPrompt).toHaveBeenCalledOnce();
  });
});
