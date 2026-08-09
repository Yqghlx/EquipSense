import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/OfflineIndicator.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { WifiOff } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { useOfflineStatus } from "/src/hooks/useOfflineStatus.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/OfflineIndicator.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 全局离线状态指示器
*
* 固定在页面顶部居中，当网络断开时显示红色横幅。
*/
export function OfflineIndicator() {
	_s();
	const { isOnline } = useOfflineStatus();
	if (isOnline) return null;
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-white animate-in slide-in-from-top",
		children: [/* @__PURE__ */ _jsxDEV(WifiOff, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 16,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("span", { children: "网络已断开 — 您的操作将在恢复连接后自动同步" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 17,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 5
	}, this);
}
_s(OfflineIndicator, "E8v9U0fVtj877TZ6dVXeq98i/BM=", false, function() {
	return [useOfflineStatus];
});
_c = OfflineIndicator;
var _c;
$RefreshReg$(_c, "OfflineIndicator");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/OfflineIndicator.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/OfflineIndicator.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/OfflineIndicator.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/OfflineIndicator.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsd0JBQXdCOzs7Ozs7Ozs7QUFPakMsT0FBTyxTQUFTLG1CQUFtQjs7Q0FDakMsTUFBTSxFQUFFLGFBQWEsaUJBQWlCO0NBRXRDLElBQUksVUFBVSxPQUFPO0NBRXJCLE9BQ0Usd0JBQUMsT0FBRDtFQUFLLFdBQVU7WUFBZixDQUNFLHdCQUFDLFNBQUQsRUFBUyxXQUFVLFVBQVc7Ozs7WUFDOUIsd0JBQUMsUUFBRCxZQUFNLDBCQUE2Qjs7OztVQUNoQzs7Ozs7O0FBRVQiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiT2ZmbGluZUluZGljYXRvci50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV2lmaU9mZiB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyB1c2VPZmZsaW5lU3RhdHVzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlT2ZmbGluZVN0YXR1cyc7XG5cbi8qKlxuICog5YWo5bGA56a757q/54q25oCB5oyH56S65ZmoXG4gKlxuICog5Zu65a6a5Zyo6aG16Z2i6aG26YOo5bGF5Lit77yM5b2T572R57uc5pat5byA5pe25pi+56S657qi6Imy5qiq5bmF44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBPZmZsaW5lSW5kaWNhdG9yKCkge1xuICBjb25zdCB7IGlzT25saW5lIH0gPSB1c2VPZmZsaW5lU3RhdHVzKCk7XG5cbiAgaWYgKGlzT25saW5lKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgdG9wLTAgbGVmdC0wIHJpZ2h0LTAgei1bNjBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIGJnLWRlc3RydWN0aXZlIHB4LTQgcHktMiB0ZXh0LXNtIHRleHQtd2hpdGUgYW5pbWF0ZS1pbiBzbGlkZS1pbi1mcm9tLXRvcFwiPlxuICAgICAgPFdpZmlPZmYgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICA8c3Bhbj7nvZHnu5zlt7Lmlq3lvIAg4oCUIOaCqOeahOaTjeS9nOWwhuWcqOaBouWkjei/nuaOpeWQjuiHquWKqOWQjOatpTwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==