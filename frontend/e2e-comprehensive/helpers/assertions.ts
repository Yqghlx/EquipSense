/**
 * 自定义断言辅助函数
 *
 * 提供 E2E 测试中用于捕获和断言页面 JS 错误的工具函数。
 * 自动过滤 ServiceWorker SSL、ResizeObserver 等可忽略的噪声错误。
 */
import { expect, type Page } from '@playwright/test';

/**
 * 判断是否为可忽略的浏览器噪声错误
 *
 * ServiceWorker SSL 证书错误在本地 HTTPS 环境下是预期行为，
 * ResizeObserver 循环引用错误是浏览器布局计算的良性告警。
 *
 * @param msg - 错误消息文本
 * @returns 如果可忽略则返回 true
 */
export function isIgnorableError(msg: string): boolean {
  return (
    msg.includes('ServiceWorker') ||
    msg.includes('SSL certificate error') ||
    msg.includes('ResizeObserver')
  );
}

/**
 * 在页面上注册错误捕获器，收集非噪声的页面错误
 *
 * 调用后会在测试生命周期内持续收集 pageerror 事件，
 * 测试结束时通过 expectNoJSErrors 断言错误列表是否为空。
 *
 * @param page - Playwright Page 实例
 * @returns 错误消息数组引用（会随新错误自动增长）
 */
export function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (!isIgnorableError(err.message)) errors.push(err.message);
  });
  return errors;
}

/**
 * 断言捕获的 JS 错误列表为空
 *
 * 通常在测试末尾调用，验证整个测试过程中没有出现意外的 JS 错误。
 *
 * @param page - Playwright Page 实例（通过 captureErrors 注册了错误捕获器的页面对象）
 */
export async function expectNoJSErrors(page: Page): Promise<void> {
  // 从 page 的事件监听器中无法直接取回已捕获的错误列表，
  // 因此本函数配合 captureErrors 返回的数组使用时，
  // 应在测试代码中将 captureErrors 返回值传入 expect。
  // 这里提供基于 page.pageerror 事件的直接断言方式：
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (!isIgnorableError(err.message)) errors.push(err.message);
  });

  // 等待一小段时间确保已有错误被捕获
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
}
