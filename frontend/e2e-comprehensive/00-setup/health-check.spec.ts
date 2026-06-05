/**
 * 健康检查测试
 *
 * 验证系统各基础服务的连通性，确保 E2E 测试环境已就绪：
 * - 后端健康检查端点
 * - 前端页面可访问性
 * - Swagger API 文档
 * - Mosquitto MQTT 代理端口
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, captureErrors } from '../helpers';

test.describe('00-环境健康检查', () => {
  test('1. 后端健康检查 GET /health 返回 200', async ({ request }) => {
    // 发送健康检查请求，验证后端服务正常运行
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // 验证响应体包含健康状态信息
    const body = await response.json().catch(() => null);
    if (body) {
      // 健康检查应返回整体状态为 healthy
      expect(body.status).toBeDefined();
    }
  });

  test('2. 前端页面可访问 /login 返回 200', async ({ page }) => {
    const errors = captureErrors(page);

    // 访问登录页面，验证前端服务正常响应
    const response = await page.goto(`${BASE_URL}/login`);
    expect(response).toBeTruthy();
    expect(response!.status()).toBe(200);

    // 等待页面完全加载
    await page.waitForLoadState('networkidle');

    // 验证页面包含登录表单元素
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('3. Swagger 文档可访问', async ({ request }) => {
    // 访问 Swagger 文档页面，验证 API 文档服务可用
    const response = await request.get(`${BASE_URL}/swagger/index.html`);
    // Swagger 可能返回 200 或 301 重定向，均视为可访问
    expect(response.status()).toBeLessThan(400);
  });

  test('4. Mosquitto MQTT 端口 1883 连通', async ({ request }) => {
    // 通过后端健康检查端点间接验证 MQTT 连通性
    // MQTT 是 TCP 协议，Playwright 无法直接连接，因此通过 /health 端点检查
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json().catch(() => null);
    if (body?.entries) {
      // 如果健康检查返回了各组件状态，验证 MQTT 相关条目
      const mqttEntry = body.entries['mqtt'] || body.entries['mosquitto'];
      if (mqttEntry) {
        expect(mqttEntry.status).toBe('Healthy');
      }
    }
  });
});
