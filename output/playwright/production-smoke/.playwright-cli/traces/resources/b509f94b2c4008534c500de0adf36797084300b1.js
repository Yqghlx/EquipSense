import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/RealtimeIndicator.tsx");const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { useRealtimeStore } from "/src/stores/realtimeStore.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RealtimeIndicator.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* SignalR 实时连接状态指示器
*
* 工业监控场景下，实时连接中断意味着告警推送、遥测更新全部停止。如果用户无感知
* （浏览器仍显示在线），可能错过正在发生的 Critical 告警 —— 这是安全隐患。
* 本组件在 Header 显示一个彩色圆点，让用户一眼看出实时通道是否健康：
*   🟢 connected     — 实时连接正常
*   🟡 reconnecting  — 正在重连（最多等 30 秒），实时数据可能延迟
*   ⚪ disconnected  — 已断开，实时推送已停止，请检查网络或刷新页面
*
* 与 OfflineIndicator（监听 navigator.onLine）互补：
*   浏览器在线 ≠ SignalR 连接正常（服务器重启、代理超时都会让 WebSocket 断而浏览器在线）。
*/
const STATUS_CONFIG = {
	connected: {
		color: "bg-green-500",
		pulse: false,
		tooltipKey: "realtime.connected",
		fallback: "实时连接正常"
	},
	connecting: {
		color: "bg-blue-500",
		pulse: true,
		tooltipKey: "realtime.connecting",
		fallback: "正在建立实时连接"
	},
	reconnecting: {
		color: "bg-yellow-500",
		pulse: true,
		tooltipKey: "realtime.reconnecting",
		fallback: "实时连接断开，正在重连…"
	},
	disconnected: {
		color: "bg-gray-400",
		pulse: false,
		tooltipKey: "realtime.disconnected",
		fallback: "实时连接已断开，请检查网络"
	}
};
export function RealtimeIndicator() {
	_s();
	const { t } = useTranslation();
	const status = useRealtimeStore((s) => s.status);
	const cfg = STATUS_CONFIG[status];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "flex items-center gap-1.5",
		title: t(cfg.tooltipKey, cfg.fallback),
		role: "status",
		"aria-label": t(cfg.tooltipKey, cfg.fallback),
		children: /* @__PURE__ */ _jsxDEV("span", {
			className: `relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.color}`,
			children: cfg.pulse && /* @__PURE__ */ _jsxDEV("span", { className: `absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.color} opacity-75` }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 38,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 36,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 30,
		columnNumber: 5
	}, this);
}
_s(RealtimeIndicator, "uxl+175tocijsHMRlWw489VqAjM=", false, function() {
	return [useTranslation, useRealtimeStore];
});
_c = RealtimeIndicator;
var _c;
$RefreshReg$(_c, "RealtimeIndicator");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/RealtimeIndicator.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RealtimeIndicator.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RealtimeIndicator.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RealtimeIndicator.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyx3QkFBc0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZS9ELE1BQU0sZ0JBQTBIO0NBQzlILFdBQVc7RUFBRSxPQUFPO0VBQWdCLE9BQU87RUFBTyxZQUFZO0VBQXNCLFVBQVU7Q0FBUztDQUN2RyxZQUFZO0VBQUUsT0FBTztFQUFlLE9BQU87RUFBTSxZQUFZO0VBQXVCLFVBQVU7Q0FBVztDQUN6RyxjQUFjO0VBQUUsT0FBTztFQUFpQixPQUFPO0VBQU0sWUFBWTtFQUF5QixVQUFVO0NBQWU7Q0FDbkgsY0FBYztFQUFFLE9BQU87RUFBZSxPQUFPO0VBQU8sWUFBWTtFQUF5QixVQUFVO0NBQWdCO0FBQ3JIO0FBRUEsT0FBTyxTQUFTLG9CQUFvQjs7Q0FDbEMsTUFBTSxFQUFFLE1BQU0sZUFBZTtDQUM3QixNQUFNLFNBQVMsa0JBQWtCLE1BQU0sRUFBRSxNQUFNO0NBQy9DLE1BQU0sTUFBTSxjQUFjO0NBRTFCLE9BQ0Usd0JBQUMsT0FBRDtFQUNFLFdBQVU7RUFDVixPQUFPLEVBQUUsSUFBSSxZQUFZLElBQUksUUFBUTtFQUNyQyxNQUFLO0VBQ0wsY0FBWSxFQUFFLElBQUksWUFBWSxJQUFJLFFBQVE7WUFFMUMsd0JBQUMsUUFBRDtHQUFNLFdBQVcsaURBQWlELElBQUk7YUFDbkUsSUFBSSxTQUNILHdCQUFDLFFBQUQsRUFBTSxXQUFXLGdFQUFnRSxJQUFJLE1BQU0sYUFBZTs7Ozs7RUFFeEc7Ozs7O0NBQ0g7Ozs7O0FBRVQiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiUmVhbHRpbWVJbmRpY2F0b3IudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VSZWFsdGltZVN0b3JlLCB0eXBlIFJlYWx0aW1lQ29ubmVjdGlvblN0YXRlIH0gZnJvbSAnLi4vLi4vc3RvcmVzL3JlYWx0aW1lU3RvcmUnO1xuXG4vKipcbiAqIFNpZ25hbFIg5a6e5pe26L+e5o6l54q25oCB5oyH56S65ZmoXG4gKlxuICog5bel5Lia55uR5o6n5Zy65pmv5LiL77yM5a6e5pe26L+e5o6l5Lit5pat5oSP5ZGz552A5ZGK6K2m5o6o6YCB44CB6YGl5rWL5pu05paw5YWo6YOo5YGc5q2i44CC5aaC5p6c55So5oi35peg5oSf55+lXG4gKiDvvIjmtY/op4jlmajku43mmL7npLrlnKjnur/vvInvvIzlj6/og73plJnov4fmraPlnKjlj5HnlJ/nmoQgQ3JpdGljYWwg5ZGK6K2mIOKAlOKAlCDov5nmmK/lronlhajpmpDmgqPjgIJcbiAqIOacrOe7hOS7tuWcqCBIZWFkZXIg5pi+56S65LiA5Liq5b2p6Imy5ZyG54K577yM6K6p55So5oi35LiA55y855yL5Ye65a6e5pe26YCa6YGT5piv5ZCm5YGl5bq377yaXG4gKiAgIPCfn6IgY29ubmVjdGVkICAgICDigJQg5a6e5pe26L+e5o6l5q2j5bi4XG4gKiAgIPCfn6EgcmVjb25uZWN0aW5nICDigJQg5q2j5Zyo6YeN6L+e77yI5pyA5aSa562JIDMwIOenku+8ie+8jOWunuaXtuaVsOaNruWPr+iDveW7tui/n1xuICogICDimqogZGlzY29ubmVjdGVkICDigJQg5bey5pat5byA77yM5a6e5pe25o6o6YCB5bey5YGc5q2i77yM6K+35qOA5p+l572R57uc5oiW5Yi35paw6aG16Z2iXG4gKlxuICog5LiOIE9mZmxpbmVJbmRpY2F0b3LvvIjnm5HlkKwgbmF2aWdhdG9yLm9uTGluZe+8ieS6kuihpe+8mlxuICogICDmtY/op4jlmajlnKjnur8g4omgIFNpZ25hbFIg6L+e5o6l5q2j5bi477yI5pyN5Yqh5Zmo6YeN5ZCv44CB5Luj55CG6LaF5pe26YO95Lya6K6pIFdlYlNvY2tldCDmlq3ogIzmtY/op4jlmajlnKjnur/vvInjgIJcbiAqL1xuY29uc3QgU1RBVFVTX0NPTkZJRzogUmVjb3JkPFJlYWx0aW1lQ29ubmVjdGlvblN0YXRlLCB7IGNvbG9yOiBzdHJpbmc7IHB1bHNlOiBib29sZWFuOyB0b29sdGlwS2V5OiBzdHJpbmc7IGZhbGxiYWNrOiBzdHJpbmcgfT4gPSB7XG4gIGNvbm5lY3RlZDogeyBjb2xvcjogJ2JnLWdyZWVuLTUwMCcsIHB1bHNlOiBmYWxzZSwgdG9vbHRpcEtleTogJ3JlYWx0aW1lLmNvbm5lY3RlZCcsIGZhbGxiYWNrOiAn5a6e5pe26L+e5o6l5q2j5bi4JyB9LFxuICBjb25uZWN0aW5nOiB7IGNvbG9yOiAnYmctYmx1ZS01MDAnLCBwdWxzZTogdHJ1ZSwgdG9vbHRpcEtleTogJ3JlYWx0aW1lLmNvbm5lY3RpbmcnLCBmYWxsYmFjazogJ+ato+WcqOW7uueri+WunuaXtui/nuaOpScgfSxcbiAgcmVjb25uZWN0aW5nOiB7IGNvbG9yOiAnYmcteWVsbG93LTUwMCcsIHB1bHNlOiB0cnVlLCB0b29sdGlwS2V5OiAncmVhbHRpbWUucmVjb25uZWN0aW5nJywgZmFsbGJhY2s6ICflrp7ml7bov57mjqXmlq3lvIDvvIzmraPlnKjph43ov57igKYnIH0sXG4gIGRpc2Nvbm5lY3RlZDogeyBjb2xvcjogJ2JnLWdyYXktNDAwJywgcHVsc2U6IGZhbHNlLCB0b29sdGlwS2V5OiAncmVhbHRpbWUuZGlzY29ubmVjdGVkJywgZmFsbGJhY2s6ICflrp7ml7bov57mjqXlt7Lmlq3lvIDvvIzor7fmo4Dmn6XnvZHnu5wnIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gUmVhbHRpbWVJbmRpY2F0b3IoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3Qgc3RhdHVzID0gdXNlUmVhbHRpbWVTdG9yZSgocykgPT4gcy5zdGF0dXMpO1xuICBjb25zdCBjZmcgPSBTVEFUVVNfQ09ORklHW3N0YXR1c107XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCJcbiAgICAgIHRpdGxlPXt0KGNmZy50b29sdGlwS2V5LCBjZmcuZmFsbGJhY2spfVxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICBhcmlhLWxhYmVsPXt0KGNmZy50b29sdGlwS2V5LCBjZmcuZmFsbGJhY2spfVxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHJlbGF0aXZlIGlubGluZS1mbGV4IGgtMi41IHctMi41IHJvdW5kZWQtZnVsbCAke2NmZy5jb2xvcn1gfT5cbiAgICAgICAge2NmZy5wdWxzZSAmJiAoXG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgYWJzb2x1dGUgaW5saW5lLWZsZXggaC1mdWxsIHctZnVsbCBhbmltYXRlLXBpbmcgcm91bmRlZC1mdWxsICR7Y2ZnLmNvbG9yfSBvcGFjaXR5LTc1YH0gLz5cbiAgICAgICAgKX1cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==