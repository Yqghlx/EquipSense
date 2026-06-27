import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

/**
 * 根级错误边界
 *
 * 捕获子组件树（含懒加载 chunk）的渲染异常，避免整个应用白屏。
 * - 懒加载 chunk 加载失败：用户可点击「重新加载」恢复
 * - 运行时抛错：用户可点击「返回首页」回到 Dashboard
 *
 * 注意：React ErrorBoundary 只能捕获渲染期/生命周期错误，
 * 事件处理器、异步代码、SSR 错误仍需各调用点处理（见 lib/api.ts 拦截器）。
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 结构化日志，便于排查（生产可接入 Sentry 等）
    console.error('[RootErrorBoundary] 未捕获的渲染错误', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  private handleReload = (): void => {
    // 清空错误状态后整页刷新，确保懒加载 chunk 重新获取
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    // 跳首页而非刷新，保留 SPA 体验（避免重复触发同一崩溃 chunk）
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const isChunkLoadError =
      this.state.error?.name === 'ChunkLoadError' ||
      this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
      this.state.error?.message?.includes('Loading chunk');

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {isChunkLoadError ? '页面加载失败' : '页面发生错误'}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {isChunkLoadError
              ? '可能是应用已发布新版本或网络不稳。请尝试重新加载。'
              : '应用遇到了意外错误。您可以返回首页继续操作，或重新加载页面。'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCw className="h-4 w-4" />
            重新加载
          </button>
          <button
            type="button"
            onClick={this.handleGoHome}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            返回首页
          </button>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-4 max-w-2xl overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
            {this.state.error.stack ?? this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
