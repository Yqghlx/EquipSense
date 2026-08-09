import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/MfaSettingsPanel.tsx");const useState = __vite__cjsImport0_react["useState"]; const useRef = __vite__cjsImport0_react["useRef"]; const useEffect = __vite__cjsImport0_react["useEffect"];const QRCode = __vite__cjsImport9_qrcode;const _jsxDEV = __vite__cjsImport10_react_jsxDevRuntime["jsxDEV"];/**
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
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
// React Compiler 严格规则在该 effect 不适用：state 重置是用户切换标签页的副作用，无级联渲染风险
// 文件级禁用避免在每个 setState 上重复 disable 注释
/* eslint-disable react-hooks/set-state-in-effect */
import { useAuthStore } from "/src/stores/authStore.ts";
import { useMfaSetup, useMfaConfirm, useMfaDisable, useMfaRecoveryCodesRegenerate } from "/src/hooks/useMfa.ts";
import __vite__cjsImport9_qrcode from "/node_modules/.vite/deps/qrcode.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/MfaSettingsPanel.tsx";
import __vite__cjsImport10_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
export default function MfaSettingsPanel() {
	_s();
	const { t } = useTranslation();
	const user = useAuthStore((s) => s.user);
	const mfaEnabled = user?.mfaEnabled ?? false;
	// MFA 启用流程状态
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
	const [secret, setSecret] = useState(null);
	const [totpCode, setTotpCode] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [recoveryCodes, setRecoveryCodes] = useState(null);
	const [showRecoveryRegenerate, setShowRecoveryRegenerate] = useState(false);
	const [recoveryTotpCode, setRecoveryTotpCode] = useState("");
	const qrCanvasRef = useRef(null);
	const setupMutation = useMfaSetup();
	const confirmMutation = useMfaConfirm();
	const disableMutation = useMfaDisable();
	const recoveryCodesMutation = useMfaRecoveryCodesRegenerate();
	/** 点击"启用 MFA"后，调用后端生成密钥并渲染 QR 码 */
	const handleSetup = async () => {
		setError("");
		setSuccess("");
		try {
			const data = await setupMutation.mutateAsync();
			setSecret(data.secret);
			// 将 otpauth:// URI 渲染为 QR 码 Data URL（canvas 输出 PNG）
			const dataUrl = await QRCode.toDataURL(data.qrCodeUri, {
				width: 240,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#ffffff"
				},
				errorCorrectionLevel: "M"
			});
			setQrCodeDataUrl(dataUrl);
		} catch {
			setError(t("mfa.setupFailed"));
		}
	};
	/** 用户扫码后输入验证码，提交确认启用 MFA */
	const handleConfirm = async () => {
		if (!/^\d{6}$/.test(totpCode)) {
			setError(t("mfa.codeInvalid"));
			return;
		}
		setError("");
		try {
			const response = await confirmMutation.mutateAsync({ totpCode });
			setSuccess(t("mfa.enableSuccess"));
			setRecoveryCodes(response.recoveryCodes);
			setQrCodeDataUrl(null);
			setSecret(null);
			setTotpCode("");
		} catch (err) {
			const msg = err instanceof Error ? err.message : t("mfa.codeError");
			setError(msg);
		}
	};
	/** 使用当前 TOTP 验证码重新生成恢复码，旧恢复码会全部失效。 */
	const handleRegenerateRecoveryCodes = async () => {
		if (!/^\d{6}$/.test(recoveryTotpCode)) {
			setError(t("mfa.codeInvalid"));
			return;
		}
		setError("");
		try {
			const response = await recoveryCodesMutation.mutateAsync({ totpCode: recoveryTotpCode });
			setRecoveryCodes(response.recoveryCodes);
			setRecoveryTotpCode("");
			setShowRecoveryRegenerate(false);
			setSuccess(t("mfa.recoveryCodesGenerated"));
		} catch (err) {
			setError(err instanceof Error ? err.message : t("mfa.recoveryCodesGenerateFailed"));
		}
	};
	/** 将恢复码复制为逐行文本，便于保存到密码管理器。 */
	const copyRecoveryCodes = () => {
		if (!recoveryCodes) return;
		navigator.clipboard?.writeText(recoveryCodes.join("\n"));
		setSuccess(t("mfa.recoveryCodesCopied"));
	};
	/** 禁用 MFA */
	const handleDisable = async () => {
		if (!window.confirm(t("mfa.disableConfirm"))) {
			return;
		}
		setError("");
		setSuccess("");
		try {
			await disableMutation.mutateAsync();
			setRecoveryCodes(null);
			setShowRecoveryRegenerate(false);
			setSuccess(t("mfa.disableSuccess"));
		} catch (err) {
			setError(err instanceof Error ? err.message : t("mfa.disableFailed"));
		}
	};
	// 重置流程状态（当用户切换标签页或重新启用时）
	useEffect(() => {
		if (!mfaEnabled) return;
		setQrCodeDataUrl(null);
		setSecret(null);
		setTotpCode("");
	}, [mfaEnabled]);
	// 已启用状态：显示状态 + 禁用按钮
	if (mfaEnabled || recoveryCodes) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ _jsxDEV(ShieldCheck, { className: "h-5 w-5 text-green-600" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 152,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("mfa.title") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 153,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 151,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("mfa.enabledDesc") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 155,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 150,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [
				success && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-green-600",
					children: success
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 158,
					columnNumber: 23
				}, this),
				error && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-destructive",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 159,
					columnNumber: 21
				}, this),
				recoveryCodes && /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950",
					children: [
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm font-medium",
							children: t("mfa.recoveryCodesWarning")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 162,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "grid grid-cols-2 gap-2 font-mono text-sm",
							children: recoveryCodes.map((code) => /* @__PURE__ */ _jsxDEV("code", { children: code }, code, false, {
								fileName: _jsxFileName,
								lineNumber: 165,
								columnNumber: 19
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 163,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							onClick: copyRecoveryCodes,
							children: t("mfa.recoveryCodesCopy")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 168,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 161,
					columnNumber: 13
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800",
							children: [/* @__PURE__ */ _jsxDEV(ShieldCheck, { className: "h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 175,
								columnNumber: 15
							}, this), t("mfa.statusEnabled")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 174,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: handleDisable,
							disabled: disableMutation.isPending,
							children: [disableMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 179,
								columnNumber: 44
							}, this) : /* @__PURE__ */ _jsxDEV(ShieldOff, { className: "h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 179,
								columnNumber: 91
							}, this), /* @__PURE__ */ _jsxDEV("span", {
								className: "ml-2",
								children: t("mfa.disable")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 180,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 178,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => {
								setShowRecoveryRegenerate((current) => !current);
								setError("");
							},
							disabled: recoveryCodesMutation.isPending,
							children: t("mfa.recoveryCodesRegenerate")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 182,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 173,
					columnNumber: 11
				}, this),
				showRecoveryRegenerate && /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2 rounded-md border p-3",
					children: [/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "recoveryTotpCode",
						children: t("mfa.recoveryCodesRegenerateDesc")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 195,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ _jsxDEV(Input, {
							id: "recoveryTotpCode",
							value: recoveryTotpCode,
							onChange: (event) => setRecoveryTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6)),
							placeholder: "000000",
							maxLength: 6,
							inputMode: "numeric",
							autoComplete: "one-time-code"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 197,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							type: "button",
							onClick: handleRegenerateRecoveryCodes,
							disabled: recoveryCodesMutation.isPending || recoveryTotpCode.length !== 6,
							children: t("mfa.recoveryCodesConfirmRegenerate")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 206,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 196,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 194,
					columnNumber: 13
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 157,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 149,
			columnNumber: 7
		}, this);
	}
	// 未启用 + 未初始化：显示"启用 MFA"按钮
	if (!qrCodeDataUrl) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ _jsxDEV(Shield, { className: "h-5 w-5" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 227,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("mfa.title") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 228,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 226,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("mfa.enableDesc") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 230,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 225,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [error && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-destructive",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 233,
				columnNumber: 21
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				onClick: handleSetup,
				disabled: setupMutation.isPending,
				children: [setupMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 235,
					columnNumber: 40
				}, this) : /* @__PURE__ */ _jsxDEV(Shield, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 235,
					columnNumber: 87
				}, this), /* @__PURE__ */ _jsxDEV("span", {
					className: "ml-2",
					children: t("mfa.enable")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 236,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 234,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 232,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 224,
			columnNumber: 7
		}, this);
	}
	// 未启用 + 已生成 QR 码：显示 QR 码 + 手动密钥 + 验证码输入
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ _jsxDEV(Shield, { className: "h-5 w-5" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 248,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("mfa.configTitle") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 249,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 247,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("mfa.configDesc") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 251,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 246,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex justify-center",
				children: qrCodeDataUrl ? /* @__PURE__ */ _jsxDEV("img", {
					src: qrCodeDataUrl,
					alt: t("mfa.qrAlt"),
					className: "border rounded"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 257,
					columnNumber: 13
				}, this) : /* @__PURE__ */ _jsxDEV("canvas", { ref: qrCanvasRef }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 259,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 255,
				columnNumber: 9
			}, this),
			secret && /* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("mfa.manualKeyLabel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 266,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-2 rounded bg-muted px-3 py-2 font-mono text-sm",
					children: [/* @__PURE__ */ _jsxDEV("code", {
						className: "flex-1 break-all",
						children: secret
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 268,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => {
							navigator.clipboard.writeText(secret);
							setSuccess(t("mfa.copied"));
							setTimeout(() => setSuccess(""), 2e3);
						},
						children: t("mfa.copy")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 269,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 267,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 265,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					htmlFor: "totpCode",
					children: t("mfa.codeLabel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 286,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					id: "totpCode",
					value: totpCode,
					onChange: (e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
					placeholder: "000000",
					maxLength: 6,
					inputMode: "numeric",
					autoComplete: "one-time-code"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 287,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 285,
				columnNumber: 9
			}, this),
			error && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-destructive",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 298,
				columnNumber: 19
			}, this),
			success && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-green-600",
				children: success
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 299,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ _jsxDEV(Button, {
					onClick: handleConfirm,
					disabled: confirmMutation.isPending || totpCode.length !== 6,
					children: [confirmMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 303,
						columnNumber: 42
					}, this) : null, t("mfa.confirmEnable")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 302,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					onClick: () => {
						setQrCodeDataUrl(null);
						setSecret(null);
						setTotpCode("");
						setError("");
					},
					children: t("common.cancel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 306,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 301,
				columnNumber: 9
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 253,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 245,
		columnNumber: 5
	}, this);
}
_s(MfaSettingsPanel, "x2EWX0lR97j9GWmiHA7FV1C6eYc=", false, function() {
	return [
		useTranslation,
		useAuthStore,
		useMfaSetup,
		useMfaConfirm,
		useMfaDisable,
		useMfaRecoveryCodesRegenerate
	];
});
_c = MfaSettingsPanel;
var _c;
$RefreshReg$(_c, "MfaSettingsPanel");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/MfaSettingsPanel.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/MfaSettingsPanel.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/MfaSettingsPanel.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/MfaSettingsPanel.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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Vyx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUEwQjtHQUFXOzs7OztHQUU5RCx3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUFmLENBQ0Usd0JBQUMsUUFBRDtLQUFRLFNBQVM7S0FBZSxVQUFVLGdCQUFnQixhQUFhLFNBQVMsV0FBVztlQUEzRixDQUNHLGdCQUFnQixZQUFZLHdCQUFDLFNBQUQsRUFBUyxXQUFVLHVCQUF3Qjs7OztnQkFBSSxNQUMzRSxFQUFFLG1CQUFtQixDQUNoQjs7Ozs7Y0FDUix3QkFBQyxRQUFEO0tBQ0UsU0FBUTtLQUNSLGVBQWU7TUFDYixpQkFBaUIsSUFBSTtNQUNyQixVQUFVLElBQUk7TUFDZCxZQUFZLEVBQUU7TUFDZCxTQUFTLEVBQUU7S0FDYjtlQUVDLEVBQUUsZUFBZTtJQUNaOzs7O1lBQ0w7Ozs7OztFQUNNOzs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIk1mYVNldHRpbmdzUGFuZWwudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTUZB77yI5aSa5Zug57Sg6K6k6K+B77yJ6K6+572u6Z2i5p2/XG4gKlxuICog5o+Q5L6bIE1GQSDnmoTlrozmlbTlkK/nlKgv56aB55So5rWB56iLIFVJ77yaXG4gKiAgIC0g5pyq5ZCv55So77ya5pi+56S6XCLlkK/nlKggTUZBXCLmjInpkq7vvIzngrnlh7vlkI7osIPnlKggL2F1dGgvbWZhL3NldHVwIOiOt+WPliBRUiDnoIEgVVJJXG4gKiAgICAg4oaSIOa4suafkyBRUiDnoIHlm77niYfkvpsgYXV0aGVudGljYXRvciDmiavmj48g4oaSIOeUqOaIt+i+k+WFpemqjOivgeeggeehruiupCDihpIg5q2j5byP5ZCv55SoXG4gKiAgIC0g5bey5ZCv55So77ya5pi+56S6XCLlt7LlkK/nlKhcIueKtuaAgeOAgeaBouWkjeeggeeuoeeQhuWSjFwi56aB55SoIE1GQVwi5oyJ6ZKuXG4gKlxuICog5a6J5YWo6K+05piO77yaXG4gKiAgIC0gUVIg56CBIFVSSSDmnaXoh6rlkI7nq6/vvIhvdHBhdXRoOi8vIOagvOW8j++8ie+8jOWJjeerr+S7hei0n+i0o+a4suafk++8jOS4jeS/ruaUueWFtuWGheWuuVxuICogICAtIOS4tOaXtuWvhumSpeWtmCBSZWRpc++8iDEwIOWIhumSn+i/h+acn++8ie+8jOehruiupOWQjuaJjeWGmeWFpeaVsOaNruW6k++8jOmYsuatouWNiuWQr+eUqOeKtuaAgVxuICogICAtIOaZrumAmuinkuiJsuemgeeUqCBNRkEg5pe25riF6ZmkIFRvdHBTZWNyZXTvvJvnlJ/kuqflvLrliLbop5LoibLnmoTnpoHnlKjor7fmsYLnlLHlkI7nq6/mi5Lnu51cbiAqL1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZVJlZiwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vdWkvbGFiZWwnO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmREZXNjcmlwdGlvbiwgQ2FyZEhlYWRlciwgQ2FyZFRpdGxlIH0gZnJvbSAnLi4vdWkvY2FyZCc7XG5pbXBvcnQgeyBTaGllbGQsIFNoaWVsZENoZWNrLCBTaGllbGRPZmYsIExvYWRlcjIgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuXG4vLyBSZWFjdCBDb21waWxlciDkuKXmoLzop4TliJnlnKjor6UgZWZmZWN0IOS4jemAgueUqO+8mnN0YXRlIOmHjee9ruaYr+eUqOaIt+WIh+aNouagh+etvumhteeahOWJr+S9nOeUqO+8jOaXoOe6p+iBlOa4suafk+mjjumZqVxuLy8g5paH5Lu257qn56aB55So6YG/5YWN5Zyo5q+P5LiqIHNldFN0YXRlIOS4iumHjeWkjSBkaXNhYmxlIOazqOmHilxuLyogZXNsaW50LWRpc2FibGUgcmVhY3QtaG9va3Mvc2V0LXN0YXRlLWluLWVmZmVjdCAqL1xuaW1wb3J0IHsgdXNlQXV0aFN0b3JlIH0gZnJvbSAnLi4vLi4vc3RvcmVzL2F1dGhTdG9yZSc7XG5pbXBvcnQge1xuICB1c2VNZmFTZXR1cCxcbiAgdXNlTWZhQ29uZmlybSxcbiAgdXNlTWZhRGlzYWJsZSxcbiAgdXNlTWZhUmVjb3ZlcnlDb2Rlc1JlZ2VuZXJhdGUsXG59IGZyb20gJy4uLy4uL2hvb2tzL3VzZU1mYSc7XG5pbXBvcnQgUVJDb2RlIGZyb20gJ3FyY29kZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE1mYVNldHRpbmdzUGFuZWwoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgdXNlciA9IHVzZUF1dGhTdG9yZSgocykgPT4gcy51c2VyKTtcbiAgY29uc3QgbWZhRW5hYmxlZCA9IHVzZXI/Lm1mYUVuYWJsZWQgPz8gZmFsc2U7XG5cbiAgLy8gTUZBIOWQr+eUqOa1geeoi+eKtuaAgVxuICBjb25zdCBbcXJDb2RlRGF0YVVybCwgc2V0UXJDb2RlRGF0YVVybF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3NlY3JldCwgc2V0U2VjcmV0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbdG90cENvZGUsIHNldFRvdHBDb2RlXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtzdWNjZXNzLCBzZXRTdWNjZXNzXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3JlY292ZXJ5Q29kZXMsIHNldFJlY292ZXJ5Q29kZXNdID0gdXNlU3RhdGU8c3RyaW5nW10gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3Nob3dSZWNvdmVyeVJlZ2VuZXJhdGUsIHNldFNob3dSZWNvdmVyeVJlZ2VuZXJhdGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbcmVjb3ZlcnlUb3RwQ29kZSwgc2V0UmVjb3ZlcnlUb3RwQ29kZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IHFyQ2FudmFzUmVmID0gdXNlUmVmPEhUTUxDYW52YXNFbGVtZW50PihudWxsKTtcblxuICBjb25zdCBzZXR1cE11dGF0aW9uID0gdXNlTWZhU2V0dXAoKTtcbiAgY29uc3QgY29uZmlybU11dGF0aW9uID0gdXNlTWZhQ29uZmlybSgpO1xuICBjb25zdCBkaXNhYmxlTXV0YXRpb24gPSB1c2VNZmFEaXNhYmxlKCk7XG4gIGNvbnN0IHJlY292ZXJ5Q29kZXNNdXRhdGlvbiA9IHVzZU1mYVJlY292ZXJ5Q29kZXNSZWdlbmVyYXRlKCk7XG5cbiAgLyoqIOeCueWHu1wi5ZCv55SoIE1GQVwi5ZCO77yM6LCD55So5ZCO56uv55Sf5oiQ5a+G6ZKl5bm25riy5p+TIFFSIOeggSAqL1xuICBjb25zdCBoYW5kbGVTZXR1cCA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRFcnJvcignJyk7XG4gICAgc2V0U3VjY2VzcygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzZXR1cE11dGF0aW9uLm11dGF0ZUFzeW5jKCk7XG4gICAgICBzZXRTZWNyZXQoZGF0YS5zZWNyZXQpO1xuICAgICAgLy8g5bCGIG90cGF1dGg6Ly8gVVJJIOa4suafk+S4uiBRUiDnoIEgRGF0YSBVUkzvvIhjYW52YXMg6L6T5Ye6IFBOR++8iVxuICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IFFSQ29kZS50b0RhdGFVUkwoZGF0YS5xckNvZGVVcmksIHtcbiAgICAgICAgd2lkdGg6IDI0MCxcbiAgICAgICAgbWFyZ2luOiAyLFxuICAgICAgICBjb2xvcjogeyBkYXJrOiAnIzAwMDAwMCcsIGxpZ2h0OiAnI2ZmZmZmZicgfSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6ICdNJywgLy8g5Lit562J57qg6ZSZ77yM5YW86aG+5bC65a+45ZKM5a656ZSZXG4gICAgICB9KTtcbiAgICAgIHNldFFyQ29kZURhdGFVcmwoZGF0YVVybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRFcnJvcih0KCdtZmEuc2V0dXBGYWlsZWQnKSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDnlKjmiLfmiavnoIHlkI7ovpPlhaXpqozor4HnoIHvvIzmj5DkuqTnoa7orqTlkK/nlKggTUZBICovXG4gIGNvbnN0IGhhbmRsZUNvbmZpcm0gPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCEvXlxcZHs2fSQvLnRlc3QodG90cENvZGUpKSB7XG4gICAgICBzZXRFcnJvcih0KCdtZmEuY29kZUludmFsaWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldEVycm9yKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25maXJtTXV0YXRpb24ubXV0YXRlQXN5bmMoeyB0b3RwQ29kZSB9KTtcbiAgICAgIHNldFN1Y2Nlc3ModCgnbWZhLmVuYWJsZVN1Y2Nlc3MnKSk7XG4gICAgICBzZXRSZWNvdmVyeUNvZGVzKHJlc3BvbnNlLnJlY292ZXJ5Q29kZXMpO1xuICAgICAgc2V0UXJDb2RlRGF0YVVybChudWxsKTtcbiAgICAgIHNldFNlY3JldChudWxsKTtcbiAgICAgIHNldFRvdHBDb2RlKCcnKTtcbiAgICB9IGNhdGNoIChlcnI6IHVua25vd24pIHtcbiAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiB0KCdtZmEuY29kZUVycm9yJyk7XG4gICAgICBzZXRFcnJvcihtc2cpO1xuICAgIH1cbiAgfTtcblxuICAvKiog5L2/55So5b2T5YmNIFRPVFAg6aqM6K+B56CB6YeN5paw55Sf5oiQ5oGi5aSN56CB77yM5pen5oGi5aSN56CB5Lya5YWo6YOo5aSx5pWI44CCICovXG4gIGNvbnN0IGhhbmRsZVJlZ2VuZXJhdGVSZWNvdmVyeUNvZGVzID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghL15cXGR7Nn0kLy50ZXN0KHJlY292ZXJ5VG90cENvZGUpKSB7XG4gICAgICBzZXRFcnJvcih0KCdtZmEuY29kZUludmFsaWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0RXJyb3IoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlY292ZXJ5Q29kZXNNdXRhdGlvbi5tdXRhdGVBc3luYyh7IHRvdHBDb2RlOiByZWNvdmVyeVRvdHBDb2RlIH0pO1xuICAgICAgc2V0UmVjb3ZlcnlDb2RlcyhyZXNwb25zZS5yZWNvdmVyeUNvZGVzKTtcbiAgICAgIHNldFJlY292ZXJ5VG90cENvZGUoJycpO1xuICAgICAgc2V0U2hvd1JlY292ZXJ5UmVnZW5lcmF0ZShmYWxzZSk7XG4gICAgICBzZXRTdWNjZXNzKHQoJ21mYS5yZWNvdmVyeUNvZGVzR2VuZXJhdGVkJykpO1xuICAgIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgICAgc2V0RXJyb3IoZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IHQoJ21mYS5yZWNvdmVyeUNvZGVzR2VuZXJhdGVGYWlsZWQnKSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDlsIbmgaLlpI3noIHlpI3liLbkuLrpgJDooYzmlofmnKzvvIzkvr/kuo7kv53lrZjliLDlr4bnoIHnrqHnkIblmajjgIIgKi9cbiAgY29uc3QgY29weVJlY292ZXJ5Q29kZXMgPSAoKSA9PiB7XG4gICAgaWYgKCFyZWNvdmVyeUNvZGVzKSByZXR1cm47XG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZD8ud3JpdGVUZXh0KHJlY292ZXJ5Q29kZXMuam9pbignXFxuJykpO1xuICAgIHNldFN1Y2Nlc3ModCgnbWZhLnJlY292ZXJ5Q29kZXNDb3BpZWQnKSk7XG4gIH07XG5cbiAgLyoqIOemgeeUqCBNRkEgKi9cbiAgY29uc3QgaGFuZGxlRGlzYWJsZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKHQoJ21mYS5kaXNhYmxlQ29uZmlybScpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRFcnJvcignJyk7XG4gICAgc2V0U3VjY2VzcygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGRpc2FibGVNdXRhdGlvbi5tdXRhdGVBc3luYygpO1xuICAgICAgc2V0UmVjb3ZlcnlDb2RlcyhudWxsKTtcbiAgICAgIHNldFNob3dSZWNvdmVyeVJlZ2VuZXJhdGUoZmFsc2UpO1xuICAgICAgc2V0U3VjY2Vzcyh0KCdtZmEuZGlzYWJsZVN1Y2Nlc3MnKSk7XG4gICAgfSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG4gICAgICBzZXRFcnJvcihlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogdCgnbWZhLmRpc2FibGVGYWlsZWQnKSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIOmHjee9rua1geeoi+eKtuaAge+8iOW9k+eUqOaIt+WIh+aNouagh+etvumhteaIlumHjeaWsOWQr+eUqOaXtu+8iVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghbWZhRW5hYmxlZCkgcmV0dXJuO1xuICAgIHNldFFyQ29kZURhdGFVcmwobnVsbCk7XG4gICAgc2V0U2VjcmV0KG51bGwpO1xuICAgIHNldFRvdHBDb2RlKCcnKTtcbiAgfSwgW21mYUVuYWJsZWRdKTtcblxuICAvLyDlt7LlkK/nlKjnirbmgIHvvJrmmL7npLrnirbmgIEgKyDnpoHnlKjmjInpkq5cbiAgaWYgKG1mYUVuYWJsZWQgfHwgcmVjb3ZlcnlDb2Rlcykge1xuICAgIHJldHVybiAoXG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgPFNoaWVsZENoZWNrIGNsYXNzTmFtZT1cImgtNSB3LTUgdGV4dC1ncmVlbi02MDBcIiAvPlxuICAgICAgICAgICAgPENhcmRUaXRsZT57dCgnbWZhLnRpdGxlJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPENhcmREZXNjcmlwdGlvbj57dCgnbWZhLmVuYWJsZWREZXNjJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgIHtzdWNjZXNzICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmVlbi02MDBcIj57c3VjY2Vzc308L3A+fVxuICAgICAgICAgIHtlcnJvciAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3J9PC9wPn1cbiAgICAgICAgICB7cmVjb3ZlcnlDb2RlcyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMyByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItYW1iZXItMzAwIGJnLWFtYmVyLTUwIHAtMyB0ZXh0LWFtYmVyLTk1MFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+e3QoJ21mYS5yZWNvdmVyeUNvZGVzV2FybmluZycpfTwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC0yIGZvbnQtbW9ubyB0ZXh0LXNtXCI+XG4gICAgICAgICAgICAgICAge3JlY292ZXJ5Q29kZXMubWFwKChjb2RlKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8Y29kZSBrZXk9e2NvZGV9Pntjb2RlfTwvY29kZT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgb25DbGljaz17Y29weVJlY292ZXJ5Q29kZXN9PlxuICAgICAgICAgICAgICAgIHt0KCdtZmEucmVjb3ZlcnlDb2Rlc0NvcHknKX1cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC1tZCBiZy1ncmVlbi01MCBweC0zIHB5LTIgdGV4dC1zbSB0ZXh0LWdyZWVuLTgwMFwiPlxuICAgICAgICAgICAgICA8U2hpZWxkQ2hlY2sgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgIHt0KCdtZmEuc3RhdHVzRW5hYmxlZCcpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgb25DbGljaz17aGFuZGxlRGlzYWJsZX0gZGlzYWJsZWQ9e2Rpc2FibGVNdXRhdGlvbi5pc1BlbmRpbmd9PlxuICAgICAgICAgICAgICB7ZGlzYWJsZU11dGF0aW9uLmlzUGVuZGluZyA/IDxMb2FkZXIyIGNsYXNzTmFtZT1cImgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8U2hpZWxkT2ZmIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPn1cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMlwiPnt0KCdtZmEuZGlzYWJsZScpfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICB2YXJpYW50PVwib3V0bGluZVwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRTaG93UmVjb3ZlcnlSZWdlbmVyYXRlKChjdXJyZW50KSA9PiAhY3VycmVudCk7XG4gICAgICAgICAgICAgICAgc2V0RXJyb3IoJycpO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBkaXNhYmxlZD17cmVjb3ZlcnlDb2Rlc011dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3QoJ21mYS5yZWNvdmVyeUNvZGVzUmVnZW5lcmF0ZScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAge3Nob3dSZWNvdmVyeVJlZ2VuZXJhdGUgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTIgcm91bmRlZC1tZCBib3JkZXIgcC0zXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBodG1sRm9yPVwicmVjb3ZlcnlUb3RwQ29kZVwiPnt0KCdtZmEucmVjb3ZlcnlDb2Rlc1JlZ2VuZXJhdGVEZXNjJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInJlY292ZXJ5VG90cENvZGVcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e3JlY292ZXJ5VG90cENvZGV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGV2ZW50KSA9PiBzZXRSZWNvdmVyeVRvdHBDb2RlKGV2ZW50LnRhcmdldC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnNsaWNlKDAsIDYpKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiMDAwMDAwXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17Nn1cbiAgICAgICAgICAgICAgICAgIGlucHV0TW9kZT1cIm51bWVyaWNcIlxuICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib25lLXRpbWUtY29kZVwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVJlZ2VuZXJhdGVSZWNvdmVyeUNvZGVzfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3JlY292ZXJ5Q29kZXNNdXRhdGlvbi5pc1BlbmRpbmcgfHwgcmVjb3ZlcnlUb3RwQ29kZS5sZW5ndGggIT09IDZ9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3QoJ21mYS5yZWNvdmVyeUNvZGVzQ29uZmlybVJlZ2VuZXJhdGUnKX1cbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICAvLyDmnKrlkK/nlKggKyDmnKrliJ3lp4vljJbvvJrmmL7npLpcIuWQr+eUqCBNRkFcIuaMiemSrlxuICBpZiAoIXFyQ29kZURhdGFVcmwpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPENhcmQ+XG4gICAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxTaGllbGQgY2xhc3NOYW1lPVwiaC01IHctNVwiIC8+XG4gICAgICAgICAgICA8Q2FyZFRpdGxlPnt0KCdtZmEudGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPnt0KCdtZmEuZW5hYmxlRGVzYycpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7ZXJyb3IgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9yfTwvcD59XG4gICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVTZXR1cH0gZGlzYWJsZWQ9e3NldHVwTXV0YXRpb24uaXNQZW5kaW5nfT5cbiAgICAgICAgICAgIHtzZXR1cE11dGF0aW9uLmlzUGVuZGluZyA/IDxMb2FkZXIyIGNsYXNzTmFtZT1cImgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8U2hpZWxkIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPn1cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTJcIj57dCgnbWZhLmVuYWJsZScpfTwvc3Bhbj5cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgIDwvQ2FyZD5cbiAgICApO1xuICB9XG5cbiAgLy8g5pyq5ZCv55SoICsg5bey55Sf5oiQIFFSIOegge+8muaYvuekuiBRUiDnoIEgKyDmiYvliqjlr4bpkqUgKyDpqozor4HnoIHovpPlhaVcbiAgcmV0dXJuIChcbiAgICA8Q2FyZD5cbiAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPFNoaWVsZCBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cbiAgICAgICAgICA8Q2FyZFRpdGxlPnt0KCdtZmEuY29uZmlnVGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ21mYS5jb25maWdEZXNjJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgIHsvKiBRUiDnoIHlm77niYfvvIhjYW52YXMg5riy5p+T77yJICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICB7cXJDb2RlRGF0YVVybCA/IChcbiAgICAgICAgICAgIDxpbWcgc3JjPXtxckNvZGVEYXRhVXJsfSBhbHQ9e3QoJ21mYS5xckFsdCcpfSBjbGFzc05hbWU9XCJib3JkZXIgcm91bmRlZFwiIC8+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxjYW52YXMgcmVmPXtxckNhbnZhc1JlZn0gLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7Lyog5omL5Yqo6L6T5YWl5a+G6ZKl77yI5peg5rOV5omr56CB5pe255qE5aSH6YCJ5pa55qGI77yJICovfVxuICAgICAgICB7c2VjcmV0ICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ21mYS5tYW51YWxLZXlMYWJlbCcpfTwvTGFiZWw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHJvdW5kZWQgYmctbXV0ZWQgcHgtMyBweS0yIGZvbnQtbW9ubyB0ZXh0LXNtXCI+XG4gICAgICAgICAgICAgIDxjb2RlIGNsYXNzTmFtZT1cImZsZXgtMSBicmVhay1hbGxcIj57c2VjcmV0fTwvY29kZT5cbiAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJnaG9zdFwiXG4gICAgICAgICAgICAgICAgc2l6ZT1cInNtXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChzZWNyZXQpO1xuICAgICAgICAgICAgICAgICAgc2V0U3VjY2Vzcyh0KCdtZmEuY29waWVkJykpO1xuICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRTdWNjZXNzKCcnKSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt0KCdtZmEuY29weScpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiDpqozor4HnoIHovpPlhaUgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJ0b3RwQ29kZVwiPnt0KCdtZmEuY29kZUxhYmVsJyl9PC9MYWJlbD5cbiAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgIGlkPVwidG90cENvZGVcIlxuICAgICAgICAgICAgdmFsdWU9e3RvdHBDb2RlfVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRUb3RwQ29kZShlLnRhcmdldC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnNsaWNlKDAsIDYpKX1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiMDAwMDAwXCJcbiAgICAgICAgICAgIG1heExlbmd0aD17Nn1cbiAgICAgICAgICAgIGlucHV0TW9kZT1cIm51bWVyaWNcIlxuICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib25lLXRpbWUtY29kZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge2Vycm9yICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcn08L3A+fVxuICAgICAgICB7c3VjY2VzcyAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JlZW4tNjAwXCI+e3N1Y2Nlc3N9PC9wPn1cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNvbmZpcm19IGRpc2FibGVkPXtjb25maXJtTXV0YXRpb24uaXNQZW5kaW5nIHx8IHRvdHBDb2RlLmxlbmd0aCAhPT0gNn0+XG4gICAgICAgICAgICB7Y29uZmlybU11dGF0aW9uLmlzUGVuZGluZyA/IDxMb2FkZXIyIGNsYXNzTmFtZT1cImgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiBudWxsfVxuICAgICAgICAgICAge3QoJ21mYS5jb25maXJtRW5hYmxlJyl9XG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgdmFyaWFudD1cIm91dGxpbmVcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBzZXRRckNvZGVEYXRhVXJsKG51bGwpO1xuICAgICAgICAgICAgICBzZXRTZWNyZXQobnVsbCk7XG4gICAgICAgICAgICAgIHNldFRvdHBDb2RlKCcnKTtcbiAgICAgICAgICAgICAgc2V0RXJyb3IoJycpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7dCgnY29tbW9uLmNhbmNlbCcpfVxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgPC9DYXJkPlxuICApO1xufVxuIl19