import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

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
 */
export async function startConnection(): Promise<HubConnection> {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl('/hubs/industrial')
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();

  await connection.start();
  return connection;
}

/** 断开 SignalR 连接并清除实例 */
export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
