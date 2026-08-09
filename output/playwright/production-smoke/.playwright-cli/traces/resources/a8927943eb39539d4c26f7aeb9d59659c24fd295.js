import { i as __toESM } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { r as useStableCallback, t as useIsoLayoutEffect } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
//#region node_modules/@base-ui/utils/esm/visuallyHidden.js
var visuallyHiddenBase = {
	clipPath: "inset(50%)",
	overflow: "hidden",
	whiteSpace: "nowrap",
	border: 0,
	padding: 0,
	width: 1,
	height: 1,
	margin: -1
};
var visuallyHidden = {
	...visuallyHiddenBase,
	position: "fixed",
	top: 0,
	left: 0
};
var visuallyHiddenInput = {
	...visuallyHiddenBase,
	position: "absolute"
};
//#endregion
//#region node_modules/@base-ui/react/esm/internals/useValueChanged.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useValueChanged(value, onChange) {
	const valueRef = import_react.useRef(value);
	const onChangeCallback = useStableCallback(onChange);
	useIsoLayoutEffect(() => {
		if (valueRef.current === value) return;
		onChangeCallback(valueRef.current);
	}, [value, onChangeCallback]);
	useIsoLayoutEffect(() => {
		valueRef.current = value;
	}, [value]);
}
//#endregion
export { visuallyHidden as n, visuallyHiddenInput as r, useValueChanged as t };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlVmFsdWVDaGFuZ2VkLUJ2Q3FCbnN1LmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS92aXN1YWxseUhpZGRlbi5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvdXNlVmFsdWVDaGFuZ2VkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHZpc3VhbGx5SGlkZGVuQmFzZSA9IHtcbiAgY2xpcFBhdGg6ICdpbnNldCg1MCUpJyxcbiAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgYm9yZGVyOiAwLFxuICBwYWRkaW5nOiAwLFxuICB3aWR0aDogMSxcbiAgaGVpZ2h0OiAxLFxuICBtYXJnaW46IC0xXG59O1xuZXhwb3J0IGNvbnN0IHZpc3VhbGx5SGlkZGVuID0ge1xuICAuLi52aXN1YWxseUhpZGRlbkJhc2UsXG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB0b3A6IDAsXG4gIGxlZnQ6IDBcbn07XG5leHBvcnQgY29uc3QgdmlzdWFsbHlIaWRkZW5JbnB1dCA9IHtcbiAgLi4udmlzdWFsbHlIaWRkZW5CYXNlLFxuICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xufTsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmV4cG9ydCBmdW5jdGlvbiB1c2VWYWx1ZUNoYW5nZWQodmFsdWUsIG9uQ2hhbmdlKSB7XG4gIGNvbnN0IHZhbHVlUmVmID0gUmVhY3QudXNlUmVmKHZhbHVlKTtcbiAgY29uc3Qgb25DaGFuZ2VDYWxsYmFjayA9IHVzZVN0YWJsZUNhbGxiYWNrKG9uQ2hhbmdlKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAodmFsdWVSZWYuY3VycmVudCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgb25DaGFuZ2VDYWxsYmFjayh2YWx1ZVJlZi5jdXJyZW50KTtcbiAgfSwgW3ZhbHVlLCBvbkNoYW5nZUNhbGxiYWNrXSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgdmFsdWVSZWYuY3VycmVudCA9IHZhbHVlO1xuICB9LCBbdmFsdWVdKTtcbn0iXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNLHFCQUFxQjtDQUN6QixVQUFVO0NBQ1YsVUFBVTtDQUNWLFlBQVk7Q0FDWixRQUFRO0NBQ1IsU0FBUztDQUNULE9BQU87Q0FDUCxRQUFRO0NBQ1IsUUFBUTtBQUNWO0FBQ0EsSUFBYSxpQkFBaUI7Q0FDNUIsR0FBRztDQUNILFVBQVU7Q0FDVixLQUFLO0NBQ0wsTUFBTTtBQUNSO0FBQ0EsSUFBYSxzQkFBc0I7Q0FDakMsR0FBRztDQUNILFVBQVU7QUFDWjs7OztBQ2RBLFNBQWdCLGdCQUFnQixPQUFPLFVBQVU7Q0FDL0MsTUFBTSxXQUFBLGFBQWlCLE9BQU8sS0FBSztDQUNuQyxNQUFNLG1CQUFtQixrQkFBa0IsUUFBUTtDQUNuRCx5QkFBeUI7RUFDdkIsSUFBSSxTQUFTLFlBQVksT0FDdkI7RUFFRixpQkFBaUIsU0FBUyxPQUFPO0NBQ25DLEdBQUcsQ0FBQyxPQUFPLGdCQUFnQixDQUFDO0NBQzVCLHlCQUF5QjtFQUN2QixTQUFTLFVBQVU7Q0FDckIsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUNaIiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMV19