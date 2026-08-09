import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/RegisterPage.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport13_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport13_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useNavigate, Link } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { useAuthStore } from "/src/stores/authStore.ts";
import { usePlans, useRegister } from "/src/hooks/useRegister.ts";
import { persistTokenExpiry } from "/src/lib/tokenExpiry.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/RegisterPage.tsx";
import __vite__cjsImport13_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 注册页面组件
*
* 三步注册流程：
* 1. 套餐选择 — 三列卡片，点击选中
* 2. 企业信息 — 企业名称 + 标识（slug）
* 3. 管理员账户 — 用户名 + 密码 + 确认密码 + 显示名称 + 邮箱
*
* 注册成功后自动登录并跳转到仪表盘。
*/
export default function RegisterPage() {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const setAuth = useAuthStore((s) => s.setAuth);
	const registerMutation = useRegister();
	const [step, setStep] = useState(1);
	const [selectedPlan, setSelectedPlan] = useState("");
	const [error, setError] = useState("");
	const { data: plans, isLoading: plansLoading } = usePlans();
	// ---- 步骤 2 校验 Schema（企业信息） ----
	const tenantSchema = z.object({
		tenantName: z.string().min(2, t("register.tenantNameMin")),
		slug: z.string().min(2, t("register.slugMin")).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, t("register.slugPattern"))
	});
	const tenantForm = useForm({
		resolver: zodResolver(tenantSchema),
		defaultValues: {
			tenantName: "",
			slug: ""
		}
	});
	// ---- 步骤 3 校验 Schema（管理员账户） ----
	const accountSchema = z.object({
		username: z.string().min(3, t("register.usernameMin")),
		password: z.string().min(6, t("register.passwordMin")),
		confirmPassword: z.string().min(1, t("register.confirmPasswordRequired")),
		displayName: z.string().optional(),
		email: z.string().email({ message: t("register.emailInvalid") }).optional().or(z.literal(""))
	}).refine((d) => d.password === d.confirmPassword, {
		message: t("register.passwordMismatch"),
		path: ["confirmPassword"]
	});
	const accountForm = useForm({
		resolver: zodResolver(accountSchema),
		mode: "onBlur",
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
			displayName: "",
			email: ""
		}
	});
	/** 从步骤 1 进入步骤 2 */
	const handleStep1Next = () => {
		if (!selectedPlan) return;
		setError("");
		setStep(2);
	};
	/** 从步骤 2 进入步骤 3（校验通过即进入下一步） */
	const handleStep2Next = tenantForm.handleSubmit(() => {
		setError("");
		setStep(3);
	});
	/** 步骤 3 提交注册 */
	const handleStep3Submit = accountForm.handleSubmit(async (accountData) => {
		setError("");
		const tenantData = tenantForm.getValues();
		try {
			const authResponse = await registerMutation.mutateAsync({
				tenantName: tenantData.tenantName,
				slug: tenantData.slug,
				username: accountData.username,
				password: accountData.password,
				displayName: accountData.displayName || undefined,
				email: accountData.email || undefined,
				plan: selectedPlan
			});
			// 生产高权限管理员需要先完成 MFA enrollment；将短期令牌放入路由内存状态，
			// 不写入 localStorage/sessionStorage，避免把未完成认证的凭据长期留在浏览器。
			if (authResponse.mfaEnrollmentRequired && authResponse.mfaEnrollmentToken) {
				navigate("/login", {
					replace: true,
					state: {
						mfaEnrollmentToken: authResponse.mfaEnrollmentToken,
						mfaEnrollmentUserInfo: authResponse.userInfo
					}
				});
				return;
			}
			// 非强制 MFA 环境保持原有注册即登录行为，并同步保存令牌刷新时间。
			setAuth(authResponse.userInfo);
			persistTokenExpiry(authResponse.expiresIn);
			navigate("/dashboard", { replace: true });
		} catch {
			setError(t("register.registerError"));
		}
	});
	/** 步骤指示器渲染 */
	const renderStepper = () => /* @__PURE__ */ _jsxDEV("div", {
		className: "mb-6 flex items-center justify-center gap-2",
		children: [
			1,
			2,
			3
		].map((s) => /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ _jsxDEV("div", {
				className: `flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`,
				children: s
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 138,
				columnNumber: 11
			}, this), s < 3 && /* @__PURE__ */ _jsxDEV("div", { className: `h-0.5 w-12 ${step > s ? "bg-primary" : "bg-muted"}` }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 148,
				columnNumber: 13
			}, this)]
		}, s, true, {
			fileName: _jsxFileName,
			lineNumber: 137,
			columnNumber: 9
		}, this))
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 135,
		columnNumber: 5
	}, this);
	/** 步骤 1：套餐选择 */
	const renderStep1 = () => /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
		/* @__PURE__ */ _jsxDEV("p", {
			className: "mb-4 text-center text-sm text-muted-foreground",
			children: t("register.selectPlanHint")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 158,
			columnNumber: 7
		}, this),
		plansLoading ? /* @__PURE__ */ _jsxDEV("p", {
			className: "text-center text-sm text-muted-foreground",
			children: t("common.loading")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 162,
			columnNumber: 9
		}, this) : /* @__PURE__ */ _jsxDEV("div", {
			className: "grid grid-cols-1 gap-4 sm:grid-cols-3",
			children: (plans ?? []).map((plan) => /* @__PURE__ */ _jsxDEV("button", {
				type: "button",
				onClick: () => setSelectedPlan(plan.planId),
				className: `rounded-lg border-2 p-4 text-left transition-colors ${selectedPlan === plan.planId ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`,
				children: [
					/* @__PURE__ */ _jsxDEV("h3", {
						className: "text-base font-semibold",
						children: plan.displayName
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 176,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: plan.description
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 177,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "mt-3 space-y-1 text-xs",
						children: [
							/* @__PURE__ */ _jsxDEV("p", { children: [
								t("register.maxDevices"),
								": ",
								plan.maxDevices
							] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 179,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("p", { children: [
								t("register.maxUsers"),
								": ",
								plan.maxUsers
							] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 182,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("p", { children: [
								t("register.dataRetention"),
								": ",
								plan.dataRetentionDays,
								" ",
								t("subscription.days")
							] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 185,
								columnNumber: 17
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 178,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "mt-2 text-sm font-bold",
						children: plan.isFree ? t("register.free") : `¥${plan.monthlyPrice}/${t("register.month")}`
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 189,
						columnNumber: 15
					}, this)
				]
			}, plan.planId, true, {
				fileName: _jsxFileName,
				lineNumber: 166,
				columnNumber: 13
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 164,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Button, {
			className: "mt-6 w-full",
			onClick: handleStep1Next,
			disabled: !selectedPlan,
			children: t("common.next")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 198,
			columnNumber: 7
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 157,
		columnNumber: 5
	}, this);
	/** 步骤 2：企业信息 */
	const renderStep2 = () => /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleStep2Next,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "tenantName",
						children: t("register.tenantName")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 208,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "tenantName",
						...tenantForm.register("tenantName"),
						placeholder: t("register.tenantNamePlaceholder")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 209,
						columnNumber: 9
					}, this),
					tenantForm.formState.errors.tenantName && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: tenantForm.formState.errors.tenantName.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 215,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 207,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "slug",
						children: t("register.slug")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 221,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "slug",
						...tenantForm.register("slug"),
						placeholder: t("register.slugPlaceholder")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 222,
						columnNumber: 9
					}, this),
					tenantForm.formState.errors.slug && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: tenantForm.formState.errors.slug.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 228,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "text-xs text-muted-foreground",
						children: t("register.slugHint")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 232,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 220,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ _jsxDEV(Button, {
					type: "button",
					variant: "outline",
					className: "flex-1",
					onClick: () => setStep(1),
					children: t("common.previous")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 235,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					className: "flex-1",
					children: t("common.next")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 238,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 234,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 206,
		columnNumber: 5
	}, this);
	/** 步骤 3：管理员账户 */
	const renderStep3 = () => /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleStep3Submit,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "reg-username",
						children: t("auth.username")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 249,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "reg-username",
						...accountForm.register("username"),
						placeholder: t("auth.username")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 250,
						columnNumber: 9
					}, this),
					accountForm.formState.errors.username && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: accountForm.formState.errors.username.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 256,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 248,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "reg-password",
						children: t("auth.password")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 262,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "reg-password",
						type: "password",
						...accountForm.register("password"),
						placeholder: t("auth.password")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 263,
						columnNumber: 9
					}, this),
					accountForm.formState.errors.password && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: accountForm.formState.errors.password.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 270,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 261,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "confirmPassword",
						children: t("register.confirmPassword")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 276,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "confirmPassword",
						type: "password",
						...accountForm.register("confirmPassword"),
						placeholder: t("register.confirmPassword")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 277,
						columnNumber: 9
					}, this),
					accountForm.formState.errors.confirmPassword && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: accountForm.formState.errors.confirmPassword.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 284,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 275,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					htmlFor: "displayName",
					children: t("register.displayName")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 290,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					id: "displayName",
					...accountForm.register("displayName"),
					placeholder: t("register.displayNamePlaceholder")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 291,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 289,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "email",
						children: t("register.email")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 298,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "email",
						type: "email",
						...accountForm.register("email"),
						placeholder: t("register.emailPlaceholder")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 299,
						columnNumber: 9
					}, this),
					accountForm.formState.errors.email && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: accountForm.formState.errors.email.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 306,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 297,
				columnNumber: 7
			}, this),
			error && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-destructive",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 311,
				columnNumber: 17
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ _jsxDEV(Button, {
					type: "button",
					variant: "outline",
					className: "flex-1",
					onClick: () => setStep(2),
					children: t("common.previous")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 313,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					className: "flex-1",
					disabled: registerMutation.isPending,
					children: registerMutation.isPending ? t("common.loading") : t("register.submit")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 316,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 312,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 247,
		columnNumber: 5
	}, this);
	/** 步骤标题映射 */
	const stepTitles = {
		1: t("register.step1Title"),
		2: t("register.step2Title"),
		3: t("register.step3Title")
	};
	return /* @__PURE__ */ _jsxDEV(Card, {
		className: "max-w-lg",
		children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("register.title") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 333,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: stepTitles[step] }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 334,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 332,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: [
			renderStepper(),
			step === 1 && renderStep1(),
			step === 2 && renderStep2(),
			step === 3 && renderStep3(),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "mt-4 text-center text-sm text-muted-foreground",
				children: [
					t("register.hasAccount"),
					" ",
					/* @__PURE__ */ _jsxDEV(Link, {
						to: "/login",
						className: "text-primary underline-offset-4 hover:underline",
						children: t("auth.login")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 343,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 341,
				columnNumber: 9
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 336,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 331,
		columnNumber: 5
	}, this);
}
_s(RegisterPage, "62NyGER93QOMWHgM//MtqwfWioA=", false, function() {
	return [
		useTranslation,
		useNavigate,
		useAuthStore,
		useRegister,
		usePlans,
		useForm,
		useForm
	];
});
_c = RegisterPage;
var _c;
$RefreshReg$(_c, "RegisterPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/RegisterPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/RegisterPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/RegisterPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/RegisterPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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O0dBQVM7Ozs7O0dBQzVELHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQWYsQ0FDRSx3QkFBQyxRQUFEO0tBQVEsTUFBSztLQUFTLFNBQVE7S0FBVSxXQUFVO0tBQVMsZUFBZSxRQUFRLENBQUM7ZUFDaEYsRUFBRSxpQkFBaUI7SUFDZDs7OztjQUNSLHdCQUFDLFFBQUQ7S0FBUSxNQUFLO0tBQVMsV0FBVTtLQUFTLFVBQVUsaUJBQWlCO2VBQ2pFLGlCQUFpQixZQUFZLEVBQUUsZ0JBQWdCLElBQUksRUFBRSxpQkFBaUI7SUFDakU7Ozs7WUFDTDs7Ozs7O0VBQ0Q7Ozs7Ozs7Q0FJUixNQUFNLGFBQXFDO0VBQ3pDLEdBQUcsRUFBRSxxQkFBcUI7RUFDMUIsR0FBRyxFQUFFLHFCQUFxQjtFQUMxQixHQUFHLEVBQUUscUJBQXFCO0NBQzVCO0NBRUEsT0FDRSx3QkFBQyxNQUFEO0VBQU0sV0FBVTtZQUFoQixDQUNFLHdCQUFDLFlBQUQsYUFDRSx3QkFBQyxXQUFELFlBQVksRUFBRSxnQkFBZ0IsRUFBYTs7OztZQUMzQyx3QkFBQyxpQkFBRCxZQUFrQixXQUFXLE1BQXVCOzs7O1VBQzFDOzs7O1lBQ1osd0JBQUMsYUFBRDtHQUNHLGNBQWM7R0FDZCxTQUFTLEtBQUssWUFBWTtHQUMxQixTQUFTLEtBQUssWUFBWTtHQUMxQixTQUFTLEtBQUssWUFBWTtHQUMzQix3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFiO0tBQ0csRUFBRSxxQkFBcUI7S0FBRztLQUMzQix3QkFBQyxNQUFEO01BQU0sSUFBRztNQUFTLFdBQVU7Z0JBQ3pCLEVBQUUsWUFBWTtLQUNYOzs7OztJQUNMOzs7Ozs7RUFDUTs7OztVQUNUOzs7Ozs7QUFFViIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJSZWdpc3RlclBhZ2UudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlRm9ybSB9IGZyb20gJ3JlYWN0LWhvb2stZm9ybSc7XG5pbXBvcnQgeyB6b2RSZXNvbHZlciB9IGZyb20gJ0Bob29rZm9ybS9yZXNvbHZlcnMvem9kJztcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUsIExpbmsgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvaW5wdXQnO1xuaW1wb3J0IHsgTGFiZWwgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2xhYmVsJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvY2FyZCc7XG5pbXBvcnQgeyB1c2VBdXRoU3RvcmUgfSBmcm9tICcuLi9zdG9yZXMvYXV0aFN0b3JlJztcbmltcG9ydCB7IHVzZVBsYW5zLCB1c2VSZWdpc3RlciB9IGZyb20gJy4uL2hvb2tzL3VzZVJlZ2lzdGVyJztcbmltcG9ydCB7IHBlcnNpc3RUb2tlbkV4cGlyeSB9IGZyb20gJy4uL2xpYi90b2tlbkV4cGlyeSc7XG5pbXBvcnQgdHlwZSB7IFBsYW5JbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKipcbiAqIOazqOWGjOmhtemdoue7hOS7tlxuICpcbiAqIOS4ieatpeazqOWGjOa1geeoi++8mlxuICogMS4g5aWX6aSQ6YCJ5oupIOKAlCDkuInliJfljaHniYfvvIzngrnlh7vpgInkuK1cbiAqIDIuIOS8geS4muS/oeaBryDigJQg5LyB5Lia5ZCN56ewICsg5qCH6K+G77yIc2x1Z++8iVxuICogMy4g566h55CG5ZGY6LSm5oi3IOKAlCDnlKjmiLflkI0gKyDlr4bnoIEgKyDnoa7orqTlr4bnoIEgKyDmmL7npLrlkI3np7AgKyDpgq7nrrFcbiAqXG4gKiDms6jlhozmiJDlip/lkI7oh6rliqjnmbvlvZXlubbot7PovazliLDku6rooajnm5jjgIJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVnaXN0ZXJQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcbiAgY29uc3Qgc2V0QXV0aCA9IHVzZUF1dGhTdG9yZSgocykgPT4gcy5zZXRBdXRoKTtcbiAgY29uc3QgcmVnaXN0ZXJNdXRhdGlvbiA9IHVzZVJlZ2lzdGVyKCk7XG5cbiAgY29uc3QgW3N0ZXAsIHNldFN0ZXBdID0gdXNlU3RhdGU8MSB8IDIgfCAzPigxKTtcbiAgY29uc3QgW3NlbGVjdGVkUGxhbiwgc2V0U2VsZWN0ZWRQbGFuXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlKCcnKTtcblxuICBjb25zdCB7IGRhdGE6IHBsYW5zLCBpc0xvYWRpbmc6IHBsYW5zTG9hZGluZyB9ID0gdXNlUGxhbnMoKTtcblxuICAvLyAtLS0tIOatpemqpCAyIOagoemqjCBTY2hlbWHvvIjkvIHkuJrkv6Hmga/vvIkgLS0tLVxuICBjb25zdCB0ZW5hbnRTY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgdGVuYW50TmFtZTogei5zdHJpbmcoKS5taW4oMiwgdCgncmVnaXN0ZXIudGVuYW50TmFtZU1pbicpKSxcbiAgICBzbHVnOiB6XG4gICAgICAuc3RyaW5nKClcbiAgICAgIC5taW4oMiwgdCgncmVnaXN0ZXIuc2x1Z01pbicpKVxuICAgICAgLnJlZ2V4KC9eW2EtejAtOV1bYS16MC05LV0qW2EtejAtOV0kLywgdCgncmVnaXN0ZXIuc2x1Z1BhdHRlcm4nKSksXG4gIH0pO1xuXG4gIHR5cGUgVGVuYW50Rm9ybURhdGEgPSB6LmluZmVyPHR5cGVvZiB0ZW5hbnRTY2hlbWE+O1xuXG4gIGNvbnN0IHRlbmFudEZvcm0gPSB1c2VGb3JtPFRlbmFudEZvcm1EYXRhPih7XG4gICAgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKHRlbmFudFNjaGVtYSksXG4gICAgZGVmYXVsdFZhbHVlczogeyB0ZW5hbnROYW1lOiAnJywgc2x1ZzogJycgfSxcbiAgfSk7XG5cbiAgLy8gLS0tLSDmraXpqqQgMyDmoKHpqowgU2NoZW1h77yI566h55CG5ZGY6LSm5oi377yJIC0tLS1cbiAgY29uc3QgYWNjb3VudFNjaGVtYSA9IHpcbiAgICAub2JqZWN0KHtcbiAgICAgIHVzZXJuYW1lOiB6LnN0cmluZygpLm1pbigzLCB0KCdyZWdpc3Rlci51c2VybmFtZU1pbicpKSxcbiAgICAgIHBhc3N3b3JkOiB6LnN0cmluZygpLm1pbig2LCB0KCdyZWdpc3Rlci5wYXNzd29yZE1pbicpKSxcbiAgICAgIGNvbmZpcm1QYXNzd29yZDogei5zdHJpbmcoKS5taW4oMSwgdCgncmVnaXN0ZXIuY29uZmlybVBhc3N3b3JkUmVxdWlyZWQnKSksXG4gICAgICBkaXNwbGF5TmFtZTogei5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICAgICAgZW1haWw6IHouc3RyaW5nKCkuZW1haWwoeyBtZXNzYWdlOiB0KCdyZWdpc3Rlci5lbWFpbEludmFsaWQnKSB9KS5vcHRpb25hbCgpLm9yKHoubGl0ZXJhbCgnJykpLFxuICAgIH0pXG4gICAgLnJlZmluZSgoZCkgPT4gZC5wYXNzd29yZCA9PT0gZC5jb25maXJtUGFzc3dvcmQsIHtcbiAgICAgIG1lc3NhZ2U6IHQoJ3JlZ2lzdGVyLnBhc3N3b3JkTWlzbWF0Y2gnKSxcbiAgICAgIHBhdGg6IFsnY29uZmlybVBhc3N3b3JkJ10sXG4gICAgfSk7XG5cbiAgdHlwZSBBY2NvdW50Rm9ybURhdGEgPSB6LmluZmVyPHR5cGVvZiBhY2NvdW50U2NoZW1hPjtcblxuICBjb25zdCBhY2NvdW50Rm9ybSA9IHVzZUZvcm08QWNjb3VudEZvcm1EYXRhPih7XG4gICAgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKGFjY291bnRTY2hlbWEpLFxuICAgIG1vZGU6ICdvbkJsdXInLCAvLyDlkK/nlKjlpLHnhKbpqozor4HvvIjovpPlhaXmoYblpLHljrvnhKbngrnml7bop6blj5HmoKHpqozvvIlcbiAgICBkZWZhdWx0VmFsdWVzOiB7XG4gICAgICB1c2VybmFtZTogJycsXG4gICAgICBwYXNzd29yZDogJycsXG4gICAgICBjb25maXJtUGFzc3dvcmQ6ICcnLFxuICAgICAgZGlzcGxheU5hbWU6ICcnLFxuICAgICAgZW1haWw6ICcnLFxuICAgIH0sXG4gIH0pO1xuXG4gIC8qKiDku47mraXpqqQgMSDov5vlhaXmraXpqqQgMiAqL1xuICBjb25zdCBoYW5kbGVTdGVwMU5leHQgPSAoKSA9PiB7XG4gICAgaWYgKCFzZWxlY3RlZFBsYW4pIHJldHVybjtcbiAgICBzZXRFcnJvcignJyk7XG4gICAgc2V0U3RlcCgyKTtcbiAgfTtcblxuICAvKiog5LuO5q2l6aqkIDIg6L+b5YWl5q2l6aqkIDPvvIjmoKHpqozpgJrov4fljbPov5vlhaXkuIvkuIDmraXvvIkgKi9cbiAgY29uc3QgaGFuZGxlU3RlcDJOZXh0ID0gdGVuYW50Rm9ybS5oYW5kbGVTdWJtaXQoKCkgPT4ge1xuICAgIHNldEVycm9yKCcnKTtcbiAgICBzZXRTdGVwKDMpO1xuICB9KTtcblxuICAvKiog5q2l6aqkIDMg5o+Q5Lqk5rOo5YaMICovXG4gIGNvbnN0IGhhbmRsZVN0ZXAzU3VibWl0ID0gYWNjb3VudEZvcm0uaGFuZGxlU3VibWl0KGFzeW5jIChhY2NvdW50RGF0YSkgPT4ge1xuICAgIHNldEVycm9yKCcnKTtcbiAgICBjb25zdCB0ZW5hbnREYXRhID0gdGVuYW50Rm9ybS5nZXRWYWx1ZXMoKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhdXRoUmVzcG9uc2UgPSBhd2FpdCByZWdpc3Rlck11dGF0aW9uLm11dGF0ZUFzeW5jKHtcbiAgICAgICAgdGVuYW50TmFtZTogdGVuYW50RGF0YS50ZW5hbnROYW1lLFxuICAgICAgICBzbHVnOiB0ZW5hbnREYXRhLnNsdWcsXG4gICAgICAgIHVzZXJuYW1lOiBhY2NvdW50RGF0YS51c2VybmFtZSxcbiAgICAgICAgcGFzc3dvcmQ6IGFjY291bnREYXRhLnBhc3N3b3JkLFxuICAgICAgICBkaXNwbGF5TmFtZTogYWNjb3VudERhdGEuZGlzcGxheU5hbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBlbWFpbDogYWNjb3VudERhdGEuZW1haWwgfHwgdW5kZWZpbmVkLFxuICAgICAgICBwbGFuOiBzZWxlY3RlZFBsYW4sXG4gICAgICB9KTtcblxuICAgICAgLy8g55Sf5Lqn6auY5p2D6ZmQ566h55CG5ZGY6ZyA6KaB5YWI5a6M5oiQIE1GQSBlbnJvbGxtZW5077yb5bCG55+t5pyf5Luk54mM5pS+5YWl6Lev55Sx5YaF5a2Y54q25oCB77yMXG4gICAgICAvLyDkuI3lhpnlhaUgbG9jYWxTdG9yYWdlL3Nlc3Npb25TdG9yYWdl77yM6YG/5YWN5oqK5pyq5a6M5oiQ6K6k6K+B55qE5Yet5o2u6ZW/5pyf55WZ5Zyo5rWP6KeI5Zmo44CCXG4gICAgICBpZiAoYXV0aFJlc3BvbnNlLm1mYUVucm9sbG1lbnRSZXF1aXJlZCAmJiBhdXRoUmVzcG9uc2UubWZhRW5yb2xsbWVudFRva2VuKSB7XG4gICAgICAgIG5hdmlnYXRlKCcvbG9naW4nLCB7XG4gICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICBzdGF0ZToge1xuICAgICAgICAgICAgbWZhRW5yb2xsbWVudFRva2VuOiBhdXRoUmVzcG9uc2UubWZhRW5yb2xsbWVudFRva2VuLFxuICAgICAgICAgICAgbWZhRW5yb2xsbWVudFVzZXJJbmZvOiBhdXRoUmVzcG9uc2UudXNlckluZm8sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8g6Z2e5by65Yi2IE1GQSDnjq/looPkv53mjIHljp/mnInms6jlhozljbPnmbvlvZXooYzkuLrvvIzlubblkIzmraXkv53lrZjku6TniYzliLfmlrDml7bpl7TjgIJcbiAgICAgIHNldEF1dGgoYXV0aFJlc3BvbnNlLnVzZXJJbmZvKTtcbiAgICAgIHBlcnNpc3RUb2tlbkV4cGlyeShhdXRoUmVzcG9uc2UuZXhwaXJlc0luKTtcbiAgICAgIG5hdmlnYXRlKCcvZGFzaGJvYXJkJywgeyByZXBsYWNlOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0RXJyb3IodCgncmVnaXN0ZXIucmVnaXN0ZXJFcnJvcicpKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKiDmraXpqqTmjIfnpLrlmajmuLLmn5MgKi9cbiAgY29uc3QgcmVuZGVyU3RlcHBlciA9ICgpID0+IChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgIHtbMSwgMiwgM10ubWFwKChzKSA9PiAoXG4gICAgICAgIDxkaXYga2V5PXtzfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaC04IHctOCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1mdWxsIHRleHQtc20gZm9udC1tZWRpdW0gJHtcbiAgICAgICAgICAgICAgc3RlcCA+PSBzXG4gICAgICAgICAgICAgICAgPyAnYmctcHJpbWFyeSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCdcbiAgICAgICAgICAgICAgICA6ICdiZy1tdXRlZCB0ZXh0LW11dGVkLWZvcmVncm91bmQnXG4gICAgICAgICAgICB9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7c31cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7cyA8IDMgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BoLTAuNSB3LTEyICR7c3RlcCA+IHMgPyAnYmctcHJpbWFyeScgOiAnYmctbXV0ZWQnfWB9IC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApKX1cbiAgICA8L2Rpdj5cbiAgKTtcblxuICAvKiog5q2l6aqkIDHvvJrlpZfppJDpgInmi6kgKi9cbiAgY29uc3QgcmVuZGVyU3RlcDEgPSAoKSA9PiAoXG4gICAgPD5cbiAgICAgIDxwIGNsYXNzTmFtZT1cIm1iLTQgdGV4dC1jZW50ZXIgdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAge3QoJ3JlZ2lzdGVyLnNlbGVjdFBsYW5IaW50Jyl9XG4gICAgICA8L3A+XG4gICAgICB7cGxhbnNMb2FkaW5nID8gKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZGluZycpfTwvcD5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBnYXAtNCBzbTpncmlkLWNvbHMtM1wiPlxuICAgICAgICAgIHsocGxhbnMgPz8gW10pLm1hcCgocGxhbjogUGxhbkluZm8pID0+IChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAga2V5PXtwbGFuLnBsYW5JZH1cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNlbGVjdGVkUGxhbihwbGFuLnBsYW5JZCl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHJvdW5kZWQtbGcgYm9yZGVyLTIgcC00IHRleHQtbGVmdCB0cmFuc2l0aW9uLWNvbG9ycyAke1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGxhbiA9PT0gcGxhbi5wbGFuSWRcbiAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1wcmltYXJ5IGJnLXByaW1hcnkvNSdcbiAgICAgICAgICAgICAgICAgIDogJ2JvcmRlci1tdXRlZCBob3Zlcjpib3JkZXItbXV0ZWQtZm9yZWdyb3VuZC8zMCdcbiAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPntwbGFuLmRpc3BsYXlOYW1lfTwvaDM+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57cGxhbi5kZXNjcmlwdGlvbn08L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMyBzcGFjZS15LTEgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAge3QoJ3JlZ2lzdGVyLm1heERldmljZXMnKX06IHtwbGFuLm1heERldmljZXN9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAge3QoJ3JlZ2lzdGVyLm1heFVzZXJzJyl9OiB7cGxhbi5tYXhVc2Vyc31cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICB7dCgncmVnaXN0ZXIuZGF0YVJldGVudGlvbicpfToge3BsYW4uZGF0YVJldGVudGlvbkRheXN9IHt0KCdzdWJzY3JpcHRpb24uZGF5cycpfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTIgdGV4dC1zbSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICB7cGxhbi5pc0ZyZWVcbiAgICAgICAgICAgICAgICAgID8gdCgncmVnaXN0ZXIuZnJlZScpXG4gICAgICAgICAgICAgICAgICA6IGDCpSR7cGxhbi5tb250aGx5UHJpY2V9LyR7dCgncmVnaXN0ZXIubW9udGgnKX1gfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgICAgPEJ1dHRvbiBjbGFzc05hbWU9XCJtdC02IHctZnVsbFwiIG9uQ2xpY2s9e2hhbmRsZVN0ZXAxTmV4dH0gZGlzYWJsZWQ9eyFzZWxlY3RlZFBsYW59PlxuICAgICAgICB7dCgnY29tbW9uLm5leHQnKX1cbiAgICAgIDwvQnV0dG9uPlxuICAgIDwvPlxuICApO1xuXG4gIC8qKiDmraXpqqQgMu+8muS8geS4muS/oeaBryAqL1xuICBjb25zdCByZW5kZXJTdGVwMiA9ICgpID0+IChcbiAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3RlcDJOZXh0fSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbCBodG1sRm9yPVwidGVuYW50TmFtZVwiPnt0KCdyZWdpc3Rlci50ZW5hbnROYW1lJyl9PC9MYWJlbD5cbiAgICAgICAgPElucHV0XG4gICAgICAgICAgaWQ9XCJ0ZW5hbnROYW1lXCJcbiAgICAgICAgICB7Li4udGVuYW50Rm9ybS5yZWdpc3RlcigndGVuYW50TmFtZScpfVxuICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KCdyZWdpc3Rlci50ZW5hbnROYW1lUGxhY2Vob2xkZXInKX1cbiAgICAgICAgLz5cbiAgICAgICAge3RlbmFudEZvcm0uZm9ybVN0YXRlLmVycm9ycy50ZW5hbnROYW1lICYmIChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj5cbiAgICAgICAgICAgIHt0ZW5hbnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMudGVuYW50TmFtZS5tZXNzYWdlfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJzbHVnXCI+e3QoJ3JlZ2lzdGVyLnNsdWcnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICBpZD1cInNsdWdcIlxuICAgICAgICAgIHsuLi50ZW5hbnRGb3JtLnJlZ2lzdGVyKCdzbHVnJyl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ3JlZ2lzdGVyLnNsdWdQbGFjZWhvbGRlcicpfVxuICAgICAgICAvPlxuICAgICAgICB7dGVuYW50Rm9ybS5mb3JtU3RhdGUuZXJyb3JzLnNsdWcgJiYgKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPlxuICAgICAgICAgICAge3RlbmFudEZvcm0uZm9ybVN0YXRlLmVycm9ycy5zbHVnLm1lc3NhZ2V9XG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdyZWdpc3Rlci5zbHVnSGludCcpfTwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwiZmxleC0xXCIgb25DbGljaz17KCkgPT4gc2V0U3RlcCgxKX0+XG4gICAgICAgICAge3QoJ2NvbW1vbi5wcmV2aW91cycpfVxuICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPEJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiZmxleC0xXCI+XG4gICAgICAgICAge3QoJ2NvbW1vbi5uZXh0Jyl9XG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9mb3JtPlxuICApO1xuXG4gIC8qKiDmraXpqqQgM++8mueuoeeQhuWRmOi0puaItyAqL1xuICBjb25zdCByZW5kZXJTdGVwMyA9ICgpID0+IChcbiAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3RlcDNTdWJtaXR9IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJyZWctdXNlcm5hbWVcIj57dCgnYXV0aC51c2VybmFtZScpfTwvTGFiZWw+XG4gICAgICAgIDxJbnB1dFxuICAgICAgICAgIGlkPVwicmVnLXVzZXJuYW1lXCJcbiAgICAgICAgICB7Li4uYWNjb3VudEZvcm0ucmVnaXN0ZXIoJ3VzZXJuYW1lJyl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ2F1dGgudXNlcm5hbWUnKX1cbiAgICAgICAgLz5cbiAgICAgICAge2FjY291bnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMudXNlcm5hbWUgJiYgKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPlxuICAgICAgICAgICAge2FjY291bnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMudXNlcm5hbWUubWVzc2FnZX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbCBodG1sRm9yPVwicmVnLXBhc3N3b3JkXCI+e3QoJ2F1dGgucGFzc3dvcmQnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICBpZD1cInJlZy1wYXNzd29yZFwiXG4gICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICB7Li4uYWNjb3VudEZvcm0ucmVnaXN0ZXIoJ3Bhc3N3b3JkJyl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ2F1dGgucGFzc3dvcmQnKX1cbiAgICAgICAgLz5cbiAgICAgICAge2FjY291bnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMucGFzc3dvcmQgJiYgKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPlxuICAgICAgICAgICAge2FjY291bnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMucGFzc3dvcmQubWVzc2FnZX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbCBodG1sRm9yPVwiY29uZmlybVBhc3N3b3JkXCI+e3QoJ3JlZ2lzdGVyLmNvbmZpcm1QYXNzd29yZCcpfTwvTGFiZWw+XG4gICAgICAgIDxJbnB1dFxuICAgICAgICAgIGlkPVwiY29uZmlybVBhc3N3b3JkXCJcbiAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgIHsuLi5hY2NvdW50Rm9ybS5yZWdpc3RlcignY29uZmlybVBhc3N3b3JkJyl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ3JlZ2lzdGVyLmNvbmZpcm1QYXNzd29yZCcpfVxuICAgICAgICAvPlxuICAgICAgICB7YWNjb3VudEZvcm0uZm9ybVN0YXRlLmVycm9ycy5jb25maXJtUGFzc3dvcmQgJiYgKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPlxuICAgICAgICAgICAge2FjY291bnRGb3JtLmZvcm1TdGF0ZS5lcnJvcnMuY29uZmlybVBhc3N3b3JkLm1lc3NhZ2V9XG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICA8TGFiZWwgaHRtbEZvcj1cImRpc3BsYXlOYW1lXCI+e3QoJ3JlZ2lzdGVyLmRpc3BsYXlOYW1lJyl9PC9MYWJlbD5cbiAgICAgICAgPElucHV0XG4gICAgICAgICAgaWQ9XCJkaXNwbGF5TmFtZVwiXG4gICAgICAgICAgey4uLmFjY291bnRGb3JtLnJlZ2lzdGVyKCdkaXNwbGF5TmFtZScpfVxuICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KCdyZWdpc3Rlci5kaXNwbGF5TmFtZVBsYWNlaG9sZGVyJyl9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbCBodG1sRm9yPVwiZW1haWxcIj57dCgncmVnaXN0ZXIuZW1haWwnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICBpZD1cImVtYWlsXCJcbiAgICAgICAgICB0eXBlPVwiZW1haWxcIlxuICAgICAgICAgIHsuLi5hY2NvdW50Rm9ybS5yZWdpc3RlcignZW1haWwnKX1cbiAgICAgICAgICBwbGFjZWhvbGRlcj17dCgncmVnaXN0ZXIuZW1haWxQbGFjZWhvbGRlcicpfVxuICAgICAgICAvPlxuICAgICAgICB7YWNjb3VudEZvcm0uZm9ybVN0YXRlLmVycm9ycy5lbWFpbCAmJiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+XG4gICAgICAgICAgICB7YWNjb3VudEZvcm0uZm9ybVN0YXRlLmVycm9ycy5lbWFpbC5tZXNzYWdlfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgICAge2Vycm9yICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcn08L3A+fVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwiZmxleC0xXCIgb25DbGljaz17KCkgPT4gc2V0U3RlcCgyKX0+XG4gICAgICAgICAge3QoJ2NvbW1vbi5wcmV2aW91cycpfVxuICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPEJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiZmxleC0xXCIgZGlzYWJsZWQ9e3JlZ2lzdGVyTXV0YXRpb24uaXNQZW5kaW5nfT5cbiAgICAgICAgICB7cmVnaXN0ZXJNdXRhdGlvbi5pc1BlbmRpbmcgPyB0KCdjb21tb24ubG9hZGluZycpIDogdCgncmVnaXN0ZXIuc3VibWl0Jyl9XG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9mb3JtPlxuICApO1xuXG4gIC8qKiDmraXpqqTmoIfpopjmmKDlsIQgKi9cbiAgY29uc3Qgc3RlcFRpdGxlczogUmVjb3JkPG51bWJlciwgc3RyaW5nPiA9IHtcbiAgICAxOiB0KCdyZWdpc3Rlci5zdGVwMVRpdGxlJyksXG4gICAgMjogdCgncmVnaXN0ZXIuc3RlcDJUaXRsZScpLFxuICAgIDM6IHQoJ3JlZ2lzdGVyLnN0ZXAzVGl0bGUnKSxcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkIGNsYXNzTmFtZT1cIm1heC13LWxnXCI+XG4gICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRUaXRsZT57dCgncmVnaXN0ZXIudGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgPENhcmREZXNjcmlwdGlvbj57c3RlcFRpdGxlc1tzdGVwXX08L0NhcmREZXNjcmlwdGlvbj5cbiAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgIDxDYXJkQ29udGVudD5cbiAgICAgICAge3JlbmRlclN0ZXBwZXIoKX1cbiAgICAgICAge3N0ZXAgPT09IDEgJiYgcmVuZGVyU3RlcDEoKX1cbiAgICAgICAge3N0ZXAgPT09IDIgJiYgcmVuZGVyU3RlcDIoKX1cbiAgICAgICAge3N0ZXAgPT09IDMgJiYgcmVuZGVyU3RlcDMoKX1cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwibXQtNCB0ZXh0LWNlbnRlciB0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgIHt0KCdyZWdpc3Rlci5oYXNBY2NvdW50Jyl9eycgJ31cbiAgICAgICAgICA8TGluayB0bz1cIi9sb2dpblwiIGNsYXNzTmFtZT1cInRleHQtcHJpbWFyeSB1bmRlcmxpbmUtb2Zmc2V0LTQgaG92ZXI6dW5kZXJsaW5lXCI+XG4gICAgICAgICAgICB7dCgnYXV0aC5sb2dpbicpfVxuICAgICAgICAgIDwvTGluaz5cbiAgICAgICAgPC9wPlxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=