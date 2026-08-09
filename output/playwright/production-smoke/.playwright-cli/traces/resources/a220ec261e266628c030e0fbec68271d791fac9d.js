import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/charts/TrendChart.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import ReactECharts from "/src/components/charts/ReactECharts.ts";
import { useTheme } from "/src/hooks/useTheme.ts";
import { echarts } from "/src/components/charts/echarts.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/TrendChart.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 趋势折线图组件
*
* 用于展示设备指标随时间变化的趋势，支持亮色/暗色主题自适应。
* 采用平滑曲线 + 渐变面积填充，视觉效果清晰直观。
*/
export function TrendChart({ title, data, color = "#3b82f6", height = 300 }) {
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
			trigger: "axis",
			backgroundColor: isDark ? "#1e293b" : "#fff",
			borderColor: isDark ? "#334155" : "#e2e8f0",
			textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" }
		},
		grid: {
			left: 50,
			right: 20,
			top: title ? 40 : 20,
			bottom: 30
		},
		xAxis: {
			type: "time",
			axisLine: { lineStyle: { color: isDark ? "#334155" : "#e2e8f0" } },
			axisLabel: {
				color: isDark ? "#94a3b8" : "#64748b",
				fontSize: 11
			}
		},
		yAxis: {
			type: "value",
			axisLine: { show: false },
			splitLine: { lineStyle: { color: isDark ? "#1e293b" : "#f1f5f9" } },
			axisLabel: {
				color: isDark ? "#94a3b8" : "#64748b",
				fontSize: 11
			}
		},
		series: [{
			type: "line",
			data: data.map((d) => [d.time, d.value]),
			smooth: true,
			symbol: "none",
			lineStyle: {
				color,
				width: 2
			},
			areaStyle: { color: {
				type: "linear",
				x: 0,
				y: 0,
				x2: 0,
				y2: 1,
				colorStops: [{
					offset: 0,
					color: color + "40"
				}, {
					offset: 1,
					color: color + "05"
				}]
			} }
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
_s(TrendChart, "JkSxfi8+JQlqgIgDOc3wQN+nVIw=", false, function() {
	return [useTheme];
});
_c = TrendChart;
var _c;
$RefreshReg$(_c, "TrendChart");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/charts/TrendChart.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/TrendChart.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/TrendChart.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/charts/TrendChart.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxlQUFlOzs7Ozs7Ozs7O0FBbUJ4QixPQUFPLFNBQVMsV0FBVyxFQUFFLE9BQU8sTUFBTSxRQUFRLFdBQVcsU0FBUyxPQUF3Qjs7Q0FDNUYsTUFBTSxFQUFFLFVBQVUsU0FBUztDQUMzQixNQUFNLFNBQVMsVUFBVTtDQUV6QixNQUFNLFNBQVM7RUFDYixpQkFBaUI7RUFDakIsT0FBTyxRQUNIO0dBQUUsTUFBTTtHQUFPLFdBQVc7SUFBRSxPQUFPLFNBQVMsWUFBWTtJQUFXLFVBQVU7R0FBRztFQUFFLElBQ2xGO0VBQ0osU0FBUztHQUNQLFNBQVM7R0FDVCxpQkFBaUIsU0FBUyxZQUFZO0dBQ3RDLGFBQWEsU0FBUyxZQUFZO0dBQ2xDLFdBQVcsRUFBRSxPQUFPLFNBQVMsWUFBWSxVQUFVO0VBQ3JEO0VBQ0EsTUFBTTtHQUFFLE1BQU07R0FBSSxPQUFPO0dBQUksS0FBSyxRQUFRLEtBQUs7R0FBSSxRQUFRO0VBQUc7RUFDOUQsT0FBTztHQUNMLE1BQU07R0FDTixVQUFVLEVBQUUsV0FBVyxFQUFFLE9BQU8sU0FBUyxZQUFZLFVBQVUsRUFBRTtHQUNqRSxXQUFXO0lBQUUsT0FBTyxTQUFTLFlBQVk7SUFBVyxVQUFVO0dBQUc7RUFDbkU7RUFDQSxPQUFPO0dBQ0wsTUFBTTtHQUNOLFVBQVUsRUFBRSxNQUFNLE1BQU07R0FDeEIsV0FBVyxFQUFFLFdBQVcsRUFBRSxPQUFPLFNBQVMsWUFBWSxVQUFVLEVBQUU7R0FDbEUsV0FBVztJQUFFLE9BQU8sU0FBUyxZQUFZO0lBQVcsVUFBVTtHQUFHO0VBQ25FO0VBQ0EsUUFBUSxDQUNOO0dBQ0UsTUFBTTtHQUNOLE1BQU0sS0FBSyxLQUFLLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7R0FDdkMsUUFBUTtHQUNSLFFBQVE7R0FDUixXQUFXO0lBQUU7SUFBTyxPQUFPO0dBQUU7R0FDN0IsV0FBVyxFQUNULE9BQU87SUFDTCxNQUFNO0lBQ04sR0FBRztJQUFHLEdBQUc7SUFBRyxJQUFJO0lBQUcsSUFBSTtJQUN2QixZQUFZLENBQ1Y7S0FBRSxRQUFRO0tBQUcsT0FBTyxRQUFRO0lBQUssR0FDakM7S0FBRSxRQUFRO0tBQUcsT0FBTyxRQUFRO0lBQUssQ0FDbkM7R0FDRixFQUNGO0VBQ0YsQ0FDRjtDQUNGO0NBRUEsT0FBTyx3QkFBQyxjQUFEO0VBQXVCO0VBQWlCO0VBQVEsT0FBTyxFQUFFLE9BQU87Q0FBSTs7Ozs7QUFDN0UiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiVHJlbmRDaGFydC50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0RUNoYXJ0cyBmcm9tICcuL1JlYWN0RUNoYXJ0cyc7XG5pbXBvcnQgeyB1c2VUaGVtZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRoZW1lJztcbmltcG9ydCB7IGVjaGFydHMgfSBmcm9tICcuL2VjaGFydHMnO1xuXG5pbnRlcmZhY2UgVHJlbmRDaGFydFByb3BzIHtcbiAgLyoqIOWbvuihqOagh+mimCAqL1xuICB0aXRsZT86IHN0cmluZztcbiAgLyoqIOaXtuW6j+aVsOaNrueCuSAqL1xuICBkYXRhOiBBcnJheTx7IHRpbWU6IHN0cmluZzsgdmFsdWU6IG51bWJlciB9PjtcbiAgLyoqIOaKmOe6v+minOiJsu+8iOWNgeWFrei/m+WItu+8iSAqL1xuICBjb2xvcj86IHN0cmluZztcbiAgLyoqIOWbvuihqOmrmOW6pu+8iOWDj+e0oO+8iSAqL1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICog6LaL5Yq/5oqY57q/5Zu+57uE5Lu2XG4gKlxuICog55So5LqO5bGV56S66K6+5aSH5oyH5qCH6ZqP5pe26Ze05Y+Y5YyW55qE6LaL5Yq/77yM5pSv5oyB5Lqu6ImyL+aal+iJsuS4u+mimOiHqumAguW6lOOAglxuICog6YeH55So5bmz5ruR5puy57q/ICsg5riQ5Y+Y6Z2i56ev5aGr5YWF77yM6KeG6KeJ5pWI5p6c5riF5pmw55u06KeC44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBUcmVuZENoYXJ0KHsgdGl0bGUsIGRhdGEsIGNvbG9yID0gJyMzYjgyZjYnLCBoZWlnaHQgPSAzMDAgfTogVHJlbmRDaGFydFByb3BzKSB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVRoZW1lKCk7XG4gIGNvbnN0IGlzRGFyayA9IHRoZW1lID09PSAnZGFyayc7XG5cbiAgY29uc3Qgb3B0aW9uID0ge1xuICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICB0aXRsZTogdGl0bGVcbiAgICAgID8geyB0ZXh0OiB0aXRsZSwgdGV4dFN0eWxlOiB7IGNvbG9yOiBpc0RhcmsgPyAnI2UyZThmMCcgOiAnIzFlMjkzYicsIGZvbnRTaXplOiAxNCB9IH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIHRvb2x0aXA6IHtcbiAgICAgIHRyaWdnZXI6ICdheGlzJyBhcyBjb25zdCxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogaXNEYXJrID8gJyMxZTI5M2InIDogJyNmZmYnLFxuICAgICAgYm9yZGVyQ29sb3I6IGlzRGFyayA/ICcjMzM0MTU1JyA6ICcjZTJlOGYwJyxcbiAgICAgIHRleHRTdHlsZTogeyBjb2xvcjogaXNEYXJrID8gJyNlMmU4ZjAnIDogJyMxZTI5M2InIH0sXG4gICAgfSxcbiAgICBncmlkOiB7IGxlZnQ6IDUwLCByaWdodDogMjAsIHRvcDogdGl0bGUgPyA0MCA6IDIwLCBib3R0b206IDMwIH0sXG4gICAgeEF4aXM6IHtcbiAgICAgIHR5cGU6ICd0aW1lJyBhcyBjb25zdCxcbiAgICAgIGF4aXNMaW5lOiB7IGxpbmVTdHlsZTogeyBjb2xvcjogaXNEYXJrID8gJyMzMzQxNTUnIDogJyNlMmU4ZjAnIH0gfSxcbiAgICAgIGF4aXNMYWJlbDogeyBjb2xvcjogaXNEYXJrID8gJyM5NGEzYjgnIDogJyM2NDc0OGInLCBmb250U2l6ZTogMTEgfSxcbiAgICB9LFxuICAgIHlBeGlzOiB7XG4gICAgICB0eXBlOiAndmFsdWUnIGFzIGNvbnN0LFxuICAgICAgYXhpc0xpbmU6IHsgc2hvdzogZmFsc2UgfSxcbiAgICAgIHNwbGl0TGluZTogeyBsaW5lU3R5bGU6IHsgY29sb3I6IGlzRGFyayA/ICcjMWUyOTNiJyA6ICcjZjFmNWY5JyB9IH0sXG4gICAgICBheGlzTGFiZWw6IHsgY29sb3I6IGlzRGFyayA/ICcjOTRhM2I4JyA6ICcjNjQ3NDhiJywgZm9udFNpemU6IDExIH0sXG4gICAgfSxcbiAgICBzZXJpZXM6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2xpbmUnIGFzIGNvbnN0LFxuICAgICAgICBkYXRhOiBkYXRhLm1hcCgoZCkgPT4gW2QudGltZSwgZC52YWx1ZV0pLFxuICAgICAgICBzbW9vdGg6IHRydWUsXG4gICAgICAgIHN5bWJvbDogJ25vbmUnLFxuICAgICAgICBsaW5lU3R5bGU6IHsgY29sb3IsIHdpZHRoOiAyIH0sXG4gICAgICAgIGFyZWFTdHlsZToge1xuICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICB0eXBlOiAnbGluZWFyJyBhcyBjb25zdCxcbiAgICAgICAgICAgIHg6IDAsIHk6IDAsIHgyOiAwLCB5MjogMSxcbiAgICAgICAgICAgIGNvbG9yU3RvcHM6IFtcbiAgICAgICAgICAgICAgeyBvZmZzZXQ6IDAsIGNvbG9yOiBjb2xvciArICc0MCcgfSxcbiAgICAgICAgICAgICAgeyBvZmZzZXQ6IDEsIGNvbG9yOiBjb2xvciArICcwNScgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcblxuICByZXR1cm4gPFJlYWN0RUNoYXJ0cyBlY2hhcnRzPXtlY2hhcnRzfSBvcHRpb249e29wdGlvbn0gc3R5bGU9e3sgaGVpZ2h0IH19IC8+O1xufVxuIl19