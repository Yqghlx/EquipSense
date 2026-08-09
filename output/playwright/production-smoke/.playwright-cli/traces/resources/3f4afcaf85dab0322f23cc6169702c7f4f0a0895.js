import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/textarea.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/textarea.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("textarea", {
		"data-slot": "textarea",
		className: cn("flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 7,
		columnNumber: 5
	}, this);
}
_c = Textarea;
export { Textarea };
var _c;
$RefreshReg$(_c, "Textarea");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/textarea.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/textarea.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/textarea.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/textarea.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsWUFBWSxXQUFXO0FBRXZCLFNBQVMsVUFBVTs7O0FBRW5CLFNBQVMsU0FBUyxFQUFFLFdBQVcsR0FBRyxTQUEyQztDQUMzRSxPQUNFLHdCQUFDLFlBQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUNULDBoQkFDQSxTQUNGO0VBQ0EsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLFNBQVMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsidGV4dGFyZWEudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcblxuZnVuY3Rpb24gVGV4dGFyZWEoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwidGV4dGFyZWFcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8dGV4dGFyZWFcbiAgICAgIGRhdGEtc2xvdD1cInRleHRhcmVhXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiZmxleCBmaWVsZC1zaXppbmctY29udGVudCBtaW4taC0xNiB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWlucHV0IGJnLXRyYW5zcGFyZW50IHB4LTIuNSBweS0yIHRleHQtYmFzZSB0cmFuc2l0aW9uLWNvbG9ycyBvdXRsaW5lLW5vbmUgcGxhY2Vob2xkZXI6dGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGZvY3VzLXZpc2libGU6Ym9yZGVyLXJpbmcgZm9jdXMtdmlzaWJsZTpyaW5nLTMgZm9jdXMtdmlzaWJsZTpyaW5nLXJpbmcvNTAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOmJnLWlucHV0LzUwIGRpc2FibGVkOm9wYWNpdHktNTAgYXJpYS1pbnZhbGlkOmJvcmRlci1kZXN0cnVjdGl2ZSBhcmlhLWludmFsaWQ6cmluZy0zIGFyaWEtaW52YWxpZDpyaW5nLWRlc3RydWN0aXZlLzIwIG1kOnRleHQtc20gZGFyazpiZy1pbnB1dC8zMCBkYXJrOmRpc2FibGVkOmJnLWlucHV0LzgwIGRhcms6YXJpYS1pbnZhbGlkOmJvcmRlci1kZXN0cnVjdGl2ZS81MCBkYXJrOmFyaWEtaW52YWxpZDpyaW5nLWRlc3RydWN0aXZlLzQwXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCB7IFRleHRhcmVhIH1cbiJdfQ==