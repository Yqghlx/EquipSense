import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/AuthLayout.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { Outlet } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthLayout.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 认证布局组件
*
* 用于登录等无需侧边栏的页面，居中展示内容。
*/
export function AuthLayout() {
	_s();
	const { t } = useTranslation();
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ _jsxDEV("div", {
			className: "w-full max-w-md p-8",
			children: [/* @__PURE__ */ _jsxDEV("div", {
				className: "mb-8 text-center",
				children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-3xl font-bold text-primary",
					children: "EquipSense"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 16,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: t("auth.platformName")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 17,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 15,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV(Outlet, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 19,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 14,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 13,
		columnNumber: 5
	}, this);
}
_s(AuthLayout, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = AuthLayout;
var _c;
$RefreshReg$(_c, "AuthLayout");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/AuthLayout.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthLayout.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthLayout.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthLayout.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsc0JBQXNCOzs7Ozs7Ozs7QUFPL0IsT0FBTyxTQUFTLGFBQWE7O0NBQzNCLE1BQU0sRUFBRSxNQUFNLGVBQWU7Q0FFN0IsT0FDRSx3QkFBQyxPQUFEO0VBQUssV0FBVTtZQUNiLHdCQUFDLE9BQUQ7R0FBSyxXQUFVO2FBQWYsQ0FDRSx3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUFmLENBQ0Usd0JBQUMsTUFBRDtLQUFJLFdBQVU7ZUFBa0M7SUFBYzs7OztjQUM5RCx3QkFBQyxLQUFEO0tBQUcsV0FBVTtlQUFzQyxFQUFFLG1CQUFtQjtJQUFLOzs7O1lBQzFFOzs7OzthQUNMLHdCQUFDLFFBQUQsQ0FBUzs7OztXQUNOOzs7Ozs7Q0FDRjs7Ozs7QUFFVCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJBdXRoTGF5b3V0LnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPdXRsZXQgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5cbi8qKlxuICog6K6k6K+B5biD5bGA57uE5Lu2XG4gKlxuICog55So5LqO55m75b2V562J5peg6ZyA5L6n6L655qCP55qE6aG16Z2i77yM5bGF5Lit5bGV56S65YaF5a6544CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBBdXRoTGF5b3V0KCkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggbWluLWgtc2NyZWVuIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1iYWNrZ3JvdW5kXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZCBwLThcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi04IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtM3hsIGZvbnQtYm9sZCB0ZXh0LXByaW1hcnlcIj5FcXVpcFNlbnNlPC9oMT5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0yIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2F1dGgucGxhdGZvcm1OYW1lJyl9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPE91dGxldCAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXX0=