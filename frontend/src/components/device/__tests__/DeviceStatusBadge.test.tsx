import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceStatusBadge } from '../DeviceStatusBadge';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeviceStatusBadge', () => {
  // ==========================================================================
  // 各状态渲染测试
  // ==========================================================================

  it('应渲染 online 状态并显示正确的翻译文本', () => {
    render(<DeviceStatusBadge status="online" />);

    const badge = screen.getByText('device.online');
    expect(badge).toBeInTheDocument();
  });

  it('online 状态应应用绿色样式类', () => {
    render(<DeviceStatusBadge status="online" />);

    const badge = screen.getByText('device.online');
    // 验证绿色相关的 CSS 类
    expect(badge.className).toContain('bg-green-500/10');
    expect(badge.className).toContain('text-green-500');
    expect(badge.className).toContain('border-green-500/20');
  });

  it('应渲染 offline 状态并应用灰色样式类', () => {
    render(<DeviceStatusBadge status="offline" />);

    const badge = screen.getByText('device.offline');
    expect(badge).toBeInTheDocument();
    // 验证灰色相关的 CSS 类
    expect(badge.className).toContain('bg-gray-500/10');
    expect(badge.className).toContain('text-gray-500');
    expect(badge.className).toContain('border-gray-500/20');
  });

  it('应渲染 maintenance 状态并应用黄色样式类', () => {
    render(<DeviceStatusBadge status="maintenance" />);

    const badge = screen.getByText('device.maintenance');
    expect(badge).toBeInTheDocument();
    // 验证黄色相关的 CSS 类
    expect(badge.className).toContain('bg-yellow-500/10');
    expect(badge.className).toContain('text-yellow-500');
    expect(badge.className).toContain('border-yellow-500/20');
  });

  it('所有状态徽章都应包含基础 Badge 结构样式类', () => {
    const statuses = ['online', 'offline', 'maintenance'] as const;

    for (const status of statuses) {
      const { unmount } = render(<DeviceStatusBadge status={status} />);

      const badge = screen.getByText(`device.${status}`);
      // 验证基础 Badge 结构类存在
      expect(badge.className).toContain('inline-flex');
      expect(badge.className).toContain('rounded-4xl');
      expect(badge.className).toContain('border');

      unmount();
    }
  });

  it('未知状态不应应用任何额外颜色样式类', () => {
    render(<DeviceStatusBadge status="unknown" />);

    const badge = screen.getByText('device.unknown');
    expect(badge).toBeInTheDocument();
    // 未知状态在 statusStyles 中不存在，不应包含任何已知颜色类
    expect(badge.className).not.toContain('bg-green');
    expect(badge.className).not.toContain('bg-gray-500');
    expect(badge.className).not.toContain('bg-yellow');
  });
});
