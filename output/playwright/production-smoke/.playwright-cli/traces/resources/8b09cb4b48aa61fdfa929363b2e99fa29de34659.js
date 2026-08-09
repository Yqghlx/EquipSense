import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/layout/RootErrorBoundary.tsx");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false};const Component = __vite__cjsImport0_react["Component"];const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { AlertTriangle, RotateCw, Home } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RootErrorBoundary.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
export class RootErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null
		};
	}
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, info) {
		// 结构化日志，便于排查（生产可接入 Sentry 等）
		console.error("[RootErrorBoundary] 未捕获的渲染错误", {
			message: error.message,
			stack: error.stack,
			componentStack: info.componentStack
		});
	}
	handleReload = () => {
		// 清空错误状态后整页刷新，确保懒加载 chunk 重新获取
		this.setState({
			hasError: false,
			error: null
		});
		window.location.reload();
	};
	handleGoHome = () => {
		this.setState({
			hasError: false,
			error: null
		});
		// 跳首页而非刷新，保留 SPA 体验（避免重复触发同一崩溃 chunk）
		window.location.href = "/dashboard";
	};
	render() {
		if (!this.state.hasError) return this.props.children;
		const isChunkLoadError = this.state.error?.name === "ChunkLoadError" || this.state.error?.message?.includes("Failed to fetch dynamically imported module") || this.state.error?.message?.includes("Loading chunk");
		return /* @__PURE__ */ _jsxDEV("div", {
			className: "flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10",
					children: /* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-8 w-8 text-destructive" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 65,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 64,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ _jsxDEV("h1", {
						className: "text-2xl font-semibold",
						children: isChunkLoadError ? "页面加载失败" : "页面发生错误"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 68,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "max-w-md text-sm text-muted-foreground",
						children: isChunkLoadError ? "可能是应用已发布新版本或网络不稳。请尝试重新加载。" : "应用遇到了意外错误。您可以返回首页继续操作，或重新加载页面。"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 71,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 67,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						onClick: this.handleReload,
						className: "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: [/* @__PURE__ */ _jsxDEV(RotateCw, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 13
						}, this), "重新加载"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 78,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						onClick: this.handleGoHome,
						className: "inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent",
						children: [/* @__PURE__ */ _jsxDEV(Home, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 13
						}, this), "返回首页"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 86,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 77,
					columnNumber: 9
				}, this),
				import.meta.env.DEV && this.state.error && /* @__PURE__ */ _jsxDEV("pre", {
					className: "mt-4 max-w-2xl overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground",
					children: this.state.error.stack ?? this.state.error.message
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 96,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 63,
			columnNumber: 7
		}, this);
	}
}
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/layout/RootErrorBoundary.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RootErrorBoundary.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/layout/RootErrorBoundary.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxpQkFBaUQ7QUFDMUQsU0FBUyxlQUFlLFVBQVUsWUFBWTs7O0FBcUI5QyxPQUFPLE1BQU0sMEJBQTBCLFVBQXdCO0NBQzdELFlBQVksT0FBYztFQUN4QixNQUFNLEtBQUs7RUFDWCxLQUFLLFFBQVE7R0FBRSxVQUFVO0dBQU8sT0FBTztFQUFLO0NBQzlDO0NBRUEsT0FBTyx5QkFBeUIsT0FBcUI7RUFDbkQsT0FBTztHQUFFLFVBQVU7R0FBTTtFQUFNO0NBQ2pDO0NBRUEsa0JBQWtCLE9BQWMsTUFBdUI7O0VBRXJELFFBQVEsTUFBTSxnQ0FBZ0M7R0FDNUMsU0FBUyxNQUFNO0dBQ2YsT0FBTyxNQUFNO0dBQ2IsZ0JBQWdCLEtBQUs7RUFDdkIsQ0FBQztDQUNIO0NBRUEsQUFBUSxxQkFBMkI7O0VBRWpDLEtBQUssU0FBUztHQUFFLFVBQVU7R0FBTyxPQUFPO0VBQUssQ0FBQztFQUM5QyxPQUFPLFNBQVMsT0FBTztDQUN6QjtDQUVBLEFBQVEscUJBQTJCO0VBQ2pDLEtBQUssU0FBUztHQUFFLFVBQVU7R0FBTyxPQUFPO0VBQUssQ0FBQzs7RUFFOUMsT0FBTyxTQUFTLE9BQU87Q0FDekI7Q0FFQSxTQUFvQjtFQUNsQixJQUFJLENBQUMsS0FBSyxNQUFNLFVBQVUsT0FBTyxLQUFLLE1BQU07RUFFNUMsTUFBTSxtQkFDSixLQUFLLE1BQU0sT0FBTyxTQUFTLG9CQUMzQixLQUFLLE1BQU0sT0FBTyxTQUFTLFNBQVMsNkNBQTZDLEtBQ2pGLEtBQUssTUFBTSxPQUFPLFNBQVMsU0FBUyxlQUFlO0VBRXJELE9BQ0Usd0JBQUMsT0FBRDtHQUFLLFdBQVU7YUFBZjtJQUNFLHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQ2Isd0JBQUMsZUFBRCxFQUFlLFdBQVUsMkJBQTRCOzs7OztJQUNsRDs7Ozs7SUFDTCx3QkFBQyxPQUFEO0tBQUssV0FBVTtlQUFmLENBQ0Usd0JBQUMsTUFBRDtNQUFJLFdBQVU7Z0JBQ1gsbUJBQW1CLFdBQVc7S0FDN0I7Ozs7ZUFDSix3QkFBQyxLQUFEO01BQUcsV0FBVTtnQkFDVixtQkFDRyw4QkFDQTtLQUNIOzs7O2FBQ0E7Ozs7OztJQUNMLHdCQUFDLE9BQUQ7S0FBSyxXQUFVO2VBQWYsQ0FDRSx3QkFBQyxVQUFEO01BQ0UsTUFBSztNQUNMLFNBQVMsS0FBSztNQUNkLFdBQVU7Z0JBSFosQ0FLRSx3QkFBQyxVQUFELEVBQVUsV0FBVSxVQUFXOzs7O2dCQUFDLE1BRTFCOzs7OztlQUNSLHdCQUFDLFVBQUQ7TUFDRSxNQUFLO01BQ0wsU0FBUyxLQUFLO01BQ2QsV0FBVTtnQkFIWixDQUtFLHdCQUFDLE1BQUQsRUFBTSxXQUFVLFVBQVc7Ozs7Z0JBQUMsTUFFdEI7Ozs7O2FBQ0w7Ozs7OztJQUNKLFlBQVksSUFBSSxPQUFPLEtBQUssTUFBTSxTQUNqQyx3QkFBQyxPQUFEO0tBQUssV0FBVTtlQUNaLEtBQUssTUFBTSxNQUFNLFNBQVMsS0FBSyxNQUFNLE1BQU07SUFDekM7Ozs7O0dBRUo7Ozs7OztDQUVUO0FBQ0YiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiUm9vdEVycm9yQm91bmRhcnkudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgdHlwZSBFcnJvckluZm8sIHR5cGUgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQWxlcnRUcmlhbmdsZSwgUm90YXRlQ3csIEhvbWUgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuXG4vKipcbiAqIOaguee6p+mUmeivr+i+ueeVjFxuICpcbiAqIOaNleiOt+WtkOe7hOS7tuagke+8iOWQq+aHkuWKoOi9vSBjaHVua++8ieeahOa4suafk+W8guW4uO+8jOmBv+WFjeaVtOS4quW6lOeUqOeZveWxj+OAglxuICogLSDmh5LliqDovb0gY2h1bmsg5Yqg6L295aSx6LSl77ya55So5oi35Y+v54K55Ye744CM6YeN5paw5Yqg6L2944CN5oGi5aSNXG4gKiAtIOi/kOihjOaXtuaKm+mUme+8mueUqOaIt+WPr+eCueWHu+OAjOi/lOWbnummlumhteOAjeWbnuWIsCBEYXNoYm9hcmRcbiAqXG4gKiDms6jmhI/vvJpSZWFjdCBFcnJvckJvdW5kYXJ5IOWPquiDveaNleiOt+a4suafk+acny/nlJ/lkb3lkajmnJ/plJnor6/vvIxcbiAqIOS6i+S7tuWkhOeQhuWZqOOAgeW8guatpeS7o+eggeOAgVNTUiDplJnor6/ku43pnIDlkITosIPnlKjngrnlpITnkIbvvIjop4EgbGliL2FwaS50cyDmi6bmiKrlmajvvInjgIJcbiAqL1xuaW50ZXJmYWNlIFN0YXRlIHtcbiAgaGFzRXJyb3I6IGJvb2xlYW47XG4gIGVycm9yOiBFcnJvciB8IG51bGw7XG59XG5cbmludGVyZmFjZSBQcm9wcyB7XG4gIGNoaWxkcmVuOiBSZWFjdE5vZGU7XG59XG5cbmV4cG9ydCBjbGFzcyBSb290RXJyb3JCb3VuZGFyeSBleHRlbmRzIENvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7IGhhc0Vycm9yOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgfVxuXG4gIHN0YXRpYyBnZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IoZXJyb3I6IEVycm9yKTogU3RhdGUge1xuICAgIHJldHVybiB7IGhhc0Vycm9yOiB0cnVlLCBlcnJvciB9O1xuICB9XG5cbiAgY29tcG9uZW50RGlkQ2F0Y2goZXJyb3I6IEVycm9yLCBpbmZvOiBFcnJvckluZm8pOiB2b2lkIHtcbiAgICAvLyDnu5PmnoTljJbml6Xlv5fvvIzkvr/kuo7mjpLmn6XvvIjnlJ/kuqflj6/mjqXlhaUgU2VudHJ5IOetie+8iVxuICAgIGNvbnNvbGUuZXJyb3IoJ1tSb290RXJyb3JCb3VuZGFyeV0g5pyq5o2V6I6355qE5riy5p+T6ZSZ6K+vJywge1xuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFjayxcbiAgICAgIGNvbXBvbmVudFN0YWNrOiBpbmZvLmNvbXBvbmVudFN0YWNrLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVSZWxvYWQgPSAoKTogdm9pZCA9PiB7XG4gICAgLy8g5riF56m66ZSZ6K+v54q25oCB5ZCO5pW06aG15Yi35paw77yM56Gu5L+d5oeS5Yqg6L29IGNodW5rIOmHjeaWsOiOt+WPllxuICAgIHRoaXMuc2V0U3RhdGUoeyBoYXNFcnJvcjogZmFsc2UsIGVycm9yOiBudWxsIH0pO1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgfTtcblxuICBwcml2YXRlIGhhbmRsZUdvSG9tZSA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLnNldFN0YXRlKHsgaGFzRXJyb3I6IGZhbHNlLCBlcnJvcjogbnVsbCB9KTtcbiAgICAvLyDot7PpppbpobXogIzpnZ7liLfmlrDvvIzkv53nlZkgU1BBIOS9k+mqjO+8iOmBv+WFjemHjeWkjeinpuWPkeWQjOS4gOW0qea6gyBjaHVua++8iVxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9kYXNoYm9hcmQnO1xuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdE5vZGUge1xuICAgIGlmICghdGhpcy5zdGF0ZS5oYXNFcnJvcikgcmV0dXJuIHRoaXMucHJvcHMuY2hpbGRyZW47XG5cbiAgICBjb25zdCBpc0NodW5rTG9hZEVycm9yID1cbiAgICAgIHRoaXMuc3RhdGUuZXJyb3I/Lm5hbWUgPT09ICdDaHVua0xvYWRFcnJvcicgfHxcbiAgICAgIHRoaXMuc3RhdGUuZXJyb3I/Lm1lc3NhZ2U/LmluY2x1ZGVzKCdGYWlsZWQgdG8gZmV0Y2ggZHluYW1pY2FsbHkgaW1wb3J0ZWQgbW9kdWxlJykgfHxcbiAgICAgIHRoaXMuc3RhdGUuZXJyb3I/Lm1lc3NhZ2U/LmluY2x1ZGVzKCdMb2FkaW5nIGNodW5rJyk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IG1pbi1oLXNjcmVlbiBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTYgYmctYmFja2dyb3VuZCBwLTggdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGgtMTYgdy0xNiBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1mdWxsIGJnLWRlc3RydWN0aXZlLzEwXCI+XG4gICAgICAgICAgPEFsZXJ0VHJpYW5nbGUgY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWRlc3RydWN0aXZlXCIgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIHtpc0NodW5rTG9hZEVycm9yID8gJ+mhtemdouWKoOi9veWksei0pScgOiAn6aG16Z2i5Y+R55Sf6ZSZ6K+vJ31cbiAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm1heC13LW1kIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICB7aXNDaHVua0xvYWRFcnJvclxuICAgICAgICAgICAgICA/ICflj6/og73mmK/lupTnlKjlt7Llj5HluIPmlrDniYjmnKzmiJbnvZHnu5zkuI3nqLPjgILor7flsJ3or5Xph43mlrDliqDovb3jgIInXG4gICAgICAgICAgICAgIDogJ+W6lOeUqOmBh+WIsOS6huaEj+WklumUmeivr+OAguaCqOWPr+S7pei/lOWbnummlumhtee7p+e7reaTjeS9nO+8jOaIlumHjeaWsOWKoOi9vemhtemdouOAgid9XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0zXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLmhhbmRsZVJlbG9hZH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLW1kIGJnLXByaW1hcnkgcHgtNCBweS0yIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1wcmltYXJ5LWZvcmVncm91bmQgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6YmctcHJpbWFyeS85MFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFJvdGF0ZUN3IGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAg6YeN5paw5Yqg6L29XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLmhhbmRsZUdvSG9tZX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItaW5wdXQgYmctYmFja2dyb3VuZCBweC00IHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSB0cmFuc2l0aW9uLWNvbG9ycyBob3ZlcjpiZy1hY2NlbnRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxIb21lIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAg6L+U5Zue6aaW6aG1XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7aW1wb3J0Lm1ldGEuZW52LkRFViAmJiB0aGlzLnN0YXRlLmVycm9yICYmIChcbiAgICAgICAgICA8cHJlIGNsYXNzTmFtZT1cIm10LTQgbWF4LXctMnhsIG92ZXJmbG93LWF1dG8gcm91bmRlZC1tZCBiZy1tdXRlZCBwLTQgdGV4dC1sZWZ0IHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICB7dGhpcy5zdGF0ZS5lcnJvci5zdGFjayA/PyB0aGlzLnN0YXRlLmVycm9yLm1lc3NhZ2V9XG4gICAgICAgICAgPC9wcmU+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG4iXX0=