using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 管理 WAF 规则的首次加载、目录监听和不可变快照切换。
/// </summary>
public sealed class WafRuleProvider : IWafRuleProvider, IHostedService, IDisposable
{
    private readonly WafRuleOptions _options;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly ILogger<WafRuleProvider> _logger;
    private readonly SemaphoreSlim _reloadGate = new(1, 1);
    private readonly object _debounceLock = new();
    private readonly CancellationTokenSource _stopCancellation = new();
    private WafRuleSnapshot _current = CreateBuiltInSnapshot();
    private FileSystemWatcher? _watcher;
    private CancellationTokenSource? _debounceCancellation;
    private Task? _pendingReload;
    private bool _started;
    /// <summary>
    /// 防止宿主和测试夹具重复释放 provider。
    /// </summary>
    private int _disposed;

    /// <summary>
    /// 初始化 WAF 规则 provider。
    /// </summary>
    public WafRuleProvider(
        WafRuleOptions options,
        IHostEnvironment hostEnvironment,
        ILogger<WafRuleProvider> logger)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _hostEnvironment = hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public WafRuleSnapshot Current => Volatile.Read(ref _current);

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_options.Enabled)
        {
            Interlocked.Exchange(
                ref _current,
                new WafRuleSnapshot(
                    "disabled",
                    "disabled",
                    [],
                    DateTimeOffset.UtcNow));
            _started = true;
            return Task.CompletedTask;
        }

        var snapshot = WafRuleLoader.Load(
            _options.RulesPath,
            _options,
            string.Equals(_hostEnvironment.EnvironmentName, Environments.Production, StringComparison.OrdinalIgnoreCase));
        Interlocked.Exchange(ref _current, snapshot);

        if (!string.IsNullOrWhiteSpace(_options.RulesPath)
            && File.Exists(_options.RulesPath))
        {
            StartWatcher(_options.RulesPath);
        }

        _started = true;
        _logger.LogInformation(
            "WAF 规则加载成功：Revision={Revision}, RuleCount={RuleCount}, Sha256={Sha256}",
            snapshot.Revision,
            snapshot.Rules.Length,
            snapshot.Sha256);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _stopCancellation.Cancel();
        _watcher?.Dispose();
        _watcher = null;

        Task? pendingReload;
        lock (_debounceLock)
        {
            _debounceCancellation?.Cancel();
            pendingReload = _pendingReload;
        }

        if (pendingReload is not null)
        {
            try
            {
                await pendingReload.WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                // 宿主主动取消停止等待，不能将正常停机记录为故障。
            }
        }

        _started = false;
    }

    /// <summary>
    /// 立即尝试加载当前文件。仅用于测试和内部受控调用，不暴露 HTTP 管理接口。
    /// </summary>
    internal async Task<bool> ReloadNowAsync(CancellationToken cancellationToken)
    {
        await _reloadGate.WaitAsync(cancellationToken);
        try
        {
            var snapshot = WafRuleLoader.Load(
                _options.RulesPath,
                _options,
                string.Equals(_hostEnvironment.EnvironmentName, Environments.Production, StringComparison.OrdinalIgnoreCase));
            Interlocked.Exchange(ref _current, snapshot);
            _logger.LogInformation(
                "WAF 规则热加载成功：Revision={Revision}, RuleCount={RuleCount}, Sha256={Sha256}",
                snapshot.Revision,
                snapshot.Rules.Length,
                snapshot.Sha256);
            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            // loader 的异常消息已经脱敏；这里仍只记录异常类型，避免未来新增字段时把规则正文写入日志。
            _logger.LogError(
                "WAF 规则热加载失败：Path={Path}, ErrorType={ErrorType}",
                _options.RulesPath,
                exception.GetType().Name);
            return false;
        }
        finally
        {
            _reloadGate.Release();
        }
    }

    /// <summary>
    /// 释放文件监听器和同步资源。
    /// </summary>
    public void Dispose()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
        {
            return;
        }

        _stopCancellation.Cancel();
        _watcher?.Dispose();
        _watcher = null;
        lock (_debounceLock)
        {
            _debounceCancellation?.Cancel();
            _debounceCancellation?.Dispose();
            _debounceCancellation = null;
        }

        _stopCancellation.Dispose();
        _reloadGate.Dispose();
    }

    private void StartWatcher(string rulesPath)
    {
        var fullPath = Path.GetFullPath(rulesPath);
        var directory = Path.GetDirectoryName(fullPath);
        var fileName = Path.GetFileName(fullPath);
        if (string.IsNullOrWhiteSpace(directory) || string.IsNullOrWhiteSpace(fileName))
        {
            throw new InvalidOperationException("WAF 规则监听路径不合法");
        }

        _watcher = new FileSystemWatcher(directory, fileName)
        {
            NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite | NotifyFilters.Size,
            IncludeSubdirectories = false,
            EnableRaisingEvents = true
        };
        _watcher.Changed += OnRuleFileChanged;
        _watcher.Created += OnRuleFileChanged;
        _watcher.Renamed += OnRuleFileRenamed;
        _watcher.Error += OnWatcherError;
    }

    private void OnRuleFileChanged(object sender, FileSystemEventArgs eventArgs)
        => ScheduleReload();

    private void OnRuleFileRenamed(object sender, RenamedEventArgs eventArgs)
        => ScheduleReload();

    private void OnWatcherError(object sender, ErrorEventArgs eventArgs)
    {
        _logger.LogError(
            "WAF 规则文件监听失败：Path={Path}, ErrorType={ErrorType}",
            _options.RulesPath,
            eventArgs.GetException().GetType().Name);
    }

    private void ScheduleReload()
    {
        if (!_started || _stopCancellation.IsCancellationRequested)
        {
            return;
        }

        CancellationTokenSource cancellation;
        lock (_debounceLock)
        {
            _debounceCancellation?.Cancel();
            _debounceCancellation?.Dispose();
            cancellation = CancellationTokenSource.CreateLinkedTokenSource(_stopCancellation.Token);
            _debounceCancellation = cancellation;
            _pendingReload = DebouncedReloadAsync(cancellation);
        }
    }

    private async Task DebouncedReloadAsync(CancellationTokenSource cancellation)
    {
        try
        {
            var debounce = Math.Clamp(_options.ReloadDebounceMilliseconds, 50, 5000);
            await Task.Delay(debounce, cancellation.Token);
            await ReloadNowAsync(cancellation.Token);
        }
        catch (OperationCanceledException)
        {
            // 连续文件事件或正常停机取消旧任务是预期行为。
        }
        finally
        {
            lock (_debounceLock)
            {
                if (ReferenceEquals(_debounceCancellation, cancellation))
                {
                    _debounceCancellation.Dispose();
                    _debounceCancellation = null;
                    _pendingReload = null;
                }
            }
        }
    }

    private static WafRuleSnapshot CreateBuiltInSnapshot()
        => new(
            "builtin",
            "builtin",
            WafRuleCatalog.CreateBuiltInRules(),
            DateTimeOffset.UtcNow);
}
