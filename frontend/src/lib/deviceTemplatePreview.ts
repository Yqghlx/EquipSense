/** 可安全读取的 JSON 对象。 */
export type JsonRecord = Record<string, unknown>;

/** 判断未知值是否为普通 JSON 对象。 */
function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 读取模板中的数组字段。
 *
 * 后端 JSONB 字段在不同 API 序列化配置下可能以对象或 JSON 字符串返回；
 * 预览层只接受结构明确的对象数组，异常数据降级为空数组，避免阻断设备注册。
 */
export function parseTemplateArray(value: unknown, fieldName: string): readonly JsonRecord[] {
  let parsedValue = value;

  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.filter(isJsonRecord);
  }

  if (isJsonRecord(parsedValue) && Array.isArray(parsedValue[fieldName])) {
    return parsedValue[fieldName].filter(isJsonRecord);
  }

  return [];
}
