import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/auth/ChangePasswordDialog.tsx");const useState = __vite__cjsImport4_react["useState"];const _jsxDEV = __vite__cjsImport11_react_jsxDevRuntime["jsxDEV"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import __vite__cjsImport4_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "/src/components/ui/dialog.tsx";
import api from "/src/lib/api.ts";
import { useAuthStore } from "/src/stores/authStore.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/auth/ChangePasswordDialog.tsx";
import __vite__cjsImport11_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 修改密码对话框
*
* 支持两种模式：
* - forced=true：首次登录强制改密，隐藏关闭按钮
* - forced=false：用户主动修改，可随时关闭
*/
export function ChangePasswordDialog({ forced = false, onSuccess }) {
	_s();
	const { t } = useTranslation();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const user = useAuthStore((s) => s.user);
	const setAuth = useAuthStore((s) => s.setAuth);
	const schema = z.object({
		currentPassword: z.string().min(1, t("auth.currentPasswordRequired")),
		newPassword: z.string().min(8, t("auth.newPasswordMin")),
		confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired"))
	}).refine((d) => d.newPassword === d.confirmPassword, {
		message: t("auth.passwordMismatch"),
		path: ["confirmPassword"]
	});
	const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
	const onSubmit = async (data) => {
		setLoading(true);
		setError("");
		try {
			await api.post("/auth/change-password", {
				currentPassword: data.currentPassword,
				newPassword: data.newPassword
			});
			// 更新本地用户信息，清除 mustChangePassword 标志
			// v1.3.0 HttpOnly Cookie 迁移后，setAuth 只接收 user（token 不再前端管理）
			if (user) {
				setAuth({
					...user,
					mustChangePassword: false
				});
			}
			onSuccess?.();
		} catch {
			setError(t("auth.changePasswordError"));
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ _jsxDEV(Dialog, {
		open: true,
		children: /* @__PURE__ */ _jsxDEV(DialogContent, {
			showCloseButton: !forced,
			children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("auth.changePassword") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 89,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: forced ? t("auth.forceChangePasswordHint") : t("auth.changePasswordHint") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 90,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 88,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("form", {
				onSubmit: handleSubmit(onSubmit),
				className: "space-y-4",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: t("auth.currentPassword") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 96,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								type: "password",
								...register("currentPassword")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 97,
								columnNumber: 13
							}, this),
							errors.currentPassword && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.currentPassword.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 98,
								columnNumber: 40
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 95,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: t("auth.newPassword") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 101,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								type: "password",
								...register("newPassword")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 102,
								columnNumber: 13
							}, this),
							errors.newPassword && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.newPassword.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 103,
								columnNumber: 36
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 100,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ _jsxDEV(Label, { children: t("auth.confirmPassword") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 106,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Input, {
								type: "password",
								...register("confirmPassword")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 107,
								columnNumber: 13
							}, this),
							errors.confirmPassword && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-destructive",
								children: errors.confirmPassword.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 108,
								columnNumber: 40
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 11
					}, this),
					error && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: error
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 110,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "flex justify-end gap-2",
						children: /* @__PURE__ */ _jsxDEV(Button, {
							type: "submit",
							disabled: loading,
							children: loading ? t("common.loading") : t("common.save")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 112,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 111,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 94,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 87,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 86,
		columnNumber: 5
	}, this);
}
_s(ChangePasswordDialog, "mmua9P5swcRz7y3/UEoGhHD9qXc=", false, function() {
	return [
		useTranslation,
		useAuthStore,
		useAuthStore,
		useForm
	];
});
_c = ChangePasswordDialog;
var _c;
$RefreshReg$(_c, "ChangePasswordDialog");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/auth/ChangePasswordDialog.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/auth/ChangePasswordDialog.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/auth/ChangePasswordDialog.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/auth/ChangePasswordDialog.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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TUFBSyxXQUFVO2dCQUFmO09BQ0Usd0JBQUMsT0FBRCxZQUFRLEVBQUUsc0JBQXNCLEVBQVM7Ozs7O09BQ3pDLHdCQUFDLE9BQUQ7UUFBTyxNQUFLO1FBQVcsR0FBSSxTQUFTLGlCQUFpQjtPQUFJOzs7OztPQUN4RCxPQUFPLG1CQUFtQix3QkFBQyxLQUFEO1FBQUcsV0FBVTtrQkFBNEIsT0FBTyxnQkFBZ0I7T0FBVzs7Ozs7TUFDbkc7Ozs7OztLQUNKLFNBQVMsd0JBQUMsS0FBRDtNQUFHLFdBQVU7Z0JBQTRCO0tBQVM7Ozs7O0tBQzVELHdCQUFDLE9BQUQ7TUFBSyxXQUFVO2dCQUNiLHdCQUFDLFFBQUQ7T0FBUSxNQUFLO09BQVMsVUFBVTtpQkFDN0IsVUFBVSxFQUFFLGdCQUFnQixJQUFJLEVBQUUsYUFBYTtNQUMxQzs7Ozs7S0FDTDs7Ozs7SUFDRDs7Ozs7V0FDTzs7Ozs7O0NBQ1Q7Ozs7O0FBRVoiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQ2hhbmdlUGFzc3dvcmREaWFsb2cudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUZvcm0gfSBmcm9tICdyZWFjdC1ob29rLWZvcm0nO1xuaW1wb3J0IHsgem9kUmVzb2x2ZXIgfSBmcm9tICdAaG9va2Zvcm0vcmVzb2x2ZXJzL3pvZCc7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vdWkvbGFiZWwnO1xuaW1wb3J0IHtcbiAgRGlhbG9nLFxuICBEaWFsb2dDb250ZW50LFxuICBEaWFsb2dIZWFkZXIsXG4gIERpYWxvZ1RpdGxlLFxuICBEaWFsb2dEZXNjcmlwdGlvbixcbn0gZnJvbSAnLi4vdWkvZGlhbG9nJztcbmltcG9ydCBhcGkgZnJvbSAnLi4vLi4vbGliL2FwaSc7XG5pbXBvcnQgeyB1c2VBdXRoU3RvcmUgfSBmcm9tICcuLi8uLi9zdG9yZXMvYXV0aFN0b3JlJztcblxuLyoqIOS/ruaUueWvhueggeihqOWNleaVsOaNriAqL1xudHlwZSBDaGFuZ2VQYXNzd29yZEZvcm1EYXRhID0ge1xuICBjdXJyZW50UGFzc3dvcmQ6IHN0cmluZztcbiAgbmV3UGFzc3dvcmQ6IHN0cmluZztcbiAgY29uZmlybVBhc3N3b3JkOiBzdHJpbmc7XG59O1xuXG5pbnRlcmZhY2UgQ2hhbmdlUGFzc3dvcmREaWFsb2dQcm9wcyB7XG4gIC8qKiDmmK/lkKblvLrliLbkv67mlLnvvIjpppbmrKHnmbvlvZXvvInvvIzkuI3lj6/lhbPpl60gKi9cbiAgZm9yY2VkPzogYm9vbGVhbjtcbiAgLyoqIOS/ruaUueaIkOWKn+WbnuiwgyAqL1xuICBvblN1Y2Nlc3M/OiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIOS/ruaUueWvhueggeWvueivneahhlxuICpcbiAqIOaUr+aMgeS4pOenjeaooeW8j++8mlxuICogLSBmb3JjZWQ9dHJ1Ze+8mummluasoeeZu+W9leW8uuWItuaUueWvhu+8jOmakOiXj+WFs+mXreaMiemSrlxuICogLSBmb3JjZWQ9ZmFsc2XvvJrnlKjmiLfkuLvliqjkv67mlLnvvIzlj6/pmo/ml7blhbPpl61cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIENoYW5nZVBhc3N3b3JkRGlhbG9nKHsgZm9yY2VkID0gZmFsc2UsIG9uU3VjY2VzcyB9OiBDaGFuZ2VQYXNzd29yZERpYWxvZ1Byb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgdXNlciA9IHVzZUF1dGhTdG9yZSgocykgPT4gcy51c2VyKTtcbiAgY29uc3Qgc2V0QXV0aCA9IHVzZUF1dGhTdG9yZSgocykgPT4gcy5zZXRBdXRoKTtcblxuICBjb25zdCBzY2hlbWEgPSB6XG4gICAgLm9iamVjdCh7XG4gICAgICBjdXJyZW50UGFzc3dvcmQ6IHouc3RyaW5nKCkubWluKDEsIHQoJ2F1dGguY3VycmVudFBhc3N3b3JkUmVxdWlyZWQnKSksXG4gICAgICBuZXdQYXNzd29yZDogei5zdHJpbmcoKS5taW4oOCwgdCgnYXV0aC5uZXdQYXNzd29yZE1pbicpKSxcbiAgICAgIGNvbmZpcm1QYXNzd29yZDogei5zdHJpbmcoKS5taW4oMSwgdCgnYXV0aC5jb25maXJtUGFzc3dvcmRSZXF1aXJlZCcpKSxcbiAgICB9KVxuICAgIC5yZWZpbmUoKGQpID0+IGQubmV3UGFzc3dvcmQgPT09IGQuY29uZmlybVBhc3N3b3JkLCB7XG4gICAgICBtZXNzYWdlOiB0KCdhdXRoLnBhc3N3b3JkTWlzbWF0Y2gnKSxcbiAgICAgIHBhdGg6IFsnY29uZmlybVBhc3N3b3JkJ10sXG4gICAgfSk7XG5cbiAgY29uc3Qge1xuICAgIHJlZ2lzdGVyLFxuICAgIGhhbmRsZVN1Ym1pdCxcbiAgICBmb3JtU3RhdGU6IHsgZXJyb3JzIH0sXG4gIH0gPSB1c2VGb3JtPENoYW5nZVBhc3N3b3JkRm9ybURhdGE+KHsgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKHNjaGVtYSkgfSk7XG5cbiAgY29uc3Qgb25TdWJtaXQgPSBhc3luYyAoZGF0YTogQ2hhbmdlUGFzc3dvcmRGb3JtRGF0YSkgPT4ge1xuICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgc2V0RXJyb3IoJycpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBhcGkucG9zdCgnL2F1dGgvY2hhbmdlLXBhc3N3b3JkJywge1xuICAgICAgICBjdXJyZW50UGFzc3dvcmQ6IGRhdGEuY3VycmVudFBhc3N3b3JkLFxuICAgICAgICBuZXdQYXNzd29yZDogZGF0YS5uZXdQYXNzd29yZCxcbiAgICAgIH0pO1xuICAgICAgLy8g5pu05paw5pys5Zyw55So5oi35L+h5oGv77yM5riF6ZmkIG11c3RDaGFuZ2VQYXNzd29yZCDmoIflv5dcbiAgICAgIC8vIHYxLjMuMCBIdHRwT25seSBDb29raWUg6L+B56e75ZCO77yMc2V0QXV0aCDlj6rmjqXmlLYgdXNlcu+8iHRva2VuIOS4jeWGjeWJjeerr+euoeeQhu+8iVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgc2V0QXV0aCh7IC4uLnVzZXIsIG11c3RDaGFuZ2VQYXNzd29yZDogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgICBvblN1Y2Nlc3M/LigpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0RXJyb3IodCgnYXV0aC5jaGFuZ2VQYXNzd29yZEVycm9yJykpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIG9wZW4+XG4gICAgICA8RGlhbG9nQ29udGVudCBzaG93Q2xvc2VCdXR0b249eyFmb3JjZWR9PlxuICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgIDxEaWFsb2dUaXRsZT57dCgnYXV0aC5jaGFuZ2VQYXNzd29yZCcpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgPERpYWxvZ0Rlc2NyaXB0aW9uPlxuICAgICAgICAgICAge2ZvcmNlZCA/IHQoJ2F1dGguZm9yY2VDaGFuZ2VQYXNzd29yZEhpbnQnKSA6IHQoJ2F1dGguY2hhbmdlUGFzc3dvcmRIaW50Jyl9XG4gICAgICAgICAgPC9EaWFsb2dEZXNjcmlwdGlvbj5cbiAgICAgICAgPC9EaWFsb2dIZWFkZXI+XG4gICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXQob25TdWJtaXQpfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsPnt0KCdhdXRoLmN1cnJlbnRQYXNzd29yZCcpfTwvTGFiZWw+XG4gICAgICAgICAgICA8SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgey4uLnJlZ2lzdGVyKCdjdXJyZW50UGFzc3dvcmQnKX0gLz5cbiAgICAgICAgICAgIHtlcnJvcnMuY3VycmVudFBhc3N3b3JkICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcnMuY3VycmVudFBhc3N3b3JkLm1lc3NhZ2V9PC9wPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsPnt0KCdhdXRoLm5ld1Bhc3N3b3JkJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxJbnB1dCB0eXBlPVwicGFzc3dvcmRcIiB7Li4ucmVnaXN0ZXIoJ25ld1Bhc3N3b3JkJyl9IC8+XG4gICAgICAgICAgICB7ZXJyb3JzLm5ld1Bhc3N3b3JkICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPntlcnJvcnMubmV3UGFzc3dvcmQubWVzc2FnZX08L3A+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2F1dGguY29uZmlybVBhc3N3b3JkJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxJbnB1dCB0eXBlPVwicGFzc3dvcmRcIiB7Li4ucmVnaXN0ZXIoJ2NvbmZpcm1QYXNzd29yZCcpfSAvPlxuICAgICAgICAgICAge2Vycm9ycy5jb25maXJtUGFzc3dvcmQgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e2Vycm9ycy5jb25maXJtUGFzc3dvcmQubWVzc2FnZX08L3A+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHtlcnJvciAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZGVzdHJ1Y3RpdmVcIj57ZXJyb3J9PC9wPn1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiIGRpc2FibGVkPXtsb2FkaW5nfT5cbiAgICAgICAgICAgICAge2xvYWRpbmcgPyB0KCdjb21tb24ubG9hZGluZycpIDogdCgnY29tbW9uLnNhdmUnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgPC9EaWFsb2c+XG4gICk7XG59XG4iXX0=