import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/InstallPrompt.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import { usePWAInstall } from "/src/hooks/usePWA.ts";
import { Download } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/InstallPrompt.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* PWA 安装提示横幅
*
* 当浏览器支持 PWA 安装且用户尚未安装时，在页面底部居中显示提示横幅。
* 用户点击"安装"按钮后触发浏览器原生安装流程。
*/
export function InstallPrompt() {
	_s();
	const { isInstallable, install } = usePWAInstall();
	if (!isInstallable) return null;
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg",
		children: [
			/* @__PURE__ */ _jsxDEV(Download, { className: "h-5 w-5 text-primary" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 18,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("span", {
				className: "text-sm",
				children: "安装 EquipSense 到桌面，获得更好体验"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 19,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV(Button, {
				size: "sm",
				onClick: install,
				children: "安装"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 20,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 17,
		columnNumber: 5
	}, this);
}
_s(InstallPrompt, "jWxqWvVXVE2ZHAQrr1Xm28L6Ppk=", false, function() {
	return [usePWAInstall];
});
_c = InstallPrompt;
var _c;
$RefreshReg$(_c, "InstallPrompt");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/InstallPrompt.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/InstallPrompt.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/InstallPrompt.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/InstallPrompt.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxjQUFjOzs7Ozs7Ozs7O0FBUXZCLE9BQU8sU0FBUyxnQkFBZ0I7O0NBQzlCLE1BQU0sRUFBRSxlQUFlLFlBQVksY0FBYztDQUVqRCxJQUFJLENBQUMsZUFBZSxPQUFPO0NBRTNCLE9BQ0Usd0JBQUMsT0FBRDtFQUFLLFdBQVU7WUFBZjtHQUNFLHdCQUFDLFVBQUQsRUFBVSxXQUFVLHVCQUF3Qjs7Ozs7R0FDNUMsd0JBQUMsUUFBRDtJQUFNLFdBQVU7Y0FBVTtHQUE4Qjs7Ozs7R0FDeEQsd0JBQUMsUUFBRDtJQUFRLE1BQUs7SUFBSyxTQUFTO2NBQVM7R0FFNUI7Ozs7O0VBQ0w7Ozs7OztBQUVUIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkluc3RhbGxQcm9tcHQudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVBXQUluc3RhbGwgfSBmcm9tICcuLi8uLi9ob29rcy91c2VQV0EnO1xuaW1wb3J0IHsgRG93bmxvYWQgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vdWkvYnV0dG9uJztcblxuLyoqXG4gKiBQV0Eg5a6J6KOF5o+Q56S65qiq5bmFXG4gKlxuICog5b2T5rWP6KeI5Zmo5pSv5oyBIFBXQSDlronoo4XkuJTnlKjmiLflsJrmnKrlronoo4Xml7bvvIzlnKjpobXpnaLlupXpg6jlsYXkuK3mmL7npLrmj5DnpLrmqKrluYXjgIJcbiAqIOeUqOaIt+eCueWHu1wi5a6J6KOFXCLmjInpkq7lkI7op6blj5HmtY/op4jlmajljp/nlJ/lronoo4XmtYHnqIvjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEluc3RhbGxQcm9tcHQoKSB7XG4gIGNvbnN0IHsgaXNJbnN0YWxsYWJsZSwgaW5zdGFsbCB9ID0gdXNlUFdBSW5zdGFsbCgpO1xuXG4gIGlmICghaXNJbnN0YWxsYWJsZSkgcmV0dXJuIG51bGw7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGJvdHRvbS00IGxlZnQtMS8yIC10cmFuc2xhdGUteC0xLzIgei01MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyByb3VuZGVkLWxnIGJvcmRlciBiZy1iYWNrZ3JvdW5kIHAtMyBzaGFkb3ctbGdcIj5cbiAgICAgIDxEb3dubG9hZCBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtcHJpbWFyeVwiIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+5a6J6KOFIEVxdWlwU2Vuc2Ug5Yiw5qGM6Z2i77yM6I635b6X5pu05aW95L2T6aqMPC9zcGFuPlxuICAgICAgPEJ1dHRvbiBzaXplPVwic21cIiBvbkNsaWNrPXtpbnN0YWxsfT5cbiAgICAgICAg5a6J6KOFXG4gICAgICA8L0J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==