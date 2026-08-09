import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from '../StatusTimeline';
import type { WorkOrderLog } from '../../../types';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

/** 构造工单流转日志的工厂函数 */
function createLog(overrides: Partial<WorkOrderLog> = {}): WorkOrderLog {
  return {
    id: 'log-001',
    workOrderId: 'wo-001',
    action: 'created',
    oldStatus: undefined,
    newStatus: 'PendingDispatch',
    operatorId: 'user-001',
    note: undefined,
    createdAt: '2026-01-15T08:00:00Z',
    ...overrides,
  };
}

describe('StatusTimeline', () => {
  // ==========================================================================
  // 空状态
  // ==========================================================================

  it('日志列表为空时应显示空状态提示', () => {
    render(<StatusTimeline logs={[]} />);

    expect(screen.getByText('workorder.noOperationRecords')).toBeInTheDocument();
  });

  // ==========================================================================
  // 日志渲染
  // ==========================================================================

  it('应渲染每条日志的操作类型标签', () => {
    const logs = [
      createLog({ id: 'log-001', action: 'created' }),
      createLog({ id: 'log-002', action: 'assigned' }),
      createLog({ id: 'log-003', action: 'completed' }),
    ];

    render(<StatusTimeline logs={logs} />);

    // 验证操作类型翻译键被渲染
    expect(screen.getByText('workorder.action.created')).toBeInTheDocument();
    expect(screen.getByText('workorder.action.assigned')).toBeInTheDocument();
    expect(screen.getByText('workorder.action.completed')).toBeInTheDocument();
  });

  it('未知操作类型应直接显示原始 action 值', () => {
    const logs = [
      createLog({ id: 'log-001', action: 'custom_action' }),
    ];

    render(<StatusTimeline logs={logs} />);

    // 未在 actionLabelKeys 中的操作类型应直接显示原始值
    expect(screen.getByText('custom_action')).toBeInTheDocument();
  });

  it('应正确渲染时间戳', () => {
    const testDate = '2026-03-20T14:30:00Z';
    const logs = [
      createLog({ id: 'log-001', createdAt: testDate }),
    ];

    render(<StatusTimeline logs={logs} />);

    // 验证时间被格式化显示（toLocaleString 的具体格式取决于环境，此处验证包含时间数字）
    const expectedStr = new Date(testDate).toLocaleString();
    expect(screen.getByText(expectedStr)).toBeInTheDocument();
  });

  it('存在状态变化时应显示旧状态到新状态的转换', () => {
    const logs = [
      createLog({
        id: 'log-001',
        oldStatus: 'PendingDispatch',
        newStatus: 'Assigned',
      }),
    ];

    render(<StatusTimeline logs={logs} />);

    // 状态枚举必须先本地化，再按“旧状态 → 新状态”展示。
    expect(screen.getByText('workorder.status.pendingDispatch → workorder.status.assigned')).toBeInTheDocument();
  });

  it('只有新状态无旧状态时应只显示新状态', () => {
    const logs = [
      createLog({
        id: 'log-001',
        oldStatus: undefined,
        newStatus: 'PendingDispatch',
      }),
    ];

    render(<StatusTimeline logs={logs} />);

    // 不应包含箭头，直接显示本地化后的新状态。
    expect(screen.getByText('workorder.status.pendingDispatch')).toBeInTheDocument();
    // 不应包含箭头符号
    const elements = screen.queryAllByText(/→/);
    expect(elements).toHaveLength(0);
  });

  it('存在备注时应显示备注内容', () => {
    const logs = [
      createLog({
        id: 'log-001',
        note: '指派给张三进行维修',
      }),
    ];

    render(<StatusTimeline logs={logs} />);

    expect(screen.getByText('指派给张三进行维修')).toBeInTheDocument();
  });

  it('应把后端 PascalCase 动作和状态转换为本地化标签', () => {
    const logs = [
      createLog({
        action: 'StatusChanged',
        oldStatus: 'Assigned',
        newStatus: 'InProgress',
      }),
    ];

    render(<StatusTimeline logs={logs} />);

    expect(screen.getByText('workorder.action.statusChanged')).toBeInTheDocument();
    expect(screen.getByText('workorder.status.assigned → workorder.status.inProgress')).toBeInTheDocument();
  });
});
