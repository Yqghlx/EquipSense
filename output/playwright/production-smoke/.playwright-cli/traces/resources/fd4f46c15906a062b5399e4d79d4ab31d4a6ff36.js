import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/DashboardPage.tsx");const _jsxDEV = __vite__cjsImport12_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { Card, CardContent } from "/src/components/ui/card.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { TrendChart } from "/src/components/charts/TrendChart.tsx";
import { PieChart } from "/src/components/charts/PieChart.tsx";
import { SeverityBadge } from "/src/components/alert/SeverityBadge.tsx";
import { useDashboardStats, useOee } from "/src/hooks/useDashboard.ts";
import { useAlerts } from "/src/hooks/useAlerts.ts";
import { useGlobalStats } from "/src/hooks/useTenantsAdmin.ts";
import { useAuthStore } from "/src/stores/authStore.ts";
import { Wrench, AlertTriangle, ClipboardList, Activity, Building2, Users, Snowflake } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DashboardPage.tsx";
import __vite__cjsImport12_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 告警严重级别对应的颜色映射 */
const severityColors = {
	Critical: "#ef4444",
	High: "#f97316",
	Normal: "#eab308",
	Low: "#6b7280"
};
/** 工单状态对应的中文标签 */
const workOrderStatusLabels = {
	PendingDispatch: "待派工",
	Assigned: "已派工",
	InProgress: "执行中",
	Completed: "已完成",
	SubmittedForApproval: "待审批",
	Accepted: "已验收",
	Rejected: "已驳回",
	Closed: "已关闭",
	Cancelled: "已取消"
};
/** 工单状态对应的 Badge 变体颜色 */
const workOrderStatusVariant = {
	PendingDispatch: "bg-yellow-500/10 text-yellow-600",
	Assigned: "bg-blue-500/10 text-blue-600",
	InProgress: "bg-indigo-500/10 text-indigo-600",
	Completed: "bg-green-500/10 text-green-600",
	SubmittedForApproval: "bg-purple-500/10 text-purple-600",
	Accepted: "bg-emerald-500/10 text-emerald-600",
	Rejected: "bg-red-500/10 text-red-600",
	Closed: "bg-gray-500/10 text-gray-600",
	Cancelled: "bg-gray-500/10 text-gray-500"
};
/**
* 仪表盘页
*
* 展示系统概览：设备可用率、告警/工单趋势、告警级别分布、工单状态分布。
* 统计卡片可点击跳转到对应的管理页面。
*/
export default function DashboardPage() {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);
	const isSystemAdmin = user?.role === "SystemAdmin";
	const { data: stats, isLoading: statsLoading } = useDashboardStats();
	const { data: oee } = useOee();
	const { data: alertsData } = useAlerts({
		page: 1,
		pageSize: 10
	}, { status: "active" });
	const { data: globalStats } = useGlobalStats({ enabled: isSystemAdmin });
	/** 统计卡片配置（可点击跳转） */
	const statCards = [
		{
			label: t("device.online"),
			value: stats?.onlineDevices ?? "-",
			icon: Wrench,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
			link: "/devices"
		},
		{
			label: t("alert.active"),
			value: stats?.activeAlerts ?? "-",
			icon: AlertTriangle,
			color: "text-red-500",
			bg: "bg-red-500/10",
			link: "/alerts"
		},
		{
			label: t("dashboard.pendingWorkOrders"),
			value: stats?.pendingWorkOrders ?? "-",
			icon: ClipboardList,
			color: "text-yellow-500",
			bg: "bg-yellow-500/10",
			link: "/work-orders"
		},
		{
			label: t("dashboard.deviceAvailability"),
			value: stats != null ? `${stats.availability}%` : "-",
			icon: Activity,
			color: "text-green-500",
			bg: "bg-green-500/10",
			link: "/devices"
		}
	];
	/** 设备状态分布饼图数据 */
	const devicePieData = stats ? [{
		name: t("device.online"),
		value: stats.onlineDevices,
		color: "#3b82f6"
	}, {
		name: t("device.offline"),
		value: Math.max(0, stats.totalDevices - stats.onlineDevices),
		color: "#6b7280"
	}] : [];
	/** 告警级别分布饼图数据 */
	const severityPieData = stats ? Object.entries(stats.alertsBySeverity).map(([severity, count]) => ({
		name: severity,
		value: count,
		color: severityColors[severity] ?? "#6b7280"
	})) : [];
	/** 告警趋势折线图数据 */
	const alertTrendData = (stats?.alertTrend ?? []).map((p) => ({
		time: p.date,
		value: p.count
	}));
	/** 工单趋势折线图数据 */
	const workOrderTrendData = (stats?.workOrderTrend ?? []).map((p) => ({
		time: p.date,
		value: p.count
	}));
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ _jsxDEV("h1", {
				className: "text-2xl font-bold",
				children: t("nav.dashboard")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 106,
				columnNumber: 7
			}, this),
			isSystemAdmin && globalStats && /* @__PURE__ */ _jsxDEV(Card, {
				className: "border-primary/20 bg-primary/5",
				children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: [/* @__PURE__ */ _jsxDEV("h3", {
						className: "mb-3 text-sm font-semibold text-primary",
						children: t("admin.globalStats.title")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 112,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4 md:grid-cols-6",
						children: [
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Building2, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 114,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.totalTenants"),
								value: String(globalStats.totalTenants)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 114,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Building2, { className: "h-4 w-4 text-green-500" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 115,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.activeTenants"),
								value: String(globalStats.activeTenants)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 115,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Building2, { className: "h-4 w-4 text-blue-500" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 116,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.trialTenants"),
								value: String(globalStats.trialTenants)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 116,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Snowflake, { className: "h-4 w-4 text-red-500" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 117,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.frozenTenants"),
								value: String(globalStats.frozenTenants)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 117,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Wrench, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 118,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.totalDevices"),
								value: String(globalStats.totalDevices)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 118,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(GlobalStatItem, {
								icon: /* @__PURE__ */ _jsxDEV(Users, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 119,
									columnNumber: 37
								}, this),
								label: t("admin.globalStats.totalUsers"),
								value: String(globalStats.totalUsers)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 119,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 113,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 111,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 110,
				columnNumber: 9
			}, this),
			stats && !statsLoading && stats.totalDevices === 0 && stats.activeAlerts === 0 && stats.pendingWorkOrders === 0 && /* @__PURE__ */ _jsxDEV(Card, {
				className: "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10",
				children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-6",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-start gap-3 mb-4",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "rounded-lg bg-primary/15 p-2",
							children: /* @__PURE__ */ _jsxDEV(Wrench, { className: "h-5 w-5 text-primary" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 132,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 131,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h3", {
							className: "text-lg font-semibold",
							children: t("dashboard.welcome.title", "欢迎使用 EquipSense")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 135,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: t("dashboard.welcome.subtitle", "完成以下三步，开启工业设备智能监控之旅")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 138,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 134,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 130,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-3 md:grid-cols-3",
						children: [
							/* @__PURE__ */ _jsxDEV("button", {
								onClick: () => navigate("/devices"),
								className: "flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs font-medium text-primary",
										children: "1"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 148,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm font-medium",
										children: t("dashboard.welcome.step1.title", "添加设备")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 149,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs text-muted-foreground",
										children: t("dashboard.welcome.step1.desc", "注册 PLC、CNC、空压机等工业设备")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 152,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 144,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("button", {
								onClick: () => navigate("/alert-rules"),
								className: "flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs font-medium text-primary",
										children: "2"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 160,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm font-medium",
										children: t("dashboard.welcome.step2.title", "配置告警规则")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 161,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs text-muted-foreground",
										children: t("dashboard.welcome.step2.desc", "设置阈值、组合、基线三级告警")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 164,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 156,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("button", {
								onClick: () => navigate("/device-setup"),
								className: "flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs font-medium text-primary",
										children: "3"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 172,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm font-medium",
										children: t("dashboard.welcome.step3.title", "接入遥测数据")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 173,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs text-muted-foreground",
										children: t("dashboard.welcome.step3.desc", "通过 MQTT 或边缘网关接入实时数据")
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 176,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 168,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 143,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 129,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 128,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid gap-4 md:grid-cols-4",
				children: statCards.map(({ label, value, icon: Icon, color, bg, link }) => /* @__PURE__ */ _jsxDEV(Card, {
					className: "cursor-pointer transition-colors hover:bg-muted/50",
					onClick: () => navigate(link),
					children: /* @__PURE__ */ _jsxDEV(CardContent, {
						className: "flex items-center gap-4 p-4",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: `rounded-lg p-3 ${bg}`,
							children: /* @__PURE__ */ _jsxDEV(Icon, { className: `h-5 w-5 ${color}` }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 195,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 194,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-2xl font-bold",
							children: statsLoading ? "..." : value
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 198,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: label
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 199,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 197,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 193,
						columnNumber: 13
					}, this)
				}, label, false, {
					fileName: _jsxFileName,
					lineNumber: 188,
					columnNumber: 11
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 186,
				columnNumber: 7
			}, this),
			oee && /* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
				className: "p-4",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center justify-between mb-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ _jsxDEV("h3", {
								className: "text-base font-semibold",
								children: t("dashboard.oee.title", "设备综合效率 (OEE)")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 212,
								columnNumber: 17
							}, this),
							oee.isApproximate && /* @__PURE__ */ _jsxDEV(Badge, {
								variant: "outline",
								className: "text-amber-600 border-amber-300 bg-amber-50",
								title: oee.approximationNotes ? Object.entries(oee.approximationNotes).map(([k, v]) => `${k}: ${v}`).join("\n") : t("dashboard.oee.approximateHint", "基于实时状态的近似估算"),
								children: t("dashboard.oee.approximate", "近似估算")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 214,
								columnNumber: 19
							}, this),
							oee.hasInsufficientData && /* @__PURE__ */ _jsxDEV(Badge, {
								variant: "outline",
								className: "text-orange-600 border-orange-300 bg-orange-50",
								children: t("dashboard.oee.insufficientData", "数据不足")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 223,
								columnNumber: 19
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 211,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "text-xs text-muted-foreground",
						children: t("dashboard.oee.formula", "OEE = 可用率 × 性能 × 质量")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 228,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 210,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "grid gap-4 md:grid-cols-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex flex-col items-center justify-center rounded-lg border bg-primary/5 p-4",
							children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground mb-1",
								children: t("dashboard.oee.overall", "综合 OEE")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 235,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: `text-3xl font-bold ${oee.oee >= 85 ? "text-green-600" : oee.oee >= 60 ? "text-yellow-600" : "text-red-600"}`,
								children: [oee.oee, "%"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 236,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 234,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(OeeDimension, {
							label: t("dashboard.oee.availability", "可用率"),
							value: oee.availability,
							hint: t("dashboard.oee.availabilityHint", "{{online}}/{{total}} 在线", {
								online: oee.onlineDevices,
								total: oee.totalDevices
							})
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 241,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(OeeDimension, {
							label: t("dashboard.oee.performance", "性能"),
							value: oee.performance,
							hint: t("dashboard.oee.performanceHint", "产能达标率")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 247,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(OeeDimension, {
							label: t("dashboard.oee.quality", "质量"),
							value: oee.quality,
							hint: t("dashboard.oee.qualityHint", "无严重故障占比")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 253,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 232,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 209,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 208,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: /* @__PURE__ */ _jsxDEV(PieChart, {
						title: t("dashboard.deviceStatusDistribution"),
						data: devicePieData,
						height: 280
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 267,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 266,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 265,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: /* @__PURE__ */ _jsxDEV(PieChart, {
						title: t("dashboard.alertSeverityDistribution"),
						data: severityPieData,
						height: 280
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 272,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 271,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 270,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 264,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: /* @__PURE__ */ _jsxDEV(TrendChart, {
						title: t("dashboard.alertTrends"),
						data: alertTrendData,
						color: "#ef4444",
						height: 280
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 281,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 280,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 279,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: /* @__PURE__ */ _jsxDEV(TrendChart, {
						title: t("dashboard.workOrderTrend"),
						data: workOrderTrendData,
						color: "#3b82f6",
						height: 280
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 286,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 285,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 284,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 278,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: [/* @__PURE__ */ _jsxDEV("h3", {
						className: "mb-3 text-base font-semibold",
						children: t("dashboard.workOrderStatusDistribution")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 296,
						columnNumber: 13
					}, this), stats && Object.keys(stats.workOrdersByStatus).length > 0 ? /* @__PURE__ */ _jsxDEV("div", {
						className: "grid grid-cols-3 gap-3",
						children: Object.entries(stats.workOrdersByStatus).map(([status, count]) => /* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center justify-between rounded-md border p-2.5",
							children: [/* @__PURE__ */ _jsxDEV(Badge, {
								className: workOrderStatusVariant[status] ?? "bg-gray-500/10 text-gray-600",
								children: workOrderStatusLabels[status] ?? status
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 301,
								columnNumber: 21
							}, this), /* @__PURE__ */ _jsxDEV("span", {
								className: "text-lg font-bold",
								children: count
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 304,
								columnNumber: 21
							}, this)]
						}, status, true, {
							fileName: _jsxFileName,
							lineNumber: 300,
							columnNumber: 19
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 298,
						columnNumber: 15
					}, this) : /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("common.noData")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 309,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 295,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 294,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "p-4",
					children: [/* @__PURE__ */ _jsxDEV("h3", {
						className: "mb-3 text-base font-semibold",
						children: t("dashboard.recentAlerts")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 317,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: alertsData?.items.length === 0 ? /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("common.noData")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 320,
							columnNumber: 17
						}, this) : alertsData?.items.slice(0, 10).map((alert) => /* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center justify-between rounded-md border border-border p-3",
							children: [/* @__PURE__ */ _jsxDEV("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ _jsxDEV(SeverityBadge, { severity: alert.severity }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 325,
									columnNumber: 23
								}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
									className: "text-sm font-medium",
									children: [
										alert.deviceId.slice(0, 8),
										"… — ",
										alert.metric
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 327,
									columnNumber: 25
								}, this), /* @__PURE__ */ _jsxDEV("p", {
									className: "text-xs text-muted-foreground",
									children: new Date(alert.occurredAt).toLocaleString()
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 328,
									columnNumber: 25
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 326,
									columnNumber: 23
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 324,
								columnNumber: 21
							}, this), /* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm text-muted-foreground",
								children: alert.value
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 331,
								columnNumber: 21
							}, this)]
						}, alert.id, true, {
							fileName: _jsxFileName,
							lineNumber: 323,
							columnNumber: 19
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 318,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 316,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 315,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 292,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 105,
		columnNumber: 5
	}, this);
}
_s(DashboardPage, "69kLaEiI74Er6G3i3X/zcmY3LeY=", false, function() {
	return [
		useTranslation,
		useNavigate,
		useAuthStore,
		useDashboardStats,
		useOee,
		useAlerts,
		useGlobalStats
	];
});
_c = DashboardPage;
/** 全局统计项组件 — 用于 system_admin 仪表盘顶部的统计数据展示 */
function GlobalStatItem({ icon, label, value }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex items-center gap-2",
		children: [icon, /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
			className: "text-lg font-bold",
			children: value
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 349,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 350,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 348,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 346,
		columnNumber: 5
	}, this);
}
_c2 = GlobalStatItem;
/** OEE 单维度展示（数值 + 进度条），复用项目内联进度条风格 */
function OeeDimension({ label, value, hint }) {
	const color = value >= 85 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500";
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "rounded-lg border p-4",
		children: [
			/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm font-medium mb-1",
				children: label
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 361,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "text-2xl font-bold mb-2",
				children: [value, "%"]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 362,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "h-2 w-full rounded-full bg-muted overflow-hidden mb-1",
				children: /* @__PURE__ */ _jsxDEV("div", {
					className: `h-full transition-all ${color}`,
					style: { width: `${Math.min(100, Math.max(0, value))}%` }
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 364,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 363,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "text-xs text-muted-foreground",
				children: hint
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 366,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 360,
		columnNumber: 5
	}, this);
}
_c3 = OeeDimension;
var _c, _c2, _c3;
$RefreshReg$(_c, "DashboardPage");
$RefreshReg$(_c2, "GlobalStatItem");
$RefreshReg$(_c3, "OeeDimension");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/DashboardPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DashboardPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DashboardPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DashboardPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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O1FBQU0sV0FBVTtrQkFBaUMsTUFBTTtPQUFZOzs7O2VBQ2hFO1NBVEssTUFBTTs7OzthQVNYLENBQ047S0FFQTs7OzthQUNNOzs7OzthQUNUOzs7O1lBQ0g7Ozs7OztFQUNGOzs7Ozs7QUFFVDs7Ozs7Ozs7Ozs7Ozs7QUFHQSxTQUFTLGVBQWUsRUFBRSxNQUFNLE9BQU8sU0FBa0U7Q0FDdkcsT0FDRSx3QkFBQyxPQUFEO0VBQUssV0FBVTtZQUFmLENBQ0csTUFDRCx3QkFBQyxPQUFELGFBQ0Usd0JBQUMsS0FBRDtHQUFHLFdBQVU7YUFBcUI7RUFBUzs7OztZQUMzQyx3QkFBQyxLQUFEO0dBQUcsV0FBVTthQUFpQztFQUFTOzs7O1VBQ3BEOzs7O1VBQ0Y7Ozs7OztBQUVUOzs7QUFHQSxTQUFTLGFBQWEsRUFBRSxPQUFPLE9BQU8sUUFBd0Q7Q0FDNUYsTUFBTSxRQUFRLFNBQVMsS0FBSyxpQkFBaUIsU0FBUyxLQUFLLGtCQUFrQjtDQUM3RSxPQUNFLHdCQUFDLE9BQUQ7RUFBSyxXQUFVO1lBQWY7R0FDRSx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUE0QjtHQUFTOzs7OztHQUNsRCx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFiLENBQXdDLE9BQU0sR0FBSTs7Ozs7O0dBQ2xELHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQ2Isd0JBQUMsT0FBRDtLQUFLLFdBQVcseUJBQXlCO0tBQVMsT0FBTyxFQUFFLE9BQU8sR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxHQUFHO0lBQUk7Ozs7O0dBQzNHOzs7OztHQUNMLHdCQUFDLEtBQUQ7SUFBRyxXQUFVO2NBQWlDO0dBQVE7Ozs7O0VBQ25EOzs7Ozs7QUFFVCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJEYXNoYm9hcmRQYWdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9jYXJkJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9iYWRnZSc7XG5pbXBvcnQgeyBUcmVuZENoYXJ0IH0gZnJvbSAnLi4vY29tcG9uZW50cy9jaGFydHMvVHJlbmRDaGFydCc7XG5pbXBvcnQgeyBQaWVDaGFydCB9IGZyb20gJy4uL2NvbXBvbmVudHMvY2hhcnRzL1BpZUNoYXJ0JztcbmltcG9ydCB7IFNldmVyaXR5QmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL2FsZXJ0L1NldmVyaXR5QmFkZ2UnO1xuaW1wb3J0IHsgdXNlRGFzaGJvYXJkU3RhdHMsIHVzZU9lZSB9IGZyb20gJy4uL2hvb2tzL3VzZURhc2hib2FyZCc7XG5pbXBvcnQgeyB1c2VBbGVydHMgfSBmcm9tICcuLi9ob29rcy91c2VBbGVydHMnO1xuaW1wb3J0IHsgdXNlR2xvYmFsU3RhdHMgfSBmcm9tICcuLi9ob29rcy91c2VUZW5hbnRzQWRtaW4nO1xuaW1wb3J0IHsgdXNlQXV0aFN0b3JlIH0gZnJvbSAnLi4vc3RvcmVzL2F1dGhTdG9yZSc7XG5pbXBvcnQge1xuICBXcmVuY2gsIEFsZXJ0VHJpYW5nbGUsIENsaXBib2FyZExpc3QsIEFjdGl2aXR5LFxuICBCdWlsZGluZzIsIFVzZXJzLCBTbm93Zmxha2UsXG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG4vKiog5ZGK6K2m5Lil6YeN57qn5Yir5a+55bqU55qE6aKc6Imy5pig5bCEICovXG5jb25zdCBzZXZlcml0eUNvbG9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgQ3JpdGljYWw6ICcjZWY0NDQ0JyxcbiAgSGlnaDogJyNmOTczMTYnLFxuICBOb3JtYWw6ICcjZWFiMzA4JyxcbiAgTG93OiAnIzZiNzI4MCcsXG59O1xuXG4vKiog5bel5Y2V54q25oCB5a+55bqU55qE5Lit5paH5qCH562+ICovXG5jb25zdCB3b3JrT3JkZXJTdGF0dXNMYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFBlbmRpbmdEaXNwYXRjaDogJ+W+hea0vuW3pScsXG4gIEFzc2lnbmVkOiAn5bey5rS+5belJyxcbiAgSW5Qcm9ncmVzczogJ+aJp+ihjOS4rScsXG4gIENvbXBsZXRlZDogJ+W3suWujOaIkCcsXG4gIFN1Ym1pdHRlZEZvckFwcHJvdmFsOiAn5b6F5a6h5om5JyxcbiAgQWNjZXB0ZWQ6ICflt7LpqozmlLYnLFxuICBSZWplY3RlZDogJ+W3sumps+WbnicsXG4gIENsb3NlZDogJ+W3suWFs+mXrScsXG4gIENhbmNlbGxlZDogJ+W3suWPlua2iCcsXG59O1xuXG4vKiog5bel5Y2V54q25oCB5a+55bqU55qEIEJhZGdlIOWPmOS9k+minOiJsiAqL1xuY29uc3Qgd29ya09yZGVyU3RhdHVzVmFyaWFudDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgUGVuZGluZ0Rpc3BhdGNoOiAnYmcteWVsbG93LTUwMC8xMCB0ZXh0LXllbGxvdy02MDAnLFxuICBBc3NpZ25lZDogJ2JnLWJsdWUtNTAwLzEwIHRleHQtYmx1ZS02MDAnLFxuICBJblByb2dyZXNzOiAnYmctaW5kaWdvLTUwMC8xMCB0ZXh0LWluZGlnby02MDAnLFxuICBDb21wbGV0ZWQ6ICdiZy1ncmVlbi01MDAvMTAgdGV4dC1ncmVlbi02MDAnLFxuICBTdWJtaXR0ZWRGb3JBcHByb3ZhbDogJ2JnLXB1cnBsZS01MDAvMTAgdGV4dC1wdXJwbGUtNjAwJyxcbiAgQWNjZXB0ZWQ6ICdiZy1lbWVyYWxkLTUwMC8xMCB0ZXh0LWVtZXJhbGQtNjAwJyxcbiAgUmVqZWN0ZWQ6ICdiZy1yZWQtNTAwLzEwIHRleHQtcmVkLTYwMCcsXG4gIENsb3NlZDogJ2JnLWdyYXktNTAwLzEwIHRleHQtZ3JheS02MDAnLFxuICBDYW5jZWxsZWQ6ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNTAwJyxcbn07XG5cbi8qKlxuICog5Luq6KGo55uY6aG1XG4gKlxuICog5bGV56S657O757uf5qaC6KeI77ya6K6+5aSH5Y+v55So546H44CB5ZGK6K2mL+W3peWNlei2i+WKv+OAgeWRiuitpue6p+WIq+WIhuW4g+OAgeW3peWNleeKtuaAgeWIhuW4g+OAglxuICog57uf6K6h5Y2h54mH5Y+v54K55Ye76Lez6L2s5Yiw5a+55bqU55qE566h55CG6aG16Z2i44CCXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERhc2hib2FyZFBhZ2UoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xuICBjb25zdCB1c2VyID0gdXNlQXV0aFN0b3JlKChzKSA9PiBzLnVzZXIpO1xuICBjb25zdCBpc1N5c3RlbUFkbWluID0gdXNlcj8ucm9sZSA9PT0gJ1N5c3RlbUFkbWluJztcblxuICBjb25zdCB7IGRhdGE6IHN0YXRzLCBpc0xvYWRpbmc6IHN0YXRzTG9hZGluZyB9ID0gdXNlRGFzaGJvYXJkU3RhdHMoKTtcbiAgY29uc3QgeyBkYXRhOiBvZWUgfSA9IHVzZU9lZSgpO1xuICBjb25zdCB7IGRhdGE6IGFsZXJ0c0RhdGEgfSA9IHVzZUFsZXJ0cyh7IHBhZ2U6IDEsIHBhZ2VTaXplOiAxMCB9LCB7IHN0YXR1czogJ2FjdGl2ZScgfSk7XG4gIGNvbnN0IHsgZGF0YTogZ2xvYmFsU3RhdHMgfSA9IHVzZUdsb2JhbFN0YXRzKHsgZW5hYmxlZDogaXNTeXN0ZW1BZG1pbiB9KTtcblxuICAvKiog57uf6K6h5Y2h54mH6YWN572u77yI5Y+v54K55Ye76Lez6L2s77yJICovXG4gIGNvbnN0IHN0YXRDYXJkcyA9IFtcbiAgICB7IGxhYmVsOiB0KCdkZXZpY2Uub25saW5lJyksIHZhbHVlOiBzdGF0cz8ub25saW5lRGV2aWNlcyA/PyAnLScsIGljb246IFdyZW5jaCwgY29sb3I6ICd0ZXh0LWJsdWUtNTAwJywgYmc6ICdiZy1ibHVlLTUwMC8xMCcsIGxpbms6ICcvZGV2aWNlcycgfSxcbiAgICB7IGxhYmVsOiB0KCdhbGVydC5hY3RpdmUnKSwgdmFsdWU6IHN0YXRzPy5hY3RpdmVBbGVydHMgPz8gJy0nLCBpY29uOiBBbGVydFRyaWFuZ2xlLCBjb2xvcjogJ3RleHQtcmVkLTUwMCcsIGJnOiAnYmctcmVkLTUwMC8xMCcsIGxpbms6ICcvYWxlcnRzJyB9LFxuICAgIHsgbGFiZWw6IHQoJ2Rhc2hib2FyZC5wZW5kaW5nV29ya09yZGVycycpLCB2YWx1ZTogc3RhdHM/LnBlbmRpbmdXb3JrT3JkZXJzID8/ICctJywgaWNvbjogQ2xpcGJvYXJkTGlzdCwgY29sb3I6ICd0ZXh0LXllbGxvdy01MDAnLCBiZzogJ2JnLXllbGxvdy01MDAvMTAnLCBsaW5rOiAnL3dvcmstb3JkZXJzJyB9LFxuICAgIHsgbGFiZWw6IHQoJ2Rhc2hib2FyZC5kZXZpY2VBdmFpbGFiaWxpdHknKSwgdmFsdWU6IHN0YXRzICE9IG51bGwgPyBgJHtzdGF0cy5hdmFpbGFiaWxpdHl9JWAgOiAnLScsIGljb246IEFjdGl2aXR5LCBjb2xvcjogJ3RleHQtZ3JlZW4tNTAwJywgYmc6ICdiZy1ncmVlbi01MDAvMTAnLCBsaW5rOiAnL2RldmljZXMnIH0sXG4gIF07XG5cbiAgLyoqIOiuvuWkh+eKtuaAgeWIhuW4g+mlvOWbvuaVsOaNriAqL1xuICBjb25zdCBkZXZpY2VQaWVEYXRhID0gc3RhdHNcbiAgICA/IFtcbiAgICAgICAgeyBuYW1lOiB0KCdkZXZpY2Uub25saW5lJyksIHZhbHVlOiBzdGF0cy5vbmxpbmVEZXZpY2VzLCBjb2xvcjogJyMzYjgyZjYnIH0sXG4gICAgICAgIHsgbmFtZTogdCgnZGV2aWNlLm9mZmxpbmUnKSwgdmFsdWU6IE1hdGgubWF4KDAsIHN0YXRzLnRvdGFsRGV2aWNlcyAtIHN0YXRzLm9ubGluZURldmljZXMpLCBjb2xvcjogJyM2YjcyODAnIH0sXG4gICAgICBdXG4gICAgOiBbXTtcblxuICAvKiog5ZGK6K2m57qn5Yir5YiG5biD6aW85Zu+5pWw5o2uICovXG4gIGNvbnN0IHNldmVyaXR5UGllRGF0YSA9IHN0YXRzXG4gICAgPyBPYmplY3QuZW50cmllcyhzdGF0cy5hbGVydHNCeVNldmVyaXR5KS5tYXAoKFtzZXZlcml0eSwgY291bnRdKSA9PiAoe1xuICAgICAgICBuYW1lOiBzZXZlcml0eSxcbiAgICAgICAgdmFsdWU6IGNvdW50LFxuICAgICAgICBjb2xvcjogc2V2ZXJpdHlDb2xvcnNbc2V2ZXJpdHldID8/ICcjNmI3MjgwJyxcbiAgICAgIH0pKVxuICAgIDogW107XG5cbiAgLyoqIOWRiuitpui2i+WKv+aKmOe6v+WbvuaVsOaNriAqL1xuICBjb25zdCBhbGVydFRyZW5kRGF0YSA9IChzdGF0cz8uYWxlcnRUcmVuZCA/PyBbXSkubWFwKChwKSA9PiAoe1xuICAgIHRpbWU6IHAuZGF0ZSxcbiAgICB2YWx1ZTogcC5jb3VudCxcbiAgfSkpO1xuXG4gIC8qKiDlt6XljZXotovlir/mipjnur/lm77mlbDmja4gKi9cbiAgY29uc3Qgd29ya09yZGVyVHJlbmREYXRhID0gKHN0YXRzPy53b3JrT3JkZXJUcmVuZCA/PyBbXSkubWFwKChwKSA9PiAoe1xuICAgIHRpbWU6IHAuZGF0ZSxcbiAgICB2YWx1ZTogcC5jb3VudCxcbiAgfSkpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTZcIj5cbiAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57dCgnbmF2LmRhc2hib2FyZCcpfTwvaDE+XG5cbiAgICAgIHsvKiBzeXN0ZW1fYWRtaW4g5YWo5bGA57uf6K6h5Y2h54mHICovfVxuICAgICAge2lzU3lzdGVtQWRtaW4gJiYgZ2xvYmFsU3RhdHMgJiYgKFxuICAgICAgICA8Q2FyZCBjbGFzc05hbWU9XCJib3JkZXItcHJpbWFyeS8yMCBiZy1wcmltYXJ5LzVcIj5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwibWItMyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1wcmltYXJ5XCI+e3QoJ2FkbWluLmdsb2JhbFN0YXRzLnRpdGxlJyl9PC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBtZDpncmlkLWNvbHMtNlwiPlxuICAgICAgICAgICAgICA8R2xvYmFsU3RhdEl0ZW0gaWNvbj17PEJ1aWxkaW5nMiBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz59IGxhYmVsPXt0KCdhZG1pbi5nbG9iYWxTdGF0cy50b3RhbFRlbmFudHMnKX0gdmFsdWU9e1N0cmluZyhnbG9iYWxTdGF0cy50b3RhbFRlbmFudHMpfSAvPlxuICAgICAgICAgICAgICA8R2xvYmFsU3RhdEl0ZW0gaWNvbj17PEJ1aWxkaW5nMiBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQtZ3JlZW4tNTAwXCIgLz59IGxhYmVsPXt0KCdhZG1pbi5nbG9iYWxTdGF0cy5hY3RpdmVUZW5hbnRzJyl9IHZhbHVlPXtTdHJpbmcoZ2xvYmFsU3RhdHMuYWN0aXZlVGVuYW50cyl9IC8+XG4gICAgICAgICAgICAgIDxHbG9iYWxTdGF0SXRlbSBpY29uPXs8QnVpbGRpbmcyIGNsYXNzTmFtZT1cImgtNCB3LTQgdGV4dC1ibHVlLTUwMFwiIC8+fSBsYWJlbD17dCgnYWRtaW4uZ2xvYmFsU3RhdHMudHJpYWxUZW5hbnRzJyl9IHZhbHVlPXtTdHJpbmcoZ2xvYmFsU3RhdHMudHJpYWxUZW5hbnRzKX0gLz5cbiAgICAgICAgICAgICAgPEdsb2JhbFN0YXRJdGVtIGljb249ezxTbm93Zmxha2UgY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LXJlZC01MDBcIiAvPn0gbGFiZWw9e3QoJ2FkbWluLmdsb2JhbFN0YXRzLmZyb3plblRlbmFudHMnKX0gdmFsdWU9e1N0cmluZyhnbG9iYWxTdGF0cy5mcm96ZW5UZW5hbnRzKX0gLz5cbiAgICAgICAgICAgICAgPEdsb2JhbFN0YXRJdGVtIGljb249ezxXcmVuY2ggY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+fSBsYWJlbD17dCgnYWRtaW4uZ2xvYmFsU3RhdHMudG90YWxEZXZpY2VzJyl9IHZhbHVlPXtTdHJpbmcoZ2xvYmFsU3RhdHMudG90YWxEZXZpY2VzKX0gLz5cbiAgICAgICAgICAgICAgPEdsb2JhbFN0YXRJdGVtIGljb249ezxVc2VycyBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz59IGxhYmVsPXt0KCdhZG1pbi5nbG9iYWxTdGF0cy50b3RhbFVzZXJzJyl9IHZhbHVlPXtTdHJpbmcoZ2xvYmFsU3RhdHMudG90YWxVc2Vycyl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuXG4gICAgICB7Lyog5paw5a6i5oi35byV5a+877ya6K6+5aSHL+WRiuitpi/lt6XljZXlhajkuLogMCDml7bmmL7npLrlv6vpgJ/lvIDlp4vljaHniYcgKi99XG4gICAgICB7c3RhdHMgJiYgIXN0YXRzTG9hZGluZyAmJiBzdGF0cy50b3RhbERldmljZXMgPT09IDBcbiAgICAgICAgJiYgc3RhdHMuYWN0aXZlQWxlcnRzID09PSAwICYmIHN0YXRzLnBlbmRpbmdXb3JrT3JkZXJzID09PSAwICYmIChcbiAgICAgICAgPENhcmQgY2xhc3NOYW1lPVwiYm9yZGVyLXByaW1hcnkvMzAgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1wcmltYXJ5LzUgdG8tcHJpbWFyeS8xMFwiPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJwLTZcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMyBtYi00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1sZyBiZy1wcmltYXJ5LzE1IHAtMlwiPlxuICAgICAgICAgICAgICAgIDxXcmVuY2ggY2xhc3NOYW1lPVwiaC01IHctNSB0ZXh0LXByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICAgICAgICB7dCgnZGFzaGJvYXJkLndlbGNvbWUudGl0bGUnLCAn5qyi6L+O5L2/55SoIEVxdWlwU2Vuc2UnKX1cbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQud2VsY29tZS5zdWJ0aXRsZScsICflrozmiJDku6XkuIvkuInmraXvvIzlvIDlkK/lt6XkuJrorr7lpIfmmbrog73nm5HmjqfkuYvml4UnKX1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTMgbWQ6Z3JpZC1jb2xzLTNcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlKCcvZGV2aWNlcycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtc3RhcnQgZ2FwLTEgcm91bmRlZC1sZyBib3JkZXIgYmctYmFja2dyb3VuZCBwLTQgdGV4dC1sZWZ0IHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJvcmRlci1wcmltYXJ5IGhvdmVyOmJnLWFjY2VudFwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtcHJpbWFyeVwiPjE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAge3QoJ2Rhc2hib2FyZC53ZWxjb21lLnN0ZXAxLnRpdGxlJywgJ+a3u+WKoOiuvuWkhycpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAge3QoJ2Rhc2hib2FyZC53ZWxjb21lLnN0ZXAxLmRlc2MnLCAn5rOo5YaMIFBMQ+OAgUNOQ+OAgeepuuWOi+acuuetieW3peS4muiuvuWkhycpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0ZSgnL2FsZXJ0LXJ1bGVzJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1zdGFydCBnYXAtMSByb3VuZGVkLWxnIGJvcmRlciBiZy1iYWNrZ3JvdW5kIHAtNCB0ZXh0LWxlZnQgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6Ym9yZGVyLXByaW1hcnkgaG92ZXI6YmctYWNjZW50XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1wcmltYXJ5XCI+Mjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAgICB7dCgnZGFzaGJvYXJkLndlbGNvbWUuc3RlcDIudGl0bGUnLCAn6YWN572u5ZGK6K2m6KeE5YiZJyl9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICB7dCgnZGFzaGJvYXJkLndlbGNvbWUuc3RlcDIuZGVzYycsICforr7nva7pmIjlgLzjgIHnu4TlkIjjgIHln7rnur/kuInnuqflkYroraYnKX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoJy9kZXZpY2Utc2V0dXAnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLXN0YXJ0IGdhcC0xIHJvdW5kZWQtbGcgYm9yZGVyIGJnLWJhY2tncm91bmQgcC00IHRleHQtbGVmdCB0cmFuc2l0aW9uLWNvbG9ycyBob3Zlcjpib3JkZXItcHJpbWFyeSBob3ZlcjpiZy1hY2NlbnRcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LXByaW1hcnlcIj4zPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW1cIj5cbiAgICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQud2VsY29tZS5zdGVwMy50aXRsZScsICfmjqXlhaXpgaXmtYvmlbDmja4nKX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQud2VsY29tZS5zdGVwMy5kZXNjJywgJ+mAmui/hyBNUVRUIOaIlui+uee8mOe9keWFs+aOpeWFpeWunuaXtuaVsOaNricpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuXG4gICAgICB7Lyog57uf6K6h5Y2h54mH77yI5Y+v54K55Ye76Lez6L2s77yJICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00IG1kOmdyaWQtY29scy00XCI+XG4gICAgICAgIHtzdGF0Q2FyZHMubWFwKCh7IGxhYmVsLCB2YWx1ZSwgaWNvbjogSWNvbiwgY29sb3IsIGJnLCBsaW5rIH0pID0+IChcbiAgICAgICAgICA8Q2FyZFxuICAgICAgICAgICAga2V5PXtsYWJlbH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJnLW11dGVkLzUwXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlKGxpbmspfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCBwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Byb3VuZGVkLWxnIHAtMyAke2JnfWB9PlxuICAgICAgICAgICAgICAgIDxJY29uIGNsYXNzTmFtZT17YGgtNSB3LTUgJHtjb2xvcn1gfSAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57c3RhdHNMb2FkaW5nID8gJy4uLicgOiB2YWx1ZX08L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57bGFiZWx9PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgICAgPC9DYXJkPlxuICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogT0VFIOiuvuWkh+e7vOWQiOaViOeOh+eci+advyAqL31cbiAgICAgIHtvZWUgJiYgKFxuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dCgnZGFzaGJvYXJkLm9lZS50aXRsZScsICforr7lpIfnu7zlkIjmlYjnjocgKE9FRSknKX08L2gzPlxuICAgICAgICAgICAgICAgIHtvZWUuaXNBcHByb3hpbWF0ZSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIiBjbGFzc05hbWU9XCJ0ZXh0LWFtYmVyLTYwMCBib3JkZXItYW1iZXItMzAwIGJnLWFtYmVyLTUwXCIgdGl0bGU9e1xuICAgICAgICAgICAgICAgICAgICBvZWUuYXBwcm94aW1hdGlvbk5vdGVzXG4gICAgICAgICAgICAgICAgICAgICAgPyBPYmplY3QuZW50cmllcyhvZWUuYXBwcm94aW1hdGlvbk5vdGVzKS5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7dn1gKS5qb2luKCdcXG4nKVxuICAgICAgICAgICAgICAgICAgICAgIDogdCgnZGFzaGJvYXJkLm9lZS5hcHByb3hpbWF0ZUhpbnQnLCAn5Z+65LqO5a6e5pe254q25oCB55qE6L+R5Ly85Lyw566XJylcbiAgICAgICAgICAgICAgICAgIH0+XG4gICAgICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQub2VlLmFwcHJveGltYXRlJywgJ+i/keS8vOS8sOeulycpfVxuICAgICAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIHtvZWUuaGFzSW5zdWZmaWNpZW50RGF0YSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIiBjbGFzc05hbWU9XCJ0ZXh0LW9yYW5nZS02MDAgYm9yZGVyLW9yYW5nZS0zMDAgYmctb3JhbmdlLTUwXCI+XG4gICAgICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQub2VlLmluc3VmZmljaWVudERhdGEnLCAn5pWw5o2u5LiN6LazJyl9XG4gICAgICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgIHt0KCdkYXNoYm9hcmQub2VlLmZvcm11bGEnLCAnT0VFID0g5Y+v55So546HIMOXIOaAp+iDvSDDlyDotKjph48nKX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTQgbWQ6Z3JpZC1jb2xzLTRcIj5cbiAgICAgICAgICAgICAgey8qIOe7vOWQiCBPRUUgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1sZyBib3JkZXIgYmctcHJpbWFyeS81IHAtNFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTFcIj57dCgnZGFzaGJvYXJkLm9lZS5vdmVyYWxsJywgJ+e7vOWQiCBPRUUnKX08L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPXtgdGV4dC0zeGwgZm9udC1ib2xkICR7b2VlLm9lZSA+PSA4NSA/ICd0ZXh0LWdyZWVuLTYwMCcgOiBvZWUub2VlID49IDYwID8gJ3RleHQteWVsbG93LTYwMCcgOiAndGV4dC1yZWQtNjAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIHtvZWUub2VlfSVcbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7Lyog5Y+v55So546HICovfVxuICAgICAgICAgICAgICA8T2VlRGltZW5zaW9uXG4gICAgICAgICAgICAgICAgbGFiZWw9e3QoJ2Rhc2hib2FyZC5vZWUuYXZhaWxhYmlsaXR5JywgJ+WPr+eUqOeOhycpfVxuICAgICAgICAgICAgICAgIHZhbHVlPXtvZWUuYXZhaWxhYmlsaXR5fVxuICAgICAgICAgICAgICAgIGhpbnQ9e3QoJ2Rhc2hib2FyZC5vZWUuYXZhaWxhYmlsaXR5SGludCcsICd7e29ubGluZX19L3t7dG90YWx9fSDlnKjnur8nLCB7IG9ubGluZTogb2VlLm9ubGluZURldmljZXMsIHRvdGFsOiBvZWUudG90YWxEZXZpY2VzIH0pfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICB7Lyog5oCn6IO9ICovfVxuICAgICAgICAgICAgICA8T2VlRGltZW5zaW9uXG4gICAgICAgICAgICAgICAgbGFiZWw9e3QoJ2Rhc2hib2FyZC5vZWUucGVyZm9ybWFuY2UnLCAn5oCn6IO9Jyl9XG4gICAgICAgICAgICAgICAgdmFsdWU9e29lZS5wZXJmb3JtYW5jZX1cbiAgICAgICAgICAgICAgICBoaW50PXt0KCdkYXNoYm9hcmQub2VlLnBlcmZvcm1hbmNlSGludCcsICfkuqfog73ovr7moIfnjocnKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgey8qIOi0qOmHjyAqL31cbiAgICAgICAgICAgICAgPE9lZURpbWVuc2lvblxuICAgICAgICAgICAgICAgIGxhYmVsPXt0KCdkYXNoYm9hcmQub2VlLnF1YWxpdHknLCAn6LSo6YePJyl9XG4gICAgICAgICAgICAgICAgdmFsdWU9e29lZS5xdWFsaXR5fVxuICAgICAgICAgICAgICAgIGhpbnQ9e3QoJ2Rhc2hib2FyZC5vZWUucXVhbGl0eUhpbnQnLCAn5peg5Lil6YeN5pWF6Zqc5Y2g5q+UJyl9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuXG4gICAgICB7Lyog5Zu+6KGo5Yy65Z+f77ya6K6+5aSH54q25oCBICsg5ZGK6K2m57qn5Yir5YiG5biDICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00IG1kOmdyaWQtY29scy0yXCI+XG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxQaWVDaGFydCB0aXRsZT17dCgnZGFzaGJvYXJkLmRldmljZVN0YXR1c0Rpc3RyaWJ1dGlvbicpfSBkYXRhPXtkZXZpY2VQaWVEYXRhfSBoZWlnaHQ9ezI4MH0gLz5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxQaWVDaGFydCB0aXRsZT17dCgnZGFzaGJvYXJkLmFsZXJ0U2V2ZXJpdHlEaXN0cmlidXRpb24nKX0gZGF0YT17c2V2ZXJpdHlQaWVEYXRhfSBoZWlnaHQ9ezI4MH0gLz5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOi2i+WKv+Wbvu+8muWRiuitpiArIOW3peWNlSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBtZDpncmlkLWNvbHMtMlwiPlxuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8VHJlbmRDaGFydCB0aXRsZT17dCgnZGFzaGJvYXJkLmFsZXJ0VHJlbmRzJyl9IGRhdGE9e2FsZXJ0VHJlbmREYXRhfSBjb2xvcj1cIiNlZjQ0NDRcIiBoZWlnaHQ9ezI4MH0gLz5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxUcmVuZENoYXJ0IHRpdGxlPXt0KCdkYXNoYm9hcmQud29ya09yZGVyVHJlbmQnKX0gZGF0YT17d29ya09yZGVyVHJlbmREYXRhfSBjb2xvcj1cIiMzYjgyZjZcIiBoZWlnaHQ9ezI4MH0gLz5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOW3peWNleeKtuaAgeWIhuW4gyArIOacgOi/keWRiuitpiAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBtZDpncmlkLWNvbHMtMlwiPlxuICAgICAgICB7Lyog5bel5Y2V54q25oCB5YiG5biDICovfVxuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwibWItMyB0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KCdkYXNoYm9hcmQud29ya09yZGVyU3RhdHVzRGlzdHJpYnV0aW9uJyl9PC9oMz5cbiAgICAgICAgICAgIHtzdGF0cyAmJiBPYmplY3Qua2V5cyhzdGF0cy53b3JrT3JkZXJzQnlTdGF0dXMpLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMyBnYXAtM1wiPlxuICAgICAgICAgICAgICAgIHtPYmplY3QuZW50cmllcyhzdGF0cy53b3JrT3JkZXJzQnlTdGF0dXMpLm1hcCgoW3N0YXR1cywgY291bnRdKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17c3RhdHVzfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcm91bmRlZC1tZCBib3JkZXIgcC0yLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgPEJhZGdlIGNsYXNzTmFtZT17d29ya09yZGVyU3RhdHVzVmFyaWFudFtzdGF0dXNdID8/ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNjAwJ30+XG4gICAgICAgICAgICAgICAgICAgICAge3dvcmtPcmRlclN0YXR1c0xhYmVsc1tzdGF0dXNdID8/IHN0YXR1c31cbiAgICAgICAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJvbGRcIj57Y291bnR9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgICAgPC9DYXJkPlxuXG4gICAgICAgIHsvKiDmnIDov5HlkYrorabliJfooaggKi99XG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJtYi0zIHRleHQtYmFzZSBmb250LXNlbWlib2xkXCI+e3QoJ2Rhc2hib2FyZC5yZWNlbnRBbGVydHMnKX08L2gzPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAge2FsZXJ0c0RhdGE/Lml0ZW1zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubm9EYXRhJyl9PC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIGFsZXJ0c0RhdGE/Lml0ZW1zLnNsaWNlKDAsIDEwKS5tYXAoKGFsZXJ0KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17YWxlcnQuaWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItYm9yZGVyIHAtM1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPFNldmVyaXR5QmFkZ2Ugc2V2ZXJpdHk9e2FsZXJ0LnNldmVyaXR5fSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+e2FsZXJ0LmRldmljZUlkLnNsaWNlKDAsIDgpfeKApiDigJQge2FsZXJ0Lm1ldHJpY308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntuZXcgRGF0ZShhbGVydC5vY2N1cnJlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e2FsZXJ0LnZhbHVlfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLyoqIOWFqOWxgOe7n+iuoemhuee7hOS7tiDigJQg55So5LqOIHN5c3RlbV9hZG1pbiDku6rooajnm5jpobbpg6jnmoTnu5/orqHmlbDmja7lsZXnpLogKi9cbmZ1bmN0aW9uIEdsb2JhbFN0YXRJdGVtKHsgaWNvbiwgbGFiZWwsIHZhbHVlIH06IHsgaWNvbjogUmVhY3QuUmVhY3ROb2RlOyBsYWJlbDogc3RyaW5nOyB2YWx1ZTogc3RyaW5nIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICB7aWNvbn1cbiAgICAgIDxkaXY+XG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ib2xkXCI+e3ZhbHVlfTwvcD5cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57bGFiZWx9PC9wPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8qKiBPRUUg5Y2V57u05bqm5bGV56S677yI5pWw5YC8ICsg6L+b5bqm5p2h77yJ77yM5aSN55So6aG555uu5YaF6IGU6L+b5bqm5p2h6aOO5qC8ICovXG5mdW5jdGlvbiBPZWVEaW1lbnNpb24oeyBsYWJlbCwgdmFsdWUsIGhpbnQgfTogeyBsYWJlbDogc3RyaW5nOyB2YWx1ZTogbnVtYmVyOyBoaW50OiBzdHJpbmcgfSkge1xuICBjb25zdCBjb2xvciA9IHZhbHVlID49IDg1ID8gJ2JnLWdyZWVuLTUwMCcgOiB2YWx1ZSA+PSA2MCA/ICdiZy15ZWxsb3ctNTAwJyA6ICdiZy1yZWQtNTAwJztcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQtbGcgYm9yZGVyIHAtNFwiPlxuICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSBtYi0xXCI+e2xhYmVsfTwvcD5cbiAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCBtYi0yXCI+e3ZhbHVlfSU8L3A+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtMiB3LWZ1bGwgcm91bmRlZC1mdWxsIGJnLW11dGVkIG92ZXJmbG93LWhpZGRlbiBtYi0xXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgaC1mdWxsIHRyYW5zaXRpb24tYWxsICR7Y29sb3J9YH0gc3R5bGU9e3sgd2lkdGg6IGAke01hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgdmFsdWUpKX0lYCB9fSAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntoaW50fTwvcD5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==