import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/ResetPasswordPage.tsx");const useState = __vite__cjsImport5_react["useState"];const _jsxDEV = __vite__cjsImport11_react_jsxDevRuntime["jsxDEV"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { Link, useNavigate, useSearchParams } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import api from "/src/lib/api.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ResetPasswordPage.tsx";
import __vite__cjsImport11_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 重置密码页面 — 从 URL ?token=xxx 读取重置令牌，提交新密码
*
* 用户从邮件点击重置链接进入此页面，输入新密码后跳转登录。
*/
export default function ResetPasswordPage() {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const schema = z.object({
		newPassword: z.string().min(8, t("auth.passwordMin", "密码至少 8 位")),
		confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired", "请再次输入密码"))
	}).refine((data) => data.newPassword === data.confirmPassword, {
		message: t("auth.passwordMismatch", "两次输入的密码不一致"),
		path: ["confirmPassword"]
	});
	const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
	const onSubmit = async (data) => {
		setLoading(true);
		setError("");
		try {
			await api.post("/auth/reset-password", {
				token,
				newPassword: data.newPassword
			});
			setSuccess(true);
			setTimeout(() => navigate("/login", { replace: true }), 2e3);
		} catch {
			setError(t("auth.resetFailed", "重置失败，链接可能已过期，请重新申请"));
		} finally {
			setLoading(false);
		}
	};
	// 无 token 时提示
	if (!token) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.resetPassword", "重置密码") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 67,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 66,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-destructive",
				children: t("auth.resetTokenMissing", "重置链接无效，缺少必要参数。请通过邮件中的链接进入。")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 70,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "text-center text-sm text-muted-foreground",
				children: /* @__PURE__ */ _jsxDEV(Link, {
					to: "/forgot-password",
					className: "text-primary underline-offset-4 hover:underline",
					children: t("auth.requestResetAgain", "重新申请重置")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 74,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 73,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 69,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 65,
			columnNumber: 7
		}, this);
	}
	if (success) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.resetPassword", "重置密码") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 87,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 86,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: /* @__PURE__ */ _jsxDEV("div", {
				className: "rounded-md bg-green-500/10 p-4",
				children: /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-green-700 dark:text-green-400",
					children: t("auth.resetSuccess", "密码重置成功！即将跳转登录页...")
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
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 89,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 85,
			columnNumber: 7
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("auth.resetPassword", "重置密码") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 103,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("auth.resetPasswordHint", "请输入您的新密码") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 104,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 102,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleSubmit(onSubmit),
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "newPassword",
						children: t("auth.newPassword", "新密码")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 109,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "newPassword",
						type: "password",
						...register("newPassword"),
						placeholder: t("auth.newPassword", "新密码")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 110,
						columnNumber: 13
					}, this),
					errors.newPassword && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: errors.newPassword.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 111,
						columnNumber: 36
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 108,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, {
						htmlFor: "confirmPassword",
						children: t("auth.confirmPassword", "确认新密码")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 114,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						id: "confirmPassword",
						type: "password",
						...register("confirmPassword"),
						placeholder: t("auth.confirmPassword", "确认新密码")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 115,
						columnNumber: 13
					}, this),
					errors.confirmPassword && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: errors.confirmPassword.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 116,
						columnNumber: 40
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 113,
				columnNumber: 11
			}, this),
			error && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-destructive",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(Button, {
				type: "submit",
				className: "w-full",
				disabled: loading,
				children: loading ? t("common.loading", "加载中...") : t("auth.resetPassword", "重置密码")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 119,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 107,
		columnNumber: 9
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 106,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 101,
		columnNumber: 5
	}, this);
}
_s(ResetPasswordPage, "4uCng25wBPw64GHUOcVC56C9qgY=", false, function() {
	return [
		useTranslation,
		useNavigate,
		useSearchParams,
		useForm
	];
});
_c = ResetPasswordPage;
var _c;
$RefreshReg$(_c, "ResetPasswordPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/ResetPasswordPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ResetPasswordPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ResetPasswordPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/ResetPasswordPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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MEIsVUFBVSxFQUFtQjs7OztTQUNqRTs7OztXQUNaLHdCQUFDLGFBQUQsWUFDRSx3QkFBQyxRQUFEO0VBQU0sVUFBVSxhQUFhLFFBQVE7RUFBRyxXQUFVO1lBQWxEO0dBQ0Usd0JBQUMsT0FBRDtJQUFLLFdBQVU7Y0FBZjtLQUNFLHdCQUFDLE9BQUQ7TUFBTyxTQUFRO2dCQUFlLEVBQUUsb0JBQW9CLEtBQUs7S0FBUzs7Ozs7S0FDbEUsd0JBQUMsT0FBRDtNQUFPLElBQUc7TUFBYyxNQUFLO01BQVcsR0FBSSxTQUFTLGFBQWE7TUFBRyxhQUFhLEVBQUUsb0JBQW9CLEtBQUs7S0FBSTs7Ozs7S0FDaEgsT0FBTyxlQUFlLHdCQUFDLEtBQUQ7TUFBRyxXQUFVO2dCQUE0QixPQUFPLFlBQVk7S0FBVzs7Ozs7SUFDM0Y7Ozs7OztHQUNMLHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQWY7S0FDRSx3QkFBQyxPQUFEO01BQU8sU0FBUTtnQkFBbUIsRUFBRSx3QkFBd0IsT0FBTztLQUFTOzs7OztLQUM1RSx3QkFBQyxPQUFEO01BQU8sSUFBRztNQUFrQixNQUFLO01BQVcsR0FBSSxTQUFTLGlCQUFpQjtNQUFHLGFBQWEsRUFBRSx3QkFBd0IsT0FBTztLQUFJOzs7OztLQUM5SCxPQUFPLG1CQUFtQix3QkFBQyxLQUFEO01BQUcsV0FBVTtnQkFBNEIsT0FBTyxnQkFBZ0I7S0FBVzs7Ozs7SUFDbkc7Ozs7OztHQUNKLFNBQVMsd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBNEI7R0FBUzs7Ozs7R0FDNUQsd0JBQUMsUUFBRDtJQUFRLE1BQUs7SUFBUyxXQUFVO0lBQVMsVUFBVTtjQUNoRCxVQUFVLEVBQUUsa0JBQWtCLFFBQVEsSUFBSSxFQUFFLHNCQUFzQixNQUFNO0dBQ25FOzs7OztFQUNKOzs7OztVQUNLOzs7O1NBQ1Q7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiUmVzZXRQYXNzd29yZFBhZ2UudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUZvcm0gfSBmcm9tICdyZWFjdC1ob29rLWZvcm0nO1xuaW1wb3J0IHsgem9kUmVzb2x2ZXIgfSBmcm9tICdAaG9va2Zvcm0vcmVzb2x2ZXJzL3pvZCc7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCB7IExpbmssIHVzZU5hdmlnYXRlLCB1c2VTZWFyY2hQYXJhbXMgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYnV0dG9uJztcbmltcG9ydCB7IElucHV0IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvbGFiZWwnO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSwgQ2FyZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9jYXJkJztcbmltcG9ydCBhcGkgZnJvbSAnLi4vbGliL2FwaSc7XG5cbnR5cGUgUmVzZXRQYXNzd29yZEZvcm1EYXRhID0ge1xuICBuZXdQYXNzd29yZDogc3RyaW5nO1xuICBjb25maXJtUGFzc3dvcmQ6IHN0cmluZztcbn07XG5cbi8qKlxuICog6YeN572u5a+G56CB6aG16Z2iIOKAlCDku44gVVJMID90b2tlbj14eHgg6K+75Y+W6YeN572u5Luk54mM77yM5o+Q5Lqk5paw5a+G56CBXG4gKlxuICog55So5oi35LuO6YKu5Lu254K55Ye76YeN572u6ZO+5o6l6L+b5YWl5q2k6aG16Z2i77yM6L6T5YWl5paw5a+G56CB5ZCO6Lez6L2s55m75b2V44CCXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlc2V0UGFzc3dvcmRQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcbiAgY29uc3QgW3NlYXJjaFBhcmFtc10gPSB1c2VTZWFyY2hQYXJhbXMoKTtcbiAgY29uc3QgdG9rZW4gPSBzZWFyY2hQYXJhbXMuZ2V0KCd0b2tlbicpID8/ICcnO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbc3VjY2Vzcywgc2V0U3VjY2Vzc10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3Qgc2NoZW1hID0gelxuICAgIC5vYmplY3Qoe1xuICAgICAgbmV3UGFzc3dvcmQ6IHouc3RyaW5nKCkubWluKDgsIHQoJ2F1dGgucGFzc3dvcmRNaW4nLCAn5a+G56CB6Iez5bCRIDgg5L2NJykpLFxuICAgICAgY29uZmlybVBhc3N3b3JkOiB6LnN0cmluZygpLm1pbigxLCB0KCdhdXRoLmNvbmZpcm1QYXNzd29yZFJlcXVpcmVkJywgJ+ivt+WGjeasoei+k+WFpeWvhueggScpKSxcbiAgICB9KVxuICAgIC5yZWZpbmUoKGRhdGEpID0+IGRhdGEubmV3UGFzc3dvcmQgPT09IGRhdGEuY29uZmlybVBhc3N3b3JkLCB7XG4gICAgICBtZXNzYWdlOiB0KCdhdXRoLnBhc3N3b3JkTWlzbWF0Y2gnLCAn5Lik5qyh6L6T5YWl55qE5a+G56CB5LiN5LiA6Ie0JyksXG4gICAgICBwYXRoOiBbJ2NvbmZpcm1QYXNzd29yZCddLFxuICAgIH0pO1xuXG4gIGNvbnN0IHtcbiAgICByZWdpc3RlcixcbiAgICBoYW5kbGVTdWJtaXQsXG4gICAgZm9ybVN0YXRlOiB7IGVycm9ycyB9LFxuICB9ID0gdXNlRm9ybTxSZXNldFBhc3N3b3JkRm9ybURhdGE+KHsgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKHNjaGVtYSkgfSk7XG5cbiAgY29uc3Qgb25TdWJtaXQgPSBhc3luYyAoZGF0YTogUmVzZXRQYXNzd29yZEZvcm1EYXRhKSA9PiB7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICBzZXRFcnJvcignJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFwaS5wb3N0KCcvYXV0aC9yZXNldC1wYXNzd29yZCcsIHsgdG9rZW4sIG5ld1Bhc3N3b3JkOiBkYXRhLm5ld1Bhc3N3b3JkIH0pO1xuICAgICAgc2V0U3VjY2Vzcyh0cnVlKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gbmF2aWdhdGUoJy9sb2dpbicsIHsgcmVwbGFjZTogdHJ1ZSB9KSwgMjAwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRFcnJvcih0KCdhdXRoLnJlc2V0RmFpbGVkJywgJ+mHjee9ruWksei0pe+8jOmTvuaOpeWPr+iDveW3sui/h+acn++8jOivt+mHjeaWsOeUs+ivtycpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIOaXoCB0b2tlbiDml7bmj5DnpLpcbiAgaWYgKCF0b2tlbikge1xuICAgIHJldHVybiAoXG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZT57dCgnYXV0aC5yZXNldFBhc3N3b3JkJywgJ+mHjee9ruWvhueggScpfTwvQ2FyZFRpdGxlPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj5cbiAgICAgICAgICAgIHt0KCdhdXRoLnJlc2V0VG9rZW5NaXNzaW5nJywgJ+mHjee9rumTvuaOpeaXoOaViO+8jOe8uuWwkeW/heimgeWPguaVsOOAguivt+mAmui/h+mCruS7tuS4reeahOmTvuaOpei/m+WFpeOAgicpfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgPExpbmsgdG89XCIvZm9yZ290LXBhc3N3b3JkXCIgY2xhc3NOYW1lPVwidGV4dC1wcmltYXJ5IHVuZGVybGluZS1vZmZzZXQtNCBob3Zlcjp1bmRlcmxpbmVcIj5cbiAgICAgICAgICAgICAge3QoJ2F1dGgucmVxdWVzdFJlc2V0QWdhaW4nLCAn6YeN5paw55Sz6K+36YeN572uJyl9XG4gICAgICAgICAgICA8L0xpbms+XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICBpZiAoc3VjY2Vzcykge1xuICAgIHJldHVybiAoXG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZT57dCgnYXV0aC5yZXNldFBhc3N3b3JkJywgJ+mHjee9ruWvhueggScpfTwvQ2FyZFRpdGxlPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQtbWQgYmctZ3JlZW4tNTAwLzEwIHAtNFwiPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyZWVuLTcwMCBkYXJrOnRleHQtZ3JlZW4tNDAwXCI+XG4gICAgICAgICAgICAgIHt0KCdhdXRoLnJlc2V0U3VjY2VzcycsICflr4bnoIHph43nva7miJDlip/vvIHljbPlsIbot7PovaznmbvlvZXpobUuLi4nKX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgIDwvQ2FyZD5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Q2FyZD5cbiAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICA8Q2FyZFRpdGxlPnt0KCdhdXRoLnJlc2V0UGFzc3dvcmQnLCAn6YeN572u5a+G56CBJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ2F1dGgucmVzZXRQYXNzd29yZEhpbnQnLCAn6K+36L6T5YWl5oKo55qE5paw5a+G56CBJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXQob25TdWJtaXQpfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsIGh0bWxGb3I9XCJuZXdQYXNzd29yZFwiPnt0KCdhdXRoLm5ld1Bhc3N3b3JkJywgJ+aWsOWvhueggScpfTwvTGFiZWw+XG4gICAgICAgICAgICA8SW5wdXQgaWQ9XCJuZXdQYXNzd29yZFwiIHR5cGU9XCJwYXNzd29yZFwiIHsuLi5yZWdpc3RlcignbmV3UGFzc3dvcmQnKX0gcGxhY2Vob2xkZXI9e3QoJ2F1dGgubmV3UGFzc3dvcmQnLCAn5paw5a+G56CBJyl9IC8+XG4gICAgICAgICAgICB7ZXJyb3JzLm5ld1Bhc3N3b3JkICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcnMubmV3UGFzc3dvcmQubWVzc2FnZX08L3A+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWwgaHRtbEZvcj1cImNvbmZpcm1QYXNzd29yZFwiPnt0KCdhdXRoLmNvbmZpcm1QYXNzd29yZCcsICfnoa7orqTmlrDlr4bnoIEnKX08L0xhYmVsPlxuICAgICAgICAgICAgPElucHV0IGlkPVwiY29uZmlybVBhc3N3b3JkXCIgdHlwZT1cInBhc3N3b3JkXCIgey4uLnJlZ2lzdGVyKCdjb25maXJtUGFzc3dvcmQnKX0gcGxhY2Vob2xkZXI9e3QoJ2F1dGguY29uZmlybVBhc3N3b3JkJywgJ+ehruiupOaWsOWvhueggScpfSAvPlxuICAgICAgICAgICAge2Vycm9ycy5jb25maXJtUGFzc3dvcmQgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9ycy5jb25maXJtUGFzc3dvcmQubWVzc2FnZX08L3A+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHtlcnJvciAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3J9PC9wPn1cbiAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJ3LWZ1bGxcIiBkaXNhYmxlZD17bG9hZGluZ30+XG4gICAgICAgICAgICB7bG9hZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJywgJ+WKoOi9veS4rS4uLicpIDogdCgnYXV0aC5yZXNldFBhc3N3b3JkJywgJ+mHjee9ruWvhueggScpfVxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L0NhcmRDb250ZW50PlxuICAgIDwvQ2FyZD5cbiAgKTtcbn1cbiJdfQ==