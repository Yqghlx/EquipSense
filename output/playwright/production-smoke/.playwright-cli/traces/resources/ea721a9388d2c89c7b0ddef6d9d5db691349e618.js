import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/OfflineSyncPanel.tsx");const useState = __vite__cjsImport0_react["useState"]; const useEffect = __vite__cjsImport0_react["useEffect"];const _jsxDEV = __vite__cjsImport7_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { RefreshCw, CloudOff, Check, AlertTriangle, X } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
import { useOfflineQueue } from "/src/hooks/useOfflineQueue.ts";
import { useOfflineStatus } from "/src/hooks/useOfflineStatus.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineSyncPanel.tsx";
import __vite__cjsImport7_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 离线同步面板
*
* 展示待同步操作列表，提供手动同步和取消操作的能力。
* 离线时显示橙色边框提示，在线时提供立即同步按钮。
*/
export function OfflineSyncPanel() {
	_s();
	const { t } = useTranslation();
	const { isOffline } = useOfflineStatus();
	const { pendingCount, isSyncing, lastSyncResult, syncNow, getPending, removePending } = useOfflineQueue();
	const [pendingOps, setPendingOps] = useState([]);
	useEffect(() => {
		const loadPending = async () => {
			const ops = await getPending();
			setPendingOps(ops);
		};
		loadPending();
		// 每 5 秒刷新待同步操作列表
		const timer = setInterval(loadPending, 5e3);
		return () => clearInterval(timer);
	}, [getPending, pendingCount]);
	const handleSync = async () => {
		await syncNow();
		const ops = await getPending();
		setPendingOps(ops);
	};
	// 无待同步且在线时不显示面板
	if (pendingCount === 0 && !isOffline) return null;
	return /* @__PURE__ */ _jsxDEV(Card, {
		className: isOffline ? "border-orange-300 bg-orange-50" : "",
		children: [/* @__PURE__ */ _jsxDEV(CardHeader, {
			className: "pb-3",
			children: /* @__PURE__ */ _jsxDEV(CardTitle, {
				className: "flex items-center gap-2 text-base",
				children: [
					isOffline ? /* @__PURE__ */ _jsxDEV(CloudOff, { className: "h-4 w-4 text-orange-500" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 48,
						columnNumber: 13
					}, this) : /* @__PURE__ */ _jsxDEV(RefreshCw, { className: `h-4 w-4 ${isSyncing ? "animate-spin" : ""}` }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 50,
						columnNumber: 13
					}, this),
					isOffline ? t("offlineSync.titleOffline") : t("offlineSync.titlePending"),
					pendingCount > 0 && /* @__PURE__ */ _jsxDEV("span", {
						className: "ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white",
						children: pendingCount
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 54,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 46,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 45,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
			className: "space-y-3",
			children: [
				lastSyncResult && /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-1 text-sm",
					children: [
						lastSyncResult.succeeded.length > 0 && /* @__PURE__ */ _jsxDEV("p", {
							className: "flex items-center gap-1 text-green-600",
							children: [/* @__PURE__ */ _jsxDEV(Check, { className: "h-3 w-3" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 66,
								columnNumber: 17
							}, this), t("offlineSync.synced", { count: lastSyncResult.succeeded.length })]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 65,
							columnNumber: 15
						}, this),
						lastSyncResult.conflicts.length > 0 && /* @__PURE__ */ _jsxDEV("p", {
							className: "flex items-center gap-1 text-orange-600",
							children: [/* @__PURE__ */ _jsxDEV(AlertTriangle, { className: "h-3 w-3" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 72,
								columnNumber: 17
							}, this), t("offlineSync.conflicts", { count: lastSyncResult.conflicts.length })]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 71,
							columnNumber: 15
						}, this),
						lastSyncResult.failed.length > 0 && /* @__PURE__ */ _jsxDEV("p", {
							className: "flex items-center gap-1 text-red-600",
							children: [/* @__PURE__ */ _jsxDEV(X, { className: "h-3 w-3" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 78,
								columnNumber: 17
							}, this), t("offlineSync.failed", { count: lastSyncResult.failed.length })]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 77,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 63,
					columnNumber: 11
				}, this),
				pendingOps.length > 0 ? /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: pendingOps.map((op) => /* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center justify-between rounded border bg-background p-2 text-sm",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ _jsxDEV("span", {
									className: "font-medium",
									children: t(`offlineSync.op.${op.type}`, { defaultValue: op.type })
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 94,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ _jsxDEV("span", {
									className: "text-muted-foreground",
									children: new Date(op.timestamp).toLocaleTimeString()
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 97,
									columnNumber: 19
								}, this),
								op.retryCount > 0 && /* @__PURE__ */ _jsxDEV("span", {
									className: "text-xs text-orange-500",
									children: t("offlineSync.retried", { count: op.retryCount })
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 101,
									columnNumber: 21
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 93,
							columnNumber: 17
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => removePending(op.id),
							children: /* @__PURE__ */ _jsxDEV(X, { className: "h-3 w-3" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 111,
								columnNumber: 19
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 106,
							columnNumber: 17
						}, this)]
					}, op.id, true, {
						fileName: _jsxFileName,
						lineNumber: 89,
						columnNumber: 15
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 87,
					columnNumber: 11
				}, this) : /* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-muted-foreground",
					children: t("offlineSync.empty")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 117,
					columnNumber: 11
				}, this),
				!isOffline && pendingCount > 0 && /* @__PURE__ */ _jsxDEV(Button, {
					onClick: handleSync,
					disabled: isSyncing,
					className: "w-full",
					children: [/* @__PURE__ */ _jsxDEV(RefreshCw, { className: `mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}` }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 123,
						columnNumber: 13
					}, this), isSyncing ? t("offlineSync.syncing") : t("offlineSync.syncNow")]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 122,
					columnNumber: 11
				}, this),
				isOffline && /* @__PURE__ */ _jsxDEV("p", {
					className: "text-xs text-muted-foreground",
					children: t("offlineSync.autoSyncHint")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 130,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 60,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 44,
		columnNumber: 5
	}, this);
}
_s(OfflineSyncPanel, "TavoZNqg0ILAO2I7Vmx9L45y9lk=", false, function() {
	return [
		useTranslation,
		useOfflineStatus,
		useOfflineQueue
	];
});
_c = OfflineSyncPanel;
var _c;
$RefreshReg$(_c, "OfflineSyncPanel");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/OfflineSyncPanel.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineSyncPanel.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineSyncPanel.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/OfflineSyncPanel.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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LHdCQUFDLFFBQUQ7U0FBTSxXQUFVO21CQUNiLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxHQUFHLFdBQVcsQ0FBQztRQUM5Qzs7Ozs7T0FFTDs7Ozs7Z0JBQ0wsd0JBQUMsUUFBRDtPQUNFLFNBQVE7T0FDUixNQUFLO09BQ0wsZUFBZSxjQUFjLEdBQUcsRUFBRTtpQkFFbEMsd0JBQUMsR0FBRCxFQUFHLFdBQVUsVUFBVzs7Ozs7TUFDbEI7Ozs7Y0FDTDtRQXZCRSxHQUFHOzs7O1lBdUJMLENBQ047SUFDRTs7OztlQUVMLHdCQUFDLEtBQUQ7S0FBRyxXQUFVO2VBQWlDLEVBQUUsbUJBQW1CO0lBQUs7Ozs7O0lBSXpFLENBQUMsYUFBYSxlQUFlLEtBQzVCLHdCQUFDLFFBQUQ7S0FBUSxTQUFTO0tBQVksVUFBVTtLQUFXLFdBQVU7ZUFBNUQsQ0FDRSx3QkFBQyxXQUFELEVBQVcsV0FBVyxnQkFBZ0IsWUFBWSxpQkFBaUIsS0FBTzs7OztlQUN6RSxZQUFZLEVBQUUscUJBQXFCLElBQUksRUFBRSxxQkFBcUIsQ0FDekQ7Ozs7OztJQUlULGFBQ0Msd0JBQUMsS0FBRDtLQUFHLFdBQVU7ZUFDVixFQUFFLDBCQUEwQjtJQUM1Qjs7Ozs7R0FFTTs7Ozs7VUFDVDs7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiT2ZmbGluZVN5bmNQYW5lbC50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFJlZnJlc2hDdywgQ2xvdWRPZmYsIENoZWNrLCBBbGVydFRyaWFuZ2xlLCBYIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuLi91aS9idXR0b24nO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSB9IGZyb20gJy4uL3VpL2NhcmQnO1xuaW1wb3J0IHsgdXNlT2ZmbGluZVF1ZXVlIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlT2ZmbGluZVF1ZXVlJztcbmltcG9ydCB7IHVzZU9mZmxpbmVTdGF0dXMgfSBmcm9tICcuLi8uLi9ob29rcy91c2VPZmZsaW5lU3RhdHVzJztcbmltcG9ydCB0eXBlIHsgUGVuZGluZ09wZXJhdGlvbiB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuLyoqXG4gKiDnprvnur/lkIzmraXpnaLmnb9cbiAqXG4gKiDlsZXnpLrlvoXlkIzmraXmk43kvZzliJfooajvvIzmj5DkvpvmiYvliqjlkIzmraXlkozlj5bmtojmk43kvZznmoTog73lipvjgIJcbiAqIOemu+e6v+aXtuaYvuekuuapmeiJsui+ueahhuaPkOekuu+8jOWcqOe6v+aXtuaPkOS+m+eri+WNs+WQjOatpeaMiemSruOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gT2ZmbGluZVN5bmNQYW5lbCgpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGlzT2ZmbGluZSB9ID0gdXNlT2ZmbGluZVN0YXR1cygpO1xuICBjb25zdCB7IHBlbmRpbmdDb3VudCwgaXNTeW5jaW5nLCBsYXN0U3luY1Jlc3VsdCwgc3luY05vdywgZ2V0UGVuZGluZywgcmVtb3ZlUGVuZGluZyB9ID0gdXNlT2ZmbGluZVF1ZXVlKCk7XG4gIGNvbnN0IFtwZW5kaW5nT3BzLCBzZXRQZW5kaW5nT3BzXSA9IHVzZVN0YXRlPFBlbmRpbmdPcGVyYXRpb25bXT4oW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgbG9hZFBlbmRpbmcgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBvcHMgPSBhd2FpdCBnZXRQZW5kaW5nKCk7XG4gICAgICBzZXRQZW5kaW5nT3BzKG9wcyk7XG4gICAgfTtcbiAgICBsb2FkUGVuZGluZygpO1xuXG4gICAgLy8g5q+PIDUg56eS5Yi35paw5b6F5ZCM5q2l5pON5L2c5YiX6KGoXG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChsb2FkUGVuZGluZywgNTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbZ2V0UGVuZGluZywgcGVuZGluZ0NvdW50XSk7XG5cbiAgY29uc3QgaGFuZGxlU3luYyA9IGFzeW5jICgpID0+IHtcbiAgICBhd2FpdCBzeW5jTm93KCk7XG4gICAgY29uc3Qgb3BzID0gYXdhaXQgZ2V0UGVuZGluZygpO1xuICAgIHNldFBlbmRpbmdPcHMob3BzKTtcbiAgfTtcblxuICAvLyDml6DlvoXlkIzmraXkuJTlnKjnur/ml7bkuI3mmL7npLrpnaLmnb9cbiAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCAmJiAhaXNPZmZsaW5lKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkIGNsYXNzTmFtZT17aXNPZmZsaW5lID8gJ2JvcmRlci1vcmFuZ2UtMzAwIGJnLW9yYW5nZS01MCcgOiAnJ30+XG4gICAgICA8Q2FyZEhlYWRlciBjbGFzc05hbWU9XCJwYi0zXCI+XG4gICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1iYXNlXCI+XG4gICAgICAgICAge2lzT2ZmbGluZSA/IChcbiAgICAgICAgICAgIDxDbG91ZE9mZiBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQtb3JhbmdlLTUwMFwiIC8+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxSZWZyZXNoQ3cgY2xhc3NOYW1lPXtgaC00IHctNCAke2lzU3luY2luZyA/ICdhbmltYXRlLXNwaW4nIDogJyd9YH0gLz5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtpc09mZmxpbmUgPyB0KCdvZmZsaW5lU3luYy50aXRsZU9mZmxpbmUnKSA6IHQoJ29mZmxpbmVTeW5jLnRpdGxlUGVuZGluZycpfVxuICAgICAgICAgIHtwZW5kaW5nQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTEgcm91bmRlZC1mdWxsIGJnLXByaW1hcnkgcHgtMiBweS0wLjUgdGV4dC14cyB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgIHtwZW5kaW5nQ291bnR9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9DYXJkVGl0bGU+XG4gICAgICA8L0NhcmRIZWFkZXI+XG4gICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgIHsvKiDmnIDov5HkuIDmrKHlkIzmraXnu5PmnpzmkZjopoEgKi99XG4gICAgICAgIHtsYXN0U3luY1Jlc3VsdCAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1zbVwiPlxuICAgICAgICAgICAge2xhc3RTeW5jUmVzdWx0LnN1Y2NlZWRlZC5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgdGV4dC1ncmVlbi02MDBcIj5cbiAgICAgICAgICAgICAgICA8Q2hlY2sgY2xhc3NOYW1lPVwiaC0zIHctM1wiIC8+XG4gICAgICAgICAgICAgICAge3QoJ29mZmxpbmVTeW5jLnN5bmNlZCcsIHsgY291bnQ6IGxhc3RTeW5jUmVzdWx0LnN1Y2NlZWRlZC5sZW5ndGggfSl9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICB7bGFzdFN5bmNSZXN1bHQuY29uZmxpY3RzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LW9yYW5nZS02MDBcIj5cbiAgICAgICAgICAgICAgICA8QWxlcnRUcmlhbmdsZSBjbGFzc05hbWU9XCJoLTMgdy0zXCIgLz5cbiAgICAgICAgICAgICAgICB7dCgnb2ZmbGluZVN5bmMuY29uZmxpY3RzJywgeyBjb3VudDogbGFzdFN5bmNSZXN1bHQuY29uZmxpY3RzLmxlbmd0aCB9KX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIHtsYXN0U3luY1Jlc3VsdC5mYWlsZWQubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHRleHQtcmVkLTYwMFwiPlxuICAgICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cImgtMyB3LTNcIiAvPlxuICAgICAgICAgICAgICAgIHt0KCdvZmZsaW5lU3luYy5mYWlsZWQnLCB7IGNvdW50OiBsYXN0U3luY1Jlc3VsdC5mYWlsZWQubGVuZ3RoIH0pfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiDlvoXlkIzmraXmk43kvZzliJfooaggKi99XG4gICAgICAgIHtwZW5kaW5nT3BzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIHtwZW5kaW5nT3BzLm1hcCgob3ApID0+IChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17b3AuaWR9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHJvdW5kZWQgYm9yZGVyIGJnLWJhY2tncm91bmQgcC0yIHRleHQtc21cIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj5cbiAgICAgICAgICAgICAgICAgICAge3QoYG9mZmxpbmVTeW5jLm9wLiR7b3AudHlwZX1gLCB7IGRlZmF1bHRWYWx1ZTogb3AudHlwZSB9KX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICB7bmV3IERhdGUob3AudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtvcC5yZXRyeUNvdW50ID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1vcmFuZ2UtNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3QoJ29mZmxpbmVTeW5jLnJldHJpZWQnLCB7IGNvdW50OiBvcC5yZXRyeUNvdW50IH0pfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJnaG9zdFwiXG4gICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVtb3ZlUGVuZGluZyhvcC5pZCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwiaC0zIHctM1wiIC8+XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnb2ZmbGluZVN5bmMuZW1wdHknKX08L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIOWcqOe6v+S4lOacieW+heWQjOatpeaTjeS9nOaXtuaYvuekuueri+WNs+WQjOatpeaMiemSriAqL31cbiAgICAgICAgeyFpc09mZmxpbmUgJiYgcGVuZGluZ0NvdW50ID4gMCAmJiAoXG4gICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVTeW5jfSBkaXNhYmxlZD17aXNTeW5jaW5nfSBjbGFzc05hbWU9XCJ3LWZ1bGxcIj5cbiAgICAgICAgICAgIDxSZWZyZXNoQ3cgY2xhc3NOYW1lPXtgbXItMiBoLTQgdy00ICR7aXNTeW5jaW5nID8gJ2FuaW1hdGUtc3BpbicgOiAnJ31gfSAvPlxuICAgICAgICAgICAge2lzU3luY2luZyA/IHQoJ29mZmxpbmVTeW5jLnN5bmNpbmcnKSA6IHQoJ29mZmxpbmVTeW5jLnN5bmNOb3cnKX1cbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgKX1cblxuICAgICAgICB7Lyog56a757q/5pe25pi+56S65o+Q56S65L+h5oGvICovfVxuICAgICAgICB7aXNPZmZsaW5lICYmIChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAge3QoJ29mZmxpbmVTeW5jLmF1dG9TeW5jSGludCcpfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgPC9DYXJkPlxuICApO1xufVxuIl19