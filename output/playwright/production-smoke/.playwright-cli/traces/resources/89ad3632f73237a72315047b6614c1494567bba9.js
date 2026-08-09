import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/select.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport4_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Select as SelectPrimitive } from "/node_modules/.vite/deps/@base-ui_react_select.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/select.tsx";
import __vite__cjsImport4_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
const Select = SelectPrimitive.Root;
function SelectGroup({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Group, {
		"data-slot": "select-group",
		className: cn("scroll-my-1 p-1", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 11,
		columnNumber: 5
	}, this);
}
_c = SelectGroup;
function SelectValue({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Value, {
		"data-slot": "select-value",
		className: cn("flex flex-1 text-left", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 21,
		columnNumber: 5
	}, this);
}
_c2 = SelectValue;
function SelectTrigger({ className, size = "default", children, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Trigger, {
		"data-slot": "select-trigger",
		"data-size": size,
		className: cn("flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ _jsxDEV(SelectPrimitive.Icon, { render: /* @__PURE__ */ _jsxDEV(ChevronDownIcon, { className: "pointer-events-none size-4 text-muted-foreground" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 50,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 48,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 38,
		columnNumber: 5
	}, this);
}
_c3 = SelectTrigger;
function SelectContent({ className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Portal, { children: /* @__PURE__ */ _jsxDEV(SelectPrimitive.Positioner, {
		side,
		sideOffset,
		align,
		alignOffset,
		alignItemWithTrigger,
		className: "isolate z-50",
		children: /* @__PURE__ */ _jsxDEV(SelectPrimitive.Popup, {
			"data-slot": "select-content",
			"data-align-trigger": alignItemWithTrigger,
			className: cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props,
			children: [
				/* @__PURE__ */ _jsxDEV(SelectScrollUpButton, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 87,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(SelectPrimitive.List, { children }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 88,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(SelectScrollDownButton, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 89,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 81,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 73,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 72,
		columnNumber: 5
	}, this);
}
_c4 = SelectContent;
function SelectLabel({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.GroupLabel, {
		"data-slot": "select-label",
		className: cn("px-1.5 py-1 text-xs text-muted-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 101,
		columnNumber: 5
	}, this);
}
_c5 = SelectLabel;
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Item, {
		"data-slot": "select-item",
		className: cn("relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className),
		...props,
		children: [/* @__PURE__ */ _jsxDEV(SelectPrimitive.ItemText, {
			className: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
			children
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 123,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV(SelectPrimitive.ItemIndicator, {
			render: /* @__PURE__ */ _jsxDEV("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 128,
				columnNumber: 11
			}, this),
			children: /* @__PURE__ */ _jsxDEV(CheckIcon, { className: "pointer-events-none" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 131,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 126,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 115,
		columnNumber: 5
	}, this);
}
_c6 = SelectItem;
function SelectSeparator({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.Separator, {
		"data-slot": "select-separator",
		className: cn("pointer-events-none -mx-1 my-1 h-px bg-border", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 142,
		columnNumber: 5
	}, this);
}
_c7 = SelectSeparator;
function SelectScrollUpButton({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.ScrollUpArrow, {
		"data-slot": "select-scroll-up-button",
		className: cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ _jsxDEV(ChevronUpIcon, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 163,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 155,
		columnNumber: 5
	}, this);
}
_c8 = SelectScrollUpButton;
function SelectScrollDownButton({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(SelectPrimitive.ScrollDownArrow, {
		"data-slot": "select-scroll-down-button",
		className: cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ _jsxDEV(ChevronDownIcon, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 182,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 174,
		columnNumber: 5
	}, this);
}
_c9 = SelectScrollDownButton;
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
$RefreshReg$(_c, "SelectGroup");
$RefreshReg$(_c2, "SelectValue");
$RefreshReg$(_c3, "SelectTrigger");
$RefreshReg$(_c4, "SelectContent");
$RefreshReg$(_c5, "SelectLabel");
$RefreshReg$(_c6, "SelectItem");
$RefreshReg$(_c7, "SelectSeparator");
$RefreshReg$(_c8, "SelectScrollUpButton");
$RefreshReg$(_c9, "SelectScrollDownButton");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/select.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/select.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/select.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/select.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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d0JBQUMsZ0JBQWdCLGlCQUFqQjtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQ1QsNkhBQ0EsU0FDRjtFQUNBLEdBQUk7WUFFSix3QkFBQyxpQkFBRCxDQUNDOzs7OztDQUM4Qjs7Ozs7QUFFckM7O0FBRUEsU0FDRSxRQUNBLGVBQ0EsYUFDQSxZQUNBLGFBQ0Esd0JBQ0Esc0JBQ0EsaUJBQ0EsZUFDQSIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJzZWxlY3QudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5pbXBvcnQgeyBTZWxlY3QgYXMgU2VsZWN0UHJpbWl0aXZlIH0gZnJvbSBcIkBiYXNlLXVpL3JlYWN0L3NlbGVjdFwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcbmltcG9ydCB7IENoZXZyb25Eb3duSWNvbiwgQ2hlY2tJY29uLCBDaGV2cm9uVXBJY29uIH0gZnJvbSBcImx1Y2lkZS1yZWFjdFwiXG5cbmNvbnN0IFNlbGVjdCA9IFNlbGVjdFByaW1pdGl2ZS5Sb290XG5cbmZ1bmN0aW9uIFNlbGVjdEdyb3VwKHsgY2xhc3NOYW1lLCAuLi5wcm9wcyB9OiBTZWxlY3RQcmltaXRpdmUuR3JvdXAuUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8U2VsZWN0UHJpbWl0aXZlLkdyb3VwXG4gICAgICBkYXRhLXNsb3Q9XCJzZWxlY3QtZ3JvdXBcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcInNjcm9sbC1teS0xIHAtMVwiLCBjbGFzc05hbWUpfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0VmFsdWUoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFNlbGVjdFByaW1pdGl2ZS5WYWx1ZS5Qcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxTZWxlY3RQcmltaXRpdmUuVmFsdWVcbiAgICAgIGRhdGEtc2xvdD1cInNlbGVjdC12YWx1ZVwiXG4gICAgICBjbGFzc05hbWU9e2NuKFwiZmxleCBmbGV4LTEgdGV4dC1sZWZ0XCIsIGNsYXNzTmFtZSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RUcmlnZ2VyKHtcbiAgY2xhc3NOYW1lLFxuICBzaXplID0gXCJkZWZhdWx0XCIsXG4gIGNoaWxkcmVuLFxuICAuLi5wcm9wc1xufTogU2VsZWN0UHJpbWl0aXZlLlRyaWdnZXIuUHJvcHMgJiB7XG4gIHNpemU/OiBcInNtXCIgfCBcImRlZmF1bHRcIlxufSkge1xuICByZXR1cm4gKFxuICAgIDxTZWxlY3RQcmltaXRpdmUuVHJpZ2dlclxuICAgICAgZGF0YS1zbG90PVwic2VsZWN0LXRyaWdnZXJcIlxuICAgICAgZGF0YS1zaXplPXtzaXplfVxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJmbGV4IHctZml0IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTEuNSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItaW5wdXQgYmctdHJhbnNwYXJlbnQgcHktMiBwci0yIHBsLTIuNSB0ZXh0LXNtIHdoaXRlc3BhY2Utbm93cmFwIHRyYW5zaXRpb24tY29sb3JzIG91dGxpbmUtbm9uZSBzZWxlY3Qtbm9uZSBmb2N1cy12aXNpYmxlOmJvcmRlci1yaW5nIGZvY3VzLXZpc2libGU6cmluZy0zIGZvY3VzLXZpc2libGU6cmluZy1yaW5nLzUwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTUwIGFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUgYXJpYS1pbnZhbGlkOnJpbmctMyBhcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS8yMCBkYXRhLXBsYWNlaG9sZGVyOnRleHQtbXV0ZWQtZm9yZWdyb3VuZCBkYXRhLVtzaXplPWRlZmF1bHRdOmgtOCBkYXRhLVtzaXplPXNtXTpoLTcgZGF0YS1bc2l6ZT1zbV06cm91bmRlZC1bbWluKHZhcigtLXJhZGl1cy1tZCksMTBweCldICo6ZGF0YS1bc2xvdD1zZWxlY3QtdmFsdWVdOmxpbmUtY2xhbXAtMSAqOmRhdGEtW3Nsb3Q9c2VsZWN0LXZhbHVlXTpmbGV4ICo6ZGF0YS1bc2xvdD1zZWxlY3QtdmFsdWVdOml0ZW1zLWNlbnRlciAqOmRhdGEtW3Nsb3Q9c2VsZWN0LXZhbHVlXTpnYXAtMS41IGRhcms6YmctaW5wdXQvMzAgZGFyazpob3ZlcjpiZy1pbnB1dC81MCBkYXJrOmFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUvNTAgZGFyazphcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS80MCBbJl9zdmddOnBvaW50ZXItZXZlbnRzLW5vbmUgWyZfc3ZnXTpzaHJpbmstMCBbJl9zdmc6bm90KFtjbGFzcyo9J3NpemUtJ10pXTpzaXplLTRcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDxTZWxlY3RQcmltaXRpdmUuSWNvblxuICAgICAgICByZW5kZXI9e1xuICAgICAgICAgIDxDaGV2cm9uRG93bkljb24gY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBzaXplLTQgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgLz5cbiAgICAgICAgfVxuICAgICAgLz5cbiAgICA8L1NlbGVjdFByaW1pdGl2ZS5UcmlnZ2VyPlxuICApXG59XG5cbmZ1bmN0aW9uIFNlbGVjdENvbnRlbnQoe1xuICBjbGFzc05hbWUsXG4gIGNoaWxkcmVuLFxuICBzaWRlID0gXCJib3R0b21cIixcbiAgc2lkZU9mZnNldCA9IDQsXG4gIGFsaWduID0gXCJjZW50ZXJcIixcbiAgYWxpZ25PZmZzZXQgPSAwLFxuICBhbGlnbkl0ZW1XaXRoVHJpZ2dlciA9IHRydWUsXG4gIC4uLnByb3BzXG59OiBTZWxlY3RQcmltaXRpdmUuUG9wdXAuUHJvcHMgJlxuICBQaWNrPFxuICAgIFNlbGVjdFByaW1pdGl2ZS5Qb3NpdGlvbmVyLlByb3BzLFxuICAgIFwiYWxpZ25cIiB8IFwiYWxpZ25PZmZzZXRcIiB8IFwic2lkZVwiIHwgXCJzaWRlT2Zmc2V0XCIgfCBcImFsaWduSXRlbVdpdGhUcmlnZ2VyXCJcbiAgPikge1xuICByZXR1cm4gKFxuICAgIDxTZWxlY3RQcmltaXRpdmUuUG9ydGFsPlxuICAgICAgPFNlbGVjdFByaW1pdGl2ZS5Qb3NpdGlvbmVyXG4gICAgICAgIHNpZGU9e3NpZGV9XG4gICAgICAgIHNpZGVPZmZzZXQ9e3NpZGVPZmZzZXR9XG4gICAgICAgIGFsaWduPXthbGlnbn1cbiAgICAgICAgYWxpZ25PZmZzZXQ9e2FsaWduT2Zmc2V0fVxuICAgICAgICBhbGlnbkl0ZW1XaXRoVHJpZ2dlcj17YWxpZ25JdGVtV2l0aFRyaWdnZXJ9XG4gICAgICAgIGNsYXNzTmFtZT1cImlzb2xhdGUgei01MFwiXG4gICAgICA+XG4gICAgICAgIDxTZWxlY3RQcmltaXRpdmUuUG9wdXBcbiAgICAgICAgICBkYXRhLXNsb3Q9XCJzZWxlY3QtY29udGVudFwiXG4gICAgICAgICAgZGF0YS1hbGlnbi10cmlnZ2VyPXthbGlnbkl0ZW1XaXRoVHJpZ2dlcn1cbiAgICAgICAgICBjbGFzc05hbWU9e2NuKFwicmVsYXRpdmUgaXNvbGF0ZSB6LTUwIG1heC1oLSgtLWF2YWlsYWJsZS1oZWlnaHQpIHctKC0tYW5jaG9yLXdpZHRoKSBtaW4tdy0zNiBvcmlnaW4tKC0tdHJhbnNmb3JtLW9yaWdpbikgb3ZlcmZsb3cteC1oaWRkZW4gb3ZlcmZsb3cteS1hdXRvIHJvdW5kZWQtbGcgYmctcG9wb3ZlciB0ZXh0LXBvcG92ZXItZm9yZWdyb3VuZCBzaGFkb3ctbWQgcmluZy0xIHJpbmctZm9yZWdyb3VuZC8xMCBkdXJhdGlvbi0xMDAgZGF0YS1bYWxpZ24tdHJpZ2dlcj10cnVlXTphbmltYXRlLW5vbmUgZGF0YS1bc2lkZT1ib3R0b21dOnNsaWRlLWluLWZyb20tdG9wLTIgZGF0YS1bc2lkZT1pbmxpbmUtZW5kXTpzbGlkZS1pbi1mcm9tLWxlZnQtMiBkYXRhLVtzaWRlPWlubGluZS1zdGFydF06c2xpZGUtaW4tZnJvbS1yaWdodC0yIGRhdGEtW3NpZGU9bGVmdF06c2xpZGUtaW4tZnJvbS1yaWdodC0yIGRhdGEtW3NpZGU9cmlnaHRdOnNsaWRlLWluLWZyb20tbGVmdC0yIGRhdGEtW3NpZGU9dG9wXTpzbGlkZS1pbi1mcm9tLWJvdHRvbS0yIGRhdGEtb3BlbjphbmltYXRlLWluIGRhdGEtb3BlbjpmYWRlLWluLTAgZGF0YS1vcGVuOnpvb20taW4tOTUgZGF0YS1jbG9zZWQ6YW5pbWF0ZS1vdXQgZGF0YS1jbG9zZWQ6ZmFkZS1vdXQtMCBkYXRhLWNsb3NlZDp6b29tLW91dC05NVwiLCBjbGFzc05hbWUgKX1cbiAgICAgICAgICB7Li4ucHJvcHN9XG4gICAgICAgID5cbiAgICAgICAgICA8U2VsZWN0U2Nyb2xsVXBCdXR0b24gLz5cbiAgICAgICAgICA8U2VsZWN0UHJpbWl0aXZlLkxpc3Q+e2NoaWxkcmVufTwvU2VsZWN0UHJpbWl0aXZlLkxpc3Q+XG4gICAgICAgICAgPFNlbGVjdFNjcm9sbERvd25CdXR0b24gLz5cbiAgICAgICAgPC9TZWxlY3RQcmltaXRpdmUuUG9wdXA+XG4gICAgICA8L1NlbGVjdFByaW1pdGl2ZS5Qb3NpdGlvbmVyPlxuICAgIDwvU2VsZWN0UHJpbWl0aXZlLlBvcnRhbD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RMYWJlbCh7XG4gIGNsYXNzTmFtZSxcbiAgLi4ucHJvcHNcbn06IFNlbGVjdFByaW1pdGl2ZS5Hcm91cExhYmVsLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFNlbGVjdFByaW1pdGl2ZS5Hcm91cExhYmVsXG4gICAgICBkYXRhLXNsb3Q9XCJzZWxlY3QtbGFiZWxcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcInB4LTEuNSBweS0xIHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIsIGNsYXNzTmFtZSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RJdGVtKHtcbiAgY2xhc3NOYW1lLFxuICBjaGlsZHJlbixcbiAgLi4ucHJvcHNcbn06IFNlbGVjdFByaW1pdGl2ZS5JdGVtLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFNlbGVjdFByaW1pdGl2ZS5JdGVtXG4gICAgICBkYXRhLXNsb3Q9XCJzZWxlY3QtaXRlbVwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcInJlbGF0aXZlIGZsZXggdy1mdWxsIGN1cnNvci1kZWZhdWx0IGl0ZW1zLWNlbnRlciBnYXAtMS41IHJvdW5kZWQtbWQgcHktMSBwci04IHBsLTEuNSB0ZXh0LXNtIG91dGxpbmUtaGlkZGVuIHNlbGVjdC1ub25lIGZvY3VzOmJnLWFjY2VudCBmb2N1czp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIG5vdC1kYXRhLVt2YXJpYW50PWRlc3RydWN0aXZlXTpmb2N1czoqKjp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIGRhdGEtZGlzYWJsZWQ6cG9pbnRlci1ldmVudHMtbm9uZSBkYXRhLWRpc2FibGVkOm9wYWNpdHktNTAgWyZfc3ZnXTpwb2ludGVyLWV2ZW50cy1ub25lIFsmX3N2Z106c2hyaW5rLTAgWyZfc3ZnOm5vdChbY2xhc3MqPSdzaXplLSddKV06c2l6ZS00ICo6W3NwYW5dOmxhc3Q6ZmxleCAqOltzcGFuXTpsYXN0Oml0ZW1zLWNlbnRlciAqOltzcGFuXTpsYXN0OmdhcC0yXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICA+XG4gICAgICA8U2VsZWN0UHJpbWl0aXZlLkl0ZW1UZXh0IGNsYXNzTmFtZT1cImZsZXggZmxleC0xIHNocmluay0wIGdhcC0yIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvU2VsZWN0UHJpbWl0aXZlLkl0ZW1UZXh0PlxuICAgICAgPFNlbGVjdFByaW1pdGl2ZS5JdGVtSW5kaWNhdG9yXG4gICAgICAgIHJlbmRlcj17XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBhYnNvbHV0ZSByaWdodC0yIGZsZXggc2l6ZS00IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiIC8+XG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAgPENoZWNrSWNvbiBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lXCIgLz5cbiAgICAgIDwvU2VsZWN0UHJpbWl0aXZlLkl0ZW1JbmRpY2F0b3I+XG4gICAgPC9TZWxlY3RQcmltaXRpdmUuSXRlbT5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RTZXBhcmF0b3Ioe1xuICBjbGFzc05hbWUsXG4gIC4uLnByb3BzXG59OiBTZWxlY3RQcmltaXRpdmUuU2VwYXJhdG9yLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFNlbGVjdFByaW1pdGl2ZS5TZXBhcmF0b3JcbiAgICAgIGRhdGEtc2xvdD1cInNlbGVjdC1zZXBhcmF0b3JcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcInBvaW50ZXItZXZlbnRzLW5vbmUgLW14LTEgbXktMSBoLXB4IGJnLWJvcmRlclwiLCBjbGFzc05hbWUpfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0U2Nyb2xsVXBCdXR0b24oe1xuICBjbGFzc05hbWUsXG4gIC4uLnByb3BzXG59OiBSZWFjdC5Db21wb25lbnRQcm9wczx0eXBlb2YgU2VsZWN0UHJpbWl0aXZlLlNjcm9sbFVwQXJyb3c+KSB7XG4gIHJldHVybiAoXG4gICAgPFNlbGVjdFByaW1pdGl2ZS5TY3JvbGxVcEFycm93XG4gICAgICBkYXRhLXNsb3Q9XCJzZWxlY3Qtc2Nyb2xsLXVwLWJ1dHRvblwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcInRvcC0wIHotMTAgZmxleCB3LWZ1bGwgY3Vyc29yLWRlZmF1bHQgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLXBvcG92ZXIgcHktMSBbJl9zdmc6bm90KFtjbGFzcyo9J3NpemUtJ10pXTpzaXplLTRcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgID5cbiAgICAgIDxDaGV2cm9uVXBJY29uXG4gICAgICAvPlxuICAgIDwvU2VsZWN0UHJpbWl0aXZlLlNjcm9sbFVwQXJyb3c+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0U2Nyb2xsRG93bkJ1dHRvbih7XG4gIGNsYXNzTmFtZSxcbiAgLi4ucHJvcHNcbn06IFJlYWN0LkNvbXBvbmVudFByb3BzPHR5cGVvZiBTZWxlY3RQcmltaXRpdmUuU2Nyb2xsRG93bkFycm93Pikge1xuICByZXR1cm4gKFxuICAgIDxTZWxlY3RQcmltaXRpdmUuU2Nyb2xsRG93bkFycm93XG4gICAgICBkYXRhLXNsb3Q9XCJzZWxlY3Qtc2Nyb2xsLWRvd24tYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiYm90dG9tLTAgei0xMCBmbGV4IHctZnVsbCBjdXJzb3ItZGVmYXVsdCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctcG9wb3ZlciBweS0xIFsmX3N2Zzpub3QoW2NsYXNzKj0nc2l6ZS0nXSldOnNpemUtNFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgPlxuICAgICAgPENoZXZyb25Eb3duSWNvblxuICAgICAgLz5cbiAgICA8L1NlbGVjdFByaW1pdGl2ZS5TY3JvbGxEb3duQXJyb3c+XG4gIClcbn1cblxuZXhwb3J0IHtcbiAgU2VsZWN0LFxuICBTZWxlY3RDb250ZW50LFxuICBTZWxlY3RHcm91cCxcbiAgU2VsZWN0SXRlbSxcbiAgU2VsZWN0TGFiZWwsXG4gIFNlbGVjdFNjcm9sbERvd25CdXR0b24sXG4gIFNlbGVjdFNjcm9sbFVwQnV0dG9uLFxuICBTZWxlY3RTZXBhcmF0b3IsXG4gIFNlbGVjdFRyaWdnZXIsXG4gIFNlbGVjdFZhbHVlLFxufVxuIl19