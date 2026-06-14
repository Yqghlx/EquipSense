import api from '../lib/api';

/** 生成运营报告 CSV（触发浏览器下载） */
export async function downloadOperationsReport(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const query = params.toString();
  const response = await api.get(`/reports/operations${query ? `?${query}` : ''}`, { responseType: 'blob' });
  triggerDownload(response.data as Blob, `operations_report_${Date.now()}.csv`);
}

/** 生成本月运营报告（快捷） */
export async function downloadCurrentMonthReport() {
  const response = await api.get('/reports/operations/current-month', { responseType: 'blob' });
  const now = new Date();
  triggerDownload(response.data as Blob, `operations_report_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}.csv`);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
