import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.tsx");const Suspense = __vite__cjsImport2_react["Suspense"]; const lazy = __vite__cjsImport2_react["lazy"];const useEffect = __vite__cjsImport11_react["useEffect"];const _jsxDEV = __vite__cjsImport18_react_jsxDevRuntime["jsxDEV"];import { BrowserRouter, Routes, Route, Navigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { QueryClientProvider } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=1d2f6f90";
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { queryClient } from "/src/lib/queryClient.ts";
import { AuthLayout } from "/src/components/layout/AuthLayout.tsx";
import { AppLayout } from "/src/components/layout/AppLayout.tsx";
import { AuthGuard } from "/src/components/layout/AuthGuard.tsx";
import { NotificationToast } from "/src/components/layout/NotificationToast.tsx";
import { InstallPrompt } from "/src/components/layout/InstallPrompt.tsx";
import { OfflineIndicator } from "/src/components/layout/OfflineIndicator.tsx";
import { RootErrorBoundary } from "/src/components/layout/RootErrorBoundary.tsx";
import __vite__cjsImport11_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useAuthStore } from "/src/stores/authStore.ts";
import useTokenRefresh from "/src/hooks/useTokenRefresh.ts";
// 认证页面 — 首屏需要，直接导入
import LoginPage from "/src/pages/LoginPage.tsx";
import RegisterPage from "/src/pages/RegisterPage.tsx";
import ForgotPasswordPage from "/src/pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "/src/pages/ResetPasswordPage.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/App.tsx";
import __vite__cjsImport18_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
// 业务页面 — 懒加载，减少首屏包体积
const DashboardPage = lazy(_c = () => import("/src/pages/DashboardPage.tsx"));
_c2 = DashboardPage;
const DeviceListPage = lazy(_c3 = () => import("/src/pages/DeviceListPage.tsx"));
_c4 = DeviceListPage;
const DeviceDetailPage = lazy(_c5 = () => import("/src/pages/DeviceDetailPage.tsx"));
_c6 = DeviceDetailPage;
const DeviceSetupPage = lazy(_c7 = () => import("/src/pages/DeviceSetupPage.tsx"));
_c8 = DeviceSetupPage;
const GatewayMonitorPage = lazy(_c9 = () => import("/src/pages/GatewayMonitorPage.tsx"));
_c10 = GatewayMonitorPage;
const GatewayListPage = lazy(_c11 = () => import("/src/pages/GatewayListPage.tsx"));
_c12 = GatewayListPage;
const AlertCenterPage = lazy(_c13 = () => import("/src/pages/AlertCenterPage.tsx"));
_c14 = AlertCenterPage;
const AlertRulesPage = lazy(_c15 = () => import("/src/pages/AlertRulesPage.tsx"));
_c16 = AlertRulesPage;
const WorkOrderListPage = lazy(_c17 = () => import("/src/pages/WorkOrderListPage.tsx"));
_c18 = WorkOrderListPage;
const WorkOrderDetailPage = lazy(_c19 = () => import("/src/pages/WorkOrderDetailPage.tsx"));
_c20 = WorkOrderDetailPage;
const WorkOrderReportsPage = lazy(_c21 = () => import("/src/pages/WorkOrderReportsPage.tsx"));
_c22 = WorkOrderReportsPage;
const DispatchBoardPage = lazy(_c23 = () => import("/src/pages/DispatchBoardPage.tsx"));
_c24 = DispatchBoardPage;
const AnalysesPage = lazy(_c25 = () => import("/src/pages/AnalysesPage.tsx"));
_c26 = AnalysesPage;
const KnowledgePage = lazy(_c27 = () => import("/src/pages/KnowledgePage.tsx"));
_c28 = KnowledgePage;
const FmeaPage = lazy(_c29 = () => import("/src/pages/FmeaPage.tsx"));
_c30 = FmeaPage;
const PendingRulesPage = lazy(_c31 = () => import("/src/pages/PendingRulesPage.tsx"));
_c32 = PendingRulesPage;
const PendingApprovalsPage = lazy(_c33 = () => import("/src/pages/PendingApprovalsPage.tsx"));
_c34 = PendingApprovalsPage;
const EvaluationPage = lazy(_c35 = () => import("/src/pages/EvaluationPage.tsx"));
_c36 = EvaluationPage;
const NotificationsPage = lazy(_c37 = () => import("/src/pages/NotificationsPage.tsx"));
_c38 = NotificationsPage;
const AuditLogsPage = lazy(_c39 = () => import("/src/pages/AuditLogsPage.tsx"));
_c40 = AuditLogsPage;
const UsersPage = lazy(_c41 = () => import("/src/pages/UsersPage.tsx"));
_c42 = UsersPage;
const SettingsPage = lazy(_c43 = () => import("/src/pages/SettingsPage.tsx"));
_c44 = SettingsPage;
const TenantsPage = lazy(_c45 = () => import("/src/pages/admin/TenantsPage.tsx"));
_c46 = TenantsPage;
const TenantDetailPage = lazy(_c47 = () => import("/src/pages/admin/TenantDetailPage.tsx"));
_c48 = TenantDetailPage;
/** 页面懒加载回退 */
function PageFallback() {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex h-full items-center justify-center",
		children: /* @__PURE__ */ _jsxDEV("div", {
			className: "text-muted-foreground",
			children: "加载中..."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 52,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 51,
		columnNumber: 5
	}, this);
}
_c49 = PageFallback;
/**
* 应用路由配置
*
* - /login 使用 AuthLayout（居中布局）
* - 其他路由使用 AppLayout（侧边栏+头部），需认证
* - 业务页面使用 React.lazy 懒加载，减少首屏体积
*/
function AppRoutes() {
	_s();
	const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	/** 页面加载时从 sessionStorage 恢复认证状态（Cookie 由浏览器自动管理） */
	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);
	/** Access Token 过期前 5 分钟自动刷新，避免用户操作中途 401 */
	useTokenRefresh();
	return /* @__PURE__ */ _jsxDEV(Routes, { children: [
		/* @__PURE__ */ _jsxDEV(Route, {
			element: /* @__PURE__ */ _jsxDEV(AuthLayout, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 79,
				columnNumber: 23
			}, this),
			children: [
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/login",
					element: isAuthenticated ? /* @__PURE__ */ _jsxDEV(Navigate, {
						to: "/dashboard",
						replace: true
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 80,
						columnNumber: 57
					}, this) : /* @__PURE__ */ _jsxDEV(LoginPage, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 80,
						columnNumber: 96
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 80,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/register",
					element: isAuthenticated ? /* @__PURE__ */ _jsxDEV(Navigate, {
						to: "/dashboard",
						replace: true
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 81,
						columnNumber: 60
					}, this) : /* @__PURE__ */ _jsxDEV(RegisterPage, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 81,
						columnNumber: 99
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 81,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/forgot-password",
					element: isAuthenticated ? /* @__PURE__ */ _jsxDEV(Navigate, {
						to: "/dashboard",
						replace: true
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 82,
						columnNumber: 67
					}, this) : /* @__PURE__ */ _jsxDEV(ForgotPasswordPage, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 82,
						columnNumber: 106
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/reset-password",
					element: isAuthenticated ? /* @__PURE__ */ _jsxDEV(Navigate, {
						to: "/dashboard",
						replace: true
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 66
					}, this) : /* @__PURE__ */ _jsxDEV(ResetPasswordPage, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 105
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 83,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 79,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			element: /* @__PURE__ */ _jsxDEV(AuthGuard, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 87,
				columnNumber: 23
			}, this),
			children: /* @__PURE__ */ _jsxDEV(Route, {
				element: /* @__PURE__ */ _jsxDEV(AppLayout, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 88,
					columnNumber: 25
				}, this),
				children: /* @__PURE__ */ _jsxDEV(Route, {
					errorElement: /* @__PURE__ */ _jsxDEV(RouteErrorFallback, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 32
					}, this),
					children: [
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/dashboard",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 91,
									columnNumber: 67
								}, this),
								children: /* @__PURE__ */ _jsxDEV(DashboardPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 91,
									columnNumber: 85
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 91,
								columnNumber: 47
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/devices",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 92,
									columnNumber: 65
								}, this),
								children: /* @__PURE__ */ _jsxDEV(DeviceListPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 92,
									columnNumber: 83
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 92,
								columnNumber: 45
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 92,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/devices/:id",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 93,
									columnNumber: 69
								}, this),
								children: /* @__PURE__ */ _jsxDEV(DeviceDetailPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 93,
									columnNumber: 87
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 93,
								columnNumber: 49
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 93,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/device-setup",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 94,
									columnNumber: 70
								}, this),
								children: /* @__PURE__ */ _jsxDEV(DeviceSetupPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 94,
									columnNumber: 88
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 94,
								columnNumber: 50
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 94,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/gateways",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 95,
									columnNumber: 66
								}, this),
								children: /* @__PURE__ */ _jsxDEV(GatewayListPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 95,
									columnNumber: 84
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 95,
								columnNumber: 46
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 95,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/gateways/:gatewayId",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 96,
									columnNumber: 77
								}, this),
								children: /* @__PURE__ */ _jsxDEV(GatewayMonitorPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 96,
									columnNumber: 95
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 96,
								columnNumber: 57
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 96,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/gateway/monitor",
							element: /* @__PURE__ */ _jsxDEV(Navigate, {
								to: "/gateways",
								replace: true
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 97,
								columnNumber: 53
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 97,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/alerts",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 98,
									columnNumber: 64
								}, this),
								children: /* @__PURE__ */ _jsxDEV(AlertCenterPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 98,
									columnNumber: 82
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 98,
								columnNumber: 44
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 98,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/alert-rules",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 99,
									columnNumber: 69
								}, this),
								children: /* @__PURE__ */ _jsxDEV(AlertRulesPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 99,
									columnNumber: 87
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 99,
								columnNumber: 49
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 99,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/work-orders",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 100,
									columnNumber: 69
								}, this),
								children: /* @__PURE__ */ _jsxDEV(WorkOrderListPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 100,
									columnNumber: 87
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 100,
								columnNumber: 49
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 100,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/work-orders/reports",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 101,
									columnNumber: 77
								}, this),
								children: /* @__PURE__ */ _jsxDEV(WorkOrderReportsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 101,
									columnNumber: 95
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 101,
								columnNumber: 57
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 101,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/work-orders/:id",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 102,
									columnNumber: 73
								}, this),
								children: /* @__PURE__ */ _jsxDEV(WorkOrderDetailPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 102,
									columnNumber: 91
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 102,
								columnNumber: 53
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 102,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/pending-approvals",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 103,
									columnNumber: 75
								}, this),
								children: /* @__PURE__ */ _jsxDEV(PendingApprovalsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 103,
									columnNumber: 93
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 103,
								columnNumber: 55
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/notifications",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 104,
									columnNumber: 71
								}, this),
								children: /* @__PURE__ */ _jsxDEV(NotificationsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 104,
									columnNumber: 89
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 104,
								columnNumber: 51
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 104,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/audit-logs",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 105,
									columnNumber: 68
								}, this),
								children: /* @__PURE__ */ _jsxDEV(AuditLogsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 105,
									columnNumber: 86
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 105,
								columnNumber: 48
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 105,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/users",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 106,
									columnNumber: 63
								}, this),
								children: /* @__PURE__ */ _jsxDEV(UsersPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 106,
									columnNumber: 81
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 106,
								columnNumber: 43
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 106,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/dispatch",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 107,
									columnNumber: 66
								}, this),
								children: /* @__PURE__ */ _jsxDEV(DispatchBoardPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 107,
									columnNumber: 84
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 107,
								columnNumber: 46
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 107,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/analyses",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 108,
									columnNumber: 66
								}, this),
								children: /* @__PURE__ */ _jsxDEV(AnalysesPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 108,
									columnNumber: 84
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 108,
								columnNumber: 46
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 108,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/knowledge",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 109,
									columnNumber: 67
								}, this),
								children: /* @__PURE__ */ _jsxDEV(KnowledgePage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 109,
									columnNumber: 85
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 109,
								columnNumber: 47
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 109,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/fmea",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 110,
									columnNumber: 62
								}, this),
								children: /* @__PURE__ */ _jsxDEV(FmeaPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 110,
									columnNumber: 80
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 110,
								columnNumber: 42
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 110,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/evaluation",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 111,
									columnNumber: 68
								}, this),
								children: /* @__PURE__ */ _jsxDEV(EvaluationPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 111,
									columnNumber: 86
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 111,
								columnNumber: 48
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 111,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/pending-rules",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 112,
									columnNumber: 71
								}, this),
								children: /* @__PURE__ */ _jsxDEV(PendingRulesPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 112,
									columnNumber: 89
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 112,
								columnNumber: 51
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 112,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/settings",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 113,
									columnNumber: 66
								}, this),
								children: /* @__PURE__ */ _jsxDEV(SettingsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 113,
									columnNumber: 84
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 113,
								columnNumber: 46
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 113,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/admin/tenants",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 115,
									columnNumber: 71
								}, this),
								children: /* @__PURE__ */ _jsxDEV(TenantsPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 115,
									columnNumber: 89
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 115,
								columnNumber: 51
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 115,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/admin/tenants/:id",
							element: /* @__PURE__ */ _jsxDEV(Suspense, {
								fallback: /* @__PURE__ */ _jsxDEV(PageFallback, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 116,
									columnNumber: 75
								}, this),
								children: /* @__PURE__ */ _jsxDEV(TenantDetailPage, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 116,
									columnNumber: 93
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 116,
								columnNumber: 55
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 116,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 90,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 88,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 87,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "*",
			element: /* @__PURE__ */ _jsxDEV(Navigate, {
				to: "/dashboard",
				replace: true
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 122,
				columnNumber: 32
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 122,
			columnNumber: 7
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 77,
		columnNumber: 5
	}, this);
}
_s(AppRoutes, "P+CeYVnLKr0/eFn00LtJctk6Yp0=", false, function() {
	return [
		useAuthStore,
		useAuthStore,
		useTokenRefresh
	];
});
_c50 = AppRoutes;
/**
* 路由级错误回退
*
* 与 RootErrorBoundary 不同，这个组件在 React Router 的 errorElement 机制下工作，
* 只替代出错路由的 outlet，AppLayout 的侧边栏/头部仍保持可用，用户可切换其他菜单继续操作。
* 使用 useRouteError 获取错误详情（React Router v7）。
*/
function RouteErrorFallback() {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex h-full flex-col items-center justify-center gap-4 p-8 text-center",
		children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ _jsxDEV("h2", {
				className: "text-xl font-semibold",
				children: "此页面发生错误"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 138,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: "请尝试刷新页面，或从左侧菜单切换到其他功能。"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 139,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 137,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("button", {
			type: "button",
			onClick: () => window.location.reload(),
			className: "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
			children: "重新加载"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 141,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 136,
		columnNumber: 5
	}, this);
}
_c51 = RouteErrorFallback;
/**
* 应用根组件
*
* 顶层 Provider 依次为：
* 1. QueryClientProvider — TanStack Query 数据请求
* 2. BrowserRouter — 路由
* 3. NotificationToast — 全局通知浮层
* 4. InstallPrompt — PWA 安装提示（仅在可安装时显示）
*/
export default function App() {
	return /* @__PURE__ */ _jsxDEV(RootErrorBoundary, { children: /* @__PURE__ */ _jsxDEV(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ _jsxDEV(BrowserRouter, { children: [
			/* @__PURE__ */ _jsxDEV(AppRoutes, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 166,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV(NotificationToast, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 167,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV(InstallPrompt, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 168,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ _jsxDEV(OfflineIndicator, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 169,
				columnNumber: 11
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 165,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 164,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 163,
		columnNumber: 5
	}, this);
}
_c52 = App;
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16, _c17, _c18, _c19, _c20, _c21, _c22, _c23, _c24, _c25, _c26, _c27, _c28, _c29, _c30, _c31, _c32, _c33, _c34, _c35, _c36, _c37, _c38, _c39, _c40, _c41, _c42, _c43, _c44, _c45, _c46, _c47, _c48, _c49, _c50, _c51, _c52;
$RefreshReg$(_c, "DashboardPage$lazy");
$RefreshReg$(_c2, "DashboardPage");
$RefreshReg$(_c3, "DeviceListPage$lazy");
$RefreshReg$(_c4, "DeviceListPage");
$RefreshReg$(_c5, "DeviceDetailPage$lazy");
$RefreshReg$(_c6, "DeviceDetailPage");
$RefreshReg$(_c7, "DeviceSetupPage$lazy");
$RefreshReg$(_c8, "DeviceSetupPage");
$RefreshReg$(_c9, "GatewayMonitorPage$lazy");
$RefreshReg$(_c10, "GatewayMonitorPage");
$RefreshReg$(_c11, "GatewayListPage$lazy");
$RefreshReg$(_c12, "GatewayListPage");
$RefreshReg$(_c13, "AlertCenterPage$lazy");
$RefreshReg$(_c14, "AlertCenterPage");
$RefreshReg$(_c15, "AlertRulesPage$lazy");
$RefreshReg$(_c16, "AlertRulesPage");
$RefreshReg$(_c17, "WorkOrderListPage$lazy");
$RefreshReg$(_c18, "WorkOrderListPage");
$RefreshReg$(_c19, "WorkOrderDetailPage$lazy");
$RefreshReg$(_c20, "WorkOrderDetailPage");
$RefreshReg$(_c21, "WorkOrderReportsPage$lazy");
$RefreshReg$(_c22, "WorkOrderReportsPage");
$RefreshReg$(_c23, "DispatchBoardPage$lazy");
$RefreshReg$(_c24, "DispatchBoardPage");
$RefreshReg$(_c25, "AnalysesPage$lazy");
$RefreshReg$(_c26, "AnalysesPage");
$RefreshReg$(_c27, "KnowledgePage$lazy");
$RefreshReg$(_c28, "KnowledgePage");
$RefreshReg$(_c29, "FmeaPage$lazy");
$RefreshReg$(_c30, "FmeaPage");
$RefreshReg$(_c31, "PendingRulesPage$lazy");
$RefreshReg$(_c32, "PendingRulesPage");
$RefreshReg$(_c33, "PendingApprovalsPage$lazy");
$RefreshReg$(_c34, "PendingApprovalsPage");
$RefreshReg$(_c35, "EvaluationPage$lazy");
$RefreshReg$(_c36, "EvaluationPage");
$RefreshReg$(_c37, "NotificationsPage$lazy");
$RefreshReg$(_c38, "NotificationsPage");
$RefreshReg$(_c39, "AuditLogsPage$lazy");
$RefreshReg$(_c40, "AuditLogsPage");
$RefreshReg$(_c41, "UsersPage$lazy");
$RefreshReg$(_c42, "UsersPage");
$RefreshReg$(_c43, "SettingsPage$lazy");
$RefreshReg$(_c44, "SettingsPage");
$RefreshReg$(_c45, "TenantsPage$lazy");
$RefreshReg$(_c46, "TenantsPage");
$RefreshReg$(_c47, "TenantDetailPage$lazy");
$RefreshReg$(_c48, "TenantDetailPage");
$RefreshReg$(_c49, "PageFallback");
$RefreshReg$(_c50, "AppRoutes");
$RefreshReg$(_c51, "RouteErrorFallback");
$RefreshReg$(_c52, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/App.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/App.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/App.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxlQUFlLFFBQVEsT0FBTyxnQkFBZ0I7QUFDdkQsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyxVQUFVLFlBQVk7QUFDL0IsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxxQkFBcUI7O0FBRzVCLE9BQU8sZUFBZTtBQUN0QixPQUFPLGtCQUFrQjtBQUN6QixPQUFPLHdCQUF3QjtBQUMvQixPQUFPLHVCQUF1Qjs7Ozs7QUFHOUIsTUFBTSxnQkFBZ0IsZ0JBQVcsT0FBTyx3QkFBd0I7O0FBQ2hFLE1BQU0saUJBQWlCLGlCQUFXLE9BQU8seUJBQXlCOztBQUNsRSxNQUFNLG1CQUFtQixpQkFBVyxPQUFPLDJCQUEyQjs7QUFDdEUsTUFBTSxrQkFBa0IsaUJBQVcsT0FBTywwQkFBMEI7O0FBQ3BFLE1BQU0scUJBQXFCLGlCQUFXLE9BQU8sNkJBQTZCOztBQUMxRSxNQUFNLGtCQUFrQixrQkFBVyxPQUFPLDBCQUEwQjs7QUFDcEUsTUFBTSxrQkFBa0Isa0JBQVcsT0FBTywwQkFBMEI7O0FBQ3BFLE1BQU0saUJBQWlCLGtCQUFXLE9BQU8seUJBQXlCOztBQUNsRSxNQUFNLG9CQUFvQixrQkFBVyxPQUFPLDRCQUE0Qjs7QUFDeEUsTUFBTSxzQkFBc0Isa0JBQVcsT0FBTyw4QkFBOEI7O0FBQzVFLE1BQU0sdUJBQXVCLGtCQUFXLE9BQU8sK0JBQStCOztBQUM5RSxNQUFNLG9CQUFvQixrQkFBVyxPQUFPLDRCQUE0Qjs7QUFDeEUsTUFBTSxlQUFlLGtCQUFXLE9BQU8sdUJBQXVCOztBQUM5RCxNQUFNLGdCQUFnQixrQkFBVyxPQUFPLHdCQUF3Qjs7QUFDaEUsTUFBTSxXQUFXLGtCQUFXLE9BQU8sbUJBQW1COztBQUN0RCxNQUFNLG1CQUFtQixrQkFBVyxPQUFPLDJCQUEyQjs7QUFDdEUsTUFBTSx1QkFBdUIsa0JBQVcsT0FBTywrQkFBK0I7O0FBQzlFLE1BQU0saUJBQWlCLGtCQUFXLE9BQU8seUJBQXlCOztBQUNsRSxNQUFNLG9CQUFvQixrQkFBVyxPQUFPLDRCQUE0Qjs7QUFDeEUsTUFBTSxnQkFBZ0Isa0JBQVcsT0FBTyx3QkFBd0I7O0FBQ2hFLE1BQU0sWUFBWSxrQkFBVyxPQUFPLG9CQUFvQjs7QUFDeEQsTUFBTSxlQUFlLGtCQUFXLE9BQU8sdUJBQXVCOztBQUM5RCxNQUFNLGNBQWMsa0JBQVcsT0FBTyw0QkFBNEI7O0FBQ2xFLE1BQU0sbUJBQW1CLGtCQUFXLE9BQU8saUNBQWlDOzs7QUFHNUUsU0FBUyxlQUFlO0NBQ3RCLE9BQ0Usd0JBQUMsT0FBRDtFQUFLLFdBQVU7WUFDYix3QkFBQyxPQUFEO0dBQUssV0FBVTthQUF3QjtFQUFXOzs7OztDQUMvQzs7Ozs7QUFFVDs7Ozs7Ozs7O0FBU0EsU0FBUyxZQUFZOztDQUNuQixNQUFNLGtCQUFrQixjQUFjLE1BQU0sRUFBRSxlQUFlO0NBQzdELE1BQU0sa0JBQWtCLGNBQWMsTUFBTSxFQUFFLGVBQWU7O0NBRzdELGdCQUFnQjtFQUNkLGdCQUFnQjtDQUNsQixHQUFHLENBQUMsZUFBZSxDQUFDOztDQUdwQixnQkFBZ0I7Q0FFaEIsT0FDRSx3QkFBQyxRQUFEO0VBRUUsd0JBQUMsT0FBRDtHQUFPLFNBQVMsd0JBQUMsWUFBRCxDQUFhOzs7OzthQUE3QjtJQUNFLHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQVMsU0FBUyxrQkFBa0Isd0JBQUMsVUFBRDtNQUFVLElBQUc7TUFBYTtLQUFTOzs7O2dCQUFJLHdCQUFDLFdBQUQsQ0FBWTs7Ozs7SUFBSTs7Ozs7SUFDdkcsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBWSxTQUFTLGtCQUFrQix3QkFBQyxVQUFEO01BQVUsSUFBRztNQUFhO0tBQVM7Ozs7Z0JBQUksd0JBQUMsY0FBRCxDQUFlOzs7OztJQUFJOzs7OztJQUM3Ryx3QkFBQyxPQUFEO0tBQU8sTUFBSztLQUFtQixTQUFTLGtCQUFrQix3QkFBQyxVQUFEO01BQVUsSUFBRztNQUFhO0tBQVM7Ozs7Z0JBQUksd0JBQUMsb0JBQUQsQ0FBcUI7Ozs7O0lBQUk7Ozs7O0lBQzFILHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQWtCLFNBQVMsa0JBQWtCLHdCQUFDLFVBQUQ7TUFBVSxJQUFHO01BQWE7S0FBUzs7OztnQkFBSSx3QkFBQyxtQkFBRCxDQUFvQjs7Ozs7SUFBSTs7Ozs7R0FDbkg7Ozs7OztFQUdQLHdCQUFDLE9BQUQ7R0FBTyxTQUFTLHdCQUFDLFdBQUQsQ0FBWTs7Ozs7YUFDMUIsd0JBQUMsT0FBRDtJQUFPLFNBQVMsd0JBQUMsV0FBRCxDQUFZOzs7OztjQUUxQix3QkFBQyxPQUFEO0tBQU8sY0FBYyx3QkFBQyxvQkFBRCxDQUFxQjs7Ozs7ZUFBMUM7TUFDRSx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFhLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxlQUFELENBQWdCOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUN2Ryx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFXLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxnQkFBRCxDQUFpQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDdEcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBZSxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsa0JBQUQsQ0FBbUI7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQzVHLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQWdCLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxpQkFBRCxDQUFrQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDNUcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBWSxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsaUJBQUQsQ0FBa0I7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQ3hHLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQXVCLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxvQkFBRCxDQUFxQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDdEgsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBbUIsU0FBUyx3QkFBQyxVQUFEO1FBQVUsSUFBRztRQUFZO09BQVM7Ozs7O01BQUk7Ozs7O01BQzlFLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQVUsU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLGlCQUFELENBQWtCOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUN0Ryx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFlLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxnQkFBRCxDQUFpQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDMUcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBZSxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsbUJBQUQsQ0FBb0I7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQzdHLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQXVCLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxzQkFBRCxDQUF1Qjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDeEgsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBbUIsU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLHFCQUFELENBQXNCOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUNuSCx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFxQixTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsc0JBQUQsQ0FBdUI7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQ3RILHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQWlCLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxtQkFBRCxDQUFvQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDL0csd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBYyxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsZUFBRCxDQUFnQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDeEcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBUyxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsV0FBRCxDQUFZOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUMvRix3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFZLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxtQkFBRCxDQUFvQjs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDMUcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBWSxTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsY0FBRCxDQUFlOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUNyRyx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFhLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxlQUFELENBQWdCOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUN2Ryx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFRLFNBQVMsd0JBQUMsVUFBRDtRQUFVLFVBQVUsd0JBQUMsY0FBRCxDQUFlOzs7OztrQkFBRyx3QkFBQyxVQUFELENBQVc7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQzdGLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQWMsU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLGdCQUFELENBQWlCOzs7OztPQUFXOzs7OztNQUFJOzs7OztNQUN6Ryx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFpQixTQUFTLHdCQUFDLFVBQUQ7UUFBVSxVQUFVLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7a0JBQUcsd0JBQUMsa0JBQUQsQ0FBbUI7Ozs7O09BQVc7Ozs7O01BQUk7Ozs7O01BQzlHLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQVksU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFFckcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBaUIsU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLGFBQUQsQ0FBYzs7Ozs7T0FBVzs7Ozs7TUFBSTs7Ozs7TUFDekcsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBcUIsU0FBUyx3QkFBQyxVQUFEO1FBQVUsVUFBVSx3QkFBQyxjQUFELENBQWU7Ozs7O2tCQUFHLHdCQUFDLGtCQUFELENBQW1COzs7OztPQUFXOzs7OztNQUFJOzs7OztLQUM3Rzs7Ozs7O0dBQ0Y7Ozs7O0VBQ0Y7Ozs7O0VBR1Asd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBSSxTQUFTLHdCQUFDLFVBQUQ7SUFBVSxJQUFHO0lBQWE7R0FBUzs7Ozs7RUFBSTs7Ozs7Q0FDMUQ7Ozs7O0FBRVo7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSxTQUFTLHFCQUFxQjtDQUM1QixPQUNFLHdCQUFDLE9BQUQ7RUFBSyxXQUFVO1lBQWYsQ0FDRSx3QkFBQyxPQUFEO0dBQUssV0FBVTthQUFmLENBQ0Usd0JBQUMsTUFBRDtJQUFJLFdBQVU7Y0FBd0I7R0FBVzs7OzthQUNqRCx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFnQztHQUF5Qjs7OztXQUNuRTs7Ozs7WUFDTCx3QkFBQyxVQUFEO0dBQ0UsTUFBSztHQUNMLGVBQWUsT0FBTyxTQUFTLE9BQU87R0FDdEMsV0FBVTthQUNYO0VBRU87Ozs7VUFDTDs7Ozs7O0FBRVQ7Ozs7Ozs7Ozs7O0FBV0EsZUFBZSxTQUFTLE1BQU07Q0FDNUIsT0FDRSx3QkFBQyxtQkFBRCxZQUNFLHdCQUFDLHFCQUFEO0VBQXFCLFFBQVE7WUFDM0Isd0JBQUMsZUFBRDtHQUNFLHdCQUFDLFdBQUQsQ0FBWTs7Ozs7R0FDWix3QkFBQyxtQkFBRCxDQUFvQjs7Ozs7R0FDcEIsd0JBQUMsZUFBRCxDQUFnQjs7Ozs7R0FDaEIsd0JBQUMsa0JBQUQsQ0FBbUI7Ozs7O0VBQ047Ozs7O0NBQ0k7Ozs7VUFDSjs7Ozs7QUFFdkIiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXBwLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCcm93c2VyUm91dGVyLCBSb3V0ZXMsIFJvdXRlLCBOYXZpZ2F0ZSB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IHsgUXVlcnlDbGllbnRQcm92aWRlciB9IGZyb20gJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSc7XG5pbXBvcnQgeyBTdXNwZW5zZSwgbGF6eSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHF1ZXJ5Q2xpZW50IH0gZnJvbSAnLi9saWIvcXVlcnlDbGllbnQnO1xuaW1wb3J0IHsgQXV0aExheW91dCB9IGZyb20gJy4vY29tcG9uZW50cy9sYXlvdXQvQXV0aExheW91dCc7XG5pbXBvcnQgeyBBcHBMYXlvdXQgfSBmcm9tICcuL2NvbXBvbmVudHMvbGF5b3V0L0FwcExheW91dCc7XG5pbXBvcnQgeyBBdXRoR3VhcmQgfSBmcm9tICcuL2NvbXBvbmVudHMvbGF5b3V0L0F1dGhHdWFyZCc7XG5pbXBvcnQgeyBOb3RpZmljYXRpb25Ub2FzdCB9IGZyb20gJy4vY29tcG9uZW50cy9sYXlvdXQvTm90aWZpY2F0aW9uVG9hc3QnO1xuaW1wb3J0IHsgSW5zdGFsbFByb21wdCB9IGZyb20gJy4vY29tcG9uZW50cy9sYXlvdXQvSW5zdGFsbFByb21wdCc7XG5pbXBvcnQgeyBPZmZsaW5lSW5kaWNhdG9yIH0gZnJvbSAnLi9jb21wb25lbnRzL2xheW91dC9PZmZsaW5lSW5kaWNhdG9yJztcbmltcG9ydCB7IFJvb3RFcnJvckJvdW5kYXJ5IH0gZnJvbSAnLi9jb21wb25lbnRzL2xheW91dC9Sb290RXJyb3JCb3VuZGFyeSc7XG5pbXBvcnQgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VBdXRoU3RvcmUgfSBmcm9tICcuL3N0b3Jlcy9hdXRoU3RvcmUnO1xuaW1wb3J0IHVzZVRva2VuUmVmcmVzaCBmcm9tICcuL2hvb2tzL3VzZVRva2VuUmVmcmVzaCc7XG5cbi8vIOiupOivgemhtemdoiDigJQg6aaW5bGP6ZyA6KaB77yM55u05o6l5a+85YWlXG5pbXBvcnQgTG9naW5QYWdlIGZyb20gJy4vcGFnZXMvTG9naW5QYWdlJztcbmltcG9ydCBSZWdpc3RlclBhZ2UgZnJvbSAnLi9wYWdlcy9SZWdpc3RlclBhZ2UnO1xuaW1wb3J0IEZvcmdvdFBhc3N3b3JkUGFnZSBmcm9tICcuL3BhZ2VzL0ZvcmdvdFBhc3N3b3JkUGFnZSc7XG5pbXBvcnQgUmVzZXRQYXNzd29yZFBhZ2UgZnJvbSAnLi9wYWdlcy9SZXNldFBhc3N3b3JkUGFnZSc7XG5cbi8vIOS4muWKoemhtemdoiDigJQg5oeS5Yqg6L2977yM5YeP5bCR6aaW5bGP5YyF5L2T56evXG5jb25zdCBEYXNoYm9hcmRQYWdlID0gbGF6eSgoKSA9PiBpbXBvcnQoJy4vcGFnZXMvRGFzaGJvYXJkUGFnZScpKTtcbmNvbnN0IERldmljZUxpc3RQYWdlID0gbGF6eSgoKSA9PiBpbXBvcnQoJy4vcGFnZXMvRGV2aWNlTGlzdFBhZ2UnKSk7XG5jb25zdCBEZXZpY2VEZXRhaWxQYWdlID0gbGF6eSgoKSA9PiBpbXBvcnQoJy4vcGFnZXMvRGV2aWNlRGV0YWlsUGFnZScpKTtcbmNvbnN0IERldmljZVNldHVwUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0RldmljZVNldHVwUGFnZScpKTtcbmNvbnN0IEdhdGV3YXlNb25pdG9yUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0dhdGV3YXlNb25pdG9yUGFnZScpKTtcbmNvbnN0IEdhdGV3YXlMaXN0UGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0dhdGV3YXlMaXN0UGFnZScpKTtcbmNvbnN0IEFsZXJ0Q2VudGVyUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0FsZXJ0Q2VudGVyUGFnZScpKTtcbmNvbnN0IEFsZXJ0UnVsZXNQYWdlID0gbGF6eSgoKSA9PiBpbXBvcnQoJy4vcGFnZXMvQWxlcnRSdWxlc1BhZ2UnKSk7XG5jb25zdCBXb3JrT3JkZXJMaXN0UGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL1dvcmtPcmRlckxpc3RQYWdlJykpO1xuY29uc3QgV29ya09yZGVyRGV0YWlsUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL1dvcmtPcmRlckRldGFpbFBhZ2UnKSk7XG5jb25zdCBXb3JrT3JkZXJSZXBvcnRzUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL1dvcmtPcmRlclJlcG9ydHNQYWdlJykpO1xuY29uc3QgRGlzcGF0Y2hCb2FyZFBhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9EaXNwYXRjaEJvYXJkUGFnZScpKTtcbmNvbnN0IEFuYWx5c2VzUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0FuYWx5c2VzUGFnZScpKTtcbmNvbnN0IEtub3dsZWRnZVBhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9Lbm93bGVkZ2VQYWdlJykpO1xuY29uc3QgRm1lYVBhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9GbWVhUGFnZScpKTtcbmNvbnN0IFBlbmRpbmdSdWxlc1BhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9QZW5kaW5nUnVsZXNQYWdlJykpO1xuY29uc3QgUGVuZGluZ0FwcHJvdmFsc1BhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9QZW5kaW5nQXBwcm92YWxzUGFnZScpKTtcbmNvbnN0IEV2YWx1YXRpb25QYWdlID0gbGF6eSgoKSA9PiBpbXBvcnQoJy4vcGFnZXMvRXZhbHVhdGlvblBhZ2UnKSk7XG5jb25zdCBOb3RpZmljYXRpb25zUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL05vdGlmaWNhdGlvbnNQYWdlJykpO1xuY29uc3QgQXVkaXRMb2dzUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL0F1ZGl0TG9nc1BhZ2UnKSk7XG5jb25zdCBVc2Vyc1BhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9Vc2Vyc1BhZ2UnKSk7XG5jb25zdCBTZXR0aW5nc1BhZ2UgPSBsYXp5KCgpID0+IGltcG9ydCgnLi9wYWdlcy9TZXR0aW5nc1BhZ2UnKSk7XG5jb25zdCBUZW5hbnRzUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL2FkbWluL1RlbmFudHNQYWdlJykpO1xuY29uc3QgVGVuYW50RGV0YWlsUGFnZSA9IGxhenkoKCkgPT4gaW1wb3J0KCcuL3BhZ2VzL2FkbWluL1RlbmFudERldGFpbFBhZ2UnKSk7XG5cbi8qKiDpobXpnaLmh5LliqDovb3lm57pgIAgKi9cbmZ1bmN0aW9uIFBhZ2VGYWxsYmFjaygpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaC1mdWxsIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7liqDovb3kuK0uLi48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLyoqXG4gKiDlupTnlKjot6/nlLHphY3nva5cbiAqXG4gKiAtIC9sb2dpbiDkvb/nlKggQXV0aExheW91dO+8iOWxheS4reW4g+WxgO+8iVxuICogLSDlhbbku5bot6/nlLHkvb/nlKggQXBwTGF5b3V077yI5L6n6L655qCPK+WktOmDqO+8ie+8jOmcgOiupOivgVxuICogLSDkuJrliqHpobXpnaLkvb/nlKggUmVhY3QubGF6eSDmh5LliqDovb3vvIzlh4/lsJHpppblsY/kvZPnp69cbiAqL1xuZnVuY3Rpb24gQXBwUm91dGVzKCkge1xuICBjb25zdCBsb2FkRnJvbVN0b3JhZ2UgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMubG9hZEZyb21TdG9yYWdlKTtcbiAgY29uc3QgaXNBdXRoZW50aWNhdGVkID0gdXNlQXV0aFN0b3JlKChzKSA9PiBzLmlzQXV0aGVudGljYXRlZCk7XG5cbiAgLyoqIOmhtemdouWKoOi9veaXtuS7jiBzZXNzaW9uU3RvcmFnZSDmgaLlpI3orqTor4HnirbmgIHvvIhDb29raWUg55Sx5rWP6KeI5Zmo6Ieq5Yqo566h55CG77yJICovXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbG9hZEZyb21TdG9yYWdlKCk7XG4gIH0sIFtsb2FkRnJvbVN0b3JhZ2VdKTtcblxuICAvKiogQWNjZXNzIFRva2VuIOi/h+acn+WJjSA1IOWIhumSn+iHquWKqOWIt+aWsO+8jOmBv+WFjeeUqOaIt+aTjeS9nOS4remAlCA0MDEgKi9cbiAgdXNlVG9rZW5SZWZyZXNoKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8Um91dGVzPlxuICAgICAgey8qIOiupOivgei3r+eUsSAqL31cbiAgICAgIDxSb3V0ZSBlbGVtZW50PXs8QXV0aExheW91dCAvPn0+XG4gICAgICAgIDxSb3V0ZSBwYXRoPVwiL2xvZ2luXCIgZWxlbWVudD17aXNBdXRoZW50aWNhdGVkID8gPE5hdmlnYXRlIHRvPVwiL2Rhc2hib2FyZFwiIHJlcGxhY2UgLz4gOiA8TG9naW5QYWdlIC8+fSAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9yZWdpc3RlclwiIGVsZW1lbnQ9e2lzQXV0aGVudGljYXRlZCA/IDxOYXZpZ2F0ZSB0bz1cIi9kYXNoYm9hcmRcIiByZXBsYWNlIC8+IDogPFJlZ2lzdGVyUGFnZSAvPn0gLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvZm9yZ290LXBhc3N3b3JkXCIgZWxlbWVudD17aXNBdXRoZW50aWNhdGVkID8gPE5hdmlnYXRlIHRvPVwiL2Rhc2hib2FyZFwiIHJlcGxhY2UgLz4gOiA8Rm9yZ290UGFzc3dvcmRQYWdlIC8+fSAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9yZXNldC1wYXNzd29yZFwiIGVsZW1lbnQ9e2lzQXV0aGVudGljYXRlZCA/IDxOYXZpZ2F0ZSB0bz1cIi9kYXNoYm9hcmRcIiByZXBsYWNlIC8+IDogPFJlc2V0UGFzc3dvcmRQYWdlIC8+fSAvPlxuICAgICAgPC9Sb3V0ZT5cblxuICAgICAgey8qIOS4muWKoei3r+eUse+8iOmcgOiupOivge+8jEF1dGhHdWFyZCDkv53miqTvvIkgKi99XG4gICAgICA8Um91dGUgZWxlbWVudD17PEF1dGhHdWFyZCAvPn0+XG4gICAgICAgIDxSb3V0ZSBlbGVtZW50PXs8QXBwTGF5b3V0IC8+fT5cbiAgICAgICAgICB7Lyog6Lev55Sx57qn6ZSZ6K+v6L6555WM77ya5Y2V6aG16Z2i5bSp5rqD5pe25Zyo5q2k5YWc5bqV77yM6YG/5YWN5b2x5ZON5pW05LiqIEFwcExheW91dO+8iOS+p+i+ueagjy/lpLTpg6jku43lj6/nlKjvvIkgKi99XG4gICAgICAgICAgPFJvdXRlIGVycm9yRWxlbWVudD17PFJvdXRlRXJyb3JGYWxsYmFjayAvPn0+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9kYXNoYm9hcmRcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxEYXNoYm9hcmRQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9kZXZpY2VzXCIgZWxlbWVudD17PFN1c3BlbnNlIGZhbGxiYWNrPXs8UGFnZUZhbGxiYWNrIC8+fT48RGV2aWNlTGlzdFBhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2RldmljZXMvOmlkXCIgZWxlbWVudD17PFN1c3BlbnNlIGZhbGxiYWNrPXs8UGFnZUZhbGxiYWNrIC8+fT48RGV2aWNlRGV0YWlsUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvZGV2aWNlLXNldHVwXCIgZWxlbWVudD17PFN1c3BlbnNlIGZhbGxiYWNrPXs8UGFnZUZhbGxiYWNrIC8+fT48RGV2aWNlU2V0dXBQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9nYXRld2F5c1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PEdhdGV3YXlMaXN0UGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvZ2F0ZXdheXMvOmdhdGV3YXlJZFwiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PEdhdGV3YXlNb25pdG9yUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvZ2F0ZXdheS9tb25pdG9yXCIgZWxlbWVudD17PE5hdmlnYXRlIHRvPVwiL2dhdGV3YXlzXCIgcmVwbGFjZSAvPn0gLz5cbiAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2FsZXJ0c1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PEFsZXJ0Q2VudGVyUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvYWxlcnQtcnVsZXNcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxBbGVydFJ1bGVzUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvd29yay1vcmRlcnNcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxXb3JrT3JkZXJMaXN0UGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvd29yay1vcmRlcnMvcmVwb3J0c1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PFdvcmtPcmRlclJlcG9ydHNQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi93b3JrLW9yZGVycy86aWRcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxXb3JrT3JkZXJEZXRhaWxQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9wZW5kaW5nLWFwcHJvdmFsc1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PFBlbmRpbmdBcHByb3ZhbHNQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9ub3RpZmljYXRpb25zXCIgZWxlbWVudD17PFN1c3BlbnNlIGZhbGxiYWNrPXs8UGFnZUZhbGxiYWNrIC8+fT48Tm90aWZpY2F0aW9uc1BhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2F1ZGl0LWxvZ3NcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxBdWRpdExvZ3NQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi91c2Vyc1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PFVzZXJzUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvZGlzcGF0Y2hcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxEaXNwYXRjaEJvYXJkUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvYW5hbHlzZXNcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxBbmFseXNlc1BhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2tub3dsZWRnZVwiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PEtub3dsZWRnZVBhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2ZtZWFcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxGbWVhUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvZXZhbHVhdGlvblwiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PEV2YWx1YXRpb25QYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9wZW5kaW5nLXJ1bGVzXCIgZWxlbWVudD17PFN1c3BlbnNlIGZhbGxiYWNrPXs8UGFnZUZhbGxiYWNrIC8+fT48UGVuZGluZ1J1bGVzUGFnZSAvPjwvU3VzcGVuc2U+fSAvPlxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvc2V0dGluZ3NcIiBlbGVtZW50PXs8U3VzcGVuc2UgZmFsbGJhY2s9ezxQYWdlRmFsbGJhY2sgLz59PjxTZXR0aW5nc1BhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICAgIHsvKiBzeXN0ZW1fYWRtaW4g566h55CG6Lev55SxICovfVxuICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvYWRtaW4vdGVuYW50c1wiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PFRlbmFudHNQYWdlIC8+PC9TdXNwZW5zZT59IC8+XG4gICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9hZG1pbi90ZW5hbnRzLzppZFwiIGVsZW1lbnQ9ezxTdXNwZW5zZSBmYWxsYmFjaz17PFBhZ2VGYWxsYmFjayAvPn0+PFRlbmFudERldGFpbFBhZ2UgLz48L1N1c3BlbnNlPn0gLz5cbiAgICAgICAgICA8L1JvdXRlPlxuICAgICAgICA8L1JvdXRlPlxuICAgICAgPC9Sb3V0ZT5cblxuICAgICAgey8qIOWFnOW6lei3r+eUsSAqL31cbiAgICAgIDxSb3V0ZSBwYXRoPVwiKlwiIGVsZW1lbnQ9ezxOYXZpZ2F0ZSB0bz1cIi9kYXNoYm9hcmRcIiByZXBsYWNlIC8+fSAvPlxuICAgIDwvUm91dGVzPlxuICApO1xufVxuXG4vKipcbiAqIOi3r+eUsee6p+mUmeivr+WbnumAgFxuICpcbiAqIOS4jiBSb290RXJyb3JCb3VuZGFyeSDkuI3lkIzvvIzov5nkuKrnu4Tku7blnKggUmVhY3QgUm91dGVyIOeahCBlcnJvckVsZW1lbnQg5py65Yi25LiL5bel5L2c77yMXG4gKiDlj6rmm7/ku6Plh7rplJnot6/nlLHnmoQgb3V0bGV077yMQXBwTGF5b3V0IOeahOS+p+i+ueagjy/lpLTpg6jku43kv53mjIHlj6/nlKjvvIznlKjmiLflj6/liIfmjaLlhbbku5boj5zljZXnu6fnu63mk43kvZzjgIJcbiAqIOS9v+eUqCB1c2VSb3V0ZUVycm9yIOiOt+WPlumUmeivr+ivpuaDhe+8iFJlYWN0IFJvdXRlciB2N++8ieOAglxuICovXG5mdW5jdGlvbiBSb3V0ZUVycm9yRmFsbGJhY2soKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGgtZnVsbCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTQgcC04IHRleHQtY2VudGVyXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LXNlbWlib2xkXCI+5q2k6aG16Z2i5Y+R55Sf6ZSZ6K+vPC9oMj5cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7or7flsJ3or5XliLfmlrDpobXpnaLvvIzmiJbku47lt6bkvqfoj5zljZXliIfmjaLliLDlhbbku5blip/og73jgII8L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKX1cbiAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHJvdW5kZWQtbWQgYmctcHJpbWFyeSBweC00IHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCB0cmFuc2l0aW9uLWNvbG9ycyBob3ZlcjpiZy1wcmltYXJ5LzkwXCJcbiAgICAgID5cbiAgICAgICAg6YeN5paw5Yqg6L29XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLyoqXG4gKiDlupTnlKjmoLnnu4Tku7ZcbiAqXG4gKiDpobblsYIgUHJvdmlkZXIg5L6d5qyh5Li677yaXG4gKiAxLiBRdWVyeUNsaWVudFByb3ZpZGVyIOKAlCBUYW5TdGFjayBRdWVyeSDmlbDmja7or7fmsYJcbiAqIDIuIEJyb3dzZXJSb3V0ZXIg4oCUIOi3r+eUsVxuICogMy4gTm90aWZpY2F0aW9uVG9hc3Qg4oCUIOWFqOWxgOmAmuefpea1ruWxglxuICogNC4gSW5zdGFsbFByb21wdCDigJQgUFdBIOWuieijheaPkOekuu+8iOS7heWcqOWPr+WuieijheaXtuaYvuekuu+8iVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoKSB7XG4gIHJldHVybiAoXG4gICAgPFJvb3RFcnJvckJvdW5kYXJ5PlxuICAgICAgPFF1ZXJ5Q2xpZW50UHJvdmlkZXIgY2xpZW50PXtxdWVyeUNsaWVudH0+XG4gICAgICAgIDxCcm93c2VyUm91dGVyPlxuICAgICAgICAgIDxBcHBSb3V0ZXMgLz5cbiAgICAgICAgICA8Tm90aWZpY2F0aW9uVG9hc3QgLz5cbiAgICAgICAgICA8SW5zdGFsbFByb21wdCAvPlxuICAgICAgICAgIDxPZmZsaW5lSW5kaWNhdG9yIC8+XG4gICAgICAgIDwvQnJvd3NlclJvdXRlcj5cbiAgICAgIDwvUXVlcnlDbGllbnRQcm92aWRlcj5cbiAgICA8L1Jvb3RFcnJvckJvdW5kYXJ5PlxuICApO1xufVxuIl19