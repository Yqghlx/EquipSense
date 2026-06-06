import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeverityBadge } from '../SeverityBadge';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SeverityBadge', () => {
  // ==========================================================================
  // 各严重级别渲染测试
  // ==========================================================================

  it('应渲染 Critical 级别并显示正确的翻译文本', () => {
    render(<SeverityBadge severity="critical" />);

    const badge = screen.getByText('alert.critical');
    expect(badge).toBeInTheDocument();
  });

  it('Critical 级别应应用红色样式类', () => {
    render(<SeverityBadge severity="critical" />);

    const badge = screen.getByText('alert.critical');
    // 验证红色相关的 CSS 类
    expect(badge.className).toContain('bg-red-500/10');
    expect(badge.className).toContain('text-red-500');
    expect(badge.className).toContain('border-red-500/20');
  });

  it('应渲染 High 级别并应用橙色样式类', () => {
    render(<SeverityBadge severity="high" />);

    const badge = screen.getByText('alert.high');
    expect(badge).toBeInTheDocument();
    // 验证橙色相关的 CSS 类
    expect(badge.className).toContain('bg-orange-500/10');
    expect(badge.className).toContain('text-orange-500');
    expect(badge.className).toContain('border-orange-500/20');
  });

  it('应渲染 Normal 级别并应用蓝色样式类', () => {
    render(<SeverityBadge severity="normal" />);

    const badge = screen.getByText('alert.normal');
    expect(badge).toBeInTheDocument();
    // 验证蓝色相关的 CSS 类
    expect(badge.className).toContain('bg-blue-500/10');
    expect(badge.className).toContain('text-blue-500');
    expect(badge.className).toContain('border-blue-500/20');
  });

  it('应渲染 Low 级别并应用灰色样式类', () => {
    render(<SeverityBadge severity="low" />);

    const badge = screen.getByText('alert.low');
    expect(badge).toBeInTheDocument();
    // 验证灰色相关的 CSS 类
    expect(badge.className).toContain('bg-gray-500/10');
    expect(badge.className).toContain('text-gray-500');
    expect(badge.className).toContain('border-gray-500/20');
  });

  it('未知严重级别不应应用任何额外样式类', () => {
    render(<SeverityBadge severity="unknown" />);

    const badge = screen.getByText('alert.unknown');
    expect(badge).toBeInTheDocument();
    // 未知级别在 severityStyles 中不存在，className 应不包含任何颜色类
    expect(badge.className).not.toContain('bg-red');
    expect(badge.className).not.toContain('bg-orange');
    expect(badge.className).not.toContain('bg-blue');
    expect(badge.className).not.toContain('bg-gray');
  });
});
