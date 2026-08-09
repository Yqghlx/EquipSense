import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/AppLayout.tsx");const useEffect = __vite__cjsImport1_react["useEffect"]; const useState = __vite__cjsImport1_react["useState"];const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"];/* eslint-disable react-hooks/set-state-in-effect -- 路由切换时关闭移动端 drawer 是合法的副作用模式，无级联渲染风险 */
import { Outlet, Navigate, useLocation } from "/node_modules/.vite/deps/react-router-dom.js?v=1d2f6f90";
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Sidebar } from "/src/components/layout/Sidebar.tsx";
import { Header } from "/src/components/layout/Header.tsx";
import { useAuthStore } from "/src/stores/authStore.ts";
import { useSignalR } from "/src/hooks/useSignalR.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AppLayout.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 应用主布局组件
*
* 包含侧边栏 + 顶部导航 + 内容区域。
* 未认证时自动重定向到登录页。
* 认证后自动建立 SignalR 实时连接。
*
* 移动端适配（< 768px）：侧边栏变为 Drawer，默认隐藏，
* 通过 Header 的 hamburger 按钮触发，点击 overlay 或路由切换后自动关闭。
*/
export function AppLayout() {
	_s();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	useSignalR();
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const location = useLocation();
	// 路由切换时自动关闭移动端 drawer，避免点击导航后侧边栏还盖住内容
	useEffect(() => {
		setMobileSidebarOpen(false);
	}, [location.pathname]);
	if (!isAuthenticated) {
		return /* @__PURE__ */ _jsxDEV(Navigate, {
			to: "/login",
			replace: true
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 31,
			columnNumber: 12
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex h-screen overflow-hidden",
		children: [/* @__PURE__ */ _jsxDEV(Sidebar, {
			mobileOpen: mobileSidebarOpen,
			onClose: () => setMobileSidebarOpen(false)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 36,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("div", {
			className: "flex flex-1 flex-col overflow-hidden",
			children: [/* @__PURE__ */ _jsxDEV(Header, { onMenuClick: () => setMobileSidebarOpen(true) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 38,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("main", {
				className: "flex-1 overflow-y-auto p-4 md:p-6",
				children: /* @__PURE__ */ _jsxDEV(Outlet, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 40,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 39,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 37,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 35,
		columnNumber: 5
	}, this);
}
_s(AppLayout, "hjT7ejYBxRWh7KN8dgsaro0cA6w=", false, function() {
	return [
		useAuthStore,
		useSignalR,
		useLocation
	];
});
_c = AppLayout;
var _c;
$RefreshReg$(_c, "AppLayout");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/AppLayout.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AppLayout.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AppLayout.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/AppLayout.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IjtBQUNBLFNBQVMsUUFBUSxVQUFVLG1CQUFtQjtBQUM5QyxTQUFTLFdBQVcsZ0JBQWdCO0FBQ3BDLFNBQVMsZUFBZTtBQUN4QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7O0FBWTNCLE9BQU8sU0FBUyxZQUFZOztDQUMxQixNQUFNLGtCQUFrQixjQUFjLE1BQU0sRUFBRSxlQUFlO0NBQzdELFdBQVc7Q0FDWCxNQUFNLENBQUMsbUJBQW1CLHdCQUF3QixTQUFTLEtBQUs7Q0FDaEUsTUFBTSxXQUFXLFlBQVk7O0NBRzdCLGdCQUFnQjtFQUNkLHFCQUFxQixLQUFLO0NBQzVCLEdBQUcsQ0FBQyxTQUFTLFFBQVEsQ0FBQztDQUV0QixJQUFJLENBQUMsaUJBQWlCO0VBQ3BCLE9BQU8sd0JBQUMsVUFBRDtHQUFVLElBQUc7R0FBUztFQUFTOzs7OztDQUN4QztDQUVBLE9BQ0Usd0JBQUMsT0FBRDtFQUFLLFdBQVU7WUFBZixDQUNFLHdCQUFDLFNBQUQ7R0FBUyxZQUFZO0dBQW1CLGVBQWUscUJBQXFCLEtBQUs7RUFBSTs7OztZQUNyRix3QkFBQyxPQUFEO0dBQUssV0FBVTthQUFmLENBQ0Usd0JBQUMsUUFBRCxFQUFRLG1CQUFtQixxQkFBcUIsSUFBSSxFQUFJOzs7O2FBQ3hELHdCQUFDLFFBQUQ7SUFBTSxXQUFVO2NBQ2Qsd0JBQUMsUUFBRCxDQUFTOzs7OztHQUNMOzs7O1dBQ0g7Ozs7O1VBQ0Y7Ozs7OztBQUVUIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkFwcExheW91dC50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcmVhY3QtaG9va3Mvc2V0LXN0YXRlLWluLWVmZmVjdCAtLSDot6/nlLHliIfmjaLml7blhbPpl63np7vliqjnq68gZHJhd2VyIOaYr+WQiOazleeahOWJr+S9nOeUqOaooeW8j++8jOaXoOe6p+iBlOa4suafk+mjjumZqSAqL1xuaW1wb3J0IHsgT3V0bGV0LCBOYXZpZ2F0ZSwgdXNlTG9jYXRpb24gfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBTaWRlYmFyIH0gZnJvbSAnLi9TaWRlYmFyJztcbmltcG9ydCB7IEhlYWRlciB9IGZyb20gJy4vSGVhZGVyJztcbmltcG9ydCB7IHVzZUF1dGhTdG9yZSB9IGZyb20gJy4uLy4uL3N0b3Jlcy9hdXRoU3RvcmUnO1xuaW1wb3J0IHsgdXNlU2lnbmFsUiB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVNpZ25hbFInO1xuXG4vKipcbiAqIOW6lOeUqOS4u+W4g+WxgOe7hOS7tlxuICpcbiAqIOWMheWQq+S+p+i+ueagjyArIOmhtumDqOWvvOiIqiArIOWGheWuueWMuuWfn+OAglxuICog5pyq6K6k6K+B5pe26Ieq5Yqo6YeN5a6a5ZCR5Yiw55m75b2V6aG144CCXG4gKiDorqTor4HlkI7oh6rliqjlu7rnq4sgU2lnbmFsUiDlrp7ml7bov57mjqXjgIJcbiAqXG4gKiDnp7vliqjnq6/pgILphY3vvIg8IDc2OHB477yJ77ya5L6n6L655qCP5Y+Y5Li6IERyYXdlcu+8jOm7mOiupOmakOiXj++8jFxuICog6YCa6L+HIEhlYWRlciDnmoQgaGFtYnVyZ2VyIOaMiemSruinpuWPke+8jOeCueWHuyBvdmVybGF5IOaIlui3r+eUseWIh+aNouWQjuiHquWKqOWFs+mXreOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gQXBwTGF5b3V0KCkge1xuICBjb25zdCBpc0F1dGhlbnRpY2F0ZWQgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMuaXNBdXRoZW50aWNhdGVkKTtcbiAgdXNlU2lnbmFsUigpO1xuICBjb25zdCBbbW9iaWxlU2lkZWJhck9wZW4sIHNldE1vYmlsZVNpZGViYXJPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgbG9jYXRpb24gPSB1c2VMb2NhdGlvbigpO1xuXG4gIC8vIOi3r+eUseWIh+aNouaXtuiHquWKqOWFs+mXreenu+WKqOerryBkcmF3ZXLvvIzpgb/lhY3ngrnlh7vlr7zoiKrlkI7kvqfovrnmoI/ov5jnm5bkvY/lhoXlrrlcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBzZXRNb2JpbGVTaWRlYmFyT3BlbihmYWxzZSk7XG4gIH0sIFtsb2NhdGlvbi5wYXRobmFtZV0pO1xuXG4gIGlmICghaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgcmV0dXJuIDxOYXZpZ2F0ZSB0bz1cIi9sb2dpblwiIHJlcGxhY2UgLz47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBoLXNjcmVlbiBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgIDxTaWRlYmFyIG1vYmlsZU9wZW49e21vYmlsZVNpZGViYXJPcGVufSBvbkNsb3NlPXsoKSA9PiBzZXRNb2JpbGVTaWRlYmFyT3BlbihmYWxzZSl9IC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC0xIGZsZXgtY29sIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICA8SGVhZGVyIG9uTWVudUNsaWNrPXsoKSA9PiBzZXRNb2JpbGVTaWRlYmFyT3Blbih0cnVlKX0gLz5cbiAgICAgICAgPG1haW4gY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTQgbWQ6cC02XCI+XG4gICAgICAgICAgPE91dGxldCAvPlxuICAgICAgICA8L21haW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==