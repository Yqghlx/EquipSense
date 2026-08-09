import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/SlaCountdown.tsx");const useEffect = __vite__cjsImport0_react["useEffect"]; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/SlaCountdown.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 已结束的工单状态 — 这些状态不显示 SLA 倒计时（无意义）
*
* Why: 工单完成后剩余时间是负数（已逾期）或正数（按时完成），
*   但都对运维没有指导价值。已完成的工单应该看的是「实际完成时间 vs 截止时间」的偏差，
*   那是另一个维度的统计指标，不属于本组件职责。
*/
const TERMINAL_STATUSES = new Set([
	"completed",
	"accepted",
	"closed",
	"cancelled",
	"rejected"
]);
/**
* 工单 SLA 倒计时组件
*
* 显示工单距截止时间的剩余时长，根据剩余比例和是否逾期用颜色区分：
*   - 已逾期（dueDate < now）→ 红色 +「逾期 X」
*   - 剩余 < 20%（紧急）→ 红色
*   - 剩余 20-50%（警告）→ 橙色
*   - 剩余 > 50%（正常）→ 绿色
*
* 组件每 60 秒自动刷新一次（用 useState + setInterval），保证临近逾期时颜色及时变化。
* 不使用 react-i18next 的实时更新机制，避免每次 i18n 变化都触发渲染。
*/
export function SlaCountdown({ dueDate, createdAt, status, showRawDateWhenTerminal = false }) {
	_s();
	const { t } = useTranslation();
	// now 作为状态而非直接调用 Date.now() — 既满足 react-hooks/purity 规则
	// （render 函数不能调用不纯函数），也保证 60 秒后重新计算剩余时间
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		// 工业现场用户对分钟级精度足够，60 秒刷新平衡了实时性和性能
		const timer = setInterval(() => setNow(Date.now()), 6e4);
		return () => clearInterval(timer);
	}, []);
	// 已结束的工单不显示倒计时
	if (TERMINAL_STATUSES.has(status)) {
		if (!showRawDateWhenTerminal) return null;
		if (!dueDate) return /* @__PURE__ */ _jsxDEV("span", {
			className: "text-sm text-muted-foreground",
			children: "-"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 70,
			columnNumber: 26
		}, this);
		return /* @__PURE__ */ _jsxDEV("span", {
			className: "text-sm text-muted-foreground",
			children: new Date(dueDate).toLocaleString()
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 71,
			columnNumber: 12
		}, this);
	}
	// 未设置截止时间的工单无法计算 SLA
	if (!dueDate) return /* @__PURE__ */ _jsxDEV("span", {
		className: "text-sm text-muted-foreground",
		children: "-"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 75,
		columnNumber: 24
	}, this);
	const due = new Date(dueDate).getTime();
	const created = new Date(createdAt).getTime();
	const totalDuration = due - created;
	const remainingMs = due - now;
	// 总时长异常（dueDate 早于 createdAt）— 视为已逾期
	if (totalDuration <= 0) {
		return /* @__PURE__ */ _jsxDEV("span", {
			className: "text-sm font-medium text-red-600 dark:text-red-400",
			children: t("workorder.slaOverdue", { time: formatDuration(Math.abs(remainingMs), "overdue", t) })
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 85,
			columnNumber: 7
		}, this);
	}
	// 已逾期
	if (remainingMs <= 0) {
		return /* @__PURE__ */ _jsxDEV("span", {
			className: "text-sm font-semibold text-red-600 dark:text-red-400",
			children: t("workorder.slaOverdue", { time: formatDuration(Math.abs(remainingMs), "overdue", t) })
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 94,
			columnNumber: 7
		}, this);
	}
	// 计算剩余比例 = 剩余时长 / 总时长（用于颜色分档）
	const remainingRatio = remainingMs / totalDuration;
	const bucket = pickBucket(remainingMs);
	const text = formatDuration(remainingMs, bucket, t);
	// 颜色分档：< 20% 红色 / 20-50% 橙色 / > 50% 绿色
	let colorClass;
	if (remainingRatio < .2) {
		colorClass = "text-red-600 dark:text-red-400 font-semibold";
	} else if (remainingRatio < .5) {
		colorClass = "text-orange-600 dark:text-orange-400 font-medium";
	} else {
		colorClass = "text-green-600 dark:text-green-400";
	}
	return /* @__PURE__ */ _jsxDEV("span", {
		className: `text-sm ${colorClass}`,
		children: t("workorder.slaRemaining", { time: text })
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 116,
		columnNumber: 5
	}, this);
}
_s(SlaCountdown, "koBi2RG2ubRnOriSiRA8TW4E6uM=", false, function() {
	return [useTranslation];
});
_c = SlaCountdown;
/**
* 根据剩余毫秒数选择合适的显示粒度
*/
function pickBucket(remainingMs) {
	const oneHour = 60 * 60 * 1e3;
	const oneDay = 24 * oneHour;
	if (remainingMs >= oneDay) return "days";
	if (remainingMs >= oneHour) return "hours";
	return "minutes";
}
/**
* 将毫秒数格式化为人类可读的时长字符串（带 i18n）
*
* @param ms 毫秒数（绝对值，正数）
* @param bucket 显示粒度
*/
function formatDuration(ms, bucket, t) {
	const oneMinute = 60 * 1e3;
	const oneHour = 60 * oneMinute;
	const oneDay = 24 * oneHour;
	switch (bucket) {
		case "days":
 // 向上取整 — 剩 1.2 天时显示「2 天」让用户提前准备
		return t("workorder.slaDays", { count: Math.ceil(ms / oneDay) });
		case "hours": return t("workorder.slaHours", { count: Math.ceil(ms / oneHour) });
		case "minutes":
 // 不足 1 分钟时显示「< 1 分钟」，避免显示 0
		return t("workorder.slaMinutes", { count: Math.max(1, Math.ceil(ms / oneMinute)) });
		case "overdue":
			// 逾期显示按粒度递进 — 同 pickBucket 逻辑
			if (ms >= oneDay) return t("workorder.slaDays", { count: Math.floor(ms / oneDay) });
			if (ms >= oneHour) return t("workorder.slaHours", { count: Math.floor(ms / oneHour) });
			return t("workorder.slaMinutes", { count: Math.floor(ms / oneMinute) });
	}
}
var _c;
$RefreshReg$(_c, "SlaCountdown");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/SlaCountdown.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/SlaCountdown.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/SlaCountdown.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/SlaCountdown.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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LElBQUksR0FBRyxLQUFLLEtBQUssS0FBSyxTQUFTLENBQUMsRUFBRSxDQUFDO0VBQ3BGLEtBQUs7O0dBRUgsSUFBSSxNQUFNLFFBQVEsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE9BQU8sS0FBSyxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7R0FDbEYsSUFBSSxNQUFNLFNBQVMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE9BQU8sS0FBSyxNQUFNLEtBQUssT0FBTyxFQUFFLENBQUM7R0FDckYsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE9BQU8sS0FBSyxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Q0FDMUU7QUFDRiIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJTbGFDb3VudGRvd24udHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuXG4vKipcbiAqIOW3sue7k+adn+eahOW3peWNleeKtuaAgSDigJQg6L+Z5Lqb54q25oCB5LiN5pi+56S6IFNMQSDlgJLorqHml7bvvIjml6DmhI/kuYnvvIlcbiAqXG4gKiBXaHk6IOW3peWNleWujOaIkOWQjuWJqeS9meaXtumXtOaYr+i0n+aVsO+8iOW3sumAvuacn++8ieaIluato+aVsO+8iOaMieaXtuWujOaIkO+8ie+8jFxuICogICDkvYbpg73lr7nov5Dnu7TmsqHmnInmjIflr7zku7flgLzjgILlt7LlrozmiJDnmoTlt6XljZXlupTor6XnnIvnmoTmmK/jgIzlrp7pmYXlrozmiJDml7bpl7QgdnMg5oiq5q2i5pe26Ze044CN55qE5YGP5beu77yMXG4gKiAgIOmCo+aYr+WPpuS4gOS4que7tOW6pueahOe7n+iuoeaMh+agh++8jOS4jeWxnuS6juacrOe7hOS7tuiBjOi0o+OAglxuICovXG5jb25zdCBURVJNSU5BTF9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICAnY29tcGxldGVkJyxcbiAgJ2FjY2VwdGVkJyxcbiAgJ2Nsb3NlZCcsXG4gICdjYW5jZWxsZWQnLFxuICAncmVqZWN0ZWQnLFxuXSk7XG5cbi8qKlxuICog5Ymp5L2Z5pe26Ze05YiG5qG257KS5bqm77yI5Yaz5a6a5pi+56S644CM5aSpIC8g5bCP5pe2IC8g5YiG6ZKf44CN77yJXG4gKlxuICog6K6+6K6h5Y6f5YiZ77ya5bel5Lia546w5Zy655So5oi36ZyA6KaB5LiA55y855yL5oeC44CCXG4gKiAgIC0g5Ymp5L2ZIOKJpSAxIOWkqSDihpIg55So44CM5aSp44CN5Li65Y2V5L2N77yI5bCP5pe257K+5bqm5a+56ZW/5ZGo5pyf5peg5oSP5LmJ77yJXG4gKiAgIC0g5Ymp5L2ZIOKJpSAxIOWwj+aXtiDihpIg55So44CM5bCP5pe244CN5Li65Y2V5L2N77yI5YiG6ZKf5Y+Y5YyW5aSq5b+r77yM6aKR57mB5Yi35paw5peg5Lu35YC877yJXG4gKiAgIC0g5Ymp5L2ZIDwgMSDlsI/ml7Yg4oaSIOeUqOOAjOWIhumSn+OAjeS4uuWNleS9je+8iOeyvuehruW6pui2s+Wkn++8jOaPkOekuuWwveW/q+WkhOeQhu+8iVxuICovXG50eXBlIFJlbWFpbmRlckJ1Y2tldCA9ICdkYXlzJyB8ICdob3VycycgfCAnbWludXRlcycgfCAnb3ZlcmR1ZSc7XG5cbmludGVyZmFjZSBTbGFDb3VudGRvd25Qcm9wcyB7XG4gIC8qKiDlt6XljZXmiKrmraLml7bpl7TvvIhVVEMgSVNPIOWtl+espuS4su+8ie+8jG51bGwg6KGo56S65pyq6K6+572u5oiq5q2i5pe26Ze0ICovXG4gIGR1ZURhdGU/OiBzdHJpbmcgfCBudWxsO1xuICAvKiog5bel5Y2V5Yib5bu65pe26Ze077yI55So5LqO6K6h566X5oC75pe26ZW/77yM5Yaz5a6a5Ymp5L2Z55m+5YiG5q+U5Z+657q/77yJICovXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICAvKiog5bel5Y2V5b2T5YmN54q25oCB77yM5bey57uT5p2f54q25oCB77yIY29tcGxldGVkL2Nsb3NlZC8uLi7vvInkuI3muLLmn5PlgJLorqHml7YgKi9cbiAgc3RhdHVzOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDlt7Lnu5PmnZ/nirbmgIHkuIvmmK/lkKblm57pgIDmmL7npLrljp/lp4vml6XmnJ9cbiAgICogV2h5OiDliJfooajpobXntKflh5HluIPlsYDlj6/ku6XpmpDol4/vvIjpu5jorqQgZmFsc2XvvInvvIzor6bmg4XpobXmnInmoIfnrb7kuI3og73nqbrnmb3vvIjorr4gdHJ1Ze+8iVxuICAgKi9cbiAgc2hvd1Jhd0RhdGVXaGVuVGVybWluYWw/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIOW3peWNlSBTTEEg5YCS6K6h5pe257uE5Lu2XG4gKlxuICog5pi+56S65bel5Y2V6Led5oiq5q2i5pe26Ze055qE5Ymp5L2Z5pe26ZW/77yM5qC55o2u5Ymp5L2Z5q+U5L6L5ZKM5piv5ZCm6YC+5pyf55So6aKc6Imy5Yy65YiG77yaXG4gKiAgIC0g5bey6YC+5pyf77yIZHVlRGF0ZSA8IG5vd++8ieKGkiDnuqLoibIgK+OAjOmAvuacnyBY44CNXG4gKiAgIC0g5Ymp5L2ZIDwgMjAl77yI57Sn5oCl77yJ4oaSIOe6ouiJslxuICogICAtIOWJqeS9mSAyMC01MCXvvIjorablkYrvvInihpIg5qmZ6ImyXG4gKiAgIC0g5Ymp5L2ZID4gNTAl77yI5q2j5bi477yJ4oaSIOe7v+iJslxuICpcbiAqIOe7hOS7tuavjyA2MCDnp5Loh6rliqjliLfmlrDkuIDmrKHvvIjnlKggdXNlU3RhdGUgKyBzZXRJbnRlcnZhbO+8ie+8jOS/neivgeS4tOi/kemAvuacn+aXtuminOiJsuWPiuaXtuWPmOWMluOAglxuICog5LiN5L2/55SoIHJlYWN0LWkxOG5leHQg55qE5a6e5pe25pu05paw5py65Yi277yM6YG/5YWN5q+P5qyhIGkxOG4g5Y+Y5YyW6YO96Kem5Y+R5riy5p+T44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBTbGFDb3VudGRvd24oeyBkdWVEYXRlLCBjcmVhdGVkQXQsIHN0YXR1cywgc2hvd1Jhd0RhdGVXaGVuVGVybWluYWwgPSBmYWxzZSB9OiBTbGFDb3VudGRvd25Qcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIC8vIG5vdyDkvZzkuLrnirbmgIHogIzpnZ7nm7TmjqXosIPnlKggRGF0ZS5ub3coKSDigJQg5pei5ruh6LazIHJlYWN0LWhvb2tzL3B1cml0eSDop4TliJlcbiAgLy8g77yIcmVuZGVyIOWHveaVsOS4jeiDveiwg+eUqOS4jee6r+WHveaVsO+8ie+8jOS5n+S/neivgSA2MCDnp5LlkI7ph43mlrDorqHnrpfliankvZnml7bpl7RcbiAgY29uc3QgW25vdywgc2V0Tm93XSA9IHVzZVN0YXRlKCgpID0+IERhdGUubm93KCkpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8g5bel5Lia546w5Zy655So5oi35a+55YiG6ZKf57qn57K+5bqm6Laz5aSf77yMNjAg56eS5Yi35paw5bmz6KGh5LqG5a6e5pe25oCn5ZKM5oCn6IO9XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiBzZXROb3coRGF0ZS5ub3coKSksIDYwXzAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbXSk7XG5cbiAgLy8g5bey57uT5p2f55qE5bel5Y2V5LiN5pi+56S65YCS6K6h5pe2XG4gIGlmIChURVJNSU5BTF9TVEFUVVNFUy5oYXMoc3RhdHVzKSkge1xuICAgIGlmICghc2hvd1Jhd0RhdGVXaGVuVGVybWluYWwpIHJldHVybiBudWxsO1xuICAgIGlmICghZHVlRGF0ZSkgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+LTwvc3Bhbj47XG4gICAgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e25ldyBEYXRlKGR1ZURhdGUpLnRvTG9jYWxlU3RyaW5nKCl9PC9zcGFuPjtcbiAgfVxuXG4gIC8vIOacquiuvue9ruaIquatouaXtumXtOeahOW3peWNleaXoOazleiuoeeulyBTTEFcbiAgaWYgKCFkdWVEYXRlKSByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj4tPC9zcGFuPjtcblxuICBjb25zdCBkdWUgPSBuZXcgRGF0ZShkdWVEYXRlKS5nZXRUaW1lKCk7XG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgRGF0ZShjcmVhdGVkQXQpLmdldFRpbWUoKTtcbiAgY29uc3QgdG90YWxEdXJhdGlvbiA9IGR1ZSAtIGNyZWF0ZWQ7XG4gIGNvbnN0IHJlbWFpbmluZ01zID0gZHVlIC0gbm93O1xuXG4gIC8vIOaAu+aXtumVv+W8guW4uO+8iGR1ZURhdGUg5pep5LqOIGNyZWF0ZWRBdO+8ieKAlCDop4bkuLrlt7LpgL7mnJ9cbiAgaWYgKHRvdGFsRHVyYXRpb24gPD0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtcmVkLTYwMCBkYXJrOnRleHQtcmVkLTQwMFwiPlxuICAgICAgICB7dCgnd29ya29yZGVyLnNsYU92ZXJkdWUnLCB7IHRpbWU6IGZvcm1hdER1cmF0aW9uKE1hdGguYWJzKHJlbWFpbmluZ01zKSwgJ292ZXJkdWUnLCB0KSB9KX1cbiAgICAgIDwvc3Bhbj5cbiAgICApO1xuICB9XG5cbiAgLy8g5bey6YC+5pyfXG4gIGlmIChyZW1haW5pbmdNcyA8PSAwKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1zZW1pYm9sZCB0ZXh0LXJlZC02MDAgZGFyazp0ZXh0LXJlZC00MDBcIj5cbiAgICAgICAge3QoJ3dvcmtvcmRlci5zbGFPdmVyZHVlJywgeyB0aW1lOiBmb3JtYXREdXJhdGlvbihNYXRoLmFicyhyZW1haW5pbmdNcyksICdvdmVyZHVlJywgdCkgfSl9XG4gICAgICA8L3NwYW4+XG4gICAgKTtcbiAgfVxuXG4gIC8vIOiuoeeul+WJqeS9meavlOS+iyA9IOWJqeS9meaXtumVvyAvIOaAu+aXtumVv++8iOeUqOS6juminOiJsuWIhuaho++8iVxuICBjb25zdCByZW1haW5pbmdSYXRpbyA9IHJlbWFpbmluZ01zIC8gdG90YWxEdXJhdGlvbjtcbiAgY29uc3QgYnVja2V0OiBSZW1haW5kZXJCdWNrZXQgPSBwaWNrQnVja2V0KHJlbWFpbmluZ01zKTtcbiAgY29uc3QgdGV4dCA9IGZvcm1hdER1cmF0aW9uKHJlbWFpbmluZ01zLCBidWNrZXQsIHQpO1xuXG4gIC8vIOminOiJsuWIhuaho++8mjwgMjAlIOe6ouiJsiAvIDIwLTUwJSDmqZnoibIgLyA+IDUwJSDnu7/oibJcbiAgbGV0IGNvbG9yQ2xhc3M6IHN0cmluZztcbiAgaWYgKHJlbWFpbmluZ1JhdGlvIDwgMC4yKSB7XG4gICAgY29sb3JDbGFzcyA9ICd0ZXh0LXJlZC02MDAgZGFyazp0ZXh0LXJlZC00MDAgZm9udC1zZW1pYm9sZCc7XG4gIH0gZWxzZSBpZiAocmVtYWluaW5nUmF0aW8gPCAwLjUpIHtcbiAgICBjb2xvckNsYXNzID0gJ3RleHQtb3JhbmdlLTYwMCBkYXJrOnRleHQtb3JhbmdlLTQwMCBmb250LW1lZGl1bSc7XG4gIH0gZWxzZSB7XG4gICAgY29sb3JDbGFzcyA9ICd0ZXh0LWdyZWVuLTYwMCBkYXJrOnRleHQtZ3JlZW4tNDAwJztcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPHNwYW4gY2xhc3NOYW1lPXtgdGV4dC1zbSAke2NvbG9yQ2xhc3N9YH0+XG4gICAgICB7dCgnd29ya29yZGVyLnNsYVJlbWFpbmluZycsIHsgdGltZTogdGV4dCB9KX1cbiAgICA8L3NwYW4+XG4gICk7XG59XG5cbi8qKlxuICog5qC55o2u5Ymp5L2Z5q+r56eS5pWw6YCJ5oup5ZCI6YCC55qE5pi+56S657KS5bqmXG4gKi9cbmZ1bmN0aW9uIHBpY2tCdWNrZXQocmVtYWluaW5nTXM6IG51bWJlcik6IFJlbWFpbmRlckJ1Y2tldCB7XG4gIGNvbnN0IG9uZUhvdXIgPSA2MCAqIDYwICogMTAwMDtcbiAgY29uc3Qgb25lRGF5ID0gMjQgKiBvbmVIb3VyO1xuICBpZiAocmVtYWluaW5nTXMgPj0gb25lRGF5KSByZXR1cm4gJ2RheXMnO1xuICBpZiAocmVtYWluaW5nTXMgPj0gb25lSG91cikgcmV0dXJuICdob3Vycyc7XG4gIHJldHVybiAnbWludXRlcyc7XG59XG5cbi8qKlxuICog5bCG5q+r56eS5pWw5qC85byP5YyW5Li65Lq657G75Y+v6K+755qE5pe26ZW/5a2X56ym5Liy77yI5bimIGkxOG7vvIlcbiAqXG4gKiBAcGFyYW0gbXMg5q+r56eS5pWw77yI57ud5a+55YC877yM5q2j5pWw77yJXG4gKiBAcGFyYW0gYnVja2V0IOaYvuekuueykuW6plxuICovXG5mdW5jdGlvbiBmb3JtYXREdXJhdGlvbihtczogbnVtYmVyLCBidWNrZXQ6IFJlbWFpbmRlckJ1Y2tldCwgdDogKGs6IHN0cmluZywgbz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvbmVNaW51dGUgPSA2MCAqIDEwMDA7XG4gIGNvbnN0IG9uZUhvdXIgPSA2MCAqIG9uZU1pbnV0ZTtcbiAgY29uc3Qgb25lRGF5ID0gMjQgKiBvbmVIb3VyO1xuXG4gIHN3aXRjaCAoYnVja2V0KSB7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgICAvLyDlkJHkuIrlj5bmlbQg4oCUIOWJqSAxLjIg5aSp5pe25pi+56S644CMMiDlpKnjgI3orqnnlKjmiLfmj5DliY3lh4blpIdcbiAgICAgIHJldHVybiB0KCd3b3Jrb3JkZXIuc2xhRGF5cycsIHsgY291bnQ6IE1hdGguY2VpbChtcyAvIG9uZURheSkgfSk7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgICAgcmV0dXJuIHQoJ3dvcmtvcmRlci5zbGFIb3VycycsIHsgY291bnQ6IE1hdGguY2VpbChtcyAvIG9uZUhvdXIpIH0pO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgICAgLy8g5LiN6LazIDEg5YiG6ZKf5pe25pi+56S644CMPCAxIOWIhumSn+OAje+8jOmBv+WFjeaYvuekuiAwXG4gICAgICByZXR1cm4gdCgnd29ya29yZGVyLnNsYU1pbnV0ZXMnLCB7IGNvdW50OiBNYXRoLm1heCgxLCBNYXRoLmNlaWwobXMgLyBvbmVNaW51dGUpKSB9KTtcbiAgICBjYXNlICdvdmVyZHVlJzpcbiAgICAgIC8vIOmAvuacn+aYvuekuuaMieeykuW6pumAkui/myDigJQg5ZCMIHBpY2tCdWNrZXQg6YC76L6RXG4gICAgICBpZiAobXMgPj0gb25lRGF5KSByZXR1cm4gdCgnd29ya29yZGVyLnNsYURheXMnLCB7IGNvdW50OiBNYXRoLmZsb29yKG1zIC8gb25lRGF5KSB9KTtcbiAgICAgIGlmIChtcyA+PSBvbmVIb3VyKSByZXR1cm4gdCgnd29ya29yZGVyLnNsYUhvdXJzJywgeyBjb3VudDogTWF0aC5mbG9vcihtcyAvIG9uZUhvdXIpIH0pO1xuICAgICAgcmV0dXJuIHQoJ3dvcmtvcmRlci5zbGFNaW51dGVzJywgeyBjb3VudDogTWF0aC5mbG9vcihtcyAvIG9uZU1pbnV0ZSkgfSk7XG4gIH1cbn1cbiJdfQ==