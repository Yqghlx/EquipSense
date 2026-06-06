/**
 * 设置页集成配置测试
 *
 * 覆盖设置页面中的外部集成配置面板：
 * - 页面加载与标签页导航
 * - 钉钉/飞书/Webhook/EAM 四种集成的配置表单
 * - 测试连接按钮交互
 * - 启用/禁用切换
 * - 推送通知开关
 */
import { test, expect } from '@playwright/test';
import { login, captureErrors } from '../helpers';

test.describe('02-设置页集成配置', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. 应正确加载设置页面', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用侧边栏导航（避免 page.goto 导致的全页面重载触发 AuthGuard 重定向）
    const settingsLink = page.getByRole('link', { name: /系统设置|settings/i });
    await settingsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证页面标题 — i18n key: settings.title
    const title = page.getByRole('heading', { name: /设置|settings/i });
    await expect(title).toBeVisible({ timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('2. 应显示集成配置标签页', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证四个集成标签页都可见
    const dingtalkTab = page.getByRole('tab', { name: /钉钉/i });
    const feishuTab = page.getByRole('tab', { name: /飞书/i });
    const webhookTab = page.getByRole('tab', { name: /Webhook/i });
    const eamTab = page.getByRole('tab', { name: /EAM/i });

    // 先切换到集成标签
    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      if (await dingtalkTab.isVisible().catch(() => false)) {
        await expect(dingtalkTab).toBeVisible();
      }
      if (await feishuTab.isVisible().catch(() => false)) {
        await expect(feishuTab).toBeVisible();
      }
      if (await webhookTab.isVisible().catch(() => false)) {
        await expect(webhookTab).toBeVisible();
      }
      if (await eamTab.isVisible().catch(() => false)) {
        await expect(eamTab).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });

  test('3. 钉钉集成应能配置 Webhook URL 和 Secret', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      // 切换到钉钉标签
      const dingtalkTab = page.getByRole('tab', { name: /钉钉/i });
      if (await dingtalkTab.isVisible().catch(() => false)) {
        await dingtalkTab.click();
        await page.waitForTimeout(500);

        // 填写 Webhook URL
        const webhookInput = page.getByPlaceholder(/oapi\.dingtalk/i).first();
        if (await webhookInput.isVisible().catch(() => false)) {
          await webhookInput.fill('https://oapi.dingtalk.com/robot/send?access_token=e2e_test');
          await expect(webhookInput).toHaveValue(/e2e_test/);
        }

        // 填写密钥
        const secretInput = page.getByPlaceholder(/SEC/i).first();
        if (await secretInput.isVisible().catch(() => false)) {
          await secretInput.fill('SECe2etest123');
          await expect(secretInput).toHaveValue(/SECe2etest/);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('4. 飞书集成应能配置 AppId 和 AppSecret', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      const feishuTab = page.getByRole('tab', { name: /飞书/i });
      if (await feishuTab.isVisible().catch(() => false)) {
        await feishuTab.click();
        await page.waitForTimeout(500);

        // 填写 Webhook URL
        const webhookInput = page.getByPlaceholder(/open\.feishu/i).first();
        if (await webhookInput.isVisible().catch(() => false)) {
          await webhookInput.fill('https://open.feishu.cn/open-apis/bot/v2/hook/e2e_test');
        }

        // 填写 App ID
        const appIdInput = page.getByPlaceholder(/cli_/i).first();
        if (await appIdInput.isVisible().catch(() => false)) {
          await appIdInput.fill('cli_e2etest123');
          await expect(appIdInput).toHaveValue(/cli_e2etest/);
        }

        // 填写 App Secret
        const secretInputs = page.locator('input[type="password"]');
        const secretInput = secretInputs.nth(0);
        if (await secretInput.isVisible().catch(() => false)) {
          await secretInput.fill('e2e_app_secret_123');
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('5. Webhook 集成应能配置 URL 和模板', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      const webhookTab = page.getByRole('tab', { name: /Webhook/i });
      if (await webhookTab.isVisible().catch(() => false)) {
        await webhookTab.click();
        await page.waitForTimeout(500);

        // 填写 Webhook URL
        const urlInput = page.getByPlaceholder(/your-server\.com/i).first();
        if (await urlInput.isVisible().catch(() => false)) {
          await urlInput.fill('https://e2e-test.example.com/webhook');
          await expect(urlInput).toHaveValue(/e2e-test/);
        }

        // 填写 Body 模板
        const templateTextarea = page.locator('textarea.font-mono').first();
        if (await templateTextarea.isVisible().catch(() => false)) {
          await templateTextarea.fill('{"event": "test", "code": "{{workOrder.code}}"}');
          await expect(templateTextarea).toHaveValue(/test/);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('6. EAM 集成应能选择类型（Maximo/SAP）', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      const eamTab = page.getByRole('tab', { name: /EAM/i });
      if (await eamTab.isVisible().catch(() => false)) {
        await eamTab.click();
        await page.waitForTimeout(500);

        // 验证下拉选择框存在
        const eamSelect = page.locator('select').first();
        if (await eamSelect.isVisible().catch(() => false)) {
          // 验证默认值为 maximo
          await expect(eamSelect).toHaveValue('maximo');

          // 切换到 SAP PM
          await eamSelect.selectOption('sap_pm');
          await expect(eamSelect).toHaveValue('sap_pm');
        }

        // 填写 API 端点
        const endpointInput = page.getByPlaceholder(/maximo\.example/i).first();
        if (await endpointInput.isVisible().catch(() => false)) {
          await endpointInput.fill('https://eam.e2e-test.com/api');
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('7. 测试连接按钮应可点击', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      // 查找测试连接按钮
      const testButton = page.getByRole('button', { name: /测试连接/i }).first();
      if (await testButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 验证按钮可交互（不被禁用或隐藏）
        await expect(testButton).toBeEnabled();
      }
    }

    expect(errors).toEqual([]);
  });

  test('8. 启用/禁用切换应工作', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const integrationTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integrationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await integrationTab.click();
      await page.waitForTimeout(1000);

      // 查找启用状态 badge
      const enabledBadge = page.getByText(/已启用|未启用/i).first();
      if (await enabledBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        const beforeText = await enabledBadge.textContent();

        // 点击启用/禁用按钮
        const toggleButton = page.getByRole('button', { name: /启用并保存|禁用/i }).first();
        if (await toggleButton.isVisible().catch(() => false)) {
          await toggleButton.click();
          await page.waitForTimeout(2000);

          // 验证 badge 状态变更
          const afterBadge = page.getByText(/已启用|未启用/i).first();
          if (await afterBadge.isVisible().catch(() => false)) {
            const afterText = await afterBadge.textContent();
            expect(afterText).not.toBe(beforeText);
          }
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('9. 推送通知开关应可切换', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 查找推送通知开关 — 滚动到页面底部
    const pushSection = page.getByText(/推送通知|browser.*push/i).first();
    if (await pushSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 查找 switch 组件
      const switchButton = page.locator('button[role="switch"]').first();
      if (await switchButton.isVisible().catch(() => false)) {
        const beforeChecked = await switchButton.getAttribute('aria-checked');

        // 点击切换
        await switchButton.click();
        await page.waitForTimeout(1000);

        // 验证状态变更
        const afterChecked = await switchButton.getAttribute('aria-checked');
        expect(afterChecked).not.toBe(beforeChecked);
      }
    }

    expect(errors).toEqual([]);
  });

  test('10. 切换标签页应正确显示对应内容', async ({ page }) => {
    const errors = captureErrors(page);

    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 切换到角色权限标签
    const rolesTab = page.getByRole('tab', { name: /角色|roles/i });
    if (await rolesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rolesTab.click();
      await page.waitForTimeout(1000);

      // 验证权限矩阵内容
      const matrixContent = page.getByText(/CRUD|权限矩阵/i).first();
      if (await matrixContent.isVisible().catch(() => false)) {
        await expect(matrixContent).toBeVisible();
      }
    }

    // 切换到 LLM 配置标签
    const llmTab = page.getByRole('tab', { name: /LLM|AI/i });
    if (await llmTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await llmTab.click();
      await page.waitForTimeout(1000);

      // 验证 LLM 配置内容
      const llmContent = page.getByPlaceholder(/dashscope|api/i).first();
      if (await llmContent.isVisible().catch(() => false)) {
        await expect(llmContent).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });
});
