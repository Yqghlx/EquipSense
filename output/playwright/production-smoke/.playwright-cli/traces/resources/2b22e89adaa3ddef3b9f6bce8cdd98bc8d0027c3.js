import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/ApprovalChainSettings.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport13_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/src/components/ui/dialog.tsx";
import { Switch } from "/src/components/ui/switch.tsx";
import { useApprovalChains, useCreateApprovalChain, useUpdateApprovalChain, useDeleteApprovalChain } from "/src/hooks/useApprovals.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/ApprovalChainSettings.tsx";
import __vite__cjsImport13_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 审批链配置面板
*
* 展示审批链模板列表，支持新增、删除模板，展开查看步骤详情。
* 审批链模板定义了不同工单类型/优先级的审批流程步骤。
*/
export function ApprovalChainSettings() {
	_s();
	const { t } = useTranslation();
	const { data: chains, isLoading } = useApprovalChains();
	const createMutation = useCreateApprovalChain();
	const updateMutation = useUpdateApprovalChain();
	const deleteMutation = useDeleteApprovalChain();
	const [expandedId, setExpandedId] = useState(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	// 编辑状态：非 null 表示编辑模式
	const [editingChainId, setEditingChainId] = useState(null);
	// 表单状态
	const [formName, setFormName] = useState("");
	const [formWorkOrderType, setFormWorkOrderType] = useState("");
	const [formPriority, setFormPriority] = useState("");
	const [formIsDefault, setFormIsDefault] = useState(false);
	const [formSteps, setFormSteps] = useState([{
		stepOrder: 1,
		role: "maintenance_lead",
		specificApproverId: "",
		isRequired: true
	}]);
	/** 工单类型对应的中文标签 */
	const typeLabels = {
		"": "通用",
		Corrective: "纠正性",
		Preventive: "预防性",
		Inspection: "巡检"
	};
	/** 优先级对应的中文标签 */
	const priorityLabels = {
		"": "通用",
		Urgent: "紧急",
		High: "高",
		Medium: "中",
		Low: "低"
	};
	/** 角色对应的中文标签 */
	const roleLabels = {
		system_admin: "系统管理员",
		maintenance_lead: "维修主管",
		technician: "技术员",
		operator: "操作员",
		viewer: "查看者"
	};
	/** 重置表单 */
	const resetForm = () => {
		setFormName("");
		setFormWorkOrderType("");
		setFormPriority("");
		setFormIsDefault(false);
		setFormSteps([{
			stepOrder: 1,
			role: "maintenance_lead",
			specificApproverId: "",
			isRequired: true
		}]);
		setEditingChainId(null);
	};
	/** 打开新建对话框 */
	const openCreate = () => {
		resetForm();
		setDialogOpen(true);
	};
	/** 打开编辑对话框 */
	const openEdit = (chain) => {
		setEditingChainId(chain.id);
		setFormName(chain.name);
		setFormWorkOrderType(chain.workOrderType ?? "");
		setFormPriority(chain.priority ?? "");
		setFormIsDefault(chain.isDefault);
		setFormSteps(chain.steps.length > 0 ? chain.steps.map((s) => ({
			stepOrder: s.stepOrder,
			role: s.role,
			specificApproverId: s.specificApproverId ?? "",
			isRequired: s.isRequired
		})) : [{
			stepOrder: 1,
			role: "maintenance_lead",
			specificApproverId: "",
			isRequired: true
		}]);
		setDialogOpen(true);
	};
	/** 提交表单（创建或更新） */
	const handleSubmit = () => {
		if (!formName.trim()) return;
		const payload = {
			name: formName,
			workOrderType: formWorkOrderType || undefined,
			priority: formPriority || undefined,
			isDefault: formIsDefault,
			steps: formSteps.map((s, i) => ({
				stepOrder: i + 1,
				role: s.role,
				specificApproverId: s.specificApproverId || undefined,
				isRequired: s.isRequired
			}))
		};
		if (editingChainId) {
			updateMutation.mutate({
				id: editingChainId,
				...payload
			}, { onSuccess: () => {
				setDialogOpen(false);
				resetForm();
			} });
		} else {
			createMutation.mutate(payload, { onSuccess: () => {
				setDialogOpen(false);
				resetForm();
			} });
		}
	};
	/** 新增审批步骤 */
	const addStep = () => {
		setFormSteps((prev) => [...prev, {
			stepOrder: prev.length + 1,
			role: "maintenance_lead",
			specificApproverId: "",
			isRequired: true
		}]);
	};
	/** 删除审批步骤 */
	const removeStep = (index) => {
		setFormSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({
			...s,
			stepOrder: i + 1
		})));
	};
	/** 更新审批步骤 */
	const updateStep = (index, field, value) => {
		setFormSteps((prev) => prev.map((s, i) => i === index ? {
			...s,
			[field]: value
		} : s));
	};
	if (isLoading) {
		return /* @__PURE__ */ _jsxDEV("p", {
			className: "py-8 text-center text-muted-foreground",
			children: t("common.loading")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 158,
			columnNumber: 12
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV(Card, { children: [
		/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: "审批链配置" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 166,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: "配置不同工单类型和优先级的审批流程步骤" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 167,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 165,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				size: "sm",
				onClick: openCreate,
				children: [/* @__PURE__ */ _jsxDEV(Plus, { className: "mr-1 h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 170,
					columnNumber: 13
				}, this), "新增模板"]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 169,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 164,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 163,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(CardContent, { children: chains && chains.length > 0 ? /* @__PURE__ */ _jsxDEV("div", {
			className: "space-y-3",
			children: chains.map((chain) => /* @__PURE__ */ _jsxDEV("div", {
				className: "rounded-lg border",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50",
					onClick: () => setExpandedId(expandedId === chain.id ? null : chain.id),
					children: [
						expandedId === chain.id ? /* @__PURE__ */ _jsxDEV(ChevronDown, { className: "h-4 w-4 text-muted-foreground" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 186,
							columnNumber: 21
						}, this) : /* @__PURE__ */ _jsxDEV(ChevronRight, { className: "h-4 w-4 text-muted-foreground" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 188,
							columnNumber: 21
						}, this),
						/* @__PURE__ */ _jsxDEV("span", {
							className: "font-medium",
							children: chain.name
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 190,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ _jsxDEV(Badge, {
							variant: "outline",
							children: typeLabels[chain.workOrderType ?? ""] ?? chain.workOrderType ?? "通用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 191,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ _jsxDEV(Badge, {
							variant: "outline",
							children: priorityLabels[chain.priority ?? ""] ?? chain.priority ?? "通用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 194,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ _jsxDEV(Badge, {
							variant: "outline",
							children: [chain.steps.length, " 步"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 197,
							columnNumber: 19
						}, this),
						chain.isDefault && /* @__PURE__ */ _jsxDEV(Badge, {
							className: "bg-blue-500/10 text-blue-500",
							children: "默认"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 198,
							columnNumber: 39
						}, this),
						/* @__PURE__ */ _jsxDEV(Badge, {
							variant: chain.enabled ? "outline" : "secondary",
							children: chain.enabled ? "已启用" : "已禁用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 199,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							size: "icon",
							variant: "ghost",
							className: "ml-auto h-8 w-8",
							onClick: (e) => {
								e.stopPropagation();
								openEdit(chain);
							},
							children: /* @__PURE__ */ _jsxDEV(Pencil, { className: "h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 208,
								columnNumber: 21
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 202,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							size: "icon",
							variant: "ghost",
							className: "h-8 w-8 text-destructive hover:text-destructive",
							onClick: (e) => {
								e.stopPropagation();
								deleteMutation.mutate(chain.id);
							},
							children: /* @__PURE__ */ _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 219,
								columnNumber: 21
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 210,
							columnNumber: 19
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 181,
					columnNumber: 17
				}, this), expandedId === chain.id && /* @__PURE__ */ _jsxDEV("div", {
					className: "border-t px-6 py-3",
					children: /* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
						/* @__PURE__ */ _jsxDEV(TableHead, { children: "步骤顺序" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 229,
							columnNumber: 27
						}, this),
						/* @__PURE__ */ _jsxDEV(TableHead, { children: "审批角色" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 230,
							columnNumber: 27
						}, this),
						/* @__PURE__ */ _jsxDEV(TableHead, { children: "指定审批人" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 231,
							columnNumber: 27
						}, this),
						/* @__PURE__ */ _jsxDEV(TableHead, { children: "是否必填" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 232,
							columnNumber: 27
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 228,
						columnNumber: 25
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 227,
						columnNumber: 23
					}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: chain.steps.map((step) => /* @__PURE__ */ _jsxDEV(TableRow, { children: [
						/* @__PURE__ */ _jsxDEV(TableCell, { children: step.stepOrder }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 238,
							columnNumber: 29
						}, this),
						/* @__PURE__ */ _jsxDEV(TableCell, { children: roleLabels[step.role] ?? step.role }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 239,
							columnNumber: 29
						}, this),
						/* @__PURE__ */ _jsxDEV(TableCell, { children: step.specificApproverId ?? "-" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 240,
							columnNumber: 29
						}, this),
						/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
							variant: step.isRequired ? "outline" : "secondary",
							children: step.isRequired ? "必填" : "可选"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 242,
							columnNumber: 31
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 241,
							columnNumber: 29
						}, this)
					] }, step.id, true, {
						fileName: _jsxFileName,
						lineNumber: 237,
						columnNumber: 27
					}, this)) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 235,
						columnNumber: 23
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 226,
						columnNumber: 21
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 225,
					columnNumber: 19
				}, this)]
			}, chain.id, true, {
				fileName: _jsxFileName,
				lineNumber: 179,
				columnNumber: 15
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 177,
			columnNumber: 11
		}, this) : /* @__PURE__ */ _jsxDEV("p", {
			className: "text-center text-muted-foreground",
			children: t("settings.noApprovalChain", "暂无审批链模板，点击\"新增模板\"创建第一个审批流程")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 256,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 175,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(Dialog, {
			open: dialogOpen,
			onOpenChange: (v) => {
				if (!v) {
					setDialogOpen(false);
					resetForm();
				} else {
					setDialogOpen(true);
				}
			},
			children: /* @__PURE__ */ _jsxDEV(DialogContent, {
				className: "max-w-lg",
				children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: /* @__PURE__ */ _jsxDEV(DialogTitle, { children: editingChainId ? "编辑审批链模板" : "新增审批链模板" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 266,
					columnNumber: 13
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 265,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ _jsxDEV(Label, { children: "模板名称 *" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 270,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Input, {
								value: formName,
								onChange: (e) => setFormName(e.target.value),
								placeholder: t("settings.approvalChainNamePlaceholder", "例如：高优先级工单审批流程")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 271,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 269,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "适用工单类型" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 279,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									value: formWorkOrderType,
									onChange: (e) => setFormWorkOrderType(e.target.value),
									placeholder: t("settings.leaveBlankForAll", "留空表示通用")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 280,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 278,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "适用优先级" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 287,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Input, {
									value: formPriority,
									onChange: (e) => setFormPriority(e.target.value),
									placeholder: t("settings.leaveBlankForAll", "留空表示通用")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 288,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 286,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 277,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ _jsxDEV(Switch, {
								checked: formIsDefault,
								onCheckedChange: setFormIsDefault
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 296,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Label, { children: "设为默认模板" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 300,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 295,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 303,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ _jsxDEV("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ _jsxDEV(Label, { children: "审批步骤" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 308,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(Button, {
									size: "sm",
									variant: "outline",
									onClick: addStep,
									children: [/* @__PURE__ */ _jsxDEV(Plus, { className: "mr-1 h-3 w-3" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 310,
										columnNumber: 19
									}, this), "添加步骤"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 309,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 307,
								columnNumber: 15
							}, this), formSteps.map((step, index) => /* @__PURE__ */ _jsxDEV("div", {
								className: "flex items-center gap-2 rounded-md border p-2",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "w-6 text-center text-sm font-medium text-muted-foreground",
										children: index + 1
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 316,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV(Input, {
										value: step.role,
										onChange: (e) => updateStep(index, "role", e.target.value),
										placeholder: t("settings.roleLabel", "角色"),
										className: "flex-1"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 319,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV(Input, {
										value: step.specificApproverId,
										onChange: (e) => updateStep(index, "specificApproverId", e.target.value),
										placeholder: t("settings.approverId", "指定审批人 ID"),
										className: "flex-1"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 325,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV(Button, {
										size: "icon",
										variant: "ghost",
										className: "h-8 w-8 text-destructive",
										onClick: () => removeStep(index),
										disabled: formSteps.length <= 1,
										children: /* @__PURE__ */ _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 338,
											columnNumber: 21
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 331,
										columnNumber: 19
									}, this)
								]
							}, index, true, {
								fileName: _jsxFileName,
								lineNumber: 315,
								columnNumber: 17
							}, this))]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 306,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex justify-end gap-2 pt-2",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								variant: "outline",
								onClick: () => {
									setDialogOpen(false);
									resetForm();
								},
								children: "取消"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 345,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								onClick: handleSubmit,
								disabled: !formName.trim() || createMutation.isPending || updateMutation.isPending,
								children: createMutation.isPending || updateMutation.isPending ? "保存中..." : editingChainId ? "保存修改" : "创建"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 348,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 344,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 268,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 264,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 263,
			columnNumber: 7
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 162,
		columnNumber: 5
	}, this);
}
_s(ApprovalChainSettings, "iZSoySIUgE1WEKn1PKdxMfD9vqY=", false, function() {
	return [
		useTranslation,
		useApprovalChains,
		useCreateApprovalChain,
		useUpdateApprovalChain,
		useDeleteApprovalChain
	];
});
_c = ApprovalChainSettings;
var _c;
$RefreshReg$(_c, "ApprovalChainSettings");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/ApprovalChainSettings.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/ApprovalChainSettings.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/ApprovalChainSettings.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/ApprovalChainSettings.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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O1FBQUc7a0JBQUc7T0FFekU7Ozs7aUJBQ1Isd0JBQUMsUUFBRDtRQUNFLFNBQVM7UUFDVCxVQUFVLENBQUMsU0FBUyxLQUFLLEtBQUssZUFBZSxhQUFhLGVBQWU7a0JBRXZFLGVBQWUsYUFBYSxlQUFlLFlBQWEsV0FBWSxpQkFBaUIsU0FBUztPQUMxRjs7OztlQUNMOzs7Ozs7S0FDRjs7Ozs7WUFDUTs7Ozs7O0VBQ1Q7Ozs7O0NBQ0o7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXBwcm92YWxDaGFpblNldHRpbmdzLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBQbHVzLCBUcmFzaDIsIENoZXZyb25Eb3duLCBDaGV2cm9uUmlnaHQsIFBlbmNpbCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyBDYXJkLCBDYXJkQ29udGVudCwgQ2FyZEhlYWRlciwgQ2FyZFRpdGxlLCBDYXJkRGVzY3JpcHRpb24gfSBmcm9tICcuLi91aS9jYXJkJztcbmltcG9ydCB7IFRhYmxlLCBUYWJsZUJvZHksIFRhYmxlQ2VsbCwgVGFibGVIZWFkLCBUYWJsZUhlYWRlciwgVGFibGVSb3cgfSBmcm9tICcuLi91aS90YWJsZSc7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vdWkvbGFiZWwnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vdWkvYnV0dG9uJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vdWkvYmFkZ2UnO1xuaW1wb3J0IHsgU2VwYXJhdG9yIH0gZnJvbSAnLi4vdWkvc2VwYXJhdG9yJztcbmltcG9ydCB7IERpYWxvZywgRGlhbG9nQ29udGVudCwgRGlhbG9nSGVhZGVyLCBEaWFsb2dUaXRsZSB9IGZyb20gJy4uL3VpL2RpYWxvZyc7XG5pbXBvcnQgeyBTd2l0Y2ggfSBmcm9tICcuLi91aS9zd2l0Y2gnO1xuaW1wb3J0IHtcbiAgdXNlQXBwcm92YWxDaGFpbnMsXG4gIHVzZUNyZWF0ZUFwcHJvdmFsQ2hhaW4sXG4gIHVzZVVwZGF0ZUFwcHJvdmFsQ2hhaW4sXG4gIHVzZURlbGV0ZUFwcHJvdmFsQ2hhaW4sXG59IGZyb20gJy4uLy4uL2hvb2tzL3VzZUFwcHJvdmFscyc7XG5pbXBvcnQgdHlwZSB7IEFwcHJvdmFsQ2hhaW5UZW1wbGF0ZSB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuLyoqXG4gKiDlrqHmibnpk77phY3nva7pnaLmnb9cbiAqXG4gKiDlsZXnpLrlrqHmibnpk77mqKHmnb/liJfooajvvIzmlK/mjIHmlrDlop7jgIHliKDpmaTmqKHmnb/vvIzlsZXlvIDmn6XnnIvmraXpqqTor6bmg4XjgIJcbiAqIOWuoeaJuemTvuaooeadv+WumuS5ieS6huS4jeWQjOW3peWNleexu+Weiy/kvJjlhYjnuqfnmoTlrqHmibnmtYHnqIvmraXpqqTjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEFwcHJvdmFsQ2hhaW5TZXR0aW5ncygpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGRhdGE6IGNoYWlucywgaXNMb2FkaW5nIH0gPSB1c2VBcHByb3ZhbENoYWlucygpO1xuICBjb25zdCBjcmVhdGVNdXRhdGlvbiA9IHVzZUNyZWF0ZUFwcHJvdmFsQ2hhaW4oKTtcbiAgY29uc3QgdXBkYXRlTXV0YXRpb24gPSB1c2VVcGRhdGVBcHByb3ZhbENoYWluKCk7XG4gIGNvbnN0IGRlbGV0ZU11dGF0aW9uID0gdXNlRGVsZXRlQXBwcm92YWxDaGFpbigpO1xuICBjb25zdCBbZXhwYW5kZWRJZCwgc2V0RXhwYW5kZWRJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2RpYWxvZ09wZW4sIHNldERpYWxvZ09wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIOe8lui+keeKtuaAge+8mumdniBudWxsIOihqOekuue8lui+keaooeW8j1xuICBjb25zdCBbZWRpdGluZ0NoYWluSWQsIHNldEVkaXRpbmdDaGFpbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIC8vIOihqOWNleeKtuaAgVxuICBjb25zdCBbZm9ybU5hbWUsIHNldEZvcm1OYW1lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2Zvcm1Xb3JrT3JkZXJUeXBlLCBzZXRGb3JtV29ya09yZGVyVHlwZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtmb3JtUHJpb3JpdHksIHNldEZvcm1Qcmlvcml0eV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtmb3JtSXNEZWZhdWx0LCBzZXRGb3JtSXNEZWZhdWx0XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2Zvcm1TdGVwcywgc2V0Rm9ybVN0ZXBzXSA9IHVzZVN0YXRlKFtcbiAgICB7IHN0ZXBPcmRlcjogMSwgcm9sZTogJ21haW50ZW5hbmNlX2xlYWQnLCBzcGVjaWZpY0FwcHJvdmVySWQ6ICcnLCBpc1JlcXVpcmVkOiB0cnVlIH0sXG4gIF0pO1xuXG4gIC8qKiDlt6XljZXnsbvlnovlr7nlupTnmoTkuK3mlofmoIfnrb4gKi9cbiAgY29uc3QgdHlwZUxhYmVsczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAnJzogJ+mAmueUqCcsXG4gICAgQ29ycmVjdGl2ZTogJ+e6oOato+aApycsXG4gICAgUHJldmVudGl2ZTogJ+mihOmYsuaApycsXG4gICAgSW5zcGVjdGlvbjogJ+W3oeajgCcsXG4gIH07XG5cbiAgLyoqIOS8mOWFiOe6p+WvueW6lOeahOS4reaWh+agh+etviAqL1xuICBjb25zdCBwcmlvcml0eUxhYmVsczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAnJzogJ+mAmueUqCcsXG4gICAgVXJnZW50OiAn57Sn5oClJyxcbiAgICBIaWdoOiAn6auYJyxcbiAgICBNZWRpdW06ICfkuK0nLFxuICAgIExvdzogJ+S9jicsXG4gIH07XG5cbiAgLyoqIOinkuiJsuWvueW6lOeahOS4reaWh+agh+etviAqL1xuICBjb25zdCByb2xlTGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgIHN5c3RlbV9hZG1pbjogJ+ezu+e7n+euoeeQhuWRmCcsXG4gICAgbWFpbnRlbmFuY2VfbGVhZDogJ+e7tOS/ruS4u+euoScsXG4gICAgdGVjaG5pY2lhbjogJ+aKgOacr+WRmCcsXG4gICAgb3BlcmF0b3I6ICfmk43kvZzlkZgnLFxuICAgIHZpZXdlcjogJ+afpeeci+iAhScsXG4gIH07XG5cbiAgLyoqIOmHjee9ruihqOWNlSAqL1xuICBjb25zdCByZXNldEZvcm0gPSAoKSA9PiB7XG4gICAgc2V0Rm9ybU5hbWUoJycpO1xuICAgIHNldEZvcm1Xb3JrT3JkZXJUeXBlKCcnKTtcbiAgICBzZXRGb3JtUHJpb3JpdHkoJycpO1xuICAgIHNldEZvcm1Jc0RlZmF1bHQoZmFsc2UpO1xuICAgIHNldEZvcm1TdGVwcyhbeyBzdGVwT3JkZXI6IDEsIHJvbGU6ICdtYWludGVuYW5jZV9sZWFkJywgc3BlY2lmaWNBcHByb3ZlcklkOiAnJywgaXNSZXF1aXJlZDogdHJ1ZSB9XSk7XG4gICAgc2V0RWRpdGluZ0NoYWluSWQobnVsbCk7XG4gIH07XG5cbiAgLyoqIOaJk+W8gOaWsOW7uuWvueivneahhiAqL1xuICBjb25zdCBvcGVuQ3JlYXRlID0gKCkgPT4ge1xuICAgIHJlc2V0Rm9ybSgpO1xuICAgIHNldERpYWxvZ09wZW4odHJ1ZSk7XG4gIH07XG5cbiAgLyoqIOaJk+W8gOe8lui+keWvueivneahhiAqL1xuICBjb25zdCBvcGVuRWRpdCA9IChjaGFpbjogQXBwcm92YWxDaGFpblRlbXBsYXRlKSA9PiB7XG4gICAgc2V0RWRpdGluZ0NoYWluSWQoY2hhaW4uaWQpO1xuICAgIHNldEZvcm1OYW1lKGNoYWluLm5hbWUpO1xuICAgIHNldEZvcm1Xb3JrT3JkZXJUeXBlKGNoYWluLndvcmtPcmRlclR5cGUgPz8gJycpO1xuICAgIHNldEZvcm1Qcmlvcml0eShjaGFpbi5wcmlvcml0eSA/PyAnJyk7XG4gICAgc2V0Rm9ybUlzRGVmYXVsdChjaGFpbi5pc0RlZmF1bHQpO1xuICAgIHNldEZvcm1TdGVwcyhcbiAgICAgIGNoYWluLnN0ZXBzLmxlbmd0aCA+IDBcbiAgICAgICAgPyBjaGFpbi5zdGVwcy5tYXAoKHMpID0+ICh7XG4gICAgICAgICAgICBzdGVwT3JkZXI6IHMuc3RlcE9yZGVyLFxuICAgICAgICAgICAgcm9sZTogcy5yb2xlLFxuICAgICAgICAgICAgc3BlY2lmaWNBcHByb3ZlcklkOiBzLnNwZWNpZmljQXBwcm92ZXJJZCA/PyAnJyxcbiAgICAgICAgICAgIGlzUmVxdWlyZWQ6IHMuaXNSZXF1aXJlZCxcbiAgICAgICAgICB9KSlcbiAgICAgICAgOiBbeyBzdGVwT3JkZXI6IDEsIHJvbGU6ICdtYWludGVuYW5jZV9sZWFkJywgc3BlY2lmaWNBcHByb3ZlcklkOiAnJywgaXNSZXF1aXJlZDogdHJ1ZSB9XSxcbiAgICApO1xuICAgIHNldERpYWxvZ09wZW4odHJ1ZSk7XG4gIH07XG5cbiAgLyoqIOaPkOS6pOihqOWNle+8iOWIm+W7uuaIluabtOaWsO+8iSAqL1xuICBjb25zdCBoYW5kbGVTdWJtaXQgPSAoKSA9PiB7XG4gICAgaWYgKCFmb3JtTmFtZS50cmltKCkpIHJldHVybjtcbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgbmFtZTogZm9ybU5hbWUsXG4gICAgICB3b3JrT3JkZXJUeXBlOiBmb3JtV29ya09yZGVyVHlwZSB8fCB1bmRlZmluZWQsXG4gICAgICBwcmlvcml0eTogZm9ybVByaW9yaXR5IHx8IHVuZGVmaW5lZCxcbiAgICAgIGlzRGVmYXVsdDogZm9ybUlzRGVmYXVsdCxcbiAgICAgIHN0ZXBzOiBmb3JtU3RlcHMubWFwKChzLCBpKSA9PiAoe1xuICAgICAgICBzdGVwT3JkZXI6IGkgKyAxLFxuICAgICAgICByb2xlOiBzLnJvbGUsXG4gICAgICAgIHNwZWNpZmljQXBwcm92ZXJJZDogcy5zcGVjaWZpY0FwcHJvdmVySWQgfHwgdW5kZWZpbmVkLFxuICAgICAgICBpc1JlcXVpcmVkOiBzLmlzUmVxdWlyZWQsXG4gICAgICB9KSksXG4gICAgfTtcblxuICAgIGlmIChlZGl0aW5nQ2hhaW5JZCkge1xuICAgICAgdXBkYXRlTXV0YXRpb24ubXV0YXRlKHsgaWQ6IGVkaXRpbmdDaGFpbklkLCAuLi5wYXlsb2FkIH0sIHtcbiAgICAgICAgb25TdWNjZXNzOiAoKSA9PiB7IHNldERpYWxvZ09wZW4oZmFsc2UpOyByZXNldEZvcm0oKTsgfSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjcmVhdGVNdXRhdGlvbi5tdXRhdGUocGF5bG9hZCwge1xuICAgICAgICBvblN1Y2Nlc3M6ICgpID0+IHsgc2V0RGlhbG9nT3BlbihmYWxzZSk7IHJlc2V0Rm9ybSgpOyB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDmlrDlop7lrqHmibnmraXpqqQgKi9cbiAgY29uc3QgYWRkU3RlcCA9ICgpID0+IHtcbiAgICBzZXRGb3JtU3RlcHMoKHByZXYpID0+IFtcbiAgICAgIC4uLnByZXYsXG4gICAgICB7IHN0ZXBPcmRlcjogcHJldi5sZW5ndGggKyAxLCByb2xlOiAnbWFpbnRlbmFuY2VfbGVhZCcsIHNwZWNpZmljQXBwcm92ZXJJZDogJycsIGlzUmVxdWlyZWQ6IHRydWUgfSxcbiAgICBdKTtcbiAgfTtcblxuICAvKiog5Yig6Zmk5a6h5om55q2l6aqkICovXG4gIGNvbnN0IHJlbW92ZVN0ZXAgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgIHNldEZvcm1TdGVwcygocHJldikgPT4gcHJldi5maWx0ZXIoKF8sIGkpID0+IGkgIT09IGluZGV4KS5tYXAoKHMsIGkpID0+ICh7IC4uLnMsIHN0ZXBPcmRlcjogaSArIDEgfSkpKTtcbiAgfTtcblxuICAvKiog5pu05paw5a6h5om55q2l6aqkICovXG4gIGNvbnN0IHVwZGF0ZVN0ZXAgPSAoaW5kZXg6IG51bWJlciwgZmllbGQ6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4pID0+IHtcbiAgICBzZXRGb3JtU3RlcHMoKHByZXYpID0+XG4gICAgICBwcmV2Lm1hcCgocywgaSkgPT4gKGkgPT09IGluZGV4ID8geyAuLi5zLCBbZmllbGRdOiB2YWx1ZSB9IDogcykpLFxuICAgICk7XG4gIH07XG5cbiAgaWYgKGlzTG9hZGluZykge1xuICAgIHJldHVybiA8cCBjbGFzc05hbWU9XCJweS04IHRleHQtY2VudGVyIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZGluZycpfTwvcD47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxDYXJkVGl0bGU+5a6h5om56ZO+6YWN572uPC9DYXJkVGl0bGU+XG4gICAgICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPumFjee9ruS4jeWQjOW3peWNleexu+Wei+WSjOS8mOWFiOe6p+eahOWuoeaJuea1geeoi+atpemqpDwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgb25DbGljaz17b3BlbkNyZWF0ZX0+XG4gICAgICAgICAgICA8UGx1cyBjbGFzc05hbWU9XCJtci0xIGgtNCB3LTRcIiAvPlxuICAgICAgICAgICAg5paw5aKe5qih5p2/XG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICB7Y2hhaW5zICYmIGNoYWlucy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICB7Y2hhaW5zLm1hcCgoY2hhaW46IEFwcHJvdmFsQ2hhaW5UZW1wbGF0ZSkgPT4gKFxuICAgICAgICAgICAgICA8ZGl2IGtleT17Y2hhaW4uaWR9IGNsYXNzTmFtZT1cInJvdW5kZWQtbGcgYm9yZGVyXCI+XG4gICAgICAgICAgICAgICAgey8qIOaooeadv+WktOmDqOihjCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGN1cnNvci1wb2ludGVyIGl0ZW1zLWNlbnRlciBnYXAtMyBwLTMgaG92ZXI6YmctbXV0ZWQvNTBcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWRJZChleHBhbmRlZElkID09PSBjaGFpbi5pZCA/IG51bGwgOiBjaGFpbi5pZCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2V4cGFuZGVkSWQgPT09IGNoYWluLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LW11dGVkLWZvcmVncm91bmRcIiAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiIC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57Y2hhaW4ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIj5cbiAgICAgICAgICAgICAgICAgICAge3R5cGVMYWJlbHNbY2hhaW4ud29ya09yZGVyVHlwZSA/PyAnJ10gPz8gY2hhaW4ud29ya09yZGVyVHlwZSA/PyAn6YCa55SoJ31cbiAgICAgICAgICAgICAgICAgIDwvQmFkZ2U+XG4gICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIj5cbiAgICAgICAgICAgICAgICAgICAge3ByaW9yaXR5TGFiZWxzW2NoYWluLnByaW9yaXR5ID8/ICcnXSA/PyBjaGFpbi5wcmlvcml0eSA/PyAn6YCa55SoJ31cbiAgICAgICAgICAgICAgICAgIDwvQmFkZ2U+XG4gICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIj57Y2hhaW4uc3RlcHMubGVuZ3RofSDmraU8L0JhZGdlPlxuICAgICAgICAgICAgICAgICAge2NoYWluLmlzRGVmYXVsdCAmJiA8QmFkZ2UgY2xhc3NOYW1lPVwiYmctYmx1ZS01MDAvMTAgdGV4dC1ibHVlLTUwMFwiPum7mOiupDwvQmFkZ2U+fVxuICAgICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9e2NoYWluLmVuYWJsZWQgPyAnb3V0bGluZScgOiAnc2Vjb25kYXJ5J30+XG4gICAgICAgICAgICAgICAgICAgIHtjaGFpbi5lbmFibGVkID8gJ+W3suWQr+eUqCcgOiAn5bey56aB55SoJ31cbiAgICAgICAgICAgICAgICAgIDwvQmFkZ2U+XG4gICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHNpemU9XCJpY29uXCJcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibWwtYXV0byBoLTggdy04XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHsgZS5zdG9wUHJvcGFnYXRpb24oKTsgb3BlbkVkaXQoY2hhaW4pOyB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8UGVuY2lsIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHNpemU9XCJpY29uXCJcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWRlc3RydWN0aXZlIGhvdmVyOnRleHQtZGVzdHJ1Y3RpdmVcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgZGVsZXRlTXV0YXRpb24ubXV0YXRlKGNoYWluLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIOWxleW8gOatpemqpOivpuaDhSAqL31cbiAgICAgICAgICAgICAgICB7ZXhwYW5kZWRJZCA9PT0gY2hhaW4uaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3JkZXItdCBweC02IHB5LTNcIj5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD7mraXpqqTpobrluo88L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD7lrqHmibnop5LoibI8L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD7mjIflrprlrqHmibnkuro8L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD7mmK/lkKblv4Xloas8L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAge2NoYWluLnN0ZXBzLm1hcCgoc3RlcCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVSb3cga2V5PXtzdGVwLmlkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPntzdGVwLnN0ZXBPcmRlcn08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPntyb2xlTGFiZWxzW3N0ZXAucm9sZV0gPz8gc3RlcC5yb2xlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e3N0ZXAuc3BlY2lmaWNBcHByb3ZlcklkID8/ICctJ308L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9e3N0ZXAuaXNSZXF1aXJlZCA/ICdvdXRsaW5lJyA6ICdzZWNvbmRhcnknfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3N0ZXAuaXNSZXF1aXJlZCA/ICflv4XloasnIDogJ+WPr+mAiSd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvVGFibGU+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAge3QoJ3NldHRpbmdzLm5vQXBwcm92YWxDaGFpbicsICfmmoLml6DlrqHmibnpk77mqKHmnb/vvIzngrnlh7tcIuaWsOWinuaooeadv1wi5Yib5bu656ys5LiA5Liq5a6h5om55rWB56iLJyl9XG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuICAgICAgPC9DYXJkQ29udGVudD5cblxuICAgICAgey8qIOaWsOW7ui/nvJbovpHlrqHmibnpk77mqKHmnb/lr7nor53moYYgKi99XG4gICAgICA8RGlhbG9nIG9wZW49e2RpYWxvZ09wZW59IG9uT3BlbkNoYW5nZT17KHYpID0+IHsgaWYgKCF2KSB7IHNldERpYWxvZ09wZW4oZmFsc2UpOyByZXNldEZvcm0oKTsgfSBlbHNlIHsgc2V0RGlhbG9nT3Blbih0cnVlKTsgfSB9fT5cbiAgICAgICAgPERpYWxvZ0NvbnRlbnQgY2xhc3NOYW1lPVwibWF4LXctbGdcIj5cbiAgICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgICAgPERpYWxvZ1RpdGxlPntlZGl0aW5nQ2hhaW5JZCA/ICfnvJbovpHlrqHmibnpk77mqKHmnb8nIDogJ+aWsOWinuWuoeaJuemTvuaooeadvyd9PC9EaWFsb2dUaXRsZT5cbiAgICAgICAgICA8L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgPExhYmVsPuaooeadv+WQjeensCAqPC9MYWJlbD5cbiAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1OYW1lfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybU5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwic2V0dGluZ3MuYXBwcm92YWxDaGFpbk5hbWVQbGFjZWhvbGRlclwiLCBcIuS+i+Wmgu+8mumrmOS8mOWFiOe6p+W3peWNleWuoeaJuea1geeoi1wiKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICAgICAgPExhYmVsPumAgueUqOW3peWNleexu+WeizwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybVdvcmtPcmRlclR5cGV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1Xb3JrT3JkZXJUeXBlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwic2V0dGluZ3MubGVhdmVCbGFua0ZvckFsbFwiLCBcIueVmeepuuihqOekuumAmueUqFwiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWw+6YCC55So5LyY5YWI57qnPC9MYWJlbD5cbiAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtUHJpb3JpdHl9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1Qcmlvcml0eShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcInNldHRpbmdzLmxlYXZlQmxhbmtGb3JBbGxcIiwgXCLnlZnnqbrooajnpLrpgJrnlKhcIil9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPFN3aXRjaFxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2Zvcm1Jc0RlZmF1bHR9XG4gICAgICAgICAgICAgICAgb25DaGVja2VkQ2hhbmdlPXtzZXRGb3JtSXNEZWZhdWx0fVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8TGFiZWw+6K6+5Li66buY6K6k5qih5p2/PC9MYWJlbD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8U2VwYXJhdG9yIC8+XG5cbiAgICAgICAgICAgIHsvKiDlrqHmibnmraXpqqTphY3nva4gKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD7lrqHmibnmraXpqqQ8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXthZGRTdGVwfT5cbiAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cIm1yLTEgaC0zIHctM1wiIC8+XG4gICAgICAgICAgICAgICAgICDmt7vliqDmraXpqqRcbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHtmb3JtU3RlcHMubWFwKChzdGVwLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpbmRleH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC1tZCBib3JkZXIgcC0yXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTYgdGV4dC1jZW50ZXIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgICAge2luZGV4ICsgMX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c3RlcC5yb2xlfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHVwZGF0ZVN0ZXAoaW5kZXgsICdyb2xlJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcInNldHRpbmdzLnJvbGVMYWJlbFwiLCBcIuinkuiJslwiKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3N0ZXAuc3BlY2lmaWNBcHByb3ZlcklkfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHVwZGF0ZVN0ZXAoaW5kZXgsICdzcGVjaWZpY0FwcHJvdmVySWQnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwic2V0dGluZ3MuYXBwcm92ZXJJZFwiLCBcIuaMh+WumuWuoeaJueS6uiBJRFwiKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHNpemU9XCJpY29uXCJcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWRlc3RydWN0aXZlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVtb3ZlU3RlcChpbmRleCl9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtmb3JtU3RlcHMubGVuZ3RoIDw9IDF9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kIGdhcC0yIHB0LTJcIj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IHsgc2V0RGlhbG9nT3BlbihmYWxzZSk7IHJlc2V0Rm9ybSgpOyB9fT5cbiAgICAgICAgICAgICAgICDlj5bmtohcbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdWJtaXR9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFmb3JtTmFtZS50cmltKCkgfHwgY3JlYXRlTXV0YXRpb24uaXNQZW5kaW5nIHx8IHVwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHsoY3JlYXRlTXV0YXRpb24uaXNQZW5kaW5nIHx8IHVwZGF0ZU11dGF0aW9uLmlzUGVuZGluZykgPyAn5L+d5a2Y5LitLi4uJyA6IChlZGl0aW5nQ2hhaW5JZCA/ICfkv53lrZjkv67mlLknIDogJ+WIm+W7uicpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=