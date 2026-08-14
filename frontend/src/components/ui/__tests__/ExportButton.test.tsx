import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExportButton from '../ExportButton';

const mockedToastError = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: { error: mockedToastError },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExportButton', () => {
  it('导出进行中只允许一个请求并在失败后恢复按钮', async () => {
    let rejectExport!: (reason?: unknown) => void;
    const onExport = vi.fn(() => new Promise<void>((_, reject) => {
      rejectExport = reject;
    }));

    render(
      <ExportButton
        onExport={onExport}
        label="导出"
        exportingLabel="导出中"
        errorMessage="导出失败"
      />,
    );

    const button = screen.getByRole('button', { name: '导出' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('导出中');

    rejectExport(new Error('network unavailable'));
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith('导出失败');
      expect(button).toBeEnabled();
      expect(button).toHaveAttribute('aria-busy', 'false');
      expect(button).toHaveTextContent('导出');
    });
  });

  it('成功完成后不显示错误提示并恢复按钮', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(
      <ExportButton
        onExport={onExport}
        label="导出"
        exportingLabel="导出中"
        errorMessage="导出失败"
      />,
    );

    const button = screen.getByRole('button', { name: '导出' });
    await user.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it('外部禁用条件阻止导出请求', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(
      <ExportButton
        onExport={onExport}
        label="导出"
        exportingLabel="导出中"
        errorMessage="导出失败"
        disabled
      />,
    );

    const button = screen.getByRole('button', { name: '导出' });
    await user.click(button);

    expect(onExport).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
