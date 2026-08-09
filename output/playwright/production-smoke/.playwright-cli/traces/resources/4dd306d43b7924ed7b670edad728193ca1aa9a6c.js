import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/AttachmentUpload.tsx");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false};const useCallback = __vite__cjsImport0_react["useCallback"]; const useRef = __vite__cjsImport0_react["useRef"]; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"];/**
* 工单附件上传组件
*
* 支持拖拽上传、文件列表展示、下载和删除操作。
* 限制文件大小 20MB，允许图片/PDF/文档/压缩包。
*/
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Upload, FileText, Download, Trash2, Paperclip } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { useWorkOrderAttachments, useUploadAttachment, useDeleteAttachment, formatFileSize } from "/src/hooks/useWorkOrderAttachments.ts";
import { Button } from "/src/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/AttachmentUpload.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
export default function AttachmentUpload({ workOrderId, canEdit = false }) {
	_s();
	const { t } = useTranslation();
	const fileInputRef = useRef(null);
	const [dragOver, setDragOver] = useState(false);
	const { data: attachments = [], isLoading } = useWorkOrderAttachments(workOrderId);
	const uploadMutation = useUploadAttachment(workOrderId);
	const deleteMutation = useDeleteAttachment(workOrderId);
	// 处理文件选择
	const handleFiles = useCallback((files) => {
		if (!files) return;
		Array.from(files).forEach((file) => {
			uploadMutation.mutate(file);
		});
	}, [uploadMutation]);
	// 拖拽事件
	const handleDragOver = (e) => {
		e.preventDefault();
		setDragOver(true);
	};
	const handleDragLeave = () => setDragOver(false);
	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		handleFiles(e.dataTransfer.files);
	};
	// 下载附件
	const handleDownload = (attachmentId) => {
		const baseUrl = import.meta.env.DEV ? "" : "";
		window.open(`${baseUrl}/api/v1/work-orders/${workOrderId}/attachments/${attachmentId}/download`, "_blank");
	};
	// 删除附件
	const handleDelete = (attachmentId) => {
		deleteMutation.mutate(attachmentId);
	};
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, {
		className: "pb-3",
		children: /* @__PURE__ */ _jsxDEV(CardTitle, {
			className: "flex items-center gap-2 text-base",
			children: [
				/* @__PURE__ */ _jsxDEV(Paperclip, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 77,
					columnNumber: 11
				}, this),
				t("workOrders.attachments", "附件"),
				" (",
				attachments.length,
				")"
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 76,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "space-y-3",
		children: [
			canEdit && /* @__PURE__ */ _jsxDEV("div", {
				className: `rounded-lg border-2 border-dashed p-4 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`,
				onDragOver: handleDragOver,
				onDragLeave: handleDragLeave,
				onDrop: handleDrop,
				onClick: () => fileInputRef.current?.click(),
				role: "button",
				tabIndex: 0,
				children: [
					/* @__PURE__ */ _jsxDEV(Upload, { className: "mx-auto h-8 w-8 text-muted-foreground" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 97,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: t("workOrders.dragToUpload", "拖拽文件到此处或点击上传")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 98,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "mt-1 text-xs text-muted-foreground/60",
						children: t("workOrders.uploadHint", "支持图片、PDF、文档、压缩包，最大 20MB")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 101,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("input", {
						ref: fileInputRef,
						type: "file",
						multiple: true,
						className: "hidden",
						accept: "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt,.csv",
						onChange: (e) => handleFiles(e.target.files)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 104,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 84,
				columnNumber: 11
			}, this),
			uploadMutation.isPending && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground animate-pulse",
				children: t("workOrders.uploading", "正在上传...")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 117,
				columnNumber: 11
			}, this),
			isLoading ? /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("common.loading", "加载中...")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 124,
				columnNumber: 11
			}, this) : attachments.length === 0 ? /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: t("workOrders.noAttachments", "暂无附件")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 126,
				columnNumber: 11
			}, this) : /* @__PURE__ */ _jsxDEV("ul", {
				className: "space-y-2",
				children: attachments.map((att) => /* @__PURE__ */ _jsxDEV("li", {
					className: "flex items-center justify-between rounded-md border px-3 py-2",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-2 min-w-0",
						children: [
							/* @__PURE__ */ _jsxDEV(FileText, { className: "h-4 w-4 shrink-0 text-muted-foreground" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 137,
								columnNumber: 19
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "truncate text-sm",
								title: att.fileName,
								children: att.fileName
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 138,
								columnNumber: 19
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "shrink-0 text-xs text-muted-foreground",
								children: formatFileSize(att.fileSize)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 141,
								columnNumber: 19
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 136,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-1 shrink-0",
						children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-7 w-7",
							onClick: () => handleDownload(att.id),
							title: t("common.download", "下载"),
							children: /* @__PURE__ */ _jsxDEV(Download, { className: "h-3.5 w-3.5" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 153,
								columnNumber: 21
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 146,
							columnNumber: 19
						}, this), canEdit && /* @__PURE__ */ _jsxDEV(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-7 w-7 text-destructive hover:text-destructive",
							onClick: () => handleDelete(att.id),
							disabled: deleteMutation.isPending,
							title: t("common.delete", "删除"),
							children: /* @__PURE__ */ _jsxDEV(Trash2, { className: "h-3.5 w-3.5" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 164,
								columnNumber: 23
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 156,
							columnNumber: 21
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 145,
						columnNumber: 17
					}, this)]
				}, att.id, true, {
					fileName: _jsxFileName,
					lineNumber: 132,
					columnNumber: 15
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 130,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 81,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 74,
		columnNumber: 5
	}, this);
}
_s(AttachmentUpload, "o9wQnuGFcbeaQGOTWo+mlRq3HRQ=", false, function() {
	return [
		useTranslation,
		useWorkOrderAttachments,
		useUploadAttachment,
		useDeleteAttachment
	];
});
_c = AttachmentUpload;
var _c;
$RefreshReg$(_c, "AttachmentUpload");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/AttachmentUpload.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/AttachmentUpload.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/AttachmentUpload.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/AttachmentUpload.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUFDLE1BQUQ7S0FFRSxXQUFVO2VBRlosQ0FJRSx3QkFBQyxPQUFEO01BQUssV0FBVTtnQkFBZjtPQUNFLHdCQUFDLFVBQUQsRUFBVSxXQUFVLHlDQUEwQzs7Ozs7T0FDOUQsd0JBQUMsUUFBRDtRQUFNLFdBQVU7UUFBbUIsT0FBTyxJQUFJO2tCQUMzQyxJQUFJO09BQ0Q7Ozs7O09BQ04sd0JBQUMsUUFBRDtRQUFNLFdBQVU7a0JBQ2IsZUFBZSxJQUFJLFFBQVE7T0FDeEI7Ozs7O01BQ0g7Ozs7O2VBQ0wsd0JBQUMsT0FBRDtNQUFLLFdBQVU7Z0JBQWYsQ0FDRSx3QkFBQyxRQUFEO09BQ0UsU0FBUTtPQUNSLE1BQUs7T0FDTCxXQUFVO09BQ1YsZUFBZSxlQUFlLElBQUksRUFBRTtPQUNwQyxPQUFPLEVBQUUsbUJBQW1CLElBQUk7aUJBRWhDLHdCQUFDLFVBQUQsRUFBVSxXQUFVLGNBQWU7Ozs7O01BQzdCOzs7O2dCQUNQLFdBQ0Msd0JBQUMsUUFBRDtPQUNFLFNBQVE7T0FDUixNQUFLO09BQ0wsV0FBVTtPQUNWLGVBQWUsYUFBYSxJQUFJLEVBQUU7T0FDbEMsVUFBVSxlQUFlO09BQ3pCLE9BQU8sRUFBRSxpQkFBaUIsSUFBSTtpQkFFOUIsd0JBQUMsUUFBRCxFQUFRLFdBQVUsY0FBZTs7Ozs7TUFDM0I7Ozs7Y0FFUDs7Ozs7YUFDSDtPQW5DRyxJQUFJOzs7O1dBbUNQLENBQ0w7R0FDQzs7Ozs7RUFFSzs7Ozs7U0FDVDs7Ozs7QUFFViIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJBdHRhY2htZW50VXBsb2FkLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOW3peWNlemZhOS7tuS4iuS8oOe7hOS7tlxuICpcbiAqIOaUr+aMgeaLluaLveS4iuS8oOOAgeaWh+S7tuWIl+ihqOWxleekuuOAgeS4i+i9veWSjOWIoOmZpOaTjeS9nOOAglxuICog6ZmQ5Yi25paH5Lu25aSn5bCPIDIwTULvvIzlhYHorrjlm77niYcvUERGL+aWh+ahoy/ljovnvKnljIXjgIJcbiAqL1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgVXBsb2FkLCBGaWxlVGV4dCwgRG93bmxvYWQsIFRyYXNoMiwgUGFwZXJjbGlwIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7XG4gIHVzZVdvcmtPcmRlckF0dGFjaG1lbnRzLFxuICB1c2VVcGxvYWRBdHRhY2htZW50LFxuICB1c2VEZWxldGVBdHRhY2htZW50LFxuICBmb3JtYXRGaWxlU2l6ZSxcbn0gZnJvbSAnQC9ob29rcy91c2VXb3JrT3JkZXJBdHRhY2htZW50cyc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvYnV0dG9uJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvY2FyZCc7XG5cbmludGVyZmFjZSBBdHRhY2htZW50VXBsb2FkUHJvcHMge1xuICB3b3JrT3JkZXJJZDogc3RyaW5nO1xuICAvKiog5b2T5YmN55So5oi35piv5ZCm5pyJ5pON5L2c5p2D6ZmQ77yI5LiK5LygL+WIoOmZpO+8iSAqL1xuICBjYW5FZGl0PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXR0YWNobWVudFVwbG9hZCh7IHdvcmtPcmRlcklkLCBjYW5FZGl0ID0gZmFsc2UgfTogQXR0YWNobWVudFVwbG9hZFByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgZmlsZUlucHV0UmVmID0gdXNlUmVmPEhUTUxJbnB1dEVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBbZHJhZ092ZXIsIHNldERyYWdPdmVyXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCB7IGRhdGE6IGF0dGFjaG1lbnRzID0gW10sIGlzTG9hZGluZyB9ID0gdXNlV29ya09yZGVyQXR0YWNobWVudHMod29ya09yZGVySWQpO1xuICBjb25zdCB1cGxvYWRNdXRhdGlvbiA9IHVzZVVwbG9hZEF0dGFjaG1lbnQod29ya09yZGVySWQpO1xuICBjb25zdCBkZWxldGVNdXRhdGlvbiA9IHVzZURlbGV0ZUF0dGFjaG1lbnQod29ya09yZGVySWQpO1xuXG4gIC8vIOWkhOeQhuaWh+S7tumAieaLqVxuICBjb25zdCBoYW5kbGVGaWxlcyA9IHVzZUNhbGxiYWNrKFxuICAgIChmaWxlczogRmlsZUxpc3QgfCBudWxsKSA9PiB7XG4gICAgICBpZiAoIWZpbGVzKSByZXR1cm47XG4gICAgICBBcnJheS5mcm9tKGZpbGVzKS5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICAgIHVwbG9hZE11dGF0aW9uLm11dGF0ZShmaWxlKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgW3VwbG9hZE11dGF0aW9uXVxuICApO1xuXG4gIC8vIOaLluaLveS6i+S7tlxuICBjb25zdCBoYW5kbGVEcmFnT3ZlciA9IChlOiBSZWFjdC5EcmFnRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2V0RHJhZ092ZXIodHJ1ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRHJhZ0xlYXZlID0gKCkgPT4gc2V0RHJhZ092ZXIoZmFsc2UpO1xuXG4gIGNvbnN0IGhhbmRsZURyb3AgPSAoZTogUmVhY3QuRHJhZ0V2ZW50KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldERyYWdPdmVyKGZhbHNlKTtcbiAgICBoYW5kbGVGaWxlcyhlLmRhdGFUcmFuc2Zlci5maWxlcyk7XG4gIH07XG5cbiAgLy8g5LiL6L296ZmE5Lu2XG4gIGNvbnN0IGhhbmRsZURvd25sb2FkID0gKGF0dGFjaG1lbnRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgYmFzZVVybCA9IGltcG9ydC5tZXRhLmVudi5ERVYgPyAnJyA6ICcnO1xuICAgIHdpbmRvdy5vcGVuKFxuICAgICAgYCR7YmFzZVVybH0vYXBpL3YxL3dvcmstb3JkZXJzLyR7d29ya09yZGVySWR9L2F0dGFjaG1lbnRzLyR7YXR0YWNobWVudElkfS9kb3dubG9hZGAsXG4gICAgICAnX2JsYW5rJ1xuICAgICk7XG4gIH07XG5cbiAgLy8g5Yig6Zmk6ZmE5Lu2XG4gIGNvbnN0IGhhbmRsZURlbGV0ZSA9IChhdHRhY2htZW50SWQ6IHN0cmluZykgPT4ge1xuICAgIGRlbGV0ZU11dGF0aW9uLm11dGF0ZShhdHRhY2htZW50SWQpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPENhcmQ+XG4gICAgICA8Q2FyZEhlYWRlciBjbGFzc05hbWU9XCJwYi0zXCI+XG4gICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1iYXNlXCI+XG4gICAgICAgICAgPFBhcGVyY2xpcCBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgICB7dCgnd29ya09yZGVycy5hdHRhY2htZW50cycsICfpmYTku7YnKX0gKHthdHRhY2htZW50cy5sZW5ndGh9KVxuICAgICAgICA8L0NhcmRUaXRsZT5cbiAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgIDxDYXJkQ29udGVudCBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgey8qIOS4iuS8oOWMuuWfnyAqL31cbiAgICAgICAge2NhbkVkaXQgJiYgKFxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHJvdW5kZWQtbGcgYm9yZGVyLTIgYm9yZGVyLWRhc2hlZCBwLTQgdGV4dC1jZW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgJHtcbiAgICAgICAgICAgICAgZHJhZ092ZXJcbiAgICAgICAgICAgICAgICA/ICdib3JkZXItcHJpbWFyeSBiZy1wcmltYXJ5LzUnXG4gICAgICAgICAgICAgICAgOiAnYm9yZGVyLW11dGVkLWZvcmVncm91bmQvMjUgaG92ZXI6Ym9yZGVyLW11dGVkLWZvcmVncm91bmQvNTAnXG4gICAgICAgICAgICB9YH1cbiAgICAgICAgICAgIG9uRHJhZ092ZXI9e2hhbmRsZURyYWdPdmVyfVxuICAgICAgICAgICAgb25EcmFnTGVhdmU9e2hhbmRsZURyYWdMZWF2ZX1cbiAgICAgICAgICAgIG9uRHJvcD17aGFuZGxlRHJvcH1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGZpbGVJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfVxuICAgICAgICAgICAgcm9sZT1cImJ1dHRvblwiXG4gICAgICAgICAgICB0YWJJbmRleD17MH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VXBsb2FkIGNsYXNzTmFtZT1cIm14LWF1dG8gaC04IHctOCB0ZXh0LW11dGVkLWZvcmVncm91bmRcIiAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwibXQtMiB0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICB7dCgnd29ya09yZGVycy5kcmFnVG9VcGxvYWQnLCAn5ouW5ou95paH5Lu25Yiw5q2k5aSE5oiW54K55Ye75LiK5LygJyl9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kLzYwXCI+XG4gICAgICAgICAgICAgIHt0KCd3b3JrT3JkZXJzLnVwbG9hZEhpbnQnLCAn5pSv5oyB5Zu+54mH44CBUERG44CB5paH5qGj44CB5Y6L57yp5YyF77yM5pyA5aSnIDIwTUInKX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICByZWY9e2ZpbGVJbnB1dFJlZn1cbiAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICBtdWx0aXBsZVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICBhY2NlcHQ9XCJpbWFnZS8qLC5wZGYsLmRvYywuZG9jeCwueGxzLC54bHN4LC56aXAsLnJhciwuN3osLnR4dCwuY3N2XCJcbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBoYW5kbGVGaWxlcyhlLnRhcmdldC5maWxlcyl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiDkuIrkvKDov5vluqYgKi99XG4gICAgICAgIHt1cGxvYWRNdXRhdGlvbi5pc1BlbmRpbmcgJiYgKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgIHt0KCd3b3JrT3JkZXJzLnVwbG9hZGluZycsICfmraPlnKjkuIrkvKAuLi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIOmZhOS7tuWIl+ihqCAqL31cbiAgICAgICAge2lzTG9hZGluZyA/IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZGluZycsICfliqDovb3kuK0uLi4nKX08L3A+XG4gICAgICAgICkgOiBhdHRhY2htZW50cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgIHt0KCd3b3JrT3JkZXJzLm5vQXR0YWNobWVudHMnLCAn5pqC5peg6ZmE5Lu2Jyl9XG4gICAgICAgICAgPC9wPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIHthdHRhY2htZW50cy5tYXAoKGF0dCkgPT4gKFxuICAgICAgICAgICAgICA8bGlcbiAgICAgICAgICAgICAgICBrZXk9e2F0dC5pZH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcm91bmRlZC1tZCBib3JkZXIgcHgtMyBweS0yXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgPEZpbGVUZXh0IGNsYXNzTmFtZT1cImgtNCB3LTQgc2hyaW5rLTAgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRydW5jYXRlIHRleHQtc21cIiB0aXRsZT17YXR0LmZpbGVOYW1lfT5cbiAgICAgICAgICAgICAgICAgICAge2F0dC5maWxlTmFtZX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNocmluay0wIHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICAgIHtmb3JtYXRGaWxlU2l6ZShhdHQuZmlsZVNpemUpfVxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZT1cImljb25cIlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTcgdy03XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlRG93bmxvYWQoYXR0LmlkKX1cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3QoJ2NvbW1vbi5kb3dubG9hZCcsICfkuIvovb0nKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPERvd25sb2FkIGNsYXNzTmFtZT1cImgtMy41IHctMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAge2NhbkVkaXQgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgICBzaXplPVwiaWNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC03IHctNyB0ZXh0LWRlc3RydWN0aXZlIGhvdmVyOnRleHQtZGVzdHJ1Y3RpdmVcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZURlbGV0ZShhdHQuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkZWxldGVNdXRhdGlvbi5pc1BlbmRpbmd9XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3QoJ2NvbW1vbi5kZWxldGUnLCAn5Yig6ZmkJyl9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cImgtMy41IHctMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgKX1cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgPC9DYXJkPlxuICApO1xufVxuIl19