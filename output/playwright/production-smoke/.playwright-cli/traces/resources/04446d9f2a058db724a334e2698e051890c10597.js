import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/NotificationToast.tsx");const useEffect = __vite__cjsImport0_react["useEffect"];const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { useNotificationStore } from "/src/stores/notificationStore.ts";
import { X } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/NotificationToast.tsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 通知 Toast 组件
*
* 固定在页面右下角，展示最新的未读通知。
* 点击跳转关联链接，5 秒后自动标记为已读。
*/
export function NotificationToast() {
	_s();
	const { t } = useTranslation();
	const notifications = useNotificationStore((s) => s.notifications);
	const markRead = useNotificationStore((s) => s.markRead);
	const navigate = useNavigate();
	/** 获取最新的未读通知 */
	const unread = notifications.filter((n) => !n.read);
	const latest = unread[0];
	/** 5 秒后自动标记已读 */
	useEffect(() => {
		if (!latest) return;
		const timer = setTimeout(() => {
			markRead(latest.id);
		}, 5e3);
		return () => clearTimeout(timer);
	}, [latest, markRead]);
	if (!latest) return null;
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-testid": "notification-toast",
		role: "status",
		"aria-live": "polite",
		"aria-atomic": "true",
		className: "notification-toast fixed bottom-4 right-4 z-50 w-80 cursor-pointer rounded-lg border border-border bg-card p-4 shadow-lg transition-all",
		onClick: () => {
			markRead(latest.id);
			if (latest.link) navigate(latest.link);
		},
		children: /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm font-medium",
				children: latest.title
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 48,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: latest.message
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 49,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 47,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("button", {
				onClick: (e) => {
					e.stopPropagation();
					markRead(latest.id);
				},
				className: "text-muted-foreground hover:text-foreground",
				"aria-label": t("notification.close"),
				children: /* @__PURE__ */ _jsxDEV(X, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 59,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 51,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 46,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 35,
		columnNumber: 5
	}, this);
}
_s(NotificationToast, "3bz/3+TsZNacljKr72jQmkfx/8o=", false, function() {
	return [
		useTranslation,
		useNotificationStore,
		useNotificationStore,
		useNavigate
	];
});
_c = NotificationToast;
var _c;
$RefreshReg$(_c, "NotificationToast");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/NotificationToast.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/NotificationToast.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/NotificationToast.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/NotificationToast.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyw0QkFBNEI7QUFDckMsU0FBUyxTQUFTOzs7Ozs7Ozs7O0FBUWxCLE9BQU8sU0FBUyxvQkFBb0I7O0NBQ2xDLE1BQU0sRUFBRSxNQUFNLGVBQWU7Q0FDN0IsTUFBTSxnQkFBZ0Isc0JBQXNCLE1BQU0sRUFBRSxhQUFhO0NBQ2pFLE1BQU0sV0FBVyxzQkFBc0IsTUFBTSxFQUFFLFFBQVE7Q0FDdkQsTUFBTSxXQUFXLFlBQVk7O0NBRzdCLE1BQU0sU0FBUyxjQUFjLFFBQVEsTUFBTSxDQUFDLEVBQUUsSUFBSTtDQUNsRCxNQUFNLFNBQVMsT0FBTzs7Q0FHdEIsZ0JBQWdCO0VBQ2QsSUFBSSxDQUFDLFFBQVE7RUFDYixNQUFNLFFBQVEsaUJBQWlCO0dBQzdCLFNBQVMsT0FBTyxFQUFFO0VBQ3BCLEdBQUcsR0FBSTtFQUNQLGFBQWEsYUFBYSxLQUFLO0NBQ2pDLEdBQUcsQ0FBQyxRQUFRLFFBQVEsQ0FBQztDQUVyQixJQUFJLENBQUMsUUFBUSxPQUFPO0NBRXBCLE9BQ0Usd0JBQUMsT0FBRDtFQUNFLGVBQVk7RUFDWixNQUFLO0VBQ0wsYUFBVTtFQUNWLGVBQVk7RUFDWixXQUFVO0VBQ1YsZUFBZTtHQUNiLFNBQVMsT0FBTyxFQUFFO0dBQ2xCLElBQUksT0FBTyxNQUFNLFNBQVMsT0FBTyxJQUFJO0VBQ3ZDO1lBRUEsd0JBQUMsT0FBRDtHQUFLLFdBQVU7YUFBZixDQUNFLHdCQUFDLE9BQUQsYUFDRSx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUF1QixPQUFPO0dBQVM7Ozs7YUFDcEQsd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBc0MsT0FBTztHQUFXOzs7O1dBQ2xFOzs7O2FBQ0wsd0JBQUMsVUFBRDtJQUNFLFVBQVUsTUFBTTtLQUNkLEVBQUUsZ0JBQWdCO0tBQ2xCLFNBQVMsT0FBTyxFQUFFO0lBQ3BCO0lBQ0EsV0FBVTtJQUNWLGNBQVksRUFBRSxvQkFBb0I7Y0FFbEMsd0JBQUMsR0FBRCxFQUFHLFdBQVUsVUFBVzs7Ozs7R0FDbEI7Ozs7V0FDTDs7Ozs7O0NBQ0Y7Ozs7O0FBRVQiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiTm90aWZpY2F0aW9uVG9hc3QudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlTm90aWZpY2F0aW9uU3RvcmUgfSBmcm9tICcuLi8uLi9zdG9yZXMvbm90aWZpY2F0aW9uU3RvcmUnO1xuaW1wb3J0IHsgWCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5cbi8qKlxuICog6YCa55+lIFRvYXN0IOe7hOS7tlxuICpcbiAqIOWbuuWumuWcqOmhtemdouWPs+S4i+inku+8jOWxleekuuacgOaWsOeahOacquivu+mAmuefpeOAglxuICog54K55Ye76Lez6L2s5YWz6IGU6ZO+5o6l77yMNSDnp5LlkI7oh6rliqjmoIforrDkuLrlt7Lor7vjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE5vdGlmaWNhdGlvblRvYXN0KCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IG5vdGlmaWNhdGlvbnMgPSB1c2VOb3RpZmljYXRpb25TdG9yZSgocykgPT4gcy5ub3RpZmljYXRpb25zKTtcbiAgY29uc3QgbWFya1JlYWQgPSB1c2VOb3RpZmljYXRpb25TdG9yZSgocykgPT4gcy5tYXJrUmVhZCk7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcblxuICAvKiog6I635Y+W5pyA5paw55qE5pyq6K+76YCa55+lICovXG4gIGNvbnN0IHVucmVhZCA9IG5vdGlmaWNhdGlvbnMuZmlsdGVyKChuKSA9PiAhbi5yZWFkKTtcbiAgY29uc3QgbGF0ZXN0ID0gdW5yZWFkWzBdO1xuXG4gIC8qKiA1IOenkuWQjuiHquWKqOagh+iusOW3suivuyAqL1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghbGF0ZXN0KSByZXR1cm47XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIG1hcmtSZWFkKGxhdGVzdC5pZCk7XG4gICAgfSwgNTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH0sIFtsYXRlc3QsIG1hcmtSZWFkXSk7XG5cbiAgaWYgKCFsYXRlc3QpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgZGF0YS10ZXN0aWQ9XCJub3RpZmljYXRpb24tdG9hc3RcIlxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICBhcmlhLWxpdmU9XCJwb2xpdGVcIlxuICAgICAgYXJpYS1hdG9taWM9XCJ0cnVlXCJcbiAgICAgIGNsYXNzTmFtZT1cIm5vdGlmaWNhdGlvbi10b2FzdCBmaXhlZCBib3R0b20tNCByaWdodC00IHotNTAgdy04MCBjdXJzb3ItcG9pbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItYm9yZGVyIGJnLWNhcmQgcC00IHNoYWRvdy1sZyB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgIG1hcmtSZWFkKGxhdGVzdC5pZCk7XG4gICAgICAgIGlmIChsYXRlc3QubGluaykgbmF2aWdhdGUobGF0ZXN0LmxpbmspO1xuICAgICAgfX1cbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPntsYXRlc3QudGl0bGV9PC9wPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57bGF0ZXN0Lm1lc3NhZ2V9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgbWFya1JlYWQobGF0ZXN0LmlkKTtcbiAgICAgICAgICB9fVxuICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZCBob3Zlcjp0ZXh0LWZvcmVncm91bmRcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9e3QoJ25vdGlmaWNhdGlvbi5jbG9zZScpfVxuICAgICAgICA+XG4gICAgICAgICAgPFggY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXX0=