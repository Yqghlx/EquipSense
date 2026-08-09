import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/dataquality/DataQualityOverview.tsx");const _jsxDEV = __vite__cjsImport4_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Card, CardContent, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
import { useDataQualityOverview } from "/src/hooks/useDataQuality.ts";
import { DataQualityRadar } from "/src/components/dataquality/DataQualityRadar.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityOverview.tsx";
import __vite__cjsImport4_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 设备数据质量概览组件
*
* 展示设备综合数据质量雷达图和各指标评分条形图。
* 用于设备详情页中嵌入。
*/
export function DataQualityOverviewCard({ deviceId }) {
	_s();
	const { t } = useTranslation();
	const { data, isLoading } = useDataQualityOverview(deviceId);
	if (isLoading) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("dataquality.title") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 23,
			columnNumber: 21
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 23,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("div", {
			className: "py-8 text-center text-muted-foreground",
			children: t("common.loading")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 24,
			columnNumber: 22
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 24,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 22,
			columnNumber: 7
		}, this);
	}
	if (!data || !Array.isArray(data.metrics) || data.metrics.length === 0) {
		return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("dataquality.title") }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 32,
			columnNumber: 21
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 32,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: /* @__PURE__ */ _jsxDEV("div", {
			className: "py-8 text-center text-muted-foreground",
			children: t("dataquality.noData")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 33,
			columnNumber: 22
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 33,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 31,
			columnNumber: 7
		}, this);
	}
	/** 综合评分对应的颜色 */
	const scoreColor = (score) => score >= .8 ? "bg-green-500" : score >= .6 ? "bg-yellow-500" : "bg-red-500";
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, { children: t("dataquality.title") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 44,
		columnNumber: 19
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 44,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "space-y-4",
		children: [data.metrics[0]?.dimensions && /* @__PURE__ */ _jsxDEV(DataQualityRadar, {
			dimensions: data.metrics[0].dimensions,
			overallScore: data.overallScore
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 48,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV("div", {
			className: "space-y-2",
			children: data.metrics.map((m) => /* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "flex justify-between text-sm",
					children: [/* @__PURE__ */ _jsxDEV("span", {
						className: "font-medium",
						children: m.metric
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 56,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV("span", {
						className: "text-muted-foreground",
						children: [Math.round(m.score * 100), "%"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 57,
						columnNumber: 17
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 55,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "h-2 rounded-full bg-muted",
					children: /* @__PURE__ */ _jsxDEV("div", {
						className: `h-full rounded-full transition-all ${scoreColor(m.score)}`,
						style: { width: `${Math.round(m.score * 100)}%` }
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 60,
						columnNumber: 17
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 59,
					columnNumber: 15
				}, this)]
			}, m.metric, true, {
				fileName: _jsxFileName,
				lineNumber: 54,
				columnNumber: 13
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 52,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 45,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 43,
		columnNumber: 5
	}, this);
}
_s(DataQualityOverviewCard, "qzNa/kicmVYJkALUn+0oeP9B42k=", false, function() {
	return [useTranslation, useDataQualityOverview];
});
_c = DataQualityOverviewCard;
var _c;
$RefreshReg$(_c, "DataQualityOverviewCard");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/dataquality/DataQualityOverview.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityOverview.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityOverview.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/dataquality/DataQualityOverview.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxNQUFNLGFBQWEsWUFBWSxpQkFBaUI7QUFDekQsU0FBUyw4QkFBOEI7QUFDdkMsU0FBUyx3QkFBd0I7Ozs7Ozs7Ozs7QUFZakMsT0FBTyxTQUFTLHdCQUF3QixFQUFFLFlBQXNDOztDQUM5RSxNQUFNLEVBQUUsTUFBTSxlQUFlO0NBQzdCLE1BQU0sRUFBRSxNQUFNLGNBQWMsdUJBQXVCLFFBQVE7Q0FFM0QsSUFBSSxXQUFXO0VBQ2IsT0FDRSx3QkFBQyxNQUFELGFBQ0Usd0JBQUMsWUFBRCxZQUFZLHdCQUFDLFdBQUQsWUFBWSxFQUFFLG1CQUFtQixFQUFhOzs7O1dBQWE7Ozs7WUFDdkUsd0JBQUMsYUFBRCxZQUFhLHdCQUFDLE9BQUQ7R0FBSyxXQUFVO2FBQTBDLEVBQUUsZ0JBQWdCO0VBQU87Ozs7V0FBYzs7OztVQUN6Rzs7Ozs7Q0FFVjtDQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxRQUFRLEtBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxXQUFXLEdBQUc7RUFDdEUsT0FDRSx3QkFBQyxNQUFELGFBQ0Usd0JBQUMsWUFBRCxZQUFZLHdCQUFDLFdBQUQsWUFBWSxFQUFFLG1CQUFtQixFQUFhOzs7O1dBQWE7Ozs7WUFDdkUsd0JBQUMsYUFBRCxZQUFhLHdCQUFDLE9BQUQ7R0FBSyxXQUFVO2FBQTBDLEVBQUUsb0JBQW9CO0VBQU87Ozs7V0FBYzs7OztVQUM3Rzs7Ozs7Q0FFVjs7Q0FHQSxNQUFNLGNBQWMsVUFDbEIsU0FBUyxLQUFNLGlCQUFpQixTQUFTLEtBQU0sa0JBQWtCO0NBRW5FLE9BQ0Usd0JBQUMsTUFBRCxhQUNFLHdCQUFDLFlBQUQsWUFBWSx3QkFBQyxXQUFELFlBQVksRUFBRSxtQkFBbUIsRUFBYTs7OztVQUFhOzs7O1dBQ3ZFLHdCQUFDLGFBQUQ7RUFBYSxXQUFVO1lBQXZCLENBRUcsS0FBSyxRQUFRLEVBQUUsRUFBRSxjQUNoQix3QkFBQyxrQkFBRDtHQUFrQixZQUFZLEtBQUssUUFBUSxFQUFFLENBQUM7R0FBWSxjQUFjLEtBQUs7RUFBZTs7OztZQUk5Rix3QkFBQyxPQUFEO0dBQUssV0FBVTthQUNaLEtBQUssUUFBUSxLQUFLLE1BQ2pCLHdCQUFDLE9BQUQ7SUFBb0IsV0FBVTtjQUE5QixDQUNFLHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQWYsQ0FDRSx3QkFBQyxRQUFEO01BQU0sV0FBVTtnQkFBZSxFQUFFO0tBQWE7Ozs7ZUFDOUMsd0JBQUMsUUFBRDtNQUFNLFdBQVU7Z0JBQWhCLENBQXlDLEtBQUssTUFBTSxFQUFFLFFBQVEsR0FBRyxHQUFFLEdBQU87Ozs7O2FBQ3ZFOzs7OztjQUNMLHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQ2Isd0JBQUMsT0FBRDtNQUNFLFdBQVcsc0NBQXNDLFdBQVcsRUFBRSxLQUFLO01BQ25FLE9BQU8sRUFBRSxPQUFPLEdBQUcsS0FBSyxNQUFNLEVBQUUsUUFBUSxHQUFHLEVBQUUsR0FBRztLQUNqRDs7Ozs7SUFDRTs7OztZQUNGO01BWEssRUFBRTs7OztVQVdQLENBQ047RUFDRTs7OztVQUNNOzs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRhdGFRdWFsaXR5T3ZlcnZpZXcudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBDYXJkLCBDYXJkQ29udGVudCwgQ2FyZEhlYWRlciwgQ2FyZFRpdGxlIH0gZnJvbSAnLi4vdWkvY2FyZCc7XG5pbXBvcnQgeyB1c2VEYXRhUXVhbGl0eU92ZXJ2aWV3IH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlRGF0YVF1YWxpdHknO1xuaW1wb3J0IHsgRGF0YVF1YWxpdHlSYWRhciB9IGZyb20gJy4vRGF0YVF1YWxpdHlSYWRhcic7XG5cbmludGVyZmFjZSBEYXRhUXVhbGl0eU92ZXJ2aWV3UHJvcHMge1xuICBkZXZpY2VJZDogc3RyaW5nO1xufVxuXG4vKipcbiAqIOiuvuWkh+aVsOaNrui0qOmHj+amguiniOe7hOS7tlxuICpcbiAqIOWxleekuuiuvuWkh+e7vOWQiOaVsOaNrui0qOmHj+mbt+i+vuWbvuWSjOWQhOaMh+agh+ivhOWIhuadoeW9ouWbvuOAglxuICog55So5LqO6K6+5aSH6K+m5oOF6aG15Lit5bWM5YWl44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBEYXRhUXVhbGl0eU92ZXJ2aWV3Q2FyZCh7IGRldmljZUlkIH06IERhdGFRdWFsaXR5T3ZlcnZpZXdQcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHsgZGF0YSwgaXNMb2FkaW5nIH0gPSB1c2VEYXRhUXVhbGl0eU92ZXJ2aWV3KGRldmljZUlkKTtcblxuICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxDYXJkPlxuICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlPnt0KCdkYXRhcXVhbGl0eS50aXRsZScpfTwvQ2FyZFRpdGxlPjwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50PjxkaXYgY2xhc3NOYW1lPVwicHktOCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L2Rpdj48L0NhcmRDb250ZW50PlxuICAgICAgPC9DYXJkPlxuICAgICk7XG4gIH1cblxuICBpZiAoIWRhdGEgfHwgIUFycmF5LmlzQXJyYXkoZGF0YS5tZXRyaWNzKSB8fCBkYXRhLm1ldHJpY3MubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxDYXJkPlxuICAgICAgICA8Q2FyZEhlYWRlcj48Q2FyZFRpdGxlPnt0KCdkYXRhcXVhbGl0eS50aXRsZScpfTwvQ2FyZFRpdGxlPjwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50PjxkaXYgY2xhc3NOYW1lPVwicHktOCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGF0YXF1YWxpdHkubm9EYXRhJyl9PC9kaXY+PC9DYXJkQ29udGVudD5cbiAgICAgIDwvQ2FyZD5cbiAgICApO1xuICB9XG5cbiAgLyoqIOe7vOWQiOivhOWIhuWvueW6lOeahOminOiJsiAqL1xuICBjb25zdCBzY29yZUNvbG9yID0gKHNjb3JlOiBudW1iZXIpID0+XG4gICAgc2NvcmUgPj0gMC44ID8gJ2JnLWdyZWVuLTUwMCcgOiBzY29yZSA+PSAwLjYgPyAnYmcteWVsbG93LTUwMCcgOiAnYmctcmVkLTUwMCc7XG5cbiAgcmV0dXJuIChcbiAgICA8Q2FyZD5cbiAgICAgIDxDYXJkSGVhZGVyPjxDYXJkVGl0bGU+e3QoJ2RhdGFxdWFsaXR5LnRpdGxlJyl9PC9DYXJkVGl0bGU+PC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICB7Lyog57u85ZCI6K+E5YiG6Zu36L6+5Zu+77yI5Y+W56ys5LiA5Liq5pyJ57u05bqm5pWw5o2u55qE5oyH5qCH77yJICovfVxuICAgICAgICB7ZGF0YS5tZXRyaWNzWzBdPy5kaW1lbnNpb25zICYmIChcbiAgICAgICAgICA8RGF0YVF1YWxpdHlSYWRhciBkaW1lbnNpb25zPXtkYXRhLm1ldHJpY3NbMF0uZGltZW5zaW9uc30gb3ZlcmFsbFNjb3JlPXtkYXRhLm92ZXJhbGxTY29yZX0gLz5cbiAgICAgICAgKX1cblxuICAgICAgICB7Lyog5ZCE5oyH5qCH6K+E5YiG5p2h5b2i5Zu+ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgIHtkYXRhLm1ldHJpY3MubWFwKChtKSA9PiAoXG4gICAgICAgICAgICA8ZGl2IGtleT17bS5tZXRyaWN9IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc21cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnttLm1ldHJpY308L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e01hdGgucm91bmQobS5zY29yZSAqIDEwMCl9JTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0yIHJvdW5kZWQtZnVsbCBiZy1tdXRlZFwiPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1hbGwgJHtzY29yZUNvbG9yKG0uc2NvcmUpfWB9XG4gICAgICAgICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7TWF0aC5yb3VuZChtLnNjb3JlICogMTAwKX0lYCB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=