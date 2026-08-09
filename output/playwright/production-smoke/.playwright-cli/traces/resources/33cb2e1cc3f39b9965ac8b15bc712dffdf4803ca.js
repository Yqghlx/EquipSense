import { i as __toESM, n as __exportAll } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
import { r as useStableCallback, t as useIsoLayoutEffect } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { i as NOOP, n as EMPTY_ARRAY$1, r as EMPTY_OBJECT, s as useMergedRefs, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { n as CompositeRootContext, t as useButton } from "/node_modules/.vite/deps/useButton-ydNp_PBX.js?v=1d2f6f90";
import { C as getGridCellIndices, E as getMinListIndex, O as isIndexOutOfListBounds, S as getGridCellIndexOfCorner, T as getMaxListIndex, _t as transitionStatusMapping, a as ARROW_RIGHT, b as createGridCellMap, d as MODIFIER_KEYS, f as VERTICAL_KEYS, g as useOpenChangeComplete, gt as TransitionStatusDataAttributes, h as scrollIntoViewIfNeeded, i as ARROW_LEFT, k as isListIndexDisabled, l as HORIZONTAL_KEYS, m as isNativeInput, n as ARROW_DOWN, o as ARROW_UP, p as VERTICAL_KEYS_WITH_EXTRA_KEYS, r as ARROW_KEYS, s as COMPOSITE_KEYS, t as inertValue, u as HORIZONTAL_KEYS_WITH_EXTRA_KEYS, v as useTransitionStatus, w as getGridNavigatedIndex, x as findNonDisabledListIndex } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { m as none, o as disabled, p as missing, r as createChangeEventDetails, t as useBaseUiId, u as initial } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, n as activeElement, r as contains, t as ownerDocument } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { t as require_shim } from "/node_modules/.vite/deps/shim-Jf0PCdQ_.js?v=1d2f6f90";
import { t as useControlled } from "/node_modules/.vite/deps/useControlled-C4c2dELU.js?v=1d2f6f90";
import { i as useCompositeListItem, n as useDirection, t as CompositeList } from "/node_modules/.vite/deps/CompositeList-CuwZ14So.js?v=1d2f6f90";
import { n as getCssDimensions, r as useCompositeItem, t as isElementDisabled } from "/node_modules/.vite/deps/isElementDisabled-Bv1KwLAu.js?v=1d2f6f90";
import { t as useCSPContext } from "/node_modules/.vite/deps/CSPContext-Cs6VJwSE.js?v=1d2f6f90";
//#region node_modules/@base-ui/utils/esm/useForcedRerendering.js
var import_jsx_runtime = require_jsx_runtime();
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Returns a function that forces a rerender.
*/
function useForcedRerendering() {
	const [, setState] = import_react.useState({});
	return import_react.useCallback(() => {
		setState({});
	}, []);
}
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/root/TabsRootContext.js
/**
* @internal
*/
var TabsRootContext = /*#__PURE__*/ import_react.createContext(void 0);
TabsRootContext.displayName = "TabsRootContext";
function useTabsRootContext() {
	const context = import_react.useContext(TabsRootContext);
	if (context === void 0) throw new Error("Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/root/TabsRootDataAttributes.js
var TabsRootDataAttributes = /*#__PURE__*/ function(TabsRootDataAttributes) {
	/**
	* Indicates the direction of the activation (based on the previous active tab).
	* @type {'left' | 'right' | 'up' | 'down' | 'none'}
	*/
	TabsRootDataAttributes["activationDirection"] = "data-activation-direction";
	/**
	* Indicates the orientation of the tabs.
	* @type {'horizontal' | 'vertical'}
	*/
	TabsRootDataAttributes["orientation"] = "data-orientation";
	return TabsRootDataAttributes;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/root/stateAttributesMapping.js
var tabsStateAttributesMapping = { tabActivationDirection: (dir) => ({ [TabsRootDataAttributes.activationDirection]: dir }) };
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/root/TabsRoot.js
/**
* Groups the tabs and the corresponding panels.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
*/
var TabsRoot = /*#__PURE__*/ import_react.forwardRef(function TabsRoot(componentProps, forwardedRef) {
	const { className, defaultValue: defaultValueProp = 0, onValueChange: onValueChangeProp, orientation = "horizontal", render, value: valueProp, style, ...elementProps } = componentProps;
	const hasExplicitDefaultValueProp = componentProps.defaultValue !== void 0;
	const tabPanelRefs = import_react.useRef([]);
	const [mountedTabPanels, setMountedTabPanels] = import_react.useState(() => /* @__PURE__ */ new Map());
	const [value, setValue] = useControlled({
		controlled: valueProp,
		default: defaultValueProp,
		name: "Tabs",
		state: "value"
	});
	const isControlled = valueProp !== void 0;
	const [tabMap, setTabMap] = import_react.useState(() => /* @__PURE__ */ new Map());
	const getTabElementBySelectedValue = import_react.useCallback((selectedValue) => {
		if (selectedValue === void 0) return null;
		for (const [tabElement, tabMetadata] of tabMap.entries()) if (tabMetadata != null && selectedValue === (tabMetadata.value ?? tabMetadata.index)) return tabElement;
		return null;
	}, [tabMap]);
	const [activationDirectionState, setActivationDirectionState] = import_react.useState(() => ({
		previousValue: value,
		tabActivationDirection: "none"
	}));
	const { previousValue, tabActivationDirection: committedTabActivationDirection } = activationDirectionState;
	let tabActivationDirection = committedTabActivationDirection;
	let directionComputationIncomplete = false;
	if (previousValue !== value) {
		tabActivationDirection = computeActivationDirection(previousValue, value, orientation, tabMap);
		directionComputationIncomplete = previousValue != null && value != null && getTabElementBySelectedValue(value) == null;
	}
	const nextPreviousValue = directionComputationIncomplete ? previousValue : value;
	const shouldSyncActivationDirectionState = previousValue !== nextPreviousValue || committedTabActivationDirection !== tabActivationDirection;
	useIsoLayoutEffect(() => {
		if (!shouldSyncActivationDirectionState) return;
		setActivationDirectionState({
			previousValue: nextPreviousValue,
			tabActivationDirection
		});
	}, [
		nextPreviousValue,
		shouldSyncActivationDirectionState,
		tabActivationDirection
	]);
	const onValueChange = useStableCallback((newValue, eventDetails) => {
		eventDetails.activationDirection = computeActivationDirection(value, newValue, orientation, tabMap);
		onValueChangeProp?.(newValue, eventDetails);
		if (eventDetails.isCanceled) return;
		setValue(newValue);
	});
	const notifyAutomaticValueChange = useStableCallback((nextValue, reason) => {
		onValueChangeProp?.(nextValue, createChangeEventDetails(reason, void 0, void 0, { activationDirection: "none" }));
	});
	const registerMountedTabPanel = useStableCallback((panelValue, panelId) => {
		setMountedTabPanels((prev) => {
			if (prev.get(panelValue) === panelId) return prev;
			const next = new Map(prev);
			next.set(panelValue, panelId);
			return next;
		});
	});
	const unregisterMountedTabPanel = useStableCallback((panelValue, panelId) => {
		setMountedTabPanels((prev) => {
			if (!prev.has(panelValue) || prev.get(panelValue) !== panelId) return prev;
			const next = new Map(prev);
			next.delete(panelValue);
			return next;
		});
	});
	const getTabPanelIdByValue = import_react.useCallback((tabValue) => {
		return mountedTabPanels.get(tabValue);
	}, [mountedTabPanels]);
	const getTabIdByPanelValue = import_react.useCallback((tabPanelValue) => {
		for (const tabMetadata of tabMap.values()) if (tabPanelValue === tabMetadata?.value) return tabMetadata?.id;
	}, [tabMap]);
	const tabsContextValue = import_react.useMemo(() => ({
		getTabElementBySelectedValue,
		getTabIdByPanelValue,
		getTabPanelIdByValue,
		onValueChange,
		orientation,
		registerMountedTabPanel,
		setTabMap,
		unregisterMountedTabPanel,
		tabActivationDirection,
		value
	}), [
		getTabElementBySelectedValue,
		getTabIdByPanelValue,
		getTabPanelIdByValue,
		onValueChange,
		orientation,
		registerMountedTabPanel,
		setTabMap,
		unregisterMountedTabPanel,
		tabActivationDirection,
		value
	]);
	const selectedTabMetadata = import_react.useMemo(() => {
		for (const tabMetadata of tabMap.values()) if (tabMetadata != null && tabMetadata.value === value) return tabMetadata;
	}, [tabMap, value]);
	const firstEnabledTabValue = import_react.useMemo(() => {
		for (const tabMetadata of tabMap.values()) if (tabMetadata != null && !tabMetadata.disabled) return tabMetadata.value;
	}, [tabMap]);
	const shouldNotifyInitialValueChangeRef = import_react.useRef(!hasExplicitDefaultValueProp);
	const shouldHonorDisabledDefaultValueRef = import_react.useRef(hasExplicitDefaultValueProp);
	const didRegisterTabsRef = import_react.useRef(false);
	useIsoLayoutEffect(() => {
		if (isControlled) return;
		function commitAutomaticValueChange(fallbackValue, fallbackReason) {
			setValue(fallbackValue);
			setActivationDirectionState((prev) => {
				if (prev.previousValue === fallbackValue && prev.tabActivationDirection === "none") return prev;
				return {
					previousValue: fallbackValue,
					tabActivationDirection: "none"
				};
			});
			notifyAutomaticValueChange(fallbackValue, fallbackReason);
			shouldNotifyInitialValueChangeRef.current = false;
		}
		if (tabMap.size === 0) {
			if (!didRegisterTabsRef.current || value === null) return;
			commitAutomaticValueChange(null, missing);
			return;
		}
		didRegisterTabsRef.current = true;
		const selectionIsDisabled = selectedTabMetadata?.disabled;
		const selectionIsMissing = selectedTabMetadata == null && value !== null;
		if (!selectionIsDisabled && value === defaultValueProp) shouldHonorDisabledDefaultValueRef.current = false;
		if (shouldHonorDisabledDefaultValueRef.current && selectionIsDisabled && value === defaultValueProp) return;
		const shouldNotifyInitialValueChange = shouldNotifyInitialValueChangeRef.current;
		if (selectionIsDisabled || selectionIsMissing) {
			const fallbackValue = firstEnabledTabValue ?? null;
			if (value === fallbackValue) {
				shouldNotifyInitialValueChangeRef.current = false;
				return;
			}
			let fallbackReason = missing;
			if (shouldNotifyInitialValueChange) fallbackReason = initial;
			else if (selectionIsDisabled) fallbackReason = disabled;
			commitAutomaticValueChange(fallbackValue, fallbackReason);
			return;
		}
		if (shouldNotifyInitialValueChange && selectedTabMetadata != null) {
			notifyAutomaticValueChange(value, initial);
			shouldNotifyInitialValueChangeRef.current = false;
		}
	}, [
		defaultValueProp,
		firstEnabledTabValue,
		isControlled,
		notifyAutomaticValueChange,
		selectedTabMetadata,
		setValue,
		tabMap,
		value
	]);
	const element = useRenderElement("div", componentProps, {
		state: {
			orientation,
			tabActivationDirection
		},
		ref: forwardedRef,
		props: elementProps,
		stateAttributesMapping: tabsStateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TabsRootContext.Provider, {
		value: tabsContextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
			elementsRef: tabPanelRefs,
			children: element
		})
	});
});
TabsRoot.displayName = "TabsRoot";
function computeActivationDirection(oldValue, newValue, orientation, tabMap) {
	if (oldValue == null || newValue == null) return "none";
	let oldTab = null;
	let newTab = null;
	for (const [tabElement, tabMetadata] of tabMap.entries()) {
		if (tabMetadata == null) continue;
		const tabValue = tabMetadata.value ?? tabMetadata.index;
		if (oldValue === tabValue) oldTab = tabElement;
		if (newValue === tabValue) newTab = tabElement;
		if (oldTab != null && newTab != null) break;
	}
	if (oldTab == null || newTab == null) {
		if (oldTab !== newTab && (typeof oldValue === "number" || typeof oldValue === "string") && typeof oldValue === typeof newValue) {
			if (orientation === "horizontal") return newValue > oldValue ? "right" : "left";
			return newValue > oldValue ? "down" : "up";
		}
		return "none";
	}
	const oldRect = oldTab.getBoundingClientRect();
	const newRect = newTab.getBoundingClientRect();
	if (orientation === "horizontal") {
		if (newRect.left < oldRect.left) return "left";
		if (newRect.left > oldRect.left) return "right";
	} else {
		if (newRect.top < oldRect.top) return "up";
		if (newRect.top > oldRect.top) return "down";
	}
	return "none";
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/composite/constants.js
var ACTIVE_COMPOSITE_ITEM = "data-composite-item-active";
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/list/TabsListContext.js
var TabsListContext = /*#__PURE__*/ import_react.createContext(void 0);
TabsListContext.displayName = "TabsListContext";
function useTabsListContext() {
	const context = import_react.useContext(TabsListContext);
	if (context === void 0) throw new Error("Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/tab/TabsTab.js
/**
* An individual interactive tab button that toggles the corresponding panel.
* Renders a `<button>` element.
*
* Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
*/
var TabsTab = /*#__PURE__*/ import_react.forwardRef(function TabsTab(componentProps, forwardedRef) {
	const { className, disabled = false, render, value, id: idProp, nativeButton = true, style, ...elementProps } = componentProps;
	const { value: activeTabValue, getTabPanelIdByValue, orientation } = useTabsRootContext();
	const { activateOnFocus, highlightedTabIndex, onTabActivation, registerTabResizeObserverElement, setHighlightedTabIndex, tabsListElement } = useTabsListContext();
	const id = useBaseUiId(idProp);
	const tabMetadata = import_react.useMemo(() => ({
		disabled,
		id,
		value
	}), [
		disabled,
		id,
		value
	]);
	const { compositeProps, compositeRef, index } = useCompositeItem({ metadata: tabMetadata });
	const active = value === activeTabValue;
	const isNavigatingRef = import_react.useRef(false);
	const tabElementRef = import_react.useRef(null);
	import_react.useEffect(() => {
		const tabElement = tabElementRef.current;
		if (!tabElement) return;
		return registerTabResizeObserverElement(tabElement);
	}, [registerTabResizeObserverElement]);
	useIsoLayoutEffect(() => {
		if (isNavigatingRef.current) {
			isNavigatingRef.current = false;
			return;
		}
		if (!(active && index > -1 && highlightedTabIndex !== index)) return;
		const listElement = tabsListElement;
		if (listElement != null) {
			const activeEl = activeElement(ownerDocument(listElement));
			if (activeEl && contains(listElement, activeEl)) return;
		}
		if (!disabled) setHighlightedTabIndex(index);
	}, [
		active,
		index,
		highlightedTabIndex,
		setHighlightedTabIndex,
		disabled,
		tabsListElement
	]);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton,
		focusableWhenDisabled: true
	});
	const tabPanelId = getTabPanelIdByValue(value);
	const isPressingRef = import_react.useRef(false);
	const isMainButtonRef = import_react.useRef(false);
	function onClick(event) {
		if (active || disabled) return;
		onTabActivation(value, createChangeEventDetails(none, event.nativeEvent, void 0, { activationDirection: "none" }));
	}
	function onFocus(event) {
		if (active) return;
		if (index > -1 && !disabled) setHighlightedTabIndex(index);
		if (disabled) return;
		if (activateOnFocus && (!isPressingRef.current || isPressingRef.current && isMainButtonRef.current)) onTabActivation(value, createChangeEventDetails(none, event.nativeEvent, void 0, { activationDirection: "none" }));
	}
	function onPointerDown(event) {
		if (active || disabled) return;
		isPressingRef.current = true;
		function handlePointerUp() {
			isPressingRef.current = false;
			isMainButtonRef.current = false;
		}
		if (!event.button || event.button === 0) {
			isMainButtonRef.current = true;
			ownerDocument(event.currentTarget).addEventListener("pointerup", handlePointerUp, { once: true });
		}
	}
	return useRenderElement("button", componentProps, {
		state: {
			disabled,
			active,
			orientation
		},
		ref: [
			forwardedRef,
			buttonRef,
			compositeRef,
			tabElementRef
		],
		props: [
			compositeProps,
			{
				role: "tab",
				"aria-controls": tabPanelId,
				"aria-selected": active,
				id,
				onClick,
				onFocus,
				onPointerDown,
				[ACTIVE_COMPOSITE_ITEM]: active ? "" : void 0,
				onKeyDownCapture() {
					isNavigatingRef.current = true;
				}
			},
			elementProps,
			getButtonProps
		]
	});
});
TabsTab.displayName = "TabsTab";
//#endregion
//#region node_modules/@base-ui/react/esm/utils/useIsHydrating.js
var import_shim = require_shim();
function subscribe() {
	return NOOP;
}
function getSnapshot() {
	return false;
}
function getServerSnapshot() {
	return true;
}
/**
* Returns `true` while React is hydrating server-rendered markup and `false`
* for fresh client-only mounts.
*/
function useIsHydrating() {
	return (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
}
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/indicator/TabsIndicatorCssVars.js
var TabsIndicatorCssVars = /*#__PURE__*/ function(TabsIndicatorCssVars) {
	/**
	* Indicates the distance on the left side from the parent's container if the tab is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabLeft"] = "--active-tab-left";
	/**
	* Indicates the distance on the right side from the parent's container if the tab is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabRight"] = "--active-tab-right";
	/**
	* Indicates the distance on the top side from the parent's container if the tab is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabTop"] = "--active-tab-top";
	/**
	* Indicates the distance on the bottom side from the parent's container if the tab is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabBottom"] = "--active-tab-bottom";
	/**
	* Indicates the width of the tab if it is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabWidth"] = "--active-tab-width";
	/**
	* Indicates the height of the tab if it is active.
	* @type {number}
	*/
	TabsIndicatorCssVars["activeTabHeight"] = "--active-tab-height";
	return TabsIndicatorCssVars;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/indicator/TabsIndicator.js
var stateAttributesMapping$1 = {
	...tabsStateAttributesMapping,
	activeTabPosition: () => null,
	activeTabSize: () => null
};
/**
* A visual indicator that can be styled to match the position of the currently active tab.
* Renders a `<span>` element.
*
* Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
*/
var TabsIndicator = /*#__PURE__*/ import_react.forwardRef(function TabsIndicator(componentProps, forwardedRef) {
	const { className, render, renderBeforeHydration = false, style: styleProp, ...elementProps } = componentProps;
	const { nonce } = useCSPContext();
	const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } = useTabsRootContext();
	const { tabsListElement, registerIndicatorUpdateListener } = useTabsListContext();
	const isHydrating = useIsHydrating();
	const rerender = useForcedRerendering();
	import_react.useEffect(() => {
		return registerIndicatorUpdateListener(rerender);
	}, [registerIndicatorUpdateListener, rerender]);
	let left = 0;
	let right = 0;
	let top = 0;
	let bottom = 0;
	let width = 0;
	let height = 0;
	let isTabSelected = false;
	if (value != null && tabsListElement != null) {
		const activeTab = getTabElementBySelectedValue(value);
		isTabSelected = true;
		if (activeTab != null) {
			const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
			const { width: tabListWidth, height: tabListHeight } = getCssDimensions(tabsListElement);
			const tabRect = activeTab.getBoundingClientRect();
			const tabsListRect = tabsListElement.getBoundingClientRect();
			const scaleX = tabListWidth > 0 ? tabsListRect.width / tabListWidth : 1;
			const scaleY = tabListHeight > 0 ? tabsListRect.height / tabListHeight : 1;
			if (Math.abs(scaleX) > Number.EPSILON && Math.abs(scaleY) > Number.EPSILON) {
				const tabLeftDelta = tabRect.left - tabsListRect.left;
				const tabTopDelta = tabRect.top - tabsListRect.top;
				left = tabLeftDelta / scaleX + tabsListElement.scrollLeft - tabsListElement.clientLeft;
				top = tabTopDelta / scaleY + tabsListElement.scrollTop - tabsListElement.clientTop;
			} else {
				left = activeTab.offsetLeft;
				top = activeTab.offsetTop;
			}
			width = computedWidth;
			height = computedHeight;
			right = tabsListElement.scrollWidth - left - width;
			bottom = tabsListElement.scrollHeight - top - height;
		}
	}
	const activeTabPosition = isTabSelected ? {
		left,
		right,
		top,
		bottom
	} : null;
	const activeTabSize = isTabSelected ? {
		width,
		height
	} : null;
	const style = isTabSelected ? {
		[TabsIndicatorCssVars.activeTabLeft]: `${left}px`,
		[TabsIndicatorCssVars.activeTabRight]: `${right}px`,
		[TabsIndicatorCssVars.activeTabTop]: `${top}px`,
		[TabsIndicatorCssVars.activeTabBottom]: `${bottom}px`,
		[TabsIndicatorCssVars.activeTabWidth]: `${width}px`,
		[TabsIndicatorCssVars.activeTabHeight]: `${height}px`
	} : void 0;
	const element = useRenderElement("span", componentProps, {
		state: {
			orientation,
			activeTabPosition,
			activeTabSize,
			tabActivationDirection
		},
		ref: forwardedRef,
		props: [
			{
				role: "presentation",
				style,
				hidden: !(isTabSelected && width > 0 && height > 0)
			},
			elementProps,
			{ suppressHydrationWarning: true }
		],
		stateAttributesMapping: stateAttributesMapping$1
	});
	if (value == null) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [element, isHydrating && renderBeforeHydration && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: "!function(){const t=document.currentScript.previousElementSibling;if(!t)return;const e=t.closest('[role=\"tablist\"]');if(!e)return;const i=e.querySelector(\"[data-active]\");if(!i)return;if(0===i.offsetWidth||0===e.offsetWidth)return;let o=0,n=0,h=0,l=0,r=0,f=0;function s(t){const e=getComputedStyle(t);let i=parseFloat(e.width)||0,o=parseFloat(e.height)||0;return(Math.round(i)!==t.offsetWidth||Math.round(o)!==t.offsetHeight)&&(i=t.offsetWidth,o=t.offsetHeight),{width:i,height:o}}if(null!=i&&null!=e){const{width:t,height:c}=s(i),{width:u,height:d}=s(e),a=i.getBoundingClientRect(),g=e.getBoundingClientRect(),p=u>0?g.width/u:1,b=d>0?g.height/d:1;if(Math.abs(p)>Number.EPSILON&&Math.abs(b)>Number.EPSILON){const t=a.left-g.left,i=a.top-g.top;o=t/p+e.scrollLeft-e.clientLeft,h=i/b+e.scrollTop-e.clientTop}else o=i.offsetLeft,h=i.offsetTop;r=t,f=c,n=e.scrollWidth-o-r,l=e.scrollHeight-h-f}function c(e,i){t.style.setProperty(`--active-tab-${e}`,`${i}px`)}c(\"left\",o),c(\"right\",n),c(\"top\",h),c(\"bottom\",l),c(\"width\",r),c(\"height\",f),r>0&&f>0&&t.removeAttribute(\"hidden\")}();" },
		suppressHydrationWarning: true
	})] });
});
TabsIndicator.displayName = "TabsIndicator";
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/panel/TabsPanelDataAttributes.js
var TabsPanelDataAttributes = function(TabsPanelDataAttributes) {
	/**
	* Indicates the index of the tab panel.
	*/
	TabsPanelDataAttributes["index"] = "data-index";
	/**
	* Indicates the direction of the activation (based on the previous active tab).
	* @type {'left' | 'right' | 'up' | 'down' | 'none'}
	*/
	TabsPanelDataAttributes["activationDirection"] = "data-activation-direction";
	/**
	* Indicates the orientation of the tabs.
	* @type {'horizontal' | 'vertical'}
	*/
	TabsPanelDataAttributes["orientation"] = "data-orientation";
	/**
	* Present when the panel is hidden.
	*/
	TabsPanelDataAttributes["hidden"] = "data-hidden";
	/**
	* Present when the panel is animating in.
	*/
	TabsPanelDataAttributes[TabsPanelDataAttributes["startingStyle"] = TransitionStatusDataAttributes.startingStyle] = "startingStyle";
	/**
	* Present when the panel is animating out.
	*/
	TabsPanelDataAttributes[TabsPanelDataAttributes["endingStyle"] = TransitionStatusDataAttributes.endingStyle] = "endingStyle";
	return TabsPanelDataAttributes;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/panel/TabsPanel.js
var stateAttributesMapping = {
	...tabsStateAttributesMapping,
	...transitionStatusMapping
};
/**
* A panel displayed when the corresponding tab is active.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
*/
var TabsPanel = /*#__PURE__*/ import_react.forwardRef(function TabsPanel(componentProps, forwardedRef) {
	const { className, value, render, keepMounted = false, style, ...elementProps } = componentProps;
	const { value: selectedValue, getTabIdByPanelValue, orientation, tabActivationDirection, registerMountedTabPanel, unregisterMountedTabPanel } = useTabsRootContext();
	const id = useBaseUiId();
	const metadata = import_react.useMemo(() => ({
		id,
		value
	}), [id, value]);
	const { ref: listItemRef, index } = useCompositeListItem({ metadata });
	const open = value === selectedValue;
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(open);
	const hidden = !mounted;
	const correspondingTabId = getTabIdByPanelValue(value);
	const state = {
		hidden,
		orientation,
		tabActivationDirection,
		transitionStatus
	};
	const panelRef = import_react.useRef(null);
	const element = useRenderElement("div", componentProps, {
		state,
		ref: [
			forwardedRef,
			listItemRef,
			panelRef
		],
		props: [{
			"aria-labelledby": correspondingTabId,
			hidden,
			id,
			role: "tabpanel",
			tabIndex: open ? 0 : -1,
			inert: inertValue(!open),
			[TabsPanelDataAttributes.index]: index
		}, elementProps],
		stateAttributesMapping
	});
	useOpenChangeComplete({
		open,
		ref: panelRef,
		onComplete() {
			if (!open) setMounted(false);
		}
	});
	useIsoLayoutEffect(() => {
		if (hidden && !keepMounted) return;
		if (id == null) return;
		registerMountedTabPanel(value, id);
		return () => {
			unregisterMountedTabPanel(value, id);
		};
	}, [
		hidden,
		keepMounted,
		value,
		id,
		registerMountedTabPanel,
		unregisterMountedTabPanel
	]);
	if (!(keepMounted || mounted)) return null;
	return element;
});
TabsPanel.displayName = "TabsPanel";
//#endregion
//#region node_modules/@base-ui/react/esm/internals/composite/root/useCompositeRoot.js
var EMPTY_ARRAY = [];
function useCompositeRoot(params) {
	const { itemSizes, cols = 1, loopFocus = true, onLoop, dense = false, orientation = "both", direction, highlightedIndex: externalHighlightedIndex, onHighlightedIndexChange: externalSetHighlightedIndex, rootRef: externalRef, enableHomeAndEndKeys = false, stopEventPropagation = false, disabledIndices, modifierKeys = EMPTY_ARRAY } = params;
	const [internalHighlightedIndex, internalSetHighlightedIndex] = import_react.useState(0);
	const isGrid = cols > 1;
	const rootRef = import_react.useRef(null);
	const mergedRef = useMergedRefs(rootRef, externalRef);
	const elementsRef = import_react.useRef([]);
	const hasSetDefaultIndexRef = import_react.useRef(false);
	const highlightedIndex = externalHighlightedIndex ?? internalHighlightedIndex;
	const onHighlightedIndexChange = useStableCallback((index, shouldScrollIntoView = false) => {
		(externalSetHighlightedIndex ?? internalSetHighlightedIndex)(index);
		if (shouldScrollIntoView) {
			const newActiveItem = elementsRef.current[index];
			scrollIntoViewIfNeeded(rootRef.current, newActiveItem, direction, orientation);
		}
	});
	const onMapChange = useStableCallback((map) => {
		if (map.size === 0 || hasSetDefaultIndexRef.current) return;
		hasSetDefaultIndexRef.current = true;
		const sortedElements = Array.from(map.keys());
		const activeItem = sortedElements.find((compositeElement) => compositeElement?.hasAttribute("data-composite-item-active")) ?? null;
		const activeIndex = activeItem ? sortedElements.indexOf(activeItem) : -1;
		if (activeIndex !== -1) onHighlightedIndexChange(activeIndex);
		scrollIntoViewIfNeeded(rootRef.current, activeItem, direction, orientation);
	});
	const wrappedOnLoop = useStableCallback((event, prevIndex, nextIndex) => {
		if (!onLoop) return nextIndex;
		return onLoop?.(event, prevIndex, nextIndex, elementsRef);
	});
	const props = import_react.useMemo(() => ({
		"aria-orientation": orientation === "both" ? void 0 : orientation,
		ref: mergedRef,
		onFocus(event) {
			const element = rootRef.current;
			const target = getTarget(event.nativeEvent);
			if (!element || target == null || !isNativeInput(target)) return;
			target.setSelectionRange(0, target.value.length ?? 0);
		},
		onKeyDown(event) {
			const RELEVANT_KEYS = enableHomeAndEndKeys ? COMPOSITE_KEYS : ARROW_KEYS;
			if (!RELEVANT_KEYS.has(event.key)) return;
			if (isModifierKeySet(event, modifierKeys)) return;
			if (!rootRef.current) return;
			const isRtl = direction === "rtl";
			const horizontalForwardKey = isRtl ? ARROW_LEFT : ARROW_RIGHT;
			const forwardKey = {
				horizontal: horizontalForwardKey,
				vertical: ARROW_DOWN,
				both: horizontalForwardKey
			}[orientation];
			const horizontalBackwardKey = isRtl ? ARROW_RIGHT : ARROW_LEFT;
			const backwardKey = {
				horizontal: horizontalBackwardKey,
				vertical: ARROW_UP,
				both: horizontalBackwardKey
			}[orientation];
			const target = getTarget(event.nativeEvent);
			if (target != null && isNativeInput(target) && !isElementDisabled(target)) {
				const selectionStart = target.selectionStart;
				const selectionEnd = target.selectionEnd;
				const textContent = target.value ?? "";
				if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) return;
				if (event.key !== backwardKey && selectionStart < textContent.length) return;
				if (event.key !== forwardKey && selectionStart > 0) return;
			}
			let nextIndex = highlightedIndex;
			const minIndex = getMinListIndex(elementsRef, disabledIndices);
			const maxIndex = getMaxListIndex(elementsRef, disabledIndices);
			if (isGrid) {
				const sizes = itemSizes || Array.from({ length: elementsRef.current.length }, () => ({
					width: 1,
					height: 1
				}));
				const cellMap = createGridCellMap(sizes, cols, dense);
				const minGridIndex = cellMap.findIndex((index) => index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices));
				const maxGridIndex = cellMap.reduce((foundIndex, index, cellIndex) => index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices) ? cellIndex : foundIndex, -1);
				nextIndex = cellMap[getGridNavigatedIndex(cellMap.map((itemIndex) => itemIndex != null ? elementsRef.current[itemIndex] : null), {
					event,
					orientation,
					loopFocus,
					onLoop: wrappedOnLoop,
					cols,
					disabledIndices: getGridCellIndices([...disabledIndices || elementsRef.current.map((_, index) => isListIndexDisabled(elementsRef.current, index) ? index : void 0), void 0], cellMap),
					minIndex: minGridIndex,
					maxIndex: maxGridIndex,
					prevIndex: getGridCellIndexOfCorner(highlightedIndex > maxIndex ? minIndex : highlightedIndex, sizes, cellMap, cols, event.key === "ArrowDown" ? "bl" : event.key === "ArrowRight" ? "tr" : "tl"),
					rtl: isRtl
				})];
			}
			const forwardKeys = {
				horizontal: [horizontalForwardKey],
				vertical: [ARROW_DOWN],
				both: [horizontalForwardKey, ARROW_DOWN]
			}[orientation];
			const backwardKeys = {
				horizontal: [horizontalBackwardKey],
				vertical: [ARROW_UP],
				both: [horizontalBackwardKey, ARROW_UP]
			}[orientation];
			const preventedKeys = isGrid ? RELEVANT_KEYS : {
				horizontal: enableHomeAndEndKeys ? HORIZONTAL_KEYS_WITH_EXTRA_KEYS : HORIZONTAL_KEYS,
				vertical: enableHomeAndEndKeys ? VERTICAL_KEYS_WITH_EXTRA_KEYS : VERTICAL_KEYS,
				both: RELEVANT_KEYS
			}[orientation];
			if (enableHomeAndEndKeys) {
				if (event.key === "Home") nextIndex = minIndex;
				else if (event.key === "End") nextIndex = maxIndex;
			}
			if (nextIndex === highlightedIndex && (forwardKeys.includes(event.key) || backwardKeys.includes(event.key))) if (loopFocus && nextIndex === maxIndex && forwardKeys.includes(event.key)) {
				nextIndex = minIndex;
				if (onLoop) nextIndex = onLoop(event, highlightedIndex, nextIndex, elementsRef);
			} else if (loopFocus && nextIndex === minIndex && backwardKeys.includes(event.key)) {
				nextIndex = maxIndex;
				if (onLoop) nextIndex = onLoop(event, highlightedIndex, nextIndex, elementsRef);
			} else nextIndex = findNonDisabledListIndex(elementsRef.current, {
				startingIndex: nextIndex,
				decrement: backwardKeys.includes(event.key),
				disabledIndices
			});
			if (nextIndex !== highlightedIndex && !isIndexOutOfListBounds(elementsRef.current, nextIndex)) {
				if (stopEventPropagation) event.stopPropagation();
				if (preventedKeys.has(event.key)) event.preventDefault();
				onHighlightedIndexChange(nextIndex, true);
				queueMicrotask(() => {
					elementsRef.current[nextIndex]?.focus();
				});
			}
		}
	}), [
		cols,
		dense,
		direction,
		disabledIndices,
		elementsRef,
		enableHomeAndEndKeys,
		highlightedIndex,
		isGrid,
		itemSizes,
		loopFocus,
		onLoop,
		wrappedOnLoop,
		mergedRef,
		modifierKeys,
		onHighlightedIndexChange,
		orientation,
		stopEventPropagation
	]);
	return import_react.useMemo(() => ({
		props,
		highlightedIndex,
		onHighlightedIndexChange,
		elementsRef,
		disabledIndices,
		onMapChange,
		relayKeyboardEvent: props.onKeyDown
	}), [
		props,
		highlightedIndex,
		onHighlightedIndexChange,
		elementsRef,
		disabledIndices,
		onMapChange
	]);
}
function isModifierKeySet(event, ignoredModifierKeys) {
	for (const key of MODIFIER_KEYS.values()) {
		if (ignoredModifierKeys.includes(key)) continue;
		if (event.getModifierState(key)) return true;
	}
	return false;
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/composite/root/CompositeRoot.js
/**
* @internal
*/
function CompositeRoot(componentProps) {
	const { render, className, style, refs = EMPTY_ARRAY$1, props = EMPTY_ARRAY$1, state = EMPTY_OBJECT, stateAttributesMapping, highlightedIndex: highlightedIndexProp, onHighlightedIndexChange: onHighlightedIndexChangeProp, orientation, dense, itemSizes, loopFocus, onLoop, cols, enableHomeAndEndKeys, onMapChange: onMapChangeProp, stopEventPropagation = true, rootRef, disabledIndices, modifierKeys, highlightItemOnHover = false, tag = "div", ...elementProps } = componentProps;
	const { props: defaultProps, highlightedIndex, onHighlightedIndexChange, elementsRef, onMapChange: onMapChangeUnwrapped, relayKeyboardEvent } = useCompositeRoot({
		itemSizes,
		cols,
		loopFocus,
		onLoop,
		dense,
		orientation,
		highlightedIndex: highlightedIndexProp,
		onHighlightedIndexChange: onHighlightedIndexChangeProp,
		rootRef,
		stopEventPropagation,
		enableHomeAndEndKeys,
		direction: useDirection(),
		disabledIndices,
		modifierKeys
	});
	const element = useRenderElement(tag, componentProps, {
		state,
		ref: refs,
		props: [
			defaultProps,
			...props,
			elementProps
		],
		stateAttributesMapping
	});
	const contextValue = import_react.useMemo(() => ({
		highlightedIndex,
		onHighlightedIndexChange,
		highlightItemOnHover,
		relayKeyboardEvent
	}), [
		highlightedIndex,
		onHighlightedIndexChange,
		highlightItemOnHover,
		relayKeyboardEvent
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeRootContext.Provider, {
		value: contextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
			elementsRef,
			onMapChange: (newMap) => {
				onMapChangeProp?.(newMap);
				onMapChangeUnwrapped(newMap);
			},
			children: element
		})
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/list/TabsList.js
/**
* Groups the individual tab buttons.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
*/
var TabsList = /*#__PURE__*/ import_react.forwardRef(function TabsList(componentProps, forwardedRef) {
	const { activateOnFocus = false, className, loopFocus = true, render, style, ...elementProps } = componentProps;
	const { onValueChange, orientation, value, setTabMap, tabActivationDirection } = useTabsRootContext();
	const [highlightedTabIndex, setHighlightedTabIndex] = import_react.useState(0);
	const [tabsListElement, setTabsListElement] = import_react.useState(null);
	const indicatorUpdateListenersRef = import_react.useRef(/* @__PURE__ */ new Set());
	const tabResizeObserverElementsRef = import_react.useRef(/* @__PURE__ */ new Set());
	const resizeObserverRef = import_react.useRef(null);
	import_react.useEffect(() => {
		if (typeof ResizeObserver === "undefined") return;
		const resizeObserver = new ResizeObserver(() => {
			indicatorUpdateListenersRef.current.forEach((listener) => {
				listener();
			});
		});
		resizeObserverRef.current = resizeObserver;
		if (tabsListElement) resizeObserver.observe(tabsListElement);
		tabResizeObserverElementsRef.current.forEach((element) => {
			resizeObserver.observe(element);
		});
		return () => {
			resizeObserver.disconnect();
			resizeObserverRef.current = null;
		};
	}, [tabsListElement]);
	const registerIndicatorUpdateListener = useStableCallback((listener) => {
		indicatorUpdateListenersRef.current.add(listener);
		return () => {
			indicatorUpdateListenersRef.current.delete(listener);
		};
	});
	const registerTabResizeObserverElement = useStableCallback((element) => {
		tabResizeObserverElementsRef.current.add(element);
		resizeObserverRef.current?.observe(element);
		return () => {
			tabResizeObserverElementsRef.current.delete(element);
			resizeObserverRef.current?.unobserve(element);
		};
	});
	const onTabActivation = useStableCallback((newValue, eventDetails) => {
		if (newValue !== value) onValueChange(newValue, eventDetails);
	});
	const state = {
		orientation,
		tabActivationDirection
	};
	const defaultProps = {
		"aria-orientation": orientation === "vertical" ? "vertical" : void 0,
		role: "tablist"
	};
	const tabsListContextValue = import_react.useMemo(() => ({
		activateOnFocus,
		highlightedTabIndex,
		registerIndicatorUpdateListener,
		registerTabResizeObserverElement,
		onTabActivation,
		setHighlightedTabIndex,
		tabsListElement
	}), [
		activateOnFocus,
		highlightedTabIndex,
		registerIndicatorUpdateListener,
		registerTabResizeObserverElement,
		onTabActivation,
		setHighlightedTabIndex,
		tabsListElement
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TabsListContext.Provider, {
		value: tabsListContextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeRoot, {
			render,
			className,
			style,
			state,
			refs: [forwardedRef, setTabsListElement],
			props: [defaultProps, elementProps],
			stateAttributesMapping: tabsStateAttributesMapping,
			highlightedIndex: highlightedTabIndex,
			enableHomeAndEndKeys: true,
			loopFocus,
			orientation,
			onHighlightedIndexChange: setHighlightedTabIndex,
			onMapChange: setTabMap,
			disabledIndices: EMPTY_ARRAY$1
		})
	});
});
TabsList.displayName = "TabsList";
//#endregion
//#region node_modules/@base-ui/react/esm/tabs/index.parts.js
var index_parts_exports = /* @__PURE__ */ __exportAll({
	Indicator: () => TabsIndicator,
	List: () => TabsList,
	Panel: () => TabsPanel,
	Root: () => TabsRoot,
	Tab: () => TabsTab
});
//#endregion
export { index_parts_exports as Tabs };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQGJhc2UtdWlfcmVhY3RfdGFicy5qcyIsIm5hbWVzIjpbIlJFQVNPTlMubWlzc2luZyIsIlJFQVNPTlMuaW5pdGlhbCIsIlJFQVNPTlMuZGlzYWJsZWQiLCJSRUFTT05TLm5vbmUiLCJ1c2VTeW5jRXh0ZXJuYWxTdG9yZSIsInN0YXRlQXR0cmlidXRlc01hcHBpbmciLCJFTVBUWV9BUlJBWSIsIkVNUFRZX0FSUkFZIl0sInNvdXJjZXMiOlsiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3VzZUZvcmNlZFJlcmVuZGVyaW5nLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3RhYnMvcm9vdC9UYWJzUm9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy9yb290L1RhYnNSb290RGF0YUF0dHJpYnV0ZXMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy9yb290L3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy9yb290L1RhYnNSb290LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2ludGVybmFscy9jb21wb3NpdGUvY29uc3RhbnRzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3RhYnMvbGlzdC9UYWJzTGlzdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy90YWIvVGFic1RhYi5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy91c2VJc0h5ZHJhdGluZy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS90YWJzL2luZGljYXRvci9wcmVoeWRyYXRpb25TY3JpcHQubWluLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3RhYnMvaW5kaWNhdG9yL1RhYnNJbmRpY2F0b3JDc3NWYXJzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3RhYnMvaW5kaWNhdG9yL1RhYnNJbmRpY2F0b3IuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy9wYW5lbC9UYWJzUGFuZWxEYXRhQXR0cmlidXRlcy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS90YWJzL3BhbmVsL1RhYnNQYW5lbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvY29tcG9zaXRlL3Jvb3QvdXNlQ29tcG9zaXRlUm9vdC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvY29tcG9zaXRlL3Jvb3QvQ29tcG9zaXRlUm9vdC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS90YWJzL2xpc3QvVGFic0xpc3QuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdGFicy9pbmRleC5wYXJ0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBmb3JjZXMgYSByZXJlbmRlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUZvcmNlZFJlcmVuZGVyaW5nKCkge1xuICBjb25zdCBbLCBzZXRTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIHJldHVybiBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgc2V0U3RhdGUoe30pO1xuICB9LCBbXSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY29uc3QgVGFic1Jvb3RDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFRhYnNSb290Q29udGV4dC5kaXNwbGF5TmFtZSA9IFwiVGFic1Jvb3RDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlVGFic1Jvb3RDb250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChUYWJzUm9vdENvbnRleHQpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBUYWJzUm9vdENvbnRleHQgaXMgbWlzc2luZy4gVGFicyBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPFRhYnMuUm9vdD4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoNjQpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCJleHBvcnQgbGV0IFRhYnNSb290RGF0YUF0dHJpYnV0ZXMgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFRhYnNSb290RGF0YUF0dHJpYnV0ZXMpIHtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZGlyZWN0aW9uIG9mIHRoZSBhY3RpdmF0aW9uIChiYXNlZCBvbiB0aGUgcHJldmlvdXMgYWN0aXZlIHRhYikuXG4gICAqIEB0eXBlIHsnbGVmdCcgfCAncmlnaHQnIHwgJ3VwJyB8ICdkb3duJyB8ICdub25lJ31cbiAgICovXG4gIFRhYnNSb290RGF0YUF0dHJpYnV0ZXNbXCJhY3RpdmF0aW9uRGlyZWN0aW9uXCJdID0gXCJkYXRhLWFjdGl2YXRpb24tZGlyZWN0aW9uXCI7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSB0YWJzLlxuICAgKiBAdHlwZSB7J2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJ31cbiAgICovXG4gIFRhYnNSb290RGF0YUF0dHJpYnV0ZXNbXCJvcmllbnRhdGlvblwiXSA9IFwiZGF0YS1vcmllbnRhdGlvblwiO1xuICByZXR1cm4gVGFic1Jvb3REYXRhQXR0cmlidXRlcztcbn0oe30pOyIsImltcG9ydCB7IFRhYnNSb290RGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi9UYWJzUm9vdERhdGFBdHRyaWJ1dGVzLmpzXCI7XG5leHBvcnQgY29uc3QgdGFic1N0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIHRhYkFjdGl2YXRpb25EaXJlY3Rpb246IGRpciA9PiAoe1xuICAgIFtUYWJzUm9vdERhdGFBdHRyaWJ1dGVzLmFjdGl2YXRpb25EaXJlY3Rpb25dOiBkaXJcbiAgfSlcbn07IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VDb250cm9sbGVkIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlQ29udHJvbGxlZCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVMaXN0IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb21wb3NpdGUvbGlzdC9Db21wb3NpdGVMaXN0LmpzXCI7XG5pbXBvcnQgeyBUYWJzUm9vdENvbnRleHQgfSBmcm9tIFwiLi9UYWJzUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHRhYnNTdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nIH0gZnJvbSBcIi4vc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcblxuLyoqXG4gKiBHcm91cHMgdGhlIHRhYnMgYW5kIHRoZSBjb3JyZXNwb25kaW5nIHBhbmVscy5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgVGFic10oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3RhYnMpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgVGFic1Jvb3QgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBUYWJzUm9vdChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICBjbGFzc05hbWUsXG4gICAgZGVmYXVsdFZhbHVlOiBkZWZhdWx0VmFsdWVQcm9wID0gMCxcbiAgICBvblZhbHVlQ2hhbmdlOiBvblZhbHVlQ2hhbmdlUHJvcCxcbiAgICBvcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJyxcbiAgICByZW5kZXIsXG4gICAgdmFsdWU6IHZhbHVlUHJvcCxcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuXG4gIC8vIFRyYWNrIHdoZXRoZXIgdGhlIHVzZXIgZXhwbGljaXRseSBwcm92aWRlZCBhIGRlZmluZWQgYGRlZmF1bHRWYWx1ZWAgcHJvcC5cbiAgLy8gVXNlZCB0byBkZXRlcm1pbmUgaWYgd2Ugc2hvdWxkIGhvbm9yIGEgZGlzYWJsZWQgdGFiIHNlbGVjdGlvbi5cbiAgY29uc3QgaGFzRXhwbGljaXREZWZhdWx0VmFsdWVQcm9wID0gY29tcG9uZW50UHJvcHMuZGVmYXVsdFZhbHVlICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IHRhYlBhbmVsUmVmcyA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIGNvbnN0IFttb3VudGVkVGFiUGFuZWxzLCBzZXRNb3VudGVkVGFiUGFuZWxzXSA9IFJlYWN0LnVzZVN0YXRlKCgpID0+IG5ldyBNYXAoKSk7XG4gIGNvbnN0IFt2YWx1ZSwgc2V0VmFsdWVdID0gdXNlQ29udHJvbGxlZCh7XG4gICAgY29udHJvbGxlZDogdmFsdWVQcm9wLFxuICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWx1ZVByb3AsXG4gICAgbmFtZTogJ1RhYnMnLFxuICAgIHN0YXRlOiAndmFsdWUnXG4gIH0pO1xuICBjb25zdCBpc0NvbnRyb2xsZWQgPSB2YWx1ZVByb3AgIT09IHVuZGVmaW5lZDtcbiAgY29uc3QgW3RhYk1hcCwgc2V0VGFiTWFwXSA9IFJlYWN0LnVzZVN0YXRlKCgpID0+IG5ldyBNYXAoKSk7XG5cbiAgLy8gVXNlZCBmb3IgYWN0aXZhdGlvbiBkaXJlY3Rpb24gZGV0ZWN0aW9uIHZpYSB0YWIgZWxlbWVudCBwb3NpdGlvbnMuXG4gIGNvbnN0IGdldFRhYkVsZW1lbnRCeVNlbGVjdGVkVmFsdWUgPSBSZWFjdC51c2VDYWxsYmFjayhzZWxlY3RlZFZhbHVlID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbdGFiRWxlbWVudCwgdGFiTWV0YWRhdGFdIG9mIHRhYk1hcC5lbnRyaWVzKCkpIHtcbiAgICAgIGlmICh0YWJNZXRhZGF0YSAhPSBudWxsICYmIHNlbGVjdGVkVmFsdWUgPT09ICh0YWJNZXRhZGF0YS52YWx1ZSA/PyB0YWJNZXRhZGF0YS5pbmRleCkpIHtcbiAgICAgICAgcmV0dXJuIHRhYkVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LCBbdGFiTWFwXSk7XG4gIGNvbnN0IFthY3RpdmF0aW9uRGlyZWN0aW9uU3RhdGUsIHNldEFjdGl2YXRpb25EaXJlY3Rpb25TdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgoKSA9PiAoe1xuICAgIHByZXZpb3VzVmFsdWU6IHZhbHVlLFxuICAgIHRhYkFjdGl2YXRpb25EaXJlY3Rpb246ICdub25lJ1xuICB9KSk7XG4gIGNvbnN0IHtcbiAgICBwcmV2aW91c1ZhbHVlLFxuICAgIHRhYkFjdGl2YXRpb25EaXJlY3Rpb246IGNvbW1pdHRlZFRhYkFjdGl2YXRpb25EaXJlY3Rpb25cbiAgfSA9IGFjdGl2YXRpb25EaXJlY3Rpb25TdGF0ZTtcbiAgbGV0IHRhYkFjdGl2YXRpb25EaXJlY3Rpb24gPSBjb21taXR0ZWRUYWJBY3RpdmF0aW9uRGlyZWN0aW9uO1xuICBsZXQgZGlyZWN0aW9uQ29tcHV0YXRpb25JbmNvbXBsZXRlID0gZmFsc2U7XG5cbiAgLy8gQ29tcHV0ZSBhY3RpdmF0aW9uIGRpcmVjdGlvbiBkdXJpbmcgcmVuZGVyIHdoZW4gdmFsdWUgY2hhbmdlcyBzbyBjaGlsZHJlbiBzZWVcbiAgLy8gdGhlIGNvcnJlY3QgZGlyZWN0aW9uIG9uIHRoZWlyIHZlcnkgZmlyc3QgcmVuZGVyIGFmdGVyIHRoZSBzZWxlY3Rpb24gdXBkYXRlLlxuICAvLyBUaGUgcHJldmlvdXMgdmFsdWUgc25hcHNob3QgaXMgc3RvcmVkIGluIHN0YXRlIGFuZCBzeW5jZWQgYWZ0ZXIgY29tbWl0LlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbXVpL2Jhc2UtdWkvaXNzdWVzLzM4NzNcbiAgaWYgKHByZXZpb3VzVmFsdWUgIT09IHZhbHVlKSB7XG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvbiA9IGNvbXB1dGVBY3RpdmF0aW9uRGlyZWN0aW9uKHByZXZpb3VzVmFsdWUsIHZhbHVlLCBvcmllbnRhdGlvbiwgdGFiTWFwKTtcblxuICAgIC8vIFdoZW4gYSBuZXcgdGFiIGlzIGFkZGVkIGFuZCBzZWxlY3RlZCBpbiB0aGUgc2FtZSBjb250cm9sbGVkIHVwZGF0ZSxcbiAgICAvLyB0aGUgdGFiIGVsZW1lbnQgbWF5IG5vdCB5ZXQgYmUgcmVnaXN0ZXJlZCBpbiB0YWJNYXAsIHNvIGRpcmVjdGlvbiB3YXNcbiAgICAvLyBjb21wdXRlZCBmcm9tIGEgdmFsdWUtYmFzZWQgZmFsbGJhY2suIEtlZXAgdGhlIHByZXZpb3VzIHZhbHVlIHNuYXBzaG90XG4gICAgLy8gc3RhbGUgc28gd2UgcmUtY29tcHV0ZSBmcm9tIERPTSBwb3NpdGlvbnMgb25jZSB0YWJNYXAgaXMgdXAgdG8gZGF0ZS5cbiAgICBkaXJlY3Rpb25Db21wdXRhdGlvbkluY29tcGxldGUgPSBwcmV2aW91c1ZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT0gbnVsbCAmJiBnZXRUYWJFbGVtZW50QnlTZWxlY3RlZFZhbHVlKHZhbHVlKSA9PSBudWxsO1xuICB9XG4gIGNvbnN0IG5leHRQcmV2aW91c1ZhbHVlID0gZGlyZWN0aW9uQ29tcHV0YXRpb25JbmNvbXBsZXRlID8gcHJldmlvdXNWYWx1ZSA6IHZhbHVlO1xuICBjb25zdCBzaG91bGRTeW5jQWN0aXZhdGlvbkRpcmVjdGlvblN0YXRlID0gcHJldmlvdXNWYWx1ZSAhPT0gbmV4dFByZXZpb3VzVmFsdWUgfHwgY29tbWl0dGVkVGFiQWN0aXZhdGlvbkRpcmVjdGlvbiAhPT0gdGFiQWN0aXZhdGlvbkRpcmVjdGlvbjtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXNob3VsZFN5bmNBY3RpdmF0aW9uRGlyZWN0aW9uU3RhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0QWN0aXZhdGlvbkRpcmVjdGlvblN0YXRlKHtcbiAgICAgIHByZXZpb3VzVmFsdWU6IG5leHRQcmV2aW91c1ZhbHVlLFxuICAgICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvblxuICAgIH0pO1xuICB9LCBbbmV4dFByZXZpb3VzVmFsdWUsIHNob3VsZFN5bmNBY3RpdmF0aW9uRGlyZWN0aW9uU3RhdGUsIHRhYkFjdGl2YXRpb25EaXJlY3Rpb25dKTtcbiAgY29uc3Qgb25WYWx1ZUNoYW5nZSA9IHVzZVN0YWJsZUNhbGxiYWNrKChuZXdWYWx1ZSwgZXZlbnREZXRhaWxzKSA9PiB7XG4gICAgY29uc3QgYWN0aXZhdGlvbkRpcmVjdGlvbiA9IGNvbXB1dGVBY3RpdmF0aW9uRGlyZWN0aW9uKHZhbHVlLCBuZXdWYWx1ZSwgb3JpZW50YXRpb24sIHRhYk1hcCk7XG4gICAgZXZlbnREZXRhaWxzLmFjdGl2YXRpb25EaXJlY3Rpb24gPSBhY3RpdmF0aW9uRGlyZWN0aW9uO1xuICAgIG9uVmFsdWVDaGFuZ2VQcm9wPy4obmV3VmFsdWUsIGV2ZW50RGV0YWlscyk7XG4gICAgaWYgKGV2ZW50RGV0YWlscy5pc0NhbmNlbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldFZhbHVlKG5ld1ZhbHVlKTtcbiAgfSk7XG4gIGNvbnN0IG5vdGlmeUF1dG9tYXRpY1ZhbHVlQ2hhbmdlID0gdXNlU3RhYmxlQ2FsbGJhY2soKG5leHRWYWx1ZSwgcmVhc29uKSA9PiB7XG4gICAgb25WYWx1ZUNoYW5nZVByb3A/LihuZXh0VmFsdWUsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhyZWFzb24sIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB7XG4gICAgICBhY3RpdmF0aW9uRGlyZWN0aW9uOiAnbm9uZSdcbiAgICB9KSk7XG4gIH0pO1xuICBjb25zdCByZWdpc3Rlck1vdW50ZWRUYWJQYW5lbCA9IHVzZVN0YWJsZUNhbGxiYWNrKChwYW5lbFZhbHVlLCBwYW5lbElkKSA9PiB7XG4gICAgc2V0TW91bnRlZFRhYlBhbmVscyhwcmV2ID0+IHtcbiAgICAgIGlmIChwcmV2LmdldChwYW5lbFZhbHVlKSA9PT0gcGFuZWxJZCkge1xuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5leHQgPSBuZXcgTWFwKHByZXYpO1xuICAgICAgbmV4dC5zZXQocGFuZWxWYWx1ZSwgcGFuZWxJZCk7XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9KTtcbiAgfSk7XG4gIGNvbnN0IHVucmVnaXN0ZXJNb3VudGVkVGFiUGFuZWwgPSB1c2VTdGFibGVDYWxsYmFjaygocGFuZWxWYWx1ZSwgcGFuZWxJZCkgPT4ge1xuICAgIHNldE1vdW50ZWRUYWJQYW5lbHMocHJldiA9PiB7XG4gICAgICBpZiAoIXByZXYuaGFzKHBhbmVsVmFsdWUpIHx8IHByZXYuZ2V0KHBhbmVsVmFsdWUpICE9PSBwYW5lbElkKSB7XG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfVxuICAgICAgY29uc3QgbmV4dCA9IG5ldyBNYXAocHJldik7XG4gICAgICBuZXh0LmRlbGV0ZShwYW5lbFZhbHVlKTtcbiAgICAgIHJldHVybiBuZXh0O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBnZXQgdGhlIGBpZGAgYXR0cmlidXRlIG9mIDxUYWJzLlBhbmVsPiB0byBzZXQgYXMgdGhlIHZhbHVlIG9mIGBhcmlhLWNvbnRyb2xzYCBvbiA8VGFicy5UYWI+XG4gIGNvbnN0IGdldFRhYlBhbmVsSWRCeVZhbHVlID0gUmVhY3QudXNlQ2FsbGJhY2sodGFiVmFsdWUgPT4ge1xuICAgIHJldHVybiBtb3VudGVkVGFiUGFuZWxzLmdldCh0YWJWYWx1ZSk7XG4gIH0sIFttb3VudGVkVGFiUGFuZWxzXSk7XG5cbiAgLy8gZ2V0IHRoZSBgaWRgIGF0dHJpYnV0ZSBvZiA8VGFicy5UYWI+IHRvIHNldCBhcyB0aGUgdmFsdWUgb2YgYGFyaWEtbGFiZWxsZWRieWAgb24gPFRhYnMuUGFuZWw+XG4gIGNvbnN0IGdldFRhYklkQnlQYW5lbFZhbHVlID0gUmVhY3QudXNlQ2FsbGJhY2sodGFiUGFuZWxWYWx1ZSA9PiB7XG4gICAgZm9yIChjb25zdCB0YWJNZXRhZGF0YSBvZiB0YWJNYXAudmFsdWVzKCkpIHtcbiAgICAgIGlmICh0YWJQYW5lbFZhbHVlID09PSB0YWJNZXRhZGF0YT8udmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRhYk1ldGFkYXRhPy5pZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSwgW3RhYk1hcF0pO1xuICBjb25zdCB0YWJzQ29udGV4dFZhbHVlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGdldFRhYkVsZW1lbnRCeVNlbGVjdGVkVmFsdWUsXG4gICAgZ2V0VGFiSWRCeVBhbmVsVmFsdWUsXG4gICAgZ2V0VGFiUGFuZWxJZEJ5VmFsdWUsXG4gICAgb25WYWx1ZUNoYW5nZSxcbiAgICBvcmllbnRhdGlvbixcbiAgICByZWdpc3Rlck1vdW50ZWRUYWJQYW5lbCxcbiAgICBzZXRUYWJNYXAsXG4gICAgdW5yZWdpc3Rlck1vdW50ZWRUYWJQYW5lbCxcbiAgICB0YWJBY3RpdmF0aW9uRGlyZWN0aW9uLFxuICAgIHZhbHVlXG4gIH0pLCBbZ2V0VGFiRWxlbWVudEJ5U2VsZWN0ZWRWYWx1ZSwgZ2V0VGFiSWRCeVBhbmVsVmFsdWUsIGdldFRhYlBhbmVsSWRCeVZhbHVlLCBvblZhbHVlQ2hhbmdlLCBvcmllbnRhdGlvbiwgcmVnaXN0ZXJNb3VudGVkVGFiUGFuZWwsIHNldFRhYk1hcCwgdW5yZWdpc3Rlck1vdW50ZWRUYWJQYW5lbCwgdGFiQWN0aXZhdGlvbkRpcmVjdGlvbiwgdmFsdWVdKTtcbiAgY29uc3Qgc2VsZWN0ZWRUYWJNZXRhZGF0YSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGZvciAoY29uc3QgdGFiTWV0YWRhdGEgb2YgdGFiTWFwLnZhbHVlcygpKSB7XG4gICAgICBpZiAodGFiTWV0YWRhdGEgIT0gbnVsbCAmJiB0YWJNZXRhZGF0YS52YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRhYk1ldGFkYXRhO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9LCBbdGFiTWFwLCB2YWx1ZV0pO1xuXG4gIC8vIEZpbmQgdGhlIGZpcnN0IG5vbi1kaXNhYmxlZCB0YWIgdmFsdWUuXG4gIC8vIFVzZWQgYXMgYSBmYWxsYmFjayB3aGVuIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBpcyBkaXNhYmxlZCBvciBtaXNzaW5nLlxuICBjb25zdCBmaXJzdEVuYWJsZWRUYWJWYWx1ZSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGZvciAoY29uc3QgdGFiTWV0YWRhdGEgb2YgdGFiTWFwLnZhbHVlcygpKSB7XG4gICAgICBpZiAodGFiTWV0YWRhdGEgIT0gbnVsbCAmJiAhdGFiTWV0YWRhdGEuZGlzYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIHRhYk1ldGFkYXRhLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9LCBbdGFiTWFwXSk7XG5cbiAgLy8gSW1wbGljaXQgdW5jb250cm9sbGVkIHNlbGVjdGlvbnMgYXJlIHN0aWxsIGF1dG9tYXRpYyBjaGFuZ2VzLCBzbyBub3RpZnlcbiAgLy8gb25jZSB3aGVuIHRoZSB0YWJzIGZpcnN0IHJlZ2lzdGVyLiBFeHBsaWNpdCBkZWZhdWx0cyBhcmUgdHJlYXRlZCBhcyB1c2VyLW93bmVkLlxuICBjb25zdCBzaG91bGROb3RpZnlJbml0aWFsVmFsdWVDaGFuZ2VSZWYgPSBSZWFjdC51c2VSZWYoIWhhc0V4cGxpY2l0RGVmYXVsdFZhbHVlUHJvcCk7XG4gIC8vIEFuIGV4cGxpY2l0IGRlZmF1bHRWYWx1ZSBjYW4gaW50ZW50aW9uYWxseSBwb2ludCBhdCBhIGRpc2FibGVkIHRhYiBvbiBtb3VudC5cbiAgLy8gT25jZSB0aGF0IHNlbGVjdGlvbiBiZWNvbWVzIHZhbGlkLCBsYXRlciBkaXNhYmxlZCBzdGF0ZXMgc2hvdWxkIGZhbGwgYmFjay5cbiAgY29uc3Qgc2hvdWxkSG9ub3JEaXNhYmxlZERlZmF1bHRWYWx1ZVJlZiA9IFJlYWN0LnVzZVJlZihoYXNFeHBsaWNpdERlZmF1bHRWYWx1ZVByb3ApO1xuICBjb25zdCBkaWRSZWdpc3RlclRhYnNSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFVuY29udHJvbGxlZCByb290cyBvd24gYXV0b21hdGljIGZhbGxiYWNrLiBDb250cm9sbGVkIHJvb3RzIGtlZXAgdGhlIGV4YWN0XG4gIC8vIHZhbHVlIHN1cHBsaWVkIGJ5IHRoZSBwYXJlbnQsIGV2ZW4gd2hlbiB0aGF0IHRhYiBpcyBkaXNhYmxlZCBvciBtaXNzaW5nLlxuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc0NvbnRyb2xsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29tbWl0QXV0b21hdGljVmFsdWVDaGFuZ2UoZmFsbGJhY2tWYWx1ZSwgZmFsbGJhY2tSZWFzb24pIHtcbiAgICAgIHNldFZhbHVlKGZhbGxiYWNrVmFsdWUpO1xuICAgICAgLy8gQXV0b21hdGljIGZhbGxiYWNrcyBhcmUgbm90IGRpcmVjdGlvbmFsIHRyYW5zaXRpb25zOyByZXNldCB0aGUgZGlyZWN0aW9uXG4gICAgICAvLyBhbG9uZ3NpZGUgdGhlIHZhbHVlIHNvIHRoZSBiYXRjaGVkIGNvbW1pdCBrZWVwcyBib3RoIGluIHN5bmMuXG4gICAgICBzZXRBY3RpdmF0aW9uRGlyZWN0aW9uU3RhdGUocHJldiA9PiB7XG4gICAgICAgIGlmIChwcmV2LnByZXZpb3VzVmFsdWUgPT09IGZhbGxiYWNrVmFsdWUgJiYgcHJldi50YWJBY3RpdmF0aW9uRGlyZWN0aW9uID09PSAnbm9uZScpIHtcbiAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHByZXZpb3VzVmFsdWU6IGZhbGxiYWNrVmFsdWUsXG4gICAgICAgICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvbjogJ25vbmUnXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIG5vdGlmeUF1dG9tYXRpY1ZhbHVlQ2hhbmdlKGZhbGxiYWNrVmFsdWUsIGZhbGxiYWNrUmVhc29uKTtcbiAgICAgIC8vIE1hcmsgdGhlIGluaXRpYWwgbm90aWZpY2F0aW9uIGFzIGRlbGl2ZXJlZCBvbmx5IGFmdGVyIHRoZSBjb25zdW1lclxuICAgICAgLy8gY2FsbGJhY2sgcmV0dXJucy4gVGhlIGZhbGxiYWNrIHZhbHVlIGlzIHF1ZXVlZCBmaXJzdCBzbyBhdXRvbWF0aWNcbiAgICAgIC8vIGNvbnNpc3RlbmN5IHVwZGF0ZXMgYXJlIG5vdCBjYW5jZWxhYmxlIHRocm91Z2ggYSB0aHJvd2luZyBoYW5kbGVyLlxuICAgICAgc2hvdWxkTm90aWZ5SW5pdGlhbFZhbHVlQ2hhbmdlUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRhYk1hcC5zaXplID09PSAwKSB7XG4gICAgICBpZiAoIWRpZFJlZ2lzdGVyVGFic1JlZi5jdXJyZW50IHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbW1pdEF1dG9tYXRpY1ZhbHVlQ2hhbmdlKG51bGwsIFJFQVNPTlMubWlzc2luZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRpZFJlZ2lzdGVyVGFic1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjb25zdCBzZWxlY3Rpb25Jc0Rpc2FibGVkID0gc2VsZWN0ZWRUYWJNZXRhZGF0YT8uZGlzYWJsZWQ7XG4gICAgY29uc3Qgc2VsZWN0aW9uSXNNaXNzaW5nID0gc2VsZWN0ZWRUYWJNZXRhZGF0YSA9PSBudWxsICYmIHZhbHVlICE9PSBudWxsO1xuICAgIGlmICghc2VsZWN0aW9uSXNEaXNhYmxlZCAmJiB2YWx1ZSA9PT0gZGVmYXVsdFZhbHVlUHJvcCkge1xuICAgICAgc2hvdWxkSG9ub3JEaXNhYmxlZERlZmF1bHRWYWx1ZVJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChzaG91bGRIb25vckRpc2FibGVkRGVmYXVsdFZhbHVlUmVmLmN1cnJlbnQgJiYgc2VsZWN0aW9uSXNEaXNhYmxlZCAmJiB2YWx1ZSA9PT0gZGVmYXVsdFZhbHVlUHJvcCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzaG91bGROb3RpZnlJbml0aWFsVmFsdWVDaGFuZ2UgPSBzaG91bGROb3RpZnlJbml0aWFsVmFsdWVDaGFuZ2VSZWYuY3VycmVudDtcbiAgICBpZiAoc2VsZWN0aW9uSXNEaXNhYmxlZCB8fCBzZWxlY3Rpb25Jc01pc3NpbmcpIHtcbiAgICAgIGNvbnN0IGZhbGxiYWNrVmFsdWUgPSBmaXJzdEVuYWJsZWRUYWJWYWx1ZSA/PyBudWxsO1xuICAgICAgaWYgKHZhbHVlID09PSBmYWxsYmFja1ZhbHVlKSB7XG4gICAgICAgIC8vIEFscmVhZHkgYXQgdGhlIGZhbGxiYWNrIHZhbHVlOyBubyBjb21taXQgb3Igbm90aWZpY2F0aW9uIG5lZWRlZCxcbiAgICAgICAgLy8gYnV0IHJlY29yZCB0aGF0IHRoZSBpbXBsaWNpdC1pbml0aWFsIHRyYW5zaXRpb24gaGFzIHJlc29sdmVkLlxuICAgICAgICBzaG91bGROb3RpZnlJbml0aWFsVmFsdWVDaGFuZ2VSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgZmFsbGJhY2tSZWFzb24gPSBSRUFTT05TLm1pc3Npbmc7XG4gICAgICBpZiAoc2hvdWxkTm90aWZ5SW5pdGlhbFZhbHVlQ2hhbmdlKSB7XG4gICAgICAgIGZhbGxiYWNrUmVhc29uID0gUkVBU09OUy5pbml0aWFsO1xuICAgICAgfSBlbHNlIGlmIChzZWxlY3Rpb25Jc0Rpc2FibGVkKSB7XG4gICAgICAgIGZhbGxiYWNrUmVhc29uID0gUkVBU09OUy5kaXNhYmxlZDtcbiAgICAgIH1cbiAgICAgIGNvbW1pdEF1dG9tYXRpY1ZhbHVlQ2hhbmdlKGZhbGxiYWNrVmFsdWUsIGZhbGxiYWNrUmVhc29uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHNob3VsZE5vdGlmeUluaXRpYWxWYWx1ZUNoYW5nZSAmJiBzZWxlY3RlZFRhYk1ldGFkYXRhICE9IG51bGwpIHtcbiAgICAgIG5vdGlmeUF1dG9tYXRpY1ZhbHVlQ2hhbmdlKHZhbHVlLCBSRUFTT05TLmluaXRpYWwpO1xuICAgICAgc2hvdWxkTm90aWZ5SW5pdGlhbFZhbHVlQ2hhbmdlUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG4gIH0sIFtkZWZhdWx0VmFsdWVQcm9wLCBmaXJzdEVuYWJsZWRUYWJWYWx1ZSwgaXNDb250cm9sbGVkLCBub3RpZnlBdXRvbWF0aWNWYWx1ZUNoYW5nZSwgc2VsZWN0ZWRUYWJNZXRhZGF0YSwgc2V0VmFsdWUsIHRhYk1hcCwgdmFsdWVdKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3JpZW50YXRpb24sXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvblxuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICBwcm9wczogZWxlbWVudFByb3BzLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHRhYnNTdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nXG4gIH0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goVGFic1Jvb3RDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHRhYnNDb250ZXh0VmFsdWUsXG4gICAgY2hpbGRyZW46IC8qI19fUFVSRV9fKi9fanN4KENvbXBvc2l0ZUxpc3QsIHtcbiAgICAgIGVsZW1lbnRzUmVmOiB0YWJQYW5lbFJlZnMsXG4gICAgICBjaGlsZHJlbjogZWxlbWVudFxuICAgIH0pXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBUYWJzUm9vdC5kaXNwbGF5TmFtZSA9IFwiVGFic1Jvb3RcIjtcbmZ1bmN0aW9uIGNvbXB1dGVBY3RpdmF0aW9uRGlyZWN0aW9uKG9sZFZhbHVlLCBuZXdWYWx1ZSwgb3JpZW50YXRpb24sIHRhYk1hcCkge1xuICBpZiAob2xkVmFsdWUgPT0gbnVsbCB8fCBuZXdWYWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuICdub25lJztcbiAgfVxuICBsZXQgb2xkVGFiID0gbnVsbDtcbiAgbGV0IG5ld1RhYiA9IG51bGw7XG4gIGZvciAoY29uc3QgW3RhYkVsZW1lbnQsIHRhYk1ldGFkYXRhXSBvZiB0YWJNYXAuZW50cmllcygpKSB7XG4gICAgaWYgKHRhYk1ldGFkYXRhID09IG51bGwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCB0YWJWYWx1ZSA9IHRhYk1ldGFkYXRhLnZhbHVlID8/IHRhYk1ldGFkYXRhLmluZGV4O1xuICAgIGlmIChvbGRWYWx1ZSA9PT0gdGFiVmFsdWUpIHtcbiAgICAgIG9sZFRhYiA9IHRhYkVsZW1lbnQ7XG4gICAgfVxuICAgIGlmIChuZXdWYWx1ZSA9PT0gdGFiVmFsdWUpIHtcbiAgICAgIG5ld1RhYiA9IHRhYkVsZW1lbnQ7XG4gICAgfVxuICAgIGlmIChvbGRUYWIgIT0gbnVsbCAmJiBuZXdUYWIgIT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChvbGRUYWIgPT0gbnVsbCB8fCBuZXdUYWIgPT0gbnVsbCkge1xuICAgIC8vIEZhbGxiYWNrIGZvciBkeW5hbWljIHRhYnM6IHdoZW4gYSB0YWIgZWxlbWVudCBpc24ndCByZWdpc3RlcmVkIHlldFxuICAgIC8vIChlLmcuIGFkZGVkIGFuZCBzZWxlY3RlZCBpbiB0aGUgc2FtZSB1cGRhdGUpLCBpbmZlciBkaXJlY3Rpb24gZnJvbVxuICAgIC8vIHRoZSB2YWx1ZXMgdGhlbXNlbHZlcy4gV29ya3MgZm9yIGNvbXBhcmFibGUgdHlwZXMgKG51bWJlcnMsIHN0cmluZ3MpLlxuICAgIGlmIChvbGRUYWIgIT09IG5ld1RhYiAmJiAodHlwZW9mIG9sZFZhbHVlID09PSAnbnVtYmVyJyB8fCB0eXBlb2Ygb2xkVmFsdWUgPT09ICdzdHJpbmcnKSAmJiB0eXBlb2Ygb2xkVmFsdWUgPT09IHR5cGVvZiBuZXdWYWx1ZSkge1xuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgcmV0dXJuIG5ld1ZhbHVlID4gb2xkVmFsdWUgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ld1ZhbHVlID4gb2xkVmFsdWUgPyAnZG93bicgOiAndXAnO1xuICAgIH1cbiAgICByZXR1cm4gJ25vbmUnO1xuICB9XG4gIGNvbnN0IG9sZFJlY3QgPSBvbGRUYWIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGNvbnN0IG5ld1JlY3QgPSBuZXdUYWIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgaWYgKG5ld1JlY3QubGVmdCA8IG9sZFJlY3QubGVmdCkge1xuICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9XG4gICAgaWYgKG5ld1JlY3QubGVmdCA+IG9sZFJlY3QubGVmdCkge1xuICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChuZXdSZWN0LnRvcCA8IG9sZFJlY3QudG9wKSB7XG4gICAgICByZXR1cm4gJ3VwJztcbiAgICB9XG4gICAgaWYgKG5ld1JlY3QudG9wID4gb2xkUmVjdC50b3ApIHtcbiAgICAgIHJldHVybiAnZG93bic7XG4gICAgfVxuICB9XG4gIHJldHVybiAnbm9uZSc7XG59IiwiZXhwb3J0IGNvbnN0IEFDVElWRV9DT01QT1NJVEVfSVRFTSA9ICdkYXRhLWNvbXBvc2l0ZS1pdGVtLWFjdGl2ZSc7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgVGFic0xpc3RDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFRhYnNMaXN0Q29udGV4dC5kaXNwbGF5TmFtZSA9IFwiVGFic0xpc3RDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlVGFic0xpc3RDb250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChUYWJzTGlzdENvbnRleHQpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBUYWJzTGlzdENvbnRleHQgaXMgbWlzc2luZy4gVGFic0xpc3QgcGFydHMgbXVzdCBiZSBwbGFjZWQgd2l0aGluIDxUYWJzLkxpc3Q+LicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDY1KSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZUJhc2VVaUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VCYXNlVWlJZC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQnV0dG9uIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2UtYnV0dG9uL2luZGV4LmpzXCI7XG5pbXBvcnQgeyBBQ1RJVkVfQ09NUE9TSVRFX0lURU0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IHVzZUNvbXBvc2l0ZUl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9pdGVtL3VzZUNvbXBvc2l0ZUl0ZW0uanNcIjtcbmltcG9ydCB7IHVzZVRhYnNSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1RhYnNSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlVGFic0xpc3RDb250ZXh0IH0gZnJvbSBcIi4uL2xpc3QvVGFic0xpc3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuaW1wb3J0IHsgYWN0aXZlRWxlbWVudCwgY29udGFpbnMgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMuanNcIjtcblxuLyoqXG4gKiBBbiBpbmRpdmlkdWFsIGludGVyYWN0aXZlIHRhYiBidXR0b24gdGhhdCB0b2dnbGVzIHRoZSBjb3JyZXNwb25kaW5nIHBhbmVsLlxuICogUmVuZGVycyBhIGA8YnV0dG9uPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBUYWJzXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvdGFicylcbiAqL1xuZXhwb3J0IGNvbnN0IFRhYnNUYWIgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBUYWJzVGFiKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIGNsYXNzTmFtZSxcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIHJlbmRlcixcbiAgICB2YWx1ZSxcbiAgICBpZDogaWRQcm9wLFxuICAgIG5hdGl2ZUJ1dHRvbiA9IHRydWUsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHZhbHVlOiBhY3RpdmVUYWJWYWx1ZSxcbiAgICBnZXRUYWJQYW5lbElkQnlWYWx1ZSxcbiAgICBvcmllbnRhdGlvblxuICB9ID0gdXNlVGFic1Jvb3RDb250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmF0ZU9uRm9jdXMsXG4gICAgaGlnaGxpZ2h0ZWRUYWJJbmRleCxcbiAgICBvblRhYkFjdGl2YXRpb24sXG4gICAgcmVnaXN0ZXJUYWJSZXNpemVPYnNlcnZlckVsZW1lbnQsXG4gICAgc2V0SGlnaGxpZ2h0ZWRUYWJJbmRleCxcbiAgICB0YWJzTGlzdEVsZW1lbnRcbiAgfSA9IHVzZVRhYnNMaXN0Q29udGV4dCgpO1xuICBjb25zdCBpZCA9IHVzZUJhc2VVaUlkKGlkUHJvcCk7XG4gIGNvbnN0IHRhYk1ldGFkYXRhID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGRpc2FibGVkLFxuICAgIGlkLFxuICAgIHZhbHVlXG4gIH0pLCBbZGlzYWJsZWQsIGlkLCB2YWx1ZV0pO1xuICBjb25zdCB7XG4gICAgY29tcG9zaXRlUHJvcHMsXG4gICAgY29tcG9zaXRlUmVmLFxuICAgIGluZGV4XG4gICAgLy8gaG9vayBpcyB1c2VkIGluc3RlYWQgb2YgdGhlIENvbXBvc2l0ZUl0ZW0gY29tcG9uZW50XG4gICAgLy8gYmVjYXVzZSB0aGUgaW5kZXggaXMgbmVlZGVkIGZvciBUYWIgaW50ZXJuYWxzXG4gIH0gPSB1c2VDb21wb3NpdGVJdGVtKHtcbiAgICBtZXRhZGF0YTogdGFiTWV0YWRhdGFcbiAgfSk7XG4gIGNvbnN0IGFjdGl2ZSA9IHZhbHVlID09PSBhY3RpdmVUYWJWYWx1ZTtcbiAgY29uc3QgaXNOYXZpZ2F0aW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgdGFiRWxlbWVudFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB0YWJFbGVtZW50ID0gdGFiRWxlbWVudFJlZi5jdXJyZW50O1xuICAgIGlmICghdGFiRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlZ2lzdGVyVGFiUmVzaXplT2JzZXJ2ZXJFbGVtZW50KHRhYkVsZW1lbnQpO1xuICB9LCBbcmVnaXN0ZXJUYWJSZXNpemVPYnNlcnZlckVsZW1lbnRdKTtcblxuICAvLyBLZWVwIHRoZSBoaWdobGlnaHRlZCBpdGVtIGluIHN5bmMgd2l0aCB0aGUgY3VycmVudGx5IGFjdGl2ZSB0YWJcbiAgLy8gd2hlbiB0aGUgdmFsdWUgcHJvcCBjaGFuZ2VzIGV4dGVybmFsbHkgKGNvbnRyb2xsZWQgbW9kZSlcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNOYXZpZ2F0aW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgIGlzTmF2aWdhdGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghKGFjdGl2ZSAmJiBpbmRleCA+IC0xICYmIGhpZ2hsaWdodGVkVGFiSW5kZXggIT09IGluZGV4KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIGZvY3VzIGlzIGN1cnJlbnRseSB3aXRoaW4gdGhlIHRhYnMgbGlzdCwgZG9uJ3Qgb3ZlcnJpZGUgdGhlIHJvdmluZ1xuICAgIC8vIGZvY3VzIGhpZ2hsaWdodC4gVGhpcyBrZWVwcyBrZXlib2FyZCBuYXZpZ2F0aW9uIHJlbGF0aXZlIHRvIHRoZSBmb2N1c2VkXG4gICAgLy8gaXRlbSBhZnRlciBhbiBleHRlcm5hbC9hc3luY2hyb25vdXMgc2VsZWN0aW9uIGNoYW5nZS5cbiAgICBjb25zdCBsaXN0RWxlbWVudCA9IHRhYnNMaXN0RWxlbWVudDtcbiAgICBpZiAobGlzdEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgY29uc3QgYWN0aXZlRWwgPSBhY3RpdmVFbGVtZW50KG93bmVyRG9jdW1lbnQobGlzdEVsZW1lbnQpKTtcbiAgICAgIGlmIChhY3RpdmVFbCAmJiBjb250YWlucyhsaXN0RWxlbWVudCwgYWN0aXZlRWwpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEb24ndCBoaWdobGlnaHQgZGlzYWJsZWQgdGFicyB0byBwcmV2ZW50IHRoZW0gZnJvbSBpbnRlcmZlcmluZyB3aXRoIGtleWJvYXJkIG5hdmlnYXRpb24uXG4gICAgLy8gS2V5Ym9hcmQgZm9jdXMgKHRhYkluZGV4KSBzaG91bGQgcmVtYWluIG9uIGFuIGVuYWJsZWQgdGFiIGV2ZW4gd2hlbiBhIGRpc2FibGVkIHRhYiBpcyBzZWxlY3RlZC5cbiAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICBzZXRIaWdobGlnaHRlZFRhYkluZGV4KGluZGV4KTtcbiAgICB9XG4gIH0sIFthY3RpdmUsIGluZGV4LCBoaWdobGlnaHRlZFRhYkluZGV4LCBzZXRIaWdobGlnaHRlZFRhYkluZGV4LCBkaXNhYmxlZCwgdGFic0xpc3RFbGVtZW50XSk7XG4gIGNvbnN0IHtcbiAgICBnZXRCdXR0b25Qcm9wcyxcbiAgICBidXR0b25SZWZcbiAgfSA9IHVzZUJ1dHRvbih7XG4gICAgZGlzYWJsZWQsXG4gICAgbmF0aXZlOiBuYXRpdmVCdXR0b24sXG4gICAgZm9jdXNhYmxlV2hlbkRpc2FibGVkOiB0cnVlXG4gIH0pO1xuICBjb25zdCB0YWJQYW5lbElkID0gZ2V0VGFiUGFuZWxJZEJ5VmFsdWUodmFsdWUpO1xuICBjb25zdCBpc1ByZXNzaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNNYWluQnV0dG9uUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgZnVuY3Rpb24gb25DbGljayhldmVudCkge1xuICAgIGlmIChhY3RpdmUgfHwgZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgb25UYWJBY3RpdmF0aW9uKHZhbHVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5ub25lLCBldmVudC5uYXRpdmVFdmVudCwgdW5kZWZpbmVkLCB7XG4gICAgICBhY3RpdmF0aW9uRGlyZWN0aW9uOiAnbm9uZSdcbiAgICB9KSk7XG4gIH1cbiAgZnVuY3Rpb24gb25Gb2N1cyhldmVudCkge1xuICAgIGlmIChhY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGhpZ2hsaWdodCBlbmFibGVkIHRhYnMgd2hlbiBmb2N1c2VkIChkaXNhYmxlZCB0YWJzIHJlbWFpbiBmb2N1c2FibGUgdmlhIGZvY3VzYWJsZVdoZW5EaXNhYmxlZCkuXG4gICAgaWYgKGluZGV4ID4gLTEgJiYgIWRpc2FibGVkKSB7XG4gICAgICBzZXRIaWdobGlnaHRlZFRhYkluZGV4KGluZGV4KTtcbiAgICB9XG4gICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChhY3RpdmF0ZU9uRm9jdXMgJiYgKCFpc1ByZXNzaW5nUmVmLmN1cnJlbnQgfHxcbiAgICAvLyBrZXlib2FyZCBvciB0b3VjaCBmb2N1c1xuICAgIGlzUHJlc3NpbmdSZWYuY3VycmVudCAmJiBpc01haW5CdXR0b25SZWYuY3VycmVudCkgLy8gbW91c2UgZm9jdXNcbiAgICApIHtcbiAgICAgIG9uVGFiQWN0aXZhdGlvbih2YWx1ZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMubm9uZSwgZXZlbnQubmF0aXZlRXZlbnQsIHVuZGVmaW5lZCwge1xuICAgICAgICBhY3RpdmF0aW9uRGlyZWN0aW9uOiAnbm9uZSdcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gb25Qb2ludGVyRG93bihldmVudCkge1xuICAgIGlmIChhY3RpdmUgfHwgZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaXNQcmVzc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBmdW5jdGlvbiBoYW5kbGVQb2ludGVyVXAoKSB7XG4gICAgICBpc1ByZXNzaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlzTWFpbkJ1dHRvblJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghZXZlbnQuYnV0dG9uIHx8IGV2ZW50LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgaXNNYWluQnV0dG9uUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVQb2ludGVyVXAsIHtcbiAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGRpc2FibGVkLFxuICAgIGFjdGl2ZSxcbiAgICBvcmllbnRhdGlvblxuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnYnV0dG9uJywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IFtmb3J3YXJkZWRSZWYsIGJ1dHRvblJlZiwgY29tcG9zaXRlUmVmLCB0YWJFbGVtZW50UmVmXSxcbiAgICBwcm9wczogW2NvbXBvc2l0ZVByb3BzLCB7XG4gICAgICByb2xlOiAndGFiJyxcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogdGFiUGFuZWxJZCxcbiAgICAgICdhcmlhLXNlbGVjdGVkJzogYWN0aXZlLFxuICAgICAgaWQsXG4gICAgICBvbkNsaWNrLFxuICAgICAgb25Gb2N1cyxcbiAgICAgIG9uUG9pbnRlckRvd24sXG4gICAgICBbQUNUSVZFX0NPTVBPU0lURV9JVEVNXTogYWN0aXZlID8gJycgOiB1bmRlZmluZWQsXG4gICAgICBvbktleURvd25DYXB0dXJlKCkge1xuICAgICAgICBpc05hdmlnYXRpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgfSwgZWxlbWVudFByb3BzLCBnZXRCdXR0b25Qcm9wc11cbiAgfSk7XG4gIHJldHVybiBlbGVtZW50O1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBUYWJzVGFiLmRpc3BsYXlOYW1lID0gXCJUYWJzVGFiXCI7IiwiaW1wb3J0IHsgdXNlU3luY0V4dGVybmFsU3RvcmUgfSBmcm9tICd1c2Utc3luYy1leHRlcm5hbC1zdG9yZS9zaGltJztcbmltcG9ydCB7IE5PT1AgfSBmcm9tIFwiLi4vaW50ZXJuYWxzL25vb3AuanNcIjtcbmZ1bmN0aW9uIHN1YnNjcmliZSgpIHtcbiAgcmV0dXJuIE5PT1A7XG59XG5mdW5jdGlvbiBnZXRTbmFwc2hvdCgpIHtcbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0U2VydmVyU25hcHNob3QoKSB7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIHdoaWxlIFJlYWN0IGlzIGh5ZHJhdGluZyBzZXJ2ZXItcmVuZGVyZWQgbWFya3VwIGFuZCBgZmFsc2VgXG4gKiBmb3IgZnJlc2ggY2xpZW50LW9ubHkgbW91bnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlSXNIeWRyYXRpbmcoKSB7XG4gIHJldHVybiB1c2VTeW5jRXh0ZXJuYWxTdG9yZShzdWJzY3JpYmUsIGdldFNuYXBzaG90LCBnZXRTZXJ2ZXJTbmFwc2hvdCk7XG59IiwiLy8gVGhpcyBmaWxlIGlzIGF1dG9nZW5lcmF0ZWQuIERvIG5vdCBlZGl0IGl0IGRpcmVjdGx5LlxuLy8gVG8gdXBkYXRlIGl0LCBtb2RpZnkgdGhlIGNvcnJlc3BvbmRpbmcgc291cmNlIGZpbGUgYW5kIHJ1biBgcG5wbSBpbmxpbmUtc2NyaXB0c2AuXG5cbi8vIHByZXR0aWVyLWlnbm9yZVxuZXhwb3J0IGNvbnN0IHNjcmlwdCA9ICchZnVuY3Rpb24oKXtjb25zdCB0PWRvY3VtZW50LmN1cnJlbnRTY3JpcHQucHJldmlvdXNFbGVtZW50U2libGluZztpZighdClyZXR1cm47Y29uc3QgZT10LmNsb3Nlc3QoXFwnW3JvbGU9XCJ0YWJsaXN0XCJdXFwnKTtpZighZSlyZXR1cm47Y29uc3QgaT1lLnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1hY3RpdmVdXCIpO2lmKCFpKXJldHVybjtpZigwPT09aS5vZmZzZXRXaWR0aHx8MD09PWUub2Zmc2V0V2lkdGgpcmV0dXJuO2xldCBvPTAsbj0wLGg9MCxsPTAscj0wLGY9MDtmdW5jdGlvbiBzKHQpe2NvbnN0IGU9Z2V0Q29tcHV0ZWRTdHlsZSh0KTtsZXQgaT1wYXJzZUZsb2F0KGUud2lkdGgpfHwwLG89cGFyc2VGbG9hdChlLmhlaWdodCl8fDA7cmV0dXJuKE1hdGgucm91bmQoaSkhPT10Lm9mZnNldFdpZHRofHxNYXRoLnJvdW5kKG8pIT09dC5vZmZzZXRIZWlnaHQpJiYoaT10Lm9mZnNldFdpZHRoLG89dC5vZmZzZXRIZWlnaHQpLHt3aWR0aDppLGhlaWdodDpvfX1pZihudWxsIT1pJiZudWxsIT1lKXtjb25zdHt3aWR0aDp0LGhlaWdodDpjfT1zKGkpLHt3aWR0aDp1LGhlaWdodDpkfT1zKGUpLGE9aS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxnPWUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkscD11PjA/Zy53aWR0aC91OjEsYj1kPjA/Zy5oZWlnaHQvZDoxO2lmKE1hdGguYWJzKHApPk51bWJlci5FUFNJTE9OJiZNYXRoLmFicyhiKT5OdW1iZXIuRVBTSUxPTil7Y29uc3QgdD1hLmxlZnQtZy5sZWZ0LGk9YS50b3AtZy50b3A7bz10L3ArZS5zY3JvbGxMZWZ0LWUuY2xpZW50TGVmdCxoPWkvYitlLnNjcm9sbFRvcC1lLmNsaWVudFRvcH1lbHNlIG89aS5vZmZzZXRMZWZ0LGg9aS5vZmZzZXRUb3A7cj10LGY9YyxuPWUuc2Nyb2xsV2lkdGgtby1yLGw9ZS5zY3JvbGxIZWlnaHQtaC1mfWZ1bmN0aW9uIGMoZSxpKXt0LnN0eWxlLnNldFByb3BlcnR5KGAtLWFjdGl2ZS10YWItJHtlfWAsYCR7aX1weGApfWMoXCJsZWZ0XCIsbyksYyhcInJpZ2h0XCIsbiksYyhcInRvcFwiLGgpLGMoXCJib3R0b21cIixsKSxjKFwid2lkdGhcIixyKSxjKFwiaGVpZ2h0XCIsZikscj4wJiZmPjAmJnQucmVtb3ZlQXR0cmlidXRlKFwiaGlkZGVuXCIpfSgpOyc7IiwiZXhwb3J0IGxldCBUYWJzSW5kaWNhdG9yQ3NzVmFycyA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoVGFic0luZGljYXRvckNzc1ZhcnMpIHtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZGlzdGFuY2Ugb24gdGhlIGxlZnQgc2lkZSBmcm9tIHRoZSBwYXJlbnQncyBjb250YWluZXIgaWYgdGhlIHRhYiBpcyBhY3RpdmUuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBUYWJzSW5kaWNhdG9yQ3NzVmFyc1tcImFjdGl2ZVRhYkxlZnRcIl0gPSBcIi0tYWN0aXZlLXRhYi1sZWZ0XCI7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIGRpc3RhbmNlIG9uIHRoZSByaWdodCBzaWRlIGZyb20gdGhlIHBhcmVudCdzIGNvbnRhaW5lciBpZiB0aGUgdGFiIGlzIGFjdGl2ZS5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIFRhYnNJbmRpY2F0b3JDc3NWYXJzW1wiYWN0aXZlVGFiUmlnaHRcIl0gPSBcIi0tYWN0aXZlLXRhYi1yaWdodFwiO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSBkaXN0YW5jZSBvbiB0aGUgdG9wIHNpZGUgZnJvbSB0aGUgcGFyZW50J3MgY29udGFpbmVyIGlmIHRoZSB0YWIgaXMgYWN0aXZlLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgVGFic0luZGljYXRvckNzc1ZhcnNbXCJhY3RpdmVUYWJUb3BcIl0gPSBcIi0tYWN0aXZlLXRhYi10b3BcIjtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZGlzdGFuY2Ugb24gdGhlIGJvdHRvbSBzaWRlIGZyb20gdGhlIHBhcmVudCdzIGNvbnRhaW5lciBpZiB0aGUgdGFiIGlzIGFjdGl2ZS5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIFRhYnNJbmRpY2F0b3JDc3NWYXJzW1wiYWN0aXZlVGFiQm90dG9tXCJdID0gXCItLWFjdGl2ZS10YWItYm90dG9tXCI7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIHdpZHRoIG9mIHRoZSB0YWIgaWYgaXQgaXMgYWN0aXZlLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgVGFic0luZGljYXRvckNzc1ZhcnNbXCJhY3RpdmVUYWJXaWR0aFwiXSA9IFwiLS1hY3RpdmUtdGFiLXdpZHRoXCI7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIGhlaWdodCBvZiB0aGUgdGFiIGlmIGl0IGlzIGFjdGl2ZS5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIFRhYnNJbmRpY2F0b3JDc3NWYXJzW1wiYWN0aXZlVGFiSGVpZ2h0XCJdID0gXCItLWFjdGl2ZS10YWItaGVpZ2h0XCI7XG4gIHJldHVybiBUYWJzSW5kaWNhdG9yQ3NzVmFycztcbn0oe30pOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlRm9yY2VkUmVyZW5kZXJpbmcgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VGb3JjZWRSZXJlbmRlcmluZyc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBnZXRDc3NEaW1lbnNpb25zIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2dldENzc0RpbWVuc2lvbnMuanNcIjtcbmltcG9ydCB7IHVzZUlzSHlkcmF0aW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3VzZUlzSHlkcmF0aW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VUYWJzUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9UYWJzUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHRhYnNTdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nIH0gZnJvbSBcIi4uL3Jvb3Qvc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgdXNlVGFic0xpc3RDb250ZXh0IH0gZnJvbSBcIi4uL2xpc3QvVGFic0xpc3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBzY3JpcHQgYXMgcHJlaHlkcmF0aW9uU2NyaXB0IH0gZnJvbSBcIi4vcHJlaHlkcmF0aW9uU2NyaXB0Lm1pbi5qc1wiO1xuaW1wb3J0IHsgVGFic0luZGljYXRvckNzc1ZhcnMgfSBmcm9tIFwiLi9UYWJzSW5kaWNhdG9yQ3NzVmFycy5qc1wiO1xuaW1wb3J0IHsgdXNlQ1NQQ29udGV4dCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3NwLWNvbnRleHQvQ1NQQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsganN4IGFzIF9qc3gsIGpzeHMgYXMgX2pzeHMgfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIC4uLnRhYnNTdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLFxuICBhY3RpdmVUYWJQb3NpdGlvbjogKCkgPT4gbnVsbCxcbiAgYWN0aXZlVGFiU2l6ZTogKCkgPT4gbnVsbFxufTtcblxuLyoqXG4gKiBBIHZpc3VhbCBpbmRpY2F0b3IgdGhhdCBjYW4gYmUgc3R5bGVkIHRvIG1hdGNoIHRoZSBwb3NpdGlvbiBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSB0YWIuXG4gKiBSZW5kZXJzIGEgYDxzcGFuPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBUYWJzXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvdGFicylcbiAqL1xuZXhwb3J0IGNvbnN0IFRhYnNJbmRpY2F0b3IgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBUYWJzSW5kaWNhdG9yKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIGNsYXNzTmFtZSxcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyQmVmb3JlSHlkcmF0aW9uID0gZmFsc2UsXG4gICAgc3R5bGU6IHN0eWxlUHJvcCxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgbm9uY2VcbiAgfSA9IHVzZUNTUENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIGdldFRhYkVsZW1lbnRCeVNlbGVjdGVkVmFsdWUsXG4gICAgb3JpZW50YXRpb24sXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvbixcbiAgICB2YWx1ZVxuICB9ID0gdXNlVGFic1Jvb3RDb250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICB0YWJzTGlzdEVsZW1lbnQsXG4gICAgcmVnaXN0ZXJJbmRpY2F0b3JVcGRhdGVMaXN0ZW5lclxuICB9ID0gdXNlVGFic0xpc3RDb250ZXh0KCk7XG4gIGNvbnN0IGlzSHlkcmF0aW5nID0gdXNlSXNIeWRyYXRpbmcoKTtcbiAgY29uc3QgcmVyZW5kZXIgPSB1c2VGb3JjZWRSZXJlbmRlcmluZygpO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiByZWdpc3RlckluZGljYXRvclVwZGF0ZUxpc3RlbmVyKHJlcmVuZGVyKTtcbiAgfSwgW3JlZ2lzdGVySW5kaWNhdG9yVXBkYXRlTGlzdGVuZXIsIHJlcmVuZGVyXSk7XG4gIGxldCBsZWZ0ID0gMDtcbiAgbGV0IHJpZ2h0ID0gMDtcbiAgbGV0IHRvcCA9IDA7XG4gIGxldCBib3R0b20gPSAwO1xuICBsZXQgd2lkdGggPSAwO1xuICBsZXQgaGVpZ2h0ID0gMDtcbiAgbGV0IGlzVGFiU2VsZWN0ZWQgPSBmYWxzZTtcbiAgaWYgKHZhbHVlICE9IG51bGwgJiYgdGFic0xpc3RFbGVtZW50ICE9IG51bGwpIHtcbiAgICBjb25zdCBhY3RpdmVUYWIgPSBnZXRUYWJFbGVtZW50QnlTZWxlY3RlZFZhbHVlKHZhbHVlKTtcbiAgICBpc1RhYlNlbGVjdGVkID0gdHJ1ZTtcbiAgICBpZiAoYWN0aXZlVGFiICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgd2lkdGg6IGNvbXB1dGVkV2lkdGgsXG4gICAgICAgIGhlaWdodDogY29tcHV0ZWRIZWlnaHRcbiAgICAgIH0gPSBnZXRDc3NEaW1lbnNpb25zKGFjdGl2ZVRhYik7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHdpZHRoOiB0YWJMaXN0V2lkdGgsXG4gICAgICAgIGhlaWdodDogdGFiTGlzdEhlaWdodFxuICAgICAgfSA9IGdldENzc0RpbWVuc2lvbnModGFic0xpc3RFbGVtZW50KTtcbiAgICAgIGNvbnN0IHRhYlJlY3QgPSBhY3RpdmVUYWIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB0YWJzTGlzdFJlY3QgPSB0YWJzTGlzdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBzY2FsZVggPSB0YWJMaXN0V2lkdGggPiAwID8gdGFic0xpc3RSZWN0LndpZHRoIC8gdGFiTGlzdFdpZHRoIDogMTtcbiAgICAgIGNvbnN0IHNjYWxlWSA9IHRhYkxpc3RIZWlnaHQgPiAwID8gdGFic0xpc3RSZWN0LmhlaWdodCAvIHRhYkxpc3RIZWlnaHQgOiAxO1xuICAgICAgY29uc3QgaGFzTm9uWmVyb1NjYWxlID0gTWF0aC5hYnMoc2NhbGVYKSA+IE51bWJlci5FUFNJTE9OICYmIE1hdGguYWJzKHNjYWxlWSkgPiBOdW1iZXIuRVBTSUxPTjtcbiAgICAgIGlmIChoYXNOb25aZXJvU2NhbGUpIHtcbiAgICAgICAgY29uc3QgdGFiTGVmdERlbHRhID0gdGFiUmVjdC5sZWZ0IC0gdGFic0xpc3RSZWN0LmxlZnQ7XG4gICAgICAgIGNvbnN0IHRhYlRvcERlbHRhID0gdGFiUmVjdC50b3AgLSB0YWJzTGlzdFJlY3QudG9wO1xuICAgICAgICBsZWZ0ID0gdGFiTGVmdERlbHRhIC8gc2NhbGVYICsgdGFic0xpc3RFbGVtZW50LnNjcm9sbExlZnQgLSB0YWJzTGlzdEVsZW1lbnQuY2xpZW50TGVmdDtcbiAgICAgICAgdG9wID0gdGFiVG9wRGVsdGEgLyBzY2FsZVkgKyB0YWJzTGlzdEVsZW1lbnQuc2Nyb2xsVG9wIC0gdGFic0xpc3RFbGVtZW50LmNsaWVudFRvcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxlZnQgPSBhY3RpdmVUYWIub2Zmc2V0TGVmdDtcbiAgICAgICAgdG9wID0gYWN0aXZlVGFiLm9mZnNldFRvcDtcbiAgICAgIH1cbiAgICAgIHdpZHRoID0gY29tcHV0ZWRXaWR0aDtcbiAgICAgIGhlaWdodCA9IGNvbXB1dGVkSGVpZ2h0O1xuICAgICAgcmlnaHQgPSB0YWJzTGlzdEVsZW1lbnQuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG4gICAgICBib3R0b20gPSB0YWJzTGlzdEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuICAgIH1cbiAgfVxuICBjb25zdCBhY3RpdmVUYWJQb3NpdGlvbiA9IGlzVGFiU2VsZWN0ZWQgPyB7XG4gICAgbGVmdCxcbiAgICByaWdodCxcbiAgICB0b3AsXG4gICAgYm90dG9tXG4gIH0gOiBudWxsO1xuICBjb25zdCBhY3RpdmVUYWJTaXplID0gaXNUYWJTZWxlY3RlZCA/IHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHRcbiAgfSA6IG51bGw7XG4gIGNvbnN0IHN0eWxlID0gaXNUYWJTZWxlY3RlZCA/IHtcbiAgICBbVGFic0luZGljYXRvckNzc1ZhcnMuYWN0aXZlVGFiTGVmdF06IGAke2xlZnR9cHhgLFxuICAgIFtUYWJzSW5kaWNhdG9yQ3NzVmFycy5hY3RpdmVUYWJSaWdodF06IGAke3JpZ2h0fXB4YCxcbiAgICBbVGFic0luZGljYXRvckNzc1ZhcnMuYWN0aXZlVGFiVG9wXTogYCR7dG9wfXB4YCxcbiAgICBbVGFic0luZGljYXRvckNzc1ZhcnMuYWN0aXZlVGFiQm90dG9tXTogYCR7Ym90dG9tfXB4YCxcbiAgICBbVGFic0luZGljYXRvckNzc1ZhcnMuYWN0aXZlVGFiV2lkdGhdOiBgJHt3aWR0aH1weGAsXG4gICAgW1RhYnNJbmRpY2F0b3JDc3NWYXJzLmFjdGl2ZVRhYkhlaWdodF06IGAke2hlaWdodH1weGBcbiAgfSA6IHVuZGVmaW5lZDtcbiAgY29uc3QgZGlzcGxheUluZGljYXRvciA9IGlzVGFiU2VsZWN0ZWQgJiYgd2lkdGggPiAwICYmIGhlaWdodCA+IDA7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIG9yaWVudGF0aW9uLFxuICAgIGFjdGl2ZVRhYlBvc2l0aW9uLFxuICAgIGFjdGl2ZVRhYlNpemUsXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvblxuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnc3BhbicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IFt7XG4gICAgICByb2xlOiAncHJlc2VudGF0aW9uJyxcbiAgICAgIHN0eWxlLFxuICAgICAgaGlkZGVuOiAhZGlzcGxheUluZGljYXRvciAvLyBkbyBub3QgZGlzcGxheSB0aGUgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbGF5b3V0IGlzIHNldHRsZWRcbiAgICB9LCBlbGVtZW50UHJvcHMsIHtcbiAgICAgIHN1cHByZXNzSHlkcmF0aW9uV2FybmluZzogdHJ1ZVxuICAgIH1dLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmdcbiAgfSk7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4cyhSZWFjdC5GcmFnbWVudCwge1xuICAgIGNoaWxkcmVuOiBbZWxlbWVudCwgaXNIeWRyYXRpbmcgJiYgcmVuZGVyQmVmb3JlSHlkcmF0aW9uICYmIC8qI19fUFVSRV9fKi9fanN4KFwic2NyaXB0XCIsIHtcbiAgICAgIG5vbmNlOiBub25jZVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0L25vLWRhbmdlclxuICAgICAgLFxuICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHtcbiAgICAgICAgX19odG1sOiBwcmVoeWRyYXRpb25TY3JpcHRcbiAgICAgIH0sXG4gICAgICBzdXBwcmVzc0h5ZHJhdGlvbldhcm5pbmc6IHRydWVcbiAgICB9KV1cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFRhYnNJbmRpY2F0b3IuZGlzcGxheU5hbWUgPSBcIlRhYnNJbmRpY2F0b3JcIjsiLCJpbXBvcnQgeyBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcbmV4cG9ydCBsZXQgVGFic1BhbmVsRGF0YUF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoVGFic1BhbmVsRGF0YUF0dHJpYnV0ZXMpIHtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgaW5kZXggb2YgdGhlIHRhYiBwYW5lbC5cbiAgICovXG4gIFRhYnNQYW5lbERhdGFBdHRyaWJ1dGVzW1wiaW5kZXhcIl0gPSBcImRhdGEtaW5kZXhcIjtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZGlyZWN0aW9uIG9mIHRoZSBhY3RpdmF0aW9uIChiYXNlZCBvbiB0aGUgcHJldmlvdXMgYWN0aXZlIHRhYikuXG4gICAqIEB0eXBlIHsnbGVmdCcgfCAncmlnaHQnIHwgJ3VwJyB8ICdkb3duJyB8ICdub25lJ31cbiAgICovXG4gIFRhYnNQYW5lbERhdGFBdHRyaWJ1dGVzW1wiYWN0aXZhdGlvbkRpcmVjdGlvblwiXSA9IFwiZGF0YS1hY3RpdmF0aW9uLWRpcmVjdGlvblwiO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgdGFicy5cbiAgICogQHR5cGUgeydob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCd9XG4gICAqL1xuICBUYWJzUGFuZWxEYXRhQXR0cmlidXRlc1tcIm9yaWVudGF0aW9uXCJdID0gXCJkYXRhLW9yaWVudGF0aW9uXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIHBhbmVsIGlzIGhpZGRlbi5cbiAgICovXG4gIFRhYnNQYW5lbERhdGFBdHRyaWJ1dGVzW1wiaGlkZGVuXCJdID0gXCJkYXRhLWhpZGRlblwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBwYW5lbCBpcyBhbmltYXRpbmcgaW4uXG4gICAqL1xuICBUYWJzUGFuZWxEYXRhQXR0cmlidXRlc1tUYWJzUGFuZWxEYXRhQXR0cmlidXRlc1tcInN0YXJ0aW5nU3R5bGVcIl0gPSBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMuc3RhcnRpbmdTdHlsZV0gPSBcInN0YXJ0aW5nU3R5bGVcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgcGFuZWwgaXMgYW5pbWF0aW5nIG91dC5cbiAgICovXG4gIFRhYnNQYW5lbERhdGFBdHRyaWJ1dGVzW1RhYnNQYW5lbERhdGFBdHRyaWJ1dGVzW1wiZW5kaW5nU3R5bGVcIl0gPSBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMuZW5kaW5nU3R5bGVdID0gXCJlbmRpbmdTdHlsZVwiO1xuICByZXR1cm4gVGFic1BhbmVsRGF0YUF0dHJpYnV0ZXM7XG59KHt9KTsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGluZXJ0VmFsdWUgfSBmcm9tICdAYmFzZS11aS91dGlscy9pbmVydFZhbHVlJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VCYXNlVWlJZCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlQmFzZVVpSWQuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VPcGVuQ2hhbmdlQ29tcGxldGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qc1wiO1xuaW1wb3J0IHsgdXNlVHJhbnNpdGlvblN0YXR1cyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlVHJhbnNpdGlvblN0YXR1cy5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQ29tcG9zaXRlTGlzdEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9saXN0L3VzZUNvbXBvc2l0ZUxpc3RJdGVtLmpzXCI7XG5pbXBvcnQgeyB0YWJzU3RhdGVBdHRyaWJ1dGVzTWFwcGluZyB9IGZyb20gXCIuLi9yb290L3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVRhYnNSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1RhYnNSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgVGFic1BhbmVsRGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi9UYWJzUGFuZWxEYXRhQXR0cmlidXRlcy5qc1wiO1xuY29uc3Qgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyA9IHtcbiAgLi4udGFic1N0YXRlQXR0cmlidXRlc01hcHBpbmcsXG4gIC4uLnRyYW5zaXRpb25TdGF0dXNNYXBwaW5nXG59O1xuXG4vKipcbiAqIEEgcGFuZWwgZGlzcGxheWVkIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgdGFiIGlzIGFjdGl2ZS5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgVGFic10oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3RhYnMpXG4gKi9cbmV4cG9ydCBjb25zdCBUYWJzUGFuZWwgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBUYWJzUGFuZWwoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgY2xhc3NOYW1lLFxuICAgIHZhbHVlLFxuICAgIHJlbmRlcixcbiAgICBrZWVwTW91bnRlZCA9IGZhbHNlLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICB2YWx1ZTogc2VsZWN0ZWRWYWx1ZSxcbiAgICBnZXRUYWJJZEJ5UGFuZWxWYWx1ZSxcbiAgICBvcmllbnRhdGlvbixcbiAgICB0YWJBY3RpdmF0aW9uRGlyZWN0aW9uLFxuICAgIHJlZ2lzdGVyTW91bnRlZFRhYlBhbmVsLFxuICAgIHVucmVnaXN0ZXJNb3VudGVkVGFiUGFuZWxcbiAgfSA9IHVzZVRhYnNSb290Q29udGV4dCgpO1xuICBjb25zdCBpZCA9IHVzZUJhc2VVaUlkKCk7XG4gIGNvbnN0IG1ldGFkYXRhID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGlkLFxuICAgIHZhbHVlXG4gIH0pLCBbaWQsIHZhbHVlXSk7XG4gIGNvbnN0IHtcbiAgICByZWY6IGxpc3RJdGVtUmVmLFxuICAgIGluZGV4XG4gIH0gPSB1c2VDb21wb3NpdGVMaXN0SXRlbSh7XG4gICAgbWV0YWRhdGFcbiAgfSk7XG4gIGNvbnN0IG9wZW4gPSB2YWx1ZSA9PT0gc2VsZWN0ZWRWYWx1ZTtcbiAgY29uc3Qge1xuICAgIG1vdW50ZWQsXG4gICAgdHJhbnNpdGlvblN0YXR1cyxcbiAgICBzZXRNb3VudGVkXG4gIH0gPSB1c2VUcmFuc2l0aW9uU3RhdHVzKG9wZW4pO1xuICBjb25zdCBoaWRkZW4gPSAhbW91bnRlZDtcbiAgY29uc3QgY29ycmVzcG9uZGluZ1RhYklkID0gZ2V0VGFiSWRCeVBhbmVsVmFsdWUodmFsdWUpO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBoaWRkZW4sXG4gICAgb3JpZW50YXRpb24sXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvbixcbiAgICB0cmFuc2l0aW9uU3RhdHVzXG4gIH07XG4gIGNvbnN0IHBhbmVsUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IFtmb3J3YXJkZWRSZWYsIGxpc3RJdGVtUmVmLCBwYW5lbFJlZl0sXG4gICAgcHJvcHM6IFt7XG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogY29ycmVzcG9uZGluZ1RhYklkLFxuICAgICAgaGlkZGVuLFxuICAgICAgaWQsXG4gICAgICByb2xlOiAndGFicGFuZWwnLFxuICAgICAgdGFiSW5kZXg6IG9wZW4gPyAwIDogLTEsXG4gICAgICBpbmVydDogaW5lcnRWYWx1ZSghb3BlbiksXG4gICAgICBbVGFic1BhbmVsRGF0YUF0dHJpYnV0ZXMuaW5kZXhdOiBpbmRleFxuICAgIH0sIGVsZW1lbnRQcm9wc10sXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZ1xuICB9KTtcbiAgdXNlT3BlbkNoYW5nZUNvbXBsZXRlKHtcbiAgICBvcGVuLFxuICAgIHJlZjogcGFuZWxSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmICghb3Blbikge1xuICAgICAgICBzZXRNb3VudGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoaWRkZW4gJiYgIWtlZXBNb3VudGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmVnaXN0ZXJNb3VudGVkVGFiUGFuZWwodmFsdWUsIGlkKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdW5yZWdpc3Rlck1vdW50ZWRUYWJQYW5lbCh2YWx1ZSwgaWQpO1xuICAgIH07XG4gIH0sIFtoaWRkZW4sIGtlZXBNb3VudGVkLCB2YWx1ZSwgaWQsIHJlZ2lzdGVyTW91bnRlZFRhYlBhbmVsLCB1bnJlZ2lzdGVyTW91bnRlZFRhYlBhbmVsXSk7XG4gIGNvbnN0IHNob3VsZFJlbmRlciA9IGtlZXBNb3VudGVkIHx8IG1vdW50ZWQ7XG4gIGlmICghc2hvdWxkUmVuZGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFRhYnNQYW5lbC5kaXNwbGF5TmFtZSA9IFwiVGFic1BhbmVsXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBpc0VsZW1lbnREaXNhYmxlZCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2lzRWxlbWVudERpc2FibGVkJztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlTWVyZ2VkUmVmcyB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZU1lcmdlZFJlZnMnO1xuaW1wb3J0IHsgQ09NUE9TSVRFX0tFWVMsIEFSUk9XX0RPV04sIEFSUk9XX0tFWVMsIEFSUk9XX0xFRlQsIEFSUk9XX1JJR0hULCBBUlJPV19VUCwgRU5ELCBIT01FLCBIT1JJWk9OVEFMX0tFWVMsIEhPUklaT05UQUxfS0VZU19XSVRIX0VYVFJBX0tFWVMsIE1PRElGSUVSX0tFWVMsIFZFUlRJQ0FMX0tFWVMsIFZFUlRJQ0FMX0tFWVNfV0lUSF9FWFRSQV9LRVlTLCBjcmVhdGVHcmlkQ2VsbE1hcCwgZmluZE5vbkRpc2FibGVkTGlzdEluZGV4LCBnZXRHcmlkQ2VsbEluZGV4T2ZDb3JuZXIsIGdldEdyaWRDZWxsSW5kaWNlcywgZ2V0R3JpZE5hdmlnYXRlZEluZGV4LCBnZXRNYXhMaXN0SW5kZXgsIGdldE1pbkxpc3RJbmRleCwgaXNMaXN0SW5kZXhEaXNhYmxlZCwgaXNJbmRleE91dE9mTGlzdEJvdW5kcywgaXNOYXRpdmVJbnB1dCwgc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCB9IGZyb20gXCIuLi9jb21wb3NpdGUuanNcIjtcbmltcG9ydCB7IEFDVElWRV9DT01QT1NJVEVfSVRFTSB9IGZyb20gXCIuLi9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IGdldFRhcmdldCB9IGZyb20gXCIuLi8uLi8uLi9mbG9hdGluZy11aS1yZWFjdC91dGlscy5qc1wiO1xuY29uc3QgRU1QVFlfQVJSQVkgPSBbXTtcbmV4cG9ydCBmdW5jdGlvbiB1c2VDb21wb3NpdGVSb290KHBhcmFtcykge1xuICBjb25zdCB7XG4gICAgaXRlbVNpemVzLFxuICAgIGNvbHMgPSAxLFxuICAgIGxvb3BGb2N1cyA9IHRydWUsXG4gICAgb25Mb29wLFxuICAgIGRlbnNlID0gZmFsc2UsXG4gICAgb3JpZW50YXRpb24gPSAnYm90aCcsXG4gICAgZGlyZWN0aW9uLFxuICAgIGhpZ2hsaWdodGVkSW5kZXg6IGV4dGVybmFsSGlnaGxpZ2h0ZWRJbmRleCxcbiAgICBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2U6IGV4dGVybmFsU2V0SGlnaGxpZ2h0ZWRJbmRleCxcbiAgICByb290UmVmOiBleHRlcm5hbFJlZixcbiAgICBlbmFibGVIb21lQW5kRW5kS2V5cyA9IGZhbHNlLFxuICAgIHN0b3BFdmVudFByb3BhZ2F0aW9uID0gZmFsc2UsXG4gICAgZGlzYWJsZWRJbmRpY2VzLFxuICAgIG1vZGlmaWVyS2V5cyA9IEVNUFRZX0FSUkFZXG4gIH0gPSBwYXJhbXM7XG4gIGNvbnN0IFtpbnRlcm5hbEhpZ2hsaWdodGVkSW5kZXgsIGludGVybmFsU2V0SGlnaGxpZ2h0ZWRJbmRleF0gPSBSZWFjdC51c2VTdGF0ZSgwKTtcbiAgY29uc3QgaXNHcmlkID0gY29scyA+IDE7XG4gIGNvbnN0IHJvb3RSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IG1lcmdlZFJlZiA9IHVzZU1lcmdlZFJlZnMocm9vdFJlZiwgZXh0ZXJuYWxSZWYpO1xuICBjb25zdCBlbGVtZW50c1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIGNvbnN0IGhhc1NldERlZmF1bHRJbmRleFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhpZ2hsaWdodGVkSW5kZXggPSBleHRlcm5hbEhpZ2hsaWdodGVkSW5kZXggPz8gaW50ZXJuYWxIaWdobGlnaHRlZEluZGV4O1xuICBjb25zdCBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2UgPSB1c2VTdGFibGVDYWxsYmFjaygoaW5kZXgsIHNob3VsZFNjcm9sbEludG9WaWV3ID0gZmFsc2UpID0+IHtcbiAgICAoZXh0ZXJuYWxTZXRIaWdobGlnaHRlZEluZGV4ID8/IGludGVybmFsU2V0SGlnaGxpZ2h0ZWRJbmRleCkoaW5kZXgpO1xuICAgIGlmIChzaG91bGRTY3JvbGxJbnRvVmlldykge1xuICAgICAgY29uc3QgbmV3QWN0aXZlSXRlbSA9IGVsZW1lbnRzUmVmLmN1cnJlbnRbaW5kZXhdO1xuICAgICAgc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChyb290UmVmLmN1cnJlbnQsIG5ld0FjdGl2ZUl0ZW0sIGRpcmVjdGlvbiwgb3JpZW50YXRpb24pO1xuICAgIH1cbiAgfSk7XG4gIGNvbnN0IG9uTWFwQ2hhbmdlID0gdXNlU3RhYmxlQ2FsbGJhY2sobWFwID0+IHtcbiAgICBpZiAobWFwLnNpemUgPT09IDAgfHwgaGFzU2V0RGVmYXVsdEluZGV4UmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFzU2V0RGVmYXVsdEluZGV4UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIGNvbnN0IHNvcnRlZEVsZW1lbnRzID0gQXJyYXkuZnJvbShtYXAua2V5cygpKTtcbiAgICBjb25zdCBhY3RpdmVJdGVtID0gc29ydGVkRWxlbWVudHMuZmluZChjb21wb3NpdGVFbGVtZW50ID0+IGNvbXBvc2l0ZUVsZW1lbnQ/Lmhhc0F0dHJpYnV0ZShBQ1RJVkVfQ09NUE9TSVRFX0lURU0pKSA/PyBudWxsO1xuICAgIC8vIFNldCB0aGUgZGVmYXVsdCBoaWdobGlnaHRlZCBpbmRleCBvZiBhbiBhcmJpdHJhcnkgY29tcG9zaXRlIGl0ZW0uXG4gICAgY29uc3QgYWN0aXZlSW5kZXggPSBhY3RpdmVJdGVtID8gc29ydGVkRWxlbWVudHMuaW5kZXhPZihhY3RpdmVJdGVtKSA6IC0xO1xuICAgIGlmIChhY3RpdmVJbmRleCAhPT0gLTEpIHtcbiAgICAgIG9uSGlnaGxpZ2h0ZWRJbmRleENoYW5nZShhY3RpdmVJbmRleCk7XG4gICAgfVxuICAgIHNjcm9sbEludG9WaWV3SWZOZWVkZWQocm9vdFJlZi5jdXJyZW50LCBhY3RpdmVJdGVtLCBkaXJlY3Rpb24sIG9yaWVudGF0aW9uKTtcbiAgfSk7XG4gIGNvbnN0IHdyYXBwZWRPbkxvb3AgPSB1c2VTdGFibGVDYWxsYmFjaygoZXZlbnQsIHByZXZJbmRleCwgbmV4dEluZGV4KSA9PiB7XG4gICAgaWYgKCFvbkxvb3ApIHtcbiAgICAgIHJldHVybiBuZXh0SW5kZXg7XG4gICAgfVxuICAgIHJldHVybiBvbkxvb3A/LihldmVudCwgcHJldkluZGV4LCBuZXh0SW5kZXgsIGVsZW1lbnRzUmVmKTtcbiAgfSk7XG4gIGNvbnN0IHByb3BzID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgICdhcmlhLW9yaWVudGF0aW9uJzogb3JpZW50YXRpb24gPT09ICdib3RoJyA/IHVuZGVmaW5lZCA6IG9yaWVudGF0aW9uLFxuICAgIHJlZjogbWVyZ2VkUmVmLFxuICAgIG9uRm9jdXMoZXZlbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSByb290UmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQubmF0aXZlRXZlbnQpO1xuICAgICAgaWYgKCFlbGVtZW50IHx8IHRhcmdldCA9PSBudWxsIHx8ICFpc05hdGl2ZUlucHV0KHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGFyZ2V0LnNldFNlbGVjdGlvblJhbmdlKDAsIHRhcmdldC52YWx1ZS5sZW5ndGggPz8gMCk7XG4gICAgfSxcbiAgICBvbktleURvd24oZXZlbnQpIHtcbiAgICAgIGNvbnN0IFJFTEVWQU5UX0tFWVMgPSBlbmFibGVIb21lQW5kRW5kS2V5cyA/IENPTVBPU0lURV9LRVlTIDogQVJST1dfS0VZUztcbiAgICAgIGlmICghUkVMRVZBTlRfS0VZUy5oYXMoZXZlbnQua2V5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaXNNb2RpZmllcktleVNldChldmVudCwgbW9kaWZpZXJLZXlzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBlbGVtZW50ID0gcm9vdFJlZi5jdXJyZW50O1xuICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlzUnRsID0gZGlyZWN0aW9uID09PSAncnRsJztcbiAgICAgIGNvbnN0IGhvcml6b250YWxGb3J3YXJkS2V5ID0gaXNSdGwgPyBBUlJPV19MRUZUIDogQVJST1dfUklHSFQ7XG4gICAgICBjb25zdCBmb3J3YXJkS2V5ID0ge1xuICAgICAgICBob3Jpem9udGFsOiBob3Jpem9udGFsRm9yd2FyZEtleSxcbiAgICAgICAgdmVydGljYWw6IEFSUk9XX0RPV04sXG4gICAgICAgIGJvdGg6IGhvcml6b250YWxGb3J3YXJkS2V5XG4gICAgICB9W29yaWVudGF0aW9uXTtcbiAgICAgIGNvbnN0IGhvcml6b250YWxCYWNrd2FyZEtleSA9IGlzUnRsID8gQVJST1dfUklHSFQgOiBBUlJPV19MRUZUO1xuICAgICAgY29uc3QgYmFja3dhcmRLZXkgPSB7XG4gICAgICAgIGhvcml6b250YWw6IGhvcml6b250YWxCYWNrd2FyZEtleSxcbiAgICAgICAgdmVydGljYWw6IEFSUk9XX1VQLFxuICAgICAgICBib3RoOiBob3Jpem9udGFsQmFja3dhcmRLZXlcbiAgICAgIH1bb3JpZW50YXRpb25dO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50Lm5hdGl2ZUV2ZW50KTtcbiAgICAgIGlmICh0YXJnZXQgIT0gbnVsbCAmJiBpc05hdGl2ZUlucHV0KHRhcmdldCkgJiYgIWlzRWxlbWVudERpc2FibGVkKHRhcmdldCkpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uU3RhcnQgPSB0YXJnZXQuc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbkVuZCA9IHRhcmdldC5zZWxlY3Rpb25FbmQ7XG4gICAgICAgIGNvbnN0IHRleHRDb250ZW50ID0gdGFyZ2V0LnZhbHVlID8/ICcnO1xuICAgICAgICAvLyByZXR1cm4gdG8gbmF0aXZlIHRleHRib3ggYmVoYXZpb3Igd2hlblxuICAgICAgICAvLyAxIC0gU2hpZnQgaXMgaGVsZCB0byBtYWtlIGEgdGV4dCBzZWxlY3Rpb24sIG9yIGlmIHRoZXJlIGFscmVhZHkgaXMgYSB0ZXh0IHNlbGVjdGlvblxuICAgICAgICBpZiAoc2VsZWN0aW9uU3RhcnQgPT0gbnVsbCB8fCBldmVudC5zaGlmdEtleSB8fCBzZWxlY3Rpb25TdGFydCAhPT0gc2VsZWN0aW9uRW5kKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIDIgLSBhcnJvdy1pbmcgZm9yd2FyZCBhbmQgbm90IGluIHRoZSBsYXN0IHBvc2l0aW9uIG9mIHRoZSB0ZXh0XG4gICAgICAgIGlmIChldmVudC5rZXkgIT09IGJhY2t3YXJkS2V5ICYmIHNlbGVjdGlvblN0YXJ0IDwgdGV4dENvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMgLWFycm93LWluZyBiYWNrd2FyZCBhbmQgbm90IGluIHRoZSBmaXJzdCBwb3NpdGlvbiBvZiB0aGUgdGV4dFxuICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBmb3J3YXJkS2V5ICYmIHNlbGVjdGlvblN0YXJ0ID4gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IG5leHRJbmRleCA9IGhpZ2hsaWdodGVkSW5kZXg7XG4gICAgICBjb25zdCBtaW5JbmRleCA9IGdldE1pbkxpc3RJbmRleChlbGVtZW50c1JlZiwgZGlzYWJsZWRJbmRpY2VzKTtcbiAgICAgIGNvbnN0IG1heEluZGV4ID0gZ2V0TWF4TGlzdEluZGV4KGVsZW1lbnRzUmVmLCBkaXNhYmxlZEluZGljZXMpO1xuICAgICAgaWYgKGlzR3JpZCkge1xuICAgICAgICBjb25zdCBzaXplcyA9IGl0ZW1TaXplcyB8fCBBcnJheS5mcm9tKHtcbiAgICAgICAgICBsZW5ndGg6IGVsZW1lbnRzUmVmLmN1cnJlbnQubGVuZ3RoXG4gICAgICAgIH0sICgpID0+ICh7XG4gICAgICAgICAgd2lkdGg6IDEsXG4gICAgICAgICAgaGVpZ2h0OiAxXG4gICAgICAgIH0pKTtcbiAgICAgICAgLy8gVG8gY2FsY3VsYXRlIG1vdmVtZW50cyBvbiB0aGUgZ3JpZCwgd2UgdXNlIGh5cG90aGV0aWNhbCBjZWxsIGluZGljZXNcbiAgICAgICAgLy8gYXMgaWYgZXZlcnkgaXRlbSB3YXMgMXgxLCB0aGVuIGNvbnZlcnQgYmFjayB0byByZWFsIGluZGljZXMuXG4gICAgICAgIGNvbnN0IGNlbGxNYXAgPSBjcmVhdGVHcmlkQ2VsbE1hcChzaXplcywgY29scywgZGVuc2UpO1xuICAgICAgICBjb25zdCBtaW5HcmlkSW5kZXggPSBjZWxsTWFwLmZpbmRJbmRleChpbmRleCA9PiBpbmRleCAhPSBudWxsICYmICFpc0xpc3RJbmRleERpc2FibGVkKGVsZW1lbnRzUmVmLmN1cnJlbnQsIGluZGV4LCBkaXNhYmxlZEluZGljZXMpKTtcbiAgICAgICAgLy8gbGFzdCBlbmFibGVkIGluZGV4XG4gICAgICAgIGNvbnN0IG1heEdyaWRJbmRleCA9IGNlbGxNYXAucmVkdWNlKChmb3VuZEluZGV4LCBpbmRleCwgY2VsbEluZGV4KSA9PiBpbmRleCAhPSBudWxsICYmICFpc0xpc3RJbmRleERpc2FibGVkKGVsZW1lbnRzUmVmLmN1cnJlbnQsIGluZGV4LCBkaXNhYmxlZEluZGljZXMpID8gY2VsbEluZGV4IDogZm91bmRJbmRleCwgLTEpO1xuICAgICAgICBuZXh0SW5kZXggPSBjZWxsTWFwW2dldEdyaWROYXZpZ2F0ZWRJbmRleChjZWxsTWFwLm1hcChpdGVtSW5kZXggPT4gaXRlbUluZGV4ICE9IG51bGwgPyBlbGVtZW50c1JlZi5jdXJyZW50W2l0ZW1JbmRleF0gOiBudWxsKSwge1xuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgIGxvb3BGb2N1cyxcbiAgICAgICAgICBvbkxvb3A6IHdyYXBwZWRPbkxvb3AsXG4gICAgICAgICAgY29scyxcbiAgICAgICAgICAvLyB0cmVhdCB1bmRlZmluZWQgKGVtcHR5IGdyaWQgc3BhY2VzKSBhcyBkaXNhYmxlZCBpbmRpY2VzIHNvIHdlXG4gICAgICAgICAgLy8gZG9uJ3QgZW5kIHVwIGluIHRoZW1cbiAgICAgICAgICBkaXNhYmxlZEluZGljZXM6IGdldEdyaWRDZWxsSW5kaWNlcyhbLi4uKGRpc2FibGVkSW5kaWNlcyB8fCBlbGVtZW50c1JlZi5jdXJyZW50Lm1hcCgoXywgaW5kZXgpID0+IGlzTGlzdEluZGV4RGlzYWJsZWQoZWxlbWVudHNSZWYuY3VycmVudCwgaW5kZXgpID8gaW5kZXggOiB1bmRlZmluZWQpKSwgdW5kZWZpbmVkXSwgY2VsbE1hcCksXG4gICAgICAgICAgbWluSW5kZXg6IG1pbkdyaWRJbmRleCxcbiAgICAgICAgICBtYXhJbmRleDogbWF4R3JpZEluZGV4LFxuICAgICAgICAgIHByZXZJbmRleDogZ2V0R3JpZENlbGxJbmRleE9mQ29ybmVyKGhpZ2hsaWdodGVkSW5kZXggPiBtYXhJbmRleCA/IG1pbkluZGV4IDogaGlnaGxpZ2h0ZWRJbmRleCwgc2l6ZXMsIGNlbGxNYXAsIGNvbHMsXG4gICAgICAgICAgLy8gdXNlIGEgY29ybmVyIG1hdGNoaW5nIHRoZSBlZGdlIGNsb3Nlc3QgdG8gdGhlIGRpcmVjdGlvbiB3ZSdyZVxuICAgICAgICAgIC8vIG1vdmluZyBpbiBzbyB3ZSBkb24ndCBlbmQgdXAgaW4gdGhlIHNhbWUgaXRlbS4gUHJlZmVyXG4gICAgICAgICAgLy8gdG9wL2xlZnQgb3ZlciBib3R0b20vcmlnaHQuXG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG4gICAgICAgICAgZXZlbnQua2V5ID09PSBBUlJPV19ET1dOID8gJ2JsJyA6IGV2ZW50LmtleSA9PT0gQVJST1dfUklHSFQgPyAndHInIDogJ3RsJyksXG4gICAgICAgICAgcnRsOiBpc1J0bFxuICAgICAgICB9KV07IC8vIG5hdmlnYXRlZCBjZWxsIHdpbGwgbmV2ZXIgYmUgbnVsbGlzaFxuICAgICAgfVxuICAgICAgY29uc3QgZm9yd2FyZEtleXMgPSB7XG4gICAgICAgIGhvcml6b250YWw6IFtob3Jpem9udGFsRm9yd2FyZEtleV0sXG4gICAgICAgIHZlcnRpY2FsOiBbQVJST1dfRE9XTl0sXG4gICAgICAgIGJvdGg6IFtob3Jpem9udGFsRm9yd2FyZEtleSwgQVJST1dfRE9XTl1cbiAgICAgIH1bb3JpZW50YXRpb25dO1xuICAgICAgY29uc3QgYmFja3dhcmRLZXlzID0ge1xuICAgICAgICBob3Jpem9udGFsOiBbaG9yaXpvbnRhbEJhY2t3YXJkS2V5XSxcbiAgICAgICAgdmVydGljYWw6IFtBUlJPV19VUF0sXG4gICAgICAgIGJvdGg6IFtob3Jpem9udGFsQmFja3dhcmRLZXksIEFSUk9XX1VQXVxuICAgICAgfVtvcmllbnRhdGlvbl07XG4gICAgICBjb25zdCBwcmV2ZW50ZWRLZXlzID0gaXNHcmlkID8gUkVMRVZBTlRfS0VZUyA6IHtcbiAgICAgICAgaG9yaXpvbnRhbDogZW5hYmxlSG9tZUFuZEVuZEtleXMgPyBIT1JJWk9OVEFMX0tFWVNfV0lUSF9FWFRSQV9LRVlTIDogSE9SSVpPTlRBTF9LRVlTLFxuICAgICAgICB2ZXJ0aWNhbDogZW5hYmxlSG9tZUFuZEVuZEtleXMgPyBWRVJUSUNBTF9LRVlTX1dJVEhfRVhUUkFfS0VZUyA6IFZFUlRJQ0FMX0tFWVMsXG4gICAgICAgIGJvdGg6IFJFTEVWQU5UX0tFWVNcbiAgICAgIH1bb3JpZW50YXRpb25dO1xuICAgICAgaWYgKGVuYWJsZUhvbWVBbmRFbmRLZXlzKSB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IEhPTUUpIHtcbiAgICAgICAgICBuZXh0SW5kZXggPSBtaW5JbmRleDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IEVORCkge1xuICAgICAgICAgIG5leHRJbmRleCA9IG1heEluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobmV4dEluZGV4ID09PSBoaWdobGlnaHRlZEluZGV4ICYmIChmb3J3YXJkS2V5cy5pbmNsdWRlcyhldmVudC5rZXkpIHx8IGJhY2t3YXJkS2V5cy5pbmNsdWRlcyhldmVudC5rZXkpKSkge1xuICAgICAgICBpZiAobG9vcEZvY3VzICYmIG5leHRJbmRleCA9PT0gbWF4SW5kZXggJiYgZm9yd2FyZEtleXMuaW5jbHVkZXMoZXZlbnQua2V5KSkge1xuICAgICAgICAgIG5leHRJbmRleCA9IG1pbkluZGV4O1xuICAgICAgICAgIGlmIChvbkxvb3ApIHtcbiAgICAgICAgICAgIG5leHRJbmRleCA9IG9uTG9vcChldmVudCwgaGlnaGxpZ2h0ZWRJbmRleCwgbmV4dEluZGV4LCBlbGVtZW50c1JlZik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxvb3BGb2N1cyAmJiBuZXh0SW5kZXggPT09IG1pbkluZGV4ICYmIGJhY2t3YXJkS2V5cy5pbmNsdWRlcyhldmVudC5rZXkpKSB7XG4gICAgICAgICAgbmV4dEluZGV4ID0gbWF4SW5kZXg7XG4gICAgICAgICAgaWYgKG9uTG9vcCkge1xuICAgICAgICAgICAgbmV4dEluZGV4ID0gb25Mb29wKGV2ZW50LCBoaWdobGlnaHRlZEluZGV4LCBuZXh0SW5kZXgsIGVsZW1lbnRzUmVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dEluZGV4ID0gZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGVsZW1lbnRzUmVmLmN1cnJlbnQsIHtcbiAgICAgICAgICAgIHN0YXJ0aW5nSW5kZXg6IG5leHRJbmRleCxcbiAgICAgICAgICAgIGRlY3JlbWVudDogYmFja3dhcmRLZXlzLmluY2x1ZGVzKGV2ZW50LmtleSksXG4gICAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG5leHRJbmRleCAhPT0gaGlnaGxpZ2h0ZWRJbmRleCAmJiAhaXNJbmRleE91dE9mTGlzdEJvdW5kcyhlbGVtZW50c1JlZi5jdXJyZW50LCBuZXh0SW5kZXgpKSB7XG4gICAgICAgIGlmIChzdG9wRXZlbnRQcm9wYWdhdGlvbikge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2ZW50ZWRLZXlzLmhhcyhldmVudC5rZXkpKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2UobmV4dEluZGV4LCB0cnVlKTtcblxuICAgICAgICAvLyBXYWl0IGZvciBGb2N1c01hbmFnZXIgYHJldHVybkZvY3VzYCB0byBleGVjdXRlLlxuICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgZWxlbWVudHNSZWYuY3VycmVudFtuZXh0SW5kZXhdPy5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pLCBbY29scywgZGVuc2UsIGRpcmVjdGlvbiwgZGlzYWJsZWRJbmRpY2VzLCBlbGVtZW50c1JlZiwgZW5hYmxlSG9tZUFuZEVuZEtleXMsIGhpZ2hsaWdodGVkSW5kZXgsIGlzR3JpZCwgaXRlbVNpemVzLCBsb29wRm9jdXMsIG9uTG9vcCwgd3JhcHBlZE9uTG9vcCwgbWVyZ2VkUmVmLCBtb2RpZmllcktleXMsIG9uSGlnaGxpZ2h0ZWRJbmRleENoYW5nZSwgb3JpZW50YXRpb24sIHN0b3BFdmVudFByb3BhZ2F0aW9uXSk7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgcHJvcHMsXG4gICAgaGlnaGxpZ2h0ZWRJbmRleCxcbiAgICBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2UsXG4gICAgZWxlbWVudHNSZWYsXG4gICAgZGlzYWJsZWRJbmRpY2VzLFxuICAgIG9uTWFwQ2hhbmdlLFxuICAgIHJlbGF5S2V5Ym9hcmRFdmVudDogcHJvcHMub25LZXlEb3duXG4gIH0pLCBbcHJvcHMsIGhpZ2hsaWdodGVkSW5kZXgsIG9uSGlnaGxpZ2h0ZWRJbmRleENoYW5nZSwgZWxlbWVudHNSZWYsIGRpc2FibGVkSW5kaWNlcywgb25NYXBDaGFuZ2VdKTtcbn1cbmZ1bmN0aW9uIGlzTW9kaWZpZXJLZXlTZXQoZXZlbnQsIGlnbm9yZWRNb2RpZmllcktleXMpIHtcbiAgZm9yIChjb25zdCBrZXkgb2YgTU9ESUZJRVJfS0VZUy52YWx1ZXMoKSkge1xuICAgIGlmIChpZ25vcmVkTW9kaWZpZXJLZXlzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZShrZXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgRU1QVFlfQVJSQVksIEVNUFRZX09CSkVDVCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2VtcHR5JztcbmltcG9ydCB7IENvbXBvc2l0ZUxpc3QgfSBmcm9tIFwiLi4vbGlzdC9Db21wb3NpdGVMaXN0LmpzXCI7XG5pbXBvcnQgeyB1c2VDb21wb3NpdGVSb290IH0gZnJvbSBcIi4vdXNlQ29tcG9zaXRlUm9vdC5qc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlUm9vdENvbnRleHQgfSBmcm9tIFwiLi9Db21wb3NpdGVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB1c2VEaXJlY3Rpb24gfSBmcm9tIFwiLi4vLi4vZGlyZWN0aW9uLWNvbnRleHQvRGlyZWN0aW9uQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsganN4IGFzIF9qc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBDb21wb3NpdGVSb290KGNvbXBvbmVudFByb3BzKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIHJlZnMgPSBFTVBUWV9BUlJBWSxcbiAgICBwcm9wcyA9IEVNUFRZX0FSUkFZLFxuICAgIHN0YXRlID0gRU1QVFlfT0JKRUNULFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmcsXG4gICAgaGlnaGxpZ2h0ZWRJbmRleDogaGlnaGxpZ2h0ZWRJbmRleFByb3AsXG4gICAgb25IaWdobGlnaHRlZEluZGV4Q2hhbmdlOiBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2VQcm9wLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGRlbnNlLFxuICAgIGl0ZW1TaXplcyxcbiAgICBsb29wRm9jdXMsXG4gICAgb25Mb29wLFxuICAgIGNvbHMsXG4gICAgZW5hYmxlSG9tZUFuZEVuZEtleXMsXG4gICAgb25NYXBDaGFuZ2U6IG9uTWFwQ2hhbmdlUHJvcCxcbiAgICBzdG9wRXZlbnRQcm9wYWdhdGlvbiA9IHRydWUsXG4gICAgcm9vdFJlZixcbiAgICBkaXNhYmxlZEluZGljZXMsXG4gICAgbW9kaWZpZXJLZXlzLFxuICAgIGhpZ2hsaWdodEl0ZW1PbkhvdmVyID0gZmFsc2UsXG4gICAgdGFnID0gJ2RpdicsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgZGlyZWN0aW9uID0gdXNlRGlyZWN0aW9uKCk7XG4gIGNvbnN0IHtcbiAgICBwcm9wczogZGVmYXVsdFByb3BzLFxuICAgIGhpZ2hsaWdodGVkSW5kZXgsXG4gICAgb25IaWdobGlnaHRlZEluZGV4Q2hhbmdlLFxuICAgIGVsZW1lbnRzUmVmLFxuICAgIG9uTWFwQ2hhbmdlOiBvbk1hcENoYW5nZVVud3JhcHBlZCxcbiAgICByZWxheUtleWJvYXJkRXZlbnRcbiAgfSA9IHVzZUNvbXBvc2l0ZVJvb3Qoe1xuICAgIGl0ZW1TaXplcyxcbiAgICBjb2xzLFxuICAgIGxvb3BGb2N1cyxcbiAgICBvbkxvb3AsXG4gICAgZGVuc2UsXG4gICAgb3JpZW50YXRpb24sXG4gICAgaGlnaGxpZ2h0ZWRJbmRleDogaGlnaGxpZ2h0ZWRJbmRleFByb3AsXG4gICAgb25IaWdobGlnaHRlZEluZGV4Q2hhbmdlOiBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2VQcm9wLFxuICAgIHJvb3RSZWYsXG4gICAgc3RvcEV2ZW50UHJvcGFnYXRpb24sXG4gICAgZW5hYmxlSG9tZUFuZEVuZEtleXMsXG4gICAgZGlyZWN0aW9uLFxuICAgIGRpc2FibGVkSW5kaWNlcyxcbiAgICBtb2RpZmllcktleXNcbiAgfSk7XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KHRhZywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IHJlZnMsXG4gICAgcHJvcHM6IFtkZWZhdWx0UHJvcHMsIC4uLnByb3BzLCBlbGVtZW50UHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmdcbiAgfSk7XG4gIGNvbnN0IGNvbnRleHRWYWx1ZSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICBoaWdobGlnaHRlZEluZGV4LFxuICAgIG9uSGlnaGxpZ2h0ZWRJbmRleENoYW5nZSxcbiAgICBoaWdobGlnaHRJdGVtT25Ib3ZlcixcbiAgICByZWxheUtleWJvYXJkRXZlbnRcbiAgfSksIFtoaWdobGlnaHRlZEluZGV4LCBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2UsIGhpZ2hsaWdodEl0ZW1PbkhvdmVyLCByZWxheUtleWJvYXJkRXZlbnRdKTtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KENvbXBvc2l0ZVJvb3RDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGNvbnRleHRWYWx1ZSxcbiAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3goQ29tcG9zaXRlTGlzdCwge1xuICAgICAgZWxlbWVudHNSZWY6IGVsZW1lbnRzUmVmLFxuICAgICAgb25NYXBDaGFuZ2U6IG5ld01hcCA9PiB7XG4gICAgICAgIG9uTWFwQ2hhbmdlUHJvcD8uKG5ld01hcCk7XG4gICAgICAgIG9uTWFwQ2hhbmdlVW53cmFwcGVkKG5ld01hcCk7XG4gICAgICB9LFxuICAgICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgICB9KVxuICB9KTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgRU1QVFlfQVJSQVkgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyBDb21wb3NpdGVSb290IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb21wb3NpdGUvcm9vdC9Db21wb3NpdGVSb290LmpzXCI7XG5pbXBvcnQgeyB0YWJzU3RhdGVBdHRyaWJ1dGVzTWFwcGluZyB9IGZyb20gXCIuLi9yb290L3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVRhYnNSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1RhYnNSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgVGFic0xpc3RDb250ZXh0IH0gZnJvbSBcIi4vVGFic0xpc3RDb250ZXh0LmpzXCI7XG5cbi8qKlxuICogR3JvdXBzIHRoZSBpbmRpdmlkdWFsIHRhYiBidXR0b25zLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBUYWJzXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvdGFicylcbiAqL1xuaW1wb3J0IHsganN4IGFzIF9qc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmV4cG9ydCBjb25zdCBUYWJzTGlzdCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFRhYnNMaXN0KGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIGFjdGl2YXRlT25Gb2N1cyA9IGZhbHNlLFxuICAgIGNsYXNzTmFtZSxcbiAgICBsb29wRm9jdXMgPSB0cnVlLFxuICAgIHJlbmRlcixcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgb25WYWx1ZUNoYW5nZSxcbiAgICBvcmllbnRhdGlvbixcbiAgICB2YWx1ZSxcbiAgICBzZXRUYWJNYXAsXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvblxuICB9ID0gdXNlVGFic1Jvb3RDb250ZXh0KCk7XG4gIGNvbnN0IFtoaWdobGlnaHRlZFRhYkluZGV4LCBzZXRIaWdobGlnaHRlZFRhYkluZGV4XSA9IFJlYWN0LnVzZVN0YXRlKDApO1xuICBjb25zdCBbdGFic0xpc3RFbGVtZW50LCBzZXRUYWJzTGlzdEVsZW1lbnRdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IGluZGljYXRvclVwZGF0ZUxpc3RlbmVyc1JlZiA9IFJlYWN0LnVzZVJlZihuZXcgU2V0KCkpO1xuICBjb25zdCB0YWJSZXNpemVPYnNlcnZlckVsZW1lbnRzUmVmID0gUmVhY3QudXNlUmVmKG5ldyBTZXQoKSk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh0eXBlb2YgUmVzaXplT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCByZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB7XG4gICAgICBpbmRpY2F0b3JVcGRhdGVMaXN0ZW5lcnNSZWYuY3VycmVudC5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgbGlzdGVuZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJlc2l6ZU9ic2VydmVyUmVmLmN1cnJlbnQgPSByZXNpemVPYnNlcnZlcjtcbiAgICBpZiAodGFic0xpc3RFbGVtZW50KSB7XG4gICAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKHRhYnNMaXN0RWxlbWVudCk7XG4gICAgfVxuICAgIHRhYlJlc2l6ZU9ic2VydmVyRWxlbWVudHNSZWYuY3VycmVudC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50KTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgcmVzaXplT2JzZXJ2ZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfTtcbiAgfSwgW3RhYnNMaXN0RWxlbWVudF0pO1xuICBjb25zdCByZWdpc3RlckluZGljYXRvclVwZGF0ZUxpc3RlbmVyID0gdXNlU3RhYmxlQ2FsbGJhY2sobGlzdGVuZXIgPT4ge1xuICAgIGluZGljYXRvclVwZGF0ZUxpc3RlbmVyc1JlZi5jdXJyZW50LmFkZChsaXN0ZW5lcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGluZGljYXRvclVwZGF0ZUxpc3RlbmVyc1JlZi5jdXJyZW50LmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgfTtcbiAgfSk7XG4gIGNvbnN0IHJlZ2lzdGVyVGFiUmVzaXplT2JzZXJ2ZXJFbGVtZW50ID0gdXNlU3RhYmxlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgdGFiUmVzaXplT2JzZXJ2ZXJFbGVtZW50c1JlZi5jdXJyZW50LmFkZChlbGVtZW50KTtcbiAgICByZXNpemVPYnNlcnZlclJlZi5jdXJyZW50Py5vYnNlcnZlKGVsZW1lbnQpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB0YWJSZXNpemVPYnNlcnZlckVsZW1lbnRzUmVmLmN1cnJlbnQuZGVsZXRlKGVsZW1lbnQpO1xuICAgICAgcmVzaXplT2JzZXJ2ZXJSZWYuY3VycmVudD8udW5vYnNlcnZlKGVsZW1lbnQpO1xuICAgIH07XG4gIH0pO1xuICBjb25zdCBvblRhYkFjdGl2YXRpb24gPSB1c2VTdGFibGVDYWxsYmFjaygobmV3VmFsdWUsIGV2ZW50RGV0YWlscykgPT4ge1xuICAgIGlmIChuZXdWYWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV3VmFsdWUsIGV2ZW50RGV0YWlscyk7XG4gICAgfVxuICB9KTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3JpZW50YXRpb24sXG4gICAgdGFiQWN0aXZhdGlvbkRpcmVjdGlvblxuICB9O1xuICBjb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gICAgJ2FyaWEtb3JpZW50YXRpb24nOiBvcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyA/ICd2ZXJ0aWNhbCcgOiB1bmRlZmluZWQsXG4gICAgcm9sZTogJ3RhYmxpc3QnXG4gIH07XG4gIGNvbnN0IHRhYnNMaXN0Q29udGV4dFZhbHVlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGFjdGl2YXRlT25Gb2N1cyxcbiAgICBoaWdobGlnaHRlZFRhYkluZGV4LFxuICAgIHJlZ2lzdGVySW5kaWNhdG9yVXBkYXRlTGlzdGVuZXIsXG4gICAgcmVnaXN0ZXJUYWJSZXNpemVPYnNlcnZlckVsZW1lbnQsXG4gICAgb25UYWJBY3RpdmF0aW9uLFxuICAgIHNldEhpZ2hsaWdodGVkVGFiSW5kZXgsXG4gICAgdGFic0xpc3RFbGVtZW50XG4gIH0pLCBbYWN0aXZhdGVPbkZvY3VzLCBoaWdobGlnaHRlZFRhYkluZGV4LCByZWdpc3RlckluZGljYXRvclVwZGF0ZUxpc3RlbmVyLCByZWdpc3RlclRhYlJlc2l6ZU9ic2VydmVyRWxlbWVudCwgb25UYWJBY3RpdmF0aW9uLCBzZXRIaWdobGlnaHRlZFRhYkluZGV4LCB0YWJzTGlzdEVsZW1lbnRdKTtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KFRhYnNMaXN0Q29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiB0YWJzTGlzdENvbnRleHRWYWx1ZSxcbiAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3goQ29tcG9zaXRlUm9vdCwge1xuICAgICAgcmVuZGVyOiByZW5kZXIsXG4gICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIHJlZnM6IFtmb3J3YXJkZWRSZWYsIHNldFRhYnNMaXN0RWxlbWVudF0sXG4gICAgICBwcm9wczogW2RlZmF1bHRQcm9wcywgZWxlbWVudFByb3BzXSxcbiAgICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHRhYnNTdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLFxuICAgICAgaGlnaGxpZ2h0ZWRJbmRleDogaGlnaGxpZ2h0ZWRUYWJJbmRleCxcbiAgICAgIGVuYWJsZUhvbWVBbmRFbmRLZXlzOiB0cnVlLFxuICAgICAgbG9vcEZvY3VzOiBsb29wRm9jdXMsXG4gICAgICBvcmllbnRhdGlvbjogb3JpZW50YXRpb24sXG4gICAgICBvbkhpZ2hsaWdodGVkSW5kZXhDaGFuZ2U6IHNldEhpZ2hsaWdodGVkVGFiSW5kZXgsXG4gICAgICBvbk1hcENoYW5nZTogc2V0VGFiTWFwLFxuICAgICAgZGlzYWJsZWRJbmRpY2VzOiBFTVBUWV9BUlJBWVxuICAgIH0pXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBUYWJzTGlzdC5kaXNwbGF5TmFtZSA9IFwiVGFic0xpc3RcIjsiLCJleHBvcnQgeyBUYWJzUm9vdCBhcyBSb290IH0gZnJvbSBcIi4vcm9vdC9UYWJzUm9vdC5qc1wiO1xuZXhwb3J0IHsgVGFic1RhYiBhcyBUYWIgfSBmcm9tIFwiLi90YWIvVGFic1RhYi5qc1wiO1xuZXhwb3J0IHsgVGFic0luZGljYXRvciBhcyBJbmRpY2F0b3IgfSBmcm9tIFwiLi9pbmRpY2F0b3IvVGFic0luZGljYXRvci5qc1wiO1xuZXhwb3J0IHsgVGFic1BhbmVsIGFzIFBhbmVsIH0gZnJvbSBcIi4vcGFuZWwvVGFic1BhbmVsLmpzXCI7XG5leHBvcnQgeyBUYWJzTGlzdCBhcyBMaXN0IH0gZnJvbSBcIi4vbGlzdC9UYWJzTGlzdC5qc1wiOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFPQSxTQUFnQix1QkFBdUI7Q0FDckMsTUFBTSxHQUFHLFlBQUEsYUFBa0IsU0FBUyxDQUFDLENBQUM7Q0FDdEMsT0FBQSxhQUFhLGtCQUFrQjtFQUM3QixTQUFTLENBQUMsQ0FBQztDQUNiLEdBQUcsQ0FBQyxDQUFDO0FBQ1A7Ozs7OztBQ0xBLElBQWEsa0JBQStCLDJCQUFNLGNBQWMsS0FBQSxDQUFTO0FBQzlCLGdCQUFnQixjQUFjO0FBQ3pFLFNBQWdCLHFCQUFxQjtDQUNuQyxNQUFNLFVBQUEsYUFBZ0IsV0FBVyxlQUFlO0NBQ2hELElBQUksWUFBWSxLQUFBLEdBQ2QsTUFBTSxJQUFJLE1BQThDLG9GQUE4RztDQUV4SyxPQUFPO0FBQ1Q7OztBQ2ZBLElBQVcseUJBQXNDLHVCQUFVLHdCQUF3Qjs7Ozs7Q0FLakYsdUJBQXVCLHlCQUF5Qjs7Ozs7Q0FLaEQsdUJBQXVCLGlCQUFpQjtDQUN4QyxPQUFPO0FBQ1QsRUFBRSxDQUFDLENBQUM7OztBQ1hKLElBQWEsNkJBQTZCLEVBQ3hDLHlCQUF3QixTQUFRLEdBQzdCLHVCQUF1QixzQkFBc0IsSUFDaEQsR0FDRjs7Ozs7Ozs7O0FDZUEsSUFBYSxXQUF3QiwyQkFBTSxXQUFXLFNBQVMsU0FBUyxnQkFBZ0IsY0FBYztDQUNwRyxNQUFNLEVBQ0osV0FDQSxjQUFjLG1CQUFtQixHQUNqQyxlQUFlLG1CQUNmLGNBQWMsY0FDZCxRQUNBLE9BQU8sV0FDUCxPQUNBLEdBQUcsaUJBQ0Q7Q0FJSixNQUFNLDhCQUE4QixlQUFlLGlC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bUIsYUFDNUI7RUFFRixNQUFNLGlCQUFpQixJQUFJLHFCQUFxQjtHQUM5Qyw0QkFBNEIsUUFBUSxTQUFRLGFBQVk7SUFDdEQsU0FBUztHQUNYLENBQUM7RUFDSCxDQUFDO0VBQ0Qsa0JBQWtCLFVBQVU7RUFDNUIsSUFBSSxpQkFDRixlQUFlLFFBQVEsZUFBZTtFQUV4Qyw2QkFBNkIsUUFBUSxTQUFRLFlBQVc7R0FDdEQsZUFBZSxRQUFRLE9BQU87RUFDaEMsQ0FBQztFQUNELGFBQWE7R0FDWCxlQUFlLFdBQVc7R0FDMUIsa0JBQWtCLFVBQVU7RUFDOUI7Q0FDRixHQUFHLENBQUMsZUFBZSxDQUFDO0NBQ3BCLE1BQU0sa0NBQWtDLG1CQUFrQixhQUFZO0VBQ3BFLDRCQUE0QixRQUFRLElBQUksUUFBUTtFQUNoRCxhQUFhO0dBQ1gsNEJBQTRCLFFBQVEsT0FBTyxRQUFRO0VBQ3JEO0NBQ0YsQ0FBQztDQUNELE1BQU0sbUNBQW1DLG1CQUFrQixZQUFXO0VBQ3BFLDZCQUE2QixRQUFRLElBQUksT0FBTztFQUNoRCxrQkFBa0IsU0FBUyxRQUFRLE9BQU87RUFDMUMsYUFBYTtHQUNYLDZCQUE2QixRQUFRLE9BQU8sT0FBTztHQUNuRCxrQkFBa0IsU0FBUyxVQUFVLE9BQU87RUFDOUM7Q0FDRixDQUFDO0NBQ0QsTUFBTSxrQkFBa0IsbUJBQW1CLFVBQVUsaUJBQWlCO0VBQ3BFLElBQUksYUFBYSxPQUNmLGNBQWMsVUFBVSxZQUFZO0NBRXhDLENBQUM7Q0FDRCxNQUFNLFFBQVE7RUFDWjtFQUNBO0NBQ0Y7Q0FDQSxNQUFNLGVBQWU7RUFDbkIsb0JBQW9CLGdCQUFnQixhQUFhLGFBQWEsS0FBQTtFQUM5RCxNQUFNO0NBQ1I7Q0FDQSxNQUFNLHVCQUFBLGFBQTZCLGVBQWU7RUFDaEQ7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7Q0FDRixJQUFJO0VBQUM7RUFBaUI7RUFBcUI7RUFBaUM7RUFBa0M7RUFBaUI7RUFBd0I7Q0FBZSxDQUFDO0NBQ3ZLLE9BQW9CLGVBQUEsR0FBQSxtQkFBQSxJQUFBLENBQUssZ0JBQWdCLFVBQVU7RUFDakQsT0FBTztFQUNQLFVBQXVCLGVBQUEsR0FBQSxtQkFBQSxJQUFBLENBQUssZUFBZTtHQUNqQztHQUNHO0dBQ0o7R0FDQTtHQUNQLE1BQU0sQ0FBQyxjQUFjLGtCQUFrQjtHQUN2QyxPQUFPLENBQUMsY0FBYyxZQUFZO0dBQ2xDLHdCQUF3QjtHQUN4QixrQkFBa0I7R0FDbEIsc0JBQXNCO0dBQ1g7R0FDRTtHQUNiLDBCQUEwQjtHQUMxQixhQUFhO0dBQ2IsaUJBQWlCQztFQUNuQixDQUFDO0NBQ0gsQ0FBQztBQUNILENBQUM7QUFDMEMsU0FBUyxjQUFjIiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTddfQ==