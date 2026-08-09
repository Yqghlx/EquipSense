import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/dialog.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Dialog as DialogPrimitive } from "/node_modules/.vite/deps/@base-ui_react_dialog.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
import { Button } from "/src/components/ui/button.tsx";
import { XIcon } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dialog.tsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Dialog({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Root, {
		"data-slot": "dialog",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 9,
		columnNumber: 10
	}, this);
}
_c = Dialog;
function DialogTrigger({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Trigger, {
		"data-slot": "dialog-trigger",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 13,
		columnNumber: 10
	}, this);
}
_c2 = DialogTrigger;
function DialogPortal({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Portal, {
		"data-slot": "dialog-portal",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 17,
		columnNumber: 10
	}, this);
}
_c3 = DialogPortal;
function DialogClose({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Close, {
		"data-slot": "dialog-close",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 21,
		columnNumber: 10
	}, this);
}
_c4 = DialogClose;
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Backdrop, {
		"data-slot": "dialog-overlay",
		className: cn(
			// 注意：不要加 isolate / isolation，否则会创建层叠上下文，
			// 让同 z-index 的 select-content / popover-content 被 overlay 挡住，
			// 导致 Dialog 内的 Select/Combobox 选项不可点击。
			// 仅用 z-50 + bg-black/10 + backdrop-blur，让 overlay 与内容按 DOM 顺序自然层叠。
			"fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
			className
		),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 29,
		columnNumber: 5
	}, this);
}
_c5 = DialogOverlay;
function DialogContent({ className, children, showCloseButton = true, ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPortal, { children: [/* @__PURE__ */ _jsxDEV(DialogOverlay, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 54,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(DialogPrimitive.Popup, {
		"data-slot": "dialog-content",
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ _jsxDEV(DialogPrimitive.Close, {
			"data-slot": "dialog-close",
			render: /* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				className: "absolute top-2 right-2",
				size: "icon-sm"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 15
			}, this),
			children: [/* @__PURE__ */ _jsxDEV(XIcon, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 75,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV("span", {
				className: "sr-only",
				children: "Close"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 77,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 65,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 55,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 53,
		columnNumber: 5
	}, this);
}
_c6 = DialogContent;
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-slot": "dialog-header",
		className: cn("flex flex-col gap-2", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 87,
		columnNumber: 5
	}, this);
}
_c7 = DialogHeader;
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-slot": "dialog-footer",
		className: cn("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ _jsxDEV(DialogPrimitive.Close, {
			render: /* @__PURE__ */ _jsxDEV(Button, { variant: "outline" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 114,
				columnNumber: 40
			}, this),
			children: "Close"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 114,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 104,
		columnNumber: 5
	}, this);
}
_c8 = DialogFooter;
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Title, {
		"data-slot": "dialog-title",
		className: cn("font-heading text-base leading-none font-medium", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 124,
		columnNumber: 5
	}, this);
}
_c9 = DialogTitle;
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(DialogPrimitive.Description, {
		"data-slot": "dialog-description",
		className: cn("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 140,
		columnNumber: 5
	}, this);
}
_c10 = DialogDescription;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
$RefreshReg$(_c, "Dialog");
$RefreshReg$(_c2, "DialogTrigger");
$RefreshReg$(_c3, "DialogPortal");
$RefreshReg$(_c4, "DialogClose");
$RefreshReg$(_c5, "DialogOverlay");
$RefreshReg$(_c6, "DialogContent");
$RefreshReg$(_c7, "DialogHeader");
$RefreshReg$(_c8, "DialogFooter");
$RefreshReg$(_c9, "DialogTitle");
$RefreshReg$(_c10, "DialogDescription");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/dialog.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dialog.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dialog.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dialog.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsWUFBWSxXQUFXO0FBQ3ZCLFNBQVMsVUFBVSx1QkFBdUI7QUFFMUMsU0FBUyxVQUFVO0FBQ25CLFNBQVMsY0FBYztBQUN2QixTQUFTLGFBQWE7OztBQUV0QixTQUFTLE9BQU8sRUFBRSxHQUFHLFNBQXFDO0NBQ3hELE9BQU8sd0JBQUMsZ0JBQWdCLE1BQWpCO0VBQXNCLGFBQVU7RUFBUyxHQUFJO0NBQVE7Ozs7O0FBQzlEOztBQUVBLFNBQVMsY0FBYyxFQUFFLEdBQUcsU0FBd0M7Q0FDbEUsT0FBTyx3QkFBQyxnQkFBZ0IsU0FBakI7RUFBeUIsYUFBVTtFQUFpQixHQUFJO0NBQVE7Ozs7O0FBQ3pFOztBQUVBLFNBQVMsYUFBYSxFQUFFLEdBQUcsU0FBdUM7Q0FDaEUsT0FBTyx3QkFBQyxnQkFBZ0IsUUFBakI7RUFBd0IsYUFBVTtFQUFnQixHQUFJO0NBQVE7Ozs7O0FBQ3ZFOztBQUVBLFNBQVMsWUFBWSxFQUFFLEdBQUcsU0FBc0M7Q0FDOUQsT0FBTyx3QkFBQyxnQkFBZ0IsT0FBakI7RUFBdUIsYUFBVTtFQUFlLEdBQUk7Q0FBUTs7Ozs7QUFDckU7O0FBRUEsU0FBUyxjQUFjLEVBQ3JCLFdBQ0EsR0FBRyxTQUM4QjtDQUNqQyxPQUNFLHdCQUFDLGdCQUFnQixVQUFqQjtFQUNFLGFBQVU7RUFDVixXQUFXOzs7OztHQUtUO0dBQ0E7RUFDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLGNBQWMsRUFDckIsV0FDQSxVQUNBLGtCQUFrQixNQUNsQixHQUFHLFNBR0Y7Q0FDRCxPQUNFLHdCQUFDLGNBQUQsYUFDRSx3QkFBQyxlQUFELENBQWdCOzs7O1dBQ2hCLHdCQUFDLGdCQUFnQixPQUFqQjtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQ1QsMFdBQ0EsU0FDRjtFQUNBLEdBQUk7WUFOTixDQVFHLFVBQ0EsbUJBQ0Msd0JBQUMsZ0JBQWdCLE9BQWpCO0dBQ0UsYUFBVTtHQUNWLFFBQ0Usd0JBQUMsUUFBRDtJQUNFLFNBQVE7SUFDUixXQUFVO0lBQ1YsTUFBSztHQUNOOzs7OzthQVBMLENBVUUsd0JBQUMsT0FBRCxDQUNDOzs7O2FBQ0Qsd0JBQUMsUUFBRDtJQUFNLFdBQVU7Y0FBVTtHQUFXOzs7O1dBQ2hCOzs7OztVQUVKOzs7OztTQUNYOzs7OztBQUVsQjs7QUFFQSxTQUFTLGFBQWEsRUFBRSxXQUFXLEdBQUcsU0FBc0M7Q0FDMUUsT0FDRSx3QkFBQyxPQUFEO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FBRyx1QkFBdUIsU0FBUztFQUM5QyxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxhQUFhLEVBQ3BCLFdBQ0Esa0JBQWtCLE9BQ2xCLFVBQ0EsR0FBRyxTQUdGO0NBQ0QsT0FDRSx3QkFBQyxPQUFEO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FDVCw0R0FDQSxTQUNGO0VBQ0EsR0FBSTtZQU5OLENBUUcsVUFDQSxtQkFDQyx3QkFBQyxnQkFBZ0IsT0FBakI7R0FBdUIsUUFBUSx3QkFBQyxRQUFELEVBQVEsU0FBUSxVQUFXOzs7OzthQUFHO0VBRXRDOzs7O1VBRXRCOzs7Ozs7QUFFVDs7QUFFQSxTQUFTLFlBQVksRUFBRSxXQUFXLEdBQUcsU0FBc0M7Q0FDekUsT0FDRSx3QkFBQyxnQkFBZ0IsT0FBakI7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUNULG1EQUNBLFNBQ0Y7RUFDQSxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxrQkFBa0IsRUFDekIsV0FDQSxHQUFHLFNBQ2lDO0NBQ3BDLE9BQ0Usd0JBQUMsZ0JBQWdCLGFBQWpCO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FDVCxzR0FDQSxTQUNGO0VBQ0EsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLFNBQ0UsUUFDQSxhQUNBLGVBQ0EsbUJBQ0EsY0FDQSxjQUNBLGVBQ0EsY0FDQSxhQUNBIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbImRpYWxvZy50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCJcbmltcG9ydCB7IERpYWxvZyBhcyBEaWFsb2dQcmltaXRpdmUgfSBmcm9tIFwiQGJhc2UtdWkvcmVhY3QvZGlhbG9nXCJcblxuaW1wb3J0IHsgY24gfSBmcm9tIFwiQC9saWIvdXRpbHNcIlxuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSBcIkAvY29tcG9uZW50cy91aS9idXR0b25cIlxuaW1wb3J0IHsgWEljb24gfSBmcm9tIFwibHVjaWRlLXJlYWN0XCJcblxuZnVuY3Rpb24gRGlhbG9nKHsgLi4ucHJvcHMgfTogRGlhbG9nUHJpbWl0aXZlLlJvb3QuUHJvcHMpIHtcbiAgcmV0dXJuIDxEaWFsb2dQcmltaXRpdmUuUm9vdCBkYXRhLXNsb3Q9XCJkaWFsb2dcIiB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIERpYWxvZ1RyaWdnZXIoeyAuLi5wcm9wcyB9OiBEaWFsb2dQcmltaXRpdmUuVHJpZ2dlci5Qcm9wcykge1xuICByZXR1cm4gPERpYWxvZ1ByaW1pdGl2ZS5UcmlnZ2VyIGRhdGEtc2xvdD1cImRpYWxvZy10cmlnZ2VyXCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBEaWFsb2dQb3J0YWwoeyAuLi5wcm9wcyB9OiBEaWFsb2dQcmltaXRpdmUuUG9ydGFsLlByb3BzKSB7XG4gIHJldHVybiA8RGlhbG9nUHJpbWl0aXZlLlBvcnRhbCBkYXRhLXNsb3Q9XCJkaWFsb2ctcG9ydGFsXCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBEaWFsb2dDbG9zZSh7IC4uLnByb3BzIH06IERpYWxvZ1ByaW1pdGl2ZS5DbG9zZS5Qcm9wcykge1xuICByZXR1cm4gPERpYWxvZ1ByaW1pdGl2ZS5DbG9zZSBkYXRhLXNsb3Q9XCJkaWFsb2ctY2xvc2VcIiB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIERpYWxvZ092ZXJsYXkoe1xuICBjbGFzc05hbWUsXG4gIC4uLnByb3BzXG59OiBEaWFsb2dQcmltaXRpdmUuQmFja2Ryb3AuUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nUHJpbWl0aXZlLkJhY2tkcm9wXG4gICAgICBkYXRhLXNsb3Q9XCJkaWFsb2ctb3ZlcmxheVwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICAvLyDms6jmhI/vvJrkuI3opoHliqAgaXNvbGF0ZSAvIGlzb2xhdGlvbu+8jOWQpuWImeS8muWIm+W7uuWxguWPoOS4iuS4i+aWh++8jFxuICAgICAgICAvLyDorqnlkIwgei1pbmRleCDnmoQgc2VsZWN0LWNvbnRlbnQgLyBwb3BvdmVyLWNvbnRlbnQg6KKrIG92ZXJsYXkg5oyh5L2P77yMXG4gICAgICAgIC8vIOWvvOiHtCBEaWFsb2cg5YaF55qEIFNlbGVjdC9Db21ib2JveCDpgInpobnkuI3lj6/ngrnlh7vjgIJcbiAgICAgICAgLy8g5LuF55SoIHotNTAgKyBiZy1ibGFjay8xMCArIGJhY2tkcm9wLWJsdXLvvIzorqkgb3ZlcmxheSDkuI7lhoXlrrnmjIkgRE9NIOmhuuW6j+iHqueEtuWxguWPoOOAglxuICAgICAgICBcImZpeGVkIGluc2V0LTAgei01MCBiZy1ibGFjay8xMCBkdXJhdGlvbi0xMDAgc3VwcG9ydHMtYmFja2Ryb3AtZmlsdGVyOmJhY2tkcm9wLWJsdXIteHMgZGF0YS1vcGVuOmFuaW1hdGUtaW4gZGF0YS1vcGVuOmZhZGUtaW4tMCBkYXRhLWNsb3NlZDphbmltYXRlLW91dCBkYXRhLWNsb3NlZDpmYWRlLW91dC0wXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIERpYWxvZ0NvbnRlbnQoe1xuICBjbGFzc05hbWUsXG4gIGNoaWxkcmVuLFxuICBzaG93Q2xvc2VCdXR0b24gPSB0cnVlLFxuICAuLi5wcm9wc1xufTogRGlhbG9nUHJpbWl0aXZlLlBvcHVwLlByb3BzICYge1xuICBzaG93Q2xvc2VCdXR0b24/OiBib29sZWFuXG59KSB7XG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1BvcnRhbD5cbiAgICAgIDxEaWFsb2dPdmVybGF5IC8+XG4gICAgICA8RGlhbG9nUHJpbWl0aXZlLlBvcHVwXG4gICAgICAgIGRhdGEtc2xvdD1cImRpYWxvZy1jb250ZW50XCJcbiAgICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgICBcImZpeGVkIHRvcC0xLzIgbGVmdC0xLzIgei01MCBncmlkIHctZnVsbCBtYXgtdy1bY2FsYygxMDAlLTJyZW0pXSAtdHJhbnNsYXRlLXgtMS8yIC10cmFuc2xhdGUteS0xLzIgZ2FwLTQgcm91bmRlZC14bCBiZy1wb3BvdmVyIHAtNCB0ZXh0LXNtIHRleHQtcG9wb3Zlci1mb3JlZ3JvdW5kIHJpbmctMSByaW5nLWZvcmVncm91bmQvMTAgZHVyYXRpb24tMTAwIG91dGxpbmUtbm9uZSBzbTptYXgtdy1zbSBkYXRhLW9wZW46YW5pbWF0ZS1pbiBkYXRhLW9wZW46ZmFkZS1pbi0wIGRhdGEtb3Blbjp6b29tLWluLTk1IGRhdGEtY2xvc2VkOmFuaW1hdGUtb3V0IGRhdGEtY2xvc2VkOmZhZGUtb3V0LTAgZGF0YS1jbG9zZWQ6em9vbS1vdXQtOTVcIixcbiAgICAgICAgICBjbGFzc05hbWVcbiAgICAgICAgKX1cbiAgICAgICAgey4uLnByb3BzfVxuICAgICAgPlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgIHtzaG93Q2xvc2VCdXR0b24gJiYgKFxuICAgICAgICAgIDxEaWFsb2dQcmltaXRpdmUuQ2xvc2VcbiAgICAgICAgICAgIGRhdGEtc2xvdD1cImRpYWxvZy1jbG9zZVwiXG4gICAgICAgICAgICByZW5kZXI9e1xuICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMiByaWdodC0yXCJcbiAgICAgICAgICAgICAgICBzaXplPVwiaWNvbi1zbVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFhJY29uXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwic3Itb25seVwiPkNsb3NlPC9zcGFuPlxuICAgICAgICAgIDwvRGlhbG9nUHJpbWl0aXZlLkNsb3NlPlxuICAgICAgICApfVxuICAgICAgPC9EaWFsb2dQcmltaXRpdmUuUG9wdXA+XG4gICAgPC9EaWFsb2dQb3J0YWw+XG4gIClcbn1cblxuZnVuY3Rpb24gRGlhbG9nSGVhZGVyKHsgY2xhc3NOYW1lLCAuLi5wcm9wcyB9OiBSZWFjdC5Db21wb25lbnRQcm9wczxcImRpdlwiPikge1xuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIGRhdGEtc2xvdD1cImRpYWxvZy1oZWFkZXJcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcImZsZXggZmxleC1jb2wgZ2FwLTJcIiwgY2xhc3NOYW1lKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIERpYWxvZ0Zvb3Rlcih7XG4gIGNsYXNzTmFtZSxcbiAgc2hvd0Nsb3NlQnV0dG9uID0gZmFsc2UsXG4gIGNoaWxkcmVuLFxuICAuLi5wcm9wc1xufTogUmVhY3QuQ29tcG9uZW50UHJvcHM8XCJkaXZcIj4gJiB7XG4gIHNob3dDbG9zZUJ1dHRvbj86IGJvb2xlYW5cbn0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBkYXRhLXNsb3Q9XCJkaWFsb2ctZm9vdGVyXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiLW14LTQgLW1iLTQgZmxleCBmbGV4LWNvbC1yZXZlcnNlIGdhcC0yIHJvdW5kZWQtYi14bCBib3JkZXItdCBiZy1tdXRlZC81MCBwLTQgc206ZmxleC1yb3cgc206anVzdGlmeS1lbmRcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICAgIHtzaG93Q2xvc2VCdXR0b24gJiYgKFxuICAgICAgICA8RGlhbG9nUHJpbWl0aXZlLkNsb3NlIHJlbmRlcj17PEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIC8+fT5cbiAgICAgICAgICBDbG9zZVxuICAgICAgICA8L0RpYWxvZ1ByaW1pdGl2ZS5DbG9zZT5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRGlhbG9nVGl0bGUoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IERpYWxvZ1ByaW1pdGl2ZS5UaXRsZS5Qcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxEaWFsb2dQcmltaXRpdmUuVGl0bGVcbiAgICAgIGRhdGEtc2xvdD1cImRpYWxvZy10aXRsZVwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcImZvbnQtaGVhZGluZyB0ZXh0LWJhc2UgbGVhZGluZy1ub25lIGZvbnQtbWVkaXVtXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIERpYWxvZ0Rlc2NyaXB0aW9uKHtcbiAgY2xhc3NOYW1lLFxuICAuLi5wcm9wc1xufTogRGlhbG9nUHJpbWl0aXZlLkRlc2NyaXB0aW9uLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1ByaW1pdGl2ZS5EZXNjcmlwdGlvblxuICAgICAgZGF0YS1zbG90PVwiZGlhbG9nLWRlc2NyaXB0aW9uXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmQgKjpbYV06dW5kZXJsaW5lICo6W2FdOnVuZGVybGluZS1vZmZzZXQtMyAqOlthXTpob3Zlcjp0ZXh0LWZvcmVncm91bmRcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZXhwb3J0IHtcbiAgRGlhbG9nLFxuICBEaWFsb2dDbG9zZSxcbiAgRGlhbG9nQ29udGVudCxcbiAgRGlhbG9nRGVzY3JpcHRpb24sXG4gIERpYWxvZ0Zvb3RlcixcbiAgRGlhbG9nSGVhZGVyLFxuICBEaWFsb2dPdmVybGF5LFxuICBEaWFsb2dQb3J0YWwsXG4gIERpYWxvZ1RpdGxlLFxuICBEaWFsb2dUcmlnZ2VyLFxufVxuIl19