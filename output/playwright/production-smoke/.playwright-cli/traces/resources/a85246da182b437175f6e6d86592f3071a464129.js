import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/DeviceDetailPage.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport25_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport25_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useParams, useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { ArrowLeft, Plug, Network, Radio, Loader2, RefreshCw, Pencil, Trash2, Check, X } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "/src/components/ui/tabs.tsx";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from "/src/components/ui/dialog.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Textarea } from "/src/components/ui/textarea.tsx";
import { Switch } from "/src/components/ui/switch.tsx";
import { DeviceStatusBadge } from "/src/components/device/DeviceStatusBadge.tsx";
import { TrendChart } from "/src/components/charts/TrendChart.tsx";
import { SeverityBadge } from "/src/components/alert/SeverityBadge.tsx";
import { DataQualityOverviewCard } from "/src/components/dataquality/DataQualityOverview.tsx";
import { useDevice, useUpdateDevice, useRefreshHealthScore } from "/src/hooks/useDevices.ts";
import { useTelemetry } from "/src/hooks/useTelemetry.ts";
import { useAlerts } from "/src/hooks/useAlerts.ts";
import { useGatewayDevices, useUpdateGatewayDevice, useDeleteGatewayDevice, useTestConnection, useCreateGatewayDevice } from "/src/hooks/useGatewayDevices.ts";
import { formatDate } from "/src/lib/utils.ts";
import { useGateways } from "/src/hooks/useGateways.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceDetailPage.tsx";
import __vite__cjsImport25_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$();
/** 协议显示映射 */
const protocolMeta = {
	opcua: {
		label: "OPC UA",
		icon: /* @__PURE__ */ _jsxDEV(Plug, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 36,
			columnNumber: 35
		}, this),
		color: "bg-blue-500/10 text-blue-600"
	},
	"modbus-tcp": {
		label: "Modbus TCP",
		icon: /* @__PURE__ */ _jsxDEV(Network, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 37,
			columnNumber: 46
		}, this),
		color: "bg-green-500/10 text-green-600"
	},
	"modbus-rtu": {
		label: "Modbus RTU",
		icon: /* @__PURE__ */ _jsxDEV(Radio, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 38,
			columnNumber: 46
		}, this),
		color: "bg-orange-500/10 text-orange-600"
	}
};
/** 根据时间范围标识计算起始时间的 ISO 字符串 */
function getTimeRangeStart(range) {
	const now = new Date();
	switch (range) {
		case "1h": return new Date(now.getTime() - 36e5).toISOString();
		case "6h": return new Date(now.getTime() - 216e5).toISOString();
		case "24h": return new Date(now.getTime() - 864e5).toISOString();
		case "7d": return new Date(now.getTime() - 6048e5).toISOString();
		default: return new Date(now.getTime() - 36e5).toISOString();
	}
}
export default function DeviceDetailPage() {
	_s();
	const { t } = useTranslation();
	const { id } = useParams();
	const navigate = useNavigate();
	const [selectedMetric, setSelectedMetric] = useState("temperature");
	const [timeRange, setTimeRange] = useState("1h");
	const { data: device, isLoading } = useDevice(id ?? "");
	const refreshHealth = useRefreshHealthScore();
	const { data: telemetry } = useTelemetry(id ?? "", selectedMetric, getTimeRangeStart(timeRange), new Date().toISOString());
	const { data: alertsData } = useAlerts({
		page: 1,
		pageSize: 20
	}, { deviceId: id });
	if (isLoading) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.loading")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 70,
		columnNumber: 25
	}, this);
	if (!device) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.noData")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 71,
		columnNumber: 23
	}, this);
	const chartData = Array.isArray(telemetry) ? telemetry.map((p) => ({
		time: p.time,
		value: p.value
	})) : [];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ _jsxDEV(Button, {
					variant: "ghost",
					size: "icon",
					onClick: () => navigate("/devices"),
					children: /* @__PURE__ */ _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 82,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 81,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-2xl font-bold",
					children: device.name
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 85,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-muted-foreground",
					children: device.deviceCode
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 86,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 84,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ml-auto flex items-center gap-3",
					children: [/* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 89,
						columnNumber: 11
					}, this), typeof device.healthScore === "number" && /* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-2 rounded-md border px-3 py-1.5",
						children: [
							/* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm text-muted-foreground",
								children: t("device.healthScore", "健康度")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 93,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: `text-lg font-bold ${device.healthScore >= 85 ? "text-green-600" : device.healthScore >= 70 ? "text-blue-600" : device.healthScore >= 50 ? "text-yellow-600" : "text-red-600"}`,
								children: device.healthScore.toFixed(1)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 94,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-7 w-7",
								disabled: refreshHealth.isPending,
								onClick: () => refreshHealth.mutate(device.id),
								title: t("device.refreshHealth", "刷新健康度"),
								children: /* @__PURE__ */ _jsxDEV(RefreshCw, { className: `h-4 w-4 ${refreshHealth.isPending ? "animate-spin" : ""}` }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 109,
									columnNumber: 17
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 101,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 92,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 88,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 80,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV(Tabs, {
			defaultValue: "overview",
			className: "flex gap-6 items-start",
			children: [/* @__PURE__ */ _jsxDEV(TabsList, {
				className: "flex flex-col w-44 shrink-0 bg-muted/50 p-1 gap-0.5",
				children: [/* @__PURE__ */ _jsxDEV(TabsTrigger, {
					value: "overview",
					className: "w-full justify-start px-3",
					children: t("device.tabs.overview")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(TabsTrigger, {
					value: "connection",
					className: "w-full justify-start px-3",
					children: t("device.tabs.connection")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 120,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "flex-1 min-w-0 space-y-4",
				children: [/* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "overview",
					children: /* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ _jsxDEV(DeviceInfoCard, { device }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 128,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, {
								className: "flex flex-row items-center justify-between pb-2",
								children: [/* @__PURE__ */ _jsxDEV(CardTitle, {
									className: "text-base",
									children: t("device.telemetryTrends")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 133,
									columnNumber: 19
								}, this), /* @__PURE__ */ _jsxDEV("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ _jsxDEV(Select, {
										value: selectedMetric,
										onValueChange: (v) => {
											if (v) setSelectedMetric(v);
										},
										children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
											className: "w-32 h-8",
											children: /* @__PURE__ */ _jsxDEV(SelectValue, {}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 136,
												columnNumber: 59
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 136,
											columnNumber: 23
										}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "temperature",
												children: t("telemetry.temperature")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 138,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "pressure",
												children: t("telemetry.pressure")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 139,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "vibration",
												children: t("telemetry.vibration")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 140,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "humidity",
												children: t("telemetry.humidity")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 141,
												columnNumber: 25
											}, this)
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 137,
											columnNumber: 23
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 135,
										columnNumber: 21
									}, this), /* @__PURE__ */ _jsxDEV(Select, {
										value: timeRange,
										onValueChange: (v) => {
											if (v) setTimeRange(v);
										},
										children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
											className: "w-24 h-8",
											children: /* @__PURE__ */ _jsxDEV(SelectValue, {}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 145,
												columnNumber: 59
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 145,
											columnNumber: 23
										}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "1h",
												children: t("time.1hour")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 147,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "6h",
												children: t("time.6hours")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 148,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "24h",
												children: t("time.24hours")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 149,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "7d",
												children: t("time.7days")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 150,
												columnNumber: 25
											}, this)
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 146,
											columnNumber: 23
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 144,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 134,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 132,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: chartData.length > 0 ? /* @__PURE__ */ _jsxDEV(TrendChart, {
								data: chartData,
								height: 300
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 157,
								columnNumber: 21
							}, this) : /* @__PURE__ */ _jsxDEV("div", {
								className: "flex h-[300px] items-center justify-center text-muted-foreground",
								children: t("common.noData")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 159,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 155,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 131,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "grid gap-6 lg:grid-cols-2",
								children: [/* @__PURE__ */ _jsxDEV(DataQualityOverviewCard, { deviceId: device.id }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 166,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
									className: "text-base",
									children: t("device.recentAlerts")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 168,
									columnNumber: 31
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 168,
									columnNumber: 19
								}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.alertCode") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 173,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.metric") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 174,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.value") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 175,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.severity") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 176,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 177,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.time") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 178,
										columnNumber: 27
									}, this)
								] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 172,
									columnNumber: 25
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 171,
									columnNumber: 23
								}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: alertsData?.items.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
									colSpan: 6,
									className: "text-center text-muted-foreground",
									children: t("common.noData")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 183,
									columnNumber: 37
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 183,
									columnNumber: 27
								}, this) : alertsData?.items.map((alert) => /* @__PURE__ */ _jsxDEV(TableRow, { children: [
									/* @__PURE__ */ _jsxDEV(TableCell, {
										className: "font-mono text-sm",
										children: alert.alertCode
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 187,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.metric }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 188,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.value }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 189,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(SeverityBadge, { severity: alert.severity }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 190,
										columnNumber: 42
									}, this) }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 190,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
										variant: "outline",
										children: alert.status
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 191,
										columnNumber: 42
									}, this) }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 191,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, {
										className: "text-sm text-muted-foreground",
										children: new Date(alert.occurredAt).toLocaleString()
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 192,
										columnNumber: 31
									}, this)
								] }, alert.id, true, {
									fileName: _jsxFileName,
									lineNumber: 186,
									columnNumber: 29
								}, this)) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 181,
									columnNumber: 23
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 170,
									columnNumber: 21
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 169,
									columnNumber: 19
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 167,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 165,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 126,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 125,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "connection",
					children: /* @__PURE__ */ _jsxDEV(ConnectionConfigPanel, {
						deviceId: device.id,
						deviceName: device.name
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 206,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 205,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 123,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 117,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 78,
		columnNumber: 5
	}, this);
}
_s(DeviceDetailPage, "tv5zwzg3OVJTr6SUiQS73rRG1CI=", false, function() {
	return [
		useTranslation,
		useParams,
		useNavigate,
		useDevice,
		useRefreshHealthScore,
		useTelemetry,
		useAlerts
	];
});
_c = DeviceDetailPage;
/**
* 连接配置面板
*
* 展示当前设备关联的网关采集配置，支持编辑、测试连接和启停操作。
* 如果设备尚未关联网关设备配置，显示提示信息。
*/
function ConnectionConfigPanel({ deviceId, deviceName }) {
	_s2();
	const { t } = useTranslation();
	const { data: gatewayDevices, isLoading } = useGatewayDevices();
	const updateMutation = useUpdateGatewayDevice();
	const deleteMutation = useDeleteGatewayDevice();
	const testConnMutation = useTestConnection();
	const createMutation = useCreateGatewayDevice();
	/** 查找当前设备关联的网关设备配置 */
	const gwDevice = gatewayDevices?.find((d) => d.deviceId === deviceId);
	const [editTarget, setEditTarget] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [testResult, setTestResult] = useState(null);
	/** 切换启停 */
	const toggleEnabled = (id, current) => {
		updateMutation.mutate({
			id,
			enabled: !current
		});
	};
	/** 测试连接 */
	const runTestConnection = (protocol, connectionConfig) => {
		setTestResult(null);
		testConnMutation.mutate({
			protocol,
			connectionConfig
		}, {
			onSuccess: (result) => setTestResult(result),
			onError: () => setTestResult({
				success: false,
				message: t("device.connection.testFailed")
			})
		});
	};
	/** 保存编辑 */
	const saveEdit = () => {
		if (!editTarget) return;
		updateMutation.mutate({
			id: editTarget.id,
			deviceName: editTarget.deviceName,
			connectionConfig: editTarget.connectionConfig,
			dataPoints: editTarget.dataPoints,
			pollIntervalMs: editTarget.pollIntervalMs
		}, { onSettled: () => setEditTarget(null) });
	};
	/** 确认删除 */
	const confirmDelete = () => {
		if (!deleteTarget) return;
		deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
	};
	if (isLoading) {
		return /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center justify-center py-12",
			children: /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 292,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 291,
			columnNumber: 7
		}, this);
	}
	/** 未关联网关设备配置时，显示创建表单 */
	if (!gwDevice) {
		return /* @__PURE__ */ _jsxDEV(CreateConnectionPanel, {
			deviceId,
			deviceName,
			createMutation,
			testConnMutation
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 299,
			columnNumber: 12
		}, this);
	}
	const proto = protocolMeta[gwDevice.protocol] ?? {
		label: gwDevice.protocol,
		icon: /* @__PURE__ */ _jsxDEV(Plug, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 304,
			columnNumber: 11
		}, this),
		color: "bg-gray-500/10 text-gray-600"
	};
	const dpCount = (() => {
		try {
			const parsed = JSON.parse(gwDevice.dataPoints);
			return typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 0;
		} catch {
			return 0;
		}
	})();
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(CardTitle, {
					className: "text-base",
					children: t("device.connection.title")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 322,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(CardDescription, {
					className: "mt-1",
					children: t("device.connection.description")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 323,
					columnNumber: 15
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 321,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => runTestConnection(gwDevice.protocol, gwDevice.connectionConfig),
						disabled: testConnMutation.isPending,
						children: [testConnMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 332,
							columnNumber: 47
						}, this) : /* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-1 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 332,
							columnNumber: 99
						}, this), t("device.connection.testConnection")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 326,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => setEditTarget({
							id: gwDevice.id,
							deviceName: gwDevice.deviceName,
							connectionConfig: gwDevice.connectionConfig,
							dataPoints: gwDevice.dataPoints,
							pollIntervalMs: gwDevice.pollIntervalMs
						}),
						children: [/* @__PURE__ */ _jsxDEV(Pencil, { className: "mr-1 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 342,
							columnNumber: 17
						}, this), t("common.edit")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 335,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 325,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 320,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 319,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "grid grid-cols-2 gap-4 md:grid-cols-4",
						children: [
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.deviceName")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 352,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: gwDevice.deviceName
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 353,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 351,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.protocol")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 356,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Badge, {
								variant: "outline",
								className: proto.color,
								children: [proto.icon, /* @__PURE__ */ _jsxDEV("span", {
									className: "ml-1",
									children: proto.label
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 359,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 357,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 355,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.pollInterval")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 363,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: [gwDevice.pollIntervalMs, "ms"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 364,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 362,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.dataPoints")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 367,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: dpCount
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 368,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 366,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 350,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-3 pt-2 border-t",
						children: [
							/* @__PURE__ */ _jsxDEV(Switch, {
								checked: gwDevice.enabled,
								onCheckedChange: () => toggleEnabled(gwDevice.id, gwDevice.enabled)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 374,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm text-muted-foreground",
								children: gwDevice.enabled ? t("device.connection.enabled") : t("device.connection.disabled")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 378,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "text-xs text-muted-foreground",
								children: [
									"(",
									t("device.connection.gatewayId"),
									": ",
									gwDevice.gatewayId,
									")"
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 381,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "sm",
								className: "ml-auto text-destructive hover:text-destructive",
								onClick: () => setDeleteTarget(gwDevice.id),
								children: [/* @__PURE__ */ _jsxDEV(Trash2, { className: "mr-1 h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 390,
									columnNumber: 15
								}, this), t("common.delete")]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 384,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 373,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs font-medium text-muted-foreground mb-1",
							children: t("device.connection.connectionConfig")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 398,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("pre", {
							className: "rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-48",
							children: (() => {
								try {
									return JSON.stringify(JSON.parse(gwDevice.connectionConfig), null, 2);
								} catch {
									return gwDevice.connectionConfig;
								}
							})()
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 399,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 397,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs font-medium text-muted-foreground mb-1",
							children: t("device.connection.dataPointMapping")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 404,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("pre", {
							className: "rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-48",
							children: (() => {
								try {
									return JSON.stringify(JSON.parse(gwDevice.dataPoints), null, 2);
								} catch {
									return gwDevice.dataPoints;
								}
							})()
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 405,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 403,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 396,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "text-xs text-muted-foreground",
						children: [
							t("device.connection.createdAt"),
							": ",
							formatDate(gwDevice.createdAt)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 412,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 348,
				columnNumber: 9
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 318,
				columnNumber: 7
			}, this),
			testResult && /* @__PURE__ */ _jsxDEV(Card, {
				className: testResult.success ? "border-green-500/30" : "border-red-500/30",
				children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "flex items-center gap-2 py-3",
					children: [
						/* @__PURE__ */ _jsxDEV(Badge, {
							variant: testResult.success ? "default" : "destructive",
							children: testResult.success ? t("device.connection.testSuccess") : t("device.connection.testFailed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 420,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("span", {
							className: "text-sm",
							children: testResult.message
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 423,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "ghost",
							size: "sm",
							className: "ml-auto",
							onClick: () => setTestResult(null),
							children: t("common.close")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 424,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 419,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 418,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: !!deleteTarget,
				onOpenChange: (open) => !open && setDeleteTarget(null),
				children: /* @__PURE__ */ _jsxDEV(DialogContent, { children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("device.connection.deleteTitle") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 435,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("device.connection.deleteDescription") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 436,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 434,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					onClick: () => setDeleteTarget(null),
					children: t("common.cancel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 439,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					variant: "destructive",
					onClick: confirmDelete,
					disabled: deleteMutation.isPending,
					children: [deleteMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 441,
						columnNumber: 44
					}, this), t("common.delete")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 440,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 438,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 433,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 432,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: !!editTarget,
				onOpenChange: (open) => !open && setEditTarget(null),
				children: /* @__PURE__ */ _jsxDEV(DialogContent, {
					className: "max-w-lg",
					children: [
						/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("device.connection.editTitle") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 452,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("device.connection.editDescription") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 453,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 451,
							columnNumber: 11
						}, this),
						editTarget && /* @__PURE__ */ _jsxDEV("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.deviceName") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 458,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										value: editTarget.deviceName,
										onChange: (e) => setEditTarget({
											...editTarget,
											deviceName: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 459,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 457,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.pollInterval") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 465,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										type: "number",
										value: editTarget.pollIntervalMs,
										onChange: (e) => setEditTarget({
											...editTarget,
											pollIntervalMs: Number(e.target.value)
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 466,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 464,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.connectionConfig") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 473,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
										className: "font-mono text-xs",
										rows: 4,
										value: editTarget.connectionConfig,
										onChange: (e) => setEditTarget({
											...editTarget,
											connectionConfig: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 474,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 472,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.dataPointMapping") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 482,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
										className: "font-mono text-xs",
										rows: 4,
										value: editTarget.dataPoints,
										onChange: (e) => setEditTarget({
											...editTarget,
											dataPoints: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 483,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 481,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 456,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => setEditTarget(null),
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 493,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							onClick: saveEdit,
							disabled: updateMutation.isPending,
							children: [updateMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 495,
								columnNumber: 44
							}, this), t("common.save")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 494,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 492,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 450,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 449,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 316,
		columnNumber: 5
	}, this);
}
_s2(ConnectionConfigPanel, "5hRQf6y0Jh7zcY7mv5kRTtxDTX8=", false, function() {
	return [
		useTranslation,
		useGatewayDevices,
		useUpdateGatewayDevice,
		useDeleteGatewayDevice,
		useTestConnection,
		useCreateGatewayDevice
	];
});
_c2 = ConnectionConfigPanel;
/** 默认连接配置模板 */
const defaultConfigs = {
	opcua: JSON.stringify({
		endpoint: "opc.tcp://localhost:4840",
		securityMode: "None"
	}, null, 2),
	"modbus-tcp": JSON.stringify({
		host: "192.168.1.100",
		port: 502,
		unitId: 1
	}, null, 2),
	"modbus-rtu": JSON.stringify({
		port: "/dev/ttyUSB0",
		baudRate: 9600,
		parity: "none",
		unitId: 1
	}, null, 2)
};
/** 默认数据点模板 */
const defaultDataPoints = JSON.stringify({
	temperature: "400001",
	pressure: "400002"
}, null, 2);
/**
* 创建连接配置面板
*
* 当设备尚未关联网关采集配置时显示，提供完整的创建表单。
* 创建时自动将 deviceId 关联到当前设备。
*/
function CreateConnectionPanel({ deviceId, deviceName, createMutation, testConnMutation }) {
	_s3();
	const { t } = useTranslation();
	const { data: gateways } = useGateways();
	const [form, setForm] = useState({
		protocol: "opcua",
		connectionConfig: defaultConfigs.opcua,
		dataPoints: defaultDataPoints,
		pollIntervalMs: 3e3,
		gatewayId: ""
	});
	const [testResult, setTestResult] = useState(null);
	/** 切换协议时更新连接配置模板 */
	const handleProtocolChange = (protocol) => {
		setForm({
			...form,
			protocol,
			connectionConfig: defaultConfigs[protocol] ?? "{}"
		});
	};
	/** 提交创建，自动使用当前设备名称 */
	const handleCreate = () => {
		createMutation.mutate({
			deviceName,
			protocol: form.protocol,
			connectionConfig: form.connectionConfig,
			dataPoints: form.dataPoints,
			pollIntervalMs: form.pollIntervalMs,
			deviceId,
			gatewayId: form.gatewayId || undefined
		});
	};
	/** 测试连接 */
	const runTest = () => {
		setTestResult(null);
		testConnMutation.mutate({
			protocol: form.protocol,
			connectionConfig: form.connectionConfig
		}, {
			onSuccess: (result) => setTestResult(result),
			onError: () => setTestResult({
				success: false,
				message: t("device.connection.testFailed")
			})
		});
	};
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, {
			className: "text-base",
			children: t("device.connection.createTitle")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 583,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("device.connection.createDescription") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 584,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 582,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.protocol") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 589,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid grid-cols-3 gap-3",
						children: Object.entries(protocolMeta).map(([key, meta]) => /* @__PURE__ */ _jsxDEV("button", {
							type: "button",
							onClick: () => handleProtocolChange(key),
							className: `flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${form.protocol === key ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`,
							children: [meta.icon, /* @__PURE__ */ _jsxDEV("span", { children: meta.label }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 603,
								columnNumber: 19
							}, this)]
						}, key, true, {
							fileName: _jsxFileName,
							lineNumber: 592,
							columnNumber: 17
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 590,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 588,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.gatewayId") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 611,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Select, {
							value: form.gatewayId || undefined,
							onValueChange: (v) => setForm({
								...form,
								gatewayId: v ?? ""
							}),
							children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: "选择网关（可选）" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 614,
								columnNumber: 17
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 613,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [gateways?.filter((g) => g.status === "online").map((g) => /* @__PURE__ */ _jsxDEV(SelectItem, {
								value: g.gatewayId,
								children: [
									g.name,
									"（",
									g.gatewayId,
									"）"
								]
							}, g.gatewayId, true, {
								fileName: _jsxFileName,
								lineNumber: 618,
								columnNumber: 19
							}, this)), (!gateways || gateways.filter((g) => g.status === "online").length === 0) && /* @__PURE__ */ _jsxDEV(SelectItem, {
								value: "_none",
								disabled: true,
								children: "暂无在线网关"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 623,
								columnNumber: 19
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 616,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 612,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs text-muted-foreground",
							children: "选择负责采集该设备数据的边缘网关，不选则使用默认网关"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 627,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 610,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.pollInterval") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 632,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Input, {
							type: "number",
							min: 100,
							value: form.pollIntervalMs,
							onChange: (e) => setForm({
								...form,
								pollIntervalMs: Number(e.target.value)
							})
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 633,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs text-muted-foreground",
							children: t("device.connection.pollIntervalHint")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 639,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 631,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.connectionConfig") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 644,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
						className: "font-mono text-xs",
						rows: 4,
						value: form.connectionConfig,
						onChange: (e) => setForm({
							...form,
							connectionConfig: e.target.value
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 645,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 643,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.dataPointMapping") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 655,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
						className: "font-mono text-xs",
						rows: 4,
						value: form.dataPoints,
						onChange: (e) => setForm({
							...form,
							dataPoints: e.target.value
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 656,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 654,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-3 pt-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						onClick: handleCreate,
						disabled: createMutation.isPending,
						children: [createMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 667,
							columnNumber: 44
						}, this), t("device.connection.createAndLink")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 666,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						onClick: runTest,
						disabled: testConnMutation.isPending,
						children: [testConnMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 671,
							columnNumber: 45
						}, this) : /* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-1 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 671,
							columnNumber: 97
						}, this), t("device.connection.testConnection")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 670,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 665,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 586,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 581,
			columnNumber: 7
		}, this), testResult && /* @__PURE__ */ _jsxDEV(Card, {
			className: testResult.success ? "border-green-500/30" : "border-red-500/30",
			children: /* @__PURE__ */ _jsxDEV(CardContent, {
				className: "flex items-center gap-2 py-3",
				children: [
					/* @__PURE__ */ _jsxDEV(Badge, {
						variant: testResult.success ? "default" : "destructive",
						children: testResult.success ? t("device.connection.testSuccess") : t("device.connection.testFailed")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 682,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("span", {
						className: "text-sm",
						children: testResult.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 685,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						className: "ml-auto",
						onClick: () => setTestResult(null),
						children: t("common.close")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 686,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 681,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 680,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 580,
		columnNumber: 5
	}, this);
}
_s3(CreateConnectionPanel, "nvY2GxePuMwmkFXBY02O/9sKOEo=", false, function() {
	return [useTranslation, useGateways];
});
_c3 = CreateConnectionPanel;
/**
* 设备基本信息卡片
*
* 默认显示只读信息，点击编辑按钮后字段变为输入框，支持行内修改保存。
* 只编辑 Device 类型中实际存在且用户可修改的字段：name、type、model、manufacturer。
* status 和 healthScore 为系统维护，始终只读。
*/
function DeviceInfoCard({ device }) {
	_s4();
	const { t } = useTranslation();
	const updateMutation = useUpdateDevice();
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState({
		name: "",
		type: "",
		model: "",
		manufacturer: "",
		criticality: "Normal",
		serialNumber: "",
		installDate: "",
		gatewayId: "",
		downtimeCostPerHour: ""
	});
	/** 进入编辑模式（回显当前设备档案字段） */
	const startEdit = () => {
		setForm({
			name: device.name ?? "",
			type: device.type ?? "",
			model: device.model ?? "",
			manufacturer: device.manufacturer ?? "",
			criticality: device.criticality ?? "Normal",
			serialNumber: device.serialNumber ?? "",
			installDate: device.installDate ?? "",
			gatewayId: device.gatewayId ?? "",
			downtimeCostPerHour: device.downtimeCostPerHour != null ? String(device.downtimeCostPerHour) : ""
		});
		setEditing(true);
	};
	/** 保存修改（可空字段空值传 undefined，触发后端 Condition 跳过、保持原值） */
	const saveEdit = () => {
		updateMutation.mutate({
			id: device.id,
			deviceCode: device.deviceCode,
			name: form.name,
			type: form.type,
			model: form.model || undefined,
			manufacturer: form.manufacturer || undefined,
			criticality: form.criticality || undefined,
			serialNumber: form.serialNumber || undefined,
			installDate: form.installDate || undefined,
			gatewayId: form.gatewayId || undefined,
			downtimeCostPerHour: form.downtimeCostPerHour ? Number(form.downtimeCostPerHour) : undefined
		}, { onSettled: () => setEditing(false) });
	};
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV("div", {
		className: "flex items-center justify-between border-b px-4 py-2",
		children: [/* @__PURE__ */ _jsxDEV("span", {
			className: "text-sm font-medium text-muted-foreground",
			children: t("device.basicInfo")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 767,
			columnNumber: 9
		}, this), editing ? /* @__PURE__ */ _jsxDEV("div", {
			className: "flex gap-1",
			children: [/* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				size: "icon",
				className: "h-7 w-7",
				onClick: () => setEditing(false),
				children: /* @__PURE__ */ _jsxDEV(X, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 771,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 770,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				size: "icon",
				className: "h-7 w-7 text-primary",
				onClick: saveEdit,
				disabled: updateMutation.isPending,
				children: updateMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 774,
					columnNumber: 43
				}, this) : /* @__PURE__ */ _jsxDEV(Check, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 774,
					columnNumber: 90
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 773,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 769,
			columnNumber: 11
		}, this) : /* @__PURE__ */ _jsxDEV(Button, {
			variant: "ghost",
			size: "icon",
			className: "h-7 w-7",
			onClick: startEdit,
			children: /* @__PURE__ */ _jsxDEV(Pencil, { className: "h-4 w-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 779,
				columnNumber: 13
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 778,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 766,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4",
		children: editing ? /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.name")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 787,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.name,
					onChange: (e) => setForm({
						...form,
						name: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 788,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 786,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.type")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 791,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.type,
					onChange: (e) => setForm({
						...form,
						type: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 792,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 790,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.model")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 795,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.model,
					onChange: (e) => setForm({
						...form,
						model: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 796,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 794,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.manufacturer")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 799,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.manufacturer,
					onChange: (e) => setForm({
						...form,
						manufacturer: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 800,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 798,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.criticality")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 803,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Select, {
					value: form.criticality,
					onValueChange: (v) => {
						if (v) setForm({
							...form,
							criticality: v
						});
					},
					children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
						className: "h-8 text-sm",
						children: /* @__PURE__ */ _jsxDEV(SelectValue, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 805,
							columnNumber: 56
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 805,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						"Critical",
						"High",
						"Normal",
						"Low"
					].map((c) => /* @__PURE__ */ _jsxDEV(SelectItem, {
						value: c,
						children: c
					}, c, false, {
						fileName: _jsxFileName,
						lineNumber: 808,
						columnNumber: 21
					}, this)) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 806,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 804,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 802,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.serialNumber")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 814,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.serialNumber,
					onChange: (e) => setForm({
						...form,
						serialNumber: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 815,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 813,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.installDate")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 818,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					type: "date",
					value: form.installDate,
					onChange: (e) => setForm({
						...form,
						installDate: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 819,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 817,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.gatewayId")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 822,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					value: form.gatewayId,
					onChange: (e) => setForm({
						...form,
						gatewayId: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 823,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 821,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.downtimeCostPerHour")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 826,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					className: "h-8 text-sm",
					type: "number",
					step: "0.01",
					min: "0",
					value: form.downtimeCostPerHour,
					onChange: (e) => setForm({
						...form,
						downtimeCostPerHour: e.target.value
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 827,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 825,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(Label, {
				className: "text-xs text-muted-foreground",
				children: t("common.status")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 830,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "mt-1",
				children: /* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 831,
					columnNumber: 37
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 831,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 829,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(Label, {
				className: "text-xs text-muted-foreground",
				children: t("device.healthScore")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 834,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "mt-1 font-medium",
				children: device.healthScore
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 835,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 833,
				columnNumber: 13
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 785,
			columnNumber: 11
		}, this) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.name")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.name
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 85
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.type")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.type
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 85
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.model")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.model ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 86
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.manufacturer")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 843,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.manufacturer ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 843,
				columnNumber: 93
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 843,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.criticality")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 844,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.criticality ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 844,
				columnNumber: 92
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 844,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.serialNumber")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.serialNumber ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 93
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.installDate")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.installDate ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 92
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.gatewayId")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.gatewayId ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 90
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.downtimeCostPerHour")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.downtimeCostPerHour != null ? device.downtimeCostPerHour : "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 100
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.lastSeenAt")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 91
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("common.status")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 850,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 850,
				columnNumber: 87
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 850,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.healthScore")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 851,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.healthScore
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 851,
				columnNumber: 92
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 851,
				columnNumber: 13
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 839,
			columnNumber: 11
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 783,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 765,
		columnNumber: 5
	}, this);
}
_s4(DeviceInfoCard, "iqyld7x1uH+uGdUnUE2s1zTNiJ0=", false, function() {
	return [useTranslation, useUpdateDevice];
});
_c4 = DeviceInfoCard;
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "DeviceDetailPage");
$RefreshReg$(_c2, "ConnectionConfigPanel");
$RefreshReg$(_c3, "CreateConnectionPanel");
$RefreshReg$(_c4, "DeviceInfoCard");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/DeviceDetailPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceDetailPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceDetailPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceDetailPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUFLLHdCQUFDLEtBQUQ7SUFBRyxXQUFVO2NBQWlDLEVBQUUsbUJBQW1CO0dBQUs7Ozs7YUFBQyx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFlLE9BQU8sYUFBYSxJQUFJLEtBQUssT0FBTyxVQUFVLENBQUMsQ0FBQyxlQUFlLElBQUk7R0FBTzs7OztXQUFNOzs7OztHQUMxTCx3QkFBQyxPQUFELGFBQUssd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBaUMsRUFBRSxlQUFlO0dBQUs7Ozs7YUFBQyx3QkFBQyxtQkFBRCxFQUFtQixRQUFRLE9BQU8sT0FBUzs7OztXQUFNOzs7OztHQUMzSCx3QkFBQyxPQUFELGFBQUssd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBaUMsRUFBRSxvQkFBb0I7R0FBSzs7OzthQUFDLHdCQUFDLEtBQUQ7SUFBRyxXQUFVO2NBQWUsT0FBTztHQUFlOzs7O1dBQU07Ozs7O0VBQ3ZJOzs7OztDQUVPOzs7O1NBQ1Q7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiRGV2aWNlRGV0YWlsUGFnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VQYXJhbXMsIHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgQXJyb3dMZWZ0LCBQbHVnLCBOZXR3b3JrLCBSYWRpbywgTG9hZGVyMiwgUmVmcmVzaEN3LCBQZW5jaWwsIFRyYXNoMiwgQ2hlY2ssIFggfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9idXR0b24nO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSwgQ2FyZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9jYXJkJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9iYWRnZSc7XG5pbXBvcnQgeyBUYWJsZSwgVGFibGVCb2R5LCBUYWJsZUNlbGwsIFRhYmxlSGVhZCwgVGFibGVIZWFkZXIsIFRhYmxlUm93IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS90YWJsZSc7XG5pbXBvcnQgeyBTZWxlY3QsIFNlbGVjdENvbnRlbnQsIFNlbGVjdEl0ZW0sIFNlbGVjdFRyaWdnZXIsIFNlbGVjdFZhbHVlIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9zZWxlY3QnO1xuaW1wb3J0IHsgVGFicywgVGFic0NvbnRlbnQsIFRhYnNMaXN0LCBUYWJzVHJpZ2dlciB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvdGFicyc7XG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ0hlYWRlciwgRGlhbG9nVGl0bGUsIERpYWxvZ0Rlc2NyaXB0aW9uLCBEaWFsb2dGb290ZXIsIERpYWxvZ0NvbnRlbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2RpYWxvZyc7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvaW5wdXQnO1xuaW1wb3J0IHsgTGFiZWwgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2xhYmVsJztcbmltcG9ydCB7IFRleHRhcmVhIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS90ZXh0YXJlYSc7XG5pbXBvcnQgeyBTd2l0Y2ggfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3N3aXRjaCc7XG5pbXBvcnQgeyBEZXZpY2VTdGF0dXNCYWRnZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvZGV2aWNlL0RldmljZVN0YXR1c0JhZGdlJztcbmltcG9ydCB7IFRyZW5kQ2hhcnQgfSBmcm9tICcuLi9jb21wb25lbnRzL2NoYXJ0cy9UcmVuZENoYXJ0JztcbmltcG9ydCB7IFNldmVyaXR5QmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL2FsZXJ0L1NldmVyaXR5QmFkZ2UnO1xuaW1wb3J0IHsgRGF0YVF1YWxpdHlPdmVydmlld0NhcmQgfSBmcm9tICcuLi9jb21wb25lbnRzL2RhdGFxdWFsaXR5L0RhdGFRdWFsaXR5T3ZlcnZpZXcnO1xuaW1wb3J0IHsgdXNlRGV2aWNlLCB1c2VVcGRhdGVEZXZpY2UsIHVzZVJlZnJlc2hIZWFsdGhTY29yZSB9IGZyb20gJy4uL2hvb2tzL3VzZURldmljZXMnO1xuaW1wb3J0IHsgdXNlVGVsZW1ldHJ5LCB0eXBlIFRlbGVtZXRyeURhdGFQb2ludCB9IGZyb20gJy4uL2hvb2tzL3VzZVRlbGVtZXRyeSc7XG5pbXBvcnQgeyB1c2VBbGVydHMgfSBmcm9tICcuLi9ob29rcy91c2VBbGVydHMnO1xuaW1wb3J0IHtcbiAgdXNlR2F0ZXdheURldmljZXMsXG4gIHVzZVVwZGF0ZUdhdGV3YXlEZXZpY2UsXG4gIHVzZURlbGV0ZUdhdGV3YXlEZXZpY2UsXG4gIHVzZVRlc3RDb25uZWN0aW9uLFxuICB1c2VDcmVhdGVHYXRld2F5RGV2aWNlLFxufSBmcm9tICcuLi9ob29rcy91c2VHYXRld2F5RGV2aWNlcyc7XG5pbXBvcnQgeyBmb3JtYXREYXRlIH0gZnJvbSAnLi4vbGliL3V0aWxzJztcbmltcG9ydCB7IHVzZUdhdGV3YXlzIH0gZnJvbSAnLi4vaG9va3MvdXNlR2F0ZXdheXMnO1xuaW1wb3J0IHR5cGUgeyBEZXZpY2UgfSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKiDljY/orq7mmL7npLrmmKDlsIQgKi9cbmNvbnN0IHByb3RvY29sTWV0YTogUmVjb3JkPHN0cmluZywgeyBsYWJlbDogc3RyaW5nOyBpY29uOiBSZWFjdC5SZWFjdE5vZGU7IGNvbG9yOiBzdHJpbmcgfT4gPSB7XG4gIG9wY3VhOiB7IGxhYmVsOiAnT1BDIFVBJywgaWNvbjogPFBsdWcgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+LCBjb2xvcjogJ2JnLWJsdWUtNTAwLzEwIHRleHQtYmx1ZS02MDAnIH0sXG4gICdtb2RidXMtdGNwJzogeyBsYWJlbDogJ01vZGJ1cyBUQ1AnLCBpY29uOiA8TmV0d29yayBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz4sIGNvbG9yOiAnYmctZ3JlZW4tNTAwLzEwIHRleHQtZ3JlZW4tNjAwJyB9LFxuICAnbW9kYnVzLXJ0dSc6IHsgbGFiZWw6ICdNb2RidXMgUlRVJywgaWNvbjogPFJhZGlvIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPiwgY29sb3I6ICdiZy1vcmFuZ2UtNTAwLzEwIHRleHQtb3JhbmdlLTYwMCcgfSxcbn07XG5cbi8qKiDmoLnmja7ml7bpl7TojIPlm7TmoIfor4borqHnrpfotbflp4vml7bpl7TnmoQgSVNPIOWtl+espuS4siAqL1xuZnVuY3Rpb24gZ2V0VGltZVJhbmdlU3RhcnQocmFuZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIHN3aXRjaCAocmFuZ2UpIHtcbiAgICBjYXNlICcxaCc6IHJldHVybiBuZXcgRGF0ZShub3cuZ2V0VGltZSgpIC0gMzYwMDAwMCkudG9JU09TdHJpbmcoKTtcbiAgICBjYXNlICc2aCc6IHJldHVybiBuZXcgRGF0ZShub3cuZ2V0VGltZSgpIC0gMjE2MDAwMDApLnRvSVNPU3RyaW5nKCk7XG4gICAgY2FzZSAnMjRoJzogcmV0dXJuIG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSA4NjQwMDAwMCkudG9JU09TdHJpbmcoKTtcbiAgICBjYXNlICc3ZCc6IHJldHVybiBuZXcgRGF0ZShub3cuZ2V0VGltZSgpIC0gNjA0ODAwMDAwKS50b0lTT1N0cmluZygpO1xuICAgIGRlZmF1bHQ6IHJldHVybiBuZXcgRGF0ZShub3cuZ2V0VGltZSgpIC0gMzYwMDAwMCkudG9JU09TdHJpbmcoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEZXZpY2VEZXRhaWxQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHsgaWQgfSA9IHVzZVBhcmFtczx7IGlkOiBzdHJpbmcgfT4oKTtcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xuICBjb25zdCBbc2VsZWN0ZWRNZXRyaWMsIHNldFNlbGVjdGVkTWV0cmljXSA9IHVzZVN0YXRlKCd0ZW1wZXJhdHVyZScpO1xuICBjb25zdCBbdGltZVJhbmdlLCBzZXRUaW1lUmFuZ2VdID0gdXNlU3RhdGUoJzFoJyk7XG5cbiAgY29uc3QgeyBkYXRhOiBkZXZpY2UsIGlzTG9hZGluZyB9ID0gdXNlRGV2aWNlKGlkID8/ICcnKTtcbiAgY29uc3QgcmVmcmVzaEhlYWx0aCA9IHVzZVJlZnJlc2hIZWFsdGhTY29yZSgpO1xuICBjb25zdCB7IGRhdGE6IHRlbGVtZXRyeSB9ID0gdXNlVGVsZW1ldHJ5KFxuICAgIGlkID8/ICcnLFxuICAgIHNlbGVjdGVkTWV0cmljLFxuICAgIGdldFRpbWVSYW5nZVN0YXJ0KHRpbWVSYW5nZSksXG4gICAgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICApO1xuICBjb25zdCB7IGRhdGE6IGFsZXJ0c0RhdGEgfSA9IHVzZUFsZXJ0cyh7IHBhZ2U6IDEsIHBhZ2VTaXplOiAyMCB9LCB7IGRldmljZUlkOiBpZCB9KTtcblxuICBpZiAoaXNMb2FkaW5nKSByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJweS0yMCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L2Rpdj47XG4gIGlmICghZGV2aWNlKSByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJweS0yMCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvZGl2PjtcblxuICBjb25zdCBjaGFydERhdGEgPSBBcnJheS5pc0FycmF5KHRlbGVtZXRyeSlcbiAgICA/ICh0ZWxlbWV0cnkgYXMgVGVsZW1ldHJ5RGF0YVBvaW50W10pLm1hcCgocCkgPT4gKHsgdGltZTogcC50aW1lLCB2YWx1ZTogcC52YWx1ZSB9KSlcbiAgICA6IFtdO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTZcIj5cbiAgICAgIHsvKiDpobXlpLTvvJrov5Tlm57mjInpkq4gKyDorr7lpIflkI3np7AgKyDnirbmgIEgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0ZSgnL2RldmljZXMnKX0+XG4gICAgICAgICAgPEFycm93TGVmdCBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZFwiPntkZXZpY2UubmFtZX08L2gxPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e2RldmljZS5kZXZpY2VDb2RlfTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgIDxEZXZpY2VTdGF0dXNCYWRnZSBzdGF0dXM9e2RldmljZS5zdGF0dXN9IC8+XG4gICAgICAgICAgey8qIOiuvuWkh+WBpeW6t+W6puWxleekuiArIOWIt+aWsOaMiemSriAqL31cbiAgICAgICAgICB7dHlwZW9mIGRldmljZS5oZWFsdGhTY29yZSA9PT0gJ251bWJlcicgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLW1kIGJvcmRlciBweC0zIHB5LTEuNVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuaGVhbHRoU2NvcmUnLCAn5YGl5bq35bqmJyl9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B0ZXh0LWxnIGZvbnQtYm9sZCAke1xuICAgICAgICAgICAgICAgIGRldmljZS5oZWFsdGhTY29yZSA+PSA4NSA/ICd0ZXh0LWdyZWVuLTYwMCdcbiAgICAgICAgICAgICAgICAgIDogZGV2aWNlLmhlYWx0aFNjb3JlID49IDcwID8gJ3RleHQtYmx1ZS02MDAnXG4gICAgICAgICAgICAgICAgICAgIDogZGV2aWNlLmhlYWx0aFNjb3JlID49IDUwID8gJ3RleHQteWVsbG93LTYwMCcgOiAndGV4dC1yZWQtNjAwJ1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAge2RldmljZS5oZWFsdGhTY29yZS50b0ZpeGVkKDEpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICB2YXJpYW50PVwiZ2hvc3RcIlxuICAgICAgICAgICAgICAgIHNpemU9XCJpY29uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTcgdy03XCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17cmVmcmVzaEhlYWx0aC5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVmcmVzaEhlYWx0aC5tdXRhdGUoZGV2aWNlLmlkKX1cbiAgICAgICAgICAgICAgICB0aXRsZT17dCgnZGV2aWNlLnJlZnJlc2hIZWFsdGgnLCAn5Yi35paw5YGl5bq35bqmJyl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8UmVmcmVzaEN3IGNsYXNzTmFtZT17YGgtNCB3LTQgJHtyZWZyZXNoSGVhbHRoLmlzUGVuZGluZyA/ICdhbmltYXRlLXNwaW4nIDogJyd9YH0gLz5cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogVGFiIOW4g+WxgO+8muamguiniCArIOi/nuaOpemFjee9riAqL31cbiAgICAgIDxUYWJzIGRlZmF1bHRWYWx1ZT1cIm92ZXJ2aWV3XCIgY2xhc3NOYW1lPVwiZmxleCBnYXAtNiBpdGVtcy1zdGFydFwiPlxuICAgICAgICA8VGFic0xpc3QgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCB3LTQ0IHNocmluay0wIGJnLW11dGVkLzUwIHAtMSBnYXAtMC41XCI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwib3ZlcnZpZXdcIiBjbGFzc05hbWU9XCJ3LWZ1bGwganVzdGlmeS1zdGFydCBweC0zXCI+e3QoJ2RldmljZS50YWJzLm92ZXJ2aWV3Jyl9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJjb25uZWN0aW9uXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdkZXZpY2UudGFicy5jb25uZWN0aW9uJyl9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgPC9UYWJzTGlzdD5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wIHNwYWNlLXktNFwiPlxuICAgICAgICAgIHsvKiDmpoLop4ggVGFiICovfVxuICAgICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cIm92ZXJ2aWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgICAgICAgICB7Lyog6K6+5aSH5Z+65pys5L+h5oGv5Y2h54mH77yI5pSv5oyB6KGM5YaF57yW6L6R77yJICovfVxuICAgICAgICAgICAgICA8RGV2aWNlSW5mb0NhcmQgZGV2aWNlPXtkZXZpY2V9IC8+XG5cbiAgICAgICAgICAgICAgey8qIOmBpea1i+aVsOaNrui2i+WKv+WbviAqL31cbiAgICAgICAgICAgICAgPENhcmQ+XG4gICAgICAgICAgICAgICAgPENhcmRIZWFkZXIgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwidGV4dC1iYXNlXCI+e3QoJ2RldmljZS50ZWxlbWV0cnlUcmVuZHMnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtzZWxlY3RlZE1ldHJpY30gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYpIHNldFNlbGVjdGVkTWV0cmljKHYpOyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTMyIGgtOFwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwidGVtcGVyYXR1cmVcIj57dCgndGVsZW1ldHJ5LnRlbXBlcmF0dXJlJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJwcmVzc3VyZVwiPnt0KCd0ZWxlbWV0cnkucHJlc3N1cmUnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cInZpYnJhdGlvblwiPnt0KCd0ZWxlbWV0cnkudmlicmF0aW9uJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJodW1pZGl0eVwiPnt0KCd0ZWxlbWV0cnkuaHVtaWRpdHknKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPFNlbGVjdCB2YWx1ZT17dGltZVJhbmdlfSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0VGltZVJhbmdlKHYpOyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTI0IGgtOFwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiMWhcIj57dCgndGltZS4xaG91cicpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiNmhcIj57dCgndGltZS42aG91cnMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIjI0aFwiPnt0KCd0aW1lLjI0aG91cnMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIjdkXCI+e3QoJ3RpbWUuN2RheXMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgICAgICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgICAgICAgICAgICB7Y2hhcnREYXRhLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxUcmVuZENoYXJ0IGRhdGE9e2NoYXJ0RGF0YX0gaGVpZ2h0PXszMDB9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaC1bMzAwcHhdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICAgICAgICA8L0NhcmQ+XG5cbiAgICAgICAgICAgICAgey8qIOaVsOaNrui0qOmHjyArIOacgOi/keWRiuitpu+8iOWPjOWIl+W4g+WxgO+8iSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC02IGxnOmdyaWQtY29scy0yXCI+XG4gICAgICAgICAgICAgICAgPERhdGFRdWFsaXR5T3ZlcnZpZXdDYXJkIGRldmljZUlkPXtkZXZpY2UuaWR9IC8+XG4gICAgICAgICAgICAgICAgPENhcmQ+XG4gICAgICAgICAgICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPnt0KCdkZXZpY2UucmVjZW50QWxlcnRzJyl9PC9DYXJkVGl0bGU+PC9DYXJkSGVhZGVyPlxuICAgICAgICAgICAgICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8VGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZGVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdhbGVydC5hbGVydENvZGUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnYWxlcnQubWV0cmljJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnZhbHVlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnNldmVyaXR5Jyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2NvbW1vbi5zdGF0dXMnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLnRpbWUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAge2FsZXJ0c0RhdGE/Lml0ZW1zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PjxUYWJsZUNlbGwgY29sU3Bhbj17Nn0gY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5ub0RhdGEnKX08L1RhYmxlQ2VsbD48L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnRzRGF0YT8uaXRlbXMubWFwKChhbGVydCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZVJvdyBrZXk9e2FsZXJ0LmlkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtc21cIj57YWxlcnQuYWxlcnRDb2RlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57YWxlcnQubWV0cmljfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57YWxlcnQudmFsdWV9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxTZXZlcml0eUJhZGdlIHNldmVyaXR5PXthbGVydC5zZXZlcml0eX0gLz48L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+e2FsZXJ0LnN0YXR1c308L0JhZGdlPjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntuZXcgRGF0ZShhbGVydC5vY2N1cnJlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICA8L1RhYmxlPlxuICAgICAgICAgICAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgICAgICAgICAgICA8L0NhcmQ+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICAgIHsvKiDov57mjqXphY3nva4gVGFiICovfVxuICAgICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cImNvbm5lY3Rpb25cIj5cbiAgICAgICAgICAgIDxDb25uZWN0aW9uQ29uZmlnUGFuZWwgZGV2aWNlSWQ9e2RldmljZS5pZH0gZGV2aWNlTmFtZT17ZGV2aWNlLm5hbWV9IC8+XG4gICAgICAgICAgPC9UYWJzQ29udGVudD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L1RhYnM+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIOi/nuaOpemFjee9ruWtkOe7hOS7tlxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKiog6L+e5o6l6YWN572u6Z2i5p2/5bGe5oCnICovXG5pbnRlcmZhY2UgQ29ubmVjdGlvbkNvbmZpZ1BhbmVsUHJvcHMge1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBkZXZpY2VOYW1lOiBzdHJpbmc7XG59XG5cbi8qKlxuICog6L+e5o6l6YWN572u6Z2i5p2/XG4gKlxuICog5bGV56S65b2T5YmN6K6+5aSH5YWz6IGU55qE572R5YWz6YeH6ZuG6YWN572u77yM5pSv5oyB57yW6L6R44CB5rWL6K+V6L+e5o6l5ZKM5ZCv5YGc5pON5L2c44CCXG4gKiDlpoLmnpzorr7lpIflsJrmnKrlhbPogZTnvZHlhbPorr7lpIfphY3nva7vvIzmmL7npLrmj5DnpLrkv6Hmga/jgIJcbiAqL1xuZnVuY3Rpb24gQ29ubmVjdGlvbkNvbmZpZ1BhbmVsKHsgZGV2aWNlSWQsIGRldmljZU5hbWUgfTogQ29ubmVjdGlvbkNvbmZpZ1BhbmVsUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGRhdGE6IGdhdGV3YXlEZXZpY2VzLCBpc0xvYWRpbmcgfSA9IHVzZUdhdGV3YXlEZXZpY2VzKCk7XG4gIGNvbnN0IHVwZGF0ZU11dGF0aW9uID0gdXNlVXBkYXRlR2F0ZXdheURldmljZSgpO1xuICBjb25zdCBkZWxldGVNdXRhdGlvbiA9IHVzZURlbGV0ZUdhdGV3YXlEZXZpY2UoKTtcbiAgY29uc3QgdGVzdENvbm5NdXRhdGlvbiA9IHVzZVRlc3RDb25uZWN0aW9uKCk7XG4gIGNvbnN0IGNyZWF0ZU11dGF0aW9uID0gdXNlQ3JlYXRlR2F0ZXdheURldmljZSgpO1xuXG4gIC8qKiDmn6Xmib7lvZPliY3orr7lpIflhbPogZTnmoTnvZHlhbPorr7lpIfphY3nva4gKi9cbiAgY29uc3QgZ3dEZXZpY2UgPSBnYXRld2F5RGV2aWNlcz8uZmluZCgoZCkgPT4gZC5kZXZpY2VJZCA9PT0gZGV2aWNlSWQpO1xuXG4gIGNvbnN0IFtlZGl0VGFyZ2V0LCBzZXRFZGl0VGFyZ2V0XSA9IHVzZVN0YXRlPHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGRldmljZU5hbWU6IHN0cmluZztcbiAgICBjb25uZWN0aW9uQ29uZmlnOiBzdHJpbmc7XG4gICAgZGF0YVBvaW50czogc3RyaW5nO1xuICAgIHBvbGxJbnRlcnZhbE1zOiBudW1iZXI7XG4gIH0gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2RlbGV0ZVRhcmdldCwgc2V0RGVsZXRlVGFyZ2V0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbdGVzdFJlc3VsdCwgc2V0VGVzdFJlc3VsdF0gPSB1c2VTdGF0ZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqIOWIh+aNouWQr+WBnCAqL1xuICBjb25zdCB0b2dnbGVFbmFibGVkID0gKGlkOiBzdHJpbmcsIGN1cnJlbnQ6IGJvb2xlYW4pID0+IHtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoeyBpZCwgZW5hYmxlZDogIWN1cnJlbnQgfSk7XG4gIH07XG5cbiAgLyoqIOa1i+ivlei/nuaOpSAqL1xuICBjb25zdCBydW5UZXN0Q29ubmVjdGlvbiA9IChwcm90b2NvbDogc3RyaW5nLCBjb25uZWN0aW9uQ29uZmlnOiBzdHJpbmcpID0+IHtcbiAgICBzZXRUZXN0UmVzdWx0KG51bGwpO1xuICAgIHRlc3RDb25uTXV0YXRpb24ubXV0YXRlKFxuICAgICAgeyBwcm90b2NvbCwgY29ubmVjdGlvbkNvbmZpZyB9LFxuICAgICAge1xuICAgICAgICBvblN1Y2Nlc3M6IChyZXN1bHQpID0+IHNldFRlc3RSZXN1bHQocmVzdWx0KSxcbiAgICAgICAgb25FcnJvcjogKCkgPT4gc2V0VGVzdFJlc3VsdCh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0RmFpbGVkJykgfSksXG4gICAgICB9LFxuICAgICk7XG4gIH07XG5cbiAgLyoqIOS/neWtmOe8lui+kSAqL1xuICBjb25zdCBzYXZlRWRpdCA9ICgpID0+IHtcbiAgICBpZiAoIWVkaXRUYXJnZXQpIHJldHVybjtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7XG4gICAgICAgIGlkOiBlZGl0VGFyZ2V0LmlkLFxuICAgICAgICBkZXZpY2VOYW1lOiBlZGl0VGFyZ2V0LmRldmljZU5hbWUsXG4gICAgICAgIGNvbm5lY3Rpb25Db25maWc6IGVkaXRUYXJnZXQuY29ubmVjdGlvbkNvbmZpZyxcbiAgICAgICAgZGF0YVBvaW50czogZWRpdFRhcmdldC5kYXRhUG9pbnRzLFxuICAgICAgICBwb2xsSW50ZXJ2YWxNczogZWRpdFRhcmdldC5wb2xsSW50ZXJ2YWxNcyxcbiAgICAgIH0sXG4gICAgICB7IG9uU2V0dGxlZDogKCkgPT4gc2V0RWRpdFRhcmdldChudWxsKSB9LFxuICAgICk7XG4gIH07XG5cbiAgLyoqIOehruiupOWIoOmZpCAqL1xuICBjb25zdCBjb25maXJtRGVsZXRlID0gKCkgPT4ge1xuICAgIGlmICghZGVsZXRlVGFyZ2V0KSByZXR1cm47XG4gICAgZGVsZXRlTXV0YXRpb24ubXV0YXRlKGRlbGV0ZVRhcmdldCwgeyBvblNldHRsZWQ6ICgpID0+IHNldERlbGV0ZVRhcmdldChudWxsKSB9KTtcbiAgfTtcblxuICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHktMTJcIj5cbiAgICAgICAgPExvYWRlcjIgY2xhc3NOYW1lPVwiaC02IHctNiBhbmltYXRlLXNwaW4gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICAvKiog5pyq5YWz6IGU572R5YWz6K6+5aSH6YWN572u5pe277yM5pi+56S65Yib5bu66KGo5Y2VICovXG4gIGlmICghZ3dEZXZpY2UpIHtcbiAgICByZXR1cm4gPENyZWF0ZUNvbm5lY3Rpb25QYW5lbCBkZXZpY2VJZD17ZGV2aWNlSWR9IGRldmljZU5hbWU9e2RldmljZU5hbWV9IGNyZWF0ZU11dGF0aW9uPXtjcmVhdGVNdXRhdGlvbn0gdGVzdENvbm5NdXRhdGlvbj17dGVzdENvbm5NdXRhdGlvbn0gLz47XG4gIH1cblxuICBjb25zdCBwcm90byA9IHByb3RvY29sTWV0YVtnd0RldmljZS5wcm90b2NvbF0gPz8ge1xuICAgIGxhYmVsOiBnd0RldmljZS5wcm90b2NvbCxcbiAgICBpY29uOiA8UGx1ZyBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz4sXG4gICAgY29sb3I6ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNjAwJyxcbiAgfTtcblxuICBjb25zdCBkcENvdW50ID0gKCgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShnd0RldmljZS5kYXRhUG9pbnRzKTtcbiAgICAgIHJldHVybiB0eXBlb2YgcGFyc2VkID09PSAnb2JqZWN0JyAmJiBwYXJzZWQgIT09IG51bGwgPyBPYmplY3Qua2V5cyhwYXJzZWQpLmxlbmd0aCA6IDA7XG4gICAgfSBjYXRjaCB7IHJldHVybiAwOyB9XG4gIH0pKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgey8qIOi/nuaOpemFjee9ruS/oeaBr+WNoeeJhyAqL31cbiAgICAgIDxDYXJkPlxuICAgICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24udGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICAgICAgPENhcmREZXNjcmlwdGlvbiBjbGFzc05hbWU9XCJtdC0xXCI+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRlc2NyaXB0aW9uJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJvdXRsaW5lXCJcbiAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHJ1blRlc3RDb25uZWN0aW9uKGd3RGV2aWNlLnByb3RvY29sLCBnd0RldmljZS5jb25uZWN0aW9uQ29uZmlnKX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+fVxuICAgICAgICAgICAgICAgIHt0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0Q29ubmVjdGlvbicpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIHNpemU9XCJzbVwiIG9uQ2xpY2s9eygpID0+IHNldEVkaXRUYXJnZXQoe1xuICAgICAgICAgICAgICAgIGlkOiBnd0RldmljZS5pZCxcbiAgICAgICAgICAgICAgICBkZXZpY2VOYW1lOiBnd0RldmljZS5kZXZpY2VOYW1lLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25Db25maWc6IGd3RGV2aWNlLmNvbm5lY3Rpb25Db25maWcsXG4gICAgICAgICAgICAgICAgZGF0YVBvaW50czogZ3dEZXZpY2UuZGF0YVBvaW50cyxcbiAgICAgICAgICAgICAgICBwb2xsSW50ZXJ2YWxNczogZ3dEZXZpY2UucG9sbEludGVydmFsTXMsXG4gICAgICAgICAgICAgIH0pfT5cbiAgICAgICAgICAgICAgICA8UGVuY2lsIGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAge3QoJ2NvbW1vbi5lZGl0Jyl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgIHsvKiDln7rmnKzkv6Hmga8gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00IG1kOmdyaWQtY29scy00XCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kZXZpY2VOYW1lJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntnd0RldmljZS5kZXZpY2VOYW1lfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucHJvdG9jb2wnKX08L3A+XG4gICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiIGNsYXNzTmFtZT17cHJvdG8uY29sb3J9PlxuICAgICAgICAgICAgICAgIHtwcm90by5pY29ufVxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTFcIj57cHJvdG8ubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5wb2xsSW50ZXJ2YWwnKX08L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2d3RGV2aWNlLnBvbGxJbnRlcnZhbE1zfW1zPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kYXRhUG9pbnRzJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntkcENvdW50fTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOWQr+WBnOeKtuaAgSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXRcIj5cbiAgICAgICAgICAgIDxTd2l0Y2hcbiAgICAgICAgICAgICAgY2hlY2tlZD17Z3dEZXZpY2UuZW5hYmxlZH1cbiAgICAgICAgICAgICAgb25DaGVja2VkQ2hhbmdlPXsoKSA9PiB0b2dnbGVFbmFibGVkKGd3RGV2aWNlLmlkLCBnd0RldmljZS5lbmFibGVkKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICB7Z3dEZXZpY2UuZW5hYmxlZCA/IHQoJ2RldmljZS5jb25uZWN0aW9uLmVuYWJsZWQnKSA6IHQoJ2RldmljZS5jb25uZWN0aW9uLmRpc2FibGVkJyl9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAoe3QoJ2RldmljZS5jb25uZWN0aW9uLmdhdGV3YXlJZCcpfToge2d3RGV2aWNlLmdhdGV3YXlJZH0pXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgIHZhcmlhbnQ9XCJnaG9zdFwiXG4gICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1sLWF1dG8gdGV4dC1kZXN0cnVjdGl2ZSBob3Zlcjp0ZXh0LWRlc3RydWN0aXZlXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGVsZXRlVGFyZ2V0KGd3RGV2aWNlLmlkKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmRlbGV0ZScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog6L+e5o6l6YWN572u6K+m5oOFICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBtZDpncmlkLWNvbHMtMlwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMVwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5jb25uZWN0aW9uQ29uZmlnJyl9PC9wPlxuICAgICAgICAgICAgICA8cHJlIGNsYXNzTmFtZT1cInJvdW5kZWQgYmctbXV0ZWQgcC0zIHRleHQteHMgZm9udC1tb25vIG92ZXJmbG93LWF1dG8gbWF4LWgtNDhcIj5cbiAgICAgICAgICAgICAgICB7KCgpID0+IHsgdHJ5IHsgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UoZ3dEZXZpY2UuY29ubmVjdGlvbkNvbmZpZyksIG51bGwsIDIpOyB9IGNhdGNoIHsgcmV0dXJuIGd3RGV2aWNlLmNvbm5lY3Rpb25Db25maWc7IH0gfSkoKX1cbiAgICAgICAgICAgICAgPC9wcmU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTFcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24uZGF0YVBvaW50TWFwcGluZycpfTwvcD5cbiAgICAgICAgICAgICAgPHByZSBjbGFzc05hbWU9XCJyb3VuZGVkIGJnLW11dGVkIHAtMyB0ZXh0LXhzIGZvbnQtbW9ubyBvdmVyZmxvdy1hdXRvIG1heC1oLTQ4XCI+XG4gICAgICAgICAgICAgICAgeygoKSA9PiB7IHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKGd3RGV2aWNlLmRhdGFQb2ludHMpLCBudWxsLCAyKTsgfSBjYXRjaCB7IHJldHVybiBnd0RldmljZS5kYXRhUG9pbnRzOyB9IH0pKCl9XG4gICAgICAgICAgICAgIDwvcHJlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog5Yib5bu65pe26Ze0ICovfVxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5jb25uZWN0aW9uLmNyZWF0ZWRBdCcpfToge2Zvcm1hdERhdGUoZ3dEZXZpY2UuY3JlYXRlZEF0KX08L3A+XG4gICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICA8L0NhcmQ+XG5cbiAgICAgIHsvKiDov57mjqXmtYvor5Xnu5PmnpwgKi99XG4gICAgICB7dGVzdFJlc3VsdCAmJiAoXG4gICAgICAgIDxDYXJkIGNsYXNzTmFtZT17dGVzdFJlc3VsdC5zdWNjZXNzID8gJ2JvcmRlci1ncmVlbi01MDAvMzAnIDogJ2JvcmRlci1yZWQtNTAwLzMwJ30+XG4gICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHB5LTNcIj5cbiAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PXt0ZXN0UmVzdWx0LnN1Y2Nlc3MgPyAnZGVmYXVsdCcgOiAnZGVzdHJ1Y3RpdmUnfT5cbiAgICAgICAgICAgICAge3Rlc3RSZXN1bHQuc3VjY2VzcyA/IHQoJ2RldmljZS5jb25uZWN0aW9uLnRlc3RTdWNjZXNzJykgOiB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0RmFpbGVkJyl9XG4gICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPnt0ZXN0UmVzdWx0Lm1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwic21cIiBjbGFzc05hbWU9XCJtbC1hdXRvXCIgb25DbGljaz17KCkgPT4gc2V0VGVzdFJlc3VsdChudWxsKX0+XG4gICAgICAgICAgICAgIHt0KCdjb21tb24uY2xvc2UnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgIDwvQ2FyZD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDliKDpmaTnoa7orqTlr7nor53moYYgKi99XG4gICAgICA8RGlhbG9nIG9wZW49eyEhZGVsZXRlVGFyZ2V0fSBvbk9wZW5DaGFuZ2U9eyhvcGVuKSA9PiAhb3BlbiAmJiBzZXREZWxldGVUYXJnZXQobnVsbCl9PlxuICAgICAgICA8RGlhbG9nQ29udGVudD5cbiAgICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgICAgPERpYWxvZ1RpdGxlPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kZWxldGVUaXRsZScpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRlbGV0ZURlc2NyaXB0aW9uJyl9PC9EaWFsb2dEZXNjcmlwdGlvbj5cbiAgICAgICAgICA8L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8RGlhbG9nRm9vdGVyPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IHNldERlbGV0ZVRhcmdldChudWxsKX0+e3QoJ2NvbW1vbi5jYW5jZWwnKX08L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImRlc3RydWN0aXZlXCIgb25DbGljaz17Y29uZmlybURlbGV0ZX0gZGlzYWJsZWQ9e2RlbGV0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHtkZWxldGVNdXRhdGlvbi5pc1BlbmRpbmcgJiYgPExvYWRlcjIgY2xhc3NOYW1lPVwibXItMSBoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+fVxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmRlbGV0ZScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9EaWFsb2dGb290ZXI+XG4gICAgICAgIDwvRGlhbG9nQ29udGVudD5cbiAgICAgIDwvRGlhbG9nPlxuXG4gICAgICB7Lyog57yW6L6R5a+56K+d5qGGICovfVxuICAgICAgPERpYWxvZyBvcGVuPXshIWVkaXRUYXJnZXR9IG9uT3BlbkNoYW5nZT17KG9wZW4pID0+ICFvcGVuICYmIHNldEVkaXRUYXJnZXQobnVsbCl9PlxuICAgICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9XCJtYXgtdy1sZ1wiPlxuICAgICAgICAgIDxEaWFsb2dIZWFkZXI+XG4gICAgICAgICAgICA8RGlhbG9nVGl0bGU+e3QoJ2RldmljZS5jb25uZWN0aW9uLmVkaXRUaXRsZScpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+e3QoJ2RldmljZS5jb25uZWN0aW9uLmVkaXREZXNjcmlwdGlvbicpfTwvRGlhbG9nRGVzY3JpcHRpb24+XG4gICAgICAgICAgPC9EaWFsb2dIZWFkZXI+XG4gICAgICAgICAge2VkaXRUYXJnZXQgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRldmljZU5hbWUnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRUYXJnZXQuZGV2aWNlTmFtZX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdFRhcmdldCh7IC4uLmVkaXRUYXJnZXQsIGRldmljZU5hbWU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucG9sbEludGVydmFsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRUYXJnZXQucG9sbEludGVydmFsTXN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBwb2xsSW50ZXJ2YWxNczogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmNvbm5lY3Rpb25Db25maWcnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxUZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0VGFyZ2V0LmNvbm5lY3Rpb25Db25maWd9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBjb25uZWN0aW9uQ29uZmlnOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRhdGFQb2ludE1hcHBpbmcnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxUZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0VGFyZ2V0LmRhdGFQb2ludHN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBkYXRhUG9pbnRzOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAgPERpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXsoKSA9PiBzZXRFZGl0VGFyZ2V0KG51bGwpfT57dCgnY29tbW9uLmNhbmNlbCcpfTwvQnV0dG9uPlxuICAgICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtzYXZlRWRpdH0gZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHt1cGRhdGVNdXRhdGlvbi5pc1BlbmRpbmcgJiYgPExvYWRlcjIgY2xhc3NOYW1lPVwibXItMSBoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+fVxuICAgICAgICAgICAgICB7dCgnY29tbW9uLnNhdmUnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvRGlhbG9nRm9vdGVyPlxuICAgICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g5Yib5bu66L+e5o6l6YWN572u6Z2i5p2/77yI6K6+5aSH5pyq5YWz6IGU572R5YWz6K6+5aSH5pe25pi+56S677yJXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8qKiDliJvlu7rpnaLmnb/lsZ7mgKcgKi9cbmludGVyZmFjZSBDcmVhdGVDb25uZWN0aW9uUGFuZWxQcm9wcyB7XG4gIGRldmljZUlkOiBzdHJpbmc7XG4gIGRldmljZU5hbWU6IHN0cmluZztcbiAgY3JlYXRlTXV0YXRpb246IFJldHVyblR5cGU8dHlwZW9mIHVzZUNyZWF0ZUdhdGV3YXlEZXZpY2U+O1xuICB0ZXN0Q29ubk11dGF0aW9uOiBSZXR1cm5UeXBlPHR5cGVvZiB1c2VUZXN0Q29ubmVjdGlvbj47XG59XG5cbi8qKiDpu5jorqTov57mjqXphY3nva7mqKHmnb8gKi9cbmNvbnN0IGRlZmF1bHRDb25maWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBvcGN1YTogSlNPTi5zdHJpbmdpZnkoeyBlbmRwb2ludDogJ29wYy50Y3A6Ly9sb2NhbGhvc3Q6NDg0MCcsIHNlY3VyaXR5TW9kZTogJ05vbmUnIH0sIG51bGwsIDIpLFxuICAnbW9kYnVzLXRjcCc6IEpTT04uc3RyaW5naWZ5KHsgaG9zdDogJzE5Mi4xNjguMS4xMDAnLCBwb3J0OiA1MDIsIHVuaXRJZDogMSB9LCBudWxsLCAyKSxcbiAgJ21vZGJ1cy1ydHUnOiBKU09OLnN0cmluZ2lmeSh7IHBvcnQ6ICcvZGV2L3R0eVVTQjAnLCBiYXVkUmF0ZTogOTYwMCwgcGFyaXR5OiAnbm9uZScsIHVuaXRJZDogMSB9LCBudWxsLCAyKSxcbn07XG5cbi8qKiDpu5jorqTmlbDmja7ngrnmqKHmnb8gKi9cbmNvbnN0IGRlZmF1bHREYXRhUG9pbnRzID0gSlNPTi5zdHJpbmdpZnkoeyB0ZW1wZXJhdHVyZTogJzQwMDAwMScsIHByZXNzdXJlOiAnNDAwMDAyJyB9LCBudWxsLCAyKTtcblxuLyoqXG4gKiDliJvlu7rov57mjqXphY3nva7pnaLmnb9cbiAqXG4gKiDlvZPorr7lpIflsJrmnKrlhbPogZTnvZHlhbPph4fpm4bphY3nva7ml7bmmL7npLrvvIzmj5DkvpvlrozmlbTnmoTliJvlu7rooajljZXjgIJcbiAqIOWIm+W7uuaXtuiHquWKqOWwhiBkZXZpY2VJZCDlhbPogZTliLDlvZPliY3orr7lpIfjgIJcbiAqL1xuZnVuY3Rpb24gQ3JlYXRlQ29ubmVjdGlvblBhbmVsKHsgZGV2aWNlSWQsIGRldmljZU5hbWUsIGNyZWF0ZU11dGF0aW9uLCB0ZXN0Q29ubk11dGF0aW9uIH06IENyZWF0ZUNvbm5lY3Rpb25QYW5lbFByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyBkYXRhOiBnYXRld2F5cyB9ID0gdXNlR2F0ZXdheXMoKTtcbiAgY29uc3QgW2Zvcm0sIHNldEZvcm1dID0gdXNlU3RhdGUoe1xuICAgIHByb3RvY29sOiAnb3BjdWEnLFxuICAgIGNvbm5lY3Rpb25Db25maWc6IGRlZmF1bHRDb25maWdzLm9wY3VhLFxuICAgIGRhdGFQb2ludHM6IGRlZmF1bHREYXRhUG9pbnRzLFxuICAgIHBvbGxJbnRlcnZhbE1zOiAzMDAwLFxuICAgIGdhdGV3YXlJZDogJycsXG4gIH0pO1xuICBjb25zdCBbdGVzdFJlc3VsdCwgc2V0VGVzdFJlc3VsdF0gPSB1c2VTdGF0ZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqIOWIh+aNouWNj+iuruaXtuabtOaWsOi/nuaOpemFjee9ruaooeadvyAqL1xuICBjb25zdCBoYW5kbGVQcm90b2NvbENoYW5nZSA9IChwcm90b2NvbDogc3RyaW5nKSA9PiB7XG4gICAgc2V0Rm9ybSh7XG4gICAgICAuLi5mb3JtLFxuICAgICAgcHJvdG9jb2wsXG4gICAgICBjb25uZWN0aW9uQ29uZmlnOiBkZWZhdWx0Q29uZmlnc1twcm90b2NvbF0gPz8gJ3t9JyxcbiAgICB9KTtcbiAgfTtcblxuICAvKiog5o+Q5Lqk5Yib5bu677yM6Ieq5Yqo5L2/55So5b2T5YmN6K6+5aSH5ZCN56ewICovXG4gIGNvbnN0IGhhbmRsZUNyZWF0ZSA9ICgpID0+IHtcbiAgICBjcmVhdGVNdXRhdGlvbi5tdXRhdGUoe1xuICAgICAgZGV2aWNlTmFtZSxcbiAgICAgIHByb3RvY29sOiBmb3JtLnByb3RvY29sLFxuICAgICAgY29ubmVjdGlvbkNvbmZpZzogZm9ybS5jb25uZWN0aW9uQ29uZmlnLFxuICAgICAgZGF0YVBvaW50czogZm9ybS5kYXRhUG9pbnRzLFxuICAgICAgcG9sbEludGVydmFsTXM6IGZvcm0ucG9sbEludGVydmFsTXMsXG4gICAgICBkZXZpY2VJZCxcbiAgICAgIGdhdGV3YXlJZDogZm9ybS5nYXRld2F5SWQgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9O1xuXG4gIC8qKiDmtYvor5Xov57mjqUgKi9cbiAgY29uc3QgcnVuVGVzdCA9ICgpID0+IHtcbiAgICBzZXRUZXN0UmVzdWx0KG51bGwpO1xuICAgIHRlc3RDb25uTXV0YXRpb24ubXV0YXRlKFxuICAgICAgeyBwcm90b2NvbDogZm9ybS5wcm90b2NvbCwgY29ubmVjdGlvbkNvbmZpZzogZm9ybS5jb25uZWN0aW9uQ29uZmlnIH0sXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzczogKHJlc3VsdCkgPT4gc2V0VGVzdFJlc3VsdChyZXN1bHQpLFxuICAgICAgICBvbkVycm9yOiAoKSA9PiBzZXRUZXN0UmVzdWx0KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IHQoJ2RldmljZS5jb25uZWN0aW9uLnRlc3RGYWlsZWQnKSB9KSxcbiAgICAgIH0sXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24uY3JlYXRlVGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5jcmVhdGVEZXNjcmlwdGlvbicpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7Lyog5Y2P6K6u6YCJ5oupICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLnByb3RvY29sJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMyBnYXAtM1wiPlxuICAgICAgICAgICAgICB7T2JqZWN0LmVudHJpZXMocHJvdG9jb2xNZXRhKS5tYXAoKFtrZXksIG1ldGFdKSA9PiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAga2V5PXtrZXl9XG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVByb3RvY29sQ2hhbmdlKGtleSl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLWxnIGJvcmRlciBwLTMgdGV4dC1zbSB0cmFuc2l0aW9uLWNvbG9ycyAke1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnByb3RvY29sID09PSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICA/ICdib3JkZXItcHJpbWFyeSBiZy1wcmltYXJ5LzUgdGV4dC1wcmltYXJ5J1xuICAgICAgICAgICAgICAgICAgICAgIDogJ2JvcmRlci1ib3JkZXIgaG92ZXI6Ym9yZGVyLXByaW1hcnkvNTAnXG4gICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7bWV0YS5pY29ufVxuICAgICAgICAgICAgICAgICAgPHNwYW4+e21ldGEubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOe9keWFs+mAieaLqSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5nYXRld2F5SWQnKX08L0xhYmVsPlxuICAgICAgICAgICAgPFNlbGVjdCB2YWx1ZT17Zm9ybS5nYXRld2F5SWQgfHwgdW5kZWZpbmVkfSBvblZhbHVlQ2hhbmdlPXsodikgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIGdhdGV3YXlJZDogdiA/PyAnJyB9KX0+XG4gICAgICAgICAgICAgIDxTZWxlY3RUcmlnZ2VyPlxuICAgICAgICAgICAgICAgIDxTZWxlY3RWYWx1ZSBwbGFjZWhvbGRlcj1cIumAieaLqee9keWFs++8iOWPr+mAie+8iVwiIC8+XG4gICAgICAgICAgICAgIDwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgPFNlbGVjdENvbnRlbnQ+XG4gICAgICAgICAgICAgICAge2dhdGV3YXlzPy5maWx0ZXIoKGcpID0+IGcuc3RhdHVzID09PSAnb25saW5lJykubWFwKChnKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSBrZXk9e2cuZ2F0ZXdheUlkfSB2YWx1ZT17Zy5nYXRld2F5SWR9PlxuICAgICAgICAgICAgICAgICAgICB7Zy5uYW1lfe+8iHtnLmdhdGV3YXlJZH3vvIlcbiAgICAgICAgICAgICAgICAgIDwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICB7KCFnYXRld2F5cyB8fCBnYXRld2F5cy5maWx0ZXIoKGcpID0+IGcuc3RhdHVzID09PSAnb25saW5lJykubGVuZ3RoID09PSAwKSAmJiAoXG4gICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIl9ub25lXCIgZGlzYWJsZWQ+5pqC5peg5Zyo57q/572R5YWzPC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIDwvU2VsZWN0PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7pgInmi6notJ/otKPph4fpm4bor6Xorr7lpIfmlbDmja7nmoTovrnnvJjnvZHlhbPvvIzkuI3pgInliJnkvb/nlKjpu5jorqTnvZHlhbM8L3A+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog6YeH6ZuG6Ze06ZqUICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLnBvbGxJbnRlcnZhbCcpfTwvTGFiZWw+XG4gICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgIG1pbj17MTAwfVxuICAgICAgICAgICAgICB2YWx1ZT17Zm9ybS5wb2xsSW50ZXJ2YWxNc31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgcG9sbEludGVydmFsTXM6IE51bWJlcihlLnRhcmdldC52YWx1ZSkgfSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucG9sbEludGVydmFsSGludCcpfTwvcD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiDov57mjqXphY3nva4gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmNvbm5lY3Rpb24uY29ubmVjdGlvbkNvbmZpZycpfTwvTGFiZWw+XG4gICAgICAgICAgICA8VGV4dGFyZWFcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICByb3dzPXs0fVxuICAgICAgICAgICAgICB2YWx1ZT17Zm9ybS5jb25uZWN0aW9uQ29uZmlnfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm0oeyAuLi5mb3JtLCBjb25uZWN0aW9uQ29uZmlnOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog5pWw5o2u54K55pig5bCEICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRhdGFQb2ludE1hcHBpbmcnKX08L0xhYmVsPlxuICAgICAgICAgICAgPFRleHRhcmVhXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LXhzXCJcbiAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgdmFsdWU9e2Zvcm0uZGF0YVBvaW50c31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgZGF0YVBvaW50czogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOaTjeS9nOaMiemSriAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB0LTJcIj5cbiAgICAgICAgICAgIDxCdXR0b24gb25DbGljaz17aGFuZGxlQ3JlYXRlfSBkaXNhYmxlZD17Y3JlYXRlTXV0YXRpb24uaXNQZW5kaW5nfT5cbiAgICAgICAgICAgICAge2NyZWF0ZU11dGF0aW9uLmlzUGVuZGluZyAmJiA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz59XG4gICAgICAgICAgICAgIHt0KCdkZXZpY2UuY29ubmVjdGlvbi5jcmVhdGVBbmRMaW5rJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXtydW5UZXN0fSBkaXNhYmxlZD17dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmd9PlxuICAgICAgICAgICAgICB7dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+fVxuICAgICAgICAgICAgICB7dCgnZGV2aWNlLmNvbm5lY3Rpb24udGVzdENvbm5lY3Rpb24nKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuXG4gICAgICB7Lyog5rWL6K+V57uT5p6cICovfVxuICAgICAge3Rlc3RSZXN1bHQgJiYgKFxuICAgICAgICA8Q2FyZCBjbGFzc05hbWU9e3Rlc3RSZXN1bHQuc3VjY2VzcyA/ICdib3JkZXItZ3JlZW4tNTAwLzMwJyA6ICdib3JkZXItcmVkLTUwMC8zMCd9PlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweS0zXCI+XG4gICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17dGVzdFJlc3VsdC5zdWNjZXNzID8gJ2RlZmF1bHQnIDogJ2Rlc3RydWN0aXZlJ30+XG4gICAgICAgICAgICAgIHt0ZXN0UmVzdWx0LnN1Y2Nlc3MgPyB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0U3VjY2VzcycpIDogdCgnZGV2aWNlLmNvbm5lY3Rpb24udGVzdEZhaWxlZCcpfVxuICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj57dGVzdFJlc3VsdC5tZXNzYWdlfTwvc3Bhbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cInNtXCIgY2xhc3NOYW1lPVwibWwtYXV0b1wiIG9uQ2xpY2s9eygpID0+IHNldFRlc3RSZXN1bHQobnVsbCl9PlxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmNsb3NlJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyDorr7lpIfln7rmnKzkv6Hmga/ljaHniYfvvIjmlK/mjIHooYzlhoXnvJbovpHvvIlcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLyoqIOiuvuWkh+S/oeaBr+WNoeeJh+WxnuaApyAqL1xuaW50ZXJmYWNlIERldmljZUluZm9DYXJkUHJvcHMge1xuICBkZXZpY2U6IERldmljZTtcbn1cblxuLyoqXG4gKiDorr7lpIfln7rmnKzkv6Hmga/ljaHniYdcbiAqXG4gKiDpu5jorqTmmL7npLrlj6ror7vkv6Hmga/vvIzngrnlh7vnvJbovpHmjInpkq7lkI7lrZfmrrXlj5jkuLrovpPlhaXmoYbvvIzmlK/mjIHooYzlhoXkv67mlLnkv53lrZjjgIJcbiAqIOWPque8lui+kSBEZXZpY2Ug57G75Z6L5Lit5a6e6ZmF5a2Y5Zyo5LiU55So5oi35Y+v5L+u5pS555qE5a2X5q6177yabmFtZeOAgXR5cGXjgIFtb2RlbOOAgW1hbnVmYWN0dXJlcuOAglxuICogc3RhdHVzIOWSjCBoZWFsdGhTY29yZSDkuLrns7vnu5/nu7TmiqTvvIzlp4vnu4jlj6ror7vjgIJcbiAqL1xuZnVuY3Rpb24gRGV2aWNlSW5mb0NhcmQoeyBkZXZpY2UgfTogRGV2aWNlSW5mb0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHVwZGF0ZU11dGF0aW9uID0gdXNlVXBkYXRlRGV2aWNlKCk7XG4gIGNvbnN0IFtlZGl0aW5nLCBzZXRFZGl0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2Zvcm0sIHNldEZvcm1dID0gdXNlU3RhdGUoe1xuICAgIG5hbWU6ICcnLFxuICAgIHR5cGU6ICcnLFxuICAgIG1vZGVsOiAnJyxcbiAgICBtYW51ZmFjdHVyZXI6ICcnLFxuICAgIGNyaXRpY2FsaXR5OiAnTm9ybWFsJyxcbiAgICBzZXJpYWxOdW1iZXI6ICcnLFxuICAgIGluc3RhbGxEYXRlOiAnJyxcbiAgICBnYXRld2F5SWQ6ICcnLFxuICAgIGRvd250aW1lQ29zdFBlckhvdXI6ICcnLFxuICB9KTtcblxuICAvKiog6L+b5YWl57yW6L6R5qih5byP77yI5Zue5pi+5b2T5YmN6K6+5aSH5qGj5qGI5a2X5q6177yJICovXG4gIGNvbnN0IHN0YXJ0RWRpdCA9ICgpID0+IHtcbiAgICBzZXRGb3JtKHtcbiAgICAgIG5hbWU6IGRldmljZS5uYW1lID8/ICcnLFxuICAgICAgdHlwZTogZGV2aWNlLnR5cGUgPz8gJycsXG4gICAgICBtb2RlbDogZGV2aWNlLm1vZGVsID8/ICcnLFxuICAgICAgbWFudWZhY3R1cmVyOiBkZXZpY2UubWFudWZhY3R1cmVyID8/ICcnLFxuICAgICAgY3JpdGljYWxpdHk6IGRldmljZS5jcml0aWNhbGl0eSA/PyAnTm9ybWFsJyxcbiAgICAgIHNlcmlhbE51bWJlcjogZGV2aWNlLnNlcmlhbE51bWJlciA/PyAnJyxcbiAgICAgIGluc3RhbGxEYXRlOiBkZXZpY2UuaW5zdGFsbERhdGUgPz8gJycsXG4gICAgICBnYXRld2F5SWQ6IGRldmljZS5nYXRld2F5SWQgPz8gJycsXG4gICAgICBkb3dudGltZUNvc3RQZXJIb3VyOiBkZXZpY2UuZG93bnRpbWVDb3N0UGVySG91ciAhPSBudWxsID8gU3RyaW5nKGRldmljZS5kb3dudGltZUNvc3RQZXJIb3VyKSA6ICcnLFxuICAgIH0pO1xuICAgIHNldEVkaXRpbmcodHJ1ZSk7XG4gIH07XG5cbiAgLyoqIOS/neWtmOS/ruaUue+8iOWPr+epuuWtl+auteepuuWAvOS8oCB1bmRlZmluZWTvvIzop6blj5HlkI7nq68gQ29uZGl0aW9uIOi3s+i/h+OAgeS/neaMgeWOn+WAvO+8iSAqL1xuICBjb25zdCBzYXZlRWRpdCA9ICgpID0+IHtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7XG4gICAgICAgIGlkOiBkZXZpY2UuaWQsXG4gICAgICAgIGRldmljZUNvZGU6IGRldmljZS5kZXZpY2VDb2RlLFxuICAgICAgICBuYW1lOiBmb3JtLm5hbWUsXG4gICAgICAgIHR5cGU6IGZvcm0udHlwZSxcbiAgICAgICAgbW9kZWw6IGZvcm0ubW9kZWwgfHwgdW5kZWZpbmVkLFxuICAgICAgICBtYW51ZmFjdHVyZXI6IGZvcm0ubWFudWZhY3R1cmVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY3JpdGljYWxpdHk6IGZvcm0uY3JpdGljYWxpdHkgfHwgdW5kZWZpbmVkLFxuICAgICAgICBzZXJpYWxOdW1iZXI6IGZvcm0uc2VyaWFsTnVtYmVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgaW5zdGFsbERhdGU6IGZvcm0uaW5zdGFsbERhdGUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBnYXRld2F5SWQ6IGZvcm0uZ2F0ZXdheUlkIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZG93bnRpbWVDb3N0UGVySG91cjogZm9ybS5kb3dudGltZUNvc3RQZXJIb3VyID8gTnVtYmVyKGZvcm0uZG93bnRpbWVDb3N0UGVySG91cikgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgeyBvblNldHRsZWQ6ICgpID0+IHNldEVkaXRpbmcoZmFsc2UpIH0sXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgcHgtNCBweS0yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5iYXNpY0luZm8nKX08L3NwYW4+XG4gICAgICAgIHtlZGl0aW5nID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMVwiPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIGNsYXNzTmFtZT1cImgtNyB3LTdcIiBvbkNsaWNrPXsoKSA9PiBzZXRFZGl0aW5nKGZhbHNlKX0+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgY2xhc3NOYW1lPVwiaC03IHctNyB0ZXh0LXByaW1hcnlcIiBvbkNsaWNrPXtzYXZlRWRpdH0gZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHt1cGRhdGVNdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+IDogPENoZWNrIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPn1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBjbGFzc05hbWU9XCJoLTcgdy03XCIgb25DbGljaz17c3RhcnRFZGl0fT5cbiAgICAgICAgICAgIDxQZW5jaWwgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00IHAtNCBtZDpncmlkLWNvbHMtMyBsZzpncmlkLWNvbHMtNFwiPlxuICAgICAgICB7ZWRpdGluZyA/IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5uYW1lJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0ubmFtZX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgbmFtZTogZS50YXJnZXQudmFsdWUgfSl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UudHlwZScpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxJbnB1dCBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiIHZhbHVlPXtmb3JtLnR5cGV9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLm1vZGVsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0ubW9kZWx9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIG1vZGVsOiBlLnRhcmdldC52YWx1ZSB9KX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5tYW51ZmFjdHVyZXInKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8SW5wdXQgY2xhc3NOYW1lPVwiaC04IHRleHQtc21cIiB2YWx1ZT17Zm9ybS5tYW51ZmFjdHVyZXJ9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIG1hbnVmYWN0dXJlcjogZS50YXJnZXQudmFsdWUgfSl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY3JpdGljYWxpdHknKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtmb3JtLmNyaXRpY2FsaXR5fSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0Rm9ybSh7IC4uLmZvcm0sIGNyaXRpY2FsaXR5OiB2IH0pOyB9fT5cbiAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgIHsoWydDcml0aWNhbCcsICdIaWdoJywgJ05vcm1hbCcsICdMb3cnXSBhcyBjb25zdCkubWFwKChjKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIGtleT17Y30gdmFsdWU9e2N9PntjfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgPC9TZWxlY3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2Uuc2VyaWFsTnVtYmVyJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0uc2VyaWFsTnVtYmVyfSBvbkNoYW5nZT17KGUpID0+IHNldEZvcm0oeyAuLi5mb3JtLCBzZXJpYWxOdW1iZXI6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmluc3RhbGxEYXRlJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdHlwZT1cImRhdGVcIiB2YWx1ZT17Zm9ybS5pbnN0YWxsRGF0ZX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgaW5zdGFsbERhdGU6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmdhdGV3YXlJZCcpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxJbnB1dCBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiIHZhbHVlPXtmb3JtLmdhdGV3YXlJZH0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgZ2F0ZXdheUlkOiBlLnRhcmdldC52YWx1ZSB9KX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5kb3dudGltZUNvc3RQZXJIb3VyJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdHlwZT1cIm51bWJlclwiIHN0ZXA9XCIwLjAxXCIgbWluPVwiMFwiIHZhbHVlPXtmb3JtLmRvd250aW1lQ29zdFBlckhvdXJ9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIGRvd250aW1lQ29zdFBlckhvdXI6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLnN0YXR1cycpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMVwiPjxEZXZpY2VTdGF0dXNCYWRnZSBzdGF0dXM9e2RldmljZS5zdGF0dXN9IC8+PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuaGVhbHRoU2NvcmUnKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIGZvbnQtbWVkaXVtXCI+e2RldmljZS5oZWFsdGhTY29yZX08L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UubmFtZScpfTwvcD48cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntkZXZpY2UubmFtZX08L3A+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS50eXBlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS50eXBlfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLm1vZGVsJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5tb2RlbCA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UubWFudWZhY3R1cmVyJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5tYW51ZmFjdHVyZXIgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNyaXRpY2FsaXR5Jyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5jcml0aWNhbGl0eSA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2Uuc2VyaWFsTnVtYmVyJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5zZXJpYWxOdW1iZXIgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmluc3RhbGxEYXRlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5pbnN0YWxsRGF0ZSA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuZ2F0ZXdheUlkJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5nYXRld2F5SWQgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmRvd250aW1lQ29zdFBlckhvdXInKX08L3A+PHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57ZGV2aWNlLmRvd250aW1lQ29zdFBlckhvdXIgIT0gbnVsbCA/IGRldmljZS5kb3dudGltZUNvc3RQZXJIb3VyIDogJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmxhc3RTZWVuQXQnKX08L3A+PHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57ZGV2aWNlLmxhc3RTZWVuQXQgPyBuZXcgRGF0ZShkZXZpY2UubGFzdFNlZW5BdCkudG9Mb2NhbGVTdHJpbmcoKSA6ICctJ308L3A+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5zdGF0dXMnKX08L3A+PERldmljZVN0YXR1c0JhZGdlIHN0YXR1cz17ZGV2aWNlLnN0YXR1c30gLz48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmhlYWx0aFNjb3JlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5oZWFsdGhTY29yZX08L3A+PC9kaXY+XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG4gICAgICA8L0NhcmRDb250ZW50PlxuICAgIDwvQ2FyZD5cbiAgKTtcbn1cbiJdfQ==