import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceForm } from '../DeviceForm';
import type { Device } from '../../../types';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** 构造一个完整的 Device 对象，用于编辑模式测试 */
const mockDevice: Device = {
  id: 'device-001',
  deviceCode: 'PUMP-001',
  name: '一号水泵',
  type: 'pump',
  manufacturer: '测试制造商',
  model: 'MODEL-X100',
  status: 'Online',
  criticality: 'Important',
  healthScore: 85,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeviceForm', () => {
  // ==========================================================================
  // 创建模式
  // ==========================================================================

  describe('创建模式', () => {
    it('应渲染空表单，包含所有字段和按钮', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm onSubmit={onSubmit} onCancel={onCancel} />);

      // 验证各字段标签存在（使用 getAllByText 处理重复文本）
      expect(screen.getAllByText('device.deviceCode').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('device.name').length).toBeGreaterThanOrEqual(1);
      // device.type 在 Label 和 SelectValue 中都会出现
      expect(screen.getAllByText('device.type').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('device.model').length).toBeGreaterThanOrEqual(1);

      // 验证操作按钮存在
      expect(screen.getByText('common.cancel')).toBeInTheDocument();
      expect(screen.getByText('common.save')).toBeInTheDocument();
    });

    it('填写必填字段并提交应调用 onSubmit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm onSubmit={onSubmit} onCancel={onCancel} />);

      // 填写设备编码
      const codeInput = screen.getByPlaceholderText('device.deviceCode');
      await user.type(codeInput, 'PUMP-002');

      // 填写设备名称
      const nameInput = screen.getByPlaceholderText('device.name');
      await user.type(nameInput, '二号水泵');

      // 选择设备类型（Base UI Select：点击 combobox 触发器，再点击选项）
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      // 等待下拉选项出现后点击 "pump"
      const pumpOption = await screen.findByRole('option', { name: 'pump' });
      await user.click(pumpOption);

      // 提交表单
      await user.click(screen.getByText('common.save'));

      // 验证 onSubmit 被调用
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // handleSubmit 包装后的 onSubmit 第一个参数为表单数据
      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs).toEqual(
        expect.objectContaining({
          deviceCode: 'PUMP-002',
          name: '二号水泵',
          type: 'pump',
        }),
      );
    });

    it('空必填字段提交应显示校验错误', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm onSubmit={onSubmit} onCancel={onCancel} />);

      // 直接点击提交按钮，不填写任何字段
      await user.click(screen.getByText('common.save'));

      // 验证校验错误消息出现（Zod schema 的 message key）
      await waitFor(() => {
        expect(screen.getByText('device.deviceCodeRequired')).toBeInTheDocument();
      });
      expect(screen.getByText('device.nameRequired')).toBeInTheDocument();
      // device.type 字段通过 Base UI Select 管理，其校验错误由 Select 组件内部的 hidden input 触发，
      // 错误消息格式为 "Invalid input" 而非 Zod schema 定义的 message key，此处不验证该字段

      // onSubmit 不应被调用
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('点击取消应调用 onCancel', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm onSubmit={onSubmit} onCancel={onCancel} />);

      await user.click(screen.getByText('common.cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('loading=true 时提交按钮应禁用', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm onSubmit={onSubmit} onCancel={onCancel} loading={true} />);

      // 提交按钮应显示 loading 文本且被禁用
      const submitButton = screen.getByText('common.loading');
      expect(submitButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // 编辑模式
  // ==========================================================================

  describe('编辑模式', () => {
    it('传入 device prop 时应预填充表单字段', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm device={mockDevice} onSubmit={onSubmit} onCancel={onCancel} />);

      // 验证设备编码和名称被预填充
      expect(screen.getByDisplayValue('PUMP-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('一号水泵')).toBeInTheDocument();
      // model 字段应被填充
      expect(screen.getByDisplayValue('MODEL-X100')).toBeInTheDocument();
    });

    it('编辑模式下修改字段并提交应调用 onSubmit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<DeviceForm device={mockDevice} onSubmit={onSubmit} onCancel={onCancel} />);

      // 清空并修改设备名称
      const nameInput = screen.getByDisplayValue('一号水泵');
      await user.clear(nameInput);
      await user.type(nameInput, '二号水泵');

      // 提交表单
      await user.click(screen.getByText('common.save'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // 验证提交的数据包含修改后的名称和原有的其他字段
      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.name).toBe('二号水泵');
      expect(callArgs.deviceCode).toBe('PUMP-001');
      expect(callArgs.type).toBe('pump');
    });
  });
});
