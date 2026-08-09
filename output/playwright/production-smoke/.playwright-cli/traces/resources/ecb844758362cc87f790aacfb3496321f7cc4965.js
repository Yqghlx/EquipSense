import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/SubscriptionPanel.tsx");const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { useAuthStore } from "/src/stores/authStore.ts";
import { useSubscription, useChangePlan } from "/src/hooks/useSubscription.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Separator } from "/src/components/ui/separator.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SubscriptionPanel.tsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 可选计划列表 */
const plans = [
	{
		value: "Trial",
		label: "试用版",
		devices: 5,
		users: 3,
		retention: 30
	},
	{
		value: "Basic",
		label: "基础版",
		devices: 50,
		users: 20,
		retention: 90
	},
	{
		value: "Professional",
		label: "专业版",
		devices: 200,
		users: 50,
		retention: 180
	},
	{
		value: "Enterprise",
		label: "企业版",
		devices: 500,
		users: 200,
		retention: 365
	}
];
/**
* 订阅管理面板
*
* 展示当前租户的订阅信息（设备/用户用量、数据保留天数），
* 并支持在四种计划之间切换。
*/
export function SubscriptionPanel() {
	_s();
	const { t } = useTranslation();
	// v1.4：HttpOnly Cookie 迁移后 token 不再前端可见，改用 UserInfo.tenantId
	const user = useAuthStore((s) => s.user);
	const tenantId = user?.tenantId;
	const { data: sub } = useSubscription(tenantId);
	const changePlanMutation = useChangePlan();
	if (!sub) return /* @__PURE__ */ _jsxDEV("p", {
		className: "text-center text-muted-foreground py-8",
		children: t("subscription.noData")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 29,
		columnNumber: 20
	}, this);
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("subscription.title") }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 34,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: [
		t("subscription.currentPlan"),
		": ",
		sub.planDisplayName
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 35,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 33,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "rounded-lg border p-4",
					children: [
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("subscription.devices")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 41,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-2xl font-bold",
							children: [
								sub.currentDevices,
								" ",
								/* @__PURE__ */ _jsxDEV("span", {
									className: "text-sm font-normal text-muted-foreground",
									children: ["/ ", sub.maxDevices]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 42,
									columnNumber: 68
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 42,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "mt-2 h-2 rounded-full bg-secondary",
							children: /* @__PURE__ */ _jsxDEV("div", {
								className: "h-full rounded-full bg-primary transition-all",
								style: { width: `${Math.min(100, sub.currentDevices / sub.maxDevices * 100)}%` }
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 44,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 43,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 40,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "rounded-lg border p-4",
					children: [
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-muted-foreground",
							children: t("subscription.users")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 51,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-2xl font-bold",
							children: [
								sub.currentUsers,
								" ",
								/* @__PURE__ */ _jsxDEV("span", {
									className: "text-sm font-normal text-muted-foreground",
									children: ["/ ", sub.maxUsers]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 52,
									columnNumber: 66
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 52,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "mt-2 h-2 rounded-full bg-secondary",
							children: /* @__PURE__ */ _jsxDEV("div", {
								className: "h-full rounded-full bg-primary transition-all",
								style: { width: `${Math.min(100, sub.currentUsers / sub.maxUsers * 100)}%` }
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 54,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 53,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 50,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 39,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "text-sm text-muted-foreground",
				children: [
					t("subscription.dataRetention"),
					": ",
					sub.dataRetentionDays,
					" ",
					t("subscription.days")
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 62,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(Separator, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 66,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("h3", {
				className: "font-medium",
				children: t("subscription.changePlan")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid grid-cols-2 gap-3",
				children: plans.map((plan) => /* @__PURE__ */ _jsxDEV(Card, {
					className: `cursor-pointer transition-colors ${sub.plan === plan.value ? "ring-2 ring-primary" : ""}`,
					onClick: () => {
						if (sub.plan !== plan.value) {
							changePlanMutation.mutate({
								tenantId: sub.tenantId,
								plan: plan.value
							});
						}
					},
					children: /* @__PURE__ */ _jsxDEV(CardContent, {
						className: "p-4",
						children: [
							/* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium",
								children: plan.label
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 81,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs text-muted-foreground",
								children: [
									plan.devices,
									" ",
									t("subscription.devices"),
									" / ",
									plan.users,
									" ",
									t("subscription.users")
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 82,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs text-muted-foreground",
								children: [
									plan.retention,
									" ",
									t("subscription.days"),
									" ",
									t("subscription.dataRetention")
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 85,
								columnNumber: 17
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 80,
						columnNumber: 15
					}, this)
				}, plan.value, false, {
					fileName: _jsxFileName,
					lineNumber: 71,
					columnNumber: 13
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 69,
				columnNumber: 9
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 37,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 32,
		columnNumber: 5
	}, this);
}
_s(SubscriptionPanel, "58lM2pgWsDnThiuualN+jx5lbuk=", false, function() {
	return [
		useTranslation,
		useAuthStore,
		useSubscription,
		useChangePlan
	];
});
_c = SubscriptionPanel;
var _c;
$RefreshReg$(_c, "SubscriptionPanel");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/SubscriptionPanel.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SubscriptionPanel.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SubscriptionPanel.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SubscriptionPanel.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxpQkFBaUIscUJBQXFCO0FBQy9DLFNBQVMsTUFBTSxhQUFhLFlBQVksV0FBVyx1QkFBdUI7QUFDMUUsU0FBUyxpQkFBaUI7Ozs7O0FBRzFCLE1BQU0sUUFBUTtDQUNaO0VBQUUsT0FBTztFQUFTLE9BQU87RUFBTyxTQUFTO0VBQUcsT0FBTztFQUFHLFdBQVc7Q0FBRztDQUNwRTtFQUFFLE9BQU87RUFBUyxPQUFPO0VBQU8sU0FBUztFQUFJLE9BQU87RUFBSSxXQUFXO0NBQUc7Q0FDdEU7RUFBRSxPQUFPO0VBQWdCLE9BQU87RUFBTyxTQUFTO0VBQUssT0FBTztFQUFJLFdBQVc7Q0FBSTtDQUMvRTtFQUFFLE9BQU87RUFBYyxPQUFPO0VBQU8sU0FBUztFQUFLLE9BQU87RUFBSyxXQUFXO0NBQUk7QUFDaEY7Ozs7Ozs7QUFRQSxPQUFPLFNBQVMsb0JBQW9COztDQUNsQyxNQUFNLEVBQUUsTUFBTSxlQUFlOztDQUU3QixNQUFNLE9BQU8sY0FBYyxNQUFNLEVBQUUsSUFBSTtDQUN2QyxNQUFNLFdBQVcsTUFBTTtDQUN2QixNQUFNLEVBQUUsTUFBTSxRQUFRLGdCQUFnQixRQUFRO0NBQzlDLE1BQU0scUJBQXFCLGNBQWM7Q0FFekMsSUFBSSxDQUFDLEtBQUssT0FBTyx3QkFBQyxLQUFEO0VBQUcsV0FBVTtZQUEwQyxFQUFFLHFCQUFxQjtDQUFLOzs7OztDQUVwRyxPQUNFLHdCQUFDLE1BQUQsYUFDRSx3QkFBQyxZQUFELGFBQ0Usd0JBQUMsV0FBRCxZQUFZLEVBQUUsb0JBQW9CLEVBQWE7Ozs7V0FDL0Msd0JBQUMsaUJBQUQ7RUFBa0IsRUFBRSwwQkFBMEI7RUFBRTtFQUFHLElBQUk7Q0FBaUM7Ozs7U0FDOUU7Ozs7V0FDWix3QkFBQyxhQUFEO0VBQWEsV0FBVTtZQUF2QjtHQUVFLHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQWYsQ0FDRSx3QkFBQyxPQUFEO0tBQUssV0FBVTtlQUFmO01BQ0Usd0JBQUMsS0FBRDtPQUFHLFdBQVU7aUJBQWlDLEVBQUUsc0JBQXNCO01BQUs7Ozs7O01BQzNFLHdCQUFDLEtBQUQ7T0FBRyxXQUFVO2lCQUFiO1FBQW1DLElBQUk7UUFBZTtRQUFDLHdCQUFDLFFBQUQ7U0FBTSxXQUFVO21CQUFoQixDQUE0RCxNQUFHLElBQUksVUFBaUI7Ozs7OztPQUFJOzs7Ozs7TUFDL0ksd0JBQUMsT0FBRDtPQUFLLFdBQVU7aUJBQ2Isd0JBQUMsT0FBRDtRQUNFLFdBQVU7UUFDVixPQUFPLEVBQUUsT0FBTyxHQUFHLEtBQUssSUFBSSxLQUFNLElBQUksaUJBQWlCLElBQUksYUFBYyxHQUFHLEVBQUUsR0FBRztPQUNsRjs7Ozs7TUFDRTs7Ozs7S0FDRjs7Ozs7Y0FDTCx3QkFBQyxPQUFEO0tBQUssV0FBVTtlQUFmO01BQ0Usd0JBQUMsS0FBRDtPQUFHLFdBQVU7aUJBQWlDLEVBQUUsb0JBQW9CO01BQUs7Ozs7O01BQ3pFLHdCQUFDLEtBQUQ7T0FBRyxXQUFVO2lCQUFiO1FBQW1DLElBQUk7UUFBYTtRQUFDLHdCQUFDLFFBQUQ7U0FBTSxXQUFVO21CQUFoQixDQUE0RCxNQUFHLElBQUksUUFBZTs7Ozs7O09BQUk7Ozs7OztNQUMzSSx3QkFBQyxPQUFEO09BQUssV0FBVTtpQkFDYix3QkFBQyxPQUFEO1FBQ0UsV0FBVTtRQUNWLE9BQU8sRUFBRSxPQUFPLEdBQUcsS0FBSyxJQUFJLEtBQU0sSUFBSSxlQUFlLElBQUksV0FBWSxHQUFHLEVBQUUsR0FBRztPQUM5RTs7Ozs7TUFDRTs7Ozs7S0FDRjs7Ozs7WUFDRjs7Ozs7O0dBRUwsd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBYjtLQUNHLEVBQUUsNEJBQTRCO0tBQUU7S0FBRyxJQUFJO0tBQWtCO0tBQUUsRUFBRSxtQkFBbUI7SUFDaEY7Ozs7OztHQUVILHdCQUFDLFdBQUQsQ0FBWTs7Ozs7R0FFWix3QkFBQyxNQUFEO0lBQUksV0FBVTtjQUFlLEVBQUUseUJBQXlCO0dBQU07Ozs7O0dBQzlELHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQ1osTUFBTSxLQUFLLFNBQ1Ysd0JBQUMsTUFBRDtLQUVFLFdBQVcsb0NBQW9DLElBQUksU0FBUyxLQUFLLFFBQVEsd0JBQXdCO0tBQ2pHLGVBQWU7TUFDYixJQUFJLElBQUksU0FBUyxLQUFLLE9BQU87T0FDM0IsbUJBQW1CLE9BQU87UUFBRSxVQUFVLElBQUk7UUFBVSxNQUFNLEtBQUs7T0FBTSxDQUFDO01BQ3hFO0tBQ0Y7ZUFFQSx3QkFBQyxhQUFEO01BQWEsV0FBVTtnQkFBdkI7T0FDRSx3QkFBQyxLQUFEO1FBQUcsV0FBVTtrQkFBZSxLQUFLO09BQVM7Ozs7O09BQzFDLHdCQUFDLEtBQUQ7UUFBRyxXQUFVO2tCQUFiO1NBQ0csS0FBSztTQUFRO1NBQUUsRUFBRSxzQkFBc0I7U0FBRTtTQUFJLEtBQUs7U0FBTTtTQUFFLEVBQUUsb0JBQW9CO1FBQ2hGOzs7Ozs7T0FDSCx3QkFBQyxLQUFEO1FBQUcsV0FBVTtrQkFBYjtTQUNHLEtBQUs7U0FBVTtTQUFFLEVBQUUsbUJBQW1CO1NBQUU7U0FBRSxFQUFFLDRCQUE0QjtRQUN4RTs7Ozs7O01BQ1E7Ozs7OztJQUNULEdBakJDLEtBQUs7Ozs7V0FpQk4sQ0FDUDtHQUNFOzs7OztFQUNNOzs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlN1YnNjcmlwdGlvblBhbmVsLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlQXV0aFN0b3JlIH0gZnJvbSAnLi4vLi4vc3RvcmVzL2F1dGhTdG9yZSc7XG5pbXBvcnQgeyB1c2VTdWJzY3JpcHRpb24sIHVzZUNoYW5nZVBsYW4gfSBmcm9tICcuLi8uLi9ob29rcy91c2VTdWJzY3JpcHRpb24nO1xuaW1wb3J0IHsgQ2FyZCwgQ2FyZENvbnRlbnQsIENhcmRIZWFkZXIsIENhcmRUaXRsZSwgQ2FyZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvY2FyZCc7XG5pbXBvcnQgeyBTZXBhcmF0b3IgfSBmcm9tICcuLi91aS9zZXBhcmF0b3InO1xuXG4vKiog5Y+v6YCJ6K6h5YiS5YiX6KGoICovXG5jb25zdCBwbGFucyA9IFtcbiAgeyB2YWx1ZTogJ1RyaWFsJywgbGFiZWw6ICfor5XnlKjniYgnLCBkZXZpY2VzOiA1LCB1c2VyczogMywgcmV0ZW50aW9uOiAzMCB9LFxuICB7IHZhbHVlOiAnQmFzaWMnLCBsYWJlbDogJ+WfuuehgOeJiCcsIGRldmljZXM6IDUwLCB1c2VyczogMjAsIHJldGVudGlvbjogOTAgfSxcbiAgeyB2YWx1ZTogJ1Byb2Zlc3Npb25hbCcsIGxhYmVsOiAn5LiT5Lia54mIJywgZGV2aWNlczogMjAwLCB1c2VyczogNTAsIHJldGVudGlvbjogMTgwIH0sXG4gIHsgdmFsdWU6ICdFbnRlcnByaXNlJywgbGFiZWw6ICfkvIHkuJrniYgnLCBkZXZpY2VzOiA1MDAsIHVzZXJzOiAyMDAsIHJldGVudGlvbjogMzY1IH0sXG5dO1xuXG4vKipcbiAqIOiuoumYheeuoeeQhumdouadv1xuICpcbiAqIOWxleekuuW9k+WJjeenn+aIt+eahOiuoumYheS/oeaBr++8iOiuvuWkhy/nlKjmiLfnlKjph4/jgIHmlbDmja7kv53nlZnlpKnmlbDvvInvvIxcbiAqIOW5tuaUr+aMgeWcqOWbm+enjeiuoeWIkuS5i+mXtOWIh+aNouOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gU3Vic2NyaXB0aW9uUGFuZWwoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgLy8gdjEuNO+8mkh0dHBPbmx5IENvb2tpZSDov4Hnp7vlkI4gdG9rZW4g5LiN5YaN5YmN56uv5Y+v6KeB77yM5pS555SoIFVzZXJJbmZvLnRlbmFudElkXG4gIGNvbnN0IHVzZXIgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMudXNlcik7XG4gIGNvbnN0IHRlbmFudElkID0gdXNlcj8udGVuYW50SWQ7XG4gIGNvbnN0IHsgZGF0YTogc3ViIH0gPSB1c2VTdWJzY3JpcHRpb24odGVuYW50SWQpO1xuICBjb25zdCBjaGFuZ2VQbGFuTXV0YXRpb24gPSB1c2VDaGFuZ2VQbGFuKCk7XG5cbiAgaWYgKCFzdWIpIHJldHVybiA8cCBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmQgcHktOFwiPnt0KCdzdWJzY3JpcHRpb24ubm9EYXRhJyl9PC9wPjtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkVGl0bGU+e3QoJ3N1YnNjcmlwdGlvbi50aXRsZScpfTwvQ2FyZFRpdGxlPlxuICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPnt0KCdzdWJzY3JpcHRpb24uY3VycmVudFBsYW4nKX06IHtzdWIucGxhbkRpc3BsYXlOYW1lfTwvQ2FyZERlc2NyaXB0aW9uPlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgICB7Lyog55So6YeP5qaC6KeIICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQtbGcgYm9yZGVyIHAtNFwiPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnc3Vic2NyaXB0aW9uLmRldmljZXMnKX08L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57c3ViLmN1cnJlbnREZXZpY2VzfSA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbm9ybWFsIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPi8ge3N1Yi5tYXhEZXZpY2VzfTwvc3Bhbj48L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1zZWNvbmRhcnlcIj5cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtZnVsbCByb3VuZGVkLWZ1bGwgYmctcHJpbWFyeSB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke01hdGgubWluKDEwMCwgKHN1Yi5jdXJyZW50RGV2aWNlcyAvIHN1Yi5tYXhEZXZpY2VzKSAqIDEwMCl9JWAgfX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1sZyBib3JkZXIgcC00XCI+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdzdWJzY3JpcHRpb24udXNlcnMnKX08L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj57c3ViLmN1cnJlbnRVc2Vyc30gPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW5vcm1hbCB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj4vIHtzdWIubWF4VXNlcnN9PC9zcGFuPjwvcD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMiBoLTIgcm91bmRlZC1mdWxsIGJnLXNlY29uZGFyeVwiPlxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC1mdWxsIHJvdW5kZWQtZnVsbCBiZy1wcmltYXJ5IHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7TWF0aC5taW4oMTAwLCAoc3ViLmN1cnJlbnRVc2VycyAvIHN1Yi5tYXhVc2VycykgKiAxMDApfSVgIH19XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cbiAgICAgICAgICB7dCgnc3Vic2NyaXB0aW9uLmRhdGFSZXRlbnRpb24nKX06IHtzdWIuZGF0YVJldGVudGlvbkRheXN9IHt0KCdzdWJzY3JpcHRpb24uZGF5cycpfVxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPFNlcGFyYXRvciAvPlxuXG4gICAgICAgIDxoMyBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt0KCdzdWJzY3JpcHRpb24uY2hhbmdlUGxhbicpfTwvaDM+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtM1wiPlxuICAgICAgICAgIHtwbGFucy5tYXAoKHBsYW4pID0+IChcbiAgICAgICAgICAgIDxDYXJkXG4gICAgICAgICAgICAgIGtleT17cGxhbi52YWx1ZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgJHtzdWIucGxhbiA9PT0gcGxhbi52YWx1ZSA/ICdyaW5nLTIgcmluZy1wcmltYXJ5JyA6ICcnfWB9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3ViLnBsYW4gIT09IHBsYW4udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgIGNoYW5nZVBsYW5NdXRhdGlvbi5tdXRhdGUoeyB0ZW5hbnRJZDogc3ViLnRlbmFudElkLCBwbGFuOiBwbGFuLnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e3BsYW4ubGFiZWx9PC9wPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICB7cGxhbi5kZXZpY2VzfSB7dCgnc3Vic2NyaXB0aW9uLmRldmljZXMnKX0gLyB7cGxhbi51c2Vyc30ge3QoJ3N1YnNjcmlwdGlvbi51c2VycycpfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAge3BsYW4ucmV0ZW50aW9ufSB7dCgnc3Vic2NyaXB0aW9uLmRheXMnKX0ge3QoJ3N1YnNjcmlwdGlvbi5kYXRhUmV0ZW50aW9uJyl9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L0NhcmRDb250ZW50PlxuICAgICAgICAgICAgPC9DYXJkPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgPC9DYXJkPlxuICApO1xufVxuIl19