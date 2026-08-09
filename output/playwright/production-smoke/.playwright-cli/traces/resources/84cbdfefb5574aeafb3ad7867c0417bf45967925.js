import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/device/DeviceImportPreviewDialog.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport9_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { FileUp, CheckCircle2, AlertTriangle, Download } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "/src/components/ui/dialog.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { useDeviceImportPreview, useImportDevices, downloadImportTemplate } from "/src/hooks/useDevices.ts";
import { AxiosError } from "/node_modules/.vite/deps/axios.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceImportPreviewDialog.tsx";
import __vite__cjsImport9_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 设备导入预览对话框
*
* 上传 CSV/JSON 设备清单后先展示预览结果（有效数据 + 错误列表），
* 用户确认后再执行实际导入。包含错误状态展示和模板下载。
*/
export default function DeviceImportPreviewDialog({ open, onClose, file }) {
	_s();
	const { t } = useTranslation();
	const previewMutation = useDeviceImportPreview();
	const importMutation = useImportDevices();
	const [previewResult, setPreviewResult] = useState(null);
	const [importResult, setImportResult] = useState(null);
	const [step, setStep] = useState("previewing");
	const [errorMessage, setErrorMessage] = useState(null);
	/** 发起预览请求 */
	const handlePreview = () => {
		if (!file) return;
		setStep("previewing");
		setErrorMessage(null);
		previewMutation.mutate(file, {
			onSuccess: (data) => {
				setPreviewResult(data);
				setStep("previewed");
			},
			onError: (err) => {
				setErrorMessage(extractErrorMessage(err));
				setStep("error");
			}
		});
	};
	/** 确认导入 */
	const handleImport = () => {
		if (!file) return;
		setStep("importing");
		setErrorMessage(null);
		importMutation.mutate(file, {
			onSuccess: (data) => {
				setImportResult(data);
				setStep("done");
			},
			onError: (err) => {
				setErrorMessage(extractErrorMessage(err));
				setStep("error");
			}
		});
	};
	/** 关闭并重置所有状态 */
	const handleClose = () => {
		setPreviewResult(null);
		setImportResult(null);
		setStep("previewing");
		setErrorMessage(null);
		onClose();
	};
	return /* @__PURE__ */ _jsxDEV(Dialog, {
		open,
		onOpenChange: (isOpen) => !isOpen && handleClose(),
		children: /* @__PURE__ */ _jsxDEV(DialogContent, {
			className: "max-w-3xl max-h-[85vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ _jsxDEV(FileUp, { className: "h-5 w-5" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 99,
						columnNumber: 13
					}, this), t("device.importPreview.title", "批量导入设备")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 98,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: step === "done" ? t("device.importPreview.doneDescription", "导入完成") : t("device.importPreview.description", "预览文件内容，确认无误后执行导入") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 102,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 97,
					columnNumber: 9
				}, this),
				step === "previewing" && !previewResult && /* @__PURE__ */ _jsxDEV("div", {
					className: "py-8 text-center space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-muted-foreground",
							children: [file ? file.name : t("common.noData", "无数据"), file && /* @__PURE__ */ _jsxDEV("span", {
								className: "ml-2 text-xs text-muted-foreground",
								children: [
									"(",
									formatFileSize(file.size),
									")"
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 114,
								columnNumber: 24
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 112,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center justify-center gap-3",
							children: [/* @__PURE__ */ _jsxDEV(Button, {
								onClick: handlePreview,
								disabled: !file || previewMutation.isPending,
								children: previewMutation.isPending ? t("common.loading", "解析中...") : t("device.importPreview.startPreview", "开始预览")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 117,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(Button, {
								variant: "outline",
								size: "sm",
								onClick: downloadImportTemplate,
								children: [/* @__PURE__ */ _jsxDEV(Download, { className: "mr-2 h-4 w-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 123,
									columnNumber: 17
								}, this), t("device.importPreview.downloadTemplate", "下载模板")]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 122,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 116,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-xs text-muted-foreground",
							children: t("device.importPreview.supportFormat", "支持 CSV、JSON 格式，最大 5MB、10,000 行")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 127,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 111,
					columnNumber: 11
				}, this),
				previewResult && (step === "previewed" || step === "importing") && /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm text-muted-foreground",
										children: [t("device.importPreview.totalRows", "总行数"), ":"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 139,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV(Badge, {
										variant: "outline",
										children: previewResult.totalRows
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 140,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 138,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-green-500" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 143,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("span", {
											className: "text-sm text-muted-foreground",
											children: [t("device.importPreview.validCount", "有效"), ":"]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 144,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV(Badge, {
											variant: "default",
											className: "bg-green-600",
											children: previewResult.validCount
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 145,
											columnNumber: 17
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 142,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-4 w-4 text-yellow-500" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 148,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("span", {
											className: "text-sm text-muted-foreground",
											children: [t("device.importPreview.errorCount", "错误"), ":"]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 149,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV(Badge, {
											variant: "destructive",
											children: previewResult.errorCount
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 150,
											columnNumber: 17
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 147,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 137,
							columnNumber: 13
						}, this),
						previewResult.validItems.length > 0 && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h4", {
							className: "text-sm font-medium mb-2",
							children: t("device.importPreview.validItems", "有效数据预览")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 157,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "max-h-48 overflow-y-auto border rounded-md",
							children: [/* @__PURE__ */ _jsxDEV("table", {
								className: "w-full text-xs",
								children: [/* @__PURE__ */ _jsxDEV("thead", {
									className: "bg-muted sticky top-0",
									children: /* @__PURE__ */ _jsxDEV("tr", { children: [
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: "#"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 162,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: t("device.importPreview.deviceCode", "设备编码")
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 163,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: t("device.importPreview.deviceName", "设备名称")
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 164,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: t("device.importPreview.deviceType", "类型")
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 165,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: t("device.importPreview.manufacturer", "制造商")
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 166,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ _jsxDEV("th", {
											className: "px-2 py-1 text-left",
											children: t("device.importPreview.criticality", "关键等级")
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 167,
											columnNumber: 25
										}, this)
									] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 161,
										columnNumber: 23
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 160,
									columnNumber: 21
								}, this), /* @__PURE__ */ _jsxDEV("tbody", { children: previewResult.validItems.slice(0, 20).map((item) => /* @__PURE__ */ _jsxDEV("tr", {
									className: "border-t hover:bg-muted/50",
									children: [
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1",
											children: item.rowNumber
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 173,
											columnNumber: 27
										}, this),
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1 font-mono",
											children: item.deviceCode
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 174,
											columnNumber: 27
										}, this),
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1",
											children: item.name
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 175,
											columnNumber: 27
										}, this),
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1",
											children: item.type
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 176,
											columnNumber: 27
										}, this),
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1",
											children: item.manufacturer || "-"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 177,
											columnNumber: 27
										}, this),
										/* @__PURE__ */ _jsxDEV("td", {
											className: "px-2 py-1",
											children: item.criticality || "Normal"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 178,
											columnNumber: 27
										}, this)
									]
								}, item.rowNumber, true, {
									fileName: _jsxFileName,
									lineNumber: 172,
									columnNumber: 25
								}, this)) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 170,
									columnNumber: 21
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 159,
								columnNumber: 19
							}, this), previewResult.validItems.length > 20 && /* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs text-muted-foreground text-center py-1 border-t",
								children: t("device.importPreview.moreItems", "还有 {{count}} 条数据未显示", { count: previewResult.validItems.length - 20 })
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 184,
								columnNumber: 21
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 158,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 156,
							columnNumber: 15
						}, this),
						previewResult.errors.length > 0 && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h4", {
							className: "text-sm font-medium mb-2 text-destructive",
							children: [
								t("device.importPreview.errors", "校验错误"),
								"（",
								previewResult.errors.length,
								"）"
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 195,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "max-h-40 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1",
							children: previewResult.errors.map((err, i) => /* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "font-medium",
										children: [
											"#",
											err.rowNumber,
											":"
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 201,
										columnNumber: 23
									}, this),
									" ",
									err.message
								]
							}, i, true, {
								fileName: _jsxFileName,
								lineNumber: 200,
								columnNumber: 21
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 198,
							columnNumber: 17
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 194,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 208,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: handleClose,
							children: t("common.cancel", "取消")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 211,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							onClick: handleImport,
							disabled: previewResult.validCount === 0 || importMutation.isPending,
							children: importMutation.isPending ? t("common.loading", "导入中...") : t("device.importPreview.confirmImport", "确认导入 {{count}} 台设备", { count: previewResult.validCount })
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 214,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 210,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 135,
					columnNumber: 11
				}, this),
				step === "done" && importResult && /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-4",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-green-500" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 231,
										columnNumber: 17
									}, this), /* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm",
										children: [
											t("device.importPreview.imported", "已导入"),
											": ",
											/* @__PURE__ */ _jsxDEV("strong", { children: importResult.imported }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 232,
												columnNumber: 88
											}, this)
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 232,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 230,
									columnNumber: 15
								}, this),
								importResult.skipped > 0 && /* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: /* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm text-muted-foreground",
										children: [
											t("device.importPreview.skipped", "已跳过"),
											": ",
											importResult.skipped
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 236,
										columnNumber: 19
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 235,
									columnNumber: 17
								}, this),
								importResult.failed > 0 && /* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-4 w-4 text-destructive" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 241,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV("span", {
										className: "text-sm text-destructive",
										children: [
											t("device.importPreview.failed", "失败"),
											": ",
											importResult.failed
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 242,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 240,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 229,
							columnNumber: 13
						}, this),
						importResult.errors.length > 0 && /* @__PURE__ */ _jsxDEV("div", {
							className: "max-h-40 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1",
							children: importResult.errors.map((err, i) => /* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: "font-medium",
										children: [
											"#",
											err.rowNumber,
											":"
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 251,
										columnNumber: 21
									}, this),
									" ",
									err.message
								]
							}, i, true, {
								fileName: _jsxFileName,
								lineNumber: 250,
								columnNumber: 19
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 248,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(DialogFooter, { children: /* @__PURE__ */ _jsxDEV(Button, {
							onClick: handleClose,
							children: t("common.confirm", "确定")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 258,
							columnNumber: 15
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 257,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 228,
					columnNumber: 11
				}, this),
				step === "error" && errorMessage && /* @__PURE__ */ _jsxDEV("div", {
					className: "py-6 space-y-4",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-5 w-5" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 267,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("span", {
								className: "text-sm font-medium",
								children: t("device.importPreview.errorTitle", "操作失败")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 268,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 266,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground bg-destructive/5 border border-destructive/30 rounded-md p-3",
							children: errorMessage
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 270,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV(DialogFooter, { children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: handleClose,
							children: t("common.cancel", "关闭")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 274,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							onClick: () => setStep(previewResult ? "previewed" : "previewing"),
							children: t("common.retry", "重试")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 277,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 273,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 265,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 96,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 95,
		columnNumber: 5
	}, this);
}
_s(DeviceImportPreviewDialog, "fgmbd+PzRk3kBV8twMkC5oU6sqc=", false, function() {
	return [
		useTranslation,
		useDeviceImportPreview,
		useImportDevices
	];
});
_c = DeviceImportPreviewDialog;
/** 从 AxiosError 中提取用户可读的错误信息 */
function extractErrorMessage(err) {
	if (err instanceof AxiosError) {
		const data = err.response?.data;
		if (data?.message) return data.message;
		if (data?.error) return data.error;
		if (err.message) return err.message;
	}
	if (err instanceof Error) return err.message;
	return "未知错误";
}
/** 格式化文件大小 */
function formatFileSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
var _c;
$RefreshReg$(_c, "DeviceImportPreviewDialog");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/device/DeviceImportPreviewDialog.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceImportPreviewDialog.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceImportPreviewDialog.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceImportPreviewDialog.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QU0sV0FBVTtrQkFBdUIsRUFBRSxtQ0FBbUMsTUFBTTtPQUFROzs7O2VBQ3ZGOzs7Ozs7TUFDTCx3QkFBQyxLQUFEO09BQUcsV0FBVTtpQkFDVjtNQUNBOzs7OztNQUNILHdCQUFDLGNBQUQsYUFDRSx3QkFBQyxRQUFEO09BQVEsU0FBUTtPQUFVLFNBQVM7aUJBQ2hDLEVBQUUsaUJBQWlCLElBQUk7TUFDbEI7Ozs7Z0JBQ1Isd0JBQUMsUUFBRDtPQUFRLGVBQWUsUUFBUSxnQkFBZ0IsY0FBYyxZQUFZO2lCQUN0RSxFQUFFLGdCQUFnQixJQUFJO01BQ2pCOzs7O2NBQ0k7Ozs7O0tBQ1g7Ozs7OztHQUVNOzs7Ozs7Q0FDVDs7Ozs7QUFFWjs7Ozs7Ozs7OztBQUdBLFNBQVMsb0JBQW9CLEtBQXNCO0NBQ2pELElBQUksZUFBZSxZQUFZO0VBQzdCLE1BQU0sT0FBTyxJQUFJLFVBQVU7RUFDM0IsSUFBSSxNQUFNLFNBQVMsT0FBTyxLQUFLO0VBQy9CLElBQUksTUFBTSxPQUFPLE9BQU8sS0FBSztFQUM3QixJQUFJLElBQUksU0FBUyxPQUFPLElBQUk7Q0FDOUI7Q0FDQSxJQUFJLGVBQWUsT0FBTyxPQUFPLElBQUk7Q0FDckMsT0FBTztBQUNUOztBQUdBLFNBQVMsZUFBZSxPQUF1QjtDQUM3QyxJQUFJLFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTTtDQUNsQyxJQUFJLFFBQVEsT0FBTyxNQUFNLE9BQU8sSUFBSSxRQUFRLEtBQUksQ0FBRSxRQUFRLENBQUMsRUFBRTtDQUM3RCxPQUFPLElBQUksU0FBUyxPQUFPLE1BQUssQ0FBRSxRQUFRLENBQUMsRUFBRTtBQUMvQyIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJEZXZpY2VJbXBvcnRQcmV2aWV3RGlhbG9nLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBGaWxlVXAsIENoZWNrQ2lyY2xlMiwgQWxlcnRUcmlhbmdsZSwgRG93bmxvYWQgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vdWkvYnV0dG9uJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vdWkvYmFkZ2UnO1xuaW1wb3J0IHtcbiAgRGlhbG9nLFxuICBEaWFsb2dDb250ZW50LFxuICBEaWFsb2dIZWFkZXIsXG4gIERpYWxvZ1RpdGxlLFxuICBEaWFsb2dGb290ZXIsXG4gIERpYWxvZ0Rlc2NyaXB0aW9uLFxufSBmcm9tICcuLi91aS9kaWFsb2cnO1xuaW1wb3J0IHsgU2VwYXJhdG9yIH0gZnJvbSAnLi4vdWkvc2VwYXJhdG9yJztcbmltcG9ydCB7XG4gIHVzZURldmljZUltcG9ydFByZXZpZXcsXG4gIHVzZUltcG9ydERldmljZXMsXG4gIGRvd25sb2FkSW1wb3J0VGVtcGxhdGUsXG59IGZyb20gJy4uLy4uL2hvb2tzL3VzZURldmljZXMnO1xuaW1wb3J0IHR5cGUgeyBEZXZpY2VJbXBvcnRQcmV2aWV3UmVzdWx0LCBJbXBvcnRSZXN1bHQgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgeyBBeGlvc0Vycm9yIH0gZnJvbSAnYXhpb3MnO1xuXG4vKiog6K6+5aSH5a+85YWl6aKE6KeI5a+56K+d5qGG5bGe5oCnICovXG5pbnRlcmZhY2UgRGV2aWNlSW1wb3J0UHJldmlld0RpYWxvZ1Byb3BzIHtcbiAgLyoqIOaYr+WQpuaJk+W8gOWvueivneahhiAqL1xuICBvcGVuOiBib29sZWFuO1xuICAvKiog5YWz6Zet5Zue6LCDICovXG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG4gIC8qKiDlvoXlr7zlhaXnmoTmlofku7YgKi9cbiAgZmlsZTogRmlsZSB8IG51bGw7XG59XG5cbi8qKiDlr7nor53moYbmraXpqqTnirbmgIEgKi9cbnR5cGUgSW1wb3J0U3RlcCA9ICdwcmV2aWV3aW5nJyB8ICdwcmV2aWV3ZWQnIHwgJ2ltcG9ydGluZycgfCAnZG9uZScgfCAnZXJyb3InO1xuXG4vKipcbiAqIOiuvuWkh+WvvOWFpemihOiniOWvueivneahhlxuICpcbiAqIOS4iuS8oCBDU1YvSlNPTiDorr7lpIfmuIXljZXlkI7lhYjlsZXnpLrpooTop4jnu5PmnpzvvIjmnInmlYjmlbDmja4gKyDplJnor6/liJfooajvvInvvIxcbiAqIOeUqOaIt+ehruiupOWQjuWGjeaJp+ihjOWunumZheWvvOWFpeOAguWMheWQq+mUmeivr+eKtuaAgeWxleekuuWSjOaooeadv+S4i+i9veOAglxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEZXZpY2VJbXBvcnRQcmV2aWV3RGlhbG9nKHsgb3Blbiwgb25DbG9zZSwgZmlsZSB9OiBEZXZpY2VJbXBvcnRQcmV2aWV3RGlhbG9nUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBwcmV2aWV3TXV0YXRpb24gPSB1c2VEZXZpY2VJbXBvcnRQcmV2aWV3KCk7XG4gIGNvbnN0IGltcG9ydE11dGF0aW9uID0gdXNlSW1wb3J0RGV2aWNlcygpO1xuICBjb25zdCBbcHJldmlld1Jlc3VsdCwgc2V0UHJldmlld1Jlc3VsdF0gPSB1c2VTdGF0ZTxEZXZpY2VJbXBvcnRQcmV2aWV3UmVzdWx0IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtpbXBvcnRSZXN1bHQsIHNldEltcG9ydFJlc3VsdF0gPSB1c2VTdGF0ZTxJbXBvcnRSZXN1bHQgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3N0ZXAsIHNldFN0ZXBdID0gdXNlU3RhdGU8SW1wb3J0U3RlcD4oJ3ByZXZpZXdpbmcnKTtcbiAgY29uc3QgW2Vycm9yTWVzc2FnZSwgc2V0RXJyb3JNZXNzYWdlXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIC8qKiDlj5HotbfpooTop4jor7fmsYIgKi9cbiAgY29uc3QgaGFuZGxlUHJldmlldyA9ICgpID0+IHtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICBzZXRTdGVwKCdwcmV2aWV3aW5nJyk7XG4gICAgc2V0RXJyb3JNZXNzYWdlKG51bGwpO1xuICAgIHByZXZpZXdNdXRhdGlvbi5tdXRhdGUoZmlsZSwge1xuICAgICAgb25TdWNjZXNzOiAoZGF0YSkgPT4ge1xuICAgICAgICBzZXRQcmV2aWV3UmVzdWx0KGRhdGEpO1xuICAgICAgICBzZXRTdGVwKCdwcmV2aWV3ZWQnKTtcbiAgICAgIH0sXG4gICAgICBvbkVycm9yOiAoZXJyKSA9PiB7XG4gICAgICAgIHNldEVycm9yTWVzc2FnZShleHRyYWN0RXJyb3JNZXNzYWdlKGVycikpO1xuICAgICAgICBzZXRTdGVwKCdlcnJvcicpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfTtcblxuICAvKiog56Gu6K6k5a+85YWlICovXG4gIGNvbnN0IGhhbmRsZUltcG9ydCA9ICgpID0+IHtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICBzZXRTdGVwKCdpbXBvcnRpbmcnKTtcbiAgICBzZXRFcnJvck1lc3NhZ2UobnVsbCk7XG4gICAgaW1wb3J0TXV0YXRpb24ubXV0YXRlKGZpbGUsIHtcbiAgICAgIG9uU3VjY2VzczogKGRhdGEpID0+IHtcbiAgICAgICAgc2V0SW1wb3J0UmVzdWx0KGRhdGEpO1xuICAgICAgICBzZXRTdGVwKCdkb25lJyk7XG4gICAgICB9LFxuICAgICAgb25FcnJvcjogKGVycikgPT4ge1xuICAgICAgICBzZXRFcnJvck1lc3NhZ2UoZXh0cmFjdEVycm9yTWVzc2FnZShlcnIpKTtcbiAgICAgICAgc2V0U3RlcCgnZXJyb3InKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH07XG5cbiAgLyoqIOWFs+mXreW5tumHjee9ruaJgOacieeKtuaAgSAqL1xuICBjb25zdCBoYW5kbGVDbG9zZSA9ICgpID0+IHtcbiAgICBzZXRQcmV2aWV3UmVzdWx0KG51bGwpO1xuICAgIHNldEltcG9ydFJlc3VsdChudWxsKTtcbiAgICBzZXRTdGVwKCdwcmV2aWV3aW5nJyk7XG4gICAgc2V0RXJyb3JNZXNzYWdlKG51bGwpO1xuICAgIG9uQ2xvc2UoKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2cgb3Blbj17b3Blbn0gb25PcGVuQ2hhbmdlPXsoaXNPcGVuKSA9PiAhaXNPcGVuICYmIGhhbmRsZUNsb3NlKCl9PlxuICAgICAgPERpYWxvZ0NvbnRlbnQgY2xhc3NOYW1lPVwibWF4LXctM3hsIG1heC1oLVs4NXZoXSBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgPERpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8RGlhbG9nVGl0bGUgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxGaWxlVXAgY2xhc3NOYW1lPVwiaC01IHctNVwiIC8+XG4gICAgICAgICAgICB7dCgnZGV2aWNlLmltcG9ydFByZXZpZXcudGl0bGUnLCAn5om56YeP5a+85YWl6K6+5aSHJyl9XG4gICAgICAgICAgPC9EaWFsb2dUaXRsZT5cbiAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+XG4gICAgICAgICAgICB7c3RlcCA9PT0gJ2RvbmUnXG4gICAgICAgICAgICAgID8gdCgnZGV2aWNlLmltcG9ydFByZXZpZXcuZG9uZURlc2NyaXB0aW9uJywgJ+WvvOWFpeWujOaIkCcpXG4gICAgICAgICAgICAgIDogdCgnZGV2aWNlLmltcG9ydFByZXZpZXcuZGVzY3JpcHRpb24nLCAn6aKE6KeI5paH5Lu25YaF5a6577yM56Gu6K6k5peg6K+v5ZCO5omn6KGM5a+85YWlJyl9XG4gICAgICAgICAgPC9EaWFsb2dEZXNjcmlwdGlvbj5cbiAgICAgICAgPC9EaWFsb2dIZWFkZXI+XG5cbiAgICAgICAgey8qIOmihOiniOmYtuautSAqL31cbiAgICAgICAge3N0ZXAgPT09ICdwcmV2aWV3aW5nJyAmJiAhcHJldmlld1Jlc3VsdCAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS04IHRleHQtY2VudGVyIHNwYWNlLXktNFwiPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgIHtmaWxlID8gZmlsZS5uYW1lIDogdCgnY29tbW9uLm5vRGF0YScsICfml6DmlbDmja4nKX1cbiAgICAgICAgICAgICAge2ZpbGUgJiYgPHNwYW4gY2xhc3NOYW1lPVwibWwtMiB0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPih7Zm9ybWF0RmlsZVNpemUoZmlsZS5zaXplKX0pPC9zcGFuPn1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVQcmV2aWV3fSBkaXNhYmxlZD17IWZpbGUgfHwgcHJldmlld011dGF0aW9uLmlzUGVuZGluZ30+XG4gICAgICAgICAgICAgICAge3ByZXZpZXdNdXRhdGlvbi5pc1BlbmRpbmdcbiAgICAgICAgICAgICAgICAgID8gdCgnY29tbW9uLmxvYWRpbmcnLCAn6Kej5p6Q5LitLi4uJylcbiAgICAgICAgICAgICAgICAgIDogdCgnZGV2aWNlLmltcG9ydFByZXZpZXcuc3RhcnRQcmV2aWV3JywgJ+W8gOWni+mihOiniCcpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIHNpemU9XCJzbVwiIG9uQ2xpY2s9e2Rvd25sb2FkSW1wb3J0VGVtcGxhdGV9PlxuICAgICAgICAgICAgICAgIDxEb3dubG9hZCBjbGFzc05hbWU9XCJtci0yIGgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICAgIHt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5kb3dubG9hZFRlbXBsYXRlJywgJ+S4i+i9veaooeadvycpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAge3QoJ2RldmljZS5pbXBvcnRQcmV2aWV3LnN1cHBvcnRGb3JtYXQnLCAn5pSv5oyBIENTVuOAgUpTT04g5qC85byP77yM5pyA5aSnIDVNQuOAgTEwLDAwMCDooYwnKX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7Lyog6aKE6KeI57uT5p6c5bGV56S6ICovfVxuICAgICAgICB7cHJldmlld1Jlc3VsdCAmJiAoc3RlcCA9PT0gJ3ByZXZpZXdlZCcgfHwgc3RlcCA9PT0gJ2ltcG9ydGluZycpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgey8qIOe7n+iuoeaRmOimgSAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmltcG9ydFByZXZpZXcudG90YWxSb3dzJywgJ+aAu+ihjOaVsCcpfTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+e3ByZXZpZXdSZXN1bHQudG90YWxSb3dzfTwvQmFkZ2U+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUyIGNsYXNzTmFtZT1cImgtNCB3LTQgdGV4dC1ncmVlbi01MDBcIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5pbXBvcnRQcmV2aWV3LnZhbGlkQ291bnQnLCAn5pyJ5pWIJyl9Ojwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD1cImRlZmF1bHRcIiBjbGFzc05hbWU9XCJiZy1ncmVlbi02MDBcIj57cHJldmlld1Jlc3VsdC52YWxpZENvdW50fTwvQmFkZ2U+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8QWxlcnRUcmlhbmdsZSBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQteWVsbG93LTUwMFwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLmltcG9ydFByZXZpZXcuZXJyb3JDb3VudCcsICfplJnor68nKX06PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PVwiZGVzdHJ1Y3RpdmVcIj57cHJldmlld1Jlc3VsdC5lcnJvckNvdW50fTwvQmFkZ2U+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiDmnInmlYjmlbDmja7pooTop4jooajmoLwgKi99XG4gICAgICAgICAgICB7cHJldmlld1Jlc3VsdC52YWxpZEl0ZW1zLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIG1iLTJcIj57dCgnZGV2aWNlLmltcG9ydFByZXZpZXcudmFsaWRJdGVtcycsICfmnInmlYjmlbDmja7pooTop4gnKX08L2g0PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LWgtNDggb3ZlcmZsb3cteS1hdXRvIGJvcmRlciByb3VuZGVkLW1kXCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkIGNsYXNzTmFtZT1cImJnLW11dGVkIHN0aWNreSB0b3AtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC0yIHB5LTEgdGV4dC1sZWZ0XCI+IzwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMiBweS0xIHRleHQtbGVmdFwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5kZXZpY2VDb2RlJywgJ+iuvuWkh+e8lueggScpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMiBweS0xIHRleHQtbGVmdFwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5kZXZpY2VOYW1lJywgJ+iuvuWkh+WQjeensCcpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMiBweS0xIHRleHQtbGVmdFwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5kZXZpY2VUeXBlJywgJ+exu+WeiycpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMiBweS0xIHRleHQtbGVmdFwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5tYW51ZmFjdHVyZXInLCAn5Yi26YCg5ZWGJyl9PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC0yIHB5LTEgdGV4dC1sZWZ0XCI+e3QoJ2RldmljZS5pbXBvcnRQcmV2aWV3LmNyaXRpY2FsaXR5JywgJ+WFs+mUruetiee6pycpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgIHtwcmV2aWV3UmVzdWx0LnZhbGlkSXRlbXMuc2xpY2UoMCwgMjApLm1hcCgoaXRlbSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17aXRlbS5yb3dOdW1iZXJ9IGNsYXNzTmFtZT1cImJvcmRlci10IGhvdmVyOmJnLW11dGVkLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0yIHB5LTFcIj57aXRlbS5yb3dOdW1iZXJ9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTIgcHktMSBmb250LW1vbm9cIj57aXRlbS5kZXZpY2VDb2RlfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0yIHB5LTFcIj57aXRlbS5uYW1lfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0yIHB5LTFcIj57aXRlbS50eXBlfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0yIHB5LTFcIj57aXRlbS5tYW51ZmFjdHVyZXIgfHwgJy0nfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0yIHB5LTFcIj57aXRlbS5jcml0aWNhbGl0eSB8fCAnTm9ybWFsJ308L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICB7cHJldmlld1Jlc3VsdC52YWxpZEl0ZW1zLmxlbmd0aCA+IDIwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgdGV4dC1jZW50ZXIgcHktMSBib3JkZXItdFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5tb3JlSXRlbXMnLCAn6L+Y5pyJIHt7Y291bnR9fSDmnaHmlbDmja7mnKrmmL7npLonLCB7IGNvdW50OiBwcmV2aWV3UmVzdWx0LnZhbGlkSXRlbXMubGVuZ3RoIC0gMjAgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgey8qIOmUmeivr+WIl+ihqCAqL31cbiAgICAgICAgICAgIHtwcmV2aWV3UmVzdWx0LmVycm9ycy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSBtYi0yIHRleHQtZGVzdHJ1Y3RpdmVcIj5cbiAgICAgICAgICAgICAgICAgIHt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5lcnJvcnMnLCAn5qCh6aqM6ZSZ6K+vJyl977yIe3ByZXZpZXdSZXN1bHQuZXJyb3JzLmxlbmd0aH3vvIlcbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LWgtNDAgb3ZlcmZsb3cteS1hdXRvIGJvcmRlciBib3JkZXItZGVzdHJ1Y3RpdmUvMzAgcm91bmRlZC1tZCBiZy1kZXN0cnVjdGl2ZS81IHAtMiBzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgICAgIHtwcmV2aWV3UmVzdWx0LmVycm9ycy5tYXAoKGVyciwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8cCBrZXk9e2l9IGNsYXNzTmFtZT1cInRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPiN7ZXJyLnJvd051bWJlcn06PC9zcGFuPiB7ZXJyLm1lc3NhZ2V9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxTZXBhcmF0b3IgLz5cblxuICAgICAgICAgICAgPERpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9e2hhbmRsZUNsb3NlfT5cbiAgICAgICAgICAgICAgICB7dCgnY29tbW9uLmNhbmNlbCcsICflj5bmtognKX1cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVJbXBvcnR9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ByZXZpZXdSZXN1bHQudmFsaWRDb3VudCA9PT0gMCB8fCBpbXBvcnRNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aW1wb3J0TXV0YXRpb24uaXNQZW5kaW5nXG4gICAgICAgICAgICAgICAgICA/IHQoJ2NvbW1vbi5sb2FkaW5nJywgJ+WvvOWFpeS4rS4uLicpXG4gICAgICAgICAgICAgICAgICA6IHQoJ2RldmljZS5pbXBvcnRQcmV2aWV3LmNvbmZpcm1JbXBvcnQnLCAn56Gu6K6k5a+85YWlIHt7Y291bnR9fSDlj7Dorr7lpIcnLCB7IGNvdW50OiBwcmV2aWV3UmVzdWx0LnZhbGlkQ291bnQgfSl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9EaWFsb2dGb290ZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIOWvvOWFpeWujOaIkOe7k+aenCAqL31cbiAgICAgICAge3N0ZXAgPT09ICdkb25lJyAmJiBpbXBvcnRSZXN1bHQgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZTIgY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LWdyZWVuLTUwMFwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5pbXBvcnRlZCcsICflt7Llr7zlhaUnKX06IDxzdHJvbmc+e2ltcG9ydFJlc3VsdC5pbXBvcnRlZH08L3N0cm9uZz48L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aW1wb3J0UmVzdWx0LnNraXBwZWQgPiAwICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2RldmljZS5pbXBvcnRQcmV2aWV3LnNraXBwZWQnLCAn5bey6Lez6L+HJyl9OiB7aW1wb3J0UmVzdWx0LnNraXBwZWR9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aW1wb3J0UmVzdWx0LmZhaWxlZCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPEFsZXJ0VHJpYW5nbGUgY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LWRlc3RydWN0aXZlXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5mYWlsZWQnLCAn5aSx6LSlJyl9OiB7aW1wb3J0UmVzdWx0LmZhaWxlZH08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAge2ltcG9ydFJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LWgtNDAgb3ZlcmZsb3cteS1hdXRvIGJvcmRlciBib3JkZXItZGVzdHJ1Y3RpdmUvMzAgcm91bmRlZC1tZCBiZy1kZXN0cnVjdGl2ZS81IHAtMiBzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgICB7aW1wb3J0UmVzdWx0LmVycm9ycy5tYXAoKGVyciwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgPHAga2V5PXtpfSBjbGFzc05hbWU9XCJ0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+I3tlcnIucm93TnVtYmVyfTo8L3NwYW4+IHtlcnIubWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8RGlhbG9nRm9vdGVyPlxuICAgICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNsb3NlfT57dCgnY29tbW9uLmNvbmZpcm0nLCAn56Gu5a6aJyl9PC9CdXR0b24+XG4gICAgICAgICAgICA8L0RpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7Lyog6ZSZ6K+v54q25oCBICovfVxuICAgICAgICB7c3RlcCA9PT0gJ2Vycm9yJyAmJiBlcnJvck1lc3NhZ2UgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHktNiBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1kZXN0cnVjdGl2ZVwiPlxuICAgICAgICAgICAgICA8QWxlcnRUcmlhbmdsZSBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPnt0KCdkZXZpY2UuaW1wb3J0UHJldmlldy5lcnJvclRpdGxlJywgJ+aTjeS9nOWksei0pScpfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmQgYmctZGVzdHJ1Y3RpdmUvNSBib3JkZXIgYm9yZGVyLWRlc3RydWN0aXZlLzMwIHJvdW5kZWQtbWQgcC0zXCI+XG4gICAgICAgICAgICAgIHtlcnJvck1lc3NhZ2V9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8RGlhbG9nRm9vdGVyPlxuICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgb25DbGljaz17aGFuZGxlQ2xvc2V9PlxuICAgICAgICAgICAgICAgIHt0KCdjb21tb24uY2FuY2VsJywgJ+WFs+mXrScpfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRTdGVwKHByZXZpZXdSZXN1bHQgPyAncHJldmlld2VkJyA6ICdwcmV2aWV3aW5nJyl9PlxuICAgICAgICAgICAgICAgIHt0KCdjb21tb24ucmV0cnknLCAn6YeN6K+VJyl9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9EaWFsb2dGb290ZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L0RpYWxvZ0NvbnRlbnQ+XG4gICAgPC9EaWFsb2c+XG4gICk7XG59XG5cbi8qKiDku44gQXhpb3NFcnJvciDkuK3mj5Dlj5bnlKjmiLflj6/or7vnmoTplJnor6/kv6Hmga8gKi9cbmZ1bmN0aW9uIGV4dHJhY3RFcnJvck1lc3NhZ2UoZXJyOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKGVyciBpbnN0YW5jZW9mIEF4aW9zRXJyb3IpIHtcbiAgICBjb25zdCBkYXRhID0gZXJyLnJlc3BvbnNlPy5kYXRhIGFzIHsgbWVzc2FnZT86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZGF0YT8ubWVzc2FnZSkgcmV0dXJuIGRhdGEubWVzc2FnZTtcbiAgICBpZiAoZGF0YT8uZXJyb3IpIHJldHVybiBkYXRhLmVycm9yO1xuICAgIGlmIChlcnIubWVzc2FnZSkgcmV0dXJuIGVyci5tZXNzYWdlO1xuICB9XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIGVyci5tZXNzYWdlO1xuICByZXR1cm4gJ+acquefpemUmeivryc7XG59XG5cbi8qKiDmoLzlvI/ljJbmlofku7blpKflsI8gKi9cbmZ1bmN0aW9uIGZvcm1hdEZpbGVTaXplKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoYnl0ZXMgPCAxMDI0KSByZXR1cm4gYCR7Ynl0ZXN9IEJgO1xuICBpZiAoYnl0ZXMgPCAxMDI0ICogMTAyNCkgcmV0dXJuIGAkeyhieXRlcyAvIDEwMjQpLnRvRml4ZWQoMSl9IEtCYDtcbiAgcmV0dXJuIGAkeyhieXRlcyAvICgxMDI0ICogMTAyNCkpLnRvRml4ZWQoMSl9IE1CYDtcbn1cbiJdfQ==