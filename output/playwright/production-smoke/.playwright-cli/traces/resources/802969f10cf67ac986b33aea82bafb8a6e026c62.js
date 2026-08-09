import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/sheet.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];"use client";
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Dialog as SheetPrimitive } from "/node_modules/.vite/deps/@base-ui_react_dialog.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
import { Button } from "/src/components/ui/button.tsx";
import { XIcon } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/sheet.tsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Sheet({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Root, {
		"data-slot": "sheet",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 11,
		columnNumber: 10
	}, this);
}
_c = Sheet;
function SheetTrigger({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Trigger, {
		"data-slot": "sheet-trigger",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 10
	}, this);
}
_c2 = SheetTrigger;
function SheetClose({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Close, {
		"data-slot": "sheet-close",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 19,
		columnNumber: 10
	}, this);
}
_c3 = SheetClose;
function SheetPortal({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Portal, {
		"data-slot": "sheet-portal",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 23,
		columnNumber: 10
	}, this);
}
_c4 = SheetPortal;
function SheetOverlay({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Backdrop, {
		"data-slot": "sheet-overlay",
		className: cn("fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 28,
		columnNumber: 5
	}, this);
}
_c5 = SheetOverlay;
function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPortal, { children: [/* @__PURE__ */ _jsxDEV(SheetOverlay, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 51,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(SheetPrimitive.Popup, {
		"data-slot": "sheet-content",
		"data-side": side,
		className: cn("fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ _jsxDEV(SheetPrimitive.Close, {
			"data-slot": "sheet-close",
			render: /* @__PURE__ */ _jsxDEV(Button, {
				variant: "ghost",
				className: "absolute top-3 right-3",
				size: "icon-sm"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 66,
				columnNumber: 15
			}, this),
			children: [/* @__PURE__ */ _jsxDEV(XIcon, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 73,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV("span", {
				className: "sr-only",
				children: "Close"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 75,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 63,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 52,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 50,
		columnNumber: 5
	}, this);
}
_c6 = SheetContent;
function SheetHeader({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-slot": "sheet-header",
		className: cn("flex flex-col gap-0.5 p-4", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 85,
		columnNumber: 5
	}, this);
}
_c7 = SheetHeader;
function SheetFooter({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-slot": "sheet-footer",
		className: cn("mt-auto flex flex-col gap-2 p-4", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 95,
		columnNumber: 5
	}, this);
}
_c8 = SheetFooter;
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Title, {
		"data-slot": "sheet-title",
		className: cn("font-heading text-base font-medium text-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 105,
		columnNumber: 5
	}, this);
}
_c9 = SheetTitle;
function SheetDescription({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SheetPrimitive.Description, {
		"data-slot": "sheet-description",
		className: cn("text-sm text-muted-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 121,
		columnNumber: 5
	}, this);
}
_c10 = SheetDescription;
export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
$RefreshReg$(_c, "Sheet");
$RefreshReg$(_c2, "SheetTrigger");
$RefreshReg$(_c3, "SheetClose");
$RefreshReg$(_c4, "SheetPortal");
$RefreshReg$(_c5, "SheetOverlay");
$RefreshReg$(_c6, "SheetContent");
$RefreshReg$(_c7, "SheetHeader");
$RefreshReg$(_c8, "SheetFooter");
$RefreshReg$(_c9, "SheetTitle");
$RefreshReg$(_c10, "SheetDescription");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/sheet.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/sheet.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/sheet.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/sheet.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUE7QUFFQSxZQUFZLFdBQVc7QUFDdkIsU0FBUyxVQUFVLHNCQUFzQjtBQUV6QyxTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsYUFBYTs7O0FBRXRCLFNBQVMsTUFBTSxFQUFFLEdBQUcsU0FBb0M7Q0FDdEQsT0FBTyx3QkFBQyxlQUFlLE1BQWhCO0VBQXFCLGFBQVU7RUFBUSxHQUFJO0NBQVE7Ozs7O0FBQzVEOztBQUVBLFNBQVMsYUFBYSxFQUFFLEdBQUcsU0FBdUM7Q0FDaEUsT0FBTyx3QkFBQyxlQUFlLFNBQWhCO0VBQXdCLGFBQVU7RUFBZ0IsR0FBSTtDQUFROzs7OztBQUN2RTs7QUFFQSxTQUFTLFdBQVcsRUFBRSxHQUFHLFNBQXFDO0NBQzVELE9BQU8sd0JBQUMsZUFBZSxPQUFoQjtFQUFzQixhQUFVO0VBQWMsR0FBSTtDQUFROzs7OztBQUNuRTs7QUFFQSxTQUFTLFlBQVksRUFBRSxHQUFHLFNBQXNDO0NBQzlELE9BQU8sd0JBQUMsZUFBZSxRQUFoQjtFQUF1QixhQUFVO0VBQWUsR0FBSTtDQUFROzs7OztBQUNyRTs7QUFFQSxTQUFTLGFBQWEsRUFBRSxXQUFXLEdBQUcsU0FBd0M7Q0FDNUUsT0FDRSx3QkFBQyxlQUFlLFVBQWhCO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FDVCxzS0FDQSxTQUNGO0VBQ0EsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLFNBQVMsYUFBYSxFQUNwQixXQUNBLFVBQ0EsT0FBTyxTQUNQLGtCQUFrQixNQUNsQixHQUFHLFNBSUY7Q0FDRCxPQUNFLHdCQUFDLGFBQUQsYUFDRSx3QkFBQyxjQUFELENBQWU7Ozs7V0FDZix3QkFBQyxlQUFlLE9BQWhCO0VBQ0UsYUFBVTtFQUNWLGFBQVc7RUFDWCxXQUFXLEdBQ1QsNnBDQUNBLFNBQ0Y7RUFDQSxHQUFJO1lBUE4sQ0FTRyxVQUNBLG1CQUNDLHdCQUFDLGVBQWUsT0FBaEI7R0FDRSxhQUFVO0dBQ1YsUUFDRSx3QkFBQyxRQUFEO0lBQ0UsU0FBUTtJQUNSLFdBQVU7SUFDVixNQUFLO0dBQ047Ozs7O2FBUEwsQ0FVRSx3QkFBQyxPQUFELENBQ0M7Ozs7YUFDRCx3QkFBQyxRQUFEO0lBQU0sV0FBVTtjQUFVO0dBQVc7Ozs7V0FDakI7Ozs7O1VBRUo7Ozs7O1NBQ1g7Ozs7O0FBRWpCOztBQUVBLFNBQVMsWUFBWSxFQUFFLFdBQVcsR0FBRyxTQUFzQztDQUN6RSxPQUNFLHdCQUFDLE9BQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUFHLDZCQUE2QixTQUFTO0VBQ3BELEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLFlBQVksRUFBRSxXQUFXLEdBQUcsU0FBc0M7Q0FDekUsT0FDRSx3QkFBQyxPQUFEO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FBRyxtQ0FBbUMsU0FBUztFQUMxRCxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxXQUFXLEVBQUUsV0FBVyxHQUFHLFNBQXFDO0NBQ3ZFLE9BQ0Usd0JBQUMsZUFBZSxPQUFoQjtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQ1Qsc0RBQ0EsU0FDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLGlCQUFpQixFQUN4QixXQUNBLEdBQUcsU0FDZ0M7Q0FDbkMsT0FDRSx3QkFBQyxlQUFlLGFBQWhCO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FBRyxpQ0FBaUMsU0FBUztFQUN4RCxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FDRSxPQUNBLGNBQ0EsWUFDQSxjQUNBLGFBQ0EsYUFDQSxZQUNBIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbInNoZWV0LnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBjbGllbnRcIlxuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IHsgRGlhbG9nIGFzIFNoZWV0UHJpbWl0aXZlIH0gZnJvbSBcIkBiYXNlLXVpL3JlYWN0L2RpYWxvZ1wiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gXCJAL2NvbXBvbmVudHMvdWkvYnV0dG9uXCJcbmltcG9ydCB7IFhJY29uIH0gZnJvbSBcImx1Y2lkZS1yZWFjdFwiXG5cbmZ1bmN0aW9uIFNoZWV0KHsgLi4ucHJvcHMgfTogU2hlZXRQcmltaXRpdmUuUm9vdC5Qcm9wcykge1xuICByZXR1cm4gPFNoZWV0UHJpbWl0aXZlLlJvb3QgZGF0YS1zbG90PVwic2hlZXRcIiB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIFNoZWV0VHJpZ2dlcih7IC4uLnByb3BzIH06IFNoZWV0UHJpbWl0aXZlLlRyaWdnZXIuUHJvcHMpIHtcbiAgcmV0dXJuIDxTaGVldFByaW1pdGl2ZS5UcmlnZ2VyIGRhdGEtc2xvdD1cInNoZWV0LXRyaWdnZXJcIiB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIFNoZWV0Q2xvc2UoeyAuLi5wcm9wcyB9OiBTaGVldFByaW1pdGl2ZS5DbG9zZS5Qcm9wcykge1xuICByZXR1cm4gPFNoZWV0UHJpbWl0aXZlLkNsb3NlIGRhdGEtc2xvdD1cInNoZWV0LWNsb3NlXCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBTaGVldFBvcnRhbCh7IC4uLnByb3BzIH06IFNoZWV0UHJpbWl0aXZlLlBvcnRhbC5Qcm9wcykge1xuICByZXR1cm4gPFNoZWV0UHJpbWl0aXZlLlBvcnRhbCBkYXRhLXNsb3Q9XCJzaGVldC1wb3J0YWxcIiB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIFNoZWV0T3ZlcmxheSh7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogU2hlZXRQcmltaXRpdmUuQmFja2Ryb3AuUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8U2hlZXRQcmltaXRpdmUuQmFja2Ryb3BcbiAgICAgIGRhdGEtc2xvdD1cInNoZWV0LW92ZXJsYXlcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJmaXhlZCBpbnNldC0wIHotNTAgYmctYmxhY2svMTAgdHJhbnNpdGlvbi1vcGFjaXR5IGR1cmF0aW9uLTE1MCBkYXRhLWVuZGluZy1zdHlsZTpvcGFjaXR5LTAgZGF0YS1zdGFydGluZy1zdHlsZTpvcGFjaXR5LTAgc3VwcG9ydHMtYmFja2Ryb3AtZmlsdGVyOmJhY2tkcm9wLWJsdXIteHNcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gU2hlZXRDb250ZW50KHtcbiAgY2xhc3NOYW1lLFxuICBjaGlsZHJlbixcbiAgc2lkZSA9IFwicmlnaHRcIixcbiAgc2hvd0Nsb3NlQnV0dG9uID0gdHJ1ZSxcbiAgLi4ucHJvcHNcbn06IFNoZWV0UHJpbWl0aXZlLlBvcHVwLlByb3BzICYge1xuICBzaWRlPzogXCJ0b3BcIiB8IFwicmlnaHRcIiB8IFwiYm90dG9tXCIgfCBcImxlZnRcIlxuICBzaG93Q2xvc2VCdXR0b24/OiBib29sZWFuXG59KSB7XG4gIHJldHVybiAoXG4gICAgPFNoZWV0UG9ydGFsPlxuICAgICAgPFNoZWV0T3ZlcmxheSAvPlxuICAgICAgPFNoZWV0UHJpbWl0aXZlLlBvcHVwXG4gICAgICAgIGRhdGEtc2xvdD1cInNoZWV0LWNvbnRlbnRcIlxuICAgICAgICBkYXRhLXNpZGU9e3NpZGV9XG4gICAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgICAgXCJmaXhlZCB6LTUwIGZsZXggZmxleC1jb2wgZ2FwLTQgYmctcG9wb3ZlciBiZy1jbGlwLXBhZGRpbmcgdGV4dC1zbSB0ZXh0LXBvcG92ZXItZm9yZWdyb3VuZCBzaGFkb3ctbGcgdHJhbnNpdGlvbiBkdXJhdGlvbi0yMDAgZWFzZS1pbi1vdXQgZGF0YS1lbmRpbmctc3R5bGU6b3BhY2l0eS0wIGRhdGEtc3RhcnRpbmctc3R5bGU6b3BhY2l0eS0wIGRhdGEtW3NpZGU9Ym90dG9tXTppbnNldC14LTAgZGF0YS1bc2lkZT1ib3R0b21dOmJvdHRvbS0wIGRhdGEtW3NpZGU9Ym90dG9tXTpoLWF1dG8gZGF0YS1bc2lkZT1ib3R0b21dOmJvcmRlci10IGRhdGEtW3NpZGU9Ym90dG9tXTpkYXRhLWVuZGluZy1zdHlsZTp0cmFuc2xhdGUteS1bMi41cmVtXSBkYXRhLVtzaWRlPWJvdHRvbV06ZGF0YS1zdGFydGluZy1zdHlsZTp0cmFuc2xhdGUteS1bMi41cmVtXSBkYXRhLVtzaWRlPWxlZnRdOmluc2V0LXktMCBkYXRhLVtzaWRlPWxlZnRdOmxlZnQtMCBkYXRhLVtzaWRlPWxlZnRdOmgtZnVsbCBkYXRhLVtzaWRlPWxlZnRdOnctMy80IGRhdGEtW3NpZGU9bGVmdF06Ym9yZGVyLXIgZGF0YS1bc2lkZT1sZWZ0XTpkYXRhLWVuZGluZy1zdHlsZTp0cmFuc2xhdGUteC1bLTIuNXJlbV0gZGF0YS1bc2lkZT1sZWZ0XTpkYXRhLXN0YXJ0aW5nLXN0eWxlOnRyYW5zbGF0ZS14LVstMi41cmVtXSBkYXRhLVtzaWRlPXJpZ2h0XTppbnNldC15LTAgZGF0YS1bc2lkZT1yaWdodF06cmlnaHQtMCBkYXRhLVtzaWRlPXJpZ2h0XTpoLWZ1bGwgZGF0YS1bc2lkZT1yaWdodF06dy0zLzQgZGF0YS1bc2lkZT1yaWdodF06Ym9yZGVyLWwgZGF0YS1bc2lkZT1yaWdodF06ZGF0YS1lbmRpbmctc3R5bGU6dHJhbnNsYXRlLXgtWzIuNXJlbV0gZGF0YS1bc2lkZT1yaWdodF06ZGF0YS1zdGFydGluZy1zdHlsZTp0cmFuc2xhdGUteC1bMi41cmVtXSBkYXRhLVtzaWRlPXRvcF06aW5zZXQteC0wIGRhdGEtW3NpZGU9dG9wXTp0b3AtMCBkYXRhLVtzaWRlPXRvcF06aC1hdXRvIGRhdGEtW3NpZGU9dG9wXTpib3JkZXItYiBkYXRhLVtzaWRlPXRvcF06ZGF0YS1lbmRpbmctc3R5bGU6dHJhbnNsYXRlLXktWy0yLjVyZW1dIGRhdGEtW3NpZGU9dG9wXTpkYXRhLXN0YXJ0aW5nLXN0eWxlOnRyYW5zbGF0ZS15LVstMi41cmVtXSBkYXRhLVtzaWRlPWxlZnRdOnNtOm1heC13LXNtIGRhdGEtW3NpZGU9cmlnaHRdOnNtOm1heC13LXNtXCIsXG4gICAgICAgICAgY2xhc3NOYW1lXG4gICAgICAgICl9XG4gICAgICAgIHsuLi5wcm9wc31cbiAgICAgID5cbiAgICAgICAge2NoaWxkcmVufVxuICAgICAgICB7c2hvd0Nsb3NlQnV0dG9uICYmIChcbiAgICAgICAgICA8U2hlZXRQcmltaXRpdmUuQ2xvc2VcbiAgICAgICAgICAgIGRhdGEtc2xvdD1cInNoZWV0LWNsb3NlXCJcbiAgICAgICAgICAgIHJlbmRlcj17XG4gICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICB2YXJpYW50PVwiZ2hvc3RcIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIHRvcC0zIHJpZ2h0LTNcIlxuICAgICAgICAgICAgICAgIHNpemU9XCJpY29uLXNtXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8WEljb25cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+Q2xvc2U8L3NwYW4+XG4gICAgICAgICAgPC9TaGVldFByaW1pdGl2ZS5DbG9zZT5cbiAgICAgICAgKX1cbiAgICAgIDwvU2hlZXRQcmltaXRpdmUuUG9wdXA+XG4gICAgPC9TaGVldFBvcnRhbD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTaGVldEhlYWRlcih7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogUmVhY3QuQ29tcG9uZW50UHJvcHM8XCJkaXZcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBkYXRhLXNsb3Q9XCJzaGVldC1oZWFkZXJcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcImZsZXggZmxleC1jb2wgZ2FwLTAuNSBwLTRcIiwgY2xhc3NOYW1lKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIFNoZWV0Rm9vdGVyKHsgY2xhc3NOYW1lLCAuLi5wcm9wcyB9OiBSZWFjdC5Db21wb25lbnRQcm9wczxcImRpdlwiPikge1xuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIGRhdGEtc2xvdD1cInNoZWV0LWZvb3RlclwiXG4gICAgICBjbGFzc05hbWU9e2NuKFwibXQtYXV0byBmbGV4IGZsZXgtY29sIGdhcC0yIHAtNFwiLCBjbGFzc05hbWUpfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gU2hlZXRUaXRsZSh7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogU2hlZXRQcmltaXRpdmUuVGl0bGUuUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8U2hlZXRQcmltaXRpdmUuVGl0bGVcbiAgICAgIGRhdGEtc2xvdD1cInNoZWV0LXRpdGxlXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiZm9udC1oZWFkaW5nIHRleHQtYmFzZSBmb250LW1lZGl1bSB0ZXh0LWZvcmVncm91bmRcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gU2hlZXREZXNjcmlwdGlvbih7XG4gIGNsYXNzTmFtZSxcbiAgLi4ucHJvcHNcbn06IFNoZWV0UHJpbWl0aXZlLkRlc2NyaXB0aW9uLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFNoZWV0UHJpbWl0aXZlLkRlc2NyaXB0aW9uXG4gICAgICBkYXRhLXNsb3Q9XCJzaGVldC1kZXNjcmlwdGlvblwiXG4gICAgICBjbGFzc05hbWU9e2NuKFwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIiwgY2xhc3NOYW1lKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCB7XG4gIFNoZWV0LFxuICBTaGVldFRyaWdnZXIsXG4gIFNoZWV0Q2xvc2UsXG4gIFNoZWV0Q29udGVudCxcbiAgU2hlZXRIZWFkZXIsXG4gIFNoZWV0Rm9vdGVyLFxuICBTaGVldFRpdGxlLFxuICBTaGVldERlc2NyaXB0aW9uLFxufVxuIl19