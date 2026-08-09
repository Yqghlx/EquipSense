import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/LoginPage.tsx");const useState = __vite__cjsImport5_react["useState"];const QRCode = __vite__cjsImport14_qrcode;const _jsxDEV = __vite__cjsImport15_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport15_react_jsxDevRuntime["Fragment"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useNavigate, useLocation, Link } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { ChangePasswordDialog } from "/src/components/auth/ChangePasswordDialog.tsx";
import api from "/src/lib/api.ts";
import { useAuthStore } from "/src/stores/authStore.ts";
import { persistTokenExpiry } from "/src/lib/tokenExpiry.ts";
import __vite__cjsImport14_qrcode from "/node_modules/.vite/deps/qrcode.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/LoginPage.tsx";
import __vite__cjsImport15_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 登录页面组件
*
* 两阶段登录流程：
*   1. 密码验证：提交用户名/密码
*   2. MFA 验证（仅当用户启用了 MFA）：提交 authenticator 生成的 6 位 TOTP 验证码
*
* 认证 Cookie 由后端在每次成功响应时自动通过 Set-Cookie 设置。
*/
export default function LoginPage() {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const setAuth = useAuthStore((s) => s.setAuth);
	const initialLocationState = location.state ?? {};
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [mustChangePassword, setMustChangePassword] = useState(false);
	// MFA 阶段状态
	const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
	const [mfaUserInfo, setMfaUserInfo] = useState(null);
	// 高权限角色首次登录的强制 MFA 注册状态
	const [mfaEnrollmentToken, setMfaEnrollmentToken] = useState(initialLocationState.mfaEnrollmentToken ?? null);
	const [mfaEnrollmentUserInfo, setMfaEnrollmentUserInfo] = useState(initialLocationState.mfaEnrollmentUserInfo ?? null);
	const [mfaEnrollmentSetup, setMfaEnrollmentSetup] = useState(null);
	const [mfaEnrollmentQrCode, setMfaEnrollmentQrCode] = useState(null);
	const [mfaEnrollmentCode, setMfaEnrollmentCode] = useState("");
	const [mfaEnrollmentRecoveryCodes, setMfaEnrollmentRecoveryCodes] = useState(null);
	const [mfaEnrollmentAuthenticated, setMfaEnrollmentAuthenticated] = useState(false);
	/** 登录表单校验规则 */
	const loginSchema = z.object({
		username: z.string().min(1, t("auth.usernameRequired")),
		password: z.string().min(1, t("auth.passwordRequired"))
	});
	/** TOTP 验证码校验规则：6 位数字 */
	const totpSchema = z.object({ totpCode: z.string().refine((value) => /^\d{6}$/.test(value) || /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/i.test(value), t("mfa.codeOrRecoveryCodeInvalid")) });
	const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });
	const { register: registerTotp, handleSubmit: handleSubmitTotp, formState: { errors: totpErrors } } = useForm({ resolver: zodResolver(totpSchema) });
	/** 提交登录表单（第一阶段：密码验证） */
	const onSubmit = async (data) => {
		setLoading(true);
		setError("");
		try {
			const response = await api.post("/auth/login", data);
			// 检查是否需要 MFA 二次验证
			if (response.data.mfaRequired && response.data.mfaChallengeToken) {
				setMfaChallengeToken(response.data.mfaChallengeToken);
				setMfaUserInfo(response.data.userInfo);
				setLoading(false);
				return;
			}
			// 生产高权限账户首次登录必须先完成 MFA 注册，整个流程仍不持有 JWT。
			if (response.data.mfaEnrollmentRequired && response.data.mfaEnrollmentToken) {
				setMfaEnrollmentToken(response.data.mfaEnrollmentToken);
				setMfaEnrollmentUserInfo(response.data.userInfo);
				setLoading(false);
				return;
			}
			// 无需 MFA，直接完成登录
			setAuth(response.data.userInfo);
			// 持久化令牌【绝对过期时间戳】，供 useTokenRefresh 计算主动刷新时机。
			// 必须使用后端实际返回的 expiresIn（受 #200 可配置 AccessTokenMinutes 影响，10~1440s），
			// 不能用前端默认值，否则主动刷新被排到错误时刻。
			persistTokenExpiry(response.data.expiresIn);
			// 认证 Cookie 由后端登录响应自动设置
			if (response.data.userInfo.mustChangePassword) {
				setMustChangePassword(true);
			} else {
				const from = location.state?.from || "/dashboard";
				navigate(from, { replace: true });
			}
		} catch {
			setError(t("auth.loginError"));
		} finally {
			setLoading(false);
		}
	};
	/** 生成强制 MFA 注册二维码 */
	const setupMfaEnrollment = async () => {
		if (!mfaEnrollmentToken) return;
		setLoading(true);
		setError("");
		try {
			const response = await api.post("/auth/mfa/enroll/setup", { enrollmentToken: mfaEnrollmentToken });
			setMfaEnrollmentSetup(response.data);
			const dataUrl = await QRCode.toDataURL(response.data.qrCodeUri, {
				width: 240,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#ffffff"
				},
				errorCorrectionLevel: "M"
			});
			setMfaEnrollmentQrCode(dataUrl);
		} catch {
			setError(t("mfa.enrollmentSetupFailed"));
		} finally {
			setLoading(false);
		}
	};
	/** 确认强制 MFA 注册并完成登录 */
	const onMfaEnrollmentSubmit = async () => {
		if (!mfaEnrollmentToken) return;
		if (!/^\d{6}$/.test(mfaEnrollmentCode)) {
			setError(t("mfa.codeInvalid"));
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await api.post("/auth/mfa/enroll/confirm", {
				enrollmentToken: mfaEnrollmentToken,
				totpCode: mfaEnrollmentCode
			});
			setAuth(response.data.userInfo);
			persistTokenExpiry(response.data.expiresIn);
			if (response.data.mfaRecoveryCodes?.length) {
				setMfaEnrollmentRecoveryCodes(response.data.mfaRecoveryCodes);
				setMfaEnrollmentAuthenticated(true);
			} else {
				const from = location.state?.from || "/dashboard";
				navigate(from, { replace: true });
			}
		} catch {
			setError(t("mfa.enrollmentConfirmFailed"));
		} finally {
			setLoading(false);
		}
	};
	/** 提交 TOTP 验证码（第二阶段：MFA 验证） */
	const onMfaSubmit = async (data) => {
		if (!mfaChallengeToken) return;
		setLoading(true);
		setError("");
		try {
			const response = await api.post("/auth/mfa/verify", {
				challengeToken: mfaChallengeToken,
				totpCode: data.totpCode
			});
			setAuth(response.data.userInfo);
			// 持久化令牌过期时间戳（与密码登录路径一致），供 useTokenRefresh 主动刷新
			persistTokenExpiry(response.data.expiresIn);
			const from = location.state?.from || "/dashboard";
			navigate(from, { replace: true });
		} catch {
			setError("验证码错误，请检查 authenticator 应用中的时间是否准确");
		} finally {
			setLoading(false);
		}
	};
	/** 返回密码输入阶段（清空 MFA 状态） */
	const backToPassword = () => {
		setMfaChallengeToken(null);
		setMfaUserInfo(null);
		setError("");
	};
	/** 取消强制 MFA 注册并重新输入密码 */
	const backFromMfaEnrollment = () => {
		setMfaEnrollmentToken(null);
		setMfaEnrollmentUserInfo(null);
		setMfaEnrollmentSetup(null);
		setMfaEnrollmentQrCode(null);
		setMfaEnrollmentCode("");
		setMfaEnrollmentRecoveryCodes(null);
		setMfaEnrollmentAuthenticated(false);
		setError("");
	};
	/** 继续进入系统；恢复码已经在上一步展示过且不会再次返回。 */
	const continueAfterMfaEnrollment = () => {
		const from = location.state?.from || "/dashboard";
		navigate(from, { replace: true });
	};
	// 强制 MFA 注册阶段 UI
	if (mfaEnrollmentToken) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("mfa.enrollmentTitle") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 250,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: [t("mfa.enrollmentDesc"), mfaEnrollmentUserInfo && /* @__PURE__ */ _jsxDEV("span", {
			className: "block text-xs",
			children: mfaEnrollmentUserInfo.displayName || mfaEnrollmentUserInfo.username
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 254,
			columnNumber: 15
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 251,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 249,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [
				mfaEnrollmentRecoveryCodes ? /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: t("mfa.recoveryCodesWarning")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 263,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "grid grid-cols-2 gap-2 rounded bg-muted p-3 font-mono text-sm",
							children: mfaEnrollmentRecoveryCodes.map((code) => /* @__PURE__ */ _jsxDEV("code", { children: code }, code, false, {
								fileName: _jsxFileName,
								lineNumber: 266,
								columnNumber: 19
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 264,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							type: "button",
							variant: "outline",
							className: "w-full",
							onClick: () => navigator.clipboard?.writeText(mfaEnrollmentRecoveryCodes.join("\n")),
							children: t("mfa.recoveryCodesCopy")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 269,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							type: "button",
							onClick: continueAfterMfaEnrollment,
							className: "w-full",
							children: t("mfa.recoveryCodesContinue")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 277,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 262,
					columnNumber: 13
				}, this) : !mfaEnrollmentSetup ? /* @__PURE__ */ _jsxDEV(Button, {
					onClick: setupMfaEnrollment,
					className: "w-full",
					disabled: loading,
					children: loading ? t("common.loading") : t("mfa.enrollmentSetup")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 282,
					columnNumber: 13
				}, this) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
					/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("mfa.enrollmentConfigDesc")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 287,
						columnNumber: 15
					}, this),
					mfaEnrollmentQrCode && /* @__PURE__ */ _jsxDEV("div", {
						className: "flex justify-center",
						children: /* @__PURE__ */ _jsxDEV("img", {
							src: mfaEnrollmentQrCode,
							alt: t("mfa.qrAlt"),
							className: "rounded border"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 290,
							columnNumber: 19
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 289,
						columnNumber: 17
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "rounded bg-muted px-3 py-2 text-xs",
						children: [/* @__PURE__ */ _jsxDEV("span", {
							className: "text-muted-foreground",
							children: t("mfa.manualKeyLabel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 294,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("code", {
							className: "mt-1 block break-all font-mono",
							children: mfaEnrollmentSetup.secret
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 295,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 293,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, {
							htmlFor: "mfaEnrollmentCode",
							children: t("mfa.codeLabel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 298,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV(Input, {
							id: "mfaEnrollmentCode",
							value: mfaEnrollmentCode,
							onChange: (event) => setMfaEnrollmentCode(event.target.value.replace(/\D/g, "").slice(0, 6)),
							placeholder: "000000",
							maxLength: 6,
							inputMode: "numeric",
							autoComplete: "one-time-code",
							autoFocus: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 299,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 297,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ _jsxDEV(Button, {
						onClick: onMfaEnrollmentSubmit,
						className: "w-full",
						disabled: loading || mfaEnrollmentCode.length !== 6,
						children: loading ? t("common.loading") : t("mfa.enrollmentConfirm")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 310,
						columnNumber: 15
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 286,
					columnNumber: 13
				}, this),
				error && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-destructive",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 315,
					columnNumber: 21
				}, this),
				!mfaEnrollmentAuthenticated && /* @__PURE__ */ _jsxDEV(Button, {
					type: "button",
					variant: "ghost",
					className: "w-full",
					onClick: backFromMfaEnrollment,
					disabled: loading,
					children: t("mfa.enrollmentBack")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 317,
					columnNumber: 13
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 260,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 248,
			columnNumber: 7
		}, this);
	}
	// MFA 验证阶段 UI
	if (mfaChallengeToken) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("mfa.title") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 331,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: [t("mfa.loginDesc"), mfaUserInfo && /* @__PURE__ */ _jsxDEV("span", {
			className: "block text-xs",
			children: [
				t("mfa.loginUser"),
				": ",
				mfaUserInfo.displayName || mfaUserInfo.username
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 335,
			columnNumber: 15
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 332,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 330,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("form", {
			onSubmit: handleSubmitTotp(onMfaSubmit),
			className: "space-y-4",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, {
							htmlFor: "totpCode",
							children: t("mfa.loginCodeLabel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 344,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Input, {
							id: "totpCode",
							...registerTotp("totpCode"),
							placeholder: t("mfa.loginCodePlaceholder"),
							maxLength: 19,
							autoComplete: "one-time-code",
							inputMode: "text",
							autoFocus: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 345,
							columnNumber: 15
						}, this),
						totpErrors.totpCode && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: totpErrors.totpCode.message
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 354,
							columnNumber: 39
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 343,
					columnNumber: 13
				}, this),
				error && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-destructive",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 356,
					columnNumber: 23
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					className: "w-full",
					disabled: loading,
					children: loading ? t("common.loading") : t("mfa.verify")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 357,
					columnNumber: 13
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					type: "button",
					variant: "ghost",
					className: "w-full",
					onClick: backToPassword,
					disabled: loading,
					children: t("common.previous")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 360,
					columnNumber: 13
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 342,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 341,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 329,
			columnNumber: 7
		}, this);
	}
	// 密码输入阶段 UI
	return /* @__PURE__ */ _jsxDEV(Card, { children: [
		/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.login") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 373,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("auth.loginSubtitle") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 374,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 372,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("form", {
			onSubmit: handleSubmit(onSubmit),
			className: "space-y-4",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, {
							htmlFor: "username",
							children: t("auth.username")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 379,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Input, {
							id: "username",
							autoComplete: "username",
							...register("username"),
							placeholder: t("auth.username")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 380,
							columnNumber: 13
						}, this),
						errors.username && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: errors.username.message
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 381,
							columnNumber: 33
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 378,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, {
							htmlFor: "password",
							children: t("auth.password")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 384,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Input, {
							id: "password",
							type: "password",
							autoComplete: "current-password",
							...register("password"),
							placeholder: t("auth.password")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 385,
							columnNumber: 13
						}, this),
						errors.password && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: errors.password.message
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 386,
							columnNumber: 33
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 383,
					columnNumber: 11
				}, this),
				error && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-destructive",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 388,
					columnNumber: 21
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					className: "w-full",
					disabled: loading,
					children: loading ? t("common.loading") : t("auth.login")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 389,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-center text-sm",
					children: /* @__PURE__ */ _jsxDEV(Link, {
						to: "/forgot-password",
						className: "text-muted-foreground underline-offset-4 hover:underline",
						children: t("auth.forgotPassword", "忘记密码？")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 393,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 392,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-center text-sm text-muted-foreground",
					children: [
						t("register.noAccount"),
						" ",
						/* @__PURE__ */ _jsxDEV(Link, {
							to: "/register",
							className: "text-primary underline-offset-4 hover:underline",
							children: t("register.title")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 399,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 397,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 377,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 376,
			columnNumber: 7
		}, this),
		mustChangePassword && /* @__PURE__ */ _jsxDEV(ChangePasswordDialog, {
			forced: true,
			onSuccess: () => {
				setMustChangePassword(false);
				const from = location.state?.from || "/dashboard";
				navigate(from, { replace: true });
			}
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 406,
			columnNumber: 9
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 371,
		columnNumber: 5
	}, this);
}
_s(LoginPage, "aigkLcAHysLdeyUQuMsiJmprLq0=", false, function() {
	return [
		useTranslation,
		useNavigate,
		useLocation,
		useAuthStore,
		useForm,
		useForm
	];
});
_c = LoginPage;
var _c;
$RefreshReg$(_c, "LoginPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/LoginPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/LoginPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/LoginPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/LoginPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QkFBZ0I7TUFDZjs7Ozs7S0FDTDs7Ozs7O0dBQ0M7Ozs7O1dBQ0s7Ozs7O0VBQ1osc0JBQ0Msd0JBQUMsc0JBQUQ7R0FDRTtHQUNBLGlCQUFpQjtJQUNmLHNCQUFzQixLQUFLO0lBQzNCLE1BQU0sT0FBUSxTQUFTLE9BQTZCLFFBQVE7SUFDNUQsU0FBUyxNQUFNLEVBQUUsU0FBUyxLQUFLLENBQUM7R0FDbEM7RUFDRDs7Ozs7Q0FFQzs7Ozs7QUFFViIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJMb2dpblBhZ2UudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUZvcm0gfSBmcm9tICdyZWFjdC1ob29rLWZvcm0nO1xuaW1wb3J0IHsgem9kUmVzb2x2ZXIgfSBmcm9tICdAaG9va2Zvcm0vcmVzb2x2ZXJzL3pvZCc7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCB7IHVzZU5hdmlnYXRlLCB1c2VMb2NhdGlvbiwgTGluayB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9idXR0b24nO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9sYWJlbCc7XG5pbXBvcnQgeyBDYXJkLCBDYXJkQ29udGVudCwgQ2FyZEhlYWRlciwgQ2FyZFRpdGxlLCBDYXJkRGVzY3JpcHRpb24gfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2NhcmQnO1xuaW1wb3J0IHsgQ2hhbmdlUGFzc3dvcmREaWFsb2cgfSBmcm9tICcuLi9jb21wb25lbnRzL2F1dGgvQ2hhbmdlUGFzc3dvcmREaWFsb2cnO1xuaW1wb3J0IGFwaSBmcm9tICcuLi9saWIvYXBpJztcbmltcG9ydCB7IHVzZUF1dGhTdG9yZSB9IGZyb20gJy4uL3N0b3Jlcy9hdXRoU3RvcmUnO1xuaW1wb3J0IHsgcGVyc2lzdFRva2VuRXhwaXJ5IH0gZnJvbSAnLi4vbGliL3Rva2VuRXhwaXJ5JztcbmltcG9ydCB0eXBlIHsgQXV0aFJlc3BvbnNlLCBNZmFTZXR1cFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xuXG4vKiog55m75b2V6KGo5Y2V5pWw5o2u57G75Z6LICovXG50eXBlIExvZ2luRm9ybURhdGEgPSB7XG4gIHVzZXJuYW1lOiBzdHJpbmc7XG4gIHBhc3N3b3JkOiBzdHJpbmc7XG59O1xuXG4vKiogVE9UUCDpqozor4HnoIHooajljZXmlbDmja7nsbvlnosgKi9cbnR5cGUgVG90cEZvcm1EYXRhID0ge1xuICB0b3RwQ29kZTogc3RyaW5nO1xufTtcblxuLyoqIOeZu+W9lemhtei3r+eUseeKtuaAge+8jOazqOWGjOWujOaIkOWQjuWPr+aQuuW4puW8uuWItiBNRkEgZW5yb2xsbWVudCDmtYHnqIvnu6fnu63mk43kvZwgKi9cbnR5cGUgTG9naW5Mb2NhdGlvblN0YXRlID0ge1xuICBmcm9tPzogc3RyaW5nO1xuICBtZmFFbnJvbGxtZW50VG9rZW4/OiBzdHJpbmc7XG4gIG1mYUVucm9sbG1lbnRVc2VySW5mbz86IEF1dGhSZXNwb25zZVsndXNlckluZm8nXTtcbn07XG5cbi8qKlxuICog55m75b2V6aG16Z2i57uE5Lu2XG4gKlxuICog5Lik6Zi25q6155m75b2V5rWB56iL77yaXG4gKiAgIDEuIOWvhueggemqjOivge+8muaPkOS6pOeUqOaIt+WQjS/lr4bnoIFcbiAqICAgMi4gTUZBIOmqjOivge+8iOS7heW9k+eUqOaIt+WQr+eUqOS6hiBNRkHvvInvvJrmj5DkuqQgYXV0aGVudGljYXRvciDnlJ/miJDnmoQgNiDkvY0gVE9UUCDpqozor4HnoIFcbiAqXG4gKiDorqTor4EgQ29va2llIOeUseWQjuerr+WcqOavj+asoeaIkOWKn+WTjeW6lOaXtuiHquWKqOmAmui/hyBTZXQtQ29va2llIOiuvue9ruOAglxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBMb2dpblBhZ2UoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xuICBjb25zdCBsb2NhdGlvbiA9IHVzZUxvY2F0aW9uKCk7XG4gIGNvbnN0IHNldEF1dGggPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMuc2V0QXV0aCk7XG4gIGNvbnN0IGluaXRpYWxMb2NhdGlvblN0YXRlID0gKGxvY2F0aW9uLnN0YXRlID8/IHt9KSBhcyBMb2dpbkxvY2F0aW9uU3RhdGU7XG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttdXN0Q2hhbmdlUGFzc3dvcmQsIHNldE11c3RDaGFuZ2VQYXNzd29yZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gTUZBIOmYtuauteeKtuaAgVxuICBjb25zdCBbbWZhQ2hhbGxlbmdlVG9rZW4sIHNldE1mYUNoYWxsZW5nZVRva2VuXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbbWZhVXNlckluZm8sIHNldE1mYVVzZXJJbmZvXSA9IHVzZVN0YXRlPEF1dGhSZXNwb25zZVsndXNlckluZm8nXSB8IG51bGw+KG51bGwpO1xuXG4gIC8vIOmrmOadg+mZkOinkuiJsummluasoeeZu+W9leeahOW8uuWItiBNRkEg5rOo5YaM54q25oCBXG4gIGNvbnN0IFttZmFFbnJvbGxtZW50VG9rZW4sIHNldE1mYUVucm9sbG1lbnRUb2tlbl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihpbml0aWFsTG9jYXRpb25TdGF0ZS5tZmFFbnJvbGxtZW50VG9rZW4gPz8gbnVsbCk7XG4gIGNvbnN0IFttZmFFbnJvbGxtZW50VXNlckluZm8sIHNldE1mYUVucm9sbG1lbnRVc2VySW5mb10gPSB1c2VTdGF0ZTxBdXRoUmVzcG9uc2VbJ3VzZXJJbmZvJ10gfCBudWxsPihcbiAgICBpbml0aWFsTG9jYXRpb25TdGF0ZS5tZmFFbnJvbGxtZW50VXNlckluZm8gPz8gbnVsbCxcbiAgKTtcbiAgY29uc3QgW21mYUVucm9sbG1lbnRTZXR1cCwgc2V0TWZhRW5yb2xsbWVudFNldHVwXSA9IHVzZVN0YXRlPE1mYVNldHVwUmVzcG9uc2UgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW21mYUVucm9sbG1lbnRRckNvZGUsIHNldE1mYUVucm9sbG1lbnRRckNvZGVdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFttZmFFbnJvbGxtZW50Q29kZSwgc2V0TWZhRW5yb2xsbWVudENvZGVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMsIHNldE1mYUVucm9sbG1lbnRSZWNvdmVyeUNvZGVzXSA9IHVzZVN0YXRlPHN0cmluZ1tdIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFttZmFFbnJvbGxtZW50QXV0aGVudGljYXRlZCwgc2V0TWZhRW5yb2xsbWVudEF1dGhlbnRpY2F0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8qKiDnmbvlvZXooajljZXmoKHpqozop4TliJkgKi9cbiAgY29uc3QgbG9naW5TY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgdXNlcm5hbWU6IHouc3RyaW5nKCkubWluKDEsIHQoJ2F1dGgudXNlcm5hbWVSZXF1aXJlZCcpKSxcbiAgICBwYXNzd29yZDogei5zdHJpbmcoKS5taW4oMSwgdCgnYXV0aC5wYXNzd29yZFJlcXVpcmVkJykpLFxuICB9KTtcblxuICAvKiogVE9UUCDpqozor4HnoIHmoKHpqozop4TliJnvvJo2IOS9jeaVsOWtlyAqL1xuICBjb25zdCB0b3RwU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIHRvdHBDb2RlOiB6LnN0cmluZygpLnJlZmluZShcbiAgICAgICh2YWx1ZSkgPT4gL15cXGR7Nn0kLy50ZXN0KHZhbHVlKSB8fCAvXltBLVoyLTldezR9KC1bQS1aMi05XXs0fSl7M30kL2kudGVzdCh2YWx1ZSksXG4gICAgICB0KCdtZmEuY29kZU9yUmVjb3ZlcnlDb2RlSW52YWxpZCcpLFxuICAgICksXG4gIH0pO1xuXG4gIGNvbnN0IHtcbiAgICByZWdpc3RlcixcbiAgICBoYW5kbGVTdWJtaXQsXG4gICAgZm9ybVN0YXRlOiB7IGVycm9ycyB9LFxuICB9ID0gdXNlRm9ybTxMb2dpbkZvcm1EYXRhPih7XG4gICAgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKGxvZ2luU2NoZW1hKSxcbiAgfSk7XG5cbiAgY29uc3Qge1xuICAgIHJlZ2lzdGVyOiByZWdpc3RlclRvdHAsXG4gICAgaGFuZGxlU3VibWl0OiBoYW5kbGVTdWJtaXRUb3RwLFxuICAgIGZvcm1TdGF0ZTogeyBlcnJvcnM6IHRvdHBFcnJvcnMgfSxcbiAgfSA9IHVzZUZvcm08VG90cEZvcm1EYXRhPih7XG4gICAgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKHRvdHBTY2hlbWEpLFxuICB9KTtcblxuICAvKiog5o+Q5Lqk55m75b2V6KGo5Y2V77yI56ys5LiA6Zi25q6177ya5a+G56CB6aqM6K+B77yJICovXG4gIGNvbnN0IG9uU3VibWl0ID0gYXN5bmMgKGRhdGE6IExvZ2luRm9ybURhdGEpID0+IHtcbiAgICBzZXRMb2FkaW5nKHRydWUpO1xuICAgIHNldEVycm9yKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGkucG9zdDxBdXRoUmVzcG9uc2U+KCcvYXV0aC9sb2dpbicsIGRhdGEpO1xuXG4gICAgICAvLyDmo4Dmn6XmmK/lkKbpnIDopoEgTUZBIOS6jOasoemqjOivgVxuICAgICAgaWYgKHJlc3BvbnNlLmRhdGEubWZhUmVxdWlyZWQgJiYgcmVzcG9uc2UuZGF0YS5tZmFDaGFsbGVuZ2VUb2tlbikge1xuICAgICAgICBzZXRNZmFDaGFsbGVuZ2VUb2tlbihyZXNwb25zZS5kYXRhLm1mYUNoYWxsZW5nZVRva2VuKTtcbiAgICAgICAgc2V0TWZhVXNlckluZm8ocmVzcG9uc2UuZGF0YS51c2VySW5mbyk7XG4gICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIOeUn+S6p+mrmOadg+mZkOi0puaIt+mmluasoeeZu+W9leW/hemhu+WFiOWujOaIkCBNRkEg5rOo5YaM77yM5pW05Liq5rWB56iL5LuN5LiN5oyB5pyJIEpXVOOAglxuICAgICAgaWYgKHJlc3BvbnNlLmRhdGEubWZhRW5yb2xsbWVudFJlcXVpcmVkICYmIHJlc3BvbnNlLmRhdGEubWZhRW5yb2xsbWVudFRva2VuKSB7XG4gICAgICAgIHNldE1mYUVucm9sbG1lbnRUb2tlbihyZXNwb25zZS5kYXRhLm1mYUVucm9sbG1lbnRUb2tlbik7XG4gICAgICAgIHNldE1mYUVucm9sbG1lbnRVc2VySW5mbyhyZXNwb25zZS5kYXRhLnVzZXJJbmZvKTtcbiAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8g5peg6ZyAIE1GQe+8jOebtOaOpeWujOaIkOeZu+W9lVxuICAgICAgc2V0QXV0aChyZXNwb25zZS5kYXRhLnVzZXJJbmZvKTtcbiAgICAgIC8vIOaMgeS5heWMluS7pOeJjOOAkOe7neWvuei/h+acn+aXtumXtOaIs+OAke+8jOS+myB1c2VUb2tlblJlZnJlc2gg6K6h566X5Li75Yqo5Yi35paw5pe25py644CCXG4gICAgICAvLyDlv4Xpobvkvb/nlKjlkI7nq6/lrp7pmYXov5Tlm57nmoQgZXhwaXJlc0lu77yI5Y+XICMyMDAg5Y+v6YWN572uIEFjY2Vzc1Rva2VuTWludXRlcyDlvbHlk43vvIwxMH4xNDQwc++8ie+8jFxuICAgICAgLy8g5LiN6IO955So5YmN56uv6buY6K6k5YC877yM5ZCm5YiZ5Li75Yqo5Yi35paw6KKr5o6S5Yiw6ZSZ6K+v5pe25Yi744CCXG4gICAgICBwZXJzaXN0VG9rZW5FeHBpcnkocmVzcG9uc2UuZGF0YS5leHBpcmVzSW4pO1xuICAgICAgLy8g6K6k6K+BIENvb2tpZSDnlLHlkI7nq6/nmbvlvZXlk43lupToh6rliqjorr7nva5cbiAgICAgIGlmIChyZXNwb25zZS5kYXRhLnVzZXJJbmZvLm11c3RDaGFuZ2VQYXNzd29yZCkge1xuICAgICAgICBzZXRNdXN0Q2hhbmdlUGFzc3dvcmQodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmcm9tID0gKGxvY2F0aW9uLnN0YXRlIGFzIHsgZnJvbT86IHN0cmluZyB9KT8uZnJvbSB8fCAnL2Rhc2hib2FyZCc7XG4gICAgICAgIG5hdmlnYXRlKGZyb20sIHsgcmVwbGFjZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldEVycm9yKHQoJ2F1dGgubG9naW5FcnJvcicpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDnlJ/miJDlvLrliLYgTUZBIOazqOWGjOS6jOe7tOeggSAqL1xuICBjb25zdCBzZXR1cE1mYUVucm9sbG1lbnQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFtZmFFbnJvbGxtZW50VG9rZW4pIHJldHVybjtcbiAgICBzZXRMb2FkaW5nKHRydWUpO1xuICAgIHNldEVycm9yKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGkucG9zdDxNZmFTZXR1cFJlc3BvbnNlPignL2F1dGgvbWZhL2Vucm9sbC9zZXR1cCcsIHtcbiAgICAgICAgZW5yb2xsbWVudFRva2VuOiBtZmFFbnJvbGxtZW50VG9rZW4sXG4gICAgICB9KTtcbiAgICAgIHNldE1mYUVucm9sbG1lbnRTZXR1cChyZXNwb25zZS5kYXRhKTtcbiAgICAgIGNvbnN0IGRhdGFVcmwgPSBhd2FpdCBRUkNvZGUudG9EYXRhVVJMKHJlc3BvbnNlLmRhdGEucXJDb2RlVXJpLCB7XG4gICAgICAgIHdpZHRoOiAyNDAsXG4gICAgICAgIG1hcmdpbjogMixcbiAgICAgICAgY29sb3I6IHsgZGFyazogJyMwMDAwMDAnLCBsaWdodDogJyNmZmZmZmYnIH0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsOiAnTScsXG4gICAgICB9KTtcbiAgICAgIHNldE1mYUVucm9sbG1lbnRRckNvZGUoZGF0YVVybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRFcnJvcih0KCdtZmEuZW5yb2xsbWVudFNldHVwRmFpbGVkJykpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIOehruiupOW8uuWItiBNRkEg5rOo5YaM5bm25a6M5oiQ55m75b2VICovXG4gIGNvbnN0IG9uTWZhRW5yb2xsbWVudFN1Ym1pdCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIW1mYUVucm9sbG1lbnRUb2tlbikgcmV0dXJuO1xuICAgIGlmICghL15cXGR7Nn0kLy50ZXN0KG1mYUVucm9sbG1lbnRDb2RlKSkge1xuICAgICAgc2V0RXJyb3IodCgnbWZhLmNvZGVJbnZhbGlkJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgc2V0RXJyb3IoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFwaS5wb3N0PEF1dGhSZXNwb25zZT4oJy9hdXRoL21mYS9lbnJvbGwvY29uZmlybScsIHtcbiAgICAgICAgZW5yb2xsbWVudFRva2VuOiBtZmFFbnJvbGxtZW50VG9rZW4sXG4gICAgICAgIHRvdHBDb2RlOiBtZmFFbnJvbGxtZW50Q29kZSxcbiAgICAgIH0pO1xuICAgICAgc2V0QXV0aChyZXNwb25zZS5kYXRhLnVzZXJJbmZvKTtcbiAgICAgIHBlcnNpc3RUb2tlbkV4cGlyeShyZXNwb25zZS5kYXRhLmV4cGlyZXNJbik7XG4gICAgICBpZiAocmVzcG9uc2UuZGF0YS5tZmFSZWNvdmVyeUNvZGVzPy5sZW5ndGgpIHtcbiAgICAgICAgc2V0TWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMocmVzcG9uc2UuZGF0YS5tZmFSZWNvdmVyeUNvZGVzKTtcbiAgICAgICAgc2V0TWZhRW5yb2xsbWVudEF1dGhlbnRpY2F0ZWQodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmcm9tID0gKGxvY2F0aW9uLnN0YXRlIGFzIHsgZnJvbT86IHN0cmluZyB9KT8uZnJvbSB8fCAnL2Rhc2hib2FyZCc7XG4gICAgICAgIG5hdmlnYXRlKGZyb20sIHsgcmVwbGFjZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldEVycm9yKHQoJ21mYS5lbnJvbGxtZW50Q29uZmlybUZhaWxlZCcpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDmj5DkuqQgVE9UUCDpqozor4HnoIHvvIjnrKzkuozpmLbmrrXvvJpNRkEg6aqM6K+B77yJICovXG4gIGNvbnN0IG9uTWZhU3VibWl0ID0gYXN5bmMgKGRhdGE6IFRvdHBGb3JtRGF0YSkgPT4ge1xuICAgIGlmICghbWZhQ2hhbGxlbmdlVG9rZW4pIHJldHVybjtcbiAgICBzZXRMb2FkaW5nKHRydWUpO1xuICAgIHNldEVycm9yKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGkucG9zdDxBdXRoUmVzcG9uc2U+KCcvYXV0aC9tZmEvdmVyaWZ5Jywge1xuICAgICAgICBjaGFsbGVuZ2VUb2tlbjogbWZhQ2hhbGxlbmdlVG9rZW4sXG4gICAgICAgIHRvdHBDb2RlOiBkYXRhLnRvdHBDb2RlLFxuICAgICAgfSk7XG4gICAgICBzZXRBdXRoKHJlc3BvbnNlLmRhdGEudXNlckluZm8pO1xuICAgICAgLy8g5oyB5LmF5YyW5Luk54mM6L+H5pyf5pe26Ze05oiz77yI5LiO5a+G56CB55m75b2V6Lev5b6E5LiA6Ie077yJ77yM5L6bIHVzZVRva2VuUmVmcmVzaCDkuLvliqjliLfmlrBcbiAgICAgIHBlcnNpc3RUb2tlbkV4cGlyeShyZXNwb25zZS5kYXRhLmV4cGlyZXNJbik7XG4gICAgICBjb25zdCBmcm9tID0gKGxvY2F0aW9uLnN0YXRlIGFzIHsgZnJvbT86IHN0cmluZyB9KT8uZnJvbSB8fCAnL2Rhc2hib2FyZCc7XG4gICAgICBuYXZpZ2F0ZShmcm9tLCB7IHJlcGxhY2U6IHRydWUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRFcnJvcign6aqM6K+B56CB6ZSZ6K+v77yM6K+35qOA5p+lIGF1dGhlbnRpY2F0b3Ig5bqU55So5Lit55qE5pe26Ze05piv5ZCm5YeG56GuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvKiog6L+U5Zue5a+G56CB6L6T5YWl6Zi25q6177yI5riF56m6IE1GQSDnirbmgIHvvIkgKi9cbiAgY29uc3QgYmFja1RvUGFzc3dvcmQgPSAoKSA9PiB7XG4gICAgc2V0TWZhQ2hhbGxlbmdlVG9rZW4obnVsbCk7XG4gICAgc2V0TWZhVXNlckluZm8obnVsbCk7XG4gICAgc2V0RXJyb3IoJycpO1xuICB9O1xuXG4gIC8qKiDlj5bmtojlvLrliLYgTUZBIOazqOWGjOW5tumHjeaWsOi+k+WFpeWvhueggSAqL1xuICBjb25zdCBiYWNrRnJvbU1mYUVucm9sbG1lbnQgPSAoKSA9PiB7XG4gICAgc2V0TWZhRW5yb2xsbWVudFRva2VuKG51bGwpO1xuICAgIHNldE1mYUVucm9sbG1lbnRVc2VySW5mbyhudWxsKTtcbiAgICBzZXRNZmFFbnJvbGxtZW50U2V0dXAobnVsbCk7XG4gICAgc2V0TWZhRW5yb2xsbWVudFFyQ29kZShudWxsKTtcbiAgICBzZXRNZmFFbnJvbGxtZW50Q29kZSgnJyk7XG4gICAgc2V0TWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMobnVsbCk7XG4gICAgc2V0TWZhRW5yb2xsbWVudEF1dGhlbnRpY2F0ZWQoZmFsc2UpO1xuICAgIHNldEVycm9yKCcnKTtcbiAgfTtcblxuICAvKiog57un57ut6L+b5YWl57O757uf77yb5oGi5aSN56CB5bey57uP5Zyo5LiK5LiA5q2l5bGV56S66L+H5LiU5LiN5Lya5YaN5qyh6L+U5Zue44CCICovXG4gIGNvbnN0IGNvbnRpbnVlQWZ0ZXJNZmFFbnJvbGxtZW50ID0gKCkgPT4ge1xuICAgIGNvbnN0IGZyb20gPSAobG9jYXRpb24uc3RhdGUgYXMgeyBmcm9tPzogc3RyaW5nIH0pPy5mcm9tIHx8ICcvZGFzaGJvYXJkJztcbiAgICBuYXZpZ2F0ZShmcm9tLCB7IHJlcGxhY2U6IHRydWUgfSk7XG4gIH07XG5cbiAgLy8g5by65Yi2IE1GQSDms6jlhozpmLbmrrUgVUlcbiAgaWYgKG1mYUVucm9sbG1lbnRUb2tlbikge1xuICAgIHJldHVybiAoXG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZT57dCgnbWZhLmVucm9sbG1lbnRUaXRsZScpfTwvQ2FyZFRpdGxlPlxuICAgICAgICAgIDxDYXJkRGVzY3JpcHRpb24+XG4gICAgICAgICAgICB7dCgnbWZhLmVucm9sbG1lbnREZXNjJyl9XG4gICAgICAgICAgICB7bWZhRW5yb2xsbWVudFVzZXJJbmZvICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgIHttZmFFbnJvbGxtZW50VXNlckluZm8uZGlzcGxheU5hbWUgfHwgbWZhRW5yb2xsbWVudFVzZXJJbmZvLnVzZXJuYW1lfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7bWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMgPyAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57dCgnbWZhLnJlY292ZXJ5Q29kZXNXYXJuaW5nJyl9PC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTIgcm91bmRlZCBiZy1tdXRlZCBwLTMgZm9udC1tb25vIHRleHQtc21cIj5cbiAgICAgICAgICAgICAgICB7bWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMubWFwKChjb2RlKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8Y29kZSBrZXk9e2NvZGV9Pntjb2RlfTwvY29kZT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICB2YXJpYW50PVwib3V0bGluZVwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0b3IuY2xpcGJvYXJkPy53cml0ZVRleHQobWZhRW5yb2xsbWVudFJlY292ZXJ5Q29kZXMuam9pbignXFxuJykpfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge3QoJ21mYS5yZWNvdmVyeUNvZGVzQ29weScpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17Y29udGludWVBZnRlck1mYUVucm9sbG1lbnR9IGNsYXNzTmFtZT1cInctZnVsbFwiPlxuICAgICAgICAgICAgICAgIHt0KCdtZmEucmVjb3ZlcnlDb2Rlc0NvbnRpbnVlJyl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSA6ICFtZmFFbnJvbGxtZW50U2V0dXAgPyAoXG4gICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e3NldHVwTWZhRW5yb2xsbWVudH0gY2xhc3NOYW1lPVwidy1mdWxsXCIgZGlzYWJsZWQ9e2xvYWRpbmd9PlxuICAgICAgICAgICAgICB7bG9hZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJykgOiB0KCdtZmEuZW5yb2xsbWVudFNldHVwJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnbWZhLmVucm9sbG1lbnRDb25maWdEZXNjJyl9PC9wPlxuICAgICAgICAgICAgICB7bWZhRW5yb2xsbWVudFFyQ29kZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICA8aW1nIHNyYz17bWZhRW5yb2xsbWVudFFyQ29kZX0gYWx0PXt0KCdtZmEucXJBbHQnKX0gY2xhc3NOYW1lPVwicm91bmRlZCBib3JkZXJcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQgYmctbXV0ZWQgcHgtMyBweS0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnbWZhLm1hbnVhbEtleUxhYmVsJyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxjb2RlIGNsYXNzTmFtZT1cIm10LTEgYmxvY2sgYnJlYWstYWxsIGZvbnQtbW9ub1wiPnttZmFFbnJvbGxtZW50U2V0dXAuc2VjcmV0fTwvY29kZT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJtZmFFbnJvbGxtZW50Q29kZVwiPnt0KCdtZmEuY29kZUxhYmVsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgIGlkPVwibWZhRW5yb2xsbWVudENvZGVcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e21mYUVucm9sbG1lbnRDb2RlfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT4gc2V0TWZhRW5yb2xsbWVudENvZGUoZXZlbnQudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc2xpY2UoMCwgNikpfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCIwMDAwMDBcIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs2fVxuICAgICAgICAgICAgICAgICAgaW5wdXRNb2RlPVwibnVtZXJpY1wiXG4gICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvbmUtdGltZS1jb2RlXCJcbiAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e29uTWZhRW5yb2xsbWVudFN1Ym1pdH0gY2xhc3NOYW1lPVwidy1mdWxsXCIgZGlzYWJsZWQ9e2xvYWRpbmcgfHwgbWZhRW5yb2xsbWVudENvZGUubGVuZ3RoICE9PSA2fT5cbiAgICAgICAgICAgICAgICB7bG9hZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJykgOiB0KCdtZmEuZW5yb2xsbWVudENvbmZpcm0nKX1cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtlcnJvciAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3J9PC9wPn1cbiAgICAgICAgICB7IW1mYUVucm9sbG1lbnRBdXRoZW50aWNhdGVkICYmIChcbiAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHZhcmlhbnQ9XCJnaG9zdFwiIGNsYXNzTmFtZT1cInctZnVsbFwiIG9uQ2xpY2s9e2JhY2tGcm9tTWZhRW5yb2xsbWVudH0gZGlzYWJsZWQ9e2xvYWRpbmd9PlxuICAgICAgICAgICAgICB7dCgnbWZhLmVucm9sbG1lbnRCYWNrJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICAvLyBNRkEg6aqM6K+B6Zi25q61IFVJXG4gIGlmIChtZmFDaGFsbGVuZ2VUb2tlbikge1xuICAgIHJldHVybiAoXG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZT57dCgnbWZhLnRpdGxlJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgICAgPENhcmREZXNjcmlwdGlvbj5cbiAgICAgICAgICAgIHt0KCdtZmEubG9naW5EZXNjJyl9XG4gICAgICAgICAgICB7bWZhVXNlckluZm8gJiYgKFxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAge3QoJ21mYS5sb2dpblVzZXInKX06IHttZmFVc2VySW5mby5kaXNwbGF5TmFtZSB8fCBtZmFVc2VySW5mby51c2VybmFtZX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0NhcmREZXNjcmlwdGlvbj5cbiAgICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdFRvdHAob25NZmFTdWJtaXQpfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBodG1sRm9yPVwidG90cENvZGVcIj57dCgnbWZhLmxvZ2luQ29kZUxhYmVsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJ0b3RwQ29kZVwiXG4gICAgICAgICAgICAgICAgey4uLnJlZ2lzdGVyVG90cCgndG90cENvZGUnKX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dCgnbWZhLmxvZ2luQ29kZVBsYWNlaG9sZGVyJyl9XG4gICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxOX1cbiAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvbmUtdGltZS1jb2RlXCJcbiAgICAgICAgICAgICAgICBpbnB1dE1vZGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAge3RvdHBFcnJvcnMudG90cENvZGUgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3RvdHBFcnJvcnMudG90cENvZGUubWVzc2FnZX08L3A+fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7ZXJyb3IgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9yfTwvcD59XG4gICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJ3LWZ1bGxcIiBkaXNhYmxlZD17bG9hZGluZ30+XG4gICAgICAgICAgICAgIHtsb2FkaW5nID8gdCgnY29tbW9uLmxvYWRpbmcnKSA6IHQoJ21mYS52ZXJpZnknKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdmFyaWFudD1cImdob3N0XCIgY2xhc3NOYW1lPVwidy1mdWxsXCIgb25DbGljaz17YmFja1RvUGFzc3dvcmR9IGRpc2FibGVkPXtsb2FkaW5nfT5cbiAgICAgICAgICAgICAge3QoJ2NvbW1vbi5wcmV2aW91cycpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICAvLyDlr4bnoIHovpPlhaXpmLbmrrUgVUlcbiAgcmV0dXJuIChcbiAgICA8Q2FyZD5cbiAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICA8Q2FyZFRpdGxlPnt0KCdhdXRoLmxvZ2luJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ2F1dGgubG9naW5TdWJ0aXRsZScpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KG9uU3VibWl0KX0gY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxMYWJlbCBodG1sRm9yPVwidXNlcm5hbWVcIj57dCgnYXV0aC51c2VybmFtZScpfTwvTGFiZWw+XG4gICAgICAgICAgICA8SW5wdXQgaWQ9XCJ1c2VybmFtZVwiIGF1dG9Db21wbGV0ZT1cInVzZXJuYW1lXCIgey4uLnJlZ2lzdGVyKCd1c2VybmFtZScpfSBwbGFjZWhvbGRlcj17dCgnYXV0aC51c2VybmFtZScpfSAvPlxuICAgICAgICAgICAge2Vycm9ycy51c2VybmFtZSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3JzLnVzZXJuYW1lLm1lc3NhZ2V9PC9wPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJwYXNzd29yZFwiPnt0KCdhdXRoLnBhc3N3b3JkJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxJbnB1dCBpZD1cInBhc3N3b3JkXCIgdHlwZT1cInBhc3N3b3JkXCIgYXV0b0NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIHsuLi5yZWdpc3RlcigncGFzc3dvcmQnKX0gcGxhY2Vob2xkZXI9e3QoJ2F1dGgucGFzc3dvcmQnKX0gLz5cbiAgICAgICAgICAgIHtlcnJvcnMucGFzc3dvcmQgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9ycy5wYXNzd29yZC5tZXNzYWdlfTwvcD59XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAge2Vycm9yICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcn08L3A+fVxuICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiIGNsYXNzTmFtZT1cInctZnVsbFwiIGRpc2FibGVkPXtsb2FkaW5nfT5cbiAgICAgICAgICAgIHtsb2FkaW5nID8gdCgnY29tbW9uLmxvYWRpbmcnKSA6IHQoJ2F1dGgubG9naW4nKX1cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LXNtXCI+XG4gICAgICAgICAgICA8TGluayB0bz1cIi9mb3Jnb3QtcGFzc3dvcmRcIiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmQgdW5kZXJsaW5lLW9mZnNldC00IGhvdmVyOnVuZGVybGluZVwiPlxuICAgICAgICAgICAgICB7dCgnYXV0aC5mb3Jnb3RQYXNzd29yZCcsICflv5jorrDlr4bnoIHvvJ8nKX1cbiAgICAgICAgICAgIDwvTGluaz5cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgIHt0KCdyZWdpc3Rlci5ub0FjY291bnQnKX17JyAnfVxuICAgICAgICAgICAgPExpbmsgdG89XCIvcmVnaXN0ZXJcIiBjbGFzc05hbWU9XCJ0ZXh0LXByaW1hcnkgdW5kZXJsaW5lLW9mZnNldC00IGhvdmVyOnVuZGVybGluZVwiPlxuICAgICAgICAgICAgICB7dCgncmVnaXN0ZXIudGl0bGUnKX1cbiAgICAgICAgICAgIDwvTGluaz5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICB7bXVzdENoYW5nZVBhc3N3b3JkICYmIChcbiAgICAgICAgPENoYW5nZVBhc3N3b3JkRGlhbG9nXG4gICAgICAgICAgZm9yY2VkXG4gICAgICAgICAgb25TdWNjZXNzPXsoKSA9PiB7XG4gICAgICAgICAgICBzZXRNdXN0Q2hhbmdlUGFzc3dvcmQoZmFsc2UpO1xuICAgICAgICAgICAgY29uc3QgZnJvbSA9IChsb2NhdGlvbi5zdGF0ZSBhcyB7IGZyb20/OiBzdHJpbmcgfSk/LmZyb20gfHwgJy9kYXNoYm9hcmQnO1xuICAgICAgICAgICAgbmF2aWdhdGUoZnJvbSwgeyByZXBsYWNlOiB0cnVlIH0pO1xuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICApfVxuICAgIDwvQ2FyZD5cbiAgKTtcbn1cbiJdfQ==