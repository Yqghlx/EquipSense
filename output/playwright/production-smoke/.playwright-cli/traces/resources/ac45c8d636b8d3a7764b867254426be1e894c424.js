import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/user/UserFormDialog.tsx");const useEffect = __vite__cjsImport0_react["useEffect"];const _jsxDEV = __vite__cjsImport10_react_jsxDevRuntime["jsxDEV"];/**
* 创建/编辑用户表单对话框
*
* 支持两种模式：
* - 创建模式（user=null）：显示用户名、密码、角色、显示名称、邮箱、手机
* - 编辑模式（user 非空）：仅显示名称、邮箱、手机（后端 UpdateUserRequest 限制）
*
* 使用 React Hook Form + Zod 进行表单验证。
*/
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "/src/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/user/UserFormDialog.tsx";
import __vite__cjsImport10_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 角色选项（值与后端枚举一致） */
const ROLE_OPTIONS = [
	{
		value: "SystemAdmin",
		labelKey: "settings.role.systemAdmin"
	},
	{
		value: "MaintenanceLead",
		labelKey: "settings.role.maintenanceLead"
	},
	{
		value: "Technician",
		labelKey: "settings.role.technician"
	},
	{
		value: "Operator",
		labelKey: "settings.role.operator"
	},
	{
		value: "Viewer",
		labelKey: "settings.role.viewer"
	}
];
export function UserFormDialog({ open, onClose, user, onSubmit, submitting }) {
	_s();
	const { t } = useTranslation();
	const isEdit = !!user;
	/** 统一 schema：创建模式下 username/password 必填 */
	const schema = z.object({
		username: z.string(),
		password: z.string(),
		role: z.string(),
		displayName: z.string(),
		email: z.string(),
		phone: z.string()
	}).superRefine((data, ctx) => {
		if (!isEdit) {
			if (!data.username || data.username.length < 3) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["username"],
					message: t("settings.user.usernameMin")
				});
			}
			if (!data.password || data.password.length < 8) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["password"],
					message: t("settings.user.passwordMin")
				});
			}
		}
		if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["email"],
				message: t("settings.user.emailInvalid")
			});
		}
	});
	const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			username: "",
			password: "",
			role: "Viewer",
			displayName: "",
			email: "",
			phone: ""
		}
	});
	const currentRole = watch("role");
	/** 打开时初始化表单数据 */
	useEffect(() => {
		if (open) {
			if (user) {
				reset({
					username: user.username,
					password: "",
					role: user.role,
					displayName: user.displayName ?? "",
					email: user.email ?? "",
					phone: user.phone ?? ""
				});
			} else {
				reset({
					username: "",
					password: "",
					role: "Viewer",
					displayName: "",
					email: "",
					phone: ""
				});
			}
		}
	}, [
		open,
		user,
		reset
	]);
	/** 提交表单 */
	const handleFormSubmit = (data) => {
		if (isEdit) {
			const payload = {
				displayName: data.displayName || undefined,
				email: data.email || undefined,
				phone: data.phone || undefined
			};
			onSubmit(payload);
		} else {
			const payload = {
				username: data.username,
				password: data.password,
				displayName: data.displayName || undefined,
				role: data.role || "Viewer",
				email: data.email || undefined,
				phone: data.phone || undefined
			};
			onSubmit(payload);
		}
	};
	return /* @__PURE__ */ _jsxDEV(Dialog, {
		open,
		onOpenChange: (v) => {
			if (!v) onClose();
		},
		children: /* @__PURE__ */ _jsxDEV(DialogContent, {
			className: "max-w-md",
			children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: isEdit ? t("settings.user.editUser") : t("settings.user.createUser") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 144,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: isEdit ? t("settings.user.editUserDesc") : t("settings.user.createUserDesc") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 145,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 143,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("form", {
				onSubmit: handleSubmit(handleFormSubmit),
				className: "space-y-4",
				children: [
					!isEdit && /* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: [t("settings.username"), " *"] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 154,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								...register("username"),
								placeholder: t("settings.user.usernamePlaceholder")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 155,
								columnNumber: 15
							}, this),
							errors.username && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.username.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 156,
								columnNumber: 35
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 153,
						columnNumber: 13
					}, this),
					!isEdit && /* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: [t("auth.password"), " *"] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 163,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								type: "password",
								...register("password"),
								placeholder: t("settings.user.passwordPlaceholder")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 164,
								columnNumber: 15
							}, this),
							errors.password && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.password.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 165,
								columnNumber: 35
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 162,
						columnNumber: 13
					}, this),
					!isEdit && /* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.roleLabel") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 172,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Select, {
							value: currentRole,
							onValueChange: (v) => {
								if (v) setValue("role", v);
							},
							children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 174,
								columnNumber: 32
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 174,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: ROLE_OPTIONS.map((opt) => /* @__PURE__ */ _jsxDEV(SelectItem, {
								value: opt.value,
								children: t(opt.labelKey)
							}, opt.value, false, {
								fileName: _jsxFileName,
								lineNumber: 177,
								columnNumber: 21
							}, this)) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 175,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 173,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 171,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.user.displayName") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 186,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Input, {
							...register("displayName"),
							placeholder: t("settings.user.displayNamePlaceholder")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 187,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 185,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.user.email") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 192,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								...register("email"),
								placeholder: t("settings.user.emailPlaceholder")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 193,
								columnNumber: 13
							}, this),
							errors.email && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.email.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 194,
								columnNumber: 30
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 191,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.user.phone") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 199,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Input, {
							...register("phone"),
							placeholder: t("settings.user.phonePlaceholder")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 200,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 198,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(DialogFooter, {
						className: "gap-2 pt-2",
						children: [/* @__PURE__ */ _jsxDEV(Button, {
							type: "button",
							variant: "outline",
							onClick: onClose,
							disabled: submitting,
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 204,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							type: "submit",
							disabled: submitting,
							children: submitting ? t("common.loading") : isEdit ? t("common.save") : t("common.create")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 207,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 203,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 150,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 142,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 141,
		columnNumber: 5
	}, this);
}
_s(UserFormDialog, "EEQcO4VIL2MlwPvY0IQDR+R3Eh0=", false, function() {
	return [useTranslation, useForm];
});
_c = UserFormDialog;
var _c;
$RefreshReg$(_c, "UserFormDialog");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/user/UserFormDialog.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/user/UserFormDialog.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/user/UserFormDialog.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/user/UserFormDialog.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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UyxPQUFPO09BQUcsYUFBYSxFQUFFLGdDQUFnQztNQUFJOzs7O2NBQzlFOzs7Ozs7S0FFTCx3QkFBQyxjQUFEO01BQWMsV0FBVTtnQkFBeEIsQ0FDRSx3QkFBQyxRQUFEO09BQVEsTUFBSztPQUFTLFNBQVE7T0FBVSxTQUFTO09BQVMsVUFBVTtpQkFDakUsRUFBRSxlQUFlO01BQ1o7Ozs7Z0JBQ1Isd0JBQUMsUUFBRDtPQUFRLE1BQUs7T0FBUyxVQUFVO2lCQUM3QixhQUFhLEVBQUUsZ0JBQWdCLElBQUssU0FBUyxFQUFFLGFBQWEsSUFBSSxFQUFFLGVBQWU7TUFDNUU7Ozs7Y0FDSTs7Ozs7O0lBQ1Y7Ozs7O1dBQ087Ozs7OztDQUNUOzs7OztBQUVaIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlVzZXJGb3JtRGlhbG9nLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOWIm+W7ui/nvJbovpHnlKjmiLfooajljZXlr7nor53moYZcbiAqXG4gKiDmlK/mjIHkuKTnp43mqKHlvI/vvJpcbiAqIC0g5Yib5bu65qih5byP77yIdXNlcj1udWxs77yJ77ya5pi+56S655So5oi35ZCN44CB5a+G56CB44CB6KeS6Imy44CB5pi+56S65ZCN56ew44CB6YKu566x44CB5omL5py6XG4gKiAtIOe8lui+keaooeW8j++8iHVzZXIg6Z2e56m677yJ77ya5LuF5pi+56S65ZCN56ew44CB6YKu566x44CB5omL5py677yI5ZCO56uvIFVwZGF0ZVVzZXJSZXF1ZXN0IOmZkOWItu+8iVxuICpcbiAqIOS9v+eUqCBSZWFjdCBIb29rIEZvcm0gKyBab2Qg6L+b6KGM6KGo5Y2V6aqM6K+B44CCXG4gKi9cbmltcG9ydCB7IHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUZvcm0gfSBmcm9tICdyZWFjdC1ob29rLWZvcm0nO1xuaW1wb3J0IHsgem9kUmVzb2x2ZXIgfSBmcm9tICdAaG9va2Zvcm0vcmVzb2x2ZXJzL3pvZCc7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuLi91aS9idXR0b24nO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL3VpL2xhYmVsJztcbmltcG9ydCB7XG4gIERpYWxvZyxcbiAgRGlhbG9nQ29udGVudCxcbiAgRGlhbG9nSGVhZGVyLFxuICBEaWFsb2dUaXRsZSxcbiAgRGlhbG9nRGVzY3JpcHRpb24sXG4gIERpYWxvZ0Zvb3Rlcixcbn0gZnJvbSAnLi4vdWkvZGlhbG9nJztcbmltcG9ydCB7XG4gIFNlbGVjdCxcbiAgU2VsZWN0Q29udGVudCxcbiAgU2VsZWN0SXRlbSxcbiAgU2VsZWN0VHJpZ2dlcixcbiAgU2VsZWN0VmFsdWUsXG59IGZyb20gJy4uL3VpL3NlbGVjdCc7XG5pbXBvcnQgdHlwZSB7IFVzZXJJdGVtLCBDcmVhdGVVc2VyUGF5bG9hZCwgVXBkYXRlVXNlclBheWxvYWQgfSBmcm9tICcuLi8uLi9ob29rcy91c2VVc2Vycyc7XG5cbi8qKiDop5LoibLpgInpobnvvIjlgLzkuI7lkI7nq6/mnprkuL7kuIDoh7TvvIkgKi9cbmNvbnN0IFJPTEVfT1BUSU9OUyA9IFtcbiAgeyB2YWx1ZTogJ1N5c3RlbUFkbWluJywgbGFiZWxLZXk6ICdzZXR0aW5ncy5yb2xlLnN5c3RlbUFkbWluJyB9LFxuICB7IHZhbHVlOiAnTWFpbnRlbmFuY2VMZWFkJywgbGFiZWxLZXk6ICdzZXR0aW5ncy5yb2xlLm1haW50ZW5hbmNlTGVhZCcgfSxcbiAgeyB2YWx1ZTogJ1RlY2huaWNpYW4nLCBsYWJlbEtleTogJ3NldHRpbmdzLnJvbGUudGVjaG5pY2lhbicgfSxcbiAgeyB2YWx1ZTogJ09wZXJhdG9yJywgbGFiZWxLZXk6ICdzZXR0aW5ncy5yb2xlLm9wZXJhdG9yJyB9LFxuICB7IHZhbHVlOiAnVmlld2VyJywgbGFiZWxLZXk6ICdzZXR0aW5ncy5yb2xlLnZpZXdlcicgfSxcbl0gYXMgY29uc3Q7XG5cbi8qKiDnu5/kuIDooajljZXmlbDmja7vvIjmiYDmnInlrZfmrrXpg73ljIXlkKvvvIzpgJrov4cgc3VwZXJSZWZpbmUg5Yqo5oCB6aqM6K+B77yJICovXG5pbnRlcmZhY2UgRm9ybURhdGEge1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByb2xlOiBzdHJpbmc7XG4gIGRpc3BsYXlOYW1lOiBzdHJpbmc7XG4gIGVtYWlsOiBzdHJpbmc7XG4gIHBob25lOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVc2VyRm9ybURpYWxvZ1Byb3BzIHtcbiAgLyoqIOaYr+WQpuaJk+W8gOWvueivneahhiAqL1xuICBvcGVuOiBib29sZWFuO1xuICAvKiog5YWz6Zet5Zue6LCDICovXG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG4gIC8qKiDlvoXnvJbovpHnmoTnlKjmiLfvvIxudWxsIOihqOekuuWIm+W7uuaooeW8jyAqL1xuICB1c2VyOiBVc2VySXRlbSB8IG51bGw7XG4gIC8qKiDmj5DkuqTlm57osIPvvIjliJvlu7rmiJbmm7TmlrDvvIkgKi9cbiAgb25TdWJtaXQ6IChkYXRhOiBDcmVhdGVVc2VyUGF5bG9hZCB8IFVwZGF0ZVVzZXJQYXlsb2FkKSA9PiB2b2lkO1xuICAvKiog5piv5ZCm5q2j5Zyo5o+Q5LqkICovXG4gIHN1Ym1pdHRpbmc/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gVXNlckZvcm1EaWFsb2coeyBvcGVuLCBvbkNsb3NlLCB1c2VyLCBvblN1Ym1pdCwgc3VibWl0dGluZyB9OiBVc2VyRm9ybURpYWxvZ1Byb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgaXNFZGl0ID0gISF1c2VyO1xuXG4gIC8qKiDnu5/kuIAgc2NoZW1h77ya5Yib5bu65qih5byP5LiLIHVzZXJuYW1lL3Bhc3N3b3JkIOW/heWhqyAqL1xuICBjb25zdCBzY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgdXNlcm5hbWU6IHouc3RyaW5nKCksXG4gICAgcGFzc3dvcmQ6IHouc3RyaW5nKCksXG4gICAgcm9sZTogei5zdHJpbmcoKSxcbiAgICBkaXNwbGF5TmFtZTogei5zdHJpbmcoKSxcbiAgICBlbWFpbDogei5zdHJpbmcoKSxcbiAgICBwaG9uZTogei5zdHJpbmcoKSxcbiAgfSkuc3VwZXJSZWZpbmUoKGRhdGEsIGN0eCkgPT4ge1xuICAgIGlmICghaXNFZGl0KSB7XG4gICAgICBpZiAoIWRhdGEudXNlcm5hbWUgfHwgZGF0YS51c2VybmFtZS5sZW5ndGggPCAzKSB7XG4gICAgICAgIGN0eC5hZGRJc3N1ZSh7IGNvZGU6IHouWm9kSXNzdWVDb2RlLmN1c3RvbSwgcGF0aDogWyd1c2VybmFtZSddLCBtZXNzYWdlOiB0KCdzZXR0aW5ncy51c2VyLnVzZXJuYW1lTWluJykgfSk7XG4gICAgICB9XG4gICAgICBpZiAoIWRhdGEucGFzc3dvcmQgfHwgZGF0YS5wYXNzd29yZC5sZW5ndGggPCA4KSB7XG4gICAgICAgIGN0eC5hZGRJc3N1ZSh7IGNvZGU6IHouWm9kSXNzdWVDb2RlLmN1c3RvbSwgcGF0aDogWydwYXNzd29yZCddLCBtZXNzYWdlOiB0KCdzZXR0aW5ncy51c2VyLnBhc3N3b3JkTWluJykgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkYXRhLmVtYWlsICYmICEvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLy50ZXN0KGRhdGEuZW1haWwpKSB7XG4gICAgICBjdHguYWRkSXNzdWUoeyBjb2RlOiB6LlpvZElzc3VlQ29kZS5jdXN0b20sIHBhdGg6IFsnZW1haWwnXSwgbWVzc2FnZTogdCgnc2V0dGluZ3MudXNlci5lbWFpbEludmFsaWQnKSB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IHtcbiAgICByZWdpc3RlcixcbiAgICBoYW5kbGVTdWJtaXQsXG4gICAgcmVzZXQsXG4gICAgc2V0VmFsdWUsXG4gICAgd2F0Y2gsXG4gICAgZm9ybVN0YXRlOiB7IGVycm9ycyB9LFxuICB9ID0gdXNlRm9ybTxGb3JtRGF0YT4oe1xuICAgIHJlc29sdmVyOiB6b2RSZXNvbHZlcihzY2hlbWEpLFxuICAgIGRlZmF1bHRWYWx1ZXM6IHsgdXNlcm5hbWU6ICcnLCBwYXNzd29yZDogJycsIHJvbGU6ICdWaWV3ZXInLCBkaXNwbGF5TmFtZTogJycsIGVtYWlsOiAnJywgcGhvbmU6ICcnIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGN1cnJlbnRSb2xlID0gd2F0Y2goJ3JvbGUnKTtcblxuICAvKiog5omT5byA5pe25Yid5aeL5YyW6KGo5Y2V5pWw5o2uICovXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHJlc2V0KHsgdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsIHBhc3N3b3JkOiAnJywgcm9sZTogdXNlci5yb2xlLCBkaXNwbGF5TmFtZTogdXNlci5kaXNwbGF5TmFtZSA/PyAnJywgZW1haWw6IHVzZXIuZW1haWwgPz8gJycsIHBob25lOiB1c2VyLnBob25lID8/ICcnIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzZXQoeyB1c2VybmFtZTogJycsIHBhc3N3b3JkOiAnJywgcm9sZTogJ1ZpZXdlcicsIGRpc3BsYXlOYW1lOiAnJywgZW1haWw6ICcnLCBwaG9uZTogJycgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbb3BlbiwgdXNlciwgcmVzZXRdKTtcblxuICAvKiog5o+Q5Lqk6KGo5Y2VICovXG4gIGNvbnN0IGhhbmRsZUZvcm1TdWJtaXQgPSAoZGF0YTogRm9ybURhdGEpID0+IHtcbiAgICBpZiAoaXNFZGl0KSB7XG4gICAgICBjb25zdCBwYXlsb2FkOiBVcGRhdGVVc2VyUGF5bG9hZCA9IHtcbiAgICAgICAgZGlzcGxheU5hbWU6IGRhdGEuZGlzcGxheU5hbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBlbWFpbDogZGF0YS5lbWFpbCB8fCB1bmRlZmluZWQsXG4gICAgICAgIHBob25lOiBkYXRhLnBob25lIHx8IHVuZGVmaW5lZCxcbiAgICAgIH07XG4gICAgICBvblN1Ym1pdChwYXlsb2FkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcGF5bG9hZDogQ3JlYXRlVXNlclBheWxvYWQgPSB7XG4gICAgICAgIHVzZXJuYW1lOiBkYXRhLnVzZXJuYW1lLFxuICAgICAgICBwYXNzd29yZDogZGF0YS5wYXNzd29yZCxcbiAgICAgICAgZGlzcGxheU5hbWU6IGRhdGEuZGlzcGxheU5hbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByb2xlOiBkYXRhLnJvbGUgfHwgJ1ZpZXdlcicsXG4gICAgICAgIGVtYWlsOiBkYXRhLmVtYWlsIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgcGhvbmU6IGRhdGEucGhvbmUgfHwgdW5kZWZpbmVkLFxuICAgICAgfTtcbiAgICAgIG9uU3VibWl0KHBheWxvYWQpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2cgb3Blbj17b3Blbn0gb25PcGVuQ2hhbmdlPXsodikgPT4geyBpZiAoIXYpIG9uQ2xvc2UoKTsgfX0+XG4gICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9XCJtYXgtdy1tZFwiPlxuICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgIDxEaWFsb2dUaXRsZT57aXNFZGl0ID8gdCgnc2V0dGluZ3MudXNlci5lZGl0VXNlcicpIDogdCgnc2V0dGluZ3MudXNlci5jcmVhdGVVc2VyJyl9PC9EaWFsb2dUaXRsZT5cbiAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+XG4gICAgICAgICAgICB7aXNFZGl0ID8gdCgnc2V0dGluZ3MudXNlci5lZGl0VXNlckRlc2MnKSA6IHQoJ3NldHRpbmdzLnVzZXIuY3JlYXRlVXNlckRlc2MnKX1cbiAgICAgICAgICA8L0RpYWxvZ0Rlc2NyaXB0aW9uPlxuICAgICAgICA8L0RpYWxvZ0hlYWRlcj5cblxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KGhhbmRsZUZvcm1TdWJtaXQpfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7Lyog5Yib5bu65qih5byP77ya55So5oi35ZCNICovfVxuICAgICAgICAgIHshaXNFZGl0ICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgIDxMYWJlbD57dCgnc2V0dGluZ3MudXNlcm5hbWUnKX0gKjwvTGFiZWw+XG4gICAgICAgICAgICAgIDxJbnB1dCB7Li4ucmVnaXN0ZXIoJ3VzZXJuYW1lJyl9IHBsYWNlaG9sZGVyPXt0KCdzZXR0aW5ncy51c2VyLnVzZXJuYW1lUGxhY2Vob2xkZXInKX0gLz5cbiAgICAgICAgICAgICAge2Vycm9ycy51c2VybmFtZSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3JzLnVzZXJuYW1lLm1lc3NhZ2V9PC9wPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7Lyog5Yib5bu65qih5byP77ya5a+G56CBICovfVxuICAgICAgICAgIHshaXNFZGl0ICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgIDxMYWJlbD57dCgnYXV0aC5wYXNzd29yZCcpfSAqPC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IHR5cGU9XCJwYXNzd29yZFwiIHsuLi5yZWdpc3RlcigncGFzc3dvcmQnKX0gcGxhY2Vob2xkZXI9e3QoJ3NldHRpbmdzLnVzZXIucGFzc3dvcmRQbGFjZWhvbGRlcicpfSAvPlxuICAgICAgICAgICAgICB7ZXJyb3JzLnBhc3N3b3JkICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcnMucGFzc3dvcmQubWVzc2FnZX08L3A+fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIHsvKiDliJvlu7rmqKHlvI/vvJrop5LoibLpgInmi6kgKi99XG4gICAgICAgICAgeyFpc0VkaXQgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5yb2xlTGFiZWwnKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtjdXJyZW50Um9sZX0gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYpIHNldFZhbHVlKCdyb2xlJywgdik7IH19PlxuICAgICAgICAgICAgICAgIDxTZWxlY3RUcmlnZ2VyPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgIHtST0xFX09QVElPTlMubWFwKChvcHQpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0ga2V5PXtvcHQudmFsdWV9IHZhbHVlPXtvcHQudmFsdWV9Pnt0KG9wdC5sYWJlbEtleSl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7Lyog5pi+56S65ZCN56ewICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ3NldHRpbmdzLnVzZXIuZGlzcGxheU5hbWUnKX08L0xhYmVsPlxuICAgICAgICAgICAgPElucHV0IHsuLi5yZWdpc3RlcignZGlzcGxheU5hbWUnKX0gcGxhY2Vob2xkZXI9e3QoJ3NldHRpbmdzLnVzZXIuZGlzcGxheU5hbWVQbGFjZWhvbGRlcicpfSAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOmCrueusSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy51c2VyLmVtYWlsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxJbnB1dCB7Li4ucmVnaXN0ZXIoJ2VtYWlsJyl9IHBsYWNlaG9sZGVyPXt0KCdzZXR0aW5ncy51c2VyLmVtYWlsUGxhY2Vob2xkZXInKX0gLz5cbiAgICAgICAgICAgIHtlcnJvcnMuZW1haWwgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9ycy5lbWFpbC5tZXNzYWdlfTwvcD59XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog5omL5py65Y+3ICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ3NldHRpbmdzLnVzZXIucGhvbmUnKX08L0xhYmVsPlxuICAgICAgICAgICAgPElucHV0IHsuLi5yZWdpc3RlcigncGhvbmUnKX0gcGxhY2Vob2xkZXI9e3QoJ3NldHRpbmdzLnVzZXIucGhvbmVQbGFjZWhvbGRlcicpfSAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPERpYWxvZ0Zvb3RlciBjbGFzc05hbWU9XCJnYXAtMiBwdC0yXCI+XG4gICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJidXR0b25cIiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9e29uQ2xvc2V9IGRpc2FibGVkPXtzdWJtaXR0aW5nfT5cbiAgICAgICAgICAgICAge3QoJ2NvbW1vbi5jYW5jZWwnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwic3VibWl0XCIgZGlzYWJsZWQ9e3N1Ym1pdHRpbmd9PlxuICAgICAgICAgICAgICB7c3VibWl0dGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJykgOiAoaXNFZGl0ID8gdCgnY29tbW9uLnNhdmUnKSA6IHQoJ2NvbW1vbi5jcmVhdGUnKSl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8L0RpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9EaWFsb2dDb250ZW50PlxuICAgIDwvRGlhbG9nPlxuICApO1xufVxuIl19