import { i as __toESM, n as __exportAll } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
import { g as isHTMLElement, p as getWindow, r as useStableCallback, t as useIsoLayoutEffect } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { c as useRefWithInit, n as EMPTY_ARRAY, r as EMPTY_OBJECT, s as useMergedRefs, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { r as mergeProps } from "/node_modules/.vite/deps/merge-props-CugWwp_i.js?v=1d2f6f90";
import { t as useButton } from "/node_modules/.vite/deps/useButton-ydNp_PBX.js?v=1d2f6f90";
import { Z as useAnimationFrame, _t as transitionStatusMapping, g as useOpenChangeComplete, mt as isWebKit, q as rectToClientRect, s as COMPOSITE_KEYS, st as isVirtualClick, t as inertValue, v as useTransitionStatus } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { C as createSelector, E as FloatingFocusManager, I as DROPDOWN_COLLISION_AVOIDANCE, J as addEventListener, K as useValueAsRef, N as FloatingPortal, T as useClick, Y as getFloatingFocusElement, a as InternalBackdrop, at as pressableTriggerOpenStateMapping, b as useStore, i as useOnFirstRender, it as popupStateMapping, nt as useTimeout, ot as triggerOpenStateMapping, s as FOCUSABLE_POPUP_PROPS, t as useOpenInteractionType, w as useDismiss, y as Store } from "/node_modules/.vite/deps/useOpenInteractionType-CzC_cFBM.js?v=1d2f6f90";
import { b as windowResize, d as itemPress, i as cancelOpen, m as none, r as createChangeEventDetails, t as useBaseUiId } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, r as contains, t as ownerDocument } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { n as visuallyHidden, r as visuallyHiddenInput, t as useValueChanged } from "/node_modules/.vite/deps/useValueChanged-BvCqBnsu.js?v=1d2f6f90";
import { a as useAnchorPositioning, c as useToolbarRootContext, d as useFloatingRootContext, f as platform, i as usePositioner, l as useTypeahead, n as getPseudoElementBounds, r as useAnchoredPopupScrollLock, s as getDisabledMountTransitionStyles, t as usePreviousValue, u as useListNavigation } from "/node_modules/.vite/deps/usePreviousValue-BfCdXD14.js?v=1d2f6f90";
import { a as fieldValidityMapping, i as useFieldRootContext, n as useLabelableId, r as useLabelableContext, t as useRegisterFieldControl } from "/node_modules/.vite/deps/useRegisterFieldControl-D_URWTcY.js?v=1d2f6f90";
import { t as useFormContext } from "/node_modules/.vite/deps/FormContext-D1nFTHI0.js?v=1d2f6f90";
import { t as useControlled } from "/node_modules/.vite/deps/useControlled-C4c2dELU.js?v=1d2f6f90";
import { i as useCompositeListItem, n as useDirection, r as IndexGuessBehavior, t as CompositeList } from "/node_modules/.vite/deps/CompositeList-CuwZ14So.js?v=1d2f6f90";
import { t as Separator } from "/node_modules/.vite/deps/Separator-DBUukXTn.js?v=1d2f6f90";
import { t as useCSPContext } from "/node_modules/.vite/deps/CSPContext-Cs6VJwSE.js?v=1d2f6f90";
//#region node_modules/@base-ui/react/esm/utils/useRegisteredLabelId.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function useRegisteredLabelId(idProp, setLabelId) {
	const id = useBaseUiId(idProp);
	useIsoLayoutEffect(() => {
		setLabelId(id);
		return () => {
			setLabelId(void 0);
		};
	}, [id, setLabelId]);
	return id;
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/labelable-provider/useLabel.js
function useLabel(params = {}) {
	const { id: idProp, fallbackControlId, native = false, setLabelId: setLabelIdProp, focusControl: focusControlProp } = params;
	const { controlId: contextControlId, setLabelId: setContextLabelId } = useLabelableContext();
	const id = useRegisteredLabelId(idProp, useStableCallback((nextLabelId) => {
		setContextLabelId(nextLabelId);
		setLabelIdProp?.(nextLabelId);
	}));
	const resolvedControlId = contextControlId ?? fallbackControlId;
	function focusControl(event) {
		if (focusControlProp) {
			focusControlProp(event, resolvedControlId);
			return;
		}
		if (!resolvedControlId) return;
		const controlElement = ownerDocument(event.currentTarget).getElementById(resolvedControlId);
		if (isHTMLElement(controlElement)) focusElementWithVisible(controlElement);
	}
	function handleInteraction(event) {
		if (getTarget(event.nativeEvent)?.closest("button,input,select,textarea")) return;
		if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
		if (native) return;
		focusControl(event);
	}
	return native ? {
		id,
		htmlFor: resolvedControlId ?? void 0,
		onMouseDown: handleInteraction
	} : {
		id,
		onClick: handleInteraction,
		onPointerDown(event) {
			event.preventDefault();
		}
	};
}
function focusElementWithVisible(element) {
	element.focus({ focusVisible: true });
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/root/SelectRootContext.js
var SelectRootContext = /*#__PURE__*/ import_react.createContext(null);
SelectRootContext.displayName = "SelectRootContext";
var SelectFloatingContext = /*#__PURE__*/ import_react.createContext(null);
SelectFloatingContext.displayName = "SelectFloatingContext";
function useSelectRootContext() {
	const context = import_react.useContext(SelectRootContext);
	if (context === null) throw new Error("Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.");
	return context;
}
function useSelectFloatingContext() {
	const context = import_react.useContext(SelectFloatingContext);
	if (context === null) throw new Error("Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/itemEquality.js
var defaultItemEquality = (itemValue, selectedValue) => Object.is(itemValue, selectedValue);
function compareItemEquality(itemValue, selectedValue, comparer) {
	if (itemValue == null || selectedValue == null) return Object.is(itemValue, selectedValue);
	return comparer(itemValue, selectedValue);
}
function selectedValueIncludes(selectedValues, itemValue, comparer) {
	if (!selectedValues || selectedValues.length === 0) return false;
	return selectedValues.some((selectedValue) => {
		if (selectedValue === void 0) return false;
		return compareItemEquality(itemValue, selectedValue, comparer);
	});
}
function findItemIndex(itemValues, selectedValue, comparer) {
	if (!itemValues || itemValues.length === 0) return -1;
	return itemValues.findIndex((itemValue) => {
		if (itemValue === void 0) return false;
		return compareItemEquality(itemValue, selectedValue, comparer);
	});
}
function removeItem(selectedValues, itemValue, comparer) {
	return selectedValues.filter((selectedValue) => !compareItemEquality(itemValue, selectedValue, comparer));
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/serializeValue.js
function serializeValue(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/resolveValueLabel.js
function isGroupedItems(items) {
	return items != null && items.length > 0 && typeof items[0] === "object" && items[0] != null && "items" in items[0];
}
/**
* Checks if the items array contains an item with a null value that has a non-null label.
*/
function hasNullItemLabel(items) {
	if (!Array.isArray(items)) return items != null && "null" in items;
	const arrayItems = items;
	if (isGroupedItems(arrayItems)) {
		for (const group of arrayItems) for (const item of group.items) if (item && item.value == null && item.label != null) return true;
		return false;
	}
	for (const item of arrayItems) if (item && item.value == null && item.label != null) return true;
	return false;
}
function stringifyAsLabel(item, itemToStringLabel) {
	if (itemToStringLabel && item != null) return itemToStringLabel(item) ?? "";
	if (item && typeof item === "object") {
		if ("label" in item && item.label != null) return String(item.label);
		if ("value" in item) return String(item.value);
	}
	return serializeValue(item);
}
function stringifyAsValue(item, itemToStringValue) {
	if (itemToStringValue && item != null) return itemToStringValue(item) ?? "";
	if (item && typeof item === "object" && "value" in item && "label" in item) return serializeValue(item.value);
	return serializeValue(item);
}
function resolveSelectedLabel(value, items, itemToStringLabel) {
	function fallback() {
		return stringifyAsLabel(value, itemToStringLabel);
	}
	if (itemToStringLabel && value != null) return itemToStringLabel(value);
	if (value && typeof value === "object" && "label" in value && value.label != null) return value.label;
	if (items && !Array.isArray(items)) return items[value] ?? fallback();
	if (Array.isArray(items)) {
		const arrayItems = items;
		const flatItems = isGroupedItems(arrayItems) ? arrayItems.flatMap((group) => group.items) : arrayItems;
		if (value == null || typeof value !== "object") {
			const match = flatItems.find((item) => item.value === value);
			if (match && match.label != null) return match.label;
			return fallback();
		}
		if ("value" in value) {
			const match = flatItems.find((item) => item && item.value === value.value);
			if (match && match.label != null) return match.label;
		}
	}
	return fallback();
}
function resolveMultipleLabels(values, items, itemToStringLabel) {
	return values.reduce((acc, value, index) => {
		if (index > 0) acc.push(", ");
		acc.push(/*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: resolveSelectedLabel(value, items, itemToStringLabel) }, index));
		return acc;
	}, []);
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/store.js
var selectors = {
	id: createSelector((state) => state.id),
	labelId: createSelector((state) => state.labelId),
	modal: createSelector((state) => state.modal),
	multiple: createSelector((state) => state.multiple),
	items: createSelector((state) => state.items),
	itemToStringLabel: createSelector((state) => state.itemToStringLabel),
	itemToStringValue: createSelector((state) => state.itemToStringValue),
	isItemEqualToValue: createSelector((state) => state.isItemEqualToValue),
	value: createSelector((state) => state.value),
	hasSelectedValue: createSelector((state) => {
		const { value, multiple, itemToStringValue } = state;
		if (value == null) return false;
		if (multiple && Array.isArray(value)) return value.length > 0;
		return stringifyAsValue(value, itemToStringValue) !== "";
	}),
	hasNullItemLabel: createSelector((state, enabled) => {
		return enabled ? hasNullItemLabel(state.items) : false;
	}),
	open: createSelector((state) => state.open),
	mounted: createSelector((state) => state.mounted),
	forceMount: createSelector((state) => state.forceMount),
	transitionStatus: createSelector((state) => state.transitionStatus),
	openMethod: createSelector((state) => state.openMethod),
	activeIndex: createSelector((state) => state.activeIndex),
	selectedIndex: createSelector((state) => state.selectedIndex),
	isActive: createSelector((state, index) => state.activeIndex === index),
	isSelected: createSelector((state, index, itemValue) => {
		const comparer = state.isItemEqualToValue;
		const storeValue = state.value;
		if (state.multiple) return Array.isArray(storeValue) && storeValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer));
		if (state.selectedIndex === index && state.selectedIndex !== null) return true;
		return compareItemEquality(itemValue, storeValue, comparer);
	}),
	isSelectedByFocus: createSelector((state, index) => {
		return state.selectedIndex === index;
	}),
	popupProps: createSelector((state) => state.popupProps),
	triggerProps: createSelector((state) => state.triggerProps),
	triggerElement: createSelector((state) => state.triggerElement),
	positionerElement: createSelector((state) => state.positionerElement),
	listElement: createSelector((state) => state.listElement),
	popupSide: createSelector((state) => state.popupSide),
	scrollUpArrowVisible: createSelector((state) => state.scrollUpArrowVisible),
	scrollDownArrowVisible: createSelector((state) => state.scrollDownArrowVisible),
	hasScrollArrows: createSelector((state) => state.hasScrollArrows)
};
//#endregion
//#region node_modules/@base-ui/react/esm/internals/clamp.js
function clamp(val, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
	return Math.max(min, Math.min(val, max));
}
function getMaxScrollOffset(scrollSize, clientSize) {
	return Math.max(0, scrollSize - clientSize);
}
function normalizeScrollOffset(value, max) {
	if (max <= 0) return 0;
	const clamped = clamp(value, 0, max);
	const startDistance = clamped;
	const endDistance = max - clamped;
	const withinStartTolerance = startDistance <= 1;
	const withinEndTolerance = endDistance <= 1;
	if (withinStartTolerance && withinEndTolerance) return startDistance <= endDistance ? 0 : max;
	if (withinStartTolerance) return 0;
	if (withinEndTolerance) return max;
	return clamped;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/root/SelectRoot.js
/**
* Groups all parts of the select.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
function SelectRoot(props) {
	const { id, value: valueProp, defaultValue = null, onValueChange, open: openProp, defaultOpen = false, onOpenChange, name: nameProp, form, autoComplete, disabled: disabledProp = false, readOnly = false, required = false, modal = true, actionsRef, inputRef, onOpenChangeComplete, items, multiple = false, itemToStringLabel, itemToStringValue, isItemEqualToValue = defaultItemEquality, highlightItemOnHover = true, children } = props;
	const { clearErrors } = useFormContext();
	const { setDirty, setTouched, setFocused, shouldValidateOnChange, validityData, setFilled, name: fieldName, disabled: fieldDisabled, validation, validationMode } = useFieldRootContext();
	const generatedId = useLabelableId({ id });
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const [value, setValueUnwrapped] = useControlled({
		controlled: valueProp,
		default: multiple ? defaultValue ?? EMPTY_ARRAY : defaultValue,
		name: "Select",
		state: "value"
	});
	const [open, setOpenUnwrapped] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: "Select",
		state: "open"
	});
	const listRef = import_react.useRef([]);
	const labelsRef = import_react.useRef([]);
	const popupRef = import_react.useRef(null);
	const scrollHandlerRef = import_react.useRef(null);
	const scrollArrowsMountedCountRef = import_react.useRef(0);
	const valueRef = import_react.useRef(null);
	const valuesRef = import_react.useRef([]);
	const typingRef = import_react.useRef(false);
	const keyboardActiveRef = import_react.useRef(false);
	const firstItemTextRef = import_react.useRef(null);
	const selectedItemTextRef = import_react.useRef(null);
	const selectionRef = import_react.useRef({
		allowSelectedMouseUp: false,
		allowUnselectedMouseUp: false,
		dragY: 0
	});
	const alignItemWithTriggerActiveRef = import_react.useRef(false);
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
	const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);
	const store = useRefWithInit(() => new Store({
		id: generatedId,
		labelId: void 0,
		modal,
		multiple,
		itemToStringLabel,
		itemToStringValue,
		isItemEqualToValue,
		value,
		open,
		mounted,
		transitionStatus,
		items,
		forceMount: false,
		openMethod: null,
		activeIndex: null,
		selectedIndex: null,
		popupProps: {},
		triggerProps: {},
		triggerElement: null,
		positionerElement: null,
		listElement: null,
		popupSide: null,
		scrollUpArrowVisible: false,
		scrollDownArrowVisible: false,
		hasScrollArrows: false
	})).current;
	const activeIndex = useStore(store, selectors.activeIndex);
	const selectedIndex = useStore(store, selectors.selectedIndex);
	const triggerElement = useStore(store, selectors.triggerElement);
	const positionerElement = useStore(store, selectors.positionerElement);
	const previousOpenMethod = usePreviousValue(openMethod);
	const renderedOpenMethod = openMethod ?? previousOpenMethod;
	const serializedValue = import_react.useMemo(() => {
		if (multiple && Array.isArray(value) && value.length === 0) return "";
		return stringifyAsValue(value, itemToStringValue);
	}, [
		multiple,
		value,
		itemToStringValue
	]);
	const fieldStringValue = import_react.useMemo(() => {
		if (multiple && Array.isArray(value)) return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
		return stringifyAsValue(value, itemToStringValue);
	}, [
		multiple,
		value,
		itemToStringValue
	]);
	const controlRef = useValueAsRef(store.state.triggerElement);
	const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);
	useRegisterFieldControl(controlRef, generatedId, value, getStringifiedValueForForm);
	const initialValueRef = import_react.useRef(value);
	const hasSelectedValue = multiple ? Array.isArray(value) && value.length > 0 : value != null;
	useIsoLayoutEffect(() => {
		if (value !== initialValueRef.current) store.set("forceMount", true);
	}, [store, value]);
	useIsoLayoutEffect(() => {
		setFilled(hasSelectedValue);
	}, [hasSelectedValue, setFilled]);
	useIsoLayoutEffect(function syncSelectedIndex() {
		const registry = valuesRef.current;
		let nextIndex;
		if (multiple) {
			const currentValue = Array.isArray(value) ? value : [];
			if (currentValue.length === 0) nextIndex = null;
			else {
				const lastValue = currentValue[currentValue.length - 1];
				const lastIndex = findItemIndex(registry, lastValue, isItemEqualToValue);
				nextIndex = lastIndex === -1 ? null : lastIndex;
			}
		} else {
			const index = findItemIndex(registry, value, isItemEqualToValue);
			nextIndex = index === -1 ? null : index;
		}
		if (nextIndex === null) selectedItemTextRef.current = null;
		if (open) return;
		store.set("selectedIndex", nextIndex);
	}, [
		hasSelectedValue,
		multiple,
		open,
		value,
		valuesRef,
		isItemEqualToValue,
		store,
		selectedItemTextRef
	]);
	useValueChanged(value, () => {
		clearErrors(name);
		setDirty(value !== validityData.initialValue);
		if (shouldValidateOnChange()) validation.commit(value);
		else validation.commit(value, true);
	});
	const setOpen = useStableCallback((nextOpen, eventDetails) => {
		onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		setOpenUnwrapped(nextOpen);
		if (!nextOpen && (eventDetails.reason === "focus-out" || eventDetails.reason === "outside-press")) {
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(value);
		}
		if (!nextOpen && store.state.activeIndex !== null) {
			const activeOption = listRef.current[store.state.activeIndex];
			queueMicrotask(() => {
				activeOption?.setAttribute("tabindex", "-1");
			});
		}
	});
	const handleUnmount = useStableCallback(() => {
		setMounted(false);
		store.update({
			activeIndex: null,
			openMethod: null
		});
		onOpenChangeComplete?.(false);
	});
	useOpenChangeComplete({
		enabled: !actionsRef,
		open,
		ref: popupRef,
		onComplete() {
			if (!open) handleUnmount();
		}
	});
	import_react.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);
	const setValue = useStableCallback((nextValue, eventDetails) => {
		onValueChange?.(nextValue, eventDetails);
		if (eventDetails.isCanceled) return;
		setValueUnwrapped(nextValue);
	});
	const handleScrollArrowVisibility = useStableCallback(() => {
		const scroller = store.state.listElement || popupRef.current;
		if (!scroller) return;
		const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
		const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
		const shouldShowUp = scrollTop > 0;
		const shouldShowDown = scrollTop < maxScrollTop;
		if (store.state.scrollUpArrowVisible !== shouldShowUp) store.set("scrollUpArrowVisible", shouldShowUp);
		if (store.state.scrollDownArrowVisible !== shouldShowDown) store.set("scrollDownArrowVisible", shouldShowDown);
	});
	const floatingContext = useFloatingRootContext({
		open,
		onOpenChange: setOpen,
		elements: {
			reference: triggerElement,
			floating: positionerElement
		}
	});
	const click = useClick(floatingContext, {
		enabled: !readOnly && !disabled,
		event: "mousedown"
	});
	const dismiss = useDismiss(floatingContext);
	const listNavigation = useListNavigation(floatingContext, {
		enabled: !readOnly && !disabled,
		listRef,
		activeIndex,
		selectedIndex,
		disabledIndices: EMPTY_ARRAY,
		onNavigate(nextActiveIndex) {
			if (nextActiveIndex === null && !open) return;
			store.set("activeIndex", nextActiveIndex);
		},
		focusItemOnHover: highlightItemOnHover
	});
	const typeahead = useTypeahead(floatingContext, {
		enabled: !readOnly && !disabled && (open || !multiple),
		listRef: labelsRef,
		activeIndex,
		selectedIndex,
		onMatch(index) {
			if (open) store.set("activeIndex", index);
			else setValue(valuesRef.current[index], createChangeEventDetails("none"));
		},
		onTyping(typing) {
			typingRef.current = typing;
		}
	});
	const mergedTriggerProps = import_react.useMemo(() => {
		const triggerInteractionProps = mergeProps(typeahead.reference, listNavigation.reference, dismiss.reference, click.reference, interactionTypeProps);
		if (generatedId) triggerInteractionProps.id = generatedId;
		return triggerInteractionProps;
	}, [
		click.reference,
		typeahead.reference,
		listNavigation.reference,
		dismiss.reference,
		interactionTypeProps,
		generatedId
	]);
	const popupProps = import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, typeahead.floating, listNavigation.floating, dismiss.floating), [
		typeahead.floating,
		listNavigation.floating,
		dismiss.floating
	]);
	const itemProps = listNavigation.item ?? EMPTY_OBJECT;
	useOnFirstRender(() => {
		store.update({
			popupProps,
			triggerProps: mergedTriggerProps
		});
	});
	useIsoLayoutEffect(() => {
		store.update({
			id: generatedId,
			modal,
			multiple,
			value,
			open,
			mounted,
			transitionStatus,
			popupProps,
			triggerProps: mergedTriggerProps,
			items,
			itemToStringLabel,
			itemToStringValue,
			isItemEqualToValue,
			openMethod: renderedOpenMethod
		});
	}, [
		store,
		generatedId,
		modal,
		multiple,
		value,
		open,
		mounted,
		transitionStatus,
		popupProps,
		mergedTriggerProps,
		items,
		itemToStringLabel,
		itemToStringValue,
		isItemEqualToValue,
		renderedOpenMethod
	]);
	const contextValue = import_react.useMemo(() => ({
		store,
		name,
		required,
		disabled,
		readOnly,
		multiple,
		highlightItemOnHover,
		setValue,
		setOpen,
		listRef,
		popupRef,
		scrollHandlerRef,
		handleScrollArrowVisibility,
		scrollArrowsMountedCountRef,
		itemProps,
		events: floatingContext.context.events,
		valueRef,
		valuesRef,
		labelsRef,
		typingRef,
		selectionRef,
		firstItemTextRef,
		selectedItemTextRef,
		validation,
		onOpenChangeComplete,
		keyboardActiveRef,
		alignItemWithTriggerActiveRef,
		initialValueRef
	}), [
		store,
		name,
		required,
		disabled,
		readOnly,
		multiple,
		highlightItemOnHover,
		setValue,
		setOpen,
		itemProps,
		floatingContext.context.events,
		validation,
		onOpenChangeComplete,
		handleScrollArrowVisibility
	]);
	const ref = useMergedRefs(inputRef, validation.inputRef);
	const hasMultipleSelection = multiple && Array.isArray(value) && value.length > 0;
	const hiddenInputName = multiple ? void 0 : name;
	const hiddenInputs = import_react.useMemo(() => {
		if (!multiple || !Array.isArray(value) || !name) return null;
		return value.map((v) => {
			const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
			return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: currentSerializedValue
			}, currentSerializedValue);
		});
	}, [
		multiple,
		value,
		form,
		name,
		itemToStringValue
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectRootContext.Provider, {
		value: contextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SelectFloatingContext.Provider, {
			value: floatingContext,
			children: [
				children,
				/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
					...validation.getInputValidationProps({
						onFocus() {
							store.state.triggerElement?.focus({ focusVisible: true });
						},
						onChange(event) {
							if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
								event.preventBaseUIHandler?.();
								return;
							}
							const nextValue = event.currentTarget.value;
							const details = createChangeEventDetails(none, event.nativeEvent);
							function handleChange() {
								if (multiple) return;
								const matchingValue = valuesRef.current.find((v) => {
									if (stringifyAsValue(v, itemToStringValue).toLowerCase() === nextValue.toLowerCase()) return true;
									if (stringifyAsLabel(v, itemToStringLabel).toLowerCase() === nextValue.toLowerCase()) return true;
									return false;
								});
								if (matchingValue != null) {
									setDirty(matchingValue !== validityData.initialValue);
									setValue(matchingValue, details);
									if (shouldValidateOnChange()) validation.commit(matchingValue);
								}
							}
							store.set("forceMount", true);
							queueMicrotask(handleChange);
						}
					}),
					id: generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : void 0,
					form,
					name: hiddenInputName,
					autoComplete,
					value: serializedValue,
					disabled,
					required: required && !hasMultipleSelection,
					readOnly,
					ref,
					style: name ? visuallyHiddenInput : visuallyHidden,
					tabIndex: -1,
					"aria-hidden": true,
					suppressHydrationWarning: true
				}),
				hiddenInputs
			]
		})
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/resolveAriaLabelledBy.js
function getDefaultLabelId(id) {
	return id == null ? void 0 : `${id}-label`;
}
function resolveAriaLabelledBy(fieldLabelId, localLabelId) {
	return fieldLabelId ?? localLabelId;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/label/SelectLabel.js
/**
* An accessible label that is automatically associated with the select trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectLabel = /*#__PURE__*/ import_react.forwardRef(function SelectLabel(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const elementPropsWithoutId = elementProps;
	delete elementPropsWithoutId.id;
	const fieldRootContext = useFieldRootContext();
	const { store } = useSelectRootContext();
	const triggerElement = useStore(store, selectors.triggerElement);
	const rootId = useStore(store, selectors.id);
	const labelProps = useLabel({
		id: getDefaultLabelId(rootId),
		fallbackControlId: triggerElement?.id ?? rootId,
		setLabelId(nextLabelId) {
			store.set("labelId", nextLabelId);
		}
	});
	return useRenderElement("div", componentProps, {
		ref: forwardedRef,
		state: fieldRootContext.state,
		props: [labelProps, elementProps],
		stateAttributesMapping: fieldValidityMapping
	});
});
SelectLabel.displayName = "SelectLabel";
//#endregion
//#region node_modules/@base-ui/react/esm/select/trigger/SelectTrigger.js
var BOUNDARY_OFFSET = 2;
var SELECTED_DELAY = 400;
var stateAttributesMapping$4 = {
	...pressableTriggerOpenStateMapping,
	...fieldValidityMapping,
	popupSide: (side) => side ? { "data-popup-side": side } : null,
	value: () => null
};
/**
* A button that opens the select popup.
* Renders a `<button>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectTrigger = /*#__PURE__*/ import_react.forwardRef(function SelectTrigger(componentProps, forwardedRef) {
	const { render, className, id: idProp, disabled: disabledProp = false, nativeButton = true, style, ...elementProps } = componentProps;
	const { setTouched, setFocused, validationMode, state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
	const { labelId: fieldLabelId } = useLabelableContext();
	const { store, setOpen, selectionRef, validation, readOnly, required, alignItemWithTriggerActiveRef, disabled: selectDisabled, keyboardActiveRef } = useSelectRootContext();
	const disabled = fieldDisabled || selectDisabled || disabledProp;
	const open = useStore(store, selectors.open);
	const mounted = useStore(store, selectors.mounted);
	const value = useStore(store, selectors.value);
	const triggerProps = useStore(store, selectors.triggerProps);
	const positionerElement = useStore(store, selectors.positionerElement);
	const listElement = useStore(store, selectors.listElement);
	const popupSideValue = useStore(store, selectors.popupSide);
	const rootId = useStore(store, selectors.id);
	const selectLabelId = useStore(store, selectors.labelId);
	const hasSelectedValue = useStore(store, selectors.hasSelectedValue);
	const popupSide = mounted && positionerElement ? popupSideValue : null;
	const id = idProp ?? rootId;
	const ariaLabelledBy = resolveAriaLabelledBy(fieldLabelId, selectLabelId);
	useLabelableId({ id });
	const positionerRef = useValueAsRef(positionerElement);
	const triggerRef = import_react.useRef(null);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const setTriggerElement = useStableCallback((element) => {
		store.set("triggerElement", element);
	});
	const mergedRef = useMergedRefs(forwardedRef, triggerRef, buttonRef, setTriggerElement);
	const timeoutFocus = useTimeout();
	const timeoutMouseDown = useTimeout();
	const selectedDelayTimeout = useTimeout();
	import_react.useEffect(() => {
		if (open) {
			selectedDelayTimeout.start(SELECTED_DELAY, () => {
				selectionRef.current.allowUnselectedMouseUp = true;
				selectionRef.current.allowSelectedMouseUp = true;
			});
			return () => {
				selectedDelayTimeout.clear();
			};
		}
		selectionRef.current = {
			allowSelectedMouseUp: false,
			allowUnselectedMouseUp: false,
			dragY: 0
		};
		timeoutMouseDown.clear();
	}, [
		open,
		selectionRef,
		timeoutMouseDown,
		selectedDelayTimeout
	]);
	const props = mergeProps(triggerProps, {
		id,
		role: "combobox",
		"aria-expanded": open ? "true" : "false",
		"aria-haspopup": "listbox",
		"aria-controls": open ? listElement?.id ?? getFloatingFocusElement(positionerElement)?.id : void 0,
		"aria-labelledby": ariaLabelledBy,
		"aria-readonly": readOnly || void 0,
		"aria-required": required || void 0,
		tabIndex: disabled ? -1 : 0,
		ref: mergedRef,
		onFocus(event) {
			setFocused(true);
			if (open && alignItemWithTriggerActiveRef.current) setOpen(false, createChangeEventDetails(none, event.nativeEvent));
			timeoutFocus.start(0, () => {
				store.set("forceMount", true);
			});
		},
		onBlur(event) {
			if (contains(positionerElement, event.relatedTarget)) return;
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(value);
		},
		onPointerMove() {
			keyboardActiveRef.current = false;
		},
		onKeyDown() {
			keyboardActiveRef.current = true;
		},
		onMouseDown(event) {
			if (open) return;
			const doc = ownerDocument(event.currentTarget);
			function handleMouseUp(mouseEvent) {
				if (!triggerRef.current) return;
				const mouseUpTarget = mouseEvent.target;
				if (contains(triggerRef.current, mouseUpTarget) || contains(positionerRef.current, mouseUpTarget) || mouseUpTarget === triggerRef.current) return;
				const bounds = getPseudoElementBounds(triggerRef.current);
				if (mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET && mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET && mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET && mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET) return;
				setOpen(false, createChangeEventDetails(cancelOpen, mouseEvent));
			}
			timeoutMouseDown.start(0, () => {
				doc.addEventListener("mouseup", handleMouseUp, { once: true });
			});
		}
	}, validation.getValidationProps, elementProps, getButtonProps);
	props.role = "combobox";
	const state = {
		...fieldState,
		open,
		disabled,
		value,
		readOnly,
		popupSide,
		placeholder: !hasSelectedValue
	};
	return useRenderElement("button", componentProps, {
		ref: [forwardedRef, triggerRef],
		state,
		stateAttributesMapping: stateAttributesMapping$4,
		props
	});
});
SelectTrigger.displayName = "SelectTrigger";
//#endregion
//#region node_modules/@base-ui/react/esm/select/value/SelectValue.js
var stateAttributesMapping$3 = { value: () => null };
/**
* A text label of the currently selected item.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectValue = /*#__PURE__*/ import_react.forwardRef(function SelectValue(componentProps, forwardedRef) {
	const { className, render, children: childrenProp, placeholder, style, ...elementProps } = componentProps;
	const { store, valueRef } = useSelectRootContext();
	const value = useStore(store, selectors.value);
	const items = useStore(store, selectors.items);
	const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
	const hasSelectedValue = useStore(store, selectors.hasSelectedValue);
	const shouldCheckNullItemLabel = !hasSelectedValue && placeholder != null && childrenProp == null;
	const hasNullLabel = useStore(store, selectors.hasNullItemLabel, shouldCheckNullItemLabel);
	const state = {
		value,
		placeholder: !hasSelectedValue
	};
	let children = null;
	if (typeof childrenProp === "function") children = childrenProp(value);
	else if (childrenProp != null) children = childrenProp;
	else if (!hasSelectedValue && placeholder != null && !hasNullLabel) children = placeholder;
	else if (Array.isArray(value)) children = resolveMultipleLabels(value, items, itemToStringLabel);
	else children = resolveSelectedLabel(value, items, itemToStringLabel);
	return useRenderElement("span", componentProps, {
		state,
		ref: [forwardedRef, valueRef],
		props: [{ children }, elementProps],
		stateAttributesMapping: stateAttributesMapping$3
	});
});
SelectValue.displayName = "SelectValue";
//#endregion
//#region node_modules/@base-ui/react/esm/select/icon/SelectIcon.js
/**
* An icon that indicates that the trigger button opens a select popup.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectIcon = /*#__PURE__*/ import_react.forwardRef(function SelectIcon(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store } = useSelectRootContext();
	const state = { open: useStore(store, selectors.open) };
	return useRenderElement("span", componentProps, {
		state,
		ref: forwardedRef,
		props: [{
			"aria-hidden": true,
			children: "▼"
		}, elementProps],
		stateAttributesMapping: triggerOpenStateMapping
	});
});
SelectIcon.displayName = "SelectIcon";
//#endregion
//#region node_modules/@base-ui/react/esm/select/portal/SelectPortalContext.js
var SelectPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
SelectPortalContext.displayName = "SelectPortalContext";
//#endregion
//#region node_modules/@base-ui/react/esm/select/portal/SelectPortal.js
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPortal = /*#__PURE__*/ import_react.forwardRef(function SelectPortal(portalProps, forwardedRef) {
	const { store } = useSelectRootContext();
	const mounted = useStore(store, selectors.mounted);
	const forceMount = useStore(store, selectors.forceMount);
	if (!(mounted || forceMount)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectPortalContext.Provider, {
		value: true,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps
		})
	});
});
SelectPortal.displayName = "SelectPortal";
//#endregion
//#region node_modules/@base-ui/react/esm/select/backdrop/SelectBackdrop.js
var stateAttributesMapping$2 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* An overlay displayed beneath the menu popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectBackdrop = /*#__PURE__*/ import_react.forwardRef(function SelectBackdrop(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store } = useSelectRootContext();
	const open = useStore(store, selectors.open);
	const mounted = useStore(store, selectors.mounted);
	const state = {
		open,
		transitionStatus: useStore(store, selectors.transitionStatus)
	};
	return useRenderElement("div", componentProps, {
		state,
		ref: forwardedRef,
		props: [{
			role: "presentation",
			hidden: !mounted,
			style: {
				userSelect: "none",
				WebkitUserSelect: "none"
			}
		}, elementProps],
		stateAttributesMapping: stateAttributesMapping$2
	});
});
SelectBackdrop.displayName = "SelectBackdrop";
//#endregion
//#region node_modules/@base-ui/react/esm/select/positioner/SelectPositionerContext.js
var SelectPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
SelectPositionerContext.displayName = "SelectPositionerContext";
function useSelectPositionerContext() {
	const context = import_react.useContext(SelectPositionerContext);
	if (!context) throw new Error("Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/popup/utils.js
function clearStyles(element, originalStyles) {
	if (element) Object.assign(element.style, originalStyles);
}
var LIST_FUNCTIONAL_STYLES = {
	position: "relative",
	maxHeight: "100%",
	overflowX: "hidden",
	overflowY: "auto"
};
//#endregion
//#region node_modules/@base-ui/react/esm/select/positioner/SelectPositioner.js
var FIXED = { position: "fixed" };
/**
* Positions the select popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPositioner = /*#__PURE__*/ import_react.forwardRef(function SelectPositioner(componentProps, forwardedRef) {
	const { anchor, positionMethod = "absolute", className, render, side = "bottom", align = "center", sideOffset = 0, alignOffset = 0, collisionBoundary = "clipping-ancestors", collisionPadding, arrowPadding = 5, sticky = false, disableAnchorTracking, alignItemWithTrigger = true, collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE, style, ...elementProps } = componentProps;
	const { store, listRef, labelsRef, alignItemWithTriggerActiveRef, selectedItemTextRef, valuesRef, initialValueRef, popupRef, setValue } = useSelectRootContext();
	const floatingRootContext = useSelectFloatingContext();
	const open = useStore(store, selectors.open);
	const mounted = useStore(store, selectors.mounted);
	const modal = useStore(store, selectors.modal);
	const value = useStore(store, selectors.value);
	const openMethod = useStore(store, selectors.openMethod);
	const positionerElement = useStore(store, selectors.positionerElement);
	const triggerElement = useStore(store, selectors.triggerElement);
	const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
	const transitionStatus = useStore(store, selectors.transitionStatus);
	const scrollUpArrowRef = import_react.useRef(null);
	const scrollDownArrowRef = import_react.useRef(null);
	const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] = import_react.useState(alignItemWithTrigger);
	const alignItemWithTriggerActive = mounted && controlledAlignItemWithTrigger && openMethod !== "touch";
	if (!mounted && controlledAlignItemWithTrigger !== alignItemWithTrigger) setControlledAlignItemWithTrigger(alignItemWithTrigger);
	useIsoLayoutEffect(() => {
		if (!mounted) {
			if (selectors.scrollUpArrowVisible(store.state)) store.set("scrollUpArrowVisible", false);
			if (selectors.scrollDownArrowVisible(store.state)) store.set("scrollDownArrowVisible", false);
		}
	}, [store, mounted]);
	import_react.useImperativeHandle(alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);
	useAnchoredPopupScrollLock((alignItemWithTriggerActive || modal) && open, openMethod === "touch", positionerElement, triggerElement);
	const positioning = useAnchorPositioning({
		anchor,
		floatingRootContext,
		positionMethod,
		mounted,
		side,
		sideOffset,
		align,
		alignOffset,
		arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		disableAnchorTracking: disableAnchorTracking ?? alignItemWithTriggerActive,
		collisionAvoidance,
		keepMounted: true
	});
	const renderedSide = alignItemWithTriggerActive ? "none" : positioning.side;
	const positionerStyles = alignItemWithTriggerActive ? FIXED : positioning.positionerStyles;
	const state = {
		open,
		side: renderedSide,
		align: positioning.align,
		anchorHidden: positioning.anchorHidden
	};
	useIsoLayoutEffect(() => {
		store.set("popupSide", positioning.side);
	}, [store, positioning.side]);
	const setPositionerElement = useStableCallback((element) => {
		store.set("positionerElement", element);
	});
	const element = usePositioner(componentProps, state, {
		styles: positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, setPositionerElement],
		hidden: !mounted,
		inert: !open
	});
	const prevMapSizeRef = import_react.useRef(0);
	const onMapChange = useStableCallback((map) => {
		if (map.size === 0 && prevMapSizeRef.current === 0) return;
		if (valuesRef.current.length === 0) return;
		const prevSize = prevMapSizeRef.current;
		prevMapSizeRef.current = map.size;
		if (map.size === prevSize) return;
		const eventDetails = createChangeEventDetails(none);
		if (prevSize !== 0 && !store.state.multiple && value !== null) {
			if (findItemIndex(valuesRef.current, value, isItemEqualToValue) === -1) {
				const initialSelectedValue = initialValueRef.current;
				const nextValue = initialSelectedValue != null && findItemIndex(valuesRef.current, initialSelectedValue, isItemEqualToValue) !== -1 ? initialSelectedValue : null;
				setValue(nextValue, eventDetails);
				if (nextValue === null) {
					store.set("selectedIndex", null);
					selectedItemTextRef.current = null;
				}
			}
		}
		if (prevSize !== 0 && store.state.multiple && Array.isArray(value)) {
			const hasVisibleItem = (selectedItemValue) => findItemIndex(valuesRef.current, selectedItemValue, isItemEqualToValue) !== -1;
			const nextValue = value.filter((selectedItemValue) => hasVisibleItem(selectedItemValue));
			if (nextValue.length !== value.length || nextValue.some((selectedItemValue) => !selectedValueIncludes(value, selectedItemValue, isItemEqualToValue))) {
				setValue(nextValue, eventDetails);
				if (nextValue.length === 0) {
					store.set("selectedIndex", null);
					selectedItemTextRef.current = null;
				}
			}
		}
		if (open && alignItemWithTriggerActive) {
			store.update({
				scrollUpArrowVisible: false,
				scrollDownArrowVisible: false
			});
			const stylesToClear = { height: "" };
			clearStyles(positionerElement, stylesToClear);
			clearStyles(popupRef.current, stylesToClear);
		}
	});
	const contextValue = import_react.useMemo(() => ({
		...positioning,
		side: renderedSide,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger,
		scrollUpArrowRef,
		scrollDownArrowRef
	}), [
		positioning,
		renderedSide,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
		elementsRef: listRef,
		labelsRef,
		onMapChange,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SelectPositionerContext.Provider, {
			value: contextValue,
			children: [mounted && modal && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
				inert: inertValue(!open),
				cutout: triggerElement
			}), element]
		})
	});
});
SelectPositioner.displayName = "SelectPositioner";
//#endregion
//#region node_modules/@base-ui/react/esm/utils/styles.js
var DISABLE_SCROLLBAR_CLASS_NAME = "base-ui-disable-scrollbar";
var styleDisableScrollbar = {
	className: DISABLE_SCROLLBAR_CLASS_NAME,
	getElement(nonce) {
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("style", {
			nonce,
			href: DISABLE_SCROLLBAR_CLASS_NAME,
			precedence: "base-ui:low",
			children: `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`
		});
	}
};
styleDisableScrollbar.getElement.displayName = "styleDisableScrollbar.getElement";
//#endregion
//#region node_modules/@base-ui/react/esm/select/popup/SelectPopup.js
var stateAttributesMapping$1 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* A container for the select list.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPopup = /*#__PURE__*/ import_react.forwardRef(function SelectPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, ...elementProps } = componentProps;
	const { store, popupRef, onOpenChangeComplete, setOpen, valueRef, firstItemTextRef, selectedItemTextRef, keyboardActiveRef, multiple, handleScrollArrowVisibility, scrollHandlerRef, listRef, highlightItemOnHover } = useSelectRootContext();
	const { side, align, alignItemWithTriggerActive, isPositioned, setControlledAlignItemWithTrigger, scrollDownArrowRef, scrollUpArrowRef } = useSelectPositionerContext();
	const insideToolbar = useToolbarRootContext(true) != null;
	const floatingRootContext = useSelectFloatingContext();
	const direction = useDirection();
	const { nonce, disableStyleElements } = useCSPContext();
	const id = useStore(store, selectors.id);
	const open = useStore(store, selectors.open);
	const mounted = useStore(store, selectors.mounted);
	const popupProps = useStore(store, selectors.popupProps);
	const transitionStatus = useStore(store, selectors.transitionStatus);
	const triggerElement = useStore(store, selectors.triggerElement);
	const positionerElement = useStore(store, selectors.positionerElement);
	const listElement = useStore(store, selectors.listElement);
	const reachedMaxHeightRef = import_react.useRef(false);
	const initialPlacedRef = import_react.useRef(false);
	const originalPositionerStylesRef = import_react.useRef({});
	const scrollArrowFrame = useAnimationFrame();
	const handleScroll = useStableCallback((scroller) => {
		if (!positionerElement || !popupRef.current || !initialPlacedRef.current) return;
		if (reachedMaxHeightRef.current || !alignItemWithTriggerActive) {
			handleScrollArrowVisibility();
			return;
		}
		const isTopPositioned = positionerElement.style.top === "0px";
		const isBottomPositioned = positionerElement.style.bottom === "0px";
		if (!isTopPositioned && !isBottomPositioned) {
			handleScrollArrowVisibility();
			return;
		}
		const scale = getScale(positionerElement);
		const currentHeight = normalizeSize(positionerElement.getBoundingClientRect().height, "y", scale);
		const doc = ownerDocument(positionerElement);
		const positionerStyles = getComputedStyle(positionerElement);
		const marginTop = parseFloat(positionerStyles.marginTop);
		const marginBottom = parseFloat(positionerStyles.marginBottom);
		const maxPopupHeight = getMaxPopupHeight(getComputedStyle(popupRef.current));
		const maxAvailableHeight = Math.min(doc.documentElement.clientHeight - marginTop - marginBottom, maxPopupHeight);
		const scrollTop = scroller.scrollTop;
		const maxScrollTop = getMaxScrollTop(scroller);
		let nextPositionerHeight = 0;
		let nextScrollTop = null;
		let setReachedMax = false;
		let scrollToMax = false;
		const setHeight = (height) => {
			positionerElement.style.height = `${height}px`;
		};
		const handleSmallDiff = (diff, targetScrollTop) => {
			const heightDelta = clamp(diff, 0, maxAvailableHeight - currentHeight);
			if (heightDelta > 0) setHeight(currentHeight + heightDelta);
			scroller.scrollTop = targetScrollTop;
			if (maxAvailableHeight - (currentHeight + heightDelta) <= 1) reachedMaxHeightRef.current = true;
			handleScrollArrowVisibility();
		};
		const diff = isTopPositioned ? maxScrollTop - scrollTop : scrollTop;
		const nextHeight = Math.min(currentHeight + diff, maxAvailableHeight);
		nextPositionerHeight = nextHeight;
		if (diff <= 1) {
			handleSmallDiff(diff, isTopPositioned ? maxScrollTop : 0);
			return;
		}
		if (maxAvailableHeight - nextHeight > 1) if (isTopPositioned) scrollToMax = true;
		else nextScrollTop = 0;
		else {
			setReachedMax = true;
			if (isBottomPositioned && scrollTop < maxScrollTop) nextScrollTop = scrollTop - (diff - (currentHeight + diff - maxAvailableHeight));
		}
		nextPositionerHeight = Math.ceil(nextPositionerHeight);
		if (nextPositionerHeight !== 0) setHeight(nextPositionerHeight);
		if (scrollToMax || nextScrollTop != null) {
			const nextMaxScrollTop = getMaxScrollTop(scroller);
			const target = scrollToMax ? nextMaxScrollTop : clamp(nextScrollTop, 0, nextMaxScrollTop);
			if (Math.abs(scroller.scrollTop - target) > 1) scroller.scrollTop = target;
		}
		if (setReachedMax || nextPositionerHeight >= maxAvailableHeight - 1) reachedMaxHeightRef.current = true;
		handleScrollArrowVisibility();
	});
	import_react.useImperativeHandle(scrollHandlerRef, () => handleScroll, [handleScroll]);
	useOpenChangeComplete({
		open,
		ref: popupRef,
		onComplete() {
			if (open) onOpenChangeComplete?.(true);
		}
	});
	const state = {
		open,
		transitionStatus,
		side,
		align
	};
	useIsoLayoutEffect(() => {
		if (!positionerElement || !popupRef.current || Object.keys(originalPositionerStylesRef.current).length) return;
		originalPositionerStylesRef.current = {
			top: positionerElement.style.top || "0",
			left: positionerElement.style.left || "0",
			right: positionerElement.style.right,
			height: positionerElement.style.height,
			bottom: positionerElement.style.bottom,
			minHeight: positionerElement.style.minHeight,
			maxHeight: positionerElement.style.maxHeight,
			marginTop: positionerElement.style.marginTop,
			marginBottom: positionerElement.style.marginBottom
		};
	}, [popupRef, positionerElement]);
	useIsoLayoutEffect(() => {
		if (open || alignItemWithTriggerActive) return;
		initialPlacedRef.current = false;
		reachedMaxHeightRef.current = false;
		clearStyles(positionerElement, originalPositionerStylesRef.current);
	}, [
		open,
		alignItemWithTriggerActive,
		positionerElement,
		popupRef
	]);
	useIsoLayoutEffect(() => {
		const popupElement = popupRef.current;
		if (!open || !triggerElement || !positionerElement || !popupElement || alignItemWithTriggerActive && !isPositioned || store.state.transitionStatus === "ending") return;
		if (!alignItemWithTriggerActive) {
			initialPlacedRef.current = true;
			scrollArrowFrame.request(handleScrollArrowVisibility);
			popupElement.style.removeProperty("--transform-origin");
			return;
		}
		const restoreTransformStyles = unsetTransformStyles(popupElement);
		popupElement.style.removeProperty("--transform-origin");
		try {
			let textElement = selectedItemTextRef.current;
			if (!textElement?.isConnected) textElement = !selectors.hasSelectedValue(store.state) && firstItemTextRef.current?.isConnected ? firstItemTextRef.current : null;
			const valueElement = valueRef.current;
			const positionerStyles = getComputedStyle(positionerElement);
			const popupStyles = getComputedStyle(popupElement);
			const doc = ownerDocument(triggerElement);
			const win = getWindow(positionerElement);
			const scale = getScale(triggerElement);
			const triggerRect = normalizeRect(triggerElement.getBoundingClientRect(), scale);
			const positionerRect = normalizeRect(positionerElement.getBoundingClientRect(), scale);
			const triggerHeight = triggerRect.height;
			const scroller = listElement || popupElement;
			const scrollHeight = scroller.scrollHeight;
			const borderBottom = parseFloat(popupStyles.borderBottomWidth);
			const marginTop = parseFloat(positionerStyles.marginTop) || 10;
			const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
			const minHeight = parseFloat(positionerStyles.minHeight) || 100;
			const maxPopupHeight = getMaxPopupHeight(popupStyles);
			const paddingLeft = 5;
			const paddingRight = 5;
			const triggerCollisionThreshold = 20;
			const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
			const viewportWidth = doc.documentElement.clientWidth;
			const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;
			let textRect;
			let alignedLeft = direction === "rtl" ? triggerRect.right - positionerRect.width : triggerRect.left;
			let offsetY = 0;
			if (textElement && valueElement) {
				const valueRect = normalizeRect(valueElement.getBoundingClientRect(), scale);
				textRect = normalizeRect(textElement.getBoundingClientRect(), scale);
				alignedLeft = positionerRect.left + (direction === "rtl" ? valueRect.right - textRect.right : valueRect.left - textRect.left);
				const valueCenterFromTriggerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
				offsetY = textRect.top - positionerRect.top + textRect.height / 2 - valueCenterFromTriggerTop;
			}
			const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
			let height = Math.min(viewportHeight, idealHeight);
			const maxHeight = viewportHeight - marginTop - marginBottom;
			const scrollTop = idealHeight - height;
			const maxRight = viewportWidth - paddingRight;
			positionerElement.style.left = `${clamp(alignedLeft, paddingLeft, maxRight - positionerRect.width)}px`;
			positionerElement.style.height = `${height}px`;
			positionerElement.style.maxHeight = "auto";
			positionerElement.style.marginTop = `${marginTop}px`;
			positionerElement.style.marginBottom = `${marginBottom}px`;
			popupElement.style.height = "100%";
			const maxScrollTop = getMaxScrollTop(scroller);
			const isTopPositioned = scrollTop >= maxScrollTop - 1;
			if (isTopPositioned) height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
			const fallbackToAlignPopupToTrigger = triggerRect.top < triggerCollisionThreshold || triggerRect.bottom > viewportHeight - triggerCollisionThreshold || Math.ceil(height) + 1 < Math.min(scrollHeight, minHeight);
			const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && isWebKit;
			if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
				initialPlacedRef.current = true;
				clearStyles(positionerElement, originalPositionerStylesRef.current);
				setControlledAlignItemWithTrigger(false);
				return;
			}
			const initialHeight = Math.max(minHeight, height);
			if (isTopPositioned) {
				const topOffset = Math.max(0, viewportHeight - idealHeight);
				positionerElement.style.top = positionerRect.height >= maxHeight ? "0" : `${topOffset}px`;
				positionerElement.style.height = `${height}px`;
				scroller.scrollTop = getMaxScrollTop(scroller);
			} else {
				positionerElement.style.bottom = "0";
				scroller.scrollTop = scrollTop;
			}
			if (textRect) {
				const popupTop = positionerRect.top;
				const popupHeight = positionerRect.height;
				const textCenterY = textRect.top + textRect.height / 2;
				const clampedY = clamp(popupHeight > 0 ? (textCenterY - popupTop) / popupHeight * 100 : 50, 0, 100);
				popupElement.style.setProperty("--transform-origin", `50% ${clampedY}%`);
			}
			if (initialHeight === viewportHeight || height >= maxPopupHeight) reachedMaxHeightRef.current = true;
			handleScrollArrowVisibility();
			if (highlightItemOnHover && store.state.selectedIndex === null && store.state.activeIndex === null && listRef.current[0] != null) store.set("activeIndex", 0);
			initialPlacedRef.current = true;
		} finally {
			restoreTransformStyles();
		}
	}, [
		store,
		open,
		positionerElement,
		triggerElement,
		valueRef,
		firstItemTextRef,
		selectedItemTextRef,
		popupRef,
		handleScrollArrowVisibility,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger,
		scrollArrowFrame,
		scrollDownArrowRef,
		scrollUpArrowRef,
		listElement,
		listRef,
		highlightItemOnHover,
		direction,
		isPositioned
	]);
	import_react.useEffect(() => {
		if (!alignItemWithTriggerActive || !positionerElement || !open) return;
		const win = getWindow(positionerElement);
		function handleResize(event) {
			setOpen(false, createChangeEventDetails(windowResize, event));
		}
		return addEventListener(win, "resize", handleResize);
	}, [
		setOpen,
		alignItemWithTriggerActive,
		positionerElement,
		open
	]);
	const defaultProps = {
		...listElement ? {
			role: "presentation",
			"aria-orientation": void 0
		} : {
			role: "listbox",
			"aria-multiselectable": multiple || void 0,
			id: `${id}-list`
		},
		onKeyDown(event) {
			keyboardActiveRef.current = true;
			if (insideToolbar && COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
		},
		onMouseMove() {
			keyboardActiveRef.current = false;
		},
		onScroll(event) {
			if (listElement) return;
			handleScroll(event.currentTarget);
		},
		...alignItemWithTriggerActive && { style: listElement ? { height: "100%" } : LIST_FUNCTIONAL_STYLES }
	};
	const element = useRenderElement("div", componentProps, {
		ref: [forwardedRef, popupRef],
		state,
		stateAttributesMapping: stateAttributesMapping$1,
		props: [
			popupProps,
			defaultProps,
			getDisabledMountTransitionStyles(transitionStatus),
			{ className: !listElement && alignItemWithTriggerActive ? styleDisableScrollbar.className : void 0 },
			elementProps
		]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [!disableStyleElements && styleDisableScrollbar.getElement(nonce), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingRootContext,
		modal: false,
		disabled: !mounted,
		returnFocus: finalFocus,
		restoreFocus: true,
		children: element
	})] });
});
SelectPopup.displayName = "SelectPopup";
function getMaxPopupHeight(popupStyles) {
	const maxHeightStyle = popupStyles.maxHeight || "";
	return maxHeightStyle.endsWith("px") ? parseFloat(maxHeightStyle) || Infinity : Infinity;
}
function getMaxScrollTop(scroller) {
	return getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
}
function getScale(element) {
	return platform.getScale(element);
}
function normalizeSize(size, axis, scale) {
	return size / scale[axis];
}
function normalizeRect(rect, scale) {
	return rectToClientRect({
		x: normalizeSize(rect.x, "x", scale),
		y: normalizeSize(rect.y, "y", scale),
		width: normalizeSize(rect.width, "x", scale),
		height: normalizeSize(rect.height, "y", scale)
	});
}
var TRANSFORM_STYLE_RESETS = [
	["transform", "none"],
	["scale", "1"],
	["translate", "0 0"]
];
function unsetTransformStyles(popupElement) {
	const { style } = popupElement;
	const originalStyles = {};
	for (const [property, value] of TRANSFORM_STYLE_RESETS) {
		originalStyles[property] = style.getPropertyValue(property);
		style.setProperty(property, value, "important");
	}
	return () => {
		for (const [property] of TRANSFORM_STYLE_RESETS) {
			const originalValue = originalStyles[property];
			if (originalValue) style.setProperty(property, originalValue);
			else style.removeProperty(property);
		}
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/list/SelectList.js
/**
* A container for the select items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectList = /*#__PURE__*/ import_react.forwardRef(function SelectList(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store, scrollHandlerRef } = useSelectRootContext();
	const { alignItemWithTriggerActive } = useSelectPositionerContext();
	const hasScrollArrows = useStore(store, selectors.hasScrollArrows);
	const openMethod = useStore(store, selectors.openMethod);
	const multiple = useStore(store, selectors.multiple);
	const defaultProps = {
		id: `${useStore(store, selectors.id)}-list`,
		role: "listbox",
		"aria-multiselectable": multiple || void 0,
		onScroll(event) {
			scrollHandlerRef.current?.(event.currentTarget);
		},
		...alignItemWithTriggerActive && { style: LIST_FUNCTIONAL_STYLES },
		className: hasScrollArrows && openMethod !== "touch" ? styleDisableScrollbar.className : void 0
	};
	const setListElement = useStableCallback((element) => {
		store.set("listElement", element);
	});
	return useRenderElement("div", componentProps, {
		ref: [forwardedRef, setListElement],
		props: [defaultProps, elementProps]
	});
});
SelectList.displayName = "SelectList";
//#endregion
//#region node_modules/@base-ui/react/esm/select/item/SelectItemContext.js
var SelectItemContext = /*#__PURE__*/ import_react.createContext(void 0);
SelectItemContext.displayName = "SelectItemContext";
function useSelectItemContext() {
	const context = import_react.useContext(SelectItemContext);
	if (!context) throw new Error("Base UI: SelectItemContext is missing. SelectItem parts must be placed within <Select.Item>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/item/SelectItem.js
/**
* An individual option in the select popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItem = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function SelectItem(componentProps, forwardedRef) {
	const { render, className, style, value: itemValue = null, label, disabled = false, nativeButton = false, ...elementProps } = componentProps;
	const textRef = import_react.useRef(null);
	const listItem = useCompositeListItem({
		label,
		textRef,
		indexGuessBehavior: IndexGuessBehavior.GuessFromOrder
	});
	const { store, itemProps, setOpen, setValue, selectionRef, typingRef, valuesRef, multiple, selectedItemTextRef } = useSelectRootContext();
	const highlighted = useStore(store, selectors.isActive, listItem.index);
	const selected = useStore(store, selectors.isSelected, listItem.index, itemValue);
	const selectedByFocus = useStore(store, selectors.isSelectedByFocus, listItem.index);
	const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
	const index = listItem.index;
	const hasRegistered = index !== -1;
	const itemRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (!hasRegistered) return;
		const values = valuesRef.current;
		values[index] = itemValue;
		return () => {
			delete values[index];
		};
	}, [
		hasRegistered,
		index,
		itemValue,
		valuesRef
	]);
	useIsoLayoutEffect(() => {
		if (!hasRegistered) return;
		const selectedValue = store.state.value;
		let selectedCandidate = selectedValue;
		if (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) selectedCandidate = selectedValue[selectedValue.length - 1];
		if (selectedCandidate !== void 0 && compareItemEquality(itemValue, selectedCandidate, isItemEqualToValue)) {
			store.set("selectedIndex", index);
			if (textRef.current) selectedItemTextRef.current = textRef.current;
		}
	}, [
		hasRegistered,
		index,
		multiple,
		isItemEqualToValue,
		store,
		itemValue,
		selectedItemTextRef
	]);
	const lastKeyRef = import_react.useRef(null);
	const pointerTypeRef = import_react.useRef("mouse");
	const allowMouseSelectionRef = import_react.useRef(false);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled: true,
		native: nativeButton,
		composite: true
	});
	const state = {
		disabled,
		selected,
		highlighted
	};
	function commitSelection(event) {
		const selectedValue = store.state.value;
		if (multiple) {
			const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
			const nextValue = selected ? removeItem(currentValue, itemValue, isItemEqualToValue) : [...currentValue, itemValue];
			setValue(nextValue, createChangeEventDetails(itemPress, event));
		} else {
			setValue(itemValue, createChangeEventDetails(itemPress, event));
			setOpen(false, createChangeEventDetails(itemPress, event));
		}
	}
	function resetDragMovement() {
		selectionRef.current.dragY = 0;
	}
	const defaultProps = {
		role: "option",
		"aria-selected": selected,
		tabIndex: highlighted ? 0 : -1,
		onKeyDown(event) {
			lastKeyRef.current = event.key;
			store.set("activeIndex", index);
			if (event.key === " " && typingRef.current) event.preventDefault();
		},
		onClick(event) {
			const isMouseClick = event.type === "click" && pointerTypeRef.current !== "touch";
			const clickPointerType = event.nativeEvent.pointerType;
			const isVirtualMouseClick = isMouseClick && isVirtualClick(event.nativeEvent) && (clickPointerType !== void 0 || highlighted);
			const isInvalidMouseClick = isMouseClick && !isVirtualMouseClick && !allowMouseSelectionRef.current;
			allowMouseSelectionRef.current = false;
			if (event.type === "keydown" && lastKeyRef.current === null) return;
			if (disabled || event.type === "keydown" && lastKeyRef.current === " " && typingRef.current || isInvalidMouseClick) return;
			lastKeyRef.current = null;
			commitSelection(event.nativeEvent);
		},
		onPointerEnter(event) {
			pointerTypeRef.current = event.pointerType;
		},
		onPointerMove(event) {
			if (event.pointerType === "mouse" && event.buttons === 1) {
				const selection = selectionRef.current;
				selection.dragY += event.movementY;
				if (selection.dragY ** 2 >= 64) selection.allowUnselectedMouseUp = true;
			}
		},
		onPointerDown(event) {
			pointerTypeRef.current = event.pointerType;
			allowMouseSelectionRef.current = true;
			resetDragMovement();
		},
		onMouseUp() {
			resetDragMovement();
			if (disabled || pointerTypeRef.current === "touch") return;
			if (allowMouseSelectionRef.current) return;
			const disallowSelectedMouseUp = !selectionRef.current.allowSelectedMouseUp && selected;
			const disallowUnselectedMouseUp = !selectionRef.current.allowUnselectedMouseUp && !selected;
			if (disallowSelectedMouseUp || disallowUnselectedMouseUp) return;
			allowMouseSelectionRef.current = true;
			itemRef.current?.click();
			allowMouseSelectionRef.current = false;
		}
	};
	const element = useRenderElement("div", componentProps, {
		ref: [
			buttonRef,
			forwardedRef,
			listItem.ref,
			itemRef
		],
		state,
		props: [
			itemProps,
			defaultProps,
			elementProps,
			getButtonProps
		]
	});
	const contextValue = import_react.useMemo(() => ({
		selected,
		index,
		textRef,
		selectedByFocus,
		hasRegistered
	}), [
		selected,
		index,
		textRef,
		selectedByFocus,
		hasRegistered
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectItemContext.Provider, {
		value: contextValue,
		children: element
	});
}));
SelectItem.displayName = "SelectItem";
//#endregion
//#region node_modules/@base-ui/react/esm/select/item-indicator/SelectItemIndicator.js
/**
* Indicates whether the select item is selected.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItemIndicator = /*#__PURE__*/ import_react.forwardRef(function SelectItemIndicator(componentProps, forwardedRef) {
	const keepMounted = componentProps.keepMounted ?? false;
	const { selected } = useSelectItemContext();
	if (!(keepMounted || selected)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Inner, {
		...componentProps,
		ref: forwardedRef
	});
});
SelectItemIndicator.displayName = "SelectItemIndicator";
var Inner = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef((componentProps, forwardedRef) => {
	const { render, className, style, keepMounted, ...elementProps } = componentProps;
	const { selected } = useSelectItemContext();
	const indicatorRef = import_react.useRef(null);
	const { transitionStatus, setMounted } = useTransitionStatus(selected);
	const element = useRenderElement("span", componentProps, {
		ref: [forwardedRef, indicatorRef],
		state: {
			selected,
			transitionStatus
		},
		props: [{
			"aria-hidden": true,
			children: "✔️"
		}, elementProps],
		stateAttributesMapping: transitionStatusMapping
	});
	useOpenChangeComplete({
		open: selected,
		ref: indicatorRef,
		onComplete() {
			if (!selected) setMounted(false);
		}
	});
	return element;
}));
Inner.displayName = "Inner";
//#endregion
//#region node_modules/@base-ui/react/esm/select/item-text/SelectItemText.js
/**
* A text label of the select item.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItemText = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function SelectItemText(componentProps, forwardedRef) {
	const { index, textRef, selectedByFocus, hasRegistered } = useSelectItemContext();
	const { firstItemTextRef, selectedItemTextRef } = useSelectRootContext();
	const { render, className, style, ...elementProps } = componentProps;
	const localRef = import_react.useCallback((node) => {
		if (!node) return;
		if (hasRegistered && index === 0) firstItemTextRef.current = node;
		if (hasRegistered && selectedByFocus) selectedItemTextRef.current = node;
	}, [
		firstItemTextRef,
		selectedItemTextRef,
		index,
		selectedByFocus,
		hasRegistered
	]);
	return useRenderElement("div", componentProps, {
		ref: [
			localRef,
			forwardedRef,
			textRef
		],
		props: elementProps
	});
}));
SelectItemText.displayName = "SelectItemText";
//#endregion
//#region node_modules/@base-ui/react/esm/select/arrow/SelectArrow.js
var stateAttributesMapping = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* Displays an element positioned against the select popup anchor.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectArrow = /*#__PURE__*/ import_react.forwardRef(function SelectArrow(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store } = useSelectRootContext();
	const { side, align, arrowRef, arrowStyles, arrowUncentered, alignItemWithTriggerActive } = useSelectPositionerContext();
	const state = {
		open: useStore(store, selectors.open, true),
		side,
		align,
		uncentered: arrowUncentered
	};
	const element = useRenderElement("div", componentProps, {
		state,
		ref: [arrowRef, forwardedRef],
		props: [{
			style: arrowStyles,
			"aria-hidden": true
		}, elementProps],
		stateAttributesMapping
	});
	if (alignItemWithTriggerActive) return null;
	return element;
});
SelectArrow.displayName = "SelectArrow";
//#endregion
//#region node_modules/@base-ui/react/esm/select/scroll-arrow/SelectScrollArrow.js
/**
* @internal
*/
var SelectScrollArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollArrow(componentProps, forwardedRef) {
	const { render, className, style, direction, keepMounted = false, ...elementProps } = componentProps;
	const isUp = direction === "up";
	const { store, popupRef, listRef, handleScrollArrowVisibility, scrollArrowsMountedCountRef } = useSelectRootContext();
	const { side, scrollDownArrowRef, scrollUpArrowRef } = useSelectPositionerContext();
	const visibleSelector = isUp ? selectors.scrollUpArrowVisible : selectors.scrollDownArrowVisible;
	const stateVisible = useStore(store, visibleSelector);
	const openMethod = useStore(store, selectors.openMethod);
	const visible = stateVisible && openMethod !== "touch";
	const timeout = useTimeout();
	const scrollArrowRef = isUp ? scrollUpArrowRef : scrollDownArrowRef;
	const { transitionStatus, setMounted } = useTransitionStatus(visible);
	useIsoLayoutEffect(() => {
		scrollArrowsMountedCountRef.current += 1;
		if (!store.state.hasScrollArrows) store.set("hasScrollArrows", true);
		return () => {
			scrollArrowsMountedCountRef.current = Math.max(0, scrollArrowsMountedCountRef.current - 1);
			if (scrollArrowsMountedCountRef.current === 0 && store.state.hasScrollArrows) store.set("hasScrollArrows", false);
		};
	}, [store, scrollArrowsMountedCountRef]);
	useOpenChangeComplete({
		open: visible,
		ref: scrollArrowRef,
		onComplete() {
			if (!visible) setMounted(false);
		}
	});
	const element = useRenderElement("div", componentProps, {
		ref: [forwardedRef, scrollArrowRef],
		state: {
			direction,
			visible,
			side,
			transitionStatus
		},
		props: [{
			"aria-hidden": true,
			children: isUp ? "▲" : "▼",
			style: { position: "absolute" },
			onMouseMove(event) {
				if (event.movementX === 0 && event.movementY === 0 || timeout.isStarted()) return;
				store.set("activeIndex", null);
				function scrollNextItem() {
					const scroller = store.state.listElement ?? popupRef.current;
					if (!scroller) return;
					store.set("activeIndex", null);
					handleScrollArrowVisibility();
					const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
					const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
					const isScrolledToEdge = scrollTop === (isUp ? 0 : maxScrollTop);
					const items = listRef.current;
					if (scrollTop !== scroller.scrollTop) scroller.scrollTop = scrollTop;
					if (items.length === 0) store.set(isUp ? "scrollUpArrowVisible" : "scrollDownArrowVisible", !isScrolledToEdge);
					if (isScrolledToEdge) {
						timeout.clear();
						return;
					}
					if (items.length > 0) {
						const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;
						scroller.scrollTop = getTargetScrollTop(items, isUp, scrollTop, scroller.clientHeight, scrollArrowHeight, maxScrollTop);
					}
					timeout.start(40, scrollNextItem);
				}
				timeout.start(40, scrollNextItem);
			},
			onMouseLeave() {
				timeout.clear();
			}
		}, elementProps]
	});
	if (!(visible || keepMounted)) return null;
	return element;
});
SelectScrollArrow.displayName = "SelectScrollArrow";
function getTargetScrollTop(items, isUp, scrollTop, clientHeight, scrollArrowHeight, maxScrollTop) {
	if (isUp) {
		let firstVisibleIndex = 0;
		const visibleTop = scrollTop + scrollArrowHeight - 1;
		for (let i = 0; i < items.length; i += 1) {
			const item = items[i];
			if (item && item.offsetTop >= visibleTop) {
				firstVisibleIndex = i;
				break;
			}
		}
		const targetIndex = Math.max(0, firstVisibleIndex - 1);
		const targetItem = items[targetIndex];
		return targetIndex < firstVisibleIndex && targetItem ? normalizeScrollOffset(targetItem.offsetTop - scrollArrowHeight, maxScrollTop) : 0;
	}
	let lastVisibleIndex = items.length - 1;
	const visibleBottom = scrollTop + clientHeight - scrollArrowHeight + 1;
	for (let i = 0; i < items.length; i += 1) {
		const item = items[i];
		if (item && item.offsetTop + item.offsetHeight > visibleBottom) {
			lastVisibleIndex = Math.max(0, i - 1);
			break;
		}
	}
	const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
	const targetItem = items[targetIndex];
	return targetIndex > lastVisibleIndex && targetItem ? normalizeScrollOffset(targetItem.offsetTop + targetItem.offsetHeight - clientHeight + scrollArrowHeight, maxScrollTop) : maxScrollTop;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/scroll-down-arrow/SelectScrollDownArrow.js
/**
* An element that scrolls the select popup down when hovered. Does not render when using touch input.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectScrollDownArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollDownArrow(props, forwardedRef) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectScrollArrow, {
		...props,
		ref: forwardedRef,
		direction: "down"
	});
});
SelectScrollDownArrow.displayName = "SelectScrollDownArrow";
//#endregion
//#region node_modules/@base-ui/react/esm/select/scroll-up-arrow/SelectScrollUpArrow.js
/**
* An element that scrolls the select popup up when hovered. Does not render when using touch input.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectScrollUpArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollUpArrow(props, forwardedRef) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectScrollArrow, {
		...props,
		ref: forwardedRef,
		direction: "up"
	});
});
SelectScrollUpArrow.displayName = "SelectScrollUpArrow";
//#endregion
//#region node_modules/@base-ui/react/esm/select/group/SelectGroupContext.js
var SelectGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
SelectGroupContext.displayName = "SelectGroupContext";
function useSelectGroupContext() {
	const context = import_react.useContext(SelectGroupContext);
	if (context === void 0) throw new Error("Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/select/group/SelectGroup.js
/**
* Groups related select items with the corresponding label.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectGroup = /*#__PURE__*/ import_react.forwardRef(function SelectGroup(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const [labelId, setLabelId] = import_react.useState();
	const contextValue = import_react.useMemo(() => ({
		labelId,
		setLabelId
	}), [labelId, setLabelId]);
	const element = useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: [{
			role: "group",
			"aria-labelledby": labelId
		}, elementProps]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectGroupContext.Provider, {
		value: contextValue,
		children: element
	});
});
SelectGroup.displayName = "SelectGroup";
//#endregion
//#region node_modules/@base-ui/react/esm/select/group-label/SelectGroupLabel.js
/**
* An accessible label that is automatically associated with its parent group.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectGroupLabel = /*#__PURE__*/ import_react.forwardRef(function SelectGroupLabel(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const { setLabelId } = useSelectGroupContext();
	const id = useBaseUiId(idProp);
	useIsoLayoutEffect(() => {
		setLabelId(id);
	}, [id, setLabelId]);
	return useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: [{ id }, elementProps]
	});
});
SelectGroupLabel.displayName = "SelectGroupLabel";
//#endregion
//#region node_modules/@base-ui/react/esm/select/index.parts.js
var index_parts_exports = /* @__PURE__ */ __exportAll({
	Arrow: () => SelectArrow,
	Backdrop: () => SelectBackdrop,
	Group: () => SelectGroup,
	GroupLabel: () => SelectGroupLabel,
	Icon: () => SelectIcon,
	Item: () => SelectItem,
	ItemIndicator: () => SelectItemIndicator,
	ItemText: () => SelectItemText,
	Label: () => SelectLabel,
	List: () => SelectList,
	Popup: () => SelectPopup,
	Portal: () => SelectPortal,
	Positioner: () => SelectPositioner,
	Root: () => SelectRoot,
	ScrollDownArrow: () => SelectScrollDownArrow,
	ScrollUpArrow: () => SelectScrollUpArrow,
	Separator: () => Separator,
	Trigger: () => SelectTrigger,
	Value: () => SelectValue
});
//#endregion
export { index_parts_exports as Select };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQGJhc2UtdWlfcmVhY3Rfc2VsZWN0LmpzIiwibmFtZXMiOlsiUkVBU09OUy5ub25lIiwic3RhdGVBdHRyaWJ1dGVzTWFwcGluZyIsIlJFQVNPTlMubm9uZSIsIlJFQVNPTlMuY2FuY2VsT3BlbiIsInN0YXRlQXR0cmlidXRlc01hcHBpbmciLCJzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nIiwiUkVBU09OUy5ub25lIiwic3RhdGVBdHRyaWJ1dGVzTWFwcGluZyIsIm93bmVyV2luZG93IiwiUkVBU09OUy53aW5kb3dSZXNpemUiLCJmbG9hdGluZ1BsYXRmb3JtIiwiUkVBU09OUy5pdGVtUHJlc3MiLCJiYXNlTWFwcGluZyJdLCJzb3VyY2VzIjpbIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy91c2VSZWdpc3RlcmVkTGFiZWxJZC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvbGFiZWxhYmxlLXByb3ZpZGVyL3VzZUxhYmVsLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2ludGVybmFscy9pdGVtRXF1YWxpdHkuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vaW50ZXJuYWxzL3NlcmlhbGl6ZVZhbHVlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2ludGVybmFscy9yZXNvbHZlVmFsdWVMYWJlbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3Qvc3RvcmUuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vaW50ZXJuYWxzL2NsYW1wLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3V0aWxzL3Njcm9sbEVkZ2VzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9yb290L1NlbGVjdFJvb3QuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvcmVzb2x2ZUFyaWFMYWJlbGxlZEJ5LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9sYWJlbC9TZWxlY3RMYWJlbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvdHJpZ2dlci9TZWxlY3RUcmlnZ2VyLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC92YWx1ZS9TZWxlY3RWYWx1ZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvaWNvbi9TZWxlY3RJY29uLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9wb3J0YWwvU2VsZWN0UG9ydGFsQ29udGV4dC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvcG9ydGFsL1NlbGVjdFBvcnRhbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvYmFja2Ryb3AvU2VsZWN0QmFja2Ryb3AuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vc2VsZWN0L3Bvc2l0aW9uZXIvU2VsZWN0UG9zaXRpb25lckNvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vc2VsZWN0L3BvcHVwL3V0aWxzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9wb3NpdGlvbmVyL1NlbGVjdFBvc2l0aW9uZXIuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvc3R5bGVzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9wb3B1cC9TZWxlY3RQb3B1cC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvbGlzdC9TZWxlY3RMaXN0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9pdGVtL1NlbGVjdEl0ZW1Db250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9pdGVtL1NlbGVjdEl0ZW0uanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vc2VsZWN0L2l0ZW0taW5kaWNhdG9yL1NlbGVjdEl0ZW1JbmRpY2F0b3IuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vc2VsZWN0L2l0ZW0tdGV4dC9TZWxlY3RJdGVtVGV4dC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvYXJyb3cvU2VsZWN0QXJyb3cuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vc2VsZWN0L3Njcm9sbC1hcnJvdy9TZWxlY3RTY3JvbGxBcnJvdy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3Qvc2Nyb2xsLWRvd24tYXJyb3cvU2VsZWN0U2Nyb2xsRG93bkFycm93LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9zY3JvbGwtdXAtYXJyb3cvU2VsZWN0U2Nyb2xsVXBBcnJvdy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvZ3JvdXAvU2VsZWN0R3JvdXBDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3NlbGVjdC9ncm91cC9TZWxlY3RHcm91cC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvZ3JvdXAtbGFiZWwvU2VsZWN0R3JvdXBMYWJlbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9zZWxlY3QvaW5kZXgucGFydHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlUmVnaXN0ZXJlZExhYmVsSWQoaWRQcm9wLCBzZXRMYWJlbElkKSB7XG4gIGNvbnN0IGlkID0gdXNlQmFzZVVpSWQoaWRQcm9wKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzZXRMYWJlbElkKGlkKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgc2V0TGFiZWxJZCh1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sIFtpZCwgc2V0TGFiZWxJZF0pO1xuICByZXR1cm4gaWQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyBpc0hUTUxFbGVtZW50IH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzL2RvbSc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBnZXRUYXJnZXQgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMuanNcIjtcbmltcG9ydCB7IHVzZVJlZ2lzdGVyZWRMYWJlbElkIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3VzZVJlZ2lzdGVyZWRMYWJlbElkLmpzXCI7XG5pbXBvcnQgeyB1c2VMYWJlbGFibGVDb250ZXh0IH0gZnJvbSBcIi4vTGFiZWxhYmxlQ29udGV4dC5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUxhYmVsKHBhcmFtcyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBpZDogaWRQcm9wLFxuICAgIGZhbGxiYWNrQ29udHJvbElkLFxuICAgIG5hdGl2ZSA9IGZhbHNlLFxuICAgIHNldExhYmVsSWQ6IHNldExhYmVsSWRQcm9wLFxuICAgIGZvY3VzQ29udHJvbDogZm9jdXNDb250cm9sUHJvcFxuICB9ID0gcGFyYW1zO1xuICBjb25zdCB7XG4gICAgY29udHJvbElkOiBjb250ZXh0Q29udHJvbElkLFxuICAgIHNldExhYmVsSWQ6IHNldENvbnRleHRMYWJlbElkXG4gIH0gPSB1c2VMYWJlbGFibGVDb250ZXh0KCk7XG4gIGNvbnN0IHN5bmNMYWJlbElkID0gdXNlU3RhYmxlQ2FsbGJhY2sobmV4dExhYmVsSWQgPT4ge1xuICAgIHNldENvbnRleHRMYWJlbElkKG5leHRMYWJlbElkKTtcbiAgICBzZXRMYWJlbElkUHJvcD8uKG5leHRMYWJlbElkKTtcbiAgfSk7XG4gIGNvbnN0IGlkID0gdXNlUmVnaXN0ZXJlZExhYmVsSWQoaWRQcm9wLCBzeW5jTGFiZWxJZCk7XG4gIGNvbnN0IHJlc29sdmVkQ29udHJvbElkID0gY29udGV4dENvbnRyb2xJZCA/PyBmYWxsYmFja0NvbnRyb2xJZDtcbiAgZnVuY3Rpb24gZm9jdXNDb250cm9sKGV2ZW50KSB7XG4gICAgaWYgKGZvY3VzQ29udHJvbFByb3ApIHtcbiAgICAgIGZvY3VzQ29udHJvbFByb3AoZXZlbnQsIHJlc29sdmVkQ29udHJvbElkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFyZXNvbHZlZENvbnRyb2xJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjb250cm9sRWxlbWVudCA9IG93bmVyRG9jdW1lbnQoZXZlbnQuY3VycmVudFRhcmdldCkuZ2V0RWxlbWVudEJ5SWQocmVzb2x2ZWRDb250cm9sSWQpO1xuICAgIGlmIChpc0hUTUxFbGVtZW50KGNvbnRyb2xFbGVtZW50KSkge1xuICAgICAgZm9jdXNFbGVtZW50V2l0aFZpc2libGUoY29udHJvbEVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVJbnRlcmFjdGlvbihldmVudCkge1xuICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudC5uYXRpdmVFdmVudCk7XG4gICAgaWYgKHRhcmdldD8uY2xvc2VzdCgnYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUHJldmVudCB0ZXh0IHNlbGVjdGlvbiB3aGVuIGRvdWJsZSBjbGlja2luZyBsYWJlbC5cbiAgICBpZiAoIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQgJiYgZXZlbnQuZGV0YWlsID4gMSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gICAgaWYgKG5hdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb2N1c0NvbnRyb2woZXZlbnQpO1xuICB9XG4gIHJldHVybiBuYXRpdmUgPyB7XG4gICAgaWQsXG4gICAgaHRtbEZvcjogcmVzb2x2ZWRDb250cm9sSWQgPz8gdW5kZWZpbmVkLFxuICAgIG9uTW91c2VEb3duOiBoYW5kbGVJbnRlcmFjdGlvblxuICB9IDoge1xuICAgIGlkLFxuICAgIG9uQ2xpY2s6IGhhbmRsZUludGVyYWN0aW9uLFxuICAgIG9uUG9pbnRlckRvd24oZXZlbnQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvY3VzRWxlbWVudFdpdGhWaXNpYmxlKGVsZW1lbnQpIHtcbiAgZWxlbWVudC5mb2N1cyh7XG4gICAgLy8gQXZhaWxhYmxlIGZyb20gQ2hyb21lIDE0NCsgKEphbnVhcnkgMjAyNikuXG4gICAgLy8gU2FmYXJpIGFuZCBGaXJlZm94IGFscmVhZHkgc3VwcG9ydCBpdC5cbiAgICBmb2N1c1Zpc2libGU6IHRydWVcbiAgfSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgU2VsZWN0Um9vdENvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dChudWxsKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdFJvb3RDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJTZWxlY3RSb290Q29udGV4dFwiO1xuZXhwb3J0IGNvbnN0IFNlbGVjdEZsb2F0aW5nQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KG51bGwpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0RmxvYXRpbmdDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJTZWxlY3RGbG9hdGluZ0NvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VTZWxlY3RSb290Q29udGV4dCgpIHtcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoU2VsZWN0Um9vdENvbnRleHQpO1xuICBpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogU2VsZWN0Um9vdENvbnRleHQgaXMgbWlzc2luZy4gU2VsZWN0IHBhcnRzIG11c3QgYmUgcGxhY2VkIHdpdGhpbiA8U2VsZWN0LlJvb3Q+LicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDYwKSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5leHBvcnQgZnVuY3Rpb24gdXNlU2VsZWN0RmxvYXRpbmdDb250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChTZWxlY3RGbG9hdGluZ0NvbnRleHQpO1xuICBpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogU2VsZWN0RmxvYXRpbmdDb250ZXh0IGlzIG1pc3NpbmcuIFNlbGVjdCBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPFNlbGVjdC5Sb290Pi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSg2MSkpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufSIsImV4cG9ydCBjb25zdCBkZWZhdWx0SXRlbUVxdWFsaXR5ID0gKGl0ZW1WYWx1ZSwgc2VsZWN0ZWRWYWx1ZSkgPT4gT2JqZWN0LmlzKGl0ZW1WYWx1ZSwgc2VsZWN0ZWRWYWx1ZSk7XG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZUl0ZW1FcXVhbGl0eShpdGVtVmFsdWUsIHNlbGVjdGVkVmFsdWUsIGNvbXBhcmVyKSB7XG4gIGlmIChpdGVtVmFsdWUgPT0gbnVsbCB8fCBzZWxlY3RlZFZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gT2JqZWN0LmlzKGl0ZW1WYWx1ZSwgc2VsZWN0ZWRWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIGNvbXBhcmVyKGl0ZW1WYWx1ZSwgc2VsZWN0ZWRWYWx1ZSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0ZWRWYWx1ZUluY2x1ZGVzKHNlbGVjdGVkVmFsdWVzLCBpdGVtVmFsdWUsIGNvbXBhcmVyKSB7XG4gIGlmICghc2VsZWN0ZWRWYWx1ZXMgfHwgc2VsZWN0ZWRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBzZWxlY3RlZFZhbHVlcy5zb21lKHNlbGVjdGVkVmFsdWUgPT4ge1xuICAgIGlmIChzZWxlY3RlZFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBhcmVJdGVtRXF1YWxpdHkoaXRlbVZhbHVlLCBzZWxlY3RlZFZhbHVlLCBjb21wYXJlcik7XG4gIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRJdGVtSW5kZXgoaXRlbVZhbHVlcywgc2VsZWN0ZWRWYWx1ZSwgY29tcGFyZXIpIHtcbiAgaWYgKCFpdGVtVmFsdWVzIHx8IGl0ZW1WYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIHJldHVybiBpdGVtVmFsdWVzLmZpbmRJbmRleChpdGVtVmFsdWUgPT4ge1xuICAgIGlmIChpdGVtVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gY29tcGFyZUl0ZW1FcXVhbGl0eShpdGVtVmFsdWUsIHNlbGVjdGVkVmFsdWUsIGNvbXBhcmVyKTtcbiAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlSXRlbShzZWxlY3RlZFZhbHVlcywgaXRlbVZhbHVlLCBjb21wYXJlcikge1xuICByZXR1cm4gc2VsZWN0ZWRWYWx1ZXMuZmlsdGVyKHNlbGVjdGVkVmFsdWUgPT4gIWNvbXBhcmVJdGVtRXF1YWxpdHkoaXRlbVZhbHVlLCBzZWxlY3RlZFZhbHVlLCBjb21wYXJlcikpO1xufSIsImV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVWYWx1ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICB9XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBzZXJpYWxpemVWYWx1ZSB9IGZyb20gXCIuL3NlcmlhbGl6ZVZhbHVlLmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGlzR3JvdXBlZEl0ZW1zKGl0ZW1zKSB7XG4gIHJldHVybiBpdGVtcyAhPSBudWxsICYmIGl0ZW1zLmxlbmd0aCA+IDAgJiYgdHlwZW9mIGl0ZW1zWzBdID09PSAnb2JqZWN0JyAmJiBpdGVtc1swXSAhPSBudWxsICYmICdpdGVtcycgaW4gaXRlbXNbMF07XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBpdGVtcyBhcnJheSBjb250YWlucyBhbiBpdGVtIHdpdGggYSBudWxsIHZhbHVlIHRoYXQgaGFzIGEgbm9uLW51bGwgbGFiZWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNOdWxsSXRlbUxhYmVsKGl0ZW1zKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICByZXR1cm4gaXRlbXMgIT0gbnVsbCAmJiAnbnVsbCcgaW4gaXRlbXM7XG4gIH1cbiAgY29uc3QgYXJyYXlJdGVtcyA9IGl0ZW1zO1xuICBpZiAoaXNHcm91cGVkSXRlbXMoYXJyYXlJdGVtcykpIHtcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGFycmF5SXRlbXMpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBncm91cC5pdGVtcykge1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnZhbHVlID09IG51bGwgJiYgaXRlbS5sYWJlbCAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAoY29uc3QgaXRlbSBvZiBhcnJheUl0ZW1zKSB7XG4gICAgaWYgKGl0ZW0gJiYgaXRlbS52YWx1ZSA9PSBudWxsICYmIGl0ZW0ubGFiZWwgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlBc0xhYmVsKGl0ZW0sIGl0ZW1Ub1N0cmluZ0xhYmVsKSB7XG4gIGlmIChpdGVtVG9TdHJpbmdMYWJlbCAmJiBpdGVtICE9IG51bGwpIHtcbiAgICByZXR1cm4gaXRlbVRvU3RyaW5nTGFiZWwoaXRlbSkgPz8gJyc7XG4gIH1cbiAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaWYgKCdsYWJlbCcgaW4gaXRlbSAmJiBpdGVtLmxhYmVsICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBTdHJpbmcoaXRlbS5sYWJlbCk7XG4gICAgfVxuICAgIGlmICgndmFsdWUnIGluIGl0ZW0pIHtcbiAgICAgIHJldHVybiBTdHJpbmcoaXRlbS52YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzZXJpYWxpemVWYWx1ZShpdGVtKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlBc1ZhbHVlKGl0ZW0sIGl0ZW1Ub1N0cmluZ1ZhbHVlKSB7XG4gIGlmIChpdGVtVG9TdHJpbmdWYWx1ZSAmJiBpdGVtICE9IG51bGwpIHtcbiAgICByZXR1cm4gaXRlbVRvU3RyaW5nVmFsdWUoaXRlbSkgPz8gJyc7XG4gIH1cbiAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICd2YWx1ZScgaW4gaXRlbSAmJiAnbGFiZWwnIGluIGl0ZW0pIHtcbiAgICByZXR1cm4gc2VyaWFsaXplVmFsdWUoaXRlbS52YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHNlcmlhbGl6ZVZhbHVlKGl0ZW0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVTZWxlY3RlZExhYmVsKHZhbHVlLCBpdGVtcywgaXRlbVRvU3RyaW5nTGFiZWwpIHtcbiAgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgcmV0dXJuIHN0cmluZ2lmeUFzTGFiZWwodmFsdWUsIGl0ZW1Ub1N0cmluZ0xhYmVsKTtcbiAgfVxuICBpZiAoaXRlbVRvU3RyaW5nTGFiZWwgJiYgdmFsdWUgIT0gbnVsbCkge1xuICAgIHJldHVybiBpdGVtVG9TdHJpbmdMYWJlbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBDdXN0b20gb2JqZWN0IHdpdGggZXhwbGljaXQgbGFiZWwgdGFrZXMgcHJlY2VkZW5jZVxuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAnbGFiZWwnIGluIHZhbHVlICYmIHZhbHVlLmxhYmVsICE9IG51bGwpIHtcbiAgICByZXR1cm4gdmFsdWUubGFiZWw7XG4gIH1cblxuICAvLyBJdGVtcyBwcm92aWRlZCBhcyBwbGFpbiByZWNvcmQgbWFwXG4gIGlmIChpdGVtcyAmJiAhQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICByZXR1cm4gaXRlbXNbdmFsdWVdID8/IGZhbGxiYWNrKCk7XG4gIH1cblxuICAvLyBJdGVtcyBwcm92aWRlZCBhcyBhcnJheSAoZmxhdCBvciBncm91cGVkKVxuICBpZiAoQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICBjb25zdCBhcnJheUl0ZW1zID0gaXRlbXM7XG4gICAgY29uc3QgZmxhdEl0ZW1zID0gaXNHcm91cGVkSXRlbXMoYXJyYXlJdGVtcykgPyBhcnJheUl0ZW1zLmZsYXRNYXAoZ3JvdXAgPT4gZ3JvdXAuaXRlbXMpIDogYXJyYXlJdGVtcztcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IGZsYXRJdGVtcy5maW5kKGl0ZW0gPT4gaXRlbS52YWx1ZSA9PT0gdmFsdWUpO1xuICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmxhYmVsICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoLmxhYmVsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IHdpdGhvdXQgZXhwbGljaXQgbGFiZWw6IHRyeSBtYXRjaGluZyBieSBpdHMgYHZhbHVlYCBwcm9wZXJ0eVxuICAgIGlmICgndmFsdWUnIGluIHZhbHVlKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IGZsYXRJdGVtcy5maW5kKGl0ZW0gPT4gaXRlbSAmJiBpdGVtLnZhbHVlID09PSB2YWx1ZS52YWx1ZSk7XG4gICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gubGFiZWwgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbWF0Y2gubGFiZWw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxsYmFjaygpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVNdWx0aXBsZUxhYmVscyh2YWx1ZXMsIGl0ZW1zLCBpdGVtVG9TdHJpbmdMYWJlbCkge1xuICByZXR1cm4gdmFsdWVzLnJlZHVjZSgoYWNjLCB2YWx1ZSwgaW5kZXgpID0+IHtcbiAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICBhY2MucHVzaCgnLCAnKTtcbiAgICB9XG4gICAgYWNjLnB1c2goLyojX19QVVJFX18qL19qc3goUmVhY3QuRnJhZ21lbnQsIHtcbiAgICAgIGNoaWxkcmVuOiByZXNvbHZlU2VsZWN0ZWRMYWJlbCh2YWx1ZSwgaXRlbXMsIGl0ZW1Ub1N0cmluZ0xhYmVsKVxuICAgIH0sIGluZGV4KSk7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwgW10pO1xufSIsImltcG9ydCB7IGNyZWF0ZVNlbGVjdG9yIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgY29tcGFyZUl0ZW1FcXVhbGl0eSB9IGZyb20gXCIuLi9pbnRlcm5hbHMvaXRlbUVxdWFsaXR5LmpzXCI7XG5pbXBvcnQgeyBoYXNOdWxsSXRlbUxhYmVsLCBzdHJpbmdpZnlBc1ZhbHVlIH0gZnJvbSBcIi4uL2ludGVybmFscy9yZXNvbHZlVmFsdWVMYWJlbC5qc1wiO1xuZXhwb3J0IGNvbnN0IHNlbGVjdG9ycyA9IHtcbiAgaWQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmlkKSxcbiAgbGFiZWxJZDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUubGFiZWxJZCksXG4gIG1vZGFsOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5tb2RhbCksXG4gIG11bHRpcGxlOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5tdWx0aXBsZSksXG4gIGl0ZW1zOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5pdGVtcyksXG4gIGl0ZW1Ub1N0cmluZ0xhYmVsOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5pdGVtVG9TdHJpbmdMYWJlbCksXG4gIGl0ZW1Ub1N0cmluZ1ZhbHVlOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5pdGVtVG9TdHJpbmdWYWx1ZSksXG4gIGlzSXRlbUVxdWFsVG9WYWx1ZTogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuaXNJdGVtRXF1YWxUb1ZhbHVlKSxcbiAgdmFsdWU6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLnZhbHVlKSxcbiAgaGFzU2VsZWN0ZWRWYWx1ZTogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHZhbHVlLFxuICAgICAgbXVsdGlwbGUsXG4gICAgICBpdGVtVG9TdHJpbmdWYWx1ZVxuICAgIH0gPSBzdGF0ZTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobXVsdGlwbGUgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPiAwO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5naWZ5QXNWYWx1ZSh2YWx1ZSwgaXRlbVRvU3RyaW5nVmFsdWUpICE9PSAnJztcbiAgfSksXG4gIGhhc051bGxJdGVtTGFiZWw6IGNyZWF0ZVNlbGVjdG9yKChzdGF0ZSwgZW5hYmxlZCkgPT4ge1xuICAgIHJldHVybiBlbmFibGVkID8gaGFzTnVsbEl0ZW1MYWJlbChzdGF0ZS5pdGVtcykgOiBmYWxzZTtcbiAgfSksXG4gIG9wZW46IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLm9wZW4pLFxuICBtb3VudGVkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5tb3VudGVkKSxcbiAgZm9yY2VNb3VudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuZm9yY2VNb3VudCksXG4gIHRyYW5zaXRpb25TdGF0dXM6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLnRyYW5zaXRpb25TdGF0dXMpLFxuICBvcGVuTWV0aG9kOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5vcGVuTWV0aG9kKSxcbiAgYWN0aXZlSW5kZXg6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmFjdGl2ZUluZGV4KSxcbiAgc2VsZWN0ZWRJbmRleDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuc2VsZWN0ZWRJbmRleCksXG4gIGlzQWN0aXZlOiBjcmVhdGVTZWxlY3Rvcigoc3RhdGUsIGluZGV4KSA9PiBzdGF0ZS5hY3RpdmVJbmRleCA9PT0gaW5kZXgpLFxuICBpc1NlbGVjdGVkOiBjcmVhdGVTZWxlY3Rvcigoc3RhdGUsIGluZGV4LCBpdGVtVmFsdWUpID0+IHtcbiAgICBjb25zdCBjb21wYXJlciA9IHN0YXRlLmlzSXRlbUVxdWFsVG9WYWx1ZTtcbiAgICBjb25zdCBzdG9yZVZhbHVlID0gc3RhdGUudmFsdWU7XG4gICAgaWYgKHN0YXRlLm11bHRpcGxlKSB7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShzdG9yZVZhbHVlKSAmJiBzdG9yZVZhbHVlLnNvbWUoc2VsZWN0ZWRJdGVtID0+IGNvbXBhcmVJdGVtRXF1YWxpdHkoaXRlbVZhbHVlLCBzZWxlY3RlZEl0ZW0sIGNvbXBhcmVyKSk7XG4gICAgfVxuXG4gICAgLy8gYHNlbGVjdGVkSW5kZXhgIGlzIG9ubHkgdXBkYXRlZCBhZnRlciB0aGUgaXRlbXMgbW91bnQgZm9yIHRoZSBmaXJzdCB0aW1lLFxuICAgIC8vIHRoZSB2YWx1ZSBjaGVjayBhdm9pZHMgYSByZS1yZW5kZXIgZm9yIHRoZSBpbml0aWFsbHkgc2VsZWN0ZWQgaXRlbS5cbiAgICBpZiAoc3RhdGUuc2VsZWN0ZWRJbmRleCA9PT0gaW5kZXggJiYgc3RhdGUuc2VsZWN0ZWRJbmRleCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBjb21wYXJlSXRlbUVxdWFsaXR5KGl0ZW1WYWx1ZSwgc3RvcmVWYWx1ZSwgY29tcGFyZXIpO1xuICB9KSxcbiAgaXNTZWxlY3RlZEJ5Rm9jdXM6IGNyZWF0ZVNlbGVjdG9yKChzdGF0ZSwgaW5kZXgpID0+IHtcbiAgICByZXR1cm4gc3RhdGUuc2VsZWN0ZWRJbmRleCA9PT0gaW5kZXg7XG4gIH0pLFxuICBwb3B1cFByb3BzOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5wb3B1cFByb3BzKSxcbiAgdHJpZ2dlclByb3BzOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS50cmlnZ2VyUHJvcHMpLFxuICB0cmlnZ2VyRWxlbWVudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUudHJpZ2dlckVsZW1lbnQpLFxuICBwb3NpdGlvbmVyRWxlbWVudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUucG9zaXRpb25lckVsZW1lbnQpLFxuICBsaXN0RWxlbWVudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUubGlzdEVsZW1lbnQpLFxuICBwb3B1cFNpZGU6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLnBvcHVwU2lkZSksXG4gIHNjcm9sbFVwQXJyb3dWaXNpYmxlOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5zY3JvbGxVcEFycm93VmlzaWJsZSksXG4gIHNjcm9sbERvd25BcnJvd1Zpc2libGU6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLnNjcm9sbERvd25BcnJvd1Zpc2libGUpLFxuICBoYXNTY3JvbGxBcnJvd3M6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmhhc1Njcm9sbEFycm93cylcbn07IiwiZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKHZhbCwgbWluID0gTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIsIG1heCA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKHZhbCwgbWF4KSk7XG59IiwiaW1wb3J0IHsgY2xhbXAgfSBmcm9tIFwiLi4vaW50ZXJuYWxzL2NsYW1wLmpzXCI7XG5leHBvcnQgY29uc3QgU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYID0gMTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXhTY3JvbGxPZmZzZXQoc2Nyb2xsU2l6ZSwgY2xpZW50U2l6ZSkge1xuICByZXR1cm4gTWF0aC5tYXgoMCwgc2Nyb2xsU2l6ZSAtIGNsaWVudFNpemUpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVNjcm9sbE9mZnNldCh2YWx1ZSwgbWF4KSB7XG4gIGlmIChtYXggPD0gMCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGNvbnN0IGNsYW1wZWQgPSBjbGFtcCh2YWx1ZSwgMCwgbWF4KTtcbiAgY29uc3Qgc3RhcnREaXN0YW5jZSA9IGNsYW1wZWQ7XG4gIGNvbnN0IGVuZERpc3RhbmNlID0gbWF4IC0gY2xhbXBlZDtcbiAgY29uc3Qgd2l0aGluU3RhcnRUb2xlcmFuY2UgPSBzdGFydERpc3RhbmNlIDw9IFNDUk9MTF9FREdFX1RPTEVSQU5DRV9QWDtcbiAgY29uc3Qgd2l0aGluRW5kVG9sZXJhbmNlID0gZW5kRGlzdGFuY2UgPD0gU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYO1xuICBpZiAod2l0aGluU3RhcnRUb2xlcmFuY2UgJiYgd2l0aGluRW5kVG9sZXJhbmNlKSB7XG4gICAgcmV0dXJuIHN0YXJ0RGlzdGFuY2UgPD0gZW5kRGlzdGFuY2UgPyAwIDogbWF4O1xuICB9XG4gIGlmICh3aXRoaW5TdGFydFRvbGVyYW5jZSkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGlmICh3aXRoaW5FbmRUb2xlcmFuY2UpIHtcbiAgICByZXR1cm4gbWF4O1xuICB9XG4gIHJldHVybiBjbGFtcGVkO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdmlzdWFsbHlIaWRkZW4sIHZpc3VhbGx5SGlkZGVuSW5wdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy92aXN1YWxseUhpZGRlbic7XG5pbXBvcnQgeyB1c2VNZXJnZWRSZWZzIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlTWVyZ2VkUmVmcyc7XG5pbXBvcnQgeyB1c2VSZWZXaXRoSW5pdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVJlZldpdGhJbml0JztcbmltcG9ydCB7IHVzZU9uRmlyc3RSZW5kZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VPbkZpcnN0UmVuZGVyJztcbmltcG9ydCB7IHVzZVByZXZpb3VzVmFsdWUgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VQcmV2aW91c1ZhbHVlJztcbmltcG9ydCB7IHVzZUNvbnRyb2xsZWQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VDb250cm9sbGVkJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IHVzZVZhbHVlQXNSZWYgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VWYWx1ZUFzUmVmJztcbmltcG9ydCB7IHVzZVN0b3JlLCBTdG9yZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3N0b3JlJztcbmltcG9ydCB7IEVNUFRZX0FSUkFZLCBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyB1c2VDbGljaywgdXNlRGlzbWlzcywgdXNlRmxvYXRpbmdSb290Q29udGV4dCwgdXNlTGlzdE5hdmlnYXRpb24sIHVzZVR5cGVhaGVhZCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgU2VsZWN0Um9vdENvbnRleHQsIFNlbGVjdEZsb2F0aW5nQ29udGV4dCB9IGZyb20gXCIuL1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VGaWVsZFJvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9maWVsZC1yb290LWNvbnRleHQvRmllbGRSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVnaXN0ZXJGaWVsZENvbnRyb2wgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2ZpZWxkLXJlZ2lzdGVyLWNvbnRyb2wvdXNlUmVnaXN0ZXJGaWVsZENvbnRyb2wuanNcIjtcbmltcG9ydCB7IHVzZUxhYmVsYWJsZUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9sYWJlbGFibGUtcHJvdmlkZXIvdXNlTGFiZWxhYmxlSWQuanNcIjtcbmltcG9ydCB7IHVzZVRyYW5zaXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVRyYW5zaXRpb25TdGF0dXMuanNcIjtcbmltcG9ydCB7IHNlbGVjdG9ycyB9IGZyb20gXCIuLi9zdG9yZS5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlT3BlbkNoYW5nZUNvbXBsZXRlLmpzXCI7XG5pbXBvcnQgeyB1c2VGb3JtQ29udGV4dCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvZm9ybS1jb250ZXh0L0Zvcm1Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyBzdHJpbmdpZnlBc0xhYmVsLCBzdHJpbmdpZnlBc1ZhbHVlIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZXNvbHZlVmFsdWVMYWJlbC5qc1wiO1xuaW1wb3J0IHsgZGVmYXVsdEl0ZW1FcXVhbGl0eSwgZmluZEl0ZW1JbmRleCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvaXRlbUVxdWFsaXR5LmpzXCI7XG5pbXBvcnQgeyB1c2VWYWx1ZUNoYW5nZWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVZhbHVlQ2hhbmdlZC5qc1wiO1xuaW1wb3J0IHsgdXNlT3BlbkludGVyYWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi91dGlscy91c2VPcGVuSW50ZXJhY3Rpb25UeXBlLmpzXCI7XG5pbXBvcnQgeyBnZXRNYXhTY3JvbGxPZmZzZXQsIG5vcm1hbGl6ZVNjcm9sbE9mZnNldCB9IGZyb20gXCIuLi8uLi91dGlscy9zY3JvbGxFZGdlcy5qc1wiO1xuaW1wb3J0IHsgRk9DVVNBQkxFX1BPUFVQX1BST1BTIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BvcHVwcy9pbmRleC5qc1wiO1xuaW1wb3J0IHsgbWVyZ2VQcm9wcyB9IGZyb20gXCIuLi8uLi9tZXJnZS1wcm9wcy9pbmRleC5qc1wiO1xuXG4vKipcbiAqIEdyb3VwcyBhbGwgcGFydHMgb2YgdGhlIHNlbGVjdC5cbiAqIERvZXNuJ3QgcmVuZGVyIGl0cyBvd24gSFRNTCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIFNlbGVjdF0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3NlbGVjdClcbiAqL1xuaW1wb3J0IHsganN4IGFzIF9qc3gsIGpzeHMgYXMgX2pzeHMgfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmV4cG9ydCBmdW5jdGlvbiBTZWxlY3RSb290KHByb3BzKSB7XG4gIGNvbnN0IHtcbiAgICBpZCxcbiAgICB2YWx1ZTogdmFsdWVQcm9wLFxuICAgIGRlZmF1bHRWYWx1ZSA9IG51bGwsXG4gICAgb25WYWx1ZUNoYW5nZSxcbiAgICBvcGVuOiBvcGVuUHJvcCxcbiAgICBkZWZhdWx0T3BlbiA9IGZhbHNlLFxuICAgIG9uT3BlbkNoYW5nZSxcbiAgICBuYW1lOiBuYW1lUHJvcCxcbiAgICBmb3JtLFxuICAgIGF1dG9Db21wbGV0ZSxcbiAgICBkaXNhYmxlZDogZGlzYWJsZWRQcm9wID0gZmFsc2UsXG4gICAgcmVhZE9ubHkgPSBmYWxzZSxcbiAgICByZXF1aXJlZCA9IGZhbHNlLFxuICAgIG1vZGFsID0gdHJ1ZSxcbiAgICBhY3Rpb25zUmVmLFxuICAgIGlucHV0UmVmLFxuICAgIG9uT3BlbkNoYW5nZUNvbXBsZXRlLFxuICAgIGl0ZW1zLFxuICAgIG11bHRpcGxlID0gZmFsc2UsXG4gICAgaXRlbVRvU3RyaW5nTGFiZWwsXG4gICAgaXRlbVRvU3RyaW5nVmFsdWUsXG4gICAgaXNJdGVtRXF1YWxUb1ZhbHVlID0gZGVmYXVsdEl0ZW1FcXVhbGl0eSxcbiAgICBoaWdobGlnaHRJdGVtT25Ib3ZlciA9IHRydWUsXG4gICAgY2hpbGRyZW5cbiAgfSA9IHByb3BzO1xuICBjb25zdCB7XG4gICAgY2xlYXJFcnJvcnNcbiAgfSA9IHVzZUZvcm1Db250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICBzZXREaXJ0eSxcbiAgICBzZXRUb3VjaGVkLFxuICAgIHNldEZvY3VzZWQsXG4gICAgc2hvdWxkVmFsaWRhdGVPbkNoYW5nZSxcbiAgICB2YWxpZGl0eURhdGEsXG4gICAgc2V0RmlsbGVkLFxuICAgIG5hbWU6IGZpZWxkTmFtZSxcbiAgICBkaXNhYmxlZDogZmllbGREaXNhYmxlZCxcbiAgICB2YWxpZGF0aW9uLFxuICAgIHZhbGlkYXRpb25Nb2RlXG4gIH0gPSB1c2VGaWVsZFJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IGdlbmVyYXRlZElkID0gdXNlTGFiZWxhYmxlSWQoe1xuICAgIGlkXG4gIH0pO1xuICBjb25zdCBkaXNhYmxlZCA9IGZpZWxkRGlzYWJsZWQgfHwgZGlzYWJsZWRQcm9wO1xuICBjb25zdCBuYW1lID0gZmllbGROYW1lID8/IG5hbWVQcm9wO1xuICBjb25zdCBbdmFsdWUsIHNldFZhbHVlVW53cmFwcGVkXSA9IHVzZUNvbnRyb2xsZWQoe1xuICAgIGNvbnRyb2xsZWQ6IHZhbHVlUHJvcCxcbiAgICBkZWZhdWx0OiBtdWx0aXBsZSA/IGRlZmF1bHRWYWx1ZSA/PyBFTVBUWV9BUlJBWSA6IGRlZmF1bHRWYWx1ZSxcbiAgICBuYW1lOiAnU2VsZWN0JyxcbiAgICBzdGF0ZTogJ3ZhbHVlJ1xuICB9KTtcbiAgY29uc3QgW29wZW4sIHNldE9wZW5VbndyYXBwZWRdID0gdXNlQ29udHJvbGxlZCh7XG4gICAgY29udHJvbGxlZDogb3BlblByb3AsXG4gICAgZGVmYXVsdDogZGVmYXVsdE9wZW4sXG4gICAgbmFtZTogJ1NlbGVjdCcsXG4gICAgc3RhdGU6ICdvcGVuJ1xuICB9KTtcbiAgY29uc3QgbGlzdFJlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIGNvbnN0IGxhYmVsc1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIGNvbnN0IHBvcHVwUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBzY3JvbGxIYW5kbGVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBzY3JvbGxBcnJvd3NNb3VudGVkQ291bnRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IHZhbHVlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2YWx1ZXNSZWYgPSBSZWFjdC51c2VSZWYoW10pO1xuICBjb25zdCB0eXBpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBrZXlib2FyZEFjdGl2ZVJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGZpcnN0SXRlbVRleHRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNlbGVjdGVkSXRlbVRleHRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNlbGVjdGlvblJlZiA9IFJlYWN0LnVzZVJlZih7XG4gICAgYWxsb3dTZWxlY3RlZE1vdXNlVXA6IGZhbHNlLFxuICAgIGFsbG93VW5zZWxlY3RlZE1vdXNlVXA6IGZhbHNlLFxuICAgIGRyYWdZOiAwXG4gIH0pO1xuICBjb25zdCBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZVJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHtcbiAgICBtb3VudGVkLFxuICAgIHNldE1vdW50ZWQsXG4gICAgdHJhbnNpdGlvblN0YXR1c1xuICB9ID0gdXNlVHJhbnNpdGlvblN0YXR1cyhvcGVuKTtcbiAgY29uc3Qge1xuICAgIG9wZW5NZXRob2QsXG4gICAgdHJpZ2dlclByb3BzOiBpbnRlcmFjdGlvblR5cGVQcm9wc1xuICB9ID0gdXNlT3BlbkludGVyYWN0aW9uVHlwZShvcGVuKTtcbiAgY29uc3Qgc3RvcmUgPSB1c2VSZWZXaXRoSW5pdCgoKSA9PiBuZXcgU3RvcmUoe1xuICAgIGlkOiBnZW5lcmF0ZWRJZCxcbiAgICBsYWJlbElkOiB1bmRlZmluZWQsXG4gICAgbW9kYWwsXG4gICAgbXVsdGlwbGUsXG4gICAgaXRlbVRvU3RyaW5nTGFiZWwsXG4gICAgaXRlbVRvU3RyaW5nVmFsdWUsXG4gICAgaXNJdGVtRXF1YWxUb1ZhbHVlLFxuICAgIHZhbHVlLFxuICAgIG9wZW4sXG4gICAgbW91bnRlZCxcbiAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgIGl0ZW1zLFxuICAgIGZvcmNlTW91bnQ6IGZhbHNlLFxuICAgIG9wZW5NZXRob2Q6IG51bGwsXG4gICAgYWN0aXZlSW5kZXg6IG51bGwsXG4gICAgc2VsZWN0ZWRJbmRleDogbnVsbCxcbiAgICBwb3B1cFByb3BzOiB7fSxcbiAgICB0cmlnZ2VyUHJvcHM6IHt9LFxuICAgIHRyaWdnZXJFbGVtZW50OiBudWxsLFxuICAgIHBvc2l0aW9uZXJFbGVtZW50OiBudWxsLFxuICAgIGxpc3RFbGVtZW50OiBudWxsLFxuICAgIHBvcHVwU2lkZTogbnVsbCxcbiAgICBzY3JvbGxVcEFycm93VmlzaWJsZTogZmFsc2UsXG4gICAgc2Nyb2xsRG93bkFycm93VmlzaWJsZTogZmFsc2UsXG4gICAgaGFzU2Nyb2xsQXJyb3dzOiBmYWxzZVxuICB9KSkuY3VycmVudDtcbiAgY29uc3QgYWN0aXZlSW5kZXggPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmFjdGl2ZUluZGV4KTtcbiAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuc2VsZWN0ZWRJbmRleCk7XG4gIGNvbnN0IHRyaWdnZXJFbGVtZW50ID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy50cmlnZ2VyRWxlbWVudCk7XG4gIGNvbnN0IHBvc2l0aW9uZXJFbGVtZW50ID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5wb3NpdGlvbmVyRWxlbWVudCk7XG4gIGNvbnN0IHByZXZpb3VzT3Blbk1ldGhvZCA9IHVzZVByZXZpb3VzVmFsdWUob3Blbk1ldGhvZCk7XG4gIGNvbnN0IHJlbmRlcmVkT3Blbk1ldGhvZCA9IG9wZW5NZXRob2QgPz8gcHJldmlvdXNPcGVuTWV0aG9kO1xuICBjb25zdCBzZXJpYWxpemVkVmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBpZiAobXVsdGlwbGUgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBzdHJpbmdpZnlBc1ZhbHVlKHZhbHVlLCBpdGVtVG9TdHJpbmdWYWx1ZSk7XG4gIH0sIFttdWx0aXBsZSwgdmFsdWUsIGl0ZW1Ub1N0cmluZ1ZhbHVlXSk7XG4gIGNvbnN0IGZpZWxkU3RyaW5nVmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBpZiAobXVsdGlwbGUgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5tYXAoY3VycmVudFZhbHVlID0+IHN0cmluZ2lmeUFzVmFsdWUoY3VycmVudFZhbHVlLCBpdGVtVG9TdHJpbmdWYWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5naWZ5QXNWYWx1ZSh2YWx1ZSwgaXRlbVRvU3RyaW5nVmFsdWUpO1xuICB9LCBbbXVsdGlwbGUsIHZhbHVlLCBpdGVtVG9TdHJpbmdWYWx1ZV0pO1xuICBjb25zdCBjb250cm9sUmVmID0gdXNlVmFsdWVBc1JlZihzdG9yZS5zdGF0ZS50cmlnZ2VyRWxlbWVudCk7XG4gIGNvbnN0IGdldFN0cmluZ2lmaWVkVmFsdWVGb3JGb3JtID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4gZmllbGRTdHJpbmdWYWx1ZSk7XG4gIHVzZVJlZ2lzdGVyRmllbGRDb250cm9sKGNvbnRyb2xSZWYsIGdlbmVyYXRlZElkLCB2YWx1ZSwgZ2V0U3RyaW5naWZpZWRWYWx1ZUZvckZvcm0pO1xuICBjb25zdCBpbml0aWFsVmFsdWVSZWYgPSBSZWFjdC51c2VSZWYodmFsdWUpO1xuICBjb25zdCBoYXNTZWxlY3RlZFZhbHVlID0gbXVsdGlwbGUgPyBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPiAwIDogdmFsdWUgIT0gbnVsbDtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAvLyBFbnN1cmUgdGhlIHZhbHVlcyBhbmQgbGFiZWxzIGFyZSByZWdpc3RlcmVkIGZvciBwcm9ncmFtbWF0aWMgdmFsdWUgY2hhbmdlcy5cbiAgICBpZiAodmFsdWUgIT09IGluaXRpYWxWYWx1ZVJlZi5jdXJyZW50KSB7XG4gICAgICBzdG9yZS5zZXQoJ2ZvcmNlTW91bnQnLCB0cnVlKTtcbiAgICB9XG4gIH0sIFtzdG9yZSwgdmFsdWVdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzZXRGaWxsZWQoaGFzU2VsZWN0ZWRWYWx1ZSk7XG4gIH0sIFtoYXNTZWxlY3RlZFZhbHVlLCBzZXRGaWxsZWRdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KGZ1bmN0aW9uIHN5bmNTZWxlY3RlZEluZGV4KCkge1xuICAgIGNvbnN0IHJlZ2lzdHJ5ID0gdmFsdWVzUmVmLmN1cnJlbnQ7XG4gICAgbGV0IG5leHRJbmRleDtcbiAgICBpZiAobXVsdGlwbGUpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXTtcbiAgICAgIGlmIChjdXJyZW50VmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG5leHRJbmRleCA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsYXN0VmFsdWUgPSBjdXJyZW50VmFsdWVbY3VycmVudFZhbHVlLmxlbmd0aCAtIDFdO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBmaW5kSXRlbUluZGV4KHJlZ2lzdHJ5LCBsYXN0VmFsdWUsIGlzSXRlbUVxdWFsVG9WYWx1ZSk7XG4gICAgICAgIG5leHRJbmRleCA9IGxhc3RJbmRleCA9PT0gLTEgPyBudWxsIDogbGFzdEluZGV4O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmRleCA9IGZpbmRJdGVtSW5kZXgocmVnaXN0cnksIHZhbHVlLCBpc0l0ZW1FcXVhbFRvVmFsdWUpO1xuICAgICAgbmV4dEluZGV4ID0gaW5kZXggPT09IC0xID8gbnVsbCA6IGluZGV4O1xuICAgIH1cbiAgICBpZiAobmV4dEluZGV4ID09PSBudWxsKSB7XG4gICAgICBzZWxlY3RlZEl0ZW1UZXh0UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAob3Blbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdG9yZS5zZXQoJ3NlbGVjdGVkSW5kZXgnLCBuZXh0SW5kZXgpO1xuICB9LCBbaGFzU2VsZWN0ZWRWYWx1ZSwgbXVsdGlwbGUsIG9wZW4sIHZhbHVlLCB2YWx1ZXNSZWYsIGlzSXRlbUVxdWFsVG9WYWx1ZSwgc3RvcmUsIHNlbGVjdGVkSXRlbVRleHRSZWZdKTtcbiAgdXNlVmFsdWVDaGFuZ2VkKHZhbHVlLCAoKSA9PiB7XG4gICAgY2xlYXJFcnJvcnMobmFtZSk7XG4gICAgc2V0RGlydHkodmFsdWUgIT09IHZhbGlkaXR5RGF0YS5pbml0aWFsVmFsdWUpO1xuICAgIGlmIChzaG91bGRWYWxpZGF0ZU9uQ2hhbmdlKCkpIHtcbiAgICAgIHZhbGlkYXRpb24uY29tbWl0KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsaWRhdGlvbi5jb21taXQodmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfSk7XG4gIGNvbnN0IHNldE9wZW4gPSB1c2VTdGFibGVDYWxsYmFjaygobmV4dE9wZW4sIGV2ZW50RGV0YWlscykgPT4ge1xuICAgIG9uT3BlbkNoYW5nZT8uKG5leHRPcGVuLCBldmVudERldGFpbHMpO1xuICAgIGlmIChldmVudERldGFpbHMuaXNDYW5jZWxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRPcGVuVW53cmFwcGVkKG5leHRPcGVuKTtcbiAgICBpZiAoIW5leHRPcGVuICYmIChldmVudERldGFpbHMucmVhc29uID09PSBSRUFTT05TLmZvY3VzT3V0IHx8IGV2ZW50RGV0YWlscy5yZWFzb24gPT09IFJFQVNPTlMub3V0c2lkZVByZXNzKSkge1xuICAgICAgc2V0VG91Y2hlZCh0cnVlKTtcbiAgICAgIHNldEZvY3VzZWQoZmFsc2UpO1xuICAgICAgaWYgKHZhbGlkYXRpb25Nb2RlID09PSAnb25CbHVyJykge1xuICAgICAgICB2YWxpZGF0aW9uLmNvbW1pdCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIGFjdGl2ZSBpbmRleCB3aWxsIHN5bmMgdG8gdGhlIGxhc3Qgc2VsZWN0ZWQgaW5kZXggb24gdGhlIG5leHQgb3Blbi5cbiAgICAvLyBXb3JrYXJvdW5kIGBlbmFibGVGb2N1c0luc2lkZWAgaW4gRmxvYXRpbmcgVUkgc2V0dGluZyBgdGFiaW5kZXg9MGAgb2YgYSBub24taGlnaGxpZ2h0ZWRcbiAgICAvLyBvcHRpb24gdXBvbiBjbG9zZSB3aGVuIHRhYmJpbmcgb3V0IGR1ZSB0byBga2VlcE1vdW50ZWQ9dHJ1ZWA6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL3B1bGwvMzAwNC9maWxlcyNkaWZmLTk2MmE3NDM5Y2RlYjA5ZWE5OGQ0YjYyMmE0NWQ1MTdiY2UwN2FkOGMzZjg2NmUwODliZGEwNWY0YjBiYmQ4NzVSMTk0LVIxOTlcbiAgICAvLyBUaGlzIG90aGVyd2lzZSBjYXVzZXMgb3B0aW9ucyB0byByZXRhaW4gYHRhYmluZGV4PTBgIGluY29ycmVjdGx5IHdoZW4gdGhlIHBvcHVwIGlzIGNsb3NlZFxuICAgIC8vIHdoZW4gdGFiYmluZyBvdXRzaWRlLlxuICAgIGlmICghbmV4dE9wZW4gJiYgc3RvcmUuc3RhdGUuYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZU9wdGlvbiA9IGxpc3RSZWYuY3VycmVudFtzdG9yZS5zdGF0ZS5hY3RpdmVJbmRleF07XG4gICAgICAvLyBXYWl0IGZvciBGbG9hdGluZyBVSSdzIGZvY3VzIGVmZmVjdCB0byBoYXZlIGZpcmVkXG4gICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgIGFjdGl2ZU9wdGlvbj8uc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgY29uc3QgaGFuZGxlVW5tb3VudCA9IHVzZVN0YWJsZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRNb3VudGVkKGZhbHNlKTtcbiAgICBzdG9yZS51cGRhdGUoe1xuICAgICAgYWN0aXZlSW5kZXg6IG51bGwsXG4gICAgICBvcGVuTWV0aG9kOiBudWxsXG4gICAgfSk7XG4gICAgb25PcGVuQ2hhbmdlQ29tcGxldGU/LihmYWxzZSk7XG4gIH0pO1xuICB1c2VPcGVuQ2hhbmdlQ29tcGxldGUoe1xuICAgIGVuYWJsZWQ6ICFhY3Rpb25zUmVmLFxuICAgIG9wZW4sXG4gICAgcmVmOiBwb3B1cFJlZixcbiAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgaWYgKCFvcGVuKSB7XG4gICAgICAgIGhhbmRsZVVubW91bnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBSZWFjdC51c2VJbXBlcmF0aXZlSGFuZGxlKGFjdGlvbnNSZWYsICgpID0+ICh7XG4gICAgdW5tb3VudDogaGFuZGxlVW5tb3VudFxuICB9KSwgW2hhbmRsZVVubW91bnRdKTtcbiAgY29uc3Qgc2V0VmFsdWUgPSB1c2VTdGFibGVDYWxsYmFjaygobmV4dFZhbHVlLCBldmVudERldGFpbHMpID0+IHtcbiAgICBvblZhbHVlQ2hhbmdlPy4obmV4dFZhbHVlLCBldmVudERldGFpbHMpO1xuICAgIGlmIChldmVudERldGFpbHMuaXNDYW5jZWxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRWYWx1ZVVud3JhcHBlZChuZXh0VmFsdWUpO1xuICB9KTtcbiAgY29uc3QgaGFuZGxlU2Nyb2xsQXJyb3dWaXNpYmlsaXR5ID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGNvbnN0IHNjcm9sbGVyID0gc3RvcmUuc3RhdGUubGlzdEVsZW1lbnQgfHwgcG9wdXBSZWYuY3VycmVudDtcbiAgICBpZiAoIXNjcm9sbGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1heFNjcm9sbFRvcCA9IGdldE1heFNjcm9sbE9mZnNldChzY3JvbGxlci5zY3JvbGxIZWlnaHQsIHNjcm9sbGVyLmNsaWVudEhlaWdodCk7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gbm9ybWFsaXplU2Nyb2xsT2Zmc2V0KHNjcm9sbGVyLnNjcm9sbFRvcCwgbWF4U2Nyb2xsVG9wKTtcbiAgICBjb25zdCBzaG91bGRTaG93VXAgPSBzY3JvbGxUb3AgPiAwO1xuICAgIGNvbnN0IHNob3VsZFNob3dEb3duID0gc2Nyb2xsVG9wIDwgbWF4U2Nyb2xsVG9wO1xuICAgIGlmIChzdG9yZS5zdGF0ZS5zY3JvbGxVcEFycm93VmlzaWJsZSAhPT0gc2hvdWxkU2hvd1VwKSB7XG4gICAgICBzdG9yZS5zZXQoJ3Njcm9sbFVwQXJyb3dWaXNpYmxlJywgc2hvdWxkU2hvd1VwKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnN0YXRlLnNjcm9sbERvd25BcnJvd1Zpc2libGUgIT09IHNob3VsZFNob3dEb3duKSB7XG4gICAgICBzdG9yZS5zZXQoJ3Njcm9sbERvd25BcnJvd1Zpc2libGUnLCBzaG91bGRTaG93RG93bik7XG4gICAgfVxuICB9KTtcbiAgY29uc3QgZmxvYXRpbmdDb250ZXh0ID0gdXNlRmxvYXRpbmdSb290Q29udGV4dCh7XG4gICAgb3BlbixcbiAgICBvbk9wZW5DaGFuZ2U6IHNldE9wZW4sXG4gICAgZWxlbWVudHM6IHtcbiAgICAgIHJlZmVyZW5jZTogdHJpZ2dlckVsZW1lbnQsXG4gICAgICBmbG9hdGluZzogcG9zaXRpb25lckVsZW1lbnRcbiAgICB9XG4gIH0pO1xuICBjb25zdCBjbGljayA9IHVzZUNsaWNrKGZsb2F0aW5nQ29udGV4dCwge1xuICAgIGVuYWJsZWQ6ICFyZWFkT25seSAmJiAhZGlzYWJsZWQsXG4gICAgZXZlbnQ6ICdtb3VzZWRvd24nXG4gIH0pO1xuICBjb25zdCBkaXNtaXNzID0gdXNlRGlzbWlzcyhmbG9hdGluZ0NvbnRleHQpO1xuICBjb25zdCBsaXN0TmF2aWdhdGlvbiA9IHVzZUxpc3ROYXZpZ2F0aW9uKGZsb2F0aW5nQ29udGV4dCwge1xuICAgIGVuYWJsZWQ6ICFyZWFkT25seSAmJiAhZGlzYWJsZWQsXG4gICAgbGlzdFJlZixcbiAgICBhY3RpdmVJbmRleCxcbiAgICBzZWxlY3RlZEluZGV4LFxuICAgIGRpc2FibGVkSW5kaWNlczogRU1QVFlfQVJSQVksXG4gICAgb25OYXZpZ2F0ZShuZXh0QWN0aXZlSW5kZXgpIHtcbiAgICAgIC8vIFJldGFpbiB0aGUgaGlnaGxpZ2h0IHdoaWxlIHRyYW5zaXRpb25pbmcgb3V0LlxuICAgICAgaWYgKG5leHRBY3RpdmVJbmRleCA9PT0gbnVsbCAmJiAhb3Blbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdG9yZS5zZXQoJ2FjdGl2ZUluZGV4JywgbmV4dEFjdGl2ZUluZGV4KTtcbiAgICB9LFxuICAgIGZvY3VzSXRlbU9uSG92ZXI6IGhpZ2hsaWdodEl0ZW1PbkhvdmVyXG4gIH0pO1xuICBjb25zdCB0eXBlYWhlYWQgPSB1c2VUeXBlYWhlYWQoZmxvYXRpbmdDb250ZXh0LCB7XG4gICAgZW5hYmxlZDogIXJlYWRPbmx5ICYmICFkaXNhYmxlZCAmJiAob3BlbiB8fCAhbXVsdGlwbGUpLFxuICAgIGxpc3RSZWY6IGxhYmVsc1JlZixcbiAgICBhY3RpdmVJbmRleCxcbiAgICBzZWxlY3RlZEluZGV4LFxuICAgIG9uTWF0Y2goaW5kZXgpIHtcbiAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgIHN0b3JlLnNldCgnYWN0aXZlSW5kZXgnLCBpbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWYWx1ZSh2YWx1ZXNSZWYuY3VycmVudFtpbmRleF0sIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscygnbm9uZScpKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9uVHlwaW5nKHR5cGluZykge1xuICAgICAgdHlwaW5nUmVmLmN1cnJlbnQgPSB0eXBpbmc7XG4gICAgfVxuICB9KTtcbiAgY29uc3QgbWVyZ2VkVHJpZ2dlclByb3BzID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgdHJpZ2dlckludGVyYWN0aW9uUHJvcHMgPSBtZXJnZVByb3BzKHR5cGVhaGVhZC5yZWZlcmVuY2UsIGxpc3ROYXZpZ2F0aW9uLnJlZmVyZW5jZSwgZGlzbWlzcy5yZWZlcmVuY2UsIGNsaWNrLnJlZmVyZW5jZSwgaW50ZXJhY3Rpb25UeXBlUHJvcHMpO1xuICAgIGlmIChnZW5lcmF0ZWRJZCkge1xuICAgICAgdHJpZ2dlckludGVyYWN0aW9uUHJvcHMuaWQgPSBnZW5lcmF0ZWRJZDtcbiAgICB9XG4gICAgcmV0dXJuIHRyaWdnZXJJbnRlcmFjdGlvblByb3BzO1xuICB9LCBbY2xpY2sucmVmZXJlbmNlLCB0eXBlYWhlYWQucmVmZXJlbmNlLCBsaXN0TmF2aWdhdGlvbi5yZWZlcmVuY2UsIGRpc21pc3MucmVmZXJlbmNlLCBpbnRlcmFjdGlvblR5cGVQcm9wcywgZ2VuZXJhdGVkSWRdKTtcbiAgY29uc3QgcG9wdXBQcm9wcyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gbWVyZ2VQcm9wcyhGT0NVU0FCTEVfUE9QVVBfUFJPUFMsIHR5cGVhaGVhZC5mbG9hdGluZywgbGlzdE5hdmlnYXRpb24uZmxvYXRpbmcsIGRpc21pc3MuZmxvYXRpbmcpLCBbdHlwZWFoZWFkLmZsb2F0aW5nLCBsaXN0TmF2aWdhdGlvbi5mbG9hdGluZywgZGlzbWlzcy5mbG9hdGluZ10pO1xuICBjb25zdCBpdGVtUHJvcHMgPSBsaXN0TmF2aWdhdGlvbi5pdGVtID8/IEVNUFRZX09CSkVDVDtcbiAgdXNlT25GaXJzdFJlbmRlcigoKSA9PiB7XG4gICAgc3RvcmUudXBkYXRlKHtcbiAgICAgIHBvcHVwUHJvcHMsXG4gICAgICB0cmlnZ2VyUHJvcHM6IG1lcmdlZFRyaWdnZXJQcm9wc1xuICAgIH0pO1xuICB9KTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzdG9yZS51cGRhdGUoe1xuICAgICAgaWQ6IGdlbmVyYXRlZElkLFxuICAgICAgbW9kYWwsXG4gICAgICBtdWx0aXBsZSxcbiAgICAgIHZhbHVlLFxuICAgICAgb3BlbixcbiAgICAgIG1vdW50ZWQsXG4gICAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgICAgcG9wdXBQcm9wcyxcbiAgICAgIHRyaWdnZXJQcm9wczogbWVyZ2VkVHJpZ2dlclByb3BzLFxuICAgICAgaXRlbXMsXG4gICAgICBpdGVtVG9TdHJpbmdMYWJlbCxcbiAgICAgIGl0ZW1Ub1N0cmluZ1ZhbHVlLFxuICAgICAgaXNJdGVtRXF1YWxUb1ZhbHVlLFxuICAgICAgb3Blbk1ldGhvZDogcmVuZGVyZWRPcGVuTWV0aG9kXG4gICAgfSk7XG4gIH0sIFtzdG9yZSwgZ2VuZXJhdGVkSWQsIG1vZGFsLCBtdWx0aXBsZSwgdmFsdWUsIG9wZW4sIG1vdW50ZWQsIHRyYW5zaXRpb25TdGF0dXMsIHBvcHVwUHJvcHMsIG1lcmdlZFRyaWdnZXJQcm9wcywgaXRlbXMsIGl0ZW1Ub1N0cmluZ0xhYmVsLCBpdGVtVG9TdHJpbmdWYWx1ZSwgaXNJdGVtRXF1YWxUb1ZhbHVlLCByZW5kZXJlZE9wZW5NZXRob2RdKTtcbiAgY29uc3QgY29udGV4dFZhbHVlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIHN0b3JlLFxuICAgIG5hbWUsXG4gICAgcmVxdWlyZWQsXG4gICAgZGlzYWJsZWQsXG4gICAgcmVhZE9ubHksXG4gICAgbXVsdGlwbGUsXG4gICAgaGlnaGxpZ2h0SXRlbU9uSG92ZXIsXG4gICAgc2V0VmFsdWUsXG4gICAgc2V0T3BlbixcbiAgICBsaXN0UmVmLFxuICAgIHBvcHVwUmVmLFxuICAgIHNjcm9sbEhhbmRsZXJSZWYsXG4gICAgaGFuZGxlU2Nyb2xsQXJyb3dWaXNpYmlsaXR5LFxuICAgIHNjcm9sbEFycm93c01vdW50ZWRDb3VudFJlZixcbiAgICBpdGVtUHJvcHMsXG4gICAgZXZlbnRzOiBmbG9hdGluZ0NvbnRleHQuY29udGV4dC5ldmVudHMsXG4gICAgdmFsdWVSZWYsXG4gICAgdmFsdWVzUmVmLFxuICAgIGxhYmVsc1JlZixcbiAgICB0eXBpbmdSZWYsXG4gICAgc2VsZWN0aW9uUmVmLFxuICAgIGZpcnN0SXRlbVRleHRSZWYsXG4gICAgc2VsZWN0ZWRJdGVtVGV4dFJlZixcbiAgICB2YWxpZGF0aW9uLFxuICAgIG9uT3BlbkNoYW5nZUNvbXBsZXRlLFxuICAgIGtleWJvYXJkQWN0aXZlUmVmLFxuICAgIGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlUmVmLFxuICAgIGluaXRpYWxWYWx1ZVJlZlxuICB9KSwgW3N0b3JlLCBuYW1lLCByZXF1aXJlZCwgZGlzYWJsZWQsIHJlYWRPbmx5LCBtdWx0aXBsZSwgaGlnaGxpZ2h0SXRlbU9uSG92ZXIsIHNldFZhbHVlLCBzZXRPcGVuLCBpdGVtUHJvcHMsIGZsb2F0aW5nQ29udGV4dC5jb250ZXh0LmV2ZW50cywgdmFsaWRhdGlvbiwgb25PcGVuQ2hhbmdlQ29tcGxldGUsIGhhbmRsZVNjcm9sbEFycm93VmlzaWJpbGl0eV0pO1xuICBjb25zdCByZWYgPSB1c2VNZXJnZWRSZWZzKGlucHV0UmVmLCB2YWxpZGF0aW9uLmlucHV0UmVmKTtcbiAgY29uc3QgaGFzTXVsdGlwbGVTZWxlY3Rpb24gPSBtdWx0aXBsZSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPiAwO1xuICBjb25zdCBoaWRkZW5JbnB1dE5hbWUgPSBtdWx0aXBsZSA/IHVuZGVmaW5lZCA6IG5hbWU7XG4gIGNvbnN0IGhpZGRlbklucHV0cyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghbXVsdGlwbGUgfHwgIUFycmF5LmlzQXJyYXkodmFsdWUpIHx8ICFuYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlLm1hcCh2ID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZXJpYWxpemVkVmFsdWUgPSBzdHJpbmdpZnlBc1ZhbHVlKHYsIGl0ZW1Ub1N0cmluZ1ZhbHVlKTtcbiAgICAgIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJoaWRkZW5cIixcbiAgICAgICAgZm9ybTogZm9ybSxcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgdmFsdWU6IGN1cnJlbnRTZXJpYWxpemVkVmFsdWVcbiAgICAgIH0sIGN1cnJlbnRTZXJpYWxpemVkVmFsdWUpO1xuICAgIH0pO1xuICB9LCBbbXVsdGlwbGUsIHZhbHVlLCBmb3JtLCBuYW1lLCBpdGVtVG9TdHJpbmdWYWx1ZV0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goU2VsZWN0Um9vdENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogY29udGV4dFZhbHVlLFxuICAgIGNoaWxkcmVuOiAvKiNfX1BVUkVfXyovX2pzeHMoU2VsZWN0RmxvYXRpbmdDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgICB2YWx1ZTogZmxvYXRpbmdDb250ZXh0LFxuICAgICAgY2hpbGRyZW46IFtjaGlsZHJlbiwgLyojX19QVVJFX18qL19qc3goXCJpbnB1dFwiLCB7XG4gICAgICAgIC4uLnZhbGlkYXRpb24uZ2V0SW5wdXRWYWxpZGF0aW9uUHJvcHMoe1xuICAgICAgICAgIG9uRm9jdXMoKSB7XG4gICAgICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSB0cmlnZ2VyIGVsZW1lbnQgd2hlbiB0aGUgaGlkZGVuIGlucHV0IGlzIGZvY3VzZWQuXG4gICAgICAgICAgICBzdG9yZS5zdGF0ZS50cmlnZ2VyRWxlbWVudD8uZm9jdXMoe1xuICAgICAgICAgICAgICAvLyBTdXBwb3J0ZWQgaW4gQ2hyb21lIGZyb20gMTQ0IChKYW51YXJ5IDIwMjYpXG4gICAgICAgICAgICAgIGZvY3VzVmlzaWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBIYW5kbGUgYnJvd3NlciBhdXRvZmlsbC5cbiAgICAgICAgICBvbkNoYW5nZShldmVudCkge1xuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy85MDIzXG4gICAgICAgICAgICBpZiAoZXZlbnQubmF0aXZlRXZlbnQuZGVmYXVsdFByZXZlbnRlZCB8fCBkaXNhYmxlZCB8fCByZWFkT25seSkge1xuICAgICAgICAgICAgICAvLyBPdXRzaWRlIEZpZWxkLlJvb3QsIHRoZSBldmVudCBpcyBub3Qgd3JhcHBlZCBieSBtZXJnZVByb3BzLlxuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50QmFzZVVJSGFuZGxlcj8uKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5leHRWYWx1ZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBkZXRhaWxzID0gY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMubm9uZSwgZXZlbnQubmF0aXZlRXZlbnQpO1xuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlQ2hhbmdlKCkge1xuICAgICAgICAgICAgICBpZiAobXVsdGlwbGUpIHtcbiAgICAgICAgICAgICAgICAvLyBCcm93c2VyIGF1dG9maWxsIG9ubHkgd3JpdGVzIGEgc2luZ2xlIHNjYWxhciB2YWx1ZS5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBIYW5kbGUgc2luZ2xlIHNlbGVjdGlvbjogbWF0Y2ggYWdhaW5zdCByZWdpc3RlcmVkIHZhbHVlcyB1c2luZyBzZXJpYWxpemF0aW9uXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nVmFsdWUgPSB2YWx1ZXNSZWYuY3VycmVudC5maW5kKHYgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRyeSBtYXRjaGluZyBieSB2YWx1ZSBmaXJzdCAoZS5nLiwgXCJVU1wiIGZvciBjb3VudHJ5IGNvZGUpXG4gICAgICAgICAgICAgICAgY29uc3QgY2FuZGlkYXRlVmFsdWUgPSBzdHJpbmdpZnlBc1ZhbHVlKHYsIGl0ZW1Ub1N0cmluZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FuZGlkYXRlVmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gbmV4dFZhbHVlLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBBbHNvIHRyeSBtYXRjaGluZyBieSBsYWJlbCBmb3IgYnJvd3NlciBhdXRvZmlsbCBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgLy8gKGJyb3dzZXJzIGF1dG9maWxsIHdpdGggZGlzcGxheWVkIHRleHQgbGlrZSBcIlVuaXRlZCBTdGF0ZXNcIiwgbm90IHRoZSB1bmRlcmx5aW5nIHZhbHVlKVxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZUxhYmVsID0gc3RyaW5naWZ5QXNMYWJlbCh2LCBpdGVtVG9TdHJpbmdMYWJlbCk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmRpZGF0ZUxhYmVsLnRvTG93ZXJDYXNlKCkgPT09IG5leHRWYWx1ZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nVmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNldERpcnR5KG1hdGNoaW5nVmFsdWUgIT09IHZhbGlkaXR5RGF0YS5pbml0aWFsVmFsdWUpO1xuICAgICAgICAgICAgICAgIHNldFZhbHVlKG1hdGNoaW5nVmFsdWUsIGRldGFpbHMpO1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRWYWxpZGF0ZU9uQ2hhbmdlKCkpIHtcbiAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb24uY29tbWl0KG1hdGNoaW5nVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmUuc2V0KCdmb3JjZU1vdW50JywgdHJ1ZSk7XG4gICAgICAgICAgICBxdWV1ZU1pY3JvdGFzayhoYW5kbGVDaGFuZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIGlkOiBnZW5lcmF0ZWRJZCAmJiBoaWRkZW5JbnB1dE5hbWUgPT0gbnVsbCA/IGAke2dlbmVyYXRlZElkfS1oaWRkZW4taW5wdXRgIDogdW5kZWZpbmVkLFxuICAgICAgICBmb3JtOiBmb3JtLFxuICAgICAgICBuYW1lOiBoaWRkZW5JbnB1dE5hbWUsXG4gICAgICAgIGF1dG9Db21wbGV0ZTogYXV0b0NvbXBsZXRlLFxuICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlLFxuICAgICAgICBkaXNhYmxlZDogZGlzYWJsZWQsXG4gICAgICAgIHJlcXVpcmVkOiByZXF1aXJlZCAmJiAhaGFzTXVsdGlwbGVTZWxlY3Rpb24sXG4gICAgICAgIHJlYWRPbmx5OiByZWFkT25seSxcbiAgICAgICAgcmVmOiByZWYsXG4gICAgICAgIHN0eWxlOiBuYW1lID8gdmlzdWFsbHlIaWRkZW5JbnB1dCA6IHZpc3VhbGx5SGlkZGVuLFxuICAgICAgICB0YWJJbmRleDogLTEsXG4gICAgICAgIFwiYXJpYS1oaWRkZW5cIjogdHJ1ZSxcbiAgICAgICAgc3VwcHJlc3NIeWRyYXRpb25XYXJuaW5nOiB0cnVlXG4gICAgICB9KSwgaGlkZGVuSW5wdXRzXVxuICAgIH0pXG4gIH0pO1xufSIsIid1c2UgY2xpZW50JztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRMYWJlbElkKGlkKSB7XG4gIHJldHVybiBpZCA9PSBudWxsID8gdW5kZWZpbmVkIDogYCR7aWR9LWxhYmVsYDtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQXJpYUxhYmVsbGVkQnkoZmllbGRMYWJlbElkLCBsb2NhbExhYmVsSWQpIHtcbiAgcmV0dXJuIGZpZWxkTGFiZWxJZCA/PyBsb2NhbExhYmVsSWQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTdG9yZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3N0b3JlJztcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZUZpZWxkUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2ZpZWxkLXJvb3QtY29udGV4dC9GaWVsZFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBmaWVsZFZhbGlkaXR5TWFwcGluZyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvZmllbGQtY29uc3RhbnRzL2NvbnN0YW50cy5qc1wiO1xuaW1wb3J0IHsgdXNlTGFiZWwgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2xhYmVsYWJsZS1wcm92aWRlci91c2VMYWJlbC5qc1wiO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdExhYmVsSWQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcmVzb2x2ZUFyaWFMYWJlbGxlZEJ5LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcblxuLyoqXG4gKiBBbiBhY2Nlc3NpYmxlIGxhYmVsIHRoYXQgaXMgYXV0b21hdGljYWxseSBhc3NvY2lhdGVkIHdpdGggdGhlIHNlbGVjdCB0cmlnZ2VyLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RMYWJlbCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdExhYmVsKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgLy8gS2VlcCBsYWJlbCBpZCBkZXJpdmVkIGZyb20gdGhlIHJvb3QgYW5kIGlnbm9yZSBydW50aW1lIGBpZGAgb3ZlcnJpZGVzIGZyb20gdW50eXBlZCBjb25zdW1lcnMuXG4gIGNvbnN0IGVsZW1lbnRQcm9wc1dpdGhvdXRJZCA9IGVsZW1lbnRQcm9wcztcbiAgZGVsZXRlIGVsZW1lbnRQcm9wc1dpdGhvdXRJZC5pZDtcbiAgY29uc3QgZmllbGRSb290Q29udGV4dCA9IHVzZUZpZWxkUm9vdENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCB0cmlnZ2VyRWxlbWVudCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMudHJpZ2dlckVsZW1lbnQpO1xuICBjb25zdCByb290SWQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmlkKTtcbiAgY29uc3QgZGVmYXVsdExhYmVsSWQgPSBnZXREZWZhdWx0TGFiZWxJZChyb290SWQpO1xuICBjb25zdCBsYWJlbFByb3BzID0gdXNlTGFiZWwoe1xuICAgIGlkOiBkZWZhdWx0TGFiZWxJZCxcbiAgICBmYWxsYmFja0NvbnRyb2xJZDogdHJpZ2dlckVsZW1lbnQ/LmlkID8/IHJvb3RJZCxcbiAgICBzZXRMYWJlbElkKG5leHRMYWJlbElkKSB7XG4gICAgICBzdG9yZS5zZXQoJ2xhYmVsSWQnLCBuZXh0TGFiZWxJZCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgc3RhdGU6IGZpZWxkUm9vdENvbnRleHQuc3RhdGUsXG4gICAgcHJvcHM6IFtsYWJlbFByb3BzLCBlbGVtZW50UHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IGZpZWxkVmFsaWRpdHlNYXBwaW5nXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RMYWJlbC5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0TGFiZWxcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG93bmVyRG9jdW1lbnQgfSBmcm9tICdAYmFzZS11aS91dGlscy9vd25lcic7XG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IHVzZU1lcmdlZFJlZnMgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VNZXJnZWRSZWZzJztcbmltcG9ydCB7IHVzZVZhbHVlQXNSZWYgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VWYWx1ZUFzUmVmJztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgdXNlU2VsZWN0Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9TZWxlY3RSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlRmllbGRSb290Q29udGV4dCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvZmllbGQtcm9vdC1jb250ZXh0L0ZpZWxkUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZUxhYmVsYWJsZUNvbnRleHQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2xhYmVsYWJsZS1wcm92aWRlci9MYWJlbGFibGVDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBwcmVzc2FibGVUcmlnZ2VyT3BlblN0YXRlTWFwcGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgZmllbGRWYWxpZGl0eU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2ZpZWxkLWNvbnN0YW50cy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHNlbGVjdG9ycyB9IGZyb20gXCIuLi9zdG9yZS5qc1wiO1xuaW1wb3J0IHsgZ2V0UHNldWRvRWxlbWVudEJvdW5kcyB9IGZyb20gXCIuLi8uLi91dGlscy9nZXRQc2V1ZG9FbGVtZW50Qm91bmRzLmpzXCI7XG5pbXBvcnQgeyBjb250YWlucywgZ2V0RmxvYXRpbmdGb2N1c0VsZW1lbnQgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMuanNcIjtcbmltcG9ydCB7IG1lcmdlUHJvcHMgfSBmcm9tIFwiLi4vLi4vbWVyZ2UtcHJvcHMvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IHVzZUxhYmVsYWJsZUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9sYWJlbGFibGUtcHJvdmlkZXIvdXNlTGFiZWxhYmxlSWQuanNcIjtcbmltcG9ydCB7IHJlc29sdmVBcmlhTGFiZWxsZWRCeSB9IGZyb20gXCIuLi8uLi91dGlscy9yZXNvbHZlQXJpYUxhYmVsbGVkQnkuanNcIjtcbmNvbnN0IEJPVU5EQVJZX09GRlNFVCA9IDI7XG5jb25zdCBTRUxFQ1RFRF9ERUxBWSA9IDQwMDtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIC4uLnByZXNzYWJsZVRyaWdnZXJPcGVuU3RhdGVNYXBwaW5nLFxuICAuLi5maWVsZFZhbGlkaXR5TWFwcGluZyxcbiAgcG9wdXBTaWRlOiBzaWRlID0+IHNpZGUgPyB7XG4gICAgJ2RhdGEtcG9wdXAtc2lkZSc6IHNpZGVcbiAgfSA6IG51bGwsXG4gIHZhbHVlOiAoKSA9PiBudWxsXG59O1xuXG4vKipcbiAqIEEgYnV0dG9uIHRoYXQgb3BlbnMgdGhlIHNlbGVjdCBwb3B1cC5cbiAqIFJlbmRlcnMgYSBgPGJ1dHRvbj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0VHJpZ2dlciA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdFRyaWdnZXIoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBpZDogaWRQcm9wLFxuICAgIGRpc2FibGVkOiBkaXNhYmxlZFByb3AgPSBmYWxzZSxcbiAgICBuYXRpdmVCdXR0b24gPSB0cnVlLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzZXRUb3VjaGVkLFxuICAgIHNldEZvY3VzZWQsXG4gICAgdmFsaWRhdGlvbk1vZGUsXG4gICAgc3RhdGU6IGZpZWxkU3RhdGUsXG4gICAgZGlzYWJsZWQ6IGZpZWxkRGlzYWJsZWRcbiAgfSA9IHVzZUZpZWxkUm9vdENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIGxhYmVsSWQ6IGZpZWxkTGFiZWxJZFxuICB9ID0gdXNlTGFiZWxhYmxlQ29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgc3RvcmUsXG4gICAgc2V0T3BlbixcbiAgICBzZWxlY3Rpb25SZWYsXG4gICAgdmFsaWRhdGlvbixcbiAgICByZWFkT25seSxcbiAgICByZXF1aXJlZCxcbiAgICBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZVJlZixcbiAgICBkaXNhYmxlZDogc2VsZWN0RGlzYWJsZWQsXG4gICAga2V5Ym9hcmRBY3RpdmVSZWZcbiAgfSA9IHVzZVNlbGVjdFJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IGRpc2FibGVkID0gZmllbGREaXNhYmxlZCB8fCBzZWxlY3REaXNhYmxlZCB8fCBkaXNhYmxlZFByb3A7XG4gIGNvbnN0IG9wZW4gPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLm9wZW4pO1xuICBjb25zdCBtb3VudGVkID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5tb3VudGVkKTtcbiAgY29uc3QgdmFsdWUgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnZhbHVlKTtcbiAgY29uc3QgdHJpZ2dlclByb3BzID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy50cmlnZ2VyUHJvcHMpO1xuICBjb25zdCBwb3NpdGlvbmVyRWxlbWVudCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMucG9zaXRpb25lckVsZW1lbnQpO1xuICBjb25zdCBsaXN0RWxlbWVudCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubGlzdEVsZW1lbnQpO1xuICBjb25zdCBwb3B1cFNpZGVWYWx1ZSA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMucG9wdXBTaWRlKTtcbiAgY29uc3Qgcm9vdElkID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5pZCk7XG4gIGNvbnN0IHNlbGVjdExhYmVsSWQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmxhYmVsSWQpO1xuICBjb25zdCBoYXNTZWxlY3RlZFZhbHVlID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5oYXNTZWxlY3RlZFZhbHVlKTtcbiAgY29uc3QgcG9wdXBTaWRlID0gbW91bnRlZCAmJiBwb3NpdGlvbmVyRWxlbWVudCA/IHBvcHVwU2lkZVZhbHVlIDogbnVsbDtcbiAgY29uc3QgaWQgPSBpZFByb3AgPz8gcm9vdElkO1xuICBjb25zdCBhcmlhTGFiZWxsZWRCeSA9IHJlc29sdmVBcmlhTGFiZWxsZWRCeShmaWVsZExhYmVsSWQsIHNlbGVjdExhYmVsSWQpO1xuICB1c2VMYWJlbGFibGVJZCh7XG4gICAgaWRcbiAgfSk7XG4gIGNvbnN0IHBvc2l0aW9uZXJSZWYgPSB1c2VWYWx1ZUFzUmVmKHBvc2l0aW9uZXJFbGVtZW50KTtcbiAgY29uc3QgdHJpZ2dlclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qge1xuICAgIGdldEJ1dHRvblByb3BzLFxuICAgIGJ1dHRvblJlZlxuICB9ID0gdXNlQnV0dG9uKHtcbiAgICBkaXNhYmxlZCxcbiAgICBuYXRpdmU6IG5hdGl2ZUJ1dHRvblxuICB9KTtcbiAgY29uc3Qgc2V0VHJpZ2dlckVsZW1lbnQgPSB1c2VTdGFibGVDYWxsYmFjayhlbGVtZW50ID0+IHtcbiAgICBzdG9yZS5zZXQoJ3RyaWdnZXJFbGVtZW50JywgZWxlbWVudCk7XG4gIH0pO1xuICBjb25zdCBtZXJnZWRSZWYgPSB1c2VNZXJnZWRSZWZzKGZvcndhcmRlZFJlZiwgdHJpZ2dlclJlZiwgYnV0dG9uUmVmLCBzZXRUcmlnZ2VyRWxlbWVudCk7XG4gIGNvbnN0IHRpbWVvdXRGb2N1cyA9IHVzZVRpbWVvdXQoKTtcbiAgY29uc3QgdGltZW91dE1vdXNlRG93biA9IHVzZVRpbWVvdXQoKTtcbiAgY29uc3Qgc2VsZWN0ZWREZWxheVRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIC8vIEEgbW91c2Vkb3duIG9uIHRoZSB0cmlnZ2VyIGNhbiBvcGVuIHRoZSBwb3B1cCB1bmRlciB0aGUgY3Vyc29yLiBLZWVwIG1vdXNldXAgc2VsZWN0aW9uXG4gICAgICAvLyBkaXNhYmxlZCBicmllZmx5IHNvIHJlbGVhc2luZyBvdmVyIGVpdGhlciB0aGUgc2VsZWN0ZWQgaXRlbSBvciBhIG5laWdoYm9yaW5nIGl0ZW0gZG9lc24ndFxuICAgICAgLy8gY29tbWl0IGFuIGFjY2lkZW50YWwgc2VsZWN0aW9uLiBTZWxlY3RJdGVtIGNhbiBzdGlsbCBvcHQgaW50byB1bnNlbGVjdGVkIG1vdXNldXAgc29vbmVyXG4gICAgICAvLyBhZnRlciBhIHJlYWwgZHJhZyBvdmVyIHRoZSBpdGVtLlxuICAgICAgc2VsZWN0ZWREZWxheVRpbWVvdXQuc3RhcnQoU0VMRUNURURfREVMQVksICgpID0+IHtcbiAgICAgICAgc2VsZWN0aW9uUmVmLmN1cnJlbnQuYWxsb3dVbnNlbGVjdGVkTW91c2VVcCA9IHRydWU7XG4gICAgICAgIHNlbGVjdGlvblJlZi5jdXJyZW50LmFsbG93U2VsZWN0ZWRNb3VzZVVwID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc2VsZWN0ZWREZWxheVRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHNlbGVjdGlvblJlZi5jdXJyZW50ID0ge1xuICAgICAgYWxsb3dTZWxlY3RlZE1vdXNlVXA6IGZhbHNlLFxuICAgICAgYWxsb3dVbnNlbGVjdGVkTW91c2VVcDogZmFsc2UsXG4gICAgICBkcmFnWTogMFxuICAgIH07XG4gICAgdGltZW91dE1vdXNlRG93bi5jbGVhcigpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0sIFtvcGVuLCBzZWxlY3Rpb25SZWYsIHRpbWVvdXRNb3VzZURvd24sIHNlbGVjdGVkRGVsYXlUaW1lb3V0XSk7XG4gIGNvbnN0IHByb3BzID0gbWVyZ2VQcm9wcyh0cmlnZ2VyUHJvcHMsIHtcbiAgICBpZCxcbiAgICByb2xlOiAnY29tYm9ib3gnLFxuICAgICdhcmlhLWV4cGFuZGVkJzogb3BlbiA/ICd0cnVlJyA6ICdmYWxzZScsXG4gICAgJ2FyaWEtaGFzcG9wdXAnOiAnbGlzdGJveCcsXG4gICAgJ2FyaWEtY29udHJvbHMnOiBvcGVuID8gbGlzdEVsZW1lbnQ/LmlkID8/IGdldEZsb2F0aW5nRm9jdXNFbGVtZW50KHBvc2l0aW9uZXJFbGVtZW50KT8uaWQgOiB1bmRlZmluZWQsXG4gICAgJ2FyaWEtbGFiZWxsZWRieSc6IGFyaWFMYWJlbGxlZEJ5LFxuICAgICdhcmlhLXJlYWRvbmx5JzogcmVhZE9ubHkgfHwgdW5kZWZpbmVkLFxuICAgICdhcmlhLXJlcXVpcmVkJzogcmVxdWlyZWQgfHwgdW5kZWZpbmVkLFxuICAgIHRhYkluZGV4OiBkaXNhYmxlZCA/IC0xIDogMCxcbiAgICByZWY6IG1lcmdlZFJlZixcbiAgICBvbkZvY3VzKGV2ZW50KSB7XG4gICAgICBzZXRGb2N1c2VkKHRydWUpO1xuXG4gICAgICAvLyBUaGUgcG9wdXAgZWxlbWVudCBzaG91bGRuJ3Qgb2JzY3VyZSB0aGUgZm9jdXNlZCB0cmlnZ2VyLlxuICAgICAgaWYgKG9wZW4gJiYgYWxpZ25JdGVtV2l0aFRyaWdnZXJBY3RpdmVSZWYuY3VycmVudCkge1xuICAgICAgICBzZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5ub25lLCBldmVudC5uYXRpdmVFdmVudCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBTYXZlcyBhIHJlLXJlbmRlciBvbiBpbml0aWFsIGNsaWNrOiBgZm9yY2VNb3VudCA9PT0gdHJ1ZWAgbW91bnRzXG4gICAgICAvLyB0aGUgaXRlbXMgYmVmb3JlIGBvcGVuID09PSB0cnVlYC4gV2UgY291bGQgc3luYyB0aG9zZSBjeWNsZXMgYmV0dGVyXG4gICAgICAvLyB3aXRob3V0IGEgdGltZW91dCwgYnV0IHRoaXMgaXMgZW5vdWdoIGZvciBub3cuXG4gICAgICAvL1xuICAgICAgLy8gWFhYOiBtaWdodCBiZSBjYXVzaW5nIGBhY3QoKWAgd2FybmluZ3MuXG4gICAgICB0aW1lb3V0Rm9jdXMuc3RhcnQoMCwgKCkgPT4ge1xuICAgICAgICBzdG9yZS5zZXQoJ2ZvcmNlTW91bnQnLCB0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb25CbHVyKGV2ZW50KSB7XG4gICAgICAvLyBJZiBmb2N1cyBpcyBtb3ZpbmcgaW50byB0aGUgcG9wdXAsIGRvbid0IGNvdW50IGl0IGFzIGEgYmx1ci5cbiAgICAgIGlmIChjb250YWlucyhwb3NpdGlvbmVyRWxlbWVudCwgZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2V0VG91Y2hlZCh0cnVlKTtcbiAgICAgIHNldEZvY3VzZWQoZmFsc2UpO1xuICAgICAgaWYgKHZhbGlkYXRpb25Nb2RlID09PSAnb25CbHVyJykge1xuICAgICAgICB2YWxpZGF0aW9uLmNvbW1pdCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBvblBvaW50ZXJNb3ZlKCkge1xuICAgICAga2V5Ym9hcmRBY3RpdmVSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH0sXG4gICAgb25LZXlEb3duKCkge1xuICAgICAga2V5Ym9hcmRBY3RpdmVSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfSxcbiAgICBvbk1vdXNlRG93bihldmVudCkge1xuICAgICAgaWYgKG9wZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZU1vdXNlVXAobW91c2VFdmVudCkge1xuICAgICAgICBpZiAoIXRyaWdnZXJSZWYuY3VycmVudCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb3VzZVVwVGFyZ2V0ID0gbW91c2VFdmVudC50YXJnZXQ7XG5cbiAgICAgICAgLy8gRWFybHkgcmV0dXJuIGlmIGNsaWNrZWQgb24gdHJpZ2dlciBlbGVtZW50IG9yIGl0cyBjaGlsZHJlblxuICAgICAgICBpZiAoY29udGFpbnModHJpZ2dlclJlZi5jdXJyZW50LCBtb3VzZVVwVGFyZ2V0KSB8fCBjb250YWlucyhwb3NpdGlvbmVyUmVmLmN1cnJlbnQsIG1vdXNlVXBUYXJnZXQpIHx8IG1vdXNlVXBUYXJnZXQgPT09IHRyaWdnZXJSZWYuY3VycmVudCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBib3VuZHMgPSBnZXRQc2V1ZG9FbGVtZW50Qm91bmRzKHRyaWdnZXJSZWYuY3VycmVudCk7XG4gICAgICAgIGlmIChtb3VzZUV2ZW50LmNsaWVudFggPj0gYm91bmRzLmxlZnQgLSBCT1VOREFSWV9PRkZTRVQgJiYgbW91c2VFdmVudC5jbGllbnRYIDw9IGJvdW5kcy5yaWdodCArIEJPVU5EQVJZX09GRlNFVCAmJiBtb3VzZUV2ZW50LmNsaWVudFkgPj0gYm91bmRzLnRvcCAtIEJPVU5EQVJZX09GRlNFVCAmJiBtb3VzZUV2ZW50LmNsaWVudFkgPD0gYm91bmRzLmJvdHRvbSArIEJPVU5EQVJZX09GRlNFVCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5jYW5jZWxPcGVuLCBtb3VzZUV2ZW50KSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZpcmVmb3ggY2FuIGZpcmUgdGhpcyB1cG9uIG1vdXNlZG93blxuICAgICAgdGltZW91dE1vdXNlRG93bi5zdGFydCgwLCAoKSA9PiB7XG4gICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCwge1xuICAgICAgICAgIG9uY2U6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvblByb3BzLCBlbGVtZW50UHJvcHMsIGdldEJ1dHRvblByb3BzKTtcblxuICAvLyBlbnN1cmUgbmVzdGVkIHVzZUJ1dHRvbiBkb2VzIG5vdCBvdmVyd3JpdGUgdGhlIGNvbWJvYm94IHJvbGU6XG4gIC8vIDxUb29sYmFyLkJ1dHRvbiByZW5kZXI9ezxTZWxlY3QuVHJpZ2dlciAvPn0gLz5cbiAgcHJvcHMucm9sZSA9ICdjb21ib2JveCc7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIC4uLmZpZWxkU3RhdGUsXG4gICAgb3BlbixcbiAgICBkaXNhYmxlZCxcbiAgICB2YWx1ZSxcbiAgICByZWFkT25seSxcbiAgICBwb3B1cFNpZGUsXG4gICAgcGxhY2Vob2xkZXI6ICFoYXNTZWxlY3RlZFZhbHVlXG4gIH07XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdidXR0b24nLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgdHJpZ2dlclJlZl0sXG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyxcbiAgICBwcm9wc1xuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0VHJpZ2dlci5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0VHJpZ2dlclwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlU3RvcmUgfSBmcm9tICdAYmFzZS11aS91dGlscy9zdG9yZSc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyByZXNvbHZlTXVsdGlwbGVMYWJlbHMsIHJlc29sdmVTZWxlY3RlZExhYmVsIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZXNvbHZlVmFsdWVMYWJlbC5qc1wiO1xuaW1wb3J0IHsgc2VsZWN0b3JzIH0gZnJvbSBcIi4uL3N0b3JlLmpzXCI7XG5jb25zdCBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nID0ge1xuICB2YWx1ZTogKCkgPT4gbnVsbFxufTtcblxuLyoqXG4gKiBBIHRleHQgbGFiZWwgb2YgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtLlxuICogUmVuZGVycyBhIGA8c3Bhbj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0VmFsdWUgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RWYWx1ZShjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICBjbGFzc05hbWUsXG4gICAgcmVuZGVyLFxuICAgIGNoaWxkcmVuOiBjaGlsZHJlblByb3AsXG4gICAgcGxhY2Vob2xkZXIsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlLFxuICAgIHZhbHVlUmVmXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCB2YWx1ZSA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMudmFsdWUpO1xuICBjb25zdCBpdGVtcyA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaXRlbXMpO1xuICBjb25zdCBpdGVtVG9TdHJpbmdMYWJlbCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaXRlbVRvU3RyaW5nTGFiZWwpO1xuICBjb25zdCBoYXNTZWxlY3RlZFZhbHVlID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5oYXNTZWxlY3RlZFZhbHVlKTtcbiAgY29uc3Qgc2hvdWxkQ2hlY2tOdWxsSXRlbUxhYmVsID0gIWhhc1NlbGVjdGVkVmFsdWUgJiYgcGxhY2Vob2xkZXIgIT0gbnVsbCAmJiBjaGlsZHJlblByb3AgPT0gbnVsbDtcbiAgY29uc3QgaGFzTnVsbExhYmVsID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5oYXNOdWxsSXRlbUxhYmVsLCBzaG91bGRDaGVja051bGxJdGVtTGFiZWwpO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICB2YWx1ZSxcbiAgICBwbGFjZWhvbGRlcjogIWhhc1NlbGVjdGVkVmFsdWVcbiAgfTtcbiAgbGV0IGNoaWxkcmVuID0gbnVsbDtcbiAgaWYgKHR5cGVvZiBjaGlsZHJlblByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjaGlsZHJlbiA9IGNoaWxkcmVuUHJvcCh2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoY2hpbGRyZW5Qcm9wICE9IG51bGwpIHtcbiAgICBjaGlsZHJlbiA9IGNoaWxkcmVuUHJvcDtcbiAgfSBlbHNlIGlmICghaGFzU2VsZWN0ZWRWYWx1ZSAmJiBwbGFjZWhvbGRlciAhPSBudWxsICYmICFoYXNOdWxsTGFiZWwpIHtcbiAgICBjaGlsZHJlbiA9IHBsYWNlaG9sZGVyO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgY2hpbGRyZW4gPSByZXNvbHZlTXVsdGlwbGVMYWJlbHModmFsdWUsIGl0ZW1zLCBpdGVtVG9TdHJpbmdMYWJlbCk7XG4gIH0gZWxzZSB7XG4gICAgY2hpbGRyZW4gPSByZXNvbHZlU2VsZWN0ZWRMYWJlbCh2YWx1ZSwgaXRlbXMsIGl0ZW1Ub1N0cmluZ0xhYmVsKTtcbiAgfVxuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnc3BhbicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCB2YWx1ZVJlZl0sXG4gICAgcHJvcHM6IFt7XG4gICAgICBjaGlsZHJlblxuICAgIH0sIGVsZW1lbnRQcm9wc10sXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZ1xuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdFZhbHVlLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RWYWx1ZVwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlU3RvcmUgfSBmcm9tICdAYmFzZS11aS91dGlscy9zdG9yZSc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB0cmlnZ2VyT3BlblN0YXRlTWFwcGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgc2VsZWN0b3JzIH0gZnJvbSBcIi4uL3N0b3JlLmpzXCI7XG5cbi8qKlxuICogQW4gaWNvbiB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSB0cmlnZ2VyIGJ1dHRvbiBvcGVucyBhIHNlbGVjdCBwb3B1cC5cbiAqIFJlbmRlcnMgYSBgPHNwYW4+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIFNlbGVjdF0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3NlbGVjdClcbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdEljb24gPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RJY29uKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCBvcGVuID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5vcGVuKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlblxuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnc3BhbicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IFt7XG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgY2hpbGRyZW46ICfilrwnXG4gICAgfSwgZWxlbWVudFByb3BzXSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nOiB0cmlnZ2VyT3BlblN0YXRlTWFwcGluZ1xuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdEljb24uZGlzcGxheU5hbWUgPSBcIlNlbGVjdEljb25cIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBTZWxlY3RQb3J0YWxDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdFBvcnRhbENvbnRleHQuZGlzcGxheU5hbWUgPSBcIlNlbGVjdFBvcnRhbENvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VTZWxlY3RQb3J0YWxDb250ZXh0KCkge1xuICBjb25zdCB2YWx1ZSA9IFJlYWN0LnVzZUNvbnRleHQoU2VsZWN0UG9ydGFsQ29udGV4dCk7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiA8U2VsZWN0LlBvcnRhbD4gaXMgbWlzc2luZy4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSg1OCkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgRmxvYXRpbmdQb3J0YWwgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvaW5kZXguanNcIjtcbmltcG9ydCB7IFNlbGVjdFBvcnRhbENvbnRleHQgfSBmcm9tIFwiLi9TZWxlY3RQb3J0YWxDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcblxuLyoqXG4gKiBBIHBvcnRhbCBlbGVtZW50IHRoYXQgbW92ZXMgdGhlIHBvcHVwIHRvIGEgZGlmZmVyZW50IHBhcnQgb2YgdGhlIERPTS5cbiAqIEJ5IGRlZmF1bHQsIHRoZSBwb3J0YWwgZWxlbWVudCBpcyBhcHBlbmRlZCB0byBgPGJvZHk+YC5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZXhwb3J0IGNvbnN0IFNlbGVjdFBvcnRhbCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdFBvcnRhbChwb3J0YWxQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlU2VsZWN0Um9vdENvbnRleHQoKTtcbiAgY29uc3QgbW91bnRlZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubW91bnRlZCk7XG4gIGNvbnN0IGZvcmNlTW91bnQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmZvcmNlTW91bnQpO1xuICBjb25zdCBzaG91bGRSZW5kZXIgPSBtb3VudGVkIHx8IGZvcmNlTW91bnQ7XG4gIGlmICghc2hvdWxkUmVuZGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KFNlbGVjdFBvcnRhbENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogdHJ1ZSxcbiAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3goRmxvYXRpbmdQb3J0YWwsIHtcbiAgICAgIHJlZjogZm9yd2FyZGVkUmVmLFxuICAgICAgLi4ucG9ydGFsUHJvcHNcbiAgICB9KVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0UG9ydGFsLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RQb3J0YWxcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgdXNlU2VsZWN0Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9TZWxlY3RSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIC4uLnBvcHVwU3RhdGVNYXBwaW5nLFxuICAuLi50cmFuc2l0aW9uU3RhdHVzTWFwcGluZ1xufTtcblxuLyoqXG4gKiBBbiBvdmVybGF5IGRpc3BsYXllZCBiZW5lYXRoIHRoZSBtZW51IHBvcHVwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RCYWNrZHJvcCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdEJhY2tkcm9wKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCBvcGVuID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5vcGVuKTtcbiAgY29uc3QgbW91bnRlZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubW91bnRlZCk7XG4gIGNvbnN0IHRyYW5zaXRpb25TdGF0dXMgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnRyYW5zaXRpb25TdGF0dXMpO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBvcGVuLFxuICAgIHRyYW5zaXRpb25TdGF0dXNcbiAgfTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IFt7XG4gICAgICByb2xlOiAncHJlc2VudGF0aW9uJyxcbiAgICAgIGhpZGRlbjogIW1vdW50ZWQsXG4gICAgICBzdHlsZToge1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJ1xuICAgICAgfVxuICAgIH0sIGVsZW1lbnRQcm9wc10sXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZ1xuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdEJhY2tkcm9wLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RCYWNrZHJvcFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuZXhwb3J0IGNvbnN0IFNlbGVjdFBvc2l0aW9uZXJDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdFBvc2l0aW9uZXJDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJTZWxlY3RQb3NpdGlvbmVyQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVNlbGVjdFBvc2l0aW9uZXJDb250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChTZWxlY3RQb3NpdGlvbmVyQ29udGV4dCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogU2VsZWN0UG9zaXRpb25lckNvbnRleHQgaXMgbWlzc2luZy4gU2VsZWN0UG9zaXRpb25lciBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPFNlbGVjdC5Qb3NpdGlvbmVyPi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSg1OSkpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufSIsImV4cG9ydCBmdW5jdGlvbiBjbGVhclN0eWxlcyhlbGVtZW50LCBvcmlnaW5hbFN0eWxlcykge1xuICBpZiAoZWxlbWVudCkge1xuICAgIE9iamVjdC5hc3NpZ24oZWxlbWVudC5zdHlsZSwgb3JpZ2luYWxTdHlsZXMpO1xuICB9XG59XG5leHBvcnQgY29uc3QgTElTVF9GVU5DVElPTkFMX1NUWUxFUyA9IHtcbiAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gIG1heEhlaWdodDogJzEwMCUnLFxuICBvdmVyZmxvd1g6ICdoaWRkZW4nLFxuICBvdmVyZmxvd1k6ICdhdXRvJ1xufTsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGluZXJ0VmFsdWUgfSBmcm9tICdAYmFzZS11aS91dGlscy9pbmVydFZhbHVlJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgdXNlU2VsZWN0Um9vdENvbnRleHQsIHVzZVNlbGVjdEZsb2F0aW5nQ29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVMaXN0IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb21wb3NpdGUvbGlzdC9Db21wb3NpdGVMaXN0LmpzXCI7XG5pbXBvcnQgeyB1c2VBbmNob3JQb3NpdGlvbmluZyB9IGZyb20gXCIuLi8uLi91dGlscy91c2VBbmNob3JQb3NpdGlvbmluZy5qc1wiO1xuaW1wb3J0IHsgU2VsZWN0UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi9TZWxlY3RQb3NpdGlvbmVyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgSW50ZXJuYWxCYWNrZHJvcCB9IGZyb20gXCIuLi8uLi91dGlscy9JbnRlcm5hbEJhY2tkcm9wLmpzXCI7XG5pbXBvcnQgeyBEUk9QRE9XTl9DT0xMSVNJT05fQVZPSURBTkNFIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IGNsZWFyU3R5bGVzIH0gZnJvbSBcIi4uL3BvcHVwL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyBmaW5kSXRlbUluZGV4LCBzZWxlY3RlZFZhbHVlSW5jbHVkZXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2l0ZW1FcXVhbGl0eS5qc1wiO1xuaW1wb3J0IHsgdXNlUG9zaXRpb25lciB9IGZyb20gXCIuLi8uLi91dGlscy91c2VQb3NpdGlvbmVyLmpzXCI7XG5pbXBvcnQgeyB1c2VBbmNob3JlZFBvcHVwU2Nyb2xsTG9jayB9IGZyb20gXCIuLi8uLi91dGlscy91c2VBbmNob3JlZFBvcHVwU2Nyb2xsTG9jay5qc1wiO1xuaW1wb3J0IHsganN4IGFzIF9qc3gsIGpzeHMgYXMgX2pzeHMgfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmNvbnN0IEZJWEVEID0ge1xuICBwb3NpdGlvbjogJ2ZpeGVkJ1xufTtcblxuLyoqXG4gKiBQb3NpdGlvbnMgdGhlIHNlbGVjdCBwb3B1cC5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0UG9zaXRpb25lciA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdFBvc2l0aW9uZXIoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgYW5jaG9yLFxuICAgIHBvc2l0aW9uTWV0aG9kID0gJ2Fic29sdXRlJyxcbiAgICBjbGFzc05hbWUsXG4gICAgcmVuZGVyLFxuICAgIHNpZGUgPSAnYm90dG9tJyxcbiAgICBhbGlnbiA9ICdjZW50ZXInLFxuICAgIHNpZGVPZmZzZXQgPSAwLFxuICAgIGFsaWduT2Zmc2V0ID0gMCxcbiAgICBjb2xsaXNpb25Cb3VuZGFyeSA9ICdjbGlwcGluZy1hbmNlc3RvcnMnLFxuICAgIGNvbGxpc2lvblBhZGRpbmcsXG4gICAgYXJyb3dQYWRkaW5nID0gNSxcbiAgICBzdGlja3kgPSBmYWxzZSxcbiAgICBkaXNhYmxlQW5jaG9yVHJhY2tpbmcsXG4gICAgYWxpZ25JdGVtV2l0aFRyaWdnZXIgPSB0cnVlLFxuICAgIGNvbGxpc2lvbkF2b2lkYW5jZSA9IERST1BET1dOX0NPTExJU0lPTl9BVk9JREFOQ0UsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlLFxuICAgIGxpc3RSZWYsXG4gICAgbGFiZWxzUmVmLFxuICAgIGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlUmVmLFxuICAgIHNlbGVjdGVkSXRlbVRleHRSZWYsXG4gICAgdmFsdWVzUmVmLFxuICAgIGluaXRpYWxWYWx1ZVJlZixcbiAgICBwb3B1cFJlZixcbiAgICBzZXRWYWx1ZVxuICB9ID0gdXNlU2VsZWN0Um9vdENvbnRleHQoKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHVzZVNlbGVjdEZsb2F0aW5nQ29udGV4dCgpO1xuICBjb25zdCBvcGVuID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5vcGVuKTtcbiAgY29uc3QgbW91bnRlZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubW91bnRlZCk7XG4gIGNvbnN0IG1vZGFsID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5tb2RhbCk7XG4gIGNvbnN0IHZhbHVlID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy52YWx1ZSk7XG4gIGNvbnN0IG9wZW5NZXRob2QgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLm9wZW5NZXRob2QpO1xuICBjb25zdCBwb3NpdGlvbmVyRWxlbWVudCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMucG9zaXRpb25lckVsZW1lbnQpO1xuICBjb25zdCB0cmlnZ2VyRWxlbWVudCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMudHJpZ2dlckVsZW1lbnQpO1xuICBjb25zdCBpc0l0ZW1FcXVhbFRvVmFsdWUgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmlzSXRlbUVxdWFsVG9WYWx1ZSk7XG4gIGNvbnN0IHRyYW5zaXRpb25TdGF0dXMgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnRyYW5zaXRpb25TdGF0dXMpO1xuICBjb25zdCBzY3JvbGxVcEFycm93UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBzY3JvbGxEb3duQXJyb3dSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFtjb250cm9sbGVkQWxpZ25JdGVtV2l0aFRyaWdnZXIsIHNldENvbnRyb2xsZWRBbGlnbkl0ZW1XaXRoVHJpZ2dlcl0gPSBSZWFjdC51c2VTdGF0ZShhbGlnbkl0ZW1XaXRoVHJpZ2dlcik7XG4gIGNvbnN0IGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlID0gbW91bnRlZCAmJiBjb250cm9sbGVkQWxpZ25JdGVtV2l0aFRyaWdnZXIgJiYgb3Blbk1ldGhvZCAhPT0gJ3RvdWNoJztcbiAgaWYgKCFtb3VudGVkICYmIGNvbnRyb2xsZWRBbGlnbkl0ZW1XaXRoVHJpZ2dlciAhPT0gYWxpZ25JdGVtV2l0aFRyaWdnZXIpIHtcbiAgICBzZXRDb250cm9sbGVkQWxpZ25JdGVtV2l0aFRyaWdnZXIoYWxpZ25JdGVtV2l0aFRyaWdnZXIpO1xuICB9XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFtb3VudGVkKSB7XG4gICAgICBpZiAoc2VsZWN0b3JzLnNjcm9sbFVwQXJyb3dWaXNpYmxlKHN0b3JlLnN0YXRlKSkge1xuICAgICAgICBzdG9yZS5zZXQoJ3Njcm9sbFVwQXJyb3dWaXNpYmxlJywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGVjdG9ycy5zY3JvbGxEb3duQXJyb3dWaXNpYmxlKHN0b3JlLnN0YXRlKSkge1xuICAgICAgICBzdG9yZS5zZXQoJ3Njcm9sbERvd25BcnJvd1Zpc2libGUnLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbc3RvcmUsIG1vdW50ZWRdKTtcbiAgUmVhY3QudXNlSW1wZXJhdGl2ZUhhbmRsZShhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZVJlZiwgKCkgPT4gYWxpZ25JdGVtV2l0aFRyaWdnZXJBY3RpdmUpO1xuICB1c2VBbmNob3JlZFBvcHVwU2Nyb2xsTG9jaygoYWxpZ25JdGVtV2l0aFRyaWdnZXJBY3RpdmUgfHwgbW9kYWwpICYmIG9wZW4sIG9wZW5NZXRob2QgPT09ICd0b3VjaCcsIHBvc2l0aW9uZXJFbGVtZW50LCB0cmlnZ2VyRWxlbWVudCk7XG4gIGNvbnN0IHBvc2l0aW9uaW5nID0gdXNlQW5jaG9yUG9zaXRpb25pbmcoe1xuICAgIGFuY2hvcixcbiAgICBmbG9hdGluZ1Jvb3RDb250ZXh0LFxuICAgIHBvc2l0aW9uTWV0aG9kLFxuICAgIG1vdW50ZWQsXG4gICAgc2lkZSxcbiAgICBzaWRlT2Zmc2V0LFxuICAgIGFsaWduLFxuICAgIGFsaWduT2Zmc2V0LFxuICAgIGFycm93UGFkZGluZyxcbiAgICBjb2xsaXNpb25Cb3VuZGFyeSxcbiAgICBjb2xsaXNpb25QYWRkaW5nLFxuICAgIHN0aWNreSxcbiAgICBkaXNhYmxlQW5jaG9yVHJhY2tpbmc6IGRpc2FibGVBbmNob3JUcmFja2luZyA/PyBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSxcbiAgICBjb2xsaXNpb25Bdm9pZGFuY2UsXG4gICAga2VlcE1vdW50ZWQ6IHRydWVcbiAgfSk7XG4gIGNvbnN0IHJlbmRlcmVkU2lkZSA9IGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlID8gJ25vbmUnIDogcG9zaXRpb25pbmcuc2lkZTtcbiAgY29uc3QgcG9zaXRpb25lclN0eWxlcyA9IGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlID8gRklYRUQgOiBwb3NpdGlvbmluZy5wb3NpdGlvbmVyU3R5bGVzO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBvcGVuLFxuICAgIHNpZGU6IHJlbmRlcmVkU2lkZSxcbiAgICBhbGlnbjogcG9zaXRpb25pbmcuYWxpZ24sXG4gICAgYW5jaG9ySGlkZGVuOiBwb3NpdGlvbmluZy5hbmNob3JIaWRkZW5cbiAgfTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzdG9yZS5zZXQoJ3BvcHVwU2lkZScsIHBvc2l0aW9uaW5nLnNpZGUpO1xuICB9LCBbc3RvcmUsIHBvc2l0aW9uaW5nLnNpZGVdKTtcbiAgY29uc3Qgc2V0UG9zaXRpb25lckVsZW1lbnQgPSB1c2VTdGFibGVDYWxsYmFjayhlbGVtZW50ID0+IHtcbiAgICBzdG9yZS5zZXQoJ3Bvc2l0aW9uZXJFbGVtZW50JywgZWxlbWVudCk7XG4gIH0pO1xuICBjb25zdCBlbGVtZW50ID0gdXNlUG9zaXRpb25lcihjb21wb25lbnRQcm9wcywgc3RhdGUsIHtcbiAgICBzdHlsZXM6IHBvc2l0aW9uZXJTdHlsZXMsXG4gICAgdHJhbnNpdGlvblN0YXR1cyxcbiAgICBwcm9wczogZWxlbWVudFByb3BzLFxuICAgIHJlZnM6IFtmb3J3YXJkZWRSZWYsIHNldFBvc2l0aW9uZXJFbGVtZW50XSxcbiAgICBoaWRkZW46ICFtb3VudGVkLFxuICAgIGluZXJ0OiAhb3BlblxuICB9KTtcbiAgY29uc3QgcHJldk1hcFNpemVSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IG9uTWFwQ2hhbmdlID0gdXNlU3RhYmxlQ2FsbGJhY2sobWFwID0+IHtcbiAgICBpZiAobWFwLnNpemUgPT09IDAgJiYgcHJldk1hcFNpemVSZWYuY3VycmVudCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodmFsdWVzUmVmLmN1cnJlbnQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHByZXZTaXplID0gcHJldk1hcFNpemVSZWYuY3VycmVudDtcbiAgICBwcmV2TWFwU2l6ZVJlZi5jdXJyZW50ID0gbWFwLnNpemU7XG4gICAgaWYgKG1hcC5zaXplID09PSBwcmV2U2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBldmVudERldGFpbHMgPSBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5ub25lKTtcbiAgICBpZiAocHJldlNpemUgIT09IDAgJiYgIXN0b3JlLnN0YXRlLm11bHRpcGxlICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzZWxlY3RlZFZhbHVlSW5kZXggPSBmaW5kSXRlbUluZGV4KHZhbHVlc1JlZi5jdXJyZW50LCB2YWx1ZSwgaXNJdGVtRXF1YWxUb1ZhbHVlKTtcbiAgICAgIGlmIChzZWxlY3RlZFZhbHVlSW5kZXggPT09IC0xKSB7XG4gICAgICAgIGNvbnN0IGluaXRpYWxTZWxlY3RlZFZhbHVlID0gaW5pdGlhbFZhbHVlUmVmLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGhhc0luaXRpYWwgPSBpbml0aWFsU2VsZWN0ZWRWYWx1ZSAhPSBudWxsICYmIGZpbmRJdGVtSW5kZXgodmFsdWVzUmVmLmN1cnJlbnQsIGluaXRpYWxTZWxlY3RlZFZhbHVlLCBpc0l0ZW1FcXVhbFRvVmFsdWUpICE9PSAtMTtcbiAgICAgICAgY29uc3QgbmV4dFZhbHVlID0gaGFzSW5pdGlhbCA/IGluaXRpYWxTZWxlY3RlZFZhbHVlIDogbnVsbDtcbiAgICAgICAgc2V0VmFsdWUobmV4dFZhbHVlLCBldmVudERldGFpbHMpO1xuICAgICAgICBpZiAobmV4dFZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgc3RvcmUuc2V0KCdzZWxlY3RlZEluZGV4JywgbnVsbCk7XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtVGV4dFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJldlNpemUgIT09IDAgJiYgc3RvcmUuc3RhdGUubXVsdGlwbGUgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGNvbnN0IGhhc1Zpc2libGVJdGVtID0gc2VsZWN0ZWRJdGVtVmFsdWUgPT4gZmluZEl0ZW1JbmRleCh2YWx1ZXNSZWYuY3VycmVudCwgc2VsZWN0ZWRJdGVtVmFsdWUsIGlzSXRlbUVxdWFsVG9WYWx1ZSkgIT09IC0xO1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gdmFsdWUuZmlsdGVyKHNlbGVjdGVkSXRlbVZhbHVlID0+IGhhc1Zpc2libGVJdGVtKHNlbGVjdGVkSXRlbVZhbHVlKSk7XG4gICAgICBpZiAobmV4dFZhbHVlLmxlbmd0aCAhPT0gdmFsdWUubGVuZ3RoIHx8IG5leHRWYWx1ZS5zb21lKHNlbGVjdGVkSXRlbVZhbHVlID0+ICFzZWxlY3RlZFZhbHVlSW5jbHVkZXModmFsdWUsIHNlbGVjdGVkSXRlbVZhbHVlLCBpc0l0ZW1FcXVhbFRvVmFsdWUpKSkge1xuICAgICAgICBzZXRWYWx1ZShuZXh0VmFsdWUsIGV2ZW50RGV0YWlscyk7XG4gICAgICAgIGlmIChuZXh0VmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc3RvcmUuc2V0KCdzZWxlY3RlZEluZGV4JywgbnVsbCk7XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtVGV4dFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3BlbiAmJiBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSkge1xuICAgICAgc3RvcmUudXBkYXRlKHtcbiAgICAgICAgc2Nyb2xsVXBBcnJvd1Zpc2libGU6IGZhbHNlLFxuICAgICAgICBzY3JvbGxEb3duQXJyb3dWaXNpYmxlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICBjb25zdCBzdHlsZXNUb0NsZWFyID0ge1xuICAgICAgICBoZWlnaHQ6ICcnXG4gICAgICB9O1xuICAgICAgY2xlYXJTdHlsZXMocG9zaXRpb25lckVsZW1lbnQsIHN0eWxlc1RvQ2xlYXIpO1xuICAgICAgY2xlYXJTdHlsZXMocG9wdXBSZWYuY3VycmVudCwgc3R5bGVzVG9DbGVhcik7XG4gICAgfVxuICB9KTtcbiAgY29uc3QgY29udGV4dFZhbHVlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIC4uLnBvc2l0aW9uaW5nLFxuICAgIHNpZGU6IHJlbmRlcmVkU2lkZSxcbiAgICBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSxcbiAgICBzZXRDb250cm9sbGVkQWxpZ25JdGVtV2l0aFRyaWdnZXIsXG4gICAgc2Nyb2xsVXBBcnJvd1JlZixcbiAgICBzY3JvbGxEb3duQXJyb3dSZWZcbiAgfSksIFtwb3NpdGlvbmluZywgcmVuZGVyZWRTaWRlLCBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSwgc2V0Q29udHJvbGxlZEFsaWduSXRlbVdpdGhUcmlnZ2VyXSk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChDb21wb3NpdGVMaXN0LCB7XG4gICAgZWxlbWVudHNSZWY6IGxpc3RSZWYsXG4gICAgbGFiZWxzUmVmOiBsYWJlbHNSZWYsXG4gICAgb25NYXBDaGFuZ2U6IG9uTWFwQ2hhbmdlLFxuICAgIGNoaWxkcmVuOiAvKiNfX1BVUkVfXyovX2pzeHMoU2VsZWN0UG9zaXRpb25lckNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICAgIHZhbHVlOiBjb250ZXh0VmFsdWUsXG4gICAgICBjaGlsZHJlbjogW21vdW50ZWQgJiYgbW9kYWwgJiYgLyojX19QVVJFX18qL19qc3goSW50ZXJuYWxCYWNrZHJvcCwge1xuICAgICAgICBpbmVydDogaW5lcnRWYWx1ZSghb3BlbiksXG4gICAgICAgIGN1dG91dDogdHJpZ2dlckVsZW1lbnRcbiAgICAgIH0pLCBlbGVtZW50XVxuICAgIH0pXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RQb3NpdGlvbmVyLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RQb3NpdGlvbmVyXCI7IiwiaW1wb3J0IHsganN4IGFzIF9qc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmNvbnN0IERJU0FCTEVfU0NST0xMQkFSX0NMQVNTX05BTUUgPSAnYmFzZS11aS1kaXNhYmxlLXNjcm9sbGJhcic7XG5leHBvcnQgY29uc3Qgc3R5bGVEaXNhYmxlU2Nyb2xsYmFyID0ge1xuICBjbGFzc05hbWU6IERJU0FCTEVfU0NST0xMQkFSX0NMQVNTX05BTUUsXG4gIGdldEVsZW1lbnQobm9uY2UpIHtcbiAgICByZXR1cm4gLyojX19QVVJFX18qL19qc3goXCJzdHlsZVwiLCB7XG4gICAgICBub25jZTogbm9uY2UsXG4gICAgICBocmVmOiBESVNBQkxFX1NDUk9MTEJBUl9DTEFTU19OQU1FLFxuICAgICAgcHJlY2VkZW5jZTogXCJiYXNlLXVpOmxvd1wiLFxuICAgICAgY2hpbGRyZW46IGAuJHtESVNBQkxFX1NDUk9MTEJBUl9DTEFTU19OQU1FfXtzY3JvbGxiYXItd2lkdGg6bm9uZX0uJHtESVNBQkxFX1NDUk9MTEJBUl9DTEFTU19OQU1FfTo6LXdlYmtpdC1zY3JvbGxiYXJ7ZGlzcGxheTpub25lfWBcbiAgICB9KTtcbiAgfVxufTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHN0eWxlRGlzYWJsZVNjcm9sbGJhci5nZXRFbGVtZW50LmRpc3BsYXlOYW1lID0gXCJzdHlsZURpc2FibGVTY3JvbGxiYXIuZ2V0RWxlbWVudFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVjdFRvQ2xpZW50UmVjdCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscyc7XG5pbXBvcnQgeyBhZGRFdmVudExpc3RlbmVyIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvYWRkRXZlbnRMaXN0ZW5lcic7XG5pbXBvcnQgeyBpc1dlYktpdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2RldGVjdEJyb3dzZXInO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50LCBvd25lcldpbmRvdyB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdG9yZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3N0b3JlJztcbmltcG9ydCB7IHVzZUFuaW1hdGlvbkZyYW1lIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlQW5pbWF0aW9uRnJhbWUnO1xuaW1wb3J0IHsgRmxvYXRpbmdGb2N1c01hbmFnZXIsIHBsYXRmb3JtIGFzIGZsb2F0aW5nUGxhdGZvcm0gfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZVNlbGVjdEZsb2F0aW5nQ29udGV4dCwgdXNlU2VsZWN0Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9TZWxlY3RSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVNlbGVjdFBvc2l0aW9uZXJDb250ZXh0IH0gZnJvbSBcIi4uL3Bvc2l0aW9uZXIvU2VsZWN0UG9zaXRpb25lckNvbnRleHQuanNcIjtcbmltcG9ydCB7IHN0eWxlRGlzYWJsZVNjcm9sbGJhciB9IGZyb20gXCIuLi8uLi91dGlscy9zdHlsZXMuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VPcGVuQ2hhbmdlQ29tcGxldGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgc2VsZWN0b3JzIH0gZnJvbSBcIi4uL3N0b3JlLmpzXCI7XG5pbXBvcnQgeyBjbGVhclN0eWxlcywgTElTVF9GVU5DVElPTkFMX1NUWUxFUyB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuaW1wb3J0IHsgdXNlVG9vbGJhclJvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL3Rvb2xiYXIvcm9vdC9Ub29sYmFyUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IENPTVBPU0lURV9LRVlTIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb21wb3NpdGUvY29tcG9zaXRlLmpzXCI7XG5pbXBvcnQgeyBnZXREaXNhYmxlZE1vdW50VHJhbnNpdGlvblN0eWxlcyB9IGZyb20gXCIuLi8uLi91dGlscy9nZXREaXNhYmxlZE1vdW50VHJhbnNpdGlvblN0eWxlcy5qc1wiO1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NsYW1wLmpzXCI7XG5pbXBvcnQgeyBnZXRNYXhTY3JvbGxPZmZzZXQsIFNDUk9MTF9FREdFX1RPTEVSQU5DRV9QWCB9IGZyb20gXCIuLi8uLi91dGlscy9zY3JvbGxFZGdlcy5qc1wiO1xuaW1wb3J0IHsgdXNlQ1NQQ29udGV4dCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3NwLWNvbnRleHQvQ1NQQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlRGlyZWN0aW9uIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9kaXJlY3Rpb24tY29udGV4dC9EaXJlY3Rpb25Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCwganN4cyBhcyBfanN4cyB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuY29uc3Qgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyA9IHtcbiAgLi4ucG9wdXBTdGF0ZU1hcHBpbmcsXG4gIC4uLnRyYW5zaXRpb25TdGF0dXNNYXBwaW5nXG59O1xuXG4vKipcbiAqIEEgY29udGFpbmVyIGZvciB0aGUgc2VsZWN0IGxpc3QuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIFNlbGVjdF0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3NlbGVjdClcbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdFBvcHVwID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gU2VsZWN0UG9wdXAoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBmaW5hbEZvY3VzLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZSxcbiAgICBwb3B1cFJlZixcbiAgICBvbk9wZW5DaGFuZ2VDb21wbGV0ZSxcbiAgICBzZXRPcGVuLFxuICAgIHZhbHVlUmVmLFxuICAgIGZpcnN0SXRlbVRleHRSZWYsXG4gICAgc2VsZWN0ZWRJdGVtVGV4dFJlZixcbiAgICBrZXlib2FyZEFjdGl2ZVJlZixcbiAgICBtdWx0aXBsZSxcbiAgICBoYW5kbGVTY3JvbGxBcnJvd1Zpc2liaWxpdHksXG4gICAgc2Nyb2xsSGFuZGxlclJlZixcbiAgICBsaXN0UmVmLFxuICAgIGhpZ2hsaWdodEl0ZW1PbkhvdmVyXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgc2lkZSxcbiAgICBhbGlnbixcbiAgICBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSxcbiAgICBpc1Bvc2l0aW9uZWQsXG4gICAgc2V0Q29udHJvbGxlZEFsaWduSXRlbVdpdGhUcmlnZ2VyLFxuICAgIHNjcm9sbERvd25BcnJvd1JlZixcbiAgICBzY3JvbGxVcEFycm93UmVmXG4gIH0gPSB1c2VTZWxlY3RQb3NpdGlvbmVyQ29udGV4dCgpO1xuICBjb25zdCBpbnNpZGVUb29sYmFyID0gdXNlVG9vbGJhclJvb3RDb250ZXh0KHRydWUpICE9IG51bGw7XG4gIGNvbnN0IGZsb2F0aW5nUm9vdENvbnRleHQgPSB1c2VTZWxlY3RGbG9hdGluZ0NvbnRleHQoKTtcbiAgY29uc3QgZGlyZWN0aW9uID0gdXNlRGlyZWN0aW9uKCk7XG4gIGNvbnN0IHtcbiAgICBub25jZSxcbiAgICBkaXNhYmxlU3R5bGVFbGVtZW50c1xuICB9ID0gdXNlQ1NQQ29udGV4dCgpO1xuICBjb25zdCBpZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaWQpO1xuICBjb25zdCBvcGVuID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5vcGVuKTtcbiAgY29uc3QgbW91bnRlZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubW91bnRlZCk7XG4gIGNvbnN0IHBvcHVwUHJvcHMgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnBvcHVwUHJvcHMpO1xuICBjb25zdCB0cmFuc2l0aW9uU3RhdHVzID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy50cmFuc2l0aW9uU3RhdHVzKTtcbiAgY29uc3QgdHJpZ2dlckVsZW1lbnQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnRyaWdnZXJFbGVtZW50KTtcbiAgY29uc3QgcG9zaXRpb25lckVsZW1lbnQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLnBvc2l0aW9uZXJFbGVtZW50KTtcbiAgY29uc3QgbGlzdEVsZW1lbnQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmxpc3RFbGVtZW50KTtcbiAgY29uc3QgcmVhY2hlZE1heEhlaWdodFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGluaXRpYWxQbGFjZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBvcmlnaW5hbFBvc2l0aW9uZXJTdHlsZXNSZWYgPSBSZWFjdC51c2VSZWYoe30pO1xuICBjb25zdCBzY3JvbGxBcnJvd0ZyYW1lID0gdXNlQW5pbWF0aW9uRnJhbWUoKTtcbiAgY29uc3QgaGFuZGxlU2Nyb2xsID0gdXNlU3RhYmxlQ2FsbGJhY2soc2Nyb2xsZXIgPT4ge1xuICAgIGlmICghcG9zaXRpb25lckVsZW1lbnQgfHwgIXBvcHVwUmVmLmN1cnJlbnQgfHwgIWluaXRpYWxQbGFjZWRSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVhY2hlZE1heEhlaWdodFJlZi5jdXJyZW50IHx8ICFhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSkge1xuICAgICAgaGFuZGxlU2Nyb2xsQXJyb3dWaXNpYmlsaXR5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGlzVG9wUG9zaXRpb25lZCA9IHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLnRvcCA9PT0gJzBweCc7XG4gICAgY29uc3QgaXNCb3R0b21Qb3NpdGlvbmVkID0gcG9zaXRpb25lckVsZW1lbnQuc3R5bGUuYm90dG9tID09PSAnMHB4JztcbiAgICBpZiAoIWlzVG9wUG9zaXRpb25lZCAmJiAhaXNCb3R0b21Qb3NpdGlvbmVkKSB7XG4gICAgICBoYW5kbGVTY3JvbGxBcnJvd1Zpc2liaWxpdHkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSBnZXRTY2FsZShwb3NpdGlvbmVyRWxlbWVudCk7XG4gICAgY29uc3QgY3VycmVudEhlaWdodCA9IG5vcm1hbGl6ZVNpemUocG9zaXRpb25lckVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0LCAneScsIHNjYWxlKTtcbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KHBvc2l0aW9uZXJFbGVtZW50KTtcbiAgICBjb25zdCBwb3NpdGlvbmVyU3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShwb3NpdGlvbmVyRWxlbWVudCk7XG4gICAgY29uc3QgbWFyZ2luVG9wID0gcGFyc2VGbG9hdChwb3NpdGlvbmVyU3R5bGVzLm1hcmdpblRvcCk7XG4gICAgY29uc3QgbWFyZ2luQm90dG9tID0gcGFyc2VGbG9hdChwb3NpdGlvbmVyU3R5bGVzLm1hcmdpbkJvdHRvbSk7XG4gICAgY29uc3QgbWF4UG9wdXBIZWlnaHQgPSBnZXRNYXhQb3B1cEhlaWdodChnZXRDb21wdXRlZFN0eWxlKHBvcHVwUmVmLmN1cnJlbnQpKTtcbiAgICBjb25zdCBtYXhBdmFpbGFibGVIZWlnaHQgPSBNYXRoLm1pbihkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAtIG1hcmdpblRvcCAtIG1hcmdpbkJvdHRvbSwgbWF4UG9wdXBIZWlnaHQpO1xuICAgIGNvbnN0IHNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICBjb25zdCBtYXhTY3JvbGxUb3AgPSBnZXRNYXhTY3JvbGxUb3Aoc2Nyb2xsZXIpO1xuICAgIGxldCBuZXh0UG9zaXRpb25lckhlaWdodCA9IDA7XG4gICAgbGV0IG5leHRTY3JvbGxUb3AgPSBudWxsO1xuICAgIGxldCBzZXRSZWFjaGVkTWF4ID0gZmFsc2U7XG4gICAgbGV0IHNjcm9sbFRvTWF4ID0gZmFsc2U7XG4gICAgY29uc3Qgc2V0SGVpZ2h0ID0gaGVpZ2h0ID0+IHtcbiAgICAgIHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgfTtcbiAgICBjb25zdCBoYW5kbGVTbWFsbERpZmYgPSAoZGlmZiwgdGFyZ2V0U2Nyb2xsVG9wKSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHREZWx0YSA9IGNsYW1wKGRpZmYsIDAsIG1heEF2YWlsYWJsZUhlaWdodCAtIGN1cnJlbnRIZWlnaHQpO1xuICAgICAgaWYgKGhlaWdodERlbHRhID4gMCkge1xuICAgICAgICAvLyBDb25zdW1lIHRoZSByZW1haW5pbmcgc2Nyb2xsIGluIGhlaWdodC5cbiAgICAgICAgc2V0SGVpZ2h0KGN1cnJlbnRIZWlnaHQgKyBoZWlnaHREZWx0YSk7XG4gICAgICB9XG4gICAgICBzY3JvbGxlci5zY3JvbGxUb3AgPSB0YXJnZXRTY3JvbGxUb3A7XG4gICAgICBpZiAobWF4QXZhaWxhYmxlSGVpZ2h0IC0gKGN1cnJlbnRIZWlnaHQgKyBoZWlnaHREZWx0YSkgPD0gU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYKSB7XG4gICAgICAgIHJlYWNoZWRNYXhIZWlnaHRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgICBoYW5kbGVTY3JvbGxBcnJvd1Zpc2liaWxpdHkoKTtcbiAgICB9O1xuICAgIGNvbnN0IGRpZmYgPSBpc1RvcFBvc2l0aW9uZWQgPyBtYXhTY3JvbGxUb3AgLSBzY3JvbGxUb3AgOiBzY3JvbGxUb3A7XG4gICAgY29uc3QgbmV4dEhlaWdodCA9IE1hdGgubWluKGN1cnJlbnRIZWlnaHQgKyBkaWZmLCBtYXhBdmFpbGFibGVIZWlnaHQpO1xuICAgIG5leHRQb3NpdGlvbmVySGVpZ2h0ID0gbmV4dEhlaWdodDtcbiAgICBpZiAoZGlmZiA8PSBTQ1JPTExfRURHRV9UT0xFUkFOQ0VfUFgpIHtcbiAgICAgIGhhbmRsZVNtYWxsRGlmZihkaWZmLCBpc1RvcFBvc2l0aW9uZWQgPyBtYXhTY3JvbGxUb3AgOiAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1heEF2YWlsYWJsZUhlaWdodCAtIG5leHRIZWlnaHQgPiBTQ1JPTExfRURHRV9UT0xFUkFOQ0VfUFgpIHtcbiAgICAgIGlmIChpc1RvcFBvc2l0aW9uZWQpIHtcbiAgICAgICAgc2Nyb2xsVG9NYXggPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dFNjcm9sbFRvcCA9IDA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFJlYWNoZWRNYXggPSB0cnVlO1xuICAgICAgaWYgKGlzQm90dG9tUG9zaXRpb25lZCAmJiBzY3JvbGxUb3AgPCBtYXhTY3JvbGxUb3ApIHtcbiAgICAgICAgY29uc3Qgb3ZlcnNob290ID0gY3VycmVudEhlaWdodCArIGRpZmYgLSBtYXhBdmFpbGFibGVIZWlnaHQ7XG4gICAgICAgIG5leHRTY3JvbGxUb3AgPSBzY3JvbGxUb3AgLSAoZGlmZiAtIG92ZXJzaG9vdCk7XG4gICAgICB9XG4gICAgfVxuICAgIG5leHRQb3NpdGlvbmVySGVpZ2h0ID0gTWF0aC5jZWlsKG5leHRQb3NpdGlvbmVySGVpZ2h0KTtcbiAgICBpZiAobmV4dFBvc2l0aW9uZXJIZWlnaHQgIT09IDApIHtcbiAgICAgIHNldEhlaWdodChuZXh0UG9zaXRpb25lckhlaWdodCk7XG4gICAgfVxuICAgIGlmIChzY3JvbGxUb01heCB8fCBuZXh0U2Nyb2xsVG9wICE9IG51bGwpIHtcbiAgICAgIC8vIFJlY29tcHV0ZSBib3VuZHMgYWZ0ZXIgcmVzaXppbmcgKGNsaWVudEhlaWdodCBsaWtlbHkgY2hhbmdlZCkuXG4gICAgICBjb25zdCBuZXh0TWF4U2Nyb2xsVG9wID0gZ2V0TWF4U2Nyb2xsVG9wKHNjcm9sbGVyKTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHNjcm9sbFRvTWF4ID8gbmV4dE1heFNjcm9sbFRvcCA6IGNsYW1wKG5leHRTY3JvbGxUb3AsIDAsIG5leHRNYXhTY3JvbGxUb3ApO1xuXG4gICAgICAvLyBBdm9pZCBhZGp1c3RtZW50cyB0aGF0IHJlLXRyaWdnZXIgc2Nyb2xsIGV2ZW50cyBmb3JldmVyLlxuICAgICAgaWYgKE1hdGguYWJzKHNjcm9sbGVyLnNjcm9sbFRvcCAtIHRhcmdldCkgPiBTQ1JPTExfRURHRV9UT0xFUkFOQ0VfUFgpIHtcbiAgICAgICAgc2Nyb2xsZXIuc2Nyb2xsVG9wID0gdGFyZ2V0O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2V0UmVhY2hlZE1heCB8fCBuZXh0UG9zaXRpb25lckhlaWdodCA+PSBtYXhBdmFpbGFibGVIZWlnaHQgLSBTQ1JPTExfRURHRV9UT0xFUkFOQ0VfUFgpIHtcbiAgICAgIHJlYWNoZWRNYXhIZWlnaHRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfVxuICAgIGhhbmRsZVNjcm9sbEFycm93VmlzaWJpbGl0eSgpO1xuICB9KTtcbiAgUmVhY3QudXNlSW1wZXJhdGl2ZUhhbmRsZShzY3JvbGxIYW5kbGVyUmVmLCAoKSA9PiBoYW5kbGVTY3JvbGwsIFtoYW5kbGVTY3JvbGxdKTtcbiAgdXNlT3BlbkNoYW5nZUNvbXBsZXRlKHtcbiAgICBvcGVuLFxuICAgIHJlZjogcG9wdXBSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgIG9uT3BlbkNoYW5nZUNvbXBsZXRlPy4odHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgIHNpZGUsXG4gICAgYWxpZ25cbiAgfTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXBvc2l0aW9uZXJFbGVtZW50IHx8ICFwb3B1cFJlZi5jdXJyZW50IHx8IE9iamVjdC5rZXlzKG9yaWdpbmFsUG9zaXRpb25lclN0eWxlc1JlZi5jdXJyZW50KS5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgb3JpZ2luYWxQb3NpdGlvbmVyU3R5bGVzUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b3A6IHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLnRvcCB8fCAnMCcsXG4gICAgICBsZWZ0OiBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5sZWZ0IHx8ICcwJyxcbiAgICAgIHJpZ2h0OiBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5yaWdodCxcbiAgICAgIGhlaWdodDogcG9zaXRpb25lckVsZW1lbnQuc3R5bGUuaGVpZ2h0LFxuICAgICAgYm90dG9tOiBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5ib3R0b20sXG4gICAgICBtaW5IZWlnaHQ6IHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLm1pbkhlaWdodCxcbiAgICAgIG1heEhlaWdodDogcG9zaXRpb25lckVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0LFxuICAgICAgbWFyZ2luVG9wOiBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5tYXJnaW5Ub3AsXG4gICAgICBtYXJnaW5Cb3R0b206IHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLm1hcmdpbkJvdHRvbVxuICAgIH07XG4gIH0sIFtwb3B1cFJlZiwgcG9zaXRpb25lckVsZW1lbnRdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAob3BlbiB8fCBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpbml0aWFsUGxhY2VkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICByZWFjaGVkTWF4SGVpZ2h0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBjbGVhclN0eWxlcyhwb3NpdGlvbmVyRWxlbWVudCwgb3JpZ2luYWxQb3NpdGlvbmVyU3R5bGVzUmVmLmN1cnJlbnQpO1xuICB9LCBbb3BlbiwgYWxpZ25JdGVtV2l0aFRyaWdnZXJBY3RpdmUsIHBvc2l0aW9uZXJFbGVtZW50LCBwb3B1cFJlZl0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHBvcHVwRWxlbWVudCA9IHBvcHVwUmVmLmN1cnJlbnQ7XG5cbiAgICAvLyBXYWl0IGZvciBGbG9hdGluZyBVSSdzIGZpcnN0IHBvc2l0aW9uaW5nIHBhc3MgYmVmb3JlIHJlYWRpbmcgRE9NIGdlb21ldHJ5LlxuICAgIC8vIFdlIHJlcGxhY2UgdGhlIGZpbmFsIGNvb3JkaW5hdGVzIGZvciBhbGlnbmVkIHNlbGVjdHMsIGJ1dCBzdGlsbCBuZWVkIG1pZGRsZXdhcmVcbiAgICAvLyBsaWtlIGBzaXplKClgIHRvIHNldCBDU1MgdmFyaWFibGVzIHN1Y2ggYXMgYC0tYW5jaG9yLXdpZHRoYC5cbiAgICBpZiAoIW9wZW4gfHwgIXRyaWdnZXJFbGVtZW50IHx8ICFwb3NpdGlvbmVyRWxlbWVudCB8fCAhcG9wdXBFbGVtZW50IHx8IGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlICYmICFpc1Bvc2l0aW9uZWQgfHwgc3RvcmUuc3RhdGUudHJhbnNpdGlvblN0YXR1cyA9PT0gJ2VuZGluZycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSkge1xuICAgICAgaW5pdGlhbFBsYWNlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHNjcm9sbEFycm93RnJhbWUucmVxdWVzdChoYW5kbGVTY3JvbGxBcnJvd1Zpc2liaWxpdHkpO1xuICAgICAgcG9wdXBFbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KCctLXRyYW5zZm9ybS1vcmlnaW4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgd2UgcmVtb3ZlIGFueSB0cmFuc2Zvcm1zIHRoYXQgY2FuIGFmZmVjdCB0aGUgbG9jYXRpb24gb2YgdGhlIHBvcHVwXG4gICAgLy8gYW5kIHRoZXJlZm9yZSB0aGUgY2FsY3VsYXRpb25zLlxuICAgIGNvbnN0IHJlc3RvcmVUcmFuc2Zvcm1TdHlsZXMgPSB1bnNldFRyYW5zZm9ybVN0eWxlcyhwb3B1cEVsZW1lbnQpO1xuICAgIHBvcHVwRWxlbWVudC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnLS10cmFuc2Zvcm0tb3JpZ2luJyk7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0ZXh0RWxlbWVudCA9IHNlbGVjdGVkSXRlbVRleHRSZWYuY3VycmVudDtcbiAgICAgIGlmICghdGV4dEVsZW1lbnQ/LmlzQ29ubmVjdGVkKSB7XG4gICAgICAgIGNvbnN0IGhhc1NlbGVjdGVkVmFsdWUgPSBzZWxlY3RvcnMuaGFzU2VsZWN0ZWRWYWx1ZShzdG9yZS5zdGF0ZSk7XG4gICAgICAgIHRleHRFbGVtZW50ID0gIWhhc1NlbGVjdGVkVmFsdWUgJiYgZmlyc3RJdGVtVGV4dFJlZi5jdXJyZW50Py5pc0Nvbm5lY3RlZCA/IGZpcnN0SXRlbVRleHRSZWYuY3VycmVudCA6IG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZUVsZW1lbnQgPSB2YWx1ZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgcG9zaXRpb25lclN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUocG9zaXRpb25lckVsZW1lbnQpO1xuICAgICAgY29uc3QgcG9wdXBTdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKHBvcHVwRWxlbWVudCk7XG4gICAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KHRyaWdnZXJFbGVtZW50KTtcbiAgICAgIGNvbnN0IHdpbiA9IG93bmVyV2luZG93KHBvc2l0aW9uZXJFbGVtZW50KTtcbiAgICAgIGNvbnN0IHNjYWxlID0gZ2V0U2NhbGUodHJpZ2dlckVsZW1lbnQpO1xuICAgICAgY29uc3QgdHJpZ2dlclJlY3QgPSBub3JtYWxpemVSZWN0KHRyaWdnZXJFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBzY2FsZSk7XG4gICAgICBjb25zdCBwb3NpdGlvbmVyUmVjdCA9IG5vcm1hbGl6ZVJlY3QocG9zaXRpb25lckVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIHNjYWxlKTtcbiAgICAgIGNvbnN0IHRyaWdnZXJIZWlnaHQgPSB0cmlnZ2VyUmVjdC5oZWlnaHQ7XG4gICAgICBjb25zdCBzY3JvbGxlciA9IGxpc3RFbGVtZW50IHx8IHBvcHVwRWxlbWVudDtcbiAgICAgIGNvbnN0IHNjcm9sbEhlaWdodCA9IHNjcm9sbGVyLnNjcm9sbEhlaWdodDtcbiAgICAgIGNvbnN0IGJvcmRlckJvdHRvbSA9IHBhcnNlRmxvYXQocG9wdXBTdHlsZXMuYm9yZGVyQm90dG9tV2lkdGgpO1xuICAgICAgY29uc3QgbWFyZ2luVG9wID0gcGFyc2VGbG9hdChwb3NpdGlvbmVyU3R5bGVzLm1hcmdpblRvcCkgfHwgMTA7XG4gICAgICBjb25zdCBtYXJnaW5Cb3R0b20gPSBwYXJzZUZsb2F0KHBvc2l0aW9uZXJTdHlsZXMubWFyZ2luQm90dG9tKSB8fCAxMDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IHBhcnNlRmxvYXQocG9zaXRpb25lclN0eWxlcy5taW5IZWlnaHQpIHx8IDEwMDtcbiAgICAgIGNvbnN0IG1heFBvcHVwSGVpZ2h0ID0gZ2V0TWF4UG9wdXBIZWlnaHQocG9wdXBTdHlsZXMpO1xuICAgICAgY29uc3QgcGFkZGluZ0xlZnQgPSA1O1xuICAgICAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gNTtcbiAgICAgIGNvbnN0IHRyaWdnZXJDb2xsaXNpb25UaHJlc2hvbGQgPSAyMDtcbiAgICAgIGNvbnN0IHZpZXdwb3J0SGVpZ2h0ID0gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLSBtYXJnaW5Ub3AgLSBtYXJnaW5Cb3R0b207XG4gICAgICBjb25zdCB2aWV3cG9ydFdpZHRoID0gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZVNwYWNlQmVuZWF0aFRyaWdnZXIgPSB2aWV3cG9ydEhlaWdodCAtIHRyaWdnZXJSZWN0LmJvdHRvbSArIHRyaWdnZXJIZWlnaHQ7XG4gICAgICBsZXQgdGV4dFJlY3Q7XG4gICAgICBsZXQgYWxpZ25lZExlZnQgPSBkaXJlY3Rpb24gPT09ICdydGwnID8gdHJpZ2dlclJlY3QucmlnaHQgLSBwb3NpdGlvbmVyUmVjdC53aWR0aCA6IHRyaWdnZXJSZWN0LmxlZnQ7XG4gICAgICBsZXQgb2Zmc2V0WSA9IDA7XG4gICAgICBpZiAodGV4dEVsZW1lbnQgJiYgdmFsdWVFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHZhbHVlUmVjdCA9IG5vcm1hbGl6ZVJlY3QodmFsdWVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBzY2FsZSk7XG4gICAgICAgIHRleHRSZWN0ID0gbm9ybWFsaXplUmVjdCh0ZXh0RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgc2NhbGUpO1xuICAgICAgICBhbGlnbmVkTGVmdCA9IHBvc2l0aW9uZXJSZWN0LmxlZnQgKyAoZGlyZWN0aW9uID09PSAncnRsJyA/IHZhbHVlUmVjdC5yaWdodCAtIHRleHRSZWN0LnJpZ2h0IDogdmFsdWVSZWN0LmxlZnQgLSB0ZXh0UmVjdC5sZWZ0KTtcbiAgICAgICAgY29uc3QgdmFsdWVDZW50ZXJGcm9tVHJpZ2dlclRvcCA9IHZhbHVlUmVjdC50b3AgLSB0cmlnZ2VyUmVjdC50b3AgKyB2YWx1ZVJlY3QuaGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgdGV4dENlbnRlckZyb21Qb3NpdGlvbmVyVG9wID0gdGV4dFJlY3QudG9wIC0gcG9zaXRpb25lclJlY3QudG9wICsgdGV4dFJlY3QuaGVpZ2h0IC8gMjtcbiAgICAgICAgb2Zmc2V0WSA9IHRleHRDZW50ZXJGcm9tUG9zaXRpb25lclRvcCAtIHZhbHVlQ2VudGVyRnJvbVRyaWdnZXJUb3A7XG4gICAgICB9XG4gICAgICBjb25zdCBpZGVhbEhlaWdodCA9IGF2YWlsYWJsZVNwYWNlQmVuZWF0aFRyaWdnZXIgKyBvZmZzZXRZICsgbWFyZ2luQm90dG9tICsgYm9yZGVyQm90dG9tO1xuICAgICAgbGV0IGhlaWdodCA9IE1hdGgubWluKHZpZXdwb3J0SGVpZ2h0LCBpZGVhbEhlaWdodCk7XG4gICAgICBjb25zdCBtYXhIZWlnaHQgPSB2aWV3cG9ydEhlaWdodCAtIG1hcmdpblRvcCAtIG1hcmdpbkJvdHRvbTtcbiAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IGlkZWFsSGVpZ2h0IC0gaGVpZ2h0O1xuICAgICAgY29uc3QgbWF4UmlnaHQgPSB2aWV3cG9ydFdpZHRoIC0gcGFkZGluZ1JpZ2h0O1xuICAgICAgcG9zaXRpb25lckVsZW1lbnQuc3R5bGUubGVmdCA9IGAke2NsYW1wKGFsaWduZWRMZWZ0LCBwYWRkaW5nTGVmdCwgbWF4UmlnaHQgLSBwb3NpdGlvbmVyUmVjdC53aWR0aCl9cHhgO1xuICAgICAgcG9zaXRpb25lckVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICAgIHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLm1heEhlaWdodCA9ICdhdXRvJztcbiAgICAgIHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLm1hcmdpblRvcCA9IGAke21hcmdpblRvcH1weGA7XG4gICAgICBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5tYXJnaW5Cb3R0b20gPSBgJHttYXJnaW5Cb3R0b219cHhgO1xuICAgICAgcG9wdXBFbGVtZW50LnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICAgIGNvbnN0IG1heFNjcm9sbFRvcCA9IGdldE1heFNjcm9sbFRvcChzY3JvbGxlcik7XG4gICAgICBjb25zdCBpc1RvcFBvc2l0aW9uZWQgPSBzY3JvbGxUb3AgPj0gbWF4U2Nyb2xsVG9wIC0gU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYO1xuICAgICAgaWYgKGlzVG9wUG9zaXRpb25lZCkge1xuICAgICAgICBoZWlnaHQgPSBNYXRoLm1pbih2aWV3cG9ydEhlaWdodCwgcG9zaXRpb25lclJlY3QuaGVpZ2h0KSAtIChzY3JvbGxUb3AgLSBtYXhTY3JvbGxUb3ApO1xuICAgICAgfVxuXG4gICAgICAvLyBXaGVuIHRoZSB0cmlnZ2VyIGlzIHRvbyBjbG9zZSB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiB0aGUgdmlld3BvcnQsIG9yIHRoZSBtaW5IZWlnaHQgaXNcbiAgICAgIC8vIHJlYWNoZWQsIHdlIGZhbGxiYWNrIHRvIGFsaWduaW5nIHRoZSBwb3B1cCB0byB0aGUgdHJpZ2dlciBhcyB0aGUgVVggaXMgcG9vciBvdGhlcndpc2UuXG4gICAgICBjb25zdCBmYWxsYmFja1RvQWxpZ25Qb3B1cFRvVHJpZ2dlciA9IHRyaWdnZXJSZWN0LnRvcCA8IHRyaWdnZXJDb2xsaXNpb25UaHJlc2hvbGQgfHwgdHJpZ2dlclJlY3QuYm90dG9tID4gdmlld3BvcnRIZWlnaHQgLSB0cmlnZ2VyQ29sbGlzaW9uVGhyZXNob2xkIHx8IE1hdGguY2VpbChoZWlnaHQpICsgU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYIDwgTWF0aC5taW4oc2Nyb2xsSGVpZ2h0LCBtaW5IZWlnaHQpO1xuXG4gICAgICAvLyBTYWZhcmkgZG9lc24ndCBwb3NpdGlvbiB0aGUgcG9wdXAgY29ycmVjdGx5IHdoZW4gcGluY2gtem9vbWVkLlxuICAgICAgY29uc3QgaXNQaW5jaFpvb21lZCA9ICh3aW4udmlzdWFsVmlld3BvcnQ/LnNjYWxlID8/IDEpICE9PSAxICYmIGlzV2ViS2l0O1xuICAgICAgaWYgKGZhbGxiYWNrVG9BbGlnblBvcHVwVG9UcmlnZ2VyIHx8IGlzUGluY2hab29tZWQpIHtcbiAgICAgICAgaW5pdGlhbFBsYWNlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgY2xlYXJTdHlsZXMocG9zaXRpb25lckVsZW1lbnQsIG9yaWdpbmFsUG9zaXRpb25lclN0eWxlc1JlZi5jdXJyZW50KTtcbiAgICAgICAgc2V0Q29udHJvbGxlZEFsaWduSXRlbVdpdGhUcmlnZ2VyKGZhbHNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5pdGlhbEhlaWdodCA9IE1hdGgubWF4KG1pbkhlaWdodCwgaGVpZ2h0KTtcbiAgICAgIGlmIChpc1RvcFBvc2l0aW9uZWQpIHtcbiAgICAgICAgY29uc3QgdG9wT2Zmc2V0ID0gTWF0aC5tYXgoMCwgdmlld3BvcnRIZWlnaHQgLSBpZGVhbEhlaWdodCk7XG4gICAgICAgIHBvc2l0aW9uZXJFbGVtZW50LnN0eWxlLnRvcCA9IHBvc2l0aW9uZXJSZWN0LmhlaWdodCA+PSBtYXhIZWlnaHQgPyAnMCcgOiBgJHt0b3BPZmZzZXR9cHhgO1xuICAgICAgICBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBgJHtoZWlnaHR9cHhgO1xuICAgICAgICBzY3JvbGxlci5zY3JvbGxUb3AgPSBnZXRNYXhTY3JvbGxUb3Aoc2Nyb2xsZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zaXRpb25lckVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzAnO1xuICAgICAgICBzY3JvbGxlci5zY3JvbGxUb3AgPSBzY3JvbGxUb3A7XG4gICAgICB9XG4gICAgICBpZiAodGV4dFJlY3QpIHtcbiAgICAgICAgY29uc3QgcG9wdXBUb3AgPSBwb3NpdGlvbmVyUmVjdC50b3A7XG4gICAgICAgIGNvbnN0IHBvcHVwSGVpZ2h0ID0gcG9zaXRpb25lclJlY3QuaGVpZ2h0O1xuICAgICAgICBjb25zdCB0ZXh0Q2VudGVyWSA9IHRleHRSZWN0LnRvcCArIHRleHRSZWN0LmhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybU9yaWdpblkgPSBwb3B1cEhlaWdodCA+IDAgPyAodGV4dENlbnRlclkgLSBwb3B1cFRvcCkgLyBwb3B1cEhlaWdodCAqIDEwMCA6IDUwO1xuICAgICAgICBjb25zdCBjbGFtcGVkWSA9IGNsYW1wKHRyYW5zZm9ybU9yaWdpblksIDAsIDEwMCk7XG4gICAgICAgIHBvcHVwRWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10cmFuc2Zvcm0tb3JpZ2luJywgYDUwJSAke2NsYW1wZWRZfSVgKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbml0aWFsSGVpZ2h0ID09PSB2aWV3cG9ydEhlaWdodCB8fCBoZWlnaHQgPj0gbWF4UG9wdXBIZWlnaHQpIHtcbiAgICAgICAgcmVhY2hlZE1heEhlaWdodFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGhhbmRsZVNjcm9sbEFycm93VmlzaWJpbGl0eSgpO1xuICAgICAgaWYgKGhpZ2hsaWdodEl0ZW1PbkhvdmVyICYmIHN0b3JlLnN0YXRlLnNlbGVjdGVkSW5kZXggPT09IG51bGwgJiYgc3RvcmUuc3RhdGUuYWN0aXZlSW5kZXggPT09IG51bGwgJiYgbGlzdFJlZi5jdXJyZW50WzBdICE9IG51bGwpIHtcbiAgICAgICAgc3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIDApO1xuICAgICAgfVxuICAgICAgaW5pdGlhbFBsYWNlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcmVzdG9yZVRyYW5zZm9ybVN0eWxlcygpO1xuICAgIH1cbiAgfSwgW3N0b3JlLCBvcGVuLCBwb3NpdGlvbmVyRWxlbWVudCwgdHJpZ2dlckVsZW1lbnQsIHZhbHVlUmVmLCBmaXJzdEl0ZW1UZXh0UmVmLCBzZWxlY3RlZEl0ZW1UZXh0UmVmLCBwb3B1cFJlZiwgaGFuZGxlU2Nyb2xsQXJyb3dWaXNpYmlsaXR5LCBhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSwgc2V0Q29udHJvbGxlZEFsaWduSXRlbVdpdGhUcmlnZ2VyLCBzY3JvbGxBcnJvd0ZyYW1lLCBzY3JvbGxEb3duQXJyb3dSZWYsIHNjcm9sbFVwQXJyb3dSZWYsIGxpc3RFbGVtZW50LCBsaXN0UmVmLCBoaWdobGlnaHRJdGVtT25Ib3ZlciwgZGlyZWN0aW9uLCBpc1Bvc2l0aW9uZWRdKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlIHx8ICFwb3NpdGlvbmVyRWxlbWVudCB8fCAhb3Blbikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3Qgd2luID0gb3duZXJXaW5kb3cocG9zaXRpb25lckVsZW1lbnQpO1xuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc2l6ZShldmVudCkge1xuICAgICAgc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMud2luZG93UmVzaXplLCBldmVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gYWRkRXZlbnRMaXN0ZW5lcih3aW4sICdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuICB9LCBbc2V0T3BlbiwgYWxpZ25JdGVtV2l0aFRyaWdnZXJBY3RpdmUsIHBvc2l0aW9uZXJFbGVtZW50LCBvcGVuXSk7XG4gIGNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgICAuLi4obGlzdEVsZW1lbnQgPyB7XG4gICAgICByb2xlOiAncHJlc2VudGF0aW9uJyxcbiAgICAgICdhcmlhLW9yaWVudGF0aW9uJzogdW5kZWZpbmVkXG4gICAgfSA6IHtcbiAgICAgIHJvbGU6ICdsaXN0Ym94JyxcbiAgICAgICdhcmlhLW11bHRpc2VsZWN0YWJsZSc6IG11bHRpcGxlIHx8IHVuZGVmaW5lZCxcbiAgICAgIGlkOiBgJHtpZH0tbGlzdGBcbiAgICB9KSxcbiAgICBvbktleURvd24oZXZlbnQpIHtcbiAgICAgIGtleWJvYXJkQWN0aXZlUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgaWYgKGluc2lkZVRvb2xiYXIgJiYgQ09NUE9TSVRFX0tFWVMuaGFzKGV2ZW50LmtleSkpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBvbk1vdXNlTW92ZSgpIHtcbiAgICAgIGtleWJvYXJkQWN0aXZlUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9LFxuICAgIG9uU2Nyb2xsKGV2ZW50KSB7XG4gICAgICBpZiAobGlzdEVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaGFuZGxlU2Nyb2xsKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgIH0sXG4gICAgLi4uKGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlICYmIHtcbiAgICAgIHN0eWxlOiBsaXN0RWxlbWVudCA/IHtcbiAgICAgICAgaGVpZ2h0OiAnMTAwJSdcbiAgICAgIH0gOiBMSVNUX0ZVTkNUSU9OQUxfU1RZTEVTXG4gICAgfSlcbiAgfTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCBwb3B1cFJlZl0sXG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyxcbiAgICBwcm9wczogW3BvcHVwUHJvcHMsIGRlZmF1bHRQcm9wcywgZ2V0RGlzYWJsZWRNb3VudFRyYW5zaXRpb25TdHlsZXModHJhbnNpdGlvblN0YXR1cyksIHtcbiAgICAgIGNsYXNzTmFtZTogIWxpc3RFbGVtZW50ICYmIGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlID8gc3R5bGVEaXNhYmxlU2Nyb2xsYmFyLmNsYXNzTmFtZSA6IHVuZGVmaW5lZFxuICAgIH0sIGVsZW1lbnRQcm9wc11cbiAgfSk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeHMoUmVhY3QuRnJhZ21lbnQsIHtcbiAgICBjaGlsZHJlbjogWyFkaXNhYmxlU3R5bGVFbGVtZW50cyAmJiBzdHlsZURpc2FibGVTY3JvbGxiYXIuZ2V0RWxlbWVudChub25jZSksIC8qI19fUFVSRV9fKi9fanN4KEZsb2F0aW5nRm9jdXNNYW5hZ2VyLCB7XG4gICAgICBjb250ZXh0OiBmbG9hdGluZ1Jvb3RDb250ZXh0LFxuICAgICAgbW9kYWw6IGZhbHNlLFxuICAgICAgZGlzYWJsZWQ6ICFtb3VudGVkLFxuICAgICAgcmV0dXJuRm9jdXM6IGZpbmFsRm9jdXMsXG4gICAgICByZXN0b3JlRm9jdXM6IHRydWUsXG4gICAgICBjaGlsZHJlbjogZWxlbWVudFxuICAgIH0pXVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0UG9wdXAuZGlzcGxheU5hbWUgPSBcIlNlbGVjdFBvcHVwXCI7XG5mdW5jdGlvbiBnZXRNYXhQb3B1cEhlaWdodChwb3B1cFN0eWxlcykge1xuICBjb25zdCBtYXhIZWlnaHRTdHlsZSA9IHBvcHVwU3R5bGVzLm1heEhlaWdodCB8fCAnJztcbiAgcmV0dXJuIG1heEhlaWdodFN0eWxlLmVuZHNXaXRoKCdweCcpID8gcGFyc2VGbG9hdChtYXhIZWlnaHRTdHlsZSkgfHwgSW5maW5pdHkgOiBJbmZpbml0eTtcbn1cbmZ1bmN0aW9uIGdldE1heFNjcm9sbFRvcChzY3JvbGxlcikge1xuICByZXR1cm4gZ2V0TWF4U2Nyb2xsT2Zmc2V0KHNjcm9sbGVyLnNjcm9sbEhlaWdodCwgc2Nyb2xsZXIuY2xpZW50SGVpZ2h0KTtcbn1cbmZ1bmN0aW9uIGdldFNjYWxlKGVsZW1lbnQpIHtcbiAgLy8gVGhlIHBsYXRmb3JtIEFQSSBpcyBhc3luYy1jYXBhYmxlLCBidXQgdGhlIERPTSBwbGF0Zm9ybSByZXR1cm5zIGEgcGxhaW4gc2NhbGUgb2JqZWN0LlxuICByZXR1cm4gZmxvYXRpbmdQbGF0Zm9ybS5nZXRTY2FsZShlbGVtZW50KTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNpemUoc2l6ZSwgYXhpcywgc2NhbGUpIHtcbiAgcmV0dXJuIHNpemUgLyBzY2FsZVtheGlzXTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlY3QocmVjdCwgc2NhbGUpIHtcbiAgcmV0dXJuIHJlY3RUb0NsaWVudFJlY3Qoe1xuICAgIHg6IG5vcm1hbGl6ZVNpemUocmVjdC54LCAneCcsIHNjYWxlKSxcbiAgICB5OiBub3JtYWxpemVTaXplKHJlY3QueSwgJ3knLCBzY2FsZSksXG4gICAgd2lkdGg6IG5vcm1hbGl6ZVNpemUocmVjdC53aWR0aCwgJ3gnLCBzY2FsZSksXG4gICAgaGVpZ2h0OiBub3JtYWxpemVTaXplKHJlY3QuaGVpZ2h0LCAneScsIHNjYWxlKVxuICB9KTtcbn1cbmNvbnN0IFRSQU5TRk9STV9TVFlMRV9SRVNFVFMgPSBbWyd0cmFuc2Zvcm0nLCAnbm9uZSddLCBbJ3NjYWxlJywgJzEnXSwgWyd0cmFuc2xhdGUnLCAnMCAwJ11dO1xuZnVuY3Rpb24gdW5zZXRUcmFuc2Zvcm1TdHlsZXMocG9wdXBFbGVtZW50KSB7XG4gIGNvbnN0IHtcbiAgICBzdHlsZVxuICB9ID0gcG9wdXBFbGVtZW50O1xuICBjb25zdCBvcmlnaW5hbFN0eWxlcyA9IHt9O1xuICBmb3IgKGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdIG9mIFRSQU5TRk9STV9TVFlMRV9SRVNFVFMpIHtcbiAgICBvcmlnaW5hbFN0eWxlc1twcm9wZXJ0eV0gPSBzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbiAgICBzdHlsZS5zZXRQcm9wZXJ0eShwcm9wZXJ0eSwgdmFsdWUsICdpbXBvcnRhbnQnKTtcbiAgfVxuICByZXR1cm4gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgW3Byb3BlcnR5XSBvZiBUUkFOU0ZPUk1fU1RZTEVfUkVTRVRTKSB7XG4gICAgICBjb25zdCBvcmlnaW5hbFZhbHVlID0gb3JpZ2luYWxTdHlsZXNbcHJvcGVydHldO1xuICAgICAgaWYgKG9yaWdpbmFsVmFsdWUpIHtcbiAgICAgICAgc3R5bGUuc2V0UHJvcGVydHkocHJvcGVydHksIG9yaWdpbmFsVmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcGVydHkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlU3RvcmUgfSBmcm9tICdAYmFzZS11aS91dGlscy9zdG9yZSc7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RQb3NpdGlvbmVyQ29udGV4dCB9IGZyb20gXCIuLi9wb3NpdGlvbmVyL1NlbGVjdFBvc2l0aW9uZXJDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBzdHlsZURpc2FibGVTY3JvbGxiYXIgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc3R5bGVzLmpzXCI7XG5pbXBvcnQgeyBMSVNUX0ZVTkNUSU9OQUxfU1RZTEVTIH0gZnJvbSBcIi4uL3BvcHVwL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcblxuLyoqXG4gKiBBIGNvbnRhaW5lciBmb3IgdGhlIHNlbGVjdCBpdGVtcy5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0TGlzdCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdExpc3QoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgc3RvcmUsXG4gICAgc2Nyb2xsSGFuZGxlclJlZlxuICB9ID0gdXNlU2VsZWN0Um9vdENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlXG4gIH0gPSB1c2VTZWxlY3RQb3NpdGlvbmVyQ29udGV4dCgpO1xuICBjb25zdCBoYXNTY3JvbGxBcnJvd3MgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmhhc1Njcm9sbEFycm93cyk7XG4gIGNvbnN0IG9wZW5NZXRob2QgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLm9wZW5NZXRob2QpO1xuICBjb25zdCBtdWx0aXBsZSA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMubXVsdGlwbGUpO1xuICBjb25zdCBpZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaWQpO1xuICBjb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gICAgaWQ6IGAke2lkfS1saXN0YCxcbiAgICByb2xlOiAnbGlzdGJveCcsXG4gICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJzogbXVsdGlwbGUgfHwgdW5kZWZpbmVkLFxuICAgIG9uU2Nyb2xsKGV2ZW50KSB7XG4gICAgICBzY3JvbGxIYW5kbGVyUmVmLmN1cnJlbnQ/LihldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICB9LFxuICAgIC4uLihhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSAmJiB7XG4gICAgICBzdHlsZTogTElTVF9GVU5DVElPTkFMX1NUWUxFU1xuICAgIH0pLFxuICAgIGNsYXNzTmFtZTogaGFzU2Nyb2xsQXJyb3dzICYmIG9wZW5NZXRob2QgIT09ICd0b3VjaCcgPyBzdHlsZURpc2FibGVTY3JvbGxiYXIuY2xhc3NOYW1lIDogdW5kZWZpbmVkXG4gIH07XG4gIGNvbnN0IHNldExpc3RFbGVtZW50ID0gdXNlU3RhYmxlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgc3RvcmUuc2V0KCdsaXN0RWxlbWVudCcsIGVsZW1lbnQpO1xuICB9KTtcbiAgcmV0dXJuIHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCBzZXRMaXN0RWxlbWVudF0sXG4gICAgcHJvcHM6IFtkZWZhdWx0UHJvcHMsIGVsZW1lbnRQcm9wc11cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdExpc3QuZGlzcGxheU5hbWUgPSBcIlNlbGVjdExpc3RcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBTZWxlY3RJdGVtQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RJdGVtQ29udGV4dC5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0SXRlbUNvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VTZWxlY3RJdGVtQ29udGV4dCgpIHtcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoU2VsZWN0SXRlbUNvbnRleHQpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IFNlbGVjdEl0ZW1Db250ZXh0IGlzIG1pc3NpbmcuIFNlbGVjdEl0ZW0gcGFydHMgbXVzdCBiZSBwbGFjZWQgd2l0aGluIDxTZWxlY3QuSXRlbT4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoNTcpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdG9yZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3N0b3JlJztcbmltcG9ydCB7IHVzZVNlbGVjdFJvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvU2VsZWN0Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZUNvbXBvc2l0ZUxpc3RJdGVtLCBJbmRleEd1ZXNzQmVoYXZpb3IgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9saXN0L3VzZUNvbXBvc2l0ZUxpc3RJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBTZWxlY3RJdGVtQ29udGV4dCB9IGZyb20gXCIuL1NlbGVjdEl0ZW1Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IGNvbXBhcmVJdGVtRXF1YWxpdHksIHJlbW92ZUl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2l0ZW1FcXVhbGl0eS5qc1wiO1xuaW1wb3J0IHsgaXNWaXJ0dWFsQ2xpY2sgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMvZXZlbnQuanNcIjtcblxuLyoqXG4gKiBBbiBpbmRpdmlkdWFsIG9wdGlvbiBpbiB0aGUgc2VsZWN0IHBvcHVwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgU2VsZWN0SXRlbSA9IC8qI19fUFVSRV9fKi9SZWFjdC5tZW1vKC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdEl0ZW0oY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICB2YWx1ZTogaXRlbVZhbHVlID0gbnVsbCxcbiAgICBsYWJlbCxcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIG5hdGl2ZUJ1dHRvbiA9IGZhbHNlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHRleHRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxpc3RJdGVtID0gdXNlQ29tcG9zaXRlTGlzdEl0ZW0oe1xuICAgIGxhYmVsLFxuICAgIHRleHRSZWYsXG4gICAgaW5kZXhHdWVzc0JlaGF2aW9yOiBJbmRleEd1ZXNzQmVoYXZpb3IuR3Vlc3NGcm9tT3JkZXJcbiAgfSk7XG4gIGNvbnN0IHtcbiAgICBzdG9yZSxcbiAgICBpdGVtUHJvcHMsXG4gICAgc2V0T3BlbixcbiAgICBzZXRWYWx1ZSxcbiAgICBzZWxlY3Rpb25SZWYsXG4gICAgdHlwaW5nUmVmLFxuICAgIHZhbHVlc1JlZixcbiAgICBtdWx0aXBsZSxcbiAgICBzZWxlY3RlZEl0ZW1UZXh0UmVmXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCBoaWdobGlnaHRlZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaXNBY3RpdmUsIGxpc3RJdGVtLmluZGV4KTtcbiAgY29uc3Qgc2VsZWN0ZWQgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmlzU2VsZWN0ZWQsIGxpc3RJdGVtLmluZGV4LCBpdGVtVmFsdWUpO1xuICBjb25zdCBzZWxlY3RlZEJ5Rm9jdXMgPSB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3JzLmlzU2VsZWN0ZWRCeUZvY3VzLCBsaXN0SXRlbS5pbmRleCk7XG4gIGNvbnN0IGlzSXRlbUVxdWFsVG9WYWx1ZSA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMuaXNJdGVtRXF1YWxUb1ZhbHVlKTtcbiAgY29uc3QgaW5kZXggPSBsaXN0SXRlbS5pbmRleDtcbiAgY29uc3QgaGFzUmVnaXN0ZXJlZCA9IGluZGV4ICE9PSAtMTtcbiAgY29uc3QgaXRlbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWhhc1JlZ2lzdGVyZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlcyA9IHZhbHVlc1JlZi5jdXJyZW50O1xuICAgIHZhbHVlc1tpbmRleF0gPSBpdGVtVmFsdWU7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGRlbGV0ZSB2YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gIH0sIFtoYXNSZWdpc3RlcmVkLCBpbmRleCwgaXRlbVZhbHVlLCB2YWx1ZXNSZWZdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWhhc1JlZ2lzdGVyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWRWYWx1ZSA9IHN0b3JlLnN0YXRlLnZhbHVlO1xuICAgIGxldCBzZWxlY3RlZENhbmRpZGF0ZSA9IHNlbGVjdGVkVmFsdWU7XG4gICAgaWYgKG11bHRpcGxlICYmIEFycmF5LmlzQXJyYXkoc2VsZWN0ZWRWYWx1ZSkgJiYgc2VsZWN0ZWRWYWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBzZWxlY3RlZENhbmRpZGF0ZSA9IHNlbGVjdGVkVmFsdWVbc2VsZWN0ZWRWYWx1ZS5sZW5ndGggLSAxXTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdGVkQ2FuZGlkYXRlICE9PSB1bmRlZmluZWQgJiYgY29tcGFyZUl0ZW1FcXVhbGl0eShpdGVtVmFsdWUsIHNlbGVjdGVkQ2FuZGlkYXRlLCBpc0l0ZW1FcXVhbFRvVmFsdWUpKSB7XG4gICAgICBzdG9yZS5zZXQoJ3NlbGVjdGVkSW5kZXgnLCBpbmRleCk7XG4gICAgICAvLyBNYWtlIHN1cmUgU2VsZWN0UG9wdXAgY2FuIG1lYXN1cmUgdGhlIHNlbGVjdGVkIGl0ZW0gb24gZmlyc3Qgb3Blbi5cbiAgICAgIC8vIFNlbGVjdEl0ZW1UZXh0IGNhbiBzdGlsbCB1cGRhdGUgdGhpcyByZWYgbGF0ZXIgd2hlbiBmb2N1cyBtb3Zlcy5cbiAgICAgIGlmICh0ZXh0UmVmLmN1cnJlbnQpIHtcbiAgICAgICAgc2VsZWN0ZWRJdGVtVGV4dFJlZi5jdXJyZW50ID0gdGV4dFJlZi5jdXJyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfSwgW2hhc1JlZ2lzdGVyZWQsIGluZGV4LCBtdWx0aXBsZSwgaXNJdGVtRXF1YWxUb1ZhbHVlLCBzdG9yZSwgaXRlbVZhbHVlLCBzZWxlY3RlZEl0ZW1UZXh0UmVmXSk7XG4gIGNvbnN0IGxhc3RLZXlSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHBvaW50ZXJUeXBlUmVmID0gUmVhY3QudXNlUmVmKCdtb3VzZScpO1xuICBjb25zdCBhbGxvd01vdXNlU2VsZWN0aW9uUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3Qge1xuICAgIGdldEJ1dHRvblByb3BzLFxuICAgIGJ1dHRvblJlZlxuICB9ID0gdXNlQnV0dG9uKHtcbiAgICBkaXNhYmxlZCxcbiAgICBmb2N1c2FibGVXaGVuRGlzYWJsZWQ6IHRydWUsXG4gICAgbmF0aXZlOiBuYXRpdmVCdXR0b24sXG4gICAgY29tcG9zaXRlOiB0cnVlXG4gIH0pO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBkaXNhYmxlZCxcbiAgICBzZWxlY3RlZCxcbiAgICBoaWdobGlnaHRlZFxuICB9O1xuICBmdW5jdGlvbiBjb21taXRTZWxlY3Rpb24oZXZlbnQpIHtcbiAgICBjb25zdCBzZWxlY3RlZFZhbHVlID0gc3RvcmUuc3RhdGUudmFsdWU7XG4gICAgaWYgKG11bHRpcGxlKSB7XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBBcnJheS5pc0FycmF5KHNlbGVjdGVkVmFsdWUpID8gc2VsZWN0ZWRWYWx1ZSA6IFtdO1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gc2VsZWN0ZWQgPyByZW1vdmVJdGVtKGN1cnJlbnRWYWx1ZSwgaXRlbVZhbHVlLCBpc0l0ZW1FcXVhbFRvVmFsdWUpIDogWy4uLmN1cnJlbnRWYWx1ZSwgaXRlbVZhbHVlXTtcbiAgICAgIHNldFZhbHVlKG5leHRWYWx1ZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMuaXRlbVByZXNzLCBldmVudCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRWYWx1ZShpdGVtVmFsdWUsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLml0ZW1QcmVzcywgZXZlbnQpKTtcbiAgICAgIHNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLml0ZW1QcmVzcywgZXZlbnQpKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVzZXREcmFnTW92ZW1lbnQoKSB7XG4gICAgc2VsZWN0aW9uUmVmLmN1cnJlbnQuZHJhZ1kgPSAwO1xuICB9XG4gIGNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgICByb2xlOiAnb3B0aW9uJyxcbiAgICAnYXJpYS1zZWxlY3RlZCc6IHNlbGVjdGVkLFxuICAgIHRhYkluZGV4OiBoaWdobGlnaHRlZCA/IDAgOiAtMSxcbiAgICBvbktleURvd24oZXZlbnQpIHtcbiAgICAgIGxhc3RLZXlSZWYuY3VycmVudCA9IGV2ZW50LmtleTtcbiAgICAgIHN0b3JlLnNldCgnYWN0aXZlSW5kZXgnLCBpbmRleCk7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSAnICcgJiYgdHlwaW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9uQ2xpY2soZXZlbnQpIHtcbiAgICAgIGNvbnN0IGlzTW91c2VDbGljayA9IGV2ZW50LnR5cGUgPT09ICdjbGljaycgJiYgcG9pbnRlclR5cGVSZWYuY3VycmVudCAhPT0gJ3RvdWNoJztcbiAgICAgIGNvbnN0IGNsaWNrUG9pbnRlclR5cGUgPSBldmVudC5uYXRpdmVFdmVudC5wb2ludGVyVHlwZTtcbiAgICAgIGNvbnN0IGlzVmlydHVhbE1vdXNlQ2xpY2sgPSBpc01vdXNlQ2xpY2sgJiYgaXNWaXJ0dWFsQ2xpY2soZXZlbnQubmF0aXZlRXZlbnQpICYmIChcbiAgICAgIC8vIEdlbmVyaWMgbm8tcG9pbnRlciBgZGV0YWlsID09PSAwYCBjbGlja3Mgc3RheSB0aWVkIHRvIGhpZ2hsaWdodCBzdGF0ZS4gVmlydHVhbFxuICAgICAgLy8gY2xpY2tzIHRoYXQgY2FycnkgYnJvd3NlciBwb2ludGVyIGRhdGEsIGluY2x1ZGluZyBhbiBlbXB0eSBzdHJpbmcgZnJvbSBhc3Npc3RpdmVcbiAgICAgIC8vIHRlY2hub2xvZ3ksIGNhbiBhY3RpdmF0ZSB1bmhpZ2hsaWdodGVkIGl0ZW1zLlxuICAgICAgY2xpY2tQb2ludGVyVHlwZSAhPT0gdW5kZWZpbmVkIHx8IGhpZ2hsaWdodGVkKTtcbiAgICAgIC8vIFdpdGggYWxpZ25JdGVtV2l0aFRyaWdnZXIsIG9wZW5pbmcgY2FuIHBsYWNlIGFuIGl0ZW0gdW5kZXIgdGhlIGN1cnNvci4gUmVhbCBtb3VzZVxuICAgICAgLy8gY2xpY2tzIG11c3Qgc3RhcnQgb24gdGhlIGl0ZW0sIHdoaWxlIHZpcnR1YWwgY2xpY2tzIHJlcHJlc2VudCBleHBsaWNpdCBrZXlib2FyZCBvclxuICAgICAgLy8gYXNzaXN0aXZlIHRlY2hub2xvZ3kgYWN0aXZhdGlvbi5cbiAgICAgIGNvbnN0IGlzSW52YWxpZE1vdXNlQ2xpY2sgPSBpc01vdXNlQ2xpY2sgJiYgIWlzVmlydHVhbE1vdXNlQ2xpY2sgJiYgIWFsbG93TW91c2VTZWxlY3Rpb25SZWYuY3VycmVudDtcbiAgICAgIGFsbG93TW91c2VTZWxlY3Rpb25SZWYuY3VycmVudCA9IGZhbHNlO1xuXG4gICAgICAvLyBQcmV2ZW50IGRvdWJsZSBjb21taXQgb24ge0VudGVyfVxuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdrZXlkb3duJyAmJiBsYXN0S2V5UmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGRpc2FibGVkIHx8IGV2ZW50LnR5cGUgPT09ICdrZXlkb3duJyAmJiBsYXN0S2V5UmVmLmN1cnJlbnQgPT09ICcgJyAmJiB0eXBpbmdSZWYuY3VycmVudCB8fCBpc0ludmFsaWRNb3VzZUNsaWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxhc3RLZXlSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICBjb21taXRTZWxlY3Rpb24oZXZlbnQubmF0aXZlRXZlbnQpO1xuICAgIH0sXG4gICAgb25Qb2ludGVyRW50ZXIoZXZlbnQpIHtcbiAgICAgIHBvaW50ZXJUeXBlUmVmLmN1cnJlbnQgPSBldmVudC5wb2ludGVyVHlwZTtcbiAgICB9LFxuICAgIG9uUG9pbnRlck1vdmUoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyAmJiBldmVudC5idXR0b25zID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvblJlZi5jdXJyZW50O1xuICAgICAgICBzZWxlY3Rpb24uZHJhZ1kgKz0gZXZlbnQubW92ZW1lbnRZO1xuICAgICAgICBpZiAoc2VsZWN0aW9uLmRyYWdZICoqIDIgPj0gNjQpIHtcbiAgICAgICAgICBzZWxlY3Rpb24uYWxsb3dVbnNlbGVjdGVkTW91c2VVcCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG9uUG9pbnRlckRvd24oZXZlbnQpIHtcbiAgICAgIHBvaW50ZXJUeXBlUmVmLmN1cnJlbnQgPSBldmVudC5wb2ludGVyVHlwZTtcbiAgICAgIGFsbG93TW91c2VTZWxlY3Rpb25SZWYuY3VycmVudCA9IHRydWU7XG4gICAgICByZXNldERyYWdNb3ZlbWVudCgpO1xuICAgIH0sXG4gICAgb25Nb3VzZVVwKCkge1xuICAgICAgcmVzZXREcmFnTW92ZW1lbnQoKTtcbiAgICAgIGlmIChkaXNhYmxlZCB8fCBwb2ludGVyVHlwZVJlZi5jdXJyZW50ID09PSAndG91Y2gnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVndWxhciBjbGlja3MgYXJlIGNvbW1pdHRlZCBieSB0aGUgY2xpY2sgZXZlbnQuXG4gICAgICBpZiAoYWxsb3dNb3VzZVNlbGVjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRpc2FsbG93U2VsZWN0ZWRNb3VzZVVwID0gIXNlbGVjdGlvblJlZi5jdXJyZW50LmFsbG93U2VsZWN0ZWRNb3VzZVVwICYmIHNlbGVjdGVkO1xuICAgICAgY29uc3QgZGlzYWxsb3dVbnNlbGVjdGVkTW91c2VVcCA9ICFzZWxlY3Rpb25SZWYuY3VycmVudC5hbGxvd1Vuc2VsZWN0ZWRNb3VzZVVwICYmICFzZWxlY3RlZDtcbiAgICAgIGlmIChkaXNhbGxvd1NlbGVjdGVkTW91c2VVcCB8fCBkaXNhbGxvd1Vuc2VsZWN0ZWRNb3VzZVVwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFsbG93TW91c2VTZWxlY3Rpb25SZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBpdGVtUmVmLmN1cnJlbnQ/LmNsaWNrKCk7XG4gICAgICBhbGxvd01vdXNlU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogW2J1dHRvblJlZiwgZm9yd2FyZGVkUmVmLCBsaXN0SXRlbS5yZWYsIGl0ZW1SZWZdLFxuICAgIHN0YXRlLFxuICAgIHByb3BzOiBbaXRlbVByb3BzLCBkZWZhdWx0UHJvcHMsIGVsZW1lbnRQcm9wcywgZ2V0QnV0dG9uUHJvcHNdXG4gIH0pO1xuICBjb25zdCBjb250ZXh0VmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgc2VsZWN0ZWQsXG4gICAgaW5kZXgsXG4gICAgdGV4dFJlZixcbiAgICBzZWxlY3RlZEJ5Rm9jdXMsXG4gICAgaGFzUmVnaXN0ZXJlZFxuICB9KSwgW3NlbGVjdGVkLCBpbmRleCwgdGV4dFJlZiwgc2VsZWN0ZWRCeUZvY3VzLCBoYXNSZWdpc3RlcmVkXSk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChTZWxlY3RJdGVtQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBjb250ZXh0VmFsdWUsXG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSk7XG59KSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RJdGVtLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RJdGVtXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RJdGVtQ29udGV4dCB9IGZyb20gXCIuLi9pdGVtL1NlbGVjdEl0ZW1Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VUcmFuc2l0aW9uU3RhdHVzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VUcmFuc2l0aW9uU3RhdHVzLmpzXCI7XG5pbXBvcnQgeyB1c2VPcGVuQ2hhbmdlQ29tcGxldGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdHJhbnNpdGlvblN0YXR1c01hcHBpbmcgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgc2VsZWN0IGl0ZW0gaXMgc2VsZWN0ZWQuXG4gKiBSZW5kZXJzIGEgYDxzcGFuPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgU2VsZWN0SXRlbUluZGljYXRvciA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFNlbGVjdEl0ZW1JbmRpY2F0b3IoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCBrZWVwTW91bnRlZCA9IGNvbXBvbmVudFByb3BzLmtlZXBNb3VudGVkID8/IGZhbHNlO1xuICBjb25zdCB7XG4gICAgc2VsZWN0ZWRcbiAgfSA9IHVzZVNlbGVjdEl0ZW1Db250ZXh0KCk7XG4gIGNvbnN0IHNob3VsZFJlbmRlciA9IGtlZXBNb3VudGVkIHx8IHNlbGVjdGVkO1xuICBpZiAoIXNob3VsZFJlbmRlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goSW5uZXIsIHtcbiAgICAuLi5jb21wb25lbnRQcm9wcyxcbiAgICByZWY6IGZvcndhcmRlZFJlZlxuICB9KTtcbn0pO1xuXG4vLyBTcGxpdCB0aGUgY29yZSBpbXBsZW1lbnRhdGlvbiB0byBhdm9pZCBwYXlpbmcgdGhlIGhvb2sgY29zdHMgdW5sZXNzIHRoZSBlbGVtZW50IG5lZWRzIHRvIG1vdW50LlxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0SXRlbUluZGljYXRvci5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0SXRlbUluZGljYXRvclwiO1xuY29uc3QgSW5uZXIgPSAvKiNfX1BVUkVfXyovUmVhY3QubWVtbygvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZigoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikgPT4ge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBrZWVwTW91bnRlZCxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgc2VsZWN0ZWRcbiAgfSA9IHVzZVNlbGVjdEl0ZW1Db250ZXh0KCk7XG4gIGNvbnN0IGluZGljYXRvclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qge1xuICAgIHRyYW5zaXRpb25TdGF0dXMsXG4gICAgc2V0TW91bnRlZFxuICB9ID0gdXNlVHJhbnNpdGlvblN0YXR1cyhzZWxlY3RlZCk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIHNlbGVjdGVkLFxuICAgIHRyYW5zaXRpb25TdGF0dXNcbiAgfTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ3NwYW4nLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgaW5kaWNhdG9yUmVmXSxcbiAgICBzdGF0ZSxcbiAgICBwcm9wczogW3tcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICBjaGlsZHJlbjogJ+KclO+4jydcbiAgICB9LCBlbGVtZW50UHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nXG4gIH0pO1xuICB1c2VPcGVuQ2hhbmdlQ29tcGxldGUoe1xuICAgIG9wZW46IHNlbGVjdGVkLFxuICAgIHJlZjogaW5kaWNhdG9yUmVmLFxuICAgIG9uQ29tcGxldGUoKSB7XG4gICAgICBpZiAoIXNlbGVjdGVkKSB7XG4gICAgICAgIHNldE1vdW50ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBlbGVtZW50O1xufSkpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgSW5uZXIuZGlzcGxheU5hbWUgPSBcIklubmVyXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L1NlbGVjdFJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VTZWxlY3RJdGVtQ29udGV4dCB9IGZyb20gXCIuLi9pdGVtL1NlbGVjdEl0ZW1Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5cbi8qKlxuICogQSB0ZXh0IGxhYmVsIG9mIHRoZSBzZWxlY3QgaXRlbS5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0SXRlbVRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QubWVtbygvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RJdGVtVGV4dChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICBpbmRleCxcbiAgICB0ZXh0UmVmLFxuICAgIHNlbGVjdGVkQnlGb2N1cyxcbiAgICBoYXNSZWdpc3RlcmVkXG4gIH0gPSB1c2VTZWxlY3RJdGVtQ29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgZmlyc3RJdGVtVGV4dFJlZixcbiAgICBzZWxlY3RlZEl0ZW1UZXh0UmVmXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCBsb2NhbFJlZiA9IFJlYWN0LnVzZUNhbGxiYWNrKG5vZGUgPT4ge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaGFzUmVnaXN0ZXJlZCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgZmlyc3RJdGVtVGV4dFJlZi5jdXJyZW50ID0gbm9kZTtcbiAgICB9XG4gICAgaWYgKGhhc1JlZ2lzdGVyZWQgJiYgc2VsZWN0ZWRCeUZvY3VzKSB7XG4gICAgICBzZWxlY3RlZEl0ZW1UZXh0UmVmLmN1cnJlbnQgPSBub2RlO1xuICAgIH1cbiAgfSwgW2ZpcnN0SXRlbVRleHRSZWYsIHNlbGVjdGVkSXRlbVRleHRSZWYsIGluZGV4LCBzZWxlY3RlZEJ5Rm9jdXMsIGhhc1JlZ2lzdGVyZWRdKTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBbbG9jYWxSZWYsIGZvcndhcmRlZFJlZiwgdGV4dFJlZl0sXG4gICAgcHJvcHM6IGVsZW1lbnRQcm9wc1xuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RJdGVtVGV4dC5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0SXRlbVRleHRcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgdXNlU2VsZWN0UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi4vcG9zaXRpb25lci9TZWxlY3RQb3NpdGlvbmVyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlU2VsZWN0Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9TZWxlY3RSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgYXMgYmFzZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIC4uLmJhc2VNYXBwaW5nLFxuICAuLi50cmFuc2l0aW9uU3RhdHVzTWFwcGluZ1xufTtcblxuLyoqXG4gKiBEaXNwbGF5cyBhbiBlbGVtZW50IHBvc2l0aW9uZWQgYWdhaW5zdCB0aGUgc2VsZWN0IHBvcHVwIGFuY2hvci5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgU2VsZWN0XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvc2VsZWN0KVxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0QXJyb3cgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RBcnJvdyhjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlU2VsZWN0Um9vdENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIHNpZGUsXG4gICAgYWxpZ24sXG4gICAgYXJyb3dSZWYsXG4gICAgYXJyb3dTdHlsZXMsXG4gICAgYXJyb3dVbmNlbnRlcmVkLFxuICAgIGFsaWduSXRlbVdpdGhUcmlnZ2VyQWN0aXZlXG4gIH0gPSB1c2VTZWxlY3RQb3NpdGlvbmVyQ29udGV4dCgpO1xuICBjb25zdCBvcGVuID0gdXNlU3RvcmUoc3RvcmUsIHNlbGVjdG9ycy5vcGVuLCB0cnVlKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICBzaWRlLFxuICAgIGFsaWduLFxuICAgIHVuY2VudGVyZWQ6IGFycm93VW5jZW50ZXJlZFxuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IFthcnJvd1JlZiwgZm9yd2FyZGVkUmVmXSxcbiAgICBwcm9wczogW3tcbiAgICAgIHN0eWxlOiBhcnJvd1N0eWxlcyxcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWVcbiAgICB9LCBlbGVtZW50UHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmdcbiAgfSk7XG4gIGlmIChhbGlnbkl0ZW1XaXRoVHJpZ2dlckFjdGl2ZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RBcnJvdy5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0QXJyb3dcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IHVzZVN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZVNlbGVjdFJvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvU2VsZWN0Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVNlbGVjdFBvc2l0aW9uZXJDb250ZXh0IH0gZnJvbSBcIi4uL3Bvc2l0aW9uZXIvU2VsZWN0UG9zaXRpb25lckNvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVRyYW5zaXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVRyYW5zaXRpb25TdGF0dXMuanNcIjtcbmltcG9ydCB7IHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlT3BlbkNoYW5nZUNvbXBsZXRlLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBnZXRNYXhTY3JvbGxPZmZzZXQsIG5vcm1hbGl6ZVNjcm9sbE9mZnNldCwgU0NST0xMX0VER0VfVE9MRVJBTkNFX1BYIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3Njcm9sbEVkZ2VzLmpzXCI7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tIFwiLi4vc3RvcmUuanNcIjtcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdFNjcm9sbEFycm93ID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gU2VsZWN0U2Nyb2xsQXJyb3coY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBkaXJlY3Rpb24sXG4gICAga2VlcE1vdW50ZWQgPSBmYWxzZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCBpc1VwID0gZGlyZWN0aW9uID09PSAndXAnO1xuICBjb25zdCB7XG4gICAgc3RvcmUsXG4gICAgcG9wdXBSZWYsXG4gICAgbGlzdFJlZixcbiAgICBoYW5kbGVTY3JvbGxBcnJvd1Zpc2liaWxpdHksXG4gICAgc2Nyb2xsQXJyb3dzTW91bnRlZENvdW50UmVmXG4gIH0gPSB1c2VTZWxlY3RSb290Q29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgc2lkZSxcbiAgICBzY3JvbGxEb3duQXJyb3dSZWYsXG4gICAgc2Nyb2xsVXBBcnJvd1JlZlxuICB9ID0gdXNlU2VsZWN0UG9zaXRpb25lckNvbnRleHQoKTtcbiAgY29uc3QgdmlzaWJsZVNlbGVjdG9yID0gaXNVcCA/IHNlbGVjdG9ycy5zY3JvbGxVcEFycm93VmlzaWJsZSA6IHNlbGVjdG9ycy5zY3JvbGxEb3duQXJyb3dWaXNpYmxlO1xuICBjb25zdCBzdGF0ZVZpc2libGUgPSB1c2VTdG9yZShzdG9yZSwgdmlzaWJsZVNlbGVjdG9yKTtcbiAgY29uc3Qgb3Blbk1ldGhvZCA9IHVzZVN0b3JlKHN0b3JlLCBzZWxlY3RvcnMub3Blbk1ldGhvZCk7XG5cbiAgLy8gU2Nyb2xsIGFycm93cyBhcmUgZGlzYWJsZWQgZm9yIHRvdWNoIG1vZGFsaXR5IGFzIHRoZXkgYXJlIGEgaG92ZXItb25seSBlbGVtZW50LlxuICBjb25zdCB2aXNpYmxlID0gc3RhdGVWaXNpYmxlICYmIG9wZW5NZXRob2QgIT09ICd0b3VjaCc7XG4gIGNvbnN0IHRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIGNvbnN0IHNjcm9sbEFycm93UmVmID0gaXNVcCA/IHNjcm9sbFVwQXJyb3dSZWYgOiBzY3JvbGxEb3duQXJyb3dSZWY7XG4gIGNvbnN0IHtcbiAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgIHNldE1vdW50ZWRcbiAgfSA9IHVzZVRyYW5zaXRpb25TdGF0dXModmlzaWJsZSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgc2Nyb2xsQXJyb3dzTW91bnRlZENvdW50UmVmLmN1cnJlbnQgKz0gMTtcbiAgICBpZiAoIXN0b3JlLnN0YXRlLmhhc1Njcm9sbEFycm93cykge1xuICAgICAgc3RvcmUuc2V0KCdoYXNTY3JvbGxBcnJvd3MnLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHNjcm9sbEFycm93c01vdW50ZWRDb3VudFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoMCwgc2Nyb2xsQXJyb3dzTW91bnRlZENvdW50UmVmLmN1cnJlbnQgLSAxKTtcbiAgICAgIGlmIChzY3JvbGxBcnJvd3NNb3VudGVkQ291bnRSZWYuY3VycmVudCA9PT0gMCAmJiBzdG9yZS5zdGF0ZS5oYXNTY3JvbGxBcnJvd3MpIHtcbiAgICAgICAgc3RvcmUuc2V0KCdoYXNTY3JvbGxBcnJvd3MnLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW3N0b3JlLCBzY3JvbGxBcnJvd3NNb3VudGVkQ291bnRSZWZdKTtcbiAgdXNlT3BlbkNoYW5nZUNvbXBsZXRlKHtcbiAgICBvcGVuOiB2aXNpYmxlLFxuICAgIHJlZjogc2Nyb2xsQXJyb3dSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICBzZXRNb3VudGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBkaXJlY3Rpb24sXG4gICAgdmlzaWJsZSxcbiAgICBzaWRlLFxuICAgIHRyYW5zaXRpb25TdGF0dXNcbiAgfTtcbiAgY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgY2hpbGRyZW46IGlzVXAgPyAn4payJyA6ICfilrwnLFxuICAgIHN0eWxlOiB7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgIH0sXG4gICAgb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5tb3ZlbWVudFggPT09IDAgJiYgZXZlbnQubW92ZW1lbnRZID09PSAwIHx8IHRpbWVvdXQuaXNTdGFydGVkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIG51bGwpO1xuICAgICAgZnVuY3Rpb24gc2Nyb2xsTmV4dEl0ZW0oKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbGVyID0gc3RvcmUuc3RhdGUubGlzdEVsZW1lbnQgPz8gcG9wdXBSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKCFzY3JvbGxlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdG9yZS5zZXQoJ2FjdGl2ZUluZGV4JywgbnVsbCk7XG4gICAgICAgIGhhbmRsZVNjcm9sbEFycm93VmlzaWJpbGl0eSgpO1xuICAgICAgICBjb25zdCBtYXhTY3JvbGxUb3AgPSBnZXRNYXhTY3JvbGxPZmZzZXQoc2Nyb2xsZXIuc2Nyb2xsSGVpZ2h0LCBzY3JvbGxlci5jbGllbnRIZWlnaHQpO1xuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSBub3JtYWxpemVTY3JvbGxPZmZzZXQoc2Nyb2xsZXIuc2Nyb2xsVG9wLCBtYXhTY3JvbGxUb3ApO1xuICAgICAgICBjb25zdCBpc1Njcm9sbGVkVG9FZGdlID0gc2Nyb2xsVG9wID09PSAoaXNVcCA/IDAgOiBtYXhTY3JvbGxUb3ApO1xuICAgICAgICBjb25zdCBpdGVtcyA9IGxpc3RSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKHNjcm9sbFRvcCAhPT0gc2Nyb2xsZXIuc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgc2Nyb2xsZXIuc2Nyb2xsVG9wID0gc2Nyb2xsVG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmFsbGJhY2sgd2hlbiB0aGVyZSBhcmUgbm8gaXRlbXMgcmVnaXN0ZXJlZCB5ZXQuXG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdG9yZS5zZXQoaXNVcCA/ICdzY3JvbGxVcEFycm93VmlzaWJsZScgOiAnc2Nyb2xsRG93bkFycm93VmlzaWJsZScsICFpc1Njcm9sbGVkVG9FZGdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTY3JvbGxlZFRvRWRnZSkge1xuICAgICAgICAgIHRpbWVvdXQuY2xlYXIoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBzY3JvbGxBcnJvd0hlaWdodCA9IHNjcm9sbEFycm93UmVmLmN1cnJlbnQ/Lm9mZnNldEhlaWdodCB8fCAwO1xuICAgICAgICAgIHNjcm9sbGVyLnNjcm9sbFRvcCA9IGdldFRhcmdldFNjcm9sbFRvcChpdGVtcywgaXNVcCwgc2Nyb2xsVG9wLCBzY3JvbGxlci5jbGllbnRIZWlnaHQsIHNjcm9sbEFycm93SGVpZ2h0LCBtYXhTY3JvbGxUb3ApO1xuICAgICAgICB9XG4gICAgICAgIHRpbWVvdXQuc3RhcnQoNDAsIHNjcm9sbE5leHRJdGVtKTtcbiAgICAgIH1cbiAgICAgIHRpbWVvdXQuc3RhcnQoNDAsIHNjcm9sbE5leHRJdGVtKTtcbiAgICB9LFxuICAgIG9uTW91c2VMZWF2ZSgpIHtcbiAgICAgIHRpbWVvdXQuY2xlYXIoKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgc2Nyb2xsQXJyb3dSZWZdLFxuICAgIHN0YXRlLFxuICAgIHByb3BzOiBbZGVmYXVsdFByb3BzLCBlbGVtZW50UHJvcHNdXG4gIH0pO1xuICBjb25zdCBzaG91bGRSZW5kZXIgPSB2aXNpYmxlIHx8IGtlZXBNb3VudGVkO1xuICBpZiAoIXNob3VsZFJlbmRlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RTY3JvbGxBcnJvdy5kaXNwbGF5TmFtZSA9IFwiU2VsZWN0U2Nyb2xsQXJyb3dcIjtcbmZ1bmN0aW9uIGdldFRhcmdldFNjcm9sbFRvcChpdGVtcywgaXNVcCwgc2Nyb2xsVG9wLCBjbGllbnRIZWlnaHQsIHNjcm9sbEFycm93SGVpZ2h0LCBtYXhTY3JvbGxUb3ApIHtcbiAgaWYgKGlzVXApIHtcbiAgICBsZXQgZmlyc3RWaXNpYmxlSW5kZXggPSAwO1xuICAgIGNvbnN0IHZpc2libGVUb3AgPSBzY3JvbGxUb3AgKyBzY3JvbGxBcnJvd0hlaWdodCAtIFNDUk9MTF9FREdFX1RPTEVSQU5DRV9QWDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBpdGVtID0gaXRlbXNbaV07XG4gICAgICBpZiAoaXRlbSAmJiBpdGVtLm9mZnNldFRvcCA+PSB2aXNpYmxlVG9wKSB7XG4gICAgICAgIGZpcnN0VmlzaWJsZUluZGV4ID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gTWF0aC5tYXgoMCwgZmlyc3RWaXNpYmxlSW5kZXggLSAxKTtcbiAgICBjb25zdCB0YXJnZXRJdGVtID0gaXRlbXNbdGFyZ2V0SW5kZXhdO1xuICAgIHJldHVybiB0YXJnZXRJbmRleCA8IGZpcnN0VmlzaWJsZUluZGV4ICYmIHRhcmdldEl0ZW0gPyBub3JtYWxpemVTY3JvbGxPZmZzZXQodGFyZ2V0SXRlbS5vZmZzZXRUb3AgLSBzY3JvbGxBcnJvd0hlaWdodCwgbWF4U2Nyb2xsVG9wKSA6IDA7XG4gIH1cbiAgbGV0IGxhc3RWaXNpYmxlSW5kZXggPSBpdGVtcy5sZW5ndGggLSAxO1xuICBjb25zdCB2aXNpYmxlQm90dG9tID0gc2Nyb2xsVG9wICsgY2xpZW50SGVpZ2h0IC0gc2Nyb2xsQXJyb3dIZWlnaHQgKyBTQ1JPTExfRURHRV9UT0xFUkFOQ0VfUFg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjb25zdCBpdGVtID0gaXRlbXNbaV07XG4gICAgaWYgKGl0ZW0gJiYgaXRlbS5vZmZzZXRUb3AgKyBpdGVtLm9mZnNldEhlaWdodCA+IHZpc2libGVCb3R0b20pIHtcbiAgICAgIGxhc3RWaXNpYmxlSW5kZXggPSBNYXRoLm1heCgwLCBpIC0gMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgY29uc3QgdGFyZ2V0SW5kZXggPSBNYXRoLm1pbihpdGVtcy5sZW5ndGggLSAxLCBsYXN0VmlzaWJsZUluZGV4ICsgMSk7XG4gIGNvbnN0IHRhcmdldEl0ZW0gPSBpdGVtc1t0YXJnZXRJbmRleF07XG4gIHJldHVybiB0YXJnZXRJbmRleCA+IGxhc3RWaXNpYmxlSW5kZXggJiYgdGFyZ2V0SXRlbSA/IG5vcm1hbGl6ZVNjcm9sbE9mZnNldCh0YXJnZXRJdGVtLm9mZnNldFRvcCArIHRhcmdldEl0ZW0ub2Zmc2V0SGVpZ2h0IC0gY2xpZW50SGVpZ2h0ICsgc2Nyb2xsQXJyb3dIZWlnaHQsIG1heFNjcm9sbFRvcCkgOiBtYXhTY3JvbGxUb3A7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBTZWxlY3RTY3JvbGxBcnJvdyB9IGZyb20gXCIuLi9zY3JvbGwtYXJyb3cvU2VsZWN0U2Nyb2xsQXJyb3cuanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG4vKipcbiAqIEFuIGVsZW1lbnQgdGhhdCBzY3JvbGxzIHRoZSBzZWxlY3QgcG9wdXAgZG93biB3aGVuIGhvdmVyZWQuIERvZXMgbm90IHJlbmRlciB3aGVuIHVzaW5nIHRvdWNoIGlucHV0LlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RTY3JvbGxEb3duQXJyb3cgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RTY3JvbGxEb3duQXJyb3cocHJvcHMsIGZvcndhcmRlZFJlZikge1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goU2VsZWN0U2Nyb2xsQXJyb3csIHtcbiAgICAuLi5wcm9wcyxcbiAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICBkaXJlY3Rpb246IFwiZG93blwiXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBTZWxlY3RTY3JvbGxEb3duQXJyb3cuZGlzcGxheU5hbWUgPSBcIlNlbGVjdFNjcm9sbERvd25BcnJvd1wiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgU2VsZWN0U2Nyb2xsQXJyb3cgfSBmcm9tIFwiLi4vc2Nyb2xsLWFycm93L1NlbGVjdFNjcm9sbEFycm93LmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuLyoqXG4gKiBBbiBlbGVtZW50IHRoYXQgc2Nyb2xscyB0aGUgc2VsZWN0IHBvcHVwIHVwIHdoZW4gaG92ZXJlZC4gRG9lcyBub3QgcmVuZGVyIHdoZW4gdXNpbmcgdG91Y2ggaW5wdXQuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIFNlbGVjdF0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL3NlbGVjdClcbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdFNjcm9sbFVwQXJyb3cgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RTY3JvbGxVcEFycm93KHByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KFNlbGVjdFNjcm9sbEFycm93LCB7XG4gICAgLi4ucHJvcHMsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgZGlyZWN0aW9uOiBcInVwXCJcbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdFNjcm9sbFVwQXJyb3cuZGlzcGxheU5hbWUgPSBcIlNlbGVjdFNjcm9sbFVwQXJyb3dcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBTZWxlY3RHcm91cENvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dCh1bmRlZmluZWQpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgU2VsZWN0R3JvdXBDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJTZWxlY3RHcm91cENvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VTZWxlY3RHcm91cENvbnRleHQoKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KFNlbGVjdEdyb3VwQ29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IFNlbGVjdEdyb3VwQ29udGV4dCBpcyBtaXNzaW5nLiBTZWxlY3RHcm91cCBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPFNlbGVjdC5Hcm91cD4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoNTYpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFNlbGVjdEdyb3VwQ29udGV4dCB9IGZyb20gXCIuL1NlbGVjdEdyb3VwQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuXG4vKipcbiAqIEdyb3VwcyByZWxhdGVkIHNlbGVjdCBpdGVtcyB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIGxhYmVsLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgU2VsZWN0R3JvdXAgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBTZWxlY3RHcm91cChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IFtsYWJlbElkLCBzZXRMYWJlbElkXSA9IFJlYWN0LnVzZVN0YXRlKCk7XG4gIGNvbnN0IGNvbnRleHRWYWx1ZSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICBsYWJlbElkLFxuICAgIHNldExhYmVsSWRcbiAgfSksIFtsYWJlbElkLCBzZXRMYWJlbElkXSk7XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogZm9yd2FyZGVkUmVmLFxuICAgIHByb3BzOiBbe1xuICAgICAgcm9sZTogJ2dyb3VwJyxcbiAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsYWJlbElkXG4gICAgfSwgZWxlbWVudFByb3BzXVxuICB9KTtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KFNlbGVjdEdyb3VwQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBjb250ZXh0VmFsdWUsXG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdEdyb3VwLmRpc3BsYXlOYW1lID0gXCJTZWxlY3RHcm91cFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZUJhc2VVaUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VCYXNlVWlJZC5qc1wiO1xuaW1wb3J0IHsgdXNlU2VsZWN0R3JvdXBDb250ZXh0IH0gZnJvbSBcIi4uL2dyb3VwL1NlbGVjdEdyb3VwQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuXG4vKipcbiAqIEFuIGFjY2Vzc2libGUgbGFiZWwgdGhhdCBpcyBhdXRvbWF0aWNhbGx5IGFzc29jaWF0ZWQgd2l0aCBpdHMgcGFyZW50IGdyb3VwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBTZWxlY3RdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9zZWxlY3QpXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RHcm91cExhYmVsID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gU2VsZWN0R3JvdXBMYWJlbChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGlkOiBpZFByb3AsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHNldExhYmVsSWRcbiAgfSA9IHVzZVNlbGVjdEdyb3VwQ29udGV4dCgpO1xuICBjb25zdCBpZCA9IHVzZUJhc2VVaUlkKGlkUHJvcCk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgc2V0TGFiZWxJZChpZCk7XG4gIH0sIFtpZCwgc2V0TGFiZWxJZF0pO1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICBwcm9wczogW3tcbiAgICAgIGlkXG4gICAgfSwgZWxlbWVudFByb3BzXVxuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIFNlbGVjdEdyb3VwTGFiZWwuZGlzcGxheU5hbWUgPSBcIlNlbGVjdEdyb3VwTGFiZWxcIjsiLCJleHBvcnQgeyBTZWxlY3RSb290IGFzIFJvb3QgfSBmcm9tIFwiLi9yb290L1NlbGVjdFJvb3QuanNcIjtcbmV4cG9ydCB7IFNlbGVjdExhYmVsIGFzIExhYmVsIH0gZnJvbSBcIi4vbGFiZWwvU2VsZWN0TGFiZWwuanNcIjtcbmV4cG9ydCB7IFNlbGVjdFRyaWdnZXIgYXMgVHJpZ2dlciB9IGZyb20gXCIuL3RyaWdnZXIvU2VsZWN0VHJpZ2dlci5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0VmFsdWUgYXMgVmFsdWUgfSBmcm9tIFwiLi92YWx1ZS9TZWxlY3RWYWx1ZS5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0SWNvbiBhcyBJY29uIH0gZnJvbSBcIi4vaWNvbi9TZWxlY3RJY29uLmpzXCI7XG5leHBvcnQgeyBTZWxlY3RQb3J0YWwgYXMgUG9ydGFsIH0gZnJvbSBcIi4vcG9ydGFsL1NlbGVjdFBvcnRhbC5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0QmFja2Ryb3AgYXMgQmFja2Ryb3AgfSBmcm9tIFwiLi9iYWNrZHJvcC9TZWxlY3RCYWNrZHJvcC5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0UG9zaXRpb25lciBhcyBQb3NpdGlvbmVyIH0gZnJvbSBcIi4vcG9zaXRpb25lci9TZWxlY3RQb3NpdGlvbmVyLmpzXCI7XG5leHBvcnQgeyBTZWxlY3RQb3B1cCBhcyBQb3B1cCB9IGZyb20gXCIuL3BvcHVwL1NlbGVjdFBvcHVwLmpzXCI7XG5leHBvcnQgeyBTZWxlY3RMaXN0IGFzIExpc3QgfSBmcm9tIFwiLi9saXN0L1NlbGVjdExpc3QuanNcIjtcbmV4cG9ydCB7IFNlbGVjdEl0ZW0gYXMgSXRlbSB9IGZyb20gXCIuL2l0ZW0vU2VsZWN0SXRlbS5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0SXRlbUluZGljYXRvciBhcyBJdGVtSW5kaWNhdG9yIH0gZnJvbSBcIi4vaXRlbS1pbmRpY2F0b3IvU2VsZWN0SXRlbUluZGljYXRvci5qc1wiO1xuZXhwb3J0IHsgU2VsZWN0SXRlbVRleHQgYXMgSXRlbVRleHQgfSBmcm9tIFwiLi9pdGVtLXRleHQvU2VsZWN0SXRlbVRleHQuanNcIjtcbmV4cG9ydCB7IFNlbGVjdEFycm93IGFzIEFycm93IH0gZnJvbSBcIi4vYXJyb3cvU2VsZWN0QXJyb3cuanNcIjtcbmV4cG9ydCB7IFNlbGVjdFNjcm9sbERvd25BcnJvdyBhcyBTY3JvbGxEb3duQXJyb3cgfSBmcm9tIFwiLi9zY3JvbGwtZG93bi1hcnJvdy9TZWxlY3RTY3JvbGxEb3duQXJyb3cuanNcIjtcbmV4cG9ydCB7IFNlbGVjdFNjcm9sbFVwQXJyb3cgYXMgU2Nyb2xsVXBBcnJvdyB9IGZyb20gXCIuL3Njcm9sbC11cC1hcnJvdy9TZWxlY3RTY3JvbGxVcEFycm93LmpzXCI7XG5leHBvcnQgeyBTZWxlY3RHcm91cCBhcyBHcm91cCB9IGZyb20gXCIuL2dyb3VwL1NlbGVjdEdyb3VwLmpzXCI7XG5leHBvcnQgeyBTZWxlY3RHcm91cExhYmVsIGFzIEdyb3VwTGFiZWwgfSBmcm9tIFwiLi9ncm91cC1sYWJlbC9TZWxlY3RHcm91cExhYmVsLmpzXCI7XG5leHBvcnQgeyBTZXBhcmF0b3IgfSBmcm9tIFwiLi4vc2VwYXJhdG9yL1NlcGFyYXRvci5qc1wiOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLFNBQWdCLHFCQUFxQixRQUFRLFlBQVk7Q0FDdkQsTUFBTSxLQUFLLFlBQVksTUFBTTtDQUM3Qix5QkFBeUI7RUFDdkIsV0FBVyxFQUFFO0VBQ2IsYUFBYTtHQUNYLFdBQVcsS0FBQSxDQUFTO0VBQ3RCO0NBQ0Ys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QUFDLFNBQVMsY0FBQSxhQUFvQixTQUFTO0NBQzdDLE1BQU0sZUFBQSxhQUFxQixlQUFlO0VBQ3hDO0VBQ0E7Q0FDRixJQUFJLENBQUMsU0FBUyxVQUFVLENBQUM7Q0FDekIsTUFBTSxVQUFVLGlCQUFpQixPQUFPLGdCQUFnQjtFQUN0RCxLQUFLO0VBQ0wsT0FBTyxDQUFDO0dBQ04sTUFBTTtHQUNOLG1CQUFtQjtFQUNyQixHQUFHLFlBQVk7Q0FDakIsQ0FBQztDQUNELE9BQW9CLGVBQUEsR0FBQSxtQkFBQSxJQUFBLENBQUssbUJBQW1CLFVBQVU7RUFDcEQsT0FBTztFQUNQLFVBQVU7Q0FDWixDQUFDO0FBQ0gsQ0FBQztBQUMwQyxZQUFZLGNBQWM7Ozs7Ozs7OztBQ3ZCckUsSUFBYSxtQkFBZ0MsMkJBQU0sV0FBVyxTQUFTLGlCQUFpQixnQkFBZ0IsY0FBYztDQUNwSCxNQUFNLEVBQ0osUUFDQSxXQUNBLE9BQ0EsSUFBSSxRQUNKLEdBQUcsaUJBQ0Q7Q0FDSixNQUFNLEVBQ0osZUFDRSxzQkFBc0I7Q0FDMUIsTUFBTSxLQUFLLFlBQVksTUFBTTtDQUM3Qix5QkFBeUI7RUFDdkIsV0FBVyxFQUFFO0NBQ2YsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0NBT25CLE9BTmdCLGlCQUFpQixPQUFPLGdCQUFnQjtFQUN0RCxLQUFLO0VBQ0wsT0FBTyxDQUFDLEVBQ04sR0FDRixHQUFHLFlBQVk7Q0FDakIsQ0FDYTtBQUNmLENBQUM7QUFDMEMsaUJBQWlCLGNBQWMiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNV19