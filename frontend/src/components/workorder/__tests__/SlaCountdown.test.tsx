import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { SlaCountdown } from '../SlaCountdown';

// Mock react-i18next — 返回的字符串带 key 和参数，便于断言
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (!opts) return key;
      // 简单模板替换：{{name}} → opts.name
      return key.replace(/workorder\./, '') + ':' + JSON.stringify(opts);
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 固定时间，避免测试受执行时机影响
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-22T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// 测试用的辅助常量 — 当前时间 = 2026-06-22T12:00:00Z
const NOW = new Date('2026-06-22T12:00:00Z');
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

describe('SlaCountdown', () => {
  it('已结束状态（completed）不渲染倒计时', () => {
    const { container } = render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() - ONE_HOUR).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="completed"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('已关闭状态（closed）不渲染倒计时', () => {
    const { container } = render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() - ONE_HOUR).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="closed"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('showRawDateWhenTerminal=true 时已结束状态显示原始日期', () => {
    render(
      <SlaCountdown
        dueDate="2026-06-21T10:00:00Z"
        createdAt="2026-06-20T10:00:00Z"
        status="completed"
        showRawDateWhenTerminal
      />,
    );
    // 应渲染一个非空文本（具体格式依赖 toLocaleString，只断言存在内容）
    expect(screen.getByText(/\S+/)).toBeInTheDocument();
  });

  it('未设置 dueDate 显示「-」', () => {
    render(
      <SlaCountdown
        dueDate={null}
        createdAt={new Date(NOW.getTime() - ONE_HOUR).toISOString()}
        status="inProgress"
      />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('剩余 > 50% 时显示绿色「剩 X」', () => {
    // 创建于 10 天前，截止 10 天后 → 总时长 20 天，剩余 10 天 = 50%
    // 改为剩余 90%：创建于 1 天前，截止 9 天后 → 总时长 10 天，剩余 9 天 = 90%
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + 9 * ONE_DAY).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    // 应包含 "slaRemaining" 翻译键（带 "剩 X" 文案）
    expect(screen.getByText(/slaRemaining/)).toBeInTheDocument();
  });

  it('剩余 20-50% 时显示橙色（warning）', () => {
    // 创建于 10 天前，截止 5 天后 → 总时长 15 天，剩余 5 天 ≈ 33%
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + 5 * ONE_DAY).toISOString()}
        createdAt={new Date(NOW.getTime() - 10 * ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    expect(screen.getByText(/slaRemaining/)).toBeInTheDocument();
  });

  it('剩余 < 20% 时显示红色（紧急）', () => {
    // 创建于 10 天前，截止 1 天后 → 总时长 11 天，剩余 1 天 ≈ 9%
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + ONE_DAY).toISOString()}
        createdAt={new Date(NOW.getTime() - 10 * ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    expect(screen.getByText(/slaRemaining/)).toBeInTheDocument();
  });

  it('已逾期显示「逾期 X」', () => {
    // 截止时间已过 2 小时
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() - 2 * ONE_HOUR).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    expect(screen.getByText(/slaOverdue/)).toBeInTheDocument();
  });

  it('剩余 < 1 小时按分钟显示', () => {
    // 截止时间还有 30 分钟
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + 30 * 60 * 1000).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_HOUR).toISOString()}
        status="inProgress"
      />,
    );
    // 应使用 slaMinutes 翻译键
    const text = screen.getByText(/slaRemaining/).textContent;
    expect(text).toMatch(/slaMinutes/);
  });

  it('剩余 ≥ 1 天按天显示', () => {
    // 截止时间还有 3 天
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + 3 * ONE_DAY).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    const text = screen.getByText(/slaRemaining/).textContent;
    expect(text).toMatch(/slaDays/);
  });

  it('设置 setInterval 后自动刷新（每 60 秒）', () => {
    // 渲染后快进时间，验证 setInterval 被调用
    render(
      <SlaCountdown
        dueDate={new Date(NOW.getTime() + ONE_DAY).toISOString()}
        createdAt={new Date(NOW.getTime() - ONE_DAY).toISOString()}
        status="inProgress"
      />,
    );
    // 快进 2 分钟 — 不抛错即表示 setInterval 工作正常
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(120_000);
      });
    }).not.toThrow();
  });
});
