import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/tabs.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];/* eslint-disable react-refresh/only-export-components */
"use client";
import { Tabs as TabsPrimitive } from "/node_modules/.vite/deps/@base-ui_react_tabs.js?v=1d2f6f90";
import { cva } from "/node_modules/.vite/deps/class-variance-authority.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/tabs.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Tabs({ className, orientation = "horizontal", ...props }) {
	return /* @__PURE__ */ _jsxDEV(TabsPrimitive.Root, {
		"data-slot": "tabs",
		"data-orientation": orientation,
		className: cn("group/tabs flex gap-2 data-horizontal:flex-col", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 5
	}, this);
}
_c = Tabs;
const tabsListVariants = cva("group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none", {
	variants: { variant: {
		default: "bg-muted",
		line: "gap-1 bg-transparent"
	} },
	defaultVariants: { variant: "default" }
});
function TabsList({ className, variant = "default", ...props }) {
	return /* @__PURE__ */ _jsxDEV(TabsPrimitive.List, {
		"data-slot": "tabs-list",
		"data-variant": variant,
		className: cn(tabsListVariants({ variant }), className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 48,
		columnNumber: 5
	}, this);
}
_c2 = TabsList;
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(TabsPrimitive.Tab, {
		"data-slot": "tabs-trigger",
		className: cn("relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent", "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground", "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 59,
		columnNumber: 5
	}, this);
}
_c3 = TabsTrigger;
function TabsContent({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(TabsPrimitive.Panel, {
		"data-slot": "tabs-content",
		className: cn("flex-1 text-sm outline-none", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 5
	}, this);
}
_c4 = TabsContent;
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "Tabs");
$RefreshReg$(_c2, "TabsList");
$RefreshReg$(_c3, "TabsTrigger");
$RefreshReg$(_c4, "TabsContent");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/tabs.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/tabs.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/tabs.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/tabs.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IjtBQUNBO0FBRUEsU0FBUyxRQUFRLHFCQUFxQjtBQUN0QyxTQUFTLFdBQThCO0FBRXZDLFNBQVMsVUFBVTs7O0FBRW5CLFNBQVMsS0FBSyxFQUNaLFdBQ0EsY0FBYyxjQUNkLEdBQUcsU0FDd0I7Q0FDM0IsT0FDRSx3QkFBQyxjQUFjLE1BQWY7RUFDRSxhQUFVO0VBQ1Ysb0JBQWtCO0VBQ2xCLFdBQVcsR0FDVCxrREFDQSxTQUNGO0VBQ0EsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLE1BQU0sbUJBQW1CLElBQ3ZCLDJPQUNBO0NBQ0UsVUFBVSxFQUNSLFNBQVM7RUFDUCxTQUFTO0VBQ1QsTUFBTTtDQUNSLEVBQ0Y7Q0FDQSxpQkFBaUIsRUFDZixTQUFTLFVBQ1g7QUFDRixDQUNGO0FBRUEsU0FBUyxTQUFTLEVBQ2hCLFdBQ0EsVUFBVSxXQUNWLEdBQUcsU0FDZ0U7Q0FDbkUsT0FDRSx3QkFBQyxjQUFjLE1BQWY7RUFDRSxhQUFVO0VBQ1YsZ0JBQWM7RUFDZCxXQUFXLEdBQUcsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEdBQUcsU0FBUztFQUN0RCxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxZQUFZLEVBQUUsV0FBVyxHQUFHLFNBQWtDO0NBQ3JFLE9BQ0Usd0JBQUMsY0FBYyxLQUFmO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FDVCw4MUJBQ0EsaVFBQ0EscUpBQ0Esd1lBQ0EsU0FDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLFlBQVksRUFBRSxXQUFXLEdBQUcsU0FBb0M7Q0FDdkUsT0FDRSx3QkFBQyxjQUFjLE9BQWY7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUFHLCtCQUErQixTQUFTO0VBQ3RELEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLE1BQU0sVUFBVSxhQUFhLGFBQWEiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsidGFicy50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcmVhY3QtcmVmcmVzaC9vbmx5LWV4cG9ydC1jb21wb25lbnRzICovXG5cInVzZSBjbGllbnRcIlxuXG5pbXBvcnQgeyBUYWJzIGFzIFRhYnNQcmltaXRpdmUgfSBmcm9tIFwiQGJhc2UtdWkvcmVhY3QvdGFic1wiXG5pbXBvcnQgeyBjdmEsIHR5cGUgVmFyaWFudFByb3BzIH0gZnJvbSBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcblxuZnVuY3Rpb24gVGFicyh7XG4gIGNsYXNzTmFtZSxcbiAgb3JpZW50YXRpb24gPSBcImhvcml6b250YWxcIixcbiAgLi4ucHJvcHNcbn06IFRhYnNQcmltaXRpdmUuUm9vdC5Qcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxUYWJzUHJpbWl0aXZlLlJvb3RcbiAgICAgIGRhdGEtc2xvdD1cInRhYnNcIlxuICAgICAgZGF0YS1vcmllbnRhdGlvbj17b3JpZW50YXRpb259XG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcImdyb3VwL3RhYnMgZmxleCBnYXAtMiBkYXRhLWhvcml6b250YWw6ZmxleC1jb2xcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuY29uc3QgdGFic0xpc3RWYXJpYW50cyA9IGN2YShcbiAgXCJncm91cC90YWJzLWxpc3QgaW5saW5lLWZsZXggdy1maXQgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtbGcgcC1bM3B4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgZ3JvdXAtZGF0YS1ob3Jpem9udGFsL3RhYnM6aC04IGdyb3VwLWRhdGEtdmVydGljYWwvdGFiczpoLWZpdCBncm91cC1kYXRhLXZlcnRpY2FsL3RhYnM6ZmxleC1jb2wgZGF0YS1bdmFyaWFudD1saW5lXTpyb3VuZGVkLW5vbmVcIixcbiAge1xuICAgIHZhcmlhbnRzOiB7XG4gICAgICB2YXJpYW50OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiYmctbXV0ZWRcIixcbiAgICAgICAgbGluZTogXCJnYXAtMSBiZy10cmFuc3BhcmVudFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGRlZmF1bHRWYXJpYW50czoge1xuICAgICAgdmFyaWFudDogXCJkZWZhdWx0XCIsXG4gICAgfSxcbiAgfVxuKVxuXG5mdW5jdGlvbiBUYWJzTGlzdCh7XG4gIGNsYXNzTmFtZSxcbiAgdmFyaWFudCA9IFwiZGVmYXVsdFwiLFxuICAuLi5wcm9wc1xufTogVGFic1ByaW1pdGl2ZS5MaXN0LlByb3BzICYgVmFyaWFudFByb3BzPHR5cGVvZiB0YWJzTGlzdFZhcmlhbnRzPikge1xuICByZXR1cm4gKFxuICAgIDxUYWJzUHJpbWl0aXZlLkxpc3RcbiAgICAgIGRhdGEtc2xvdD1cInRhYnMtbGlzdFwiXG4gICAgICBkYXRhLXZhcmlhbnQ9e3ZhcmlhbnR9XG4gICAgICBjbGFzc05hbWU9e2NuKHRhYnNMaXN0VmFyaWFudHMoeyB2YXJpYW50IH0pLCBjbGFzc05hbWUpfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gVGFic1RyaWdnZXIoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFRhYnNQcmltaXRpdmUuVGFiLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFRhYnNQcmltaXRpdmUuVGFiXG4gICAgICBkYXRhLXNsb3Q9XCJ0YWJzLXRyaWdnZXJcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJyZWxhdGl2ZSBpbmxpbmUtZmxleCBoLVtjYWxjKDEwMCUtMXB4KV0gZmxleC0xIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBweC0xLjUgcHktMC41IHRleHQtc20gZm9udC1tZWRpdW0gd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1mb3JlZ3JvdW5kLzYwIHRyYW5zaXRpb24tYWxsIGdyb3VwLWRhdGEtdmVydGljYWwvdGFiczp3LWZ1bGwgZ3JvdXAtZGF0YS12ZXJ0aWNhbC90YWJzOmp1c3RpZnktc3RhcnQgaG92ZXI6dGV4dC1mb3JlZ3JvdW5kIGZvY3VzLXZpc2libGU6Ym9yZGVyLXJpbmcgZm9jdXMtdmlzaWJsZTpyaW5nLVszcHhdIGZvY3VzLXZpc2libGU6cmluZy1yaW5nLzUwIGZvY3VzLXZpc2libGU6b3V0bGluZS0xIGZvY3VzLXZpc2libGU6b3V0bGluZS1yaW5nIGRpc2FibGVkOnBvaW50ZXItZXZlbnRzLW5vbmUgZGlzYWJsZWQ6b3BhY2l0eS01MCBoYXMtZGF0YS1baWNvbj1pbmxpbmUtZW5kXTpwci0xIGhhcy1kYXRhLVtpY29uPWlubGluZS1zdGFydF06cGwtMSBhcmlhLWRpc2FibGVkOnBvaW50ZXItZXZlbnRzLW5vbmUgYXJpYS1kaXNhYmxlZDpvcGFjaXR5LTUwIGRhcms6dGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGRhcms6aG92ZXI6dGV4dC1mb3JlZ3JvdW5kIGdyb3VwLWRhdGEtW3ZhcmlhbnQ9ZGVmYXVsdF0vdGFicy1saXN0OmRhdGEtYWN0aXZlOnNoYWRvdy1zbSBncm91cC1kYXRhLVt2YXJpYW50PWxpbmVdL3RhYnMtbGlzdDpkYXRhLWFjdGl2ZTpzaGFkb3ctbm9uZSBbJl9zdmddOnBvaW50ZXItZXZlbnRzLW5vbmUgWyZfc3ZnXTpzaHJpbmstMCBbJl9zdmc6bm90KFtjbGFzcyo9J3NpemUtJ10pXTpzaXplLTRcIixcbiAgICAgICAgXCJncm91cC1kYXRhLVt2YXJpYW50PWxpbmVdL3RhYnMtbGlzdDpiZy10cmFuc3BhcmVudCBncm91cC1kYXRhLVt2YXJpYW50PWxpbmVdL3RhYnMtbGlzdDpkYXRhLWFjdGl2ZTpiZy10cmFuc3BhcmVudCBkYXJrOmdyb3VwLWRhdGEtW3ZhcmlhbnQ9bGluZV0vdGFicy1saXN0OmRhdGEtYWN0aXZlOmJvcmRlci10cmFuc3BhcmVudCBkYXJrOmdyb3VwLWRhdGEtW3ZhcmlhbnQ9bGluZV0vdGFicy1saXN0OmRhdGEtYWN0aXZlOmJnLXRyYW5zcGFyZW50XCIsXG4gICAgICAgIFwiZGF0YS1hY3RpdmU6YmctYmFja2dyb3VuZCBkYXRhLWFjdGl2ZTp0ZXh0LWZvcmVncm91bmQgZGFyazpkYXRhLWFjdGl2ZTpib3JkZXItaW5wdXQgZGFyazpkYXRhLWFjdGl2ZTpiZy1pbnB1dC8zMCBkYXJrOmRhdGEtYWN0aXZlOnRleHQtZm9yZWdyb3VuZFwiLFxuICAgICAgICBcImFmdGVyOmFic29sdXRlIGFmdGVyOmJnLWZvcmVncm91bmQgYWZ0ZXI6b3BhY2l0eS0wIGFmdGVyOnRyYW5zaXRpb24tb3BhY2l0eSBncm91cC1kYXRhLWhvcml6b250YWwvdGFiczphZnRlcjppbnNldC14LTAgZ3JvdXAtZGF0YS1ob3Jpem9udGFsL3RhYnM6YWZ0ZXI6Ym90dG9tLVstNXB4XSBncm91cC1kYXRhLWhvcml6b250YWwvdGFiczphZnRlcjpoLTAuNSBncm91cC1kYXRhLXZlcnRpY2FsL3RhYnM6YWZ0ZXI6aW5zZXQteS0wIGdyb3VwLWRhdGEtdmVydGljYWwvdGFiczphZnRlcjotcmlnaHQtMSBncm91cC1kYXRhLXZlcnRpY2FsL3RhYnM6YWZ0ZXI6dy0wLjUgZ3JvdXAtZGF0YS1bdmFyaWFudD1saW5lXS90YWJzLWxpc3Q6ZGF0YS1hY3RpdmU6YWZ0ZXI6b3BhY2l0eS0xMDBcIixcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICApfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gVGFic0NvbnRlbnQoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFRhYnNQcmltaXRpdmUuUGFuZWwuUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8VGFic1ByaW1pdGl2ZS5QYW5lbFxuICAgICAgZGF0YS1zbG90PVwidGFicy1jb250ZW50XCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXCJmbGV4LTEgdGV4dC1zbSBvdXRsaW5lLW5vbmVcIiwgY2xhc3NOYW1lKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCB7IFRhYnMsIFRhYnNMaXN0LCBUYWJzVHJpZ2dlciwgVGFic0NvbnRlbnQsIHRhYnNMaXN0VmFyaWFudHMgfVxuIl19