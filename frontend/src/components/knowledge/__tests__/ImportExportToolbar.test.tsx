import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImportExportToolbar from '../ImportExportToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../hooks/useKnowledge', () => ({
  useExportRules: () => ({ mutate: vi.fn() }),
  useImportPresetRules: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../ImportPreviewDialog', () => ({
  default: () => null,
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
});
