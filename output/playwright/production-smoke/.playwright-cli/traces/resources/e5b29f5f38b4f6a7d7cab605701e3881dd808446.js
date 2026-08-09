import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/SystemInfoCard.tsx");const _jsxDEV = __vite__cjsImport4_react_jsxDevRuntime["jsxDEV"];import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { useQuery } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=1d2f6f90";
import api from "/src/lib/api.ts";
import { Card, CardContent, CardHeader, CardTitle } from "/src/components/ui/card.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SystemInfoCard.tsx";
import __vite__cjsImport4_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 系统信息卡片
*
* 调用 GET /api/v1/system/info 展示后端版本、运行环境和启动时间。
*/
export function SystemInfoCard() {
	_s();
	const { t } = useTranslation();
	const { data, isLoading } = useQuery({
		queryKey: ["system", "info"],
		queryFn: async () => {
			const { data } = await api.get("/system/info");
			return data;
		},
		staleTime: 6e4
	});
	/** 将 ISO 8601 duration 或 TimeSpan 字符串格式化为可读文本 */
	const formatUptime = (raw) => {
		// 后端返回 .NET TimeSpan.ToString() 格式：
		//   - 不足 1 天：HH:MM:SS.fffffff（如 "01:23:45.6789000"）
		//   - 超过 1 天：d.HH:MM:SS.fffffff（如 "1.02:03:04.5670000"）
		// 关键区分：d.HH:MM:SS 中第一个 '.' 出现在第一个 ':' 之前；而 HH:MM:SS.fffffff 中 '.' 在最后一个 ':' 之后
		if (!raw || !/^\d/.test(raw)) return raw ?? "—";
		const firstDot = raw.indexOf(".");
		const firstColon = raw.indexOf(":");
		let days = 0;
		let timePart = raw;
		// 只有当 '.' 在 ':' 之前时，才把 '.' 前视为天数
		if (firstDot > 0 && firstColon > 0 && firstDot < firstColon) {
			days = parseInt(raw.substring(0, firstDot), 10);
			timePart = raw.substring(firstDot + 1);
		}
		// 去掉秒的小数部分（如果有）
		const cleaned = timePart.split(".")[0];
		const [h, m, s] = cleaned.split(":").map((x) => parseInt(x, 10) || 0);
		if (days > 0) return `${days}天 ${h}小时 ${m}分钟`;
		if (h > 0) return `${h}小时 ${m}分钟`;
		if (m > 0) return `${m}分钟 ${s}秒`;
		return `${s}秒`;
	};
	return /* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV(CardTitle, {
		className: "text-base",
		children: t("settings.systemInfo")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 55,
		columnNumber: 9
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 54,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: isLoading ? /* @__PURE__ */ _jsxDEV("p", {
		className: "text-sm text-muted-foreground",
		children: t("common.loading")
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 59,
		columnNumber: 11
	}, this) : data ? /* @__PURE__ */ _jsxDEV("div", {
		className: "grid grid-cols-3 gap-4 text-sm",
		children: [
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-muted-foreground",
				children: t("settings.version")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 63,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: data.version
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 64,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 62,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-muted-foreground",
				children: t("settings.environment")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 67,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: data.environment
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 66,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
				className: "text-muted-foreground",
				children: t("settings.uptime")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 71,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV("p", {
				className: "font-medium",
				children: formatUptime(data.uptime)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 72,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 70,
				columnNumber: 13
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 61,
		columnNumber: 11
	}, this) : /* @__PURE__ */ _jsxDEV("p", {
		className: "text-sm text-muted-foreground",
		children: "—"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 76,
		columnNumber: 11
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 57,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 53,
		columnNumber: 5
	}, this);
}
_s(SystemInfoCard, "HITOoE/OvvxkUGku6N2hJjCPVf8=", false, function() {
	return [useTranslation, useQuery];
});
_c = SystemInfoCard;
var _c;
$RefreshReg$(_c, "SystemInfoCard");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/SystemInfoCard.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SystemInfoCard.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SystemInfoCard.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/SystemInfoCard.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxnQkFBZ0I7QUFDekIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsTUFBTSxhQUFhLFlBQVksaUJBQWlCOzs7Ozs7Ozs7QUFPekQsT0FBTyxTQUFTLGlCQUFpQjs7Q0FDL0IsTUFBTSxFQUFFLE1BQU0sZUFBZTtDQUM3QixNQUFNLEVBQUUsTUFBTSxjQUFjLFNBQVM7RUFDbkMsVUFBVSxDQUFDLFVBQVUsTUFBTTtFQUMzQixTQUFTLFlBQVk7R0FDbkIsTUFBTSxFQUFFLFNBQVMsTUFBTSxJQUFJLElBQUksY0FBYztHQUM3QyxPQUFPO0VBQ1Q7RUFDQSxXQUFXO0NBQ2IsQ0FBQzs7Q0FHRCxNQUFNLGdCQUFnQixRQUF3Qjs7Ozs7RUFLNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssR0FBRyxHQUFHLE9BQU8sT0FBTztFQUU1QyxNQUFNLFdBQVcsSUFBSSxRQUFRLEdBQUc7RUFDaEMsTUFBTSxhQUFhLElBQUksUUFBUSxHQUFHO0VBRWxDLElBQUksT0FBTztFQUNYLElBQUksV0FBVzs7RUFHZixJQUFJLFdBQVcsS0FBSyxhQUFhLEtBQUssV0FBVyxZQUFZO0dBQzNELE9BQU8sU0FBUyxJQUFJLFVBQVUsR0FBRyxRQUFRLEdBQUcsRUFBRTtHQUM5QyxXQUFXLElBQUksVUFBVSxXQUFXLENBQUM7RUFDdkM7O0VBR0EsTUFBTSxVQUFVLFNBQVMsTUFBTSxHQUFHLENBQUMsQ0FBQztFQUNwQyxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssUUFBUSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUksTUFBSyxTQUFTLEdBQUcsRUFBRSxLQUFLLENBQUM7RUFFbEUsSUFBSSxPQUFPLEdBQUcsT0FBTyxHQUFHLEtBQUssSUFBSSxFQUFFLEtBQUssRUFBRTtFQUMxQyxJQUFJLElBQUksR0FBRyxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUU7RUFDOUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLEVBQUUsS0FBSyxFQUFFO0VBQzlCLE9BQU8sR0FBRyxFQUFFO0NBQ2Q7Q0FFQSxPQUNFLHdCQUFDLE1BQUQsYUFDRSx3QkFBQyxZQUFELFlBQ0Usd0JBQUMsV0FBRDtFQUFXLFdBQVU7WUFBYSxFQUFFLHFCQUFxQjtDQUFhOzs7O1VBQzVEOzs7O1dBQ1osd0JBQUMsYUFBRCxZQUNHLFlBQ0Msd0JBQUMsS0FBRDtFQUFHLFdBQVU7WUFBaUMsRUFBRSxnQkFBZ0I7Q0FBSzs7OztZQUNuRSxPQUNGLHdCQUFDLE9BQUQ7RUFBSyxXQUFVO1lBQWY7R0FDRSx3QkFBQyxPQUFELGFBQ0Usd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBeUIsRUFBRSxrQkFBa0I7R0FBSzs7OzthQUMvRCx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFlLEtBQUs7R0FBVzs7OztXQUN6Qzs7Ozs7R0FDTCx3QkFBQyxPQUFELGFBQ0Usd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBeUIsRUFBRSxzQkFBc0I7R0FBSzs7OzthQUNuRSx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFlLEtBQUs7R0FBZTs7OztXQUM3Qzs7Ozs7R0FDTCx3QkFBQyxPQUFELGFBQ0Usd0JBQUMsS0FBRDtJQUFHLFdBQVU7Y0FBeUIsRUFBRSxpQkFBaUI7R0FBSzs7OzthQUM5RCx3QkFBQyxLQUFEO0lBQUcsV0FBVTtjQUFlLGFBQWEsS0FBSyxNQUFNO0dBQUs7Ozs7V0FDdEQ7Ozs7O0VBQ0Y7Ozs7O1lBRUwsd0JBQUMsS0FBRDtFQUFHLFdBQVU7WUFBZ0M7Q0FBSTs7OztVQUV4Qzs7OztTQUNUOzs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlN5c3RlbUluZm9DYXJkLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlUXVlcnkgfSBmcm9tICdAdGFuc3RhY2svcmVhY3QtcXVlcnknO1xuaW1wb3J0IGFwaSBmcm9tICcuLi8uLi9saWIvYXBpJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUgfSBmcm9tICcuLi91aS9jYXJkJztcblxuLyoqXG4gKiDns7vnu5/kv6Hmga/ljaHniYdcbiAqXG4gKiDosIPnlKggR0VUIC9hcGkvdjEvc3lzdGVtL2luZm8g5bGV56S65ZCO56uv54mI5pys44CB6L+Q6KGM546v5aKD5ZKM5ZCv5Yqo5pe26Ze044CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBTeXN0ZW1JbmZvQ2FyZCgpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IGRhdGEsIGlzTG9hZGluZyB9ID0gdXNlUXVlcnkoe1xuICAgIHF1ZXJ5S2V5OiBbJ3N5c3RlbScsICdpbmZvJ10sXG4gICAgcXVlcnlGbjogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCBhcGkuZ2V0KCcvc3lzdGVtL2luZm8nKTtcbiAgICAgIHJldHVybiBkYXRhIGFzIHsgdmVyc2lvbjogc3RyaW5nOyBlbnZpcm9ubWVudDogc3RyaW5nOyB1cHRpbWU6IHN0cmluZyB9O1xuICAgIH0sXG4gICAgc3RhbGVUaW1lOiA2MF8wMDAsXG4gIH0pO1xuXG4gIC8qKiDlsIYgSVNPIDg2MDEgZHVyYXRpb24g5oiWIFRpbWVTcGFuIOWtl+espuS4suagvOW8j+WMluS4uuWPr+ivu+aWh+acrCAqL1xuICBjb25zdCBmb3JtYXRVcHRpbWUgPSAocmF3OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgIC8vIOWQjuerr+i/lOWbniAuTkVUIFRpbWVTcGFuLlRvU3RyaW5nKCkg5qC85byP77yaXG4gICAgLy8gICAtIOS4jei2syAxIOWkqe+8mkhIOk1NOlNTLmZmZmZmZmbvvIjlpoIgXCIwMToyMzo0NS42Nzg5MDAwXCLvvIlcbiAgICAvLyAgIC0g6LaF6L+HIDEg5aSp77yaZC5ISDpNTTpTUy5mZmZmZmZm77yI5aaCIFwiMS4wMjowMzowNC41NjcwMDAwXCLvvIlcbiAgICAvLyDlhbPplK7ljLrliIbvvJpkLkhIOk1NOlNTIOS4reesrOS4gOS4qiAnLicg5Ye6546w5Zyo56ys5LiA5LiqICc6JyDkuYvliY3vvJvogIwgSEg6TU06U1MuZmZmZmZmZiDkuK0gJy4nIOWcqOacgOWQjuS4gOS4qiAnOicg5LmL5ZCOXG4gICAgaWYgKCFyYXcgfHwgIS9eXFxkLy50ZXN0KHJhdykpIHJldHVybiByYXcgPz8gJ+KAlCc7XG5cbiAgICBjb25zdCBmaXJzdERvdCA9IHJhdy5pbmRleE9mKCcuJyk7XG4gICAgY29uc3QgZmlyc3RDb2xvbiA9IHJhdy5pbmRleE9mKCc6Jyk7XG5cbiAgICBsZXQgZGF5cyA9IDA7XG4gICAgbGV0IHRpbWVQYXJ0ID0gcmF3O1xuXG4gICAgLy8g5Y+q5pyJ5b2TICcuJyDlnKggJzonIOS5i+WJjeaXtu+8jOaJjeaKiiAnLicg5YmN6KeG5Li65aSp5pWwXG4gICAgaWYgKGZpcnN0RG90ID4gMCAmJiBmaXJzdENvbG9uID4gMCAmJiBmaXJzdERvdCA8IGZpcnN0Q29sb24pIHtcbiAgICAgIGRheXMgPSBwYXJzZUludChyYXcuc3Vic3RyaW5nKDAsIGZpcnN0RG90KSwgMTApO1xuICAgICAgdGltZVBhcnQgPSByYXcuc3Vic3RyaW5nKGZpcnN0RG90ICsgMSk7XG4gICAgfVxuXG4gICAgLy8g5Y675o6J56eS55qE5bCP5pWw6YOo5YiG77yI5aaC5p6c5pyJ77yJXG4gICAgY29uc3QgY2xlYW5lZCA9IHRpbWVQYXJ0LnNwbGl0KCcuJylbMF07XG4gICAgY29uc3QgW2gsIG0sIHNdID0gY2xlYW5lZC5zcGxpdCgnOicpLm1hcCh4ID0+IHBhcnNlSW50KHgsIDEwKSB8fCAwKTtcblxuICAgIGlmIChkYXlzID4gMCkgcmV0dXJuIGAke2RheXN95aSpICR7aH3lsI/ml7YgJHttfeWIhumSn2A7XG4gICAgaWYgKGggPiAwKSByZXR1cm4gYCR7aH3lsI/ml7YgJHttfeWIhumSn2A7XG4gICAgaWYgKG0gPiAwKSByZXR1cm4gYCR7bX3liIbpkp8gJHtzfeenkmA7XG4gICAgcmV0dXJuIGAke3N956eSYDtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwidGV4dC1iYXNlXCI+e3QoJ3NldHRpbmdzLnN5c3RlbUluZm8nKX08L0NhcmRUaXRsZT5cbiAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgIDxDYXJkQ29udGVudD5cbiAgICAgICAge2lzTG9hZGluZyA/IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdjb21tb24ubG9hZGluZycpfTwvcD5cbiAgICAgICAgKSA6IGRhdGEgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC00IHRleHQtc21cIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPnt0KCdzZXR0aW5ncy52ZXJzaW9uJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntkYXRhLnZlcnNpb259PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnc2V0dGluZ3MuZW52aXJvbm1lbnQnKX08L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RhdGEuZW52aXJvbm1lbnR9PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnc2V0dGluZ3MudXB0aW1lJyl9PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPntmb3JtYXRVcHRpbWUoZGF0YS51cHRpbWUpfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+4oCUPC9wPlxuICAgICAgICApfVxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXX0=