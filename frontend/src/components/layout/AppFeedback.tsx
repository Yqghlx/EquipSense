import { useTranslation } from 'react-i18next';

/** 页面懒加载期间的统一回退界面。 */
export function PageFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
      <div className="text-muted-foreground">{t('app.pageLoading')}</div>
    </div>
  );
}

/** 首屏会话恢复期间的统一回退界面。 */
export function SessionRestoreFallback({ error = false }: { error?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="text-muted-foreground">
        {error ? t('app.sessionRestoreError') : t('app.sessionRestoring')}
      </div>
    </div>
  );
}

/** 路由级错误回退，保留应用壳层以便用户切换到其他功能。 */
export function RouteErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t('app.routeErrorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('app.routeErrorDescription')}</p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t('app.reload')}
      </button>
    </div>
  );
}
