import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/device/DeviceForm.tsx");const _jsxDEV = __vite__cjsImport8_react_jsxDevRuntime["jsxDEV"];import { useForm } from "/node_modules/.vite/deps/react-hook-form.js?v=1d2f6f90";
import { zodResolver } from "/node_modules/.vite/deps/@hookform_resolvers_zod.js?v=1d2f6f90";
import { z } from "/node_modules/.vite/deps/zod.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Button } from "/src/components/ui/button.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Label } from "/src/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceForm.tsx";
import __vite__cjsImport8_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/** 设备表单校验规则 */
const deviceSchema = z.object({
	deviceCode: z.string().min(1, "device.deviceCodeRequired"),
	name: z.string().min(1, "device.nameRequired"),
	type: z.string().min(1, "device.typeRequired"),
	manufacturer: z.string().optional(),
	criticality: z.string().optional(),
	model: z.string().optional(),
	serialNumber: z.string().optional(),
	installDate: z.string().optional(),
	gatewayId: z.string().optional(),
	downtimeCostPerHour: z.number().optional()
});
/** 可选的设备类型列表 */
const deviceTypes = [
	"pump",
	"motor",
	"valve",
	"sensor",
	"plc",
	"other"
];
/**
* 设备表单组件
*
* 用于创建和编辑设备档案信息，集成 React Hook Form + Zod 表单校验。
* 覆盖设备编码、名称、类型、关键等级、型号、制造商、序列号、安装日期、
* 绑定网关、停机成本等档案字段；可选字段留空即不提交（保持原值）。
*/
export function DeviceForm({ device, onSubmit, onCancel, loading }) {
	_s();
	const { t } = useTranslation();
	const { register, handleSubmit, setValue, formState: { errors } } = useForm({
		resolver: zodResolver(deviceSchema),
		defaultValues: device ? {
			deviceCode: device.deviceCode,
			name: device.name,
			type: device.type,
			manufacturer: device.manufacturer,
			criticality: device.criticality,
			model: device.model,
			serialNumber: device.serialNumber,
			installDate: device.installDate,
			gatewayId: device.gatewayId,
			downtimeCostPerHour: device.downtimeCostPerHour
		} : undefined
	});
	return /* @__PURE__ */ _jsxDEV("form", {
		onSubmit: handleSubmit(onSubmit),
		className: "space-y-4",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, { children: t("device.deviceCode") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 72,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						...register("deviceCode"),
						placeholder: t("device.deviceCode")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 73,
						columnNumber: 9
					}, this),
					errors.deviceCode && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: t(errors.deviceCode.message)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 74,
						columnNumber: 31
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 71,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, { children: t("device.name") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 79,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Input, {
						...register("name"),
						placeholder: t("device.name")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 80,
						columnNumber: 9
					}, this),
					errors.name && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: t(errors.name.message)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 81,
						columnNumber: 25
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 78,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ _jsxDEV(Label, { children: t("device.type") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 86,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV(Select, {
						defaultValue: device?.type,
						onValueChange: (v) => {
							if (v) setValue("type", v);
						},
						children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("device.type") }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 88,
							columnNumber: 26
						}, this) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 88,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: deviceTypes.map((type) => /* @__PURE__ */ _jsxDEV(SelectItem, {
							value: type,
							children: type
						}, type, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 15
						}, this)) }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 89,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 9
					}, this),
					errors.type && /* @__PURE__ */ _jsxDEV("p", {
						className: "text-sm text-destructive",
						children: t(errors.type.message)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 95,
						columnNumber: 25
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 85,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.criticality") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 100,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Select, {
					defaultValue: device?.criticality ?? "Normal",
					onValueChange: (v) => {
						if (v) setValue("criticality", v);
					},
					children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, { placeholder: t("device.criticality") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 102,
						columnNumber: 26
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 102,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: [
						"Critical",
						"High",
						"Normal",
						"Low"
					].map((c) => /* @__PURE__ */ _jsxDEV(SelectItem, {
						value: c,
						children: c
					}, c, false, {
						fileName: _jsxFileName,
						lineNumber: 105,
						columnNumber: 15
					}, this)) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 103,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 101,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 99,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.model") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 113,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					...register("model"),
					placeholder: t("device.modelPlaceholder")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 114,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 112,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.manufacturer") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					...register("manufacturer"),
					placeholder: t("device.manufacturer")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 120,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.serialNumber") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 125,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					...register("serialNumber"),
					placeholder: t("device.serialNumber")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 126,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 124,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.installDate") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 131,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					type: "date",
					...register("installDate")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 132,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 130,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.gatewayId") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 137,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					...register("gatewayId"),
					placeholder: t("device.gatewayId")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 138,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 136,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ _jsxDEV(Label, { children: t("device.downtimeCostPerHour") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Input, {
					type: "number",
					step: "0.01",
					min: "0",
					...register("downtimeCostPerHour", { setValueAs: (v) => v === "" || v == null ? undefined : Number(v) }),
					placeholder: "0"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 144,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 142,
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
					lineNumber: 155,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					type: "submit",
					disabled: loading,
					children: loading ? t("common.loading") : t("common.save")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 156,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 154,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 69,
		columnNumber: 5
	}, this);
}
_s(DeviceForm, "HWaUDnxpZ0gJTSg5bYQ84plAVzs=", false, function() {
	return [useTranslation, useForm];
});
_c = DeviceForm;
var _c;
$RefreshReg$(_c, "DeviceForm");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/device/DeviceForm.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceForm.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceForm.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/device/DeviceForm.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUFDLE9BQUQ7S0FBTyxHQUFJLFNBQVMsY0FBYztLQUFHLGFBQWEsRUFBRSxxQkFBcUI7SUFBSTs7OztZQUMxRTs7Ozs7O0dBR0wsd0JBQUMsT0FBRDtJQUFLLFdBQVU7Y0FBZixDQUNFLHdCQUFDLE9BQUQsWUFBUSxFQUFFLG9CQUFvQixFQUFTOzs7O2NBQ3ZDLHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQU8sR0FBSSxTQUFTLGFBQWE7SUFBSTs7OztZQUM5Qzs7Ozs7O0dBR0wsd0JBQUMsT0FBRDtJQUFLLFdBQVU7Y0FBZixDQUNFLHdCQUFDLE9BQUQsWUFBUSxFQUFFLGtCQUFrQixFQUFTOzs7O2NBQ3JDLHdCQUFDLE9BQUQ7S0FBTyxHQUFJLFNBQVMsV0FBVztLQUFHLGFBQWEsRUFBRSxrQkFBa0I7SUFBSTs7OztZQUNwRTs7Ozs7O0dBR0wsd0JBQUMsT0FBRDtJQUFLLFdBQVU7Y0FBZixDQUNFLHdCQUFDLE9BQUQsWUFBUSxFQUFFLDRCQUE0QixFQUFTOzs7O2NBQy9DLHdCQUFDLE9BQUQ7S0FDRSxNQUFLO0tBQ0wsTUFBSztLQUNMLEtBQUk7S0FDSixHQUFJLFNBQVMsdUJBQXVCLEVBQUUsYUFBYSxNQUFPLE1BQU0sTUFBTSxLQUFLLE9BQU8sWUFBWSxPQUFPLENBQUMsRUFBRyxDQUFDO0tBQzFHLGFBQVk7SUFDYjs7OztZQUNFOzs7Ozs7R0FHTCx3QkFBQyxPQUFEO0lBQUssV0FBVTtjQUFmLENBQ0Usd0JBQUMsUUFBRDtLQUFRLE1BQUs7S0FBUyxTQUFRO0tBQVUsU0FBUztlQUFXLEVBQUUsZUFBZTtJQUFVOzs7O2NBQ3ZGLHdCQUFDLFFBQUQ7S0FBUSxNQUFLO0tBQVMsVUFBVTtlQUFVLFVBQVUsRUFBRSxnQkFBZ0IsSUFBSSxFQUFFLGFBQWE7SUFBVTs7OztZQUNoRzs7Ozs7O0VBQ0Q7Ozs7OztBQUVWIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRldmljZUZvcm0udHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUZvcm0gfSBmcm9tICdyZWFjdC1ob29rLWZvcm0nO1xuaW1wb3J0IHsgem9kUmVzb2x2ZXIgfSBmcm9tICdAaG9va2Zvcm0vcmVzb2x2ZXJzL3pvZCc7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuLi91aS9idXR0b24nO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuLi91aS9pbnB1dCc7XG5pbXBvcnQgeyBMYWJlbCB9IGZyb20gJy4uL3VpL2xhYmVsJztcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0Q29udGVudCwgU2VsZWN0SXRlbSwgU2VsZWN0VHJpZ2dlciwgU2VsZWN0VmFsdWUgfSBmcm9tICcuLi91aS9zZWxlY3QnO1xuaW1wb3J0IHR5cGUgeyBEZXZpY2UsIENyZWF0ZURldmljZVJlcXVlc3QgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5cbi8qKiDorr7lpIfooajljZXmoKHpqozop4TliJkgKi9cbmNvbnN0IGRldmljZVNjaGVtYSA9IHoub2JqZWN0KHtcbiAgZGV2aWNlQ29kZTogei5zdHJpbmcoKS5taW4oMSwgJ2RldmljZS5kZXZpY2VDb2RlUmVxdWlyZWQnKSxcbiAgbmFtZTogei5zdHJpbmcoKS5taW4oMSwgJ2RldmljZS5uYW1lUmVxdWlyZWQnKSxcbiAgdHlwZTogei5zdHJpbmcoKS5taW4oMSwgJ2RldmljZS50eXBlUmVxdWlyZWQnKSxcbiAgbWFudWZhY3R1cmVyOiB6LnN0cmluZygpLm9wdGlvbmFsKCksXG4gIGNyaXRpY2FsaXR5OiB6LnN0cmluZygpLm9wdGlvbmFsKCksXG4gIG1vZGVsOiB6LnN0cmluZygpLm9wdGlvbmFsKCksXG4gIHNlcmlhbE51bWJlcjogei5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICBpbnN0YWxsRGF0ZTogei5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICBnYXRld2F5SWQ6IHouc3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgZG93bnRpbWVDb3N0UGVySG91cjogei5udW1iZXIoKS5vcHRpb25hbCgpLFxufSk7XG5cbnR5cGUgRGV2aWNlRm9ybURhdGEgPSB6LmluZmVyPHR5cGVvZiBkZXZpY2VTY2hlbWE+O1xuXG4vKiog5Y+v6YCJ55qE6K6+5aSH57G75Z6L5YiX6KGoICovXG5jb25zdCBkZXZpY2VUeXBlcyA9IFsncHVtcCcsICdtb3RvcicsICd2YWx2ZScsICdzZW5zb3InLCAncGxjJywgJ290aGVyJ107XG5cbmludGVyZmFjZSBEZXZpY2VGb3JtUHJvcHMge1xuICAvKiog57yW6L6R5qih5byP5pe25Lyg5YWl5bey5pyJ6K6+5aSH5pWw5o2uICovXG4gIGRldmljZT86IERldmljZTtcbiAgLyoqIOihqOWNleaPkOS6pOWbnuiwgyAqL1xuICBvblN1Ym1pdDogKGRhdGE6IENyZWF0ZURldmljZVJlcXVlc3QpID0+IHZvaWQ7XG4gIC8qKiDlj5bmtojlm57osIMgKi9cbiAgb25DYW5jZWw6ICgpID0+IHZvaWQ7XG4gIC8qKiDmmK/lkKbmraPlnKjmj5DkuqTkuK0gKi9cbiAgbG9hZGluZz86IGJvb2xlYW47XG59XG5cbi8qKlxuICog6K6+5aSH6KGo5Y2V57uE5Lu2XG4gKlxuICog55So5LqO5Yib5bu65ZKM57yW6L6R6K6+5aSH5qGj5qGI5L+h5oGv77yM6ZuG5oiQIFJlYWN0IEhvb2sgRm9ybSArIFpvZCDooajljZXmoKHpqozjgIJcbiAqIOimhuebluiuvuWkh+e8lueggeOAgeWQjeensOOAgeexu+Wei+OAgeWFs+mUruetiee6p+OAgeWei+WPt+OAgeWItumAoOWVhuOAgeW6j+WIl+WPt+OAgeWuieijheaXpeacn+OAgVxuICog57uR5a6a572R5YWz44CB5YGc5py65oiQ5pys562J5qGj5qGI5a2X5q6177yb5Y+v6YCJ5a2X5q6155WZ56m65Y2z5LiN5o+Q5Lqk77yI5L+d5oyB5Y6f5YC877yJ44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBEZXZpY2VGb3JtKHsgZGV2aWNlLCBvblN1Ym1pdCwgb25DYW5jZWwsIGxvYWRpbmcgfTogRGV2aWNlRm9ybVByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgeyByZWdpc3RlciwgaGFuZGxlU3VibWl0LCBzZXRWYWx1ZSwgZm9ybVN0YXRlOiB7IGVycm9ycyB9IH0gPSB1c2VGb3JtPERldmljZUZvcm1EYXRhPih7XG4gICAgcmVzb2x2ZXI6IHpvZFJlc29sdmVyKGRldmljZVNjaGVtYSksXG4gICAgZGVmYXVsdFZhbHVlczogZGV2aWNlXG4gICAgICA/IHtcbiAgICAgICAgICBkZXZpY2VDb2RlOiBkZXZpY2UuZGV2aWNlQ29kZSxcbiAgICAgICAgICBuYW1lOiBkZXZpY2UubmFtZSxcbiAgICAgICAgICB0eXBlOiBkZXZpY2UudHlwZSxcbiAgICAgICAgICBtYW51ZmFjdHVyZXI6IGRldmljZS5tYW51ZmFjdHVyZXIsXG4gICAgICAgICAgY3JpdGljYWxpdHk6IGRldmljZS5jcml0aWNhbGl0eSxcbiAgICAgICAgICBtb2RlbDogZGV2aWNlLm1vZGVsLFxuICAgICAgICAgIHNlcmlhbE51bWJlcjogZGV2aWNlLnNlcmlhbE51bWJlcixcbiAgICAgICAgICBpbnN0YWxsRGF0ZTogZGV2aWNlLmluc3RhbGxEYXRlLFxuICAgICAgICAgIGdhdGV3YXlJZDogZGV2aWNlLmdhdGV3YXlJZCxcbiAgICAgICAgICBkb3dudGltZUNvc3RQZXJIb3VyOiBkZXZpY2UuZG93bnRpbWVDb3N0UGVySG91cixcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gIH0pO1xuXG4gIHJldHVybiAoXG4gICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdChvblN1Ym1pdCl9IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgey8qIOiuvuWkh+e8lueggSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmRldmljZUNvZGUnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXQgey4uLnJlZ2lzdGVyKCdkZXZpY2VDb2RlJyl9IHBsYWNlaG9sZGVyPXt0KCdkZXZpY2UuZGV2aWNlQ29kZScpfSAvPlxuICAgICAgICB7ZXJyb3JzLmRldmljZUNvZGUgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3QoZXJyb3JzLmRldmljZUNvZGUubWVzc2FnZSEpfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOiuvuWkh+WQjeensCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLm5hbWUnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXQgey4uLnJlZ2lzdGVyKCduYW1lJyl9IHBsYWNlaG9sZGVyPXt0KCdkZXZpY2UubmFtZScpfSAvPlxuICAgICAgICB7ZXJyb3JzLm5hbWUgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWRlc3RydWN0aXZlXCI+e3QoZXJyb3JzLm5hbWUubWVzc2FnZSEpfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOiuvuWkh+exu+WeiyAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLnR5cGUnKX08L0xhYmVsPlxuICAgICAgICA8U2VsZWN0IGRlZmF1bHRWYWx1ZT17ZGV2aWNlPy50eXBlfSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0VmFsdWUoJ3R5cGUnLCB2KTsgfX0+XG4gICAgICAgICAgPFNlbGVjdFRyaWdnZXI+PFNlbGVjdFZhbHVlIHBsYWNlaG9sZGVyPXt0KCdkZXZpY2UudHlwZScpfSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIHtkZXZpY2VUeXBlcy5tYXAoKHR5cGUpID0+IChcbiAgICAgICAgICAgICAgPFNlbGVjdEl0ZW0ga2V5PXt0eXBlfSB2YWx1ZT17dHlwZX0+e3R5cGV9PC9TZWxlY3RJdGVtPlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICA8L1NlbGVjdD5cbiAgICAgICAge2Vycm9ycy50eXBlICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1kZXN0cnVjdGl2ZVwiPnt0KGVycm9ycy50eXBlLm1lc3NhZ2UhKX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDlhbPplK7nrYnnuqfvvIjorr7lpIfkvJjlhYjnuqfvvIzlvbHlk43lkYroraYv5bel5Y2V5o6S5bqP77yJICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsPnt0KCdkZXZpY2UuY3JpdGljYWxpdHknKX08L0xhYmVsPlxuICAgICAgICA8U2VsZWN0IGRlZmF1bHRWYWx1ZT17ZGV2aWNlPy5jcml0aWNhbGl0eSA/PyAnTm9ybWFsJ30gb25WYWx1ZUNoYW5nZT17KHYpID0+IHsgaWYgKHYpIHNldFZhbHVlKCdjcml0aWNhbGl0eScsIHYpOyB9fT5cbiAgICAgICAgICA8U2VsZWN0VHJpZ2dlcj48U2VsZWN0VmFsdWUgcGxhY2Vob2xkZXI9e3QoJ2RldmljZS5jcml0aWNhbGl0eScpfSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICA8U2VsZWN0Q29udGVudD5cbiAgICAgICAgICAgIHsoWydDcml0aWNhbCcsICdIaWdoJywgJ05vcm1hbCcsICdMb3cnXSBhcyBjb25zdCkubWFwKChjKSA9PiAoXG4gICAgICAgICAgICAgIDxTZWxlY3RJdGVtIGtleT17Y30gdmFsdWU9e2N9PntjfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvU2VsZWN0Q29udGVudD5cbiAgICAgICAgPC9TZWxlY3Q+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOiuvuWkh+Wei+WPtyAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLm1vZGVsJyl9PC9MYWJlbD5cbiAgICAgICAgPElucHV0IHsuLi5yZWdpc3RlcignbW9kZWwnKX0gcGxhY2Vob2xkZXI9e3QoJ2RldmljZS5tb2RlbFBsYWNlaG9sZGVyJyl9IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOWItumAoOWVhiAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLm1hbnVmYWN0dXJlcicpfTwvTGFiZWw+XG4gICAgICAgIDxJbnB1dCB7Li4ucmVnaXN0ZXIoJ21hbnVmYWN0dXJlcicpfSBwbGFjZWhvbGRlcj17dCgnZGV2aWNlLm1hbnVmYWN0dXJlcicpfSAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDluo/liJflj7fvvIjotYTkuqfov73ouKrvvIkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICA8TGFiZWw+e3QoJ2RldmljZS5zZXJpYWxOdW1iZXInKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXQgey4uLnJlZ2lzdGVyKCdzZXJpYWxOdW1iZXInKX0gcGxhY2Vob2xkZXI9e3QoJ2RldmljZS5zZXJpYWxOdW1iZXInKX0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5a6J6KOF5pel5pyf77yI6LSo5L+d6LW3566X77yJICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgPExhYmVsPnt0KCdkZXZpY2UuaW5zdGFsbERhdGUnKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXQgdHlwZT1cImRhdGVcIiB7Li4ucmVnaXN0ZXIoJ2luc3RhbGxEYXRlJyl9IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOe7keWumue9keWFs+e8luegge+8iOmHh+mbhuaetuaehOW9kuWxnu+8iSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmdhdGV3YXlJZCcpfTwvTGFiZWw+XG4gICAgICAgIDxJbnB1dCB7Li4ucmVnaXN0ZXIoJ2dhdGV3YXlJZCcpfSBwbGFjZWhvbGRlcj17dCgnZGV2aWNlLmdhdGV3YXlJZCcpfSAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiDmr4/lsI/ml7blgZzmnLrmiJDmnKzvvIhST0kg5qC4566XL+S8mOWFiOe6p++8ie+8m3NldFZhbHVlQXMg5oqK56m65YC86L2sIHVuZGVmaW5lZO+8iOWPr+mAieWtl+aute+8iSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxMYWJlbD57dCgnZGV2aWNlLmRvd250aW1lQ29zdFBlckhvdXInKX08L0xhYmVsPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICBzdGVwPVwiMC4wMVwiXG4gICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgey4uLnJlZ2lzdGVyKCdkb3dudGltZUNvc3RQZXJIb3VyJywgeyBzZXRWYWx1ZUFzOiAodikgPT4gKHYgPT09ICcnIHx8IHYgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IE51bWJlcih2KSkgfSl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9XCIwXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Lyog5pON5L2c5oyJ6ZKuICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kIGdhcC0yXCI+XG4gICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHZhcmlhbnQ9XCJvdXRsaW5lXCIgb25DbGljaz17b25DYW5jZWx9Pnt0KCdjb21tb24uY2FuY2VsJyl9PC9CdXR0b24+XG4gICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiIGRpc2FibGVkPXtsb2FkaW5nfT57bG9hZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJykgOiB0KCdjb21tb24uc2F2ZScpfTwvQnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9mb3JtPlxuICApO1xufVxuIl19