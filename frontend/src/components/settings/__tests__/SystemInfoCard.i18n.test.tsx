import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemInfoCard } from '../SystemInfoCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'settings.systemInfo': 'System Information',
        'settings.version': 'Version',
        'settings.environment': 'Environment',
        'settings.uptime': 'Uptime',
        'settings.uptimeUnits.day': '{{count}}d',
        'settings.uptimeUnits.hour': '{{count}}h',
        'settings.uptimeUnits.minute': '{{count}}m',
        'settings.uptimeUnits.second': '{{count}}s',
      };

      return (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) => (
        String(options?.[name] ?? `{{${name}}}`)
      ));
    },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: () => ({
      data: {
        version: '1.0.0',
        environment: 'Production',
        uptime: '1.02:03:04.0000000',
      },
      isLoading: false,
    }),
  };
});

describe('SystemInfoCard 英文界面', () => {
  it('应使用英文单位显示后端运行时间', () => {
    render(<SystemInfoCard />);

    expect(screen.getByText('System Information')).toBeInTheDocument();
    expect(screen.getByText('1d 2h 3m')).toBeInTheDocument();
    expect(screen.queryByText(/天|小时|分钟|秒/)).not.toBeInTheDocument();
  });
});
