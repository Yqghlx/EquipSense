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
import { useRecentTelemetry } from "/src/hooks/useTelemetry.ts?t=1786275747212";
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
/** 根据时间范围标识返回滚动窗口长度，避免把动态时间戳放进查询键造成请求风暴。 */
function getTimeRangeDurationMilliseconds(range) {
	switch (range) {
		case "1h": return 36e5;
		case "6h": return 216e5;
		case "24h": return 864e5;
		case "7d": return 6048e5;
		default: return 36e5;
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
	const { data: telemetry } = useRecentTelemetry(id ?? "", selectedMetric, getTimeRangeDurationMilliseconds(timeRange));
	const { data: alertsData } = useAlerts({
		page: 1,
		pageSize: 20
	}, { deviceId: id });
	if (isLoading) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.loading")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 68,
		columnNumber: 25
	}, this);
	if (!device) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.noData")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 69,
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
						lineNumber: 80,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 79,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-2xl font-bold",
					children: device.name
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 83,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-muted-foreground",
					children: device.deviceCode
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 84,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ml-auto flex items-center gap-3",
					children: [/* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 11
					}, this), typeof device.healthScore === "number" && /* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-2 rounded-md border px-3 py-1.5",
						children: [
							/* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm text-muted-foreground",
								children: t("device.healthScore", "健康度")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 91,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: `text-lg font-bold ${device.healthScore >= 85 ? "text-green-600" : device.healthScore >= 70 ? "text-blue-600" : device.healthScore >= 50 ? "text-yellow-600" : "text-red-600"}`,
								children: device.healthScore.toFixed(1)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 92,
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
									lineNumber: 107,
									columnNumber: 17
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 99,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 86,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 78,
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
					lineNumber: 117,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(TabsTrigger, {
					value: "connection",
					className: "w-full justify-start px-3",
					children: t("device.tabs.connection")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 118,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 116,
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
								lineNumber: 126,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, {
								className: "flex flex-row items-center justify-between pb-2",
								children: [/* @__PURE__ */ _jsxDEV(CardTitle, {
									className: "text-base",
									children: t("device.telemetryTrends")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 131,
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
												lineNumber: 134,
												columnNumber: 59
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 134,
											columnNumber: 23
										}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "temperature",
												children: t("telemetry.temperature")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 136,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "pressure",
												children: t("telemetry.pressure")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 137,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "vibration",
												children: t("telemetry.vibration")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 138,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "humidity",
												children: t("telemetry.humidity")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 139,
												columnNumber: 25
											}, this)
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 135,
											columnNumber: 23
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 133,
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
												lineNumber: 143,
												columnNumber: 59
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 143,
											columnNumber: 23
										}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "1h",
												children: t("time.1hour")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 145,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "6h",
												children: t("time.6hours")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 146,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "24h",
												children: t("time.24hours")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 147,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ _jsxDEV(SelectItem, {
												value: "7d",
												children: t("time.7days")
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 148,
												columnNumber: 25
											}, this)
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 144,
											columnNumber: 23
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 142,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 132,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 130,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: chartData.length > 0 ? /* @__PURE__ */ _jsxDEV(TrendChart, {
								data: chartData,
								height: 300
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 155,
								columnNumber: 21
							}, this) : /* @__PURE__ */ _jsxDEV("div", {
								className: "flex h-[300px] items-center justify-center text-muted-foreground",
								children: t("common.noData")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 157,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 153,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 129,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "grid gap-6 lg:grid-cols-2",
								children: [/* @__PURE__ */ _jsxDEV(DataQualityOverviewCard, { deviceId: device.id }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 164,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
									className: "text-base",
									children: t("device.recentAlerts")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 166,
									columnNumber: 31
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 166,
									columnNumber: 19
								}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.alertCode") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 171,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.metric") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 172,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.value") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 173,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.severity") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 174,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 175,
										columnNumber: 27
									}, this),
									/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.time") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 176,
										columnNumber: 27
									}, this)
								] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 170,
									columnNumber: 25
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 169,
									columnNumber: 23
								}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: alertsData?.items.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
									colSpan: 6,
									className: "text-center text-muted-foreground",
									children: t("common.noData")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 181,
									columnNumber: 37
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 181,
									columnNumber: 27
								}, this) : alertsData?.items.map((alert) => /* @__PURE__ */ _jsxDEV(TableRow, { children: [
									/* @__PURE__ */ _jsxDEV(TableCell, {
										className: "font-mono text-sm",
										children: alert.alertCode
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 185,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.metric }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 186,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.value }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 187,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(SeverityBadge, { severity: alert.severity }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 188,
										columnNumber: 42
									}, this) }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 188,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
										variant: "outline",
										children: alert.status
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 189,
										columnNumber: 42
									}, this) }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 189,
										columnNumber: 31
									}, this),
									/* @__PURE__ */ _jsxDEV(TableCell, {
										className: "text-sm text-muted-foreground",
										children: new Date(alert.occurredAt).toLocaleString()
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 190,
										columnNumber: 31
									}, this)
								] }, alert.id, true, {
									fileName: _jsxFileName,
									lineNumber: 184,
									columnNumber: 29
								}, this)) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 179,
									columnNumber: 23
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 168,
									columnNumber: 21
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 167,
									columnNumber: 19
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 165,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 163,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 124,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 123,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(TabsContent, {
					value: "connection",
					children: /* @__PURE__ */ _jsxDEV(ConnectionConfigPanel, {
						deviceId: device.id,
						deviceName: device.name
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 204,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 203,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 121,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 115,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 76,
		columnNumber: 5
	}, this);
}
_s(DeviceDetailPage, "X53IU8/OyY9dpahJlgEdK7E0OYg=", false, function() {
	return [
		useTranslation,
		useParams,
		useNavigate,
		useDevice,
		useRefreshHealthScore,
		useRecentTelemetry,
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
				lineNumber: 290,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 289,
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
			lineNumber: 297,
			columnNumber: 12
		}, this);
	}
	const proto = protocolMeta[gwDevice.protocol] ?? {
		label: gwDevice.protocol,
		icon: /* @__PURE__ */ _jsxDEV(Plug, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 302,
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
					lineNumber: 320,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(CardDescription, {
					className: "mt-1",
					children: t("device.connection.description")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 321,
					columnNumber: 15
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 319,
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
							lineNumber: 330,
							columnNumber: 47
						}, this) : /* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-1 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 330,
							columnNumber: 99
						}, this), t("device.connection.testConnection")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 324,
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
							lineNumber: 340,
							columnNumber: 17
						}, this), t("common.edit")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 333,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 323,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 318,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 317,
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
								lineNumber: 350,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: gwDevice.deviceName
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 351,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 349,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.protocol")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 354,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Badge, {
								variant: "outline",
								className: proto.color,
								children: [proto.icon, /* @__PURE__ */ _jsxDEV("span", {
									className: "ml-1",
									children: proto.label
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 357,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 355,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 353,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.pollInterval")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 361,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: [gwDevice.pollIntervalMs, "ms"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 362,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 360,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-sm text-muted-foreground",
								children: t("device.connection.dataPoints")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 365,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: dpCount
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 366,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 364,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 348,
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
								lineNumber: 372,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm text-muted-foreground",
								children: gwDevice.enabled ? t("device.connection.enabled") : t("device.connection.disabled")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 376,
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
								lineNumber: 379,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "sm",
								className: "ml-auto text-destructive hover:text-destructive",
								onClick: () => setDeleteTarget(gwDevice.id),
								children: [/* @__PURE__ */ _jsxDEV(Trash2, { className: "mr-1 h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 388,
									columnNumber: 15
								}, this), t("common.delete")]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 382,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 371,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs font-medium text-muted-foreground mb-1",
							children: t("device.connection.connectionConfig")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 396,
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
							lineNumber: 397,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 395,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs font-medium text-muted-foreground mb-1",
							children: t("device.connection.dataPointMapping")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 402,
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
							lineNumber: 403,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 401,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 394,
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
						lineNumber: 410,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 346,
				columnNumber: 9
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 316,
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
							lineNumber: 418,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("span", {
							className: "text-sm",
							children: testResult.message
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 421,
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
							lineNumber: 422,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 417,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 416,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: !!deleteTarget,
				onOpenChange: (open) => !open && setDeleteTarget(null),
				children: /* @__PURE__ */ _jsxDEV(DialogContent, { children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("device.connection.deleteTitle") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 433,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("device.connection.deleteDescription") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 434,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 432,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					onClick: () => setDeleteTarget(null),
					children: t("common.cancel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 437,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					variant: "destructive",
					onClick: confirmDelete,
					disabled: deleteMutation.isPending,
					children: [deleteMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 439,
						columnNumber: 44
					}, this), t("common.delete")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 438,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 436,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 431,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 430,
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
							lineNumber: 450,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("device.connection.editDescription") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 451,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 449,
							columnNumber: 11
						}, this),
						editTarget && /* @__PURE__ */ _jsxDEV("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.deviceName") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 456,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Input, {
										value: editTarget.deviceName,
										onChange: (e) => setEditTarget({
											...editTarget,
											deviceName: e.target.value
										})
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 457,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 455,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.pollInterval") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 463,
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
										lineNumber: 464,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 462,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.connectionConfig") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 471,
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
										lineNumber: 472,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 470,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.dataPointMapping") }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 480,
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
										lineNumber: 481,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 479,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 454,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => setEditTarget(null),
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 491,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							onClick: saveEdit,
							disabled: updateMutation.isPending,
							children: [updateMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 493,
								columnNumber: 44
							}, this), t("common.save")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 492,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 490,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 448,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 447,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 314,
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
			lineNumber: 581,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("device.connection.createDescription") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 582,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 580,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.protocol") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 587,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "grid grid-cols-3 gap-3",
						children: Object.entries(protocolMeta).map(([key, meta]) => /* @__PURE__ */ _jsxDEV("button", {
							type: "button",
							onClick: () => handleProtocolChange(key),
							className: `flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${form.protocol === key ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`,
							children: [meta.icon, /* @__PURE__ */ _jsxDEV("span", { children: meta.label }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 601,
								columnNumber: 19
							}, this)]
						}, key, true, {
							fileName: _jsxFileName,
							lineNumber: 590,
							columnNumber: 17
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 588,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 586,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.gatewayId") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 609,
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
								lineNumber: 612,
								columnNumber: 17
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 611,
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
								lineNumber: 616,
								columnNumber: 19
							}, this)), (!gateways || gateways.filter((g) => g.status === "online").length === 0) && /* @__PURE__ */ _jsxDEV(SelectItem, {
								value: "_none",
								disabled: true,
								children: "暂无在线网关"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 621,
								columnNumber: 19
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 614,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 610,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs text-muted-foreground",
							children: "选择负责采集该设备数据的边缘网关，不选则使用默认网关"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 625,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 608,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.pollInterval") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 630,
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
							lineNumber: 631,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs text-muted-foreground",
							children: t("device.connection.pollIntervalHint")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 637,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 629,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.connectionConfig") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 642,
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
						lineNumber: 643,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 641,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.connection.dataPointMapping") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 653,
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
						lineNumber: 654,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 652,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-3 pt-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						onClick: handleCreate,
						disabled: createMutation.isPending,
						children: [createMutation.isPending && /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 665,
							columnNumber: 44
						}, this), t("device.connection.createAndLink")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 664,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						onClick: runTest,
						disabled: testConnMutation.isPending,
						children: [testConnMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 669,
							columnNumber: 45
						}, this) : /* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-1 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 669,
							columnNumber: 97
						}, this), t("device.connection.testConnection")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 668,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 663,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 584,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 579,
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
						lineNumber: 680,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("span", {
						className: "text-sm",
						children: testResult.message
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 683,
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
						lineNumber: 684,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 679,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 678,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 578,
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
			lineNumber: 765,
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
					lineNumber: 769,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 768,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				size: "icon",
				className: "h-7 w-7 text-primary",
				onClick: saveEdit,
				disabled: updateMutation.isPending,
				children: updateMutation.isPending ? /* @__PURE__ */ _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 772,
					columnNumber: 43
				}, this) : /* @__PURE__ */ _jsxDEV(Check, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 772,
					columnNumber: 90
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 771,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 767,
			columnNumber: 11
		}, this) : /* @__PURE__ */ _jsxDEV(Button, {
			variant: "ghost",
			size: "icon",
			className: "h-7 w-7",
			onClick: startEdit,
			children: /* @__PURE__ */ _jsxDEV(Pencil, { className: "h-4 w-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 777,
				columnNumber: 13
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 776,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 764,
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
					lineNumber: 785,
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
					lineNumber: 786,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 784,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.type")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 789,
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
					lineNumber: 790,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 788,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.model")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 793,
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
					lineNumber: 794,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 792,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.manufacturer")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 797,
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
					lineNumber: 798,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 796,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.criticality")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 801,
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
							lineNumber: 803,
							columnNumber: 56
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 803,
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
						lineNumber: 806,
						columnNumber: 21
					}, this)) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 804,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 802,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 800,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.serialNumber")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 812,
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
					lineNumber: 813,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 811,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.installDate")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 816,
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
					lineNumber: 817,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 815,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.gatewayId")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 820,
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
					lineNumber: 821,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 819,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV(Label, {
					className: "text-xs text-muted-foreground",
					children: t("device.downtimeCostPerHour")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 824,
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
					lineNumber: 825,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 823,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(Label, {
				className: "text-xs text-muted-foreground",
				children: t("common.status")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 828,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "mt-1",
				children: /* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 829,
					columnNumber: 37
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 829,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 827,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(Label, {
				className: "text-xs text-muted-foreground",
				children: t("device.healthScore")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 832,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "mt-1 font-medium",
				children: device.healthScore
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 833,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 831,
				columnNumber: 13
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 783,
			columnNumber: 11
		}, this) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.name")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 838,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.name
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 838,
				columnNumber: 85
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 838,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.type")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 839,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.type
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 839,
				columnNumber: 85
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 839,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.model")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.model ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 86
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 840,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.manufacturer")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.manufacturer ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 93
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 841,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.criticality")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.criticality ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 92
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 842,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.serialNumber")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 843,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.serialNumber ?? "-"
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
				children: t("device.installDate")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 844,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.installDate ?? "-"
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
				children: t("device.gatewayId")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.gatewayId ?? "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 90
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 845,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.downtimeCostPerHour")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.downtimeCostPerHour != null ? device.downtimeCostPerHour : "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 100
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 846,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.lastSeenAt")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "-"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 91
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 847,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("common.status")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 87
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 848,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("device.healthScore")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 18
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: device.healthScore
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 92
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 849,
				columnNumber: 13
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 837,
			columnNumber: 11
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 781,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 763,
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
import * as __vite_react_currentExports from "/src/pages/DeviceDetailPage.tsx?t=1786275747215";
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

//# sourceMappingURL=data:application/json;base64,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RCxhQUFLLHdCQUFDLEtBQUQ7SUFBRyxXQUFVO2NBQWlDLEVBQUUsb0JBQW9CO0dBQUs7Ozs7YUFBQyx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFlLE9BQU87R0FBZTs7OztXQUFNOzs7OztFQUN2STs7Ozs7Q0FFTzs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRldmljZURldGFpbFBhZ2UudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlUGFyYW1zLCB1c2VOYXZpZ2F0ZSB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IEFycm93TGVmdCwgUGx1ZywgTmV0d29yaywgUmFkaW8sIExvYWRlcjIsIFJlZnJlc2hDdywgUGVuY2lsLCBUcmFzaDIsIENoZWNrLCBYIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYnV0dG9uJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvY2FyZCc7XG5pbXBvcnQgeyBCYWRnZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYmFkZ2UnO1xuaW1wb3J0IHsgVGFibGUsIFRhYmxlQm9keSwgVGFibGVDZWxsLCBUYWJsZUhlYWQsIFRhYmxlSGVhZGVyLCBUYWJsZVJvdyB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvdGFibGUnO1xuaW1wb3J0IHsgU2VsZWN0LCBTZWxlY3RDb250ZW50LCBTZWxlY3RJdGVtLCBTZWxlY3RUcmlnZ2VyLCBTZWxlY3RWYWx1ZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvc2VsZWN0JztcbmltcG9ydCB7IFRhYnMsIFRhYnNDb250ZW50LCBUYWJzTGlzdCwgVGFic1RyaWdnZXIgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3RhYnMnO1xuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dIZWFkZXIsIERpYWxvZ1RpdGxlLCBEaWFsb2dEZXNjcmlwdGlvbiwgRGlhbG9nRm9vdGVyLCBEaWFsb2dDb250ZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9kaWFsb2cnO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9sYWJlbCc7XG5pbXBvcnQgeyBUZXh0YXJlYSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvdGV4dGFyZWEnO1xuaW1wb3J0IHsgU3dpdGNoIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9zd2l0Y2gnO1xuaW1wb3J0IHsgRGV2aWNlU3RhdHVzQmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL2RldmljZS9EZXZpY2VTdGF0dXNCYWRnZSc7XG5pbXBvcnQgeyBUcmVuZENoYXJ0IH0gZnJvbSAnLi4vY29tcG9uZW50cy9jaGFydHMvVHJlbmRDaGFydCc7XG5pbXBvcnQgeyBTZXZlcml0eUJhZGdlIH0gZnJvbSAnLi4vY29tcG9uZW50cy9hbGVydC9TZXZlcml0eUJhZGdlJztcbmltcG9ydCB7IERhdGFRdWFsaXR5T3ZlcnZpZXdDYXJkIH0gZnJvbSAnLi4vY29tcG9uZW50cy9kYXRhcXVhbGl0eS9EYXRhUXVhbGl0eU92ZXJ2aWV3JztcbmltcG9ydCB7IHVzZURldmljZSwgdXNlVXBkYXRlRGV2aWNlLCB1c2VSZWZyZXNoSGVhbHRoU2NvcmUgfSBmcm9tICcuLi9ob29rcy91c2VEZXZpY2VzJztcbmltcG9ydCB7IHVzZVJlY2VudFRlbGVtZXRyeSwgdHlwZSBUZWxlbWV0cnlEYXRhUG9pbnQgfSBmcm9tICcuLi9ob29rcy91c2VUZWxlbWV0cnknO1xuaW1wb3J0IHsgdXNlQWxlcnRzIH0gZnJvbSAnLi4vaG9va3MvdXNlQWxlcnRzJztcbmltcG9ydCB7XG4gIHVzZUdhdGV3YXlEZXZpY2VzLFxuICB1c2VVcGRhdGVHYXRld2F5RGV2aWNlLFxuICB1c2VEZWxldGVHYXRld2F5RGV2aWNlLFxuICB1c2VUZXN0Q29ubmVjdGlvbixcbiAgdXNlQ3JlYXRlR2F0ZXdheURldmljZSxcbn0gZnJvbSAnLi4vaG9va3MvdXNlR2F0ZXdheURldmljZXMnO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZSB9IGZyb20gJy4uL2xpYi91dGlscyc7XG5pbXBvcnQgeyB1c2VHYXRld2F5cyB9IGZyb20gJy4uL2hvb2tzL3VzZUdhdGV3YXlzJztcbmltcG9ydCB0eXBlIHsgRGV2aWNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKiog5Y2P6K6u5pi+56S65pig5bCEICovXG5jb25zdCBwcm90b2NvbE1ldGE6IFJlY29yZDxzdHJpbmcsIHsgbGFiZWw6IHN0cmluZzsgaWNvbjogUmVhY3QuUmVhY3ROb2RlOyBjb2xvcjogc3RyaW5nIH0+ID0ge1xuICBvcGN1YTogeyBsYWJlbDogJ09QQyBVQScsIGljb246IDxQbHVnIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPiwgY29sb3I6ICdiZy1ibHVlLTUwMC8xMCB0ZXh0LWJsdWUtNjAwJyB9LFxuICAnbW9kYnVzLXRjcCc6IHsgbGFiZWw6ICdNb2RidXMgVENQJywgaWNvbjogPE5ldHdvcmsgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+LCBjb2xvcjogJ2JnLWdyZWVuLTUwMC8xMCB0ZXh0LWdyZWVuLTYwMCcgfSxcbiAgJ21vZGJ1cy1ydHUnOiB7IGxhYmVsOiAnTW9kYnVzIFJUVScsIGljb246IDxSYWRpbyBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz4sIGNvbG9yOiAnYmctb3JhbmdlLTUwMC8xMCB0ZXh0LW9yYW5nZS02MDAnIH0sXG59O1xuXG4vKiog5qC55o2u5pe26Ze06IyD5Zu05qCH6K+G6L+U5Zue5rua5Yqo56qX5Y+j6ZW/5bqm77yM6YG/5YWN5oqK5Yqo5oCB5pe26Ze05oiz5pS+6L+b5p+l6K+i6ZSu6YCg5oiQ6K+35rGC6aOO5pq044CCICovXG5mdW5jdGlvbiBnZXRUaW1lUmFuZ2VEdXJhdGlvbk1pbGxpc2Vjb25kcyhyYW5nZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgc3dpdGNoIChyYW5nZSkge1xuICAgIGNhc2UgJzFoJzogcmV0dXJuIDNfNjAwXzAwMDtcbiAgICBjYXNlICc2aCc6IHJldHVybiAyMV82MDBfMDAwO1xuICAgIGNhc2UgJzI0aCc6IHJldHVybiA4Nl80MDBfMDAwO1xuICAgIGNhc2UgJzdkJzogcmV0dXJuIDYwNF84MDBfMDAwO1xuICAgIGRlZmF1bHQ6IHJldHVybiAzXzYwMF8wMDA7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRGV2aWNlRGV0YWlsUGFnZSgpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGlkIH0gPSB1c2VQYXJhbXM8eyBpZDogc3RyaW5nIH0+KCk7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcbiAgY29uc3QgW3NlbGVjdGVkTWV0cmljLCBzZXRTZWxlY3RlZE1ldHJpY10gPSB1c2VTdGF0ZSgndGVtcGVyYXR1cmUnKTtcbiAgY29uc3QgW3RpbWVSYW5nZSwgc2V0VGltZVJhbmdlXSA9IHVzZVN0YXRlKCcxaCcpO1xuXG4gIGNvbnN0IHsgZGF0YTogZGV2aWNlLCBpc0xvYWRpbmcgfSA9IHVzZURldmljZShpZCA/PyAnJyk7XG4gIGNvbnN0IHJlZnJlc2hIZWFsdGggPSB1c2VSZWZyZXNoSGVhbHRoU2NvcmUoKTtcbiAgY29uc3QgeyBkYXRhOiB0ZWxlbWV0cnkgfSA9IHVzZVJlY2VudFRlbGVtZXRyeShcbiAgICBpZCA/PyAnJyxcbiAgICBzZWxlY3RlZE1ldHJpYyxcbiAgICBnZXRUaW1lUmFuZ2VEdXJhdGlvbk1pbGxpc2Vjb25kcyh0aW1lUmFuZ2UpLFxuICApO1xuICBjb25zdCB7IGRhdGE6IGFsZXJ0c0RhdGEgfSA9IHVzZUFsZXJ0cyh7IHBhZ2U6IDEsIHBhZ2VTaXplOiAyMCB9LCB7IGRldmljZUlkOiBpZCB9KTtcblxuICBpZiAoaXNMb2FkaW5nKSByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJweS0yMCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L2Rpdj47XG4gIGlmICghZGV2aWNlKSByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJweS0yMCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvZGl2PjtcblxuICBjb25zdCBjaGFydERhdGEgPSBBcnJheS5pc0FycmF5KHRlbGVtZXRyeSlcbiAgICA/ICh0ZWxlbWV0cnkgYXMgVGVsZW1ldHJ5RGF0YVBvaW50W10pLm1hcCgocCkgPT4gKHsgdGltZTogcC50aW1lLCB2YWx1ZTogcC52YWx1ZSB9KSlcbiAgICA6IFtdO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTZcIj5cbiAgICAgIHsvKiDpobXlpLTvvJrov5Tlm57mjInpkq4gKyDorr7lpIflkI3np7AgKyDnirbmgIEgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0ZSgnL2RldmljZXMnKX0+XG4gICAgICAgICAgPEFycm93TGVmdCBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZFwiPntkZXZpY2UubmFtZX08L2gxPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e2RldmljZS5kZXZpY2VDb2RlfTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgIDxEZXZpY2VTdGF0dXNCYWRnZSBzdGF0dXM9e2RldmljZS5zdGF0dXN9IC8+XG4gICAgICAgICAgey8qIOiuvuWkh+WBpeW6t+W6puWxleekuiArIOWIt+aWsOaMiemSriAqL31cbiAgICAgICAgICB7dHlwZW9mIGRldmljZS5oZWFsdGhTY29yZSA9PT0gJ251bWJlcicgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLW1kIGJvcmRlciBweC0zIHB5LTEuNVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuaGVhbHRoU2NvcmUnLCAn5YGl5bq35bqmJyl9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B0ZXh0LWxnIGZvbnQtYm9sZCAke1xuICAgICAgICAgICAgICAgIGRldmljZS5oZWFsdGhTY29yZSA+PSA4NSA/ICd0ZXh0LWdyZWVuLTYwMCdcbiAgICAgICAgICAgICAgICAgIDogZGV2aWNlLmhlYWx0aFNjb3JlID49IDcwID8gJ3RleHQtYmx1ZS02MDAnXG4gICAgICAgICAgICAgICAgICAgIDogZGV2aWNlLmhlYWx0aFNjb3JlID49IDUwID8gJ3RleHQteWVsbG93LTYwMCcgOiAndGV4dC1yZWQtNjAwJ1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAge2RldmljZS5oZWFsdGhTY29yZS50b0ZpeGVkKDEpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICB2YXJpYW50PVwiZ2hvc3RcIlxuICAgICAgICAgICAgICAgIHNpemU9XCJpY29uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTcgdy03XCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17cmVmcmVzaEhlYWx0aC5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVmcmVzaEhlYWx0aC5tdXRhdGUoZGV2aWNlLmlkKX1cbiAgICAgICAgICAgICAgICB0aXRsZT17dCgnZGV2aWNlLnJlZnJlc2hIZWFsdGgnLCAn5Yi35paw5YGl5bq35bqmJyl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8UmVmcmVzaEN3IGNsYXNzTmFtZT17YGgtNCB3LTQgJHtyZWZyZXNoSGVhbHRoLmlzUGVuZGluZyA/ICdhbmltYXRlLXNwaW4nIDogJyd9YH0gLz5cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogVGFiIOW4g+WxgO+8muamguiniCArIOi/nuaOpemFjee9riAqL31cbiAgICAgIDxUYWJzIGRlZmF1bHRWYWx1ZT1cIm92ZXJ2aWV3XCIgY2xhc3NOYW1lPVwiZmxleCBnYXAtNiBpdGVtcy1zdGFydFwiPlxuICAgICAgICA8VGFic0xpc3QgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCB3LTQ0IHNocmluay0wIGJnLW11dGVkLzUwIHAtMSBnYXAtMC41XCI+XG4gICAgICAgICAgPFRhYnNUcmlnZ2VyIHZhbHVlPVwib3ZlcnZpZXdcIiBjbGFzc05hbWU9XCJ3LWZ1bGwganVzdGlmeS1zdGFydCBweC0zXCI+e3QoJ2RldmljZS50YWJzLm92ZXJ2aWV3Jyl9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgICA8VGFic1RyaWdnZXIgdmFsdWU9XCJjb25uZWN0aW9uXCIgY2xhc3NOYW1lPVwidy1mdWxsIGp1c3RpZnktc3RhcnQgcHgtM1wiPnt0KCdkZXZpY2UudGFicy5jb25uZWN0aW9uJyl9PC9UYWJzVHJpZ2dlcj5cbiAgICAgICAgPC9UYWJzTGlzdD5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wIHNwYWNlLXktNFwiPlxuICAgICAgICAgIHsvKiDmpoLop4ggVGFiICovfVxuICAgICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cIm92ZXJ2aWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgICAgICAgICB7Lyog6K6+5aSH5Z+65pys5L+h5oGv5Y2h54mH77yI5pSv5oyB6KGM5YaF57yW6L6R77yJICovfVxuICAgICAgICAgICAgICA8RGV2aWNlSW5mb0NhcmQgZGV2aWNlPXtkZXZpY2V9IC8+XG5cbiAgICAgICAgICAgICAgey8qIOmBpea1i+aVsOaNrui2i+WKv+WbviAqL31cbiAgICAgICAgICAgICAgPENhcmQ+XG4gICAgICAgICAgICAgICAgPENhcmRIZWFkZXIgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwidGV4dC1iYXNlXCI+e3QoJ2RldmljZS50ZWxlbWV0cnlUcmVuZHMnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtzZWxlY3RlZE1ldHJpY30gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYpIHNldFNlbGVjdGVkTWV0cmljKHYpOyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTMyIGgtOFwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwidGVtcGVyYXR1cmVcIj57dCgndGVsZW1ldHJ5LnRlbXBlcmF0dXJlJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJwcmVzc3VyZVwiPnt0KCd0ZWxlbWV0cnkucHJlc3N1cmUnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cInZpYnJhdGlvblwiPnt0KCd0ZWxlbWV0cnkudmlicmF0aW9uJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJodW1pZGl0eVwiPnt0KCd0ZWxlbWV0cnkuaHVtaWRpdHknKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPFNlbGVjdCB2YWx1ZT17dGltZVJhbmdlfSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0VGltZVJhbmdlKHYpOyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTI0IGgtOFwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiMWhcIj57dCgndGltZS4xaG91cicpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiNmhcIj57dCgndGltZS42aG91cnMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIjI0aFwiPnt0KCd0aW1lLjI0aG91cnMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIjdkXCI+e3QoJ3RpbWUuN2RheXMnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgICAgICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgICAgICAgICAgICB7Y2hhcnREYXRhLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxUcmVuZENoYXJ0IGRhdGE9e2NoYXJ0RGF0YX0gaGVpZ2h0PXszMDB9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaC1bMzAwcHhdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLm5vRGF0YScpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICAgICAgICA8L0NhcmQ+XG5cbiAgICAgICAgICAgICAgey8qIOaVsOaNrui0qOmHjyArIOacgOi/keWRiuitpu+8iOWPjOWIl+W4g+WxgO+8iSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC02IGxnOmdyaWQtY29scy0yXCI+XG4gICAgICAgICAgICAgICAgPERhdGFRdWFsaXR5T3ZlcnZpZXdDYXJkIGRldmljZUlkPXtkZXZpY2UuaWR9IC8+XG4gICAgICAgICAgICAgICAgPENhcmQ+XG4gICAgICAgICAgICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPnt0KCdkZXZpY2UucmVjZW50QWxlcnRzJyl9PC9DYXJkVGl0bGU+PC9DYXJkSGVhZGVyPlxuICAgICAgICAgICAgICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8VGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZGVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdhbGVydC5hbGVydENvZGUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnYWxlcnQubWV0cmljJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnZhbHVlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnNldmVyaXR5Jyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2NvbW1vbi5zdGF0dXMnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLnRpbWUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAge2FsZXJ0c0RhdGE/Lml0ZW1zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PjxUYWJsZUNlbGwgY29sU3Bhbj17Nn0gY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5ub0RhdGEnKX08L1RhYmxlQ2VsbD48L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnRzRGF0YT8uaXRlbXMubWFwKChhbGVydCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZVJvdyBrZXk9e2FsZXJ0LmlkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtc21cIj57YWxlcnQuYWxlcnRDb2RlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57YWxlcnQubWV0cmljfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57YWxlcnQudmFsdWV9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxTZXZlcml0eUJhZGdlIHNldmVyaXR5PXthbGVydC5zZXZlcml0eX0gLz48L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+e2FsZXJ0LnN0YXR1c308L0JhZGdlPjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntuZXcgRGF0ZShhbGVydC5vY2N1cnJlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICA8L1RhYmxlPlxuICAgICAgICAgICAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgICAgICAgICAgICA8L0NhcmQ+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9UYWJzQ29udGVudD5cblxuICAgICAgICAgIHsvKiDov57mjqXphY3nva4gVGFiICovfVxuICAgICAgICAgIDxUYWJzQ29udGVudCB2YWx1ZT1cImNvbm5lY3Rpb25cIj5cbiAgICAgICAgICAgIDxDb25uZWN0aW9uQ29uZmlnUGFuZWwgZGV2aWNlSWQ9e2RldmljZS5pZH0gZGV2aWNlTmFtZT17ZGV2aWNlLm5hbWV9IC8+XG4gICAgICAgICAgPC9UYWJzQ29udGVudD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L1RhYnM+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIOi/nuaOpemFjee9ruWtkOe7hOS7tlxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKiog6L+e5o6l6YWN572u6Z2i5p2/5bGe5oCnICovXG5pbnRlcmZhY2UgQ29ubmVjdGlvbkNvbmZpZ1BhbmVsUHJvcHMge1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBkZXZpY2VOYW1lOiBzdHJpbmc7XG59XG5cbi8qKlxuICog6L+e5o6l6YWN572u6Z2i5p2/XG4gKlxuICog5bGV56S65b2T5YmN6K6+5aSH5YWz6IGU55qE572R5YWz6YeH6ZuG6YWN572u77yM5pSv5oyB57yW6L6R44CB5rWL6K+V6L+e5o6l5ZKM5ZCv5YGc5pON5L2c44CCXG4gKiDlpoLmnpzorr7lpIflsJrmnKrlhbPogZTnvZHlhbPorr7lpIfphY3nva7vvIzmmL7npLrmj5DnpLrkv6Hmga/jgIJcbiAqL1xuZnVuY3Rpb24gQ29ubmVjdGlvbkNvbmZpZ1BhbmVsKHsgZGV2aWNlSWQsIGRldmljZU5hbWUgfTogQ29ubmVjdGlvbkNvbmZpZ1BhbmVsUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGRhdGE6IGdhdGV3YXlEZXZpY2VzLCBpc0xvYWRpbmcgfSA9IHVzZUdhdGV3YXlEZXZpY2VzKCk7XG4gIGNvbnN0IHVwZGF0ZU11dGF0aW9uID0gdXNlVXBkYXRlR2F0ZXdheURldmljZSgpO1xuICBjb25zdCBkZWxldGVNdXRhdGlvbiA9IHVzZURlbGV0ZUdhdGV3YXlEZXZpY2UoKTtcbiAgY29uc3QgdGVzdENvbm5NdXRhdGlvbiA9IHVzZVRlc3RDb25uZWN0aW9uKCk7XG4gIGNvbnN0IGNyZWF0ZU11dGF0aW9uID0gdXNlQ3JlYXRlR2F0ZXdheURldmljZSgpO1xuXG4gIC8qKiDmn6Xmib7lvZPliY3orr7lpIflhbPogZTnmoTnvZHlhbPorr7lpIfphY3nva4gKi9cbiAgY29uc3QgZ3dEZXZpY2UgPSBnYXRld2F5RGV2aWNlcz8uZmluZCgoZCkgPT4gZC5kZXZpY2VJZCA9PT0gZGV2aWNlSWQpO1xuXG4gIGNvbnN0IFtlZGl0VGFyZ2V0LCBzZXRFZGl0VGFyZ2V0XSA9IHVzZVN0YXRlPHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGRldmljZU5hbWU6IHN0cmluZztcbiAgICBjb25uZWN0aW9uQ29uZmlnOiBzdHJpbmc7XG4gICAgZGF0YVBvaW50czogc3RyaW5nO1xuICAgIHBvbGxJbnRlcnZhbE1zOiBudW1iZXI7XG4gIH0gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2RlbGV0ZVRhcmdldCwgc2V0RGVsZXRlVGFyZ2V0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbdGVzdFJlc3VsdCwgc2V0VGVzdFJlc3VsdF0gPSB1c2VTdGF0ZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqIOWIh+aNouWQr+WBnCAqL1xuICBjb25zdCB0b2dnbGVFbmFibGVkID0gKGlkOiBzdHJpbmcsIGN1cnJlbnQ6IGJvb2xlYW4pID0+IHtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoeyBpZCwgZW5hYmxlZDogIWN1cnJlbnQgfSk7XG4gIH07XG5cbiAgLyoqIOa1i+ivlei/nuaOpSAqL1xuICBjb25zdCBydW5UZXN0Q29ubmVjdGlvbiA9IChwcm90b2NvbDogc3RyaW5nLCBjb25uZWN0aW9uQ29uZmlnOiBzdHJpbmcpID0+IHtcbiAgICBzZXRUZXN0UmVzdWx0KG51bGwpO1xuICAgIHRlc3RDb25uTXV0YXRpb24ubXV0YXRlKFxuICAgICAgeyBwcm90b2NvbCwgY29ubmVjdGlvbkNvbmZpZyB9LFxuICAgICAge1xuICAgICAgICBvblN1Y2Nlc3M6IChyZXN1bHQpID0+IHNldFRlc3RSZXN1bHQocmVzdWx0KSxcbiAgICAgICAgb25FcnJvcjogKCkgPT4gc2V0VGVzdFJlc3VsdCh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0RmFpbGVkJykgfSksXG4gICAgICB9LFxuICAgICk7XG4gIH07XG5cbiAgLyoqIOS/neWtmOe8lui+kSAqL1xuICBjb25zdCBzYXZlRWRpdCA9ICgpID0+IHtcbiAgICBpZiAoIWVkaXRUYXJnZXQpIHJldHVybjtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7XG4gICAgICAgIGlkOiBlZGl0VGFyZ2V0LmlkLFxuICAgICAgICBkZXZpY2VOYW1lOiBlZGl0VGFyZ2V0LmRldmljZU5hbWUsXG4gICAgICAgIGNvbm5lY3Rpb25Db25maWc6IGVkaXRUYXJnZXQuY29ubmVjdGlvbkNvbmZpZyxcbiAgICAgICAgZGF0YVBvaW50czogZWRpdFRhcmdldC5kYXRhUG9pbnRzLFxuICAgICAgICBwb2xsSW50ZXJ2YWxNczogZWRpdFRhcmdldC5wb2xsSW50ZXJ2YWxNcyxcbiAgICAgIH0sXG4gICAgICB7IG9uU2V0dGxlZDogKCkgPT4gc2V0RWRpdFRhcmdldChudWxsKSB9LFxuICAgICk7XG4gIH07XG5cbiAgLyoqIOehruiupOWIoOmZpCAqL1xuICBjb25zdCBjb25maXJtRGVsZXRlID0gKCkgPT4ge1xuICAgIGlmICghZGVsZXRlVGFyZ2V0KSByZXR1cm47XG4gICAgZGVsZXRlTXV0YXRpb24ubXV0YXRlKGRlbGV0ZVRhcmdldCwgeyBvblNldHRsZWQ6ICgpID0+IHNldERlbGV0ZVRhcmdldChudWxsKSB9KTtcbiAgfTtcblxuICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHktMTJcIj5cbiAgICAgICAgPExvYWRlcjIgY2xhc3NOYW1lPVwiaC02IHctNiBhbmltYXRlLXNwaW4gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICAvKiog5pyq5YWz6IGU572R5YWz6K6+5aSH6YWN572u5pe277yM5pi+56S65Yib5bu66KGo5Y2VICovXG4gIGlmICghZ3dEZXZpY2UpIHtcbiAgICByZXR1cm4gPENyZWF0ZUNvbm5lY3Rpb25QYW5lbCBkZXZpY2VJZD17ZGV2aWNlSWR9IGRldmljZU5hbWU9e2RldmljZU5hbWV9IGNyZWF0ZU11dGF0aW9uPXtjcmVhdGVNdXRhdGlvbn0gdGVzdENvbm5NdXRhdGlvbj17dGVzdENvbm5NdXRhdGlvbn0gLz47XG4gIH1cblxuICBjb25zdCBwcm90byA9IHByb3RvY29sTWV0YVtnd0RldmljZS5wcm90b2NvbF0gPz8ge1xuICAgIGxhYmVsOiBnd0RldmljZS5wcm90b2NvbCxcbiAgICBpY29uOiA8UGx1ZyBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz4sXG4gICAgY29sb3I6ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNjAwJyxcbiAgfTtcblxuICBjb25zdCBkcENvdW50ID0gKCgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShnd0RldmljZS5kYXRhUG9pbnRzKTtcbiAgICAgIHJldHVybiB0eXBlb2YgcGFyc2VkID09PSAnb2JqZWN0JyAmJiBwYXJzZWQgIT09IG51bGwgPyBPYmplY3Qua2V5cyhwYXJzZWQpLmxlbmd0aCA6IDA7XG4gICAgfSBjYXRjaCB7IHJldHVybiAwOyB9XG4gIH0pKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgey8qIOi/nuaOpemFjee9ruS/oeaBr+WNoeeJhyAqL31cbiAgICAgIDxDYXJkPlxuICAgICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24udGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICAgICAgPENhcmREZXNjcmlwdGlvbiBjbGFzc05hbWU9XCJtdC0xXCI+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRlc2NyaXB0aW9uJyl9PC9DYXJkRGVzY3JpcHRpb24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJvdXRsaW5lXCJcbiAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHJ1blRlc3RDb25uZWN0aW9uKGd3RGV2aWNlLnByb3RvY29sLCBnd0RldmljZS5jb25uZWN0aW9uQ29uZmlnKX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+fVxuICAgICAgICAgICAgICAgIHt0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0Q29ubmVjdGlvbicpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIHNpemU9XCJzbVwiIG9uQ2xpY2s9eygpID0+IHNldEVkaXRUYXJnZXQoe1xuICAgICAgICAgICAgICAgIGlkOiBnd0RldmljZS5pZCxcbiAgICAgICAgICAgICAgICBkZXZpY2VOYW1lOiBnd0RldmljZS5kZXZpY2VOYW1lLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25Db25maWc6IGd3RGV2aWNlLmNvbm5lY3Rpb25Db25maWcsXG4gICAgICAgICAgICAgICAgZGF0YVBvaW50czogZ3dEZXZpY2UuZGF0YVBvaW50cyxcbiAgICAgICAgICAgICAgICBwb2xsSW50ZXJ2YWxNczogZ3dEZXZpY2UucG9sbEludGVydmFsTXMsXG4gICAgICAgICAgICAgIH0pfT5cbiAgICAgICAgICAgICAgICA8UGVuY2lsIGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAge3QoJ2NvbW1vbi5lZGl0Jyl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgIHsvKiDln7rmnKzkv6Hmga8gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00IG1kOmdyaWQtY29scy00XCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kZXZpY2VOYW1lJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntnd0RldmljZS5kZXZpY2VOYW1lfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucHJvdG9jb2wnKX08L3A+XG4gICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiIGNsYXNzTmFtZT17cHJvdG8uY29sb3J9PlxuICAgICAgICAgICAgICAgIHtwcm90by5pY29ufVxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTFcIj57cHJvdG8ubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5wb2xsSW50ZXJ2YWwnKX08L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2d3RGV2aWNlLnBvbGxJbnRlcnZhbE1zfW1zPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kYXRhUG9pbnRzJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntkcENvdW50fTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOWQr+WBnOeKtuaAgSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXRcIj5cbiAgICAgICAgICAgIDxTd2l0Y2hcbiAgICAgICAgICAgICAgY2hlY2tlZD17Z3dEZXZpY2UuZW5hYmxlZH1cbiAgICAgICAgICAgICAgb25DaGVja2VkQ2hhbmdlPXsoKSA9PiB0b2dnbGVFbmFibGVkKGd3RGV2aWNlLmlkLCBnd0RldmljZS5lbmFibGVkKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICB7Z3dEZXZpY2UuZW5hYmxlZCA/IHQoJ2RldmljZS5jb25uZWN0aW9uLmVuYWJsZWQnKSA6IHQoJ2RldmljZS5jb25uZWN0aW9uLmRpc2FibGVkJyl9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAoe3QoJ2RldmljZS5jb25uZWN0aW9uLmdhdGV3YXlJZCcpfToge2d3RGV2aWNlLmdhdGV3YXlJZH0pXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgIHZhcmlhbnQ9XCJnaG9zdFwiXG4gICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1sLWF1dG8gdGV4dC1kZXN0cnVjdGl2ZSBob3Zlcjp0ZXh0LWRlc3RydWN0aXZlXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGVsZXRlVGFyZ2V0KGd3RGV2aWNlLmlkKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmRlbGV0ZScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog6L+e5o6l6YWN572u6K+m5oOFICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBtZDpncmlkLWNvbHMtMlwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMVwiPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5jb25uZWN0aW9uQ29uZmlnJyl9PC9wPlxuICAgICAgICAgICAgICA8cHJlIGNsYXNzTmFtZT1cInJvdW5kZWQgYmctbXV0ZWQgcC0zIHRleHQteHMgZm9udC1tb25vIG92ZXJmbG93LWF1dG8gbWF4LWgtNDhcIj5cbiAgICAgICAgICAgICAgICB7KCgpID0+IHsgdHJ5IHsgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UoZ3dEZXZpY2UuY29ubmVjdGlvbkNvbmZpZyksIG51bGwsIDIpOyB9IGNhdGNoIHsgcmV0dXJuIGd3RGV2aWNlLmNvbm5lY3Rpb25Db25maWc7IH0gfSkoKX1cbiAgICAgICAgICAgICAgPC9wcmU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTFcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24uZGF0YVBvaW50TWFwcGluZycpfTwvcD5cbiAgICAgICAgICAgICAgPHByZSBjbGFzc05hbWU9XCJyb3VuZGVkIGJnLW11dGVkIHAtMyB0ZXh0LXhzIGZvbnQtbW9ubyBvdmVyZmxvdy1hdXRvIG1heC1oLTQ4XCI+XG4gICAgICAgICAgICAgICAgeygoKSA9PiB7IHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKGd3RGV2aWNlLmRhdGFQb2ludHMpLCBudWxsLCAyKTsgfSBjYXRjaCB7IHJldHVybiBnd0RldmljZS5kYXRhUG9pbnRzOyB9IH0pKCl9XG4gICAgICAgICAgICAgIDwvcHJlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog5Yib5bu65pe26Ze0ICovfVxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5jb25uZWN0aW9uLmNyZWF0ZWRBdCcpfToge2Zvcm1hdERhdGUoZ3dEZXZpY2UuY3JlYXRlZEF0KX08L3A+XG4gICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICA8L0NhcmQ+XG5cbiAgICAgIHsvKiDov57mjqXmtYvor5Xnu5PmnpwgKi99XG4gICAgICB7dGVzdFJlc3VsdCAmJiAoXG4gICAgICAgIDxDYXJkIGNsYXNzTmFtZT17dGVzdFJlc3VsdC5zdWNjZXNzID8gJ2JvcmRlci1ncmVlbi01MDAvMzAnIDogJ2JvcmRlci1yZWQtNTAwLzMwJ30+XG4gICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHB5LTNcIj5cbiAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PXt0ZXN0UmVzdWx0LnN1Y2Nlc3MgPyAnZGVmYXVsdCcgOiAnZGVzdHJ1Y3RpdmUnfT5cbiAgICAgICAgICAgICAge3Rlc3RSZXN1bHQuc3VjY2VzcyA/IHQoJ2RldmljZS5jb25uZWN0aW9uLnRlc3RTdWNjZXNzJykgOiB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0RmFpbGVkJyl9XG4gICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPnt0ZXN0UmVzdWx0Lm1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwic21cIiBjbGFzc05hbWU9XCJtbC1hdXRvXCIgb25DbGljaz17KCkgPT4gc2V0VGVzdFJlc3VsdChudWxsKX0+XG4gICAgICAgICAgICAgIHt0KCdjb21tb24uY2xvc2UnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgIDwvQ2FyZD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDliKDpmaTnoa7orqTlr7nor53moYYgKi99XG4gICAgICA8RGlhbG9nIG9wZW49eyEhZGVsZXRlVGFyZ2V0fSBvbk9wZW5DaGFuZ2U9eyhvcGVuKSA9PiAhb3BlbiAmJiBzZXREZWxldGVUYXJnZXQobnVsbCl9PlxuICAgICAgICA8RGlhbG9nQ29udGVudD5cbiAgICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgICAgPERpYWxvZ1RpdGxlPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5kZWxldGVUaXRsZScpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRlbGV0ZURlc2NyaXB0aW9uJyl9PC9EaWFsb2dEZXNjcmlwdGlvbj5cbiAgICAgICAgICA8L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8RGlhbG9nRm9vdGVyPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IHNldERlbGV0ZVRhcmdldChudWxsKX0+e3QoJ2NvbW1vbi5jYW5jZWwnKX08L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImRlc3RydWN0aXZlXCIgb25DbGljaz17Y29uZmlybURlbGV0ZX0gZGlzYWJsZWQ9e2RlbGV0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHtkZWxldGVNdXRhdGlvbi5pc1BlbmRpbmcgJiYgPExvYWRlcjIgY2xhc3NOYW1lPVwibXItMSBoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+fVxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmRlbGV0ZScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9EaWFsb2dGb290ZXI+XG4gICAgICAgIDwvRGlhbG9nQ29udGVudD5cbiAgICAgIDwvRGlhbG9nPlxuXG4gICAgICB7Lyog57yW6L6R5a+56K+d5qGGICovfVxuICAgICAgPERpYWxvZyBvcGVuPXshIWVkaXRUYXJnZXR9IG9uT3BlbkNoYW5nZT17KG9wZW4pID0+ICFvcGVuICYmIHNldEVkaXRUYXJnZXQobnVsbCl9PlxuICAgICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9XCJtYXgtdy1sZ1wiPlxuICAgICAgICAgIDxEaWFsb2dIZWFkZXI+XG4gICAgICAgICAgICA8RGlhbG9nVGl0bGU+e3QoJ2RldmljZS5jb25uZWN0aW9uLmVkaXRUaXRsZScpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+e3QoJ2RldmljZS5jb25uZWN0aW9uLmVkaXREZXNjcmlwdGlvbicpfTwvRGlhbG9nRGVzY3JpcHRpb24+XG4gICAgICAgICAgPC9EaWFsb2dIZWFkZXI+XG4gICAgICAgICAge2VkaXRUYXJnZXQgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRldmljZU5hbWUnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRUYXJnZXQuZGV2aWNlTmFtZX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdFRhcmdldCh7IC4uLmVkaXRUYXJnZXQsIGRldmljZU5hbWU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucG9sbEludGVydmFsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRUYXJnZXQucG9sbEludGVydmFsTXN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBwb2xsSW50ZXJ2YWxNczogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmNvbm5lY3Rpb25Db25maWcnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxUZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0VGFyZ2V0LmNvbm5lY3Rpb25Db25maWd9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBjb25uZWN0aW9uQ29uZmlnOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRhdGFQb2ludE1hcHBpbmcnKX08L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxUZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0VGFyZ2V0LmRhdGFQb2ludHN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRUYXJnZXQoeyAuLi5lZGl0VGFyZ2V0LCBkYXRhUG9pbnRzOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAgPERpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXsoKSA9PiBzZXRFZGl0VGFyZ2V0KG51bGwpfT57dCgnY29tbW9uLmNhbmNlbCcpfTwvQnV0dG9uPlxuICAgICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtzYXZlRWRpdH0gZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHt1cGRhdGVNdXRhdGlvbi5pc1BlbmRpbmcgJiYgPExvYWRlcjIgY2xhc3NOYW1lPVwibXItMSBoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+fVxuICAgICAgICAgICAgICB7dCgnY29tbW9uLnNhdmUnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvRGlhbG9nRm9vdGVyPlxuICAgICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g5Yib5bu66L+e5o6l6YWN572u6Z2i5p2/77yI6K6+5aSH5pyq5YWz6IGU572R5YWz6K6+5aSH5pe25pi+56S677yJXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8qKiDliJvlu7rpnaLmnb/lsZ7mgKcgKi9cbmludGVyZmFjZSBDcmVhdGVDb25uZWN0aW9uUGFuZWxQcm9wcyB7XG4gIGRldmljZUlkOiBzdHJpbmc7XG4gIGRldmljZU5hbWU6IHN0cmluZztcbiAgY3JlYXRlTXV0YXRpb246IFJldHVyblR5cGU8dHlwZW9mIHVzZUNyZWF0ZUdhdGV3YXlEZXZpY2U+O1xuICB0ZXN0Q29ubk11dGF0aW9uOiBSZXR1cm5UeXBlPHR5cGVvZiB1c2VUZXN0Q29ubmVjdGlvbj47XG59XG5cbi8qKiDpu5jorqTov57mjqXphY3nva7mqKHmnb8gKi9cbmNvbnN0IGRlZmF1bHRDb25maWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBvcGN1YTogSlNPTi5zdHJpbmdpZnkoeyBlbmRwb2ludDogJ29wYy50Y3A6Ly9sb2NhbGhvc3Q6NDg0MCcsIHNlY3VyaXR5TW9kZTogJ05vbmUnIH0sIG51bGwsIDIpLFxuICAnbW9kYnVzLXRjcCc6IEpTT04uc3RyaW5naWZ5KHsgaG9zdDogJzE5Mi4xNjguMS4xMDAnLCBwb3J0OiA1MDIsIHVuaXRJZDogMSB9LCBudWxsLCAyKSxcbiAgJ21vZGJ1cy1ydHUnOiBKU09OLnN0cmluZ2lmeSh7IHBvcnQ6ICcvZGV2L3R0eVVTQjAnLCBiYXVkUmF0ZTogOTYwMCwgcGFyaXR5OiAnbm9uZScsIHVuaXRJZDogMSB9LCBudWxsLCAyKSxcbn07XG5cbi8qKiDpu5jorqTmlbDmja7ngrnmqKHmnb8gKi9cbmNvbnN0IGRlZmF1bHREYXRhUG9pbnRzID0gSlNPTi5zdHJpbmdpZnkoeyB0ZW1wZXJhdHVyZTogJzQwMDAwMScsIHByZXNzdXJlOiAnNDAwMDAyJyB9LCBudWxsLCAyKTtcblxuLyoqXG4gKiDliJvlu7rov57mjqXphY3nva7pnaLmnb9cbiAqXG4gKiDlvZPorr7lpIflsJrmnKrlhbPogZTnvZHlhbPph4fpm4bphY3nva7ml7bmmL7npLrvvIzmj5DkvpvlrozmlbTnmoTliJvlu7rooajljZXjgIJcbiAqIOWIm+W7uuaXtuiHquWKqOWwhiBkZXZpY2VJZCDlhbPogZTliLDlvZPliY3orr7lpIfjgIJcbiAqL1xuZnVuY3Rpb24gQ3JlYXRlQ29ubmVjdGlvblBhbmVsKHsgZGV2aWNlSWQsIGRldmljZU5hbWUsIGNyZWF0ZU11dGF0aW9uLCB0ZXN0Q29ubk11dGF0aW9uIH06IENyZWF0ZUNvbm5lY3Rpb25QYW5lbFByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyBkYXRhOiBnYXRld2F5cyB9ID0gdXNlR2F0ZXdheXMoKTtcbiAgY29uc3QgW2Zvcm0sIHNldEZvcm1dID0gdXNlU3RhdGUoe1xuICAgIHByb3RvY29sOiAnb3BjdWEnLFxuICAgIGNvbm5lY3Rpb25Db25maWc6IGRlZmF1bHRDb25maWdzLm9wY3VhLFxuICAgIGRhdGFQb2ludHM6IGRlZmF1bHREYXRhUG9pbnRzLFxuICAgIHBvbGxJbnRlcnZhbE1zOiAzMDAwLFxuICAgIGdhdGV3YXlJZDogJycsXG4gIH0pO1xuICBjb25zdCBbdGVzdFJlc3VsdCwgc2V0VGVzdFJlc3VsdF0gPSB1c2VTdGF0ZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqIOWIh+aNouWNj+iuruaXtuabtOaWsOi/nuaOpemFjee9ruaooeadvyAqL1xuICBjb25zdCBoYW5kbGVQcm90b2NvbENoYW5nZSA9IChwcm90b2NvbDogc3RyaW5nKSA9PiB7XG4gICAgc2V0Rm9ybSh7XG4gICAgICAuLi5mb3JtLFxuICAgICAgcHJvdG9jb2wsXG4gICAgICBjb25uZWN0aW9uQ29uZmlnOiBkZWZhdWx0Q29uZmlnc1twcm90b2NvbF0gPz8gJ3t9JyxcbiAgICB9KTtcbiAgfTtcblxuICAvKiog5o+Q5Lqk5Yib5bu677yM6Ieq5Yqo5L2/55So5b2T5YmN6K6+5aSH5ZCN56ewICovXG4gIGNvbnN0IGhhbmRsZUNyZWF0ZSA9ICgpID0+IHtcbiAgICBjcmVhdGVNdXRhdGlvbi5tdXRhdGUoe1xuICAgICAgZGV2aWNlTmFtZSxcbiAgICAgIHByb3RvY29sOiBmb3JtLnByb3RvY29sLFxuICAgICAgY29ubmVjdGlvbkNvbmZpZzogZm9ybS5jb25uZWN0aW9uQ29uZmlnLFxuICAgICAgZGF0YVBvaW50czogZm9ybS5kYXRhUG9pbnRzLFxuICAgICAgcG9sbEludGVydmFsTXM6IGZvcm0ucG9sbEludGVydmFsTXMsXG4gICAgICBkZXZpY2VJZCxcbiAgICAgIGdhdGV3YXlJZDogZm9ybS5nYXRld2F5SWQgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9O1xuXG4gIC8qKiDmtYvor5Xov57mjqUgKi9cbiAgY29uc3QgcnVuVGVzdCA9ICgpID0+IHtcbiAgICBzZXRUZXN0UmVzdWx0KG51bGwpO1xuICAgIHRlc3RDb25uTXV0YXRpb24ubXV0YXRlKFxuICAgICAgeyBwcm90b2NvbDogZm9ybS5wcm90b2NvbCwgY29ubmVjdGlvbkNvbmZpZzogZm9ybS5jb25uZWN0aW9uQ29uZmlnIH0sXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzczogKHJlc3VsdCkgPT4gc2V0VGVzdFJlc3VsdChyZXN1bHQpLFxuICAgICAgICBvbkVycm9yOiAoKSA9PiBzZXRUZXN0UmVzdWx0KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IHQoJ2RldmljZS5jb25uZWN0aW9uLnRlc3RGYWlsZWQnKSB9KSxcbiAgICAgIH0sXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24uY3JlYXRlVGl0bGUnKX08L0NhcmRUaXRsZT5cbiAgICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5jcmVhdGVEZXNjcmlwdGlvbicpfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7Lyog5Y2P6K6u6YCJ5oupICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLnByb3RvY29sJyl9PC9MYWJlbD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMyBnYXAtM1wiPlxuICAgICAgICAgICAgICB7T2JqZWN0LmVudHJpZXMocHJvdG9jb2xNZXRhKS5tYXAoKFtrZXksIG1ldGFdKSA9PiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAga2V5PXtrZXl9XG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVByb3RvY29sQ2hhbmdlKGtleSl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLWxnIGJvcmRlciBwLTMgdGV4dC1zbSB0cmFuc2l0aW9uLWNvbG9ycyAke1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnByb3RvY29sID09PSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICA/ICdib3JkZXItcHJpbWFyeSBiZy1wcmltYXJ5LzUgdGV4dC1wcmltYXJ5J1xuICAgICAgICAgICAgICAgICAgICAgIDogJ2JvcmRlci1ib3JkZXIgaG92ZXI6Ym9yZGVyLXByaW1hcnkvNTAnXG4gICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7bWV0YS5pY29ufVxuICAgICAgICAgICAgICAgICAgPHNwYW4+e21ldGEubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOe9keWFs+mAieaLqSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPExhYmVsPnt0KCdkZXZpY2UuY29ubmVjdGlvbi5nYXRld2F5SWQnKX08L0xhYmVsPlxuICAgICAgICAgICAgPFNlbGVjdCB2YWx1ZT17Zm9ybS5nYXRld2F5SWQgfHwgdW5kZWZpbmVkfSBvblZhbHVlQ2hhbmdlPXsodikgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIGdhdGV3YXlJZDogdiA/PyAnJyB9KX0+XG4gICAgICAgICAgICAgIDxTZWxlY3RUcmlnZ2VyPlxuICAgICAgICAgICAgICAgIDxTZWxlY3RWYWx1ZSBwbGFjZWhvbGRlcj1cIumAieaLqee9keWFs++8iOWPr+mAie+8iVwiIC8+XG4gICAgICAgICAgICAgIDwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgPFNlbGVjdENvbnRlbnQ+XG4gICAgICAgICAgICAgICAge2dhdGV3YXlzPy5maWx0ZXIoKGcpID0+IGcuc3RhdHVzID09PSAnb25saW5lJykubWFwKChnKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSBrZXk9e2cuZ2F0ZXdheUlkfSB2YWx1ZT17Zy5nYXRld2F5SWR9PlxuICAgICAgICAgICAgICAgICAgICB7Zy5uYW1lfe+8iHtnLmdhdGV3YXlJZH3vvIlcbiAgICAgICAgICAgICAgICAgIDwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICB7KCFnYXRld2F5cyB8fCBnYXRld2F5cy5maWx0ZXIoKGcpID0+IGcuc3RhdHVzID09PSAnb25saW5lJykubGVuZ3RoID09PSAwKSAmJiAoXG4gICAgICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIl9ub25lXCIgZGlzYWJsZWQ+5pqC5peg5Zyo57q/572R5YWzPC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIDwvU2VsZWN0PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7pgInmi6notJ/otKPph4fpm4bor6Xorr7lpIfmlbDmja7nmoTovrnnvJjnvZHlhbPvvIzkuI3pgInliJnkvb/nlKjpu5jorqTnvZHlhbM8L3A+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog6YeH6ZuG6Ze06ZqUICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLnBvbGxJbnRlcnZhbCcpfTwvTGFiZWw+XG4gICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgIG1pbj17MTAwfVxuICAgICAgICAgICAgICB2YWx1ZT17Zm9ybS5wb2xsSW50ZXJ2YWxNc31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgcG9sbEludGVydmFsTXM6IE51bWJlcihlLnRhcmdldC52YWx1ZSkgfSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNvbm5lY3Rpb24ucG9sbEludGVydmFsSGludCcpfTwvcD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiDov57mjqXphY3nva4gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmNvbm5lY3Rpb24uY29ubmVjdGlvbkNvbmZpZycpfTwvTGFiZWw+XG4gICAgICAgICAgICA8VGV4dGFyZWFcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgICByb3dzPXs0fVxuICAgICAgICAgICAgICB2YWx1ZT17Zm9ybS5jb25uZWN0aW9uQ29uZmlnfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm0oeyAuLi5mb3JtLCBjb25uZWN0aW9uQ29uZmlnOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7Lyog5pWw5o2u54K55pig5bCEICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5jb25uZWN0aW9uLmRhdGFQb2ludE1hcHBpbmcnKX08L0xhYmVsPlxuICAgICAgICAgICAgPFRleHRhcmVhXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LXhzXCJcbiAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgdmFsdWU9e2Zvcm0uZGF0YVBvaW50c31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgZGF0YVBvaW50czogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOaTjeS9nOaMiemSriAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB0LTJcIj5cbiAgICAgICAgICAgIDxCdXR0b24gb25DbGljaz17aGFuZGxlQ3JlYXRlfSBkaXNhYmxlZD17Y3JlYXRlTXV0YXRpb24uaXNQZW5kaW5nfT5cbiAgICAgICAgICAgICAge2NyZWF0ZU11dGF0aW9uLmlzUGVuZGluZyAmJiA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz59XG4gICAgICAgICAgICAgIHt0KCdkZXZpY2UuY29ubmVjdGlvbi5jcmVhdGVBbmRMaW5rJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXtydW5UZXN0fSBkaXNhYmxlZD17dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmd9PlxuICAgICAgICAgICAgICB7dGVzdENvbm5NdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTQgYW5pbWF0ZS1zcGluXCIgLz4gOiA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTEgaC00IHctNFwiIC8+fVxuICAgICAgICAgICAgICB7dCgnZGV2aWNlLmNvbm5lY3Rpb24udGVzdENvbm5lY3Rpb24nKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuXG4gICAgICB7Lyog5rWL6K+V57uT5p6cICovfVxuICAgICAge3Rlc3RSZXN1bHQgJiYgKFxuICAgICAgICA8Q2FyZCBjbGFzc05hbWU9e3Rlc3RSZXN1bHQuc3VjY2VzcyA/ICdib3JkZXItZ3JlZW4tNTAwLzMwJyA6ICdib3JkZXItcmVkLTUwMC8zMCd9PlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweS0zXCI+XG4gICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17dGVzdFJlc3VsdC5zdWNjZXNzID8gJ2RlZmF1bHQnIDogJ2Rlc3RydWN0aXZlJ30+XG4gICAgICAgICAgICAgIHt0ZXN0UmVzdWx0LnN1Y2Nlc3MgPyB0KCdkZXZpY2UuY29ubmVjdGlvbi50ZXN0U3VjY2VzcycpIDogdCgnZGV2aWNlLmNvbm5lY3Rpb24udGVzdEZhaWxlZCcpfVxuICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj57dGVzdFJlc3VsdC5tZXNzYWdlfTwvc3Bhbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cInNtXCIgY2xhc3NOYW1lPVwibWwtYXV0b1wiIG9uQ2xpY2s9eygpID0+IHNldFRlc3RSZXN1bHQobnVsbCl9PlxuICAgICAgICAgICAgICB7dCgnY29tbW9uLmNsb3NlJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyDorr7lpIfln7rmnKzkv6Hmga/ljaHniYfvvIjmlK/mjIHooYzlhoXnvJbovpHvvIlcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLyoqIOiuvuWkh+S/oeaBr+WNoeeJh+WxnuaApyAqL1xuaW50ZXJmYWNlIERldmljZUluZm9DYXJkUHJvcHMge1xuICBkZXZpY2U6IERldmljZTtcbn1cblxuLyoqXG4gKiDorr7lpIfln7rmnKzkv6Hmga/ljaHniYdcbiAqXG4gKiDpu5jorqTmmL7npLrlj6ror7vkv6Hmga/vvIzngrnlh7vnvJbovpHmjInpkq7lkI7lrZfmrrXlj5jkuLrovpPlhaXmoYbvvIzmlK/mjIHooYzlhoXkv67mlLnkv53lrZjjgIJcbiAqIOWPque8lui+kSBEZXZpY2Ug57G75Z6L5Lit5a6e6ZmF5a2Y5Zyo5LiU55So5oi35Y+v5L+u5pS555qE5a2X5q6177yabmFtZeOAgXR5cGXjgIFtb2RlbOOAgW1hbnVmYWN0dXJlcuOAglxuICogc3RhdHVzIOWSjCBoZWFsdGhTY29yZSDkuLrns7vnu5/nu7TmiqTvvIzlp4vnu4jlj6ror7vjgIJcbiAqL1xuZnVuY3Rpb24gRGV2aWNlSW5mb0NhcmQoeyBkZXZpY2UgfTogRGV2aWNlSW5mb0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHVwZGF0ZU11dGF0aW9uID0gdXNlVXBkYXRlRGV2aWNlKCk7XG4gIGNvbnN0IFtlZGl0aW5nLCBzZXRFZGl0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2Zvcm0sIHNldEZvcm1dID0gdXNlU3RhdGUoe1xuICAgIG5hbWU6ICcnLFxuICAgIHR5cGU6ICcnLFxuICAgIG1vZGVsOiAnJyxcbiAgICBtYW51ZmFjdHVyZXI6ICcnLFxuICAgIGNyaXRpY2FsaXR5OiAnTm9ybWFsJyxcbiAgICBzZXJpYWxOdW1iZXI6ICcnLFxuICAgIGluc3RhbGxEYXRlOiAnJyxcbiAgICBnYXRld2F5SWQ6ICcnLFxuICAgIGRvd250aW1lQ29zdFBlckhvdXI6ICcnLFxuICB9KTtcblxuICAvKiog6L+b5YWl57yW6L6R5qih5byP77yI5Zue5pi+5b2T5YmN6K6+5aSH5qGj5qGI5a2X5q6177yJICovXG4gIGNvbnN0IHN0YXJ0RWRpdCA9ICgpID0+IHtcbiAgICBzZXRGb3JtKHtcbiAgICAgIG5hbWU6IGRldmljZS5uYW1lID8/ICcnLFxuICAgICAgdHlwZTogZGV2aWNlLnR5cGUgPz8gJycsXG4gICAgICBtb2RlbDogZGV2aWNlLm1vZGVsID8/ICcnLFxuICAgICAgbWFudWZhY3R1cmVyOiBkZXZpY2UubWFudWZhY3R1cmVyID8/ICcnLFxuICAgICAgY3JpdGljYWxpdHk6IGRldmljZS5jcml0aWNhbGl0eSA/PyAnTm9ybWFsJyxcbiAgICAgIHNlcmlhbE51bWJlcjogZGV2aWNlLnNlcmlhbE51bWJlciA/PyAnJyxcbiAgICAgIGluc3RhbGxEYXRlOiBkZXZpY2UuaW5zdGFsbERhdGUgPz8gJycsXG4gICAgICBnYXRld2F5SWQ6IGRldmljZS5nYXRld2F5SWQgPz8gJycsXG4gICAgICBkb3dudGltZUNvc3RQZXJIb3VyOiBkZXZpY2UuZG93bnRpbWVDb3N0UGVySG91ciAhPSBudWxsID8gU3RyaW5nKGRldmljZS5kb3dudGltZUNvc3RQZXJIb3VyKSA6ICcnLFxuICAgIH0pO1xuICAgIHNldEVkaXRpbmcodHJ1ZSk7XG4gIH07XG5cbiAgLyoqIOS/neWtmOS/ruaUue+8iOWPr+epuuWtl+auteepuuWAvOS8oCB1bmRlZmluZWTvvIzop6blj5HlkI7nq68gQ29uZGl0aW9uIOi3s+i/h+OAgeS/neaMgeWOn+WAvO+8iSAqL1xuICBjb25zdCBzYXZlRWRpdCA9ICgpID0+IHtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7XG4gICAgICAgIGlkOiBkZXZpY2UuaWQsXG4gICAgICAgIGRldmljZUNvZGU6IGRldmljZS5kZXZpY2VDb2RlLFxuICAgICAgICBuYW1lOiBmb3JtLm5hbWUsXG4gICAgICAgIHR5cGU6IGZvcm0udHlwZSxcbiAgICAgICAgbW9kZWw6IGZvcm0ubW9kZWwgfHwgdW5kZWZpbmVkLFxuICAgICAgICBtYW51ZmFjdHVyZXI6IGZvcm0ubWFudWZhY3R1cmVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY3JpdGljYWxpdHk6IGZvcm0uY3JpdGljYWxpdHkgfHwgdW5kZWZpbmVkLFxuICAgICAgICBzZXJpYWxOdW1iZXI6IGZvcm0uc2VyaWFsTnVtYmVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgaW5zdGFsbERhdGU6IGZvcm0uaW5zdGFsbERhdGUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBnYXRld2F5SWQ6IGZvcm0uZ2F0ZXdheUlkIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZG93bnRpbWVDb3N0UGVySG91cjogZm9ybS5kb3dudGltZUNvc3RQZXJIb3VyID8gTnVtYmVyKGZvcm0uZG93bnRpbWVDb3N0UGVySG91cikgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgeyBvblNldHRsZWQ6ICgpID0+IHNldEVkaXRpbmcoZmFsc2UpIH0sXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgcHgtNCBweS0yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5iYXNpY0luZm8nKX08L3NwYW4+XG4gICAgICAgIHtlZGl0aW5nID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMVwiPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIGNsYXNzTmFtZT1cImgtNyB3LTdcIiBvbkNsaWNrPXsoKSA9PiBzZXRFZGl0aW5nKGZhbHNlKX0+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgY2xhc3NOYW1lPVwiaC03IHctNyB0ZXh0LXByaW1hcnlcIiBvbkNsaWNrPXtzYXZlRWRpdH0gZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgIHt1cGRhdGVNdXRhdGlvbi5pc1BlbmRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9XCJoLTQgdy00IGFuaW1hdGUtc3BpblwiIC8+IDogPENoZWNrIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPn1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBjbGFzc05hbWU9XCJoLTcgdy03XCIgb25DbGljaz17c3RhcnRFZGl0fT5cbiAgICAgICAgICAgIDxQZW5jaWwgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00IHAtNCBtZDpncmlkLWNvbHMtMyBsZzpncmlkLWNvbHMtNFwiPlxuICAgICAgICB7ZWRpdGluZyA/IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5uYW1lJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0ubmFtZX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgbmFtZTogZS50YXJnZXQudmFsdWUgfSl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UudHlwZScpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxJbnB1dCBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiIHZhbHVlPXtmb3JtLnR5cGV9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLm1vZGVsJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0ubW9kZWx9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIG1vZGVsOiBlLnRhcmdldC52YWx1ZSB9KX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5tYW51ZmFjdHVyZXInKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8SW5wdXQgY2xhc3NOYW1lPVwiaC04IHRleHQtc21cIiB2YWx1ZT17Zm9ybS5tYW51ZmFjdHVyZXJ9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIG1hbnVmYWN0dXJlcjogZS50YXJnZXQudmFsdWUgfSl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuY3JpdGljYWxpdHknKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtmb3JtLmNyaXRpY2FsaXR5fSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0Rm9ybSh7IC4uLmZvcm0sIGNyaXRpY2FsaXR5OiB2IH0pOyB9fT5cbiAgICAgICAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgICAgIHsoWydDcml0aWNhbCcsICdIaWdoJywgJ05vcm1hbCcsICdMb3cnXSBhcyBjb25zdCkubWFwKChjKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIGtleT17Y30gdmFsdWU9e2N9PntjfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgPC9TZWxlY3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2Uuc2VyaWFsTnVtYmVyJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdmFsdWU9e2Zvcm0uc2VyaWFsTnVtYmVyfSBvbkNoYW5nZT17KGUpID0+IHNldEZvcm0oeyAuLi5mb3JtLCBzZXJpYWxOdW1iZXI6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmluc3RhbGxEYXRlJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdHlwZT1cImRhdGVcIiB2YWx1ZT17Zm9ybS5pbnN0YWxsRGF0ZX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgaW5zdGFsbERhdGU6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmdhdGV3YXlJZCcpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxJbnB1dCBjbGFzc05hbWU9XCJoLTggdGV4dC1zbVwiIHZhbHVlPXtmb3JtLmdhdGV3YXlJZH0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtKHsgLi4uZm9ybSwgZ2F0ZXdheUlkOiBlLnRhcmdldC52YWx1ZSB9KX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgPExhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5kb3dudGltZUNvc3RQZXJIb3VyJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0IGNsYXNzTmFtZT1cImgtOCB0ZXh0LXNtXCIgdHlwZT1cIm51bWJlclwiIHN0ZXA9XCIwLjAxXCIgbWluPVwiMFwiIHZhbHVlPXtmb3JtLmRvd250aW1lQ29zdFBlckhvdXJ9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybSh7IC4uLmZvcm0sIGRvd250aW1lQ29zdFBlckhvdXI6IGUudGFyZ2V0LnZhbHVlIH0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8TGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLnN0YXR1cycpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMVwiPjxEZXZpY2VTdGF0dXNCYWRnZSBzdGF0dXM9e2RldmljZS5zdGF0dXN9IC8+PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxMYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuaGVhbHRoU2NvcmUnKX08L0xhYmVsPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIGZvbnQtbWVkaXVtXCI+e2RldmljZS5oZWFsdGhTY29yZX08L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UubmFtZScpfTwvcD48cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntkZXZpY2UubmFtZX08L3A+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS50eXBlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS50eXBlfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLm1vZGVsJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5tb2RlbCA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UubWFudWZhY3R1cmVyJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5tYW51ZmFjdHVyZXIgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmNyaXRpY2FsaXR5Jyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5jcml0aWNhbGl0eSA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2Uuc2VyaWFsTnVtYmVyJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5zZXJpYWxOdW1iZXIgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmluc3RhbGxEYXRlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5pbnN0YWxsRGF0ZSA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdkZXZpY2UuZ2F0ZXdheUlkJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5nYXRld2F5SWQgPz8gJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmRvd250aW1lQ29zdFBlckhvdXInKX08L3A+PHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57ZGV2aWNlLmRvd250aW1lQ29zdFBlckhvdXIgIT0gbnVsbCA/IGRldmljZS5kb3dudGltZUNvc3RQZXJIb3VyIDogJy0nfTwvcD48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmxhc3RTZWVuQXQnKX08L3A+PHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57ZGV2aWNlLmxhc3RTZWVuQXQgPyBuZXcgRGF0ZShkZXZpY2UubGFzdFNlZW5BdCkudG9Mb2NhbGVTdHJpbmcoKSA6ICctJ308L3A+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5zdGF0dXMnKX08L3A+PERldmljZVN0YXR1c0JhZGdlIHN0YXR1cz17ZGV2aWNlLnN0YXR1c30gLz48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmhlYWx0aFNjb3JlJyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5oZWFsdGhTY29yZX08L3A+PC9kaXY+XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG4gICAgICA8L0NhcmRDb250ZW50PlxuICAgIDwvQ2FyZD5cbiAgKTtcbn1cbiJdfQ==