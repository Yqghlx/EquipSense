const useCallback = __vite__cjsImport0_react["useCallback"]; const useEffect = __vite__cjsImport0_react["useEffect"]; const useState = __vite__cjsImport0_react["useState"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
export function useTheme() {
	const [theme, setThemeState] = useState(() => {
		const stored = localStorage.getItem("theme");
		return stored ?? "dark";
	});
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem("theme", theme);
	}, [theme]);
	/** 切换亮色/暗色主题 */
	const toggleTheme = useCallback(() => {
		setThemeState((prev) => prev === "dark" ? "light" : "dark");
	}, []);
	return {
		theme,
		toggleTheme
	};
}

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxhQUFhLFdBQVcsZ0JBQWdCO0FBSWpELE9BQU8sU0FBUyxXQUFXO0NBQ3pCLE1BQU0sQ0FBQyxPQUFPLGlCQUFpQixlQUFzQjtFQUNuRCxNQUFNLFNBQVMsYUFBYSxRQUFRLE9BQU87RUFDM0MsT0FBTyxVQUFVO0NBQ25CLENBQUM7Q0FFRCxnQkFBZ0I7RUFDZCxTQUFTLGdCQUFnQixVQUFVLE9BQU8sUUFBUSxVQUFVLE1BQU07RUFDbEUsYUFBYSxRQUFRLFNBQVMsS0FBSztDQUNyQyxHQUFHLENBQUMsS0FBSyxDQUFDOztDQUdWLE1BQU0sY0FBYyxrQkFBa0I7RUFDcEMsZUFBZSxTQUFVLFNBQVMsU0FBUyxVQUFVLE1BQU87Q0FDOUQsR0FBRyxDQUFDLENBQUM7Q0FFTCxPQUFPO0VBQUU7RUFBTztDQUFZO0FBQzlCIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbInVzZVRoZW1lLnRzIl0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuXG50eXBlIFRoZW1lID0gJ2xpZ2h0JyB8ICdkYXJrJztcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVRoZW1lKCkge1xuICBjb25zdCBbdGhlbWUsIHNldFRoZW1lU3RhdGVdID0gdXNlU3RhdGU8VGhlbWU+KCgpID0+IHtcbiAgICBjb25zdCBzdG9yZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWUnKSBhcyBUaGVtZSB8IG51bGw7XG4gICAgcmV0dXJuIHN0b3JlZCA/PyAnZGFyayc7XG4gIH0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2RhcmsnLCB0aGVtZSA9PT0gJ2RhcmsnKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGhlbWUnLCB0aGVtZSk7XG4gIH0sIFt0aGVtZV0pO1xuXG4gIC8qKiDliIfmjaLkuq7oibIv5pqX6Imy5Li76aKYICovXG4gIGNvbnN0IHRvZ2dsZVRoZW1lID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldFRoZW1lU3RhdGUoKHByZXYpID0+IChwcmV2ID09PSAnZGFyaycgPyAnbGlnaHQnIDogJ2RhcmsnKSk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4geyB0aGVtZSwgdG9nZ2xlVGhlbWUgfTtcbn1cbiJdfQ==