import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/separator.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];"use client";
import { Separator as SeparatorPrimitive } from "/node_modules/.vite/deps/@base-ui_react_separator.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/separator.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Separator({ className, orientation = "horizontal", ...props }) {
	return /* @__PURE__ */ _jsxDEV(SeparatorPrimitive, {
		"data-slot": "separator",
		orientation,
		className: cn("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 13,
		columnNumber: 5
	}, this);
}
_c = Separator;
export { Separator };
var _c;
$RefreshReg$(_c, "Separator");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/separator.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/separator.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/separator.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/separator.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUE7QUFFQSxTQUFTLGFBQWEsMEJBQTBCO0FBRWhELFNBQVMsVUFBVTs7O0FBRW5CLFNBQVMsVUFBVSxFQUNqQixXQUNBLGNBQWMsY0FDZCxHQUFHLFNBQ3dCO0NBQzNCLE9BQ0Usd0JBQUMsb0JBQUQ7RUFDRSxhQUFVO0VBQ0c7RUFDYixXQUFXLEdBQ1QsZ0hBQ0EsU0FDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbInNlcGFyYXRvci50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCJcblxuaW1wb3J0IHsgU2VwYXJhdG9yIGFzIFNlcGFyYXRvclByaW1pdGl2ZSB9IGZyb20gXCJAYmFzZS11aS9yZWFjdC9zZXBhcmF0b3JcIlxuXG5pbXBvcnQgeyBjbiB9IGZyb20gXCJAL2xpYi91dGlsc1wiXG5cbmZ1bmN0aW9uIFNlcGFyYXRvcih7XG4gIGNsYXNzTmFtZSxcbiAgb3JpZW50YXRpb24gPSBcImhvcml6b250YWxcIixcbiAgLi4ucHJvcHNcbn06IFNlcGFyYXRvclByaW1pdGl2ZS5Qcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxTZXBhcmF0b3JQcmltaXRpdmVcbiAgICAgIGRhdGEtc2xvdD1cInNlcGFyYXRvclwiXG4gICAgICBvcmllbnRhdGlvbj17b3JpZW50YXRpb259XG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcInNocmluay0wIGJnLWJvcmRlciBkYXRhLWhvcml6b250YWw6aC1weCBkYXRhLWhvcml6b250YWw6dy1mdWxsIGRhdGEtdmVydGljYWw6dy1weCBkYXRhLXZlcnRpY2FsOnNlbGYtc3RyZXRjaFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5leHBvcnQgeyBTZXBhcmF0b3IgfVxuIl19