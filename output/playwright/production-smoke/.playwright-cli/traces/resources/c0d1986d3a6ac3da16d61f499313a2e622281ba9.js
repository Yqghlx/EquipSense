import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/charts/PieChart.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import ReactECharts from "/src/components/charts/ReactECharts.ts";
import { useTheme } from "/src/hooks/useTheme.ts";
import { echarts } from "/src/components/charts/echarts.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/PieChart.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 默认色板 */
const defaultColors = [
	"#3b82f6",
	"#ef4444",
	"#f59e0b",
	"#22c55e",
	"#8b5cf6"
];
/**
* 环形饼图组件
*
* 用于展示分类占比（如告警级别分布、设备状态统计）。
* 支持亮色/暗色主题自适应，悬停时显示标签。
*/
export function PieChart({ title, data, height = 300 }) {
	_s();
	const { theme } = useTheme();
	const isDark = theme === "dark";
	const option = {
		backgroundColor: "transparent",
		title: title ? {
			text: title,
			textStyle: {
				color: isDark ? "#e2e8f0" : "#1e293b",
				fontSize: 14
			}
		} : undefined,
		tooltip: {
			trigger: "item",
			backgroundColor: isDark ? "#1e293b" : "#fff",
			borderColor: isDark ? "#334155" : "#e2e8f0",
			textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" }
		},
		legend: {
			bottom: 0,
			textStyle: {
				color: isDark ? "#94a3b8" : "#64748b",
				fontSize: 12
			}
		},
		series: [{
			type: "pie",
			radius: ["40%", "70%"],
			center: ["50%", "45%"],
			avoidLabelOverlap: false,
			itemStyle: {
				borderRadius: 6,
				borderColor: isDark ? "#0f172a" : "#fff",
				borderWidth: 2
			},
			label: { show: false },
			emphasis: { label: {
				show: true,
				fontSize: 14,
				fontWeight: "bold"
			} },
			data: data.map((d, i) => ({
				name: d.name,
				value: d.value,
				itemStyle: { color: d.color ?? defaultColors[i % defaultColors.length] }
			}))
		}]
	};
	return /* @__PURE__ */ _jsxDEV(ReactECharts, {
		echarts,
		option,
		style: { height }
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 70,
		columnNumber: 10
	}, this);
}
_s(PieChart, "JkSxfi8+JQlqgIgDOc3wQN+nVIw=", false, function() {
	return [useTheme];
});
_c = PieChart;
var _c;
$RefreshReg$(_c, "PieChart");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/charts/PieChart.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/PieChart.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/PieChart.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/PieChart.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxlQUFlOzs7OztBQXNCeEIsTUFBTSxnQkFBZ0I7Q0FBQztDQUFXO0NBQVc7Q0FBVztDQUFXO0FBQVM7Ozs7Ozs7QUFRNUUsT0FBTyxTQUFTLFNBQVMsRUFBRSxPQUFPLE1BQU0sU0FBUyxPQUFzQjs7Q0FDckUsTUFBTSxFQUFFLFVBQVUsU0FBUztDQUMzQixNQUFNLFNBQVMsVUFBVTtDQUV6QixNQUFNLFNBQVM7RUFDYixpQkFBaUI7RUFDakIsT0FBTyxRQUNIO0dBQUUsTUFBTTtHQUFPLFdBQVc7SUFBRSxPQUFPLFNBQVMsWUFBWTtJQUFXLFVBQVU7R0FBRztFQUFFLElBQ2xGO0VBQ0osU0FBUztHQUNQLFNBQVM7R0FDVCxpQkFBaUIsU0FBUyxZQUFZO0dBQ3RDLGFBQWEsU0FBUyxZQUFZO0dBQ2xDLFdBQVcsRUFBRSxPQUFPLFNBQVMsWUFBWSxVQUFVO0VBQ3JEO0VBQ0EsUUFBUTtHQUNOLFFBQVE7R0FDUixXQUFXO0lBQUUsT0FBTyxTQUFTLFlBQVk7SUFBVyxVQUFVO0dBQUc7RUFDbkU7RUFDQSxRQUFRLENBQ047R0FDRSxNQUFNO0dBQ04sUUFBUSxDQUFDLE9BQU8sS0FBSztHQUNyQixRQUFRLENBQUMsT0FBTyxLQUFLO0dBQ3JCLG1CQUFtQjtHQUNuQixXQUFXO0lBQUUsY0FBYztJQUFHLGFBQWEsU0FBUyxZQUFZO0lBQVEsYUFBYTtHQUFFO0dBQ3ZGLE9BQU8sRUFBRSxNQUFNLE1BQU07R0FDckIsVUFBVSxFQUFFLE9BQU87SUFBRSxNQUFNO0lBQU0sVUFBVTtJQUFJLFlBQVk7R0FBTyxFQUFFO0dBQ3BFLE1BQU0sS0FBSyxLQUFLLEdBQUcsT0FBTztJQUN4QixNQUFNLEVBQUU7SUFDUixPQUFPLEVBQUU7SUFDVCxXQUFXLEVBQUUsT0FBTyxFQUFFLFNBQVMsY0FBYyxJQUFJLGNBQWMsUUFBUTtHQUN6RSxFQUFFO0VBQ0osQ0FDRjtDQUNGO0NBRUEsT0FBTyx3QkFBQyxjQUFEO0VBQXVCO0VBQWlCO0VBQVEsT0FBTyxFQUFFLE9BQU87Q0FBSTs7Ozs7QUFDN0UiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiUGllQ2hhcnQudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdEVDaGFydHMgZnJvbSAnLi9SZWFjdEVDaGFydHMnO1xuaW1wb3J0IHsgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VUaGVtZSc7XG5pbXBvcnQgeyBlY2hhcnRzIH0gZnJvbSAnLi9lY2hhcnRzJztcblxuLyoqIOmlvOWbvuaVsOaNrumhuSAqL1xuaW50ZXJmYWNlIFBpZURhdGFJdGVtIHtcbiAgLyoqIOWIhuexu+WQjeensCAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiDmlbDlgLwgKi9cbiAgdmFsdWU6IG51bWJlcjtcbiAgLyoqIOiHquWumuS5ieminOiJsu+8iOWPr+mAie+8jOS4jeS8oOWImeS9v+eUqOm7mOiupOiJsuadv++8iSAqL1xuICBjb2xvcj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFBpZUNoYXJ0UHJvcHMge1xuICAvKiog5Zu+6KGo5qCH6aKYICovXG4gIHRpdGxlPzogc3RyaW5nO1xuICAvKiog6aW85Zu+5pWw5o2uICovXG4gIGRhdGE6IFBpZURhdGFJdGVtW107XG4gIC8qKiDlm77ooajpq5jluqbvvIjlg4/ntKDvvIkgKi9cbiAgaGVpZ2h0PzogbnVtYmVyO1xufVxuXG4vKiog6buY6K6k6Imy5p2/ICovXG5jb25zdCBkZWZhdWx0Q29sb3JzID0gWycjM2I4MmY2JywgJyNlZjQ0NDQnLCAnI2Y1OWUwYicsICcjMjJjNTVlJywgJyM4YjVjZjYnXTtcblxuLyoqXG4gKiDnjq/lvaLppbzlm77nu4Tku7ZcbiAqXG4gKiDnlKjkuo7lsZXnpLrliIbnsbvljaDmr5TvvIjlpoLlkYrorabnuqfliKvliIbluIPjgIHorr7lpIfnirbmgIHnu5/orqHvvInjgIJcbiAqIOaUr+aMgeS6ruiJsi/mmpfoibLkuLvpopjoh6rpgILlupTvvIzmgqzlgZzml7bmmL7npLrmoIfnrb7jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFBpZUNoYXJ0KHsgdGl0bGUsIGRhdGEsIGhlaWdodCA9IDMwMCB9OiBQaWVDaGFydFByb3BzKSB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVRoZW1lKCk7XG4gIGNvbnN0IGlzRGFyayA9IHRoZW1lID09PSAnZGFyayc7XG5cbiAgY29uc3Qgb3B0aW9uID0ge1xuICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICB0aXRsZTogdGl0bGVcbiAgICAgID8geyB0ZXh0OiB0aXRsZSwgdGV4dFN0eWxlOiB7IGNvbG9yOiBpc0RhcmsgPyAnI2UyZThmMCcgOiAnIzFlMjkzYicsIGZvbnRTaXplOiAxNCB9IH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIHRvb2x0aXA6IHtcbiAgICAgIHRyaWdnZXI6ICdpdGVtJyBhcyBjb25zdCxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogaXNEYXJrID8gJyMxZTI5M2InIDogJyNmZmYnLFxuICAgICAgYm9yZGVyQ29sb3I6IGlzRGFyayA/ICcjMzM0MTU1JyA6ICcjZTJlOGYwJyxcbiAgICAgIHRleHRTdHlsZTogeyBjb2xvcjogaXNEYXJrID8gJyNlMmU4ZjAnIDogJyMxZTI5M2InIH0sXG4gICAgfSxcbiAgICBsZWdlbmQ6IHtcbiAgICAgIGJvdHRvbTogMCxcbiAgICAgIHRleHRTdHlsZTogeyBjb2xvcjogaXNEYXJrID8gJyM5NGEzYjgnIDogJyM2NDc0OGInLCBmb250U2l6ZTogMTIgfSxcbiAgICB9LFxuICAgIHNlcmllczogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAncGllJyBhcyBjb25zdCxcbiAgICAgICAgcmFkaXVzOiBbJzQwJScsICc3MCUnXSxcbiAgICAgICAgY2VudGVyOiBbJzUwJScsICc0NSUnXSxcbiAgICAgICAgYXZvaWRMYWJlbE92ZXJsYXA6IGZhbHNlLFxuICAgICAgICBpdGVtU3R5bGU6IHsgYm9yZGVyUmFkaXVzOiA2LCBib3JkZXJDb2xvcjogaXNEYXJrID8gJyMwZjE3MmEnIDogJyNmZmYnLCBib3JkZXJXaWR0aDogMiB9LFxuICAgICAgICBsYWJlbDogeyBzaG93OiBmYWxzZSB9LFxuICAgICAgICBlbXBoYXNpczogeyBsYWJlbDogeyBzaG93OiB0cnVlLCBmb250U2l6ZTogMTQsIGZvbnRXZWlnaHQ6ICdib2xkJyB9IH0sXG4gICAgICAgIGRhdGE6IGRhdGEubWFwKChkLCBpKSA9PiAoe1xuICAgICAgICAgIG5hbWU6IGQubmFtZSxcbiAgICAgICAgICB2YWx1ZTogZC52YWx1ZSxcbiAgICAgICAgICBpdGVtU3R5bGU6IHsgY29sb3I6IGQuY29sb3IgPz8gZGVmYXVsdENvbG9yc1tpICUgZGVmYXVsdENvbG9ycy5sZW5ndGhdIH0sXG4gICAgICAgIH0pKSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcblxuICByZXR1cm4gPFJlYWN0RUNoYXJ0cyBlY2hhcnRzPXtlY2hhcnRzfSBvcHRpb249e29wdGlvbn0gc3R5bGU9e3sgaGVpZ2h0IH19IC8+O1xufVxuIl19