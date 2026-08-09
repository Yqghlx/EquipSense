import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/Sidebar.tsx");const useState = __vite__cjsImport3_react["useState"];const _jsxDEV = __vite__cjsImport7_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport7_react_jsxDevRuntime["Fragment"];import { NavLink, useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { LayoutDashboard, Wrench, AlertTriangle, Bell, ClipboardList, ClipboardCheck, Brain, BookOpen, Settings, ChevronLeft, ChevronRight, Users, Building2, Network, Target, Shield, UserCog } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
import { useAuthStore } from "/src/stores/authStore.ts";
import { useUnreadCount } from "/src/hooks/useNotifications.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Sidebar.tsx";
import __vite__cjsImport7_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 侧边栏导航项配置 */
const baseNavItems = [
	{
		path: "/dashboard",
		icon: LayoutDashboard,
		labelKey: "nav.dashboard"
	},
	{
		path: "/devices",
		icon: Wrench,
		labelKey: "nav.devices"
	},
	{
		path: "/gateways",
		icon: Network,
		labelKey: "nav.gateway"
	},
	{
		path: "/alerts",
		icon: AlertTriangle,
		labelKey: "nav.alerts"
	},
	{
		path: "/alert-rules",
		icon: Bell,
		labelKey: "nav.alertRules"
	},
	{
		path: "/work-orders",
		icon: ClipboardList,
		labelKey: "nav.workOrders"
	},
	{
		path: "/pending-approvals",
		icon: ClipboardCheck,
		labelKey: "nav.pendingApprovals"
	},
	{
		path: "/dispatch",
		icon: Users,
		labelKey: "nav.dispatch"
	},
	{
		path: "/analyses",
		icon: Brain,
		labelKey: "nav.analyses"
	},
	{
		path: "/knowledge",
		icon: BookOpen,
		labelKey: "nav.knowledge"
	},
	{
		path: "/fmea",
		icon: AlertTriangle,
		labelKey: "nav.fmea"
	},
	{
		path: "/evaluation",
		icon: Target,
		labelKey: "nav.evaluation"
	},
	{
		path: "/audit-logs",
		icon: Shield,
		labelKey: "nav.auditLogs"
	},
	{
		path: "/settings",
		icon: Settings,
		labelKey: "nav.settings"
	}
];
/** system_admin 专用导航项 */
const adminNavItems = [{
	path: "/users",
	icon: UserCog,
	labelKey: "nav.users"
}, {
	path: "/admin/tenants",
	icon: Building2,
	labelKey: "nav.tenantManagement"
}];
/**
* 侧边栏组件
*
* 支持展开/收起切换，导航项高亮当前路由，
* 收起时仅显示图标，展开时显示图标+文字。
*/
export function Sidebar({ mobileOpen = false, onClose }) {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(false);
	const user = useAuthStore((s) => s.user);
	const { data: unreadCount } = useUnreadCount();
	/** 根据角色动态构建导航项列表 */
	const navItems = user?.role === "SystemAdmin" ? [...baseNavItems, ...adminNavItems] : baseNavItems;
	return /* @__PURE__ */ _jsxDEV(_Fragment, { children: [mobileOpen && /* @__PURE__ */ _jsxDEV("div", {
		className: "fixed inset-0 z-40 bg-black/50 md:hidden",
		onClick: onClose,
		"aria-hidden": "true"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 73,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV("aside", {
		className: cn(
			"flex h-screen flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-200",
			collapsed ? "w-16" : "w-60",
			// 移动端：fixed drawer，通过 mobileOpen 控制滑入/滑出
			"fixed inset-y-0 left-0 z-50 transform md:static md:translate-x-0",
			mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
		),
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex h-14 items-center border-b border-border px-4",
				children: [!collapsed && /* @__PURE__ */ _jsxDEV("span", {
					className: "text-lg font-bold text-primary",
					children: "EquipSense"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 90,
					columnNumber: 24
				}, this), /* @__PURE__ */ _jsxDEV("button", {
					onClick: () => setCollapsed(!collapsed),
					className: cn("rounded p-1.5 text-muted-foreground hover:text-foreground", collapsed && "mx-auto"),
					"aria-label": collapsed ? t("sidebar.expand") : t("sidebar.collapse"),
					children: collapsed ? /* @__PURE__ */ _jsxDEV(ChevronRight, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 96,
						columnNumber: 24
					}, this) : /* @__PURE__ */ _jsxDEV(ChevronLeft, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 96,
						columnNumber: 63
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 91,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 89,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("nav", {
				className: "flex-1 space-y-1 p-2",
				children: navItems.map(({ path, icon: Icon, labelKey }) => /* @__PURE__ */ _jsxDEV(NavLink, {
					to: path,
					className: ({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground", collapsed && "justify-center px-2"),
					children: [/* @__PURE__ */ _jsxDEV(Icon, { className: "h-4 w-4 shrink-0" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 116,
						columnNumber: 13
					}, this), !collapsed && /* @__PURE__ */ _jsxDEV("span", { children: t(labelKey) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 117,
						columnNumber: 28
					}, this)]
				}, path, true, {
					fileName: _jsxFileName,
					lineNumber: 103,
					columnNumber: 11
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 101,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "border-t border-border p-2",
				children: /* @__PURE__ */ _jsxDEV("button", {
					onClick: () => navigate("/notifications"),
					className: cn("relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", collapsed && "justify-center px-2"),
					children: [
						/* @__PURE__ */ _jsxDEV(Bell, { className: "h-4 w-4 shrink-0" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 131,
							columnNumber: 11
						}, this),
						!collapsed && /* @__PURE__ */ _jsxDEV("span", { children: "通知" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 132,
							columnNumber: 26
						}, this),
						unreadCount != null && unreadCount > 0 && /* @__PURE__ */ _jsxDEV("span", {
							className: cn("flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white", collapsed && "absolute -right-0.5 -top-0.5"),
							children: unreadCount > 99 ? "99+" : unreadCount
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 134,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 124,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 123,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 5
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 70,
		columnNumber: 5
	}, this);
}
_s(Sidebar, "m1PRGS3biipwTm200Mh/dnaQVX8=", false, function() {
	return [
		useTranslation,
		useNavigate,
		useAuthStore,
		useUnreadCount
	];
});
_c = Sidebar;
var _c;
$RefreshReg$(_c, "Sidebar");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/Sidebar.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Sidebar.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Sidebar.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/Sidebar.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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ZjtlQVZKLENBYUUsd0JBQUMsTUFBRCxFQUFNLFdBQVUsbUJBQW9COzs7O2VBQ25DLENBQUMsYUFBYSx3QkFBQyxRQUFELFlBQU8sRUFBRSxRQUFRLEVBQVE7Ozs7YUFDakM7T0FkRjs7OztXQWNFLENBQ1Y7R0FDRTs7Ozs7R0FHTCx3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUNiLHdCQUFDLFVBQUQ7S0FDRSxlQUFlLFNBQVMsZ0JBQWdCO0tBQ3hDLFdBQVcsR0FDVCxzSkFDQSxhQUFhLHFCQUNmO2VBTEY7TUFPRSx3QkFBQyxNQUFELEVBQU0sV0FBVSxtQkFBb0I7Ozs7O01BQ25DLENBQUMsYUFBYSx3QkFBQyxRQUFELFlBQU0sS0FBUTs7Ozs7TUFDNUIsZUFBZSxRQUFRLGNBQWMsS0FDcEMsd0JBQUMsUUFBRDtPQUFNLFdBQVcsR0FDZiw4R0FDQSxhQUFhLDhCQUNmO2lCQUNHLGNBQWMsS0FBSyxRQUFRO01BQ3hCOzs7OztLQUVGOzs7Ozs7R0FDTDs7Ozs7RUFDQTs7Ozs7U0FDTDs7Ozs7QUFFTiIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJTaWRlYmFyLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOYXZMaW5rLCB1c2VOYXZpZ2F0ZSB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7XG4gIExheW91dERhc2hib2FyZCxcbiAgV3JlbmNoLFxuICBBbGVydFRyaWFuZ2xlLFxuICBCZWxsLFxuICBDbGlwYm9hcmRMaXN0LFxuICBDbGlwYm9hcmRDaGVjayxcbiAgQnJhaW4sXG4gIEJvb2tPcGVuLFxuICBTZXR0aW5ncyxcbiAgQ2hldnJvbkxlZnQsXG4gIENoZXZyb25SaWdodCxcbiAgVXNlcnMsXG4gIEJ1aWxkaW5nMixcbiAgTmV0d29yayxcbiAgVGFyZ2V0LFxuICBTaGllbGQsXG4gIFVzZXJDb2csXG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNuIH0gZnJvbSAnLi4vLi4vbGliL3V0aWxzJztcbmltcG9ydCB7IHVzZUF1dGhTdG9yZSB9IGZyb20gJy4uLy4uL3N0b3Jlcy9hdXRoU3RvcmUnO1xuaW1wb3J0IHsgdXNlVW5yZWFkQ291bnQgfSBmcm9tICcuLi8uLi9ob29rcy91c2VOb3RpZmljYXRpb25zJztcblxuLyoqIOS+p+i+ueagj+WvvOiIqumhuemFjee9riAqL1xuY29uc3QgYmFzZU5hdkl0ZW1zID0gW1xuICB7IHBhdGg6ICcvZGFzaGJvYXJkJywgaWNvbjogTGF5b3V0RGFzaGJvYXJkLCBsYWJlbEtleTogJ25hdi5kYXNoYm9hcmQnIH0sXG4gIHsgcGF0aDogJy9kZXZpY2VzJywgaWNvbjogV3JlbmNoLCBsYWJlbEtleTogJ25hdi5kZXZpY2VzJyB9LFxuICB7IHBhdGg6ICcvZ2F0ZXdheXMnLCBpY29uOiBOZXR3b3JrLCBsYWJlbEtleTogJ25hdi5nYXRld2F5JyB9LFxuICB7IHBhdGg6ICcvYWxlcnRzJywgaWNvbjogQWxlcnRUcmlhbmdsZSwgbGFiZWxLZXk6ICduYXYuYWxlcnRzJyB9LFxuICB7IHBhdGg6ICcvYWxlcnQtcnVsZXMnLCBpY29uOiBCZWxsLCBsYWJlbEtleTogJ25hdi5hbGVydFJ1bGVzJyB9LFxuICB7IHBhdGg6ICcvd29yay1vcmRlcnMnLCBpY29uOiBDbGlwYm9hcmRMaXN0LCBsYWJlbEtleTogJ25hdi53b3JrT3JkZXJzJyB9LFxuICB7IHBhdGg6ICcvcGVuZGluZy1hcHByb3ZhbHMnLCBpY29uOiBDbGlwYm9hcmRDaGVjaywgbGFiZWxLZXk6ICduYXYucGVuZGluZ0FwcHJvdmFscycgfSxcbiAgeyBwYXRoOiAnL2Rpc3BhdGNoJywgaWNvbjogVXNlcnMsIGxhYmVsS2V5OiAnbmF2LmRpc3BhdGNoJyB9LFxuICB7IHBhdGg6ICcvYW5hbHlzZXMnLCBpY29uOiBCcmFpbiwgbGFiZWxLZXk6ICduYXYuYW5hbHlzZXMnIH0sXG4gIHsgcGF0aDogJy9rbm93bGVkZ2UnLCBpY29uOiBCb29rT3BlbiwgbGFiZWxLZXk6ICduYXYua25vd2xlZGdlJyB9LFxuICB7IHBhdGg6ICcvZm1lYScsIGljb246IEFsZXJ0VHJpYW5nbGUsIGxhYmVsS2V5OiAnbmF2LmZtZWEnIH0sXG4gIHsgcGF0aDogJy9ldmFsdWF0aW9uJywgaWNvbjogVGFyZ2V0LCBsYWJlbEtleTogJ25hdi5ldmFsdWF0aW9uJyB9LFxuICB7IHBhdGg6ICcvYXVkaXQtbG9ncycsIGljb246IFNoaWVsZCwgbGFiZWxLZXk6ICduYXYuYXVkaXRMb2dzJyB9LFxuICB7IHBhdGg6ICcvc2V0dGluZ3MnLCBpY29uOiBTZXR0aW5ncywgbGFiZWxLZXk6ICduYXYuc2V0dGluZ3MnIH0sXG5dO1xuXG4vKiogc3lzdGVtX2FkbWluIOS4k+eUqOWvvOiIqumhuSAqL1xuY29uc3QgYWRtaW5OYXZJdGVtcyA9IFtcbiAgeyBwYXRoOiAnL3VzZXJzJywgaWNvbjogVXNlckNvZywgbGFiZWxLZXk6ICduYXYudXNlcnMnIH0sXG4gIHsgcGF0aDogJy9hZG1pbi90ZW5hbnRzJywgaWNvbjogQnVpbGRpbmcyLCBsYWJlbEtleTogJ25hdi50ZW5hbnRNYW5hZ2VtZW50JyB9LFxuXTtcblxuLyoqXG4gKiDkvqfovrnmoI/nu4Tku7ZcbiAqXG4gKiDmlK/mjIHlsZXlvIAv5pS26LW35YiH5o2i77yM5a+86Iiq6aG56auY5Lqu5b2T5YmN6Lev55Sx77yMXG4gKiDmlLbotbfml7bku4XmmL7npLrlm77moIfvvIzlsZXlvIDml7bmmL7npLrlm77moIcr5paH5a2X44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBTaWRlYmFyKHsgbW9iaWxlT3BlbiA9IGZhbHNlLCBvbkNsb3NlIH06IHsgbW9iaWxlT3Blbj86IGJvb2xlYW47IG9uQ2xvc2U/OiAoKSA9PiB2b2lkIH0pIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBuYXZpZ2F0ZSA9IHVzZU5hdmlnYXRlKCk7XG4gIGNvbnN0IFtjb2xsYXBzZWQsIHNldENvbGxhcHNlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IHVzZXIgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMudXNlcik7XG4gIGNvbnN0IHsgZGF0YTogdW5yZWFkQ291bnQgfSA9IHVzZVVucmVhZENvdW50KCk7XG5cbiAgLyoqIOagueaNruinkuiJsuWKqOaAgeaehOW7uuWvvOiIqumhueWIl+ihqCAqL1xuICBjb25zdCBuYXZJdGVtcyA9IHVzZXI/LnJvbGUgPT09ICdTeXN0ZW1BZG1pbidcbiAgICA/IFsuLi5iYXNlTmF2SXRlbXMsIC4uLmFkbWluTmF2SXRlbXNdXG4gICAgOiBiYXNlTmF2SXRlbXM7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgey8qIOenu+WKqOerryBvdmVybGF577ya5LuF5ZyoIGRyYXdlciDmiZPlvIDml7bmmL7npLrvvIzngrnlh7vlhbPpl60gKi99XG4gICAgICB7bW9iaWxlT3BlbiAmJiAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotNDAgYmctYmxhY2svNTAgbWQ6aGlkZGVuXCJcbiAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgIC8+XG4gICAgICApfVxuICAgIDxhc2lkZVxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgJ2ZsZXggaC1zY3JlZW4gZmxleC1jb2wgYm9yZGVyLXIgYm9yZGVyLWJvcmRlciBiZy1bdmFyKC0tc2lkZWJhci1iZyldIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCcsXG4gICAgICAgIGNvbGxhcHNlZCA/ICd3LTE2JyA6ICd3LTYwJyxcbiAgICAgICAgLy8g56e75Yqo56uv77yaZml4ZWQgZHJhd2Vy77yM6YCa6L+HIG1vYmlsZU9wZW4g5o6n5Yi25ruR5YWlL+a7keWHulxuICAgICAgICAnZml4ZWQgaW5zZXQteS0wIGxlZnQtMCB6LTUwIHRyYW5zZm9ybSBtZDpzdGF0aWMgbWQ6dHJhbnNsYXRlLXgtMCcsXG4gICAgICAgIG1vYmlsZU9wZW4gPyAndHJhbnNsYXRlLXgtMCcgOiAnLXRyYW5zbGF0ZS14LWZ1bGwgbWQ6dHJhbnNsYXRlLXgtMCcsXG4gICAgICApfVxuICAgID5cbiAgICAgIHsvKiDlk4HniYzljLrln58gKyDmlLbotbcv5bGV5byA5oyJ6ZKuICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGgtMTQgaXRlbXMtY2VudGVyIGJvcmRlci1iIGJvcmRlci1ib3JkZXIgcHgtNFwiPlxuICAgICAgICB7IWNvbGxhcHNlZCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYm9sZCB0ZXh0LXByaW1hcnlcIj5FcXVpcFNlbnNlPC9zcGFuPn1cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldENvbGxhcHNlZCghY29sbGFwc2VkKX1cbiAgICAgICAgICBjbGFzc05hbWU9e2NuKCdyb3VuZGVkIHAtMS41IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBob3Zlcjp0ZXh0LWZvcmVncm91bmQnLCBjb2xsYXBzZWQgJiYgJ214LWF1dG8nKX1cbiAgICAgICAgICBhcmlhLWxhYmVsPXtjb2xsYXBzZWQgPyB0KCdzaWRlYmFyLmV4cGFuZCcpIDogdCgnc2lkZWJhci5jb2xsYXBzZScpfVxuICAgICAgICA+XG4gICAgICAgICAge2NvbGxhcHNlZCA/IDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+IDogPENoZXZyb25MZWZ0IGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPn1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOWvvOiIqumTvuaOpeWIl+ihqCAqL31cbiAgICAgIDxuYXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMSBwLTJcIj5cbiAgICAgICAge25hdkl0ZW1zLm1hcCgoeyBwYXRoLCBpY29uOiBJY29uLCBsYWJlbEtleSB9KSA9PiAoXG4gICAgICAgICAgPE5hdkxpbmtcbiAgICAgICAgICAgIGtleT17cGF0aH1cbiAgICAgICAgICAgIHRvPXtwYXRofVxuICAgICAgICAgICAgY2xhc3NOYW1lPXsoeyBpc0FjdGl2ZSB9KSA9PlxuICAgICAgICAgICAgICBjbihcbiAgICAgICAgICAgICAgICAnZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcm91bmRlZC1tZCBweC0zIHB5LTIgdGV4dC1zbSB0cmFuc2l0aW9uLWNvbG9ycycsXG4gICAgICAgICAgICAgICAgaXNBY3RpdmVcbiAgICAgICAgICAgICAgICAgID8gJ2JnLXByaW1hcnkvMTAgdGV4dC1wcmltYXJ5IGZvbnQtbWVkaXVtJ1xuICAgICAgICAgICAgICAgICAgOiAndGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGhvdmVyOmJnLWFjY2VudCBob3Zlcjp0ZXh0LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgICAgIGNvbGxhcHNlZCAmJiAnanVzdGlmeS1jZW50ZXIgcHgtMicsXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8SWNvbiBjbGFzc05hbWU9XCJoLTQgdy00IHNocmluay0wXCIgLz5cbiAgICAgICAgICAgIHshY29sbGFwc2VkICYmIDxzcGFuPnt0KGxhYmVsS2V5KX08L3NwYW4+fVxuICAgICAgICAgIDwvTmF2TGluaz5cbiAgICAgICAgKSl9XG4gICAgICA8L25hdj5cblxuICAgICAgey8qIOmAmuefpemTg+mTmyAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm9yZGVyLXQgYm9yZGVyLWJvcmRlciBwLTJcIj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlKCcvbm90aWZpY2F0aW9ucycpfVxuICAgICAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgICAgICAncmVsYXRpdmUgZmxleCB3LWZ1bGwgaXRlbXMtY2VudGVyIGdhcC0zIHJvdW5kZWQtbWQgcHgtMyBweS0yIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJnLWFjY2VudCBob3Zlcjp0ZXh0LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgY29sbGFwc2VkICYmICdqdXN0aWZ5LWNlbnRlciBweC0yJyxcbiAgICAgICAgICApfVxuICAgICAgICA+XG4gICAgICAgICAgPEJlbGwgY2xhc3NOYW1lPVwiaC00IHctNCBzaHJpbmstMFwiIC8+XG4gICAgICAgICAgeyFjb2xsYXBzZWQgJiYgPHNwYW4+6YCa55+lPC9zcGFuPn1cbiAgICAgICAgICB7dW5yZWFkQ291bnQgIT0gbnVsbCAmJiB1bnJlYWRDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtjbihcbiAgICAgICAgICAgICAgJ2ZsZXggaC01IG1pbi13LTUgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtZnVsbCBiZy1yZWQtNTAwIHB4LTEuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtd2hpdGUnLFxuICAgICAgICAgICAgICBjb2xsYXBzZWQgJiYgJ2Fic29sdXRlIC1yaWdodC0wLjUgLXRvcC0wLjUnLFxuICAgICAgICAgICAgKX0+XG4gICAgICAgICAgICAgIHt1bnJlYWRDb3VudCA+IDk5ID8gJzk5KycgOiB1bnJlYWRDb3VudH1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvYXNpZGU+XG4gICAgPC8+XG4gICk7XG59XG4iXX0=