import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/ApprovalProgressPanel.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"];/**
* 审批进度面板组件
*
* 以时间线形式展示工单的审批流程进度。
* 每个审批步骤以圆点+连接线形式呈现，支持当前审批人执行通过/驳回操作。
*
* 状态显示规则：
* - 已通过 → 绿色圆点 + ✓ 图标
* - 待审批（当前步骤）→ 蓝色圆点 + 通过/驳回按钮
* - 等待中（后续步骤）→ 灰色圆点
* - 已驳回 → 红色圆点 + ✗ 图标
*/
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Check, X, Clock } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Textarea } from "/src/components/ui/textarea.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { useApproveWorkOrder, useRejectApproval } from "/src/hooks/useApprovals.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/ApprovalProgressPanel.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 角色对应的中文标签映射 */
const roleLabels = {
	system_admin: "系统管理员",
	maintenance_lead: "维修主管",
	technician: "技术员",
	operator: "操作员",
	viewer: "查看者"
};
/**
* 获取审批动作对应的显示信息
*
* 根据审批状态返回圆点样式、图标和状态文本。
*/
function getStepDisplay(action, isCurrent) {
	switch (action) {
		case "Approved": return {
			dotClass: "bg-green-500 border-green-500 text-white",
			icon: /* @__PURE__ */ _jsxDEV(Check, { className: "h-3 w-3" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 48,
				columnNumber: 15
			}, this),
			statusText: "已通过",
			statusClass: "text-green-600"
		};
		case "Rejected": return {
			dotClass: "bg-red-500 border-red-500 text-white",
			icon: /* @__PURE__ */ _jsxDEV(X, { className: "h-3 w-3" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 55,
				columnNumber: 15
			}, this),
			statusText: "已驳回",
			statusClass: "text-red-600"
		};
		case "Pending":
			if (isCurrent) {
				return {
					dotClass: "bg-blue-500 border-blue-500 text-white animate-pulse",
					icon: /* @__PURE__ */ _jsxDEV(Clock, { className: "h-3 w-3" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 63,
						columnNumber: 17
					}, this),
					statusText: "待审批",
					statusClass: "text-blue-600"
				};
			}
			return {
				dotClass: "bg-muted border-muted-foreground/30 text-muted-foreground",
				icon: /* @__PURE__ */ _jsxDEV(Clock, { className: "h-3 w-3" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 70,
					columnNumber: 15
				}, this),
				statusText: "等待中",
				statusClass: "text-muted-foreground"
			};
		default: return {
			dotClass: "bg-muted border-muted-foreground/30",
			icon: null,
			statusText: "未知",
			statusClass: "text-muted-foreground"
		};
	}
}
/**
* 审批进度面板组件
*
* 以垂直时间线展示审批流程，当前步骤支持通过/驳回操作。
* 驳回时可填写驳回原因。
*/
export function ApprovalProgressPanel({ workOrderId, approvals }) {
	_s();
	const [rejectingStep, setRejectingStep] = useState(null);
	const [rejectComment, setRejectComment] = useState("");
	const [approveComment, setApproveComment] = useState("");
	const approveMutation = useApproveWorkOrder();
	const rejectMutation = useRejectApproval();
	// 找到第一个 Pending 步骤，即为当前步骤
	const currentStepOrder = approvals.find((a) => a.action === "Pending")?.stepOrder ?? -1;
	// 检查是否有步骤已被驳回，则后续步骤不再可操作
	const hasRejected = approvals.some((a) => a.action === "Rejected");
	/** 处理审批通过 */
	const handleApprove = () => {
		approveMutation.mutate({
			id: workOrderId,
			comment: approveComment || undefined
		}, { onSettled: () => setApproveComment("") });
	};
	/** 处理审批驳回 */
	const handleReject = () => {
		rejectMutation.mutate({
			id: workOrderId,
			comment: rejectComment || undefined
		}, { onSettled: () => {
			setRejectingStep(null);
			setRejectComment("");
		} });
	};
	if (approvals.length === 0) {
		return /* @__PURE__ */ _jsxDEV("p", {
			className: "text-sm text-muted-foreground",
			children: "暂无审批记录"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 127,
			columnNumber: 7
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "relative space-y-0",
		children: approvals.map((approval, index) => {
			const isCurrent = approval.stepOrder === currentStepOrder && !hasRejected;
			const display = getStepDisplay(approval.action, isCurrent);
			const isLast = index === approvals.length - 1;
			return /* @__PURE__ */ _jsxDEV("div", {
				className: "relative flex gap-4",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "flex flex-col items-center",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${display.dotClass}`,
						children: display.icon
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 145,
						columnNumber: 15
					}, this), !isLast && /* @__PURE__ */ _jsxDEV("div", { className: "w-px flex-1 bg-border" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 152,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: `flex-1 pb-6 ${isLast ? "pb-0" : ""}`,
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ _jsxDEV("span", {
									className: "text-sm font-medium",
									children: [
										"第 ",
										approval.stepOrder,
										" 级审批"
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 159,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV(Badge, {
									variant: "outline",
									className: display.statusClass,
									children: display.statusText
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 162,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("span", {
									className: "text-xs text-muted-foreground",
									children: roleLabels[approval.expectedRole] ?? approval.expectedRole
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 165,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 158,
							columnNumber: 15
						}, this),
						approval.actedAt && /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: new Date(approval.actedAt).toLocaleString()
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 172,
							columnNumber: 17
						}, this),
						approval.comment && /* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: ["意见：", approval.comment]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 177,
							columnNumber: 17
						}, this),
						isCurrent && /* @__PURE__ */ _jsxDEV("div", {
							className: "mt-3 space-y-2 rounded-md border border-blue-200 bg-blue-50/50 p-3",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ _jsxDEV("label", {
										className: "text-xs font-medium text-muted-foreground",
										children: "审批意见（可选）"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 186,
										columnNumber: 21
									}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
										value: approveComment,
										onChange: (e) => setApproveComment(e.target.value),
										placeholder: "填写审批意见...",
										rows: 2,
										className: "text-sm"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 189,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 185,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ _jsxDEV(Button, {
										size: "sm",
										onClick: handleApprove,
										disabled: approveMutation.isPending || rejectMutation.isPending,
										children: "通过"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 198,
										columnNumber: 21
									}, this), /* @__PURE__ */ _jsxDEV(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setRejectingStep(approval.stepOrder),
										disabled: approveMutation.isPending || rejectMutation.isPending,
										children: "驳回"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 205,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 197,
									columnNumber: 19
								}, this),
								rejectingStep === approval.stepOrder && /* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2 rounded-md border border-red-200 bg-red-50/50 p-3",
									children: [
										/* @__PURE__ */ _jsxDEV("label", {
											className: "text-xs font-medium text-red-600",
											children: "驳回原因"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 218,
											columnNumber: 23
										}, this),
										/* @__PURE__ */ _jsxDEV(Textarea, {
											value: rejectComment,
											onChange: (e) => setRejectComment(e.target.value),
											placeholder: "请填写驳回原因...",
											rows: 2,
											className: "text-sm"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 221,
											columnNumber: 23
										}, this),
										/* @__PURE__ */ _jsxDEV("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ _jsxDEV(Button, {
												size: "sm",
												variant: "destructive",
												onClick: () => handleReject(),
												disabled: rejectMutation.isPending,
												children: "确认驳回"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 229,
												columnNumber: 25
											}, this), /* @__PURE__ */ _jsxDEV(Button, {
												size: "sm",
												variant: "ghost",
												onClick: () => {
													setRejectingStep(null);
													setRejectComment("");
												},
												children: "取消"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 237,
												columnNumber: 25
											}, this)]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 228,
											columnNumber: 23
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 217,
									columnNumber: 21
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 184,
							columnNumber: 17
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 157,
					columnNumber: 13
				}, this)]
			}, approval.id, true, {
				fileName: _jsxFileName,
				lineNumber: 141,
				columnNumber: 11
			}, this);
		})
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 134,
		columnNumber: 5
	}, this);
}
_s(ApprovalProgressPanel, "c7GABDfQPvdBPozRQnGDnv2c6/M=", false, function() {
	return [useApproveWorkOrder, useRejectApproval];
});
_c = ApprovalProgressPanel;
var _c;
$RefreshReg$(_c, "ApprovalProgressPanel");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/ApprovalProgressPanel.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/ApprovalProgressPanel.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/ApprovalProgressPanel.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/ApprovalProgressPanel.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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TyxXQUFVO3FCQUFtQztVQUU3Qzs7Ozs7VUFDUCx3QkFBQyxVQUFEO1dBQ0UsT0FBTztXQUNQLFdBQVcsTUFBTSxpQkFBaUIsRUFBRSxPQUFPLEtBQUs7V0FDaEQsYUFBWTtXQUNaLE1BQU07V0FDTixXQUFVO1VBQ1g7Ozs7O1VBQ0Qsd0JBQUMsT0FBRDtXQUFLLFdBQVU7cUJBQWYsQ0FDRSx3QkFBQyxRQUFEO1lBQ0UsTUFBSztZQUNMLFNBQVE7WUFDUixlQUFlLGFBQWE7WUFDNUIsVUFBVSxlQUFlO3NCQUMxQjtXQUVPOzs7O3FCQUNSLHdCQUFDLFFBQUQ7WUFDRSxNQUFLO1lBQ0wsU0FBUTtZQUNSLGVBQWU7YUFDYixpQkFBaUIsSUFBSTthQUNyQixpQkFBaUIsRUFBRTtZQUNyQjtzQkFDRDtXQUVPOzs7O21CQUNMOzs7Ozs7U0FDRjs7Ozs7O09BRUo7Ozs7OztLQUVKOzs7OztZQUNGO01BaEhLLFNBQVM7Ozs7VUFnSGQ7RUFFVCxDQUFDO0NBQ0U7Ozs7O0FBRVQiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXBwcm92YWxQcm9ncmVzc1BhbmVsLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOWuoeaJuei/m+W6pumdouadv+e7hOS7tlxuICpcbiAqIOS7peaXtumXtOe6v+W9ouW8j+WxleekuuW3peWNleeahOWuoeaJuea1geeoi+i/m+W6puOAglxuICog5q+P5Liq5a6h5om55q2l6aqk5Lul5ZyG54K5K+i/nuaOpee6v+W9ouW8j+WRiOeOsO+8jOaUr+aMgeW9k+WJjeWuoeaJueS6uuaJp+ihjOmAmui/hy/pqbPlm57mk43kvZzjgIJcbiAqXG4gKiDnirbmgIHmmL7npLrop4TliJnvvJpcbiAqIC0g5bey6YCa6L+HIOKGkiDnu7/oibLlnIbngrkgKyDinJMg5Zu+5qCHXG4gKiAtIOW+heWuoeaJue+8iOW9k+WJjeatpemqpO+8ieKGkiDok53oibLlnIbngrkgKyDpgJrov4cv6amz5Zue5oyJ6ZKuXG4gKiAtIOetieW+heS4re+8iOWQjue7reatpemqpO+8ieKGkiDngbDoibLlnIbngrlcbiAqIC0g5bey6amz5ZueIOKGkiDnuqLoibLlnIbngrkgKyDinJcg5Zu+5qCHXG4gKi9cbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQ2hlY2ssIFgsIENsb2NrIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBUZXh0YXJlYSB9IGZyb20gJy4uL3VpL3RleHRhcmVhJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vdWkvYmFkZ2UnO1xuaW1wb3J0IHsgdXNlQXBwcm92ZVdvcmtPcmRlciwgdXNlUmVqZWN0QXBwcm92YWwgfSBmcm9tICcuLi8uLi9ob29rcy91c2VBcHByb3ZhbHMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrT3JkZXJBcHByb3ZhbER0byB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuLyoqIOWuoeaJuei/m+W6pumdouadv+WxnuaApyAqL1xuaW50ZXJmYWNlIEFwcHJvdmFsUHJvZ3Jlc3NQYW5lbFByb3BzIHtcbiAgLyoqIOW3peWNleWUr+S4gOagh+ivhiAqL1xuICB3b3JrT3JkZXJJZDogc3RyaW5nO1xuICAvKiog5a6h5om56K6w5b2V5YiX6KGo77yI5oyJIHN0ZXBPcmRlciDmjpLluo/vvIkgKi9cbiAgYXBwcm92YWxzOiBXb3JrT3JkZXJBcHByb3ZhbER0b1tdO1xufVxuXG4vKiog6KeS6Imy5a+55bqU55qE5Lit5paH5qCH562+5pig5bCEICovXG5jb25zdCByb2xlTGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBzeXN0ZW1fYWRtaW46ICfns7vnu5/nrqHnkIblkZgnLFxuICBtYWludGVuYW5jZV9sZWFkOiAn57u05L+u5Li7566hJyxcbiAgdGVjaG5pY2lhbjogJ+aKgOacr+WRmCcsXG4gIG9wZXJhdG9yOiAn5pON5L2c5ZGYJyxcbiAgdmlld2VyOiAn5p+l55yL6ICFJyxcbn07XG5cbi8qKlxuICog6I635Y+W5a6h5om55Yqo5L2c5a+55bqU55qE5pi+56S65L+h5oGvXG4gKlxuICog5qC55o2u5a6h5om554q25oCB6L+U5Zue5ZyG54K55qC35byP44CB5Zu+5qCH5ZKM54q25oCB5paH5pys44CCXG4gKi9cbmZ1bmN0aW9uIGdldFN0ZXBEaXNwbGF5KGFjdGlvbjogc3RyaW5nLCBpc0N1cnJlbnQ6IGJvb2xlYW4pIHtcbiAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICBjYXNlICdBcHByb3ZlZCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBkb3RDbGFzczogJ2JnLWdyZWVuLTUwMCBib3JkZXItZ3JlZW4tNTAwIHRleHQtd2hpdGUnLFxuICAgICAgICBpY29uOiA8Q2hlY2sgY2xhc3NOYW1lPVwiaC0zIHctM1wiIC8+LFxuICAgICAgICBzdGF0dXNUZXh0OiAn5bey6YCa6L+HJyxcbiAgICAgICAgc3RhdHVzQ2xhc3M6ICd0ZXh0LWdyZWVuLTYwMCcsXG4gICAgICB9O1xuICAgIGNhc2UgJ1JlamVjdGVkJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRvdENsYXNzOiAnYmctcmVkLTUwMCBib3JkZXItcmVkLTUwMCB0ZXh0LXdoaXRlJyxcbiAgICAgICAgaWNvbjogPFggY2xhc3NOYW1lPVwiaC0zIHctM1wiIC8+LFxuICAgICAgICBzdGF0dXNUZXh0OiAn5bey6amz5ZueJyxcbiAgICAgICAgc3RhdHVzQ2xhc3M6ICd0ZXh0LXJlZC02MDAnLFxuICAgICAgfTtcbiAgICBjYXNlICdQZW5kaW5nJzpcbiAgICAgIGlmIChpc0N1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkb3RDbGFzczogJ2JnLWJsdWUtNTAwIGJvcmRlci1ibHVlLTUwMCB0ZXh0LXdoaXRlIGFuaW1hdGUtcHVsc2UnLFxuICAgICAgICAgIGljb246IDxDbG9jayBjbGFzc05hbWU9XCJoLTMgdy0zXCIgLz4sXG4gICAgICAgICAgc3RhdHVzVGV4dDogJ+W+heWuoeaJuScsXG4gICAgICAgICAgc3RhdHVzQ2xhc3M6ICd0ZXh0LWJsdWUtNjAwJyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRvdENsYXNzOiAnYmctbXV0ZWQgYm9yZGVyLW11dGVkLWZvcmVncm91bmQvMzAgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kJyxcbiAgICAgICAgaWNvbjogPENsb2NrIGNsYXNzTmFtZT1cImgtMyB3LTNcIiAvPixcbiAgICAgICAgc3RhdHVzVGV4dDogJ+etieW+heS4rScsXG4gICAgICAgIHN0YXR1c0NsYXNzOiAndGV4dC1tdXRlZC1mb3JlZ3JvdW5kJyxcbiAgICAgIH07XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRvdENsYXNzOiAnYmctbXV0ZWQgYm9yZGVyLW11dGVkLWZvcmVncm91bmQvMzAnLFxuICAgICAgICBpY29uOiBudWxsLFxuICAgICAgICBzdGF0dXNUZXh0OiAn5pyq55+lJyxcbiAgICAgICAgc3RhdHVzQ2xhc3M6ICd0ZXh0LW11dGVkLWZvcmVncm91bmQnLFxuICAgICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIOWuoeaJuei/m+W6pumdouadv+e7hOS7tlxuICpcbiAqIOS7peWeguebtOaXtumXtOe6v+WxleekuuWuoeaJuea1geeoi++8jOW9k+WJjeatpemqpOaUr+aMgemAmui/hy/pqbPlm57mk43kvZzjgIJcbiAqIOmps+WbnuaXtuWPr+Whq+WGmemps+WbnuWOn+WboOOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gQXBwcm92YWxQcm9ncmVzc1BhbmVsKHsgd29ya09yZGVySWQsIGFwcHJvdmFscyB9OiBBcHByb3ZhbFByb2dyZXNzUGFuZWxQcm9wcykge1xuICBjb25zdCBbcmVqZWN0aW5nU3RlcCwgc2V0UmVqZWN0aW5nU3RlcF0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3JlamVjdENvbW1lbnQsIHNldFJlamVjdENvbW1lbnRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbYXBwcm92ZUNvbW1lbnQsIHNldEFwcHJvdmVDb21tZW50XSA9IHVzZVN0YXRlKCcnKTtcblxuICBjb25zdCBhcHByb3ZlTXV0YXRpb24gPSB1c2VBcHByb3ZlV29ya09yZGVyKCk7XG4gIGNvbnN0IHJlamVjdE11dGF0aW9uID0gdXNlUmVqZWN0QXBwcm92YWwoKTtcblxuICAvLyDmib7liLDnrKzkuIDkuKogUGVuZGluZyDmraXpqqTvvIzljbPkuLrlvZPliY3mraXpqqRcbiAgY29uc3QgY3VycmVudFN0ZXBPcmRlciA9IGFwcHJvdmFscy5maW5kKChhKSA9PiBhLmFjdGlvbiA9PT0gJ1BlbmRpbmcnKT8uc3RlcE9yZGVyID8/IC0xO1xuXG4gIC8vIOajgOafpeaYr+WQpuacieatpemqpOW3suiiq+mps+Wbnu+8jOWImeWQjue7reatpemqpOS4jeWGjeWPr+aTjeS9nFxuICBjb25zdCBoYXNSZWplY3RlZCA9IGFwcHJvdmFscy5zb21lKChhKSA9PiBhLmFjdGlvbiA9PT0gJ1JlamVjdGVkJyk7XG5cbiAgLyoqIOWkhOeQhuWuoeaJuemAmui/hyAqL1xuICBjb25zdCBoYW5kbGVBcHByb3ZlID0gKCkgPT4ge1xuICAgIGFwcHJvdmVNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7IGlkOiB3b3JrT3JkZXJJZCwgY29tbWVudDogYXBwcm92ZUNvbW1lbnQgfHwgdW5kZWZpbmVkIH0sXG4gICAgICB7IG9uU2V0dGxlZDogKCkgPT4gc2V0QXBwcm92ZUNvbW1lbnQoJycpIH0sXG4gICAgKTtcbiAgfTtcblxuICAvKiog5aSE55CG5a6h5om56amz5ZueICovXG4gIGNvbnN0IGhhbmRsZVJlamVjdCA9ICgpID0+IHtcbiAgICByZWplY3RNdXRhdGlvbi5tdXRhdGUoXG4gICAgICB7IGlkOiB3b3JrT3JkZXJJZCwgY29tbWVudDogcmVqZWN0Q29tbWVudCB8fCB1bmRlZmluZWQgfSxcbiAgICAgIHtcbiAgICAgICAgb25TZXR0bGVkOiAoKSA9PiB7XG4gICAgICAgICAgc2V0UmVqZWN0aW5nU3RlcChudWxsKTtcbiAgICAgICAgICBzZXRSZWplY3RDb21tZW50KCcnKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcbiAgfTtcblxuICBpZiAoYXBwcm92YWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICDmmoLml6DlrqHmibnorrDlvZVcbiAgICAgIDwvcD5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHNwYWNlLXktMFwiPlxuICAgICAge2FwcHJvdmFscy5tYXAoKGFwcHJvdmFsLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBpc0N1cnJlbnQgPSBhcHByb3ZhbC5zdGVwT3JkZXIgPT09IGN1cnJlbnRTdGVwT3JkZXIgJiYgIWhhc1JlamVjdGVkO1xuICAgICAgICBjb25zdCBkaXNwbGF5ID0gZ2V0U3RlcERpc3BsYXkoYXBwcm92YWwuYWN0aW9uLCBpc0N1cnJlbnQpO1xuICAgICAgICBjb25zdCBpc0xhc3QgPSBpbmRleCA9PT0gYXBwcm92YWxzLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8ZGl2IGtleT17YXBwcm92YWwuaWR9IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXggZ2FwLTRcIj5cbiAgICAgICAgICAgIHsvKiDlt6bkvqfml7bpl7Tnur8gKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgIHsvKiDlnIbngrnoioLngrkgKi99XG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGgtNyB3LTcgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtZnVsbCBib3JkZXItMiAke2Rpc3BsYXkuZG90Q2xhc3N9YH1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtkaXNwbGF5Lmljb259XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7Lyog6L+e5o6l57q/ICovfVxuICAgICAgICAgICAgICB7IWlzTGFzdCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LXB4IGZsZXgtMSBiZy1ib3JkZXJcIiAvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiDlj7PkvqflhoXlrrnljLogKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXgtMSBwYi02ICR7aXNMYXN0ID8gJ3BiLTAnIDogJyd9YH0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAgICDnrKwge2FwcHJvdmFsLnN0ZXBPcmRlcn0g57qn5a6h5om5XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiIGNsYXNzTmFtZT17ZGlzcGxheS5zdGF0dXNDbGFzc30+XG4gICAgICAgICAgICAgICAgICB7ZGlzcGxheS5zdGF0dXNUZXh0fVxuICAgICAgICAgICAgICAgIDwvQmFkZ2U+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgIHtyb2xlTGFiZWxzW2FwcHJvdmFsLmV4cGVjdGVkUm9sZV0gPz8gYXBwcm92YWwuZXhwZWN0ZWRSb2xlfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIOWuoeaJueaXtumXtOWSjOaEj+ingSAqL31cbiAgICAgICAgICAgICAge2FwcHJvdmFsLmFjdGVkQXQgJiYgKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgIHtuZXcgRGF0ZShhcHByb3ZhbC5hY3RlZEF0KS50b0xvY2FsZVN0cmluZygpfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2FwcHJvdmFsLmNvbW1lbnQgJiYgKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgIOaEj+inge+8mnthcHByb3ZhbC5jb21tZW50fVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7Lyog5b2T5YmN5b6F5a6h5om55q2l6aqk77ya5pi+56S66YCa6L+HL+mps+WbnuaTjeS9nCAqL31cbiAgICAgICAgICAgICAge2lzQ3VycmVudCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC0zIHNwYWNlLXktMiByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItYmx1ZS0yMDAgYmctYmx1ZS01MC81MCBwLTNcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgIOWuoeaJueaEj+inge+8iOWPr+mAie+8iVxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8VGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17YXBwcm92ZUNvbW1lbnR9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRBcHByb3ZlQ29tbWVudChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLloavlhpnlrqHmibnmhI/op4EuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbVwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQXBwcm92ZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17YXBwcm92ZU11dGF0aW9uLmlzUGVuZGluZyB8fCByZWplY3RNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICDpgJrov4dcbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJvdXRsaW5lXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRSZWplY3RpbmdTdGVwKGFwcHJvdmFsLnN0ZXBPcmRlcil9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2FwcHJvdmVNdXRhdGlvbi5pc1BlbmRpbmcgfHwgcmVqZWN0TXV0YXRpb24uaXNQZW5kaW5nfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAg6amz5ZueXG4gICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiDpqbPlm57ljp/lm6DovpPlhaXljLogKi99XG4gICAgICAgICAgICAgICAgICB7cmVqZWN0aW5nU3RlcCA9PT0gYXBwcm92YWwuc3RlcE9yZGVyICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTIgcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXJlZC0yMDAgYmctcmVkLTUwLzUwIHAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtcmVkLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAg6amz5Zue5Y6f5ZugXG4gICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICA8VGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtyZWplY3RDb21tZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRSZWplY3RDb21tZW50KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi6K+35aGr5YaZ6amz5Zue5Y6f5ZugLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwiZGVzdHJ1Y3RpdmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVSZWplY3QoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3JlamVjdE11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAg56Gu6K6k6amz5ZueXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT1cInNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlamVjdGluZ1N0ZXAobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVqZWN0Q29tbWVudCgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIOWPlua2iFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgfSl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXX0=