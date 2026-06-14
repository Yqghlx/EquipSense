/**
 * MFA（多因素认证）设置面板
 *
 * 提供 MFA 的完整启用/禁用流程 UI：
 *   - 未启用：显示"启用 MFA"按钮，点击后调用 /auth/mfa/setup 获取 QR 码 URI
 *     → 渲染 QR 码图片供 authenticator 扫描 → 用户输入验证码确认 → 正式启用
 *   - 已启用：显示"已启用"状态 + "禁用 MFA"按钮
 *
 * 安全说明：
 *   - QR 码 URI 来自后端（otpauth:// 格式），前端仅负责渲染，不修改其内容
 *   - 临时密钥存 Redis（10 分钟过期），确认后才写入数据库，防止半启用状态
 *   - 用户禁用 MFA 时清除 TotpSecret，下次登录不再要求验证码
 */
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMfaSetup, useMfaConfirm, useMfaDisable } from '../../hooks/useMfa';
import QRCode from 'qrcode';

export default function MfaSettingsPanel() {
  const user = useAuthStore((s) => s.user);
  const mfaEnabled = user?.mfaEnabled ?? false;

  // MFA 启用流程状态
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const setupMutation = useMfaSetup();
  const confirmMutation = useMfaConfirm();
  const disableMutation = useMfaDisable();

  /** 点击"启用 MFA"后，调用后端生成密钥并渲染 QR 码 */
  const handleSetup = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await setupMutation.mutateAsync();
      setSecret(data.secret);
      // 将 otpauth:// URI 渲染为 QR 码 Data URL（canvas 输出 PNG）
      const dataUrl = await QRCode.toDataURL(data.qrCodeUri, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M', // 中等纠错，兼顾尺寸和容错
      });
      setQrCodeDataUrl(dataUrl);
    } catch {
      setError('初始化 MFA 失败，请重试');
    }
  };

  /** 用户扫码后输入验证码，提交确认启用 MFA */
  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      setError('验证码必须为 6 位数字');
      return;
    }
    setError('');
    try {
      await confirmMutation.mutateAsync({ totpCode });
      setSuccess('MFA 已成功启用！下次登录时将要求输入验证码');
      setQrCodeDataUrl(null);
      setSecret(null);
      setTotpCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '验证码错误，请检查 authenticator 应用中的时间是否准确';
      setError(msg);
    }
  };

  /** 禁用 MFA */
  const handleDisable = async () => {
    if (!window.confirm('确定要禁用 MFA 吗？禁用后登录将不再需要验证码，账户安全性会降低。')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await disableMutation.mutateAsync();
      setSuccess('MFA 已禁用');
    } catch {
      setError('禁用 MFA 失败，请重试');
    }
  };

  // 重置流程状态（当用户切换标签页或重新启用时）
  useEffect(() => {
    if (!mfaEnabled) return;
    setQrCodeDataUrl(null);
    setSecret(null);
    setTotpCode('');
  }, [mfaEnabled]);

  // 已启用状态：显示状态 + 禁用按钮
  if (mfaEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle>多因素认证</CardTitle>
          </div>
          <CardDescription>您的账户已启用 TOTP 多因素认证</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              <ShieldCheck className="h-4 w-4" />
              已启用
            </div>
            <Button variant="outline" onClick={handleDisable} disabled={disableMutation.isPending}>
              {disableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              <span className="ml-2">禁用 MFA</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 未启用 + 未初始化：显示"启用 MFA"按钮
  if (!qrCodeDataUrl) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>多因素认证</CardTitle>
          </div>
          <CardDescription>启用后登录时需额外提供 Authenticator 应用生成的验证码，显著提升账户安全性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSetup} disabled={setupMutation.isPending}>
            {setupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            <span className="ml-2">启用 MFA</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 未启用 + 已生成 QR 码：显示 QR 码 + 手动密钥 + 验证码输入
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>配置 Authenticator 应用</CardTitle>
        </div>
        <CardDescription>用 Google Authenticator / Microsoft Authenticator 等应用扫描下方二维码，然后输入验证码确认</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR 码图片（canvas 渲染） */}
        <div className="flex justify-center">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="MFA QR Code" className="border rounded" />
          ) : (
            <canvas ref={qrCanvasRef} />
          )}
        </div>

        {/* 手动输入密钥（无法扫码时的备选方案） */}
        {secret && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">无法扫码？手动输入密钥：</Label>
            <div className="flex items-center gap-2 rounded bg-muted px-3 py-2 font-mono text-sm">
              <code className="flex-1 break-all">{secret}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  setSuccess('密钥已复制到剪贴板');
                  setTimeout(() => setSuccess(''), 2000);
                }}
              >
                复制
              </Button>
            </div>
          </div>
        )}

        {/* 验证码输入 */}
        <div className="space-y-2">
          <Label htmlFor="totpCode">输入验证码以确认</Label>
          <Input
            id="totpCode"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex gap-2">
          <Button onClick={handleConfirm} disabled={confirmMutation.isPending || totpCode.length !== 6}>
            {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            确认启用
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setQrCodeDataUrl(null);
              setSecret(null);
              setTotpCode('');
              setError('');
            }}
          >
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
