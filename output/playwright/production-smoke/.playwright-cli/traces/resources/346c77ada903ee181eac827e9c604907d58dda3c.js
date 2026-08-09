import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/SettingsPage.tsx");const _jsxDEV = __vite__cjsImport17_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "/src/components/ui/tabs.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { usePushNotifications } from "/src/hooks/usePushNotifications.ts";
import MfaSettingsPanel from "/src/components/settings/MfaSettingsPanel.tsx";
import { SubscriptionPanel } from "/src/components/settings/SubscriptionPanel.tsx";
import { ApprovalChainSettings } from "/src/components/settings/ApprovalChainSettings.tsx";
import { SystemInfoCard } from "/src/components/settings/SystemInfoCard.tsx";
import { UserManagementPanel } from "/src/components/settings/UserManagementPanel.tsx";
import { IntegrationSettings } from "/src/components/settings/IntegrationSettings.tsx";
import { NotificationPreferenceCard } from "/src/components/settings/NotificationPreferenceCard.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/SettingsPage.tsx";
import __vite__cjsImport17_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 系统角色列表 */
const roles = [
	"system_admin",
	"maintenance_lead",
	"technician",
	"operator",
	"viewer"
];
/** 权限模块对应的翻译键映射 */
const permissionKeys = {
	"deviceManagement": "settings.module.deviceManagement",
	"alertManagement": "settings.module.alertManagement",
	"workOrderManagement": "settings.module.workOrderManagement",
	"knowledgeBase": "settings.module.knowledgeBase",
	"reports": "settings.module.reports",
	"aiAnalysis": "settings.module.aiAnalysis"
};
/** 权限模块列表（使用内部键） */
const permissions = [
	"deviceManagement",
	"alertManagement",
	"workOrderManagement",
	"knowledgeBase",
	"reports",
	"aiAnalysis"
];
/**
* RBAC 权限矩阵（只读展示）
*
* 对应 CLAUDE.md 中定义的权限矩阵，五个角色 × 六个模块。
*/
const rbacMatrix = {
	system_admin: {
		deviceManagement: "CRUD",
		alertManagement: "CRUD",
		workOrderManagement: "CRUD",
		knowledgeBase: "CRUD",
		reports: "R",
		aiAnalysis: "CRUD"
	},
	maintenance_lead: {
		deviceManagement: "RW",
		alertManagement: "RW+配置",
		workOrderManagement: "RW+派工验收",
		knowledgeBase: "RW+验证",
		reports: "R",
		aiAnalysis: "R"
	},
	technician: {
		deviceManagement: "R",
		alertManagement: "R+确认",
		workOrderManagement: "R+执行",
		knowledgeBase: "R",
		reports: "-",
		aiAnalysis: "R+查询"
	},
	operator: {
		deviceManagement: "R",
		alertManagement: "R+确认",
		workOrderManagement: "R",
		knowledgeBase: "-",
		reports: "R",
		aiAnalysis: "R+查询"
	},
	viewer: {
		deviceManagement: "R",
		alertManagement: "R",
		workOrderManagement: "R",
		knowledgeBase: "R",
		reports: "R",
		aiAnalysis: "-"
	}
};
/** 角色对应的翻译键 */
const roleLabelKeys = {
	system_admin: "settings.role.systemAdmin",
	maintenance_lead: "settings.role.maintenanceLead",
	technician: "settings.role.technician",
	operator: "settings.role.operator",
	viewer: "settings.role.viewer"
};
/**
* 系统设置页面
*
* 采用 Tab 布局，包含九个面板：
* - 用户管理：管理用户账号
* - 角色权限：展示 RBAC 权限矩阵（只读，内联实现）
* - LLM 配置：配置 AI 服务参数（内联实现）
* - 系统参数：全局系统参数配置（内联实现）+ 系统信息卡片
* - 外部集成：配置 Webhook / 钉钉 / 飞书 / EAM 对接
* - 审批链配置：配置工单审批流程模板
* - 订阅管理：查看用量、切换租户计划
* - 通知偏好：按类型和渠道自定义通知
* - 安全与 MFA：多因素认证设置
*
* 注：各功能面板已拆分为独立组件（components/settings/），
* 本页仅保留 RBAC 矩阵和 LLM/系统参数等纯展示型内联 Card。
*/
export default function SettingsPage() {
	_s();
	const { t } = useTranslation();
	const { isSupported: pushSupported, isSubscribed, subscribe, unsubscribe, permission } = usePushNotifications();
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ _jsxDEV("h1", {
			className: "text-2xl font-bold",
			children: t("settings.title")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 80,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV(Tabs, {
			defaultValue: "users",
			className: "flex gap-6 items-start",
			children: [/* @__PURE__ */ _jsxDEV(TabsList, {
				className: "flex flex-col w-44 shrink-0 bg-muted/50 p-1 gap-0.5",
				children: [
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "users",
						className: "w-full justify-start px-3",
						children: t("settings.users")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "roles",
						className: "w-full justify-start px-3",
						children: t("settings.roles")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 85,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "llm",
						className: "w-full justify-start px-3",
						children: t("settings.llm")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 86,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "system",
						className: "w-full justify-start px-3",
						children: t("settings.system")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "integration",
						className: "w-full justify-start px-3",
						children: t("settings.integration")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 88,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "approval-chains",
						className: "w-full justify-start px-3",
						children: "审批链配置"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 89,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "subscription",
						className: "w-full justify-start px-3",
						children: t("settings.subscription")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "notifications",
						className: "w-full justify-start px-3",
						children: "通知偏好"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 91,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsTrigger, {
						value: "security",
						className: "w-full justify-start px-3",
						children: "安全与 MFA"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 92,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 83,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "flex-1 min-w-0 space-y-4",
				children: [
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "users",
						children: /* @__PURE__ */ _jsxDEV(UserManagementPanel, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 99,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 98,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "roles",
						children: /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("settings.roles") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 106,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("settings.rbacMatrix") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 107,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 105,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [/* @__PURE__ */ _jsxDEV(TableHead, { children: t("settings.permissionRole") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 113,
							columnNumber: 21
						}, this), roles.map((role) => /* @__PURE__ */ _jsxDEV(TableHead, { children: t(roleLabelKeys[role]) }, role, false, {
							fileName: _jsxFileName,
							lineNumber: 115,
							columnNumber: 23
						}, this))] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 112,
							columnNumber: 19
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 111,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: permissions.map((perm) => /* @__PURE__ */ _jsxDEV(TableRow, { children: [/* @__PURE__ */ _jsxDEV(TableCell, {
							className: "font-medium",
							children: t(permissionKeys[perm])
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 122,
							columnNumber: 23
						}, this), roles.map((role) => /* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
							variant: "outline",
							className: rbacMatrix[role][perm].includes("CRUD") ? "border-green-500/30 text-green-500" : rbacMatrix[role][perm].includes("RW") ? "border-blue-500/30 text-blue-500" : rbacMatrix[role][perm] === "R" ? "border-gray-500/30 text-gray-500" : "border-red-500/30 text-red-500",
							children: rbacMatrix[role][perm]
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 125,
							columnNumber: 27
						}, this) }, role, false, {
							fileName: _jsxFileName,
							lineNumber: 124,
							columnNumber: 25
						}, this))] }, perm, true, {
							fileName: _jsxFileName,
							lineNumber: 121,
							columnNumber: 21
						}, this)) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 119,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 110,
							columnNumber: 15
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 109,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 104,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 103,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "llm",
						children: /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("settings.llm") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 147,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("settings.configureLLM") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 148,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 146,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "grid gap-4 md:grid-cols-2",
									children: [
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.modelId") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 153,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												defaultValue: "glm-5",
												placeholder: t("settings.modelIdentifier")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 154,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 152,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: "Endpoint" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 157,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												defaultValue: "https://dashscope.aliyuncs.com/api/v1",
												placeholder: t("settings.apiEndpoint")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 158,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 156,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.timeout") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 161,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "30"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 162,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 160,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.maxTokens") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 165,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "4096"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 166,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 164,
											columnNumber: 17
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 151,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 169,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex justify-end",
									children: /* @__PURE__ */ _jsxDEV(Button, { children: t("common.save") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 171,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 170,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 150,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 145,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 144,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "system",
						children: [/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("settings.system") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 181,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("settings.globalSystemParameters") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 182,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 180,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "grid gap-4 md:grid-cols-2",
									children: [
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.alertCooldown") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 187,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "300"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 188,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 186,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.aggregationWindow") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 191,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "30"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 192,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 190,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.maxAggregationCount") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 195,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "3"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 196,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 194,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("settings.dataRetentionDays") }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 199,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV(Input, {
												type: "number",
												defaultValue: "90"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 200,
												columnNumber: 19
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 198,
											columnNumber: 17
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 185,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 203,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex justify-end",
									children: /* @__PURE__ */ _jsxDEV(Button, { children: t("common.save") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 205,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 204,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 184,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 179,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV(SystemInfoCard, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 211,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 178,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "integration",
						children: /* @__PURE__ */ _jsxDEV(IntegrationSettings, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 216,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 215,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "approval-chains",
						children: /* @__PURE__ */ _jsxDEV(ApprovalChainSettings, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 221,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 220,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "subscription",
						children: /* @__PURE__ */ _jsxDEV(SubscriptionPanel, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 226,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 225,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "notifications",
						children: /* @__PURE__ */ _jsxDEV(NotificationPreferenceCard, {
							pushSupported,
							isSubscribed,
							permission,
							onSubscribe: subscribe,
							onUnsubscribe: unsubscribe
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 231,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 230,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(TabsContent, {
						value: "security",
						children: /* @__PURE__ */ _jsxDEV(MfaSettingsPanel, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 242,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 241,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 95,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 82,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 5
	}, this);
}
_s(SettingsPage, "84aCHzNh+ME/d5GgN8vx8VVww8U=", false, function() {
	return [useTranslation, usePushNotifications];
});
_c = SettingsPage;
var _c;
$RefreshReg$(_c, "SettingsPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/SettingsPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/SettingsPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/SettingsPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/SettingsPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QyxPQUFEO1NBQUssV0FBVTttQkFDYix3QkFBQyxRQUFELFlBQVMsRUFBRSxhQUFhLEVBQVU7Ozs7O1FBQy9COzs7OztPQUNNOzs7OztjQUNUOzs7O2dCQUdOLHdCQUFDLGdCQUFELENBQWlCOzs7O2NBQ047Ozs7OztLQUdiLHdCQUFDLGFBQUQ7TUFBYSxPQUFNO2dCQUNqQix3QkFBQyxxQkFBRCxDQUFzQjs7Ozs7S0FDWDs7Ozs7S0FHYix3QkFBQyxhQUFEO01BQWEsT0FBTTtnQkFDakIsd0JBQUMsdUJBQUQsQ0FBd0I7Ozs7O0tBQ2I7Ozs7O0tBR2Isd0JBQUMsYUFBRDtNQUFhLE9BQU07Z0JBQ2pCLHdCQUFDLG1CQUFELENBQW9COzs7OztLQUNUOzs7OztLQUdiLHdCQUFDLGFBQUQ7TUFBYSxPQUFNO2dCQUNqQix3QkFBQyw0QkFBRDtPQUNpQjtPQUNEO09BQ0Y7T0FDWixhQUFhO09BQ2IsZUFBZTtNQUNoQjs7Ozs7S0FDVTs7Ozs7S0FHYix3QkFBQyxhQUFEO01BQWEsT0FBTTtnQkFDakIsd0JBQUMsa0JBQUQsQ0FBbUI7Ozs7O0tBQ1I7Ozs7O0lBQ1I7Ozs7O1dBQ0Q7Ozs7O1VBQ0g7Ozs7OztBQUVUIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlNldHRpbmdzUGFnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvY2FyZCc7XG5pbXBvcnQgeyBUYWJzLCBUYWJzQ29udGVudCwgVGFic0xpc3QsIFRhYnNUcmlnZ2VyIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS90YWJzJztcbmltcG9ydCB7IFRhYmxlLCBUYWJsZUJvZHksIFRhYmxlQ2VsbCwgVGFibGVIZWFkLCBUYWJsZUhlYWRlciwgVGFibGVSb3cgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3RhYmxlJztcbmltcG9ydCB7IElucHV0IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvbGFiZWwnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9idXR0b24nO1xuaW1wb3J0IHsgQmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2JhZGdlJztcbmltcG9ydCB7IFNlcGFyYXRvciB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvc2VwYXJhdG9yJztcbmltcG9ydCB7IHVzZVB1c2hOb3RpZmljYXRpb25zIH0gZnJvbSAnLi4vaG9va3MvdXNlUHVzaE5vdGlmaWNhdGlvbnMnO1xuaW1wb3J0IE1mYVNldHRpbmdzUGFuZWwgZnJvbSAnLi4vY29tcG9uZW50cy9zZXR0aW5ncy9NZmFTZXR0aW5nc1BhbmVsJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvblBhbmVsIH0gZnJvbSAnLi4vY29tcG9uZW50cy9zZXR0aW5ncy9TdWJzY3JpcHRpb25QYW5lbCc7XG5pbXBvcnQgeyBBcHByb3ZhbENoYWluU2V0dGluZ3MgfSBmcm9tICcuLi9jb21wb25lbnRzL3NldHRpbmdzL0FwcHJvdmFsQ2hhaW5TZXR0aW5ncyc7XG5pbXBvcnQgeyBTeXN0ZW1JbmZvQ2FyZCB9IGZyb20gJy4uL2NvbXBvbmVudHMvc2V0dGluZ3MvU3lzdGVtSW5mb0NhcmQnO1xuaW1wb3J0IHsgVXNlck1hbmFnZW1lbnRQYW5lbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvc2V0dGluZ3MvVXNlck1hbmFnZW1lbnRQYW5lbCc7XG5pbXBvcnQgeyBJbnRlZ3JhdGlvblNldHRpbmdzIH0gZnJvbSAnLi4vY29tcG9uZW50cy9zZXR0aW5ncy9JbnRlZ3JhdGlvblNldHRpbmdzJztcbmltcG9ydCB7IE5vdGlmaWNhdGlvblByZWZlcmVuY2VDYXJkIH0gZnJvbSAnLi4vY29tcG9uZW50cy9zZXR0aW5ncy9Ob3RpZmljYXRpb25QcmVmZXJlbmNlQ2FyZCc7XG5cbi8qKiDns7vnu5/op5LoibLliJfooaggKi9cbmNvbnN0IHJvbGVzID0gWydzeXN0ZW1fYWRtaW4nLCAnbWFpbnRlbmFuY2VfbGVhZCcsICd0ZWNobmljaWFuJywgJ29wZXJhdG9yJywgJ3ZpZXdlciddO1xuXG4vKiog5p2D6ZmQ5qih5Z2X5a+55bqU55qE57+76K+R6ZSu5pig5bCEICovXG5jb25zdCBwZXJtaXNzaW9uS2V5czogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgJ2RldmljZU1hbmFnZW1lbnQnOiAnc2V0dGluZ3MubW9kdWxlLmRldmljZU1hbmFnZW1lbnQnLFxuICAnYWxlcnRNYW5hZ2VtZW50JzogJ3NldHRpbmdzLm1vZHVsZS5hbGVydE1hbmFnZW1lbnQnLFxuICAnd29ya09yZGVyTWFuYWdlbWVudCc6ICdzZXR0aW5ncy5tb2R1bGUud29ya09yZGVyTWFuYWdlbWVudCcsXG4gICdrbm93bGVkZ2VCYXNlJzogJ3NldHRpbmdzLm1vZHVsZS5rbm93bGVkZ2VCYXNlJyxcbiAgJ3JlcG9ydHMnOiAnc2V0dGluZ3MubW9kdWxlLnJlcG9ydHMnLFxuICAnYWlBbmFseXNpcyc6ICdzZXR0aW5ncy5tb2R1bGUuYWlBbmFseXNpcycsXG59O1xuXG4vKiog5p2D6ZmQ5qih5Z2X5YiX6KGo77yI5L2/55So5YaF6YOo6ZSu77yJICovXG5jb25zdCBwZXJtaXNzaW9ucyA9IFsnZGV2aWNlTWFuYWdlbWVudCcsICdhbGVydE1hbmFnZW1lbnQnLCAnd29ya09yZGVyTWFuYWdlbWVudCcsICdrbm93bGVkZ2VCYXNlJywgJ3JlcG9ydHMnLCAnYWlBbmFseXNpcyddO1xuXG4vKipcbiAqIFJCQUMg5p2D6ZmQ55+p6Zi177yI5Y+q6K+75bGV56S677yJXG4gKlxuICog5a+55bqUIENMQVVERS5tZCDkuK3lrprkuYnnmoTmnYPpmZDnn6npmLXvvIzkupTkuKrop5LoibIgw5cg5YWt5Liq5qih5Z2X44CCXG4gKi9cbmNvbnN0IHJiYWNNYXRyaXg6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge1xuICBzeXN0ZW1fYWRtaW46ICAgICB7IGRldmljZU1hbmFnZW1lbnQ6ICdDUlVEJywgYWxlcnRNYW5hZ2VtZW50OiAnQ1JVRCcsIHdvcmtPcmRlck1hbmFnZW1lbnQ6ICdDUlVEJywga25vd2xlZGdlQmFzZTogJ0NSVUQnLCByZXBvcnRzOiAnUicsIGFpQW5hbHlzaXM6ICdDUlVEJyB9LFxuICBtYWludGVuYW5jZV9sZWFkOiB7IGRldmljZU1hbmFnZW1lbnQ6ICdSVycsIGFsZXJ0TWFuYWdlbWVudDogJ1JXK+mFjee9ricsIHdvcmtPcmRlck1hbmFnZW1lbnQ6ICdSVyvmtL7lt6XpqozmlLYnLCBrbm93bGVkZ2VCYXNlOiAnUlcr6aqM6K+BJywgcmVwb3J0czogJ1InLCBhaUFuYWx5c2lzOiAnUicgfSxcbiAgdGVjaG5pY2lhbjogICAgICAgeyBkZXZpY2VNYW5hZ2VtZW50OiAnUicsIGFsZXJ0TWFuYWdlbWVudDogJ1Ir56Gu6K6kJywgd29ya09yZGVyTWFuYWdlbWVudDogJ1Ir5omn6KGMJywga25vd2xlZGdlQmFzZTogJ1InLCByZXBvcnRzOiAnLScsIGFpQW5hbHlzaXM6ICdSK+afpeivoicgfSxcbiAgb3BlcmF0b3I6ICAgICAgICAgeyBkZXZpY2VNYW5hZ2VtZW50OiAnUicsIGFsZXJ0TWFuYWdlbWVudDogJ1Ir56Gu6K6kJywgd29ya09yZGVyTWFuYWdlbWVudDogJ1InLCBrbm93bGVkZ2VCYXNlOiAnLScsIHJlcG9ydHM6ICdSJywgYWlBbmFseXNpczogJ1Ir5p+l6K+iJyB9LFxuICB2aWV3ZXI6ICAgICAgICAgICB7IGRldmljZU1hbmFnZW1lbnQ6ICdSJywgYWxlcnRNYW5hZ2VtZW50OiAnUicsIHdvcmtPcmRlck1hbmFnZW1lbnQ6ICdSJywga25vd2xlZGdlQmFzZTogJ1InLCByZXBvcnRzOiAnUicsIGFpQW5hbHlzaXM6ICctJyB9LFxufTtcblxuLyoqIOinkuiJsuWvueW6lOeahOe/u+ivkemUriAqL1xuY29uc3Qgcm9sZUxhYmVsS2V5czogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgc3lzdGVtX2FkbWluOiAnc2V0dGluZ3Mucm9sZS5zeXN0ZW1BZG1pbicsXG4gIG1haW50ZW5hbmNlX2xlYWQ6ICdzZXR0aW5ncy5yb2xlLm1haW50ZW5hbmNlTGVhZCcsXG4gIHRlY2huaWNpYW46ICdzZXR0aW5ncy5yb2xlLnRlY2huaWNpYW4nLFxuICBvcGVyYXRvcjogJ3NldHRpbmdzLnJvbGUub3BlcmF0b3InLFxuICB2aWV3ZXI6ICdzZXR0aW5ncy5yb2xlLnZpZXdlcicsXG59O1xuXG4vKipcbiAqIOezu+e7n+iuvue9rumhtemdolxuICpcbiAqIOmHh+eUqCBUYWIg5biD5bGA77yM5YyF5ZCr5Lmd5Liq6Z2i5p2/77yaXG4gKiAtIOeUqOaIt+euoeeQhu+8mueuoeeQhueUqOaIt+i0puWPt1xuICogLSDop5LoibLmnYPpmZDvvJrlsZXnpLogUkJBQyDmnYPpmZDnn6npmLXvvIjlj6ror7vvvIzlhoXogZTlrp7njrDvvIlcbiAqIC0gTExNIOmFjee9ru+8mumFjee9riBBSSDmnI3liqHlj4LmlbDvvIjlhoXogZTlrp7njrDvvIlcbiAqIC0g57O757uf5Y+C5pWw77ya5YWo5bGA57O757uf5Y+C5pWw6YWN572u77yI5YaF6IGU5a6e546w77yJKyDns7vnu5/kv6Hmga/ljaHniYdcbiAqIC0g5aSW6YOo6ZuG5oiQ77ya6YWN572uIFdlYmhvb2sgLyDpkonpkokgLyDpo57kuaYgLyBFQU0g5a+55o6lXG4gKiAtIOWuoeaJuemTvumFjee9ru+8mumFjee9ruW3peWNleWuoeaJuea1geeoi+aooeadv1xuICogLSDorqLpmIXnrqHnkIbvvJrmn6XnnIvnlKjph4/jgIHliIfmjaLnp5/miLforqHliJJcbiAqIC0g6YCa55+l5YGP5aW977ya5oyJ57G75Z6L5ZKM5rig6YGT6Ieq5a6a5LmJ6YCa55+lXG4gKiAtIOWuieWFqOS4jiBNRkHvvJrlpJrlm6DntKDorqTor4Horr7nva5cbiAqXG4gKiDms6jvvJrlkITlip/og73pnaLmnb/lt7Lmi4bliIbkuLrni6znq4vnu4Tku7bvvIhjb21wb25lbnRzL3NldHRpbmdzL++8ie+8jFxuICog5pys6aG15LuF5L+d55WZIFJCQUMg55+p6Zi15ZKMIExMTS/ns7vnu5/lj4LmlbDnrYnnuq/lsZXnpLrlnovlhoXogZQgQ2FyZOOAglxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZXR0aW5nc1BhZ2UoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyBpc1N1cHBvcnRlZDogcHVzaFN1cHBvcnRlZCwgaXNTdWJzY3JpYmVkLCBzdWJzY3JpYmUsIHVuc3Vic2NyaWJlLCBwZXJtaXNzaW9uIH0gPSB1c2VQdXNoTm90aWZpY2F0aW9ucygpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57dCgnc2V0dGluZ3MudGl0bGUnKX08L2gxPlxuXG4gICAgICA8VGFicyBkZWZhdWx0VmFsdWU9XCJ1c2Vyc1wiIGNsYXNzTmFtZT1cImZsZXggZ2FwLTYgaXRlbXMtc3RhcnRcIj5cbiAgICAgICAgPFRhYnNMaXN0IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgdy00NCBzaHJpbmstMCBiZy1tdXRlZC81MCBwLTEgZ2FwLTAuNVwiPlxuICAgICAgICAgIDxUYWJzVHJpZ2dlciB2YWx1ZT1cInVzZXJzXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdzZXR0aW5ncy51c2VycycpfTwvVGFic1RyaWdnZXI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwicm9sZXNcIiBjbGFzc05hbWU9XCJ3LWZ1bGwganVzdGlmeS1zdGFydCBweC0zXCI+e3QoJ3NldHRpbmdzLnJvbGVzJyl9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJsbG1cIiBjbGFzc05hbWU9XCJ3LWZ1bGwganVzdGlmeS1zdGFydCBweC0zXCI+e3QoJ3NldHRpbmdzLmxsbScpfTwvVGFic1RyaWdnZXI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwic3lzdGVtXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdzZXR0aW5ncy5zeXN0ZW0nKX08L1RhYnNUcmlnZ2VyPlxuICAgICAgICAgIDxUYWJzVHJpZ2dlciB2YWx1ZT1cImludGVncmF0aW9uXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdzZXR0aW5ncy5pbnRlZ3JhdGlvbicpfTwvVGFic1RyaWdnZXI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwiYXBwcm92YWwtY2hhaW5zXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPuWuoeaJuemTvumFjee9rjwvVGFic1RyaWdnZXI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwic3Vic2NyaXB0aW9uXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdzZXR0aW5ncy5zdWJzY3JpcHRpb24nKX08L1RhYnNUcmlnZ2VyPlxuICAgICAgICAgIDxUYWJzVHJpZ2dlciB2YWx1ZT1cIm5vdGlmaWNhdGlvbnNcIiBjbGFzc05hbWU9XCJ3LWZ1bGwganVzdGlmeS1zdGFydCBweC0zXCI+6YCa55+l5YGP5aW9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJzZWN1cml0eVwiIGNsYXNzTmFtZT1cInctZnVsbCBqdXN0aWZ5LXN0YXJ0IHB4LTNcIj7lronlhajkuI4gTUZBPC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgPC9UYWJzTGlzdD5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wIHNwYWNlLXktNFwiPlxuXG4gICAgICAgIHsvKiDnlKjmiLfnrqHnkIYgKi99XG4gICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cInVzZXJzXCI+XG4gICAgICAgICAgPFVzZXJNYW5hZ2VtZW50UGFuZWwgLz5cbiAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICB7Lyog6KeS6Imy5p2D6ZmQ55+p6Zi177yI5Y+q6K+777yJICovfVxuICAgICAgICA8VGFic0NvbnRlbnQgdmFsdWU9XCJyb2xlc1wiPlxuICAgICAgICAgIDxDYXJkPlxuICAgICAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgICAgIDxDYXJkVGl0bGU+e3QoJ3NldHRpbmdzLnJvbGVzJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ3NldHRpbmdzLnJiYWNNYXRyaXgnKX08L0NhcmREZXNjcmlwdGlvbj5cbiAgICAgICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgICAgIDxDYXJkQ29udGVudD5cbiAgICAgICAgICAgICAgPFRhYmxlPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICAgIDxUYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnc2V0dGluZ3MucGVybWlzc2lvblJvbGUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAge3JvbGVzLm1hcCgocm9sZSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQga2V5PXtyb2xlfT57dChyb2xlTGFiZWxLZXlzW3JvbGVdKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgIDwvVGFibGVIZWFkZXI+XG4gICAgICAgICAgICAgICAgPFRhYmxlQm9keT5cbiAgICAgICAgICAgICAgICAgIHtwZXJtaXNzaW9ucy5tYXAoKHBlcm0pID0+IChcbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17cGVybX0+XG4gICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt0KHBlcm1pc3Npb25LZXlzW3Blcm1dKX08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICB7cm9sZXMubWFwKChyb2xlKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIGtleT17cm9sZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiIGNsYXNzTmFtZT17XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmJhY01hdHJpeFtyb2xlXVtwZXJtXS5pbmNsdWRlcygnQ1JVRCcpID8gJ2JvcmRlci1ncmVlbi01MDAvMzAgdGV4dC1ncmVlbi01MDAnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYmFjTWF0cml4W3JvbGVdW3Blcm1dLmluY2x1ZGVzKCdSVycpID8gJ2JvcmRlci1ibHVlLTUwMC8zMCB0ZXh0LWJsdWUtNTAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmJhY01hdHJpeFtyb2xlXVtwZXJtXSA9PT0gJ1InID8gJ2JvcmRlci1ncmF5LTUwMC8zMCB0ZXh0LWdyYXktNTAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JvcmRlci1yZWQtNTAwLzMwIHRleHQtcmVkLTUwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmJhY01hdHJpeFtyb2xlXVtwZXJtXX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgICAgIDwvVGFibGU+XG4gICAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICAgIDwvQ2FyZD5cbiAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICB7LyogTExNIOmFjee9riAqL31cbiAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwibGxtXCI+XG4gICAgICAgICAgPENhcmQ+XG4gICAgICAgICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgICAgICAgPENhcmRUaXRsZT57dCgnc2V0dGluZ3MubGxtJyl9PC9DYXJkVGl0bGU+XG4gICAgICAgICAgICAgIDxDYXJkRGVzY3JpcHRpb24+e3QoJ3NldHRpbmdzLmNvbmZpZ3VyZUxMTScpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTQgbWQ6Z3JpZC1jb2xzLTJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5tb2RlbElkJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dCBkZWZhdWx0VmFsdWU9XCJnbG0tNVwiIHBsYWNlaG9sZGVyPXt0KCdzZXR0aW5ncy5tb2RlbElkZW50aWZpZXInKX0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPkVuZHBvaW50PC9MYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dCBkZWZhdWx0VmFsdWU9XCJodHRwczovL2Rhc2hzY29wZS5hbGl5dW5jcy5jb20vYXBpL3YxXCIgcGxhY2Vob2xkZXI9e3QoJ3NldHRpbmdzLmFwaUVuZHBvaW50Jyl9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxMYWJlbD57dCgnc2V0dGluZ3MudGltZW91dCcpfTwvTGFiZWw+XG4gICAgICAgICAgICAgICAgICA8SW5wdXQgdHlwZT1cIm51bWJlclwiIGRlZmF1bHRWYWx1ZT1cIjMwXCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5tYXhUb2tlbnMnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgICAgPElucHV0IHR5cGU9XCJudW1iZXJcIiBkZWZhdWx0VmFsdWU9XCI0MDk2XCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxTZXBhcmF0b3IgLz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbj57dCgnY29tbW9uLnNhdmUnKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICAgIDwvQ2FyZD5cbiAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICB7Lyog57O757uf5Y+C5pWwICovfVxuICAgICAgICA8VGFic0NvbnRlbnQgdmFsdWU9XCJzeXN0ZW1cIj5cbiAgICAgICAgICA8Q2FyZD5cbiAgICAgICAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICAgICAgICA8Q2FyZFRpdGxlPnt0KCdzZXR0aW5ncy5zeXN0ZW0nKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICAgICAgPENhcmREZXNjcmlwdGlvbj57dCgnc2V0dGluZ3MuZ2xvYmFsU3lzdGVtUGFyYW1ldGVycycpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTQgbWQ6Z3JpZC1jb2xzLTJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5hbGVydENvb2xkb3duJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dCB0eXBlPVwibnVtYmVyXCIgZGVmYXVsdFZhbHVlPVwiMzAwXCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5hZ2dyZWdhdGlvbldpbmRvdycpfTwvTGFiZWw+XG4gICAgICAgICAgICAgICAgICA8SW5wdXQgdHlwZT1cIm51bWJlclwiIGRlZmF1bHRWYWx1ZT1cIjMwXCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPnt0KCdzZXR0aW5ncy5tYXhBZ2dyZWdhdGlvbkNvdW50Jyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dCB0eXBlPVwibnVtYmVyXCIgZGVmYXVsdFZhbHVlPVwiM1wiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxMYWJlbD57dCgnc2V0dGluZ3MuZGF0YVJldGVudGlvbkRheXMnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgICAgPElucHV0IHR5cGU9XCJudW1iZXJcIiBkZWZhdWx0VmFsdWU9XCI5MFwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8U2VwYXJhdG9yIC8+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+e3QoJ2NvbW1vbi5zYXZlJyl9PC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgICAgICA8L0NhcmQ+XG5cbiAgICAgICAgICB7Lyog57O757uf5L+h5oGv77yI5a+55bqUIEdFVCAvYXBpL3YxL3N5c3RlbS9pbmZv77yJICovfVxuICAgICAgICAgIDxTeXN0ZW1JbmZvQ2FyZCAvPlxuICAgICAgICA8L1RhYnNDb250ZW50PlxuXG4gICAgICAgIHsvKiDlpJbpg6jpm4bmiJAgKi99XG4gICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cImludGVncmF0aW9uXCI+XG4gICAgICAgICAgPEludGVncmF0aW9uU2V0dGluZ3MgLz5cbiAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICB7Lyog5a6h5om56ZO+6YWN572uICovfVxuICAgICAgICA8VGFic0NvbnRlbnQgdmFsdWU9XCJhcHByb3ZhbC1jaGFpbnNcIj5cbiAgICAgICAgICA8QXBwcm92YWxDaGFpblNldHRpbmdzIC8+XG4gICAgICAgIDwvVGFic0NvbnRlbnQ+XG5cbiAgICAgICAgey8qIOiuoumYheeuoeeQhiAqL31cbiAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwic3Vic2NyaXB0aW9uXCI+XG4gICAgICAgICAgPFN1YnNjcmlwdGlvblBhbmVsIC8+XG4gICAgICAgIDwvVGFic0NvbnRlbnQ+XG5cbiAgICAgICAgey8qIOmAmuefpeWBj+Wlveiuvue9riAqL31cbiAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwibm90aWZpY2F0aW9uc1wiPlxuICAgICAgICAgIDxOb3RpZmljYXRpb25QcmVmZXJlbmNlQ2FyZFxuICAgICAgICAgICAgcHVzaFN1cHBvcnRlZD17cHVzaFN1cHBvcnRlZH1cbiAgICAgICAgICAgIGlzU3Vic2NyaWJlZD17aXNTdWJzY3JpYmVkfVxuICAgICAgICAgICAgcGVybWlzc2lvbj17cGVybWlzc2lvbn1cbiAgICAgICAgICAgIG9uU3Vic2NyaWJlPXtzdWJzY3JpYmV9XG4gICAgICAgICAgICBvblVuc3Vic2NyaWJlPXt1bnN1YnNjcmliZX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1RhYnNDb250ZW50PlxuXG4gICAgICAgIHsvKiDlronlhajkuI4gTUZBIOiuvue9riAqL31cbiAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwic2VjdXJpdHlcIj5cbiAgICAgICAgICA8TWZhU2V0dGluZ3NQYW5lbCAvPlxuICAgICAgICA8L1RhYnNDb250ZW50PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvVGFicz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==