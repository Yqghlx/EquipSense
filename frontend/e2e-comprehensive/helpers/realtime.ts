/**
 * 实时功能辅助函数
 *
 * 提供 E2E 测试中启动和管理 MQTT 遥测数据模拟器的工具。
 * 模拟器通过 dotnet run 启动 EquipAI.Simulator 项目，
 * 用于测试 SignalR 实时推送、告警触发等场景。
 */
import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM 兼容：模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 启动模拟器的选项 */
export interface SimulatorOptions {
  /** 租户 ID */
  tenantId: string;
  /** 模拟设备数量 */
  devices: number;
  /** 发送间隔（秒） */
  interval: number;
  /** 异常概率百分比（0-100） */
  anomalyRate: number;
}

/**
 * 启动 MQTT 遥测数据模拟器
 *
 * 通过 child_process.spawn 启动 dotnet run 命令运行模拟器。
 * 模拟器会持续向 MQTT 代理发送遥测数据，直到调用 stopSimulator。
 *
 * @param options - 模拟器配置选项
 * @returns 子进程对象，可用于后续停止或监听输出
 */
export function startSimulator(options: SimulatorOptions): ChildProcess {
  // 计算模拟器项目根目录（相对于 E2E 测试目录）
  const projectRoot = path.resolve(__dirname, '../../../../tools/EquipAI.Simulator');

  // 根据异常概率计算持续时间参数中的 anomaly-rate
  // 模拟器本身不支持 --anomaly-rate 参数，这里通过环境变量传递
  const proc = spawn(
    'dotnet',
    [
      'run',
      '--project', projectRoot,
      '--',
      '--tenant', options.tenantId,
      '--devices', String(options.devices),
      '--interval', String(options.interval),
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // 模拟器默认 5% 异常概率，通过环境变量覆盖（如果模拟器支持）
        EQUIP_AI_ANOMALY_RATE: String(options.anomalyRate / 100),
      },
    },
  );

  // 将子进程输出转发到控制台，方便调试
  proc.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`[模拟器] ${line}`);
      }
    }
  });

  proc.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`[模拟器错误] ${line}`);
      }
    }
  });

  proc.on('error', (err) => {
    console.error(`[模拟器] 启动失败: ${err.message}`);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[模拟器] 已退出，退出码: ${code}`);
    }
  });

  return proc;
}

/**
 * 停止模拟器进程
 *
 * 先尝试 SIGTERM 优雅退出，超时后强制 SIGKILL。
 *
 * @param proc - 模拟器子进程对象
 */
export function stopSimulator(proc: ChildProcess): void {
  if (proc.killed || proc.exitCode !== null) {
    return;
  }

  // 尝试优雅退出
  proc.kill('SIGTERM');

  // 给予 5 秒优雅退出时间，之后强制结束
  const forceKillTimer = setTimeout(() => {
    if (!proc.killed && proc.exitCode === null) {
      proc.kill('SIGKILL');
      console.warn('[模拟器] 优雅退出超时，已强制终止');
    }
  }, 5000);

  // 确保定时器不阻止进程退出
  forceKillTimer.unref();
}

/**
 * 等待模拟器成功连接到 MQTT 代理
 *
 * 监听模拟器标准输出，直到出现 "连接成功" 关键字。
 *
 * @param proc - 模拟器子进程对象
 * @param timeout - 超时时间（毫秒，默认 15000）
 * @returns Promise，连接成功时 resolve，超时时 reject
 */
export function waitForMQTTConnection(
  proc: ChildProcess,
  timeout = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`等待 MQTT 连接超时（${timeout}ms）`));
    }, timeout);

    const onData = (data: Buffer) => {
      const output = data.toString();
      // 模拟器输出包含 "连接成功！结果代码" 表示 MQTT 连接已建立
      if (output.includes('连接成功')) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(new Error(`模拟器在连接前退出，退出码: ${code}`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout?.removeListener('data', onData);
      proc.removeListener('exit', onExit);
    };

    proc.stdout?.on('data', onData);
    proc.on('exit', onExit);
  });
}
