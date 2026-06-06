import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkOrderForm } from '../WorkOrderForm';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WorkOrderForm', () => {
  // ==========================================================================
  // 渲染测试
  // ==========================================================================

  it('应渲染所有表单字段和操作按钮', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<WorkOrderForm onSubmit={onSubmit} onCancel={onCancel} />);

    // 验证表单字段标签存在
    expect(screen.getByText('workorder.titleField')).toBeInTheDocument();
    expect(screen.getByText('workorder.type')).toBeInTheDocument();
    expect(screen.getByText('workorder.priority')).toBeInTheDocument();
    expect(screen.getByText('workorder.device')).toBeInTheDocument();
    expect(screen.getByText('workorder.description')).toBeInTheDocument();
    expect(screen.getByText('workorder.dueDate')).toBeInTheDocument();

    // 验证操作按钮存在
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
    expect(screen.getByText('common.save')).toBeInTheDocument();
  });

  it('传入 devices 时应在设备下拉框中渲染设备选项', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const devices = [
      { id: 'dev-001', name: '一号水泵' },
      { id: 'dev-002', name: '二号电机' },
    ];

    render(
      <WorkOrderForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        devices={devices}
      />,
    );

    // 点击设备下拉框触发器（第三个 combobox）
    const comboboxes = screen.getAllByRole('combobox');
    // 类型和优先级各一个，设备是第三个
    await user.click(comboboxes[2]);

    // 等待下拉选项出现，验证设备名称可见
    expect(await screen.findByRole('option', { name: '一号水泵' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '二号电机' })).toBeInTheDocument();
  });

  // ==========================================================================
  // 校验测试
  // ==========================================================================

  it('空必填字段提交应显示标题和类型校验错误', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<WorkOrderForm onSubmit={onSubmit} onCancel={onCancel} />);

    // 直接点击提交按钮，不填写任何字段
    await user.click(screen.getByText('common.save'));

    // 验证校验错误消息出现（标题和必填字段）
    await waitFor(() => {
      expect(screen.getByText('workorder.titleRequired')).toBeInTheDocument();
    });

    // onSubmit 不应被调用
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // 提交测试
  // ==========================================================================

  it('填写必填字段并提交应调用 onSubmit 传入正确数据', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const devices = [{ id: 'dev-001', name: '一号水泵' }];

    render(
      <WorkOrderForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        devices={devices}
      />,
    );

    // 填写标题
    const titleInput = screen.getByPlaceholderText('workorder.titlePlaceholder');
    await user.type(titleInput, '更换轴承');

    // 填写描述
    const descriptionTextarea = screen.getByPlaceholderText('workorder.descriptionPlaceholder');
    await user.type(descriptionTextarea, '设备振动异常，需更换轴承');

    // 选择工单类型
    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]); // 类型下拉
    const correctiveOption = await screen.findByRole('option', { name: 'workorder.typeOptions.corrective' });
    await user.click(correctiveOption);

    // 选择优先级
    await user.click(comboboxes[1]); // 优先级下拉
    const highOption = await screen.findByRole('option', { name: 'alert.high' });
    await user.click(highOption);

    // 选择设备
    await user.click(comboboxes[2]); // 设备下拉
    const deviceOption = await screen.findByRole('option', { name: '一号水泵' });
    await user.click(deviceOption);

    // 提交表单
    await user.click(screen.getByText('common.save'));

    // 验证 onSubmit 被调用，且数据正确
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const callArgs = onSubmit.mock.calls[0][0];
    expect(callArgs).toEqual(
      expect.objectContaining({
        title: '更换轴承',
        type: 'corrective',
        priority: 'high',
        deviceId: 'dev-001',
        description: '设备振动异常，需更换轴承',
      }),
    );
  });

  it('未填写描述时提交应将 description 默认为空字符串', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const devices = [{ id: 'dev-001', name: '一号水泵' }];

    render(
      <WorkOrderForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        devices={devices}
      />,
    );

    // 只填写必填字段
    const titleInput = screen.getByPlaceholderText('workorder.titlePlaceholder');
    await user.type(titleInput, '紧急维修');

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]); // 类型
    const typeOption = await screen.findByRole('option', { name: 'workorder.typeOptions.preventive' });
    await user.click(typeOption);

    await user.click(comboboxes[1]); // 优先级
    const priorityOption = await screen.findByRole('option', { name: 'alert.critical' });
    await user.click(priorityOption);

    await user.click(comboboxes[2]); // 设备
    const deviceOption = await screen.findByRole('option', { name: '一号水泵' });
    await user.click(deviceOption);

    await user.click(screen.getByText('common.save'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // description 未填写，应被转为空字符串
    const callArgs = onSubmit.mock.calls[0][0];
    expect(callArgs.description).toBe('');
  });

  // ==========================================================================
  // 取消和加载状态测试
  // ==========================================================================

  it('点击取消按钮应调用 onCancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<WorkOrderForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByText('common.cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    // 提交不应被调用
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('loading=true 时提交按钮应显示加载文本且被禁用', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<WorkOrderForm onSubmit={onSubmit} onCancel={onCancel} loading={true} />);

    // 提交按钮应显示 loading 文本且被禁用
    const submitButton = screen.getByText('common.loading');
    expect(submitButton).toBeDisabled();
  });
});
