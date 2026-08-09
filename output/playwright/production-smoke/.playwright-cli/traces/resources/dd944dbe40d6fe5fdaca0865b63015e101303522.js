import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/ui/table.tsx");const React = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { cn } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/table.tsx";
import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
function Table({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("div", {
		"data-slot": "table-container",
		className: "relative w-full overflow-x-auto",
		children: /* @__PURE__ */ _jsxDEV("table", {
			"data-slot": "table",
			className: cn("w-full caption-bottom text-sm", className),
			...props
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 11,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 7,
		columnNumber: 5
	}, this);
}
_c = Table;
function TableHeader({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("thead", {
		"data-slot": "table-header",
		className: cn("[&_tr]:border-b", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 22,
		columnNumber: 5
	}, this);
}
_c2 = TableHeader;
function TableBody({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("tbody", {
		"data-slot": "table-body",
		className: cn("[&_tr:last-child]:border-0", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 32,
		columnNumber: 5
	}, this);
}
_c3 = TableBody;
function TableFooter({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("tfoot", {
		"data-slot": "table-footer",
		className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 42,
		columnNumber: 5
	}, this);
}
_c4 = TableFooter;
function TableRow({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("tr", {
		"data-slot": "table-row",
		className: cn("border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 55,
		columnNumber: 5
	}, this);
}
_c5 = TableRow;
function TableHead({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("th", {
		"data-slot": "table-head",
		className: cn("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 68,
		columnNumber: 5
	}, this);
}
_c6 = TableHead;
function TableCell({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("td", {
		"data-slot": "table-cell",
		className: cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 81,
		columnNumber: 5
	}, this);
}
_c7 = TableCell;
function TableCaption({ className, ...props }) {
	return /* @__PURE__ */ _jsxDEV("caption", {
		"data-slot": "table-caption",
		className: cn("mt-4 text-sm text-muted-foreground", className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 97,
		columnNumber: 5
	}, this);
}
_c8 = TableCaption;
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
$RefreshReg$(_c, "Table");
$RefreshReg$(_c2, "TableHeader");
$RefreshReg$(_c3, "TableBody");
$RefreshReg$(_c4, "TableFooter");
$RefreshReg$(_c5, "TableRow");
$RefreshReg$(_c6, "TableHead");
$RefreshReg$(_c7, "TableCell");
$RefreshReg$(_c8, "TableCaption");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/ui/table.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/table.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/table.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/ui/table.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsWUFBWSxXQUFXO0FBRXZCLFNBQVMsVUFBVTs7O0FBRW5CLFNBQVMsTUFBTSxFQUFFLFdBQVcsR0FBRyxTQUF3QztDQUNyRSxPQUNFLHdCQUFDLE9BQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVTtZQUVWLHdCQUFDLFNBQUQ7R0FDRSxhQUFVO0dBQ1YsV0FBVyxHQUFHLGlDQUFpQyxTQUFTO0dBQ3hELEdBQUk7RUFDTDs7Ozs7Q0FDRTs7Ozs7QUFFVDs7QUFFQSxTQUFTLFlBQVksRUFBRSxXQUFXLEdBQUcsU0FBd0M7Q0FDM0UsT0FDRSx3QkFBQyxTQUFEO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FBRyxtQkFBbUIsU0FBUztFQUMxQyxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxVQUFVLEVBQUUsV0FBVyxHQUFHLFNBQXdDO0NBQ3pFLE9BQ0Usd0JBQUMsU0FBRDtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQUcsOEJBQThCLFNBQVM7RUFDckQsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLFNBQVMsWUFBWSxFQUFFLFdBQVcsR0FBRyxTQUF3QztDQUMzRSxPQUNFLHdCQUFDLFNBQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUNULDJEQUNBLFNBQ0Y7RUFDQSxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxTQUFTLEVBQUUsV0FBVyxHQUFHLFNBQXFDO0NBQ3JFLE9BQ0Usd0JBQUMsTUFBRDtFQUNFLGFBQVU7RUFDVixXQUFXLEdBQ1QsNkdBQ0EsU0FDRjtFQUNBLEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUFTLFVBQVUsRUFBRSxXQUFXLEdBQUcsU0FBcUM7Q0FDdEUsT0FDRSx3QkFBQyxNQUFEO0VBQ0UsYUFBVTtFQUNWLFdBQVcsR0FDVCxnSEFDQSxTQUNGO0VBQ0EsR0FBSTtDQUNMOzs7OztBQUVMOztBQUVBLFNBQVMsVUFBVSxFQUFFLFdBQVcsR0FBRyxTQUFxQztDQUN0RSxPQUNFLHdCQUFDLE1BQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUNULG9FQUNBLFNBQ0Y7RUFDQSxHQUFJO0NBQ0w7Ozs7O0FBRUw7O0FBRUEsU0FBUyxhQUFhLEVBQ3BCLFdBQ0EsR0FBRyxTQUMrQjtDQUNsQyxPQUNFLHdCQUFDLFdBQUQ7RUFDRSxhQUFVO0VBQ1YsV0FBVyxHQUFHLHNDQUFzQyxTQUFTO0VBQzdELEdBQUk7Q0FDTDs7Ozs7QUFFTDs7QUFFQSxTQUNFLE9BQ0EsYUFDQSxXQUNBLGFBQ0EsV0FDQSxVQUNBLFdBQ0EiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsidGFibGUudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5cbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCJcblxuZnVuY3Rpb24gVGFibGUoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwidGFibGVcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBkYXRhLXNsb3Q9XCJ0YWJsZS1jb250YWluZXJcIlxuICAgICAgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIG92ZXJmbG93LXgtYXV0b1wiXG4gICAgPlxuICAgICAgPHRhYmxlXG4gICAgICAgIGRhdGEtc2xvdD1cInRhYmxlXCJcbiAgICAgICAgY2xhc3NOYW1lPXtjbihcInctZnVsbCBjYXB0aW9uLWJvdHRvbSB0ZXh0LXNtXCIsIGNsYXNzTmFtZSl9XG4gICAgICAgIHsuLi5wcm9wc31cbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gVGFibGVIZWFkZXIoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwidGhlYWRcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8dGhlYWRcbiAgICAgIGRhdGEtc2xvdD1cInRhYmxlLWhlYWRlclwiXG4gICAgICBjbGFzc05hbWU9e2NuKFwiWyZfdHJdOmJvcmRlci1iXCIsIGNsYXNzTmFtZSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBUYWJsZUJvZHkoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwidGJvZHlcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8dGJvZHlcbiAgICAgIGRhdGEtc2xvdD1cInRhYmxlLWJvZHlcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcIlsmX3RyOmxhc3QtY2hpbGRdOmJvcmRlci0wXCIsIGNsYXNzTmFtZSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBUYWJsZUZvb3Rlcih7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogUmVhY3QuQ29tcG9uZW50UHJvcHM8XCJ0Zm9vdFwiPikge1xuICByZXR1cm4gKFxuICAgIDx0Zm9vdFxuICAgICAgZGF0YS1zbG90PVwidGFibGUtZm9vdGVyXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiYm9yZGVyLXQgYmctbXV0ZWQvNTAgZm9udC1tZWRpdW0gWyY+dHJdOmxhc3Q6Ym9yZGVyLWItMFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBUYWJsZVJvdyh7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogUmVhY3QuQ29tcG9uZW50UHJvcHM8XCJ0clwiPikge1xuICByZXR1cm4gKFxuICAgIDx0clxuICAgICAgZGF0YS1zbG90PVwidGFibGUtcm93XCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgIFwiYm9yZGVyLWIgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6YmctbXV0ZWQvNTAgaGFzLWFyaWEtZXhwYW5kZWQ6YmctbXV0ZWQvNTAgZGF0YS1bc3RhdGU9c2VsZWN0ZWRdOmJnLW11dGVkXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIFRhYmxlSGVhZCh7IGNsYXNzTmFtZSwgLi4ucHJvcHMgfTogUmVhY3QuQ29tcG9uZW50UHJvcHM8XCJ0aFwiPikge1xuICByZXR1cm4gKFxuICAgIDx0aFxuICAgICAgZGF0YS1zbG90PVwidGFibGUtaGVhZFwiXG4gICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICBcImgtMTAgcHgtMiB0ZXh0LWxlZnQgYWxpZ24tbWlkZGxlIGZvbnQtbWVkaXVtIHdoaXRlc3BhY2Utbm93cmFwIHRleHQtZm9yZWdyb3VuZCBbJjpoYXMoW3JvbGU9Y2hlY2tib3hdKV06cHItMFwiLFxuICAgICAgICBjbGFzc05hbWVcbiAgICAgICl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBUYWJsZUNlbGwoeyBjbGFzc05hbWUsIC4uLnByb3BzIH06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwidGRcIj4pIHtcbiAgcmV0dXJuIChcbiAgICA8dGRcbiAgICAgIGRhdGEtc2xvdD1cInRhYmxlLWNlbGxcIlxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgXCJwLTIgYWxpZ24tbWlkZGxlIHdoaXRlc3BhY2Utbm93cmFwIFsmOmhhcyhbcm9sZT1jaGVja2JveF0pXTpwci0wXCIsXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgKX1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApXG59XG5cbmZ1bmN0aW9uIFRhYmxlQ2FwdGlvbih7XG4gIGNsYXNzTmFtZSxcbiAgLi4ucHJvcHNcbn06IFJlYWN0LkNvbXBvbmVudFByb3BzPFwiY2FwdGlvblwiPikge1xuICByZXR1cm4gKFxuICAgIDxjYXB0aW9uXG4gICAgICBkYXRhLXNsb3Q9XCJ0YWJsZS1jYXB0aW9uXCJcbiAgICAgIGNsYXNzTmFtZT17Y24oXCJtdC00IHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIsIGNsYXNzTmFtZSl9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKVxufVxuXG5leHBvcnQge1xuICBUYWJsZSxcbiAgVGFibGVIZWFkZXIsXG4gIFRhYmxlQm9keSxcbiAgVGFibGVGb290ZXIsXG4gIFRhYmxlSGVhZCxcbiAgVGFibGVSb3csXG4gIFRhYmxlQ2VsbCxcbiAgVGFibGVDYXB0aW9uLFxufVxuIl19