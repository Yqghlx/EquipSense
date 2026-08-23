import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { AlertDetailDrawer } from '../AlertDetailDrawer';
import type { Alert } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-001',
    alertCode: 'ALM-001',
    deviceId: 'device-001',
    deviceName: '一号水泵',
    severity: 'Critical',
    metric: 'temperature',
    value: 95,
    status: 'Active',
    occurredAt: '2026-08-14T08:00:00Z',
    triggerCount: 1,
    acknowledged: false,
    resolved: false,
    createdAt: '2026-08-14T08:00:00Z',
    ...overrides,
  };
}

describe('AlertDetailDrawer', () => {
  it('后端 Active 状态应显示确认和解决按钮', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    const onResolve = vi.fn();
    const onClose = vi.fn();
    render(
      <AlertDetailDrawer
        alert={makeAlert({ status: 'Active' })}
        open
        onClose={onClose}
        onAcknowledge={onAcknowledge}
        onResolve={onResolve}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'alert.acknowledge' }));
    await user.click(screen.getByRole('button', { name: 'alert.resolve' }));
    expect(onAcknowledge).toHaveBeenCalledWith('alert-001');
    expect(onResolve).toHaveBeenCalledWith('alert-001');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('Acknowledged 状态只显示解决按钮', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(
      <AlertDetailDrawer
        alert={makeAlert({ status: 'Acknowledged', acknowledged: true })}
        open
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={onResolve}
      />,
    );

    expect(screen.queryByRole('button', { name: 'alert.acknowledge' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'alert.resolve' }));
    expect(onResolve).toHaveBeenCalledWith('alert-001');
  });

  it('Resolved 状态不应显示确认或解决按钮', () => {
    render(
      <AlertDetailDrawer
        alert={makeAlert({ status: 'Resolved', resolved: true })}
        open
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'alert.acknowledge' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'alert.resolve' })).not.toBeInTheDocument();
  });

  it('请求进行中应禁用操作按钮并显示忙碌文案', () => {
    render(
      <AlertDetailDrawer
        alert={makeAlert({ status: 'Active' })}
        open
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
        actionPending
      />,
    );

    expect(screen.getByRole('button', { name: 'alert.acknowledging' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'alert.resolving' })).toBeDisabled();
  });

  it('应解析告警快照并忽略非法 JSON', () => {
    const { rerender } = render(
      <AlertDetailDrawer
        alert={makeAlert({ dataSnapshot: '{"temperature":91.2,"ok":true}' })}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('alert.dataSnapshot')).toBeInTheDocument();
    expect(screen.getAllByText('temperature').length).toBeGreaterThan(0);
    expect(screen.getByText('91.2')).toBeInTheDocument();

    rerender(
      <AlertDetailDrawer
        alert={makeAlert({ dataSnapshot: '{not-json' })}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('alert.dataSnapshot')).not.toBeInTheDocument();
  });

  it('已确认或已解决时应展示对应时间而不是复用触发时间标签', () => {
    render(
      <AlertDetailDrawer
        alert={makeAlert({
          acknowledged: true,
          resolved: true,
          occurredAt: '2026-08-14T08:00:00Z',
          acknowledgedAt: '2026-08-14T08:10:00Z',
          resolvedAt: '2026-08-14T09:00:00Z',
        })}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('alert.triggeredAt')).toBeInTheDocument();
    expect(screen.getByText('alert.acknowledgedAt')).toBeInTheDocument();
    expect(screen.getByText('alert.resolvedAt')).toBeInTheDocument();
    expect(screen.getAllByText('alert.triggeredAt')).toHaveLength(1);
  });

  it('没有确认或解决时间时不应伪造时间线', () => {
    render(
      <AlertDetailDrawer
        alert={makeAlert({ status: 'Acknowledged', acknowledged: true, resolved: false })}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('alert.triggeredAt')).toBeInTheDocument();
    expect(screen.queryByText('alert.acknowledgedAt')).not.toBeInTheDocument();
    expect(screen.queryByText('alert.resolvedAt')).not.toBeInTheDocument();
  });

  it('alert 为空时不渲染抽屉内容', () => {
    const { container } = render(
      <AlertDetailDrawer alert={null} open onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
