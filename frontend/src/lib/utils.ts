import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 安全格式化日期字符串，undefined/null 时返回占位符 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

/**
 * 触发浏览器下载二进制数据
 *
 * 封装 createObjectURL → createElement('a') → click → revoke 的样板流程，
 * 统一各导出 hook（设备/知识/工单/审计/报表 CSV 下载）的下载实现。
 *
 * @param data 二进制数据（通常是 axios responseType:'blob' 的 response.data）
 * @param filename 下载文件名（含扩展名）
 * @param mimeType MIME 类型，默认 text/csv；后端响应头已带正确类型时可不传
 */
export function downloadBlob(data: BlobPart, filename: string, mimeType = 'text/csv;charset=utf-8'): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // appendChild + removeChild：Firefox 旧版要求链接在 DOM 中才会触发下载，现代浏览器可省略
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
