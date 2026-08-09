import { i as __toESM } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_react_dom } from "/node_modules/.vite/deps/react-dom.js?v=1d2f6f90";
import { a as getComputedStyle$1, g as isHTMLElement, r as useStableCallback, t as useIsoLayoutEffect } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { c as useRefWithInit, o as isReactVersionAtLeast } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
//#region node_modules/@base-ui/react/esm/internals/stateAttributesMapping.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var TransitionStatusDataAttributes = /*#__PURE__*/ function(TransitionStatusDataAttributes) {
	/**
	* Present when the component is animating in.
	*/
	TransitionStatusDataAttributes["startingStyle"] = "data-starting-style";
	/**
	* Present when the component is animating out.
	*/
	TransitionStatusDataAttributes["endingStyle"] = "data-ending-style";
	return TransitionStatusDataAttributes;
}({});
var STARTING_HOOK = { [TransitionStatusDataAttributes.startingStyle]: "" };
var ENDING_HOOK = { [TransitionStatusDataAttributes.endingStyle]: "" };
var transitionStatusMapping = { transitionStatus(value) {
	if (value === "starting") return STARTING_HOOK;
	if (value === "ending") return ENDING_HOOK;
	return null;
} };
//#endregion
//#region node_modules/@base-ui/utils/esm/useOnMount.js
var EMPTY$1 = [];
/**
* A React.useEffect equivalent that runs once, when the component is mounted.
*/
function useOnMount(fn) {
	import_react.useEffect(fn, EMPTY$1);
}
//#endregion
//#region node_modules/@base-ui/utils/esm/detectBrowser.js
var hasNavigator = typeof navigator !== "undefined";
var nav = getNavigatorData();
var platform = getPlatform();
var userAgent = getUserAgent();
var isWebKit = typeof CSS === "undefined" || !CSS.supports ? false : CSS.supports("-webkit-backdrop-filter:none");
var isIOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1 ? true : /iP(hone|ad|od)|iOS/.test(nav.platform);
hasNavigator && /firefox/i.test(userAgent);
var isSafari = hasNavigator && /apple/i.test(navigator.vendor);
hasNavigator && /Edg/i.test(userAgent);
var isAndroid = hasNavigator && /android/i.test(platform) || /android/i.test(userAgent);
var isMac = hasNavigator && platform.toLowerCase().startsWith("mac") && !navigator.maxTouchPoints;
var isJSDOM = userAgent.includes("jsdom/");
function getNavigatorData() {
	if (!hasNavigator) return {
		platform: "",
		maxTouchPoints: -1
	};
	const uaData = navigator.userAgentData;
	if (uaData?.platform) return {
		platform: uaData.platform,
		maxTouchPoints: navigator.maxTouchPoints
	};
	return {
		platform: navigator.platform ?? "",
		maxTouchPoints: navigator.maxTouchPoints ?? -1
	};
}
function getUserAgent() {
	if (!hasNavigator) return "";
	const uaData = navigator.userAgentData;
	if (uaData && Array.isArray(uaData.brands)) return uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(" ");
	return navigator.userAgent;
}
function getPlatform() {
	if (!hasNavigator) return "";
	const uaData = navigator.userAgentData;
	if (uaData?.platform) return uaData.platform;
	return navigator.platform ?? "";
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/event.js
function stopEvent(event) {
	event.preventDefault();
	event.stopPropagation();
}
function isReactEvent(event) {
	return "nativeEvent" in event;
}
function isVirtualClick(event) {
	if (event.pointerType === "" && event.isTrusted) return true;
	if (isAndroid && event.pointerType) return event.type === "click" && event.buttons === 1;
	return event.detail === 0 && !event.pointerType;
}
function isVirtualPointerEvent(event) {
	if (isJSDOM) return false;
	return !isAndroid && event.width === 0 && event.height === 0 || isAndroid && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "mouse" || event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "touch";
}
function isMouseLikePointerType(pointerType, strict) {
	const values = ["mouse", "pen"];
	if (!strict) values.push("", void 0);
	return values.includes(pointerType);
}
function isClickLikeEvent(event) {
	const type = event.type;
	return type === "click" || type === "mousedown" || type === "keydown" || type === "keyup";
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/constants.js
var FOCUSABLE_ATTRIBUTE = "data-base-ui-focusable";
var TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
var ARROW_LEFT$1 = "ArrowLeft";
var ARROW_RIGHT$1 = "ArrowRight";
var ARROW_UP$1 = "ArrowUp";
var ARROW_DOWN$1 = "ArrowDown";
//#endregion
//#region node_modules/@base-ui/utils/esm/useAnimationFrame.js
/** Unlike `setTimeout`, rAF doesn't guarantee a positive integer return value, so we can't have
* a monomorphic `uint` type with `0` meaning empty.
* See warning note at:
* https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame#return_value */
var EMPTY = null;
var LAST_RAF = globalThis.requestAnimationFrame;
var Scheduler = class {
	callbacks = [];
	callbacksCount = 0;
	nextId = 1;
	startId = 1;
	isScheduled = false;
	tick = (timestamp) => {
		this.isScheduled = false;
		const currentCallbacks = this.callbacks;
		const currentCallbacksCount = this.callbacksCount;
		this.callbacks = [];
		this.callbacksCount = 0;
		this.startId = this.nextId;
		if (currentCallbacksCount > 0) for (let i = 0; i < currentCallbacks.length; i += 1) currentCallbacks[i]?.(timestamp);
	};
	request(fn) {
		const id = this.nextId;
		this.nextId += 1;
		this.callbacks.push(fn);
		this.callbacksCount += 1;
		const didRAFChange = LAST_RAF !== requestAnimationFrame && (LAST_RAF = requestAnimationFrame, true);
		if (!this.isScheduled || didRAFChange) {
			requestAnimationFrame(this.tick);
			this.isScheduled = true;
		}
		return id;
	}
	cancel(id) {
		const index = id - this.startId;
		if (index < 0 || index >= this.callbacks.length) return;
		this.callbacks[index] = null;
		this.callbacksCount -= 1;
	}
};
var scheduler = new Scheduler();
var AnimationFrame = class AnimationFrame {
	static create() {
		return new AnimationFrame();
	}
	static request(fn) {
		return scheduler.request(fn);
	}
	static cancel(id) {
		return scheduler.cancel(id);
	}
	currentId = EMPTY;
	/**
	* Executes `fn` after `delay`, clearing any previously scheduled call.
	*/
	request(fn) {
		this.cancel();
		this.currentId = scheduler.request(() => {
			this.currentId = EMPTY;
			fn();
		});
	}
	cancel = () => {
		if (this.currentId !== EMPTY) {
			scheduler.cancel(this.currentId);
			this.currentId = EMPTY;
		}
	};
	disposeEffect = () => {
		return this.cancel;
	};
};
/**
* A `requestAnimationFrame` with automatic cleanup and guard.
*/
function useAnimationFrame() {
	const timeout = useRefWithInit(AnimationFrame.create).current;
	useOnMount(timeout.disposeEffect);
	return timeout;
}
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
/**
* Custom positioning reference element.
* @see https://floating-ui.com/docs/virtual-elements
*/
var sides = [
	"top",
	"right",
	"bottom",
	"left"
];
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
	x: v,
	y: v
});
var oppositeSideMap = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function clamp(start, value, end) {
	return max(start, min(value, end));
}
function evaluate(value, param) {
	return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
	return placement.split("-")[0];
}
function getAlignment(placement) {
	return placement.split("-")[1];
}
function getOppositeAxis(axis) {
	return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
	return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
	const firstChar = placement[0];
	return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
	return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
	if (rtl === void 0) rtl = false;
	const alignment = getAlignment(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const length = getAxisLength(alignmentAxis);
	let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
	if (rects.reference[length] > rects.floating[length]) mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
	return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
	const oppositePlacement = getOppositePlacement(placement);
	return [
		getOppositeAlignmentPlacement(placement),
		oppositePlacement,
		getOppositeAlignmentPlacement(oppositePlacement)
	];
}
function getOppositeAlignmentPlacement(placement) {
	return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
	switch (side) {
		case "top":
		case "bottom":
			if (rtl) return isStart ? rlPlacement : lrPlacement;
			return isStart ? lrPlacement : rlPlacement;
		case "left":
		case "right": return isStart ? tbPlacement : btPlacement;
		default: return [];
	}
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
	const alignment = getAlignment(placement);
	let list = getSideList(getSide(placement), direction === "start", rtl);
	if (alignment) {
		list = list.map((side) => side + "-" + alignment);
		if (flipAlignment) list = list.concat(list.map(getOppositeAlignmentPlacement));
	}
	return list;
}
function getOppositePlacement(placement) {
	const side = getSide(placement);
	return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...padding
	};
}
function getPaddingObject(padding) {
	return typeof padding !== "number" ? expandPaddingObject(padding) : {
		top: padding,
		right: padding,
		bottom: padding,
		left: padding
	};
}
function rectToClientRect(rect) {
	const { x, y, width, height } = rect;
	return {
		width,
		height,
		top: y,
		left: x,
		right: x + width,
		bottom: y + height,
		x,
		y
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/utils/composite.js
function isDifferentGridRow(index, cols, prevRow) {
	return Math.floor(index / cols) !== prevRow;
}
function isIndexOutOfListBounds(list, index) {
	return index < 0 || index >= list.length;
}
function getMinListIndex(listRef, disabledIndices) {
	return findNonDisabledListIndex(listRef.current, { disabledIndices });
}
function getMaxListIndex(listRef, disabledIndices) {
	return findNonDisabledListIndex(listRef.current, {
		decrement: true,
		startingIndex: listRef.current.length,
		disabledIndices
	});
}
function findNonDisabledListIndex(list, { startingIndex = -1, decrement = false, disabledIndices, amount = 1 } = {}) {
	let index = startingIndex;
	do
		index += decrement ? -amount : amount;
	while (index >= 0 && index <= list.length - 1 && isListIndexDisabled(list, index, disabledIndices));
	return index;
}
function getGridNavigatedIndex(list, { event, orientation, loopFocus, onLoop, rtl, cols, disabledIndices, minIndex, maxIndex, prevIndex, stopEvent: stop = false }) {
	let nextIndex = prevIndex;
	let verticalDirection;
	if (event.key === "ArrowUp") verticalDirection = "up";
	else if (event.key === "ArrowDown") verticalDirection = "down";
	if (verticalDirection) {
		const rows = [];
		const rowIndexMap = [];
		let hasRoleRow = false;
		let visibleItemCount = 0;
		{
			let currentRowEl = null;
			let currentRowIndex = -1;
			list.forEach((el, idx) => {
				if (el == null) return;
				visibleItemCount += 1;
				const rowEl = el.closest("[role=\"row\"]");
				if (rowEl) hasRoleRow = true;
				if (rowEl !== currentRowEl || currentRowIndex === -1) {
					currentRowEl = rowEl;
					currentRowIndex += 1;
					rows[currentRowIndex] = [];
				}
				rows[currentRowIndex].push(idx);
				rowIndexMap[idx] = currentRowIndex;
			});
		}
		let hasDomRows = false;
		let inferredDomCols = 0;
		if (hasRoleRow) for (const row of rows) {
			const rowLength = row.length;
			if (rowLength > inferredDomCols) inferredDomCols = rowLength;
			if (rowLength !== cols) hasDomRows = true;
		}
		const hasVirtualizedGaps = hasDomRows && visibleItemCount < list.length;
		const verticalCols = inferredDomCols || cols;
		const navigateVertically = (direction) => {
			if (!hasDomRows || prevIndex === -1) return;
			const currentRow = rowIndexMap[prevIndex];
			if (currentRow == null) return;
			const colInRow = rows[currentRow].indexOf(prevIndex);
			const step = direction === "up" ? -1 : 1;
			for (let nextRow = currentRow + step, i = 0; i < rows.length; i += 1, nextRow += step) {
				if (nextRow < 0 || nextRow >= rows.length) {
					if (!loopFocus || hasVirtualizedGaps) return;
					nextRow = nextRow < 0 ? rows.length - 1 : 0;
					if (onLoop) {
						const clampedCol = Math.min(colInRow, rows[nextRow].length - 1);
						const returnedItemIndex = onLoop(event, prevIndex, rows[nextRow][clampedCol] ?? rows[nextRow][0]);
						nextRow = rowIndexMap[returnedItemIndex] ?? nextRow;
					}
				}
				const targetRow = rows[nextRow];
				for (let col = Math.min(colInRow, targetRow.length - 1); col >= 0; col -= 1) {
					const candidate = targetRow[col];
					if (!isListIndexDisabled(list, candidate, disabledIndices)) return candidate;
				}
			}
		};
		const navigateVerticallyWithInferredRows = (direction) => {
			if (!hasVirtualizedGaps || prevIndex === -1) return;
			const colInRow = prevIndex % verticalCols;
			const rowStep = direction === "up" ? -verticalCols : verticalCols;
			const lastRowStart = maxIndex - maxIndex % verticalCols;
			const rowCount = floor(maxIndex / verticalCols) + 1;
			for (let rowStart = prevIndex - colInRow + rowStep, i = 0; i < rowCount; i += 1, rowStart += rowStep) {
				if (rowStart < 0 || rowStart > maxIndex) {
					if (!loopFocus) return;
					rowStart = rowStart < 0 ? lastRowStart : 0;
				}
				const rowEnd = Math.min(rowStart + verticalCols - 1, maxIndex);
				for (let candidate = Math.min(rowStart + colInRow, rowEnd); candidate >= rowStart; candidate -= 1) if (!isListIndexDisabled(list, candidate, disabledIndices)) return candidate;
			}
		};
		if (stop) stopEvent(event);
		const verticalCandidate = navigateVertically(verticalDirection) ?? navigateVerticallyWithInferredRows(verticalDirection);
		if (verticalCandidate !== void 0) nextIndex = verticalCandidate;
		else if (prevIndex === -1) nextIndex = verticalDirection === "up" ? maxIndex : minIndex;
		else {
			nextIndex = findNonDisabledListIndex(list, {
				startingIndex: prevIndex,
				amount: verticalCols,
				decrement: verticalDirection === "up",
				disabledIndices
			});
			if (loopFocus) {
				if (verticalDirection === "up" && (prevIndex - verticalCols < minIndex || nextIndex < 0)) {
					const col = prevIndex % verticalCols;
					const maxCol = maxIndex % verticalCols;
					const offset = maxIndex - (maxCol - col);
					if (maxCol === col) nextIndex = maxIndex;
					else nextIndex = maxCol > col ? offset : offset - verticalCols;
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
				if (verticalDirection === "down" && prevIndex + verticalCols > maxIndex) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex % verticalCols - verticalCols,
						amount: verticalCols,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			}
		}
		if (isIndexOutOfListBounds(list, nextIndex)) nextIndex = prevIndex;
	}
	if (orientation === "both") {
		const prevRow = floor(prevIndex / cols);
		if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
			if (stop) stopEvent(event);
			if (prevIndex % cols !== cols - 1) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex,
					disabledIndices
				});
				if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex - prevIndex % cols - 1,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			} else if (loopFocus) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex - prevIndex % cols - 1,
					disabledIndices
				});
				if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
			}
			if (isDifferentGridRow(nextIndex, cols, prevRow)) nextIndex = prevIndex;
		}
		if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
			if (stop) stopEvent(event);
			if (prevIndex % cols !== 0) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex,
					decrement: true,
					disabledIndices
				});
				if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex + (cols - prevIndex % cols),
						decrement: true,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			} else if (loopFocus) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex + (cols - prevIndex % cols),
					decrement: true,
					disabledIndices
				});
				if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
			}
			if (isDifferentGridRow(nextIndex, cols, prevRow)) nextIndex = prevIndex;
		}
		const lastRow = floor(maxIndex / cols) === prevRow;
		if (isIndexOutOfListBounds(list, nextIndex)) if (loopFocus && lastRow) {
			nextIndex = event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? maxIndex : findNonDisabledListIndex(list, {
				startingIndex: prevIndex - prevIndex % cols - 1,
				disabledIndices
			});
			if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
		} else nextIndex = prevIndex;
	}
	return nextIndex;
}
/** For each cell index, gets the item index that occupies that cell */
function createGridCellMap(sizes, cols, dense) {
	const cellMap = [];
	let startIndex = 0;
	sizes.forEach(({ width, height }, index) => {
		if (width > cols) throw new Error(`[Floating UI]: Invalid grid - item width at index ${index} is greater than grid columns`);
		let itemPlaced = false;
		if (dense) startIndex = 0;
		while (!itemPlaced) {
			const targetCells = [];
			for (let i = 0; i < width; i += 1) for (let j = 0; j < height; j += 1) targetCells.push(startIndex + i + j * cols);
			if (startIndex % cols + width <= cols && targetCells.every((cell) => cellMap[cell] == null)) {
				targetCells.forEach((cell) => {
					cellMap[cell] = index;
				});
				itemPlaced = true;
			} else startIndex += 1;
		}
	});
	return [...cellMap];
}
/** Gets cell index of an item's corner or -1 when index is -1. */
function getGridCellIndexOfCorner(index, sizes, cellMap, cols, corner) {
	if (index === -1) return -1;
	const firstCellIndex = cellMap.indexOf(index);
	const sizeItem = sizes[index];
	switch (corner) {
		case "tl": return firstCellIndex;
		case "tr":
			if (!sizeItem) return firstCellIndex;
			return firstCellIndex + sizeItem.width - 1;
		case "bl":
			if (!sizeItem) return firstCellIndex;
			return firstCellIndex + (sizeItem.height - 1) * cols;
		case "br": return cellMap.lastIndexOf(index);
		default: return -1;
	}
}
/** Gets all cell indices that correspond to the specified indices */
function getGridCellIndices(indices, cellMap) {
	return cellMap.flatMap((index, cellIndex) => indices.includes(index) ? [cellIndex] : []);
}
function isListIndexDisabled(list, index, disabledIndices) {
	if (typeof disabledIndices === "function" ? disabledIndices(index) : disabledIndices?.includes(index) ?? false) return true;
	const element = list[index];
	if (!element) return false;
	if (!isElementVisible(element)) return true;
	return !disabledIndices && (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true");
}
function isHiddenByStyles(styles) {
	return styles.visibility === "hidden" || styles.visibility === "collapse";
}
function isElementVisible(element, styles = element ? getComputedStyle$1(element) : null) {
	if (!element || !element.isConnected || !styles || isHiddenByStyles(styles)) return false;
	if (typeof element.checkVisibility === "function") return element.checkVisibility();
	return styles.display !== "none" && styles.display !== "contents";
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/resolveRef.js
/**
* If the provided argument is a ref object, returns its `current` value.
* Otherwise, returns the argument itself.
*/
function resolveRef(maybeRef) {
	if (maybeRef == null) return maybeRef;
	return "current" in maybeRef ? maybeRef.current : maybeRef;
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/useTransitionStatus.js
/**
* Provides a status string for CSS animations.
* @param open - a boolean that determines if the element is open.
* @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
*/
function useTransitionStatus(open, enableIdleState = false, deferEndingState = false) {
	const [transitionStatus, setTransitionStatus] = import_react.useState(open && enableIdleState ? "idle" : void 0);
	const [mounted, setMounted] = import_react.useState(open);
	if (open && !mounted) {
		setMounted(true);
		setTransitionStatus("starting");
	}
	if (!open && mounted && transitionStatus !== "ending" && !deferEndingState) setTransitionStatus("ending");
	if (!open && !mounted && transitionStatus === "ending") setTransitionStatus(void 0);
	useIsoLayoutEffect(() => {
		if (!open && mounted && transitionStatus !== "ending" && deferEndingState) {
			const frame = AnimationFrame.request(() => {
				setTransitionStatus("ending");
			});
			return () => {
				AnimationFrame.cancel(frame);
			};
		}
	}, [
		open,
		mounted,
		transitionStatus,
		deferEndingState
	]);
	useIsoLayoutEffect(() => {
		if (!open || enableIdleState) return;
		const frame = AnimationFrame.request(() => {
			setTransitionStatus(void 0);
		});
		return () => {
			AnimationFrame.cancel(frame);
		};
	}, [enableIdleState, open]);
	useIsoLayoutEffect(() => {
		if (!open || !enableIdleState) return;
		if (open && mounted && transitionStatus !== "idle") setTransitionStatus("starting");
		const frame = AnimationFrame.request(() => {
			setTransitionStatus("idle");
		});
		return () => {
			AnimationFrame.cancel(frame);
		};
	}, [
		enableIdleState,
		open,
		mounted,
		transitionStatus
	]);
	return {
		mounted,
		setMounted,
		transitionStatus
	};
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/useAnimationsFinished.js
/**
* Executes a function once all animations have finished on the provided element.
* @param elementOrRef - The element to watch for animations.
* @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
* @param treatAbortedAsFinished - Whether to treat aborted animations as finished. If `false`, and there are aborted animations,
*   the function will check again if any new animations have started and wait for them to finish.
* @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
*/
function useAnimationsFinished(elementOrRef, waitForStartingStyleRemoved = false, treatAbortedAsFinished = true) {
	const frame = useAnimationFrame();
	return useStableCallback((fnToExecute, signal = null) => {
		frame.cancel();
		const element = resolveRef(elementOrRef);
		if (element == null) return;
		const resolvedElement = element;
		const done = () => {
			import_react_dom.flushSync(fnToExecute);
		};
		if (typeof resolvedElement.getAnimations !== "function" || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
			fnToExecute();
			return;
		}
		function exec() {
			Promise.all(resolvedElement.getAnimations().map((animation) => animation.finished)).then(() => {
				if (!signal?.aborted) done();
			}).catch(() => {
				if (treatAbortedAsFinished) {
					if (!signal?.aborted) done();
					return;
				}
				const currentAnimations = resolvedElement.getAnimations();
				if (!signal?.aborted && currentAnimations.length > 0 && currentAnimations.some((animation) => animation.pending || animation.playState !== "finished")) exec();
			});
		}
		if (waitForStartingStyleRemoved) {
			const startingStyleAttribute = TransitionStatusDataAttributes.startingStyle;
			if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
				frame.request(exec);
				return;
			}
			const attributeObserver = new MutationObserver(() => {
				if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
					attributeObserver.disconnect();
					exec();
				}
			});
			attributeObserver.observe(resolvedElement, {
				attributes: true,
				attributeFilter: [startingStyleAttribute]
			});
			signal?.addEventListener("abort", () => attributeObserver.disconnect(), { once: true });
			return;
		}
		frame.request(exec);
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/useOpenChangeComplete.js
/**
* Calls the provided function when the CSS open/close animation or transition completes.
*/
function useOpenChangeComplete(parameters) {
	const { enabled = true, open, ref, onComplete: onCompleteParam } = parameters;
	const onComplete = useStableCallback(onCompleteParam);
	const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false);
	import_react.useEffect(() => {
		if (!enabled) return;
		const abortController = new AbortController();
		runOnceAnimationsFinish(onComplete, abortController.signal);
		return () => {
			abortController.abort();
		};
	}, [
		enabled,
		open,
		onComplete,
		runOnceAnimationsFinish
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/internals/composite/composite.js
var ARROW_UP = "ArrowUp";
var ARROW_DOWN = "ArrowDown";
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
var HOME = "Home";
var HORIZONTAL_KEYS = /* @__PURE__ */ new Set([ARROW_LEFT, ARROW_RIGHT]);
var HORIZONTAL_KEYS_WITH_EXTRA_KEYS = /* @__PURE__ */ new Set([
	ARROW_LEFT,
	ARROW_RIGHT,
	HOME,
	"End"
]);
var VERTICAL_KEYS = /* @__PURE__ */ new Set([ARROW_UP, ARROW_DOWN]);
var VERTICAL_KEYS_WITH_EXTRA_KEYS = /* @__PURE__ */ new Set([
	ARROW_UP,
	ARROW_DOWN,
	HOME,
	"End"
]);
var ARROW_KEYS = /* @__PURE__ */ new Set([...HORIZONTAL_KEYS, ...VERTICAL_KEYS]);
var COMPOSITE_KEYS = /* @__PURE__ */ new Set([
	...ARROW_KEYS,
	HOME,
	"End"
]);
var MODIFIER_KEYS = /* @__PURE__ */ new Set([
	"Shift",
	"Control",
	"Alt",
	"Meta"
]);
function isInputElement(element) {
	return isHTMLElement(element) && element.tagName === "INPUT";
}
function isNativeInput(element) {
	if (isInputElement(element) && element.selectionStart != null) return true;
	if (isHTMLElement(element) && element.tagName === "TEXTAREA") return true;
	return false;
}
function scrollIntoViewIfNeeded(scrollContainer, element, direction, orientation) {
	if (!scrollContainer || !element || !element.scrollTo) return;
	let targetX = scrollContainer.scrollLeft;
	let targetY = scrollContainer.scrollTop;
	const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
	const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;
	if (isOverflowingX && orientation !== "vertical") {
		const elementOffsetLeft = getOffset(scrollContainer, element, "left");
		const containerStyles = getStyles(scrollContainer);
		const elementStyles = getStyles(element);
		if (direction === "ltr") {
			if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
			else if (elementOffsetLeft - elementStyles.scrollMarginLeft < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
		}
		if (direction === "rtl") {
			if (elementOffsetLeft - elementStyles.scrollMarginRight < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
			else if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
		}
	}
	if (isOverflowingY && orientation !== "horizontal") {
		const elementOffsetTop = getOffset(scrollContainer, element, "top");
		const containerStyles = getStyles(scrollContainer);
		const elementStyles = getStyles(element);
		if (elementOffsetTop - elementStyles.scrollMarginTop < scrollContainer.scrollTop + containerStyles.scrollPaddingTop) targetY = elementOffsetTop - elementStyles.scrollMarginTop - containerStyles.scrollPaddingTop;
		else if (elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom > scrollContainer.scrollTop + scrollContainer.clientHeight - containerStyles.scrollPaddingBottom) targetY = elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom - scrollContainer.clientHeight + containerStyles.scrollPaddingBottom;
	}
	scrollContainer.scrollTo({
		left: targetX,
		top: targetY,
		behavior: "auto"
	});
}
function getOffset(ancestor, element, side) {
	const propName = side === "left" ? "offsetLeft" : "offsetTop";
	let result = 0;
	while (element.offsetParent) {
		result += element[propName];
		if (element.offsetParent === ancestor) break;
		element = element.offsetParent;
	}
	return result;
}
function getStyles(element) {
	const styles = getComputedStyle(element);
	return {
		scrollMarginTop: parseFloat(styles.scrollMarginTop) || 0,
		scrollMarginRight: parseFloat(styles.scrollMarginRight) || 0,
		scrollMarginBottom: parseFloat(styles.scrollMarginBottom) || 0,
		scrollMarginLeft: parseFloat(styles.scrollMarginLeft) || 0,
		scrollPaddingTop: parseFloat(styles.scrollPaddingTop) || 0,
		scrollPaddingRight: parseFloat(styles.scrollPaddingRight) || 0,
		scrollPaddingBottom: parseFloat(styles.scrollPaddingBottom) || 0,
		scrollPaddingLeft: parseFloat(styles.scrollPaddingLeft) || 0
	};
}
//#endregion
//#region node_modules/@base-ui/utils/esm/inertValue.js
function inertValue(value) {
	if (isReactVersionAtLeast(19)) return value;
	return value ? "true" : void 0;
}
//#endregion
export { ARROW_LEFT$1 as $, clamp as A, getOppositeAxisPlacements as B, getGridCellIndices as C, isElementVisible as D, getMinListIndex as E, getAlignmentAxis as F, max as G, getPaddingObject as H, getAlignmentSides as I, round as J, min as K, getAxisLength as L, evaluate as M, floor as N, isIndexOutOfListBounds as O, getAlignment as P, ARROW_DOWN$1 as Q, getExpandedPlacements as R, getGridCellIndexOfCorner as S, getMaxListIndex as T, getSide as U, getOppositePlacement as V, getSideAxis as W, AnimationFrame as X, sides as Y, useAnimationFrame as Z, useAnimationsFinished as _, transitionStatusMapping as _t, ARROW_RIGHT as a, isMouseLikePointerType as at, createGridCellMap as b, HOME as c, isVirtualPointerEvent as ct, MODIFIER_KEYS as d, isJSDOM as dt, ARROW_RIGHT$1 as et, VERTICAL_KEYS as f, isMac as ft, useOpenChangeComplete as g, TransitionStatusDataAttributes as gt, scrollIntoViewIfNeeded as h, useOnMount as ht, ARROW_LEFT as i, isClickLikeEvent as it, createCoords as j, isListIndexDisabled as k, HORIZONTAL_KEYS as l, stopEvent as lt, isNativeInput as m, isWebKit as mt, ARROW_DOWN as n, FOCUSABLE_ATTRIBUTE as nt, ARROW_UP as o, isReactEvent as ot, VERTICAL_KEYS_WITH_EXTRA_KEYS as p, isSafari as pt, rectToClientRect as q, ARROW_KEYS as r, TYPEABLE_SELECTOR as rt, COMPOSITE_KEYS as s, isVirtualClick as st, inertValue as t, ARROW_UP$1 as tt, HORIZONTAL_KEYS_WITH_EXTRA_KEYS as u, isIOS as ut, useTransitionStatus as v, getGridNavigatedIndex as w, findNonDisabledListIndex as x, resolveRef as y, getOppositeAxis as z };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRWYWx1ZS1VUE8wMEtzWC5qcyIsIm5hbWVzIjpbIkVNUFRZIiwiQVJST1dfTEVGVCIsIkFSUk9XX1JJR0hUIiwiQVJST1dfVVAiLCJBUlJPV19ET1dOIiwiZ2V0Q29tcHV0ZWRTdHlsZSJdLCJzb3VyY2VzIjpbIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvc3RhdGVBdHRyaWJ1dGVzTWFwcGluZy5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS91c2VPbk1vdW50LmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL2RldGVjdEJyb3dzZXIuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMvZXZlbnQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvdXRpbHMvY29uc3RhbnRzLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3VzZUFuaW1hdGlvbkZyYW1lLmpzIiwiLi4vLi4vQGZsb2F0aW5nLXVpL3V0aWxzL2Rpc3QvZmxvYXRpbmctdWkudXRpbHMubWpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L3V0aWxzL2NvbXBvc2l0ZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9yZXNvbHZlUmVmLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2ludGVybmFscy91c2VUcmFuc2l0aW9uU3RhdHVzLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2ludGVybmFscy91c2VBbmltYXRpb25zRmluaXNoZWQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vaW50ZXJuYWxzL3VzZU9wZW5DaGFuZ2VDb21wbGV0ZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS9pbnRlcm5hbHMvY29tcG9zaXRlL2NvbXBvc2l0ZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3V0aWxzL2VzbS9pbmVydFZhbHVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBsZXQgVHJhbnNpdGlvblN0YXR1c0RhdGFBdHRyaWJ1dGVzID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMpIHtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGFuaW1hdGluZyBpbi5cbiAgICovXG4gIFRyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlc1tcInN0YXJ0aW5nU3R5bGVcIl0gPSBcImRhdGEtc3RhcnRpbmctc3R5bGVcIjtcbiAgLyoqXG4gICAqIFByZXNlbnQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGFuaW1hdGluZyBvdXQuXG4gICAqL1xuICBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXNbXCJlbmRpbmdTdHlsZVwiXSA9IFwiZGF0YS1lbmRpbmctc3R5bGVcIjtcbiAgcmV0dXJuIFRyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlcztcbn0oe30pO1xuY29uc3QgU1RBUlRJTkdfSE9PSyA9IHtcbiAgW1RyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlcy5zdGFydGluZ1N0eWxlXTogJydcbn07XG5jb25zdCBFTkRJTkdfSE9PSyA9IHtcbiAgW1RyYW5zaXRpb25TdGF0dXNEYXRhQXR0cmlidXRlcy5lbmRpbmdTdHlsZV06ICcnXG59O1xuZXhwb3J0IGNvbnN0IHRyYW5zaXRpb25TdGF0dXNNYXBwaW5nID0ge1xuICB0cmFuc2l0aW9uU3RhdHVzKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSAnc3RhcnRpbmcnKSB7XG4gICAgICByZXR1cm4gU1RBUlRJTkdfSE9PSztcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSAnZW5kaW5nJykge1xuICAgICAgcmV0dXJuIEVORElOR19IT09LO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmNvbnN0IEVNUFRZID0gW107XG5cbi8qKlxuICogQSBSZWFjdC51c2VFZmZlY3QgZXF1aXZhbGVudCB0aGF0IHJ1bnMgb25jZSwgd2hlbiB0aGUgY29tcG9uZW50IGlzIG1vdW50ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VPbk1vdW50KGZuKSB7XG4gIC8vIFRPRE86IHVuY29tbWVudCBvbmNlIHdlIGVuYWJsZSBlc2xpbnQtcGx1Z2luLXJlYWN0LWNvbXBpbGVyIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1jb21waWxlci9yZWFjdC1jb21waWxlciAtLSBubyBuZWVkIHRvIHB1dCBgZm5gIGluIHRoZSBkZXBlbmRlbmN5IGFycmF5XG4gIC8qIGVzbGludC1kaXNhYmxlIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwcyAqL1xuICBSZWFjdC51c2VFZmZlY3QoZm4sIEVNUFRZKTtcbiAgLyogZXNsaW50LWVuYWJsZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHMgKi9cbn0iLCJjb25zdCBoYXNOYXZpZ2F0b3IgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJztcbmNvbnN0IG5hdiA9IGdldE5hdmlnYXRvckRhdGEoKTtcbmNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcbmNvbnN0IHVzZXJBZ2VudCA9IGdldFVzZXJBZ2VudCgpO1xuZXhwb3J0IGNvbnN0IGlzV2ViS2l0ID0gdHlwZW9mIENTUyA9PT0gJ3VuZGVmaW5lZCcgfHwgIUNTUy5zdXBwb3J0cyA/IGZhbHNlIDogQ1NTLnN1cHBvcnRzKCctd2Via2l0LWJhY2tkcm9wLWZpbHRlcjpub25lJyk7XG5leHBvcnQgY29uc3QgaXNJT1MgPVxuLy8gaVBhZHMgY2FuIGNsYWltIHRvIGJlIE1hY0ludGVsXG5uYXYucGxhdGZvcm0gPT09ICdNYWNJbnRlbCcgJiYgbmF2Lm1heFRvdWNoUG9pbnRzID4gMSA/IHRydWUgOiAvaVAoaG9uZXxhZHxvZCl8aU9TLy50ZXN0KG5hdi5wbGF0Zm9ybSk7XG5leHBvcnQgY29uc3QgaXNGaXJlZm94ID0gaGFzTmF2aWdhdG9yICYmIC9maXJlZm94L2kudGVzdCh1c2VyQWdlbnQpO1xuZXhwb3J0IGNvbnN0IGlzU2FmYXJpID0gaGFzTmF2aWdhdG9yICYmIC9hcHBsZS9pLnRlc3QobmF2aWdhdG9yLnZlbmRvcik7XG5leHBvcnQgY29uc3QgaXNFZGdlID0gaGFzTmF2aWdhdG9yICYmIC9FZGcvaS50ZXN0KHVzZXJBZ2VudCk7XG5leHBvcnQgY29uc3QgaXNBbmRyb2lkID0gaGFzTmF2aWdhdG9yICYmIC9hbmRyb2lkL2kudGVzdChwbGF0Zm9ybSkgfHwgL2FuZHJvaWQvaS50ZXN0KHVzZXJBZ2VudCk7XG5leHBvcnQgY29uc3QgaXNNYWMgPSBoYXNOYXZpZ2F0b3IgJiYgcGxhdGZvcm0udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdtYWMnKSAmJiAhbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzO1xuZXhwb3J0IGNvbnN0IGlzSlNET00gPSB1c2VyQWdlbnQuaW5jbHVkZXMoJ2pzZG9tLycpO1xuXG4vLyBBdm9pZCBDaHJvbWUgRGV2VG9vbHMgYmx1ZSB3YXJuaW5nLlxuZnVuY3Rpb24gZ2V0TmF2aWdhdG9yRGF0YSgpIHtcbiAgaWYgKCFoYXNOYXZpZ2F0b3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhdGZvcm06ICcnLFxuICAgICAgbWF4VG91Y2hQb2ludHM6IC0xXG4gICAgfTtcbiAgfVxuICBjb25zdCB1YURhdGEgPSBuYXZpZ2F0b3IudXNlckFnZW50RGF0YTtcbiAgaWYgKHVhRGF0YT8ucGxhdGZvcm0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhdGZvcm06IHVhRGF0YS5wbGF0Zm9ybSxcbiAgICAgIG1heFRvdWNoUG9pbnRzOiBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHNcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgcGxhdGZvcm06IG5hdmlnYXRvci5wbGF0Zm9ybSA/PyAnJyxcbiAgICBtYXhUb3VjaFBvaW50czogbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID8/IC0xXG4gIH07XG59XG5mdW5jdGlvbiBnZXRVc2VyQWdlbnQoKSB7XG4gIGlmICghaGFzTmF2aWdhdG9yKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IHVhRGF0YSA9IG5hdmlnYXRvci51c2VyQWdlbnREYXRhO1xuICBpZiAodWFEYXRhICYmIEFycmF5LmlzQXJyYXkodWFEYXRhLmJyYW5kcykpIHtcbiAgICByZXR1cm4gdWFEYXRhLmJyYW5kcy5tYXAoKHtcbiAgICAgIGJyYW5kLFxuICAgICAgdmVyc2lvblxuICAgIH0pID0+IGAke2JyYW5kfS8ke3ZlcnNpb259YCkuam9pbignICcpO1xuICB9XG4gIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50O1xufVxuZnVuY3Rpb24gZ2V0UGxhdGZvcm0oKSB7XG4gIGlmICghaGFzTmF2aWdhdG9yKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IHVhRGF0YSA9IG5hdmlnYXRvci51c2VyQWdlbnREYXRhO1xuICBpZiAodWFEYXRhPy5wbGF0Zm9ybSkge1xuICAgIHJldHVybiB1YURhdGEucGxhdGZvcm07XG4gIH1cbiAgcmV0dXJuIG5hdmlnYXRvci5wbGF0Zm9ybSA/PyAnJztcbn0iLCJpbXBvcnQgeyBpc0FuZHJvaWQsIGlzSlNET00gfSBmcm9tICdAYmFzZS11aS91dGlscy9kZXRlY3RCcm93c2VyJztcbmV4cG9ydCBmdW5jdGlvbiBzdG9wRXZlbnQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNSZWFjdEV2ZW50KGV2ZW50KSB7XG4gIHJldHVybiAnbmF0aXZlRXZlbnQnIGluIGV2ZW50O1xufVxuXG4vLyBMaWNlbnNlOiBodHRwczovL2dpdGh1Yi5jb20vYWRvYmUvcmVhY3Qtc3BlY3RydW0vYmxvYi9tYWluL3BhY2thZ2VzL0ByZWFjdC1hcmlhL3V0aWxzL3NyYy9pc1ZpcnR1YWxFdmVudC50c1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmlydHVhbENsaWNrKGV2ZW50KSB7XG4gIGlmIChldmVudC5wb2ludGVyVHlwZSA9PT0gJycgJiYgZXZlbnQuaXNUcnVzdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGlzQW5kcm9pZCAmJiBldmVudC5wb2ludGVyVHlwZSkge1xuICAgIHJldHVybiBldmVudC50eXBlID09PSAnY2xpY2snICYmIGV2ZW50LmJ1dHRvbnMgPT09IDE7XG4gIH1cbiAgcmV0dXJuIGV2ZW50LmRldGFpbCA9PT0gMCAmJiAhZXZlbnQucG9pbnRlclR5cGU7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNWaXJ0dWFsUG9pbnRlckV2ZW50KGV2ZW50KSB7XG4gIGlmIChpc0pTRE9NKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAhaXNBbmRyb2lkICYmIGV2ZW50LndpZHRoID09PSAwICYmIGV2ZW50LmhlaWdodCA9PT0gMCB8fCBpc0FuZHJvaWQgJiYgZXZlbnQud2lkdGggPT09IDEgJiYgZXZlbnQuaGVpZ2h0ID09PSAxICYmIGV2ZW50LnByZXNzdXJlID09PSAwICYmIGV2ZW50LmRldGFpbCA9PT0gMCAmJiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyB8fFxuICAvLyBpT1MgVm9pY2VPdmVyIHJldHVybnMgMC4zMzPigKIgZm9yIHdpZHRoL2hlaWdodC5cbiAgZXZlbnQud2lkdGggPCAxICYmIGV2ZW50LmhlaWdodCA8IDEgJiYgZXZlbnQucHJlc3N1cmUgPT09IDAgJiYgZXZlbnQuZGV0YWlsID09PSAwICYmIGV2ZW50LnBvaW50ZXJUeXBlID09PSAndG91Y2gnO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzTW91c2VMaWtlUG9pbnRlclR5cGUocG9pbnRlclR5cGUsIHN0cmljdCkge1xuICAvLyBPbiBzb21lIExpbnV4IG1hY2hpbmVzIHdpdGggQ2hyb21pdW0sIG1vdXNlIGlucHV0cyByZXR1cm4gYSBgcG9pbnRlclR5cGVgXG4gIC8vIG9mIFwicGVuXCI6IGh0dHBzOi8vZ2l0aHViLmNvbS9mbG9hdGluZy11aS9mbG9hdGluZy11aS9pc3N1ZXMvMjAxNVxuICBjb25zdCB2YWx1ZXMgPSBbJ21vdXNlJywgJ3BlbiddO1xuICBpZiAoIXN0cmljdCkge1xuICAgIHZhbHVlcy5wdXNoKCcnLCB1bmRlZmluZWQpO1xuICB9XG4gIHJldHVybiB2YWx1ZXMuaW5jbHVkZXMocG9pbnRlclR5cGUpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xpY2tMaWtlRXZlbnQoZXZlbnQpIHtcbiAgY29uc3QgdHlwZSA9IGV2ZW50LnR5cGU7XG4gIHJldHVybiB0eXBlID09PSAnY2xpY2snIHx8IHR5cGUgPT09ICdtb3VzZWRvd24nIHx8IHR5cGUgPT09ICdrZXlkb3duJyB8fCB0eXBlID09PSAna2V5dXAnO1xufSIsImV4cG9ydCBjb25zdCBGT0NVU0FCTEVfQVRUUklCVVRFID0gJ2RhdGEtYmFzZS11aS1mb2N1c2FibGUnO1xuZXhwb3J0IGNvbnN0IEFDVElWRV9LRVkgPSAnYWN0aXZlJztcbmV4cG9ydCBjb25zdCBTRUxFQ1RFRF9LRVkgPSAnc2VsZWN0ZWQnO1xuZXhwb3J0IGNvbnN0IFRZUEVBQkxFX1NFTEVDVE9SID0gXCJpbnB1dDpub3QoW3R5cGU9J2hpZGRlbiddKTpub3QoW2Rpc2FibGVkXSksXCIgKyBcIltjb250ZW50ZWRpdGFibGVdOm5vdChbY29udGVudGVkaXRhYmxlPSdmYWxzZSddKSx0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSlcIjtcbmV4cG9ydCBjb25zdCBBUlJPV19MRUZUID0gJ0Fycm93TGVmdCc7XG5leHBvcnQgY29uc3QgQVJST1dfUklHSFQgPSAnQXJyb3dSaWdodCc7XG5leHBvcnQgY29uc3QgQVJST1dfVVAgPSAnQXJyb3dVcCc7XG5leHBvcnQgY29uc3QgQVJST1dfRE9XTiA9ICdBcnJvd0Rvd24nOyIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlUmVmV2l0aEluaXQgfSBmcm9tIFwiLi91c2VSZWZXaXRoSW5pdC5qc1wiO1xuaW1wb3J0IHsgdXNlT25Nb3VudCB9IGZyb20gXCIuL3VzZU9uTW91bnQuanNcIjtcbi8qKiBVbmxpa2UgYHNldFRpbWVvdXRgLCByQUYgZG9lc24ndCBndWFyYW50ZWUgYSBwb3NpdGl2ZSBpbnRlZ2VyIHJldHVybiB2YWx1ZSwgc28gd2UgY2FuJ3QgaGF2ZVxuICogYSBtb25vbW9ycGhpYyBgdWludGAgdHlwZSB3aXRoIGAwYCBtZWFuaW5nIGVtcHR5LlxuICogU2VlIHdhcm5pbmcgbm90ZSBhdDpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cvcmVxdWVzdEFuaW1hdGlvbkZyYW1lI3JldHVybl92YWx1ZSAqL1xuY29uc3QgRU1QVFkgPSBudWxsO1xubGV0IExBU1RfUkFGID0gZ2xvYmFsVGhpcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5jbGFzcyBTY2hlZHVsZXIge1xuICAvKiBUaGlzIGltcGxlbWVudGF0aW9uIHVzZXMgYW4gYXJyYXkgYXMgYSBiYWNraW5nIGRhdGEtc3RydWN0dXJlIGZvciBmcmFtZSBjYWxsYmFja3MuXG4gICAqIEl0IGFsbG93cyBgTygxKWAgY2FsbGJhY2sgY2FuY2VsbGluZyBieSBpbnNlcnRpbmcgYSBgbnVsbGAgaW4gdGhlIGFycmF5LCB0aG91Z2ggaXRcbiAgICogbmV2ZXIgY2FsbHMgdGhlIG5hdGl2ZSBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgIGlmIHRoZXJlIGFyZSBubyBmcmFtZXMgbGVmdC4gVGhpcyBjYW5cbiAgICogYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpZiB0aGVyZSBpcyBhIGNhbGwgcGF0dGVybiB0aGF0IGFsdGVybnMgYXNcbiAgICogXCJyZXF1ZXN0LWNhbmNlbC1yZXF1ZXN0LWNhbmNlbC3igKZcIi5cbiAgICogQnV0IGluIHRoZSBjYXNlIG9mIFwicmVxdWVzdC1yZXF1ZXN0LeKApi1jYW5jZWwtY2FuY2VsLeKAplwiLCBpdCBsZWF2ZXMgdGhlIGZpbmFsIGFuaW1hdGlvblxuICAgKiBmcmFtZSB0byBydW4gYW55d2F5LiBXZSB0dXJuIHRoYXQgZnJhbWUgaW50byBhIGBPKDEpYCBuby1vcCB2aWEgYGNhbGxiYWNrc0NvdW50YC4gKi9cblxuICBjYWxsYmFja3MgPSBbXTtcbiAgY2FsbGJhY2tzQ291bnQgPSAwO1xuICBuZXh0SWQgPSAxO1xuICBzdGFydElkID0gMTtcbiAgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgdGljayA9IHRpbWVzdGFtcCA9PiB7XG4gICAgdGhpcy5pc1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGN1cnJlbnRDYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrcztcbiAgICBjb25zdCBjdXJyZW50Q2FsbGJhY2tzQ291bnQgPSB0aGlzLmNhbGxiYWNrc0NvdW50O1xuXG4gICAgLy8gVXBkYXRlIHRoZXNlIGJlZm9yZSBpdGVyYXRpbmcsIGNhbGxiYWNrcyBjb3VsZCBjYWxsIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGFnYWluLlxuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5jYWxsYmFja3NDb3VudCA9IDA7XG4gICAgdGhpcy5zdGFydElkID0gdGhpcy5uZXh0SWQ7XG4gICAgaWYgKGN1cnJlbnRDYWxsYmFja3NDb3VudCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudENhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjdXJyZW50Q2FsbGJhY2tzW2ldPy4odGltZXN0YW1wKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHJlcXVlc3QoZm4pIHtcbiAgICBjb25zdCBpZCA9IHRoaXMubmV4dElkO1xuICAgIHRoaXMubmV4dElkICs9IDE7XG4gICAgdGhpcy5jYWxsYmFja3MucHVzaChmbik7XG4gICAgdGhpcy5jYWxsYmFja3NDb3VudCArPSAxO1xuXG4gICAgLyogSW4gYSB0ZXN0IGVudmlyb25tZW50IHdpdGggZmFrZSB0aW1lcnMsIGEgZmFrZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBjYW4gYmUgY2FsbGVkXG4gICAgICogYnV0IHRoZXJlJ3Mgbm8gZ3VhcmFudGVlIHRoYXQgdGhlIGFuaW1hdGlvbiBmcmFtZSB3aWxsIGFjdHVhbGx5IHJ1biBiZWZvcmUgdGhlIGZha2VcbiAgICAgKiB0aW1lcnMgYXJlIHRlYXJlZCwgd2hpY2ggbGVhdmVzIGBpc1NjaGVkdWxlZGAgc2V0LCBidXQgd29uJ3QgcnVuIG91ciBgdGljaygpYC4gKi9cbiAgICBjb25zdCBkaWRSQUZDaGFuZ2UgPSBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIExBU1RfUkFGICE9PSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgJiYgKExBU1RfUkFGID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCB0cnVlKTtcbiAgICBpZiAoIXRoaXMuaXNTY2hlZHVsZWQgfHwgZGlkUkFGQ2hhbmdlKSB7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy50aWNrKTtcbiAgICAgIHRoaXMuaXNTY2hlZHVsZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgY2FuY2VsKGlkKSB7XG4gICAgY29uc3QgaW5kZXggPSBpZCAtIHRoaXMuc3RhcnRJZDtcbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNhbGxiYWNrc1tpbmRleF0gPSBudWxsO1xuICAgIHRoaXMuY2FsbGJhY2tzQ291bnQgLT0gMTtcbiAgfVxufVxuY29uc3Qgc2NoZWR1bGVyID0gbmV3IFNjaGVkdWxlcigpO1xuZXhwb3J0IGNsYXNzIEFuaW1hdGlvbkZyYW1lIHtcbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IEFuaW1hdGlvbkZyYW1lKCk7XG4gIH1cbiAgc3RhdGljIHJlcXVlc3QoZm4pIHtcbiAgICByZXR1cm4gc2NoZWR1bGVyLnJlcXVlc3QoZm4pO1xuICB9XG4gIHN0YXRpYyBjYW5jZWwoaWQpIHtcbiAgICByZXR1cm4gc2NoZWR1bGVyLmNhbmNlbChpZCk7XG4gIH1cbiAgY3VycmVudElkID0gRU1QVFk7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGBmbmAgYWZ0ZXIgYGRlbGF5YCwgY2xlYXJpbmcgYW55IHByZXZpb3VzbHkgc2NoZWR1bGVkIGNhbGwuXG4gICAqL1xuICByZXF1ZXN0KGZuKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICB0aGlzLmN1cnJlbnRJZCA9IHNjaGVkdWxlci5yZXF1ZXN0KCgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudElkID0gRU1QVFk7XG4gICAgICBmbigpO1xuICAgIH0pO1xuICB9XG4gIGNhbmNlbCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5jdXJyZW50SWQgIT09IEVNUFRZKSB7XG4gICAgICBzY2hlZHVsZXIuY2FuY2VsKHRoaXMuY3VycmVudElkKTtcbiAgICAgIHRoaXMuY3VycmVudElkID0gRU1QVFk7XG4gICAgfVxuICB9O1xuICBkaXNwb3NlRWZmZWN0ID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLmNhbmNlbDtcbiAgfTtcbn1cblxuLyoqXG4gKiBBIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHdpdGggYXV0b21hdGljIGNsZWFudXAgYW5kIGd1YXJkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQW5pbWF0aW9uRnJhbWUoKSB7XG4gIGNvbnN0IHRpbWVvdXQgPSB1c2VSZWZXaXRoSW5pdChBbmltYXRpb25GcmFtZS5jcmVhdGUpLmN1cnJlbnQ7XG4gIHVzZU9uTW91bnQodGltZW91dC5kaXNwb3NlRWZmZWN0KTtcbiAgcmV0dXJuIHRpbWVvdXQ7XG59IiwiLyoqXG4gKiBDdXN0b20gcG9zaXRpb25pbmcgcmVmZXJlbmNlIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvdmlydHVhbC1lbGVtZW50c1xuICovXG5cbmNvbnN0IHNpZGVzID0gWyd0b3AnLCAncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXTtcbmNvbnN0IGFsaWdubWVudHMgPSBbJ3N0YXJ0JywgJ2VuZCddO1xuY29uc3QgcGxhY2VtZW50cyA9IC8qI19fUFVSRV9fKi9zaWRlcy5yZWR1Y2UoKGFjYywgc2lkZSkgPT4gYWNjLmNvbmNhdChzaWRlLCBzaWRlICsgXCItXCIgKyBhbGlnbm1lbnRzWzBdLCBzaWRlICsgXCItXCIgKyBhbGlnbm1lbnRzWzFdKSwgW10pO1xuY29uc3QgbWluID0gTWF0aC5taW47XG5jb25zdCBtYXggPSBNYXRoLm1heDtcbmNvbnN0IHJvdW5kID0gTWF0aC5yb3VuZDtcbmNvbnN0IGZsb29yID0gTWF0aC5mbG9vcjtcbmNvbnN0IGNyZWF0ZUNvb3JkcyA9IHYgPT4gKHtcbiAgeDogdixcbiAgeTogdlxufSk7XG5jb25zdCBvcHBvc2l0ZVNpZGVNYXAgPSB7XG4gIGxlZnQ6ICdyaWdodCcsXG4gIHJpZ2h0OiAnbGVmdCcsXG4gIGJvdHRvbTogJ3RvcCcsXG4gIHRvcDogJ2JvdHRvbSdcbn07XG5mdW5jdGlvbiBjbGFtcChzdGFydCwgdmFsdWUsIGVuZCkge1xuICByZXR1cm4gbWF4KHN0YXJ0LCBtaW4odmFsdWUsIGVuZCkpO1xufVxuZnVuY3Rpb24gZXZhbHVhdGUodmFsdWUsIHBhcmFtKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgPyB2YWx1ZShwYXJhbSkgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGdldFNpZGUocGxhY2VtZW50KSB7XG4gIHJldHVybiBwbGFjZW1lbnQuc3BsaXQoJy0nKVswXTtcbn1cbmZ1bmN0aW9uIGdldEFsaWdubWVudChwbGFjZW1lbnQpIHtcbiAgcmV0dXJuIHBsYWNlbWVudC5zcGxpdCgnLScpWzFdO1xufVxuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVBeGlzKGF4aXMpIHtcbiAgcmV0dXJuIGF4aXMgPT09ICd4JyA/ICd5JyA6ICd4Jztcbn1cbmZ1bmN0aW9uIGdldEF4aXNMZW5ndGgoYXhpcykge1xuICByZXR1cm4gYXhpcyA9PT0gJ3knID8gJ2hlaWdodCcgOiAnd2lkdGgnO1xufVxuZnVuY3Rpb24gZ2V0U2lkZUF4aXMocGxhY2VtZW50KSB7XG4gIGNvbnN0IGZpcnN0Q2hhciA9IHBsYWNlbWVudFswXTtcbiAgcmV0dXJuIGZpcnN0Q2hhciA9PT0gJ3QnIHx8IGZpcnN0Q2hhciA9PT0gJ2InID8gJ3knIDogJ3gnO1xufVxuZnVuY3Rpb24gZ2V0QWxpZ25tZW50QXhpcyhwbGFjZW1lbnQpIHtcbiAgcmV0dXJuIGdldE9wcG9zaXRlQXhpcyhnZXRTaWRlQXhpcyhwbGFjZW1lbnQpKTtcbn1cbmZ1bmN0aW9uIGdldEFsaWdubWVudFNpZGVzKHBsYWNlbWVudCwgcmVjdHMsIHJ0bCkge1xuICBpZiAocnRsID09PSB2b2lkIDApIHtcbiAgICBydGwgPSBmYWxzZTtcbiAgfVxuICBjb25zdCBhbGlnbm1lbnQgPSBnZXRBbGlnbm1lbnQocGxhY2VtZW50KTtcbiAgY29uc3QgYWxpZ25tZW50QXhpcyA9IGdldEFsaWdubWVudEF4aXMocGxhY2VtZW50KTtcbiAgY29uc3QgbGVuZ3RoID0gZ2V0QXhpc0xlbmd0aChhbGlnbm1lbnRBeGlzKTtcbiAgbGV0IG1haW5BbGlnbm1lbnRTaWRlID0gYWxpZ25tZW50QXhpcyA9PT0gJ3gnID8gYWxpZ25tZW50ID09PSAocnRsID8gJ2VuZCcgOiAnc3RhcnQnKSA/ICdyaWdodCcgOiAnbGVmdCcgOiBhbGlnbm1lbnQgPT09ICdzdGFydCcgPyAnYm90dG9tJyA6ICd0b3AnO1xuICBpZiAocmVjdHMucmVmZXJlbmNlW2xlbmd0aF0gPiByZWN0cy5mbG9hdGluZ1tsZW5ndGhdKSB7XG4gICAgbWFpbkFsaWdubWVudFNpZGUgPSBnZXRPcHBvc2l0ZVBsYWNlbWVudChtYWluQWxpZ25tZW50U2lkZSk7XG4gIH1cbiAgcmV0dXJuIFttYWluQWxpZ25tZW50U2lkZSwgZ2V0T3Bwb3NpdGVQbGFjZW1lbnQobWFpbkFsaWdubWVudFNpZGUpXTtcbn1cbmZ1bmN0aW9uIGdldEV4cGFuZGVkUGxhY2VtZW50cyhwbGFjZW1lbnQpIHtcbiAgY29uc3Qgb3Bwb3NpdGVQbGFjZW1lbnQgPSBnZXRPcHBvc2l0ZVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICByZXR1cm4gW2dldE9wcG9zaXRlQWxpZ25tZW50UGxhY2VtZW50KHBsYWNlbWVudCksIG9wcG9zaXRlUGxhY2VtZW50LCBnZXRPcHBvc2l0ZUFsaWdubWVudFBsYWNlbWVudChvcHBvc2l0ZVBsYWNlbWVudCldO1xufVxuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVBbGlnbm1lbnRQbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gIHJldHVybiBwbGFjZW1lbnQuaW5jbHVkZXMoJ3N0YXJ0JykgPyBwbGFjZW1lbnQucmVwbGFjZSgnc3RhcnQnLCAnZW5kJykgOiBwbGFjZW1lbnQucmVwbGFjZSgnZW5kJywgJ3N0YXJ0Jyk7XG59XG5jb25zdCBsclBsYWNlbWVudCA9IFsnbGVmdCcsICdyaWdodCddO1xuY29uc3QgcmxQbGFjZW1lbnQgPSBbJ3JpZ2h0JywgJ2xlZnQnXTtcbmNvbnN0IHRiUGxhY2VtZW50ID0gWyd0b3AnLCAnYm90dG9tJ107XG5jb25zdCBidFBsYWNlbWVudCA9IFsnYm90dG9tJywgJ3RvcCddO1xuZnVuY3Rpb24gZ2V0U2lkZUxpc3Qoc2lkZSwgaXNTdGFydCwgcnRsKSB7XG4gIHN3aXRjaCAoc2lkZSkge1xuICAgIGNhc2UgJ3RvcCc6XG4gICAgY2FzZSAnYm90dG9tJzpcbiAgICAgIGlmIChydGwpIHJldHVybiBpc1N0YXJ0ID8gcmxQbGFjZW1lbnQgOiBsclBsYWNlbWVudDtcbiAgICAgIHJldHVybiBpc1N0YXJ0ID8gbHJQbGFjZW1lbnQgOiBybFBsYWNlbWVudDtcbiAgICBjYXNlICdsZWZ0JzpcbiAgICBjYXNlICdyaWdodCc6XG4gICAgICByZXR1cm4gaXNTdGFydCA/IHRiUGxhY2VtZW50IDogYnRQbGFjZW1lbnQ7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBbXTtcbiAgfVxufVxuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVBeGlzUGxhY2VtZW50cyhwbGFjZW1lbnQsIGZsaXBBbGlnbm1lbnQsIGRpcmVjdGlvbiwgcnRsKSB7XG4gIGNvbnN0IGFsaWdubWVudCA9IGdldEFsaWdubWVudChwbGFjZW1lbnQpO1xuICBsZXQgbGlzdCA9IGdldFNpZGVMaXN0KGdldFNpZGUocGxhY2VtZW50KSwgZGlyZWN0aW9uID09PSAnc3RhcnQnLCBydGwpO1xuICBpZiAoYWxpZ25tZW50KSB7XG4gICAgbGlzdCA9IGxpc3QubWFwKHNpZGUgPT4gc2lkZSArIFwiLVwiICsgYWxpZ25tZW50KTtcbiAgICBpZiAoZmxpcEFsaWdubWVudCkge1xuICAgICAgbGlzdCA9IGxpc3QuY29uY2F0KGxpc3QubWFwKGdldE9wcG9zaXRlQWxpZ25tZW50UGxhY2VtZW50KSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBsaXN0O1xufVxuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVQbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gIHJldHVybiBvcHBvc2l0ZVNpZGVNYXBbc2lkZV0gKyBwbGFjZW1lbnQuc2xpY2Uoc2lkZS5sZW5ndGgpO1xufVxuZnVuY3Rpb24gZXhwYW5kUGFkZGluZ09iamVjdChwYWRkaW5nKSB7XG4gIHJldHVybiB7XG4gICAgdG9wOiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIGJvdHRvbTogMCxcbiAgICBsZWZ0OiAwLFxuICAgIC4uLnBhZGRpbmdcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldFBhZGRpbmdPYmplY3QocGFkZGluZykge1xuICByZXR1cm4gdHlwZW9mIHBhZGRpbmcgIT09ICdudW1iZXInID8gZXhwYW5kUGFkZGluZ09iamVjdChwYWRkaW5nKSA6IHtcbiAgICB0b3A6IHBhZGRpbmcsXG4gICAgcmlnaHQ6IHBhZGRpbmcsXG4gICAgYm90dG9tOiBwYWRkaW5nLFxuICAgIGxlZnQ6IHBhZGRpbmdcbiAgfTtcbn1cbmZ1bmN0aW9uIHJlY3RUb0NsaWVudFJlY3QocmVjdCkge1xuICBjb25zdCB7XG4gICAgeCxcbiAgICB5LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodFxuICB9ID0gcmVjdDtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgdG9wOiB5LFxuICAgIGxlZnQ6IHgsXG4gICAgcmlnaHQ6IHggKyB3aWR0aCxcbiAgICBib3R0b206IHkgKyBoZWlnaHQsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5cbmV4cG9ydCB7IGFsaWdubWVudHMsIGNsYW1wLCBjcmVhdGVDb29yZHMsIGV2YWx1YXRlLCBleHBhbmRQYWRkaW5nT2JqZWN0LCBmbG9vciwgZ2V0QWxpZ25tZW50LCBnZXRBbGlnbm1lbnRBeGlzLCBnZXRBbGlnbm1lbnRTaWRlcywgZ2V0QXhpc0xlbmd0aCwgZ2V0RXhwYW5kZWRQbGFjZW1lbnRzLCBnZXRPcHBvc2l0ZUFsaWdubWVudFBsYWNlbWVudCwgZ2V0T3Bwb3NpdGVBeGlzLCBnZXRPcHBvc2l0ZUF4aXNQbGFjZW1lbnRzLCBnZXRPcHBvc2l0ZVBsYWNlbWVudCwgZ2V0UGFkZGluZ09iamVjdCwgZ2V0U2lkZSwgZ2V0U2lkZUF4aXMsIG1heCwgbWluLCBwbGFjZW1lbnRzLCByZWN0VG9DbGllbnRSZWN0LCByb3VuZCwgc2lkZXMgfTtcbiIsImltcG9ydCB7IGZsb29yIH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzJztcbmltcG9ydCB7IGdldENvbXB1dGVkU3R5bGUgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcbmltcG9ydCB7IHN0b3BFdmVudCB9IGZyb20gXCIuL2V2ZW50LmpzXCI7XG5pbXBvcnQgeyBBUlJPV19ET1dOLCBBUlJPV19MRUZULCBBUlJPV19SSUdIVCwgQVJST1dfVVAgfSBmcm9tIFwiLi9jb25zdGFudHMuanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBpc0RpZmZlcmVudEdyaWRSb3coaW5kZXgsIGNvbHMsIHByZXZSb3cpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoaW5kZXggLyBjb2xzKSAhPT0gcHJldlJvdztcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4T3V0T2ZMaXN0Qm91bmRzKGxpc3QsIGluZGV4KSB7XG4gIHJldHVybiBpbmRleCA8IDAgfHwgaW5kZXggPj0gbGlzdC5sZW5ndGg7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TWluTGlzdEluZGV4KGxpc3RSZWYsIGRpc2FibGVkSW5kaWNlcykge1xuICByZXR1cm4gZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGxpc3RSZWYuY3VycmVudCwge1xuICAgIGRpc2FibGVkSW5kaWNlc1xuICB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXhMaXN0SW5kZXgobGlzdFJlZiwgZGlzYWJsZWRJbmRpY2VzKSB7XG4gIHJldHVybiBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdFJlZi5jdXJyZW50LCB7XG4gICAgZGVjcmVtZW50OiB0cnVlLFxuICAgIHN0YXJ0aW5nSW5kZXg6IGxpc3RSZWYuY3VycmVudC5sZW5ndGgsXG4gICAgZGlzYWJsZWRJbmRpY2VzXG4gIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb25EaXNhYmxlZExpc3RJbmRleChsaXN0LCB7XG4gIHN0YXJ0aW5nSW5kZXggPSAtMSxcbiAgZGVjcmVtZW50ID0gZmFsc2UsXG4gIGRpc2FibGVkSW5kaWNlcyxcbiAgYW1vdW50ID0gMVxufSA9IHt9KSB7XG4gIGxldCBpbmRleCA9IHN0YXJ0aW5nSW5kZXg7XG4gIGRvIHtcbiAgICBpbmRleCArPSBkZWNyZW1lbnQgPyAtYW1vdW50IDogYW1vdW50O1xuICB9IHdoaWxlIChpbmRleCA+PSAwICYmIGluZGV4IDw9IGxpc3QubGVuZ3RoIC0gMSAmJiBpc0xpc3RJbmRleERpc2FibGVkKGxpc3QsIGluZGV4LCBkaXNhYmxlZEluZGljZXMpKTtcbiAgcmV0dXJuIGluZGV4O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEdyaWROYXZpZ2F0ZWRJbmRleChsaXN0LCB7XG4gIGV2ZW50LFxuICBvcmllbnRhdGlvbixcbiAgbG9vcEZvY3VzLFxuICBvbkxvb3AsXG4gIHJ0bCxcbiAgY29scyxcbiAgZGlzYWJsZWRJbmRpY2VzLFxuICBtaW5JbmRleCxcbiAgbWF4SW5kZXgsXG4gIHByZXZJbmRleCxcbiAgc3RvcEV2ZW50OiBzdG9wID0gZmFsc2Vcbn0pIHtcbiAgbGV0IG5leHRJbmRleCA9IHByZXZJbmRleDtcbiAgbGV0IHZlcnRpY2FsRGlyZWN0aW9uO1xuICBpZiAoZXZlbnQua2V5ID09PSBBUlJPV19VUCkge1xuICAgIHZlcnRpY2FsRGlyZWN0aW9uID0gJ3VwJztcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IEFSUk9XX0RPV04pIHtcbiAgICB2ZXJ0aWNhbERpcmVjdGlvbiA9ICdkb3duJztcbiAgfVxuICBpZiAodmVydGljYWxEaXJlY3Rpb24pIHtcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRGV0ZWN0IHJvdyBzdHJ1Y3R1cmUgb25seSB3aGVuIGhhbmRsaW5nIHZlcnRpY2FsIG5hdmlnYXRpb24uIFRoaXMga2VlcHNcbiAgICAvLyB0aGUgbm9uLXZlcnRpY2FsIGtleSBwYXRocyBmcmVlIGZyb20gcm93IGluZmVyZW5jZSB3b3JrLlxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdCByb3dzID0gW107XG4gICAgY29uc3Qgcm93SW5kZXhNYXAgPSBbXTtcbiAgICBsZXQgaGFzUm9sZVJvdyA9IGZhbHNlO1xuICAgIGxldCB2aXNpYmxlSXRlbUNvdW50ID0gMDtcbiAgICB7XG4gICAgICBsZXQgY3VycmVudFJvd0VsID0gbnVsbDtcbiAgICAgIGxldCBjdXJyZW50Um93SW5kZXggPSAtMTtcbiAgICAgIGxpc3QuZm9yRWFjaCgoZWwsIGlkeCkgPT4ge1xuICAgICAgICBpZiAoZWwgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2aXNpYmxlSXRlbUNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IHJvd0VsID0gZWwuY2xvc2VzdCgnW3JvbGU9XCJyb3dcIl0nKTtcbiAgICAgICAgaWYgKHJvd0VsKSB7XG4gICAgICAgICAgaGFzUm9sZVJvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvd0VsICE9PSBjdXJyZW50Um93RWwgfHwgY3VycmVudFJvd0luZGV4ID09PSAtMSkge1xuICAgICAgICAgIGN1cnJlbnRSb3dFbCA9IHJvd0VsO1xuICAgICAgICAgIGN1cnJlbnRSb3dJbmRleCArPSAxO1xuICAgICAgICAgIHJvd3NbY3VycmVudFJvd0luZGV4XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJvd3NbY3VycmVudFJvd0luZGV4XS5wdXNoKGlkeCk7XG4gICAgICAgIHJvd0luZGV4TWFwW2lkeF0gPSBjdXJyZW50Um93SW5kZXg7XG4gICAgICB9KTtcbiAgICB9XG4gICAgbGV0IGhhc0RvbVJvd3MgPSBmYWxzZTtcbiAgICBsZXQgaW5mZXJyZWREb21Db2xzID0gMDtcbiAgICBpZiAoaGFzUm9sZVJvdykge1xuICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCByb3dMZW5ndGggPSByb3cubGVuZ3RoO1xuICAgICAgICBpZiAocm93TGVuZ3RoID4gaW5mZXJyZWREb21Db2xzKSB7XG4gICAgICAgICAgaW5mZXJyZWREb21Db2xzID0gcm93TGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb3dMZW5ndGggIT09IGNvbHMpIHtcbiAgICAgICAgICBoYXNEb21Sb3dzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYXNWaXJ0dWFsaXplZEdhcHMgPSBoYXNEb21Sb3dzICYmIHZpc2libGVJdGVtQ291bnQgPCBsaXN0Lmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0aWNhbENvbHMgPSBpbmZlcnJlZERvbUNvbHMgfHwgY29scztcbiAgICBjb25zdCBuYXZpZ2F0ZVZlcnRpY2FsbHkgPSBkaXJlY3Rpb24gPT4ge1xuICAgICAgaWYgKCFoYXNEb21Sb3dzIHx8IHByZXZJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnRSb3cgPSByb3dJbmRleE1hcFtwcmV2SW5kZXhdO1xuICAgICAgaWYgKGN1cnJlbnRSb3cgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgY29uc3QgY29sSW5Sb3cgPSByb3dzW2N1cnJlbnRSb3ddLmluZGV4T2YocHJldkluZGV4KTtcbiAgICAgIGNvbnN0IHN0ZXAgPSBkaXJlY3Rpb24gPT09ICd1cCcgPyAtMSA6IDE7XG4gICAgICBmb3IgKGxldCBuZXh0Um93ID0gY3VycmVudFJvdyArIHN0ZXAsIGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkgKz0gMSwgbmV4dFJvdyArPSBzdGVwKSB7XG4gICAgICAgIGlmIChuZXh0Um93IDwgMCB8fCBuZXh0Um93ID49IHJvd3MubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKCFsb29wRm9jdXMgfHwgaGFzVmlydHVhbGl6ZWRHYXBzKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXh0Um93ID0gbmV4dFJvdyA8IDAgPyByb3dzLmxlbmd0aCAtIDEgOiAwO1xuICAgICAgICAgIGlmIChvbkxvb3ApIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYW1wZWRDb2wgPSBNYXRoLm1pbihjb2xJblJvdywgcm93c1tuZXh0Um93XS5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEl0ZW1JbmRleCA9IHJvd3NbbmV4dFJvd11bY2xhbXBlZENvbF0gPz8gcm93c1tuZXh0Um93XVswXTtcbiAgICAgICAgICAgIGNvbnN0IHJldHVybmVkSXRlbUluZGV4ID0gb25Mb29wKGV2ZW50LCBwcmV2SW5kZXgsIHRhcmdldEl0ZW1JbmRleCk7XG4gICAgICAgICAgICBuZXh0Um93ID0gcm93SW5kZXhNYXBbcmV0dXJuZWRJdGVtSW5kZXhdID8/IG5leHRSb3c7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldFJvdyA9IHJvd3NbbmV4dFJvd107XG4gICAgICAgIGZvciAobGV0IGNvbCA9IE1hdGgubWluKGNvbEluUm93LCB0YXJnZXRSb3cubGVuZ3RoIC0gMSk7IGNvbCA+PSAwOyBjb2wgLT0gMSkge1xuICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IHRhcmdldFJvd1tjb2xdO1xuICAgICAgICAgIGlmICghaXNMaXN0SW5kZXhEaXNhYmxlZChsaXN0LCBjYW5kaWRhdGUsIGRpc2FibGVkSW5kaWNlcykpIHtcbiAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG4gICAgY29uc3QgbmF2aWdhdGVWZXJ0aWNhbGx5V2l0aEluZmVycmVkUm93cyA9IGRpcmVjdGlvbiA9PiB7XG4gICAgICBpZiAoIWhhc1ZpcnR1YWxpemVkR2FwcyB8fCBwcmV2SW5kZXggPT09IC0xKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBjb25zdCBjb2xJblJvdyA9IHByZXZJbmRleCAlIHZlcnRpY2FsQ29scztcbiAgICAgIGNvbnN0IHJvd1N0ZXAgPSBkaXJlY3Rpb24gPT09ICd1cCcgPyAtdmVydGljYWxDb2xzIDogdmVydGljYWxDb2xzO1xuICAgICAgY29uc3QgbGFzdFJvd1N0YXJ0ID0gbWF4SW5kZXggLSBtYXhJbmRleCAlIHZlcnRpY2FsQ29scztcbiAgICAgIGNvbnN0IHJvd0NvdW50ID0gZmxvb3IobWF4SW5kZXggLyB2ZXJ0aWNhbENvbHMpICsgMTtcbiAgICAgIGZvciAobGV0IHJvd1N0YXJ0ID0gcHJldkluZGV4IC0gY29sSW5Sb3cgKyByb3dTdGVwLCBpID0gMDsgaSA8IHJvd0NvdW50OyBpICs9IDEsIHJvd1N0YXJ0ICs9IHJvd1N0ZXApIHtcbiAgICAgICAgaWYgKHJvd1N0YXJ0IDwgMCB8fCByb3dTdGFydCA+IG1heEluZGV4KSB7XG4gICAgICAgICAgaWYgKCFsb29wRm9jdXMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJvd1N0YXJ0ID0gcm93U3RhcnQgPCAwID8gbGFzdFJvd1N0YXJ0IDogMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb3dFbmQgPSBNYXRoLm1pbihyb3dTdGFydCArIHZlcnRpY2FsQ29scyAtIDEsIG1heEluZGV4KTtcbiAgICAgICAgZm9yIChsZXQgY2FuZGlkYXRlID0gTWF0aC5taW4ocm93U3RhcnQgKyBjb2xJblJvdywgcm93RW5kKTsgY2FuZGlkYXRlID49IHJvd1N0YXJ0OyBjYW5kaWRhdGUgLT0gMSkge1xuICAgICAgICAgIGlmICghaXNMaXN0SW5kZXhEaXNhYmxlZChsaXN0LCBjYW5kaWRhdGUsIGRpc2FibGVkSW5kaWNlcykpIHtcbiAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG4gICAgaWYgKHN0b3ApIHtcbiAgICAgIHN0b3BFdmVudChldmVudCk7XG4gICAgfVxuICAgIGNvbnN0IHZlcnRpY2FsQ2FuZGlkYXRlID0gbmF2aWdhdGVWZXJ0aWNhbGx5KHZlcnRpY2FsRGlyZWN0aW9uKSA/PyBuYXZpZ2F0ZVZlcnRpY2FsbHlXaXRoSW5mZXJyZWRSb3dzKHZlcnRpY2FsRGlyZWN0aW9uKTtcbiAgICBpZiAodmVydGljYWxDYW5kaWRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbmV4dEluZGV4ID0gdmVydGljYWxDYW5kaWRhdGU7XG4gICAgfSBlbHNlIGlmIChwcmV2SW5kZXggPT09IC0xKSB7XG4gICAgICBuZXh0SW5kZXggPSB2ZXJ0aWNhbERpcmVjdGlvbiA9PT0gJ3VwJyA/IG1heEluZGV4IDogbWluSW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRJbmRleCA9IGZpbmROb25EaXNhYmxlZExpc3RJbmRleChsaXN0LCB7XG4gICAgICAgIHN0YXJ0aW5nSW5kZXg6IHByZXZJbmRleCxcbiAgICAgICAgYW1vdW50OiB2ZXJ0aWNhbENvbHMsXG4gICAgICAgIGRlY3JlbWVudDogdmVydGljYWxEaXJlY3Rpb24gPT09ICd1cCcsXG4gICAgICAgIGRpc2FibGVkSW5kaWNlc1xuICAgICAgfSk7XG4gICAgICBpZiAobG9vcEZvY3VzKSB7XG4gICAgICAgIGlmICh2ZXJ0aWNhbERpcmVjdGlvbiA9PT0gJ3VwJyAmJiAocHJldkluZGV4IC0gdmVydGljYWxDb2xzIDwgbWluSW5kZXggfHwgbmV4dEluZGV4IDwgMCkpIHtcbiAgICAgICAgICBjb25zdCBjb2wgPSBwcmV2SW5kZXggJSB2ZXJ0aWNhbENvbHM7XG4gICAgICAgICAgY29uc3QgbWF4Q29sID0gbWF4SW5kZXggJSB2ZXJ0aWNhbENvbHM7XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gbWF4SW5kZXggLSAobWF4Q29sIC0gY29sKTtcbiAgICAgICAgICBpZiAobWF4Q29sID09PSBjb2wpIHtcbiAgICAgICAgICAgIG5leHRJbmRleCA9IG1heEluZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0SW5kZXggPSBtYXhDb2wgPiBjb2wgPyBvZmZzZXQgOiBvZmZzZXQgLSB2ZXJ0aWNhbENvbHM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvbkxvb3ApIHtcbiAgICAgICAgICAgIG5leHRJbmRleCA9IG9uTG9vcChldmVudCwgcHJldkluZGV4LCBuZXh0SW5kZXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmVydGljYWxEaXJlY3Rpb24gPT09ICdkb3duJyAmJiBwcmV2SW5kZXggKyB2ZXJ0aWNhbENvbHMgPiBtYXhJbmRleCkge1xuICAgICAgICAgIG5leHRJbmRleCA9IGZpbmROb25EaXNhYmxlZExpc3RJbmRleChsaXN0LCB7XG4gICAgICAgICAgICBzdGFydGluZ0luZGV4OiBwcmV2SW5kZXggJSB2ZXJ0aWNhbENvbHMgLSB2ZXJ0aWNhbENvbHMsXG4gICAgICAgICAgICBhbW91bnQ6IHZlcnRpY2FsQ29scyxcbiAgICAgICAgICAgIGRpc2FibGVkSW5kaWNlc1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChvbkxvb3ApIHtcbiAgICAgICAgICAgIG5leHRJbmRleCA9IG9uTG9vcChldmVudCwgcHJldkluZGV4LCBuZXh0SW5kZXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNJbmRleE91dE9mTGlzdEJvdW5kcyhsaXN0LCBuZXh0SW5kZXgpKSB7XG4gICAgICBuZXh0SW5kZXggPSBwcmV2SW5kZXg7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtYWlucyBvbiB0aGUgc2FtZSByb3cvY29sdW1uLlxuICBpZiAob3JpZW50YXRpb24gPT09ICdib3RoJykge1xuICAgIGNvbnN0IHByZXZSb3cgPSBmbG9vcihwcmV2SW5kZXggLyBjb2xzKTtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAocnRsID8gQVJST1dfTEVGVCA6IEFSUk9XX1JJR0hUKSkge1xuICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmV2SW5kZXggJSBjb2xzICE9PSBjb2xzIC0gMSkge1xuICAgICAgICBuZXh0SW5kZXggPSBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdCwge1xuICAgICAgICAgIHN0YXJ0aW5nSW5kZXg6IHByZXZJbmRleCxcbiAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChsb29wRm9jdXMgJiYgaXNEaWZmZXJlbnRHcmlkUm93KG5leHRJbmRleCwgY29scywgcHJldlJvdykpIHtcbiAgICAgICAgICBuZXh0SW5kZXggPSBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdCwge1xuICAgICAgICAgICAgc3RhcnRpbmdJbmRleDogcHJldkluZGV4IC0gcHJldkluZGV4ICUgY29scyAtIDEsXG4gICAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAob25Mb29wKSB7XG4gICAgICAgICAgICBuZXh0SW5kZXggPSBvbkxvb3AoZXZlbnQsIHByZXZJbmRleCwgbmV4dEluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG9vcEZvY3VzKSB7XG4gICAgICAgIG5leHRJbmRleCA9IGZpbmROb25EaXNhYmxlZExpc3RJbmRleChsaXN0LCB7XG4gICAgICAgICAgc3RhcnRpbmdJbmRleDogcHJldkluZGV4IC0gcHJldkluZGV4ICUgY29scyAtIDEsXG4gICAgICAgICAgZGlzYWJsZWRJbmRpY2VzXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAob25Mb29wKSB7XG4gICAgICAgICAgbmV4dEluZGV4ID0gb25Mb29wKGV2ZW50LCBwcmV2SW5kZXgsIG5leHRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc0RpZmZlcmVudEdyaWRSb3cobmV4dEluZGV4LCBjb2xzLCBwcmV2Um93KSkge1xuICAgICAgICBuZXh0SW5kZXggPSBwcmV2SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09IChydGwgPyBBUlJPV19SSUdIVCA6IEFSUk9XX0xFRlQpKSB7XG4gICAgICBpZiAoc3RvcCkge1xuICAgICAgICBzdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgfVxuICAgICAgaWYgKHByZXZJbmRleCAlIGNvbHMgIT09IDApIHtcbiAgICAgICAgbmV4dEluZGV4ID0gZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGxpc3QsIHtcbiAgICAgICAgICBzdGFydGluZ0luZGV4OiBwcmV2SW5kZXgsXG4gICAgICAgICAgZGVjcmVtZW50OiB0cnVlLFxuICAgICAgICAgIGRpc2FibGVkSW5kaWNlc1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGxvb3BGb2N1cyAmJiBpc0RpZmZlcmVudEdyaWRSb3cobmV4dEluZGV4LCBjb2xzLCBwcmV2Um93KSkge1xuICAgICAgICAgIG5leHRJbmRleCA9IGZpbmROb25EaXNhYmxlZExpc3RJbmRleChsaXN0LCB7XG4gICAgICAgICAgICBzdGFydGluZ0luZGV4OiBwcmV2SW5kZXggKyAoY29scyAtIHByZXZJbmRleCAlIGNvbHMpLFxuICAgICAgICAgICAgZGVjcmVtZW50OiB0cnVlLFxuICAgICAgICAgICAgZGlzYWJsZWRJbmRpY2VzXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKG9uTG9vcCkge1xuICAgICAgICAgICAgbmV4dEluZGV4ID0gb25Mb29wKGV2ZW50LCBwcmV2SW5kZXgsIG5leHRJbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvb3BGb2N1cykge1xuICAgICAgICBuZXh0SW5kZXggPSBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdCwge1xuICAgICAgICAgIHN0YXJ0aW5nSW5kZXg6IHByZXZJbmRleCArIChjb2xzIC0gcHJldkluZGV4ICUgY29scyksXG4gICAgICAgICAgZGVjcmVtZW50OiB0cnVlLFxuICAgICAgICAgIGRpc2FibGVkSW5kaWNlc1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG9uTG9vcCkge1xuICAgICAgICAgIG5leHRJbmRleCA9IG9uTG9vcChldmVudCwgcHJldkluZGV4LCBuZXh0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNEaWZmZXJlbnRHcmlkUm93KG5leHRJbmRleCwgY29scywgcHJldlJvdykpIHtcbiAgICAgICAgbmV4dEluZGV4ID0gcHJldkluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBsYXN0Um93ID0gZmxvb3IobWF4SW5kZXggLyBjb2xzKSA9PT0gcHJldlJvdztcbiAgICBpZiAoaXNJbmRleE91dE9mTGlzdEJvdW5kcyhsaXN0LCBuZXh0SW5kZXgpKSB7XG4gICAgICBpZiAobG9vcEZvY3VzICYmIGxhc3RSb3cpIHtcbiAgICAgICAgbmV4dEluZGV4ID0gZXZlbnQua2V5ID09PSAocnRsID8gQVJST1dfUklHSFQgOiBBUlJPV19MRUZUKSA/IG1heEluZGV4IDogZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGxpc3QsIHtcbiAgICAgICAgICBzdGFydGluZ0luZGV4OiBwcmV2SW5kZXggLSBwcmV2SW5kZXggJSBjb2xzIC0gMSxcbiAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChvbkxvb3ApIHtcbiAgICAgICAgICBuZXh0SW5kZXggPSBvbkxvb3AoZXZlbnQsIHByZXZJbmRleCwgbmV4dEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dEluZGV4ID0gcHJldkluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV4dEluZGV4O1xufVxuXG4vKiogRm9yIGVhY2ggY2VsbCBpbmRleCwgZ2V0cyB0aGUgaXRlbSBpbmRleCB0aGF0IG9jY3VwaWVzIHRoYXQgY2VsbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdyaWRDZWxsTWFwKHNpemVzLCBjb2xzLCBkZW5zZSkge1xuICBjb25zdCBjZWxsTWFwID0gW107XG4gIGxldCBzdGFydEluZGV4ID0gMDtcbiAgc2l6ZXMuZm9yRWFjaCgoe1xuICAgIHdpZHRoLFxuICAgIGhlaWdodFxuICB9LCBpbmRleCkgPT4ge1xuICAgIGlmICh3aWR0aCA+IGNvbHMpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIC8vIFRPRE86IGZpeCBtdWkvbm8tZ3VhcmRlZC10aHJvd1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbXVpL25vLWd1YXJkZWQtdGhyb3dcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbRmxvYXRpbmcgVUldOiBJbnZhbGlkIGdyaWQgLSBpdGVtIHdpZHRoIGF0IGluZGV4ICR7aW5kZXh9IGlzIGdyZWF0ZXIgdGhhbiBncmlkIGNvbHVtbnNgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGl0ZW1QbGFjZWQgPSBmYWxzZTtcbiAgICBpZiAoZGVuc2UpIHtcbiAgICAgIHN0YXJ0SW5kZXggPSAwO1xuICAgIH1cbiAgICB3aGlsZSAoIWl0ZW1QbGFjZWQpIHtcbiAgICAgIGNvbnN0IHRhcmdldENlbGxzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRoOyBpICs9IDEpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBoZWlnaHQ7IGogKz0gMSkge1xuICAgICAgICAgIHRhcmdldENlbGxzLnB1c2goc3RhcnRJbmRleCArIGkgKyBqICogY29scyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzdGFydEluZGV4ICUgY29scyArIHdpZHRoIDw9IGNvbHMgJiYgdGFyZ2V0Q2VsbHMuZXZlcnkoY2VsbCA9PiBjZWxsTWFwW2NlbGxdID09IG51bGwpKSB7XG4gICAgICAgIHRhcmdldENlbGxzLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgY2VsbE1hcFtjZWxsXSA9IGluZGV4O1xuICAgICAgICB9KTtcbiAgICAgICAgaXRlbVBsYWNlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydEluZGV4ICs9IDE7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBjb252ZXJ0IGludG8gYSBub24tc3BhcnNlIGFycmF5XG4gIHJldHVybiBbLi4uY2VsbE1hcF07XG59XG5cbi8qKiBHZXRzIGNlbGwgaW5kZXggb2YgYW4gaXRlbSdzIGNvcm5lciBvciAtMSB3aGVuIGluZGV4IGlzIC0xLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEdyaWRDZWxsSW5kZXhPZkNvcm5lcihpbmRleCwgc2l6ZXMsIGNlbGxNYXAsIGNvbHMsIGNvcm5lcikge1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGNvbnN0IGZpcnN0Q2VsbEluZGV4ID0gY2VsbE1hcC5pbmRleE9mKGluZGV4KTtcbiAgY29uc3Qgc2l6ZUl0ZW0gPSBzaXplc1tpbmRleF07XG4gIHN3aXRjaCAoY29ybmVyKSB7XG4gICAgY2FzZSAndGwnOlxuICAgICAgcmV0dXJuIGZpcnN0Q2VsbEluZGV4O1xuICAgIGNhc2UgJ3RyJzpcbiAgICAgIGlmICghc2l6ZUl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZpcnN0Q2VsbEluZGV4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpcnN0Q2VsbEluZGV4ICsgc2l6ZUl0ZW0ud2lkdGggLSAxO1xuICAgIGNhc2UgJ2JsJzpcbiAgICAgIGlmICghc2l6ZUl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZpcnN0Q2VsbEluZGV4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpcnN0Q2VsbEluZGV4ICsgKHNpemVJdGVtLmhlaWdodCAtIDEpICogY29scztcbiAgICBjYXNlICdicic6XG4gICAgICByZXR1cm4gY2VsbE1hcC5sYXN0SW5kZXhPZihpbmRleCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAtMTtcbiAgfVxufVxuXG4vKiogR2V0cyBhbGwgY2VsbCBpbmRpY2VzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgc3BlY2lmaWVkIGluZGljZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRHcmlkQ2VsbEluZGljZXMoaW5kaWNlcywgY2VsbE1hcCkge1xuICByZXR1cm4gY2VsbE1hcC5mbGF0TWFwKChpbmRleCwgY2VsbEluZGV4KSA9PiBpbmRpY2VzLmluY2x1ZGVzKGluZGV4KSA/IFtjZWxsSW5kZXhdIDogW10pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzTGlzdEluZGV4RGlzYWJsZWQobGlzdCwgaW5kZXgsIGRpc2FibGVkSW5kaWNlcykge1xuICBjb25zdCBpc0V4cGxpY2l0bHlEaXNhYmxlZCA9IHR5cGVvZiBkaXNhYmxlZEluZGljZXMgPT09ICdmdW5jdGlvbicgPyBkaXNhYmxlZEluZGljZXMoaW5kZXgpIDogZGlzYWJsZWRJbmRpY2VzPy5pbmNsdWRlcyhpbmRleCkgPz8gZmFsc2U7XG4gIGlmIChpc0V4cGxpY2l0bHlEaXNhYmxlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGNvbnN0IGVsZW1lbnQgPSBsaXN0W2luZGV4XTtcbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICghaXNFbGVtZW50VmlzaWJsZShlbGVtZW50KSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiAhZGlzYWJsZWRJbmRpY2VzICYmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzSGlkZGVuQnlTdHlsZXMoc3R5bGVzKSB7XG4gIHJldHVybiBzdHlsZXMudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbicgfHwgc3R5bGVzLnZpc2liaWxpdHkgPT09ICdjb2xsYXBzZSc7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNFbGVtZW50VmlzaWJsZShlbGVtZW50LCBzdHlsZXMgPSBlbGVtZW50ID8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IG51bGwpIHtcbiAgaWYgKCFlbGVtZW50IHx8ICFlbGVtZW50LmlzQ29ubmVjdGVkIHx8ICFzdHlsZXMgfHwgaXNIaWRkZW5CeVN0eWxlcyhzdHlsZXMpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZWxlbWVudC5jaGVja1Zpc2liaWxpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jaGVja1Zpc2liaWxpdHkoKTtcbiAgfVxuICByZXR1cm4gc3R5bGVzLmRpc3BsYXkgIT09ICdub25lJyAmJiBzdHlsZXMuZGlzcGxheSAhPT0gJ2NvbnRlbnRzJztcbn0iLCIvKipcbiAqIElmIHRoZSBwcm92aWRlZCBhcmd1bWVudCBpcyBhIHJlZiBvYmplY3QsIHJldHVybnMgaXRzIGBjdXJyZW50YCB2YWx1ZS5cbiAqIE90aGVyd2lzZSwgcmV0dXJucyB0aGUgYXJndW1lbnQgaXRzZWxmLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVJlZihtYXliZVJlZikge1xuICBpZiAobWF5YmVSZWYgPT0gbnVsbCkge1xuICAgIHJldHVybiBtYXliZVJlZjtcbiAgfVxuICByZXR1cm4gJ2N1cnJlbnQnIGluIG1heWJlUmVmID8gbWF5YmVSZWYuY3VycmVudCA6IG1heWJlUmVmO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlSXNvTGF5b3V0RWZmZWN0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlSXNvTGF5b3V0RWZmZWN0JztcbmltcG9ydCB7IEFuaW1hdGlvbkZyYW1lIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlQW5pbWF0aW9uRnJhbWUnO1xuLyoqXG4gKiBQcm92aWRlcyBhIHN0YXR1cyBzdHJpbmcgZm9yIENTUyBhbmltYXRpb25zLlxuICogQHBhcmFtIG9wZW4gLSBhIGJvb2xlYW4gdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBlbGVtZW50IGlzIG9wZW4uXG4gKiBAcGFyYW0gZW5hYmxlSWRsZVN0YXRlIC0gYSBib29sZWFuIHRoYXQgZW5hYmxlcyB0aGUgYCdpZGxlJ2Agc3RhdGUgYmV0d2VlbiBgJ3N0YXJ0aW5nJ2AgYW5kIGAnZW5kaW5nJ2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVRyYW5zaXRpb25TdGF0dXMob3BlbiwgZW5hYmxlSWRsZVN0YXRlID0gZmFsc2UsIGRlZmVyRW5kaW5nU3RhdGUgPSBmYWxzZSkge1xuICBjb25zdCBbdHJhbnNpdGlvblN0YXR1cywgc2V0VHJhbnNpdGlvblN0YXR1c10gPSBSZWFjdC51c2VTdGF0ZShvcGVuICYmIGVuYWJsZUlkbGVTdGF0ZSA/ICdpZGxlJyA6IHVuZGVmaW5lZCk7XG4gIGNvbnN0IFttb3VudGVkLCBzZXRNb3VudGVkXSA9IFJlYWN0LnVzZVN0YXRlKG9wZW4pO1xuICBpZiAob3BlbiAmJiAhbW91bnRlZCkge1xuICAgIHNldE1vdW50ZWQodHJ1ZSk7XG4gICAgc2V0VHJhbnNpdGlvblN0YXR1cygnc3RhcnRpbmcnKTtcbiAgfVxuICBpZiAoIW9wZW4gJiYgbW91bnRlZCAmJiB0cmFuc2l0aW9uU3RhdHVzICE9PSAnZW5kaW5nJyAmJiAhZGVmZXJFbmRpbmdTdGF0ZSkge1xuICAgIHNldFRyYW5zaXRpb25TdGF0dXMoJ2VuZGluZycpO1xuICB9XG4gIGlmICghb3BlbiAmJiAhbW91bnRlZCAmJiB0cmFuc2l0aW9uU3RhdHVzID09PSAnZW5kaW5nJykge1xuICAgIHNldFRyYW5zaXRpb25TdGF0dXModW5kZWZpbmVkKTtcbiAgfVxuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghb3BlbiAmJiBtb3VudGVkICYmIHRyYW5zaXRpb25TdGF0dXMgIT09ICdlbmRpbmcnICYmIGRlZmVyRW5kaW5nU3RhdGUpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gQW5pbWF0aW9uRnJhbWUucmVxdWVzdCgoKSA9PiB7XG4gICAgICAgIHNldFRyYW5zaXRpb25TdGF0dXMoJ2VuZGluZycpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBBbmltYXRpb25GcmFtZS5jYW5jZWwoZnJhbWUpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSwgW29wZW4sIG1vdW50ZWQsIHRyYW5zaXRpb25TdGF0dXMsIGRlZmVyRW5kaW5nU3RhdGVdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIW9wZW4gfHwgZW5hYmxlSWRsZVN0YXRlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBmcmFtZSA9IEFuaW1hdGlvbkZyYW1lLnJlcXVlc3QoKCkgPT4ge1xuICAgICAgLy8gQXZvaWQgYGZsdXNoU3luY2AgaGVyZSBkdWUgdG8gRmlyZWZveC5cbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbXVpL2Jhc2UtdWkvcHVsbC8zNDI0XG4gICAgICBzZXRUcmFuc2l0aW9uU3RhdHVzKHVuZGVmaW5lZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIEFuaW1hdGlvbkZyYW1lLmNhbmNlbChmcmFtZSk7XG4gICAgfTtcbiAgfSwgW2VuYWJsZUlkbGVTdGF0ZSwgb3Blbl0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghb3BlbiB8fCAhZW5hYmxlSWRsZVN0YXRlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAob3BlbiAmJiBtb3VudGVkICYmIHRyYW5zaXRpb25TdGF0dXMgIT09ICdpZGxlJykge1xuICAgICAgc2V0VHJhbnNpdGlvblN0YXR1cygnc3RhcnRpbmcnKTtcbiAgICB9XG4gICAgY29uc3QgZnJhbWUgPSBBbmltYXRpb25GcmFtZS5yZXF1ZXN0KCgpID0+IHtcbiAgICAgIHNldFRyYW5zaXRpb25TdGF0dXMoJ2lkbGUnKTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgQW5pbWF0aW9uRnJhbWUuY2FuY2VsKGZyYW1lKTtcbiAgICB9O1xuICB9LCBbZW5hYmxlSWRsZVN0YXRlLCBvcGVuLCBtb3VudGVkLCB0cmFuc2l0aW9uU3RhdHVzXSk7XG4gIHJldHVybiB7XG4gICAgbW91bnRlZCxcbiAgICBzZXRNb3VudGVkLFxuICAgIHRyYW5zaXRpb25TdGF0dXNcbiAgfTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgeyB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUFuaW1hdGlvbkZyYW1lJztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgcmVzb2x2ZVJlZiB9IGZyb20gXCIuLi91dGlscy9yZXNvbHZlUmVmLmpzXCI7XG5pbXBvcnQgeyBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMgfSBmcm9tIFwiLi9zdGF0ZUF0dHJpYnV0ZXNNYXBwaW5nLmpzXCI7XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBmdW5jdGlvbiBvbmNlIGFsbCBhbmltYXRpb25zIGhhdmUgZmluaXNoZWQgb24gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudE9yUmVmIC0gVGhlIGVsZW1lbnQgdG8gd2F0Y2ggZm9yIGFuaW1hdGlvbnMuXG4gKiBAcGFyYW0gd2FpdEZvclN0YXJ0aW5nU3R5bGVSZW1vdmVkIC0gV2hldGhlciB0byB3YWl0IGZvciBbZGF0YS1zdGFydGluZy1zdHlsZV0gdG8gYmUgcmVtb3ZlZCBiZWZvcmUgY2hlY2tpbmcgZm9yIGFuaW1hdGlvbnMuXG4gKiBAcGFyYW0gdHJlYXRBYm9ydGVkQXNGaW5pc2hlZCAtIFdoZXRoZXIgdG8gdHJlYXQgYWJvcnRlZCBhbmltYXRpb25zIGFzIGZpbmlzaGVkLiBJZiBgZmFsc2VgLCBhbmQgdGhlcmUgYXJlIGFib3J0ZWQgYW5pbWF0aW9ucyxcbiAqICAgdGhlIGZ1bmN0aW9uIHdpbGwgY2hlY2sgYWdhaW4gaWYgYW55IG5ldyBhbmltYXRpb25zIGhhdmUgc3RhcnRlZCBhbmQgd2FpdCBmb3IgdGhlbSB0byBmaW5pc2guXG4gKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBjYWxsYmFjayB0byBleGVjdXRlIG9uY2UgYWxsIGFuaW1hdGlvbnMgaGF2ZSBmaW5pc2hlZCwgYW5kIGFuIG9wdGlvbmFsIEFib3J0U2lnbmFsIHRvIGFib3J0IHRoZSBjYWxsYmFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQW5pbWF0aW9uc0ZpbmlzaGVkKGVsZW1lbnRPclJlZiwgd2FpdEZvclN0YXJ0aW5nU3R5bGVSZW1vdmVkID0gZmFsc2UsIHRyZWF0QWJvcnRlZEFzRmluaXNoZWQgPSB0cnVlKSB7XG4gIGNvbnN0IGZyYW1lID0gdXNlQW5pbWF0aW9uRnJhbWUoKTtcbiAgcmV0dXJuIHVzZVN0YWJsZUNhbGxiYWNrKChmblRvRXhlY3V0ZSxcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIFtBYm9ydFNpZ25hbF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0U2lnbmFsKSB0aGF0XG4gICAqIGNhbiBiZSB1c2VkIHRvIGFib3J0IGBmblRvRXhlY3V0ZWAgYmVmb3JlIGFsbCB0aGUgYW5pbWF0aW9ucyBoYXZlIGZpbmlzaGVkLlxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBzaWduYWwgPSBudWxsKSA9PiB7XG4gICAgZnJhbWUuY2FuY2VsKCk7XG4gICAgY29uc3QgZWxlbWVudCA9IHJlc29sdmVSZWYoZWxlbWVudE9yUmVmKTtcbiAgICBpZiAoZWxlbWVudCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgY29uc3QgZG9uZSA9ICgpID0+IHtcbiAgICAgIC8vIFN5bmNocm9ub3VzbHkgZmx1c2ggdGhlIHVubW91bnRpbmcgb2YgdGhlIGNvbXBvbmVudCBzbyB0aGF0IHRoZSBicm93c2VyIGRvZXNuJ3RcbiAgICAgIC8vIHBhaW50OiBodHRwczovL2dpdGh1Yi5jb20vbXVpL2Jhc2UtdWkvaXNzdWVzLzk3OVxuICAgICAgUmVhY3RET00uZmx1c2hTeW5jKGZuVG9FeGVjdXRlKTtcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZWRFbGVtZW50LmdldEFuaW1hdGlvbnMgIT09ICdmdW5jdGlvbicgfHwgZ2xvYmFsVGhpcy5CQVNFX1VJX0FOSU1BVElPTlNfRElTQUJMRUQpIHtcbiAgICAgIGZuVG9FeGVjdXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4ZWMoKSB7XG4gICAgICBQcm9taXNlLmFsbChyZXNvbHZlZEVsZW1lbnQuZ2V0QW5pbWF0aW9ucygpLm1hcChhbmltYXRpb24gPT4gYW5pbWF0aW9uLmZpbmlzaGVkKSkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICghc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgZG9uZSgpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgIGlmICh0cmVhdEFib3J0ZWRBc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgaWYgKCFzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRBbmltYXRpb25zID0gcmVzb2x2ZWRFbGVtZW50LmdldEFuaW1hdGlvbnMoKTtcbiAgICAgICAgaWYgKCFzaWduYWw/LmFib3J0ZWQgJiYgY3VycmVudEFuaW1hdGlvbnMubGVuZ3RoID4gMCAmJiBjdXJyZW50QW5pbWF0aW9ucy5zb21lKGFuaW1hdGlvbiA9PiBhbmltYXRpb24ucGVuZGluZyB8fCBhbmltYXRpb24ucGxheVN0YXRlICE9PSAnZmluaXNoZWQnKSkge1xuICAgICAgICAgIC8vIFNvbWV0aW1lcyBhbmltYXRpb25zIGNhbiBiZSBhYm9ydGVkIGJlY2F1c2UgYSBwcm9wZXJ0eSB0aGV5IGRlcGVuZCBvbiBjaGFuZ2VzIHdoaWxlIHRoZSBhbmltYXRpb24gcGxheXMuXG4gICAgICAgICAgLy8gSW4gc3VjaCBjYXNlcywgd2UgbmVlZCB0byByZS1jaGVjayBpZiBhbnkgbmV3IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLlxuICAgICAgICAgIGV4ZWMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh3YWl0Rm9yU3RhcnRpbmdTdHlsZVJlbW92ZWQpIHtcbiAgICAgIGNvbnN0IHN0YXJ0aW5nU3R5bGVBdHRyaWJ1dGUgPSBUcmFuc2l0aW9uU3RhdHVzRGF0YUF0dHJpYnV0ZXMuc3RhcnRpbmdTdHlsZTtcblxuICAgICAgLy8gSWYgYFtkYXRhLXN0YXJ0aW5nLXN0eWxlXWAgaXNuJ3QgcHJlc2VudCwgZmFsbCBiYWNrIHRvIHdhaXRpbmcgb25lIG1vcmUgZnJhbWVcbiAgICAgIC8vIHRvIGdpdmUgXCJvcGVuXCIgYW5pbWF0aW9ucyBhIGNoYW5jZSB0byBiZSByZWdpc3RlcmVkLlxuICAgICAgaWYgKCFyZXNvbHZlZEVsZW1lbnQuaGFzQXR0cmlidXRlKHN0YXJ0aW5nU3R5bGVBdHRyaWJ1dGUpKSB7XG4gICAgICAgIGZyYW1lLnJlcXVlc3QoZXhlYyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gV2FpdCBmb3IgYFtkYXRhLXN0YXJ0aW5nLXN0eWxlXWAgdG8gaGF2ZSBiZWVuIHJlbW92ZWQuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZEVsZW1lbnQuaGFzQXR0cmlidXRlKHN0YXJ0aW5nU3R5bGVBdHRyaWJ1dGUpKSB7XG4gICAgICAgICAgYXR0cmlidXRlT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgIGV4ZWMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBhdHRyaWJ1dGVPYnNlcnZlci5vYnNlcnZlKHJlc29sdmVkRWxlbWVudCwge1xuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IFtzdGFydGluZ1N0eWxlQXR0cmlidXRlXVxuICAgICAgfSk7XG4gICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgKCkgPT4gYXR0cmlidXRlT2JzZXJ2ZXIuZGlzY29ubmVjdCgpLCB7XG4gICAgICAgIG9uY2U6IHRydWVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmcmFtZS5yZXF1ZXN0KGV4ZWMpO1xuICB9KTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlQW5pbWF0aW9uc0ZpbmlzaGVkIH0gZnJvbSBcIi4vdXNlQW5pbWF0aW9uc0ZpbmlzaGVkLmpzXCI7XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdoZW4gdGhlIENTUyBvcGVuL2Nsb3NlIGFuaW1hdGlvbiBvciB0cmFuc2l0aW9uIGNvbXBsZXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU9wZW5DaGFuZ2VDb21wbGV0ZShwYXJhbWV0ZXJzKSB7XG4gIGNvbnN0IHtcbiAgICBlbmFibGVkID0gdHJ1ZSxcbiAgICBvcGVuLFxuICAgIHJlZixcbiAgICBvbkNvbXBsZXRlOiBvbkNvbXBsZXRlUGFyYW1cbiAgfSA9IHBhcmFtZXRlcnM7XG4gIGNvbnN0IG9uQ29tcGxldGUgPSB1c2VTdGFibGVDYWxsYmFjayhvbkNvbXBsZXRlUGFyYW0pO1xuICBjb25zdCBydW5PbmNlQW5pbWF0aW9uc0ZpbmlzaCA9IHVzZUFuaW1hdGlvbnNGaW5pc2hlZChyZWYsIG9wZW4sIGZhbHNlKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBydW5PbmNlQW5pbWF0aW9uc0ZpbmlzaChvbkNvbXBsZXRlLCBhYm9ydENvbnRyb2xsZXIuc2lnbmFsKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgfTtcbiAgfSwgW2VuYWJsZWQsIG9wZW4sIG9uQ29tcGxldGUsIHJ1bk9uY2VBbmltYXRpb25zRmluaXNoXSk7XG59IiwiaW1wb3J0IHsgaXNIVE1MRWxlbWVudCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuZXhwb3J0IHsgc3RvcEV2ZW50LCBpc0luZGV4T3V0T2ZMaXN0Qm91bmRzLCBpc0xpc3RJbmRleERpc2FibGVkLCBjcmVhdGVHcmlkQ2VsbE1hcCwgZmluZE5vbkRpc2FibGVkTGlzdEluZGV4LCBnZXRHcmlkQ2VsbEluZGV4T2ZDb3JuZXIsIGdldEdyaWRDZWxsSW5kaWNlcywgZ2V0R3JpZE5hdmlnYXRlZEluZGV4LCBnZXRNYXhMaXN0SW5kZXgsIGdldE1pbkxpc3RJbmRleCB9IGZyb20gXCIuLi8uLi9mbG9hdGluZy11aS1yZWFjdC91dGlscy5qc1wiO1xuZXhwb3J0IGNvbnN0IEFSUk9XX1VQID0gJ0Fycm93VXAnO1xuZXhwb3J0IGNvbnN0IEFSUk9XX0RPV04gPSAnQXJyb3dEb3duJztcbmV4cG9ydCBjb25zdCBBUlJPV19MRUZUID0gJ0Fycm93TGVmdCc7XG5leHBvcnQgY29uc3QgQVJST1dfUklHSFQgPSAnQXJyb3dSaWdodCc7XG5leHBvcnQgY29uc3QgSE9NRSA9ICdIb21lJztcbmV4cG9ydCBjb25zdCBFTkQgPSAnRW5kJztcbmV4cG9ydCBjb25zdCBQQUdFX1VQID0gJ1BhZ2VVcCc7XG5leHBvcnQgY29uc3QgUEFHRV9ET1dOID0gJ1BhZ2VEb3duJztcbmV4cG9ydCBjb25zdCBIT1JJWk9OVEFMX0tFWVMgPSBuZXcgU2V0KFtBUlJPV19MRUZULCBBUlJPV19SSUdIVF0pO1xuZXhwb3J0IGNvbnN0IEhPUklaT05UQUxfS0VZU19XSVRIX0VYVFJBX0tFWVMgPSBuZXcgU2V0KFtBUlJPV19MRUZULCBBUlJPV19SSUdIVCwgSE9NRSwgRU5EXSk7XG5leHBvcnQgY29uc3QgVkVSVElDQUxfS0VZUyA9IG5ldyBTZXQoW0FSUk9XX1VQLCBBUlJPV19ET1dOXSk7XG5leHBvcnQgY29uc3QgVkVSVElDQUxfS0VZU19XSVRIX0VYVFJBX0tFWVMgPSBuZXcgU2V0KFtBUlJPV19VUCwgQVJST1dfRE9XTiwgSE9NRSwgRU5EXSk7XG5leHBvcnQgY29uc3QgQVJST1dfS0VZUyA9IG5ldyBTZXQoWy4uLkhPUklaT05UQUxfS0VZUywgLi4uVkVSVElDQUxfS0VZU10pO1xuZXhwb3J0IGNvbnN0IENPTVBPU0lURV9LRVlTID0gbmV3IFNldChbLi4uQVJST1dfS0VZUywgSE9NRSwgRU5EXSk7XG5leHBvcnQgY29uc3QgU0hJRlQgPSAnU2hpZnQnO1xuZXhwb3J0IGNvbnN0IENPTlRST0wgPSAnQ29udHJvbCc7XG5leHBvcnQgY29uc3QgQUxUID0gJ0FsdCc7XG5leHBvcnQgY29uc3QgTUVUQSA9ICdNZXRhJztcbmV4cG9ydCBjb25zdCBNT0RJRklFUl9LRVlTID0gbmV3IFNldChbU0hJRlQsIENPTlRST0wsIEFMVCwgTUVUQV0pO1xuZnVuY3Rpb24gaXNJbnB1dEVsZW1lbnQoZWxlbWVudCkge1xuICByZXR1cm4gaXNIVE1MRWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCc7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNOYXRpdmVJbnB1dChlbGVtZW50KSB7XG4gIGlmIChpc0lucHV0RWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICE9IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoaXNIVE1MRWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChzY3JvbGxDb250YWluZXIsIGVsZW1lbnQsIGRpcmVjdGlvbiwgb3JpZW50YXRpb24pIHtcbiAgaWYgKCFzY3JvbGxDb250YWluZXIgfHwgIWVsZW1lbnQgfHwgIWVsZW1lbnQuc2Nyb2xsVG8pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IHRhcmdldFggPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdDtcbiAgbGV0IHRhcmdldFkgPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wO1xuICBjb25zdCBpc092ZXJmbG93aW5nWCA9IHNjcm9sbENvbnRhaW5lci5jbGllbnRXaWR0aCA8IHNjcm9sbENvbnRhaW5lci5zY3JvbGxXaWR0aDtcbiAgY29uc3QgaXNPdmVyZmxvd2luZ1kgPSBzY3JvbGxDb250YWluZXIuY2xpZW50SGVpZ2h0IDwgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbEhlaWdodDtcbiAgaWYgKGlzT3ZlcmZsb3dpbmdYICYmIG9yaWVudGF0aW9uICE9PSAndmVydGljYWwnKSB7XG4gICAgY29uc3QgZWxlbWVudE9mZnNldExlZnQgPSBnZXRPZmZzZXQoc2Nyb2xsQ29udGFpbmVyLCBlbGVtZW50LCAnbGVmdCcpO1xuICAgIGNvbnN0IGNvbnRhaW5lclN0eWxlcyA9IGdldFN0eWxlcyhzY3JvbGxDb250YWluZXIpO1xuICAgIGNvbnN0IGVsZW1lbnRTdHlsZXMgPSBnZXRTdHlsZXMoZWxlbWVudCk7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2x0cicpIHtcbiAgICAgIGlmIChlbGVtZW50T2Zmc2V0TGVmdCArIGVsZW1lbnQub2Zmc2V0V2lkdGggKyBlbGVtZW50U3R5bGVzLnNjcm9sbE1hcmdpblJpZ2h0ID4gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgKyBzY3JvbGxDb250YWluZXIuY2xpZW50V2lkdGggLSBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ1JpZ2h0KSB7XG4gICAgICAgIC8vIG92ZXJmbG93IHRvIHRoZSByaWdodCwgc2Nyb2xsIHRvIGFsaWduIHJpZ2h0IGVkZ2VzXG4gICAgICAgIHRhcmdldFggPSBlbGVtZW50T2Zmc2V0TGVmdCArIGVsZW1lbnQub2Zmc2V0V2lkdGggKyBlbGVtZW50U3R5bGVzLnNjcm9sbE1hcmdpblJpZ2h0IC0gc2Nyb2xsQ29udGFpbmVyLmNsaWVudFdpZHRoICsgY29udGFpbmVyU3R5bGVzLnNjcm9sbFBhZGRpbmdSaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoZWxlbWVudE9mZnNldExlZnQgLSBlbGVtZW50U3R5bGVzLnNjcm9sbE1hcmdpbkxlZnQgPCBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCArIGNvbnRhaW5lclN0eWxlcy5zY3JvbGxQYWRkaW5nTGVmdCkge1xuICAgICAgICAvLyBvdmVyZmxvdyB0byB0aGUgbGVmdCwgc2Nyb2xsIHRvIGFsaWduIGxlZnQgZWRnZXNcbiAgICAgICAgdGFyZ2V0WCA9IGVsZW1lbnRPZmZzZXRMZWZ0IC0gZWxlbWVudFN0eWxlcy5zY3JvbGxNYXJnaW5MZWZ0IC0gY29udGFpbmVyU3R5bGVzLnNjcm9sbFBhZGRpbmdMZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZGlyZWN0aW9uID09PSAncnRsJykge1xuICAgICAgaWYgKGVsZW1lbnRPZmZzZXRMZWZ0IC0gZWxlbWVudFN0eWxlcy5zY3JvbGxNYXJnaW5SaWdodCA8IHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ICsgY29udGFpbmVyU3R5bGVzLnNjcm9sbFBhZGRpbmdMZWZ0KSB7XG4gICAgICAgIC8vIG92ZXJmbG93IHRvIHRoZSBsZWZ0LCBzY3JvbGwgdG8gYWxpZ24gbGVmdCBlZGdlc1xuICAgICAgICB0YXJnZXRYID0gZWxlbWVudE9mZnNldExlZnQgLSBlbGVtZW50U3R5bGVzLnNjcm9sbE1hcmdpbkxlZnQgLSBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ0xlZnQ7XG4gICAgICB9IGVsc2UgaWYgKGVsZW1lbnRPZmZzZXRMZWZ0ICsgZWxlbWVudC5vZmZzZXRXaWR0aCArIGVsZW1lbnRTdHlsZXMuc2Nyb2xsTWFyZ2luUmlnaHQgPiBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCArIHNjcm9sbENvbnRhaW5lci5jbGllbnRXaWR0aCAtIGNvbnRhaW5lclN0eWxlcy5zY3JvbGxQYWRkaW5nUmlnaHQpIHtcbiAgICAgICAgLy8gb3ZlcmZsb3cgdG8gdGhlIHJpZ2h0LCBzY3JvbGwgdG8gYWxpZ24gcmlnaHQgZWRnZXNcbiAgICAgICAgdGFyZ2V0WCA9IGVsZW1lbnRPZmZzZXRMZWZ0ICsgZWxlbWVudC5vZmZzZXRXaWR0aCArIGVsZW1lbnRTdHlsZXMuc2Nyb2xsTWFyZ2luUmlnaHQgLSBzY3JvbGxDb250YWluZXIuY2xpZW50V2lkdGggKyBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ1JpZ2h0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaXNPdmVyZmxvd2luZ1kgJiYgb3JpZW50YXRpb24gIT09ICdob3Jpem9udGFsJykge1xuICAgIGNvbnN0IGVsZW1lbnRPZmZzZXRUb3AgPSBnZXRPZmZzZXQoc2Nyb2xsQ29udGFpbmVyLCBlbGVtZW50LCAndG9wJyk7XG4gICAgY29uc3QgY29udGFpbmVyU3R5bGVzID0gZ2V0U3R5bGVzKHNjcm9sbENvbnRhaW5lcik7XG4gICAgY29uc3QgZWxlbWVudFN0eWxlcyA9IGdldFN0eWxlcyhlbGVtZW50KTtcbiAgICBpZiAoZWxlbWVudE9mZnNldFRvcCAtIGVsZW1lbnRTdHlsZXMuc2Nyb2xsTWFyZ2luVG9wIDwgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCArIGNvbnRhaW5lclN0eWxlcy5zY3JvbGxQYWRkaW5nVG9wKSB7XG4gICAgICAvLyBvdmVyZmxvdyB1cHdhcmRzLCBhbGlnbiB0b3AgZWRnZXNcbiAgICAgIHRhcmdldFkgPSBlbGVtZW50T2Zmc2V0VG9wIC0gZWxlbWVudFN0eWxlcy5zY3JvbGxNYXJnaW5Ub3AgLSBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ1RvcDtcbiAgICB9IGVsc2UgaWYgKGVsZW1lbnRPZmZzZXRUb3AgKyBlbGVtZW50Lm9mZnNldEhlaWdodCArIGVsZW1lbnRTdHlsZXMuc2Nyb2xsTWFyZ2luQm90dG9tID4gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCArIHNjcm9sbENvbnRhaW5lci5jbGllbnRIZWlnaHQgLSBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ0JvdHRvbSkge1xuICAgICAgLy8gb3ZlcmZsb3cgZG93bndhcmRzLCBhbGlnbiBib3R0b20gZWRnZXNcbiAgICAgIHRhcmdldFkgPSBlbGVtZW50T2Zmc2V0VG9wICsgZWxlbWVudC5vZmZzZXRIZWlnaHQgKyBlbGVtZW50U3R5bGVzLnNjcm9sbE1hcmdpbkJvdHRvbSAtIHNjcm9sbENvbnRhaW5lci5jbGllbnRIZWlnaHQgKyBjb250YWluZXJTdHlsZXMuc2Nyb2xsUGFkZGluZ0JvdHRvbTtcbiAgICB9XG4gIH1cbiAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvKHtcbiAgICBsZWZ0OiB0YXJnZXRYLFxuICAgIHRvcDogdGFyZ2V0WSxcbiAgICBiZWhhdmlvcjogJ2F1dG8nXG4gIH0pO1xufVxuZnVuY3Rpb24gZ2V0T2Zmc2V0KGFuY2VzdG9yLCBlbGVtZW50LCBzaWRlKSB7XG4gIGNvbnN0IHByb3BOYW1lID0gc2lkZSA9PT0gJ2xlZnQnID8gJ29mZnNldExlZnQnIDogJ29mZnNldFRvcCc7XG4gIGxldCByZXN1bHQgPSAwO1xuICB3aGlsZSAoZWxlbWVudC5vZmZzZXRQYXJlbnQpIHtcbiAgICByZXN1bHQgKz0gZWxlbWVudFtwcm9wTmFtZV07XG4gICAgaWYgKGVsZW1lbnQub2Zmc2V0UGFyZW50ID09PSBhbmNlc3Rvcikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGVsZW1lbnQgPSBlbGVtZW50Lm9mZnNldFBhcmVudDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0U3R5bGVzKGVsZW1lbnQpIHtcbiAgY29uc3Qgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgcmV0dXJuIHtcbiAgICBzY3JvbGxNYXJnaW5Ub3A6IHBhcnNlRmxvYXQoc3R5bGVzLnNjcm9sbE1hcmdpblRvcCkgfHwgMCxcbiAgICBzY3JvbGxNYXJnaW5SaWdodDogcGFyc2VGbG9hdChzdHlsZXMuc2Nyb2xsTWFyZ2luUmlnaHQpIHx8IDAsXG4gICAgc2Nyb2xsTWFyZ2luQm90dG9tOiBwYXJzZUZsb2F0KHN0eWxlcy5zY3JvbGxNYXJnaW5Cb3R0b20pIHx8IDAsXG4gICAgc2Nyb2xsTWFyZ2luTGVmdDogcGFyc2VGbG9hdChzdHlsZXMuc2Nyb2xsTWFyZ2luTGVmdCkgfHwgMCxcbiAgICBzY3JvbGxQYWRkaW5nVG9wOiBwYXJzZUZsb2F0KHN0eWxlcy5zY3JvbGxQYWRkaW5nVG9wKSB8fCAwLFxuICAgIHNjcm9sbFBhZGRpbmdSaWdodDogcGFyc2VGbG9hdChzdHlsZXMuc2Nyb2xsUGFkZGluZ1JpZ2h0KSB8fCAwLFxuICAgIHNjcm9sbFBhZGRpbmdCb3R0b206IHBhcnNlRmxvYXQoc3R5bGVzLnNjcm9sbFBhZGRpbmdCb3R0b20pIHx8IDAsXG4gICAgc2Nyb2xsUGFkZGluZ0xlZnQ6IHBhcnNlRmxvYXQoc3R5bGVzLnNjcm9sbFBhZGRpbmdMZWZ0KSB8fCAwXG4gIH07XG59IiwiaW1wb3J0IHsgaXNSZWFjdFZlcnNpb25BdExlYXN0IH0gZnJvbSBcIi4vcmVhY3RWZXJzaW9uLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gaW5lcnRWYWx1ZSh2YWx1ZSkge1xuICBpZiAoaXNSZWFjdFZlcnNpb25BdExlYXN0KDE5KSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggUmVhY3QgPCAxOVxuICByZXR1cm4gdmFsdWUgPyAndHJ1ZScgOiB1bmRlZmluZWQ7XG59Il0sIm1hcHBpbmdzIjoiOzs7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QUFDO0FBQ0g7QUFDQSxTQUFTLFVBQVUsVUFBVSxTQUFTLE1BQU07Q0FDMUMsTUFBTSxXQUFXLFNBQVMsU0FBUyxlQUFlO0NBQ2xELElBQUksU0FBUztDQUNiLE9BQU8sUUFBUSxjQUFjO0VBQzNCLFVBQVUsUUFBUTtFQUNsQixJQUFJLFFBQVEsaUJBQWlCLFVBQzNCO0VBRUYsVUFBVSxRQUFRO0NBQ3BCO0NBQ0EsT0FBTztBQUNUO0FBQ0EsU0FBUyxVQUFVLFNBQVM7Q0FDMUIsTUFBTSxTQUFTLGlCQUFpQixPQUFPO0NBQ3ZDLE9BQU87RUFDTCxpQkFBaUIsV0FBVyxPQUFPLGVBQWUsS0FBSztFQUN2RCxtQkFBbUIsV0FBVyxPQUFPLGlCQUFpQixLQUFLO0VBQzNELG9CQUFvQixXQUFXLE9BQU8sa0JBQWtCLEtBQUs7RUFDN0Qsa0JBQWtCLFdBQVcsT0FBTyxnQkFBZ0IsS0FBSztFQUN6RCxrQkFBa0IsV0FBVyxPQUFPLGdCQUFnQixLQUFLO0VBQ3pELG9CQUFvQixXQUFXLE9BQU8sa0JBQWtCLEtBQUs7RUFDN0QscUJBQXFCLFdBQVcsT0FBTyxtQkFBbUIsS0FBSztFQUMvRCxtQkFBbUIsV0FBVyxPQUFPLGlCQUFpQixLQUFLO0NBQzdEO0FBQ0Y7OztBQ3pHQSxTQUFnQixXQUFXLE9BQU87Q0FDaEMsSUFBSSxzQkFBc0IsRUFBRSxHQUMxQixPQUFPO0NBR1QsT0FBTyxRQUFRLFNBQVMsS0FBQTtBQUMxQiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzXX0=