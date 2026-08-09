import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/badge.tsx");/* eslint-disable react-refresh/only-export-components */
import { mergeProps } from "/node_modules/.vite/deps/@base-ui_react_merge-props.js?v=1d2f6f90";
import { useRender } from "/node_modules/.vite/deps/@base-ui_react_use-render.js?v=1d2f6f90";
import { cva } from "/node_modules/.vite/deps/class-variance-authority.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _s = $RefreshSig$();
const badgeVariants = cva("group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!", {
	variants: { variant: {
		default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
		secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
		destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
		outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
		ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
		link: "text-primary underline-offset-4 hover:underline"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant = "default", render, ...props }) {
	_s();
	return useRender({
		defaultTagName: "span",
		props: mergeProps({ className: cn(badgeVariants({ variant }), className) }, props),
		render,
		state: {
			slot: "badge",
			variant
		}
	});
}
_s(Badge, "Yxn2JZFvED13KkqGsiyGOoQOkjM=", false, function() {
	return [useRender];
});
_c = Badge;
export { Badge, badgeVariants };
var _c;
$RefreshReg$(_c, "Badge");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/badge.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/badge.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/badge.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/badge.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IjtBQUNBLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsV0FBOEI7QUFFdkMsU0FBUyxVQUFVOztBQUVuQixNQUFNLGdCQUFnQixJQUNwQiw4ZUFDQTtDQUNFLFVBQVUsRUFDUixTQUFTO0VBQ1AsU0FBUztFQUNULFdBQ0U7RUFDRixhQUNFO0VBQ0YsU0FDRTtFQUNGLE9BQ0U7RUFDRixNQUFNO0NBQ1IsRUFDRjtDQUNBLGlCQUFpQixFQUNmLFNBQVMsVUFDWDtBQUNGLENBQ0Y7QUFFQSxTQUFTLE1BQU0sRUFDYixXQUNBLFVBQVUsV0FDVixRQUNBLEdBQUcsU0FDcUU7O0NBQ3hFLE9BQU8sVUFBVTtFQUNmLGdCQUFnQjtFQUNoQixPQUFPLFdBQ0wsRUFDRSxXQUFXLEdBQUcsY0FBYyxFQUFFLFFBQVEsQ0FBQyxHQUFHLFNBQVMsRUFDckQsR0FDQSxLQUNGO0VBQ0E7RUFDQSxPQUFPO0dBQ0wsTUFBTTtHQUNOO0VBQ0Y7Q0FDRixDQUFDO0FBQ0g7Ozs7O0FBRUEsU0FBUyxPQUFPIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbImJhZGdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSByZWFjdC1yZWZyZXNoL29ubHktZXhwb3J0LWNvbXBvbmVudHMgKi9cbmltcG9ydCB7IG1lcmdlUHJvcHMgfSBmcm9tIFwiQGJhc2UtdWkvcmVhY3QvbWVyZ2UtcHJvcHNcIlxuaW1wb3J0IHsgdXNlUmVuZGVyIH0gZnJvbSBcIkBiYXNlLXVpL3JlYWN0L3VzZS1yZW5kZXJcIlxuaW1wb3J0IHsgY3ZhLCB0eXBlIFZhcmlhbnRQcm9wcyB9IGZyb20gXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIlxuXG5pbXBvcnQgeyBjbiB9IGZyb20gXCJAL2xpYi91dGlsc1wiXG5cbmNvbnN0IGJhZGdlVmFyaWFudHMgPSBjdmEoXG4gIFwiZ3JvdXAvYmFkZ2UgaW5saW5lLWZsZXggaC01IHctZml0IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC00eGwgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBweC0yIHB5LTAuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtIHdoaXRlc3BhY2Utbm93cmFwIHRyYW5zaXRpb24tYWxsIGZvY3VzLXZpc2libGU6Ym9yZGVyLXJpbmcgZm9jdXMtdmlzaWJsZTpyaW5nLVszcHhdIGZvY3VzLXZpc2libGU6cmluZy1yaW5nLzUwIGhhcy1kYXRhLVtpY29uPWlubGluZS1lbmRdOnByLTEuNSBoYXMtZGF0YS1baWNvbj1pbmxpbmUtc3RhcnRdOnBsLTEuNSBhcmlhLWludmFsaWQ6Ym9yZGVyLWRlc3RydWN0aXZlIGFyaWEtaW52YWxpZDpyaW5nLWRlc3RydWN0aXZlLzIwIGRhcms6YXJpYS1pbnZhbGlkOnJpbmctZGVzdHJ1Y3RpdmUvNDAgWyY+c3ZnXTpwb2ludGVyLWV2ZW50cy1ub25lIFsmPnN2Z106c2l6ZS0zIVwiLFxuICB7XG4gICAgdmFyaWFudHM6IHtcbiAgICAgIHZhcmlhbnQ6IHtcbiAgICAgICAgZGVmYXVsdDogXCJiZy1wcmltYXJ5IHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIFthXTpob3ZlcjpiZy1wcmltYXJ5LzgwXCIsXG4gICAgICAgIHNlY29uZGFyeTpcbiAgICAgICAgICBcImJnLXNlY29uZGFyeSB0ZXh0LXNlY29uZGFyeS1mb3JlZ3JvdW5kIFthXTpob3ZlcjpiZy1zZWNvbmRhcnkvODBcIixcbiAgICAgICAgZGVzdHJ1Y3RpdmU6XG4gICAgICAgICAgXCJiZy1kZXN0cnVjdGl2ZS8xMCB0ZXh0LWRlc3RydWN0aXZlIGZvY3VzLXZpc2libGU6cmluZy1kZXN0cnVjdGl2ZS8yMCBkYXJrOmJnLWRlc3RydWN0aXZlLzIwIGRhcms6Zm9jdXMtdmlzaWJsZTpyaW5nLWRlc3RydWN0aXZlLzQwIFthXTpob3ZlcjpiZy1kZXN0cnVjdGl2ZS8yMFwiLFxuICAgICAgICBvdXRsaW5lOlxuICAgICAgICAgIFwiYm9yZGVyLWJvcmRlciB0ZXh0LWZvcmVncm91bmQgW2FdOmhvdmVyOmJnLW11dGVkIFthXTpob3Zlcjp0ZXh0LW11dGVkLWZvcmVncm91bmRcIixcbiAgICAgICAgZ2hvc3Q6XG4gICAgICAgICAgXCJob3ZlcjpiZy1tdXRlZCBob3Zlcjp0ZXh0LW11dGVkLWZvcmVncm91bmQgZGFyazpob3ZlcjpiZy1tdXRlZC81MFwiLFxuICAgICAgICBsaW5rOiBcInRleHQtcHJpbWFyeSB1bmRlcmxpbmUtb2Zmc2V0LTQgaG92ZXI6dW5kZXJsaW5lXCIsXG4gICAgICB9LFxuICAgIH0sXG4gICAgZGVmYXVsdFZhcmlhbnRzOiB7XG4gICAgICB2YXJpYW50OiBcImRlZmF1bHRcIixcbiAgICB9LFxuICB9XG4pXG5cbmZ1bmN0aW9uIEJhZGdlKHtcbiAgY2xhc3NOYW1lLFxuICB2YXJpYW50ID0gXCJkZWZhdWx0XCIsXG4gIHJlbmRlcixcbiAgLi4ucHJvcHNcbn06IHVzZVJlbmRlci5Db21wb25lbnRQcm9wczxcInNwYW5cIj4gJiBWYXJpYW50UHJvcHM8dHlwZW9mIGJhZGdlVmFyaWFudHM+KSB7XG4gIHJldHVybiB1c2VSZW5kZXIoe1xuICAgIGRlZmF1bHRUYWdOYW1lOiBcInNwYW5cIixcbiAgICBwcm9wczogbWVyZ2VQcm9wczxcInNwYW5cIj4oXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogY24oYmFkZ2VWYXJpYW50cyh7IHZhcmlhbnQgfSksIGNsYXNzTmFtZSksXG4gICAgICB9LFxuICAgICAgcHJvcHNcbiAgICApLFxuICAgIHJlbmRlcixcbiAgICBzdGF0ZToge1xuICAgICAgc2xvdDogXCJiYWRnZVwiLFxuICAgICAgdmFyaWFudCxcbiAgICB9LFxuICB9KVxufVxuXG5leHBvcnQgeyBCYWRnZSwgYmFkZ2VWYXJpYW50cyB9XG4iXX0=