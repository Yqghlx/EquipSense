import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/switch.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];"use client";
import { Switch as SwitchPrimitive } from "/node_modules/.vite/deps/@base-ui_react_switch.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/switch.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Switch({ className, size = "default", ...props }) {
	return /* @__PURE__ */ _jsxDEV(SwitchPrimitive.Root, {
		"data-slot": "switch",
		"data-size": size,
		className: cn("peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ _jsxDEV(SwitchPrimitive.Thumb, {
			"data-slot": "switch-thumb",
			className: "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 24,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 5
	}, this);
}
_c = Switch;
export { Switch };
var _c;
$RefreshReg$(_c, "Switch");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/switch.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/switch.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/switch.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/switch.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUE7QUFFQSxTQUFTLFVBQVUsdUJBQXVCO0FBRTFDLFNBQVMsVUFBVTs7O0FBRW5CLFNBQVMsT0FBTyxFQUNkLFdBQ0EsT0FBTyxXQUNQLEdBQUcsU0FHRjtDQUNELE9BQ0Usd0JBQUMsZ0JBQWdCLE1BQWpCO0VBQ0UsYUFBVTtFQUNWLGFBQVc7RUFDWCxXQUFXLEdBQ1QsdXBCQUNBLFNBQ0Y7RUFDQSxHQUFJO1lBRUosd0JBQUMsZ0JBQWdCLE9BQWpCO0dBQ0UsYUFBVTtHQUNWLFdBQVU7RUFDWDs7Ozs7Q0FDbUI7Ozs7O0FBRTFCOztBQUVBLFNBQVMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsic3dpdGNoLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBjbGllbnRcIlxuXG5pbXBvcnQgeyBTd2l0Y2ggYXMgU3dpdGNoUHJpbWl0aXZlIH0gZnJvbSBcIkBiYXNlLXVpL3JlYWN0L3N3aXRjaFwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcblxuZnVuY3Rpb24gU3dpdGNoKHtcbiAgY2xhc3NOYW1lLFxuICBzaXplID0gXCJkZWZhdWx0XCIsXG4gIC4uLnByb3BzXG59OiBTd2l0Y2hQcmltaXRpdmUuUm9vdC5Qcm9wcyAmIHtcbiAgc2l6ZT86IFwic21cIiB8IFwiZGVmYXVsdFwiXG59KSB7XG4gIHJldHVybiAoXG4gICAgPFN3aXRjaFByaW1pdGl2ZS5Sb290XG4gICAgICBkYXRhLXNsb3Q9XCJzd2l0Y2hcIlxuICAgICAgZGF0YS1zaXplPXtzaXplfVxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJwZWVyIGdyb3VwL3N3aXRjaCByZWxhdGl2ZSBpbmxpbmUtZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIGFmdGVyOmFic29sdXRlIGFmdGVyOi1pbnNldC14LTMgYWZ0ZXI6LWluc2V0LXktMiBmb2N1cy12aXNpYmxlOmJvcmRlci1yaW5nIGZvY3VzLXZpc2libGU6cmluZy0zIGZvY3VzLXZpc2libGU6cmluZy1yaW5nLzUwIGFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUgYXJpYS1pbnZhbGlkOnJpbmctMyBhcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS8yMCBkYXRhLVtzaXplPWRlZmF1bHRdOmgtWzE4LjRweF0gZGF0YS1bc2l6ZT1kZWZhdWx0XTp3LVszMnB4XSBkYXRhLVtzaXplPXNtXTpoLVsxNHB4XSBkYXRhLVtzaXplPXNtXTp3LVsyNHB4XSBkYXJrOmFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUvNTAgZGFyazphcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS80MCBkYXRhLWNoZWNrZWQ6YmctcHJpbWFyeSBkYXRhLXVuY2hlY2tlZDpiZy1pbnB1dCBkYXJrOmRhdGEtdW5jaGVja2VkOmJnLWlucHV0LzgwIGRhdGEtZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRhdGEtZGlzYWJsZWQ6b3BhY2l0eS01MFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgPlxuICAgICAgPFN3aXRjaFByaW1pdGl2ZS5UaHVtYlxuICAgICAgICBkYXRhLXNsb3Q9XCJzd2l0Y2gtdGh1bWJcIlxuICAgICAgICBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lIGJsb2NrIHJvdW5kZWQtZnVsbCBiZy1iYWNrZ3JvdW5kIHJpbmctMCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBncm91cC1kYXRhLVtzaXplPWRlZmF1bHRdL3N3aXRjaDpzaXplLTQgZ3JvdXAtZGF0YS1bc2l6ZT1zbV0vc3dpdGNoOnNpemUtMyBncm91cC1kYXRhLVtzaXplPWRlZmF1bHRdL3N3aXRjaDpkYXRhLWNoZWNrZWQ6dHJhbnNsYXRlLXgtW2NhbGMoMTAwJS0ycHgpXSBncm91cC1kYXRhLVtzaXplPXNtXS9zd2l0Y2g6ZGF0YS1jaGVja2VkOnRyYW5zbGF0ZS14LVtjYWxjKDEwMCUtMnB4KV0gZGFyazpkYXRhLWNoZWNrZWQ6YmctcHJpbWFyeS1mb3JlZ3JvdW5kIGdyb3VwLWRhdGEtW3NpemU9ZGVmYXVsdF0vc3dpdGNoOmRhdGEtdW5jaGVja2VkOnRyYW5zbGF0ZS14LTAgZ3JvdXAtZGF0YS1bc2l6ZT1zbV0vc3dpdGNoOmRhdGEtdW5jaGVja2VkOnRyYW5zbGF0ZS14LTAgZGFyazpkYXRhLXVuY2hlY2tlZDpiZy1mb3JlZ3JvdW5kXCJcbiAgICAgIC8+XG4gICAgPC9Td2l0Y2hQcmltaXRpdmUuUm9vdD5cbiAgKVxufVxuXG5leHBvcnQgeyBTd2l0Y2ggfVxuIl19