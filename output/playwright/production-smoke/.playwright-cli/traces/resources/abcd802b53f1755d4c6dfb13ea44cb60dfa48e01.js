import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/device/DeviceStatusBadge.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { Badge } from "/src/components/ui/badge.tsx";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceStatusBadge.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 设备状态对应的样式映射 */
const statusStyles = {
	online: "bg-green-500/10 text-green-500 border-green-500/20",
	offline: "bg-gray-500/10 text-gray-500 border-gray-500/20",
	maintenance: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
};
/**
* 设备状态徽章组件
*
* 根据设备在线状态显示不同颜色的标签，颜色映射：
* - online → 绿色
* - offline → 灰色
* - maintenance → 黄色
*/
export function DeviceStatusBadge({ status }) {
	_s();
	const { t } = useTranslation();
	// 后端返回 PascalCase（Online/Offline/Maintenance），i18n 键用小写
	const label = t(`device.${status.toLowerCase()}`);
	return /* @__PURE__ */ _jsxDEV(Badge, {
		variant: "outline",
		className: statusStyles[status] ?? "",
		children: label
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 29,
		columnNumber: 5
	}, this);
}
_s(DeviceStatusBadge, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = DeviceStatusBadge;
var _c;
$RefreshReg$(_c, "DeviceStatusBadge");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/device/DeviceStatusBadge.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceStatusBadge.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceStatusBadge.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceStatusBadge.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsc0JBQXNCOzs7OztBQUcvQixNQUFNLGVBQXVDO0NBQzNDLFFBQVE7Q0FDUixTQUFTO0NBQ1QsYUFBYTtBQUNmOzs7Ozs7Ozs7QUFlQSxPQUFPLFNBQVMsa0JBQWtCLEVBQUUsVUFBa0M7O0NBQ3BFLE1BQU0sRUFBRSxNQUFNLGVBQWU7O0NBRTdCLE1BQU0sUUFBUSxFQUFFLFVBQVUsT0FBTyxZQUFZLEdBQWdFO0NBQzdHLE9BQ0Usd0JBQUMsT0FBRDtFQUFPLFNBQVE7RUFBVSxXQUFXLGFBQWEsV0FBVztZQUN6RDtDQUNJOzs7OztBQUVYIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRldmljZVN0YXR1c0JhZGdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYWRnZSB9IGZyb20gJy4uL3VpL2JhZGdlJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5cbi8qKiDorr7lpIfnirbmgIHlr7nlupTnmoTmoLflvI/mmKDlsIQgKi9cbmNvbnN0IHN0YXR1c1N0eWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgb25saW5lOiAnYmctZ3JlZW4tNTAwLzEwIHRleHQtZ3JlZW4tNTAwIGJvcmRlci1ncmVlbi01MDAvMjAnLFxuICBvZmZsaW5lOiAnYmctZ3JheS01MDAvMTAgdGV4dC1ncmF5LTUwMCBib3JkZXItZ3JheS01MDAvMjAnLFxuICBtYWludGVuYW5jZTogJ2JnLXllbGxvdy01MDAvMTAgdGV4dC15ZWxsb3ctNTAwIGJvcmRlci15ZWxsb3ctNTAwLzIwJyxcbn07XG5cbmludGVyZmFjZSBEZXZpY2VTdGF0dXNCYWRnZVByb3BzIHtcbiAgLyoqIOiuvuWkh+eKtuaAge+8iG9ubGluZSAvIG9mZmxpbmUgLyBtYWludGVuYW5jZe+8iSAqL1xuICBzdGF0dXM6IHN0cmluZztcbn1cblxuLyoqXG4gKiDorr7lpIfnirbmgIHlvr3nq6Dnu4Tku7ZcbiAqXG4gKiDmoLnmja7orr7lpIflnKjnur/nirbmgIHmmL7npLrkuI3lkIzpopzoibLnmoTmoIfnrb7vvIzpopzoibLmmKDlsITvvJpcbiAqIC0gb25saW5lIOKGkiDnu7/oibJcbiAqIC0gb2ZmbGluZSDihpIg54Gw6ImyXG4gKiAtIG1haW50ZW5hbmNlIOKGkiDpu4ToibJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIERldmljZVN0YXR1c0JhZGdlKHsgc3RhdHVzIH06IERldmljZVN0YXR1c0JhZGdlUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAvLyDlkI7nq6/ov5Tlm54gUGFzY2FsQ2FzZe+8iE9ubGluZS9PZmZsaW5lL01haW50ZW5hbmNl77yJ77yMaTE4biDplK7nlKjlsI/lhplcbiAgY29uc3QgbGFiZWwgPSB0KGBkZXZpY2UuJHtzdGF0dXMudG9Mb3dlckNhc2UoKX1gIGFzICdkZXZpY2Uub25saW5lJyB8ICdkZXZpY2Uub2ZmbGluZScgfCAnZGV2aWNlLm1haW50ZW5hbmNlJyk7XG4gIHJldHVybiAoXG4gICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPXtzdGF0dXNTdHlsZXNbc3RhdHVzXSA/PyAnJ30+XG4gICAgICB7bGFiZWx9XG4gICAgPC9CYWRnZT5cbiAgKTtcbn1cbiJdfQ==