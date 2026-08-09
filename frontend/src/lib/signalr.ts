import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useRealtimeStore } from '../stores/realtimeStore';

let connection: HubConnection | null = null;

/** 获取当前 SignalR 连接实例 */
export function getConnection(): HubConnection | null {
  return connection;
}

/**
 * 建立 SignalR 连接（单例模式，已连接时直接返回）
 *
 * 认证方式：依赖 HttpOnly Cookie（access_token）
 *   - 浏览器在 WebSocket 握手时自动携带 Cookie（withCredentials 在浏览器默认启用）
 *   - 后端 JwtBearer OnMessageReceived 事件优先从 Cookie 读取 token
 *   - 不再使用 accessTokenFactory（HttpOnly Cookie 不可被 JS 读取）
 *
 * 注意：Nginx 将 /hubs/ 代理到后端，浏览器视角为同源，Cookie 自动携带
 *
 * 连接状态追踪：注册 onreconnecting/onreconnected/onclose，把状态写入 realtimeStore，
 * 供 Header 的连接指示器显示（工业场景下实时中断必须有视觉提示）。
 */
export async function startConnection(): Promise<HubConnection> {
  if (connection) return connection;

  const setStatus = useRealtimeStore.getState().setStatus;
  setStatus('connecting');

  const newConnection = new HubConnectionBuilder()
    .withUrl('/hubs/industrial')
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();
  connection = newConnection;

  // 关键修复：暴露连接生命周期状态给 UI
  // withAutomaticReconnect 在前 4 次重连尝试期间触发 onreconnecting（黄灯），
  // 成功后触发 onreconnected（绿灯）。若所有重连耗尽则触发 onclose（红灯）。
  newConnection.onreconnecting(() => setStatus('reconnecting'));
  newConnection.onreconnected(() => setStatus('connected'));
  newConnection.onclose(() => setStatus('disconnected'));

  try {
    await newConnection.start();
    setStatus('connected');
    return newConnection;
  } catch (error) {
    // 初次握手失败不会进入 withAutomaticReconnect；清理失败实例，否则后续调用会复用永久断开的连接。
    if (connection === newConnection) {
      connection = null;
    }
    setStatus('disconnected');
    try {
      await newConnection.stop();
    } catch {
      // 握手失败后的 stop 可能再次抛错，但不能覆盖原始连接异常。
    }
    throw error;
  }
}

/** 断开 SignalR 连接并清除实例 */
export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
    useRealtimeStore.getState().setStatus('disconnected');
  }
}
