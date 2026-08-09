import { i as __toESM, t as __commonJSMin } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_react_dom } from "/node_modules/.vite/deps/react-dom.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
import { C as isWebKit, _ as isLastTraversableNode, a as getComputedStyle, b as isShadowRoot, f as getParentNode, g as isHTMLElement, h as isElement, l as getNodeName, p as getWindow, r as useStableCallback, t as useIsoLayoutEffect, v as isNode, y as isOverflowElement } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { c as useRefWithInit, i as NOOP, o as isReactVersionAtLeast, r as EMPTY_OBJECT, s as useMergedRefs, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { D as isElementVisible, X as AnimationFrame, Z as useAnimationFrame, at as isMouseLikePointerType, ct as isVirtualPointerEvent, dt as isJSDOM, g as useOpenChangeComplete, gt as TransitionStatusDataAttributes, ht as useOnMount, it as isClickLikeEvent, lt as stopEvent, mt as isWebKit$1, nt as FOCUSABLE_ATTRIBUTE, ot as isReactEvent, pt as isSafari, rt as TYPEABLE_SELECTOR, st as isVirtualClick, ut as isIOS, v as useTransitionStatus, y as resolveRef } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { c as focusOut, h as outsidePress, n as useId, r as createChangeEventDetails, s as escapeKey, y as triggerPress } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, n as activeElement, r as contains, t as ownerDocument } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { n as visuallyHidden, t as useValueChanged } from "/node_modules/.vite/deps/useValueChanged-BvCqBnsu.js?v=1d2f6f90";
import { t as require_shim } from "/node_modules/.vite/deps/shim-Jf0PCdQ_.js?v=1d2f6f90";
//#region node_modules/@base-ui/react/esm/utils/popupStateMapping.js
var CommonPopupDataAttributes = function(CommonPopupDataAttributes) {
	/**
	* Present when the popup is open.
	*/
	CommonPopupDataAttributes["open"] = "data-open";
	/**
	* Present when the popup is closed.
	*/
	CommonPopupDataAttributes["closed"] = "data-closed";
	/**
	* Present when the popup is animating in.
	*/
	CommonPopupDataAttributes[CommonPopupDataAttributes["startingStyle"] = TransitionStatusDataAttributes.startingStyle] = "startingStyle";
	/**
	* Present when the popup is animating out.
	*/
	CommonPopupDataAttributes[CommonPopupDataAttributes["endingStyle"] = TransitionStatusDataAttributes.endingStyle] = "endingStyle";
	/**
	* Present when the anchor is hidden.
	*/
	CommonPopupDataAttributes["anchorHidden"] = "data-anchor-hidden";
	/**
	* Indicates which side the popup is positioned relative to the trigger.
	* @type { 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
	*/
	CommonPopupDataAttributes["side"] = "data-side";
	/**
	* Indicates how the popup is aligned relative to specified side.
	* @type {'start' | 'center' | 'end'}
	*/
	CommonPopupDataAttributes["align"] = "data-align";
	return CommonPopupDataAttributes;
}({});
var CommonTriggerDataAttributes = /*#__PURE__*/ function(CommonTriggerDataAttributes) {
	/**
	* Present when the popup is open.
	*/
	CommonTriggerDataAttributes["popupOpen"] = "data-popup-open";
	/**
	* Present when a pressable trigger is pressed.
	*/
	CommonTriggerDataAttributes["pressed"] = "data-pressed";
	return CommonTriggerDataAttributes;
}({});
var TRIGGER_HOOK = { [CommonTriggerDataAttributes.popupOpen]: "" };
var PRESSABLE_TRIGGER_HOOK = {
	[CommonTriggerDataAttributes.popupOpen]: "",
	[CommonTriggerDataAttributes.pressed]: ""
};
var POPUP_OPEN_HOOK = { [CommonPopupDataAttributes.open]: "" };
var POPUP_CLOSED_HOOK = { [CommonPopupDataAttributes.closed]: "" };
var ANCHOR_HIDDEN_HOOK = { [CommonPopupDataAttributes.anchorHidden]: "" };
var triggerOpenStateMapping = { open(value) {
	if (value) return TRIGGER_HOOK;
	return null;
} };
var pressableTriggerOpenStateMapping = { open(value) {
	if (value) return PRESSABLE_TRIGGER_HOOK;
	return null;
} };
var popupStateMapping = {
	open(value) {
		if (value) return POPUP_OPEN_HOOK;
		return POPUP_CLOSED_HOOK;
	},
	anchorHidden(value) {
		if (value) return ANCHOR_HIDDEN_HOOK;
		return null;
	}
};
//#endregion
//#region node_modules/@base-ui/utils/esm/useTimeout.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var EMPTY = 0;
var Timeout = class Timeout {
	static create() {
		return new Timeout();
	}
	currentId = EMPTY;
	/**
	* Executes `fn` after `delay`, clearing any previously scheduled call.
	*/
	start(delay, fn) {
		this.clear();
		this.currentId = setTimeout(() => {
			this.currentId = EMPTY;
			fn();
		}, delay);
	}
	isStarted() {
		return this.currentId !== EMPTY;
	}
	clear = () => {
		if (this.currentId !== EMPTY) {
			clearTimeout(this.currentId);
			this.currentId = EMPTY;
		}
	};
	disposeEffect = () => {
		return this.clear;
	};
};
/**
* A `setTimeout` with automatic cleanup and guard.
*/
function useTimeout() {
	const timeout = useRefWithInit(Timeout.create).current;
	useOnMount(timeout.disposeEffect);
	return timeout;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/element.js
var import_jsx_runtime = require_jsx_runtime();
function isTargetInsideEnabledTrigger(target, triggerElements) {
	if (!isElement(target)) return false;
	const targetElement = target;
	if (triggerElements.hasElement(targetElement)) return !targetElement.hasAttribute("data-trigger-disabled");
	for (const [, trigger] of triggerElements.entries()) if (contains(trigger, targetElement)) return !trigger.hasAttribute("data-trigger-disabled");
	return false;
}
function isEventTargetWithin(event, node) {
	if (node == null) return false;
	if ("composedPath" in event) return event.composedPath().includes(node);
	const eventAgain = event;
	return eventAgain.target != null && node.contains(eventAgain.target);
}
function isRootElement(element) {
	return element.matches("html,body");
}
function isTypeableElement(element) {
	return isHTMLElement(element) && element.matches("input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])");
}
function isInteractiveElement(element) {
	return element?.closest(`button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`) != null;
}
function isTypeableCombobox(element) {
	if (!element) return false;
	return element.getAttribute("role") === "combobox" && isTypeableElement(element);
}
function matchesFocusVisible(element) {
	if (!element || isJSDOM) return true;
	try {
		return element.matches(":focus-visible");
	} catch (_e) {
		return true;
	}
}
function getFloatingFocusElement(floatingElement) {
	if (!floatingElement) return null;
	return floatingElement.hasAttribute("data-base-ui-focusable") ? floatingElement : floatingElement.querySelector(`[data-base-ui-focusable]`) || floatingElement;
}
//#endregion
//#region node_modules/@base-ui/utils/esm/addEventListener.js
/**
* Adds an event listener and returns a cleanup function to remove it.
*/
function addEventListener(target, type, listener, options) {
	target.addEventListener(type, listener, options);
	return () => {
		target.removeEventListener(type, listener, options);
	};
}
//#endregion
//#region node_modules/@base-ui/utils/esm/mergeCleanups.js
/**
* Combines multiple cleanup functions into a single cleanup function.
*/
function mergeCleanups(...cleanups) {
	return () => {
		for (let i = 0; i < cleanups.length; i += 1) {
			const cleanup = cleanups[i];
			if (cleanup) cleanup();
		}
	};
}
//#endregion
//#region node_modules/@base-ui/utils/esm/useValueAsRef.js
/**
* Untracks the provided value by turning it into a ref to remove its reactivity.
*
* Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
*/
function useValueAsRef(value) {
	const latest = useRefWithInit(createLatestRef, value).current;
	latest.next = value;
	useIsoLayoutEffect(latest.effect);
	return latest;
}
function createLatestRef(value) {
	const latest = {
		current: value,
		next: value,
		effect: () => {
			latest.current = latest.next;
		}
	};
	return latest;
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/FocusGuard.js
/**
* @internal
*/
var FocusGuard = /*#__PURE__*/ import_react.forwardRef(function FocusGuard(props, ref) {
	const [role, setRole] = import_react.useState();
	useIsoLayoutEffect(() => {
		if (isSafari) setRole("button");
	}, []);
	const restProps = {
		tabIndex: 0,
		role
	};
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
		...props,
		ref,
		style: visuallyHidden,
		"aria-hidden": role ? void 0 : true,
		...restProps,
		"data-base-ui-focus-guard": ""
	});
});
FocusGuard.displayName = "FocusGuard";
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/tabbable.js
var CANDIDATE_SELECTOR = "a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable=\"false\"]),audio[controls],video[controls]";
function getParentElement(element) {
	const assignedSlot = element.assignedSlot;
	if (assignedSlot) return assignedSlot;
	if (element.parentElement) return element.parentElement;
	const rootNode = element.getRootNode();
	return isShadowRoot(rootNode) ? rootNode.host : null;
}
function getDetailsSummary(details) {
	for (const child of Array.from(details.children)) if (getNodeName(child) === "summary") return child;
	return null;
}
function isWithinOpenDetailsSummary(element, details) {
	const summary = getDetailsSummary(details);
	return !!summary && (element === summary || contains(summary, element));
}
function isFocusableCandidate(element) {
	const nodeName = element ? getNodeName(element) : "";
	return element != null && element.matches(CANDIDATE_SELECTOR) && (nodeName !== "summary" || element.parentElement != null && getNodeName(element.parentElement) === "details" && getDetailsSummary(element.parentElement) === element) && (nodeName !== "details" || getDetailsSummary(element) == null) && (nodeName !== "input" || element.type !== "hidden");
}
function isFocusableElement(element) {
	if (!isFocusableCandidate(element) || !element.isConnected || element.matches(":disabled")) return false;
	for (let current = element; current; current = getParentElement(current)) {
		const isAncestor = current !== element;
		const isSlot = getNodeName(current) === "slot";
		if (current.hasAttribute("inert")) return false;
		if (isAncestor && getNodeName(current) === "details" && !current.open && !isWithinOpenDetailsSummary(element, current) || current.hasAttribute("hidden") || !isSlot && !isVisibleInTabbableTree(current, isAncestor)) return false;
	}
	return true;
}
function isVisibleInTabbableTree(element, isAncestor) {
	const styles = getComputedStyle(element);
	if (!isAncestor) return isElementVisible(element, styles);
	return styles.display !== "none";
}
function getTabIndex(element) {
	const tabIndex = element.tabIndex;
	if (tabIndex < 0) {
		const nodeName = getNodeName(element);
		if (nodeName === "details" || nodeName === "audio" || nodeName === "video" || isHTMLElement(element) && element.isContentEditable) return 0;
	}
	return tabIndex;
}
function getNamedRadioInput(element) {
	if (getNodeName(element) !== "input") return null;
	const input = element;
	return input.type === "radio" && input.name !== "" ? input : null;
}
function isTabbableRadio(element, candidates) {
	const input = getNamedRadioInput(element);
	if (!input) return true;
	const checkedRadio = candidates.find((candidate) => {
		const radio = getNamedRadioInput(candidate);
		return radio?.name === input.name && radio.form === input.form && radio.checked;
	});
	if (checkedRadio) return checkedRadio === input;
	return candidates.find((candidate) => {
		const radio = getNamedRadioInput(candidate);
		return radio?.name === input.name && radio.form === input.form;
	}) === input;
}
function getComposedChildren(container) {
	if (isHTMLElement(container) && getNodeName(container) === "slot") {
		const assignedElements = container.assignedElements({ flatten: true });
		if (assignedElements.length > 0) return assignedElements;
	}
	if (isHTMLElement(container) && container.shadowRoot) return Array.from(container.shadowRoot.children);
	return Array.from(container.children);
}
function appendCandidates(container, list) {
	getComposedChildren(container).forEach((child) => {
		if (isFocusableCandidate(child)) list.push(child);
		appendCandidates(child, list);
	});
}
function appendMatchingElements(container, selector, list) {
	getComposedChildren(container).forEach((child) => {
		if (isHTMLElement(child) && child.matches(selector)) list.push(child);
		appendMatchingElements(child, selector, list);
	});
}
function isTabbable(element) {
	return isFocusableElement(element) && getTabIndex(element) >= 0;
}
function focusable(container) {
	const candidates = [];
	appendCandidates(container, candidates);
	return candidates.filter(isFocusableElement);
}
function tabbable(container) {
	const candidates = focusable(container);
	return candidates.filter((element) => getTabIndex(element) >= 0 && isTabbableRadio(element, candidates));
}
function getTabbableIn(container, dir) {
	const list = tabbable(container);
	const len = list.length;
	if (len === 0) return;
	const active = activeElement(ownerDocument(container));
	const index = list.indexOf(active);
	return list[index === -1 ? dir === 1 ? 0 : len - 1 : index + dir];
}
function getNextTabbable(referenceElement) {
	return getTabbableIn(ownerDocument(referenceElement).body, 1) || referenceElement;
}
function getPreviousTabbable(referenceElement) {
	return getTabbableIn(ownerDocument(referenceElement).body, -1) || referenceElement;
}
function getTabbableNearElement(referenceElement, dir) {
	if (!referenceElement) return null;
	const list = tabbable(ownerDocument(referenceElement).body);
	const elementCount = list.length;
	if (elementCount === 0) return null;
	const index = list.indexOf(referenceElement);
	if (index === -1) return null;
	return list[(index + dir + elementCount) % elementCount];
}
function getTabbableAfterElement(referenceElement) {
	return getTabbableNearElement(referenceElement, 1);
}
function getTabbableBeforeElement(referenceElement) {
	return getTabbableNearElement(referenceElement, -1);
}
function isOutsideEvent(event, container) {
	const containerElement = container || event.currentTarget;
	const relatedTarget = event.relatedTarget;
	return !relatedTarget || !contains(containerElement, relatedTarget);
}
function disableFocusInside(container) {
	tabbable(container).forEach((element) => {
		element.dataset.tabindex = element.getAttribute("tabindex") || "";
		element.setAttribute("tabindex", "-1");
	});
}
function enableFocusInside(container) {
	const elements = [];
	appendMatchingElements(container, "[data-tabindex]", elements);
	elements.forEach((element) => {
		const tabindex = element.dataset.tabindex;
		delete element.dataset.tabindex;
		if (tabindex) element.setAttribute("tabindex", tabindex);
		else element.removeAttribute("tabindex");
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/nodes.js
function getNodeChildren(nodes, id, onlyOpenChildren = true) {
	return nodes.filter((node) => node.parentId === id).flatMap((child) => [...!onlyOpenChildren || child.context?.open ? [child] : [], ...getNodeChildren(nodes, child.id, onlyOpenChildren)]);
}
function getNodeAncestors(nodes, id) {
	let allAncestors = [];
	let currentParentId = nodes.find((node) => node.id === id)?.parentId;
	while (currentParentId) {
		const currentNode = nodes.find((node) => node.id === currentParentId);
		currentParentId = currentNode?.parentId;
		if (currentNode) allAncestors = allAncestors.concat(currentNode);
	}
	return allAncestors;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/createAttribute.js
function createAttribute(name) {
	return `data-base-ui-${name}`;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/enqueueFocus.js
var rafId = 0;
function enqueueFocus(el, options = {}) {
	const { preventScroll = false, sync = false, shouldFocus } = options;
	cancelAnimationFrame(rafId);
	function exec() {
		if (shouldFocus && !shouldFocus()) return;
		el?.focus({ preventScroll });
	}
	if (sync) {
		exec();
		return NOOP;
	}
	const currentRafId = requestAnimationFrame(exec);
	rafId = currentRafId;
	return () => {
		if (rafId === currentRafId) {
			cancelAnimationFrame(currentRafId);
			rafId = 0;
		}
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/markOthers.js
var counters = {
	inert: /* @__PURE__ */ new WeakMap(),
	"aria-hidden": /* @__PURE__ */ new WeakMap()
};
var markerName = "data-base-ui-inert";
var uncontrolledElementsSets = {
	inert: /* @__PURE__ */ new WeakSet(),
	"aria-hidden": /* @__PURE__ */ new WeakSet()
};
var markerCounterMap = /* @__PURE__ */ new WeakMap();
var lockCount = 0;
function getUncontrolledElementsSet(controlAttribute) {
	return uncontrolledElementsSets[controlAttribute];
}
function unwrapHost(node) {
	if (!node) return null;
	return isShadowRoot(node) ? node.host : unwrapHost(node.parentNode);
}
var correctElements = (parent, targets) => targets.map((target) => {
	if (parent.contains(target)) return target;
	const correctedTarget = unwrapHost(target);
	if (parent.contains(correctedTarget)) return correctedTarget;
	return null;
}).filter((x) => x != null);
var buildKeepSet = (targets) => {
	const keep = /* @__PURE__ */ new Set();
	targets.forEach((target) => {
		let node = target;
		while (node && !keep.has(node)) {
			keep.add(node);
			node = node.parentNode;
		}
	});
	return keep;
};
var collectOutsideElements = (root, keepElements, stopElements) => {
	const outside = [];
	const walk = (parent) => {
		if (!parent || stopElements.has(parent)) return;
		Array.from(parent.children).forEach((node) => {
			if (getNodeName(node) === "script") return;
			if (keepElements.has(node)) walk(node);
			else outside.push(node);
		});
	};
	walk(root);
	return outside;
};
function applyAttributeToOthers(uncorrectedAvoidElements, body, ariaHidden, inert, { mark = true, markerIgnoreElements = [] }) {
	const controlAttribute = inert ? "inert" : ariaHidden ? "aria-hidden" : null;
	let counterMap = null;
	let uncontrolledElementsSet = null;
	const avoidElements = correctElements(body, uncorrectedAvoidElements);
	const markerIgnoreTargets = mark ? correctElements(body, markerIgnoreElements) : [];
	const markerIgnoreSet = new Set(markerIgnoreTargets);
	const markerTargets = mark ? collectOutsideElements(body, buildKeepSet(avoidElements), new Set(avoidElements)).filter((target) => !markerIgnoreSet.has(target)) : [];
	const hiddenElements = [];
	const markedElements = [];
	if (controlAttribute) {
		const map = counters[controlAttribute];
		const currentUncontrolledElementsSet = getUncontrolledElementsSet(controlAttribute);
		uncontrolledElementsSet = currentUncontrolledElementsSet;
		counterMap = map;
		const ariaLiveElements = correctElements(body, Array.from(body.querySelectorAll("[aria-live]")));
		const controlElements = avoidElements.concat(ariaLiveElements);
		collectOutsideElements(body, buildKeepSet(controlElements), new Set(controlElements)).forEach((node) => {
			const attr = node.getAttribute(controlAttribute);
			const alreadyHidden = attr !== null && attr !== "false";
			const counterValue = (map.get(node) || 0) + 1;
			map.set(node, counterValue);
			hiddenElements.push(node);
			if (counterValue === 1 && alreadyHidden) currentUncontrolledElementsSet.add(node);
			if (!alreadyHidden) node.setAttribute(controlAttribute, controlAttribute === "inert" ? "" : "true");
		});
	}
	if (mark) markerTargets.forEach((node) => {
		const markerValue = (markerCounterMap.get(node) || 0) + 1;
		markerCounterMap.set(node, markerValue);
		markedElements.push(node);
		if (markerValue === 1) node.setAttribute(markerName, "");
	});
	lockCount += 1;
	return () => {
		if (counterMap) hiddenElements.forEach((element) => {
			const counterValue = (counterMap.get(element) || 0) - 1;
			counterMap.set(element, counterValue);
			if (!counterValue) {
				if (!uncontrolledElementsSet?.has(element) && controlAttribute) element.removeAttribute(controlAttribute);
				uncontrolledElementsSet?.delete(element);
			}
		});
		if (mark) markedElements.forEach((element) => {
			const markerValue = (markerCounterMap.get(element) || 0) - 1;
			markerCounterMap.set(element, markerValue);
			if (!markerValue) element.removeAttribute(markerName);
		});
		lockCount -= 1;
		if (!lockCount) {
			counters.inert = /* @__PURE__ */ new WeakMap();
			counters["aria-hidden"] = /* @__PURE__ */ new WeakMap();
			uncontrolledElementsSets.inert = /* @__PURE__ */ new WeakSet();
			uncontrolledElementsSets["aria-hidden"] = /* @__PURE__ */ new WeakSet();
			markerCounterMap = /* @__PURE__ */ new WeakMap();
		}
	};
}
function markOthers(avoidElements, options = {}) {
	const { ariaHidden = false, inert = false, mark = true, markerIgnoreElements = [] } = options;
	const body = ownerDocument(avoidElements[0]).body;
	return applyAttributeToOthers(avoidElements, body, ariaHidden, inert, {
		mark,
		markerIgnoreElements
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/constants.js
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var DISABLED_TRANSITIONS_STYLE = { style: { transition: "none" } };
var CLICK_TRIGGER_IDENTIFIER = "data-base-ui-click-trigger";
var BASE_UI_SWIPE_IGNORE_ATTRIBUTE = "data-base-ui-swipe-ignore";
var LEGACY_SWIPE_IGNORE_ATTRIBUTE = "data-swipe-ignore";
`${BASE_UI_SWIPE_IGNORE_ATTRIBUTE}`;
`${LEGACY_SWIPE_IGNORE_ATTRIBUTE}`;
/**
* Used for dropdowns that usually strictly prefer top/bottom placements and
* use `var(--available-height)` to limit their height.
*/
var DROPDOWN_COLLISION_AVOIDANCE = { fallbackAxisSide: "none" };
/**
* Used by regular popups that usually aren't scrollable and are allowed to
* freely flip to any axis of placement.
*/
var POPUP_COLLISION_AVOIDANCE = { fallbackAxisSide: "end" };
/**
* Special visually hidden styles for the aria-owns owner element to ensure owned element
* accessibility in iOS/Safari/VoiceControl.
* The owner element is an empty span, so most of the common visually hidden styles are not needed.
* @see https://github.com/floating-ui/floating-ui/issues/3403
*/
var ownerVisuallyHidden = {
	clipPath: "inset(50%)",
	position: "fixed",
	top: 0,
	left: 0
};
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/components/FloatingPortal.js
var PortalContext = /*#__PURE__*/ import_react.createContext(null);
PortalContext.displayName = "PortalContext";
var usePortalContext = () => import_react.useContext(PortalContext);
var attr = createAttribute("portal");
function useFloatingPortalNode(props = {}) {
	const { ref, container: containerProp, componentProps = EMPTY_OBJECT, elementProps } = props;
	const uniqueId = useId();
	const parentPortalNode = usePortalContext()?.portalNode;
	const [containerElement, setContainerElement] = import_react.useState(null);
	const [portalNode, setPortalNode] = import_react.useState(null);
	const setPortalNodeRef = useStableCallback((node) => {
		if (node !== null) setPortalNode(node);
	});
	const containerRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (containerProp === null) {
			if (containerRef.current) {
				containerRef.current = null;
				setPortalNode(null);
				setContainerElement(null);
			}
			return;
		}
		if (uniqueId == null) return;
		const resolvedContainer = (containerProp && (isNode(containerProp) ? containerProp : containerProp.current)) ?? parentPortalNode ?? document.body;
		if (resolvedContainer == null) {
			if (containerRef.current) {
				containerRef.current = null;
				setPortalNode(null);
				setContainerElement(null);
			}
			return;
		}
		if (containerRef.current !== resolvedContainer) {
			containerRef.current = resolvedContainer;
			setPortalNode(null);
			setContainerElement(resolvedContainer);
		}
	}, [
		containerProp,
		parentPortalNode,
		uniqueId
	]);
	const portalElement = useRenderElement("div", componentProps, {
		ref: [ref, setPortalNodeRef],
		props: [{
			id: uniqueId,
			[attr]: ""
		}, elementProps]
	});
	return {
		portalNode,
		portalSubtree: containerElement && portalElement ? /*#__PURE__*/ import_react_dom.createPortal(portalElement, containerElement) : null
	};
}
/**
* Portals the floating element into a given container element — by default,
* outside of the app root and into the body.
* This is necessary to ensure the floating element can appear outside any
* potential parent containers that cause clipping (such as `overflow: hidden`),
* while retaining its location in the React tree.
* @see https://floating-ui.com/docs/FloatingPortal
* @internal
*/
var FloatingPortal = /*#__PURE__*/ import_react.forwardRef(function FloatingPortal(componentProps, forwardedRef) {
	const { render, className, style, children, container, renderGuards, ...elementProps } = componentProps;
	const { portalNode, portalSubtree } = useFloatingPortalNode({
		container,
		ref: forwardedRef,
		componentProps,
		elementProps
	});
	const beforeOutsideRef = import_react.useRef(null);
	const afterOutsideRef = import_react.useRef(null);
	const beforeInsideRef = import_react.useRef(null);
	const afterInsideRef = import_react.useRef(null);
	const [focusManagerState, setFocusManagerState] = import_react.useState(null);
	const focusInsideDisabledRef = import_react.useRef(false);
	const modal = focusManagerState?.modal;
	const open = focusManagerState?.open;
	const shouldRenderGuards = typeof renderGuards === "boolean" ? renderGuards : !!focusManagerState && !focusManagerState.modal && focusManagerState.open && !!portalNode;
	import_react.useEffect(() => {
		if (!portalNode || modal) return;
		function onFocus(event) {
			if (portalNode && event.relatedTarget && isOutsideEvent(event)) if (event.type === "focusin") {
				if (focusInsideDisabledRef.current) {
					enableFocusInside(portalNode);
					focusInsideDisabledRef.current = false;
				}
			} else {
				disableFocusInside(portalNode);
				focusInsideDisabledRef.current = true;
			}
		}
		return mergeCleanups(addEventListener(portalNode, "focusin", onFocus, true), addEventListener(portalNode, "focusout", onFocus, true));
	}, [portalNode, modal]);
	import_react.useEffect(() => {
		if (!portalNode || open !== false) return;
		enableFocusInside(portalNode);
		focusInsideDisabledRef.current = false;
	}, [open, portalNode]);
	const portalContextValue = import_react.useMemo(() => ({
		beforeOutsideRef,
		afterOutsideRef,
		beforeInsideRef,
		afterInsideRef,
		portalNode,
		setFocusManagerState
	}), [portalNode]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [portalSubtree, /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(PortalContext.Provider, {
		value: portalContextValue,
		children: [
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
				"data-type": "outside",
				ref: beforeOutsideRef,
				onFocus: (event) => {
					if (isOutsideEvent(event, portalNode)) beforeInsideRef.current?.focus();
					else getPreviousTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
				}
			}),
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
				"aria-owns": portalNode.id,
				style: ownerVisuallyHidden
			}),
			portalNode && /*#__PURE__*/ import_react_dom.createPortal(children, portalNode),
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
				"data-type": "outside",
				ref: afterOutsideRef,
				onFocus: (event) => {
					if (isOutsideEvent(event, portalNode)) afterInsideRef.current?.focus();
					else {
						getNextTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
						if (focusManagerState?.closeOnFocusOut) focusManagerState?.onOpenChange(false, createChangeEventDetails("focus-out", event.nativeEvent));
					}
				}
			})
		]
	})] });
});
FloatingPortal.displayName = "FloatingPortal";
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/createEventEmitter.js
function createEventEmitter() {
	const map = /* @__PURE__ */ new Map();
	return {
		emit(event, data) {
			map.get(event)?.forEach((listener) => listener(data));
		},
		on(event, listener) {
			if (!map.has(event)) map.set(event, /* @__PURE__ */ new Set());
			map.get(event).add(listener);
		},
		off(event, listener) {
			map.get(event)?.delete(listener);
		}
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/components/FloatingTreeStore.js
/**
* Stores and manages floating elements in a tree structure.
* This is a backing store for the `FloatingTree` component.
*/
var FloatingTreeStore = class {
	nodesRef = { current: [] };
	events = createEventEmitter();
	addNode(node) {
		this.nodesRef.current.push(node);
	}
	removeNode(node) {
		const index = this.nodesRef.current.findIndex((n) => n === node);
		if (index !== -1) this.nodesRef.current.splice(index, 1);
	}
};
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/components/FloatingTree.js
var FloatingNodeContext = /*#__PURE__*/ import_react.createContext(null);
FloatingNodeContext.displayName = "FloatingNodeContext";
var FloatingTreeContext = /*#__PURE__*/ import_react.createContext(null);
FloatingTreeContext.displayName = "FloatingTreeContext";
var useFloatingParentNodeId = () => import_react.useContext(FloatingNodeContext)?.id || null;
/**
* Returns the nearest floating tree context, if available.
*/
var useFloatingTree = (externalTree) => {
	const contextTree = import_react.useContext(FloatingTreeContext);
	return externalTree ?? contextTree;
};
/**
* Registers a node into the `FloatingTree`, returning its id.
* @see https://floating-ui.com/docs/FloatingTree
*/
function useFloatingNodeId(externalTree) {
	const id = useId();
	const tree = useFloatingTree(externalTree);
	const parentId = useFloatingParentNodeId();
	useIsoLayoutEffect(() => {
		if (!id) return;
		const node = {
			id,
			parentId
		};
		tree?.addNode(node);
		return () => {
			tree?.removeNode(node);
		};
	}, [
		tree,
		id,
		parentId
	]);
	return id;
}
/**
* Provides parent node context for nested floating elements.
* @see https://floating-ui.com/docs/FloatingTree
* @internal
*/
function FloatingNode(props) {
	const { children, id } = props;
	const parentId = useFloatingParentNodeId();
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingNodeContext.Provider, {
		value: import_react.useMemo(() => ({
			id,
			parentId
		}), [id, parentId]),
		children
	});
}
/**
* Provides context for nested floating elements when they are not children of
* each other on the DOM.
* This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
* - The `bubbles` option in the `useDismiss()` Hook
* - Nested virtual list navigation
* - Nested floating elements that each open on hover
* - Custom communication between parent and child floating elements
* @see https://floating-ui.com/docs/FloatingTree
* @internal
*/
function FloatingTree(props) {
	const { children, externalTree } = props;
	const tree = useRefWithInit(() => externalTree ?? new FloatingTreeStore()).current;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingTreeContext.Provider, {
		value: tree,
		children
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/components/FloatingFocusManager.js
function getEventType(event, lastInteractionType) {
	const win = getWindow(getTarget(event));
	if (event instanceof win.KeyboardEvent) return "keyboard";
	if (event instanceof win.FocusEvent) return lastInteractionType || "keyboard";
	if ("pointerType" in event) return event.pointerType || "keyboard";
	if ("touches" in event) return "touch";
	if (event instanceof win.MouseEvent) return lastInteractionType || (event.detail === 0 ? "keyboard" : "mouse");
	return "";
}
var LIST_LIMIT = 20;
var previouslyFocusedElements = [];
function clearDisconnectedPreviouslyFocusedElements() {
	previouslyFocusedElements = previouslyFocusedElements.filter((entry) => {
		return entry.deref()?.isConnected;
	});
}
function addPreviouslyFocusedElement(element) {
	clearDisconnectedPreviouslyFocusedElements();
	if (element && getNodeName(element) !== "body") {
		previouslyFocusedElements.push(new WeakRef(element));
		if (previouslyFocusedElements.length > LIST_LIMIT) previouslyFocusedElements = previouslyFocusedElements.slice(-20);
	}
}
function getPreviouslyFocusedElement() {
	clearDisconnectedPreviouslyFocusedElements();
	return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
}
function getFirstTabbableElement(container) {
	if (!container) return null;
	if (isTabbable(container)) return container;
	return tabbable(container)[0] || container;
}
function handleTabIndex(floatingFocusElement, orderRef) {
	if (floatingFocusElement.hasAttribute("tabindex") && !floatingFocusElement.hasAttribute("data-tabindex")) return;
	if (!orderRef.current.includes("floating") && !floatingFocusElement.getAttribute("role")?.includes("dialog")) return;
	const tabbableContent = focusable(floatingFocusElement).filter((element) => {
		const dataTabIndex = element.getAttribute("data-tabindex") || "";
		return isTabbable(element) || element.hasAttribute("data-tabindex") && !dataTabIndex.startsWith("-");
	});
	const tabIndex = floatingFocusElement.getAttribute("tabindex");
	if (orderRef.current.includes("floating") || tabbableContent.length === 0) {
		if (tabIndex !== "0") floatingFocusElement.setAttribute("tabindex", "0");
	} else if (tabIndex !== "-1" || floatingFocusElement.hasAttribute("data-tabindex") && floatingFocusElement.getAttribute("data-tabindex") !== "-1") {
		floatingFocusElement.setAttribute("tabindex", "-1");
		floatingFocusElement.setAttribute("data-tabindex", "-1");
	}
}
/**
* Provides focus management for the floating element.
* @see https://floating-ui.com/docs/FloatingFocusManager
* @internal
*/
function FloatingFocusManager(props) {
	const { context, children, disabled = false, initialFocus = true, returnFocus = true, restoreFocus = false, modal = true, closeOnFocusOut = true, openInteractionType = "", nextFocusableElement, previousFocusableElement, beforeContentFocusGuardRef, externalTree, getInsideElements } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const domReference = store.useState("domReferenceElement");
	const floating = store.useState("floatingElement");
	const { events, dataRef } = store.context;
	const getNodeId = useStableCallback(() => dataRef.current.floatingContext?.nodeId);
	const ignoreInitialFocus = initialFocus === false;
	const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;
	const orderRef = import_react.useRef(["content"]);
	const initialFocusRef = useValueAsRef(initialFocus);
	const returnFocusRef = useValueAsRef(returnFocus);
	const openInteractionTypeRef = useValueAsRef(openInteractionType);
	const tree = useFloatingTree(externalTree);
	const portalContext = usePortalContext();
	const preventReturnFocusRef = import_react.useRef(false);
	const isPointerDownRef = import_react.useRef(false);
	const pointerDownOutsideRef = import_react.useRef(false);
	const lastFocusedTabbableRef = import_react.useRef(null);
	const closeTypeRef = import_react.useRef("");
	const lastInteractionTypeRef = import_react.useRef("");
	const beforeGuardRef = import_react.useRef(null);
	const afterGuardRef = import_react.useRef(null);
	const mergedBeforeGuardRef = useMergedRefs(beforeGuardRef, beforeContentFocusGuardRef, portalContext?.beforeInsideRef);
	const mergedAfterGuardRef = useMergedRefs(afterGuardRef, portalContext?.afterInsideRef);
	const blurTimeout = useTimeout();
	const pointerDownTimeout = useTimeout();
	const restoreFocusFrame = useAnimationFrame();
	const isInsidePortal = portalContext != null;
	const floatingFocusElement = getFloatingFocusElement(floating);
	const getTabbableContent = useStableCallback((container = floatingFocusElement) => {
		return container ? tabbable(container) : [];
	});
	const getResolvedInsideElements = useStableCallback(() => getInsideElements?.().filter((element) => element != null) ?? []);
	import_react.useEffect(() => {
		if (disabled || !modal) return;
		function onKeyDown(event) {
			if (event.key === "Tab") {
				if (contains(floatingFocusElement, activeElement(ownerDocument(floatingFocusElement))) && getTabbableContent().length === 0 && !isUntrappedTypeableCombobox) stopEvent(event);
			}
		}
		return addEventListener(ownerDocument(floatingFocusElement), "keydown", onKeyDown);
	}, [
		disabled,
		floatingFocusElement,
		modal,
		isUntrappedTypeableCombobox,
		getTabbableContent
	]);
	import_react.useEffect(() => {
		if (disabled || !open) return;
		const doc = ownerDocument(floatingFocusElement);
		function clearPointerDownOutside() {
			pointerDownOutsideRef.current = false;
		}
		function onPointerDown(event) {
			const target = getTarget(event);
			const insideElements = getResolvedInsideElements();
			const pointerTargetInside = contains(floating, target) || contains(domReference, target) || contains(portalContext?.portalNode, target) || insideElements.some((element) => element === target || contains(element, target));
			pointerDownOutsideRef.current = !pointerTargetInside;
			lastInteractionTypeRef.current = event.pointerType || "keyboard";
			if (target?.closest(`[data-base-ui-click-trigger]`)) isPointerDownRef.current = true;
		}
		function onKeyDown() {
			lastInteractionTypeRef.current = "keyboard";
		}
		return mergeCleanups(addEventListener(doc, "pointerdown", onPointerDown, true), addEventListener(doc, "pointerup", clearPointerDownOutside, true), addEventListener(doc, "pointercancel", clearPointerDownOutside, true), addEventListener(doc, "keydown", onKeyDown, true));
	}, [
		disabled,
		floating,
		domReference,
		floatingFocusElement,
		open,
		portalContext,
		getResolvedInsideElements
	]);
	import_react.useEffect(() => {
		if (disabled || !closeOnFocusOut) return;
		const doc = ownerDocument(floatingFocusElement);
		function handlePointerDown() {
			isPointerDownRef.current = true;
			pointerDownTimeout.start(0, () => {
				isPointerDownRef.current = false;
			});
		}
		function handleFocusIn(event) {
			const target = getTarget(event);
			if (isTabbable(target)) lastFocusedTabbableRef.current = target;
		}
		function handleFocusOutside(event) {
			const relatedTarget = event.relatedTarget;
			const currentTarget = event.currentTarget;
			const target = getTarget(event);
			queueMicrotask(() => {
				const nodeId = getNodeId();
				const triggers = store.context.triggerElements;
				const insideElements = getResolvedInsideElements();
				const isRelatedFocusGuard = relatedTarget?.hasAttribute(createAttribute("focus-guard")) && [
					beforeGuardRef.current,
					afterGuardRef.current,
					portalContext?.beforeInsideRef.current,
					portalContext?.afterInsideRef.current,
					portalContext?.beforeOutsideRef.current,
					portalContext?.afterOutsideRef.current,
					resolveRef(previousFocusableElement),
					resolveRef(nextFocusableElement)
				].includes(relatedTarget);
				const movedToUnrelatedNode = !(contains(domReference, relatedTarget) || contains(floating, relatedTarget) || contains(relatedTarget, floating) || contains(portalContext?.portalNode, relatedTarget) || insideElements.some((element) => element === relatedTarget || contains(element, relatedTarget)) || relatedTarget != null && triggers.hasElement(relatedTarget) || triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) || isRelatedFocusGuard || tree && (getNodeChildren(tree.nodesRef.current, nodeId).find((node) => contains(node.context?.elements.floating, relatedTarget) || contains(node.context?.elements.domReference, relatedTarget)) || getNodeAncestors(tree.nodesRef.current, nodeId).find((node) => [node.context?.elements.floating, getFloatingFocusElement(node.context?.elements.floating)].includes(relatedTarget) || node.context?.elements.domReference === relatedTarget)));
				if (currentTarget === domReference && floatingFocusElement) handleTabIndex(floatingFocusElement, orderRef);
				if (restoreFocus && currentTarget !== domReference && !isElementVisible(target) && activeElement(doc) === doc.body) {
					if (isHTMLElement(floatingFocusElement)) {
						floatingFocusElement.focus();
						if (restoreFocus === "popup") {
							restoreFocusFrame.request(() => {
								floatingFocusElement.focus();
							});
							return;
						}
					}
					const tabbableContent = getTabbableContent();
					const prevTabbable = lastFocusedTabbableRef.current;
					const nodeToFocus = (prevTabbable && tabbableContent.includes(prevTabbable) ? prevTabbable : null) || tabbableContent[tabbableContent.length - 1] || floatingFocusElement;
					if (isHTMLElement(nodeToFocus)) nodeToFocus.focus();
				}
				if (dataRef.current.insideReactTree) {
					dataRef.current.insideReactTree = false;
					return;
				}
				if ((isUntrappedTypeableCombobox ? true : !modal) && relatedTarget && movedToUnrelatedNode && !isPointerDownRef.current && (isUntrappedTypeableCombobox || relatedTarget !== getPreviouslyFocusedElement())) {
					preventReturnFocusRef.current = true;
					store.setOpen(false, createChangeEventDetails(focusOut, event));
				}
			});
		}
		function markInsideReactTree() {
			if (pointerDownOutsideRef.current) return;
			dataRef.current.insideReactTree = true;
			blurTimeout.start(0, () => {
				dataRef.current.insideReactTree = false;
			});
		}
		const domReferenceElement = isHTMLElement(domReference) ? domReference : null;
		if (!floating && !domReferenceElement) return;
		return mergeCleanups(domReferenceElement && addEventListener(domReferenceElement, "focusout", handleFocusOutside), domReferenceElement && addEventListener(domReferenceElement, "pointerdown", handlePointerDown), floating && addEventListener(floating, "focusin", handleFocusIn), floating && addEventListener(floating, "focusout", handleFocusOutside), floating && portalContext && addEventListener(floating, "focusout", markInsideReactTree, true));
	}, [
		disabled,
		domReference,
		floating,
		floatingFocusElement,
		modal,
		tree,
		portalContext,
		store,
		closeOnFocusOut,
		restoreFocus,
		getTabbableContent,
		isUntrappedTypeableCombobox,
		getNodeId,
		orderRef,
		dataRef,
		blurTimeout,
		pointerDownTimeout,
		restoreFocusFrame,
		nextFocusableElement,
		previousFocusableElement,
		getResolvedInsideElements
	]);
	import_react.useEffect(() => {
		if (disabled || !floating || !open) return;
		const portalNodes = Array.from(portalContext?.portalNode?.querySelectorAll(`[${createAttribute("portal")}]`) || []);
		const rootAncestorComboboxDomReference = (tree ? getNodeAncestors(tree.nodesRef.current, getNodeId()) : []).find((node) => isTypeableCombobox(node.context?.elements.domReference || null))?.context?.elements.domReference;
		const ariaHiddenCleanup = markOthers([
			...[
				floating,
				...portalNodes,
				beforeGuardRef.current,
				afterGuardRef.current,
				portalContext?.beforeOutsideRef.current,
				portalContext?.afterOutsideRef.current,
				...getResolvedInsideElements()
			],
			rootAncestorComboboxDomReference,
			resolveRef(previousFocusableElement),
			resolveRef(nextFocusableElement),
			isUntrappedTypeableCombobox ? domReference : null
		].filter((x) => x != null), {
			ariaHidden: modal || isUntrappedTypeableCombobox,
			mark: false
		});
		const markerCleanup = markOthers([floating, ...portalNodes].filter((x) => x != null));
		return () => {
			markerCleanup();
			ariaHiddenCleanup();
		};
	}, [
		open,
		disabled,
		domReference,
		floating,
		modal,
		portalContext,
		isUntrappedTypeableCombobox,
		tree,
		getNodeId,
		nextFocusableElement,
		previousFocusableElement,
		getResolvedInsideElements
	]);
	useIsoLayoutEffect(() => {
		if (!open || disabled || !isHTMLElement(floatingFocusElement)) return;
		const doc = ownerDocument(floatingFocusElement);
		const previouslyFocusedElement = activeElement(doc);
		queueMicrotask(() => {
			const initialFocusValueOrFn = initialFocusRef.current;
			const resolvedInitialFocus = typeof initialFocusValueOrFn === "function" ? initialFocusValueOrFn(openInteractionTypeRef.current || "") : initialFocusValueOrFn;
			if (resolvedInitialFocus === void 0 || resolvedInitialFocus === false) return;
			if (contains(floatingFocusElement, previouslyFocusedElement)) return;
			let focusableElements = null;
			const getDefaultFocusElement = () => {
				if (focusableElements == null) focusableElements = getTabbableContent(floatingFocusElement);
				return focusableElements[0] || floatingFocusElement;
			};
			let elToFocus;
			if (resolvedInitialFocus === true || resolvedInitialFocus === null) elToFocus = getDefaultFocusElement();
			else elToFocus = resolveRef(resolvedInitialFocus);
			elToFocus = elToFocus || getDefaultFocusElement();
			const hadFocusInside = contains(floatingFocusElement, activeElement(doc));
			enqueueFocus(elToFocus, {
				preventScroll: elToFocus === floatingFocusElement,
				shouldFocus() {
					if (hadFocusInside) return true;
					const currentActiveElement = activeElement(doc);
					return !(currentActiveElement !== elToFocus && contains(floatingFocusElement, currentActiveElement));
				}
			});
		});
	}, [
		disabled,
		open,
		floatingFocusElement,
		getTabbableContent,
		initialFocusRef,
		openInteractionTypeRef
	]);
	useIsoLayoutEffect(() => {
		if (disabled || !floatingFocusElement) return;
		const doc = ownerDocument(floatingFocusElement);
		addPreviouslyFocusedElement(activeElement(doc));
		function onOpenChangeLocal(details) {
			if (!details.open) closeTypeRef.current = getEventType(details.nativeEvent, lastInteractionTypeRef.current);
			if (details.reason === "trigger-hover" && details.nativeEvent.type === "mouseleave") preventReturnFocusRef.current = true;
			if (details.reason !== "outside-press") return;
			if (details.nested) preventReturnFocusRef.current = false;
			else if (isVirtualClick(details.nativeEvent) || isVirtualPointerEvent(details.nativeEvent)) preventReturnFocusRef.current = false;
			else {
				let isPreventScrollSupported = false;
				ownerDocument(floatingFocusElement).createElement("div").focus({ get preventScroll() {
					isPreventScrollSupported = true;
					return false;
				} });
				if (isPreventScrollSupported) preventReturnFocusRef.current = false;
				else preventReturnFocusRef.current = true;
			}
		}
		events.on("openchange", onOpenChangeLocal);
		function getReturnElement() {
			const returnFocusValueOrFn = returnFocusRef.current;
			let resolvedReturnFocusValue = typeof returnFocusValueOrFn === "function" ? returnFocusValueOrFn(closeTypeRef.current) : returnFocusValueOrFn;
			if (resolvedReturnFocusValue === void 0 || resolvedReturnFocusValue === false) return null;
			if (resolvedReturnFocusValue === null) resolvedReturnFocusValue = true;
			if (typeof resolvedReturnFocusValue === "boolean") {
				if (domReference?.isConnected) return domReference;
				return getPreviouslyFocusedElement() || null;
			}
			const fallback = domReference?.isConnected ? domReference : getPreviouslyFocusedElement();
			return resolveRef(resolvedReturnFocusValue) || fallback || null;
		}
		return () => {
			events.off("openchange", onOpenChangeLocal);
			const activeEl = activeElement(doc);
			const insideElements = getResolvedInsideElements();
			const isFocusInsideFloatingTree = contains(floating, activeEl) || insideElements.some((element) => element === activeEl || contains(element, activeEl)) || tree && getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) => contains(node.context?.elements.floating, activeEl));
			const returnFocusValueOrFn = returnFocusRef.current;
			const returnElement = getReturnElement();
			queueMicrotask(() => {
				const tabbableReturnElement = getFirstTabbableElement(returnElement);
				const hasExplicitReturnFocus = typeof returnFocusValueOrFn !== "boolean";
				if (returnFocusValueOrFn && !preventReturnFocusRef.current && isHTMLElement(tabbableReturnElement) && (!hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body ? isFocusInsideFloatingTree : true)) tabbableReturnElement.focus({ preventScroll: true });
				preventReturnFocusRef.current = false;
			});
		};
	}, [
		disabled,
		floating,
		floatingFocusElement,
		returnFocusRef,
		events,
		tree,
		domReference,
		getNodeId,
		getResolvedInsideElements
	]);
	useIsoLayoutEffect(() => {
		if (!isWebKit$1 || open || !floating) return;
		const activeEl = activeElement(ownerDocument(floating));
		if (!isHTMLElement(activeEl) || !isTypeableElement(activeEl)) return;
		if (contains(floating, activeEl)) activeEl.blur();
	}, [open, floating]);
	useIsoLayoutEffect(() => {
		if (disabled || !portalContext) return;
		portalContext.setFocusManagerState({
			modal,
			closeOnFocusOut,
			open,
			onOpenChange: store.setOpen,
			domReference
		});
		return () => {
			portalContext.setFocusManagerState(null);
		};
	}, [
		disabled,
		portalContext,
		modal,
		open,
		store,
		closeOnFocusOut,
		domReference
	]);
	useIsoLayoutEffect(() => {
		if (disabled || !floatingFocusElement) return;
		handleTabIndex(floatingFocusElement, orderRef);
		return () => {
			queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
		};
	}, [
		disabled,
		floatingFocusElement,
		orderRef
	]);
	const shouldRenderGuards = !disabled && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		shouldRenderGuards && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			"data-type": "inside",
			ref: mergedBeforeGuardRef,
			onFocus: (event) => {
				if (modal) {
					const els = getTabbableContent();
					enqueueFocus(els[els.length - 1]);
				} else if (portalContext?.portalNode) {
					preventReturnFocusRef.current = false;
					if (isOutsideEvent(event, portalContext.portalNode)) getNextTabbable(domReference)?.focus();
					else resolveRef(previousFocusableElement ?? portalContext.beforeOutsideRef)?.focus();
				}
			}
		}),
		children,
		shouldRenderGuards && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			"data-type": "inside",
			ref: mergedAfterGuardRef,
			onFocus: (event) => {
				if (modal) enqueueFocus(getTabbableContent()[0]);
				else if (portalContext?.portalNode) {
					if (closeOnFocusOut) preventReturnFocusRef.current = true;
					if (isOutsideEvent(event, portalContext.portalNode)) getPreviousTabbable(domReference)?.focus();
					else resolveRef(nextFocusableElement ?? portalContext.afterOutsideRef)?.focus();
				}
			}
		})
	] });
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useClick.js
/**
* Opens or closes the floating element when clicking the reference element.
* @see https://floating-ui.com/docs/useClick
*/
function useClick(context, props = {}) {
	const { enabled = true, event: eventOption = "click", toggle = true, ignoreMouse = false, stickIfOpen = true, touchOpenDelay = 0, reason = triggerPress } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const dataRef = store.context.dataRef;
	const pointerTypeRef = import_react.useRef(void 0);
	const frame = useAnimationFrame();
	const touchOpenTimeout = useTimeout();
	const reference = import_react.useMemo(() => {
		function setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType) {
			const details = createChangeEventDetails(reason, nativeEvent, target);
			if (nextOpen && pointerType === "touch" && touchOpenDelay > 0) touchOpenTimeout.start(touchOpenDelay, () => {
				store.setOpen(true, details);
			});
			else store.setOpen(nextOpen, details);
		}
		function getNextOpen(open, currentTarget, isClickLikeOpenEvent) {
			const openEvent = dataRef.current.openEvent;
			const hasClickedOnInactiveTrigger = store.select("domReferenceElement") !== currentTarget;
			if (open && hasClickedOnInactiveTrigger) return true;
			if (!open) return true;
			if (!toggle) return true;
			if (openEvent && stickIfOpen) return !isClickLikeOpenEvent(openEvent.type);
			return false;
		}
		return {
			onPointerDown(event) {
				pointerTypeRef.current = event.pointerType;
			},
			onMouseDown(event) {
				const pointerType = pointerTypeRef.current;
				const nativeEvent = event.nativeEvent;
				const open = store.select("open");
				if (event.button !== 0 || eventOption === "click" || isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
				const nextOpen = getNextOpen(open, event.currentTarget, (openEventType) => openEventType === "click" || openEventType === "mousedown");
				const target = getTarget(nativeEvent);
				if (isTypeableElement(target)) {
					setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType);
					return;
				}
				const eventCurrentTarget = event.currentTarget;
				frame.request(() => {
					setOpenWithTouchDelay(nextOpen, nativeEvent, eventCurrentTarget, pointerType);
				});
			},
			onClick(event) {
				if (eventOption === "mousedown-only") return;
				const pointerType = pointerTypeRef.current;
				if (eventOption === "mousedown" && pointerType) {
					pointerTypeRef.current = void 0;
					return;
				}
				if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
				setOpenWithTouchDelay(getNextOpen(store.select("open"), event.currentTarget, (openEventType) => openEventType === "click" || openEventType === "mousedown" || openEventType === "keydown" || openEventType === "keyup"), event.nativeEvent, event.currentTarget, pointerType);
			},
			onKeyDown() {
				pointerTypeRef.current = void 0;
			}
		};
	}, [
		dataRef,
		eventOption,
		ignoreMouse,
		reason,
		store,
		stickIfOpen,
		toggle,
		frame,
		touchOpenTimeout,
		touchOpenDelay
	]);
	return import_react.useMemo(() => enabled ? { reference } : EMPTY_OBJECT, [enabled, reference]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useDismiss.js
var bubbleHandlerKeys = {
	intentional: "onClick",
	sloppy: "onPointerDown"
};
function alwaysFalse() {
	return false;
}
function normalizeProp(normalizable) {
	return {
		escapeKey: typeof normalizable === "boolean" ? normalizable : normalizable?.escapeKey ?? false,
		outsidePress: typeof normalizable === "boolean" ? normalizable : normalizable?.outsidePress ?? true
	};
}
/**
* Closes the floating element when a dismissal is requested — by default, when
* the user presses the `escape` key or outside of the floating element.
* @see https://floating-ui.com/docs/useDismiss
*/
function useDismiss(context, props = {}) {
	const { enabled = true, escapeKey: escapeKey$1 = true, outsidePress: outsidePressProp = true, outsidePressEvent = "sloppy", referencePress = alwaysFalse, referencePressEvent = "sloppy", bubbles, externalTree } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const { dataRef } = store.context;
	const tree = useFloatingTree(externalTree);
	const outsidePressFn = useStableCallback(typeof outsidePressProp === "function" ? outsidePressProp : () => false);
	const outsidePress$1 = typeof outsidePressProp === "function" ? outsidePressFn : outsidePressProp;
	const outsidePressEnabled = outsidePress$1 !== false;
	const getOutsidePressEventProp = useStableCallback(() => outsidePressEvent);
	const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(bubbles);
	const pressStartedInsideRef = import_react.useRef(false);
	const pressStartPreventedRef = import_react.useRef(false);
	const suppressNextOutsideClickRef = import_react.useRef(false);
	const isComposingRef = import_react.useRef(false);
	const currentPointerTypeRef = import_react.useRef("");
	const touchStateRef = import_react.useRef(null);
	const cancelDismissOnEndTimeout = useTimeout();
	const clearInsideReactTreeTimeout = useTimeout();
	const clearInsideReactTree = useStableCallback(() => {
		clearInsideReactTreeTimeout.clear();
		dataRef.current.insideReactTree = false;
	});
	const hasBlockingChild = useStableCallback((bubbleKey) => {
		const nodeId = dataRef.current.floatingContext?.nodeId;
		return (tree ? getNodeChildren(tree.nodesRef.current, nodeId) : []).some((child) => child.context?.open && !child.context.dataRef.current[bubbleKey]);
	});
	const isEventWithinOwnElements = useStableCallback((event) => {
		return isEventTargetWithin(event, store.select("floatingElement")) || isEventTargetWithin(event, store.select("domReferenceElement"));
	});
	const closeOnReferencePress = useStableCallback((event) => {
		if (!referencePress()) return;
		store.setOpen(false, createChangeEventDetails(triggerPress, event.nativeEvent));
	});
	const closeOnEscapeKeyDown = useStableCallback((event) => {
		if (!open || !enabled || !escapeKey$1 || event.key !== "Escape") return;
		if (isComposingRef.current) return;
		if (!escapeKeyBubbles && hasBlockingChild("__escapeKeyBubbles")) return;
		const native = isReactEvent(event) ? event.nativeEvent : event;
		const eventDetails = createChangeEventDetails(escapeKey, native);
		store.setOpen(false, eventDetails);
		if (!eventDetails.isCanceled) event.preventDefault();
		if (!escapeKeyBubbles && !eventDetails.isPropagationAllowed) event.stopPropagation();
	});
	const markInsideReactTree = useStableCallback(() => {
		dataRef.current.insideReactTree = true;
		clearInsideReactTreeTimeout.start(0, clearInsideReactTree);
	});
	const markPressStartedInsideReactTree = useStableCallback((event) => {
		if (!open || !enabled || event.button !== 0) return;
		const target = getTarget(event.nativeEvent);
		if (!contains(store.select("floatingElement"), target)) return;
		if (!pressStartedInsideRef.current) {
			pressStartedInsideRef.current = true;
			pressStartPreventedRef.current = false;
		}
	});
	const markInsidePressStartPrevented = useStableCallback((event) => {
		if (!open || !enabled) return;
		if (!(event.defaultPrevented || event.nativeEvent.defaultPrevented)) return;
		if (pressStartedInsideRef.current) pressStartPreventedRef.current = true;
	});
	import_react.useEffect(() => {
		if (!open || !enabled) return;
		dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
		dataRef.current.__outsidePressBubbles = outsidePressBubbles;
		const compositionTimeout = new Timeout();
		const preventedPressSuppressionTimeout = new Timeout();
		function handleCompositionStart() {
			compositionTimeout.clear();
			isComposingRef.current = true;
		}
		function handleCompositionEnd() {
			compositionTimeout.start(isWebKit() ? 5 : 0, () => {
				isComposingRef.current = false;
			});
		}
		function suppressImmediateOutsideClickAfterPreventedStart() {
			suppressNextOutsideClickRef.current = true;
			preventedPressSuppressionTimeout.start(0, () => {
				suppressNextOutsideClickRef.current = false;
			});
		}
		function resetPressStartState() {
			pressStartedInsideRef.current = false;
			pressStartPreventedRef.current = false;
		}
		function getOutsidePressEvent() {
			const type = currentPointerTypeRef.current;
			const computedType = type === "pen" || !type ? "mouse" : type;
			const outsidePressEventValue = getOutsidePressEventProp();
			const resolved = typeof outsidePressEventValue === "function" ? outsidePressEventValue() : outsidePressEventValue;
			if (typeof resolved === "string") return resolved;
			return resolved[computedType];
		}
		function shouldIgnoreEvent(event) {
			const computedOutsidePressEvent = getOutsidePressEvent();
			return computedOutsidePressEvent === "intentional" && event.type !== "click" || computedOutsidePressEvent === "sloppy" && event.type === "click";
		}
		function isEventWithinFloatingTree(event) {
			const nodeId = dataRef.current.floatingContext?.nodeId;
			const targetIsInsideChildren = tree && getNodeChildren(tree.nodesRef.current, nodeId).some((node) => isEventTargetWithin(event, node.context?.elements.floating));
			return isEventWithinOwnElements(event) || targetIsInsideChildren;
		}
		function closeOnPressOutside(event) {
			if (shouldIgnoreEvent(event)) {
				if (event.type !== "click" && !isEventWithinOwnElements(event)) {
					preventedPressSuppressionTimeout.clear();
					suppressNextOutsideClickRef.current = false;
				}
				clearInsideReactTree();
				return;
			}
			if (dataRef.current.insideReactTree) {
				clearInsideReactTree();
				return;
			}
			const target = getTarget(event);
			const inertSelector = `[${createAttribute("inert")}]`;
			const targetRoot = isElement(target) ? target.getRootNode() : null;
			const markers = Array.from((isShadowRoot(targetRoot) ? targetRoot : ownerDocument(store.select("floatingElement"))).querySelectorAll(inertSelector));
			const triggers = store.context.triggerElements;
			if (target && (triggers.hasElement(target) || triggers.hasMatchingElement((trigger) => contains(trigger, target)))) return;
			let targetRootAncestor = isElement(target) ? target : null;
			while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
				const nextParent = getParentNode(targetRootAncestor);
				if (isLastTraversableNode(nextParent) || !isElement(nextParent)) break;
				targetRootAncestor = nextParent;
			}
			if (markers.length && isElement(target) && !isRootElement(target) && !contains(target, store.select("floatingElement")) && markers.every((marker) => !contains(targetRootAncestor, marker))) return;
			if (isHTMLElement(target) && !("touches" in event)) {
				const lastTraversableNode = isLastTraversableNode(target);
				const style = getComputedStyle(target);
				const scrollRe = /auto|scroll/;
				const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
				const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);
				const canScrollX = isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
				const canScrollY = isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;
				const isRTL = style.direction === "rtl";
				const pressedVerticalScrollbar = canScrollY && (isRTL ? event.offsetX <= target.offsetWidth - target.clientWidth : event.offsetX > target.clientWidth);
				const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;
				if (pressedVerticalScrollbar || pressedHorizontalScrollbar) return;
			}
			if (isEventWithinFloatingTree(event)) return;
			if (getOutsidePressEvent() === "intentional" && suppressNextOutsideClickRef.current) {
				preventedPressSuppressionTimeout.clear();
				suppressNextOutsideClickRef.current = false;
				return;
			}
			if (typeof outsidePress$1 === "function" && !outsidePress$1(event)) return;
			if (hasBlockingChild("__outsidePressBubbles")) return;
			store.setOpen(false, createChangeEventDetails(outsidePress, event));
			clearInsideReactTree();
		}
		function handlePointerDown(event) {
			if (getOutsidePressEvent() !== "sloppy" || event.pointerType === "touch" || !store.select("open") || !enabled || isEventWithinOwnElements(event)) return;
			closeOnPressOutside(event);
		}
		function handleTouchStart(event) {
			if (getOutsidePressEvent() !== "sloppy" || !store.select("open") || !enabled || isEventWithinOwnElements(event)) return;
			const touch = event.touches[0];
			if (touch) {
				touchStateRef.current = {
					startTime: Date.now(),
					startX: touch.clientX,
					startY: touch.clientY,
					dismissOnTouchEnd: false,
					dismissOnMouseDown: true
				};
				cancelDismissOnEndTimeout.start(1e3, () => {
					if (touchStateRef.current) {
						touchStateRef.current.dismissOnTouchEnd = false;
						touchStateRef.current.dismissOnMouseDown = false;
					}
				});
			}
		}
		function addTargetEventListenerOnce(event, listener) {
			const target = getTarget(event);
			if (!target) return;
			const unsubscribe = addEventListener(target, event.type, () => {
				listener(event);
				unsubscribe();
			});
		}
		function handleTouchStartCapture(event) {
			currentPointerTypeRef.current = "touch";
			addTargetEventListenerOnce(event, handleTouchStart);
		}
		function closeOnPressOutsideCapture(event) {
			cancelDismissOnEndTimeout.clear();
			if (event.type === "pointerdown") currentPointerTypeRef.current = event.pointerType;
			if (event.type === "mousedown" && touchStateRef.current && !touchStateRef.current.dismissOnMouseDown) return;
			addTargetEventListenerOnce(event, (targetEvent) => {
				if (targetEvent.type === "pointerdown") handlePointerDown(targetEvent);
				else closeOnPressOutside(targetEvent);
			});
		}
		function handlePressEndCapture(event) {
			if (!pressStartedInsideRef.current) return;
			const pressStartedInsideDefaultPrevented = pressStartPreventedRef.current;
			resetPressStartState();
			if (getOutsidePressEvent() !== "intentional") return;
			if (event.type === "pointercancel") {
				if (pressStartedInsideDefaultPrevented) suppressImmediateOutsideClickAfterPreventedStart();
				return;
			}
			if (isEventWithinFloatingTree(event)) return;
			if (pressStartedInsideDefaultPrevented) {
				suppressImmediateOutsideClickAfterPreventedStart();
				return;
			}
			if (typeof outsidePress$1 === "function" && !outsidePress$1(event)) return;
			preventedPressSuppressionTimeout.clear();
			suppressNextOutsideClickRef.current = true;
			clearInsideReactTree();
		}
		function handleTouchMove(event) {
			if (getOutsidePressEvent() !== "sloppy" || !touchStateRef.current || isEventWithinOwnElements(event)) return;
			const touch = event.touches[0];
			if (!touch) return;
			const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
			const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			if (distance > 5) touchStateRef.current.dismissOnTouchEnd = true;
			if (distance > 10) {
				closeOnPressOutside(event);
				cancelDismissOnEndTimeout.clear();
				touchStateRef.current = null;
			}
		}
		function handleTouchMoveCapture(event) {
			addTargetEventListenerOnce(event, handleTouchMove);
		}
		function handleTouchEnd(event) {
			if (getOutsidePressEvent() !== "sloppy" || !touchStateRef.current || isEventWithinOwnElements(event)) return;
			if (touchStateRef.current.dismissOnTouchEnd) closeOnPressOutside(event);
			cancelDismissOnEndTimeout.clear();
			touchStateRef.current = null;
		}
		function handleTouchEndCapture(event) {
			addTargetEventListenerOnce(event, handleTouchEnd);
		}
		const doc = ownerDocument(floatingElement);
		const unsubscribe = mergeCleanups(escapeKey$1 && mergeCleanups(addEventListener(doc, "keydown", closeOnEscapeKeyDown), addEventListener(doc, "compositionstart", handleCompositionStart), addEventListener(doc, "compositionend", handleCompositionEnd)), outsidePressEnabled && mergeCleanups(addEventListener(doc, "click", closeOnPressOutsideCapture, true), addEventListener(doc, "pointerdown", closeOnPressOutsideCapture, true), addEventListener(doc, "pointerup", handlePressEndCapture, true), addEventListener(doc, "pointercancel", handlePressEndCapture, true), addEventListener(doc, "mousedown", closeOnPressOutsideCapture, true), addEventListener(doc, "mouseup", handlePressEndCapture, true), addEventListener(doc, "touchstart", handleTouchStartCapture, true), addEventListener(doc, "touchmove", handleTouchMoveCapture, true), addEventListener(doc, "touchend", handleTouchEndCapture, true)));
		return () => {
			unsubscribe();
			compositionTimeout.clear();
			preventedPressSuppressionTimeout.clear();
			resetPressStartState();
			suppressNextOutsideClickRef.current = false;
		};
	}, [
		dataRef,
		floatingElement,
		escapeKey$1,
		outsidePressEnabled,
		outsidePress$1,
		open,
		enabled,
		escapeKeyBubbles,
		outsidePressBubbles,
		closeOnEscapeKeyDown,
		clearInsideReactTree,
		getOutsidePressEventProp,
		hasBlockingChild,
		isEventWithinOwnElements,
		tree,
		store,
		cancelDismissOnEndTimeout
	]);
	import_react.useEffect(clearInsideReactTree, [outsidePress$1, clearInsideReactTree]);
	const reference = import_react.useMemo(() => ({
		onKeyDown: closeOnEscapeKeyDown,
		[bubbleHandlerKeys[referencePressEvent]]: closeOnReferencePress,
		...referencePressEvent !== "intentional" && { onClick: closeOnReferencePress }
	}), [
		closeOnEscapeKeyDown,
		closeOnReferencePress,
		referencePressEvent
	]);
	const floating = import_react.useMemo(() => ({
		onKeyDown: closeOnEscapeKeyDown,
		onPointerDown: markInsidePressStartPrevented,
		onMouseDown: markInsidePressStartPrevented,
		onClickCapture: markInsideReactTree,
		onMouseDownCapture(event) {
			markInsideReactTree();
			markPressStartedInsideReactTree(event);
		},
		onPointerDownCapture(event) {
			markInsideReactTree();
			markPressStartedInsideReactTree(event);
		},
		onMouseUpCapture: markInsideReactTree,
		onTouchEndCapture: markInsideReactTree,
		onTouchMoveCapture: markInsideReactTree
	}), [
		closeOnEscapeKeyDown,
		markInsideReactTree,
		markPressStartedInsideReactTree,
		markInsidePressStartPrevented
	]);
	return import_react.useMemo(() => enabled ? {
		reference,
		floating,
		trigger: reference
	} : {}, [
		enabled,
		reference,
		floating
	]);
}
//#endregion
//#region node_modules/@base-ui/utils/esm/store/createSelector.js
/**
* The NoOptionalParams type is a utility type that checks if a function has optional or default parameters.
* If the function has optional or default parameters, it returns a string literal type with an error message.
* Otherwise, it returns the original function type.
*
* This is used to enforce that the combiner function passed to createSelector does not have optional or default parameters,
* as memoization relies on the Function.length property, which does not account for optional or default parameters.
*/
/**
* Creates a selector function that can be used to derive values from the store's state.
*
* The combiner function can have up to three additional parameters, but it **cannot have optional or default parameters**.
*
* This function accepts up to six functions and combines them into a single selector function.
* The resulting selector will take the state from the combined selectors and any additional parameters required by the combiner.
*
* The return type of the resulting selector is determined by the return type of the combiner function.
*
* @example
* const selector = createSelector(
*  (state) => state.disabled
* );
*
* @example
* const selector = createSelector(
*   (state) => state.disabled,
*   (state) => state.open,
*   (disabled, open) => ({ disabled, open })
* );
*/
var createSelector = (a, b, c, d, e, f, ...other) => {
	if (other.length > 0) throw new Error("Unsupported number of selectors");
	let selector;
	if (a && b && c && d && e && f) selector = (state, a1, a2, a3) => {
		return f(a(state, a1, a2, a3), b(state, a1, a2, a3), c(state, a1, a2, a3), d(state, a1, a2, a3), e(state, a1, a2, a3), a1, a2, a3);
	};
	else if (a && b && c && d && e) selector = (state, a1, a2, a3) => {
		return e(a(state, a1, a2, a3), b(state, a1, a2, a3), c(state, a1, a2, a3), d(state, a1, a2, a3), a1, a2, a3);
	};
	else if (a && b && c && d) selector = (state, a1, a2, a3) => {
		return d(a(state, a1, a2, a3), b(state, a1, a2, a3), c(state, a1, a2, a3), a1, a2, a3);
	};
	else if (a && b && c) selector = (state, a1, a2, a3) => {
		return c(a(state, a1, a2, a3), b(state, a1, a2, a3), a1, a2, a3);
	};
	else if (a && b) selector = (state, a1, a2, a3) => {
		return b(a(state, a1, a2, a3), a1, a2, a3);
	};
	else if (a) selector = a;
	else throw new Error("Missing arguments");
	return selector;
};
//#endregion
//#region node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
/**
* @license React
* use-sync-external-store-shim/with-selector.development.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_with_selector_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function() {
		function is(x, y) {
			return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
		}
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
		var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue = React.useDebugValue;
		exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
			var instRef = useRef(null);
			if (null === instRef.current) {
				var inst = {
					hasValue: !1,
					value: null
				};
				instRef.current = inst;
			} else inst = instRef.current;
			instRef = useMemo(function() {
				function memoizedSelector(nextSnapshot) {
					if (!hasMemo) {
						hasMemo = !0;
						memoizedSnapshot = nextSnapshot;
						nextSnapshot = selector(nextSnapshot);
						if (void 0 !== isEqual && inst.hasValue) {
							var currentSelection = inst.value;
							if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
						}
						return memoizedSelection = nextSnapshot;
					}
					currentSelection = memoizedSelection;
					if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
					var nextSelection = selector(nextSnapshot);
					if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
					memoizedSnapshot = nextSnapshot;
					return memoizedSelection = nextSelection;
				}
				var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
				return [function() {
					return memoizedSelector(getSnapshot());
				}, null === maybeGetServerSnapshot ? void 0 : function() {
					return memoizedSelector(maybeGetServerSnapshot());
				}];
			}, [
				getSnapshot,
				getServerSnapshot,
				selector,
				isEqual
			]);
			var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
			useEffect(function() {
				inst.hasValue = !0;
				inst.value = value;
			}, [value]);
			useDebugValue(value);
			return value;
		};
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
	})();
}));
//#endregion
//#region node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_with_selector_development();
}));
//#endregion
//#region node_modules/@base-ui/utils/esm/fastHooks.js
var import_shim = require_shim();
var import_with_selector = require_with_selector();
var hooks = [];
var currentInstance = void 0;
function getInstance() {
	return currentInstance;
}
function register(hook) {
	hooks.push(hook);
}
function fastComponent(fn) {
	const FastComponent = (props, forwardedRef) => {
		const instance = useRefWithInit(createInstance).current;
		let result;
		try {
			currentInstance = instance;
			for (const hook of hooks) hook.before(instance);
			result = fn(props, forwardedRef);
			for (const hook of hooks) hook.after(instance);
			instance.didInitialize = true;
		} finally {
			currentInstance = void 0;
		}
		return result;
	};
	FastComponent.displayName = fn.displayName || fn.name;
	return FastComponent;
}
function fastComponentRef(fn) {
	return /*#__PURE__*/ import_react.forwardRef(fastComponent(fn));
}
function createInstance() {
	return { didInitialize: false };
}
//#endregion
//#region node_modules/@base-ui/utils/esm/store/useStore.js
var useStoreImplementation = isReactVersionAtLeast(19) ? useStoreFast : useStoreLegacy;
function useStore(store, selector, a1, a2, a3) {
	return useStoreImplementation(store, selector, a1, a2, a3);
}
function useStoreR19(store, selector, a1, a2, a3) {
	const getSelection = import_react.useCallback(() => selector(store.getSnapshot(), a1, a2, a3), [
		store,
		selector,
		a1,
		a2,
		a3
	]);
	return (0, import_shim.useSyncExternalStore)(store.subscribe, getSelection, getSelection);
}
register({
	before(instance) {
		instance.syncIndex = 0;
		if (!instance.didInitialize) {
			instance.syncTick = 1;
			instance.syncHooks = [];
			instance.didChangeStore = true;
			instance.getSnapshot = () => {
				let didChange = false;
				for (let i = 0; i < instance.syncHooks.length; i += 1) {
					const hook = instance.syncHooks[i];
					const value = hook.selector(hook.store.state, hook.a1, hook.a2, hook.a3);
					if (hook.didChange || !Object.is(hook.value, value)) {
						didChange = true;
						hook.value = value;
						hook.didChange = false;
					}
				}
				if (didChange) instance.syncTick += 1;
				return instance.syncTick;
			};
		}
	},
	after(instance) {
		if (instance.syncHooks.length > 0) {
			if (instance.didChangeStore) {
				instance.didChangeStore = false;
				instance.subscribe = (onStoreChange) => {
					const stores = /* @__PURE__ */ new Set();
					for (const hook of instance.syncHooks) stores.add(hook.store);
					const unsubscribes = [];
					for (const store of stores) unsubscribes.push(store.subscribe(onStoreChange));
					return () => {
						for (const unsubscribe of unsubscribes) unsubscribe();
					};
				};
			}
			(0, import_shim.useSyncExternalStore)(instance.subscribe, instance.getSnapshot, instance.getSnapshot);
		}
	}
});
function useStoreFast(store, selector, a1, a2, a3) {
	const instance = getInstance();
	if (!instance) return useStoreR19(store, selector, a1, a2, a3);
	const index = instance.syncIndex;
	instance.syncIndex += 1;
	let hook;
	if (!instance.didInitialize) {
		hook = {
			store,
			selector,
			a1,
			a2,
			a3,
			value: selector(store.getSnapshot(), a1, a2, a3),
			didChange: false
		};
		instance.syncHooks.push(hook);
	} else {
		hook = instance.syncHooks[index];
		if (hook.store !== store || hook.selector !== selector || !Object.is(hook.a1, a1) || !Object.is(hook.a2, a2) || !Object.is(hook.a3, a3)) {
			if (hook.store !== store) instance.didChangeStore = true;
			hook.store = store;
			hook.selector = selector;
			hook.a1 = a1;
			hook.a2 = a2;
			hook.a3 = a3;
			hook.didChange = true;
		}
	}
	return hook.value;
}
function useStoreLegacy(store, selector, a1, a2, a3) {
	return (0, import_with_selector.useSyncExternalStoreWithSelector)(store.subscribe, store.getSnapshot, store.getSnapshot, (state) => selector(state, a1, a2, a3));
}
//#endregion
//#region node_modules/@base-ui/utils/esm/store/Store.js
/**
* A data store implementation that allows subscribing to state changes and updating the state.
* It uses an observer pattern to notify subscribers when the state changes.
*/
var Store = class {
	/**
	* The current state of the store.
	* This property is updated immediately when the state changes as a result of calling {@link setState}, {@link update}, or {@link set}.
	* To subscribe to state changes, use the {@link useState} method. The value returned by {@link useState} is updated after the component renders (similarly to React's useState).
	* The values can be used directly (to avoid subscribing to the store) in effects or event handlers.
	*
	* Do not modify properties in state directly. Instead, use the provided methods to ensure proper state management and listener notification.
	*/
	constructor(state) {
		this.state = state;
		this.listeners = /* @__PURE__ */ new Set();
		this.updateTick = 0;
	}
	/**
	* Registers a listener that will be called whenever the store's state changes.
	*
	* @param fn The listener function to be called on state changes.
	* @returns A function to unsubscribe the listener.
	*/
	subscribe = (fn) => {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn);
		};
	};
	/**
	* Returns the current state of the store.
	*/
	getSnapshot = () => {
		return this.state;
	};
	/**
	* Updates the entire store's state and notifies all registered listeners.
	*
	* @param newState The new state to set for the store.
	*/
	setState(newState) {
		if (this.state === newState) return;
		this.state = newState;
		this.updateTick += 1;
		const currentTick = this.updateTick;
		for (const listener of this.listeners) {
			if (currentTick !== this.updateTick) return;
			listener(newState);
		}
	}
	/**
	* Merges the provided changes into the current state and notifies listeners if there are changes.
	*
	* @param changes An object containing the changes to apply to the current state.
	*/
	update(changes) {
		for (const key in changes) if (!Object.is(this.state[key], changes[key])) {
			this.setState({
				...this.state,
				...changes
			});
			return;
		}
	}
	/**
	* Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
	*
	* @param key The key in the store's state to update.
	* @param value The new value to set for the specified key.
	*/
	set(key, value) {
		if (!Object.is(this.state[key], value)) this.setState({
			...this.state,
			[key]: value
		});
	}
	/**
	* Gives the state a new reference and updates all registered listeners.
	*/
	notifyAll() {
		const newState = { ...this.state };
		this.setState(newState);
	}
	use(selector, a1, a2, a3) {
		return useStore(this, selector, a1, a2, a3);
	}
};
//#endregion
//#region node_modules/@base-ui/utils/esm/store/ReactStore.js
/**
* A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
*/
var ReactStore = class extends Store {
	/**
	* Creates a new ReactStore instance.
	*
	* @param state Initial state of the store.
	* @param context Non-reactive context values.
	* @param selectors Optional selectors for use with `useState`.
	*/
	constructor(state, context = {}, selectors) {
		super(state);
		this.context = context;
		this.selectors = selectors;
	}
	/**
	* Non-reactive values such as refs, callbacks, etc.
	*/
	/**
	* Synchronizes a single external value into the store.
	*
	* Note that the while the value in `state` is updated immediately, the value returned
	* by `useState` is updated before the next render (similarly to React's `useState`).
	*/
	useSyncedValue(key, value) {
		import_react.useDebugValue(key);
		const store = this;
		useIsoLayoutEffect(() => {
			if (store.state[key] !== value) store.set(key, value);
		}, [
			store,
			key,
			value
		]);
	}
	/**
	* Synchronizes a single external value into the store and
	* cleans it up (sets to `undefined`) on unmount.
	*
	* Note that the while the value in `state` is updated immediately, the value returned
	* by `useState` is updated before the next render (similarly to React's `useState`).
	*/
	useSyncedValueWithCleanup(key, value) {
		const store = this;
		useIsoLayoutEffect(() => {
			if (store.state[key] !== value) store.set(key, value);
			return () => {
				store.set(key, void 0);
			};
		}, [
			store,
			key,
			value
		]);
	}
	/**
	* Synchronizes multiple external values into the store.
	*
	* Note that the while the values in `state` are updated immediately, the values returned
	* by `useState` are updated before the next render (similarly to React's `useState`).
	*/
	useSyncedValues(statePart) {
		const store = this;
		{
			import_react.useDebugValue(statePart, (p) => Object.keys(p));
			const keys = import_react.useRef(Object.keys(statePart)).current;
			const nextKeys = Object.keys(statePart);
			if (keys.length !== nextKeys.length || keys.some((key, index) => key !== nextKeys[index])) console.error("ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.");
		}
		const dependencies = Object.values(statePart);
		useIsoLayoutEffect(() => {
			store.update(statePart);
		}, [store, ...dependencies]);
	}
	/**
	* Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key. If `controlled`
	* is non-undefined, the store's state at `key` is updated to match `controlled`.
	*/
	useControlledProp(key, controlled) {
		import_react.useDebugValue(key);
		const store = this;
		const isControlled = controlled !== void 0;
		useIsoLayoutEffect(() => {
			if (isControlled && !Object.is(store.state[key], controlled)) store.setState({
				...store.state,
				[key]: controlled
			});
		}, [
			store,
			key,
			controlled,
			isControlled
		]);
		{
			const cache = this.controlledValues ??= /* @__PURE__ */ new Map();
			if (!cache.has(key)) cache.set(key, isControlled);
			const previouslyControlled = cache.get(key);
			if (previouslyControlled !== void 0 && previouslyControlled !== isControlled) console.error(`A component is changing the ${isControlled ? "" : "un"}controlled state of ${key.toString()} to be ${isControlled ? "un" : ""}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`);
		}
	}
	/** Gets the current value from the store using a selector with the provided key.
	*
	* @param key Key of the selector to use.
	*/
	select(key, a1, a2, a3) {
		const selector = this.selectors[key];
		return selector(this.state, a1, a2, a3);
	}
	/**
	* Returns a value from the store's state using a selector function.
	* Used to subscribe to specific parts of the state.
	* This methods causes a rerender whenever the selected state changes.
	*
	* @param key Key of the selector to use.
	*/
	useState(key, a1, a2, a3) {
		import_react.useDebugValue(key);
		return useStore(this, this.selectors[key], a1, a2, a3);
	}
	/**
	* Wraps a function with `useStableCallback` to ensure it has a stable reference
	* and assigns it to the context.
	*
	* @param key Key of the event callback. Must be a function in the context.
	* @param fn Function to assign.
	*/
	useContextCallback(key, fn) {
		import_react.useDebugValue(key);
		const stableFunction = useStableCallback(fn ?? NOOP);
		this.context[key] = stableFunction;
	}
	/**
	* Returns a stable setter function for a specific key in the store's state.
	* It's commonly used to pass as a ref callback to React elements.
	*
	* @param key Key of the state to set.
	*/
	useStateSetter(key) {
		const ref = import_react.useRef(void 0);
		if (ref.current === void 0) ref.current = (value) => {
			this.set(key, value);
		};
		return ref.current;
	}
	/**
	* Observes changes derived from the store's selectors and calls the listener when the selected value changes.
	*
	* @param key Key of the selector to observe.
	* @param listener Listener function called when the selector result changes.
	*/
	observe(selector, listener) {
		let selectFn;
		if (typeof selector === "function") selectFn = selector;
		else selectFn = this.selectors[selector];
		let prevValue = selectFn(this.state);
		listener(prevValue, prevValue, this);
		return this.subscribe((nextState) => {
			const nextValue = selectFn(nextState);
			if (!Object.is(prevValue, nextValue)) {
				const oldValue = prevValue;
				prevValue = nextValue;
				listener(nextValue, oldValue, this);
			}
		});
	}
};
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/components/FloatingRootStore.js
var selectors = {
	open: createSelector((state) => state.open),
	transitionStatus: createSelector((state) => state.transitionStatus),
	domReferenceElement: createSelector((state) => state.domReferenceElement),
	referenceElement: createSelector((state) => state.positionReference ?? state.referenceElement),
	floatingElement: createSelector((state) => state.floatingElement),
	floatingId: createSelector((state) => state.floatingId)
};
var FloatingRootStore = class extends ReactStore {
	constructor(options) {
		const { syncOnly, nested, onOpenChange, triggerElements, ...initialState } = options;
		super({
			...initialState,
			positionReference: initialState.referenceElement,
			domReferenceElement: initialState.referenceElement
		}, {
			onOpenChange,
			dataRef: { current: {} },
			events: createEventEmitter(),
			nested,
			triggerElements
		}, selectors);
		this.syncOnly = syncOnly;
	}
	/**
	* Syncs the event used by hover logic to distinguish hover-open from click-like interaction.
	*/
	syncOpenEvent = (newOpen, event) => {
		if (!newOpen || !this.state.open || event != null && isClickLikeEvent(event)) this.context.dataRef.current.openEvent = newOpen ? event : void 0;
	};
	/**
	* Runs the root-owned side effects for an open state change.
	*/
	dispatchOpenChange = (newOpen, eventDetails) => {
		this.syncOpenEvent(newOpen, eventDetails.event);
		const details = {
			open: newOpen,
			reason: eventDetails.reason,
			nativeEvent: eventDetails.event,
			nested: this.context.nested,
			triggerElement: eventDetails.trigger
		};
		this.context.events.emit("openchange", details);
	};
	/**
	* Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
	*
	* @param newOpen The new open state.
	* @param eventDetails Details about the event that triggered the open state change.
	*/
	setOpen = (newOpen, eventDetails) => {
		if (this.syncOnly) {
			this.context.onOpenChange?.(newOpen, eventDetails);
			return;
		}
		this.dispatchOpenChange(newOpen, eventDetails);
		this.context.onOpenChange?.(newOpen, eventDetails);
	};
};
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useSyncedFloatingRootContext.js
/**
* Keeps a FloatingRootStore in sync with the provided PopupStore.
* Uses the provided FloatingRootStore when one exists, otherwise creates one once and updates it on every render.
*/
function useSyncedFloatingRootContext(options) {
	const { popupStore, treatPopupAsFloatingElement = false, floatingRootContext: floatingRootContextProp, floatingId, nested, onOpenChange } = options;
	const open = popupStore.useState("open");
	const referenceElement = popupStore.useState("activeTriggerElement");
	const floatingElement = popupStore.useState(treatPopupAsFloatingElement ? "popupElement" : "positionerElement");
	const triggerElements = popupStore.context.triggerElements;
	const handleOpenChange = onOpenChange;
	const internalStoreRef = import_react.useRef(null);
	if (floatingRootContextProp === void 0 && internalStoreRef.current === null) internalStoreRef.current = new FloatingRootStore({
		open,
		transitionStatus: void 0,
		referenceElement,
		floatingElement,
		triggerElements,
		onOpenChange: handleOpenChange,
		floatingId,
		syncOnly: true,
		nested
	});
	const store = floatingRootContextProp ?? internalStoreRef.current;
	popupStore.useSyncedValue("floatingId", floatingId);
	useIsoLayoutEffect(() => {
		const valuesToSync = {
			open,
			floatingId,
			referenceElement,
			floatingElement
		};
		if (isElement(referenceElement)) valuesToSync.domReferenceElement = referenceElement;
		if (store.state.positionReference === store.state.referenceElement) valuesToSync.positionReference = referenceElement;
		store.update(valuesToSync);
	}, [
		open,
		floatingId,
		referenceElement,
		floatingElement,
		store
	]);
	store.context.onOpenChange = handleOpenChange;
	store.context.nested = nested;
	return store;
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/popups/popupStoreUtils.js
var FOCUSABLE_POPUP_PROPS = {
	tabIndex: -1,
	[FOCUSABLE_ATTRIBUTE]: ""
};
function usePopupStore(externalStore, createStore, treatPopupAsFloatingElement = false) {
	const floatingId = useId();
	const nested = useFloatingParentNodeId() != null;
	const internalStoreRef = import_react.useRef(null);
	if (externalStore === void 0 && internalStoreRef.current === null) internalStoreRef.current = createStore(floatingId, nested);
	const store = externalStore ?? internalStoreRef.current;
	useSyncedFloatingRootContext({
		popupStore: store,
		treatPopupAsFloatingElement,
		floatingRootContext: store.state.floatingRootContext,
		floatingId,
		nested,
		onOpenChange: store.setOpen
	});
	return {
		store,
		internalStore: internalStoreRef.current
	};
}
/**
* Returns a callback ref that registers/unregisters the trigger element in the store.
*
* @param store The Store instance where the trigger should be registered.
*/
function useTriggerRegistration(id, store) {
	const registeredElementIdRef = import_react.useRef(null);
	const registeredElementRef = import_react.useRef(null);
	return import_react.useCallback((element) => {
		if (id === void 0) return;
		let shouldSyncTriggerCount = false;
		if (registeredElementIdRef.current !== null) {
			const registeredId = registeredElementIdRef.current;
			const registeredElement = registeredElementRef.current;
			const currentElement = store.context.triggerElements.getById(registeredId);
			if (registeredElement && currentElement === registeredElement) {
				store.context.triggerElements.delete(registeredId);
				shouldSyncTriggerCount = true;
			}
			registeredElementIdRef.current = null;
			registeredElementRef.current = null;
		}
		if (element !== null) {
			registeredElementIdRef.current = id;
			registeredElementRef.current = element;
			store.context.triggerElements.add(id, element);
			shouldSyncTriggerCount = true;
		}
		if (shouldSyncTriggerCount) {
			const triggerCount = store.context.triggerElements.size;
			if (store.select("open") && store.state.triggerCount !== triggerCount) store.set("triggerCount", triggerCount);
		}
	}, [store, id]);
}
function setOpenTriggerState(state, open, trigger) {
	const triggerId = trigger?.id ?? null;
	if (triggerId || open) {
		state.activeTriggerId = triggerId;
		state.activeTriggerElement = trigger ?? null;
	}
}
/**
* Sets up trigger data forwarding to the store.
*
* @param triggerId Id of the trigger.
* @param triggerElementRef Ref for the trigger DOM element.
* @param store The Store instance managing the popup state.
* @param stateUpdates An object with state updates to apply when the trigger is active.
*/
function useTriggerDataForwarding(triggerId, triggerElementRef, store, stateUpdates) {
	const isMountedByThisTrigger = store.useState("isMountedByTrigger", triggerId);
	const baseRegisterTrigger = useTriggerRegistration(triggerId, store);
	const registerTrigger = useStableCallback((element) => {
		baseRegisterTrigger(element);
		if (!element) return;
		const open = store.select("open");
		const activeTriggerId = store.select("activeTriggerId");
		if (activeTriggerId === triggerId) {
			store.update({
				activeTriggerElement: element,
				...open ? stateUpdates : null
			});
			return;
		}
		if (activeTriggerId == null && open) store.update({
			activeTriggerId: triggerId,
			activeTriggerElement: element,
			...stateUpdates
		});
	});
	useIsoLayoutEffect(() => {
		if (isMountedByThisTrigger) store.update({
			activeTriggerElement: triggerElementRef.current,
			...stateUpdates
		});
	}, [
		isMountedByThisTrigger,
		store,
		triggerElementRef,
		...Object.values(stateUpdates)
	]);
	return {
		registerTrigger,
		isMountedByThisTrigger
	};
}
/**
* Ensures that when there's only one trigger element registered, it is set as the active trigger.
* This keeps triggerCount reactive while open and allows controlled popups to work correctly without
* an explicit triggerId, maintaining compatibility with contained triggers.
*
* This should be called on the Root part.
*
* @param store The Store instance managing the popup state.
*/
function useImplicitActiveTrigger(store) {
	const open = store.useState("open");
	const reactiveTriggerCount = store.useState("triggerCount");
	useIsoLayoutEffect(() => {
		if (!open) {
			if (store.state.triggerCount !== 0) store.set("triggerCount", 0);
			return;
		}
		const triggerCount = store.context.triggerElements.size;
		const stateUpdates = {};
		if (store.state.triggerCount !== triggerCount) stateUpdates.triggerCount = triggerCount;
		if (!store.select("activeTriggerId") && triggerCount === 1) {
			const iteratorResult = store.context.triggerElements.entries().next();
			if (!iteratorResult.done) {
				const [implicitTriggerId, implicitTriggerElement] = iteratorResult.value;
				stateUpdates.activeTriggerId = implicitTriggerId;
				stateUpdates.activeTriggerElement = implicitTriggerElement;
			}
		}
		if (stateUpdates.triggerCount !== void 0 || stateUpdates.activeTriggerId !== void 0) store.update(stateUpdates);
	}, [
		open,
		store,
		reactiveTriggerCount
	]);
}
/**
* Manages the mounted state of the popup.
* Sets up the transition status listeners and handles unmounting when needed.
* Updates the `mounted` and `transitionStatus` states in the store.
*
* @param open Whether the popup is open.
* @param store The Store instance managing the popup state.
* @param onUnmount Optional callback to be called when the popup is unmounted.
*
* @returns A function to forcibly unmount the popup.
*/
function useOpenStateTransitions(open, store, onUnmount) {
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
	store.useSyncedValues({
		mounted,
		transitionStatus
	});
	const forceUnmount = useStableCallback(() => {
		setMounted(false);
		store.update({
			activeTriggerId: null,
			activeTriggerElement: null,
			mounted: false,
			preventUnmountingOnClose: false
		});
		onUnmount?.();
		store.context.onOpenChangeComplete?.(false);
	});
	const preventUnmountingOnClose = store.useState("preventUnmountingOnClose");
	useOpenChangeComplete({
		enabled: mounted && !open && !preventUnmountingOnClose,
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (!open) forceUnmount();
		}
	});
	return {
		forceUnmount,
		transitionStatus
	};
}
function usePopupInteractionProps(store, statePart) {
	store.useSyncedValues(statePart);
	useIsoLayoutEffect(() => () => {
		store.update({
			activeTriggerProps: EMPTY_OBJECT,
			inactiveTriggerProps: EMPTY_OBJECT,
			popupProps: EMPTY_OBJECT
		});
	}, [store]);
}
function usePopupRootSync(store, open) {
	useIsoLayoutEffect(() => {
		if (!open && store.state.openMethod !== null) store.set("openMethod", null);
	}, [open, store]);
	useIsoLayoutEffect(() => () => {
		if (store.state.openMethod !== null) store.set("openMethod", null);
	}, [store]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/popups/popupTriggerMap.js
/**
* Data structure to keep track of popup trigger elements by their IDs.
* Uses both a set of Elements and a map of IDs to Elements for efficient lookups.
*/
var PopupTriggerMap = class {
	constructor() {
		this.elementsSet = /* @__PURE__ */ new Set();
		this.idMap = /* @__PURE__ */ new Map();
	}
	/**
	* Adds a trigger element with the given ID.
	*
	* Note: The provided element is assumed to not be registered under multiple IDs.
	*/
	add(id, element) {
		const existingElement = this.idMap.get(id);
		if (existingElement === element) return;
		if (existingElement !== void 0) this.elementsSet.delete(existingElement);
		this.elementsSet.add(element);
		this.idMap.set(id, element);
		if (this.elementsSet.size !== this.idMap.size) throw new Error("Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.");
	}
	/**
	* Removes the trigger element with the given ID.
	*/
	delete(id) {
		const element = this.idMap.get(id);
		if (element) {
			this.elementsSet.delete(element);
			this.idMap.delete(id);
		}
	}
	/**
	* Whether the given element is registered as a trigger.
	*/
	hasElement(element) {
		return this.elementsSet.has(element);
	}
	/**
	* Whether there is a registered trigger element matching the given predicate.
	*/
	hasMatchingElement(predicate) {
		for (const element of this.elementsSet) if (predicate(element)) return true;
		return false;
	}
	/**
	* Returns the trigger element associated with the given ID, or undefined if no such element exists.
	*/
	getById(id) {
		return this.idMap.get(id);
	}
	/**
	* Returns an iterable of all registered trigger entries, where each entry is a tuple of [id, element].
	*/
	entries() {
		return this.idMap.entries();
	}
	/**
	* Returns an iterable of all registered trigger elements.
	*/
	elements() {
		return this.elementsSet.values();
	}
	/**
	* Returns the number of registered trigger elements.
	*/
	get size() {
		return this.idMap.size;
	}
};
//#endregion
//#region node_modules/@base-ui/react/esm/utils/InternalBackdrop.js
/**
* @internal
*/
var InternalBackdrop = /*#__PURE__*/ import_react.forwardRef(function InternalBackdrop(props, ref) {
	const { cutout, ...otherProps } = props;
	let clipPath;
	if (cutout) {
		const rect = cutout.getBoundingClientRect();
		clipPath = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px)`;
	}
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		ref,
		role: "presentation",
		"data-base-ui-inert": "",
		...otherProps,
		style: {
			position: "fixed",
			inset: 0,
			userSelect: "none",
			WebkitUserSelect: "none",
			clipPath
		}
	});
});
InternalBackdrop.displayName = "InternalBackdrop";
//#endregion
//#region node_modules/@base-ui/utils/esm/useOnFirstRender.js
function useOnFirstRender(fn) {
	const ref = import_react.useRef(true);
	if (ref.current) {
		ref.current = false;
		fn();
	}
}
//#endregion
//#region node_modules/@base-ui/utils/esm/useScrollLock.js
var originalHtmlStyles = {};
var originalBodyStyles = {};
var originalHtmlScrollBehavior = "";
function hasInsetScrollbars(referenceElement) {
	if (typeof document === "undefined") return false;
	const doc = ownerDocument(referenceElement);
	return getWindow(doc).innerWidth - doc.documentElement.clientWidth > 0;
}
function supportsStableScrollbarGutter(referenceElement) {
	if (!(typeof CSS !== "undefined" && CSS.supports && CSS.supports("scrollbar-gutter", "stable")) || typeof document === "undefined") return false;
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const scrollContainer = isOverflowElement(html) ? html : body;
	const originalScrollContainerOverflowY = scrollContainer.style.overflowY;
	const originalHtmlStyleGutter = html.style.scrollbarGutter;
	html.style.scrollbarGutter = "stable";
	scrollContainer.style.overflowY = "scroll";
	const before = scrollContainer.offsetWidth;
	scrollContainer.style.overflowY = "hidden";
	const after = scrollContainer.offsetWidth;
	scrollContainer.style.overflowY = originalScrollContainerOverflowY;
	html.style.scrollbarGutter = originalHtmlStyleGutter;
	return before === after;
}
function preventScrollOverlayScrollbars(referenceElement) {
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const elementToLock = isOverflowElement(html) ? html : body;
	const originalElementToLockStyles = {
		overflowY: elementToLock.style.overflowY,
		overflowX: elementToLock.style.overflowX
	};
	Object.assign(elementToLock.style, {
		overflowY: "hidden",
		overflowX: "hidden"
	});
	return () => {
		Object.assign(elementToLock.style, originalElementToLockStyles);
	};
}
function preventScrollInsetScrollbars(referenceElement) {
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const win = getWindow(html);
	let scrollTop = 0;
	let scrollLeft = 0;
	let updateGutterOnly = false;
	const resizeFrame = AnimationFrame.create();
	if (isWebKit$1 && (win.visualViewport?.scale ?? 1) !== 1) return () => {};
	function lockScroll() {
		const htmlStyles = win.getComputedStyle(html);
		const bodyStyles = win.getComputedStyle(body);
		const scrollbarGutterValue = (htmlStyles.scrollbarGutter || "").includes("both-edges") ? "stable both-edges" : "stable";
		scrollTop = html.scrollTop;
		scrollLeft = html.scrollLeft;
		originalHtmlStyles = {
			scrollbarGutter: html.style.scrollbarGutter,
			overflowY: html.style.overflowY,
			overflowX: html.style.overflowX
		};
		originalHtmlScrollBehavior = html.style.scrollBehavior;
		originalBodyStyles = {
			position: body.style.position,
			height: body.style.height,
			width: body.style.width,
			boxSizing: body.style.boxSizing,
			overflowY: body.style.overflowY,
			overflowX: body.style.overflowX,
			scrollBehavior: body.style.scrollBehavior
		};
		const isScrollableY = html.scrollHeight > html.clientHeight;
		const isScrollableX = html.scrollWidth > html.clientWidth;
		const hasConstantOverflowY = htmlStyles.overflowY === "scroll" || bodyStyles.overflowY === "scroll";
		const hasConstantOverflowX = htmlStyles.overflowX === "scroll" || bodyStyles.overflowX === "scroll";
		const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth);
		const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight);
		const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
		const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);
		const elementToLock = isOverflowElement(html) ? html : body;
		updateGutterOnly = supportsStableScrollbarGutter(referenceElement);
		if (updateGutterOnly) {
			html.style.scrollbarGutter = scrollbarGutterValue;
			elementToLock.style.overflowY = "hidden";
			elementToLock.style.overflowX = "hidden";
			return;
		}
		Object.assign(html.style, {
			scrollbarGutter: scrollbarGutterValue,
			overflowY: "hidden",
			overflowX: "hidden"
		});
		if (isScrollableY || hasConstantOverflowY) html.style.overflowY = "scroll";
		if (isScrollableX || hasConstantOverflowX) html.style.overflowX = "scroll";
		Object.assign(body.style, {
			position: "relative",
			height: marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : "100dvh",
			width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : "100vw",
			boxSizing: "border-box",
			overflow: "hidden",
			scrollBehavior: "unset"
		});
		body.scrollTop = scrollTop;
		body.scrollLeft = scrollLeft;
		html.setAttribute("data-base-ui-scroll-locked", "");
		html.style.scrollBehavior = "unset";
	}
	function cleanup() {
		Object.assign(html.style, originalHtmlStyles);
		Object.assign(body.style, originalBodyStyles);
		if (!updateGutterOnly) {
			html.scrollTop = scrollTop;
			html.scrollLeft = scrollLeft;
			html.removeAttribute("data-base-ui-scroll-locked");
			html.style.scrollBehavior = originalHtmlScrollBehavior;
		}
	}
	function handleResize() {
		cleanup();
		resizeFrame.request(lockScroll);
	}
	lockScroll();
	const unsubscribeResize = addEventListener(win, "resize", handleResize);
	return () => {
		resizeFrame.cancel();
		cleanup();
		if (typeof win.removeEventListener === "function") unsubscribeResize();
	};
}
var ScrollLocker = class {
	lockCount = 0;
	restore = null;
	timeoutLock = Timeout.create();
	timeoutUnlock = Timeout.create();
	acquire(referenceElement) {
		this.lockCount += 1;
		if (this.lockCount === 1 && this.restore === null) this.timeoutLock.start(0, () => this.lock(referenceElement));
		return this.release;
	}
	release = () => {
		this.lockCount -= 1;
		if (this.lockCount === 0 && this.restore) this.timeoutUnlock.start(0, this.unlock);
	};
	unlock = () => {
		if (this.lockCount === 0 && this.restore) {
			this.restore?.();
			this.restore = null;
		}
	};
	lock(referenceElement) {
		if (this.lockCount === 0 || this.restore !== null) return;
		const html = ownerDocument(referenceElement).documentElement;
		const htmlOverflowY = getWindow(html).getComputedStyle(html).overflowY;
		if (htmlOverflowY === "hidden" || htmlOverflowY === "clip") {
			this.restore = NOOP;
			return;
		}
		const hasOverlayScrollbars = isIOS || !hasInsetScrollbars(referenceElement);
		this.restore = hasOverlayScrollbars ? preventScrollOverlayScrollbars(referenceElement) : preventScrollInsetScrollbars(referenceElement);
	}
};
var SCROLL_LOCKER = new ScrollLocker();
/**
* Locks the scroll of the document when enabled.
*
* @param enabled - Whether to enable the scroll lock.
* @param referenceElement - Element to use as a reference for lock calculations.
*/
function useScrollLock(enabled = true, referenceElement = null) {
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		return SCROLL_LOCKER.acquire(referenceElement);
	}, [enabled, referenceElement]);
}
//#endregion
//#region node_modules/@base-ui/utils/esm/useEnhancedClickHandler.js
/**
* Provides a cross-browser way to determine the type of the pointer used to click.
* Safari and Firefox do not provide the PointerEvent to the click handler (they use MouseEvent) yet.
* Additionally, this implementation detects if the click was triggered by the keyboard.
*
* @param handler The function to be called when the button is clicked. The first parameter is the original event and the second parameter is the pointer type.
*/
function useEnhancedClickHandler(handler) {
	const lastClickInteractionTypeRef = import_react.useRef("");
	const handlePointerDown = import_react.useCallback((event) => {
		if (event.defaultPrevented) return;
		lastClickInteractionTypeRef.current = event.pointerType;
		handler(event, event.pointerType);
	}, [handler]);
	return {
		onClick: import_react.useCallback((event) => {
			if (event.detail === 0) {
				handler(event, "keyboard");
				return;
			}
			if ("pointerType" in event) handler(event, event.pointerType);
			else handler(event, lastClickInteractionTypeRef.current);
			lastClickInteractionTypeRef.current = "";
		}, [handler]),
		onPointerDown: handlePointerDown
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/useOpenInteractionType.js
function useOpenMethodTriggerProps(open, setOpenMethod) {
	const { onClick, onPointerDown } = useEnhancedClickHandler(useStableCallback((_, interactionType) => {
		if (!(typeof open === "function" ? open() : open)) setOpenMethod(interactionType || (isIOS ? "touch" : ""));
	}));
	return import_react.useMemo(() => ({
		onClick,
		onPointerDown
	}), [onClick, onPointerDown]);
}
/**
* Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
*
* @param open The open state of the component.
*/
function useOpenInteractionType(open) {
	const [openMethod, setOpenMethod] = import_react.useState(null);
	const triggerProps = useOpenMethodTriggerProps(open, setOpenMethod);
	useValueChanged(open, (previousOpen) => {
		if (previousOpen && !open) setOpenMethod(null);
	});
	return import_react.useMemo(() => ({
		openMethod,
		triggerProps
	}), [openMethod, triggerProps]);
}
//#endregion
export { isTypeableElement as $, useFloatingParentNodeId as A, getNodeChildren as B, createSelector as C, FloatingNode as D, FloatingFocusManager as E, DISABLED_TRANSITIONS_STYLE as F, FocusGuard as G, getTabbableAfterElement as H, DROPDOWN_COLLISION_AVOIDANCE as I, addEventListener as J, useValueAsRef as K, POPUP_COLLISION_AVOIDANCE as L, FloatingTreeStore as M, FloatingPortal as N, FloatingTree as O, CLICK_TRIGGER_IDENTIFIER as P, isTypeableCombobox as Q, enqueueFocus as R, fastComponentRef as S, useClick as T, getTabbableBeforeElement as U, getNextTabbable as V, isOutsideEvent as W, isInteractiveElement as X, getFloatingFocusElement as Y, isTargetInsideEnabledTrigger as Z, FloatingRootStore as _, InternalBackdrop as a, pressableTriggerOpenStateMapping as at, useStore as b, setOpenTriggerState as c, usePopupInteractionProps as d, matchesFocusVisible as et, usePopupRootSync as f, useSyncedFloatingRootContext as g, useTriggerRegistration as h, useOnFirstRender as i, popupStateMapping as it, useFloatingTree as j, useFloatingNodeId as k, useImplicitActiveTrigger as l, useTriggerDataForwarding as m, useOpenMethodTriggerProps as n, useTimeout as nt, PopupTriggerMap as o, triggerOpenStateMapping as ot, usePopupStore as p, mergeCleanups as q, useScrollLock as r, CommonPopupDataAttributes as rt, FOCUSABLE_POPUP_PROPS as s, useOpenInteractionType as t, Timeout as tt, useOpenStateTransitions as u, ReactStore as v, useDismiss as w, fastComponent as x, Store as y, createAttribute as z };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlT3BlbkludGVyYWN0aW9uVHlwZS1DekNfY0ZCTS5qcyIsIm5hbWVzIjpbIm93bmVyV2luZG93IiwiUkVBU09OUy5mb2N1c091dCIsImlzV2ViS2l0IiwiUkVBU09OUy50cmlnZ2VyUHJlc3MiLCJvdXRzaWRlUHJlc3MiLCJSRUFTT05TLnRyaWdnZXJQcmVzcyIsImVzY2FwZUtleSIsIlJFQVNPTlMuZXNjYXBlS2V5IiwiUkVBU09OUy5vdXRzaWRlUHJlc3MiLCJ1c2VTeW5jRXh0ZXJuYWxTdG9yZSIsInVzZVN5bmNFeHRlcm5hbFN0b3JlV2l0aFNlbGVjdG9yIiwib3duZXJXaW5kb3ciLCJpc1dlYktpdCJdLCJzb3VyY2VzIjpbIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9wb3B1cFN0YXRlTWFwcGluZy5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS91c2VUaW1lb3V0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L3V0aWxzL2VsZW1lbnQuanMiLCIuLi8uLi9AYmFzZS11aS91dGlscy9lc20vYWRkRXZlbnRMaXN0ZW5lci5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS9tZXJnZUNsZWFudXBzLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3VzZVZhbHVlQXNSZWYuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvRm9jdXNHdWFyZC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC91dGlscy90YWJiYWJsZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC91dGlscy9ub2Rlcy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC91dGlscy9jcmVhdGVBdHRyaWJ1dGUuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMvZW5xdWV1ZUZvY3VzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L3V0aWxzL21hcmtPdGhlcnMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vaW50ZXJuYWxzL2NvbnN0YW50cy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC9jb21wb25lbnRzL0Zsb2F0aW5nUG9ydGFsLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L3V0aWxzL2NyZWF0ZUV2ZW50RW1pdHRlci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC9jb21wb25lbnRzL0Zsb2F0aW5nVHJlZVN0b3JlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2NvbXBvbmVudHMvRmxvYXRpbmdUcmVlLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2NvbXBvbmVudHMvRmxvYXRpbmdGb2N1c01hbmFnZXIuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlQ2xpY2suanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlRGlzbWlzcy5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS9zdG9yZS9jcmVhdGVTZWxlY3Rvci5qcyIsIi4uLy4uL3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlL2Nqcy91c2Utc3luYy1leHRlcm5hbC1zdG9yZS1zaGltL3dpdGgtc2VsZWN0b3IuZGV2ZWxvcG1lbnQuanMiLCIuLi8uLi91c2Utc3luYy1leHRlcm5hbC1zdG9yZS9zaGltL3dpdGgtc2VsZWN0b3IuanMiLCIuLi8uLi9AYmFzZS11aS91dGlscy9lc20vZmFzdEhvb2tzLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3N0b3JlL3VzZVN0b3JlLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3N0b3JlL1N0b3JlLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3N0b3JlL1JlYWN0U3RvcmUuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvY29tcG9uZW50cy9GbG9hdGluZ1Jvb3RTdG9yZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9mbG9hdGluZy11aS1yZWFjdC9ob29rcy91c2VTeW5jZWRGbG9hdGluZ1Jvb3RDb250ZXh0LmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3V0aWxzL3BvcHVwcy9wb3B1cFN0b3JlVXRpbHMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvcG9wdXBzL3BvcHVwVHJpZ2dlck1hcC5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9JbnRlcm5hbEJhY2tkcm9wLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3VzZU9uRmlyc3RSZW5kZXIuanMiLCIuLi8uLi9AYmFzZS11aS91dGlscy9lc20vdXNlU2Nyb2xsTG9jay5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS91c2VFbmhhbmNlZENsaWNrSGFuZGxlci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy91c2VPcGVuSW50ZXJhY3Rpb25UeXBlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlcyB9IGZyb20gXCIuLi9pbnRlcm5hbHMvc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qc1wiO1xuZXhwb3J0IGxldCBDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKENvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXMpIHtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgcG9wdXAgaXMgb3Blbi5cbiAgICovXG4gIENvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXNbXCJvcGVuXCJdID0gXCJkYXRhLW9wZW5cIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgcG9wdXAgaXMgY2xvc2VkLlxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tcImNsb3NlZFwiXSA9IFwiZGF0YS1jbG9zZWRcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgcG9wdXAgaXMgYW5pbWF0aW5nIGluLlxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzW1wic3RhcnRpbmdTdHlsZVwiXSA9IFRyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlcy5zdGFydGluZ1N0eWxlXSA9IFwic3RhcnRpbmdTdHlsZVwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBwb3B1cCBpcyBhbmltYXRpbmcgb3V0LlxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzW1wiZW5kaW5nU3R5bGVcIl0gPSBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMuZW5kaW5nU3R5bGVdID0gXCJlbmRpbmdTdHlsZVwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIHRoZSBhbmNob3IgaXMgaGlkZGVuLlxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tcImFuY2hvckhpZGRlblwiXSA9IFwiZGF0YS1hbmNob3ItaGlkZGVuXCI7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggc2lkZSB0aGUgcG9wdXAgaXMgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB0aGUgdHJpZ2dlci5cbiAgICogQHR5cGUgeyAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdpbmxpbmUtZW5kJyB8ICdpbmxpbmUtc3RhcnQnfVxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tcInNpZGVcIl0gPSBcImRhdGEtc2lkZVwiO1xuICAvKipcbiAgICogSW5kaWNhdGVzIGhvdyB0aGUgcG9wdXAgaXMgYWxpZ25lZCByZWxhdGl2ZSB0byBzcGVjaWZpZWQgc2lkZS5cbiAgICogQHR5cGUgeydzdGFydCcgfCAnY2VudGVyJyB8ICdlbmQnfVxuICAgKi9cbiAgQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlc1tcImFsaWduXCJdID0gXCJkYXRhLWFsaWduXCI7XG4gIHJldHVybiBDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzO1xufSh7fSk7XG5leHBvcnQgbGV0IENvbW1vblRyaWdnZXJEYXRhQXR0cmlidXRlcyA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoQ29tbW9uVHJpZ2dlckRhdGFBdHRyaWJ1dGVzKSB7XG4gIC8qKlxuICAgKiBQcmVzZW50IHdoZW4gdGhlIHBvcHVwIGlzIG9wZW4uXG4gICAqL1xuICBDb21tb25UcmlnZ2VyRGF0YUF0dHJpYnV0ZXNbXCJwb3B1cE9wZW5cIl0gPSBcImRhdGEtcG9wdXAtb3BlblwiO1xuICAvKipcbiAgICogUHJlc2VudCB3aGVuIGEgcHJlc3NhYmxlIHRyaWdnZXIgaXMgcHJlc3NlZC5cbiAgICovXG4gIENvbW1vblRyaWdnZXJEYXRhQXR0cmlidXRlc1tcInByZXNzZWRcIl0gPSBcImRhdGEtcHJlc3NlZFwiO1xuICByZXR1cm4gQ29tbW9uVHJpZ2dlckRhdGFBdHRyaWJ1dGVzO1xufSh7fSk7XG5jb25zdCBUUklHR0VSX0hPT0sgPSB7XG4gIFtDb21tb25UcmlnZ2VyRGF0YUF0dHJpYnV0ZXMucG9wdXBPcGVuXTogJydcbn07XG5jb25zdCBQUkVTU0FCTEVfVFJJR0dFUl9IT09LID0ge1xuICBbQ29tbW9uVHJpZ2dlckRhdGFBdHRyaWJ1dGVzLnBvcHVwT3Blbl06ICcnLFxuICBbQ29tbW9uVHJpZ2dlckRhdGFBdHRyaWJ1dGVzLnByZXNzZWRdOiAnJ1xufTtcbmNvbnN0IFBPUFVQX09QRU5fSE9PSyA9IHtcbiAgW0NvbW1vblBvcHVwRGF0YUF0dHJpYnV0ZXMub3Blbl06ICcnXG59O1xuY29uc3QgUE9QVVBfQ0xPU0VEX0hPT0sgPSB7XG4gIFtDb21tb25Qb3B1cERhdGFBdHRyaWJ1dGVzLmNsb3NlZF06ICcnXG59O1xuY29uc3QgQU5DSE9SX0hJRERFTl9IT09LID0ge1xuICBbQ29tbW9uUG9wdXBEYXRhQXR0cmlidXRlcy5hbmNob3JIaWRkZW5dOiAnJ1xufTtcbmV4cG9ydCBjb25zdCB0cmlnZ2VyT3BlblN0YXRlTWFwcGluZyA9IHtcbiAgb3Blbih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIFRSSUdHRVJfSE9PSztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5leHBvcnQgY29uc3QgcHJlc3NhYmxlVHJpZ2dlck9wZW5TdGF0ZU1hcHBpbmcgPSB7XG4gIG9wZW4odmFsdWUpIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBQUkVTU0FCTEVfVFJJR0dFUl9IT09LO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbmV4cG9ydCBjb25zdCBwb3B1cFN0YXRlTWFwcGluZyA9IHtcbiAgb3Blbih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIFBPUFVQX09QRU5fSE9PSztcbiAgICB9XG4gICAgcmV0dXJuIFBPUFVQX0NMT1NFRF9IT09LO1xuICB9LFxuICBhbmNob3JIaWRkZW4odmFsdWUpIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBBTkNIT1JfSElEREVOX0hPT0s7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59OyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlUmVmV2l0aEluaXQgfSBmcm9tIFwiLi91c2VSZWZXaXRoSW5pdC5qc1wiO1xuaW1wb3J0IHsgdXNlT25Nb3VudCB9IGZyb20gXCIuL3VzZU9uTW91bnQuanNcIjtcbmNvbnN0IEVNUFRZID0gMDtcbmV4cG9ydCBjbGFzcyBUaW1lb3V0IHtcbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IFRpbWVvdXQoKTtcbiAgfVxuICBjdXJyZW50SWQgPSBFTVBUWTtcblxuICAvKipcbiAgICogRXhlY3V0ZXMgYGZuYCBhZnRlciBgZGVsYXlgLCBjbGVhcmluZyBhbnkgcHJldmlvdXNseSBzY2hlZHVsZWQgY2FsbC5cbiAgICovXG4gIHN0YXJ0KGRlbGF5LCBmbikge1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLmN1cnJlbnRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50SWQgPSBFTVBUWTtcbiAgICAgIGZuKCk7XG4gICAgfSwgZGVsYXkpOyAvKiBOb2RlLmpzIHR5cGVzIGFyZSBlbmFibGVkIGluIGRldmVsb3BtZW50ICovXG4gIH1cbiAgaXNTdGFydGVkKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRJZCAhPT0gRU1QVFk7XG4gIH1cbiAgY2xlYXIgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuY3VycmVudElkICE9PSBFTVBUWSkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY3VycmVudElkKTtcbiAgICAgIHRoaXMuY3VycmVudElkID0gRU1QVFk7XG4gICAgfVxuICB9O1xuICBkaXNwb3NlRWZmZWN0ID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLmNsZWFyO1xuICB9O1xufVxuXG4vKipcbiAqIEEgYHNldFRpbWVvdXRgIHdpdGggYXV0b21hdGljIGNsZWFudXAgYW5kIGd1YXJkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlVGltZW91dCgpIHtcbiAgY29uc3QgdGltZW91dCA9IHVzZVJlZldpdGhJbml0KFRpbWVvdXQuY3JlYXRlKS5jdXJyZW50O1xuICB1c2VPbk1vdW50KHRpbWVvdXQuZGlzcG9zZUVmZmVjdCk7XG4gIHJldHVybiB0aW1lb3V0O1xufSIsImltcG9ydCB7IGlzRWxlbWVudCwgaXNIVE1MRWxlbWVudCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgaXNKU0RPTSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2RldGVjdEJyb3dzZXInO1xuaW1wb3J0IHsgRk9DVVNBQkxFX0FUVFJJQlVURSwgVFlQRUFCTEVfU0VMRUNUT1IgfSBmcm9tIFwiLi9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IGFjdGl2ZUVsZW1lbnQsIGNvbnRhaW5zLCBnZXRUYXJnZXQgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3NoYWRvd0RvbS5qc1wiO1xuZXhwb3J0IHsgYWN0aXZlRWxlbWVudCwgY29udGFpbnMsIGdldFRhcmdldCB9O1xuZXhwb3J0IGZ1bmN0aW9uIGlzVGFyZ2V0SW5zaWRlRW5hYmxlZFRyaWdnZXIodGFyZ2V0LCB0cmlnZ2VyRWxlbWVudHMpIHtcbiAgaWYgKCFpc0VsZW1lbnQodGFyZ2V0KSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB0YXJnZXRFbGVtZW50ID0gdGFyZ2V0O1xuICBpZiAodHJpZ2dlckVsZW1lbnRzLmhhc0VsZW1lbnQodGFyZ2V0RWxlbWVudCkpIHtcbiAgICByZXR1cm4gIXRhcmdldEVsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLXRyaWdnZXItZGlzYWJsZWQnKTtcbiAgfVxuICBmb3IgKGNvbnN0IFssIHRyaWdnZXJdIG9mIHRyaWdnZXJFbGVtZW50cy5lbnRyaWVzKCkpIHtcbiAgICBpZiAoY29udGFpbnModHJpZ2dlciwgdGFyZ2V0RWxlbWVudCkpIHtcbiAgICAgIHJldHVybiAhdHJpZ2dlci5oYXNBdHRyaWJ1dGUoJ2RhdGEtdHJpZ2dlci1kaXNhYmxlZCcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNFdmVudFRhcmdldFdpdGhpbihldmVudCwgbm9kZSkge1xuICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICgnY29tcG9zZWRQYXRoJyBpbiBldmVudCkge1xuICAgIHJldHVybiBldmVudC5jb21wb3NlZFBhdGgoKS5pbmNsdWRlcyhub2RlKTtcbiAgfVxuXG4gIC8vIFRTIHRoaW5rcyBgZXZlbnRgIGlzIG9mIHR5cGUgbmV2ZXIgYXMgaXQgYXNzdW1lcyBhbGwgYnJvd3NlcnMgc3VwcG9ydCBjb21wb3NlZFBhdGgsIGJ1dCBicm93c2VycyB3aXRob3V0IHNoYWRvdyBkb20gZG9uJ3RcbiAgY29uc3QgZXZlbnRBZ2FpbiA9IGV2ZW50O1xuICByZXR1cm4gZXZlbnRBZ2Fpbi50YXJnZXQgIT0gbnVsbCAmJiBub2RlLmNvbnRhaW5zKGV2ZW50QWdhaW4udGFyZ2V0KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1Jvb3RFbGVtZW50KGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQubWF0Y2hlcygnaHRtbCxib2R5Jyk7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlYWJsZUVsZW1lbnQoZWxlbWVudCkge1xuICByZXR1cm4gaXNIVE1MRWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50Lm1hdGNoZXMoVFlQRUFCTEVfU0VMRUNUT1IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzSW50ZXJhY3RpdmVFbGVtZW50KGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQ/LmNsb3Nlc3QoYGJ1dHRvbixhW2hyZWZdLFtyb2xlPVwiYnV0dG9uXCJdLHNlbGVjdCxbdGFiaW5kZXhdOm5vdChbdGFiaW5kZXg9XCItMVwiXSksJHtUWVBFQUJMRV9TRUxFQ1RPUn1gKSAhPSBudWxsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZWFibGVDb21ib2JveChlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSA9PT0gJ2NvbWJvYm94JyAmJiBpc1R5cGVhYmxlRWxlbWVudChlbGVtZW50KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGVzRm9jdXNWaXNpYmxlKGVsZW1lbnQpIHtcbiAgLy8gV2UgZG9uJ3Qgd2FudCB0byBibG9jayBmb2N1cyBmcm9tIHdvcmtpbmcgd2l0aCBgdmlzaWJsZU9ubHlgXG4gIC8vIChKU0RPTSBkb2Vzbid0IG1hdGNoIGA6Zm9jdXMtdmlzaWJsZWAgd2hlbiB0aGUgZWxlbWVudCBoYXMgYDpmb2N1c2ApXG4gIGlmICghZWxlbWVudCB8fCBpc0pTRE9NKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gZWxlbWVudC5tYXRjaGVzKCc6Zm9jdXMtdmlzaWJsZScpO1xuICB9IGNhdGNoIChfZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RmxvYXRpbmdGb2N1c0VsZW1lbnQoZmxvYXRpbmdFbGVtZW50KSB7XG4gIGlmICghZmxvYXRpbmdFbGVtZW50KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gVHJ5IHRvIGZpbmQgdGhlIGVsZW1lbnQgdGhhdCBoYXMgYHsuLi5nZXRGbG9hdGluZ1Byb3BzKCl9YCBzcHJlYWQgb24gaXQuXG4gIC8vIFRoaXMgaW5kaWNhdGVzIHRoZSBmbG9hdGluZyBlbGVtZW50IGlzIGFjdGluZyBhcyBhIHBvc2l0aW9uaW5nIHdyYXBwZXIsIGFuZFxuICAvLyBzbyBmb2N1cyBzaG91bGQgYmUgbWFuYWdlZCBvbiB0aGUgY2hpbGQgZWxlbWVudCB3aXRoIHRoZSBldmVudCBoYW5kbGVycyBhbmRcbiAgLy8gYXJpYSBwcm9wcy5cbiAgcmV0dXJuIGZsb2F0aW5nRWxlbWVudC5oYXNBdHRyaWJ1dGUoRk9DVVNBQkxFX0FUVFJJQlVURSkgPyBmbG9hdGluZ0VsZW1lbnQgOiBmbG9hdGluZ0VsZW1lbnQucXVlcnlTZWxlY3RvcihgWyR7Rk9DVVNBQkxFX0FUVFJJQlVURX1dYCkgfHwgZmxvYXRpbmdFbGVtZW50O1xufSIsIi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciBhbmQgcmV0dXJucyBhIGNsZWFudXAgZnVuY3Rpb24gdG8gcmVtb3ZlIGl0LlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpIHtcbiAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgfTtcbn0iLCIvKipcbiAqIENvbWJpbmVzIG11bHRpcGxlIGNsZWFudXAgZnVuY3Rpb25zIGludG8gYSBzaW5nbGUgY2xlYW51cCBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQ2xlYW51cHMoLi4uY2xlYW51cHMpIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBjbGVhbnVwID0gY2xlYW51cHNbaV07XG4gICAgICBpZiAoY2xlYW51cCkge1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSBcIi4vdXNlSXNvTGF5b3V0RWZmZWN0LmpzXCI7XG5pbXBvcnQgeyB1c2VSZWZXaXRoSW5pdCB9IGZyb20gXCIuL3VzZVJlZldpdGhJbml0LmpzXCI7XG5cbi8qKlxuICogVW50cmFja3MgdGhlIHByb3ZpZGVkIHZhbHVlIGJ5IHR1cm5pbmcgaXQgaW50byBhIHJlZiB0byByZW1vdmUgaXRzIHJlYWN0aXZpdHkuXG4gKlxuICogVXNlZCB0byBhY2Nlc3MgdGhlIHBhc3NlZCB2YWx1ZSBpbnNpZGUgYFJlYWN0LnVzZUVmZmVjdGAgd2l0aG91dCBjYXVzaW5nIHRoZSBlZmZlY3QgdG8gcmUtcnVuIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VWYWx1ZUFzUmVmKHZhbHVlKSB7XG4gIGNvbnN0IGxhdGVzdCA9IHVzZVJlZldpdGhJbml0KGNyZWF0ZUxhdGVzdFJlZiwgdmFsdWUpLmN1cnJlbnQ7XG4gIGxhdGVzdC5uZXh0ID0gdmFsdWU7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB1c2VJc29MYXlvdXRFZmZlY3QobGF0ZXN0LmVmZmVjdCk7XG4gIHJldHVybiBsYXRlc3Q7XG59XG5mdW5jdGlvbiBjcmVhdGVMYXRlc3RSZWYodmFsdWUpIHtcbiAgY29uc3QgbGF0ZXN0ID0ge1xuICAgIGN1cnJlbnQ6IHZhbHVlLFxuICAgIG5leHQ6IHZhbHVlLFxuICAgIGVmZmVjdDogKCkgPT4ge1xuICAgICAgbGF0ZXN0LmN1cnJlbnQgPSBsYXRlc3QubmV4dDtcbiAgICB9XG4gIH07XG4gIHJldHVybiBsYXRlc3Q7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgaXNTYWZhcmkgfSBmcm9tICdAYmFzZS11aS91dGlscy9kZXRlY3RCcm93c2VyJztcbmltcG9ydCB7IHZpc3VhbGx5SGlkZGVuIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdmlzdWFsbHlIaWRkZW4nO1xuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZXhwb3J0IGNvbnN0IEZvY3VzR3VhcmQgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBGb2N1c0d1YXJkKHByb3BzLCByZWYpIHtcbiAgY29uc3QgW3JvbGUsIHNldFJvbGVdID0gUmVhY3QudXNlU3RhdGUoKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNTYWZhcmkpIHtcbiAgICAgIC8vIFVubGlrZSBvdGhlciBzY3JlZW4gcmVhZGVycyBzdWNoIGFzIE5WREEgYW5kIEpBV1MsIHRoZSB2aXJ0dWFsIGN1cnNvclxuICAgICAgLy8gb24gVm9pY2VPdmVyIGRvZXMgdHJpZ2dlciB0aGUgb25Gb2N1cyBldmVudCwgc28gd2UgY2FuIHVzZSB0aGUgZm9jdXNcbiAgICAgIC8vIHRyYXAgZWxlbWVudC4gT24gU2FmYXJpLCBvbmx5IGJ1dHRvbnMgdHJpZ2dlciB0aGUgb25Gb2N1cyBldmVudC5cbiAgICAgIHNldFJvbGUoJ2J1dHRvbicpO1xuICAgIH1cbiAgfSwgW10pO1xuICBjb25zdCByZXN0UHJvcHMgPSB7XG4gICAgdGFiSW5kZXg6IDAsXG4gICAgLy8gUm9sZSBpcyBvbmx5IGZvciBWb2ljZU92ZXJcbiAgICByb2xlXG4gIH07XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChcInNwYW5cIiwge1xuICAgIC4uLnByb3BzLFxuICAgIHJlZjogcmVmLFxuICAgIHN0eWxlOiB2aXN1YWxseUhpZGRlbixcbiAgICBcImFyaWEtaGlkZGVuXCI6IHJvbGUgPyB1bmRlZmluZWQgOiB0cnVlLFxuICAgIC4uLnJlc3RQcm9wcyxcbiAgICBcImRhdGEtYmFzZS11aS1mb2N1cy1ndWFyZFwiOiBcIlwiXG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBGb2N1c0d1YXJkLmRpc3BsYXlOYW1lID0gXCJGb2N1c0d1YXJkXCI7IiwiaW1wb3J0IHsgZ2V0Q29tcHV0ZWRTdHlsZSwgZ2V0Tm9kZU5hbWUsIGlzSFRNTEVsZW1lbnQsIGlzU2hhZG93Um9vdCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IGFjdGl2ZUVsZW1lbnQsIGNvbnRhaW5zIH0gZnJvbSBcIi4vZWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgaXNFbGVtZW50VmlzaWJsZSB9IGZyb20gXCIuL2NvbXBvc2l0ZS5qc1wiO1xuY29uc3QgQ0FORElEQVRFX1NFTEVDVE9SID0gJ2FbaHJlZl0sYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYSxzdW1tYXJ5LGRldGFpbHMsaWZyYW1lLG9iamVjdCxlbWJlZCxbdGFiaW5kZXhdLFtjb250ZW50ZWRpdGFibGVdOm5vdChbY29udGVudGVkaXRhYmxlPVwiZmFsc2VcIl0pLGF1ZGlvW2NvbnRyb2xzXSx2aWRlb1tjb250cm9sc10nO1xuZnVuY3Rpb24gZ2V0UGFyZW50RWxlbWVudChlbGVtZW50KSB7XG4gIGNvbnN0IGFzc2lnbmVkU2xvdCA9IGVsZW1lbnQuYXNzaWduZWRTbG90O1xuICBpZiAoYXNzaWduZWRTbG90KSB7XG4gICAgcmV0dXJuIGFzc2lnbmVkU2xvdDtcbiAgfVxuICBpZiAoZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgfVxuICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnQuZ2V0Um9vdE5vZGUoKTtcbiAgcmV0dXJuIGlzU2hhZG93Um9vdChyb290Tm9kZSkgPyByb290Tm9kZS5ob3N0IDogbnVsbDtcbn1cbmZ1bmN0aW9uIGdldERldGFpbHNTdW1tYXJ5KGRldGFpbHMpIHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGRldGFpbHMuY2hpbGRyZW4pKSB7XG4gICAgaWYgKGdldE5vZGVOYW1lKGNoaWxkKSA9PT0gJ3N1bW1hcnknKSB7XG4gICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gaXNXaXRoaW5PcGVuRGV0YWlsc1N1bW1hcnkoZWxlbWVudCwgZGV0YWlscykge1xuICBjb25zdCBzdW1tYXJ5ID0gZ2V0RGV0YWlsc1N1bW1hcnkoZGV0YWlscyk7XG4gIHJldHVybiAhIXN1bW1hcnkgJiYgKGVsZW1lbnQgPT09IHN1bW1hcnkgfHwgY29udGFpbnMoc3VtbWFyeSwgZWxlbWVudCkpO1xufVxuZnVuY3Rpb24gaXNGb2N1c2FibGVDYW5kaWRhdGUoZWxlbWVudCkge1xuICBjb25zdCBub2RlTmFtZSA9IGVsZW1lbnQgPyBnZXROb2RlTmFtZShlbGVtZW50KSA6ICcnO1xuICByZXR1cm4gZWxlbWVudCAhPSBudWxsICYmIGVsZW1lbnQubWF0Y2hlcyhDQU5ESURBVEVfU0VMRUNUT1IpICYmIChub2RlTmFtZSAhPT0gJ3N1bW1hcnknIHx8IGVsZW1lbnQucGFyZW50RWxlbWVudCAhPSBudWxsICYmIGdldE5vZGVOYW1lKGVsZW1lbnQucGFyZW50RWxlbWVudCkgPT09ICdkZXRhaWxzJyAmJiBnZXREZXRhaWxzU3VtbWFyeShlbGVtZW50LnBhcmVudEVsZW1lbnQpID09PSBlbGVtZW50KSAmJiAobm9kZU5hbWUgIT09ICdkZXRhaWxzJyB8fCBnZXREZXRhaWxzU3VtbWFyeShlbGVtZW50KSA9PSBudWxsKSAmJiAobm9kZU5hbWUgIT09ICdpbnB1dCcgfHwgZWxlbWVudC50eXBlICE9PSAnaGlkZGVuJyk7XG59XG5mdW5jdGlvbiBpc0ZvY3VzYWJsZUVsZW1lbnQoZWxlbWVudCkge1xuICBpZiAoIWlzRm9jdXNhYmxlQ2FuZGlkYXRlKGVsZW1lbnQpIHx8ICFlbGVtZW50LmlzQ29ubmVjdGVkIHx8IGVsZW1lbnQubWF0Y2hlcygnOmRpc2FibGVkJykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yIChsZXQgY3VycmVudCA9IGVsZW1lbnQ7IGN1cnJlbnQ7IGN1cnJlbnQgPSBnZXRQYXJlbnRFbGVtZW50KGN1cnJlbnQpKSB7XG4gICAgY29uc3QgaXNBbmNlc3RvciA9IGN1cnJlbnQgIT09IGVsZW1lbnQ7XG4gICAgY29uc3QgaXNTbG90ID0gZ2V0Tm9kZU5hbWUoY3VycmVudCkgPT09ICdzbG90JztcbiAgICBpZiAoY3VycmVudC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQW5jZXN0b3IgJiYgZ2V0Tm9kZU5hbWUoY3VycmVudCkgPT09ICdkZXRhaWxzJyAmJiAhY3VycmVudC5vcGVuICYmICFpc1dpdGhpbk9wZW5EZXRhaWxzU3VtbWFyeShlbGVtZW50LCBjdXJyZW50KSB8fCBjdXJyZW50Lmhhc0F0dHJpYnV0ZSgnaGlkZGVuJykgfHwgIWlzU2xvdCAmJiAhaXNWaXNpYmxlSW5UYWJiYWJsZVRyZWUoY3VycmVudCwgaXNBbmNlc3RvcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBpc1Zpc2libGVJblRhYmJhYmxlVHJlZShlbGVtZW50LCBpc0FuY2VzdG9yKSB7XG4gIGNvbnN0IHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gIGlmICghaXNBbmNlc3Rvcikge1xuICAgIHJldHVybiBpc0VsZW1lbnRWaXNpYmxlKGVsZW1lbnQsIHN0eWxlcyk7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcy5kaXNwbGF5ICE9PSAnbm9uZSc7XG59XG5mdW5jdGlvbiBnZXRUYWJJbmRleChlbGVtZW50KSB7XG4gIGNvbnN0IHRhYkluZGV4ID0gZWxlbWVudC50YWJJbmRleDtcbiAgaWYgKHRhYkluZGV4IDwgMCkge1xuICAgIGNvbnN0IG5vZGVOYW1lID0gZ2V0Tm9kZU5hbWUoZWxlbWVudCk7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnZGV0YWlscycgfHwgbm9kZU5hbWUgPT09ICdhdWRpbycgfHwgbm9kZU5hbWUgPT09ICd2aWRlbycgfHwgaXNIVE1MRWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50LmlzQ29udGVudEVkaXRhYmxlKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhYkluZGV4O1xufVxuZnVuY3Rpb24gZ2V0TmFtZWRSYWRpb0lucHV0KGVsZW1lbnQpIHtcbiAgaWYgKGdldE5vZGVOYW1lKGVsZW1lbnQpICE9PSAnaW5wdXQnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaW5wdXQgPSBlbGVtZW50O1xuICByZXR1cm4gaW5wdXQudHlwZSA9PT0gJ3JhZGlvJyAmJiBpbnB1dC5uYW1lICE9PSAnJyA/IGlucHV0IDogbnVsbDtcbn1cbmZ1bmN0aW9uIGlzVGFiYmFibGVSYWRpbyhlbGVtZW50LCBjYW5kaWRhdGVzKSB7XG4gIGNvbnN0IGlucHV0ID0gZ2V0TmFtZWRSYWRpb0lucHV0KGVsZW1lbnQpO1xuICBpZiAoIWlucHV0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY29uc3QgY2hlY2tlZFJhZGlvID0gY2FuZGlkYXRlcy5maW5kKGNhbmRpZGF0ZSA9PiB7XG4gICAgY29uc3QgcmFkaW8gPSBnZXROYW1lZFJhZGlvSW5wdXQoY2FuZGlkYXRlKTtcbiAgICByZXR1cm4gcmFkaW8/Lm5hbWUgPT09IGlucHV0Lm5hbWUgJiYgcmFkaW8uZm9ybSA9PT0gaW5wdXQuZm9ybSAmJiByYWRpby5jaGVja2VkO1xuICB9KTtcbiAgaWYgKGNoZWNrZWRSYWRpbykge1xuICAgIHJldHVybiBjaGVja2VkUmFkaW8gPT09IGlucHV0O1xuICB9XG4gIHJldHVybiBjYW5kaWRhdGVzLmZpbmQoY2FuZGlkYXRlID0+IHtcbiAgICBjb25zdCByYWRpbyA9IGdldE5hbWVkUmFkaW9JbnB1dChjYW5kaWRhdGUpO1xuICAgIHJldHVybiByYWRpbz8ubmFtZSA9PT0gaW5wdXQubmFtZSAmJiByYWRpby5mb3JtID09PSBpbnB1dC5mb3JtO1xuICB9KSA9PT0gaW5wdXQ7XG59XG5mdW5jdGlvbiBnZXRDb21wb3NlZENoaWxkcmVuKGNvbnRhaW5lcikge1xuICBpZiAoaXNIVE1MRWxlbWVudChjb250YWluZXIpICYmIGdldE5vZGVOYW1lKGNvbnRhaW5lcikgPT09ICdzbG90Jykge1xuICAgIGNvbnN0IGFzc2lnbmVkRWxlbWVudHMgPSBjb250YWluZXIuYXNzaWduZWRFbGVtZW50cyh7XG4gICAgICBmbGF0dGVuOiB0cnVlXG4gICAgfSk7XG4gICAgaWYgKGFzc2lnbmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGFzc2lnbmVkRWxlbWVudHM7XG4gICAgfVxuICB9XG4gIGlmIChpc0hUTUxFbGVtZW50KGNvbnRhaW5lcikgJiYgY29udGFpbmVyLnNoYWRvd1Jvb3QpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShjb250YWluZXIuc2hhZG93Um9vdC5jaGlsZHJlbik7XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20oY29udGFpbmVyLmNoaWxkcmVuKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZENhbmRpZGF0ZXMoY29udGFpbmVyLCBsaXN0KSB7XG4gIGdldENvbXBvc2VkQ2hpbGRyZW4oY29udGFpbmVyKS5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICBpZiAoaXNGb2N1c2FibGVDYW5kaWRhdGUoY2hpbGQpKSB7XG4gICAgICBsaXN0LnB1c2goY2hpbGQpO1xuICAgIH1cbiAgICBhcHBlbmRDYW5kaWRhdGVzKGNoaWxkLCBsaXN0KTtcbiAgfSk7XG59XG5mdW5jdGlvbiBhcHBlbmRNYXRjaGluZ0VsZW1lbnRzKGNvbnRhaW5lciwgc2VsZWN0b3IsIGxpc3QpIHtcbiAgZ2V0Q29tcG9zZWRDaGlsZHJlbihjb250YWluZXIpLmZvckVhY2goY2hpbGQgPT4ge1xuICAgIGlmIChpc0hUTUxFbGVtZW50KGNoaWxkKSAmJiBjaGlsZC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuICAgICAgbGlzdC5wdXNoKGNoaWxkKTtcbiAgICB9XG4gICAgYXBwZW5kTWF0Y2hpbmdFbGVtZW50cyhjaGlsZCwgc2VsZWN0b3IsIGxpc3QpO1xuICB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1RhYmJhYmxlKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlzRm9jdXNhYmxlRWxlbWVudChlbGVtZW50KSAmJiBnZXRUYWJJbmRleChlbGVtZW50KSA+PSAwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvY3VzYWJsZShjb250YWluZXIpIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IFtdO1xuICBhcHBlbmRDYW5kaWRhdGVzKGNvbnRhaW5lciwgY2FuZGlkYXRlcyk7XG4gIHJldHVybiBjYW5kaWRhdGVzLmZpbHRlcihpc0ZvY3VzYWJsZUVsZW1lbnQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHRhYmJhYmxlKGNvbnRhaW5lcikge1xuICBjb25zdCBjYW5kaWRhdGVzID0gZm9jdXNhYmxlKGNvbnRhaW5lcik7XG4gIHJldHVybiBjYW5kaWRhdGVzLmZpbHRlcihlbGVtZW50ID0+IGdldFRhYkluZGV4KGVsZW1lbnQpID49IDAgJiYgaXNUYWJiYWJsZVJhZGlvKGVsZW1lbnQsIGNhbmRpZGF0ZXMpKTtcbn1cbmZ1bmN0aW9uIGdldFRhYmJhYmxlSW4oY29udGFpbmVyLCBkaXIpIHtcbiAgY29uc3QgbGlzdCA9IHRhYmJhYmxlKGNvbnRhaW5lcik7XG4gIGNvbnN0IGxlbiA9IGxpc3QubGVuZ3RoO1xuICBpZiAobGVuID09PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBhY3RpdmUgPSBhY3RpdmVFbGVtZW50KG93bmVyRG9jdW1lbnQoY29udGFpbmVyKSk7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGFjdGl2ZSk7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuICBjb25zdCBuZXh0SW5kZXggPSBpbmRleCA9PT0gLTEgPyBkaXIgPT09IDEgPyAwIDogbGVuIC0gMSA6IGluZGV4ICsgZGlyO1xuICByZXR1cm4gbGlzdFtuZXh0SW5kZXhdO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldE5leHRUYWJiYWJsZShyZWZlcmVuY2VFbGVtZW50KSB7XG4gIHJldHVybiBnZXRUYWJiYWJsZUluKG93bmVyRG9jdW1lbnQocmVmZXJlbmNlRWxlbWVudCkuYm9keSwgMSkgfHwgcmVmZXJlbmNlRWxlbWVudDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c1RhYmJhYmxlKHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgcmV0dXJuIGdldFRhYmJhYmxlSW4ob3duZXJEb2N1bWVudChyZWZlcmVuY2VFbGVtZW50KS5ib2R5LCAtMSkgfHwgcmVmZXJlbmNlRWxlbWVudDtcbn1cbmZ1bmN0aW9uIGdldFRhYmJhYmxlTmVhckVsZW1lbnQocmVmZXJlbmNlRWxlbWVudCwgZGlyKSB7XG4gIGlmICghcmVmZXJlbmNlRWxlbWVudCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGxpc3QgPSB0YWJiYWJsZShvd25lckRvY3VtZW50KHJlZmVyZW5jZUVsZW1lbnQpLmJvZHkpO1xuICBjb25zdCBlbGVtZW50Q291bnQgPSBsaXN0Lmxlbmd0aDtcbiAgaWYgKGVsZW1lbnRDb3VudCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHJlZmVyZW5jZUVsZW1lbnQpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgbmV4dEluZGV4ID0gKGluZGV4ICsgZGlyICsgZWxlbWVudENvdW50KSAlIGVsZW1lbnRDb3VudDtcbiAgcmV0dXJuIGxpc3RbbmV4dEluZGV4XTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYWJiYWJsZUFmdGVyRWxlbWVudChyZWZlcmVuY2VFbGVtZW50KSB7XG4gIHJldHVybiBnZXRUYWJiYWJsZU5lYXJFbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQsIDEpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmJhYmxlQmVmb3JlRWxlbWVudChyZWZlcmVuY2VFbGVtZW50KSB7XG4gIHJldHVybiBnZXRUYWJiYWJsZU5lYXJFbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQsIC0xKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc091dHNpZGVFdmVudChldmVudCwgY29udGFpbmVyKSB7XG4gIGNvbnN0IGNvbnRhaW5lckVsZW1lbnQgPSBjb250YWluZXIgfHwgZXZlbnQuY3VycmVudFRhcmdldDtcbiAgY29uc3QgcmVsYXRlZFRhcmdldCA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQ7XG4gIHJldHVybiAhcmVsYXRlZFRhcmdldCB8fCAhY29udGFpbnMoY29udGFpbmVyRWxlbWVudCwgcmVsYXRlZFRhcmdldCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUZvY3VzSW5zaWRlKGNvbnRhaW5lcikge1xuICBjb25zdCB0YWJiYWJsZUVsZW1lbnRzID0gdGFiYmFibGUoY29udGFpbmVyKTtcbiAgdGFiYmFibGVFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgIGVsZW1lbnQuZGF0YXNldC50YWJpbmRleCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpIHx8ICcnO1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVGb2N1c0luc2lkZShjb250YWluZXIpIHtcbiAgY29uc3QgZWxlbWVudHMgPSBbXTtcbiAgYXBwZW5kTWF0Y2hpbmdFbGVtZW50cyhjb250YWluZXIsICdbZGF0YS10YWJpbmRleF0nLCBlbGVtZW50cyk7XG4gIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgY29uc3QgdGFiaW5kZXggPSBlbGVtZW50LmRhdGFzZXQudGFiaW5kZXg7XG4gICAgZGVsZXRlIGVsZW1lbnQuZGF0YXNldC50YWJpbmRleDtcbiAgICBpZiAodGFiaW5kZXgpIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIHRhYmluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgfVxuICB9KTtcbn0iLCIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbG9vcC1mdW5jICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlQ2hpbGRyZW4obm9kZXMsIGlkLCBvbmx5T3BlbkNoaWxkcmVuID0gdHJ1ZSkge1xuICBjb25zdCBkaXJlY3RDaGlsZHJlbiA9IG5vZGVzLmZpbHRlcihub2RlID0+IG5vZGUucGFyZW50SWQgPT09IGlkKTtcbiAgcmV0dXJuIGRpcmVjdENoaWxkcmVuLmZsYXRNYXAoY2hpbGQgPT4gWy4uLighb25seU9wZW5DaGlsZHJlbiB8fCBjaGlsZC5jb250ZXh0Py5vcGVuID8gW2NoaWxkXSA6IFtdKSwgLi4uZ2V0Tm9kZUNoaWxkcmVuKG5vZGVzLCBjaGlsZC5pZCwgb25seU9wZW5DaGlsZHJlbildKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWVwZXN0Tm9kZShub2RlcywgaWQpIHtcbiAgbGV0IGRlZXBlc3ROb2RlSWQ7XG4gIGxldCBtYXhEZXB0aCA9IC0xO1xuICBmdW5jdGlvbiBmaW5kRGVlcGVzdChub2RlSWQsIGRlcHRoKSB7XG4gICAgaWYgKGRlcHRoID4gbWF4RGVwdGgpIHtcbiAgICAgIGRlZXBlc3ROb2RlSWQgPSBub2RlSWQ7XG4gICAgICBtYXhEZXB0aCA9IGRlcHRoO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZHJlbiA9IGdldE5vZGVDaGlsZHJlbihub2Rlcywgbm9kZUlkKTtcbiAgICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGZpbmREZWVwZXN0KGNoaWxkLmlkLCBkZXB0aCArIDEpO1xuICAgIH0pO1xuICB9XG4gIGZpbmREZWVwZXN0KGlkLCAwKTtcbiAgcmV0dXJuIG5vZGVzLmZpbmQobm9kZSA9PiBub2RlLmlkID09PSBkZWVwZXN0Tm9kZUlkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlQW5jZXN0b3JzKG5vZGVzLCBpZCkge1xuICBsZXQgYWxsQW5jZXN0b3JzID0gW107XG4gIGxldCBjdXJyZW50UGFyZW50SWQgPSBub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS5pZCA9PT0gaWQpPy5wYXJlbnRJZDtcbiAgd2hpbGUgKGN1cnJlbnRQYXJlbnRJZCkge1xuICAgIGNvbnN0IGN1cnJlbnROb2RlID0gbm9kZXMuZmluZChub2RlID0+IG5vZGUuaWQgPT09IGN1cnJlbnRQYXJlbnRJZCk7XG4gICAgY3VycmVudFBhcmVudElkID0gY3VycmVudE5vZGU/LnBhcmVudElkO1xuICAgIGlmIChjdXJyZW50Tm9kZSkge1xuICAgICAgYWxsQW5jZXN0b3JzID0gYWxsQW5jZXN0b3JzLmNvbmNhdChjdXJyZW50Tm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhbGxBbmNlc3RvcnM7XG59IiwiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF0dHJpYnV0ZShuYW1lKSB7XG4gIHJldHVybiBgZGF0YS1iYXNlLXVpLSR7bmFtZX1gO1xufSIsImltcG9ydCB7IE5PT1AgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5sZXQgcmFmSWQgPSAwO1xuZXhwb3J0IGZ1bmN0aW9uIGVucXVldWVGb2N1cyhlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBwcmV2ZW50U2Nyb2xsID0gZmFsc2UsXG4gICAgc3luYyA9IGZhbHNlLFxuICAgIHNob3VsZEZvY3VzXG4gIH0gPSBvcHRpb25zO1xuICBjYW5jZWxBbmltYXRpb25GcmFtZShyYWZJZCk7XG4gIGZ1bmN0aW9uIGV4ZWMoKSB7XG4gICAgaWYgKHNob3VsZEZvY3VzICYmICFzaG91bGRGb2N1cygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVsPy5mb2N1cyh7XG4gICAgICBwcmV2ZW50U2Nyb2xsXG4gICAgfSk7XG4gIH1cbiAgaWYgKHN5bmMpIHtcbiAgICBleGVjKCk7XG4gICAgcmV0dXJuIE5PT1A7XG4gIH1cbiAgY29uc3QgY3VycmVudFJhZklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGV4ZWMpO1xuICByYWZJZCA9IGN1cnJlbnRSYWZJZDtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBpZiAocmFmSWQgPT09IGN1cnJlbnRSYWZJZCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoY3VycmVudFJhZklkKTtcbiAgICAgIHJhZklkID0gMDtcbiAgICB9XG4gIH07XG59IiwiLy8gTW9kaWZpZWQgdG8gYWRkIGNvbmRpdGlvbmFsIGBhcmlhLWhpZGRlbmAgc3VwcG9ydDpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aGVLYXNoZXkvYXJpYS1oaWRkZW4vYmxvYi85MjIwYzhmNGE0ZmQzNWY2M2JlZTU1MTBhOWY0MWEzNzI2NDM4MmQ0L3NyYy9pbmRleC50c1xuaW1wb3J0IHsgZ2V0Tm9kZU5hbWUsIGlzU2hhZG93Um9vdCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmNvbnN0IGNvdW50ZXJzID0ge1xuICBpbmVydDogbmV3IFdlYWtNYXAoKSxcbiAgJ2FyaWEtaGlkZGVuJzogbmV3IFdlYWtNYXAoKVxufTtcbmNvbnN0IG1hcmtlck5hbWUgPSAnZGF0YS1iYXNlLXVpLWluZXJ0JztcbmNvbnN0IHVuY29udHJvbGxlZEVsZW1lbnRzU2V0cyA9IHtcbiAgaW5lcnQ6IG5ldyBXZWFrU2V0KCksXG4gICdhcmlhLWhpZGRlbic6IG5ldyBXZWFrU2V0KClcbn07XG5sZXQgbWFya2VyQ291bnRlck1hcCA9IG5ldyBXZWFrTWFwKCk7XG5sZXQgbG9ja0NvdW50ID0gMDtcbmZ1bmN0aW9uIGdldFVuY29udHJvbGxlZEVsZW1lbnRzU2V0KGNvbnRyb2xBdHRyaWJ1dGUpIHtcbiAgcmV0dXJuIHVuY29udHJvbGxlZEVsZW1lbnRzU2V0c1tjb250cm9sQXR0cmlidXRlXTtcbn1cbmV4cG9ydCBjb25zdCBzdXBwb3J0c0luZXJ0ID0gKCkgPT4gdHlwZW9mIEhUTUxFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAnaW5lcnQnIGluIEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbmZ1bmN0aW9uIHVud3JhcEhvc3Qobm9kZSkge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaXNTaGFkb3dSb290KG5vZGUpID8gbm9kZS5ob3N0IDogdW53cmFwSG9zdChub2RlLnBhcmVudE5vZGUpO1xufVxuY29uc3QgY29ycmVjdEVsZW1lbnRzID0gKHBhcmVudCwgdGFyZ2V0cykgPT4gdGFyZ2V0cy5tYXAodGFyZ2V0ID0+IHtcbiAgaWYgKHBhcmVudC5jb250YWlucyh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICBjb25zdCBjb3JyZWN0ZWRUYXJnZXQgPSB1bndyYXBIb3N0KHRhcmdldCk7XG4gIGlmIChwYXJlbnQuY29udGFpbnMoY29ycmVjdGVkVGFyZ2V0KSkge1xuICAgIHJldHVybiBjb3JyZWN0ZWRUYXJnZXQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59KS5maWx0ZXIoeCA9PiB4ICE9IG51bGwpO1xuY29uc3QgYnVpbGRLZWVwU2V0ID0gdGFyZ2V0cyA9PiB7XG4gIGNvbnN0IGtlZXAgPSBuZXcgU2V0KCk7XG4gIHRhcmdldHMuZm9yRWFjaCh0YXJnZXQgPT4ge1xuICAgIGxldCBub2RlID0gdGFyZ2V0O1xuICAgIHdoaWxlIChub2RlICYmICFrZWVwLmhhcyhub2RlKSkge1xuICAgICAga2VlcC5hZGQobm9kZSk7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBrZWVwO1xufTtcbmNvbnN0IGNvbGxlY3RPdXRzaWRlRWxlbWVudHMgPSAocm9vdCwga2VlcEVsZW1lbnRzLCBzdG9wRWxlbWVudHMpID0+IHtcbiAgY29uc3Qgb3V0c2lkZSA9IFtdO1xuICBjb25zdCB3YWxrID0gcGFyZW50ID0+IHtcbiAgICBpZiAoIXBhcmVudCB8fCBzdG9wRWxlbWVudHMuaGFzKHBhcmVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgQXJyYXkuZnJvbShwYXJlbnQuY2hpbGRyZW4pLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAoZ2V0Tm9kZU5hbWUobm9kZSkgPT09ICdzY3JpcHQnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChrZWVwRWxlbWVudHMuaGFzKG5vZGUpKSB7XG4gICAgICAgIHdhbGsobm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRzaWRlLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBvdXRzaWRlO1xufTtcbmZ1bmN0aW9uIGFwcGx5QXR0cmlidXRlVG9PdGhlcnModW5jb3JyZWN0ZWRBdm9pZEVsZW1lbnRzLCBib2R5LCBhcmlhSGlkZGVuLCBpbmVydCwge1xuICBtYXJrID0gdHJ1ZSxcbiAgbWFya2VySWdub3JlRWxlbWVudHMgPSBbXVxufSkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVzdGVkLXRlcm5hcnlcbiAgY29uc3QgY29udHJvbEF0dHJpYnV0ZSA9IGluZXJ0ID8gJ2luZXJ0JyA6IGFyaWFIaWRkZW4gPyAnYXJpYS1oaWRkZW4nIDogbnVsbDtcbiAgbGV0IGNvdW50ZXJNYXAgPSBudWxsO1xuICBsZXQgdW5jb250cm9sbGVkRWxlbWVudHNTZXQgPSBudWxsO1xuICBjb25zdCBhdm9pZEVsZW1lbnRzID0gY29ycmVjdEVsZW1lbnRzKGJvZHksIHVuY29ycmVjdGVkQXZvaWRFbGVtZW50cyk7XG4gIGNvbnN0IG1hcmtlcklnbm9yZVRhcmdldHMgPSBtYXJrID8gY29ycmVjdEVsZW1lbnRzKGJvZHksIG1hcmtlcklnbm9yZUVsZW1lbnRzKSA6IFtdO1xuICBjb25zdCBtYXJrZXJJZ25vcmVTZXQgPSBuZXcgU2V0KG1hcmtlcklnbm9yZVRhcmdldHMpO1xuICBjb25zdCBtYXJrZXJUYXJnZXRzID0gbWFyayA/IGNvbGxlY3RPdXRzaWRlRWxlbWVudHMoYm9keSwgYnVpbGRLZWVwU2V0KGF2b2lkRWxlbWVudHMpLCBuZXcgU2V0KGF2b2lkRWxlbWVudHMpKS5maWx0ZXIodGFyZ2V0ID0+ICFtYXJrZXJJZ25vcmVTZXQuaGFzKHRhcmdldCkpIDogW107XG4gIGNvbnN0IGhpZGRlbkVsZW1lbnRzID0gW107XG4gIGNvbnN0IG1hcmtlZEVsZW1lbnRzID0gW107XG4gIGlmIChjb250cm9sQXR0cmlidXRlKSB7XG4gICAgY29uc3QgbWFwID0gY291bnRlcnNbY29udHJvbEF0dHJpYnV0ZV07XG4gICAgY29uc3QgY3VycmVudFVuY29udHJvbGxlZEVsZW1lbnRzU2V0ID0gZ2V0VW5jb250cm9sbGVkRWxlbWVudHNTZXQoY29udHJvbEF0dHJpYnV0ZSk7XG4gICAgdW5jb250cm9sbGVkRWxlbWVudHNTZXQgPSBjdXJyZW50VW5jb250cm9sbGVkRWxlbWVudHNTZXQ7XG4gICAgY291bnRlck1hcCA9IG1hcDtcbiAgICBjb25zdCBhcmlhTGl2ZUVsZW1lbnRzID0gY29ycmVjdEVsZW1lbnRzKGJvZHksIEFycmF5LmZyb20oYm9keS5xdWVyeVNlbGVjdG9yQWxsKCdbYXJpYS1saXZlXScpKSk7XG4gICAgY29uc3QgY29udHJvbEVsZW1lbnRzID0gYXZvaWRFbGVtZW50cy5jb25jYXQoYXJpYUxpdmVFbGVtZW50cyk7XG4gICAgY29uc3QgY29udHJvbFRhcmdldHMgPSBjb2xsZWN0T3V0c2lkZUVsZW1lbnRzKGJvZHksIGJ1aWxkS2VlcFNldChjb250cm9sRWxlbWVudHMpLCBuZXcgU2V0KGNvbnRyb2xFbGVtZW50cykpO1xuICAgIGNvbnRyb2xUYXJnZXRzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBhdHRyID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udHJvbEF0dHJpYnV0ZSk7XG4gICAgICBjb25zdCBhbHJlYWR5SGlkZGVuID0gYXR0ciAhPT0gbnVsbCAmJiBhdHRyICE9PSAnZmFsc2UnO1xuICAgICAgY29uc3QgY291bnRlclZhbHVlID0gKG1hcC5nZXQobm9kZSkgfHwgMCkgKyAxO1xuICAgICAgbWFwLnNldChub2RlLCBjb3VudGVyVmFsdWUpO1xuICAgICAgaGlkZGVuRWxlbWVudHMucHVzaChub2RlKTtcbiAgICAgIGlmIChjb3VudGVyVmFsdWUgPT09IDEgJiYgYWxyZWFkeUhpZGRlbikge1xuICAgICAgICBjdXJyZW50VW5jb250cm9sbGVkRWxlbWVudHNTZXQuYWRkKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKCFhbHJlYWR5SGlkZGVuKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGNvbnRyb2xBdHRyaWJ1dGUsIGNvbnRyb2xBdHRyaWJ1dGUgPT09ICdpbmVydCcgPyAnJyA6ICd0cnVlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgaWYgKG1hcmspIHtcbiAgICBtYXJrZXJUYXJnZXRzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBtYXJrZXJWYWx1ZSA9IChtYXJrZXJDb3VudGVyTWFwLmdldChub2RlKSB8fCAwKSArIDE7XG4gICAgICBtYXJrZXJDb3VudGVyTWFwLnNldChub2RlLCBtYXJrZXJWYWx1ZSk7XG4gICAgICBtYXJrZWRFbGVtZW50cy5wdXNoKG5vZGUpO1xuICAgICAgaWYgKG1hcmtlclZhbHVlID09PSAxKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKG1hcmtlck5hbWUsICcnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBsb2NrQ291bnQgKz0gMTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBpZiAoY291bnRlck1hcCkge1xuICAgICAgaGlkZGVuRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudENvdW50ZXJWYWx1ZSA9IGNvdW50ZXJNYXAuZ2V0KGVsZW1lbnQpIHx8IDA7XG4gICAgICAgIGNvbnN0IGNvdW50ZXJWYWx1ZSA9IGN1cnJlbnRDb3VudGVyVmFsdWUgLSAxO1xuICAgICAgICBjb3VudGVyTWFwLnNldChlbGVtZW50LCBjb3VudGVyVmFsdWUpO1xuICAgICAgICBpZiAoIWNvdW50ZXJWYWx1ZSkge1xuICAgICAgICAgIGlmICghdW5jb250cm9sbGVkRWxlbWVudHNTZXQ/LmhhcyhlbGVtZW50KSAmJiBjb250cm9sQXR0cmlidXRlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShjb250cm9sQXR0cmlidXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdW5jb250cm9sbGVkRWxlbWVudHNTZXQ/LmRlbGV0ZShlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChtYXJrKSB7XG4gICAgICBtYXJrZWRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBtYXJrZXJWYWx1ZSA9IChtYXJrZXJDb3VudGVyTWFwLmdldChlbGVtZW50KSB8fCAwKSAtIDE7XG4gICAgICAgIG1hcmtlckNvdW50ZXJNYXAuc2V0KGVsZW1lbnQsIG1hcmtlclZhbHVlKTtcbiAgICAgICAgaWYgKCFtYXJrZXJWYWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG1hcmtlck5hbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgbG9ja0NvdW50IC09IDE7XG4gICAgaWYgKCFsb2NrQ291bnQpIHtcbiAgICAgIGNvdW50ZXJzLmluZXJ0ID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgIGNvdW50ZXJzWydhcmlhLWhpZGRlbiddID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgIHVuY29udHJvbGxlZEVsZW1lbnRzU2V0cy5pbmVydCA9IG5ldyBXZWFrU2V0KCk7XG4gICAgICB1bmNvbnRyb2xsZWRFbGVtZW50c1NldHNbJ2FyaWEtaGlkZGVuJ10gPSBuZXcgV2Vha1NldCgpO1xuICAgICAgbWFya2VyQ291bnRlck1hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgfVxuICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtPdGhlcnMoYXZvaWRFbGVtZW50cywgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBhcmlhSGlkZGVuID0gZmFsc2UsXG4gICAgaW5lcnQgPSBmYWxzZSxcbiAgICBtYXJrID0gdHJ1ZSxcbiAgICBtYXJrZXJJZ25vcmVFbGVtZW50cyA9IFtdXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBib2R5ID0gb3duZXJEb2N1bWVudChhdm9pZEVsZW1lbnRzWzBdKS5ib2R5O1xuICByZXR1cm4gYXBwbHlBdHRyaWJ1dGVUb090aGVycyhhdm9pZEVsZW1lbnRzLCBib2R5LCBhcmlhSGlkZGVuLCBpbmVydCwge1xuICAgIG1hcmssXG4gICAgbWFya2VySWdub3JlRWxlbWVudHNcbiAgfSk7XG59IiwiZXhwb3J0IGNvbnN0IFRZUEVBSEVBRF9SRVNFVF9NUyA9IDUwMDtcbmV4cG9ydCBjb25zdCBQQVRJRU5UX0NMSUNLX1RIUkVTSE9MRCA9IDUwMDtcbmV4cG9ydCBjb25zdCBESVNBQkxFRF9UUkFOU0lUSU9OU19TVFlMRSA9IHtcbiAgc3R5bGU6IHtcbiAgICB0cmFuc2l0aW9uOiAnbm9uZSdcbiAgfVxufTtcbmV4cG9ydCBjb25zdCBDTElDS19UUklHR0VSX0lERU5USUZJRVIgPSAnZGF0YS1iYXNlLXVpLWNsaWNrLXRyaWdnZXInO1xuZXhwb3J0IGNvbnN0IEJBU0VfVUlfU1dJUEVfSUdOT1JFX0FUVFJJQlVURSA9ICdkYXRhLWJhc2UtdWktc3dpcGUtaWdub3JlJztcbmV4cG9ydCBjb25zdCBMRUdBQ1lfU1dJUEVfSUdOT1JFX0FUVFJJQlVURSA9ICdkYXRhLXN3aXBlLWlnbm9yZSc7XG5leHBvcnQgY29uc3QgQkFTRV9VSV9TV0lQRV9JR05PUkVfU0VMRUNUT1IgPSBgWyR7QkFTRV9VSV9TV0lQRV9JR05PUkVfQVRUUklCVVRFfV1gO1xuZXhwb3J0IGNvbnN0IExFR0FDWV9TV0lQRV9JR05PUkVfU0VMRUNUT1IgPSBgWyR7TEVHQUNZX1NXSVBFX0lHTk9SRV9BVFRSSUJVVEV9XWA7XG5cbi8qKlxuICogVXNlZCBmb3IgZHJvcGRvd25zIHRoYXQgdXN1YWxseSBzdHJpY3RseSBwcmVmZXIgdG9wL2JvdHRvbSBwbGFjZW1lbnRzIGFuZFxuICogdXNlIGB2YXIoLS1hdmFpbGFibGUtaGVpZ2h0KWAgdG8gbGltaXQgdGhlaXIgaGVpZ2h0LlxuICovXG5leHBvcnQgY29uc3QgRFJPUERPV05fQ09MTElTSU9OX0FWT0lEQU5DRSA9IHtcbiAgZmFsbGJhY2tBeGlzU2lkZTogJ25vbmUnXG59O1xuXG4vKipcbiAqIFVzZWQgYnkgcmVndWxhciBwb3B1cHMgdGhhdCB1c3VhbGx5IGFyZW4ndCBzY3JvbGxhYmxlIGFuZCBhcmUgYWxsb3dlZCB0b1xuICogZnJlZWx5IGZsaXAgdG8gYW55IGF4aXMgb2YgcGxhY2VtZW50LlxuICovXG5leHBvcnQgY29uc3QgUE9QVVBfQ09MTElTSU9OX0FWT0lEQU5DRSA9IHtcbiAgZmFsbGJhY2tBeGlzU2lkZTogJ2VuZCdcbn07XG5cbi8qKlxuICogU3BlY2lhbCB2aXN1YWxseSBoaWRkZW4gc3R5bGVzIGZvciB0aGUgYXJpYS1vd25zIG93bmVyIGVsZW1lbnQgdG8gZW5zdXJlIG93bmVkIGVsZW1lbnRcbiAqIGFjY2Vzc2liaWxpdHkgaW4gaU9TL1NhZmFyaS9Wb2ljZUNvbnRyb2wuXG4gKiBUaGUgb3duZXIgZWxlbWVudCBpcyBhbiBlbXB0eSBzcGFuLCBzbyBtb3N0IG9mIHRoZSBjb21tb24gdmlzdWFsbHkgaGlkZGVuIHN0eWxlcyBhcmUgbm90IG5lZWRlZC5cbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL2lzc3Vlcy8zNDAzXG4gKi9cbmV4cG9ydCBjb25zdCBvd25lclZpc3VhbGx5SGlkZGVuID0ge1xuICBjbGlwUGF0aDogJ2luc2V0KDUwJSknLFxuICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgdG9wOiAwLFxuICBsZWZ0OiAwXG59OyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7IGlzTm9kZSB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgYWRkRXZlbnRMaXN0ZW5lciB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2FkZEV2ZW50TGlzdGVuZXInO1xuaW1wb3J0IHsgbWVyZ2VDbGVhbnVwcyB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL21lcmdlQ2xlYW51cHMnO1xuaW1wb3J0IHsgdXNlSWQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJZCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBFTVBUWV9PQkpFQ1QgfSBmcm9tICdAYmFzZS11aS91dGlscy9lbXB0eSc7XG5pbXBvcnQgeyBGb2N1c0d1YXJkIH0gZnJvbSBcIi4uLy4uL3V0aWxzL0ZvY3VzR3VhcmQuanNcIjtcbmltcG9ydCB7IGVuYWJsZUZvY3VzSW5zaWRlLCBkaXNhYmxlRm9jdXNJbnNpZGUsIGdldFByZXZpb3VzVGFiYmFibGUsIGdldE5leHRUYWJiYWJsZSwgaXNPdXRzaWRlRXZlbnQgfSBmcm9tIFwiLi4vdXRpbHMvdGFiYmFibGUuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVBdHRyaWJ1dGUgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlQXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBvd25lclZpc3VhbGx5SGlkZGVuIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IGpzeCBhcyBfanN4LCBqc3hzIGFzIF9qc3hzIH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5jb25zdCBQb3J0YWxDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQobnVsbCk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBQb3J0YWxDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJQb3J0YWxDb250ZXh0XCI7XG5leHBvcnQgY29uc3QgdXNlUG9ydGFsQ29udGV4dCA9ICgpID0+IFJlYWN0LnVzZUNvbnRleHQoUG9ydGFsQ29udGV4dCk7XG5jb25zdCBhdHRyID0gY3JlYXRlQXR0cmlidXRlKCdwb3J0YWwnKTtcbmV4cG9ydCBmdW5jdGlvbiB1c2VGbG9hdGluZ1BvcnRhbE5vZGUocHJvcHMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgcmVmLFxuICAgIGNvbnRhaW5lcjogY29udGFpbmVyUHJvcCxcbiAgICBjb21wb25lbnRQcm9wcyA9IEVNUFRZX09CSkVDVCxcbiAgICBlbGVtZW50UHJvcHNcbiAgfSA9IHByb3BzO1xuICBjb25zdCB1bmlxdWVJZCA9IHVzZUlkKCk7XG4gIGNvbnN0IHBvcnRhbENvbnRleHQgPSB1c2VQb3J0YWxDb250ZXh0KCk7XG4gIGNvbnN0IHBhcmVudFBvcnRhbE5vZGUgPSBwb3J0YWxDb250ZXh0Py5wb3J0YWxOb2RlO1xuICBjb25zdCBbY29udGFpbmVyRWxlbWVudCwgc2V0Q29udGFpbmVyRWxlbWVudF0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW3BvcnRhbE5vZGUsIHNldFBvcnRhbE5vZGVdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHNldFBvcnRhbE5vZGVSZWYgPSB1c2VTdGFibGVDYWxsYmFjayhub2RlID0+IHtcbiAgICBpZiAobm9kZSAhPT0gbnVsbCkge1xuICAgICAgLy8gdGhlIHVzZUlzb0xheW91dEVmZmVjdCBiZWxvdyB3YXRjaGluZyBjb250YWluZXJQcm9wIC8gcGFyZW50UG9ydGFsTm9kZVxuICAgICAgLy8gc2V0cyBzZXRQb3J0YWxOb2RlKG51bGwpIHdoZW4gdGhlIGNvbnRhaW5lciBiZWNvbWVzIG51bGwgb3IgY2hhbmdlcy5cbiAgICAgIC8vIFNvIGV2ZW4gdGhvdWdoIHRoZSByZWYgY2FsbGJhY2sgbm93IGlnbm9yZXMgbnVsbCwgdGhlIHBvcnRhbCBub2RlIHN0aWxsIGdldHMgY2xlYXJlZC5cbiAgICAgIHNldFBvcnRhbE5vZGUobm9kZSk7XG4gICAgfVxuICB9KTtcbiAgY29uc3QgY29udGFpbmVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIC8vIFdhaXQgZm9yIHRoZSBjb250YWluZXIgdG8gYmUgcmVzb2x2ZWQgaWYgZXhwbGljaXRseSBgbnVsbGAuXG4gICAgaWYgKGNvbnRhaW5lclByb3AgPT09IG51bGwpIHtcbiAgICAgIGlmIChjb250YWluZXJSZWYuY3VycmVudCkge1xuICAgICAgICBjb250YWluZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgIHNldFBvcnRhbE5vZGUobnVsbCk7XG4gICAgICAgIHNldENvbnRhaW5lckVsZW1lbnQobnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVhY3QgMTcgZG9lcyBub3QgdXNlIFJlYWN0LnVzZUlkKCkuXG4gICAgaWYgKHVuaXF1ZUlkID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRDb250YWluZXIgPSAoY29udGFpbmVyUHJvcCAmJiAoaXNOb2RlKGNvbnRhaW5lclByb3ApID8gY29udGFpbmVyUHJvcCA6IGNvbnRhaW5lclByb3AuY3VycmVudCkpID8/IHBhcmVudFBvcnRhbE5vZGUgPz8gZG9jdW1lbnQuYm9keTtcbiAgICBpZiAocmVzb2x2ZWRDb250YWluZXIgPT0gbnVsbCkge1xuICAgICAgaWYgKGNvbnRhaW5lclJlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnRhaW5lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgc2V0UG9ydGFsTm9kZShudWxsKTtcbiAgICAgICAgc2V0Q29udGFpbmVyRWxlbWVudChudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRhaW5lclJlZi5jdXJyZW50ICE9PSByZXNvbHZlZENvbnRhaW5lcikge1xuICAgICAgY29udGFpbmVyUmVmLmN1cnJlbnQgPSByZXNvbHZlZENvbnRhaW5lcjtcbiAgICAgIHNldFBvcnRhbE5vZGUobnVsbCk7XG4gICAgICBzZXRDb250YWluZXJFbGVtZW50KHJlc29sdmVkQ29udGFpbmVyKTtcbiAgICB9XG4gIH0sIFtjb250YWluZXJQcm9wLCBwYXJlbnRQb3J0YWxOb2RlLCB1bmlxdWVJZF0pO1xuICBjb25zdCBwb3J0YWxFbGVtZW50ID0gdXNlUmVuZGVyRWxlbWVudCgnZGl2JywgY29tcG9uZW50UHJvcHMsIHtcbiAgICByZWY6IFtyZWYsIHNldFBvcnRhbE5vZGVSZWZdLFxuICAgIHByb3BzOiBbe1xuICAgICAgaWQ6IHVuaXF1ZUlkLFxuICAgICAgW2F0dHJdOiAnJ1xuICAgIH0sIGVsZW1lbnRQcm9wc11cbiAgfSk7XG5cbiAgLy8gVGhpcyBgY3JlYXRlUG9ydGFsYCBjYWxsIGluamVjdHMgYHBvcnRhbEVsZW1lbnRgIGludG8gdGhlIGBjb250YWluZXJgLlxuICAvLyBBbm90aGVyIGNhbGwgaW5zaWRlIGBGbG9hdGluZ1BvcnRhbGAvYEZsb2F0aW5nUG9ydGFsTGl0ZWAgdGhlbiBpbmplY3RzIHRoZSBjaGlsZHJlbiBpbnRvIGBwb3J0YWxFbGVtZW50YC5cbiAgY29uc3QgcG9ydGFsU3VidHJlZSA9IGNvbnRhaW5lckVsZW1lbnQgJiYgcG9ydGFsRWxlbWVudCA/IC8qI19fUFVSRV9fKi9SZWFjdERPTS5jcmVhdGVQb3J0YWwocG9ydGFsRWxlbWVudCwgY29udGFpbmVyRWxlbWVudCkgOiBudWxsO1xuICByZXR1cm4ge1xuICAgIHBvcnRhbE5vZGUsXG4gICAgcG9ydGFsU3VidHJlZVxuICB9O1xufVxuXG4vKipcbiAqIFBvcnRhbHMgdGhlIGZsb2F0aW5nIGVsZW1lbnQgaW50byBhIGdpdmVuIGNvbnRhaW5lciBlbGVtZW50IOKAlCBieSBkZWZhdWx0LFxuICogb3V0c2lkZSBvZiB0aGUgYXBwIHJvb3QgYW5kIGludG8gdGhlIGJvZHkuXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBlbnN1cmUgdGhlIGZsb2F0aW5nIGVsZW1lbnQgY2FuIGFwcGVhciBvdXRzaWRlIGFueVxuICogcG90ZW50aWFsIHBhcmVudCBjb250YWluZXJzIHRoYXQgY2F1c2UgY2xpcHBpbmcgKHN1Y2ggYXMgYG92ZXJmbG93OiBoaWRkZW5gKSxcbiAqIHdoaWxlIHJldGFpbmluZyBpdHMgbG9jYXRpb24gaW4gdGhlIFJlYWN0IHRyZWUuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvRmxvYXRpbmdQb3J0YWxcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY29uc3QgRmxvYXRpbmdQb3J0YWwgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBGbG9hdGluZ1BvcnRhbChjb21wb25lbnRQcm9wcywgZm9yd2FyZGVkUmVmKSB7XG4gIGNvbnN0IHtcbiAgICByZW5kZXIsXG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlLFxuICAgIGNoaWxkcmVuLFxuICAgIGNvbnRhaW5lcixcbiAgICByZW5kZXJHdWFyZHMsXG4gICAgLi4uZWxlbWVudFByb3BzXG4gIH0gPSBjb21wb25lbnRQcm9wcztcbiAgY29uc3Qge1xuICAgIHBvcnRhbE5vZGUsXG4gICAgcG9ydGFsU3VidHJlZVxuICB9ID0gdXNlRmxvYXRpbmdQb3J0YWxOb2RlKHtcbiAgICBjb250YWluZXIsXG4gICAgcmVmOiBmb3J3YXJkZWRSZWYsXG4gICAgY29tcG9uZW50UHJvcHMsXG4gICAgZWxlbWVudFByb3BzXG4gIH0pO1xuICBjb25zdCBiZWZvcmVPdXRzaWRlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBhZnRlck91dHNpZGVSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGJlZm9yZUluc2lkZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgYWZ0ZXJJbnNpZGVSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFtmb2N1c01hbmFnZXJTdGF0ZSwgc2V0Rm9jdXNNYW5hZ2VyU3RhdGVdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IGZvY3VzSW5zaWRlRGlzYWJsZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBtb2RhbCA9IGZvY3VzTWFuYWdlclN0YXRlPy5tb2RhbDtcbiAgY29uc3Qgb3BlbiA9IGZvY3VzTWFuYWdlclN0YXRlPy5vcGVuO1xuICBjb25zdCBzaG91bGRSZW5kZXJHdWFyZHMgPSB0eXBlb2YgcmVuZGVyR3VhcmRzID09PSAnYm9vbGVhbicgPyByZW5kZXJHdWFyZHMgOiAhIWZvY3VzTWFuYWdlclN0YXRlICYmICFmb2N1c01hbmFnZXJTdGF0ZS5tb2RhbCAmJiBmb2N1c01hbmFnZXJTdGF0ZS5vcGVuICYmICEhcG9ydGFsTm9kZTtcblxuICAvLyBodHRwczovL2NvZGVzYW5kYm94LmlvL3MvdGFiYmFibGUtcG9ydGFsLWY0dG5nP2ZpbGU9L3NyYy9UYWJiYWJsZVBvcnRhbC50c3hcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXBvcnRhbE5vZGUgfHwgbW9kYWwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIGVsZW1lbnRzIGluc2lkZSB0aGUgcG9ydGFsIGVsZW1lbnQgYXJlIHRhYmJhYmxlIG9ubHkgd2hlbiB0aGVcbiAgICAvLyBwb3J0YWwgaGFzIGFscmVhZHkgYmVlbiBmb2N1c2VkLCBlaXRoZXIgYnkgdGFiYmluZyBpbnRvIGEgZm9jdXMgdHJhcFxuICAgIC8vIGVsZW1lbnQgb3V0c2lkZSBvciB1c2luZyB0aGUgbW91c2UuXG4gICAgZnVuY3Rpb24gb25Gb2N1cyhldmVudCkge1xuICAgICAgaWYgKHBvcnRhbE5vZGUgJiYgZXZlbnQucmVsYXRlZFRhcmdldCAmJiBpc091dHNpZGVFdmVudChldmVudCkpIHtcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdmb2N1c2luJykge1xuICAgICAgICAgIGlmIChmb2N1c0luc2lkZURpc2FibGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGVuYWJsZUZvY3VzSW5zaWRlKHBvcnRhbE5vZGUpO1xuICAgICAgICAgICAgZm9jdXNJbnNpZGVEaXNhYmxlZFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpc2FibGVGb2N1c0luc2lkZShwb3J0YWxOb2RlKTtcbiAgICAgICAgICBmb2N1c0luc2lkZURpc2FibGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGlzdGVuIHRvIHRoZSBldmVudCBvbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB0aGV5IHJ1biBiZWZvcmUgdGhlIGZvY3VzXG4gICAgLy8gdHJhcCBlbGVtZW50cyBvbkZvY3VzIHByb3AgaXMgY2FsbGVkLlxuICAgIHJldHVybiBtZXJnZUNsZWFudXBzKGFkZEV2ZW50TGlzdGVuZXIocG9ydGFsTm9kZSwgJ2ZvY3VzaW4nLCBvbkZvY3VzLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihwb3J0YWxOb2RlLCAnZm9jdXNvdXQnLCBvbkZvY3VzLCB0cnVlKSk7XG4gIH0sIFtwb3J0YWxOb2RlLCBtb2RhbF0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcG9ydGFsTm9kZSB8fCBvcGVuICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmFibGVGb2N1c0luc2lkZShwb3J0YWxOb2RlKTtcbiAgICBmb2N1c0luc2lkZURpc2FibGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgfSwgW29wZW4sIHBvcnRhbE5vZGVdKTtcbiAgY29uc3QgcG9ydGFsQ29udGV4dFZhbHVlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIGJlZm9yZU91dHNpZGVSZWYsXG4gICAgYWZ0ZXJPdXRzaWRlUmVmLFxuICAgIGJlZm9yZUluc2lkZVJlZixcbiAgICBhZnRlckluc2lkZVJlZixcbiAgICBwb3J0YWxOb2RlLFxuICAgIHNldEZvY3VzTWFuYWdlclN0YXRlXG4gIH0pLCBbcG9ydGFsTm9kZV0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL19qc3hzKFJlYWN0LkZyYWdtZW50LCB7XG4gICAgY2hpbGRyZW46IFtwb3J0YWxTdWJ0cmVlLCAvKiNfX1BVUkVfXyovX2pzeHMoUG9ydGFsQ29udGV4dC5Qcm92aWRlciwge1xuICAgICAgdmFsdWU6IHBvcnRhbENvbnRleHRWYWx1ZSxcbiAgICAgIGNoaWxkcmVuOiBbc2hvdWxkUmVuZGVyR3VhcmRzICYmIHBvcnRhbE5vZGUgJiYgLyojX19QVVJFX18qL19qc3goRm9jdXNHdWFyZCwge1xuICAgICAgICBcImRhdGEtdHlwZVwiOiBcIm91dHNpZGVcIixcbiAgICAgICAgcmVmOiBiZWZvcmVPdXRzaWRlUmVmLFxuICAgICAgICBvbkZvY3VzOiBldmVudCA9PiB7XG4gICAgICAgICAgaWYgKGlzT3V0c2lkZUV2ZW50KGV2ZW50LCBwb3J0YWxOb2RlKSkge1xuICAgICAgICAgICAgYmVmb3JlSW5zaWRlUmVmLmN1cnJlbnQ/LmZvY3VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRvbVJlZmVyZW5jZSA9IGZvY3VzTWFuYWdlclN0YXRlID8gZm9jdXNNYW5hZ2VyU3RhdGUuZG9tUmVmZXJlbmNlIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHByZXZUYWJiYWJsZSA9IGdldFByZXZpb3VzVGFiYmFibGUoZG9tUmVmZXJlbmNlKTtcbiAgICAgICAgICAgIHByZXZUYWJiYWJsZT8uZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLCBzaG91bGRSZW5kZXJHdWFyZHMgJiYgcG9ydGFsTm9kZSAmJiAvKiNfX1BVUkVfXyovX2pzeChcInNwYW5cIiwge1xuICAgICAgICBcImFyaWEtb3duc1wiOiBwb3J0YWxOb2RlLmlkLFxuICAgICAgICBzdHlsZTogb3duZXJWaXN1YWxseUhpZGRlblxuICAgICAgfSksIHBvcnRhbE5vZGUgJiYgLyojX19QVVJFX18qL1JlYWN0RE9NLmNyZWF0ZVBvcnRhbChjaGlsZHJlbiwgcG9ydGFsTm9kZSksIHNob3VsZFJlbmRlckd1YXJkcyAmJiBwb3J0YWxOb2RlICYmIC8qI19fUFVSRV9fKi9fanN4KEZvY3VzR3VhcmQsIHtcbiAgICAgICAgXCJkYXRhLXR5cGVcIjogXCJvdXRzaWRlXCIsXG4gICAgICAgIHJlZjogYWZ0ZXJPdXRzaWRlUmVmLFxuICAgICAgICBvbkZvY3VzOiBldmVudCA9PiB7XG4gICAgICAgICAgaWYgKGlzT3V0c2lkZUV2ZW50KGV2ZW50LCBwb3J0YWxOb2RlKSkge1xuICAgICAgICAgICAgYWZ0ZXJJbnNpZGVSZWYuY3VycmVudD8uZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZG9tUmVmZXJlbmNlID0gZm9jdXNNYW5hZ2VyU3RhdGUgPyBmb2N1c01hbmFnZXJTdGF0ZS5kb21SZWZlcmVuY2UgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgbmV4dFRhYmJhYmxlID0gZ2V0TmV4dFRhYmJhYmxlKGRvbVJlZmVyZW5jZSk7XG4gICAgICAgICAgICBuZXh0VGFiYmFibGU/LmZvY3VzKCk7XG4gICAgICAgICAgICBpZiAoZm9jdXNNYW5hZ2VyU3RhdGU/LmNsb3NlT25Gb2N1c091dCkge1xuICAgICAgICAgICAgICBmb2N1c01hbmFnZXJTdGF0ZT8ub25PcGVuQ2hhbmdlKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5mb2N1c091dCwgZXZlbnQubmF0aXZlRXZlbnQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXVxuICAgIH0pXVxuICB9KTtcbn0pO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgRmxvYXRpbmdQb3J0YWwuZGlzcGxheU5hbWUgPSBcIkZsb2F0aW5nUG9ydGFsXCI7IiwiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUV2ZW50RW1pdHRlcigpIHtcbiAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICByZXR1cm4ge1xuICAgIGVtaXQoZXZlbnQsIGRhdGEpIHtcbiAgICAgIG1hcC5nZXQoZXZlbnQpPy5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKGRhdGEpKTtcbiAgICB9LFxuICAgIG9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgaWYgKCFtYXAuaGFzKGV2ZW50KSkge1xuICAgICAgICBtYXAuc2V0KGV2ZW50LCBuZXcgU2V0KCkpO1xuICAgICAgfVxuICAgICAgbWFwLmdldChldmVudCkuYWRkKGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgIG1hcC5nZXQoZXZlbnQpPy5kZWxldGUobGlzdGVuZXIpO1xuICAgIH1cbiAgfTtcbn0iLCJpbXBvcnQgeyBjcmVhdGVFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlRXZlbnRFbWl0dGVyLmpzXCI7XG5cbi8qKlxuICogU3RvcmVzIGFuZCBtYW5hZ2VzIGZsb2F0aW5nIGVsZW1lbnRzIGluIGEgdHJlZSBzdHJ1Y3R1cmUuXG4gKiBUaGlzIGlzIGEgYmFja2luZyBzdG9yZSBmb3IgdGhlIGBGbG9hdGluZ1RyZWVgIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIEZsb2F0aW5nVHJlZVN0b3JlIHtcbiAgbm9kZXNSZWYgPSB7XG4gICAgY3VycmVudDogW11cbiAgfTtcbiAgZXZlbnRzID0gY3JlYXRlRXZlbnRFbWl0dGVyKCk7XG4gIGFkZE5vZGUobm9kZSkge1xuICAgIHRoaXMubm9kZXNSZWYuY3VycmVudC5wdXNoKG5vZGUpO1xuICB9XG4gIHJlbW92ZU5vZGUobm9kZSkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ub2Rlc1JlZi5jdXJyZW50LmZpbmRJbmRleChuID0+IG4gPT09IG5vZGUpO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMubm9kZXNSZWYuY3VycmVudC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlSWQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJZCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlUmVmV2l0aEluaXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VSZWZXaXRoSW5pdCc7XG5pbXBvcnQgeyBGbG9hdGluZ1RyZWVTdG9yZSB9IGZyb20gXCIuL0Zsb2F0aW5nVHJlZVN0b3JlLmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuY29uc3QgRmxvYXRpbmdOb2RlQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KG51bGwpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgRmxvYXRpbmdOb2RlQ29udGV4dC5kaXNwbGF5TmFtZSA9IFwiRmxvYXRpbmdOb2RlQ29udGV4dFwiO1xuY29uc3QgRmxvYXRpbmdUcmVlQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KG51bGwpO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHBhcmVudCBub2RlIGlkIGZvciBuZXN0ZWQgZmxvYXRpbmcgZWxlbWVudHMsIGlmIGF2YWlsYWJsZS5cbiAqIFJldHVybnMgYG51bGxgIGZvciB0b3AtbGV2ZWwgZmxvYXRpbmcgZWxlbWVudHMuXG4gKi9cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIEZsb2F0aW5nVHJlZUNvbnRleHQuZGlzcGxheU5hbWUgPSBcIkZsb2F0aW5nVHJlZUNvbnRleHRcIjtcbmV4cG9ydCBjb25zdCB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCA9ICgpID0+IFJlYWN0LnVzZUNvbnRleHQoRmxvYXRpbmdOb2RlQ29udGV4dCk/LmlkIHx8IG51bGw7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbmVhcmVzdCBmbG9hdGluZyB0cmVlIGNvbnRleHQsIGlmIGF2YWlsYWJsZS5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZUZsb2F0aW5nVHJlZSA9IGV4dGVybmFsVHJlZSA9PiB7XG4gIGNvbnN0IGNvbnRleHRUcmVlID0gUmVhY3QudXNlQ29udGV4dChGbG9hdGluZ1RyZWVDb250ZXh0KTtcbiAgcmV0dXJuIGV4dGVybmFsVHJlZSA/PyBjb250ZXh0VHJlZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbm9kZSBpbnRvIHRoZSBgRmxvYXRpbmdUcmVlYCwgcmV0dXJuaW5nIGl0cyBpZC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9GbG9hdGluZ1RyZWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUZsb2F0aW5nTm9kZUlkKGV4dGVybmFsVHJlZSkge1xuICBjb25zdCBpZCA9IHVzZUlkKCk7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoZXh0ZXJuYWxUcmVlKTtcbiAgY29uc3QgcGFyZW50SWQgPSB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCgpO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSB7XG4gICAgICBpZCxcbiAgICAgIHBhcmVudElkXG4gICAgfTtcbiAgICB0cmVlPy5hZGROb2RlKG5vZGUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB0cmVlPy5yZW1vdmVOb2RlKG5vZGUpO1xuICAgIH07XG4gIH0sIFt0cmVlLCBpZCwgcGFyZW50SWRdKTtcbiAgcmV0dXJuIGlkO1xufVxuLyoqXG4gKiBQcm92aWRlcyBwYXJlbnQgbm9kZSBjb250ZXh0IGZvciBuZXN0ZWQgZmxvYXRpbmcgZWxlbWVudHMuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvRmxvYXRpbmdUcmVlXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZsb2F0aW5nTm9kZShwcm9wcykge1xuICBjb25zdCB7XG4gICAgY2hpbGRyZW4sXG4gICAgaWRcbiAgfSA9IHByb3BzO1xuICBjb25zdCBwYXJlbnRJZCA9IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkKCk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChGbG9hdGluZ05vZGVDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICAgIGlkLFxuICAgICAgcGFyZW50SWRcbiAgICB9KSwgW2lkLCBwYXJlbnRJZF0pLFxuICAgIGNoaWxkcmVuOiBjaGlsZHJlblxuICB9KTtcbn1cbi8qKlxuICogUHJvdmlkZXMgY29udGV4dCBmb3IgbmVzdGVkIGZsb2F0aW5nIGVsZW1lbnRzIHdoZW4gdGhleSBhcmUgbm90IGNoaWxkcmVuIG9mXG4gKiBlYWNoIG90aGVyIG9uIHRoZSBET00uXG4gKiBUaGlzIGlzIG5vdCBuZWNlc3NhcnkgaW4gYWxsIGNhc2VzLCBleGNlcHQgd2hlbiB0aGVyZSBtdXN0IGJlIGV4cGxpY2l0IGNvbW11bmljYXRpb24gYmV0d2VlbiBwYXJlbnQgYW5kIGNoaWxkIGZsb2F0aW5nIGVsZW1lbnRzLiBJdCBpcyBuZWNlc3NhcnkgZm9yOlxuICogLSBUaGUgYGJ1YmJsZXNgIG9wdGlvbiBpbiB0aGUgYHVzZURpc21pc3MoKWAgSG9va1xuICogLSBOZXN0ZWQgdmlydHVhbCBsaXN0IG5hdmlnYXRpb25cbiAqIC0gTmVzdGVkIGZsb2F0aW5nIGVsZW1lbnRzIHRoYXQgZWFjaCBvcGVuIG9uIGhvdmVyXG4gKiAtIEN1c3RvbSBjb21tdW5pY2F0aW9uIGJldHdlZW4gcGFyZW50IGFuZCBjaGlsZCBmbG9hdGluZyBlbGVtZW50c1xuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL0Zsb2F0aW5nVHJlZVxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGbG9hdGluZ1RyZWUocHJvcHMpIHtcbiAgY29uc3Qge1xuICAgIGNoaWxkcmVuLFxuICAgIGV4dGVybmFsVHJlZVxuICB9ID0gcHJvcHM7XG4gIGNvbnN0IHRyZWUgPSB1c2VSZWZXaXRoSW5pdCgoKSA9PiBleHRlcm5hbFRyZWUgPz8gbmV3IEZsb2F0aW5nVHJlZVN0b3JlKCkpLmN1cnJlbnQ7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChGbG9hdGluZ1RyZWVDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHRyZWUsXG4gICAgY2hpbGRyZW46IGNoaWxkcmVuXG4gIH0pO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgZ2V0Tm9kZU5hbWUsIGlzSFRNTEVsZW1lbnQgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcbmltcG9ydCB7IGFkZEV2ZW50TGlzdGVuZXIgfSBmcm9tICdAYmFzZS11aS91dGlscy9hZGRFdmVudExpc3RlbmVyJztcbmltcG9ydCB7IG1lcmdlQ2xlYW51cHMgfSBmcm9tICdAYmFzZS11aS91dGlscy9tZXJnZUNsZWFudXBzJztcbmltcG9ydCB7IHVzZU1lcmdlZFJlZnMgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VNZXJnZWRSZWZzJztcbmltcG9ydCB7IHVzZVZhbHVlQXNSZWYgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VWYWx1ZUFzUmVmJztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IHVzZVRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IGlzV2ViS2l0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZGV0ZWN0QnJvd3Nlcic7XG5pbXBvcnQgeyB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUFuaW1hdGlvbkZyYW1lJztcbmltcG9ydCB7IG93bmVyRG9jdW1lbnQsIG93bmVyV2luZG93IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgRm9jdXNHdWFyZCB9IGZyb20gXCIuLi8uLi91dGlscy9Gb2N1c0d1YXJkLmpzXCI7XG5pbXBvcnQgeyBhY3RpdmVFbGVtZW50LCBjb250YWlucywgZ2V0VGFyZ2V0LCBpc1R5cGVhYmxlQ29tYm9ib3gsIGdldEZsb2F0aW5nRm9jdXNFbGVtZW50LCBpc1R5cGVhYmxlRWxlbWVudCB9IGZyb20gXCIuLi91dGlscy9lbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBpc1ZpcnR1YWxDbGljaywgaXNWaXJ0dWFsUG9pbnRlckV2ZW50LCBzdG9wRXZlbnQgfSBmcm9tIFwiLi4vdXRpbHMvZXZlbnQuanNcIjtcbmltcG9ydCB7IHRhYmJhYmxlLCBmb2N1c2FibGUsIGlzT3V0c2lkZUV2ZW50LCBpc1RhYmJhYmxlLCBnZXROZXh0VGFiYmFibGUsIGdldFByZXZpb3VzVGFiYmFibGUgfSBmcm9tIFwiLi4vdXRpbHMvdGFiYmFibGUuanNcIjtcbmltcG9ydCB7IGdldE5vZGVBbmNlc3RvcnMsIGdldE5vZGVDaGlsZHJlbiB9IGZyb20gXCIuLi91dGlscy9ub2Rlcy5qc1wiO1xuaW1wb3J0IHsgaXNFbGVtZW50VmlzaWJsZSB9IGZyb20gXCIuLi91dGlscy9jb21wb3NpdGUuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvY3JlYXRlQmFzZVVJRXZlbnREZXRhaWxzLmpzXCI7XG5pbXBvcnQgeyBSRUFTT05TIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9yZWFzb25zLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVBdHRyaWJ1dGUgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlQXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyBlbnF1ZXVlRm9jdXMgfSBmcm9tIFwiLi4vdXRpbHMvZW5xdWV1ZUZvY3VzLmpzXCI7XG5pbXBvcnQgeyBtYXJrT3RoZXJzIH0gZnJvbSBcIi4uL3V0aWxzL21hcmtPdGhlcnMuanNcIjtcbmltcG9ydCB7IHVzZVBvcnRhbENvbnRleHQgfSBmcm9tIFwiLi9GbG9hdGluZ1BvcnRhbC5qc1wiO1xuaW1wb3J0IHsgdXNlRmxvYXRpbmdUcmVlIH0gZnJvbSBcIi4vRmxvYXRpbmdUcmVlLmpzXCI7XG5pbXBvcnQgeyBDTElDS19UUklHR0VSX0lERU5USUZJRVIgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NvbnN0YW50cy5qc1wiO1xuaW1wb3J0IHsgcmVzb2x2ZVJlZiB9IGZyb20gXCIuLi8uLi91dGlscy9yZXNvbHZlUmVmLmpzXCI7XG5pbXBvcnQgeyBqc3ggYXMgX2pzeCwganN4cyBhcyBfanN4cyB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xuZnVuY3Rpb24gZ2V0RXZlbnRUeXBlKGV2ZW50LCBsYXN0SW50ZXJhY3Rpb25UeXBlKSB7XG4gIGNvbnN0IHdpbiA9IG93bmVyV2luZG93KGdldFRhcmdldChldmVudCkpO1xuICBpZiAoZXZlbnQgaW5zdGFuY2VvZiB3aW4uS2V5Ym9hcmRFdmVudCkge1xuICAgIHJldHVybiAna2V5Ym9hcmQnO1xuICB9XG4gIGlmIChldmVudCBpbnN0YW5jZW9mIHdpbi5Gb2N1c0V2ZW50KSB7XG4gICAgLy8gRm9jdXMgZXZlbnRzIGNhbiBiZSBjYXVzZWQgYnkgYSBwcmVjZWRpbmcgcG9pbnRlciBpbnRlcmFjdGlvbiAoZS5nLiwgZm9jdXNvdXQgb24gb3V0c2lkZSBwcmVzcykuXG4gICAgLy8gUHJlZmVyIHRoZSBsYXN0IGtub3duIHBvaW50ZXIgdHlwZSBpZiBwcm92aWRlZCwgZWxzZSB0cmVhdCBhcyBrZXlib2FyZC5cbiAgICByZXR1cm4gbGFzdEludGVyYWN0aW9uVHlwZSB8fCAna2V5Ym9hcmQnO1xuICB9XG4gIGlmICgncG9pbnRlclR5cGUnIGluIGV2ZW50KSB7XG4gICAgcmV0dXJuIGV2ZW50LnBvaW50ZXJUeXBlIHx8ICdrZXlib2FyZCc7XG4gIH1cbiAgaWYgKCd0b3VjaGVzJyBpbiBldmVudCkge1xuICAgIHJldHVybiAndG91Y2gnO1xuICB9XG4gIGlmIChldmVudCBpbnN0YW5jZW9mIHdpbi5Nb3VzZUV2ZW50KSB7XG4gICAgLy8gb25DbGljayBldmVudHMgbWF5IG5vdCBjb250YWluIHBvaW50ZXIgZXZlbnRzLCBhbmQgd2lsbCBmYWxsIHRocm91Z2ggdG8gaGVyZVxuICAgIHJldHVybiBsYXN0SW50ZXJhY3Rpb25UeXBlIHx8IChldmVudC5kZXRhaWwgPT09IDAgPyAna2V5Ym9hcmQnIDogJ21vdXNlJyk7XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuY29uc3QgTElTVF9MSU1JVCA9IDIwO1xubGV0IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudHMgPSBbXTtcbmZ1bmN0aW9uIGNsZWFyRGlzY29ubmVjdGVkUHJldmlvdXNseUZvY3VzZWRFbGVtZW50cygpIHtcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50cyA9IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudHMuZmlsdGVyKGVudHJ5ID0+IHtcbiAgICByZXR1cm4gZW50cnkuZGVyZWYoKT8uaXNDb25uZWN0ZWQ7XG4gIH0pO1xufVxuZnVuY3Rpb24gYWRkUHJldmlvdXNseUZvY3VzZWRFbGVtZW50KGVsZW1lbnQpIHtcbiAgY2xlYXJEaXNjb25uZWN0ZWRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzKCk7XG4gIGlmIChlbGVtZW50ICYmIGdldE5vZGVOYW1lKGVsZW1lbnQpICE9PSAnYm9keScpIHtcbiAgICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzLnB1c2gobmV3IFdlYWtSZWYoZWxlbWVudCkpO1xuICAgIGlmIChwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzLmxlbmd0aCA+IExJU1RfTElNSVQpIHtcbiAgICAgIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudHMgPSBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzLnNsaWNlKC1MSVNUX0xJTUlUKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGdldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCgpIHtcbiAgY2xlYXJEaXNjb25uZWN0ZWRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzKCk7XG4gIHJldHVybiBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRzW3ByZXZpb3VzbHlGb2N1c2VkRWxlbWVudHMubGVuZ3RoIC0gMV0/LmRlcmVmKCk7XG59XG5mdW5jdGlvbiBnZXRGaXJzdFRhYmJhYmxlRWxlbWVudChjb250YWluZXIpIHtcbiAgaWYgKCFjb250YWluZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoaXNUYWJiYWJsZShjb250YWluZXIpKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfVxuICByZXR1cm4gdGFiYmFibGUoY29udGFpbmVyKVswXSB8fCBjb250YWluZXI7XG59XG5mdW5jdGlvbiBoYW5kbGVUYWJJbmRleChmbG9hdGluZ0ZvY3VzRWxlbWVudCwgb3JkZXJSZWYpIHtcbiAgaWYgKGZsb2F0aW5nRm9jdXNFbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSAmJiAhZmxvYXRpbmdGb2N1c0VsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLXRhYmluZGV4JykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFvcmRlclJlZi5jdXJyZW50LmluY2x1ZGVzKCdmbG9hdGluZycpICYmICFmbG9hdGluZ0ZvY3VzRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKT8uaW5jbHVkZXMoJ2RpYWxvZycpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGZvY3VzYWJsZUVsZW1lbnRzID0gZm9jdXNhYmxlKGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgY29uc3QgdGFiYmFibGVDb250ZW50ID0gZm9jdXNhYmxlRWxlbWVudHMuZmlsdGVyKGVsZW1lbnQgPT4ge1xuICAgIGNvbnN0IGRhdGFUYWJJbmRleCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRhYmluZGV4JykgfHwgJyc7XG4gICAgcmV0dXJuIGlzVGFiYmFibGUoZWxlbWVudCkgfHwgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2RhdGEtdGFiaW5kZXgnKSAmJiAhZGF0YVRhYkluZGV4LnN0YXJ0c1dpdGgoJy0nKTtcbiAgfSk7XG4gIGNvbnN0IHRhYkluZGV4ID0gZmxvYXRpbmdGb2N1c0VsZW1lbnQuZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICBpZiAob3JkZXJSZWYuY3VycmVudC5pbmNsdWRlcygnZmxvYXRpbmcnKSB8fCB0YWJiYWJsZUNvbnRlbnQubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKHRhYkluZGV4ICE9PSAnMCcpIHtcbiAgICAgIGZsb2F0aW5nRm9jdXNFbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0YWJJbmRleCAhPT0gJy0xJyB8fCBmbG9hdGluZ0ZvY3VzRWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2RhdGEtdGFiaW5kZXgnKSAmJiBmbG9hdGluZ0ZvY3VzRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFiaW5kZXgnKSAhPT0gJy0xJykge1xuICAgIGZsb2F0aW5nRm9jdXNFbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICBmbG9hdGluZ0ZvY3VzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGFiaW5kZXgnLCAnLTEnKTtcbiAgfVxufVxuLyoqXG4gKiBQcm92aWRlcyBmb2N1cyBtYW5hZ2VtZW50IGZvciB0aGUgZmxvYXRpbmcgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9GbG9hdGluZ0ZvY3VzTWFuYWdlclxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGbG9hdGluZ0ZvY3VzTWFuYWdlcihwcm9wcykge1xuICBjb25zdCB7XG4gICAgY29udGV4dCxcbiAgICBjaGlsZHJlbixcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIGluaXRpYWxGb2N1cyA9IHRydWUsXG4gICAgcmV0dXJuRm9jdXMgPSB0cnVlLFxuICAgIHJlc3RvcmVGb2N1cyA9IGZhbHNlLFxuICAgIG1vZGFsID0gdHJ1ZSxcbiAgICBjbG9zZU9uRm9jdXNPdXQgPSB0cnVlLFxuICAgIG9wZW5JbnRlcmFjdGlvblR5cGUgPSAnJyxcbiAgICBuZXh0Rm9jdXNhYmxlRWxlbWVudCxcbiAgICBwcmV2aW91c0ZvY3VzYWJsZUVsZW1lbnQsXG4gICAgYmVmb3JlQ29udGVudEZvY3VzR3VhcmRSZWYsXG4gICAgZXh0ZXJuYWxUcmVlLFxuICAgIGdldEluc2lkZUVsZW1lbnRzXG4gIH0gPSBwcm9wcztcbiAgY29uc3Qgc3RvcmUgPSAncm9vdFN0b3JlJyBpbiBjb250ZXh0ID8gY29udGV4dC5yb290U3RvcmUgOiBjb250ZXh0O1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgZG9tUmVmZXJlbmNlID0gc3RvcmUudXNlU3RhdGUoJ2RvbVJlZmVyZW5jZUVsZW1lbnQnKTtcbiAgY29uc3QgZmxvYXRpbmcgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdFbGVtZW50Jyk7XG4gIGNvbnN0IHtcbiAgICBldmVudHMsXG4gICAgZGF0YVJlZlxuICB9ID0gc3RvcmUuY29udGV4dDtcbiAgY29uc3QgZ2V0Tm9kZUlkID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4gZGF0YVJlZi5jdXJyZW50LmZsb2F0aW5nQ29udGV4dD8ubm9kZUlkKTtcbiAgY29uc3QgaWdub3JlSW5pdGlhbEZvY3VzID0gaW5pdGlhbEZvY3VzID09PSBmYWxzZTtcbiAgLy8gSWYgdGhlIHJlZmVyZW5jZSBpcyBhIGNvbWJvYm94IGFuZCBpcyB0eXBlYWJsZSAoZS5nLiBpbnB1dC90ZXh0YXJlYSksXG4gIC8vIHRoZXJlIGFyZSBkaWZmZXJlbnQgZm9jdXMgc2VtYW50aWNzLiBUaGUgZ3VhcmRzIHNob3VsZCBub3QgYmUgcmVuZGVyZWQsIGJ1dFxuICAvLyBhcmlhLWhpZGRlbiBzaG91bGQgYmUgYXBwbGllZCB0byBhbGwgbm9kZXMgc3RpbGwuIEZ1cnRoZXIsIHRoZSB2aXN1YWxseVxuICAvLyBoaWRkZW4gZGlzbWlzcyBidXR0b24gc2hvdWxkIG9ubHkgYXBwZWFyIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QsIG5vdCB0aGVcbiAgLy8gc3RhcnQuXG4gIGNvbnN0IGlzVW50cmFwcGVkVHlwZWFibGVDb21ib2JveCA9IGlzVHlwZWFibGVDb21ib2JveChkb21SZWZlcmVuY2UpICYmIGlnbm9yZUluaXRpYWxGb2N1cztcbiAgY29uc3Qgb3JkZXJSZWYgPSBSZWFjdC51c2VSZWYoWydjb250ZW50J10pO1xuICBjb25zdCBpbml0aWFsRm9jdXNSZWYgPSB1c2VWYWx1ZUFzUmVmKGluaXRpYWxGb2N1cyk7XG4gIGNvbnN0IHJldHVybkZvY3VzUmVmID0gdXNlVmFsdWVBc1JlZihyZXR1cm5Gb2N1cyk7XG4gIGNvbnN0IG9wZW5JbnRlcmFjdGlvblR5cGVSZWYgPSB1c2VWYWx1ZUFzUmVmKG9wZW5JbnRlcmFjdGlvblR5cGUpO1xuICBjb25zdCB0cmVlID0gdXNlRmxvYXRpbmdUcmVlKGV4dGVybmFsVHJlZSk7XG4gIGNvbnN0IHBvcnRhbENvbnRleHQgPSB1c2VQb3J0YWxDb250ZXh0KCk7XG4gIGNvbnN0IHByZXZlbnRSZXR1cm5Gb2N1c1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGlzUG9pbnRlckRvd25SZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBwb2ludGVyRG93bk91dHNpZGVSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBsYXN0Rm9jdXNlZFRhYmJhYmxlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBjbG9zZVR5cGVSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBsYXN0SW50ZXJhY3Rpb25UeXBlUmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3QgYmVmb3JlR3VhcmRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGFmdGVyR3VhcmRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IG1lcmdlZEJlZm9yZUd1YXJkUmVmID0gdXNlTWVyZ2VkUmVmcyhiZWZvcmVHdWFyZFJlZiwgYmVmb3JlQ29udGVudEZvY3VzR3VhcmRSZWYsIHBvcnRhbENvbnRleHQ/LmJlZm9yZUluc2lkZVJlZik7XG4gIGNvbnN0IG1lcmdlZEFmdGVyR3VhcmRSZWYgPSB1c2VNZXJnZWRSZWZzKGFmdGVyR3VhcmRSZWYsIHBvcnRhbENvbnRleHQ/LmFmdGVySW5zaWRlUmVmKTtcbiAgY29uc3QgYmx1clRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIGNvbnN0IHBvaW50ZXJEb3duVGltZW91dCA9IHVzZVRpbWVvdXQoKTtcbiAgY29uc3QgcmVzdG9yZUZvY3VzRnJhbWUgPSB1c2VBbmltYXRpb25GcmFtZSgpO1xuICBjb25zdCBpc0luc2lkZVBvcnRhbCA9IHBvcnRhbENvbnRleHQgIT0gbnVsbDtcbiAgY29uc3QgZmxvYXRpbmdGb2N1c0VsZW1lbnQgPSBnZXRGbG9hdGluZ0ZvY3VzRWxlbWVudChmbG9hdGluZyk7XG4gIGNvbnN0IGdldFRhYmJhYmxlQ29udGVudCA9IHVzZVN0YWJsZUNhbGxiYWNrKChjb250YWluZXIgPSBmbG9hdGluZ0ZvY3VzRWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBjb250YWluZXIgPyB0YWJiYWJsZShjb250YWluZXIpIDogW107XG4gIH0pO1xuICBjb25zdCBnZXRSZXNvbHZlZEluc2lkZUVsZW1lbnRzID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4gZ2V0SW5zaWRlRWxlbWVudHM/LigpLmZpbHRlcihlbGVtZW50ID0+IGVsZW1lbnQgIT0gbnVsbCkgPz8gW10pO1xuXG4gIC8vIFByZXZlbnQgVGFiIGZyb20gZXNjYXBpbmcgdGhlIG1vZGFsIHdoZW4gdGhlcmUgYXJlIG5vIHRhYmJhYmxlIGVsZW1lbnRzLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCAhbW9kYWwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uS2V5RG93bihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ1RhYicpIHtcbiAgICAgICAgLy8gVGhlIGZvY3VzIGd1YXJkcyBoYXZlIG5vdGhpbmcgdG8gZm9jdXMsIHNvIHdlIG5lZWQgdG8gc3RvcCB0aGUgZXZlbnQuXG4gICAgICAgIGlmIChjb250YWlucyhmbG9hdGluZ0ZvY3VzRWxlbWVudCwgYWN0aXZlRWxlbWVudChvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KSkpICYmIGdldFRhYmJhYmxlQ29udGVudCgpLmxlbmd0aCA9PT0gMCAmJiAhaXNVbnRyYXBwZWRUeXBlYWJsZUNvbWJvYm94KSB7XG4gICAgICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgICByZXR1cm4gYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdrZXlkb3duJywgb25LZXlEb3duKTtcbiAgfSwgW2Rpc2FibGVkLCBmbG9hdGluZ0ZvY3VzRWxlbWVudCwgbW9kYWwsIGlzVW50cmFwcGVkVHlwZWFibGVDb21ib2JveCwgZ2V0VGFiYmFibGVDb250ZW50XSk7XG5cbiAgLy8gVHJhY2sgcG9pbnRlci9rZXlib2FyZCBpbnRlcmFjdGlvbnMgdG8gZGlzYW1iaWd1YXRlIGZvY3VzIGFuZCBvdXRzaWRlIHByZXNzZXMuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8ICFvcGVuKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgICBmdW5jdGlvbiBjbGVhclBvaW50ZXJEb3duT3V0c2lkZSgpIHtcbiAgICAgIHBvaW50ZXJEb3duT3V0c2lkZVJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZXZlbnQpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBjb25zdCBpbnNpZGVFbGVtZW50cyA9IGdldFJlc29sdmVkSW5zaWRlRWxlbWVudHMoKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJUYXJnZXRJbnNpZGUgPSBjb250YWlucyhmbG9hdGluZywgdGFyZ2V0KSB8fCBjb250YWlucyhkb21SZWZlcmVuY2UsIHRhcmdldCkgfHwgY29udGFpbnMocG9ydGFsQ29udGV4dD8ucG9ydGFsTm9kZSwgdGFyZ2V0KSB8fCBpbnNpZGVFbGVtZW50cy5zb21lKGVsZW1lbnQgPT4gZWxlbWVudCA9PT0gdGFyZ2V0IHx8IGNvbnRhaW5zKGVsZW1lbnQsIHRhcmdldCkpO1xuICAgICAgcG9pbnRlckRvd25PdXRzaWRlUmVmLmN1cnJlbnQgPSAhcG9pbnRlclRhcmdldEluc2lkZTtcbiAgICAgIGxhc3RJbnRlcmFjdGlvblR5cGVSZWYuY3VycmVudCA9IGV2ZW50LnBvaW50ZXJUeXBlIHx8ICdrZXlib2FyZCc7XG4gICAgICBpZiAodGFyZ2V0Py5jbG9zZXN0KGBbJHtDTElDS19UUklHR0VSX0lERU5USUZJRVJ9XWApKSB7XG4gICAgICAgIGlzUG9pbnRlckRvd25SZWYuY3VycmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uS2V5RG93bigpIHtcbiAgICAgIGxhc3RJbnRlcmFjdGlvblR5cGVSZWYuY3VycmVudCA9ICdrZXlib2FyZCc7XG4gICAgfVxuICAgIHJldHVybiBtZXJnZUNsZWFudXBzKGFkZEV2ZW50TGlzdGVuZXIoZG9jLCAncG9pbnRlcmRvd24nLCBvblBvaW50ZXJEb3duLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdwb2ludGVydXAnLCBjbGVhclBvaW50ZXJEb3duT3V0c2lkZSwgdHJ1ZSksIGFkZEV2ZW50TGlzdGVuZXIoZG9jLCAncG9pbnRlcmNhbmNlbCcsIGNsZWFyUG9pbnRlckRvd25PdXRzaWRlLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdrZXlkb3duJywgb25LZXlEb3duLCB0cnVlKSk7XG4gIH0sIFtkaXNhYmxlZCwgZmxvYXRpbmcsIGRvbVJlZmVyZW5jZSwgZmxvYXRpbmdGb2N1c0VsZW1lbnQsIG9wZW4sIHBvcnRhbENvbnRleHQsIGdldFJlc29sdmVkSW5zaWRlRWxlbWVudHNdKTtcblxuICAvLyBDbG9zZSBvbiBmb2N1cyBvdXQgYW5kIHJlc3RvcmUgZm9jdXMgd2l0aGluIHRoZSBmbG9hdGluZyB0cmVlIHdoZW4gbmVlZGVkLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCAhY2xvc2VPbkZvY3VzT3V0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcblxuICAgIC8vIEluIFNhZmFyaSwgYnV0dG9ucyBsb3NlIGZvY3VzIHdoZW4gcHJlc3NpbmcgdGhlbS5cbiAgICBmdW5jdGlvbiBoYW5kbGVQb2ludGVyRG93bigpIHtcbiAgICAgIGlzUG9pbnRlckRvd25SZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBwb2ludGVyRG93blRpbWVvdXQuc3RhcnQoMCwgKCkgPT4ge1xuICAgICAgICBpc1BvaW50ZXJEb3duUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVGb2N1c0luKGV2ZW50KSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgICAgaWYgKGlzVGFiYmFibGUodGFyZ2V0KSkge1xuICAgICAgICBsYXN0Rm9jdXNlZFRhYmJhYmxlUmVmLmN1cnJlbnQgPSB0YXJnZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZUZvY3VzT3V0c2lkZShldmVudCkge1xuICAgICAgY29uc3QgcmVsYXRlZFRhcmdldCA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQ7XG4gICAgICBjb25zdCBjdXJyZW50VGFyZ2V0ID0gZXZlbnQuY3VycmVudFRhcmdldDtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGVJZCA9IGdldE5vZGVJZCgpO1xuICAgICAgICBjb25zdCB0cmlnZ2VycyA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzO1xuICAgICAgICBjb25zdCBpbnNpZGVFbGVtZW50cyA9IGdldFJlc29sdmVkSW5zaWRlRWxlbWVudHMoKTtcbiAgICAgICAgY29uc3QgaXNSZWxhdGVkRm9jdXNHdWFyZCA9IHJlbGF0ZWRUYXJnZXQ/Lmhhc0F0dHJpYnV0ZShjcmVhdGVBdHRyaWJ1dGUoJ2ZvY3VzLWd1YXJkJykpICYmIFtiZWZvcmVHdWFyZFJlZi5jdXJyZW50LCBhZnRlckd1YXJkUmVmLmN1cnJlbnQsIHBvcnRhbENvbnRleHQ/LmJlZm9yZUluc2lkZVJlZi5jdXJyZW50LCBwb3J0YWxDb250ZXh0Py5hZnRlckluc2lkZVJlZi5jdXJyZW50LCBwb3J0YWxDb250ZXh0Py5iZWZvcmVPdXRzaWRlUmVmLmN1cnJlbnQsIHBvcnRhbENvbnRleHQ/LmFmdGVyT3V0c2lkZVJlZi5jdXJyZW50LCByZXNvbHZlUmVmKHByZXZpb3VzRm9jdXNhYmxlRWxlbWVudCksIHJlc29sdmVSZWYobmV4dEZvY3VzYWJsZUVsZW1lbnQpXS5pbmNsdWRlcyhyZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgY29uc3QgbW92ZWRUb1VucmVsYXRlZE5vZGUgPSAhKGNvbnRhaW5zKGRvbVJlZmVyZW5jZSwgcmVsYXRlZFRhcmdldCkgfHwgY29udGFpbnMoZmxvYXRpbmcsIHJlbGF0ZWRUYXJnZXQpIHx8IGNvbnRhaW5zKHJlbGF0ZWRUYXJnZXQsIGZsb2F0aW5nKSB8fCBjb250YWlucyhwb3J0YWxDb250ZXh0Py5wb3J0YWxOb2RlLCByZWxhdGVkVGFyZ2V0KSB8fCBpbnNpZGVFbGVtZW50cy5zb21lKGVsZW1lbnQgPT4gZWxlbWVudCA9PT0gcmVsYXRlZFRhcmdldCB8fCBjb250YWlucyhlbGVtZW50LCByZWxhdGVkVGFyZ2V0KSkgfHwgcmVsYXRlZFRhcmdldCAhPSBudWxsICYmIHRyaWdnZXJzLmhhc0VsZW1lbnQocmVsYXRlZFRhcmdldCkgfHwgdHJpZ2dlcnMuaGFzTWF0Y2hpbmdFbGVtZW50KHRyaWdnZXIgPT4gY29udGFpbnModHJpZ2dlciwgcmVsYXRlZFRhcmdldCkpIHx8IGlzUmVsYXRlZEZvY3VzR3VhcmQgfHwgdHJlZSAmJiAoZ2V0Tm9kZUNoaWxkcmVuKHRyZWUubm9kZXNSZWYuY3VycmVudCwgbm9kZUlkKS5maW5kKG5vZGUgPT4gY29udGFpbnMobm9kZS5jb250ZXh0Py5lbGVtZW50cy5mbG9hdGluZywgcmVsYXRlZFRhcmdldCkgfHwgY29udGFpbnMobm9kZS5jb250ZXh0Py5lbGVtZW50cy5kb21SZWZlcmVuY2UsIHJlbGF0ZWRUYXJnZXQpKSB8fCBnZXROb2RlQW5jZXN0b3JzKHRyZWUubm9kZXNSZWYuY3VycmVudCwgbm9kZUlkKS5maW5kKG5vZGUgPT4gW25vZGUuY29udGV4dD8uZWxlbWVudHMuZmxvYXRpbmcsIGdldEZsb2F0aW5nRm9jdXNFbGVtZW50KG5vZGUuY29udGV4dD8uZWxlbWVudHMuZmxvYXRpbmcpXS5pbmNsdWRlcyhyZWxhdGVkVGFyZ2V0KSB8fCBub2RlLmNvbnRleHQ/LmVsZW1lbnRzLmRvbVJlZmVyZW5jZSA9PT0gcmVsYXRlZFRhcmdldCkpKTtcbiAgICAgICAgaWYgKGN1cnJlbnRUYXJnZXQgPT09IGRvbVJlZmVyZW5jZSAmJiBmbG9hdGluZ0ZvY3VzRWxlbWVudCkge1xuICAgICAgICAgIGhhbmRsZVRhYkluZGV4KGZsb2F0aW5nRm9jdXNFbGVtZW50LCBvcmRlclJlZik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXN0b3JlIGZvY3VzIHRvIHRoZSBwcmV2aW91cyB0YWJiYWJsZSBlbGVtZW50IGluZGV4IHRvIHByZXZlbnRcbiAgICAgICAgLy8gZm9jdXMgZnJvbSBiZWluZyBsb3N0IG91dHNpZGUgdGhlIGZsb2F0aW5nIHRyZWUuXG4gICAgICAgIGlmIChyZXN0b3JlRm9jdXMgJiYgY3VycmVudFRhcmdldCAhPT0gZG9tUmVmZXJlbmNlICYmICFpc0VsZW1lbnRWaXNpYmxlKHRhcmdldCkgJiYgYWN0aXZlRWxlbWVudChkb2MpID09PSBkb2MuYm9keSkge1xuICAgICAgICAgIC8vIExldCBgRmxvYXRpbmdQb3J0YWxgIGVmZmVjdCBrbm93cyB0aGF0IGZvY3VzIGlzIHN0aWxsIGluc2lkZSB0aGVcbiAgICAgICAgICAvLyBmbG9hdGluZyB0cmVlLlxuICAgICAgICAgIGlmIChpc0hUTUxFbGVtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KSkge1xuICAgICAgICAgICAgZmxvYXRpbmdGb2N1c0VsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAgIC8vIElmIGV4cGxpY2l0bHkgcmVxdWVzdGVkIHRvIHJlc3RvcmUgZm9jdXMgdG8gdGhlIHBvcHVwIGNvbnRhaW5lciwgZG8gbm90IHNlYXJjaFxuICAgICAgICAgICAgLy8gZm9yIHRoZSBuZXh0L3ByZXZpb3VzIHRhYmJhYmxlIGVsZW1lbnQuXG4gICAgICAgICAgICBpZiAocmVzdG9yZUZvY3VzID09PSAncG9wdXAnKSB7XG4gICAgICAgICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHJlbW92ZWQgb24gcG9pbnRlcmRvd24sIGZvY3VzIHRyaWVzIHRvIG1vdmUgaXQsXG4gICAgICAgICAgICAgIC8vIGJ1dCBzaW5jZSBpdCdzIHJlbW92ZWQgYXQgdGhlIHNhbWUgdGltZSwgZm9jdXMgZ2V0cyBsb3N0IGFzIGl0XG4gICAgICAgICAgICAgIC8vIGhhcHBlbnMgYWZ0ZXIgdGhlIC5mb2N1cygpIGNhbGwgYWJvdmUuXG4gICAgICAgICAgICAgIC8vIEluIHRoaXMgY2FzZSwgZm9jdXMgbmVlZHMgdG8gYmUgbW92ZWQgYXN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICAgIHJlc3RvcmVGb2N1c0ZyYW1lLnJlcXVlc3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGZsb2F0aW5nRm9jdXNFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHRhYmJhYmxlQ29udGVudCA9IGdldFRhYmJhYmxlQ29udGVudCgpO1xuICAgICAgICAgIGNvbnN0IHByZXZUYWJiYWJsZSA9IGxhc3RGb2N1c2VkVGFiYmFibGVSZWYuY3VycmVudDtcbiAgICAgICAgICBjb25zdCBub2RlVG9Gb2N1cyA9IChwcmV2VGFiYmFibGUgJiYgdGFiYmFibGVDb250ZW50LmluY2x1ZGVzKHByZXZUYWJiYWJsZSkgPyBwcmV2VGFiYmFibGUgOiBudWxsKSB8fCB0YWJiYWJsZUNvbnRlbnRbdGFiYmFibGVDb250ZW50Lmxlbmd0aCAtIDFdIHx8IGZsb2F0aW5nRm9jdXNFbGVtZW50O1xuICAgICAgICAgIGlmIChpc0hUTUxFbGVtZW50KG5vZGVUb0ZvY3VzKSkge1xuICAgICAgICAgICAgbm9kZVRvRm9jdXMuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmxvYXRpbmctdWkvZmxvYXRpbmctdWkvaXNzdWVzLzMwNjBcbiAgICAgICAgaWYgKGRhdGFSZWYuY3VycmVudC5pbnNpZGVSZWFjdFRyZWUpIHtcbiAgICAgICAgICBkYXRhUmVmLmN1cnJlbnQuaW5zaWRlUmVhY3RUcmVlID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9jdXMgZGlkIG5vdCBtb3ZlIGluc2lkZSB0aGUgZmxvYXRpbmcgdHJlZSwgYW5kIHRoZXJlIGFyZSBubyB0YWJiYWJsZVxuICAgICAgICAvLyBwb3J0YWwgZ3VhcmRzIHRvIGhhbmRsZSBjbG9zaW5nLlxuICAgICAgICBpZiAoKGlzVW50cmFwcGVkVHlwZWFibGVDb21ib2JveCA/IHRydWUgOiAhbW9kYWwpICYmIHJlbGF0ZWRUYXJnZXQgJiYgbW92ZWRUb1VucmVsYXRlZE5vZGUgJiYgIWlzUG9pbnRlckRvd25SZWYuY3VycmVudCAmJiAoXG4gICAgICAgIC8vIEZpeCBSZWFjdCAxOCBTdHJpY3QgTW9kZSByZXR1cm5Gb2N1cyBkdWUgdG8gZG91YmxlIHJlbmRlcmluZy5cbiAgICAgICAgLy8gRm9yIGFuIFwidW50cmFwcGVkXCIgdHlwZWFibGUgY29tYm9ib3ggKGlucHV0IHJvbGU9Y29tYm9ib3ggd2l0aFxuICAgICAgICAvLyBpbml0aWFsRm9jdXM9ZmFsc2UpLCByZS1vcGVuaW5nIHRoZSBwb3B1cCBhbmQgdGFiYmluZyBvdXQgc2hvdWxkIHN0aWxsIGNsb3NlIGl0IGV2ZW5cbiAgICAgICAgLy8gd2hlbiB0aGUgcHJldmlvdXNseSBmb2N1c2VkIGVsZW1lbnQgKGUuZy4gdGhlIG5leHQgdGFiYmFibGUgb3V0c2lkZSB0aGUgcG9wdXApIGlzXG4gICAgICAgIC8vIGZvY3VzZWQgYWdhaW4uIE90aGVyd2lzZSwgdGhlIHBvcHVwIHJlbWFpbnMgb3BlbiBvbiB0aGUgc2Vjb25kIFRhYiBzZXF1ZW5jZTpcbiAgICAgICAgLy8gY2xpY2sgaW5wdXQgLT4gVGFiIChjbG9zZXMpIC0+IGNsaWNrIGlucHV0IC0+IFRhYi5cbiAgICAgICAgLy8gQWxsb3cgY2xvc2luZyB3aGVuIGBpc1VudHJhcHBlZFR5cGVhYmxlQ29tYm9ib3hgIHJlZ2FyZGxlc3Mgb2YgdGhlIHByZXZpb3VzbHkgZm9jdXNlZCBlbGVtZW50LlxuICAgICAgICBpc1VudHJhcHBlZFR5cGVhYmxlQ29tYm9ib3ggfHwgcmVsYXRlZFRhcmdldCAhPT0gZ2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KCkpKSB7XG4gICAgICAgICAgcHJldmVudFJldHVybkZvY3VzUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgIHN0b3JlLnNldE9wZW4oZmFsc2UsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLmZvY3VzT3V0LCBldmVudCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWFya0luc2lkZVJlYWN0VHJlZSgpIHtcbiAgICAgIGlmIChwb2ludGVyRG93bk91dHNpZGVSZWYuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkYXRhUmVmLmN1cnJlbnQuaW5zaWRlUmVhY3RUcmVlID0gdHJ1ZTtcbiAgICAgIGJsdXJUaW1lb3V0LnN0YXJ0KDAsICgpID0+IHtcbiAgICAgICAgZGF0YVJlZi5jdXJyZW50Lmluc2lkZVJlYWN0VHJlZSA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGRvbVJlZmVyZW5jZUVsZW1lbnQgPSBpc0hUTUxFbGVtZW50KGRvbVJlZmVyZW5jZSkgPyBkb21SZWZlcmVuY2UgOiBudWxsO1xuICAgIGlmICghZmxvYXRpbmcgJiYgIWRvbVJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBtZXJnZUNsZWFudXBzKGRvbVJlZmVyZW5jZUVsZW1lbnQgJiYgYWRkRXZlbnRMaXN0ZW5lcihkb21SZWZlcmVuY2VFbGVtZW50LCAnZm9jdXNvdXQnLCBoYW5kbGVGb2N1c091dHNpZGUpLCBkb21SZWZlcmVuY2VFbGVtZW50ICYmIGFkZEV2ZW50TGlzdGVuZXIoZG9tUmVmZXJlbmNlRWxlbWVudCwgJ3BvaW50ZXJkb3duJywgaGFuZGxlUG9pbnRlckRvd24pLCBmbG9hdGluZyAmJiBhZGRFdmVudExpc3RlbmVyKGZsb2F0aW5nLCAnZm9jdXNpbicsIGhhbmRsZUZvY3VzSW4pLCBmbG9hdGluZyAmJiBhZGRFdmVudExpc3RlbmVyKGZsb2F0aW5nLCAnZm9jdXNvdXQnLCBoYW5kbGVGb2N1c091dHNpZGUpLCBmbG9hdGluZyAmJiBwb3J0YWxDb250ZXh0ICYmIGFkZEV2ZW50TGlzdGVuZXIoZmxvYXRpbmcsICdmb2N1c291dCcsIG1hcmtJbnNpZGVSZWFjdFRyZWUsIHRydWUpKTtcbiAgfSwgW2Rpc2FibGVkLCBkb21SZWZlcmVuY2UsIGZsb2F0aW5nLCBmbG9hdGluZ0ZvY3VzRWxlbWVudCwgbW9kYWwsIHRyZWUsIHBvcnRhbENvbnRleHQsIHN0b3JlLCBjbG9zZU9uRm9jdXNPdXQsIHJlc3RvcmVGb2N1cywgZ2V0VGFiYmFibGVDb250ZW50LCBpc1VudHJhcHBlZFR5cGVhYmxlQ29tYm9ib3gsIGdldE5vZGVJZCwgb3JkZXJSZWYsIGRhdGFSZWYsIGJsdXJUaW1lb3V0LCBwb2ludGVyRG93blRpbWVvdXQsIHJlc3RvcmVGb2N1c0ZyYW1lLCBuZXh0Rm9jdXNhYmxlRWxlbWVudCwgcHJldmlvdXNGb2N1c2FibGVFbGVtZW50LCBnZXRSZXNvbHZlZEluc2lkZUVsZW1lbnRzXSk7XG5cbiAgLy8gSGlkZSBldmVyeXRoaW5nIG91dHNpZGUgdGhlIGZsb2F0aW5nIHRyZWUgZnJvbSBhc3Npc3RpdmUgdGVjaCB3aGlsZSBvcGVuLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCAhZmxvYXRpbmcgfHwgIW9wZW4pIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgaGlkZSBwb3J0YWxzIG5lc3RlZCB3aXRoaW4gdGhlIHBhcmVudCBwb3J0YWwuXG4gICAgY29uc3QgcG9ydGFsTm9kZXMgPSBBcnJheS5mcm9tKHBvcnRhbENvbnRleHQ/LnBvcnRhbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoYFske2NyZWF0ZUF0dHJpYnV0ZSgncG9ydGFsJyl9XWApIHx8IFtdKTtcbiAgICBjb25zdCBhbmNlc3RvcnMgPSB0cmVlID8gZ2V0Tm9kZUFuY2VzdG9ycyh0cmVlLm5vZGVzUmVmLmN1cnJlbnQsIGdldE5vZGVJZCgpKSA6IFtdO1xuICAgIGNvbnN0IHJvb3RBbmNlc3RvckNvbWJvYm94RG9tUmVmZXJlbmNlID0gYW5jZXN0b3JzLmZpbmQobm9kZSA9PiBpc1R5cGVhYmxlQ29tYm9ib3gobm9kZS5jb250ZXh0Py5lbGVtZW50cy5kb21SZWZlcmVuY2UgfHwgbnVsbCkpPy5jb250ZXh0Py5lbGVtZW50cy5kb21SZWZlcmVuY2U7XG4gICAgY29uc3QgY29udHJvbEluc2lkZUVsZW1lbnRzID0gW2Zsb2F0aW5nLCAuLi5wb3J0YWxOb2RlcywgYmVmb3JlR3VhcmRSZWYuY3VycmVudCwgYWZ0ZXJHdWFyZFJlZi5jdXJyZW50LCBwb3J0YWxDb250ZXh0Py5iZWZvcmVPdXRzaWRlUmVmLmN1cnJlbnQsIHBvcnRhbENvbnRleHQ/LmFmdGVyT3V0c2lkZVJlZi5jdXJyZW50LCAuLi5nZXRSZXNvbHZlZEluc2lkZUVsZW1lbnRzKCldO1xuICAgIGNvbnN0IGluc2lkZUVsZW1lbnRzID0gWy4uLmNvbnRyb2xJbnNpZGVFbGVtZW50cywgcm9vdEFuY2VzdG9yQ29tYm9ib3hEb21SZWZlcmVuY2UsIHJlc29sdmVSZWYocHJldmlvdXNGb2N1c2FibGVFbGVtZW50KSwgcmVzb2x2ZVJlZihuZXh0Rm9jdXNhYmxlRWxlbWVudCksIGlzVW50cmFwcGVkVHlwZWFibGVDb21ib2JveCA/IGRvbVJlZmVyZW5jZSA6IG51bGxdLmZpbHRlcih4ID0+IHggIT0gbnVsbCk7XG4gICAgY29uc3QgYXJpYUhpZGRlbkNsZWFudXAgPSBtYXJrT3RoZXJzKGluc2lkZUVsZW1lbnRzLCB7XG4gICAgICBhcmlhSGlkZGVuOiBtb2RhbCB8fCBpc1VudHJhcHBlZFR5cGVhYmxlQ29tYm9ib3gsXG4gICAgICBtYXJrOiBmYWxzZVxuICAgIH0pO1xuICAgIGNvbnN0IG1hcmtlckluc2lkZUVsZW1lbnRzID0gW2Zsb2F0aW5nLCAuLi5wb3J0YWxOb2Rlc10uZmlsdGVyKHggPT4geCAhPSBudWxsKTtcbiAgICBjb25zdCBtYXJrZXJDbGVhbnVwID0gbWFya090aGVycyhtYXJrZXJJbnNpZGVFbGVtZW50cyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIG1hcmtlckNsZWFudXAoKTtcbiAgICAgIGFyaWFIaWRkZW5DbGVhbnVwKCk7XG4gICAgfTtcbiAgfSwgW29wZW4sIGRpc2FibGVkLCBkb21SZWZlcmVuY2UsIGZsb2F0aW5nLCBtb2RhbCwgcG9ydGFsQ29udGV4dCwgaXNVbnRyYXBwZWRUeXBlYWJsZUNvbWJvYm94LCB0cmVlLCBnZXROb2RlSWQsIG5leHRGb2N1c2FibGVFbGVtZW50LCBwcmV2aW91c0ZvY3VzYWJsZUVsZW1lbnQsIGdldFJlc29sdmVkSW5zaWRlRWxlbWVudHNdKTtcblxuICAvLyBGb2N1cyB0aGUgaW5pdGlhbCBlbGVtZW50IHdoZW4gdGhlIGZsb2F0aW5nIGVsZW1lbnQgb3BlbnMuXG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuIHx8IGRpc2FibGVkIHx8ICFpc0hUTUxFbGVtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgICBjb25zdCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBhY3RpdmVFbGVtZW50KGRvYyk7XG5cbiAgICAvLyBXYWl0IGZvciBhbnkgbGF5b3V0IGVmZmVjdCBzdGF0ZSBzZXR0ZXJzIHRvIGV4ZWN1dGUgdG8gc2V0IGB0YWJJbmRleGAuXG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgY29uc3QgaW5pdGlhbEZvY3VzVmFsdWVPckZuID0gaW5pdGlhbEZvY3VzUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCByZXNvbHZlZEluaXRpYWxGb2N1cyA9IHR5cGVvZiBpbml0aWFsRm9jdXNWYWx1ZU9yRm4gPT09ICdmdW5jdGlvbicgPyBpbml0aWFsRm9jdXNWYWx1ZU9yRm4ob3BlbkludGVyYWN0aW9uVHlwZVJlZi5jdXJyZW50IHx8ICcnKSA6IGluaXRpYWxGb2N1c1ZhbHVlT3JGbjtcblxuICAgICAgLy8gYG51bGxgIHNob3VsZCBmYWxsYmFjayB0byBkZWZhdWx0IGJlaGF2aW9yIGluIGNhc2Ugb2YgYW4gZW1wdHkgcmVmLlxuICAgICAgaWYgKHJlc29sdmVkSW5pdGlhbEZvY3VzID09PSB1bmRlZmluZWQgfHwgcmVzb2x2ZWRJbml0aWFsRm9jdXMgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZvY3VzQWxyZWFkeUluc2lkZUZsb2F0aW5nRWwgPSBjb250YWlucyhmbG9hdGluZ0ZvY3VzRWxlbWVudCwgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50KTtcbiAgICAgIGlmIChmb2N1c0FscmVhZHlJbnNpZGVGbG9hdGluZ0VsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBmb2N1c2FibGVFbGVtZW50cyA9IG51bGw7XG4gICAgICBjb25zdCBnZXREZWZhdWx0Rm9jdXNFbGVtZW50ID0gKCkgPT4ge1xuICAgICAgICBpZiAoZm9jdXNhYmxlRWxlbWVudHMgPT0gbnVsbCkge1xuICAgICAgICAgIGZvY3VzYWJsZUVsZW1lbnRzID0gZ2V0VGFiYmFibGVDb250ZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9jdXNhYmxlRWxlbWVudHNbMF0gfHwgZmxvYXRpbmdGb2N1c0VsZW1lbnQ7XG4gICAgICB9O1xuICAgICAgbGV0IGVsVG9Gb2N1cztcbiAgICAgIGlmIChyZXNvbHZlZEluaXRpYWxGb2N1cyA9PT0gdHJ1ZSB8fCByZXNvbHZlZEluaXRpYWxGb2N1cyA9PT0gbnVsbCkge1xuICAgICAgICBlbFRvRm9jdXMgPSBnZXREZWZhdWx0Rm9jdXNFbGVtZW50KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbFRvRm9jdXMgPSByZXNvbHZlUmVmKHJlc29sdmVkSW5pdGlhbEZvY3VzKTtcbiAgICAgIH1cbiAgICAgIGVsVG9Gb2N1cyA9IGVsVG9Gb2N1cyB8fCBnZXREZWZhdWx0Rm9jdXNFbGVtZW50KCk7XG4gICAgICBjb25zdCBoYWRGb2N1c0luc2lkZSA9IGNvbnRhaW5zKGZsb2F0aW5nRm9jdXNFbGVtZW50LCBhY3RpdmVFbGVtZW50KGRvYykpO1xuICAgICAgZW5xdWV1ZUZvY3VzKGVsVG9Gb2N1cywge1xuICAgICAgICBwcmV2ZW50U2Nyb2xsOiBlbFRvRm9jdXMgPT09IGZsb2F0aW5nRm9jdXNFbGVtZW50LFxuICAgICAgICBzaG91bGRGb2N1cygpIHtcbiAgICAgICAgICBpZiAoaGFkRm9jdXNJbnNpZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBjdXJyZW50QWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQoZG9jKTtcbiAgICAgICAgICBjb25zdCBmb2N1c01vdmVkSW5zaWRlID0gY3VycmVudEFjdGl2ZUVsZW1lbnQgIT09IGVsVG9Gb2N1cyAmJiBjb250YWlucyhmbG9hdGluZ0ZvY3VzRWxlbWVudCwgY3VycmVudEFjdGl2ZUVsZW1lbnQpO1xuICAgICAgICAgIHJldHVybiAhZm9jdXNNb3ZlZEluc2lkZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sIFtkaXNhYmxlZCwgb3BlbiwgZmxvYXRpbmdGb2N1c0VsZW1lbnQsIGdldFRhYmJhYmxlQ29udGVudCwgaW5pdGlhbEZvY3VzUmVmLCBvcGVuSW50ZXJhY3Rpb25UeXBlUmVmXSk7XG5cbiAgLy8gVHJhY2sgcmV0dXJuIGZvY3VzIHRhcmdldHMgYW5kIHJlc3RvcmUgZm9jdXMgb24gdW5tb3VudC9jbG9zZS5cbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgIWZsb2F0aW5nRm9jdXNFbGVtZW50KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRm9jdXNFbGVtZW50KTtcbiAgICBjb25zdCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBhY3RpdmVFbGVtZW50KGRvYyk7XG4gICAgYWRkUHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCk7XG5cbiAgICAvLyBEaXNtaXNzaW5nIHZpYSBvdXRzaWRlIHByZXNzIHNob3VsZCBhbHdheXMgaWdub3JlIGByZXR1cm5Gb2N1c2AgdG9cbiAgICAvLyBwcmV2ZW50IHVud2FudGVkIHNjcm9sbGluZy5cbiAgICBmdW5jdGlvbiBvbk9wZW5DaGFuZ2VMb2NhbChkZXRhaWxzKSB7XG4gICAgICBpZiAoIWRldGFpbHMub3Blbikge1xuICAgICAgICBjbG9zZVR5cGVSZWYuY3VycmVudCA9IGdldEV2ZW50VHlwZShkZXRhaWxzLm5hdGl2ZUV2ZW50LCBsYXN0SW50ZXJhY3Rpb25UeXBlUmVmLmN1cnJlbnQpO1xuICAgICAgfVxuICAgICAgaWYgKGRldGFpbHMucmVhc29uID09PSBSRUFTT05TLnRyaWdnZXJIb3ZlciAmJiBkZXRhaWxzLm5hdGl2ZUV2ZW50LnR5cGUgPT09ICdtb3VzZWxlYXZlJykge1xuICAgICAgICBwcmV2ZW50UmV0dXJuRm9jdXNSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoZGV0YWlscy5yZWFzb24gIT09IFJFQVNPTlMub3V0c2lkZVByZXNzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChkZXRhaWxzLm5lc3RlZCkge1xuICAgICAgICBwcmV2ZW50UmV0dXJuRm9jdXNSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmIChpc1ZpcnR1YWxDbGljayhkZXRhaWxzLm5hdGl2ZUV2ZW50KSB8fCBpc1ZpcnR1YWxQb2ludGVyRXZlbnQoZGV0YWlscy5uYXRpdmVFdmVudCkpIHtcbiAgICAgICAgcHJldmVudFJldHVybkZvY3VzUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpc1ByZXZlbnRTY3JvbGxTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgb3duZXJEb2N1bWVudChmbG9hdGluZ0ZvY3VzRWxlbWVudCkuY3JlYXRlRWxlbWVudCgnZGl2JykuZm9jdXMoe1xuICAgICAgICAgIGdldCBwcmV2ZW50U2Nyb2xsKCkge1xuICAgICAgICAgICAgaXNQcmV2ZW50U2Nyb2xsU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNQcmV2ZW50U2Nyb2xsU3VwcG9ydGVkKSB7XG4gICAgICAgICAgcHJldmVudFJldHVybkZvY3VzUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcmV2ZW50UmV0dXJuRm9jdXNSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZXZlbnRzLm9uKCdvcGVuY2hhbmdlJywgb25PcGVuQ2hhbmdlTG9jYWwpO1xuICAgIGZ1bmN0aW9uIGdldFJldHVybkVsZW1lbnQoKSB7XG4gICAgICBjb25zdCByZXR1cm5Gb2N1c1ZhbHVlT3JGbiA9IHJldHVybkZvY3VzUmVmLmN1cnJlbnQ7XG4gICAgICBsZXQgcmVzb2x2ZWRSZXR1cm5Gb2N1c1ZhbHVlID0gdHlwZW9mIHJldHVybkZvY3VzVmFsdWVPckZuID09PSAnZnVuY3Rpb24nID8gcmV0dXJuRm9jdXNWYWx1ZU9yRm4oY2xvc2VUeXBlUmVmLmN1cnJlbnQpIDogcmV0dXJuRm9jdXNWYWx1ZU9yRm47XG5cbiAgICAgIC8vIGBudWxsYCBzaG91bGQgZmFsbGJhY2sgdG8gZGVmYXVsdCBiZWhhdmlvciBpbiBjYXNlIG9mIGFuIGVtcHR5IHJlZi5cbiAgICAgIGlmIChyZXNvbHZlZFJldHVybkZvY3VzVmFsdWUgPT09IHVuZGVmaW5lZCB8fCByZXNvbHZlZFJldHVybkZvY3VzVmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHJlc29sdmVkUmV0dXJuRm9jdXNWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXNvbHZlZFJldHVybkZvY3VzVmFsdWUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiByZXNvbHZlZFJldHVybkZvY3VzVmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICBpZiAoZG9tUmVmZXJlbmNlPy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgIHJldHVybiBkb21SZWZlcmVuY2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCgpIHx8IG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBmYWxsYmFjayA9IGRvbVJlZmVyZW5jZT8uaXNDb25uZWN0ZWQgPyBkb21SZWZlcmVuY2UgOiBnZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgIHJldHVybiByZXNvbHZlUmVmKHJlc29sdmVkUmV0dXJuRm9jdXNWYWx1ZSkgfHwgZmFsbGJhY2sgfHwgbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGV2ZW50cy5vZmYoJ29wZW5jaGFuZ2UnLCBvbk9wZW5DaGFuZ2VMb2NhbCk7XG4gICAgICBjb25zdCBhY3RpdmVFbCA9IGFjdGl2ZUVsZW1lbnQoZG9jKTtcbiAgICAgIGNvbnN0IGluc2lkZUVsZW1lbnRzID0gZ2V0UmVzb2x2ZWRJbnNpZGVFbGVtZW50cygpO1xuICAgICAgY29uc3QgaXNGb2N1c0luc2lkZUZsb2F0aW5nVHJlZSA9IGNvbnRhaW5zKGZsb2F0aW5nLCBhY3RpdmVFbCkgfHwgaW5zaWRlRWxlbWVudHMuc29tZShlbGVtZW50ID0+IGVsZW1lbnQgPT09IGFjdGl2ZUVsIHx8IGNvbnRhaW5zKGVsZW1lbnQsIGFjdGl2ZUVsKSkgfHwgdHJlZSAmJiBnZXROb2RlQ2hpbGRyZW4odHJlZS5ub2Rlc1JlZi5jdXJyZW50LCBnZXROb2RlSWQoKSwgZmFsc2UpLnNvbWUobm9kZSA9PiBjb250YWlucyhub2RlLmNvbnRleHQ/LmVsZW1lbnRzLmZsb2F0aW5nLCBhY3RpdmVFbCkpO1xuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgICBjb25zdCByZXR1cm5Gb2N1c1ZhbHVlT3JGbiA9IHJldHVybkZvY3VzUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCByZXR1cm5FbGVtZW50ID0gZ2V0UmV0dXJuRWxlbWVudCgpO1xuICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAvLyBUaGlzIGlzIGByZXR1cm5FbGVtZW50YCwgaWYgaXQncyB0YWJiYWJsZSwgb3IgaXRzIGZpcnN0IHRhYmJhYmxlIGNoaWxkLlxuICAgICAgICBjb25zdCB0YWJiYWJsZVJldHVybkVsZW1lbnQgPSBnZXRGaXJzdFRhYmJhYmxlRWxlbWVudChyZXR1cm5FbGVtZW50KTtcbiAgICAgICAgY29uc3QgaGFzRXhwbGljaXRSZXR1cm5Gb2N1cyA9IHR5cGVvZiByZXR1cm5Gb2N1c1ZhbHVlT3JGbiAhPT0gJ2Jvb2xlYW4nO1xuICAgICAgICBpZiAocmV0dXJuRm9jdXNWYWx1ZU9yRm4gJiYgIXByZXZlbnRSZXR1cm5Gb2N1c1JlZi5jdXJyZW50ICYmIGlzSFRNTEVsZW1lbnQodGFiYmFibGVSZXR1cm5FbGVtZW50KSAmJiAoXG4gICAgICAgIC8vIElmIHRoZSBmb2N1cyBtb3ZlZCBzb21ld2hlcmUgZWxzZSBhZnRlciBtb3VudCwgYXZvaWQgcmV0dXJuaW5nIGZvY3VzXG4gICAgICAgIC8vIHNpbmNlIGl0IGxpa2VseSBlbnRlcmVkIGEgZGlmZmVyZW50IGVsZW1lbnQgd2hpY2ggc2hvdWxkIGJlXG4gICAgICAgIC8vIHJlc3BlY3RlZDogaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL2lzc3Vlcy8yNjA3XG4gICAgICAgICFoYXNFeHBsaWNpdFJldHVybkZvY3VzICYmIHRhYmJhYmxlUmV0dXJuRWxlbWVudCAhPT0gYWN0aXZlRWwgJiYgYWN0aXZlRWwgIT09IGRvYy5ib2R5ID8gaXNGb2N1c0luc2lkZUZsb2F0aW5nVHJlZSA6IHRydWUpKSB7XG4gICAgICAgICAgdGFiYmFibGVSZXR1cm5FbGVtZW50LmZvY3VzKHtcbiAgICAgICAgICAgIHByZXZlbnRTY3JvbGw6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBwcmV2ZW50UmV0dXJuRm9jdXNSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSwgW2Rpc2FibGVkLCBmbG9hdGluZywgZmxvYXRpbmdGb2N1c0VsZW1lbnQsIHJldHVybkZvY3VzUmVmLCBldmVudHMsIHRyZWUsIGRvbVJlZmVyZW5jZSwgZ2V0Tm9kZUlkLCBnZXRSZXNvbHZlZEluc2lkZUVsZW1lbnRzXSk7XG5cbiAgLy8gU2FmYXJpIG1heSByYW5kb21seSBzY3JvbGwgdG8gdGhlIGJvdHRvbSBvZiB0aGUgcGFnZSBpZiBhbiBpbnB1dCBpbnNpZGUgYSBwb3B1cCBoYXMgZm9jdXNcbiAgLy8gd2hlbiB0aGUgcG9wdXAgdW5tb3VudHMgZnJvbSB0aGUgRE9NLlxuICAvLyBCeSBibHVycmluZyBpdCBiZWZvcmUgdGhlIHBvcHVwIHVubW91bnRzLCB3ZSBjYW4gcHJldmVudCB0aGlzIGJlaGF2aW9yLlxuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaXNXZWJLaXQgfHwgb3BlbiB8fCAhZmxvYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYWN0aXZlRWwgPSBhY3RpdmVFbGVtZW50KG93bmVyRG9jdW1lbnQoZmxvYXRpbmcpKTtcbiAgICBpZiAoIWlzSFRNTEVsZW1lbnQoYWN0aXZlRWwpIHx8ICFpc1R5cGVhYmxlRWxlbWVudChhY3RpdmVFbCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRhaW5zKGZsb2F0aW5nLCBhY3RpdmVFbCkpIHtcbiAgICAgIGFjdGl2ZUVsLmJsdXIoKTtcbiAgICB9XG4gIH0sIFtvcGVuLCBmbG9hdGluZ10pO1xuXG4gIC8vIFN5bmNocm9uaXplIHRoZSBgY29udGV4dGAgJiBgbW9kYWxgIHZhbHVlIHRvIHRoZSBGbG9hdGluZ1BvcnRhbCBjb250ZXh0LlxuICAvLyBJdCB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCBpdCBuZWVkcyB0byByZW5kZXIgaXRzIG93biBndWFyZHMuXG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8ICFwb3J0YWxDb250ZXh0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwb3J0YWxDb250ZXh0LnNldEZvY3VzTWFuYWdlclN0YXRlKHtcbiAgICAgIG1vZGFsLFxuICAgICAgY2xvc2VPbkZvY3VzT3V0LFxuICAgICAgb3BlbixcbiAgICAgIG9uT3BlbkNoYW5nZTogc3RvcmUuc2V0T3BlbixcbiAgICAgIGRvbVJlZmVyZW5jZVxuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBwb3J0YWxDb250ZXh0LnNldEZvY3VzTWFuYWdlclN0YXRlKG51bGwpO1xuICAgIH07XG4gIH0sIFtkaXNhYmxlZCwgcG9ydGFsQ29udGV4dCwgbW9kYWwsIG9wZW4sIHN0b3JlLCBjbG9zZU9uRm9jdXNPdXQsIGRvbVJlZmVyZW5jZV0pO1xuXG4gIC8vIEtlZXAgdGhlIGZsb2F0aW5nIGVsZW1lbnQgdGFiSW5kZXggaW4gc3luYyBhbmQgY2xlYXIgc3RhbGUgZm9jdXMgcmVjb3Jkcy5cbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgIWZsb2F0aW5nRm9jdXNFbGVtZW50KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBoYW5kbGVUYWJJbmRleChmbG9hdGluZ0ZvY3VzRWxlbWVudCwgb3JkZXJSZWYpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBxdWV1ZU1pY3JvdGFzayhjbGVhckRpc2Nvbm5lY3RlZFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudHMpO1xuICAgIH07XG4gIH0sIFtkaXNhYmxlZCwgZmxvYXRpbmdGb2N1c0VsZW1lbnQsIG9yZGVyUmVmXSk7XG4gIGNvbnN0IHNob3VsZFJlbmRlckd1YXJkcyA9ICFkaXNhYmxlZCAmJiAobW9kYWwgPyAhaXNVbnRyYXBwZWRUeXBlYWJsZUNvbWJvYm94IDogdHJ1ZSkgJiYgKGlzSW5zaWRlUG9ydGFsIHx8IG1vZGFsKTtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9fanN4cyhSZWFjdC5GcmFnbWVudCwge1xuICAgIGNoaWxkcmVuOiBbc2hvdWxkUmVuZGVyR3VhcmRzICYmIC8qI19fUFVSRV9fKi9fanN4KEZvY3VzR3VhcmQsIHtcbiAgICAgIFwiZGF0YS10eXBlXCI6IFwiaW5zaWRlXCIsXG4gICAgICByZWY6IG1lcmdlZEJlZm9yZUd1YXJkUmVmLFxuICAgICAgb25Gb2N1czogZXZlbnQgPT4ge1xuICAgICAgICBpZiAobW9kYWwpIHtcbiAgICAgICAgICBjb25zdCBlbHMgPSBnZXRUYWJiYWJsZUNvbnRlbnQoKTtcbiAgICAgICAgICBlbnF1ZXVlRm9jdXMoZWxzW2Vscy5sZW5ndGggLSAxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9ydGFsQ29udGV4dD8ucG9ydGFsTm9kZSkge1xuICAgICAgICAgIHByZXZlbnRSZXR1cm5Gb2N1c1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaWYgKGlzT3V0c2lkZUV2ZW50KGV2ZW50LCBwb3J0YWxDb250ZXh0LnBvcnRhbE5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0VGFiYmFibGUgPSBnZXROZXh0VGFiYmFibGUoZG9tUmVmZXJlbmNlKTtcbiAgICAgICAgICAgIG5leHRUYWJiYWJsZT8uZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZVJlZihwcmV2aW91c0ZvY3VzYWJsZUVsZW1lbnQgPz8gcG9ydGFsQ29udGV4dC5iZWZvcmVPdXRzaWRlUmVmKT8uZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSwgY2hpbGRyZW4sIHNob3VsZFJlbmRlckd1YXJkcyAmJiAvKiNfX1BVUkVfXyovX2pzeChGb2N1c0d1YXJkLCB7XG4gICAgICBcImRhdGEtdHlwZVwiOiBcImluc2lkZVwiLFxuICAgICAgcmVmOiBtZXJnZWRBZnRlckd1YXJkUmVmLFxuICAgICAgb25Gb2N1czogZXZlbnQgPT4ge1xuICAgICAgICBpZiAobW9kYWwpIHtcbiAgICAgICAgICBlbnF1ZXVlRm9jdXMoZ2V0VGFiYmFibGVDb250ZW50KClbMF0pO1xuICAgICAgICB9IGVsc2UgaWYgKHBvcnRhbENvbnRleHQ/LnBvcnRhbE5vZGUpIHtcbiAgICAgICAgICBpZiAoY2xvc2VPbkZvY3VzT3V0KSB7XG4gICAgICAgICAgICBwcmV2ZW50UmV0dXJuRm9jdXNSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc091dHNpZGVFdmVudChldmVudCwgcG9ydGFsQ29udGV4dC5wb3J0YWxOb2RlKSkge1xuICAgICAgICAgICAgY29uc3QgcHJldlRhYmJhYmxlID0gZ2V0UHJldmlvdXNUYWJiYWJsZShkb21SZWZlcmVuY2UpO1xuICAgICAgICAgICAgcHJldlRhYmJhYmxlPy5mb2N1cygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlUmVmKG5leHRGb2N1c2FibGVFbGVtZW50ID8/IHBvcnRhbENvbnRleHQuYWZ0ZXJPdXRzaWRlUmVmKT8uZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KV1cbiAgfSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUFuaW1hdGlvbkZyYW1lJztcbmltcG9ydCB7IHVzZVRpbWVvdXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VUaW1lb3V0JztcbmltcG9ydCB7IEVNUFRZX09CSkVDVCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2VtcHR5JztcbmltcG9ydCB7IGdldFRhcmdldCwgaXNUeXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vdXRpbHMvZWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgaXNNb3VzZUxpa2VQb2ludGVyVHlwZSB9IGZyb20gXCIuLi91dGlscy9ldmVudC5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbi8qKlxuICogT3BlbnMgb3IgY2xvc2VzIHRoZSBmbG9hdGluZyBlbGVtZW50IHdoZW4gY2xpY2tpbmcgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL3VzZUNsaWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VDbGljayhjb250ZXh0LCBwcm9wcyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBlbmFibGVkID0gdHJ1ZSxcbiAgICBldmVudDogZXZlbnRPcHRpb24gPSAnY2xpY2snLFxuICAgIHRvZ2dsZSA9IHRydWUsXG4gICAgaWdub3JlTW91c2UgPSBmYWxzZSxcbiAgICBzdGlja0lmT3BlbiA9IHRydWUsXG4gICAgdG91Y2hPcGVuRGVsYXkgPSAwLFxuICAgIHJlYXNvbiA9IFJFQVNPTlMudHJpZ2dlclByZXNzXG4gIH0gPSBwcm9wcztcbiAgY29uc3Qgc3RvcmUgPSAncm9vdFN0b3JlJyBpbiBjb250ZXh0ID8gY29udGV4dC5yb290U3RvcmUgOiBjb250ZXh0O1xuICBjb25zdCBkYXRhUmVmID0gc3RvcmUuY29udGV4dC5kYXRhUmVmO1xuICBjb25zdCBwb2ludGVyVHlwZVJlZiA9IFJlYWN0LnVzZVJlZih1bmRlZmluZWQpO1xuICBjb25zdCBmcmFtZSA9IHVzZUFuaW1hdGlvbkZyYW1lKCk7XG4gIGNvbnN0IHRvdWNoT3BlblRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIGNvbnN0IHJlZmVyZW5jZSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGZ1bmN0aW9uIHNldE9wZW5XaXRoVG91Y2hEZWxheShuZXh0T3BlbiwgbmF0aXZlRXZlbnQsIHRhcmdldCwgcG9pbnRlclR5cGUpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMocmVhc29uLCBuYXRpdmVFdmVudCwgdGFyZ2V0KTtcbiAgICAgIGlmIChuZXh0T3BlbiAmJiBwb2ludGVyVHlwZSA9PT0gJ3RvdWNoJyAmJiB0b3VjaE9wZW5EZWxheSA+IDApIHtcbiAgICAgICAgdG91Y2hPcGVuVGltZW91dC5zdGFydCh0b3VjaE9wZW5EZWxheSwgKCkgPT4ge1xuICAgICAgICAgIHN0b3JlLnNldE9wZW4odHJ1ZSwgZGV0YWlscyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RvcmUuc2V0T3BlbihuZXh0T3BlbiwgZGV0YWlscyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE5leHRPcGVuKG9wZW4sIGN1cnJlbnRUYXJnZXQsIGlzQ2xpY2tMaWtlT3BlbkV2ZW50KSB7XG4gICAgICBjb25zdCBvcGVuRXZlbnQgPSBkYXRhUmVmLmN1cnJlbnQub3BlbkV2ZW50O1xuICAgICAgY29uc3QgaGFzQ2xpY2tlZE9uSW5hY3RpdmVUcmlnZ2VyID0gc3RvcmUuc2VsZWN0KCdkb21SZWZlcmVuY2VFbGVtZW50JykgIT09IGN1cnJlbnRUYXJnZXQ7XG4gICAgICBpZiAob3BlbiAmJiBoYXNDbGlja2VkT25JbmFjdGl2ZVRyaWdnZXIpIHtcbiAgICAgICAgLy8gTW92aW5nIGJldHdlZW4gdHJpZ2dlcnMgc2hvdWxkIGFsd2F5cyBvcGVuIHRoZSBuZXdseSBhY3RpdmUgb25lLlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghb3Blbikge1xuICAgICAgICAvLyBBIGNsb3NlZCBwb3B1cCBzaG91bGQgb3BlbiBvbiB0aGUgbmV4dCBwcmVzcy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoIXRvZ2dsZSkge1xuICAgICAgICAvLyBOb24tdG9nZ2xlIG1vZGUgbmV2ZXIgY2xvc2VzIG9uIGEgcmVwZWF0ZWQgdHJpZ2dlciBwcmVzcy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAob3BlbkV2ZW50ICYmIHN0aWNrSWZPcGVuKSB7XG4gICAgICAgIC8vIFByZXNlcnZlIGhvdmVyL2ZvY3VzLW9wZW5lZCBwb3B1cHMgdW50aWwgdGhlIG1hdGNoaW5nIGNsaWNrLWxpa2UgZXZlbnQgY2xvc2VzIHRoZW0uXG4gICAgICAgIHJldHVybiAhaXNDbGlja0xpa2VPcGVuRXZlbnQob3BlbkV2ZW50LnR5cGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIGEgcmVwZWF0ZWQgY2xpY2sgdG9nZ2xlcyB0aGUgcG9wdXAgY2xvc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgb25Qb2ludGVyRG93bihldmVudCkge1xuICAgICAgICBwb2ludGVyVHlwZVJlZi5jdXJyZW50ID0gZXZlbnQucG9pbnRlclR5cGU7XG4gICAgICB9LFxuICAgICAgb25Nb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgcG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZVJlZi5jdXJyZW50O1xuICAgICAgICBjb25zdCBuYXRpdmVFdmVudCA9IGV2ZW50Lm5hdGl2ZUV2ZW50O1xuICAgICAgICBjb25zdCBvcGVuID0gc3RvcmUuc2VsZWN0KCdvcGVuJyk7XG5cbiAgICAgICAgLy8gSWdub3JlIGFsbCBidXR0b25zIGV4Y2VwdCBmb3IgdGhlIFwibWFpblwiIGJ1dHRvbi5cbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL01vdXNlRXZlbnQvYnV0dG9uXG4gICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgfHwgZXZlbnRPcHRpb24gPT09ICdjbGljaycgfHwgaXNNb3VzZUxpa2VQb2ludGVyVHlwZShwb2ludGVyVHlwZSwgdHJ1ZSkgJiYgaWdub3JlTW91c2UpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dE9wZW4gPSBnZXROZXh0T3BlbihvcGVuLCBldmVudC5jdXJyZW50VGFyZ2V0LCBvcGVuRXZlbnRUeXBlID0+IG9wZW5FdmVudFR5cGUgPT09ICdjbGljaycgfHwgb3BlbkV2ZW50VHlwZSA9PT0gJ21vdXNlZG93bicpO1xuXG4gICAgICAgIC8vIEFuaW1hdGlvbnMgc29tZXRpbWVzIHdvbid0IHJ1biBvbiBhIHR5cGVhYmxlIGVsZW1lbnQgaWYgdXNpbmcgYSByQUYuXG4gICAgICAgIC8vIEZvY3VzIGlzIGFsd2F5cyBzZXQgb24gdGhlc2UgZWxlbWVudHMuIEZvciB0b3VjaCwgd2UgbWF5IGRlbGF5IG9wZW5pbmcuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChuYXRpdmVFdmVudCk7XG4gICAgICAgIGlmIChpc1R5cGVhYmxlRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICAgICAgc2V0T3BlbldpdGhUb3VjaERlbGF5KG5leHRPcGVuLCBuYXRpdmVFdmVudCwgdGFyZ2V0LCBwb2ludGVyVHlwZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FwdHVyZSB0aGUgY3VycmVudFRhcmdldCBiZWZvcmUgdGhlIHJBRi5cbiAgICAgICAgLy8gYXMgUmVhY3Qgc2V0cyBpdCB0byBudWxsIGFmdGVyIHRoZSBldmVudCBoYW5kbGVyIGNvbXBsZXRlcy5cbiAgICAgICAgY29uc3QgZXZlbnRDdXJyZW50VGFyZ2V0ID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuICAgICAgICAvLyBXYWl0IHVudGlsIGZvY3VzIGlzIHNldCBvbiB0aGUgZWxlbWVudC4gVGhpcyBpcyBhbiBhbHRlcm5hdGl2ZSB0b1xuICAgICAgICAvLyBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgdG8gYXZvaWQgOmZvY3VzLXZpc2libGUgZnJvbSBhcHBlYXJpbmcgd2hlbiB1c2luZyBhIHBvaW50ZXIuXG4gICAgICAgIGZyYW1lLnJlcXVlc3QoKCkgPT4ge1xuICAgICAgICAgIHNldE9wZW5XaXRoVG91Y2hEZWxheShuZXh0T3BlbiwgbmF0aXZlRXZlbnQsIGV2ZW50Q3VycmVudFRhcmdldCwgcG9pbnRlclR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBvbkNsaWNrKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudE9wdGlvbiA9PT0gJ21vdXNlZG93bi1vbmx5Jykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwb2ludGVyVHlwZSA9IHBvaW50ZXJUeXBlUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChldmVudE9wdGlvbiA9PT0gJ21vdXNlZG93bicgJiYgcG9pbnRlclR5cGUpIHtcbiAgICAgICAgICBwb2ludGVyVHlwZVJlZi5jdXJyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNNb3VzZUxpa2VQb2ludGVyVHlwZShwb2ludGVyVHlwZSwgdHJ1ZSkgJiYgaWdub3JlTW91c2UpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3BlbiA9IHN0b3JlLnNlbGVjdCgnb3BlbicpO1xuICAgICAgICBjb25zdCBuZXh0T3BlbiA9IGdldE5leHRPcGVuKG9wZW4sIGV2ZW50LmN1cnJlbnRUYXJnZXQsIG9wZW5FdmVudFR5cGUgPT4gb3BlbkV2ZW50VHlwZSA9PT0gJ2NsaWNrJyB8fCBvcGVuRXZlbnRUeXBlID09PSAnbW91c2Vkb3duJyB8fCBvcGVuRXZlbnRUeXBlID09PSAna2V5ZG93bicgfHwgb3BlbkV2ZW50VHlwZSA9PT0gJ2tleXVwJyk7XG4gICAgICAgIHNldE9wZW5XaXRoVG91Y2hEZWxheShuZXh0T3BlbiwgZXZlbnQubmF0aXZlRXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQsIHBvaW50ZXJUeXBlKTtcbiAgICAgIH0sXG4gICAgICBvbktleURvd24oKSB7XG4gICAgICAgIHBvaW50ZXJUeXBlUmVmLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2RhdGFSZWYsIGV2ZW50T3B0aW9uLCBpZ25vcmVNb3VzZSwgcmVhc29uLCBzdG9yZSwgc3RpY2tJZk9wZW4sIHRvZ2dsZSwgZnJhbWUsIHRvdWNoT3BlblRpbWVvdXQsIHRvdWNoT3BlbkRlbGF5XSk7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+IGVuYWJsZWQgPyB7XG4gICAgcmVmZXJlbmNlXG4gIH0gOiBFTVBUWV9PQkpFQ1QsIFtlbmFibGVkLCByZWZlcmVuY2VdKTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVyc2NvcmUtZGFuZ2xlICovXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBhZGRFdmVudExpc3RlbmVyIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvYWRkRXZlbnRMaXN0ZW5lcic7XG5pbXBvcnQgeyBtZXJnZUNsZWFudXBzIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvbWVyZ2VDbGVhbnVwcyc7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBUaW1lb3V0LCB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyBnZXRDb21wdXRlZFN0eWxlLCBnZXRQYXJlbnROb2RlLCBpc0VsZW1lbnQsIGlzSFRNTEVsZW1lbnQsIGlzTGFzdFRyYXZlcnNhYmxlTm9kZSwgaXNTaGFkb3dSb290LCBpc1dlYktpdCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgdXNlRmxvYXRpbmdUcmVlIH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvRmxvYXRpbmdUcmVlLmpzXCI7XG5pbXBvcnQgeyBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL2NyZWF0ZUJhc2VVSUV2ZW50RGV0YWlscy5qc1wiO1xuaW1wb3J0IHsgUkVBU09OUyB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvcmVhc29ucy5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlQXR0cmlidXRlIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUF0dHJpYnV0ZS5qc1wiO1xuaW1wb3J0IHsgY29udGFpbnMsIGdldFRhcmdldCwgaXNFdmVudFRhcmdldFdpdGhpbiwgaXNSb290RWxlbWVudCB9IGZyb20gXCIuLi91dGlscy9lbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBpc1JlYWN0RXZlbnQgfSBmcm9tIFwiLi4vdXRpbHMvZXZlbnQuanNcIjtcbmltcG9ydCB7IGdldE5vZGVDaGlsZHJlbiB9IGZyb20gXCIuLi91dGlscy9ub2Rlcy5qc1wiO1xuY29uc3QgYnViYmxlSGFuZGxlcktleXMgPSB7XG4gIGludGVudGlvbmFsOiAnb25DbGljaycsXG4gIHNsb3BweTogJ29uUG9pbnRlckRvd24nXG59O1xuZnVuY3Rpb24gYWx3YXlzRmFsc2UoKSB7XG4gIHJldHVybiBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9wKG5vcm1hbGl6YWJsZSkge1xuICByZXR1cm4ge1xuICAgIGVzY2FwZUtleTogdHlwZW9mIG5vcm1hbGl6YWJsZSA9PT0gJ2Jvb2xlYW4nID8gbm9ybWFsaXphYmxlIDogbm9ybWFsaXphYmxlPy5lc2NhcGVLZXkgPz8gZmFsc2UsXG4gICAgb3V0c2lkZVByZXNzOiB0eXBlb2Ygbm9ybWFsaXphYmxlID09PSAnYm9vbGVhbicgPyBub3JtYWxpemFibGUgOiBub3JtYWxpemFibGU/Lm91dHNpZGVQcmVzcyA/PyB0cnVlXG4gIH07XG59XG4vKipcbiAqIENsb3NlcyB0aGUgZmxvYXRpbmcgZWxlbWVudCB3aGVuIGEgZGlzbWlzc2FsIGlzIHJlcXVlc3RlZCDigJQgYnkgZGVmYXVsdCwgd2hlblxuICogdGhlIHVzZXIgcHJlc3NlcyB0aGUgYGVzY2FwZWAga2V5IG9yIG91dHNpZGUgb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvdXNlRGlzbWlzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRGlzbWlzcyhjb250ZXh0LCBwcm9wcyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBlbmFibGVkID0gdHJ1ZSxcbiAgICBlc2NhcGVLZXkgPSB0cnVlLFxuICAgIG91dHNpZGVQcmVzczogb3V0c2lkZVByZXNzUHJvcCA9IHRydWUsXG4gICAgb3V0c2lkZVByZXNzRXZlbnQgPSAnc2xvcHB5JyxcbiAgICByZWZlcmVuY2VQcmVzcyA9IGFsd2F5c0ZhbHNlLFxuICAgIHJlZmVyZW5jZVByZXNzRXZlbnQgPSAnc2xvcHB5JyxcbiAgICBidWJibGVzLFxuICAgIGV4dGVybmFsVHJlZVxuICB9ID0gcHJvcHM7XG4gIGNvbnN0IHN0b3JlID0gJ3Jvb3RTdG9yZScgaW4gY29udGV4dCA/IGNvbnRleHQucm9vdFN0b3JlIDogY29udGV4dDtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IGZsb2F0aW5nRWxlbWVudCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ0VsZW1lbnQnKTtcbiAgY29uc3Qge1xuICAgIGRhdGFSZWZcbiAgfSA9IHN0b3JlLmNvbnRleHQ7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoZXh0ZXJuYWxUcmVlKTtcbiAgY29uc3Qgb3V0c2lkZVByZXNzRm4gPSB1c2VTdGFibGVDYWxsYmFjayh0eXBlb2Ygb3V0c2lkZVByZXNzUHJvcCA9PT0gJ2Z1bmN0aW9uJyA/IG91dHNpZGVQcmVzc1Byb3AgOiAoKSA9PiBmYWxzZSk7XG4gIGNvbnN0IG91dHNpZGVQcmVzcyA9IHR5cGVvZiBvdXRzaWRlUHJlc3NQcm9wID09PSAnZnVuY3Rpb24nID8gb3V0c2lkZVByZXNzRm4gOiBvdXRzaWRlUHJlc3NQcm9wO1xuICBjb25zdCBvdXRzaWRlUHJlc3NFbmFibGVkID0gb3V0c2lkZVByZXNzICE9PSBmYWxzZTtcbiAgY29uc3QgZ2V0T3V0c2lkZVByZXNzRXZlbnRQcm9wID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4gb3V0c2lkZVByZXNzRXZlbnQpO1xuICBjb25zdCB7XG4gICAgZXNjYXBlS2V5OiBlc2NhcGVLZXlCdWJibGVzLFxuICAgIG91dHNpZGVQcmVzczogb3V0c2lkZVByZXNzQnViYmxlc1xuICB9ID0gbm9ybWFsaXplUHJvcChidWJibGVzKTtcbiAgY29uc3QgcHJlc3NTdGFydGVkSW5zaWRlUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcHJlc3NTdGFydFByZXZlbnRlZFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIC8vIElnbm9yZSBvbmx5IHRoZSB2ZXJ5IG5leHQgb3V0c2lkZSBjbGljayBhZnRlciBkcmFnZ2luZyBmcm9tIGluc2lkZSB0byBvdXRzaWRlLlxuICBjb25zdCBzdXBwcmVzc05leHRPdXRzaWRlQ2xpY2tSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBpc0NvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGN1cnJlbnRQb2ludGVyVHlwZVJlZiA9IFJlYWN0LnVzZVJlZignJyk7XG4gIGNvbnN0IHRvdWNoU3RhdGVSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGNhbmNlbERpc21pc3NPbkVuZFRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIGNvbnN0IGNsZWFySW5zaWRlUmVhY3RUcmVlVGltZW91dCA9IHVzZVRpbWVvdXQoKTtcbiAgY29uc3QgY2xlYXJJbnNpZGVSZWFjdFRyZWUgPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgY2xlYXJJbnNpZGVSZWFjdFRyZWVUaW1lb3V0LmNsZWFyKCk7XG4gICAgZGF0YVJlZi5jdXJyZW50Lmluc2lkZVJlYWN0VHJlZSA9IGZhbHNlO1xuICB9KTtcbiAgY29uc3QgaGFzQmxvY2tpbmdDaGlsZCA9IHVzZVN0YWJsZUNhbGxiYWNrKGJ1YmJsZUtleSA9PiB7XG4gICAgY29uc3Qgbm9kZUlkID0gZGF0YVJlZi5jdXJyZW50LmZsb2F0aW5nQ29udGV4dD8ubm9kZUlkO1xuICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZSA/IGdldE5vZGVDaGlsZHJlbih0cmVlLm5vZGVzUmVmLmN1cnJlbnQsIG5vZGVJZCkgOiBbXTtcbiAgICByZXR1cm4gY2hpbGRyZW4uc29tZShjaGlsZCA9PiBjaGlsZC5jb250ZXh0Py5vcGVuICYmICFjaGlsZC5jb250ZXh0LmRhdGFSZWYuY3VycmVudFtidWJibGVLZXldKTtcbiAgfSk7XG4gIGNvbnN0IGlzRXZlbnRXaXRoaW5Pd25FbGVtZW50cyA9IHVzZVN0YWJsZUNhbGxiYWNrKGV2ZW50ID0+IHtcbiAgICByZXR1cm4gaXNFdmVudFRhcmdldFdpdGhpbihldmVudCwgc3RvcmUuc2VsZWN0KCdmbG9hdGluZ0VsZW1lbnQnKSkgfHwgaXNFdmVudFRhcmdldFdpdGhpbihldmVudCwgc3RvcmUuc2VsZWN0KCdkb21SZWZlcmVuY2VFbGVtZW50JykpO1xuICB9KTtcbiAgY29uc3QgY2xvc2VPblJlZmVyZW5jZVByZXNzID0gdXNlU3RhYmxlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIGlmICghcmVmZXJlbmNlUHJlc3MoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy50cmlnZ2VyUHJlc3MsIGV2ZW50Lm5hdGl2ZUV2ZW50KSk7XG4gIH0pO1xuICBjb25zdCBjbG9zZU9uRXNjYXBlS2V5RG93biA9IHVzZVN0YWJsZUNhbGxiYWNrKGV2ZW50ID0+IHtcbiAgICBpZiAoIW9wZW4gfHwgIWVuYWJsZWQgfHwgIWVzY2FwZUtleSB8fCBldmVudC5rZXkgIT09ICdFc2NhcGUnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2FpdCB1bnRpbCBJTUUgaXMgc2V0dGxlZC4gUHJlc3NpbmcgYEVzY2FwZWAgd2hpbGUgY29tcG9zaW5nIHNob3VsZFxuICAgIC8vIGNsb3NlIHRoZSBjb21wb3NlIG1lbnUsIGJ1dCBub3QgdGhlIGZsb2F0aW5nIGVsZW1lbnQuXG4gICAgaWYgKGlzQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFlc2NhcGVLZXlCdWJibGVzICYmIGhhc0Jsb2NraW5nQ2hpbGQoJ19fZXNjYXBlS2V5QnViYmxlcycpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5hdGl2ZSA9IGlzUmVhY3RFdmVudChldmVudCkgPyBldmVudC5uYXRpdmVFdmVudCA6IGV2ZW50O1xuICAgIGNvbnN0IGV2ZW50RGV0YWlscyA9IGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLmVzY2FwZUtleSwgbmF0aXZlKTtcbiAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBldmVudERldGFpbHMpO1xuICAgIGlmICghZXZlbnREZXRhaWxzLmlzQ2FuY2VsZWQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICAgIGlmICghZXNjYXBlS2V5QnViYmxlcyAmJiAhZXZlbnREZXRhaWxzLmlzUHJvcGFnYXRpb25BbGxvd2VkKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBtYXJrSW5zaWRlUmVhY3RUcmVlID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRhdGFSZWYuY3VycmVudC5pbnNpZGVSZWFjdFRyZWUgPSB0cnVlO1xuICAgIGNsZWFySW5zaWRlUmVhY3RUcmVlVGltZW91dC5zdGFydCgwLCBjbGVhckluc2lkZVJlYWN0VHJlZSk7XG4gIH0pO1xuICBjb25zdCBtYXJrUHJlc3NTdGFydGVkSW5zaWRlUmVhY3RUcmVlID0gdXNlU3RhYmxlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIGlmICghb3BlbiB8fCAhZW5hYmxlZCB8fCBldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50Lm5hdGl2ZUV2ZW50KTtcblxuICAgIC8vIE9ubHkgdHJlYXQgcHJlc3NlcyB0aGF0IHN0YXJ0IHdpdGhpbiB0aGUgZmxvYXRpbmcgRE9NIHN1YnRyZWUgYXMgaW5zaWRlLlxuICAgIC8vIFRoaXMgYXZvaWRzIHN1cHByZXNzaW5nIHBhcmVudCBkaXNtaXNzYWwgd2hlbiBpbnRlcmFjdGluZyB3aXRoIG5lc3RlZCBwb3J0YWxzLlxuICAgIGlmICghY29udGFpbnMoc3RvcmUuc2VsZWN0KCdmbG9hdGluZ0VsZW1lbnQnKSwgdGFyZ2V0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXByZXNzU3RhcnRlZEluc2lkZVJlZi5jdXJyZW50KSB7XG4gICAgICBwcmVzc1N0YXJ0ZWRJbnNpZGVSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBwcmVzc1N0YXJ0UHJldmVudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBtYXJrSW5zaWRlUHJlc3NTdGFydFByZXZlbnRlZCA9IHVzZVN0YWJsZUNhbGxiYWNrKGV2ZW50ID0+IHtcbiAgICBpZiAoIW9wZW4gfHwgIWVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCEoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCB8fCBldmVudC5uYXRpdmVFdmVudC5kZWZhdWx0UHJldmVudGVkKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocHJlc3NTdGFydGVkSW5zaWRlUmVmLmN1cnJlbnQpIHtcbiAgICAgIHByZXNzU3RhcnRQcmV2ZW50ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfVxuICB9KTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIW9wZW4gfHwgIWVuYWJsZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGRhdGFSZWYuY3VycmVudC5fX2VzY2FwZUtleUJ1YmJsZXMgPSBlc2NhcGVLZXlCdWJibGVzO1xuICAgIGRhdGFSZWYuY3VycmVudC5fX291dHNpZGVQcmVzc0J1YmJsZXMgPSBvdXRzaWRlUHJlc3NCdWJibGVzO1xuICAgIGNvbnN0IGNvbXBvc2l0aW9uVGltZW91dCA9IG5ldyBUaW1lb3V0KCk7XG4gICAgY29uc3QgcHJldmVudGVkUHJlc3NTdXBwcmVzc2lvblRpbWVvdXQgPSBuZXcgVGltZW91dCgpO1xuICAgIGZ1bmN0aW9uIGhhbmRsZUNvbXBvc2l0aW9uU3RhcnQoKSB7XG4gICAgICBjb21wb3NpdGlvblRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIGlzQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVDb21wb3NpdGlvbkVuZCgpIHtcbiAgICAgIC8vIFNhZmFyaSBmaXJlcyBgY29tcG9zaXRpb25lbmRgIGJlZm9yZSBga2V5ZG93bmAsIHNvIHdlIG5lZWQgdG8gd2FpdFxuICAgICAgLy8gdW50aWwgdGhlIG5leHQgdGljayB0byBzZXQgYGlzQ29tcG9zaW5nYCB0byBgZmFsc2VgLlxuICAgICAgLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE2NTAwNFxuICAgICAgY29tcG9zaXRpb25UaW1lb3V0LnN0YXJ0KFxuICAgICAgLy8gMG1zIG9yIDFtcyBkb24ndCB3b3JrIGluIFNhZmFyaS4gNW1zIGFwcGVhcnMgdG8gY29uc2lzdGVudGx5IHdvcmsuXG4gICAgICAvLyBPbmx5IGFwcGx5IHRvIFdlYktpdCBmb3IgdGhlIHRlc3QgdG8gcmVtYWluIDBtcy5cbiAgICAgIGlzV2ViS2l0KCkgPyA1IDogMCwgKCkgPT4ge1xuICAgICAgICBpc0NvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3VwcHJlc3NJbW1lZGlhdGVPdXRzaWRlQ2xpY2tBZnRlclByZXZlbnRlZFN0YXJ0KCkge1xuICAgICAgc3VwcHJlc3NOZXh0T3V0c2lkZUNsaWNrUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgLy8gRmlyZWZveCBjYW4gZW1pdCB0aGUgc3ludGhldGljIG91dHNpZGUgY2xpY2sgaW4gYSBsYXRlciB0YXNrIGFmdGVyXG4gICAgICAvLyBwb2ludGVyIGxvY2sgZXhpdCwgc28gbWljcm90YXNrIGNsZWFyaW5nIGlzIHRvbyBlYXJseSBoZXJlLlxuICAgICAgcHJldmVudGVkUHJlc3NTdXBwcmVzc2lvblRpbWVvdXQuc3RhcnQoMCwgKCkgPT4ge1xuICAgICAgICBzdXBwcmVzc05leHRPdXRzaWRlQ2xpY2tSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc2V0UHJlc3NTdGFydFN0YXRlKCkge1xuICAgICAgcHJlc3NTdGFydGVkSW5zaWRlUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHByZXNzU3RhcnRQcmV2ZW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRPdXRzaWRlUHJlc3NFdmVudCgpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBjdXJyZW50UG9pbnRlclR5cGVSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IGNvbXB1dGVkVHlwZSA9IHR5cGUgPT09ICdwZW4nIHx8ICF0eXBlID8gJ21vdXNlJyA6IHR5cGU7XG4gICAgICBjb25zdCBvdXRzaWRlUHJlc3NFdmVudFZhbHVlID0gZ2V0T3V0c2lkZVByZXNzRXZlbnRQcm9wKCk7XG4gICAgICBjb25zdCByZXNvbHZlZCA9IHR5cGVvZiBvdXRzaWRlUHJlc3NFdmVudFZhbHVlID09PSAnZnVuY3Rpb24nID8gb3V0c2lkZVByZXNzRXZlbnRWYWx1ZSgpIDogb3V0c2lkZVByZXNzRXZlbnRWYWx1ZTtcbiAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNvbHZlZFtjb21wdXRlZFR5cGVdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaG91bGRJZ25vcmVFdmVudChldmVudCkge1xuICAgICAgY29uc3QgY29tcHV0ZWRPdXRzaWRlUHJlc3NFdmVudCA9IGdldE91dHNpZGVQcmVzc0V2ZW50KCk7XG4gICAgICByZXR1cm4gY29tcHV0ZWRPdXRzaWRlUHJlc3NFdmVudCA9PT0gJ2ludGVudGlvbmFsJyAmJiBldmVudC50eXBlICE9PSAnY2xpY2snIHx8IGNvbXB1dGVkT3V0c2lkZVByZXNzRXZlbnQgPT09ICdzbG9wcHknICYmIGV2ZW50LnR5cGUgPT09ICdjbGljayc7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzRXZlbnRXaXRoaW5GbG9hdGluZ1RyZWUoZXZlbnQpIHtcbiAgICAgIGNvbnN0IG5vZGVJZCA9IGRhdGFSZWYuY3VycmVudC5mbG9hdGluZ0NvbnRleHQ/Lm5vZGVJZDtcbiAgICAgIGNvbnN0IHRhcmdldElzSW5zaWRlQ2hpbGRyZW4gPSB0cmVlICYmIGdldE5vZGVDaGlsZHJlbih0cmVlLm5vZGVzUmVmLmN1cnJlbnQsIG5vZGVJZCkuc29tZShub2RlID0+IGlzRXZlbnRUYXJnZXRXaXRoaW4oZXZlbnQsIG5vZGUuY29udGV4dD8uZWxlbWVudHMuZmxvYXRpbmcpKTtcbiAgICAgIHJldHVybiBpc0V2ZW50V2l0aGluT3duRWxlbWVudHMoZXZlbnQpIHx8IHRhcmdldElzSW5zaWRlQ2hpbGRyZW47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsb3NlT25QcmVzc091dHNpZGUoZXZlbnQpIHtcbiAgICAgIGlmIChzaG91bGRJZ25vcmVFdmVudChldmVudCkpIHtcbiAgICAgICAgLy8gQSBuZXcgcHJlc3MgYmVnYW4gb3V0c2lkZSB0aGUgZmxvYXRpbmcgZWxlbWVudCBhbmQgaXRzIHRyaWdnZXIuIENsZWFyIGFueVxuICAgICAgICAvLyBsZWZ0b3ZlciBkcmFnLW91dCBzdXBwcmVzc2lvbiBzbyB0aGlzIHByZXNzJ3MgZXZlbnR1YWwgY2xpY2sgY2FuIGRpc21pc3MuXG4gICAgICAgIGlmIChldmVudC50eXBlICE9PSAnY2xpY2snICYmICFpc0V2ZW50V2l0aGluT3duRWxlbWVudHMoZXZlbnQpKSB7XG4gICAgICAgICAgcHJldmVudGVkUHJlc3NTdXBwcmVzc2lvblRpbWVvdXQuY2xlYXIoKTtcbiAgICAgICAgICBzdXBwcmVzc05leHRPdXRzaWRlQ2xpY2tSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFySW5zaWRlUmVhY3RUcmVlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChkYXRhUmVmLmN1cnJlbnQuaW5zaWRlUmVhY3RUcmVlKSB7XG4gICAgICAgIGNsZWFySW5zaWRlUmVhY3RUcmVlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgICBjb25zdCBpbmVydFNlbGVjdG9yID0gYFske2NyZWF0ZUF0dHJpYnV0ZSgnaW5lcnQnKX1dYDtcbiAgICAgIGNvbnN0IHRhcmdldFJvb3QgPSBpc0VsZW1lbnQodGFyZ2V0KSA/IHRhcmdldC5nZXRSb290Tm9kZSgpIDogbnVsbDtcbiAgICAgIGNvbnN0IG1hcmtlcnMgPSBBcnJheS5mcm9tKChpc1NoYWRvd1Jvb3QodGFyZ2V0Um9vdCkgPyB0YXJnZXRSb290IDogb3duZXJEb2N1bWVudChzdG9yZS5zZWxlY3QoJ2Zsb2F0aW5nRWxlbWVudCcpKSkucXVlcnlTZWxlY3RvckFsbChpbmVydFNlbGVjdG9yKSk7XG4gICAgICBjb25zdCB0cmlnZ2VycyA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzO1xuXG4gICAgICAvLyBJZiBhbm90aGVyIHRyaWdnZXIgaXMgY2xpY2tlZCwgZG9uJ3QgY2xvc2UgdGhlIGZsb2F0aW5nIGVsZW1lbnQuXG4gICAgICBpZiAodGFyZ2V0ICYmICh0cmlnZ2Vycy5oYXNFbGVtZW50KHRhcmdldCkgfHwgdHJpZ2dlcnMuaGFzTWF0Y2hpbmdFbGVtZW50KHRyaWdnZXIgPT4gY29udGFpbnModHJpZ2dlciwgdGFyZ2V0KSkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCB0YXJnZXRSb290QW5jZXN0b3IgPSBpc0VsZW1lbnQodGFyZ2V0KSA/IHRhcmdldCA6IG51bGw7XG4gICAgICB3aGlsZSAodGFyZ2V0Um9vdEFuY2VzdG9yICYmICFpc0xhc3RUcmF2ZXJzYWJsZU5vZGUodGFyZ2V0Um9vdEFuY2VzdG9yKSkge1xuICAgICAgICBjb25zdCBuZXh0UGFyZW50ID0gZ2V0UGFyZW50Tm9kZSh0YXJnZXRSb290QW5jZXN0b3IpO1xuICAgICAgICBpZiAoaXNMYXN0VHJhdmVyc2FibGVOb2RlKG5leHRQYXJlbnQpIHx8ICFpc0VsZW1lbnQobmV4dFBhcmVudCkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXRSb290QW5jZXN0b3IgPSBuZXh0UGFyZW50O1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgY2xpY2sgb2NjdXJyZWQgb24gYSB0aGlyZC1wYXJ0eSBlbGVtZW50IGluamVjdGVkIGFmdGVyIHRoZVxuICAgICAgLy8gZmxvYXRpbmcgZWxlbWVudCByZW5kZXJlZC5cbiAgICAgIGlmIChtYXJrZXJzLmxlbmd0aCAmJiBpc0VsZW1lbnQodGFyZ2V0KSAmJiAhaXNSb290RWxlbWVudCh0YXJnZXQpICYmXG4gICAgICAvLyBDbGlja2VkIG9uIGEgZGlyZWN0IGFuY2VzdG9yIChlLmcuIEZsb2F0aW5nT3ZlcmxheSkuXG4gICAgICAhY29udGFpbnModGFyZ2V0LCBzdG9yZS5zZWxlY3QoJ2Zsb2F0aW5nRWxlbWVudCcpKSAmJlxuICAgICAgLy8gSWYgdGhlIHRhcmdldCByb290IGVsZW1lbnQgY29udGFpbnMgbm9uZSBvZiB0aGUgbWFya2VycywgdGhlbiB0aGVcbiAgICAgIC8vIGVsZW1lbnQgd2FzIGluamVjdGVkIGFmdGVyIHRoZSBmbG9hdGluZyBlbGVtZW50IHJlbmRlcmVkLlxuICAgICAgbWFya2Vycy5ldmVyeShtYXJrZXIgPT4gIWNvbnRhaW5zKHRhcmdldFJvb3RBbmNlc3RvciwgbWFya2VyKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgY2xpY2sgb2NjdXJyZWQgb24gdGhlIHNjcm9sbGJhclxuICAgICAgLy8gU2tpcCBmb3IgdG91Y2ggZXZlbnRzOiBzY3JvbGxiYXJzIGRvbid0IHJlY2VpdmUgdG91Y2ggZXZlbnRzIG9uIG1vc3QgcGxhdGZvcm1zXG4gICAgICBpZiAoaXNIVE1MRWxlbWVudCh0YXJnZXQpICYmICEoJ3RvdWNoZXMnIGluIGV2ZW50KSkge1xuICAgICAgICBjb25zdCBsYXN0VHJhdmVyc2FibGVOb2RlID0gaXNMYXN0VHJhdmVyc2FibGVOb2RlKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuICAgICAgICBjb25zdCBzY3JvbGxSZSA9IC9hdXRvfHNjcm9sbC87XG4gICAgICAgIGNvbnN0IGlzU2Nyb2xsYWJsZVggPSBsYXN0VHJhdmVyc2FibGVOb2RlIHx8IHNjcm9sbFJlLnRlc3Qoc3R5bGUub3ZlcmZsb3dYKTtcbiAgICAgICAgY29uc3QgaXNTY3JvbGxhYmxlWSA9IGxhc3RUcmF2ZXJzYWJsZU5vZGUgfHwgc2Nyb2xsUmUudGVzdChzdHlsZS5vdmVyZmxvd1kpO1xuICAgICAgICBjb25zdCBjYW5TY3JvbGxYID0gaXNTY3JvbGxhYmxlWCAmJiB0YXJnZXQuY2xpZW50V2lkdGggPiAwICYmIHRhcmdldC5zY3JvbGxXaWR0aCA+IHRhcmdldC5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgY2FuU2Nyb2xsWSA9IGlzU2Nyb2xsYWJsZVkgJiYgdGFyZ2V0LmNsaWVudEhlaWdodCA+IDAgJiYgdGFyZ2V0LnNjcm9sbEhlaWdodCA+IHRhcmdldC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGlzUlRMID0gc3R5bGUuZGlyZWN0aW9uID09PSAncnRsJztcblxuICAgICAgICAvLyBDaGVjayBjbGljayBwb3NpdGlvbiByZWxhdGl2ZSB0byBzY3JvbGxiYXIuXG4gICAgICAgIC8vIEluIHNvbWUgYnJvd3NlcnMgaXQgaXMgcG9zc2libGUgdG8gY2hhbmdlIHRoZSA8Ym9keT4gKG9yIHdpbmRvdylcbiAgICAgICAgLy8gc2Nyb2xsYmFyIHRvIHRoZSBsZWZ0IHNpZGUsIGJ1dCBpcyB2ZXJ5IHJhcmUgYW5kIGlzIGRpZmZpY3VsdCB0b1xuICAgICAgICAvLyBjaGVjayBmb3IuIFBsdXMsIGZvciBtb2RhbCBkaWFsb2dzIHdpdGggYmFja2Ryb3BzLCBpdCBpcyBtb3JlXG4gICAgICAgIC8vIGltcG9ydGFudCB0aGF0IHRoZSBiYWNrZHJvcCBpcyBjaGVja2VkIGJ1dCBub3Qgc28gbXVjaCB0aGUgd2luZG93LlxuICAgICAgICBjb25zdCBwcmVzc2VkVmVydGljYWxTY3JvbGxiYXIgPSBjYW5TY3JvbGxZICYmIChpc1JUTCA/IGV2ZW50Lm9mZnNldFggPD0gdGFyZ2V0Lm9mZnNldFdpZHRoIC0gdGFyZ2V0LmNsaWVudFdpZHRoIDogZXZlbnQub2Zmc2V0WCA+IHRhcmdldC5jbGllbnRXaWR0aCk7XG4gICAgICAgIGNvbnN0IHByZXNzZWRIb3Jpem9udGFsU2Nyb2xsYmFyID0gY2FuU2Nyb2xsWCAmJiBldmVudC5vZmZzZXRZID4gdGFyZ2V0LmNsaWVudEhlaWdodDtcbiAgICAgICAgaWYgKHByZXNzZWRWZXJ0aWNhbFNjcm9sbGJhciB8fCBwcmVzc2VkSG9yaXpvbnRhbFNjcm9sbGJhcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzRXZlbnRXaXRoaW5GbG9hdGluZ1RyZWUoZXZlbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gaW50ZW50aW9uYWwgbW9kZSwgYSBwcmVzcyB0aGF0IHN0YXJ0cyBpbnNpZGUgYW5kIGVuZHMgb3V0c2lkZSBnZXRzXG4gICAgICAvLyBvbmUgc3VwcHJlc3NlZCBvdXRzaWRlIGNsaWNrLiBSdW4gdGhpcyBhZnRlciBpbnNpZGUtdGFyZ2V0IGNoZWNrcyBzb1xuICAgICAgLy8gaW5zaWRlIGNsaWNrcyBkb24ndCBjb25zdW1lIHRoZSBvbmUtc2hvdCBzdXBwcmVzc2lvbi5cbiAgICAgIGlmIChnZXRPdXRzaWRlUHJlc3NFdmVudCgpID09PSAnaW50ZW50aW9uYWwnICYmIHN1cHByZXNzTmV4dE91dHNpZGVDbGlja1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHByZXZlbnRlZFByZXNzU3VwcHJlc3Npb25UaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIHN1cHByZXNzTmV4dE91dHNpZGVDbGlja1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2Ygb3V0c2lkZVByZXNzID09PSAnZnVuY3Rpb24nICYmICFvdXRzaWRlUHJlc3MoZXZlbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNCbG9ja2luZ0NoaWxkKCdfX291dHNpZGVQcmVzc0J1YmJsZXMnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5vdXRzaWRlUHJlc3MsIGV2ZW50KSk7XG4gICAgICBjbGVhckluc2lkZVJlYWN0VHJlZSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVQb2ludGVyRG93bihldmVudCkge1xuICAgICAgaWYgKGdldE91dHNpZGVQcmVzc0V2ZW50KCkgIT09ICdzbG9wcHknIHx8IGV2ZW50LnBvaW50ZXJUeXBlID09PSAndG91Y2gnIHx8ICFzdG9yZS5zZWxlY3QoJ29wZW4nKSB8fCAhZW5hYmxlZCB8fCBpc0V2ZW50V2l0aGluT3duRWxlbWVudHMoZXZlbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNsb3NlT25QcmVzc091dHNpZGUoZXZlbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVUb3VjaFN0YXJ0KGV2ZW50KSB7XG4gICAgICBpZiAoZ2V0T3V0c2lkZVByZXNzRXZlbnQoKSAhPT0gJ3Nsb3BweScgfHwgIXN0b3JlLnNlbGVjdCgnb3BlbicpIHx8ICFlbmFibGVkIHx8IGlzRXZlbnRXaXRoaW5Pd25FbGVtZW50cyhldmVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgaWYgKHRvdWNoKSB7XG4gICAgICAgIHRvdWNoU3RhdGVSZWYuY3VycmVudCA9IHtcbiAgICAgICAgICBzdGFydFRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgc3RhcnRYOiB0b3VjaC5jbGllbnRYLFxuICAgICAgICAgIHN0YXJ0WTogdG91Y2guY2xpZW50WSxcbiAgICAgICAgICBkaXNtaXNzT25Ub3VjaEVuZDogZmFsc2UsXG4gICAgICAgICAgZGlzbWlzc09uTW91c2VEb3duOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIGNhbmNlbERpc21pc3NPbkVuZFRpbWVvdXQuc3RhcnQoMTAwMCwgKCkgPT4ge1xuICAgICAgICAgIGlmICh0b3VjaFN0YXRlUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRvdWNoU3RhdGVSZWYuY3VycmVudC5kaXNtaXNzT25Ub3VjaEVuZCA9IGZhbHNlO1xuICAgICAgICAgICAgdG91Y2hTdGF0ZVJlZi5jdXJyZW50LmRpc21pc3NPbk1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZFRhcmdldEV2ZW50TGlzdGVuZXJPbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVuc3Vic2NyaWJlID0gYWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIGV2ZW50LnR5cGUsICgpID0+IHtcbiAgICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZVRvdWNoU3RhcnRDYXB0dXJlKGV2ZW50KSB7XG4gICAgICBjdXJyZW50UG9pbnRlclR5cGVSZWYuY3VycmVudCA9ICd0b3VjaCc7XG4gICAgICBhZGRUYXJnZXRFdmVudExpc3RlbmVyT25jZShldmVudCwgaGFuZGxlVG91Y2hTdGFydCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsb3NlT25QcmVzc091dHNpZGVDYXB0dXJlKGV2ZW50KSB7XG4gICAgICBjYW5jZWxEaXNtaXNzT25FbmRUaW1lb3V0LmNsZWFyKCk7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ3BvaW50ZXJkb3duJykge1xuICAgICAgICBjdXJyZW50UG9pbnRlclR5cGVSZWYuY3VycmVudCA9IGV2ZW50LnBvaW50ZXJUeXBlO1xuICAgICAgfVxuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nICYmIHRvdWNoU3RhdGVSZWYuY3VycmVudCAmJiAhdG91Y2hTdGF0ZVJlZi5jdXJyZW50LmRpc21pc3NPbk1vdXNlRG93bikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhZGRUYXJnZXRFdmVudExpc3RlbmVyT25jZShldmVudCwgdGFyZ2V0RXZlbnQgPT4ge1xuICAgICAgICBpZiAodGFyZ2V0RXZlbnQudHlwZSA9PT0gJ3BvaW50ZXJkb3duJykge1xuICAgICAgICAgIGhhbmRsZVBvaW50ZXJEb3duKHRhcmdldEV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbG9zZU9uUHJlc3NPdXRzaWRlKHRhcmdldEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZVByZXNzRW5kQ2FwdHVyZShldmVudCkge1xuICAgICAgaWYgKCFwcmVzc1N0YXJ0ZWRJbnNpZGVSZWYuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwcmVzc1N0YXJ0ZWRJbnNpZGVEZWZhdWx0UHJldmVudGVkID0gcHJlc3NTdGFydFByZXZlbnRlZFJlZi5jdXJyZW50O1xuICAgICAgcmVzZXRQcmVzc1N0YXJ0U3RhdGUoKTtcbiAgICAgIGlmIChnZXRPdXRzaWRlUHJlc3NFdmVudCgpICE9PSAnaW50ZW50aW9uYWwnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudC50eXBlID09PSAncG9pbnRlcmNhbmNlbCcpIHtcbiAgICAgICAgaWYgKHByZXNzU3RhcnRlZEluc2lkZURlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICBzdXBwcmVzc0ltbWVkaWF0ZU91dHNpZGVDbGlja0FmdGVyUHJldmVudGVkU3RhcnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaXNFdmVudFdpdGhpbkZsb2F0aW5nVHJlZShldmVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBwb2ludGVyZG93biB3YXMgcHJldmVudGVkLCBubyBjbGljayBtYXkgYmUgZ2VuZXJhdGVkIGZvciB0aGF0XG4gICAgICAvLyBpbnRlcmFjdGlvbi4gSG93ZXZlciwgRmlyZWZveCBtYXkgc3RpbGwgZW1pdCBhbiBpbW1lZGlhdGUgY2xpY2sgYWZ0ZXJcbiAgICAgIC8vIHBvaW50ZXJ1cCAoZS5nLiBOdW1iZXJGaWVsZCBzY3J1YiB3aXRoIHBvaW50ZXIgbG9jayksIHNvIHN1cHByZXNzIGZvclxuICAgICAgLy8gb25lIHRpY2sgdG8gYWJzb3JiIHRoYXQgc3ludGhldGljIGNsaWNrIG9ubHkuXG4gICAgICBpZiAocHJlc3NTdGFydGVkSW5zaWRlRGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICBzdXBwcmVzc0ltbWVkaWF0ZU91dHNpZGVDbGlja0FmdGVyUHJldmVudGVkU3RhcnQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBBdm9pZCBzdXBwcmVzc2luZyB3aGVuIG91dHNpZGVQcmVzcyBleHBsaWNpdGx5IGlnbm9yZXMgdGhpcyB0YXJnZXQuXG4gICAgICBpZiAodHlwZW9mIG91dHNpZGVQcmVzcyA9PT0gJ2Z1bmN0aW9uJyAmJiAhb3V0c2lkZVByZXNzKGV2ZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwcmV2ZW50ZWRQcmVzc1N1cHByZXNzaW9uVGltZW91dC5jbGVhcigpO1xuICAgICAgc3VwcHJlc3NOZXh0T3V0c2lkZUNsaWNrUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgY2xlYXJJbnNpZGVSZWFjdFRyZWUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlVG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgICBpZiAoZ2V0T3V0c2lkZVByZXNzRXZlbnQoKSAhPT0gJ3Nsb3BweScgfHwgIXRvdWNoU3RhdGVSZWYuY3VycmVudCB8fCBpc0V2ZW50V2l0aGluT3duRWxlbWVudHMoZXZlbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcbiAgICAgIGlmICghdG91Y2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgZGVsdGFYID0gTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHRvdWNoU3RhdGVSZWYuY3VycmVudC5zdGFydFgpO1xuICAgICAgY29uc3QgZGVsdGFZID0gTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRvdWNoU3RhdGVSZWYuY3VycmVudC5zdGFydFkpO1xuICAgICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGVsdGFYICogZGVsdGFYICsgZGVsdGFZICogZGVsdGFZKTtcbiAgICAgIGlmIChkaXN0YW5jZSA+IDUpIHtcbiAgICAgICAgdG91Y2hTdGF0ZVJlZi5jdXJyZW50LmRpc21pc3NPblRvdWNoRW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChkaXN0YW5jZSA+IDEwKSB7XG4gICAgICAgIGNsb3NlT25QcmVzc091dHNpZGUoZXZlbnQpO1xuICAgICAgICBjYW5jZWxEaXNtaXNzT25FbmRUaW1lb3V0LmNsZWFyKCk7XG4gICAgICAgIHRvdWNoU3RhdGVSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZVRvdWNoTW92ZUNhcHR1cmUoZXZlbnQpIHtcbiAgICAgIGFkZFRhcmdldEV2ZW50TGlzdGVuZXJPbmNlKGV2ZW50LCBoYW5kbGVUb3VjaE1vdmUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVUb3VjaEVuZChldmVudCkge1xuICAgICAgaWYgKGdldE91dHNpZGVQcmVzc0V2ZW50KCkgIT09ICdzbG9wcHknIHx8ICF0b3VjaFN0YXRlUmVmLmN1cnJlbnQgfHwgaXNFdmVudFdpdGhpbk93bkVsZW1lbnRzKGV2ZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodG91Y2hTdGF0ZVJlZi5jdXJyZW50LmRpc21pc3NPblRvdWNoRW5kKSB7XG4gICAgICAgIGNsb3NlT25QcmVzc091dHNpZGUoZXZlbnQpO1xuICAgICAgfVxuICAgICAgY2FuY2VsRGlzbWlzc09uRW5kVGltZW91dC5jbGVhcigpO1xuICAgICAgdG91Y2hTdGF0ZVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlVG91Y2hFbmRDYXB0dXJlKGV2ZW50KSB7XG4gICAgICBhZGRUYXJnZXRFdmVudExpc3RlbmVyT25jZShldmVudCwgaGFuZGxlVG91Y2hFbmQpO1xuICAgIH1cbiAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nRWxlbWVudCk7XG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBtZXJnZUNsZWFudXBzKGVzY2FwZUtleSAmJiBtZXJnZUNsZWFudXBzKGFkZEV2ZW50TGlzdGVuZXIoZG9jLCAna2V5ZG93bicsIGNsb3NlT25Fc2NhcGVLZXlEb3duKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdjb21wb3NpdGlvbnN0YXJ0JywgaGFuZGxlQ29tcG9zaXRpb25TdGFydCksIGFkZEV2ZW50TGlzdGVuZXIoZG9jLCAnY29tcG9zaXRpb25lbmQnLCBoYW5kbGVDb21wb3NpdGlvbkVuZCkpLCBvdXRzaWRlUHJlc3NFbmFibGVkICYmIG1lcmdlQ2xlYW51cHMoYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdjbGljaycsIGNsb3NlT25QcmVzc091dHNpZGVDYXB0dXJlLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdwb2ludGVyZG93bicsIGNsb3NlT25QcmVzc091dHNpZGVDYXB0dXJlLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdwb2ludGVydXAnLCBoYW5kbGVQcmVzc0VuZENhcHR1cmUsIHRydWUpLCBhZGRFdmVudExpc3RlbmVyKGRvYywgJ3BvaW50ZXJjYW5jZWwnLCBoYW5kbGVQcmVzc0VuZENhcHR1cmUsIHRydWUpLCBhZGRFdmVudExpc3RlbmVyKGRvYywgJ21vdXNlZG93bicsIGNsb3NlT25QcmVzc091dHNpZGVDYXB0dXJlLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICdtb3VzZXVwJywgaGFuZGxlUHJlc3NFbmRDYXB0dXJlLCB0cnVlKSwgYWRkRXZlbnRMaXN0ZW5lcihkb2MsICd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hTdGFydENhcHR1cmUsIHRydWUpLCBhZGRFdmVudExpc3RlbmVyKGRvYywgJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNoTW92ZUNhcHR1cmUsIHRydWUpLCBhZGRFdmVudExpc3RlbmVyKGRvYywgJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2hFbmRDYXB0dXJlLCB0cnVlKSkpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgY29tcG9zaXRpb25UaW1lb3V0LmNsZWFyKCk7XG4gICAgICBwcmV2ZW50ZWRQcmVzc1N1cHByZXNzaW9uVGltZW91dC5jbGVhcigpO1xuICAgICAgcmVzZXRQcmVzc1N0YXJ0U3RhdGUoKTtcbiAgICAgIHN1cHByZXNzTmV4dE91dHNpZGVDbGlja1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfTtcbiAgfSwgW2RhdGFSZWYsIGZsb2F0aW5nRWxlbWVudCwgZXNjYXBlS2V5LCBvdXRzaWRlUHJlc3NFbmFibGVkLCBvdXRzaWRlUHJlc3MsIG9wZW4sIGVuYWJsZWQsIGVzY2FwZUtleUJ1YmJsZXMsIG91dHNpZGVQcmVzc0J1YmJsZXMsIGNsb3NlT25Fc2NhcGVLZXlEb3duLCBjbGVhckluc2lkZVJlYWN0VHJlZSwgZ2V0T3V0c2lkZVByZXNzRXZlbnRQcm9wLCBoYXNCbG9ja2luZ0NoaWxkLCBpc0V2ZW50V2l0aGluT3duRWxlbWVudHMsIHRyZWUsIHN0b3JlLCBjYW5jZWxEaXNtaXNzT25FbmRUaW1lb3V0XSk7XG4gIFJlYWN0LnVzZUVmZmVjdChjbGVhckluc2lkZVJlYWN0VHJlZSwgW291dHNpZGVQcmVzcywgY2xlYXJJbnNpZGVSZWFjdFRyZWVdKTtcbiAgY29uc3QgcmVmZXJlbmNlID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIG9uS2V5RG93bjogY2xvc2VPbkVzY2FwZUtleURvd24sXG4gICAgW2J1YmJsZUhhbmRsZXJLZXlzW3JlZmVyZW5jZVByZXNzRXZlbnRdXTogY2xvc2VPblJlZmVyZW5jZVByZXNzLFxuICAgIC4uLihyZWZlcmVuY2VQcmVzc0V2ZW50ICE9PSAnaW50ZW50aW9uYWwnICYmIHtcbiAgICAgIG9uQ2xpY2s6IGNsb3NlT25SZWZlcmVuY2VQcmVzc1xuICAgIH0pXG4gIH0pLCBbY2xvc2VPbkVzY2FwZUtleURvd24sIGNsb3NlT25SZWZlcmVuY2VQcmVzcywgcmVmZXJlbmNlUHJlc3NFdmVudF0pO1xuICBjb25zdCBmbG9hdGluZyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICBvbktleURvd246IGNsb3NlT25Fc2NhcGVLZXlEb3duLFxuICAgIC8vIGBvbk1vdXNlRG93bmAgbWF5IGJlIGJsb2NrZWQgaWYgYGV2ZW50LnByZXZlbnREZWZhdWx0KClgIGlzIGNhbGxlZCBpblxuICAgIC8vIGBvblBvaW50ZXJEb3duYCwgc3VjaCBhcyB3aXRoIDxOdW1iZXJGaWVsZC5TY3J1YkFyZWE+LlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbXVpL2Jhc2UtdWkvcHVsbC8zMzc5XG4gICAgb25Qb2ludGVyRG93bjogbWFya0luc2lkZVByZXNzU3RhcnRQcmV2ZW50ZWQsXG4gICAgb25Nb3VzZURvd246IG1hcmtJbnNpZGVQcmVzc1N0YXJ0UHJldmVudGVkLFxuICAgIG9uQ2xpY2tDYXB0dXJlOiBtYXJrSW5zaWRlUmVhY3RUcmVlLFxuICAgIG9uTW91c2VEb3duQ2FwdHVyZShldmVudCkge1xuICAgICAgbWFya0luc2lkZVJlYWN0VHJlZSgpO1xuICAgICAgbWFya1ByZXNzU3RhcnRlZEluc2lkZVJlYWN0VHJlZShldmVudCk7XG4gICAgfSxcbiAgICBvblBvaW50ZXJEb3duQ2FwdHVyZShldmVudCkge1xuICAgICAgbWFya0luc2lkZVJlYWN0VHJlZSgpO1xuICAgICAgbWFya1ByZXNzU3RhcnRlZEluc2lkZVJlYWN0VHJlZShldmVudCk7XG4gICAgfSxcbiAgICBvbk1vdXNlVXBDYXB0dXJlOiBtYXJrSW5zaWRlUmVhY3RUcmVlLFxuICAgIG9uVG91Y2hFbmRDYXB0dXJlOiBtYXJrSW5zaWRlUmVhY3RUcmVlLFxuICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZTogbWFya0luc2lkZVJlYWN0VHJlZVxuICB9KSwgW2Nsb3NlT25Fc2NhcGVLZXlEb3duLCBtYXJrSW5zaWRlUmVhY3RUcmVlLCBtYXJrUHJlc3NTdGFydGVkSW5zaWRlUmVhY3RUcmVlLCBtYXJrSW5zaWRlUHJlc3NTdGFydFByZXZlbnRlZF0pO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiBlbmFibGVkID8ge1xuICAgIHJlZmVyZW5jZSxcbiAgICBmbG9hdGluZyxcbiAgICB0cmlnZ2VyOiByZWZlcmVuY2VcbiAgfSA6IHt9LCBbZW5hYmxlZCwgcmVmZXJlbmNlLCBmbG9hdGluZ10pO1xufSIsImltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCIuLi9mb3JtYXRFcnJvck1lc3NhZ2UuanNcIjtcbi8qKlxuICogVGhlIE5vT3B0aW9uYWxQYXJhbXMgdHlwZSBpcyBhIHV0aWxpdHkgdHlwZSB0aGF0IGNoZWNrcyBpZiBhIGZ1bmN0aW9uIGhhcyBvcHRpb25hbCBvciBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gKiBJZiB0aGUgZnVuY3Rpb24gaGFzIG9wdGlvbmFsIG9yIGRlZmF1bHQgcGFyYW1ldGVycywgaXQgcmV0dXJucyBhIHN0cmluZyBsaXRlcmFsIHR5cGUgd2l0aCBhbiBlcnJvciBtZXNzYWdlLlxuICogT3RoZXJ3aXNlLCBpdCByZXR1cm5zIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB0eXBlLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBlbmZvcmNlIHRoYXQgdGhlIGNvbWJpbmVyIGZ1bmN0aW9uIHBhc3NlZCB0byBjcmVhdGVTZWxlY3RvciBkb2VzIG5vdCBoYXZlIG9wdGlvbmFsIG9yIGRlZmF1bHQgcGFyYW1ldGVycyxcbiAqIGFzIG1lbW9pemF0aW9uIHJlbGllcyBvbiB0aGUgRnVuY3Rpb24ubGVuZ3RoIHByb3BlcnR5LCB3aGljaCBkb2VzIG5vdCBhY2NvdW50IGZvciBvcHRpb25hbCBvciBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgc2VsZWN0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBkZXJpdmUgdmFsdWVzIGZyb20gdGhlIHN0b3JlJ3Mgc3RhdGUuXG4gKlxuICogVGhlIGNvbWJpbmVyIGZ1bmN0aW9uIGNhbiBoYXZlIHVwIHRvIHRocmVlIGFkZGl0aW9uYWwgcGFyYW1ldGVycywgYnV0IGl0ICoqY2Fubm90IGhhdmUgb3B0aW9uYWwgb3IgZGVmYXVsdCBwYXJhbWV0ZXJzKiouXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIHVwIHRvIHNpeCBmdW5jdGlvbnMgYW5kIGNvbWJpbmVzIHRoZW0gaW50byBhIHNpbmdsZSBzZWxlY3RvciBmdW5jdGlvbi5cbiAqIFRoZSByZXN1bHRpbmcgc2VsZWN0b3Igd2lsbCB0YWtlIHRoZSBzdGF0ZSBmcm9tIHRoZSBjb21iaW5lZCBzZWxlY3RvcnMgYW5kIGFueSBhZGRpdGlvbmFsIHBhcmFtZXRlcnMgcmVxdWlyZWQgYnkgdGhlIGNvbWJpbmVyLlxuICpcbiAqIFRoZSByZXR1cm4gdHlwZSBvZiB0aGUgcmVzdWx0aW5nIHNlbGVjdG9yIGlzIGRldGVybWluZWQgYnkgdGhlIHJldHVybiB0eXBlIG9mIHRoZSBjb21iaW5lciBmdW5jdGlvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3Qgc2VsZWN0b3IgPSBjcmVhdGVTZWxlY3RvcihcbiAqICAoc3RhdGUpID0+IHN0YXRlLmRpc2FibGVkXG4gKiApO1xuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCBzZWxlY3RvciA9IGNyZWF0ZVNlbGVjdG9yKFxuICogICAoc3RhdGUpID0+IHN0YXRlLmRpc2FibGVkLFxuICogICAoc3RhdGUpID0+IHN0YXRlLm9wZW4sXG4gKiAgIChkaXNhYmxlZCwgb3BlbikgPT4gKHsgZGlzYWJsZWQsIG9wZW4gfSlcbiAqICk7XG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIGlkLWRlbnlsaXN0ICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2VsZWN0b3IgPSAoYSwgYiwgYywgZCwgZSwgZiwgLi4ub3RoZXIpID0+IHtcbiAgaWYgKG90aGVyLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ1Vuc3VwcG9ydGVkIG51bWJlciBvZiBzZWxlY3RvcnMnIDogX2Zvcm1hdEVycm9yTWVzc2FnZSgxKSk7XG4gIH1cbiAgbGV0IHNlbGVjdG9yO1xuICBpZiAoYSAmJiBiICYmIGMgJiYgZCAmJiBlICYmIGYpIHtcbiAgICBzZWxlY3RvciA9IChzdGF0ZSwgYTEsIGEyLCBhMykgPT4ge1xuICAgICAgY29uc3QgdmEgPSBhKHN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgICAgIGNvbnN0IHZiID0gYihzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICBjb25zdCB2YyA9IGMoc3RhdGUsIGExLCBhMiwgYTMpO1xuICAgICAgY29uc3QgdmQgPSBkKHN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgICAgIGNvbnN0IHZlID0gZShzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICByZXR1cm4gZih2YSwgdmIsIHZjLCB2ZCwgdmUsIGExLCBhMiwgYTMpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoYSAmJiBiICYmIGMgJiYgZCAmJiBlKSB7XG4gICAgc2VsZWN0b3IgPSAoc3RhdGUsIGExLCBhMiwgYTMpID0+IHtcbiAgICAgIGNvbnN0IHZhID0gYShzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICBjb25zdCB2YiA9IGIoc3RhdGUsIGExLCBhMiwgYTMpO1xuICAgICAgY29uc3QgdmMgPSBjKHN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgICAgIGNvbnN0IHZkID0gZChzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICByZXR1cm4gZSh2YSwgdmIsIHZjLCB2ZCwgYTEsIGEyLCBhMyk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChhICYmIGIgJiYgYyAmJiBkKSB7XG4gICAgc2VsZWN0b3IgPSAoc3RhdGUsIGExLCBhMiwgYTMpID0+IHtcbiAgICAgIGNvbnN0IHZhID0gYShzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICBjb25zdCB2YiA9IGIoc3RhdGUsIGExLCBhMiwgYTMpO1xuICAgICAgY29uc3QgdmMgPSBjKHN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgICAgIHJldHVybiBkKHZhLCB2YiwgdmMsIGExLCBhMiwgYTMpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoYSAmJiBiICYmIGMpIHtcbiAgICBzZWxlY3RvciA9IChzdGF0ZSwgYTEsIGEyLCBhMykgPT4ge1xuICAgICAgY29uc3QgdmEgPSBhKHN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgICAgIGNvbnN0IHZiID0gYihzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICByZXR1cm4gYyh2YSwgdmIsIGExLCBhMiwgYTMpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoYSAmJiBiKSB7XG4gICAgc2VsZWN0b3IgPSAoc3RhdGUsIGExLCBhMiwgYTMpID0+IHtcbiAgICAgIGNvbnN0IHZhID0gYShzdGF0ZSwgYTEsIGEyLCBhMyk7XG4gICAgICByZXR1cm4gYih2YSwgYTEsIGEyLCBhMyk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChhKSB7XG4gICAgc2VsZWN0b3IgPSBhO1xuICB9IGVsc2Uge1xuICAgIHRocm93IC8qIG1pbmlmeS1lcnJvci1kaXNhYmxlZCAqL25ldyBFcnJvcignTWlzc2luZyBhcmd1bWVudHMnKTtcbiAgfVxuICByZXR1cm4gc2VsZWN0b3I7XG59O1xuLyogZXNsaW50LWVuYWJsZSBpZC1kZW55bGlzdCAqLyIsIi8qKlxuICogQGxpY2Vuc2UgUmVhY3RcbiAqIHVzZS1zeW5jLWV4dGVybmFsLXN0b3JlLXNoaW0vd2l0aC1zZWxlY3Rvci5kZXZlbG9wbWVudC5qc1xuICpcbiAqIENvcHlyaWdodCAoYykgTWV0YSBQbGF0Zm9ybXMsIEluYy4gYW5kIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgJiZcbiAgKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBpcyh4LCB5KSB7XG4gICAgICByZXR1cm4gKHggPT09IHkgJiYgKDAgIT09IHggfHwgMSAvIHggPT09IDEgLyB5KSkgfHwgKHggIT09IHggJiYgeSAhPT0geSk7XG4gICAgfVxuICAgIFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBfX1JFQUNUX0RFVlRPT0xTX0dMT0JBTF9IT09LX18gJiZcbiAgICAgIFwiZnVuY3Rpb25cIiA9PT1cbiAgICAgICAgdHlwZW9mIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5yZWdpc3RlckludGVybmFsTW9kdWxlU3RhcnQgJiZcbiAgICAgIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5yZWdpc3RlckludGVybmFsTW9kdWxlU3RhcnQoRXJyb3IoKSk7XG4gICAgdmFyIFJlYWN0ID0gcmVxdWlyZShcInJlYWN0XCIpLFxuICAgICAgc2hpbSA9IHJlcXVpcmUoXCJ1c2Utc3luYy1leHRlcm5hbC1zdG9yZS9zaGltXCIpLFxuICAgICAgb2JqZWN0SXMgPSBcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBPYmplY3QuaXMgPyBPYmplY3QuaXMgOiBpcyxcbiAgICAgIHVzZVN5bmNFeHRlcm5hbFN0b3JlID0gc2hpbS51c2VTeW5jRXh0ZXJuYWxTdG9yZSxcbiAgICAgIHVzZVJlZiA9IFJlYWN0LnVzZVJlZixcbiAgICAgIHVzZUVmZmVjdCA9IFJlYWN0LnVzZUVmZmVjdCxcbiAgICAgIHVzZU1lbW8gPSBSZWFjdC51c2VNZW1vLFxuICAgICAgdXNlRGVidWdWYWx1ZSA9IFJlYWN0LnVzZURlYnVnVmFsdWU7XG4gICAgZXhwb3J0cy51c2VTeW5jRXh0ZXJuYWxTdG9yZVdpdGhTZWxlY3RvciA9IGZ1bmN0aW9uIChcbiAgICAgIHN1YnNjcmliZSxcbiAgICAgIGdldFNuYXBzaG90LFxuICAgICAgZ2V0U2VydmVyU25hcHNob3QsXG4gICAgICBzZWxlY3RvcixcbiAgICAgIGlzRXF1YWxcbiAgICApIHtcbiAgICAgIHZhciBpbnN0UmVmID0gdXNlUmVmKG51bGwpO1xuICAgICAgaWYgKG51bGwgPT09IGluc3RSZWYuY3VycmVudCkge1xuICAgICAgICB2YXIgaW5zdCA9IHsgaGFzVmFsdWU6ICExLCB2YWx1ZTogbnVsbCB9O1xuICAgICAgICBpbnN0UmVmLmN1cnJlbnQgPSBpbnN0O1xuICAgICAgfSBlbHNlIGluc3QgPSBpbnN0UmVmLmN1cnJlbnQ7XG4gICAgICBpbnN0UmVmID0gdXNlTWVtbyhcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZ1bmN0aW9uIG1lbW9pemVkU2VsZWN0b3IobmV4dFNuYXBzaG90KSB7XG4gICAgICAgICAgICBpZiAoIWhhc01lbW8pIHtcbiAgICAgICAgICAgICAgaGFzTWVtbyA9ICEwO1xuICAgICAgICAgICAgICBtZW1vaXplZFNuYXBzaG90ID0gbmV4dFNuYXBzaG90O1xuICAgICAgICAgICAgICBuZXh0U25hcHNob3QgPSBzZWxlY3RvcihuZXh0U25hcHNob3QpO1xuICAgICAgICAgICAgICBpZiAodm9pZCAwICE9PSBpc0VxdWFsICYmIGluc3QuaGFzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNlbGVjdGlvbiA9IGluc3QudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKGlzRXF1YWwoY3VycmVudFNlbGVjdGlvbiwgbmV4dFNuYXBzaG90KSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiAobWVtb2l6ZWRTZWxlY3Rpb24gPSBjdXJyZW50U2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gKG1lbW9pemVkU2VsZWN0aW9uID0gbmV4dFNuYXBzaG90KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRTZWxlY3Rpb24gPSBtZW1vaXplZFNlbGVjdGlvbjtcbiAgICAgICAgICAgIGlmIChvYmplY3RJcyhtZW1vaXplZFNuYXBzaG90LCBuZXh0U25hcHNob3QpKVxuICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFNlbGVjdGlvbjtcbiAgICAgICAgICAgIHZhciBuZXh0U2VsZWN0aW9uID0gc2VsZWN0b3IobmV4dFNuYXBzaG90KTtcbiAgICAgICAgICAgIGlmICh2b2lkIDAgIT09IGlzRXF1YWwgJiYgaXNFcXVhbChjdXJyZW50U2VsZWN0aW9uLCBuZXh0U2VsZWN0aW9uKSlcbiAgICAgICAgICAgICAgcmV0dXJuIChtZW1vaXplZFNuYXBzaG90ID0gbmV4dFNuYXBzaG90KSwgY3VycmVudFNlbGVjdGlvbjtcbiAgICAgICAgICAgIG1lbW9pemVkU25hcHNob3QgPSBuZXh0U25hcHNob3Q7XG4gICAgICAgICAgICByZXR1cm4gKG1lbW9pemVkU2VsZWN0aW9uID0gbmV4dFNlbGVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBoYXNNZW1vID0gITEsXG4gICAgICAgICAgICBtZW1vaXplZFNuYXBzaG90LFxuICAgICAgICAgICAgbWVtb2l6ZWRTZWxlY3Rpb24sXG4gICAgICAgICAgICBtYXliZUdldFNlcnZlclNuYXBzaG90ID1cbiAgICAgICAgICAgICAgdm9pZCAwID09PSBnZXRTZXJ2ZXJTbmFwc2hvdCA/IG51bGwgOiBnZXRTZXJ2ZXJTbmFwc2hvdDtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gbWVtb2l6ZWRTZWxlY3RvcihnZXRTbmFwc2hvdCgpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudWxsID09PSBtYXliZUdldFNlcnZlclNuYXBzaG90XG4gICAgICAgICAgICAgID8gdm9pZCAwXG4gICAgICAgICAgICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lbW9pemVkU2VsZWN0b3IobWF5YmVHZXRTZXJ2ZXJTbmFwc2hvdCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICAgICAgW2dldFNuYXBzaG90LCBnZXRTZXJ2ZXJTbmFwc2hvdCwgc2VsZWN0b3IsIGlzRXF1YWxdXG4gICAgICApO1xuICAgICAgdmFyIHZhbHVlID0gdXNlU3luY0V4dGVybmFsU3RvcmUoc3Vic2NyaWJlLCBpbnN0UmVmWzBdLCBpbnN0UmVmWzFdKTtcbiAgICAgIHVzZUVmZmVjdChcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGluc3QuaGFzVmFsdWUgPSAhMDtcbiAgICAgICAgICBpbnN0LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFt2YWx1ZV1cbiAgICAgICk7XG4gICAgICB1c2VEZWJ1Z1ZhbHVlKHZhbHVlKTtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICAgIFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBfX1JFQUNUX0RFVlRPT0xTX0dMT0JBTF9IT09LX18gJiZcbiAgICAgIFwiZnVuY3Rpb25cIiA9PT1cbiAgICAgICAgdHlwZW9mIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5yZWdpc3RlckludGVybmFsTW9kdWxlU3RvcCAmJlxuICAgICAgX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fLnJlZ2lzdGVySW50ZXJuYWxNb2R1bGVTdG9wKEVycm9yKCkpO1xuICB9KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL2Nqcy91c2Utc3luYy1leHRlcm5hbC1zdG9yZS1zaGltL3dpdGgtc2VsZWN0b3IucHJvZHVjdGlvbi5qcycpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi9janMvdXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUtc2hpbS93aXRoLXNlbGVjdG9yLmRldmVsb3BtZW50LmpzJyk7XG59XG4iLCJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VSZWZXaXRoSW5pdCB9IGZyb20gXCIuL3VzZVJlZldpdGhJbml0LmpzXCI7XG5jb25zdCBob29rcyA9IFtdO1xubGV0IGN1cnJlbnRJbnN0YW5jZSA9IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnN0YW5jZSgpIHtcbiAgcmV0dXJuIGN1cnJlbnRJbnN0YW5jZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbnN0YW5jZShpbnN0YW5jZSkge1xuICBjdXJyZW50SW5zdGFuY2UgPSBpbnN0YW5jZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlcihob29rKSB7XG4gIGhvb2tzLnB1c2goaG9vayk7XG59XG5leHBvcnQgZnVuY3Rpb24gZmFzdENvbXBvbmVudChmbikge1xuICBjb25zdCBGYXN0Q29tcG9uZW50ID0gKHByb3BzLCBmb3J3YXJkZWRSZWYpID0+IHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHVzZVJlZldpdGhJbml0KGNyZWF0ZUluc3RhbmNlKS5jdXJyZW50O1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGN1cnJlbnRJbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgICAgZm9yIChjb25zdCBob29rIG9mIGhvb2tzKSB7XG4gICAgICAgIGhvb2suYmVmb3JlKGluc3RhbmNlKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IGZuKHByb3BzLCBmb3J3YXJkZWRSZWYpO1xuICAgICAgZm9yIChjb25zdCBob29rIG9mIGhvb2tzKSB7XG4gICAgICAgIGhvb2suYWZ0ZXIoaW5zdGFuY2UpO1xuICAgICAgfVxuICAgICAgaW5zdGFuY2UuZGlkSW5pdGlhbGl6ZSA9IHRydWU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGN1cnJlbnRJbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgRmFzdENvbXBvbmVudC5kaXNwbGF5TmFtZSA9IGZuLmRpc3BsYXlOYW1lIHx8IGZuLm5hbWU7XG4gIHJldHVybiBGYXN0Q29tcG9uZW50O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZhc3RDb21wb25lbnRSZWYoZm4pIHtcbiAgcmV0dXJuIC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZhc3RDb21wb25lbnQoZm4pKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlKCkge1xuICByZXR1cm4ge1xuICAgIGRpZEluaXRpYWxpemU6IGZhbHNlXG4gIH07XG59IiwiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuLyogV2UgbmVlZCB0byBpbXBvcnQgdGhlIHNoaW0gYmVjYXVzZSBSZWFjdCAxNyBkb2VzIG5vdCBzdXBwb3J0IHRoZSBgdXNlU3luY0V4dGVybmFsU3RvcmVgIEFQSS5cbiAqIE1vcmUgaW5mbzogaHR0cHM6Ly9naXRodWIuY29tL211aS9tdWkteC9pc3N1ZXMvMTgzMDMjaXNzdWVjb21tZW50LTI5NTgzOTIzNDEgKi9cbmltcG9ydCB7IHVzZVN5bmNFeHRlcm5hbFN0b3JlIH0gZnJvbSAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUvc2hpbSc7XG5pbXBvcnQgeyB1c2VTeW5jRXh0ZXJuYWxTdG9yZVdpdGhTZWxlY3RvciB9IGZyb20gJ3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlL3NoaW0vd2l0aC1zZWxlY3Rvcic7XG5pbXBvcnQgeyBpc1JlYWN0VmVyc2lvbkF0TGVhc3QgfSBmcm9tIFwiLi4vcmVhY3RWZXJzaW9uLmpzXCI7XG5pbXBvcnQgeyByZWdpc3RlciwgZ2V0SW5zdGFuY2UgfSBmcm9tIFwiLi4vZmFzdEhvb2tzLmpzXCI7XG4vKiBTb21lIHRlc3RzIGZhaWwgaW4gUjE4IHdpdGggdGhlIHJhdyB1c2VTeW5jRXh0ZXJuYWxTdG9yZS4gSXQgbWF5IGJlIHBvc3NpYmxlIHRvIG1ha2UgaXQgd29ya1xuICogYnV0IGZvciBub3cgd2Ugb25seSBlbmFibGUgaXQgZm9yIFIxOSsuICovXG5jb25zdCBjYW5Vc2VSYXdVc2VTeW5jRXh0ZXJuYWxTdG9yZSA9IGlzUmVhY3RWZXJzaW9uQXRMZWFzdCgxOSk7XG5jb25zdCB1c2VTdG9yZUltcGxlbWVudGF0aW9uID0gY2FuVXNlUmF3VXNlU3luY0V4dGVybmFsU3RvcmUgPyB1c2VTdG9yZUZhc3QgOiB1c2VTdG9yZUxlZ2FjeTtcbmV4cG9ydCBmdW5jdGlvbiB1c2VTdG9yZShzdG9yZSwgc2VsZWN0b3IsIGExLCBhMiwgYTMpIHtcbiAgcmV0dXJuIHVzZVN0b3JlSW1wbGVtZW50YXRpb24oc3RvcmUsIHNlbGVjdG9yLCBhMSwgYTIsIGEzKTtcbn1cbmZ1bmN0aW9uIHVzZVN0b3JlUjE5KHN0b3JlLCBzZWxlY3RvciwgYTEsIGEyLCBhMykge1xuICBjb25zdCBnZXRTZWxlY3Rpb24gPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiBzZWxlY3RvcihzdG9yZS5nZXRTbmFwc2hvdCgpLCBhMSwgYTIsIGEzKSwgW3N0b3JlLCBzZWxlY3RvciwgYTEsIGEyLCBhM10pO1xuICByZXR1cm4gdXNlU3luY0V4dGVybmFsU3RvcmUoc3RvcmUuc3Vic2NyaWJlLCBnZXRTZWxlY3Rpb24sIGdldFNlbGVjdGlvbik7XG59XG5yZWdpc3Rlcih7XG4gIGJlZm9yZShpbnN0YW5jZSkge1xuICAgIGluc3RhbmNlLnN5bmNJbmRleCA9IDA7XG4gICAgaWYgKCFpbnN0YW5jZS5kaWRJbml0aWFsaXplKSB7XG4gICAgICBpbnN0YW5jZS5zeW5jVGljayA9IDE7XG4gICAgICBpbnN0YW5jZS5zeW5jSG9va3MgPSBbXTtcbiAgICAgIGluc3RhbmNlLmRpZENoYW5nZVN0b3JlID0gdHJ1ZTtcbiAgICAgIGluc3RhbmNlLmdldFNuYXBzaG90ID0gKCkgPT4ge1xuICAgICAgICBsZXQgZGlkQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2Uuc3luY0hvb2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgY29uc3QgaG9vayA9IGluc3RhbmNlLnN5bmNIb29rc1tpXTtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGhvb2suc2VsZWN0b3IoaG9vay5zdG9yZS5zdGF0ZSwgaG9vay5hMSwgaG9vay5hMiwgaG9vay5hMyk7XG4gICAgICAgICAgaWYgKGhvb2suZGlkQ2hhbmdlIHx8ICFPYmplY3QuaXMoaG9vay52YWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBkaWRDaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgICAgaG9vay52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgaG9vay5kaWRDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpZENoYW5nZSkge1xuICAgICAgICAgIGluc3RhbmNlLnN5bmNUaWNrICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLnN5bmNUaWNrO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIGFmdGVyKGluc3RhbmNlKSB7XG4gICAgaWYgKGluc3RhbmNlLnN5bmNIb29rcy5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoaW5zdGFuY2UuZGlkQ2hhbmdlU3RvcmUpIHtcbiAgICAgICAgaW5zdGFuY2UuZGlkQ2hhbmdlU3RvcmUgPSBmYWxzZTtcbiAgICAgICAgaW5zdGFuY2Uuc3Vic2NyaWJlID0gb25TdG9yZUNoYW5nZSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RvcmVzID0gbmV3IFNldCgpO1xuICAgICAgICAgIGZvciAoY29uc3QgaG9vayBvZiBpbnN0YW5jZS5zeW5jSG9va3MpIHtcbiAgICAgICAgICAgIHN0b3Jlcy5hZGQoaG9vay5zdG9yZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcyA9IFtdO1xuICAgICAgICAgIGZvciAoY29uc3Qgc3RvcmUgb2Ygc3RvcmVzKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZXMucHVzaChzdG9yZS5zdWJzY3JpYmUob25TdG9yZUNoYW5nZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCB1bnN1YnNjcmliZSBvZiB1bnN1YnNjcmliZXMpIHtcbiAgICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL3J1bGVzLW9mLWhvb2tzXG4gICAgICB1c2VTeW5jRXh0ZXJuYWxTdG9yZShpbnN0YW5jZS5zdWJzY3JpYmUsIGluc3RhbmNlLmdldFNuYXBzaG90LCBpbnN0YW5jZS5nZXRTbmFwc2hvdCk7XG4gICAgfVxuICB9XG59KTtcbmZ1bmN0aW9uIHVzZVN0b3JlRmFzdChzdG9yZSwgc2VsZWN0b3IsIGExLCBhMiwgYTMpIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBnZXRJbnN0YW5jZSgpO1xuICBpZiAoIWluc3RhbmNlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL3J1bGVzLW9mLWhvb2tzXG4gICAgcmV0dXJuIHVzZVN0b3JlUjE5KHN0b3JlLCBzZWxlY3RvciwgYTEsIGEyLCBhMyk7XG4gIH1cbiAgY29uc3QgaW5kZXggPSBpbnN0YW5jZS5zeW5jSW5kZXg7XG4gIGluc3RhbmNlLnN5bmNJbmRleCArPSAxO1xuICBsZXQgaG9vaztcbiAgaWYgKCFpbnN0YW5jZS5kaWRJbml0aWFsaXplKSB7XG4gICAgaG9vayA9IHtcbiAgICAgIHN0b3JlLFxuICAgICAgc2VsZWN0b3IsXG4gICAgICBhMSxcbiAgICAgIGEyLFxuICAgICAgYTMsXG4gICAgICB2YWx1ZTogc2VsZWN0b3Ioc3RvcmUuZ2V0U25hcHNob3QoKSwgYTEsIGEyLCBhMyksXG4gICAgICBkaWRDaGFuZ2U6IGZhbHNlXG4gICAgfTtcbiAgICBpbnN0YW5jZS5zeW5jSG9va3MucHVzaChob29rKTtcbiAgfSBlbHNlIHtcbiAgICBob29rID0gaW5zdGFuY2Uuc3luY0hvb2tzW2luZGV4XTtcbiAgICBpZiAoaG9vay5zdG9yZSAhPT0gc3RvcmUgfHwgaG9vay5zZWxlY3RvciAhPT0gc2VsZWN0b3IgfHwgIU9iamVjdC5pcyhob29rLmExLCBhMSkgfHwgIU9iamVjdC5pcyhob29rLmEyLCBhMikgfHwgIU9iamVjdC5pcyhob29rLmEzLCBhMykpIHtcbiAgICAgIGlmIChob29rLnN0b3JlICE9PSBzdG9yZSkge1xuICAgICAgICBpbnN0YW5jZS5kaWRDaGFuZ2VTdG9yZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBob29rLnN0b3JlID0gc3RvcmU7XG4gICAgICBob29rLnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICBob29rLmExID0gYTE7XG4gICAgICBob29rLmEyID0gYTI7XG4gICAgICBob29rLmEzID0gYTM7XG4gICAgICBob29rLmRpZENoYW5nZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBob29rLnZhbHVlO1xufVxuZnVuY3Rpb24gdXNlU3RvcmVMZWdhY3koc3RvcmUsIHNlbGVjdG9yLCBhMSwgYTIsIGEzKSB7XG4gIHJldHVybiB1c2VTeW5jRXh0ZXJuYWxTdG9yZVdpdGhTZWxlY3RvcihzdG9yZS5zdWJzY3JpYmUsIHN0b3JlLmdldFNuYXBzaG90LCBzdG9yZS5nZXRTbmFwc2hvdCwgc3RhdGUgPT4gc2VsZWN0b3Ioc3RhdGUsIGExLCBhMiwgYTMpKTtcbn0iLCJpbXBvcnQgeyB1c2VTdG9yZSB9IGZyb20gXCIuL3VzZVN0b3JlLmpzXCI7XG4vKipcbiAqIEEgZGF0YSBzdG9yZSBpbXBsZW1lbnRhdGlvbiB0aGF0IGFsbG93cyBzdWJzY3JpYmluZyB0byBzdGF0ZSBjaGFuZ2VzIGFuZCB1cGRhdGluZyB0aGUgc3RhdGUuXG4gKiBJdCB1c2VzIGFuIG9ic2VydmVyIHBhdHRlcm4gdG8gbm90aWZ5IHN1YnNjcmliZXJzIHdoZW4gdGhlIHN0YXRlIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdG9yZSB7XG4gIC8qKlxuICAgKiBUaGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc3RvcmUuXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgdXBkYXRlZCBpbW1lZGlhdGVseSB3aGVuIHRoZSBzdGF0ZSBjaGFuZ2VzIGFzIGEgcmVzdWx0IG9mIGNhbGxpbmcge0BsaW5rIHNldFN0YXRlfSwge0BsaW5rIHVwZGF0ZX0sIG9yIHtAbGluayBzZXR9LlxuICAgKiBUbyBzdWJzY3JpYmUgdG8gc3RhdGUgY2hhbmdlcywgdXNlIHRoZSB7QGxpbmsgdXNlU3RhdGV9IG1ldGhvZC4gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHtAbGluayB1c2VTdGF0ZX0gaXMgdXBkYXRlZCBhZnRlciB0aGUgY29tcG9uZW50IHJlbmRlcnMgKHNpbWlsYXJseSB0byBSZWFjdCdzIHVzZVN0YXRlKS5cbiAgICogVGhlIHZhbHVlcyBjYW4gYmUgdXNlZCBkaXJlY3RseSAodG8gYXZvaWQgc3Vic2NyaWJpbmcgdG8gdGhlIHN0b3JlKSBpbiBlZmZlY3RzIG9yIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBEbyBub3QgbW9kaWZ5IHByb3BlcnRpZXMgaW4gc3RhdGUgZGlyZWN0bHkuIEluc3RlYWQsIHVzZSB0aGUgcHJvdmlkZWQgbWV0aG9kcyB0byBlbnN1cmUgcHJvcGVyIHN0YXRlIG1hbmFnZW1lbnQgYW5kIGxpc3RlbmVyIG5vdGlmaWNhdGlvbi5cbiAgICovXG5cbiAgLy8gSW50ZXJuYWwgc3RhdGUgdG8gaGFuZGxlIHJlY3Vyc2l2ZSBgc2V0U3RhdGUoKWAgY2FsbHNcblxuICBjb25zdHJ1Y3RvcihzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLnVwZGF0ZVRpY2sgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgdGhlIHN0b3JlJ3Mgc3RhdGUgY2hhbmdlcy5cbiAgICpcbiAgICogQHBhcmFtIGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gc3RhdGUgY2hhbmdlcy5cbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0byB1bnN1YnNjcmliZSB0aGUgbGlzdGVuZXIuXG4gICAqL1xuICBzdWJzY3JpYmUgPSBmbiA9PiB7XG4gICAgdGhpcy5saXN0ZW5lcnMuYWRkKGZuKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGZuKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzdG9yZS5cbiAgICovXG4gIGdldFNuYXBzaG90ID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBlbnRpcmUgc3RvcmUncyBzdGF0ZSBhbmQgbm90aWZpZXMgYWxsIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbmV3U3RhdGUgVGhlIG5ldyBzdGF0ZSB0byBzZXQgZm9yIHRoZSBzdG9yZS5cbiAgICovXG4gIHNldFN0YXRlKG5ld1N0YXRlKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IG5ld1N0YXRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICB0aGlzLnVwZGF0ZVRpY2sgKz0gMTtcbiAgICBjb25zdCBjdXJyZW50VGljayA9IHRoaXMudXBkYXRlVGljaztcbiAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICBpZiAoY3VycmVudFRpY2sgIT09IHRoaXMudXBkYXRlVGljaykge1xuICAgICAgICAvLyBJZiB0aGUgdGljayBoYXMgY2hhbmdlZCwgYSByZWN1cnNpdmUgYHNldFN0YXRlYCBjYWxsIGhhcyBiZWVuIG1hZGUsXG4gICAgICAgIC8vIGFuZCBpdCBoYXMgYWxyZWFkeSBub3RpZmllZCBhbGwgbGlzdGVuZXJzLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcihuZXdTdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlcyB0aGUgcHJvdmlkZWQgY2hhbmdlcyBpbnRvIHRoZSBjdXJyZW50IHN0YXRlIGFuZCBub3RpZmllcyBsaXN0ZW5lcnMgaWYgdGhlcmUgYXJlIGNoYW5nZXMuXG4gICAqXG4gICAqIEBwYXJhbSBjaGFuZ2VzIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjaGFuZ2VzIHRvIGFwcGx5IHRvIHRoZSBjdXJyZW50IHN0YXRlLlxuICAgKi9cbiAgdXBkYXRlKGNoYW5nZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjaGFuZ2VzKSB7XG4gICAgICBpZiAoIU9iamVjdC5pcyh0aGlzLnN0YXRlW2tleV0sIGNoYW5nZXNba2V5XSkpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgLi4udGhpcy5zdGF0ZSxcbiAgICAgICAgICAuLi5jaGFuZ2VzXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBzcGVjaWZpYyBrZXkgaW4gdGhlIHN0b3JlJ3Mgc3RhdGUgdG8gYSBuZXcgdmFsdWUgYW5kIG5vdGlmaWVzIGxpc3RlbmVycyBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSBpbiB0aGUgc3RvcmUncyBzdGF0ZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIHNldCBmb3IgdGhlIHNwZWNpZmllZCBrZXkuXG4gICAqL1xuICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGlmICghT2JqZWN0LmlzKHRoaXMuc3RhdGVba2V5XSwgdmFsdWUpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgLi4udGhpcy5zdGF0ZSxcbiAgICAgICAgW2tleV06IHZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2l2ZXMgdGhlIHN0YXRlIGEgbmV3IHJlZmVyZW5jZSBhbmQgdXBkYXRlcyBhbGwgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXG4gICAqL1xuICBub3RpZnlBbGwoKSB7XG4gICAgY29uc3QgbmV3U3RhdGUgPSB7XG4gICAgICAuLi50aGlzLnN0YXRlXG4gICAgfTtcbiAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcbiAgfVxuICB1c2Uoc2VsZWN0b3IsIGExLCBhMiwgYTMpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3NcbiAgICByZXR1cm4gdXNlU3RvcmUodGhpcywgc2VsZWN0b3IsIGExLCBhMiwgYTMpO1xuICB9XG59IiwiLyogRmFsc2UgcG9zaXRpdmVzIC0gRVNMaW50IHRoaW5rcyB3ZSdyZSBjYWxsaW5nIGEgaG9vayBmcm9tIGEgY2xhc3MgY29tcG9uZW50LiAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3MgKi9cbid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgU3RvcmUgfSBmcm9tIFwiLi9TdG9yZS5qc1wiO1xuaW1wb3J0IHsgdXNlU3RvcmUgfSBmcm9tIFwiLi91c2VTdG9yZS5qc1wiO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXNlU3RhYmxlQ2FsbGJhY2suanNcIjtcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gXCIuLi91c2VJc29MYXlvdXRFZmZlY3QuanNcIjtcbmltcG9ydCB7IE5PT1AgfSBmcm9tIFwiLi4vZW1wdHkuanNcIjtcblxuLyoqXG4gKiBBIFN0b3JlIHRoYXQgc3VwcG9ydHMgY29udHJvbGxlZCBzdGF0ZSBrZXlzLCBub24tcmVhY3RpdmUgdmFsdWVzIGFuZCBwcm92aWRlcyB1dGlsaXR5IG1ldGhvZHMgZm9yIFJlYWN0LlxuICovXG5leHBvcnQgY2xhc3MgUmVhY3RTdG9yZSBleHRlbmRzIFN0b3JlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUmVhY3RTdG9yZSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHN0YXRlIEluaXRpYWwgc3RhdGUgb2YgdGhlIHN0b3JlLlxuICAgKiBAcGFyYW0gY29udGV4dCBOb24tcmVhY3RpdmUgY29udGV4dCB2YWx1ZXMuXG4gICAqIEBwYXJhbSBzZWxlY3RvcnMgT3B0aW9uYWwgc2VsZWN0b3JzIGZvciB1c2Ugd2l0aCBgdXNlU3RhdGVgLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc3RhdGUsIGNvbnRleHQgPSB7fSwgc2VsZWN0b3JzKSB7XG4gICAgc3VwZXIoc3RhdGUpO1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgdGhpcy5zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XG4gIH1cblxuICAvKipcbiAgICogTm9uLXJlYWN0aXZlIHZhbHVlcyBzdWNoIGFzIHJlZnMsIGNhbGxiYWNrcywgZXRjLlxuICAgKi9cblxuICAvKipcbiAgICogU3luY2hyb25pemVzIGEgc2luZ2xlIGV4dGVybmFsIHZhbHVlIGludG8gdGhlIHN0b3JlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIHdoaWxlIHRoZSB2YWx1ZSBpbiBgc3RhdGVgIGlzIHVwZGF0ZWQgaW1tZWRpYXRlbHksIHRoZSB2YWx1ZSByZXR1cm5lZFxuICAgKiBieSBgdXNlU3RhdGVgIGlzIHVwZGF0ZWQgYmVmb3JlIHRoZSBuZXh0IHJlbmRlciAoc2ltaWxhcmx5IHRvIFJlYWN0J3MgYHVzZVN0YXRlYCkuXG4gICAqL1xuICB1c2VTeW5jZWRWYWx1ZShrZXksIHZhbHVlKSB7XG4gICAgUmVhY3QudXNlRGVidWdWYWx1ZShrZXkpO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXRoaXNcbiAgICBjb25zdCBzdG9yZSA9IHRoaXM7XG4gICAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAgIGlmIChzdG9yZS5zdGF0ZVtrZXldICE9PSB2YWx1ZSkge1xuICAgICAgICBzdG9yZS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSwgW3N0b3JlLCBrZXksIHZhbHVlXSk7XG4gIH1cblxuICAvKipcbiAgICogU3luY2hyb25pemVzIGEgc2luZ2xlIGV4dGVybmFsIHZhbHVlIGludG8gdGhlIHN0b3JlIGFuZFxuICAgKiBjbGVhbnMgaXQgdXAgKHNldHMgdG8gYHVuZGVmaW5lZGApIG9uIHVubW91bnQuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgd2hpbGUgdGhlIHZhbHVlIGluIGBzdGF0ZWAgaXMgdXBkYXRlZCBpbW1lZGlhdGVseSwgdGhlIHZhbHVlIHJldHVybmVkXG4gICAqIGJ5IGB1c2VTdGF0ZWAgaXMgdXBkYXRlZCBiZWZvcmUgdGhlIG5leHQgcmVuZGVyIChzaW1pbGFybHkgdG8gUmVhY3QncyBgdXNlU3RhdGVgKS5cbiAgICovXG4gIHVzZVN5bmNlZFZhbHVlV2l0aENsZWFudXAoa2V5LCB2YWx1ZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXRoaXNcbiAgICBjb25zdCBzdG9yZSA9IHRoaXM7XG4gICAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAgIGlmIChzdG9yZS5zdGF0ZVtrZXldICE9PSB2YWx1ZSkge1xuICAgICAgICBzdG9yZS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdG9yZS5zZXQoa2V5LCB1bmRlZmluZWQpO1xuICAgICAgfTtcbiAgICB9LCBbc3RvcmUsIGtleSwgdmFsdWVdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZXMgbXVsdGlwbGUgZXh0ZXJuYWwgdmFsdWVzIGludG8gdGhlIHN0b3JlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIHdoaWxlIHRoZSB2YWx1ZXMgaW4gYHN0YXRlYCBhcmUgdXBkYXRlZCBpbW1lZGlhdGVseSwgdGhlIHZhbHVlcyByZXR1cm5lZFxuICAgKiBieSBgdXNlU3RhdGVgIGFyZSB1cGRhdGVkIGJlZm9yZSB0aGUgbmV4dCByZW5kZXIgKHNpbWlsYXJseSB0byBSZWFjdCdzIGB1c2VTdGF0ZWApLlxuICAgKi9cbiAgdXNlU3luY2VkVmFsdWVzKHN0YXRlUGFydCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXRoaXNcbiAgICBjb25zdCBzdG9yZSA9IHRoaXM7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIC8vIENoZWNrIHRoYXQgYW4gb2JqZWN0IHdpdGggdGhlIHNhbWUgc2hhcGUgaXMgcGFzc2VkIG9uIGV2ZXJ5IHJlbmRlclxuICAgICAgUmVhY3QudXNlRGVidWdWYWx1ZShzdGF0ZVBhcnQsIHAgPT4gT2JqZWN0LmtleXMocCkpO1xuICAgICAgY29uc3Qga2V5cyA9IFJlYWN0LnVzZVJlZihPYmplY3Qua2V5cyhzdGF0ZVBhcnQpKS5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dEtleXMgPSBPYmplY3Qua2V5cyhzdGF0ZVBhcnQpO1xuICAgICAgaWYgKGtleXMubGVuZ3RoICE9PSBuZXh0S2V5cy5sZW5ndGggfHwga2V5cy5zb21lKChrZXksIGluZGV4KSA9PiBrZXkgIT09IG5leHRLZXlzW2luZGV4XSkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignUmVhY3RTdG9yZS51c2VTeW5jZWRWYWx1ZXMgZXhwZWN0cyB0aGUgc2FtZSBwcm9wIGtleXMgb24gZXZlcnkgcmVuZGVyLiBLZXlzIHNob3VsZCBiZSBzdGFibGUuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IE9iamVjdC52YWx1ZXMoc3RhdGVQYXJ0KTtcbiAgICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgICAgc3RvcmUudXBkYXRlKHN0YXRlUGFydCk7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgfSwgW3N0b3JlLCAuLi5kZXBlbmRlbmNpZXNdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjb250cm9sbGFibGUgcHJvcCBwYWlyIChgY29udHJvbGxlZGAsIGBkZWZhdWx0VmFsdWVgKSBmb3IgYSBzcGVjaWZpYyBrZXkuIElmIGBjb250cm9sbGVkYFxuICAgKiBpcyBub24tdW5kZWZpbmVkLCB0aGUgc3RvcmUncyBzdGF0ZSBhdCBga2V5YCBpcyB1cGRhdGVkIHRvIG1hdGNoIGBjb250cm9sbGVkYC5cbiAgICovXG4gIHVzZUNvbnRyb2xsZWRQcm9wKGtleSwgY29udHJvbGxlZCkge1xuICAgIFJlYWN0LnVzZURlYnVnVmFsdWUoa2V5KTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29uc2lzdGVudC10aGlzXG4gICAgY29uc3Qgc3RvcmUgPSB0aGlzO1xuICAgIGNvbnN0IGlzQ29udHJvbGxlZCA9IGNvbnRyb2xsZWQgIT09IHVuZGVmaW5lZDtcbiAgICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgICAgaWYgKGlzQ29udHJvbGxlZCAmJiAhT2JqZWN0LmlzKHN0b3JlLnN0YXRlW2tleV0sIGNvbnRyb2xsZWQpKSB7XG4gICAgICAgIC8vIFNldCB0aGUgaW50ZXJuYWwgc3RhdGUgdG8gbWF0Y2ggdGhlIGNvbnRyb2xsZWQgdmFsdWUuXG4gICAgICAgIHN0b3JlLnNldFN0YXRlKHtcbiAgICAgICAgICAuLi5zdG9yZS5zdGF0ZSxcbiAgICAgICAgICBba2V5XTogY29udHJvbGxlZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCBbc3RvcmUsIGtleSwgY29udHJvbGxlZCwgaXNDb250cm9sbGVkXSk7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmNvbnRyb2xsZWRWYWx1ZXMgPz89IG5ldyBNYXAoKTtcbiAgICAgIGlmICghY2FjaGUuaGFzKGtleSkpIHtcbiAgICAgICAgY2FjaGUuc2V0KGtleSwgaXNDb250cm9sbGVkKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZXZpb3VzbHlDb250cm9sbGVkID0gY2FjaGUuZ2V0KGtleSk7XG4gICAgICBpZiAocHJldmlvdXNseUNvbnRyb2xsZWQgIT09IHVuZGVmaW5lZCAmJiBwcmV2aW91c2x5Q29udHJvbGxlZCAhPT0gaXNDb250cm9sbGVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEEgY29tcG9uZW50IGlzIGNoYW5naW5nIHRoZSAke2lzQ29udHJvbGxlZCA/ICcnIDogJ3VuJ31jb250cm9sbGVkIHN0YXRlIG9mICR7a2V5LnRvU3RyaW5nKCl9IHRvIGJlICR7aXNDb250cm9sbGVkID8gJ3VuJyA6ICcnfWNvbnRyb2xsZWQuIEVsZW1lbnRzIHNob3VsZCBub3Qgc3dpdGNoIGZyb20gdW5jb250cm9sbGVkIHRvIGNvbnRyb2xsZWQgKG9yIHZpY2UgdmVyc2EpLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjdXJyZW50IHZhbHVlIGZyb20gdGhlIHN0b3JlIHVzaW5nIGEgc2VsZWN0b3Igd2l0aCB0aGUgcHJvdmlkZWQga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IEtleSBvZiB0aGUgc2VsZWN0b3IgdG8gdXNlLlxuICAgKi9cblxuICBzZWxlY3Qoa2V5LCBhMSwgYTIsIGEzKSB7XG4gICAgY29uc3Qgc2VsZWN0b3IgPSB0aGlzLnNlbGVjdG9yc1trZXldO1xuICAgIHJldHVybiBzZWxlY3Rvcih0aGlzLnN0YXRlLCBhMSwgYTIsIGEzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgdmFsdWUgZnJvbSB0aGUgc3RvcmUncyBzdGF0ZSB1c2luZyBhIHNlbGVjdG9yIGZ1bmN0aW9uLlxuICAgKiBVc2VkIHRvIHN1YnNjcmliZSB0byBzcGVjaWZpYyBwYXJ0cyBvZiB0aGUgc3RhdGUuXG4gICAqIFRoaXMgbWV0aG9kcyBjYXVzZXMgYSByZXJlbmRlciB3aGVuZXZlciB0aGUgc2VsZWN0ZWQgc3RhdGUgY2hhbmdlcy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBLZXkgb2YgdGhlIHNlbGVjdG9yIHRvIHVzZS5cbiAgICovXG5cbiAgdXNlU3RhdGUoa2V5LCBhMSwgYTIsIGEzKSB7XG4gICAgUmVhY3QudXNlRGVidWdWYWx1ZShrZXkpO1xuICAgIHJldHVybiB1c2VTdG9yZSh0aGlzLCB0aGlzLnNlbGVjdG9yc1trZXldLCBhMSwgYTIsIGEzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcmFwcyBhIGZ1bmN0aW9uIHdpdGggYHVzZVN0YWJsZUNhbGxiYWNrYCB0byBlbnN1cmUgaXQgaGFzIGEgc3RhYmxlIHJlZmVyZW5jZVxuICAgKiBhbmQgYXNzaWducyBpdCB0byB0aGUgY29udGV4dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBLZXkgb2YgdGhlIGV2ZW50IGNhbGxiYWNrLiBNdXN0IGJlIGEgZnVuY3Rpb24gaW4gdGhlIGNvbnRleHQuXG4gICAqIEBwYXJhbSBmbiBGdW5jdGlvbiB0byBhc3NpZ24uXG4gICAqL1xuICB1c2VDb250ZXh0Q2FsbGJhY2soa2V5LCBmbikge1xuICAgIFJlYWN0LnVzZURlYnVnVmFsdWUoa2V5KTtcbiAgICBjb25zdCBzdGFibGVGdW5jdGlvbiA9IHVzZVN0YWJsZUNhbGxiYWNrKGZuID8/IE5PT1ApO1xuICAgIHRoaXMuY29udGV4dFtrZXldID0gc3RhYmxlRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0YWJsZSBzZXR0ZXIgZnVuY3Rpb24gZm9yIGEgc3BlY2lmaWMga2V5IGluIHRoZSBzdG9yZSdzIHN0YXRlLlxuICAgKiBJdCdzIGNvbW1vbmx5IHVzZWQgdG8gcGFzcyBhcyBhIHJlZiBjYWxsYmFjayB0byBSZWFjdCBlbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBLZXkgb2YgdGhlIHN0YXRlIHRvIHNldC5cbiAgICovXG4gIHVzZVN0YXRlU2V0dGVyKGtleSkge1xuICAgIGNvbnN0IHJlZiA9IFJlYWN0LnVzZVJlZih1bmRlZmluZWQpO1xuICAgIGlmIChyZWYuY3VycmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZWYuY3VycmVudCA9IHZhbHVlID0+IHtcbiAgICAgICAgdGhpcy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcmVmLmN1cnJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZXMgY2hhbmdlcyBkZXJpdmVkIGZyb20gdGhlIHN0b3JlJ3Mgc2VsZWN0b3JzIGFuZCBjYWxscyB0aGUgbGlzdGVuZXIgd2hlbiB0aGUgc2VsZWN0ZWQgdmFsdWUgY2hhbmdlcy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBLZXkgb2YgdGhlIHNlbGVjdG9yIHRvIG9ic2VydmUuXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBMaXN0ZW5lciBmdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgc2VsZWN0b3IgcmVzdWx0IGNoYW5nZXMuXG4gICAqL1xuXG4gIG9ic2VydmUoc2VsZWN0b3IsIGxpc3RlbmVyKSB7XG4gICAgbGV0IHNlbGVjdEZuO1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHNlbGVjdEZuID0gc2VsZWN0b3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGVjdEZuID0gdGhpcy5zZWxlY3RvcnNbc2VsZWN0b3JdO1xuICAgIH1cbiAgICBsZXQgcHJldlZhbHVlID0gc2VsZWN0Rm4odGhpcy5zdGF0ZSk7XG4gICAgbGlzdGVuZXIocHJldlZhbHVlLCBwcmV2VmFsdWUsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShuZXh0U3RhdGUgPT4ge1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gc2VsZWN0Rm4obmV4dFN0YXRlKTtcbiAgICAgIGlmICghT2JqZWN0LmlzKHByZXZWYWx1ZSwgbmV4dFZhbHVlKSkge1xuICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHByZXZWYWx1ZTtcbiAgICAgICAgcHJldlZhbHVlID0gbmV4dFZhbHVlO1xuICAgICAgICBsaXN0ZW5lcihuZXh0VmFsdWUsIG9sZFZhbHVlLCB0aGlzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufSIsImltcG9ydCB7IGNyZWF0ZVNlbGVjdG9yLCBSZWFjdFN0b3JlIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvc3RvcmUnO1xuaW1wb3J0IHsgY3JlYXRlRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUV2ZW50RW1pdHRlci5qc1wiO1xuaW1wb3J0IHsgaXNDbGlja0xpa2VFdmVudCB9IGZyb20gXCIuLi91dGlscy5qc1wiO1xuY29uc3Qgc2VsZWN0b3JzID0ge1xuICBvcGVuOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5vcGVuKSxcbiAgdHJhbnNpdGlvblN0YXR1czogY3JlYXRlU2VsZWN0b3Ioc3RhdGUgPT4gc3RhdGUudHJhbnNpdGlvblN0YXR1cyksXG4gIGRvbVJlZmVyZW5jZUVsZW1lbnQ6IGNyZWF0ZVNlbGVjdG9yKHN0YXRlID0+IHN0YXRlLmRvbVJlZmVyZW5jZUVsZW1lbnQpLFxuICByZWZlcmVuY2VFbGVtZW50OiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5wb3NpdGlvblJlZmVyZW5jZSA/PyBzdGF0ZS5yZWZlcmVuY2VFbGVtZW50KSxcbiAgZmxvYXRpbmdFbGVtZW50OiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5mbG9hdGluZ0VsZW1lbnQpLFxuICBmbG9hdGluZ0lkOiBjcmVhdGVTZWxlY3RvcihzdGF0ZSA9PiBzdGF0ZS5mbG9hdGluZ0lkKVxufTtcbmV4cG9ydCBjbGFzcyBGbG9hdGluZ1Jvb3RTdG9yZSBleHRlbmRzIFJlYWN0U3RvcmUge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgY29uc3Qge1xuICAgICAgc3luY09ubHksXG4gICAgICBuZXN0ZWQsXG4gICAgICBvbk9wZW5DaGFuZ2UsXG4gICAgICB0cmlnZ2VyRWxlbWVudHMsXG4gICAgICAuLi5pbml0aWFsU3RhdGVcbiAgICB9ID0gb3B0aW9ucztcbiAgICBzdXBlcih7XG4gICAgICAuLi5pbml0aWFsU3RhdGUsXG4gICAgICBwb3NpdGlvblJlZmVyZW5jZTogaW5pdGlhbFN0YXRlLnJlZmVyZW5jZUVsZW1lbnQsXG4gICAgICBkb21SZWZlcmVuY2VFbGVtZW50OiBpbml0aWFsU3RhdGUucmVmZXJlbmNlRWxlbWVudFxuICAgIH0sIHtcbiAgICAgIG9uT3BlbkNoYW5nZSxcbiAgICAgIGRhdGFSZWY6IHtcbiAgICAgICAgY3VycmVudDoge31cbiAgICAgIH0sXG4gICAgICBldmVudHM6IGNyZWF0ZUV2ZW50RW1pdHRlcigpLFxuICAgICAgbmVzdGVkLFxuICAgICAgdHJpZ2dlckVsZW1lbnRzXG4gICAgfSwgc2VsZWN0b3JzKTtcbiAgICB0aGlzLnN5bmNPbmx5ID0gc3luY09ubHk7XG4gIH1cblxuICAvKipcbiAgICogU3luY3MgdGhlIGV2ZW50IHVzZWQgYnkgaG92ZXIgbG9naWMgdG8gZGlzdGluZ3Vpc2ggaG92ZXItb3BlbiBmcm9tIGNsaWNrLWxpa2UgaW50ZXJhY3Rpb24uXG4gICAqL1xuICBzeW5jT3BlbkV2ZW50ID0gKG5ld09wZW4sIGV2ZW50KSA9PiB7XG4gICAgaWYgKCFuZXdPcGVuIHx8ICF0aGlzLnN0YXRlLm9wZW4gfHxcbiAgICAvLyBQcmV2ZW50IGEgcGVuZGluZyBob3Zlci1vcGVuIGZyb20gb3ZlcndyaXRpbmcgYSBjbGljay1vcGVuIGV2ZW50LCB3aGlsZSBhbGxvd2luZ1xuICAgIC8vIGNsaWNrIGV2ZW50cyB0byB1cGdyYWRlIGEgaG92ZXItb3Blbi5cbiAgICBldmVudCAhPSBudWxsICYmIGlzQ2xpY2tMaWtlRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLmNvbnRleHQuZGF0YVJlZi5jdXJyZW50Lm9wZW5FdmVudCA9IG5ld09wZW4gPyBldmVudCA6IHVuZGVmaW5lZDtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIHJvb3Qtb3duZWQgc2lkZSBlZmZlY3RzIGZvciBhbiBvcGVuIHN0YXRlIGNoYW5nZS5cbiAgICovXG4gIGRpc3BhdGNoT3BlbkNoYW5nZSA9IChuZXdPcGVuLCBldmVudERldGFpbHMpID0+IHtcbiAgICB0aGlzLnN5bmNPcGVuRXZlbnQobmV3T3BlbiwgZXZlbnREZXRhaWxzLmV2ZW50KTtcbiAgICBjb25zdCBkZXRhaWxzID0ge1xuICAgICAgb3BlbjogbmV3T3BlbixcbiAgICAgIHJlYXNvbjogZXZlbnREZXRhaWxzLnJlYXNvbixcbiAgICAgIG5hdGl2ZUV2ZW50OiBldmVudERldGFpbHMuZXZlbnQsXG4gICAgICBuZXN0ZWQ6IHRoaXMuY29udGV4dC5uZXN0ZWQsXG4gICAgICB0cmlnZ2VyRWxlbWVudDogZXZlbnREZXRhaWxzLnRyaWdnZXJcbiAgICB9O1xuICAgIHRoaXMuY29udGV4dC5ldmVudHMuZW1pdCgnb3BlbmNoYW5nZScsIGRldGFpbHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFbWl0cyB0aGUgYG9wZW5jaGFuZ2VgIGV2ZW50IHRocm91Z2ggdGhlIGludGVybmFsIGV2ZW50IGVtaXR0ZXIgYW5kIGNhbGxzIHRoZSBgb25PcGVuQ2hhbmdlYCBoYW5kbGVyIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIG5ld09wZW4gVGhlIG5ldyBvcGVuIHN0YXRlLlxuICAgKiBAcGFyYW0gZXZlbnREZXRhaWxzIERldGFpbHMgYWJvdXQgdGhlIGV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvcGVuIHN0YXRlIGNoYW5nZS5cbiAgICovXG4gIHNldE9wZW4gPSAobmV3T3BlbiwgZXZlbnREZXRhaWxzKSA9PiB7XG4gICAgaWYgKHRoaXMuc3luY09ubHkpIHtcbiAgICAgIHRoaXMuY29udGV4dC5vbk9wZW5DaGFuZ2U/LihuZXdPcGVuLCBldmVudERldGFpbHMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoT3BlbkNoYW5nZShuZXdPcGVuLCBldmVudERldGFpbHMpO1xuICAgIHRoaXMuY29udGV4dC5vbk9wZW5DaGFuZ2U/LihuZXdPcGVuLCBldmVudERldGFpbHMpO1xuICB9O1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IGlzRWxlbWVudCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgRmxvYXRpbmdSb290U3RvcmUgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9GbG9hdGluZ1Jvb3RTdG9yZS5qc1wiO1xuLyoqXG4gKiBLZWVwcyBhIEZsb2F0aW5nUm9vdFN0b3JlIGluIHN5bmMgd2l0aCB0aGUgcHJvdmlkZWQgUG9wdXBTdG9yZS5cbiAqIFVzZXMgdGhlIHByb3ZpZGVkIEZsb2F0aW5nUm9vdFN0b3JlIHdoZW4gb25lIGV4aXN0cywgb3RoZXJ3aXNlIGNyZWF0ZXMgb25lIG9uY2UgYW5kIHVwZGF0ZXMgaXQgb24gZXZlcnkgcmVuZGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU3luY2VkRmxvYXRpbmdSb290Q29udGV4dChvcHRpb25zKSB7XG4gIGNvbnN0IHtcbiAgICBwb3B1cFN0b3JlLFxuICAgIHRyZWF0UG9wdXBBc0Zsb2F0aW5nRWxlbWVudCA9IGZhbHNlLFxuICAgIGZsb2F0aW5nUm9vdENvbnRleHQ6IGZsb2F0aW5nUm9vdENvbnRleHRQcm9wLFxuICAgIGZsb2F0aW5nSWQsXG4gICAgbmVzdGVkLFxuICAgIG9uT3BlbkNoYW5nZVxuICB9ID0gb3B0aW9ucztcbiAgY29uc3Qgb3BlbiA9IHBvcHVwU3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgcmVmZXJlbmNlRWxlbWVudCA9IHBvcHVwU3RvcmUudXNlU3RhdGUoJ2FjdGl2ZVRyaWdnZXJFbGVtZW50Jyk7XG4gIGNvbnN0IGZsb2F0aW5nRWxlbWVudCA9IHBvcHVwU3RvcmUudXNlU3RhdGUodHJlYXRQb3B1cEFzRmxvYXRpbmdFbGVtZW50ID8gJ3BvcHVwRWxlbWVudCcgOiAncG9zaXRpb25lckVsZW1lbnQnKTtcbiAgY29uc3QgdHJpZ2dlckVsZW1lbnRzID0gcG9wdXBTdG9yZS5jb250ZXh0LnRyaWdnZXJFbGVtZW50cztcbiAgY29uc3QgaGFuZGxlT3BlbkNoYW5nZSA9IG9uT3BlbkNoYW5nZTtcbiAgY29uc3QgaW50ZXJuYWxTdG9yZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgaWYgKGZsb2F0aW5nUm9vdENvbnRleHRQcm9wID09PSB1bmRlZmluZWQgJiYgaW50ZXJuYWxTdG9yZVJlZi5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgaW50ZXJuYWxTdG9yZVJlZi5jdXJyZW50ID0gbmV3IEZsb2F0aW5nUm9vdFN0b3JlKHtcbiAgICAgIG9wZW4sXG4gICAgICB0cmFuc2l0aW9uU3RhdHVzOiB1bmRlZmluZWQsXG4gICAgICByZWZlcmVuY2VFbGVtZW50LFxuICAgICAgZmxvYXRpbmdFbGVtZW50LFxuICAgICAgdHJpZ2dlckVsZW1lbnRzLFxuICAgICAgb25PcGVuQ2hhbmdlOiBoYW5kbGVPcGVuQ2hhbmdlLFxuICAgICAgZmxvYXRpbmdJZCxcbiAgICAgIHN5bmNPbmx5OiB0cnVlLFxuICAgICAgbmVzdGVkXG4gICAgfSk7XG4gIH1cbiAgY29uc3Qgc3RvcmUgPSBmbG9hdGluZ1Jvb3RDb250ZXh0UHJvcCA/PyBpbnRlcm5hbFN0b3JlUmVmLmN1cnJlbnQ7XG4gIHBvcHVwU3RvcmUudXNlU3luY2VkVmFsdWUoJ2Zsb2F0aW5nSWQnLCBmbG9hdGluZ0lkKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB2YWx1ZXNUb1N5bmMgPSB7XG4gICAgICBvcGVuLFxuICAgICAgZmxvYXRpbmdJZCxcbiAgICAgIHJlZmVyZW5jZUVsZW1lbnQsXG4gICAgICBmbG9hdGluZ0VsZW1lbnRcbiAgICB9O1xuICAgIGlmIChpc0VsZW1lbnQocmVmZXJlbmNlRWxlbWVudCkpIHtcbiAgICAgIHZhbHVlc1RvU3luYy5kb21SZWZlcmVuY2VFbGVtZW50ID0gcmVmZXJlbmNlRWxlbWVudDtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnN0YXRlLnBvc2l0aW9uUmVmZXJlbmNlID09PSBzdG9yZS5zdGF0ZS5yZWZlcmVuY2VFbGVtZW50KSB7XG4gICAgICB2YWx1ZXNUb1N5bmMucG9zaXRpb25SZWZlcmVuY2UgPSByZWZlcmVuY2VFbGVtZW50O1xuICAgIH1cbiAgICBzdG9yZS51cGRhdGUodmFsdWVzVG9TeW5jKTtcbiAgfSwgW29wZW4sIGZsb2F0aW5nSWQsIHJlZmVyZW5jZUVsZW1lbnQsIGZsb2F0aW5nRWxlbWVudCwgc3RvcmVdKTtcblxuICAvLyBLZWVwIG5vbi1yZWFjdGl2ZSBjb250ZXh0IHZhbHVlcyBmcmVzaCBmb3IgaW50ZXJhY3Rpb25zIHRoYXQgY2FsbCBgc3RvcmUuc2V0T3BlbmAuXG4gIHN0b3JlLmNvbnRleHQub25PcGVuQ2hhbmdlID0gaGFuZGxlT3BlbkNoYW5nZTtcbiAgc3RvcmUuY29udGV4dC5uZXN0ZWQgPSBuZXN0ZWQ7XG4gIHJldHVybiBzdG9yZTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEVNUFRZX09CSkVDVCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2VtcHR5JztcbmltcG9ydCB7IHVzZUlkIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSWQnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgRk9DVVNBQkxFX0FUVFJJQlVURSB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC91dGlscy9jb25zdGFudHMuanNcIjtcbmltcG9ydCB7IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkIH0gZnJvbSBcIi4uLy4uL2Zsb2F0aW5nLXVpLXJlYWN0L2NvbXBvbmVudHMvRmxvYXRpbmdUcmVlLmpzXCI7XG5pbXBvcnQgeyB1c2VTeW5jZWRGbG9hdGluZ1Jvb3RDb250ZXh0IH0gZnJvbSBcIi4uLy4uL2Zsb2F0aW5nLXVpLXJlYWN0L2hvb2tzL3VzZVN5bmNlZEZsb2F0aW5nUm9vdENvbnRleHQuanNcIjtcbmltcG9ydCB7IHVzZVRyYW5zaXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3VzZVRyYW5zaXRpb25TdGF0dXMuanNcIjtcbmltcG9ydCB7IHVzZU9wZW5DaGFuZ2VDb21wbGV0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcm5hbHMvdXNlT3BlbkNoYW5nZUNvbXBsZXRlLmpzXCI7XG5leHBvcnQgY29uc3QgRk9DVVNBQkxFX1BPUFVQX1BST1BTID0ge1xuICB0YWJJbmRleDogLTEsXG4gIFtGT0NVU0FCTEVfQVRUUklCVVRFXTogJydcbn07XG5leHBvcnQgZnVuY3Rpb24gdXNlUG9wdXBTdG9yZShleHRlcm5hbFN0b3JlLCBjcmVhdGVTdG9yZSwgdHJlYXRQb3B1cEFzRmxvYXRpbmdFbGVtZW50ID0gZmFsc2UpIHtcbiAgY29uc3QgZmxvYXRpbmdJZCA9IHVzZUlkKCk7XG4gIGNvbnN0IG5lc3RlZCA9IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkKCkgIT0gbnVsbDtcbiAgY29uc3QgaW50ZXJuYWxTdG9yZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgaWYgKGV4dGVybmFsU3RvcmUgPT09IHVuZGVmaW5lZCAmJiBpbnRlcm5hbFN0b3JlUmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICBpbnRlcm5hbFN0b3JlUmVmLmN1cnJlbnQgPSBjcmVhdGVTdG9yZShmbG9hdGluZ0lkLCBuZXN0ZWQpO1xuICB9XG4gIGNvbnN0IHN0b3JlID0gZXh0ZXJuYWxTdG9yZSA/PyBpbnRlcm5hbFN0b3JlUmVmLmN1cnJlbnQ7XG4gIHVzZVN5bmNlZEZsb2F0aW5nUm9vdENvbnRleHQoe1xuICAgIHBvcHVwU3RvcmU6IHN0b3JlLFxuICAgIHRyZWF0UG9wdXBBc0Zsb2F0aW5nRWxlbWVudCxcbiAgICBmbG9hdGluZ1Jvb3RDb250ZXh0OiBzdG9yZS5zdGF0ZS5mbG9hdGluZ1Jvb3RDb250ZXh0LFxuICAgIGZsb2F0aW5nSWQsXG4gICAgbmVzdGVkLFxuICAgIG9uT3BlbkNoYW5nZTogc3RvcmUuc2V0T3BlblxuICB9KTtcbiAgcmV0dXJuIHtcbiAgICBzdG9yZSxcbiAgICBpbnRlcm5hbFN0b3JlOiBpbnRlcm5hbFN0b3JlUmVmLmN1cnJlbnRcbiAgfTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgY2FsbGJhY2sgcmVmIHRoYXQgcmVnaXN0ZXJzL3VucmVnaXN0ZXJzIHRoZSB0cmlnZ2VyIGVsZW1lbnQgaW4gdGhlIHN0b3JlLlxuICpcbiAqIEBwYXJhbSBzdG9yZSBUaGUgU3RvcmUgaW5zdGFuY2Ugd2hlcmUgdGhlIHRyaWdnZXIgc2hvdWxkIGJlIHJlZ2lzdGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VUcmlnZ2VyUmVnaXN0cmF0aW9uKGlkLCBzdG9yZSkge1xuICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBjdXJyZW50bHkgcmVnaXN0ZXJlZCBlbGVtZW50IHRvIHVucmVnaXN0ZXIgaXQgb24gdW5tb3VudCBvciBpZCBjaGFuZ2UuXG4gIGNvbnN0IHJlZ2lzdGVyZWRFbGVtZW50SWRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJlZ2lzdGVyZWRFbGVtZW50UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICByZXR1cm4gUmVhY3QudXNlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHNob3VsZFN5bmNUcmlnZ2VyQ291bnQgPSBmYWxzZTtcbiAgICBpZiAocmVnaXN0ZXJlZEVsZW1lbnRJZFJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZWdpc3RlcmVkSWQgPSByZWdpc3RlcmVkRWxlbWVudElkUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCByZWdpc3RlcmVkRWxlbWVudCA9IHJlZ2lzdGVyZWRFbGVtZW50UmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLmdldEJ5SWQocmVnaXN0ZXJlZElkKTtcbiAgICAgIGlmIChyZWdpc3RlcmVkRWxlbWVudCAmJiBjdXJyZW50RWxlbWVudCA9PT0gcmVnaXN0ZXJlZEVsZW1lbnQpIHtcbiAgICAgICAgc3RvcmUuY29udGV4dC50cmlnZ2VyRWxlbWVudHMuZGVsZXRlKHJlZ2lzdGVyZWRJZCk7XG4gICAgICAgIHNob3VsZFN5bmNUcmlnZ2VyQ291bnQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmVnaXN0ZXJlZEVsZW1lbnRJZFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIHJlZ2lzdGVyZWRFbGVtZW50UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgcmVnaXN0ZXJlZEVsZW1lbnRJZFJlZi5jdXJyZW50ID0gaWQ7XG4gICAgICByZWdpc3RlcmVkRWxlbWVudFJlZi5jdXJyZW50ID0gZWxlbWVudDtcbiAgICAgIHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLmFkZChpZCwgZWxlbWVudCk7XG4gICAgICBzaG91bGRTeW5jVHJpZ2dlckNvdW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHNob3VsZFN5bmNUcmlnZ2VyQ291bnQpIHtcbiAgICAgIGNvbnN0IHRyaWdnZXJDb3VudCA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLnNpemU7XG4gICAgICBpZiAoc3RvcmUuc2VsZWN0KCdvcGVuJykgJiYgc3RvcmUuc3RhdGUudHJpZ2dlckNvdW50ICE9PSB0cmlnZ2VyQ291bnQpIHtcbiAgICAgICAgc3RvcmUuc2V0KCd0cmlnZ2VyQ291bnQnLCB0cmlnZ2VyQ291bnQpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW3N0b3JlLCBpZF0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldE9wZW5UcmlnZ2VyU3RhdGUoc3RhdGUsIG9wZW4sIHRyaWdnZXIpIHtcbiAgY29uc3QgdHJpZ2dlcklkID0gdHJpZ2dlcj8uaWQgPz8gbnVsbDtcblxuICAvLyBJZiBhIHBvcHVwIGlzIGNsb3NpbmcsIHRoZSBgdHJpZ2dlcmAgbWF5IGJlIHVuZGVmaW5lZC5cbiAgLy8gV2Ugd2FudCB0byBrZWVwIHRoZSBwcmV2aW91cyB2YWx1ZSBzbyB0aGF0IGV4aXQgYW5pbWF0aW9ucyBhcmUgcGxheWVkIGFuZCBmb2N1cyBpcyByZXR1cm5lZCBjb3JyZWN0bHkuXG4gIGlmICh0cmlnZ2VySWQgfHwgb3Blbikge1xuICAgIHN0YXRlLmFjdGl2ZVRyaWdnZXJJZCA9IHRyaWdnZXJJZDtcbiAgICBzdGF0ZS5hY3RpdmVUcmlnZ2VyRWxlbWVudCA9IHRyaWdnZXIgPz8gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgdHJpZ2dlciBkYXRhIGZvcndhcmRpbmcgdG8gdGhlIHN0b3JlLlxuICpcbiAqIEBwYXJhbSB0cmlnZ2VySWQgSWQgb2YgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckVsZW1lbnRSZWYgUmVmIGZvciB0aGUgdHJpZ2dlciBET00gZWxlbWVudC5cbiAqIEBwYXJhbSBzdG9yZSBUaGUgU3RvcmUgaW5zdGFuY2UgbWFuYWdpbmcgdGhlIHBvcHVwIHN0YXRlLlxuICogQHBhcmFtIHN0YXRlVXBkYXRlcyBBbiBvYmplY3Qgd2l0aCBzdGF0ZSB1cGRhdGVzIHRvIGFwcGx5IHdoZW4gdGhlIHRyaWdnZXIgaXMgYWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlVHJpZ2dlckRhdGFGb3J3YXJkaW5nKHRyaWdnZXJJZCwgdHJpZ2dlckVsZW1lbnRSZWYsIHN0b3JlLCBzdGF0ZVVwZGF0ZXMpIHtcbiAgY29uc3QgaXNNb3VudGVkQnlUaGlzVHJpZ2dlciA9IHN0b3JlLnVzZVN0YXRlKCdpc01vdW50ZWRCeVRyaWdnZXInLCB0cmlnZ2VySWQpO1xuICBjb25zdCBiYXNlUmVnaXN0ZXJUcmlnZ2VyID0gdXNlVHJpZ2dlclJlZ2lzdHJhdGlvbih0cmlnZ2VySWQsIHN0b3JlKTtcbiAgY29uc3QgcmVnaXN0ZXJUcmlnZ2VyID0gdXNlU3RhYmxlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgYmFzZVJlZ2lzdGVyVHJpZ2dlcihlbGVtZW50KTtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3BlbiA9IHN0b3JlLnNlbGVjdCgnb3BlbicpO1xuICAgIGNvbnN0IGFjdGl2ZVRyaWdnZXJJZCA9IHN0b3JlLnNlbGVjdCgnYWN0aXZlVHJpZ2dlcklkJyk7XG4gICAgaWYgKGFjdGl2ZVRyaWdnZXJJZCA9PT0gdHJpZ2dlcklkKSB7XG4gICAgICBzdG9yZS51cGRhdGUoe1xuICAgICAgICBhY3RpdmVUcmlnZ2VyRWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgLi4uKG9wZW4gPyBzdGF0ZVVwZGF0ZXMgOiBudWxsKVxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChhY3RpdmVUcmlnZ2VySWQgPT0gbnVsbCAmJiBvcGVuKSB7XG4gICAgICAvLyBJZiBhIHBvcHVwIGlzIGFscmVhZHkgb3BlbiwgYSBkZXRhY2hlZCB0cmlnZ2VyIGNhbiBtb3VudCBiZWZvcmUgYW55IGFjdGl2ZSB0cmlnZ2VyXG4gICAgICAvLyBoYXMgYmVlbiBlc3RhYmxpc2hlZC4gQ2xhaW0gdGhlIGZpcnN0IHJlZ2lzdGVyZWQgdHJpZ2dlciBzbyB0cmlnZ2VyLW93bmVkIGZvY3VzXG4gICAgICAvLyBtYW5hZ2VtZW50IGFuZCBBUklBIHJlbGF0aW9uc2hpcHMgd29yay5cbiAgICAgIHN0b3JlLnVwZGF0ZSh7XG4gICAgICAgIGFjdGl2ZVRyaWdnZXJJZDogdHJpZ2dlcklkLFxuICAgICAgICBhY3RpdmVUcmlnZ2VyRWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgLi4uc3RhdGVVcGRhdGVzXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc01vdW50ZWRCeVRoaXNUcmlnZ2VyKSB7XG4gICAgICBzdG9yZS51cGRhdGUoe1xuICAgICAgICBhY3RpdmVUcmlnZ2VyRWxlbWVudDogdHJpZ2dlckVsZW1lbnRSZWYuY3VycmVudCxcbiAgICAgICAgLi4uc3RhdGVVcGRhdGVzXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB9LCBbaXNNb3VudGVkQnlUaGlzVHJpZ2dlciwgc3RvcmUsIHRyaWdnZXJFbGVtZW50UmVmLCAuLi5PYmplY3QudmFsdWVzKHN0YXRlVXBkYXRlcyldKTtcbiAgcmV0dXJuIHtcbiAgICByZWdpc3RlclRyaWdnZXIsXG4gICAgaXNNb3VudGVkQnlUaGlzVHJpZ2dlclxuICB9O1xufVxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgd2hlbiB0aGVyZSdzIG9ubHkgb25lIHRyaWdnZXIgZWxlbWVudCByZWdpc3RlcmVkLCBpdCBpcyBzZXQgYXMgdGhlIGFjdGl2ZSB0cmlnZ2VyLlxuICogVGhpcyBrZWVwcyB0cmlnZ2VyQ291bnQgcmVhY3RpdmUgd2hpbGUgb3BlbiBhbmQgYWxsb3dzIGNvbnRyb2xsZWQgcG9wdXBzIHRvIHdvcmsgY29ycmVjdGx5IHdpdGhvdXRcbiAqIGFuIGV4cGxpY2l0IHRyaWdnZXJJZCwgbWFpbnRhaW5pbmcgY29tcGF0aWJpbGl0eSB3aXRoIGNvbnRhaW5lZCB0cmlnZ2Vycy5cbiAqXG4gKiBUaGlzIHNob3VsZCBiZSBjYWxsZWQgb24gdGhlIFJvb3QgcGFydC5cbiAqXG4gKiBAcGFyYW0gc3RvcmUgVGhlIFN0b3JlIGluc3RhbmNlIG1hbmFnaW5nIHRoZSBwb3B1cCBzdGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUltcGxpY2l0QWN0aXZlVHJpZ2dlcihzdG9yZSkge1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgcmVhY3RpdmVUcmlnZ2VyQ291bnQgPSBzdG9yZS51c2VTdGF0ZSgndHJpZ2dlckNvdW50Jyk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICBpZiAoc3RvcmUuc3RhdGUudHJpZ2dlckNvdW50ICE9PSAwKSB7XG4gICAgICAgIHN0b3JlLnNldCgndHJpZ2dlckNvdW50JywgMCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRyaWdnZXJDb3VudCA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLnNpemU7XG4gICAgY29uc3Qgc3RhdGVVcGRhdGVzID0ge307XG4gICAgaWYgKHN0b3JlLnN0YXRlLnRyaWdnZXJDb3VudCAhPT0gdHJpZ2dlckNvdW50KSB7XG4gICAgICBzdGF0ZVVwZGF0ZXMudHJpZ2dlckNvdW50ID0gdHJpZ2dlckNvdW50O1xuICAgIH1cbiAgICBpZiAoIXN0b3JlLnNlbGVjdCgnYWN0aXZlVHJpZ2dlcklkJykgJiYgdHJpZ2dlckNvdW50ID09PSAxKSB7XG4gICAgICBjb25zdCBpdGVyYXRvclJlc3VsdCA9IHN0b3JlLmNvbnRleHQudHJpZ2dlckVsZW1lbnRzLmVudHJpZXMoKS5uZXh0KCk7XG4gICAgICBpZiAoIWl0ZXJhdG9yUmVzdWx0LmRvbmUpIHtcbiAgICAgICAgY29uc3QgW2ltcGxpY2l0VHJpZ2dlcklkLCBpbXBsaWNpdFRyaWdnZXJFbGVtZW50XSA9IGl0ZXJhdG9yUmVzdWx0LnZhbHVlO1xuICAgICAgICBzdGF0ZVVwZGF0ZXMuYWN0aXZlVHJpZ2dlcklkID0gaW1wbGljaXRUcmlnZ2VySWQ7XG4gICAgICAgIHN0YXRlVXBkYXRlcy5hY3RpdmVUcmlnZ2VyRWxlbWVudCA9IGltcGxpY2l0VHJpZ2dlckVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdGF0ZVVwZGF0ZXMudHJpZ2dlckNvdW50ICE9PSB1bmRlZmluZWQgfHwgc3RhdGVVcGRhdGVzLmFjdGl2ZVRyaWdnZXJJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdG9yZS51cGRhdGUoc3RhdGVVcGRhdGVzKTtcbiAgICB9XG4gIH0sIFtvcGVuLCBzdG9yZSwgcmVhY3RpdmVUcmlnZ2VyQ291bnRdKTtcbn1cblxuLyoqXG4gKiBNYW5hZ2VzIHRoZSBtb3VudGVkIHN0YXRlIG9mIHRoZSBwb3B1cC5cbiAqIFNldHMgdXAgdGhlIHRyYW5zaXRpb24gc3RhdHVzIGxpc3RlbmVycyBhbmQgaGFuZGxlcyB1bm1vdW50aW5nIHdoZW4gbmVlZGVkLlxuICogVXBkYXRlcyB0aGUgYG1vdW50ZWRgIGFuZCBgdHJhbnNpdGlvblN0YXR1c2Agc3RhdGVzIGluIHRoZSBzdG9yZS5cbiAqXG4gKiBAcGFyYW0gb3BlbiBXaGV0aGVyIHRoZSBwb3B1cCBpcyBvcGVuLlxuICogQHBhcmFtIHN0b3JlIFRoZSBTdG9yZSBpbnN0YW5jZSBtYW5hZ2luZyB0aGUgcG9wdXAgc3RhdGUuXG4gKiBAcGFyYW0gb25Vbm1vdW50IE9wdGlvbmFsIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwb3B1cCBpcyB1bm1vdW50ZWQuXG4gKlxuICogQHJldHVybnMgQSBmdW5jdGlvbiB0byBmb3JjaWJseSB1bm1vdW50IHRoZSBwb3B1cC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU9wZW5TdGF0ZVRyYW5zaXRpb25zKG9wZW4sIHN0b3JlLCBvblVubW91bnQpIHtcbiAgY29uc3Qge1xuICAgIG1vdW50ZWQsXG4gICAgc2V0TW91bnRlZCxcbiAgICB0cmFuc2l0aW9uU3RhdHVzXG4gIH0gPSB1c2VUcmFuc2l0aW9uU3RhdHVzKG9wZW4pO1xuICBzdG9yZS51c2VTeW5jZWRWYWx1ZXMoe1xuICAgIG1vdW50ZWQsXG4gICAgdHJhbnNpdGlvblN0YXR1c1xuICB9KTtcbiAgY29uc3QgZm9yY2VVbm1vdW50ID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldE1vdW50ZWQoZmFsc2UpO1xuICAgIHN0b3JlLnVwZGF0ZSh7XG4gICAgICBhY3RpdmVUcmlnZ2VySWQ6IG51bGwsXG4gICAgICBhY3RpdmVUcmlnZ2VyRWxlbWVudDogbnVsbCxcbiAgICAgIG1vdW50ZWQ6IGZhbHNlLFxuICAgICAgcHJldmVudFVubW91bnRpbmdPbkNsb3NlOiBmYWxzZVxuICAgIH0pO1xuICAgIG9uVW5tb3VudD8uKCk7XG4gICAgc3RvcmUuY29udGV4dC5vbk9wZW5DaGFuZ2VDb21wbGV0ZT8uKGZhbHNlKTtcbiAgfSk7XG4gIGNvbnN0IHByZXZlbnRVbm1vdW50aW5nT25DbG9zZSA9IHN0b3JlLnVzZVN0YXRlKCdwcmV2ZW50VW5tb3VudGluZ09uQ2xvc2UnKTtcbiAgdXNlT3BlbkNoYW5nZUNvbXBsZXRlKHtcbiAgICBlbmFibGVkOiBtb3VudGVkICYmICFvcGVuICYmICFwcmV2ZW50VW5tb3VudGluZ09uQ2xvc2UsXG4gICAgb3BlbixcbiAgICByZWY6IHN0b3JlLmNvbnRleHQucG9wdXBSZWYsXG4gICAgb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmICghb3Blbikge1xuICAgICAgICBmb3JjZVVubW91bnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4ge1xuICAgIGZvcmNlVW5tb3VudCxcbiAgICB0cmFuc2l0aW9uU3RhdHVzXG4gIH07XG59XG5leHBvcnQgZnVuY3Rpb24gdXNlUG9wdXBJbnRlcmFjdGlvblByb3BzKHN0b3JlLCBzdGF0ZVBhcnQpIHtcbiAgc3RvcmUudXNlU3luY2VkVmFsdWVzKHN0YXRlUGFydCk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiAoKSA9PiB7XG4gICAgc3RvcmUudXBkYXRlKHtcbiAgICAgIGFjdGl2ZVRyaWdnZXJQcm9wczogRU1QVFlfT0JKRUNULFxuICAgICAgaW5hY3RpdmVUcmlnZ2VyUHJvcHM6IEVNUFRZX09CSkVDVCxcbiAgICAgIHBvcHVwUHJvcHM6IEVNUFRZX09CSkVDVFxuICAgIH0pO1xuICB9LCBbc3RvcmVdKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiB1c2VQb3B1cFJvb3RTeW5jKHN0b3JlLCBvcGVuKSB7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuICYmIHN0b3JlLnN0YXRlLm9wZW5NZXRob2QgIT09IG51bGwpIHtcbiAgICAgIHN0b3JlLnNldCgnb3Blbk1ldGhvZCcsIG51bGwpO1xuICAgIH1cbiAgfSwgW29wZW4sIHN0b3JlXSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiAoKSA9PiB7XG4gICAgaWYgKHN0b3JlLnN0YXRlLm9wZW5NZXRob2QgIT09IG51bGwpIHtcbiAgICAgIHN0b3JlLnNldCgnb3Blbk1ldGhvZCcsIG51bGwpO1xuICAgIH1cbiAgfSwgW3N0b3JlXSk7XG59IiwiLyoqXG4gKiBEYXRhIHN0cnVjdHVyZSB0byBrZWVwIHRyYWNrIG9mIHBvcHVwIHRyaWdnZXIgZWxlbWVudHMgYnkgdGhlaXIgSURzLlxuICogVXNlcyBib3RoIGEgc2V0IG9mIEVsZW1lbnRzIGFuZCBhIG1hcCBvZiBJRHMgdG8gRWxlbWVudHMgZm9yIGVmZmljaWVudCBsb29rdXBzLlxuICovXG5leHBvcnQgY2xhc3MgUG9wdXBUcmlnZ2VyTWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbGVtZW50c1NldCA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLmlkTWFwID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSB0cmlnZ2VyIGVsZW1lbnQgd2l0aCB0aGUgZ2l2ZW4gSUQuXG4gICAqXG4gICAqIE5vdGU6IFRoZSBwcm92aWRlZCBlbGVtZW50IGlzIGFzc3VtZWQgdG8gbm90IGJlIHJlZ2lzdGVyZWQgdW5kZXIgbXVsdGlwbGUgSURzLlxuICAgKi9cbiAgYWRkKGlkLCBlbGVtZW50KSB7XG4gICAgY29uc3QgZXhpc3RpbmdFbGVtZW50ID0gdGhpcy5pZE1hcC5nZXQoaWQpO1xuICAgIGlmIChleGlzdGluZ0VsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV4aXN0aW5nRWxlbWVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBXZSBhc3N1bWUgdGhhdCB0aGUgc2FtZSBlbGVtZW50IHdvbid0IGJlIHJlZ2lzdGVyZWQgdW5kZXIgbXVsdGlwbGUgaWRzLlxuICAgICAgLy8gVGhpcyBpcyBzYWZlIGNvbnNpZGVyaW5nIGhvdyB1c2VUcmlnZ2VyUmVnaXN0cmF0aW9uIGlzIGltcGxlbWVudGVkLlxuICAgICAgdGhpcy5lbGVtZW50c1NldC5kZWxldGUoZXhpc3RpbmdFbGVtZW50KTtcbiAgICB9XG4gICAgdGhpcy5lbGVtZW50c1NldC5hZGQoZWxlbWVudCk7XG4gICAgdGhpcy5pZE1hcC5zZXQoaWQsIGVsZW1lbnQpO1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBpZiAodGhpcy5lbGVtZW50c1NldC5zaXplICE9PSB0aGlzLmlkTWFwLnNpemUpIHtcbiAgICAgICAgLy8gVE9ETzogZml4IG11aS9uby1ndWFyZGVkLXRocm93XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtdWkvbm8tZ3VhcmRlZC10aHJvd1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jhc2UgVUk6IEEgdHJpZ2dlciBlbGVtZW50IGNhbm5vdCBiZSByZWdpc3RlcmVkIHVuZGVyIG11bHRpcGxlIElEcyBpbiBQb3B1cFRyaWdnZXJNYXAuJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHRyaWdnZXIgZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBJRC5cbiAgICovXG4gIGRlbGV0ZShpZCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmlkTWFwLmdldChpZCk7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZWxlbWVudHNTZXQuZGVsZXRlKGVsZW1lbnQpO1xuICAgICAgdGhpcy5pZE1hcC5kZWxldGUoaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIHJlZ2lzdGVyZWQgYXMgYSB0cmlnZ2VyLlxuICAgKi9cbiAgaGFzRWxlbWVudChlbGVtZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudHNTZXQuaGFzKGVsZW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlcmUgaXMgYSByZWdpc3RlcmVkIHRyaWdnZXIgZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gcHJlZGljYXRlLlxuICAgKi9cbiAgaGFzTWF0Y2hpbmdFbGVtZW50KHByZWRpY2F0ZSkge1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiB0aGlzLmVsZW1lbnRzU2V0KSB7XG4gICAgICBpZiAocHJlZGljYXRlKGVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJpZ2dlciBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gSUQsIG9yIHVuZGVmaW5lZCBpZiBubyBzdWNoIGVsZW1lbnQgZXhpc3RzLlxuICAgKi9cbiAgZ2V0QnlJZChpZCkge1xuICAgIHJldHVybiB0aGlzLmlkTWFwLmdldChpZCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBpdGVyYWJsZSBvZiBhbGwgcmVnaXN0ZXJlZCB0cmlnZ2VyIGVudHJpZXMsIHdoZXJlIGVhY2ggZW50cnkgaXMgYSB0dXBsZSBvZiBbaWQsIGVsZW1lbnRdLlxuICAgKi9cbiAgZW50cmllcygpIHtcbiAgICByZXR1cm4gdGhpcy5pZE1hcC5lbnRyaWVzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBpdGVyYWJsZSBvZiBhbGwgcmVnaXN0ZXJlZCB0cmlnZ2VyIGVsZW1lbnRzLlxuICAgKi9cbiAgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudHNTZXQudmFsdWVzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlZ2lzdGVyZWQgdHJpZ2dlciBlbGVtZW50cy5cbiAgICovXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLmlkTWFwLnNpemU7XG4gIH1cbn0iLCJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmltcG9ydCB7IGpzeCBhcyBfanN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5leHBvcnQgY29uc3QgSW50ZXJuYWxCYWNrZHJvcCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIEludGVybmFsQmFja2Ryb3AocHJvcHMsIHJlZikge1xuICBjb25zdCB7XG4gICAgY3V0b3V0LFxuICAgIC4uLm90aGVyUHJvcHNcbiAgfSA9IHByb3BzO1xuICBsZXQgY2xpcFBhdGg7XG4gIGlmIChjdXRvdXQpIHtcbiAgICBjb25zdCByZWN0ID0gY3V0b3V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNsaXBQYXRoID0gYHBvbHlnb24oMCUgMCUsMTAwJSAwJSwxMDAlIDEwMCUsMCUgMTAwJSwwJSAwJSwke3JlY3QubGVmdH1weCAke3JlY3QudG9wfXB4LCR7cmVjdC5sZWZ0fXB4ICR7cmVjdC5ib3R0b219cHgsJHtyZWN0LnJpZ2h0fXB4ICR7cmVjdC5ib3R0b219cHgsJHtyZWN0LnJpZ2h0fXB4ICR7cmVjdC50b3B9cHgsJHtyZWN0LmxlZnR9cHggJHtyZWN0LnRvcH1weClgO1xuICB9XG4gIHJldHVybiAvKiNfX1BVUkVfXyovX2pzeChcImRpdlwiLCB7XG4gICAgcmVmOiByZWYsXG4gICAgcm9sZTogXCJwcmVzZW50YXRpb25cIlxuICAgIC8vIEVuc3VyZXMgRmxvYXRpbmcgVUkncyBvdXRzaWRlIHByZXNzIGRldGVjdGlvbiBydW5zLCBhcyBpdCBjb25zaWRlcnNcbiAgICAvLyBpdCBhbiBlbGVtZW50IHRoYXQgZXhpc3RlZCB3aGVuIHRoZSBwb3B1cCByZW5kZXJlZC5cbiAgICAsXG4gICAgXCJkYXRhLWJhc2UtdWktaW5lcnRcIjogXCJcIixcbiAgICAuLi5vdGhlclByb3BzLFxuICAgIHN0eWxlOiB7XG4gICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgIGluc2V0OiAwLFxuICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgY2xpcFBhdGhcbiAgICB9XG4gIH0pO1xufSk7XG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBJbnRlcm5hbEJhY2tkcm9wLmRpc3BsYXlOYW1lID0gXCJJbnRlcm5hbEJhY2tkcm9wXCI7IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5leHBvcnQgZnVuY3Rpb24gdXNlT25GaXJzdFJlbmRlcihmbikge1xuICBjb25zdCByZWYgPSBSZWFjdC51c2VSZWYodHJ1ZSk7XG4gIGlmIChyZWYuY3VycmVudCkge1xuICAgIHJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgZm4oKTtcbiAgfVxufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgaXNPdmVyZmxvd0VsZW1lbnQgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcbmltcG9ydCB7IGFkZEV2ZW50TGlzdGVuZXIgfSBmcm9tIFwiLi9hZGRFdmVudExpc3RlbmVyLmpzXCI7XG5pbXBvcnQgeyBpc0lPUywgaXNXZWJLaXQgfSBmcm9tIFwiLi9kZXRlY3RCcm93c2VyLmpzXCI7XG5pbXBvcnQgeyBvd25lckRvY3VtZW50LCBvd25lcldpbmRvdyB9IGZyb20gXCIuL293bmVyLmpzXCI7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tIFwiLi91c2VJc29MYXlvdXRFZmZlY3QuanNcIjtcbmltcG9ydCB7IFRpbWVvdXQgfSBmcm9tIFwiLi91c2VUaW1lb3V0LmpzXCI7XG5pbXBvcnQgeyBBbmltYXRpb25GcmFtZSB9IGZyb20gXCIuL3VzZUFuaW1hdGlvbkZyYW1lLmpzXCI7XG5pbXBvcnQgeyBOT09QIH0gZnJvbSBcIi4vZW1wdHkuanNcIjtcbmxldCBvcmlnaW5hbEh0bWxTdHlsZXMgPSB7fTtcbmxldCBvcmlnaW5hbEJvZHlTdHlsZXMgPSB7fTtcbmxldCBvcmlnaW5hbEh0bWxTY3JvbGxCZWhhdmlvciA9ICcnO1xuZnVuY3Rpb24gaGFzSW5zZXRTY3JvbGxiYXJzKHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChyZWZlcmVuY2VFbGVtZW50KTtcbiAgY29uc3Qgd2luID0gb3duZXJXaW5kb3coZG9jKTtcbiAgcmV0dXJuIHdpbi5pbm5lcldpZHRoIC0gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA+IDA7XG59XG5mdW5jdGlvbiBzdXBwb3J0c1N0YWJsZVNjcm9sbGJhckd1dHRlcihyZWZlcmVuY2VFbGVtZW50KSB7XG4gIGNvbnN0IHN1cHBvcnRlZCA9IHR5cGVvZiBDU1MgIT09ICd1bmRlZmluZWQnICYmIENTUy5zdXBwb3J0cyAmJiBDU1Muc3VwcG9ydHMoJ3Njcm9sbGJhci1ndXR0ZXInLCAnc3RhYmxlJyk7XG4gIGlmICghc3VwcG9ydGVkIHx8IHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChyZWZlcmVuY2VFbGVtZW50KTtcbiAgY29uc3QgaHRtbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG4gIGNvbnN0IGJvZHkgPSBkb2MuYm9keTtcbiAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyID0gaXNPdmVyZmxvd0VsZW1lbnQoaHRtbCkgPyBodG1sIDogYm9keTtcbiAgY29uc3Qgb3JpZ2luYWxTY3JvbGxDb250YWluZXJPdmVyZmxvd1kgPSBzY3JvbGxDb250YWluZXIuc3R5bGUub3ZlcmZsb3dZO1xuICBjb25zdCBvcmlnaW5hbEh0bWxTdHlsZUd1dHRlciA9IGh0bWwuc3R5bGUuc2Nyb2xsYmFyR3V0dGVyO1xuICBodG1sLnN0eWxlLnNjcm9sbGJhckd1dHRlciA9ICdzdGFibGUnO1xuICBzY3JvbGxDb250YWluZXIuc3R5bGUub3ZlcmZsb3dZID0gJ3Njcm9sbCc7XG4gIGNvbnN0IGJlZm9yZSA9IHNjcm9sbENvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgc2Nyb2xsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93WSA9ICdoaWRkZW4nO1xuICBjb25zdCBhZnRlciA9IHNjcm9sbENvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgc2Nyb2xsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93WSA9IG9yaWdpbmFsU2Nyb2xsQ29udGFpbmVyT3ZlcmZsb3dZO1xuICBodG1sLnN0eWxlLnNjcm9sbGJhckd1dHRlciA9IG9yaWdpbmFsSHRtbFN0eWxlR3V0dGVyO1xuICByZXR1cm4gYmVmb3JlID09PSBhZnRlcjtcbn1cbmZ1bmN0aW9uIHByZXZlbnRTY3JvbGxPdmVybGF5U2Nyb2xsYmFycyhyZWZlcmVuY2VFbGVtZW50KSB7XG4gIGNvbnN0IGRvYyA9IG93bmVyRG9jdW1lbnQocmVmZXJlbmNlRWxlbWVudCk7XG4gIGNvbnN0IGh0bWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICBjb25zdCBib2R5ID0gZG9jLmJvZHk7XG5cbiAgLy8gSWYgYW4gYG92ZXJmbG93YCBzdHlsZSBpcyBwcmVzZW50IG9uIDxodG1sPiwgd2UgbmVlZCB0byBsb2NrIGl0LCBiZWNhdXNlIGEgbG9jayBvbiA8Ym9keT5cbiAgLy8gd29uJ3QgaGF2ZSBhbnkgZWZmZWN0LlxuICAvLyBCdXQgaWYgPGJvZHk+IGhhcyBhbiBgb3ZlcmZsb3dgIHN0eWxlIChsaWtlIGBvdmVyZmxvdy14OiBoaWRkZW5gKSwgd2UgbmVlZCB0byBsb2NrIGl0XG4gIC8vIGluc3RlYWQsIGFzIHN0aWNreSBlbGVtZW50cyBzaGlmdCBvdGhlcndpc2UuXG4gIGNvbnN0IGVsZW1lbnRUb0xvY2sgPSBpc092ZXJmbG93RWxlbWVudChodG1sKSA/IGh0bWwgOiBib2R5O1xuICBjb25zdCBvcmlnaW5hbEVsZW1lbnRUb0xvY2tTdHlsZXMgPSB7XG4gICAgb3ZlcmZsb3dZOiBlbGVtZW50VG9Mb2NrLnN0eWxlLm92ZXJmbG93WSxcbiAgICBvdmVyZmxvd1g6IGVsZW1lbnRUb0xvY2suc3R5bGUub3ZlcmZsb3dYXG4gIH07XG4gIE9iamVjdC5hc3NpZ24oZWxlbWVudFRvTG9jay5zdHlsZSwge1xuICAgIG92ZXJmbG93WTogJ2hpZGRlbicsXG4gICAgb3ZlcmZsb3dYOiAnaGlkZGVuJ1xuICB9KTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBPYmplY3QuYXNzaWduKGVsZW1lbnRUb0xvY2suc3R5bGUsIG9yaWdpbmFsRWxlbWVudFRvTG9ja1N0eWxlcyk7XG4gIH07XG59XG5mdW5jdGlvbiBwcmV2ZW50U2Nyb2xsSW5zZXRTY3JvbGxiYXJzKHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChyZWZlcmVuY2VFbGVtZW50KTtcbiAgY29uc3QgaHRtbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG4gIGNvbnN0IGJvZHkgPSBkb2MuYm9keTtcbiAgY29uc3Qgd2luID0gb3duZXJXaW5kb3coaHRtbCk7XG4gIGxldCBzY3JvbGxUb3AgPSAwO1xuICBsZXQgc2Nyb2xsTGVmdCA9IDA7XG4gIGxldCB1cGRhdGVHdXR0ZXJPbmx5ID0gZmFsc2U7XG4gIGNvbnN0IHJlc2l6ZUZyYW1lID0gQW5pbWF0aW9uRnJhbWUuY3JlYXRlKCk7XG5cbiAgLy8gUGluY2gtem9vbSBpbiBTYWZhcmkgY2F1c2VzIGEgc2hpZnQuIEp1c3QgZG9uJ3QgbG9jayBzY3JvbGwgaWYgdGhlcmUncyBhbnkgcGluY2gtem9vbS5cbiAgaWYgKGlzV2ViS2l0ICYmICh3aW4udmlzdWFsVmlld3BvcnQ/LnNjYWxlID8/IDEpICE9PSAxKSB7XG4gICAgcmV0dXJuICgpID0+IHt9O1xuICB9XG4gIGZ1bmN0aW9uIGxvY2tTY3JvbGwoKSB7XG4gICAgLyogRE9NIHJlYWRzOiAqL1xuXG4gICAgY29uc3QgaHRtbFN0eWxlcyA9IHdpbi5nZXRDb21wdXRlZFN0eWxlKGh0bWwpO1xuICAgIGNvbnN0IGJvZHlTdHlsZXMgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZShib2R5KTtcbiAgICBjb25zdCBodG1sU2Nyb2xsYmFyR3V0dGVyVmFsdWUgPSBodG1sU3R5bGVzLnNjcm9sbGJhckd1dHRlciB8fCAnJztcbiAgICBjb25zdCBoYXNCb3RoRWRnZXMgPSBodG1sU2Nyb2xsYmFyR3V0dGVyVmFsdWUuaW5jbHVkZXMoJ2JvdGgtZWRnZXMnKTtcbiAgICBjb25zdCBzY3JvbGxiYXJHdXR0ZXJWYWx1ZSA9IGhhc0JvdGhFZGdlcyA/ICdzdGFibGUgYm90aC1lZGdlcycgOiAnc3RhYmxlJztcbiAgICBzY3JvbGxUb3AgPSBodG1sLnNjcm9sbFRvcDtcbiAgICBzY3JvbGxMZWZ0ID0gaHRtbC5zY3JvbGxMZWZ0O1xuICAgIG9yaWdpbmFsSHRtbFN0eWxlcyA9IHtcbiAgICAgIHNjcm9sbGJhckd1dHRlcjogaHRtbC5zdHlsZS5zY3JvbGxiYXJHdXR0ZXIsXG4gICAgICBvdmVyZmxvd1k6IGh0bWwuc3R5bGUub3ZlcmZsb3dZLFxuICAgICAgb3ZlcmZsb3dYOiBodG1sLnN0eWxlLm92ZXJmbG93WFxuICAgIH07XG4gICAgb3JpZ2luYWxIdG1sU2Nyb2xsQmVoYXZpb3IgPSBodG1sLnN0eWxlLnNjcm9sbEJlaGF2aW9yO1xuICAgIG9yaWdpbmFsQm9keVN0eWxlcyA9IHtcbiAgICAgIHBvc2l0aW9uOiBib2R5LnN0eWxlLnBvc2l0aW9uLFxuICAgICAgaGVpZ2h0OiBib2R5LnN0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiBib2R5LnN0eWxlLndpZHRoLFxuICAgICAgYm94U2l6aW5nOiBib2R5LnN0eWxlLmJveFNpemluZyxcbiAgICAgIG92ZXJmbG93WTogYm9keS5zdHlsZS5vdmVyZmxvd1ksXG4gICAgICBvdmVyZmxvd1g6IGJvZHkuc3R5bGUub3ZlcmZsb3dYLFxuICAgICAgc2Nyb2xsQmVoYXZpb3I6IGJvZHkuc3R5bGUuc2Nyb2xsQmVoYXZpb3JcbiAgICB9O1xuICAgIGNvbnN0IGlzU2Nyb2xsYWJsZVkgPSBodG1sLnNjcm9sbEhlaWdodCA+IGh0bWwuY2xpZW50SGVpZ2h0O1xuICAgIGNvbnN0IGlzU2Nyb2xsYWJsZVggPSBodG1sLnNjcm9sbFdpZHRoID4gaHRtbC5jbGllbnRXaWR0aDtcbiAgICBjb25zdCBoYXNDb25zdGFudE92ZXJmbG93WSA9IGh0bWxTdHlsZXMub3ZlcmZsb3dZID09PSAnc2Nyb2xsJyB8fCBib2R5U3R5bGVzLm92ZXJmbG93WSA9PT0gJ3Njcm9sbCc7XG4gICAgY29uc3QgaGFzQ29uc3RhbnRPdmVyZmxvd1ggPSBodG1sU3R5bGVzLm92ZXJmbG93WCA9PT0gJ3Njcm9sbCcgfHwgYm9keVN0eWxlcy5vdmVyZmxvd1ggPT09ICdzY3JvbGwnO1xuXG4gICAgLy8gVmFsdWVzIGNhbiBiZSBuZWdhdGl2ZSBpbiBGaXJlZm94XG4gICAgY29uc3Qgc2Nyb2xsYmFyV2lkdGggPSBNYXRoLm1heCgwLCB3aW4uaW5uZXJXaWR0aCAtIGJvZHkuY2xpZW50V2lkdGgpO1xuICAgIGNvbnN0IHNjcm9sbGJhckhlaWdodCA9IE1hdGgubWF4KDAsIHdpbi5pbm5lckhlaWdodCAtIGJvZHkuY2xpZW50SGVpZ2h0KTtcblxuICAgIC8vIEF2b2lkIHNoaWZ0IGR1ZSB0byB0aGUgZGVmYXVsdCA8Ym9keT4gbWFyZ2luLiBUaGlzIGRvZXMgY2F1c2UgZWxlbWVudHMgdG8gYmUgY2xpcHBlZFxuICAgIC8vIHdpdGggd2hpdGVzcGFjZS4gV2FybiBpZiA8Ym9keT4gaGFzIG1hcmdpbnM/XG4gICAgY29uc3QgbWFyZ2luWSA9IHBhcnNlRmxvYXQoYm9keVN0eWxlcy5tYXJnaW5Ub3ApICsgcGFyc2VGbG9hdChib2R5U3R5bGVzLm1hcmdpbkJvdHRvbSk7XG4gICAgY29uc3QgbWFyZ2luWCA9IHBhcnNlRmxvYXQoYm9keVN0eWxlcy5tYXJnaW5MZWZ0KSArIHBhcnNlRmxvYXQoYm9keVN0eWxlcy5tYXJnaW5SaWdodCk7XG4gICAgY29uc3QgZWxlbWVudFRvTG9jayA9IGlzT3ZlcmZsb3dFbGVtZW50KGh0bWwpID8gaHRtbCA6IGJvZHk7XG4gICAgdXBkYXRlR3V0dGVyT25seSA9IHN1cHBvcnRzU3RhYmxlU2Nyb2xsYmFyR3V0dGVyKHJlZmVyZW5jZUVsZW1lbnQpO1xuXG4gICAgLypcbiAgICAgKiBET00gd3JpdGVzOlxuICAgICAqIERvIG5vdCByZWFkIHRoZSBET00gcGFzdCB0aGlzIHBvaW50IVxuICAgICAqL1xuXG4gICAgaWYgKHVwZGF0ZUd1dHRlck9ubHkpIHtcbiAgICAgIGh0bWwuc3R5bGUuc2Nyb2xsYmFyR3V0dGVyID0gc2Nyb2xsYmFyR3V0dGVyVmFsdWU7XG4gICAgICBlbGVtZW50VG9Mb2NrLnN0eWxlLm92ZXJmbG93WSA9ICdoaWRkZW4nO1xuICAgICAgZWxlbWVudFRvTG9jay5zdHlsZS5vdmVyZmxvd1ggPSAnaGlkZGVuJztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgT2JqZWN0LmFzc2lnbihodG1sLnN0eWxlLCB7XG4gICAgICBzY3JvbGxiYXJHdXR0ZXI6IHNjcm9sbGJhckd1dHRlclZhbHVlLFxuICAgICAgb3ZlcmZsb3dZOiAnaGlkZGVuJyxcbiAgICAgIG92ZXJmbG93WDogJ2hpZGRlbidcbiAgICB9KTtcbiAgICBpZiAoaXNTY3JvbGxhYmxlWSB8fCBoYXNDb25zdGFudE92ZXJmbG93WSkge1xuICAgICAgaHRtbC5zdHlsZS5vdmVyZmxvd1kgPSAnc2Nyb2xsJztcbiAgICB9XG4gICAgaWYgKGlzU2Nyb2xsYWJsZVggfHwgaGFzQ29uc3RhbnRPdmVyZmxvd1gpIHtcbiAgICAgIGh0bWwuc3R5bGUub3ZlcmZsb3dYID0gJ3Njcm9sbCc7XG4gICAgfVxuICAgIE9iamVjdC5hc3NpZ24oYm9keS5zdHlsZSwge1xuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICBoZWlnaHQ6IG1hcmdpblkgfHwgc2Nyb2xsYmFySGVpZ2h0ID8gYGNhbGMoMTAwZHZoIC0gJHttYXJnaW5ZICsgc2Nyb2xsYmFySGVpZ2h0fXB4KWAgOiAnMTAwZHZoJyxcbiAgICAgIHdpZHRoOiBtYXJnaW5YIHx8IHNjcm9sbGJhcldpZHRoID8gYGNhbGMoMTAwdncgLSAke21hcmdpblggKyBzY3JvbGxiYXJXaWR0aH1weClgIDogJzEwMHZ3JyxcbiAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgc2Nyb2xsQmVoYXZpb3I6ICd1bnNldCdcbiAgICB9KTtcbiAgICBib2R5LnNjcm9sbFRvcCA9IHNjcm9sbFRvcDtcbiAgICBib2R5LnNjcm9sbExlZnQgPSBzY3JvbGxMZWZ0O1xuICAgIGh0bWwuc2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdWktc2Nyb2xsLWxvY2tlZCcsICcnKTtcbiAgICBodG1sLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gJ3Vuc2V0JztcbiAgfVxuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIE9iamVjdC5hc3NpZ24oaHRtbC5zdHlsZSwgb3JpZ2luYWxIdG1sU3R5bGVzKTtcbiAgICBPYmplY3QuYXNzaWduKGJvZHkuc3R5bGUsIG9yaWdpbmFsQm9keVN0eWxlcyk7XG4gICAgaWYgKCF1cGRhdGVHdXR0ZXJPbmx5KSB7XG4gICAgICBodG1sLnNjcm9sbFRvcCA9IHNjcm9sbFRvcDtcbiAgICAgIGh0bWwuc2Nyb2xsTGVmdCA9IHNjcm9sbExlZnQ7XG4gICAgICBodG1sLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVpLXNjcm9sbC1sb2NrZWQnKTtcbiAgICAgIGh0bWwuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBvcmlnaW5hbEh0bWxTY3JvbGxCZWhhdmlvcjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaGFuZGxlUmVzaXplKCkge1xuICAgIGNsZWFudXAoKTtcbiAgICByZXNpemVGcmFtZS5yZXF1ZXN0KGxvY2tTY3JvbGwpO1xuICB9XG4gIGxvY2tTY3JvbGwoKTtcbiAgY29uc3QgdW5zdWJzY3JpYmVSZXNpemUgPSBhZGRFdmVudExpc3RlbmVyKHdpbiwgJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgcmVzaXplRnJhbWUuY2FuY2VsKCk7XG4gICAgY2xlYW51cCgpO1xuICAgIC8vIFNvbWV0aW1lcyB0aGlzIGNsZWFudXAgY2FuIHJ1biBhZnRlciB0ZXN0IHRlYXJkb3duIGJlY2F1c2UgaXQgaXMgY2FsbGVkXG4gICAgLy8gaW4gYSBgc2V0VGltZW91dChmbiwgMClgLiBHdWFyZCB0aGUgcmV0dXJuZWQgY2xlYW51cCB0byBhdm9pZCBjYWxsaW5nXG4gICAgLy8gYHJlbW92ZUV2ZW50TGlzdGVuZXJgIHdoZW4gaXQgaXMgbm8gbG9uZ2VyIGF2YWlsYWJsZSBpbiB0ZXN0cy5cbiAgICBpZiAodHlwZW9mIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB1bnN1YnNjcmliZVJlc2l6ZSgpO1xuICAgIH1cbiAgfTtcbn1cbmNsYXNzIFNjcm9sbExvY2tlciB7XG4gIGxvY2tDb3VudCA9IDA7XG4gIHJlc3RvcmUgPSBudWxsO1xuICB0aW1lb3V0TG9jayA9IFRpbWVvdXQuY3JlYXRlKCk7XG4gIHRpbWVvdXRVbmxvY2sgPSBUaW1lb3V0LmNyZWF0ZSgpO1xuICBhY3F1aXJlKHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICB0aGlzLmxvY2tDb3VudCArPSAxO1xuICAgIGlmICh0aGlzLmxvY2tDb3VudCA9PT0gMSAmJiB0aGlzLnJlc3RvcmUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMudGltZW91dExvY2suc3RhcnQoMCwgKCkgPT4gdGhpcy5sb2NrKHJlZmVyZW5jZUVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVsZWFzZTtcbiAgfVxuICByZWxlYXNlID0gKCkgPT4ge1xuICAgIHRoaXMubG9ja0NvdW50IC09IDE7XG4gICAgaWYgKHRoaXMubG9ja0NvdW50ID09PSAwICYmIHRoaXMucmVzdG9yZSkge1xuICAgICAgdGhpcy50aW1lb3V0VW5sb2NrLnN0YXJ0KDAsIHRoaXMudW5sb2NrKTtcbiAgICB9XG4gIH07XG4gIHVubG9jayA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5sb2NrQ291bnQgPT09IDAgJiYgdGhpcy5yZXN0b3JlKSB7XG4gICAgICB0aGlzLnJlc3RvcmU/LigpO1xuICAgICAgdGhpcy5yZXN0b3JlID0gbnVsbDtcbiAgICB9XG4gIH07XG4gIGxvY2socmVmZXJlbmNlRWxlbWVudCkge1xuICAgIGlmICh0aGlzLmxvY2tDb3VudCA9PT0gMCB8fCB0aGlzLnJlc3RvcmUgIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZG9jID0gb3duZXJEb2N1bWVudChyZWZlcmVuY2VFbGVtZW50KTtcbiAgICBjb25zdCBodG1sID0gZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICBjb25zdCBodG1sT3ZlcmZsb3dZID0gb3duZXJXaW5kb3coaHRtbCkuZ2V0Q29tcHV0ZWRTdHlsZShodG1sKS5vdmVyZmxvd1k7XG5cbiAgICAvLyBJZiB0aGUgc2l0ZSBhdXRob3IgYWxyZWFkeSBoaWQgb3ZlcmZsb3cgb24gPGh0bWw+LCByZXNwZWN0IGl0IGFuZCBiYWlsIG91dC5cbiAgICBpZiAoaHRtbE92ZXJmbG93WSA9PT0gJ2hpZGRlbicgfHwgaHRtbE92ZXJmbG93WSA9PT0gJ2NsaXAnKSB7XG4gICAgICB0aGlzLnJlc3RvcmUgPSBOT09QO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBoYXNPdmVybGF5U2Nyb2xsYmFycyA9IGlzSU9TIHx8ICFoYXNJbnNldFNjcm9sbGJhcnMocmVmZXJlbmNlRWxlbWVudCk7XG5cbiAgICAvLyBPbiBpT1MsIHNjcm9sbCBsb2NraW5nIGRvZXMgbm90IHdvcmsgaWYgdGhlIG5hdmJhciBpcyBjb2xsYXBzZWQuIER1ZSB0byBudW1lcm91c1xuICAgIC8vIHNpZGUgZWZmZWN0cyBhbmQgYnVncyB0aGF0IGFyaXNlIG9uIGlPUywgaXQgbXVzdCBiZSByZXNlYXJjaGVkIGV4dGVuc2l2ZWx5IGJlZm9yZVxuICAgIC8vIGJlaW5nIGVuYWJsZWQgdG8gZW5zdXJlIGl0IGRvZXNuJ3QgY2F1c2UgdGhlIGZvbGxvd2luZyBpc3N1ZXM6XG4gICAgLy8gLSBUZXh0Ym94ZXMgbXVzdCBzY3JvbGwgaW50byB2aWV3IHdoZW4gZm9jdXNlZCwgbm9yIGNhdXNlIGEgZ2xpdGNoeSBzY3JvbGwgYW5pbWF0aW9uLlxuICAgIC8vIC0gVGhlIG5hdmJhciBtdXN0IG5vdCBmb3JjZSBpdHNlbGYgaW50byB2aWV3IGFuZCBjYXVzZSBsYXlvdXQgc2hpZnQuXG4gICAgLy8gLSBTY3JvbGwgY29udGFpbmVycyBtdXN0IG5vdCBmbGlja2VyIHVwb24gY2xvc2luZyBhIHBvcHVwIHdoZW4gaXQgaGFzIGFuIGV4aXQgYW5pbWF0aW9uLlxuICAgIHRoaXMucmVzdG9yZSA9IGhhc092ZXJsYXlTY3JvbGxiYXJzID8gcHJldmVudFNjcm9sbE92ZXJsYXlTY3JvbGxiYXJzKHJlZmVyZW5jZUVsZW1lbnQpIDogcHJldmVudFNjcm9sbEluc2V0U2Nyb2xsYmFycyhyZWZlcmVuY2VFbGVtZW50KTtcbiAgfVxufVxuY29uc3QgU0NST0xMX0xPQ0tFUiA9IG5ldyBTY3JvbGxMb2NrZXIoKTtcblxuLyoqXG4gKiBMb2NrcyB0aGUgc2Nyb2xsIG9mIHRoZSBkb2N1bWVudCB3aGVuIGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIGVuYWJsZWQgLSBXaGV0aGVyIHRvIGVuYWJsZSB0aGUgc2Nyb2xsIGxvY2suXG4gKiBAcGFyYW0gcmVmZXJlbmNlRWxlbWVudCAtIEVsZW1lbnQgdG8gdXNlIGFzIGEgcmVmZXJlbmNlIGZvciBsb2NrIGNhbGN1bGF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVNjcm9sbExvY2soZW5hYmxlZCA9IHRydWUsIHJlZmVyZW5jZUVsZW1lbnQgPSBudWxsKSB7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gU0NST0xMX0xPQ0tFUi5hY3F1aXJlKHJlZmVyZW5jZUVsZW1lbnQpO1xuICB9LCBbZW5hYmxlZCwgcmVmZXJlbmNlRWxlbWVudF0pO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuLyoqXG4gKiBQcm92aWRlcyBhIGNyb3NzLWJyb3dzZXIgd2F5IHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiB0aGUgcG9pbnRlciB1c2VkIHRvIGNsaWNrLlxuICogU2FmYXJpIGFuZCBGaXJlZm94IGRvIG5vdCBwcm92aWRlIHRoZSBQb2ludGVyRXZlbnQgdG8gdGhlIGNsaWNrIGhhbmRsZXIgKHRoZXkgdXNlIE1vdXNlRXZlbnQpIHlldC5cbiAqIEFkZGl0aW9uYWxseSwgdGhpcyBpbXBsZW1lbnRhdGlvbiBkZXRlY3RzIGlmIHRoZSBjbGljayB3YXMgdHJpZ2dlcmVkIGJ5IHRoZSBrZXlib2FyZC5cbiAqXG4gKiBAcGFyYW0gaGFuZGxlciBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLiBUaGUgZmlyc3QgcGFyYW1ldGVyIGlzIHRoZSBvcmlnaW5hbCBldmVudCBhbmQgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgdGhlIHBvaW50ZXIgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUVuaGFuY2VkQ2xpY2tIYW5kbGVyKGhhbmRsZXIpIHtcbiAgY29uc3QgbGFzdENsaWNrSW50ZXJhY3Rpb25UeXBlUmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3QgaGFuZGxlUG9pbnRlckRvd24gPSBSZWFjdC51c2VDYWxsYmFjayhldmVudCA9PiB7XG4gICAgaWYgKGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGFzdENsaWNrSW50ZXJhY3Rpb25UeXBlUmVmLmN1cnJlbnQgPSBldmVudC5wb2ludGVyVHlwZTtcbiAgICBoYW5kbGVyKGV2ZW50LCBldmVudC5wb2ludGVyVHlwZSk7XG4gIH0sIFtoYW5kbGVyXSk7XG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gUmVhY3QudXNlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIC8vIGV2ZW50LmRldGFpbCBoYXMgdGhlIG51bWJlciBvZiBjbGlja3MgcGVyZm9ybWVkIG9uIHRoZSBlbGVtZW50LiAwIG1lYW5zIGl0IHdhcyB0cmlnZ2VyZWQgYnkgdGhlIGtleWJvYXJkLlxuICAgIGlmIChldmVudC5kZXRhaWwgPT09IDApIHtcbiAgICAgIGhhbmRsZXIoZXZlbnQsICdrZXlib2FyZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoJ3BvaW50ZXJUeXBlJyBpbiBldmVudCkge1xuICAgICAgLy8gQ2hyb21lIGFuZCBFZGdlIGNvcnJlY3RseSB1c2UgUG9pbnRlckV2ZW50XG4gICAgICBoYW5kbGVyKGV2ZW50LCBldmVudC5wb2ludGVyVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhhbmRsZXIoZXZlbnQsIGxhc3RDbGlja0ludGVyYWN0aW9uVHlwZVJlZi5jdXJyZW50KTtcbiAgICB9XG4gICAgbGFzdENsaWNrSW50ZXJhY3Rpb25UeXBlUmVmLmN1cnJlbnQgPSAnJztcbiAgfSwgW2hhbmRsZXJdKTtcbiAgcmV0dXJuIHtcbiAgICBvbkNsaWNrOiBoYW5kbGVDbGljayxcbiAgICBvblBvaW50ZXJEb3duOiBoYW5kbGVQb2ludGVyRG93blxuICB9O1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyB1c2VFbmhhbmNlZENsaWNrSGFuZGxlciB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUVuaGFuY2VkQ2xpY2tIYW5kbGVyJztcbmltcG9ydCB7IGlzSU9TIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvZGV0ZWN0QnJvd3Nlcic7XG5pbXBvcnQgeyB1c2VWYWx1ZUNoYW5nZWQgfSBmcm9tIFwiLi4vaW50ZXJuYWxzL3VzZVZhbHVlQ2hhbmdlZC5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU9wZW5NZXRob2RUcmlnZ2VyUHJvcHMob3Blbiwgc2V0T3Blbk1ldGhvZCkge1xuICBjb25zdCBoYW5kbGVUcmlnZ2VyQ2xpY2sgPSB1c2VTdGFibGVDYWxsYmFjaygoXywgaW50ZXJhY3Rpb25UeXBlKSA9PiB7XG4gICAgY29uc3QgaXNPcGVuID0gdHlwZW9mIG9wZW4gPT09ICdmdW5jdGlvbicgPyBvcGVuKCkgOiBvcGVuO1xuICAgIGlmICghaXNPcGVuKSB7XG4gICAgICBzZXRPcGVuTWV0aG9kKGludGVyYWN0aW9uVHlwZSB8fCAoXG4gICAgICAvLyBPbiBpT1MgU2FmYXJpLCB0aGUgaGl0c2xvcCBhcm91bmQgdG91Y2ggdGFyZ2V0cyBtZWFucyB0YXBwaW5nIG91dHNpZGUgYW4gZWxlbWVudCdzXG4gICAgICAvLyBib3VuZHMgZG9lcyBub3QgZmlyZSBgcG9pbnRlcmRvd25gIGJ1dCBkb2VzIGZpcmUgYG1vdXNlZG93bmAuIFRoZSBgaW50ZXJhY3Rpb25UeXBlYFxuICAgICAgLy8gd2lsbCBiZSBcIlwiIGluIHRoYXQgY2FzZS5cbiAgICAgIGlzSU9TID8gJ3RvdWNoJyA6ICcnKSk7XG4gICAgfVxuICB9KTtcbiAgY29uc3Qge1xuICAgIG9uQ2xpY2ssXG4gICAgb25Qb2ludGVyRG93blxuICB9ID0gdXNlRW5oYW5jZWRDbGlja0hhbmRsZXIoaGFuZGxlVHJpZ2dlckNsaWNrKTtcbiAgcmV0dXJuIFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICBvbkNsaWNrLFxuICAgIG9uUG9pbnRlckRvd25cbiAgfSksIFtvbkNsaWNrLCBvblBvaW50ZXJEb3duXSk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgaW50ZXJhY3Rpb24gdHlwZSAoa2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgZXRjLikgdGhhdCBvcGVuZWQgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gb3BlbiBUaGUgb3BlbiBzdGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlT3BlbkludGVyYWN0aW9uVHlwZShvcGVuKSB7XG4gIGNvbnN0IFtvcGVuTWV0aG9kLCBzZXRPcGVuTWV0aG9kXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpO1xuICBjb25zdCB0cmlnZ2VyUHJvcHMgPSB1c2VPcGVuTWV0aG9kVHJpZ2dlclByb3BzKG9wZW4sIHNldE9wZW5NZXRob2QpO1xuICB1c2VWYWx1ZUNoYW5nZWQob3BlbiwgcHJldmlvdXNPcGVuID0+IHtcbiAgICBpZiAocHJldmlvdXNPcGVuICYmICFvcGVuKSB7XG4gICAgICBzZXRPcGVuTWV0aG9kKG51bGwpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgb3Blbk1ldGhvZCxcbiAgICB0cmlnZ2VyUHJv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QTRCLE9BQU87R0FFcEQsNEJBQTRCLFVBQVU7RUFDeEMsR0FBRyxDQUFDLE9BQU8sQ0FFVTtFQUNuQixlQUFlO0NBQ2pCO0FBQ0Y7OztBQzlCQSxTQUFnQiwwQkFBMEIsTUFBTSxlQUFlO0NBVzdELE1BQU0sRUFDSixTQUNBLGtCQUNFLHdCQWJ1QixtQkFBbUIsR0FBRyxvQkFBb0I7RUFFbkUsSUFBSSxFQURXLE9BQU8sU0FBUyxhQUFhLEtBQUssSUFBSSxPQUVuRCxjQUFjLG9CQUlkLFFBQVEsVUFBVSxHQUFHO0NBRXpCLENBSTRCLENBQWtCO0NBQzlDLE9BQUEsYUFBYSxlQUFlO0VBQzFCO0VBQ0E7Q0FDRixJQUFJLENBQUMsU0FBUyxhQUFhLENBQUM7QUFDOUI7Ozs7OztBQU9BLFNBQWdCLHVCQUF1QixNQUFNO0NBQzNDLE1BQU0sQ0FBQyxZQUFZLGlCQUFBLGFBQXVCLFNBQVMsSUFBSTtDQUN2RCxNQUFNLGVBQWUsMEJBQTBCLE1BQU0sYUFBYTtDQUNsRSxnQkFBZ0IsT0FBTSxpQkFBZ0I7RUFDcEMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUNuQixjQUFjLElBQUk7Q0FFdEIsQ0FBQztDQUNELE9BQUEsYUFBYSxlQUFlO0VBQzFCO0VBQ0E7Q0FDRixJQUFJLENBQUMsWUFBWSxZQUFZLENBQUM7QUFDaEMiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNV19