import { i as __toESM, n as __exportAll } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_react_dom } from "/node_modules/.vite/deps/react-dom.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
import { _ as isLastTraversableNode, f as getParentNode, g as isHTMLElement, h as isElement, i as SafeReact, p as getWindow, r as useStableCallback, t as useIsoLayoutEffect } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { a as warn, c as useRefWithInit, i as NOOP, n as EMPTY_ARRAY, r as EMPTY_OBJECT, s as useMergedRefs, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { r as mergeProps } from "/node_modules/.vite/deps/merge-props-CugWwp_i.js?v=1d2f6f90";
import { r as useCompositeRootContext, t as useButton } from "/node_modules/.vite/deps/useButton-ydNp_PBX.js?v=1d2f6f90";
import { Z as useAnimationFrame, _ as useAnimationsFinished, _t as transitionStatusMapping, at as isMouseLikePointerType, ft as isMac, g as useOpenChangeComplete, ht as useOnMount, pt as isSafari, s as COMPOSITE_KEYS, t as inertValue, v as useTransitionStatus } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { $ as isTypeableElement, A as useFloatingParentNodeId, B as getNodeChildren, C as createSelector, D as FloatingNode, E as FloatingFocusManager, G as FocusGuard, H as getTabbableAfterElement, I as DROPDOWN_COLLISION_AVOIDANCE, J as addEventListener, K as useValueAsRef, L as POPUP_COLLISION_AVOIDANCE, M as FloatingTreeStore, N as FloatingPortal, O as FloatingTree, S as fastComponentRef, T as useClick, U as getTabbableBeforeElement, V as getNextTabbable, W as isOutsideEvent, X as isInteractiveElement, Z as isTargetInsideEnabledTrigger, a as InternalBackdrop, at as pressableTriggerOpenStateMapping, d as usePopupInteractionProps, et as matchesFocusVisible, g as useSyncedFloatingRootContext, h as useTriggerRegistration, i as useOnFirstRender, it as popupStateMapping, j as useFloatingTree, k as useFloatingNodeId, l as useImplicitActiveTrigger, m as useTriggerDataForwarding, nt as useTimeout, o as PopupTriggerMap, ot as triggerOpenStateMapping, q as mergeCleanups, s as FOCUSABLE_POPUP_PROPS, t as useOpenInteractionType, tt as Timeout, u as useOpenStateTransitions, v as ReactStore, w as useDismiss, x as fastComponent, z as createAttribute } from "/node_modules/.vite/deps/useOpenInteractionType-CzC_cFBM.js?v=1d2f6f90";
import { _ as triggerFocus, c as focusOut, d as itemPress, g as siblingOpen, i as cancelOpen, l as imperativeAction, n as useId, r as createChangeEventDetails, t as useBaseUiId, v as triggerHover } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, n as activeElement, r as contains, t as ownerDocument } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { a as useAnchorPositioning, c as useToolbarRootContext, i as usePositioner, l as useTypeahead, n as getPseudoElementBounds, o as adaptiveOrigin, r as useAnchoredPopupScrollLock, s as getDisabledMountTransitionStyles, t as usePreviousValue, u as useListNavigation } from "/node_modules/.vite/deps/usePreviousValue-BfCdXD14.js?v=1d2f6f90";
import { r as popupStoreSelectors, t as createInitialPopupStoreState } from "/node_modules/.vite/deps/store-CyrVVQa_.js?v=1d2f6f90";
import { t as useControlled } from "/node_modules/.vite/deps/useControlled-C4c2dELU.js?v=1d2f6f90";
import { i as useCompositeListItem, n as useDirection, t as CompositeList } from "/node_modules/.vite/deps/CompositeList-CuwZ14So.js?v=1d2f6f90";
import { n as getCssDimensions, r as useCompositeItem, t as isElementDisabled } from "/node_modules/.vite/deps/isElementDisabled-Bv1KwLAu.js?v=1d2f6f90";
import { t as Separator } from "/node_modules/.vite/deps/Separator-DBUukXTn.js?v=1d2f6f90";
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useHoverShared.js
function resolveValue(value, pointerType) {
	if (pointerType != null && !isMouseLikePointerType(pointerType)) return 0;
	if (typeof value === "function") return value();
	return value;
}
function getDelay(value, prop, pointerType) {
	const result = resolveValue(value, pointerType);
	if (typeof result === "number") return result;
	return result?.[prop];
}
function getRestMs(value) {
	if (typeof value === "function") return value();
	return value;
}
function isClickLikeOpenEvent(openEventType, interactedInside) {
	return interactedInside || openEventType === "click" || openEventType === "mousedown";
}
function isHoverOpenEvent(openEventType) {
	return openEventType?.includes("mouse") && openEventType !== "mousedown";
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useFocus.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var isMacSafari = isMac && isSafari;
/**
* Opens the floating element while the reference element has focus, like CSS
* `:focus`.
* @see https://floating-ui.com/docs/useFocus
*/
function useFocus(context, props = {}) {
	const { enabled = true, delay } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const { events, dataRef } = store.context;
	const blockFocusRef = import_react.useRef(false);
	const blockedReferenceRef = import_react.useRef(null);
	const keyboardModalityRef = import_react.useRef(true);
	const timeout = useTimeout();
	import_react.useEffect(() => {
		const domReference = store.select("domReferenceElement");
		if (!enabled) return;
		const win = getWindow(domReference);
		function onBlur() {
			const currentDomReference = store.select("domReferenceElement");
			if (!store.select("open") && isHTMLElement(currentDomReference) && currentDomReference === activeElement(ownerDocument(currentDomReference))) blockFocusRef.current = true;
		}
		function onKeyDown() {
			keyboardModalityRef.current = true;
		}
		function onPointerDown() {
			keyboardModalityRef.current = false;
		}
		return mergeCleanups(addEventListener(win, "blur", onBlur), isMacSafari && addEventListener(win, "keydown", onKeyDown, true), isMacSafari && addEventListener(win, "pointerdown", onPointerDown, true));
	}, [store, enabled]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function onOpenChangeLocal(details) {
			if (details.reason === "trigger-press" || details.reason === "escape-key") {
				const referenceElement = store.select("domReferenceElement");
				if (isElement(referenceElement)) {
					blockedReferenceRef.current = referenceElement;
					blockFocusRef.current = true;
				}
			}
		}
		events.on("openchange", onOpenChangeLocal);
		return () => {
			events.off("openchange", onOpenChangeLocal);
		};
	}, [
		events,
		enabled,
		store
	]);
	const reference = import_react.useMemo(() => {
		function resetBlockedFocus() {
			blockFocusRef.current = false;
			blockedReferenceRef.current = null;
		}
		return {
			onMouseLeave() {
				resetBlockedFocus();
			},
			onFocus(event) {
				const focusTarget = event.currentTarget;
				if (blockFocusRef.current) {
					if (blockedReferenceRef.current === focusTarget) return;
					resetBlockedFocus();
				}
				const target = getTarget(event.nativeEvent);
				if (isElement(target)) {
					if (isMacSafari && !event.relatedTarget) {
						if (!keyboardModalityRef.current && !isTypeableElement(target)) return;
					} else if (!matchesFocusVisible(target)) return;
				}
				const movedFromOtherEnabledTrigger = isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements);
				const { nativeEvent, currentTarget } = event;
				const delayValue = typeof delay === "function" ? delay() : delay;
				if (store.select("open") && movedFromOtherEnabledTrigger || delayValue === 0 || delayValue === void 0) {
					store.setOpen(true, createChangeEventDetails(triggerFocus, nativeEvent, currentTarget));
					return;
				}
				timeout.start(delayValue, () => {
					if (blockFocusRef.current) return;
					store.setOpen(true, createChangeEventDetails(triggerFocus, nativeEvent, currentTarget));
				});
			},
			onBlur(event) {
				resetBlockedFocus();
				const relatedTarget = event.relatedTarget;
				const nativeEvent = event.nativeEvent;
				const movedToFocusGuard = isElement(relatedTarget) && relatedTarget.hasAttribute(createAttribute("focus-guard")) && relatedTarget.getAttribute("data-type") === "outside";
				timeout.start(0, () => {
					const domReference = store.select("domReferenceElement");
					const activeEl = activeElement(ownerDocument(domReference));
					if (!relatedTarget && activeEl === domReference) return;
					if (contains(dataRef.current.floatingContext?.refs.floating.current, activeEl) || contains(domReference, activeEl) || movedToFocusGuard) return;
					if (isTargetInsideEnabledTrigger(relatedTarget ?? activeEl, store.context.triggerElements)) return;
					store.setOpen(false, createChangeEventDetails(triggerFocus, nativeEvent));
				});
			}
		};
	}, [
		dataRef,
		delay,
		store,
		timeout
	]);
	return import_react.useMemo(() => enabled ? {
		reference,
		trigger: reference
	} : {}, [enabled, reference]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useHoverInteractionSharedState.js
var HoverInteraction = class HoverInteraction {
	constructor() {
		this.pointerType = void 0;
		this.interactedInside = false;
		this.handler = void 0;
		this.blockMouseMove = true;
		this.performedPointerEventsMutation = false;
		this.pointerEventsScopeElement = null;
		this.pointerEventsReferenceElement = null;
		this.pointerEventsFloatingElement = null;
		this.restTimeoutPending = false;
		this.openChangeTimeout = new Timeout();
		this.restTimeout = new Timeout();
		this.handleCloseOptions = void 0;
	}
	static create() {
		return new HoverInteraction();
	}
	dispose = () => {
		this.openChangeTimeout.clear();
		this.restTimeout.clear();
	};
	disposeEffect = () => {
		return this.dispose;
	};
};
var pointerEventsMutationOwnerByScopeElement = /* @__PURE__ */ new WeakMap();
function clearSafePolygonPointerEventsMutation(instance) {
	if (!instance.performedPointerEventsMutation) return;
	const scopeElement = instance.pointerEventsScopeElement;
	if (scopeElement && pointerEventsMutationOwnerByScopeElement.get(scopeElement) === instance) {
		instance.pointerEventsScopeElement?.style.removeProperty("pointer-events");
		instance.pointerEventsReferenceElement?.style.removeProperty("pointer-events");
		instance.pointerEventsFloatingElement?.style.removeProperty("pointer-events");
		pointerEventsMutationOwnerByScopeElement.delete(scopeElement);
	}
	instance.performedPointerEventsMutation = false;
	instance.pointerEventsScopeElement = null;
	instance.pointerEventsReferenceElement = null;
	instance.pointerEventsFloatingElement = null;
}
function applySafePolygonPointerEventsMutation(instance, options) {
	const { scopeElement, referenceElement, floatingElement } = options;
	const existingOwner = pointerEventsMutationOwnerByScopeElement.get(scopeElement);
	if (existingOwner && existingOwner !== instance) clearSafePolygonPointerEventsMutation(existingOwner);
	clearSafePolygonPointerEventsMutation(instance);
	instance.performedPointerEventsMutation = true;
	instance.pointerEventsScopeElement = scopeElement;
	instance.pointerEventsReferenceElement = referenceElement;
	instance.pointerEventsFloatingElement = floatingElement;
	pointerEventsMutationOwnerByScopeElement.set(scopeElement, instance);
	scopeElement.style.pointerEvents = "none";
	referenceElement.style.pointerEvents = "auto";
	floatingElement.style.pointerEvents = "auto";
}
function useHoverInteractionSharedState(store) {
	const data = store.context.dataRef.current;
	const instance = useRefWithInit(() => data.hoverInteractionState ?? HoverInteraction.create()).current;
	if (!data.hoverInteractionState) data.hoverInteractionState = instance;
	useOnMount(data.hoverInteractionState.disposeEffect);
	return data.hoverInteractionState;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useHoverFloatingInteraction.js
/**
* Provides hover interactions that should be attached to the floating element.
*/
function useHoverFloatingInteraction(context, parameters = {}) {
	const { enabled = true, closeDelay: closeDelayProp = 0, nodeId: nodeIdProp } = parameters;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const { dataRef } = store.context;
	const tree = useFloatingTree();
	const parentId = useFloatingParentNodeId();
	const instance = useHoverInteractionSharedState(store);
	const childClosedTimeout = useTimeout();
	const isClickLikeOpenEvent$2 = useStableCallback(() => {
		return isClickLikeOpenEvent(dataRef.current.openEvent?.type, instance.interactedInside);
	});
	const isHoverOpen = useStableCallback(() => {
		return isHoverOpenEvent(dataRef.current.openEvent?.type);
	});
	const clearPointerEvents = useStableCallback(() => {
		clearSafePolygonPointerEventsMutation(instance);
	});
	useIsoLayoutEffect(() => {
		if (!open) {
			instance.pointerType = void 0;
			instance.restTimeoutPending = false;
			instance.interactedInside = false;
			clearPointerEvents();
		}
	}, [
		open,
		instance,
		clearPointerEvents
	]);
	import_react.useEffect(() => {
		return clearPointerEvents;
	}, [clearPointerEvents]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (open && instance.handleCloseOptions?.blockPointerEvents && isHoverOpen() && isElement(domReferenceElement) && floatingElement) {
			const ref = domReferenceElement;
			const floatingEl = floatingElement;
			const doc = ownerDocument(floatingElement);
			const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context?.elements.floating;
			if (parentFloating) parentFloating.style.pointerEvents = "";
			const cachedScopeElement = instance.pointerEventsScopeElement !== floatingEl ? instance.pointerEventsScopeElement : null;
			const parentScopeElement = parentFloating !== floatingEl ? parentFloating : null;
			const scopeElement = instance.handleCloseOptions?.getScope?.() ?? cachedScopeElement ?? parentScopeElement ?? ref.closest("[data-rootownerid]") ?? doc.body;
			applySafePolygonPointerEventsMutation(instance, {
				scopeElement,
				referenceElement: ref,
				floatingElement: floatingEl
			});
			return () => {
				clearPointerEvents();
			};
		}
	}, [
		enabled,
		open,
		domReferenceElement,
		floatingElement,
		instance,
		isHoverOpen,
		tree,
		parentId,
		clearPointerEvents
	]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function hasParentChildren() {
			return !!(tree && parentId && getNodeChildren(tree.nodesRef.current, parentId).length > 0);
		}
		function closeWithDelay(event) {
			const closeDelay = getDelay(closeDelayProp, "close", instance.pointerType);
			const close = () => {
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			};
			if (closeDelay) instance.openChangeTimeout.start(closeDelay, close);
			else {
				instance.openChangeTimeout.clear();
				close();
			}
		}
		function handleInteractInside(event) {
			const target = getTarget(event);
			if (!isInteractiveElement(target)) {
				instance.interactedInside = false;
				return;
			}
			instance.interactedInside = target?.closest("[aria-haspopup]") != null;
		}
		function onFloatingMouseEnter() {
			instance.openChangeTimeout.clear();
			childClosedTimeout.clear();
			tree?.events.off("floating.closed", onNodeClosed);
			clearPointerEvents();
		}
		function onFloatingMouseLeave(event) {
			if (hasParentChildren() && tree) {
				tree.events.on("floating.closed", onNodeClosed);
				return;
			}
			if (isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) return;
			const currentNodeId = dataRef.current.floatingContext?.nodeId ?? nodeIdProp;
			const relatedTarget = event.relatedTarget;
			if (tree && currentNodeId && isElement(relatedTarget) && getNodeChildren(tree.nodesRef.current, currentNodeId, false).some((node) => contains(node.context?.elements.floating, relatedTarget))) return;
			if (instance.handler) {
				instance.handler(event);
				return;
			}
			clearPointerEvents();
			if (!isClickLikeOpenEvent$2()) closeWithDelay(event);
		}
		function onNodeClosed(event) {
			if (!tree || !parentId || hasParentChildren()) return;
			childClosedTimeout.start(0, () => {
				tree.events.off("floating.closed", onNodeClosed);
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree.events.emit("floating.closed", event);
			});
		}
		const floating = floatingElement;
		return mergeCleanups(floating && addEventListener(floating, "mouseenter", onFloatingMouseEnter), floating && addEventListener(floating, "mouseleave", onFloatingMouseLeave), floating && addEventListener(floating, "pointerdown", handleInteractInside, true), () => {
			tree?.events.off("floating.closed", onNodeClosed);
		});
	}, [
		enabled,
		floatingElement,
		store,
		dataRef,
		closeDelayProp,
		nodeIdProp,
		isClickLikeOpenEvent$2,
		clearPointerEvents,
		instance,
		tree,
		parentId,
		childClosedTimeout
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useHoverReferenceInteraction.js
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var EMPTY_REF = { current: null };
/**
* Provides hover interactions that should be attached to reference or trigger
* elements.
*/
function useHoverReferenceInteraction(context, props = {}) {
	const { enabled = true, delay = 0, handleClose = null, mouseOnly = false, restMs = 0, move = true, triggerElementRef = EMPTY_REF, externalTree, isActiveTrigger = true, getHandleCloseContext, isClosing, shouldOpen: shouldOpenProp } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const { dataRef, events } = store.context;
	const tree = useFloatingTree(externalTree);
	const instance = useHoverInteractionSharedState(store);
	const isHoverCloseActiveRef = import_react.useRef(false);
	const handleCloseRef = useValueAsRef(handleClose);
	const delayRef = useValueAsRef(delay);
	const restMsRef = useValueAsRef(restMs);
	const enabledRef = useValueAsRef(enabled);
	const shouldOpenRef = useValueAsRef(shouldOpenProp);
	const isClosingRef = useValueAsRef(isClosing);
	const isClickLikeOpenEvent$1 = useStableCallback(() => {
		return isClickLikeOpenEvent(dataRef.current.openEvent?.type, instance.interactedInside);
	});
	const checkShouldOpen = useStableCallback(() => {
		return shouldOpenRef.current?.() !== false;
	});
	const isOverInactiveTrigger = useStableCallback((currentDomReference, currentTarget, target) => {
		const allTriggers = store.context.triggerElements;
		if (allTriggers.hasElement(currentTarget)) return !currentDomReference || !contains(currentDomReference, currentTarget);
		if (!isElement(target)) return false;
		const targetElement = target;
		return allTriggers.hasMatchingElement((trigger) => contains(trigger, targetElement)) && (!currentDomReference || !contains(currentDomReference, targetElement));
	});
	const cleanupMouseMoveHandler = useStableCallback(() => {
		if (!instance.handler) return;
		ownerDocument(store.select("domReferenceElement")).removeEventListener("mousemove", instance.handler);
		instance.handler = void 0;
	});
	const clearPointerEvents = useStableCallback(() => {
		clearSafePolygonPointerEventsMutation(instance);
	});
	if (isActiveTrigger) instance.handleCloseOptions = handleCloseRef.current?.__options;
	import_react.useEffect(() => cleanupMouseMoveHandler, [cleanupMouseMoveHandler]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function onOpenChangeLocal(details) {
			if (!details.open) {
				isHoverCloseActiveRef.current = details.reason === triggerHover;
				cleanupMouseMoveHandler();
				instance.openChangeTimeout.clear();
				instance.restTimeout.clear();
				instance.blockMouseMove = true;
				instance.restTimeoutPending = false;
			} else isHoverCloseActiveRef.current = false;
		}
		events.on("openchange", onOpenChangeLocal);
		return () => {
			events.off("openchange", onOpenChangeLocal);
		};
	}, [
		enabled,
		events,
		instance,
		cleanupMouseMoveHandler
	]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function closeWithDelay(event, runElseBranch = true) {
			const closeDelay = getDelay(delayRef.current, "close", instance.pointerType);
			if (closeDelay) instance.openChangeTimeout.start(closeDelay, () => {
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			});
			else if (runElseBranch) {
				instance.openChangeTimeout.clear();
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			}
		}
		const trigger = triggerElementRef.current ?? (isActiveTrigger ? store.select("domReferenceElement") : null);
		if (!isElement(trigger)) return;
		function onMouseEnter(event) {
			instance.openChangeTimeout.clear();
			instance.blockMouseMove = false;
			if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) return;
			const restMsValue = getRestMs(restMsRef.current);
			const openDelay = getDelay(delayRef.current, "open", instance.pointerType);
			const eventTarget = getTarget(event);
			const currentTarget = event.currentTarget ?? null;
			const currentDomReference = store.select("domReferenceElement");
			let triggerNode = currentTarget;
			if (isElement(eventTarget) && !store.context.triggerElements.hasElement(eventTarget)) {
				for (const triggerElement of store.context.triggerElements.elements()) if (contains(triggerElement, eventTarget)) {
					triggerNode = triggerElement;
					break;
				}
			}
			if (isElement(currentTarget) && isElement(currentDomReference) && !store.context.triggerElements.hasElement(currentTarget) && contains(currentTarget, currentDomReference)) triggerNode = currentDomReference;
			const isOverInactive = triggerNode == null ? false : isOverInactiveTrigger(currentDomReference, triggerNode, eventTarget);
			const isOpen = store.select("open");
			const isInClosingTransition = isClosingRef.current?.() ?? store.select("transitionStatus") === "ending";
			const isHoverCloseTransition = !isOpen && isInClosingTransition && isHoverCloseActiveRef.current;
			const isReenteringSameTriggerDuringCloseTransition = !isOverInactive && isElement(triggerNode) && isElement(currentDomReference) && contains(currentDomReference, triggerNode) && isHoverCloseTransition;
			const isRestOnlyDelay = restMsValue > 0 && !openDelay;
			const shouldOpenImmediately = isOverInactive && (isOpen || isHoverCloseTransition) || isReenteringSameTriggerDuringCloseTransition;
			const shouldOpen = !isOpen || isOverInactive;
			if (shouldOpenImmediately) {
				if (checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
				return;
			}
			if (isRestOnlyDelay) return;
			if (openDelay) instance.openChangeTimeout.start(openDelay, () => {
				if (shouldOpen && checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
			});
			else if (shouldOpen) {
				if (checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
			}
		}
		function onMouseLeave(event) {
			if (isClickLikeOpenEvent$1()) {
				clearPointerEvents();
				return;
			}
			cleanupMouseMoveHandler();
			const domReferenceElement = store.select("domReferenceElement");
			const doc = ownerDocument(domReferenceElement);
			instance.restTimeout.clear();
			instance.restTimeoutPending = false;
			const handleCloseContextBase = dataRef.current.floatingContext ?? getHandleCloseContext?.();
			if (isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) return;
			if (handleCloseRef.current && handleCloseContextBase) {
				if (!store.select("open")) instance.openChangeTimeout.clear();
				const currentTrigger = triggerElementRef.current;
				instance.handler = handleCloseRef.current({
					...handleCloseContextBase,
					tree,
					x: event.clientX,
					y: event.clientY,
					onClose() {
						clearPointerEvents();
						cleanupMouseMoveHandler();
						if (enabledRef.current && !isClickLikeOpenEvent$1() && currentTrigger === store.select("domReferenceElement")) closeWithDelay(event, true);
					}
				});
				doc.addEventListener("mousemove", instance.handler);
				instance.handler(event);
				return;
			}
			if (instance.pointerType === "touch" ? !contains(store.select("floatingElement"), event.relatedTarget) : true) closeWithDelay(event);
		}
		if (move) return mergeCleanups(addEventListener(trigger, "mousemove", onMouseEnter, { once: true }), addEventListener(trigger, "mouseenter", onMouseEnter), addEventListener(trigger, "mouseleave", onMouseLeave));
		return mergeCleanups(addEventListener(trigger, "mouseenter", onMouseEnter), addEventListener(trigger, "mouseleave", onMouseLeave));
	}, [
		cleanupMouseMoveHandler,
		clearPointerEvents,
		dataRef,
		delayRef,
		store,
		enabled,
		handleCloseRef,
		instance,
		isActiveTrigger,
		isOverInactiveTrigger,
		isClickLikeOpenEvent$1,
		mouseOnly,
		move,
		restMsRef,
		triggerElementRef,
		tree,
		enabledRef,
		getHandleCloseContext,
		isClosingRef,
		checkShouldOpen
	]);
	return import_react.useMemo(() => {
		if (!enabled) return;
		function setPointerRef(event) {
			instance.pointerType = event.pointerType;
		}
		return {
			onPointerDown: setPointerRef,
			onPointerEnter: setPointerRef,
			onMouseMove(event) {
				const { nativeEvent } = event;
				const trigger = event.currentTarget;
				const currentDomReference = store.select("domReferenceElement");
				const currentOpen = store.select("open");
				const isOverInactive = isOverInactiveTrigger(currentDomReference, trigger, event.target);
				if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) return;
				if (currentOpen && isOverInactive && instance.handleCloseOptions?.blockPointerEvents) {
					const floatingElement = store.select("floatingElement");
					if (floatingElement) {
						const scopeElement = instance.handleCloseOptions?.getScope?.() ?? trigger.ownerDocument.body;
						applySafePolygonPointerEventsMutation(instance, {
							scopeElement,
							referenceElement: trigger,
							floatingElement
						});
					}
				}
				const restMsValue = getRestMs(restMsRef.current);
				if (currentOpen && !isOverInactive || restMsValue === 0) return;
				if (!isOverInactive && instance.restTimeoutPending && event.movementX ** 2 + event.movementY ** 2 < 2) return;
				instance.restTimeout.clear();
				function handleMouseMove() {
					instance.restTimeoutPending = false;
					if (isClickLikeOpenEvent$1()) return;
					const latestOpen = store.select("open");
					if (!instance.blockMouseMove && (!latestOpen || isOverInactive) && checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, nativeEvent, trigger));
				}
				if (instance.pointerType === "touch") import_react_dom.flushSync(() => {
					handleMouseMove();
				});
				else if (isOverInactive && currentOpen) handleMouseMove();
				else {
					instance.restTimeoutPending = true;
					instance.restTimeout.start(restMsValue, handleMouseMove);
				}
			}
		};
	}, [
		enabled,
		instance,
		isClickLikeOpenEvent$1,
		isOverInactiveTrigger,
		mouseOnly,
		store,
		restMsRef,
		checkShouldOpen
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/safePolygon.js
var CURSOR_SPEED_THRESHOLD = .1;
var CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
var POLYGON_BUFFER = .5;
function hasIntersectingEdge(pointX, pointY, xi, yi, xj, yj) {
	return yi >= pointY !== yj >= pointY && pointX <= (xj - xi) * (pointY - yi) / (yj - yi) + xi;
}
function isPointInQuadrilateral(pointX, pointY, x1, y1, x2, y2, x3, y3, x4, y4) {
	let isInsideValue = false;
	if (hasIntersectingEdge(pointX, pointY, x1, y1, x2, y2)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x2, y2, x3, y3)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x3, y3, x4, y4)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x4, y4, x1, y1)) isInsideValue = !isInsideValue;
	return isInsideValue;
}
function isInsideRect(pointX, pointY, rect) {
	return pointX >= rect.x && pointX <= rect.x + rect.width && pointY >= rect.y && pointY <= rect.y + rect.height;
}
function isInsideAxisAlignedRect(pointX, pointY, x1, y1, x2, y2) {
	return pointX >= Math.min(x1, x2) && pointX <= Math.max(x1, x2) && pointY >= Math.min(y1, y2) && pointY <= Math.max(y1, y2);
}
/**
* Generates a safe polygon area that the user can traverse without closing the
* floating element once leaving the reference element.
* @see https://floating-ui.com/docs/useHover#safepolygon
*/
function safePolygon(options = {}) {
	const { blockPointerEvents = false } = options;
	const timeout = new Timeout();
	const fn = ({ x, y, placement, elements, onClose, nodeId, tree }) => {
		const side = placement?.split("-")[0];
		let hasLanded = false;
		let lastX = null;
		let lastY = null;
		let lastCursorTime = typeof performance !== "undefined" ? performance.now() : 0;
		function isCursorMovingSlowly(nextX, nextY) {
			const currentTime = performance.now();
			const elapsedTime = currentTime - lastCursorTime;
			if (lastX === null || lastY === null || elapsedTime === 0) {
				lastX = nextX;
				lastY = nextY;
				lastCursorTime = currentTime;
				return false;
			}
			const deltaX = nextX - lastX;
			const deltaY = nextY - lastY;
			const distanceSquared = deltaX * deltaX + deltaY * deltaY;
			const thresholdSquared = elapsedTime * elapsedTime * CURSOR_SPEED_THRESHOLD_SQUARED;
			lastX = nextX;
			lastY = nextY;
			lastCursorTime = currentTime;
			return distanceSquared < thresholdSquared;
		}
		function close() {
			timeout.clear();
			onClose();
		}
		return function onMouseMove(event) {
			timeout.clear();
			const domReference = elements.domReference;
			const floating = elements.floating;
			if (!domReference || !floating || side == null || x == null || y == null) return;
			const { clientX, clientY } = event;
			const target = getTarget(event);
			const isLeave = event.type === "mouseleave";
			const isOverFloatingEl = contains(floating, target);
			const isOverReferenceEl = contains(domReference, target);
			if (isOverFloatingEl) {
				hasLanded = true;
				if (!isLeave) return;
			}
			if (isOverReferenceEl) {
				hasLanded = false;
				if (!isLeave) {
					hasLanded = true;
					return;
				}
			}
			if (isLeave && isElement(event.relatedTarget) && contains(floating, event.relatedTarget)) return;
			function hasOpenChildNode() {
				return Boolean(tree && getNodeChildren(tree.nodesRef.current, nodeId).length > 0);
			}
			function closeIfNoOpenChild() {
				if (!hasOpenChildNode()) close();
			}
			if (hasOpenChildNode()) return;
			const refRect = domReference.getBoundingClientRect();
			const rect = floating.getBoundingClientRect();
			const cursorLeaveFromRight = x > rect.right - rect.width / 2;
			const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
			const isFloatingWider = rect.width > refRect.width;
			const isFloatingTaller = rect.height > refRect.height;
			const left = (isFloatingWider ? refRect : rect).left;
			const right = (isFloatingWider ? refRect : rect).right;
			const top = (isFloatingTaller ? refRect : rect).top;
			const bottom = (isFloatingTaller ? refRect : rect).bottom;
			if (side === "top" && y >= refRect.bottom - 1 || side === "bottom" && y <= refRect.top + 1 || side === "left" && x >= refRect.right - 1 || side === "right" && x <= refRect.left + 1) {
				closeIfNoOpenChild();
				return;
			}
			let isInsideTroughRect = false;
			switch (side) {
				case "top":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, left, refRect.top + 1, right, rect.bottom - 1);
					break;
				case "bottom":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, left, rect.top + 1, right, refRect.bottom - 1);
					break;
				case "left":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, rect.right - 1, bottom, refRect.left + 1, top);
					break;
				case "right": isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, refRect.right - 1, bottom, rect.left + 1, top);
			}
			if (isInsideTroughRect) return;
			if (hasLanded && !isInsideRect(clientX, clientY, refRect)) {
				closeIfNoOpenChild();
				return;
			}
			if (!isLeave && isCursorMovingSlowly(clientX, clientY)) {
				closeIfNoOpenChild();
				return;
			}
			let isInsidePolygon = false;
			switch (side) {
				case "top": {
					const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneX = isFloatingWider ? x + cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointTwoX = isFloatingWider ? x - cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointY = y + POLYGON_BUFFER + 1;
					const commonYLeft = cursorLeaveFromRight ? rect.bottom - POLYGON_BUFFER : isFloatingWider ? rect.bottom - POLYGON_BUFFER : rect.top;
					const commonYRight = cursorLeaveFromRight ? isFloatingWider ? rect.bottom - POLYGON_BUFFER : rect.top : rect.bottom - POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointOneX, cursorPointY, cursorPointTwoX, cursorPointY, rect.left, commonYLeft, rect.right, commonYRight);
					break;
				}
				case "bottom": {
					const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneX = isFloatingWider ? x + cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointTwoX = isFloatingWider ? x - cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointY = y - POLYGON_BUFFER;
					const commonYLeft = cursorLeaveFromRight ? rect.top + POLYGON_BUFFER : isFloatingWider ? rect.top + POLYGON_BUFFER : rect.bottom;
					const commonYRight = cursorLeaveFromRight ? isFloatingWider ? rect.top + POLYGON_BUFFER : rect.bottom : rect.top + POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointOneX, cursorPointY, cursorPointTwoX, cursorPointY, rect.left, commonYLeft, rect.right, commonYRight);
					break;
				}
				case "left": {
					const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneY = isFloatingTaller ? y + cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointTwoY = isFloatingTaller ? y - cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointX = x + POLYGON_BUFFER + 1;
					const commonXTop = cursorLeaveFromBottom ? rect.right - POLYGON_BUFFER : isFloatingTaller ? rect.right - POLYGON_BUFFER : rect.left;
					const commonXBottom = cursorLeaveFromBottom ? isFloatingTaller ? rect.right - POLYGON_BUFFER : rect.left : rect.right - POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, commonXTop, rect.top, commonXBottom, rect.bottom, cursorPointX, cursorPointOneY, cursorPointX, cursorPointTwoY);
					break;
				}
				case "right": {
					const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneY = isFloatingTaller ? y + cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointTwoY = isFloatingTaller ? y - cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointX = x - POLYGON_BUFFER;
					const commonXTop = cursorLeaveFromBottom ? rect.left + POLYGON_BUFFER : isFloatingTaller ? rect.left + POLYGON_BUFFER : rect.right;
					const commonXBottom = cursorLeaveFromBottom ? isFloatingTaller ? rect.left + POLYGON_BUFFER : rect.right : rect.left + POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointX, cursorPointOneY, cursorPointX, cursorPointTwoY, commonXTop, rect.top, commonXBottom, rect.bottom);
					break;
				}
			}
			if (!isInsidePolygon) closeIfNoOpenChild();
			else if (!hasLanded) timeout.start(40, closeIfNoOpenChild);
		};
	};
	fn.__options = {
		...options,
		blockPointerEvents
	};
	return fn;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/positioner/MenuPositionerContext.js
var MenuPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuPositionerContext.displayName = "MenuPositionerContext";
function useMenuPositionerContext(optional) {
	const context = import_react.useContext(MenuPositionerContext);
	if (context === void 0 && !optional) throw new Error("Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/root/MenuRootContext.js
var MenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuRootContext.displayName = "MenuRootContext";
function useMenuRootContext(optional) {
	const context = import_react.useContext(MenuRootContext);
	if (context === void 0 && !optional) throw new Error("Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/arrow/MenuArrow.js
/**
* Displays an element positioned against the menu anchor.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuArrow = /*#__PURE__*/ import_react.forwardRef(function MenuArrow(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const { arrowRef, side, align, arrowUncentered, arrowStyles } = useMenuPositionerContext();
	const state = {
		open: store.useState("open"),
		side,
		align,
		uncentered: arrowUncentered
	};
	return useRenderElement("div", componentProps, {
		ref: [arrowRef, forwardedRef],
		stateAttributesMapping: popupStateMapping,
		state,
		props: {
			style: arrowStyles,
			"aria-hidden": true,
			...elementProps
		}
	});
});
MenuArrow.displayName = "MenuArrow";
//#endregion
//#region node_modules/@base-ui/react/esm/context-menu/root/ContextMenuRootContext.js
var ContextMenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
ContextMenuRootContext.displayName = "ContextMenuRootContext";
function useContextMenuRootContext(optional = true) {
	const context = import_react.useContext(ContextMenuRootContext);
	if (context === void 0 && !optional) throw new Error("Base UI: ContextMenuRootContext is missing. ContextMenu parts must be placed within <ContextMenu.Root>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/backdrop/MenuBackdrop.js
var stateAttributesMapping$2 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* An overlay displayed beneath the menu popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuBackdrop = /*#__PURE__*/ import_react.forwardRef(function MenuBackdrop(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const transitionStatus = store.useState("transitionStatus");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const contextMenuContext = useContextMenuRootContext();
	const state = {
		open,
		transitionStatus
	};
	return useRenderElement("div", componentProps, {
		ref: contextMenuContext?.backdropRef ? [forwardedRef, contextMenuContext.backdropRef] : forwardedRef,
		state,
		stateAttributesMapping: stateAttributesMapping$2,
		props: [{
			role: "presentation",
			hidden: !mounted,
			style: {
				pointerEvents: lastOpenChangeReason === "trigger-hover" ? "none" : void 0,
				userSelect: "none",
				WebkitUserSelect: "none"
			}
		}, elementProps]
	});
});
MenuBackdrop.displayName = "MenuBackdrop";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/checkbox-item/MenuCheckboxItemContext.js
var MenuCheckboxItemContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuCheckboxItemContext.displayName = "MenuCheckboxItemContext";
function useMenuCheckboxItemContext() {
	const context = import_react.useContext(MenuCheckboxItemContext);
	if (context === void 0) throw new Error("Base UI: MenuCheckboxItemContext is missing. MenuCheckboxItem parts must be placed within <Menu.CheckboxItem>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/item/useMenuItemCommonProps.js
/**
* Returns common props shared by all menu item types.
* This hook extracts the shared logic for id, role, tabIndex, onKeyDown,
* onMouseMove, onClick, and onMouseUp handlers.
*/
function useMenuItemCommonProps(params) {
	const { closeOnClick, highlighted, id, nodeId, store, typingRef, itemRef, itemMetadata } = params;
	const { events: menuEvents } = store.useState("floatingTreeRoot");
	const contextMenuContext = useContextMenuRootContext(true);
	const isContextMenu = contextMenuContext !== void 0;
	return import_react.useMemo(() => ({
		id,
		role: "menuitem",
		tabIndex: highlighted ? 0 : -1,
		onKeyDown(event) {
			if (event.key === " " && typingRef?.current) event.preventDefault();
		},
		onMouseMove(event) {
			if (!nodeId) return;
			menuEvents.emit("itemhover", {
				nodeId,
				target: event.currentTarget
			});
		},
		onClick(event) {
			if (closeOnClick) menuEvents.emit("close", {
				domEvent: event,
				reason: itemPress
			});
		},
		onMouseUp(event) {
			if (contextMenuContext) {
				const initialCursorPoint = contextMenuContext.initialCursorPointRef.current;
				contextMenuContext.initialCursorPointRef.current = null;
				if (isContextMenu && initialCursorPoint && Math.abs(event.clientX - initialCursorPoint.x) <= 1 && Math.abs(event.clientY - initialCursorPoint.y) <= 1) return;
				if (isContextMenu && !isMac && event.button === 2) return;
			}
			if (itemRef.current && store.context.allowMouseUpTriggerRef.current && (!isContextMenu || event.button === 2)) {
				if (!itemMetadata || itemMetadata.type === "regular-item") itemRef.current.click();
			}
		}
	}), [
		closeOnClick,
		highlighted,
		id,
		menuEvents,
		nodeId,
		store,
		typingRef,
		itemRef,
		contextMenuContext,
		isContextMenu,
		itemMetadata
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/item/useMenuItem.js
var REGULAR_ITEM = { type: "regular-item" };
function useMenuItem(params) {
	const { closeOnClick, disabled = false, highlighted, id, store, typingRef = store.context.typingRef, nativeButton, itemMetadata, nodeId } = params;
	const itemRef = import_react.useRef(null);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled: true,
		native: nativeButton,
		composite: true
	});
	const commonProps = useMenuItemCommonProps({
		closeOnClick,
		highlighted,
		id,
		nodeId,
		store,
		typingRef,
		itemRef,
		itemMetadata
	});
	const getItemProps = import_react.useCallback((externalProps) => {
		return mergeProps(commonProps, { onMouseEnter() {
			if (itemMetadata.type !== "submenu-trigger") return;
			itemMetadata.setActive();
		} }, externalProps, getButtonProps);
	}, [
		commonProps,
		getButtonProps,
		itemMetadata
	]);
	const mergedRef = useMergedRefs(itemRef, buttonRef);
	return import_react.useMemo(() => ({
		getItemProps,
		itemRef: mergedRef
	}), [getItemProps, mergedRef]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/checkbox-item/MenuCheckboxItemDataAttributes.js
var MenuCheckboxItemDataAttributes = /*#__PURE__*/ function(MenuCheckboxItemDataAttributes) {
	/**
	* Present when the menu checkbox item is checked.
	*/
	MenuCheckboxItemDataAttributes["checked"] = "data-checked";
	/**
	* Present when the menu checkbox item is not checked.
	*/
	MenuCheckboxItemDataAttributes["unchecked"] = "data-unchecked";
	/**
	* Present when the menu checkbox item is disabled.
	*/
	MenuCheckboxItemDataAttributes["disabled"] = "data-disabled";
	/**
	* Present when the menu checkbox item is highlighted.
	*/
	MenuCheckboxItemDataAttributes["highlighted"] = "data-highlighted";
	return MenuCheckboxItemDataAttributes;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/menu/utils/stateAttributesMapping.js
var itemMapping = {
	checked(value) {
		if (value) return { [MenuCheckboxItemDataAttributes.checked]: "" };
		return { [MenuCheckboxItemDataAttributes.unchecked]: "" };
	},
	...transitionStatusMapping
};
//#endregion
//#region node_modules/@base-ui/react/esm/menu/checkbox-item/MenuCheckboxItem.js
var import_jsx_runtime = require_jsx_runtime();
/**
* A menu item that toggles a setting on or off.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuCheckboxItem = /*#__PURE__*/ import_react.forwardRef(function MenuCheckboxItem(componentProps, forwardedRef) {
	const { render, className, id: idProp, label, nativeButton = false, disabled = false, closeOnClick = false, checked: checkedProp, defaultChecked, onCheckedChange, style, ...elementProps } = componentProps;
	const listItem = useCompositeListItem({ label });
	const menuPositionerContext = useMenuPositionerContext(true);
	const id = useBaseUiId(idProp);
	const { store } = useMenuRootContext();
	const highlighted = store.useState("isActive", listItem.index);
	const itemProps = store.useState("itemProps");
	const [checked, setChecked] = useControlled({
		controlled: checkedProp,
		default: defaultChecked ?? false,
		name: "MenuCheckboxItem",
		state: "checked"
	});
	const { getItemProps, itemRef } = useMenuItem({
		closeOnClick,
		disabled,
		highlighted,
		id,
		store,
		nativeButton,
		nodeId: menuPositionerContext?.context.nodeId,
		itemMetadata: REGULAR_ITEM
	});
	const state = import_react.useMemo(() => ({
		disabled,
		highlighted,
		checked
	}), [
		disabled,
		highlighted,
		checked
	]);
	function handleClick(event) {
		const details = createChangeEventDetails(itemPress, event.nativeEvent, void 0, { preventUnmountOnClose() {} });
		onCheckedChange?.(!checked, details);
		if (details.isCanceled) return;
		setChecked((currentlyChecked) => !currentlyChecked);
	}
	const element = useRenderElement("div", componentProps, {
		state,
		stateAttributesMapping: itemMapping,
		props: [
			itemProps,
			{
				role: "menuitemcheckbox",
				"aria-checked": checked,
				onClick: handleClick
			},
			elementProps,
			getItemProps
		],
		ref: [
			itemRef,
			forwardedRef,
			listItem.ref
		]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuCheckboxItemContext.Provider, {
		value: state,
		children: element
	});
});
MenuCheckboxItem.displayName = "MenuCheckboxItem";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/checkbox-item-indicator/MenuCheckboxItemIndicator.js
/**
* Indicates whether the checkbox item is ticked.
* Renders a `<span>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuCheckboxItemIndicator = /*#__PURE__*/ import_react.forwardRef(function MenuCheckboxItemIndicator(componentProps, forwardedRef) {
	const { render, className, style, keepMounted = false, ...elementProps } = componentProps;
	const item = useMenuCheckboxItemContext();
	const indicatorRef = import_react.useRef(null);
	const { transitionStatus, setMounted } = useTransitionStatus(item.checked);
	useOpenChangeComplete({
		open: item.checked,
		ref: indicatorRef,
		onComplete() {
			if (!item.checked) setMounted(false);
		}
	});
	const state = {
		checked: item.checked,
		disabled: item.disabled,
		highlighted: item.highlighted,
		transitionStatus
	};
	return useRenderElement("span", componentProps, {
		state,
		ref: [forwardedRef, indicatorRef],
		stateAttributesMapping: itemMapping,
		props: {
			"aria-hidden": true,
			...elementProps
		},
		enabled: keepMounted || item.checked
	});
});
MenuCheckboxItemIndicator.displayName = "MenuCheckboxItemIndicator";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/group/MenuGroupContext.js
var MenuGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuGroupContext.displayName = "MenuGroupContext";
function useMenuGroupRootContext() {
	const context = import_react.useContext(MenuGroupContext);
	if (context === void 0) throw new Error("Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/group/MenuGroup.js
/**
* Groups related menu items with the corresponding label.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuGroup = /*#__PURE__*/ import_react.forwardRef(function MenuGroup(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const [labelId, setLabelId] = import_react.useState(void 0);
	const element = useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: {
			role: "group",
			"aria-labelledby": labelId,
			...elementProps
		}
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuGroupContext.Provider, {
		value: setLabelId,
		children: element
	});
});
MenuGroup.displayName = "MenuGroup";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/group-label/MenuGroupLabel.js
/**
* An accessible label that is automatically associated with its parent group.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuGroupLabel = /*#__PURE__*/ import_react.forwardRef(function MenuGroupLabel(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const id = useBaseUiId(idProp);
	const setLabelId = useMenuGroupRootContext();
	useIsoLayoutEffect(() => {
		setLabelId(id);
		return () => {
			setLabelId(void 0);
		};
	}, [setLabelId, id]);
	return useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: {
			id,
			role: "presentation",
			...elementProps
		}
	});
});
MenuGroupLabel.displayName = "MenuGroupLabel";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/item/MenuItem.js
/**
* An individual interactive item in the menu.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuItem = /*#__PURE__*/ import_react.forwardRef(function MenuItem(componentProps, forwardedRef) {
	const { render, className, id: idProp, label, nativeButton = false, disabled = false, closeOnClick = true, style, ...elementProps } = componentProps;
	const listItem = useCompositeListItem({ label });
	const menuPositionerContext = useMenuPositionerContext(true);
	const id = useBaseUiId(idProp);
	const { store } = useMenuRootContext();
	const highlighted = store.useState("isActive", listItem.index);
	const itemProps = store.useState("itemProps");
	const { getItemProps, itemRef } = useMenuItem({
		closeOnClick,
		disabled,
		highlighted,
		id,
		store,
		nativeButton,
		nodeId: menuPositionerContext?.context.nodeId,
		itemMetadata: REGULAR_ITEM
	});
	return useRenderElement("div", componentProps, {
		state: {
			disabled,
			highlighted
		},
		props: [
			itemProps,
			elementProps,
			getItemProps
		],
		ref: [
			itemRef,
			forwardedRef,
			listItem.ref
		]
	});
});
MenuItem.displayName = "MenuItem";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/link-item/MenuLinkItem.js
/**
* A link in the menu that can be used to navigate to a different page or section.
* Renders an `<a>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuLinkItem = /*#__PURE__*/ import_react.forwardRef(function MenuLinkItem(componentProps, forwardedRef) {
	const { render, className, id: idProp, label, closeOnClick = false, style, ...elementProps } = componentProps;
	const linkRef = import_react.useRef(null);
	const listItem = useCompositeListItem({ label });
	const nodeId = useMenuPositionerContext(true)?.context.nodeId;
	const id = useBaseUiId(idProp);
	const { store } = useMenuRootContext();
	const highlighted = store.useState("isActive", listItem.index);
	const itemProps = store.useState("itemProps");
	const typingRef = store.context.typingRef;
	const { getButtonProps, buttonRef } = useButton({
		native: false,
		composite: true
	});
	const commonProps = useMenuItemCommonProps({
		closeOnClick,
		highlighted,
		id,
		nodeId,
		store,
		typingRef,
		itemRef: linkRef
	});
	function getItemProps(externalProps) {
		return mergeProps(commonProps, externalProps, getButtonProps);
	}
	return useRenderElement("a", componentProps, {
		state: { highlighted },
		props: [
			itemProps,
			elementProps,
			getItemProps
		],
		ref: [
			linkRef,
			buttonRef,
			forwardedRef,
			listItem.ref
		]
	});
});
MenuLinkItem.displayName = "MenuLinkItem";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/popup/MenuPopup.js
var stateAttributesMapping$1 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* A container for the menu items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPopup = /*#__PURE__*/ import_react.forwardRef(function MenuPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const { side, align } = useMenuPositionerContext();
	const insideToolbar = useToolbarRootContext(true) != null;
	const open = store.useState("open");
	const transitionStatus = store.useState("transitionStatus");
	const popupProps = store.useState("popupProps");
	const mounted = store.useState("mounted");
	const instantType = store.useState("instantType");
	const triggerElement = store.useState("activeTriggerElement");
	const parent = store.useState("parent");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const rootId = store.useState("rootId");
	const floatingContext = store.useState("floatingRootContext");
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const closeDelay = store.useState("closeDelay");
	const activeTriggerElement = store.useState("activeTriggerElement");
	const hoverEnabled = store.useState("hoverEnabled");
	const disabled = store.useState("disabled");
	const isContextMenu = parent.type === "context-menu";
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	import_react.useEffect(() => {
		function handleClose(event) {
			store.setOpen(false, createChangeEventDetails(event.reason, event.domEvent));
		}
		floatingTreeRoot.events.on("close", handleClose);
		return () => {
			floatingTreeRoot.events.off("close", handleClose);
		};
	}, [floatingTreeRoot.events, store]);
	useHoverFloatingInteraction(floatingContext, {
		enabled: hoverEnabled && !disabled && !isContextMenu && parent.type !== "menubar",
		closeDelay
	});
	const setPopupElement = import_react.useCallback((element) => {
		store.set("popupElement", element);
	}, [store]);
	const state = {
		transitionStatus,
		side,
		align,
		open,
		nested: parent.type === "menu",
		instant: instantType
	};
	const element = useRenderElement("div", componentProps, {
		state,
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		stateAttributesMapping: stateAttributesMapping$1,
		props: [
			popupProps,
			{ onKeyDown(event) {
				if (insideToolbar && COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
			} },
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps,
			{ "data-rootownerid": rootId }
		]
	});
	let returnFocus = parent.type === void 0 || isContextMenu;
	if (triggerElement || parent.type === "menubar" && lastOpenChangeReason !== "outside-press") returnFocus = true;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingContext,
		modal: isContextMenu,
		disabled: !mounted,
		returnFocus: finalFocus === void 0 ? returnFocus : finalFocus,
		initialFocus: parent.type !== "menu",
		restoreFocus: true,
		externalTree: parent.type !== "menubar" ? floatingTreeRoot : void 0,
		previousFocusableElement: activeTriggerElement,
		nextFocusableElement: parent.type === void 0 ? store.context.triggerFocusTargetRef : void 0,
		beforeContentFocusGuardRef: parent.type === void 0 ? store.context.beforeContentFocusGuardRef : void 0,
		children: element
	});
});
MenuPopup.displayName = "MenuPopup";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/portal/MenuPortalContext.js
var MenuPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuPortalContext.displayName = "MenuPortalContext";
function useMenuPortalContext() {
	const value = import_react.useContext(MenuPortalContext);
	if (value === void 0) throw new Error("Base UI: <Menu.Portal> is missing.");
	return value;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/portal/MenuPortal.js
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPortal = /*#__PURE__*/ import_react.forwardRef(function MenuPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	const { store } = useMenuRootContext();
	if (!(store.useState("mounted") || keepMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps
		})
	});
});
MenuPortal.displayName = "MenuPortal";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/positioner/MenuPositioner.js
/**
* Positions the menu popup against the trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPositioner = /*#__PURE__*/ import_react.forwardRef(function MenuPositioner(componentProps, forwardedRef) {
	const { anchor: anchorProp, positionMethod: positionMethodProp = "absolute", className, render, side, align: alignProp, sideOffset: sideOffsetProp = 0, alignOffset: alignOffsetProp = 0, collisionBoundary = "clipping-ancestors", collisionPadding = 5, arrowPadding = 5, sticky = false, disableAnchorTracking = false, collisionAvoidance: collisionAvoidanceProp = DROPDOWN_COLLISION_AVOIDANCE, style, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const keepMounted = useMenuPortalContext();
	const contextMenuContext = useContextMenuRootContext(true);
	const parent = store.useState("parent");
	const floatingRootContext = store.useState("floatingRootContext");
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const mounted = store.useState("mounted");
	const open = store.useState("open");
	const modal = store.useState("modal");
	const openMethod = store.useState("openMethod");
	const triggerElement = store.useState("activeTriggerElement");
	const transitionStatus = store.useState("transitionStatus");
	const positionerElement = store.useState("positionerElement");
	const instantType = store.useState("instantType");
	const hasViewport = store.useState("hasViewport");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const floatingNodeId = store.useState("floatingNodeId");
	const floatingParentNodeId = store.useState("floatingParentNodeId");
	const domReference = floatingRootContext.useState("domReferenceElement");
	const previousTriggerRef = import_react.useRef(null);
	const runOnceAnimationsFinish = useAnimationsFinished(positionerElement, false, false);
	let anchor = anchorProp;
	let sideOffset = sideOffsetProp;
	let alignOffset = alignOffsetProp;
	let align = alignProp;
	let collisionAvoidance = collisionAvoidanceProp;
	if (parent.type === "context-menu") {
		anchor = anchorProp ?? parent.context?.anchor;
		align = align ?? "start";
		if (!side && align !== "center") {
			alignOffset = componentProps.alignOffset ?? 2;
			sideOffset = componentProps.sideOffset ?? -5;
		}
	}
	let computedSide = side;
	let computedAlign = align;
	if (parent.type === "menu") {
		computedSide = computedSide ?? "inline-end";
		computedAlign = computedAlign ?? "start";
		collisionAvoidance = componentProps.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE;
	} else if (parent.type === "menubar") {
		computedSide = computedSide ?? "bottom";
		computedAlign = computedAlign ?? "start";
	}
	const contextMenu = parent.type === "context-menu";
	const positioner = useAnchorPositioning({
		anchor,
		floatingRootContext,
		positionMethod: contextMenuContext ? "fixed" : positionMethodProp,
		mounted,
		side: computedSide,
		sideOffset,
		align: computedAlign,
		alignOffset,
		arrowPadding: contextMenu ? 0 : arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		nodeId: floatingNodeId,
		keepMounted,
		disableAnchorTracking,
		collisionAvoidance,
		shiftCrossAxis: contextMenu && !("side" in collisionAvoidance && collisionAvoidance.side === "flip"),
		externalTree: floatingTreeRoot,
		adaptiveOrigin: hasViewport ? adaptiveOrigin : void 0
	});
	import_react.useEffect(() => {
		function onMenuOpenChange(details) {
			if (details.open) {
				if (details.parentNodeId === floatingNodeId) store.set("hoverEnabled", false);
				if (details.nodeId !== floatingNodeId && details.parentNodeId === store.select("floatingParentNodeId")) store.setOpen(false, createChangeEventDetails(siblingOpen));
			}
		}
		floatingTreeRoot.events.on("menuopenchange", onMenuOpenChange);
		return () => {
			floatingTreeRoot.events.off("menuopenchange", onMenuOpenChange);
		};
	}, [
		store,
		floatingTreeRoot.events,
		floatingNodeId
	]);
	import_react.useEffect(() => {
		if (store.select("floatingParentNodeId") == null) return;
		function onParentClose(details) {
			if (details.open || details.nodeId !== store.select("floatingParentNodeId")) return;
			const reason = details.reason ?? "sibling-open";
			store.setOpen(false, createChangeEventDetails(reason));
		}
		floatingTreeRoot.events.on("menuopenchange", onParentClose);
		return () => {
			floatingTreeRoot.events.off("menuopenchange", onParentClose);
		};
	}, [floatingTreeRoot.events, store]);
	const closeTimeout = useTimeout();
	import_react.useEffect(() => {
		if (!open) closeTimeout.clear();
	}, [open, closeTimeout]);
	import_react.useEffect(() => {
		function onItemHover(event) {
			if (!open || event.nodeId !== store.select("floatingParentNodeId")) return;
			if (event.target && triggerElement && triggerElement !== event.target) {
				const delay = store.select("closeDelay");
				if (delay > 0) {
					if (!closeTimeout.isStarted()) closeTimeout.start(delay, () => {
						store.setOpen(false, createChangeEventDetails(siblingOpen));
					});
				} else store.setOpen(false, createChangeEventDetails(siblingOpen));
			} else closeTimeout.clear();
		}
		floatingTreeRoot.events.on("itemhover", onItemHover);
		return () => {
			floatingTreeRoot.events.off("itemhover", onItemHover);
		};
	}, [
		floatingTreeRoot.events,
		open,
		triggerElement,
		store,
		closeTimeout
	]);
	import_react.useEffect(() => {
		const eventDetails = {
			open,
			nodeId: floatingNodeId,
			parentNodeId: floatingParentNodeId,
			reason: store.select("lastOpenChangeReason")
		};
		floatingTreeRoot.events.emit("menuopenchange", eventDetails);
	}, [
		floatingTreeRoot.events,
		open,
		store,
		floatingNodeId,
		floatingParentNodeId
	]);
	useIsoLayoutEffect(() => {
		const currentTrigger = domReference;
		const previousTrigger = previousTriggerRef.current;
		if (currentTrigger) previousTriggerRef.current = currentTrigger;
		if (previousTrigger && currentTrigger && currentTrigger !== previousTrigger) {
			store.set("instantType", void 0);
			const abortController = new AbortController();
			runOnceAnimationsFinish(() => {
				store.set("instantType", "trigger-change");
			}, abortController.signal);
			return () => {
				abortController.abort();
			};
		}
	}, [
		domReference,
		runOnceAnimationsFinish,
		store
	]);
	const state = {
		open,
		side: positioner.side,
		align: positioner.align,
		anchorHidden: positioner.anchorHidden,
		nested: parent.type === "menu",
		instant: instantType
	};
	const menubarModal = parent.type === "menubar" && parent.context.modal;
	useAnchoredPopupScrollLock(open && (menubarModal || modal && lastOpenChangeReason !== "trigger-hover"), openMethod === "touch", positionerElement, triggerElement);
	const element = usePositioner(componentProps, state, {
		styles: positioner.positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, store.useStateSetter("positionerElement")],
		hidden: !mounted,
		inert: !open
	});
	const shouldRenderBackdrop = mounted && parent.type !== "menu" && (parent.type !== "menubar" && modal && lastOpenChangeReason !== "trigger-hover" || parent.type === "menubar" && parent.context.modal);
	let backdropCutout = null;
	if (parent.type === "menubar") backdropCutout = parent.context.contentElement;
	else if (parent.type === void 0) backdropCutout = triggerElement;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(MenuPositionerContext.Provider, {
		value: positioner,
		children: [shouldRenderBackdrop && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
			ref: parent.type === "context-menu" || parent.type === "nested-context-menu" ? parent.context.internalBackdropRef : null,
			inert: inertValue(!open),
			cutout: backdropCutout
		}), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingNode, {
			id: floatingNodeId,
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
				elementsRef: store.context.itemDomElements,
				labelsRef: store.context.itemLabels,
				children: element
			})
		})]
	});
});
MenuPositioner.displayName = "MenuPositioner";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/radio-group/MenuRadioGroupContext.js
var MenuRadioGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuRadioGroupContext.displayName = "MenuRadioGroupContext";
function useMenuRadioGroupContext() {
	const context = import_react.useContext(MenuRadioGroupContext);
	if (context === void 0) throw new Error("Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/radio-group/MenuRadioGroup.js
/**
* Groups related radio items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuRadioGroup = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function MenuRadioGroup(componentProps, forwardedRef) {
	const { render, className, value: valueProp, defaultValue, onValueChange: onValueChangeProp, disabled = false, style, "aria-labelledby": ariaLabelledByProp, ...elementProps } = componentProps;
	const [labelId, setLabelId] = import_react.useState(void 0);
	const [value, setValueUnwrapped] = useControlled({
		controlled: valueProp,
		default: defaultValue,
		name: "MenuRadioGroup"
	});
	const setValue = useStableCallback((newValue, eventDetails) => {
		onValueChangeProp?.(newValue, eventDetails);
		if (eventDetails.isCanceled) return;
		setValueUnwrapped(newValue);
	});
	const element = useRenderElement("div", componentProps, {
		state: { disabled },
		ref: forwardedRef,
		props: {
			role: "group",
			"aria-labelledby": ariaLabelledByProp ?? labelId,
			"aria-disabled": disabled || void 0,
			...elementProps
		}
	});
	const context = import_react.useMemo(() => ({
		value,
		setValue,
		disabled
	}), [
		value,
		setValue,
		disabled
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuGroupContext.Provider, {
		value: setLabelId,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuRadioGroupContext.Provider, {
			value: context,
			children: element
		})
	});
}));
MenuRadioGroup.displayName = "MenuRadioGroup";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/radio-item/MenuRadioItemContext.js
var MenuRadioItemContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuRadioItemContext.displayName = "MenuRadioItemContext";
function useMenuRadioItemContext() {
	const context = import_react.useContext(MenuRadioItemContext);
	if (context === void 0) throw new Error("Base UI: MenuRadioItemContext is missing. MenuRadioItem parts must be placed within <Menu.RadioItem>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/radio-item/MenuRadioItem.js
/**
* A menu item that works like a radio button in a given group.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuRadioItem = /*#__PURE__*/ import_react.forwardRef(function MenuRadioItem(componentProps, forwardedRef) {
	const { render, className, id: idProp, label, nativeButton = false, disabled: disabledProp = false, closeOnClick = false, value, style, ...elementProps } = componentProps;
	const listItem = useCompositeListItem({ label });
	const menuPositionerContext = useMenuPositionerContext(true);
	const id = useBaseUiId(idProp);
	const { store } = useMenuRootContext();
	const highlighted = store.useState("isActive", listItem.index);
	const itemProps = store.useState("itemProps");
	const { value: selectedValue, setValue: setSelectedValue, disabled: groupDisabled } = useMenuRadioGroupContext();
	const disabled = groupDisabled || disabledProp;
	const checked = selectedValue === value;
	const { getItemProps, itemRef } = useMenuItem({
		closeOnClick,
		disabled,
		highlighted,
		id,
		store,
		nativeButton,
		nodeId: menuPositionerContext?.context.nodeId,
		itemMetadata: REGULAR_ITEM
	});
	const state = import_react.useMemo(() => ({
		disabled,
		highlighted,
		checked
	}), [
		disabled,
		highlighted,
		checked
	]);
	function handleClick(event) {
		const details = createChangeEventDetails(itemPress, event.nativeEvent, void 0, { preventUnmountOnClose() {} });
		setSelectedValue(value, details);
	}
	const element = useRenderElement("div", componentProps, {
		state,
		stateAttributesMapping: itemMapping,
		props: [
			itemProps,
			{
				role: "menuitemradio",
				"aria-checked": checked,
				onClick: handleClick
			},
			elementProps,
			getItemProps
		],
		ref: [
			itemRef,
			forwardedRef,
			listItem.ref
		]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuRadioItemContext.Provider, {
		value: state,
		children: element
	});
});
MenuRadioItem.displayName = "MenuRadioItem";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/radio-item-indicator/MenuRadioItemIndicator.js
/**
* Indicates whether the radio item is selected.
* Renders a `<span>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuRadioItemIndicator = /*#__PURE__*/ import_react.forwardRef(function MenuRadioItemIndicator(componentProps, forwardedRef) {
	const { render, className, style, keepMounted = false, ...elementProps } = componentProps;
	const item = useMenuRadioItemContext();
	const indicatorRef = import_react.useRef(null);
	const { transitionStatus, setMounted } = useTransitionStatus(item.checked);
	useOpenChangeComplete({
		open: item.checked,
		ref: indicatorRef,
		onComplete() {
			if (!item.checked) setMounted(false);
		}
	});
	const state = {
		checked: item.checked,
		disabled: item.disabled,
		highlighted: item.highlighted,
		transitionStatus
	};
	return useRenderElement("span", componentProps, {
		state,
		stateAttributesMapping: itemMapping,
		ref: [forwardedRef, indicatorRef],
		props: {
			"aria-hidden": true,
			...elementProps
		},
		enabled: keepMounted || item.checked
	});
});
MenuRadioItemIndicator.displayName = "MenuRadioItemIndicator";
//#endregion
//#region node_modules/@base-ui/react/esm/menubar/MenubarContext.js
var MenubarContext = /*#__PURE__*/ import_react.createContext(null);
MenubarContext.displayName = "MenubarContext";
function useMenubarContext(optional) {
	const context = import_react.useContext(MenubarContext);
	if (context === null && !optional) throw new Error("Base UI: MenubarContext is missing. Menubar parts must be placed within <Menubar>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/store/MenuStore.js
var selectors = {
	...popupStoreSelectors,
	disabled: createSelector((state) => state.parent.type === "menubar" ? state.parent.context.disabled || state.disabled : state.disabled),
	modal: createSelector((state) => (state.parent.type === void 0 || state.parent.type === "context-menu") && (state.modal ?? true)),
	openMethod: createSelector((state) => state.openMethod),
	allowMouseEnter: createSelector((state) => state.allowMouseEnter),
	stickIfOpen: createSelector((state) => state.stickIfOpen),
	parent: createSelector((state) => state.parent),
	rootId: createSelector((state) => {
		if (state.parent.type === "menu") return state.parent.store.select("rootId");
		return state.parent.type !== void 0 ? state.parent.context.rootId : state.rootId;
	}),
	activeIndex: createSelector((state) => state.activeIndex),
	isActive: createSelector((state, itemIndex) => state.activeIndex === itemIndex),
	hoverEnabled: createSelector((state) => state.hoverEnabled),
	instantType: createSelector((state) => state.instantType),
	lastOpenChangeReason: createSelector((state) => state.openChangeReason),
	floatingTreeRoot: createSelector((state) => {
		if (state.parent.type === "menu") return state.parent.store.select("floatingTreeRoot");
		return state.floatingTreeRoot;
	}),
	floatingNodeId: createSelector((state) => state.floatingNodeId),
	floatingParentNodeId: createSelector((state) => state.floatingParentNodeId),
	itemProps: createSelector((state) => state.itemProps),
	closeDelay: createSelector((state) => state.closeDelay),
	hasViewport: createSelector((state) => state.hasViewport),
	keyboardEventRelay: createSelector((state) => {
		if (state.keyboardEventRelay) return state.keyboardEventRelay;
		if (state.parent.type === "menu") return state.parent.store.select("keyboardEventRelay");
	})
};
var MenuStore = class MenuStore extends ReactStore {
	constructor(initialState) {
		super({
			...createInitialState(),
			...initialState
		}, {
			positionerRef: /*#__PURE__*/ import_react.createRef(),
			popupRef: /*#__PURE__*/ import_react.createRef(),
			typingRef: { current: false },
			itemDomElements: { current: [] },
			itemLabels: { current: [] },
			allowMouseUpTriggerRef: { current: false },
			triggerFocusTargetRef: /*#__PURE__*/ import_react.createRef(),
			beforeContentFocusGuardRef: /*#__PURE__*/ import_react.createRef(),
			onOpenChangeComplete: void 0,
			triggerElements: new PopupTriggerMap()
		}, selectors);
		this.unsubscribeParentListener = this.observe("parent", (parent) => {
			this.unsubscribeParentListener?.();
			if (parent.type === "menu") {
				let rootId = parent.store.select("rootId");
				let floatingTreeRoot = parent.store.select("floatingTreeRoot");
				let keyboardEventRelay = parent.store.select("keyboardEventRelay");
				this.unsubscribeParentListener = parent.store.subscribe(() => {
					const nextRootId = parent.store.select("rootId");
					const nextFloatingTreeRoot = parent.store.select("floatingTreeRoot");
					const nextKeyboardEventRelay = parent.store.select("keyboardEventRelay");
					if (rootId === nextRootId && floatingTreeRoot === nextFloatingTreeRoot && keyboardEventRelay === nextKeyboardEventRelay) return;
					rootId = nextRootId;
					floatingTreeRoot = nextFloatingTreeRoot;
					keyboardEventRelay = nextKeyboardEventRelay;
					this.notifyAll();
				});
				this.context.allowMouseUpTriggerRef = parent.store.context.allowMouseUpTriggerRef;
				return;
			}
			if (parent.type !== void 0) this.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
			this.unsubscribeParentListener = null;
		});
	}
	setOpen(open, eventDetails) {
		this.state.floatingRootContext.context.events.emit("setOpen", {
			open,
			eventDetails
		});
	}
	static useStore(externalStore, initialState) {
		const internalStore = useRefWithInit(() => {
			return new MenuStore(initialState);
		}).current;
		return externalStore ?? internalStore;
	}
	unsubscribeParentListener = null;
};
function createInitialState() {
	return {
		...createInitialPopupStoreState(),
		disabled: false,
		modal: true,
		openMethod: null,
		allowMouseEnter: false,
		stickIfOpen: true,
		parent: { type: void 0 },
		rootId: void 0,
		activeIndex: null,
		hoverEnabled: true,
		instantType: void 0,
		openChangeReason: null,
		floatingTreeRoot: new FloatingTreeStore(),
		floatingNodeId: void 0,
		floatingParentNodeId: null,
		itemProps: EMPTY_OBJECT,
		keyboardEventRelay: void 0,
		closeDelay: 0,
		hasViewport: false
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/submenu-root/MenuSubmenuRootContext.js
var MenuSubmenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
MenuSubmenuRootContext.displayName = "MenuSubmenuRootContext";
function useMenuSubmenuRootContext() {
	return import_react.useContext(MenuSubmenuRootContext);
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/root/MenuRoot.js
/**
* Groups all parts of the menu.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuRoot = fastComponent(function MenuRoot(props) {
	const { children, open: openProp, onOpenChange, onOpenChangeComplete, defaultOpen = false, disabled: disabledProp = false, modal: modalProp, loopFocus = true, orientation = "vertical", actionsRef, closeParentOnEsc = false, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null, highlightItemOnHover = true } = props;
	const contextMenuContext = useContextMenuRootContext(true);
	const parentMenuRootContext = useMenuRootContext(true);
	const menubarContext = useMenubarContext(true);
	const isSubmenu = useMenuSubmenuRootContext();
	const parentFromContext = import_react.useMemo(() => {
		if (isSubmenu && parentMenuRootContext) return {
			type: "menu",
			store: parentMenuRootContext.store
		};
		if (menubarContext) return {
			type: "menubar",
			context: menubarContext
		};
		if (contextMenuContext && !parentMenuRootContext) return {
			type: "context-menu",
			context: contextMenuContext
		};
		return { type: void 0 };
	}, [
		contextMenuContext,
		parentMenuRootContext,
		menubarContext,
		isSubmenu
	]);
	const store = MenuStore.useStore(handle?.store, {
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp,
		parent: parentFromContext
	});
	useOnFirstRender(() => {
		if (openProp === void 0 && store.state.open === false && defaultOpen === true) store.update({
			open: true,
			activeTriggerId: defaultTriggerIdProp
		});
	});
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	const rootId = useId();
	const floatingId = useId();
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const floatingNodeIdFromContext = useFloatingNodeId(floatingTreeRoot);
	const floatingParentNodeIdFromContext = useFloatingParentNodeId();
	const open = store.useState("open");
	const activeTriggerElement = store.useState("activeTriggerElement");
	const positionerElement = store.useState("positionerElement");
	const hoverEnabled = store.useState("hoverEnabled");
	const disabled = store.useState("disabled");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const parent = store.useState("parent");
	const activeIndex = store.useState("activeIndex");
	const payload = store.useState("payload");
	const floatingParentNodeId = store.useState("floatingParentNodeId");
	const openEventRef = import_react.useRef(null);
	const allowOutsidePressDismissalRef = import_react.useRef(parent.type !== "context-menu");
	const allowOutsidePressDismissalTimeout = useTimeout();
	const allowTouchToCloseRef = import_react.useRef(true);
	const allowTouchToCloseTimeout = useTimeout();
	const nested = floatingParentNodeId != null;
	if (parent.type !== void 0 && modalProp !== void 0) console.warn("Base UI: The `modal` prop is not supported on nested menus. It will be ignored.");
	const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);
	store.useSyncedValues({
		disabled: disabledProp,
		modal: parent.type === void 0 ? modalProp : void 0,
		openMethod,
		rootId
	});
	useImplicitActiveTrigger(store);
	const { forceUnmount } = useOpenStateTransitions(open, store, () => {
		store.update({
			allowMouseEnter: false,
			stickIfOpen: true
		});
	});
	useIsoLayoutEffect(() => {
		if (contextMenuContext && !parentMenuRootContext) store.update({
			parent: {
				type: "context-menu",
				context: contextMenuContext
			},
			floatingNodeId: floatingNodeIdFromContext,
			floatingParentNodeId: floatingParentNodeIdFromContext
		});
		else if (parentMenuRootContext) store.update({
			floatingNodeId: floatingNodeIdFromContext,
			floatingParentNodeId: floatingParentNodeIdFromContext
		});
	}, [
		contextMenuContext,
		parentMenuRootContext,
		floatingNodeIdFromContext,
		floatingParentNodeIdFromContext,
		store
	]);
	import_react.useEffect(() => {
		if (!open) openEventRef.current = null;
		if (parent.type !== "context-menu") return;
		if (!open) {
			allowOutsidePressDismissalTimeout.clear();
			allowOutsidePressDismissalRef.current = false;
			return;
		}
		allowOutsidePressDismissalTimeout.start(500, () => {
			allowOutsidePressDismissalRef.current = true;
		});
	}, [
		allowOutsidePressDismissalTimeout,
		open,
		parent.type
	]);
	useIsoLayoutEffect(() => {
		if (!open && !hoverEnabled) store.set("hoverEnabled", true);
	}, [
		open,
		hoverEnabled,
		store
	]);
	const setOpen = useStableCallback((nextOpen, eventDetails) => {
		const reason = eventDetails.reason;
		if (open === nextOpen && eventDetails.trigger === activeTriggerElement && lastOpenChangeReason === reason) return;
		eventDetails.preventUnmountOnClose = () => {
			store.set("preventUnmountingOnClose", true);
		};
		if (!nextOpen && eventDetails.trigger == null) eventDetails.trigger = activeTriggerElement ?? void 0;
		onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		store.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
		const nativeEvent = eventDetails.event;
		if (nextOpen === false && nativeEvent?.type === "click" && nativeEvent.pointerType === "touch" && !allowTouchToCloseRef.current) return;
		if (!nextOpen && activeIndex !== null) {
			const activeOption = store.context.itemDomElements.current[activeIndex];
			queueMicrotask(() => {
				activeOption?.setAttribute("tabindex", "-1");
			});
		}
		if (nextOpen && reason === "trigger-focus") {
			allowTouchToCloseRef.current = false;
			allowTouchToCloseTimeout.start(300, () => {
				allowTouchToCloseRef.current = true;
			});
		} else {
			allowTouchToCloseRef.current = true;
			allowTouchToCloseTimeout.clear();
		}
		const isKeyboardClick = (reason === "trigger-press" || reason === "item-press") && nativeEvent.detail === 0 && nativeEvent?.isTrusted;
		const isDismissClose = !nextOpen && (reason === "escape-key" || reason == null);
		const updatedState = {
			open: nextOpen,
			openChangeReason: reason
		};
		openEventRef.current = eventDetails.event ?? null;
		const newTriggerId = eventDetails.trigger?.id ?? null;
		if (newTriggerId || nextOpen) {
			updatedState.activeTriggerId = newTriggerId;
			updatedState.activeTriggerElement = eventDetails.trigger ?? null;
		}
		store.update(updatedState);
		if (parent.type === "menubar" && (reason === "trigger-focus" || reason === "focus-out" || reason === "trigger-hover" || reason === "list-navigation" || reason === "sibling-open")) store.set("instantType", "group");
		else if (isKeyboardClick || isDismissClose) store.set("instantType", isKeyboardClick ? "click" : "dismiss");
		else store.set("instantType", void 0);
	});
	const floatingRootContext = useSyncedFloatingRootContext({
		popupStore: store,
		floatingId,
		nested: floatingParentNodeIdFromContext != null,
		onOpenChange: setOpen
	});
	const floatingEvents = floatingRootContext.context.events;
	import_react.useEffect(() => {
		const handleSetOpenEvent = ({ open: nextOpen, eventDetails }) => setOpen(nextOpen, eventDetails);
		floatingEvents.on("setOpen", handleSetOpenEvent);
		return () => {
			floatingEvents?.off("setOpen", handleSetOpenEvent);
		};
	}, [floatingEvents, setOpen]);
	const handleImperativeClose = import_react.useCallback(() => {
		store.setOpen(false, createChangeEventDetails(imperativeAction));
	}, [store]);
	import_react.useImperativeHandle(actionsRef, () => ({
		unmount: forceUnmount,
		close: handleImperativeClose
	}), [forceUnmount, handleImperativeClose]);
	let ctx;
	if (parent.type === "context-menu") ctx = parent.context;
	import_react.useImperativeHandle(ctx?.positionerRef, () => positionerElement, [positionerElement]);
	import_react.useImperativeHandle(ctx?.actionsRef, () => ({ setOpen }), [setOpen]);
	const dismiss = useDismiss(floatingRootContext, {
		enabled: !disabled,
		bubbles: { escapeKey: closeParentOnEsc && parent.type === "menu" },
		outsidePress() {
			if (parent.type !== "context-menu" || openEventRef.current?.type === "contextmenu") return true;
			return allowOutsidePressDismissalRef.current;
		},
		externalTree: nested ? floatingTreeRoot : void 0
	});
	const direction = useDirection();
	const setActiveIndex = import_react.useCallback((index) => {
		if (store.select("activeIndex") === index) return;
		store.set("activeIndex", index);
	}, [store]);
	const listNavigation$1 = useListNavigation(floatingRootContext, {
		enabled: !disabled,
		listRef: store.context.itemDomElements,
		activeIndex,
		nested: parent.type !== void 0,
		loopFocus,
		orientation,
		parentOrientation: parent.type === "menubar" ? parent.context.orientation : void 0,
		rtl: direction === "rtl",
		disabledIndices: EMPTY_ARRAY,
		onNavigate: setActiveIndex,
		openOnArrowKeyDown: parent.type !== "context-menu",
		externalTree: nested ? floatingTreeRoot : void 0,
		focusItemOnHover: highlightItemOnHover
	});
	const onTyping = import_react.useCallback((nextTyping) => {
		store.context.typingRef.current = nextTyping;
	}, [store]);
	const typeahead = useTypeahead(floatingRootContext, {
		listRef: store.context.itemLabels,
		elementsRef: store.context.itemDomElements,
		activeIndex,
		resetMs: 500,
		onMatch: (index) => {
			if (open && index !== activeIndex) store.set("activeIndex", index);
		},
		onTyping
	});
	const activeTriggerProps = import_react.useMemo(() => {
		const mergedProps = mergeProps(typeahead.reference, listNavigation$1.reference, dismiss.reference, { onMouseMove() {
			store.set("allowMouseEnter", true);
		} }, interactionTypeProps);
		mergedProps["aria-haspopup"] = "menu";
		mergedProps["aria-expanded"] = open;
		return mergedProps;
	}, [
		store,
		typeahead.reference,
		listNavigation$1.reference,
		dismiss.reference,
		interactionTypeProps,
		open
	]);
	const inactiveTriggerProps = import_react.useMemo(() => {
		const mergedProps = mergeProps(listNavigation$1.trigger, dismiss.trigger, interactionTypeProps);
		mergedProps["aria-haspopup"] = "menu";
		mergedProps["aria-expanded"] = false;
		return mergedProps;
	}, [
		listNavigation$1.trigger,
		dismiss.trigger,
		interactionTypeProps
	]);
	const popupProps = import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, {
		id: floatingId,
		role: "menu",
		"aria-labelledby": activeTriggerElement?.id,
		onMouseMove() {
			store.set("allowMouseEnter", true);
			if (parent.type === "menu") store.set("hoverEnabled", false);
		},
		onClick() {
			if (store.select("hoverEnabled")) store.set("hoverEnabled", false);
		},
		onKeyDown(event) {
			const relay = store.select("keyboardEventRelay");
			if (relay && !event.isPropagationStopped()) relay(event);
		}
	}, typeahead.floating, listNavigation$1.floating, dismiss.floating), [
		activeTriggerElement,
		floatingId,
		parent.type,
		store,
		typeahead.floating,
		listNavigation$1.floating,
		dismiss.floating
	]);
	const itemProps = listNavigation$1.item ?? EMPTY_OBJECT;
	usePopupInteractionProps(store, {
		floatingRootContext,
		activeTriggerProps,
		inactiveTriggerProps,
		popupProps,
		itemProps
	});
	const context = import_react.useMemo(() => ({
		store,
		parent: parentFromContext
	}), [store, parentFromContext]);
	const content = /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuRootContext.Provider, {
		value: context,
		children: typeof children === "function" ? children({ payload }) : children
	});
	if (parent.type === void 0 || parent.type === "context-menu") return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingTree, {
		externalTree: floatingTreeRoot,
		children: content
	});
	return content;
});
MenuRoot.displayName = "MenuRoot";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/submenu-root/MenuSubmenuRoot.js
/**
* Groups all parts of a submenu.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
function MenuSubmenuRoot(props) {
	const parentMenu = useMenuRootContext().store;
	const contextValue = import_react.useMemo(() => ({ parentMenu }), [parentMenu]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuSubmenuRootContext.Provider, {
		value: contextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuRoot, { ...props })
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/composite/item/CompositeItem.js
/**
* @internal
*/
function CompositeItem(componentProps) {
	const { render, className, style, state = EMPTY_OBJECT, props = EMPTY_ARRAY, refs = EMPTY_ARRAY, metadata, stateAttributesMapping, tag = "div", ...elementProps } = componentProps;
	const { compositeProps, compositeRef } = useCompositeItem({ metadata });
	return useRenderElement(tag, componentProps, {
		state,
		ref: [...refs, compositeRef],
		props: [
			compositeProps,
			...props,
			elementProps
		],
		stateAttributesMapping
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/utils/findRootOwnerId.js
function findRootOwnerId(node) {
	if (isHTMLElement(node) && node.hasAttribute("data-rootownerid")) return node.getAttribute("data-rootownerid") ?? void 0;
	if (isLastTraversableNode(node)) return;
	return findRootOwnerId(getParentNode(node));
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/popups/useTriggerFocusGuards.js
/**
* Minimal store interface required by the focus guard hook.
* Both PopoverStore and MenuStore satisfy this interface.
*/
/**
* Provides focus guard handlers for popup triggers (Popover, Menu).
*
* When the popup is open, invisible focus guard elements are placed before and after
* the trigger. These handlers close the popup and move focus to the appropriate
* tabbable element when the guards receive focus (i.e. when the user tabs out).
*/
function useTriggerFocusGuards(store, triggerElementRef) {
	const preFocusGuardRef = import_react.useRef(null);
	function handlePreFocusGuardFocus(event) {
		import_react_dom.flushSync(() => {
			store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent, event.currentTarget));
		});
		getTabbableBeforeElement(preFocusGuardRef.current)?.focus();
	}
	function handleFocusTargetFocus(event) {
		const positionerElement = store.select("positionerElement");
		if (positionerElement && isOutsideEvent(event, positionerElement)) store.context.beforeContentFocusGuardRef.current?.focus();
		else {
			import_react_dom.flushSync(() => {
				store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent, event.currentTarget));
			});
			let nextTabbable = getTabbableAfterElement(store.context.triggerFocusTargetRef.current || triggerElementRef.current);
			while (nextTabbable !== null && contains(positionerElement, nextTabbable)) {
				const prevTabbable = nextTabbable;
				nextTabbable = getNextTabbable(nextTabbable);
				if (nextTabbable === prevTabbable) break;
			}
			nextTabbable?.focus();
		}
	}
	return {
		preFocusGuardRef,
		handlePreFocusGuardFocus,
		handleFocusTargetFocus
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/useMixedToggleClickHandler.js
/**
* Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
* For example, a button that opens a popup on mousedown and closes it on click.
* This hook prevents the popup from closing immediately after the mouse button is released.
*/
function useMixedToggleClickHandler(params) {
	const { enabled = true, mouseDownAction, open } = params;
	const ignoreClickRef = import_react.useRef(false);
	return import_react.useMemo(() => {
		if (!enabled) return EMPTY_OBJECT;
		return {
			onMouseDown: (event) => {
				if (mouseDownAction === "open" && !open || mouseDownAction === "close" && open) {
					ignoreClickRef.current = true;
					ownerDocument(event.currentTarget).addEventListener("click", () => {
						ignoreClickRef.current = false;
					}, { once: true });
				}
			},
			onClick: (event) => {
				if (ignoreClickRef.current) {
					ignoreClickRef.current = false;
					event.preventBaseUIHandler();
				}
			}
		};
	}, [
		enabled,
		mouseDownAction,
		open
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/trigger/MenuTrigger.js
var BOUNDARY_OFFSET = 2;
/**
* A button that opens the menu.
* Renders a `<button>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuTrigger = fastComponentRef(function MenuTrigger(componentProps, forwardedRef) {
	const { render, className, style, disabled: disabledProp = false, nativeButton = true, id: idProp, openOnHover: openOnHoverProp, delay = 100, closeDelay = 0, handle, payload, ...elementProps } = componentProps;
	const rootContext = useMenuRootContext(true);
	const store = handle?.store ?? rootContext?.store;
	if (!store) throw new Error("Base UI: <Menu.Trigger> must be either used within a <Menu.Root> component or provided with a handle.");
	const thisTriggerId = useBaseUiId(idProp);
	const isTriggerActive = store.useState("isTriggerActive", thisTriggerId);
	const floatingRootContext = store.useState("floatingRootContext");
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const triggerElementRef = import_react.useRef(null);
	const parent = useMenuParent();
	const compositeRootContext = useCompositeRootContext(true);
	const floatingTreeRootFromContext = useFloatingTree();
	const floatingTreeRoot = import_react.useMemo(() => {
		return floatingTreeRootFromContext ?? new FloatingTreeStore();
	}, [floatingTreeRootFromContext]);
	const floatingNodeId = useFloatingNodeId(floatingTreeRoot);
	const floatingParentNodeId = useFloatingParentNodeId();
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
		payload,
		closeDelay,
		parent,
		floatingTreeRoot,
		floatingNodeId,
		floatingParentNodeId,
		keyboardEventRelay: compositeRootContext?.relayKeyboardEvent
	});
	const isInMenubar = parent.type === "menubar";
	const rootDisabled = store.useState("disabled");
	const disabled = disabledProp || rootDisabled || isInMenubar && parent.context.disabled;
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	import_react.useEffect(() => {
		if (!isOpenedByThisTrigger && parent.type === void 0) store.context.allowMouseUpTriggerRef.current = false;
	}, [
		store,
		isOpenedByThisTrigger,
		parent.type
	]);
	const triggerRef = import_react.useRef(null);
	const allowMouseUpTriggerTimeout = useTimeout();
	const handleDocumentMouseUp = useStableCallback((mouseEvent) => {
		if (!triggerRef.current) return;
		allowMouseUpTriggerTimeout.clear();
		store.context.allowMouseUpTriggerRef.current = false;
		const mouseUpTarget = mouseEvent.target;
		if (contains(triggerRef.current, mouseUpTarget) || contains(store.select("positionerElement"), mouseUpTarget) || mouseUpTarget === triggerRef.current) return;
		if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === store.select("rootId")) return;
		const bounds = getPseudoElementBounds(triggerRef.current);
		if (mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET && mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET && mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET && mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET) return;
		floatingTreeRoot.events.emit("close", {
			domEvent: mouseEvent,
			reason: cancelOpen
		});
	});
	import_react.useEffect(() => {
		if (isOpenedByThisTrigger && store.select("lastOpenChangeReason") === "trigger-hover") ownerDocument(triggerRef.current).addEventListener("mouseup", handleDocumentMouseUp, { once: true });
	}, [
		isOpenedByThisTrigger,
		handleDocumentMouseUp,
		store
	]);
	const parentMenubarHasSubmenuOpen = isInMenubar && parent.context.hasSubmenuOpen;
	const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
		enabled: (openOnHoverProp ?? parentMenubarHasSubmenuOpen) && !disabled && parent.type !== "context-menu" && (!isInMenubar || parentMenubarHasSubmenuOpen && !isMountedByThisTrigger),
		handleClose: safePolygon({ blockPointerEvents: !isInMenubar }),
		mouseOnly: true,
		move: false,
		restMs: parent.type === void 0 ? delay : void 0,
		delay: { close: closeDelay },
		triggerElementRef,
		externalTree: floatingTreeRoot,
		isActiveTrigger: isTriggerActive,
		isClosing: () => store.select("transitionStatus") === "ending"
	});
	const stickIfOpen = useStickIfOpen(isOpenedByThisTrigger, store.select("lastOpenChangeReason"));
	const click = useClick(floatingRootContext, {
		enabled: !disabled && parent.type !== "context-menu",
		event: isOpenedByThisTrigger && isInMenubar ? "click" : "mousedown",
		toggle: true,
		ignoreMouse: false,
		stickIfOpen: parent.type === void 0 ? stickIfOpen : false
	});
	const focus = useFocus(floatingRootContext, { enabled: !disabled && parentMenubarHasSubmenuOpen });
	const mixedToggleHandlers = useMixedToggleClickHandler({
		open: isOpenedByThisTrigger,
		enabled: isInMenubar,
		mouseDownAction: "open"
	});
	const localInteractionProps = import_react.useMemo(() => mergeProps(focus.reference, click.reference), [focus.reference, click.reference]);
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	const { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus } = useTriggerFocusGuards(store, triggerElementRef);
	const state = {
		disabled,
		open: isOpenedByThisTrigger
	};
	const ref = [
		triggerRef,
		forwardedRef,
		buttonRef,
		registerTrigger,
		triggerElementRef
	];
	const props = [
		localInteractionProps,
		hoverProps ?? EMPTY_OBJECT,
		rootTriggerProps,
		{
			"aria-haspopup": "menu",
			"aria-controls": popupId,
			id: thisTriggerId,
			onMouseDown: (event) => {
				if (store.select("open")) return;
				allowMouseUpTriggerTimeout.start(200, () => {
					store.context.allowMouseUpTriggerRef.current = true;
				});
				ownerDocument(event.currentTarget).addEventListener("mouseup", handleDocumentMouseUp, { once: true });
			}
		},
		isInMenubar ? { role: "menuitem" } : {},
		mixedToggleHandlers,
		elementProps,
		getButtonProps
	];
	const element = useRenderElement("button", componentProps, {
		enabled: !isInMenubar,
		stateAttributesMapping: pressableTriggerOpenStateMapping,
		state,
		ref,
		props
	});
	if (isInMenubar) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeItem, {
		tag: "button",
		render,
		className,
		style,
		state,
		refs: ref,
		props,
		stateAttributesMapping: pressableTriggerOpenStateMapping
	});
	if (isOpenedByThisTrigger) return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: preFocusGuardRef,
			onFocus: handlePreFocusGuardFocus
		}, `${thisTriggerId}-pre-focus-guard`),
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: element }, thisTriggerId),
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: store.context.triggerFocusTargetRef,
			onFocus: handleFocusTargetFocus
		}, `${thisTriggerId}-post-focus-guard`)
	] });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: element }, thisTriggerId);
});
MenuTrigger.displayName = "MenuTrigger";
/**
* Determines whether to ignore clicks after a hover-open.
*/
function useStickIfOpen(open, openReason) {
	const stickIfOpenTimeout = useTimeout();
	const [stickIfOpen, setStickIfOpen] = import_react.useState(false);
	useIsoLayoutEffect(() => {
		if (open && openReason === "trigger-hover") {
			setStickIfOpen(true);
			stickIfOpenTimeout.start(500, () => {
				setStickIfOpen(false);
			});
		} else if (!open) {
			stickIfOpenTimeout.clear();
			setStickIfOpen(false);
		}
	}, [
		open,
		openReason,
		stickIfOpenTimeout
	]);
	return stickIfOpen;
}
function useMenuParent() {
	const contextMenuContext = useContextMenuRootContext(true);
	const parentContext = useMenuRootContext(true);
	const menubarContext = useMenubarContext(true);
	return import_react.useMemo(() => {
		if (menubarContext) return {
			type: "menubar",
			context: menubarContext
		};
		if (contextMenuContext && !parentContext) return {
			type: "context-menu",
			context: contextMenuContext
		};
		return { type: void 0 };
	}, [
		contextMenuContext,
		parentContext,
		menubarContext
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/usePopupAutoResize.js
var DEFAULT_ENABLED = () => true;
/**
* Allows the element to automatically resize based on its content while supporting animations.
*/
function usePopupAutoResize(parameters) {
	const { popupElement, positionerElement, content, mounted, enabled = DEFAULT_ENABLED, onMeasureLayout: onMeasureLayoutParam, onMeasureLayoutComplete: onMeasureLayoutCompleteParam, side, direction } = parameters;
	const runOnceAnimationsFinish = useAnimationsFinished(popupElement, true, false);
	const animationFrame = useAnimationFrame();
	const committedDimensionsRef = import_react.useRef(null);
	const liveDimensionsRef = import_react.useRef(null);
	const isInitialRenderRef = import_react.useRef(true);
	const restoreAnchoringStylesRef = import_react.useRef(NOOP);
	const onMeasureLayout = useStableCallback(onMeasureLayoutParam);
	const onMeasureLayoutComplete = useStableCallback(onMeasureLayoutCompleteParam);
	const anchoringStyles = import_react.useMemo(() => {
		let isOriginSide = side === "top";
		let isPhysicalLeft = side === "left";
		if (direction === "rtl") {
			isOriginSide = isOriginSide || side === "inline-end";
			isPhysicalLeft = isPhysicalLeft || side === "inline-end";
		} else {
			isOriginSide = isOriginSide || side === "inline-start";
			isPhysicalLeft = isPhysicalLeft || side === "inline-start";
		}
		return isOriginSide ? {
			position: "absolute",
			[side === "top" ? "bottom" : "top"]: "0",
			[isPhysicalLeft ? "right" : "left"]: "0"
		} : EMPTY_OBJECT;
	}, [side, direction]);
	useIsoLayoutEffect(() => {
		if (!mounted || !enabled() || typeof ResizeObserver !== "function") {
			restoreAnchoringStylesRef.current = NOOP;
			isInitialRenderRef.current = true;
			committedDimensionsRef.current = null;
			liveDimensionsRef.current = null;
			return;
		}
		if (!popupElement || !positionerElement) return;
		restoreAnchoringStylesRef.current = applyElementStyles(popupElement, anchoringStyles);
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) liveDimensionsRef.current = {
				width: Math.ceil(entry.borderBoxSize[0].inlineSize),
				height: Math.ceil(entry.borderBoxSize[0].blockSize)
			};
		});
		observer.observe(popupElement);
		setPopupCssSize(popupElement, "auto");
		const restorePopupPosition = overrideElementStyle(popupElement, "position", "static");
		const restorePopupTransform = overrideElementStyle(popupElement, "transform", "none");
		const restorePopupScale = overrideElementStyle(popupElement, "scale", "1");
		const restorePositionerAvailableSize = applyElementStyles(positionerElement, {
			"--available-width": "max-content",
			"--available-height": "max-content"
		});
		function restoreMeasurementOverrides() {
			restorePopupPosition();
			restorePopupTransform();
			restorePositionerAvailableSize();
		}
		function restoreMeasurementOverridesIncludingScale() {
			restoreMeasurementOverrides();
			restorePopupScale();
		}
		onMeasureLayout?.();
		if (isInitialRenderRef.current || committedDimensionsRef.current === null) {
			setPositionerCssSize(positionerElement, "max-content");
			const dimensions = getCssDimensions(popupElement);
			committedDimensionsRef.current = dimensions;
			setPositionerCssSize(positionerElement, dimensions);
			restoreMeasurementOverridesIncludingScale();
			onMeasureLayoutComplete?.(null, dimensions);
			isInitialRenderRef.current = false;
			return () => {
				observer.disconnect();
				restoreAnchoringStylesRef.current();
				restoreAnchoringStylesRef.current = NOOP;
			};
		}
		setPopupCssSize(popupElement, "auto");
		setPositionerCssSize(positionerElement, "max-content");
		const previousDimensions = committedDimensionsRef.current ?? liveDimensionsRef.current;
		const newDimensions = getCssDimensions(popupElement);
		committedDimensionsRef.current = newDimensions;
		if (!previousDimensions) {
			setPositionerCssSize(positionerElement, newDimensions);
			restoreMeasurementOverridesIncludingScale();
			onMeasureLayoutComplete?.(null, newDimensions);
			return () => {
				observer.disconnect();
				animationFrame.cancel();
				restoreAnchoringStylesRef.current();
				restoreAnchoringStylesRef.current = NOOP;
			};
		}
		setPopupCssSize(popupElement, previousDimensions);
		restoreMeasurementOverridesIncludingScale();
		onMeasureLayoutComplete?.(previousDimensions, newDimensions);
		setPositionerCssSize(positionerElement, newDimensions);
		const abortController = new AbortController();
		animationFrame.request(() => {
			setPopupCssSize(popupElement, newDimensions);
			runOnceAnimationsFinish(() => {
				popupElement.style.setProperty("--popup-width", "auto");
				popupElement.style.setProperty("--popup-height", "auto");
			}, abortController.signal);
		});
		return () => {
			observer.disconnect();
			abortController.abort();
			animationFrame.cancel();
			restoreAnchoringStylesRef.current();
			restoreAnchoringStylesRef.current = NOOP;
		};
	}, [
		content,
		popupElement,
		positionerElement,
		runOnceAnimationsFinish,
		animationFrame,
		enabled,
		mounted,
		onMeasureLayout,
		onMeasureLayoutComplete,
		anchoringStyles
	]);
}
function overrideElementStyle(element, property, value) {
	const originalValue = element.style.getPropertyValue(property);
	element.style.setProperty(property, value);
	return () => {
		element.style.setProperty(property, originalValue);
	};
}
function applyElementStyles(element, styles) {
	const restorers = [];
	for (const [key, value] of Object.entries(styles)) restorers.push(overrideElementStyle(element, key, value));
	return restorers.length ? () => {
		restorers.forEach((restore) => restore());
	} : NOOP;
}
function setPopupCssSize(popupElement, size) {
	const width = size === "auto" ? "auto" : `${size.width}px`;
	const height = size === "auto" ? "auto" : `${size.height}px`;
	popupElement.style.setProperty("--popup-width", width);
	popupElement.style.setProperty("--popup-height", height);
}
function setPositionerCssSize(positionerElement, size) {
	const width = size === "max-content" ? "max-content" : `${size.width}px`;
	const height = size === "max-content" ? "max-content" : `${size.height}px`;
	positionerElement.style.setProperty("--positioner-width", width);
	positionerElement.style.setProperty("--positioner-height", height);
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/usePopupViewport.js
/**
* Builds morphing viewport containers for popups that animate between trigger-based content.
* Handles previous-content snapshots, auto-resize, and state attributes for transitions.
*/
function usePopupViewport(parameters) {
	const { store, side, cssVars, children } = parameters;
	const direction = useDirection();
	const activeTrigger = store.useState("activeTriggerElement");
	const activeTriggerId = store.useState("activeTriggerId");
	const open = store.useState("open");
	const payload = store.useState("payload");
	const mounted = store.useState("mounted");
	const popupElement = store.useState("popupElement");
	const positionerElement = store.useState("positionerElement");
	const previousActiveTrigger = usePreviousValue(open ? activeTrigger : null);
	const currentContentKey = usePopupContentKey(activeTriggerId, payload);
	const capturedNodeRef = import_react.useRef(null);
	const [previousContentNode, setPreviousContentNode] = import_react.useState(null);
	const [newTriggerOffset, setNewTriggerOffset] = import_react.useState(null);
	const currentContainerRef = import_react.useRef(null);
	const previousContainerRef = import_react.useRef(null);
	const onAnimationsFinished = useAnimationsFinished(currentContainerRef, true, false);
	const cleanupFrame = useAnimationFrame();
	const [previousContentDimensions, setPreviousContentDimensions] = import_react.useState(null);
	const [showStartingStyleAttribute, setShowStartingStyleAttribute] = import_react.useState(false);
	useIsoLayoutEffect(() => {
		store.set("hasViewport", true);
		return () => {
			store.set("hasViewport", false);
		};
	}, [store]);
	const handleMeasureLayout = useStableCallback(() => {
		currentContainerRef.current?.style.setProperty("animation", "none");
		currentContainerRef.current?.style.setProperty("transition", "none");
		previousContainerRef.current?.style.setProperty("display", "none");
	});
	const handleMeasureLayoutComplete = useStableCallback((previousDimensions) => {
		currentContainerRef.current?.style.removeProperty("animation");
		currentContainerRef.current?.style.removeProperty("transition");
		previousContainerRef.current?.style.removeProperty("display");
		if (previousDimensions) setPreviousContentDimensions(previousDimensions);
	});
	const lastHandledTriggerRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (activeTrigger && previousActiveTrigger && activeTrigger !== previousActiveTrigger && lastHandledTriggerRef.current !== activeTrigger && capturedNodeRef.current) {
			setPreviousContentNode(capturedNodeRef.current);
			setShowStartingStyleAttribute(true);
			const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
			setNewTriggerOffset(offset);
			cleanupFrame.request(() => {
				import_react_dom.flushSync(() => {
					setShowStartingStyleAttribute(false);
				});
				onAnimationsFinished(() => {
					setPreviousContentNode(null);
					setPreviousContentDimensions(null);
					capturedNodeRef.current = null;
				});
			});
			lastHandledTriggerRef.current = activeTrigger;
		}
	}, [
		activeTrigger,
		previousActiveTrigger,
		previousContentNode,
		onAnimationsFinished,
		cleanupFrame
	]);
	useIsoLayoutEffect(() => {
		const source = currentContainerRef.current;
		if (!source) return;
		const wrapper = ownerDocument(source).createElement("div");
		for (const child of Array.from(source.childNodes)) wrapper.appendChild(child.cloneNode(true));
		capturedNodeRef.current = wrapper;
	});
	const isTransitioning = previousContentNode != null;
	let childrenToRender;
	if (!isTransitioning) childrenToRender = /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		"data-current": true,
		ref: currentContainerRef,
		children
	}, currentContentKey);
	else childrenToRender = /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		"data-previous": true,
		inert: inertValue(true),
		ref: previousContainerRef,
		style: {
			...previousContentDimensions ? {
				[cssVars.popupWidth]: `${previousContentDimensions.width}px`,
				[cssVars.popupHeight]: `${previousContentDimensions.height}px`
			} : null,
			position: "absolute"
		},
		"data-ending-style": showStartingStyleAttribute ? void 0 : ""
	}, "previous"), /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		"data-current": true,
		ref: currentContainerRef,
		"data-starting-style": showStartingStyleAttribute ? "" : void 0,
		children
	}, currentContentKey)] });
	useIsoLayoutEffect(() => {
		const container = previousContainerRef.current;
		if (!container || !previousContentNode) return;
		container.replaceChildren(...Array.from(previousContentNode.childNodes));
	}, [previousContentNode]);
	usePopupAutoResize({
		popupElement,
		positionerElement,
		mounted,
		content: payload,
		onMeasureLayout: handleMeasureLayout,
		onMeasureLayoutComplete: handleMeasureLayoutComplete,
		side,
		direction
	});
	const state = {
		activationDirection: getActivationDirection(newTriggerOffset),
		transitioning: isTransitioning
	};
	return {
		children: childrenToRender,
		state
	};
}
/**
* Returns a string describing the provided offset.
* It describes both the horizontal and vertical offset, separated by a space.
*
* @param offset
*/
function getActivationDirection(offset) {
	if (!offset) return;
	return `${getValueWithTolerance(offset.horizontal, 5, "right", "left")} ${getValueWithTolerance(offset.vertical, 5, "down", "up")}`;
}
/**
* Returns a label describing the value (positive/negative) treating values
* within tolerance as zero.
*
* @param value Value to check
* @param tolerance Tolerance to treat the value as zero.
* @param positiveLabel
* @param negativeLabel
* @returns If 0 < abs(value) < tolerance, returns an empty string. Otherwise returns positiveLabel or negativeLabel.
*/
function getValueWithTolerance(value, tolerance, positiveLabel, negativeLabel) {
	if (value > tolerance) return positiveLabel;
	if (value < -tolerance) return negativeLabel;
	return "";
}
/**
* Calculates the relative position between centers of two elements.
*/
function calculateRelativePosition(from, to) {
	const fromRect = from.getBoundingClientRect();
	const toRect = to.getBoundingClientRect();
	const fromCenter = {
		x: fromRect.left + fromRect.width / 2,
		y: fromRect.top + fromRect.height / 2
	};
	const toCenter = {
		x: toRect.left + toRect.width / 2,
		y: toRect.top + toRect.height / 2
	};
	return {
		horizontal: toCenter.x - fromCenter.x,
		vertical: toCenter.y - fromCenter.y
	};
}
/**
* Returns a key that forces remounting content when triggers change or a payload is updated.
*/
function usePopupContentKey(activeTriggerId, payload) {
	const [contentKey, setContentKey] = import_react.useState(0);
	const previousActiveTriggerIdRef = import_react.useRef(activeTriggerId);
	const previousPayloadRef = import_react.useRef(payload);
	const pendingPayloadUpdateRef = import_react.useRef(false);
	useIsoLayoutEffect(() => {
		const previousActiveTriggerId = previousActiveTriggerIdRef.current;
		const previousPayload = previousPayloadRef.current;
		const triggerIdChanged = activeTriggerId !== previousActiveTriggerId;
		const payloadChanged = payload !== previousPayload;
		if (triggerIdChanged) {
			setContentKey((value) => value + 1);
			pendingPayloadUpdateRef.current = !payloadChanged;
		} else if (pendingPayloadUpdateRef.current && payloadChanged) {
			setContentKey((value) => value + 1);
			pendingPayloadUpdateRef.current = false;
		}
		previousActiveTriggerIdRef.current = activeTriggerId;
		previousPayloadRef.current = payload;
	}, [activeTriggerId, payload]);
	return `${activeTriggerId ?? "current"}-${contentKey}`;
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/viewport/MenuViewportCssVars.js
var MenuViewportCssVars = /*#__PURE__*/ function(MenuViewportCssVars) {
	/**
	* The width of the parent popup.
	* This variable is placed on the 'previous' container and stores the width of the popup when the previous content was rendered.
	* It can be used to freeze the dimensions of the popup when animating between different content.
	*/
	MenuViewportCssVars["popupWidth"] = "--popup-width";
	/**
	* The height of the parent popup.
	* This variable is placed on the 'previous' container and stores the height of the popup when the previous content was rendered.
	* It can be used to freeze the dimensions of the popup when animating between different content.
	*/
	MenuViewportCssVars["popupHeight"] = "--popup-height";
	return MenuViewportCssVars;
}({});
//#endregion
//#region node_modules/@base-ui/react/esm/menu/viewport/MenuViewport.js
var stateAttributesMapping = { activationDirection: (value) => value ? { "data-activation-direction": value } : null };
/**
* A viewport for displaying content transitions.
* This component is only required if one popup can be opened by multiple triggers, its content
* changes based on the trigger, and switching between them is animated.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuViewport = /*#__PURE__*/ import_react.forwardRef(function MenuViewport(componentProps, forwardedRef) {
	const { render, className, style, children, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const { side } = useMenuPositionerContext();
	const instantType = store.useState("instantType");
	const { children: childrenToRender, state: viewportState } = usePopupViewport({
		store,
		side,
		cssVars: MenuViewportCssVars,
		children
	});
	const state = {
		activationDirection: viewportState.activationDirection,
		transitioning: viewportState.transitioning,
		instant: instantType
	};
	return useRenderElement("div", componentProps, {
		state,
		ref: forwardedRef,
		props: [elementProps, { children: childrenToRender }],
		stateAttributesMapping
	});
});
MenuViewport.displayName = "MenuViewport";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/submenu-trigger/MenuSubmenuTrigger.js
/**
* A menu item that opens a submenu.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuSubmenuTrigger = /*#__PURE__*/ import_react.forwardRef(function MenuSubmenuTrigger(componentProps, forwardedRef) {
	const { render, className, style, label, id: idProp, nativeButton = false, openOnHover = true, delay = 100, closeDelay = 0, disabled: disabledProp = false, ...elementProps } = componentProps;
	const listItem = useCompositeListItem();
	const menuPositionerContext = useMenuPositionerContext();
	const { store } = useMenuRootContext();
	const thisTriggerId = useBaseUiId(idProp);
	const open = store.useState("open");
	const floatingRootContext = store.useState("floatingRootContext");
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const baseRegisterTrigger = useTriggerRegistration(thisTriggerId, store);
	const registerTrigger = import_react.useCallback((element) => {
		const cleanup = baseRegisterTrigger(element);
		if (element !== null && store.select("open") && store.select("activeTriggerId") == null) store.update({
			activeTriggerId: thisTriggerId,
			activeTriggerElement: element,
			closeDelay
		});
		return cleanup;
	}, [
		baseRegisterTrigger,
		closeDelay,
		store,
		thisTriggerId
	]);
	const triggerElementRef = import_react.useRef(null);
	const handleTriggerElementRef = import_react.useCallback((el) => {
		triggerElementRef.current = el;
		store.set("activeTriggerElement", el);
	}, [store]);
	useIsoLayoutEffect(() => {
		const element = triggerElementRef.current;
		if (element && isElementDisabled(element) && !disabledProp) {
			const ownerStackMessage = SafeReact.captureOwnerStack?.() || "";
			warn(`A disabled element was detected on <Menu.SubmenuTrigger>. To properly disable the trigger, use the \`disabled\` prop on the component instead of setting it on the rendered element.${ownerStackMessage}`);
		}
	});
	const submenuRootContext = useMenuSubmenuRootContext();
	if (!submenuRootContext?.parentMenu) throw new Error("Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.");
	store.useSyncedValue("closeDelay", closeDelay);
	const parentMenuStore = submenuRootContext.parentMenu;
	const itemProps = parentMenuStore.useState("itemProps");
	const highlighted = parentMenuStore.useState("isActive", listItem.index);
	const itemMetadata = import_react.useMemo(() => ({
		type: "submenu-trigger",
		setActive() {
			parentMenuStore.set("activeIndex", listItem.index);
		}
	}), [parentMenuStore, listItem.index]);
	const rootDisabled = store.useState("disabled");
	const disabled = disabledProp || rootDisabled;
	const { getItemProps, itemRef } = useMenuItem({
		closeOnClick: false,
		disabled,
		highlighted,
		id: thisTriggerId,
		store,
		typingRef: parentMenuStore.context.typingRef,
		nativeButton,
		itemMetadata,
		nodeId: menuPositionerContext?.context.nodeId
	});
	const hoverEnabled = store.useState("hoverEnabled");
	const allowMouseEnter = parentMenuStore.useState("allowMouseEnter");
	const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
		enabled: hoverEnabled && openOnHover && !disabled,
		handleClose: safePolygon({ blockPointerEvents: true }),
		mouseOnly: true,
		move: true,
		restMs: delay,
		delay: allowMouseEnter ? {
			open: delay,
			close: closeDelay
		} : 0,
		triggerElementRef,
		externalTree: floatingTreeRoot,
		isClosing: () => store.select("transitionStatus") === "ending"
	});
	const localInteractionProps = useClick(floatingRootContext, {
		enabled: !disabled,
		event: "mousedown",
		toggle: !openOnHover,
		ignoreMouse: openOnHover,
		stickIfOpen: false
	}).reference ?? EMPTY_OBJECT;
	const rootTriggerProps = store.useState("triggerProps", true);
	delete rootTriggerProps.id;
	return useRenderElement("div", componentProps, {
		state: {
			disabled,
			highlighted,
			open
		},
		stateAttributesMapping: triggerOpenStateMapping,
		props: [
			localInteractionProps,
			hoverProps,
			rootTriggerProps,
			itemProps,
			{
				"aria-controls": popupId,
				tabIndex: open || highlighted ? 0 : -1,
				onBlur() {
					if (highlighted) parentMenuStore.set("activeIndex", null);
				}
			},
			elementProps,
			getItemProps
		],
		ref: [
			forwardedRef,
			listItem.ref,
			itemRef,
			registerTrigger,
			handleTriggerElementRef
		]
	});
});
MenuSubmenuTrigger.displayName = "MenuSubmenuTrigger";
//#endregion
//#region node_modules/@base-ui/react/esm/menu/store/MenuHandle.js
var MenuHandle = class {
	/**
	* Internal store holding the menu's state.
	* @internal
	*/
	constructor() {
		this.store = new MenuStore();
	}
	/**
	* Opens the menu and associates it with the trigger with the given id.
	* The trigger must be a Menu.Trigger component with this handle passed as a prop.
	*
	* @param triggerId ID of the trigger to associate with the menu.
	*/
	open(triggerId) {
		const triggerElement = triggerId ? this.store.context.triggerElements.getById(triggerId) : void 0;
		if (triggerId && !triggerElement) throw new Error(`Base UI: MenuHandle.open: No trigger found with id "${triggerId}".`);
		this.store.setOpen(true, createChangeEventDetails("imperative-action", void 0, triggerElement));
	}
	/**
	* Closes the menu.
	*/
	close() {
		this.store.setOpen(false, createChangeEventDetails("imperative-action", void 0, void 0));
	}
	/**
	* Indicates whether the menu is currently open.
	*/
	get isOpen() {
		return this.store.select("open");
	}
};
/**
* Creates a new handle to connect a Menu.Root with detached Menu.Trigger components.
*/
function createMenuHandle() {
	return new MenuHandle();
}
//#endregion
//#region node_modules/@base-ui/react/esm/menu/index.parts.js
var index_parts_exports = /* @__PURE__ */ __exportAll({
	Arrow: () => MenuArrow,
	Backdrop: () => MenuBackdrop,
	CheckboxItem: () => MenuCheckboxItem,
	CheckboxItemIndicator: () => MenuCheckboxItemIndicator,
	Group: () => MenuGroup,
	GroupLabel: () => MenuGroupLabel,
	Handle: () => MenuHandle,
	Item: () => MenuItem,
	LinkItem: () => MenuLinkItem,
	Popup: () => MenuPopup,
	Portal: () => MenuPortal,
	Positioner: () => MenuPositioner,
	RadioGroup: () => MenuRadioGroup,
	RadioItem: () => MenuRadioItem,
	RadioItemIndicator: () => MenuRadioItemIndicator,
	Root: () => MenuRoot,
	Separator: () => Separator,
	SubmenuRoot: () => MenuSubmenuRoot,
	SubmenuTrigger: () => MenuSubmenuTrigger,
	Trigger: () => MenuTrigger,
	Viewport: () => MenuViewport,
	createHandle: () => createMenuHandle
});
//#endregion
export { index_parts_exports as Menu };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQGJhc2UtdWlfcmVhY3RfbWVudS5qcyIsIm5hbWVzIjpbIlJFQVNPTlMudHJpZ2dlckZvY3VzIiwiaXNDbGlja0xpa2VPcGVuRXZlbnQiLCJpc0NsaWNrTGlrZU9wZW5FdmVudFNoYXJlZCIsIlJFQVNPTlMudHJpZ2dlckhvdmVyIiwiaXNJbnNpZGVFbmFibGVkVHJpZ2dlciIsImlzQ2xpY2tMaWtlT3BlbkV2ZW50IiwiaXNDbGlja0xpa2VPcGVuRXZlbnRTaGFyZWQiLCJSRUFTT05TLnRyaWdnZXJIb3ZlciIsImlzSW5zaWRlRW5hYmxlZFRyaWdnZXIiLCJzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nIiwiYmFzZU1hcHBpbmciLCJSRUFTT05TLml0ZW1QcmVzcyIsIlJFQVNPTlMuaXRlbVByZXNzIiwic3RhdGVBdHRyaWJ1dGVzTWFwcGluZyIsImJhc2VNYXBwaW5nIiwiUkVBU09OUy5zaWJsaW5nT3BlbiIsIlJFQVNPTlMuaXRlbVByZXNzIiwiUkVBU09OUy5pbXBlcmF0aXZlQWN0aW9uIiwibGlzdE5hdmlnYXRpb24iLCJSRUFTT05TLmZvY3VzT3V0IiwiUkVBU09OUy5jYW5jZWxPcGVuIl0sInNvdXJjZXMiOlsiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2hvb2tzL3VzZUhvdmVyU2hhcmVkLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2hvb2tzL3VzZUZvY3VzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2hvb2tzL3VzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC9ob29rcy91c2VIb3ZlckZsb2F0aW5nSW50ZXJhY3Rpb24uanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlSG92ZXJSZWZlcmVuY2VJbnRlcmFjdGlvbi5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC9zYWZlUG9seWdvbi5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L3Bvc2l0aW9uZXIvTWVudVBvc2l0aW9uZXJDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcm9vdC9NZW51Um9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9hcnJvdy9NZW51QXJyb3cuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vY29udGV4dC1tZW51L3Jvb3QvQ29udGV4dE1lbnVSb290Q29udGV4dC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L2JhY2tkcm9wL01lbnVCYWNrZHJvcC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L2NoZWNrYm94LWl0ZW0vTWVudUNoZWNrYm94SXRlbUNvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9pdGVtL3VzZU1lbnVJdGVtQ29tbW9uUHJvcHMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9pdGVtL3VzZU1lbnVJdGVtLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvY2hlY2tib3gtaXRlbS9NZW51Q2hlY2tib3hJdGVtRGF0YUF0dHJpYnV0ZXMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS91dGlscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvY2hlY2tib3gtaXRlbS9NZW51Q2hlY2tib3hJdGVtLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvY2hlY2tib3gtaXRlbS1pbmRpY2F0b3IvTWVudUNoZWNrYm94SXRlbUluZGljYXRvci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L2dyb3VwL01lbnVHcm91cENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9ncm91cC9NZW51R3JvdXAuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9ncm91cC1sYWJlbC9NZW51R3JvdXBMYWJlbC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L2l0ZW0vTWVudUl0ZW0uanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9saW5rLWl0ZW0vTWVudUxpbmtJdGVtLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcG9wdXAvTWVudVBvcHVwLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcG9ydGFsL01lbnVQb3J0YWxDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcG9ydGFsL01lbnVQb3J0YWwuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9wb3NpdGlvbmVyL01lbnVQb3NpdGlvbmVyLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcmFkaW8tZ3JvdXAvTWVudVJhZGlvR3JvdXBDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcmFkaW8tZ3JvdXAvTWVudVJhZGlvR3JvdXAuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9yYWRpby1pdGVtL01lbnVSYWRpb0l0ZW1Db250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcmFkaW8taXRlbS9NZW51UmFkaW9JdGVtLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvcmFkaW8taXRlbS1pbmRpY2F0b3IvTWVudVJhZGlvSXRlbUluZGljYXRvci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51YmFyL01lbnViYXJDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvc3RvcmUvTWVudVN0b3JlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvc3VibWVudS1yb290L01lbnVTdWJtZW51Um9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9yb290L01lbnVSb290LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvc3VibWVudS1yb290L01lbnVTdWJtZW51Um9vdC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvY29tcG9zaXRlL2l0ZW0vQ29tcG9zaXRlSXRlbS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L3V0aWxzL2ZpbmRSb290T3duZXJJZC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9wb3B1cHMvdXNlVHJpZ2dlckZvY3VzR3VhcmRzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3V0aWxzL3VzZU1peGVkVG9nZ2xlQ2xpY2tIYW5kbGVyLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvdHJpZ2dlci9NZW51VHJpZ2dlci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy91c2VQb3B1cEF1dG9SZXNpemUuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvdXNlUG9wdXBWaWV3cG9ydC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L3ZpZXdwb3J0L01lbnVWaWV3cG9ydENzc1ZhcnMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS92aWV3cG9ydC9NZW51Vmlld3BvcnQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vbWVudS9zdWJtZW51LXRyaWdnZXIvTWVudVN1Ym1lbnVUcmlnZ2VyLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL21lbnUvc3RvcmUvTWVudUhhbmRsZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9tZW51L2luZGV4LnBhcnRzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzTW91c2VMaWtlUG9pbnRlclR5cGUgfSBmcm9tIFwiLi4vdXRpbHMvZXZlbnQuanNcIjtcbmV4cG9ydCB7IGlzVGFyZ2V0SW5zaWRlRW5hYmxlZFRyaWdnZXIgYXMgaXNJbnNpZGVFbmFibGVkVHJpZ2dlciB9IGZyb20gXCIuLi91dGlscy9lbGVtZW50LmpzXCI7XG5mdW5jdGlvbiByZXNvbHZlVmFsdWUodmFsdWUsIHBvaW50ZXJUeXBlKSB7XG4gIGlmIChwb2ludGVyVHlwZSAhPSBudWxsICYmICFpc01vdXNlTGlrZVBvaW50ZXJUeXBlKHBvaW50ZXJUeXBlKSkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdmFsdWUoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVsYXkodmFsdWUsIHByb3AsIHBvaW50ZXJUeXBlKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHJlc29sdmVWYWx1ZSh2YWx1ZSwgcG9pbnRlclR5cGUpO1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHJldHVybiByZXN1bHQ/Lltwcm9wXTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXN0TXModmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB2YWx1ZSgpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0NsaWNrTGlrZU9wZW5FdmVudChvcGVuRXZlbnRUeXBlLCBpbnRlcmFjdGVkSW5zaWRlKSB7XG4gIHJldHVybiBpbnRlcmFjdGVkSW5zaWRlIHx8IG9wZW5FdmVudFR5cGUgPT09ICdjbGljaycgfHwgb3BlbkV2ZW50VHlwZSA9PT0gJ21vdXNlZG93bic7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNIb3Zlck9wZW5FdmVudChvcGVuRXZlbnRUeXBlKSB7XG4gIHJldHVybiBvcGVuRXZlbnRUeXBlPy5pbmNsdWRlcygnbW91c2UnKSAmJiBvcGVuRXZlbnRUeXBlICE9PSAnbW91c2Vkb3duJztcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGFkZEV2ZW50TGlzdGVuZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy9hZGRFdmVudExpc3RlbmVyJztcbmltcG9ydCB7IGlzTWFjLCBpc1NhZmFyaSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2RldGVjdEJyb3dzZXInO1xuaW1wb3J0IHsgbWVyZ2VDbGVhbnVwcyB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL21lcmdlQ2xlYW51cHMnO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IHVzZVRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IGdldFdpbmRvdywgaXNFbGVtZW50LCBpc0hUTUxFbGVtZW50IH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzL2RvbSc7XG5pbXBvcnQgeyBjcmVhdGVBdHRyaWJ1dGUgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlQXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyBhY3RpdmVFbGVtZW50LCBjb250YWlucywgZ2V0VGFyZ2V0LCBpc1RhcmdldEluc2lkZUVuYWJsZWRUcmlnZ2VyLCBpc1R5cGVhYmxlRWxlbWVudCwgbWF0Y2hlc0ZvY3VzVmlzaWJsZSB9IGZyb20gXCIuLi91dGlscy9lbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuY29uc3QgaXNNYWNTYWZhcmkgPSBpc01hYyAmJiBpc1NhZmFyaTtcbi8qKlxuICogT3BlbnMgdGhlIGZsb2F0aW5nIGVsZW1lbnQgd2hpbGUgdGhlIHJlZmVyZW5jZSBlbGVtZW50IGhhcyBmb2N1cywgbGlrZSBDU1NcbiAqIGA6Zm9jdXNgLlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL3VzZUZvY3VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VGb2N1cyhjb250ZXh0LCBwcm9wcyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBlbmFibGVkID0gdHJ1ZSxcbiAgICBkZWxheVxuICB9ID0gcHJvcHM7XG4gIGNvbnN0IHN0b3JlID0gJ3Jvb3RTdG9yZScgaW4gY29udGV4dCA/IGNvbnRleHQucm9vdFN0b3JlIDogY29udGV4dDtcbiAgY29uc3Qge1xuICAgIGV2ZW50cyxcbiAgICBkYXRhUmVmXG4gIH0gPSBzdG9yZS5jb250ZXh0O1xuICBjb25zdCBibG9ja0ZvY3VzUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgLy8gVHJhY2sgd2hpY2ggcmVmZXJlbmNlIHNob3VsZCBiZSBibG9ja2VkIGZyb20gcmUtb3BlbmluZyBhZnRlciBFc2NhcGUvcHJlc3MgZGlzbWlzc2FsLlxuICBjb25zdCBibG9ja2VkUmVmZXJlbmNlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBrZXlib2FyZE1vZGFsaXR5UmVmID0gUmVhY3QudXNlUmVmKHRydWUpO1xuICBjb25zdCB0aW1lb3V0ID0gdXNlVGltZW91dCgpO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGRvbVJlZmVyZW5jZSA9IHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpO1xuICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3Qgd2luID0gZ2V0V2luZG93KGRvbVJlZmVyZW5jZSk7XG5cbiAgICAvLyBJZiB0aGUgcmVmZXJlbmNlIHdhcyBmb2N1c2VkIGFuZCB0aGUgdXNlciBsZWZ0IHRoZSB0YWIvd2luZG93LCBhbmQgdGhlXG4gICAgLy8gZmxvYXRpbmcgZWxlbWVudCB3YXMgbm90IG9wZW4sIHRoZSBmb2N1cyBzaG91bGQgYmUgYmxvY2tlZCB3aGVuIHRoZXlcbiAgICAvLyByZXR1cm4gdG8gdGhlIHRhYi93aW5kb3cuXG4gICAgZnVuY3Rpb24gb25CbHVyKCkge1xuICAgICAgY29uc3QgY3VycmVudERvbVJlZmVyZW5jZSA9IHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpO1xuICAgICAgaWYgKCFzdG9yZS5zZWxlY3QoJ29wZW4nKSAmJiBpc0hUTUxFbGVtZW50KGN1cnJlbnREb21SZWZlcmVuY2UpICYmIGN1cnJlbnREb21SZWZlcmVuY2UgPT09IGFjdGl2ZUVsZW1lbnQob3duZXJEb2N1bWVudChjdXJyZW50RG9tUmVmZXJlbmNlKSkpIHtcbiAgICAgICAgYmxvY2tGb2N1c1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gb25LZXlEb3duKCkge1xuICAgICAga2V5Ym9hcmRNb2RhbGl0eVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Qb2ludGVyRG93bigpIHtcbiAgICAgIGtleWJvYXJkTW9kYWxpdHlSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VDbGVhbnVwcyhhZGRFdmVudExpc3RlbmVyKHdpbiwgJ2JsdXInLCBvbkJsdXIpLCBpc01hY1NhZmFyaSAmJiBhZGRFdmVudExpc3RlbmVyKHdpbiwgJ2tleWRvd24nLCBvbktleURvd24sIHRydWUpLCBpc01hY1NhZmFyaSAmJiBhZGRFdmVudExpc3RlbmVyKHdpbiwgJ3BvaW50ZXJkb3duJywgb25Qb2ludGVyRG93biwgdHJ1ZSkpO1xuICB9LCBbc3RvcmUsIGVuYWJsZWRdKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uT3BlbkNoYW5nZUxvY2FsKGRldGFpbHMpIHtcbiAgICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gUkVBU09OUy50cmlnZ2VyUHJlc3MgfHwgZGV0YWlscy5yZWFzb24gPT09IFJFQVNPTlMuZXNjYXBlS2V5KSB7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZUVsZW1lbnQgPSBzdG9yZS5zZWxlY3QoJ2RvbVJlZmVyZW5jZUVsZW1lbnQnKTtcbiAgICAgICAgaWYgKGlzRWxlbWVudChyZWZlcmVuY2VFbGVtZW50KSkge1xuICAgICAgICAgIGJsb2NrZWRSZWZlcmVuY2VSZWYuY3VycmVudCA9IHJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgICAgICAgYmxvY2tGb2N1c1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBldmVudHMub24oJ29wZW5jaGFuZ2UnLCBvbk9wZW5DaGFuZ2VMb2NhbCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGV2ZW50cy5vZmYoJ29wZW5jaGFuZ2UnLCBvbk9wZW5DaGFuZ2VMb2NhbCk7XG4gICAgfTtcbiAgfSwgW2V2ZW50cywgZW5hYmxlZCwgc3RvcmVdKTtcbiAgY29uc3QgcmVmZXJlbmNlID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgZnVuY3Rpb24gcmVzZXRCbG9ja2VkRm9jdXMoKSB7XG4gICAgICBibG9ja0ZvY3VzUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGJsb2NrZWRSZWZlcmVuY2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBvbk1vdXNlTGVhdmUoKSB7XG4gICAgICAgIHJlc2V0QmxvY2tlZEZvY3VzKCk7XG4gICAgICB9LFxuICAgICAgb25Gb2N1cyhldmVudCkge1xuICAgICAgICBjb25zdCBmb2N1c1RhcmdldCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgIGlmIChibG9ja0ZvY3VzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICBpZiAoYmxvY2tlZFJlZmVyZW5jZVJlZi5jdXJyZW50ID09PSBmb2N1c1RhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNldEJsb2NrZWRGb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudC5uYXRpdmVFdmVudCk7XG4gICAgICAgIGlmIChpc0VsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICAgIC8vIFNhZmFyaSBmYWlscyB0byBtYXRjaCBgOmZvY3VzLXZpc2libGVgIGlmIGZvY3VzIHdhcyBpbml0aWFsbHlcbiAgICAgICAgICAvLyBvdXRzaWRlIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICBpZiAoaXNNYWNTYWZhcmkgJiYgIWV2ZW50LnJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgICAgICAgIGlmICgha2V5Ym9hcmRNb2RhbGl0eVJlZi5jdXJyZW50ICYmICFpc1R5cGVhYmxlRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKCFtYXRjaGVzRm9jdXNWaXNpYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW92ZWRGcm9tT3RoZXJFbmFibGVkVHJpZ2dlciA9IGlzVGFyZ2V0SW5zaWRlRW5hYmxlZFRyaWdnZXIoZXZlbnQucmVsYXRlZFRhcmdldCwgc3RvcmUuY29udGV4dC50cmlnZ2VyRWxlbWVudHMpO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgbmF0aXZlRXZlbnQsXG4gICAgICAgICAgY3VycmVudFRhcmdldFxuICAgICAgICB9ID0gZXZlbnQ7XG4gICAgICAgIGNvbnN0IGRlbGF5VmFsdWUgPSB0eXBlb2YgZGVsYXkgPT09ICdmdW5jdGlvbicgPyBkZWxheSgpIDogZGVsYXk7XG4gICAgICAgIGlmIChzdG9yZS5zZWxlY3QoJ29wZW4nKSAmJiBtb3ZlZEZyb21PdGhlckVuYWJsZWRUcmlnZ2VyIHx8IGRlbGF5VmFsdWUgPT09IDAgfHwgZGVsYXlWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VyRm9jdXMsIG5hdGl2ZUV2ZW50LCBjdXJyZW50VGFyZ2V0KSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRpbWVvdXQuc3RhcnQoZGVsYXlWYWx1ZSwgKCkgPT4ge1xuICAgICAgICAgIGlmIChibG9ja0ZvY3VzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VyRm9jdXMsIG5hdGl2ZUV2ZW50LCBjdXJyZW50VGFyZ2V0KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9uQmx1cihldmVudCkge1xuICAgICAgICByZXNldEJsb2NrZWRGb2N1cygpO1xuICAgICAgICBjb25zdCByZWxhdGVkVGFyZ2V0ID0gZXZlbnQucmVsYXRlZFRhcmdldDtcbiAgICAgICAgY29uc3QgbmF0aXZlRXZlbnQgPSBldmVudC5uYXRpdmVFdmVudDtcblxuICAgICAgICAvLyBIaXQgdGhlIG5vbi1tb2RhbCBmb2N1cyBtYW5hZ2VtZW50IHBvcnRhbCBndWFyZC4gRm9jdXMgd2lsbCBiZVxuICAgICAgICAvLyBtb3ZlZCBpbnRvIHRoZSBmbG9hdGluZyBlbGVtZW50IGltbWVkaWF0ZWx5IGFmdGVyLlxuICAgICAgICBjb25zdCBtb3ZlZFRvRm9jdXNHdWFyZCA9IGlzRWxlbWVudChyZWxhdGVkVGFyZ2V0KSAmJiByZWxhdGVkVGFyZ2V0Lmhhc0F0dHJpYnV0ZShjcmVhdGVBdHRyaWJ1dGUoJ2ZvY3VzLWd1YXJkJykpICYmIHJlbGF0ZWRUYXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnKSA9PT0gJ291dHNpZGUnO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSB3aW5kb3cgYmx1ciBsaXN0ZW5lciB0byBmaXJlLlxuICAgICAgICB0aW1lb3V0LnN0YXJ0KDAsICgpID0+IHtcbiAgICAgICAgICBjb25zdCBkb21SZWZlcmVuY2UgPSBzdG9yZS5zZWxlY3QoJ2RvbVJlZmVyZW5jZUVsZW1lbnQnKTtcbiAgICAgICAgICBjb25zdCBhY3RpdmVFbCA9IGFjdGl2ZUVsZW1lbnQob3duZXJEb2N1bWVudChkb21SZWZlcmVuY2UpKTtcblxuICAgICAgICAgIC8vIEZvY3VzIGxlZnQgdGhlIHBhZ2UsIGtlZXAgaXQgb3Blbi5cbiAgICAgICAgICBpZiAoIXJlbGF0ZWRUYXJnZXQgJiYgYWN0aXZlRWwgPT09IGRvbVJlZmVyZW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFdoZW4gZm9jdXNpbmcgdGhlIHJlZmVyZW5jZSBlbGVtZW50IChlLmcuIHJlZ3VsYXIgY2xpY2spLCB0aGVuXG4gICAgICAgICAgLy8gY2xpY2tpbmcgaW50byB0aGUgZmxvYXRpbmcgZWxlbWVudCwgcHJldmVudCBpdCBmcm9tIGhpZGluZy5cbiAgICAgICAgICAvLyBOb3RlOiBpdCBtdXN0IGJlIGZvY3VzYWJsZSwgZS5nLiBgdGFiaW5kZXg9XCItMVwiYC5cbiAgICAgICAgICAvLyBXZSBjYW4gbm90IHJlbHkgb24gcmVsYXRlZFRhcmdldCB0byBwb2ludCB0byB0aGUgY29ycmVjdCBlbGVtZW50XG4gICAgICAgICAgLy8gYXMgaXQgd2lsbCBvbmx5IHBvaW50IHRvIHRoZSBzaGFkb3cgaG9zdCBvZiB0aGUgbmV3bHkgZm9jdXNlZCBlbGVtZW50XG4gICAgICAgICAgLy8gYW5kIG5vdCB0aGUgZWxlbWVudCB0aGF0IGFjdHVhbGx5IGhhcyByZWNlaXZlZCBmb2N1cyBpZiBpdCBpcyBsb2NhdGVkXG4gICAgICAgICAgLy8gaW5zaWRlIGEgc2hhZG93IHJvb3QuXG4gICAgICAgICAgaWYgKGNvbnRhaW5zKGRhdGFSZWYuY3VycmVudC5mbG9hdGluZ0NvbnRleHQ/LnJlZnMuZmxvYXRpbmcuY3VycmVudCwgYWN0aXZlRWwpIHx8IGNvbnRhaW5zKGRvbVJlZmVyZW5jZSwgYWN0aXZlRWwpIHx8IG1vdmVkVG9Gb2N1c0d1YXJkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhlIG5leHQgZm9jdXNlZCBlbGVtZW50IGlzIG9uZSBvZiB0aGUgdHJpZ2dlcnMsIGRvIG5vdCBjbG9zZVxuICAgICAgICAgIC8vIHRoZSBmbG9hdGluZyBlbGVtZW50LiBUaGUgZm9jdXMgaGFuZGxlciBvZiB0aGF0IHRyaWdnZXIgd2lsbFxuICAgICAgICAgIC8vIGhhbmRsZSB0aGUgb3BlbiBzdGF0ZS5cbiAgICAgICAgICBjb25zdCBuZXh0Rm9jdXNlZEVsZW1lbnQgPSByZWxhdGVkVGFyZ2V0ID8/IGFjdGl2ZUVsO1xuICAgICAgICAgIGlmIChpc1RhcmdldEluc2lkZUVuYWJsZWRUcmlnZ2VyKG5leHRGb2N1c2VkRWxlbWVudCwgc3RvcmUuY29udGV4dC50cmlnZ2VyRWxlbWVudHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnRyaWdnZXJGb2N1cywgbmF0aXZlRXZlbnQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2RhdGFSZWYsIGRlbGF5LCBzdG9yZSwgdGltZW91dF0pO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiBlbmFibGVkID8ge1xuICAgIHJlZmVyZW5jZSxcbiAgICB0cmlnZ2VyOiByZWZlcmVuY2VcbiAgfSA6IHt9LCBbZW5hYmxlZCwgcmVmZXJlbmNlXSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyB1c2VPbk1vdW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlT25Nb3VudCc7XG5pbXBvcnQgeyB1c2VSZWZXaXRoSW5pdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVJlZldpdGhJbml0JztcbmltcG9ydCB7IFRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IGlzSW50ZXJhY3RpdmVFbGVtZW50IH0gZnJvbSBcIi4uL3V0aWxzLmpzXCI7XG5leHBvcnQgeyBpc0ludGVyYWN0aXZlRWxlbWVudCB9O1xuZXhwb3J0IGNsYXNzIEhvdmVySW50ZXJhY3Rpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBvaW50ZXJUeXBlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaW50ZXJhY3RlZEluc2lkZSA9IGZhbHNlO1xuICAgIHRoaXMuaGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJsb2NrTW91c2VNb3ZlID0gdHJ1ZTtcbiAgICB0aGlzLnBlcmZvcm1lZFBvaW50ZXJFdmVudHNNdXRhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMucG9pbnRlckV2ZW50c1Njb3BlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wb2ludGVyRXZlbnRzUmVmZXJlbmNlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wb2ludGVyRXZlbnRzRmxvYXRpbmdFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLnJlc3RUaW1lb3V0UGVuZGluZyA9IGZhbHNlO1xuICAgIHRoaXMub3BlbkNoYW5nZVRpbWVvdXQgPSBuZXcgVGltZW91dCgpO1xuICAgIHRoaXMucmVzdFRpbWVvdXQgPSBuZXcgVGltZW91dCgpO1xuICAgIHRoaXMuaGFuZGxlQ2xvc2VPcHRpb25zID0gdW5kZWZpbmVkO1xuICB9XG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBIb3ZlckludGVyYWN0aW9uKCk7XG4gIH1cbiAgZGlzcG9zZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5DaGFuZ2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgdGhpcy5yZXN0VGltZW91dC5jbGVhcigpO1xuICB9O1xuICBkaXNwb3NlRWZmZWN0ID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLmRpc3Bvc2U7XG4gIH07XG59XG5jb25zdCBwb2ludGVyRXZlbnRzTXV0YXRpb25Pd25lckJ5U2NvcGVFbGVtZW50ID0gbmV3IFdlYWtNYXAoKTtcbmV4cG9ydCBmdW5jdGlvbiBjbGVhclNhZmVQb2x5Z29uUG9pbnRlckV2ZW50c011dGF0aW9uKGluc3RhbmNlKSB7XG4gIGlmICghaW5zdGFuY2UucGVyZm9ybWVkUG9pbnRlckV2ZW50c011dGF0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHNjb3BlRWxlbWVudCA9IGluc3RhbmNlLnBvaW50ZXJFdmVudHNTY29wZUVsZW1lbnQ7XG4gIGlmIChzY29wZUVsZW1lbnQgJiYgcG9pbnRlckV2ZW50c011dGF0aW9uT3duZXJCeVNjb3BlRWxlbWVudC5nZXQoc2NvcGVFbGVtZW50KSA9PT0gaW5zdGFuY2UpIHtcbiAgICBpbnN0YW5jZS5wb2ludGVyRXZlbnRzU2NvcGVFbGVtZW50Py5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgncG9pbnRlci1ldmVudHMnKTtcbiAgICBpbnN0YW5jZS5wb2ludGVyRXZlbnRzUmVmZXJlbmNlRWxlbWVudD8uc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3BvaW50ZXItZXZlbnRzJyk7XG4gICAgaW5zdGFuY2UucG9pbnRlckV2ZW50c0Zsb2F0aW5nRWxlbWVudD8uc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3BvaW50ZXItZXZlbnRzJyk7XG4gICAgcG9pbnRlckV2ZW50c011dGF0aW9uT3duZXJCeVNjb3BlRWxlbWVudC5kZWxldGUoc2NvcGVFbGVtZW50KTtcbiAgfVxuICBpbnN0YW5jZS5wZXJmb3JtZWRQb2ludGVyRXZlbnRzTXV0YXRpb24gPSBmYWxzZTtcbiAgaW5zdGFuY2UucG9pbnRlckV2ZW50c1Njb3BlRWxlbWVudCA9IG51bGw7XG4gIGluc3RhbmNlLnBvaW50ZXJFdmVudHNSZWZlcmVuY2VFbGVtZW50ID0gbnVsbDtcbiAgaW5zdGFuY2UucG9pbnRlckV2ZW50c0Zsb2F0aW5nRWxlbWVudCA9IG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTYWZlUG9seWdvblBvaW50ZXJFdmVudHNNdXRhdGlvbihpbnN0YW5jZSwgb3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgc2NvcGVFbGVtZW50LFxuICAgIHJlZmVyZW5jZUVsZW1lbnQsXG4gICAgZmxvYXRpbmdFbGVtZW50XG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBleGlzdGluZ093bmVyID0gcG9pbnRlckV2ZW50c011dGF0aW9uT3duZXJCeVNjb3BlRWxlbWVudC5nZXQoc2NvcGVFbGVtZW50KTtcbiAgaWYgKGV4aXN0aW5nT3duZXIgJiYgZXhpc3RpbmdPd25lciAhPT0gaW5zdGFuY2UpIHtcbiAgICBjbGVhclNhZmVQb2x5Z29uUG9pbnRlckV2ZW50c011dGF0aW9uKGV4aXN0aW5nT3duZXIpO1xuICB9XG4gIGNsZWFyU2FmZVBvbHlnb25Qb2ludGVyRXZlbnRzTXV0YXRpb24oaW5zdGFuY2UpO1xuICBpbnN0YW5jZS5wZXJmb3JtZWRQb2ludGVyRXZlbnRzTXV0YXRpb24gPSB0cnVlO1xuICBpbnN0YW5jZS5wb2ludGVyRXZlbnRzU2NvcGVFbGVtZW50ID0gc2NvcGVFbGVtZW50O1xuICBpbnN0YW5jZS5wb2ludGVyRXZlbnRzUmVmZXJlbmNlRWxlbWVudCA9IHJlZmVyZW5jZUVsZW1lbnQ7XG4gIGluc3RhbmNlLnBvaW50ZXJFdmVudHNGbG9hdGluZ0VsZW1lbnQgPSBmbG9hdGluZ0VsZW1lbnQ7XG4gIHBvaW50ZXJFdmVudHNNdXRhdGlvbk93bmVyQnlTY29wZUVsZW1lbnQuc2V0KHNjb3BlRWxlbWVudCwgaW5zdGFuY2UpO1xuICBzY29wZUVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgcmVmZXJlbmNlRWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICBmbG9hdGluZ0VsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbn1cbmV4cG9ydCBmdW5jdGlvbiB1c2VIb3ZlckludGVyYWN0aW9uU2hhcmVkU3RhdGUoc3RvcmUpIHtcbiAgY29uc3QgZGF0YSA9IHN0b3JlLmNvbnRleHQuZGF0YVJlZi5jdXJyZW50O1xuICBjb25zdCBpbnN0YW5jZSA9IHVzZVJlZldpdGhJbml0KCgpID0+IGRhdGEuaG92ZXJJbnRlcmFjdGlvblN0YXRlID8/IEhvdmVySW50ZXJhY3Rpb24uY3JlYXRlKCkpLmN1cnJlbnQ7XG4gIGlmICghZGF0YS5ob3ZlckludGVyYWN0aW9uU3RhdGUpIHtcbiAgICBkYXRhLmhvdmVySW50ZXJhY3Rpb25TdGF0ZSA9IGluc3RhbmNlO1xuICB9XG4gIHVzZU9uTW91bnQoZGF0YS5ob3ZlckludGVyYWN0aW9uU3RhdGUuZGlzcG9zZUVmZmVjdCk7XG4gIHJldHVybiBkYXRhLmhvdmVySW50ZXJhY3Rpb25TdGF0ZTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGFkZEV2ZW50TGlzdGVuZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy9hZGRFdmVudExpc3RlbmVyJztcbmltcG9ydCB7IG1lcmdlQ2xlYW51cHMgfSBmcm9tICdAYmFzZS11aS91dGlscy9tZXJnZUNsZWFudXBzJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyBpc0VsZW1lbnQgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCwgdXNlRmxvYXRpbmdUcmVlIH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvRmxvYXRpbmdUcmVlLmpzXCI7XG5pbXBvcnQgeyBjb250YWlucywgZ2V0VGFyZ2V0IH0gZnJvbSBcIi4uL3V0aWxzL2VsZW1lbnQuanNcIjtcbmltcG9ydCB7IGdldE5vZGVDaGlsZHJlbiB9IGZyb20gXCIuLi91dGlscy9ub2Rlcy5qc1wiO1xuaW1wb3J0IHsgYXBwbHlTYWZlUG9seWdvblBvaW50ZXJFdmVudHNNdXRhdGlvbiwgY2xlYXJTYWZlUG9seWdvblBvaW50ZXJFdmVudHNNdXRhdGlvbiwgaXNJbnRlcmFjdGl2ZUVsZW1lbnQsIHVzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZSB9IGZyb20gXCIuL3VzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZS5qc1wiO1xuaW1wb3J0IHsgZ2V0RGVsYXksIGlzQ2xpY2tMaWtlT3BlbkV2ZW50IGFzIGlzQ2xpY2tMaWtlT3BlbkV2ZW50U2hhcmVkLCBpc0hvdmVyT3BlbkV2ZW50LCBpc0luc2lkZUVuYWJsZWRUcmlnZ2VyIH0gZnJvbSBcIi4vdXNlSG92ZXJTaGFyZWQuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgaG92ZXIgaW50ZXJhY3Rpb25zIHRoYXQgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIHRoZSBmbG9hdGluZyBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlSG92ZXJGbG9hdGluZ0ludGVyYWN0aW9uKGNvbnRleHQsIHBhcmFtZXRlcnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgZW5hYmxlZCA9IHRydWUsXG4gICAgY2xvc2VEZWxheTogY2xvc2VEZWxheVByb3AgPSAwLFxuICAgIG5vZGVJZDogbm9kZUlkUHJvcFxuICB9ID0gcGFyYW1ldGVycztcbiAgY29uc3Qgc3RvcmUgPSAncm9vdFN0b3JlJyBpbiBjb250ZXh0ID8gY29udGV4dC5yb290U3RvcmUgOiBjb250ZXh0O1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgZmxvYXRpbmdFbGVtZW50ID0gc3RvcmUudXNlU3RhdGUoJ2Zsb2F0aW5nRWxlbWVudCcpO1xuICBjb25zdCBkb21SZWZlcmVuY2VFbGVtZW50ID0gc3RvcmUudXNlU3RhdGUoJ2RvbVJlZmVyZW5jZUVsZW1lbnQnKTtcbiAgY29uc3Qge1xuICAgIGRhdGFSZWZcbiAgfSA9IHN0b3JlLmNvbnRleHQ7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoKTtcbiAgY29uc3QgcGFyZW50SWQgPSB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCgpO1xuICBjb25zdCBpbnN0YW5jZSA9IHVzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZShzdG9yZSk7XG4gIGNvbnN0IGNoaWxkQ2xvc2VkVGltZW91dCA9IHVzZVRpbWVvdXQoKTtcbiAgY29uc3QgaXNDbGlja0xpa2VPcGVuRXZlbnQgPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgcmV0dXJuIGlzQ2xpY2tMaWtlT3BlbkV2ZW50U2hhcmVkKGRhdGFSZWYuY3VycmVudC5vcGVuRXZlbnQ/LnR5cGUsIGluc3RhbmNlLmludGVyYWN0ZWRJbnNpZGUpO1xuICB9KTtcbiAgY29uc3QgaXNIb3Zlck9wZW4gPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgcmV0dXJuIGlzSG92ZXJPcGVuRXZlbnQoZGF0YVJlZi5jdXJyZW50Lm9wZW5FdmVudD8udHlwZSk7XG4gIH0pO1xuICBjb25zdCBjbGVhclBvaW50ZXJFdmVudHMgPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgY2xlYXJTYWZlUG9seWdvblBvaW50ZXJFdmVudHNNdXRhdGlvbihpbnN0YW5jZSk7XG4gIH0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghb3Blbikge1xuICAgICAgaW5zdGFuY2UucG9pbnRlclR5cGUgPSB1bmRlZmluZWQ7XG4gICAgICBpbnN0YW5jZS5yZXN0VGltZW91dFBlbmRpbmcgPSBmYWxzZTtcbiAgICAgIGluc3RhbmNlLmludGVyYWN0ZWRJbnNpZGUgPSBmYWxzZTtcbiAgICAgIGNsZWFyUG9pbnRlckV2ZW50cygpO1xuICAgIH1cbiAgfSwgW29wZW4sIGluc3RhbmNlLCBjbGVhclBvaW50ZXJFdmVudHNdKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICByZXR1cm4gY2xlYXJQb2ludGVyRXZlbnRzO1xuICB9LCBbY2xlYXJQb2ludGVyRXZlbnRzXSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAob3BlbiAmJiBpbnN0YW5jZS5oYW5kbGVDbG9zZU9wdGlvbnM/LmJsb2NrUG9pbnRlckV2ZW50cyAmJiBpc0hvdmVyT3BlbigpICYmIGlzRWxlbWVudChkb21SZWZlcmVuY2VFbGVtZW50KSAmJiBmbG9hdGluZ0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHJlZiA9IGRvbVJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgICBjb25zdCBmbG9hdGluZ0VsID0gZmxvYXRpbmdFbGVtZW50O1xuICAgICAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChmbG9hdGluZ0VsZW1lbnQpO1xuICAgICAgY29uc3QgcGFyZW50RmxvYXRpbmcgPSB0cmVlPy5ub2Rlc1JlZi5jdXJyZW50LmZpbmQobm9kZSA9PiBub2RlLmlkID09PSBwYXJlbnRJZCk/LmNvbnRleHQ/LmVsZW1lbnRzLmZsb2F0aW5nO1xuICAgICAgaWYgKHBhcmVudEZsb2F0aW5nKSB7XG4gICAgICAgIHBhcmVudEZsb2F0aW5nLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnJztcbiAgICAgIH1cblxuICAgICAgLy8gQSBrZWVwLW1vdW50ZWQgc3VibWVudSBjYW4gYXBwZWFyIGluIHRoZSB0cmVlIGJlZm9yZSBpdCBvcGVucywgc28gYVxuICAgICAgLy8gY2FjaGVkIHNjb3BlIG9yIHBhcmVudCBsb29rdXAgbWF5IHJlc29sdmUgdG8gdGhlIHN1Ym1lbnUgaXRzZWxmLiBUaGF0XG4gICAgICAvLyB3b3VsZCBub3Qgc2hpZWxkIHNpYmxpbmcgaXRlbXMgaW4gdGhlIHBhcmVudCBtZW51LlxuICAgICAgY29uc3QgY2FjaGVkU2NvcGVFbGVtZW50ID0gaW5zdGFuY2UucG9pbnRlckV2ZW50c1Njb3BlRWxlbWVudCAhPT0gZmxvYXRpbmdFbCA/IGluc3RhbmNlLnBvaW50ZXJFdmVudHNTY29wZUVsZW1lbnQgOiBudWxsO1xuICAgICAgY29uc3QgcGFyZW50U2NvcGVFbGVtZW50ID0gcGFyZW50RmxvYXRpbmcgIT09IGZsb2F0aW5nRWwgPyBwYXJlbnRGbG9hdGluZyA6IG51bGw7XG4gICAgICBjb25zdCBzY29wZUVsZW1lbnQgPSBpbnN0YW5jZS5oYW5kbGVDbG9zZU9wdGlvbnM/LmdldFNjb3BlPy4oKSA/PyBjYWNoZWRTY29wZUVsZW1lbnQgPz8gcGFyZW50U2NvcGVFbGVtZW50ID8/IHJlZi5jbG9zZXN0KCdbZGF0YS1yb290b3duZXJpZF0nKSA/PyBkb2MuYm9keTtcbiAgICAgIGFwcGx5U2FmZVBvbHlnb25Qb2ludGVyRXZlbnRzTXV0YXRpb24oaW5zdGFuY2UsIHtcbiAgICAgICAgc2NvcGVFbGVtZW50LFxuICAgICAgICByZWZlcmVuY2VFbGVtZW50OiByZWYsXG4gICAgICAgIGZsb2F0aW5nRWxlbWVudDogZmxvYXRpbmdFbFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjbGVhclBvaW50ZXJFdmVudHMoKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0sIFtlbmFibGVkLCBvcGVuLCBkb21SZWZlcmVuY2VFbGVtZW50LCBmbG9hdGluZ0VsZW1lbnQsIGluc3RhbmNlLCBpc0hvdmVyT3BlbiwgdHJlZSwgcGFyZW50SWQsIGNsZWFyUG9pbnRlckV2ZW50c10pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFzUGFyZW50Q2hpbGRyZW4oKSB7XG4gICAgICByZXR1cm4gISEodHJlZSAmJiBwYXJlbnRJZCAmJiBnZXROb2RlQ2hpbGRyZW4odHJlZS5ub2Rlc1JlZi5jdXJyZW50LCBwYXJlbnRJZCkubGVuZ3RoID4gMCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsb3NlV2l0aERlbGF5KGV2ZW50KSB7XG4gICAgICBjb25zdCBjbG9zZURlbGF5ID0gZ2V0RGVsYXkoY2xvc2VEZWxheVByb3AsICdjbG9zZScsIGluc3RhbmNlLnBvaW50ZXJUeXBlKTtcbiAgICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VySG92ZXIsIGV2ZW50KSk7XG4gICAgICAgIHRyZWU/LmV2ZW50cy5lbWl0KCdmbG9hdGluZy5jbG9zZWQnLCBldmVudCk7XG4gICAgICB9O1xuICAgICAgaWYgKGNsb3NlRGVsYXkpIHtcbiAgICAgICAgaW5zdGFuY2Uub3BlbkNoYW5nZVRpbWVvdXQuc3RhcnQoY2xvc2VEZWxheSwgY2xvc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2Uub3BlbkNoYW5nZVRpbWVvdXQuY2xlYXIoKTtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlSW50ZXJhY3RJbnNpZGUoZXZlbnQpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBpZiAoIWlzSW50ZXJhY3RpdmVFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgaW5zdGFuY2UuaW50ZXJhY3RlZEluc2lkZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbnN0YW5jZS5pbnRlcmFjdGVkSW5zaWRlID0gdGFyZ2V0Py5jbG9zZXN0KCdbYXJpYS1oYXNwb3B1cF0nKSAhPSBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbkZsb2F0aW5nTW91c2VFbnRlcigpIHtcbiAgICAgIGluc3RhbmNlLm9wZW5DaGFuZ2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgICBjaGlsZENsb3NlZFRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIHRyZWU/LmV2ZW50cy5vZmYoJ2Zsb2F0aW5nLmNsb3NlZCcsIG9uTm9kZUNsb3NlZCk7XG4gICAgICBjbGVhclBvaW50ZXJFdmVudHMoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25GbG9hdGluZ01vdXNlTGVhdmUoZXZlbnQpIHtcbiAgICAgIGlmIChoYXNQYXJlbnRDaGlsZHJlbigpICYmIHRyZWUpIHtcbiAgICAgICAgdHJlZS5ldmVudHMub24oJ2Zsb2F0aW5nLmNsb3NlZCcsIG9uTm9kZUNsb3NlZCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChpc0luc2lkZUVuYWJsZWRUcmlnZ2VyKGV2ZW50LnJlbGF0ZWRUYXJnZXQsIHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzKSkge1xuICAgICAgICAvLyBJZiB0aGUgbW91c2UgaXMgbGVhdmluZyB0aGUgcmVmZXJlbmNlIGVsZW1lbnQgdG8gYW5vdGhlciB0cmlnZ2VyLCBkb24ndCBleHBsaWNpdGx5IGNsb3NlIHRoZSBwb3B1cFxuICAgICAgICAvLyBhcyBpdCB3aWxsIGJlIG1vdmVkLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50Tm9kZUlkID0gZGF0YVJlZi5jdXJyZW50LmZsb2F0aW5nQ29udGV4dD8ubm9kZUlkID8/IG5vZGVJZFByb3A7XG4gICAgICBjb25zdCByZWxhdGVkVGFyZ2V0ID0gZXZlbnQucmVsYXRlZFRhcmdldDtcbiAgICAgIGNvbnN0IGlzTW92aW5nSW50b0Rlc2NlbmRhbnRGbG9hdGluZyA9IHRyZWUgJiYgY3VycmVudE5vZGVJZCAmJiBpc0VsZW1lbnQocmVsYXRlZFRhcmdldCkgJiYgZ2V0Tm9kZUNoaWxkcmVuKHRyZWUubm9kZXNSZWYuY3VycmVudCwgY3VycmVudE5vZGVJZCwgZmFsc2UpLnNvbWUobm9kZSA9PiBjb250YWlucyhub2RlLmNvbnRleHQ/LmVsZW1lbnRzLmZsb2F0aW5nLCByZWxhdGVkVGFyZ2V0KSk7XG4gICAgICBpZiAoaXNNb3ZpbmdJbnRvRGVzY2VuZGFudEZsb2F0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHNhZmVQb2x5Z29uIGhhbmRsZXIgaXMgYWN0aXZlLCBsZXQgaXQgaGFuZGxlIHRoZSBjbG9zZSBsb2dpYy5cbiAgICAgIGlmIChpbnN0YW5jZS5oYW5kbGVyKSB7XG4gICAgICAgIGluc3RhbmNlLmhhbmRsZXIoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjbGVhclBvaW50ZXJFdmVudHMoKTtcbiAgICAgIGlmICghaXNDbGlja0xpa2VPcGVuRXZlbnQoKSkge1xuICAgICAgICBjbG9zZVdpdGhEZWxheShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTm9kZUNsb3NlZChldmVudCkge1xuICAgICAgaWYgKCF0cmVlIHx8ICFwYXJlbnRJZCB8fCBoYXNQYXJlbnRDaGlsZHJlbigpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIEFsbG93IHRoZSBtb3VzZWVudGVyIGV2ZW50IHRvIGZpcmUgaW4gY2FzZSBjaGlsZCB3YXMgY2xvc2VkIGJlY2F1c2UgbW91c2UgbW92ZWQgaW50byBwYXJlbnQuXG4gICAgICBjaGlsZENsb3NlZFRpbWVvdXQuc3RhcnQoMCwgKCkgPT4ge1xuICAgICAgICB0cmVlLmV2ZW50cy5vZmYoJ2Zsb2F0aW5nLmNsb3NlZCcsIG9uTm9kZUNsb3NlZCk7XG4gICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnRyaWdnZXJIb3ZlciwgZXZlbnQpKTtcbiAgICAgICAgdHJlZS5ldmVudHMuZW1pdCgnZmxvYXRpbmcuY2xvc2VkJywgZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGZsb2F0aW5nID0gZmxvYXRpbmdFbGVtZW50O1xuICAgIHJldHVybiBtZXJnZUNsZWFudXBzKGZsb2F0aW5nICYmIGFkZEV2ZW50TGlzdGVuZXIoZmxvYXRpbmcsICdtb3VzZWVudGVyJywgb25GbG9hdGluZ01vdXNlRW50ZXIpLCBmbG9hdGluZyAmJiBhZGRFdmVudExpc3RlbmVyKGZsb2F0aW5nLCAnbW91c2VsZWF2ZScsIG9uRmxvYXRpbmdNb3VzZUxlYXZlKSwgZmxvYXRpbmcgJiYgYWRkRXZlbnRMaXN0ZW5lcihmbG9hdGluZywgJ3BvaW50ZXJkb3duJywgaGFuZGxlSW50ZXJhY3RJbnNpZGUsIHRydWUpLCAoKSA9PiB7XG4gICAgICB0cmVlPy5ldmVudHMub2ZmKCdmbG9hdGluZy5jbG9zZWQnLCBvbk5vZGVDbG9zZWQpO1xuICAgIH0pO1xuICB9LCBbZW5hYmxlZCwgZmxvYXRpbmdFbGVtZW50LCBzdG9yZSwgZGF0YVJlZiwgY2xvc2VEZWxheVByb3AsIG5vZGVJZFByb3AsIGlzQ2xpY2tMaWtlT3BlbkV2ZW50LCBjbGVhclBvaW50ZXJFdmVudHMsIGluc3RhbmNlLCB0cmVlLCBwYXJlbnRJZCwgY2hpbGRDbG9zZWRUaW1lb3V0XSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgKiBhcyBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHsgYWRkRXZlbnRMaXN0ZW5lciB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2FkZEV2ZW50TGlzdGVuZXInO1xuaW1wb3J0IHsgbWVyZ2VDbGVhbnVwcyB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL21lcmdlQ2xlYW51cHMnO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlVmFsdWVBc1JlZiB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVZhbHVlQXNSZWYnO1xuaW1wb3J0IHsgaXNFbGVtZW50IH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzL2RvbSc7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuaW1wb3J0IHsgdXNlRmxvYXRpbmdUcmVlIH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvRmxvYXRpbmdUcmVlLmpzXCI7XG5pbXBvcnQgeyBjb250YWlucywgZ2V0VGFyZ2V0IH0gZnJvbSBcIi4uL3V0aWxzL2VsZW1lbnQuanNcIjtcbmltcG9ydCB7IGlzTW91c2VMaWtlUG9pbnRlclR5cGUgfSBmcm9tIFwiLi4vdXRpbHMvZXZlbnQuanNcIjtcbmltcG9ydCB7IGFwcGx5U2FmZVBvbHlnb25Qb2ludGVyRXZlbnRzTXV0YXRpb24sIGNsZWFyU2FmZVBvbHlnb25Qb2ludGVyRXZlbnRzTXV0YXRpb24sIHVzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZSB9IGZyb20gXCIuL3VzZUhvdmVySW50ZXJhY3Rpb25TaGFyZWRTdGF0ZS5qc1wiO1xuaW1wb3J0IHsgZ2V0RGVsYXksIGdldFJlc3RNcywgaXNDbGlja0xpa2VPcGVuRXZlbnQgYXMgaXNDbGlja0xpa2VPcGVuRXZlbnRTaGFyZWQsIGlzSW5zaWRlRW5hYmxlZFRyaWdnZXIgfSBmcm9tIFwiLi91c2VIb3ZlclNoYXJlZC5qc1wiO1xuY29uc3QgRU1QVFlfUkVGID0ge1xuICBjdXJyZW50OiBudWxsXG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGhvdmVyIGludGVyYWN0aW9ucyB0aGF0IHNob3VsZCBiZSBhdHRhY2hlZCB0byByZWZlcmVuY2Ugb3IgdHJpZ2dlclxuICogZWxlbWVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VIb3ZlclJlZmVyZW5jZUludGVyYWN0aW9uKGNvbnRleHQsIHByb3BzID0ge30pIHtcbiAgY29uc3Qge1xuICAgIGVuYWJsZWQgPSB0cnVlLFxuICAgIGRlbGF5ID0gMCxcbiAgICBoYW5kbGVDbG9zZSA9IG51bGwsXG4gICAgbW91c2VPbmx5ID0gZmFsc2UsXG4gICAgcmVzdE1zID0gMCxcbiAgICBtb3ZlID0gdHJ1ZSxcbiAgICB0cmlnZ2VyRWxlbWVudFJlZiA9IEVNUFRZX1JFRixcbiAgICBleHRlcm5hbFRyZWUsXG4gICAgaXNBY3RpdmVUcmlnZ2VyID0gdHJ1ZSxcbiAgICBnZXRIYW5kbGVDbG9zZUNvbnRleHQsXG4gICAgaXNDbG9zaW5nLFxuICAgIHNob3VsZE9wZW46IHNob3VsZE9wZW5Qcm9wXG4gIH0gPSBwcm9wcztcbiAgY29uc3Qgc3RvcmUgPSAncm9vdFN0b3JlJyBpbiBjb250ZXh0ID8gY29udGV4dC5yb290U3RvcmUgOiBjb250ZXh0O1xuICBjb25zdCB7XG4gICAgZGF0YVJlZixcbiAgICBldmVudHNcbiAgfSA9IHN0b3JlLmNvbnRleHQ7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoZXh0ZXJuYWxUcmVlKTtcbiAgY29uc3QgaW5zdGFuY2UgPSB1c2VIb3ZlckludGVyYWN0aW9uU2hhcmVkU3RhdGUoc3RvcmUpO1xuICBjb25zdCBpc0hvdmVyQ2xvc2VBY3RpdmVSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBoYW5kbGVDbG9zZVJlZiA9IHVzZVZhbHVlQXNSZWYoaGFuZGxlQ2xvc2UpO1xuICBjb25zdCBkZWxheVJlZiA9IHVzZVZhbHVlQXNSZWYoZGVsYXkpO1xuICBjb25zdCByZXN0TXNSZWYgPSB1c2VWYWx1ZUFzUmVmKHJlc3RNcyk7XG4gIGNvbnN0IGVuYWJsZWRSZWYgPSB1c2VWYWx1ZUFzUmVmKGVuYWJsZWQpO1xuICBjb25zdCBzaG91bGRPcGVuUmVmID0gdXNlVmFsdWVBc1JlZihzaG91bGRPcGVuUHJvcCk7XG4gIGNvbnN0IGlzQ2xvc2luZ1JlZiA9IHVzZVZhbHVlQXNSZWYoaXNDbG9zaW5nKTtcbiAgY29uc3QgaXNDbGlja0xpa2VPcGVuRXZlbnQgPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgcmV0dXJuIGlzQ2xpY2tMaWtlT3BlbkV2ZW50U2hhcmVkKGRhdGFSZWYuY3VycmVudC5vcGVuRXZlbnQ/LnR5cGUsIGluc3RhbmNlLmludGVyYWN0ZWRJbnNpZGUpO1xuICB9KTtcbiAgY29uc3QgY2hlY2tTaG91bGRPcGVuID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHJldHVybiBzaG91bGRPcGVuUmVmLmN1cnJlbnQ/LigpICE9PSBmYWxzZTtcbiAgfSk7XG4gIGNvbnN0IGlzT3ZlckluYWN0aXZlVHJpZ2dlciA9IHVzZVN0YWJsZUNhbGxiYWNrKChjdXJyZW50RG9tUmVmZXJlbmNlLCBjdXJyZW50VGFyZ2V0LCB0YXJnZXQpID0+IHtcbiAgICBjb25zdCBhbGxUcmlnZ2VycyA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzO1xuXG4gICAgLy8gRmFzdCBwYXRoIGZvciBub3JtYWwgdXNhZ2Ugd2hlcmUgaGFuZGxlcnMgYXJlIGF0dGFjaGVkIGRpcmVjdGx5IHRvIHRyaWdnZXJzLlxuICAgIGlmIChhbGxUcmlnZ2Vycy5oYXNFbGVtZW50KGN1cnJlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm4gIWN1cnJlbnREb21SZWZlcmVuY2UgfHwgIWNvbnRhaW5zKGN1cnJlbnREb21SZWZlcmVuY2UsIGN1cnJlbnRUYXJnZXQpO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIGZvciBkZWxlZ2F0ZWQvd3JhcHBlciB1c2FnZSB3aGVyZSBjdXJyZW50VGFyZ2V0IG1heSBiZSBvdXRzaWRlIHRoZSB0cmlnZ2VyIG1hcC5cbiAgICBpZiAoIWlzRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHRhcmdldEVsZW1lbnQgPSB0YXJnZXQ7XG4gICAgcmV0dXJuIGFsbFRyaWdnZXJzLmhhc01hdGNoaW5nRWxlbWVudCh0cmlnZ2VyID0+IGNvbnRhaW5zKHRyaWdnZXIsIHRhcmdldEVsZW1lbnQpKSAmJiAoIWN1cnJlbnREb21SZWZlcmVuY2UgfHwgIWNvbnRhaW5zKGN1cnJlbnREb21SZWZlcmVuY2UsIHRhcmdldEVsZW1lbnQpKTtcbiAgfSk7XG4gIGNvbnN0IGNsZWFudXBNb3VzZU1vdmVIYW5kbGVyID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmICghaW5zdGFuY2UuaGFuZGxlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpKTtcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaW5zdGFuY2UuaGFuZGxlcik7XG4gICAgaW5zdGFuY2UuaGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgfSk7XG4gIGNvbnN0IGNsZWFyUG9pbnRlckV2ZW50cyA9IHVzZVN0YWJsZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjbGVhclNhZmVQb2x5Z29uUG9pbnRlckV2ZW50c011dGF0aW9uKGluc3RhbmNlKTtcbiAgfSk7XG4gIGlmIChpc0FjdGl2ZVRyaWdnZXIpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICBpbnN0YW5jZS5oYW5kbGVDbG9zZU9wdGlvbnMgPSBoYW5kbGVDbG9zZVJlZi5jdXJyZW50Py5fX29wdGlvbnM7XG4gIH1cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IGNsZWFudXBNb3VzZU1vdmVIYW5kbGVyLCBbY2xlYW51cE1vdXNlTW92ZUhhbmRsZXJdKTtcblxuICAvLyBXaGVuIGNsb3NpbmcgYmVmb3JlIG9wZW5pbmcsIGNsZWFyIHRoZSBkZWxheSB0aW1lb3V0cyB0byBjYW5jZWwgaXRcbiAgLy8gZnJvbSBzaG93aW5nLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25PcGVuQ2hhbmdlTG9jYWwoZGV0YWlscykge1xuICAgICAgaWYgKCFkZXRhaWxzLm9wZW4pIHtcbiAgICAgICAgaXNIb3ZlckNsb3NlQWN0aXZlUmVmLmN1cnJlbnQgPSBkZXRhaWxzLnJlYXNvbiA9PT0gUkVBU09OUy50cmlnZ2VySG92ZXI7XG4gICAgICAgIGNsZWFudXBNb3VzZU1vdmVIYW5kbGVyKCk7XG4gICAgICAgIGluc3RhbmNlLm9wZW5DaGFuZ2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIGluc3RhbmNlLnJlc3RUaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIGluc3RhbmNlLmJsb2NrTW91c2VNb3ZlID0gdHJ1ZTtcbiAgICAgICAgaW5zdGFuY2UucmVzdFRpbWVvdXRQZW5kaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc0hvdmVyQ2xvc2VBY3RpdmVSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBldmVudHMub24oJ29wZW5jaGFuZ2UnLCBvbk9wZW5DaGFuZ2VMb2NhbCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGV2ZW50cy5vZmYoJ29wZW5jaGFuZ2UnLCBvbk9wZW5DaGFuZ2VMb2NhbCk7XG4gICAgfTtcbiAgfSwgW2VuYWJsZWQsIGV2ZW50cywgaW5zdGFuY2UsIGNsZWFudXBNb3VzZU1vdmVIYW5kbGVyXSk7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbG9zZVdpdGhEZWxheShldmVudCwgcnVuRWxzZUJyYW5jaCA9IHRydWUpIHtcbiAgICAgIGNvbnN0IGNsb3NlRGVsYXkgPSBnZXREZWxheShkZWxheVJlZi5jdXJyZW50LCAnY2xvc2UnLCBpbnN0YW5jZS5wb2ludGVyVHlwZSk7XG4gICAgICBpZiAoY2xvc2VEZWxheSkge1xuICAgICAgICBpbnN0YW5jZS5vcGVuQ2hhbmdlVGltZW91dC5zdGFydChjbG9zZURlbGF5LCAoKSA9PiB7XG4gICAgICAgICAgc3RvcmUuc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMudHJpZ2dlckhvdmVyLCBldmVudCkpO1xuICAgICAgICAgIHRyZWU/LmV2ZW50cy5lbWl0KCdmbG9hdGluZy5jbG9zZWQnLCBldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChydW5FbHNlQnJhbmNoKSB7XG4gICAgICAgIGluc3RhbmNlLm9wZW5DaGFuZ2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnRyaWdnZXJIb3ZlciwgZXZlbnQpKTtcbiAgICAgICAgdHJlZT8uZXZlbnRzLmVtaXQoJ2Zsb2F0aW5nLmNsb3NlZCcsIGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgdHJpZ2dlciA9IHRyaWdnZXJFbGVtZW50UmVmLmN1cnJlbnQgPz8gKGlzQWN0aXZlVHJpZ2dlciA/IHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpIDogbnVsbCk7XG4gICAgaWYgKCFpc0VsZW1lbnQodHJpZ2dlcikpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VFbnRlcihldmVudCkge1xuICAgICAgaW5zdGFuY2Uub3BlbkNoYW5nZVRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIGluc3RhbmNlLmJsb2NrTW91c2VNb3ZlID0gZmFsc2U7XG4gICAgICBpZiAobW91c2VPbmx5ICYmICFpc01vdXNlTGlrZVBvaW50ZXJUeXBlKGluc3RhbmNlLnBvaW50ZXJUeXBlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE9ubHkgcmVzdCBkZWxheSBpcyBzZXQ7IHRoZXJlJ3Mgbm8gZmFsbGJhY2sgZGVsYXkuXG4gICAgICAvLyBUaGlzIHdpbGwgYmUgaGFuZGxlZCBieSBgb25Nb3VzZU1vdmVgLlxuICAgICAgY29uc3QgcmVzdE1zVmFsdWUgPSBnZXRSZXN0TXMocmVzdE1zUmVmLmN1cnJlbnQpO1xuICAgICAgY29uc3Qgb3BlbkRlbGF5ID0gZ2V0RGVsYXkoZGVsYXlSZWYuY3VycmVudCwgJ29wZW4nLCBpbnN0YW5jZS5wb2ludGVyVHlwZSk7XG4gICAgICBjb25zdCBldmVudFRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBjb25zdCBjdXJyZW50VGFyZ2V0ID0gZXZlbnQuY3VycmVudFRhcmdldCA/PyBudWxsO1xuICAgICAgY29uc3QgY3VycmVudERvbVJlZmVyZW5jZSA9IHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpO1xuICAgICAgbGV0IHRyaWdnZXJOb2RlID0gY3VycmVudFRhcmdldDtcblxuICAgICAgLy8gV3JhcHBlci9kZWxlZ2F0ZWQgbW9kZTogcmVzb2x2ZSB0aGUgYWN0dWFsIHRyaWdnZXIgZnJvbSB0aGUgZXZlbnQgdGFyZ2V0LlxuICAgICAgaWYgKGlzRWxlbWVudChldmVudFRhcmdldCkgJiYgIXN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLmhhc0VsZW1lbnQoZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgIGZvciAoY29uc3QgdHJpZ2dlckVsZW1lbnQgb2Ygc3RvcmUuY29udGV4dC50cmlnZ2VyRWxlbWVudHMuZWxlbWVudHMoKSkge1xuICAgICAgICAgIGlmIChjb250YWlucyh0cmlnZ2VyRWxlbWVudCwgZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICB0cmlnZ2VyTm9kZSA9IHRyaWdnZXJFbGVtZW50O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdyYXBwZXIvZGVsZWdhdGVkIG1vZGUgZmFsbGJhY2s6IGlmIHRoZSB3cmFwcGVyIGNvbnRhaW5zIHRoZSBhY3RpdmUgdHJpZ2dlcixcbiAgICAgIC8vIHRyZWF0IHRoaXMgYXMgcmUtZW50ZXJpbmcgdGhhdCBhY3RpdmUgdHJpZ2dlci5cbiAgICAgIGlmIChpc0VsZW1lbnQoY3VycmVudFRhcmdldCkgJiYgaXNFbGVtZW50KGN1cnJlbnREb21SZWZlcmVuY2UpICYmICFzdG9yZS5jb250ZXh0LnRyaWdnZXJFbGVtZW50cy5oYXNFbGVtZW50KGN1cnJlbnRUYXJnZXQpICYmIGNvbnRhaW5zKGN1cnJlbnRUYXJnZXQsIGN1cnJlbnREb21SZWZlcmVuY2UpKSB7XG4gICAgICAgIHRyaWdnZXJOb2RlID0gY3VycmVudERvbVJlZmVyZW5jZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlzT3ZlckluYWN0aXZlID0gdHJpZ2dlck5vZGUgPT0gbnVsbCA/IGZhbHNlIDogaXNPdmVySW5hY3RpdmVUcmlnZ2VyKGN1cnJlbnREb21SZWZlcmVuY2UsIHRyaWdnZXJOb2RlLCBldmVudFRhcmdldCk7XG4gICAgICBjb25zdCBpc09wZW4gPSBzdG9yZS5zZWxlY3QoJ29wZW4nKTtcbiAgICAgIGNvbnN0IGlzSW5DbG9zaW5nVHJhbnNpdGlvbiA9IGlzQ2xvc2luZ1JlZi5jdXJyZW50Py4oKSA/PyBzdG9yZS5zZWxlY3QoJ3RyYW5zaXRpb25TdGF0dXMnKSA9PT0gJ2VuZGluZyc7XG4gICAgICBjb25zdCBpc0hvdmVyQ2xvc2VUcmFuc2l0aW9uID0gIWlzT3BlbiAmJiBpc0luQ2xvc2luZ1RyYW5zaXRpb24gJiYgaXNIb3ZlckNsb3NlQWN0aXZlUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBpc1JlZW50ZXJpbmdTYW1lVHJpZ2dlckR1cmluZ0Nsb3NlVHJhbnNpdGlvbiA9ICFpc092ZXJJbmFjdGl2ZSAmJiBpc0VsZW1lbnQodHJpZ2dlck5vZGUpICYmIGlzRWxlbWVudChjdXJyZW50RG9tUmVmZXJlbmNlKSAmJiBjb250YWlucyhjdXJyZW50RG9tUmVmZXJlbmNlLCB0cmlnZ2VyTm9kZSkgJiYgaXNIb3ZlckNsb3NlVHJhbnNpdGlvbjtcbiAgICAgIGNvbnN0IGlzUmVzdE9ubHlEZWxheSA9IHJlc3RNc1ZhbHVlID4gMCAmJiAhb3BlbkRlbGF5O1xuICAgICAgY29uc3Qgc2hvdWxkT3BlbkltbWVkaWF0ZWx5ID0gaXNPdmVySW5hY3RpdmUgJiYgKGlzT3BlbiB8fCBpc0hvdmVyQ2xvc2VUcmFuc2l0aW9uKSB8fCBpc1JlZW50ZXJpbmdTYW1lVHJpZ2dlckR1cmluZ0Nsb3NlVHJhbnNpdGlvbjtcbiAgICAgIGNvbnN0IHNob3VsZE9wZW4gPSAhaXNPcGVuIHx8IGlzT3ZlckluYWN0aXZlO1xuXG4gICAgICAvLyBPcGVuIGltbWVkaWF0ZWx5IHdoZW4gbW92aW5nIGJldHdlZW4gdHJpZ2dlcnMgd2hpbGUgb3Blbiwgb3IgZHVyaW5nXG4gICAgICAvLyBhIGhvdmVyLWRyaXZlbiBjbG9zZSB0cmFuc2l0aW9uIChpbmNsdWRpbmcgc2FtZS10cmlnZ2VyIHJlLWVudHJ5KS5cbiAgICAgIGlmIChzaG91bGRPcGVuSW1tZWRpYXRlbHkpIHtcbiAgICAgICAgaWYgKGNoZWNrU2hvdWxkT3BlbigpKSB7XG4gICAgICAgICAgc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VySG92ZXIsIGV2ZW50LCB0cmlnZ2VyTm9kZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChpc1Jlc3RPbmx5RGVsYXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG9wZW5EZWxheSkge1xuICAgICAgICBpbnN0YW5jZS5vcGVuQ2hhbmdlVGltZW91dC5zdGFydChvcGVuRGVsYXksICgpID0+IHtcbiAgICAgICAgICBpZiAoc2hvdWxkT3BlbiAmJiBjaGVja1Nob3VsZE9wZW4oKSkge1xuICAgICAgICAgICAgc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VySG92ZXIsIGV2ZW50LCB0cmlnZ2VyTm9kZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHNob3VsZE9wZW4pIHtcbiAgICAgICAgaWYgKGNoZWNrU2hvdWxkT3BlbigpKSB7XG4gICAgICAgICAgc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VySG92ZXIsIGV2ZW50LCB0cmlnZ2VyTm9kZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VMZWF2ZShldmVudCkge1xuICAgICAgaWYgKGlzQ2xpY2tMaWtlT3BlbkV2ZW50KCkpIHtcbiAgICAgICAgY2xlYXJQb2ludGVyRXZlbnRzKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNsZWFudXBNb3VzZU1vdmVIYW5kbGVyKCk7XG4gICAgICBjb25zdCBkb21SZWZlcmVuY2VFbGVtZW50ID0gc3RvcmUuc2VsZWN0KCdkb21SZWZlcmVuY2VFbGVtZW50Jyk7XG4gICAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGRvbVJlZmVyZW5jZUVsZW1lbnQpO1xuICAgICAgaW5zdGFuY2UucmVzdFRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIGluc3RhbmNlLnJlc3RUaW1lb3V0UGVuZGluZyA9IGZhbHNlO1xuICAgICAgY29uc3QgaGFuZGxlQ2xvc2VDb250ZXh0QmFzZSA9IGRhdGFSZWYuY3VycmVudC5mbG9hdGluZ0NvbnRleHQgPz8gZ2V0SGFuZGxlQ2xvc2VDb250ZXh0Py4oKTtcbiAgICAgIGlmIChpc0luc2lkZUVuYWJsZWRUcmlnZ2VyKGV2ZW50LnJlbGF0ZWRUYXJnZXQsIHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaGFuZGxlQ2xvc2VSZWYuY3VycmVudCAmJiBoYW5kbGVDbG9zZUNvbnRleHRCYXNlKSB7XG4gICAgICAgIGlmICghc3RvcmUuc2VsZWN0KCdvcGVuJykpIHtcbiAgICAgICAgICBpbnN0YW5jZS5vcGVuQ2hhbmdlVGltZW91dC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUcmlnZ2VyID0gdHJpZ2dlckVsZW1lbnRSZWYuY3VycmVudDtcbiAgICAgICAgaW5zdGFuY2UuaGFuZGxlciA9IGhhbmRsZUNsb3NlUmVmLmN1cnJlbnQoe1xuICAgICAgICAgIC4uLmhhbmRsZUNsb3NlQ29udGV4dEJhc2UsXG4gICAgICAgICAgdHJlZSxcbiAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFksXG4gICAgICAgICAgb25DbG9zZSgpIHtcbiAgICAgICAgICAgIGNsZWFyUG9pbnRlckV2ZW50cygpO1xuICAgICAgICAgICAgY2xlYW51cE1vdXNlTW92ZUhhbmRsZXIoKTtcbiAgICAgICAgICAgIGlmIChlbmFibGVkUmVmLmN1cnJlbnQgJiYgIWlzQ2xpY2tMaWtlT3BlbkV2ZW50KCkgJiYgY3VycmVudFRyaWdnZXIgPT09IHN0b3JlLnNlbGVjdCgnZG9tUmVmZXJlbmNlRWxlbWVudCcpKSB7XG4gICAgICAgICAgICAgIGNsb3NlV2l0aERlbGF5KGV2ZW50LCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaW5zdGFuY2UuaGFuZGxlcik7XG4gICAgICAgIGluc3RhbmNlLmhhbmRsZXIoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBzaG91bGRDbG9zZSA9IGluc3RhbmNlLnBvaW50ZXJUeXBlID09PSAndG91Y2gnID8gIWNvbnRhaW5zKHN0b3JlLnNlbGVjdCgnZmxvYXRpbmdFbGVtZW50JyksIGV2ZW50LnJlbGF0ZWRUYXJnZXQpIDogdHJ1ZTtcbiAgICAgIGlmIChzaG91bGRDbG9zZSkge1xuICAgICAgICBjbG9zZVdpdGhEZWxheShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChtb3ZlKSB7XG4gICAgICByZXR1cm4gbWVyZ2VDbGVhbnVwcyhhZGRFdmVudExpc3RlbmVyKHRyaWdnZXIsICdtb3VzZW1vdmUnLCBvbk1vdXNlRW50ZXIsIHtcbiAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgfSksIGFkZEV2ZW50TGlzdGVuZXIodHJpZ2dlciwgJ21vdXNlZW50ZXInLCBvbk1vdXNlRW50ZXIpLCBhZGRFdmVudExpc3RlbmVyKHRyaWdnZXIsICdtb3VzZWxlYXZlJywgb25Nb3VzZUxlYXZlKSk7XG4gICAgfVxuICAgIHJldHVybiBtZXJnZUNsZWFudXBzKGFkZEV2ZW50TGlzdGVuZXIodHJpZ2dlciwgJ21vdXNlZW50ZXInLCBvbk1vdXNlRW50ZXIpLCBhZGRFdmVudExpc3RlbmVyKHRyaWdnZXIsICdtb3VzZWxlYXZlJywgb25Nb3VzZUxlYXZlKSk7XG4gIH0sIFtjbGVhbnVwTW91c2VNb3ZlSGFuZGxlciwgY2xlYXJQb2ludGVyRXZlbnRzLCBkYXRhUmVmLCBkZWxheVJlZiwgc3RvcmUsIGVuYWJsZWQsIGhhbmRsZUNsb3NlUmVmLCBpbnN0YW5jZSwgaXNBY3RpdmVUcmlnZ2VyLCBpc092ZXJJbmFjdGl2ZVRyaWdnZXIsIGlzQ2xpY2tMaWtlT3BlbkV2ZW50LCBtb3VzZU9ubHksIG1vdmUsIHJlc3RNc1JlZiwgdHJpZ2dlckVsZW1lbnRSZWYsIHRyZWUsIGVuYWJsZWRSZWYsIGdldEhhbmRsZUNsb3NlQ29udGV4dCwgaXNDbG9zaW5nUmVmLCBjaGVja1Nob3VsZE9wZW5dKTtcbiAgcmV0dXJuIFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0UG9pbnRlclJlZihldmVudCkge1xuICAgICAgaW5zdGFuY2UucG9pbnRlclR5cGUgPSBldmVudC5wb2ludGVyVHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIG9uUG9pbnRlckRvd246IHNldFBvaW50ZXJSZWYsXG4gICAgICBvblBvaW50ZXJFbnRlcjogc2V0UG9pbnRlclJlZixcbiAgICAgIG9uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBuYXRpdmVFdmVudFxuICAgICAgICB9ID0gZXZlbnQ7XG4gICAgICAgIGNvbnN0IHRyaWdnZXIgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICBjb25zdCBjdXJyZW50RG9tUmVmZXJlbmNlID0gc3RvcmUuc2VsZWN0KCdkb21SZWZlcmVuY2VFbGVtZW50Jyk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRPcGVuID0gc3RvcmUuc2VsZWN0KCdvcGVuJyk7XG4gICAgICAgIGNvbnN0IGlzT3ZlckluYWN0aXZlID0gaXNPdmVySW5hY3RpdmVUcmlnZ2VyKGN1cnJlbnREb21SZWZlcmVuY2UsIHRyaWdnZXIsIGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGlmIChtb3VzZU9ubHkgJiYgIWlzTW91c2VMaWtlUG9pbnRlclR5cGUoaW5zdGFuY2UucG9pbnRlclR5cGUpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyZW50T3BlbiAmJiBpc092ZXJJbmFjdGl2ZSAmJiBpbnN0YW5jZS5oYW5kbGVDbG9zZU9wdGlvbnM/LmJsb2NrUG9pbnRlckV2ZW50cykge1xuICAgICAgICAgIGNvbnN0IGZsb2F0aW5nRWxlbWVudCA9IHN0b3JlLnNlbGVjdCgnZmxvYXRpbmdFbGVtZW50Jyk7XG4gICAgICAgICAgaWYgKGZsb2F0aW5nRWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3Qgc2NvcGVFbGVtZW50ID0gaW5zdGFuY2UuaGFuZGxlQ2xvc2VPcHRpb25zPy5nZXRTY29wZT8uKCkgPz8gdHJpZ2dlci5vd25lckRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICBhcHBseVNhZmVQb2x5Z29uUG9pbnRlckV2ZW50c011dGF0aW9uKGluc3RhbmNlLCB7XG4gICAgICAgICAgICAgIHNjb3BlRWxlbWVudCxcbiAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudDogdHJpZ2dlcixcbiAgICAgICAgICAgICAgZmxvYXRpbmdFbGVtZW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdE1zVmFsdWUgPSBnZXRSZXN0TXMocmVzdE1zUmVmLmN1cnJlbnQpO1xuICAgICAgICBpZiAoY3VycmVudE9wZW4gJiYgIWlzT3ZlckluYWN0aXZlIHx8IHJlc3RNc1ZhbHVlID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNPdmVySW5hY3RpdmUgJiYgaW5zdGFuY2UucmVzdFRpbWVvdXRQZW5kaW5nICYmIGV2ZW50Lm1vdmVtZW50WCAqKiAyICsgZXZlbnQubW92ZW1lbnRZICoqIDIgPCAyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlLnJlc3RUaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZU1vdXNlTW92ZSgpIHtcbiAgICAgICAgICBpbnN0YW5jZS5yZXN0VGltZW91dFBlbmRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgIC8vIEEgZGVsYXllZCBob3ZlciBvcGVuIHNob3VsZCBub3Qgb3ZlcnJpZGUgYSBjbGljay1saWtlIG9wZW4gdGhhdCBoYXBwZW5lZFxuICAgICAgICAgIC8vIHdoaWxlIHRoZSBob3ZlciBkZWxheSB3YXMgcGVuZGluZy5cbiAgICAgICAgICBpZiAoaXNDbGlja0xpa2VPcGVuRXZlbnQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBsYXRlc3RPcGVuID0gc3RvcmUuc2VsZWN0KCdvcGVuJyk7XG4gICAgICAgICAgaWYgKCFpbnN0YW5jZS5ibG9ja01vdXNlTW92ZSAmJiAoIWxhdGVzdE9wZW4gfHwgaXNPdmVySW5hY3RpdmUpICYmIGNoZWNrU2hvdWxkT3BlbigpKSB7XG4gICAgICAgICAgICBzdG9yZS5zZXRPcGVuKHRydWUsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnRyaWdnZXJIb3ZlciwgbmF0aXZlRXZlbnQsIHRyaWdnZXIpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlLnBvaW50ZXJUeXBlID09PSAndG91Y2gnKSB7XG4gICAgICAgICAgUmVhY3RET00uZmx1c2hTeW5jKCgpID0+IHtcbiAgICAgICAgICAgIGhhbmRsZU1vdXNlTW92ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGlzT3ZlckluYWN0aXZlICYmIGN1cnJlbnRPcGVuKSB7XG4gICAgICAgICAgaGFuZGxlTW91c2VNb3ZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5zdGFuY2UucmVzdFRpbWVvdXRQZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICBpbnN0YW5jZS5yZXN0VGltZW91dC5zdGFydChyZXN0TXNWYWx1ZSwgaGFuZGxlTW91c2VNb3ZlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH0sIFtlbmFibGVkLCBpbnN0YW5jZSwgaXNDbGlja0xpa2VPcGVuRXZlbnQsIGlzT3ZlckluYWN0aXZlVHJpZ2dlciwgbW91c2VPbmx5LCBzdG9yZSwgcmVzdE1zUmVmLCBjaGVja1Nob3VsZE9wZW5dKTtcbn0iLCJpbXBvcnQgeyBpc0VsZW1lbnQgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcbmltcG9ydCB7IFRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IGNvbnRhaW5zLCBnZXRUYXJnZXQgfSBmcm9tIFwiLi91dGlscy9lbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBnZXROb2RlQ2hpbGRyZW4gfSBmcm9tIFwiLi91dGlscy9ub2Rlcy5qc1wiO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1uZXN0ZWQtdGVybmFyeSAqL1xuXG5jb25zdCBDVVJTT1JfU1BFRURfVEhSRVNIT0xEID0gMC4xO1xuY29uc3QgQ1VSU09SX1NQRUVEX1RIUkVTSE9MRF9TUVVBUkVEID0gQ1VSU09SX1NQRUVEX1RIUkVTSE9MRCAqIENVUlNPUl9TUEVFRF9USFJFU0hPTEQ7XG5jb25zdCBQT0xZR09OX0JVRkZFUiA9IDAuNTtcbmZ1bmN0aW9uIGhhc0ludGVyc2VjdGluZ0VkZ2UocG9pbnRYLCBwb2ludFksIHhpLCB5aSwgeGosIHlqKSB7XG4gIHJldHVybiB5aSA+PSBwb2ludFkgIT09IHlqID49IHBvaW50WSAmJiBwb2ludFggPD0gKHhqIC0geGkpICogKHBvaW50WSAtIHlpKSAvICh5aiAtIHlpKSArIHhpO1xufVxuZnVuY3Rpb24gaXNQb2ludEluUXVhZHJpbGF0ZXJhbChwb2ludFgsIHBvaW50WSwgeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG4gIGxldCBpc0luc2lkZVZhbHVlID0gZmFsc2U7XG4gIGlmIChoYXNJbnRlcnNlY3RpbmdFZGdlKHBvaW50WCwgcG9pbnRZLCB4MSwgeTEsIHgyLCB5MikpIHtcbiAgICBpc0luc2lkZVZhbHVlID0gIWlzSW5zaWRlVmFsdWU7XG4gIH1cbiAgaWYgKGhhc0ludGVyc2VjdGluZ0VkZ2UocG9pbnRYLCBwb2ludFksIHgyLCB5MiwgeDMsIHkzKSkge1xuICAgIGlzSW5zaWRlVmFsdWUgPSAhaXNJbnNpZGVWYWx1ZTtcbiAgfVxuICBpZiAoaGFzSW50ZXJzZWN0aW5nRWRnZShwb2ludFgsIHBvaW50WSwgeDMsIHkzLCB4NCwgeTQpKSB7XG4gICAgaXNJbnNpZGVWYWx1ZSA9ICFpc0luc2lkZVZhbHVlO1xuICB9XG4gIGlmIChoYXNJbnRlcnNlY3RpbmdFZGdlKHBvaW50WCwgcG9pbnRZLCB4NCwgeTQsIHgxLCB5MSkpIHtcbiAgICBpc0luc2lkZVZhbHVlID0gIWlzSW5zaWRlVmFsdWU7XG4gIH1cbiAgcmV0dXJuIGlzSW5zaWRlVmFsdWU7XG59XG5mdW5jdGlvbiBpc0luc2lkZVJlY3QocG9pbnRYLCBwb2ludFksIHJlY3QpIHtcbiAgcmV0dXJuIHBvaW50WCA+PSByZWN0LnggJiYgcG9pbnRYIDw9IHJlY3QueCArIHJlY3Qud2lkdGggJiYgcG9pbnRZID49IHJlY3QueSAmJiBwb2ludFkgPD0gcmVjdC55ICsgcmVjdC5oZWlnaHQ7XG59XG5mdW5jdGlvbiBpc0luc2lkZUF4aXNBbGlnbmVkUmVjdChwb2ludFgsIHBvaW50WSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgY29uc3QgbWluWCA9IE1hdGgubWluKHgxLCB4Mik7XG4gIGNvbnN0IG1heFggPSBNYXRoLm1heCh4MSwgeDIpO1xuICBjb25zdCBtaW5ZID0gTWF0aC5taW4oeTEsIHkyKTtcbiAgY29uc3QgbWF4WSA9IE1hdGgubWF4KHkxLCB5Mik7XG4gIHJldHVybiBwb2ludFggPj0gbWluWCAmJiBwb2ludFggPD0gbWF4WCAmJiBwb2ludFkgPj0gbWluWSAmJiBwb2ludFkgPD0gbWF4WTtcbn1cbi8qKlxuICogR2VuZXJhdGVzIGEgc2FmZSBwb2x5Z29uIGFyZWEgdGhhdCB0aGUgdXNlciBjYW4gdHJhdmVyc2Ugd2l0aG91dCBjbG9zaW5nIHRoZVxuICogZmxvYXRpbmcgZWxlbWVudCBvbmNlIGxlYXZpbmcgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL3VzZUhvdmVyI3NhZmVwb2x5Z29uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYWZlUG9seWdvbihvcHRpb25zID0ge30pIHtcbiAgY29uc3Qge1xuICAgIGJsb2NrUG9pbnRlckV2ZW50cyA9IGZhbHNlXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCB0aW1lb3V0ID0gbmV3IFRpbWVvdXQoKTtcbiAgY29uc3QgZm4gPSAoe1xuICAgIHgsXG4gICAgeSxcbiAgICBwbGFjZW1lbnQsXG4gICAgZWxlbWVudHMsXG4gICAgb25DbG9zZSxcbiAgICBub2RlSWQsXG4gICAgdHJlZVxuICB9KSA9PiB7XG4gICAgY29uc3Qgc2lkZSA9IHBsYWNlbWVudD8uc3BsaXQoJy0nKVswXTtcbiAgICBsZXQgaGFzTGFuZGVkID0gZmFsc2U7XG4gICAgbGV0IGxhc3RYID0gbnVsbDtcbiAgICBsZXQgbGFzdFkgPSBudWxsO1xuICAgIGxldCBsYXN0Q3Vyc29yVGltZSA9IHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBwZXJmb3JtYW5jZS5ub3coKSA6IDA7XG4gICAgZnVuY3Rpb24gaXNDdXJzb3JNb3ZpbmdTbG93bHkobmV4dFgsIG5leHRZKSB7XG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgY29uc3QgZWxhcHNlZFRpbWUgPSBjdXJyZW50VGltZSAtIGxhc3RDdXJzb3JUaW1lO1xuICAgICAgaWYgKGxhc3RYID09PSBudWxsIHx8IGxhc3RZID09PSBudWxsIHx8IGVsYXBzZWRUaW1lID09PSAwKSB7XG4gICAgICAgIGxhc3RYID0gbmV4dFg7XG4gICAgICAgIGxhc3RZID0gbmV4dFk7XG4gICAgICAgIGxhc3RDdXJzb3JUaW1lID0gY3VycmVudFRpbWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRlbHRhWCA9IG5leHRYIC0gbGFzdFg7XG4gICAgICBjb25zdCBkZWx0YVkgPSBuZXh0WSAtIGxhc3RZO1xuICAgICAgY29uc3QgZGlzdGFuY2VTcXVhcmVkID0gZGVsdGFYICogZGVsdGFYICsgZGVsdGFZICogZGVsdGFZO1xuICAgICAgY29uc3QgdGhyZXNob2xkU3F1YXJlZCA9IGVsYXBzZWRUaW1lICogZWxhcHNlZFRpbWUgKiBDVVJTT1JfU1BFRURfVEhSRVNIT0xEX1NRVUFSRUQ7XG4gICAgICBsYXN0WCA9IG5leHRYO1xuICAgICAgbGFzdFkgPSBuZXh0WTtcbiAgICAgIGxhc3RDdXJzb3JUaW1lID0gY3VycmVudFRpbWU7XG4gICAgICByZXR1cm4gZGlzdGFuY2VTcXVhcmVkIDwgdGhyZXNob2xkU3F1YXJlZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICB0aW1lb3V0LmNsZWFyKCk7XG4gICAgICBvbkNsb3NlKCk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBvbk1vdXNlTW92ZShldmVudCkge1xuICAgICAgdGltZW91dC5jbGVhcigpO1xuICAgICAgY29uc3QgZG9tUmVmZXJlbmNlID0gZWxlbWVudHMuZG9tUmVmZXJlbmNlO1xuICAgICAgY29uc3QgZmxvYXRpbmcgPSBlbGVtZW50cy5mbG9hdGluZztcbiAgICAgIGlmICghZG9tUmVmZXJlbmNlIHx8ICFmbG9hdGluZyB8fCBzaWRlID09IG51bGwgfHwgeCA9PSBudWxsIHx8IHkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgY29uc3Qge1xuICAgICAgICBjbGllbnRYLFxuICAgICAgICBjbGllbnRZXG4gICAgICB9ID0gZXZlbnQ7XG4gICAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgICAgY29uc3QgaXNMZWF2ZSA9IGV2ZW50LnR5cGUgPT09ICdtb3VzZWxlYXZlJztcbiAgICAgIGNvbnN0IGlzT3ZlckZsb2F0aW5nRWwgPSBjb250YWlucyhmbG9hdGluZywgdGFyZ2V0KTtcbiAgICAgIGNvbnN0IGlzT3ZlclJlZmVyZW5jZUVsID0gY29udGFpbnMoZG9tUmVmZXJlbmNlLCB0YXJnZXQpO1xuICAgICAgaWYgKGlzT3ZlckZsb2F0aW5nRWwpIHtcbiAgICAgICAgaGFzTGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFpc0xlYXZlKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzT3ZlclJlZmVyZW5jZUVsKSB7XG4gICAgICAgIGhhc0xhbmRlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoIWlzTGVhdmUpIHtcbiAgICAgICAgICBoYXNMYW5kZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUHJldmVudCBvdmVybGFwcGluZyBmbG9hdGluZyBlbGVtZW50IGZyb20gYmVpbmcgc3R1Y2sgaW4gYW4gb3Blbi1jbG9zZVxuICAgICAgLy8gbG9vcDogaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL2lzc3Vlcy8xOTEwXG4gICAgICBpZiAoaXNMZWF2ZSAmJiBpc0VsZW1lbnQoZXZlbnQucmVsYXRlZFRhcmdldCkgJiYgY29udGFpbnMoZmxvYXRpbmcsIGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBoYXNPcGVuQ2hpbGROb2RlKCkge1xuICAgICAgICByZXR1cm4gQm9vbGVhbih0cmVlICYmIGdldE5vZGVDaGlsZHJlbih0cmVlLm5vZGVzUmVmLmN1cnJlbnQsIG5vZGVJZCkubGVuZ3RoID4gMCk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjbG9zZUlmTm9PcGVuQ2hpbGQoKSB7XG4gICAgICAgIGlmICghaGFzT3BlbkNoaWxkTm9kZSgpKSB7XG4gICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBhbnkgbmVzdGVkIGNoaWxkIGlzIG9wZW4sIGFib3J0LlxuICAgICAgaWYgKGhhc09wZW5DaGlsZE5vZGUoKSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVmUmVjdCA9IGRvbVJlZmVyZW5jZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHJlY3QgPSBmbG9hdGluZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IGN1cnNvckxlYXZlRnJvbVJpZ2h0ID0geCA+IHJlY3QucmlnaHQgLSByZWN0LndpZHRoIC8gMjtcbiAgICAgIGNvbnN0IGN1cnNvckxlYXZlRnJvbUJvdHRvbSA9IHkgPiByZWN0LmJvdHRvbSAtIHJlY3QuaGVpZ2h0IC8gMjtcbiAgICAgIGNvbnN0IGlzRmxvYXRpbmdXaWRlciA9IHJlY3Qud2lkdGggPiByZWZSZWN0LndpZHRoO1xuICAgICAgY29uc3QgaXNGbG9hdGluZ1RhbGxlciA9IHJlY3QuaGVpZ2h0ID4gcmVmUmVjdC5oZWlnaHQ7XG4gICAgICBjb25zdCBsZWZ0ID0gKGlzRmxvYXRpbmdXaWRlciA/IHJlZlJlY3QgOiByZWN0KS5sZWZ0O1xuICAgICAgY29uc3QgcmlnaHQgPSAoaXNGbG9hdGluZ1dpZGVyID8gcmVmUmVjdCA6IHJlY3QpLnJpZ2h0O1xuICAgICAgY29uc3QgdG9wID0gKGlzRmxvYXRpbmdUYWxsZXIgPyByZWZSZWN0IDogcmVjdCkudG9wO1xuICAgICAgY29uc3QgYm90dG9tID0gKGlzRmxvYXRpbmdUYWxsZXIgPyByZWZSZWN0IDogcmVjdCkuYm90dG9tO1xuXG4gICAgICAvLyBJZiB0aGUgcG9pbnRlciBpcyBsZWF2aW5nIGZyb20gdGhlIG9wcG9zaXRlIHNpZGUsIHRoZSBcImJ1ZmZlclwiIGxvZ2ljXG4gICAgICAvLyBjcmVhdGVzIGEgcG9pbnQgd2hlcmUgdGhlIGZsb2F0aW5nIGVsZW1lbnQgcmVtYWlucyBvcGVuLCBidXQgc2hvdWxkIGJlXG4gICAgICAvLyBpZ25vcmVkLlxuICAgICAgLy8gQSBjb25zdGFudCBvZiAxIGhhbmRsZXMgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzLlxuICAgICAgaWYgKHNpZGUgPT09ICd0b3AnICYmIHkgPj0gcmVmUmVjdC5ib3R0b20gLSAxIHx8IHNpZGUgPT09ICdib3R0b20nICYmIHkgPD0gcmVmUmVjdC50b3AgKyAxIHx8IHNpZGUgPT09ICdsZWZ0JyAmJiB4ID49IHJlZlJlY3QucmlnaHQgLSAxIHx8IHNpZGUgPT09ICdyaWdodCcgJiYgeCA8PSByZWZSZWN0LmxlZnQgKyAxKSB7XG4gICAgICAgIGNsb3NlSWZOb09wZW5DaGlsZCgpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBJZ25vcmUgd2hlbiB0aGUgY3Vyc29yIGlzIHdpdGhpbiB0aGUgcmVjdGFuZ3VsYXIgdHJvdWdoIGJldHdlZW4gdGhlXG4gICAgICAvLyB0d28gZWxlbWVudHMuIFNpbmNlIHRoZSB0cmlhbmdsZSBpcyBjcmVhdGVkIGZyb20gdGhlIGN1cnNvciBwb2ludCxcbiAgICAgIC8vIHdoaWNoIGNhbiBzdGFydCBiZXlvbmQgdGhlIHJlZiBlbGVtZW50J3MgZWRnZSwgdHJhdmVyc2luZyBiYWNrIGFuZFxuICAgICAgLy8gZm9ydGggZnJvbSB0aGUgcmVmIHRvIHRoZSBmbG9hdGluZyBlbGVtZW50IGNhbiBjYXVzZSBpdCB0byBjbG9zZS4gVGhpc1xuICAgICAgLy8gZW5zdXJlcyBpdCBhbHdheXMgcmVtYWlucyBvcGVuIGluIHRoYXQgY2FzZS5cbiAgICAgIGxldCBpc0luc2lkZVRyb3VnaFJlY3QgPSBmYWxzZTtcbiAgICAgIHN3aXRjaCAoc2lkZSkge1xuICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgIGlzSW5zaWRlVHJvdWdoUmVjdCA9IGlzSW5zaWRlQXhpc0FsaWduZWRSZWN0KGNsaWVudFgsIGNsaWVudFksIGxlZnQsIHJlZlJlY3QudG9wICsgMSwgcmlnaHQsIHJlY3QuYm90dG9tIC0gMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgaXNJbnNpZGVUcm91Z2hSZWN0ID0gaXNJbnNpZGVBeGlzQWxpZ25lZFJlY3QoY2xpZW50WCwgY2xpZW50WSwgbGVmdCwgcmVjdC50b3AgKyAxLCByaWdodCwgcmVmUmVjdC5ib3R0b20gLSAxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgaXNJbnNpZGVUcm91Z2hSZWN0ID0gaXNJbnNpZGVBeGlzQWxpZ25lZFJlY3QoY2xpZW50WCwgY2xpZW50WSwgcmVjdC5yaWdodCAtIDEsIGJvdHRvbSwgcmVmUmVjdC5sZWZ0ICsgMSwgdG9wKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGlzSW5zaWRlVHJvdWdoUmVjdCA9IGlzSW5zaWRlQXhpc0FsaWduZWRSZWN0KGNsaWVudFgsIGNsaWVudFksIHJlZlJlY3QucmlnaHQgLSAxLCBib3R0b20sIHJlY3QubGVmdCArIDEsIHRvcCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgICBpZiAoaXNJbnNpZGVUcm91Z2hSZWN0KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBpZiAoaGFzTGFuZGVkICYmICFpc0luc2lkZVJlY3QoY2xpZW50WCwgY2xpZW50WSwgcmVmUmVjdCkpIHtcbiAgICAgICAgY2xvc2VJZk5vT3BlbkNoaWxkKCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBpZiAoIWlzTGVhdmUgJiYgaXNDdXJzb3JNb3ZpbmdTbG93bHkoY2xpZW50WCwgY2xpZW50WSkpIHtcbiAgICAgICAgY2xvc2VJZk5vT3BlbkNoaWxkKCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnNpZGVQb2x5Z29uID0gZmFsc2U7XG4gICAgICBzd2l0Y2ggKHNpZGUpIHtcbiAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JYT2Zmc2V0ID0gaXNGbG9hdGluZ1dpZGVyID8gUE9MWUdPTl9CVUZGRVIgLyAyIDogUE9MWUdPTl9CVUZGRVIgKiA0O1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yUG9pbnRPbmVYID0gaXNGbG9hdGluZ1dpZGVyID8geCArIGN1cnNvclhPZmZzZXQgOiBjdXJzb3JMZWF2ZUZyb21SaWdodCA/IHggKyBjdXJzb3JYT2Zmc2V0IDogeCAtIGN1cnNvclhPZmZzZXQ7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JQb2ludFR3b1ggPSBpc0Zsb2F0aW5nV2lkZXIgPyB4IC0gY3Vyc29yWE9mZnNldCA6IGN1cnNvckxlYXZlRnJvbVJpZ2h0ID8geCArIGN1cnNvclhPZmZzZXQgOiB4IC0gY3Vyc29yWE9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvclBvaW50WSA9IHkgKyBQT0xZR09OX0JVRkZFUiArIDE7XG4gICAgICAgICAgICBjb25zdCBjb21tb25ZTGVmdCA9IGN1cnNvckxlYXZlRnJvbVJpZ2h0ID8gcmVjdC5ib3R0b20gLSBQT0xZR09OX0JVRkZFUiA6IGlzRmxvYXRpbmdXaWRlciA/IHJlY3QuYm90dG9tIC0gUE9MWUdPTl9CVUZGRVIgOiByZWN0LnRvcDtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1vbllSaWdodCA9IGN1cnNvckxlYXZlRnJvbVJpZ2h0ID8gaXNGbG9hdGluZ1dpZGVyID8gcmVjdC5ib3R0b20gLSBQT0xZR09OX0JVRkZFUiA6IHJlY3QudG9wIDogcmVjdC5ib3R0b20gLSBQT0xZR09OX0JVRkZFUjtcbiAgICAgICAgICAgIGlzSW5zaWRlUG9seWdvbiA9IGlzUG9pbnRJblF1YWRyaWxhdGVyYWwoY2xpZW50WCwgY2xpZW50WSwgY3Vyc29yUG9pbnRPbmVYLCBjdXJzb3JQb2ludFksIGN1cnNvclBvaW50VHdvWCwgY3Vyc29yUG9pbnRZLCByZWN0LmxlZnQsIGNvbW1vbllMZWZ0LCByZWN0LnJpZ2h0LCBjb21tb25ZUmlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvclhPZmZzZXQgPSBpc0Zsb2F0aW5nV2lkZXIgPyBQT0xZR09OX0JVRkZFUiAvIDIgOiBQT0xZR09OX0JVRkZFUiAqIDQ7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JQb2ludE9uZVggPSBpc0Zsb2F0aW5nV2lkZXIgPyB4ICsgY3Vyc29yWE9mZnNldCA6IGN1cnNvckxlYXZlRnJvbVJpZ2h0ID8geCArIGN1cnNvclhPZmZzZXQgOiB4IC0gY3Vyc29yWE9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvclBvaW50VHdvWCA9IGlzRmxvYXRpbmdXaWRlciA/IHggLSBjdXJzb3JYT2Zmc2V0IDogY3Vyc29yTGVhdmVGcm9tUmlnaHQgPyB4ICsgY3Vyc29yWE9mZnNldCA6IHggLSBjdXJzb3JYT2Zmc2V0O1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yUG9pbnRZID0geSAtIFBPTFlHT05fQlVGRkVSO1xuICAgICAgICAgICAgY29uc3QgY29tbW9uWUxlZnQgPSBjdXJzb3JMZWF2ZUZyb21SaWdodCA/IHJlY3QudG9wICsgUE9MWUdPTl9CVUZGRVIgOiBpc0Zsb2F0aW5nV2lkZXIgPyByZWN0LnRvcCArIFBPTFlHT05fQlVGRkVSIDogcmVjdC5ib3R0b207XG4gICAgICAgICAgICBjb25zdCBjb21tb25ZUmlnaHQgPSBjdXJzb3JMZWF2ZUZyb21SaWdodCA/IGlzRmxvYXRpbmdXaWRlciA/IHJlY3QudG9wICsgUE9MWUdPTl9CVUZGRVIgOiByZWN0LmJvdHRvbSA6IHJlY3QudG9wICsgUE9MWUdPTl9CVUZGRVI7XG4gICAgICAgICAgICBpc0luc2lkZVBvbHlnb24gPSBpc1BvaW50SW5RdWFkcmlsYXRlcmFsKGNsaWVudFgsIGNsaWVudFksIGN1cnNvclBvaW50T25lWCwgY3Vyc29yUG9pbnRZLCBjdXJzb3JQb2ludFR3b1gsIGN1cnNvclBvaW50WSwgcmVjdC5sZWZ0LCBjb21tb25ZTGVmdCwgcmVjdC5yaWdodCwgY29tbW9uWVJpZ2h0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yWU9mZnNldCA9IGlzRmxvYXRpbmdUYWxsZXIgPyBQT0xZR09OX0JVRkZFUiAvIDIgOiBQT0xZR09OX0JVRkZFUiAqIDQ7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JQb2ludE9uZVkgPSBpc0Zsb2F0aW5nVGFsbGVyID8geSArIGN1cnNvcllPZmZzZXQgOiBjdXJzb3JMZWF2ZUZyb21Cb3R0b20gPyB5ICsgY3Vyc29yWU9mZnNldCA6IHkgLSBjdXJzb3JZT2Zmc2V0O1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yUG9pbnRUd29ZID0gaXNGbG9hdGluZ1RhbGxlciA/IHkgLSBjdXJzb3JZT2Zmc2V0IDogY3Vyc29yTGVhdmVGcm9tQm90dG9tID8geSArIGN1cnNvcllPZmZzZXQgOiB5IC0gY3Vyc29yWU9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvclBvaW50WCA9IHggKyBQT0xZR09OX0JVRkZFUiArIDE7XG4gICAgICAgICAgICBjb25zdCBjb21tb25YVG9wID0gY3Vyc29yTGVhdmVGcm9tQm90dG9tID8gcmVjdC5yaWdodCAtIFBPTFlHT05fQlVGRkVSIDogaXNGbG9hdGluZ1RhbGxlciA/IHJlY3QucmlnaHQgLSBQT0xZR09OX0JVRkZFUiA6IHJlY3QubGVmdDtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1vblhCb3R0b20gPSBjdXJzb3JMZWF2ZUZyb21Cb3R0b20gPyBpc0Zsb2F0aW5nVGFsbGVyID8gcmVjdC5yaWdodCAtIFBPTFlHT05fQlVGRkVSIDogcmVjdC5sZWZ0IDogcmVjdC5yaWdodCAtIFBPTFlHT05fQlVGRkVSO1xuICAgICAgICAgICAgaXNJbnNpZGVQb2x5Z29uID0gaXNQb2ludEluUXVhZHJpbGF0ZXJhbChjbGllbnRYLCBjbGllbnRZLCBjb21tb25YVG9wLCByZWN0LnRvcCwgY29tbW9uWEJvdHRvbSwgcmVjdC5ib3R0b20sIGN1cnNvclBvaW50WCwgY3Vyc29yUG9pbnRPbmVZLCBjdXJzb3JQb2ludFgsIGN1cnNvclBvaW50VHdvWSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JZT2Zmc2V0ID0gaXNGbG9hdGluZ1RhbGxlciA/IFBPTFlHT05fQlVGRkVSIC8gMiA6IFBPTFlHT05fQlVGRkVSICogNDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvclBvaW50T25lWSA9IGlzRmxvYXRpbmdUYWxsZXIgPyB5ICsgY3Vyc29yWU9mZnNldCA6IGN1cnNvckxlYXZlRnJvbUJvdHRvbSA/IHkgKyBjdXJzb3JZT2Zmc2V0IDogeSAtIGN1cnNvcllPZmZzZXQ7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3JQb2ludFR3b1kgPSBpc0Zsb2F0aW5nVGFsbGVyID8geSAtIGN1cnNvcllPZmZzZXQgOiBjdXJzb3JMZWF2ZUZyb21Cb3R0b20gPyB5ICsgY3Vyc29yWU9mZnNldCA6IHkgLSBjdXJzb3JZT2Zmc2V0O1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yUG9pbnRYID0geCAtIFBPTFlHT05fQlVGRkVSO1xuICAgICAgICAgICAgY29uc3QgY29tbW9uWFRvcCA9IGN1cnNvckxlYXZlRnJvbUJvdHRvbSA/IHJlY3QubGVmdCArIFBPTFlHT05fQlVGRkVSIDogaXNGbG9hdGluZ1RhbGxlciA/IHJlY3QubGVmdCArIFBPTFlHT05fQlVGRkVSIDogcmVjdC5yaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1vblhCb3R0b20gPSBjdXJzb3JMZWF2ZUZyb21Cb3R0b20gPyBpc0Zsb2F0aW5nVGFsbGVyID8gcmVjdC5sZWZ0ICsgUE9MWUdPTl9CVUZGRVIgOiByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0ICsgUE9MWUdPTl9CVUZGRVI7XG4gICAgICAgICAgICBpc0luc2lkZVBvbHlnb24gPSBpc1BvaW50SW5RdWFkcmlsYXRlcmFsKGNsaWVudFgsIGNsaWVudFksIGN1cnNvclBvaW50WCwgY3Vyc29yUG9pbnRPbmVZLCBjdXJzb3JQb2ludFgsIGN1cnNvclBvaW50VHdvWSwgY29tbW9uWFRvcCwgcmVjdC50b3AsIGNvbW1vblhCb3R0b20sIHJlY3QuYm90dG9tKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICAgIGlmICghaXNJbnNpZGVQb2x5Z29uKSB7XG4gICAgICAgIGNsb3NlSWZOb09wZW5DaGlsZCgpO1xuICAgICAgfSBlbHNlIGlmICghaGFzTGFuZGVkKSB7XG4gICAgICAgIHRpbWVvdXQuc3RhcnQoNDAsIGNsb3NlSWZOb09wZW5DaGlsZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG4gIH07XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVyc2NvcmUtZGFuZ2xlXG4gIGZuLl9fb3B0aW9ucyA9IHtcbiAgICAuLi5vcHRpb25zLFxuICAgIGJsb2NrUG9pbnRlckV2ZW50c1xuICB9O1xuICByZXR1cm4gZm47XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgTWVudVBvc2l0aW9uZXJDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVQb3NpdGlvbmVyQ29udGV4dC5kaXNwbGF5TmFtZSA9IFwiTWVudVBvc2l0aW9uZXJDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlTWVudVBvc2l0aW9uZXJDb250ZXh0KG9wdGlvbmFsKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1lbnVQb3NpdGlvbmVyQ29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQgJiYgIW9wdGlvbmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBNZW51UG9zaXRpb25lckNvbnRleHQgaXMgbWlzc2luZy4gTWVudVBvc2l0aW9uZXIgcGFydHMgbXVzdCBiZSBwbGFjZWQgd2l0aGluIDxNZW51LlBvc2l0aW9uZXI+LicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDMzKSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgTWVudVJvb3RDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVSb290Q29udGV4dC5kaXNwbGF5TmFtZSA9IFwiTWVudVJvb3RDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlTWVudVJvb3RDb250ZXh0KG9wdGlvbmFsKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1lbnVSb290Q29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQgJiYgIW9wdGlvbmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBNZW51Um9vdENvbnRleHQgaXMgbWlzc2luZy4gTWVudSBwYXJ0cyBtdXN0IGJlIHBsYWNlZCB3aXRoaW4gPE1lbnUuUm9vdD4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoMzYpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCB9IGZyb20gXCIuLi9wb3NpdGlvbmVyL01lbnVQb3NpdGlvbmVyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlTWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvTWVudVJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBwb3B1cFN0YXRlTWFwcGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuXG4vKipcbiAqIERpc3BsYXlzIGFuIGVsZW1lbnQgcG9zaXRpb25lZCBhZ2FpbnN0IHRoZSBtZW51IGFuY2hvci5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmV4cG9ydCBjb25zdCBNZW51QXJyb3cgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBNZW51QXJyb3coY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZU1lbnVSb290Q29udGV4dCgpO1xuICBjb25zdCB7XG4gICAgYXJyb3dSZWYsXG4gICAgc2lkZSxcbiAgICBhbGlnbixcbiAgICBhcnJvd1VuY2VudGVyZWQsXG4gICAgYXJyb3dTdHlsZXNcbiAgfSA9IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCgpO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICBzaWRlLFxuICAgIGFsaWduLFxuICAgIHVuY2VudGVyZWQ6IGFycm93VW5jZW50ZXJlZFxuICB9O1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICByZWY6IFthcnJvd1JlZiwgZm9yd2FyZGVkUmVmXSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nOiBwb3B1cFN0YXRlTWFwcGluZyxcbiAgICBzdGF0ZSxcbiAgICBwcm9wczoge1xuICAgICAgc3R5bGU6IGFycm93U3R5bGVzLFxuICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgIC4uLmVsZW1lbnRQcm9wc1xuICAgIH1cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVBcnJvdy5kaXNwbGF5TmFtZSA9IFwiTWVudUFycm93XCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgQ29udGV4dE1lbnVSb290Q29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBDb250ZXh0TWVudVJvb3RDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJDb250ZXh0TWVudVJvb3RDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlQ29udGV4dE1lbnVSb290Q29udGV4dChvcHRpb25hbCA9IHRydWUpIHtcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoQ29udGV4dE1lbnVSb290Q29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQgJiYgIW9wdGlvbmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBDb250ZXh0TWVudVJvb3RDb250ZXh0IGlzIG1pc3NpbmcuIENvbnRleHRNZW51IHBhcnRzIG11c3QgYmUgcGxhY2VkIHdpdGhpbiA8Q29udGV4dE1lbnUuUm9vdD4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoMjUpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgYXMgYmFzZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VDb250ZXh0TWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2NvbnRleHQtbWVudS9yb290L0NvbnRleHRNZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIC4uLmJhc2VNYXBwaW5nLFxuICAuLi50cmFuc2l0aW9uU3RhdHVzTWFwcGluZ1xufTtcblxuLyoqXG4gKiBBbiBvdmVybGF5IGRpc3BsYXllZCBiZW5lYXRoIHRoZSBtZW51IHBvcHVwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuZXhwb3J0IGNvbnN0IE1lbnVCYWNrZHJvcCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIE1lbnVCYWNrZHJvcChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlTWVudVJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IG9wZW4gPSBzdG9yZS51c2VTdGF0ZSgnb3BlbicpO1xuICBjb25zdCBtb3VudGVkID0gc3RvcmUudXNlU3RhdGUoJ21vdW50ZWQnKTtcbiAgY29uc3QgdHJhbnNpdGlvblN0YXR1cyA9IHN0b3JlLnVzZVN0YXRlKCd0cmFuc2l0aW9uU3RhdHVzJyk7XG4gIGNvbnN0IGxhc3RPcGVuQ2hhbmdlUmVhc29uID0gc3RvcmUudXNlU3RhdGUoJ2xhc3RPcGVuQ2hhbmdlUmVhc29uJyk7XG4gIGNvbnN0IGNvbnRleHRNZW51Q29udGV4dCA9IHVzZUNvbnRleHRNZW51Um9vdENvbnRleHQoKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICB0cmFuc2l0aW9uU3RhdHVzXG4gIH07XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHJlZjogY29udGV4dE1lbnVDb250ZXh0Py5iYWNrZHJvcFJlZiA/IFtmb3J3YXJkZWRSZWYsIGNvbnRleHRNZW51Q29udGV4dC5iYWNrZHJvcFJlZl0gOiBmb3J3YXJkZWRSZWYsXG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZyxcbiAgICBwcm9wczogW3tcbiAgICAgIHJvbGU6ICdwcmVzZW50YXRpb24nLFxuICAgICAgaGlkZGVuOiAhbW91bnRlZCxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIHBvaW50ZXJFdmVudHM6IGxhc3RPcGVuQ2hhbmdlUmVhc29uID09PSBSRUFTT05TLnRyaWdnZXJIb3ZlciA/ICdub25lJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZSdcbiAgICAgIH1cbiAgICB9LCBlbGVtZW50UHJvcHNdXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51QmFja2Ryb3AuZGlzcGxheU5hbWUgPSBcIk1lbnVCYWNrZHJvcFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuZXhwb3J0IGNvbnN0IE1lbnVDaGVja2JveEl0ZW1Db250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVDaGVja2JveEl0ZW1Db250ZXh0LmRpc3BsYXlOYW1lID0gXCJNZW51Q2hlY2tib3hJdGVtQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVDaGVja2JveEl0ZW1Db250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNZW51Q2hlY2tib3hJdGVtQ29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IE1lbnVDaGVja2JveEl0ZW1Db250ZXh0IGlzIG1pc3NpbmcuIE1lbnVDaGVja2JveEl0ZW0gcGFydHMgbXVzdCBiZSBwbGFjZWQgd2l0aGluIDxNZW51LkNoZWNrYm94SXRlbT4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoMzApKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGlzTWFjIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZGV0ZWN0QnJvd3Nlcic7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyB1c2VDb250ZXh0TWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2NvbnRleHQtbWVudS9yb290L0NvbnRleHRNZW51Um9vdENvbnRleHQuanNcIjtcbi8qKlxuICogUmV0dXJucyBjb21tb24gcHJvcHMgc2hhcmVkIGJ5IGFsbCBtZW51IGl0ZW0gdHlwZXMuXG4gKiBUaGlzIGhvb2sgZXh0cmFjdHMgdGhlIHNoYXJlZCBsb2dpYyBmb3IgaWQsIHJvbGUsIHRhYkluZGV4LCBvbktleURvd24sXG4gKiBvbk1vdXNlTW92ZSwgb25DbGljaywgYW5kIG9uTW91c2VVcCBoYW5kbGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVJdGVtQ29tbW9uUHJvcHMocGFyYW1zKSB7XG4gIGNvbnN0IHtcbiAgICBjbG9zZU9uQ2xpY2ssXG4gICAgaGlnaGxpZ2h0ZWQsXG4gICAgaWQsXG4gICAgbm9kZUlkLFxuICAgIHN0b3JlLFxuICAgIHR5cGluZ1JlZixcbiAgICBpdGVtUmVmLFxuICAgIGl0ZW1NZXRhZGF0YVxuICB9ID0gcGFyYW1zO1xuICBjb25zdCB7XG4gICAgZXZlbnRzOiBtZW51RXZlbnRzXG4gIH0gPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdUcmVlUm9vdCcpO1xuICBjb25zdCBjb250ZXh0TWVudUNvbnRleHQgPSB1c2VDb250ZXh0TWVudVJvb3RDb250ZXh0KHRydWUpO1xuICBjb25zdCBpc0NvbnRleHRNZW51ID0gY29udGV4dE1lbnVDb250ZXh0ICE9PSB1bmRlZmluZWQ7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgaWQsXG4gICAgcm9sZTogJ21lbnVpdGVtJyxcbiAgICB0YWJJbmRleDogaGlnaGxpZ2h0ZWQgPyAwIDogLTEsXG4gICAgb25LZXlEb3duKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSAnICcgJiYgdHlwaW5nUmVmPy5jdXJyZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBvbk1vdXNlTW92ZShldmVudCkge1xuICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJbmZvcm0gdGhlIGZsb2F0aW5nIHRyZWUgdGhhdCBhIG1lbnUgaXRlbSB3aXRoaW4gdGhpcyBtZW51IHdhcyBob3ZlcmVkL21vdmVkIG92ZXJcbiAgICAgIC8vIHNvIHVucmVsYXRlZCBkZXNjZW5kYW50IHN1Ym1lbnVzIGNhbiBiZSBjbG9zZWQuXG4gICAgICBtZW51RXZlbnRzLmVtaXQoJ2l0ZW1ob3ZlcicsIHtcbiAgICAgICAgbm9kZUlkLFxuICAgICAgICB0YXJnZXQ6IGV2ZW50LmN1cnJlbnRUYXJnZXRcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb25DbGljayhldmVudCkge1xuICAgICAgaWYgKGNsb3NlT25DbGljaykge1xuICAgICAgICBtZW51RXZlbnRzLmVtaXQoJ2Nsb3NlJywge1xuICAgICAgICAgIGRvbUV2ZW50OiBldmVudCxcbiAgICAgICAgICByZWFzb246IFJFQVNPTlMuaXRlbVByZXNzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgb25Nb3VzZVVwKGV2ZW50KSB7XG4gICAgICBpZiAoY29udGV4dE1lbnVDb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IGluaXRpYWxDdXJzb3JQb2ludCA9IGNvbnRleHRNZW51Q29udGV4dC5pbml0aWFsQ3Vyc29yUG9pbnRSZWYuY3VycmVudDtcbiAgICAgICAgY29udGV4dE1lbnVDb250ZXh0LmluaXRpYWxDdXJzb3JQb2ludFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgaWYgKGlzQ29udGV4dE1lbnUgJiYgaW5pdGlhbEN1cnNvclBvaW50ICYmIE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSBpbml0aWFsQ3Vyc29yUG9pbnQueCkgPD0gMSAmJiBNYXRoLmFicyhldmVudC5jbGllbnRZIC0gaW5pdGlhbEN1cnNvclBvaW50LnkpIDw9IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPbiBub24tbWFjT1MgcGxhdGZvcm1zLCB0aGlzIG1vdXNldXAgYmVsb25ncyB0byB0aGUgcmlnaHQtY2xpY2sgZ2VzdHVyZVxuICAgICAgICAvLyB0aGF0IG9wZW5lZCB0aGUgY29udGV4dCBtZW51LCBzbyBpdCBtdXN0IG5vdCBhY3RpdmF0ZSBhbiBpdGVtLlxuICAgICAgICBpZiAoaXNDb250ZXh0TWVudSAmJiAhaXNNYWMgJiYgZXZlbnQuYnV0dG9uID09PSAyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXRlbVJlZi5jdXJyZW50ICYmIHN0b3JlLmNvbnRleHQuYWxsb3dNb3VzZVVwVHJpZ2dlclJlZi5jdXJyZW50ICYmICghaXNDb250ZXh0TWVudSB8fCBldmVudC5idXR0b24gPT09IDIpKSB7XG4gICAgICAgIC8vIFRoaXMgZmlyZXMgd2hlbmV2ZXIgdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSB0cmlnZ2VyLCBtb3ZlcyB0aGUgY3Vyc29yLCBhbmQgcmVsZWFzZXMgaXQgb3ZlciB0aGUgaXRlbS5cbiAgICAgICAgLy8gV2UgdHJpZ2dlciB0aGUgY2xpY2sgYW5kIG92ZXJyaWRlIHRoZSBgY2xvc2VPbkNsaWNrYCBwcmVmZXJlbmNlIHRvIGFsd2F5cyBjbG9zZSB0aGUgbWVudS5cbiAgICAgICAgaWYgKCFpdGVtTWV0YWRhdGEgfHwgaXRlbU1ldGFkYXRhLnR5cGUgPT09ICdyZWd1bGFyLWl0ZW0nKSB7XG4gICAgICAgICAgaXRlbVJlZi5jdXJyZW50LmNsaWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pLCBbY2xvc2VPbkNsaWNrLCBoaWdobGlnaHRlZCwgaWQsIG1lbnVFdmVudHMsIG5vZGVJZCwgc3RvcmUsIHR5cGluZ1JlZiwgaXRlbVJlZiwgY29udGV4dE1lbnVDb250ZXh0LCBpc0NvbnRleHRNZW51LCBpdGVtTWV0YWRhdGFdKTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lcmdlZFJlZnMgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VNZXJnZWRSZWZzJztcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHsgbWVyZ2VQcm9wcyB9IGZyb20gXCIuLi8uLi9tZXJnZS1wcm9wcy9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdXNlTWVudUl0ZW1Db21tb25Qcm9wcyB9IGZyb20gXCIuL3VzZU1lbnVJdGVtQ29tbW9uUHJvcHMuanNcIjtcbmV4cG9ydCBjb25zdCBSRUdVTEFSX0lURU0gPSB7XG4gIHR5cGU6ICdyZWd1bGFyLWl0ZW0nXG59O1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVJdGVtKHBhcmFtcykge1xuICBjb25zdCB7XG4gICAgY2xvc2VPbkNsaWNrLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgaGlnaGxpZ2h0ZWQsXG4gICAgaWQsXG4gICAgc3RvcmUsXG4gICAgdHlwaW5nUmVmID0gc3RvcmUuY29udGV4dC50eXBpbmdSZWYsXG4gICAgbmF0aXZlQnV0dG9uLFxuICAgIGl0ZW1NZXRhZGF0YSxcbiAgICBub2RlSWRcbiAgfSA9IHBhcmFtcztcbiAgY29uc3QgaXRlbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qge1xuICAgIGdldEJ1dHRvblByb3BzLFxuICAgIGJ1dHRvblJlZlxuICB9ID0gdXNlQnV0dG9uKHtcbiAgICBkaXNhYmxlZCxcbiAgICBmb2N1c2FibGVXaGVuRGlzYWJsZWQ6IHRydWUsXG4gICAgbmF0aXZlOiBuYXRpdmVCdXR0b24sXG4gICAgY29tcG9zaXRlOiB0cnVlXG4gIH0pO1xuICBjb25zdCBjb21tb25Qcm9wcyA9IHVzZU1lbnVJdGVtQ29tbW9uUHJvcHMoe1xuICAgIGNsb3NlT25DbGljayxcbiAgICBoaWdobGlnaHRlZCxcbiAgICBpZCxcbiAgICBub2RlSWQsXG4gICAgc3RvcmUsXG4gICAgdHlwaW5nUmVmLFxuICAgIGl0ZW1SZWYsXG4gICAgaXRlbU1ldGFkYXRhXG4gIH0pO1xuICBjb25zdCBnZXRJdGVtUHJvcHMgPSBSZWFjdC51c2VDYWxsYmFjayhleHRlcm5hbFByb3BzID0+IHtcbiAgICByZXR1cm4gbWVyZ2VQcm9wcyhjb21tb25Qcm9wcywge1xuICAgICAgb25Nb3VzZUVudGVyKCkge1xuICAgICAgICBpZiAoaXRlbU1ldGFkYXRhLnR5cGUgIT09ICdzdWJtZW51LXRyaWdnZXInKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGl0ZW1NZXRhZGF0YS5zZXRBY3RpdmUoKTtcbiAgICAgIH1cbiAgICB9LCBleHRlcm5hbFByb3BzLCBnZXRCdXR0b25Qcm9wcyk7XG4gIH0sIFtjb21tb25Qcm9wcywgZ2V0QnV0dG9uUHJvcHMsIGl0ZW1NZXRhZGF0YV0pO1xuICBjb25zdCBtZXJnZWRSZWYgPSB1c2VNZXJnZWRSZWZzKGl0ZW1SZWYsIGJ1dHRvblJlZik7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgZ2V0SXRlbVByb3BzLFxuICAgIGl0ZW1SZWY6IG1lcmdlZFJlZlxuICB9KSwgW2dldEl0ZW1Qcm9wcywgbWVyZ2VkUmVmXSk7XG59IiwiZXhwb3J0IGxldCBNZW51Q2hlY2tib3hJdGVtRGF0YUF0dHJpYnV0ZXMgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1lbnVDaGVja2JveEl0ZW1EYXRhQXR0cmlidXRlcykge1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBtZW51IGNoZWNrYm94IGl0ZW0gaXMgY2hlY2tlZC5cbiAgICovXG4gIE1lbnVDaGVja2JveEl0ZW1EYXRhQXR0cmlidXRlc1tcImNoZWNrZWRcIl0gPSBcImRhdGEtY2hlY2tlZFwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBtZW51IGNoZWNrYm94IGl0ZW0gaXMgbm90IGNoZWNrZWQuXG4gICAqL1xuICBNZW51Q2hlY2tib3hJdGVtRGF0YUF0dHJpYnV0ZXNbXCJ1bmNoZWNrZWRcIl0gPSBcImRhdGEtdW5jaGVja2VkXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIG1lbnUgY2hlY2tib3ggaXRlbSBpcyBkaXNhYmxlZC5cbiAgICovXG4gIE1lbnVDaGVja2JveEl0ZW1EYXRhQXR0cmlidXRlc1tcImRpc2FibGVkXCJdID0gXCJkYXRhLWRpc2FibGVkXCI7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIG1lbnUgY2hlY2tib3ggaXRlbSBpcyBoaWdobGlnaHRlZC5cbiAgICovXG4gIE1lbnVDaGVja2JveEl0ZW1EYXRhQXR0cmlidXRlc1tcImhpZ2hsaWdodGVkXCJdID0gXCJkYXRhLWhpZ2hsaWdodGVkXCI7XG4gIHJldHVybiBNZW51Q2hlY2tib3hJdGVtRGF0YUF0dHJpYnV0ZXM7XG59KHt9KTsiLCJpbXBvcnQgeyB0cmFuc2l0aW9uU3RhdHVzTWFwcGluZyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgTWVudUNoZWNrYm94SXRlbURhdGFBdHRyaWJ1dGVzIH0gZnJvbSBcIi4uL2NoZWNrYm94LWl0ZW0vTWVudUNoZWNrYm94SXRlbURhdGFBdHRyaWJ1dGVzLmpzXCI7XG5leHBvcnQgY29uc3QgaXRlbU1hcHBpbmcgPSB7XG4gIGNoZWNrZWQodmFsdWUpIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFtNZW51Q2hlY2tib3hJdGVtRGF0YUF0dHJpYnV0ZXMuY2hlY2tlZF06ICcnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgW01lbnVDaGVja2JveEl0ZW1EYXRhQXR0cmlidXRlcy51bmNoZWNrZWRdOiAnJ1xuICAgIH07XG4gIH0sXG4gIC4uLnRyYW5zaXRpb25TdGF0dXNNYXBwaW5nXG59OyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlQ29udHJvbGxlZCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUNvbnRyb2xsZWQnO1xuaW1wb3J0IHsgTWVudUNoZWNrYm94SXRlbUNvbnRleHQgfSBmcm9tIFwiLi9NZW51Q2hlY2tib3hJdGVtQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgUkVHVUxBUl9JVEVNLCB1c2VNZW51SXRlbSB9IGZyb20gXCIuLi9pdGVtL3VzZU1lbnVJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VDb21wb3NpdGVMaXN0SXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29tcG9zaXRlL2xpc3QvdXNlQ29tcG9zaXRlTGlzdEl0ZW0uanNcIjtcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyBpdGVtTWFwcGluZyB9IGZyb20gXCIuLi91dGlscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi4vcG9zaXRpb25lci9NZW51UG9zaXRpb25lckNvbnRleHQuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuLyoqXG4gKiBBIG1lbnUgaXRlbSB0aGF0IHRvZ2dsZXMgYSBzZXR0aW5nIG9uIG9yIG9mZi5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmV4cG9ydCBjb25zdCBNZW51Q2hlY2tib3hJdGVtID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudUNoZWNrYm94SXRlbShjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIGlkOiBpZFByb3AsXG4gICAgbGFiZWwsXG4gICAgbmF0aXZlQnV0dG9uID0gZmFsc2UsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgICBjbG9zZU9uQ2xpY2sgPSBmYWxzZSxcbiAgICBjaGVja2VkOiBjaGVja2VkUHJvcCxcbiAgICBkZWZhdWx0Q2hlY2tlZCxcbiAgICBvbkNoZWNrZWRDaGFuZ2UsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgbGlzdEl0ZW0gPSB1c2VDb21wb3NpdGVMaXN0SXRlbSh7XG4gICAgbGFiZWxcbiAgfSk7XG4gIGNvbnN0IG1lbnVQb3NpdGlvbmVyQ29udGV4dCA9IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCh0cnVlKTtcbiAgY29uc3QgaWQgPSB1c2VCYXNlVWlJZChpZFByb3ApO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZU1lbnVSb290Q29udGV4dCgpO1xuICBjb25zdCBoaWdobGlnaHRlZCA9IHN0b3JlLnVzZVN0YXRlKCdpc0FjdGl2ZScsIGxpc3RJdGVtLmluZGV4KTtcbiAgY29uc3QgaXRlbVByb3BzID0gc3RvcmUudXNlU3RhdGUoJ2l0ZW1Qcm9wcycpO1xuICBjb25zdCBbY2hlY2tlZCwgc2V0Q2hlY2tlZF0gPSB1c2VDb250cm9sbGVkKHtcbiAgICBjb250cm9sbGVkOiBjaGVja2VkUHJvcCxcbiAgICBkZWZhdWx0OiBkZWZhdWx0Q2hlY2tlZCA/PyBmYWxzZSxcbiAgICBuYW1lOiAnTWVudUNoZWNrYm94SXRlbScsXG4gICAgc3RhdGU6ICdjaGVja2VkJ1xuICB9KTtcbiAgY29uc3Qge1xuICAgIGdldEl0ZW1Qcm9wcyxcbiAgICBpdGVtUmVmXG4gIH0gPSB1c2VNZW51SXRlbSh7XG4gICAgY2xvc2VPbkNsaWNrLFxuICAgIGRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkLFxuICAgIGlkLFxuICAgIHN0b3JlLFxuICAgIG5hdGl2ZUJ1dHRvbixcbiAgICBub2RlSWQ6IG1lbnVQb3NpdGlvbmVyQ29udGV4dD8uY29udGV4dC5ub2RlSWQsXG4gICAgaXRlbU1ldGFkYXRhOiBSRUdVTEFSX0lURU1cbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkLFxuICAgIGNoZWNrZWRcbiAgfSksIFtkaXNhYmxlZCwgaGlnaGxpZ2h0ZWQsIGNoZWNrZWRdKTtcbiAgZnVuY3Rpb24gaGFuZGxlQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCBkZXRhaWxzID0gY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMuaXRlbVByZXNzLCBldmVudC5uYXRpdmVFdmVudCwgdW5kZWZpbmVkLCB7XG4gICAgICBwcmV2ZW50VW5tb3VudE9uQ2xvc2UoKSB7fVxuICAgIH0pO1xuICAgIG9uQ2hlY2tlZENoYW5nZT8uKCFjaGVja2VkLCBkZXRhaWxzKTtcbiAgICBpZiAoZGV0YWlscy5pc0NhbmNlbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldENoZWNrZWQoY3VycmVudGx5Q2hlY2tlZCA9PiAhY3VycmVudGx5Q2hlY2tlZCk7XG4gIH1cbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZzogaXRlbU1hcHBpbmcsXG4gICAgcHJvcHM6IFtpdGVtUHJvcHMsIHtcbiAgICAgIHJvbGU6ICdtZW51aXRlbWNoZWNrYm94JyxcbiAgICAgICdhcmlhLWNoZWNrZWQnOiBjaGVja2VkLFxuICAgICAgb25DbGljazogaGFuZGxlQ2xpY2tcbiAgICB9LCBlbGVtZW50UHJvcHMsIGdldEl0ZW1Qcm9wc10sXG4gICAgcmVmOiBbaXRlbVJlZiwgZm9yd2FyZGVkUmVmLCBsaXN0SXRlbS5yZWZdXG4gIH0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goTWVudUNoZWNrYm94SXRlbUNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogc3RhdGUsXG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVDaGVja2JveEl0ZW0uZGlzcGxheU5hbWUgPSBcIk1lbnVDaGVja2JveEl0ZW1cIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVDaGVja2JveEl0ZW1Db250ZXh0IH0gZnJvbSBcIi4uL2NoZWNrYm94LWl0ZW0vTWVudUNoZWNrYm94SXRlbUNvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IGl0ZW1NYXBwaW5nIH0gZnJvbSBcIi4uL3V0aWxzL3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVRyYW5zaXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVRyYW5zaXRpb25TdGF0dXMuanNcIjtcbmltcG9ydCB7IHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlT3BlbkNoYW5nZUNvbXBsZXRlLmpzXCI7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGNoZWNrYm94IGl0ZW0gaXMgdGlja2VkLlxuICogUmVuZGVycyBhIGA8c3Bhbj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmV4cG9ydCBjb25zdCBNZW51Q2hlY2tib3hJdGVtSW5kaWNhdG9yID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudUNoZWNrYm94SXRlbUluZGljYXRvcihjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGtlZXBNb3VudGVkID0gZmFsc2UsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgaXRlbSA9IHVzZU1lbnVDaGVja2JveEl0ZW1Db250ZXh0KCk7XG4gIGNvbnN0IGluZGljYXRvclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qge1xuICAgIHRyYW5zaXRpb25TdGF0dXMsXG4gICAgc2V0TW91bnRlZFxuICB9ID0gdXNlVHJhbnNpdGlvblN0YXR1cyhpdGVtLmNoZWNrZWQpO1xuICB1c2VPcGVuQ2hhbmdlQ29tcGxldGUoe1xuICAgIG9wZW46IGl0ZW0uY2hlY2tlZCxcbiAgICByZWY6IGluZGljYXRvclJlZixcbiAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgaWYgKCFpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgc2V0TW91bnRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgY2hlY2tlZDogaXRlbS5jaGVja2VkLFxuICAgIGRpc2FibGVkOiBpdGVtLmRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkOiBpdGVtLmhpZ2hsaWdodGVkLFxuICAgIHRyYW5zaXRpb25TdGF0dXNcbiAgfTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ3NwYW4nLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgaW5kaWNhdG9yUmVmXSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nOiBpdGVtTWFwcGluZyxcbiAgICBwcm9wczoge1xuICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgIC4uLmVsZW1lbnRQcm9wc1xuICAgIH0sXG4gICAgZW5hYmxlZDoga2VlcE1vdW50ZWQgfHwgaXRlbS5jaGVja2VkXG4gIH0pO1xuICByZXR1cm4gZWxlbWVudDtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgTWVudUNoZWNrYm94SXRlbUluZGljYXRvci5kaXNwbGF5TmFtZSA9IFwiTWVudUNoZWNrYm94SXRlbUluZGljYXRvclwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuZXhwb3J0IGNvbnN0IE1lbnVHcm91cENvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dCh1bmRlZmluZWQpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgTWVudUdyb3VwQ29udGV4dC5kaXNwbGF5TmFtZSA9IFwiTWVudUdyb3VwQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVHcm91cFJvb3RDb250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNZW51R3JvdXBDb250ZXh0KTtcbiAgaWYgKGNvbnRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogTWVudUdyb3VwQ29udGV4dCBpcyBtaXNzaW5nLiBNZW51IGdyb3VwIHBhcnRzIG11c3QgYmUgdXNlZCB3aXRoaW4gPE1lbnUuR3JvdXA+IG9yIDxNZW51LlJhZGlvR3JvdXA+LicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDMxKSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBNZW51R3JvdXBDb250ZXh0IH0gZnJvbSBcIi4vTWVudUdyb3VwQ29udGV4dC5qc1wiO1xuXG4vKipcbiAqIEdyb3VwcyByZWxhdGVkIG1lbnUgaXRlbXMgd2l0aCB0aGUgY29ycmVzcG9uZGluZyBsYWJlbC5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgTWVudUdyb3VwID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudUdyb3VwKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgW2xhYmVsSWQsIHNldExhYmVsSWRdID0gUmVhY3QudXNlU3RhdGUodW5kZWZpbmVkKTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IHtcbiAgICAgIHJvbGU6ICdncm91cCcsXG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogbGFiZWxJZCxcbiAgICAgIC4uLmVsZW1lbnRQcm9wc1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChNZW51R3JvdXBDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHNldExhYmVsSWQsXG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVHcm91cC5kaXNwbGF5TmFtZSA9IFwiTWVudUdyb3VwXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51R3JvdXBSb290Q29udGV4dCB9IGZyb20gXCIuLi9ncm91cC9NZW51R3JvdXBDb250ZXh0LmpzXCI7XG5cbi8qKlxuICogQW4gYWNjZXNzaWJsZSBsYWJlbCB0aGF0IGlzIGF1dG9tYXRpY2FsbHkgYXNzb2NpYXRlZCB3aXRoIGl0cyBwYXJlbnQgZ3JvdXAuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5leHBvcnQgY29uc3QgTWVudUdyb3VwTGFiZWwgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBNZW51R3JvdXBMYWJlbChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGlkOiBpZFByb3AsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgaWQgPSB1c2VCYXNlVWlJZChpZFByb3ApO1xuICBjb25zdCBzZXRMYWJlbElkID0gdXNlTWVudUdyb3VwUm9vdENvbnRleHQoKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzZXRMYWJlbElkKGlkKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgc2V0TGFiZWxJZCh1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sIFtzZXRMYWJlbElkLCBpZF0pO1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICByZWY6IGZvcndhcmRlZFJlZixcbiAgICBwcm9wczoge1xuICAgICAgaWQsXG4gICAgICByb2xlOiAncHJlc2VudGF0aW9uJyxcbiAgICAgIC4uLmVsZW1lbnRQcm9wc1xuICAgIH1cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVHcm91cExhYmVsLmRpc3BsYXlOYW1lID0gXCJNZW51R3JvdXBMYWJlbFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgUkVHVUxBUl9JVEVNLCB1c2VNZW51SXRlbSB9IGZyb20gXCIuL3VzZU1lbnVJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9NZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZUJhc2VVaUlkIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VCYXNlVWlJZC5qc1wiO1xuaW1wb3J0IHsgdXNlQ29tcG9zaXRlTGlzdEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9saXN0L3VzZUNvbXBvc2l0ZUxpc3RJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi4vcG9zaXRpb25lci9NZW51UG9zaXRpb25lckNvbnRleHQuanNcIjtcblxuLyoqXG4gKiBBbiBpbmRpdmlkdWFsIGludGVyYWN0aXZlIGl0ZW0gaW4gdGhlIG1lbnUuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5leHBvcnQgY29uc3QgTWVudUl0ZW0gPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBNZW51SXRlbShjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIGlkOiBpZFByb3AsXG4gICAgbGFiZWwsXG4gICAgbmF0aXZlQnV0dG9uID0gZmFsc2UsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgICBjbG9zZU9uQ2xpY2sgPSB0cnVlLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IGxpc3RJdGVtID0gdXNlQ29tcG9zaXRlTGlzdEl0ZW0oe1xuICAgIGxhYmVsXG4gIH0pO1xuICBjb25zdCBtZW51UG9zaXRpb25lckNvbnRleHQgPSB1c2VNZW51UG9zaXRpb25lckNvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IGlkID0gdXNlQmFzZVVpSWQoaWRQcm9wKTtcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VNZW51Um9vdENvbnRleHQoKTtcbiAgY29uc3QgaGlnaGxpZ2h0ZWQgPSBzdG9yZS51c2VTdGF0ZSgnaXNBY3RpdmUnLCBsaXN0SXRlbS5pbmRleCk7XG4gIGNvbnN0IGl0ZW1Qcm9wcyA9IHN0b3JlLnVzZVN0YXRlKCdpdGVtUHJvcHMnKTtcbiAgY29uc3Qge1xuICAgIGdldEl0ZW1Qcm9wcyxcbiAgICBpdGVtUmVmXG4gIH0gPSB1c2VNZW51SXRlbSh7XG4gICAgY2xvc2VPbkNsaWNrLFxuICAgIGRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkLFxuICAgIGlkLFxuICAgIHN0b3JlLFxuICAgIG5hdGl2ZUJ1dHRvbixcbiAgICBub2RlSWQ6IG1lbnVQb3NpdGlvbmVyQ29udGV4dD8uY29udGV4dC5ub2RlSWQsXG4gICAgaXRlbU1ldGFkYXRhOiBSRUdVTEFSX0lURU1cbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkXG4gIH07XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHByb3BzOiBbaXRlbVByb3BzLCBlbGVtZW50UHJvcHMsIGdldEl0ZW1Qcm9wc10sXG4gICAgcmVmOiBbaXRlbVJlZiwgZm9yd2FyZGVkUmVmLCBsaXN0SXRlbS5yZWZdXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51SXRlbS5kaXNwbGF5TmFtZSA9IFwiTWVudUl0ZW1cIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyB1c2VDb21wb3NpdGVMaXN0SXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29tcG9zaXRlL2xpc3QvdXNlQ29tcG9zaXRlTGlzdEl0ZW0uanNcIjtcbmltcG9ydCB7IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCB9IGZyb20gXCIuLi9wb3NpdGlvbmVyL01lbnVQb3NpdGlvbmVyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlTWVudUl0ZW1Db21tb25Qcm9wcyB9IGZyb20gXCIuLi9pdGVtL3VzZU1lbnVJdGVtQ29tbW9uUHJvcHMuanNcIjtcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHsgbWVyZ2VQcm9wcyB9IGZyb20gXCIuLi8uLi9tZXJnZS1wcm9wcy9pbmRleC5qc1wiO1xuXG4vKipcbiAqIEEgbGluayBpbiB0aGUgbWVudSB0aGF0IGNhbiBiZSB1c2VkIHRvIG5hdmlnYXRlIHRvIGEgZGlmZmVyZW50IHBhZ2Ugb3Igc2VjdGlvbi5cbiAqIFJlbmRlcnMgYW4gYDxhPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuZXhwb3J0IGNvbnN0IE1lbnVMaW5rSXRlbSA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIE1lbnVMaW5rSXRlbShjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIGlkOiBpZFByb3AsXG4gICAgbGFiZWwsXG4gICAgY2xvc2VPbkNsaWNrID0gZmFsc2UsXG4gICAgc3R5bGUsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3QgbGlua1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbGlzdEl0ZW0gPSB1c2VDb21wb3NpdGVMaXN0SXRlbSh7XG4gICAgbGFiZWxcbiAgfSk7XG4gIGNvbnN0IG1lbnVQb3NpdGlvbmVyQ29udGV4dCA9IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCh0cnVlKTtcbiAgY29uc3Qgbm9kZUlkID0gbWVudVBvc2l0aW9uZXJDb250ZXh0Py5jb250ZXh0Lm5vZGVJZDtcbiAgY29uc3QgaWQgPSB1c2VCYXNlVWlJZChpZFByb3ApO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZU1lbnVSb290Q29udGV4dCgpO1xuICBjb25zdCBoaWdobGlnaHRlZCA9IHN0b3JlLnVzZVN0YXRlKCdpc0FjdGl2ZScsIGxpc3RJdGVtLmluZGV4KTtcbiAgY29uc3QgaXRlbVByb3BzID0gc3RvcmUudXNlU3RhdGUoJ2l0ZW1Qcm9wcycpO1xuICBjb25zdCB0eXBpbmdSZWYgPSBzdG9yZS5jb250ZXh0LnR5cGluZ1JlZjtcbiAgY29uc3Qge1xuICAgIGdldEJ1dHRvblByb3BzLFxuICAgIGJ1dHRvblJlZlxuICB9ID0gdXNlQnV0dG9uKHtcbiAgICBuYXRpdmU6IGZhbHNlLFxuICAgIGNvbXBvc2l0ZTogdHJ1ZVxuICB9KTtcbiAgY29uc3QgY29tbW9uUHJvcHMgPSB1c2VNZW51SXRlbUNvbW1vblByb3BzKHtcbiAgICBjbG9zZU9uQ2xpY2ssXG4gICAgaGlnaGxpZ2h0ZWQsXG4gICAgaWQsXG4gICAgbm9kZUlkLFxuICAgIHN0b3JlLFxuICAgIHR5cGluZ1JlZixcbiAgICBpdGVtUmVmOiBsaW5rUmVmXG4gIH0pO1xuICBmdW5jdGlvbiBnZXRJdGVtUHJvcHMoZXh0ZXJuYWxQcm9wcykge1xuICAgIHJldHVybiBtZXJnZVByb3BzKGNvbW1vblByb3BzLCBleHRlcm5hbFByb3BzLCBnZXRCdXR0b25Qcm9wcyk7XG4gIH1cbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgaGlnaGxpZ2h0ZWRcbiAgfTtcbiAgcmV0dXJuIHVzZVJlbmRlckVsZW1lbnQoJ2EnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHByb3BzOiBbaXRlbVByb3BzLCBlbGVtZW50UHJvcHMsIGdldEl0ZW1Qcm9wc10sXG4gICAgcmVmOiBbbGlua1JlZiwgYnV0dG9uUmVmLCBmb3J3YXJkZWRSZWYsIGxpc3RJdGVtLnJlZl1cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVMaW5rSXRlbS5kaXNwbGF5TmFtZSA9IFwiTWVudUxpbmtJdGVtXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBGbG9hdGluZ0ZvY3VzTWFuYWdlciwgdXNlSG92ZXJGbG9hdGluZ0ludGVyYWN0aW9uIH0gZnJvbSBcIi4uLy4uL2Zsb2F0aW5nLXVpLXJlYWN0L2luZGV4LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9NZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCB9IGZyb20gXCIuLi9wb3NpdGlvbmVyL01lbnVQb3NpdGlvbmVyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgcG9wdXBTdGF0ZU1hcHBpbmcgYXMgYmFzZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VPcGVuQ2hhbmdlQ29tcGxldGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IHVzZVRvb2xiYXJSb290Q29udGV4dCB9IGZyb20gXCIuLi8uLi90b29sYmFyL3Jvb3QvVG9vbGJhclJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBDT01QT1NJVEVfS0VZUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29tcG9zaXRlL2NvbXBvc2l0ZS5qc1wiO1xuaW1wb3J0IHsgZ2V0RGlzYWJsZWRNb3VudFRyYW5zaXRpb25TdHlsZXMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZ2V0RGlzYWJsZWRNb3VudFRyYW5zaXRpb25TdHlsZXMuanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5jb25zdCBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nID0ge1xuICAuLi5iYXNlTWFwcGluZyxcbiAgLi4udHJhbnNpdGlvblN0YXR1c01hcHBpbmdcbn07XG5cbi8qKlxuICogQSBjb250YWluZXIgZm9yIHRoZSBtZW51IGl0ZW1zLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuZXhwb3J0IGNvbnN0IE1lbnVQb3B1cCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIE1lbnVQb3B1cChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGZpbmFsRm9jdXMsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VNZW51Um9vdENvbnRleHQoKTtcbiAgY29uc3Qge1xuICAgIHNpZGUsXG4gICAgYWxpZ25cbiAgfSA9IHVzZU1lbnVQb3NpdGlvbmVyQ29udGV4dCgpO1xuICBjb25zdCBpbnNpZGVUb29sYmFyID0gdXNlVG9vbGJhclJvb3RDb250ZXh0KHRydWUpICE9IG51bGw7XG4gIGNvbnN0IG9wZW4gPSBzdG9yZS51c2VTdGF0ZSgnb3BlbicpO1xuICBjb25zdCB0cmFuc2l0aW9uU3RhdHVzID0gc3RvcmUudXNlU3RhdGUoJ3RyYW5zaXRpb25TdGF0dXMnKTtcbiAgY29uc3QgcG9wdXBQcm9wcyA9IHN0b3JlLnVzZVN0YXRlKCdwb3B1cFByb3BzJyk7XG4gIGNvbnN0IG1vdW50ZWQgPSBzdG9yZS51c2VTdGF0ZSgnbW91bnRlZCcpO1xuICBjb25zdCBpbnN0YW50VHlwZSA9IHN0b3JlLnVzZVN0YXRlKCdpbnN0YW50VHlwZScpO1xuICBjb25zdCB0cmlnZ2VyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdhY3RpdmVUcmlnZ2VyRWxlbWVudCcpO1xuICBjb25zdCBwYXJlbnQgPSBzdG9yZS51c2VTdGF0ZSgncGFyZW50Jyk7XG4gIGNvbnN0IGxhc3RPcGVuQ2hhbmdlUmVhc29uID0gc3RvcmUudXNlU3RhdGUoJ2xhc3RPcGVuQ2hhbmdlUmVhc29uJyk7XG4gIGNvbnN0IHJvb3RJZCA9IHN0b3JlLnVzZVN0YXRlKCdyb290SWQnKTtcbiAgY29uc3QgZmxvYXRpbmdDb250ZXh0ID0gc3RvcmUudXNlU3RhdGUoJ2Zsb2F0aW5nUm9vdENvbnRleHQnKTtcbiAgY29uc3QgZmxvYXRpbmdUcmVlUm9vdCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1RyZWVSb290Jyk7XG4gIGNvbnN0IGNsb3NlRGVsYXkgPSBzdG9yZS51c2VTdGF0ZSgnY2xvc2VEZWxheScpO1xuICBjb25zdCBhY3RpdmVUcmlnZ2VyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdhY3RpdmVUcmlnZ2VyRWxlbWVudCcpO1xuICBjb25zdCBob3ZlckVuYWJsZWQgPSBzdG9yZS51c2VTdGF0ZSgnaG92ZXJFbmFibGVkJyk7XG4gIGNvbnN0IGRpc2FibGVkID0gc3RvcmUudXNlU3RhdGUoJ2Rpc2FibGVkJyk7XG4gIGNvbnN0IGlzQ29udGV4dE1lbnUgPSBwYXJlbnQudHlwZSA9PT0gJ2NvbnRleHQtbWVudSc7XG4gIHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSh7XG4gICAgb3BlbixcbiAgICByZWY6IHN0b3JlLmNvbnRleHQucG9wdXBSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgIHN0b3JlLmNvbnRleHQub25PcGVuQ2hhbmdlQ29tcGxldGU/Lih0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZ1bmN0aW9uIGhhbmRsZUNsb3NlKGV2ZW50KSB7XG4gICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoZXZlbnQucmVhc29uLCBldmVudC5kb21FdmVudCkpO1xuICAgIH1cbiAgICBmbG9hdGluZ1RyZWVSb290LmV2ZW50cy5vbignY2xvc2UnLCBoYW5kbGVDbG9zZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLm9mZignY2xvc2UnLCBoYW5kbGVDbG9zZSk7XG4gICAgfTtcbiAgfSwgW2Zsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLCBzdG9yZV0pO1xuICB1c2VIb3ZlckZsb2F0aW5nSW50ZXJhY3Rpb24oZmxvYXRpbmdDb250ZXh0LCB7XG4gICAgZW5hYmxlZDogaG92ZXJFbmFibGVkICYmICFkaXNhYmxlZCAmJiAhaXNDb250ZXh0TWVudSAmJiBwYXJlbnQudHlwZSAhPT0gJ21lbnViYXInLFxuICAgIGNsb3NlRGVsYXlcbiAgfSk7XG4gIGNvbnN0IHNldFBvcHVwRWxlbWVudCA9IFJlYWN0LnVzZUNhbGxiYWNrKGVsZW1lbnQgPT4ge1xuICAgIHN0b3JlLnNldCgncG9wdXBFbGVtZW50JywgZWxlbWVudCk7XG4gIH0sIFtzdG9yZV0pO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgIHNpZGUsXG4gICAgYWxpZ24sXG4gICAgb3BlbixcbiAgICBuZXN0ZWQ6IHBhcmVudC50eXBlID09PSAnbWVudScsXG4gICAgaW5zdGFudDogaW5zdGFudFR5cGVcbiAgfTtcbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCBzdG9yZS5jb250ZXh0LnBvcHVwUmVmLCBzZXRQb3B1cEVsZW1lbnRdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmcsXG4gICAgcHJvcHM6IFtwb3B1cFByb3BzLCB7XG4gICAgICBvbktleURvd24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGluc2lkZVRvb2xiYXIgJiYgQ09NUE9TSVRFX0tFWVMuaGFzKGV2ZW50LmtleSkpIHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIGdldERpc2FibGVkTW91bnRUcmFuc2l0aW9uU3R5bGVzKHRyYW5zaXRpb25TdGF0dXMpLCBlbGVtZW50UHJvcHMsIHtcbiAgICAgICdkYXRhLXJvb3Rvd25lcmlkJzogcm9vdElkXG4gICAgfV1cbiAgfSk7XG4gIGxldCByZXR1cm5Gb2N1cyA9IHBhcmVudC50eXBlID09PSB1bmRlZmluZWQgfHwgaXNDb250ZXh0TWVudTtcbiAgaWYgKHRyaWdnZXJFbGVtZW50IHx8IHBhcmVudC50eXBlID09PSAnbWVudWJhcicgJiYgbGFzdE9wZW5DaGFuZ2VSZWFzb24gIT09IFJFQVNPTlMub3V0c2lkZVByZXNzKSB7XG4gICAgcmV0dXJuRm9jdXMgPSB0cnVlO1xuICB9XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChGbG9hdGluZ0ZvY3VzTWFuYWdlciwge1xuICAgIGNvbnRleHQ6IGZsb2F0aW5nQ29udGV4dCxcbiAgICBtb2RhbDogaXNDb250ZXh0TWVudSxcbiAgICBkaXNhYmxlZDogIW1vdW50ZWQsXG4gICAgcmV0dXJuRm9jdXM6IGZpbmFsRm9jdXMgPT09IHVuZGVmaW5lZCA/IHJldHVybkZvY3VzIDogZmluYWxGb2N1cyxcbiAgICBpbml0aWFsRm9jdXM6IHBhcmVudC50eXBlICE9PSAnbWVudScsXG4gICAgcmVzdG9yZUZvY3VzOiB0cnVlLFxuICAgIGV4dGVybmFsVHJlZTogcGFyZW50LnR5cGUgIT09ICdtZW51YmFyJyA/IGZsb2F0aW5nVHJlZVJvb3QgOiB1bmRlZmluZWQsXG4gICAgcHJldmlvdXNGb2N1c2FibGVFbGVtZW50OiBhY3RpdmVUcmlnZ2VyRWxlbWVudCxcbiAgICBuZXh0Rm9jdXNhYmxlRWxlbWVudDogcGFyZW50LnR5cGUgPT09IHVuZGVmaW5lZCA/IHN0b3JlLmNvbnRleHQudHJpZ2dlckZvY3VzVGFyZ2V0UmVmIDogdW5kZWZpbmVkLFxuICAgIGJlZm9yZUNvbnRlbnRGb2N1c0d1YXJkUmVmOiBwYXJlbnQudHlwZSA9PT0gdW5kZWZpbmVkID8gc3RvcmUuY29udGV4dC5iZWZvcmVDb250ZW50Rm9jdXNHdWFyZFJlZiA6IHVuZGVmaW5lZCxcbiAgICBjaGlsZHJlbjogZWxlbWVudFxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgTWVudVBvcHVwLmRpc3BsYXlOYW1lID0gXCJNZW51UG9wdXBcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBNZW51UG9ydGFsQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51UG9ydGFsQ29udGV4dC5kaXNwbGF5TmFtZSA9IFwiTWVudVBvcnRhbENvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VNZW51UG9ydGFsQ29udGV4dCgpIHtcbiAgY29uc3QgdmFsdWUgPSBSZWFjdC51c2VDb250ZXh0KE1lbnVQb3J0YWxDb250ZXh0KTtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IDxNZW51LlBvcnRhbD4gaXMgbWlzc2luZy4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSgzMikpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEZsb2F0aW5nUG9ydGFsIH0gZnJvbSBcIi4uLy4uL2Zsb2F0aW5nLXVpLXJlYWN0L2luZGV4LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9NZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IE1lbnVQb3J0YWxDb250ZXh0IH0gZnJvbSBcIi4vTWVudVBvcnRhbENvbnRleHQuanNcIjtcblxuLyoqXG4gKiBBIHBvcnRhbCBlbGVtZW50IHRoYXQgbW92ZXMgdGhlIHBvcHVwIHRvIGEgZGlmZmVyZW50IHBhcnQgb2YgdGhlIERPTS5cbiAqIEJ5IGRlZmF1bHQsIHRoZSBwb3J0YWwgZWxlbWVudCBpcyBhcHBlbmRlZCB0byBgPGJvZHk+YC5cbiAqIFJlbmRlcnMgYSBgPGRpdj5gIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgTWVudVBvcnRhbCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIE1lbnVQb3J0YWwocHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAga2VlcE1vdW50ZWQgPSBmYWxzZSxcbiAgICAuLi5wb3J0YWxQcm9wc1xuICB9ID0gcHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlTWVudVJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IG1vdW50ZWQgPSBzdG9yZS51c2VTdGF0ZSgnbW91bnRlZCcpO1xuICBjb25zdCBzaG91bGRSZW5kZXIgPSBtb3VudGVkIHx8IGtlZXBNb3VudGVkO1xuICBpZiAoIXNob3VsZFJlbmRlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChNZW51UG9ydGFsQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBrZWVwTW91bnRlZCxcbiAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3goRmxvYXRpbmdQb3J0YWwsIHtcbiAgICAgIHJlZjogZm9yd2FyZGVkUmVmLFxuICAgICAgLi4ucG9ydGFsUHJvcHNcbiAgICB9KVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgTWVudVBvcnRhbC5kaXNwbGF5TmFtZSA9IFwiTWVudVBvcnRhbFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgaW5lcnRWYWx1ZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2luZXJ0VmFsdWUnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZVRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IEZsb2F0aW5nTm9kZSB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgTWVudVBvc2l0aW9uZXJDb250ZXh0IH0gZnJvbSBcIi4vTWVudVBvc2l0aW9uZXJDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vcm9vdC9NZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZUFuY2hvclBvc2l0aW9uaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3VzZUFuY2hvclBvc2l0aW9uaW5nLmpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVMaXN0IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb21wb3NpdGUvbGlzdC9Db21wb3NpdGVMaXN0LmpzXCI7XG5pbXBvcnQgeyBJbnRlcm5hbEJhY2tkcm9wIH0gZnJvbSBcIi4uLy4uL3V0aWxzL0ludGVybmFsQmFja2Ryb3AuanNcIjtcbmltcG9ydCB7IHVzZU1lbnVQb3J0YWxDb250ZXh0IH0gZnJvbSBcIi4uL3BvcnRhbC9NZW51UG9ydGFsQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgRFJPUERPV05fQ09MTElTSU9OX0FWT0lEQU5DRSwgUE9QVVBfQ09MTElTSU9OX0FWT0lEQU5DRSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29uc3RhbnRzLmpzXCI7XG5pbXBvcnQgeyB1c2VDb250ZXh0TWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2NvbnRleHQtbWVudS9yb290L0NvbnRleHRNZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyBhZGFwdGl2ZU9yaWdpbiB9IGZyb20gXCIuLi8uLi91dGlscy9hZGFwdGl2ZU9yaWdpbk1pZGRsZXdhcmUuanNcIjtcbmltcG9ydCB7IHVzZUFuaW1hdGlvbnNGaW5pc2hlZCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlQW5pbWF0aW9uc0ZpbmlzaGVkLmpzXCI7XG5pbXBvcnQgeyB1c2VQb3NpdGlvbmVyIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3VzZVBvc2l0aW9uZXIuanNcIjtcbmltcG9ydCB7IHVzZUFuY2hvcmVkUG9wdXBTY3JvbGxMb2NrIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3VzZUFuY2hvcmVkUG9wdXBTY3JvbGxMb2NrLmpzXCI7XG5cbi8qKlxuICogUG9zaXRpb25zIHRoZSBtZW51IHBvcHVwIGFnYWluc3QgdGhlIHRyaWdnZXIuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5pbXBvcnQgeyBqc3ggYXMgX2pzeCwganN4cyBhcyBfanN4cyB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZXhwb3J0IGNvbnN0IE1lbnVQb3NpdGlvbmVyID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudVBvc2l0aW9uZXIoY29tcG9uZW50UHJvcHMsIGZvcndhcmRlZFJlZikge1xuICBjb25zdCB7XG4gICAgYW5jaG9yOiBhbmNob3JQcm9wLFxuICAgIHBvc2l0aW9uTWV0aG9kOiBwb3NpdGlvbk1ldGhvZFByb3AgPSAnYWJzb2x1dGUnLFxuICAgIGNsYXNzTmFtZSxcbiAgICByZW5kZXIsXG4gICAgc2lkZSxcbiAgICBhbGlnbjogYWxpZ25Qcm9wLFxuICAgIHNpZGVPZmZzZXQ6IHNpZGVPZmZzZXRQcm9wID0gMCxcbiAgICBhbGlnbk9mZnNldDogYWxpZ25PZmZzZXRQcm9wID0gMCxcbiAgICBjb2xsaXNpb25Cb3VuZGFyeSA9ICdjbGlwcGluZy1hbmNlc3RvcnMnLFxuICAgIGNvbGxpc2lvblBhZGRpbmcgPSA1LFxuICAgIGFycm93UGFkZGluZyA9IDUsXG4gICAgc3RpY2t5ID0gZmFsc2UsXG4gICAgZGlzYWJsZUFuY2hvclRyYWNraW5nID0gZmFsc2UsXG4gICAgY29sbGlzaW9uQXZvaWRhbmNlOiBjb2xsaXNpb25Bdm9pZGFuY2VQcm9wID0gRFJPUERPV05fQ09MTElTSU9OX0FWT0lEQU5DRSxcbiAgICBzdHlsZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCB7XG4gICAgc3RvcmVcbiAgfSA9IHVzZU1lbnVSb290Q29udGV4dCgpO1xuICBjb25zdCBrZWVwTW91bnRlZCA9IHVzZU1lbnVQb3J0YWxDb250ZXh0KCk7XG4gIGNvbnN0IGNvbnRleHRNZW51Q29udGV4dCA9IHVzZUNvbnRleHRNZW51Um9vdENvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IHBhcmVudCA9IHN0b3JlLnVzZVN0YXRlKCdwYXJlbnQnKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IGZsb2F0aW5nVHJlZVJvb3QgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdUcmVlUm9vdCcpO1xuICBjb25zdCBtb3VudGVkID0gc3RvcmUudXNlU3RhdGUoJ21vdW50ZWQnKTtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IG1vZGFsID0gc3RvcmUudXNlU3RhdGUoJ21vZGFsJyk7XG4gIGNvbnN0IG9wZW5NZXRob2QgPSBzdG9yZS51c2VTdGF0ZSgnb3Blbk1ldGhvZCcpO1xuICBjb25zdCB0cmlnZ2VyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdhY3RpdmVUcmlnZ2VyRWxlbWVudCcpO1xuICBjb25zdCB0cmFuc2l0aW9uU3RhdHVzID0gc3RvcmUudXNlU3RhdGUoJ3RyYW5zaXRpb25TdGF0dXMnKTtcbiAgY29uc3QgcG9zaXRpb25lckVsZW1lbnQgPSBzdG9yZS51c2VTdGF0ZSgncG9zaXRpb25lckVsZW1lbnQnKTtcbiAgY29uc3QgaW5zdGFudFR5cGUgPSBzdG9yZS51c2VTdGF0ZSgnaW5zdGFudFR5cGUnKTtcbiAgY29uc3QgaGFzVmlld3BvcnQgPSBzdG9yZS51c2VTdGF0ZSgnaGFzVmlld3BvcnQnKTtcbiAgY29uc3QgbGFzdE9wZW5DaGFuZ2VSZWFzb24gPSBzdG9yZS51c2VTdGF0ZSgnbGFzdE9wZW5DaGFuZ2VSZWFzb24nKTtcbiAgY29uc3QgZmxvYXRpbmdOb2RlSWQgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdOb2RlSWQnKTtcbiAgY29uc3QgZmxvYXRpbmdQYXJlbnROb2RlSWQgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdQYXJlbnROb2RlSWQnKTtcbiAgY29uc3QgZG9tUmVmZXJlbmNlID0gZmxvYXRpbmdSb290Q29udGV4dC51c2VTdGF0ZSgnZG9tUmVmZXJlbmNlRWxlbWVudCcpO1xuICBjb25zdCBwcmV2aW91c1RyaWdnZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJ1bk9uY2VBbmltYXRpb25zRmluaXNoID0gdXNlQW5pbWF0aW9uc0ZpbmlzaGVkKHBvc2l0aW9uZXJFbGVtZW50LCBmYWxzZSwgZmFsc2UpO1xuICBsZXQgYW5jaG9yID0gYW5jaG9yUHJvcDtcbiAgbGV0IHNpZGVPZmZzZXQgPSBzaWRlT2Zmc2V0UHJvcDtcbiAgbGV0IGFsaWduT2Zmc2V0ID0gYWxpZ25PZmZzZXRQcm9wO1xuICBsZXQgYWxpZ24gPSBhbGlnblByb3A7XG4gIGxldCBjb2xsaXNpb25Bdm9pZGFuY2UgPSBjb2xsaXNpb25Bdm9pZGFuY2VQcm9wO1xuICBpZiAocGFyZW50LnR5cGUgPT09ICdjb250ZXh0LW1lbnUnKSB7XG4gICAgYW5jaG9yID0gYW5jaG9yUHJvcCA/PyBwYXJlbnQuY29udGV4dD8uYW5jaG9yO1xuICAgIGFsaWduID0gYWxpZ24gPz8gJ3N0YXJ0JztcbiAgICBpZiAoIXNpZGUgJiYgYWxpZ24gIT09ICdjZW50ZXInKSB7XG4gICAgICBhbGlnbk9mZnNldCA9IGNvbXBvbmVudFByb3BzLmFsaWduT2Zmc2V0ID8/IDI7XG4gICAgICBzaWRlT2Zmc2V0ID0gY29tcG9uZW50UHJvcHMuc2lkZU9mZnNldCA/PyAtNTtcbiAgICB9XG4gIH1cbiAgbGV0IGNvbXB1dGVkU2lkZSA9IHNpZGU7XG4gIGxldCBjb21wdXRlZEFsaWduID0gYWxpZ247XG4gIGlmIChwYXJlbnQudHlwZSA9PT0gJ21lbnUnKSB7XG4gICAgY29tcHV0ZWRTaWRlID0gY29tcHV0ZWRTaWRlID8/ICdpbmxpbmUtZW5kJztcbiAgICBjb21wdXRlZEFsaWduID0gY29tcHV0ZWRBbGlnbiA/PyAnc3RhcnQnO1xuICAgIGNvbGxpc2lvbkF2b2lkYW5jZSA9IGNvbXBvbmVudFByb3BzLmNvbGxpc2lvbkF2b2lkYW5jZSA/PyBQT1BVUF9DT0xMSVNJT05fQVZPSURBTkNFO1xuICB9IGVsc2UgaWYgKHBhcmVudC50eXBlID09PSAnbWVudWJhcicpIHtcbiAgICBjb21wdXRlZFNpZGUgPSBjb21wdXRlZFNpZGUgPz8gJ2JvdHRvbSc7XG4gICAgY29tcHV0ZWRBbGlnbiA9IGNvbXB1dGVkQWxpZ24gPz8gJ3N0YXJ0JztcbiAgfVxuICBjb25zdCBjb250ZXh0TWVudSA9IHBhcmVudC50eXBlID09PSAnY29udGV4dC1tZW51JztcbiAgY29uc3QgcG9zaXRpb25lciA9IHVzZUFuY2hvclBvc2l0aW9uaW5nKHtcbiAgICBhbmNob3IsXG4gICAgZmxvYXRpbmdSb290Q29udGV4dCxcbiAgICBwb3NpdGlvbk1ldGhvZDogY29udGV4dE1lbnVDb250ZXh0ID8gJ2ZpeGVkJyA6IHBvc2l0aW9uTWV0aG9kUHJvcCxcbiAgICBtb3VudGVkLFxuICAgIHNpZGU6IGNvbXB1dGVkU2lkZSxcbiAgICBzaWRlT2Zmc2V0LFxuICAgIGFsaWduOiBjb21wdXRlZEFsaWduLFxuICAgIGFsaWduT2Zmc2V0LFxuICAgIGFycm93UGFkZGluZzogY29udGV4dE1lbnUgPyAwIDogYXJyb3dQYWRkaW5nLFxuICAgIGNvbGxpc2lvbkJvdW5kYXJ5LFxuICAgIGNvbGxpc2lvblBhZGRpbmcsXG4gICAgc3RpY2t5LFxuICAgIG5vZGVJZDogZmxvYXRpbmdOb2RlSWQsXG4gICAga2VlcE1vdW50ZWQsXG4gICAgZGlzYWJsZUFuY2hvclRyYWNraW5nLFxuICAgIGNvbGxpc2lvbkF2b2lkYW5jZSxcbiAgICBzaGlmdENyb3NzQXhpczogY29udGV4dE1lbnUgJiYgISgnc2lkZScgaW4gY29sbGlzaW9uQXZvaWRhbmNlICYmIGNvbGxpc2lvbkF2b2lkYW5jZS5zaWRlID09PSAnZmxpcCcpLFxuICAgIGV4dGVybmFsVHJlZTogZmxvYXRpbmdUcmVlUm9vdCxcbiAgICBhZGFwdGl2ZU9yaWdpbjogaGFzVmlld3BvcnQgPyBhZGFwdGl2ZU9yaWdpbiA6IHVuZGVmaW5lZFxuICB9KTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBmdW5jdGlvbiBvbk1lbnVPcGVuQ2hhbmdlKGRldGFpbHMpIHtcbiAgICAgIGlmIChkZXRhaWxzLm9wZW4pIHtcbiAgICAgICAgaWYgKGRldGFpbHMucGFyZW50Tm9kZUlkID09PSBmbG9hdGluZ05vZGVJZCkge1xuICAgICAgICAgIHN0b3JlLnNldCgnaG92ZXJFbmFibGVkJywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZXRhaWxzLm5vZGVJZCAhPT0gZmxvYXRpbmdOb2RlSWQgJiYgZGV0YWlscy5wYXJlbnROb2RlSWQgPT09IHN0b3JlLnNlbGVjdCgnZmxvYXRpbmdQYXJlbnROb2RlSWQnKSkge1xuICAgICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnNpYmxpbmdPcGVuKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMub24oJ21lbnVvcGVuY2hhbmdlJywgb25NZW51T3BlbkNoYW5nZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLm9mZignbWVudW9wZW5jaGFuZ2UnLCBvbk1lbnVPcGVuQ2hhbmdlKTtcbiAgICB9O1xuICB9LCBbc3RvcmUsIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLCBmbG9hdGluZ05vZGVJZF0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChzdG9yZS5zZWxlY3QoJ2Zsb2F0aW5nUGFyZW50Tm9kZUlkJykgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25QYXJlbnRDbG9zZShkZXRhaWxzKSB7XG4gICAgICBpZiAoZGV0YWlscy5vcGVuIHx8IGRldGFpbHMubm9kZUlkICE9PSBzdG9yZS5zZWxlY3QoJ2Zsb2F0aW5nUGFyZW50Tm9kZUlkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVhc29uID0gZGV0YWlscy5yZWFzb24gPz8gUkVBU09OUy5zaWJsaW5nT3BlbjtcbiAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhyZWFzb24pKTtcbiAgICB9XG4gICAgZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMub24oJ21lbnVvcGVuY2hhbmdlJywgb25QYXJlbnRDbG9zZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLm9mZignbWVudW9wZW5jaGFuZ2UnLCBvblBhcmVudENsb3NlKTtcbiAgICB9O1xuICB9LCBbZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMsIHN0b3JlXSk7XG4gIGNvbnN0IGNsb3NlVGltZW91dCA9IHVzZVRpbWVvdXQoKTtcblxuICAvLyBDbGVhciBwZW5kaW5nIGNsb3NlIHRpbWVvdXQgd2hlbiB0aGUgbWVudSBjbG9zZXMuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICBjbG9zZVRpbWVvdXQuY2xlYXIoKTtcbiAgICB9XG4gIH0sIFtvcGVuLCBjbG9zZVRpbWVvdXRdKTtcblxuICAvLyBDbG9zZSB1bnJlbGF0ZWQgY2hpbGQgc3VibWVudXMgd2hlbiBob3ZlcmluZyBhIGRpZmZlcmVudCBpdGVtIGluIHRoZSBwYXJlbnQgbWVudS5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBmdW5jdGlvbiBvbkl0ZW1Ib3ZlcihldmVudCkge1xuICAgICAgLy8gSWYgYW4gaXRlbSB3aXRoaW4gb3VyIHBhcmVudCBtZW51IGlzIGhvdmVyZWQsIGFuZCB0aGlzIG1lbnUncyB0cmlnZ2VyIGlzIG5vdCB0aGF0IGl0ZW0sXG4gICAgICAvLyBjbG9zZSB0aGlzIHN1Ym1lbnUuIFRoaXMgZW5zdXJlcyBob3ZlcmluZyBhIGRpZmZlcmVudCBpdGVtIGluIHRoZSBwYXJlbnQgY2xvc2VzIG90aGVyIGJyYW5jaGVzLlxuICAgICAgaWYgKCFvcGVuIHx8IGV2ZW50Lm5vZGVJZCAhPT0gc3RvcmUuc2VsZWN0KCdmbG9hdGluZ1BhcmVudE5vZGVJZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudC50YXJnZXQgJiYgdHJpZ2dlckVsZW1lbnQgJiYgdHJpZ2dlckVsZW1lbnQgIT09IGV2ZW50LnRhcmdldCkge1xuICAgICAgICBjb25zdCBkZWxheSA9IHN0b3JlLnNlbGVjdCgnY2xvc2VEZWxheScpO1xuICAgICAgICBpZiAoZGVsYXkgPiAwKSB7XG4gICAgICAgICAgaWYgKCFjbG9zZVRpbWVvdXQuaXNTdGFydGVkKCkpIHtcbiAgICAgICAgICAgIGNsb3NlVGltZW91dC5zdGFydChkZWxheSwgKCkgPT4ge1xuICAgICAgICAgICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5zaWJsaW5nT3BlbikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLnNpYmxpbmdPcGVuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFVzZXIgcmUtaG92ZXJlZCB0aGUgc3VibWVudSB0cmlnZ2VyLCBjYW5jZWwgcGVuZGluZyBjbG9zZS5cbiAgICAgICAgY2xvc2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLm9uKCdpdGVtaG92ZXInLCBvbkl0ZW1Ib3Zlcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZsb2F0aW5nVHJlZVJvb3QuZXZlbnRzLm9mZignaXRlbWhvdmVyJywgb25JdGVtSG92ZXIpO1xuICAgIH07XG4gIH0sIFtmbG9hdGluZ1RyZWVSb290LmV2ZW50cywgb3BlbiwgdHJpZ2dlckVsZW1lbnQsIHN0b3JlLCBjbG9zZVRpbWVvdXRdKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBldmVudERldGFpbHMgPSB7XG4gICAgICBvcGVuLFxuICAgICAgbm9kZUlkOiBmbG9hdGluZ05vZGVJZCxcbiAgICAgIHBhcmVudE5vZGVJZDogZmxvYXRpbmdQYXJlbnROb2RlSWQsXG4gICAgICByZWFzb246IHN0b3JlLnNlbGVjdCgnbGFzdE9wZW5DaGFuZ2VSZWFzb24nKVxuICAgIH07XG4gICAgZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMuZW1pdCgnbWVudW9wZW5jaGFuZ2UnLCBldmVudERldGFpbHMpO1xuICB9LCBbZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMsIG9wZW4sIHN0b3JlLCBmbG9hdGluZ05vZGVJZCwgZmxvYXRpbmdQYXJlbnROb2RlSWRdKTtcblxuICAvLyBLZWVwIHBvc2l0aW9uZXIgdHJhbnNpdGlvbiBiZWhhdmlvciBhbGlnbmVkIHdpdGggUG9wb3ZlciB3aGVuIHN3aXRjaGluZyBkZXRhY2hlZCB0cmlnZ2Vycy5cbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBjdXJyZW50VHJpZ2dlciA9IGRvbVJlZmVyZW5jZTtcbiAgICBjb25zdCBwcmV2aW91c1RyaWdnZXIgPSBwcmV2aW91c1RyaWdnZXJSZWYuY3VycmVudDtcbiAgICBpZiAoY3VycmVudFRyaWdnZXIpIHtcbiAgICAgIHByZXZpb3VzVHJpZ2dlclJlZi5jdXJyZW50ID0gY3VycmVudFRyaWdnZXI7XG4gICAgfVxuICAgIGlmIChwcmV2aW91c1RyaWdnZXIgJiYgY3VycmVudFRyaWdnZXIgJiYgY3VycmVudFRyaWdnZXIgIT09IHByZXZpb3VzVHJpZ2dlcikge1xuICAgICAgc3RvcmUuc2V0KCdpbnN0YW50VHlwZScsIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgICBydW5PbmNlQW5pbWF0aW9uc0ZpbmlzaCgoKSA9PiB7XG4gICAgICAgIHN0b3JlLnNldCgnaW5zdGFudFR5cGUnLCAndHJpZ2dlci1jaGFuZ2UnKTtcbiAgICAgIH0sIGFib3J0Q29udHJvbGxlci5zaWduYWwpO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9LCBbZG9tUmVmZXJlbmNlLCBydW5PbmNlQW5pbWF0aW9uc0ZpbmlzaCwgc3RvcmVdKTtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgb3BlbixcbiAgICBzaWRlOiBwb3NpdGlvbmVyLnNpZGUsXG4gICAgYWxpZ246IHBvc2l0aW9uZXIuYWxpZ24sXG4gICAgYW5jaG9ySGlkZGVuOiBwb3NpdGlvbmVyLmFuY2hvckhpZGRlbixcbiAgICBuZXN0ZWQ6IHBhcmVudC50eXBlID09PSAnbWVudScsXG4gICAgaW5zdGFudDogaW5zdGFudFR5cGVcbiAgfTtcbiAgY29uc3QgbWVudWJhck1vZGFsID0gcGFyZW50LnR5cGUgPT09ICdtZW51YmFyJyAmJiBwYXJlbnQuY29udGV4dC5tb2RhbDtcbiAgY29uc3QgcG9wdXBNb2RhbCA9IG1vZGFsICYmIGxhc3RPcGVuQ2hhbmdlUmVhc29uICE9PSBSRUFTT05TLnRyaWdnZXJIb3ZlcjtcbiAgdXNlQW5jaG9yZWRQb3B1cFNjcm9sbExvY2sob3BlbiAmJiAobWVudWJhck1vZGFsIHx8IHBvcHVwTW9kYWwpLCBvcGVuTWV0aG9kID09PSAndG91Y2gnLCBwb3NpdGlvbmVyRWxlbWVudCwgdHJpZ2dlckVsZW1lbnQpO1xuICBjb25zdCBlbGVtZW50ID0gdXNlUG9zaXRpb25lcihjb21wb25lbnRQcm9wcywgc3RhdGUsIHtcbiAgICBzdHlsZXM6IHBvc2l0aW9uZXIucG9zaXRpb25lclN0eWxlcyxcbiAgICB0cmFuc2l0aW9uU3RhdHVzLFxuICAgIHByb3BzOiBlbGVtZW50UHJvcHMsXG4gICAgcmVmczogW2ZvcndhcmRlZFJlZiwgc3RvcmUudXNlU3RhdGVTZXR0ZXIoJ3Bvc2l0aW9uZXJFbGVtZW50JyldLFxuICAgIGhpZGRlbjogIW1vdW50ZWQsXG4gICAgaW5lcnQ6ICFvcGVuXG4gIH0pO1xuICBjb25zdCBzaG91bGRSZW5kZXJCYWNrZHJvcCA9IG1vdW50ZWQgJiYgcGFyZW50LnR5cGUgIT09ICdtZW51JyAmJiAocGFyZW50LnR5cGUgIT09ICdtZW51YmFyJyAmJiBtb2RhbCAmJiBsYXN0T3BlbkNoYW5nZVJlYXNvbiAhPT0gUkVBU09OUy50cmlnZ2VySG92ZXIgfHwgcGFyZW50LnR5cGUgPT09ICdtZW51YmFyJyAmJiBwYXJlbnQuY29udGV4dC5tb2RhbCk7XG5cbiAgLy8gY3V0cyBhIGhvbGUgaW4gdGhlIGJhY2tkcm9wIHRvIGFsbG93IHBvaW50ZXIgaW50ZXJhY3Rpb24gd2l0aCB0aGUgbWVudWJhciBvciBkcm9wZG93biBtZW51IHRyaWdnZXIgZWxlbWVudFxuICBsZXQgYmFja2Ryb3BDdXRvdXQgPSBudWxsO1xuICBpZiAocGFyZW50LnR5cGUgPT09ICdtZW51YmFyJykge1xuICAgIGJhY2tkcm9wQ3V0b3V0ID0gcGFyZW50LmNvbnRleHQuY29udGVudEVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAocGFyZW50LnR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIGJhY2tkcm9wQ3V0b3V0ID0gdHJpZ2dlckVsZW1lbnQ7XG4gIH1cbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4cyhNZW51UG9zaXRpb25lckNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogcG9zaXRpb25lcixcbiAgICBjaGlsZHJlbjogW3Nob3VsZFJlbmRlckJhY2tkcm9wICYmIC8qI19fUFVSRV9fKi9fanN4KEludGVybmFsQmFja2Ryb3AsIHtcbiAgICAgIHJlZjogcGFyZW50LnR5cGUgPT09ICdjb250ZXh0LW1lbnUnIHx8IHBhcmVudC50eXBlID09PSAnbmVzdGVkLWNvbnRleHQtbWVudScgPyBwYXJlbnQuY29udGV4dC5pbnRlcm5hbEJhY2tkcm9wUmVmIDogbnVsbCxcbiAgICAgIGluZXJ0OiBpbmVydFZhbHVlKCFvcGVuKSxcbiAgICAgIGN1dG91dDogYmFja2Ryb3BDdXRvdXRcbiAgICB9KSwgLyojX19QVVJFX18qL19qc3goRmxvYXRpbmdOb2RlLCB7XG4gICAgICBpZDogZmxvYXRpbmdOb2RlSWQsXG4gICAgICBjaGlsZHJlbjogLyojX19QVVJFX18qL19qc3goQ29tcG9zaXRlTGlzdCwge1xuICAgICAgICBlbGVtZW50c1JlZjogc3RvcmUuY29udGV4dC5pdGVtRG9tRWxlbWVudHMsXG4gICAgICAgIGxhYmVsc1JlZjogc3RvcmUuY29udGV4dC5pdGVtTGFiZWxzLFxuICAgICAgICBjaGlsZHJlbjogZWxlbWVudFxuICAgICAgfSlcbiAgICB9KV1cbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVQb3NpdGlvbmVyLmRpc3BsYXlOYW1lID0gXCJNZW51UG9zaXRpb25lclwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuZXhwb3J0IGNvbnN0IE1lbnVSYWRpb0dyb3VwQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51UmFkaW9Hcm91cENvbnRleHQuZGlzcGxheU5hbWUgPSBcIk1lbnVSYWRpb0dyb3VwQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVSYWRpb0dyb3VwQ29udGV4dCgpIHtcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoTWVudVJhZGlvR3JvdXBDb250ZXh0KTtcbiAgaWYgKGNvbnRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogTWVudVJhZGlvR3JvdXBDb250ZXh0IGlzIG1pc3NpbmcuIE1lbnVSYWRpb0dyb3VwIHBhcnRzIG11c3QgYmUgcGxhY2VkIHdpdGhpbiA8TWVudS5SYWRpb0dyb3VwPi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSgzNCkpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlQ29udHJvbGxlZCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUNvbnRyb2xsZWQnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBNZW51UmFkaW9Hcm91cENvbnRleHQgfSBmcm9tIFwiLi9NZW51UmFkaW9Hcm91cENvbnRleHQuanNcIjtcbmltcG9ydCB7IE1lbnVHcm91cENvbnRleHQgfSBmcm9tIFwiLi4vZ3JvdXAvTWVudUdyb3VwQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsganN4IGFzIF9qc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbi8qKlxuICogR3JvdXBzIHJlbGF0ZWQgcmFkaW8gaXRlbXMuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5leHBvcnQgY29uc3QgTWVudVJhZGlvR3JvdXAgPSAvKiNfX1BVUkVfXyovUmVhY3QubWVtbygvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBNZW51UmFkaW9Hcm91cChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHZhbHVlOiB2YWx1ZVByb3AsXG4gICAgZGVmYXVsdFZhbHVlLFxuICAgIG9uVmFsdWVDaGFuZ2U6IG9uVmFsdWVDaGFuZ2VQcm9wLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgc3R5bGUsXG4gICAgJ2FyaWEtbGFiZWxsZWRieSc6IGFyaWFMYWJlbGxlZEJ5UHJvcCxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCBbbGFiZWxJZCwgc2V0TGFiZWxJZF0gPSBSZWFjdC51c2VTdGF0ZSh1bmRlZmluZWQpO1xuICBjb25zdCBbdmFsdWUsIHNldFZhbHVlVW53cmFwcGVkXSA9IHVzZUNvbnRyb2xsZWQoe1xuICAgIGNvbnRyb2xsZWQ6IHZhbHVlUHJvcCxcbiAgICBkZWZhdWx0OiBkZWZhdWx0VmFsdWUsXG4gICAgbmFtZTogJ01lbnVSYWRpb0dyb3VwJ1xuICB9KTtcbiAgY29uc3Qgc2V0VmFsdWUgPSB1c2VTdGFibGVDYWxsYmFjaygobmV3VmFsdWUsIGV2ZW50RGV0YWlscykgPT4ge1xuICAgIG9uVmFsdWVDaGFuZ2VQcm9wPy4obmV3VmFsdWUsIGV2ZW50RGV0YWlscyk7XG4gICAgaWYgKGV2ZW50RGV0YWlscy5pc0NhbmNlbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldFZhbHVlVW53cmFwcGVkKG5ld1ZhbHVlKTtcbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGRpc2FibGVkXG4gIH07XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHJlZjogZm9yd2FyZGVkUmVmLFxuICAgIHByb3BzOiB7XG4gICAgICByb2xlOiAnZ3JvdXAnLFxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGFyaWFMYWJlbGxlZEJ5UHJvcCA/PyBsYWJlbElkLFxuICAgICAgJ2FyaWEtZGlzYWJsZWQnOiBkaXNhYmxlZCB8fCB1bmRlZmluZWQsXG4gICAgICAuLi5lbGVtZW50UHJvcHNcbiAgICB9XG4gIH0pO1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIHZhbHVlLFxuICAgIHNldFZhbHVlLFxuICAgIGRpc2FibGVkXG4gIH0pLCBbdmFsdWUsIHNldFZhbHVlLCBkaXNhYmxlZF0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goTWVudUdyb3VwQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBzZXRMYWJlbElkLFxuICAgIGNoaWxkcmVuOiAvKiNfX1BVUkVfXyovX2pzeChNZW51UmFkaW9Hcm91cENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICAgIHZhbHVlOiBjb250ZXh0LFxuICAgICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgICB9KVxuICB9KTtcbn0pKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVSYWRpb0dyb3VwLmRpc3BsYXlOYW1lID0gXCJNZW51UmFkaW9Hcm91cFwiOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuZXhwb3J0IGNvbnN0IE1lbnVSYWRpb0l0ZW1Db250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQodW5kZWZpbmVkKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVSYWRpb0l0ZW1Db250ZXh0LmRpc3BsYXlOYW1lID0gXCJNZW51UmFkaW9JdGVtQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnVSYWRpb0l0ZW1Db250ZXh0KCkge1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNZW51UmFkaW9JdGVtQ29udGV4dCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IE1lbnVSYWRpb0l0ZW1Db250ZXh0IGlzIG1pc3NpbmcuIE1lbnVSYWRpb0l0ZW0gcGFydHMgbXVzdCBiZSBwbGFjZWQgd2l0aGluIDxNZW51LlJhZGlvSXRlbT4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoMzUpKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlUmVuZGVyRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlUmVuZGVyRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51UmFkaW9Hcm91cENvbnRleHQgfSBmcm9tIFwiLi4vcmFkaW8tZ3JvdXAvTWVudVJhZGlvR3JvdXBDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBNZW51UmFkaW9JdGVtQ29udGV4dCB9IGZyb20gXCIuL01lbnVSYWRpb0l0ZW1Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyBpdGVtTWFwcGluZyB9IGZyb20gXCIuLi91dGlscy9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VDb21wb3NpdGVMaXN0SXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29tcG9zaXRlL2xpc3QvdXNlQ29tcG9zaXRlTGlzdEl0ZW0uanNcIjtcbmltcG9ydCB7IFJFR1VMQVJfSVRFTSwgdXNlTWVudUl0ZW0gfSBmcm9tIFwiLi4vaXRlbS91c2VNZW51SXRlbS5qc1wiO1xuaW1wb3J0IHsgdXNlTWVudVBvc2l0aW9uZXJDb250ZXh0IH0gZnJvbSBcIi4uL3Bvc2l0aW9uZXIvTWVudVBvc2l0aW9uZXJDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuXG4vKipcbiAqIEEgbWVudSBpdGVtIHRoYXQgd29ya3MgbGlrZSBhIHJhZGlvIGJ1dHRvbiBpbiBhIGdpdmVuIGdyb3VwLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuaW1wb3J0IHsganN4IGFzIF9qc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmV4cG9ydCBjb25zdCBNZW51UmFkaW9JdGVtID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudVJhZGlvSXRlbShjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIGlkOiBpZFByb3AsXG4gICAgbGFiZWwsXG4gICAgbmF0aXZlQnV0dG9uID0gZmFsc2UsXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkUHJvcCA9IGZhbHNlLFxuICAgIGNsb3NlT25DbGljayA9IGZhbHNlLFxuICAgIHZhbHVlLFxuICAgIHN0eWxlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IGxpc3RJdGVtID0gdXNlQ29tcG9zaXRlTGlzdEl0ZW0oe1xuICAgIGxhYmVsXG4gIH0pO1xuICBjb25zdCBtZW51UG9zaXRpb25lckNvbnRleHQgPSB1c2VNZW51UG9zaXRpb25lckNvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IGlkID0gdXNlQmFzZVVpSWQoaWRQcm9wKTtcbiAgY29uc3Qge1xuICAgIHN0b3JlXG4gIH0gPSB1c2VNZW51Um9vdENvbnRleHQoKTtcbiAgY29uc3QgaGlnaGxpZ2h0ZWQgPSBzdG9yZS51c2VTdGF0ZSgnaXNBY3RpdmUnLCBsaXN0SXRlbS5pbmRleCk7XG4gIGNvbnN0IGl0ZW1Qcm9wcyA9IHN0b3JlLnVzZVN0YXRlKCdpdGVtUHJvcHMnKTtcbiAgY29uc3Qge1xuICAgIHZhbHVlOiBzZWxlY3RlZFZhbHVlLFxuICAgIHNldFZhbHVlOiBzZXRTZWxlY3RlZFZhbHVlLFxuICAgIGRpc2FibGVkOiBncm91cERpc2FibGVkXG4gIH0gPSB1c2VNZW51UmFkaW9Hcm91cENvbnRleHQoKTtcbiAgY29uc3QgZGlzYWJsZWQgPSBncm91cERpc2FibGVkIHx8IGRpc2FibGVkUHJvcDtcbiAgY29uc3QgY2hlY2tlZCA9IHNlbGVjdGVkVmFsdWUgPT09IHZhbHVlO1xuICBjb25zdCB7XG4gICAgZ2V0SXRlbVByb3BzLFxuICAgIGl0ZW1SZWZcbiAgfSA9IHVzZU1lbnVJdGVtKHtcbiAgICBjbG9zZU9uQ2xpY2ssXG4gICAgZGlzYWJsZWQsXG4gICAgaGlnaGxpZ2h0ZWQsXG4gICAgaWQsXG4gICAgc3RvcmUsXG4gICAgbmF0aXZlQnV0dG9uLFxuICAgIG5vZGVJZDogbWVudVBvc2l0aW9uZXJDb250ZXh0Py5jb250ZXh0Lm5vZGVJZCxcbiAgICBpdGVtTWV0YWRhdGE6IFJFR1VMQVJfSVRFTVxuICB9KTtcbiAgY29uc3Qgc3RhdGUgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgZGlzYWJsZWQsXG4gICAgaGlnaGxpZ2h0ZWQsXG4gICAgY2hlY2tlZFxuICB9KSwgW2Rpc2FibGVkLCBoaWdobGlnaHRlZCwgY2hlY2tlZF0pO1xuICBmdW5jdGlvbiBoYW5kbGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IGRldGFpbHMgPSBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5pdGVtUHJlc3MsIGV2ZW50Lm5hdGl2ZUV2ZW50LCB1bmRlZmluZWQsIHtcbiAgICAgIHByZXZlbnRVbm1vdW50T25DbG9zZSgpIHt9XG4gICAgfSk7XG4gICAgc2V0U2VsZWN0ZWRWYWx1ZSh2YWx1ZSwgZGV0YWlscyk7XG4gIH1cbiAgY29uc3QgZWxlbWVudCA9IHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZzogaXRlbU1hcHBpbmcsXG4gICAgcHJvcHM6IFtpdGVtUHJvcHMsIHtcbiAgICAgIHJvbGU6ICdtZW51aXRlbXJhZGlvJyxcbiAgICAgICdhcmlhLWNoZWNrZWQnOiBjaGVja2VkLFxuICAgICAgb25DbGljazogaGFuZGxlQ2xpY2tcbiAgICB9LCBlbGVtZW50UHJvcHMsIGdldEl0ZW1Qcm9wc10sXG4gICAgcmVmOiBbaXRlbVJlZiwgZm9yd2FyZGVkUmVmLCBsaXN0SXRlbS5yZWZdXG4gIH0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3goTWVudVJhZGlvSXRlbUNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogc3RhdGUsXG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVSYWRpb0l0ZW0uZGlzcGxheU5hbWUgPSBcIk1lbnVSYWRpb0l0ZW1cIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU1lbnVSYWRpb0l0ZW1Db250ZXh0IH0gZnJvbSBcIi4uL3JhZGlvLWl0ZW0vTWVudVJhZGlvSXRlbUNvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IGl0ZW1NYXBwaW5nIH0gZnJvbSBcIi4uL3V0aWxzL3N0YXRlQXR0cmlidXRlc01hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVRyYW5zaXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVRyYW5zaXRpb25TdGF0dXMuanNcIjtcbmltcG9ydCB7IHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlT3BlbkNoYW5nZUNvbXBsZXRlLmpzXCI7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIHJhZGlvIGl0ZW0gaXMgc2VsZWN0ZWQuXG4gKiBSZW5kZXJzIGEgYDxzcGFuPmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuZXhwb3J0IGNvbnN0IE1lbnVSYWRpb0l0ZW1JbmRpY2F0b3IgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBNZW51UmFkaW9JdGVtSW5kaWNhdG9yKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAga2VlcE1vdW50ZWQgPSBmYWxzZSxcbiAgICAuLi5lbGVtZW50UHJvcHNcbiAgfSA9IGNvbXBvbmVudFByb3BzO1xuICBjb25zdCBpdGVtID0gdXNlTWVudVJhZGlvSXRlbUNvbnRleHQoKTtcbiAgY29uc3QgaW5kaWNhdG9yUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB7XG4gICAgdHJhbnNpdGlvblN0YXR1cyxcbiAgICBzZXRNb3VudGVkXG4gIH0gPSB1c2VUcmFuc2l0aW9uU3RhdHVzKGl0ZW0uY2hlY2tlZCk7XG4gIHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSh7XG4gICAgb3BlbjogaXRlbS5jaGVja2VkLFxuICAgIHJlZjogaW5kaWNhdG9yUmVmLFxuICAgIG9uQ29tcGxldGUoKSB7XG4gICAgICBpZiAoIWl0ZW0uY2hlY2tlZCkge1xuICAgICAgICBzZXRNb3VudGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBjaGVja2VkOiBpdGVtLmNoZWNrZWQsXG4gICAgZGlzYWJsZWQ6IGl0ZW0uZGlzYWJsZWQsXG4gICAgaGlnaGxpZ2h0ZWQ6IGl0ZW0uaGlnaGxpZ2h0ZWQsXG4gICAgdHJhbnNpdGlvblN0YXR1c1xuICB9O1xuICBjb25zdCBlbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnc3BhbicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZzogaXRlbU1hcHBpbmcsXG4gICAgcmVmOiBbZm9yd2FyZGVkUmVmLCBpbmRpY2F0b3JSZWZdLFxuICAgIHByb3BzOiB7XG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgLi4uZWxlbWVudFByb3BzXG4gICAgfSxcbiAgICBlbmFibGVkOiBrZWVwTW91bnRlZCB8fCBpdGVtLmNoZWNrZWRcbiAgfSk7XG4gIHJldHVybiBlbGVtZW50O1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51UmFkaW9JdGVtSW5kaWNhdG9yLmRpc3BsYXlOYW1lID0gXCJNZW51UmFkaW9JdGVtSW5kaWNhdG9yXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgTWVudWJhckNvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dChudWxsKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnViYXJDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJNZW51YmFyQ29udGV4dFwiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1lbnViYXJDb250ZXh0KG9wdGlvbmFsKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1lbnViYXJDb250ZXh0KTtcbiAgaWYgKGNvbnRleHQgPT09IG51bGwgJiYgIW9wdGlvbmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiBNZW51YmFyQ29udGV4dCBpcyBtaXNzaW5nLiBNZW51YmFyIHBhcnRzIG11c3QgYmUgcGxhY2VkIHdpdGhpbiA8TWVudWJhcj4uJyA6IF9mb3JtYXRFcnJvck1lc3NhZ2UoNSkpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufSIsImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNyZWF0ZVNlbGVjdG9yLCBSZWFjdFN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgRU1QVFlfT0JKRUNUIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZW1wdHknO1xuaW1wb3J0IHsgdXNlUmVmV2l0aEluaXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VSZWZXaXRoSW5pdCc7XG5pbXBvcnQgeyBGbG9hdGluZ1RyZWVTdG9yZSB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9jb21wb25lbnRzL0Zsb2F0aW5nVHJlZVN0b3JlLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVJbml0aWFsUG9wdXBTdG9yZVN0YXRlLCBwb3B1cFN0b3JlU2VsZWN0b3JzLCBQb3B1cFRyaWdnZXJNYXAgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBzL2luZGV4LmpzXCI7XG5jb25zdCBzZWxlY3RvcnMgPSB7XG4gIC4uLnBvcHVwU3RvcmVTZWxlY3RvcnMsXG4gIGRpc2FibGVkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5wYXJlbnQudHlwZSA9PT0gJ21lbnViYXInID8gc3RhdGUucGFyZW50LmNvbnRleHQuZGlzYWJsZWQgfHwgc3RhdGUuZGlzYWJsZWQgOiBzdGF0ZS5kaXNhYmxlZCksXG4gIG1vZGFsOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiAoc3RhdGUucGFyZW50LnR5cGUgPT09IHVuZGVmaW5lZCB8fCBzdGF0ZS5wYXJlbnQudHlwZSA9PT0gJ2NvbnRleHQtbWVudScpICYmIChzdGF0ZS5tb2RhbCA/PyB0cnVlKSksXG4gIG9wZW5NZXRob2Q6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLm9wZW5NZXRob2QpLFxuICBhbGxvd01vdXNlRW50ZXI6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmFsbG93TW91c2VFbnRlciksXG4gIHN0aWNrSWZPcGVuOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5zdGlja0lmT3BlbiksXG4gIHBhcmVudDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUucGFyZW50KSxcbiAgcm9vdElkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiB7XG4gICAgaWYgKHN0YXRlLnBhcmVudC50eXBlID09PSAnbWVudScpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5wYXJlbnQuc3RvcmUuc2VsZWN0KCdyb290SWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlLnBhcmVudC50eXBlICE9PSB1bmRlZmluZWQgPyBzdGF0ZS5wYXJlbnQuY29udGV4dC5yb290SWQgOiBzdGF0ZS5yb290SWQ7XG4gIH0pLFxuICBhY3RpdmVJbmRleDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuYWN0aXZlSW5kZXgpLFxuICBpc0FjdGl2ZTogY3JlYXRlU2VsZWN0b3IoKHN0YXRlLCBpdGVtSW5kZXgpID0+IHN0YXRlLmFjdGl2ZUluZGV4ID09PSBpdGVtSW5kZXgpLFxuICBob3ZlckVuYWJsZWQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmhvdmVyRW5hYmxlZCksXG4gIGluc3RhbnRUeXBlOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5pbnN0YW50VHlwZSksXG4gIGxhc3RPcGVuQ2hhbmdlUmVhc29uOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5vcGVuQ2hhbmdlUmVhc29uKSxcbiAgZmxvYXRpbmdUcmVlUm9vdDogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4ge1xuICAgIGlmIChzdGF0ZS5wYXJlbnQudHlwZSA9PT0gJ21lbnUnKSB7XG4gICAgICByZXR1cm4gc3RhdGUucGFyZW50LnN0b3JlLnNlbGVjdCgnZmxvYXRpbmdUcmVlUm9vdCcpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdGUuZmxvYXRpbmdUcmVlUm9vdDtcbiAgfSksXG4gIGZsb2F0aW5nTm9kZUlkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5mbG9hdGluZ05vZGVJZCksXG4gIGZsb2F0aW5nUGFyZW50Tm9kZUlkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5mbG9hdGluZ1BhcmVudE5vZGVJZCksXG4gIGl0ZW1Qcm9wczogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuaXRlbVByb3BzKSxcbiAgY2xvc2VEZWxheTogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUuY2xvc2VEZWxheSksXG4gIGhhc1ZpZXdwb3J0OiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5oYXNWaWV3cG9ydCksXG4gIGtleWJvYXJkRXZlbnRSZWxheTogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4ge1xuICAgIGlmIChzdGF0ZS5rZXlib2FyZEV2ZW50UmVsYXkpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5rZXlib2FyZEV2ZW50UmVsYXk7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5wYXJlbnQudHlwZSA9PT0gJ21lbnUnKSB7XG4gICAgICByZXR1cm4gc3RhdGUucGFyZW50LnN0b3JlLnNlbGVjdCgna2V5Ym9hcmRFdmVudFJlbGF5Jyk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0pXG59O1xuZXhwb3J0IGNsYXNzIE1lbnVTdG9yZSBleHRlbmRzIFJlYWN0U3RvcmUge1xuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGUpIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5jcmVhdGVJbml0aWFsU3RhdGUoKSxcbiAgICAgIC4uLmluaXRpYWxTdGF0ZVxuICAgIH0sIHtcbiAgICAgIHBvc2l0aW9uZXJSZWY6IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVSZWYoKSxcbiAgICAgIHBvcHVwUmVmOiAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlUmVmKCksXG4gICAgICB0eXBpbmdSZWY6IHtcbiAgICAgICAgY3VycmVudDogZmFsc2VcbiAgICAgIH0sXG4gICAgICBpdGVtRG9tRWxlbWVudHM6IHtcbiAgICAgICAgY3VycmVudDogW11cbiAgICAgIH0sXG4gICAgICBpdGVtTGFiZWxzOiB7XG4gICAgICAgIGN1cnJlbnQ6IFtdXG4gICAgICB9LFxuICAgICAgYWxsb3dNb3VzZVVwVHJpZ2dlclJlZjoge1xuICAgICAgICBjdXJyZW50OiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHRyaWdnZXJGb2N1c1RhcmdldFJlZjogLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZVJlZigpLFxuICAgICAgYmVmb3JlQ29udGVudEZvY3VzR3VhcmRSZWY6IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVSZWYoKSxcbiAgICAgIG9uT3BlbkNoYW5nZUNvbXBsZXRlOiB1bmRlZmluZWQsXG4gICAgICB0cmlnZ2VyRWxlbWVudHM6IG5ldyBQb3B1cFRyaWdnZXJNYXAoKVxuICAgIH0sIHNlbGVjdG9ycyk7XG5cbiAgICAvLyBTZXQgdXAgcHJvcGFnYXRpb24gb2Ygc3RhdGUgZnJvbSBwYXJlbnQgbWVudSBpZiBhcHBsaWNhYmxlLlxuICAgIHRoaXMudW5zdWJzY3JpYmVQYXJlbnRMaXN0ZW5lciA9IHRoaXMub2JzZXJ2ZSgncGFyZW50JywgcGFyZW50ID0+IHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVQYXJlbnRMaXN0ZW5lcj8uKCk7XG4gICAgICBpZiAocGFyZW50LnR5cGUgPT09ICdtZW51Jykge1xuICAgICAgICBsZXQgcm9vdElkID0gcGFyZW50LnN0b3JlLnNlbGVjdCgncm9vdElkJyk7XG4gICAgICAgIGxldCBmbG9hdGluZ1RyZWVSb290ID0gcGFyZW50LnN0b3JlLnNlbGVjdCgnZmxvYXRpbmdUcmVlUm9vdCcpO1xuICAgICAgICBsZXQga2V5Ym9hcmRFdmVudFJlbGF5ID0gcGFyZW50LnN0b3JlLnNlbGVjdCgna2V5Ym9hcmRFdmVudFJlbGF5Jyk7XG4gICAgICAgIHRoaXMudW5zdWJzY3JpYmVQYXJlbnRMaXN0ZW5lciA9IHBhcmVudC5zdG9yZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHRSb290SWQgPSBwYXJlbnQuc3RvcmUuc2VsZWN0KCdyb290SWQnKTtcbiAgICAgICAgICBjb25zdCBuZXh0RmxvYXRpbmdUcmVlUm9vdCA9IHBhcmVudC5zdG9yZS5zZWxlY3QoJ2Zsb2F0aW5nVHJlZVJvb3QnKTtcbiAgICAgICAgICBjb25zdCBuZXh0S2V5Ym9hcmRFdmVudFJlbGF5ID0gcGFyZW50LnN0b3JlLnNlbGVjdCgna2V5Ym9hcmRFdmVudFJlbGF5Jyk7XG4gICAgICAgICAgaWYgKHJvb3RJZCA9PT0gbmV4dFJvb3RJZCAmJiBmbG9hdGluZ1RyZWVSb290ID09PSBuZXh0RmxvYXRpbmdUcmVlUm9vdCAmJiBrZXlib2FyZEV2ZW50UmVsYXkgPT09IG5leHRLZXlib2FyZEV2ZW50UmVsYXkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcm9vdElkID0gbmV4dFJvb3RJZDtcbiAgICAgICAgICBmbG9hdGluZ1RyZWVSb290ID0gbmV4dEZsb2F0aW5nVHJlZVJvb3Q7XG4gICAgICAgICAga2V5Ym9hcmRFdmVudFJlbGF5ID0gbmV4dEtleWJvYXJkRXZlbnRSZWxheTtcbiAgICAgICAgICB0aGlzLm5vdGlmeUFsbCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmFsbG93TW91c2VVcFRyaWdnZXJSZWYgPSBwYXJlbnQuc3RvcmUuY29udGV4dC5hbGxvd01vdXNlVXBUcmlnZ2VyUmVmO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocGFyZW50LnR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuYWxsb3dNb3VzZVVwVHJpZ2dlclJlZiA9IHBhcmVudC5jb250ZXh0LmFsbG93TW91c2VVcFRyaWdnZXJSZWY7XG4gICAgICB9XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlUGFyZW50TGlzdGVuZXIgPSBudWxsO1xuICAgIH0pO1xuICB9XG4gIHNldE9wZW4ob3BlbiwgZXZlbnREZXRhaWxzKSB7XG4gICAgdGhpcy5zdGF0ZS5mbG9hdGluZ1Jvb3RDb250ZXh0LmNvbnRleHQuZXZlbnRzLmVtaXQoJ3NldE9wZW4nLCB7XG4gICAgICBvcGVuLFxuICAgICAgZXZlbnREZXRhaWxzXG4gICAgfSk7XG4gIH1cbiAgc3RhdGljIHVzZVN0b3JlKGV4dGVybmFsU3RvcmUsIGluaXRpYWxTdGF0ZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9ydWxlcy1vZi1ob29rc1xuICAgIGNvbnN0IGludGVybmFsU3RvcmUgPSB1c2VSZWZXaXRoSW5pdCgoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IE1lbnVTdG9yZShpbml0aWFsU3RhdGUpO1xuICAgIH0pLmN1cnJlbnQ7XG4gICAgcmV0dXJuIGV4dGVybmFsU3RvcmUgPz8gaW50ZXJuYWxTdG9yZTtcbiAgfVxuICB1bnN1YnNjcmliZVBhcmVudExpc3RlbmVyID0gbnVsbDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUluaXRpYWxTdGF0ZSgpIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5jcmVhdGVJbml0aWFsUG9wdXBTdG9yZVN0YXRlKCksXG4gICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgIG1vZGFsOiB0cnVlLFxuICAgIG9wZW5NZXRob2Q6IG51bGwsXG4gICAgYWxsb3dNb3VzZUVudGVyOiBmYWxzZSxcbiAgICBzdGlja0lmT3BlbjogdHJ1ZSxcbiAgICBwYXJlbnQ6IHtcbiAgICAgIHR5cGU6IHVuZGVmaW5lZFxuICAgIH0sXG4gICAgcm9vdElkOiB1bmRlZmluZWQsXG4gICAgYWN0aXZlSW5kZXg6IG51bGwsXG4gICAgaG92ZXJFbmFibGVkOiB0cnVlLFxuICAgIGluc3RhbnRUeXBlOiB1bmRlZmluZWQsXG4gICAgb3BlbkNoYW5nZVJlYXNvbjogbnVsbCxcbiAgICBmbG9hdGluZ1RyZWVSb290OiBuZXcgRmxvYXRpbmdUcmVlU3RvcmUoKSxcbiAgICBmbG9hdGluZ05vZGVJZDogdW5kZWZpbmVkLFxuICAgIGZsb2F0aW5nUGFyZW50Tm9kZUlkOiBudWxsLFxuICAgIGl0ZW1Qcm9wczogRU1QVFlfT0JKRUNULFxuICAgIGtleWJvYXJkRXZlbnRSZWxheTogdW5kZWZpbmVkLFxuICAgIGNsb3NlRGVsYXk6IDAsXG4gICAgaGFzVmlld3BvcnQ6IGZhbHNlXG4gIH07XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgY29uc3QgTWVudVN1Ym1lbnVSb290Q29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHVuZGVmaW5lZCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51U3VibWVudVJvb3RDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJNZW51U3VibWVudVJvb3RDb250ZXh0XCI7XG5leHBvcnQgZnVuY3Rpb24gdXNlTWVudVN1Ym1lbnVSb290Q29udGV4dCgpIHtcbiAgcmV0dXJuIFJlYWN0LnVzZUNvbnRleHQoTWVudVN1Ym1lbnVSb290Q29udGV4dCk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IHVzZUlkIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSWQnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZU9uRmlyc3RSZW5kZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VPbkZpcnN0UmVuZGVyJztcbmltcG9ydCB7IEVNUFRZX0FSUkFZLCBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyBmYXN0Q29tcG9uZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZmFzdEhvb2tzJztcbmltcG9ydCB7IEZsb2F0aW5nVHJlZSwgdXNlRGlzbWlzcywgdXNlRmxvYXRpbmdOb2RlSWQsIHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkLCB1c2VMaXN0TmF2aWdhdGlvbiwgdXNlVHlwZWFoZWFkLCB1c2VTeW5jZWRGbG9hdGluZ1Jvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2Zsb2F0aW5nLXVpLXJlYWN0L2luZGV4LmpzXCI7XG5pbXBvcnQgeyBNZW51Um9vdENvbnRleHQsIHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuL01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlTWVudWJhckNvbnRleHQgfSBmcm9tIFwiLi4vLi4vbWVudWJhci9NZW51YmFyQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgVFlQRUFIRUFEX1JFU0VUX01TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IHVzZURpcmVjdGlvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvZGlyZWN0aW9uLWNvbnRleHQvRGlyZWN0aW9uQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlT3BlbkludGVyYWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi91dGlscy91c2VPcGVuSW50ZXJhY3Rpb25UeXBlLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuaW1wb3J0IHsgdXNlQ29udGV4dE1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi8uLi9jb250ZXh0LW1lbnUvcm9vdC9Db250ZXh0TWVudVJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBtZXJnZVByb3BzIH0gZnJvbSBcIi4uLy4uL21lcmdlLXByb3BzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyBNZW51U3RvcmUgfSBmcm9tIFwiLi4vc3RvcmUvTWVudVN0b3JlLmpzXCI7XG5pbXBvcnQgeyBGT0NVU0FCTEVfUE9QVVBfUFJPUFMsIHVzZUltcGxpY2l0QWN0aXZlVHJpZ2dlciwgdXNlT3BlblN0YXRlVHJhbnNpdGlvbnMsIHVzZVBvcHVwSW50ZXJhY3Rpb25Qcm9wcyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cHMvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZU1lbnVTdWJtZW51Um9vdENvbnRleHQgfSBmcm9tIFwiLi4vc3VibWVudS1yb290L01lbnVTdWJtZW51Um9vdENvbnRleHQuanNcIjtcblxuLyoqXG4gKiBHcm91cHMgYWxsIHBhcnRzIG9mIHRoZSBtZW51LlxuICogRG9lc24ndCByZW5kZXIgaXRzIG93biBIVE1MIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgTWVudVJvb3QgPSBmYXN0Q29tcG9uZW50KGZ1bmN0aW9uIE1lbnVSb290KHByb3BzKSB7XG4gIGNvbnN0IHtcbiAgICBjaGlsZHJlbixcbiAgICBvcGVuOiBvcGVuUHJvcCxcbiAgICBvbk9wZW5DaGFuZ2UsXG4gICAgb25PcGVuQ2hhbmdlQ29tcGxldGUsXG4gICAgZGVmYXVsdE9wZW4gPSBmYWxzZSxcbiAgICBkaXNhYmxlZDogZGlzYWJsZWRQcm9wID0gZmFsc2UsXG4gICAgbW9kYWw6IG1vZGFsUHJvcCxcbiAgICBsb29wRm9jdXMgPSB0cnVlLFxuICAgIG9yaWVudGF0aW9uID0gJ3ZlcnRpY2FsJyxcbiAgICBhY3Rpb25zUmVmLFxuICAgIGNsb3NlUGFyZW50T25Fc2MgPSBmYWxzZSxcbiAgICBoYW5kbGUsXG4gICAgdHJpZ2dlcklkOiB0cmlnZ2VySWRQcm9wLFxuICAgIGRlZmF1bHRUcmlnZ2VySWQ6IGRlZmF1bHRUcmlnZ2VySWRQcm9wID0gbnVsbCxcbiAgICBoaWdobGlnaHRJdGVtT25Ib3ZlciA9IHRydWVcbiAgfSA9IHByb3BzO1xuICBjb25zdCBjb250ZXh0TWVudUNvbnRleHQgPSB1c2VDb250ZXh0TWVudVJvb3RDb250ZXh0KHRydWUpO1xuICBjb25zdCBwYXJlbnRNZW51Um9vdENvbnRleHQgPSB1c2VNZW51Um9vdENvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IG1lbnViYXJDb250ZXh0ID0gdXNlTWVudWJhckNvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IGlzU3VibWVudSA9IHVzZU1lbnVTdWJtZW51Um9vdENvbnRleHQoKTtcbiAgY29uc3QgcGFyZW50RnJvbUNvbnRleHQgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoaXNTdWJtZW51ICYmIHBhcmVudE1lbnVSb290Q29udGV4dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ21lbnUnLFxuICAgICAgICBzdG9yZTogcGFyZW50TWVudVJvb3RDb250ZXh0LnN0b3JlXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAobWVudWJhckNvbnRleHQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdtZW51YmFyJyxcbiAgICAgICAgY29udGV4dDogbWVudWJhckNvbnRleHRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIHRoaXMgaXMgbm90IGEgTWVudSBuZXN0ZWQgaW5zaWRlIENvbnRleHRNZW51LlRyaWdnZXIuXG4gICAgLy8gQ29udGV4dE1lbnUgcGFyZW50Q29udGV4dCBpcyBhbHdheXMgdW5kZWZpbmVkIGFzIENvbnRleHRNZW51LlJvb3QgaXMgaW5zdGFudGlhdGVkIHdpdGhcbiAgICAvLyA8TWVudVJvb3RDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt1bmRlZmluZWR9PlxuICAgIGlmIChjb250ZXh0TWVudUNvbnRleHQgJiYgIXBhcmVudE1lbnVSb290Q29udGV4dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ2NvbnRleHQtbWVudScsXG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHRNZW51Q29udGV4dFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sIFtjb250ZXh0TWVudUNvbnRleHQsIHBhcmVudE1lbnVSb290Q29udGV4dCwgbWVudWJhckNvbnRleHQsIGlzU3VibWVudV0pO1xuICBjb25zdCBzdG9yZSA9IE1lbnVTdG9yZS51c2VTdG9yZShoYW5kbGU/LnN0b3JlLCB7XG4gICAgb3BlbjogZGVmYXVsdE9wZW4sXG4gICAgb3BlblByb3AsXG4gICAgYWN0aXZlVHJpZ2dlcklkOiBkZWZhdWx0VHJpZ2dlcklkUHJvcCxcbiAgICB0cmlnZ2VySWRQcm9wLFxuICAgIHBhcmVudDogcGFyZW50RnJvbUNvbnRleHRcbiAgfSk7XG5cbiAgLy8gU3VwcG9ydCBpbml0aWFsbHkgb3BlbiBzdGF0ZSB3aGVuIHVuY29udHJvbGxlZFxuICB1c2VPbkZpcnN0UmVuZGVyKCgpID0+IHtcbiAgICBpZiAob3BlblByb3AgPT09IHVuZGVmaW5lZCAmJiBzdG9yZS5zdGF0ZS5vcGVuID09PSBmYWxzZSAmJiBkZWZhdWx0T3BlbiA9PT0gdHJ1ZSkge1xuICAgICAgc3RvcmUudXBkYXRlKHtcbiAgICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgICAgYWN0aXZlVHJpZ2dlcklkOiBkZWZhdWx0VHJpZ2dlcklkUHJvcFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgc3RvcmUudXNlQ29udHJvbGxlZFByb3AoJ29wZW5Qcm9wJywgb3BlblByb3ApO1xuICBzdG9yZS51c2VDb250cm9sbGVkUHJvcCgndHJpZ2dlcklkUHJvcCcsIHRyaWdnZXJJZFByb3ApO1xuICBzdG9yZS51c2VDb250ZXh0Q2FsbGJhY2soJ29uT3BlbkNoYW5nZUNvbXBsZXRlJywgb25PcGVuQ2hhbmdlQ29tcGxldGUpO1xuICBjb25zdCByb290SWQgPSB1c2VJZCgpO1xuICBjb25zdCBmbG9hdGluZ0lkID0gdXNlSWQoKTtcbiAgY29uc3QgZmxvYXRpbmdUcmVlUm9vdCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1RyZWVSb290Jyk7XG4gIGNvbnN0IGZsb2F0aW5nTm9kZUlkRnJvbUNvbnRleHQgPSB1c2VGbG9hdGluZ05vZGVJZChmbG9hdGluZ1RyZWVSb290KTtcbiAgY29uc3QgZmxvYXRpbmdQYXJlbnROb2RlSWRGcm9tQ29udGV4dCA9IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkKCk7XG4gIGNvbnN0IG9wZW4gPSBzdG9yZS51c2VTdGF0ZSgnb3BlbicpO1xuICBjb25zdCBhY3RpdmVUcmlnZ2VyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdhY3RpdmVUcmlnZ2VyRWxlbWVudCcpO1xuICBjb25zdCBwb3NpdGlvbmVyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdwb3NpdGlvbmVyRWxlbWVudCcpO1xuICBjb25zdCBob3ZlckVuYWJsZWQgPSBzdG9yZS51c2VTdGF0ZSgnaG92ZXJFbmFibGVkJyk7XG4gIGNvbnN0IGRpc2FibGVkID0gc3RvcmUudXNlU3RhdGUoJ2Rpc2FibGVkJyk7XG4gIGNvbnN0IGxhc3RPcGVuQ2hhbmdlUmVhc29uID0gc3RvcmUudXNlU3RhdGUoJ2xhc3RPcGVuQ2hhbmdlUmVhc29uJyk7XG4gIGNvbnN0IHBhcmVudCA9IHN0b3JlLnVzZVN0YXRlKCdwYXJlbnQnKTtcbiAgY29uc3QgYWN0aXZlSW5kZXggPSBzdG9yZS51c2VTdGF0ZSgnYWN0aXZlSW5kZXgnKTtcbiAgY29uc3QgcGF5bG9hZCA9IHN0b3JlLnVzZVN0YXRlKCdwYXlsb2FkJyk7XG4gIGNvbnN0IGZsb2F0aW5nUGFyZW50Tm9kZUlkID0gc3RvcmUudXNlU3RhdGUoJ2Zsb2F0aW5nUGFyZW50Tm9kZUlkJyk7XG4gIGNvbnN0IG9wZW5FdmVudFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgYWxsb3dPdXRzaWRlUHJlc3NEaXNtaXNzYWxSZWYgPSBSZWFjdC51c2VSZWYocGFyZW50LnR5cGUgIT09ICdjb250ZXh0LW1lbnUnKTtcbiAgY29uc3QgYWxsb3dPdXRzaWRlUHJlc3NEaXNtaXNzYWxUaW1lb3V0ID0gdXNlVGltZW91dCgpO1xuICBjb25zdCBhbGxvd1RvdWNoVG9DbG9zZVJlZiA9IFJlYWN0LnVzZVJlZih0cnVlKTtcbiAgY29uc3QgYWxsb3dUb3VjaFRvQ2xvc2VUaW1lb3V0ID0gdXNlVGltZW91dCgpO1xuICBjb25zdCBuZXN0ZWQgPSBmbG9hdGluZ1BhcmVudE5vZGVJZCAhPSBudWxsO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChwYXJlbnQudHlwZSAhPT0gdW5kZWZpbmVkICYmIG1vZGFsUHJvcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0Jhc2UgVUk6IFRoZSBgbW9kYWxgIHByb3AgaXMgbm90IHN1cHBvcnRlZCBvbiBuZXN0ZWQgbWVudXMuIEl0IHdpbGwgYmUgaWdub3JlZC4nKTtcbiAgICB9XG4gIH1cbiAgY29uc3Qge1xuICAgIG9wZW5NZXRob2QsXG4gICAgdHJpZ2dlclByb3BzOiBpbnRlcmFjdGlvblR5cGVQcm9wc1xuICB9ID0gdXNlT3BlbkludGVyYWN0aW9uVHlwZShvcGVuKTtcbiAgc3RvcmUudXNlU3luY2VkVmFsdWVzKHtcbiAgICBkaXNhYmxlZDogZGlzYWJsZWRQcm9wLFxuICAgIG1vZGFsOiBwYXJlbnQudHlwZSA9PT0gdW5kZWZpbmVkID8gbW9kYWxQcm9wIDogdW5kZWZpbmVkLFxuICAgIG9wZW5NZXRob2QsXG4gICAgcm9vdElkXG4gIH0pO1xuICB1c2VJbXBsaWNpdEFjdGl2ZVRyaWdnZXIoc3RvcmUpO1xuICBjb25zdCB7XG4gICAgZm9yY2VVbm1vdW50XG4gIH0gPSB1c2VPcGVuU3RhdGVUcmFuc2l0aW9ucyhvcGVuLCBzdG9yZSwgKCkgPT4ge1xuICAgIHN0b3JlLnVwZGF0ZSh7XG4gICAgICBhbGxvd01vdXNlRW50ZXI6IGZhbHNlLFxuICAgICAgc3RpY2tJZk9wZW46IHRydWVcbiAgICB9KTtcbiAgfSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGNvbnRleHRNZW51Q29udGV4dCAmJiAhcGFyZW50TWVudVJvb3RDb250ZXh0KSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29udGV4dCBtZW51IHJvb3QuXG4gICAgICAvLyBJdCBkb2Vzbid0IHN1cHBvcnQgZGV0YWNoZWQgdHJpZ2dlcnMgeWV0LCBzbyB3ZSBoYXZlIHRvIHN5bmMgdGhlIHBhcmVudCBjb250ZXh0IG1hbnVhbGx5LlxuICAgICAgc3RvcmUudXBkYXRlKHtcbiAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgdHlwZTogJ2NvbnRleHQtbWVudScsXG4gICAgICAgICAgY29udGV4dDogY29udGV4dE1lbnVDb250ZXh0XG4gICAgICAgIH0sXG4gICAgICAgIGZsb2F0aW5nTm9kZUlkOiBmbG9hdGluZ05vZGVJZEZyb21Db250ZXh0LFxuICAgICAgICBmbG9hdGluZ1BhcmVudE5vZGVJZDogZmxvYXRpbmdQYXJlbnROb2RlSWRGcm9tQ29udGV4dFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnRNZW51Um9vdENvbnRleHQpIHtcbiAgICAgIHN0b3JlLnVwZGF0ZSh7XG4gICAgICAgIGZsb2F0aW5nTm9kZUlkOiBmbG9hdGluZ05vZGVJZEZyb21Db250ZXh0LFxuICAgICAgICBmbG9hdGluZ1BhcmVudE5vZGVJZDogZmxvYXRpbmdQYXJlbnROb2RlSWRGcm9tQ29udGV4dFxuICAgICAgfSk7XG4gICAgfVxuICB9LCBbY29udGV4dE1lbnVDb250ZXh0LCBwYXJlbnRNZW51Um9vdENvbnRleHQsIGZsb2F0aW5nTm9kZUlkRnJvbUNvbnRleHQsIGZsb2F0aW5nUGFyZW50Tm9kZUlkRnJvbUNvbnRleHQsIHN0b3JlXSk7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICBvcGVuRXZlbnRSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwYXJlbnQudHlwZSAhPT0gJ2NvbnRleHQtbWVudScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICBhbGxvd091dHNpZGVQcmVzc0Rpc21pc3NhbFRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIGFsbG93T3V0c2lkZVByZXNzRGlzbWlzc2FsUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXaXRoIGBtb3VzZWRvd25gIG91dHNpZGUgcHJlc3MgZXZlbnRzIGFuZCBsb25nIHByZXNzIHRvdWNoIGlucHV0LCB0aGVyZVxuICAgIC8vIG5lZWRzIHRvIGJlIGEgZ3JhY2UgcGVyaW9kIGFmdGVyIG9wZW5pbmcgdG8gZW5zdXJlIHRoZSBkaXNtaXNzYWwgZXZlbnRcbiAgICAvLyBkb2Vzbid0IGZpcmUgaW1tZWRpYXRlbHkgYWZ0ZXIgb3Blbi5cbiAgICBhbGxvd091dHNpZGVQcmVzc0Rpc21pc3NhbFRpbWVvdXQuc3RhcnQoNTAwLCAoKSA9PiB7XG4gICAgICBhbGxvd091dHNpZGVQcmVzc0Rpc21pc3NhbFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICB9KTtcbiAgfSwgW2FsbG93T3V0c2lkZVByZXNzRGlzbWlzc2FsVGltZW91dCwgb3BlbiwgcGFyZW50LnR5cGVdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIW9wZW4gJiYgIWhvdmVyRW5hYmxlZCkge1xuICAgICAgc3RvcmUuc2V0KCdob3ZlckVuYWJsZWQnLCB0cnVlKTtcbiAgICB9XG4gIH0sIFtvcGVuLCBob3ZlckVuYWJsZWQsIHN0b3JlXSk7XG4gIGNvbnN0IHNldE9wZW4gPSB1c2VTdGFibGVDYWxsYmFjaygobmV4dE9wZW4sIGV2ZW50RGV0YWlscykgPT4ge1xuICAgIGNvbnN0IHJlYXNvbiA9IGV2ZW50RGV0YWlscy5yZWFzb247XG4gICAgaWYgKG9wZW4gPT09IG5leHRPcGVuICYmIGV2ZW50RGV0YWlscy50cmlnZ2VyID09PSBhY3RpdmVUcmlnZ2VyRWxlbWVudCAmJiBsYXN0T3BlbkNoYW5nZVJlYXNvbiA9PT0gcmVhc29uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV2ZW50RGV0YWlscy5wcmV2ZW50VW5tb3VudE9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICBzdG9yZS5zZXQoJ3ByZXZlbnRVbm1vdW50aW5nT25DbG9zZScsIHRydWUpO1xuICAgIH07XG5cbiAgICAvLyBEbyBub3QgaW1tZWRpYXRlbHkgcmVzZXQgdGhlIGFjdGl2ZVRyaWdnZXJJZCB0byBhbGxvd1xuICAgIC8vIGV4aXQgYW5pbWF0aW9ucyB0byBwbGF5IGFuZCBmb2N1cyB0byBiZSByZXR1cm5lZCBjb3JyZWN0bHkuXG4gICAgaWYgKCFuZXh0T3BlbiAmJiBldmVudERldGFpbHMudHJpZ2dlciA9PSBudWxsKSB7XG4gICAgICBldmVudERldGFpbHMudHJpZ2dlciA9IGFjdGl2ZVRyaWdnZXJFbGVtZW50ID8/IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgb25PcGVuQ2hhbmdlPy4obmV4dE9wZW4sIGV2ZW50RGV0YWlscyk7XG4gICAgaWYgKGV2ZW50RGV0YWlscy5pc0NhbmNlbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0b3JlLnN0YXRlLmZsb2F0aW5nUm9vdENvbnRleHQuZGlzcGF0Y2hPcGVuQ2hhbmdlKG5leHRPcGVuLCBldmVudERldGFpbHMpO1xuICAgIGNvbnN0IG5hdGl2ZUV2ZW50ID0gZXZlbnREZXRhaWxzLmV2ZW50O1xuICAgIGlmIChuZXh0T3BlbiA9PT0gZmFsc2UgJiYgbmF0aXZlRXZlbnQ/LnR5cGUgPT09ICdjbGljaycgJiYgbmF0aXZlRXZlbnQucG9pbnRlclR5cGUgPT09ICd0b3VjaCcgJiYgIWFsbG93VG91Y2hUb0Nsb3NlUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXb3JrYXJvdW5kIGBlbmFibGVGb2N1c0luc2lkZWAgaW4gRmxvYXRpbmcgVUkgc2V0dGluZyBgdGFiaW5kZXg9MGAgb2YgYSBub24taGlnaGxpZ2h0ZWRcbiAgICAvLyBvcHRpb24gdXBvbiBjbG9zZSB3aGVuIHRhYmJpbmcgb3V0IGR1ZSB0byBga2VlcE1vdW50ZWQ9dHJ1ZWA6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL3B1bGwvMzAwNC9maWxlcyNkaWZmLTk2MmE3NDM5Y2RlYjA5ZWE5OGQ0YjYyMmE0NWQ1MTdiY2UwN2FkOGMzZjg2NmUwODliZGEwNWY0YjBiYmQ4NzVSMTk0LVIxOTlcbiAgICAvLyBUaGlzIG90aGVyd2lzZSBjYXVzZXMgb3B0aW9ucyB0byByZXRhaW4gYHRhYmluZGV4PTBgIGluY29ycmVjdGx5IHdoZW4gdGhlIHBvcHVwIGlzIGNsb3NlZFxuICAgIC8vIHdoZW4gdGFiYmluZyBvdXRzaWRlLlxuICAgIGlmICghbmV4dE9wZW4gJiYgYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZU9wdGlvbiA9IHN0b3JlLmNvbnRleHQuaXRlbURvbUVsZW1lbnRzLmN1cnJlbnRbYWN0aXZlSW5kZXhdO1xuICAgICAgLy8gV2FpdCBmb3IgRmxvYXRpbmcgVUkncyBmb2N1cyBlZmZlY3QgdG8gaGF2ZSBmaXJlZFxuICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICBhY3RpdmVPcHRpb24/LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFByZXZlbnQgdGhlIG1lbnUgZnJvbSBjbG9zaW5nIG9uIG1vYmlsZSBkZXZpY2VzIHRoYXQgaGF2ZSBhIGRlbGF5ZWQgY2xpY2sgZXZlbnQuXG4gICAgLy8gSW4gc29tZSBjYXNlcyB0aGUgbWVudSwgd2hlbiB0YXBwZWQsIHdpbGwgZmlyZSB0aGUgZm9jdXMgZXZlbnQgZmlyc3QgYW5kIHRoZW4gdGhlIGNsaWNrIGV2ZW50LlxuICAgIC8vIFdpdGhvdXQgdGhpcyBndWFyZCwgdGhlIG1lbnUgd2lsbCBjbG9zZSBpbW1lZGlhdGVseSBhZnRlciBvcGVuaW5nLlxuICAgIGlmIChuZXh0T3BlbiAmJiByZWFzb24gPT09IFJFQVNPTlMudHJpZ2dlckZvY3VzKSB7XG4gICAgICBhbGxvd1RvdWNoVG9DbG9zZVJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBhbGxvd1RvdWNoVG9DbG9zZVRpbWVvdXQuc3RhcnQoMzAwLCAoKSA9PiB7XG4gICAgICAgIGFsbG93VG91Y2hUb0Nsb3NlUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFsbG93VG91Y2hUb0Nsb3NlUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgYWxsb3dUb3VjaFRvQ2xvc2VUaW1lb3V0LmNsZWFyKCk7XG4gICAgfVxuICAgIGNvbnN0IGlzS2V5Ym9hcmRDbGljayA9IChyZWFzb24gPT09IFJFQVNPTlMudHJpZ2dlclByZXNzIHx8IHJlYXNvbiA9PT0gUkVBU09OUy5pdGVtUHJlc3MpICYmIG5hdGl2ZUV2ZW50LmRldGFpbCA9PT0gMCAmJiBuYXRpdmVFdmVudD8uaXNUcnVzdGVkO1xuICAgIGNvbnN0IGlzRGlzbWlzc0Nsb3NlID0gIW5leHRPcGVuICYmIChyZWFzb24gPT09IFJFQVNPTlMuZXNjYXBlS2V5IHx8IHJlYXNvbiA9PSBudWxsKTtcbiAgICBjb25zdCB1cGRhdGVkU3RhdGUgPSB7XG4gICAgICBvcGVuOiBuZXh0T3BlbixcbiAgICAgIG9wZW5DaGFuZ2VSZWFzb246IHJlYXNvblxuICAgIH07XG4gICAgb3BlbkV2ZW50UmVmLmN1cnJlbnQgPSBldmVudERldGFpbHMuZXZlbnQgPz8gbnVsbDtcblxuICAgIC8vIElmIGEgcG9wdXAgaXMgY2xvc2luZywgdGhlIGB0cmlnZ2VyYCBtYXkgYmUgbnVsbC5cbiAgICAvLyBXZSB3YW50IHRvIGtlZXAgdGhlIHByZXZpb3VzIHZhbHVlIHNvIHRoYXQgZXhpdCBhbmltYXRpb25zIGFyZSBwbGF5ZWQgYW5kIGZvY3VzIGlzIHJldHVybmVkIGNvcnJlY3RseS5cbiAgICBjb25zdCBuZXdUcmlnZ2VySWQgPSBldmVudERldGFpbHMudHJpZ2dlcj8uaWQgPz8gbnVsbDtcbiAgICBpZiAobmV3VHJpZ2dlcklkIHx8IG5leHRPcGVuKSB7XG4gICAgICB1cGRhdGVkU3RhdGUuYWN0aXZlVHJpZ2dlcklkID0gbmV3VHJpZ2dlcklkO1xuICAgICAgdXBkYXRlZFN0YXRlLmFjdGl2ZVRyaWdnZXJFbGVtZW50ID0gZXZlbnREZXRhaWxzLnRyaWdnZXIgPz8gbnVsbDtcbiAgICB9XG4gICAgc3RvcmUudXBkYXRlKHVwZGF0ZWRTdGF0ZSk7XG4gICAgaWYgKHBhcmVudC50eXBlID09PSAnbWVudWJhcicgJiYgKHJlYXNvbiA9PT0gUkVBU09OUy50cmlnZ2VyRm9jdXMgfHwgcmVhc29uID09PSBSRUFTT05TLmZvY3VzT3V0IHx8IHJlYXNvbiA9PT0gUkVBU09OUy50cmlnZ2VySG92ZXIgfHwgcmVhc29uID09PSBSRUFTT05TLmxpc3ROYXZpZ2F0aW9uIHx8IHJlYXNvbiA9PT0gUkVBU09OUy5zaWJsaW5nT3BlbikpIHtcbiAgICAgIHN0b3JlLnNldCgnaW5zdGFudFR5cGUnLCAnZ3JvdXAnKTtcbiAgICB9IGVsc2UgaWYgKGlzS2V5Ym9hcmRDbGljayB8fCBpc0Rpc21pc3NDbG9zZSkge1xuICAgICAgc3RvcmUuc2V0KCdpbnN0YW50VHlwZScsIGlzS2V5Ym9hcmRDbGljayA/ICdjbGljaycgOiAnZGlzbWlzcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdG9yZS5zZXQoJ2luc3RhbnRUeXBlJywgdW5kZWZpbmVkKTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBmbG9hdGluZ1Jvb3RDb250ZXh0ID0gdXNlU3luY2VkRmxvYXRpbmdSb290Q29udGV4dCh7XG4gICAgcG9wdXBTdG9yZTogc3RvcmUsXG4gICAgZmxvYXRpbmdJZCxcbiAgICBuZXN0ZWQ6IGZsb2F0aW5nUGFyZW50Tm9kZUlkRnJvbUNvbnRleHQgIT0gbnVsbCxcbiAgICBvbk9wZW5DaGFuZ2U6IHNldE9wZW5cbiAgfSk7XG4gIGNvbnN0IGZsb2F0aW5nRXZlbnRzID0gZmxvYXRpbmdSb290Q29udGV4dC5jb250ZXh0LmV2ZW50cztcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVTZXRPcGVuRXZlbnQgPSAoe1xuICAgICAgb3BlbjogbmV4dE9wZW4sXG4gICAgICBldmVudERldGFpbHNcbiAgICB9KSA9PiBzZXRPcGVuKG5leHRPcGVuLCBldmVudERldGFpbHMpO1xuICAgIGZsb2F0aW5nRXZlbnRzLm9uKCdzZXRPcGVuJywgaGFuZGxlU2V0T3BlbkV2ZW50KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZmxvYXRpbmdFdmVudHM/Lm9mZignc2V0T3BlbicsIGhhbmRsZVNldE9wZW5FdmVudCk7XG4gICAgfTtcbiAgfSwgW2Zsb2F0aW5nRXZlbnRzLCBzZXRPcGVuXSk7XG4gIGNvbnN0IGhhbmRsZUltcGVyYXRpdmVDbG9zZSA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5pbXBlcmF0aXZlQWN0aW9uKSk7XG4gIH0sIFtzdG9yZV0pO1xuICBSZWFjdC51c2VJbXBlcmF0aXZlSGFuZGxlKGFjdGlvbnNSZWYsICgpID0+ICh7XG4gICAgdW5tb3VudDogZm9yY2VVbm1vdW50LFxuICAgIGNsb3NlOiBoYW5kbGVJbXBlcmF0aXZlQ2xvc2VcbiAgfSksIFtmb3JjZVVubW91bnQsIGhhbmRsZUltcGVyYXRpdmVDbG9zZV0pO1xuICBsZXQgY3R4O1xuICBpZiAocGFyZW50LnR5cGUgPT09ICdjb250ZXh0LW1lbnUnKSB7XG4gICAgY3R4ID0gcGFyZW50LmNvbnRleHQ7XG4gIH1cbiAgUmVhY3QudXNlSW1wZXJhdGl2ZUhhbmRsZShjdHg/LnBvc2l0aW9uZXJSZWYsICgpID0+IHBvc2l0aW9uZXJFbGVtZW50LCBbcG9zaXRpb25lckVsZW1lbnRdKTtcbiAgUmVhY3QudXNlSW1wZXJhdGl2ZUhhbmRsZShjdHg/LmFjdGlvbnNSZWYsICgpID0+ICh7XG4gICAgc2V0T3BlblxuICB9KSwgW3NldE9wZW5dKTtcbiAgY29uc3QgZGlzbWlzcyA9IHVzZURpc21pc3MoZmxvYXRpbmdSb290Q29udGV4dCwge1xuICAgIGVuYWJsZWQ6ICFkaXNhYmxlZCxcbiAgICBidWJibGVzOiB7XG4gICAgICBlc2NhcGVLZXk6IGNsb3NlUGFyZW50T25Fc2MgJiYgcGFyZW50LnR5cGUgPT09ICdtZW51J1xuICAgIH0sXG4gICAgb3V0c2lkZVByZXNzKCkge1xuICAgICAgaWYgKHBhcmVudC50eXBlICE9PSAnY29udGV4dC1tZW51JyB8fCBvcGVuRXZlbnRSZWYuY3VycmVudD8udHlwZSA9PT0gJ2NvbnRleHRtZW51Jykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhbGxvd091dHNpZGVQcmVzc0Rpc21pc3NhbFJlZi5jdXJyZW50O1xuICAgIH0sXG4gICAgZXh0ZXJuYWxUcmVlOiBuZXN0ZWQgPyBmbG9hdGluZ1RyZWVSb290IDogdW5kZWZpbmVkXG4gIH0pO1xuICBjb25zdCBkaXJlY3Rpb24gPSB1c2VEaXJlY3Rpb24oKTtcbiAgY29uc3Qgc2V0QWN0aXZlSW5kZXggPSBSZWFjdC51c2VDYWxsYmFjayhpbmRleCA9PiB7XG4gICAgaWYgKHN0b3JlLnNlbGVjdCgnYWN0aXZlSW5kZXgnKSA9PT0gaW5kZXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIGluZGV4KTtcbiAgfSwgW3N0b3JlXSk7XG4gIGNvbnN0IGxpc3ROYXZpZ2F0aW9uID0gdXNlTGlzdE5hdmlnYXRpb24oZmxvYXRpbmdSb290Q29udGV4dCwge1xuICAgIGVuYWJsZWQ6ICFkaXNhYmxlZCxcbiAgICBsaXN0UmVmOiBzdG9yZS5jb250ZXh0Lml0ZW1Eb21FbGVtZW50cyxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBuZXN0ZWQ6IHBhcmVudC50eXBlICE9PSB1bmRlZmluZWQsXG4gICAgbG9vcEZvY3VzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIHBhcmVudE9yaWVudGF0aW9uOiBwYXJlbnQudHlwZSA9PT0gJ21lbnViYXInID8gcGFyZW50LmNvbnRleHQub3JpZW50YXRpb24gOiB1bmRlZmluZWQsXG4gICAgcnRsOiBkaXJlY3Rpb24gPT09ICdydGwnLFxuICAgIGRpc2FibGVkSW5kaWNlczogRU1QVFlfQVJSQVksXG4gICAgb25OYXZpZ2F0ZTogc2V0QWN0aXZlSW5kZXgsXG4gICAgb3Blbk9uQXJyb3dLZXlEb3duOiBwYXJlbnQudHlwZSAhPT0gJ2NvbnRleHQtbWVudScsXG4gICAgZXh0ZXJuYWxUcmVlOiBuZXN0ZWQgPyBmbG9hdGluZ1RyZWVSb290IDogdW5kZWZpbmVkLFxuICAgIGZvY3VzSXRlbU9uSG92ZXI6IGhpZ2hsaWdodEl0ZW1PbkhvdmVyXG4gIH0pO1xuICBjb25zdCBvblR5cGluZyA9IFJlYWN0LnVzZUNhbGxiYWNrKG5leHRUeXBpbmcgPT4ge1xuICAgIHN0b3JlLmNvbnRleHQudHlwaW5nUmVmLmN1cnJlbnQgPSBuZXh0VHlwaW5nO1xuICB9LCBbc3RvcmVdKTtcbiAgY29uc3QgdHlwZWFoZWFkID0gdXNlVHlwZWFoZWFkKGZsb2F0aW5nUm9vdENvbnRleHQsIHtcbiAgICBsaXN0UmVmOiBzdG9yZS5jb250ZXh0Lml0ZW1MYWJlbHMsXG4gICAgZWxlbWVudHNSZWY6IHN0b3JlLmNvbnRleHQuaXRlbURvbUVsZW1lbnRzLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIHJlc2V0TXM6IFRZUEVBSEVBRF9SRVNFVF9NUyxcbiAgICBvbk1hdGNoOiBpbmRleCA9PiB7XG4gICAgICBpZiAob3BlbiAmJiBpbmRleCAhPT0gYWN0aXZlSW5kZXgpIHtcbiAgICAgICAgc3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIGluZGV4KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9uVHlwaW5nXG4gIH0pO1xuICBjb25zdCBhY3RpdmVUcmlnZ2VyUHJvcHMgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBtZXJnZWRQcm9wcyA9IG1lcmdlUHJvcHModHlwZWFoZWFkLnJlZmVyZW5jZSwgbGlzdE5hdmlnYXRpb24ucmVmZXJlbmNlLCBkaXNtaXNzLnJlZmVyZW5jZSwge1xuICAgICAgb25Nb3VzZU1vdmUoKSB7XG4gICAgICAgIHN0b3JlLnNldCgnYWxsb3dNb3VzZUVudGVyJywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSwgaW50ZXJhY3Rpb25UeXBlUHJvcHMpO1xuICAgIG1lcmdlZFByb3BzWydhcmlhLWhhc3BvcHVwJ10gPSAnbWVudSc7XG4gICAgbWVyZ2VkUHJvcHNbJ2FyaWEtZXhwYW5kZWQnXSA9IG9wZW47XG4gICAgcmV0dXJuIG1lcmdlZFByb3BzO1xuICB9LCBbc3RvcmUsIHR5cGVhaGVhZC5yZWZlcmVuY2UsIGxpc3ROYXZpZ2F0aW9uLnJlZmVyZW5jZSwgZGlzbWlzcy5yZWZlcmVuY2UsIGludGVyYWN0aW9uVHlwZVByb3BzLCBvcGVuXSk7XG4gIGNvbnN0IGluYWN0aXZlVHJpZ2dlclByb3BzID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbWVyZ2VkUHJvcHMgPSBtZXJnZVByb3BzKGxpc3ROYXZpZ2F0aW9uLnRyaWdnZXIsIGRpc21pc3MudHJpZ2dlciwgaW50ZXJhY3Rpb25UeXBlUHJvcHMpO1xuICAgIG1lcmdlZFByb3BzWydhcmlhLWhhc3BvcHVwJ10gPSAnbWVudSc7XG4gICAgbWVyZ2VkUHJvcHNbJ2FyaWEtZXhwYW5kZWQnXSA9IGZhbHNlO1xuICAgIHJldHVybiBtZXJnZWRQcm9wcztcbiAgfSwgW2xpc3ROYXZpZ2F0aW9uLnRyaWdnZXIsIGRpc21pc3MudHJpZ2dlciwgaW50ZXJhY3Rpb25UeXBlUHJvcHNdKTtcbiAgY29uc3QgcG9wdXBQcm9wcyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gbWVyZ2VQcm9wcyhGT0NVU0FCTEVfUE9QVVBfUFJPUFMsIHtcbiAgICBpZDogZmxvYXRpbmdJZCxcbiAgICByb2xlOiAnbWVudScsXG4gICAgJ2FyaWEtbGFiZWxsZWRieSc6IGFjdGl2ZVRyaWdnZXJFbGVtZW50Py5pZCxcbiAgICBvbk1vdXNlTW92ZSgpIHtcbiAgICAgIHN0b3JlLnNldCgnYWxsb3dNb3VzZUVudGVyJywgdHJ1ZSk7XG4gICAgICBpZiAocGFyZW50LnR5cGUgPT09ICdtZW51Jykge1xuICAgICAgICBzdG9yZS5zZXQoJ2hvdmVyRW5hYmxlZCcsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9uQ2xpY2soKSB7XG4gICAgICBpZiAoc3RvcmUuc2VsZWN0KCdob3ZlckVuYWJsZWQnKSkge1xuICAgICAgICBzdG9yZS5zZXQoJ2hvdmVyRW5hYmxlZCcsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9uS2V5RG93bihldmVudCkge1xuICAgICAgLy8gVGhlIE1lbnViYXIncyBDb21wb3NpdGVSb290IGNhcHR1cmVzIGtleWJvYXJkIGV2ZW50cyB2aWFcbiAgICAgIC8vIGV2ZW50IGRlbGVnYXRpb24uIFRoaXMgd29ya3Mgd2VsbCB3aGVuIE1lbnUuUm9vdCBpcyBuZXN0ZWQgaW5zaWRlIE1lbnViYXIsXG4gICAgICAvLyBidXQgd2l0aCBkZXRhY2hlZCB0cmlnZ2VycyB3ZSBuZWVkIHRvIG1hbnVhbGx5IGZvcndhcmQgdGhlIGV2ZW50IHRvIHRoZSBDb21wb3NpdGVSb290LlxuICAgICAgY29uc3QgcmVsYXkgPSBzdG9yZS5zZWxlY3QoJ2tleWJvYXJkRXZlbnRSZWxheScpO1xuICAgICAgaWYgKHJlbGF5ICYmICFldmVudC5pc1Byb3BhZ2F0aW9uU3RvcHBlZCgpKSB7XG4gICAgICAgIHJlbGF5KGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHR5cGVhaGVhZC5mbG9hdGluZywgbGlzdE5hdmlnYXRpb24uZmxvYXRpbmcsIGRpc21pc3MuZmxvYXRpbmcpLCBbYWN0aXZlVHJpZ2dlckVsZW1lbnQsIGZsb2F0aW5nSWQsIHBhcmVudC50eXBlLCBzdG9yZSwgdHlwZWFoZWFkLmZsb2F0aW5nLCBsaXN0TmF2aWdhdGlvbi5mbG9hdGluZywgZGlzbWlzcy5mbG9hdGluZ10pO1xuICBjb25zdCBpdGVtUHJvcHMgPSBsaXN0TmF2aWdhdGlvbi5pdGVtID8/IEVNUFRZX09CSkVDVDtcbiAgdXNlUG9wdXBJbnRlcmFjdGlvblByb3BzKHN0b3JlLCB7XG4gICAgZmxvYXRpbmdSb290Q29udGV4dCxcbiAgICBhY3RpdmVUcmlnZ2VyUHJvcHMsXG4gICAgaW5hY3RpdmVUcmlnZ2VyUHJvcHMsXG4gICAgcG9wdXBQcm9wcyxcbiAgICBpdGVtUHJvcHNcbiAgfSk7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgc3RvcmUsXG4gICAgcGFyZW50OiBwYXJlbnRGcm9tQ29udGV4dFxuICB9KSwgW3N0b3JlLCBwYXJlbnRGcm9tQ29udGV4dF0pO1xuICBjb25zdCBjb250ZW50ID0gLyojX19QVVJFX18qL19qc3goTWVudVJvb3RDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGNvbnRleHQsXG4gICAgY2hpbGRyZW46IHR5cGVvZiBjaGlsZHJlbiA9PT0gJ2Z1bmN0aW9uJyA/IGNoaWxkcmVuKHtcbiAgICAgIHBheWxvYWRcbiAgICB9KSA6IGNoaWxkcmVuXG4gIH0pO1xuICBpZiAocGFyZW50LnR5cGUgPT09IHVuZGVmaW5lZCB8fCBwYXJlbnQudHlwZSA9PT0gJ2NvbnRleHQtbWVudScpIHtcbiAgICAvLyBzZXQgdXAgYSBGbG9hdGluZ1RyZWUgdG8gcHJvdmlkZSB0aGUgY29udGV4dCB0byBuZXN0ZWQgbWVudXNcbiAgICByZXR1cm4gLyojX19QVVJFX18qL19qc3goRmxvYXRpbmdUcmVlLCB7XG4gICAgICBleHRlcm5hbFRyZWU6IGZsb2F0aW5nVHJlZVJvb3QsXG4gICAgICBjaGlsZHJlbjogY29udGVudFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBjb250ZW50O1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBNZW51Um9vdC5kaXNwbGF5TmFtZSA9IFwiTWVudVJvb3RcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IE1lbnVSb290IH0gZnJvbSBcIi4uL3Jvb3QvTWVudVJvb3QuanNcIjtcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgTWVudVN1Ym1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuL01lbnVTdWJtZW51Um9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgeyB1c2VNZW51U3VibWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4vTWVudVN1Ym1lbnVSb290Q29udGV4dC5qc1wiO1xuXG4vKipcbiAqIEdyb3VwcyBhbGwgcGFydHMgb2YgYSBzdWJtZW51LlxuICogRG9lc24ndCByZW5kZXIgaXRzIG93biBIVE1MIGVsZW1lbnQuXG4gKlxuICogRG9jdW1lbnRhdGlvbjogW0Jhc2UgVUkgTWVudV0oaHR0cHM6Ly9iYXNlLXVpLmNvbS9yZWFjdC9jb21wb25lbnRzL21lbnUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBNZW51U3VibWVudVJvb3QocHJvcHMpIHtcbiAgY29uc3QgcGFyZW50TWVudSA9IHVzZU1lbnVSb290Q29udGV4dCgpLnN0b3JlO1xuICBjb25zdCBjb250ZXh0VmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgcGFyZW50TWVudVxuICB9KSwgW3BhcmVudE1lbnVdKTtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KE1lbnVTdWJtZW51Um9vdENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogY29udGV4dFZhbHVlLFxuICAgIGNoaWxkcmVuOiAvKiNfX1BVUkVfXyovX2pzeChNZW51Um9vdCwge1xuICAgICAgLi4ucHJvcHNcbiAgICB9KVxuICB9KTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCB7IEVNUFRZX09CSkVDVCwgRU1QVFlfQVJSQVkgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZUNvbXBvc2l0ZUl0ZW0gfSBmcm9tIFwiLi91c2VDb21wb3NpdGVJdGVtLmpzXCI7XG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29tcG9zaXRlSXRlbShjb21wb25lbnRQcm9wcykge1xuICBjb25zdCB7XG4gICAgcmVuZGVyLFxuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZSxcbiAgICBzdGF0ZSA9IEVNUFRZX09CSkVDVCxcbiAgICBwcm9wcyA9IEVNUFRZX0FSUkFZLFxuICAgIHJlZnMgPSBFTVBUWV9BUlJBWSxcbiAgICBtZXRhZGF0YSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLFxuICAgIHRhZyA9ICdkaXYnLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBjb21wb3NpdGVQcm9wcyxcbiAgICBjb21wb3NpdGVSZWZcbiAgfSA9IHVzZUNvbXBvc2l0ZUl0ZW0oe1xuICAgIG1ldGFkYXRhXG4gIH0pO1xuICByZXR1cm4gdXNlUmVuZGVyRWxlbWVudCh0YWcsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBbLi4ucmVmcywgY29tcG9zaXRlUmVmXSxcbiAgICBwcm9wczogW2NvbXBvc2l0ZVByb3BzLCAuLi5wcm9wcywgZWxlbWVudFByb3BzXSxcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nXG4gIH0pO1xufSIsImltcG9ydCB7IGdldFBhcmVudE5vZGUsIGlzSFRNTEVsZW1lbnQsIGlzTGFzdFRyYXZlcnNhYmxlTm9kZSB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRSb290T3duZXJJZChub2RlKSB7XG4gIGlmIChpc0hUTUxFbGVtZW50KG5vZGUpICYmIG5vZGUuaGFzQXR0cmlidXRlKCdkYXRhLXJvb3Rvd25lcmlkJykpIHtcbiAgICByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcm9vdG93bmVyaWQnKSA/PyB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKGlzTGFzdFRyYXZlcnNhYmxlTm9kZShub2RlKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIGZpbmRSb290T3duZXJJZChnZXRQYXJlbnROb2RlKG5vZGUpKTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgeyBjb250YWlucywgZ2V0TmV4dFRhYmJhYmxlLCBnZXRUYWJiYWJsZUFmdGVyRWxlbWVudCwgZ2V0VGFiYmFibGVCZWZvcmVFbGVtZW50LCBpc091dHNpZGVFdmVudCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC91dGlscy5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcblxuLyoqXG4gKiBNaW5pbWFsIHN0b3JlIGludGVyZmFjZSByZXF1aXJlZCBieSB0aGUgZm9jdXMgZ3VhcmQgaG9vay5cbiAqIEJvdGggUG9wb3ZlclN0b3JlIGFuZCBNZW51U3RvcmUgc2F0aXNmeSB0aGlzIGludGVyZmFjZS5cbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIGZvY3VzIGd1YXJkIGhhbmRsZXJzIGZvciBwb3B1cCB0cmlnZ2VycyAoUG9wb3ZlciwgTWVudSkuXG4gKlxuICogV2hlbiB0aGUgcG9wdXAgaXMgb3BlbiwgaW52aXNpYmxlIGZvY3VzIGd1YXJkIGVsZW1lbnRzIGFyZSBwbGFjZWQgYmVmb3JlIGFuZCBhZnRlclxuICogdGhlIHRyaWdnZXIuIFRoZXNlIGhhbmRsZXJzIGNsb3NlIHRoZSBwb3B1cCBhbmQgbW92ZSBmb2N1cyB0byB0aGUgYXBwcm9wcmlhdGVcbiAqIHRhYmJhYmxlIGVsZW1lbnQgd2hlbiB0aGUgZ3VhcmRzIHJlY2VpdmUgZm9jdXMgKGkuZS4gd2hlbiB0aGUgdXNlciB0YWJzIG91dCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VUcmlnZ2VyRm9jdXNHdWFyZHMoc3RvcmUsIHRyaWdnZXJFbGVtZW50UmVmKSB7XG4gIGNvbnN0IHByZUZvY3VzR3VhcmRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGZ1bmN0aW9uIGhhbmRsZVByZUZvY3VzR3VhcmRGb2N1cyhldmVudCkge1xuICAgIFJlYWN0RE9NLmZsdXNoU3luYygoKSA9PiB7XG4gICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5mb2N1c091dCwgZXZlbnQubmF0aXZlRXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpKTtcbiAgICB9KTtcbiAgICBjb25zdCBwcmV2aW91c1RhYmJhYmxlID0gZ2V0VGFiYmFibGVCZWZvcmVFbGVtZW50KHByZUZvY3VzR3VhcmRSZWYuY3VycmVudCk7XG4gICAgcHJldmlvdXNUYWJiYWJsZT8uZm9jdXMoKTtcbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVGb2N1c1RhcmdldEZvY3VzKGV2ZW50KSB7XG4gICAgY29uc3QgcG9zaXRpb25lckVsZW1lbnQgPSBzdG9yZS5zZWxlY3QoJ3Bvc2l0aW9uZXJFbGVtZW50Jyk7XG4gICAgaWYgKHBvc2l0aW9uZXJFbGVtZW50ICYmIGlzT3V0c2lkZUV2ZW50KGV2ZW50LCBwb3NpdGlvbmVyRWxlbWVudCkpIHtcbiAgICAgIHN0b3JlLmNvbnRleHQuYmVmb3JlQ29udGVudEZvY3VzR3VhcmRSZWYuY3VycmVudD8uZm9jdXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgUmVhY3RET00uZmx1c2hTeW5jKCgpID0+IHtcbiAgICAgICAgc3RvcmUuc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMuZm9jdXNPdXQsIGV2ZW50Lm5hdGl2ZUV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KSk7XG4gICAgICB9KTtcbiAgICAgIGxldCBuZXh0VGFiYmFibGUgPSBnZXRUYWJiYWJsZUFmdGVyRWxlbWVudChzdG9yZS5jb250ZXh0LnRyaWdnZXJGb2N1c1RhcmdldFJlZi5jdXJyZW50IHx8IHRyaWdnZXJFbGVtZW50UmVmLmN1cnJlbnQpO1xuICAgICAgd2hpbGUgKG5leHRUYWJiYWJsZSAhPT0gbnVsbCAmJiBjb250YWlucyhwb3NpdGlvbmVyRWxlbWVudCwgbmV4dFRhYmJhYmxlKSkge1xuICAgICAgICBjb25zdCBwcmV2VGFiYmFibGUgPSBuZXh0VGFiYmFibGU7XG4gICAgICAgIG5leHRUYWJiYWJsZSA9IGdldE5leHRUYWJiYWJsZShuZXh0VGFiYmFibGUpO1xuICAgICAgICBpZiAobmV4dFRhYmJhYmxlID09PSBwcmV2VGFiYmFibGUpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbmV4dFRhYmJhYmxlPy5mb2N1cygpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIHByZUZvY3VzR3VhcmRSZWYsXG4gICAgaGFuZGxlUHJlRm9jdXNHdWFyZEZvY3VzLFxuICAgIGhhbmRsZUZvY3VzVGFyZ2V0Rm9jdXNcbiAgfTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG93bmVyRG9jdW1lbnQgfSBmcm9tICdAYmFzZS11aS91dGlscy9vd25lcic7XG5pbXBvcnQgeyBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG4vKipcbiAqIFJldHVybnMgYGNsaWNrYCBhbmQgYG1vdXNlZG93bmAgaGFuZGxlcnMgdGhhdCBmaXggdGhlIGJlaGF2aW9yIG9mIHRyaWdnZXJzIG9mIHBvcHVwcyB0aGF0IGFyZSB0b2dnbGVkIGJ5IGRpZmZlcmVudCBldmVudHMuXG4gKiBGb3IgZXhhbXBsZSwgYSBidXR0b24gdGhhdCBvcGVucyBhIHBvcHVwIG9uIG1vdXNlZG93biBhbmQgY2xvc2VzIGl0IG9uIGNsaWNrLlxuICogVGhpcyBob29rIHByZXZlbnRzIHRoZSBwb3B1cCBmcm9tIGNsb3NpbmcgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIG1vdXNlIGJ1dHRvbiBpcyByZWxlYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1peGVkVG9nZ2xlQ2xpY2tIYW5kbGVyKHBhcmFtcykge1xuICBjb25zdCB7XG4gICAgZW5hYmxlZCA9IHRydWUsXG4gICAgbW91c2VEb3duQWN0aW9uLFxuICAgIG9wZW5cbiAgfSA9IHBhcmFtcztcbiAgY29uc3QgaWdub3JlQ2xpY2tSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm4gRU1QVFlfT0JKRUNUO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgb25Nb3VzZURvd246IGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKG1vdXNlRG93bkFjdGlvbiA9PT0gJ29wZW4nICYmICFvcGVuIHx8IG1vdXNlRG93bkFjdGlvbiA9PT0gJ2Nsb3NlJyAmJiBvcGVuKSB7XG4gICAgICAgICAgaWdub3JlQ2xpY2tSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgb3duZXJEb2N1bWVudChldmVudC5jdXJyZW50VGFyZ2V0KS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIGlnbm9yZUNsaWNrUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBvbmNlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvbkNsaWNrOiBldmVudCA9PiB7XG4gICAgICAgIGlmIChpZ25vcmVDbGlja1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgaWdub3JlQ2xpY2tSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGV2ZW50LnByZXZlbnRCYXNlVUlIYW5kbGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9LCBbZW5hYmxlZCwgbW91c2VEb3duQWN0aW9uLCBvcGVuXSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgX2Zvcm1hdEVycm9yTWVzc2FnZSBmcm9tIFwiQGJhc2UtdWkvdXRpbHMvZm9ybWF0RXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgZmFzdENvbXBvbmVudFJlZiB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2Zhc3RIb29rcyc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyBzYWZlUG9seWdvbiwgdXNlQ2xpY2ssIHVzZUZsb2F0aW5nVHJlZSwgdXNlRm9jdXMsIHVzZUhvdmVyUmVmZXJlbmNlSW50ZXJhY3Rpb24sIHVzZUZsb2F0aW5nTm9kZUlkLCB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgRmxvYXRpbmdUcmVlU3RvcmUgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvY29tcG9uZW50cy9GbG9hdGluZ1RyZWVTdG9yZS5qc1wiO1xuaW1wb3J0IHsgY29udGFpbnMgfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMuanNcIjtcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgcHJlc3NhYmxlVHJpZ2dlck9wZW5TdGF0ZU1hcHBpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBTdGF0ZU1hcHBpbmcuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlLWJ1dHRvbi91c2VCdXR0b24uanNcIjtcbmltcG9ydCB7IGdldFBzZXVkb0VsZW1lbnRCb3VuZHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZ2V0UHNldWRvRWxlbWVudEJvdW5kcy5qc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlSXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29tcG9zaXRlL2l0ZW0vQ29tcG9zaXRlSXRlbS5qc1wiO1xuaW1wb3J0IHsgdXNlQ29tcG9zaXRlUm9vdENvbnRleHQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9yb290L0NvbXBvc2l0ZVJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBmaW5kUm9vdE93bmVySWQgfSBmcm9tIFwiLi4vdXRpbHMvZmluZFJvb3RPd25lcklkLmpzXCI7XG5pbXBvcnQgeyB1c2VUcmlnZ2VyRGF0YUZvcndhcmRpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyB1c2VUcmlnZ2VyRm9jdXNHdWFyZHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBzL3VzZVRyaWdnZXJGb2N1c0d1YXJkcy5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyB1c2VNaXhlZFRvZ2dsZUNsaWNrSGFuZGxlciB9IGZyb20gXCIuLi8uLi91dGlscy91c2VNaXhlZFRvZ2dsZUNsaWNrSGFuZGxlci5qc1wiO1xuaW1wb3J0IHsgdXNlQ29udGV4dE1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi8uLi9jb250ZXh0LW1lbnUvcm9vdC9Db250ZXh0TWVudVJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51YmFyQ29udGV4dCB9IGZyb20gXCIuLi8uLi9tZW51YmFyL01lbnViYXJDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBQQVRJRU5UX0NMSUNLX1RIUkVTSE9MRCB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY29uc3RhbnRzLmpzXCI7XG5pbXBvcnQgeyBGb2N1c0d1YXJkIH0gZnJvbSBcIi4uLy4uL3V0aWxzL0ZvY3VzR3VhcmQuanNcIjtcbmltcG9ydCB7IG1lcmdlUHJvcHMgfSBmcm9tIFwiLi4vLi4vbWVyZ2UtcHJvcHMvaW5kZXguanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4LCBqc3hzIGFzIF9qc3hzIH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5jb25zdCBCT1VOREFSWV9PRkZTRVQgPSAyO1xuXG4vKipcbiAqIEEgYnV0dG9uIHRoYXQgb3BlbnMgdGhlIG1lbnUuXG4gKiBSZW5kZXJzIGEgYDxidXR0b24+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5leHBvcnQgY29uc3QgTWVudVRyaWdnZXIgPSBmYXN0Q29tcG9uZW50UmVmKGZ1bmN0aW9uIE1lbnVUcmlnZ2VyKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkUHJvcCA9IGZhbHNlLFxuICAgIG5hdGl2ZUJ1dHRvbiA9IHRydWUsXG4gICAgaWQ6IGlkUHJvcCxcbiAgICBvcGVuT25Ib3Zlcjogb3Blbk9uSG92ZXJQcm9wLFxuICAgIGRlbGF5ID0gMTAwLFxuICAgIGNsb3NlRGVsYXkgPSAwLFxuICAgIGhhbmRsZSxcbiAgICBwYXlsb2FkLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gdXNlTWVudVJvb3RDb250ZXh0KHRydWUpO1xuICBjb25zdCBzdG9yZSA9IGhhbmRsZT8uc3RvcmUgPz8gcm9vdENvbnRleHQ/LnN0b3JlO1xuICBpZiAoIXN0b3JlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/ICdCYXNlIFVJOiA8TWVudS5UcmlnZ2VyPiBtdXN0IGJlIGVpdGhlciB1c2VkIHdpdGhpbiBhIDxNZW51LlJvb3Q+IGNvbXBvbmVudCBvciBwcm92aWRlZCB3aXRoIGEgaGFuZGxlLicgOiBfZm9ybWF0RXJyb3JNZXNzYWdlKDg1KSk7XG4gIH1cbiAgY29uc3QgdGhpc1RyaWdnZXJJZCA9IHVzZUJhc2VVaUlkKGlkUHJvcCk7XG4gIGNvbnN0IGlzVHJpZ2dlckFjdGl2ZSA9IHN0b3JlLnVzZVN0YXRlKCdpc1RyaWdnZXJBY3RpdmUnLCB0aGlzVHJpZ2dlcklkKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IGlzT3BlbmVkQnlUaGlzVHJpZ2dlciA9IHN0b3JlLnVzZVN0YXRlKCdpc09wZW5lZEJ5VHJpZ2dlcicsIHRoaXNUcmlnZ2VySWQpO1xuICBjb25zdCBwb3B1cElkID0gc3RvcmUudXNlU3RhdGUoJ3RyaWdnZXJQb3B1cElkJywgdGhpc1RyaWdnZXJJZCk7XG4gIGNvbnN0IHRyaWdnZXJFbGVtZW50UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBwYXJlbnQgPSB1c2VNZW51UGFyZW50KCk7XG4gIGNvbnN0IGNvbXBvc2l0ZVJvb3RDb250ZXh0ID0gdXNlQ29tcG9zaXRlUm9vdENvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IGZsb2F0aW5nVHJlZVJvb3RGcm9tQ29udGV4dCA9IHVzZUZsb2F0aW5nVHJlZSgpO1xuICBjb25zdCBmbG9hdGluZ1RyZWVSb290ID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGZsb2F0aW5nVHJlZVJvb3RGcm9tQ29udGV4dCA/PyBuZXcgRmxvYXRpbmdUcmVlU3RvcmUoKTtcbiAgfSwgW2Zsb2F0aW5nVHJlZVJvb3RGcm9tQ29udGV4dF0pO1xuICBjb25zdCBmbG9hdGluZ05vZGVJZCA9IHVzZUZsb2F0aW5nTm9kZUlkKGZsb2F0aW5nVHJlZVJvb3QpO1xuICBjb25zdCBmbG9hdGluZ1BhcmVudE5vZGVJZCA9IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkKCk7XG4gIGNvbnN0IHtcbiAgICByZWdpc3RlclRyaWdnZXIsXG4gICAgaXNNb3VudGVkQnlUaGlzVHJpZ2dlclxuICB9ID0gdXNlVHJpZ2dlckRhdGFGb3J3YXJkaW5nKHRoaXNUcmlnZ2VySWQsIHRyaWdnZXJFbGVtZW50UmVmLCBzdG9yZSwge1xuICAgIHBheWxvYWQsXG4gICAgY2xvc2VEZWxheSxcbiAgICBwYXJlbnQsXG4gICAgZmxvYXRpbmdUcmVlUm9vdCxcbiAgICBmbG9hdGluZ05vZGVJZCxcbiAgICBmbG9hdGluZ1BhcmVudE5vZGVJZCxcbiAgICBrZXlib2FyZEV2ZW50UmVsYXk6IGNvbXBvc2l0ZVJvb3RDb250ZXh0Py5yZWxheUtleWJvYXJkRXZlbnRcbiAgfSk7XG4gIGNvbnN0IGlzSW5NZW51YmFyID0gcGFyZW50LnR5cGUgPT09ICdtZW51YmFyJztcbiAgY29uc3Qgcm9vdERpc2FibGVkID0gc3RvcmUudXNlU3RhdGUoJ2Rpc2FibGVkJyk7XG4gIGNvbnN0IGRpc2FibGVkID0gZGlzYWJsZWRQcm9wIHx8IHJvb3REaXNhYmxlZCB8fCBpc0luTWVudWJhciAmJiBwYXJlbnQuY29udGV4dC5kaXNhYmxlZDtcbiAgY29uc3Qge1xuICAgIGdldEJ1dHRvblByb3BzLFxuICAgIGJ1dHRvblJlZlxuICB9ID0gdXNlQnV0dG9uKHtcbiAgICBkaXNhYmxlZCxcbiAgICBuYXRpdmU6IG5hdGl2ZUJ1dHRvblxuICB9KTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWlzT3BlbmVkQnlUaGlzVHJpZ2dlciAmJiBwYXJlbnQudHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdG9yZS5jb250ZXh0LmFsbG93TW91c2VVcFRyaWdnZXJSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH1cbiAgfSwgW3N0b3JlLCBpc09wZW5lZEJ5VGhpc1RyaWdnZXIsIHBhcmVudC50eXBlXSk7XG4gIGNvbnN0IHRyaWdnZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGFsbG93TW91c2VVcFRyaWdnZXJUaW1lb3V0ID0gdXNlVGltZW91dCgpO1xuICBjb25zdCBoYW5kbGVEb2N1bWVudE1vdXNlVXAgPSB1c2VTdGFibGVDYWxsYmFjayhtb3VzZUV2ZW50ID0+IHtcbiAgICBpZiAoIXRyaWdnZXJSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhbGxvd01vdXNlVXBUcmlnZ2VyVGltZW91dC5jbGVhcigpO1xuICAgIHN0b3JlLmNvbnRleHQuYWxsb3dNb3VzZVVwVHJpZ2dlclJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgY29uc3QgbW91c2VVcFRhcmdldCA9IG1vdXNlRXZlbnQudGFyZ2V0O1xuICAgIGlmIChjb250YWlucyh0cmlnZ2VyUmVmLmN1cnJlbnQsIG1vdXNlVXBUYXJnZXQpIHx8IGNvbnRhaW5zKHN0b3JlLnNlbGVjdCgncG9zaXRpb25lckVsZW1lbnQnKSwgbW91c2VVcFRhcmdldCkgfHwgbW91c2VVcFRhcmdldCA9PT0gdHJpZ2dlclJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb3VzZVVwVGFyZ2V0ICE9IG51bGwgJiYgZmluZFJvb3RPd25lcklkKG1vdXNlVXBUYXJnZXQpID09PSBzdG9yZS5zZWxlY3QoJ3Jvb3RJZCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJvdW5kcyA9IGdldFBzZXVkb0VsZW1lbnRCb3VuZHModHJpZ2dlclJlZi5jdXJyZW50KTtcbiAgICBpZiAobW91c2VFdmVudC5jbGllbnRYID49IGJvdW5kcy5sZWZ0IC0gQk9VTkRBUllfT0ZGU0VUICYmIG1vdXNlRXZlbnQuY2xpZW50WCA8PSBib3VuZHMucmlnaHQgKyBCT1VOREFSWV9PRkZTRVQgJiYgbW91c2VFdmVudC5jbGllbnRZID49IGJvdW5kcy50b3AgLSBCT1VOREFSWV9PRkZTRVQgJiYgbW91c2VFdmVudC5jbGllbnRZIDw9IGJvdW5kcy5ib3R0b20gKyBCT1VOREFSWV9PRkZTRVQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZmxvYXRpbmdUcmVlUm9vdC5ldmVudHMuZW1pdCgnY2xvc2UnLCB7XG4gICAgICBkb21FdmVudDogbW91c2VFdmVudCxcbiAgICAgIHJlYXNvbjogUkVBU09OUy5jYW5jZWxPcGVuXG4gICAgfSk7XG4gIH0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc09wZW5lZEJ5VGhpc1RyaWdnZXIgJiYgc3RvcmUuc2VsZWN0KCdsYXN0T3BlbkNoYW5nZVJlYXNvbicpID09PSBSRUFTT05TLnRyaWdnZXJIb3Zlcikge1xuICAgICAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudCh0cmlnZ2VyUmVmLmN1cnJlbnQpO1xuICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVEb2N1bWVudE1vdXNlVXAsIHtcbiAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9LCBbaXNPcGVuZWRCeVRoaXNUcmlnZ2VyLCBoYW5kbGVEb2N1bWVudE1vdXNlVXAsIHN0b3JlXSk7XG4gIGNvbnN0IHBhcmVudE1lbnViYXJIYXNTdWJtZW51T3BlbiA9IGlzSW5NZW51YmFyICYmIHBhcmVudC5jb250ZXh0Lmhhc1N1Ym1lbnVPcGVuO1xuICBjb25zdCBvcGVuT25Ib3ZlciA9IG9wZW5PbkhvdmVyUHJvcCA/PyBwYXJlbnRNZW51YmFySGFzU3VibWVudU9wZW47XG4gIGNvbnN0IGhvdmVyUHJvcHMgPSB1c2VIb3ZlclJlZmVyZW5jZUludGVyYWN0aW9uKGZsb2F0aW5nUm9vdENvbnRleHQsIHtcbiAgICBlbmFibGVkOiBvcGVuT25Ib3ZlciAmJiAhZGlzYWJsZWQgJiYgcGFyZW50LnR5cGUgIT09ICdjb250ZXh0LW1lbnUnICYmICghaXNJbk1lbnViYXIgfHwgcGFyZW50TWVudWJhckhhc1N1Ym1lbnVPcGVuICYmICFpc01vdW50ZWRCeVRoaXNUcmlnZ2VyKSxcbiAgICBoYW5kbGVDbG9zZTogc2FmZVBvbHlnb24oe1xuICAgICAgYmxvY2tQb2ludGVyRXZlbnRzOiAhaXNJbk1lbnViYXJcbiAgICB9KSxcbiAgICBtb3VzZU9ubHk6IHRydWUsXG4gICAgbW92ZTogZmFsc2UsXG4gICAgcmVzdE1zOiBwYXJlbnQudHlwZSA9PT0gdW5kZWZpbmVkID8gZGVsYXkgOiB1bmRlZmluZWQsXG4gICAgZGVsYXk6IHtcbiAgICAgIGNsb3NlOiBjbG9zZURlbGF5XG4gICAgfSxcbiAgICB0cmlnZ2VyRWxlbWVudFJlZixcbiAgICBleHRlcm5hbFRyZWU6IGZsb2F0aW5nVHJlZVJvb3QsXG4gICAgaXNBY3RpdmVUcmlnZ2VyOiBpc1RyaWdnZXJBY3RpdmUsXG4gICAgaXNDbG9zaW5nOiAoKSA9PiBzdG9yZS5zZWxlY3QoJ3RyYW5zaXRpb25TdGF0dXMnKSA9PT0gJ2VuZGluZydcbiAgfSk7XG5cbiAgLy8gV2hldGhlciB0byBpZ25vcmUgY2xpY2tzIHRvIG9wZW4gdGhlIG1lbnUuXG4gIC8vIGBsYXN0T3BlbkNoYW5nZVJlYXNvbmAgZG9lc24ndCBuZWVkIHRvIGJlIHJlYWN0aXZlIGhlcmUsIGFzIHdlIG5lZWQgdG8gcnVuIHRoaXNcbiAgLy8gb25seSB3aGVuIGBpc09wZW5lZEJ5VGhpc1RyaWdnZXJgIGNoYW5nZXMuXG4gIGNvbnN0IHN0aWNrSWZPcGVuID0gdXNlU3RpY2tJZk9wZW4oaXNPcGVuZWRCeVRoaXNUcmlnZ2VyLCBzdG9yZS5zZWxlY3QoJ2xhc3RPcGVuQ2hhbmdlUmVhc29uJykpO1xuICBjb25zdCBjbGljayA9IHVzZUNsaWNrKGZsb2F0aW5nUm9vdENvbnRleHQsIHtcbiAgICBlbmFibGVkOiAhZGlzYWJsZWQgJiYgcGFyZW50LnR5cGUgIT09ICdjb250ZXh0LW1lbnUnLFxuICAgIGV2ZW50OiBpc09wZW5lZEJ5VGhpc1RyaWdnZXIgJiYgaXNJbk1lbnViYXIgPyAnY2xpY2snIDogJ21vdXNlZG93bicsXG4gICAgdG9nZ2xlOiB0cnVlLFxuICAgIGlnbm9yZU1vdXNlOiBmYWxzZSxcbiAgICBzdGlja0lmT3BlbjogcGFyZW50LnR5cGUgPT09IHVuZGVmaW5lZCA/IHN0aWNrSWZPcGVuIDogZmFsc2VcbiAgfSk7XG4gIGNvbnN0IGZvY3VzID0gdXNlRm9jdXMoZmxvYXRpbmdSb290Q29udGV4dCwge1xuICAgIGVuYWJsZWQ6ICFkaXNhYmxlZCAmJiBwYXJlbnRNZW51YmFySGFzU3VibWVudU9wZW5cbiAgfSk7XG4gIGNvbnN0IG1peGVkVG9nZ2xlSGFuZGxlcnMgPSB1c2VNaXhlZFRvZ2dsZUNsaWNrSGFuZGxlcih7XG4gICAgb3BlbjogaXNPcGVuZWRCeVRoaXNUcmlnZ2VyLFxuICAgIGVuYWJsZWQ6IGlzSW5NZW51YmFyLFxuICAgIG1vdXNlRG93bkFjdGlvbjogJ29wZW4nXG4gIH0pO1xuICBjb25zdCBsb2NhbEludGVyYWN0aW9uUHJvcHMgPSBSZWFjdC51c2VNZW1vKCgpID0+IG1lcmdlUHJvcHMoZm9jdXMucmVmZXJlbmNlLCBjbGljay5yZWZlcmVuY2UpLCBbZm9jdXMucmVmZXJlbmNlLCBjbGljay5yZWZlcmVuY2VdKTtcbiAgY29uc3Qgcm9vdFRyaWdnZXJQcm9wcyA9IHN0b3JlLnVzZVN0YXRlKCd0cmlnZ2VyUHJvcHMnLCBpc01vdW50ZWRCeVRoaXNUcmlnZ2VyKTtcbiAgY29uc3Qge1xuICAgIHByZUZvY3VzR3VhcmRSZWYsXG4gICAgaGFuZGxlUHJlRm9jdXNHdWFyZEZvY3VzLFxuICAgIGhhbmRsZUZvY3VzVGFyZ2V0Rm9jdXNcbiAgfSA9IHVzZVRyaWdnZXJGb2N1c0d1YXJkcyhzdG9yZSwgdHJpZ2dlckVsZW1lbnRSZWYpO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBkaXNhYmxlZCxcbiAgICBvcGVuOiBpc09wZW5lZEJ5VGhpc1RyaWdnZXJcbiAgfTtcbiAgY29uc3QgcmVmID0gW3RyaWdnZXJSZWYsIGZvcndhcmRlZFJlZiwgYnV0dG9uUmVmLCByZWdpc3RlclRyaWdnZXIsIHRyaWdnZXJFbGVtZW50UmVmXTtcbiAgY29uc3QgcHJvcHMgPSBbbG9jYWxJbnRlcmFjdGlvblByb3BzLCBob3ZlclByb3BzID8/IEVNUFRZX09CSkVDVCwgcm9vdFRyaWdnZXJQcm9wcywge1xuICAgICdhcmlhLWhhc3BvcHVwJzogJ21lbnUnLFxuICAgICdhcmlhLWNvbnRyb2xzJzogcG9wdXBJZCxcbiAgICBpZDogdGhpc1RyaWdnZXJJZCxcbiAgICBvbk1vdXNlRG93bjogZXZlbnQgPT4ge1xuICAgICAgaWYgKHN0b3JlLnNlbGVjdCgnb3BlbicpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gbW91c2Vkb3duIC0+IG1vdXNldXAgb24gbWVudSBpdGVtIHNob3VsZCBub3QgdHJpZ2dlciBpdCB3aXRoaW4gMjAwbXMuXG4gICAgICBhbGxvd01vdXNlVXBUcmlnZ2VyVGltZW91dC5zdGFydCgyMDAsICgpID0+IHtcbiAgICAgICAgc3RvcmUuY29udGV4dC5hbGxvd01vdXNlVXBUcmlnZ2VyUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgfSk7XG4gICAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVEb2N1bWVudE1vdXNlVXAsIHtcbiAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9LCBpc0luTWVudWJhciA/IHtcbiAgICByb2xlOiAnbWVudWl0ZW0nXG4gIH0gOiB7fSwgbWl4ZWRUb2dnbGVIYW5kbGVycywgZWxlbWVudFByb3BzLCBnZXRCdXR0b25Qcm9wc107XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdidXR0b24nLCBjb21wb25lbnRQcm9wcywge1xuICAgIGVuYWJsZWQ6ICFpc0luTWVudWJhcixcbiAgICBzdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nOiBwcmVzc2FibGVUcmlnZ2VyT3BlblN0YXRlTWFwcGluZyxcbiAgICBzdGF0ZSxcbiAgICByZWYsXG4gICAgcHJvcHNcbiAgfSk7XG4gIGlmIChpc0luTWVudWJhcikge1xuICAgIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChDb21wb3NpdGVJdGVtLCB7XG4gICAgICB0YWc6IFwiYnV0dG9uXCIsXG4gICAgICByZW5kZXI6IHJlbmRlcixcbiAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgcmVmczogcmVmLFxuICAgICAgcHJvcHM6IHByb3BzLFxuICAgICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZzogcHJlc3NhYmxlVHJpZ2dlck9wZW5TdGF0ZU1hcHBpbmdcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEEgZnJhZ21lbnQgd2l0aCBrZXkgaXMgcmVxdWlyZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGBlbGVtZW50YCBpcyBtb3VudGVkIHRvIHRoZSBzYW1lIERPTSBub2RlXG4gIC8vIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgZm9jdXMgZ3VhcmRzIGFyZSByZW5kZXJlZCBvciBub3QuXG5cbiAgaWYgKGlzT3BlbmVkQnlUaGlzVHJpZ2dlcikge1xuICAgIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeHMoUmVhY3QuRnJhZ21lbnQsIHtcbiAgICAgIGNoaWxkcmVuOiBbLyojX19QVVJFX18qL19qc3goRm9jdXNHdWFyZCwge1xuICAgICAgICByZWY6IHByZUZvY3VzR3VhcmRSZWYsXG4gICAgICAgIG9uRm9jdXM6IGhhbmRsZVByZUZvY3VzR3VhcmRGb2N1c1xuICAgICAgfSwgYCR7dGhpc1RyaWdnZXJJZH0tcHJlLWZvY3VzLWd1YXJkYCksIC8qI19fUFVSRV9fKi9fanN4KFJlYWN0LkZyYWdtZW50LCB7XG4gICAgICAgIGNoaWxkcmVuOiBlbGVtZW50XG4gICAgICB9LCB0aGlzVHJpZ2dlcklkKSwgLyojX19QVVJFX18qL19qc3goRm9jdXNHdWFyZCwge1xuICAgICAgICByZWY6IHN0b3JlLmNvbnRleHQudHJpZ2dlckZvY3VzVGFyZ2V0UmVmLFxuICAgICAgICBvbkZvY3VzOiBoYW5kbGVGb2N1c1RhcmdldEZvY3VzXG4gICAgICB9LCBgJHt0aGlzVHJpZ2dlcklkfS1wb3N0LWZvY3VzLWd1YXJkYCldXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4KFJlYWN0LkZyYWdtZW50LCB7XG4gICAgY2hpbGRyZW46IGVsZW1lbnRcbiAgfSwgdGhpc1RyaWdnZXJJZCk7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVUcmlnZ2VyLmRpc3BsYXlOYW1lID0gXCJNZW51VHJpZ2dlclwiO1xuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gaWdub3JlIGNsaWNrcyBhZnRlciBhIGhvdmVyLW9wZW4uXG4gKi9cbmZ1bmN0aW9uIHVzZVN0aWNrSWZPcGVuKG9wZW4sIG9wZW5SZWFzb24pIHtcbiAgY29uc3Qgc3RpY2tJZk9wZW5UaW1lb3V0ID0gdXNlVGltZW91dCgpO1xuICBjb25zdCBbc3RpY2tJZk9wZW4sIHNldFN0aWNrSWZPcGVuXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAob3BlbiAmJiBvcGVuUmVhc29uID09PSAndHJpZ2dlci1ob3ZlcicpIHtcbiAgICAgIC8vIE9ubHkgYWxsb3cgXCJwYXRpZW50XCIgY2xpY2tzIHRvIGNsb3NlIHRoZSBtZW51IGlmIGl0J3Mgb3Blbi5cbiAgICAgIC8vIElmIHRoZXkgY2xpY2tlZCB3aXRoaW4gNTAwbXMgb2YgdGhlIG1lbnUgb3BlbmluZywga2VlcCBpdCBvcGVuLlxuICAgICAgc2V0U3RpY2tJZk9wZW4odHJ1ZSk7XG4gICAgICBzdGlja0lmT3BlblRpbWVvdXQuc3RhcnQoUEFUSUVOVF9DTElDS19USFJFU0hPTEQsICgpID0+IHtcbiAgICAgICAgc2V0U3RpY2tJZk9wZW4oZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghb3Blbikge1xuICAgICAgc3RpY2tJZk9wZW5UaW1lb3V0LmNsZWFyKCk7XG4gICAgICBzZXRTdGlja0lmT3BlbihmYWxzZSk7XG4gICAgfVxuICB9LCBbb3Blbiwgb3BlblJlYXNvbiwgc3RpY2tJZk9wZW5UaW1lb3V0XSk7XG4gIHJldHVybiBzdGlja0lmT3Blbjtcbn1cbmZ1bmN0aW9uIHVzZU1lbnVQYXJlbnQoKSB7XG4gIGNvbnN0IGNvbnRleHRNZW51Q29udGV4dCA9IHVzZUNvbnRleHRNZW51Um9vdENvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IHBhcmVudENvbnRleHQgPSB1c2VNZW51Um9vdENvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IG1lbnViYXJDb250ZXh0ID0gdXNlTWVudWJhckNvbnRleHQodHJ1ZSk7XG4gIGNvbnN0IHBhcmVudCA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChtZW51YmFyQ29udGV4dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ21lbnViYXInLFxuICAgICAgICBjb250ZXh0OiBtZW51YmFyQ29udGV4dFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgdGhpcyBpcyBub3QgYSBNZW51IG5lc3RlZCBpbnNpZGUgQ29udGV4dE1lbnUuVHJpZ2dlci5cbiAgICAvLyBDb250ZXh0TWVudSBwYXJlbnRDb250ZXh0IGlzIGFsd2F5cyB1bmRlZmluZWQgYXMgQ29udGV4dE1lbnUuUm9vdCBpcyBpbnN0YW50aWF0ZWQgd2l0aFxuICAgIC8vIDxNZW51Um9vdENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3VuZGVmaW5lZH0+XG4gICAgaWYgKGNvbnRleHRNZW51Q29udGV4dCAmJiAhcGFyZW50Q29udGV4dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ2NvbnRleHQtbWVudScsXG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHRNZW51Q29udGV4dFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sIFtjb250ZXh0TWVudUNvbnRleHQsIHBhcmVudENvbnRleHQsIG1lbnViYXJDb250ZXh0XSk7XG4gIHJldHVybiBwYXJlbnQ7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUFuaW1hdGlvbkZyYW1lJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VTdGFibGVDYWxsYmFjayB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVN0YWJsZUNhbGxiYWNrJztcbmltcG9ydCB7IE5PT1AsIEVNUFRZX09CSkVDVCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2VtcHR5JztcbmltcG9ydCB7IHVzZUFuaW1hdGlvbnNGaW5pc2hlZCB9IGZyb20gXCIuLi9pbnRlcm5hbHMvdXNlQW5pbWF0aW9uc0ZpbmlzaGVkLmpzXCI7XG5pbXBvcnQgeyBnZXRDc3NEaW1lbnNpb25zIH0gZnJvbSBcIi4vZ2V0Q3NzRGltZW5zaW9ucy5qc1wiO1xuY29uc3QgREVGQVVMVF9FTkFCTEVEID0gKCkgPT4gdHJ1ZTtcblxuLyoqXG4gKiBBbGxvd3MgdGhlIGVsZW1lbnQgdG8gYXV0b21hdGljYWxseSByZXNpemUgYmFzZWQgb24gaXRzIGNvbnRlbnQgd2hpbGUgc3VwcG9ydGluZyBhbmltYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUG9wdXBBdXRvUmVzaXplKHBhcmFtZXRlcnMpIHtcbiAgY29uc3Qge1xuICAgIHBvcHVwRWxlbWVudCxcbiAgICBwb3NpdGlvbmVyRWxlbWVudCxcbiAgICBjb250ZW50LFxuICAgIG1vdW50ZWQsXG4gICAgZW5hYmxlZCA9IERFRkFVTFRfRU5BQkxFRCxcbiAgICBvbk1lYXN1cmVMYXlvdXQ6IG9uTWVhc3VyZUxheW91dFBhcmFtLFxuICAgIG9uTWVhc3VyZUxheW91dENvbXBsZXRlOiBvbk1lYXN1cmVMYXlvdXRDb21wbGV0ZVBhcmFtLFxuICAgIHNpZGUsXG4gICAgZGlyZWN0aW9uXG4gIH0gPSBwYXJhbWV0ZXJzO1xuICBjb25zdCBydW5PbmNlQW5pbWF0aW9uc0ZpbmlzaCA9IHVzZUFuaW1hdGlvbnNGaW5pc2hlZChwb3B1cEVsZW1lbnQsIHRydWUsIGZhbHNlKTtcbiAgY29uc3QgYW5pbWF0aW9uRnJhbWUgPSB1c2VBbmltYXRpb25GcmFtZSgpO1xuICBjb25zdCBjb21taXR0ZWREaW1lbnNpb25zUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsaXZlRGltZW5zaW9uc1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgaXNJbml0aWFsUmVuZGVyUmVmID0gUmVhY3QudXNlUmVmKHRydWUpO1xuICBjb25zdCByZXN0b3JlQW5jaG9yaW5nU3R5bGVzUmVmID0gUmVhY3QudXNlUmVmKE5PT1ApO1xuICBjb25zdCBvbk1lYXN1cmVMYXlvdXQgPSB1c2VTdGFibGVDYWxsYmFjayhvbk1lYXN1cmVMYXlvdXRQYXJhbSk7XG4gIGNvbnN0IG9uTWVhc3VyZUxheW91dENvbXBsZXRlID0gdXNlU3RhYmxlQ2FsbGJhY2sob25NZWFzdXJlTGF5b3V0Q29tcGxldGVQYXJhbSk7XG4gIGNvbnN0IGFuY2hvcmluZ1N0eWxlcyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIEVuc3VyZSBwb3B1cCBzaXplIHRyYW5zaXRpb25zIGNvcnJlY3RseSB3aGVuIGFuY2hvcmVkIHRvIGBib3R0b21gIChzaWRlPXRvcCkgb3IgYHJpZ2h0YCAoc2lkZT1sZWZ0KS5cbiAgICBsZXQgaXNPcmlnaW5TaWRlID0gc2lkZSA9PT0gJ3RvcCc7XG4gICAgbGV0IGlzUGh5c2ljYWxMZWZ0ID0gc2lkZSA9PT0gJ2xlZnQnO1xuICAgIGlmIChkaXJlY3Rpb24gPT09ICdydGwnKSB7XG4gICAgICBpc09yaWdpblNpZGUgPSBpc09yaWdpblNpZGUgfHwgc2lkZSA9PT0gJ2lubGluZS1lbmQnO1xuICAgICAgaXNQaHlzaWNhbExlZnQgPSBpc1BoeXNpY2FsTGVmdCB8fCBzaWRlID09PSAnaW5saW5lLWVuZCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzT3JpZ2luU2lkZSA9IGlzT3JpZ2luU2lkZSB8fCBzaWRlID09PSAnaW5saW5lLXN0YXJ0JztcbiAgICAgIGlzUGh5c2ljYWxMZWZ0ID0gaXNQaHlzaWNhbExlZnQgfHwgc2lkZSA9PT0gJ2lubGluZS1zdGFydCc7XG4gICAgfVxuICAgIHJldHVybiBpc09yaWdpblNpZGUgPyB7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIFtzaWRlID09PSAndG9wJyA/ICdib3R0b20nIDogJ3RvcCddOiAnMCcsXG4gICAgICBbaXNQaHlzaWNhbExlZnQgPyAncmlnaHQnIDogJ2xlZnQnXTogJzAnXG4gICAgfSA6IEVNUFRZX09CSkVDVDtcbiAgfSwgW3NpZGUsIGRpcmVjdGlvbl0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIC8vIFJlc2V0IHRoZSBzdGF0ZSB3aGVuIHRoZSBwb3B1cCBpcyBjbG9zZWQuXG4gICAgaWYgKCFtb3VudGVkIHx8ICFlbmFibGVkKCkgfHwgdHlwZW9mIFJlc2l6ZU9ic2VydmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXN0b3JlQW5jaG9yaW5nU3R5bGVzUmVmLmN1cnJlbnQgPSBOT09QO1xuICAgICAgaXNJbml0aWFsUmVuZGVyUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgY29tbWl0dGVkRGltZW5zaW9uc1JlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIGxpdmVEaW1lbnNpb25zUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCFwb3B1cEVsZW1lbnQgfHwgIXBvc2l0aW9uZXJFbGVtZW50KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXN0b3JlQW5jaG9yaW5nU3R5bGVzUmVmLmN1cnJlbnQgPSBhcHBseUVsZW1lbnRTdHlsZXMocG9wdXBFbGVtZW50LCBhbmNob3JpbmdTdHlsZXMpO1xuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgICAgY29uc3QgZW50cnkgPSBlbnRyaWVzWzBdO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGxpdmVEaW1lbnNpb25zUmVmLmN1cnJlbnQgPSB7XG4gICAgICAgICAgd2lkdGg6IE1hdGguY2VpbChlbnRyeS5ib3JkZXJCb3hTaXplWzBdLmlubGluZVNpemUpLFxuICAgICAgICAgIGhlaWdodDogTWF0aC5jZWlsKGVudHJ5LmJvcmRlckJveFNpemVbMF0uYmxvY2tTaXplKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUocG9wdXBFbGVtZW50KTtcblxuICAgIC8vIE1lYXN1cmUgdGhlIHJlbmRlcmVkIHNpemUgdG8gZW5hYmxlIHRyYW5zaXRpb25zOlxuICAgIHNldFBvcHVwQ3NzU2l6ZShwb3B1cEVsZW1lbnQsICdhdXRvJyk7XG4gICAgY29uc3QgcmVzdG9yZVBvcHVwUG9zaXRpb24gPSBvdmVycmlkZUVsZW1lbnRTdHlsZShwb3B1cEVsZW1lbnQsICdwb3NpdGlvbicsICdzdGF0aWMnKTtcbiAgICBjb25zdCByZXN0b3JlUG9wdXBUcmFuc2Zvcm0gPSBvdmVycmlkZUVsZW1lbnRTdHlsZShwb3B1cEVsZW1lbnQsICd0cmFuc2Zvcm0nLCAnbm9uZScpO1xuICAgIGNvbnN0IHJlc3RvcmVQb3B1cFNjYWxlID0gb3ZlcnJpZGVFbGVtZW50U3R5bGUocG9wdXBFbGVtZW50LCAnc2NhbGUnLCAnMScpO1xuICAgIGNvbnN0IHJlc3RvcmVQb3NpdGlvbmVyQXZhaWxhYmxlU2l6ZSA9IGFwcGx5RWxlbWVudFN0eWxlcyhwb3NpdGlvbmVyRWxlbWVudCwge1xuICAgICAgJy0tYXZhaWxhYmxlLXdpZHRoJzogJ21heC1jb250ZW50JyxcbiAgICAgICctLWF2YWlsYWJsZS1oZWlnaHQnOiAnbWF4LWNvbnRlbnQnXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gcmVzdG9yZU1lYXN1cmVtZW50T3ZlcnJpZGVzKCkge1xuICAgICAgcmVzdG9yZVBvcHVwUG9zaXRpb24oKTtcbiAgICAgIHJlc3RvcmVQb3B1cFRyYW5zZm9ybSgpO1xuICAgICAgcmVzdG9yZVBvc2l0aW9uZXJBdmFpbGFibGVTaXplKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc3RvcmVNZWFzdXJlbWVudE92ZXJyaWRlc0luY2x1ZGluZ1NjYWxlKCkge1xuICAgICAgcmVzdG9yZU1lYXN1cmVtZW50T3ZlcnJpZGVzKCk7XG4gICAgICByZXN0b3JlUG9wdXBTY2FsZSgpO1xuICAgIH1cbiAgICBvbk1lYXN1cmVMYXlvdXQ/LigpO1xuXG4gICAgLy8gSW5pdGlhbCByZW5kZXIgKGZvciBlYWNoIHRpbWUgdGhlIHBvcHVwIG9wZW5zKS5cbiAgICBpZiAoaXNJbml0aWFsUmVuZGVyUmVmLmN1cnJlbnQgfHwgY29tbWl0dGVkRGltZW5zaW9uc1JlZi5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgICBzZXRQb3NpdGlvbmVyQ3NzU2l6ZShwb3NpdGlvbmVyRWxlbWVudCwgJ21heC1jb250ZW50Jyk7XG4gICAgICBjb25zdCBkaW1lbnNpb25zID0gZ2V0Q3NzRGltZW5zaW9ucyhwb3B1cEVsZW1lbnQpO1xuICAgICAgY29tbWl0dGVkRGltZW5zaW9uc1JlZi5jdXJyZW50ID0gZGltZW5zaW9ucztcbiAgICAgIHNldFBvc2l0aW9uZXJDc3NTaXplKHBvc2l0aW9uZXJFbGVtZW50LCBkaW1lbnNpb25zKTtcbiAgICAgIHJlc3RvcmVNZWFzdXJlbWVudE92ZXJyaWRlc0luY2x1ZGluZ1NjYWxlKCk7XG4gICAgICBvbk1lYXN1cmVMYXlvdXRDb21wbGV0ZT8uKG51bGwsIGRpbWVuc2lvbnMpO1xuICAgICAgaXNJbml0aWFsUmVuZGVyUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgcmVzdG9yZUFuY2hvcmluZ1N0eWxlc1JlZi5jdXJyZW50KCk7XG4gICAgICAgIHJlc3RvcmVBbmNob3JpbmdTdHlsZXNSZWYuY3VycmVudCA9IE5PT1A7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFN1YnNlcXVlbnQgcmVuZGVycyB3aGlsZSBvcGVuICh3aGVuIGBjb250ZW50YCBjaGFuZ2VzKS5cbiAgICBzZXRQb3B1cENzc1NpemUocG9wdXBFbGVtZW50LCAnYXV0bycpO1xuICAgIHNldFBvc2l0aW9uZXJDc3NTaXplKHBvc2l0aW9uZXJFbGVtZW50LCAnbWF4LWNvbnRlbnQnKTtcbiAgICBjb25zdCBwcmV2aW91c0RpbWVuc2lvbnMgPSBjb21taXR0ZWREaW1lbnNpb25zUmVmLmN1cnJlbnQgPz8gbGl2ZURpbWVuc2lvbnNSZWYuY3VycmVudDtcbiAgICBjb25zdCBuZXdEaW1lbnNpb25zID0gZ2V0Q3NzRGltZW5zaW9ucyhwb3B1cEVsZW1lbnQpO1xuXG4gICAgLy8gQ29tbWl0IGltbWVkaWF0ZWx5IHNvIGZ1dHVyZSBjb250ZW50IGNoYW5nZXMgaGF2ZSBhIHN0YWJsZSBwcmV2aW91cyBzaXplLCBldmVuIGlmXG4gICAgLy8gUmVzaXplT2JzZXJ2ZXIgcnVucyBhZnRlciB0aGlzIHBvaW50LlxuICAgIGNvbW1pdHRlZERpbWVuc2lvbnNSZWYuY3VycmVudCA9IG5ld0RpbWVuc2lvbnM7XG4gICAgaWYgKCFwcmV2aW91c0RpbWVuc2lvbnMpIHtcbiAgICAgIHNldFBvc2l0aW9uZXJDc3NTaXplKHBvc2l0aW9uZXJFbGVtZW50LCBuZXdEaW1lbnNpb25zKTtcbiAgICAgIHJlc3RvcmVNZWFzdXJlbWVudE92ZXJyaWRlc0luY2x1ZGluZ1NjYWxlKCk7XG4gICAgICBvbk1lYXN1cmVMYXlvdXRDb21wbGV0ZT8uKG51bGwsIG5ld0RpbWVuc2lvbnMpO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICBhbmltYXRpb25GcmFtZS5jYW5jZWwoKTtcbiAgICAgICAgcmVzdG9yZUFuY2hvcmluZ1N0eWxlc1JlZi5jdXJyZW50KCk7XG4gICAgICAgIHJlc3RvcmVBbmNob3JpbmdTdHlsZXNSZWYuY3VycmVudCA9IE5PT1A7XG4gICAgICB9O1xuICAgIH1cbiAgICBzZXRQb3B1cENzc1NpemUocG9wdXBFbGVtZW50LCBwcmV2aW91c0RpbWVuc2lvbnMpO1xuICAgIHJlc3RvcmVNZWFzdXJlbWVudE92ZXJyaWRlc0luY2x1ZGluZ1NjYWxlKCk7XG4gICAgb25NZWFzdXJlTGF5b3V0Q29tcGxldGU/LihwcmV2aW91c0RpbWVuc2lvbnMsIG5ld0RpbWVuc2lvbnMpO1xuICAgIHNldFBvc2l0aW9uZXJDc3NTaXplKHBvc2l0aW9uZXJFbGVtZW50LCBuZXdEaW1lbnNpb25zKTtcbiAgICBjb25zdCBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgYW5pbWF0aW9uRnJhbWUucmVxdWVzdCgoKSA9PiB7XG4gICAgICBzZXRQb3B1cENzc1NpemUocG9wdXBFbGVtZW50LCBuZXdEaW1lbnNpb25zKTtcbiAgICAgIHJ1bk9uY2VBbmltYXRpb25zRmluaXNoKCgpID0+IHtcbiAgICAgICAgcG9wdXBFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXBvcHVwLXdpZHRoJywgJ2F1dG8nKTtcbiAgICAgICAgcG9wdXBFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXBvcHVwLWhlaWdodCcsICdhdXRvJyk7XG4gICAgICB9LCBhYm9ydENvbnRyb2xsZXIuc2lnbmFsKTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICBhbmltYXRpb25GcmFtZS5jYW5jZWwoKTtcbiAgICAgIHJlc3RvcmVBbmNob3JpbmdTdHlsZXNSZWYuY3VycmVudCgpO1xuICAgICAgcmVzdG9yZUFuY2hvcmluZ1N0eWxlc1JlZi5jdXJyZW50ID0gTk9PUDtcbiAgICB9O1xuICB9LCBbY29udGVudCwgcG9wdXBFbGVtZW50LCBwb3NpdGlvbmVyRWxlbWVudCwgcnVuT25jZUFuaW1hdGlvbnNGaW5pc2gsIGFuaW1hdGlvbkZyYW1lLCBlbmFibGVkLCBtb3VudGVkLCBvbk1lYXN1cmVMYXlvdXQsIG9uTWVhc3VyZUxheW91dENvbXBsZXRlLCBhbmNob3JpbmdTdHlsZXNdKTtcbn1cbmZ1bmN0aW9uIG92ZXJyaWRlRWxlbWVudFN0eWxlKGVsZW1lbnQsIHByb3BlcnR5LCB2YWx1ZSkge1xuICBjb25zdCBvcmlnaW5hbFZhbHVlID0gZWxlbWVudC5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbiAgZWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wZXJ0eSwgdmFsdWUpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkocHJvcGVydHksIG9yaWdpbmFsVmFsdWUpO1xuICB9O1xufVxuZnVuY3Rpb24gYXBwbHlFbGVtZW50U3R5bGVzKGVsZW1lbnQsIHN0eWxlcykge1xuICBjb25zdCByZXN0b3JlcnMgPSBbXTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc3R5bGVzKSkge1xuICAgIHJlc3RvcmVycy5wdXNoKG92ZXJyaWRlRWxlbWVudFN0eWxlKGVsZW1lbnQsIGtleSwgdmFsdWUpKTtcbiAgfVxuICByZXR1cm4gcmVzdG9yZXJzLmxlbmd0aCA/ICgpID0+IHtcbiAgICByZXN0b3JlcnMuZm9yRWFjaChyZXN0b3JlID0+IHJlc3RvcmUoKSk7XG4gIH0gOiBOT09QO1xufVxuZnVuY3Rpb24gc2V0UG9wdXBDc3NTaXplKHBvcHVwRWxlbWVudCwgc2l6ZSkge1xuICBjb25zdCB3aWR0aCA9IHNpemUgPT09ICdhdXRvJyA/ICdhdXRvJyA6IGAke3NpemUud2lkdGh9cHhgO1xuICBjb25zdCBoZWlnaHQgPSBzaXplID09PSAnYXV0bycgPyAnYXV0bycgOiBgJHtzaXplLmhlaWdodH1weGA7XG4gIHBvcHVwRWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1wb3B1cC13aWR0aCcsIHdpZHRoKTtcbiAgcG9wdXBFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXBvcHVwLWhlaWdodCcsIGhlaWdodCk7XG59XG5mdW5jdGlvbiBzZXRQb3NpdGlvbmVyQ3NzU2l6ZShwb3NpdGlvbmVyRWxlbWVudCwgc2l6ZSkge1xuICBjb25zdCB3aWR0aCA9IHNpemUgPT09ICdtYXgtY29udGVudCcgPyAnbWF4LWNvbnRlbnQnIDogYCR7c2l6ZS53aWR0aH1weGA7XG4gIGNvbnN0IGhlaWdodCA9IHNpemUgPT09ICdtYXgtY29udGVudCcgPyAnbWF4LWNvbnRlbnQnIDogYCR7c2l6ZS5oZWlnaHR9cHhgO1xuICBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1wb3NpdGlvbmVyLXdpZHRoJywgd2lkdGgpO1xuICBwb3NpdGlvbmVyRWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1wb3NpdGlvbmVyLWhlaWdodCcsIGhlaWdodCk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgKiBhcyBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHsgaW5lcnRWYWx1ZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2luZXJ0VmFsdWUnO1xuaW1wb3J0IHsgdXNlQW5pbWF0aW9uRnJhbWUgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VBbmltYXRpb25GcmFtZSc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c1ZhbHVlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlUHJldmlvdXNWYWx1ZSc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgdXNlQW5pbWF0aW9uc0ZpbmlzaGVkIH0gZnJvbSBcIi4uL2ludGVybmFscy91c2VBbmltYXRpb25zRmluaXNoZWQuanNcIjtcbmltcG9ydCB7IHVzZVBvcHVwQXV0b1Jlc2l6ZSB9IGZyb20gXCIuL3VzZVBvcHVwQXV0b1Jlc2l6ZS5qc1wiO1xuaW1wb3J0IHsgdXNlRGlyZWN0aW9uIH0gZnJvbSBcIi4uL2RpcmVjdGlvbi1wcm92aWRlci9pbmRleC5qc1wiO1xuaW1wb3J0IHsganN4IGFzIF9qc3gsIGpzeHMgYXMgX2pzeHMgfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbi8qKlxuICogQnVpbGRzIG1vcnBoaW5nIHZpZXdwb3J0IGNvbnRhaW5lcnMgZm9yIHBvcHVwcyB0aGF0IGFuaW1hdGUgYmV0d2VlbiB0cmlnZ2VyLWJhc2VkIGNvbnRlbnQuXG4gKiBIYW5kbGVzIHByZXZpb3VzLWNvbnRlbnQgc25hcHNob3RzLCBhdXRvLXJlc2l6ZSwgYW5kIHN0YXRlIGF0dHJpYnV0ZXMgZm9yIHRyYW5zaXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUG9wdXBWaWV3cG9ydChwYXJhbWV0ZXJzKSB7XG4gIGNvbnN0IHtcbiAgICBzdG9yZSxcbiAgICBzaWRlLFxuICAgIGNzc1ZhcnMsXG4gICAgY2hpbGRyZW5cbiAgfSA9IHBhcmFtZXRlcnM7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IHVzZURpcmVjdGlvbigpO1xuICBjb25zdCBhY3RpdmVUcmlnZ2VyID0gc3RvcmUudXNlU3RhdGUoJ2FjdGl2ZVRyaWdnZXJFbGVtZW50Jyk7XG4gIGNvbnN0IGFjdGl2ZVRyaWdnZXJJZCA9IHN0b3JlLnVzZVN0YXRlKCdhY3RpdmVUcmlnZ2VySWQnKTtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IHBheWxvYWQgPSBzdG9yZS51c2VTdGF0ZSgncGF5bG9hZCcpO1xuICBjb25zdCBtb3VudGVkID0gc3RvcmUudXNlU3RhdGUoJ21vdW50ZWQnKTtcbiAgY29uc3QgcG9wdXBFbGVtZW50ID0gc3RvcmUudXNlU3RhdGUoJ3BvcHVwRWxlbWVudCcpO1xuICBjb25zdCBwb3NpdGlvbmVyRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdwb3NpdGlvbmVyRWxlbWVudCcpO1xuICBjb25zdCBwcmV2aW91c0FjdGl2ZVRyaWdnZXIgPSB1c2VQcmV2aW91c1ZhbHVlKG9wZW4gPyBhY3RpdmVUcmlnZ2VyIDogbnVsbCk7XG4gIC8vIFJlbW91bnQgY3VycmVudCBjb250ZW50IG9uIHRyaWdnZXIgY2hhbmdlcyAoYW5kIG9uY2UgbW9yZSB3aGVuIHBheWxvYWQgbGFncykgdG8gYXZvaWQgRE9NIHJldXNlIGZsYXNoZXMuXG4gIC8vIFRoZSBrZXkgYnVtcHMgaW1tZWRpYXRlbHkgb24gdHJpZ2dlciBzd2l0Y2hlcywgdGhlbiBhZ2FpbiBpZiB0aGUgcGF5bG9hZCBhcnJpdmVzIG9uIGEgbGF0ZXIgcmVuZGVyLlxuICBjb25zdCBjdXJyZW50Q29udGVudEtleSA9IHVzZVBvcHVwQ29udGVudEtleShhY3RpdmVUcmlnZ2VySWQsIHBheWxvYWQpO1xuICBjb25zdCBjYXB0dXJlZE5vZGVSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFtwcmV2aW91c0NvbnRlbnROb2RlLCBzZXRQcmV2aW91c0NvbnRlbnROb2RlXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbbmV3VHJpZ2dlck9mZnNldCwgc2V0TmV3VHJpZ2dlck9mZnNldF0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgY3VycmVudENvbnRhaW5lclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgcHJldmlvdXNDb250YWluZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IG9uQW5pbWF0aW9uc0ZpbmlzaGVkID0gdXNlQW5pbWF0aW9uc0ZpbmlzaGVkKGN1cnJlbnRDb250YWluZXJSZWYsIHRydWUsIGZhbHNlKTtcbiAgY29uc3QgY2xlYW51cEZyYW1lID0gdXNlQW5pbWF0aW9uRnJhbWUoKTtcbiAgY29uc3QgW3ByZXZpb3VzQ29udGVudERpbWVuc2lvbnMsIHNldFByZXZpb3VzQ29udGVudERpbWVuc2lvbnNdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtzaG93U3RhcnRpbmdTdHlsZUF0dHJpYnV0ZSwgc2V0U2hvd1N0YXJ0aW5nU3R5bGVBdHRyaWJ1dGVdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIHN0b3JlLnNldCgnaGFzVmlld3BvcnQnLCB0cnVlKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgc3RvcmUuc2V0KCdoYXNWaWV3cG9ydCcsIGZhbHNlKTtcbiAgICB9O1xuICB9LCBbc3RvcmVdKTtcbiAgY29uc3QgaGFuZGxlTWVhc3VyZUxheW91dCA9IHVzZVN0YWJsZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjdXJyZW50Q29udGFpbmVyUmVmLmN1cnJlbnQ/LnN0eWxlLnNldFByb3BlcnR5KCdhbmltYXRpb24nLCAnbm9uZScpO1xuICAgIGN1cnJlbnRDb250YWluZXJSZWYuY3VycmVudD8uc3R5bGUuc2V0UHJvcGVydHkoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuICAgIHByZXZpb3VzQ29udGFpbmVyUmVmLmN1cnJlbnQ/LnN0eWxlLnNldFByb3BlcnR5KCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgfSk7XG4gIGNvbnN0IGhhbmRsZU1lYXN1cmVMYXlvdXRDb21wbGV0ZSA9IHVzZVN0YWJsZUNhbGxiYWNrKHByZXZpb3VzRGltZW5zaW9ucyA9PiB7XG4gICAgY3VycmVudENvbnRhaW5lclJlZi5jdXJyZW50Py5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnYW5pbWF0aW9uJyk7XG4gICAgY3VycmVudENvbnRhaW5lclJlZi5jdXJyZW50Py5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndHJhbnNpdGlvbicpO1xuICAgIHByZXZpb3VzQ29udGFpbmVyUmVmLmN1cnJlbnQ/LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdkaXNwbGF5Jyk7XG4gICAgaWYgKHByZXZpb3VzRGltZW5zaW9ucykge1xuICAgICAgc2V0UHJldmlvdXNDb250ZW50RGltZW5zaW9ucyhwcmV2aW91c0RpbWVuc2lvbnMpO1xuICAgIH1cbiAgfSk7XG4gIGNvbnN0IGxhc3RIYW5kbGVkVHJpZ2dlclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAvLyBXaGVuIGEgdHJpZ2dlciBjaGFuZ2VzLCBzZXQgdGhlIGNhcHR1cmVkIGNoaWxkcmVuIEhUTUwgdG8gc3RhdGUsXG4gICAgLy8gc28gd2UgY2FuIHJlbmRlciBib3RoIG5ldyBhbmQgb2xkIGNvbnRlbnQuXG4gICAgaWYgKGFjdGl2ZVRyaWdnZXIgJiYgcHJldmlvdXNBY3RpdmVUcmlnZ2VyICYmIGFjdGl2ZVRyaWdnZXIgIT09IHByZXZpb3VzQWN0aXZlVHJpZ2dlciAmJiBsYXN0SGFuZGxlZFRyaWdnZXJSZWYuY3VycmVudCAhPT0gYWN0aXZlVHJpZ2dlciAmJiBjYXB0dXJlZE5vZGVSZWYuY3VycmVudCkge1xuICAgICAgc2V0UHJldmlvdXNDb250ZW50Tm9kZShjYXB0dXJlZE5vZGVSZWYuY3VycmVudCk7XG4gICAgICBzZXRTaG93U3RhcnRpbmdTdHlsZUF0dHJpYnV0ZSh0cnVlKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSByZWxhdGl2ZSBwb3NpdGlvbiBiZXR3ZWVuIHRoZSBwcmV2aW91cyBhbmQgbmV3IHRyaWdnZXIsXG4gICAgICAvLyBzbyB3ZSBjYW4gcGFzcyBpdCB0byB0aGUgc3R5bGUgaG9vayBmb3IgYW5pbWF0aW9uIHB1cnBvc2VzLlxuICAgICAgY29uc3Qgb2Zmc2V0ID0gY2FsY3VsYXRlUmVsYXRpdmVQb3NpdGlvbihwcmV2aW91c0FjdGl2ZVRyaWdnZXIsIGFjdGl2ZVRyaWdnZXIpO1xuICAgICAgc2V0TmV3VHJpZ2dlck9mZnNldChvZmZzZXQpO1xuICAgICAgY2xlYW51cEZyYW1lLnJlcXVlc3QoKCkgPT4ge1xuICAgICAgICBSZWFjdERPTS5mbHVzaFN5bmMoKCkgPT4ge1xuICAgICAgICAgIHNldFNob3dTdGFydGluZ1N0eWxlQXR0cmlidXRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG9uQW5pbWF0aW9uc0ZpbmlzaGVkKCgpID0+IHtcbiAgICAgICAgICBzZXRQcmV2aW91c0NvbnRlbnROb2RlKG51bGwpO1xuICAgICAgICAgIHNldFByZXZpb3VzQ29udGVudERpbWVuc2lvbnMobnVsbCk7XG4gICAgICAgICAgY2FwdHVyZWROb2RlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgbGFzdEhhbmRsZWRUcmlnZ2VyUmVmLmN1cnJlbnQgPSBhY3RpdmVUcmlnZ2VyO1xuICAgIH1cbiAgfSwgW2FjdGl2ZVRyaWdnZXIsIHByZXZpb3VzQWN0aXZlVHJpZ2dlciwgcHJldmlvdXNDb250ZW50Tm9kZSwgb25BbmltYXRpb25zRmluaXNoZWQsIGNsZWFudXBGcmFtZV0pO1xuXG4gIC8vIENhcHR1cmUgYSBjbG9uZSBvZiB0aGUgY3VycmVudCBjb250ZW50IERPTSBzdWJ0cmVlIHdoZW4gbm90IHRyYW5zaXRpb25pbmcuXG4gIC8vIFdlIGNhbid0IHN0b3JlIHByZXZpb3VzIFJlYWN0IG5vZGVzIGFzIHRoZXkgbWF5IGJlIHN0YXRlZnVsOyBpbnN0ZWFkIHdlIGNhcHR1cmUgRE9NIGNsb25lcyBmb3IgdmlzdWFsIGNvbnRpbnVpdHkuXG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgLy8gV2hlbiBhIHRyYW5zaXRpb24gaXMgaW4gcHJvZ3Jlc3MsIHdlIHN0b3JlIHRoZSBuZXh0IGNvbnRlbnQgaW4gY2FwdHVyZWROb2RlUmVmLlxuICAgIC8vIFRoaXMgaGFuZGxlcyB0aGUgY2FzZSB3aGVyZSB0aGUgdHJpZ2dlciBjaGFuZ2VzIG11bHRpcGxlIHRpbWVzIGJlZm9yZSB0aGUgdHJhbnNpdGlvbiBmaW5pc2hlcy5cbiAgICAvLyBXZSB3YW50IHRvIGFsd2F5cyBjYXB0dXJlIHRoZSBsYXRlc3QgY29udGVudCBmb3IgdGhlIHByZXZpb3VzIHNuYXBzaG90LlxuICAgIC8vIFNvIGNsaWNraW5nIHF1aWNrbHkgb24gVDEsIFQyLCBUMyB3aWxsIHJlc3VsdCBpbiB0aGUgZm9sbG93aW5nIHNlcXVlbmNlOlxuICAgIC8vIDEuIFQxIC0+IFQyOiBwcmV2aW91c0NvbnRlbnQgPSBUMSwgY3VycmVudENvbnRlbnQgPSBUMlxuICAgIC8vIDIuIFQyIC0+IFQzOiBwcmV2aW91c0NvbnRlbnQgPSBUMiwgY3VycmVudENvbnRlbnQgPSBUM1xuICAgIGNvbnN0IHNvdXJjZSA9IGN1cnJlbnRDb250YWluZXJSZWYuY3VycmVudDtcbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3cmFwcGVyID0gb3duZXJEb2N1bWVudChzb3VyY2UpLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgQXJyYXkuZnJvbShzb3VyY2UuY2hpbGROb2RlcykpIHtcbiAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoY2hpbGQuY2xvbmVOb2RlKHRydWUpKTtcbiAgICB9XG4gICAgY2FwdHVyZWROb2RlUmVmLmN1cnJlbnQgPSB3cmFwcGVyO1xuICB9KTtcbiAgY29uc3QgaXNUcmFuc2l0aW9uaW5nID0gcHJldmlvdXNDb250ZW50Tm9kZSAhPSBudWxsO1xuICBsZXQgY2hpbGRyZW5Ub1JlbmRlcjtcbiAgaWYgKCFpc1RyYW5zaXRpb25pbmcpIHtcbiAgICBjaGlsZHJlblRvUmVuZGVyID0gLyojX19QVVJFX18qL19qc3goXCJkaXZcIiwge1xuICAgICAgXCJkYXRhLWN1cnJlbnRcIjogdHJ1ZSxcbiAgICAgIHJlZjogY3VycmVudENvbnRhaW5lclJlZixcbiAgICAgIGNoaWxkcmVuOiBjaGlsZHJlblxuICAgIH0sIGN1cnJlbnRDb250ZW50S2V5KTtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZHJlblRvUmVuZGVyID0gLyojX19QVVJFX18qL19qc3hzKFJlYWN0LkZyYWdtZW50LCB7XG4gICAgICBjaGlsZHJlbjogWy8qI19fUFVSRV9fKi9fanN4KFwiZGl2XCIsIHtcbiAgICAgICAgXCJkYXRhLXByZXZpb3VzXCI6IHRydWUsXG4gICAgICAgIGluZXJ0OiBpbmVydFZhbHVlKHRydWUpLFxuICAgICAgICByZWY6IHByZXZpb3VzQ29udGFpbmVyUmVmLFxuICAgICAgICBzdHlsZToge1xuICAgICAgICAgIC4uLihwcmV2aW91c0NvbnRlbnREaW1lbnNpb25zID8ge1xuICAgICAgICAgICAgW2Nzc1ZhcnMucG9wdXBXaWR0aF06IGAke3ByZXZpb3VzQ29udGVudERpbWVuc2lvbnMud2lkdGh9cHhgLFxuICAgICAgICAgICAgW2Nzc1ZhcnMucG9wdXBIZWlnaHRdOiBgJHtwcmV2aW91c0NvbnRlbnREaW1lbnNpb25zLmhlaWdodH1weGBcbiAgICAgICAgICB9IDogbnVsbCksXG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgXCJkYXRhLWVuZGluZy1zdHlsZVwiOiBzaG93U3RhcnRpbmdTdHlsZUF0dHJpYnV0ZSA/IHVuZGVmaW5lZCA6ICcnXG4gICAgICB9LCBcInByZXZpb3VzXCIpLCAvKiNfX1BVUkVfXyovX2pzeChcImRpdlwiLCB7XG4gICAgICAgIFwiZGF0YS1jdXJyZW50XCI6IHRydWUsXG4gICAgICAgIHJlZjogY3VycmVudENvbnRhaW5lclJlZixcbiAgICAgICAgXCJkYXRhLXN0YXJ0aW5nLXN0eWxlXCI6IHNob3dTdGFydGluZ1N0eWxlQXR0cmlidXRlID8gJycgOiB1bmRlZmluZWQsXG4gICAgICAgIGNoaWxkcmVuOiBjaGlsZHJlblxuICAgICAgfSwgY3VycmVudENvbnRlbnRLZXkpXVxuICAgIH0pO1xuICB9XG5cbiAgLy8gV2hlbiBwcmV2aW91c0NvbnRlbnROb2RlIGlzIHByZXNlbnQsIGltcGVyYXRpdmVseSBwb3B1bGF0ZSB0aGUgcHJldmlvdXMgY29udGFpbmVyIHdpdGggdGhlIGNsb25lZCBjaGlsZHJlbi5cbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBwcmV2aW91c0NvbnRhaW5lclJlZi5jdXJyZW50O1xuICAgIGlmICghY29udGFpbmVyIHx8ICFwcmV2aW91c0NvbnRlbnROb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnRhaW5lci5yZXBsYWNlQ2hpbGRyZW4oLi4uQXJyYXkuZnJvbShwcmV2aW91c0NvbnRlbnROb2RlLmNoaWxkTm9kZXMpKTtcbiAgfSwgW3ByZXZpb3VzQ29udGVudE5vZGVdKTtcbiAgdXNlUG9wdXBBdXRvUmVzaXplKHtcbiAgICBwb3B1cEVsZW1lbnQsXG4gICAgcG9zaXRpb25lckVsZW1lbnQsXG4gICAgbW91bnRlZCxcbiAgICBjb250ZW50OiBwYXlsb2FkLFxuICAgIG9uTWVhc3VyZUxheW91dDogaGFuZGxlTWVhc3VyZUxheW91dCxcbiAgICBvbk1lYXN1cmVMYXlvdXRDb21wbGV0ZTogaGFuZGxlTWVhc3VyZUxheW91dENvbXBsZXRlLFxuICAgIHNpZGUsXG4gICAgZGlyZWN0aW9uXG4gIH0pO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBhY3RpdmF0aW9uRGlyZWN0aW9uOiBnZXRBY3RpdmF0aW9uRGlyZWN0aW9uKG5ld1RyaWdnZXJPZmZzZXQpLFxuICAgIHRyYW5zaXRpb25pbmc6IGlzVHJhbnNpdGlvbmluZ1xuICB9O1xuICByZXR1cm4ge1xuICAgIGNoaWxkcmVuOiBjaGlsZHJlblRvUmVuZGVyLFxuICAgIHN0YXRlXG4gIH07XG59XG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgZGVzY3JpYmluZyB0aGUgcHJvdmlkZWQgb2Zmc2V0LlxuICogSXQgZGVzY3JpYmVzIGJvdGggdGhlIGhvcml6b250YWwgYW5kIHZlcnRpY2FsIG9mZnNldCwgc2VwYXJhdGVkIGJ5IGEgc3BhY2UuXG4gKlxuICogQHBhcmFtIG9mZnNldFxuICovXG5mdW5jdGlvbiBnZXRBY3RpdmF0aW9uRGlyZWN0aW9uKG9mZnNldCkge1xuICBpZiAoIW9mZnNldCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIGAke2dldFZhbHVlV2l0aFRvbGVyYW5jZShvZmZzZXQuaG9yaXpvbnRhbCwgNSwgJ3JpZ2h0JywgJ2xlZnQnKX0gJHtnZXRWYWx1ZVdpdGhUb2xlcmFuY2Uob2Zmc2V0LnZlcnRpY2FsLCA1LCAnZG93bicsICd1cCcpfWA7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxhYmVsIGRlc2NyaWJpbmcgdGhlIHZhbHVlIChwb3NpdGl2ZS9uZWdhdGl2ZSkgdHJlYXRpbmcgdmFsdWVzXG4gKiB3aXRoaW4gdG9sZXJhbmNlIGFzIHplcm8uXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGNoZWNrXG4gKiBAcGFyYW0gdG9sZXJhbmNlIFRvbGVyYW5jZSB0byB0cmVhdCB0aGUgdmFsdWUgYXMgemVyby5cbiAqIEBwYXJhbSBwb3NpdGl2ZUxhYmVsXG4gKiBAcGFyYW0gbmVnYXRpdmVMYWJlbFxuICogQHJldHVybnMgSWYgMCA8IGFicyh2YWx1ZSkgPCB0b2xlcmFuY2UsIHJldHVybnMgYW4gZW1wdHkgc3RyaW5nLiBPdGhlcndpc2UgcmV0dXJucyBwb3NpdGl2ZUxhYmVsIG9yIG5lZ2F0aXZlTGFiZWwuXG4gKi9cbmZ1bmN0aW9uIGdldFZhbHVlV2l0aFRvbGVyYW5jZSh2YWx1ZSwgdG9sZXJhbmNlLCBwb3NpdGl2ZUxhYmVsLCBuZWdhdGl2ZUxhYmVsKSB7XG4gIGlmICh2YWx1ZSA+IHRvbGVyYW5jZSkge1xuICAgIHJldHVybiBwb3NpdGl2ZUxhYmVsO1xuICB9XG4gIGlmICh2YWx1ZSA8IC10b2xlcmFuY2UpIHtcbiAgICByZXR1cm4gbmVnYXRpdmVMYWJlbDtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgcmVsYXRpdmUgcG9zaXRpb24gYmV0d2VlbiBjZW50ZXJzIG9mIHR3byBlbGVtZW50cy5cbiAqL1xuZnVuY3Rpb24gY2FsY3VsYXRlUmVsYXRpdmVQb3NpdGlvbihmcm9tLCB0bykge1xuICBjb25zdCBmcm9tUmVjdCA9IGZyb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGNvbnN0IHRvUmVjdCA9IHRvLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjb25zdCBmcm9tQ2VudGVyID0ge1xuICAgIHg6IGZyb21SZWN0LmxlZnQgKyBmcm9tUmVjdC53aWR0aCAvIDIsXG4gICAgeTogZnJvbVJlY3QudG9wICsgZnJvbVJlY3QuaGVpZ2h0IC8gMlxuICB9O1xuICBjb25zdCB0b0NlbnRlciA9IHtcbiAgICB4OiB0b1JlY3QubGVmdCArIHRvUmVjdC53aWR0aCAvIDIsXG4gICAgeTogdG9SZWN0LnRvcCArIHRvUmVjdC5oZWlnaHQgLyAyXG4gIH07XG4gIHJldHVybiB7XG4gICAgaG9yaXpvbnRhbDogdG9DZW50ZXIueCAtIGZyb21DZW50ZXIueCxcbiAgICB2ZXJ0aWNhbDogdG9DZW50ZXIueSAtIGZyb21DZW50ZXIueVxuICB9O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBrZXkgdGhhdCBmb3JjZXMgcmVtb3VudGluZyBjb250ZW50IHdoZW4gdHJpZ2dlcnMgY2hhbmdlIG9yIGEgcGF5bG9hZCBpcyB1cGRhdGVkLlxuICovXG5mdW5jdGlvbiB1c2VQb3B1cENvbnRlbnRLZXkoYWN0aXZlVHJpZ2dlcklkLCBwYXlsb2FkKSB7XG4gIGNvbnN0IFtjb250ZW50S2V5LCBzZXRDb250ZW50S2V5XSA9IFJlYWN0LnVzZVN0YXRlKDApO1xuICBjb25zdCBwcmV2aW91c0FjdGl2ZVRyaWdnZXJJZFJlZiA9IFJlYWN0LnVzZVJlZihhY3RpdmVUcmlnZ2VySWQpO1xuICBjb25zdCBwcmV2aW91c1BheWxvYWRSZWYgPSBSZWFjdC51c2VSZWYocGF5bG9hZCk7XG4gIGNvbnN0IHBlbmRpbmdQYXlsb2FkVXBkYXRlUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAvLyBDb21wYXJlIGFnYWluc3QgdGhlIGxhc3QgY29tbWl0dGVkIHZhbHVlcyB0byBkZWNpZGUgd2hldGhlciB3ZSBuZWVkIGEgbmV3IERPTSBzdWJ0cmVlLlxuICAgIGNvbnN0IHByZXZpb3VzQWN0aXZlVHJpZ2dlcklkID0gcHJldmlvdXNBY3RpdmVUcmlnZ2VySWRSZWYuY3VycmVudDtcbiAgICBjb25zdCBwcmV2aW91c1BheWxvYWQgPSBwcmV2aW91c1BheWxvYWRSZWYuY3VycmVudDtcbiAgICBjb25zdCB0cmlnZ2VySWRDaGFuZ2VkID0gYWN0aXZlVHJpZ2dlcklkICE9PSBwcmV2aW91c0FjdGl2ZVRyaWdnZXJJZDtcbiAgICBjb25zdCBwYXlsb2FkQ2hhbmdlZCA9IHBheWxvYWQgIT09IHByZXZpb3VzUGF5bG9hZDtcbiAgICBpZiAodHJpZ2dlcklkQ2hhbmdlZCkge1xuICAgICAgLy8gUmVtb3VudCBpbW1lZGlhdGVseSBvbiB0cmlnZ2VyIGNoYW5nZTsgcmVtZW1iZXIgaWYgcGF5bG9hZCBoYXNuJ3QgY2F1Z2h0IHVwIHlldC5cbiAgICAgIHNldENvbnRlbnRLZXkodmFsdWUgPT4gdmFsdWUgKyAxKTtcbiAgICAgIHBlbmRpbmdQYXlsb2FkVXBkYXRlUmVmLmN1cnJlbnQgPSAhcGF5bG9hZENoYW5nZWQ7XG4gICAgfSBlbHNlIGlmIChwZW5kaW5nUGF5bG9hZFVwZGF0ZVJlZi5jdXJyZW50ICYmIHBheWxvYWRDaGFuZ2VkKSB7XG4gICAgICAvLyBQYXlsb2FkIGFycml2ZWQgYSByZW5kZXIgbGF0ZXIsIHNvIHJlbW91bnQgb25jZSBtb3JlIHRvIGF2b2lkIHJldXNpbmcgdGhlIG9sZCA8aW1nPi5cbiAgICAgIHNldENvbnRlbnRLZXkodmFsdWUgPT4gdmFsdWUgKyAxKTtcbiAgICAgIHBlbmRpbmdQYXlsb2FkVXBkYXRlUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBQZXJzaXN0IGN1cnJlbnQgdmFsdWVzIGZvciB0aGUgbmV4dCByZW5kZXIncyBjb21wYXJpc29uLlxuICAgIHByZXZpb3VzQWN0aXZlVHJpZ2dlcklkUmVmLmN1cnJlbnQgPSBhY3RpdmVUcmlnZ2VySWQ7XG4gICAgcHJldmlvdXNQYXlsb2FkUmVmLmN1cnJlbnQgPSBwYXlsb2FkO1xuICB9LCBbYWN0aXZlVHJpZ2dlcklkLCBwYXlsb2FkXSk7XG4gIHJldHVybiBgJHthY3RpdmVUcmlnZ2VySWQgPz8gJ2N1cnJlbnQnfS0ke2NvbnRlbnRLZXl9YDtcbn0iLCJleHBvcnQgbGV0IE1lbnVWaWV3cG9ydENzc1ZhcnMgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1lbnVWaWV3cG9ydENzc1ZhcnMpIHtcbiAgLyoqXG4gICAqIFRoZSB3aWR0aCBvZiB0aGUgcGFyZW50IHBvcHVwLlxuICAgKiBUaGlzIHZhcmlhYmxlIGlzIHBsYWNlZCBvbiB0aGUgJ3ByZXZpb3VzJyBjb250YWluZXIgYW5kIHN0b3JlcyB0aGUgd2lkdGggb2YgdGhlIHBvcHVwIHdoZW4gdGhlIHByZXZpb3VzIGNvbnRlbnQgd2FzIHJlbmRlcmVkLlxuICAgKiBJdCBjYW4gYmUgdXNlZCB0byBmcmVlemUgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIHBvcHVwIHdoZW4gYW5pbWF0aW5nIGJldHdlZW4gZGlmZmVyZW50IGNvbnRlbnQuXG4gICAqL1xuICBNZW51Vmlld3BvcnRDc3NWYXJzW1wicG9wdXBXaWR0aFwiXSA9IFwiLS1wb3B1cC13aWR0aFwiO1xuICAvKipcbiAgICogVGhlIGhlaWdodCBvZiB0aGUgcGFyZW50IHBvcHVwLlxuICAgKiBUaGlzIHZhcmlhYmxlIGlzIHBsYWNlZCBvbiB0aGUgJ3ByZXZpb3VzJyBjb250YWluZXIgYW5kIHN0b3JlcyB0aGUgaGVpZ2h0IG9mIHRoZSBwb3B1cCB3aGVuIHRoZSBwcmV2aW91cyBjb250ZW50IHdhcyByZW5kZXJlZC5cbiAgICogSXQgY2FuIGJlIHVzZWQgdG8gZnJlZXplIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBwb3B1cCB3aGVuIGFuaW1hdGluZyBiZXR3ZWVuIGRpZmZlcmVudCBjb250ZW50LlxuICAgKi9cbiAgTWVudVZpZXdwb3J0Q3NzVmFyc1tcInBvcHVwSGVpZ2h0XCJdID0gXCItLXBvcHVwLWhlaWdodFwiO1xuICByZXR1cm4gTWVudVZpZXdwb3J0Q3NzVmFycztcbn0oe30pOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlTWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3Jvb3QvTWVudVJvb3RDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi4vcG9zaXRpb25lci9NZW51UG9zaXRpb25lckNvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVJlbmRlckVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVJlbmRlckVsZW1lbnQuanNcIjtcbmltcG9ydCB7IHVzZVBvcHVwVmlld3BvcnQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvdXNlUG9wdXBWaWV3cG9ydC5qc1wiO1xuaW1wb3J0IHsgTWVudVZpZXdwb3J0Q3NzVmFycyB9IGZyb20gXCIuL01lbnVWaWV3cG9ydENzc1ZhcnMuanNcIjtcbmNvbnN0IHN0YXRlQXR0cmlidXRlc01hcHBpbmcgPSB7XG4gIGFjdGl2YXRpb25EaXJlY3Rpb246IHZhbHVlID0+IHZhbHVlID8ge1xuICAgICdkYXRhLWFjdGl2YXRpb24tZGlyZWN0aW9uJzogdmFsdWVcbiAgfSA6IG51bGxcbn07XG5cbi8qKlxuICogQSB2aWV3cG9ydCBmb3IgZGlzcGxheWluZyBjb250ZW50IHRyYW5zaXRpb25zLlxuICogVGhpcyBjb21wb25lbnQgaXMgb25seSByZXF1aXJlZCBpZiBvbmUgcG9wdXAgY2FuIGJlIG9wZW5lZCBieSBtdWx0aXBsZSB0cmlnZ2VycywgaXRzIGNvbnRlbnRcbiAqIGNoYW5nZXMgYmFzZWQgb24gdGhlIHRyaWdnZXIsIGFuZCBzd2l0Y2hpbmcgYmV0d2VlbiB0aGVtIGlzIGFuaW1hdGVkLlxuICogUmVuZGVycyBhIGA8ZGl2PmAgZWxlbWVudC5cbiAqXG4gKiBEb2N1bWVudGF0aW9uOiBbQmFzZSBVSSBNZW51XShodHRwczovL2Jhc2UtdWkuY29tL3JlYWN0L2NvbXBvbmVudHMvbWVudSlcbiAqL1xuZXhwb3J0IGNvbnN0IE1lbnVWaWV3cG9ydCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIE1lbnVWaWV3cG9ydChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGNoaWxkcmVuLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlTWVudVJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICBzaWRlXG4gIH0gPSB1c2VNZW51UG9zaXRpb25lckNvbnRleHQoKTtcbiAgY29uc3QgaW5zdGFudFR5cGUgPSBzdG9yZS51c2VTdGF0ZSgnaW5zdGFudFR5cGUnKTtcbiAgY29uc3Qge1xuICAgIGNoaWxkcmVuOiBjaGlsZHJlblRvUmVuZGVyLFxuICAgIHN0YXRlOiB2aWV3cG9ydFN0YXRlXG4gIH0gPSB1c2VQb3B1cFZpZXdwb3J0KHtcbiAgICBzdG9yZSxcbiAgICBzaWRlLFxuICAgIGNzc1ZhcnM6IE1lbnVWaWV3cG9ydENzc1ZhcnMsXG4gICAgY2hpbGRyZW5cbiAgfSk7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGFjdGl2YXRpb25EaXJlY3Rpb246IHZpZXdwb3J0U3RhdGUuYWN0aXZhdGlvbkRpcmVjdGlvbixcbiAgICB0cmFuc2l0aW9uaW5nOiB2aWV3cG9ydFN0YXRlLnRyYW5zaXRpb25pbmcsXG4gICAgaW5zdGFudDogaW5zdGFudFR5cGVcbiAgfTtcbiAgcmV0dXJuIHVzZVJlbmRlckVsZW1lbnQoJ2RpdicsIGNvbXBvbmVudFByb3BzLCB7XG4gICAgc3RhdGUsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgcHJvcHM6IFtlbGVtZW50UHJvcHMsIHtcbiAgICAgIGNoaWxkcmVuOiBjaGlsZHJlblRvUmVuZGVyXG4gICAgfV0sXG4gICAgc3RhdGVBdHRyaWJ1dGVzTWFwcGluZ1xuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgTWVudVZpZXdwb3J0LmRpc3BsYXlOYW1lID0gXCJNZW51Vmlld3BvcnRcIjsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGlzRWxlbWVudERpc2FibGVkIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvaXNFbGVtZW50RGlzYWJsZWQnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHdhcm4gfSBmcm9tICdAYmFzZS11aS91dGlscy93YXJuJztcbmltcG9ydCB7IFNhZmVSZWFjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3NhZmVSZWFjdCc7XG5pbXBvcnQgeyBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyBzYWZlUG9seWdvbiwgdXNlQ2xpY2ssIHVzZUhvdmVyUmVmZXJlbmNlSW50ZXJhY3Rpb24gfSBmcm9tIFwiLi4vLi4vZmxvYXRpbmctdWktcmVhY3QvaW5kZXguanNcIjtcbmltcG9ydCB7IHVzZU1lbnVSb290Q29udGV4dCB9IGZyb20gXCIuLi9yb290L01lbnVSb290Q29udGV4dC5qc1wiO1xuaW1wb3J0IHsgdXNlQmFzZVVpSWQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZUJhc2VVaUlkLmpzXCI7XG5pbXBvcnQgeyB0cmlnZ2VyT3BlblN0YXRlTWFwcGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qc1wiO1xuaW1wb3J0IHsgdXNlQ29tcG9zaXRlTGlzdEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbXBvc2l0ZS9saXN0L3VzZUNvbXBvc2l0ZUxpc3RJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51SXRlbSB9IGZyb20gXCIuLi9pdGVtL3VzZU1lbnVJdGVtLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51UG9zaXRpb25lckNvbnRleHQgfSBmcm9tIFwiLi4vcG9zaXRpb25lci9NZW51UG9zaXRpb25lckNvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVRyaWdnZXJSZWdpc3RyYXRpb24gfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyB1c2VNZW51U3VibWVudVJvb3RDb250ZXh0IH0gZnJvbSBcIi4uL3N1Ym1lbnUtcm9vdC9NZW51U3VibWVudVJvb3RDb250ZXh0LmpzXCI7XG5cbi8qKlxuICogQSBtZW51IGl0ZW0gdGhhdCBvcGVucyBhIHN1Ym1lbnUuXG4gKiBSZW5kZXJzIGEgYDxkaXY+YCBlbGVtZW50LlxuICpcbiAqIERvY3VtZW50YXRpb246IFtCYXNlIFVJIE1lbnVdKGh0dHBzOi8vYmFzZS11aS5jb20vcmVhY3QvY29tcG9uZW50cy9tZW51KVxuICovXG5leHBvcnQgY29uc3QgTWVudVN1Ym1lbnVUcmlnZ2VyID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gTWVudVN1Ym1lbnVUcmlnZ2VyKGNvbXBvbmVudFByb3BzLCBmb3J3YXJkZWRSZWYpIHtcbiAgY29uc3Qge1xuICAgIHJlbmRlcixcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGUsXG4gICAgbGFiZWwsXG4gICAgaWQ6IGlkUHJvcCxcbiAgICBuYXRpdmVCdXR0b24gPSBmYWxzZSxcbiAgICBvcGVuT25Ib3ZlciA9IHRydWUsXG4gICAgZGVsYXkgPSAxMDAsXG4gICAgY2xvc2VEZWxheSA9IDAsXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkUHJvcCA9IGZhbHNlLFxuICAgIC4uLmVsZW1lbnRQcm9wc1xuICB9ID0gY29tcG9uZW50UHJvcHM7XG4gIGNvbnN0IGxpc3RJdGVtID0gdXNlQ29tcG9zaXRlTGlzdEl0ZW0oKTtcbiAgY29uc3QgbWVudVBvc2l0aW9uZXJDb250ZXh0ID0gdXNlTWVudVBvc2l0aW9uZXJDb250ZXh0KCk7XG4gIGNvbnN0IHtcbiAgICBzdG9yZVxuICB9ID0gdXNlTWVudVJvb3RDb250ZXh0KCk7XG4gIGNvbnN0IHRoaXNUcmlnZ2VySWQgPSB1c2VCYXNlVWlJZChpZFByb3ApO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgZmxvYXRpbmdSb290Q29udGV4dCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ1Jvb3RDb250ZXh0Jyk7XG4gIGNvbnN0IGZsb2F0aW5nVHJlZVJvb3QgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdUcmVlUm9vdCcpO1xuICBjb25zdCBwb3B1cElkID0gc3RvcmUudXNlU3RhdGUoJ3RyaWdnZXJQb3B1cElkJywgdGhpc1RyaWdnZXJJZCk7XG4gIGNvbnN0IGJhc2VSZWdpc3RlclRyaWdnZXIgPSB1c2VUcmlnZ2VyUmVnaXN0cmF0aW9uKHRoaXNUcmlnZ2VySWQsIHN0b3JlKTtcbiAgY29uc3QgcmVnaXN0ZXJUcmlnZ2VyID0gUmVhY3QudXNlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgY29uc3QgY2xlYW51cCA9IGJhc2VSZWdpc3RlclRyaWdnZXIoZWxlbWVudCk7XG4gICAgaWYgKGVsZW1lbnQgIT09IG51bGwgJiYgc3RvcmUuc2VsZWN0KCdvcGVuJykgJiYgc3RvcmUuc2VsZWN0KCdhY3RpdmVUcmlnZ2VySWQnKSA9PSBudWxsKSB7XG4gICAgICBzdG9yZS51cGRhdGUoe1xuICAgICAgICBhY3RpdmVUcmlnZ2VySWQ6IHRoaXNUcmlnZ2VySWQsXG4gICAgICAgIGFjdGl2ZVRyaWdnZXJFbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBjbG9zZURlbGF5XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNsZWFudXA7XG4gIH0sIFtiYXNlUmVnaXN0ZXJUcmlnZ2VyLCBjbG9zZURlbGF5LCBzdG9yZSwgdGhpc1RyaWdnZXJJZF0pO1xuICBjb25zdCB0cmlnZ2VyRWxlbWVudFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgaGFuZGxlVHJpZ2dlckVsZW1lbnRSZWYgPSBSZWFjdC51c2VDYWxsYmFjayhlbCA9PiB7XG4gICAgdHJpZ2dlckVsZW1lbnRSZWYuY3VycmVudCA9IGVsO1xuICAgIHN0b3JlLnNldCgnYWN0aXZlVHJpZ2dlckVsZW1lbnQnLCBlbCk7XG4gIH0sIFtzdG9yZV0pO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9ydWxlcy1vZi1ob29rc1xuICAgIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdHJpZ2dlckVsZW1lbnRSZWYuY3VycmVudDtcbiAgICAgIGlmIChlbGVtZW50ICYmIGlzRWxlbWVudERpc2FibGVkKGVsZW1lbnQpICYmICFkaXNhYmxlZFByb3ApIHtcbiAgICAgICAgY29uc3Qgb3duZXJTdGFja01lc3NhZ2UgPSBTYWZlUmVhY3QuY2FwdHVyZU93bmVyU3RhY2s/LigpIHx8ICcnO1xuICAgICAgICB3YXJuKGBBIGRpc2FibGVkIGVsZW1lbnQgd2FzIGRldGVjdGVkIG9uIDxNZW51LlN1Ym1lbnVUcmlnZ2VyPi4gVG8gcHJvcGVybHkgZGlzYWJsZSB0aGUgdHJpZ2dlciwgdXNlIHRoZSBcXGBkaXNhYmxlZFxcYCBwcm9wIG9uIHRoZSBjb21wb25lbnQgaW5zdGVhZCBvZiBzZXR0aW5nIGl0IG9uIHRoZSByZW5kZXJlZCBlbGVtZW50LiR7b3duZXJTdGFja01lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgY29uc3Qgc3VibWVudVJvb3RDb250ZXh0ID0gdXNlTWVudVN1Ym1lbnVSb290Q29udGV4dCgpO1xuICBpZiAoIXN1Ym1lbnVSb290Q29udGV4dD8ucGFyZW50TWVudSkge1xuICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyAnQmFzZSBVSTogPE1lbnUuU3VibWVudVRyaWdnZXI+IG11c3QgYmUgcGxhY2VkIGluIDxNZW51LlN1Ym1lbnVSb290Pi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSgzNykpO1xuICB9XG4gIHN0b3JlLnVzZVN5bmNlZFZhbHVlKCdjbG9zZURlbGF5JywgY2xvc2VEZWxheSk7XG4gIGNvbnN0IHBhcmVudE1lbnVTdG9yZSA9IHN1Ym1lbnVSb290Q29udGV4dC5wYXJlbnRNZW51O1xuICBjb25zdCBpdGVtUHJvcHMgPSBwYXJlbnRNZW51U3RvcmUudXNlU3RhdGUoJ2l0ZW1Qcm9wcycpO1xuICBjb25zdCBoaWdobGlnaHRlZCA9IHBhcmVudE1lbnVTdG9yZS51c2VTdGF0ZSgnaXNBY3RpdmUnLCBsaXN0SXRlbS5pbmRleCk7XG4gIGNvbnN0IGl0ZW1NZXRhZGF0YSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICB0eXBlOiAnc3VibWVudS10cmlnZ2VyJyxcbiAgICBzZXRBY3RpdmUoKSB7XG4gICAgICBwYXJlbnRNZW51U3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIGxpc3RJdGVtLmluZGV4KTtcbiAgICB9XG4gIH0pLCBbcGFyZW50TWVudVN0b3JlLCBsaXN0SXRlbS5pbmRleF0pO1xuICBjb25zdCByb290RGlzYWJsZWQgPSBzdG9yZS51c2VTdGF0ZSgnZGlzYWJsZWQnKTtcbiAgY29uc3QgZGlzYWJsZWQgPSBkaXNhYmxlZFByb3AgfHwgcm9vdERpc2FibGVkO1xuICBjb25zdCB7XG4gICAgZ2V0SXRlbVByb3BzLFxuICAgIGl0ZW1SZWZcbiAgfSA9IHVzZU1lbnVJdGVtKHtcbiAgICBjbG9zZU9uQ2xpY2s6IGZhbHNlLFxuICAgIGRpc2FibGVkLFxuICAgIGhpZ2hsaWdodGVkLFxuICAgIGlkOiB0aGlzVHJpZ2dlcklkLFxuICAgIHN0b3JlLFxuICAgIHR5cGluZ1JlZjogcGFyZW50TWVudVN0b3JlLmNvbnRleHQudHlwaW5nUmVmLFxuICAgIG5hdGl2ZUJ1dHRvbixcbiAgICBpdGVtTWV0YWRhdGEsXG4gICAgbm9kZUlkOiBtZW51UG9zaXRpb25lckNvbnRleHQ/LmNvbnRleHQubm9kZUlkXG4gIH0pO1xuICBjb25zdCBob3ZlckVuYWJsZWQgPSBzdG9yZS51c2VTdGF0ZSgnaG92ZXJFbmFibGVkJyk7XG4gIGNvbnN0IGFsbG93TW91c2VFbnRlciA9IHBhcmVudE1lbnVTdG9yZS51c2VTdGF0ZSgnYWxsb3dNb3VzZUVudGVyJyk7XG4gIGNvbnN0IGhvdmVyUHJvcHMgPSB1c2VIb3ZlclJlZmVyZW5jZUludGVyYWN0aW9uKGZsb2F0aW5nUm9vdENvbnRleHQsIHtcbiAgICBlbmFibGVkOiBob3ZlckVuYWJsZWQgJiYgb3Blbk9uSG92ZXIgJiYgIWRpc2FibGVkLFxuICAgIGhhbmRsZUNsb3NlOiBzYWZlUG9seWdvbih7XG4gICAgICBibG9ja1BvaW50ZXJFdmVudHM6IHRydWVcbiAgICB9KSxcbiAgICBtb3VzZU9ubHk6IHRydWUsXG4gICAgbW92ZTogdHJ1ZSxcbiAgICByZXN0TXM6IGRlbGF5LFxuICAgIGRlbGF5OiBhbGxvd01vdXNlRW50ZXIgPyB7XG4gICAgICBvcGVuOiBkZWxheSxcbiAgICAgIGNsb3NlOiBjbG9zZURlbGF5XG4gICAgfSA6IDAsXG4gICAgdHJpZ2dlckVsZW1lbnRSZWYsXG4gICAgZXh0ZXJuYWxUcmVlOiBmbG9hdGluZ1RyZWVSb290LFxuICAgIGlzQ2xvc2luZzogKCkgPT4gc3RvcmUuc2VsZWN0KCd0cmFuc2l0aW9uU3RhdHVzJykgPT09ICdlbmRpbmcnXG4gIH0pO1xuICBjb25zdCBjbGljayA9IHVzZUNsaWNrKGZsb2F0aW5nUm9vdENvbnRleHQsIHtcbiAgICBlbmFibGVkOiAhZGlzYWJsZWQsXG4gICAgZXZlbnQ6ICdtb3VzZWRvd24nLFxuICAgIHRvZ2dsZTogIW9wZW5PbkhvdmVyLFxuICAgIGlnbm9yZU1vdXNlOiBvcGVuT25Ib3ZlcixcbiAgICBzdGlja0lmT3BlbjogZmFsc2VcbiAgfSk7XG4gIGNvbnN0IGxvY2FsSW50ZXJhY3Rpb25Qcm9wcyA9IGNsaWNrLnJlZmVyZW5jZSA/PyBFTVBUWV9PQkpFQ1Q7XG4gIGNvbnN0IHJvb3RUcmlnZ2VyUHJvcHMgPSBzdG9yZS51c2VTdGF0ZSgndHJpZ2dlclByb3BzJywgdHJ1ZSk7XG4gIGRlbGV0ZSByb290VHJpZ2dlclByb3BzLmlkO1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBkaXNhYmxlZCxcbiAgICBoaWdobGlnaHRlZCxcbiAgICBvcGVuXG4gIH07XG4gIGNvbnN0IGVsZW1lbnQgPSB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHRyaWdnZXJPcGVuU3RhdGVNYXBwaW5nLFxuICAgIHByb3BzOiBbbG9jYWxJbnRlcmFjdGlvblByb3BzLCBob3ZlclByb3BzLCByb290VHJpZ2dlclByb3BzLCBpdGVtUHJvcHMsIHtcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogcG9wdXBJZCxcbiAgICAgIHRhYkluZGV4OiBvcGVuIHx8IGhpZ2hsaWdodGVkID8gMCA6IC0xLFxuICAgICAgb25CbHVyKCkge1xuICAgICAgICBpZiAoaGlnaGxpZ2h0ZWQpIHtcbiAgICAgICAgICBwYXJlbnRNZW51U3RvcmUuc2V0KCdhY3RpdmVJbmRleCcsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgZWxlbWVudFByb3BzLCBnZXRJdGVtUHJvcHNdLFxuICAgIHJlZjogW2ZvcndhcmRlZFJlZiwgbGlzdEl0ZW0ucmVmLCBpdGVtUmVmLCByZWdpc3RlclRyaWdnZXIsIGhhbmRsZVRyaWdnZXJFbGVtZW50UmVmXVxuICB9KTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59KTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIE1lbnVTdWJtZW51VHJpZ2dlci5kaXNwbGF5TmFtZSA9IFwiTWVudVN1Ym1lbnVUcmlnZ2VyXCI7IiwiaW1wb3J0IF9mb3JtYXRFcnJvck1lc3NhZ2UgZnJvbSBcIkBiYXNlLXVpL3V0aWxzL2Zvcm1hdEVycm9yTWVzc2FnZVwiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IE1lbnVTdG9yZSB9IGZyb20gXCIuL01lbnVTdG9yZS5qc1wiO1xuZXhwb3J0IGNsYXNzIE1lbnVIYW5kbGUge1xuICAvKipcbiAgICogSW50ZXJuYWwgc3RvcmUgaG9sZGluZyB0aGUgbWVudSdzIHN0YXRlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdG9yZSA9IG5ldyBNZW51U3RvcmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgbWVudSBhbmQgYXNzb2NpYXRlcyBpdCB3aXRoIHRoZSB0cmlnZ2VyIHdpdGggdGhlIGdpdmVuIGlkLlxuICAgKiBUaGUgdHJpZ2dlciBtdXN0IGJlIGEgTWVudS5UcmlnZ2VyIGNvbXBvbmVudCB3aXRoIHRoaXMgaGFuZGxlIHBhc3NlZCBhcyBhIHByb3AuXG4gICAqXG4gICAqIEBwYXJhbSB0cmlnZ2VySWQgSUQgb2YgdGhlIHRyaWdnZXIgdG8gYXNzb2NpYXRlIHdpdGggdGhlIG1lbnUuXG4gICAqL1xuICBvcGVuKHRyaWdnZXJJZCkge1xuICAgIGNvbnN0IHRyaWdnZXJFbGVtZW50ID0gdHJpZ2dlcklkID8gdGhpcy5zdG9yZS5jb250ZXh0LnRyaWdnZXJFbGVtZW50cy5nZXRCeUlkKHRyaWdnZXJJZCkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHRyaWdnZXJJZCAmJiAhdHJpZ2dlckVsZW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyBgQmFzZSBVSTogTWVudUhhbmRsZS5vcGVuOiBObyB0cmlnZ2VyIGZvdW5kIHdpdGggaWQgXCIke3RyaWdnZXJJZH1cIi5gIDogX2Zvcm1hdEVycm9yTWVzc2FnZSg4MywgdHJpZ2dlcklkKSk7XG4gICAgfVxuICAgIHRoaXMuc3RvcmUuc2V0T3Blbih0cnVlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoJ2ltcGVyYXRpdmUtYWN0aW9uJywgdW5kZWZpbmVkLCB0cmlnZ2VyRWxlbWVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgbWVudS5cbiAgICovXG4gIGNsb3NlKCkge1xuICAgIHRoaXMuc3RvcmUuc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKCdpbXBlcmF0aXZlLWFjdGlvbicsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIG1lbnUgaXMgY3VycmVudGx5IG9wZW4uXG4gICAqL1xuICBnZXQgaXNPcGVuKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLnNlbGVjdCgnb3BlbicpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBoYW5kbGUgdG8gY29ubmVjdCBhIE1lbnUuUm9vdCB3aXRoIGRldGFjaGVkIE1lbnUuVHJpZ2dlciBjb21wb25lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVudUhhbmRsZSgpIHtcbiAgcmV0dXJuIG5ldyBNZW51SGFuZGxlKCk7XG59IiwiZXhwb3J0IHsgTWVudUFycm93IGFzIEFycm93IH0gZnJvbSBcIi4vYXJyb3cvTWVudUFycm93LmpzXCI7XG5leHBvcnQgeyBNZW51QmFja2Ryb3AgYXMgQmFja2Ryb3AgfSBmcm9tIFwiLi9iYWNrZHJvcC9NZW51QmFja2Ryb3AuanNcIjtcbmV4cG9ydCB7IE1lbnVDaGVja2JveEl0ZW0gYXMgQ2hlY2tib3hJdGVtIH0gZnJvbSBcIi4vY2hlY2tib3gtaXRlbS9NZW51Q2hlY2tib3hJdGVtLmpzXCI7XG5leHBvcnQgeyBNZW51Q2hlY2tib3hJdGVtSW5kaWNhdG9yIGFzIENoZWNrYm94SXRlbUluZGljYXRvciB9IGZyb20gXCIuL2NoZWNrYm94LWl0ZW0taW5kaWNhdG9yL01lbnVDaGVja2JveEl0ZW1JbmRpY2F0b3IuanNcIjtcbmV4cG9ydCB7IE1lbnVHcm91cCBhcyBHcm91cCB9IGZyb20gXCIuL2dyb3VwL01lbnVHcm91cC5qc1wiO1xuZXhwb3J0IHsgTWVudUdyb3VwTGFiZWwgYXMgR3JvdXBMYWJlbCB9IGZyb20gXCIuL2dyb3VwLWxhYmVsL01lbnVHcm91cExhYmVsLmpzXCI7XG5leHBvcnQgeyBNZW51SXRlbSBhcyBJdGVtIH0gZnJvbSBcIi4vaXRlbS9NZW51SXRlbS5qc1wiO1xuZXhwb3J0IHsgTWVudUxpbmtJdGVtIGFzIExpbmtJdGVtIH0gZnJvbSBcIi4vbGluay1pdGVtL01lbnVMaW5rSXRlbS5qc1wiO1xuZXhwb3J0IHsgTWVudVBvcHVwIGFzIFBvcHVwIH0gZnJvbSBcIi4vcG9wdXAvTWVudVBvcHVwLmpzXCI7XG5leHBvcnQgeyBNZW51UG9ydGFsIGFzIFBvcnRhbCB9IGZyb20gXCIuL3BvcnRhbC9NZW51UG9ydGFsLmpzXCI7XG5leHBvcnQgeyBNZW51UG9zaXRpb25lciBhcyBQb3NpdGlvbmVyIH0gZnJvbSBcIi4vcG9zaXRpb25lci9NZW51UG9zaXRpb25lci5qc1wiO1xuZXhwb3J0IHsgTWVudVJhZGlvR3JvdXAgYXMgUmFkaW9Hcm91cCB9IGZyb20gXCIuL3JhZGlvLWdyb3VwL01lbnVSYWRpb0dyb3VwLmpzXCI7XG5leHBvcnQgeyBNZW51UmFkaW9JdGVtIGFzIFJhZGlvSXRlbSB9IGZyb20gXCIuL3JhZGlvLWl0ZW0vTWVudVJhZGlvSXRlbS5qc1wiO1xuZXhwb3J0IHsgTWVudVJhZGlvSXRlbUluZGljYXRvciBhcyBSYWRpb0l0ZW1JbmRpY2F0b3IgfSBmcm9tIFwiLi9yYWRpby1pdGVtLWluZGljYXRvci9NZW51UmFkaW9JdGVtSW5kaWNhdG9yLmpzXCI7XG5leHBvcnQgeyBNZW51Um9vdCBhcyBSb290IH0gZnJvbSBcIi4vcm9vdC9NZW51Um9vdC5qc1wiO1xuZXhwb3J0IHsgTWVudVN1Ym1lbnVSb290IGFzIFN1Ym1lbnVSb290IH0gZnJvbSBcIi4vc3VibWVudS1yb290L01lbnVTdWJtZW51Um9vdC5qc1wiO1xuZXhwb3J0IHsgTWVudVRyaWdnZXIgYXMgVHJpZ2dlciB9IGZyb20gXCIuL3RyaWdnZXIvTWVudVRyaWdnZXIuanNcIjtcbmV4cG9ydCB7IE1lbnVWaWV3cG9ydCBhcyBWaWV3cG9ydCB9IGZyb20gXCIuL3ZpZXdwb3J0L01lbnVWaWV3cG9ydC5qc1wiO1xuZXhwb3J0IHsgU2VwYXJhdG9yIH0gZnJvbSBcIi4uL3NlcGFyYXRvci9TZXBhcmF0b3IuanNcIjtcbmV4cG9ydCB7IE1lbnVTdWJtZW51VHJpZ2dlciBhcyBTdWJtZW51VHJpZ2dlciB9IGZyb20gXCIuL3N1Ym1lbnUtdHJpZ2dlci9NZW51U3VibWVudVRyaWdnZXIuanNcIjtcbmV4cG9ydCB7IE1lbnVIYW5kbGUgYXMgSGFuZGxlLCBjcmVhdGVNZW51SGFuZGxlIGFzIGNyZWF0ZUhhbmRsZSB9IGZyb20gXCIuL3N0b3JlL01lbnVIYW5kbGUuanNcIjsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTLGFBQWEsT0FBTyxhQUFhO0NBQ3hDLElBQUksZUFBZSxRQUFRLENBQUMsdUJBQXVCLFdBQVcsR0FDNUQsT0FBTztDQUVULElBQUksT0FBTyxVQUFVLFlBQ25CLE9BQU8sTUFBTTtDQUVmLE9BQU87QUFDVDtBQUNBLFNBQWdCLFNBQVMsT0FBTyxNQUFNLGFBQWE7Q0FDakQsTUFBTSxTQUFTLGFBQWEsT0FBTyxXQUFXO0NBQzlDLElBQUksT0FBTyxXQUFXLFVBQ3BCLE9BQU87Q0FFVCxPQUFPLFNBQVM7QUFDbEI7QUFDQSxTQUFnQixVQUFVLE9BQU87Q0FDL0IsSUFBSSxPQUFPLFVBQVUsWUFDbkIsT0FBTyxNQUFNO0NBRWYsT0FBTztBQUNUO0FBQ0EsU0FBZ0IscUJBQXFCLGVBQWUsa0JBQWtCO0NBQ3BFLE9BQU8sb0JBQW9CLGtCQUFrQixXQUFXLGtCQUFrQjtBQUM1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bkUsU0FBUyxnQkFBZ0IsZUFBZSxDQUFDO0VBQ3pDLGFBQWEsWUFBWSxFQUN2QixvQkFBb0IsS0FDdEIsQ0FBQztFQUNELFdBQVc7RUFDWCxNQUFNO0VBQ04sUUFBUTtFQUNSLE9BQU8sa0JBQWtCO0dBQ3ZCLE1BQU07R0FDTixPQUFPO0VBQ1QsSUFBSTtFQUNKO0VBQ0EsY0FBYztFQUNkLGlCQUFpQixNQUFNLE9BQU8sa0JBQWtCLE1BQU07Q0FDeEQsQ0FBQztDQVFELE1BQU0sd0JBUFEsU0FBUyxxQkFBcUI7RUFDMUMsU0FBUyxDQUFDO0VBQ1YsT0FBTztFQUNQLFFBQVEsQ0FBQztFQUNULGFBQWE7RUFDYixhQUFhO0NBQ2YsQ0FDa0MsQ0FBQyxDQUFDLGFBQWE7Q0FDakQsTUFBTSxtQkFBbUIsTUFBTSxTQUFTLGdCQUFnQixJQUFJO0NBQzVELE9BQU8saUJBQWlCO0NBb0J4QixPQWRnQixpQkFBaUIsT0FBTyxnQkFBZ0I7RUFDdEQsT0FBQTtHQUxBO0dBQ0E7R0FDQTtFQUdJO0VBQ0osd0JBQXdCO0VBQ3hCLE9BQU87R0FBQztHQUF1QjtHQUFZO0dBQWtCO0dBQVc7SUFDdEUsaUJBQWlCO0lBQ2pCLFVBQVUsUUFBUSxjQUFjLElBQUk7SUFDcEMsU0FBUztLQUNQLElBQUksYUFDRixnQkFBZ0IsSUFBSSxlQUFlLElBQUk7SUFFM0M7R0FDRjtHQUFHO0dBQWM7RUFBWTtFQUM3QixLQUFLO0dBQUM7R0FBYyxTQUFTO0dBQUs7R0FBUztHQUFpQjtFQUF1QjtDQUNyRixDQUNhO0FBQ2YsQ0FBQztBQUMwQyxtQkFBbUIsY0FBYzs7O0FDeko1RSxJQUFhLGFBQWIsTUFBd0I7Ozs7O0NBTXRCLGNBQWM7RUFDWixLQUFLLFFBQVEsSUFBSSxVQUFVO0NBQzdCOzs7Ozs7O0NBUUEsS0FBSyxXQUFXO0VBQ2QsTUFBTSxpQkFBaUIsWUFBWSxLQUFLLE1BQU0sUUFBUSxnQkFBZ0IsUUFBUSxTQUFTLElBQUksS0FBQTtFQUMzRixJQUFJLGFBQWEsQ0FBQyxnQkFDaEIsTUFBTSxJQUFJLE1BQThDLHVEQUF1RCxVQUFVLEdBQXdDO0VBRW5LLEtBQUssTUFBTSxRQUFRLE1BQU0seUJBQXlCLHFCQUFxQixLQUFBLEdBQVcsY0FBYyxDQUFDO0NBQ25HOzs7O0NBS0EsUUFBUTtFQUNOLEtBQUssTUFBTSxRQUFRLE9BQU8seUJBQXlCLHFCQUFxQixLQUFBLEdBQVcsS0FBQSxDQUFTLENBQUM7Q0FDL0Y7Ozs7Q0FLQSxJQUFJLFNBQVM7RUFDWCxPQUFPLEtBQUssTUFBTSxPQUFPLE1BQU07Q0FDakM7QUFDRjs7OztBQUtBLFNBQWdCLG1CQUFtQjtDQUNqQyxPQUFPLElBQUksV0FBVztBQUN4QiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwLDQxLDQyLDQzLDQ0LDQ1LDQ2LDQ3LDQ4XX0=