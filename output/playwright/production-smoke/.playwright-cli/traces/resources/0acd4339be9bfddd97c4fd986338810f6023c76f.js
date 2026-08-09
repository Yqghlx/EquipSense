import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/OfflineStatusBadge.tsx");const _jsxDEV = __vite__cjsImport4_react_jsxDevRuntime["jsxDEV"];import { CloudOff, Wifi } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Badge } from "/src/components/ui/badge.tsx";
import { useOfflineStatus } from "/src/hooks/useOfflineStatus.ts";
import { useOfflineQueue } from "/src/hooks/useOfflineQueue.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineStatusBadge.tsx";
import __vite__cjsImport4_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 离线状态徽章
*
* 显示在工单标题旁，指示当前网络状态和待同步操作数。
* 在线且无待同步操作时隐藏，离线时显示橙色提示，在线但有
* 待同步数据时显示蓝色提示。
*/
export function OfflineStatusBadge() {
	_s();
	const { isOffline } = useOfflineStatus();
	const { pendingCount } = useOfflineQueue();
	// 在线且无待同步操作时不显示
	if (!isOffline && pendingCount === 0) return null;
	if (isOffline) {
		return /* @__PURE__ */ _jsxDEV(Badge, {
			variant: "outline",
			className: "gap-1 border-orange-300 text-orange-600",
			children: [
				/* @__PURE__ */ _jsxDEV(CloudOff, { className: "h-3 w-3" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 23,
					columnNumber: 9
				}, this),
				"离线 ",
				pendingCount > 0 && `(${pendingCount} 待同步)`
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 22,
			columnNumber: 7
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV(Badge, {
		variant: "outline",
		className: "gap-1 border-blue-300 text-blue-600",
		children: [
			/* @__PURE__ */ _jsxDEV(Wifi, { className: "h-3 w-3" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 31,
				columnNumber: 7
			}, this),
			pendingCount,
			" 待同步"
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 30,
		columnNumber: 5
	}, this);
}
_s(OfflineStatusBadge, "uVzc/PJ/0kEz7lLYDDEOdsgr05g=", false, function() {
	return [useOfflineStatus, useOfflineQueue];
});
_c = OfflineStatusBadge;
var _c;
$RefreshReg$(_c, "OfflineStatusBadge");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/OfflineStatusBadge.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineStatusBadge.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineStatusBadge.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineStatusBadge.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxVQUFVLFlBQVk7QUFDL0IsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsdUJBQXVCOzs7Ozs7Ozs7OztBQVNoQyxPQUFPLFNBQVMscUJBQXFCOztDQUNuQyxNQUFNLEVBQUUsY0FBYyxpQkFBaUI7Q0FDdkMsTUFBTSxFQUFFLGlCQUFpQixnQkFBZ0I7O0NBR3pDLElBQUksQ0FBQyxhQUFhLGlCQUFpQixHQUFHLE9BQU87Q0FFN0MsSUFBSSxXQUFXO0VBQ2IsT0FDRSx3QkFBQyxPQUFEO0dBQU8sU0FBUTtHQUFVLFdBQVU7YUFBbkM7SUFDRSx3QkFBQyxVQUFELEVBQVUsV0FBVSxVQUFXOzs7OztJQUFDO0lBQzVCLGVBQWUsS0FBSyxJQUFJLGFBQWE7R0FDcEM7Ozs7OztDQUVYO0NBRUEsT0FDRSx3QkFBQyxPQUFEO0VBQU8sU0FBUTtFQUFVLFdBQVU7WUFBbkM7R0FDRSx3QkFBQyxNQUFELEVBQU0sV0FBVSxVQUFXOzs7OztHQUMxQjtHQUFhO0VBQ1Q7Ozs7OztBQUVYIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIk9mZmxpbmVTdGF0dXNCYWRnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2xvdWRPZmYsIFdpZmkgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQmFkZ2UgfSBmcm9tICcuLi91aS9iYWRnZSc7XG5pbXBvcnQgeyB1c2VPZmZsaW5lU3RhdHVzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlT2ZmbGluZVN0YXR1cyc7XG5pbXBvcnQgeyB1c2VPZmZsaW5lUXVldWUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VPZmZsaW5lUXVldWUnO1xuXG4vKipcbiAqIOemu+e6v+eKtuaAgeW+veeroFxuICpcbiAqIOaYvuekuuWcqOW3peWNleagh+mimOaXge+8jOaMh+ekuuW9k+WJjee9kee7nOeKtuaAgeWSjOW+heWQjOatpeaTjeS9nOaVsOOAglxuICog5Zyo57q/5LiU5peg5b6F5ZCM5q2l5pON5L2c5pe26ZqQ6JeP77yM56a757q/5pe25pi+56S65qmZ6Imy5o+Q56S677yM5Zyo57q/5L2G5pyJXG4gKiDlvoXlkIzmraXmlbDmja7ml7bmmL7npLrok53oibLmj5DnpLrjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE9mZmxpbmVTdGF0dXNCYWRnZSgpIHtcbiAgY29uc3QgeyBpc09mZmxpbmUgfSA9IHVzZU9mZmxpbmVTdGF0dXMoKTtcbiAgY29uc3QgeyBwZW5kaW5nQ291bnQgfSA9IHVzZU9mZmxpbmVRdWV1ZSgpO1xuXG4gIC8vIOWcqOe6v+S4lOaXoOW+heWQjOatpeaTjeS9nOaXtuS4jeaYvuekulxuICBpZiAoIWlzT2ZmbGluZSAmJiBwZW5kaW5nQ291bnQgPT09IDApIHJldHVybiBudWxsO1xuXG4gIGlmIChpc09mZmxpbmUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwiZ2FwLTEgYm9yZGVyLW9yYW5nZS0zMDAgdGV4dC1vcmFuZ2UtNjAwXCI+XG4gICAgICAgIDxDbG91ZE9mZiBjbGFzc05hbWU9XCJoLTMgdy0zXCIgLz5cbiAgICAgICAg56a757q/IHtwZW5kaW5nQ291bnQgPiAwICYmIGAoJHtwZW5kaW5nQ291bnR9IOW+heWQjOatpSlgfVxuICAgICAgPC9CYWRnZT5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8QmFkZ2UgdmFyaWFudD1cIm91dGxpbmVcIiBjbGFzc05hbWU9XCJnYXAtMSBib3JkZXItYmx1ZS0zMDAgdGV4dC1ibHVlLTYwMFwiPlxuICAgICAgPFdpZmkgY2xhc3NOYW1lPVwiaC0zIHctM1wiIC8+XG4gICAgICB7cGVuZGluZ0NvdW50fSDlvoXlkIzmraVcbiAgICA8L0JhZGdlPlxuICApO1xufVxuIl19