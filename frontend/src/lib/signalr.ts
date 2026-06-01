import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;

/** 获取当前 SignalR 连接实例 */
export function getConnection(): HubConnection | null {
  return connection;
}

/** 建立 SignalR 连接（单例模式，已连接时直接返回） */
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
