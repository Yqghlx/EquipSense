import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/AlertCenterPage.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport11_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport11_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Download, RefreshCw, AlertTriangle } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Card, CardContent } from "/src/components/ui/card.tsx";
import { AlertDetailDrawer } from "/src/components/alert/AlertDetailDrawer.tsx";
import { SeverityBadge } from "/src/components/alert/SeverityBadge.tsx";
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from "/src/hooks/useAlerts.ts";
import api from "/src/lib/api.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/AlertCenterPage.tsx";
import __vite__cjsImport11_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 导出当前筛选条件下的告警为 CSV（触发浏览器下载） */
async function exportAlertsCsv(status, severity) {
	const params = new URLSearchParams();
	if (status) params.set("status", status);
	if (severity) params.set("severity", severity);
	const query = params.toString();
	const response = await api.get(`/alerts/export${query ? `?${query}` : ""}`, { responseType: "blob" });
	const url = URL.createObjectURL(response.data);
	const a = document.createElement("a");
	a.href = url;
	a.download = `alerts_${Date.now()}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
/**
* 告警中心页
*
* 功能：按状态/严重级别过滤、分页浏览、确认/解决操作、点击行查看详情抽屉。
*/
export default function AlertCenterPage() {
	_s();
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState("");
	const [severity, setSeverity] = useState("");
	const [selectedAlert, setSelectedAlert] = useState(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const { data, isLoading, isError, refetch } = useAlerts({
		page,
		pageSize: 20
	}, {
		status: status || undefined,
		severity: severity || undefined
	});
	const acknowledgeAlert = useAcknowledgeAlert();
	const resolveAlert = useResolveAlert();
	/** 点击告警行打开详情抽屉 */
	const handleRowClick = (alert) => {
		setSelectedAlert(alert);
		setDrawerOpen(true);
	};
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-2xl font-bold",
					children: t("alert.title")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 60,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => exportAlertsCsv(status, severity),
					children: [/* @__PURE__ */ _jsxDEV(Download, { className: "h-4 w-4 mr-2" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 66,
						columnNumber: 11
					}, this), t("common.export", "导出 CSV")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 61,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 59,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ _jsxDEV(Select, {
					value: status,
					onValueChange: (v) => {
						if (v !== null) {
							setStatus(v === "all" ? "" : v);
							setPage(1);
						}
					},
					children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
						className: "w-32",
						children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("common.status") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 74,
							columnNumber: 43
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 74,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "all",
							children: t("common.all")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 76,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "active",
							children: t("alert.active")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 77,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "acknowledged",
							children: t("alert.acknowledged")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 78,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "resolved",
							children: t("alert.resolved")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 79,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 75,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 73,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Select, {
					value: severity,
					onValueChange: (v) => {
						if (v !== null) {
							setSeverity(v === "all" ? "" : v);
							setPage(1);
						}
					},
					children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
						className: "w-32",
						children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("alert.severity") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 43
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "all",
							children: t("common.all")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 85,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "critical",
							children: t("alert.critical")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 86,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "high",
							children: t("alert.high")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 87,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "normal",
							children: t("alert.normal")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 88,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "low",
							children: t("alert.low")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 89,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 72,
				columnNumber: 7
			}, this),
			isLoading ? /* @__PURE__ */ _jsxDEV("div", {
				className: "py-20 text-center text-muted-foreground",
				children: t("common.loading")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 96,
				columnNumber: 9
			}, this) : isError && !data ? /* @__PURE__ */ _jsxDEV(
				Card,
				/* 错误态：首屏加载失败时显式提示并可重试，避免把网络错误误显示为"暂无告警"
				（告警中心漏看 Critical 告警是安全隐患，必须区分空状态与错误状态） */
				{ children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "flex flex-col items-center gap-3 py-16 text-center",
					children: [
						/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-8 w-8 text-amber-500" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 102,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("common.loadFailed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => refetch(),
							children: [/* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 105,
								columnNumber: 15
							}, this), t("common.retry")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 104,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 101,
					columnNumber: 11
				}, this) },
				void 0,
				false,
				{
					fileName: _jsxFileName,
					lineNumber: 100,
					columnNumber: 9
				},
				this
			) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.alertCode") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 115,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("device.name") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 116,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.metric") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 117,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.value") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 118,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.severity") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 120,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("alert.triggeredAt") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 121,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.actions") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 122,
					columnNumber: 17
				}, this)
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 114,
				columnNumber: 15
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 113,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: data?.items.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
				colSpan: 8,
				className: "text-center text-muted-foreground",
				children: t("common.noData")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 127,
				columnNumber: 27
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 127,
				columnNumber: 17
			}, this) : data?.items.map((alert) => /* @__PURE__ */ _jsxDEV(TableRow, {
				className: "cursor-pointer",
				onClick: () => handleRowClick(alert),
				children: [
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "font-mono text-sm",
						children: alert.alertCode
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 135,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "font-mono text-xs",
						children: [alert.deviceId.slice(0, 8), "…"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 136,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.metric }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 137,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: alert.value }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(SeverityBadge, { severity: alert.severity }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 139,
						columnNumber: 32
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 139,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						className: "h-auto p-0 text-sm",
						children: t(`alert.${alert.status.toLowerCase()}`)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 141,
						columnNumber: 23
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 140,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "text-sm text-muted-foreground",
						children: new Date(alert.occurredAt).toLocaleString()
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 145,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV("div", {
						className: "flex gap-1",
						onClick: (e) => e.stopPropagation(),
						children: [alert.status === "active" && /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => acknowledgeAlert.mutate(alert.id),
							children: t("alert.acknowledge")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 151,
							columnNumber: 29
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							onClick: () => resolveAlert.mutate(alert.id),
							children: t("alert.resolve")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 154,
							columnNumber: 29
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 150,
							columnNumber: 27
						}, this), alert.status === "acknowledged" && /* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							onClick: () => resolveAlert.mutate(alert.id),
							children: t("alert.resolve")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 160,
							columnNumber: 27
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 148,
						columnNumber: 23
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 146,
						columnNumber: 21
					}, this)
				]
			}, alert.id, true, {
				fileName: _jsxFileName,
				lineNumber: 130,
				columnNumber: 19
			}, this)) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 125,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 112,
				columnNumber: 11
			}, this), data && data.total > 20 && /* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ _jsxDEV("span", { children: t("common.totalItems", { count: data.total }) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 175,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						disabled: page <= 1,
						onClick: () => setPage(page - 1),
						children: t("common.previous")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 177,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						disabled: page * 20 >= data.total,
						onClick: () => setPage(page + 1),
						children: t("common.next")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 178,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 176,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 174,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 111,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(AlertDetailDrawer, {
				alert: selectedAlert,
				open: drawerOpen,
				onClose: () => setDrawerOpen(false),
				onAcknowledge: (id) => {
					acknowledgeAlert.mutate(id);
					setDrawerOpen(false);
				},
				onResolve: (id) => {
					resolveAlert.mutate(id);
					setDrawerOpen(false);
				}
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 186,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 58,
		columnNumber: 5
	}, this);
}
_s(AlertCenterPage, "dZDSrscr+u1g3hz6qtpYiB/BnGI=", false, function() {
	return [
		useTranslation,
		useAlerts,
		useAcknowledgeAlert,
		useResolveAlert
	];
});
_c = AlertCenterPage;
var _c;
$RefreshReg$(_c, "AlertCenterPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/AlertCenterPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/AlertCenterPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/AlertCenterPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/AlertCenterPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUFVLE1BQUs7TUFBSyxVQUFVLFFBQVE7TUFBRyxlQUFlLFFBQVEsT0FBTyxDQUFDO2dCQUFJLEVBQUUsaUJBQWlCO0tBQVU7Ozs7ZUFDekgsd0JBQUMsUUFBRDtNQUFRLFNBQVE7TUFBVSxNQUFLO01BQUssVUFBVSxPQUFPLE1BQU0sS0FBSztNQUFPLGVBQWUsUUFBUSxPQUFPLENBQUM7Z0JBQUksRUFBRSxhQUFhO0tBQVU7Ozs7YUFDaEk7Ozs7O1lBQ0Y7Ozs7O1dBRVA7Ozs7O0dBSUosd0JBQUMsbUJBQUQ7SUFDRSxPQUFPO0lBQ1AsTUFBTTtJQUNOLGVBQWUsY0FBYyxLQUFLO0lBQ2xDLGdCQUFnQixPQUFPO0tBQUUsaUJBQWlCLE9BQU8sRUFBRTtLQUFHLGNBQWMsS0FBSztJQUFHO0lBQzVFLFlBQVksT0FBTztLQUFFLGFBQWEsT0FBTyxFQUFFO0tBQUcsY0FBYyxLQUFLO0lBQUc7R0FDckU7Ozs7O0VBQ0U7Ozs7OztBQUVUIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkFsZXJ0Q2VudGVyUGFnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgRG93bmxvYWQsIFJlZnJlc2hDdywgQWxlcnRUcmlhbmdsZSB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyBTZWxlY3QsIFNlbGVjdENvbnRlbnQsIFNlbGVjdEl0ZW0sIFNlbGVjdFRyaWdnZXIsIFNlbGVjdFZhbHVlIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9zZWxlY3QnO1xuaW1wb3J0IHsgVGFibGUsIFRhYmxlQm9keSwgVGFibGVDZWxsLCBUYWJsZUhlYWQsIFRhYmxlSGVhZGVyLCBUYWJsZVJvdyB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvdGFibGUnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9idXR0b24nO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2NhcmQnO1xuaW1wb3J0IHsgQWxlcnREZXRhaWxEcmF3ZXIgfSBmcm9tICcuLi9jb21wb25lbnRzL2FsZXJ0L0FsZXJ0RGV0YWlsRHJhd2VyJztcbmltcG9ydCB7IFNldmVyaXR5QmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL2FsZXJ0L1NldmVyaXR5QmFkZ2UnO1xuaW1wb3J0IHsgdXNlQWxlcnRzLCB1c2VBY2tub3dsZWRnZUFsZXJ0LCB1c2VSZXNvbHZlQWxlcnQgfSBmcm9tICcuLi9ob29rcy91c2VBbGVydHMnO1xuaW1wb3J0IGFwaSBmcm9tICcuLi9saWIvYXBpJztcbmltcG9ydCB0eXBlIHsgQWxlcnQgfSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKiDlr7zlh7rlvZPliY3nrZvpgInmnaHku7bkuIvnmoTlkYrorabkuLogQ1NW77yI6Kem5Y+R5rWP6KeI5Zmo5LiL6L2977yJICovXG5hc3luYyBmdW5jdGlvbiBleHBvcnRBbGVydHNDc3Yoc3RhdHVzOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmcpIHtcbiAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcygpO1xuICBpZiAoc3RhdHVzKSBwYXJhbXMuc2V0KCdzdGF0dXMnLCBzdGF0dXMpO1xuICBpZiAoc2V2ZXJpdHkpIHBhcmFtcy5zZXQoJ3NldmVyaXR5Jywgc2V2ZXJpdHkpO1xuICBjb25zdCBxdWVyeSA9IHBhcmFtcy50b1N0cmluZygpO1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFwaS5nZXQoYC9hbGVydHMvZXhwb3J0JHtxdWVyeSA/IGA/JHtxdWVyeX1gIDogJyd9YCwgeyByZXNwb25zZVR5cGU6ICdibG9iJyB9KTtcbiAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChyZXNwb25zZS5kYXRhIGFzIEJsb2IpO1xuICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBhLmhyZWYgPSB1cmw7XG4gIGEuZG93bmxvYWQgPSBgYWxlcnRzXyR7RGF0ZS5ub3coKX0uY3N2YDtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcbiAgYS5jbGljaygpO1xuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xuICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG59XG5cbi8qKlxuICog5ZGK6K2m5Lit5b+D6aG1XG4gKlxuICog5Yqf6IO977ya5oyJ54q25oCBL+S4pemHjee6p+WIq+i/h+a7pOOAgeWIhumhtea1j+iniOOAgeehruiupC/op6PlhrPmk43kvZzjgIHngrnlh7vooYzmn6XnnIvor6bmg4Xmir3lsYnjgIJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQWxlcnRDZW50ZXJQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtwYWdlLCBzZXRQYWdlXSA9IHVzZVN0YXRlKDEpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtzZXZlcml0eSwgc2V0U2V2ZXJpdHldID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtzZWxlY3RlZEFsZXJ0LCBzZXRTZWxlY3RlZEFsZXJ0XSA9IHVzZVN0YXRlPEFsZXJ0IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkcmF3ZXJPcGVuLCBzZXREcmF3ZXJPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCB7IGRhdGEsIGlzTG9hZGluZywgaXNFcnJvciwgcmVmZXRjaCB9ID0gdXNlQWxlcnRzKFxuICAgIHsgcGFnZSwgcGFnZVNpemU6IDIwIH0sXG4gICAgeyBzdGF0dXM6IHN0YXR1cyB8fCB1bmRlZmluZWQsIHNldmVyaXR5OiBzZXZlcml0eSB8fCB1bmRlZmluZWQgfSxcbiAgKTtcbiAgY29uc3QgYWNrbm93bGVkZ2VBbGVydCA9IHVzZUFja25vd2xlZGdlQWxlcnQoKTtcbiAgY29uc3QgcmVzb2x2ZUFsZXJ0ID0gdXNlUmVzb2x2ZUFsZXJ0KCk7XG5cbiAgLyoqIOeCueWHu+WRiuitpuihjOaJk+W8gOivpuaDheaKveWxiSAqL1xuICBjb25zdCBoYW5kbGVSb3dDbGljayA9IChhbGVydDogQWxlcnQpID0+IHtcbiAgICBzZXRTZWxlY3RlZEFsZXJ0KGFsZXJ0KTtcbiAgICBzZXREcmF3ZXJPcGVuKHRydWUpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57dCgnYWxlcnQudGl0bGUnKX08L2gxPlxuICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgdmFyaWFudD1cIm91dGxpbmVcIlxuICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gZXhwb3J0QWxlcnRzQ3N2KHN0YXR1cywgc2V2ZXJpdHkpfVxuICAgICAgICA+XG4gICAgICAgICAgPERvd25sb2FkIGNsYXNzTmFtZT1cImgtNCB3LTQgbXItMlwiIC8+XG4gICAgICAgICAge3QoJ2NvbW1vbi5leHBvcnQnLCAn5a+85Ye6IENTVicpfVxuICAgICAgICA8L0J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog6L+H5ruk5p2h5Lu277ya54q25oCBICsg5Lil6YeN57qn5YirICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0zXCI+XG4gICAgICAgIDxTZWxlY3QgdmFsdWU9e3N0YXR1c30gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYgIT09IG51bGwpIHsgc2V0U3RhdHVzKHYgPT09ICdhbGwnID8gJycgOiB2KTsgc2V0UGFnZSgxKTsgfSB9fT5cbiAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTMyXCI+PFNlbGVjdFZhbHVlIHBsYWNlaG9sZGVyPXt0KCdjb21tb24uc3RhdHVzJyl9IC8+PC9TZWxlY3RUcmlnZ2VyPlxuICAgICAgICAgIDxTZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJhbGxcIj57dCgnY29tbW9uLmFsbCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiYWN0aXZlXCI+e3QoJ2FsZXJ0LmFjdGl2ZScpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiYWNrbm93bGVkZ2VkXCI+e3QoJ2FsZXJ0LmFja25vd2xlZGdlZCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwicmVzb2x2ZWRcIj57dCgnYWxlcnQucmVzb2x2ZWQnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgPFNlbGVjdCB2YWx1ZT17c2V2ZXJpdHl9IG9uVmFsdWVDaGFuZ2U9eyh2KSA9PiB7IGlmICh2ICE9PSBudWxsKSB7IHNldFNldmVyaXR5KHYgPT09ICdhbGwnID8gJycgOiB2KTsgc2V0UGFnZSgxKTsgfSB9fT5cbiAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTMyXCI+PFNlbGVjdFZhbHVlIHBsYWNlaG9sZGVyPXt0KCdhbGVydC5zZXZlcml0eScpfSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiYWxsXCI+e3QoJ2NvbW1vbi5hbGwnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cImNyaXRpY2FsXCI+e3QoJ2FsZXJ0LmNyaXRpY2FsJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJoaWdoXCI+e3QoJ2FsZXJ0LmhpZ2gnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIm5vcm1hbFwiPnt0KCdhbGVydC5ub3JtYWwnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cImxvd1wiPnt0KCdhbGVydC5sb3cnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICA8L1NlbGVjdD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5ZGK6K2m5YiX6KGo6KGo5qC85oiW5Yqg6L29L+mUmeivr+eKtuaAgSAqL31cbiAgICAgIHtpc0xvYWRpbmcgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHktMjAgdGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5sb2FkaW5nJyl9PC9kaXY+XG4gICAgICApIDogaXNFcnJvciAmJiAhZGF0YSA/IChcbiAgICAgICAgLyog6ZSZ6K+v5oCB77ya6aaW5bGP5Yqg6L295aSx6LSl5pe25pi+5byP5o+Q56S65bm25Y+v6YeN6K+V77yM6YG/5YWN5oqK572R57uc6ZSZ6K+v6K+v5pi+56S65Li6XCLmmoLml6DlkYroraZcIlxuICAgICAgICAgICDvvIjlkYrorabkuK3lv4PmvI/nnIsgQ3JpdGljYWwg5ZGK6K2m5piv5a6J5YWo6ZqQ5oKj77yM5b+F6aG75Yy65YiG56m654q25oCB5LiO6ZSZ6K+v54q25oCB77yJICovXG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMyBweS0xNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPEFsZXJ0VHJpYW5nbGUgY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWFtYmVyLTUwMFwiIC8+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZEZhaWxlZCcpfTwvcD5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIiBvbkNsaWNrPXsoKSA9PiByZWZldGNoKCl9PlxuICAgICAgICAgICAgICA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTIgaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgIHt0KCdjb21tb24ucmV0cnknKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgIDwvQ2FyZD5cbiAgICAgICkgOiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPFRhYmxlPlxuICAgICAgICAgICAgPFRhYmxlSGVhZGVyPlxuICAgICAgICAgICAgICA8VGFibGVSb3c+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnYWxlcnQuYWxlcnRDb2RlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnZGV2aWNlLm5hbWUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdhbGVydC5tZXRyaWMnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdhbGVydC52YWx1ZScpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnNldmVyaXR5Jyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLnN0YXR1cycpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2FsZXJ0LnRyaWdnZXJlZEF0Jyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLmFjdGlvbnMnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgIDwvVGFibGVIZWFkZXI+XG4gICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICB7ZGF0YT8uaXRlbXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxUYWJsZVJvdz48VGFibGVDZWxsIGNvbFNwYW49ezh9IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubm9EYXRhJyl9PC9UYWJsZUNlbGw+PC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBkYXRhPy5pdGVtcy5tYXAoKGFsZXJ0KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8VGFibGVSb3dcbiAgICAgICAgICAgICAgICAgICAga2V5PXthbGVydC5pZH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVSb3dDbGljayhhbGVydCl9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtc21cIj57YWxlcnQuYWxlcnRDb2RlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LXhzXCI+e2FsZXJ0LmRldmljZUlkLnNsaWNlKDAsOCl94oCmPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e2FsZXJ0Lm1ldHJpY308L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57YWxlcnQudmFsdWV9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PFNldmVyaXR5QmFkZ2Ugc2V2ZXJpdHk9e2FsZXJ0LnNldmVyaXR5fSAvPjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cInNtXCIgY2xhc3NOYW1lPVwiaC1hdXRvIHAtMCB0ZXh0LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dChgYWxlcnQuJHthbGVydC5zdGF0dXMudG9Mb3dlckNhc2UoKX1gIGFzICdhbGVydC5hY3RpdmUnIHwgJ2FsZXJ0LmFja25vd2xlZGdlZCcgfCAnYWxlcnQucmVzb2x2ZWQnKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57bmV3IERhdGUoYWxlcnQub2NjdXJyZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICB7Lyog5pON5L2c5oyJ6ZKu77ya6Zi75q2i6KGM54K55Ye75LqL5Lu25YaS5rOhICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMVwiIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHthbGVydC5zdGF0dXMgPT09ICdhY3RpdmUnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgb25DbGljaz17KCkgPT4gYWNrbm93bGVkZ2VBbGVydC5tdXRhdGUoYWxlcnQuaWQpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KCdhbGVydC5hY2tub3dsZWRnZScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgb25DbGljaz17KCkgPT4gcmVzb2x2ZUFsZXJ0Lm11dGF0ZShhbGVydC5pZCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoJ2FsZXJ0LnJlc29sdmUnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2FsZXJ0LnN0YXR1cyA9PT0gJ2Fja25vd2xlZGdlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbVwiIG9uQ2xpY2s9eygpID0+IHJlc29sdmVBbGVydC5tdXRhdGUoYWxlcnQuaWQpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dCgnYWxlcnQucmVzb2x2ZScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgPC9UYWJsZT5cblxuICAgICAgICAgIHsvKiDliIbpobXmjqfliLYgKi99XG4gICAgICAgICAge2RhdGEgJiYgZGF0YS50b3RhbCA+IDIwICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KCdjb21tb24udG90YWxJdGVtcycsIHsgY291bnQ6IGRhdGEudG90YWwgfSl9PC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgZGlzYWJsZWQ9e3BhZ2UgPD0gMX0gb25DbGljaz17KCkgPT4gc2V0UGFnZShwYWdlIC0gMSl9Pnt0KCdjb21tb24ucHJldmlvdXMnKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgZGlzYWJsZWQ9e3BhZ2UgKiAyMCA+PSBkYXRhLnRvdGFsfSBvbkNsaWNrPXsoKSA9PiBzZXRQYWdlKHBhZ2UgKyAxKX0+e3QoJ2NvbW1vbi5uZXh0Jyl9PC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7Lyog5ZGK6K2m6K+m5oOF5L6n6L655oq95bGJICovfVxuICAgICAgPEFsZXJ0RGV0YWlsRHJhd2VyXG4gICAgICAgIGFsZXJ0PXtzZWxlY3RlZEFsZXJ0fVxuICAgICAgICBvcGVuPXtkcmF3ZXJPcGVufVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXREcmF3ZXJPcGVuKGZhbHNlKX1cbiAgICAgICAgb25BY2tub3dsZWRnZT17KGlkKSA9PiB7IGFja25vd2xlZGdlQWxlcnQubXV0YXRlKGlkKTsgc2V0RHJhd2VyT3BlbihmYWxzZSk7IH19XG4gICAgICAgIG9uUmVzb2x2ZT17KGlkKSA9PiB7IHJlc29sdmVBbGVydC5tdXRhdGUoaWQpOyBzZXREcmF3ZXJPcGVuKGZhbHNlKTsgfX1cbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXX0=