import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/DeviceListPage.tsx");const useState = __vite__cjsImport0_react["useState"]; const useRef = __vite__cjsImport0_react["useRef"];const _jsxDEV = __vite__cjsImport15_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport15_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Plus, Search, Pencil, Trash2, Eye, Upload, Download, RefreshCw, AlertTriangle } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Card, CardContent } from "/src/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/src/components/ui/dialog.tsx";
import { DeviceStatusBadge } from "/src/components/device/DeviceStatusBadge.tsx";
import { DeviceForm } from "/src/components/device/DeviceForm.tsx";
import DeviceImportPreviewDialog from "/src/components/device/DeviceImportPreviewDialog.tsx";
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice, exportDevicesCsv } from "/src/hooks/useDevices.ts";
import { usePermission } from "/src/hooks/usePermission.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceListPage.tsx";
import __vite__cjsImport15_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 设备列表页
*
* 功能：搜索、按状态过滤、分页浏览、新建/编辑/删除设备。
* 点击行或查看按钮可跳转到设备详情页。
*/
export default function DeviceListPage() {
	_s();
	const { t } = useTranslation();
	const perm = usePermission("device");
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState("");
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState();
	const [importOpen, setImportOpen] = useState(false);
	const [importFile, setImportFile] = useState(null);
	const fileInputRef = useRef(null);
	const { data, isLoading, isError, refetch } = useDevices({
		page,
		pageSize: 20,
		status: status || undefined
	});
	const createDevice = useCreateDevice();
	const updateDevice = useUpdateDevice();
	const deleteDevice = useDeleteDevice();
	/** 提交设备表单（新建或编辑） */
	const handleSubmit = async (req) => {
		if (editingDevice) {
			await updateDevice.mutateAsync({
				...req,
				id: editingDevice.id
			});
		} else {
			await createDevice.mutateAsync(req);
		}
		setDialogOpen(false);
		setEditingDevice(undefined);
	};
	/** 删除设备（需用户确认） */
	const handleDelete = async (id) => {
		if (window.confirm(t("common.confirm") + "?")) {
			await deleteDevice.mutateAsync(id);
		}
	};
	/** 根据搜索关键字在客户端过滤设备列表 */
	const filteredDevices = data?.items.filter((d) => !search || d.name.includes(search) || d.deviceCode.includes(search)) ?? [];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-2xl font-bold",
					children: t("device.title")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 69,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-2",
					children: [
						perm.canCreate && /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV("input", {
							ref: fileInputRef,
							type: "file",
							accept: ".csv,.json",
							className: "hidden",
							onChange: (e) => {
								const f = e.target.files?.[0];
								if (f) {
									setImportFile(f);
									setImportOpen(true);
								}
								e.target.value = "";
							}
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 73,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => fileInputRef.current?.click(),
							children: [/* @__PURE__ */ _jsxDEV(Upload, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 85,
								columnNumber: 17
							}, this), t("device.import", "导入")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 72,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => exportDevicesCsv({ status: status || undefined }),
							title: t("common.exportTip", "最多导出 10000 条"),
							children: [/* @__PURE__ */ _jsxDEV(Download, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 95,
								columnNumber: 13
							}, this), t("common.export", "导出")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 89,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							onClick: () => {
								setEditingDevice(undefined);
								setDialogOpen(true);
							},
							disabled: !perm.canCreate,
							children: [/* @__PURE__ */ _jsxDEV(Plus, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 98,
								columnNumber: 13
							}, this), t("common.create")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 97,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 70,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ _jsxDEV(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 106,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(Input, {
						className: "pl-9",
						placeholder: t("common.search") + "...",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 107,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 105,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Select, {
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
							lineNumber: 115,
							columnNumber: 43
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 115,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "all",
							children: t("common.all")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 117,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Online",
							children: t("device.online")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 118,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Offline",
							children: t("device.offline")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 119,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(SelectItem, {
							value: "Maintenance",
							children: t("device.maintenance")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 120,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 116,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 114,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 104,
				columnNumber: 7
			}, this),
			isLoading ? /* @__PURE__ */ _jsxDEV("div", {
				className: "py-20 text-center text-muted-foreground",
				children: t("common.loading")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 127,
				columnNumber: 9
			}, this) : isError && !data ? /* @__PURE__ */ _jsxDEV(
				Card,
				/* 错误态：首屏加载失败时显式提示并可重试，避免把网络错误误显示为"暂无设备" */
				{ children: /* @__PURE__ */ _jsxDEV(CardContent, {
					className: "flex flex-col items-center gap-3 py-16 text-center",
					children: [
						/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-8 w-8 text-amber-500" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 132,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("common.loadFailed")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 133,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => refetch(),
							children: [/* @__PURE__ */ _jsxDEV(RefreshCw, { className: "mr-2 h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 135,
								columnNumber: 15
							}, this), t("common.retry")]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 134,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 131,
					columnNumber: 11
				}, this) },
				void 0,
				false,
				{
					fileName: _jsxFileName,
					lineNumber: 130,
					columnNumber: 9
				},
				this
			) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("device.deviceCode") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 145,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("device.name") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 146,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("device.type") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 147,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 148,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("device.model") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 149,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.actions") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 150,
					columnNumber: 17
				}, this)
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 144,
				columnNumber: 15
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 143,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: filteredDevices.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
				colSpan: 6,
				className: "text-center text-muted-foreground",
				children: t("common.noData")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 156,
				columnNumber: 19
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 155,
				columnNumber: 17
			}, this) : filteredDevices.map((device) => /* @__PURE__ */ _jsxDEV(TableRow, {
				className: "cursor-pointer",
				onClick: () => navigate(`/devices/${device.id}`),
				children: [
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "font-mono text-sm",
						children: device.deviceCode
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 163,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: device.name }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 164,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: device.type }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 165,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 166,
						columnNumber: 32
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 166,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "text-sm text-muted-foreground",
						children: device.model ?? "-"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 167,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV("div", {
						className: "flex gap-1",
						onClick: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => navigate(`/devices/${device.id}`),
								children: /* @__PURE__ */ _jsxDEV(Eye, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 174,
									columnNumber: 27
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 173,
								columnNumber: 25
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => {
									setEditingDevice(device);
									setDialogOpen(true);
								},
								disabled: !perm.canEdit,
								children: /* @__PURE__ */ _jsxDEV(Pencil, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 177,
									columnNumber: 27
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 176,
								columnNumber: 25
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => handleDelete(device.id),
								disabled: !perm.canDelete,
								children: /* @__PURE__ */ _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 180,
									columnNumber: 27
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 179,
								columnNumber: 25
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 172,
						columnNumber: 23
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 170,
						columnNumber: 21
					}, this)
				]
			}, device.id, true, {
				fileName: _jsxFileName,
				lineNumber: 162,
				columnNumber: 19
			}, this)) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 153,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 142,
				columnNumber: 11
			}, this), data && data.total > 20 && /* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ _jsxDEV("span", { children: t("common.totalItems", { count: data.total }) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 193,
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
						lineNumber: 195,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						size: "sm",
						disabled: page * 20 >= data.total,
						onClick: () => setPage(page + 1),
						children: t("common.next")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 196,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 194,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 192,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 141,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(Dialog, {
				open: dialogOpen,
				onOpenChange: setDialogOpen,
				children: /* @__PURE__ */ _jsxDEV(DialogContent, { children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: /* @__PURE__ */ _jsxDEV(DialogTitle, { children: editingDevice ? t("common.edit") : t("common.create") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 207,
					columnNumber: 13
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 206,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DeviceForm, {
					device: editingDevice,
					onSubmit: handleSubmit,
					onCancel: () => {
						setDialogOpen(false);
						setEditingDevice(undefined);
					},
					loading: createDevice.isPending || updateDevice.isPending
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 209,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 205,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 204,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(DeviceImportPreviewDialog, {
				open: importOpen,
				onClose: () => {
					setImportOpen(false);
					setImportFile(null);
				},
				file: importFile
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 219,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 66,
		columnNumber: 5
	}, this);
}
_s(DeviceListPage, "rTZFKfJ6m14IwEhZzw5u0dcYyXk=", false, function() {
	return [
		useTranslation,
		usePermission,
		useNavigate,
		useDevices,
		useCreateDevice,
		useUpdateDevice,
		useDeleteDevice
	];
});
_c = DeviceListPage;
var _c;
$RefreshReg$(_c, "DeviceListPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/DeviceListPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceListPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceListPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/pages/DeviceListPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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Ozs7VUFzQlosQ0FDWCxFQUVNOzs7O1dBQ047Ozs7YUFHTixRQUFRLEtBQUssUUFBUSxNQUNwQix3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUFmLENBQ0Usd0JBQUMsUUFBRCxZQUFPLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxLQUFLLE1BQU0sQ0FBQyxFQUFROzs7O2NBQzNELHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQWYsQ0FDRSx3QkFBQyxRQUFEO01BQVEsU0FBUTtNQUFVLE1BQUs7TUFBSyxVQUFVLFFBQVE7TUFBRyxlQUFlLFFBQVEsT0FBTyxDQUFDO2dCQUFJLEVBQUUsaUJBQWlCO0tBQVU7Ozs7ZUFDekgsd0JBQUMsUUFBRDtNQUFRLFNBQVE7TUFBVSxNQUFLO01BQUssVUFBVSxPQUFPLE1BQU0sS0FBSztNQUFPLGVBQWUsUUFBUSxPQUFPLENBQUM7Z0JBQUksRUFBRSxhQUFhO0tBQVU7Ozs7YUFDaEk7Ozs7O1lBQ0Y7Ozs7O1dBRVA7Ozs7O0dBSUosd0JBQUMsUUFBRDtJQUFRLE1BQU07SUFBWSxjQUFjO2NBQ3RDLHdCQUFDLGVBQUQsYUFDRSx3QkFBQyxjQUFELFlBQ0Usd0JBQUMsYUFBRCxZQUFjLGdCQUFnQixFQUFFLGFBQWEsSUFBSSxFQUFFLGVBQWUsRUFBZTs7OzthQUNyRTs7OztjQUNkLHdCQUFDLFlBQUQ7S0FDRSxRQUFRO0tBQ1IsVUFBVTtLQUNWLGdCQUFnQjtNQUFFLGNBQWMsS0FBSztNQUFHLGlCQUFpQixTQUFTO0tBQUc7S0FDckUsU0FBUyxhQUFhLGFBQWEsYUFBYTtJQUNqRDs7OztZQUNZOzs7OztHQUNUOzs7OztHQUdSLHdCQUFDLDJCQUFEO0lBQ0UsTUFBTTtJQUNOLGVBQWU7S0FBRSxjQUFjLEtBQUs7S0FBRyxjQUFjLElBQUk7SUFBRztJQUM1RCxNQUFNO0dBQ1A7Ozs7O0VBQ0U7Ozs7OztBQUVUIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRldmljZUxpc3RQYWdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VTdGF0ZSwgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBQbHVzLCBTZWFyY2gsIFBlbmNpbCwgVHJhc2gyLCBFeWUsIFVwbG9hZCwgRG93bmxvYWQsIFJlZnJlc2hDdywgQWxlcnRUcmlhbmdsZSB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvaW5wdXQnO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL2NhcmQnO1xuaW1wb3J0IHsgU2VsZWN0LCBTZWxlY3RDb250ZW50LCBTZWxlY3RJdGVtLCBTZWxlY3RUcmlnZ2VyLCBTZWxlY3RWYWx1ZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvc2VsZWN0JztcbmltcG9ydCB7IFRhYmxlLCBUYWJsZUJvZHksIFRhYmxlQ2VsbCwgVGFibGVIZWFkLCBUYWJsZUhlYWRlciwgVGFibGVSb3cgfSBmcm9tICcuLi9jb21wb25lbnRzL3VpL3RhYmxlJztcbmltcG9ydCB7IERpYWxvZywgRGlhbG9nQ29udGVudCwgRGlhbG9nSGVhZGVyLCBEaWFsb2dUaXRsZSB9IGZyb20gJy4uL2NvbXBvbmVudHMvdWkvZGlhbG9nJztcbmltcG9ydCB7IERldmljZVN0YXR1c0JhZGdlIH0gZnJvbSAnLi4vY29tcG9uZW50cy9kZXZpY2UvRGV2aWNlU3RhdHVzQmFkZ2UnO1xuaW1wb3J0IHsgRGV2aWNlRm9ybSB9IGZyb20gJy4uL2NvbXBvbmVudHMvZGV2aWNlL0RldmljZUZvcm0nO1xuaW1wb3J0IERldmljZUltcG9ydFByZXZpZXdEaWFsb2cgZnJvbSAnLi4vY29tcG9uZW50cy9kZXZpY2UvRGV2aWNlSW1wb3J0UHJldmlld0RpYWxvZyc7XG5pbXBvcnQgeyB1c2VEZXZpY2VzLCB1c2VDcmVhdGVEZXZpY2UsIHVzZVVwZGF0ZURldmljZSwgdXNlRGVsZXRlRGV2aWNlLCBleHBvcnREZXZpY2VzQ3N2IH0gZnJvbSAnLi4vaG9va3MvdXNlRGV2aWNlcyc7XG5pbXBvcnQgeyB1c2VQZXJtaXNzaW9uIH0gZnJvbSAnLi4vaG9va3MvdXNlUGVybWlzc2lvbic7XG5pbXBvcnQgdHlwZSB7IENyZWF0ZURldmljZVJlcXVlc3QsIERldmljZSB9IGZyb20gJy4uL3R5cGVzJztcblxuLyoqXG4gKiDorr7lpIfliJfooajpobVcbiAqXG4gKiDlip/og73vvJrmkJzntKLjgIHmjInnirbmgIHov4fmu6TjgIHliIbpobXmtY/op4jjgIHmlrDlu7ov57yW6L6RL+WIoOmZpOiuvuWkh+OAglxuICog54K55Ye76KGM5oiW5p+l55yL5oyJ6ZKu5Y+v6Lez6L2s5Yiw6K6+5aSH6K+m5oOF6aG144CCXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERldmljZUxpc3RQYWdlKCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHBlcm0gPSB1c2VQZXJtaXNzaW9uKCdkZXZpY2UnKTtcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xuICBjb25zdCBbcGFnZSwgc2V0UGFnZV0gPSB1c2VTdGF0ZSgxKTtcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbc2VhcmNoLCBzZXRTZWFyY2hdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGlhbG9nT3Blbiwgc2V0RGlhbG9nT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtlZGl0aW5nRGV2aWNlLCBzZXRFZGl0aW5nRGV2aWNlXSA9IHVzZVN0YXRlPERldmljZSB8IHVuZGVmaW5lZD4oKTtcbiAgY29uc3QgW2ltcG9ydE9wZW4sIHNldEltcG9ydE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaW1wb3J0RmlsZSwgc2V0SW1wb3J0RmlsZV0gPSB1c2VTdGF0ZTxGaWxlIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IGZpbGVJbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcblxuICBjb25zdCB7IGRhdGEsIGlzTG9hZGluZywgaXNFcnJvciwgcmVmZXRjaCB9ID0gdXNlRGV2aWNlcyh7IHBhZ2UsIHBhZ2VTaXplOiAyMCwgc3RhdHVzOiBzdGF0dXMgfHwgdW5kZWZpbmVkIH0pO1xuICBjb25zdCBjcmVhdGVEZXZpY2UgPSB1c2VDcmVhdGVEZXZpY2UoKTtcbiAgY29uc3QgdXBkYXRlRGV2aWNlID0gdXNlVXBkYXRlRGV2aWNlKCk7XG4gIGNvbnN0IGRlbGV0ZURldmljZSA9IHVzZURlbGV0ZURldmljZSgpO1xuXG4gIC8qKiDmj5DkuqTorr7lpIfooajljZXvvIjmlrDlu7rmiJbnvJbovpHvvIkgKi9cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gYXN5bmMgKHJlcTogQ3JlYXRlRGV2aWNlUmVxdWVzdCkgPT4ge1xuICAgIGlmIChlZGl0aW5nRGV2aWNlKSB7XG4gICAgICBhd2FpdCB1cGRhdGVEZXZpY2UubXV0YXRlQXN5bmMoeyAuLi5yZXEsIGlkOiBlZGl0aW5nRGV2aWNlLmlkIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBjcmVhdGVEZXZpY2UubXV0YXRlQXN5bmMocmVxKTtcbiAgICB9XG4gICAgc2V0RGlhbG9nT3BlbihmYWxzZSk7XG4gICAgc2V0RWRpdGluZ0RldmljZSh1bmRlZmluZWQpO1xuICB9O1xuXG4gIC8qKiDliKDpmaTorr7lpIfvvIjpnIDnlKjmiLfnoa7orqTvvIkgKi9cbiAgY29uc3QgaGFuZGxlRGVsZXRlID0gYXN5bmMgKGlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAod2luZG93LmNvbmZpcm0odCgnY29tbW9uLmNvbmZpcm0nKSArICc/JykpIHtcbiAgICAgIGF3YWl0IGRlbGV0ZURldmljZS5tdXRhdGVBc3luYyhpZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDmoLnmja7mkJzntKLlhbPplK7lrZflnKjlrqLmiLfnq6/ov4fmu6Torr7lpIfliJfooaggKi9cbiAgY29uc3QgZmlsdGVyZWREZXZpY2VzID0gZGF0YT8uaXRlbXMuZmlsdGVyKFxuICAgIChkKSA9PiAhc2VhcmNoIHx8IGQubmFtZS5pbmNsdWRlcyhzZWFyY2gpIHx8IGQuZGV2aWNlQ29kZS5pbmNsdWRlcyhzZWFyY2gpLFxuICApID8/IFtdO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgIHsvKiDpobXlpLTvvJrmoIfpopggKyDmk43kvZzmjInpkq4gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkXCI+e3QoJ2RldmljZS50aXRsZScpfTwvaDE+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICB7cGVybS5jYW5DcmVhdGUgJiYgKFxuICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgcmVmPXtmaWxlSW5wdXRSZWZ9XG4gICAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgIGFjY2VwdD1cIi5jc3YsLmpzb25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImhpZGRlblwiXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBmID0gZS50YXJnZXQuZmlsZXM/LlswXTtcbiAgICAgICAgICAgICAgICAgIGlmIChmKSB7IHNldEltcG9ydEZpbGUoZik7IHNldEltcG9ydE9wZW4odHJ1ZSk7IH1cbiAgICAgICAgICAgICAgICAgIGUudGFyZ2V0LnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIHNpemU9XCJzbVwiIG9uQ2xpY2s9eygpID0+IGZpbGVJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfT5cbiAgICAgICAgICAgICAgICA8VXBsb2FkIGNsYXNzTmFtZT1cIm1yLTIgaC00IHctNFwiIC8+e3QoJ2RldmljZS5pbXBvcnQnLCAn5a+85YWlJyl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICB2YXJpYW50PVwib3V0bGluZVwiXG4gICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZXhwb3J0RGV2aWNlc0Nzdih7IHN0YXR1czogc3RhdHVzIHx8IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgICAgIHRpdGxlPXt0KCdjb21tb24uZXhwb3J0VGlwJywgJ+acgOWkmuWvvOWHuiAxMDAwMCDmnaEnKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8RG93bmxvYWQgY2xhc3NOYW1lPVwibXItMiBoLTQgdy00XCIgLz57dCgnY29tbW9uLmV4cG9ydCcsICflr7zlh7onKX1cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0RldmljZSh1bmRlZmluZWQpOyBzZXREaWFsb2dPcGVuKHRydWUpOyB9fSBkaXNhYmxlZD17IXBlcm0uY2FuQ3JlYXRlfT5cbiAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cIm1yLTIgaC00IHctNFwiIC8+e3QoJ2NvbW1vbi5jcmVhdGUnKX1cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOaQnOe0ouagjyArIOeKtuaAgei/h+a7pCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtM1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgIDxTZWFyY2ggY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zIHRvcC0xLzIgaC00IHctNCAtdHJhbnNsYXRlLXktMS8yIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiIC8+XG4gICAgICAgICAgPElucHV0XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJwbC05XCJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KCdjb21tb24uc2VhcmNoJykgKyAnLi4uJ31cbiAgICAgICAgICAgIHZhbHVlPXtzZWFyY2h9XG4gICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxTZWxlY3QgdmFsdWU9e3N0YXR1c30gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYgIT09IG51bGwpIHsgc2V0U3RhdHVzKHYgPT09ICdhbGwnID8gJycgOiB2KTsgc2V0UGFnZSgxKTsgfSB9fT5cbiAgICAgICAgICA8U2VsZWN0VHJpZ2dlciBjbGFzc05hbWU9XCJ3LTMyXCI+PFNlbGVjdFZhbHVlIHBsYWNlaG9sZGVyPXt0KCdjb21tb24uc3RhdHVzJyl9IC8+PC9TZWxlY3RUcmlnZ2VyPlxuICAgICAgICAgIDxTZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJhbGxcIj57dCgnY29tbW9uLmFsbCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiT25saW5lXCI+e3QoJ2RldmljZS5vbmxpbmUnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIk9mZmxpbmVcIj57dCgnZGV2aWNlLm9mZmxpbmUnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cIk1haW50ZW5hbmNlXCI+e3QoJ2RldmljZS5tYWludGVuYW5jZScpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICA8L1NlbGVjdENvbnRlbnQ+XG4gICAgICAgIDwvU2VsZWN0PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDorr7lpIfliJfooajooajmoLzmiJbliqDovb0v6ZSZ6K+v54q25oCBICovfVxuICAgICAge2lzTG9hZGluZyA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS0yMCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L2Rpdj5cbiAgICAgICkgOiBpc0Vycm9yICYmICFkYXRhID8gKFxuICAgICAgICAvKiDplJnor6/mgIHvvJrpppblsY/liqDovb3lpLHotKXml7bmmL7lvI/mj5DnpLrlubblj6/ph43or5XvvIzpgb/lhY3miornvZHnu5zplJnor6/or6/mmL7npLrkuLpcIuaaguaXoOiuvuWkh1wiICovXG4gICAgICAgIDxDYXJkPlxuICAgICAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMyBweS0xNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPEFsZXJ0VHJpYW5nbGUgY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWFtYmVyLTUwMFwiIC8+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZEZhaWxlZCcpfTwvcD5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIiBvbkNsaWNrPXsoKSA9PiByZWZldGNoKCl9PlxuICAgICAgICAgICAgICA8UmVmcmVzaEN3IGNsYXNzTmFtZT1cIm1yLTIgaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgIHt0KCdjb21tb24ucmV0cnknKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICAgIDwvQ2FyZD5cbiAgICAgICkgOiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPFRhYmxlPlxuICAgICAgICAgICAgPFRhYmxlSGVhZGVyPlxuICAgICAgICAgICAgICA8VGFibGVSb3c+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnZGV2aWNlLmRldmljZUNvZGUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdkZXZpY2UubmFtZScpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2RldmljZS50eXBlJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLnN0YXR1cycpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2RldmljZS5tb2RlbCcpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2NvbW1vbi5hY3Rpb25zJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICA8L1RhYmxlSGVhZGVyPlxuICAgICAgICAgICAgPFRhYmxlQm9keT5cbiAgICAgICAgICAgICAge2ZpbHRlcmVkRGV2aWNlcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjb2xTcGFuPXs2fSBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgICAge3QoJ2NvbW1vbi5ub0RhdGEnKX1cbiAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgZmlsdGVyZWREZXZpY2VzLm1hcCgoZGV2aWNlKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8VGFibGVSb3cga2V5PXtkZXZpY2UuaWR9IGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyXCIgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoYC9kZXZpY2VzLyR7ZGV2aWNlLmlkfWApfT5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC1zbVwiPntkZXZpY2UuZGV2aWNlQ29kZX08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57ZGV2aWNlLm5hbWV9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e2RldmljZS50eXBlfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxEZXZpY2VTdGF0dXNCYWRnZSBzdGF0dXM9e2RldmljZS5zdGF0dXN9IC8+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7ZGV2aWNlLm1vZGVsID8/ICctJ31cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIOaTjeS9nOaMiemSruWMuuWfn++8mumYu+atouihjOeCueWHu+S6i+S7tuWGkuazoSAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTFcIiBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoYC9kZXZpY2VzLyR7ZGV2aWNlLmlkfWApfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPEV5ZSBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIG9uQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0RldmljZShkZXZpY2UpOyBzZXREaWFsb2dPcGVuKHRydWUpOyB9fSBkaXNhYmxlZD17IXBlcm0uY2FuRWRpdH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5jaWwgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVEZWxldGUoZGV2aWNlLmlkKX0gZGlzYWJsZWQ9eyFwZXJtLmNhbkRlbGV0ZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L1RhYmxlQm9keT5cbiAgICAgICAgICA8L1RhYmxlPlxuXG4gICAgICAgICAgey8qIOWIhumhteaOp+WItiAqL31cbiAgICAgICAgICB7ZGF0YSAmJiBkYXRhLnRvdGFsID4gMjAgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoJ2NvbW1vbi50b3RhbEl0ZW1zJywgeyBjb3VudDogZGF0YS50b3RhbCB9KX08L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIiBkaXNhYmxlZD17cGFnZSA8PSAxfSBvbkNsaWNrPXsoKSA9PiBzZXRQYWdlKHBhZ2UgLSAxKX0+e3QoJ2NvbW1vbi5wcmV2aW91cycpfTwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIiBkaXNhYmxlZD17cGFnZSAqIDIwID49IGRhdGEudG90YWx9IG9uQ2xpY2s9eygpID0+IHNldFBhZ2UocGFnZSArIDEpfT57dCgnY29tbW9uLm5leHQnKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDmlrDlu7ov57yW6L6R6K6+5aSH5a+56K+d5qGGICovfVxuICAgICAgPERpYWxvZyBvcGVuPXtkaWFsb2dPcGVufSBvbk9wZW5DaGFuZ2U9e3NldERpYWxvZ09wZW59PlxuICAgICAgICA8RGlhbG9nQ29udGVudD5cbiAgICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgICAgPERpYWxvZ1RpdGxlPntlZGl0aW5nRGV2aWNlID8gdCgnY29tbW9uLmVkaXQnKSA6IHQoJ2NvbW1vbi5jcmVhdGUnKX08L0RpYWxvZ1RpdGxlPlxuICAgICAgICAgIDwvRGlhbG9nSGVhZGVyPlxuICAgICAgICAgIDxEZXZpY2VGb3JtXG4gICAgICAgICAgICBkZXZpY2U9e2VkaXRpbmdEZXZpY2V9XG4gICAgICAgICAgICBvblN1Ym1pdD17aGFuZGxlU3VibWl0fVxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHsgc2V0RGlhbG9nT3BlbihmYWxzZSk7IHNldEVkaXRpbmdEZXZpY2UodW5kZWZpbmVkKTsgfX1cbiAgICAgICAgICAgIGxvYWRpbmc9e2NyZWF0ZURldmljZS5pc1BlbmRpbmcgfHwgdXBkYXRlRGV2aWNlLmlzUGVuZGluZ31cbiAgICAgICAgICAvPlxuICAgICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgICA8L0RpYWxvZz5cblxuICAgICAgey8qIOiuvuWkh+aJuemHj+WvvOWFpemihOiniOWvueivneahhiAqL31cbiAgICAgIDxEZXZpY2VJbXBvcnRQcmV2aWV3RGlhbG9nXG4gICAgICAgIG9wZW49e2ltcG9ydE9wZW59XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHsgc2V0SW1wb3J0T3BlbihmYWxzZSk7IHNldEltcG9ydEZpbGUobnVsbCk7IH19XG4gICAgICAgIGZpbGU9e2ltcG9ydEZpbGV9XG4gICAgICAvPlxuICAgIDwvZGl2PlxuICApO1xufVxuIl19