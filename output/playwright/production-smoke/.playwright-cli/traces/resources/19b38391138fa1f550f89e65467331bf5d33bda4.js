import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/workorder/WorkOrderForm.tsx");const _jsxDEV = __vite__cjsImport9_react_jsxDevRuntime["jsxDEV"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Textarea } from "/src/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/WorkOrderForm.tsx";
import __vite__cjsImport9_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 工单表单校验规则 */
const workOrderSchema = z.object({
	title: z.string().min(1, "workorder.titleRequired"),
	type: z.string().min(1, "workorder.typeRequired"),
	priority: z.string().min(1, "workorder.priorityRequired"),
	deviceId: z.string().min(1, "workorder.deviceRequired"),
	description: z.string().optional(),
	dueDate: z.string().optional()
});
/**
* 工单新建表单组件
*
* 集成 React Hook Form + Zod 表单校验，
* 支持标题、类型、优先级、设备、描述和截止日期字段。
*/
export function WorkOrderForm({ onSubmit, onCancel, loading, devices = [] }) {
	_s();
	const { t } = useTranslation();
	const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(workOrderSchema) });
	/** 表单提交处理 */
	const handleFormSubmit = (data) => {
		onSubmit({
			...data,
			description: data.description ?? "",
			// 空字符串会导致后端 DateTime 反序列化失败，转为 undefined
			dueDate: data.dueDate || undefined
		});
	};
	return /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleSubmit(handleFormSubmit),
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.titleField") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 61,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						...register("title"),
						placeholder: t("workorder.titlePlaceholder")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 62,
						columnNumber: 9
					}, this),
					errors.title && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: t(errors.title.message)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 63,
						columnNumber: 26
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 60,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.type") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 69,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Select, {
							onValueChange: (v) => {
								if (v != null) setValue("type", String(v));
							},
							children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("workorder.selectType") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 71,
								columnNumber: 28
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 71,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "corrective",
									children: t("workorder.typeOptions.corrective")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 73,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "preventive",
									children: t("workorder.typeOptions.preventive")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 74,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "predictive",
									children: t("workorder.typeOptions.predictive")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 75,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "inspection",
									children: t("workorder.typeOptions.inspection")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 76,
									columnNumber: 15
								}, this)
							] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 72,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 70,
							columnNumber: 11
						}, this),
						errors.type && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: t(errors.type.message)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 79,
							columnNumber: 27
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 68,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.priority") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 82,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Select, {
							onValueChange: (v) => {
								if (v != null) setValue("priority", String(v));
							},
							children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("workorder.selectPriority") }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 84,
								columnNumber: 28
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 84,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "critical",
									children: t("alert.critical")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 86,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "high",
									children: t("alert.high")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 87,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "normal",
									children: t("alert.normal")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 88,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV(SelectItem, {
									value: "low",
									children: t("alert.low")
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 89,
									columnNumber: 15
								}, this)
							] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 85,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 11
						}, this),
						errors.priority && /* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-destructive",
							children: t(errors.priority.message)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 92,
							columnNumber: 31
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 81,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 67,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.device") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 98,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Select, {
						onValueChange: (v) => {
							if (v != null) setValue("deviceId", String(v));
						},
						children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("workorder.selectDevice") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 100,
							columnNumber: 26
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 100,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: devices.map((d) => /* @__PURE__ */ _jsxDEV(SelectItem, {
							value: d.id,
							children: d.name
						}, d.id, false, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 15
						}, this)) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 101,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 99,
						columnNumber: 9
					}, this),
					errors.deviceId && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: t(errors.deviceId.message)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 107,
						columnNumber: 29
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 97,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.description") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 112,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Textarea, {
					...register("description"),
					placeholder: t("workorder.descriptionPlaceholder"),
					rows: 3
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 113,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 111,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("workorder.dueDate") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 118,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					type: "date",
					...register("dueDate")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 117,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex justify-end gap-2",
				children: [/* @__PURE__ */ _jsxDEV(Button, {
					type: "button",
					variant: "outline",
					onClick: onCancel,
					children: t("common.cancel")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 124,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					disabled: loading,
					children: loading ? t("common.loading") : t("common.save")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 125,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 123,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 58,
		columnNumber: 5
	}, this);
}
_s(WorkOrderForm, "HWaUDnxpZ0gJTSg5bYQ84plAVzs=", false, function() {
	return [useTranslation, useForm];
});
_c = WorkOrderForm;
var _c;
$RefreshReg$(_c, "WorkOrderForm");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/workorder/WorkOrderForm.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/WorkOrderForm.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/WorkOrderForm.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/workorder/WorkOrderForm.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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ZixDQUNFLHdCQUFDLE9BQUQsWUFBUSxFQUFFLHVCQUF1QixFQUFTOzs7O2NBQzFDLHdCQUFDLFVBQUQ7S0FBVSxHQUFJLFNBQVMsYUFBYTtLQUFHLGFBQWEsRUFBRSxrQ0FBa0M7S0FBRyxNQUFNO0lBQUk7Ozs7WUFDbEc7Ozs7OztHQUdMLHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQWYsQ0FDRSx3QkFBQyxPQUFELFlBQVEsRUFBRSxtQkFBbUIsRUFBUzs7OztjQUN0Qyx3QkFBQyxPQUFEO0tBQU8sTUFBSztLQUFPLEdBQUksU0FBUyxTQUFTO0lBQUk7Ozs7WUFDMUM7Ozs7OztHQUdMLHdCQUFDLE9BQUQ7SUFBSyxXQUFVO2NBQWYsQ0FDRSx3QkFBQyxRQUFEO0tBQVEsTUFBSztLQUFTLFNBQVE7S0FBVSxTQUFTO2VBQVcsRUFBRSxlQUFlO0lBQVU7Ozs7Y0FDdkYsd0JBQUMsUUFBRDtLQUFRLE1BQUs7S0FBUyxVQUFVO2VBQVUsVUFBVSxFQUFFLGdCQUFnQixJQUFJLEVBQUUsYUFBYTtJQUFVOzs7O1lBQ2hHOzs7Ozs7RUFDRDs7Ozs7O0FBRVYiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiV29ya09yZGVyRm9ybS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRm9ybSB9IGZyb20gJ3JlYWN0LWhvb2stZm9ybSc7XG5pbXBvcnQgeyB6b2RSZXNvbHZlciB9IGZyb20gJ0Bob29rZm9ybS9yZXNvbHZlcnMvem9kJztcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4uL3VpL2lucHV0JztcbmltcG9ydCB7IExhYmVsIH0gZnJvbSAnLi4vdWkvbGFiZWwnO1xuaW1wb3J0IHsgVGV4dGFyZWEgfSBmcm9tICcuLi91aS90ZXh0YXJlYSc7XG5pbXBvcnQgeyBTZWxlY3QsIFNlbGVjdENvbnRlbnQsIFNlbGVjdEl0ZW0sIFNlbGVjdFRyaWdnZXIsIFNlbGVjdFZhbHVlIH0gZnJvbSAnLi4vdWkvc2VsZWN0JztcbmltcG9ydCB0eXBlIHsgQ3JlYXRlV29ya09yZGVyUmVxdWVzdCB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuLyoqIOW3peWNleihqOWNleagoemqjOinhOWImSAqL1xuY29uc3Qgd29ya09yZGVyU2NoZW1hID0gei5vYmplY3Qoe1xuICB0aXRsZTogei5zdHJpbmcoKS5taW4oMSwgJ3dvcmtvcmRlci50aXRsZVJlcXVpcmVkJyksXG4gIHR5cGU6IHouc3RyaW5nKCkubWluKDEsICd3b3Jrb3JkZXIudHlwZVJlcXVpcmVkJyksXG4gIHByaW9yaXR5OiB6LnN0cmluZygpLm1pbigxLCAnd29ya29yZGVyLnByaW9yaXR5UmVxdWlyZWQnKSxcbiAgZGV2aWNlSWQ6IHouc3RyaW5nKCkubWluKDEsICd3b3Jrb3JkZXIuZGV2aWNlUmVxdWlyZWQnKSxcbiAgZGVzY3JpcHRpb246IHouc3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgZHVlRGF0ZTogei5zdHJpbmcoKS5vcHRpb25hbCgpLFxufSk7XG5cbnR5cGUgV29ya09yZGVyRm9ybURhdGEgPSB6LmluZmVyPHR5cGVvZiB3b3JrT3JkZXJTY2hlbWE+O1xuXG5pbnRlcmZhY2UgV29ya09yZGVyRm9ybVByb3BzIHtcbiAgLyoqIOihqOWNleaPkOS6pOWbnuiwgyAqL1xuICBvblN1Ym1pdDogKGRhdGE6IENyZWF0ZVdvcmtPcmRlclJlcXVlc3QpID0+IHZvaWQ7XG4gIC8qKiDlj5bmtojlm57osIMgKi9cbiAgb25DYW5jZWw6ICgpID0+IHZvaWQ7XG4gIC8qKiDmmK/lkKbmraPlnKjmj5DkuqTkuK0gKi9cbiAgbG9hZGluZz86IGJvb2xlYW47XG4gIC8qKiDlj6/pgInorr7lpIfliJfooaggKi9cbiAgZGV2aWNlcz86IEFycmF5PHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nIH0+O1xufVxuXG4vKipcbiAqIOW3peWNleaWsOW7uuihqOWNlee7hOS7tlxuICpcbiAqIOmbhuaIkCBSZWFjdCBIb29rIEZvcm0gKyBab2Qg6KGo5Y2V5qCh6aqM77yMXG4gKiDmlK/mjIHmoIfpopjjgIHnsbvlnovjgIHkvJjlhYjnuqfjgIHorr7lpIfjgIHmj4/ov7DlkozmiKrmraLml6XmnJ/lrZfmrrXjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFdvcmtPcmRlckZvcm0oeyBvblN1Ym1pdCwgb25DYW5jZWwsIGxvYWRpbmcsIGRldmljZXMgPSBbXSB9OiBXb3JrT3JkZXJGb3JtUHJvcHMpIHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCB7IHJlZ2lzdGVyLCBoYW5kbGVTdWJtaXQsIHNldFZhbHVlLCBmb3JtU3RhdGU6IHsgZXJyb3JzIH0gfSA9IHVzZUZvcm08V29ya09yZGVyRm9ybURhdGE+KHtcbiAgICByZXNvbHZlcjogem9kUmVzb2x2ZXIod29ya09yZGVyU2NoZW1hKSxcbiAgfSk7XG5cbiAgLyoqIOihqOWNleaPkOS6pOWkhOeQhiAqL1xuICBjb25zdCBoYW5kbGVGb3JtU3VibWl0ID0gKGRhdGE6IFdvcmtPcmRlckZvcm1EYXRhKSA9PiB7XG4gICAgb25TdWJtaXQoe1xuICAgICAgLi4uZGF0YSxcbiAgICAgIGRlc2NyaXB0aW9uOiBkYXRhLmRlc2NyaXB0aW9uID8/ICcnLFxuICAgICAgLy8g56m65a2X56ym5Liy5Lya5a+86Ie05ZCO56uvIERhdGVUaW1lIOWPjeW6j+WIl+WMluWksei0pe+8jOi9rOS4uiB1bmRlZmluZWRcbiAgICAgIGR1ZURhdGU6IGRhdGEuZHVlRGF0ZSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KGhhbmRsZUZvcm1TdWJtaXQpfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgIHsvKiDmoIfpopggKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICA8TGFiZWw+e3QoJ3dvcmtvcmRlci50aXRsZUZpZWxkJyl9PC9MYWJlbD5cbiAgICAgICAgPElucHV0IHsuLi5yZWdpc3RlcigndGl0bGUnKX0gcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci50aXRsZVBsYWNlaG9sZGVyJyl9IC8+XG4gICAgICAgIHtlcnJvcnMudGl0bGUgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3QoZXJyb3JzLnRpdGxlLm1lc3NhZ2UhKX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDnsbvlnovlkozkvJjlhYjnuqcgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTRcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICA8TGFiZWw+e3QoJ3dvcmtvcmRlci50eXBlJyl9PC9MYWJlbD5cbiAgICAgICAgICA8U2VsZWN0IG9uVmFsdWVDaGFuZ2U9eyh2KSA9PiB7IGlmICh2ICE9IG51bGwpIHNldFZhbHVlKCd0eXBlJywgU3RyaW5nKHYpKTsgfX0+XG4gICAgICAgICAgICA8U2VsZWN0VHJpZ2dlcj48U2VsZWN0VmFsdWUgcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci5zZWxlY3RUeXBlJyl9IC8+PC9TZWxlY3RUcmlnZ2VyPlxuICAgICAgICAgICAgPFNlbGVjdENvbnRlbnQ+XG4gICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiY29ycmVjdGl2ZVwiPnt0KCd3b3Jrb3JkZXIudHlwZU9wdGlvbnMuY29ycmVjdGl2ZScpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJwcmV2ZW50aXZlXCI+e3QoJ3dvcmtvcmRlci50eXBlT3B0aW9ucy5wcmV2ZW50aXZlJyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgICA8U2VsZWN0SXRlbSB2YWx1ZT1cInByZWRpY3RpdmVcIj57dCgnd29ya29yZGVyLnR5cGVPcHRpb25zLnByZWRpY3RpdmUnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwiaW5zcGVjdGlvblwiPnt0KCd3b3Jrb3JkZXIudHlwZU9wdGlvbnMuaW5zcGVjdGlvbicpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAgICB7ZXJyb3JzLnR5cGUgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3QoZXJyb3JzLnR5cGUubWVzc2FnZSEpfTwvcD59XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgIDxMYWJlbD57dCgnd29ya29yZGVyLnByaW9yaXR5Jyl9PC9MYWJlbD5cbiAgICAgICAgICA8U2VsZWN0IG9uVmFsdWVDaGFuZ2U9eyh2KSA9PiB7IGlmICh2ICE9IG51bGwpIHNldFZhbHVlKCdwcmlvcml0eScsIFN0cmluZyh2KSk7IH19PlxuICAgICAgICAgICAgPFNlbGVjdFRyaWdnZXI+PFNlbGVjdFZhbHVlIHBsYWNlaG9sZGVyPXt0KCd3b3Jrb3JkZXIuc2VsZWN0UHJpb3JpdHknKX0gLz48L1NlbGVjdFRyaWdnZXI+XG4gICAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJjcml0aWNhbFwiPnt0KCdhbGVydC5jcml0aWNhbCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJoaWdoXCI+e3QoJ2FsZXJ0LmhpZ2gnKX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICAgIDxTZWxlY3RJdGVtIHZhbHVlPVwibm9ybWFsXCI+e3QoJ2FsZXJ0Lm5vcm1hbCcpfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0gdmFsdWU9XCJsb3dcIj57dCgnYWxlcnQubG93Jyl9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgIDwvU2VsZWN0PlxuICAgICAgICAgIHtlcnJvcnMucHJpb3JpdHkgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3QoZXJyb3JzLnByaW9yaXR5Lm1lc3NhZ2UhKX08L3A+fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5YWz6IGU6K6+5aSHICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIuZGV2aWNlJyl9PC9MYWJlbD5cbiAgICAgICAgPFNlbGVjdCBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodiAhPSBudWxsKSBzZXRWYWx1ZSgnZGV2aWNlSWQnLCBTdHJpbmcodikpOyB9fT5cbiAgICAgICAgICA8U2VsZWN0VHJpZ2dlcj48U2VsZWN0VmFsdWUgcGxhY2Vob2xkZXI9e3QoJ3dvcmtvcmRlci5zZWxlY3REZXZpY2UnKX0gLz48L1NlbGVjdFRyaWdnZXI+XG4gICAgICAgICAgPFNlbGVjdENvbnRlbnQ+XG4gICAgICAgICAgICB7ZGV2aWNlcy5tYXAoKGQpID0+IChcbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0ga2V5PXtkLmlkfSB2YWx1ZT17ZC5pZH0+e2QubmFtZX08L1NlbGVjdEl0ZW0+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L1NlbGVjdENvbnRlbnQ+XG4gICAgICAgIDwvU2VsZWN0PlxuICAgICAgICB7ZXJyb3JzLmRldmljZUlkICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPnt0KGVycm9ycy5kZXZpY2VJZC5tZXNzYWdlISl9PC9wPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5o+P6L+wICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIuZGVzY3JpcHRpb24nKX08L0xhYmVsPlxuICAgICAgICA8VGV4dGFyZWEgey4uLnJlZ2lzdGVyKCdkZXNjcmlwdGlvbicpfSBwbGFjZWhvbGRlcj17dCgnd29ya29yZGVyLmRlc2NyaXB0aW9uUGxhY2Vob2xkZXInKX0gcm93cz17M30gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5oiq5q2i5pel5pyfICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsPnt0KCd3b3Jrb3JkZXIuZHVlRGF0ZScpfTwvTGFiZWw+XG4gICAgICAgIDxJbnB1dCB0eXBlPVwiZGF0ZVwiIHsuLi5yZWdpc3RlcignZHVlRGF0ZScpfSAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDmk43kvZzmjInpkq4gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTJcIj5cbiAgICAgICAgPEJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdmFyaWFudD1cIm91dGxpbmVcIiBvbkNsaWNrPXtvbkNhbmNlbH0+e3QoJ2NvbW1vbi5jYW5jZWwnKX08L0J1dHRvbj5cbiAgICAgICAgPEJ1dHRvbiB0eXBlPVwic3VibWl0XCIgZGlzYWJsZWQ9e2xvYWRpbmd9Pntsb2FkaW5nID8gdCgnY29tbW9uLmxvYWRpbmcnKSA6IHQoJ2NvbW1vbi5zYXZlJyl9PC9CdXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Zvcm0+XG4gICk7XG59XG4iXX0=