import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/IntegrationSettings.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport10_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "/src/components/ui/tabs.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { useIntegrations, useUpdateIntegration, useTestIntegration } from "/src/hooks/useIntegration.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/IntegrationSettings.tsx";
import __vite__cjsImport10_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 外部集成配置面板
*
* 支持四种外部集成：
* 1. 钉钉 — 自定义机器人 Webhook + ActionCard 消息
* 2. 飞书 — 机器人 Webhook / API 消息 + 审批实例
* 3. Webhook — 通用 HTTP POST + 变量插值 + 签名
* 4. EAM — Maximo REST API 工单同步
*
* 每种集成可独立启用/禁用，配置连接参数，并测试连接。
*/
export function IntegrationSettings() {
	_s();
	const { t } = useTranslation();
	const { data: integrations, isLoading } = useIntegrations();
	const updateMutation = useUpdateIntegration();
	const testMutation = useTestIntegration();
	const [activeTab, setActiveTab] = useState("dingtalk");
	// 钉钉配置状态
	const [dingtalk, setDingtalk] = useState({
		webhookUrl: "",
		secret: "",
		messageType: "actionCard",
		detailUrlTemplate: ""
	});
	// 飞书配置状态
	const [feishu, setFeishu] = useState({
		webhookUrl: "",
		appId: "",
		appSecret: "",
		approvalCode: ""
	});
	// Webhook 配置状态
	const [webhook, setWebhook] = useState({
		url: "",
		secret: "",
		bodyTemplate: ""
	});
	// EAM 配置状态
	const [eam, setEam] = useState({
		type: "maximo",
		endpoint: "",
		apiKey: "",
		username: "",
		password: ""
	});
	/** 保存集成配置 */
	const handleSave = (type, config, enabled) => {
		updateMutation.mutate({
			type,
			enabled,
			config: JSON.stringify(config)
		});
	};
	/** 测试集成连接 */
	const handleTest = (type) => {
		testMutation.mutate(type);
	};
	if (isLoading) {
		return /* @__PURE__ */ _jsxDEV("p", {
			className: "text-center text-muted-foreground py-8",
			children: t("common.loading")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 65,
			columnNumber: 12
		}, this);
	}
	const dingtalkEnabled = integrations?.dingtalk?.enabled ?? false;
	const feishuEnabled = integrations?.feishu?.enabled ?? false;
	const webhookEnabled = integrations?.webhook?.enabled ?? false;
	const eamEnabled = integrations?.eam?.enabled ?? false;
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("settings.integration") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 76,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("settings.integrationDesc") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 77,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: [
		/* @__PURE__ */ _jsxDEV(Tabs, {
			value: activeTab,
			onValueChange: setActiveTab,
			children: [
				/* @__PURE__ */ _jsxDEV(TabsList, {
					className: "grid grid-cols-4 w-full",
					children: [
						/* @__PURE__ */ _jsxDEV(TabsTrigger, {
							value: "dingtalk",
							children: "钉钉"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 82,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(TabsTrigger, {
							value: "feishu",
							children: "飞书"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(TabsTrigger, {
							value: "webhook",
							children: "Webhook"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(TabsTrigger, {
							value: "eam",
							children: "EAM"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 85,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 81,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "dingtalk",
					className: "space-y-4 mt-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2",
							children: /* @__PURE__ */ _jsxDEV(Badge, {
								variant: dingtalkEnabled ? "default" : "outline",
								children: dingtalkEnabled ? "已启用" : "未启用"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 92,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => handleTest("dingtalk"),
								disabled: testMutation.isPending,
								children: testMutation.isPending ? "测试中..." : "测试连接"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 97,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: dingtalkEnabled ? "destructive" : "default",
								onClick: () => handleSave("dingtalk", dingtalk, !dingtalkEnabled),
								disabled: updateMutation.isPending,
								children: dingtalkEnabled ? "禁用" : "启用并保存"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 105,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 96,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "Webhook URL *" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 117,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: "https://oapi.dingtalk.com/robot/send?access_token=...",
									value: dingtalk.webhookUrl,
									onChange: (e) => setDingtalk({
										...dingtalk,
										webhookUrl: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 118,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 116,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "加签密钥（可选）" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 125,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									type: "password",
									placeholder: "SEC...",
									value: dingtalk.secret,
									onChange: (e) => setDingtalk({
										...dingtalk,
										secret: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 126,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 124,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "消息类型" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 134,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("select", {
									className: "w-full rounded-md border bg-background px-3 py-2 text-sm",
									value: dingtalk.messageType,
									onChange: (e) => setDingtalk({
										...dingtalk,
										messageType: e.target.value
									}),
									children: [/* @__PURE__ */ _jsxDEV("option", {
										value: "actionCard",
										children: "ActionCard（推荐）"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 140,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV("option", {
										value: "markdown",
										children: "Markdown"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 141,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 135,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 133,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "工单详情页 URL 模板（可选）" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 145,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: "https://equipsense.app/work-orders/{{workOrderId}}",
									value: dingtalk.detailUrlTemplate,
									onChange: (e) => setDingtalk({
										...dingtalk,
										detailUrlTemplate: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 146,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 144,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 115,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 89,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "feishu",
					className: "space-y-4 mt-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ _jsxDEV(Badge, {
							variant: feishuEnabled ? "default" : "outline",
							children: feishuEnabled ? "已启用" : "未启用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 158,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => handleTest("feishu"),
								disabled: testMutation.isPending,
								children: testMutation.isPending ? "测试中..." : "测试连接"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 162,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: feishuEnabled ? "destructive" : "default",
								onClick: () => handleSave("feishu", feishu, !feishuEnabled),
								disabled: updateMutation.isPending,
								children: feishuEnabled ? "禁用" : "启用并保存"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 170,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 161,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 157,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "机器人 Webhook URL（推荐，简单模式）" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 182,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: "https://open.feishu.cn/open-apis/bot/v2/hook/...",
									value: feishu.webhookUrl,
									onChange: (e) => setFeishu({
										...feishu,
										webhookUrl: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 183,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 181,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 189,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: "以下为 API 模式配置（如需审批实例则必填）："
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 190,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "grid gap-4 md:grid-cols-2",
								children: [/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: "App ID" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 193,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										placeholder: "cli_xxxxxxxx",
										value: feishu.appId,
										onChange: (e) => setFeishu({
											...feishu,
											appId: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 194,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 192,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: "App Secret" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 201,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										type: "password",
										value: feishu.appSecret,
										onChange: (e) => setFeishu({
											...feishu,
											appSecret: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 202,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 200,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 191,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "审批定义 Code（可选，用于创建审批实例）" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 210,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: t("settings.getFromFeishu", "从飞书审批管理中获取"),
									value: feishu.approvalCode,
									onChange: (e) => setFeishu({
										...feishu,
										approvalCode: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 211,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 209,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 180,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 156,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "webhook",
					className: "space-y-4 mt-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ _jsxDEV(Badge, {
							variant: webhookEnabled ? "default" : "outline",
							children: webhookEnabled ? "已启用" : "未启用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 223,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => handleTest("webhook"),
								disabled: testMutation.isPending,
								children: testMutation.isPending ? "测试中..." : "测试连接"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 227,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: webhookEnabled ? "destructive" : "default",
								onClick: () => handleSave("webhook", webhook, !webhookEnabled),
								disabled: updateMutation.isPending,
								children: webhookEnabled ? "禁用" : "启用并保存"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 235,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 226,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 222,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "Webhook URL *" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 247,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: "https://your-server.com/api/webhook",
									value: webhook.url,
									onChange: (e) => setWebhook({
										...webhook,
										url: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 248,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 246,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "签名密钥（可选，设置后自动添加 X-EquipSense-Signature 头）" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 255,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									type: "password",
									value: webhook.secret,
									onChange: (e) => setWebhook({
										...webhook,
										secret: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 256,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 254,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ _jsxDEV(Label, { children: "Body 模板（可选，支持变量插值）" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 263,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("p", {
										className: "text-xs text-muted-foreground",
										children: [
											"可用变量: ",
											"{{workOrder.code}}",
											", ",
											"{{workOrder.title}}",
											", ",
											"{{workOrder.priority}}",
											", ",
											"{{workOrder.status}}",
											", ",
											"{{timestamp}}"
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 264,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ _jsxDEV("textarea", {
										className: "w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono",
										placeholder: "{\"event\": \"work_order.created\", \"code\": \"{{workOrder.code}}\", \"title\": \"{{workOrder.title}}\"}",
										value: webhook.bodyTemplate,
										onChange: (e) => setWebhook({
											...webhook,
											bodyTemplate: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 267,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 262,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 245,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 221,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "eam",
					className: "space-y-4 mt-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ _jsxDEV(Badge, {
							variant: eamEnabled ? "default" : "outline",
							children: eamEnabled ? "已启用" : "未启用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 280,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => handleTest("eam"),
								disabled: testMutation.isPending,
								children: testMutation.isPending ? "测试中..." : "测试连接"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 284,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								size: "sm",
								variant: eamEnabled ? "destructive" : "default",
								onClick: () => handleSave("eam", eam, !eamEnabled),
								disabled: updateMutation.isPending,
								children: eamEnabled ? "禁用" : "启用并保存"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 292,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 283,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 279,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "EAM 系统类型" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 304,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("select", {
									className: "w-full rounded-md border bg-background px-3 py-2 text-sm",
									value: eam.type,
									onChange: (e) => setEam({
										...eam,
										type: e.target.value
									}),
									children: [
										/* @__PURE__ */ _jsxDEV("option", {
											value: "maximo",
											children: "IBM Maximo"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 310,
											columnNumber: 19
										}, this),
										/* @__PURE__ */ _jsxDEV("option", {
											value: "sap_pm",
											children: "SAP PM"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 311,
											columnNumber: 19
										}, this),
										/* @__PURE__ */ _jsxDEV("option", {
											value: "custom",
											children: "自定义 REST API"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 312,
											columnNumber: 19
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 305,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 303,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "REST API 端点 *" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 316,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									placeholder: "https://maximo.example.com/maximo/oslc",
									value: eam.endpoint,
									onChange: (e) => setEam({
										...eam,
										endpoint: e.target.value
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 317,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 315,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "grid gap-4 md:grid-cols-2",
								children: [/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: "API Key" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 325,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										type: "password",
										value: eam.apiKey,
										onChange: (e) => setEam({
											...eam,
											apiKey: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 326,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 324,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: "或 Basic Auth" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 333,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV("div", {
										className: "grid grid-cols-2 gap-2",
										children: [/* @__PURE__ */ _jsxDEV(Input, {
											placeholder: t("auth.username", "用户名"),
											value: eam.username,
											onChange: (e) => setEam({
												...eam,
												username: e.target.value
											})
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 335,
											columnNumber: 21
										}, this), /* @__PURE__ */ _jsxDEV(Input, {
											type: "password",
											placeholder: t("auth.password", "密码"),
											value: eam.password,
											onChange: (e) => setEam({
												...eam,
												password: e.target.value
											})
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 340,
											columnNumber: 21
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 334,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 332,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 323,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 302,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 278,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 80,
			columnNumber: 9
		}, this),
		testMutation.data && /* @__PURE__ */ _jsxDEV("div", {
			className: `mt-4 rounded-lg border p-3 ${testMutation.data.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`,
			children: [
				/* @__PURE__ */ _jsxDEV("p", {
					className: `text-sm font-medium ${testMutation.data.success ? "text-green-600" : "text-red-600"}`,
					children: testMutation.data.message
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 356,
					columnNumber: 13
				}, this),
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-xs text-muted-foreground mt-1",
					children: [
						"耗时: ",
						testMutation.data.durationMs,
						"ms"
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 359,
					columnNumber: 13
				}, this),
				testMutation.data.details && /* @__PURE__ */ _jsxDEV("pre", {
					className: "mt-2 rounded bg-muted p-2 text-xs overflow-x-auto",
					children: testMutation.data.details
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 363,
					columnNumber: 15
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 355,
			columnNumber: 11
		}, this),
		testMutation.isError && /* @__PURE__ */ _jsxDEV("div", {
			className: "mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3",
			children: /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-red-600",
				children: ["测试失败: ", testMutation.error?.message || "未知错误"]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 372,
				columnNumber: 13
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 371,
			columnNumber: 11
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 74,
		columnNumber: 5
	}, this);
}
_s(IntegrationSettings, "c8qiMIGYCDsh2vSn1L1NGrj9FYw=", false, function() {
	return [
		useTranslation,
		useIntegrations,
		useUpdateIntegration,
		useTestIntegration
	];
});
_c = IntegrationSettings;
var _c;
$RefreshReg$(_c, "IntegrationSettings");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/IntegrationSettings.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/IntegrationSettings.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/IntegrationSettings.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/IntegrationSettings.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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LHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQ1osYUFBYSxLQUFLO0lBQ2hCOzs7OztHQUVKOzs7Ozs7RUFHTixhQUFhLFdBQ1osd0JBQUMsT0FBRDtHQUFLLFdBQVU7YUFDYix3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFiLENBQW9DLFVBQVEsYUFBYSxPQUFpQixXQUFXLE1BQVU7Ozs7OztFQUM1Rjs7Ozs7Q0FFSTs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkludGVncmF0aW9uU2V0dGluZ3MudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2NhcmQnO1xuaW1wb3J0IHsgVGFicywgVGFic0NvbnRlbnQsIFRhYnNMaXN0LCBUYWJzVHJpZ2dlciB9IGZyb20gJy4uL3VpL3RhYnMnO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL3VpL2xhYmVsJztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBCYWRnZSB9IGZyb20gJy4uL3VpL2JhZGdlJztcbmltcG9ydCB7IFNlcGFyYXRvciB9IGZyb20gJy4uL3VpL3NlcGFyYXRvcic7XG5pbXBvcnQgeyB1c2VJbnRlZ3JhdGlvbnMsIHVzZVVwZGF0ZUludGVncmF0aW9uLCB1c2VUZXN0SW50ZWdyYXRpb24gfSBmcm9tICcuLi8uLi9ob29rcy91c2VJbnRlZ3JhdGlvbic7XG5cbi8qKlxuICog5aSW6YOo6ZuG5oiQ6YWN572u6Z2i5p2/XG4gKlxuICog5pSv5oyB5Zub56eN5aSW6YOo6ZuG5oiQ77yaXG4gKiAxLiDpkonpkokg4oCUIOiHquWumuS5ieacuuWZqOS6uiBXZWJob29rICsgQWN0aW9uQ2FyZCDmtojmga9cbiAqIDIuIOmjnuS5piDigJQg5py65Zmo5Lq6IFdlYmhvb2sgLyBBUEkg5raI5oGvICsg5a6h5om55a6e5L6LXG4gKiAzLiBXZWJob29rIOKAlCDpgJrnlKggSFRUUCBQT1NUICsg5Y+Y6YeP5o+S5YC8ICsg562+5ZCNXG4gKiA0LiBFQU0g4oCUIE1heGltbyBSRVNUIEFQSSDlt6XljZXlkIzmraVcbiAqXG4gKiDmr4/np43pm4bmiJDlj6/ni6znq4vlkK/nlKgv56aB55So77yM6YWN572u6L+e5o6l5Y+C5pWw77yM5bm25rWL6K+V6L+e5o6l44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBJbnRlZ3JhdGlvblNldHRpbmdzKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHsgZGF0YTogaW50ZWdyYXRpb25zLCBpc0xvYWRpbmcgfSA9IHVzZUludGVncmF0aW9ucygpO1xuICBjb25zdCB1cGRhdGVNdXRhdGlvbiA9IHVzZVVwZGF0ZUludGVncmF0aW9uKCk7XG4gIGNvbnN0IHRlc3RNdXRhdGlvbiA9IHVzZVRlc3RJbnRlZ3JhdGlvbigpO1xuICBjb25zdCBbYWN0aXZlVGFiLCBzZXRBY3RpdmVUYWJdID0gdXNlU3RhdGUoJ2Rpbmd0YWxrJyk7XG5cbiAgLy8g6ZKJ6ZKJ6YWN572u54q25oCBXG4gIGNvbnN0IFtkaW5ndGFsaywgc2V0RGluZ3RhbGtdID0gdXNlU3RhdGUoe1xuICAgIHdlYmhvb2tVcmw6ICcnLCBzZWNyZXQ6ICcnLCBtZXNzYWdlVHlwZTogJ2FjdGlvbkNhcmQnLCBkZXRhaWxVcmxUZW1wbGF0ZTogJycsXG4gIH0pO1xuXG4gIC8vIOmjnuS5pumFjee9rueKtuaAgVxuICBjb25zdCBbZmVpc2h1LCBzZXRGZWlzaHVdID0gdXNlU3RhdGUoe1xuICAgIHdlYmhvb2tVcmw6ICcnLCBhcHBJZDogJycsIGFwcFNlY3JldDogJycsIGFwcHJvdmFsQ29kZTogJycsXG4gIH0pO1xuXG4gIC8vIFdlYmhvb2sg6YWN572u54q25oCBXG4gIGNvbnN0IFt3ZWJob29rLCBzZXRXZWJob29rXSA9IHVzZVN0YXRlKHtcbiAgICB1cmw6ICcnLCBzZWNyZXQ6ICcnLCBib2R5VGVtcGxhdGU6ICcnLFxuICB9KTtcblxuICAvLyBFQU0g6YWN572u54q25oCBXG4gIGNvbnN0IFtlYW0sIHNldEVhbV0gPSB1c2VTdGF0ZSh7XG4gICAgdHlwZTogJ21heGltbycsIGVuZHBvaW50OiAnJywgYXBpS2V5OiAnJywgdXNlcm5hbWU6ICcnLCBwYXNzd29yZDogJycsXG4gIH0pO1xuXG4gIC8qKiDkv53lrZjpm4bmiJDphY3nva4gKi9cbiAgY29uc3QgaGFuZGxlU2F2ZSA9ICh0eXBlOiBzdHJpbmcsIGNvbmZpZzogb2JqZWN0LCBlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gICAgdXBkYXRlTXV0YXRpb24ubXV0YXRlKHtcbiAgICAgIHR5cGUsXG4gICAgICBlbmFibGVkLFxuICAgICAgY29uZmlnOiBKU09OLnN0cmluZ2lmeShjb25maWcpLFxuICAgIH0pO1xuICB9O1xuXG4gIC8qKiDmtYvor5Xpm4bmiJDov57mjqUgKi9cbiAgY29uc3QgaGFuZGxlVGVzdCA9ICh0eXBlOiBzdHJpbmcpID0+IHtcbiAgICB0ZXN0TXV0YXRpb24ubXV0YXRlKHR5cGUpO1xuICB9O1xuXG4gIGlmIChpc0xvYWRpbmcpIHtcbiAgICByZXR1cm4gPHAgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHB5LThcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L3A+O1xuICB9XG5cbiAgY29uc3QgZGluZ3RhbGtFbmFibGVkID0gaW50ZWdyYXRpb25zPy5kaW5ndGFsaz8uZW5hYmxlZCA/PyBmYWxzZTtcbiAgY29uc3QgZmVpc2h1RW5hYmxlZCA9IGludGVncmF0aW9ucz8uZmVpc2h1Py5lbmFibGVkID8/IGZhbHNlO1xuICBjb25zdCB3ZWJob29rRW5hYmxlZCA9IGludGVncmF0aW9ucz8ud2ViaG9vaz8uZW5hYmxlZCA/PyBmYWxzZTtcbiAgY29uc3QgZWFtRW5hYmxlZCA9IGludGVncmF0aW9ucz8uZWFtPy5lbmFibGVkID8/IGZhbHNlO1xuXG4gIHJldHVybiAoXG4gICAgPENhcmQ+XG4gICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRUaXRsZT57dCgnc2V0dGluZ3MuaW50ZWdyYXRpb24nKX08L0NhcmRUaXRsZT5cbiAgICAgICAgPENhcmREZXNjcmlwdGlvbj57dCgnc2V0dGluZ3MuaW50ZWdyYXRpb25EZXNjJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgIDxUYWJzIHZhbHVlPXthY3RpdmVUYWJ9IG9uVmFsdWVDaGFuZ2U9e3NldEFjdGl2ZVRhYn0+XG4gICAgICAgICAgPFRhYnNMaXN0IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTQgdy1mdWxsXCI+XG4gICAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJkaW5ndGFsa1wiPumSiemSiTwvVGFic1RyaWdnZXI+XG4gICAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJmZWlzaHVcIj7po57kuaY8L1RhYnNUcmlnZ2VyPlxuICAgICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwid2ViaG9va1wiPldlYmhvb2s8L1RhYnNUcmlnZ2VyPlxuICAgICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwiZWFtXCI+RUFNPC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgICA8L1RhYnNMaXN0PlxuXG4gICAgICAgICAgey8qIOmSiemSiembhuaIkCAqL31cbiAgICAgICAgICA8VGFic0NvbnRlbnQgdmFsdWU9XCJkaW5ndGFsa1wiIGNsYXNzTmFtZT1cInNwYWNlLXktNCBtdC00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9e2Rpbmd0YWxrRW5hYmxlZCA/IFwiZGVmYXVsdFwiIDogXCJvdXRsaW5lXCJ9PlxuICAgICAgICAgICAgICAgICAge2Rpbmd0YWxrRW5hYmxlZCA/ICflt7LlkK/nlKgnIDogJ+acquWQr+eUqCd9XG4gICAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICB2YXJpYW50PVwib3V0bGluZVwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVUZXN0KCdkaW5ndGFsaycpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmcgPyAn5rWL6K+V5LitLi4uJyA6ICfmtYvor5Xov57mjqUnfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICB2YXJpYW50PXtkaW5ndGFsa0VuYWJsZWQgPyBcImRlc3RydWN0aXZlXCIgOiBcImRlZmF1bHRcIn1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNhdmUoJ2Rpbmd0YWxrJywgZGluZ3RhbGssICFkaW5ndGFsa0VuYWJsZWQpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7ZGluZ3RhbGtFbmFibGVkID8gJ+emgeeUqCcgOiAn5ZCv55So5bm25L+d5a2YJ31cbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD5XZWJob29rIFVSTCAqPC9MYWJlbD5cbiAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiaHR0cHM6Ly9vYXBpLmRpbmd0YWxrLmNvbS9yb2JvdC9zZW5kP2FjY2Vzc190b2tlbj0uLi5cIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2Rpbmd0YWxrLndlYmhvb2tVcmx9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldERpbmd0YWxrKHsgLi4uZGluZ3RhbGssIHdlYmhvb2tVcmw6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD7liqDnrb7lr4bpkqXvvIjlj6/pgInvvIk8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU0VDLi4uXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtkaW5ndGFsay5zZWNyZXR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldERpbmd0YWxrKHsgLi4uZGluZ3RhbGssIHNlY3JldDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAgPExhYmVsPua2iOaBr+exu+WeizwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHJvdW5kZWQtbWQgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMyBweS0yIHRleHQtc21cIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2Rpbmd0YWxrLm1lc3NhZ2VUeXBlfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXREaW5ndGFsayh7IC4uLmRpbmd0YWxrLCBtZXNzYWdlVHlwZTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFjdGlvbkNhcmRcIj5BY3Rpb25DYXJk77yI5o6o6I2Q77yJPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibWFya2Rvd25cIj5NYXJrZG93bjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+5bel5Y2V6K+m5oOF6aG1IFVSTCDmqKHmnb/vvIjlj6/pgInvvIk8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJodHRwczovL2VxdWlwc2Vuc2UuYXBwL3dvcmstb3JkZXJzL3t7d29ya09yZGVySWR9fVwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17ZGluZ3RhbGsuZGV0YWlsVXJsVGVtcGxhdGV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldERpbmd0YWxrKHsgLi4uZGluZ3RhbGssIGRldGFpbFVybFRlbXBsYXRlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvVGFic0NvbnRlbnQ+XG5cbiAgICAgICAgICB7Lyog6aOe5Lmm6ZuG5oiQICovfVxuICAgICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cImZlaXNodVwiIGNsYXNzTmFtZT1cInNwYWNlLXktNCBtdC00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17ZmVpc2h1RW5hYmxlZCA/IFwiZGVmYXVsdFwiIDogXCJvdXRsaW5lXCJ9PlxuICAgICAgICAgICAgICAgIHtmZWlzaHVFbmFibGVkID8gJ+W3suWQr+eUqCcgOiAn5pyq5ZCv55SoJ31cbiAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgc2l6ZT1cInNtXCJcbiAgICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJvdXRsaW5lXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVRlc3QoJ2ZlaXNodScpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmcgPyAn5rWL6K+V5LitLi4uJyA6ICfmtYvor5Xov57mjqUnfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICB2YXJpYW50PXtmZWlzaHVFbmFibGVkID8gXCJkZXN0cnVjdGl2ZVwiIDogXCJkZWZhdWx0XCJ9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVTYXZlKCdmZWlzaHUnLCBmZWlzaHUsICFmZWlzaHVFbmFibGVkKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt1cGRhdGVNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2ZlaXNodUVuYWJsZWQgPyAn56aB55SoJyA6ICflkK/nlKjlubbkv53lrZgnfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAgPExhYmVsPuacuuWZqOS6uiBXZWJob29rIFVSTO+8iOaOqOiNkO+8jOeugOWNleaooeW8j++8iTwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImh0dHBzOi8vb3Blbi5mZWlzaHUuY24vb3Blbi1hcGlzL2JvdC92Mi9ob29rLy4uLlwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17ZmVpc2h1LndlYmhvb2tVcmx9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZlaXNodSh7IC4uLmZlaXNodSwgd2ViaG9va1VybDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxTZXBhcmF0b3IgLz5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7ku6XkuIvkuLogQVBJIOaooeW8j+mFjee9ru+8iOWmgumcgOWuoeaJueWunuS+i+WImeW/heWhq++8ie+8mjwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00IG1kOmdyaWQtY29scy0yXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxMYWJlbD5BcHAgSUQ8L0xhYmVsPlxuICAgICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiY2xpX3h4eHh4eHh4XCJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2ZlaXNodS5hcHBJZH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGZWlzaHUoeyAuLi5mZWlzaHUsIGFwcElkOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxMYWJlbD5BcHAgU2VjcmV0PC9MYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZmVpc2h1LmFwcFNlY3JldH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGZWlzaHUoeyAuLi5mZWlzaHUsIGFwcFNlY3JldDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+5a6h5om55a6a5LmJIENvZGXvvIjlj6/pgInvvIznlKjkuo7liJvlu7rlrqHmibnlrp7kvovvvIk8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoXCJzZXR0aW5ncy5nZXRGcm9tRmVpc2h1XCIsIFwi5LuO6aOe5Lmm5a6h5om5566h55CG5Lit6I635Y+WXCIpfVxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2ZlaXNodS5hcHByb3ZhbENvZGV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZlaXNodSh7IC4uLmZlaXNodSwgYXBwcm92YWxDb2RlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvVGFic0NvbnRlbnQ+XG5cbiAgICAgICAgICB7LyogV2ViaG9vayDpm4bmiJAgKi99XG4gICAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwid2ViaG9va1wiIGNsYXNzTmFtZT1cInNwYWNlLXktNCBtdC00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17d2ViaG9va0VuYWJsZWQgPyBcImRlZmF1bHRcIiA6IFwib3V0bGluZVwifT5cbiAgICAgICAgICAgICAgICB7d2ViaG9va0VuYWJsZWQgPyAn5bey5ZCv55SoJyA6ICfmnKrlkK/nlKgnfVxuICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgdmFyaWFudD1cIm91dGxpbmVcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlVGVzdCgnd2ViaG9vaycpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3Rlc3RNdXRhdGlvbi5pc1BlbmRpbmcgPyAn5rWL6K+V5LitLi4uJyA6ICfmtYvor5Xov57mjqUnfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICB2YXJpYW50PXt3ZWJob29rRW5hYmxlZCA/IFwiZGVzdHJ1Y3RpdmVcIiA6IFwiZGVmYXVsdFwifVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU2F2ZSgnd2ViaG9vaycsIHdlYmhvb2ssICF3ZWJob29rRW5hYmxlZCl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dXBkYXRlTXV0YXRpb24uaXNQZW5kaW5nfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHt3ZWJob29rRW5hYmxlZCA/ICfnpoHnlKgnIDogJ+WQr+eUqOW5tuS/neWtmCd9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+V2ViaG9vayBVUkwgKjwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImh0dHBzOi8veW91ci1zZXJ2ZXIuY29tL2FwaS93ZWJob29rXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt3ZWJob29rLnVybH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0V2ViaG9vayh7IC4uLndlYmhvb2ssIHVybDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAgPExhYmVsPuetvuWQjeWvhumSpe+8iOWPr+mAie+8jOiuvue9ruWQjuiHquWKqOa3u+WKoCBYLUVxdWlwU2Vuc2UtU2lnbmF0dXJlIOWktO+8iTwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e3dlYmhvb2suc2VjcmV0fVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRXZWJob29rKHsgLi4ud2ViaG9vaywgc2VjcmV0OiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+Qm9keSDmqKHmnb/vvIjlj6/pgInvvIzmlK/mjIHlj5jph4/mj5LlgLzvvIk8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICDlj6/nlKjlj5jph486IHsne3t3b3JrT3JkZXIuY29kZX19J30sIHsne3t3b3JrT3JkZXIudGl0bGV9fSd9LCB7J3t7d29ya09yZGVyLnByaW9yaXR5fX0nfSwgeyd7e3dvcmtPcmRlci5zdGF0dXN9fSd9LCB7J3t7dGltZXN0YW1wfX0nfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBtaW4taC1bMTAwcHhdIHJvdW5kZWQtbWQgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMyBweS0yIHRleHQtc20gZm9udC1tb25vXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXsne1wiZXZlbnRcIjogXCJ3b3JrX29yZGVyLmNyZWF0ZWRcIiwgXCJjb2RlXCI6IFwie3t3b3JrT3JkZXIuY29kZX19XCIsIFwidGl0bGVcIjogXCJ7e3dvcmtPcmRlci50aXRsZX19XCJ9J31cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt3ZWJob29rLmJvZHlUZW1wbGF0ZX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0V2ViaG9vayh7IC4uLndlYmhvb2ssIGJvZHlUZW1wbGF0ZTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L1RhYnNDb250ZW50PlxuXG4gICAgICAgICAgey8qIEVBTSDpm4bmiJAgKi99XG4gICAgICAgICAgPFRhYnNDb250ZW50IHZhbHVlPVwiZWFtXCIgY2xhc3NOYW1lPVwic3BhY2UteS00IG10LTRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PXtlYW1FbmFibGVkID8gXCJkZWZhdWx0XCIgOiBcIm91dGxpbmVcIn0+XG4gICAgICAgICAgICAgICAge2VhbUVuYWJsZWQgPyAn5bey5ZCv55SoJyA6ICfmnKrlkK/nlKgnfVxuICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgdmFyaWFudD1cIm91dGxpbmVcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlVGVzdCgnZWFtJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGVzdE11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7dGVzdE11dGF0aW9uLmlzUGVuZGluZyA/ICfmtYvor5XkuK0uLi4nIDogJ+a1i+ivlei/nuaOpSd9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgc2l6ZT1cInNtXCJcbiAgICAgICAgICAgICAgICAgIHZhcmlhbnQ9e2VhbUVuYWJsZWQgPyBcImRlc3RydWN0aXZlXCIgOiBcImRlZmF1bHRcIn1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNhdmUoJ2VhbScsIGVhbSwgIWVhbUVuYWJsZWQpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7ZWFtRW5hYmxlZCA/ICfnpoHnlKgnIDogJ+WQr+eUqOW5tuS/neWtmCd9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+RUFNIOezu+e7n+exu+WeizwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHJvdW5kZWQtbWQgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMyBweS0yIHRleHQtc21cIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2VhbS50eXBlfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFYW0oeyAuLi5lYW0sIHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJtYXhpbW9cIj5JQk0gTWF4aW1vPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2FwX3BtXCI+U0FQIFBNPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3VzdG9tXCI+6Ieq5a6a5LmJIFJFU1QgQVBJPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD5SRVNUIEFQSSDnq6/ngrkgKjwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImh0dHBzOi8vbWF4aW1vLmV4YW1wbGUuY29tL21heGltby9vc2xjXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlYW0uZW5kcG9pbnR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVhbSh7IC4uLmVhbSwgZW5kcG9pbnQ6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTQgbWQ6Z3JpZC1jb2xzLTJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgPExhYmVsPkFQSSBLZXk8L0xhYmVsPlxuICAgICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlYW0uYXBpS2V5fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVhbSh7IC4uLmVhbSwgYXBpS2V5OiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxMYWJlbD7miJYgQmFzaWMgQXV0aDwvTGFiZWw+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoXCJhdXRoLnVzZXJuYW1lXCIsIFwi55So5oi35ZCNXCIpfVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlYW0udXNlcm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFYW0oeyAuLi5lYW0sIHVzZXJuYW1lOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcImF1dGgucGFzc3dvcmRcIiwgXCLlr4bnoIFcIil9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VhbS5wYXNzd29yZH1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVhbSh7IC4uLmVhbSwgcGFzc3dvcmQ6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9UYWJzQ29udGVudD5cbiAgICAgICAgPC9UYWJzPlxuXG4gICAgICAgIHsvKiDmtYvor5Xnu5PmnpzmmL7npLogKi99XG4gICAgICAgIHt0ZXN0TXV0YXRpb24uZGF0YSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BtdC00IHJvdW5kZWQtbGcgYm9yZGVyIHAtMyAke3Rlc3RNdXRhdGlvbi5kYXRhLnN1Y2Nlc3MgPyAnYm9yZGVyLWdyZWVuLTUwMC8zMCBiZy1ncmVlbi01MDAvNScgOiAnYm9yZGVyLXJlZC01MDAvMzAgYmctcmVkLTUwMC81J31gfT5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT17YHRleHQtc20gZm9udC1tZWRpdW0gJHt0ZXN0TXV0YXRpb24uZGF0YS5zdWNjZXNzID8gJ3RleHQtZ3JlZW4tNjAwJyA6ICd0ZXh0LXJlZC02MDAnfWB9PlxuICAgICAgICAgICAgICB7dGVzdE11dGF0aW9uLmRhdGEubWVzc2FnZX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cbiAgICAgICAgICAgICAg6ICX5pe2OiB7dGVzdE11dGF0aW9uLmRhdGEuZHVyYXRpb25Nc31tc1xuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAge3Rlc3RNdXRhdGlvbi5kYXRhLmRldGFpbHMgJiYgKFxuICAgICAgICAgICAgICA8cHJlIGNsYXNzTmFtZT1cIm10LTIgcm91bmRlZCBiZy1tdXRlZCBwLTIgdGV4dC14cyBvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAgICAgICAgICB7dGVzdE11dGF0aW9uLmRhdGEuZGV0YWlsc31cbiAgICAgICAgICAgICAgPC9wcmU+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHt0ZXN0TXV0YXRpb24uaXNFcnJvciAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC00IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1yZWQtNTAwLzMwIGJnLXJlZC01MDAvNSBwLTNcIj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1yZWQtNjAwXCI+5rWL6K+V5aSx6LSlOiB7KHRlc3RNdXRhdGlvbi5lcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgJ+acquefpemUmeivryd9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=