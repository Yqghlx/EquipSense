import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/AuthGuard.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { Navigate, Outlet, useLocation } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import { useAuthStore } from "/src/stores/authStore.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthGuard.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 路由认证守卫
*
* 包裹需要认证的业务路由，未登录用户自动重定向到 /login，
* 登录后跳回原始请求路径。
* 额外保护 /admin 路由，仅 SystemAdmin 角色可访问。
*/
export function AuthGuard() {
	_s();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const location = useLocation();
	if (!isAuthenticated) {
		return /* @__PURE__ */ _jsxDEV(Navigate, {
			to: "/login",
			state: { from: location.pathname },
			replace: true
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 17,
			columnNumber: 12
		}, this);
	}
	// admin 路由仅允许 SystemAdmin 角色
	if (location.pathname.startsWith("/admin") && user?.role !== "SystemAdmin") {
		return /* @__PURE__ */ _jsxDEV(Navigate, {
			to: "/dashboard",
			replace: true
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 22,
			columnNumber: 12
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV(Outlet, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 25,
		columnNumber: 10
	}, this);
}
_s(AuthGuard, "xEIoInL5Z5pubufTlw6G/2KabpU=", false, function() {
	return [
		useAuthStore,
		useAuthStore,
		useLocation
	];
});
_c = AuthGuard;
var _c;
$RefreshReg$(_c, "AuthGuard");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/AuthGuard.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthGuard.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthGuard.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AuthGuard.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxVQUFVLFFBQVEsbUJBQW1CO0FBQzlDLFNBQVMsb0JBQW9COzs7Ozs7Ozs7OztBQVM3QixPQUFPLFNBQVMsWUFBWTs7Q0FDMUIsTUFBTSxrQkFBa0IsY0FBYyxNQUFNLEVBQUUsZUFBZTtDQUM3RCxNQUFNLE9BQU8sY0FBYyxNQUFNLEVBQUUsSUFBSTtDQUN2QyxNQUFNLFdBQVcsWUFBWTtDQUU3QixJQUFJLENBQUMsaUJBQWlCO0VBQ3BCLE9BQU8sd0JBQUMsVUFBRDtHQUFVLElBQUc7R0FBUyxPQUFPLEVBQUUsTUFBTSxTQUFTLFNBQVM7R0FBRztFQUFTOzs7OztDQUM1RTs7Q0FHQSxJQUFJLFNBQVMsU0FBUyxXQUFXLFFBQVEsS0FBSyxNQUFNLFNBQVMsZUFBZTtFQUMxRSxPQUFPLHdCQUFDLFVBQUQ7R0FBVSxJQUFHO0dBQWE7RUFBUzs7Ozs7Q0FDNUM7Q0FFQSxPQUFPLHdCQUFDLFFBQUQsQ0FBUzs7Ozs7QUFDbEIiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXV0aEd1YXJkLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOYXZpZ2F0ZSwgT3V0bGV0LCB1c2VMb2NhdGlvbiB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IHsgdXNlQXV0aFN0b3JlIH0gZnJvbSAnLi4vLi4vc3RvcmVzL2F1dGhTdG9yZSc7XG5cbi8qKlxuICog6Lev55Sx6K6k6K+B5a6I5Y2rXG4gKlxuICog5YyF6KO56ZyA6KaB6K6k6K+B55qE5Lia5Yqh6Lev55Sx77yM5pyq55m75b2V55So5oi36Ieq5Yqo6YeN5a6a5ZCR5YiwIC9sb2dpbu+8jFxuICog55m75b2V5ZCO6Lez5Zue5Y6f5aeL6K+35rGC6Lev5b6E44CCXG4gKiDpop3lpJbkv53miqQgL2FkbWluIOi3r+eUse+8jOS7hSBTeXN0ZW1BZG1pbiDop5LoibLlj6/orr/pl67jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEF1dGhHdWFyZCgpIHtcbiAgY29uc3QgaXNBdXRoZW50aWNhdGVkID0gdXNlQXV0aFN0b3JlKChzKSA9PiBzLmlzQXV0aGVudGljYXRlZCk7XG4gIGNvbnN0IHVzZXIgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMudXNlcik7XG4gIGNvbnN0IGxvY2F0aW9uID0gdXNlTG9jYXRpb24oKTtcblxuICBpZiAoIWlzQXV0aGVudGljYXRlZCkge1xuICAgIHJldHVybiA8TmF2aWdhdGUgdG89XCIvbG9naW5cIiBzdGF0ZT17eyBmcm9tOiBsb2NhdGlvbi5wYXRobmFtZSB9fSByZXBsYWNlIC8+O1xuICB9XG5cbiAgLy8gYWRtaW4g6Lev55Sx5LuF5YWB6K64IFN5c3RlbUFkbWluIOinkuiJslxuICBpZiAobG9jYXRpb24ucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2FkbWluJykgJiYgdXNlcj8ucm9sZSAhPT0gJ1N5c3RlbUFkbWluJykge1xuICAgIHJldHVybiA8TmF2aWdhdGUgdG89XCIvZGFzaGJvYXJkXCIgcmVwbGFjZSAvPjtcbiAgfVxuXG4gIHJldHVybiA8T3V0bGV0IC8+O1xufVxuIl19