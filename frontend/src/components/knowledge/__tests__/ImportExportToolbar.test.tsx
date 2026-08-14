import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ImportExportToolbar from '../ImportExportToolbar';

const { mockExport, mockPreset } = vi.hoisted(() => ({
  mockExport: vi.fn(),
  mockPreset: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../hooks/useKnowledge', () => ({
  useExportRules: () => ({ mutate: mockExport }),
  useImportPresetRules: () => ({ mutate: mockPreset, isPending: false }),
}));

vi.mock('../ImportPreviewDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    open ? <button type="button" onClick={onClose}>Close preview</button> : null
  ),
}));

describe('ImportExportToolbar', () => {
  it('导出触发器应直接渲染为单个按钮，不能嵌套 button', () => {
    render(<ImportExportToolbar />);

    const exportButton = screen.getByRole('button', {
      name: 'knowledge.importExport.export',
    });

    expect(exportButton.querySelector('button')).toBeNull();
    expect(document.querySelector('button button')).toBeNull();
  });

  it('应支持导出 CSV/JSON、导入行业预置规则和文件预览关闭', async () => {
    const user = userEvent.setup();
    render(<ImportExportToolbar />);

    const exportTrigger = screen.getByRole('button', { name: 'knowledge.importExport.export' });
    exportTrigger.focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByText('knowledge.importExport.exportCSV'));
    expect(mockExport).toHaveBeenCalledWith({ format: 'csv' });

    await user.keyboard('{Enter}');
    await user.click(screen.getByText('knowledge.importExport.exportJSON'));
    expect(mockExport).toHaveBeenCalledWith({ format: 'json' });

    await user.click(screen.getByRole('button', { name: 'knowledge.importPreset' }));
    expect(mockPreset).toHaveBeenCalledTimes(1);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"name":"rule"}'], 'rules.json', { type: 'application/json' });
    await user.upload(input, file);
    expect(screen.getByRole('button', { name: 'Close preview' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('button', { name: 'Close preview' })).not.toBeInTheDocument();
  });
});
