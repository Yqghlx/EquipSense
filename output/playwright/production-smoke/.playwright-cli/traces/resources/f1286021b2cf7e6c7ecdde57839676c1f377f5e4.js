import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/dropdown-menu.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport4_react_jsxDevRuntime["jsxDEV"];"use client";
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { Menu as MenuPrimitive } from "/node_modules/.vite/deps/@base-ui_react_menu.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
import { ChevronRightIcon, CheckIcon } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dropdown-menu.tsx";
import __vite__cjsImport4_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function DropdownMenu({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Root, {
		"data-slot": "dropdown-menu",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 10,
		columnNumber: 10
	}, this);
}
_c = DropdownMenu;
function DropdownMenuPortal({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Portal, {
		"data-slot": "dropdown-menu-portal",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 14,
		columnNumber: 10
	}, this);
}
_c2 = DropdownMenuPortal;
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 18,
		columnNumber: 10
	}, this);
}
_c3 = DropdownMenuTrigger;
function DropdownMenuContent({ align = "start", alignOffset = 0, side = "bottom", sideOffset = 4, className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Portal, { children: /* @__PURE__ */ _jsxDEV(MenuPrimitive.Positioner, {
		className: "isolate z-50 outline-none",
		align,
		alignOffset,
		side,
		sideOffset,
		children: /* @__PURE__ */ _jsxDEV(MenuPrimitive.Popup, {
			"data-slot": "dropdown-menu-content",
			className: cn("z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 42,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 35,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 34,
		columnNumber: 5
	}, this);
}
_c4 = DropdownMenuContent;
function DropdownMenuGroup({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Group, {
		"data-slot": "dropdown-menu-group",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 53,
		columnNumber: 10
	}, this);
}
_c5 = DropdownMenuGroup;
function DropdownMenuLabel({ className, inset, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.GroupLabel, {
		"data-slot": "dropdown-menu-label",
		"data-inset": inset,
		className: cn("px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 64,
		columnNumber: 5
	}, this);
}
_c6 = DropdownMenuLabel;
function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 86,
		columnNumber: 5
	}, this);
}
_c7 = DropdownMenuItem;
function DropdownMenuSub({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.SubmenuRoot, {
		"data-slot": "dropdown-menu-sub",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 100,
		columnNumber: 10
	}, this);
}
_c8 = DropdownMenuSub;
function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.SubmenuTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": inset,
		className: cn("flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ _jsxDEV(ChevronRightIcon, { className: "ml-auto" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 122,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 112,
		columnNumber: 5
	}, this);
}
_c9 = DropdownMenuSubTrigger;
function DropdownMenuSubContent({ align = "start", alignOffset = -3, side = "right", sideOffset = 0, className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(DropdownMenuContent, {
		"data-slot": "dropdown-menu-sub-content",
		className: cn("w-auto min-w-[96px] rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		align,
		alignOffset,
		side,
		sideOffset,
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 136,
		columnNumber: 5
	}, this);
}
_c10 = DropdownMenuSubContent;
function DropdownMenuCheckboxItem({ className, children, checked, inset, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		"data-inset": inset,
		className: cn("relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		checked,
		...props,
		children: [/* @__PURE__ */ _jsxDEV("span", {
			className: "pointer-events-none absolute right-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-checkbox-item-indicator",
			children: /* @__PURE__ */ _jsxDEV(MenuPrimitive.CheckboxItemIndicator, { children: /* @__PURE__ */ _jsxDEV(CheckIcon, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 173,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 172,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 168,
			columnNumber: 7
		}, this), children]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 158,
		columnNumber: 5
	}, this);
}
_c11 = DropdownMenuCheckboxItem;
function DropdownMenuRadioGroup({ ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.RadioGroup, {
		"data-slot": "dropdown-menu-radio-group",
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 184,
		columnNumber: 5
	}, this);
}
_c12 = DropdownMenuRadioGroup;
function DropdownMenuRadioItem({ className, children, inset, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		"data-inset": inset,
		className: cn("relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [/* @__PURE__ */ _jsxDEV("span", {
			className: "pointer-events-none absolute right-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-radio-item-indicator",
			children: /* @__PURE__ */ _jsxDEV(MenuPrimitive.RadioItemIndicator, { children: /* @__PURE__ */ _jsxDEV(CheckIcon, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 214,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 213,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 209,
			columnNumber: 7
		}, this), children]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 200,
		columnNumber: 5
	}, this);
}
_c13 = DropdownMenuRadioItem;
function DropdownMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV(MenuPrimitive.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: cn("-mx-1 my-1 h-px bg-border", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 228,
		columnNumber: 5
	}, this);
}
_c14 = DropdownMenuSeparator;
function DropdownMenuShortcut({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("span", {
		"data-slot": "dropdown-menu-shortcut",
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 241,
		columnNumber: 5
	}, this);
}
_c15 = DropdownMenuShortcut;
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent };
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15;
$RefreshReg$(_c, "DropdownMenu");
$RefreshReg$(_c2, "DropdownMenuPortal");
$RefreshReg$(_c3, "DropdownMenuTrigger");
$RefreshReg$(_c4, "DropdownMenuContent");
$RefreshReg$(_c5, "DropdownMenuGroup");
$RefreshReg$(_c6, "DropdownMenuLabel");
$RefreshReg$(_c7, "DropdownMenuItem");
$RefreshReg$(_c8, "DropdownMenuSub");
$RefreshReg$(_c9, "DropdownMenuSubTrigger");
$RefreshReg$(_c10, "DropdownMenuSubContent");
$RefreshReg$(_c11, "DropdownMenuCheckboxItem");
$RefreshReg$(_c12, "DropdownMenuRadioGroup");
$RefreshReg$(_c13, "DropdownMenuRadioItem");
$RefreshReg$(_c14, "DropdownMenuSeparator");
$RefreshReg$(_c15, "DropdownMenuShortcut");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/dropdown-menu.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dropdown-menu.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dropdown-menu.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/dropdown-menu.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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aEM7O0FBRUEsU0FBUyx1QkFBdUIsRUFBRSxHQUFHLFNBQXlDO0NBQzVFLE9BQ0Usd0JBQUMsY0FBYyxZQUFmO0VBQ0UsYUFBVTtFQUNWLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLHNCQUFzQixFQUM3QixXQUNBLFVBQ0EsT0FDQSxHQUFHLFNBR0Y7Q0FDRCxPQUNFLHdCQUFDLGNBQWMsV0FBZjtFQUNFLGFBQVU7RUFDVixjQUFZO0VBQ1osV0FBVyxHQUNULDhWQUNBLFNBQ0Y7RUFDQSxHQUFJO1lBUE4sQ0FTRSx3QkFBQyxRQUFEO0dBQ0UsV0FBVTtHQUNWLGFBQVU7YUFFVix3QkFBQyxjQUFjLG9CQUFmLFlBQ0Usd0JBQUMsV0FBRCxDQUNDOzs7O1lBQytCOzs7OztFQUM5Qjs7OztZQUNMLFFBQ3NCOzs7Ozs7QUFFN0I7O0FBRUEsU0FBUyxzQkFBc0IsRUFDN0IsV0FDQSxHQUFHLFNBQzZCO0NBQ2hDLE9BQ0Usd0JBQUMsY0FBYyxXQUFmO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FBRyw2QkFBNkIsU0FBUztFQUNwRCxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxxQkFBcUIsRUFDNUIsV0FDQSxHQUFHLFNBQzRCO0NBQy9CLE9BQ0Usd0JBQUMsUUFBRDtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQ1QsK0dBQ0EsU0FDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUNFLGNBQ0Esb0JBQ0EscUJBQ0EscUJBQ0EsbUJBQ0EsbUJBQ0Esa0JBQ0EsMEJBQ0Esd0JBQ0EsdUJBQ0EsdUJBQ0Esc0JBQ0EsaUJBQ0Esd0JBQ0EiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiZHJvcGRvd24tbWVudS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCJcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCJcbmltcG9ydCB7IE1lbnUgYXMgTWVudVByaW1pdGl2ZSB9IGZyb20gXCJAYmFzZS11aS9yZWFjdC9tZW51XCJcblxuaW1wb3J0IHsgY24gfSBmcm9tIFwiQC9saWIvdXRpbHNcIlxuaW1wb3J0IHsgQ2hldnJvblJpZ2h0SWNvbiwgQ2hlY2tJY29uIH0gZnJvbSBcImx1Y2lkZS1yZWFjdFwiXG5cbmZ1bmN0aW9uIERyb3Bkb3duTWVudSh7IC4uLnByb3BzIH06IE1lbnVQcmltaXRpdmUuUm9vdC5Qcm9wcykge1xuICByZXR1cm4gPE1lbnVQcmltaXRpdmUuUm9vdCBkYXRhLXNsb3Q9XCJkcm9wZG93bi1tZW51XCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVQb3J0YWwoeyAuLi5wcm9wcyB9OiBNZW51UHJpbWl0aXZlLlBvcnRhbC5Qcm9wcykge1xuICByZXR1cm4gPE1lbnVQcmltaXRpdmUuUG9ydGFsIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtcG9ydGFsXCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVUcmlnZ2VyKHsgLi4ucHJvcHMgfTogTWVudVByaW1pdGl2ZS5UcmlnZ2VyLlByb3BzKSB7XG4gIHJldHVybiA8TWVudVByaW1pdGl2ZS5UcmlnZ2VyIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtdHJpZ2dlclwiIHsuLi5wcm9wc30gLz5cbn1cblxuZnVuY3Rpb24gRHJvcGRvd25NZW51Q29udGVudCh7XG4gIGFsaWduID0gXCJzdGFydFwiLFxuICBhbGlnbk9mZnNldCA9IDAsXG4gIHNpZGUgPSBcImJvdHRvbVwiLFxuICBzaWRlT2Zmc2V0ID0gNCxcbiAgY2xhc3NOYW1lLFxuICAuLi5wcm9wc1xufTogTWVudVByaW1pdGl2ZS5Qb3B1cC5Qcm9wcyAmXG4gIFBpY2s8XG4gICAgTWVudVByaW1pdGl2ZS5Qb3NpdGlvbmVyLlByb3BzLFxuICAgIFwiYWxpZ25cIiB8IFwiYWxpZ25PZmZzZXRcIiB8IFwic2lkZVwiIHwgXCJzaWRlT2Zmc2V0XCJcbiAgPikge1xuICByZXR1cm4gKFxuICAgIDxNZW51UHJpbWl0aXZlLlBvcnRhbD5cbiAgICAgIDxNZW51UHJpbWl0aXZlLlBvc2l0aW9uZXJcbiAgICAgICAgY2xhc3NOYW1lPVwiaXNvbGF0ZSB6LTUwIG91dGxpbmUtbm9uZVwiXG4gICAgICAgIGFsaWduPXthbGlnbn1cbiAgICAgICAgYWxpZ25PZmZzZXQ9e2FsaWduT2Zmc2V0fVxuICAgICAgICBzaWRlPXtzaWRlfVxuICAgICAgICBzaWRlT2Zmc2V0PXtzaWRlT2Zmc2V0fVxuICAgICAgPlxuICAgICAgICA8TWVudVByaW1pdGl2ZS5Qb3B1cFxuICAgICAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtY29udGVudFwiXG4gICAgICAgICAgY2xhc3NOYW1lPXtjbihcInotNTAgbWF4LWgtKC0tYXZhaWxhYmxlLWhlaWdodCkgdy0oLS1hbmNob3Itd2lkdGgpIG1pbi13LTMyIG9yaWdpbi0oLS10cmFuc2Zvcm0tb3JpZ2luKSBvdmVyZmxvdy14LWhpZGRlbiBvdmVyZmxvdy15LWF1dG8gcm91bmRlZC1sZyBiZy1wb3BvdmVyIHAtMSB0ZXh0LXBvcG92ZXItZm9yZWdyb3VuZCBzaGFkb3ctbWQgcmluZy0xIHJpbmctZm9yZWdyb3VuZC8xMCBkdXJhdGlvbi0xMDAgb3V0bGluZS1ub25lIGRhdGEtW3NpZGU9Ym90dG9tXTpzbGlkZS1pbi1mcm9tLXRvcC0yIGRhdGEtW3NpZGU9aW5saW5lLWVuZF06c2xpZGUtaW4tZnJvbS1sZWZ0LTIgZGF0YS1bc2lkZT1pbmxpbmUtc3RhcnRdOnNsaWRlLWluLWZyb20tcmlnaHQtMiBkYXRhLVtzaWRlPWxlZnRdOnNsaWRlLWluLWZyb20tcmlnaHQtMiBkYXRhLVtzaWRlPXJpZ2h0XTpzbGlkZS1pbi1mcm9tLWxlZnQtMiBkYXRhLVtzaWRlPXRvcF06c2xpZGUtaW4tZnJvbS1ib3R0b20tMiBkYXRhLW9wZW46YW5pbWF0ZS1pbiBkYXRhLW9wZW46ZmFkZS1pbi0wIGRhdGEtb3Blbjp6b29tLWluLTk1IGRhdGEtY2xvc2VkOmFuaW1hdGUtb3V0IGRhdGEtY2xvc2VkOm92ZXJmbG93LWhpZGRlbiBkYXRhLWNsb3NlZDpmYWRlLW91dC0wIGRhdGEtY2xvc2VkOnpvb20tb3V0LTk1XCIsIGNsYXNzTmFtZSApfVxuICAgICAgICAgIHsuLi5wcm9wc31cbiAgICAgICAgLz5cbiAgICAgIDwvTWVudVByaW1pdGl2ZS5Qb3NpdGlvbmVyPlxuICAgIDwvTWVudVByaW1pdGl2ZS5Qb3J0YWw+XG4gIClcbn1cblxuZnVuY3Rpb24gRHJvcGRvd25NZW51R3JvdXAoeyAuLi5wcm9wcyB9OiBNZW51UHJpbWl0aXZlLkdyb3VwLlByb3BzKSB7XG4gIHJldHVybiA8TWVudVByaW1pdGl2ZS5Hcm91cCBkYXRhLXNsb3Q9XCJkcm9wZG93bi1tZW51LWdyb3VwXCIgey4uLnByb3BzfSAvPlxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVMYWJlbCh7XG4gIGNsYXNzTmFtZSxcbiAgaW5zZXQsXG4gIC4uLnByb3BzXG59OiBNZW51UHJpbWl0aXZlLkdyb3VwTGFiZWwuUHJvcHMgJiB7XG4gIGluc2V0PzogYm9vbGVhblxufSkge1xuICByZXR1cm4gKFxuICAgIDxNZW51UHJpbWl0aXZlLkdyb3VwTGFiZWxcbiAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtbGFiZWxcIlxuICAgICAgZGF0YS1pbnNldD17aW5zZXR9XG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcInB4LTEuNSBweS0xIHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGRhdGEtaW5zZXQ6cGwtN1wiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVJdGVtKHtcbiAgY2xhc3NOYW1lLFxuICBpbnNldCxcbiAgdmFyaWFudCA9IFwiZGVmYXVsdFwiLFxuICAuLi5wcm9wc1xufTogTWVudVByaW1pdGl2ZS5JdGVtLlByb3BzICYge1xuICBpbnNldD86IGJvb2xlYW5cbiAgdmFyaWFudD86IFwiZGVmYXVsdFwiIHwgXCJkZXN0cnVjdGl2ZVwiXG59KSB7XG4gIHJldHVybiAoXG4gICAgPE1lbnVQcmltaXRpdmUuSXRlbVxuICAgICAgZGF0YS1zbG90PVwiZHJvcGRvd24tbWVudS1pdGVtXCJcbiAgICAgIGRhdGEtaW5zZXQ9e2luc2V0fVxuICAgICAgZGF0YS12YXJpYW50PXt2YXJpYW50fVxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJncm91cC9kcm9wZG93bi1tZW51LWl0ZW0gcmVsYXRpdmUgZmxleCBjdXJzb3ItZGVmYXVsdCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLW1kIHB4LTEuNSBweS0xIHRleHQtc20gb3V0bGluZS1oaWRkZW4gc2VsZWN0LW5vbmUgZm9jdXM6YmctYWNjZW50IGZvY3VzOnRleHQtYWNjZW50LWZvcmVncm91bmQgbm90LWRhdGEtW3ZhcmlhbnQ9ZGVzdHJ1Y3RpdmVdOmZvY3VzOioqOnRleHQtYWNjZW50LWZvcmVncm91bmQgZGF0YS1pbnNldDpwbC03IGRhdGEtW3ZhcmlhbnQ9ZGVzdHJ1Y3RpdmVdOnRleHQtZGVzdHJ1Y3RpdmUgZGF0YS1bdmFyaWFudD1kZXN0cnVjdGl2ZV06Zm9jdXM6YmctZGVzdHJ1Y3RpdmUvMTAgZGF0YS1bdmFyaWFudD1kZXN0cnVjdGl2ZV06Zm9jdXM6dGV4dC1kZXN0cnVjdGl2ZSBkYXJrOmRhdGEtW3ZhcmlhbnQ9ZGVzdHJ1Y3RpdmVdOmZvY3VzOmJnLWRlc3RydWN0aXZlLzIwIGRhdGEtZGlzYWJsZWQ6cG9pbnRlci1ldmVudHMtbm9uZSBkYXRhLWRpc2FibGVkOm9wYWNpdHktNTAgWyZfc3ZnXTpwb2ludGVyLWV2ZW50cy1ub25lIFsmX3N2Z106c2hyaW5rLTAgWyZfc3ZnOm5vdChbY2xhc3MqPSdzaXplLSddKV06c2l6ZS00IGRhdGEtW3ZhcmlhbnQ9ZGVzdHJ1Y3RpdmVdOio6W3N2Z106dGV4dC1kZXN0cnVjdGl2ZVwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVTdWIoeyAuLi5wcm9wcyB9OiBNZW51UHJpbWl0aXZlLlN1Ym1lbnVSb290LlByb3BzKSB7XG4gIHJldHVybiA8TWVudVByaW1pdGl2ZS5TdWJtZW51Um9vdCBkYXRhLXNsb3Q9XCJkcm9wZG93bi1tZW51LXN1YlwiIHsuLi5wcm9wc30gLz5cbn1cblxuZnVuY3Rpb24gRHJvcGRvd25NZW51U3ViVHJpZ2dlcih7XG4gIGNsYXNzTmFtZSxcbiAgaW5zZXQsXG4gIGNoaWxkcmVuLFxuICAuLi5wcm9wc1xufTogTWVudVByaW1pdGl2ZS5TdWJtZW51VHJpZ2dlci5Qcm9wcyAmIHtcbiAgaW5zZXQ/OiBib29sZWFuXG59KSB7XG4gIHJldHVybiAoXG4gICAgPE1lbnVQcmltaXRpdmUuU3VibWVudVRyaWdnZXJcbiAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtc3ViLXRyaWdnZXJcIlxuICAgICAgZGF0YS1pbnNldD17aW5zZXR9XG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcImZsZXggY3Vyc29yLWRlZmF1bHQgaXRlbXMtY2VudGVyIGdhcC0xLjUgcm91bmRlZC1tZCBweC0xLjUgcHktMSB0ZXh0LXNtIG91dGxpbmUtaGlkZGVuIHNlbGVjdC1ub25lIGZvY3VzOmJnLWFjY2VudCBmb2N1czp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIG5vdC1kYXRhLVt2YXJpYW50PWRlc3RydWN0aXZlXTpmb2N1czoqKjp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIGRhdGEtaW5zZXQ6cGwtNyBkYXRhLXBvcHVwLW9wZW46YmctYWNjZW50IGRhdGEtcG9wdXAtb3Blbjp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIGRhdGEtb3BlbjpiZy1hY2NlbnQgZGF0YS1vcGVuOnRleHQtYWNjZW50LWZvcmVncm91bmQgWyZfc3ZnXTpwb2ludGVyLWV2ZW50cy1ub25lIFsmX3N2Z106c2hyaW5rLTAgWyZfc3ZnOm5vdChbY2xhc3MqPSdzaXplLSddKV06c2l6ZS00XCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICA+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgICA8Q2hldnJvblJpZ2h0SWNvbiBjbGFzc05hbWU9XCJtbC1hdXRvXCIgLz5cbiAgICA8L01lbnVQcmltaXRpdmUuU3VibWVudVRyaWdnZXI+XG4gIClcbn1cblxuZnVuY3Rpb24gRHJvcGRvd25NZW51U3ViQ29udGVudCh7XG4gIGFsaWduID0gXCJzdGFydFwiLFxuICBhbGlnbk9mZnNldCA9IC0zLFxuICBzaWRlID0gXCJyaWdodFwiLFxuICBzaWRlT2Zmc2V0ID0gMCxcbiAgY2xhc3NOYW1lLFxuICAuLi5wcm9wc1xufTogUmVhY3QuQ29tcG9uZW50UHJvcHM8dHlwZW9mIERyb3Bkb3duTWVudUNvbnRlbnQ+KSB7XG4gIHJldHVybiAoXG4gICAgPERyb3Bkb3duTWVudUNvbnRlbnRcbiAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtc3ViLWNvbnRlbnRcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcInctYXV0byBtaW4tdy1bOTZweF0gcm91bmRlZC1sZyBiZy1wb3BvdmVyIHAtMSB0ZXh0LXBvcG92ZXItZm9yZWdyb3VuZCBzaGFkb3ctbGcgcmluZy0xIHJpbmctZm9yZWdyb3VuZC8xMCBkdXJhdGlvbi0xMDAgZGF0YS1bc2lkZT1ib3R0b21dOnNsaWRlLWluLWZyb20tdG9wLTIgZGF0YS1bc2lkZT1sZWZ0XTpzbGlkZS1pbi1mcm9tLXJpZ2h0LTIgZGF0YS1bc2lkZT1yaWdodF06c2xpZGUtaW4tZnJvbS1sZWZ0LTIgZGF0YS1bc2lkZT10b3BdOnNsaWRlLWluLWZyb20tYm90dG9tLTIgZGF0YS1vcGVuOmFuaW1hdGUtaW4gZGF0YS1vcGVuOmZhZGUtaW4tMCBkYXRhLW9wZW46em9vbS1pbi05NSBkYXRhLWNsb3NlZDphbmltYXRlLW91dCBkYXRhLWNsb3NlZDpmYWRlLW91dC0wIGRhdGEtY2xvc2VkOnpvb20tb3V0LTk1XCIsIGNsYXNzTmFtZSApfVxuICAgICAgYWxpZ249e2FsaWdufVxuICAgICAgYWxpZ25PZmZzZXQ9e2FsaWduT2Zmc2V0fVxuICAgICAgc2lkZT17c2lkZX1cbiAgICAgIHNpZGVPZmZzZXQ9e3NpZGVPZmZzZXR9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVDaGVja2JveEl0ZW0oe1xuICBjbGFzc05hbWUsXG4gIGNoaWxkcmVuLFxuICBjaGVja2VkLFxuICBpbnNldCxcbiAgLi4ucHJvcHNcbn06IE1lbnVQcmltaXRpdmUuQ2hlY2tib3hJdGVtLlByb3BzICYge1xuICBpbnNldD86IGJvb2xlYW5cbn0pIHtcbiAgcmV0dXJuIChcbiAgICA8TWVudVByaW1pdGl2ZS5DaGVja2JveEl0ZW1cbiAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtY2hlY2tib3gtaXRlbVwiXG4gICAgICBkYXRhLWluc2V0PXtpbnNldH1cbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwicmVsYXRpdmUgZmxleCBjdXJzb3ItZGVmYXVsdCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLW1kIHB5LTEgcHItOCBwbC0xLjUgdGV4dC1zbSBvdXRsaW5lLWhpZGRlbiBzZWxlY3Qtbm9uZSBmb2N1czpiZy1hY2NlbnQgZm9jdXM6dGV4dC1hY2NlbnQtZm9yZWdyb3VuZCBmb2N1czoqKjp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIGRhdGEtaW5zZXQ6cGwtNyBkYXRhLWRpc2FibGVkOnBvaW50ZXItZXZlbnRzLW5vbmUgZGF0YS1kaXNhYmxlZDpvcGFjaXR5LTUwIFsmX3N2Z106cG9pbnRlci1ldmVudHMtbm9uZSBbJl9zdmddOnNocmluay0wIFsmX3N2Zzpub3QoW2NsYXNzKj0nc2l6ZS0nXSldOnNpemUtNFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICBjaGVja2VkPXtjaGVja2VkfVxuICAgICAgey4uLnByb3BzfVxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIGNsYXNzTmFtZT1cInBvaW50ZXItZXZlbnRzLW5vbmUgYWJzb2x1dGUgcmlnaHQtMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiXG4gICAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtY2hlY2tib3gtaXRlbS1pbmRpY2F0b3JcIlxuICAgICAgPlxuICAgICAgICA8TWVudVByaW1pdGl2ZS5DaGVja2JveEl0ZW1JbmRpY2F0b3I+XG4gICAgICAgICAgPENoZWNrSWNvblxuICAgICAgICAgIC8+XG4gICAgICAgIDwvTWVudVByaW1pdGl2ZS5DaGVja2JveEl0ZW1JbmRpY2F0b3I+XG4gICAgICA8L3NwYW4+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9NZW51UHJpbWl0aXZlLkNoZWNrYm94SXRlbT5cbiAgKVxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVSYWRpb0dyb3VwKHsgLi4ucHJvcHMgfTogTWVudVByaW1pdGl2ZS5SYWRpb0dyb3VwLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPE1lbnVQcmltaXRpdmUuUmFkaW9Hcm91cFxuICAgICAgZGF0YS1zbG90PVwiZHJvcGRvd24tbWVudS1yYWRpby1ncm91cFwiXG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBEcm9wZG93bk1lbnVSYWRpb0l0ZW0oe1xuICBjbGFzc05hbWUsXG4gIGNoaWxkcmVuLFxuICBpbnNldCxcbiAgLi4ucHJvcHNcbn06IE1lbnVQcmltaXRpdmUuUmFkaW9JdGVtLlByb3BzICYge1xuICBpbnNldD86IGJvb2xlYW5cbn0pIHtcbiAgcmV0dXJuIChcbiAgICA8TWVudVByaW1pdGl2ZS5SYWRpb0l0ZW1cbiAgICAgIGRhdGEtc2xvdD1cImRyb3Bkb3duLW1lbnUtcmFkaW8taXRlbVwiXG4gICAgICBkYXRhLWluc2V0PXtpbnNldH1cbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwicmVsYXRpdmUgZmxleCBjdXJzb3ItZGVmYXVsdCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLW1kIHB5LTEgcHItOCBwbC0xLjUgdGV4dC1zbSBvdXRsaW5lLWhpZGRlbiBzZWxlY3Qtbm9uZSBmb2N1czpiZy1hY2NlbnQgZm9jdXM6dGV4dC1hY2NlbnQtZm9yZWdyb3VuZCBmb2N1czoqKjp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kIGRhdGEtaW5zZXQ6cGwtNyBkYXRhLWRpc2FibGVkOnBvaW50ZXItZXZlbnRzLW5vbmUgZGF0YS1kaXNhYmxlZDpvcGFjaXR5LTUwIFsmX3N2Z106cG9pbnRlci1ldmVudHMtbm9uZSBbJl9zdmddOnNocmluay0wIFsmX3N2Zzpub3QoW2NsYXNzKj0nc2l6ZS0nXSldOnNpemUtNFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBhYnNvbHV0ZSByaWdodC0yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCJcbiAgICAgICAgZGF0YS1zbG90PVwiZHJvcGRvd24tbWVudS1yYWRpby1pdGVtLWluZGljYXRvclwiXG4gICAgICA+XG4gICAgICAgIDxNZW51UHJpbWl0aXZlLlJhZGlvSXRlbUluZGljYXRvcj5cbiAgICAgICAgICA8Q2hlY2tJY29uXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9NZW51UHJpbWl0aXZlLlJhZGlvSXRlbUluZGljYXRvcj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L01lbnVQcmltaXRpdmUuUmFkaW9JdGVtPlxuICApXG59XG5cbmZ1bmN0aW9uIERyb3Bkb3duTWVudVNlcGFyYXRvcih7XG4gIGNsYXNzTmFtZSxcbiAgLi4ucHJvcHNcbn06IE1lbnVQcmltaXRpdmUuU2VwYXJhdG9yLlByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPE1lbnVQcmltaXRpdmUuU2VwYXJhdG9yXG4gICAgICBkYXRhLXNsb3Q9XCJkcm9wZG93bi1tZW51LXNlcGFyYXRvclwiXG4gICAgICBjbGFzc05hbWU9e2NuKFwiLW14LTEgbXktMSBoLXB4IGJnLWJvcmRlclwiLCBjbGFzc05hbWUpfVxuICAgICAgey4uLnByb3BzfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gRHJvcGRvd25NZW51U2hvcnRjdXQoe1xuICBjbGFzc05hbWUsXG4gIC4uLnByb3BzXG59OiBSZWFjdC5Db21wb25lbnRQcm9wczxcInNwYW5cIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgZGF0YS1zbG90PVwiZHJvcGRvd24tbWVudS1zaG9ydGN1dFwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcIm1sLWF1dG8gdGV4dC14cyB0cmFja2luZy13aWRlc3QgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGdyb3VwLWZvY3VzL2Ryb3Bkb3duLW1lbnUtaXRlbTp0ZXh0LWFjY2VudC1mb3JlZ3JvdW5kXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCB7XG4gIERyb3Bkb3duTWVudSxcbiAgRHJvcGRvd25NZW51UG9ydGFsLFxuICBEcm9wZG93bk1lbnVUcmlnZ2VyLFxuICBEcm9wZG93bk1lbnVDb250ZW50LFxuICBEcm9wZG93bk1lbnVHcm91cCxcbiAgRHJvcGRvd25NZW51TGFiZWwsXG4gIERyb3Bkb3duTWVudUl0ZW0sXG4gIERyb3Bkb3duTWVudUNoZWNrYm94SXRlbSxcbiAgRHJvcGRvd25NZW51UmFkaW9Hcm91cCxcbiAgRHJvcGRvd25NZW51UmFkaW9JdGVtLFxuICBEcm9wZG93bk1lbnVTZXBhcmF0b3IsXG4gIERyb3Bkb3duTWVudVNob3J0Y3V0LFxuICBEcm9wZG93bk1lbnVTdWIsXG4gIERyb3Bkb3duTWVudVN1YlRyaWdnZXIsXG4gIERyb3Bkb3duTWVudVN1YkNvbnRlbnQsXG59XG4iXX0=