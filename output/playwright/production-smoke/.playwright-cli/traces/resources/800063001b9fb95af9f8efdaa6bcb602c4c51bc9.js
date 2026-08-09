import { i as __toESM, n as __exportAll } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
import { r as EMPTY_OBJECT, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { r as mergeProps } from "/node_modules/.vite/deps/merge-props-CugWwp_i.js?v=1d2f6f90";
import { t as useButton } from "/node_modules/.vite/deps/useButton-ydNp_PBX.js?v=1d2f6f90";
import { _t as transitionStatusMapping, g as useOpenChangeComplete, s as COMPOSITE_KEYS, t as inertValue } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { C as createSelector, E as FloatingFocusManager, N as FloatingPortal, P as CLICK_TRIGGER_IDENTIFIER, T as useClick, a as InternalBackdrop, c as setOpenTriggerState, d as usePopupInteractionProps, f as usePopupRootSync, i as useOnFirstRender, it as popupStateMapping, l as useImplicitActiveTrigger, m as useTriggerDataForwarding, n as useOpenMethodTriggerProps, o as PopupTriggerMap, ot as triggerOpenStateMapping, p as usePopupStore, r as useScrollLock, rt as CommonPopupDataAttributes, s as FOCUSABLE_POPUP_PROPS, u as useOpenStateTransitions, v as ReactStore, w as useDismiss } from "/node_modules/.vite/deps/useOpenInteractionType-CzC_cFBM.js?v=1d2f6f90";
import { a as closePress, l as imperativeAction, r as createChangeEventDetails, t as useBaseUiId } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, r as contains } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { n as createPopupFloatingRootContext, r as popupStoreSelectors, t as createInitialPopupStoreState } from "/node_modules/.vite/deps/store-CyrVVQa_.js?v=1d2f6f90";
//#region node_modules/@base-ui/react/esm/dialog/root/DialogRootContext.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var IsDrawerContext = /*#__PURE__*/ import_react.createContext(false);
IsDrawerContext.displayName = "IsDrawerContext";
var DialogRootContext = /*#__PURE__*/ import_react.createContext(void 0);
DialogRootContext.displayName = "DialogRootContext";
function useDialogRootContext(optional) {
	const dialogRootContext = import_react.useContext(DialogRootContext);
	if (optional === false && dialogRootContext === void 0) throw new Error("Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.");
	return dialogRootContext;
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/backdrop/DialogBackdrop.js
var stateAttributesMapping$2 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* An overlay displayed beneath the popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogBackdrop = /*#__PURE__*/ import_react.forwardRef(function DialogBackdrop(componentProps, forwardedRef) {
	const { render, className, style, forceRender = false, ...elementProps } = componentProps;
	const { store } = useDialogRootContext();
	const open = store.useState("open");
	const nested = store.useState("nested");
	const mounted = store.useState("mounted");
	const state = {
		open,
		transitionStatus: store.useState("transitionStatus")
	};
	return useRenderElement("div", componentProps, {
		state,
		ref: [store.context.backdropRef, forwardedRef],
		stateAttributesMapping: stateAttributesMapping$2,
		props: [{
			role: "presentation",
			hidden: !mounted,
			style: {
				userSelect: "none",
				WebkitUserSelect: "none"
			}
		}, elementProps],
		enabled: forceRender || !nested
	});
});
DialogBackdrop.displayName = "DialogBackdrop";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/close/DialogClose.js
/**
* A button that closes the dialog.
* Renders a `<button>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogClose = /*#__PURE__*/ import_react.forwardRef(function DialogClose(componentProps, forwardedRef) {
	const { render, className, style, disabled = false, nativeButton = true, ...elementProps } = componentProps;
	const { store } = useDialogRootContext();
	const open = store.useState("open");
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const state = { disabled };
	function handleClick(event) {
		if (open) store.setOpen(false, createChangeEventDetails(closePress, event.nativeEvent));
	}
	return useRenderElement("button", componentProps, {
		state,
		ref: [forwardedRef, buttonRef],
		props: [
			{ onClick: handleClick },
			elementProps,
			getButtonProps
		]
	});
});
DialogClose.displayName = "DialogClose";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/description/DialogDescription.js
/**
* A paragraph with additional information about the dialog.
* Renders a `<p>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogDescription = /*#__PURE__*/ import_react.forwardRef(function DialogDescription(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const { store } = useDialogRootContext();
	const id = useBaseUiId(idProp);
	store.useSyncedValueWithCleanup("descriptionElementId", id);
	return useRenderElement("p", componentProps, {
		ref: forwardedRef,
		props: [{ id }, elementProps]
	});
});
DialogDescription.displayName = "DialogDescription";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/popup/DialogPopupCssVars.js
var DialogPopupCssVars = /*#__PURE__*/ function(DialogPopupCssVars) {
	/**
	* Indicates how many dialogs are nested within.
	* @type {number}
	*/
	DialogPopupCssVars["nestedDialogs"] = "--nested-dialogs";
	return DialogPopupCssVars;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/popup/DialogPopupDataAttributes.js
var DialogPopupDataAttributes = function(DialogPopupDataAttributes) {
	/**
	* Present when the dialog is open.
	*/
	DialogPopupDataAttributes[DialogPopupDataAttributes["open"] = CommonPopupDataAttributes.open] = "open";
	/**
	* Present when the dialog is closed.
	*/
	DialogPopupDataAttributes[DialogPopupDataAttributes["closed"] = CommonPopupDataAttributes.closed] = "closed";
	/**
	* Present when the dialog is animating in.
	*/
	DialogPopupDataAttributes[DialogPopupDataAttributes["startingStyle"] = CommonPopupDataAttributes.startingStyle] = "startingStyle";
	/**
	* Present when the dialog is animating out.
	*/
	DialogPopupDataAttributes[DialogPopupDataAttributes["endingStyle"] = CommonPopupDataAttributes.endingStyle] = "endingStyle";
	/**
	* Present when the dialog is nested within another dialog.
	*/
	DialogPopupDataAttributes["nested"] = "data-nested";
	/**
	* Present when the dialog has other open dialogs nested within it.
	*/
	DialogPopupDataAttributes["nestedDialogOpen"] = "data-nested-dialog-open";
	return DialogPopupDataAttributes;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/portal/DialogPortalContext.js
var DialogPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
DialogPortalContext.displayName = "DialogPortalContext";
function useDialogPortalContext() {
	const value = import_react.useContext(DialogPortalContext);
	if (value === void 0) throw new Error("Base UI: <Dialog.Portal> is missing.");
	return value;
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/popup/DialogPopup.js
var import_jsx_runtime = require_jsx_runtime();
var stateAttributesMapping$1 = {
	...popupStateMapping,
	...transitionStatusMapping,
	nestedDialogOpen(value) {
		return value ? { [DialogPopupDataAttributes.nestedDialogOpen]: "" } : null;
	}
};
/**
* A container for the dialog contents.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogPopup = /*#__PURE__*/ import_react.forwardRef(function DialogPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, initialFocus, ...elementProps } = componentProps;
	const { store } = useDialogRootContext();
	const descriptionElementId = store.useState("descriptionElementId");
	const disablePointerDismissal = store.useState("disablePointerDismissal");
	const floatingRootContext = store.useState("floatingRootContext");
	const rootPopupProps = store.useState("popupProps");
	const modal = store.useState("modal");
	const mounted = store.useState("mounted");
	const nested = store.useState("nested");
	const nestedOpenDialogCount = store.useState("nestedOpenDialogCount");
	const open = store.useState("open");
	const openMethod = store.useState("openMethod");
	const titleElementId = store.useState("titleElementId");
	const transitionStatus = store.useState("transitionStatus");
	const role = store.useState("role");
	const floatingId = floatingRootContext.useState("floatingId");
	const popupId = elementProps.id ?? floatingId;
	useDialogPortalContext();
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	function defaultInitialFocus(interactionType) {
		if (interactionType === "touch") return store.context.popupRef.current;
		return true;
	}
	const resolvedInitialFocus = initialFocus === void 0 ? defaultInitialFocus : initialFocus;
	const nestedDialogOpen = nestedOpenDialogCount > 0;
	const setPopupElement = store.useStateSetter("popupElement");
	const element = useRenderElement("div", componentProps, {
		state: {
			open,
			nested,
			transitionStatus,
			nestedDialogOpen
		},
		props: [
			rootPopupProps,
			{
				id: popupId,
				"aria-labelledby": titleElementId ?? void 0,
				"aria-describedby": descriptionElementId ?? void 0,
				role,
				...FOCUSABLE_POPUP_PROPS,
				hidden: !mounted,
				onKeyDown(event) {
					if (COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
				},
				style: { [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount }
			},
			elementProps
		],
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		stateAttributesMapping: stateAttributesMapping$1
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingRootContext,
		openInteractionType: openMethod,
		disabled: !mounted,
		closeOnFocusOut: !disablePointerDismissal,
		initialFocus: resolvedInitialFocus,
		returnFocus: finalFocus,
		modal: modal !== false,
		restoreFocus: "popup",
		children: element
	});
});
DialogPopup.displayName = "DialogPopup";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/portal/DialogPortal.js
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogPortal = /*#__PURE__*/ import_react.forwardRef(function DialogPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	const { store } = useDialogRootContext();
	const mounted = store.useState("mounted");
	const modal = store.useState("modal");
	const open = store.useState("open");
	if (!(mounted || keepMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(DialogPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps,
			children: [mounted && modal === true && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
				ref: store.context.internalBackdropRef,
				inert: inertValue(!open)
			}), props.children]
		})
	});
});
DialogPortal.displayName = "DialogPortal";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/root/useDialogRoot.js
function useDialogRoot(params) {
	const { store, parentContext, actionsRef, isDrawer } = params;
	const open = store.useState("open");
	usePopupRootSync(store, open);
	useImplicitActiveTrigger(store);
	const { forceUnmount } = useOpenStateTransitions(open, store);
	const handleImperativeClose = import_react.useCallback(() => {
		store.setOpen(false, createChangeEventDetails(imperativeAction));
	}, [store]);
	import_react.useImperativeHandle(actionsRef, () => ({
		unmount: forceUnmount,
		close: handleImperativeClose
	}), [forceUnmount, handleImperativeClose]);
	return {
		parentContext,
		isDrawer
	};
}
function DialogInteractions({ store, dialogRoot }) {
	const { parentContext, isDrawer } = dialogRoot;
	const open = store.useState("open");
	const disablePointerDismissal = store.useState("disablePointerDismissal");
	const modal = store.useState("modal");
	const popupElement = store.useState("popupElement");
	const floatingRootContext = store.useState("floatingRootContext");
	const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = import_react.useState(0);
	const [ownNestedOpenDrawers, setOwnNestedOpenDrawers] = import_react.useState(0);
	const isTopmost = ownNestedOpenDialogs === 0;
	const dismiss = useDismiss(floatingRootContext, {
		outsidePressEvent() {
			if (store.context.internalBackdropRef.current || store.context.backdropRef.current) return "intentional";
			return {
				mouse: modal === "trap-focus" ? "sloppy" : "intentional",
				touch: "sloppy"
			};
		},
		outsidePress(event) {
			if (!store.context.outsidePressEnabledRef.current) return false;
			if ("button" in event && event.button !== 0) return false;
			if ("touches" in event && event.touches.length !== 1) return false;
			const target = getTarget(event);
			if (isTopmost && !disablePointerDismissal) {
				const eventTarget = target;
				if (modal) return store.context.internalBackdropRef.current || store.context.backdropRef.current ? store.context.internalBackdropRef.current === eventTarget || store.context.backdropRef.current === eventTarget || contains(eventTarget, popupElement) && !eventTarget?.hasAttribute("data-base-ui-portal") : true;
				return true;
			}
			return false;
		},
		escapeKey: isTopmost
	});
	useScrollLock(open && modal === true, popupElement);
	store.useContextCallback("onNestedDialogOpen", (dialogCount, drawerCount) => {
		setOwnNestedOpenDialogs(dialogCount);
		setOwnNestedOpenDrawers(drawerCount);
	});
	store.useContextCallback("onNestedDialogClose", () => {
		setOwnNestedOpenDialogs(0);
		setOwnNestedOpenDrawers(0);
	});
	import_react.useEffect(() => {
		if (parentContext?.onNestedDialogOpen && open) parentContext.onNestedDialogOpen(ownNestedOpenDialogs + 1, ownNestedOpenDrawers + (isDrawer ? 1 : 0));
		if (parentContext?.onNestedDialogClose && !open) parentContext.onNestedDialogClose();
		return () => {
			if (parentContext?.onNestedDialogClose && open) parentContext.onNestedDialogClose();
		};
	}, [
		isDrawer,
		open,
		ownNestedOpenDialogs,
		ownNestedOpenDrawers,
		parentContext
	]);
	const activeTriggerProps = dismiss.reference ?? EMPTY_OBJECT;
	const inactiveTriggerProps = dismiss.trigger ?? EMPTY_OBJECT;
	const popupProps = import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, dismiss.floating), [dismiss.floating]);
	usePopupInteractionProps(store, {
		activeTriggerProps,
		inactiveTriggerProps,
		popupProps,
		nestedOpenDialogCount: ownNestedOpenDialogs,
		nestedOpenDrawerCount: ownNestedOpenDrawers
	});
	return null;
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/store/DialogStore.js
var selectors = {
	...popupStoreSelectors,
	modal: createSelector((state) => state.modal),
	nested: createSelector((state) => state.nested),
	nestedOpenDialogCount: createSelector((state) => state.nestedOpenDialogCount),
	nestedOpenDrawerCount: createSelector((state) => state.nestedOpenDrawerCount),
	disablePointerDismissal: createSelector((state) => state.disablePointerDismissal),
	openMethod: createSelector((state) => state.openMethod),
	descriptionElementId: createSelector((state) => state.descriptionElementId),
	titleElementId: createSelector((state) => state.titleElementId),
	viewportElement: createSelector((state) => state.viewportElement),
	role: createSelector((state) => state.role)
};
var DialogStore = class DialogStore extends ReactStore {
	constructor(initialState, floatingId, nested = false) {
		const triggerElements = new PopupTriggerMap();
		const state = createInitialState(initialState);
		state.floatingRootContext = createPopupFloatingRootContext(triggerElements, floatingId, nested);
		super(state, {
			popupRef: /*#__PURE__*/ import_react.createRef(),
			backdropRef: /*#__PURE__*/ import_react.createRef(),
			internalBackdropRef: /*#__PURE__*/ import_react.createRef(),
			outsidePressEnabledRef: { current: true },
			triggerElements,
			onOpenChange: void 0,
			onOpenChangeComplete: void 0
		}, selectors);
	}
	setOpen = (nextOpen, eventDetails) => {
		eventDetails.preventUnmountOnClose = () => {
			this.set("preventUnmountingOnClose", true);
		};
		if (!nextOpen && eventDetails.trigger == null && this.state.activeTriggerId != null) eventDetails.trigger = this.state.activeTriggerElement ?? void 0;
		this.context.onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
		const updatedState = { open: nextOpen };
		setOpenTriggerState(updatedState, nextOpen, eventDetails.trigger);
		this.update(updatedState);
	};
	static useStore(externalStore, initialState) {
		return usePopupStore(externalStore, (floatingId, nested) => new DialogStore(initialState, floatingId, nested), true).store;
	}
};
function createInitialState(initialState = {}) {
	return {
		...createInitialPopupStoreState(),
		modal: true,
		disablePointerDismissal: false,
		popupElement: null,
		viewportElement: null,
		descriptionElementId: void 0,
		titleElementId: void 0,
		openMethod: null,
		nested: false,
		nestedOpenDialogCount: 0,
		nestedOpenDrawerCount: 0,
		role: "dialog",
		...initialState
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/root/useRenderDialogRoot.js
function useRenderDialogRoot(props, mode = "dialog") {
	const { children, open: openProp, defaultOpen = false, onOpenChange, onOpenChangeComplete, disablePointerDismissal: disablePointerDismissalProp = false, modal: modalProp = true, actionsRef, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null } = props;
	const isDrawer = mode === "drawer";
	const isAlertDialog = mode === "alert-dialog";
	const modal = isAlertDialog ? true : modalProp;
	const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
	const role = isAlertDialog ? "alertdialog" : "dialog";
	const parentDialogRootContext = useDialogRootContext(true);
	const rootState = {
		modal,
		disablePointerDismissal,
		nested: Boolean(parentDialogRootContext),
		role
	};
	const store = DialogStore.useStore(handle?.store, {
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp,
		...rootState
	});
	useOnFirstRender(() => {
		const nextState = openProp === void 0 && store.state.open === false && defaultOpen === true ? {
			open: true,
			activeTriggerId: defaultTriggerIdProp
		} : null;
		if (isAlertDialog) store.update(nextState ? {
			...rootState,
			...nextState
		} : rootState);
		else if (nextState) store.update(nextState);
	});
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	store.useSyncedValues(rootState);
	store.useContextCallback("onOpenChange", onOpenChange);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const payload = store.useState("payload");
	const dialogRoot = useDialogRoot({
		store,
		actionsRef,
		parentContext: parentDialogRootContext?.store.context,
		isDrawer
	});
	const shouldRenderInteractions = open || mounted;
	const contextValue = import_react.useMemo(() => ({ store }), [store]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(IsDrawerContext.Provider, {
		value: false,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(DialogRootContext.Provider, {
			value: contextValue,
			children: [shouldRenderInteractions && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(DialogInteractions, {
				store,
				dialogRoot
			}), typeof children === "function" ? children({ payload }) : children]
		})
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/root/DialogRoot.js
/**
* Groups all parts of the dialog.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
function DialogRoot(props) {
	return useRenderDialogRoot(props, import_react.useContext(IsDrawerContext) ? "drawer" : "dialog");
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/viewport/DialogViewportDataAttributes.js
var DialogViewportDataAttributes = function(DialogViewportDataAttributes) {
	/**
	* Present when the dialog is open.
	*/
	DialogViewportDataAttributes[DialogViewportDataAttributes["open"] = CommonPopupDataAttributes.open] = "open";
	/**
	* Present when the dialog is closed.
	*/
	DialogViewportDataAttributes[DialogViewportDataAttributes["closed"] = CommonPopupDataAttributes.closed] = "closed";
	/**
	* Present when the dialog is animating in.
	*/
	DialogViewportDataAttributes[DialogViewportDataAttributes["startingStyle"] = CommonPopupDataAttributes.startingStyle] = "startingStyle";
	/**
	* Present when the dialog is animating out.
	*/
	DialogViewportDataAttributes[DialogViewportDataAttributes["endingStyle"] = CommonPopupDataAttributes.endingStyle] = "endingStyle";
	/**
	* Present when the dialog is nested within another dialog.
	*/
	DialogViewportDataAttributes["nested"] = "data-nested";
	/**
	* Present when the dialog has other open dialogs nested within it.
	*/
	DialogViewportDataAttributes["nestedDialogOpen"] = "data-nested-dialog-open";
	return DialogViewportDataAttributes;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/viewport/DialogViewport.js
var stateAttributesMapping = {
	...popupStateMapping,
	...transitionStatusMapping,
	nested(value) {
		return value ? { [DialogViewportDataAttributes.nested]: "" } : null;
	},
	nestedDialogOpen(value) {
		return value ? { [DialogViewportDataAttributes.nestedDialogOpen]: "" } : null;
	}
};
/**
* A positioning container for the dialog popup that can be made scrollable.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogViewport = /*#__PURE__*/ import_react.forwardRef(function DialogViewport(componentProps, forwardedRef) {
	const { render, className, style, children, ...elementProps } = componentProps;
	const keepMounted = useDialogPortalContext();
	const { store } = useDialogRootContext();
	const open = store.useState("open");
	const nested = store.useState("nested");
	const transitionStatus = store.useState("transitionStatus");
	const nestedOpenDialogCount = store.useState("nestedOpenDialogCount");
	const mounted = store.useState("mounted");
	const setViewportElement = store.useStateSetter("viewportElement");
	return useRenderElement("div", componentProps, {
		enabled: keepMounted || mounted,
		state: {
			open,
			nested,
			transitionStatus,
			nestedDialogOpen: nestedOpenDialogCount > 0
		},
		ref: [forwardedRef, setViewportElement],
		stateAttributesMapping,
		props: [{
			role: "presentation",
			hidden: !mounted,
			style: { pointerEvents: !open ? "none" : void 0 },
			children
		}, elementProps]
	});
});
DialogViewport.displayName = "DialogViewport";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/title/DialogTitle.js
/**
* A heading that labels the dialog.
* Renders an `<h2>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogTitle = /*#__PURE__*/ import_react.forwardRef(function DialogTitle(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const { store } = useDialogRootContext();
	const id = useBaseUiId(idProp);
	store.useSyncedValueWithCleanup("titleElementId", id);
	return useRenderElement("h2", componentProps, {
		ref: forwardedRef,
		props: [{ id }, elementProps]
	});
});
DialogTitle.displayName = "DialogTitle";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/trigger/DialogTrigger.js
/**
* A button that opens the dialog.
* Renders a `<button>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogTrigger = /*#__PURE__*/ import_react.forwardRef(function DialogTrigger(componentProps, forwardedRef) {
	const { render, className, style, disabled = false, nativeButton = true, id: idProp, payload, handle, ...elementProps } = componentProps;
	const dialogRootContext = useDialogRootContext(true);
	const store = handle?.store ?? dialogRootContext?.store;
	if (!store) throw new Error("Base UI: <Dialog.Trigger> must be used within <Dialog.Root> or provided with a handle.");
	const thisTriggerId = useBaseUiId(idProp);
	const floatingContext = store.useState("floatingRootContext");
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const triggerElementRef = import_react.useRef(null);
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, { payload });
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const click = useClick(floatingContext, { enabled: floatingContext != null });
	const interactionTypeProps = useOpenMethodTriggerProps(() => store.select("open"), (interactionType) => {
		store.set("openMethod", interactionType);
	});
	const state = {
		disabled,
		open: isOpenedByThisTrigger
	};
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	return useRenderElement("button", componentProps, {
		state,
		ref: [
			buttonRef,
			forwardedRef,
			registerTrigger,
			triggerElementRef
		],
		props: [
			click.reference,
			rootTriggerProps,
			interactionTypeProps,
			{
				[CLICK_TRIGGER_IDENTIFIER]: "",
				id: thisTriggerId,
				"aria-haspopup": "dialog",
				"aria-expanded": isOpenedByThisTrigger,
				"aria-controls": popupId
			},
			elementProps,
			getButtonProps
		],
		stateAttributesMapping: triggerOpenStateMapping
	});
});
DialogTrigger.displayName = "DialogTrigger";
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/store/DialogHandle.js
/**
* A handle to control a Dialog imperatively and to associate detached triggers with it.
*/
var DialogHandle = class {
	/**
	* Internal store holding the dialog state.
	* @internal
	*/
	constructor(store) {
		this.store = store ?? new DialogStore();
	}
	/**
	* Opens the dialog and associates it with the trigger with the given id.
	* The trigger, if provided, must be a matching Trigger component with this handle passed as a prop.
	*
	* This method should only be called in an event handler or an effect (not during rendering).
	*
	* @param triggerId ID of the trigger to associate with the dialog. If null, the dialog will open without a trigger association.
	*/
	open(triggerId) {
		const triggerElement = triggerId ? this.store.context.triggerElements.getById(triggerId) : void 0;
		if (triggerId && !triggerElement) console.warn(`Base UI: DialogHandle.open: No trigger found with id "${triggerId}". The dialog will open, but the trigger will not be associated with the dialog.`);
		this.store.setOpen(true, createChangeEventDetails(imperativeAction, void 0, triggerElement));
	}
	/**
	* Opens the dialog and sets the payload.
	* Does not associate the dialog with any trigger.
	*
	* @param payload Payload to set when opening the dialog.
	*/
	openWithPayload(payload) {
		this.store.set("payload", payload);
		this.store.setOpen(true, createChangeEventDetails(imperativeAction, void 0, void 0));
	}
	/**
	* Closes the dialog.
	*/
	close() {
		this.store.setOpen(false, createChangeEventDetails(imperativeAction, void 0, void 0));
	}
	/**
	* Indicates whether the dialog is currently open.
	*/
	get isOpen() {
		return this.store.select("open");
	}
};
/**
* Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
*/
function createDialogHandle() {
	return new DialogHandle();
}
//#endregion
//#region node_modules/@base-ui/react/esm/dialog/index.parts.js
var index_parts_exports = /* @__PURE__ */ __exportAll({
	Backdrop: () => DialogBackdrop,
	Close: () => DialogClose,
	Description: () => DialogDescription,
	Handle: () => DialogHandle,
	Popup: () => DialogPopup,
	Portal: () => DialogPortal,
	Root: () => DialogRoot,
	Title: () => DialogTitle,
	Trigger: () => DialogTrigger,
	Viewport: () => DialogViewport,
	createHandle: () => createDialogHandle
});
//#endregion
export { index_parts_exports as Dialog };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQGJhc2UtdWlfcmVhY3RfZGlhbG9nLmpzIiwibmFtZXMiOlsic3RhdGVBdHRyaWJ1dGVzTWFwcGluZyIsImJhc2VNYXBwaW5nIiwiUkVBU09OUy5jbG9zZVByZXNzIiwic3RhdGVBdHRyaWJ1dGVzTWFwcGluZyIsImJhc2VNYXBwaW5nIiwiUkVBU09OUy5pbXBlcmF0aXZlQWN0aW9uIiwiYmFzZU1hcHBpbmciLCJSRUFTT05TLmltcGVyYXRpdmVBY3Rpb24iXSwic291cmNlcyI6WyIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3Jvb3QvRGlhbG9nUm9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL2JhY2tkcm9wL0RpYWxvZ0JhY2tkcm9wLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2RpYWxvZy9jbG9zZS9EaWFsb2dDbG9zZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvZGVzY3JpcHRpb24vRGlhbG9nRGVzY3JpcHRpb24uanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3BvcHVwL0RpYWxvZ1BvcHVwQ3NzVmFycy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvcG9wdXAvRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlcy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvcG9ydGFsL0RpYWxvZ1BvcnRhbENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3BvcHVwL0RpYWxvZ1BvcHVwLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2RpYWxvZy9wb3J0YWwvRGlhbG9nUG9ydGFsLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2RpYWxvZy9yb290L3VzZURpYWxvZ1Jvb3QuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3N0b3JlL0RpYWxvZ1N0b3JlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2RpYWxvZy9yb290L3VzZVJlbmRlckRpYWxvZ1Jvb3QuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3Jvb3QvRGlhbG9nUm9vdC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvdmlld3BvcnQvRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlcy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvdmlld3BvcnQvRGlhbG9nVmlld3BvcnQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3RpdGxlL0RpYWxvZ1RpdGxlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2RpYWxvZy90cmlnZ2VyL0RpYWxvZ1RyaWdnZXIuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZGlhbG9nL3N0b3JlL0RpYWxvZ0hhbmRsZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9kaWFsb2cvaW5kZXgucGFydHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgSXNEcmF3ZXJDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQoZmFsc2UpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgSXNEcmF3ZXJDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJJc0RyYXdlckNvbnRleHRcIjtcbmV4cG9ydCBjb25zdCBEaWFsb2dSb290Q29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBEaWFsb2dSb290Q29udGV4dC5kaXNwbGF5TmFtZSA9IFwiRGlhbG9nUm9vdENvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VEaWFsb2dSb290Q29udGV4dChvcHRpb25hbCkge1xuICBjb25zdCBkaWFsb2dSb290Q29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoRGlhbG9nUm9vdENvbnRleHQpO1xuICBpZiAob3B0aW9uYWwgPT09IGZhbHNlICYmIGRpYWxvZ1Jvb3RDb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IERpYWxvZ1Jvb3RDb250ZXh0IGlzIG1pc3NpbmcuIERpYWxvZyBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPERpYWxvZy5Sb290Pi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSgyNykpO1xuICB9XG4gIHJldHVybiBkaWFsb2dSb290Q29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZURpYWxvZ1Jvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvRGlhbG9nUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHBvcHVwU3RhdGVNYXBwaW5nIGFzIGJhc2VNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BvcHVwU3RhdGVNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB0cmFuc2l0aW9uU3RhdHVzTWFwcGluZyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qc1wiO1xuY29uc3Qgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyA9IHtcbiAgLi4uYmFzZU1hcHBpbmcsXG4gIC4uLnRyYW5zaXRpb25TdGF0dXNNYXBwaW5nXG59O1xuXG4vKipcbiAqIEFuIG92ZXJsYXkgZGlzcGxheWVkIGJlbmVhdGggdGhlIHBvcHVwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBEaWFsb2ddKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9kaWFsb2cpXG4gKi9cbmV4cG9ydCBjb25zdCBEaWFsb2dCYWNrZHJvcCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIERpYWxvZ0JhY2tkcm9wKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgZm9yY2VSZW5kZXIgPSBmYWxzZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZURpYWxvZ1Jvb3RDb250ZXh0KCk7XG4gIGNvbnN0IG9wZW4gPSBzdG9yZS51c2VTdGF0ZSgnb3BlbicpO1xuICBjb25zdCBuZXN0ZWQgPSBzdG9yZS51c2VTdGF0ZSgnbmVzdGVkJyk7XG4gIGNvbnN0IG1vdW50ZWQgPSBzdG9yZS51c2VTdGF0ZSgnbW91bnRlZCcpO1xuICBjb25zdCB0cmFuc2l0aW9uU3RhdHVzID0gc3RvcmUudXNlU3RhdGUoJ3RyYW5zaXRpb25TdGF0dXMnKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICB0cmFuc2l0aW9uU3RhdHVzXG4gIH07XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHJlZjogW3N0b3JlLmNvbnRleHQuYmFja2Ryb3BSZWYsIGZvcndhcmRlZFJlZl0sXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyxcbiAgICBwcm9wczogW3tcbiAgICAgIHJvbGU6ICdwcmVzZW50YXRpb24nLFxuICAgICAgaGlkZGVuOiAhbW91bnRlZCxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnXG4gICAgICB9XG4gICAgfSwgZWxlbWVudFByb3BzXSxcbiAgICBlbmFibGVkOiBmb3JjZVJlbmRlciB8fCAhbmVzdGVkXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBEaWFsb2dCYWNrZHJvcC5kaXNwbGF5TmFtZSA9IFwiRGlhbG9nQmFja2Ryb3BcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZURpYWxvZ1Jvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvRGlhbG9nUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcblxuLyoqXG4gKiBBIGJ1dHRvbiB0aGF0IGNsb3NlcyB0aGUgZGlhbG9nLlxuICogUmVuZGVycyBhIGA8YnV0dG9uPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBEaWFsb2ddKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9kaWFsb2cpXG4gKi9cbmV4cG9ydCBjb25zdCBEaWFsb2dDbG9zZSA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIERpYWxvZ0Nsb3NlKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgICBuYXRpdmVCdXR0b24gPSB0cnVlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlRGlhbG9nUm9vdENvbnRleHQoKTtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IHtcbiAgICBnZXRCdXR0b25Qcm9wcyxcbiAgICBidXR0b25SZWZcbiAgfSA9IHVzZUJ1dHRvbih7XG4gICAgZGlzYWJsZWQsXG4gICAgbmF0aXZlOiBuYXRpdmVCdXR0b25cbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGRpc2FibGVkXG4gIH07XG4gIGZ1bmN0aW9uIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLmNsb3NlUHJlc3MsIGV2ZW50Lm5hdGl2ZUV2ZW50KSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdidXR0b24nLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgYnV0dG9uUmVmXSxcbiAgICBwcm9wczogW3tcbiAgICAgIG9uQ2xpY2s6IGhhbmRsZUNsaWNrXG4gICAgfSwgZWxlbWVudFByb3BzLCBnZXRCdXR0b25Qcm9wc11cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIERpYWxvZ0Nsb3NlLmRpc3BsYXlOYW1lID0gXCJEaWFsb2dDbG9zZVwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlRGlhbG9nUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9EaWFsb2dSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG4vKipcbiAqIEEgcGFyYWdyYXBoIHdpdGggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZGlhbG9nLlxuICogUmVuZGVycyBhIGA8cD5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgRGlhbG9nXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvZGlhbG9nKVxuICovXG5leHBvcnQgY29uc3QgRGlhbG9nRGVzY3JpcHRpb24gPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBEaWFsb2dEZXNjcmlwdGlvbihjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGlkOiBpZFByb3AsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VEaWFsb2dSb290Q29udGV4dCgpO1xuICBjb25zdCBpZCA9IHVzZUJhc2VVaUlkKGlkUHJvcCk7XG4gIHN0b3JlLnVzZVN5bmNlZFZhbHVlV2l0aENsZWFudXAoJ2Rlc2NyaXB0aW9uRWxlbWVudElkJywgaWQpO1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCgncCcsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IFt7XG4gICAgICBpZFxuICAgIH0sIGVsZW1lbnRQcm9wc11cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIERpYWxvZ0Rlc2NyaXB0aW9uLmRpc3BsYXlOYW1lID0gXCJEaWFsb2dEZXNjcmlwdGlvblwiOyIsImV4cG9ydCBsZXQgRGlhbG9nUG9wdXBDc3NWYXJzID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChEaWFsb2dQb3B1cENzc1ZhcnMpIHtcbiAgLyoqXG4gICAqIEluZGljYXRlcyBob3cgbWFueSBkaWFsb2dzIGFyZSBuZXN0ZWQgd2l0aGluLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgRGlhbG9nUG9wdXBDc3NWYXJzW1wibmVzdGVkRGlhbG9nc1wiXSA9IFwiLS1uZXN0ZWQtZGlhbG9nc1wiO1xuICByZXR1cm4gRGlhbG9nUG9wdXBDc3NWYXJzO1xufSh7fSk7IiwiaW1wb3J0IHsgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuZXhwb3J0IGxldCBEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKERpYWxvZ1BvcHVwRGF0YUF0dHJpYnV0ZXMpIHtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgZGlhbG9nIGlzIG9wZW4uXG4gICAqL1xuICBEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzW0RpYWxvZ1BvcHVwRGF0YUF0dHJpYnV0ZXNbXCJvcGVuXCJdID0gQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcy5vcGVuXSA9IFwib3BlblwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBkaWFsb2cgaXMgY2xvc2VkLlxuICAgKi9cbiAgRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlc1tEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzW1wiY2xvc2VkXCJdID0gQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcy5jbG9zZWRdID0gXCJjbG9zZWRcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgZGlhbG9nIGlzIGFuaW1hdGluZyBpbi5cbiAgICovXG4gIERpYWxvZ1BvcHVwRGF0YUF0dHJpYnV0ZXNbRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlc1tcInN0YXJ0aW5nU3R5bGVcIl0gPSBDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzLnN0YXJ0aW5nU3R5bGVdID0gXCJzdGFydGluZ1N0eWxlXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIGRpYWxvZyBpcyBhbmltYXRpbmcgb3V0LlxuICAgKi9cbiAgRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlc1tEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzW1wiZW5kaW5nU3R5bGVcIl0gPSBDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzLmVuZGluZ1N0eWxlXSA9IFwiZW5kaW5nU3R5bGVcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgZGlhbG9nIGlzIG5lc3RlZCB3aXRoaW4gYW5vdGhlciBkaWFsb2cuXG4gICAqL1xuICBEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzW1wibmVzdGVkXCJdID0gXCJkYXRhLW5lc3RlZFwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBkaWFsb2cgaGFzIG90aGVyIG9wZW4gZGlhbG9ncyBuZXN0ZWQgd2l0aGluIGl0LlxuICAgKi9cbiAgRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlc1tcIm5lc3RlZERpYWxvZ09wZW5cIl0gPSBcImRhdGEtbmVzdGVkLWRpYWxvZy1vcGVuXCI7XG4gIHJldHVybiBEaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzO1xufSh7fSk7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgRGlhbG9nUG9ydGFsQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBEaWFsb2dQb3J0YWxDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJEaWFsb2dQb3J0YWxDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlRGlhbG9nUG9ydGFsQ29udGV4dCgpIHtcbiAgY29uc3QgdmFsdWUgPSBSZWFjdC51c2VDb250ZXh0KERpYWxvZ1BvcnRhbENvbnRleHQpO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogPERpYWxvZy5Qb3J0YWw+IGlzIG1pc3NpbmcuJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoMjYpKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBGbG9hdGluZ0ZvY3VzTWFuYWdlciB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdXNlRGlhbG9nUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9EaWFsb2dSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgYXMgYmFzZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyBEaWFsb2dQb3B1cENzc1ZhcnMgfSBmcm9tIFwiLi9EaWFsb2dQb3B1cENzc1ZhcnMuanNcIjtcbmltcG9ydCB7IERpYWxvZ1BvcHVwRGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi9EaWFsb2dQb3B1cERhdGFBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQgeyB1c2VEaWFsb2dQb3J0YWxDb250ZXh0IH0gZnJvbSBcIi4uL3BvcnRhbC9EaWFsb2dQb3J0YWxDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VPcGVuQ2hhbmdlQ29tcGxldGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qc1wiO1xuaW1wb3J0IHsgQ09NUE9TSVRFX0tFWVMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9jb21wb3NpdGUuanNcIjtcbmltcG9ydCB7IEZPQ1VTQUJMRV9QT1BVUF9QUk9QUyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cHMvaW5kZXguanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5jb25zdCBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nID0ge1xuICAuLi5iYXNlTWFwcGluZyxcbiAgLi4udHJhbnNpdGlvblN0YXR1c01hcHBpbmcsXG4gIG5lc3RlZERpYWxvZ09wZW4odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPyB7XG4gICAgICBbRGlhbG9nUG9wdXBEYXRhQXR0cmlidXRlcy5uZXN0ZWREaWFsb2dPcGVuXTogJydcbiAgICB9IDogbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBBIGNvbnRhaW5lciBmb3IgdGhlIGRpYWxvZyBjb250ZW50cy5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgRGlhbG9nXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvZGlhbG9nKVxuICovXG5leHBvcnQgY29uc3QgRGlhbG9nUG9wdXAgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBEaWFsb2dQb3B1cChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGZpbmFsRm9jdXMsXG4gICAgaW5pdGlhbEZvY3VzLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlRGlhbG9nUm9vdENvbnRleHQoKTtcbiAgY29uc3QgZGVzY3JpcHRpb25FbGVtZW50SWQgPSBzdG9yZS51c2VTdGF0ZSgnZGVzY3JpcHRpb25FbGVtZW50SWQnKTtcbiAgY29uc3QgZGlzYWJsZVBvaW50ZXJEaXNtaXNzYWwgPSBzdG9yZS51c2VTdGF0ZSgnZGlzYWJsZVBvaW50ZXJEaXNtaXNzYWwnKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IHJvb3RQb3B1cFByb3BzID0gc3RvcmUudXNlU3RhdGUoJ3BvcHVwUHJvcHMnKTtcbiAgY29uc3QgbW9kYWwgPSBzdG9yZS51c2VTdGF0ZSgnbW9kYWwnKTtcbiAgY29uc3QgbW91bnRlZCA9IHN0b3JlLnVzZVN0YXRlKCdtb3VudGVkJyk7XG4gIGNvbnN0IG5lc3RlZCA9IHN0b3JlLnVzZVN0YXRlKCduZXN0ZWQnKTtcbiAgY29uc3QgbmVzdGVkT3BlbkRpYWxvZ0NvdW50ID0gc3RvcmUudXNlU3RhdGUoJ25lc3RlZE9wZW5EaWFsb2dDb3VudCcpO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3Qgb3Blbk1ldGhvZCA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuTWV0aG9kJyk7XG4gIGNvbnN0IHRpdGxlRWxlbWVudElkID0gc3RvcmUudXNlU3RhdGUoJ3RpdGxlRWxlbWVudElkJyk7XG4gIGNvbnN0IHRyYW5zaXRpb25TdGF0dXMgPSBzdG9yZS51c2VTdGF0ZSgndHJhbnNpdGlvblN0YXR1cycpO1xuICBjb25zdCByb2xlID0gc3RvcmUudXNlU3RhdGUoJ3JvbGUnKTtcbiAgY29uc3QgZmxvYXRpbmdJZCA9IGZsb2F0aW5nUm9vdENvbnRleHQudXNlU3RhdGUoJ2Zsb2F0aW5nSWQnKTtcbiAgY29uc3QgcG9wdXBJZCA9IGVsZW1lbnRQcm9wcy5pZCA/PyBmbG9hdGluZ0lkO1xuICB1c2VEaWFsb2dQb3J0YWxDb250ZXh0KCk7XG4gIHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSh7XG4gICAgb3BlbixcbiAgICByZWY6IHN0b3JlLmNvbnRleHQucG9wdXBSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgIHN0b3JlLmNvbnRleHQub25PcGVuQ2hhbmdlQ29tcGxldGU/Lih0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIERlZmF1bHQgaW5pdGlhbCBmb2N1cyBsb2dpYzpcbiAgLy8gSWYgb3BlbmVkIGJ5IHRvdWNoLCBmb2N1cyB0aGUgcG9wdXAgZWxlbWVudCB0byBwcmV2ZW50IHRoZSB2aXJ0dWFsIGtleWJvYXJkIGZyb20gb3BlbmluZ1xuICAvLyAodGhpcyBpcyByZXF1aXJlZCBmb3IgQW5kcm9pZCBzcGVjaWZpY2FsbHkgYXMgaU9TIGhhbmRsZXMgdGhpcyBhdXRvbWF0aWNhbGx5KS5cbiAgZnVuY3Rpb24gZGVmYXVsdEluaXRpYWxGb2N1cyhpbnRlcmFjdGlvblR5cGUpIHtcbiAgICBpZiAoaW50ZXJhY3Rpb25UeXBlID09PSAndG91Y2gnKSB7XG4gICAgICByZXR1cm4gc3RvcmUuY29udGV4dC5wb3B1cFJlZi5jdXJyZW50O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBjb25zdCByZXNvbHZlZEluaXRpYWxGb2N1cyA9IGluaXRpYWxGb2N1cyA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdEluaXRpYWxGb2N1cyA6IGluaXRpYWxGb2N1cztcbiAgY29uc3QgbmVzdGVkRGlhbG9nT3BlbiA9IG5lc3RlZE9wZW5EaWFsb2dDb3VudCA+IDA7XG4gIGNvbnN0IHNldFBvcHVwRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlU2V0dGVyKCdwb3B1cEVsZW1lbnQnKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICBuZXN0ZWQsXG4gICAgdHJhbnNpdGlvblN0YXR1cyxcbiAgICBuZXN0ZWREaWFsb2dPcGVuXG4gIH07XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHByb3BzOiBbcm9vdFBvcHVwUHJvcHMsIHtcbiAgICAgIGlkOiBwb3B1cElkLFxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IHRpdGxlRWxlbWVudElkID8/IHVuZGVmaW5lZCxcbiAgICAgICdhcmlhLWRlc2NyaWJlZGJ5JzogZGVzY3JpcHRpb25FbGVtZW50SWQgPz8gdW5kZWZpbmVkLFxuICAgICAgcm9sZSxcbiAgICAgIC4uLkZPQ1VTQUJMRV9QT1BVUF9QUk9QUyxcbiAgICAgIGhpZGRlbjogIW1vdW50ZWQsXG4gICAgICBvbktleURvd24oZXZlbnQpIHtcbiAgICAgICAgaWYgKENPTVBPU0lURV9LRVlTLmhhcyhldmVudC5rZXkpKSB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzdHlsZToge1xuICAgICAgICBbRGlhbG9nUG9wdXBDc3NWYXJzLm5lc3RlZERpYWxvZ3NdOiBuZXN0ZWRPcGVuRGlhbG9nQ291bnRcbiAgICAgIH1cbiAgICB9LCBlbGVtZW50UHJvcHNdLFxuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgc3RvcmUuY29udGV4dC5wb3B1cFJlZiwgc2V0UG9wdXBFbGVtZW50XSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nXG4gIH0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goRmxvYXRpbmdGb2N1c01hbmFnZXIsIHtcbiAgICBjb250ZXh0OiBmbG9hdGluZ1Jvb3RDb250ZXh0LFxuICAgIG9wZW5JbnRlcmFjdGlvblR5cGU6IG9wZW5NZXRob2QsXG4gICAgZGlzYWJsZWQ6ICFtb3VudGVkLFxuICAgIGNsb3NlT25Gb2N1c091dDogIWRpc2FibGVQb2ludGVyRGlzbWlzc2FsLFxuICAgIGluaXRpYWxGb2N1czogcmVzb2x2ZWRJbml0aWFsRm9jdXMsXG4gICAgcmV0dXJuRm9jdXM6IGZpbmFsRm9jdXMsXG4gICAgbW9kYWw6IG1vZGFsICE9PSBmYWxzZSxcbiAgICByZXN0b3JlRm9jdXM6IFwicG9wdXBcIixcbiAgICBjaGlsZHJlbjogZWxlbWVudFxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgRGlhbG9nUG9wdXAuZGlzcGxheU5hbWUgPSBcIkRpYWxvZ1BvcHVwXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBpbmVydFZhbHVlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvaW5lcnRWYWx1ZSc7XG5pbXBvcnQgeyBGbG9hdGluZ1BvcnRhbCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdXNlRGlhbG9nUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9EaWFsb2dSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgRGlhbG9nUG9ydGFsQ29udGV4dCB9IGZyb20gXCIuL0RpYWxvZ1BvcnRhbENvbnRleHQuanNcIjtcbmltcG9ydCB7IEludGVybmFsQmFja2Ryb3AgfSBmcm9tIFwiLi4vLi4vdXRpbHMvSW50ZXJuYWxCYWNrZHJvcC5qc1wiO1xuXG4vKipcbiAqIEEgcG9ydGFsIGVsZW1lbnQgdGhhdCBtb3ZlcyB0aGUgcG9wdXAgdG8gYSBkaWZmZXJlbnQgcGFydCBvZiB0aGUgRE9NLlxuICogQnkgZGVmYXVsdCwgdGhlIHBvcnRhbCBlbGVtZW50IGlzIGFwcGVuZGVkIHRvIGA8Ym9keT5gLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBEaWFsb2ddKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9kaWFsb2cpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4LCBqc3hzIGFzIF9qc3hzIH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgRGlhbG9nUG9ydGFsID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gRGlhbG9nUG9ydGFsKHByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIGtlZXBNb3VudGVkID0gZmFsc2UsXG4gICAgLi4ucG9ydGFsUHJvcHNcbiAgfSA9IHByb3BzO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZURpYWxvZ1Jvb3RDb250ZXh0KCk7XG4gIGNvbnN0IG1vdW50ZWQgPSBzdG9yZS51c2VTdGF0ZSgnbW91bnRlZCcpO1xuICBjb25zdCBtb2RhbCA9IHN0b3JlLnVzZVN0YXRlKCdtb2RhbCcpO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3Qgc2hvdWxkUmVuZGVyID0gbW91bnRlZCB8fCBrZWVwTW91bnRlZDtcbiAgaWYgKCFzaG91bGRSZW5kZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goRGlhbG9nUG9ydGFsQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBrZWVwTW91bnRlZCxcbiAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3hzKEZsb2F0aW5nUG9ydGFsLCB7XG4gICAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICAgIC4uLnBvcnRhbFByb3BzLFxuICAgICAgY2hpbGRyZW46IFttb3VudGVkICYmIG1vZGFsID09PSB0cnVlICYmIC8qI19fUFVSRV9fKi9fanN4KEludGVybmFsQmFja2Ryb3AsIHtcbiAgICAgICAgcmVmOiBzdG9yZS5jb250ZXh0LmludGVybmFsQmFja2Ryb3BSZWYsXG4gICAgICAgIGluZXJ0OiBpbmVydFZhbHVlKCFvcGVuKVxuICAgICAgfSksIHByb3BzLmNoaWxkcmVuXVxuICAgIH0pXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBEaWFsb2dQb3J0YWwuZGlzcGxheU5hbWUgPSBcIkRpYWxvZ1BvcnRhbFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlU2Nyb2xsTG9jayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVNjcm9sbExvY2snO1xuaW1wb3J0IHsgRU1QVFlfT0JKRUNUIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZW1wdHknO1xuaW1wb3J0IHsgbWVyZ2VQcm9wcyB9IGZyb20gXCIuLi8uLi9tZXJnZS1wcm9wcy9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdXNlRGlzbWlzcyB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgY29udGFpbnMsIGdldFRhcmdldCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC91dGlscy5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IEZPQ1VTQUJMRV9QT1BVUF9QUk9QUywgdXNlSW1wbGljaXRBY3RpdmVUcmlnZ2VyLCB1c2VPcGVuU3RhdGVUcmFuc2l0aW9ucywgdXNlUG9wdXBJbnRlcmFjdGlvblByb3BzLCB1c2VQb3B1cFJvb3RTeW5jIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BvcHVwcy9pbmRleC5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZURpYWxvZ1Jvb3QocGFyYW1zKSB7XG4gIGNvbnN0IHtcbiAgICBzdG9yZSxcbiAgICBwYXJlbnRDb250ZXh0LFxuICAgIGFjdGlvbnNSZWYsXG4gICAgaXNEcmF3ZXJcbiAgfSA9IHBhcmFtcztcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIHVzZVBvcHVwUm9vdFN5bmMoc3RvcmUsIG9wZW4pO1xuICB1c2VJbXBsaWNpdEFjdGl2ZVRyaWdnZXIoc3RvcmUpO1xuICBjb25zdCB7XG4gICAgZm9yY2VVbm1vdW50XG4gIH0gPSB1c2VPcGVuU3RhdGVUcmFuc2l0aW9ucyhvcGVuLCBzdG9yZSk7XG4gIGNvbnN0IGhhbmRsZUltcGVyYXRpdmVDbG9zZSA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5pbXBlcmF0aXZlQWN0aW9uKSk7XG4gIH0sIFtzdG9yZV0pO1xuICBSZWFjdC51c2VJbXBlcmF0aXZlSGFuZGxlKGFjdGlvbnNSZWYsICgpID0+ICh7XG4gICAgdW5tb3VudDogZm9yY2VVbm1vdW50LFxuICAgIGNsb3NlOiBoYW5kbGVJbXBlcmF0aXZlQ2xvc2VcbiAgfSksIFtmb3JjZVVubW91bnQsIGhhbmRsZUltcGVyYXRpdmVDbG9zZV0pO1xuICByZXR1cm4ge1xuICAgIHBhcmVudENvbnRleHQsXG4gICAgaXNEcmF3ZXJcbiAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBEaWFsb2dJbnRlcmFjdGlvbnMoe1xuICBzdG9yZSxcbiAgZGlhbG9nUm9vdFxufSkge1xuICBjb25zdCB7XG4gICAgcGFyZW50Q29udGV4dCxcbiAgICBpc0RyYXdlclxuICB9ID0gZGlhbG9nUm9vdDtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IGRpc2FibGVQb2ludGVyRGlzbWlzc2FsID0gc3RvcmUudXNlU3RhdGUoJ2Rpc2FibGVQb2ludGVyRGlzbWlzc2FsJyk7XG4gIGNvbnN0IG1vZGFsID0gc3RvcmUudXNlU3RhdGUoJ21vZGFsJyk7XG4gIGNvbnN0IHBvcHVwRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdwb3B1cEVsZW1lbnQnKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IFtvd25OZXN0ZWRPcGVuRGlhbG9ncywgc2V0T3duTmVzdGVkT3BlbkRpYWxvZ3NdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtvd25OZXN0ZWRPcGVuRHJhd2Vycywgc2V0T3duTmVzdGVkT3BlbkRyYXdlcnNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IGlzVG9wbW9zdCA9IG93bk5lc3RlZE9wZW5EaWFsb2dzID09PSAwO1xuICBjb25zdCBkaXNtaXNzID0gdXNlRGlzbWlzcyhmbG9hdGluZ1Jvb3RDb250ZXh0LCB7XG4gICAgb3V0c2lkZVByZXNzRXZlbnQoKSB7XG4gICAgICBpZiAoc3RvcmUuY29udGV4dC5pbnRlcm5hbEJhY2tkcm9wUmVmLmN1cnJlbnQgfHwgc3RvcmUuY29udGV4dC5iYWNrZHJvcFJlZi5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybiAnaW50ZW50aW9uYWwnO1xuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIGBhcmlhLWhpZGRlbmAgb24gb3V0c2lkZSBlbGVtZW50cyBpcyByZW1vdmVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBvbiBvdXRzaWRlIHByZXNzIHdoZW4gdHJhcHBpbmcgZm9jdXMuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtb3VzZTogbW9kYWwgPT09ICd0cmFwLWZvY3VzJyA/ICdzbG9wcHknIDogJ2ludGVudGlvbmFsJyxcbiAgICAgICAgdG91Y2g6ICdzbG9wcHknXG4gICAgICB9O1xuICAgIH0sXG4gICAgb3V0c2lkZVByZXNzKGV2ZW50KSB7XG4gICAgICBpZiAoIXN0b3JlLmNvbnRleHQub3V0c2lkZVByZXNzRW5hYmxlZFJlZi5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIG1vdXNlIGV2ZW50cywgb25seSBhY2NlcHQgbGVmdCBidXR0b24gKGJ1dHRvbiAwKVxuICAgICAgLy8gRm9yIHRvdWNoIGV2ZW50cywgYSBzaW5nbGUgdG91Y2ggaXMgZXF1aXZhbGVudCB0byBsZWZ0IGJ1dHRvblxuICAgICAgaWYgKCdidXR0b24nIGluIGV2ZW50ICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoJ3RvdWNoZXMnIGluIGV2ZW50ICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBpZiAoaXNUb3Btb3N0ICYmICFkaXNhYmxlUG9pbnRlckRpc21pc3NhbCkge1xuICAgICAgICBjb25zdCBldmVudFRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgLy8gT25seSBjbG9zZSBpZiB0aGUgY2xpY2sgb2NjdXJyZWQgb24gdGhlIGRpYWxvZydzIG93bmluZyBiYWNrZHJvcC5cbiAgICAgICAgLy8gVGhpcyBzdXBwb3J0cyBtdWx0aXBsZSBtb2RhbCBkaWFsb2dzIHRoYXQgYXJlbid0IG5lc3RlZCBpbiB0aGUgUmVhY3QgdHJlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL211aS9iYXNlLXVpL2lzc3Vlcy8xMzIwXG4gICAgICAgIGlmIChtb2RhbCkge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5jb250ZXh0LmludGVybmFsQmFja2Ryb3BSZWYuY3VycmVudCB8fCBzdG9yZS5jb250ZXh0LmJhY2tkcm9wUmVmLmN1cnJlbnQgPyBzdG9yZS5jb250ZXh0LmludGVybmFsQmFja2Ryb3BSZWYuY3VycmVudCA9PT0gZXZlbnRUYXJnZXQgfHwgc3RvcmUuY29udGV4dC5iYWNrZHJvcFJlZi5jdXJyZW50ID09PSBldmVudFRhcmdldCB8fCBjb250YWlucyhldmVudFRhcmdldCwgcG9wdXBFbGVtZW50KSAmJiAhZXZlbnRUYXJnZXQ/Lmhhc0F0dHJpYnV0ZSgnZGF0YS1iYXNlLXVpLXBvcnRhbCcpIDogdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIGVzY2FwZUtleTogaXNUb3Btb3N0XG4gIH0pO1xuICB1c2VTY3JvbGxMb2NrKG9wZW4gJiYgbW9kYWwgPT09IHRydWUsIHBvcHVwRWxlbWVudCk7XG5cbiAgLy8gTGlzdGVuIGZvciBuZXN0ZWQgb3Blbi9jbG9zZSBldmVudHMgb24gdGhpcyBzdG9yZSB0byBtYWludGFpbiB0aGUgY291bnRzLlxuICBzdG9yZS51c2VDb250ZXh0Q2FsbGJhY2soJ29uTmVzdGVkRGlhbG9nT3BlbicsIChkaWFsb2dDb3VudCwgZHJhd2VyQ291bnQpID0+IHtcbiAgICBzZXRPd25OZXN0ZWRPcGVuRGlhbG9ncyhkaWFsb2dDb3VudCk7XG4gICAgc2V0T3duTmVzdGVkT3BlbkRyYXdlcnMoZHJhd2VyQ291bnQpO1xuICB9KTtcbiAgc3RvcmUudXNlQ29udGV4dENhbGxiYWNrKCdvbk5lc3RlZERpYWxvZ0Nsb3NlJywgKCkgPT4ge1xuICAgIHNldE93bk5lc3RlZE9wZW5EaWFsb2dzKDApO1xuICAgIHNldE93bk5lc3RlZE9wZW5EcmF3ZXJzKDApO1xuICB9KTtcblxuICAvLyBOb3RpZnkgcGFyZW50IG9mIG91ciBvcGVuL2Nsb3NlIHN0YXRlIHVzaW5nIHBhcmVudCBjYWxsYmFja3MsIGlmIGFueVxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwYXJlbnRDb250ZXh0Py5vbk5lc3RlZERpYWxvZ09wZW4gJiYgb3Blbikge1xuICAgICAgcGFyZW50Q29udGV4dC5vbk5lc3RlZERpYWxvZ09wZW4ob3duTmVzdGVkT3BlbkRpYWxvZ3MgKyAxLCBvd25OZXN0ZWRPcGVuRHJhd2VycyArIChpc0RyYXdlciA/IDEgOiAwKSk7XG4gICAgfVxuICAgIGlmIChwYXJlbnRDb250ZXh0Py5vbk5lc3RlZERpYWxvZ0Nsb3NlICYmICFvcGVuKSB7XG4gICAgICBwYXJlbnRDb250ZXh0Lm9uTmVzdGVkRGlhbG9nQ2xvc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmIChwYXJlbnRDb250ZXh0Py5vbk5lc3RlZERpYWxvZ0Nsb3NlICYmIG9wZW4pIHtcbiAgICAgICAgcGFyZW50Q29udGV4dC5vbk5lc3RlZERpYWxvZ0Nsb3NlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2lzRHJhd2VyLCBvcGVuLCBvd25OZXN0ZWRPcGVuRGlhbG9ncywgb3duTmVzdGVkT3BlbkRyYXdlcnMsIHBhcmVudENvbnRleHRdKTtcbiAgY29uc3QgYWN0aXZlVHJpZ2dlclByb3BzID0gZGlzbWlzcy5yZWZlcmVuY2UgPz8gRU1QVFlfT0JKRUNUO1xuICBjb25zdCBpbmFjdGl2ZVRyaWdnZXJQcm9wcyA9IGRpc21pc3MudHJpZ2dlciA/PyBFTVBUWV9PQkpFQ1Q7XG4gIGNvbnN0IHBvcHVwUHJvcHMgPSBSZWFjdC51c2VNZW1vKCgpID0+IG1lcmdlUHJvcHMoRk9DVVNBQkxFX1BPUFVQX1BST1BTLCBkaXNtaXNzLmZsb2F0aW5nKSwgW2Rpc21pc3MuZmxvYXRpbmddKTtcbiAgdXNlUG9wdXBJbnRlcmFjdGlvblByb3BzKHN0b3JlLCB7XG4gICAgYWN0aXZlVHJpZ2dlclByb3BzLFxuICAgIGluYWN0aXZlVHJpZ2dlclByb3BzLFxuICAgIHBvcHVwUHJvcHMsXG4gICAgbmVzdGVkT3BlbkRpYWxvZ0NvdW50OiBvd25OZXN0ZWRPcGVuRGlhbG9ncyxcbiAgICBuZXN0ZWRPcGVuRHJhd2VyQ291bnQ6IG93bk5lc3RlZE9wZW5EcmF3ZXJzXG4gIH0pO1xuICByZXR1cm4gbnVsbDtcbn0iLCJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBjcmVhdGVTZWxlY3RvciwgUmVhY3RTdG9yZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3N0b3JlJztcbmltcG9ydCB7IGNyZWF0ZVBvcHVwRmxvYXRpbmdSb290Q29udGV4dCwgY3JlYXRlSW5pdGlhbFBvcHVwU3RvcmVTdGF0ZSwgcG9wdXBTdG9yZVNlbGVjdG9ycywgUG9wdXBUcmlnZ2VyTWFwLCBzZXRPcGVuVHJpZ2dlclN0YXRlLCB1c2VQb3B1cFN0b3JlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BvcHVwcy9pbmRleC5qc1wiO1xuY29uc3Qgc2VsZWN0b3JzID0ge1xuICAuLi5wb3B1cFN0b3JlU2VsZWN0b3JzLFxuICBtb2RhbDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUubW9kYWwpLFxuICBuZXN0ZWQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLm5lc3RlZCksXG4gIG5lc3RlZE9wZW5EaWFsb2dDb3VudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUubmVzdGVkT3BlbkRpYWxvZ0NvdW50KSxcbiAgbmVzdGVkT3BlbkRyYXdlckNvdW50OiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5uZXN0ZWRPcGVuRHJhd2VyQ291bnQpLFxuICBkaXNhYmxlUG9pbnRlckRpc21pc3NhbDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuZGlzYWJsZVBvaW50ZXJEaXNtaXNzYWwpLFxuICBvcGVuTWV0aG9kOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5vcGVuTWV0aG9kKSxcbiAgZGVzY3JpcHRpb25FbGVtZW50SWQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmRlc2NyaXB0aW9uRWxlbWVudElkKSxcbiAgdGl0bGVFbGVtZW50SWQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLnRpdGxlRWxlbWVudElkKSxcbiAgdmlld3BvcnRFbGVtZW50OiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS52aWV3cG9ydEVsZW1lbnQpLFxuICByb2xlOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5yb2xlKVxufTtcbmV4cG9ydCBjbGFzcyBEaWFsb2dTdG9yZSBleHRlbmRzIFJlYWN0U3RvcmUge1xuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGUsIGZsb2F0aW5nSWQsIG5lc3RlZCA9IGZhbHNlKSB7XG4gICAgY29uc3QgdHJpZ2dlckVsZW1lbnRzID0gbmV3IFBvcHVwVHJpZ2dlck1hcCgpO1xuICAgIGNvbnN0IHN0YXRlID0gY3JlYXRlSW5pdGlhbFN0YXRlKGluaXRpYWxTdGF0ZSk7XG4gICAgc3RhdGUuZmxvYXRpbmdSb290Q29udGV4dCA9IGNyZWF0ZVBvcHVwRmxvYXRpbmdSb290Q29udGV4dCh0cmlnZ2VyRWxlbWVudHMsIGZsb2F0aW5nSWQsIG5lc3RlZCk7XG4gICAgc3VwZXIoc3RhdGUsIHtcbiAgICAgIHBvcHVwUmVmOiAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlUmVmKCksXG4gICAgICBiYWNrZHJvcFJlZjogLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZVJlZigpLFxuICAgICAgaW50ZXJuYWxCYWNrZHJvcFJlZjogLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZVJlZigpLFxuICAgICAgb3V0c2lkZVByZXNzRW5hYmxlZFJlZjoge1xuICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICB9LFxuICAgICAgdHJpZ2dlckVsZW1lbnRzLFxuICAgICAgb25PcGVuQ2hhbmdlOiB1bmRlZmluZWQsXG4gICAgICBvbk9wZW5DaGFuZ2VDb21wbGV0ZTogdW5kZWZpbmVkXG4gICAgfSwgc2VsZWN0b3JzKTtcbiAgfVxuICBzZXRPcGVuID0gKG5leHRPcGVuLCBldmVudERldGFpbHMpID0+IHtcbiAgICBldmVudERldGFpbHMucHJldmVudFVubW91bnRPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgdGhpcy5zZXQoJ3ByZXZlbnRVbm1vdW50aW5nT25DbG9zZScsIHRydWUpO1xuICAgIH07XG4gICAgaWYgKCFuZXh0T3BlbiAmJiBldmVudERldGFpbHMudHJpZ2dlciA9PSBudWxsICYmIHRoaXMuc3RhdGUuYWN0aXZlVHJpZ2dlcklkICE9IG51bGwpIHtcbiAgICAgIC8vIFdoZW4gY2xvc2luZyB0aGUgZGlhbG9nLCBwYXNzIHRoZSBvbGQgdHJpZ2dlciB0byB0aGUgb25PcGVuQ2hhbmdlIGV2ZW50XG4gICAgICAvLyBzbyBpdCdzIG5vdCByZXNldCB0b28gZWFybHkgKHBvdGVudGlhbGx5IGNhdXNpbmcgZm9jdXMgaXNzdWVzIGluIGNvbnRyb2xsZWQgc2NlbmFyaW9zKS5cbiAgICAgIGV2ZW50RGV0YWlscy50cmlnZ2VyID0gdGhpcy5zdGF0ZS5hY3RpdmVUcmlnZ2VyRWxlbWVudCA/PyB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dC5vbk9wZW5DaGFuZ2U/LihuZXh0T3BlbiwgZXZlbnREZXRhaWxzKTtcbiAgICBpZiAoZXZlbnREZXRhaWxzLmlzQ2FuY2VsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZS5mbG9hdGluZ1Jvb3RDb250ZXh0LmRpc3BhdGNoT3BlbkNoYW5nZShuZXh0T3BlbiwgZXZlbnREZXRhaWxzKTtcbiAgICBjb25zdCB1cGRhdGVkU3RhdGUgPSB7XG4gICAgICBvcGVuOiBuZXh0T3BlblxuICAgIH07XG4gICAgc2V0T3BlblRyaWdnZXJTdGF0ZSh1cGRhdGVkU3RhdGUsIG5leHRPcGVuLCBldmVudERldGFpbHMudHJpZ2dlcik7XG4gICAgdGhpcy51cGRhdGUodXBkYXRlZFN0YXRlKTtcbiAgfTtcbiAgc3RhdGljIHVzZVN0b3JlKGV4dGVybmFsU3RvcmUsIGluaXRpYWxTdGF0ZSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIHJlYWN0LWhvb2tzL3J1bGVzLW9mLWhvb2tzICovXG4gICAgY29uc3Qgc3RvcmUgPSB1c2VQb3B1cFN0b3JlKGV4dGVybmFsU3RvcmUsIChmbG9hdGluZ0lkLCBuZXN0ZWQpID0+IG5ldyBEaWFsb2dTdG9yZShpbml0aWFsU3RhdGUsIGZsb2F0aW5nSWQsIG5lc3RlZCksIHRydWUpLnN0b3JlO1xuICAgIC8qIGVzbGludC1lbmFibGUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3MgKi9cblxuICAgIHJldHVybiBzdG9yZTtcbiAgfVxufVxuZnVuY3Rpb24gY3JlYXRlSW5pdGlhbFN0YXRlKGluaXRpYWxTdGF0ZSA9IHt9KSB7XG4gIHJldHVybiB7XG4gICAgLi4uY3JlYXRlSW5pdGlhbFBvcHVwU3RvcmVTdGF0ZSgpLFxuICAgIG1vZGFsOiB0cnVlLFxuICAgIGRpc2FibGVQb2ludGVyRGlzbWlzc2FsOiBmYWxzZSxcbiAgICBwb3B1cEVsZW1lbnQ6IG51bGwsXG4gICAgdmlld3BvcnRFbGVtZW50OiBudWxsLFxuICAgIGRlc2NyaXB0aW9uRWxlbWVudElkOiB1bmRlZmluZWQsXG4gICAgdGl0bGVFbGVtZW50SWQ6IHVuZGVmaW5lZCxcbiAgICBvcGVuTWV0aG9kOiBudWxsLFxuICAgIG5lc3RlZDogZmFsc2UsXG4gICAgbmVzdGVkT3BlbkRpYWxvZ0NvdW50OiAwLFxuICAgIG5lc3RlZE9wZW5EcmF3ZXJDb3VudDogMCxcbiAgICByb2xlOiAnZGlhbG9nJyxcbiAgICAuLi5pbml0aWFsU3RhdGVcbiAgfTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU9uRmlyc3RSZW5kZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VPbkZpcnN0UmVuZGVyJztcbmltcG9ydCB7IERpYWxvZ0ludGVyYWN0aW9ucywgdXNlRGlhbG9nUm9vdCB9IGZyb20gXCIuL3VzZURpYWxvZ1Jvb3QuanNcIjtcbmltcG9ydCB7IERpYWxvZ1Jvb3RDb250ZXh0LCBJc0RyYXdlckNvbnRleHQsIHVzZURpYWxvZ1Jvb3RDb250ZXh0IH0gZnJvbSBcIi4vRGlhbG9nUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IERpYWxvZ1N0b3JlIH0gZnJvbSBcIi4uL3N0b3JlL0RpYWxvZ1N0b3JlLmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCwganN4cyBhcyBfanN4cyB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVJlbmRlckRpYWxvZ1Jvb3QocHJvcHMsIG1vZGUgPSAnZGlhbG9nJykge1xuICBjb25zdCB7XG4gICAgY2hpbGRyZW4sXG4gICAgb3Blbjogb3BlblByb3AsXG4gICAgZGVmYXVsdE9wZW4gPSBmYWxzZSxcbiAgICBvbk9wZW5DaGFuZ2UsXG4gICAgb25PcGVuQ2hhbmdlQ29tcGxldGUsXG4gICAgZGlzYWJsZVBvaW50ZXJEaXNtaXNzYWw6IGRpc2FibGVQb2ludGVyRGlzbWlzc2FsUHJvcCA9IGZhbHNlLFxuICAgIG1vZGFsOiBtb2RhbFByb3AgPSB0cnVlLFxuICAgIGFjdGlvbnNSZWYsXG4gICAgaGFuZGxlLFxuICAgIHRyaWdnZXJJZDogdHJpZ2dlcklkUHJvcCxcbiAgICBkZWZhdWx0VHJpZ2dlcklkOiBkZWZhdWx0VHJpZ2dlcklkUHJvcCA9IG51bGxcbiAgfSA9IHByb3BzO1xuICBjb25zdCBpc0RyYXdlciA9IG1vZGUgPT09ICdkcmF3ZXInO1xuICBjb25zdCBpc0FsZXJ0RGlhbG9nID0gbW9kZSA9PT0gJ2FsZXJ0LWRpYWxvZyc7XG4gIGNvbnN0IG1vZGFsID0gaXNBbGVydERpYWxvZyA/IHRydWUgOiBtb2RhbFByb3A7XG4gIGNvbnN0IGRpc2FibGVQb2ludGVyRGlzbWlzc2FsID0gaXNBbGVydERpYWxvZyB8fCBkaXNhYmxlUG9pbnRlckRpc21pc3NhbFByb3A7XG4gIGNvbnN0IHJvbGUgPSBpc0FsZXJ0RGlhbG9nID8gJ2FsZXJ0ZGlhbG9nJyA6ICdkaWFsb2cnO1xuICBjb25zdCBwYXJlbnREaWFsb2dSb290Q29udGV4dCA9IHVzZURpYWxvZ1Jvb3RDb250ZXh0KHRydWUpO1xuICBjb25zdCBuZXN0ZWQgPSBCb29sZWFuKHBhcmVudERpYWxvZ1Jvb3RDb250ZXh0KTtcbiAgY29uc3Qgcm9vdFN0YXRlID0ge1xuICAgIG1vZGFsLFxuICAgIGRpc2FibGVQb2ludGVyRGlzbWlzc2FsLFxuICAgIG5lc3RlZCxcbiAgICByb2xlXG4gIH07XG4gIGNvbnN0IHN0b3JlID0gRGlhbG9nU3RvcmUudXNlU3RvcmUoaGFuZGxlPy5zdG9yZSwge1xuICAgIG9wZW46IGRlZmF1bHRPcGVuLFxuICAgIG9wZW5Qcm9wLFxuICAgIGFjdGl2ZVRyaWdnZXJJZDogZGVmYXVsdFRyaWdnZXJJZFByb3AsXG4gICAgdHJpZ2dlcklkUHJvcCxcbiAgICAuLi5yb290U3RhdGVcbiAgfSk7XG5cbiAgLy8gU3VwcG9ydCBpbml0aWFsbHkgb3BlbiBzdGF0ZSB3aGVuIHVuY29udHJvbGxlZFxuICB1c2VPbkZpcnN0UmVuZGVyKCgpID0+IHtcbiAgICBjb25zdCBuZXh0U3RhdGUgPSBvcGVuUHJvcCA9PT0gdW5kZWZpbmVkICYmIHN0b3JlLnN0YXRlLm9wZW4gPT09IGZhbHNlICYmIGRlZmF1bHRPcGVuID09PSB0cnVlID8ge1xuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGFjdGl2ZVRyaWdnZXJJZDogZGVmYXVsdFRyaWdnZXJJZFByb3BcbiAgICB9IDogbnVsbDtcbiAgICBpZiAoaXNBbGVydERpYWxvZykge1xuICAgICAgLy8gSGFuZGxlcyBjYW4gcmV1c2UgcGxhaW4gRGlhbG9nIHN0b3JlczsgYWxlcnQgZGlhbG9nIGludmFyaWFudHMgbXVzdCBleGlzdCBpbW1lZGlhdGVseS5cbiAgICAgIHN0b3JlLnVwZGF0ZShuZXh0U3RhdGUgPyB7XG4gICAgICAgIC4uLnJvb3RTdGF0ZSxcbiAgICAgICAgLi4ubmV4dFN0YXRlXG4gICAgICB9IDogcm9vdFN0YXRlKTtcbiAgICB9IGVsc2UgaWYgKG5leHRTdGF0ZSkge1xuICAgICAgc3RvcmUudXBkYXRlKG5leHRTdGF0ZSk7XG4gICAgfVxuICB9KTtcbiAgc3RvcmUudXNlQ29udHJvbGxlZFByb3AoJ29wZW5Qcm9wJywgb3BlblByb3ApO1xuICBzdG9yZS51c2VDb250cm9sbGVkUHJvcCgndHJpZ2dlcklkUHJvcCcsIHRyaWdnZXJJZFByb3ApO1xuICBzdG9yZS51c2VTeW5jZWRWYWx1ZXMocm9vdFN0YXRlKTtcbiAgc3RvcmUudXNlQ29udGV4dENhbGxiYWNrKCdvbk9wZW5DaGFuZ2UnLCBvbk9wZW5DaGFuZ2UpO1xuICBzdG9yZS51c2VDb250ZXh0Q2FsbGJhY2soJ29uT3BlbkNoYW5nZUNvbXBsZXRlJywgb25PcGVuQ2hhbmdlQ29tcGxldGUpO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgbW91bnRlZCA9IHN0b3JlLnVzZVN0YXRlKCdtb3VudGVkJyk7XG4gIGNvbnN0IHBheWxvYWQgPSBzdG9yZS51c2VTdGF0ZSgncGF5bG9hZCcpO1xuICBjb25zdCBkaWFsb2dSb290ID0gdXNlRGlhbG9nUm9vdCh7XG4gICAgc3RvcmUsXG4gICAgYWN0aW9uc1JlZixcbiAgICBwYXJlbnRDb250ZXh0OiBwYXJlbnREaWFsb2dSb290Q29udGV4dD8uc3RvcmUuY29udGV4dCxcbiAgICBpc0RyYXdlclxuICB9KTtcbiAgY29uc3Qgc2hvdWxkUmVuZGVySW50ZXJhY3Rpb25zID0gb3BlbiB8fCBtb3VudGVkO1xuICBjb25zdCBjb250ZXh0VmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgc3RvcmVcbiAgfSksIFtzdG9yZV0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goSXNEcmF3ZXJDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGZhbHNlLFxuICAgIGNoaWxkcmVuOiAvKiNfX1BVUkVfXyovX2pzeHMoRGlhbG9nUm9vdENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICAgIHZhbHVlOiBjb250ZXh0VmFsdWUsXG4gICAgICBjaGlsZHJlbjogW3Nob3VsZFJlbmRlckludGVyYWN0aW9ucyAmJiAvKiNfX1BVUkVfXyovX2pzeChEaWFsb2dJbnRlcmFjdGlvbnMsIHtcbiAgICAgICAgc3RvcmU6IHN0b3JlLFxuICAgICAgICBkaWFsb2dSb290OiBkaWFsb2dSb290XG4gICAgICB9KSwgdHlwZW9mIGNoaWxkcmVuID09PSAnZnVuY3Rpb24nID8gY2hpbGRyZW4oe1xuICAgICAgICBwYXlsb2FkXG4gICAgICB9KSA6IGNoaWxkcmVuXVxuICAgIH0pXG4gIH0pO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSXNEcmF3ZXJDb250ZXh0IH0gZnJvbSBcIi4vRGlhbG9nUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckRpYWxvZ1Jvb3QgfSBmcm9tIFwiLi91c2VSZW5kZXJEaWFsb2dSb290LmpzXCI7XG5cbi8qKlxuICogR3JvdXBzIGFsbCBwYXJ0cyBvZiB0aGUgZGlhbG9nLlxuICogRG9lc24ndCByZW5kZXIgaXRzIG93biBIVE1MIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgRGlhbG9nXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvZGlhbG9nKVxuICovXG5leHBvcnQgZnVuY3Rpb24gRGlhbG9nUm9vdChwcm9wcykge1xuICBjb25zdCBtb2RlID0gUmVhY3QudXNlQ29udGV4dChJc0RyYXdlckNvbnRleHQpID8gJ2RyYXdlcicgOiAnZGlhbG9nJztcbiAgcmV0dXJuIHVzZVJlbmRlckRpYWxvZ1Jvb3QocHJvcHMsIG1vZGUpO1xufSIsImltcG9ydCB7IENvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmV4cG9ydCBsZXQgRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChEaWFsb2dWaWV3cG9ydERhdGFBdHRyaWJ1dGVzKSB7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIGRpYWxvZyBpcyBvcGVuLlxuICAgKi9cbiAgRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlc1tEaWFsb2dWaWV3cG9ydERhdGFBdHRyaWJ1dGVzW1wib3BlblwiXSA9IENvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXMub3Blbl0gPSBcIm9wZW5cIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgZGlhbG9nIGlzIGNsb3NlZC5cbiAgICovXG4gIERpYWxvZ1ZpZXdwb3J0RGF0YUF0dHJpYnV0ZXNbRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlc1tcImNsb3NlZFwiXSA9IENvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXMuY2xvc2VkXSA9IFwiY2xvc2VkXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIGRpYWxvZyBpcyBhbmltYXRpbmcgaW4uXG4gICAqL1xuICBEaWFsb2dWaWV3cG9ydERhdGFBdHRyaWJ1dGVzW0RpYWxvZ1ZpZXdwb3J0RGF0YUF0dHJpYnV0ZXNbXCJzdGFydGluZ1N0eWxlXCJdID0gQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcy5zdGFydGluZ1N0eWxlXSA9IFwic3RhcnRpbmdTdHlsZVwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBkaWFsb2cgaXMgYW5pbWF0aW5nIG91dC5cbiAgICovXG4gIERpYWxvZ1ZpZXdwb3J0RGF0YUF0dHJpYnV0ZXNbRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlc1tcImVuZGluZ1N0eWxlXCJdID0gQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcy5lbmRpbmdTdHlsZV0gPSBcImVuZGluZ1N0eWxlXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIGRpYWxvZyBpcyBuZXN0ZWQgd2l0aGluIGFub3RoZXIgZGlhbG9nLlxuICAgKi9cbiAgRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlc1tcIm5lc3RlZFwiXSA9IFwiZGF0YS1uZXN0ZWRcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgZGlhbG9nIGhhcyBvdGhlciBvcGVuIGRpYWxvZ3MgbmVzdGVkIHdpdGhpbiBpdC5cbiAgICovXG4gIERpYWxvZ1ZpZXdwb3J0RGF0YUF0dHJpYnV0ZXNbXCJuZXN0ZWREaWFsb2dPcGVuXCJdID0gXCJkYXRhLW5lc3RlZC1kaWFsb2ctb3BlblwiO1xuICByZXR1cm4gRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlcztcbn0oe30pOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgYXMgYmFzZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VEaWFsb2dSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L0RpYWxvZ1Jvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VEaWFsb2dQb3J0YWxDb250ZXh0IH0gZnJvbSBcIi4uL3BvcnRhbC9EaWFsb2dQb3J0YWxDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBEaWFsb2dWaWV3cG9ydERhdGFBdHRyaWJ1dGVzIH0gZnJvbSBcIi4vRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlcy5qc1wiO1xuY29uc3Qgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyA9IHtcbiAgLi4uYmFzZU1hcHBpbmcsXG4gIC4uLnRyYW5zaXRpb25TdGF0dXNNYXBwaW5nLFxuICBuZXN0ZWQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPyB7XG4gICAgICBbRGlhbG9nVmlld3BvcnREYXRhQXR0cmlidXRlcy5uZXN0ZWRdOiAnJ1xuICAgIH0gOiBudWxsO1xuICB9LFxuICBuZXN0ZWREaWFsb2dPcGVuKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID8ge1xuICAgICAgW0RpYWxvZ1ZpZXdwb3J0RGF0YUF0dHJpYnV0ZXMubmVzdGVkRGlhbG9nT3Blbl06ICcnXG4gICAgfSA6IG51bGw7XG4gIH1cbn07XG5cbi8qKlxuICogQSBwb3NpdGlvbmluZyBjb250YWluZXIgZm9yIHRoZSBkaWFsb2cgcG9wdXAgdGhhdCBjYW4gYmUgbWFkZSBzY3JvbGxhYmxlLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBEaWFsb2ddKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9kaWFsb2cpXG4gKi9cbmV4cG9ydCBjb25zdCBEaWFsb2dWaWV3cG9ydCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIERpYWxvZ1ZpZXdwb3J0KGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgY2hpbGRyZW4sXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qga2VlcE1vdW50ZWQgPSB1c2VEaWFsb2dQb3J0YWxDb250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlRGlhbG9nUm9vdENvbnRleHQoKTtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IG5lc3RlZCA9IHN0b3JlLnVzZVN0YXRlKCduZXN0ZWQnKTtcbiAgY29uc3QgdHJhbnNpdGlvblN0YXR1cyA9IHN0b3JlLnVzZVN0YXRlKCd0cmFuc2l0aW9uU3RhdHVzJyk7XG4gIGNvbnN0IG5lc3RlZE9wZW5EaWFsb2dDb3VudCA9IHN0b3JlLnVzZVN0YXRlKCduZXN0ZWRPcGVuRGlhbG9nQ291bnQnKTtcbiAgY29uc3QgbW91bnRlZCA9IHN0b3JlLnVzZVN0YXRlKCdtb3VudGVkJyk7XG4gIGNvbnN0IHNldFZpZXdwb3J0RWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlU2V0dGVyKCd2aWV3cG9ydEVsZW1lbnQnKTtcbiAgY29uc3QgbmVzdGVkRGlhbG9nT3BlbiA9IG5lc3RlZE9wZW5EaWFsb2dDb3VudCA+IDA7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIG9wZW4sXG4gICAgbmVzdGVkLFxuICAgIHRyYW5zaXRpb25TdGF0dXMsXG4gICAgbmVzdGVkRGlhbG9nT3BlblxuICB9O1xuICBjb25zdCBzaG91bGRSZW5kZXIgPSBrZWVwTW91bnRlZCB8fCBtb3VudGVkO1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBlbmFibGVkOiBzaG91bGRSZW5kZXIsXG4gICAgc3RhdGUsXG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCBzZXRWaWV3cG9ydEVsZW1lbnRdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmcsXG4gICAgcHJvcHM6IFt7XG4gICAgICByb2xlOiAncHJlc2VudGF0aW9uJyxcbiAgICAgIGhpZGRlbjogIW1vdW50ZWQsXG4gICAgICBzdHlsZToge1xuICAgICAgICBwb2ludGVyRXZlbnRzOiAhb3BlbiA/ICdub25lJyA6IHVuZGVmaW5lZFxuICAgICAgfSxcbiAgICAgIGNoaWxkcmVuXG4gICAgfSwgZWxlbWVudFByb3BzXVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgRGlhbG9nVmlld3BvcnQuZGlzcGxheU5hbWUgPSBcIkRpYWxvZ1ZpZXdwb3J0XCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VEaWFsb2dSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L0RpYWxvZ1Jvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB1c2VCYXNlVWlJZCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlQmFzZVVpSWQuanNcIjtcbi8qKlxuICogQSBoZWFkaW5nIHRoYXQgbGFiZWxzIHRoZSBkaWFsb2cuXG4gKiBSZW5kZXJzIGFuIGA8aDI+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIERpYWxvZ10oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL2RpYWxvZylcbiAqL1xuZXhwb3J0IGNvbnN0IERpYWxvZ1RpdGxlID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gRGlhbG9nVGl0bGUoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBpZDogaWRQcm9wLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlRGlhbG9nUm9vdENvbnRleHQoKTtcbiAgY29uc3QgaWQgPSB1c2VCYXNlVWlJZChpZFByb3ApO1xuICBzdG9yZS51c2VTeW5jZWRWYWx1ZVdpdGhDbGVhbnVwKCd0aXRsZUVsZW1lbnRJZCcsIGlkKTtcbiAgcmV0dXJuIHVzZVJlbmRlckVsZW1lbnQoJ2gyJywgY29tcG9uZW50UHJvcHMsIHtcbiAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICBwcm9wczogW3tcbiAgICAgIGlkXG4gICAgfSwgZWxlbWVudFByb3BzXVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgRGlhbG9nVGl0bGUuZGlzcGxheU5hbWUgPSBcIkRpYWxvZ1RpdGxlXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VEaWFsb2dSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L0RpYWxvZ1Jvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VCdXR0b24gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZS1idXR0b24vdXNlQnV0dG9uLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB0cmlnZ2VyT3BlblN0YXRlTWFwcGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgQ0xJQ0tfVFJJR0dFUl9JREVOVElGSUVSIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IHVzZVRyaWdnZXJEYXRhRm9yd2FyZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cHMvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZUJhc2VVaUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VCYXNlVWlJZC5qc1wiO1xuaW1wb3J0IHsgdXNlQ2xpY2sgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZU9wZW5NZXRob2RUcmlnZ2VyUHJvcHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvdXNlT3BlbkludGVyYWN0aW9uVHlwZS5qc1wiO1xuXG4vKipcbiAqIEEgYnV0dG9uIHRoYXQgb3BlbnMgdGhlIGRpYWxvZy5cbiAqIFJlbmRlcnMgYSBgPGJ1dHRvbj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgRGlhbG9nXShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvZGlhbG9nKVxuICovXG5leHBvcnQgY29uc3QgRGlhbG9nVHJpZ2dlciA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIERpYWxvZ1RyaWdnZXIoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIG5hdGl2ZUJ1dHRvbiA9IHRydWUsXG4gICAgaWQ6IGlkUHJvcCxcbiAgICBwYXlsb2FkLFxuICAgIGhhbmRsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCBkaWFsb2dSb290Q29udGV4dCA9IHVzZURpYWxvZ1Jvb3RDb250ZXh0KHRydWUpO1xuICBjb25zdCBzdG9yZSA9IGhhbmRsZT8uc3RvcmUgPz8gZGlhbG9nUm9vdENvbnRleHQ/LnN0b3JlO1xuICBpZiAoIXN0b3JlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiA8RGlhbG9nLlRyaWdnZXI+IG11c3QgYmUgdXNlZCB3aXRoaW4gPERpYWxvZy5Sb290PiBvciBwcm92aWRlZCB3aXRoIGEgaGFuZGxlLicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDc5KSk7XG4gIH1cbiAgY29uc3QgdGhpc1RyaWdnZXJJZCA9IHVzZUJhc2VVaUlkKGlkUHJvcCk7XG4gIGNvbnN0IGZsb2F0aW5nQ29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IGlzT3BlbmVkQnlUaGlzVHJpZ2dlciA9IHN0b3JlLnVzZVN0YXRlKCdpc09wZW5lZEJ5VHJpZ2dlcicsIHRoaXNUcmlnZ2VySWQpO1xuICBjb25zdCBwb3B1cElkID0gc3RvcmUudXNlU3RhdGUoJ3RyaWdnZXJQb3B1cElkJywgdGhpc1RyaWdnZXJJZCk7XG4gIGNvbnN0IHRyaWdnZXJFbGVtZW50UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB7XG4gICAgcmVnaXN0ZXJUcmlnZ2VyLFxuICAgIGlzTW91bnRlZEJ5VGhpc1RyaWdnZXJcbiAgfSA9IHVzZVRyaWdnZXJEYXRhRm9yd2FyZGluZyh0aGlzVHJpZ2dlcklkLCB0cmlnZ2VyRWxlbWVudFJlZiwgc3RvcmUsIHtcbiAgICBwYXlsb2FkXG4gIH0pO1xuICBjb25zdCB7XG4gICAgZ2V0QnV0dG9uUHJvcHMsXG4gICAgYnV0dG9uUmVmXG4gIH0gPSB1c2VCdXR0b24oe1xuICAgIGRpc2FibGVkLFxuICAgIG5hdGl2ZTogbmF0aXZlQnV0dG9uXG4gIH0pO1xuICBjb25zdCBjbGljayA9IHVzZUNsaWNrKGZsb2F0aW5nQ29udGV4dCwge1xuICAgIGVuYWJsZWQ6IGZsb2F0aW5nQ29udGV4dCAhPSBudWxsXG4gIH0pO1xuICBjb25zdCBpbnRlcmFjdGlvblR5cGVQcm9wcyA9IHVzZU9wZW5NZXRob2RUcmlnZ2VyUHJvcHMoKCkgPT4gc3RvcmUuc2VsZWN0KCdvcGVuJyksIGludGVyYWN0aW9uVHlwZSA9PiB7XG4gICAgc3RvcmUuc2V0KCdvcGVuTWV0aG9kJywgaW50ZXJhY3Rpb25UeXBlKTtcbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGRpc2FibGVkLFxuICAgIG9wZW46IGlzT3BlbmVkQnlUaGlzVHJpZ2dlclxuICB9O1xuICBjb25zdCByb290VHJpZ2dlclByb3BzID0gc3RvcmUudXNlU3RhdGUoJ3RyaWdnZXJQcm9wcycsIGlzTW91bnRlZEJ5VGhpc1RyaWdnZXIpO1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCgnYnV0dG9uJywgY29tcG9uZW50UHJvcHMsIHtcbiAgICBzdGF0ZSxcbiAgICByZWY6IFtidXR0b25SZWYsIGZvcndhcmRlZFJlZiwgcmVnaXN0ZXJUcmlnZ2VyLCB0cmlnZ2VyRWxlbWVudFJlZl0sXG4gICAgcHJvcHM6IFtjbGljay5yZWZlcmVuY2UsIHJvb3RUcmlnZ2VyUHJvcHMsIGludGVyYWN0aW9uVHlwZVByb3BzLCB7XG4gICAgICBbQ0xJQ0tfVFJJR0dFUl9JREVOVElGSUVSXTogJycsXG4gICAgICBpZDogdGhpc1RyaWdnZXJJZCxcbiAgICAgICdhcmlhLWhhc3BvcHVwJzogJ2RpYWxvZycsXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGlzT3BlbmVkQnlUaGlzVHJpZ2dlcixcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogcG9wdXBJZFxuICAgIH0sIGVsZW1lbnRQcm9wcywgZ2V0QnV0dG9uUHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHRyaWdnZXJPcGVuU3RhdGVNYXBwaW5nXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBEaWFsb2dUcmlnZ2VyLmRpc3BsYXlOYW1lID0gXCJEaWFsb2dUcmlnZ2VyXCI7IiwiaW1wb3J0IHsgRGlhbG9nU3RvcmUgfSBmcm9tIFwiLi9EaWFsb2dTdG9yZS5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcblxuLyoqXG4gKiBBIGhhbmRsZSB0byBjb250cm9sIGEgRGlhbG9nIGltcGVyYXRpdmVseSBhbmQgdG8gYXNzb2NpYXRlIGRldGFjaGVkIHRyaWdnZXJzIHdpdGggaXQuXG4gKi9cbmV4cG9ydCBjbGFzcyBEaWFsb2dIYW5kbGUge1xuICAvKipcbiAgICogSW50ZXJuYWwgc3RvcmUgaG9sZGluZyB0aGUgZGlhbG9nIHN0YXRlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgY29uc3RydWN0b3Ioc3RvcmUpIHtcbiAgICB0aGlzLnN0b3JlID0gc3RvcmUgPz8gbmV3IERpYWxvZ1N0b3JlKCk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIGRpYWxvZyBhbmQgYXNzb2NpYXRlcyBpdCB3aXRoIHRoZSB0cmlnZ2VyIHdpdGggdGhlIGdpdmVuIGlkLlxuICAgKiBUaGUgdHJpZ2dlciwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYSBtYXRjaGluZyBUcmlnZ2VyIGNvbXBvbmVudCB3aXRoIHRoaXMgaGFuZGxlIHBhc3NlZCBhcyBhIHByb3AuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBhbiBldmVudCBoYW5kbGVyIG9yIGFuIGVmZmVjdCAobm90IGR1cmluZyByZW5kZXJpbmcpLlxuICAgKlxuICAgKiBAcGFyYW0gdHJpZ2dlcklkIElEIG9mIHRoZSB0cmlnZ2VyIHRvIGFzc29jaWF0ZSB3aXRoIHRoZSBkaWFsb2cuIElmIG51bGwsIHRoZSBkaWFsb2cgd2lsbCBvcGVuIHdpdGhvdXQgYSB0cmlnZ2VyIGFzc29jaWF0aW9uLlxuICAgKi9cbiAgb3Blbih0cmlnZ2VySWQpIHtcbiAgICBjb25zdCB0cmlnZ2VyRWxlbWVudCA9IHRyaWdnZXJJZCA/IHRoaXMuc3RvcmUuY29udGV4dC50cmlnZ2VyRWxlbWVudHMuZ2V0QnlJZCh0cmlnZ2VySWQpIDogdW5kZWZpbmVkO1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBpZiAodHJpZ2dlcklkICYmICF0cmlnZ2VyRWxlbWVudCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYEJhc2UgVUk6IERpYWxvZ0hhbmRsZS5vcGVuOiBObyB0cmlnZ2VyIGZvdW5kIHdpdGggaWQgXCIke3RyaWdnZXJJZH1cIi4gVGhlIGRpYWxvZyB3aWxsIG9wZW4sIGJ1dCB0aGUgdHJpZ2dlciB3aWxsIG5vdCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRpYWxvZy5gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zdG9yZS5zZXRPcGVuKHRydWUsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLmltcGVyYXRpdmVBY3Rpb24sIHVuZGVmaW5lZCwgdHJpZ2dlckVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgZGlhbG9nIGFuZCBzZXRzIHRoZSBwYXlsb2FkLlxuICAgKiBEb2VzIG5vdCBhc3NvY2lhdGUgdGhlIGRpYWxvZyB3aXRoIGFueSB0cmlnZ2VyLlxuICAgKlxuICAgKiBAcGFyYW0gcGF5bG9hZCBQYXlsb2FkIHRvIHNldCB3aGVuIG9wZW5pbmcgdGhlIGRpYWxvZy5cbiAgICovXG4gIG9wZW5XaXRoUGF5bG9hZChwYXlsb2FkKSB7XG4gICAgdGhpcy5zdG9yZS5zZXQoJ3BheWxvYWQnLCBwYXlsb2FkKTtcbiAgICB0aGlzLnN0b3JlLnNldE9wZW4odHJ1ZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMuaW1wZXJhdGl2ZUFjdGlvbiwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIGRpYWxvZy5cbiAgICovXG4gIGNsb3NlKCkge1xuICAgIHRoaXMuc3RvcmUuc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMuaW1wZXJhdGl2ZUFjdGlvbiwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgZGlhbG9nIGlzIGN1cnJlbnRseSBvcGVuLlxuICAgKi9cbiAgZ2V0IGlzT3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5zZWxlY3QoJ29wZW4nKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaGFuZGxlIHRvIGNvbm5lY3QgYSBEaWFsb2cuUm9vdCB3aXRoIGRldGFjaGVkIERpYWxvZy5UcmlnZ2VyIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaWFsb2dIYW5kbGUoKSB7XG4gIHJldHVybiBuZXcgRGlhbG9nSGFuZGxlKCk7XG59IiwiZXhwb3J0IHsgRGlhbG9nQmFja2Ryb3AgYXMgQmFja2Ryb3AgfSBmcm9tIFwiLi9iYWNrZHJvcC9EaWFsb2dCYWNrZHJvcC5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nQ2xvc2UgYXMgQ2xvc2UgfSBmcm9tIFwiLi9jbG9zZS9EaWFsb2dDbG9zZS5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nRGVzY3JpcHRpb24gYXMgRGVzY3JpcHRpb24gfSBmcm9tIFwiLi9kZXNjcmlwdGlvbi9EaWFsb2dEZXNjcmlwdGlvbi5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nUG9wdXAgYXMgUG9wdXAgfSBmcm9tIFwiLi9wb3B1cC9EaWFsb2dQb3B1cC5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nUG9ydGFsIGFzIFBvcnRhbCB9IGZyb20gXCIuL3BvcnRhbC9EaWFsb2dQb3J0YWwuanNcIjtcbmV4cG9ydCB7IERpYWxvZ1Jvb3QgYXMgUm9vdCB9IGZyb20gXCIuL3Jvb3QvRGlhbG9nUm9vdC5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nVmlld3BvcnQgYXMgVmlld3BvcnQgfSBmcm9tIFwiLi92aWV3cG9ydC9EaWFsb2dWaWV3cG9ydC5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nVGl0bGUgYXMgVGl0bGUgfSBmcm9tIFwiLi90aXRsZS9EaWFsb2dUaXRsZS5qc1wiO1xuZXhwb3J0IHsgRGlhbG9nVHJpZ2dlciBhcyBUcmlnZ2VyIH0gZnJvbSBcIi4vdHJpZ2dlci9EaWFsb2dUcmlnZ2VyLmpzXCI7XG5leHBvcnQgeyBjcmVhdGVEaWFsb2dIYW5kbGUgYXMgY3JlYXRlSGFuZGxlLCBEaWFsb2dIYW5kbGUgYXMgSGFuZGxlIH0gZnJvbSBcIi4vc3RvcmUvRGlhbG9nSGFuZGxlLmpzXCI7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBSUEsSUFBYSxrQkFBK0IsMkJBQU0sY0FBYyxLQUFLO0FBQzFCLGdCQUFnQixjQUFjO0FBQ3pFLElBQWEsb0JBQWlDLDJCQUFNLGNBQWMsS0FBQSxDQUFTO0FBQ2hDLGtCQUFrQixjQUFjO0FBQzNFLFNBQWdCLHFCQUFxQixVQUFVO0NBQzdDLE1BQU0sb0JBQUEsYUFBMEIsV0FBVyxpQkFBaUI7Q0FDNUQsSUFBSSxhQUFhLFNBQVMsc0JBQXNCLEtBQUEsR0FDOUMsTUFBTSxJQUFJLE1BQThDLDBGQUFvSDtDQUU5SyxPQUFPO0FBQ1Q7OztBQ1BBLElBQU1BLDJCQUF5QjtDQUM3QixHQUFHQztDQUNILEdBQUc7QUFDTDs7Ozs7OztBQVFBLElBQWEsaUJBQThCLDJCQUFNLFdBQVcsU0FBUyxlQUFlLGdCQUFnQixjQUFjO0NBQ2hILE1BQU0sRUFDSixRQUNBLFdBQ0EsT0FDQSxjQUFjLE9BQ2QsR0FBRyxpQkFDRDtDQUNKLE1BQU0sRUFDSixVQUNFLHFCQUFxQjtDQUN6QixNQUFNLE9BQU8sTUFBTSxTQUFTLE1BQU07Q0FDbEMsTUFBTSxTQUFTLE1BQU0sU0FBUyxRQUFRO0NBQ3RDLE1BQU0sVUFBVSxNQUFNLFNBQVMsU0FBUztDQUV4QyxNQUFNLFFBQVE7RUFDWjtFQUNBLGtCQUh1QixNQUFNLFNBQVMsa0JBR3ZCO0NBQ2pCO0NBQ0EsT0FBTyxpQkFBaUIsT0FBTyxnQkFBZ0I7RUFDN0M7RUFDQSxLQUFLLENBQUMsTUFBTSxRQUFRLGFBQWEsWUFBWTtFQUM3Qyx3QkFBQTtFQUNBLE9BQU8sQ0FBQztHQUNOLE1BQU07R0FDTixRQUFRLENBQUM7R0FDVCxPQUFPO0lBQ0wsWUFBWTtJQUNaLGtCQUFrQjtHQUNwQjtFQUNGLEdBQUcsWUFBWTtFQUNmLFNBQVMsZUFBZSxDQUFDO0NBQzNCLENBQUM7QUFDSCxDQUFDO0FBQzBDLGVBQWUsY0FBYzs7Ozs7Ozs7O0FDckN4RSxJQUFhLGNBQTJCLDJCQUFNLFdBQVcsU0FBUyxZQUFZLGdCQUFnQixjQUFjO0NBQzFHLE1BQU0sRUFDSixRQUNBLFdBQ0EsT0FDQSxXQUFXLE9BQ1gsZUFBZSxNQUNmLEdBQUcsaUJBQ0Q7Q0FDSixNQUFNLEVBQ0osVUFDRSxxQkFBcUI7Q0FDekIsTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0NBQ2xDLE1BQU0sRUFDSixnQkFDQSxjQUNFLFVBQVU7RUFDWjtFQUNBLFFBQVE7Q0FDVixDQUFDO0NBQ0QsTUFBTSxRQUFRLEVBQ1osU0FDRjtDQUNBLFNBQVMsWUFBWSxPQUFPO0VBQzFCLElBQUksTUFDRixNQUFNLFFBQVEsT0FBTyx5QkFBeUJDLFlBQW9CLE1BQU0sV0FBVyxDQUFDO0NBRXhGO0NBQ0EsT0FBTyxpQkFBaUIsVUFBVSxnQkFBZ0I7RUFDaEQ7RUFDQSxLQUFLLENBQUMsY0FBYyxTQUFTO0VBQzdCLE9BQU87R0FBQyxFQUNOLFNBQVMsWUFDWDtHQUFHO0dBQWM7RUFBYztDQUNqQyxDQUFDO0FBQ0gsQ0FBQztBQUMwQyxZQUFZLGNBQWM7Ozs7Ozs7OztBQ3ZDckUsSUFBYSxvQkFBaUMsMkJBQU0sV0FBVyxTQUFTLGtCQUFrQixnQkFBZ0IsY0FBYztDQUN0SCxNQUFNLEVBQ0osUUFDQSxXQUNBLE9BQ0EsSUFBSSxRQUNKLEdBQUcsaUJBQ0Q7Q0FDSixNQUFNLEVBQ0osVUFDRSxxQkFBcUI7Q0FDekIsTUFBTSxLQUFLLFlBQVksTUFBTTtDQUM3QixNQUFNLDBCQUEwQix3QkFBd0IsRUFBRTtDQUMxRCxPQUFPLGlCQUFpQixLQUFLLGdCQUFnQjtFQUMzQyxLQUFLO0VBQ0wsT0FBTyxDQUFDLEVBQ04sR0FDRixHQUFHLFlBQVk7Q0FDakIsQ0FBQztBQUNILENBQUM7QUFDMEMsa0JBQWtCLGNBQWM7OztBQ2hDM0UsSUFBVyxxQkFBa0MsdUJBQVUsb0JBQW9COzs7OztDQUt6RSxtQkFBbUIsbUJBQW1CO0NBQ3RDLE9BQU87QUFDVCxFQUFFLENBQUMsQ0FBQzs7O0FDTkosSUFBVyw0QkFBNEIsU0FBVSwyQkFBMkI7Ozs7Q0FJMUUsMEJBQTBCLDBCQUEwQixVQUFVLDBCQUEwQixRQUFROzs7O0NBSWhHLDBCQUEwQiwwQkFBMEIsWUFBWSwwQkFBMEIsVUFBVTs7OztDQUlwRywwQkFBMEIsMEJBQTBCLG1CQUFtQiwwQkFBMEIsaUJBQWlCOzs7O0NBSWxILDBCQUEwQiwwQkFBMEIsaUJBQWlCLDBCQUEwQixlQUFlOzs7O0NBSTlHLDBCQUEwQixZQUFZOzs7O0NBSXRDLDBCQUEwQixzQkFBc0I7Q0FDaEQsT0FBTztBQUNULEVBQUUsQ0FBQyxDQUFDOzs7QUN2QkosSUFBYSxzQkFBbUMsMkJBQU0sY0FBYyxLQUFBLENBQVM7QUFDbEMsb0JBQW9CLGNBQWM7QUFDN0UsU0FBZ0IseUJBQXlCO0NBQ3ZDLE1BQU0sUUFBQSxhQUFjLFdBQVcsbUJBQW1CO0NBQ2xELElBQUksVUFBVSxLQUFBLEdBQ1osTUFBTSxJQUFJLE1BQThDLHNDQUFnRTtDQUUxSCxPQUFPO0FBQ1Q7Ozs7QUNHQSxJQUFNQywyQkFBeUI7Q0FDN0IsR0FBR0M7Q0FDSCxHQUFHO0NBQ0gsaUJBQWlCLE9BQU87RUFDdEIsT0FBTyxRQUFRLEdBQ1osMEJBQTBCLG1CQUFtQixHQUNoRCxJQUFJO0NBQ047QUFDRjs7Ozs7OztBQVFBLElBQWEsY0FBMkIsMkJBQU0sV0FBVyxTQUFTLFlBQVksZ0JBQWdCLGNBQWM7Q0FDMUcsTUFBTSxFQUNKLFFBQ0EsV0FDQSxPQUNBLFlBQ0EsY0FDQSxHQUFHLGlCQUNEO0NBQ0osTUFBTSxFQUNKLFVBQ0UscUJBQXFCO0NBQ3pCLE1BQU0sdUJBQXVCLE1BQU0sU0FBUyxzQkFBc0I7Q0FDbEUsTUFBTSwwQkFBMEIsTUFBTSxTQUFTLHlCQUF5QjtDQUN4RSxNQUFNLHNCQUFzQixNQUFNLFNBQVMscUJBQXFCO0NBQ2hFLE1BQU0saUJBQWlCLE1BQU0sU0FBUyxZQUFZO0NBQ2xELE1BQU0sUUFBUSxNQUFNLFNBQVMsT0FBTztDQUNwQyxNQUFNLFVBQVUsTUFBTSxTQUFTLFNBQVM7Q0FDeEMsTUFBTSxTQUFTLE1BQU0sU0FBUyxRQUFRO0NBQ3RDLE1BQU0sd0JBQXdCLE1BQU0sU0FBUyx1QkFBdUI7Q0FDcEUsTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0NBQ2xDLE1BQU0sYUFBYSxNQUFNLFNBQVMsWUFBWTtDQUM5QyxNQUFNLGlCQUFpQixNQUFNLFNBQVMsZ0JBQWdCO0NBQ3RELE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxrQkFBa0I7Q0FDMUQsTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0NBQ2xDLE1BQU0sYUFBYSxvQkFBb0IsU0FBUyxZQUFZO0NBQzVELE1BQU0sVUFBVSxhQUFhLE1BQU07Q0FDbkMsdUJBQXVCO0NBQ3ZCLHNCQUFzQjtFQUNwQjtFQUNBLEtBQUssTUFBTSxRQUFRO0VBQ25CLGFBQWE7R0FDWCxJQUFJLE1BQ0YsTUFBTSxRQUFRLHVCQUF1QixJQUFJO0VBRTdDO0NBQ0YsQ0FBQztDQUtELFNBQVMsb0JBQW9CLGlCQUFpQjtFQUM1QyxJQUFJLG9CQUFvQixTQUN0QixPQUFPLE1BQU0sUUFBUSxTQUFTO0VBRWhDLE9BQU87Q0FDVDtDQUNBLE1BQU0sdUJBQXVCLGlCQUFpQixLQUFBLElBQVksc0JBQXNCO0NBQ2hGLE1BQU0sbUJBQW1CLHdCQUF3QjtDQUNqRCxNQUFNLGtCQUFrQixNQUFNLGVBQWUsY0FBYztDQU8zRCxNQUFNLFVBQVUsaUJBQWlCLE9BQU8sZ0JBQWdCO0VBQ3RELE9BQUE7R0FOQTtHQUNBO0dBQ0E7R0FDQTtFQUdJO0VBQ0osT0FBTztHQUFDO0dBQWdCO0lBQ3RCLElBQUk7SUFDSixtQkFBbUIsa0JBQWtCLEtBQUE7SUFDckMsb0JBQW9CLHdCQUF3QixLQUFBO0lBQzVDO0lBQ0EsR0FBRztJQUNILFFBQVEsQ0FBQztJQUNULFVBQVUsT0FBTztLQUNmLElBQUksZUFBZSxJQUFJLE1BQU0sR0FBRyxHQUM5QixNQUFNLGdCQUFnQjtJQUUxQjtJQUNBLE9BQU8sR0FDSixtQkFBbUIsZ0JBQWdCLHNCQUN0QztHQUNGO0dBQUc7RUFBWTtFQUNmLEtBQUs7R0FBQztHQUFjLE1BQU0sUUFBUTtHQUFVO0VBQWU7RUFDM0Qsd0JBQUE7Q0FDRixDQUFDO0NBQ0QsT0FBb0IsZUFBQSxHQUFBLG1CQUFBLElBQUEsQ0FBSyxzQkFBc0I7RUFDN0MsU0FBUztFQUNULHFCQUFxQjtFQUNyQixVQUFVLENBQUM7RUFDWCxpQkFBaUIsQ0FBQztFQUNsQixjQUFjO0VBQ2QsYUFBYTtFQUNiLE9BQU8sVUFBVTtFQUNqQixjQUFjO0VBQ2QsVUFBVTtDQUNaLENBQUM7QUFDSCxDQUFDO0FBQzBDLFlBQVksY0FBYzs7Ozs7Ozs7OztBQ3ZHckUsSUFBYSxlQUE0QiwyQkFBTSxXQUFXLFNBQVMsYUFBYSxPQUFPLGNBQWM7Q0FDbkcsTUFBTSxFQUNKLGNBQWMsT0FDZCxHQUFHLGdCQUNEO0NBQ0osTUFBTSxFQUNKLFVBQ0UscUJBQXFCO0NBQ3pCLE1BQU0sVUFBVSxNQUFNLFNBQVMsU0FBUztDQUN4QyxNQUFNLFFBQVEsTUFBTSxTQUFTLE9BQU87Q0FDcEMsTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0NBRWxDLElBQUksRUFEaUIsV0FBVyxjQUU5QixPQUFPO0NBRVQsT0FBb0IsZUFBQSxHQUFBLG1CQUFBLElBQUEsQ0FBSyxvQkFBb0IsVUFBVTtFQUNyRCxPQUFPO0VBQ1AsVUFBdUIsZUFBQSxHQUFBLG1CQUFBLEtBQUEsQ0FBTSxnQkFBZ0I7R0FDM0MsS0FBSztHQUNMLEdBQUc7R0FDSCxVQUFVLENBQUMsV0FBVyxVQUFVLFFBQXFCLGVBQUEsR0FBQSxtQkFBQSxJQUFBLENBQUssa0JBQWtCO0lBQzFFLEtBQUssTUFBTSxRQUFRO0lBQ25CLE9BQU8sV0FBVyxDQUFDLElBQUk7R0FDekIsQ0FBQyxHQUFHLE1BQU0sUUFBUTtFQUNwQixDQUFDO0NBQ0gsQ0FBQztBQUNILENBQUM7QUFDMEMsYUFBYSxjQUFjOzs7QUNqQ3RFLFNBQWdCLGNBQWMsUUFBUTtDQUNwQyxNQUFNLEVBQ0osT0FDQSxlQUNBLFlBQ0EsYUFDRTtDQUNKLE1BQU0sT0FBTyxNQUFNLFNBQVMsTUFBTTtDQUNsQyxpQkFBaUIsT0FBTyxJQUFJO0NBQzVCLHlCQUF5QixLQUFLO0NBQzlCLE1BQU0sRUFDSixpQkFDRSx3QkFBd0IsTUFBTSxLQUFLO0NBQ3ZDLE1BQU0sd0JBQUEsYUFBOEIsa0JBQWtCO0VBQ3BELE1BQU0sUUFBUSxPQUFPLHlCQUF5QkMsZ0JBQXdCLENBQUM7Q0FDekUsR0FBRyxDQUFDLEtBQUssQ0FBQztDQUNWLGFBQU0sb0JBQW9CLG1CQUFtQjtFQUMzQyxTQUFTO0VBQ1QsT0FBTztDQUNULElBQUksQ0FBQyxjQUFjLHFCQUFxQixDQUFDO0NBQ3pDLE9BQU87RUFDTDtFQUNBO0NBQ0Y7QUFDRjtBQUNBLFNBQWdCLG1CQUFtQixFQUNqQyxPQUNBLGNBQ0M7Q0FDRCxNQUFNLEVBQ0osZUFDQSxhQUNFO0NBQ0osTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0NBQ2xDLE1BQU0sMEJBQTBCLE1BQU0sU0FBUyx5QkFBeUI7Q0FDeEUsTUFBTSxRQUFRLE1BQU0sU0FBUyxPQUFPO0NBQ3BDLE1BQU0sZUFBZSxNQUFNLFNBQVMsY0FBYztDQUNsRCxNQUFNLHNCQUFzQixNQUFNLFNBQVMscUJBQXFCO0NBQ2hFLE1BQU0sQ0FBQyxzQkFBc0IsMkJBQUEsYUFBaUMsU0FBUyxDQUFDO0NBQ3hFLE1BQU0sQ0FBQyxzQkFBc0IsMkJBQUEsYUFBaUMsU0FBUyxDQUFDO0NBQ3hFLE1BQU0sWUFBWSx5QkFBeUI7Q0FDM0MsTUFBTSxVQUFVLFdBQVcscUJBQXFCO0VBQzlDLG9CQUFvQjtHQUNsQixJQUFJLE1BQU0sUUFBUSxvQkFBb0IsV0FBVyxNQUFNLFFBQVEsWUFBWSxTQUN6RSxPQUFPO0dBSVQsT0FBTztJQUNMLE9BQU8sVUFBVSxlQUFlLFdBQVc7SUFDM0MsT0FBTztHQUNUO0VBQ0Y7RUFDQSxhQUFhLE9BQU87R0FDbEIsSUFBSSxDQUFDLE1BQU0sUUFBUSx1QkFBdUIsU0FDeEMsT0FBTztHQUtULElBQUksWUFBWSxTQUFTLE1BQU0sV0FBVyxHQUN4QyxPQUFPO0dBRVQsSUFBSSxhQUFhLFNBQVMsTUFBTSxRQUFRLFdBQVcsR0FDakQsT0FBTztHQUVULE1BQU0sU0FBUyxVQUFVLEtBQUs7R0FDOUIsSUFBSSxhQUFhLENBQUMseUJBQXlCO0lBQ3pDLE1BQU0sY0FBYztJQUlwQixJQUFJLE9BQ0YsT0FBTyxNQUFNLFFBQVEsb0JBQW9CLFdBQVcsTUFBTSxRQUFRLFlBQVksVUFBVSxNQUFNLFFBQVEsb0JBQW9CLFlBQVksZUFBZSxNQUFNLFFBQVEsWUFBWSxZQUFZLGVBQWUsU0FBUyxhQUFhLFlBQVksS0FBSyxDQUFDLGFBQWEsYUFBYSxxQkFBcUIsSUFBSTtJQUV2UyxPQUFPO0dBQ1Q7R0FDQSxPQUFPO0VBQ1Q7RUFDQSxXQUFXO0NBQ2IsQ0FBQztDQUNELGNBQWMsUUFBUSxVQUFVLE1BQU0sWUFBWTtDQUdsRCxNQUFNLG1CQUFtQix1QkFBdUIsYUFBYSxnQkFBZ0I7RUFDM0Usd0JBQXdCLFdBQVc7RUFDbkMsd0JBQXdCLFdBQVc7Q0FDckMsQ0FBQztDQUNELE1BQU0sbUJBQW1CLDZCQUE2QjtFQUNwRCx3QkFBd0IsQ0FBQztFQUN6Qix3QkFBd0IsQ0FBQztDQUMzQixDQUFDO0NBR0QsYUFBTSxnQkFBZ0I7RUFDcEIsSUFBSSxlQUFlLHNCQUFzQixNQUN2QyxjQUFjLG1CQUFtQix1QkFBdUIsR0FBRyx3QkFBd0IsV0FBVyxJQUFJLEVBQUU7RUFFdEcsSUFBSSxlQUFlLHVCQUF1QixDQUFDLE1BQ3pDLGNBQWMsb0JBQW9CO0VBRXBDLGFBQWE7R0FDWCxJQUFJLGVBQWUsdUJBQXVCLE1BQ3hDLGNBQWMsb0JBQW9CO0VBRXRDO0NBQ0YsR0FBRztFQUFDO0VBQVU7RUFBTTtFQUFzQjtFQUFzQjtDQUFhLENBQUM7Q0FDOUUsTUFBTSxxQkFBcUIsUUFBUSxhQUFhO0NBQ2hELE1BQU0sdUJBQXVCLFFBQVEsV0FBVztDQUNoRCxNQUFNLGFBQUEsYUFBbUIsY0FBYyxXQUFXLHVCQUF1QixRQUFRLFFBQVEsR0FBRyxDQUFDLFFBQVEsUUFBUSxDQUFDO0NBQzlHLHlCQUF5QixPQUFPO0VBQzlCO0VBQ0E7RUFDQTtFQUNBLHVCQUF1QjtFQUN2Qix1QkFBdUI7Q0FDekIsQ0FBQztDQUNELE9BQU87QUFDVDs7O0FDOUhBLElBQU0sWUFBWTtDQUNoQixHQUFHO0NBQ0gsT0FBTyxnQkFBZSxVQUFTLE1BQU0sS0FBSztDQUMxQyxRQUFRLGdCQUFlLFVBQVMsTUFBTSxNQUFNO0NBQzVDLHVCQUF1QixnQkFBZSxVQUFTLE1BQU0scUJBQXFCO0NBQzFFLHVCQUF1QixnQkFBZSxVQUFTLE1BQU0scUJBQXFCO0NBQzFFLHlCQUF5QixnQkFBZSxVQUFTLE1BQU0sdUJBQXVCO0NBQzlFLFlBQVksZ0JBQWUsVUFBUyxNQUFNLFVBQVU7Q0FDcEQsc0JBQXNCLGdCQUFlLFVBQVMsTUFBTSxvQkFBb0I7Q0FDeEUsZ0JBQWdCLGdCQUFlLFVBQVMsTUFBTSxjQUFjO0NBQzVELGlCQUFpQixnQkFBZSxVQUFTLE1BQU0sZUFBZTtDQUM5RCxNQUFNLGdCQUFlLFVBQVMsTUFBTSxJQUFJO0FBQzFDO0FBQ0EsSUFBYSxjQUFiLE1BQWEsb0JBQW9CLFdBQVc7Q0FDMUMsWUFBWSxjQUFjLFlBQVksU0FBUyxPQUFPO0VBQ3BELE1BQU0sa0JBQWtCLElBQUksZ0JBQWdCO0VBQzVDLE1BQU0sUUFBUSxtQkFBbUIsWUFBWTtFQUM3QyxNQUFNLHNCQUFzQiwrQkFBK0IsaUJBQWlCLFlBQVksTUFBTTtFQUM5RixNQUFNLE9BQU87R0FDWCxVQUF1QiwyQkFBTSxVQUFVO0dBQ3ZDLGFBQTBCLDJCQUFNLFVBQVU7R0FDMUMscUJBQWtDLDJCQUFNLFVBQVU7R0FDbEQsd0JBQXdCLEVBQ3RCLFNBQVMsS0FDWDtHQUNBO0dBQ0EsY0FBYyxLQUFBO0dBQ2Qsc0JBQXNCLEtBQUE7RUFDeEIsR0FBRyxTQUFTO0NBQ2Q7Q0FDQSxXQUFXLFVBQVUsaUJBQWlCO0VBQ3BDLGFBQWEsOEJBQThCO0dBQ3pDLEtBQUssSUFBSSw0QkFBNEIsSUFBSTtFQUMzQztFQUNBLElBQUksQ0FBQyxZQUFZLGFBQWEsV0FBVyxRQUFRLEtBQUssTUFBTSxtQkFBbUIsTUFHN0UsYUFBYSxVQUFVLEtBQUssTUFBTSx3QkFBd0IsS0FBQTtFQUU1RCxLQUFLLFFBQVEsZUFBZSxVQUFVLFlBQVk7RUFDbEQsSUFBSSxhQUFhLFlBQ2Y7RUFFRixLQUFLLE1BQU0sb0JBQW9CLG1CQUFtQixVQUFVLFlBQVk7RUFDeEUsTUFBTSxlQUFlLEVBQ25CLE1BQU0sU0FDUjtFQUNBLG9CQUFvQixjQUFjLFVBQVUsYUFBYSxPQUFPO0VBQ2hFLEtBQUssT0FBTyxZQUFZO0NBQzFCO0NBQ0EsT0FBTyxTQUFTLGVBQWUsY0FBYztFQUszQyxPQUhjLGNBQWMsZ0JBQWdCLFlBQVksV0FBVyxJQUFJLFlBQVksY0FBYyxZQUFZLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQztDQUk5SDtBQUNGO0FBQ0EsU0FBUyxtQkFBbUIsZUFBZSxDQUFDLEdBQUc7Q0FDN0MsT0FBTztFQUNMLEdBQUcsNkJBQTZCO0VBQ2hDLE9BQU87RUFDUCx5QkFBeUI7RUFDekIsY0FBYztFQUNkLGlCQUFpQjtFQUNqQixzQkFBc0IsS0FBQTtFQUN0QixnQkFBZ0IsS0FBQTtFQUNoQixZQUFZO0VBQ1osUUFBUTtFQUNSLHVCQUF1QjtFQUN2Qix1QkFBdUI7RUFDdkIsTUFBTTtFQUNOLEdBQUc7Q0FDTDtBQUNGOzs7QUNyRUEsU0FBZ0Isb0JBQW9CLE9BQU8sT0FBTyxVQUFVO0NBQzFELE1BQU0sRUFDSixVQUNBLE1BQU0sVUFDTixjQUFjLE9BQ2QsY0FDQSxzQkFDQSx5QkFBeUIsOEJBQThCLE9BQ3ZELE9BQU8sWUFBWSxNQUNuQixZQUNBLFFBQ0EsV0FBVyxlQUNYLGtCQUFrQix1QkFBdUIsU0FDdkM7Q0FDSixNQUFNLFdBQVcsU0FBUztDQUMxQixNQUFNLGdCQUFnQixTQUFTO0NBQy9CLE1BQU0sUUFBUSxnQkFBZ0IsT0FBTztDQUNyQyxNQUFNLDBCQUEwQixpQkFBaUI7Q0FDakQsTUFBTSxPQUFPLGdCQUFnQixnQkFBZ0I7Q0FDN0MsTUFBTSwwQkFBMEIscUJBQXFCLElBQUk7Q0FFekQsTUFBTSxZQUFZO0VBQ2hCO0VBQ0E7RUFDQSxRQUphLFFBQVEsdUJBSWhCO0VBQ0w7Q0FDRjtDQUNBLE1BQU0sUUFBUSxZQUFZLFNBQVMsUUFBUSxPQUFPO0VBQ2hELE1BQU07RUFDTjtFQUNBLGlCQUFpQjtFQUNqQjtFQUNBLEdBQUc7Q0FDTCxDQUFDO0NBR0QsdUJBQXVCO0VBQ3JCLE1BQU0sWUFBWSxhQUFhLEtBQUEsS0FBYSxNQUFNLE1BQU0sU0FBUyxTQUFTLGdCQUFnQixPQUFPO0dBQy9GLE1BQU07R0FDTixpQkFBaUI7RUFDbkIsSUFBSTtFQUNKLElBQUksZUFFRixNQUFNLE9BQU8sWUFBWTtHQUN2QixHQUFHO0dBQ0gsR0FBRztFQUNMLElBQUksU0FBUztPQUNSLElBQUksV0FDVCxNQUFNLE9BQU8sU0FBUztDQUUxQixDQUFDO0NBQ0QsTUFBTSxrQkFBa0IsWUFBWSxRQUFRO0NBQzVDLE1BQU0sa0JBQWtCLGlCQUFpQixhQUFhO0NBQ3RELE1BQU0sZ0JBQWdCLFNBQVM7Q0FDL0IsTUFBTSxtQkFBbUIsZ0JBQWdCLFlBQVk7Q0FDckQsTUFBTSxtQkFBbUIsd0JBQXdCLG9CQUFvQjtDQUNyRSxNQUFNLE9BQU8sTUFBTSxTQUFTLE1BQU07Q0FDbEMsTUFBTSxVQUFVLE1BQU0sU0FBUyxTQUFTO0NBQ3hDLE1BQU0sVUFBVSxNQUFNLFNBQVMsU0FBUztDQUN4QyxNQUFNLGFBQWEsY0FBYztFQUMvQjtFQUNBO0VBQ0EsZUFBZSx5QkFBeUIsTUFBTTtFQUM5QztDQUNGLENBQUM7Q0FDRCxNQUFNLDJCQUEyQixRQUFRO0NBQ3pDLE1BQU0sZUFBQSxhQUFxQixlQUFlLEVBQ3hDLE1BQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQztDQUNYLE9BQW9CLGVBQUEsR0FBQSxtQkFBQSxJQUFBLENBQUssZ0JBQWdCLFVBQVU7RUFDakQsT0FBTztFQUNQLFVBQXVCLGVBQUEsR0FBQSxtQkFBQSxLQUFBLENBQU0sa0JBQWtCLFVBQVU7R0FDdkQsT0FBTztHQUNQLFVBQVUsQ0FBQyw0QkFBeUMsZUFBQSxHQUFBLG1CQUFBLElBQUEsQ0FBSyxvQkFBb0I7SUFDcEU7SUFDSztHQUNkLENBQUMsR0FBRyxPQUFPLGFBQWEsYUFBYSxTQUFTLEVBQzVDLFFBQ0YsQ0FBQyxJQUFJLFFBQVE7RUFDZixDQUFDO0NBQ0gsQ0FBQztBQUNIOzs7Ozs7Ozs7QUM3RUEsU0FBZ0IsV0FBVyxPQUFPO0NBRWhDLE9BQU8sb0JBQW9CLE9BRHJCLGFBQWEsV0FBVyxlQUFlLElBQUksV0FBVyxRQUN0QjtBQUN4Qzs7O0FDZEEsSUFBVywrQkFBK0IsU0FBVSw4QkFBOEI7Ozs7Q0FJaEYsNkJBQTZCLDZCQUE2QixVQUFVLDBCQUEwQixRQUFROzs7O0NBSXRHLDZCQUE2Qiw2QkFBNkIsWUFBWSwwQkFBMEIsVUFBVTs7OztDQUkxRyw2QkFBNkIsNkJBQTZCLG1CQUFtQiwwQkFBMEIsaUJBQWlCOzs7O0NBSXhILDZCQUE2Qiw2QkFBNkIsaUJBQWlCLDBCQUEwQixlQUFlOzs7O0NBSXBILDZCQUE2QixZQUFZOzs7O0NBSXpDLDZCQUE2QixzQkFBc0I7Q0FDbkQsT0FBTztBQUNULEVBQUUsQ0FBQyxDQUFDOzs7QUNsQkosSUFBTSx5QkFBeUI7Q0FDN0IsR0FBR0M7Q0FDSCxHQUFHO0NBQ0gsT0FBTyxPQUFPO0VBQ1osT0FBTyxRQUFRLEdBQ1osNkJBQTZCLFNBQVMsR0FDekMsSUFBSTtDQUNOO0NBQ0EsaUJBQWlCLE9BQU87RUFDdEIsT0FBTyxRQUFRLEdBQ1osNkJBQTZCLG1CQUFtQixHQUNuRCxJQUFJO0NBQ047QUFDRjs7Ozs7OztBQVFBLElBQWEsaUJBQThCLDJCQUFNLFdBQVcsU0FBUyxlQUFlLGdCQUFnQixjQUFjO0NBQ2hILE1BQU0sRUFDSixRQUNBLFdBQ0EsT0FDQSxVQUNBLEdBQUcsaUJBQ0Q7Q0FDSixNQUFNLGNBQWMsdUJBQXVCO0NBQzNDLE1BQU0sRUFDSixVQUNFLHFCQUFxQjtDQUN6QixNQUFNLE9BQU8sTUFBTSxTQUFTLE1BQU07Q0FDbEMsTUFBTSxTQUFTLE1BQU0sU0FBUyxRQUFRO0NBQ3RDLE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxrQkFBa0I7Q0FDMUQsTUFBTSx3QkFBd0IsTUFBTSxTQUFTLHVCQUF1QjtDQUNwRSxNQUFNLFVBQVUsTUFBTSxTQUFTLFNBQVM7Q0FDeEMsTUFBTSxxQkFBcUIsTUFBTSxlQUFlLGlCQUFpQjtDQVNqRSxPQUFPLGlCQUFpQixPQUFPLGdCQUFnQjtFQUM3QyxTQUZtQixlQUFlO0VBR2xDLE9BQUE7R0FSQTtHQUNBO0dBQ0E7R0FDQSxrQkFMdUIsd0JBQXdCO0VBVTNDO0VBQ0osS0FBSyxDQUFDLGNBQWMsa0JBQWtCO0VBQ3RDO0VBQ0EsT0FBTyxDQUFDO0dBQ04sTUFBTTtHQUNOLFFBQVEsQ0FBQztHQUNULE9BQU8sRUFDTCxlQUFlLENBQUMsT0FBTyxTQUFTLEtBQUEsRUFDbEM7R0FDQTtFQUNGLEdBQUcsWUFBWTtDQUNqQixDQUFDO0FBQ0gsQ0FBQztBQUMwQyxlQUFlLGNBQWM7Ozs7Ozs7OztBQzNEeEUsSUFBYSxjQUEyQiwyQkFBTSxXQUFXLFNBQVMsWUFBWSxnQkFBZ0IsY0FBYztDQUMxRyxNQUFNLEVBQ0osUUFDQSxXQUNBLE9BQ0EsSUFBSSxRQUNKLEdBQUcsaUJBQ0Q7Q0FDSixNQUFNLEVBQ0osVUFDRSxxQkFBcUI7Q0FDekIsTUFBTSxLQUFLLFlBQVksTUFBTTtDQUM3QixNQUFNLDBCQUEwQixrQkFBa0IsRUFBRTtDQUNwRCxPQUFPLGlCQUFpQixNQUFNLGdCQUFnQjtFQUM1QyxLQUFLO0VBQ0wsT0FBTyxDQUFDLEVBQ04sR0FDRixHQUFHLFlBQVk7Q0FDakIsQ0FBQztBQUNILENBQUM7QUFDMEMsWUFBWSxjQUFjOzs7Ozs7Ozs7QUNackUsSUFBYSxnQkFBNkIsMkJBQU0sV0FBVyxTQUFTLGNBQWMsZ0JBQWdCLGNBQWM7Q0FDOUcsTUFBTSxFQUNKLFFBQ0EsV0FDQSxPQUNBLFdBQVcsT0FDWCxlQUFlLE1BQ2YsSUFBSSxRQUNKLFNBQ0EsUUFDQSxHQUFHLGlCQUNEO0NBQ0osTUFBTSxvQkFBb0IscUJBQXFCLElBQUk7Q0FDbkQsTUFBTSxRQUFRLFFBQVEsU0FBUyxtQkFBbUI7Q0FDbEQsSUFBSSxDQUFDLE9BQ0gsTUFBTSxJQUFJLE1BQThDLHdGQUFrSDtDQUU1SyxNQUFNLGdCQUFnQixZQUFZLE1BQU07Q0FDeEMsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLHFCQUFxQjtDQUM1RCxNQUFNLHdCQUF3QixNQUFNLFNBQVMscUJBQXFCLGFBQWE7Q0FDL0UsTUFBTSxVQUFVLE1BQU0sU0FBUyxrQkFBa0IsYUFBYTtDQUM5RCxNQUFNLG9CQUFBLGFBQTBCLE9BQU8sSUFBSTtDQUMzQyxNQUFNLEVBQ0osaUJBQ0EsMkJBQ0UseUJBQXlCLGVBQWUsbUJBQW1CLE9BQU8sRUFDcEUsUUFDRixDQUFDO0NBQ0QsTUFBTSxFQUNKLGdCQUNBLGNBQ0UsVUFBVTtFQUNaO0VBQ0EsUUFBUTtDQUNWLENBQUM7Q0FDRCxNQUFNLFFBQVEsU0FBUyxpQkFBaUIsRUFDdEMsU0FBUyxtQkFBbUIsS0FDOUIsQ0FBQztDQUNELE1BQU0sdUJBQXVCLGdDQUFnQyxNQUFNLE9BQU8sTUFBTSxJQUFHLG9CQUFtQjtFQUNwRyxNQUFNLElBQUksY0FBYyxlQUFlO0NBQ3pDLENBQUM7Q0FDRCxNQUFNLFFBQVE7RUFDWjtFQUNBLE1BQU07Q0FDUjtDQUNBLE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxnQkFBZ0Isc0JBQXNCO0NBQzlFLE9BQU8saUJBQWlCLFVBQVUsZ0JBQWdCO0VBQ2hEO0VBQ0EsS0FBSztHQUFDO0dBQVc7R0FBYztHQUFpQjtFQUFpQjtFQUNqRSxPQUFPO0dBQUMsTUFBTTtHQUFXO0dBQWtCO0dBQXNCO0tBQzlELDJCQUEyQjtJQUM1QixJQUFJO0lBQ0osaUJBQWlCO0lBQ2pCLGlCQUFpQjtJQUNqQixpQkFBaUI7R0FDbkI7R0FBRztHQUFjO0VBQWM7RUFDL0Isd0JBQXdCO0NBQzFCLENBQUM7QUFDSCxDQUFDO0FBQzBDLGNBQWMsY0FBYzs7Ozs7O0FDeEV2RSxJQUFhLGVBQWIsTUFBMEI7Ozs7O0NBTXhCLFlBQVksT0FBTztFQUNqQixLQUFLLFFBQVEsU0FBUyxJQUFJLFlBQVk7Q0FDeEM7Ozs7Ozs7OztDQVVBLEtBQUssV0FBVztFQUNkLE1BQU0saUJBQWlCLFlBQVksS0FBSyxNQUFNLFFBQVEsZ0JBQWdCLFFBQVEsU0FBUyxJQUFJLEtBQUE7RUFFekYsSUFBSSxhQUFhLENBQUMsZ0JBQ2hCLFFBQVEsS0FBSyx5REFBeUQsVUFBVSxpRkFBaUY7RUFHckssS0FBSyxNQUFNLFFBQVEsTUFBTSx5QkFBeUJDLGtCQUEwQixLQUFBLEdBQVcsY0FBYyxDQUFDO0NBQ3hHOzs7Ozs7O0NBUUEsZ0JBQWdCLFNBQVM7RUFDdkIsS0FBSyxNQUFNLElBQUksV0FBVyxPQUFPO0VBQ2pDLEtBQUssTUFBTSxRQUFRLE1BQU0seUJBQXlCQSxrQkFBMEIsS0FBQSxHQUFXLEtBQUEsQ0FBUyxDQUFDO0NBQ25HOzs7O0NBS0EsUUFBUTtFQUNOLEtBQUssTUFBTSxRQUFRLE9BQU8seUJBQXlCQSxrQkFBMEIsS0FBQSxHQUFXLEtBQUEsQ0FBUyxDQUFDO0NBQ3BHOzs7O0NBS0EsSUFBSSxTQUFTO0VBQ1gsT0FBTyxLQUFLLE1BQU0sT0FBTyxNQUFNO0NBQ2pDO0FBQ0Y7Ozs7QUFLQSxTQUFnQixxQkFBcUI7Q0FDbkMsT0FBTyxJQUFJLGFBQWE7QUFDMUIiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOF19