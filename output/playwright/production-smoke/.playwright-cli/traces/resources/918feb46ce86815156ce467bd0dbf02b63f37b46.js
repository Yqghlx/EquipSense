import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/alert/SeverityBadge.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { Badge } from "/src/components/ui/badge.tsx";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/SeverityBadge.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 告警严重级别对应的样式映射 */
const severityStyles = {
	critical: "bg-red-500/10 text-red-500 border-red-500/20",
	high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	low: "bg-gray-500/10 text-gray-500 border-gray-500/20"
};
/**
* 告警严重级别徽章组件
*
* 根据告警严重级别显示不同颜色的标签，颜色映射：
* - critical → 红色
* - high → 橙色
* - normal → 蓝色
* - low → 灰色
*/
export function SeverityBadge({ severity }) {
	_s();
	const { t } = useTranslation();
	return /* @__PURE__ */ _jsxDEV(Badge, {
		variant: "outline",
		className: severityStyles[severity] ?? "",
		children: t(`alert.${severity.toLowerCase()}`)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 29,
		columnNumber: 5
	}, this);
}
_s(SeverityBadge, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = SeverityBadge;
var _c;
$RefreshReg$(_c, "SeverityBadge");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/alert/SeverityBadge.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/SeverityBadge.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/SeverityBadge.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/SeverityBadge.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsc0JBQXNCOzs7OztBQUcvQixNQUFNLGlCQUF5QztDQUM3QyxVQUFVO0NBQ1YsTUFBTTtDQUNOLFFBQVE7Q0FDUixLQUFLO0FBQ1A7Ozs7Ozs7Ozs7QUFnQkEsT0FBTyxTQUFTLGNBQWMsRUFBRSxZQUFnQzs7Q0FDOUQsTUFBTSxFQUFFLE1BQU0sZUFBZTtDQUM3QixPQUNFLHdCQUFDLE9BQUQ7RUFBTyxTQUFRO0VBQVUsV0FBVyxlQUFlLGFBQWE7WUFDN0QsRUFBRSxTQUFTLFNBQVMsWUFBWSxHQUFxRTtDQUNqRzs7Ozs7QUFFWCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJTZXZlcml0eUJhZGdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYWRnZSB9IGZyb20gJy4uL3VpL2JhZGdlJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5cbi8qKiDlkYrorabkuKXph43nuqfliKvlr7nlupTnmoTmoLflvI/mmKDlsIQgKi9cbmNvbnN0IHNldmVyaXR5U3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBjcml0aWNhbDogJ2JnLXJlZC01MDAvMTAgdGV4dC1yZWQtNTAwIGJvcmRlci1yZWQtNTAwLzIwJyxcbiAgaGlnaDogJ2JnLW9yYW5nZS01MDAvMTAgdGV4dC1vcmFuZ2UtNTAwIGJvcmRlci1vcmFuZ2UtNTAwLzIwJyxcbiAgbm9ybWFsOiAnYmctYmx1ZS01MDAvMTAgdGV4dC1ibHVlLTUwMCBib3JkZXItYmx1ZS01MDAvMjAnLFxuICBsb3c6ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNTAwIGJvcmRlci1ncmF5LTUwMC8yMCcsXG59O1xuXG5pbnRlcmZhY2UgU2V2ZXJpdHlCYWRnZVByb3BzIHtcbiAgLyoqIOS4pemHjee6p+WIq++8iGNyaXRpY2FsIC8gaGlnaCAvIG5vcm1hbCAvIGxvd++8iSAqL1xuICBzZXZlcml0eTogc3RyaW5nO1xufVxuXG4vKipcbiAqIOWRiuitpuS4pemHjee6p+WIq+W+veeroOe7hOS7tlxuICpcbiAqIOagueaNruWRiuitpuS4pemHjee6p+WIq+aYvuekuuS4jeWQjOminOiJsueahOagh+etvu+8jOminOiJsuaYoOWwhO+8mlxuICogLSBjcml0aWNhbCDihpIg57qi6ImyXG4gKiAtIGhpZ2gg4oaSIOapmeiJslxuICogLSBub3JtYWwg4oaSIOiTneiJslxuICogLSBsb3cg4oaSIOeBsOiJslxuICovXG5leHBvcnQgZnVuY3Rpb24gU2V2ZXJpdHlCYWRnZSh7IHNldmVyaXR5IH06IFNldmVyaXR5QmFkZ2VQcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIHJldHVybiAoXG4gICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPXtzZXZlcml0eVN0eWxlc1tzZXZlcml0eV0gPz8gJyd9PlxuICAgICAge3QoYGFsZXJ0LiR7c2V2ZXJpdHkudG9Mb3dlckNhc2UoKX1gIGFzICdhbGVydC5jcml0aWNhbCcgfCAnYWxlcnQuaGlnaCcgfCAnYWxlcnQubm9ybWFsJyB8ICdhbGVydC5sb3cnKX1cbiAgICA8L0JhZGdlPlxuICApO1xufVxuIl19