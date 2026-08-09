import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/WorkOrderDetailPage.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport23_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useParams, useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { ArrowLeft } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { toast } from "/node_modules/.vite/deps/sonner.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Textarea } from "/src/components/ui/textarea.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/src/components/ui/dialog.tsx";
import { PriorityBadge } from "/src/components/workorder/PriorityBadge.tsx";
import { SlaCountdown } from "/src/components/workorder/SlaCountdown.tsx";
import { ApprovalProgressPanel } from "/src/components/workorder/ApprovalProgressPanel.tsx";
import { OfflineSyncPanel } from "/src/components/workorder/OfflineSyncPanel.tsx";
import AttachmentUpload from "/src/components/workorder/AttachmentUpload.tsx";
import { OfflineStatusBadge } from "/src/components/workorder/OfflineStatusBadge.tsx";
import { useOfflineQueue } from "/src/hooks/useOfflineQueue.ts";
import { useWorkOrder, useStartWorkOrder, useCompleteWorkOrder, useAcceptWorkOrder, useRejectWorkOrder, useCloseWorkOrder, useCancelWorkOrder } from "/src/hooks/useWorkOrders.ts";
import { useTechnicians, useAssignFromRecommendation } from "/src/hooks/useDispatch.ts";
import { useWorkOrderApprovals, useSubmitWorkOrder } from "/src/hooks/useApprovals.ts";
import { getWorkOrderStatusLabels } from "/src/utils/workorder.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderDetailPage.tsx";
import __vite__cjsImport23_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
/**
* 工单详情页
*
* 展示工单基本信息、状态流转操作按钮、关联信息和审计日志。
* 根据工单当前状态动态显示可执行的操作按钮。
*/
export default function WorkOrderDetailPage() {
	_s();
	const { t } = useTranslation();
	const { id } = useParams();
	const navigate = useNavigate();
	/** 工单状态对应的中文标签（使用共享工具函数，匹配后端 PascalCase 枚举序列化） */
	const statusLabels = getWorkOrderStatusLabels(t);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [resolution, setResolution] = useState("");
	// 维修执行报告/使用零件：完成或提交验收时填写，是知识沉淀 FaultCase.Solution/PartsUsed 的数据源（回归 #252：
	// 原前端只传 resolution，后端 ExecutionReport/RequiredParts 永远为空 → Solution 永远降级、PartsUsed 永远空）
	const [executionReport, setExecutionReport] = useState("");
	const [requiredParts, setRequiredParts] = useState("");
	const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
	const [selectedTechnician, setSelectedTechnician] = useState("");
	const { data: workOrder, isLoading } = useWorkOrder(id ?? "");
	const { data: approvals } = useWorkOrderApprovals(id);
	const startOrder = useStartWorkOrder();
	const completeOrder = useCompleteWorkOrder();
	const acceptOrder = useAcceptWorkOrder();
	const rejectOrder = useRejectWorkOrder();
	const closeOrder = useCloseWorkOrder();
	const cancelOrder = useCancelWorkOrder();
	const submitOrder = useSubmitWorkOrder();
	const { enqueue } = useOfflineQueue();
	const { data: technicians } = useTechnicians(true);
	const assignOrder = useAssignFromRecommendation();
	if (isLoading) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.loading")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 25
	}, this);
	if (!workOrder) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-20 text-center text-muted-foreground",
		children: t("common.noData")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 76,
		columnNumber: 26
	}, this);
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "icon",
						onClick: () => navigate("/work-orders"),
						children: /* @__PURE__ */ _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 11
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 82,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", {
						className: "text-2xl font-bold",
						children: workOrder.title
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 86,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: workOrder.workOrderCode
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 11
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 85,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ml-auto flex items-center gap-2",
						children: [
							/* @__PURE__ */ _jsxDEV(OfflineStatusBadge, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 90,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV(Badge, {
								variant: "outline",
								children: statusLabels[workOrder.status] ?? workOrder.status
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 91,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV(PriorityBadge, { priority: workOrder.priority }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 92,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 89,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 81,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
				className: "grid grid-cols-2 gap-4 p-4 md:grid-cols-4",
				children: [
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("common.type")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 99,
						columnNumber: 16
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "font-medium",
						children: workOrder.type
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 99,
						columnNumber: 83
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 99,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("common.status")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 101,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Badge, {
						variant: "outline",
						children: statusLabels[workOrder.status]
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 102,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 100,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("workorder.assignedTo")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 104,
						columnNumber: 16
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "font-medium",
						children: workOrder.assignedTo ?? "-"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 104,
						columnNumber: 92
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 104,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("workorder.dueDate")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 16
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "font-medium",
						children: /* @__PURE__ */ _jsxDEV(SlaCountdown, {
							dueDate: workOrder.dueDate,
							createdAt: workOrder.createdAt,
							status: workOrder.status,
							showRawDateWhenTerminal: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 105,
							columnNumber: 118
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 89
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("common.createdAt")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 106,
						columnNumber: 16
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "font-medium",
						children: new Date(workOrder.createdAt).toLocaleString()
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 106,
						columnNumber: 88
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 106,
						columnNumber: 11
					}, this),
					workOrder.completedAt && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("workorder.completedAt")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 108,
						columnNumber: 18
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "font-medium",
						children: new Date(workOrder.completedAt).toLocaleString()
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 108,
						columnNumber: 95
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 108,
						columnNumber: 13
					}, this),
					workOrder.actualHours != null && workOrder.actualHours > 0 && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-muted-foreground",
						children: t("workorder.actualHours")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 112,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "font-medium",
						children: workOrder.actualHours < 1 ? t("workorder.slaMinutes", { count: Math.round(workOrder.actualHours * 60) }) : t("workorder.slaHours", { count: Math.round(workOrder.actualHours * 10) / 10 })
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 113,
						columnNumber: 15
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 111,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 98,
				columnNumber: 9
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 97,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(ActionButtons, {
				workOrder,
				onDispatch: () => setDispatchDialogOpen(true),
				onStart: () => startOrder.mutate(workOrder.id),
				onAccept: () => acceptOrder.mutate(workOrder.id),
				onReject: (reason) => rejectOrder.mutate({
					id: workOrder.id,
					reason
				}),
				onClose: () => closeOrder.mutate(workOrder.id),
				onCancel: () => setCancelDialogOpen(true),
				onSubmitForApproval: () => submitOrder.mutate({
					id: workOrder.id,
					resolution,
					executionReport,
					requiredParts
				})
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 124,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid gap-6 md:grid-cols-2",
				children: [/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
					className: "text-base",
					children: t("workorder.relatedInfo")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 23
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "space-y-3",
					children: [
						workOrder.rootCause ? /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("workorder.rootCause")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 147,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 text-sm",
							children: workOrder.rootCause
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 148,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 146,
							columnNumber: 15
						}, this) : null,
						workOrder.resolution ? /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("workorder.resolution")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 153,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 text-sm",
							children: workOrder.resolution
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 154,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 152,
							columnNumber: 15
						}, this) : null,
						workOrder.executionReport ? /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("workorder.executionReport")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 159,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 whitespace-pre-wrap text-sm",
							children: workOrder.executionReport
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 160,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 158,
							columnNumber: 15
						}, this) : null,
						workOrder.requiredParts ? /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("workorder.requiredParts")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 165,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 whitespace-pre-wrap text-sm",
							children: workOrder.requiredParts
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 166,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 164,
							columnNumber: 15
						}, this) : null,
						!workOrder.rootCause && !workOrder.resolution && !workOrder.executionReport && !workOrder.requiredParts && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("workorder.noRelatedInfo")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 170,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 144,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 142,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
					className: "text-base",
					children: t("workorder.operationRecords")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 177,
					columnNumber: 23
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 177,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-muted-foreground",
					children: t("workorder.noOperationRecords")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 179,
					columnNumber: 13
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 178,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 176,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 140,
				columnNumber: 7
			}, this),
			workOrder.status === "InProgress" && /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
				className: "text-base",
				children: t("workorder.fillResolution")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 187,
				columnNumber: 23
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 187,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.resolution") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 190,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
							value: resolution,
							onChange: (e) => setResolution(e.target.value),
							placeholder: t("workorder.describeResolution"),
							rows: 2
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 191,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 189,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.executionReport") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 199,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
							value: executionReport,
							onChange: (e) => setExecutionReport(e.target.value),
							placeholder: t("workorder.executionReportPlaceholder"),
							rows: 4
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 200,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 198,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.requiredParts") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 208,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
							value: requiredParts,
							onChange: (e) => setRequiredParts(e.target.value),
							placeholder: t("workorder.requiredPartsPlaceholder"),
							rows: 2
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 209,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 207,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV(Button, {
						onClick: async () => {
							try {
								if (navigator.onLine) {
									completeOrder.mutate({
										id: workOrder.id,
										resolution,
										executionReport,
										requiredParts
									});
								} else {
									await enqueue("work-order-complete", `/api/v1/work-orders/${workOrder.id}/complete`, "PUT", {
										id: workOrder.id,
										resolution,
										executionReport,
										requiredParts
									});
								}
							} catch (err) {
								toast.error(t("common.error"), { description: err instanceof Error ? err.message : String(err) });
							}
						},
						disabled: !resolution || completeOrder.isPending,
						children: navigator.onLine ? t("workorder.complete") : "保存到离线队列"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 216,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 188,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 186,
				columnNumber: 9
			}, this),
			workOrder.status === "SubmittedForApproval" && approvals && approvals.length > 0 && /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
				className: "text-base",
				children: "审批进度"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 246,
				columnNumber: 23
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 246,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV(ApprovalProgressPanel, {
				workOrderId: workOrder.id,
				approvals
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 248,
				columnNumber: 13
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 247,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 245,
				columnNumber: 9
			}, this),
			id && /* @__PURE__ */ _jsxDEV(AttachmentUpload, {
				workOrderId: id,
				canEdit: workOrder?.status !== "Closed" && workOrder?.status !== "Cancelled"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 258,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(OfflineSyncPanel, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 265,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: dispatchDialogOpen,
				onOpenChange: setDispatchDialogOpen,
				children: /* @__PURE__ */ _jsxDEV(DialogContent, { children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: /* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("workorder.dispatch") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 270,
					columnNumber: 25
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 270,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.selectTechnician") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 273,
							columnNumber: 15
						}, this), technicians && technicians.length > 0 ? /* @__PURE__ */ _jsxDEV("div", {
							className: "max-h-60 space-y-2 overflow-y-auto",
							children: technicians.map((tech) => /* @__PURE__ */ _jsxDEV("button", {
								type: "button",
								className: `w-full rounded-md border p-3 text-left transition-colors ${selectedTechnician === tech.userId ? "border-primary bg-primary/5" : "hover:bg-muted"}`,
								onClick: () => setSelectedTechnician(tech.userId),
								children: [/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ _jsxDEV("span", {
										className: "font-medium",
										children: tech.name
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 284,
										columnNumber: 25
									}, this), /* @__PURE__ */ _jsxDEV("span", {
										className: "text-xs text-muted-foreground",
										children: t("workorder.activeWorkCount", { count: tech.activeWorkCount })
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 285,
										columnNumber: 25
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 283,
									columnNumber: 23
								}, this), Array.isArray(tech.skills) && tech.skills.length > 0 && /* @__PURE__ */ _jsxDEV("div", {
									className: "mt-1 flex flex-wrap gap-1",
									children: tech.skills.map((s) => /* @__PURE__ */ _jsxDEV("span", {
										className: "rounded bg-muted px-1.5 py-0.5 text-xs",
										children: s
									}, s, false, {
										fileName: _jsxFileName,
										lineNumber: 292,
										columnNumber: 29
									}, this))
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 290,
									columnNumber: 25
								}, this)]
							}, tech.userId, true, {
								fileName: _jsxFileName,
								lineNumber: 277,
								columnNumber: 21
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 275,
							columnNumber: 17
						}, this) : /* @__PURE__ */ _jsxDEV("p", {
							className: "py-4 text-center text-sm text-muted-foreground",
							children: t("workorder.noTechnicians")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 300,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 272,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => setDispatchDialogOpen(false),
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 304,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							disabled: !selectedTechnician || assignOrder.isPending,
							onClick: () => {
								assignOrder.mutate({
									workOrderId: workOrder.id,
									technicianUserId: selectedTechnician
								}, {
									onSuccess: () => {
										toast.success(t("workorder.dispatchSuccess"));
										setDispatchDialogOpen(false);
										setSelectedTechnician("");
									},
									onError: (err) => {
										toast.error(t("common.error"), { description: err.message });
									}
								});
							},
							children: t("workorder.confirmDispatch")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 305,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 303,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 271,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 269,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 268,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: cancelDialogOpen,
				onOpenChange: setCancelDialogOpen,
				children: /* @__PURE__ */ _jsxDEV(DialogContent, { children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: /* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("workorder.cancel") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 333,
					columnNumber: 25
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 333,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.cancelReason") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 336,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
							value: cancelReason,
							onChange: (e) => setCancelReason(e.target.value),
							placeholder: t("workorder.enterCancelReason"),
							rows: 3
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 337,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 335,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => setCancelDialogOpen(false),
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 345,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							variant: "destructive",
							disabled: !cancelReason,
							onClick: () => {
								cancelOrder.mutate({
									id: workOrder.id,
									reason: cancelReason
								});
								setCancelDialogOpen(false);
							},
							children: t("workorder.confirmCancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 346,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 344,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 334,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 332,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 331,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 5
	}, this);
}
_s(WorkOrderDetailPage, "N5rA+KJokqKv2NN1RIuXTyaTEII=", false, function() {
	return [
		useTranslation,
		useParams,
		useNavigate,
		useWorkOrder,
		useWorkOrderApprovals,
		useStartWorkOrder,
		useCompleteWorkOrder,
		useAcceptWorkOrder,
		useRejectWorkOrder,
		useCloseWorkOrder,
		useCancelWorkOrder,
		useSubmitWorkOrder,
		useOfflineQueue,
		useTechnicians,
		useAssignFromRecommendation
	];
});
_c = WorkOrderDetailPage;
/**
* 工单状态操作按钮组件
*
* 根据工单当前状态动态显示可用的操作按钮。
* 状态流转规则：
* - pending_dispatch / dispatched → 开始执行 / 取消
* - in_progress → 取消（完成操作在独立区域）
* - completed → 验收通过 / 验收不通过
* - accepted → 关闭
*/
function ActionButtons({ workOrder, onDispatch, onStart, onAccept, onReject, onClose, onCancel, onSubmitForApproval }) {
	_s2();
	const { t } = useTranslation();
	const [rejectReason, setRejectReason] = useState("");
	const [showReject, setShowReject] = useState(false);
	/** 各状态对应的可用按钮配置 */
	const buttons = {
		PendingDispatch: [{
			label: t("workorder.dispatch"),
			action: onDispatch
		}],
		Assigned: [{
			label: t("workorder.startExecution"),
			action: onStart
		}],
		InProgress: [{
			label: t("workorder.submitForApproval"),
			action: onSubmitForApproval
		}],
		SubmittedForApproval: [],
		Completed: [{
			label: t("workorder.accept"),
			action: onAccept
		}, {
			label: t("workorder.reject"),
			action: () => setShowReject(true),
			variant: "outline"
		}],
		Accepted: [{
			label: t("workorder.close"),
			action: onClose
		}],
		Rejected: [],
		Closed: [],
		Cancelled: []
	};
	/** 创建按钮数组副本，防止后续 push 操作修改原始常量数组 */
	const available = [...buttons[workOrder.status] ?? []];
	// 非 terminal 状态添加取消按钮
	if (available.length === 0 && workOrder.status !== "cancelled" && workOrder.status !== "closed") {
		available.push({
			label: t("workorder.cancel"),
			action: onCancel,
			variant: "destructive"
		});
	}
	if (available.length === 0 && !showReject) return null;
	return /* @__PURE__ */ _jsxDEV(Card, { children: /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "flex flex-wrap items-center gap-3 p-4",
		children: [available.map((btn) => /* @__PURE__ */ _jsxDEV(Button, {
			variant: btn.variant ?? "default",
			onClick: btn.action,
			children: btn.label
		}, btn.label, false, {
			fileName: _jsxFileName,
			lineNumber: 429,
			columnNumber: 11
		}, this)), showReject && /* @__PURE__ */ _jsxDEV("div", {
			className: "flex w-full items-center gap-2",
			children: [
				/* @__PURE__ */ _jsxDEV(Input, {
					value: rejectReason,
					onChange: (e) => setRejectReason(e.target.value),
					placeholder: t("workorder.rejectReasonPlaceholder"),
					className: "flex-1"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 436,
					columnNumber: 13
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					size: "sm",
					disabled: !rejectReason,
					onClick: () => {
						onReject(rejectReason);
						setShowReject(false);
					},
					children: t("common.submit")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 442,
					columnNumber: 13
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => setShowReject(false),
					children: t("common.cancel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 443,
					columnNumber: 13
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 435,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 427,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 426,
		columnNumber: 5
	}, this);
}
_s2(ActionButtons, "lmdmRnxIcavmnnxd6oZfTH/MhJY=", false, function() {
	return [useTranslation];
});
_c2 = ActionButtons;
var _c, _c2;
$RefreshReg$(_c, "WorkOrderDetailPage");
$RefreshReg$(_c2, "ActionButtons");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/WorkOrderDetailPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderDetailPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderDetailPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/WorkOrderDetailPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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SyxVQUFVLENBQUM7S0FBYyxlQUFlO01BQUUsU0FBUyxZQUFZO01BQUcsY0FBYyxLQUFLO0tBQUc7ZUFBSSxFQUFFLGVBQWU7SUFBVTs7Ozs7SUFDekksd0JBQUMsUUFBRDtLQUFRLE1BQUs7S0FBSyxTQUFRO0tBQVEsZUFBZSxjQUFjLEtBQUs7ZUFBSSxFQUFFLGVBQWU7SUFBVTs7Ozs7R0FDaEc7Ozs7O1VBRUk7Ozs7O1VBQ1Q7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiV29ya09yZGVyRGV0YWlsUGFnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VQYXJhbXMsIHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgQXJyb3dMZWZ0IH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IHRvYXN0IH0gZnJvbSAnc29ubmVyJztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvYnV0dG9uJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2NhcmQnO1xuaW1wb3J0IHsgQmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2JhZGdlJztcbmltcG9ydCB7IElucHV0IH0gZnJvbSAnLi4vY29tcG9uZW50cy91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvbGFiZWwnO1xuaW1wb3J0IHsgVGV4dGFyZWEgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3RleHRhcmVhJztcbmltcG9ydCB7IERpYWxvZywgRGlhbG9nQ29udGVudCwgRGlhbG9nSGVhZGVyLCBEaWFsb2dUaXRsZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvZGlhbG9nJztcbmltcG9ydCB7IFByaW9yaXR5QmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL3dvcmtvcmRlci9Qcmlvcml0eUJhZGdlJztcbmltcG9ydCB7IFNsYUNvdW50ZG93biB9IGZyb20gJy4uL2NvbXBvbmVudHMvd29ya29yZGVyL1NsYUNvdW50ZG93bic7XG5pbXBvcnQgeyBBcHByb3ZhbFByb2dyZXNzUGFuZWwgfSBmcm9tICcuLi9jb21wb25lbnRzL3dvcmtvcmRlci9BcHByb3ZhbFByb2dyZXNzUGFuZWwnO1xuaW1wb3J0IHsgT2ZmbGluZVN5bmNQYW5lbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvd29ya29yZGVyL09mZmxpbmVTeW5jUGFuZWwnO1xuaW1wb3J0IEF0dGFjaG1lbnRVcGxvYWQgZnJvbSAnLi4vY29tcG9uZW50cy93b3Jrb3JkZXIvQXR0YWNobWVudFVwbG9hZCc7XG5pbXBvcnQgeyBPZmZsaW5lU3RhdHVzQmFkZ2UgfSBmcm9tICcuLi9jb21wb25lbnRzL3dvcmtvcmRlci9PZmZsaW5lU3RhdHVzQmFkZ2UnO1xuaW1wb3J0IHsgdXNlT2ZmbGluZVF1ZXVlIH0gZnJvbSAnLi4vaG9va3MvdXNlT2ZmbGluZVF1ZXVlJztcbmltcG9ydCB7XG4gIHVzZVdvcmtPcmRlcixcbiAgdXNlU3RhcnRXb3JrT3JkZXIsXG4gIHVzZUNvbXBsZXRlV29ya09yZGVyLFxuICB1c2VBY2NlcHRXb3JrT3JkZXIsXG4gIHVzZVJlamVjdFdvcmtPcmRlcixcbiAgdXNlQ2xvc2VXb3JrT3JkZXIsXG4gIHVzZUNhbmNlbFdvcmtPcmRlcixcbn0gZnJvbSAnLi4vaG9va3MvdXNlV29ya09yZGVycyc7XG5pbXBvcnQgeyB1c2VUZWNobmljaWFucywgdXNlQXNzaWduRnJvbVJlY29tbWVuZGF0aW9uIH0gZnJvbSAnLi4vaG9va3MvdXNlRGlzcGF0Y2gnO1xuaW1wb3J0IHtcbiAgdXNlV29ya09yZGVyQXBwcm92YWxzLFxuICB1c2VTdWJtaXRXb3JrT3JkZXIsXG59IGZyb20gJy4uL2hvb2tzL3VzZUFwcHJvdmFscyc7XG5pbXBvcnQgeyBnZXRXb3JrT3JkZXJTdGF0dXNMYWJlbHMgfSBmcm9tICcuLi91dGlscy93b3Jrb3JkZXInO1xuaW1wb3J0IHR5cGUgeyBXb3JrT3JkZXIgfSBmcm9tICcuLi90eXBlcyc7XG5cblxuXG4vKipcbiAqIOW3peWNleivpuaDhemhtVxuICpcbiAqIOWxleekuuW3peWNleWfuuacrOS/oeaBr+OAgeeKtuaAgea1gei9rOaTjeS9nOaMiemSruOAgeWFs+iBlOS/oeaBr+WSjOWuoeiuoeaXpeW/l+OAglxuICog5qC55o2u5bel5Y2V5b2T5YmN54q25oCB5Yqo5oCB5pi+56S65Y+v5omn6KGM55qE5pON5L2c5oyJ6ZKu44CCXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFdvcmtPcmRlckRldGFpbFBhZ2UoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyBpZCB9ID0gdXNlUGFyYW1zPHsgaWQ6IHN0cmluZyB9PigpO1xuICBjb25zdCBuYXZpZ2F0ZSA9IHVzZU5hdmlnYXRlKCk7XG5cbiAgLyoqIOW3peWNleeKtuaAgeWvueW6lOeahOS4reaWh+agh+etvu+8iOS9v+eUqOWFseS6q+W3peWFt+WHveaVsO+8jOWMuemFjeWQjuerryBQYXNjYWxDYXNlIOaemuS4vuW6j+WIl+WMlu+8iSAqL1xuICBjb25zdCBzdGF0dXNMYWJlbHMgPSBnZXRXb3JrT3JkZXJTdGF0dXNMYWJlbHModCk7XG4gIGNvbnN0IFtjYW5jZWxEaWFsb2dPcGVuLCBzZXRDYW5jZWxEaWFsb2dPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2NhbmNlbFJlYXNvbiwgc2V0Q2FuY2VsUmVhc29uXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Jlc29sdXRpb24sIHNldFJlc29sdXRpb25dID0gdXNlU3RhdGUoJycpO1xuICAvLyDnu7Tkv67miafooYzmiqXlkYov5L2/55So6Zu25Lu277ya5a6M5oiQ5oiW5o+Q5Lqk6aqM5pS25pe25aGr5YaZ77yM5piv55+l6K+G5rKJ5reAIEZhdWx0Q2FzZS5Tb2x1dGlvbi9QYXJ0c1VzZWQg55qE5pWw5o2u5rqQ77yI5Zue5b2SICMyNTLvvJpcbiAgLy8g5Y6f5YmN56uv5Y+q5LygIHJlc29sdXRpb27vvIzlkI7nq68gRXhlY3V0aW9uUmVwb3J0L1JlcXVpcmVkUGFydHMg5rC46L+c5Li656m6IOKGkiBTb2x1dGlvbiDmsLjov5zpmY3nuqfjgIFQYXJ0c1VzZWQg5rC46L+c56m677yJXG4gIGNvbnN0IFtleGVjdXRpb25SZXBvcnQsIHNldEV4ZWN1dGlvblJlcG9ydF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXF1aXJlZFBhcnRzLCBzZXRSZXF1aXJlZFBhcnRzXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2Rpc3BhdGNoRGlhbG9nT3Blbiwgc2V0RGlzcGF0Y2hEaWFsb2dPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3NlbGVjdGVkVGVjaG5pY2lhbiwgc2V0U2VsZWN0ZWRUZWNobmljaWFuXSA9IHVzZVN0YXRlKCcnKTtcblxuICBjb25zdCB7IGRhdGE6IHdvcmtPcmRlciwgaXNMb2FkaW5nIH0gPSB1c2VXb3JrT3JkZXIoaWQgPz8gJycpO1xuICBjb25zdCB7IGRhdGE6IGFwcHJvdmFscyB9ID0gdXNlV29ya09yZGVyQXBwcm92YWxzKGlkKTtcbiAgY29uc3Qgc3RhcnRPcmRlciA9IHVzZVN0YXJ0V29ya09yZGVyKCk7XG4gIGNvbnN0IGNvbXBsZXRlT3JkZXIgPSB1c2VDb21wbGV0ZVdvcmtPcmRlcigpO1xuICBjb25zdCBhY2NlcHRPcmRlciA9IHVzZUFjY2VwdFdvcmtPcmRlcigpO1xuICBjb25zdCByZWplY3RPcmRlciA9IHVzZVJlamVjdFdvcmtPcmRlcigpO1xuICBjb25zdCBjbG9zZU9yZGVyID0gdXNlQ2xvc2VXb3JrT3JkZXIoKTtcbiAgY29uc3QgY2FuY2VsT3JkZXIgPSB1c2VDYW5jZWxXb3JrT3JkZXIoKTtcbiAgY29uc3Qgc3VibWl0T3JkZXIgPSB1c2VTdWJtaXRXb3JrT3JkZXIoKTtcbiAgY29uc3QgeyBlbnF1ZXVlIH0gPSB1c2VPZmZsaW5lUXVldWUoKTtcbiAgY29uc3QgeyBkYXRhOiB0ZWNobmljaWFucyB9ID0gdXNlVGVjaG5pY2lhbnModHJ1ZSk7XG4gIGNvbnN0IGFzc2lnbk9yZGVyID0gdXNlQXNzaWduRnJvbVJlY29tbWVuZGF0aW9uKCk7XG5cbiAgaWYgKGlzTG9hZGluZykgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwicHktMjAgdGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5sb2FkaW5nJyl9PC9kaXY+O1xuICBpZiAoIXdvcmtPcmRlcikgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwicHktMjAgdGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5ub0RhdGEnKX08L2Rpdj47XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgey8qIOWktOmDqO+8mui/lOWbnuaMiemSriArIOagh+mimCArIOeKtuaAgS/kvJjlhYjnuqcgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0ZSgnL3dvcmstb3JkZXJzJyl9PlxuICAgICAgICAgIDxBcnJvd0xlZnQgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57d29ya09yZGVyLnRpdGxlfTwvaDE+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57d29ya09yZGVyLndvcmtPcmRlckNvZGV9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPE9mZmxpbmVTdGF0dXNCYWRnZSAvPlxuICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiPntzdGF0dXNMYWJlbHNbd29ya09yZGVyLnN0YXR1c10gPz8gd29ya09yZGVyLnN0YXR1c308L0JhZGdlPlxuICAgICAgICAgIDxQcmlvcml0eUJhZGdlIHByaW9yaXR5PXt3b3JrT3JkZXIucHJpb3JpdHl9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDln7rmnKzkv6Hmga8gKi99XG4gICAgICA8Q2FyZD5cbiAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTQgcC00IG1kOmdyaWQtY29scy00XCI+XG4gICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24udHlwZScpfTwvcD48cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt3b3JrT3JkZXIudHlwZX08L3A+PC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2NvbW1vbi5zdGF0dXMnKX08L3A+XG4gICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIj57c3RhdHVzTGFiZWxzW3dvcmtPcmRlci5zdGF0dXNdfTwvQmFkZ2U+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj48cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCd3b3Jrb3JkZXIuYXNzaWduZWRUbycpfTwvcD48cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt3b3JrT3JkZXIuYXNzaWduZWRUbyA/PyAnLSd9PC9wPjwvZGl2PlxuICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnd29ya29yZGVyLmR1ZURhdGUnKX08L3A+PGRpdiBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPjxTbGFDb3VudGRvd24gZHVlRGF0ZT17d29ya09yZGVyLmR1ZURhdGV9IGNyZWF0ZWRBdD17d29ya09yZGVyLmNyZWF0ZWRBdH0gc3RhdHVzPXt3b3JrT3JkZXIuc3RhdHVzfSBzaG93UmF3RGF0ZVdoZW5UZXJtaW5hbCAvPjwvZGl2PjwvZGl2PlxuICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmNyZWF0ZWRBdCcpfTwvcD48cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntuZXcgRGF0ZSh3b3JrT3JkZXIuY3JlYXRlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvcD48L2Rpdj5cbiAgICAgICAgICB7d29ya09yZGVyLmNvbXBsZXRlZEF0ICYmIChcbiAgICAgICAgICAgIDxkaXY+PHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnd29ya29yZGVyLmNvbXBsZXRlZEF0Jyl9PC9wPjxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e25ldyBEYXRlKHdvcmtPcmRlci5jb21wbGV0ZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX08L3A+PC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7d29ya09yZGVyLmFjdHVhbEhvdXJzICE9IG51bGwgJiYgd29ya09yZGVyLmFjdHVhbEhvdXJzID4gMCAmJiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCd3b3Jrb3JkZXIuYWN0dWFsSG91cnMnKX08L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAge3dvcmtPcmRlci5hY3R1YWxIb3VycyA8IDFcbiAgICAgICAgICAgICAgICAgID8gdCgnd29ya29yZGVyLnNsYU1pbnV0ZXMnLCB7IGNvdW50OiBNYXRoLnJvdW5kKHdvcmtPcmRlci5hY3R1YWxIb3VycyAqIDYwKSB9KVxuICAgICAgICAgICAgICAgICAgOiB0KCd3b3Jrb3JkZXIuc2xhSG91cnMnLCB7IGNvdW50OiBNYXRoLnJvdW5kKHdvcmtPcmRlci5hY3R1YWxIb3VycyAqIDEwKSAvIDEwIH0pfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuXG4gICAgICB7Lyog54q25oCB5rWB6L2s5pON5L2c5oyJ6ZKuICovfVxuICAgICAgPEFjdGlvbkJ1dHRvbnNcbiAgICAgICAgd29ya09yZGVyPXt3b3JrT3JkZXJ9XG4gICAgICAgIG9uRGlzcGF0Y2g9eygpID0+IHNldERpc3BhdGNoRGlhbG9nT3Blbih0cnVlKX1cbiAgICAgICAgb25TdGFydD17KCkgPT4gc3RhcnRPcmRlci5tdXRhdGUod29ya09yZGVyLmlkKX1cbiAgICAgICAgb25BY2NlcHQ9eygpID0+IGFjY2VwdE9yZGVyLm11dGF0ZSh3b3JrT3JkZXIuaWQpfVxuICAgICAgICBvblJlamVjdD17KHJlYXNvbikgPT4gcmVqZWN0T3JkZXIubXV0YXRlKHsgaWQ6IHdvcmtPcmRlci5pZCwgcmVhc29uIH0pfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBjbG9zZU9yZGVyLm11dGF0ZSh3b3JrT3JkZXIuaWQpfVxuICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0Q2FuY2VsRGlhbG9nT3Blbih0cnVlKX1cbiAgICAgICAgb25TdWJtaXRGb3JBcHByb3ZhbD17KCkgPT4gc3VibWl0T3JkZXIubXV0YXRlKHtcbiAgICAgICAgICBpZDogd29ya09yZGVyLmlkLFxuICAgICAgICAgIHJlc29sdXRpb24sXG4gICAgICAgICAgZXhlY3V0aW9uUmVwb3J0LFxuICAgICAgICAgIHJlcXVpcmVkUGFydHMsXG4gICAgICAgIH0pfVxuICAgICAgLz5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC02IG1kOmdyaWQtY29scy0yXCI+XG4gICAgICAgIHsvKiDlhbPogZTkv6Hmga/vvJrmoLnlm6Dmj4/ov7AgKyDop6PlhrPmjqrmlr0gKi99XG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkSGVhZGVyPjxDYXJkVGl0bGUgY2xhc3NOYW1lPVwidGV4dC1iYXNlXCI+e3QoJ3dvcmtvcmRlci5yZWxhdGVkSW5mbycpfTwvQ2FyZFRpdGxlPjwvQ2FyZEhlYWRlcj5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICB7d29ya09yZGVyLnJvb3RDYXVzZSA/IChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCd3b3Jrb3JkZXIucm9vdENhdXNlJyl9PC9wPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC1zbVwiPnt3b3JrT3JkZXIucm9vdENhdXNlfTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgIHt3b3JrT3JkZXIucmVzb2x1dGlvbiA/IChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCd3b3Jrb3JkZXIucmVzb2x1dGlvbicpfTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHRleHQtc21cIj57d29ya09yZGVyLnJlc29sdXRpb259PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAge3dvcmtPcmRlci5leGVjdXRpb25SZXBvcnQgPyAoXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnd29ya29yZGVyLmV4ZWN1dGlvblJlcG9ydCcpfTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHdoaXRlc3BhY2UtcHJlLXdyYXAgdGV4dC1zbVwiPnt3b3JrT3JkZXIuZXhlY3V0aW9uUmVwb3J0fTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgIHt3b3JrT3JkZXIucmVxdWlyZWRQYXJ0cyA/IChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCd3b3Jrb3JkZXIucmVxdWlyZWRQYXJ0cycpfTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHdoaXRlc3BhY2UtcHJlLXdyYXAgdGV4dC1zbVwiPnt3b3JrT3JkZXIucmVxdWlyZWRQYXJ0c308L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICB7IXdvcmtPcmRlci5yb290Q2F1c2UgJiYgIXdvcmtPcmRlci5yZXNvbHV0aW9uICYmICF3b3JrT3JkZXIuZXhlY3V0aW9uUmVwb3J0ICYmICF3b3JrT3JkZXIucmVxdWlyZWRQYXJ0cyAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ3dvcmtvcmRlci5ub1JlbGF0ZWRJbmZvJyl9PC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG5cbiAgICAgICAgey8qIOWuoeiuoeaXpeW/l+aXtumXtOe6vyAqL31cbiAgICAgICAgPENhcmQ+XG4gICAgICAgICAgPENhcmRIZWFkZXI+PENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj57dCgnd29ya29yZGVyLm9wZXJhdGlvblJlY29yZHMnKX08L0NhcmRUaXRsZT48L0NhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnd29ya29yZGVyLm5vT3BlcmF0aW9uUmVjb3JkcycpfTwvcD5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOaJp+ihjOS4reeKtuaAge+8muWhq+WGmeino+WGs+aOquaWveWMuuWfnyAqL31cbiAgICAgIHt3b3JrT3JkZXIuc3RhdHVzID09PSAnSW5Qcm9ncmVzcycgJiYgKFxuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPnt0KCd3b3Jrb3JkZXIuZmlsbFJlc29sdXRpb24nKX08L0NhcmRUaXRsZT48L0NhcmRIZWFkZXI+XG4gICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICA8TGFiZWw+e3QoJ3dvcmtvcmRlci5yZXNvbHV0aW9uJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPFRleHRhcmVhXG4gICAgICAgICAgICAgICAgdmFsdWU9e3Jlc29sdXRpb259XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRSZXNvbHV0aW9uKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dCgnd29ya29yZGVyLmRlc2NyaWJlUmVzb2x1dGlvbicpfVxuICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIuZXhlY3V0aW9uUmVwb3J0Jyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPFRleHRhcmVhXG4gICAgICAgICAgICAgICAgdmFsdWU9e2V4ZWN1dGlvblJlcG9ydH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEV4ZWN1dGlvblJlcG9ydChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci5leGVjdXRpb25SZXBvcnRQbGFjZWhvbGRlcicpfVxuICAgICAgICAgICAgICAgIHJvd3M9ezR9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIucmVxdWlyZWRQYXJ0cycpfTwvTGFiZWw+XG4gICAgICAgICAgICAgIDxUZXh0YXJlYVxuICAgICAgICAgICAgICAgIHZhbHVlPXtyZXF1aXJlZFBhcnRzfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0UmVxdWlyZWRQYXJ0cyhlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci5yZXF1aXJlZFBhcnRzUGxhY2Vob2xkZXInKX1cbiAgICAgICAgICAgICAgICByb3dzPXsyfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgaWYgKG5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGVPcmRlci5tdXRhdGUoeyBpZDogd29ya09yZGVyLmlkLCByZXNvbHV0aW9uLCBleGVjdXRpb25SZXBvcnQsIHJlcXVpcmVkUGFydHMgfSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBlbnF1ZXVlKFxuICAgICAgICAgICAgICAgICAgICAgICd3b3JrLW9yZGVyLWNvbXBsZXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICBgL2FwaS92MS93b3JrLW9yZGVycy8ke3dvcmtPcmRlci5pZH0vY29tcGxldGVgLFxuICAgICAgICAgICAgICAgICAgICAgICdQVVQnLFxuICAgICAgICAgICAgICAgICAgICAgIHsgaWQ6IHdvcmtPcmRlci5pZCwgcmVzb2x1dGlvbiwgZXhlY3V0aW9uUmVwb3J0LCByZXF1aXJlZFBhcnRzIH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICB0b2FzdC5lcnJvcih0KCdjb21tb24uZXJyb3InKSwge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBkaXNhYmxlZD17IXJlc29sdXRpb24gfHwgY29tcGxldGVPcmRlci5pc1BlbmRpbmd9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtuYXZpZ2F0b3Iub25MaW5lID8gdCgnd29ya29yZGVyLmNvbXBsZXRlJykgOiAn5L+d5a2Y5Yiw56a757q/6Zif5YiXJ31cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgIDwvQ2FyZD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDlvoXlrqHmibnnirbmgIHvvJrlrqHmibnov5vluqbpnaLmnb8gKi99XG4gICAgICB7d29ya09yZGVyLnN0YXR1cyA9PT0gJ1N1Ym1pdHRlZEZvckFwcHJvdmFsJyAmJiBhcHByb3ZhbHMgJiYgYXBwcm92YWxzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8Q2FyZD5cbiAgICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPuWuoeaJuei/m+W6pjwvQ2FyZFRpdGxlPjwvQ2FyZEhlYWRlcj5cbiAgICAgICAgICA8Q2FyZENvbnRlbnQ+XG4gICAgICAgICAgICA8QXBwcm92YWxQcm9ncmVzc1BhbmVsXG4gICAgICAgICAgICAgIHdvcmtPcmRlcklkPXt3b3JrT3JkZXIuaWR9XG4gICAgICAgICAgICAgIGFwcHJvdmFscz17YXBwcm92YWxzfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICA8L0NhcmQ+XG4gICAgICApfVxuXG4gICAgICB7Lyog5bel5Y2V6ZmE5Lu2ICovfVxuICAgICAge2lkICYmIChcbiAgICAgICAgPEF0dGFjaG1lbnRVcGxvYWRcbiAgICAgICAgICB3b3JrT3JkZXJJZD17aWR9XG4gICAgICAgICAgY2FuRWRpdD17d29ya09yZGVyPy5zdGF0dXMgIT09ICdDbG9zZWQnICYmIHdvcmtPcmRlcj8uc3RhdHVzICE9PSAnQ2FuY2VsbGVkJ31cbiAgICAgICAgLz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDnprvnur/lkIzmraXpnaLmnb8gKi99XG4gICAgICA8T2ZmbGluZVN5bmNQYW5lbCAvPlxuXG4gICAgICB7Lyog5rS+5bel5a+56K+d5qGGICovfVxuICAgICAgPERpYWxvZyBvcGVuPXtkaXNwYXRjaERpYWxvZ09wZW59IG9uT3BlbkNoYW5nZT17c2V0RGlzcGF0Y2hEaWFsb2dPcGVufT5cbiAgICAgICAgPERpYWxvZ0NvbnRlbnQ+XG4gICAgICAgICAgPERpYWxvZ0hlYWRlcj48RGlhbG9nVGl0bGU+e3QoJ3dvcmtvcmRlci5kaXNwYXRjaCcpfTwvRGlhbG9nVGl0bGU+PC9EaWFsb2dIZWFkZXI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgIDxMYWJlbD57dCgnd29ya29yZGVyLnNlbGVjdFRlY2huaWNpYW4nKX08L0xhYmVsPlxuICAgICAgICAgICAgICB7dGVjaG5pY2lhbnMgJiYgdGVjaG5pY2lhbnMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC1oLTYwIHNwYWNlLXktMiBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgIHt0ZWNobmljaWFucy5tYXAoKHRlY2gpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIGtleT17dGVjaC51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHJvdW5kZWQtbWQgYm9yZGVyIHAtMyB0ZXh0LWxlZnQgdHJhbnNpdGlvbi1jb2xvcnMgJHtzZWxlY3RlZFRlY2huaWNpYW4gPT09IHRlY2gudXNlcklkID8gJ2JvcmRlci1wcmltYXJ5IGJnLXByaW1hcnkvNScgOiAnaG92ZXI6YmctbXV0ZWQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRUZWNobmljaWFuKHRlY2gudXNlcklkKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt0ZWNoLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3QoJ3dvcmtvcmRlci5hY3RpdmVXb3JrQ291bnQnLCB7IGNvdW50OiB0ZWNoLmFjdGl2ZVdvcmtDb3VudCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICB7QXJyYXkuaXNBcnJheSh0ZWNoLnNraWxscykgJiYgdGVjaC5za2lsbHMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTEgZmxleCBmbGV4LXdyYXAgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3RlY2guc2tpbGxzLm1hcCgocykgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGtleT17c30gY2xhc3NOYW1lPVwicm91bmRlZCBiZy1tdXRlZCBweC0xLjUgcHktMC41IHRleHQteHNcIj57c308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJweS00IHRleHQtY2VudGVyIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ3dvcmtvcmRlci5ub1RlY2huaWNpYW5zJyl9PC9wPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IHNldERpc3BhdGNoRGlhbG9nT3BlbihmYWxzZSl9Pnt0KCdjb21tb24uY2FuY2VsJyl9PC9CdXR0b24+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXNlbGVjdGVkVGVjaG5pY2lhbiB8fCBhc3NpZ25PcmRlci5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgYXNzaWduT3JkZXIubXV0YXRlKFxuICAgICAgICAgICAgICAgICAgICB7IHdvcmtPcmRlcklkOiB3b3JrT3JkZXIuaWQsIHRlY2huaWNpYW5Vc2VySWQ6IHNlbGVjdGVkVGVjaG5pY2lhbiB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgb25TdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2FzdC5zdWNjZXNzKHQoJ3dvcmtvcmRlci5kaXNwYXRjaFN1Y2Nlc3MnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXREaXNwYXRjaERpYWxvZ09wZW4oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRUZWNobmljaWFuKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIG9uRXJyb3I6IChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvYXN0LmVycm9yKHQoJ2NvbW1vbi5lcnJvcicpLCB7IGRlc2NyaXB0aW9uOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge3QoJ3dvcmtvcmRlci5jb25maXJtRGlzcGF0Y2gnKX1cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9EaWFsb2dDb250ZW50PlxuICAgICAgPC9EaWFsb2c+XG5cbiAgICAgIHsvKiDlj5bmtojlt6XljZXlr7nor53moYYgKi99XG4gICAgICA8RGlhbG9nIG9wZW49e2NhbmNlbERpYWxvZ09wZW59IG9uT3BlbkNoYW5nZT17c2V0Q2FuY2VsRGlhbG9nT3Blbn0+XG4gICAgICAgIDxEaWFsb2dDb250ZW50PlxuICAgICAgICAgIDxEaWFsb2dIZWFkZXI+PERpYWxvZ1RpdGxlPnt0KCd3b3Jrb3JkZXIuY2FuY2VsJyl9PC9EaWFsb2dUaXRsZT48L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIuY2FuY2VsUmVhc29uJyl9PC9MYWJlbD5cbiAgICAgICAgICAgICAgPFRleHRhcmVhXG4gICAgICAgICAgICAgICAgdmFsdWU9e2NhbmNlbFJlYXNvbn1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENhbmNlbFJlYXNvbihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci5lbnRlckNhbmNlbFJlYXNvbicpfVxuICAgICAgICAgICAgICAgIHJvd3M9ezN9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWVuZCBnYXAtMlwiPlxuICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgb25DbGljaz17KCkgPT4gc2V0Q2FuY2VsRGlhbG9nT3BlbihmYWxzZSl9Pnt0KCdjb21tb24uY2FuY2VsJyl9PC9CdXR0b24+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICB2YXJpYW50PVwiZGVzdHJ1Y3RpdmVcIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2FuY2VsUmVhc29ufVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNhbmNlbE9yZGVyLm11dGF0ZSh7IGlkOiB3b3JrT3JkZXIuaWQsIHJlYXNvbjogY2FuY2VsUmVhc29uIH0pO1xuICAgICAgICAgICAgICAgICAgc2V0Q2FuY2VsRGlhbG9nT3BlbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt0KCd3b3Jrb3JkZXIuY29uZmlybUNhbmNlbCcpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLyoqIOaTjeS9nOaMiemSrue7hOS7tuWxnuaApyAqL1xuaW50ZXJmYWNlIEFjdGlvbkJ1dHRvbnNQcm9wcyB7XG4gIC8qKiDlvZPliY3lt6XljZXmlbDmja4gKi9cbiAgd29ya09yZGVyOiBXb3JrT3JkZXI7XG4gIC8qKiDmtL7lt6Xlm57osIMgKi9cbiAgb25EaXNwYXRjaDogKCkgPT4gdm9pZDtcbiAgLyoqIOW8gOWni+aJp+ihjOWbnuiwgyAqL1xuICBvblN0YXJ0OiAoKSA9PiB2b2lkO1xuICAvKiog6aqM5pS26YCa6L+H5Zue6LCDICovXG4gIG9uQWNjZXB0OiAoKSA9PiB2b2lkO1xuICAvKiog6aqM5pS25LiN6YCa6L+H5Zue6LCD77yI6ZmE5bim5Y6f5Zug77yJICovXG4gIG9uUmVqZWN0OiAocmVhc29uOiBzdHJpbmcpID0+IHZvaWQ7XG4gIC8qKiDlhbPpl63lt6XljZXlm57osIMgKi9cbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgLyoqIOWPlua2iOW3peWNleWbnuiwgyAqL1xuICBvbkNhbmNlbDogKCkgPT4gdm9pZDtcbiAgLyoqIOaPkOS6pOmqjOaUtu+8iOWPkei1t+WuoeaJuea1geeoi++8ieWbnuiwgyAqL1xuICBvblN1Ym1pdEZvckFwcHJvdmFsOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIOW3peWNleeKtuaAgeaTjeS9nOaMiemSrue7hOS7tlxuICpcbiAqIOagueaNruW3peWNleW9k+WJjeeKtuaAgeWKqOaAgeaYvuekuuWPr+eUqOeahOaTjeS9nOaMiemSruOAglxuICog54q25oCB5rWB6L2s6KeE5YiZ77yaXG4gKiAtIHBlbmRpbmdfZGlzcGF0Y2ggLyBkaXNwYXRjaGVkIOKGkiDlvIDlp4vmiafooYwgLyDlj5bmtohcbiAqIC0gaW5fcHJvZ3Jlc3Mg4oaSIOWPlua2iO+8iOWujOaIkOaTjeS9nOWcqOeLrOeri+WMuuWfn++8iVxuICogLSBjb21wbGV0ZWQg4oaSIOmqjOaUtumAmui/hyAvIOmqjOaUtuS4jemAmui/h1xuICogLSBhY2NlcHRlZCDihpIg5YWz6ZetXG4gKi9cbmZ1bmN0aW9uIEFjdGlvbkJ1dHRvbnMoeyB3b3JrT3JkZXIsIG9uRGlzcGF0Y2gsIG9uU3RhcnQsIG9uQWNjZXB0LCBvblJlamVjdCwgb25DbG9zZSwgb25DYW5jZWwsIG9uU3VibWl0Rm9yQXBwcm92YWwgfTogQWN0aW9uQnV0dG9uc1Byb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3JlamVjdFJlYXNvbiwgc2V0UmVqZWN0UmVhc29uXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Nob3dSZWplY3QsIHNldFNob3dSZWplY3RdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8qKiDlkITnirbmgIHlr7nlupTnmoTlj6/nlKjmjInpkq7phY3nva4gKi9cbiAgY29uc3QgYnV0dG9uczogUmVjb3JkPHN0cmluZywgQXJyYXk8eyBsYWJlbDogc3RyaW5nOyBhY3Rpb246ICgpID0+IHZvaWQ7IHZhcmlhbnQ/OiAnZGVmYXVsdCcgfCAnb3V0bGluZScgfCAnZGVzdHJ1Y3RpdmUnIH0+PiA9IHtcbiAgICBQZW5kaW5nRGlzcGF0Y2g6IFt7IGxhYmVsOiB0KCd3b3Jrb3JkZXIuZGlzcGF0Y2gnKSwgYWN0aW9uOiBvbkRpc3BhdGNoIH1dLFxuICAgIEFzc2lnbmVkOiBbeyBsYWJlbDogdCgnd29ya29yZGVyLnN0YXJ0RXhlY3V0aW9uJyksIGFjdGlvbjogb25TdGFydCB9XSxcbiAgICBJblByb2dyZXNzOiBbeyBsYWJlbDogdCgnd29ya29yZGVyLnN1Ym1pdEZvckFwcHJvdmFsJyksIGFjdGlvbjogb25TdWJtaXRGb3JBcHByb3ZhbCB9XSxcbiAgICBTdWJtaXR0ZWRGb3JBcHByb3ZhbDogW10sXG4gICAgQ29tcGxldGVkOiBbXG4gICAgICB7IGxhYmVsOiB0KCd3b3Jrb3JkZXIuYWNjZXB0JyksIGFjdGlvbjogb25BY2NlcHQgfSxcbiAgICAgIHsgbGFiZWw6IHQoJ3dvcmtvcmRlci5yZWplY3QnKSwgYWN0aW9uOiAoKSA9PiBzZXRTaG93UmVqZWN0KHRydWUpLCB2YXJpYW50OiAnb3V0bGluZScgfSxcbiAgICBdLFxuICAgIEFjY2VwdGVkOiBbeyBsYWJlbDogdCgnd29ya29yZGVyLmNsb3NlJyksIGFjdGlvbjogb25DbG9zZSB9XSxcbiAgICBSZWplY3RlZDogW10sXG4gICAgQ2xvc2VkOiBbXSxcbiAgICBDYW5jZWxsZWQ6IFtdLFxuICB9O1xuXG4gIC8qKiDliJvlu7rmjInpkq7mlbDnu4Tlia/mnKzvvIzpmLLmraLlkI7nu60gcHVzaCDmk43kvZzkv67mlLnljp/lp4vluLjph4/mlbDnu4QgKi9cbiAgY29uc3QgYXZhaWxhYmxlID0gWy4uLihidXR0b25zW3dvcmtPcmRlci5zdGF0dXNdID8/IFtdKV07XG5cbiAgLy8g6Z2eIHRlcm1pbmFsIOeKtuaAgea3u+WKoOWPlua2iOaMiemSrlxuICBpZiAoYXZhaWxhYmxlLmxlbmd0aCA9PT0gMCAmJiB3b3JrT3JkZXIuc3RhdHVzICE9PSAnY2FuY2VsbGVkJyAmJiB3b3JrT3JkZXIuc3RhdHVzICE9PSAnY2xvc2VkJykge1xuICAgIGF2YWlsYWJsZS5wdXNoKHsgbGFiZWw6IHQoJ3dvcmtvcmRlci5jYW5jZWwnKSwgYWN0aW9uOiBvbkNhbmNlbCwgdmFyaWFudDogJ2Rlc3RydWN0aXZlJyB9KTtcbiAgfVxuXG4gIGlmIChhdmFpbGFibGUubGVuZ3RoID09PSAwICYmICFzaG93UmVqZWN0KSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMyBwLTRcIj5cbiAgICAgICAge2F2YWlsYWJsZS5tYXAoKGJ0bikgPT4gKFxuICAgICAgICAgIDxCdXR0b24ga2V5PXtidG4ubGFiZWx9IHZhcmlhbnQ9e2J0bi52YXJpYW50ID8/ICdkZWZhdWx0J30gb25DbGljaz17YnRuLmFjdGlvbn0+XG4gICAgICAgICAgICB7YnRuLmxhYmVsfVxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICApKX1cbiAgICAgICAgey8qIOmqjOaUtuS4jemAmui/h+WOn+WboOi+k+WFpeWMuiAqL31cbiAgICAgICAge3Nob3dSZWplY3QgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCB3LWZ1bGwgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgdmFsdWU9e3JlamVjdFJlYXNvbn1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRSZWplY3RSZWFzb24oZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dCgnd29ya29yZGVyLnJlamVjdFJlYXNvblBsYWNlaG9sZGVyJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21cIiBkaXNhYmxlZD17IXJlamVjdFJlYXNvbn0gb25DbGljaz17KCkgPT4geyBvblJlamVjdChyZWplY3RSZWFzb24pOyBzZXRTaG93UmVqZWN0KGZhbHNlKTsgfX0+e3QoJ2NvbW1vbi5zdWJtaXQnKX08L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgdmFyaWFudD1cImdob3N0XCIgb25DbGljaz17KCkgPT4gc2V0U2hvd1JlamVjdChmYWxzZSl9Pnt0KCdjb21tb24uY2FuY2VsJyl9PC9CdXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L0NhcmRDb250ZW50PlxuICAgIDwvQ2FyZD5cbiAgKTtcbn1cbiJdfQ==