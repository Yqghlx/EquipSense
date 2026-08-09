import { i as __toESM } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_react_dom } from "/node_modules/.vite/deps/react-dom.js?v=1d2f6f90";
import { C as isWebKit, S as isTopLayer, _ as isLastTraversableNode, a as getComputedStyle$1, c as getFrameElement, d as getOverflowAncestors, f as getParentNode, g as isHTMLElement, h as isElement, l as getNodeName, m as isContainingBlock, o as getContainingBlock, p as getWindow, r as useStableCallback, s as getDocumentElement, t as useIsoLayoutEffect, u as getNodeScroll, x as isTableElement, y as isOverflowElement } from "/node_modules/.vite/deps/useIsoLayoutEffect-qBxJPEU7.js?v=1d2f6f90";
import { c as useRefWithInit, r as EMPTY_OBJECT, t as useRenderElement } from "/node_modules/.vite/deps/useRenderElement-BXRg5SAf.js?v=1d2f6f90";
import { $ as ARROW_LEFT, A as clamp, B as getOppositeAxisPlacements, C as getGridCellIndices, D as isElementVisible, E as getMinListIndex, F as getAlignmentAxis, G as max, H as getPaddingObject, I as getAlignmentSides, J as round, K as min, L as getAxisLength, M as evaluate, N as floor, O as isIndexOutOfListBounds, P as getAlignment, Q as ARROW_DOWN, R as getExpandedPlacements, S as getGridCellIndexOfCorner, T as getMaxListIndex, U as getSide, V as getOppositePlacement, W as getSideAxis, Y as sides, Z as useAnimationFrame, b as createGridCellMap, ct as isVirtualPointerEvent, et as ARROW_RIGHT, j as createCoords, k as isListIndexDisabled, lt as stopEvent, q as rectToClientRect, st as isVirtualClick, tt as ARROW_UP, w as getGridNavigatedIndex, x as findNonDisabledListIndex, z as getOppositeAxis } from "/node_modules/.vite/deps/inertValue-UPO00KsX.js?v=1d2f6f90";
import { A as useFloatingParentNodeId, F as DISABLED_TRANSITIONS_STYLE, K as useValueAsRef, Q as isTypeableCombobox, R as enqueueFocus, Y as getFloatingFocusElement, _ as FloatingRootStore, it as popupStateMapping, j as useFloatingTree, nt as useTimeout, o as PopupTriggerMap, r as useScrollLock } from "/node_modules/.vite/deps/useOpenInteractionType-CzC_cFBM.js?v=1d2f6f90";
import { c as focusOut, f as listNavigation, n as useId, r as createChangeEventDetails } from "/node_modules/.vite/deps/useBaseUiId-DvJDX_5E.js?v=1d2f6f90";
import { i as getTarget, n as activeElement, r as contains, t as ownerDocument } from "/node_modules/.vite/deps/owner-DZtPiEvy.js?v=1d2f6f90";
import { n as useDirection } from "/node_modules/.vite/deps/CompositeList-CuwZ14So.js?v=1d2f6f90";
//#region node_modules/@floating-ui/core/dist/floating-ui.core.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function computeCoordsFromPlacement(_ref, placement, rtl) {
	let { reference, floating } = _ref;
	const sideAxis = getSideAxis(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const alignLength = getAxisLength(alignmentAxis);
	const side = getSide(placement);
	const isVertical = sideAxis === "y";
	const commonX = reference.x + reference.width / 2 - floating.width / 2;
	const commonY = reference.y + reference.height / 2 - floating.height / 2;
	const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
	let coords;
	switch (side) {
		case "top":
			coords = {
				x: commonX,
				y: reference.y - floating.height
			};
			break;
		case "bottom":
			coords = {
				x: commonX,
				y: reference.y + reference.height
			};
			break;
		case "right":
			coords = {
				x: reference.x + reference.width,
				y: commonY
			};
			break;
		case "left":
			coords = {
				x: reference.x - floating.width,
				y: commonY
			};
			break;
		default: coords = {
			x: reference.x,
			y: reference.y
		};
	}
	switch (getAlignment(placement)) {
		case "start":
			coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
			break;
		case "end": coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
	}
	return coords;
}
/**
* Resolves with an object of overflow side offsets that determine how much the
* element is overflowing a given clipping boundary on each side.
* - positive = overflowing the boundary by that number of pixels
* - negative = how many pixels left before it will overflow
* - 0 = lies flush with the boundary
* @see https://floating-ui.com/docs/detectOverflow
*/
async function detectOverflow(state, options) {
	var _await$platform$isEle;
	if (options === void 0) options = {};
	const { x, y, platform, rects, elements, strategy } = state;
	const { boundary = "clippingAncestors", rootBoundary = "viewport", elementContext = "floating", altBoundary = false, padding = 0 } = evaluate(options, state);
	const paddingObject = getPaddingObject(padding);
	const element = elements[altBoundary ? elementContext === "floating" ? "reference" : "floating" : elementContext];
	const clippingClientRect = rectToClientRect(await platform.getClippingRect({
		element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating)),
		boundary,
		rootBoundary,
		strategy
	}));
	const rect = elementContext === "floating" ? {
		x,
		y,
		width: rects.floating.width,
		height: rects.floating.height
	} : rects.reference;
	const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
	const offsetScale = await (platform.isElement == null ? void 0 : platform.isElement(offsetParent)) ? await (platform.getScale == null ? void 0 : platform.getScale(offsetParent)) || {
		x: 1,
		y: 1
	} : {
		x: 1,
		y: 1
	};
	const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements,
		rect,
		offsetParent,
		strategy
	}) : rect);
	return {
		top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
		bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
		left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
		right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
	};
}
var MAX_RESET_COUNT = 50;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*
* This export does not have any `platform` interface logic. You will need to
* write one for the platform you are using Floating UI with.
*/
var computePosition$1 = async (reference, floating, config) => {
	const { placement = "bottom", strategy = "absolute", middleware = [], platform } = config;
	const platformWithDetectOverflow = platform.detectOverflow ? platform : {
		...platform,
		detectOverflow
	};
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
	let rects = await platform.getElementRects({
		reference,
		floating,
		strategy
	});
	let { x, y } = computeCoordsFromPlacement(rects, placement, rtl);
	let statefulPlacement = placement;
	let resetCount = 0;
	const middlewareData = {};
	for (let i = 0; i < middleware.length; i++) {
		const currentMiddleware = middleware[i];
		if (!currentMiddleware) continue;
		const { name, fn } = currentMiddleware;
		const { x: nextX, y: nextY, data, reset } = await fn({
			x,
			y,
			initialPlacement: placement,
			placement: statefulPlacement,
			strategy,
			middlewareData,
			rects,
			platform: platformWithDetectOverflow,
			elements: {
				reference,
				floating
			}
		});
		x = nextX != null ? nextX : x;
		y = nextY != null ? nextY : y;
		middlewareData[name] = {
			...middlewareData[name],
			...data
		};
		if (reset && resetCount < MAX_RESET_COUNT) {
			resetCount++;
			if (typeof reset === "object") {
				if (reset.placement) statefulPlacement = reset.placement;
				if (reset.rects) rects = reset.rects === true ? await platform.getElementRects({
					reference,
					floating,
					strategy
				}) : reset.rects;
				({x, y} = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
			}
			i = -1;
		}
	}
	return {
		x,
		y,
		placement: statefulPlacement,
		strategy,
		middlewareData
	};
};
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "flip",
		options,
		async fn(state) {
			var _middlewareData$arrow, _middlewareData$flip;
			const { placement, middlewareData, rects, initialPlacement, platform, elements } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true, fallbackPlacements: specifiedFallbackPlacements, fallbackStrategy = "bestFit", fallbackAxisSideDirection = "none", flipAlignment = true, ...detectOverflowOptions } = evaluate(options, state);
			if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			const side = getSide(placement);
			const initialSideAxis = getSideAxis(initialPlacement);
			const isBasePlacement = getSide(initialPlacement) === initialPlacement;
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
			const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
			const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
			if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
			const placements = [initialPlacement, ...fallbackPlacements];
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const overflows = [];
			let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
			if (checkMainAxis) overflows.push(overflow[side]);
			if (checkCrossAxis) {
				const sides = getAlignmentSides(placement, rects, rtl);
				overflows.push(overflow[sides[0]], overflow[sides[1]]);
			}
			overflowsData = [...overflowsData, {
				placement,
				overflows
			}];
			if (!overflows.every((side) => side <= 0)) {
				var _middlewareData$flip2, _overflowsData$filter;
				const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
				const nextPlacement = placements[nextIndex];
				if (nextPlacement) {
					if (!(checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false) || overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) return {
						data: {
							index: nextIndex,
							overflows: overflowsData
						},
						reset: { placement: nextPlacement }
					};
				}
				let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
				if (!resetPlacement) switch (fallbackStrategy) {
					case "bestFit": {
						var _overflowsData$filter2;
						const placement = (_overflowsData$filter2 = overflowsData.filter((d) => {
							if (hasFallbackAxisSideDirection) {
								const currentSideAxis = getSideAxis(d.placement);
								return currentSideAxis === initialSideAxis || currentSideAxis === "y";
							}
							return true;
						}).map((d) => [d.placement, d.overflows.filter((overflow) => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
						if (placement) resetPlacement = placement;
						break;
					}
					case "initialPlacement": resetPlacement = initialPlacement;
				}
				if (placement !== resetPlacement) return { reset: { placement: resetPlacement } };
			}
			return {};
		}
	};
};
function getSideOffsets(overflow, rect) {
	return {
		top: overflow.top - rect.height,
		right: overflow.right - rect.width,
		bottom: overflow.bottom - rect.height,
		left: overflow.left - rect.width
	};
}
function isAnySideFullyClipped(overflow) {
	return sides.some((side) => overflow[side] >= 0);
}
/**
* Provides data to hide the floating element in applicable situations, such as
* when it is not in the same clipping context as the reference element.
* @see https://floating-ui.com/docs/hide
*/
var hide$3 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "hide",
		options,
		async fn(state) {
			const { rects, platform } = state;
			const { strategy = "referenceHidden", ...detectOverflowOptions } = evaluate(options, state);
			switch (strategy) {
				case "referenceHidden": {
					const offsets = getSideOffsets(await platform.detectOverflow(state, {
						...detectOverflowOptions,
						elementContext: "reference"
					}), rects.reference);
					return { data: {
						referenceHiddenOffsets: offsets,
						referenceHidden: isAnySideFullyClipped(offsets)
					} };
				}
				case "escaped": {
					const offsets = getSideOffsets(await platform.detectOverflow(state, {
						...detectOverflowOptions,
						altBoundary: true
					}), rects.floating);
					return { data: {
						escapedOffsets: offsets,
						escaped: isAnySideFullyClipped(offsets)
					} };
				}
				default: return {};
			}
		}
	};
};
var originSides = /*#__PURE__*/ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
	const { placement, platform, elements } = state;
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
	const side = getSide(placement);
	const alignment = getAlignment(placement);
	const isVertical = getSideAxis(placement) === "y";
	const mainAxisMulti = originSides.has(side) ? -1 : 1;
	const crossAxisMulti = rtl && isVertical ? -1 : 1;
	const rawValue = evaluate(options, state);
	let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === "number" ? {
		mainAxis: rawValue,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: rawValue.mainAxis || 0,
		crossAxis: rawValue.crossAxis || 0,
		alignmentAxis: rawValue.alignmentAxis
	};
	if (alignment && typeof alignmentAxis === "number") crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
	return isVertical ? {
		x: crossAxis * crossAxisMulti,
		y: mainAxis * mainAxisMulti
	} : {
		x: mainAxis * mainAxisMulti,
		y: crossAxis * crossAxisMulti
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset$2 = function(options) {
	if (options === void 0) options = 0;
	return {
		name: "offset",
		options,
		async fn(state) {
			var _middlewareData$offse, _middlewareData$arrow;
			const { x, y, placement, middlewareData } = state;
			const diffCoords = await convertValueToCoords(state, options);
			if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			return {
				x: x + diffCoords.x,
				y: y + diffCoords.y,
				data: {
					...diffCoords,
					placement
				}
			};
		}
	};
};
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "shift",
		options,
		async fn(state) {
			const { x, y, placement, platform } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = false, limiter = { fn: (_ref) => {
				let { x, y } = _ref;
				return {
					x,
					y
				};
			} }, ...detectOverflowOptions } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const crossAxis = getSideAxis(getSide(placement));
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			if (checkMainAxis) {
				const minSide = mainAxis === "y" ? "top" : "left";
				const maxSide = mainAxis === "y" ? "bottom" : "right";
				const min = mainAxisCoord + overflow[minSide];
				const max = mainAxisCoord - overflow[maxSide];
				mainAxisCoord = clamp(min, mainAxisCoord, max);
			}
			if (checkCrossAxis) {
				const minSide = crossAxis === "y" ? "top" : "left";
				const maxSide = crossAxis === "y" ? "bottom" : "right";
				const min = crossAxisCoord + overflow[minSide];
				const max = crossAxisCoord - overflow[maxSide];
				crossAxisCoord = clamp(min, crossAxisCoord, max);
			}
			const limitedCoords = limiter.fn({
				...state,
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			});
			return {
				...limitedCoords,
				data: {
					x: limitedCoords.x - x,
					y: limitedCoords.y - y,
					enabled: {
						[mainAxis]: checkMainAxis,
						[crossAxis]: checkCrossAxis
					}
				}
			};
		}
	};
};
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift$2 = function(options) {
	if (options === void 0) options = {};
	return {
		options,
		fn(state) {
			const { x, y, placement, rects, middlewareData } = state;
			const { offset = 0, mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const crossAxis = getSideAxis(placement);
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			const rawOffset = evaluate(offset, state);
			const computedOffset = typeof rawOffset === "number" ? {
				mainAxis: rawOffset,
				crossAxis: 0
			} : {
				mainAxis: 0,
				crossAxis: 0,
				...rawOffset
			};
			if (checkMainAxis) {
				const len = mainAxis === "y" ? "height" : "width";
				const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
				const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
				if (mainAxisCoord < limitMin) mainAxisCoord = limitMin;
				else if (mainAxisCoord > limitMax) mainAxisCoord = limitMax;
			}
			if (checkCrossAxis) {
				var _middlewareData$offse, _middlewareData$offse2;
				const len = mainAxis === "y" ? "width" : "height";
				const isOriginSide = originSides.has(getSide(placement));
				const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
				const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
				if (crossAxisCoord < limitMin) crossAxisCoord = limitMin;
				else if (crossAxisCoord > limitMax) crossAxisCoord = limitMax;
			}
			return {
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			};
		}
	};
};
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "size",
		options,
		async fn(state) {
			var _state$middlewareData, _state$middlewareData2;
			const { placement, rects, platform, elements } = state;
			const { apply = () => {}, ...detectOverflowOptions } = evaluate(options, state);
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const side = getSide(placement);
			const alignment = getAlignment(placement);
			const isYAxis = getSideAxis(placement) === "y";
			const { width, height } = rects.floating;
			let heightSide;
			let widthSide;
			if (side === "top" || side === "bottom") {
				heightSide = side;
				widthSide = alignment === (await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
			} else {
				widthSide = side;
				heightSide = alignment === "end" ? "top" : "bottom";
			}
			const maximumClippingHeight = height - overflow.top - overflow.bottom;
			const maximumClippingWidth = width - overflow.left - overflow.right;
			const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
			const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
			const noShift = !state.middlewareData.shift;
			let availableHeight = overflowAvailableHeight;
			let availableWidth = overflowAvailableWidth;
			if ((_state$middlewareData = state.middlewareData.shift) != null && _state$middlewareData.enabled.x) availableWidth = maximumClippingWidth;
			if ((_state$middlewareData2 = state.middlewareData.shift) != null && _state$middlewareData2.enabled.y) availableHeight = maximumClippingHeight;
			if (noShift && !alignment) {
				const xMin = max(overflow.left, 0);
				const xMax = max(overflow.right, 0);
				const yMin = max(overflow.top, 0);
				const yMax = max(overflow.bottom, 0);
				if (isYAxis) availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
				else availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
			}
			await apply({
				...state,
				availableWidth,
				availableHeight
			});
			const nextDimensions = await platform.getDimensions(elements.floating);
			if (width !== nextDimensions.width || height !== nextDimensions.height) return { reset: { rects: true } };
			return {};
		}
	};
};
//#endregion
//#region node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
	const css = getComputedStyle$1(element);
	let width = parseFloat(css.width) || 0;
	let height = parseFloat(css.height) || 0;
	const hasOffset = isHTMLElement(element);
	const offsetWidth = hasOffset ? element.offsetWidth : width;
	const offsetHeight = hasOffset ? element.offsetHeight : height;
	const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
	if (shouldFallback) {
		width = offsetWidth;
		height = offsetHeight;
	}
	return {
		width,
		height,
		$: shouldFallback
	};
}
function unwrapElement(element) {
	return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
	const domElement = unwrapElement(element);
	if (!isHTMLElement(domElement)) return createCoords(1);
	const rect = domElement.getBoundingClientRect();
	const { width, height, $ } = getCssDimensions(domElement);
	let x = ($ ? round(rect.width) : rect.width) / width;
	let y = ($ ? round(rect.height) : rect.height) / height;
	if (!x || !Number.isFinite(x)) x = 1;
	if (!y || !Number.isFinite(y)) y = 1;
	return {
		x,
		y
	};
}
var noOffsets = /*#__PURE__*/ createCoords(0);
function getVisualOffsets(element) {
	const win = getWindow(element);
	if (!isWebKit() || !win.visualViewport) return noOffsets;
	return {
		x: win.visualViewport.offsetLeft,
		y: win.visualViewport.offsetTop
	};
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
	if (isFixed === void 0) isFixed = false;
	if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) return false;
	return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
	if (includeScale === void 0) includeScale = false;
	if (isFixedStrategy === void 0) isFixedStrategy = false;
	const clientRect = element.getBoundingClientRect();
	const domElement = unwrapElement(element);
	let scale = createCoords(1);
	if (includeScale) if (offsetParent) {
		if (isElement(offsetParent)) scale = getScale(offsetParent);
	} else scale = getScale(element);
	const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
	let x = (clientRect.left + visualOffsets.x) / scale.x;
	let y = (clientRect.top + visualOffsets.y) / scale.y;
	let width = clientRect.width / scale.x;
	let height = clientRect.height / scale.y;
	if (domElement) {
		const win = getWindow(domElement);
		const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
		let currentWin = win;
		let currentIFrame = getFrameElement(currentWin);
		while (currentIFrame && offsetParent && offsetWin !== currentWin) {
			const iframeScale = getScale(currentIFrame);
			const iframeRect = currentIFrame.getBoundingClientRect();
			const css = getComputedStyle$1(currentIFrame);
			const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
			const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
			x *= iframeScale.x;
			y *= iframeScale.y;
			width *= iframeScale.x;
			height *= iframeScale.y;
			x += left;
			y += top;
			currentWin = getWindow(currentIFrame);
			currentIFrame = getFrameElement(currentWin);
		}
	}
	return rectToClientRect({
		width,
		height,
		x,
		y
	});
}
function getWindowScrollBarX(element, rect) {
	const leftScroll = getNodeScroll(element).scrollLeft;
	if (!rect) return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
	return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
	const htmlRect = documentElement.getBoundingClientRect();
	return {
		x: htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect),
		y: htmlRect.top + scroll.scrollTop
	};
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
	let { elements, rect, offsetParent, strategy } = _ref;
	const isFixed = strategy === "fixed";
	const documentElement = getDocumentElement(offsetParent);
	const topLayer = elements ? isTopLayer(elements.floating) : false;
	if (offsetParent === documentElement || topLayer && isFixed) return rect;
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	let scale = createCoords(1);
	const offsets = createCoords(0);
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent);
			scale = getScale(offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		}
	}
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		width: rect.width * scale.x,
		height: rect.height * scale.y,
		x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
		y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
	};
}
function getClientRects(element) {
	return Array.from(element.getClientRects());
}
function getDocumentRect(element) {
	const html = getDocumentElement(element);
	const scroll = getNodeScroll(element);
	const body = element.ownerDocument.body;
	const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
	const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
	let x = -scroll.scrollLeft + getWindowScrollBarX(element);
	const y = -scroll.scrollTop;
	if (getComputedStyle$1(body).direction === "rtl") x += max(html.clientWidth, body.clientWidth) - width;
	return {
		width,
		height,
		x,
		y
	};
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy) {
	const win = getWindow(element);
	const html = getDocumentElement(element);
	const visualViewport = win.visualViewport;
	let width = html.clientWidth;
	let height = html.clientHeight;
	let x = 0;
	let y = 0;
	if (visualViewport) {
		width = visualViewport.width;
		height = visualViewport.height;
		const visualViewportBased = isWebKit();
		if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
			x = visualViewport.offsetLeft;
			y = visualViewport.offsetTop;
		}
	}
	const windowScrollbarX = getWindowScrollBarX(html);
	if (windowScrollbarX <= 0) {
		const doc = html.ownerDocument;
		const body = doc.body;
		const bodyStyles = getComputedStyle(body);
		const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
		const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
		if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) width -= clippingStableScrollbarWidth;
	} else if (windowScrollbarX <= SCROLLBAR_MAX) width += windowScrollbarX;
	return {
		width,
		height,
		x,
		y
	};
}
function getInnerBoundingClientRect(element, strategy) {
	const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
	const top = clientRect.top + element.clientTop;
	const left = clientRect.left + element.clientLeft;
	const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
	return {
		width: element.clientWidth * scale.x,
		height: element.clientHeight * scale.y,
		x: left * scale.x,
		y: top * scale.y
	};
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
	let rect;
	if (clippingAncestor === "viewport") rect = getViewportRect(element, strategy);
	else if (clippingAncestor === "document") rect = getDocumentRect(getDocumentElement(element));
	else if (isElement(clippingAncestor)) rect = getInnerBoundingClientRect(clippingAncestor, strategy);
	else {
		const visualOffsets = getVisualOffsets(element);
		rect = {
			x: clippingAncestor.x - visualOffsets.x,
			y: clippingAncestor.y - visualOffsets.y,
			width: clippingAncestor.width,
			height: clippingAncestor.height
		};
	}
	return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
	const parentNode = getParentNode(element);
	if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) return false;
	return getComputedStyle$1(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
	const cachedResult = cache.get(element);
	if (cachedResult) return cachedResult;
	let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
	let currentContainingBlockComputedStyle = null;
	const elementIsFixed = getComputedStyle$1(element).position === "fixed";
	let currentNode = elementIsFixed ? getParentNode(element) : element;
	while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
		const computedStyle = getComputedStyle$1(currentNode);
		const currentNodeIsContaining = isContainingBlock(currentNode);
		if (!currentNodeIsContaining && computedStyle.position === "fixed") currentContainingBlockComputedStyle = null;
		if (elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && (currentContainingBlockComputedStyle.position === "absolute" || currentContainingBlockComputedStyle.position === "fixed") || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode)) result = result.filter((ancestor) => ancestor !== currentNode);
		else currentContainingBlockComputedStyle = computedStyle;
		currentNode = getParentNode(currentNode);
	}
	cache.set(element, result);
	return result;
}
function getClippingRect(_ref) {
	let { element, boundary, rootBoundary, strategy } = _ref;
	const clippingAncestors = [...boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary), rootBoundary];
	const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
	let top = firstRect.top;
	let right = firstRect.right;
	let bottom = firstRect.bottom;
	let left = firstRect.left;
	for (let i = 1; i < clippingAncestors.length; i++) {
		const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
		top = max(rect.top, top);
		right = min(rect.right, right);
		bottom = min(rect.bottom, bottom);
		left = max(rect.left, left);
	}
	return {
		width: right - left,
		height: bottom - top,
		x: left,
		y: top
	};
}
function getDimensions(element) {
	const { width, height } = getCssDimensions(element);
	return {
		width,
		height
	};
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	const documentElement = getDocumentElement(offsetParent);
	const isFixed = strategy === "fixed";
	const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	const offsets = createCoords(0);
	function setLeftRTLScrollbarOffset() {
		offsets.x = getWindowScrollBarX(documentElement);
	}
	if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		} else if (documentElement) setLeftRTLScrollbarOffset();
	}
	if (isFixed && !isOffsetParentAnElement && documentElement) setLeftRTLScrollbarOffset();
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		x: rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x,
		y: rect.top + scroll.scrollTop - offsets.y - htmlOffset.y,
		width: rect.width,
		height: rect.height
	};
}
function isStaticPositioned(element) {
	return getComputedStyle$1(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
	if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") return null;
	if (polyfill) return polyfill(element);
	let rawOffsetParent = element.offsetParent;
	if (getDocumentElement(element) === rawOffsetParent) rawOffsetParent = rawOffsetParent.ownerDocument.body;
	return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
	const win = getWindow(element);
	if (isTopLayer(element)) return win;
	if (!isHTMLElement(element)) {
		let svgOffsetParent = getParentNode(element);
		while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
			if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) return svgOffsetParent;
			svgOffsetParent = getParentNode(svgOffsetParent);
		}
		return win;
	}
	let offsetParent = getTrueOffsetParent(element, polyfill);
	while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) offsetParent = getTrueOffsetParent(offsetParent, polyfill);
	if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) return win;
	return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
	const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
	const getDimensionsFn = this.getDimensions;
	const floatingDimensions = await getDimensionsFn(data.floating);
	return {
		reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
		floating: {
			x: 0,
			y: 0,
			width: floatingDimensions.width,
			height: floatingDimensions.height
		}
	};
};
function isRTL(element) {
	return getComputedStyle$1(element).direction === "rtl";
}
var platform = {
	convertOffsetParentRelativeRectToViewportRelativeRect,
	getDocumentElement,
	getClippingRect,
	getOffsetParent,
	getElementRects,
	getClientRects,
	getDimensions,
	getScale,
	isElement,
	isRTL
};
function rectsAreEqual(a, b) {
	return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove) {
	let io = null;
	let timeoutId;
	const root = getDocumentElement(element);
	function cleanup() {
		var _io;
		clearTimeout(timeoutId);
		(_io = io) == null || _io.disconnect();
		io = null;
	}
	function refresh(skip, threshold) {
		if (skip === void 0) skip = false;
		if (threshold === void 0) threshold = 1;
		cleanup();
		const elementRectForRootMargin = element.getBoundingClientRect();
		const { left, top, width, height } = elementRectForRootMargin;
		if (!skip) onMove();
		if (!width || !height) return;
		const insetTop = floor(top);
		const insetRight = floor(root.clientWidth - (left + width));
		const insetBottom = floor(root.clientHeight - (top + height));
		const insetLeft = floor(left);
		const options = {
			rootMargin: -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px",
			threshold: max(0, min(1, threshold)) || 1
		};
		let isFirstUpdate = true;
		function handleObserve(entries) {
			const ratio = entries[0].intersectionRatio;
			if (ratio !== threshold) {
				if (!isFirstUpdate) return refresh();
				if (!ratio) timeoutId = setTimeout(() => {
					refresh(false, 1e-7);
				}, 1e3);
				else refresh(false, ratio);
			}
			if (ratio === 1 && !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) refresh();
			isFirstUpdate = false;
		}
		try {
			io = new IntersectionObserver(handleObserve, {
				...options,
				root: root.ownerDocument
			});
		} catch (_e) {
			io = new IntersectionObserver(handleObserve, options);
		}
		io.observe(element);
	}
	refresh(true);
	return cleanup;
}
/**
* Automatically updates the position of the floating element when necessary.
* Should only be called when the floating element is mounted on the DOM or
* visible on the screen.
* @returns cleanup function that should be invoked when the floating element is
* removed from the DOM or hidden from the screen.
* @see https://floating-ui.com/docs/autoUpdate
*/
function autoUpdate(reference, floating, update, options) {
	if (options === void 0) options = {};
	const { ancestorScroll = true, ancestorResize = true, elementResize = typeof ResizeObserver === "function", layoutShift = typeof IntersectionObserver === "function", animationFrame = false } = options;
	const referenceEl = unwrapElement(reference);
	const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
	ancestors.forEach((ancestor) => {
		ancestorScroll && ancestor.addEventListener("scroll", update, { passive: true });
		ancestorResize && ancestor.addEventListener("resize", update);
	});
	const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
	let reobserveFrame = -1;
	let resizeObserver = null;
	if (elementResize) {
		resizeObserver = new ResizeObserver((_ref) => {
			let [firstEntry] = _ref;
			if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
				resizeObserver.unobserve(floating);
				cancelAnimationFrame(reobserveFrame);
				reobserveFrame = requestAnimationFrame(() => {
					var _resizeObserver;
					(_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
				});
			}
			update();
		});
		if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl);
		if (floating) resizeObserver.observe(floating);
	}
	let frameId;
	let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
	if (animationFrame) frameLoop();
	function frameLoop() {
		const nextRefRect = getBoundingClientRect(reference);
		if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) update();
		prevRefRect = nextRefRect;
		frameId = requestAnimationFrame(frameLoop);
	}
	update();
	return () => {
		var _resizeObserver2;
		ancestors.forEach((ancestor) => {
			ancestorScroll && ancestor.removeEventListener("scroll", update);
			ancestorResize && ancestor.removeEventListener("resize", update);
		});
		cleanupIo?.();
		(_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
		resizeObserver = null;
		if (animationFrame) cancelAnimationFrame(frameId);
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset$1 = offset$2;
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift$1 = shift$2;
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip$1 = flip$2;
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size$1 = size$2;
/**
* Provides data to hide the floating element in applicable situations, such as
* when it is not in the same clipping context as the reference element.
* @see https://floating-ui.com/docs/hide
*/
var hide$2 = hide$3;
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift$1 = limitShift$2;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*/
var computePosition = (reference, floating, options) => {
	const cache = /* @__PURE__ */ new Map();
	const mergedOptions = {
		platform,
		...options
	};
	const platformWithCache = {
		...mergedOptions.platform,
		_c: cache
	};
	return computePosition$1(reference, floating, {
		...mergedOptions,
		platform: platformWithCache
	});
};
//#endregion
//#region node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var index = typeof document !== "undefined" ? import_react.useLayoutEffect : function noop() {};
function deepEqual(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a === "function" && a.toString() === b.toString()) return true;
	let length;
	let i;
	let keys;
	if (a && b && typeof a === "object") {
		if (Array.isArray(a)) {
			length = a.length;
			if (length !== b.length) return false;
			for (i = length; i-- !== 0;) if (!deepEqual(a[i], b[i])) return false;
			return true;
		}
		keys = Object.keys(a);
		length = keys.length;
		if (length !== Object.keys(b).length) return false;
		for (i = length; i-- !== 0;) if (!{}.hasOwnProperty.call(b, keys[i])) return false;
		for (i = length; i-- !== 0;) {
			const key = keys[i];
			if (key === "_owner" && a.$$typeof) continue;
			if (!deepEqual(a[key], b[key])) return false;
		}
		return true;
	}
	return a !== a && b !== b;
}
function getDPR(element) {
	if (typeof window === "undefined") return 1;
	return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function roundByDPR(element, value) {
	const dpr = getDPR(element);
	return Math.round(value * dpr) / dpr;
}
function useLatestRef(value) {
	const ref = import_react.useRef(value);
	index(() => {
		ref.current = value;
	});
	return ref;
}
/**
* Provides data to position a floating element.
* @see https://floating-ui.com/docs/useFloating
*/
function useFloating$1(options) {
	if (options === void 0) options = {};
	const { placement = "bottom", strategy = "absolute", middleware = [], platform, elements: { reference: externalReference, floating: externalFloating } = {}, transform = true, whileElementsMounted, open } = options;
	const [data, setData] = import_react.useState({
		x: 0,
		y: 0,
		strategy,
		placement,
		middlewareData: {},
		isPositioned: false
	});
	const [latestMiddleware, setLatestMiddleware] = import_react.useState(middleware);
	if (!deepEqual(latestMiddleware, middleware)) setLatestMiddleware(middleware);
	const [_reference, _setReference] = import_react.useState(null);
	const [_floating, _setFloating] = import_react.useState(null);
	const setReference = import_react.useCallback((node) => {
		if (node !== referenceRef.current) {
			referenceRef.current = node;
			_setReference(node);
		}
	}, []);
	const setFloating = import_react.useCallback((node) => {
		if (node !== floatingRef.current) {
			floatingRef.current = node;
			_setFloating(node);
		}
	}, []);
	const referenceEl = externalReference || _reference;
	const floatingEl = externalFloating || _floating;
	const referenceRef = import_react.useRef(null);
	const floatingRef = import_react.useRef(null);
	const dataRef = import_react.useRef(data);
	const hasWhileElementsMounted = whileElementsMounted != null;
	const whileElementsMountedRef = useLatestRef(whileElementsMounted);
	const platformRef = useLatestRef(platform);
	const openRef = useLatestRef(open);
	const update = import_react.useCallback(() => {
		if (!referenceRef.current || !floatingRef.current) return;
		const config = {
			placement,
			strategy,
			middleware: latestMiddleware
		};
		if (platformRef.current) config.platform = platformRef.current;
		computePosition(referenceRef.current, floatingRef.current, config).then((data) => {
			const fullData = {
				...data,
				isPositioned: openRef.current !== false
			};
			if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
				dataRef.current = fullData;
				import_react_dom.flushSync(() => {
					setData(fullData);
				});
			}
		});
	}, [
		latestMiddleware,
		placement,
		strategy,
		platformRef,
		openRef
	]);
	index(() => {
		if (open === false && dataRef.current.isPositioned) {
			dataRef.current.isPositioned = false;
			setData((data) => ({
				...data,
				isPositioned: false
			}));
		}
	}, [open]);
	const isMountedRef = import_react.useRef(false);
	index(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	index(() => {
		if (referenceEl) referenceRef.current = referenceEl;
		if (floatingEl) floatingRef.current = floatingEl;
		if (referenceEl && floatingEl) {
			if (whileElementsMountedRef.current) return whileElementsMountedRef.current(referenceEl, floatingEl, update);
			update();
		}
	}, [
		referenceEl,
		floatingEl,
		update,
		whileElementsMountedRef,
		hasWhileElementsMounted
	]);
	const refs = import_react.useMemo(() => ({
		reference: referenceRef,
		floating: floatingRef,
		setReference,
		setFloating
	}), [setReference, setFloating]);
	const elements = import_react.useMemo(() => ({
		reference: referenceEl,
		floating: floatingEl
	}), [referenceEl, floatingEl]);
	const floatingStyles = import_react.useMemo(() => {
		const initialStyles = {
			position: strategy,
			left: 0,
			top: 0
		};
		if (!elements.floating) return initialStyles;
		const x = roundByDPR(elements.floating, data.x);
		const y = roundByDPR(elements.floating, data.y);
		if (transform) return {
			...initialStyles,
			transform: "translate(" + x + "px, " + y + "px)",
			...getDPR(elements.floating) >= 1.5 && { willChange: "transform" }
		};
		return {
			position: strategy,
			left: x,
			top: y
		};
	}, [
		strategy,
		transform,
		elements.floating,
		data.x,
		data.y
	]);
	return import_react.useMemo(() => ({
		...data,
		update,
		refs,
		elements,
		floatingStyles
	}), [
		data,
		update,
		refs,
		elements,
		floatingStyles
	]);
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset = (options, deps) => {
	const result = offset$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift = (options, deps) => {
	const result = shift$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift = (options, deps) => {
	return {
		fn: limitShift$1(options).fn,
		options: [options, deps]
	};
};
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip = (options, deps) => {
	const result = flip$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size = (options, deps) => {
	const result = size$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Provides data to hide the floating element in applicable situations, such as
* when it is not in the same clipping context as the reference element.
* @see https://floating-ui.com/docs/hide
*/
var hide$1 = (options, deps) => {
	const result = hide$2(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useFloatingRootContext.js
function useFloatingRootContext(options) {
	const { open = false, onOpenChange, elements = {} } = options;
	const floatingId = useId();
	const nested = useFloatingParentNodeId() != null;
	{
		const optionDomReference = elements.reference;
		if (optionDomReference && !isElement(optionDomReference)) console.error("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `context.setPositionReference()`", "instead.");
	}
	const store = useRefWithInit(() => new FloatingRootStore({
		open,
		transitionStatus: void 0,
		onOpenChange,
		referenceElement: elements.reference ?? null,
		floatingElement: elements.floating ?? null,
		triggerElements: new PopupTriggerMap(),
		floatingId,
		syncOnly: false,
		nested
	})).current;
	useIsoLayoutEffect(() => {
		const valuesToSync = {
			open,
			floatingId
		};
		if (elements.reference !== void 0) {
			valuesToSync.referenceElement = elements.reference;
			valuesToSync.domReferenceElement = isElement(elements.reference) ? elements.reference : null;
		}
		if (elements.floating !== void 0) valuesToSync.floatingElement = elements.floating;
		store.update(valuesToSync);
	}, [
		open,
		floatingId,
		elements.reference,
		elements.floating,
		store
	]);
	store.context.onOpenChange = onOpenChange;
	store.context.nested = nested;
	return store;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useFloating.js
/**
* Provides data to position a floating element and context to add interactions.
* @see https://floating-ui.com/docs/useFloating
*/
function useFloating(options = {}) {
	const { nodeId, externalTree } = options;
	const internalStore = useFloatingRootContext(options);
	const store = options.rootContext || internalStore;
	const referenceElement = store.useState("referenceElement");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const open = store.useState("open");
	const floatingId = store.useState("floatingId");
	const [positionReference, setPositionReferenceRaw] = import_react.useState(null);
	const [localDomReference, setLocalDomReference] = import_react.useState(void 0);
	const [localFloatingElement, setLocalFloatingElement] = import_react.useState(void 0);
	const domReferenceRef = import_react.useRef(null);
	const tree = useFloatingTree(externalTree);
	const storeElements = import_react.useMemo(() => ({
		reference: referenceElement,
		floating: floatingElement,
		domReference: domReferenceElement
	}), [
		referenceElement,
		floatingElement,
		domReferenceElement
	]);
	const position = useFloating$1({
		...options,
		elements: {
			...storeElements,
			...positionReference && { reference: positionReference }
		}
	});
	const localDomReferenceElement = isElement(localDomReference) ? localDomReference : null;
	const syncedFloatingElement = localFloatingElement === void 0 ? store.state.floatingElement : localFloatingElement;
	store.useSyncedValue("referenceElement", localDomReference ?? null);
	store.useSyncedValue("domReferenceElement", localDomReference === void 0 ? domReferenceElement : localDomReferenceElement);
	store.useSyncedValue("floatingElement", syncedFloatingElement);
	const setPositionReference = import_react.useCallback((node) => {
		const computedPositionReference = isElement(node) ? {
			getBoundingClientRect: () => node.getBoundingClientRect(),
			getClientRects: () => node.getClientRects(),
			contextElement: node
		} : node;
		setPositionReferenceRaw(computedPositionReference);
		position.refs.setReference(computedPositionReference);
	}, [position.refs]);
	const setReference = import_react.useCallback((node) => {
		if (isElement(node) || node === null) {
			domReferenceRef.current = node;
			setLocalDomReference(node);
		}
		if (isElement(position.refs.reference.current) || position.refs.reference.current === null || node !== null && !isElement(node)) position.refs.setReference(node);
	}, [position.refs, setLocalDomReference]);
	const setFloating = import_react.useCallback((node) => {
		setLocalFloatingElement(node);
		position.refs.setFloating(node);
	}, [position.refs]);
	const refs = import_react.useMemo(() => ({
		...position.refs,
		setReference,
		setFloating,
		setPositionReference,
		domReference: domReferenceRef
	}), [
		position.refs,
		setReference,
		setFloating,
		setPositionReference
	]);
	const elements = import_react.useMemo(() => ({
		...position.elements,
		domReference: domReferenceElement
	}), [position.elements, domReferenceElement]);
	const context = import_react.useMemo(() => ({
		...position,
		dataRef: store.context.dataRef,
		open,
		onOpenChange: store.setOpen,
		events: store.context.events,
		floatingId,
		refs,
		elements,
		nodeId,
		rootStore: store
	}), [
		position,
		refs,
		elements,
		nodeId,
		store,
		open,
		floatingId
	]);
	useIsoLayoutEffect(() => {
		if (domReferenceElement) domReferenceRef.current = domReferenceElement;
	}, [domReferenceElement]);
	useIsoLayoutEffect(() => {
		store.context.dataRef.current.floatingContext = context;
		const node = tree?.nodesRef.current.find((n) => n.id === nodeId);
		if (node) node.context = context;
	});
	return import_react.useMemo(() => ({
		...position,
		context,
		refs,
		elements,
		rootStore: store
	}), [
		position,
		refs,
		elements,
		context,
		store
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useListNavigation.js
var ESCAPE = "Escape";
function doSwitch(orientation, vertical, horizontal) {
	switch (orientation) {
		case "vertical": return vertical;
		case "horizontal": return horizontal;
		default: return vertical || horizontal;
	}
}
function isMainOrientationKey(key, orientation) {
	return doSwitch(orientation, key === "ArrowUp" || key === "ArrowDown", key === "ArrowLeft" || key === "ArrowRight");
}
function isMainOrientationToEndKey(key, orientation, rtl) {
	return doSwitch(orientation, key === "ArrowDown", rtl ? key === "ArrowLeft" : key === "ArrowRight") || key === "Enter" || key === " " || key === "";
}
function isCrossOrientationOpenKey(key, orientation, rtl) {
	return doSwitch(orientation, rtl ? key === ARROW_LEFT : key === ARROW_RIGHT, key === ARROW_DOWN);
}
function isCrossOrientationCloseKey(key, orientation, rtl, cols) {
	const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT;
	const horizontal = key === ARROW_UP;
	if (orientation === "both" || orientation === "horizontal" && cols && cols > 1) return key === ESCAPE;
	return doSwitch(orientation, vertical, horizontal);
}
/**
* Adds arrow key-based navigation of a list of items, either using real DOM
* focus or virtual focus.
* @see https://floating-ui.com/docs/useListNavigation
*/
function useListNavigation(context, props) {
	const { listRef, activeIndex, onNavigate: onNavigateProp = () => {}, enabled = true, selectedIndex = null, allowEscape = false, loopFocus = false, nested = false, rtl = false, virtual = false, focusItemOnOpen = "auto", focusItemOnHover = true, openOnArrowKeyDown = true, disabledIndices = void 0, orientation = "vertical", parentOrientation, cols = 1, id, resetOnPointerLeave = true, externalTree } = props;
	if (allowEscape) {
		if (!loopFocus) console.warn("`useListNavigation` looping must be enabled to allow escaping.");
		if (!virtual) console.warn("`useListNavigation` must be virtual to allow escaping.");
	}
	if (orientation === "vertical" && cols > 1) console.warn("In grid list navigation mode (`cols` > 1), the `orientation` should", "be either \"horizontal\" or \"both\".");
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const dataRef = store.context.dataRef;
	const floatingFocusElement = getFloatingFocusElement(floatingElement);
	const typeableComboboxReference = isTypeableCombobox(domReferenceElement);
	const floatingFocusElementRef = useValueAsRef(floatingFocusElement);
	const parentId = useFloatingParentNodeId();
	const tree = useFloatingTree(externalTree);
	const focusItemOnOpenRef = import_react.useRef(focusItemOnOpen);
	const indexRef = import_react.useRef(selectedIndex ?? -1);
	const keyRef = import_react.useRef(null);
	const isPointerModalityRef = import_react.useRef(true);
	const onNavigate = useStableCallback((event) => {
		onNavigateProp(indexRef.current === -1 ? null : indexRef.current, event);
	});
	const previousOnNavigateRef = import_react.useRef(onNavigate);
	const previousMountedRef = import_react.useRef(!!floatingElement);
	const previousOpenRef = import_react.useRef(open);
	const forceSyncFocusRef = import_react.useRef(false);
	const forceScrollIntoViewRef = import_react.useRef(false);
	const cancelQueuedFocusRef = import_react.useRef(null);
	const disabledIndicesRef = useValueAsRef(disabledIndices);
	const latestOpenRef = useValueAsRef(open);
	const selectedIndexRef = useValueAsRef(selectedIndex);
	const resetOnPointerLeaveRef = useValueAsRef(resetOnPointerLeave);
	const focusFrame = useAnimationFrame();
	const waitForListPopulatedFrame = useAnimationFrame();
	const focusItem = useStableCallback(() => {
		function runFocus(item) {
			if (virtual) tree?.events.emit("virtualfocus", item);
			else cancelQueuedFocusRef.current = enqueueFocus(item, {
				sync: forceSyncFocusRef.current,
				preventScroll: true
			});
		}
		const initialItem = listRef.current[indexRef.current];
		const forceScrollIntoView = forceScrollIntoViewRef.current;
		if (initialItem) runFocus(initialItem);
		(forceSyncFocusRef.current ? (callback) => callback() : (callback) => focusFrame.request(callback))(() => {
			const waitedItem = listRef.current[indexRef.current] || initialItem;
			if (!waitedItem) return;
			if (!initialItem) runFocus(waitedItem);
			if (item && (forceScrollIntoView || !isPointerModalityRef.current)) waitedItem.scrollIntoView?.({
				block: "nearest",
				inline: "nearest"
			});
		});
	});
	useIsoLayoutEffect(() => {
		dataRef.current.orientation = orientation;
	}, [dataRef, orientation]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (open && floatingElement) {
			indexRef.current = selectedIndex ?? -1;
			if (focusItemOnOpenRef.current && selectedIndex != null) {
				forceScrollIntoViewRef.current = true;
				onNavigate();
			}
		} else if (previousMountedRef.current) {
			indexRef.current = -1;
			previousOnNavigateRef.current();
		}
	}, [
		enabled,
		open,
		floatingElement,
		selectedIndex,
		onNavigate
	]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (!open) {
			forceSyncFocusRef.current = false;
			return;
		}
		if (!floatingElement) return;
		if (activeIndex == null) {
			forceSyncFocusRef.current = false;
			if (selectedIndexRef.current != null) return;
			if (previousMountedRef.current) {
				indexRef.current = -1;
				focusItem();
			}
			if ((!previousOpenRef.current || !previousMountedRef.current) && focusItemOnOpenRef.current && (keyRef.current != null || focusItemOnOpenRef.current === true && keyRef.current == null)) {
				let runs = 0;
				const waitForListPopulated = () => {
					if (listRef.current[0] == null) {
						if (runs < 2) (runs ? (callback) => waitForListPopulatedFrame.request(callback) : queueMicrotask)(waitForListPopulated);
						runs += 1;
					} else {
						indexRef.current = keyRef.current == null || isMainOrientationToEndKey(keyRef.current, orientation, rtl) || nested ? getMinListIndex(listRef) : getMaxListIndex(listRef);
						keyRef.current = null;
						onNavigate();
					}
				};
				waitForListPopulated();
			}
		} else if (!isIndexOutOfListBounds(listRef.current, activeIndex)) {
			indexRef.current = activeIndex;
			focusItem();
			forceScrollIntoViewRef.current = false;
		}
	}, [
		enabled,
		open,
		floatingElement,
		activeIndex,
		selectedIndexRef,
		nested,
		listRef,
		orientation,
		rtl,
		onNavigate,
		focusItem,
		waitForListPopulatedFrame
	]);
	useIsoLayoutEffect(() => {
		if (!enabled || floatingElement || !tree || virtual || !previousMountedRef.current) return;
		const nodes = tree.nodesRef.current;
		const parent = nodes.find((node) => node.id === parentId)?.context?.elements.floating;
		const activeEl = activeElement(ownerDocument(floatingElement));
		const treeContainsActiveEl = nodes.some((node) => node.context && contains(node.context.elements.floating, activeEl));
		if (parent && !treeContainsActiveEl && isPointerModalityRef.current) parent.focus({ preventScroll: true });
	}, [
		enabled,
		floatingElement,
		tree,
		parentId,
		virtual
	]);
	useIsoLayoutEffect(() => {
		previousOnNavigateRef.current = onNavigate;
		previousOpenRef.current = open;
		previousMountedRef.current = !!floatingElement;
	});
	useIsoLayoutEffect(() => {
		if (!open) {
			keyRef.current = null;
			focusItemOnOpenRef.current = focusItemOnOpen;
		}
	}, [open, focusItemOnOpen]);
	const hasActiveIndex = activeIndex != null;
	const syncCurrentTarget = useStableCallback((event) => {
		if (!latestOpenRef.current) return;
		const index = listRef.current.indexOf(event.currentTarget);
		if (index !== -1 && (indexRef.current !== index || activeIndex !== index)) {
			indexRef.current = index;
			onNavigate(event);
		}
	});
	const getParentOrientation = useStableCallback(() => {
		return parentOrientation ?? tree?.nodesRef.current.find((node) => node.id === parentId)?.context?.dataRef?.current.orientation;
	});
	const getMinEnabledIndex = useStableCallback(() => {
		return getMinListIndex(listRef, disabledIndicesRef.current);
	});
	const commonOnKeyDown = useStableCallback((event) => {
		isPointerModalityRef.current = false;
		forceSyncFocusRef.current = true;
		if (event.which === 229) return;
		if (!latestOpenRef.current && event.currentTarget === floatingFocusElementRef.current) return;
		if (nested && isCrossOrientationCloseKey(event.key, orientation, rtl, cols)) {
			if (!isMainOrientationKey(event.key, getParentOrientation())) stopEvent(event);
			store.setOpen(false, createChangeEventDetails(listNavigation, event.nativeEvent));
			if (isHTMLElement(domReferenceElement)) if (virtual) tree?.events.emit("virtualfocus", domReferenceElement);
			else domReferenceElement.focus();
			return;
		}
		const currentIndex = indexRef.current;
		const minIndex = getMinListIndex(listRef, disabledIndices);
		const maxIndex = getMaxListIndex(listRef, disabledIndices);
		if (!typeableComboboxReference) {
			if (event.key === "Home") {
				stopEvent(event);
				indexRef.current = minIndex;
				onNavigate(event);
			}
			if (event.key === "End") {
				stopEvent(event);
				indexRef.current = maxIndex;
				onNavigate(event);
			}
		}
		if (cols > 1) {
			const sizes = Array.from({ length: listRef.current.length }, () => ({
				width: 1,
				height: 1
			}));
			const cellMap = createGridCellMap(sizes, cols, false);
			const minGridIndex = cellMap.findIndex((index) => index != null && !isListIndexDisabled(listRef.current, index, disabledIndices));
			const maxGridIndex = cellMap.reduce((foundIndex, index, cellIndex) => index != null && !isListIndexDisabled(listRef.current, index, disabledIndices) ? cellIndex : foundIndex, -1);
			const index = cellMap[getGridNavigatedIndex(cellMap.map((itemIndex) => itemIndex != null ? listRef.current[itemIndex] : null), {
				event,
				orientation,
				loopFocus,
				rtl,
				cols,
				disabledIndices: getGridCellIndices([...(typeof disabledIndices !== "function" ? disabledIndices : null) || listRef.current.map((_, listIndex) => isListIndexDisabled(listRef.current, listIndex, disabledIndices) ? listIndex : void 0), void 0], cellMap),
				minIndex: minGridIndex,
				maxIndex: maxGridIndex,
				prevIndex: getGridCellIndexOfCorner(indexRef.current > maxIndex ? minIndex : indexRef.current, sizes, cellMap, cols, event.key === "ArrowDown" ? "bl" : event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? "tr" : "tl"),
				stopEvent: true
			})];
			if (index != null) {
				indexRef.current = index;
				onNavigate(event);
			}
			if (orientation === "both") return;
		}
		if (isMainOrientationKey(event.key, orientation)) {
			stopEvent(event);
			if (open && !virtual && activeElement(event.currentTarget.ownerDocument) === event.currentTarget) {
				indexRef.current = isMainOrientationToEndKey(event.key, orientation, rtl) ? minIndex : maxIndex;
				onNavigate(event);
				return;
			}
			if (isMainOrientationToEndKey(event.key, orientation, rtl)) if (loopFocus) if (currentIndex >= maxIndex) if (allowEscape && currentIndex !== listRef.current.length) indexRef.current = -1;
			else {
				forceSyncFocusRef.current = false;
				indexRef.current = minIndex;
			}
			else indexRef.current = findNonDisabledListIndex(listRef.current, {
				startingIndex: currentIndex,
				disabledIndices
			});
			else indexRef.current = Math.min(maxIndex, findNonDisabledListIndex(listRef.current, {
				startingIndex: currentIndex,
				disabledIndices
			}));
			else if (loopFocus) if (currentIndex <= minIndex) if (allowEscape && currentIndex !== -1) indexRef.current = listRef.current.length;
			else {
				forceSyncFocusRef.current = false;
				indexRef.current = maxIndex;
			}
			else indexRef.current = findNonDisabledListIndex(listRef.current, {
				startingIndex: currentIndex,
				decrement: true,
				disabledIndices
			});
			else indexRef.current = Math.max(minIndex, findNonDisabledListIndex(listRef.current, {
				startingIndex: currentIndex,
				decrement: true,
				disabledIndices
			}));
			if (isIndexOutOfListBounds(listRef.current, indexRef.current)) indexRef.current = -1;
			onNavigate(event);
		}
	});
	const item = import_react.useMemo(() => {
		return {
			onFocus(event) {
				forceSyncFocusRef.current = true;
				syncCurrentTarget(event);
			},
			onClick: ({ currentTarget }) => currentTarget.focus({ preventScroll: true }),
			onMouseMove(event) {
				forceSyncFocusRef.current = true;
				forceScrollIntoViewRef.current = false;
				if (focusItemOnHover) syncCurrentTarget(event);
			},
			onPointerLeave(event) {
				if (!latestOpenRef.current || !isPointerModalityRef.current || event.pointerType === "touch") return;
				forceSyncFocusRef.current = true;
				const relatedTarget = event.relatedTarget;
				if (!focusItemOnHover || listRef.current.includes(relatedTarget)) return;
				if (!resetOnPointerLeaveRef.current) return;
				cancelQueuedFocusRef.current?.();
				cancelQueuedFocusRef.current = null;
				indexRef.current = -1;
				onNavigate(event);
				if (!virtual) {
					const floatingFocusEl = floatingFocusElementRef.current;
					const activeEl = activeElement(ownerDocument(floatingFocusEl));
					if (floatingFocusEl && contains(floatingFocusEl, activeEl)) floatingFocusEl.focus({ preventScroll: true });
				}
			}
		};
	}, [
		syncCurrentTarget,
		latestOpenRef,
		floatingFocusElementRef,
		focusItemOnHover,
		listRef,
		onNavigate,
		resetOnPointerLeaveRef,
		virtual
	]);
	const ariaActiveDescendantProp = import_react.useMemo(() => {
		return virtual && open && hasActiveIndex && { "aria-activedescendant": `${id}-${activeIndex}` };
	}, [
		virtual,
		open,
		hasActiveIndex,
		id,
		activeIndex
	]);
	const floating = import_react.useMemo(() => {
		return {
			"aria-orientation": orientation === "both" ? void 0 : orientation,
			...!typeableComboboxReference ? ariaActiveDescendantProp : {},
			onKeyDown(event) {
				if (event.key === "Tab" && event.shiftKey && open && !virtual) {
					const target = getTarget(event.nativeEvent);
					if (target && !contains(floatingFocusElementRef.current, target)) return;
					stopEvent(event);
					store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent));
					if (isHTMLElement(domReferenceElement)) domReferenceElement.focus();
					return;
				}
				commonOnKeyDown(event);
			},
			onPointerMove() {
				isPointerModalityRef.current = true;
			}
		};
	}, [
		ariaActiveDescendantProp,
		commonOnKeyDown,
		floatingFocusElementRef,
		orientation,
		typeableComboboxReference,
		store,
		open,
		virtual,
		domReferenceElement
	]);
	const trigger = import_react.useMemo(() => {
		function openOnNavigationKeyDown(event) {
			store.setOpen(true, createChangeEventDetails(listNavigation, event.nativeEvent, event.currentTarget));
		}
		function checkVirtualMouse(event) {
			if (focusItemOnOpen === "auto" && isVirtualClick(event.nativeEvent)) focusItemOnOpenRef.current = !virtual;
		}
		function checkVirtualPointer(event) {
			focusItemOnOpenRef.current = focusItemOnOpen;
			if (focusItemOnOpen === "auto" && isVirtualPointerEvent(event.nativeEvent)) focusItemOnOpenRef.current = true;
		}
		return {
			onKeyDown(event) {
				const currentOpen = store.select("open");
				isPointerModalityRef.current = false;
				const isArrowKey = event.key.startsWith("Arrow");
				const isParentCrossOpenKey = isCrossOrientationOpenKey(event.key, getParentOrientation(), rtl);
				const isMainKey = isMainOrientationKey(event.key, orientation);
				const isNavigationKey = (nested ? isParentCrossOpenKey : isMainKey) || event.key === "Enter" || event.key.trim() === "";
				if (virtual && currentOpen) return commonOnKeyDown(event);
				if (!currentOpen && !openOnArrowKeyDown && isArrowKey) return;
				if (isNavigationKey) {
					const isParentMainKey = isMainOrientationKey(event.key, getParentOrientation());
					keyRef.current = nested && isParentMainKey ? null : event.key;
				}
				if (nested) {
					if (isParentCrossOpenKey) {
						stopEvent(event);
						if (currentOpen) {
							indexRef.current = getMinEnabledIndex();
							onNavigate(event);
						} else openOnNavigationKeyDown(event);
					}
					return;
				}
				if (isMainKey) {
					if (selectedIndexRef.current != null) indexRef.current = selectedIndexRef.current;
					stopEvent(event);
					if (!currentOpen && openOnArrowKeyDown) openOnNavigationKeyDown(event);
					else commonOnKeyDown(event);
					if (currentOpen) onNavigate(event);
				}
			},
			onFocus(event) {
				if (store.select("open") && !virtual) {
					indexRef.current = -1;
					onNavigate(event);
				}
			},
			onPointerDown: checkVirtualPointer,
			onPointerEnter: checkVirtualPointer,
			onMouseDown: checkVirtualMouse,
			onClick: checkVirtualMouse
		};
	}, [
		commonOnKeyDown,
		focusItemOnOpen,
		getMinEnabledIndex,
		nested,
		onNavigate,
		store,
		openOnArrowKeyDown,
		orientation,
		getParentOrientation,
		rtl,
		selectedIndexRef,
		virtual
	]);
	const reference = import_react.useMemo(() => {
		return {
			...ariaActiveDescendantProp,
			...trigger
		};
	}, [ariaActiveDescendantProp, trigger]);
	return import_react.useMemo(() => enabled ? {
		reference,
		floating,
		item,
		trigger
	} : {}, [
		enabled,
		reference,
		floating,
		trigger,
		item
	]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/hooks/useTypeahead.js
/**
* Provides a matching callback that can be used to focus an item as the user
* types, often used in tandem with `useListNavigation()`.
* @see https://floating-ui.com/docs/useTypeahead
*/
function useTypeahead(context, props) {
	const { listRef, elementsRef, activeIndex, onMatch: onMatchProp, onTyping, enabled = true, resetMs = 750, selectedIndex = null } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const timeout = useTimeout();
	const stringRef = import_react.useRef("");
	const prevIndexRef = import_react.useRef(selectedIndex ?? activeIndex ?? -1);
	const matchIndexRef = import_react.useRef(null);
	const onKeyDown = useStableCallback((event) => {
		function isVisible(index) {
			const element = elementsRef?.current[index];
			return !element || isElementVisible(element);
		}
		function getMatchingIndex(list, string, startIndex = 0) {
			if (list.length === 0) return -1;
			const normalizedStartIndex = (startIndex % list.length + list.length) % list.length;
			const lowerString = string.toLocaleLowerCase();
			for (let offset = 0; offset < list.length; offset += 1) {
				const index = (normalizedStartIndex + offset) % list.length;
				if (!list[index]?.toLocaleLowerCase().startsWith(lowerString) || !isVisible(index)) continue;
				return index;
			}
			return -1;
		}
		const listContent = listRef.current;
		if (stringRef.current.length > 0 && event.key === " ") {
			stopEvent(event);
			onTyping?.(true);
		}
		if (stringRef.current.length > 0 && stringRef.current[0] !== " ") {
			if (getMatchingIndex(listContent, stringRef.current) === -1 && event.key !== " ") onTyping?.(false);
		}
		if (listContent == null || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
		if (open && event.key !== " ") {
			stopEvent(event);
			onTyping?.(true);
		}
		const isNewSession = stringRef.current === "";
		if (isNewSession) prevIndexRef.current = selectedIndex ?? activeIndex ?? -1;
		if (listContent.every((text) => text ? text[0]?.toLocaleLowerCase() !== text[1]?.toLocaleLowerCase() : true) && stringRef.current === event.key) {
			stringRef.current = "";
			prevIndexRef.current = matchIndexRef.current;
		}
		stringRef.current += event.key;
		timeout.start(resetMs, () => {
			stringRef.current = "";
			prevIndexRef.current = matchIndexRef.current;
			onTyping?.(false);
		});
		const startIndex = ((isNewSession ? selectedIndex ?? activeIndex ?? -1 : prevIndexRef.current) ?? 0) + 1;
		const index = getMatchingIndex(listContent, stringRef.current, startIndex);
		if (index !== -1) {
			onMatchProp?.(index);
			matchIndexRef.current = index;
		} else if (event.key !== " ") {
			stringRef.current = "";
			onTyping?.(false);
		}
	});
	const onBlur = useStableCallback((event) => {
		const next = event.relatedTarget;
		const currentDomReferenceElement = store.select("domReferenceElement");
		const currentFloatingElement = store.select("floatingElement");
		if (contains(currentDomReferenceElement, next) || contains(currentFloatingElement, next)) return;
		timeout.clear();
		stringRef.current = "";
		prevIndexRef.current = matchIndexRef.current;
		onTyping?.(false);
	});
	useIsoLayoutEffect(() => {
		if (!open && selectedIndex !== null) return;
		timeout.clear();
		matchIndexRef.current = null;
		if (stringRef.current !== "") stringRef.current = "";
	}, [
		open,
		selectedIndex,
		timeout
	]);
	useIsoLayoutEffect(() => {
		if (open && stringRef.current === "") prevIndexRef.current = selectedIndex ?? activeIndex ?? -1;
	}, [
		open,
		selectedIndex,
		activeIndex
	]);
	const sharedProps = import_react.useMemo(() => ({
		onKeyDown,
		onBlur
	}), [onKeyDown, onBlur]);
	return import_react.useMemo(() => enabled ? {
		reference: sharedProps,
		floating: sharedProps
	} : {}, [enabled, sharedProps]);
}
//#endregion
//#region node_modules/@base-ui/react/esm/toolbar/root/ToolbarRootContext.js
var ToolbarRootContext = /*#__PURE__*/ import_react.createContext(void 0);
ToolbarRootContext.displayName = "ToolbarRootContext";
function useToolbarRootContext(optional) {
	const context = import_react.useContext(ToolbarRootContext);
	if (context === void 0 && !optional) throw new Error("Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.");
	return context;
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/getDisabledMountTransitionStyles.js
function getDisabledMountTransitionStyles(transitionStatus) {
	return transitionStatus === "starting" ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT;
}
//#endregion
//#region node_modules/@base-ui/react/esm/floating-ui-react/middleware/arrow.js
/**
* Fork of the original `arrow` middleware from Floating UI that allows
* configuring the offset parent.
*/
var baseArrow = (options) => ({
	name: "arrow",
	options,
	async fn(state) {
		const { x, y, placement, rects, platform, elements, middlewareData } = state;
		const { element, padding = 0, offsetParent = "real" } = evaluate(options, state) || {};
		if (element == null) return {};
		const paddingObject = getPaddingObject(padding);
		const coords = {
			x,
			y
		};
		const axis = getAlignmentAxis(placement);
		const length = getAxisLength(axis);
		const arrowDimensions = await platform.getDimensions(element);
		const isYAxis = axis === "y";
		const minProp = isYAxis ? "top" : "left";
		const maxProp = isYAxis ? "bottom" : "right";
		const clientProp = isYAxis ? "clientHeight" : "clientWidth";
		const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
		const startDiff = coords[axis] - rects.reference[axis];
		const arrowOffsetParent = offsetParent === "real" ? await platform.getOffsetParent?.(element) : elements.floating;
		let clientSize = elements.floating[clientProp] || rects.floating[length];
		if (!clientSize || !await platform.isElement?.(arrowOffsetParent)) clientSize = elements.floating[clientProp] || rects.floating[length];
		const centerToReference = endDiff / 2 - startDiff / 2;
		const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
		const minPadding = Math.min(paddingObject[minProp], largestPossiblePadding);
		const maxPadding = Math.min(paddingObject[maxProp], largestPossiblePadding);
		const min = minPadding;
		const max = clientSize - arrowDimensions[length] - maxPadding;
		const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
		const offset = clamp(min, center, max);
		const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < min ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
		const alignmentOffset = shouldAddOffset ? center < min ? center - min : center - max : 0;
		return {
			[axis]: coords[axis] + alignmentOffset,
			data: {
				[axis]: offset,
				centerOffset: center - offset - alignmentOffset,
				...shouldAddOffset && { alignmentOffset }
			},
			reset: shouldAddOffset
		};
	}
});
/**
* Provides data to position an inner element of the floating element so that it
* appears centered to the reference element.
* This wraps the core `arrow` middleware to allow React refs as the element.
* @see https://floating-ui.com/docs/arrow
*/
var arrow = (options, deps) => ({
	...baseArrow(options),
	options: [options, deps]
});
//#endregion
//#region node_modules/@base-ui/react/esm/utils/hideMiddleware.js
var hide = {
	name: "hide",
	async fn(state) {
		const { width, height, x, y } = state.rects.reference;
		const anchorHidden = width === 0 && height === 0 && x === 0 && y === 0;
		return { data: { referenceHidden: (await hide$1().fn(state)).data?.referenceHidden || anchorHidden } };
	}
};
//#endregion
//#region node_modules/@base-ui/react/esm/utils/adaptiveOriginMiddleware.js
var DEFAULT_SIDES = {
	sideX: "left",
	sideY: "top"
};
var adaptiveOrigin = {
	name: "adaptiveOrigin",
	async fn(state) {
		const { x: rawX, y: rawY, rects: { floating: floatRect }, elements: { floating }, platform, strategy, placement } = state;
		const win = getWindow(floating);
		const styles = win.getComputedStyle(floating);
		if (!(styles.transitionDuration !== "0s" && styles.transitionDuration !== "")) return {
			x: rawX,
			y: rawY,
			data: DEFAULT_SIDES
		};
		const offsetParent = await platform.getOffsetParent?.(floating);
		let offsetDimensions = {
			width: 0,
			height: 0
		};
		if (strategy === "fixed" && win?.visualViewport) offsetDimensions = {
			width: win.visualViewport.width,
			height: win.visualViewport.height
		};
		else if (offsetParent === win) {
			const doc = ownerDocument(floating);
			offsetDimensions = {
				width: doc.documentElement.clientWidth,
				height: doc.documentElement.clientHeight
			};
		} else if (await platform.isElement?.(offsetParent)) offsetDimensions = await platform.getDimensions(offsetParent);
		const currentSide = getSide(placement);
		let x = rawX;
		let y = rawY;
		if (currentSide === "left") x = offsetDimensions.width - (rawX + floatRect.width);
		if (currentSide === "top") y = offsetDimensions.height - (rawY + floatRect.height);
		const sideX = currentSide === "left" ? "right" : DEFAULT_SIDES.sideX;
		const sideY = currentSide === "top" ? "bottom" : DEFAULT_SIDES.sideY;
		return {
			x,
			y,
			data: {
				sideX,
				sideY
			}
		};
	}
};
//#endregion
//#region node_modules/@base-ui/react/esm/utils/useAnchorPositioning.js
function getLogicalSide(sideParam, renderedSide, isRtl) {
	const isLogicalSideParam = sideParam === "inline-start" || sideParam === "inline-end";
	return {
		top: "top",
		right: isLogicalSideParam ? isRtl ? "inline-start" : "inline-end" : "right",
		bottom: "bottom",
		left: isLogicalSideParam ? isRtl ? "inline-end" : "inline-start" : "left"
	}[renderedSide];
}
function getOffsetData(state, sideParam, isRtl) {
	const { rects, placement } = state;
	return {
		side: getLogicalSide(sideParam, getSide(placement), isRtl),
		align: getAlignment(placement) || "center",
		anchor: {
			width: rects.reference.width,
			height: rects.reference.height
		},
		positioner: {
			width: rects.floating.width,
			height: rects.floating.height
		}
	};
}
/**
* Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
* `useFloating` hook.
*/
function useAnchorPositioning(params) {
	const { anchor, positionMethod = "absolute", side: sideParam = "bottom", sideOffset = 0, align = "center", alignOffset = 0, collisionBoundary, collisionPadding: collisionPaddingParam = 5, sticky = false, arrowPadding = 5, disableAnchorTracking = false, inline: inlineMiddleware, keepMounted = false, floatingRootContext, mounted, collisionAvoidance, shiftCrossAxis = false, nodeId, adaptiveOrigin, lazyFlip = false, externalTree } = params;
	const [mountSide, setMountSide] = import_react.useState(null);
	if (!mounted && mountSide !== null) setMountSide(null);
	const collisionAvoidanceSide = collisionAvoidance.side || "flip";
	const collisionAvoidanceAlign = collisionAvoidance.align || "flip";
	const collisionAvoidanceFallbackAxisSide = collisionAvoidance.fallbackAxisSide || "end";
	const anchorFn = typeof anchor === "function" ? anchor : void 0;
	const anchorFnCallback = useStableCallback(anchorFn);
	const anchorDep = anchorFn ? anchorFnCallback : anchor;
	const anchorValueRef = useValueAsRef(anchor);
	const mountedRef = useValueAsRef(mounted);
	const isRtl = useDirection() === "rtl";
	const side = mountSide || {
		top: "top",
		right: "right",
		bottom: "bottom",
		left: "left",
		"inline-end": isRtl ? "left" : "right",
		"inline-start": isRtl ? "right" : "left"
	}[sideParam];
	const placement = align === "center" ? side : `${side}-${align}`;
	let collisionPadding = collisionPaddingParam;
	const bias = 1;
	const biasTop = sideParam === "bottom" ? bias : 0;
	const biasBottom = sideParam === "top" ? bias : 0;
	const biasLeft = sideParam === "right" ? bias : 0;
	const biasRight = sideParam === "left" ? bias : 0;
	if (typeof collisionPadding === "number") collisionPadding = {
		top: collisionPadding + biasTop,
		right: collisionPadding + biasRight,
		bottom: collisionPadding + biasBottom,
		left: collisionPadding + biasLeft
	};
	else if (collisionPadding) collisionPadding = {
		top: (collisionPadding.top || 0) + biasTop,
		right: (collisionPadding.right || 0) + biasRight,
		bottom: (collisionPadding.bottom || 0) + biasBottom,
		left: (collisionPadding.left || 0) + biasLeft
	};
	const commonCollisionProps = {
		boundary: collisionBoundary === "clipping-ancestors" ? "clippingAncestors" : collisionBoundary,
		padding: collisionPadding
	};
	const arrowRef = import_react.useRef(null);
	const sideOffsetRef = useValueAsRef(sideOffset);
	const alignOffsetRef = useValueAsRef(alignOffset);
	const sideOffsetDep = typeof sideOffset !== "function" ? sideOffset : 0;
	const alignOffsetDep = typeof alignOffset !== "function" ? alignOffset : 0;
	const middleware = [];
	if (inlineMiddleware) middleware.push(inlineMiddleware);
	middleware.push(offset((state) => {
		const data = getOffsetData(state, sideParam, isRtl);
		const sideAxis = typeof sideOffsetRef.current === "function" ? sideOffsetRef.current(data) : sideOffsetRef.current;
		const alignAxis = typeof alignOffsetRef.current === "function" ? alignOffsetRef.current(data) : alignOffsetRef.current;
		return {
			mainAxis: sideAxis,
			crossAxis: alignAxis,
			alignmentAxis: alignAxis
		};
	}, [
		sideOffsetDep,
		alignOffsetDep,
		isRtl,
		sideParam
	]));
	const shiftDisabled = collisionAvoidanceAlign === "none" && collisionAvoidanceSide !== "shift";
	const crossAxisShiftEnabled = !shiftDisabled && (sticky || shiftCrossAxis || collisionAvoidanceSide === "shift");
	const flipMiddleware = collisionAvoidanceSide === "none" ? null : flip({
		...commonCollisionProps,
		padding: {
			top: collisionPadding.top + bias,
			right: collisionPadding.right + bias,
			bottom: collisionPadding.bottom + bias,
			left: collisionPadding.left + bias
		},
		mainAxis: !shiftCrossAxis && collisionAvoidanceSide === "flip",
		crossAxis: collisionAvoidanceAlign === "flip" ? "alignment" : false,
		fallbackAxisSideDirection: collisionAvoidanceFallbackAxisSide
	});
	const shiftMiddleware = shiftDisabled ? null : shift((data) => {
		const html = ownerDocument(data.elements.floating).documentElement;
		return {
			...commonCollisionProps,
			rootBoundary: shiftCrossAxis ? {
				x: 0,
				y: 0,
				width: html.clientWidth,
				height: html.clientHeight
			} : void 0,
			mainAxis: collisionAvoidanceAlign !== "none",
			crossAxis: crossAxisShiftEnabled,
			limiter: sticky || shiftCrossAxis ? void 0 : limitShift((limitData) => {
				if (!arrowRef.current) return {};
				const { width, height } = arrowRef.current.getBoundingClientRect();
				const sideAxis = getSideAxis(getSide(limitData.placement));
				const arrowSize = sideAxis === "y" ? width : height;
				const offsetAmount = sideAxis === "y" ? collisionPadding.left + collisionPadding.right : collisionPadding.top + collisionPadding.bottom;
				return { offset: arrowSize / 2 + offsetAmount / 2 };
			})
		};
	}, [
		commonCollisionProps,
		sticky,
		shiftCrossAxis,
		collisionPadding,
		collisionAvoidanceAlign
	]);
	if (collisionAvoidanceSide === "shift" || collisionAvoidanceAlign === "shift" || align === "center") middleware.push(shiftMiddleware, flipMiddleware);
	else middleware.push(flipMiddleware, shiftMiddleware);
	middleware.push(size({
		...commonCollisionProps,
		apply({ elements: { floating }, availableWidth, availableHeight, rects }) {
			if (!mountedRef.current) return;
			const floatingStyle = floating.style;
			floatingStyle.setProperty("--available-width", `${availableWidth}px`);
			floatingStyle.setProperty("--available-height", `${availableHeight}px`);
			const dpr = getWindow(floating).devicePixelRatio || 1;
			const { x, y, width, height } = rects.reference;
			const anchorWidth = (Math.round((x + width) * dpr) - Math.round(x * dpr)) / dpr;
			const anchorHeight = (Math.round((y + height) * dpr) - Math.round(y * dpr)) / dpr;
			floatingStyle.setProperty("--anchor-width", `${anchorWidth}px`);
			floatingStyle.setProperty("--anchor-height", `${anchorHeight}px`);
		}
	}), arrow((state) => ({
		element: arrowRef.current || ownerDocument(state.elements.floating).createElement("div"),
		padding: arrowPadding,
		offsetParent: "floating"
	}), [arrowPadding]), {
		name: "transformOrigin",
		fn(state) {
			const { elements, middlewareData, placement: renderedPlacement, rects, y } = state;
			const currentRenderedSide = getSide(renderedPlacement);
			const currentRenderedAxis = getSideAxis(currentRenderedSide);
			const arrowEl = arrowRef.current;
			const arrowX = middlewareData.arrow?.x || 0;
			const arrowY = middlewareData.arrow?.y || 0;
			const arrowWidth = arrowEl?.clientWidth || 0;
			const arrowHeight = arrowEl?.clientHeight || 0;
			const transformX = arrowX + arrowWidth / 2;
			const transformY = arrowY + arrowHeight / 2;
			const shiftY = Math.abs(middlewareData.shift?.y || 0);
			const halfAnchorHeight = rects.reference.height / 2;
			const sideOffsetValue = typeof sideOffset === "function" ? sideOffset(getOffsetData(state, sideParam, isRtl)) : sideOffset;
			const isOverlappingAnchor = shiftY > sideOffsetValue;
			const adjacentTransformOrigin = {
				top: `${transformX}px calc(100% + ${sideOffsetValue}px)`,
				bottom: `${transformX}px ${-sideOffsetValue}px`,
				left: `calc(100% + ${sideOffsetValue}px) ${transformY}px`,
				right: `${-sideOffsetValue}px ${transformY}px`
			}[currentRenderedSide];
			const overlapTransformOrigin = `${transformX}px ${rects.reference.y + halfAnchorHeight - y}px`;
			elements.floating.style.setProperty("--transform-origin", crossAxisShiftEnabled && currentRenderedAxis === "y" && isOverlappingAnchor ? overlapTransformOrigin : adjacentTransformOrigin);
			return {};
		}
	}, hide, adaptiveOrigin);
	useIsoLayoutEffect(() => {
		if (!mounted && floatingRootContext) floatingRootContext.update({
			referenceElement: null,
			floatingElement: null,
			domReferenceElement: null,
			positionReference: null
		});
	}, [mounted, floatingRootContext]);
	const autoUpdateOptions = import_react.useMemo(() => ({
		elementResize: !disableAnchorTracking && typeof ResizeObserver !== "undefined",
		layoutShift: !disableAnchorTracking && typeof IntersectionObserver !== "undefined"
	}), [disableAnchorTracking]);
	const { refs, elements, x, y, middlewareData, update, placement: renderedPlacement, context, isPositioned, floatingStyles: originalFloatingStyles } = useFloating({
		rootContext: floatingRootContext,
		open: keepMounted ? mounted : void 0,
		placement,
		middleware,
		strategy: positionMethod,
		whileElementsMounted: keepMounted ? void 0 : (...args) => autoUpdate(...args, autoUpdateOptions),
		nodeId,
		externalTree
	});
	const { sideX, sideY } = middlewareData.adaptiveOrigin || DEFAULT_SIDES;
	const resolvedPosition = isPositioned ? positionMethod : "fixed";
	const floatingStyles = import_react.useMemo(() => {
		const base = adaptiveOrigin ? {
			position: resolvedPosition,
			[sideX]: x,
			[sideY]: y
		} : {
			position: resolvedPosition,
			...originalFloatingStyles
		};
		if (!isPositioned) base.opacity = 0;
		return base;
	}, [
		adaptiveOrigin,
		resolvedPosition,
		sideX,
		x,
		sideY,
		y,
		originalFloatingStyles,
		isPositioned
	]);
	const registeredPositionReferenceRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (!mounted) return;
		const anchorValue = anchorValueRef.current;
		const resolvedAnchor = typeof anchorValue === "function" ? anchorValue() : anchorValue;
		const finalAnchor = (isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor) || null;
		if (finalAnchor !== registeredPositionReferenceRef.current) {
			refs.setPositionReference(finalAnchor);
			registeredPositionReferenceRef.current = finalAnchor;
		}
	}, [
		mounted,
		refs,
		anchorDep,
		anchorValueRef
	]);
	import_react.useEffect(() => {
		if (!mounted) return;
		const anchorValue = anchorValueRef.current;
		if (typeof anchorValue === "function") return;
		if (isRef(anchorValue) && anchorValue.current !== registeredPositionReferenceRef.current) {
			refs.setPositionReference(anchorValue.current);
			registeredPositionReferenceRef.current = anchorValue.current;
		}
	}, [
		mounted,
		refs,
		anchorDep,
		anchorValueRef
	]);
	import_react.useEffect(() => {
		if (keepMounted && mounted && elements.domReference && elements.floating) return autoUpdate(elements.domReference, elements.floating, update, autoUpdateOptions);
	}, [
		keepMounted,
		mounted,
		elements,
		update,
		autoUpdateOptions
	]);
	const renderedSide = getSide(renderedPlacement);
	const logicalRenderedSide = getLogicalSide(sideParam, renderedSide, isRtl);
	const renderedAlign = getAlignment(renderedPlacement) || "center";
	const anchorHidden = Boolean(middlewareData.hide?.referenceHidden);
	useIsoLayoutEffect(() => {
		if (lazyFlip && mounted && isPositioned) setMountSide(renderedSide);
	}, [
		lazyFlip,
		mounted,
		isPositioned,
		renderedSide
	]);
	const arrowStyles = import_react.useMemo(() => ({
		position: "absolute",
		top: middlewareData.arrow?.y,
		left: middlewareData.arrow?.x
	}), [middlewareData.arrow]);
	const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;
	return import_react.useMemo(() => ({
		positionerStyles: floatingStyles,
		arrowStyles,
		arrowRef,
		arrowUncentered,
		side: logicalRenderedSide,
		align: renderedAlign,
		physicalSide: renderedSide,
		anchorHidden,
		refs,
		context,
		isPositioned,
		update
	}), [
		floatingStyles,
		arrowStyles,
		arrowRef,
		arrowUncentered,
		logicalRenderedSide,
		renderedAlign,
		renderedSide,
		anchorHidden,
		refs,
		context,
		isPositioned,
		update
	]);
}
function isRef(param) {
	return param != null && "current" in param;
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/usePositioner.js
/**
* Renders the shared outer Positioner element used by popup components.
* Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
*/
function usePositioner(componentProps, state, { styles, transitionStatus, props, refs, hidden, inert = false }) {
	const style = { ...styles };
	if (inert) style.pointerEvents = "none";
	return useRenderElement("div", componentProps, {
		state,
		ref: refs,
		props: [
			{
				role: "presentation",
				hidden,
				style
			},
			getDisabledMountTransitionStyles(transitionStatus),
			props
		],
		stateAttributesMapping: popupStateMapping
	});
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/useAnchoredPopupScrollLock.js
var VIEWPORT_WIDTH_TOLERANCE_PX = 20;
/**
* Manages scroll lock for anchored popups. For non-touch opens, scroll lock is applied when
* enabled. For touch opens, scroll lock is applied only when the positioner width is effectively
* viewport-sized.
*/
function useAnchoredPopupScrollLock(enabled, touchOpen, positionerElement, referenceElement) {
	const [touchOpenShouldLockScroll, setTouchOpenShouldLockScroll] = import_react.useState(false);
	useIsoLayoutEffect(() => {
		if (!enabled || !touchOpen || positionerElement == null) {
			setTouchOpenShouldLockScroll(false);
			return;
		}
		const viewportWidth = ownerDocument(positionerElement).documentElement.clientWidth;
		const popupWidth = positionerElement.offsetWidth;
		setTouchOpenShouldLockScroll(viewportWidth > 0 && popupWidth > 0 && popupWidth >= viewportWidth - VIEWPORT_WIDTH_TOLERANCE_PX);
	}, [
		enabled,
		touchOpen,
		positionerElement
	]);
	useScrollLock(enabled && (!touchOpen || touchOpenShouldLockScroll), referenceElement);
}
//#endregion
//#region node_modules/@base-ui/react/esm/utils/getPseudoElementBounds.js
function getPseudoElementBounds(element) {
	return element.getBoundingClientRect();
}
//#endregion
//#region node_modules/@base-ui/utils/esm/usePreviousValue.js
/**
* Returns a previous value of its argument.
* @param value Current value.
* @returns Previous value, or null if there is no previous value.
*/
function usePreviousValue(value) {
	const [state, setState] = import_react.useState({
		current: value,
		previous: null
	});
	if (value !== state.current) setState({
		current: value,
		previous: state.current
	});
	return state.previous;
}
//#endregion
export { useAnchorPositioning as a, useToolbarRootContext as c, useFloatingRootContext as d, platform as f, usePositioner as i, useTypeahead as l, getPseudoElementBounds as n, adaptiveOrigin as o, useAnchoredPopupScrollLock as r, getDisabledMountTransitionStyles as s, usePreviousValue as t, useListNavigation as u };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlUHJldmlvdXNWYWx1ZS1CZkNkWEQxNC5qcyIsIm5hbWVzIjpbImNvbXB1dGVQb3NpdGlvbiIsImZsaXAiLCJoaWRlIiwib2Zmc2V0Iiwic2hpZnQiLCJsaW1pdFNoaWZ0Iiwic2l6ZSIsIm9mZnNldCIsIm9mZnNldCQxIiwic2hpZnQiLCJzaGlmdCQxIiwiZmxpcCIsImZsaXAkMSIsInNpemUiLCJzaXplJDEiLCJoaWRlIiwiaGlkZSQxIiwibGltaXRTaGlmdCIsImxpbWl0U2hpZnQkMSIsInVzZUxheW91dEVmZmVjdCIsInVzZUZsb2F0aW5nIiwiaGlkZSIsImhpZGUkMSIsInVzZVBvc2l0aW9uIiwiUkVBU09OUy5saXN0TmF2aWdhdGlvbiIsIlJFQVNPTlMuZm9jdXNPdXQiLCJuYXRpdmVIaWRlIiwib3duZXJXaW5kb3ciLCJvd25lcldpbmRvdyJdLCJzb3VyY2VzIjpbIi4uLy4uL0BmbG9hdGluZy11aS9jb3JlL2Rpc3QvZmxvYXRpbmctdWkuY29yZS5tanMiLCIuLi8uLi9AZmxvYXRpbmctdWkvZG9tL2Rpc3QvZmxvYXRpbmctdWkuZG9tLm1qcyIsIi4uLy4uL0BmbG9hdGluZy11aS9yZWFjdC1kb20vZGlzdC9mbG9hdGluZy11aS5yZWFjdC1kb20ubWpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL2Zsb2F0aW5nLXVpLXJlYWN0L2hvb2tzL3VzZUZsb2F0aW5nUm9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlRmxvYXRpbmcuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlTGlzdE5hdmlnYXRpb24uanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvaG9va3MvdXNlVHlwZWFoZWFkLmpzIiwiLi4vLi4vQGJhc2UtdWkvcmVhY3QvZXNtL3Rvb2xiYXIvcm9vdC9Ub29sYmFyUm9vdENvbnRleHQuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvZ2V0RGlzYWJsZWRNb3VudFRyYW5zaXRpb25TdHlsZXMuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vZmxvYXRpbmctdWktcmVhY3QvbWlkZGxld2FyZS9hcnJvdy5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9oaWRlTWlkZGxld2FyZS5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9hZGFwdGl2ZU9yaWdpbk1pZGRsZXdhcmUuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvdXNlQW5jaG9yUG9zaXRpb25pbmcuanMiLCIuLi8uLi9AYmFzZS11aS9yZWFjdC9lc20vdXRpbHMvdXNlUG9zaXRpb25lci5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy91c2VBbmNob3JlZFBvcHVwU2Nyb2xsTG9jay5qcyIsIi4uLy4uL0BiYXNlLXVpL3JlYWN0L2VzbS91dGlscy9nZXRQc2V1ZG9FbGVtZW50Qm91bmRzLmpzIiwiLi4vLi4vQGJhc2UtdWkvdXRpbHMvZXNtL3VzZVByZXZpb3VzVmFsdWUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0U2lkZUF4aXMsIGdldEFsaWdubWVudEF4aXMsIGdldEF4aXNMZW5ndGgsIGdldFNpZGUsIGdldEFsaWdubWVudCwgZXZhbHVhdGUsIGdldFBhZGRpbmdPYmplY3QsIHJlY3RUb0NsaWVudFJlY3QsIG1pbiwgY2xhbXAsIHBsYWNlbWVudHMsIGdldEFsaWdubWVudFNpZGVzLCBnZXRPcHBvc2l0ZUFsaWdubWVudFBsYWNlbWVudCwgZ2V0T3Bwb3NpdGVQbGFjZW1lbnQsIGdldEV4cGFuZGVkUGxhY2VtZW50cywgZ2V0T3Bwb3NpdGVBeGlzUGxhY2VtZW50cywgc2lkZXMsIG1heCwgZ2V0T3Bwb3NpdGVBeGlzIH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzJztcbmV4cG9ydCB7IHJlY3RUb0NsaWVudFJlY3QgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMnO1xuXG5mdW5jdGlvbiBjb21wdXRlQ29vcmRzRnJvbVBsYWNlbWVudChfcmVmLCBwbGFjZW1lbnQsIHJ0bCkge1xuICBsZXQge1xuICAgIHJlZmVyZW5jZSxcbiAgICBmbG9hdGluZ1xuICB9ID0gX3JlZjtcbiAgY29uc3Qgc2lkZUF4aXMgPSBnZXRTaWRlQXhpcyhwbGFjZW1lbnQpO1xuICBjb25zdCBhbGlnbm1lbnRBeGlzID0gZ2V0QWxpZ25tZW50QXhpcyhwbGFjZW1lbnQpO1xuICBjb25zdCBhbGlnbkxlbmd0aCA9IGdldEF4aXNMZW5ndGgoYWxpZ25tZW50QXhpcyk7XG4gIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gIGNvbnN0IGlzVmVydGljYWwgPSBzaWRlQXhpcyA9PT0gJ3knO1xuICBjb25zdCBjb21tb25YID0gcmVmZXJlbmNlLnggKyByZWZlcmVuY2Uud2lkdGggLyAyIC0gZmxvYXRpbmcud2lkdGggLyAyO1xuICBjb25zdCBjb21tb25ZID0gcmVmZXJlbmNlLnkgKyByZWZlcmVuY2UuaGVpZ2h0IC8gMiAtIGZsb2F0aW5nLmhlaWdodCAvIDI7XG4gIGNvbnN0IGNvbW1vbkFsaWduID0gcmVmZXJlbmNlW2FsaWduTGVuZ3RoXSAvIDIgLSBmbG9hdGluZ1thbGlnbkxlbmd0aF0gLyAyO1xuICBsZXQgY29vcmRzO1xuICBzd2l0Y2ggKHNpZGUpIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgY29vcmRzID0ge1xuICAgICAgICB4OiBjb21tb25YLFxuICAgICAgICB5OiByZWZlcmVuY2UueSAtIGZsb2F0aW5nLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICBjb29yZHMgPSB7XG4gICAgICAgIHg6IGNvbW1vblgsXG4gICAgICAgIHk6IHJlZmVyZW5jZS55ICsgcmVmZXJlbmNlLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgeDogcmVmZXJlbmNlLnggKyByZWZlcmVuY2Uud2lkdGgsXG4gICAgICAgIHk6IGNvbW1vbllcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdsZWZ0JzpcbiAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgeDogcmVmZXJlbmNlLnggLSBmbG9hdGluZy53aWR0aCxcbiAgICAgICAgeTogY29tbW9uWVxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb29yZHMgPSB7XG4gICAgICAgIHg6IHJlZmVyZW5jZS54LFxuICAgICAgICB5OiByZWZlcmVuY2UueVxuICAgICAgfTtcbiAgfVxuICBzd2l0Y2ggKGdldEFsaWdubWVudChwbGFjZW1lbnQpKSB7XG4gICAgY2FzZSAnc3RhcnQnOlxuICAgICAgY29vcmRzW2FsaWdubWVudEF4aXNdIC09IGNvbW1vbkFsaWduICogKHJ0bCAmJiBpc1ZlcnRpY2FsID8gLTEgOiAxKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2VuZCc6XG4gICAgICBjb29yZHNbYWxpZ25tZW50QXhpc10gKz0gY29tbW9uQWxpZ24gKiAocnRsICYmIGlzVmVydGljYWwgPyAtMSA6IDEpO1xuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIGNvb3Jkcztcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB3aXRoIGFuIG9iamVjdCBvZiBvdmVyZmxvdyBzaWRlIG9mZnNldHMgdGhhdCBkZXRlcm1pbmUgaG93IG11Y2ggdGhlXG4gKiBlbGVtZW50IGlzIG92ZXJmbG93aW5nIGEgZ2l2ZW4gY2xpcHBpbmcgYm91bmRhcnkgb24gZWFjaCBzaWRlLlxuICogLSBwb3NpdGl2ZSA9IG92ZXJmbG93aW5nIHRoZSBib3VuZGFyeSBieSB0aGF0IG51bWJlciBvZiBwaXhlbHNcbiAqIC0gbmVnYXRpdmUgPSBob3cgbWFueSBwaXhlbHMgbGVmdCBiZWZvcmUgaXQgd2lsbCBvdmVyZmxvd1xuICogLSAwID0gbGllcyBmbHVzaCB3aXRoIHRoZSBib3VuZGFyeVxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL2RldGVjdE92ZXJmbG93XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdE92ZXJmbG93KHN0YXRlLCBvcHRpb25zKSB7XG4gIHZhciBfYXdhaXQkcGxhdGZvcm0kaXNFbGU7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgY29uc3Qge1xuICAgIHgsXG4gICAgeSxcbiAgICBwbGF0Zm9ybSxcbiAgICByZWN0cyxcbiAgICBlbGVtZW50cyxcbiAgICBzdHJhdGVneVxuICB9ID0gc3RhdGU7XG4gIGNvbnN0IHtcbiAgICBib3VuZGFyeSA9ICdjbGlwcGluZ0FuY2VzdG9ycycsXG4gICAgcm9vdEJvdW5kYXJ5ID0gJ3ZpZXdwb3J0JyxcbiAgICBlbGVtZW50Q29udGV4dCA9ICdmbG9hdGluZycsXG4gICAgYWx0Qm91bmRhcnkgPSBmYWxzZSxcbiAgICBwYWRkaW5nID0gMFxuICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpO1xuICBjb25zdCBwYWRkaW5nT2JqZWN0ID0gZ2V0UGFkZGluZ09iamVjdChwYWRkaW5nKTtcbiAgY29uc3QgYWx0Q29udGV4dCA9IGVsZW1lbnRDb250ZXh0ID09PSAnZmxvYXRpbmcnID8gJ3JlZmVyZW5jZScgOiAnZmxvYXRpbmcnO1xuICBjb25zdCBlbGVtZW50ID0gZWxlbWVudHNbYWx0Qm91bmRhcnkgPyBhbHRDb250ZXh0IDogZWxlbWVudENvbnRleHRdO1xuICBjb25zdCBjbGlwcGluZ0NsaWVudFJlY3QgPSByZWN0VG9DbGllbnRSZWN0KGF3YWl0IHBsYXRmb3JtLmdldENsaXBwaW5nUmVjdCh7XG4gICAgZWxlbWVudDogKChfYXdhaXQkcGxhdGZvcm0kaXNFbGUgPSBhd2FpdCAocGxhdGZvcm0uaXNFbGVtZW50ID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybS5pc0VsZW1lbnQoZWxlbWVudCkpKSAhPSBudWxsID8gX2F3YWl0JHBsYXRmb3JtJGlzRWxlIDogdHJ1ZSkgPyBlbGVtZW50IDogZWxlbWVudC5jb250ZXh0RWxlbWVudCB8fCAoYXdhaXQgKHBsYXRmb3JtLmdldERvY3VtZW50RWxlbWVudCA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0uZ2V0RG9jdW1lbnRFbGVtZW50KGVsZW1lbnRzLmZsb2F0aW5nKSkpLFxuICAgIGJvdW5kYXJ5LFxuICAgIHJvb3RCb3VuZGFyeSxcbiAgICBzdHJhdGVneVxuICB9KSk7XG4gIGNvbnN0IHJlY3QgPSBlbGVtZW50Q29udGV4dCA9PT0gJ2Zsb2F0aW5nJyA/IHtcbiAgICB4LFxuICAgIHksXG4gICAgd2lkdGg6IHJlY3RzLmZsb2F0aW5nLndpZHRoLFxuICAgIGhlaWdodDogcmVjdHMuZmxvYXRpbmcuaGVpZ2h0XG4gIH0gOiByZWN0cy5yZWZlcmVuY2U7XG4gIGNvbnN0IG9mZnNldFBhcmVudCA9IGF3YWl0IChwbGF0Zm9ybS5nZXRPZmZzZXRQYXJlbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmdldE9mZnNldFBhcmVudChlbGVtZW50cy5mbG9hdGluZykpO1xuICBjb25zdCBvZmZzZXRTY2FsZSA9IChhd2FpdCAocGxhdGZvcm0uaXNFbGVtZW50ID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybS5pc0VsZW1lbnQob2Zmc2V0UGFyZW50KSkpID8gKGF3YWl0IChwbGF0Zm9ybS5nZXRTY2FsZSA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0uZ2V0U2NhbGUob2Zmc2V0UGFyZW50KSkpIHx8IHtcbiAgICB4OiAxLFxuICAgIHk6IDFcbiAgfSA6IHtcbiAgICB4OiAxLFxuICAgIHk6IDFcbiAgfTtcbiAgY29uc3QgZWxlbWVudENsaWVudFJlY3QgPSByZWN0VG9DbGllbnRSZWN0KHBsYXRmb3JtLmNvbnZlcnRPZmZzZXRQYXJlbnRSZWxhdGl2ZVJlY3RUb1ZpZXdwb3J0UmVsYXRpdmVSZWN0ID8gYXdhaXQgcGxhdGZvcm0uY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3Qoe1xuICAgIGVsZW1lbnRzLFxuICAgIHJlY3QsXG4gICAgb2Zmc2V0UGFyZW50LFxuICAgIHN0cmF0ZWd5XG4gIH0pIDogcmVjdCk7XG4gIHJldHVybiB7XG4gICAgdG9wOiAoY2xpcHBpbmdDbGllbnRSZWN0LnRvcCAtIGVsZW1lbnRDbGllbnRSZWN0LnRvcCArIHBhZGRpbmdPYmplY3QudG9wKSAvIG9mZnNldFNjYWxlLnksXG4gICAgYm90dG9tOiAoZWxlbWVudENsaWVudFJlY3QuYm90dG9tIC0gY2xpcHBpbmdDbGllbnRSZWN0LmJvdHRvbSArIHBhZGRpbmdPYmplY3QuYm90dG9tKSAvIG9mZnNldFNjYWxlLnksXG4gICAgbGVmdDogKGNsaXBwaW5nQ2xpZW50UmVjdC5sZWZ0IC0gZWxlbWVudENsaWVudFJlY3QubGVmdCArIHBhZGRpbmdPYmplY3QubGVmdCkgLyBvZmZzZXRTY2FsZS54LFxuICAgIHJpZ2h0OiAoZWxlbWVudENsaWVudFJlY3QucmlnaHQgLSBjbGlwcGluZ0NsaWVudFJlY3QucmlnaHQgKyBwYWRkaW5nT2JqZWN0LnJpZ2h0KSAvIG9mZnNldFNjYWxlLnhcbiAgfTtcbn1cblxuLy8gTWF4aW11bSBudW1iZXIgb2YgcmVzZXRzIHRoYXQgY2FuIG9jY3VyIGJlZm9yZSBiYWlsaW5nIHRvIGF2b2lkIGluZmluaXRlIHJlc2V0IGxvb3BzLlxuY29uc3QgTUFYX1JFU0VUX0NPVU5UID0gNTA7XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGB4YCBhbmQgYHlgIGNvb3JkaW5hdGVzIHRoYXQgd2lsbCBwbGFjZSB0aGUgZmxvYXRpbmcgZWxlbWVudFxuICogbmV4dCB0byBhIGdpdmVuIHJlZmVyZW5jZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZXhwb3J0IGRvZXMgbm90IGhhdmUgYW55IGBwbGF0Zm9ybWAgaW50ZXJmYWNlIGxvZ2ljLiBZb3Ugd2lsbCBuZWVkIHRvXG4gKiB3cml0ZSBvbmUgZm9yIHRoZSBwbGF0Zm9ybSB5b3UgYXJlIHVzaW5nIEZsb2F0aW5nIFVJIHdpdGguXG4gKi9cbmNvbnN0IGNvbXB1dGVQb3NpdGlvbiA9IGFzeW5jIChyZWZlcmVuY2UsIGZsb2F0aW5nLCBjb25maWcpID0+IHtcbiAgY29uc3Qge1xuICAgIHBsYWNlbWVudCA9ICdib3R0b20nLFxuICAgIHN0cmF0ZWd5ID0gJ2Fic29sdXRlJyxcbiAgICBtaWRkbGV3YXJlID0gW10sXG4gICAgcGxhdGZvcm1cbiAgfSA9IGNvbmZpZztcbiAgY29uc3QgcGxhdGZvcm1XaXRoRGV0ZWN0T3ZlcmZsb3cgPSBwbGF0Zm9ybS5kZXRlY3RPdmVyZmxvdyA/IHBsYXRmb3JtIDoge1xuICAgIC4uLnBsYXRmb3JtLFxuICAgIGRldGVjdE92ZXJmbG93XG4gIH07XG4gIGNvbnN0IHJ0bCA9IGF3YWl0IChwbGF0Zm9ybS5pc1JUTCA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0uaXNSVEwoZmxvYXRpbmcpKTtcbiAgbGV0IHJlY3RzID0gYXdhaXQgcGxhdGZvcm0uZ2V0RWxlbWVudFJlY3RzKHtcbiAgICByZWZlcmVuY2UsXG4gICAgZmxvYXRpbmcsXG4gICAgc3RyYXRlZ3lcbiAgfSk7XG4gIGxldCB7XG4gICAgeCxcbiAgICB5XG4gIH0gPSBjb21wdXRlQ29vcmRzRnJvbVBsYWNlbWVudChyZWN0cywgcGxhY2VtZW50LCBydGwpO1xuICBsZXQgc3RhdGVmdWxQbGFjZW1lbnQgPSBwbGFjZW1lbnQ7XG4gIGxldCByZXNldENvdW50ID0gMDtcbiAgY29uc3QgbWlkZGxld2FyZURhdGEgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtaWRkbGV3YXJlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudE1pZGRsZXdhcmUgPSBtaWRkbGV3YXJlW2ldO1xuICAgIGlmICghY3VycmVudE1pZGRsZXdhcmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCB7XG4gICAgICBuYW1lLFxuICAgICAgZm5cbiAgICB9ID0gY3VycmVudE1pZGRsZXdhcmU7XG4gICAgY29uc3Qge1xuICAgICAgeDogbmV4dFgsXG4gICAgICB5OiBuZXh0WSxcbiAgICAgIGRhdGEsXG4gICAgICByZXNldFxuICAgIH0gPSBhd2FpdCBmbih7XG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIGluaXRpYWxQbGFjZW1lbnQ6IHBsYWNlbWVudCxcbiAgICAgIHBsYWNlbWVudDogc3RhdGVmdWxQbGFjZW1lbnQsXG4gICAgICBzdHJhdGVneSxcbiAgICAgIG1pZGRsZXdhcmVEYXRhLFxuICAgICAgcmVjdHMsXG4gICAgICBwbGF0Zm9ybTogcGxhdGZvcm1XaXRoRGV0ZWN0T3ZlcmZsb3csXG4gICAgICBlbGVtZW50czoge1xuICAgICAgICByZWZlcmVuY2UsXG4gICAgICAgIGZsb2F0aW5nXG4gICAgICB9XG4gICAgfSk7XG4gICAgeCA9IG5leHRYICE9IG51bGwgPyBuZXh0WCA6IHg7XG4gICAgeSA9IG5leHRZICE9IG51bGwgPyBuZXh0WSA6IHk7XG4gICAgbWlkZGxld2FyZURhdGFbbmFtZV0gPSB7XG4gICAgICAuLi5taWRkbGV3YXJlRGF0YVtuYW1lXSxcbiAgICAgIC4uLmRhdGFcbiAgICB9O1xuICAgIGlmIChyZXNldCAmJiByZXNldENvdW50IDwgTUFYX1JFU0VUX0NPVU5UKSB7XG4gICAgICByZXNldENvdW50Kys7XG4gICAgICBpZiAodHlwZW9mIHJlc2V0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAocmVzZXQucGxhY2VtZW50KSB7XG4gICAgICAgICAgc3RhdGVmdWxQbGFjZW1lbnQgPSByZXNldC5wbGFjZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc2V0LnJlY3RzKSB7XG4gICAgICAgICAgcmVjdHMgPSByZXNldC5yZWN0cyA9PT0gdHJ1ZSA/IGF3YWl0IHBsYXRmb3JtLmdldEVsZW1lbnRSZWN0cyh7XG4gICAgICAgICAgICByZWZlcmVuY2UsXG4gICAgICAgICAgICBmbG9hdGluZyxcbiAgICAgICAgICAgIHN0cmF0ZWd5XG4gICAgICAgICAgfSkgOiByZXNldC5yZWN0cztcbiAgICAgICAgfVxuICAgICAgICAoe1xuICAgICAgICAgIHgsXG4gICAgICAgICAgeVxuICAgICAgICB9ID0gY29tcHV0ZUNvb3Jkc0Zyb21QbGFjZW1lbnQocmVjdHMsIHN0YXRlZnVsUGxhY2VtZW50LCBydGwpKTtcbiAgICAgIH1cbiAgICAgIGkgPSAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB4LFxuICAgIHksXG4gICAgcGxhY2VtZW50OiBzdGF0ZWZ1bFBsYWNlbWVudCxcbiAgICBzdHJhdGVneSxcbiAgICBtaWRkbGV3YXJlRGF0YVxuICB9O1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBkYXRhIHRvIHBvc2l0aW9uIGFuIGlubmVyIGVsZW1lbnQgb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQgc28gdGhhdCBpdFxuICogYXBwZWFycyBjZW50ZXJlZCB0byB0aGUgcmVmZXJlbmNlIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvYXJyb3dcbiAqL1xuY29uc3QgYXJyb3cgPSBvcHRpb25zID0+ICh7XG4gIG5hbWU6ICdhcnJvdycsXG4gIG9wdGlvbnMsXG4gIGFzeW5jIGZuKHN0YXRlKSB7XG4gICAgY29uc3Qge1xuICAgICAgeCxcbiAgICAgIHksXG4gICAgICBwbGFjZW1lbnQsXG4gICAgICByZWN0cyxcbiAgICAgIHBsYXRmb3JtLFxuICAgICAgZWxlbWVudHMsXG4gICAgICBtaWRkbGV3YXJlRGF0YVxuICAgIH0gPSBzdGF0ZTtcbiAgICAvLyBTaW5jZSBgZWxlbWVudGAgaXMgcmVxdWlyZWQsIHdlIGRvbid0IFBhcnRpYWw8PiB0aGUgdHlwZS5cbiAgICBjb25zdCB7XG4gICAgICBlbGVtZW50LFxuICAgICAgcGFkZGluZyA9IDBcbiAgICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpIHx8IHt9O1xuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgcGFkZGluZ09iamVjdCA9IGdldFBhZGRpbmdPYmplY3QocGFkZGluZyk7XG4gICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgeCxcbiAgICAgIHlcbiAgICB9O1xuICAgIGNvbnN0IGF4aXMgPSBnZXRBbGlnbm1lbnRBeGlzKHBsYWNlbWVudCk7XG4gICAgY29uc3QgbGVuZ3RoID0gZ2V0QXhpc0xlbmd0aChheGlzKTtcbiAgICBjb25zdCBhcnJvd0RpbWVuc2lvbnMgPSBhd2FpdCBwbGF0Zm9ybS5nZXREaW1lbnNpb25zKGVsZW1lbnQpO1xuICAgIGNvbnN0IGlzWUF4aXMgPSBheGlzID09PSAneSc7XG4gICAgY29uc3QgbWluUHJvcCA9IGlzWUF4aXMgPyAndG9wJyA6ICdsZWZ0JztcbiAgICBjb25zdCBtYXhQcm9wID0gaXNZQXhpcyA/ICdib3R0b20nIDogJ3JpZ2h0JztcbiAgICBjb25zdCBjbGllbnRQcm9wID0gaXNZQXhpcyA/ICdjbGllbnRIZWlnaHQnIDogJ2NsaWVudFdpZHRoJztcbiAgICBjb25zdCBlbmREaWZmID0gcmVjdHMucmVmZXJlbmNlW2xlbmd0aF0gKyByZWN0cy5yZWZlcmVuY2VbYXhpc10gLSBjb29yZHNbYXhpc10gLSByZWN0cy5mbG9hdGluZ1tsZW5ndGhdO1xuICAgIGNvbnN0IHN0YXJ0RGlmZiA9IGNvb3Jkc1theGlzXSAtIHJlY3RzLnJlZmVyZW5jZVtheGlzXTtcbiAgICBjb25zdCBhcnJvd09mZnNldFBhcmVudCA9IGF3YWl0IChwbGF0Zm9ybS5nZXRPZmZzZXRQYXJlbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmdldE9mZnNldFBhcmVudChlbGVtZW50KSk7XG4gICAgbGV0IGNsaWVudFNpemUgPSBhcnJvd09mZnNldFBhcmVudCA/IGFycm93T2Zmc2V0UGFyZW50W2NsaWVudFByb3BdIDogMDtcblxuICAgIC8vIERPTSBwbGF0Zm9ybSBjYW4gcmV0dXJuIGB3aW5kb3dgIGFzIHRoZSBgb2Zmc2V0UGFyZW50YC5cbiAgICBpZiAoIWNsaWVudFNpemUgfHwgIShhd2FpdCAocGxhdGZvcm0uaXNFbGVtZW50ID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybS5pc0VsZW1lbnQoYXJyb3dPZmZzZXRQYXJlbnQpKSkpIHtcbiAgICAgIGNsaWVudFNpemUgPSBlbGVtZW50cy5mbG9hdGluZ1tjbGllbnRQcm9wXSB8fCByZWN0cy5mbG9hdGluZ1tsZW5ndGhdO1xuICAgIH1cbiAgICBjb25zdCBjZW50ZXJUb1JlZmVyZW5jZSA9IGVuZERpZmYgLyAyIC0gc3RhcnREaWZmIC8gMjtcblxuICAgIC8vIElmIHRoZSBwYWRkaW5nIGlzIGxhcmdlIGVub3VnaCB0aGF0IGl0IGNhdXNlcyB0aGUgYXJyb3cgdG8gbm8gbG9uZ2VyIGJlXG4gICAgLy8gY2VudGVyZWQsIG1vZGlmeSB0aGUgcGFkZGluZyBzbyB0aGF0IGl0IGlzIGNlbnRlcmVkLlxuICAgIGNvbnN0IGxhcmdlc3RQb3NzaWJsZVBhZGRpbmcgPSBjbGllbnRTaXplIC8gMiAtIGFycm93RGltZW5zaW9uc1tsZW5ndGhdIC8gMiAtIDE7XG4gICAgY29uc3QgbWluUGFkZGluZyA9IG1pbihwYWRkaW5nT2JqZWN0W21pblByb3BdLCBsYXJnZXN0UG9zc2libGVQYWRkaW5nKTtcbiAgICBjb25zdCBtYXhQYWRkaW5nID0gbWluKHBhZGRpbmdPYmplY3RbbWF4UHJvcF0sIGxhcmdlc3RQb3NzaWJsZVBhZGRpbmcpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBhcnJvdyBkb2Vzbid0IG92ZXJmbG93IHRoZSBmbG9hdGluZyBlbGVtZW50IGlmIHRoZSBjZW50ZXJcbiAgICAvLyBwb2ludCBpcyBvdXRzaWRlIHRoZSBmbG9hdGluZyBlbGVtZW50J3MgYm91bmRzLlxuICAgIGNvbnN0IG1pbiQxID0gbWluUGFkZGluZztcbiAgICBjb25zdCBtYXggPSBjbGllbnRTaXplIC0gYXJyb3dEaW1lbnNpb25zW2xlbmd0aF0gLSBtYXhQYWRkaW5nO1xuICAgIGNvbnN0IGNlbnRlciA9IGNsaWVudFNpemUgLyAyIC0gYXJyb3dEaW1lbnNpb25zW2xlbmd0aF0gLyAyICsgY2VudGVyVG9SZWZlcmVuY2U7XG4gICAgY29uc3Qgb2Zmc2V0ID0gY2xhbXAobWluJDEsIGNlbnRlciwgbWF4KTtcblxuICAgIC8vIElmIHRoZSByZWZlcmVuY2UgaXMgc21hbGwgZW5vdWdoIHRoYXQgdGhlIGFycm93J3MgcGFkZGluZyBjYXVzZXMgaXQgdG9cbiAgICAvLyB0byBwb2ludCB0byBub3RoaW5nIGZvciBhbiBhbGlnbmVkIHBsYWNlbWVudCwgYWRqdXN0IHRoZSBvZmZzZXQgb2YgdGhlXG4gICAgLy8gZmxvYXRpbmcgZWxlbWVudCBpdHNlbGYuIFRvIGVuc3VyZSBgc2hpZnQoKWAgY29udGludWVzIHRvIHRha2UgYWN0aW9uLFxuICAgIC8vIGEgc2luZ2xlIHJlc2V0IGlzIHBlcmZvcm1lZCB3aGVuIHRoaXMgaXMgdHJ1ZS5cbiAgICBjb25zdCBzaG91bGRBZGRPZmZzZXQgPSAhbWlkZGxld2FyZURhdGEuYXJyb3cgJiYgZ2V0QWxpZ25tZW50KHBsYWNlbWVudCkgIT0gbnVsbCAmJiBjZW50ZXIgIT09IG9mZnNldCAmJiByZWN0cy5yZWZlcmVuY2VbbGVuZ3RoXSAvIDIgLSAoY2VudGVyIDwgbWluJDEgPyBtaW5QYWRkaW5nIDogbWF4UGFkZGluZykgLSBhcnJvd0RpbWVuc2lvbnNbbGVuZ3RoXSAvIDIgPCAwO1xuICAgIGNvbnN0IGFsaWdubWVudE9mZnNldCA9IHNob3VsZEFkZE9mZnNldCA/IGNlbnRlciA8IG1pbiQxID8gY2VudGVyIC0gbWluJDEgOiBjZW50ZXIgLSBtYXggOiAwO1xuICAgIHJldHVybiB7XG4gICAgICBbYXhpc106IGNvb3Jkc1theGlzXSArIGFsaWdubWVudE9mZnNldCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgW2F4aXNdOiBvZmZzZXQsXG4gICAgICAgIGNlbnRlck9mZnNldDogY2VudGVyIC0gb2Zmc2V0IC0gYWxpZ25tZW50T2Zmc2V0LFxuICAgICAgICAuLi4oc2hvdWxkQWRkT2Zmc2V0ICYmIHtcbiAgICAgICAgICBhbGlnbm1lbnRPZmZzZXRcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICByZXNldDogc2hvdWxkQWRkT2Zmc2V0XG4gICAgfTtcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIGdldFBsYWNlbWVudExpc3QoYWxpZ25tZW50LCBhdXRvQWxpZ25tZW50LCBhbGxvd2VkUGxhY2VtZW50cykge1xuICBjb25zdCBhbGxvd2VkUGxhY2VtZW50c1NvcnRlZEJ5QWxpZ25tZW50ID0gYWxpZ25tZW50ID8gWy4uLmFsbG93ZWRQbGFjZW1lbnRzLmZpbHRlcihwbGFjZW1lbnQgPT4gZ2V0QWxpZ25tZW50KHBsYWNlbWVudCkgPT09IGFsaWdubWVudCksIC4uLmFsbG93ZWRQbGFjZW1lbnRzLmZpbHRlcihwbGFjZW1lbnQgPT4gZ2V0QWxpZ25tZW50KHBsYWNlbWVudCkgIT09IGFsaWdubWVudCldIDogYWxsb3dlZFBsYWNlbWVudHMuZmlsdGVyKHBsYWNlbWVudCA9PiBnZXRTaWRlKHBsYWNlbWVudCkgPT09IHBsYWNlbWVudCk7XG4gIHJldHVybiBhbGxvd2VkUGxhY2VtZW50c1NvcnRlZEJ5QWxpZ25tZW50LmZpbHRlcihwbGFjZW1lbnQgPT4ge1xuICAgIGlmIChhbGlnbm1lbnQpIHtcbiAgICAgIHJldHVybiBnZXRBbGlnbm1lbnQocGxhY2VtZW50KSA9PT0gYWxpZ25tZW50IHx8IChhdXRvQWxpZ25tZW50ID8gZ2V0T3Bwb3NpdGVBbGlnbm1lbnRQbGFjZW1lbnQocGxhY2VtZW50KSAhPT0gcGxhY2VtZW50IDogZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG4vKipcbiAqIE9wdGltaXplcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCBieSBjaG9vc2luZyB0aGUgcGxhY2VtZW50XG4gKiB0aGF0IGhhcyB0aGUgbW9zdCBzcGFjZSBhdmFpbGFibGUgYXV0b21hdGljYWxseSwgd2l0aG91dCBuZWVkaW5nIHRvIHNwZWNpZnkgYVxuICogcHJlZmVycmVkIHBsYWNlbWVudC4gQWx0ZXJuYXRpdmUgdG8gYGZsaXBgLlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL2F1dG9QbGFjZW1lbnRcbiAqL1xuY29uc3QgYXV0b1BsYWNlbWVudCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnYXV0b1BsYWNlbWVudCcsXG4gICAgb3B0aW9ucyxcbiAgICBhc3luYyBmbihzdGF0ZSkge1xuICAgICAgdmFyIF9taWRkbGV3YXJlRGF0YSRhdXRvUCwgX21pZGRsZXdhcmVEYXRhJGF1dG9QMiwgX3BsYWNlbWVudHNUaGF0Rml0T25FO1xuICAgICAgY29uc3Qge1xuICAgICAgICByZWN0cyxcbiAgICAgICAgbWlkZGxld2FyZURhdGEsXG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNyb3NzQXhpcyA9IGZhbHNlLFxuICAgICAgICBhbGlnbm1lbnQsXG4gICAgICAgIGFsbG93ZWRQbGFjZW1lbnRzID0gcGxhY2VtZW50cyxcbiAgICAgICAgYXV0b0FsaWdubWVudCA9IHRydWUsXG4gICAgICAgIC4uLmRldGVjdE92ZXJmbG93T3B0aW9uc1xuICAgICAgfSA9IGV2YWx1YXRlKG9wdGlvbnMsIHN0YXRlKTtcbiAgICAgIGNvbnN0IHBsYWNlbWVudHMkMSA9IGFsaWdubWVudCAhPT0gdW5kZWZpbmVkIHx8IGFsbG93ZWRQbGFjZW1lbnRzID09PSBwbGFjZW1lbnRzID8gZ2V0UGxhY2VtZW50TGlzdChhbGlnbm1lbnQgfHwgbnVsbCwgYXV0b0FsaWdubWVudCwgYWxsb3dlZFBsYWNlbWVudHMpIDogYWxsb3dlZFBsYWNlbWVudHM7XG4gICAgICBjb25zdCBvdmVyZmxvdyA9IGF3YWl0IHBsYXRmb3JtLmRldGVjdE92ZXJmbG93KHN0YXRlLCBkZXRlY3RPdmVyZmxvd09wdGlvbnMpO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gKChfbWlkZGxld2FyZURhdGEkYXV0b1AgPSBtaWRkbGV3YXJlRGF0YS5hdXRvUGxhY2VtZW50KSA9PSBudWxsID8gdm9pZCAwIDogX21pZGRsZXdhcmVEYXRhJGF1dG9QLmluZGV4KSB8fCAwO1xuICAgICAgY29uc3QgY3VycmVudFBsYWNlbWVudCA9IHBsYWNlbWVudHMkMVtjdXJyZW50SW5kZXhdO1xuICAgICAgaWYgKGN1cnJlbnRQbGFjZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgICBjb25zdCBhbGlnbm1lbnRTaWRlcyA9IGdldEFsaWdubWVudFNpZGVzKGN1cnJlbnRQbGFjZW1lbnQsIHJlY3RzLCBhd2FpdCAocGxhdGZvcm0uaXNSVEwgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmlzUlRMKGVsZW1lbnRzLmZsb2F0aW5nKSkpO1xuXG4gICAgICAvLyBNYWtlIGBjb21wdXRlQ29vcmRzYCBzdGFydCBmcm9tIHRoZSByaWdodCBwbGFjZS5cbiAgICAgIGlmIChwbGFjZW1lbnQgIT09IGN1cnJlbnRQbGFjZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXNldDoge1xuICAgICAgICAgICAgcGxhY2VtZW50OiBwbGFjZW1lbnRzJDFbMF1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50T3ZlcmZsb3dzID0gW292ZXJmbG93W2dldFNpZGUoY3VycmVudFBsYWNlbWVudCldLCBvdmVyZmxvd1thbGlnbm1lbnRTaWRlc1swXV0sIG92ZXJmbG93W2FsaWdubWVudFNpZGVzWzFdXV07XG4gICAgICBjb25zdCBhbGxPdmVyZmxvd3MgPSBbLi4uKCgoX21pZGRsZXdhcmVEYXRhJGF1dG9QMiA9IG1pZGRsZXdhcmVEYXRhLmF1dG9QbGFjZW1lbnQpID09IG51bGwgPyB2b2lkIDAgOiBfbWlkZGxld2FyZURhdGEkYXV0b1AyLm92ZXJmbG93cykgfHwgW10pLCB7XG4gICAgICAgIHBsYWNlbWVudDogY3VycmVudFBsYWNlbWVudCxcbiAgICAgICAgb3ZlcmZsb3dzOiBjdXJyZW50T3ZlcmZsb3dzXG4gICAgICB9XTtcbiAgICAgIGNvbnN0IG5leHRQbGFjZW1lbnQgPSBwbGFjZW1lbnRzJDFbY3VycmVudEluZGV4ICsgMV07XG5cbiAgICAgIC8vIFRoZXJlIGFyZSBtb3JlIHBsYWNlbWVudHMgdG8gY2hlY2suXG4gICAgICBpZiAobmV4dFBsYWNlbWVudCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGluZGV4OiBjdXJyZW50SW5kZXggKyAxLFxuICAgICAgICAgICAgb3ZlcmZsb3dzOiBhbGxPdmVyZmxvd3NcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2V0OiB7XG4gICAgICAgICAgICBwbGFjZW1lbnQ6IG5leHRQbGFjZW1lbnRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwbGFjZW1lbnRzU29ydGVkQnlNb3N0U3BhY2UgPSBhbGxPdmVyZmxvd3MubWFwKGQgPT4ge1xuICAgICAgICBjb25zdCBhbGlnbm1lbnQgPSBnZXRBbGlnbm1lbnQoZC5wbGFjZW1lbnQpO1xuICAgICAgICByZXR1cm4gW2QucGxhY2VtZW50LCBhbGlnbm1lbnQgJiYgY3Jvc3NBeGlzID9cbiAgICAgICAgLy8gQ2hlY2sgYWxvbmcgdGhlIG1haW5BeGlzIGFuZCBtYWluIGNyb3NzQXhpcyBzaWRlLlxuICAgICAgICBkLm92ZXJmbG93cy5zbGljZSgwLCAyKS5yZWR1Y2UoKGFjYywgdikgPT4gYWNjICsgdiwgMCkgOlxuICAgICAgICAvLyBDaGVjayBvbmx5IHRoZSBtYWluQXhpcy5cbiAgICAgICAgZC5vdmVyZmxvd3NbMF0sIGQub3ZlcmZsb3dzXTtcbiAgICAgIH0pLnNvcnQoKGEsIGIpID0+IGFbMV0gLSBiWzFdKTtcbiAgICAgIGNvbnN0IHBsYWNlbWVudHNUaGF0Rml0T25FYWNoU2lkZSA9IHBsYWNlbWVudHNTb3J0ZWRCeU1vc3RTcGFjZS5maWx0ZXIoZCA9PiBkWzJdLnNsaWNlKDAsXG4gICAgICAvLyBBbGlnbmVkIHBsYWNlbWVudHMgc2hvdWxkIG5vdCBjaGVjayB0aGVpciBvcHBvc2l0ZSBjcm9zc0F4aXNcbiAgICAgIC8vIHNpZGUuXG4gICAgICBnZXRBbGlnbm1lbnQoZFswXSkgPyAyIDogMykuZXZlcnkodiA9PiB2IDw9IDApKTtcbiAgICAgIGNvbnN0IHJlc2V0UGxhY2VtZW50ID0gKChfcGxhY2VtZW50c1RoYXRGaXRPbkUgPSBwbGFjZW1lbnRzVGhhdEZpdE9uRWFjaFNpZGVbMF0pID09IG51bGwgPyB2b2lkIDAgOiBfcGxhY2VtZW50c1RoYXRGaXRPbkVbMF0pIHx8IHBsYWNlbWVudHNTb3J0ZWRCeU1vc3RTcGFjZVswXVswXTtcbiAgICAgIGlmIChyZXNldFBsYWNlbWVudCAhPT0gcGxhY2VtZW50KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgaW5kZXg6IGN1cnJlbnRJbmRleCArIDEsXG4gICAgICAgICAgICBvdmVyZmxvd3M6IGFsbE92ZXJmbG93c1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgIHBsYWNlbWVudDogcmVzZXRQbGFjZW1lbnRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xufTtcblxuLyoqXG4gKiBPcHRpbWl6ZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQgYnkgZmxpcHBpbmcgdGhlIGBwbGFjZW1lbnRgXG4gKiBpbiBvcmRlciB0byBrZWVwIGl0IGluIHZpZXcgd2hlbiB0aGUgcHJlZmVycmVkIHBsYWNlbWVudChzKSB3aWxsIG92ZXJmbG93IHRoZVxuICogY2xpcHBpbmcgYm91bmRhcnkuIEFsdGVybmF0aXZlIHRvIGBhdXRvUGxhY2VtZW50YC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9mbGlwXG4gKi9cbmNvbnN0IGZsaXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2ZsaXAnLFxuICAgIG9wdGlvbnMsXG4gICAgYXN5bmMgZm4oc3RhdGUpIHtcbiAgICAgIHZhciBfbWlkZGxld2FyZURhdGEkYXJyb3csIF9taWRkbGV3YXJlRGF0YSRmbGlwO1xuICAgICAgY29uc3Qge1xuICAgICAgICBwbGFjZW1lbnQsXG4gICAgICAgIG1pZGRsZXdhcmVEYXRhLFxuICAgICAgICByZWN0cyxcbiAgICAgICAgaW5pdGlhbFBsYWNlbWVudCxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1haW5BeGlzOiBjaGVja01haW5BeGlzID0gdHJ1ZSxcbiAgICAgICAgY3Jvc3NBeGlzOiBjaGVja0Nyb3NzQXhpcyA9IHRydWUsXG4gICAgICAgIGZhbGxiYWNrUGxhY2VtZW50czogc3BlY2lmaWVkRmFsbGJhY2tQbGFjZW1lbnRzLFxuICAgICAgICBmYWxsYmFja1N0cmF0ZWd5ID0gJ2Jlc3RGaXQnLFxuICAgICAgICBmYWxsYmFja0F4aXNTaWRlRGlyZWN0aW9uID0gJ25vbmUnLFxuICAgICAgICBmbGlwQWxpZ25tZW50ID0gdHJ1ZSxcbiAgICAgICAgLi4uZGV0ZWN0T3ZlcmZsb3dPcHRpb25zXG4gICAgICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpO1xuXG4gICAgICAvLyBJZiBhIHJlc2V0IGJ5IHRoZSBhcnJvdyB3YXMgY2F1c2VkIGR1ZSB0byBhbiBhbGlnbm1lbnQgb2Zmc2V0IGJlaW5nXG4gICAgICAvLyBhZGRlZCwgd2Ugc2hvdWxkIHNraXAgYW55IGxvZ2ljIG5vdyBzaW5jZSBgZmxpcCgpYCBoYXMgYWxyZWFkeSBkb25lIGl0c1xuICAgICAgLy8gd29yay5cbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mbG9hdGluZy11aS9mbG9hdGluZy11aS9pc3N1ZXMvMjU0OSNpc3N1ZWNvbW1lbnQtMTcxOTYwMTY0M1xuICAgICAgaWYgKChfbWlkZGxld2FyZURhdGEkYXJyb3cgPSBtaWRkbGV3YXJlRGF0YS5hcnJvdykgIT0gbnVsbCAmJiBfbWlkZGxld2FyZURhdGEkYXJyb3cuYWxpZ25tZW50T2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gICAgICBjb25zdCBpbml0aWFsU2lkZUF4aXMgPSBnZXRTaWRlQXhpcyhpbml0aWFsUGxhY2VtZW50KTtcbiAgICAgIGNvbnN0IGlzQmFzZVBsYWNlbWVudCA9IGdldFNpZGUoaW5pdGlhbFBsYWNlbWVudCkgPT09IGluaXRpYWxQbGFjZW1lbnQ7XG4gICAgICBjb25zdCBydGwgPSBhd2FpdCAocGxhdGZvcm0uaXNSVEwgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmlzUlRMKGVsZW1lbnRzLmZsb2F0aW5nKSk7XG4gICAgICBjb25zdCBmYWxsYmFja1BsYWNlbWVudHMgPSBzcGVjaWZpZWRGYWxsYmFja1BsYWNlbWVudHMgfHwgKGlzQmFzZVBsYWNlbWVudCB8fCAhZmxpcEFsaWdubWVudCA/IFtnZXRPcHBvc2l0ZVBsYWNlbWVudChpbml0aWFsUGxhY2VtZW50KV0gOiBnZXRFeHBhbmRlZFBsYWNlbWVudHMoaW5pdGlhbFBsYWNlbWVudCkpO1xuICAgICAgY29uc3QgaGFzRmFsbGJhY2tBeGlzU2lkZURpcmVjdGlvbiA9IGZhbGxiYWNrQXhpc1NpZGVEaXJlY3Rpb24gIT09ICdub25lJztcbiAgICAgIGlmICghc3BlY2lmaWVkRmFsbGJhY2tQbGFjZW1lbnRzICYmIGhhc0ZhbGxiYWNrQXhpc1NpZGVEaXJlY3Rpb24pIHtcbiAgICAgICAgZmFsbGJhY2tQbGFjZW1lbnRzLnB1c2goLi4uZ2V0T3Bwb3NpdGVBeGlzUGxhY2VtZW50cyhpbml0aWFsUGxhY2VtZW50LCBmbGlwQWxpZ25tZW50LCBmYWxsYmFja0F4aXNTaWRlRGlyZWN0aW9uLCBydGwpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBsYWNlbWVudHMgPSBbaW5pdGlhbFBsYWNlbWVudCwgLi4uZmFsbGJhY2tQbGFjZW1lbnRzXTtcbiAgICAgIGNvbnN0IG92ZXJmbG93ID0gYXdhaXQgcGxhdGZvcm0uZGV0ZWN0T3ZlcmZsb3coc3RhdGUsIGRldGVjdE92ZXJmbG93T3B0aW9ucyk7XG4gICAgICBjb25zdCBvdmVyZmxvd3MgPSBbXTtcbiAgICAgIGxldCBvdmVyZmxvd3NEYXRhID0gKChfbWlkZGxld2FyZURhdGEkZmxpcCA9IG1pZGRsZXdhcmVEYXRhLmZsaXApID09IG51bGwgPyB2b2lkIDAgOiBfbWlkZGxld2FyZURhdGEkZmxpcC5vdmVyZmxvd3MpIHx8IFtdO1xuICAgICAgaWYgKGNoZWNrTWFpbkF4aXMpIHtcbiAgICAgICAgb3ZlcmZsb3dzLnB1c2gob3ZlcmZsb3dbc2lkZV0pO1xuICAgICAgfVxuICAgICAgaWYgKGNoZWNrQ3Jvc3NBeGlzKSB7XG4gICAgICAgIGNvbnN0IHNpZGVzID0gZ2V0QWxpZ25tZW50U2lkZXMocGxhY2VtZW50LCByZWN0cywgcnRsKTtcbiAgICAgICAgb3ZlcmZsb3dzLnB1c2gob3ZlcmZsb3dbc2lkZXNbMF1dLCBvdmVyZmxvd1tzaWRlc1sxXV0pO1xuICAgICAgfVxuICAgICAgb3ZlcmZsb3dzRGF0YSA9IFsuLi5vdmVyZmxvd3NEYXRhLCB7XG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgb3ZlcmZsb3dzXG4gICAgICB9XTtcblxuICAgICAgLy8gT25lIG9yIG1vcmUgc2lkZXMgaXMgb3ZlcmZsb3dpbmcuXG4gICAgICBpZiAoIW92ZXJmbG93cy5ldmVyeShzaWRlID0+IHNpZGUgPD0gMCkpIHtcbiAgICAgICAgdmFyIF9taWRkbGV3YXJlRGF0YSRmbGlwMiwgX292ZXJmbG93c0RhdGEkZmlsdGVyO1xuICAgICAgICBjb25zdCBuZXh0SW5kZXggPSAoKChfbWlkZGxld2FyZURhdGEkZmxpcDIgPSBtaWRkbGV3YXJlRGF0YS5mbGlwKSA9PSBudWxsID8gdm9pZCAwIDogX21pZGRsZXdhcmVEYXRhJGZsaXAyLmluZGV4KSB8fCAwKSArIDE7XG4gICAgICAgIGNvbnN0IG5leHRQbGFjZW1lbnQgPSBwbGFjZW1lbnRzW25leHRJbmRleF07XG4gICAgICAgIGlmIChuZXh0UGxhY2VtZW50KSB7XG4gICAgICAgICAgY29uc3QgaWdub3JlQ3Jvc3NBeGlzT3ZlcmZsb3cgPSBjaGVja0Nyb3NzQXhpcyA9PT0gJ2FsaWdubWVudCcgPyBpbml0aWFsU2lkZUF4aXMgIT09IGdldFNpZGVBeGlzKG5leHRQbGFjZW1lbnQpIDogZmFsc2U7XG4gICAgICAgICAgaWYgKCFpZ25vcmVDcm9zc0F4aXNPdmVyZmxvdyB8fFxuICAgICAgICAgIC8vIFdlIGxlYXZlIHRoZSBjdXJyZW50IG1haW4gYXhpcyBvbmx5IGlmIGV2ZXJ5IHBsYWNlbWVudCBvbiB0aGF0IGF4aXNcbiAgICAgICAgICAvLyBvdmVyZmxvd3MgdGhlIG1haW4gYXhpcy5cbiAgICAgICAgICBvdmVyZmxvd3NEYXRhLmV2ZXJ5KGQgPT4gZ2V0U2lkZUF4aXMoZC5wbGFjZW1lbnQpID09PSBpbml0aWFsU2lkZUF4aXMgPyBkLm92ZXJmbG93c1swXSA+IDAgOiB0cnVlKSkge1xuICAgICAgICAgICAgLy8gVHJ5IG5leHQgcGxhY2VtZW50IGFuZCByZS1ydW4gdGhlIGxpZmVjeWNsZS5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBpbmRleDogbmV4dEluZGV4LFxuICAgICAgICAgICAgICAgIG92ZXJmbG93czogb3ZlcmZsb3dzRGF0YVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICByZXNldDoge1xuICAgICAgICAgICAgICAgIHBsYWNlbWVudDogbmV4dFBsYWNlbWVudFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcnN0LCBmaW5kIHRoZSBjYW5kaWRhdGVzIHRoYXQgZml0IG9uIHRoZSBtYWluQXhpcyBzaWRlIG9mIG92ZXJmbG93LFxuICAgICAgICAvLyB0aGVuIGZpbmQgdGhlIHBsYWNlbWVudCB0aGF0IGZpdHMgdGhlIGJlc3Qgb24gdGhlIG1haW4gY3Jvc3NBeGlzIHNpZGUuXG4gICAgICAgIGxldCByZXNldFBsYWNlbWVudCA9IChfb3ZlcmZsb3dzRGF0YSRmaWx0ZXIgPSBvdmVyZmxvd3NEYXRhLmZpbHRlcihkID0+IGQub3ZlcmZsb3dzWzBdIDw9IDApLnNvcnQoKGEsIGIpID0+IGEub3ZlcmZsb3dzWzFdIC0gYi5vdmVyZmxvd3NbMV0pWzBdKSA9PSBudWxsID8gdm9pZCAwIDogX292ZXJmbG93c0RhdGEkZmlsdGVyLnBsYWNlbWVudDtcblxuICAgICAgICAvLyBPdGhlcndpc2UgZmFsbGJhY2suXG4gICAgICAgIGlmICghcmVzZXRQbGFjZW1lbnQpIHtcbiAgICAgICAgICBzd2l0Y2ggKGZhbGxiYWNrU3RyYXRlZ3kpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Jlc3RGaXQnOlxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyIF9vdmVyZmxvd3NEYXRhJGZpbHRlcjI7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhY2VtZW50ID0gKF9vdmVyZmxvd3NEYXRhJGZpbHRlcjIgPSBvdmVyZmxvd3NEYXRhLmZpbHRlcihkID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChoYXNGYWxsYmFja0F4aXNTaWRlRGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTaWRlQXhpcyA9IGdldFNpZGVBeGlzKGQucGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTaWRlQXhpcyA9PT0gaW5pdGlhbFNpZGVBeGlzIHx8XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIGJpYXMgdG8gdGhlIGB5YCBzaWRlIGF4aXMgZHVlIHRvIGhvcml6b250YWxcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVhZGluZyBkaXJlY3Rpb25zIGZhdm9yaW5nIGdyZWF0ZXIgd2lkdGguXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTaWRlQXhpcyA9PT0gJ3knO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSkubWFwKGQgPT4gW2QucGxhY2VtZW50LCBkLm92ZXJmbG93cy5maWx0ZXIob3ZlcmZsb3cgPT4gb3ZlcmZsb3cgPiAwKS5yZWR1Y2UoKGFjYywgb3ZlcmZsb3cpID0+IGFjYyArIG92ZXJmbG93LCAwKV0pLnNvcnQoKGEsIGIpID0+IGFbMV0gLSBiWzFdKVswXSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9vdmVyZmxvd3NEYXRhJGZpbHRlcjJbMF07XG4gICAgICAgICAgICAgICAgaWYgKHBsYWNlbWVudCkge1xuICAgICAgICAgICAgICAgICAgcmVzZXRQbGFjZW1lbnQgPSBwbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdpbml0aWFsUGxhY2VtZW50JzpcbiAgICAgICAgICAgICAgcmVzZXRQbGFjZW1lbnQgPSBpbml0aWFsUGxhY2VtZW50O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBsYWNlbWVudCAhPT0gcmVzZXRQbGFjZW1lbnQpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgICAgcGxhY2VtZW50OiByZXNldFBsYWNlbWVudFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH07XG59O1xuXG5mdW5jdGlvbiBnZXRTaWRlT2Zmc2V0cyhvdmVyZmxvdywgcmVjdCkge1xuICByZXR1cm4ge1xuICAgIHRvcDogb3ZlcmZsb3cudG9wIC0gcmVjdC5oZWlnaHQsXG4gICAgcmlnaHQ6IG92ZXJmbG93LnJpZ2h0IC0gcmVjdC53aWR0aCxcbiAgICBib3R0b206IG92ZXJmbG93LmJvdHRvbSAtIHJlY3QuaGVpZ2h0LFxuICAgIGxlZnQ6IG92ZXJmbG93LmxlZnQgLSByZWN0LndpZHRoXG4gIH07XG59XG5mdW5jdGlvbiBpc0FueVNpZGVGdWxseUNsaXBwZWQob3ZlcmZsb3cpIHtcbiAgcmV0dXJuIHNpZGVzLnNvbWUoc2lkZSA9PiBvdmVyZmxvd1tzaWRlXSA+PSAwKTtcbn1cbi8qKlxuICogUHJvdmlkZXMgZGF0YSB0byBoaWRlIHRoZSBmbG9hdGluZyBlbGVtZW50IGluIGFwcGxpY2FibGUgc2l0dWF0aW9ucywgc3VjaCBhc1xuICogd2hlbiBpdCBpcyBub3QgaW4gdGhlIHNhbWUgY2xpcHBpbmcgY29udGV4dCBhcyB0aGUgcmVmZXJlbmNlIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvaGlkZVxuICovXG5jb25zdCBoaWRlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdoaWRlJyxcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHJlY3RzLFxuICAgICAgICBwbGF0Zm9ybVxuICAgICAgfSA9IHN0YXRlO1xuICAgICAgY29uc3Qge1xuICAgICAgICBzdHJhdGVneSA9ICdyZWZlcmVuY2VIaWRkZW4nLFxuICAgICAgICAuLi5kZXRlY3RPdmVyZmxvd09wdGlvbnNcbiAgICAgIH0gPSBldmFsdWF0ZShvcHRpb25zLCBzdGF0ZSk7XG4gICAgICBzd2l0Y2ggKHN0cmF0ZWd5KSB7XG4gICAgICAgIGNhc2UgJ3JlZmVyZW5jZUhpZGRlbic6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgb3ZlcmZsb3cgPSBhd2FpdCBwbGF0Zm9ybS5kZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgICAgICAgICAuLi5kZXRlY3RPdmVyZmxvd09wdGlvbnMsXG4gICAgICAgICAgICAgIGVsZW1lbnRDb250ZXh0OiAncmVmZXJlbmNlJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvZmZzZXRzID0gZ2V0U2lkZU9mZnNldHMob3ZlcmZsb3csIHJlY3RzLnJlZmVyZW5jZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlSGlkZGVuT2Zmc2V0czogb2Zmc2V0cyxcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VIaWRkZW46IGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChvZmZzZXRzKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSAnZXNjYXBlZCc6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgb3ZlcmZsb3cgPSBhd2FpdCBwbGF0Zm9ybS5kZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgICAgICAgICAuLi5kZXRlY3RPdmVyZmxvd09wdGlvbnMsXG4gICAgICAgICAgICAgIGFsdEJvdW5kYXJ5OiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG9mZnNldHMgPSBnZXRTaWRlT2Zmc2V0cyhvdmVyZmxvdywgcmVjdHMuZmxvYXRpbmcpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGVzY2FwZWRPZmZzZXRzOiBvZmZzZXRzLFxuICAgICAgICAgICAgICAgIGVzY2FwZWQ6IGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChvZmZzZXRzKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGdldEJvdW5kaW5nUmVjdChyZWN0cykge1xuICBjb25zdCBtaW5YID0gbWluKC4uLnJlY3RzLm1hcChyZWN0ID0+IHJlY3QubGVmdCkpO1xuICBjb25zdCBtaW5ZID0gbWluKC4uLnJlY3RzLm1hcChyZWN0ID0+IHJlY3QudG9wKSk7XG4gIGNvbnN0IG1heFggPSBtYXgoLi4ucmVjdHMubWFwKHJlY3QgPT4gcmVjdC5yaWdodCkpO1xuICBjb25zdCBtYXhZID0gbWF4KC4uLnJlY3RzLm1hcChyZWN0ID0+IHJlY3QuYm90dG9tKSk7XG4gIHJldHVybiB7XG4gICAgeDogbWluWCxcbiAgICB5OiBtaW5ZLFxuICAgIHdpZHRoOiBtYXhYIC0gbWluWCxcbiAgICBoZWlnaHQ6IG1heFkgLSBtaW5ZXG4gIH07XG59XG5mdW5jdGlvbiBnZXRSZWN0c0J5TGluZShyZWN0cykge1xuICBjb25zdCBzb3J0ZWRSZWN0cyA9IHJlY3RzLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYS55IC0gYi55KTtcbiAgY29uc3QgZ3JvdXBzID0gW107XG4gIGxldCBwcmV2UmVjdCA9IG51bGw7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc29ydGVkUmVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByZWN0ID0gc29ydGVkUmVjdHNbaV07XG4gICAgaWYgKCFwcmV2UmVjdCB8fCByZWN0LnkgLSBwcmV2UmVjdC55ID4gcHJldlJlY3QuaGVpZ2h0IC8gMikge1xuICAgICAgZ3JvdXBzLnB1c2goW3JlY3RdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ3JvdXBzW2dyb3Vwcy5sZW5ndGggLSAxXS5wdXNoKHJlY3QpO1xuICAgIH1cbiAgICBwcmV2UmVjdCA9IHJlY3Q7XG4gIH1cbiAgcmV0dXJuIGdyb3Vwcy5tYXAocmVjdCA9PiByZWN0VG9DbGllbnRSZWN0KGdldEJvdW5kaW5nUmVjdChyZWN0KSkpO1xufVxuLyoqXG4gKiBQcm92aWRlcyBpbXByb3ZlZCBwb3NpdGlvbmluZyBmb3IgaW5saW5lIHJlZmVyZW5jZSBlbGVtZW50cyB0aGF0IGNhbiBzcGFuXG4gKiBvdmVyIG11bHRpcGxlIGxpbmVzLCBzdWNoIGFzIGh5cGVybGlua3Mgb3IgcmFuZ2Ugc2VsZWN0aW9ucy5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9pbmxpbmVcbiAqL1xuY29uc3QgaW5saW5lID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdpbmxpbmUnLFxuICAgIG9wdGlvbnMsXG4gICAgYXN5bmMgZm4oc3RhdGUpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICBlbGVtZW50cyxcbiAgICAgICAgcmVjdHMsXG4gICAgICAgIHBsYXRmb3JtLFxuICAgICAgICBzdHJhdGVneVxuICAgICAgfSA9IHN0YXRlO1xuICAgICAgLy8gQSBNb3VzZUV2ZW50J3MgY2xpZW50e1gsWX0gY29vcmRzIGNhbiBiZSB1cCB0byAyIHBpeGVscyBvZmYgYVxuICAgICAgLy8gQ2xpZW50UmVjdCdzIGJvdW5kcywgZGVzcGl0ZSB0aGUgZXZlbnQgbGlzdGVuZXIgYmVpbmcgdHJpZ2dlcmVkLiBBXG4gICAgICAvLyBwYWRkaW5nIG9mIDIgc2VlbXMgdG8gaGFuZGxlIHRoaXMgaXNzdWUuXG4gICAgICBjb25zdCB7XG4gICAgICAgIHBhZGRpbmcgPSAyLFxuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpO1xuICAgICAgY29uc3QgbmF0aXZlQ2xpZW50UmVjdHMgPSBBcnJheS5mcm9tKChhd2FpdCAocGxhdGZvcm0uZ2V0Q2xpZW50UmVjdHMgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmdldENsaWVudFJlY3RzKGVsZW1lbnRzLnJlZmVyZW5jZSkpKSB8fCBbXSk7XG4gICAgICBjb25zdCBjbGllbnRSZWN0cyA9IGdldFJlY3RzQnlMaW5lKG5hdGl2ZUNsaWVudFJlY3RzKTtcbiAgICAgIGNvbnN0IGZhbGxiYWNrID0gcmVjdFRvQ2xpZW50UmVjdChnZXRCb3VuZGluZ1JlY3QobmF0aXZlQ2xpZW50UmVjdHMpKTtcbiAgICAgIGNvbnN0IHBhZGRpbmdPYmplY3QgPSBnZXRQYWRkaW5nT2JqZWN0KHBhZGRpbmcpO1xuICAgICAgZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkge1xuICAgICAgICAvLyBUaGVyZSBhcmUgdHdvIHJlY3RzIGFuZCB0aGV5IGFyZSBkaXNqb2luZWQuXG4gICAgICAgIGlmIChjbGllbnRSZWN0cy5sZW5ndGggPT09IDIgJiYgY2xpZW50UmVjdHNbMF0ubGVmdCA+IGNsaWVudFJlY3RzWzFdLnJpZ2h0ICYmIHggIT0gbnVsbCAmJiB5ICE9IG51bGwpIHtcbiAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCByZWN0IGluIHdoaWNoIHRoZSBwb2ludCBpcyBmdWxseSBpbnNpZGUuXG4gICAgICAgICAgcmV0dXJuIGNsaWVudFJlY3RzLmZpbmQocmVjdCA9PiB4ID4gcmVjdC5sZWZ0IC0gcGFkZGluZ09iamVjdC5sZWZ0ICYmIHggPCByZWN0LnJpZ2h0ICsgcGFkZGluZ09iamVjdC5yaWdodCAmJiB5ID4gcmVjdC50b3AgLSBwYWRkaW5nT2JqZWN0LnRvcCAmJiB5IDwgcmVjdC5ib3R0b20gKyBwYWRkaW5nT2JqZWN0LmJvdHRvbSkgfHwgZmFsbGJhY2s7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVyZSBhcmUgMiBvciBtb3JlIGNvbm5lY3RlZCByZWN0cy5cbiAgICAgICAgaWYgKGNsaWVudFJlY3RzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgaWYgKGdldFNpZGVBeGlzKHBsYWNlbWVudCkgPT09ICd5Jykge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RSZWN0ID0gY2xpZW50UmVjdHNbMF07XG4gICAgICAgICAgICBjb25zdCBsYXN0UmVjdCA9IGNsaWVudFJlY3RzW2NsaWVudFJlY3RzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgY29uc3QgaXNUb3AgPSBnZXRTaWRlKHBsYWNlbWVudCkgPT09ICd0b3AnO1xuICAgICAgICAgICAgY29uc3QgdG9wID0gZmlyc3RSZWN0LnRvcDtcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IGxhc3RSZWN0LmJvdHRvbTtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSBpc1RvcCA/IGZpcnN0UmVjdC5sZWZ0IDogbGFzdFJlY3QubGVmdDtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gaXNUb3AgPyBmaXJzdFJlY3QucmlnaHQgOiBsYXN0UmVjdC5yaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgICBib3R0b20sXG4gICAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgICB4OiBsZWZ0LFxuICAgICAgICAgICAgICB5OiB0b3BcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGlzTGVmdFNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCkgPT09ICdsZWZ0JztcbiAgICAgICAgICBjb25zdCBtYXhSaWdodCA9IG1heCguLi5jbGllbnRSZWN0cy5tYXAocmVjdCA9PiByZWN0LnJpZ2h0KSk7XG4gICAgICAgICAgY29uc3QgbWluTGVmdCA9IG1pbiguLi5jbGllbnRSZWN0cy5tYXAocmVjdCA9PiByZWN0LmxlZnQpKTtcbiAgICAgICAgICBjb25zdCBtZWFzdXJlUmVjdHMgPSBjbGllbnRSZWN0cy5maWx0ZXIocmVjdCA9PiBpc0xlZnRTaWRlID8gcmVjdC5sZWZ0ID09PSBtaW5MZWZ0IDogcmVjdC5yaWdodCA9PT0gbWF4UmlnaHQpO1xuICAgICAgICAgIGNvbnN0IHRvcCA9IG1lYXN1cmVSZWN0c1swXS50b3A7XG4gICAgICAgICAgY29uc3QgYm90dG9tID0gbWVhc3VyZVJlY3RzW21lYXN1cmVSZWN0cy5sZW5ndGggLSAxXS5ib3R0b207XG4gICAgICAgICAgY29uc3QgbGVmdCA9IG1pbkxlZnQ7XG4gICAgICAgICAgY29uc3QgcmlnaHQgPSBtYXhSaWdodDtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcbiAgICAgICAgICBjb25zdCBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICByaWdodCxcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgeDogbGVmdCxcbiAgICAgICAgICAgIHk6IHRvcFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzZXRSZWN0cyA9IGF3YWl0IHBsYXRmb3JtLmdldEVsZW1lbnRSZWN0cyh7XG4gICAgICAgIHJlZmVyZW5jZToge1xuICAgICAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdFxuICAgICAgICB9LFxuICAgICAgICBmbG9hdGluZzogZWxlbWVudHMuZmxvYXRpbmcsXG4gICAgICAgIHN0cmF0ZWd5XG4gICAgICB9KTtcbiAgICAgIGlmIChyZWN0cy5yZWZlcmVuY2UueCAhPT0gcmVzZXRSZWN0cy5yZWZlcmVuY2UueCB8fCByZWN0cy5yZWZlcmVuY2UueSAhPT0gcmVzZXRSZWN0cy5yZWZlcmVuY2UueSB8fCByZWN0cy5yZWZlcmVuY2Uud2lkdGggIT09IHJlc2V0UmVjdHMucmVmZXJlbmNlLndpZHRoIHx8IHJlY3RzLnJlZmVyZW5jZS5oZWlnaHQgIT09IHJlc2V0UmVjdHMucmVmZXJlbmNlLmhlaWdodCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc2V0OiB7XG4gICAgICAgICAgICByZWN0czogcmVzZXRSZWN0c1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH07XG59O1xuXG5jb25zdCBvcmlnaW5TaWRlcyA9IC8qI19fUFVSRV9fKi9uZXcgU2V0KFsnbGVmdCcsICd0b3AnXSk7XG5cbi8vIEZvciB0eXBlIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5LCB0aGUgYE9mZnNldE9wdGlvbnNgIHR5cGUgd2FzIGFsc29cbi8vIERlcml2YWJsZS5cblxuYXN5bmMgZnVuY3Rpb24gY29udmVydFZhbHVlVG9Db29yZHMoc3RhdGUsIG9wdGlvbnMpIHtcbiAgY29uc3Qge1xuICAgIHBsYWNlbWVudCxcbiAgICBwbGF0Zm9ybSxcbiAgICBlbGVtZW50c1xuICB9ID0gc3RhdGU7XG4gIGNvbnN0IHJ0bCA9IGF3YWl0IChwbGF0Zm9ybS5pc1JUTCA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0uaXNSVEwoZWxlbWVudHMuZmxvYXRpbmcpKTtcbiAgY29uc3Qgc2lkZSA9IGdldFNpZGUocGxhY2VtZW50KTtcbiAgY29uc3QgYWxpZ25tZW50ID0gZ2V0QWxpZ25tZW50KHBsYWNlbWVudCk7XG4gIGNvbnN0IGlzVmVydGljYWwgPSBnZXRTaWRlQXhpcyhwbGFjZW1lbnQpID09PSAneSc7XG4gIGNvbnN0IG1haW5BeGlzTXVsdGkgPSBvcmlnaW5TaWRlcy5oYXMoc2lkZSkgPyAtMSA6IDE7XG4gIGNvbnN0IGNyb3NzQXhpc011bHRpID0gcnRsICYmIGlzVmVydGljYWwgPyAtMSA6IDE7XG4gIGNvbnN0IHJhd1ZhbHVlID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItY29uc3RcbiAgbGV0IHtcbiAgICBtYWluQXhpcyxcbiAgICBjcm9zc0F4aXMsXG4gICAgYWxpZ25tZW50QXhpc1xuICB9ID0gdHlwZW9mIHJhd1ZhbHVlID09PSAnbnVtYmVyJyA/IHtcbiAgICBtYWluQXhpczogcmF3VmFsdWUsXG4gICAgY3Jvc3NBeGlzOiAwLFxuICAgIGFsaWdubWVudEF4aXM6IG51bGxcbiAgfSA6IHtcbiAgICBtYWluQXhpczogcmF3VmFsdWUubWFpbkF4aXMgfHwgMCxcbiAgICBjcm9zc0F4aXM6IHJhd1ZhbHVlLmNyb3NzQXhpcyB8fCAwLFxuICAgIGFsaWdubWVudEF4aXM6IHJhd1ZhbHVlLmFsaWdubWVudEF4aXNcbiAgfTtcbiAgaWYgKGFsaWdubWVudCAmJiB0eXBlb2YgYWxpZ25tZW50QXhpcyA9PT0gJ251bWJlcicpIHtcbiAgICBjcm9zc0F4aXMgPSBhbGlnbm1lbnQgPT09ICdlbmQnID8gYWxpZ25tZW50QXhpcyAqIC0xIDogYWxpZ25tZW50QXhpcztcbiAgfVxuICByZXR1cm4gaXNWZXJ0aWNhbCA/IHtcbiAgICB4OiBjcm9zc0F4aXMgKiBjcm9zc0F4aXNNdWx0aSxcbiAgICB5OiBtYWluQXhpcyAqIG1haW5BeGlzTXVsdGlcbiAgfSA6IHtcbiAgICB4OiBtYWluQXhpcyAqIG1haW5BeGlzTXVsdGksXG4gICAgeTogY3Jvc3NBeGlzICogY3Jvc3NBeGlzTXVsdGlcbiAgfTtcbn1cblxuLyoqXG4gKiBNb2RpZmllcyB0aGUgcGxhY2VtZW50IGJ5IHRyYW5zbGF0aW5nIHRoZSBmbG9hdGluZyBlbGVtZW50IGFsb25nIHRoZVxuICogc3BlY2lmaWVkIGF4ZXMuXG4gKiBBIG51bWJlciAoc2hvcnRoYW5kIGZvciBgbWFpbkF4aXNgIG9yIGRpc3RhbmNlKSwgb3IgYW4gYXhlcyBjb25maWd1cmF0aW9uXG4gKiBvYmplY3QgbWF5IGJlIHBhc3NlZC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9vZmZzZXRcbiAqL1xuY29uc3Qgb2Zmc2V0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSAwO1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ29mZnNldCcsXG4gICAgb3B0aW9ucyxcbiAgICBhc3luYyBmbihzdGF0ZSkge1xuICAgICAgdmFyIF9taWRkbGV3YXJlRGF0YSRvZmZzZSwgX21pZGRsZXdhcmVEYXRhJGFycm93O1xuICAgICAgY29uc3Qge1xuICAgICAgICB4LFxuICAgICAgICB5LFxuICAgICAgICBwbGFjZW1lbnQsXG4gICAgICAgIG1pZGRsZXdhcmVEYXRhXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBjb25zdCBkaWZmQ29vcmRzID0gYXdhaXQgY29udmVydFZhbHVlVG9Db29yZHMoc3RhdGUsIG9wdGlvbnMpO1xuXG4gICAgICAvLyBJZiB0aGUgcGxhY2VtZW50IGlzIHRoZSBzYW1lIGFuZCB0aGUgYXJyb3cgY2F1c2VkIGFuIGFsaWdubWVudCBvZmZzZXRcbiAgICAgIC8vIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBjaGFuZ2UgdGhlIHBvc2l0aW9uaW5nIGNvb3JkaW5hdGVzLlxuICAgICAgaWYgKHBsYWNlbWVudCA9PT0gKChfbWlkZGxld2FyZURhdGEkb2Zmc2UgPSBtaWRkbGV3YXJlRGF0YS5vZmZzZXQpID09IG51bGwgPyB2b2lkIDAgOiBfbWlkZGxld2FyZURhdGEkb2Zmc2UucGxhY2VtZW50KSAmJiAoX21pZGRsZXdhcmVEYXRhJGFycm93ID0gbWlkZGxld2FyZURhdGEuYXJyb3cpICE9IG51bGwgJiYgX21pZGRsZXdhcmVEYXRhJGFycm93LmFsaWdubWVudE9mZnNldCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiB4ICsgZGlmZkNvb3Jkcy54LFxuICAgICAgICB5OiB5ICsgZGlmZkNvb3Jkcy55LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgLi4uZGlmZkNvb3JkcyxcbiAgICAgICAgICBwbGFjZW1lbnRcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuXG4vKipcbiAqIE9wdGltaXplcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCBieSBzaGlmdGluZyBpdCBpbiBvcmRlciB0b1xuICoga2VlcCBpdCBpbiB2aWV3IHdoZW4gaXQgd2lsbCBvdmVyZmxvdyB0aGUgY2xpcHBpbmcgYm91bmRhcnkuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3Mvc2hpZnRcbiAqL1xuY29uc3Qgc2hpZnQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3NoaWZ0JyxcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHgsXG4gICAgICAgIHksXG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgcGxhdGZvcm1cbiAgICAgIH0gPSBzdGF0ZTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFpbkF4aXM6IGNoZWNrTWFpbkF4aXMgPSB0cnVlLFxuICAgICAgICBjcm9zc0F4aXM6IGNoZWNrQ3Jvc3NBeGlzID0gZmFsc2UsXG4gICAgICAgIGxpbWl0ZXIgPSB7XG4gICAgICAgICAgZm46IF9yZWYgPT4ge1xuICAgICAgICAgICAgbGV0IHtcbiAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgeVxuICAgICAgICAgICAgfSA9IF9yZWY7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB4LFxuICAgICAgICAgICAgICB5XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uZGV0ZWN0T3ZlcmZsb3dPcHRpb25zXG4gICAgICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpO1xuICAgICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9O1xuICAgICAgY29uc3Qgb3ZlcmZsb3cgPSBhd2FpdCBwbGF0Zm9ybS5kZXRlY3RPdmVyZmxvdyhzdGF0ZSwgZGV0ZWN0T3ZlcmZsb3dPcHRpb25zKTtcbiAgICAgIGNvbnN0IGNyb3NzQXhpcyA9IGdldFNpZGVBeGlzKGdldFNpZGUocGxhY2VtZW50KSk7XG4gICAgICBjb25zdCBtYWluQXhpcyA9IGdldE9wcG9zaXRlQXhpcyhjcm9zc0F4aXMpO1xuICAgICAgbGV0IG1haW5BeGlzQ29vcmQgPSBjb29yZHNbbWFpbkF4aXNdO1xuICAgICAgbGV0IGNyb3NzQXhpc0Nvb3JkID0gY29vcmRzW2Nyb3NzQXhpc107XG4gICAgICBpZiAoY2hlY2tNYWluQXhpcykge1xuICAgICAgICBjb25zdCBtaW5TaWRlID0gbWFpbkF4aXMgPT09ICd5JyA/ICd0b3AnIDogJ2xlZnQnO1xuICAgICAgICBjb25zdCBtYXhTaWRlID0gbWFpbkF4aXMgPT09ICd5JyA/ICdib3R0b20nIDogJ3JpZ2h0JztcbiAgICAgICAgY29uc3QgbWluID0gbWFpbkF4aXNDb29yZCArIG92ZXJmbG93W21pblNpZGVdO1xuICAgICAgICBjb25zdCBtYXggPSBtYWluQXhpc0Nvb3JkIC0gb3ZlcmZsb3dbbWF4U2lkZV07XG4gICAgICAgIG1haW5BeGlzQ29vcmQgPSBjbGFtcChtaW4sIG1haW5BeGlzQ29vcmQsIG1heCk7XG4gICAgICB9XG4gICAgICBpZiAoY2hlY2tDcm9zc0F4aXMpIHtcbiAgICAgICAgY29uc3QgbWluU2lkZSA9IGNyb3NzQXhpcyA9PT0gJ3knID8gJ3RvcCcgOiAnbGVmdCc7XG4gICAgICAgIGNvbnN0IG1heFNpZGUgPSBjcm9zc0F4aXMgPT09ICd5JyA/ICdib3R0b20nIDogJ3JpZ2h0JztcbiAgICAgICAgY29uc3QgbWluID0gY3Jvc3NBeGlzQ29vcmQgKyBvdmVyZmxvd1ttaW5TaWRlXTtcbiAgICAgICAgY29uc3QgbWF4ID0gY3Jvc3NBeGlzQ29vcmQgLSBvdmVyZmxvd1ttYXhTaWRlXTtcbiAgICAgICAgY3Jvc3NBeGlzQ29vcmQgPSBjbGFtcChtaW4sIGNyb3NzQXhpc0Nvb3JkLCBtYXgpO1xuICAgICAgfVxuICAgICAgY29uc3QgbGltaXRlZENvb3JkcyA9IGxpbWl0ZXIuZm4oe1xuICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgW21haW5BeGlzXTogbWFpbkF4aXNDb29yZCxcbiAgICAgICAgW2Nyb3NzQXhpc106IGNyb3NzQXhpc0Nvb3JkXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmxpbWl0ZWRDb29yZHMsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB4OiBsaW1pdGVkQ29vcmRzLnggLSB4LFxuICAgICAgICAgIHk6IGxpbWl0ZWRDb29yZHMueSAtIHksXG4gICAgICAgICAgZW5hYmxlZDoge1xuICAgICAgICAgICAgW21haW5BeGlzXTogY2hlY2tNYWluQXhpcyxcbiAgICAgICAgICAgIFtjcm9zc0F4aXNdOiBjaGVja0Nyb3NzQXhpc1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuLyoqXG4gKiBCdWlsdC1pbiBgbGltaXRlcmAgdGhhdCB3aWxsIHN0b3AgYHNoaWZ0KClgIGF0IGEgY2VydGFpbiBwb2ludC5cbiAqL1xuY29uc3QgbGltaXRTaGlmdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBvcHRpb25zLFxuICAgIGZuKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHgsXG4gICAgICAgIHksXG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgcmVjdHMsXG4gICAgICAgIG1pZGRsZXdhcmVEYXRhXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG9mZnNldCA9IDAsXG4gICAgICAgIG1haW5BeGlzOiBjaGVja01haW5BeGlzID0gdHJ1ZSxcbiAgICAgICAgY3Jvc3NBeGlzOiBjaGVja0Nyb3NzQXhpcyA9IHRydWVcbiAgICAgIH0gPSBldmFsdWF0ZShvcHRpb25zLCBzdGF0ZSk7XG4gICAgICBjb25zdCBjb29yZHMgPSB7XG4gICAgICAgIHgsXG4gICAgICAgIHlcbiAgICAgIH07XG4gICAgICBjb25zdCBjcm9zc0F4aXMgPSBnZXRTaWRlQXhpcyhwbGFjZW1lbnQpO1xuICAgICAgY29uc3QgbWFpbkF4aXMgPSBnZXRPcHBvc2l0ZUF4aXMoY3Jvc3NBeGlzKTtcbiAgICAgIGxldCBtYWluQXhpc0Nvb3JkID0gY29vcmRzW21haW5BeGlzXTtcbiAgICAgIGxldCBjcm9zc0F4aXNDb29yZCA9IGNvb3Jkc1tjcm9zc0F4aXNdO1xuICAgICAgY29uc3QgcmF3T2Zmc2V0ID0gZXZhbHVhdGUob2Zmc2V0LCBzdGF0ZSk7XG4gICAgICBjb25zdCBjb21wdXRlZE9mZnNldCA9IHR5cGVvZiByYXdPZmZzZXQgPT09ICdudW1iZXInID8ge1xuICAgICAgICBtYWluQXhpczogcmF3T2Zmc2V0LFxuICAgICAgICBjcm9zc0F4aXM6IDBcbiAgICAgIH0gOiB7XG4gICAgICAgIG1haW5BeGlzOiAwLFxuICAgICAgICBjcm9zc0F4aXM6IDAsXG4gICAgICAgIC4uLnJhd09mZnNldFxuICAgICAgfTtcbiAgICAgIGlmIChjaGVja01haW5BeGlzKSB7XG4gICAgICAgIGNvbnN0IGxlbiA9IG1haW5BeGlzID09PSAneScgPyAnaGVpZ2h0JyA6ICd3aWR0aCc7XG4gICAgICAgIGNvbnN0IGxpbWl0TWluID0gcmVjdHMucmVmZXJlbmNlW21haW5BeGlzXSAtIHJlY3RzLmZsb2F0aW5nW2xlbl0gKyBjb21wdXRlZE9mZnNldC5tYWluQXhpcztcbiAgICAgICAgY29uc3QgbGltaXRNYXggPSByZWN0cy5yZWZlcmVuY2VbbWFpbkF4aXNdICsgcmVjdHMucmVmZXJlbmNlW2xlbl0gLSBjb21wdXRlZE9mZnNldC5tYWluQXhpcztcbiAgICAgICAgaWYgKG1haW5BeGlzQ29vcmQgPCBsaW1pdE1pbikge1xuICAgICAgICAgIG1haW5BeGlzQ29vcmQgPSBsaW1pdE1pbjtcbiAgICAgICAgfSBlbHNlIGlmIChtYWluQXhpc0Nvb3JkID4gbGltaXRNYXgpIHtcbiAgICAgICAgICBtYWluQXhpc0Nvb3JkID0gbGltaXRNYXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjaGVja0Nyb3NzQXhpcykge1xuICAgICAgICB2YXIgX21pZGRsZXdhcmVEYXRhJG9mZnNlLCBfbWlkZGxld2FyZURhdGEkb2Zmc2UyO1xuICAgICAgICBjb25zdCBsZW4gPSBtYWluQXhpcyA9PT0gJ3knID8gJ3dpZHRoJyA6ICdoZWlnaHQnO1xuICAgICAgICBjb25zdCBpc09yaWdpblNpZGUgPSBvcmlnaW5TaWRlcy5oYXMoZ2V0U2lkZShwbGFjZW1lbnQpKTtcbiAgICAgICAgY29uc3QgbGltaXRNaW4gPSByZWN0cy5yZWZlcmVuY2VbY3Jvc3NBeGlzXSAtIHJlY3RzLmZsb2F0aW5nW2xlbl0gKyAoaXNPcmlnaW5TaWRlID8gKChfbWlkZGxld2FyZURhdGEkb2Zmc2UgPSBtaWRkbGV3YXJlRGF0YS5vZmZzZXQpID09IG51bGwgPyB2b2lkIDAgOiBfbWlkZGxld2FyZURhdGEkb2Zmc2VbY3Jvc3NBeGlzXSkgfHwgMCA6IDApICsgKGlzT3JpZ2luU2lkZSA/IDAgOiBjb21wdXRlZE9mZnNldC5jcm9zc0F4aXMpO1xuICAgICAgICBjb25zdCBsaW1pdE1heCA9IHJlY3RzLnJlZmVyZW5jZVtjcm9zc0F4aXNdICsgcmVjdHMucmVmZXJlbmNlW2xlbl0gKyAoaXNPcmlnaW5TaWRlID8gMCA6ICgoX21pZGRsZXdhcmVEYXRhJG9mZnNlMiA9IG1pZGRsZXdhcmVEYXRhLm9mZnNldCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9taWRkbGV3YXJlRGF0YSRvZmZzZTJbY3Jvc3NBeGlzXSkgfHwgMCkgLSAoaXNPcmlnaW5TaWRlID8gY29tcHV0ZWRPZmZzZXQuY3Jvc3NBeGlzIDogMCk7XG4gICAgICAgIGlmIChjcm9zc0F4aXNDb29yZCA8IGxpbWl0TWluKSB7XG4gICAgICAgICAgY3Jvc3NBeGlzQ29vcmQgPSBsaW1pdE1pbjtcbiAgICAgICAgfSBlbHNlIGlmIChjcm9zc0F4aXNDb29yZCA+IGxpbWl0TWF4KSB7XG4gICAgICAgICAgY3Jvc3NBeGlzQ29vcmQgPSBsaW1pdE1heDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW21haW5BeGlzXTogbWFpbkF4aXNDb29yZCxcbiAgICAgICAgW2Nyb3NzQXhpc106IGNyb3NzQXhpc0Nvb3JkXG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgZGF0YSB0aGF0IGFsbG93cyB5b3UgdG8gY2hhbmdlIHRoZSBzaXplIG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IOKAlFxuICogZm9yIGluc3RhbmNlLCBwcmV2ZW50IGl0IGZyb20gb3ZlcmZsb3dpbmcgdGhlIGNsaXBwaW5nIGJvdW5kYXJ5IG9yIG1hdGNoIHRoZVxuICogd2lkdGggb2YgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL3NpemVcbiAqL1xuY29uc3Qgc2l6ZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc2l6ZScsXG4gICAgb3B0aW9ucyxcbiAgICBhc3luYyBmbihzdGF0ZSkge1xuICAgICAgdmFyIF9zdGF0ZSRtaWRkbGV3YXJlRGF0YSwgX3N0YXRlJG1pZGRsZXdhcmVEYXRhMjtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICByZWN0cyxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGFwcGx5ID0gKCkgPT4ge30sXG4gICAgICAgIC4uLmRldGVjdE92ZXJmbG93T3B0aW9uc1xuICAgICAgfSA9IGV2YWx1YXRlKG9wdGlvbnMsIHN0YXRlKTtcbiAgICAgIGNvbnN0IG92ZXJmbG93ID0gYXdhaXQgcGxhdGZvcm0uZGV0ZWN0T3ZlcmZsb3coc3RhdGUsIGRldGVjdE92ZXJmbG93T3B0aW9ucyk7XG4gICAgICBjb25zdCBzaWRlID0gZ2V0U2lkZShwbGFjZW1lbnQpO1xuICAgICAgY29uc3QgYWxpZ25tZW50ID0gZ2V0QWxpZ25tZW50KHBsYWNlbWVudCk7XG4gICAgICBjb25zdCBpc1lBeGlzID0gZ2V0U2lkZUF4aXMocGxhY2VtZW50KSA9PT0gJ3knO1xuICAgICAgY29uc3Qge1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0XG4gICAgICB9ID0gcmVjdHMuZmxvYXRpbmc7XG4gICAgICBsZXQgaGVpZ2h0U2lkZTtcbiAgICAgIGxldCB3aWR0aFNpZGU7XG4gICAgICBpZiAoc2lkZSA9PT0gJ3RvcCcgfHwgc2lkZSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgaGVpZ2h0U2lkZSA9IHNpZGU7XG4gICAgICAgIHdpZHRoU2lkZSA9IGFsaWdubWVudCA9PT0gKChhd2FpdCAocGxhdGZvcm0uaXNSVEwgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtLmlzUlRMKGVsZW1lbnRzLmZsb2F0aW5nKSkpID8gJ3N0YXJ0JyA6ICdlbmQnKSA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aWR0aFNpZGUgPSBzaWRlO1xuICAgICAgICBoZWlnaHRTaWRlID0gYWxpZ25tZW50ID09PSAnZW5kJyA/ICd0b3AnIDogJ2JvdHRvbSc7XG4gICAgICB9XG4gICAgICBjb25zdCBtYXhpbXVtQ2xpcHBpbmdIZWlnaHQgPSBoZWlnaHQgLSBvdmVyZmxvdy50b3AgLSBvdmVyZmxvdy5ib3R0b207XG4gICAgICBjb25zdCBtYXhpbXVtQ2xpcHBpbmdXaWR0aCA9IHdpZHRoIC0gb3ZlcmZsb3cubGVmdCAtIG92ZXJmbG93LnJpZ2h0O1xuICAgICAgY29uc3Qgb3ZlcmZsb3dBdmFpbGFibGVIZWlnaHQgPSBtaW4oaGVpZ2h0IC0gb3ZlcmZsb3dbaGVpZ2h0U2lkZV0sIG1heGltdW1DbGlwcGluZ0hlaWdodCk7XG4gICAgICBjb25zdCBvdmVyZmxvd0F2YWlsYWJsZVdpZHRoID0gbWluKHdpZHRoIC0gb3ZlcmZsb3dbd2lkdGhTaWRlXSwgbWF4aW11bUNsaXBwaW5nV2lkdGgpO1xuICAgICAgY29uc3Qgbm9TaGlmdCA9ICFzdGF0ZS5taWRkbGV3YXJlRGF0YS5zaGlmdDtcbiAgICAgIGxldCBhdmFpbGFibGVIZWlnaHQgPSBvdmVyZmxvd0F2YWlsYWJsZUhlaWdodDtcbiAgICAgIGxldCBhdmFpbGFibGVXaWR0aCA9IG92ZXJmbG93QXZhaWxhYmxlV2lkdGg7XG4gICAgICBpZiAoKF9zdGF0ZSRtaWRkbGV3YXJlRGF0YSA9IHN0YXRlLm1pZGRsZXdhcmVEYXRhLnNoaWZ0KSAhPSBudWxsICYmIF9zdGF0ZSRtaWRkbGV3YXJlRGF0YS5lbmFibGVkLngpIHtcbiAgICAgICAgYXZhaWxhYmxlV2lkdGggPSBtYXhpbXVtQ2xpcHBpbmdXaWR0aDtcbiAgICAgIH1cbiAgICAgIGlmICgoX3N0YXRlJG1pZGRsZXdhcmVEYXRhMiA9IHN0YXRlLm1pZGRsZXdhcmVEYXRhLnNoaWZ0KSAhPSBudWxsICYmIF9zdGF0ZSRtaWRkbGV3YXJlRGF0YTIuZW5hYmxlZC55KSB7XG4gICAgICAgIGF2YWlsYWJsZUhlaWdodCA9IG1heGltdW1DbGlwcGluZ0hlaWdodDtcbiAgICAgIH1cbiAgICAgIGlmIChub1NoaWZ0ICYmICFhbGlnbm1lbnQpIHtcbiAgICAgICAgY29uc3QgeE1pbiA9IG1heChvdmVyZmxvdy5sZWZ0LCAwKTtcbiAgICAgICAgY29uc3QgeE1heCA9IG1heChvdmVyZmxvdy5yaWdodCwgMCk7XG4gICAgICAgIGNvbnN0IHlNaW4gPSBtYXgob3ZlcmZsb3cudG9wLCAwKTtcbiAgICAgICAgY29uc3QgeU1heCA9IG1heChvdmVyZmxvdy5ib3R0b20sIDApO1xuICAgICAgICBpZiAoaXNZQXhpcykge1xuICAgICAgICAgIGF2YWlsYWJsZVdpZHRoID0gd2lkdGggLSAyICogKHhNaW4gIT09IDAgfHwgeE1heCAhPT0gMCA/IHhNaW4gKyB4TWF4IDogbWF4KG92ZXJmbG93LmxlZnQsIG92ZXJmbG93LnJpZ2h0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXZhaWxhYmxlSGVpZ2h0ID0gaGVpZ2h0IC0gMiAqICh5TWluICE9PSAwIHx8IHlNYXggIT09IDAgPyB5TWluICsgeU1heCA6IG1heChvdmVyZmxvdy50b3AsIG92ZXJmbG93LmJvdHRvbSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBhcHBseSh7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBhdmFpbGFibGVXaWR0aCxcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG5leHREaW1lbnNpb25zID0gYXdhaXQgcGxhdGZvcm0uZ2V0RGltZW5zaW9ucyhlbGVtZW50cy5mbG9hdGluZyk7XG4gICAgICBpZiAod2lkdGggIT09IG5leHREaW1lbnNpb25zLndpZHRoIHx8IGhlaWdodCAhPT0gbmV4dERpbWVuc2lvbnMuaGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgIHJlY3RzOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfTtcbn07XG5cbmV4cG9ydCB7IGFycm93LCBhdXRvUGxhY2VtZW50LCBjb21wdXRlUG9zaXRpb24sIGRldGVjdE92ZXJmbG93LCBmbGlwLCBoaWRlLCBpbmxpbmUsIGxpbWl0U2hpZnQsIG9mZnNldCwgc2hpZnQsIHNpemUgfTtcbiIsImltcG9ydCB7IHJlY3RUb0NsaWVudFJlY3QsIGFycm93IGFzIGFycm93JDEsIGF1dG9QbGFjZW1lbnQgYXMgYXV0b1BsYWNlbWVudCQxLCBkZXRlY3RPdmVyZmxvdyBhcyBkZXRlY3RPdmVyZmxvdyQxLCBmbGlwIGFzIGZsaXAkMSwgaGlkZSBhcyBoaWRlJDEsIGlubGluZSBhcyBpbmxpbmUkMSwgbGltaXRTaGlmdCBhcyBsaW1pdFNoaWZ0JDEsIG9mZnNldCBhcyBvZmZzZXQkMSwgc2hpZnQgYXMgc2hpZnQkMSwgc2l6ZSBhcyBzaXplJDEsIGNvbXB1dGVQb3NpdGlvbiBhcyBjb21wdXRlUG9zaXRpb24kMSB9IGZyb20gJ0BmbG9hdGluZy11aS9jb3JlJztcbmltcG9ydCB7IHJvdW5kLCBjcmVhdGVDb29yZHMsIG1heCwgbWluLCBmbG9vciB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscyc7XG5pbXBvcnQgeyBnZXRDb21wdXRlZFN0eWxlIGFzIGdldENvbXB1dGVkU3R5bGUkMSwgaXNIVE1MRWxlbWVudCwgaXNFbGVtZW50LCBnZXRXaW5kb3csIGlzV2ViS2l0LCBnZXRGcmFtZUVsZW1lbnQsIGdldE5vZGVTY3JvbGwsIGdldERvY3VtZW50RWxlbWVudCwgaXNUb3BMYXllciwgZ2V0Tm9kZU5hbWUsIGlzT3ZlcmZsb3dFbGVtZW50LCBnZXRPdmVyZmxvd0FuY2VzdG9ycywgZ2V0UGFyZW50Tm9kZSwgaXNMYXN0VHJhdmVyc2FibGVOb2RlLCBpc0NvbnRhaW5pbmdCbG9jaywgaXNUYWJsZUVsZW1lbnQsIGdldENvbnRhaW5pbmdCbG9jayB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuZXhwb3J0IHsgZ2V0T3ZlcmZsb3dBbmNlc3RvcnMgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMvZG9tJztcblxuZnVuY3Rpb24gZ2V0Q3NzRGltZW5zaW9ucyhlbGVtZW50KSB7XG4gIGNvbnN0IGNzcyA9IGdldENvbXB1dGVkU3R5bGUkMShlbGVtZW50KTtcbiAgLy8gSW4gdGVzdGluZyBlbnZpcm9ubWVudHMsIHRoZSBgd2lkdGhgIGFuZCBgaGVpZ2h0YCBwcm9wZXJ0aWVzIGFyZSBlbXB0eVxuICAvLyBzdHJpbmdzIGZvciBTVkcgZWxlbWVudHMsIHJldHVybmluZyBOYU4uIEZhbGxiYWNrIHRvIGAwYCBpbiB0aGlzIGNhc2UuXG4gIGxldCB3aWR0aCA9IHBhcnNlRmxvYXQoY3NzLndpZHRoKSB8fCAwO1xuICBsZXQgaGVpZ2h0ID0gcGFyc2VGbG9hdChjc3MuaGVpZ2h0KSB8fCAwO1xuICBjb25zdCBoYXNPZmZzZXQgPSBpc0hUTUxFbGVtZW50KGVsZW1lbnQpO1xuICBjb25zdCBvZmZzZXRXaWR0aCA9IGhhc09mZnNldCA/IGVsZW1lbnQub2Zmc2V0V2lkdGggOiB3aWR0aDtcbiAgY29uc3Qgb2Zmc2V0SGVpZ2h0ID0gaGFzT2Zmc2V0ID8gZWxlbWVudC5vZmZzZXRIZWlnaHQgOiBoZWlnaHQ7XG4gIGNvbnN0IHNob3VsZEZhbGxiYWNrID0gcm91bmQod2lkdGgpICE9PSBvZmZzZXRXaWR0aCB8fCByb3VuZChoZWlnaHQpICE9PSBvZmZzZXRIZWlnaHQ7XG4gIGlmIChzaG91bGRGYWxsYmFjaykge1xuICAgIHdpZHRoID0gb2Zmc2V0V2lkdGg7XG4gICAgaGVpZ2h0ID0gb2Zmc2V0SGVpZ2h0O1xuICB9XG4gIHJldHVybiB7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgICQ6IHNob3VsZEZhbGxiYWNrXG4gIH07XG59XG5cbmZ1bmN0aW9uIHVud3JhcEVsZW1lbnQoZWxlbWVudCkge1xuICByZXR1cm4gIWlzRWxlbWVudChlbGVtZW50KSA/IGVsZW1lbnQuY29udGV4dEVsZW1lbnQgOiBlbGVtZW50O1xufVxuXG5mdW5jdGlvbiBnZXRTY2FsZShlbGVtZW50KSB7XG4gIGNvbnN0IGRvbUVsZW1lbnQgPSB1bndyYXBFbGVtZW50KGVsZW1lbnQpO1xuICBpZiAoIWlzSFRNTEVsZW1lbnQoZG9tRWxlbWVudCkpIHtcbiAgICByZXR1cm4gY3JlYXRlQ29vcmRzKDEpO1xuICB9XG4gIGNvbnN0IHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjb25zdCB7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgICRcbiAgfSA9IGdldENzc0RpbWVuc2lvbnMoZG9tRWxlbWVudCk7XG4gIGxldCB4ID0gKCQgPyByb3VuZChyZWN0LndpZHRoKSA6IHJlY3Qud2lkdGgpIC8gd2lkdGg7XG4gIGxldCB5ID0gKCQgPyByb3VuZChyZWN0LmhlaWdodCkgOiByZWN0LmhlaWdodCkgLyBoZWlnaHQ7XG5cbiAgLy8gMCwgTmFOLCBvciBJbmZpbml0eSBzaG91bGQgYWx3YXlzIGZhbGxiYWNrIHRvIDEuXG5cbiAgaWYgKCF4IHx8ICFOdW1iZXIuaXNGaW5pdGUoeCkpIHtcbiAgICB4ID0gMTtcbiAgfVxuICBpZiAoIXkgfHwgIU51bWJlci5pc0Zpbml0ZSh5KSkge1xuICAgIHkgPSAxO1xuICB9XG4gIHJldHVybiB7XG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5cbmNvbnN0IG5vT2Zmc2V0cyA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb29yZHMoMCk7XG5mdW5jdGlvbiBnZXRWaXN1YWxPZmZzZXRzKGVsZW1lbnQpIHtcbiAgY29uc3Qgd2luID0gZ2V0V2luZG93KGVsZW1lbnQpO1xuICBpZiAoIWlzV2ViS2l0KCkgfHwgIXdpbi52aXN1YWxWaWV3cG9ydCkge1xuICAgIHJldHVybiBub09mZnNldHM7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB4OiB3aW4udmlzdWFsVmlld3BvcnQub2Zmc2V0TGVmdCxcbiAgICB5OiB3aW4udmlzdWFsVmlld3BvcnQub2Zmc2V0VG9wXG4gIH07XG59XG5mdW5jdGlvbiBzaG91bGRBZGRWaXN1YWxPZmZzZXRzKGVsZW1lbnQsIGlzRml4ZWQsIGZsb2F0aW5nT2Zmc2V0UGFyZW50KSB7XG4gIGlmIChpc0ZpeGVkID09PSB2b2lkIDApIHtcbiAgICBpc0ZpeGVkID0gZmFsc2U7XG4gIH1cbiAgaWYgKCFmbG9hdGluZ09mZnNldFBhcmVudCB8fCBpc0ZpeGVkICYmIGZsb2F0aW5nT2Zmc2V0UGFyZW50ICE9PSBnZXRXaW5kb3coZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzRml4ZWQ7XG59XG5cbmZ1bmN0aW9uIGdldEJvdW5kaW5nQ2xpZW50UmVjdChlbGVtZW50LCBpbmNsdWRlU2NhbGUsIGlzRml4ZWRTdHJhdGVneSwgb2Zmc2V0UGFyZW50KSB7XG4gIGlmIChpbmNsdWRlU2NhbGUgPT09IHZvaWQgMCkge1xuICAgIGluY2x1ZGVTY2FsZSA9IGZhbHNlO1xuICB9XG4gIGlmIChpc0ZpeGVkU3RyYXRlZ3kgPT09IHZvaWQgMCkge1xuICAgIGlzRml4ZWRTdHJhdGVneSA9IGZhbHNlO1xuICB9XG4gIGNvbnN0IGNsaWVudFJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjb25zdCBkb21FbGVtZW50ID0gdW53cmFwRWxlbWVudChlbGVtZW50KTtcbiAgbGV0IHNjYWxlID0gY3JlYXRlQ29vcmRzKDEpO1xuICBpZiAoaW5jbHVkZVNjYWxlKSB7XG4gICAgaWYgKG9mZnNldFBhcmVudCkge1xuICAgICAgaWYgKGlzRWxlbWVudChvZmZzZXRQYXJlbnQpKSB7XG4gICAgICAgIHNjYWxlID0gZ2V0U2NhbGUob2Zmc2V0UGFyZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NhbGUgPSBnZXRTY2FsZShlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgY29uc3QgdmlzdWFsT2Zmc2V0cyA9IHNob3VsZEFkZFZpc3VhbE9mZnNldHMoZG9tRWxlbWVudCwgaXNGaXhlZFN0cmF0ZWd5LCBvZmZzZXRQYXJlbnQpID8gZ2V0VmlzdWFsT2Zmc2V0cyhkb21FbGVtZW50KSA6IGNyZWF0ZUNvb3JkcygwKTtcbiAgbGV0IHggPSAoY2xpZW50UmVjdC5sZWZ0ICsgdmlzdWFsT2Zmc2V0cy54KSAvIHNjYWxlLng7XG4gIGxldCB5ID0gKGNsaWVudFJlY3QudG9wICsgdmlzdWFsT2Zmc2V0cy55KSAvIHNjYWxlLnk7XG4gIGxldCB3aWR0aCA9IGNsaWVudFJlY3Qud2lkdGggLyBzY2FsZS54O1xuICBsZXQgaGVpZ2h0ID0gY2xpZW50UmVjdC5oZWlnaHQgLyBzY2FsZS55O1xuICBpZiAoZG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHdpbiA9IGdldFdpbmRvdyhkb21FbGVtZW50KTtcbiAgICBjb25zdCBvZmZzZXRXaW4gPSBvZmZzZXRQYXJlbnQgJiYgaXNFbGVtZW50KG9mZnNldFBhcmVudCkgPyBnZXRXaW5kb3cob2Zmc2V0UGFyZW50KSA6IG9mZnNldFBhcmVudDtcbiAgICBsZXQgY3VycmVudFdpbiA9IHdpbjtcbiAgICBsZXQgY3VycmVudElGcmFtZSA9IGdldEZyYW1lRWxlbWVudChjdXJyZW50V2luKTtcbiAgICB3aGlsZSAoY3VycmVudElGcmFtZSAmJiBvZmZzZXRQYXJlbnQgJiYgb2Zmc2V0V2luICE9PSBjdXJyZW50V2luKSB7XG4gICAgICBjb25zdCBpZnJhbWVTY2FsZSA9IGdldFNjYWxlKGN1cnJlbnRJRnJhbWUpO1xuICAgICAgY29uc3QgaWZyYW1lUmVjdCA9IGN1cnJlbnRJRnJhbWUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBjc3MgPSBnZXRDb21wdXRlZFN0eWxlJDEoY3VycmVudElGcmFtZSk7XG4gICAgICBjb25zdCBsZWZ0ID0gaWZyYW1lUmVjdC5sZWZ0ICsgKGN1cnJlbnRJRnJhbWUuY2xpZW50TGVmdCArIHBhcnNlRmxvYXQoY3NzLnBhZGRpbmdMZWZ0KSkgKiBpZnJhbWVTY2FsZS54O1xuICAgICAgY29uc3QgdG9wID0gaWZyYW1lUmVjdC50b3AgKyAoY3VycmVudElGcmFtZS5jbGllbnRUb3AgKyBwYXJzZUZsb2F0KGNzcy5wYWRkaW5nVG9wKSkgKiBpZnJhbWVTY2FsZS55O1xuICAgICAgeCAqPSBpZnJhbWVTY2FsZS54O1xuICAgICAgeSAqPSBpZnJhbWVTY2FsZS55O1xuICAgICAgd2lkdGggKj0gaWZyYW1lU2NhbGUueDtcbiAgICAgIGhlaWdodCAqPSBpZnJhbWVTY2FsZS55O1xuICAgICAgeCArPSBsZWZ0O1xuICAgICAgeSArPSB0b3A7XG4gICAgICBjdXJyZW50V2luID0gZ2V0V2luZG93KGN1cnJlbnRJRnJhbWUpO1xuICAgICAgY3VycmVudElGcmFtZSA9IGdldEZyYW1lRWxlbWVudChjdXJyZW50V2luKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlY3RUb0NsaWVudFJlY3Qoe1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICB4LFxuICAgIHlcbiAgfSk7XG59XG5cbi8vIElmIDxodG1sPiBoYXMgYSBDU1Mgd2lkdGggZ3JlYXRlciB0aGFuIHRoZSB2aWV3cG9ydCwgdGhlbiB0aGlzIHdpbGwgYmVcbi8vIGluY29ycmVjdCBmb3IgUlRMLlxuZnVuY3Rpb24gZ2V0V2luZG93U2Nyb2xsQmFyWChlbGVtZW50LCByZWN0KSB7XG4gIGNvbnN0IGxlZnRTY3JvbGwgPSBnZXROb2RlU2Nyb2xsKGVsZW1lbnQpLnNjcm9sbExlZnQ7XG4gIGlmICghcmVjdCkge1xuICAgIHJldHVybiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZ2V0RG9jdW1lbnRFbGVtZW50KGVsZW1lbnQpKS5sZWZ0ICsgbGVmdFNjcm9sbDtcbiAgfVxuICByZXR1cm4gcmVjdC5sZWZ0ICsgbGVmdFNjcm9sbDtcbn1cblxuZnVuY3Rpb24gZ2V0SFRNTE9mZnNldChkb2N1bWVudEVsZW1lbnQsIHNjcm9sbCkge1xuICBjb25zdCBodG1sUmVjdCA9IGRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgY29uc3QgeCA9IGh0bWxSZWN0LmxlZnQgKyBzY3JvbGwuc2Nyb2xsTGVmdCAtIGdldFdpbmRvd1Njcm9sbEJhclgoZG9jdW1lbnRFbGVtZW50LCBodG1sUmVjdCk7XG4gIGNvbnN0IHkgPSBodG1sUmVjdC50b3AgKyBzY3JvbGwuc2Nyb2xsVG9wO1xuICByZXR1cm4ge1xuICAgIHgsXG4gICAgeVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2Zmc2V0UGFyZW50UmVsYXRpdmVSZWN0VG9WaWV3cG9ydFJlbGF0aXZlUmVjdChfcmVmKSB7XG4gIGxldCB7XG4gICAgZWxlbWVudHMsXG4gICAgcmVjdCxcbiAgICBvZmZzZXRQYXJlbnQsXG4gICAgc3RyYXRlZ3lcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGlzRml4ZWQgPSBzdHJhdGVneSA9PT0gJ2ZpeGVkJztcbiAgY29uc3QgZG9jdW1lbnRFbGVtZW50ID0gZ2V0RG9jdW1lbnRFbGVtZW50KG9mZnNldFBhcmVudCk7XG4gIGNvbnN0IHRvcExheWVyID0gZWxlbWVudHMgPyBpc1RvcExheWVyKGVsZW1lbnRzLmZsb2F0aW5nKSA6IGZhbHNlO1xuICBpZiAob2Zmc2V0UGFyZW50ID09PSBkb2N1bWVudEVsZW1lbnQgfHwgdG9wTGF5ZXIgJiYgaXNGaXhlZCkge1xuICAgIHJldHVybiByZWN0O1xuICB9XG4gIGxldCBzY3JvbGwgPSB7XG4gICAgc2Nyb2xsTGVmdDogMCxcbiAgICBzY3JvbGxUb3A6IDBcbiAgfTtcbiAgbGV0IHNjYWxlID0gY3JlYXRlQ29vcmRzKDEpO1xuICBjb25zdCBvZmZzZXRzID0gY3JlYXRlQ29vcmRzKDApO1xuICBjb25zdCBpc09mZnNldFBhcmVudEFuRWxlbWVudCA9IGlzSFRNTEVsZW1lbnQob2Zmc2V0UGFyZW50KTtcbiAgaWYgKGlzT2Zmc2V0UGFyZW50QW5FbGVtZW50IHx8ICFpc09mZnNldFBhcmVudEFuRWxlbWVudCAmJiAhaXNGaXhlZCkge1xuICAgIGlmIChnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpICE9PSAnYm9keScgfHwgaXNPdmVyZmxvd0VsZW1lbnQoZG9jdW1lbnRFbGVtZW50KSkge1xuICAgICAgc2Nyb2xsID0gZ2V0Tm9kZVNjcm9sbChvZmZzZXRQYXJlbnQpO1xuICAgIH1cbiAgICBpZiAoaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IG9mZnNldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3Qob2Zmc2V0UGFyZW50KTtcbiAgICAgIHNjYWxlID0gZ2V0U2NhbGUob2Zmc2V0UGFyZW50KTtcbiAgICAgIG9mZnNldHMueCA9IG9mZnNldFJlY3QueCArIG9mZnNldFBhcmVudC5jbGllbnRMZWZ0O1xuICAgICAgb2Zmc2V0cy55ID0gb2Zmc2V0UmVjdC55ICsgb2Zmc2V0UGFyZW50LmNsaWVudFRvcDtcbiAgICB9XG4gIH1cbiAgY29uc3QgaHRtbE9mZnNldCA9IGRvY3VtZW50RWxlbWVudCAmJiAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgIWlzRml4ZWQgPyBnZXRIVE1MT2Zmc2V0KGRvY3VtZW50RWxlbWVudCwgc2Nyb2xsKSA6IGNyZWF0ZUNvb3JkcygwKTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogcmVjdC53aWR0aCAqIHNjYWxlLngsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCAqIHNjYWxlLnksXG4gICAgeDogcmVjdC54ICogc2NhbGUueCAtIHNjcm9sbC5zY3JvbGxMZWZ0ICogc2NhbGUueCArIG9mZnNldHMueCArIGh0bWxPZmZzZXQueCxcbiAgICB5OiByZWN0LnkgKiBzY2FsZS55IC0gc2Nyb2xsLnNjcm9sbFRvcCAqIHNjYWxlLnkgKyBvZmZzZXRzLnkgKyBodG1sT2Zmc2V0LnlcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xpZW50UmVjdHMoZWxlbWVudCkge1xuICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmdldENsaWVudFJlY3RzKCkpO1xufVxuXG4vLyBHZXRzIHRoZSBlbnRpcmUgc2l6ZSBvZiB0aGUgc2Nyb2xsYWJsZSBkb2N1bWVudCBhcmVhLCBldmVuIGV4dGVuZGluZyBvdXRzaWRlXG4vLyBvZiB0aGUgYDxodG1sPmAgYW5kIGA8Ym9keT5gIHJlY3QgYm91bmRzIGlmIGhvcml6b250YWxseSBzY3JvbGxhYmxlLlxuZnVuY3Rpb24gZ2V0RG9jdW1lbnRSZWN0KGVsZW1lbnQpIHtcbiAgY29uc3QgaHRtbCA9IGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KTtcbiAgY29uc3Qgc2Nyb2xsID0gZ2V0Tm9kZVNjcm9sbChlbGVtZW50KTtcbiAgY29uc3QgYm9keSA9IGVsZW1lbnQub3duZXJEb2N1bWVudC5ib2R5O1xuICBjb25zdCB3aWR0aCA9IG1heChodG1sLnNjcm9sbFdpZHRoLCBodG1sLmNsaWVudFdpZHRoLCBib2R5LnNjcm9sbFdpZHRoLCBib2R5LmNsaWVudFdpZHRoKTtcbiAgY29uc3QgaGVpZ2h0ID0gbWF4KGh0bWwuc2Nyb2xsSGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkuY2xpZW50SGVpZ2h0KTtcbiAgbGV0IHggPSAtc2Nyb2xsLnNjcm9sbExlZnQgKyBnZXRXaW5kb3dTY3JvbGxCYXJYKGVsZW1lbnQpO1xuICBjb25zdCB5ID0gLXNjcm9sbC5zY3JvbGxUb3A7XG4gIGlmIChnZXRDb21wdXRlZFN0eWxlJDEoYm9keSkuZGlyZWN0aW9uID09PSAncnRsJykge1xuICAgIHggKz0gbWF4KGh0bWwuY2xpZW50V2lkdGgsIGJvZHkuY2xpZW50V2lkdGgpIC0gd2lkdGg7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5cbi8vIFNhZmV0eSBjaGVjazogZW5zdXJlIHRoZSBzY3JvbGxiYXIgc3BhY2UgaXMgcmVhc29uYWJsZSBpbiBjYXNlIHRoaXNcbi8vIGNhbGN1bGF0aW9uIGlzIGFmZmVjdGVkIGJ5IHVudXN1YWwgc3R5bGVzLlxuLy8gTW9zdCBzY3JvbGxiYXJzIGxlYXZlIDE1LTE4cHggb2Ygc3BhY2UuXG5jb25zdCBTQ1JPTExCQVJfTUFYID0gMjU7XG5mdW5jdGlvbiBnZXRWaWV3cG9ydFJlY3QoZWxlbWVudCwgc3RyYXRlZ3kpIHtcbiAgY29uc3Qgd2luID0gZ2V0V2luZG93KGVsZW1lbnQpO1xuICBjb25zdCBodG1sID0gZ2V0RG9jdW1lbnRFbGVtZW50KGVsZW1lbnQpO1xuICBjb25zdCB2aXN1YWxWaWV3cG9ydCA9IHdpbi52aXN1YWxWaWV3cG9ydDtcbiAgbGV0IHdpZHRoID0gaHRtbC5jbGllbnRXaWR0aDtcbiAgbGV0IGhlaWdodCA9IGh0bWwuY2xpZW50SGVpZ2h0O1xuICBsZXQgeCA9IDA7XG4gIGxldCB5ID0gMDtcbiAgaWYgKHZpc3VhbFZpZXdwb3J0KSB7XG4gICAgd2lkdGggPSB2aXN1YWxWaWV3cG9ydC53aWR0aDtcbiAgICBoZWlnaHQgPSB2aXN1YWxWaWV3cG9ydC5oZWlnaHQ7XG4gICAgY29uc3QgdmlzdWFsVmlld3BvcnRCYXNlZCA9IGlzV2ViS2l0KCk7XG4gICAgaWYgKCF2aXN1YWxWaWV3cG9ydEJhc2VkIHx8IHZpc3VhbFZpZXdwb3J0QmFzZWQgJiYgc3RyYXRlZ3kgPT09ICdmaXhlZCcpIHtcbiAgICAgIHggPSB2aXN1YWxWaWV3cG9ydC5vZmZzZXRMZWZ0O1xuICAgICAgeSA9IHZpc3VhbFZpZXdwb3J0Lm9mZnNldFRvcDtcbiAgICB9XG4gIH1cbiAgY29uc3Qgd2luZG93U2Nyb2xsYmFyWCA9IGdldFdpbmRvd1Njcm9sbEJhclgoaHRtbCk7XG4gIC8vIDxodG1sPiBgb3ZlcmZsb3c6IGhpZGRlbmAgKyBgc2Nyb2xsYmFyLWd1dHRlcjogc3RhYmxlYCByZWR1Y2VzIHRoZVxuICAvLyB2aXN1YWwgd2lkdGggb2YgdGhlIDxodG1sPiBidXQgdGhpcyBpcyBub3QgY29uc2lkZXJlZCBpbiB0aGUgc2l6ZVxuICAvLyBvZiBgaHRtbC5jbGllbnRXaWR0aGAuXG4gIGlmICh3aW5kb3dTY3JvbGxiYXJYIDw9IDApIHtcbiAgICBjb25zdCBkb2MgPSBodG1sLm93bmVyRG9jdW1lbnQ7XG4gICAgY29uc3QgYm9keSA9IGRvYy5ib2R5O1xuICAgIGNvbnN0IGJvZHlTdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGJvZHkpO1xuICAgIGNvbnN0IGJvZHlNYXJnaW5JbmxpbmUgPSBkb2MuY29tcGF0TW9kZSA9PT0gJ0NTUzFDb21wYXQnID8gcGFyc2VGbG9hdChib2R5U3R5bGVzLm1hcmdpbkxlZnQpICsgcGFyc2VGbG9hdChib2R5U3R5bGVzLm1hcmdpblJpZ2h0KSB8fCAwIDogMDtcbiAgICBjb25zdCBjbGlwcGluZ1N0YWJsZVNjcm9sbGJhcldpZHRoID0gTWF0aC5hYnMoaHRtbC5jbGllbnRXaWR0aCAtIGJvZHkuY2xpZW50V2lkdGggLSBib2R5TWFyZ2luSW5saW5lKTtcbiAgICBpZiAoY2xpcHBpbmdTdGFibGVTY3JvbGxiYXJXaWR0aCA8PSBTQ1JPTExCQVJfTUFYKSB7XG4gICAgICB3aWR0aCAtPSBjbGlwcGluZ1N0YWJsZVNjcm9sbGJhcldpZHRoO1xuICAgIH1cbiAgfSBlbHNlIGlmICh3aW5kb3dTY3JvbGxiYXJYIDw9IFNDUk9MTEJBUl9NQVgpIHtcbiAgICAvLyBJZiB0aGUgPGJvZHk+IHNjcm9sbGJhciBpcyBvbiB0aGUgbGVmdCwgdGhlIHdpZHRoIG5lZWRzIHRvIGJlIGV4dGVuZGVkXG4gICAgLy8gYnkgdGhlIHNjcm9sbGJhciBhbW91bnQgc28gdGhlcmUgaXNuJ3QgZXh0cmEgc3BhY2Ugb24gdGhlIHJpZ2h0LlxuICAgIHdpZHRoICs9IHdpbmRvd1Njcm9sbGJhclg7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5cbi8vIFJldHVybnMgdGhlIGlubmVyIGNsaWVudCByZWN0LCBzdWJ0cmFjdGluZyBzY3JvbGxiYXJzIGlmIHByZXNlbnQuXG5mdW5jdGlvbiBnZXRJbm5lckJvdW5kaW5nQ2xpZW50UmVjdChlbGVtZW50LCBzdHJhdGVneSkge1xuICBjb25zdCBjbGllbnRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnQsIHRydWUsIHN0cmF0ZWd5ID09PSAnZml4ZWQnKTtcbiAgY29uc3QgdG9wID0gY2xpZW50UmVjdC50b3AgKyBlbGVtZW50LmNsaWVudFRvcDtcbiAgY29uc3QgbGVmdCA9IGNsaWVudFJlY3QubGVmdCArIGVsZW1lbnQuY2xpZW50TGVmdDtcbiAgY29uc3Qgc2NhbGUgPSBpc0hUTUxFbGVtZW50KGVsZW1lbnQpID8gZ2V0U2NhbGUoZWxlbWVudCkgOiBjcmVhdGVDb29yZHMoMSk7XG4gIGNvbnN0IHdpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aCAqIHNjYWxlLng7XG4gIGNvbnN0IGhlaWdodCA9IGVsZW1lbnQuY2xpZW50SGVpZ2h0ICogc2NhbGUueTtcbiAgY29uc3QgeCA9IGxlZnQgKiBzY2FsZS54O1xuICBjb25zdCB5ID0gdG9wICogc2NhbGUueTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5mdW5jdGlvbiBnZXRDbGllbnRSZWN0RnJvbUNsaXBwaW5nQW5jZXN0b3IoZWxlbWVudCwgY2xpcHBpbmdBbmNlc3Rvciwgc3RyYXRlZ3kpIHtcbiAgbGV0IHJlY3Q7XG4gIGlmIChjbGlwcGluZ0FuY2VzdG9yID09PSAndmlld3BvcnQnKSB7XG4gICAgcmVjdCA9IGdldFZpZXdwb3J0UmVjdChlbGVtZW50LCBzdHJhdGVneSk7XG4gIH0gZWxzZSBpZiAoY2xpcHBpbmdBbmNlc3RvciA9PT0gJ2RvY3VtZW50Jykge1xuICAgIHJlY3QgPSBnZXREb2N1bWVudFJlY3QoZ2V0RG9jdW1lbnRFbGVtZW50KGVsZW1lbnQpKTtcbiAgfSBlbHNlIGlmIChpc0VsZW1lbnQoY2xpcHBpbmdBbmNlc3RvcikpIHtcbiAgICByZWN0ID0gZ2V0SW5uZXJCb3VuZGluZ0NsaWVudFJlY3QoY2xpcHBpbmdBbmNlc3Rvciwgc3RyYXRlZ3kpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHZpc3VhbE9mZnNldHMgPSBnZXRWaXN1YWxPZmZzZXRzKGVsZW1lbnQpO1xuICAgIHJlY3QgPSB7XG4gICAgICB4OiBjbGlwcGluZ0FuY2VzdG9yLnggLSB2aXN1YWxPZmZzZXRzLngsXG4gICAgICB5OiBjbGlwcGluZ0FuY2VzdG9yLnkgLSB2aXN1YWxPZmZzZXRzLnksXG4gICAgICB3aWR0aDogY2xpcHBpbmdBbmNlc3Rvci53aWR0aCxcbiAgICAgIGhlaWdodDogY2xpcHBpbmdBbmNlc3Rvci5oZWlnaHRcbiAgICB9O1xuICB9XG4gIHJldHVybiByZWN0VG9DbGllbnRSZWN0KHJlY3QpO1xufVxuZnVuY3Rpb24gaGFzRml4ZWRQb3NpdGlvbkFuY2VzdG9yKGVsZW1lbnQsIHN0b3BOb2RlKSB7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnROb2RlKGVsZW1lbnQpO1xuICBpZiAocGFyZW50Tm9kZSA9PT0gc3RvcE5vZGUgfHwgIWlzRWxlbWVudChwYXJlbnROb2RlKSB8fCBpc0xhc3RUcmF2ZXJzYWJsZU5vZGUocGFyZW50Tm9kZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUkMShwYXJlbnROb2RlKS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJyB8fCBoYXNGaXhlZFBvc2l0aW9uQW5jZXN0b3IocGFyZW50Tm9kZSwgc3RvcE5vZGUpO1xufVxuXG4vLyBBIFwiY2xpcHBpbmcgYW5jZXN0b3JcIiBpcyBhbiBgb3ZlcmZsb3dgIGVsZW1lbnQgd2l0aCB0aGUgY2hhcmFjdGVyaXN0aWMgb2Zcbi8vIGNsaXBwaW5nIChvciBoaWRpbmcpIGNoaWxkIGVsZW1lbnRzLiBUaGlzIHJldHVybnMgYWxsIGNsaXBwaW5nIGFuY2VzdG9yc1xuLy8gb2YgdGhlIGdpdmVuIGVsZW1lbnQgdXAgdGhlIHRyZWUuXG5mdW5jdGlvbiBnZXRDbGlwcGluZ0VsZW1lbnRBbmNlc3RvcnMoZWxlbWVudCwgY2FjaGUpIHtcbiAgY29uc3QgY2FjaGVkUmVzdWx0ID0gY2FjaGUuZ2V0KGVsZW1lbnQpO1xuICBpZiAoY2FjaGVkUmVzdWx0KSB7XG4gICAgcmV0dXJuIGNhY2hlZFJlc3VsdDtcbiAgfVxuICBsZXQgcmVzdWx0ID0gZ2V0T3ZlcmZsb3dBbmNlc3RvcnMoZWxlbWVudCwgW10sIGZhbHNlKS5maWx0ZXIoZWwgPT4gaXNFbGVtZW50KGVsKSAmJiBnZXROb2RlTmFtZShlbCkgIT09ICdib2R5Jyk7XG4gIGxldCBjdXJyZW50Q29udGFpbmluZ0Jsb2NrQ29tcHV0ZWRTdHlsZSA9IG51bGw7XG4gIGNvbnN0IGVsZW1lbnRJc0ZpeGVkID0gZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnZml4ZWQnO1xuICBsZXQgY3VycmVudE5vZGUgPSBlbGVtZW50SXNGaXhlZCA/IGdldFBhcmVudE5vZGUoZWxlbWVudCkgOiBlbGVtZW50O1xuXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9Db250YWluaW5nX2Jsb2NrI2lkZW50aWZ5aW5nX3RoZV9jb250YWluaW5nX2Jsb2NrXG4gIHdoaWxlIChpc0VsZW1lbnQoY3VycmVudE5vZGUpICYmICFpc0xhc3RUcmF2ZXJzYWJsZU5vZGUoY3VycmVudE5vZGUpKSB7XG4gICAgY29uc3QgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUkMShjdXJyZW50Tm9kZSk7XG4gICAgY29uc3QgY3VycmVudE5vZGVJc0NvbnRhaW5pbmcgPSBpc0NvbnRhaW5pbmdCbG9jayhjdXJyZW50Tm9kZSk7XG4gICAgaWYgKCFjdXJyZW50Tm9kZUlzQ29udGFpbmluZyAmJiBjb21wdXRlZFN0eWxlLnBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG4gICAgICBjdXJyZW50Q29udGFpbmluZ0Jsb2NrQ29tcHV0ZWRTdHlsZSA9IG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHNob3VsZERyb3BDdXJyZW50Tm9kZSA9IGVsZW1lbnRJc0ZpeGVkID8gIWN1cnJlbnROb2RlSXNDb250YWluaW5nICYmICFjdXJyZW50Q29udGFpbmluZ0Jsb2NrQ29tcHV0ZWRTdHlsZSA6ICFjdXJyZW50Tm9kZUlzQ29udGFpbmluZyAmJiBjb21wdXRlZFN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJyAmJiAhIWN1cnJlbnRDb250YWluaW5nQmxvY2tDb21wdXRlZFN0eWxlICYmIChjdXJyZW50Q29udGFpbmluZ0Jsb2NrQ29tcHV0ZWRTdHlsZS5wb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBjdXJyZW50Q29udGFpbmluZ0Jsb2NrQ29tcHV0ZWRTdHlsZS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJykgfHwgaXNPdmVyZmxvd0VsZW1lbnQoY3VycmVudE5vZGUpICYmICFjdXJyZW50Tm9kZUlzQ29udGFpbmluZyAmJiBoYXNGaXhlZFBvc2l0aW9uQW5jZXN0b3IoZWxlbWVudCwgY3VycmVudE5vZGUpO1xuICAgIGlmIChzaG91bGREcm9wQ3VycmVudE5vZGUpIHtcbiAgICAgIC8vIERyb3Agbm9uLWNvbnRhaW5pbmcgYmxvY2tzLlxuICAgICAgcmVzdWx0ID0gcmVzdWx0LmZpbHRlcihhbmNlc3RvciA9PiBhbmNlc3RvciAhPT0gY3VycmVudE5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWNvcmQgbGFzdCBjb250YWluaW5nIGJsb2NrIGZvciBuZXh0IGl0ZXJhdGlvbi5cbiAgICAgIGN1cnJlbnRDb250YWluaW5nQmxvY2tDb21wdXRlZFN0eWxlID0gY29tcHV0ZWRTdHlsZTtcbiAgICB9XG4gICAgY3VycmVudE5vZGUgPSBnZXRQYXJlbnROb2RlKGN1cnJlbnROb2RlKTtcbiAgfVxuICBjYWNoZS5zZXQoZWxlbWVudCwgcmVzdWx0KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gR2V0cyB0aGUgbWF4aW11bSBhcmVhIHRoYXQgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZSBpbiBkdWUgdG8gYW55IG51bWJlciBvZlxuLy8gY2xpcHBpbmcgYW5jZXN0b3JzLlxuZnVuY3Rpb24gZ2V0Q2xpcHBpbmdSZWN0KF9yZWYpIHtcbiAgbGV0IHtcbiAgICBlbGVtZW50LFxuICAgIGJvdW5kYXJ5LFxuICAgIHJvb3RCb3VuZGFyeSxcbiAgICBzdHJhdGVneVxuICB9ID0gX3JlZjtcbiAgY29uc3QgZWxlbWVudENsaXBwaW5nQW5jZXN0b3JzID0gYm91bmRhcnkgPT09ICdjbGlwcGluZ0FuY2VzdG9ycycgPyBpc1RvcExheWVyKGVsZW1lbnQpID8gW10gOiBnZXRDbGlwcGluZ0VsZW1lbnRBbmNlc3RvcnMoZWxlbWVudCwgdGhpcy5fYykgOiBbXS5jb25jYXQoYm91bmRhcnkpO1xuICBjb25zdCBjbGlwcGluZ0FuY2VzdG9ycyA9IFsuLi5lbGVtZW50Q2xpcHBpbmdBbmNlc3RvcnMsIHJvb3RCb3VuZGFyeV07XG4gIGNvbnN0IGZpcnN0UmVjdCA9IGdldENsaWVudFJlY3RGcm9tQ2xpcHBpbmdBbmNlc3RvcihlbGVtZW50LCBjbGlwcGluZ0FuY2VzdG9yc1swXSwgc3RyYXRlZ3kpO1xuICBsZXQgdG9wID0gZmlyc3RSZWN0LnRvcDtcbiAgbGV0IHJpZ2h0ID0gZmlyc3RSZWN0LnJpZ2h0O1xuICBsZXQgYm90dG9tID0gZmlyc3RSZWN0LmJvdHRvbTtcbiAgbGV0IGxlZnQgPSBmaXJzdFJlY3QubGVmdDtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBjbGlwcGluZ0FuY2VzdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJlY3QgPSBnZXRDbGllbnRSZWN0RnJvbUNsaXBwaW5nQW5jZXN0b3IoZWxlbWVudCwgY2xpcHBpbmdBbmNlc3RvcnNbaV0sIHN0cmF0ZWd5KTtcbiAgICB0b3AgPSBtYXgocmVjdC50b3AsIHRvcCk7XG4gICAgcmlnaHQgPSBtaW4ocmVjdC5yaWdodCwgcmlnaHQpO1xuICAgIGJvdHRvbSA9IG1pbihyZWN0LmJvdHRvbSwgYm90dG9tKTtcbiAgICBsZWZ0ID0gbWF4KHJlY3QubGVmdCwgbGVmdCk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxuICAgIGhlaWdodDogYm90dG9tIC0gdG9wLFxuICAgIHg6IGxlZnQsXG4gICAgeTogdG9wXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldERpbWVuc2lvbnMoZWxlbWVudCkge1xuICBjb25zdCB7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0XG4gIH0gPSBnZXRDc3NEaW1lbnNpb25zKGVsZW1lbnQpO1xuICByZXR1cm4ge1xuICAgIHdpZHRoLFxuICAgIGhlaWdodFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRSZWN0UmVsYXRpdmVUb09mZnNldFBhcmVudChlbGVtZW50LCBvZmZzZXRQYXJlbnQsIHN0cmF0ZWd5KSB7XG4gIGNvbnN0IGlzT2Zmc2V0UGFyZW50QW5FbGVtZW50ID0gaXNIVE1MRWxlbWVudChvZmZzZXRQYXJlbnQpO1xuICBjb25zdCBkb2N1bWVudEVsZW1lbnQgPSBnZXREb2N1bWVudEVsZW1lbnQob2Zmc2V0UGFyZW50KTtcbiAgY29uc3QgaXNGaXhlZCA9IHN0cmF0ZWd5ID09PSAnZml4ZWQnO1xuICBjb25zdCByZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnQsIHRydWUsIGlzRml4ZWQsIG9mZnNldFBhcmVudCk7XG4gIGxldCBzY3JvbGwgPSB7XG4gICAgc2Nyb2xsTGVmdDogMCxcbiAgICBzY3JvbGxUb3A6IDBcbiAgfTtcbiAgY29uc3Qgb2Zmc2V0cyA9IGNyZWF0ZUNvb3JkcygwKTtcblxuICAvLyBJZiB0aGUgPGJvZHk+IHNjcm9sbGJhciBhcHBlYXJzIG9uIHRoZSBsZWZ0IChlLmcuIFJUTCBzeXN0ZW1zKS4gVXNlXG4gIC8vIEZpcmVmb3ggd2l0aCBsYXlvdXQuc2Nyb2xsYmFyLnNpZGUgPSAzIGluIGFib3V0OmNvbmZpZyB0byB0ZXN0IHRoaXMuXG4gIGZ1bmN0aW9uIHNldExlZnRSVExTY3JvbGxiYXJPZmZzZXQoKSB7XG4gICAgb2Zmc2V0cy54ID0gZ2V0V2luZG93U2Nyb2xsQmFyWChkb2N1bWVudEVsZW1lbnQpO1xuICB9XG4gIGlmIChpc09mZnNldFBhcmVudEFuRWxlbWVudCB8fCAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgIWlzRml4ZWQpIHtcbiAgICBpZiAoZ2V0Tm9kZU5hbWUob2Zmc2V0UGFyZW50KSAhPT0gJ2JvZHknIHx8IGlzT3ZlcmZsb3dFbGVtZW50KGRvY3VtZW50RWxlbWVudCkpIHtcbiAgICAgIHNjcm9sbCA9IGdldE5vZGVTY3JvbGwob2Zmc2V0UGFyZW50KTtcbiAgICB9XG4gICAgaWYgKGlzT2Zmc2V0UGFyZW50QW5FbGVtZW50KSB7XG4gICAgICBjb25zdCBvZmZzZXRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KG9mZnNldFBhcmVudCwgdHJ1ZSwgaXNGaXhlZCwgb2Zmc2V0UGFyZW50KTtcbiAgICAgIG9mZnNldHMueCA9IG9mZnNldFJlY3QueCArIG9mZnNldFBhcmVudC5jbGllbnRMZWZ0O1xuICAgICAgb2Zmc2V0cy55ID0gb2Zmc2V0UmVjdC55ICsgb2Zmc2V0UGFyZW50LmNsaWVudFRvcDtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50RWxlbWVudCkge1xuICAgICAgc2V0TGVmdFJUTFNjcm9sbGJhck9mZnNldCgpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNGaXhlZCAmJiAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgc2V0TGVmdFJUTFNjcm9sbGJhck9mZnNldCgpO1xuICB9XG4gIGNvbnN0IGh0bWxPZmZzZXQgPSBkb2N1bWVudEVsZW1lbnQgJiYgIWlzT2Zmc2V0UGFyZW50QW5FbGVtZW50ICYmICFpc0ZpeGVkID8gZ2V0SFRNTE9mZnNldChkb2N1bWVudEVsZW1lbnQsIHNjcm9sbCkgOiBjcmVhdGVDb29yZHMoMCk7XG4gIGNvbnN0IHggPSByZWN0LmxlZnQgKyBzY3JvbGwuc2Nyb2xsTGVmdCAtIG9mZnNldHMueCAtIGh0bWxPZmZzZXQueDtcbiAgY29uc3QgeSA9IHJlY3QudG9wICsgc2Nyb2xsLnNjcm9sbFRvcCAtIG9mZnNldHMueSAtIGh0bWxPZmZzZXQueTtcbiAgcmV0dXJuIHtcbiAgICB4LFxuICAgIHksXG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodFxuICB9O1xufVxuXG5mdW5jdGlvbiBpc1N0YXRpY1Bvc2l0aW9uZWQoZWxlbWVudCkge1xuICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJztcbn1cblxuZnVuY3Rpb24gZ2V0VHJ1ZU9mZnNldFBhcmVudChlbGVtZW50LCBwb2x5ZmlsbCkge1xuICBpZiAoIWlzSFRNTEVsZW1lbnQoZWxlbWVudCkgfHwgZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHBvbHlmaWxsKSB7XG4gICAgcmV0dXJuIHBvbHlmaWxsKGVsZW1lbnQpO1xuICB9XG4gIGxldCByYXdPZmZzZXRQYXJlbnQgPSBlbGVtZW50Lm9mZnNldFBhcmVudDtcblxuICAvLyBGaXJlZm94IHJldHVybnMgdGhlIDxodG1sPiBlbGVtZW50IGFzIHRoZSBvZmZzZXRQYXJlbnQgaWYgaXQncyBub24tc3RhdGljLFxuICAvLyB3aGlsZSBDaHJvbWUgYW5kIFNhZmFyaSByZXR1cm4gdGhlIDxib2R5PiBlbGVtZW50LiBUaGUgPGJvZHk+IGVsZW1lbnQgbXVzdFxuICAvLyBiZSB1c2VkIHRvIHBlcmZvcm0gdGhlIGNvcnJlY3QgY2FsY3VsYXRpb25zIGV2ZW4gaWYgdGhlIDxodG1sPiBlbGVtZW50IGlzXG4gIC8vIG5vbi1zdGF0aWMuXG4gIGlmIChnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCkgPT09IHJhd09mZnNldFBhcmVudCkge1xuICAgIHJhd09mZnNldFBhcmVudCA9IHJhd09mZnNldFBhcmVudC5vd25lckRvY3VtZW50LmJvZHk7XG4gIH1cbiAgcmV0dXJuIHJhd09mZnNldFBhcmVudDtcbn1cblxuLy8gR2V0cyB0aGUgY2xvc2VzdCBhbmNlc3RvciBwb3NpdGlvbmVkIGVsZW1lbnQuIEhhbmRsZXMgc29tZSBlZGdlIGNhc2VzLFxuLy8gc3VjaCBhcyB0YWJsZSBhbmNlc3RvcnMgYW5kIGNyb3NzIGJyb3dzZXIgYnVncy5cbmZ1bmN0aW9uIGdldE9mZnNldFBhcmVudChlbGVtZW50LCBwb2x5ZmlsbCkge1xuICBjb25zdCB3aW4gPSBnZXRXaW5kb3coZWxlbWVudCk7XG4gIGlmIChpc1RvcExheWVyKGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIHdpbjtcbiAgfVxuICBpZiAoIWlzSFRNTEVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICBsZXQgc3ZnT2Zmc2V0UGFyZW50ID0gZ2V0UGFyZW50Tm9kZShlbGVtZW50KTtcbiAgICB3aGlsZSAoc3ZnT2Zmc2V0UGFyZW50ICYmICFpc0xhc3RUcmF2ZXJzYWJsZU5vZGUoc3ZnT2Zmc2V0UGFyZW50KSkge1xuICAgICAgaWYgKGlzRWxlbWVudChzdmdPZmZzZXRQYXJlbnQpICYmICFpc1N0YXRpY1Bvc2l0aW9uZWQoc3ZnT2Zmc2V0UGFyZW50KSkge1xuICAgICAgICByZXR1cm4gc3ZnT2Zmc2V0UGFyZW50O1xuICAgICAgfVxuICAgICAgc3ZnT2Zmc2V0UGFyZW50ID0gZ2V0UGFyZW50Tm9kZShzdmdPZmZzZXRQYXJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gd2luO1xuICB9XG4gIGxldCBvZmZzZXRQYXJlbnQgPSBnZXRUcnVlT2Zmc2V0UGFyZW50KGVsZW1lbnQsIHBvbHlmaWxsKTtcbiAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiBpc1RhYmxlRWxlbWVudChvZmZzZXRQYXJlbnQpICYmIGlzU3RhdGljUG9zaXRpb25lZChvZmZzZXRQYXJlbnQpKSB7XG4gICAgb2Zmc2V0UGFyZW50ID0gZ2V0VHJ1ZU9mZnNldFBhcmVudChvZmZzZXRQYXJlbnQsIHBvbHlmaWxsKTtcbiAgfVxuICBpZiAob2Zmc2V0UGFyZW50ICYmIGlzTGFzdFRyYXZlcnNhYmxlTm9kZShvZmZzZXRQYXJlbnQpICYmIGlzU3RhdGljUG9zaXRpb25lZChvZmZzZXRQYXJlbnQpICYmICFpc0NvbnRhaW5pbmdCbG9jayhvZmZzZXRQYXJlbnQpKSB7XG4gICAgcmV0dXJuIHdpbjtcbiAgfVxuICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGdldENvbnRhaW5pbmdCbG9jayhlbGVtZW50KSB8fCB3aW47XG59XG5cbmNvbnN0IGdldEVsZW1lbnRSZWN0cyA9IGFzeW5jIGZ1bmN0aW9uIChkYXRhKSB7XG4gIGNvbnN0IGdldE9mZnNldFBhcmVudEZuID0gdGhpcy5nZXRPZmZzZXRQYXJlbnQgfHwgZ2V0T2Zmc2V0UGFyZW50O1xuICBjb25zdCBnZXREaW1lbnNpb25zRm4gPSB0aGlzLmdldERpbWVuc2lvbnM7XG4gIGNvbnN0IGZsb2F0aW5nRGltZW5zaW9ucyA9IGF3YWl0IGdldERpbWVuc2lvbnNGbihkYXRhLmZsb2F0aW5nKTtcbiAgcmV0dXJuIHtcbiAgICByZWZlcmVuY2U6IGdldFJlY3RSZWxhdGl2ZVRvT2Zmc2V0UGFyZW50KGRhdGEucmVmZXJlbmNlLCBhd2FpdCBnZXRPZmZzZXRQYXJlbnRGbihkYXRhLmZsb2F0aW5nKSwgZGF0YS5zdHJhdGVneSksXG4gICAgZmxvYXRpbmc6IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgICAgd2lkdGg6IGZsb2F0aW5nRGltZW5zaW9ucy53aWR0aCxcbiAgICAgIGhlaWdodDogZmxvYXRpbmdEaW1lbnNpb25zLmhlaWdodFxuICAgIH1cbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGlzUlRMKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUkMShlbGVtZW50KS5kaXJlY3Rpb24gPT09ICdydGwnO1xufVxuXG5jb25zdCBwbGF0Zm9ybSA9IHtcbiAgY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3QsXG4gIGdldERvY3VtZW50RWxlbWVudCxcbiAgZ2V0Q2xpcHBpbmdSZWN0LFxuICBnZXRPZmZzZXRQYXJlbnQsXG4gIGdldEVsZW1lbnRSZWN0cyxcbiAgZ2V0Q2xpZW50UmVjdHMsXG4gIGdldERpbWVuc2lvbnMsXG4gIGdldFNjYWxlLFxuICBpc0VsZW1lbnQsXG4gIGlzUlRMXG59O1xuXG5mdW5jdGlvbiByZWN0c0FyZUVxdWFsKGEsIGIpIHtcbiAgcmV0dXJuIGEueCA9PT0gYi54ICYmIGEueSA9PT0gYi55ICYmIGEud2lkdGggPT09IGIud2lkdGggJiYgYS5oZWlnaHQgPT09IGIuaGVpZ2h0O1xufVxuXG4vLyBodHRwczovL3NhbXRob3IuYXUvMjAyMS9vYnNlcnZpbmctZG9tL1xuZnVuY3Rpb24gb2JzZXJ2ZU1vdmUoZWxlbWVudCwgb25Nb3ZlKSB7XG4gIGxldCBpbyA9IG51bGw7XG4gIGxldCB0aW1lb3V0SWQ7XG4gIGNvbnN0IHJvb3QgPSBnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCk7XG4gIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgdmFyIF9pbztcbiAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAoX2lvID0gaW8pID09IG51bGwgfHwgX2lvLmRpc2Nvbm5lY3QoKTtcbiAgICBpbyA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gcmVmcmVzaChza2lwLCB0aHJlc2hvbGQpIHtcbiAgICBpZiAoc2tpcCA9PT0gdm9pZCAwKSB7XG4gICAgICBza2lwID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkge1xuICAgICAgdGhyZXNob2xkID0gMTtcbiAgICB9XG4gICAgY2xlYW51cCgpO1xuICAgIGNvbnN0IGVsZW1lbnRSZWN0Rm9yUm9vdE1hcmdpbiA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qge1xuICAgICAgbGVmdCxcbiAgICAgIHRvcCxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0XG4gICAgfSA9IGVsZW1lbnRSZWN0Rm9yUm9vdE1hcmdpbjtcbiAgICBpZiAoIXNraXApIHtcbiAgICAgIG9uTW92ZSgpO1xuICAgIH1cbiAgICBpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW5zZXRUb3AgPSBmbG9vcih0b3ApO1xuICAgIGNvbnN0IGluc2V0UmlnaHQgPSBmbG9vcihyb290LmNsaWVudFdpZHRoIC0gKGxlZnQgKyB3aWR0aCkpO1xuICAgIGNvbnN0IGluc2V0Qm90dG9tID0gZmxvb3Iocm9vdC5jbGllbnRIZWlnaHQgLSAodG9wICsgaGVpZ2h0KSk7XG4gICAgY29uc3QgaW5zZXRMZWZ0ID0gZmxvb3IobGVmdCk7XG4gICAgY29uc3Qgcm9vdE1hcmdpbiA9IC1pbnNldFRvcCArIFwicHggXCIgKyAtaW5zZXRSaWdodCArIFwicHggXCIgKyAtaW5zZXRCb3R0b20gKyBcInB4IFwiICsgLWluc2V0TGVmdCArIFwicHhcIjtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgcm9vdE1hcmdpbixcbiAgICAgIHRocmVzaG9sZDogbWF4KDAsIG1pbigxLCB0aHJlc2hvbGQpKSB8fCAxXG4gICAgfTtcbiAgICBsZXQgaXNGaXJzdFVwZGF0ZSA9IHRydWU7XG4gICAgZnVuY3Rpb24gaGFuZGxlT2JzZXJ2ZShlbnRyaWVzKSB7XG4gICAgICBjb25zdCByYXRpbyA9IGVudHJpZXNbMF0uaW50ZXJzZWN0aW9uUmF0aW87XG4gICAgICBpZiAocmF0aW8gIT09IHRocmVzaG9sZCkge1xuICAgICAgICBpZiAoIWlzRmlyc3RVcGRhdGUpIHtcbiAgICAgICAgICByZXR1cm4gcmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcmF0aW8pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlIGlzIGNsaXBwZWQsIHRoZSByYXRpbyBpcyAwLiBUaHJvdHRsZSB0aGUgcmVmcmVzaFxuICAgICAgICAgIC8vIHRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9vcCBvZiB1cGRhdGVzLlxuICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgcmVmcmVzaChmYWxzZSwgMWUtNyk7XG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVmcmVzaChmYWxzZSwgcmF0aW8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmF0aW8gPT09IDEgJiYgIXJlY3RzQXJlRXF1YWwoZWxlbWVudFJlY3RGb3JSb290TWFyZ2luLCBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKSkge1xuICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgZXZlbiB0aG91Z2ggdGhlIHJhdGlvIGlzIHJlcG9ydGVkIGFzIDEsIHRoZVxuICAgICAgICAvLyBlbGVtZW50IGlzIG5vdCBhY3R1YWxseSBmdWxseSB3aXRoaW4gdGhlIEludGVyc2VjdGlvbk9ic2VydmVyJ3Mgcm9vdFxuICAgICAgICAvLyBhcmVhIGFueW1vcmUuIFRoaXMgY2FuIGhhcHBlbiB1bmRlciBwZXJmb3JtYW5jZSBjb25zdHJhaW50cy4gVGhpcyBtYXlcbiAgICAgICAgLy8gYmUgYSBidWcgaW4gdGhlIGJyb3dzZXIncyBJbnRlcnNlY3Rpb25PYnNlcnZlciBpbXBsZW1lbnRhdGlvbi4gVG9cbiAgICAgICAgLy8gd29yayBhcm91bmQgdGhpcywgd2UgY29tcGFyZSB0aGUgZWxlbWVudCdzIGJvdW5kaW5nIHJlY3Qgbm93IHdpdGhcbiAgICAgICAgLy8gd2hhdCBpdCB3YXMgYXQgdGhlIHRpbWUgd2UgY3JlYXRlZCB0aGUgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIuIElmIHRoZXlcbiAgICAgICAgLy8gYXJlIG5vdCBlcXVhbCB0aGVuIHRoZSBlbGVtZW50IG1vdmVkLCBzbyB3ZSByZWZyZXNoLlxuICAgICAgICByZWZyZXNoKCk7XG4gICAgICB9XG4gICAgICBpc0ZpcnN0VXBkYXRlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gT2xkZXIgYnJvd3NlcnMgZG9uJ3Qgc3VwcG9ydCBhIGBkb2N1bWVudGAgYXMgdGhlIHJvb3QgYW5kIHdpbGwgdGhyb3cgYW5cbiAgICAvLyBlcnJvci5cbiAgICB0cnkge1xuICAgICAgaW8gPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoaGFuZGxlT2JzZXJ2ZSwge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAvLyBIYW5kbGUgPGlmcmFtZT5zXG4gICAgICAgIHJvb3Q6IHJvb3Qub3duZXJEb2N1bWVudFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgIGlvID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGhhbmRsZU9ic2VydmUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpby5vYnNlcnZlKGVsZW1lbnQpO1xuICB9XG4gIHJlZnJlc2godHJ1ZSk7XG4gIHJldHVybiBjbGVhbnVwO1xufVxuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgdXBkYXRlcyB0aGUgcG9zaXRpb24gb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQgd2hlbiBuZWNlc3NhcnkuXG4gKiBTaG91bGQgb25seSBiZSBjYWxsZWQgd2hlbiB0aGUgZmxvYXRpbmcgZWxlbWVudCBpcyBtb3VudGVkIG9uIHRoZSBET00gb3JcbiAqIHZpc2libGUgb24gdGhlIHNjcmVlbi5cbiAqIEByZXR1cm5zIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgaW52b2tlZCB3aGVuIHRoZSBmbG9hdGluZyBlbGVtZW50IGlzXG4gKiByZW1vdmVkIGZyb20gdGhlIERPTSBvciBoaWRkZW4gZnJvbSB0aGUgc2NyZWVuLlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL2F1dG9VcGRhdGVcbiAqL1xuZnVuY3Rpb24gYXV0b1VwZGF0ZShyZWZlcmVuY2UsIGZsb2F0aW5nLCB1cGRhdGUsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICBjb25zdCB7XG4gICAgYW5jZXN0b3JTY3JvbGwgPSB0cnVlLFxuICAgIGFuY2VzdG9yUmVzaXplID0gdHJ1ZSxcbiAgICBlbGVtZW50UmVzaXplID0gdHlwZW9mIFJlc2l6ZU9ic2VydmVyID09PSAnZnVuY3Rpb24nLFxuICAgIGxheW91dFNoaWZ0ID0gdHlwZW9mIEludGVyc2VjdGlvbk9ic2VydmVyID09PSAnZnVuY3Rpb24nLFxuICAgIGFuaW1hdGlvbkZyYW1lID0gZmFsc2VcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHJlZmVyZW5jZUVsID0gdW53cmFwRWxlbWVudChyZWZlcmVuY2UpO1xuICBjb25zdCBhbmNlc3RvcnMgPSBhbmNlc3RvclNjcm9sbCB8fCBhbmNlc3RvclJlc2l6ZSA/IFsuLi4ocmVmZXJlbmNlRWwgPyBnZXRPdmVyZmxvd0FuY2VzdG9ycyhyZWZlcmVuY2VFbCkgOiBbXSksIC4uLihmbG9hdGluZyA/IGdldE92ZXJmbG93QW5jZXN0b3JzKGZsb2F0aW5nKSA6IFtdKV0gOiBbXTtcbiAgYW5jZXN0b3JzLmZvckVhY2goYW5jZXN0b3IgPT4ge1xuICAgIGFuY2VzdG9yU2Nyb2xsICYmIGFuY2VzdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHVwZGF0ZSwge1xuICAgICAgcGFzc2l2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIGFuY2VzdG9yUmVzaXplICYmIGFuY2VzdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZSk7XG4gIH0pO1xuICBjb25zdCBjbGVhbnVwSW8gPSByZWZlcmVuY2VFbCAmJiBsYXlvdXRTaGlmdCA/IG9ic2VydmVNb3ZlKHJlZmVyZW5jZUVsLCB1cGRhdGUpIDogbnVsbDtcbiAgbGV0IHJlb2JzZXJ2ZUZyYW1lID0gLTE7XG4gIGxldCByZXNpemVPYnNlcnZlciA9IG51bGw7XG4gIGlmIChlbGVtZW50UmVzaXplKSB7XG4gICAgcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoX3JlZiA9PiB7XG4gICAgICBsZXQgW2ZpcnN0RW50cnldID0gX3JlZjtcbiAgICAgIGlmIChmaXJzdEVudHJ5ICYmIGZpcnN0RW50cnkudGFyZ2V0ID09PSByZWZlcmVuY2VFbCAmJiByZXNpemVPYnNlcnZlciAmJiBmbG9hdGluZykge1xuICAgICAgICAvLyBQcmV2ZW50IHVwZGF0ZSBsb29wcyB3aGVuIHVzaW5nIHRoZSBgc2l6ZWAgbWlkZGxld2FyZS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zsb2F0aW5nLXVpL2Zsb2F0aW5nLXVpL2lzc3Vlcy8xNzQwXG4gICAgICAgIHJlc2l6ZU9ic2VydmVyLnVub2JzZXJ2ZShmbG9hdGluZyk7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlb2JzZXJ2ZUZyYW1lKTtcbiAgICAgICAgcmVvYnNlcnZlRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgIHZhciBfcmVzaXplT2JzZXJ2ZXI7XG4gICAgICAgICAgKF9yZXNpemVPYnNlcnZlciA9IHJlc2l6ZU9ic2VydmVyKSA9PSBudWxsIHx8IF9yZXNpemVPYnNlcnZlci5vYnNlcnZlKGZsb2F0aW5nKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB1cGRhdGUoKTtcbiAgICB9KTtcbiAgICBpZiAocmVmZXJlbmNlRWwgJiYgIWFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKHJlZmVyZW5jZUVsKTtcbiAgICB9XG4gICAgaWYgKGZsb2F0aW5nKSB7XG4gICAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKGZsb2F0aW5nKTtcbiAgICB9XG4gIH1cbiAgbGV0IGZyYW1lSWQ7XG4gIGxldCBwcmV2UmVmUmVjdCA9IGFuaW1hdGlvbkZyYW1lID8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHJlZmVyZW5jZSkgOiBudWxsO1xuICBpZiAoYW5pbWF0aW9uRnJhbWUpIHtcbiAgICBmcmFtZUxvb3AoKTtcbiAgfVxuICBmdW5jdGlvbiBmcmFtZUxvb3AoKSB7XG4gICAgY29uc3QgbmV4dFJlZlJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QocmVmZXJlbmNlKTtcbiAgICBpZiAocHJldlJlZlJlY3QgJiYgIXJlY3RzQXJlRXF1YWwocHJldlJlZlJlY3QsIG5leHRSZWZSZWN0KSkge1xuICAgICAgdXBkYXRlKCk7XG4gICAgfVxuICAgIHByZXZSZWZSZWN0ID0gbmV4dFJlZlJlY3Q7XG4gICAgZnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZUxvb3ApO1xuICB9XG4gIHVwZGF0ZSgpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHZhciBfcmVzaXplT2JzZXJ2ZXIyO1xuICAgIGFuY2VzdG9ycy5mb3JFYWNoKGFuY2VzdG9yID0+IHtcbiAgICAgIGFuY2VzdG9yU2Nyb2xsICYmIGFuY2VzdG9yLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHVwZGF0ZSk7XG4gICAgICBhbmNlc3RvclJlc2l6ZSAmJiBhbmNlc3Rvci5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGUpO1xuICAgIH0pO1xuICAgIGNsZWFudXBJbyA9PSBudWxsIHx8IGNsZWFudXBJbygpO1xuICAgIChfcmVzaXplT2JzZXJ2ZXIyID0gcmVzaXplT2JzZXJ2ZXIpID09IG51bGwgfHwgX3Jlc2l6ZU9ic2VydmVyMi5kaXNjb25uZWN0KCk7XG4gICAgcmVzaXplT2JzZXJ2ZXIgPSBudWxsO1xuICAgIGlmIChhbmltYXRpb25GcmFtZSkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoZnJhbWVJZCk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlc29sdmVzIHdpdGggYW4gb2JqZWN0IG9mIG92ZXJmbG93IHNpZGUgb2Zmc2V0cyB0aGF0IGRldGVybWluZSBob3cgbXVjaCB0aGVcbiAqIGVsZW1lbnQgaXMgb3ZlcmZsb3dpbmcgYSBnaXZlbiBjbGlwcGluZyBib3VuZGFyeSBvbiBlYWNoIHNpZGUuXG4gKiAtIHBvc2l0aXZlID0gb3ZlcmZsb3dpbmcgdGhlIGJvdW5kYXJ5IGJ5IHRoYXQgbnVtYmVyIG9mIHBpeGVsc1xuICogLSBuZWdhdGl2ZSA9IGhvdyBtYW55IHBpeGVscyBsZWZ0IGJlZm9yZSBpdCB3aWxsIG92ZXJmbG93XG4gKiAtIDAgPSBsaWVzIGZsdXNoIHdpdGggdGhlIGJvdW5kYXJ5XG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvZGV0ZWN0T3ZlcmZsb3dcbiAqL1xuY29uc3QgZGV0ZWN0T3ZlcmZsb3cgPSBkZXRlY3RPdmVyZmxvdyQxO1xuXG4vKipcbiAqIE1vZGlmaWVzIHRoZSBwbGFjZW1lbnQgYnkgdHJhbnNsYXRpbmcgdGhlIGZsb2F0aW5nIGVsZW1lbnQgYWxvbmcgdGhlXG4gKiBzcGVjaWZpZWQgYXhlcy5cbiAqIEEgbnVtYmVyIChzaG9ydGhhbmQgZm9yIGBtYWluQXhpc2Agb3IgZGlzdGFuY2UpLCBvciBhbiBheGVzIGNvbmZpZ3VyYXRpb25cbiAqIG9iamVjdCBtYXkgYmUgcGFzc2VkLlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL29mZnNldFxuICovXG5jb25zdCBvZmZzZXQgPSBvZmZzZXQkMTtcblxuLyoqXG4gKiBPcHRpbWl6ZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQgYnkgY2hvb3NpbmcgdGhlIHBsYWNlbWVudFxuICogdGhhdCBoYXMgdGhlIG1vc3Qgc3BhY2UgYXZhaWxhYmxlIGF1dG9tYXRpY2FsbHksIHdpdGhvdXQgbmVlZGluZyB0byBzcGVjaWZ5IGFcbiAqIHByZWZlcnJlZCBwbGFjZW1lbnQuIEFsdGVybmF0aXZlIHRvIGBmbGlwYC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9hdXRvUGxhY2VtZW50XG4gKi9cbmNvbnN0IGF1dG9QbGFjZW1lbnQgPSBhdXRvUGxhY2VtZW50JDE7XG5cbi8qKlxuICogT3B0aW1pemVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IGJ5IHNoaWZ0aW5nIGl0IGluIG9yZGVyIHRvXG4gKiBrZWVwIGl0IGluIHZpZXcgd2hlbiBpdCB3aWxsIG92ZXJmbG93IHRoZSBjbGlwcGluZyBib3VuZGFyeS5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9zaGlmdFxuICovXG5jb25zdCBzaGlmdCA9IHNoaWZ0JDE7XG5cbi8qKlxuICogT3B0aW1pemVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IGJ5IGZsaXBwaW5nIHRoZSBgcGxhY2VtZW50YFxuICogaW4gb3JkZXIgdG8ga2VlcCBpdCBpbiB2aWV3IHdoZW4gdGhlIHByZWZlcnJlZCBwbGFjZW1lbnQocykgd2lsbCBvdmVyZmxvdyB0aGVcbiAqIGNsaXBwaW5nIGJvdW5kYXJ5LiBBbHRlcm5hdGl2ZSB0byBgYXV0b1BsYWNlbWVudGAuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvZmxpcFxuICovXG5jb25zdCBmbGlwID0gZmxpcCQxO1xuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdGhhdCBhbGxvd3MgeW91IHRvIGNoYW5nZSB0aGUgc2l6ZSBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCDigJRcbiAqIGZvciBpbnN0YW5jZSwgcHJldmVudCBpdCBmcm9tIG92ZXJmbG93aW5nIHRoZSBjbGlwcGluZyBib3VuZGFyeSBvciBtYXRjaCB0aGVcbiAqIHdpZHRoIG9mIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9zaXplXG4gKi9cbmNvbnN0IHNpemUgPSBzaXplJDE7XG5cbi8qKlxuICogUHJvdmlkZXMgZGF0YSB0byBoaWRlIHRoZSBmbG9hdGluZyBlbGVtZW50IGluIGFwcGxpY2FibGUgc2l0dWF0aW9ucywgc3VjaCBhc1xuICogd2hlbiBpdCBpcyBub3QgaW4gdGhlIHNhbWUgY2xpcHBpbmcgY29udGV4dCBhcyB0aGUgcmVmZXJlbmNlIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvaGlkZVxuICovXG5jb25zdCBoaWRlID0gaGlkZSQxO1xuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdG8gcG9zaXRpb24gYW4gaW5uZXIgZWxlbWVudCBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCBzbyB0aGF0IGl0XG4gKiBhcHBlYXJzIGNlbnRlcmVkIHRvIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9hcnJvd1xuICovXG5jb25zdCBhcnJvdyA9IGFycm93JDE7XG5cbi8qKlxuICogUHJvdmlkZXMgaW1wcm92ZWQgcG9zaXRpb25pbmcgZm9yIGlubGluZSByZWZlcmVuY2UgZWxlbWVudHMgdGhhdCBjYW4gc3BhblxuICogb3ZlciBtdWx0aXBsZSBsaW5lcywgc3VjaCBhcyBoeXBlcmxpbmtzIG9yIHJhbmdlIHNlbGVjdGlvbnMuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvaW5saW5lXG4gKi9cbmNvbnN0IGlubGluZSA9IGlubGluZSQxO1xuXG4vKipcbiAqIEJ1aWx0LWluIGBsaW1pdGVyYCB0aGF0IHdpbGwgc3RvcCBgc2hpZnQoKWAgYXQgYSBjZXJ0YWluIHBvaW50LlxuICovXG5jb25zdCBsaW1pdFNoaWZ0ID0gbGltaXRTaGlmdCQxO1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBgeGAgYW5kIGB5YCBjb29yZGluYXRlcyB0aGF0IHdpbGwgcGxhY2UgdGhlIGZsb2F0aW5nIGVsZW1lbnRcbiAqIG5leHQgdG8gYSBnaXZlbiByZWZlcmVuY2UgZWxlbWVudC5cbiAqL1xuY29uc3QgY29tcHV0ZVBvc2l0aW9uID0gKHJlZmVyZW5jZSwgZmxvYXRpbmcsIG9wdGlvbnMpID0+IHtcbiAgLy8gVGhpcyBjYWNoZXMgdGhlIGV4cGVuc2l2ZSBgZ2V0Q2xpcHBpbmdFbGVtZW50QW5jZXN0b3JzYCBmdW5jdGlvbiBzbyB0aGF0XG4gIC8vIG11bHRpcGxlIGxpZmVjeWNsZSByZXNldHMgcmUtdXNlIHRoZSBzYW1lIHJlc3VsdC4gSXQgb25seSBsaXZlcyBmb3IgYVxuICAvLyBzaW5nbGUgY2FsbC4gSWYgb3RoZXIgZnVuY3Rpb25zIGJlY29tZSBleHBlbnNpdmUsIHdlIGNhbiBhZGQgdGhlbSBhcyB3ZWxsLlxuICBjb25zdCBjYWNoZSA9IG5ldyBNYXAoKTtcbiAgY29uc3QgbWVyZ2VkT3B0aW9ucyA9IHtcbiAgICBwbGF0Zm9ybSxcbiAgICAuLi5vcHRpb25zXG4gIH07XG4gIGNvbnN0IHBsYXRmb3JtV2l0aENhY2hlID0ge1xuICAgIC4uLm1lcmdlZE9wdGlvbnMucGxhdGZvcm0sXG4gICAgX2M6IGNhY2hlXG4gIH07XG4gIHJldHVybiBjb21wdXRlUG9zaXRpb24kMShyZWZlcmVuY2UsIGZsb2F0aW5nLCB7XG4gICAgLi4ubWVyZ2VkT3B0aW9ucyxcbiAgICBwbGF0Zm9ybTogcGxhdGZvcm1XaXRoQ2FjaGVcbiAgfSk7XG59O1xuXG5leHBvcnQgeyBhcnJvdywgYXV0b1BsYWNlbWVudCwgYXV0b1VwZGF0ZSwgY29tcHV0ZVBvc2l0aW9uLCBkZXRlY3RPdmVyZmxvdywgZmxpcCwgaGlkZSwgaW5saW5lLCBsaW1pdFNoaWZ0LCBvZmZzZXQsIHBsYXRmb3JtLCBzaGlmdCwgc2l6ZSB9O1xuIiwiaW1wb3J0IHsgY29tcHV0ZVBvc2l0aW9uLCBhcnJvdyBhcyBhcnJvdyQyLCBhdXRvUGxhY2VtZW50IGFzIGF1dG9QbGFjZW1lbnQkMSwgZmxpcCBhcyBmbGlwJDEsIGhpZGUgYXMgaGlkZSQxLCBpbmxpbmUgYXMgaW5saW5lJDEsIGxpbWl0U2hpZnQgYXMgbGltaXRTaGlmdCQxLCBvZmZzZXQgYXMgb2Zmc2V0JDEsIHNoaWZ0IGFzIHNoaWZ0JDEsIHNpemUgYXMgc2l6ZSQxIH0gZnJvbSAnQGZsb2F0aW5nLXVpL2RvbSc7XG5leHBvcnQgeyBhdXRvVXBkYXRlLCBjb21wdXRlUG9zaXRpb24sIGRldGVjdE92ZXJmbG93LCBnZXRPdmVyZmxvd0FuY2VzdG9ycywgcGxhdGZvcm0gfSBmcm9tICdAZmxvYXRpbmctdWkvZG9tJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUxheW91dEVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5cbnZhciBpc0NsaWVudCA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5cbnZhciBub29wID0gZnVuY3Rpb24gbm9vcCgpIHt9O1xudmFyIGluZGV4ID0gaXNDbGllbnQgPyB1c2VMYXlvdXRFZmZlY3QgOiBub29wO1xuXG4vLyBGb3JrIG9mIGBmYXN0LWRlZXAtZXF1YWxgIHRoYXQgb25seSBkb2VzIHRoZSBjb21wYXJpc29ucyB3ZSBuZWVkIGFuZCBjb21wYXJlc1xuLy8gZnVuY3Rpb25zXG5mdW5jdGlvbiBkZWVwRXF1YWwoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgYSAhPT0gdHlwZW9mIGIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBhID09PSAnZnVuY3Rpb24nICYmIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgbGV0IGxlbmd0aDtcbiAgbGV0IGk7XG4gIGxldCBrZXlzO1xuICBpZiAoYSAmJiBiICYmIHR5cGVvZiBhID09PSAnb2JqZWN0Jykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSAhPT0gMDspIHtcbiAgICAgICAgaWYgKCFkZWVwRXF1YWwoYVtpXSwgYltpXSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBrZXlzID0gT2JqZWN0LmtleXMoYSk7XG4gICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYikubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tICE9PSAwOykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleXNbaV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gIT09IDA7KSB7XG4gICAgICBjb25zdCBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGtleSA9PT0gJ19vd25lcicgJiYgYS4kJHR5cGVvZikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBhICE9PSBhICYmIGIgIT09IGI7XG59XG5cbmZ1bmN0aW9uIGdldERQUihlbGVtZW50KSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiAxO1xuICB9XG4gIGNvbnN0IHdpbiA9IGVsZW1lbnQub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIHJldHVybiB3aW4uZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xufVxuXG5mdW5jdGlvbiByb3VuZEJ5RFBSKGVsZW1lbnQsIHZhbHVlKSB7XG4gIGNvbnN0IGRwciA9IGdldERQUihlbGVtZW50KTtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiBkcHIpIC8gZHByO1xufVxuXG5mdW5jdGlvbiB1c2VMYXRlc3RSZWYodmFsdWUpIHtcbiAgY29uc3QgcmVmID0gUmVhY3QudXNlUmVmKHZhbHVlKTtcbiAgaW5kZXgoKCkgPT4ge1xuICAgIHJlZi5jdXJyZW50ID0gdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gcmVmO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdG8gcG9zaXRpb24gYSBmbG9hdGluZyBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL3VzZUZsb2F0aW5nXG4gKi9cbmZ1bmN0aW9uIHVzZUZsb2F0aW5nKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICBjb25zdCB7XG4gICAgcGxhY2VtZW50ID0gJ2JvdHRvbScsXG4gICAgc3RyYXRlZ3kgPSAnYWJzb2x1dGUnLFxuICAgIG1pZGRsZXdhcmUgPSBbXSxcbiAgICBwbGF0Zm9ybSxcbiAgICBlbGVtZW50czoge1xuICAgICAgcmVmZXJlbmNlOiBleHRlcm5hbFJlZmVyZW5jZSxcbiAgICAgIGZsb2F0aW5nOiBleHRlcm5hbEZsb2F0aW5nXG4gICAgfSA9IHt9LFxuICAgIHRyYW5zZm9ybSA9IHRydWUsXG4gICAgd2hpbGVFbGVtZW50c01vdW50ZWQsXG4gICAgb3BlblxuICB9ID0gb3B0aW9ucztcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gUmVhY3QudXNlU3RhdGUoe1xuICAgIHg6IDAsXG4gICAgeTogMCxcbiAgICBzdHJhdGVneSxcbiAgICBwbGFjZW1lbnQsXG4gICAgbWlkZGxld2FyZURhdGE6IHt9LFxuICAgIGlzUG9zaXRpb25lZDogZmFsc2VcbiAgfSk7XG4gIGNvbnN0IFtsYXRlc3RNaWRkbGV3YXJlLCBzZXRMYXRlc3RNaWRkbGV3YXJlXSA9IFJlYWN0LnVzZVN0YXRlKG1pZGRsZXdhcmUpO1xuICBpZiAoIWRlZXBFcXVhbChsYXRlc3RNaWRkbGV3YXJlLCBtaWRkbGV3YXJlKSkge1xuICAgIHNldExhdGVzdE1pZGRsZXdhcmUobWlkZGxld2FyZSk7XG4gIH1cbiAgY29uc3QgW19yZWZlcmVuY2UsIF9zZXRSZWZlcmVuY2VdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtfZmxvYXRpbmcsIF9zZXRGbG9hdGluZ10gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3Qgc2V0UmVmZXJlbmNlID0gUmVhY3QudXNlQ2FsbGJhY2sobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgIT09IHJlZmVyZW5jZVJlZi5jdXJyZW50KSB7XG4gICAgICByZWZlcmVuY2VSZWYuY3VycmVudCA9IG5vZGU7XG4gICAgICBfc2V0UmVmZXJlbmNlKG5vZGUpO1xuICAgIH1cbiAgfSwgW10pO1xuICBjb25zdCBzZXRGbG9hdGluZyA9IFJlYWN0LnVzZUNhbGxiYWNrKG5vZGUgPT4ge1xuICAgIGlmIChub2RlICE9PSBmbG9hdGluZ1JlZi5jdXJyZW50KSB7XG4gICAgICBmbG9hdGluZ1JlZi5jdXJyZW50ID0gbm9kZTtcbiAgICAgIF9zZXRGbG9hdGluZyhub2RlKTtcbiAgICB9XG4gIH0sIFtdKTtcbiAgY29uc3QgcmVmZXJlbmNlRWwgPSBleHRlcm5hbFJlZmVyZW5jZSB8fCBfcmVmZXJlbmNlO1xuICBjb25zdCBmbG9hdGluZ0VsID0gZXh0ZXJuYWxGbG9hdGluZyB8fCBfZmxvYXRpbmc7XG4gIGNvbnN0IHJlZmVyZW5jZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgZmxvYXRpbmdSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGRhdGFSZWYgPSBSZWFjdC51c2VSZWYoZGF0YSk7XG4gIGNvbnN0IGhhc1doaWxlRWxlbWVudHNNb3VudGVkID0gd2hpbGVFbGVtZW50c01vdW50ZWQgIT0gbnVsbDtcbiAgY29uc3Qgd2hpbGVFbGVtZW50c01vdW50ZWRSZWYgPSB1c2VMYXRlc3RSZWYod2hpbGVFbGVtZW50c01vdW50ZWQpO1xuICBjb25zdCBwbGF0Zm9ybVJlZiA9IHVzZUxhdGVzdFJlZihwbGF0Zm9ybSk7XG4gIGNvbnN0IG9wZW5SZWYgPSB1c2VMYXRlc3RSZWYob3Blbik7XG4gIGNvbnN0IHVwZGF0ZSA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoIXJlZmVyZW5jZVJlZi5jdXJyZW50IHx8ICFmbG9hdGluZ1JlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHBsYWNlbWVudCxcbiAgICAgIHN0cmF0ZWd5LFxuICAgICAgbWlkZGxld2FyZTogbGF0ZXN0TWlkZGxld2FyZVxuICAgIH07XG4gICAgaWYgKHBsYXRmb3JtUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbmZpZy5wbGF0Zm9ybSA9IHBsYXRmb3JtUmVmLmN1cnJlbnQ7XG4gICAgfVxuICAgIGNvbXB1dGVQb3NpdGlvbihyZWZlcmVuY2VSZWYuY3VycmVudCwgZmxvYXRpbmdSZWYuY3VycmVudCwgY29uZmlnKS50aGVuKGRhdGEgPT4ge1xuICAgICAgY29uc3QgZnVsbERhdGEgPSB7XG4gICAgICAgIC4uLmRhdGEsXG4gICAgICAgIC8vIFRoZSBmbG9hdGluZyBlbGVtZW50J3MgcG9zaXRpb24gbWF5IGJlIHJlY29tcHV0ZWQgd2hpbGUgaXQncyBjbG9zZWRcbiAgICAgICAgLy8gYnV0IHN0aWxsIG1vdW50ZWQgKHN1Y2ggYXMgd2hlbiB0cmFuc2l0aW9uaW5nIG91dCkuIFRvIGVuc3VyZVxuICAgICAgICAvLyBgaXNQb3NpdGlvbmVkYCB3aWxsIGJlIGBmYWxzZWAgaW5pdGlhbGx5IG9uIHRoZSBuZXh0IG9wZW4sIGF2b2lkXG4gICAgICAgIC8vIHNldHRpbmcgaXQgdG8gYHRydWVgIHdoZW4gYG9wZW4gPT09IGZhbHNlYCAobXVzdCBiZSBzcGVjaWZpZWQpLlxuICAgICAgICBpc1Bvc2l0aW9uZWQ6IG9wZW5SZWYuY3VycmVudCAhPT0gZmFsc2VcbiAgICAgIH07XG4gICAgICBpZiAoaXNNb3VudGVkUmVmLmN1cnJlbnQgJiYgIWRlZXBFcXVhbChkYXRhUmVmLmN1cnJlbnQsIGZ1bGxEYXRhKSkge1xuICAgICAgICBkYXRhUmVmLmN1cnJlbnQgPSBmdWxsRGF0YTtcbiAgICAgICAgUmVhY3RET00uZmx1c2hTeW5jKCgpID0+IHtcbiAgICAgICAgICBzZXREYXRhKGZ1bGxEYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIFtsYXRlc3RNaWRkbGV3YXJlLCBwbGFjZW1lbnQsIHN0cmF0ZWd5LCBwbGF0Zm9ybVJlZiwgb3BlblJlZl0pO1xuICBpbmRleCgoKSA9PiB7XG4gICAgaWYgKG9wZW4gPT09IGZhbHNlICYmIGRhdGFSZWYuY3VycmVudC5pc1Bvc2l0aW9uZWQpIHtcbiAgICAgIGRhdGFSZWYuY3VycmVudC5pc1Bvc2l0aW9uZWQgPSBmYWxzZTtcbiAgICAgIHNldERhdGEoZGF0YSA9PiAoe1xuICAgICAgICAuLi5kYXRhLFxuICAgICAgICBpc1Bvc2l0aW9uZWQ6IGZhbHNlXG4gICAgICB9KSk7XG4gICAgfVxuICB9LCBbb3Blbl0pO1xuICBjb25zdCBpc01vdW50ZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBpbmRleCgoKSA9PiB7XG4gICAgaXNNb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpc01vdW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH07XG4gIH0sIFtdKTtcbiAgaW5kZXgoKCkgPT4ge1xuICAgIGlmIChyZWZlcmVuY2VFbCkgcmVmZXJlbmNlUmVmLmN1cnJlbnQgPSByZWZlcmVuY2VFbDtcbiAgICBpZiAoZmxvYXRpbmdFbCkgZmxvYXRpbmdSZWYuY3VycmVudCA9IGZsb2F0aW5nRWw7XG4gICAgaWYgKHJlZmVyZW5jZUVsICYmIGZsb2F0aW5nRWwpIHtcbiAgICAgIGlmICh3aGlsZUVsZW1lbnRzTW91bnRlZFJlZi5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybiB3aGlsZUVsZW1lbnRzTW91bnRlZFJlZi5jdXJyZW50KHJlZmVyZW5jZUVsLCBmbG9hdGluZ0VsLCB1cGRhdGUpO1xuICAgICAgfVxuICAgICAgdXBkYXRlKCk7XG4gICAgfVxuICB9LCBbcmVmZXJlbmNlRWwsIGZsb2F0aW5nRWwsIHVwZGF0ZSwgd2hpbGVFbGVtZW50c01vdW50ZWRSZWYsIGhhc1doaWxlRWxlbWVudHNNb3VudGVkXSk7XG4gIGNvbnN0IHJlZnMgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgcmVmZXJlbmNlOiByZWZlcmVuY2VSZWYsXG4gICAgZmxvYXRpbmc6IGZsb2F0aW5nUmVmLFxuICAgIHNldFJlZmVyZW5jZSxcbiAgICBzZXRGbG9hdGluZ1xuICB9KSwgW3NldFJlZmVyZW5jZSwgc2V0RmxvYXRpbmddKTtcbiAgY29uc3QgZWxlbWVudHMgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgcmVmZXJlbmNlOiByZWZlcmVuY2VFbCxcbiAgICBmbG9hdGluZzogZmxvYXRpbmdFbFxuICB9KSwgW3JlZmVyZW5jZUVsLCBmbG9hdGluZ0VsXSk7XG4gIGNvbnN0IGZsb2F0aW5nU3R5bGVzID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IHtcbiAgICAgIHBvc2l0aW9uOiBzdHJhdGVneSxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB0b3A6IDBcbiAgICB9O1xuICAgIGlmICghZWxlbWVudHMuZmxvYXRpbmcpIHtcbiAgICAgIHJldHVybiBpbml0aWFsU3R5bGVzO1xuICAgIH1cbiAgICBjb25zdCB4ID0gcm91bmRCeURQUihlbGVtZW50cy5mbG9hdGluZywgZGF0YS54KTtcbiAgICBjb25zdCB5ID0gcm91bmRCeURQUihlbGVtZW50cy5mbG9hdGluZywgZGF0YS55KTtcbiAgICBpZiAodHJhbnNmb3JtKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5pbml0aWFsU3R5bGVzLFxuICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgpXCIsXG4gICAgICAgIC4uLihnZXREUFIoZWxlbWVudHMuZmxvYXRpbmcpID49IDEuNSAmJiB7XG4gICAgICAgICAgd2lsbENoYW5nZTogJ3RyYW5zZm9ybSdcbiAgICAgICAgfSlcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwb3NpdGlvbjogc3RyYXRlZ3ksXG4gICAgICBsZWZ0OiB4LFxuICAgICAgdG9wOiB5XG4gICAgfTtcbiAgfSwgW3N0cmF0ZWd5LCB0cmFuc2Zvcm0sIGVsZW1lbnRzLmZsb2F0aW5nLCBkYXRhLngsIGRhdGEueV0pO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIC4uLmRhdGEsXG4gICAgdXBkYXRlLFxuICAgIHJlZnMsXG4gICAgZWxlbWVudHMsXG4gICAgZmxvYXRpbmdTdHlsZXNcbiAgfSksIFtkYXRhLCB1cGRhdGUsIHJlZnMsIGVsZW1lbnRzLCBmbG9hdGluZ1N0eWxlc10pO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdG8gcG9zaXRpb24gYW4gaW5uZXIgZWxlbWVudCBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCBzbyB0aGF0IGl0XG4gKiBhcHBlYXJzIGNlbnRlcmVkIHRvIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cbiAqIFRoaXMgd3JhcHMgdGhlIGNvcmUgYGFycm93YCBtaWRkbGV3YXJlIHRvIGFsbG93IFJlYWN0IHJlZnMgYXMgdGhlIGVsZW1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvYXJyb3dcbiAqL1xuY29uc3QgYXJyb3ckMSA9IG9wdGlvbnMgPT4ge1xuICBmdW5jdGlvbiBpc1JlZih2YWx1ZSkge1xuICAgIHJldHVybiB7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY3VycmVudCcpO1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2Fycm93JyxcbiAgICBvcHRpb25zLFxuICAgIGZuKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGVsZW1lbnQsXG4gICAgICAgIHBhZGRpbmdcbiAgICAgIH0gPSB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMoc3RhdGUpIDogb3B0aW9ucztcbiAgICAgIGlmIChlbGVtZW50ICYmIGlzUmVmKGVsZW1lbnQpKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnQgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBhcnJvdyQyKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnQuY3VycmVudCxcbiAgICAgICAgICAgIHBhZGRpbmdcbiAgICAgICAgICB9KS5mbihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGFycm93JDIoe1xuICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgcGFkZGluZ1xuICAgICAgICB9KS5mbihzdGF0ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xufTtcblxuLyoqXG4gKiBNb2RpZmllcyB0aGUgcGxhY2VtZW50IGJ5IHRyYW5zbGF0aW5nIHRoZSBmbG9hdGluZyBlbGVtZW50IGFsb25nIHRoZVxuICogc3BlY2lmaWVkIGF4ZXMuXG4gKiBBIG51bWJlciAoc2hvcnRoYW5kIGZvciBgbWFpbkF4aXNgIG9yIGRpc3RhbmNlKSwgb3IgYW4gYXhlcyBjb25maWd1cmF0aW9uXG4gKiBvYmplY3QgbWF5IGJlIHBhc3NlZC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9vZmZzZXRcbiAqL1xuY29uc3Qgb2Zmc2V0ID0gKG9wdGlvbnMsIGRlcHMpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gb2Zmc2V0JDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVzdWx0Lm5hbWUsXG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbi8qKlxuICogT3B0aW1pemVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IGJ5IHNoaWZ0aW5nIGl0IGluIG9yZGVyIHRvXG4gKiBrZWVwIGl0IGluIHZpZXcgd2hlbiBpdCB3aWxsIG92ZXJmbG93IHRoZSBjbGlwcGluZyBib3VuZGFyeS5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9zaGlmdFxuICovXG5jb25zdCBzaGlmdCA9IChvcHRpb25zLCBkZXBzKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IHNoaWZ0JDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVzdWx0Lm5hbWUsXG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbi8qKlxuICogQnVpbHQtaW4gYGxpbWl0ZXJgIHRoYXQgd2lsbCBzdG9wIGBzaGlmdCgpYCBhdCBhIGNlcnRhaW4gcG9pbnQuXG4gKi9cbmNvbnN0IGxpbWl0U2hpZnQgPSAob3B0aW9ucywgZGVwcykgPT4ge1xuICBjb25zdCByZXN1bHQgPSBsaW1pdFNoaWZ0JDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbi8qKlxuICogT3B0aW1pemVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IGJ5IGZsaXBwaW5nIHRoZSBgcGxhY2VtZW50YFxuICogaW4gb3JkZXIgdG8ga2VlcCBpdCBpbiB2aWV3IHdoZW4gdGhlIHByZWZlcnJlZCBwbGFjZW1lbnQocykgd2lsbCBvdmVyZmxvdyB0aGVcbiAqIGNsaXBwaW5nIGJvdW5kYXJ5LiBBbHRlcm5hdGl2ZSB0byBgYXV0b1BsYWNlbWVudGAuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvZmxpcFxuICovXG5jb25zdCBmbGlwID0gKG9wdGlvbnMsIGRlcHMpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gZmxpcCQxKG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIG5hbWU6IHJlc3VsdC5uYW1lLFxuICAgIGZuOiByZXN1bHQuZm4sXG4gICAgb3B0aW9uczogW29wdGlvbnMsIGRlcHNdXG4gIH07XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdGhhdCBhbGxvd3MgeW91IHRvIGNoYW5nZSB0aGUgc2l6ZSBvZiB0aGUgZmxvYXRpbmcgZWxlbWVudCDigJRcbiAqIGZvciBpbnN0YW5jZSwgcHJldmVudCBpdCBmcm9tIG92ZXJmbG93aW5nIHRoZSBjbGlwcGluZyBib3VuZGFyeSBvciBtYXRjaCB0aGVcbiAqIHdpZHRoIG9mIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9zaXplXG4gKi9cbmNvbnN0IHNpemUgPSAob3B0aW9ucywgZGVwcykgPT4ge1xuICBjb25zdCByZXN1bHQgPSBzaXplJDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVzdWx0Lm5hbWUsXG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbi8qKlxuICogT3B0aW1pemVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IGJ5IGNob29zaW5nIHRoZSBwbGFjZW1lbnRcbiAqIHRoYXQgaGFzIHRoZSBtb3N0IHNwYWNlIGF2YWlsYWJsZSBhdXRvbWF0aWNhbGx5LCB3aXRob3V0IG5lZWRpbmcgdG8gc3BlY2lmeSBhXG4gKiBwcmVmZXJyZWQgcGxhY2VtZW50LiBBbHRlcm5hdGl2ZSB0byBgZmxpcGAuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvYXV0b1BsYWNlbWVudFxuICovXG5jb25zdCBhdXRvUGxhY2VtZW50ID0gKG9wdGlvbnMsIGRlcHMpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gYXV0b1BsYWNlbWVudCQxKG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIG5hbWU6IHJlc3VsdC5uYW1lLFxuICAgIGZuOiByZXN1bHQuZm4sXG4gICAgb3B0aW9uczogW29wdGlvbnMsIGRlcHNdXG4gIH07XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGRhdGEgdG8gaGlkZSB0aGUgZmxvYXRpbmcgZWxlbWVudCBpbiBhcHBsaWNhYmxlIHNpdHVhdGlvbnMsIHN1Y2ggYXNcbiAqIHdoZW4gaXQgaXMgbm90IGluIHRoZSBzYW1lIGNsaXBwaW5nIGNvbnRleHQgYXMgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL2hpZGVcbiAqL1xuY29uc3QgaGlkZSA9IChvcHRpb25zLCBkZXBzKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IGhpZGUkMShvcHRpb25zKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiByZXN1bHQubmFtZSxcbiAgICBmbjogcmVzdWx0LmZuLFxuICAgIG9wdGlvbnM6IFtvcHRpb25zLCBkZXBzXVxuICB9O1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBpbXByb3ZlZCBwb3NpdGlvbmluZyBmb3IgaW5saW5lIHJlZmVyZW5jZSBlbGVtZW50cyB0aGF0IGNhbiBzcGFuXG4gKiBvdmVyIG11bHRpcGxlIGxpbmVzLCBzdWNoIGFzIGh5cGVybGlua3Mgb3IgcmFuZ2Ugc2VsZWN0aW9ucy5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9pbmxpbmVcbiAqL1xuY29uc3QgaW5saW5lID0gKG9wdGlvbnMsIGRlcHMpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gaW5saW5lJDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVzdWx0Lm5hbWUsXG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgZGF0YSB0byBwb3NpdGlvbiBhbiBpbm5lciBlbGVtZW50IG9mIHRoZSBmbG9hdGluZyBlbGVtZW50IHNvIHRoYXQgaXRcbiAqIGFwcGVhcnMgY2VudGVyZWQgdG8gdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICogVGhpcyB3cmFwcyB0aGUgY29yZSBgYXJyb3dgIG1pZGRsZXdhcmUgdG8gYWxsb3cgUmVhY3QgcmVmcyBhcyB0aGUgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9hcnJvd1xuICovXG5jb25zdCBhcnJvdyA9IChvcHRpb25zLCBkZXBzKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IGFycm93JDEob3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVzdWx0Lm5hbWUsXG4gICAgZm46IHJlc3VsdC5mbixcbiAgICBvcHRpb25zOiBbb3B0aW9ucywgZGVwc11cbiAgfTtcbn07XG5cbmV4cG9ydCB7IGFycm93LCBhdXRvUGxhY2VtZW50LCBmbGlwLCBoaWRlLCBpbmxpbmUsIGxpbWl0U2hpZnQsIG9mZnNldCwgc2hpZnQsIHNpemUsIHVzZUZsb2F0aW5nIH07XG4iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCB7IGlzRWxlbWVudCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgdXNlSWQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJZCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlUmVmV2l0aEluaXQgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VSZWZXaXRoSW5pdCc7XG5pbXBvcnQgeyBQb3B1cFRyaWdnZXJNYXAgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcG9wdXBzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyB1c2VGbG9hdGluZ1BhcmVudE5vZGVJZCB9IGZyb20gXCIuLi9jb21wb25lbnRzL0Zsb2F0aW5nVHJlZS5qc1wiO1xuaW1wb3J0IHsgRmxvYXRpbmdSb290U3RvcmUgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9GbG9hdGluZ1Jvb3RTdG9yZS5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUZsb2F0aW5nUm9vdENvbnRleHQob3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgb3BlbiA9IGZhbHNlLFxuICAgIG9uT3BlbkNoYW5nZSxcbiAgICBlbGVtZW50cyA9IHt9XG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBmbG9hdGluZ0lkID0gdXNlSWQoKTtcbiAgY29uc3QgbmVzdGVkID0gdXNlRmxvYXRpbmdQYXJlbnROb2RlSWQoKSAhPSBudWxsO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGNvbnN0IG9wdGlvbkRvbVJlZmVyZW5jZSA9IGVsZW1lbnRzLnJlZmVyZW5jZTtcbiAgICBpZiAob3B0aW9uRG9tUmVmZXJlbmNlICYmICFpc0VsZW1lbnQob3B0aW9uRG9tUmVmZXJlbmNlKSkge1xuICAgICAgY29uc29sZS5lcnJvcignQ2Fubm90IHBhc3MgYSB2aXJ0dWFsIGVsZW1lbnQgdG8gdGhlIGBlbGVtZW50cy5yZWZlcmVuY2VgIG9wdGlvbiwnLCAnYXMgaXQgbXVzdCBiZSBhIHJlYWwgRE9NIGVsZW1lbnQuIFVzZSBgY29udGV4dC5zZXRQb3NpdGlvblJlZmVyZW5jZSgpYCcsICdpbnN0ZWFkLicpO1xuICAgIH1cbiAgfVxuICBjb25zdCBzdG9yZSA9IHVzZVJlZldpdGhJbml0KCgpID0+IG5ldyBGbG9hdGluZ1Jvb3RTdG9yZSh7XG4gICAgb3BlbixcbiAgICB0cmFuc2l0aW9uU3RhdHVzOiB1bmRlZmluZWQsXG4gICAgb25PcGVuQ2hhbmdlLFxuICAgIHJlZmVyZW5jZUVsZW1lbnQ6IGVsZW1lbnRzLnJlZmVyZW5jZSA/PyBudWxsLFxuICAgIGZsb2F0aW5nRWxlbWVudDogZWxlbWVudHMuZmxvYXRpbmcgPz8gbnVsbCxcbiAgICB0cmlnZ2VyRWxlbWVudHM6IG5ldyBQb3B1cFRyaWdnZXJNYXAoKSxcbiAgICBmbG9hdGluZ0lkLFxuICAgIHN5bmNPbmx5OiBmYWxzZSxcbiAgICBuZXN0ZWRcbiAgfSkpLmN1cnJlbnQ7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgdmFsdWVzVG9TeW5jID0ge1xuICAgICAgb3BlbixcbiAgICAgIGZsb2F0aW5nSWRcbiAgICB9O1xuXG4gICAgLy8gT25seSBzeW5jIGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgdG8gYXZvaWQgb3ZlcndyaXRpbmcgZXhpc3Rpbmcgb25lc1xuICAgIGlmIChlbGVtZW50cy5yZWZlcmVuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFsdWVzVG9TeW5jLnJlZmVyZW5jZUVsZW1lbnQgPSBlbGVtZW50cy5yZWZlcmVuY2U7XG4gICAgICB2YWx1ZXNUb1N5bmMuZG9tUmVmZXJlbmNlRWxlbWVudCA9IGlzRWxlbWVudChlbGVtZW50cy5yZWZlcmVuY2UpID8gZWxlbWVudHMucmVmZXJlbmNlIDogbnVsbDtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnRzLmZsb2F0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbHVlc1RvU3luYy5mbG9hdGluZ0VsZW1lbnQgPSBlbGVtZW50cy5mbG9hdGluZztcbiAgICB9XG4gICAgc3RvcmUudXBkYXRlKHZhbHVlc1RvU3luYyk7XG4gIH0sIFtvcGVuLCBmbG9hdGluZ0lkLCBlbGVtZW50cy5yZWZlcmVuY2UsIGVsZW1lbnRzLmZsb2F0aW5nLCBzdG9yZV0pO1xuICBzdG9yZS5jb250ZXh0Lm9uT3BlbkNoYW5nZSA9IG9uT3BlbkNoYW5nZTtcbiAgc3RvcmUuY29udGV4dC5uZXN0ZWQgPSBuZXN0ZWQ7XG4gIHJldHVybiBzdG9yZTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5pbXBvcnQgeyB1c2VGbG9hdGluZyBhcyB1c2VQb3NpdGlvbiB9IGZyb20gJ0BmbG9hdGluZy11aS9yZWFjdC1kb20nO1xuaW1wb3J0IHsgaXNFbGVtZW50IH0gZnJvbSAnQGZsb2F0aW5nLXVpL3V0aWxzL2RvbSc7XG5pbXBvcnQgeyB1c2VGbG9hdGluZ1RyZWUgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9GbG9hdGluZ1RyZWUuanNcIjtcbmltcG9ydCB7IHVzZUZsb2F0aW5nUm9vdENvbnRleHQgfSBmcm9tIFwiLi91c2VGbG9hdGluZ1Jvb3RDb250ZXh0LmpzXCI7XG5cbi8qKlxuICogUHJvdmlkZXMgZGF0YSB0byBwb3NpdGlvbiBhIGZsb2F0aW5nIGVsZW1lbnQgYW5kIGNvbnRleHQgdG8gYWRkIGludGVyYWN0aW9ucy5cbiAqIEBzZWUgaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy91c2VGbG9hdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRmxvYXRpbmcob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBub2RlSWQsXG4gICAgZXh0ZXJuYWxUcmVlXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBpbnRlcm5hbFN0b3JlID0gdXNlRmxvYXRpbmdSb290Q29udGV4dChvcHRpb25zKTtcbiAgY29uc3Qgc3RvcmUgPSBvcHRpb25zLnJvb3RDb250ZXh0IHx8IGludGVybmFsU3RvcmU7XG4gIGNvbnN0IHJlZmVyZW5jZUVsZW1lbnQgPSBzdG9yZS51c2VTdGF0ZSgncmVmZXJlbmNlRWxlbWVudCcpO1xuICBjb25zdCBmbG9hdGluZ0VsZW1lbnQgPSBzdG9yZS51c2VTdGF0ZSgnZmxvYXRpbmdFbGVtZW50Jyk7XG4gIGNvbnN0IGRvbVJlZmVyZW5jZUVsZW1lbnQgPSBzdG9yZS51c2VTdGF0ZSgnZG9tUmVmZXJlbmNlRWxlbWVudCcpO1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgZmxvYXRpbmdJZCA9IHN0b3JlLnVzZVN0YXRlKCdmbG9hdGluZ0lkJyk7XG4gIGNvbnN0IFtwb3NpdGlvblJlZmVyZW5jZSwgc2V0UG9zaXRpb25SZWZlcmVuY2VSYXddID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtsb2NhbERvbVJlZmVyZW5jZSwgc2V0TG9jYWxEb21SZWZlcmVuY2VdID0gUmVhY3QudXNlU3RhdGUodW5kZWZpbmVkKTtcbiAgY29uc3QgW2xvY2FsRmxvYXRpbmdFbGVtZW50LCBzZXRMb2NhbEZsb2F0aW5nRWxlbWVudF0gPSBSZWFjdC51c2VTdGF0ZSh1bmRlZmluZWQpO1xuICBjb25zdCBkb21SZWZlcmVuY2VSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoZXh0ZXJuYWxUcmVlKTtcbiAgY29uc3Qgc3RvcmVFbGVtZW50cyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICByZWZlcmVuY2U6IHJlZmVyZW5jZUVsZW1lbnQsXG4gICAgZmxvYXRpbmc6IGZsb2F0aW5nRWxlbWVudCxcbiAgICBkb21SZWZlcmVuY2U6IGRvbVJlZmVyZW5jZUVsZW1lbnRcbiAgfSksIFtyZWZlcmVuY2VFbGVtZW50LCBmbG9hdGluZ0VsZW1lbnQsIGRvbVJlZmVyZW5jZUVsZW1lbnRdKTtcbiAgY29uc3QgcG9zaXRpb24gPSB1c2VQb3NpdGlvbih7XG4gICAgLi4ub3B0aW9ucyxcbiAgICBlbGVtZW50czoge1xuICAgICAgLi4uc3RvcmVFbGVtZW50cyxcbiAgICAgIC4uLihwb3NpdGlvblJlZmVyZW5jZSAmJiB7XG4gICAgICAgIHJlZmVyZW5jZTogcG9zaXRpb25SZWZlcmVuY2VcbiAgICAgIH0pXG4gICAgfVxuICB9KTtcbiAgY29uc3QgbG9jYWxEb21SZWZlcmVuY2VFbGVtZW50ID0gaXNFbGVtZW50KGxvY2FsRG9tUmVmZXJlbmNlKSA/IGxvY2FsRG9tUmVmZXJlbmNlIDogbnVsbDtcbiAgY29uc3Qgc3luY2VkRmxvYXRpbmdFbGVtZW50ID0gbG9jYWxGbG9hdGluZ0VsZW1lbnQgPT09IHVuZGVmaW5lZCA/IHN0b3JlLnN0YXRlLmZsb2F0aW5nRWxlbWVudCA6IGxvY2FsRmxvYXRpbmdFbGVtZW50O1xuICBzdG9yZS51c2VTeW5jZWRWYWx1ZSgncmVmZXJlbmNlRWxlbWVudCcsIGxvY2FsRG9tUmVmZXJlbmNlID8/IG51bGwpO1xuICBzdG9yZS51c2VTeW5jZWRWYWx1ZSgnZG9tUmVmZXJlbmNlRWxlbWVudCcsIGxvY2FsRG9tUmVmZXJlbmNlID09PSB1bmRlZmluZWQgPyBkb21SZWZlcmVuY2VFbGVtZW50IDogbG9jYWxEb21SZWZlcmVuY2VFbGVtZW50KTtcbiAgc3RvcmUudXNlU3luY2VkVmFsdWUoJ2Zsb2F0aW5nRWxlbWVudCcsIHN5bmNlZEZsb2F0aW5nRWxlbWVudCk7XG4gIGNvbnN0IHNldFBvc2l0aW9uUmVmZXJlbmNlID0gUmVhY3QudXNlQ2FsbGJhY2sobm9kZSA9PiB7XG4gICAgY29uc3QgY29tcHV0ZWRQb3NpdGlvblJlZmVyZW5jZSA9IGlzRWxlbWVudChub2RlKSA/IHtcbiAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogKCkgPT4gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIGdldENsaWVudFJlY3RzOiAoKSA9PiBub2RlLmdldENsaWVudFJlY3RzKCksXG4gICAgICBjb250ZXh0RWxlbWVudDogbm9kZVxuICAgIH0gOiBub2RlO1xuICAgIC8vIFN0b3JlIHRoZSBwb3NpdGlvblJlZmVyZW5jZSBpbiBzdGF0ZSBpZiB0aGUgRE9NIHJlZmVyZW5jZSBpcyBzcGVjaWZpZWQgZXh0ZXJuYWxseSB2aWEgdGhlXG4gICAgLy8gYGVsZW1lbnRzLnJlZmVyZW5jZWAgb3B0aW9uLiBUaGlzIGVuc3VyZXMgdGhhdCBpdCB3b24ndCBiZSBvdmVycmlkZGVuIG9uIGZ1dHVyZSByZW5kZXJzLlxuICAgIHNldFBvc2l0aW9uUmVmZXJlbmNlUmF3KGNvbXB1dGVkUG9zaXRpb25SZWZlcmVuY2UpO1xuICAgIHBvc2l0aW9uLnJlZnMuc2V0UmVmZXJlbmNlKGNvbXB1dGVkUG9zaXRpb25SZWZlcmVuY2UpO1xuICB9LCBbcG9zaXRpb24ucmVmc10pO1xuICBjb25zdCBzZXRSZWZlcmVuY2UgPSBSZWFjdC51c2VDYWxsYmFjayhub2RlID0+IHtcbiAgICBpZiAoaXNFbGVtZW50KG5vZGUpIHx8IG5vZGUgPT09IG51bGwpIHtcbiAgICAgIGRvbVJlZmVyZW5jZVJlZi5jdXJyZW50ID0gbm9kZTtcbiAgICAgIHNldExvY2FsRG9tUmVmZXJlbmNlKG5vZGUpO1xuICAgIH1cblxuICAgIC8vIEJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBwYXNzaW5nIGEgdmlydHVhbCBlbGVtZW50IHRvIGByZWZlcmVuY2VgXG4gICAgLy8gYWZ0ZXIgaXQgaGFzIHNldCB0aGUgRE9NIHJlZmVyZW5jZS5cbiAgICBpZiAoaXNFbGVtZW50KHBvc2l0aW9uLnJlZnMucmVmZXJlbmNlLmN1cnJlbnQpIHx8IHBvc2l0aW9uLnJlZnMucmVmZXJlbmNlLmN1cnJlbnQgPT09IG51bGwgfHxcbiAgICAvLyBEb24ndCBhbGxvdyBzZXR0aW5nIHZpcnR1YWwgZWxlbWVudHMgdXNpbmcgdGhlIG9sZCB0ZWNobmlxdWUgYmFjayB0b1xuICAgIC8vIGBudWxsYCB0byBzdXBwb3J0IGBwb3NpdGlvblJlZmVyZW5jZWAgKyBhbiB1bnN0YWJsZSBgcmVmZXJlbmNlYFxuICAgIC8vIGNhbGxiYWNrIHJlZi5cbiAgICBub2RlICE9PSBudWxsICYmICFpc0VsZW1lbnQobm9kZSkpIHtcbiAgICAgIHBvc2l0aW9uLnJlZnMuc2V0UmVmZXJlbmNlKG5vZGUpO1xuICAgIH1cbiAgfSwgW3Bvc2l0aW9uLnJlZnMsIHNldExvY2FsRG9tUmVmZXJlbmNlXSk7XG4gIGNvbnN0IHNldEZsb2F0aW5nID0gUmVhY3QudXNlQ2FsbGJhY2sobm9kZSA9PiB7XG4gICAgc2V0TG9jYWxGbG9hdGluZ0VsZW1lbnQobm9kZSk7XG4gICAgcG9zaXRpb24ucmVmcy5zZXRGbG9hdGluZyhub2RlKTtcbiAgfSwgW3Bvc2l0aW9uLnJlZnNdKTtcbiAgY29uc3QgcmVmcyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gKHtcbiAgICAuLi5wb3NpdGlvbi5yZWZzLFxuICAgIHNldFJlZmVyZW5jZSxcbiAgICBzZXRGbG9hdGluZyxcbiAgICBzZXRQb3NpdGlvblJlZmVyZW5jZSxcbiAgICBkb21SZWZlcmVuY2U6IGRvbVJlZmVyZW5jZVJlZlxuICB9KSwgW3Bvc2l0aW9uLnJlZnMsIHNldFJlZmVyZW5jZSwgc2V0RmxvYXRpbmcsIHNldFBvc2l0aW9uUmVmZXJlbmNlXSk7XG4gIGNvbnN0IGVsZW1lbnRzID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIC4uLnBvc2l0aW9uLmVsZW1lbnRzLFxuICAgIGRvbVJlZmVyZW5jZTogZG9tUmVmZXJlbmNlRWxlbWVudFxuICB9KSwgW3Bvc2l0aW9uLmVsZW1lbnRzLCBkb21SZWZlcmVuY2VFbGVtZW50XSk7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgLi4ucG9zaXRpb24sXG4gICAgZGF0YVJlZjogc3RvcmUuY29udGV4dC5kYXRhUmVmLFxuICAgIG9wZW4sXG4gICAgb25PcGVuQ2hhbmdlOiBzdG9yZS5zZXRPcGVuLFxuICAgIGV2ZW50czogc3RvcmUuY29udGV4dC5ldmVudHMsXG4gICAgZmxvYXRpbmdJZCxcbiAgICByZWZzLFxuICAgIGVsZW1lbnRzLFxuICAgIG5vZGVJZCxcbiAgICByb290U3RvcmU6IHN0b3JlXG4gIH0pLCBbcG9zaXRpb24sIHJlZnMsIGVsZW1lbnRzLCBub2RlSWQsIHN0b3JlLCBvcGVuLCBmbG9hdGluZ0lkXSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvbVJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgIGRvbVJlZmVyZW5jZVJlZi5jdXJyZW50ID0gZG9tUmVmZXJlbmNlRWxlbWVudDtcbiAgICB9XG4gIH0sIFtkb21SZWZlcmVuY2VFbGVtZW50XSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgc3RvcmUuY29udGV4dC5kYXRhUmVmLmN1cnJlbnQuZmxvYXRpbmdDb250ZXh0ID0gY29udGV4dDtcbiAgICBjb25zdCBub2RlID0gdHJlZT8ubm9kZXNSZWYuY3VycmVudC5maW5kKG4gPT4gbi5pZCA9PT0gbm9kZUlkKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgbm9kZS5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIC4uLnBvc2l0aW9uLFxuICAgIGNvbnRleHQsXG4gICAgcmVmcyxcbiAgICBlbGVtZW50cyxcbiAgICByb290U3RvcmU6IHN0b3JlXG4gIH0pLCBbcG9zaXRpb24sIHJlZnMsIGVsZW1lbnRzLCBjb250ZXh0LCBzdG9yZV0pO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlQW5pbWF0aW9uRnJhbWUgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VBbmltYXRpb25GcmFtZSc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IHVzZVN0YWJsZUNhbGxiYWNrIH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlU3RhYmxlQ2FsbGJhY2snO1xuaW1wb3J0IHsgdXNlVmFsdWVBc1JlZiB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVZhbHVlQXNSZWYnO1xuaW1wb3J0IHsgaXNIVE1MRWxlbWVudCB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscy9kb20nO1xuaW1wb3J0IHsgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzIH0gZnJvbSBcIi4uLy4uL2ludGVybmFscy9jcmVhdGVCYXNlVUlFdmVudERldGFpbHMuanNcIjtcbmltcG9ydCB7IFJFQVNPTlMgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWxzL3JlYXNvbnMuanNcIjtcbmltcG9ydCB7IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkLCB1c2VGbG9hdGluZ1RyZWUgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9GbG9hdGluZ1RyZWUuanNcIjtcbmltcG9ydCB7IGNyZWF0ZUdyaWRDZWxsTWFwLCBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgsIGdldEdyaWRDZWxsSW5kZXhPZkNvcm5lciwgZ2V0R3JpZENlbGxJbmRpY2VzLCBnZXRHcmlkTmF2aWdhdGVkSW5kZXgsIGdldE1heExpc3RJbmRleCwgZ2V0TWluTGlzdEluZGV4LCBpc0luZGV4T3V0T2ZMaXN0Qm91bmRzLCBpc0xpc3RJbmRleERpc2FibGVkIH0gZnJvbSBcIi4uL3V0aWxzL2NvbXBvc2l0ZS5qc1wiO1xuaW1wb3J0IHsgQVJST1dfRE9XTiwgQVJST1dfTEVGVCwgQVJST1dfUklHSFQsIEFSUk9XX1VQIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50cy5qc1wiO1xuaW1wb3J0IHsgYWN0aXZlRWxlbWVudCwgY29udGFpbnMsIGdldEZsb2F0aW5nRm9jdXNFbGVtZW50LCBnZXRUYXJnZXQsIGlzVHlwZWFibGVDb21ib2JveCB9IGZyb20gXCIuLi91dGlscy9lbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBlbnF1ZXVlRm9jdXMgfSBmcm9tIFwiLi4vdXRpbHMvZW5xdWV1ZUZvY3VzLmpzXCI7XG5pbXBvcnQgeyBpc1ZpcnR1YWxDbGljaywgaXNWaXJ0dWFsUG9pbnRlckV2ZW50LCBzdG9wRXZlbnQgfSBmcm9tIFwiLi4vdXRpbHMvZXZlbnQuanNcIjtcbmV4cG9ydCBjb25zdCBFU0NBUEUgPSAnRXNjYXBlJztcbmZ1bmN0aW9uIGRvU3dpdGNoKG9yaWVudGF0aW9uLCB2ZXJ0aWNhbCwgaG9yaXpvbnRhbCkge1xuICBzd2l0Y2ggKG9yaWVudGF0aW9uKSB7XG4gICAgY2FzZSAndmVydGljYWwnOlxuICAgICAgcmV0dXJuIHZlcnRpY2FsO1xuICAgIGNhc2UgJ2hvcml6b250YWwnOlxuICAgICAgcmV0dXJuIGhvcml6b250YWw7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB2ZXJ0aWNhbCB8fCBob3Jpem9udGFsO1xuICB9XG59XG5mdW5jdGlvbiBpc01haW5PcmllbnRhdGlvbktleShrZXksIG9yaWVudGF0aW9uKSB7XG4gIGNvbnN0IHZlcnRpY2FsID0ga2V5ID09PSBBUlJPV19VUCB8fCBrZXkgPT09IEFSUk9XX0RPV047XG4gIGNvbnN0IGhvcml6b250YWwgPSBrZXkgPT09IEFSUk9XX0xFRlQgfHwga2V5ID09PSBBUlJPV19SSUdIVDtcbiAgcmV0dXJuIGRvU3dpdGNoKG9yaWVudGF0aW9uLCB2ZXJ0aWNhbCwgaG9yaXpvbnRhbCk7XG59XG5mdW5jdGlvbiBpc01haW5PcmllbnRhdGlvblRvRW5kS2V5KGtleSwgb3JpZW50YXRpb24sIHJ0bCkge1xuICBjb25zdCB2ZXJ0aWNhbCA9IGtleSA9PT0gQVJST1dfRE9XTjtcbiAgY29uc3QgaG9yaXpvbnRhbCA9IHJ0bCA/IGtleSA9PT0gQVJST1dfTEVGVCA6IGtleSA9PT0gQVJST1dfUklHSFQ7XG4gIHJldHVybiBkb1N3aXRjaChvcmllbnRhdGlvbiwgdmVydGljYWwsIGhvcml6b250YWwpIHx8IGtleSA9PT0gJ0VudGVyJyB8fCBrZXkgPT09ICcgJyB8fCBrZXkgPT09ICcnO1xufVxuZnVuY3Rpb24gaXNDcm9zc09yaWVudGF0aW9uT3BlbktleShrZXksIG9yaWVudGF0aW9uLCBydGwpIHtcbiAgY29uc3QgdmVydGljYWwgPSBydGwgPyBrZXkgPT09IEFSUk9XX0xFRlQgOiBrZXkgPT09IEFSUk9XX1JJR0hUO1xuICBjb25zdCBob3Jpem9udGFsID0ga2V5ID09PSBBUlJPV19ET1dOO1xuICByZXR1cm4gZG9Td2l0Y2gob3JpZW50YXRpb24sIHZlcnRpY2FsLCBob3Jpem9udGFsKTtcbn1cbmZ1bmN0aW9uIGlzQ3Jvc3NPcmllbnRhdGlvbkNsb3NlS2V5KGtleSwgb3JpZW50YXRpb24sIHJ0bCwgY29scykge1xuICBjb25zdCB2ZXJ0aWNhbCA9IHJ0bCA/IGtleSA9PT0gQVJST1dfUklHSFQgOiBrZXkgPT09IEFSUk9XX0xFRlQ7XG4gIGNvbnN0IGhvcml6b250YWwgPSBrZXkgPT09IEFSUk9XX1VQO1xuICBpZiAob3JpZW50YXRpb24gPT09ICdib3RoJyB8fCBvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnICYmIGNvbHMgJiYgY29scyA+IDEpIHtcbiAgICByZXR1cm4ga2V5ID09PSBFU0NBUEU7XG4gIH1cbiAgcmV0dXJuIGRvU3dpdGNoKG9yaWVudGF0aW9uLCB2ZXJ0aWNhbCwgaG9yaXpvbnRhbCk7XG59XG4vKipcbiAqIEFkZHMgYXJyb3cga2V5LWJhc2VkIG5hdmlnYXRpb24gb2YgYSBsaXN0IG9mIGl0ZW1zLCBlaXRoZXIgdXNpbmcgcmVhbCBET01cbiAqIGZvY3VzIG9yIHZpcnR1YWwgZm9jdXMuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvdXNlTGlzdE5hdmlnYXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUxpc3ROYXZpZ2F0aW9uKGNvbnRleHQsIHByb3BzKSB7XG4gIGNvbnN0IHtcbiAgICBsaXN0UmVmLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG9uTmF2aWdhdGU6IG9uTmF2aWdhdGVQcm9wID0gKCkgPT4ge30sXG4gICAgZW5hYmxlZCA9IHRydWUsXG4gICAgc2VsZWN0ZWRJbmRleCA9IG51bGwsXG4gICAgYWxsb3dFc2NhcGUgPSBmYWxzZSxcbiAgICBsb29wRm9jdXMgPSBmYWxzZSxcbiAgICBuZXN0ZWQgPSBmYWxzZSxcbiAgICBydGwgPSBmYWxzZSxcbiAgICB2aXJ0dWFsID0gZmFsc2UsXG4gICAgZm9jdXNJdGVtT25PcGVuID0gJ2F1dG8nLFxuICAgIGZvY3VzSXRlbU9uSG92ZXIgPSB0cnVlLFxuICAgIG9wZW5PbkFycm93S2V5RG93biA9IHRydWUsXG4gICAgZGlzYWJsZWRJbmRpY2VzID0gdW5kZWZpbmVkLFxuICAgIG9yaWVudGF0aW9uID0gJ3ZlcnRpY2FsJyxcbiAgICBwYXJlbnRPcmllbnRhdGlvbixcbiAgICBjb2xzID0gMSxcbiAgICBpZCxcbiAgICByZXNldE9uUG9pbnRlckxlYXZlID0gdHJ1ZSxcbiAgICBleHRlcm5hbFRyZWVcbiAgfSA9IHByb3BzO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChhbGxvd0VzY2FwZSkge1xuICAgICAgaWYgKCFsb29wRm9jdXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdgdXNlTGlzdE5hdmlnYXRpb25gIGxvb3BpbmcgbXVzdCBiZSBlbmFibGVkIHRvIGFsbG93IGVzY2FwaW5nLicpO1xuICAgICAgfVxuICAgICAgaWYgKCF2aXJ0dWFsKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignYHVzZUxpc3ROYXZpZ2F0aW9uYCBtdXN0IGJlIHZpcnR1YWwgdG8gYWxsb3cgZXNjYXBpbmcuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyAmJiBjb2xzID4gMSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbiBncmlkIGxpc3QgbmF2aWdhdGlvbiBtb2RlIChgY29sc2AgPiAxKSwgdGhlIGBvcmllbnRhdGlvbmAgc2hvdWxkJywgJ2JlIGVpdGhlciBcImhvcml6b250YWxcIiBvciBcImJvdGhcIi4nKTtcbiAgICB9XG4gIH1cbiAgY29uc3Qgc3RvcmUgPSAncm9vdFN0b3JlJyBpbiBjb250ZXh0ID8gY29udGV4dC5yb290U3RvcmUgOiBjb250ZXh0O1xuICBjb25zdCBvcGVuID0gc3RvcmUudXNlU3RhdGUoJ29wZW4nKTtcbiAgY29uc3QgZmxvYXRpbmdFbGVtZW50ID0gc3RvcmUudXNlU3RhdGUoJ2Zsb2F0aW5nRWxlbWVudCcpO1xuICBjb25zdCBkb21SZWZlcmVuY2VFbGVtZW50ID0gc3RvcmUudXNlU3RhdGUoJ2RvbVJlZmVyZW5jZUVsZW1lbnQnKTtcbiAgY29uc3QgZGF0YVJlZiA9IHN0b3JlLmNvbnRleHQuZGF0YVJlZjtcbiAgY29uc3QgZmxvYXRpbmdGb2N1c0VsZW1lbnQgPSBnZXRGbG9hdGluZ0ZvY3VzRWxlbWVudChmbG9hdGluZ0VsZW1lbnQpO1xuICBjb25zdCB0eXBlYWJsZUNvbWJvYm94UmVmZXJlbmNlID0gaXNUeXBlYWJsZUNvbWJvYm94KGRvbVJlZmVyZW5jZUVsZW1lbnQpO1xuICBjb25zdCBmbG9hdGluZ0ZvY3VzRWxlbWVudFJlZiA9IHVzZVZhbHVlQXNSZWYoZmxvYXRpbmdGb2N1c0VsZW1lbnQpO1xuICBjb25zdCBwYXJlbnRJZCA9IHVzZUZsb2F0aW5nUGFyZW50Tm9kZUlkKCk7XG4gIGNvbnN0IHRyZWUgPSB1c2VGbG9hdGluZ1RyZWUoZXh0ZXJuYWxUcmVlKTtcbiAgY29uc3QgZm9jdXNJdGVtT25PcGVuUmVmID0gUmVhY3QudXNlUmVmKGZvY3VzSXRlbU9uT3Blbik7XG4gIGNvbnN0IGluZGV4UmVmID0gUmVhY3QudXNlUmVmKHNlbGVjdGVkSW5kZXggPz8gLTEpO1xuICBjb25zdCBrZXlSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGlzUG9pbnRlck1vZGFsaXR5UmVmID0gUmVhY3QudXNlUmVmKHRydWUpO1xuICBjb25zdCBvbk5hdmlnYXRlID0gdXNlU3RhYmxlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIG9uTmF2aWdhdGVQcm9wKGluZGV4UmVmLmN1cnJlbnQgPT09IC0xID8gbnVsbCA6IGluZGV4UmVmLmN1cnJlbnQsIGV2ZW50KTtcbiAgfSk7XG4gIGNvbnN0IHByZXZpb3VzT25OYXZpZ2F0ZVJlZiA9IFJlYWN0LnVzZVJlZihvbk5hdmlnYXRlKTtcbiAgY29uc3QgcHJldmlvdXNNb3VudGVkUmVmID0gUmVhY3QudXNlUmVmKCEhZmxvYXRpbmdFbGVtZW50KTtcbiAgY29uc3QgcHJldmlvdXNPcGVuUmVmID0gUmVhY3QudXNlUmVmKG9wZW4pO1xuICBjb25zdCBmb3JjZVN5bmNGb2N1c1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGZvcmNlU2Nyb2xsSW50b1ZpZXdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjYW5jZWxRdWV1ZWRGb2N1c1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgZGlzYWJsZWRJbmRpY2VzUmVmID0gdXNlVmFsdWVBc1JlZihkaXNhYmxlZEluZGljZXMpO1xuICBjb25zdCBsYXRlc3RPcGVuUmVmID0gdXNlVmFsdWVBc1JlZihvcGVuKTtcbiAgY29uc3Qgc2VsZWN0ZWRJbmRleFJlZiA9IHVzZVZhbHVlQXNSZWYoc2VsZWN0ZWRJbmRleCk7XG4gIGNvbnN0IHJlc2V0T25Qb2ludGVyTGVhdmVSZWYgPSB1c2VWYWx1ZUFzUmVmKHJlc2V0T25Qb2ludGVyTGVhdmUpO1xuICBjb25zdCBmb2N1c0ZyYW1lID0gdXNlQW5pbWF0aW9uRnJhbWUoKTtcbiAgY29uc3Qgd2FpdEZvckxpc3RQb3B1bGF0ZWRGcmFtZSA9IHVzZUFuaW1hdGlvbkZyYW1lKCk7XG4gIGNvbnN0IGZvY3VzSXRlbSA9IHVzZVN0YWJsZUNhbGxiYWNrKCgpID0+IHtcbiAgICBmdW5jdGlvbiBydW5Gb2N1cyhpdGVtKSB7XG4gICAgICBpZiAodmlydHVhbCkge1xuICAgICAgICB0cmVlPy5ldmVudHMuZW1pdCgndmlydHVhbGZvY3VzJywgaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYW5jZWxRdWV1ZWRGb2N1c1JlZi5jdXJyZW50ID0gZW5xdWV1ZUZvY3VzKGl0ZW0sIHtcbiAgICAgICAgICBzeW5jOiBmb3JjZVN5bmNGb2N1c1JlZi5jdXJyZW50LFxuICAgICAgICAgIHByZXZlbnRTY3JvbGw6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGluaXRpYWxJdGVtID0gbGlzdFJlZi5jdXJyZW50W2luZGV4UmVmLmN1cnJlbnRdO1xuICAgIGNvbnN0IGZvcmNlU2Nyb2xsSW50b1ZpZXcgPSBmb3JjZVNjcm9sbEludG9WaWV3UmVmLmN1cnJlbnQ7XG4gICAgaWYgKGluaXRpYWxJdGVtKSB7XG4gICAgICBydW5Gb2N1cyhpbml0aWFsSXRlbSk7XG4gICAgfVxuICAgIGNvbnN0IHNjaGVkdWxlciA9IGZvcmNlU3luY0ZvY3VzUmVmLmN1cnJlbnQgPyBjYWxsYmFjayA9PiBjYWxsYmFjaygpIDogY2FsbGJhY2sgPT4gZm9jdXNGcmFtZS5yZXF1ZXN0KGNhbGxiYWNrKTtcbiAgICBzY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgY29uc3Qgd2FpdGVkSXRlbSA9IGxpc3RSZWYuY3VycmVudFtpbmRleFJlZi5jdXJyZW50XSB8fCBpbml0aWFsSXRlbTtcbiAgICAgIGlmICghd2FpdGVkSXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWluaXRpYWxJdGVtKSB7XG4gICAgICAgIHJ1bkZvY3VzKHdhaXRlZEl0ZW0pO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2hvdWxkU2Nyb2xsSW50b1ZpZXcgPVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgICAgaXRlbSAmJiAoZm9yY2VTY3JvbGxJbnRvVmlldyB8fCAhaXNQb2ludGVyTW9kYWxpdHlSZWYuY3VycmVudCk7XG4gICAgICBpZiAoc2hvdWxkU2Nyb2xsSW50b1ZpZXcpIHtcbiAgICAgICAgLy8gSlNET00gZG9lc24ndCBzdXBwb3J0IGAuc2Nyb2xsSW50b1ZpZXcoKWAgYnV0IGl0J3Mgd2lkZWx5IHN1cHBvcnRlZFxuICAgICAgICAvLyBieSBhbGwgYnJvd3NlcnMuXG4gICAgICAgIHdhaXRlZEl0ZW0uc2Nyb2xsSW50b1ZpZXc/Lih7XG4gICAgICAgICAgYmxvY2s6ICduZWFyZXN0JyxcbiAgICAgICAgICBpbmxpbmU6ICduZWFyZXN0J1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgZGF0YVJlZi5jdXJyZW50Lm9yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gIH0sIFtkYXRhUmVmLCBvcmllbnRhdGlvbl0pO1xuXG4gIC8vIFN5bmMgYHNlbGVjdGVkSW5kZXhgIHRvIGJlIHRoZSBgYWN0aXZlSW5kZXhgIHVwb24gb3BlbmluZyB0aGUgZmxvYXRpbmdcbiAgLy8gZWxlbWVudC4gQWxzbywgcmVzZXQgYGFjdGl2ZUluZGV4YCB1cG9uIGNsb3NpbmcgdGhlIGZsb2F0aW5nIGVsZW1lbnQuXG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChvcGVuICYmIGZsb2F0aW5nRWxlbWVudCkge1xuICAgICAgaW5kZXhSZWYuY3VycmVudCA9IHNlbGVjdGVkSW5kZXggPz8gLTE7XG4gICAgICBpZiAoZm9jdXNJdGVtT25PcGVuUmVmLmN1cnJlbnQgJiYgc2VsZWN0ZWRJbmRleCAhPSBudWxsKSB7XG4gICAgICAgIC8vIFJlZ2FyZGxlc3Mgb2YgdGhlIHBvaW50ZXIgbW9kYWxpdHksIHdlIHdhbnQgdG8gZW5zdXJlIHRoZSBzZWxlY3RlZFxuICAgICAgICAvLyBpdGVtIGNvbWVzIGludG8gdmlldyB3aGVuIHRoZSBmbG9hdGluZyBlbGVtZW50IGlzIG9wZW5lZC5cbiAgICAgICAgZm9yY2VTY3JvbGxJbnRvVmlld1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgb25OYXZpZ2F0ZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJldmlvdXNNb3VudGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIC8vIFNpbmNlIHRoZSB1c2VyIGNhbiBzcGVjaWZ5IGBvbk5hdmlnYXRlYCBjb25kaXRpb25hbGx5XG4gICAgICAvLyAob25OYXZpZ2F0ZTogb3BlbiA/IHNldEFjdGl2ZUluZGV4IDogc2V0U2VsZWN0ZWRJbmRleCksXG4gICAgICAvLyB3ZSBzdG9yZSBhbmQgY2FsbCB0aGUgcHJldmlvdXMgZnVuY3Rpb24uXG4gICAgICBpbmRleFJlZi5jdXJyZW50ID0gLTE7XG4gICAgICBwcmV2aW91c09uTmF2aWdhdGVSZWYuY3VycmVudCgpO1xuICAgIH1cbiAgfSwgW2VuYWJsZWQsIG9wZW4sIGZsb2F0aW5nRWxlbWVudCwgc2VsZWN0ZWRJbmRleCwgb25OYXZpZ2F0ZV0pO1xuXG4gIC8vIFN5bmMgYGFjdGl2ZUluZGV4YCB0byBiZSB0aGUgZm9jdXNlZCBpdGVtIHdoaWxlIHRoZSBmbG9hdGluZyBlbGVtZW50IGlzXG4gIC8vIG9wZW4uXG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghb3Blbikge1xuICAgICAgZm9yY2VTeW5jRm9jdXNSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWZsb2F0aW5nRWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYWN0aXZlSW5kZXggPT0gbnVsbCkge1xuICAgICAgZm9yY2VTeW5jRm9jdXNSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKHNlbGVjdGVkSW5kZXhSZWYuY3VycmVudCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzZXQgd2hpbGUgdGhlIGZsb2F0aW5nIGVsZW1lbnQgd2FzIG9wZW4gKGUuZy4gdGhlIGxpc3QgY2hhbmdlZCkuXG4gICAgICBpZiAocHJldmlvdXNNb3VudGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgaW5kZXhSZWYuY3VycmVudCA9IC0xO1xuICAgICAgICBmb2N1c0l0ZW0oKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW5pdGlhbCBzeW5jLlxuICAgICAgaWYgKCghcHJldmlvdXNPcGVuUmVmLmN1cnJlbnQgfHwgIXByZXZpb3VzTW91bnRlZFJlZi5jdXJyZW50KSAmJiBmb2N1c0l0ZW1Pbk9wZW5SZWYuY3VycmVudCAmJiAoa2V5UmVmLmN1cnJlbnQgIT0gbnVsbCB8fCBmb2N1c0l0ZW1Pbk9wZW5SZWYuY3VycmVudCA9PT0gdHJ1ZSAmJiBrZXlSZWYuY3VycmVudCA9PSBudWxsKSkge1xuICAgICAgICBsZXQgcnVucyA9IDA7XG4gICAgICAgIGNvbnN0IHdhaXRGb3JMaXN0UG9wdWxhdGVkID0gKCkgPT4ge1xuICAgICAgICAgIGlmIChsaXN0UmVmLmN1cnJlbnRbMF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gQXZvaWQgbGV0dGluZyB0aGUgYnJvd3NlciBwYWludCBpZiBwb3NzaWJsZSBvbiB0aGUgZmlyc3QgdHJ5LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIHVzZSByQUYuIERvbid0IHRyeSBtb3JlIHRoYW4gdHdpY2UsIHNpbmNlIHNvbWV0aGluZ1xuICAgICAgICAgICAgLy8gaXMgd3Jvbmcgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgaWYgKHJ1bnMgPCAyKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHNjaGVkdWxlciA9IHJ1bnMgPyBjYWxsYmFjayA9PiB3YWl0Rm9yTGlzdFBvcHVsYXRlZEZyYW1lLnJlcXVlc3QoY2FsbGJhY2spIDogcXVldWVNaWNyb3Rhc2s7XG4gICAgICAgICAgICAgIHNjaGVkdWxlcih3YWl0Rm9yTGlzdFBvcHVsYXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5zICs9IDE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGluaXRpYWxseSBmb2N1cyB0aGUgZmlyc3Qgbm9uLWRpc2FibGVkIGl0ZW1cbiAgICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBrZXlSZWYuY3VycmVudCA9PSBudWxsIHx8IGlzTWFpbk9yaWVudGF0aW9uVG9FbmRLZXkoa2V5UmVmLmN1cnJlbnQsIG9yaWVudGF0aW9uLCBydGwpIHx8IG5lc3RlZCA/IGdldE1pbkxpc3RJbmRleChsaXN0UmVmKSA6IGdldE1heExpc3RJbmRleChsaXN0UmVmKTtcbiAgICAgICAgICAgIGtleVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICAgIG9uTmF2aWdhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHdhaXRGb3JMaXN0UG9wdWxhdGVkKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNJbmRleE91dE9mTGlzdEJvdW5kcyhsaXN0UmVmLmN1cnJlbnQsIGFjdGl2ZUluZGV4KSkge1xuICAgICAgaW5kZXhSZWYuY3VycmVudCA9IGFjdGl2ZUluZGV4O1xuICAgICAgZm9jdXNJdGVtKCk7XG4gICAgICBmb3JjZVNjcm9sbEludG9WaWV3UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG4gIH0sIFtlbmFibGVkLCBvcGVuLCBmbG9hdGluZ0VsZW1lbnQsIGFjdGl2ZUluZGV4LCBzZWxlY3RlZEluZGV4UmVmLCBuZXN0ZWQsIGxpc3RSZWYsIG9yaWVudGF0aW9uLCBydGwsIG9uTmF2aWdhdGUsIGZvY3VzSXRlbSwgd2FpdEZvckxpc3RQb3B1bGF0ZWRGcmFtZV0pO1xuXG4gIC8vIEVuc3VyZSB0aGUgcGFyZW50IGZsb2F0aW5nIGVsZW1lbnQgaGFzIGZvY3VzIHdoZW4gYSBuZXN0ZWQgY2hpbGQgY2xvc2VzXG4gIC8vIHRvIGFsbG93IGFycm93IGtleSBuYXZpZ2F0aW9uIHRvIHdvcmsgYWZ0ZXIgdGhlIHBvaW50ZXIgbGVhdmVzIHRoZSBjaGlsZC5cbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWVuYWJsZWQgfHwgZmxvYXRpbmdFbGVtZW50IHx8ICF0cmVlIHx8IHZpcnR1YWwgfHwgIXByZXZpb3VzTW91bnRlZFJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5vZGVzID0gdHJlZS5ub2Rlc1JlZi5jdXJyZW50O1xuICAgIGNvbnN0IHBhcmVudCA9IG5vZGVzLmZpbmQobm9kZSA9PiBub2RlLmlkID09PSBwYXJlbnRJZCk/LmNvbnRleHQ/LmVsZW1lbnRzLmZsb2F0aW5nO1xuICAgIGNvbnN0IGFjdGl2ZUVsID0gYWN0aXZlRWxlbWVudChvd25lckRvY3VtZW50KGZsb2F0aW5nRWxlbWVudCkpO1xuICAgIGNvbnN0IHRyZWVDb250YWluc0FjdGl2ZUVsID0gbm9kZXMuc29tZShub2RlID0+IG5vZGUuY29udGV4dCAmJiBjb250YWlucyhub2RlLmNvbnRleHQuZWxlbWVudHMuZmxvYXRpbmcsIGFjdGl2ZUVsKSk7XG4gICAgaWYgKHBhcmVudCAmJiAhdHJlZUNvbnRhaW5zQWN0aXZlRWwgJiYgaXNQb2ludGVyTW9kYWxpdHlSZWYuY3VycmVudCkge1xuICAgICAgcGFyZW50LmZvY3VzKHtcbiAgICAgICAgcHJldmVudFNjcm9sbDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9LCBbZW5hYmxlZCwgZmxvYXRpbmdFbGVtZW50LCB0cmVlLCBwYXJlbnRJZCwgdmlydHVhbF0pO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIHByZXZpb3VzT25OYXZpZ2F0ZVJlZi5jdXJyZW50ID0gb25OYXZpZ2F0ZTtcbiAgICBwcmV2aW91c09wZW5SZWYuY3VycmVudCA9IG9wZW47XG4gICAgcHJldmlvdXNNb3VudGVkUmVmLmN1cnJlbnQgPSAhIWZsb2F0aW5nRWxlbWVudDtcbiAgfSk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICBrZXlSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICBmb2N1c0l0ZW1Pbk9wZW5SZWYuY3VycmVudCA9IGZvY3VzSXRlbU9uT3BlbjtcbiAgICB9XG4gIH0sIFtvcGVuLCBmb2N1c0l0ZW1Pbk9wZW5dKTtcbiAgY29uc3QgaGFzQWN0aXZlSW5kZXggPSBhY3RpdmVJbmRleCAhPSBudWxsO1xuICBjb25zdCBzeW5jQ3VycmVudFRhcmdldCA9IHVzZVN0YWJsZUNhbGxiYWNrKGV2ZW50ID0+IHtcbiAgICBpZiAoIWxhdGVzdE9wZW5SZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IGxpc3RSZWYuY3VycmVudC5pbmRleE9mKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgIGlmIChpbmRleCAhPT0gLTEgJiYgKGluZGV4UmVmLmN1cnJlbnQgIT09IGluZGV4IHx8IGFjdGl2ZUluZGV4ICE9PSBpbmRleCkpIHtcbiAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBpbmRleDtcbiAgICAgIG9uTmF2aWdhdGUoZXZlbnQpO1xuICAgIH1cbiAgfSk7XG4gIGNvbnN0IGdldFBhcmVudE9yaWVudGF0aW9uID0gdXNlU3RhYmxlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHJldHVybiBwYXJlbnRPcmllbnRhdGlvbiA/PyB0cmVlPy5ub2Rlc1JlZi5jdXJyZW50LmZpbmQobm9kZSA9PiBub2RlLmlkID09PSBwYXJlbnRJZCk/LmNvbnRleHQ/LmRhdGFSZWY/LmN1cnJlbnQub3JpZW50YXRpb247XG4gIH0pO1xuICBjb25zdCBnZXRNaW5FbmFibGVkSW5kZXggPSB1c2VTdGFibGVDYWxsYmFjaygoKSA9PiB7XG4gICAgcmV0dXJuIGdldE1pbkxpc3RJbmRleChsaXN0UmVmLCBkaXNhYmxlZEluZGljZXNSZWYuY3VycmVudCk7XG4gIH0pO1xuICBjb25zdCBjb21tb25PbktleURvd24gPSB1c2VTdGFibGVDYWxsYmFjayhldmVudCA9PiB7XG4gICAgaXNQb2ludGVyTW9kYWxpdHlSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIGZvcmNlU3luY0ZvY3VzUmVmLmN1cnJlbnQgPSB0cnVlO1xuXG4gICAgLy8gV2hlbiBjb21wb3NpbmcgYSBjaGFyYWN0ZXIsIENocm9tZSBmaXJlcyBBcnJvd0Rvd24gdHdpY2UuIEZpcmVmb3gvU2FmYXJpXG4gICAgLy8gZG9uJ3QgYXBwZWFyIHRvIHN1ZmZlciBmcm9tIHRoaXMuIGBldmVudC5pc0NvbXBvc2luZ2AgaXMgYXZvaWRlZCBkdWUgdG9cbiAgICAvLyBTYWZhcmkgbm90IHN1cHBvcnRpbmcgaXQgcHJvcGVybHkgKGFsdGhvdWdoIGl0J3Mgbm90IG5lZWRlZCBpbiB0aGUgZmlyc3RcbiAgICAvLyBwbGFjZSBmb3IgU2FmYXJpLCBqdXN0IGF2b2lkaW5nIGFueSBwb3NzaWJsZSBpc3N1ZXMpLlxuICAgIGlmIChldmVudC53aGljaCA9PT0gMjI5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGZsb2F0aW5nIGVsZW1lbnQgaXMgYW5pbWF0aW5nIG91dCwgaWdub3JlIG5hdmlnYXRpb24uIE90aGVyd2lzZSxcbiAgICAvLyB0aGUgYGFjdGl2ZUluZGV4YCBnZXRzIHNldCB0byAwIGRlc3BpdGUgbm90IGJlaW5nIG9wZW4gc28gdGhlIG5leHQgdGltZVxuICAgIC8vIHRoZSB1c2VyIEFycm93RG93bnMsIHRoZSBmaXJzdCBpdGVtIHdvbid0IGJlIGZvY3VzZWQuXG4gICAgaWYgKCFsYXRlc3RPcGVuUmVmLmN1cnJlbnQgJiYgZXZlbnQuY3VycmVudFRhcmdldCA9PT0gZmxvYXRpbmdGb2N1c0VsZW1lbnRSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobmVzdGVkICYmIGlzQ3Jvc3NPcmllbnRhdGlvbkNsb3NlS2V5KGV2ZW50LmtleSwgb3JpZW50YXRpb24sIHJ0bCwgY29scykpIHtcbiAgICAgIC8vIElmIHRoZSBuZXN0ZWQgbGlzdCdzIGNsb3NlIGtleSBpcyBhbHNvIHRoZSBwYXJlbnQgbmF2aWdhdGlvbiBrZXksXG4gICAgICAvLyBsZXQgdGhlIHBhcmVudCBuYXZpZ2F0ZS4gT3RoZXJ3aXNlLCBzdG9wIHByb3BhZ2F0aW5nIHRoZSBldmVudC5cbiAgICAgIGlmICghaXNNYWluT3JpZW50YXRpb25LZXkoZXZlbnQua2V5LCBnZXRQYXJlbnRPcmllbnRhdGlvbigpKSkge1xuICAgICAgICBzdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgfVxuICAgICAgc3RvcmUuc2V0T3BlbihmYWxzZSwgY3JlYXRlQ2hhbmdlRXZlbnREZXRhaWxzKFJFQVNPTlMubGlzdE5hdmlnYXRpb24sIGV2ZW50Lm5hdGl2ZUV2ZW50KSk7XG4gICAgICBpZiAoaXNIVE1MRWxlbWVudChkb21SZWZlcmVuY2VFbGVtZW50KSkge1xuICAgICAgICBpZiAodmlydHVhbCkge1xuICAgICAgICAgIHRyZWU/LmV2ZW50cy5lbWl0KCd2aXJ0dWFsZm9jdXMnLCBkb21SZWZlcmVuY2VFbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb21SZWZlcmVuY2VFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gaW5kZXhSZWYuY3VycmVudDtcbiAgICBjb25zdCBtaW5JbmRleCA9IGdldE1pbkxpc3RJbmRleChsaXN0UmVmLCBkaXNhYmxlZEluZGljZXMpO1xuICAgIGNvbnN0IG1heEluZGV4ID0gZ2V0TWF4TGlzdEluZGV4KGxpc3RSZWYsIGRpc2FibGVkSW5kaWNlcyk7XG4gICAgaWYgKCF0eXBlYWJsZUNvbWJvYm94UmVmZXJlbmNlKSB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSAnSG9tZScpIHtcbiAgICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgaW5kZXhSZWYuY3VycmVudCA9IG1pbkluZGV4O1xuICAgICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbmQnKSB7XG4gICAgICAgIHN0b3BFdmVudChldmVudCk7XG4gICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBtYXhJbmRleDtcbiAgICAgICAgb25OYXZpZ2F0ZShldmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR3JpZCBuYXZpZ2F0aW9uLlxuICAgIGlmIChjb2xzID4gMSkge1xuICAgICAgY29uc3Qgc2l6ZXMgPSBBcnJheS5mcm9tKHtcbiAgICAgICAgbGVuZ3RoOiBsaXN0UmVmLmN1cnJlbnQubGVuZ3RoXG4gICAgICB9LCAoKSA9PiAoe1xuICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgaGVpZ2h0OiAxXG4gICAgICB9KSk7XG4gICAgICAvLyBUbyBjYWxjdWxhdGUgbW92ZW1lbnRzIG9uIHRoZSBncmlkLCB3ZSB1c2UgaHlwb3RoZXRpY2FsIGNlbGwgaW5kaWNlc1xuICAgICAgLy8gYXMgaWYgZXZlcnkgaXRlbSB3YXMgMXgxLCB0aGVuIGNvbnZlcnQgYmFjayB0byByZWFsIGluZGljZXMuXG4gICAgICBjb25zdCBjZWxsTWFwID0gY3JlYXRlR3JpZENlbGxNYXAoc2l6ZXMsIGNvbHMsIGZhbHNlKTtcbiAgICAgIGNvbnN0IG1pbkdyaWRJbmRleCA9IGNlbGxNYXAuZmluZEluZGV4KGluZGV4ID0+IGluZGV4ICE9IG51bGwgJiYgIWlzTGlzdEluZGV4RGlzYWJsZWQobGlzdFJlZi5jdXJyZW50LCBpbmRleCwgZGlzYWJsZWRJbmRpY2VzKSk7XG4gICAgICAvLyBsYXN0IGVuYWJsZWQgaW5kZXhcbiAgICAgIGNvbnN0IG1heEdyaWRJbmRleCA9IGNlbGxNYXAucmVkdWNlKChmb3VuZEluZGV4LCBpbmRleCwgY2VsbEluZGV4KSA9PiBpbmRleCAhPSBudWxsICYmICFpc0xpc3RJbmRleERpc2FibGVkKGxpc3RSZWYuY3VycmVudCwgaW5kZXgsIGRpc2FibGVkSW5kaWNlcykgPyBjZWxsSW5kZXggOiBmb3VuZEluZGV4LCAtMSk7XG4gICAgICBjb25zdCBpbmRleCA9IGNlbGxNYXBbZ2V0R3JpZE5hdmlnYXRlZEluZGV4KGNlbGxNYXAubWFwKGl0ZW1JbmRleCA9PiBpdGVtSW5kZXggIT0gbnVsbCA/IGxpc3RSZWYuY3VycmVudFtpdGVtSW5kZXhdIDogbnVsbCksIHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICBsb29wRm9jdXMsXG4gICAgICAgIHJ0bCxcbiAgICAgICAgY29scyxcbiAgICAgICAgLy8gdHJlYXQgdW5kZWZpbmVkIChlbXB0eSBncmlkIHNwYWNlcykgYXMgZGlzYWJsZWQgaW5kaWNlcyBzbyB3ZVxuICAgICAgICAvLyBkb24ndCBlbmQgdXAgaW4gdGhlbVxuICAgICAgICBkaXNhYmxlZEluZGljZXM6IGdldEdyaWRDZWxsSW5kaWNlcyhbLi4uKCh0eXBlb2YgZGlzYWJsZWRJbmRpY2VzICE9PSAnZnVuY3Rpb24nID8gZGlzYWJsZWRJbmRpY2VzIDogbnVsbCkgfHwgbGlzdFJlZi5jdXJyZW50Lm1hcCgoXywgbGlzdEluZGV4KSA9PiBpc0xpc3RJbmRleERpc2FibGVkKGxpc3RSZWYuY3VycmVudCwgbGlzdEluZGV4LCBkaXNhYmxlZEluZGljZXMpID8gbGlzdEluZGV4IDogdW5kZWZpbmVkKSksIHVuZGVmaW5lZF0sIGNlbGxNYXApLFxuICAgICAgICBtaW5JbmRleDogbWluR3JpZEluZGV4LFxuICAgICAgICBtYXhJbmRleDogbWF4R3JpZEluZGV4LFxuICAgICAgICBwcmV2SW5kZXg6IGdldEdyaWRDZWxsSW5kZXhPZkNvcm5lcihpbmRleFJlZi5jdXJyZW50ID4gbWF4SW5kZXggPyBtaW5JbmRleCA6IGluZGV4UmVmLmN1cnJlbnQsIHNpemVzLCBjZWxsTWFwLCBjb2xzLFxuICAgICAgICAvLyB1c2UgYSBjb3JuZXIgbWF0Y2hpbmcgdGhlIGVkZ2UgY2xvc2VzdCB0byB0aGUgZGlyZWN0aW9uXG4gICAgICAgIC8vIHdlJ3JlIG1vdmluZyBpbiBzbyB3ZSBkb24ndCBlbmQgdXAgaW4gdGhlIHNhbWUgaXRlbS4gUHJlZmVyXG4gICAgICAgIC8vIHRvcC9sZWZ0IG92ZXIgYm90dG9tL3JpZ2h0LlxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVzdGVkLXRlcm5hcnlcbiAgICAgICAgZXZlbnQua2V5ID09PSBBUlJPV19ET1dOID8gJ2JsJyA6IGV2ZW50LmtleSA9PT0gKHJ0bCA/IEFSUk9XX0xFRlQgOiBBUlJPV19SSUdIVCkgPyAndHInIDogJ3RsJyksXG4gICAgICAgIHN0b3BFdmVudDogdHJ1ZVxuICAgICAgfSldO1xuICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgaW5kZXhSZWYuY3VycmVudCA9IGluZGV4O1xuICAgICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzTWFpbk9yaWVudGF0aW9uS2V5KGV2ZW50LmtleSwgb3JpZW50YXRpb24pKSB7XG4gICAgICBzdG9wRXZlbnQoZXZlbnQpO1xuXG4gICAgICAvLyBSZXNldCB0aGUgaW5kZXggaWYgbm8gaXRlbSBpcyBmb2N1c2VkLlxuICAgICAgaWYgKG9wZW4gJiYgIXZpcnR1YWwgJiYgYWN0aXZlRWxlbWVudChldmVudC5jdXJyZW50VGFyZ2V0Lm93bmVyRG9jdW1lbnQpID09PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBpc01haW5PcmllbnRhdGlvblRvRW5kS2V5KGV2ZW50LmtleSwgb3JpZW50YXRpb24sIHJ0bCkgPyBtaW5JbmRleCA6IG1heEluZGV4O1xuICAgICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGlzTWFpbk9yaWVudGF0aW9uVG9FbmRLZXkoZXZlbnQua2V5LCBvcmllbnRhdGlvbiwgcnRsKSkge1xuICAgICAgICBpZiAobG9vcEZvY3VzKSB7XG4gICAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA+PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgaWYgKGFsbG93RXNjYXBlICYmIGN1cnJlbnRJbmRleCAhPT0gbGlzdFJlZi5jdXJyZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBpbmRleFJlZi5jdXJyZW50ID0gLTE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBHaXZlIHRpbWUgZm9yIHZpcnR1YWxpemVycyB0byB1cGRhdGUgdGhlIGxpc3RSZWYuXG4gICAgICAgICAgICAgIGZvcmNlU3luY0ZvY3VzUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaW5kZXhSZWYuY3VycmVudCA9IG1pbkluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmRleFJlZi5jdXJyZW50ID0gZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGxpc3RSZWYuY3VycmVudCwge1xuICAgICAgICAgICAgICBzdGFydGluZ0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICAgICAgICAgIGRpc2FibGVkSW5kaWNlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBNYXRoLm1pbihtYXhJbmRleCwgZmluZE5vbkRpc2FibGVkTGlzdEluZGV4KGxpc3RSZWYuY3VycmVudCwge1xuICAgICAgICAgICAgc3RhcnRpbmdJbmRleDogY3VycmVudEluZGV4LFxuICAgICAgICAgICAgZGlzYWJsZWRJbmRpY2VzXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvb3BGb2N1cykge1xuICAgICAgICBpZiAoY3VycmVudEluZGV4IDw9IG1pbkluZGV4KSB7XG4gICAgICAgICAgaWYgKGFsbG93RXNjYXBlICYmIGN1cnJlbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBsaXN0UmVmLmN1cnJlbnQubGVuZ3RoO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBHaXZlIHRpbWUgZm9yIHZpcnR1YWxpemVycyB0byB1cGRhdGUgdGhlIGxpc3RSZWYuXG4gICAgICAgICAgICBmb3JjZVN5bmNGb2N1c1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBpbmRleFJlZi5jdXJyZW50ID0gbWF4SW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdFJlZi5jdXJyZW50LCB7XG4gICAgICAgICAgICBzdGFydGluZ0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICAgICAgICBkZWNyZW1lbnQ6IHRydWUsXG4gICAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZXhSZWYuY3VycmVudCA9IE1hdGgubWF4KG1pbkluZGV4LCBmaW5kTm9uRGlzYWJsZWRMaXN0SW5kZXgobGlzdFJlZi5jdXJyZW50LCB7XG4gICAgICAgICAgc3RhcnRpbmdJbmRleDogY3VycmVudEluZGV4LFxuICAgICAgICAgIGRlY3JlbWVudDogdHJ1ZSxcbiAgICAgICAgICBkaXNhYmxlZEluZGljZXNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgaWYgKGlzSW5kZXhPdXRPZkxpc3RCb3VuZHMobGlzdFJlZi5jdXJyZW50LCBpbmRleFJlZi5jdXJyZW50KSkge1xuICAgICAgICBpbmRleFJlZi5jdXJyZW50ID0gLTE7XG4gICAgICB9XG4gICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBpdGVtID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgaXRlbVByb3BzID0ge1xuICAgICAgb25Gb2N1cyhldmVudCkge1xuICAgICAgICBmb3JjZVN5bmNGb2N1c1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgc3luY0N1cnJlbnRUYXJnZXQoZXZlbnQpO1xuICAgICAgfSxcbiAgICAgIG9uQ2xpY2s6ICh7XG4gICAgICAgIGN1cnJlbnRUYXJnZXRcbiAgICAgIH0pID0+IGN1cnJlbnRUYXJnZXQuZm9jdXMoe1xuICAgICAgICBwcmV2ZW50U2Nyb2xsOiB0cnVlXG4gICAgICB9KSxcbiAgICAgIC8vIFNhZmFyaVxuICAgICAgb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgZm9yY2VTeW5jRm9jdXNSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIGZvcmNlU2Nyb2xsSW50b1ZpZXdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBpZiAoZm9jdXNJdGVtT25Ib3Zlcikge1xuICAgICAgICAgIHN5bmNDdXJyZW50VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUG9pbnRlckxlYXZlKGV2ZW50KSB7XG4gICAgICAgIGlmICghbGF0ZXN0T3BlblJlZi5jdXJyZW50IHx8ICFpc1BvaW50ZXJNb2RhbGl0eVJlZi5jdXJyZW50IHx8IGV2ZW50LnBvaW50ZXJUeXBlID09PSAndG91Y2gnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvcmNlU3luY0ZvY3VzUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBjb25zdCByZWxhdGVkVGFyZ2V0ID0gZXZlbnQucmVsYXRlZFRhcmdldDtcbiAgICAgICAgaWYgKCFmb2N1c0l0ZW1PbkhvdmVyIHx8IGxpc3RSZWYuY3VycmVudC5pbmNsdWRlcyhyZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJlc2V0T25Qb2ludGVyTGVhdmVSZWYuY3VycmVudCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYW5jZWxRdWV1ZWRGb2N1c1JlZi5jdXJyZW50Py4oKTtcbiAgICAgICAgY2FuY2VsUXVldWVkRm9jdXNSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSAtMTtcbiAgICAgICAgb25OYXZpZ2F0ZShldmVudCk7XG4gICAgICAgIGlmICghdmlydHVhbCkge1xuICAgICAgICAgIGNvbnN0IGZsb2F0aW5nRm9jdXNFbCA9IGZsb2F0aW5nRm9jdXNFbGVtZW50UmVmLmN1cnJlbnQ7XG4gICAgICAgICAgY29uc3QgYWN0aXZlRWwgPSBhY3RpdmVFbGVtZW50KG93bmVyRG9jdW1lbnQoZmxvYXRpbmdGb2N1c0VsKSk7XG4gICAgICAgICAgaWYgKGZsb2F0aW5nRm9jdXNFbCAmJiBjb250YWlucyhmbG9hdGluZ0ZvY3VzRWwsIGFjdGl2ZUVsKSkge1xuICAgICAgICAgICAgZmxvYXRpbmdGb2N1c0VsLmZvY3VzKHtcbiAgICAgICAgICAgICAgcHJldmVudFNjcm9sbDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gaXRlbVByb3BzO1xuICB9LCBbc3luY0N1cnJlbnRUYXJnZXQsIGxhdGVzdE9wZW5SZWYsIGZsb2F0aW5nRm9jdXNFbGVtZW50UmVmLCBmb2N1c0l0ZW1PbkhvdmVyLCBsaXN0UmVmLCBvbk5hdmlnYXRlLCByZXNldE9uUG9pbnRlckxlYXZlUmVmLCB2aXJ0dWFsXSk7XG4gIGNvbnN0IGFyaWFBY3RpdmVEZXNjZW5kYW50UHJvcCA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiB2aXJ0dWFsICYmIG9wZW4gJiYgaGFzQWN0aXZlSW5kZXggJiYge1xuICAgICAgJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCc6IGAke2lkfS0ke2FjdGl2ZUluZGV4fWBcbiAgICB9O1xuICB9LCBbdmlydHVhbCwgb3BlbiwgaGFzQWN0aXZlSW5kZXgsIGlkLCBhY3RpdmVJbmRleF0pO1xuICBjb25zdCBmbG9hdGluZyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAnYXJpYS1vcmllbnRhdGlvbic6IG9yaWVudGF0aW9uID09PSAnYm90aCcgPyB1bmRlZmluZWQgOiBvcmllbnRhdGlvbixcbiAgICAgIC4uLighdHlwZWFibGVDb21ib2JveFJlZmVyZW5jZSA/IGFyaWFBY3RpdmVEZXNjZW5kYW50UHJvcCA6IHt9KSxcbiAgICAgIG9uS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBDbG9zZSBzdWJtZW51IG9uIFNoaWZ0K1RhYlxuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnVGFiJyAmJiBldmVudC5zaGlmdEtleSAmJiBvcGVuICYmICF2aXJ0dWFsKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGV2ZW50IG9yaWdpbmF0ZWQgZnJvbSB3aXRoaW4gYSBuZXN0ZWQgZWxlbWVudCAoZS5nLiwgYSBEaWFsb2cgb3BlbmVkIGZyb21cbiAgICAgICAgICAvLyB3aXRoaW4gdGhlIG1lbnUpLCBkb24ndCBjbG9zZSB0aGUgbWVudS4gVGhlIG5lc3RlZCBlbGVtZW50IGhhcyBpdHMgb3duIGZvY3VzXG4gICAgICAgICAgLy8gbWFuYWdlbWVudCBhbmQgc2hvdWxkIGhhbmRsZSB0aGUgVGFiIGtleS5cbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQubmF0aXZlRXZlbnQpO1xuICAgICAgICAgIGlmICh0YXJnZXQgJiYgIWNvbnRhaW5zKGZsb2F0aW5nRm9jdXNFbGVtZW50UmVmLmN1cnJlbnQsIHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICBzdG9yZS5zZXRPcGVuKGZhbHNlLCBjcmVhdGVDaGFuZ2VFdmVudERldGFpbHMoUkVBU09OUy5mb2N1c091dCwgZXZlbnQubmF0aXZlRXZlbnQpKTtcbiAgICAgICAgICBpZiAoaXNIVE1MRWxlbWVudChkb21SZWZlcmVuY2VFbGVtZW50KSkge1xuICAgICAgICAgICAgZG9tUmVmZXJlbmNlRWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29tbW9uT25LZXlEb3duKGV2ZW50KTtcbiAgICAgIH0sXG4gICAgICBvblBvaW50ZXJNb3ZlKCkge1xuICAgICAgICBpc1BvaW50ZXJNb2RhbGl0eVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbYXJpYUFjdGl2ZURlc2NlbmRhbnRQcm9wLCBjb21tb25PbktleURvd24sIGZsb2F0aW5nRm9jdXNFbGVtZW50UmVmLCBvcmllbnRhdGlvbiwgdHlwZWFibGVDb21ib2JveFJlZmVyZW5jZSwgc3RvcmUsIG9wZW4sIHZpcnR1YWwsIGRvbVJlZmVyZW5jZUVsZW1lbnRdKTtcbiAgY29uc3QgdHJpZ2dlciA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGZ1bmN0aW9uIG9wZW5Pbk5hdmlnYXRpb25LZXlEb3duKGV2ZW50KSB7XG4gICAgICBzdG9yZS5zZXRPcGVuKHRydWUsIGNyZWF0ZUNoYW5nZUV2ZW50RGV0YWlscyhSRUFTT05TLmxpc3ROYXZpZ2F0aW9uLCBldmVudC5uYXRpdmVFdmVudCwgZXZlbnQuY3VycmVudFRhcmdldCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjaGVja1ZpcnR1YWxNb3VzZShldmVudCkge1xuICAgICAgaWYgKGZvY3VzSXRlbU9uT3BlbiA9PT0gJ2F1dG8nICYmIGlzVmlydHVhbENsaWNrKGV2ZW50Lm5hdGl2ZUV2ZW50KSkge1xuICAgICAgICBmb2N1c0l0ZW1Pbk9wZW5SZWYuY3VycmVudCA9ICF2aXJ0dWFsO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjaGVja1ZpcnR1YWxQb2ludGVyKGV2ZW50KSB7XG4gICAgICAvLyBgcG9pbnRlcmRvd25gIGZpcmVzIGZpcnN0LCByZXNldCB0aGUgc3RhdGUgdGhlbiBwZXJmb3JtIHRoZSBjaGVja3MuXG4gICAgICBmb2N1c0l0ZW1Pbk9wZW5SZWYuY3VycmVudCA9IGZvY3VzSXRlbU9uT3BlbjtcbiAgICAgIGlmIChmb2N1c0l0ZW1Pbk9wZW4gPT09ICdhdXRvJyAmJiBpc1ZpcnR1YWxQb2ludGVyRXZlbnQoZXZlbnQubmF0aXZlRXZlbnQpKSB7XG4gICAgICAgIGZvY3VzSXRlbU9uT3BlblJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIG9uS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBub24tcmVhY3RpdmUgb3BlbiBzdGF0ZSAodG8gcHJldmVudCByZS1jcmVhdGlvbiBvZiB0aGUgaGFuZGxlcilcbiAgICAgICAgY29uc3QgY3VycmVudE9wZW4gPSBzdG9yZS5zZWxlY3QoJ29wZW4nKTtcbiAgICAgICAgaXNQb2ludGVyTW9kYWxpdHlSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBpc0Fycm93S2V5ID0gZXZlbnQua2V5LnN0YXJ0c1dpdGgoJ0Fycm93Jyk7XG4gICAgICAgIGNvbnN0IGlzUGFyZW50Q3Jvc3NPcGVuS2V5ID0gaXNDcm9zc09yaWVudGF0aW9uT3BlbktleShldmVudC5rZXksIGdldFBhcmVudE9yaWVudGF0aW9uKCksIHJ0bCk7XG4gICAgICAgIGNvbnN0IGlzTWFpbktleSA9IGlzTWFpbk9yaWVudGF0aW9uS2V5KGV2ZW50LmtleSwgb3JpZW50YXRpb24pO1xuICAgICAgICBjb25zdCBpc05hdmlnYXRpb25LZXkgPSAobmVzdGVkID8gaXNQYXJlbnRDcm9zc09wZW5LZXkgOiBpc01haW5LZXkpIHx8IGV2ZW50LmtleSA9PT0gJ0VudGVyJyB8fCBldmVudC5rZXkudHJpbSgpID09PSAnJztcbiAgICAgICAgaWYgKHZpcnR1YWwgJiYgY3VycmVudE9wZW4pIHtcbiAgICAgICAgICByZXR1cm4gY29tbW9uT25LZXlEb3duKGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZmxvYXRpbmcgZWxlbWVudCBzaG91bGQgbm90IG9wZW4gb24gYXJyb3cga2V5IGRvd24sIGF2b2lkXG4gICAgICAgIC8vIHNldHRpbmcgYGFjdGl2ZUluZGV4YCB3aGlsZSBpdCdzIGNsb3NlZC5cbiAgICAgICAgaWYgKCFjdXJyZW50T3BlbiAmJiAhb3Blbk9uQXJyb3dLZXlEb3duICYmIGlzQXJyb3dLZXkpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc05hdmlnYXRpb25LZXkpIHtcbiAgICAgICAgICBjb25zdCBpc1BhcmVudE1haW5LZXkgPSBpc01haW5PcmllbnRhdGlvbktleShldmVudC5rZXksIGdldFBhcmVudE9yaWVudGF0aW9uKCkpO1xuICAgICAgICAgIGtleVJlZi5jdXJyZW50ID0gbmVzdGVkICYmIGlzUGFyZW50TWFpbktleSA/IG51bGwgOiBldmVudC5rZXk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5lc3RlZCkge1xuICAgICAgICAgIGlmIChpc1BhcmVudENyb3NzT3BlbktleSkge1xuICAgICAgICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50T3Blbikge1xuICAgICAgICAgICAgICBpbmRleFJlZi5jdXJyZW50ID0gZ2V0TWluRW5hYmxlZEluZGV4KCk7XG4gICAgICAgICAgICAgIG9uTmF2aWdhdGUoZXZlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgb3Blbk9uTmF2aWdhdGlvbktleURvd24oZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc01haW5LZXkpIHtcbiAgICAgICAgICBpZiAoc2VsZWN0ZWRJbmRleFJlZi5jdXJyZW50ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSBzZWxlY3RlZEluZGV4UmVmLmN1cnJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0b3BFdmVudChldmVudCk7XG4gICAgICAgICAgaWYgKCFjdXJyZW50T3BlbiAmJiBvcGVuT25BcnJvd0tleURvd24pIHtcbiAgICAgICAgICAgIG9wZW5Pbk5hdmlnYXRpb25LZXlEb3duKGV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tbW9uT25LZXlEb3duKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRPcGVuKSB7XG4gICAgICAgICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0sXG4gICAgICBvbkZvY3VzKGV2ZW50KSB7XG4gICAgICAgIGlmIChzdG9yZS5zZWxlY3QoJ29wZW4nKSAmJiAhdmlydHVhbCkge1xuICAgICAgICAgIGluZGV4UmVmLmN1cnJlbnQgPSAtMTtcbiAgICAgICAgICBvbk5hdmlnYXRlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUG9pbnRlckRvd246IGNoZWNrVmlydHVhbFBvaW50ZXIsXG4gICAgICBvblBvaW50ZXJFbnRlcjogY2hlY2tWaXJ0dWFsUG9pbnRlcixcbiAgICAgIG9uTW91c2VEb3duOiBjaGVja1ZpcnR1YWxNb3VzZSxcbiAgICAgIG9uQ2xpY2s6IGNoZWNrVmlydHVhbE1vdXNlXG4gICAgfTtcbiAgfSwgW2NvbW1vbk9uS2V5RG93biwgZm9jdXNJdGVtT25PcGVuLCBnZXRNaW5FbmFibGVkSW5kZXgsIG5lc3RlZCwgb25OYXZpZ2F0ZSwgc3RvcmUsIG9wZW5PbkFycm93S2V5RG93biwgb3JpZW50YXRpb24sIGdldFBhcmVudE9yaWVudGF0aW9uLCBydGwsIHNlbGVjdGVkSW5kZXhSZWYsIHZpcnR1YWxdKTtcbiAgY29uc3QgcmVmZXJlbmNlID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmFyaWFBY3RpdmVEZXNjZW5kYW50UHJvcCxcbiAgICAgIC4uLnRyaWdnZXJcbiAgICB9O1xuICB9LCBbYXJpYUFjdGl2ZURlc2NlbmRhbnRQcm9wLCB0cmlnZ2VyXSk7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+IGVuYWJsZWQgPyB7XG4gICAgcmVmZXJlbmNlLFxuICAgIGZsb2F0aW5nLFxuICAgIGl0ZW0sXG4gICAgdHJpZ2dlclxuICB9IDoge30sIFtlbmFibGVkLCByZWZlcmVuY2UsIGZsb2F0aW5nLCB0cmlnZ2VyLCBpdGVtXSk7XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvdXNlVGltZW91dCc7XG5pbXBvcnQgeyBpc0VsZW1lbnRWaXNpYmxlIH0gZnJvbSBcIi4uL3V0aWxzL2NvbXBvc2l0ZS5qc1wiO1xuaW1wb3J0IHsgY29udGFpbnMgfSBmcm9tIFwiLi4vdXRpbHMvZWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgc3RvcEV2ZW50IH0gZnJvbSBcIi4uL3V0aWxzL2V2ZW50LmpzXCI7XG4vKipcbiAqIFByb3ZpZGVzIGEgbWF0Y2hpbmcgY2FsbGJhY2sgdGhhdCBjYW4gYmUgdXNlZCB0byBmb2N1cyBhbiBpdGVtIGFzIHRoZSB1c2VyXG4gKiB0eXBlcywgb2Z0ZW4gdXNlZCBpbiB0YW5kZW0gd2l0aCBgdXNlTGlzdE5hdmlnYXRpb24oKWAuXG4gKiBAc2VlIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvdXNlVHlwZWFoZWFkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VUeXBlYWhlYWQoY29udGV4dCwgcHJvcHMpIHtcbiAgY29uc3Qge1xuICAgIGxpc3RSZWYsXG4gICAgZWxlbWVudHNSZWYsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb25NYXRjaDogb25NYXRjaFByb3AsXG4gICAgb25UeXBpbmcsXG4gICAgZW5hYmxlZCA9IHRydWUsXG4gICAgcmVzZXRNcyA9IDc1MCxcbiAgICBzZWxlY3RlZEluZGV4ID0gbnVsbFxuICB9ID0gcHJvcHM7XG4gIGNvbnN0IHN0b3JlID0gJ3Jvb3RTdG9yZScgaW4gY29udGV4dCA/IGNvbnRleHQucm9vdFN0b3JlIDogY29udGV4dDtcbiAgY29uc3Qgb3BlbiA9IHN0b3JlLnVzZVN0YXRlKCdvcGVuJyk7XG4gIGNvbnN0IHRpbWVvdXQgPSB1c2VUaW1lb3V0KCk7XG4gIGNvbnN0IHN0cmluZ1JlZiA9IFJlYWN0LnVzZVJlZignJyk7XG4gIGNvbnN0IHByZXZJbmRleFJlZiA9IFJlYWN0LnVzZVJlZihzZWxlY3RlZEluZGV4ID8/IGFjdGl2ZUluZGV4ID8/IC0xKTtcbiAgY29uc3QgbWF0Y2hJbmRleFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgb25LZXlEb3duID0gdXNlU3RhYmxlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIGZ1bmN0aW9uIGlzVmlzaWJsZShpbmRleCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGVsZW1lbnRzUmVmPy5jdXJyZW50W2luZGV4XTtcbiAgICAgIHJldHVybiAhZWxlbWVudCB8fCBpc0VsZW1lbnRWaXNpYmxlKGVsZW1lbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRNYXRjaGluZ0luZGV4KGxpc3QsIHN0cmluZywgc3RhcnRJbmRleCA9IDApIHtcbiAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBjb25zdCBub3JtYWxpemVkU3RhcnRJbmRleCA9IChzdGFydEluZGV4ICUgbGlzdC5sZW5ndGggKyBsaXN0Lmxlbmd0aCkgJSBsaXN0Lmxlbmd0aDtcbiAgICAgIGNvbnN0IGxvd2VyU3RyaW5nID0gc3RyaW5nLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICBmb3IgKGxldCBvZmZzZXQgPSAwOyBvZmZzZXQgPCBsaXN0Lmxlbmd0aDsgb2Zmc2V0ICs9IDEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAobm9ybWFsaXplZFN0YXJ0SW5kZXggKyBvZmZzZXQpICUgbGlzdC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHRleHQgPSBsaXN0W2luZGV4XTtcbiAgICAgICAgaWYgKCF0ZXh0Py50b0xvY2FsZUxvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgobG93ZXJTdHJpbmcpIHx8ICFpc1Zpc2libGUoaW5kZXgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBjb25zdCBsaXN0Q29udGVudCA9IGxpc3RSZWYuY3VycmVudDtcbiAgICBpZiAoc3RyaW5nUmVmLmN1cnJlbnQubGVuZ3RoID4gMCAmJiBldmVudC5rZXkgPT09ICcgJykge1xuICAgICAgLy8gU3BhY2Ugc2hvdWxkIGNvbnRpbnVlIHRoZSBpbi1wcm9ncmVzcyB0eXBlYWhlYWQgc2Vzc2lvbi5cbiAgICAgIHN0b3BFdmVudChldmVudCk7XG4gICAgICBvblR5cGluZz8uKHRydWUpO1xuICAgIH1cbiAgICBpZiAoc3RyaW5nUmVmLmN1cnJlbnQubGVuZ3RoID4gMCAmJiBzdHJpbmdSZWYuY3VycmVudFswXSAhPT0gJyAnKSB7XG4gICAgICBpZiAoZ2V0TWF0Y2hpbmdJbmRleChsaXN0Q29udGVudCwgc3RyaW5nUmVmLmN1cnJlbnQpID09PSAtMSAmJiBldmVudC5rZXkgIT09ICcgJykge1xuICAgICAgICBvblR5cGluZz8uKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxpc3RDb250ZW50ID09IG51bGwgfHxcbiAgICAvLyBDaGFyYWN0ZXIga2V5LlxuICAgIGV2ZW50LmtleS5sZW5ndGggIT09IDEgfHxcbiAgICAvLyBNb2RpZmllciBrZXkuXG4gICAgZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAob3BlbiAmJiBldmVudC5rZXkgIT09ICcgJykge1xuICAgICAgc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgIG9uVHlwaW5nPy4odHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gQ2FwdHVyZSB3aGV0aGVyIHRoaXMgaXMgYSBuZXcgdHlwaW5nIHNlc3Npb24gYmVmb3JlIG11dGF0aW5nIHRoZSBzdHJpbmcuXG4gICAgY29uc3QgaXNOZXdTZXNzaW9uID0gc3RyaW5nUmVmLmN1cnJlbnQgPT09ICcnO1xuICAgIGlmIChpc05ld1Nlc3Npb24pIHtcbiAgICAgIHByZXZJbmRleFJlZi5jdXJyZW50ID0gc2VsZWN0ZWRJbmRleCA/PyBhY3RpdmVJbmRleCA/PyAtMTtcbiAgICB9XG5cbiAgICAvLyBCYWlsIG91dCBpZiB0aGUgbGlzdCBjb250YWlucyBhIHdvcmQgbGlrZSBcImxsYW1hXCIgb3IgXCJhYXJvblwiLiBUT0RPOlxuICAgIC8vIGFsbG93IGl0IGluIHRoaXMgY2FzZSwgdG9vLlxuICAgIGNvbnN0IGFsbG93UmFwaWRTdWNjZXNzaW9uT2ZGaXJzdExldHRlciA9IGxpc3RDb250ZW50LmV2ZXJ5KHRleHQgPT4gdGV4dCA/IHRleHRbMF0/LnRvTG9jYWxlTG93ZXJDYXNlKCkgIT09IHRleHRbMV0/LnRvTG9jYWxlTG93ZXJDYXNlKCkgOiB0cnVlKTtcblxuICAgIC8vIEFsbG93cyB0aGUgdXNlciB0byBjeWNsZSB0aHJvdWdoIGl0ZW1zIHRoYXQgc3RhcnQgd2l0aCB0aGUgc2FtZSBsZXR0ZXJcbiAgICAvLyBpbiByYXBpZCBzdWNjZXNzaW9uLlxuICAgIGlmIChhbGxvd1JhcGlkU3VjY2Vzc2lvbk9mRmlyc3RMZXR0ZXIgJiYgc3RyaW5nUmVmLmN1cnJlbnQgPT09IGV2ZW50LmtleSkge1xuICAgICAgc3RyaW5nUmVmLmN1cnJlbnQgPSAnJztcbiAgICAgIHByZXZJbmRleFJlZi5jdXJyZW50ID0gbWF0Y2hJbmRleFJlZi5jdXJyZW50O1xuICAgIH1cbiAgICBzdHJpbmdSZWYuY3VycmVudCArPSBldmVudC5rZXk7XG4gICAgdGltZW91dC5zdGFydChyZXNldE1zLCAoKSA9PiB7XG4gICAgICBzdHJpbmdSZWYuY3VycmVudCA9ICcnO1xuICAgICAgcHJldkluZGV4UmVmLmN1cnJlbnQgPSBtYXRjaEluZGV4UmVmLmN1cnJlbnQ7XG4gICAgICBvblR5cGluZz8uKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIC8vIENvbXB1dGUgdGhlIHN0YXJ0aW5nIGluZGV4IGZvciB0aGlzIHNlYXJjaC5cbiAgICAvLyBJZiB0aGlzIGlzIGEgbmV3IHR5cGluZyBzZXNzaW9uIChzdHJpbmcgaXMgZW1wdHkpLCBiYXNlIGl0IG9uIHRoZSBjdXJyZW50XG4gICAgLy8gc2VsZWN0aW9uL2FjdGl2ZSBpdGVtOyBvdGhlcndpc2UgY29udGludWUgZnJvbSB0aGUgbGFzdCBtYXRjaGVkIGluZGV4LlxuICAgIGNvbnN0IHByZXZJbmRleCA9IGlzTmV3U2Vzc2lvbiA/IHNlbGVjdGVkSW5kZXggPz8gYWN0aXZlSW5kZXggPz8gLTEgOiBwcmV2SW5kZXhSZWYuY3VycmVudDtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gKHByZXZJbmRleCA/PyAwKSArIDE7XG4gICAgY29uc3QgaW5kZXggPSBnZXRNYXRjaGluZ0luZGV4KGxpc3RDb250ZW50LCBzdHJpbmdSZWYuY3VycmVudCwgc3RhcnRJbmRleCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgb25NYXRjaFByb3A/LihpbmRleCk7XG4gICAgICBtYXRjaEluZGV4UmVmLmN1cnJlbnQgPSBpbmRleDtcbiAgICB9IGVsc2UgaWYgKGV2ZW50LmtleSAhPT0gJyAnKSB7XG4gICAgICBzdHJpbmdSZWYuY3VycmVudCA9ICcnO1xuICAgICAgb25UeXBpbmc/LihmYWxzZSk7XG4gICAgfVxuICB9KTtcbiAgY29uc3Qgb25CbHVyID0gdXNlU3RhYmxlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIGNvbnN0IG5leHQgPSBldmVudC5yZWxhdGVkVGFyZ2V0O1xuICAgIGNvbnN0IGN1cnJlbnREb21SZWZlcmVuY2VFbGVtZW50ID0gc3RvcmUuc2VsZWN0KCdkb21SZWZlcmVuY2VFbGVtZW50Jyk7XG4gICAgY29uc3QgY3VycmVudEZsb2F0aW5nRWxlbWVudCA9IHN0b3JlLnNlbGVjdCgnZmxvYXRpbmdFbGVtZW50Jyk7XG4gICAgY29uc3Qgd2l0aGluQ29tcG9zaXRlID0gY29udGFpbnMoY3VycmVudERvbVJlZmVyZW5jZUVsZW1lbnQsIG5leHQpIHx8IGNvbnRhaW5zKGN1cnJlbnRGbG9hdGluZ0VsZW1lbnQsIG5leHQpO1xuXG4gICAgLy8gS2VlcCB0aGUgc2Vzc2lvbiBpZiBmb2N1cyBtb3ZlcyB3aXRoaW4gdGhlIGNvbXBvc2l0ZSAocmVmZXJlbmNlIDwtPiBmbG9hdGluZykuXG4gICAgaWYgKHdpdGhpbkNvbXBvc2l0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEVuZCB0aGUgY3VycmVudCB0eXBpbmcgc2Vzc2lvbiB3aGVuIGZvY3VzIGxlYXZlcyB0aGUgY29tcG9zaXRlIGVudGlyZWx5LlxuICAgIHRpbWVvdXQuY2xlYXIoKTtcbiAgICBzdHJpbmdSZWYuY3VycmVudCA9ICcnO1xuICAgIHByZXZJbmRleFJlZi5jdXJyZW50ID0gbWF0Y2hJbmRleFJlZi5jdXJyZW50O1xuICAgIG9uVHlwaW5nPy4oZmFsc2UpO1xuICB9KTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIW9wZW4gJiYgc2VsZWN0ZWRJbmRleCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aW1lb3V0LmNsZWFyKCk7XG4gICAgbWF0Y2hJbmRleFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICBpZiAoc3RyaW5nUmVmLmN1cnJlbnQgIT09ICcnKSB7XG4gICAgICBzdHJpbmdSZWYuY3VycmVudCA9ICcnO1xuICAgIH1cbiAgfSwgW29wZW4sIHNlbGVjdGVkSW5kZXgsIHRpbWVvdXRdKTtcbiAgdXNlSXNvTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAvLyBTeW5jIGFycm93IGtleSBuYXZpZ2F0aW9uIGJ1dCBub3QgdHlwZWFoZWFkIG5hdmlnYXRpb24uXG4gICAgaWYgKG9wZW4gJiYgc3RyaW5nUmVmLmN1cnJlbnQgPT09ICcnKSB7XG4gICAgICBwcmV2SW5kZXhSZWYuY3VycmVudCA9IHNlbGVjdGVkSW5kZXggPz8gYWN0aXZlSW5kZXggPz8gLTE7XG4gICAgfVxuICB9LCBbb3Blbiwgc2VsZWN0ZWRJbmRleCwgYWN0aXZlSW5kZXhdKTtcbiAgY29uc3Qgc2hhcmVkUHJvcHMgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgb25LZXlEb3duLFxuICAgIG9uQmx1clxuICB9KSwgW29uS2V5RG93biwgb25CbHVyXSk7XG4gIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+IGVuYWJsZWQgPyB7XG4gICAgcmVmZXJlbmNlOiBzaGFyZWRQcm9wcyxcbiAgICBmbG9hdGluZzogc2hhcmVkUHJvcHNcbiAgfSA6IHt9LCBbZW5hYmxlZCwgc2hhcmVkUHJvcHNdKTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCBfZm9ybWF0RXJyb3JNZXNzYWdlIGZyb20gXCJAYmFzZS11aS91dGlscy9mb3JtYXRFcnJvck1lc3NhZ2VcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBUb29sYmFyUm9vdENvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dCh1bmRlZmluZWQpO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgVG9vbGJhclJvb3RDb250ZXh0LmRpc3BsYXlOYW1lID0gXCJUb29sYmFyUm9vdENvbnRleHRcIjtcbmV4cG9ydCBmdW5jdGlvbiB1c2VUb29sYmFyUm9vdENvbnRleHQob3B0aW9uYWwpIHtcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoVG9vbGJhclJvb3RDb250ZXh0KTtcbiAgaWYgKGNvbnRleHQgPT09IHVuZGVmaW5lZCAmJiAhb3B0aW9uYWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gJ0Jhc2UgVUk6IFRvb2xiYXJSb290Q29udGV4dCBpcyBtaXNzaW5nLiBUb29sYmFyIHBhcnRzIG11c3QgYmUgcGxhY2VkIHdpdGhpbiA8VG9vbGJhci5Sb290Pi4nIDogX2Zvcm1hdEVycm9yTWVzc2FnZSg2OSkpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufSIsImltcG9ydCB7IEVNUFRZX09CSkVDVCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL2VtcHR5JztcbmltcG9ydCB7IERJU0FCTEVEX1RSQU5TSVRJT05TX1NUWUxFIH0gZnJvbSBcIi4uL2ludGVybmFscy9jb25zdGFudHMuanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBnZXREaXNhYmxlZE1vdW50VHJhbnNpdGlvblN0eWxlcyh0cmFuc2l0aW9uU3RhdHVzKSB7XG4gIHJldHVybiB0cmFuc2l0aW9uU3RhdHVzID09PSAnc3RhcnRpbmcnID8gRElTQUJMRURfVFJBTlNJVElPTlNfU1RZTEUgOiBFTVBUWV9PQkpFQ1Q7XG59IiwiaW1wb3J0IHsgY2xhbXAsIGV2YWx1YXRlLCBnZXRBbGlnbm1lbnQsIGdldEFsaWdubWVudEF4aXMsIGdldEF4aXNMZW5ndGgsIGdldFBhZGRpbmdPYmplY3QgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMnO1xuLyoqXG4gKiBGb3JrIG9mIHRoZSBvcmlnaW5hbCBgYXJyb3dgIG1pZGRsZXdhcmUgZnJvbSBGbG9hdGluZyBVSSB0aGF0IGFsbG93c1xuICogY29uZmlndXJpbmcgdGhlIG9mZnNldCBwYXJlbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBiYXNlQXJyb3cgPSBvcHRpb25zID0+ICh7XG4gIG5hbWU6ICdhcnJvdycsXG4gIG9wdGlvbnMsXG4gIGFzeW5jIGZuKHN0YXRlKSB7XG4gICAgY29uc3Qge1xuICAgICAgeCxcbiAgICAgIHksXG4gICAgICBwbGFjZW1lbnQsXG4gICAgICByZWN0cyxcbiAgICAgIHBsYXRmb3JtLFxuICAgICAgZWxlbWVudHMsXG4gICAgICBtaWRkbGV3YXJlRGF0YVxuICAgIH0gPSBzdGF0ZTtcbiAgICAvLyBTaW5jZSBgZWxlbWVudGAgaXMgcmVxdWlyZWQsIHdlIGRvbid0IFBhcnRpYWw8PiB0aGUgdHlwZS5cbiAgICBjb25zdCB7XG4gICAgICBlbGVtZW50LFxuICAgICAgcGFkZGluZyA9IDAsXG4gICAgICBvZmZzZXRQYXJlbnQgPSAncmVhbCdcbiAgICB9ID0gZXZhbHVhdGUob3B0aW9ucywgc3RhdGUpIHx8IHt9O1xuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgcGFkZGluZ09iamVjdCA9IGdldFBhZGRpbmdPYmplY3QocGFkZGluZyk7XG4gICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgeCxcbiAgICAgIHlcbiAgICB9O1xuICAgIGNvbnN0IGF4aXMgPSBnZXRBbGlnbm1lbnRBeGlzKHBsYWNlbWVudCk7XG4gICAgY29uc3QgbGVuZ3RoID0gZ2V0QXhpc0xlbmd0aChheGlzKTtcbiAgICBjb25zdCBhcnJvd0RpbWVuc2lvbnMgPSBhd2FpdCBwbGF0Zm9ybS5nZXREaW1lbnNpb25zKGVsZW1lbnQpO1xuICAgIGNvbnN0IGlzWUF4aXMgPSBheGlzID09PSAneSc7XG4gICAgY29uc3QgbWluUHJvcCA9IGlzWUF4aXMgPyAndG9wJyA6ICdsZWZ0JztcbiAgICBjb25zdCBtYXhQcm9wID0gaXNZQXhpcyA/ICdib3R0b20nIDogJ3JpZ2h0JztcbiAgICBjb25zdCBjbGllbnRQcm9wID0gaXNZQXhpcyA/ICdjbGllbnRIZWlnaHQnIDogJ2NsaWVudFdpZHRoJztcbiAgICBjb25zdCBlbmREaWZmID0gcmVjdHMucmVmZXJlbmNlW2xlbmd0aF0gKyByZWN0cy5yZWZlcmVuY2VbYXhpc10gLSBjb29yZHNbYXhpc10gLSByZWN0cy5mbG9hdGluZ1tsZW5ndGhdO1xuICAgIGNvbnN0IHN0YXJ0RGlmZiA9IGNvb3Jkc1theGlzXSAtIHJlY3RzLnJlZmVyZW5jZVtheGlzXTtcbiAgICBjb25zdCBhcnJvd09mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudCA9PT0gJ3JlYWwnID8gYXdhaXQgcGxhdGZvcm0uZ2V0T2Zmc2V0UGFyZW50Py4oZWxlbWVudCkgOiBlbGVtZW50cy5mbG9hdGluZztcbiAgICBsZXQgY2xpZW50U2l6ZSA9IGVsZW1lbnRzLmZsb2F0aW5nW2NsaWVudFByb3BdIHx8IHJlY3RzLmZsb2F0aW5nW2xlbmd0aF07XG5cbiAgICAvLyBET00gcGxhdGZvcm0gY2FuIHJldHVybiBgd2luZG93YCBhcyB0aGUgYG9mZnNldFBhcmVudGAuXG4gICAgaWYgKCFjbGllbnRTaXplIHx8ICEoYXdhaXQgcGxhdGZvcm0uaXNFbGVtZW50Py4oYXJyb3dPZmZzZXRQYXJlbnQpKSkge1xuICAgICAgY2xpZW50U2l6ZSA9IGVsZW1lbnRzLmZsb2F0aW5nW2NsaWVudFByb3BdIHx8IHJlY3RzLmZsb2F0aW5nW2xlbmd0aF07XG4gICAgfVxuICAgIGNvbnN0IGNlbnRlclRvUmVmZXJlbmNlID0gZW5kRGlmZiAvIDIgLSBzdGFydERpZmYgLyAyO1xuXG4gICAgLy8gSWYgdGhlIHBhZGRpbmcgaXMgbGFyZ2UgZW5vdWdoIHRoYXQgaXQgY2F1c2VzIHRoZSBhcnJvdyB0byBubyBsb25nZXIgYmVcbiAgICAvLyBjZW50ZXJlZCwgbW9kaWZ5IHRoZSBwYWRkaW5nIHNvIHRoYXQgaXQgaXMgY2VudGVyZWQuXG4gICAgY29uc3QgbGFyZ2VzdFBvc3NpYmxlUGFkZGluZyA9IGNsaWVudFNpemUgLyAyIC0gYXJyb3dEaW1lbnNpb25zW2xlbmd0aF0gLyAyIC0gMTtcbiAgICBjb25zdCBtaW5QYWRkaW5nID0gTWF0aC5taW4ocGFkZGluZ09iamVjdFttaW5Qcm9wXSwgbGFyZ2VzdFBvc3NpYmxlUGFkZGluZyk7XG4gICAgY29uc3QgbWF4UGFkZGluZyA9IE1hdGgubWluKHBhZGRpbmdPYmplY3RbbWF4UHJvcF0sIGxhcmdlc3RQb3NzaWJsZVBhZGRpbmcpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBhcnJvdyBkb2Vzbid0IG92ZXJmbG93IHRoZSBmbG9hdGluZyBlbGVtZW50IGlmIHRoZSBjZW50ZXJcbiAgICAvLyBwb2ludCBpcyBvdXRzaWRlIHRoZSBmbG9hdGluZyBlbGVtZW50J3MgYm91bmRzLlxuICAgIGNvbnN0IG1pbiA9IG1pblBhZGRpbmc7XG4gICAgY29uc3QgbWF4ID0gY2xpZW50U2l6ZSAtIGFycm93RGltZW5zaW9uc1tsZW5ndGhdIC0gbWF4UGFkZGluZztcbiAgICBjb25zdCBjZW50ZXIgPSBjbGllbnRTaXplIC8gMiAtIGFycm93RGltZW5zaW9uc1tsZW5ndGhdIC8gMiArIGNlbnRlclRvUmVmZXJlbmNlO1xuICAgIGNvbnN0IG9mZnNldCA9IGNsYW1wKG1pbiwgY2VudGVyLCBtYXgpO1xuXG4gICAgLy8gSWYgdGhlIHJlZmVyZW5jZSBpcyBzbWFsbCBlbm91Z2ggdGhhdCB0aGUgYXJyb3cncyBwYWRkaW5nIGNhdXNlcyBpdCB0b1xuICAgIC8vIHRvIHBvaW50IHRvIG5vdGhpbmcgZm9yIGFuIGFsaWduZWQgcGxhY2VtZW50LCBhZGp1c3QgdGhlIG9mZnNldCBvZiB0aGVcbiAgICAvLyBmbG9hdGluZyBlbGVtZW50IGl0c2VsZi4gVG8gZW5zdXJlIGBzaGlmdCgpYCBjb250aW51ZXMgdG8gdGFrZSBhY3Rpb24sXG4gICAgLy8gYSBzaW5nbGUgcmVzZXQgaXMgcGVyZm9ybWVkIHdoZW4gdGhpcyBpcyB0cnVlLlxuICAgIGNvbnN0IHNob3VsZEFkZE9mZnNldCA9ICFtaWRkbGV3YXJlRGF0YS5hcnJvdyAmJiBnZXRBbGlnbm1lbnQocGxhY2VtZW50KSAhPSBudWxsICYmIGNlbnRlciAhPT0gb2Zmc2V0ICYmIHJlY3RzLnJlZmVyZW5jZVtsZW5ndGhdIC8gMiAtIChjZW50ZXIgPCBtaW4gPyBtaW5QYWRkaW5nIDogbWF4UGFkZGluZykgLSBhcnJvd0RpbWVuc2lvbnNbbGVuZ3RoXSAvIDIgPCAwO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuICAgIGNvbnN0IGFsaWdubWVudE9mZnNldCA9IHNob3VsZEFkZE9mZnNldCA/IGNlbnRlciA8IG1pbiA/IGNlbnRlciAtIG1pbiA6IGNlbnRlciAtIG1heCA6IDA7XG4gICAgcmV0dXJuIHtcbiAgICAgIFtheGlzXTogY29vcmRzW2F4aXNdICsgYWxpZ25tZW50T2Zmc2V0LFxuICAgICAgZGF0YToge1xuICAgICAgICBbYXhpc106IG9mZnNldCxcbiAgICAgICAgY2VudGVyT2Zmc2V0OiBjZW50ZXIgLSBvZmZzZXQgLSBhbGlnbm1lbnRPZmZzZXQsXG4gICAgICAgIC4uLihzaG91bGRBZGRPZmZzZXQgJiYge1xuICAgICAgICAgIGFsaWdubWVudE9mZnNldFxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIHJlc2V0OiBzaG91bGRBZGRPZmZzZXRcbiAgICB9O1xuICB9XG59KTtcblxuLyoqXG4gKiBQcm92aWRlcyBkYXRhIHRvIHBvc2l0aW9uIGFuIGlubmVyIGVsZW1lbnQgb2YgdGhlIGZsb2F0aW5nIGVsZW1lbnQgc28gdGhhdCBpdFxuICogYXBwZWFycyBjZW50ZXJlZCB0byB0aGUgcmVmZXJlbmNlIGVsZW1lbnQuXG4gKiBUaGlzIHdyYXBzIHRoZSBjb3JlIGBhcnJvd2AgbWlkZGxld2FyZSB0byBhbGxvdyBSZWFjdCByZWZzIGFzIHRoZSBlbGVtZW50LlxuICogQHNlZSBodHRwczovL2Zsb2F0aW5nLXVpLmNvbS9kb2NzL2Fycm93XG4gKi9cbmV4cG9ydCBjb25zdCBhcnJvdyA9IChvcHRpb25zLCBkZXBzKSA9PiAoe1xuICAuLi5iYXNlQXJyb3cob3B0aW9ucyksXG4gIG9wdGlvbnM6IFtvcHRpb25zLCBkZXBzXVxufSk7IiwiaW1wb3J0IHsgaGlkZSBhcyBuYXRpdmVIaWRlIH0gZnJvbSAnQGZsb2F0aW5nLXVpL3JlYWN0LWRvbSc7XG5leHBvcnQgY29uc3QgaGlkZSA9IHtcbiAgbmFtZTogJ2hpZGUnLFxuICBhc3luYyBmbihzdGF0ZSkge1xuICAgIGNvbnN0IHtcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgeCxcbiAgICAgIHlcbiAgICB9ID0gc3RhdGUucmVjdHMucmVmZXJlbmNlO1xuICAgIGNvbnN0IGFuY2hvckhpZGRlbiA9IHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB4ID09PSAwICYmIHkgPT09IDA7XG4gICAgY29uc3QgbmF0aXZlSGlkZVJlc3VsdCA9IGF3YWl0IG5hdGl2ZUhpZGUoKS5mbihzdGF0ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcmVmZXJlbmNlSGlkZGVuOiBuYXRpdmVIaWRlUmVzdWx0LmRhdGE/LnJlZmVyZW5jZUhpZGRlbiB8fCBhbmNob3JIaWRkZW5cbiAgICAgIH1cbiAgICB9O1xuICB9XG59OyIsImltcG9ydCB7IG93bmVyRG9jdW1lbnQsIG93bmVyV2luZG93IH0gZnJvbSAnQGJhc2UtdWkvdXRpbHMvb3duZXInO1xuaW1wb3J0IHsgZ2V0U2lkZSB9IGZyb20gJ0BmbG9hdGluZy11aS91dGlscyc7XG5leHBvcnQgY29uc3QgREVGQVVMVF9TSURFUyA9IHtcbiAgc2lkZVg6ICdsZWZ0JyxcbiAgc2lkZVk6ICd0b3AnXG59O1xuZXhwb3J0IGNvbnN0IGFkYXB0aXZlT3JpZ2luID0ge1xuICBuYW1lOiAnYWRhcHRpdmVPcmlnaW4nLFxuICBhc3luYyBmbihzdGF0ZSkge1xuICAgIGNvbnN0IHtcbiAgICAgIHg6IHJhd1gsXG4gICAgICB5OiByYXdZLFxuICAgICAgcmVjdHM6IHtcbiAgICAgICAgZmxvYXRpbmc6IGZsb2F0UmVjdFxuICAgICAgfSxcbiAgICAgIGVsZW1lbnRzOiB7XG4gICAgICAgIGZsb2F0aW5nXG4gICAgICB9LFxuICAgICAgcGxhdGZvcm0sXG4gICAgICBzdHJhdGVneSxcbiAgICAgIHBsYWNlbWVudFxuICAgIH0gPSBzdGF0ZTtcbiAgICBjb25zdCB3aW4gPSBvd25lcldpbmRvdyhmbG9hdGluZyk7XG4gICAgY29uc3Qgc3R5bGVzID0gd2luLmdldENvbXB1dGVkU3R5bGUoZmxvYXRpbmcpO1xuICAgIGNvbnN0IGhhc1RyYW5zaXRpb24gPSBzdHlsZXMudHJhbnNpdGlvbkR1cmF0aW9uICE9PSAnMHMnICYmIHN0eWxlcy50cmFuc2l0aW9uRHVyYXRpb24gIT09ICcnO1xuICAgIGlmICghaGFzVHJhbnNpdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogcmF3WCxcbiAgICAgICAgeTogcmF3WSxcbiAgICAgICAgZGF0YTogREVGQVVMVF9TSURFU1xuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3Qgb2Zmc2V0UGFyZW50ID0gYXdhaXQgcGxhdGZvcm0uZ2V0T2Zmc2V0UGFyZW50Py4oZmxvYXRpbmcpO1xuICAgIGxldCBvZmZzZXREaW1lbnNpb25zID0ge1xuICAgICAgd2lkdGg6IDAsXG4gICAgICBoZWlnaHQ6IDBcbiAgICB9O1xuXG4gICAgLy8gRm9yIGZpeGVkIHN0cmF0ZWd5LCBwcmVmZXIgdmlzdWFsVmlld3BvcnQgaWYgYXZhaWxhYmxlXG4gICAgaWYgKHN0cmF0ZWd5ID09PSAnZml4ZWQnICYmIHdpbj8udmlzdWFsVmlld3BvcnQpIHtcbiAgICAgIG9mZnNldERpbWVuc2lvbnMgPSB7XG4gICAgICAgIHdpZHRoOiB3aW4udmlzdWFsVmlld3BvcnQud2lkdGgsXG4gICAgICAgIGhlaWdodDogd2luLnZpc3VhbFZpZXdwb3J0LmhlaWdodFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKG9mZnNldFBhcmVudCA9PT0gd2luKSB7XG4gICAgICBjb25zdCBkb2MgPSBvd25lckRvY3VtZW50KGZsb2F0aW5nKTtcbiAgICAgIG9mZnNldERpbWVuc2lvbnMgPSB7XG4gICAgICAgIHdpZHRoOiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoYXdhaXQgcGxhdGZvcm0uaXNFbGVtZW50Py4ob2Zmc2V0UGFyZW50KSkge1xuICAgICAgb2Zmc2V0RGltZW5zaW9ucyA9IGF3YWl0IHBsYXRmb3JtLmdldERpbWVuc2lvbnMob2Zmc2V0UGFyZW50KTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudFNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gICAgbGV0IHggPSByYXdYO1xuICAgIGxldCB5ID0gcmF3WTtcbiAgICBpZiAoY3VycmVudFNpZGUgPT09ICdsZWZ0Jykge1xuICAgICAgeCA9IG9mZnNldERpbWVuc2lvbnMud2lkdGggLSAocmF3WCArIGZsb2F0UmVjdC53aWR0aCk7XG4gICAgfVxuICAgIGlmIChjdXJyZW50U2lkZSA9PT0gJ3RvcCcpIHtcbiAgICAgIHkgPSBvZmZzZXREaW1lbnNpb25zLmhlaWdodCAtIChyYXdZICsgZmxvYXRSZWN0LmhlaWdodCk7XG4gICAgfVxuICAgIGNvbnN0IHNpZGVYID0gY3VycmVudFNpZGUgPT09ICdsZWZ0JyA/ICdyaWdodCcgOiBERUZBVUxUX1NJREVTLnNpZGVYO1xuICAgIGNvbnN0IHNpZGVZID0gY3VycmVudFNpZGUgPT09ICd0b3AnID8gJ2JvdHRvbScgOiBERUZBVUxUX1NJREVTLnNpZGVZO1xuICAgIHJldHVybiB7XG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc2lkZVgsXG4gICAgICAgIHNpZGVZXG4gICAgICB9XG4gICAgfTtcbiAgfVxufTsiLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGdldFNpZGUsIGdldEFsaWdubWVudCwgZ2V0U2lkZUF4aXMgfSBmcm9tICdAZmxvYXRpbmctdWkvdXRpbHMnO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCwgb3duZXJXaW5kb3cgfSBmcm9tICdAYmFzZS11aS91dGlscy9vd25lcic7XG5pbXBvcnQgeyB1c2VJc29MYXlvdXRFZmZlY3QgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VJc29MYXlvdXRFZmZlY3QnO1xuaW1wb3J0IHsgdXNlVmFsdWVBc1JlZiB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZVZhbHVlQXNSZWYnO1xuaW1wb3J0IHsgdXNlU3RhYmxlQ2FsbGJhY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTdGFibGVDYWxsYmFjayc7XG5pbXBvcnQgeyBhdXRvVXBkYXRlLCBmbGlwLCBsaW1pdFNoaWZ0LCBvZmZzZXQsIHNoaWZ0LCB1c2VGbG9hdGluZywgc2l6ZSB9IGZyb20gXCIuLi9mbG9hdGluZy11aS1yZWFjdC9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdXNlRGlyZWN0aW9uIH0gZnJvbSBcIi4uL2ludGVybmFscy9kaXJlY3Rpb24tY29udGV4dC9EaXJlY3Rpb25Db250ZXh0LmpzXCI7XG5pbXBvcnQgeyBhcnJvdyB9IGZyb20gXCIuLi9mbG9hdGluZy11aS1yZWFjdC9taWRkbGV3YXJlL2Fycm93LmpzXCI7XG5pbXBvcnQgeyBoaWRlIH0gZnJvbSBcIi4vaGlkZU1pZGRsZXdhcmUuanNcIjtcbmltcG9ydCB7IERFRkFVTFRfU0lERVMgfSBmcm9tIFwiLi9hZGFwdGl2ZU9yaWdpbk1pZGRsZXdhcmUuanNcIjtcbmZ1bmN0aW9uIGdldExvZ2ljYWxTaWRlKHNpZGVQYXJhbSwgcmVuZGVyZWRTaWRlLCBpc1J0bCkge1xuICBjb25zdCBpc0xvZ2ljYWxTaWRlUGFyYW0gPSBzaWRlUGFyYW0gPT09ICdpbmxpbmUtc3RhcnQnIHx8IHNpZGVQYXJhbSA9PT0gJ2lubGluZS1lbmQnO1xuICBjb25zdCBsb2dpY2FsUmlnaHQgPSBpc1J0bCA/ICdpbmxpbmUtc3RhcnQnIDogJ2lubGluZS1lbmQnO1xuICBjb25zdCBsb2dpY2FsTGVmdCA9IGlzUnRsID8gJ2lubGluZS1lbmQnIDogJ2lubGluZS1zdGFydCc7XG4gIHJldHVybiB7XG4gICAgdG9wOiAndG9wJyxcbiAgICByaWdodDogaXNMb2dpY2FsU2lkZVBhcmFtID8gbG9naWNhbFJpZ2h0IDogJ3JpZ2h0JyxcbiAgICBib3R0b206ICdib3R0b20nLFxuICAgIGxlZnQ6IGlzTG9naWNhbFNpZGVQYXJhbSA/IGxvZ2ljYWxMZWZ0IDogJ2xlZnQnXG4gIH1bcmVuZGVyZWRTaWRlXTtcbn1cbmZ1bmN0aW9uIGdldE9mZnNldERhdGEoc3RhdGUsIHNpZGVQYXJhbSwgaXNSdGwpIHtcbiAgY29uc3Qge1xuICAgIHJlY3RzLFxuICAgIHBsYWNlbWVudFxuICB9ID0gc3RhdGU7XG4gIGNvbnN0IGRhdGEgPSB7XG4gICAgc2lkZTogZ2V0TG9naWNhbFNpZGUoc2lkZVBhcmFtLCBnZXRTaWRlKHBsYWNlbWVudCksIGlzUnRsKSxcbiAgICBhbGlnbjogZ2V0QWxpZ25tZW50KHBsYWNlbWVudCkgfHwgJ2NlbnRlcicsXG4gICAgYW5jaG9yOiB7XG4gICAgICB3aWR0aDogcmVjdHMucmVmZXJlbmNlLndpZHRoLFxuICAgICAgaGVpZ2h0OiByZWN0cy5yZWZlcmVuY2UuaGVpZ2h0XG4gICAgfSxcbiAgICBwb3NpdGlvbmVyOiB7XG4gICAgICB3aWR0aDogcmVjdHMuZmxvYXRpbmcud2lkdGgsXG4gICAgICBoZWlnaHQ6IHJlY3RzLmZsb2F0aW5nLmhlaWdodFxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGRhdGE7XG59XG4vKipcbiAqIFByb3ZpZGVzIHN0YW5kYXJkaXplZCBhbmNob3IgcG9zaXRpb25pbmcgYmVoYXZpb3IgZm9yIGZsb2F0aW5nIGVsZW1lbnRzLiBXcmFwcyBGbG9hdGluZyBVSSdzXG4gKiBgdXNlRmxvYXRpbmdgIGhvb2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VBbmNob3JQb3NpdGlvbmluZyhwYXJhbXMpIHtcbiAgY29uc3Qge1xuICAgIC8vIFB1YmxpYyBwYXJhbWV0ZXJzXG4gICAgYW5jaG9yLFxuICAgIHBvc2l0aW9uTWV0aG9kID0gJ2Fic29sdXRlJyxcbiAgICBzaWRlOiBzaWRlUGFyYW0gPSAnYm90dG9tJyxcbiAgICBzaWRlT2Zmc2V0ID0gMCxcbiAgICBhbGlnbiA9ICdjZW50ZXInLFxuICAgIGFsaWduT2Zmc2V0ID0gMCxcbiAgICBjb2xsaXNpb25Cb3VuZGFyeSxcbiAgICBjb2xsaXNpb25QYWRkaW5nOiBjb2xsaXNpb25QYWRkaW5nUGFyYW0gPSA1LFxuICAgIHN0aWNreSA9IGZhbHNlLFxuICAgIGFycm93UGFkZGluZyA9IDUsXG4gICAgZGlzYWJsZUFuY2hvclRyYWNraW5nID0gZmFsc2UsXG4gICAgaW5saW5lOiBpbmxpbmVNaWRkbGV3YXJlLFxuICAgIC8vIFByaXZhdGUgcGFyYW1ldGVyc1xuICAgIGtlZXBNb3VudGVkID0gZmFsc2UsXG4gICAgZmxvYXRpbmdSb290Q29udGV4dCxcbiAgICBtb3VudGVkLFxuICAgIGNvbGxpc2lvbkF2b2lkYW5jZSxcbiAgICBzaGlmdENyb3NzQXhpcyA9IGZhbHNlLFxuICAgIG5vZGVJZCxcbiAgICBhZGFwdGl2ZU9yaWdpbixcbiAgICBsYXp5RmxpcCA9IGZhbHNlLFxuICAgIGV4dGVybmFsVHJlZVxuICB9ID0gcGFyYW1zO1xuICBjb25zdCBbbW91bnRTaWRlLCBzZXRNb3VudFNpZGVdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGlmICghbW91bnRlZCAmJiBtb3VudFNpZGUgIT09IG51bGwpIHtcbiAgICBzZXRNb3VudFNpZGUobnVsbCk7XG4gIH1cbiAgY29uc3QgY29sbGlzaW9uQXZvaWRhbmNlU2lkZSA9IGNvbGxpc2lvbkF2b2lkYW5jZS5zaWRlIHx8ICdmbGlwJztcbiAgY29uc3QgY29sbGlzaW9uQXZvaWRhbmNlQWxpZ24gPSBjb2xsaXNpb25Bdm9pZGFuY2UuYWxpZ24gfHwgJ2ZsaXAnO1xuICBjb25zdCBjb2xsaXNpb25Bdm9pZGFuY2VGYWxsYmFja0F4aXNTaWRlID0gY29sbGlzaW9uQXZvaWRhbmNlLmZhbGxiYWNrQXhpc1NpZGUgfHwgJ2VuZCc7XG4gIGNvbnN0IGFuY2hvckZuID0gdHlwZW9mIGFuY2hvciA9PT0gJ2Z1bmN0aW9uJyA/IGFuY2hvciA6IHVuZGVmaW5lZDtcbiAgY29uc3QgYW5jaG9yRm5DYWxsYmFjayA9IHVzZVN0YWJsZUNhbGxiYWNrKGFuY2hvckZuKTtcbiAgY29uc3QgYW5jaG9yRGVwID0gYW5jaG9yRm4gPyBhbmNob3JGbkNhbGxiYWNrIDogYW5jaG9yO1xuICBjb25zdCBhbmNob3JWYWx1ZVJlZiA9IHVzZVZhbHVlQXNSZWYoYW5jaG9yKTtcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVZhbHVlQXNSZWYobW91bnRlZCk7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IHVzZURpcmVjdGlvbigpO1xuICBjb25zdCBpc1J0bCA9IGRpcmVjdGlvbiA9PT0gJ3J0bCc7XG4gIGNvbnN0IHNpZGUgPSBtb3VudFNpZGUgfHwge1xuICAgIHRvcDogJ3RvcCcsXG4gICAgcmlnaHQ6ICdyaWdodCcsXG4gICAgYm90dG9tOiAnYm90dG9tJyxcbiAgICBsZWZ0OiAnbGVmdCcsXG4gICAgJ2lubGluZS1lbmQnOiBpc1J0bCA/ICdsZWZ0JyA6ICdyaWdodCcsXG4gICAgJ2lubGluZS1zdGFydCc6IGlzUnRsID8gJ3JpZ2h0JyA6ICdsZWZ0J1xuICB9W3NpZGVQYXJhbV07XG4gIGNvbnN0IHBsYWNlbWVudCA9IGFsaWduID09PSAnY2VudGVyJyA/IHNpZGUgOiBgJHtzaWRlfS0ke2FsaWdufWA7XG4gIGxldCBjb2xsaXNpb25QYWRkaW5nID0gY29sbGlzaW9uUGFkZGluZ1BhcmFtO1xuXG4gIC8vIENyZWF0ZSBhIGJpYXMgdG8gdGhlIHByZWZlcnJlZCBzaWRlLlxuICAvLyBPbiBpT1MsIHdoZW4gdGhlIG1vYmlsZSBzb2Z0d2FyZSBrZXlib2FyZCBvcGVucywgdGhlIGlucHV0IGlzIGV4YWN0bHkgY2VudGVyZWRcbiAgLy8gaW4gdGhlIHZpZXdwb3J0LCBidXQgdGhpcyBjYW4gY2F1c2UgaXQgdG8gZmxpcCB0byB0aGUgdG9wIHVuZGVzaXJhYmx5LlxuICBjb25zdCBiaWFzID0gMTtcbiAgY29uc3QgYmlhc1RvcCA9IHNpZGVQYXJhbSA9PT0gJ2JvdHRvbScgPyBiaWFzIDogMDtcbiAgY29uc3QgYmlhc0JvdHRvbSA9IHNpZGVQYXJhbSA9PT0gJ3RvcCcgPyBiaWFzIDogMDtcbiAgY29uc3QgYmlhc0xlZnQgPSBzaWRlUGFyYW0gPT09ICdyaWdodCcgPyBiaWFzIDogMDtcbiAgY29uc3QgYmlhc1JpZ2h0ID0gc2lkZVBhcmFtID09PSAnbGVmdCcgPyBiaWFzIDogMDtcbiAgaWYgKHR5cGVvZiBjb2xsaXNpb25QYWRkaW5nID09PSAnbnVtYmVyJykge1xuICAgIGNvbGxpc2lvblBhZGRpbmcgPSB7XG4gICAgICB0b3A6IGNvbGxpc2lvblBhZGRpbmcgKyBiaWFzVG9wLFxuICAgICAgcmlnaHQ6IGNvbGxpc2lvblBhZGRpbmcgKyBiaWFzUmlnaHQsXG4gICAgICBib3R0b206IGNvbGxpc2lvblBhZGRpbmcgKyBiaWFzQm90dG9tLFxuICAgICAgbGVmdDogY29sbGlzaW9uUGFkZGluZyArIGJpYXNMZWZ0XG4gICAgfTtcbiAgfSBlbHNlIGlmIChjb2xsaXNpb25QYWRkaW5nKSB7XG4gICAgY29sbGlzaW9uUGFkZGluZyA9IHtcbiAgICAgIHRvcDogKGNvbGxpc2lvblBhZGRpbmcudG9wIHx8IDApICsgYmlhc1RvcCxcbiAgICAgIHJpZ2h0OiAoY29sbGlzaW9uUGFkZGluZy5yaWdodCB8fCAwKSArIGJpYXNSaWdodCxcbiAgICAgIGJvdHRvbTogKGNvbGxpc2lvblBhZGRpbmcuYm90dG9tIHx8IDApICsgYmlhc0JvdHRvbSxcbiAgICAgIGxlZnQ6IChjb2xsaXNpb25QYWRkaW5nLmxlZnQgfHwgMCkgKyBiaWFzTGVmdFxuICAgIH07XG4gIH1cbiAgY29uc3QgY29tbW9uQ29sbGlzaW9uUHJvcHMgPSB7XG4gICAgYm91bmRhcnk6IGNvbGxpc2lvbkJvdW5kYXJ5ID09PSAnY2xpcHBpbmctYW5jZXN0b3JzJyA/ICdjbGlwcGluZ0FuY2VzdG9ycycgOiBjb2xsaXNpb25Cb3VuZGFyeSxcbiAgICBwYWRkaW5nOiBjb2xsaXNpb25QYWRkaW5nXG4gIH07XG5cbiAgLy8gVXNpbmcgYSByZWYgYXNzdW1lcyB0aGF0IHRoZSBhcnJvdyBlbGVtZW50IGlzIGFsd2F5cyBwcmVzZW50IGluIHRoZSBET00gZm9yIHRoZSBsaWZldGltZSBvZiB0aGVcbiAgLy8gcG9wdXAuIElmIHRoaXMgYXNzdW1wdGlvbiBlbmRzIHVwIGJlaW5nIGZhbHNlLCB3ZSBjYW4gc3dpdGNoIHRvIHN0YXRlIHRvIG1hbmFnZSB0aGUgYXJyb3cnc1xuICAvLyBwcmVzZW5jZS5cbiAgY29uc3QgYXJyb3dSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG5cbiAgLy8gS2VlcCB0aGVzZSByZWFjdGl2ZSBpZiB0aGV5J3JlIG5vdCBmdW5jdGlvbnNcbiAgY29uc3Qgc2lkZU9mZnNldFJlZiA9IHVzZVZhbHVlQXNSZWYoc2lkZU9mZnNldCk7XG4gIGNvbnN0IGFsaWduT2Zmc2V0UmVmID0gdXNlVmFsdWVBc1JlZihhbGlnbk9mZnNldCk7XG4gIGNvbnN0IHNpZGVPZmZzZXREZXAgPSB0eXBlb2Ygc2lkZU9mZnNldCAhPT0gJ2Z1bmN0aW9uJyA/IHNpZGVPZmZzZXQgOiAwO1xuICBjb25zdCBhbGlnbk9mZnNldERlcCA9IHR5cGVvZiBhbGlnbk9mZnNldCAhPT0gJ2Z1bmN0aW9uJyA/IGFsaWduT2Zmc2V0IDogMDtcbiAgY29uc3QgbWlkZGxld2FyZSA9IFtdO1xuICBpZiAoaW5saW5lTWlkZGxld2FyZSkge1xuICAgIG1pZGRsZXdhcmUucHVzaChpbmxpbmVNaWRkbGV3YXJlKTtcbiAgfVxuICBtaWRkbGV3YXJlLnB1c2gob2Zmc2V0KHN0YXRlID0+IHtcbiAgICBjb25zdCBkYXRhID0gZ2V0T2Zmc2V0RGF0YShzdGF0ZSwgc2lkZVBhcmFtLCBpc1J0bCk7XG4gICAgY29uc3Qgc2lkZUF4aXMgPSB0eXBlb2Ygc2lkZU9mZnNldFJlZi5jdXJyZW50ID09PSAnZnVuY3Rpb24nID8gc2lkZU9mZnNldFJlZi5jdXJyZW50KGRhdGEpIDogc2lkZU9mZnNldFJlZi5jdXJyZW50O1xuICAgIGNvbnN0IGFsaWduQXhpcyA9IHR5cGVvZiBhbGlnbk9mZnNldFJlZi5jdXJyZW50ID09PSAnZnVuY3Rpb24nID8gYWxpZ25PZmZzZXRSZWYuY3VycmVudChkYXRhKSA6IGFsaWduT2Zmc2V0UmVmLmN1cnJlbnQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1haW5BeGlzOiBzaWRlQXhpcyxcbiAgICAgIGNyb3NzQXhpczogYWxpZ25BeGlzLFxuICAgICAgYWxpZ25tZW50QXhpczogYWxpZ25BeGlzXG4gICAgfTtcbiAgfSwgW3NpZGVPZmZzZXREZXAsIGFsaWduT2Zmc2V0RGVwLCBpc1J0bCwgc2lkZVBhcmFtXSkpO1xuICBjb25zdCBzaGlmdERpc2FibGVkID0gY29sbGlzaW9uQXZvaWRhbmNlQWxpZ24gPT09ICdub25lJyAmJiBjb2xsaXNpb25Bdm9pZGFuY2VTaWRlICE9PSAnc2hpZnQnO1xuICBjb25zdCBjcm9zc0F4aXNTaGlmdEVuYWJsZWQgPSAhc2hpZnREaXNhYmxlZCAmJiAoc3RpY2t5IHx8IHNoaWZ0Q3Jvc3NBeGlzIHx8IGNvbGxpc2lvbkF2b2lkYW5jZVNpZGUgPT09ICdzaGlmdCcpO1xuICBjb25zdCBmbGlwTWlkZGxld2FyZSA9IGNvbGxpc2lvbkF2b2lkYW5jZVNpZGUgPT09ICdub25lJyA/IG51bGwgOiBmbGlwKHtcbiAgICAuLi5jb21tb25Db2xsaXNpb25Qcm9wcyxcbiAgICAvLyBFbnN1cmUgdGhlIHBvcHVwIGZsaXBzIGlmIGl0J3MgYmVlbiBsaW1pdGVkIGJ5IGl0cyAtLWF2YWlsYWJsZS1oZWlnaHQgYW5kIGl0IHJlc2l6ZXMuXG4gICAgLy8gU2luY2UgdGhlIHNpemUoKSBwYWRkaW5nIGlzIHNtYWxsZXIgdGhhbiB0aGUgZmxpcCgpIHBhZGRpbmcsIGZsaXAoKSB3aWxsIHRha2UgcHJlY2VkZW5jZS5cbiAgICBwYWRkaW5nOiB7XG4gICAgICB0b3A6IGNvbGxpc2lvblBhZGRpbmcudG9wICsgYmlhcyxcbiAgICAgIHJpZ2h0OiBjb2xsaXNpb25QYWRkaW5nLnJpZ2h0ICsgYmlhcyxcbiAgICAgIGJvdHRvbTogY29sbGlzaW9uUGFkZGluZy5ib3R0b20gKyBiaWFzLFxuICAgICAgbGVmdDogY29sbGlzaW9uUGFkZGluZy5sZWZ0ICsgYmlhc1xuICAgIH0sXG4gICAgbWFpbkF4aXM6ICFzaGlmdENyb3NzQXhpcyAmJiBjb2xsaXNpb25Bdm9pZGFuY2VTaWRlID09PSAnZmxpcCcsXG4gICAgY3Jvc3NBeGlzOiBjb2xsaXNpb25Bdm9pZGFuY2VBbGlnbiA9PT0gJ2ZsaXAnID8gJ2FsaWdubWVudCcgOiBmYWxzZSxcbiAgICBmYWxsYmFja0F4aXNTaWRlRGlyZWN0aW9uOiBjb2xsaXNpb25Bdm9pZGFuY2VGYWxsYmFja0F4aXNTaWRlXG4gIH0pO1xuICBjb25zdCBzaGlmdE1pZGRsZXdhcmUgPSBzaGlmdERpc2FibGVkID8gbnVsbCA6IHNoaWZ0KGRhdGEgPT4ge1xuICAgIGNvbnN0IGh0bWwgPSBvd25lckRvY3VtZW50KGRhdGEuZWxlbWVudHMuZmxvYXRpbmcpLmRvY3VtZW50RWxlbWVudDtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uY29tbW9uQ29sbGlzaW9uUHJvcHMsXG4gICAgICAvLyBVc2UgdGhlIExheW91dCBWaWV3cG9ydCB0byBhdm9pZCBzaGlmdGluZyBhcm91bmQgd2hlbiBwaW5jaC16b29taW5nXG4gICAgICAvLyBmb3IgY29udGV4dCBtZW51cy5cbiAgICAgIHJvb3RCb3VuZGFyeTogc2hpZnRDcm9zc0F4aXMgPyB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiBodG1sLmNsaWVudFdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGh0bWwuY2xpZW50SGVpZ2h0XG4gICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgbWFpbkF4aXM6IGNvbGxpc2lvbkF2b2lkYW5jZUFsaWduICE9PSAnbm9uZScsXG4gICAgICBjcm9zc0F4aXM6IGNyb3NzQXhpc1NoaWZ0RW5hYmxlZCxcbiAgICAgIGxpbWl0ZXI6IHN0aWNreSB8fCBzaGlmdENyb3NzQXhpcyA/IHVuZGVmaW5lZCA6IGxpbWl0U2hpZnQobGltaXREYXRhID0+IHtcbiAgICAgICAgaWYgKCFhcnJvd1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICBoZWlnaHRcbiAgICAgICAgfSA9IGFycm93UmVmLmN1cnJlbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHNpZGVBeGlzID0gZ2V0U2lkZUF4aXMoZ2V0U2lkZShsaW1pdERhdGEucGxhY2VtZW50KSk7XG4gICAgICAgIGNvbnN0IGFycm93U2l6ZSA9IHNpZGVBeGlzID09PSAneScgPyB3aWR0aCA6IGhlaWdodDtcbiAgICAgICAgY29uc3Qgb2Zmc2V0QW1vdW50ID0gc2lkZUF4aXMgPT09ICd5JyA/IGNvbGxpc2lvblBhZGRpbmcubGVmdCArIGNvbGxpc2lvblBhZGRpbmcucmlnaHQgOiBjb2xsaXNpb25QYWRkaW5nLnRvcCArIGNvbGxpc2lvblBhZGRpbmcuYm90dG9tO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG9mZnNldDogYXJyb3dTaXplIC8gMiArIG9mZnNldEFtb3VudCAvIDJcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgfTtcbiAgfSwgW2NvbW1vbkNvbGxpc2lvblByb3BzLCBzdGlja3ksIHNoaWZ0Q3Jvc3NBeGlzLCBjb2xsaXNpb25QYWRkaW5nLCBjb2xsaXNpb25Bdm9pZGFuY2VBbGlnbl0pO1xuXG4gIC8vIGh0dHBzOi8vZmxvYXRpbmctdWkuY29tL2RvY3MvZmxpcCNjb21iaW5pbmctd2l0aC1zaGlmdFxuICBpZiAoY29sbGlzaW9uQXZvaWRhbmNlU2lkZSA9PT0gJ3NoaWZ0JyB8fCBjb2xsaXNpb25Bdm9pZGFuY2VBbGlnbiA9PT0gJ3NoaWZ0JyB8fCBhbGlnbiA9PT0gJ2NlbnRlcicpIHtcbiAgICBtaWRkbGV3YXJlLnB1c2goc2hpZnRNaWRkbGV3YXJlLCBmbGlwTWlkZGxld2FyZSk7XG4gIH0gZWxzZSB7XG4gICAgbWlkZGxld2FyZS5wdXNoKGZsaXBNaWRkbGV3YXJlLCBzaGlmdE1pZGRsZXdhcmUpO1xuICB9XG4gIG1pZGRsZXdhcmUucHVzaChzaXplKHtcbiAgICAuLi5jb21tb25Db2xsaXNpb25Qcm9wcyxcbiAgICBhcHBseSh7XG4gICAgICBlbGVtZW50czoge1xuICAgICAgICBmbG9hdGluZ1xuICAgICAgfSxcbiAgICAgIGF2YWlsYWJsZVdpZHRoLFxuICAgICAgYXZhaWxhYmxlSGVpZ2h0LFxuICAgICAgcmVjdHNcbiAgICB9KSB7XG4gICAgICBpZiAoIW1vdW50ZWRSZWYuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBmbG9hdGluZ1N0eWxlID0gZmxvYXRpbmcuc3R5bGU7XG4gICAgICBmbG9hdGluZ1N0eWxlLnNldFByb3BlcnR5KCctLWF2YWlsYWJsZS13aWR0aCcsIGAke2F2YWlsYWJsZVdpZHRofXB4YCk7XG4gICAgICBmbG9hdGluZ1N0eWxlLnNldFByb3BlcnR5KCctLWF2YWlsYWJsZS1oZWlnaHQnLCBgJHthdmFpbGFibGVIZWlnaHR9cHhgKTtcblxuICAgICAgLy8gU25hcCBhbmNob3IgZGltZW5zaW9ucyB0byBkZXZpY2UgcGl4ZWxzIHRvIGVuc3VyZSB0aGUgcG9wdXAncyB2aXN1YWwgd2lkdGggbWF0Y2hlcyB0aGUgYW5jaG9yJ3Mgb25lLlxuICAgICAgY29uc3QgZHByID0gb3duZXJXaW5kb3coZmxvYXRpbmcpLmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgeCxcbiAgICAgICAgeSxcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodFxuICAgICAgfSA9IHJlY3RzLnJlZmVyZW5jZTtcbiAgICAgIGNvbnN0IGFuY2hvcldpZHRoID0gKE1hdGgucm91bmQoKHggKyB3aWR0aCkgKiBkcHIpIC0gTWF0aC5yb3VuZCh4ICogZHByKSkgLyBkcHI7XG4gICAgICBjb25zdCBhbmNob3JIZWlnaHQgPSAoTWF0aC5yb3VuZCgoeSArIGhlaWdodCkgKiBkcHIpIC0gTWF0aC5yb3VuZCh5ICogZHByKSkgLyBkcHI7XG4gICAgICBmbG9hdGluZ1N0eWxlLnNldFByb3BlcnR5KCctLWFuY2hvci13aWR0aCcsIGAke2FuY2hvcldpZHRofXB4YCk7XG4gICAgICBmbG9hdGluZ1N0eWxlLnNldFByb3BlcnR5KCctLWFuY2hvci1oZWlnaHQnLCBgJHthbmNob3JIZWlnaHR9cHhgKTtcbiAgICB9XG4gIH0pLCBhcnJvdyhzdGF0ZSA9PiAoe1xuICAgIC8vIGB0cmFuc2Zvcm0tb3JpZ2luYCBjYWxjdWxhdGlvbnMgcmVseSBvbiBhbiBlbGVtZW50IGV4aXN0aW5nLiBJZiB0aGUgYXJyb3cgaGFzbid0IGJlZW4gc2V0LFxuICAgIC8vIHdlJ2xsIGNyZWF0ZSBhIGZha2UgZWxlbWVudC5cbiAgICBlbGVtZW50OiBhcnJvd1JlZi5jdXJyZW50IHx8IG93bmVyRG9jdW1lbnQoc3RhdGUuZWxlbWVudHMuZmxvYXRpbmcpLmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgIHBhZGRpbmc6IGFycm93UGFkZGluZyxcbiAgICBvZmZzZXRQYXJlbnQ6ICdmbG9hdGluZydcbiAgfSksIFthcnJvd1BhZGRpbmddKSwge1xuICAgIG5hbWU6ICd0cmFuc2Zvcm1PcmlnaW4nLFxuICAgIGZuKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGVsZW1lbnRzLFxuICAgICAgICBtaWRkbGV3YXJlRGF0YSxcbiAgICAgICAgcGxhY2VtZW50OiByZW5kZXJlZFBsYWNlbWVudCxcbiAgICAgICAgcmVjdHMsXG4gICAgICAgIHlcbiAgICAgIH0gPSBzdGF0ZTtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZW5kZXJlZFNpZGUgPSBnZXRTaWRlKHJlbmRlcmVkUGxhY2VtZW50KTtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZW5kZXJlZEF4aXMgPSBnZXRTaWRlQXhpcyhjdXJyZW50UmVuZGVyZWRTaWRlKTtcbiAgICAgIGNvbnN0IGFycm93RWwgPSBhcnJvd1JlZi5jdXJyZW50O1xuICAgICAgY29uc3QgYXJyb3dYID0gbWlkZGxld2FyZURhdGEuYXJyb3c/LnggfHwgMDtcbiAgICAgIGNvbnN0IGFycm93WSA9IG1pZGRsZXdhcmVEYXRhLmFycm93Py55IHx8IDA7XG4gICAgICBjb25zdCBhcnJvd1dpZHRoID0gYXJyb3dFbD8uY2xpZW50V2lkdGggfHwgMDtcbiAgICAgIGNvbnN0IGFycm93SGVpZ2h0ID0gYXJyb3dFbD8uY2xpZW50SGVpZ2h0IHx8IDA7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1YID0gYXJyb3dYICsgYXJyb3dXaWR0aCAvIDI7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1ZID0gYXJyb3dZICsgYXJyb3dIZWlnaHQgLyAyO1xuICAgICAgY29uc3Qgc2hpZnRZID0gTWF0aC5hYnMobWlkZGxld2FyZURhdGEuc2hpZnQ/LnkgfHwgMCk7XG4gICAgICBjb25zdCBoYWxmQW5jaG9ySGVpZ2h0ID0gcmVjdHMucmVmZXJlbmNlLmhlaWdodCAvIDI7XG4gICAgICBjb25zdCBzaWRlT2Zmc2V0VmFsdWUgPSB0eXBlb2Ygc2lkZU9mZnNldCA9PT0gJ2Z1bmN0aW9uJyA/IHNpZGVPZmZzZXQoZ2V0T2Zmc2V0RGF0YShzdGF0ZSwgc2lkZVBhcmFtLCBpc1J0bCkpIDogc2lkZU9mZnNldDtcbiAgICAgIGNvbnN0IGlzT3ZlcmxhcHBpbmdBbmNob3IgPSBzaGlmdFkgPiBzaWRlT2Zmc2V0VmFsdWU7XG4gICAgICBjb25zdCBhZGphY2VudFRyYW5zZm9ybU9yaWdpbiA9IHtcbiAgICAgICAgdG9wOiBgJHt0cmFuc2Zvcm1YfXB4IGNhbGMoMTAwJSArICR7c2lkZU9mZnNldFZhbHVlfXB4KWAsXG4gICAgICAgIGJvdHRvbTogYCR7dHJhbnNmb3JtWH1weCAkey1zaWRlT2Zmc2V0VmFsdWV9cHhgLFxuICAgICAgICBsZWZ0OiBgY2FsYygxMDAlICsgJHtzaWRlT2Zmc2V0VmFsdWV9cHgpICR7dHJhbnNmb3JtWX1weGAsXG4gICAgICAgIHJpZ2h0OiBgJHstc2lkZU9mZnNldFZhbHVlfXB4ICR7dHJhbnNmb3JtWX1weGBcbiAgICAgIH1bY3VycmVudFJlbmRlcmVkU2lkZV07XG4gICAgICBjb25zdCBvdmVybGFwVHJhbnNmb3JtT3JpZ2luID0gYCR7dHJhbnNmb3JtWH1weCAke3JlY3RzLnJlZmVyZW5jZS55ICsgaGFsZkFuY2hvckhlaWdodCAtIHl9cHhgO1xuICAgICAgZWxlbWVudHMuZmxvYXRpbmcuc3R5bGUuc2V0UHJvcGVydHkoJy0tdHJhbnNmb3JtLW9yaWdpbicsIGNyb3NzQXhpc1NoaWZ0RW5hYmxlZCAmJiBjdXJyZW50UmVuZGVyZWRBeGlzID09PSAneScgJiYgaXNPdmVybGFwcGluZ0FuY2hvciA/IG92ZXJsYXBUcmFuc2Zvcm1PcmlnaW4gOiBhZGphY2VudFRyYW5zZm9ybU9yaWdpbik7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9LCBoaWRlLCBhZGFwdGl2ZU9yaWdpbik7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgLy8gRW5zdXJlIHBvc2l0aW9uaW5nIGRvZXNuJ3QgcnVuIGluaXRpYWxseSBmb3IgYGtlZXBNb3VudGVkYCBlbGVtZW50cyB0aGF0XG4gICAgLy8gYXJlbid0IGluaXRpYWxseSBvcGVuLlxuICAgIGlmICghbW91bnRlZCAmJiBmbG9hdGluZ1Jvb3RDb250ZXh0KSB7XG4gICAgICBmbG9hdGluZ1Jvb3RDb250ZXh0LnVwZGF0ZSh7XG4gICAgICAgIHJlZmVyZW5jZUVsZW1lbnQ6IG51bGwsXG4gICAgICAgIGZsb2F0aW5nRWxlbWVudDogbnVsbCxcbiAgICAgICAgZG9tUmVmZXJlbmNlRWxlbWVudDogbnVsbCxcbiAgICAgICAgcG9zaXRpb25SZWZlcmVuY2U6IG51bGxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW21vdW50ZWQsIGZsb2F0aW5nUm9vdENvbnRleHRdKTtcbiAgY29uc3QgYXV0b1VwZGF0ZU9wdGlvbnMgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgZWxlbWVudFJlc2l6ZTogIWRpc2FibGVBbmNob3JUcmFja2luZyAmJiB0eXBlb2YgUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnLFxuICAgIGxheW91dFNoaWZ0OiAhZGlzYWJsZUFuY2hvclRyYWNraW5nICYmIHR5cGVvZiBJbnRlcnNlY3Rpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCdcbiAgfSksIFtkaXNhYmxlQW5jaG9yVHJhY2tpbmddKTtcbiAgY29uc3Qge1xuICAgIHJlZnMsXG4gICAgZWxlbWVudHMsXG4gICAgeCxcbiAgICB5LFxuICAgIG1pZGRsZXdhcmVEYXRhLFxuICAgIHVwZGF0ZSxcbiAgICBwbGFjZW1lbnQ6IHJlbmRlcmVkUGxhY2VtZW50LFxuICAgIGNvbnRleHQsXG4gICAgaXNQb3NpdGlvbmVkLFxuICAgIGZsb2F0aW5nU3R5bGVzOiBvcmlnaW5hbEZsb2F0aW5nU3R5bGVzXG4gIH0gPSB1c2VGbG9hdGluZyh7XG4gICAgcm9vdENvbnRleHQ6IGZsb2F0aW5nUm9vdENvbnRleHQsXG4gICAgb3Blbjoga2VlcE1vdW50ZWQgPyBtb3VudGVkIDogdW5kZWZpbmVkLFxuICAgIHBsYWNlbWVudCxcbiAgICBtaWRkbGV3YXJlLFxuICAgIHN0cmF0ZWd5OiBwb3NpdGlvbk1ldGhvZCxcbiAgICB3aGlsZUVsZW1lbnRzTW91bnRlZDoga2VlcE1vdW50ZWQgPyB1bmRlZmluZWQgOiAoLi4uYXJncykgPT4gYXV0b1VwZGF0ZSguLi5hcmdzLCBhdXRvVXBkYXRlT3B0aW9ucyksXG4gICAgbm9kZUlkLFxuICAgIGV4dGVybmFsVHJlZVxuICB9KTtcbiAgY29uc3Qge1xuICAgIHNpZGVYLFxuICAgIHNpZGVZXG4gIH0gPSBtaWRkbGV3YXJlRGF0YS5hZGFwdGl2ZU9yaWdpbiB8fCBERUZBVUxUX1NJREVTO1xuXG4gIC8vIERlZmF1bHQgdG8gYGZpeGVkYCB3aGVuIG5vdCBwb3NpdGlvbmVkIHRvIHByZXZlbnQgYGF1dG9Gb2N1c2Agc2Nyb2xsIGp1bXBzLlxuICAvLyBUaGlzIGVuc3VyZXMgdGhlIHBvcHVwIGlzIGluc2lkZSB0aGUgdmlld3BvcnQgaW5pdGlhbGx5IGJlZm9yZSBpdCBnZXRzIHBvc2l0aW9uZWQuXG4gIGNvbnN0IHJlc29sdmVkUG9zaXRpb24gPSBpc1Bvc2l0aW9uZWQgPyBwb3NpdGlvbk1ldGhvZCA6ICdmaXhlZCc7XG4gIGNvbnN0IGZsb2F0aW5nU3R5bGVzID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgYmFzZSA9IGFkYXB0aXZlT3JpZ2luID8ge1xuICAgICAgcG9zaXRpb246IHJlc29sdmVkUG9zaXRpb24sXG4gICAgICBbc2lkZVhdOiB4LFxuICAgICAgW3NpZGVZXTogeVxuICAgIH0gOiB7XG4gICAgICBwb3NpdGlvbjogcmVzb2x2ZWRQb3NpdGlvbixcbiAgICAgIC4uLm9yaWdpbmFsRmxvYXRpbmdTdHlsZXNcbiAgICB9O1xuICAgIGlmICghaXNQb3NpdGlvbmVkKSB7XG4gICAgICBiYXNlLm9wYWNpdHkgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZTtcbiAgfSwgW2FkYXB0aXZlT3JpZ2luLCByZXNvbHZlZFBvc2l0aW9uLCBzaWRlWCwgeCwgc2lkZVksIHksIG9yaWdpbmFsRmxvYXRpbmdTdHlsZXMsIGlzUG9zaXRpb25lZF0pO1xuICBjb25zdCByZWdpc3RlcmVkUG9zaXRpb25SZWZlcmVuY2VSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIHVzZUlzb0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFtb3VudGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGFuY2hvclZhbHVlID0gYW5jaG9yVmFsdWVSZWYuY3VycmVudDtcbiAgICBjb25zdCByZXNvbHZlZEFuY2hvciA9IHR5cGVvZiBhbmNob3JWYWx1ZSA9PT0gJ2Z1bmN0aW9uJyA/IGFuY2hvclZhbHVlKCkgOiBhbmNob3JWYWx1ZTtcbiAgICBjb25zdCB1bndyYXBwZWRFbGVtZW50ID0gKGlzUmVmKHJlc29sdmVkQW5jaG9yKSA/IHJlc29sdmVkQW5jaG9yLmN1cnJlbnQgOiByZXNvbHZlZEFuY2hvcikgfHwgbnVsbDtcbiAgICBjb25zdCBmaW5hbEFuY2hvciA9IHVud3JhcHBlZEVsZW1lbnQgfHwgbnVsbDtcbiAgICBpZiAoZmluYWxBbmNob3IgIT09IHJlZ2lzdGVyZWRQb3NpdGlvblJlZmVyZW5jZVJlZi5jdXJyZW50KSB7XG4gICAgICByZWZzLnNldFBvc2l0aW9uUmVmZXJlbmNlKGZpbmFsQW5jaG9yKTtcbiAgICAgIHJlZ2lzdGVyZWRQb3NpdGlvblJlZmVyZW5jZVJlZi5jdXJyZW50ID0gZmluYWxBbmNob3I7XG4gICAgfVxuICB9LCBbbW91bnRlZCwgcmVmcywgYW5jaG9yRGVwLCBhbmNob3JWYWx1ZVJlZl0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghbW91bnRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBhbmNob3JWYWx1ZSA9IGFuY2hvclZhbHVlUmVmLmN1cnJlbnQ7XG5cbiAgICAvLyBSZWZzIGZyb20gcGFyZW50IGNvbXBvbmVudHMgYXJlIHNldCBhZnRlciB1c2VMYXlvdXRFZmZlY3QgcnVucyBhbmQgYXJlIGF2YWlsYWJsZSBpbiB1c2VFZmZlY3QuXG4gICAgLy8gVGhlcmVmb3JlLCBpZiB0aGUgYW5jaG9yIGlzIGEgcmVmLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgcG9zaXRpb24gcmVmZXJlbmNlIGluIHVzZUVmZmVjdC5cbiAgICBpZiAodHlwZW9mIGFuY2hvclZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChpc1JlZihhbmNob3JWYWx1ZSkgJiYgYW5jaG9yVmFsdWUuY3VycmVudCAhPT0gcmVnaXN0ZXJlZFBvc2l0aW9uUmVmZXJlbmNlUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJlZnMuc2V0UG9zaXRpb25SZWZlcmVuY2UoYW5jaG9yVmFsdWUuY3VycmVudCk7XG4gICAgICByZWdpc3RlcmVkUG9zaXRpb25SZWZlcmVuY2VSZWYuY3VycmVudCA9IGFuY2hvclZhbHVlLmN1cnJlbnQ7XG4gICAgfVxuICB9LCBbbW91bnRlZCwgcmVmcywgYW5jaG9yRGVwLCBhbmNob3JWYWx1ZVJlZl0pO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChrZWVwTW91bnRlZCAmJiBtb3VudGVkICYmIGVsZW1lbnRzLmRvbVJlZmVyZW5jZSAmJiBlbGVtZW50cy5mbG9hdGluZykge1xuICAgICAgcmV0dXJuIGF1dG9VcGRhdGUoZWxlbWVudHMuZG9tUmVmZXJlbmNlLCBlbGVtZW50cy5mbG9hdGluZywgdXBkYXRlLCBhdXRvVXBkYXRlT3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0sIFtrZWVwTW91bnRlZCwgbW91bnRlZCwgZWxlbWVudHMsIHVwZGF0ZSwgYXV0b1VwZGF0ZU9wdGlvbnNdKTtcbiAgY29uc3QgcmVuZGVyZWRTaWRlID0gZ2V0U2lkZShyZW5kZXJlZFBsYWNlbWVudCk7XG4gIGNvbnN0IGxvZ2ljYWxSZW5kZXJlZFNpZGUgPSBnZXRMb2dpY2FsU2lkZShzaWRlUGFyYW0sIHJlbmRlcmVkU2lkZSwgaXNSdGwpO1xuICBjb25zdCByZW5kZXJlZEFsaWduID0gZ2V0QWxpZ25tZW50KHJlbmRlcmVkUGxhY2VtZW50KSB8fCAnY2VudGVyJztcbiAgY29uc3QgYW5jaG9ySGlkZGVuID0gQm9vbGVhbihtaWRkbGV3YXJlRGF0YS5oaWRlPy5yZWZlcmVuY2VIaWRkZW4pO1xuXG4gIC8vIExvY2tzIHRoZSBmbGlwIChtYWtlcyBpdCBcInN0aWNreVwiKSBzbyBpdCBkb2Vzbid0IHByZWZlciBhIGdpdmVuIHBsYWNlbWVudFxuICAvLyBhbmQgZmxpcHMgYmFjayBsYXppbHksIG5vdCBlYWdlcmx5LiBJZGVhbCBmb3IgZmlsdGVyZWQgbGlzdHMgdGhhdCBjaGFuZ2VcbiAgLy8gdGhlIHNpemUgb2YgdGhlIHBvcHVwIGR5bmFtaWNhbGx5IHRvIGF2b2lkIHVud2FudGVkIGZsaXBwaW5nIHdoZW4gdHlwaW5nLlxuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChsYXp5RmxpcCAmJiBtb3VudGVkICYmIGlzUG9zaXRpb25lZCkge1xuICAgICAgc2V0TW91bnRTaWRlKHJlbmRlcmVkU2lkZSk7XG4gICAgfVxuICB9LCBbbGF6eUZsaXAsIG1vdW50ZWQsIGlzUG9zaXRpb25lZCwgcmVuZGVyZWRTaWRlXSk7XG4gIGNvbnN0IGFycm93U3R5bGVzID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHRvcDogbWlkZGxld2FyZURhdGEuYXJyb3c/LnksXG4gICAgbGVmdDogbWlkZGxld2FyZURhdGEuYXJyb3c/LnhcbiAgfSksIFttaWRkbGV3YXJlRGF0YS5hcnJvd10pO1xuICBjb25zdCBhcnJvd1VuY2VudGVyZWQgPSBtaWRkbGV3YXJlRGF0YS5hcnJvdz8uY2VudGVyT2Zmc2V0ICE9PSAwO1xuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgIHBvc2l0aW9uZXJTdHlsZXM6IGZsb2F0aW5nU3R5bGVzLFxuICAgIGFycm93U3R5bGVzLFxuICAgIGFycm93UmVmLFxuICAgIGFycm93VW5jZW50ZXJlZCxcbiAgICBzaWRlOiBsb2dpY2FsUmVuZGVyZWRTaWRlLFxuICAgIGFsaWduOiByZW5kZXJlZEFsaWduLFxuICAgIHBoeXNpY2FsU2lkZTogcmVuZGVyZWRTaWRlLFxuICAgIGFuY2hvckhpZGRlbixcbiAgICByZWZzLFxuICAgIGNvbnRleHQsXG4gICAgaXNQb3NpdGlvbmVkLFxuICAgIHVwZGF0ZVxuICB9KSwgW2Zsb2F0aW5nU3R5bGVzLCBhcnJvd1N0eWxlcywgYXJyb3dSZWYsIGFycm93VW5jZW50ZXJlZCwgbG9naWNhbFJlbmRlcmVkU2lkZSwgcmVuZGVyZWRBbGlnbiwgcmVuZGVyZWRTaWRlLCBhbmNob3JIaWRkZW4sIHJlZnMsIGNvbnRleHQsIGlzUG9zaXRpb25lZCwgdXBkYXRlXSk7XG59XG5mdW5jdGlvbiBpc1JlZihwYXJhbSkge1xuICByZXR1cm4gcGFyYW0gIT0gbnVsbCAmJiAnY3VycmVudCcgaW4gcGFyYW07XG59IiwiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyBwb3B1cFN0YXRlTWFwcGluZyB9IGZyb20gXCIuL3BvcHVwU3RhdGVNYXBwaW5nLmpzXCI7XG5pbXBvcnQgeyB1c2VSZW5kZXJFbGVtZW50IH0gZnJvbSBcIi4uL2ludGVybmFscy91c2VSZW5kZXJFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBnZXREaXNhYmxlZE1vdW50VHJhbnNpdGlvblN0eWxlcyB9IGZyb20gXCIuL2dldERpc2FibGVkTW91bnRUcmFuc2l0aW9uU3R5bGVzLmpzXCI7XG4vKipcbiAqIFJlbmRlcnMgdGhlIHNoYXJlZCBvdXRlciBQb3NpdGlvbmVyIGVsZW1lbnQgdXNlZCBieSBwb3B1cCBjb21wb25lbnRzLlxuICogQXBwbGllcyB0aGUgY29tbW9uIHJvbGUsIGhpZGRlbiBzdGF0ZSwgdHJhbnNpdGlvbiBzdHlsZXMsIHN0YXRlIGF0dHJpYnV0ZXMsIGFuZCBvcHRpb25hbCBpbmVydCBzdHlsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUG9zaXRpb25lcihjb21wb25lbnRQcm9wcywgc3RhdGUsIHtcbiAgc3R5bGVzLFxuICB0cmFuc2l0aW9uU3RhdHVzLFxuICBwcm9wcyxcbiAgcmVmcyxcbiAgaGlkZGVuLFxuICBpbmVydCA9IGZhbHNlXG59KSB7XG4gIGNvbnN0IHN0eWxlID0ge1xuICAgIC4uLnN0eWxlc1xuICB9O1xuICBpZiAoaW5lcnQpIHtcbiAgICBzdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICB9XG4gIHJldHVybiB1c2VSZW5kZXJFbGVtZW50KCdkaXYnLCBjb21wb25lbnRQcm9wcywge1xuICAgIHN0YXRlLFxuICAgIHJlZjogcmVmcyxcbiAgICBwcm9wczogW3tcbiAgICAgIHJvbGU6ICdwcmVzZW50YXRpb24nLFxuICAgICAgaGlkZGVuLFxuICAgICAgc3R5bGVcbiAgICB9LCBnZXREaXNhYmxlZE1vdW50VHJhbnNpdGlvblN0eWxlcyh0cmFuc2l0aW9uU3RhdHVzKSwgcHJvcHNdLFxuICAgIHN0YXRlQXR0cmlidXRlc01hcHBpbmc6IHBvcHVwU3RhdGVNYXBwaW5nXG4gIH0pO1xufSIsIid1c2UgY2xpZW50JztcblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgb3duZXJEb2N1bWVudCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL293bmVyJztcbmltcG9ydCB7IHVzZVNjcm9sbExvY2sgfSBmcm9tICdAYmFzZS11aS91dGlscy91c2VTY3JvbGxMb2NrJztcbmltcG9ydCB7IHVzZUlzb0xheW91dEVmZmVjdCB9IGZyb20gJ0BiYXNlLXVpL3V0aWxzL3VzZUlzb0xheW91dEVmZmVjdCc7XG5cbi8vIFRvdWNoLW9wZW5lZCBwb3B1cHMgbm9ybWFsbHkgYXZvaWQgc2Nyb2xsIGxvY2tpbmcgc28gdXNlcnMgY2FuIHN0aWxsIHN3aXBlIG91dHNpZGUgdG8gZGlzbWlzcy5cbi8vIFRoaXMgaG9vayByZS1lbmFibGVzIHNjcm9sbCBsb2NrIG9ubHkgd2hlbiB0aGUgcG9wdXAgaXMgZWZmZWN0aXZlbHkgZnVsbC13aWR0aC5cbi8vIFRyZWF0IHBvcHVwcyB3aXRoIHVwIHRvIDIwcHggb2YgdG90YWwgaG9yaXpvbnRhbCBndXR0ZXIgYXMgZnVsbC13aWR0aCBzbyBjb21tb24gfjEwcHggc2lkZVxuLy8gcGFkZGluZyBzdGlsbCBsb2NrcyBzY3JvbGwsIHNpbmNlIHRoYXQgbGVhdmVzIHRvbyBsaXR0bGUgb3V0c2lkZSBzcGFjZSBmb3IgYSByZWxpYWJsZSBzd2lwZS5cbmNvbnN0IFZJRVdQT1JUX1dJRFRIX1RPTEVSQU5DRV9QWCA9IDIwO1xuXG4vKipcbiAqIE1hbmFnZXMgc2Nyb2xsIGxvY2sgZm9yIGFuY2hvcmVkIHBvcHVwcy4gRm9yIG5vbi10b3VjaCBvcGVucywgc2Nyb2xsIGxvY2sgaXMgYXBwbGllZCB3aGVuXG4gKiBlbmFibGVkLiBGb3IgdG91Y2ggb3BlbnMsIHNjcm9sbCBsb2NrIGlzIGFwcGxpZWQgb25seSB3aGVuIHRoZSBwb3NpdGlvbmVyIHdpZHRoIGlzIGVmZmVjdGl2ZWx5XG4gKiB2aWV3cG9ydC1zaXplZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUFuY2hvcmVkUG9wdXBTY3JvbGxMb2NrKGVuYWJsZWQsIHRvdWNoT3BlbiwgcG9zaXRpb25lckVsZW1lbnQsIHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgY29uc3QgW3RvdWNoT3BlblNob3VsZExvY2tTY3JvbGwsIHNldFRvdWNoT3BlblNob3VsZExvY2tTY3JvbGxdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICB1c2VJc29MYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCB8fCAhdG91Y2hPcGVuIHx8IHBvc2l0aW9uZXJFbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHNldFRvdWNoT3BlblNob3VsZExvY2tTY3JvbGwoZmFsc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2aWV3cG9ydFdpZHRoID0gb3duZXJEb2N1bWVudChwb3NpdGlvbmVyRWxlbWVudCkuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IHBvcHVwV2lkdGggPSBwb3NpdGlvbmVyRWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICBzZXRUb3VjaE9wZW5TaG91bGRMb2NrU2Nyb2xsKHZpZXdwb3J0V2lkdGggPiAwICYmIHBvcHVwV2lkdGggPiAwICYmIHBvcHVwV2lkdGggPj0gdmlld3BvcnRXaWR0aCAtIFZJRVdQT1JUX1dJRFRIX1RPTEVSQU5DRV9QWCk7XG4gIH0sIFtlbmFibGVkLCB0b3VjaE9wZW4sIHBvc2l0aW9uZXJFbGVtZW50XSk7XG4gIHVzZVNjcm9sbExvY2soZW5hYmxlZCAmJiAoIXRvdWNoT3BlbiB8fCB0b3VjaE9wZW5TaG91bGRMb2NrU2Nyb2xsKSwgcmVmZXJlbmNlRWxlbWVudCk7XG59IiwiaW1wb3J0IHsgb3duZXJXaW5kb3cgfSBmcm9tICdAYmFzZS11aS91dGlscy9vd25lcic7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UHNldWRvRWxlbWVudEJvdW5kcyhlbGVtZW50KSB7XG4gIGNvbnN0IGVsZW1lbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBBdm9pZCBcIk5vdCBpbXBsZW1lbnRlZDogd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWx0LCBwc2V1ZG9FbHQpXCJcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICByZXR1cm4gZWxlbWVudFJlY3Q7XG4gIH1cbiAgY29uc3Qgd2luID0gb3duZXJXaW5kb3coZWxlbWVudCk7XG4gIGNvbnN0IGJlZm9yZVN0eWxlcyA9IHdpbi5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsICc6OmJlZm9yZScpO1xuICBjb25zdCBhZnRlclN0eWxlcyA9IHdpbi5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsICc6OmFmdGVyJyk7XG4gIGNvbnN0IGhhc1BzZXVkb0VsZW1lbnRzID0gYmVmb3JlU3R5bGVzLmNvbnRlbnQgIT09ICdub25lJyB8fCBhZnRlclN0eWxlcy5jb250ZW50ICE9PSAnbm9uZSc7XG4gIGlmICghaGFzUHNldWRvRWxlbWVudHMpIHtcbiAgICByZXR1cm4gZWxlbWVudFJlY3Q7XG4gIH1cblxuICAvLyBHZXQgZGltZW5zaW9ucyBvZiBwc2V1ZG8tZWxlbWVudHNcbiAgY29uc3QgYmVmb3JlV2lkdGggPSBwYXJzZUZsb2F0KGJlZm9yZVN0eWxlcy53aWR0aCkgfHwgMDtcbiAgY29uc3QgYmVmb3JlSGVpZ2h0ID0gcGFyc2VGbG9hdChiZWZvcmVTdHlsZXMuaGVpZ2h0KSB8fCAwO1xuICBjb25zdCBhZnRlcldpZHRoID0gcGFyc2VGbG9hdChhZnRlclN0eWxlcy53aWR0aCkgfHwgMDtcbiAgY29uc3QgYWZ0ZXJIZWlnaHQgPSBwYXJzZUZsb2F0KGFmdGVyU3R5bGVzLmhlaWdodCkgfHwgMDtcblxuICAvLyBDYWxjdWxhdGUgbWF4IGRpbWVuc2lvbnMgaW5jbHVkaW5nIHBzZXVkby1lbGVtZW50c1xuICBjb25zdCB0b3RhbFdpZHRoID0gTWF0aC5tYXgoZWxlbWVudFJlY3Qud2lkdGgsIGJlZm9yZVdpZHRoLCBhZnRlcldpZHRoKTtcbiAgY29uc3QgdG90YWxIZWlnaHQgPSBNYXRoLm1heChlbGVtZW50UmVjdC5oZWlnaHQsIGJlZm9yZUhlaWdodCwgYWZ0ZXJIZWlnaHQpO1xuXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGlmZmVyZW5jZXMgdG8gZXh0ZW5kIHRoZSBib3VuZHNcbiAgY29uc3Qgd2lkdGhEaWZmID0gdG90YWxXaWR0aCAtIGVsZW1lbnRSZWN0LndpZHRoO1xuICBjb25zdCBoZWlnaHREaWZmID0gdG90YWxIZWlnaHQgLSBlbGVtZW50UmVjdC5oZWlnaHQ7XG4gIHJldHVybiB7XG4gICAgbGVmdDogZWxlbWVudFJlY3QubGVmdCAtIHdpZHRoRGlmZiAvIDIsXG4gICAgcmlnaHQ6IGVsZW1lbnRSZWN0LnJpZ2h0ICsgd2lkdGhEaWZmIC8gMixcbiAgICB0b3A6IGVsZW1lbnRSZWN0LnRvcCAtIGhlaWdodERpZmYgLyAyLFxuICAgIGJvdHRvbTogZWxlbWVudFJlY3QuYm90dG9tICsgaGVpZ2h0RGlmZiAvIDJcbiAgfTtcbn0iLCIndXNlIGNsaWVudCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJldmlvdXMgdmFsdWUgb2YgaXRzIGFyZ3VtZW50LlxuICogQHBhcmFtIHZhbHVlIEN1cnJlbnQgdmFsdWUuXG4gKiBAcmV0dXJucyBQcmV2aW91cyB2YWx1ZSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyBwcmV2aW91cyB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVByZXZpb3VzVmFsdWUodmFsdWUpIHtcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSh7XG4gICAgY3VycmVudDogdmFsdWUsXG4gICAgcHJldmlvdXM6IG51bGxcbiAgfSk7XG4gIGlmICh2YWx1ZSAhPT0gc3RhdGUuY3VycmVudCkge1xuICAgIHNldFN0YXRlKHtcbiAgICAgIGN1cnJlbnQ6IHZhbHVlLFxuICAgICAgcHJldmlvdXM6IHN0YXRlLmN1cnJlbnRcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gc3RhdGUucHJldmlvdXM7XG59Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFHQSxTQUFTLDJCQUEyQixNQUFNLFdBQVcsS0FBSztDQUN4RCxJQUFJLEVBQ0YsV0FDQSxhQUNFO0NBQ0osTUFBTSxXQUFXLFlBQVksU0FBUztDQUN0QyxNQUFNLGdCQUFnQixpQkFBaUIsU0FBUztDQUNoRCxNQUFNLGNBQWMsY0FBYyxhQUFhO0NBQy9DLE1BQU0sT0FBTyxRQUFRLFNBQVM7Q0FDOUIsTUFBTSxhQUFhLGFBQWE7Q0FDaEMsTUFBTSxVQUFVLFVBQVUsSUFBSSxVQUFVLFFBQVEsSUFBSSxTQUFTLFFBQVE7Q0FDckUsTUFBTSxVQUFVLFVBQVUsSUFBSSxVQUFVLFNBQVMsSUFBSSxTQUFTLFNBQVM7Q0FDdkUsTUFBTSxjQUFjLFVBQVUsZUFBZSxJQUFJLFNBQVMsZUFBZTtDQUN6RSxJQUFJO0NBQ0osUUFBUSxNQUFSO0VBQ0UsS0FBSztHQUNILFNBQVM7SUFDUCxHQUFHO0lBQ0gsR0FBRyxVQUFVLElBQUksU0FBUztHQUM1QjtHQUNBO0VBQ0YsS0FBSztHQUNILFNBQVM7SUFDUCxHQUFHO0lBQ0gsR0FBRyxVQUFVLElBQUksVUFBVTtHQUM3QjtHQUNBO0VBQ0YsS0FBSztHQUNILFNBQVM7SUFDUCxHQUFHLFVBQVUsSUFBSSxVQUFVO0lBQzNCLEdBQUc7R0FDTDtHQUNBO0VBQ0YsS0FBSztHQUNILFNBQVM7SUFDUCxHQUFHLFVBQVUsSUFBSSxTQUFTO0lBQzFCLEdBQUc7R0FDTDtHQUNBO0VBQ0YsU0FDRSxT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QkFBd0I7Q0FDMUIsQ0FBQztBQUNIOzs7QUN0QkEsSUFBTSw4QkFBOEI7Ozs7OztBQU9wQyxTQUFnQiwyQkFBMkIsU0FBUyxXQUFXLG1CQUFtQixrQkFBa0I7Q0FDbEcsTUFBTSxDQUFDLDJCQUEyQixnQ0FBQSxhQUFzQyxTQUFTLEtBQUs7Q0FDdEYseUJBQXlCO0VBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxxQkFBcUIsTUFBTTtHQUN2RCw2QkFBNkIsS0FBSztHQUNsQztFQUNGO0VBQ0EsTUFBTSxnQkFBZ0IsY0FBYyxpQkFBaUIsQ0FBQyxDQUFDLGdCQUFnQjtFQUN2RSxNQUFNLGFBQWEsa0JBQWtCO0VBQ3JDLDZCQUE2QixnQkFBZ0IsS0FBSyxhQUFhLEtBQUssY0FBYyxnQkFBZ0IsMkJBQTJCO0NBQy9ILEdBQUc7RUFBQztFQUFTO0VBQVc7Q0FBaUIsQ0FBQztDQUMxQyxjQUFjLFlBQVksQ0FBQyxhQUFhLDRCQUE0QixnQkFBZ0I7QUFDdEY7OztBQzdCQSxTQUFnQix1QkFBdUIsU0FBUztDQUs1QyxPQUprQixRQUFRLHNCQUlUO0FBNkJyQjs7Ozs7Ozs7QUMxQkEsU0FBZ0IsaUJBQWlCLE9BQU87Q0FDdEMsTUFBTSxDQUFDLE9BQU8sWUFBQSxhQUFrQixTQUFTO0VBQ3ZDLFNBQVM7RUFDVCxVQUFVO0NBQ1osQ0FBQztDQUNELElBQUksVUFBVSxNQUFNLFNBQ2xCLFNBQVM7RUFDUCxTQUFTO0VBQ1QsVUFBVSxNQUFNO0NBQ2xCLENBQUM7Q0FFSCxPQUFPLE1BQU07QUFDZiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2XX0=