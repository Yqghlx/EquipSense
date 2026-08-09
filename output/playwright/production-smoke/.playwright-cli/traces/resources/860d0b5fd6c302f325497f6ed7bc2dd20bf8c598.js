import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/Header.tsx");const useState = __vite__cjsImport10_react["useState"];const _jsxDEV = __vite__cjsImport11_react_jsxDevRuntime["jsxDEV"];import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Bell, Sun, Moon, Globe, LogOut, User, Menu } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "/src/components/ui/dropdown-menu.tsx";
import { useTheme } from "/src/hooks/useTheme.ts";
import { useAuthStore } from "/src/stores/authStore.ts";
import { useNotificationStore } from "/src/stores/notificationStore.ts";
import { RealtimeIndicator } from "/src/components/layout/RealtimeIndicator.tsx";
import { revokeSessionAndClearLocalState } from "/src/lib/authSession.ts";
import __vite__cjsImport10_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Header.tsx";
import __vite__cjsImport11_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 顶部导航栏组件
*
* 包含通知铃铛（下拉展示最近通知）、主题切换、语言切换、用户菜单（退出登录）。
*/
export function Header({ onMenuClick }) {
	_s();
	const { t, i18n } = useTranslation();
	const { theme, toggleTheme } = useTheme();
	const user = useAuthStore((s) => s.user);
	const notifications = useNotificationStore((s) => s.notifications);
	const navigate = useNavigate();
	const [showNotifications, setShowNotifications] = useState(false);
	/** 未读通知数量（最多显示 9+） */
	const unreadCount = notifications.filter((n) => !n.read).length;
	/** 退出登录并跳转到登录页 */
	const handleLogout = async () => {
		await revokeSessionAndClearLocalState();
		navigate("/login", { replace: true });
	};
	/** 切换中英文 */
	const toggleLanguage = () => {
		const next = i18n.language === "zh" ? "en" : "zh";
		i18n.changeLanguage(next);
		localStorage.setItem("language", next);
	};
	return /* @__PURE__ */ _jsxDEV("header", {
		className: "flex h-14 items-center justify-between border-b border-border bg-background px-4",
		children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				size: "icon",
				className: "md:hidden",
				onClick: onMenuClick,
				"aria-label": "打开菜单",
				children: /* @__PURE__ */ _jsxDEV(Menu, { className: "h-5 w-5" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 53,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 52,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("span", {
				className: "text-sm text-muted-foreground",
				children: "EquipSense"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 55,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 50,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ _jsxDEV(RealtimeIndicator, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 60,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(DropdownMenu, {
					open: showNotifications,
					onOpenChange: setShowNotifications,
					children: [/* @__PURE__ */ _jsxDEV(DropdownMenuTrigger, {
						className: "relative inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground",
						children: [/* @__PURE__ */ _jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 65,
							columnNumber: 13
						}, this), unreadCount > 0 && /* @__PURE__ */ _jsxDEV("span", {
							className: "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground",
							children: unreadCount > 9 ? "9+" : unreadCount
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 67,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 64,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(DropdownMenuContent, {
						align: "end",
						className: "w-80",
						children: notifications.length === 0 ? /* @__PURE__ */ _jsxDEV("div", {
							className: "p-4 text-center text-sm text-muted-foreground",
							children: t("common.noData")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 74,
							columnNumber: 15
						}, this) : notifications.slice(0, 10).map((n) => /* @__PURE__ */ _jsxDEV(DropdownMenuItem, {
							className: "flex flex-col items-start gap-1 py-2",
							children: [/* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm font-medium",
								children: n.title
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 78,
								columnNumber: 19
							}, this), /* @__PURE__ */ _jsxDEV("span", {
								className: "text-xs text-muted-foreground",
								children: n.message
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 79,
								columnNumber: 19
							}, this)]
						}, n.id, true, {
							fileName: _jsxFileName,
							lineNumber: 77,
							columnNumber: 17
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 72,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 63,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					variant: "ghost",
					size: "icon",
					onClick: toggleTheme,
					"aria-label": "切换主题",
					children: theme === "dark" ? /* @__PURE__ */ _jsxDEV(Sun, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 88,
						columnNumber: 31
					}, this) : /* @__PURE__ */ _jsxDEV(Moon, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 88,
						columnNumber: 61
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 87,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					variant: "ghost",
					size: "icon",
					onClick: toggleLanguage,
					"aria-label": "切换语言",
					children: /* @__PURE__ */ _jsxDEV(Globe, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 93,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 92,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(DropdownMenu, { children: [/* @__PURE__ */ _jsxDEV(DropdownMenuTrigger, {
					"aria-label": user?.username ?? "用户菜单",
					className: "inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground",
					children: /* @__PURE__ */ _jsxDEV(User, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 102,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 98,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DropdownMenuContent, {
					align: "end",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "px-2 py-1.5 text-sm font-medium",
							children: user?.username
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 105,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "px-2 text-xs text-muted-foreground",
							children: user?.role
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 106,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DropdownMenuSeparator, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 107,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DropdownMenuItem, {
							onClick: handleLogout,
							children: [/* @__PURE__ */ _jsxDEV(LogOut, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 109,
								columnNumber: 15
							}, this), t("auth.logout")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 108,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 104,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 97,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 58,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 49,
		columnNumber: 5
	}, this);
}
_s(Header, "jQUveXiSKKWGWPor14Q4gFYuOSc=", false, function() {
	return [
		useTranslation,
		useTheme,
		useAuthStore,
		useNotificationStore,
		useNavigate
	];
});
_c = Header;
var _c;
$RefreshReg$(_c, "Header");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/Header.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Header.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Header.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Header.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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OztJQUdSLHdCQUFDLGNBQUQsYUFDRSx3QkFBQyxxQkFBRDtLQUNFLGNBQVksTUFBTSxZQUFZO0tBQzlCLFdBQVU7ZUFFVix3QkFBQyxNQUFELEVBQU0sV0FBVSxVQUFXOzs7OztJQUNSOzs7O2NBQ3JCLHdCQUFDLHFCQUFEO0tBQXFCLE9BQU07ZUFBM0I7TUFDRSx3QkFBQyxPQUFEO09BQUssV0FBVTtpQkFBbUMsTUFBTTtNQUFjOzs7OztNQUN0RSx3QkFBQyxPQUFEO09BQUssV0FBVTtpQkFBc0MsTUFBTTtNQUFVOzs7OztNQUNyRSx3QkFBQyx1QkFBRCxDQUF3Qjs7Ozs7TUFDeEIsd0JBQUMsa0JBQUQ7T0FBa0IsU0FBUztpQkFBM0IsQ0FDRSx3QkFBQyxRQUFELEVBQVEsV0FBVSxlQUFnQjs7OztpQkFDakMsRUFBRSxhQUFhLENBQ0E7Ozs7OztLQUNDOzs7OztZQUNUOzs7OztHQUNYOzs7OztVQUNDOzs7Ozs7QUFFWiIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJIZWFkZXIudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgQmVsbCwgU3VuLCBNb29uLCBHbG9iZSwgTG9nT3V0LCBVc2VyLCBNZW51IH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQge1xuICBEcm9wZG93bk1lbnUsXG4gIERyb3Bkb3duTWVudUNvbnRlbnQsXG4gIERyb3Bkb3duTWVudUl0ZW0sXG4gIERyb3Bkb3duTWVudVNlcGFyYXRvcixcbiAgRHJvcGRvd25NZW51VHJpZ2dlcixcbn0gZnJvbSAnLi4vdWkvZHJvcGRvd24tbWVudSc7XG5pbXBvcnQgeyB1c2VUaGVtZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRoZW1lJztcbmltcG9ydCB7IHVzZUF1dGhTdG9yZSB9IGZyb20gJy4uLy4uL3N0b3Jlcy9hdXRoU3RvcmUnO1xuaW1wb3J0IHsgdXNlTm90aWZpY2F0aW9uU3RvcmUgfSBmcm9tICcuLi8uLi9zdG9yZXMvbm90aWZpY2F0aW9uU3RvcmUnO1xuaW1wb3J0IHsgUmVhbHRpbWVJbmRpY2F0b3IgfSBmcm9tICcuL1JlYWx0aW1lSW5kaWNhdG9yJztcbmltcG9ydCB7IHJldm9rZVNlc3Npb25BbmRDbGVhckxvY2FsU3RhdGUgfSBmcm9tICcuLi8uLi9saWIvYXV0aFNlc3Npb24nO1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5cbi8qKlxuICog6aG26YOo5a+86Iiq5qCP57uE5Lu2XG4gKlxuICog5YyF5ZCr6YCa55+l6ZOD6ZOb77yI5LiL5ouJ5bGV56S65pyA6L+R6YCa55+l77yJ44CB5Li76aKY5YiH5o2i44CB6K+t6KiA5YiH5o2i44CB55So5oi36I+c5Y2V77yI6YCA5Ye655m75b2V77yJ44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBIZWFkZXIoeyBvbk1lbnVDbGljayB9OiB7IG9uTWVudUNsaWNrPzogKCkgPT4gdm9pZCB9KSB7XG4gIGNvbnN0IHsgdCwgaTE4biB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyB0aGVtZSwgdG9nZ2xlVGhlbWUgfSA9IHVzZVRoZW1lKCk7XG4gIGNvbnN0IHVzZXIgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMudXNlcik7XG4gIGNvbnN0IG5vdGlmaWNhdGlvbnMgPSB1c2VOb3RpZmljYXRpb25TdG9yZSgocykgPT4gcy5ub3RpZmljYXRpb25zKTtcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xuICBjb25zdCBbc2hvd05vdGlmaWNhdGlvbnMsIHNldFNob3dOb3RpZmljYXRpb25zXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvKiog5pyq6K+76YCa55+l5pWw6YeP77yI5pyA5aSa5pi+56S6IDkr77yJICovXG4gIGNvbnN0IHVucmVhZENvdW50ID0gbm90aWZpY2F0aW9ucy5maWx0ZXIoKG4pID0+ICFuLnJlYWQpLmxlbmd0aDtcblxuICAvKiog6YCA5Ye655m75b2V5bm26Lez6L2s5Yiw55m75b2V6aG1ICovXG4gIGNvbnN0IGhhbmRsZUxvZ291dCA9IGFzeW5jICgpID0+IHtcbiAgICBhd2FpdCByZXZva2VTZXNzaW9uQW5kQ2xlYXJMb2NhbFN0YXRlKCk7XG4gICAgbmF2aWdhdGUoJy9sb2dpbicsIHsgcmVwbGFjZTogdHJ1ZSB9KTtcbiAgfTtcblxuICAvKiog5YiH5o2i5Lit6Iux5paHICovXG4gIGNvbnN0IHRvZ2dsZUxhbmd1YWdlID0gKCkgPT4ge1xuICAgIGNvbnN0IG5leHQgPSBpMThuLmxhbmd1YWdlID09PSAnemgnID8gJ2VuJyA6ICd6aCc7XG4gICAgaTE4bi5jaGFuZ2VMYW5ndWFnZShuZXh0KTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnbGFuZ3VhZ2UnLCBuZXh0KTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiZmxleCBoLTE0IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLWJvcmRlciBiZy1iYWNrZ3JvdW5kIHB4LTRcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgey8qIOenu+WKqOerryBoYW1idXJnZXIg5oyJ6ZKu77ya6Kem5Y+RIEFwcExheW91dCDnmoQgZHJhd2VyICovfVxuICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgY2xhc3NOYW1lPVwibWQ6aGlkZGVuXCIgb25DbGljaz17b25NZW51Q2xpY2t9IGFyaWEtbGFiZWw9XCLmiZPlvIDoj5zljZVcIj5cbiAgICAgICAgICA8TWVudSBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cbiAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+RXF1aXBTZW5zZTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgIHsvKiDlrp7ml7bov57mjqXnirbmgIHmjIfnpLrlmajvvIjnu7895q2j5bi4L+m7hD3ph43ov57kuK0v54GwPeaWreW8gO+8iSAqL31cbiAgICAgICAgPFJlYWx0aW1lSW5kaWNhdG9yIC8+XG5cbiAgICAgICAgey8qIOmAmuefpemTg+mTmyAqL31cbiAgICAgICAgPERyb3Bkb3duTWVudSBvcGVuPXtzaG93Tm90aWZpY2F0aW9uc30gb25PcGVuQ2hhbmdlPXtzZXRTaG93Tm90aWZpY2F0aW9uc30+XG4gICAgICAgICAgPERyb3Bkb3duTWVudVRyaWdnZXIgY2xhc3NOYW1lPVwicmVsYXRpdmUgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtbWQgaC05IHctOSBob3ZlcjpiZy1hY2NlbnQgaG92ZXI6dGV4dC1hY2NlbnQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgPEJlbGwgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICB7dW5yZWFkQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgLXJpZ2h0LTAuNSAtdG9wLTAuNSBmbGV4IGgtNCB3LTQgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtZnVsbCBiZy1kZXN0cnVjdGl2ZSB0ZXh0LVsxMHB4XSB0ZXh0LWRlc3RydWN0aXZlLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICB7dW5yZWFkQ291bnQgPiA5ID8gJzkrJyA6IHVucmVhZENvdW50fVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvRHJvcGRvd25NZW51VHJpZ2dlcj5cbiAgICAgICAgICA8RHJvcGRvd25NZW51Q29udGVudCBhbGlnbj1cImVuZFwiIGNsYXNzTmFtZT1cInctODBcIj5cbiAgICAgICAgICAgIHtub3RpZmljYXRpb25zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgdGV4dC1jZW50ZXIgdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9ucy5zbGljZSgwLCAxMCkubWFwKChuKSA9PiAoXG4gICAgICAgICAgICAgICAgPERyb3Bkb3duTWVudUl0ZW0ga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLXN0YXJ0IGdhcC0xIHB5LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW1cIj57bi50aXRsZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntuLm1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvRHJvcGRvd25NZW51SXRlbT5cbiAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Ecm9wZG93bk1lbnVDb250ZW50PlxuICAgICAgICA8L0Ryb3Bkb3duTWVudT5cblxuICAgICAgICB7Lyog5Li76aKY5YiH5o2iICovfVxuICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgb25DbGljaz17dG9nZ2xlVGhlbWV9IGFyaWEtbGFiZWw9XCLliIfmjaLkuLvpophcIj5cbiAgICAgICAgICB7dGhlbWUgPT09ICdkYXJrJyA/IDxTdW4gY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+IDogPE1vb24gY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+fVxuICAgICAgICA8L0J1dHRvbj5cblxuICAgICAgICB7Lyog6K+t6KiA5YiH5o2iICovfVxuICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgb25DbGljaz17dG9nZ2xlTGFuZ3VhZ2V9IGFyaWEtbGFiZWw9XCLliIfmjaLor63oqIBcIj5cbiAgICAgICAgICA8R2xvYmUgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgIDwvQnV0dG9uPlxuXG4gICAgICAgIHsvKiDnlKjmiLfoj5zljZUgKi99XG4gICAgICAgIDxEcm9wZG93bk1lbnU+XG4gICAgICAgICAgPERyb3Bkb3duTWVudVRyaWdnZXJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e3VzZXI/LnVzZXJuYW1lID8/ICfnlKjmiLfoj5zljZUnfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtbWQgaC05IHctOSBob3ZlcjpiZy1hY2NlbnQgaG92ZXI6dGV4dC1hY2NlbnQtZm9yZWdyb3VuZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFVzZXIgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgPC9Ecm9wZG93bk1lbnVUcmlnZ2VyPlxuICAgICAgICAgIDxEcm9wZG93bk1lbnVDb250ZW50IGFsaWduPVwiZW5kXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTIgcHktMS41IHRleHQtc20gZm9udC1tZWRpdW1cIj57dXNlcj8udXNlcm5hbWV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTIgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dXNlcj8ucm9sZX08L2Rpdj5cbiAgICAgICAgICAgIDxEcm9wZG93bk1lbnVTZXBhcmF0b3IgLz5cbiAgICAgICAgICAgIDxEcm9wZG93bk1lbnVJdGVtIG9uQ2xpY2s9e2hhbmRsZUxvZ291dH0+XG4gICAgICAgICAgICAgIDxMb2dPdXQgY2xhc3NOYW1lPVwibXItMiBoLTQgdy00XCIgLz5cbiAgICAgICAgICAgICAge3QoJ2F1dGgubG9nb3V0Jyl9XG4gICAgICAgICAgICA8L0Ryb3Bkb3duTWVudUl0ZW0+XG4gICAgICAgICAgPC9Ecm9wZG93bk1lbnVDb250ZW50PlxuICAgICAgICA8L0Ryb3Bkb3duTWVudT5cbiAgICAgIDwvZGl2PlxuICAgIDwvaGVhZGVyPlxuICApO1xufVxuIl19