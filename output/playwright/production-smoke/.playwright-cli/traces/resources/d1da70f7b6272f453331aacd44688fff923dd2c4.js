import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/NotificationPreferenceCard.tsx");const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Switch } from "/src/components/ui/switch.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "/src/hooks/useNotificationPreferences.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/NotificationPreferenceCard.tsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 通知类型定义 */
const notifTypes = [
	{
		key: "alert",
		label: "告警通知",
		desc: "设备告警触发、告警状态变更"
	},
	{
		key: "workorder",
		label: "工单通知",
		desc: "工单创建、派工、状态变更"
	},
	{
		key: "system",
		label: "系统通知",
		desc: "系统配置变更、订阅到期提醒"
	}
];
/** 通知渠道定义 */
const channels = [
	{
		key: "signalr",
		label: "实时推送",
		desc: "页面内即时弹出通知"
	},
	{
		key: "push",
		label: "浏览器推送",
		desc: "浏览器未打开时推送通知"
	},
	{
		key: "email",
		label: "邮件通知",
		desc: "发送到注册邮箱（需配置 SMTP）"
	}
];
/**
* 通知偏好设置卡片
*
* 以矩阵形式展示「通知类型 × 通知渠道」的开关组合，
* 用户可按需启用/禁用每个组合。浏览器推送依赖 Web Push API，
* 额外提供浏览器级别的订阅开关。
*/
export function NotificationPreferenceCard({ pushSupported, isSubscribed, permission, onSubscribe, onUnsubscribe }) {
	_s();
	const { data: prefs, isLoading } = useNotificationPreferences();
	const updateMutation = useUpdateNotificationPreferences();
	/** 切换单个渠道开关 */
	const toggleChannel = (type, channel) => {
		if (!prefs) return;
		const updated = { ...prefs };
		updated[type] = {
			...updated[type],
			[channel]: !updated[type][channel]
		};
		updateMutation.mutate(updated);
	};
	/** 切换整行（通知类型）所有渠道 */
	const toggleRow = (type) => {
		if (!prefs) return;
		const current = prefs[type];
		const allOn = current.signalr && current.push && current.email;
		const updated = { ...prefs };
		updated[type] = {
			signalr: !allOn,
			push: !allOn,
			email: !allOn
		};
		updateMutation.mutate(updated);
	};
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, {
		className: "text-base",
		children: "通知偏好设置"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 70,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: "按通知类型和渠道自定义接收方式" }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 71,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 69,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "space-y-4",
		children: [
			isLoading ? /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground py-4 text-center",
				children: "加载中..."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 75,
				columnNumber: 11
			}, this) : prefs ? /* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
				/* @__PURE__ */ _jsxDEV(TableHead, {
					className: "w-[200px]",
					children: "通知类型"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 80,
					columnNumber: 17
				}, this),
				channels.map((ch) => /* @__PURE__ */ _jsxDEV(TableHead, {
					className: "text-center",
					children: ch.label
				}, ch.key, false, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 19
				}, this)),
				/* @__PURE__ */ _jsxDEV(TableHead, {
					className: "w-[80px] text-center",
					children: "全部"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 84,
					columnNumber: 17
				}, this)
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 79,
				columnNumber: 15
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 78,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: notifTypes.map((nt) => {
				const rowPrefs = prefs[nt.key];
				const allOn = rowPrefs.signalr && rowPrefs.push && rowPrefs.email;
				return /* @__PURE__ */ _jsxDEV(TableRow, { children: [
					/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm font-medium",
						children: nt.label
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 95,
						columnNumber: 25
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "text-xs text-muted-foreground",
						children: nt.desc
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 96,
						columnNumber: 25
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 94,
						columnNumber: 23
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 93,
						columnNumber: 21
					}, this),
					channels.map((ch) => {
						const isPush = ch.key === "push";
						const disabled = isPush ? !pushSupported || permission === "denied" : false;
						return /* @__PURE__ */ _jsxDEV(TableCell, {
							className: "text-center",
							children: /* @__PURE__ */ _jsxDEV(Switch, {
								checked: rowPrefs[ch.key],
								disabled: disabled || updateMutation.isPending,
								onCheckedChange: () => toggleChannel(nt.key, ch.key)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 104,
								columnNumber: 27
							}, this)
						}, ch.key, false, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 25
						}, this);
					}),
					/* @__PURE__ */ _jsxDEV(TableCell, {
						className: "text-center",
						children: /* @__PURE__ */ _jsxDEV(Switch, {
							checked: allOn,
							disabled: updateMutation.isPending,
							onCheckedChange: () => toggleRow(nt.key)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 113,
							columnNumber: 23
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 112,
						columnNumber: 21
					}, this)
				] }, nt.key, true, {
					fileName: _jsxFileName,
					lineNumber: 92,
					columnNumber: 19
				}, this);
			}) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 87,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 77,
				columnNumber: 11
			}, this) : null,
			/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 126,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [!pushSupported ? /* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: "当前浏览器不支持推送通知，浏览器推送渠道不可用"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 131,
				columnNumber: 13
			}, this) : /* @__PURE__ */ _jsxDEV("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm font-medium",
					children: "浏览器推送订阅"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 135,
					columnNumber: 17
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "text-xs text-muted-foreground",
					children: isSubscribed ? "已订阅，浏览器推送渠道可正常工作" : "未订阅，请开启以启用浏览器推送"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 136,
					columnNumber: 17
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 134,
					columnNumber: 15
				}, this), /* @__PURE__ */ _jsxDEV(Switch, {
					checked: isSubscribed,
					disabled: permission === "denied",
					onCheckedChange: async (checked) => {
						if (checked) {
							await onSubscribe();
						} else {
							await onUnsubscribe();
						}
					}
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 140,
					columnNumber: 15
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 133,
				columnNumber: 13
			}, this), permission === "denied" && /* @__PURE__ */ _jsxDEV("p", {
				className: "text-xs text-orange-600 mt-1",
				children: "通知权限已被拒绝，请在浏览器设置中手动开启"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 154,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 129,
				columnNumber: 9
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 73,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 68,
		columnNumber: 5
	}, this);
}
_s(NotificationPreferenceCard, "p/zaJHIL7en9Fa6GQwqnjUek9H8=", false, function() {
	return [useNotificationPreferences, useUpdateNotificationPreferences];
});
_c = NotificationPreferenceCard;
var _c;
$RefreshReg$(_c, "NotificationPreferenceCard");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/NotificationPreferenceCard.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/NotificationPreferenceCard.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/NotificationPreferenceCard.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/NotificationPreferenceCard.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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VTtpQkFDaEMsd0JBQUMsUUFBRDtRQUNFLFNBQVMsU0FBUyxHQUFHO1FBQ3JCLFVBQVUsWUFBWSxlQUFlO1FBQ3JDLHVCQUF1QixjQUFjLEdBQUcsS0FBSyxHQUFHLEdBQUc7T0FDcEQ7Ozs7O01BQ1EsR0FOSyxHQUFHOzs7O2FBTVI7S0FFZixDQUFDO0tBQ0Qsd0JBQUMsV0FBRDtNQUFXLFdBQVU7Z0JBQ25CLHdCQUFDLFFBQUQ7T0FDRSxTQUFTO09BQ1QsVUFBVSxlQUFlO09BQ3pCLHVCQUF1QixVQUFVLEdBQUcsR0FBRztNQUN4Qzs7Ozs7S0FDUTs7Ozs7SUFDSCxLQTNCSyxHQUFHOzs7O1dBMkJSO0dBRWQsQ0FBQyxFQUNROzs7O1dBQ047Ozs7Y0FDTDtHQUVKLHdCQUFDLFdBQUQsQ0FBWTs7Ozs7R0FHWix3QkFBQyxPQUFELGFBQ0csQ0FBQyxnQkFDQSx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFnQztHQUEwQjs7OztjQUV2RSx3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUFmLENBQ0Usd0JBQUMsT0FBRCxhQUNFLHdCQUFDLEtBQUQ7S0FBRyxXQUFVO2VBQXNCO0lBQVU7Ozs7Y0FDN0Msd0JBQUMsS0FBRDtLQUFHLFdBQVU7ZUFDVixlQUFlLHFCQUFxQjtJQUNwQzs7OztZQUNBOzs7O2NBQ0wsd0JBQUMsUUFBRDtLQUNFLFNBQVM7S0FDVCxVQUFVLGVBQWU7S0FDekIsaUJBQWlCLE9BQU8sWUFBWTtNQUNsQyxJQUFJLFNBQVM7T0FDWCxNQUFNLFlBQVk7TUFDcEIsT0FBTztPQUNMLE1BQU0sY0FBYztNQUN0QjtLQUNGO0lBQ0Q7Ozs7WUFDRTs7Ozs7YUFFTixlQUFlLFlBQ2Qsd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBK0I7R0FFekM7Ozs7V0FFRjs7Ozs7RUFDTTs7Ozs7U0FDVDs7Ozs7QUFFViIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJOb3RpZmljYXRpb25QcmVmZXJlbmNlQ2FyZC50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSwgQ2FyZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvY2FyZCc7XG5pbXBvcnQgeyBUYWJsZSwgVGFibGVCb2R5LCBUYWJsZUNlbGwsIFRhYmxlSGVhZCwgVGFibGVIZWFkZXIsIFRhYmxlUm93IH0gZnJvbSAnLi4vdWkvdGFibGUnO1xuaW1wb3J0IHsgU3dpdGNoIH0gZnJvbSAnLi4vdWkvc3dpdGNoJztcbmltcG9ydCB7IFNlcGFyYXRvciB9IGZyb20gJy4uL3VpL3NlcGFyYXRvcic7XG5pbXBvcnQge1xuICB1c2VOb3RpZmljYXRpb25QcmVmZXJlbmNlcyxcbiAgdXNlVXBkYXRlTm90aWZpY2F0aW9uUHJlZmVyZW5jZXMsXG4gIHR5cGUgTm90aWZpY2F0aW9uUHJlZmVyZW5jZXMsXG4gIHR5cGUgQ2hhbm5lbFByZWZlcmVuY2UsXG59IGZyb20gJy4uLy4uL2hvb2tzL3VzZU5vdGlmaWNhdGlvblByZWZlcmVuY2VzJztcblxuLyoqIOmAmuefpeexu+Wei+WumuS5iSAqL1xuY29uc3Qgbm90aWZUeXBlcyA9IFtcbiAgeyBrZXk6ICdhbGVydCcgYXMgY29uc3QsIGxhYmVsOiAn5ZGK6K2m6YCa55+lJywgZGVzYzogJ+iuvuWkh+WRiuitpuinpuWPkeOAgeWRiuitpueKtuaAgeWPmOabtCcgfSxcbiAgeyBrZXk6ICd3b3Jrb3JkZXInIGFzIGNvbnN0LCBsYWJlbDogJ+W3peWNlemAmuefpScsIGRlc2M6ICflt6XljZXliJvlu7rjgIHmtL7lt6XjgIHnirbmgIHlj5jmm7QnIH0sXG4gIHsga2V5OiAnc3lzdGVtJyBhcyBjb25zdCwgbGFiZWw6ICfns7vnu5/pgJrnn6UnLCBkZXNjOiAn57O757uf6YWN572u5Y+Y5pu044CB6K6i6ZiF5Yiw5pyf5o+Q6YaSJyB9LFxuXTtcblxuLyoqIOmAmuefpea4oOmBk+WumuS5iSAqL1xuY29uc3QgY2hhbm5lbHMgPSBbXG4gIHsga2V5OiAnc2lnbmFscicgYXMgY29uc3QsIGxhYmVsOiAn5a6e5pe25o6o6YCBJywgZGVzYzogJ+mhtemdouWGheWNs+aXtuW8ueWHuumAmuefpScgfSxcbiAgeyBrZXk6ICdwdXNoJyBhcyBjb25zdCwgbGFiZWw6ICfmtY/op4jlmajmjqjpgIEnLCBkZXNjOiAn5rWP6KeI5Zmo5pyq5omT5byA5pe25o6o6YCB6YCa55+lJyB9LFxuICB7IGtleTogJ2VtYWlsJyBhcyBjb25zdCwgbGFiZWw6ICfpgq7ku7bpgJrnn6UnLCBkZXNjOiAn5Y+R6YCB5Yiw5rOo5YaM6YKu566x77yI6ZyA6YWN572uIFNNVFDvvIknIH0sXG5dO1xuXG4vKipcbiAqIOmAmuefpeWBj+Wlveiuvue9ruWNoeeJh1xuICpcbiAqIOS7peefqemYteW9ouW8j+WxleekuuOAjOmAmuefpeexu+WeiyDDlyDpgJrnn6XmuKDpgZPjgI3nmoTlvIDlhbPnu4TlkIjvvIxcbiAqIOeUqOaIt+WPr+aMiemcgOWQr+eUqC/npoHnlKjmr4/kuKrnu4TlkIjjgILmtY/op4jlmajmjqjpgIHkvp3otZYgV2ViIFB1c2ggQVBJ77yMXG4gKiDpop3lpJbmj5DkvpvmtY/op4jlmajnuqfliKvnmoTorqLpmIXlvIDlhbPjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE5vdGlmaWNhdGlvblByZWZlcmVuY2VDYXJkKHtcbiAgcHVzaFN1cHBvcnRlZCxcbiAgaXNTdWJzY3JpYmVkLFxuICBwZXJtaXNzaW9uLFxuICBvblN1YnNjcmliZSxcbiAgb25VbnN1YnNjcmliZSxcbn06IHtcbiAgcHVzaFN1cHBvcnRlZDogYm9vbGVhbjtcbiAgaXNTdWJzY3JpYmVkOiBib29sZWFuO1xuICBwZXJtaXNzaW9uOiBOb3RpZmljYXRpb25QZXJtaXNzaW9uIHwgJ2RlZmF1bHQnO1xuICBvblN1YnNjcmliZTogKCkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgb25VbnN1YnNjcmliZTogKCkgPT4gUHJvbWlzZTx1bmtub3duPjtcbn0pIHtcbiAgY29uc3QgeyBkYXRhOiBwcmVmcywgaXNMb2FkaW5nIH0gPSB1c2VOb3RpZmljYXRpb25QcmVmZXJlbmNlcygpO1xuICBjb25zdCB1cGRhdGVNdXRhdGlvbiA9IHVzZVVwZGF0ZU5vdGlmaWNhdGlvblByZWZlcmVuY2VzKCk7XG5cbiAgLyoqIOWIh+aNouWNleS4qua4oOmBk+W8gOWFsyAqL1xuICBjb25zdCB0b2dnbGVDaGFubmVsID0gKHR5cGU6IGtleW9mIE5vdGlmaWNhdGlvblByZWZlcmVuY2VzLCBjaGFubmVsOiBrZXlvZiBDaGFubmVsUHJlZmVyZW5jZSkgPT4ge1xuICAgIGlmICghcHJlZnMpIHJldHVybjtcbiAgICBjb25zdCB1cGRhdGVkID0geyAuLi5wcmVmcyB9O1xuICAgIHVwZGF0ZWRbdHlwZV0gPSB7IC4uLnVwZGF0ZWRbdHlwZV0sIFtjaGFubmVsXTogIXVwZGF0ZWRbdHlwZV1bY2hhbm5lbF0gfTtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUodXBkYXRlZCk7XG4gIH07XG5cbiAgLyoqIOWIh+aNouaVtOihjO+8iOmAmuefpeexu+Wei++8ieaJgOaciea4oOmBkyAqL1xuICBjb25zdCB0b2dnbGVSb3cgPSAodHlwZToga2V5b2YgTm90aWZpY2F0aW9uUHJlZmVyZW5jZXMpID0+IHtcbiAgICBpZiAoIXByZWZzKSByZXR1cm47XG4gICAgY29uc3QgY3VycmVudCA9IHByZWZzW3R5cGVdO1xuICAgIGNvbnN0IGFsbE9uID0gY3VycmVudC5zaWduYWxyICYmIGN1cnJlbnQucHVzaCAmJiBjdXJyZW50LmVtYWlsO1xuICAgIGNvbnN0IHVwZGF0ZWQgPSB7IC4uLnByZWZzIH07XG4gICAgdXBkYXRlZFt0eXBlXSA9IHsgc2lnbmFscjogIWFsbE9uLCBwdXNoOiAhYWxsT24sIGVtYWlsOiAhYWxsT24gfTtcbiAgICB1cGRhdGVNdXRhdGlvbi5tdXRhdGUodXBkYXRlZCk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8Q2FyZD5cbiAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICA8Q2FyZFRpdGxlIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPumAmuefpeWBj+Wlveiuvue9rjwvQ2FyZFRpdGxlPlxuICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPuaMiemAmuefpeexu+Wei+WSjOa4oOmBk+iHquWumuS5ieaOpeaUtuaWueW8jzwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICB7aXNMb2FkaW5nID8gKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHB5LTQgdGV4dC1jZW50ZXJcIj7liqDovb3kuK0uLi48L3A+XG4gICAgICAgICkgOiBwcmVmcyA/IChcbiAgICAgICAgICA8VGFibGU+XG4gICAgICAgICAgICA8VGFibGVIZWFkZXI+XG4gICAgICAgICAgICAgIDxUYWJsZVJvdz5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkIGNsYXNzTmFtZT1cInctWzIwMHB4XVwiPumAmuefpeexu+WeizwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgIHtjaGFubmVscy5tYXAoKGNoKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8VGFibGVIZWFkIGtleT17Y2gua2V5fSBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPntjaC5sYWJlbH08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkIGNsYXNzTmFtZT1cInctWzgwcHhdIHRleHQtY2VudGVyXCI+5YWo6YOoPC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICA8L1RhYmxlSGVhZGVyPlxuICAgICAgICAgICAgPFRhYmxlQm9keT5cbiAgICAgICAgICAgICAge25vdGlmVHlwZXMubWFwKChudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd1ByZWZzID0gcHJlZnNbbnQua2V5XTtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxPbiA9IHJvd1ByZWZzLnNpZ25hbHIgJiYgcm93UHJlZnMucHVzaCAmJiByb3dQcmVmcy5lbWFpbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17bnQua2V5fT5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPntudC5sYWJlbH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPntudC5kZXNjfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgIHtjaGFubmVscy5tYXAoKGNoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNQdXNoID0gY2gua2V5ID09PSAncHVzaCc7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzYWJsZWQgPSBpc1B1c2ggPyAhcHVzaFN1cHBvcnRlZCB8fCBwZXJtaXNzaW9uID09PSAnZGVuaWVkJyA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIGtleT17Y2gua2V5fSBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8U3dpdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17cm93UHJlZnNbY2gua2V5XX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGlzYWJsZWQgfHwgdXBkYXRlTXV0YXRpb24uaXNQZW5kaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hlY2tlZENoYW5nZT17KCkgPT4gdG9nZ2xlQ2hhbm5lbChudC5rZXksIGNoLmtleSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxTd2l0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2FsbE9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3VwZGF0ZU11dGF0aW9uLmlzUGVuZGluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hlY2tlZENoYW5nZT17KCkgPT4gdG9nZ2xlUm93KG50LmtleSl9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgPC9UYWJsZT5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAgPFNlcGFyYXRvciAvPlxuXG4gICAgICAgIHsvKiDmtY/op4jlmajmjqjpgIHorqLpmIXnirbmgIEgKi99XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgeyFwdXNoU3VwcG9ydGVkID8gKFxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7lvZPliY3mtY/op4jlmajkuI3mlK/mjIHmjqjpgIHpgJrnn6XvvIzmtY/op4jlmajmjqjpgIHmuKDpgZPkuI3lj6/nlKg8L3A+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPua1j+iniOWZqOaOqOmAgeiuoumYhTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAge2lzU3Vic2NyaWJlZCA/ICflt7LorqLpmIXvvIzmtY/op4jlmajmjqjpgIHmuKDpgZPlj6/mraPluLjlt6XkvZwnIDogJ+acquiuoumYhe+8jOivt+W8gOWQr+S7peWQr+eUqOa1j+iniOWZqOaOqOmAgSd9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPFN3aXRjaFxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2lzU3Vic2NyaWJlZH1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17cGVybWlzc2lvbiA9PT0gJ2RlbmllZCd9XG4gICAgICAgICAgICAgICAgb25DaGVja2VkQ2hhbmdlPXthc3luYyAoY2hlY2tlZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgb25TdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG9uVW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7cGVybWlzc2lvbiA9PT0gJ2RlbmllZCcgJiYgKFxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW9yYW5nZS02MDAgbXQtMVwiPlxuICAgICAgICAgICAgICDpgJrnn6XmnYPpmZDlt7Looqvmi5Lnu53vvIzor7flnKjmtY/op4jlmajorr7nva7kuK3miYvliqjlvIDlkK9cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgPC9DYXJkPlxuICApO1xufVxuIl19