import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/PriorityBadge.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Badge } from "/src/components/ui/badge.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/PriorityBadge.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 优先级对应的样式映射 */
const priorityStyles = {
	critical: "bg-red-500/10 text-red-500 border-red-500/20",
	high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	low: "bg-gray-500/10 text-gray-500 border-gray-500/20"
};
/** 优先级对应的翻译键映射 */
const priorityLabelKeys = {
	critical: "alert.critical",
	high: "alert.high",
	normal: "alert.normal",
	low: "alert.low"
};
/**
* 工单优先级徽章组件
*
* 根据优先级显示不同颜色的标签：
* - critical → 红色
* - high → 橙色
* - normal → 蓝色
* - low → 灰色
*/
export function PriorityBadge({ priority }) {
	_s();
	const { t } = useTranslation();
	return /* @__PURE__ */ _jsxDEV(Badge, {
		variant: "outline",
		className: priorityStyles[priority] ?? "",
		children: priorityLabelKeys[priority] ? t(priorityLabelKeys[priority]) : priority
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 38,
		columnNumber: 5
	}, this);
}
_s(PriorityBadge, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = PriorityBadge;
var _c;
$RefreshReg$(_c, "PriorityBadge");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/PriorityBadge.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/PriorityBadge.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/PriorityBadge.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/PriorityBadge.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxhQUFhOzs7OztBQUd0QixNQUFNLGlCQUF5QztDQUM3QyxVQUFVO0NBQ1YsTUFBTTtDQUNOLFFBQVE7Q0FDUixLQUFLO0FBQ1A7O0FBR0EsTUFBTSxvQkFBNEM7Q0FDaEQsVUFBVTtDQUNWLE1BQU07Q0FDTixRQUFRO0NBQ1IsS0FBSztBQUNQOzs7Ozs7Ozs7O0FBZ0JBLE9BQU8sU0FBUyxjQUFjLEVBQUUsWUFBZ0M7O0NBQzlELE1BQU0sRUFBRSxNQUFNLGVBQWU7Q0FFN0IsT0FDRSx3QkFBQyxPQUFEO0VBQU8sU0FBUTtFQUFVLFdBQVcsZUFBZSxhQUFhO1lBQzdELGtCQUFrQixZQUFZLEVBQUUsa0JBQWtCLFNBQVMsSUFBSTtDQUMzRDs7Ozs7QUFFWCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJQcmlvcml0eUJhZGdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgQmFkZ2UgfSBmcm9tICcuLi91aS9iYWRnZSc7XG5cbi8qKiDkvJjlhYjnuqflr7nlupTnmoTmoLflvI/mmKDlsIQgKi9cbmNvbnN0IHByaW9yaXR5U3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBjcml0aWNhbDogJ2JnLXJlZC01MDAvMTAgdGV4dC1yZWQtNTAwIGJvcmRlci1yZWQtNTAwLzIwJyxcbiAgaGlnaDogJ2JnLW9yYW5nZS01MDAvMTAgdGV4dC1vcmFuZ2UtNTAwIGJvcmRlci1vcmFuZ2UtNTAwLzIwJyxcbiAgbm9ybWFsOiAnYmctYmx1ZS01MDAvMTAgdGV4dC1ibHVlLTUwMCBib3JkZXItYmx1ZS01MDAvMjAnLFxuICBsb3c6ICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNTAwIGJvcmRlci1ncmF5LTUwMC8yMCcsXG59O1xuXG4vKiog5LyY5YWI57qn5a+55bqU55qE57+76K+R6ZSu5pig5bCEICovXG5jb25zdCBwcmlvcml0eUxhYmVsS2V5czogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgY3JpdGljYWw6ICdhbGVydC5jcml0aWNhbCcsXG4gIGhpZ2g6ICdhbGVydC5oaWdoJyxcbiAgbm9ybWFsOiAnYWxlcnQubm9ybWFsJyxcbiAgbG93OiAnYWxlcnQubG93Jyxcbn07XG5cbmludGVyZmFjZSBQcmlvcml0eUJhZGdlUHJvcHMge1xuICAvKiog5LyY5YWI57qn77yIY3JpdGljYWwgLyBoaWdoIC8gbm9ybWFsIC8gbG9377yJICovXG4gIHByaW9yaXR5OiBzdHJpbmc7XG59XG5cbi8qKlxuICog5bel5Y2V5LyY5YWI57qn5b6956ug57uE5Lu2XG4gKlxuICog5qC55o2u5LyY5YWI57qn5pi+56S65LiN5ZCM6aKc6Imy55qE5qCH562+77yaXG4gKiAtIGNyaXRpY2FsIOKGkiDnuqLoibJcbiAqIC0gaGlnaCDihpIg5qmZ6ImyXG4gKiAtIG5vcm1hbCDihpIg6JOd6ImyXG4gKiAtIGxvdyDihpIg54Gw6ImyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBQcmlvcml0eUJhZGdlKHsgcHJpb3JpdHkgfTogUHJpb3JpdHlCYWRnZVByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxCYWRnZSB2YXJpYW50PVwib3V0bGluZVwiIGNsYXNzTmFtZT17cHJpb3JpdHlTdHlsZXNbcHJpb3JpdHldID8/ICcnfT5cbiAgICAgIHtwcmlvcml0eUxhYmVsS2V5c1twcmlvcml0eV0gPyB0KHByaW9yaXR5TGFiZWxLZXlzW3ByaW9yaXR5XSkgOiBwcmlvcml0eX1cbiAgICA8L0JhZGdlPlxuICApO1xufVxuIl19