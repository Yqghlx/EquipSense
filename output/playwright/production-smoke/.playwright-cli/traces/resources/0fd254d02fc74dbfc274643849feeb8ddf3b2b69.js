import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/alert/AlertDetailDrawer.tsx");const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport6_react_jsxDevRuntime["Fragment"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "/src/components/ui/sheet.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { SeverityBadge } from "/src/components/alert/SeverityBadge.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/AlertDetailDrawer.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 解析告警指标快照 JSON（后端 DataSnapshot，由 DeviceContext.Metrics 序列化）。
* 失败/为空时返回空数组，前端优雅降级（不展示快照区，不阻塞告警详情）。
*/
function parseMetrics(dataSnapshot) {
	if (!dataSnapshot) return [];
	try {
		const parsed = JSON.parse(dataSnapshot);
		if (parsed && typeof parsed === "object") {
			return Object.entries(parsed).filter(([, v]) => typeof v === "number").map(([k, v]) => [k, v]);
		}
	} catch {}
	return [];
}
/**
* 告警详情抽屉组件
*
* 以侧边抽屉形式展示告警的完整信息，包括严重级别、状态、
* 关联设备、触发指标、数值以及时间线。
* 根据 alert.status 动态显示"确认"和"解决"操作按钮。
*/
export function AlertDetailDrawer({ alert, open, onClose, onAcknowledge, onResolve }) {
	_s();
	const { t } = useTranslation();
	if (!alert) return null;
	// 解析告警时刻指标快照（DataSnapshot），为空（旧告警）则不展示快照区
	const snapshotMetrics = parseMetrics(alert.dataSnapshot);
	return /* @__PURE__ */ _jsxDEV(Sheet, {
		open,
		onOpenChange: (isOpen) => {
			if (!isOpen) onClose();
		},
		children: /* @__PURE__ */ _jsxDEV(SheetContent, {
			className: "w-[480px] overflow-y-auto",
			children: [/* @__PURE__ */ _jsxDEV(SheetHeader, { children: /* @__PURE__ */ _jsxDEV(SheetTitle, { children: alert.alertCode }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 60,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 59,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "mt-4 space-y-4",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ _jsxDEV(SeverityBadge, { severity: alert.severity }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 65,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Badge, {
							variant: "outline",
							children: t(`alert.${alert.status.toLowerCase()}`)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 66,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 64,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 68,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "grid grid-cols-2 gap-3 text-sm",
						children: [
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("device.name")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 73,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: alert.deviceName ?? "-"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 74,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 72,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("alert.metric")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 77,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: alert.metric
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 78,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 76,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("alert.value")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 81,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: alert.value
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 82,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 80,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("alert.triggeredAt")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 85,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: new Date(alert.occurredAt).toLocaleString()
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 86,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 84,
								columnNumber: 13
							}, this),
							alert.acknowledged && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("alert.triggeredAt")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 90,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: new Date(alert.occurredAt).toLocaleString()
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 91,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 89,
								columnNumber: 15
							}, this),
							alert.resolved && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-muted-foreground",
								children: t("alert.resolved")
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 96,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: new Date(alert.occurredAt).toLocaleString()
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 97,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 95,
								columnNumber: 15
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 71,
						columnNumber: 11
					}, this),
					snapshotMetrics.length > 0 && /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 106,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm font-medium mb-2",
						children: t("alert.dataSnapshot")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 108,
						columnNumber: 17
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "rounded-md border",
						children: /* @__PURE__ */ _jsxDEV("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ _jsxDEV("thead", {
								className: "bg-muted/50",
								children: /* @__PURE__ */ _jsxDEV("tr", { children: [/* @__PURE__ */ _jsxDEV("th", {
									className: "text-left p-2 font-medium",
									children: t("alert.metric")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 113,
									columnNumber: 25
								}, this), /* @__PURE__ */ _jsxDEV("th", {
									className: "text-right p-2 font-medium",
									children: t("alert.value")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 114,
									columnNumber: 25
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 112,
									columnNumber: 23
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 111,
								columnNumber: 21
							}, this), /* @__PURE__ */ _jsxDEV("tbody", { children: snapshotMetrics.map(([metric, val]) => /* @__PURE__ */ _jsxDEV("tr", {
								className: "border-t",
								children: [/* @__PURE__ */ _jsxDEV("td", {
									className: "p-2",
									children: metric
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 120,
									columnNumber: 27
								}, this), /* @__PURE__ */ _jsxDEV("td", {
									className: "p-2 text-right tabular-nums",
									children: val
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 121,
									columnNumber: 27
								}, this)]
							}, metric, true, {
								fileName: _jsxFileName,
								lineNumber: 119,
								columnNumber: 25
							}, this)) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 117,
								columnNumber: 21
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 110,
							columnNumber: 19
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 109,
						columnNumber: 17
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 107,
						columnNumber: 15
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 13
					}, this),
					alert.status === "active" && /* @__PURE__ */ _jsxDEV("div", {
						className: "flex gap-2 pt-2",
						children: [onAcknowledge && /* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => onAcknowledge(alert.id),
							children: t("alert.acknowledge")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 135,
							columnNumber: 17
						}, this), onResolve && /* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							onClick: () => onResolve(alert.id),
							children: t("alert.resolve")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 140,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 133,
						columnNumber: 13
					}, this),
					alert.status === "acknowledged" && onResolve && /* @__PURE__ */ _jsxDEV("div", {
						className: "pt-2",
						children: /* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							onClick: () => onResolve(alert.id),
							children: t("alert.resolve")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 150,
							columnNumber: 15
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 149,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 62,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 58,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 57,
		columnNumber: 5
	}, this);
}
_s(AlertDetailDrawer, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
	return [useTranslation];
});
_c = AlertDetailDrawer;
var _c;
$RefreshReg$(_c, "AlertDetailDrawer");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/alert/AlertDetailDrawer.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/AlertDetailDrawer.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/AlertDetailDrawer.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/alert/AlertDetailDrawer.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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RDtNQUFLLFdBQVU7Z0JBQ2Isd0JBQUMsUUFBRDtPQUFRLE1BQUs7T0FBSyxlQUFlLFVBQVUsTUFBTSxFQUFFO2lCQUNoRCxFQUFFLGVBQWU7TUFDWjs7Ozs7S0FDTDs7Ozs7SUFFSjs7Ozs7V0FDTzs7Ozs7O0NBQ1Q7Ozs7O0FBRVgiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQWxlcnREZXRhaWxEcmF3ZXIudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBTaGVldCwgU2hlZXRDb250ZW50LCBTaGVldEhlYWRlciwgU2hlZXRUaXRsZSB9IGZyb20gJy4uL3VpL3NoZWV0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBTZXBhcmF0b3IgfSBmcm9tICcuLi91aS9zZXBhcmF0b3InO1xuaW1wb3J0IHsgQmFkZ2UgfSBmcm9tICcuLi91aS9iYWRnZSc7XG5pbXBvcnQgeyBTZXZlcml0eUJhZGdlIH0gZnJvbSAnLi9TZXZlcml0eUJhZGdlJztcbmltcG9ydCB0eXBlIHsgQWxlcnQgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5cbi8qKlxuICog6Kej5p6Q5ZGK6K2m5oyH5qCH5b+r54WnIEpTT07vvIjlkI7nq68gRGF0YVNuYXBzaG9077yM55SxIERldmljZUNvbnRleHQuTWV0cmljcyDluo/liJfljJbvvInjgIJcbiAqIOWksei0pS/kuLrnqbrml7bov5Tlm57nqbrmlbDnu4TvvIzliY3nq6/kvJjpm4XpmY3nuqfvvIjkuI3lsZXnpLrlv6vnhafljLrvvIzkuI3pmLvloZ7lkYrorabor6bmg4XvvInjgIJcbiAqL1xuZnVuY3Rpb24gcGFyc2VNZXRyaWNzKGRhdGFTbmFwc2hvdD86IHN0cmluZyk6IEFycmF5PFtzdHJpbmcsIG51bWJlcl0+IHtcbiAgaWYgKCFkYXRhU25hcHNob3QpIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGRhdGFTbmFwc2hvdCk7XG4gICAgaWYgKHBhcnNlZCAmJiB0eXBlb2YgcGFyc2VkID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHBhcnNlZClcbiAgICAgICAgLmZpbHRlcigoWywgdl0pID0+IHR5cGVvZiB2ID09PSAnbnVtYmVyJylcbiAgICAgICAgLm1hcCgoW2ssIHZdKSA9PiBbaywgdiBhcyBudW1iZXJdKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIERhdGFTbmFwc2hvdCDmoLzlvI/lvILluLjml7bpnZnpu5jpmY3nuqfvvIjkuI3pmLvloZ7lkYrorabor6bmg4XlsZXnpLrvvIlcbiAgfVxuICByZXR1cm4gW107XG59XG5cbmludGVyZmFjZSBBbGVydERldGFpbERyYXdlclByb3BzIHtcbiAgLyoqIOW9k+WJjeafpeeci+eahOWRiuitpu+8jOS4uiBudWxsIOaXtumakOiXjyAqL1xuICBhbGVydDogQWxlcnQgfCBudWxsO1xuICAvKiog5piv5ZCm5omT5byA5oq95bGJICovXG4gIG9wZW46IGJvb2xlYW47XG4gIC8qKiDlhbPpl63mir3lsYnlm57osIMgKi9cbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgLyoqIOehruiupOWRiuitpuWbnuiwgyAqL1xuICBvbkFja25vd2xlZGdlPzogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG4gIC8qKiDop6PlhrPlkYrorablm57osIMgKi9cbiAgb25SZXNvbHZlPzogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbi8qKlxuICog5ZGK6K2m6K+m5oOF5oq95bGJ57uE5Lu2XG4gKlxuICog5Lul5L6n6L655oq95bGJ5b2i5byP5bGV56S65ZGK6K2m55qE5a6M5pW05L+h5oGv77yM5YyF5ous5Lil6YeN57qn5Yir44CB54q25oCB44CBXG4gKiDlhbPogZTorr7lpIfjgIHop6blj5HmjIfmoIfjgIHmlbDlgLzku6Xlj4rml7bpl7Tnur/jgIJcbiAqIOagueaNriBhbGVydC5zdGF0dXMg5Yqo5oCB5pi+56S6XCLnoa7orqRcIuWSjFwi6Kej5YazXCLmk43kvZzmjInpkq7jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEFsZXJ0RGV0YWlsRHJhd2VyKHsgYWxlcnQsIG9wZW4sIG9uQ2xvc2UsIG9uQWNrbm93bGVkZ2UsIG9uUmVzb2x2ZSB9OiBBbGVydERldGFpbERyYXdlclByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICBpZiAoIWFsZXJ0KSByZXR1cm4gbnVsbDtcblxuICAvLyDop6PmnpDlkYrorabml7bliLvmjIfmoIflv6vnhafvvIhEYXRhU25hcHNob3TvvInvvIzkuLrnqbrvvIjml6flkYrorabvvInliJnkuI3lsZXnpLrlv6vnhafljLpcbiAgY29uc3Qgc25hcHNob3RNZXRyaWNzID0gcGFyc2VNZXRyaWNzKGFsZXJ0LmRhdGFTbmFwc2hvdCk7XG5cbiAgcmV0dXJuIChcbiAgICA8U2hlZXQgb3Blbj17b3Blbn0gb25PcGVuQ2hhbmdlPXsoaXNPcGVuKSA9PiB7IGlmICghaXNPcGVuKSBvbkNsb3NlKCk7IH19PlxuICAgICAgPFNoZWV0Q29udGVudCBjbGFzc05hbWU9XCJ3LVs0ODBweF0gb3ZlcmZsb3cteS1hdXRvXCI+XG4gICAgICAgIDxTaGVldEhlYWRlcj5cbiAgICAgICAgICA8U2hlZXRUaXRsZT57YWxlcnQuYWxlcnRDb2RlfTwvU2hlZXRUaXRsZT5cbiAgICAgICAgPC9TaGVldEhlYWRlcj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC00IHNwYWNlLXktNFwiPlxuICAgICAgICAgIHsvKiDkuKXph43nuqfliKvkuI7nirbmgIHmoIfnrb4gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgPFNldmVyaXR5QmFkZ2Ugc2V2ZXJpdHk9e2FsZXJ0LnNldmVyaXR5fSAvPlxuICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+e3QoYGFsZXJ0LiR7YWxlcnQuc3RhdHVzLnRvTG93ZXJDYXNlKCl9YCBhcyAnYWxlcnQuYWN0aXZlJyB8ICdhbGVydC5hY2tub3dsZWRnZWQnIHwgJ2FsZXJ0LnJlc29sdmVkJyl9PC9CYWRnZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8U2VwYXJhdG9yIC8+XG5cbiAgICAgICAgICB7Lyog5ZGK6K2m6K+m5oOF5L+h5oGv572R5qC8ICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtMyB0ZXh0LXNtXCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnZGV2aWNlLm5hbWUnKX08L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2FsZXJ0LmRldmljZU5hbWUgPz8gJy0nfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2FsZXJ0Lm1ldHJpYycpfTwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57YWxlcnQubWV0cmljfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e3QoJ2FsZXJ0LnZhbHVlJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnthbGVydC52YWx1ZX08L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdhbGVydC50cmlnZ2VyZWRBdCcpfTwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57bmV3IERhdGUoYWxlcnQub2NjdXJyZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX08L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHthbGVydC5hY2tub3dsZWRnZWQgJiYgKFxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdhbGVydC50cmlnZ2VyZWRBdCcpfTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntuZXcgRGF0ZShhbGVydC5vY2N1cnJlZEF0KS50b0xvY2FsZVN0cmluZygpfTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAge2FsZXJ0LnJlc29sdmVkICYmIChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnYWxlcnQucmVzb2x2ZWQnKX08L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57bmV3IERhdGUoYWxlcnQub2NjdXJyZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX08L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiDlkYrorabml7bliLvmjIfmoIflv6vnhafvvJpEYXRhU25hcHNob3Qg6Kej5p6Q5bGV56S677yM6K6p6L+Q57u055yL5Yiw5ZGK6K2m6YKj5LiA5Yi75omA5pyJ5oyH5qCH55qE5YC877yI5qC55Zug5LiK5LiL5paH5Zue5pS+77yMXG4gICAgICAgICAgICAgIOavlOS6i+WQjuafpemBpea1i+abtOWHhuKAlOKAlOWRiuitpuinpuWPkeeerOmXtOeahOWujOaVtOiuvuWkh+eKtuaAge+8ieOAgkRhdGFTbmFwc2hvdCDkuLrnqbrvvIjml6flkYrorabvvInliJnkuI3lsZXnpLogKi99XG4gICAgICAgICAge3NuYXBzaG90TWV0cmljcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgIDxTZXBhcmF0b3IgLz5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIG1iLTJcIj57dCgnYWxlcnQuZGF0YVNuYXBzaG90Jyl9PC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1tZCBib3JkZXJcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctbXV0ZWQvNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidGV4dC1sZWZ0IHAtMiBmb250LW1lZGl1bVwiPnt0KCdhbGVydC5tZXRyaWMnKX08L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInRleHQtcmlnaHQgcC0yIGZvbnQtbWVkaXVtXCI+e3QoJ2FsZXJ0LnZhbHVlJyl9PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAge3NuYXBzaG90TWV0cmljcy5tYXAoKFttZXRyaWMsIHZhbF0pID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e21ldHJpY30gY2xhc3NOYW1lPVwiYm9yZGVyLXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMlwiPnttZXRyaWN9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0IHRhYnVsYXItbnVtc1wiPnt2YWx9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvPlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7LyogYWN0aXZlIOeKtuaAge+8muaYvuekuuehruiupOWSjOino+WGs+aMiemSriAqL31cbiAgICAgICAgICB7YWxlcnQuc3RhdHVzID09PSAnYWN0aXZlJyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTIgcHQtMlwiPlxuICAgICAgICAgICAgICB7b25BY2tub3dsZWRnZSAmJiAoXG4gICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21cIiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IG9uQWNrbm93bGVkZ2UoYWxlcnQuaWQpfT5cbiAgICAgICAgICAgICAgICAgIHt0KCdhbGVydC5hY2tub3dsZWRnZScpfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7b25SZXNvbHZlICYmIChcbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbVwiIG9uQ2xpY2s9eygpID0+IG9uUmVzb2x2ZShhbGVydC5pZCl9PlxuICAgICAgICAgICAgICAgICAge3QoJ2FsZXJ0LnJlc29sdmUnKX1cbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7LyogYWNrbm93bGVkZ2VkIOeKtuaAge+8muS7heaYvuekuuino+WGs+aMiemSriAqL31cbiAgICAgICAgICB7YWxlcnQuc3RhdHVzID09PSAnYWNrbm93bGVkZ2VkJyAmJiBvblJlc29sdmUgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwdC0yXCI+XG4gICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgb25DbGljaz17KCkgPT4gb25SZXNvbHZlKGFsZXJ0LmlkKX0+XG4gICAgICAgICAgICAgICAge3QoJ2FsZXJ0LnJlc29sdmUnKX1cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvU2hlZXRDb250ZW50PlxuICAgIDwvU2hlZXQ+XG4gICk7XG59XG4iXX0=