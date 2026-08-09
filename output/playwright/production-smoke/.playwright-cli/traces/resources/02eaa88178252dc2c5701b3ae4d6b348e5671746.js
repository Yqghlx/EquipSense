import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/button.tsx");const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];/* eslint-disable react-refresh/only-export-components */
import { Button as ButtonPrimitive } from "/node_modules/.vite/deps/@base-ui_react_button.js?v=1d2f6f90";
import { cva } from "/node_modules/.vite/deps/class-variance-authority.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/button.tsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
const buttonVariants = cva("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant = "default", size = "default", ...props }) {
	return /* @__PURE__ */ _jsxDEV(ButtonPrimitive, {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 51,
		columnNumber: 5
	}, this);
}
_c = Button;
export { Button, buttonVariants };
var _c;
$RefreshReg$(_c, "Button");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/button.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/button.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/button.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/button.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IjtBQUNBLFNBQVMsVUFBVSx1QkFBdUI7QUFDMUMsU0FBUyxXQUE4QjtBQUV2QyxTQUFTLFVBQVU7OztBQUVuQixNQUFNLGlCQUFpQixJQUNyQiw4bEJBQ0E7Q0FDRSxVQUFVO0VBQ1IsU0FBUztHQUNQLFNBQVM7R0FDVCxTQUNFO0dBQ0YsV0FDRTtHQUNGLE9BQ0U7R0FDRixhQUNFO0dBQ0YsTUFBTTtFQUNSO0VBQ0EsTUFBTTtHQUNKLFNBQ0U7R0FDRixJQUFJO0dBQ0osSUFBSTtHQUNKLElBQUk7R0FDSixNQUFNO0dBQ04sV0FDRTtHQUNGLFdBQ0U7R0FDRixXQUFXO0VBQ2I7Q0FDRjtDQUNBLGlCQUFpQjtFQUNmLFNBQVM7RUFDVCxNQUFNO0NBQ1I7QUFDRixDQUNGO0FBRUEsU0FBUyxPQUFPLEVBQ2QsV0FDQSxVQUFVLFdBQ1YsT0FBTyxXQUNQLEdBQUcsU0FDMkQ7Q0FDOUQsT0FDRSx3QkFBQyxpQkFBRDtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQUcsZUFBZTtHQUFFO0dBQVM7R0FBTTtFQUFVLENBQUMsQ0FBQztFQUMxRCxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxRQUFRIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbImJ1dHRvbi50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcmVhY3QtcmVmcmVzaC9vbmx5LWV4cG9ydC1jb21wb25lbnRzICovXG5pbXBvcnQgeyBCdXR0b24gYXMgQnV0dG9uUHJpbWl0aXZlIH0gZnJvbSBcIkBiYXNlLXVpL3JlYWN0L2J1dHRvblwiXG5pbXBvcnQgeyBjdmEsIHR5cGUgVmFyaWFudFByb3BzIH0gZnJvbSBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcblxuY29uc3QgYnV0dG9uVmFyaWFudHMgPSBjdmEoXG4gIFwiZ3JvdXAvYnV0dG9uIGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgYmctY2xpcC1wYWRkaW5nIHRleHQtc20gZm9udC1tZWRpdW0gd2hpdGVzcGFjZS1ub3dyYXAgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIHNlbGVjdC1ub25lIGZvY3VzLXZpc2libGU6Ym9yZGVyLXJpbmcgZm9jdXMtdmlzaWJsZTpyaW5nLTMgZm9jdXMtdmlzaWJsZTpyaW5nLXJpbmcvNTAgYWN0aXZlOm5vdC1hcmlhLVtoYXNwb3B1cF06dHJhbnNsYXRlLXktcHggZGlzYWJsZWQ6cG9pbnRlci1ldmVudHMtbm9uZSBkaXNhYmxlZDpvcGFjaXR5LTUwIGFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUgYXJpYS1pbnZhbGlkOnJpbmctMyBhcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS8yMCBkYXJrOmFyaWEtaW52YWxpZDpib3JkZXItZGVzdHJ1Y3RpdmUvNTAgZGFyazphcmlhLWludmFsaWQ6cmluZy1kZXN0cnVjdGl2ZS80MCBbJl9zdmddOnBvaW50ZXItZXZlbnRzLW5vbmUgWyZfc3ZnXTpzaHJpbmstMCBbJl9zdmc6bm90KFtjbGFzcyo9J3NpemUtJ10pXTpzaXplLTRcIixcbiAge1xuICAgIHZhcmlhbnRzOiB7XG4gICAgICB2YXJpYW50OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiYmctcHJpbWFyeSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCBob3ZlcjpiZy1wcmltYXJ5LzgwXCIsXG4gICAgICAgIG91dGxpbmU6XG4gICAgICAgICAgXCJib3JkZXItYm9yZGVyIGJnLWJhY2tncm91bmQgaG92ZXI6YmctbXV0ZWQgaG92ZXI6dGV4dC1mb3JlZ3JvdW5kIGFyaWEtZXhwYW5kZWQ6YmctbXV0ZWQgYXJpYS1leHBhbmRlZDp0ZXh0LWZvcmVncm91bmQgZGFyazpib3JkZXItaW5wdXQgZGFyazpiZy1pbnB1dC8zMCBkYXJrOmhvdmVyOmJnLWlucHV0LzUwXCIsXG4gICAgICAgIHNlY29uZGFyeTpcbiAgICAgICAgICBcImJnLXNlY29uZGFyeSB0ZXh0LXNlY29uZGFyeS1mb3JlZ3JvdW5kIGhvdmVyOmJnLVtjb2xvci1taXgoaW5fb2tsY2gsdmFyKC0tc2Vjb25kYXJ5KSx2YXIoLS1mb3JlZ3JvdW5kKV81JSldIGFyaWEtZXhwYW5kZWQ6Ymctc2Vjb25kYXJ5IGFyaWEtZXhwYW5kZWQ6dGV4dC1zZWNvbmRhcnktZm9yZWdyb3VuZFwiLFxuICAgICAgICBnaG9zdDpcbiAgICAgICAgICBcImhvdmVyOmJnLW11dGVkIGhvdmVyOnRleHQtZm9yZWdyb3VuZCBhcmlhLWV4cGFuZGVkOmJnLW11dGVkIGFyaWEtZXhwYW5kZWQ6dGV4dC1mb3JlZ3JvdW5kIGRhcms6aG92ZXI6YmctbXV0ZWQvNTBcIixcbiAgICAgICAgZGVzdHJ1Y3RpdmU6XG4gICAgICAgICAgXCJiZy1kZXN0cnVjdGl2ZS8xMCB0ZXh0LWRlc3RydWN0aXZlIGhvdmVyOmJnLWRlc3RydWN0aXZlLzIwIGZvY3VzLXZpc2libGU6Ym9yZGVyLWRlc3RydWN0aXZlLzQwIGZvY3VzLXZpc2libGU6cmluZy1kZXN0cnVjdGl2ZS8yMCBkYXJrOmJnLWRlc3RydWN0aXZlLzIwIGRhcms6aG92ZXI6YmctZGVzdHJ1Y3RpdmUvMzAgZGFyazpmb2N1cy12aXNpYmxlOnJpbmctZGVzdHJ1Y3RpdmUvNDBcIixcbiAgICAgICAgbGluazogXCJ0ZXh0LXByaW1hcnkgdW5kZXJsaW5lLW9mZnNldC00IGhvdmVyOnVuZGVybGluZVwiLFxuICAgICAgfSxcbiAgICAgIHNpemU6IHtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBcImgtOCBnYXAtMS41IHB4LTIuNSBoYXMtZGF0YS1baWNvbj1pbmxpbmUtZW5kXTpwci0yIGhhcy1kYXRhLVtpY29uPWlubGluZS1zdGFydF06cGwtMlwiLFxuICAgICAgICB4czogXCJoLTYgZ2FwLTEgcm91bmRlZC1bbWluKHZhcigtLXJhZGl1cy1tZCksMTBweCldIHB4LTIgdGV4dC14cyBpbi1kYXRhLVtzbG90PWJ1dHRvbi1ncm91cF06cm91bmRlZC1sZyBoYXMtZGF0YS1baWNvbj1pbmxpbmUtZW5kXTpwci0xLjUgaGFzLWRhdGEtW2ljb249aW5saW5lLXN0YXJ0XTpwbC0xLjUgWyZfc3ZnOm5vdChbY2xhc3MqPSdzaXplLSddKV06c2l6ZS0zXCIsXG4gICAgICAgIHNtOiBcImgtNyBnYXAtMSByb3VuZGVkLVttaW4odmFyKC0tcmFkaXVzLW1kKSwxMnB4KV0gcHgtMi41IHRleHQtWzAuOHJlbV0gaW4tZGF0YS1bc2xvdD1idXR0b24tZ3JvdXBdOnJvdW5kZWQtbGcgaGFzLWRhdGEtW2ljb249aW5saW5lLWVuZF06cHItMS41IGhhcy1kYXRhLVtpY29uPWlubGluZS1zdGFydF06cGwtMS41IFsmX3N2Zzpub3QoW2NsYXNzKj0nc2l6ZS0nXSldOnNpemUtMy41XCIsXG4gICAgICAgIGxnOiBcImgtOSBnYXAtMS41IHB4LTIuNSBoYXMtZGF0YS1baWNvbj1pbmxpbmUtZW5kXTpwci0yIGhhcy1kYXRhLVtpY29uPWlubGluZS1zdGFydF06cGwtMlwiLFxuICAgICAgICBpY29uOiBcInNpemUtOFwiLFxuICAgICAgICBcImljb24teHNcIjpcbiAgICAgICAgICBcInNpemUtNiByb3VuZGVkLVttaW4odmFyKC0tcmFkaXVzLW1kKSwxMHB4KV0gaW4tZGF0YS1bc2xvdD1idXR0b24tZ3JvdXBdOnJvdW5kZWQtbGcgWyZfc3ZnOm5vdChbY2xhc3MqPSdzaXplLSddKV06c2l6ZS0zXCIsXG4gICAgICAgIFwiaWNvbi1zbVwiOlxuICAgICAgICAgIFwic2l6ZS03IHJvdW5kZWQtW21pbih2YXIoLS1yYWRpdXMtbWQpLDEycHgpXSBpbi1kYXRhLVtzbG90PWJ1dHRvbi1ncm91cF06cm91bmRlZC1sZ1wiLFxuICAgICAgICBcImljb24tbGdcIjogXCJzaXplLTlcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZhdWx0VmFyaWFudHM6IHtcbiAgICAgIHZhcmlhbnQ6IFwiZGVmYXVsdFwiLFxuICAgICAgc2l6ZTogXCJkZWZhdWx0XCIsXG4gICAgfSxcbiAgfVxuKVxuXG5mdW5jdGlvbiBCdXR0b24oe1xuICBjbGFzc05hbWUsXG4gIHZhcmlhbnQgPSBcImRlZmF1bHRcIixcbiAgc2l6ZSA9IFwiZGVmYXVsdFwiLFxuICAuLi5wcm9wc1xufTogQnV0dG9uUHJpbWl0aXZlLlByb3BzICYgVmFyaWFudFByb3BzPHR5cGVvZiBidXR0b25WYXJpYW50cz4pIHtcbiAgcmV0dXJuIChcbiAgICA8QnV0dG9uUHJpbWl0aXZlXG4gICAgICBkYXRhLXNsb3Q9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPXtjbihidXR0b25WYXJpYW50cyh7IHZhcmlhbnQsIHNpemUsIGNsYXNzTmFtZSB9KSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5leHBvcnQgeyBCdXR0b24sIGJ1dHRvblZhcmlhbnRzIH1cbiJdfQ==