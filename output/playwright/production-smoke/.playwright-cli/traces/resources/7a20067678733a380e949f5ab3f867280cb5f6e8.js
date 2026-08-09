import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/ForgotPasswordPage.tsx");const useState = __vite__cjsImport5_react["useState"];const _jsxDEV = __vite__cjsImport12_react_jsxDevRuntime["jsxDEV"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { Link } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Mail } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import api from "/src/lib/api.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ForgotPasswordPage.tsx";
import __vite__cjsImport12_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 忘记密码页面 — 提交邮箱申请密码重置，系统发送重置链接邮件
*
* 无论邮箱是否存在都返回成功提示（防止邮箱枚举攻击）。
*/
export default function ForgotPasswordPage() {
	_s();
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const schema = z.object({ email: z.string().min(1, t("auth.emailRequired", "邮箱不能为空")).email(t("auth.emailInvalid", "邮箱格式不正确")) });
	const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
	const onSubmit = async (data) => {
		setLoading(true);
		try {
			await api.post("/auth/forgot-password", { email: data.email });
			setSubmitted(true);
		} catch {
			// 即使失败也显示成功提示（防枚举）
			setSubmitted(true);
		} finally {
			setLoading(false);
		}
	};
	if (submitted) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.forgotPassword", "忘记密码") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 55,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 54,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [/* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center gap-3 rounded-md bg-green-500/10 p-4",
				children: [/* @__PURE__ */ _jsxDEV(Mail, { className: "h-5 w-5 text-green-600 shrink-0" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 59,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-green-700 dark:text-green-400",
					children: t("auth.resetEmailSent", "如果该邮箱已注册，重置链接已发送至您的邮箱。请检查收件箱（含垃圾邮件文件夹），链接 30 分钟内有效。")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 60,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 58,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "text-center text-sm text-muted-foreground",
				children: /* @__PURE__ */ _jsxDEV(Link, {
					to: "/login",
					className: "text-primary underline-offset-4 hover:underline",
					children: t("auth.backToLogin", "返回登录")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 65,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 64,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 57,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 53,
			columnNumber: 7
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.forgotPassword", "忘记密码") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 77,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("auth.forgotPasswordHint", "输入您的注册邮箱，我们将发送密码重置链接") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 78,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 76,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleSubmit(onSubmit),
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "email",
						children: t("auth.email", "邮箱")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "email",
						type: "email",
						...register("email"),
						placeholder: t("auth.emailPlaceholder", "请输入邮箱 you@example.com")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 13
					}, this),
					errors.email && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: errors.email.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 85,
						columnNumber: 30
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 82,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV(Button, {
				type: "submit",
				className: "w-full",
				disabled: loading,
				children: loading ? t("common.loading", "加载中...") : t("auth.sendResetLink", "发送重置链接")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 87,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "text-center text-sm text-muted-foreground",
				children: /* @__PURE__ */ _jsxDEV(Link, {
					to: "/login",
					className: "text-primary underline-offset-4 hover:underline",
					children: t("auth.backToLogin", "返回登录")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 91,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 90,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 81,
		columnNumber: 9
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 80,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 5
	}, this);
}
_s(ForgotPasswordPage, "H3VQvXrF/pLxVzqZG85NwyGUnAQ=", false, function() {
	return [useTranslation, useForm];
});
_c = ForgotPasswordPage;
var _c;
$RefreshReg$(_c, "ForgotPasswordPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/ForgotPasswordPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ForgotPasswordPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ForgotPasswordPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ForgotPasswordPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUN6QixFQUFFLG9CQUFvQixNQUFNO0lBQ3pCOzs7OztHQUNMOzs7OztFQUNDOzs7OztVQUNLOzs7O1NBQ1Q7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiRm9yZ290UGFzc3dvcmRQYWdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VGb3JtIH0gZnJvbSAncmVhY3QtaG9vay1mb3JtJztcbmltcG9ydCB7IHpvZFJlc29sdmVyIH0gZnJvbSAnQGhvb2tmb3JtL3Jlc29sdmVycy96b2QnO1xuaW1wb3J0IHsgeiB9IGZyb20gJ3pvZCc7XG5pbXBvcnQgeyBMaW5rIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBNYWlsIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYnV0dG9uJztcbmltcG9ydCB7IElucHV0IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvbGFiZWwnO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSwgQ2FyZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9jYXJkJztcbmltcG9ydCBhcGkgZnJvbSAnLi4vbGliL2FwaSc7XG5cbnR5cGUgRm9yZ290UGFzc3dvcmRGb3JtRGF0YSA9IHtcbiAgZW1haWw6IHN0cmluZztcbn07XG5cbi8qKlxuICog5b+Y6K6w5a+G56CB6aG16Z2iIOKAlCDmj5DkuqTpgq7nrrHnlLPor7flr4bnoIHph43nva7vvIzns7vnu5/lj5HpgIHph43nva7pk77mjqXpgq7ku7ZcbiAqXG4gKiDml6Dorrrpgq7nrrHmmK/lkKblrZjlnKjpg73ov5Tlm57miJDlip/mj5DnpLrvvIjpmLLmraLpgq7nrrHmnprkuL7mlLvlh7vvvInjgIJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRm9yZ290UGFzc3dvcmRQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdHRlZCwgc2V0U3VibWl0dGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBzY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgZW1haWw6IHouc3RyaW5nKCkubWluKDEsIHQoJ2F1dGguZW1haWxSZXF1aXJlZCcsICfpgq7nrrHkuI3og73kuLrnqbonKSkuZW1haWwodCgnYXV0aC5lbWFpbEludmFsaWQnLCAn6YKu566x5qC85byP5LiN5q2j56GuJykpLFxuICB9KTtcblxuICBjb25zdCB7XG4gICAgcmVnaXN0ZXIsXG4gICAgaGFuZGxlU3VibWl0LFxuICAgIGZvcm1TdGF0ZTogeyBlcnJvcnMgfSxcbiAgfSA9IHVzZUZvcm08Rm9yZ290UGFzc3dvcmRGb3JtRGF0YT4oeyByZXNvbHZlcjogem9kUmVzb2x2ZXIoc2NoZW1hKSB9KTtcblxuICBjb25zdCBvblN1Ym1pdCA9IGFzeW5jIChkYXRhOiBGb3Jnb3RQYXNzd29yZEZvcm1EYXRhKSA9PiB7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXBpLnBvc3QoJy9hdXRoL2ZvcmdvdC1wYXNzd29yZCcsIHsgZW1haWw6IGRhdGEuZW1haWwgfSk7XG4gICAgICBzZXRTdWJtaXR0ZWQodHJ1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyDljbPkvb/lpLHotKXkuZ/mmL7npLrmiJDlip/mj5DnpLrvvIjpmLLmnprkuL7vvIlcbiAgICAgIHNldFN1Ym1pdHRlZCh0cnVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGlmIChzdWJtaXR0ZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPENhcmQ+XG4gICAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICAgIDxDYXJkVGl0bGU+e3QoJ2F1dGguZm9yZ290UGFzc3dvcmQnLCAn5b+Y6K6w5a+G56CBJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcm91bmRlZC1tZCBiZy1ncmVlbi01MDAvMTAgcC00XCI+XG4gICAgICAgICAgICA8TWFpbCBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtZ3JlZW4tNjAwIHNocmluay0wXCIgLz5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmVlbi03MDAgZGFyazp0ZXh0LWdyZWVuLTQwMFwiPlxuICAgICAgICAgICAgICB7dCgnYXV0aC5yZXNldEVtYWlsU2VudCcsICflpoLmnpzor6Xpgq7nrrHlt7Lms6jlhozvvIzph43nva7pk77mjqXlt7Llj5HpgIHoh7PmgqjnmoTpgq7nrrHjgILor7fmo4Dmn6XmlLbku7bnrrHvvIjlkKvlnoPlnL7pgq7ku7bmlofku7blpLnvvInvvIzpk77mjqUgMzAg5YiG6ZKf5YaF5pyJ5pWI44CCJyl9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgIDxMaW5rIHRvPVwiL2xvZ2luXCIgY2xhc3NOYW1lPVwidGV4dC1wcmltYXJ5IHVuZGVybGluZS1vZmZzZXQtNCBob3Zlcjp1bmRlcmxpbmVcIj5cbiAgICAgICAgICAgICAge3QoJ2F1dGguYmFja1RvTG9naW4nLCAn6L+U5Zue55m75b2VJyl9XG4gICAgICAgICAgICA8L0xpbms+XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkVGl0bGU+e3QoJ2F1dGguZm9yZ290UGFzc3dvcmQnLCAn5b+Y6K6w5a+G56CBJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ2F1dGguZm9yZ290UGFzc3dvcmRIaW50JywgJ+i+k+WFpeaCqOeahOazqOWGjOmCrueuse+8jOaIkeS7rOWwhuWPkemAgeWvhueggemHjee9rumTvuaOpScpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KG9uU3VibWl0KX0gY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxMYWJlbCBodG1sRm9yPVwiZW1haWxcIj57dCgnYXV0aC5lbWFpbCcsICfpgq7nrrEnKX08L0xhYmVsPlxuICAgICAgICAgICAgPElucHV0IGlkPVwiZW1haWxcIiB0eXBlPVwiZW1haWxcIiB7Li4ucmVnaXN0ZXIoJ2VtYWlsJyl9IHBsYWNlaG9sZGVyPXt0KCdhdXRoLmVtYWlsUGxhY2Vob2xkZXInLCAn6K+36L6T5YWl6YKu566xIHlvdUBleGFtcGxlLmNvbScpfSAvPlxuICAgICAgICAgICAge2Vycm9ycy5lbWFpbCAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3JzLmVtYWlsLm1lc3NhZ2V9PC9wPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJ3LWZ1bGxcIiBkaXNhYmxlZD17bG9hZGluZ30+XG4gICAgICAgICAgICB7bG9hZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJywgJ+WKoOi9veS4rS4uLicpIDogdCgnYXV0aC5zZW5kUmVzZXRMaW5rJywgJ+WPkemAgemHjee9rumTvuaOpScpfVxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICA8TGluayB0bz1cIi9sb2dpblwiIGNsYXNzTmFtZT1cInRleHQtcHJpbWFyeSB1bmRlcmxpbmUtb2Zmc2V0LTQgaG92ZXI6dW5kZXJsaW5lXCI+XG4gICAgICAgICAgICAgIHt0KCdhdXRoLmJhY2tUb0xvZ2luJywgJ+i/lOWbnueZu+W9lScpfVxuICAgICAgICAgICAgPC9MaW5rPlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=