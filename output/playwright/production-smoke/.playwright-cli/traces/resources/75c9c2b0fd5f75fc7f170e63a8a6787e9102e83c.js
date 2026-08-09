import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/WorkOrderListPage.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport18_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport18_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Plus, Search, Download, RefreshCw, AlertTriangle } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Card, CardContent } from "/src/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/src/components/ui/dialog.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { PriorityBadge } from "/src/components/workorder/PriorityBadge.tsx";
import { SlaCountdown } from "/src/components/workorder/SlaCountdown.tsx";
import { WorkOrderForm } from "/src/components/workorder/WorkOrderForm.tsx";
import { useWorkOrders, useCreateWorkOrder, exportWorkOrdersCsv } from "/src/hooks/useWorkOrders.ts";
import { useDevices } from "/src/hooks/useDevices.ts";
import { usePermission } from "/src/hooks/usePermission.ts";
import { getWorkOrderStatusLabels } from "/src/utils/workorder.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderListPage.tsx";
import __vite__cjsImport18_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 工单列表页
*
* 展示工单分页列表，支持搜索、状态筛选和新建工单弹窗。
* 点击行跳转至工单详情页。
*/
export default function WorkOrderListPage() {
	_s();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const perm = usePermission("workOrder");
	/** 工单状态对应的中文标签（使用共享工具函数，匹配后端 PascalCase 枚举序列化） */
	const statusLabels = getWorkOrderStatusLabels(t);
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState("");
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const { data, isLoading, isError, refetch } = useWorkOrders({
		page,
		pageSize: 20
	}, { status: status || undefined });
	const createWorkOrder = useCreateWorkOrder();
	const { data: devicesData } = useDevices({
		page: 1,
		pageSize: 100
	});
	const devices = devicesData?.items ?? [];
	/** 前端搜索过滤（按标题或工单编码） */
	const filteredItems = data?.items.filter((wo) => !search || wo.title.includes(search) || wo.workOrderCode.includes(search)) ?? [];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-2xl font-bold",
					children: t("workorder.title")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 56,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => exportWorkOrdersCsv({ status: status || undefined }),
						title: t("common.exportTip", "最多导出 10000 条"),
						children: [/* @__PURE__ */ _jsxDEV(Download, { className: "mr-2 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 64,
							columnNumber: 13
						}, this), t("common.export", "导出")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 58,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						onClick: () => setDialogOpen(true),
						disabled: !perm.canCreate,
						children: [/* @__PURE__ */ _jsxDEV(Plus, { className: "mr-2 h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 67,
							columnNumber: 13
						}, this), t("common.create")]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 66,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 57,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 55,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ _jsxDEV(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 75,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(Input, {
						className: "pl-9",
						placeholder: t("common.search") + "...",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 76,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 74,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Select, {
					value: status,
					onValueChange: (v) => {
						if (v != null) {
							setStatus(v === "all" ? "" : v);
							setPage(1);
						}
					},
					children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, {
						className: "w-32",
						children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("common.status") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 43
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "all",
							children: t("common.all")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 86,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "PendingDispatch",
							children: t("workorder.status.pendingDispatch")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 87,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Assigned",
							children: t("workorder.status.assigned")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 88,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "InProgress",
							children: t("workorder.status.inProgress")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 89,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Completed",
							children: t("workorder.status.completed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 90,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Accepted",
							children: t("workorder.status.accepted")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Rejected",
							children: t("workorder.status.rejected")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 92,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Closed",
							children: t("workorder.status.closed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 93,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Cancelled",
							children: t("workorder.status.cancelled")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 94,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 85,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 83,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 73,
				columnNumber: 7
			}, this),
			isLoading ? /* @__PURE__ */ _jsxDEV("div", {
				className: "py-20 text-center text-muted-foreground",
				children: t("common.loading")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 101,
				columnNumber: 9
			}, this) : isError && !data ? /* @__PURE__ */ _jsxDEV(
				Card,
				/* 错误态：首屏加载失败时显式提示并可重试，避免把网络错误误显示为"暂无工单" */
				{ children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "flex flex-col items-center gap-3 py-16 text-center",
					children: [
						/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-8 w-8 text-amber-500" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 106,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("common.loadFailed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 107,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => refetch(),
							children: [/* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 109,
								columnNumber: 15
							}, this), t("common.retry")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 108,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 105,
					columnNumber: 11
				}, this) },
				void 0,
				false,
				{
					fileName: _jsxFileName,
					lineNumber: 104,
					columnNumber: 9
				},
				this
			) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("workorder.code") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("workorder.titleField") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 120,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 121,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("workorder.priority") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 122,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.createdAt") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 123,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("workorder.dueDate") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 124,
					columnNumber: 17
				}, this)
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 15
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 117,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: filteredItems.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
				colSpan: 6,
				className: "text-center text-muted-foreground",
				children: t("common.noData")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 130,
				columnNumber: 19
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 129,
				columnNumber: 17
			}, this) : filteredItems.map((wo) => /* @__PURE__ */ _jsxDEV(TableRow, {
				className: "cursor-pointer",
				onClick: () => navigate(`/work-orders/${wo.id}`),
				children: [
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "font-mono text-sm",
						children: wo.workOrderCode
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 135,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "font-medium",
						children: wo.title
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 136,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
						variant: "outline",
						children: statusLabels[wo.status] ?? wo.status
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 137,
						columnNumber: 32
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 137,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(PriorityBadge, { priority: wo.priority }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 32
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "text-sm text-muted-foreground",
						children: new Date(wo.createdAt).toLocaleString()
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 139,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(SlaCountdown, {
						dueDate: wo.dueDate,
						createdAt: wo.createdAt,
						status: wo.status
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 140,
						columnNumber: 32
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 140,
						columnNumber: 21
					}, this)
				]
			}, wo.id, true, {
				fileName: _jsxFileName,
				lineNumber: 134,
				columnNumber: 19
			}, this)) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 127,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 116,
				columnNumber: 11
			}, this), data && data.total > 20 && /* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ _jsxDEV("span", { children: t("common.totalItems", { count: data.total }) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 150,
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
						lineNumber: 152,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						disabled: page * 20 >= data.total,
						onClick: () => setPage(page + 1),
						children: t("common.next")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 153,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 151,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 149,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 115,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: dialogOpen,
				onOpenChange: setDialogOpen,
				children: /* @__PURE__ */ _jsxDEV(DialogContent, {
					className: "max-w-lg",
					children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: /* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("workorder.create") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 163,
						columnNumber: 25
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 163,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(WorkOrderForm, {
						devices,
						onSubmit: async (req) => {
							await createWorkOrder.mutateAsync(req);
							setDialogOpen(false);
						},
						onCancel: () => setDialogOpen(false),
						loading: createWorkOrder.isPending
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 164,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 162,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 161,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 53,
		columnNumber: 5
	}, this);
}
_s(WorkOrderListPage, "thk3O/oXvz3WTxErcL0F7xn8b4M=", false, function() {
	return [
		useTranslation,
		useNavigate,
		usePermission,
		useWorkOrders,
		useCreateWorkOrder,
		useDevices
	];
});
_c = WorkOrderListPage;
var _c;
$RefreshReg$(_c, "WorkOrderListPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/WorkOrderListPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderListPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderListPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderListPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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LCJuYW1lcyI6W10sInNvdXJjZXMiOlsiV29ya09yZGVyTGlzdFBhZ2UudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBQbHVzLCBTZWFyY2gsIERvd25sb2FkLCBSZWZyZXNoQ3csIEFsZXJ0VHJpYW5nbGUgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9idXR0b24nO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2lucHV0JztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9jYXJkJztcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0Q29udGVudCwgU2VsZWN0SXRlbSwgU2VsZWN0VHJpZ2dlciwgU2VsZWN0VmFsdWUgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3NlbGVjdCc7XG5pbXBvcnQgeyBUYWJsZSwgVGFibGVCb2R5LCBUYWJsZUNlbGwsIFRhYmxlSGVhZCwgVGFibGVIZWFkZXIsIFRhYmxlUm93IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS90YWJsZSc7XG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ0NvbnRlbnQsIERpYWxvZ0hlYWRlciwgRGlhbG9nVGl0bGUgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2RpYWxvZyc7XG5pbXBvcnQgeyBCYWRnZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYmFkZ2UnO1xuaW1wb3J0IHsgUHJpb3JpdHlCYWRnZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvd29ya29yZGVyL1ByaW9yaXR5QmFkZ2UnO1xuaW1wb3J0IHsgU2xhQ291bnRkb3duIH0gZnJvbSAnLi4vY29tcG9uZW50cy93b3Jrb3JkZXIvU2xhQ291bnRkb3duJztcbmltcG9ydCB7IFdvcmtPcmRlckZvcm0gfSBmcm9tICcuLi9jb21wb25lbnRzL3dvcmtvcmRlci9Xb3JrT3JkZXJGb3JtJztcbmltcG9ydCB7IHVzZVdvcmtPcmRlcnMsIHVzZUNyZWF0ZVdvcmtPcmRlciwgZXhwb3J0V29ya09yZGVyc0NzdiB9IGZyb20gJy4uL2hvb2tzL3VzZVdvcmtPcmRlcnMnO1xuaW1wb3J0IHsgdXNlRGV2aWNlcyB9IGZyb20gJy4uL2hvb2tzL3VzZURldmljZXMnO1xuaW1wb3J0IHsgdXNlUGVybWlzc2lvbiB9IGZyb20gJy4uL2hvb2tzL3VzZVBlcm1pc3Npb24nO1xuaW1wb3J0IHsgZ2V0V29ya09yZGVyU3RhdHVzTGFiZWxzIH0gZnJvbSAnLi4vdXRpbHMvd29ya29yZGVyJztcbmltcG9ydCB0eXBlIHsgQ3JlYXRlV29ya09yZGVyUmVxdWVzdCB9IGZyb20gJy4uL3R5cGVzJztcblxuXG4vKipcbiAqIOW3peWNleWIl+ihqOmhtVxuICpcbiAqIOWxleekuuW3peWNleWIhumhteWIl+ihqO+8jOaUr+aMgeaQnOe0ouOAgeeKtuaAgeetm+mAieWSjOaWsOW7uuW3peWNleW8ueeql+OAglxuICog54K55Ye76KGM6Lez6L2s6Iez5bel5Y2V6K+m5oOF6aG144CCXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFdvcmtPcmRlckxpc3RQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcbiAgY29uc3QgcGVybSA9IHVzZVBlcm1pc3Npb24oJ3dvcmtPcmRlcicpO1xuXG4gIC8qKiDlt6XljZXnirbmgIHlr7nlupTnmoTkuK3mlofmoIfnrb7vvIjkvb/nlKjlhbHkuqvlt6Xlhbflh73mlbDvvIzljLnphY3lkI7nq68gUGFzY2FsQ2FzZSDmnprkuL7luo/liJfljJbvvIkgKi9cbiAgY29uc3Qgc3RhdHVzTGFiZWxzID0gZ2V0V29ya09yZGVyU3RhdHVzTGFiZWxzKHQpO1xuXG4gIGNvbnN0IFtwYWdlLCBzZXRQYWdlXSA9IHVzZVN0YXRlKDEpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtzZWFyY2gsIHNldFNlYXJjaF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkaWFsb2dPcGVuLCBzZXREaWFsb2dPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCB7IGRhdGEsIGlzTG9hZGluZywgaXNFcnJvciwgcmVmZXRjaCB9ID0gdXNlV29ya09yZGVycyh7IHBhZ2UsIHBhZ2VTaXplOiAyMCB9LCB7IHN0YXR1czogc3RhdHVzIHx8IHVuZGVmaW5lZCB9KTtcbiAgY29uc3QgY3JlYXRlV29ya09yZGVyID0gdXNlQ3JlYXRlV29ya09yZGVyKCk7XG4gIGNvbnN0IHsgZGF0YTogZGV2aWNlc0RhdGEgfSA9IHVzZURldmljZXMoeyBwYWdlOiAxLCBwYWdlU2l6ZTogMTAwIH0pO1xuXG4gIGNvbnN0IGRldmljZXMgPSBkZXZpY2VzRGF0YT8uaXRlbXMgPz8gW107XG5cbiAgLyoqIOWJjeerr+aQnOe0oui/h+a7pO+8iOaMieagh+mimOaIluW3peWNlee8luegge+8iSAqL1xuICBjb25zdCBmaWx0ZXJlZEl0ZW1zID0gZGF0YT8uaXRlbXMuZmlsdGVyKFxuICAgICh3bykgPT4gIXNlYXJjaCB8fCB3by50aXRsZS5pbmNsdWRlcyhzZWFyY2gpIHx8IHdvLndvcmtPcmRlckNvZGUuaW5jbHVkZXMoc2VhcmNoKSxcbiAgKSA/PyBbXTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICB7Lyog6aG16Z2i5aS06YOoICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZFwiPnt0KCd3b3Jrb3JkZXIudGl0bGUnKX08L2gxPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICB2YXJpYW50PVwib3V0bGluZVwiXG4gICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZXhwb3J0V29ya09yZGVyc0Nzdih7IHN0YXR1czogc3RhdHVzIHx8IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgICAgIHRpdGxlPXt0KCdjb21tb24uZXhwb3J0VGlwJywgJ+acgOWkmuWvvOWHuiAxMDAwMCDmnaEnKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8RG93bmxvYWQgY2xhc3NOYW1lPVwibXItMiBoLTQgdy00XCIgLz57dCgnY29tbW9uLmV4cG9ydCcsICflr7zlh7onKX1cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldERpYWxvZ09wZW4odHJ1ZSl9IGRpc2FibGVkPXshcGVybS5jYW5DcmVhdGV9PlxuICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwibXItMiBoLTQgdy00XCIgLz57dCgnY29tbW9uLmNyZWF0ZScpfVxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5pCc57Si5ZKM562b6YCJ5qCPICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0zXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgPFNlYXJjaCBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTMgdG9wLTEvMiBoLTQgdy00IC10cmFuc2xhdGUteS0xLzIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgLz5cbiAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInBsLTlcIlxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ2NvbW1vbi5zZWFyY2gnKSArICcuLi4nfVxuICAgICAgICAgICAgdmFsdWU9e3NlYXJjaH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFNlbGVjdCB2YWx1ZT17c3RhdHVzfSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodiAhPSBudWxsKSB7IHNldFN0YXR1cyh2ID09PSAnYWxsJyA/ICcnIDogdik7IHNldFBhZ2UoMSk7IH0gfX0+XG4gICAgICAgICAgPFNlbGVjdFRyaWdnZXIgY2xhc3NOYW1lPVwidy0zMlwiPjxTZWxlY3RWYWx1ZSBwbGFjZWhvbGRlcj17dCgnY29tbW9uLnN0YXR1cycpfSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiYWxsXCI+e3QoJ2NvbW1vbi5hbGwnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIlBlbmRpbmdEaXNwYXRjaFwiPnt0KCd3b3Jrb3JkZXIuc3RhdHVzLnBlbmRpbmdEaXNwYXRjaCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiQXNzaWduZWRcIj57dCgnd29ya29yZGVyLnN0YXR1cy5hc3NpZ25lZCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiSW5Qcm9ncmVzc1wiPnt0KCd3b3Jrb3JkZXIuc3RhdHVzLmluUHJvZ3Jlc3MnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIkNvbXBsZXRlZFwiPnt0KCd3b3Jrb3JkZXIuc3RhdHVzLmNvbXBsZXRlZCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiQWNjZXB0ZWRcIj57dCgnd29ya29yZGVyLnN0YXR1cy5hY2NlcHRlZCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiUmVqZWN0ZWRcIj57dCgnd29ya29yZGVyLnN0YXR1cy5yZWplY3RlZCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiQ2xvc2VkXCI+e3QoJ3dvcmtvcmRlci5zdGF0dXMuY2xvc2VkJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJDYW5jZWxsZWRcIj57dCgnd29ya29yZGVyLnN0YXR1cy5jYW5jZWxsZWQnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICA8L1NlbGVjdD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5bel5Y2V6KGo5qC85oiW5Yqg6L29L+mUmeivr+eKtuaAgSAqL31cbiAgICAgIHtpc0xvYWRpbmcgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHktMjAgdGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5sb2FkaW5nJyl9PC9kaXY+XG4gICAgICApIDogaXNFcnJvciAmJiAhZGF0YSA/IChcbiAgICAgICAgLyog6ZSZ6K+v5oCB77ya6aaW5bGP5Yqg6L295aSx6LSl5pe25pi+5byP5o+Q56S65bm25Y+v6YeN6K+V77yM6YG/5YWN5oqK572R57uc6ZSZ6K+v6K+v5pi+56S65Li6XCLmmoLml6Dlt6XljZVcIiAqL1xuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTMgcHktMTYgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxBbGVydFRyaWFuZ2xlIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1hbWJlci01MDBcIiAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRGYWlsZWQnKX08L3A+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgb25DbGljaz17KCkgPT4gcmVmZXRjaCgpfT5cbiAgICAgICAgICAgICAgPFJlZnJlc2hDdyBjbGFzc05hbWU9XCJtci0yIGgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICB7dCgnY29tbW9uLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApIDogKFxuICAgICAgICA8PlxuICAgICAgICAgIDxUYWJsZT5cbiAgICAgICAgICAgIDxUYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ3dvcmtvcmRlci5jb2RlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnd29ya29yZGVyLnRpdGxlRmllbGQnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdjb21tb24uc3RhdHVzJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnd29ya29yZGVyLnByaW9yaXR5Jyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLmNyZWF0ZWRBdCcpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ3dvcmtvcmRlci5kdWVEYXRlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICA8L1RhYmxlSGVhZGVyPlxuICAgICAgICAgICAgPFRhYmxlQm9keT5cbiAgICAgICAgICAgICAge2ZpbHRlcmVkSXRlbXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxUYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY29sU3Bhbj17Nn0gY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5ub0RhdGEnKX08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIGZpbHRlcmVkSXRlbXMubWFwKCh3bykgPT4gKFxuICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17d28uaWR9IGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyXCIgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoYC93b3JrLW9yZGVycy8ke3dvLmlkfWApfT5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC1zbVwiPnt3by53b3JrT3JkZXJDb2RlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e3dvLnRpdGxlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiPntzdGF0dXNMYWJlbHNbd28uc3RhdHVzXSA/PyB3by5zdGF0dXN9PC9CYWRnZT48L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48UHJpb3JpdHlCYWRnZSBwcmlvcml0eT17d28ucHJpb3JpdHl9IC8+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57bmV3IERhdGUod28uY3JlYXRlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxTbGFDb3VudGRvd24gZHVlRGF0ZT17d28uZHVlRGF0ZX0gY3JlYXRlZEF0PXt3by5jcmVhdGVkQXR9IHN0YXR1cz17d28uc3RhdHVzfSAvPjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgPC9UYWJsZT5cblxuICAgICAgICAgIHsvKiDliIbpobXmjqfliLYgKi99XG4gICAgICAgICAge2RhdGEgJiYgZGF0YS50b3RhbCA+IDIwICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KCdjb21tb24udG90YWxJdGVtcycsIHsgY291bnQ6IGRhdGEudG90YWwgfSl9PC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgZGlzYWJsZWQ9e3BhZ2UgPD0gMX0gb25DbGljaz17KCkgPT4gc2V0UGFnZShwYWdlIC0gMSl9Pnt0KCdjb21tb24ucHJldmlvdXMnKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgZGlzYWJsZWQ9e3BhZ2UgKiAyMCA+PSBkYXRhLnRvdGFsfSBvbkNsaWNrPXsoKSA9PiBzZXRQYWdlKHBhZ2UgKyAxKX0+e3QoJ2NvbW1vbi5uZXh0Jyl9PC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7Lyog5paw5bu65bel5Y2V5by556qXICovfVxuICAgICAgPERpYWxvZyBvcGVuPXtkaWFsb2dPcGVufSBvbk9wZW5DaGFuZ2U9e3NldERpYWxvZ09wZW59PlxuICAgICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9XCJtYXgtdy1sZ1wiPlxuICAgICAgICAgIDxEaWFsb2dIZWFkZXI+PERpYWxvZ1RpdGxlPnt0KCd3b3Jrb3JkZXIuY3JlYXRlJyl9PC9EaWFsb2dUaXRsZT48L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8V29ya09yZGVyRm9ybVxuICAgICAgICAgICAgZGV2aWNlcz17ZGV2aWNlc31cbiAgICAgICAgICAgIG9uU3VibWl0PXthc3luYyAocmVxOiBDcmVhdGVXb3JrT3JkZXJSZXF1ZXN0KSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVdvcmtPcmRlci5tdXRhdGVBc3luYyhyZXEpO1xuICAgICAgICAgICAgICBzZXREaWFsb2dPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0RGlhbG9nT3BlbihmYWxzZSl9XG4gICAgICAgICAgICBsb2FkaW5nPXtjcmVhdGVXb3JrT3JkZXIuaXNQZW5kaW5nfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvRGlhbG9nQ29udGVudD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIDwvZGl2PlxuICApO1xufVxuIl19