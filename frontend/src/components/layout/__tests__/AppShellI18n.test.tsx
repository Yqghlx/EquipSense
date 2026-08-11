import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { PageFallback, RouteErrorFallback, SessionRestoreFallback } from '../AppFeedback';
import { OfflineIndicator } from '../OfflineIndicator';
import { RealtimeIndicator } from '../RealtimeIndicator';
import { InstallPrompt } from '../InstallPrompt';
import { RootErrorBoundary } from '../RootErrorBoundary';
import * as offlineStatus from '../../../hooks/useOfflineStatus';
import * as pwa from '../../../hooks/usePWA';
import * as realtimeStore from '../../../stores/realtimeStore';

const { translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    'app.pageLoading': 'Loading page...',
    'app.sessionRestoring': 'Restoring your session...',
    'app.sessionRestoreError': 'Secure initialization failed. Please refresh and try again.',
    'app.routeErrorTitle': 'This page encountered an error',
    'app.routeErrorDescription': 'Try refreshing the page or choose another feature from the sidebar.',
    'app.reload': 'Reload',
    'layout.rootErrorTitle': 'Application error',
    'layout.rootErrorDescription': 'The application encountered an unexpected error. Return home or reload the page to continue.',
    'layout.goHome': 'Go home',
    'layout.offline': 'Offline — your actions will sync automatically when the connection recovers',
    'layout.installPrompt': 'Install EquipSense on your desktop for a better experience',
    'layout.install': 'Install',
    'realtime.reconnecting': 'Realtime connection lost, reconnecting…',
  };

  return { translate: (key: string) => translations[key] ?? key };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translate }),
  withTranslation: () => (Component: ComponentType<{ t: typeof translate; children?: ReactNode }>) =>
    (props: Omit<ComponentProps<typeof Component>, 't'>) => <Component {...props} t={translate} />,
}));

vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(),
}));

vi.mock('../../../hooks/usePWA', () => ({
  usePWAInstall: vi.fn(),
}));

vi.mock('../../../stores/realtimeStore', () => ({
  useRealtimeStore: vi.fn(),
}));

const mockedUseOfflineStatus = vi.mocked(offlineStatus.useOfflineStatus);
const mockedUsePWAInstall = vi.mocked(pwa.usePWAInstall);
const mockedUseRealtimeStore = vi.mocked(realtimeStore.useRealtimeStore);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseOfflineStatus.mockReturnValue({ isOnline: true, isOffline: false, lastChangedAt: 0 });
  mockedUsePWAInstall.mockReturnValue({ isInstallable: false, isInstalled: false, install: vi.fn() });
  mockedUseRealtimeStore.mockImplementation((selector) => selector({ status: 'connected' } as never));
});

describe('应用壳层英文提示', () => {
  it('应将全局加载、会话恢复和路由错误提示显示为英文', () => {
    render(
      <>
        <PageFallback />
        <SessionRestoreFallback />
        <SessionRestoreFallback error />
        <RouteErrorFallback />
      </>,
    );

    expect(screen.getByText('Loading page...')).toBeInTheDocument();
    expect(screen.getByText('Restoring your session...')).toBeInTheDocument();
    expect(screen.getByText('Secure initialization failed. Please refresh and try again.')).toBeInTheDocument();
    expect(screen.getByText('This page encountered an error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('断网时应显示可理解的英文同步提示', () => {
    mockedUseOfflineStatus.mockReturnValue({ isOnline: false, isOffline: true, lastChangedAt: 0 });

    render(<OfflineIndicator />);

    expect(screen.getByText('Offline — your actions will sync automatically when the connection recovers'))
      .toBeInTheDocument();
  });

  it('实时重连时应通过英文 aria 状态提示用户', () => {
    mockedUseRealtimeStore.mockImplementation((selector) => selector({ status: 'reconnecting' } as never));

    render(<RealtimeIndicator />);

    expect(screen.getByRole('status', { name: 'Realtime connection lost, reconnecting…' })).toBeInTheDocument();
  });

  it('可安装时应显示英文安装按钮并保留安装动作', () => {
    const install = vi.fn();
    mockedUsePWAInstall.mockReturnValue({ isInstallable: true, isInstalled: false, install });

    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));

    expect(screen.getByText('Install EquipSense on your desktop for a better experience')).toBeInTheDocument();
    expect(install).toHaveBeenCalledTimes(1);
  });

  it('根错误边界应显示英文恢复动作', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function BrokenComponent(): never {
      throw new Error('render failure');
    }

    render(
      <RootErrorBoundary>
        <BrokenComponent />
      </RootErrorBoundary>,
    );

    expect(screen.getByText('Application error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go home' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
