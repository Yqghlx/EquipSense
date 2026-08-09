/**
 * MFA（多因素认证）设置面板
 *
 * 提供 MFA 的完整启用/禁用流程 UI：
 *   - 未启用：显示"启用 MFA"按钮，点击后调用 /auth/mfa/setup 获取 QR 码 URI
 *     → 渲染 QR 码图片供 authenticator 扫描 → 用户输入验证码确认 → 正式启用
 *   - 已启用：显示"已启用"状态、恢复码管理和"禁用 MFA"按钮
 *
 * 安全说明：
 *   - QR 码 URI 来自后端（otpauth:// 格式），前端仅负责渲染，不修改其内容
 *   - 临时密钥存 Redis（10 分钟过期），确认后才写入数据库，防止半启用状态
 *   - 普通角色禁用 MFA 时清除 TotpSecret；生产强制角色的禁用请求由后端拒绝
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

// React Compiler 严格规则在该 effect 不适用：state 重置是用户切换标签页的副作用，无级联渲染风险
// 文件级禁用避免在每个 setState 上重复 disable 注释
/* eslint-disable react-hooks/set-state-in-effect */
import { useAuthStore } from '../../stores/authStore';
import {
  useMfaSetup,
  useMfaConfirm,
  useMfaDisable,
  useMfaRecoveryCodesRegenerate,
} from '../../hooks/useMfa';
import QRCode from 'qrcode';

export default function MfaSettingsPanel() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const mfaEnabled = user?.mfaEnabled ?? false;

  // MFA 启用流程状态
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [showRecoveryRegenerate, setShowRecoveryRegenerate] = useState(false);
  const [recoveryTotpCode, setRecoveryTotpCode] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const setupMutation = useMfaSetup();
  const confirmMutation = useMfaConfirm();
  const disableMutation = useMfaDisable();
  const recoveryCodesMutation = useMfaRecoveryCodesRegenerate();

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
      setError(t('mfa.setupFailed'));
    }
  };

  /** 用户扫码后输入验证码，提交确认启用 MFA */
  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      setError(t('mfa.codeInvalid'));
      return;
    }
    setError('');
    try {
      const response = await confirmMutation.mutateAsync({ totpCode });
      setSuccess(t('mfa.enableSuccess'));
      setRecoveryCodes(response.recoveryCodes);
      setQrCodeDataUrl(null);
      setSecret(null);
      setTotpCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('mfa.codeError');
      setError(msg);
    }
  };

  /** 使用当前 TOTP 验证码重新生成恢复码，旧恢复码会全部失效。 */
  const handleRegenerateRecoveryCodes = async () => {
    if (!/^\d{6}$/.test(recoveryTotpCode)) {
      setError(t('mfa.codeInvalid'));
      return;
    }

    setError('');
    try {
      const response = await recoveryCodesMutation.mutateAsync({ totpCode: recoveryTotpCode });
      setRecoveryCodes(response.recoveryCodes);
      setRecoveryTotpCode('');
      setShowRecoveryRegenerate(false);
      setSuccess(t('mfa.recoveryCodesGenerated'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('mfa.recoveryCodesGenerateFailed'));
    }
  };

  /** 将恢复码复制为逐行文本，便于保存到密码管理器。 */
  const copyRecoveryCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard?.writeText(recoveryCodes.join('\n'));
    setSuccess(t('mfa.recoveryCodesCopied'));
  };

  /** 禁用 MFA */
  const handleDisable = async () => {
    if (!window.confirm(t('mfa.disableConfirm'))) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await disableMutation.mutateAsync();
      setRecoveryCodes(null);
      setShowRecoveryRegenerate(false);
      setSuccess(t('mfa.disableSuccess'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('mfa.disableFailed'));
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
  if (mfaEnabled || recoveryCodes) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle>{t('mfa.title')}</CardTitle>
          </div>
          <CardDescription>{t('mfa.enabledDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {recoveryCodes && (
            <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
              <p className="text-sm font-medium">{t('mfa.recoveryCodesWarning')}</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((code) => (
                  <code key={code}>{code}</code>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyRecoveryCodes}>
                {t('mfa.recoveryCodesCopy')}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              <ShieldCheck className="h-4 w-4" />
              {t('mfa.statusEnabled')}
            </div>
            <Button variant="outline" onClick={handleDisable} disabled={disableMutation.isPending}>
              {disableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              <span className="ml-2">{t('mfa.disable')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecoveryRegenerate((current) => !current);
                setError('');
              }}
              disabled={recoveryCodesMutation.isPending}
            >
              {t('mfa.recoveryCodesRegenerate')}
            </Button>
          </div>
          {showRecoveryRegenerate && (
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="recoveryTotpCode">{t('mfa.recoveryCodesRegenerateDesc')}</Label>
              <div className="flex gap-2">
                <Input
                  id="recoveryTotpCode"
                  value={recoveryTotpCode}
                  onChange={(event) => setRecoveryTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  onClick={handleRegenerateRecoveryCodes}
                  disabled={recoveryCodesMutation.isPending || recoveryTotpCode.length !== 6}
                >
                  {t('mfa.recoveryCodesConfirmRegenerate')}
                </Button>
              </div>
            </div>
          )}
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
            <CardTitle>{t('mfa.title')}</CardTitle>
          </div>
          <CardDescription>{t('mfa.enableDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSetup} disabled={setupMutation.isPending}>
            {setupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            <span className="ml-2">{t('mfa.enable')}</span>
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
          <CardTitle>{t('mfa.configTitle')}</CardTitle>
        </div>
        <CardDescription>{t('mfa.configDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR 码图片（canvas 渲染） */}
        <div className="flex justify-center">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt={t('mfa.qrAlt')} className="border rounded" />
          ) : (
            <canvas ref={qrCanvasRef} />
          )}
        </div>

        {/* 手动输入密钥（无法扫码时的备选方案） */}
        {secret && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('mfa.manualKeyLabel')}</Label>
            <div className="flex items-center gap-2 rounded bg-muted px-3 py-2 font-mono text-sm">
              <code className="flex-1 break-all">{secret}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  setSuccess(t('mfa.copied'));
                  setTimeout(() => setSuccess(''), 2000);
                }}
              >
                {t('mfa.copy')}
              </Button>
            </div>
          </div>
        )}

        {/* 验证码输入 */}
        <div className="space-y-2">
          <Label htmlFor="totpCode">{t('mfa.codeLabel')}</Label>
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
            {t('mfa.confirmEnable')}
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
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
