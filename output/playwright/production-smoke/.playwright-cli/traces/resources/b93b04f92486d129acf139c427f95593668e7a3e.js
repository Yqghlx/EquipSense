import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/dataquality/DataQualityRadar.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import ReactECharts from "/src/components/charts/ReactECharts.ts";
import { echarts } from "/src/components/charts/echarts.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityRadar.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 数据质量雷达图组件
*
* 以五维雷达图展示数据质量各维度评分，
* 中心显示综合评分。
*/
export function DataQualityRadar({ dimensions, overallScore }) {
	_s();
	const { t } = useTranslation();
	const option = {
		tooltip: { trigger: "item" },
		radar: {
			indicator: [
				{
					name: t("dataquality.completeness"),
					max: 1
				},
				{
					name: t("dataquality.accuracy"),
					max: 1
				},
				{
					name: t("dataquality.timeliness"),
					max: 1
				},
				{
					name: t("dataquality.consistency"),
					max: 1
				},
				{
					name: t("dataquality.validity"),
					max: 1
				}
			],
			shape: "polygon",
			splitNumber: 4,
			axisName: {
				color: "#666",
				fontSize: 11
			}
		},
		series: [{
			type: "radar",
			data: [{
				value: [
					dimensions.completeness,
					dimensions.accuracy,
					dimensions.timeliness,
					dimensions.consistency,
					dimensions.validity
				],
				areaStyle: { color: "rgba(59, 130, 246, 0.2)" },
				lineStyle: { color: "#3b82f6" },
				itemStyle: { color: "#3b82f6" }
			}]
		}],
		graphic: [{
			type: "text",
			left: "center",
			top: "center",
			style: {
				text: `${Math.round(overallScore * 100)}%`,
				fontSize: 28,
				fontWeight: "bold",
				fill: overallScore >= .8 ? "#22c55e" : overallScore >= .6 ? "#eab308" : "#ef4444"
			}
		}]
	};
	return /* @__PURE__ */ _jsxDEV(ReactECharts, {
		echarts,
		option,
		style: { height: 260 }
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 62,
		columnNumber: 10
	}, this);
}
_s(DataQualityRadar, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = DataQualityRadar;
var _c;
$RefreshReg$(_c, "DataQualityRadar");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/dataquality/DataQualityRadar.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityRadar.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityRadar.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityRadar.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxrQkFBa0I7QUFFekIsU0FBUyxlQUFlOzs7Ozs7Ozs7O0FBYXhCLE9BQU8sU0FBUyxpQkFBaUIsRUFBRSxZQUFZLGdCQUF1Qzs7Q0FDcEYsTUFBTSxFQUFFLE1BQU0sZUFBZTtDQUU3QixNQUFNLFNBQVM7RUFDYixTQUFTLEVBQUUsU0FBUyxPQUFnQjtFQUNwQyxPQUFPO0dBQ0wsV0FBVztJQUNUO0tBQUUsTUFBTSxFQUFFLDBCQUEwQjtLQUFHLEtBQUs7SUFBRTtJQUM5QztLQUFFLE1BQU0sRUFBRSxzQkFBc0I7S0FBRyxLQUFLO0lBQUU7SUFDMUM7S0FBRSxNQUFNLEVBQUUsd0JBQXdCO0tBQUcsS0FBSztJQUFFO0lBQzVDO0tBQUUsTUFBTSxFQUFFLHlCQUF5QjtLQUFHLEtBQUs7SUFBRTtJQUM3QztLQUFFLE1BQU0sRUFBRSxzQkFBc0I7S0FBRyxLQUFLO0lBQUU7R0FDNUM7R0FDQSxPQUFPO0dBQ1AsYUFBYTtHQUNiLFVBQVU7SUFBRSxPQUFPO0lBQVEsVUFBVTtHQUFHO0VBQzFDO0VBQ0EsUUFBUSxDQUFDO0dBQ1AsTUFBTTtHQUNOLE1BQU0sQ0FBQztJQUNMLE9BQU87S0FDTCxXQUFXO0tBQ1gsV0FBVztLQUNYLFdBQVc7S0FDWCxXQUFXO0tBQ1gsV0FBVztJQUNiO0lBQ0EsV0FBVyxFQUFFLE9BQU8sMEJBQTBCO0lBQzlDLFdBQVcsRUFBRSxPQUFPLFVBQVU7SUFDOUIsV0FBVyxFQUFFLE9BQU8sVUFBVTtHQUNoQyxDQUFDO0VBQ0gsQ0FBQztFQUNELFNBQVMsQ0FBQztHQUNSLE1BQU07R0FDTixNQUFNO0dBQ04sS0FBSztHQUNMLE9BQU87SUFDTCxNQUFNLEdBQUcsS0FBSyxNQUFNLGVBQWUsR0FBRyxFQUFFO0lBQ3hDLFVBQVU7SUFDVixZQUFZO0lBQ1osTUFBTSxnQkFBZ0IsS0FBTSxZQUFZLGdCQUFnQixLQUFNLFlBQVk7R0FDNUU7RUFDRixDQUFDO0NBQ0g7Q0FFQSxPQUFPLHdCQUFDLGNBQUQ7RUFBdUI7RUFBaUI7RUFBUSxPQUFPLEVBQUUsUUFBUSxJQUFJO0NBQUk7Ozs7O0FBQ2xGIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRhdGFRdWFsaXR5UmFkYXIudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgUmVhY3RFQ2hhcnRzIGZyb20gJy4uL2NoYXJ0cy9SZWFjdEVDaGFydHMnO1xuaW1wb3J0IHR5cGUgeyBEYXRhUXVhbGl0eURpbWVuc2lvbnMgfSBmcm9tICcuLi8uLi9ob29rcy91c2VEYXRhUXVhbGl0eSc7XG5pbXBvcnQgeyBlY2hhcnRzIH0gZnJvbSAnLi4vY2hhcnRzL2VjaGFydHMnO1xuXG5pbnRlcmZhY2UgRGF0YVF1YWxpdHlSYWRhclByb3BzIHtcbiAgZGltZW5zaW9uczogRGF0YVF1YWxpdHlEaW1lbnNpb25zO1xuICBvdmVyYWxsU2NvcmU6IG51bWJlcjtcbn1cblxuLyoqXG4gKiDmlbDmja7otKjph4/pm7fovr7lm77nu4Tku7ZcbiAqXG4gKiDku6XkupTnu7Tpm7fovr7lm77lsZXnpLrmlbDmja7otKjph4/lkITnu7Tluqbor4TliIbvvIxcbiAqIOS4reW/g+aYvuekuue7vOWQiOivhOWIhuOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gRGF0YVF1YWxpdHlSYWRhcih7IGRpbWVuc2lvbnMsIG92ZXJhbGxTY29yZSB9OiBEYXRhUXVhbGl0eVJhZGFyUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIGNvbnN0IG9wdGlvbiA9IHtcbiAgICB0b29sdGlwOiB7IHRyaWdnZXI6ICdpdGVtJyBhcyBjb25zdCB9LFxuICAgIHJhZGFyOiB7XG4gICAgICBpbmRpY2F0b3I6IFtcbiAgICAgICAgeyBuYW1lOiB0KCdkYXRhcXVhbGl0eS5jb21wbGV0ZW5lc3MnKSwgbWF4OiAxIH0sXG4gICAgICAgIHsgbmFtZTogdCgnZGF0YXF1YWxpdHkuYWNjdXJhY3knKSwgbWF4OiAxIH0sXG4gICAgICAgIHsgbmFtZTogdCgnZGF0YXF1YWxpdHkudGltZWxpbmVzcycpLCBtYXg6IDEgfSxcbiAgICAgICAgeyBuYW1lOiB0KCdkYXRhcXVhbGl0eS5jb25zaXN0ZW5jeScpLCBtYXg6IDEgfSxcbiAgICAgICAgeyBuYW1lOiB0KCdkYXRhcXVhbGl0eS52YWxpZGl0eScpLCBtYXg6IDEgfSxcbiAgICAgIF0sXG4gICAgICBzaGFwZTogJ3BvbHlnb24nIGFzIGNvbnN0LFxuICAgICAgc3BsaXROdW1iZXI6IDQsXG4gICAgICBheGlzTmFtZTogeyBjb2xvcjogJyM2NjYnLCBmb250U2l6ZTogMTEgfSxcbiAgICB9LFxuICAgIHNlcmllczogW3tcbiAgICAgIHR5cGU6ICdyYWRhcicgYXMgY29uc3QsXG4gICAgICBkYXRhOiBbe1xuICAgICAgICB2YWx1ZTogW1xuICAgICAgICAgIGRpbWVuc2lvbnMuY29tcGxldGVuZXNzLFxuICAgICAgICAgIGRpbWVuc2lvbnMuYWNjdXJhY3ksXG4gICAgICAgICAgZGltZW5zaW9ucy50aW1lbGluZXNzLFxuICAgICAgICAgIGRpbWVuc2lvbnMuY29uc2lzdGVuY3ksXG4gICAgICAgICAgZGltZW5zaW9ucy52YWxpZGl0eSxcbiAgICAgICAgXSxcbiAgICAgICAgYXJlYVN0eWxlOiB7IGNvbG9yOiAncmdiYSg1OSwgMTMwLCAyNDYsIDAuMiknIH0sXG4gICAgICAgIGxpbmVTdHlsZTogeyBjb2xvcjogJyMzYjgyZjYnIH0sXG4gICAgICAgIGl0ZW1TdHlsZTogeyBjb2xvcjogJyMzYjgyZjYnIH0sXG4gICAgICB9XSxcbiAgICB9XSxcbiAgICBncmFwaGljOiBbe1xuICAgICAgdHlwZTogJ3RleHQnIGFzIGNvbnN0LFxuICAgICAgbGVmdDogJ2NlbnRlcicsXG4gICAgICB0b3A6ICdjZW50ZXInLFxuICAgICAgc3R5bGU6IHtcbiAgICAgICAgdGV4dDogYCR7TWF0aC5yb3VuZChvdmVyYWxsU2NvcmUgKiAxMDApfSVgLFxuICAgICAgICBmb250U2l6ZTogMjgsXG4gICAgICAgIGZvbnRXZWlnaHQ6ICdib2xkJyxcbiAgICAgICAgZmlsbDogb3ZlcmFsbFNjb3JlID49IDAuOCA/ICcjMjJjNTVlJyA6IG92ZXJhbGxTY29yZSA+PSAwLjYgPyAnI2VhYjMwOCcgOiAnI2VmNDQ0NCcsXG4gICAgICB9LFxuICAgIH1dLFxuICB9O1xuXG4gIHJldHVybiA8UmVhY3RFQ2hhcnRzIGVjaGFydHM9e2VjaGFydHN9IG9wdGlvbj17b3B0aW9ufSBzdHlsZT17eyBoZWlnaHQ6IDI2MCB9fSAvPjtcbn1cbiJdfQ==