import { i as __toESM, t as __commonJSMin } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_shim } from "/node_modules/.vite/deps/shim-Jf0PCdQ_.js?v=1d2f6f90";
import { keyFromSelector as keysFromSelector } from "/node_modules/.vite/deps/i18next.js?v=1d2f6f90";
//#region node_modules/void-elements/index.js
var require_void_elements = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This file automatically generated from `pre-publish.js`.
	* Do not manually edit.
	*/
	module.exports = {
		"area": true,
		"base": true,
		"br": true,
		"col": true,
		"embed": true,
		"hr": true,
		"img": true,
		"input": true,
		"link": true,
		"meta": true,
		"param": true,
		"source": true,
		"track": true,
		"wbr": true
	};
}));
//#endregion
//#region node_modules/html-parse-stringify/dist/html-parse-stringify.module.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_void_elements = /* @__PURE__ */ __toESM(require_void_elements());
var t = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
function n(n) {
	var r = {
		type: "tag",
		name: "",
		voidElement: !1,
		attrs: {},
		children: []
	}, i = n.match(/<\/?([^\s]+?)[/\s>]/);
	if (i && (r.name = i[1], (import_void_elements.default[i[1]] || "/" === n.charAt(n.length - 2)) && (r.voidElement = !0), r.name.startsWith("!--"))) {
		var s = n.indexOf("-->");
		return {
			type: "comment",
			comment: -1 !== s ? n.slice(4, s) : ""
		};
	}
	for (var a = new RegExp(t), c = null; null !== (c = a.exec(n));) if (c[0].trim()) if (c[1]) {
		var o = c[1].trim(), l = [o, ""];
		o.indexOf("=") > -1 && (l = o.split("=")), r.attrs[l[0]] = l[1], a.lastIndex--;
	} else c[2] && (r.attrs[c[2]] = c[3].trim().substring(1, c[3].length - 1));
	return r;
}
var r = /<[a-zA-Z0-9\-\!\/](?:"[^"]*"|'[^']*'|[^'">])*>/g;
var i = /^\s*$/;
var s = Object.create(null);
function a(e, t) {
	switch (t.type) {
		case "text": return e + t.content;
		case "tag": return e += "<" + t.name + (t.attrs ? function(e) {
			var t = [];
			for (var n in e) t.push(n + "=\"" + e[n] + "\"");
			return t.length ? " " + t.join(" ") : "";
		}(t.attrs) : "") + (t.voidElement ? "/>" : ">"), t.voidElement ? e : e + t.children.reduce(a, "") + "</" + t.name + ">";
		case "comment": return e + "<!--" + t.comment + "-->";
	}
}
var c = {
	parse: function(e, t) {
		t || (t = {}), t.components || (t.components = s);
		var a, c = [], o = [], l = -1, m = !1;
		if (0 !== e.indexOf("<")) {
			var u = e.indexOf("<");
			c.push({
				type: "text",
				content: -1 === u ? e : e.substring(0, u)
			});
		}
		return e.replace(r, function(r, s) {
			if (m) {
				if (r !== "</" + a.name + ">") return;
				m = !1;
			}
			var u, f = "/" !== r.charAt(1), h = r.startsWith("<!--"), p = s + r.length, d = e.charAt(p);
			if (h) {
				var v = n(r);
				return l < 0 ? (c.push(v), c) : ((u = o[l]).children.push(v), c);
			}
			if (f && (l++, "tag" === (a = n(r)).type && t.components[a.name] && (a.type = "component", m = !0), a.voidElement || m || !d || "<" === d || a.children.push({
				type: "text",
				content: e.slice(p, e.indexOf("<", p))
			}), 0 === l && c.push(a), (u = o[l - 1]) && u.children.push(a), o[l] = a), (!f || a.voidElement) && (l > -1 && (a.voidElement || a.name === r.slice(2, -1)) && (l--, a = -1 === l ? c : o[l]), !m && "<" !== d && d)) {
				u = -1 === l ? c : o[l].children;
				var x = e.indexOf("<", p), g = e.slice(p, -1 === x ? void 0 : x);
				i.test(g) && (g = " "), (x > -1 && l + u.length >= 0 || " " !== g) && u.push({
					type: "text",
					content: g
				});
			}
		}), c;
	},
	stringify: function(e) {
		return e.reduce(function(e, t) {
			return e + a("", t);
		}, "");
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/utils.js
var warn = (i18n, code, msg, rest) => {
	const args = [msg, {
		code,
		...rest || {}
	}];
	if (i18n?.services?.logger?.forward) return i18n.services.logger.forward(args, "warn", "react-i18next::", true);
	if (isString(args[0])) args[0] = `react-i18next:: ${args[0]}`;
	if (i18n?.services?.logger?.warn) i18n.services.logger.warn(...args);
	else if (console?.warn) console.warn(...args);
};
var alreadyWarned = {};
var warnOnce = (i18n, code, msg, rest) => {
	if (isString(msg) && alreadyWarned[msg]) return;
	if (isString(msg)) alreadyWarned[msg] = /* @__PURE__ */ new Date();
	warn(i18n, code, msg, rest);
};
var loadedClb = (i18n, cb) => () => {
	if (i18n.isInitialized) cb();
	else {
		const initialized = () => {
			setTimeout(() => {
				i18n.off("initialized", initialized);
			}, 0);
			cb();
		};
		i18n.on("initialized", initialized);
	}
};
var loadNamespaces = (i18n, ns, cb) => {
	i18n.loadNamespaces(ns, loadedClb(i18n, cb));
};
var loadLanguages = (i18n, lng, ns, cb) => {
	if (isString(ns)) ns = [ns];
	if (i18n.options.preload && i18n.options.preload.indexOf(lng) > -1) return loadNamespaces(i18n, ns, cb);
	ns.forEach((n) => {
		if (i18n.options.ns.indexOf(n) < 0) i18n.options.ns.push(n);
	});
	i18n.loadLanguages(lng, loadedClb(i18n, cb));
};
var hasLoadedNamespace = (ns, i18n, options = {}) => {
	if (!i18n.languages || !i18n.languages.length) {
		warnOnce(i18n, "NO_LANGUAGES", "i18n.languages were undefined or empty", { languages: i18n.languages });
		return true;
	}
	return i18n.hasLoadedNamespace(ns, {
		lng: options.lng,
		precheck: (i18nInstance, loadNotPending) => {
			if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance.services.backendConnector.backend && i18nInstance.isLanguageChangingTo && !loadNotPending(i18nInstance.isLanguageChangingTo, ns)) return false;
		}
	});
};
var getDisplayName = (Component) => Component.displayName || Component.name || (isString(Component) && Component.length > 0 ? Component : "Unknown");
var isString = (obj) => typeof obj === "string";
var isObject = (obj) => typeof obj === "object" && obj !== null;
//#endregion
//#region node_modules/react-i18next/dist/es/unescape.js
var matchHtmlEntity = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
var htmlEntities = {
	"&amp;": "&",
	"&#38;": "&",
	"&lt;": "<",
	"&#60;": "<",
	"&gt;": ">",
	"&#62;": ">",
	"&apos;": "'",
	"&#39;": "'",
	"&quot;": "\"",
	"&#34;": "\"",
	"&nbsp;": " ",
	"&#160;": " ",
	"&copy;": "©",
	"&#169;": "©",
	"&reg;": "®",
	"&#174;": "®",
	"&hellip;": "…",
	"&#8230;": "…",
	"&#x2F;": "/",
	"&#47;": "/"
};
var unescapeHtmlEntity = (m) => htmlEntities[m];
var unescape = (text) => text.replace(matchHtmlEntity, unescapeHtmlEntity);
//#endregion
//#region node_modules/react-i18next/dist/es/defaults.js
var defaultOptions = {
	bindI18n: "languageChanged",
	bindI18nStore: "",
	transEmptyNodeValue: "",
	transSupportBasicHtmlNodes: true,
	transWrapTextNodes: "",
	transKeepBasicHtmlNodesFor: [
		"br",
		"strong",
		"i",
		"p"
	],
	useSuspense: true,
	unescape,
	transDefaultProps: void 0
};
var setDefaults = (options = {}) => {
	defaultOptions = {
		...defaultOptions,
		...options
	};
};
var getDefaults = () => defaultOptions;
//#endregion
//#region node_modules/react-i18next/dist/es/i18nInstance.js
var i18nInstance;
var setI18n = (instance) => {
	i18nInstance = instance;
};
var getI18n = () => i18nInstance;
//#endregion
//#region node_modules/react-i18next/dist/es/TransWithoutContext.js
var hasChildren = (node, checkLength) => {
	if (!node) return false;
	const base = node.props?.children ?? node.children;
	if (checkLength) return base.length > 0;
	return !!base;
};
var getChildren = (node) => {
	if (!node) return [];
	const children = node.props?.children ?? node.children;
	return node.props?.i18nIsDynamicList ? getAsArray(children) : children;
};
var hasValidReactChildren = (children) => Array.isArray(children) && children.every(import_react.isValidElement);
var getAsArray = (data) => Array.isArray(data) ? data : [data];
var mergeProps = (source, target) => {
	const newTarget = { ...target };
	newTarget.props = {
		...target.props,
		...source.props
	};
	return newTarget;
};
var getValuesFromChildren = (children) => {
	const values = {};
	if (!children) return values;
	const getData = (childs) => {
		getAsArray(childs).forEach((child) => {
			if (isString(child)) return;
			if (hasChildren(child)) getData(getChildren(child));
			else if (isObject(child) && !(0, import_react.isValidElement)(child)) Object.assign(values, child);
		});
	};
	getData(children);
	return values;
};
var nodesToString = (children, i18nOptions, i18n, i18nKey) => {
	if (!children) return "";
	let stringNode = "";
	const childrenArray = getAsArray(children);
	const keepArray = i18nOptions?.transSupportBasicHtmlNodes ? i18nOptions.transKeepBasicHtmlNodesFor ?? [] : [];
	childrenArray.forEach((child, childIndex) => {
		if (isString(child)) {
			stringNode += `${child}`;
			return;
		}
		if ((0, import_react.isValidElement)(child)) {
			const { props, type } = child;
			const childPropsCount = Object.keys(props).length;
			const shouldKeepChild = keepArray.indexOf(type) > -1;
			const childChildren = props.children;
			if (!childChildren && shouldKeepChild && !childPropsCount) {
				stringNode += `<${type}/>`;
				return;
			}
			if (!childChildren && (!shouldKeepChild || childPropsCount) || props.i18nIsDynamicList) {
				stringNode += `<${childIndex}></${childIndex}>`;
				return;
			}
			if (shouldKeepChild && childPropsCount <= 1) {
				const cnt = isString(childChildren) ? childChildren : nodesToString(childChildren, i18nOptions, i18n, i18nKey);
				stringNode += `<${type}>${cnt}</${type}>`;
				return;
			}
			const content = nodesToString(childChildren, i18nOptions, i18n, i18nKey);
			stringNode += `<${childIndex}>${content}</${childIndex}>`;
			return;
		}
		if (child === null) {
			warn(i18n, "TRANS_NULL_VALUE", `Passed in a null value as child`, { i18nKey });
			return;
		}
		if (isObject(child)) {
			const { format, ...clone } = child;
			const keys = Object.keys(clone);
			if (keys.length === 1) {
				const value = format ? `${keys[0]}, ${format}` : keys[0];
				stringNode += `{{${value}}}`;
				return;
			}
			warn(i18n, "TRANS_INVALID_OBJ", `Invalid child - Object should only have keys {{ value, format }} (format is optional).`, {
				i18nKey,
				child
			});
			return;
		}
		warn(i18n, "TRANS_INVALID_VAR", `Passed in a variable like {number} - pass variables for interpolation as full objects like {{number}}.`, {
			i18nKey,
			child
		});
	});
	return stringNode;
};
var escapeLiteralLessThan = (str, keepArray = [], knownComponentsMap = {}) => {
	if (!str) return str;
	const knownNames = Object.keys(knownComponentsMap);
	const allValidNames = [...keepArray, ...knownNames];
	let result = "";
	let i = 0;
	while (i < str.length) if (str[i] === "<") {
		let isValidTag = false;
		const closingMatch = str.slice(i).match(/^<\/(\d+|[a-zA-Z][a-zA-Z0-9_-]*)>/);
		if (closingMatch) {
			const tagName = closingMatch[1];
			if (/^\d+$/.test(tagName) || allValidNames.includes(tagName)) {
				isValidTag = true;
				result += closingMatch[0];
				i += closingMatch[0].length;
			}
		}
		if (!isValidTag) {
			const openingMatch = str.slice(i).match(/^<(\d+|[a-zA-Z][a-zA-Z0-9_-]*)(\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*(\/)?>/);
			if (openingMatch) {
				const tagName = openingMatch[1];
				if (/^\d+$/.test(tagName) || allValidNames.includes(tagName)) {
					isValidTag = true;
					result += openingMatch[0];
					i += openingMatch[0].length;
				}
			}
		}
		if (!isValidTag) {
			result += "&lt;";
			i += 1;
		}
	} else {
		result += str[i];
		i += 1;
	}
	return result;
};
var renderNodes = (children, knownComponentsMap, targetString, i18n, i18nOptions, combinedTOpts, shouldUnescape) => {
	if (targetString === "") return [];
	const keepArray = i18nOptions.transKeepBasicHtmlNodesFor || [];
	const emptyChildrenButNeedsHandling = targetString && new RegExp(keepArray.map((keep) => `<${keep}`).join("|")).test(targetString);
	if (!children && !knownComponentsMap && !emptyChildrenButNeedsHandling && !shouldUnescape) return [targetString];
	const data = knownComponentsMap ?? {};
	const getData = (childs) => {
		getAsArray(childs).forEach((child) => {
			if (isString(child)) return;
			if (hasChildren(child)) getData(getChildren(child));
			else if (isObject(child) && !(0, import_react.isValidElement)(child)) Object.assign(data, child);
		});
	};
	getData(children);
	const escapedString = escapeLiteralLessThan(targetString, keepArray, data);
	const ast = c.parse(`<0>${escapedString}</0>`);
	const opts = {
		...data,
		...combinedTOpts
	};
	const renderInner = (child, node, rootReactNode) => {
		const childs = getChildren(child);
		const mappedChildren = mapAST(childs, node.children, rootReactNode);
		return hasValidReactChildren(childs) && mappedChildren.length === 0 || child.props?.i18nIsDynamicList ? childs : mappedChildren;
	};
	const pushTranslatedJSX = (child, inner, mem, i, isVoid) => {
		if (child.dummy) {
			child.children = inner;
			mem.push((0, import_react.cloneElement)(child, { key: i }, isVoid ? void 0 : inner));
		} else mem.push(...import_react.Children.map([child], (c) => {
			if (c.type === import_react.Fragment || c.props?.i18nIsDynamicList !== void 0) {
				const freshProps = { key: i };
				if (c && c.props) Object.keys(c.props).forEach((k) => {
					if (k === "children" || k === "i18nIsDynamicList") return;
					freshProps[k] = c.props[k];
				});
				return (0, import_react.createElement)(c.type, freshProps, isVoid ? null : inner);
			}
			const override = { key: i };
			if (c && c.props) Object.keys(c.props).forEach((k) => {
				if (k === "ref" || k === "children") return;
				override[k] = c.props[k];
			});
			return (0, import_react.cloneElement)(c, override, isVoid ? null : inner);
		}));
	};
	const mapAST = (reactNode, astNode, rootReactNode) => {
		const reactNodes = getAsArray(reactNode);
		const astNodes = getAsArray(astNode);
		const keepTagOccurrence = {};
		return astNodes.reduce((mem, node, i) => {
			const translationContent = node.children?.[0]?.content && i18n.services.interpolator.interpolate(node.children[0].content, opts, i18n.language);
			if (node.type === "tag") {
				let tmp = reactNodes[parseInt(node.name, 10)];
				if (!tmp && knownComponentsMap) tmp = knownComponentsMap[node.name];
				if (rootReactNode.length === 1 && !tmp) tmp = rootReactNode[0][node.name];
				if (!tmp) tmp = {};
				const props = { ...node.attrs };
				if (shouldUnescape) Object.keys(props).forEach((p) => {
					const val = props[p];
					if (isString(val)) props[p] = unescape(val);
				});
				const child = Object.keys(props).length !== 0 ? mergeProps({ props }, tmp) : tmp;
				const isElement = (0, import_react.isValidElement)(child);
				const isValidTranslationWithChildren = isElement && hasChildren(node, true) && !node.voidElement;
				const isEmptyTransWithHTML = emptyChildrenButNeedsHandling && isObject(child) && child.dummy && !isElement;
				const isKnownComponent = isObject(knownComponentsMap) && Object.hasOwnProperty.call(knownComponentsMap, node.name);
				if (isString(child)) {
					const value = i18n.services.interpolator.interpolate(child, opts, i18n.language);
					mem.push(value);
				} else if (hasChildren(child) || isValidTranslationWithChildren) {
					const inner = renderInner(child, node, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i);
				} else if (isEmptyTransWithHTML) {
					const inner = mapAST(reactNodes, node.children, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i);
				} else if (Number.isNaN(parseFloat(node.name))) if (isKnownComponent) {
					const inner = renderInner(child, node, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i, node.voidElement);
				} else if (i18nOptions.transSupportBasicHtmlNodes && keepArray.indexOf(node.name) > -1) if (node.voidElement) mem.push((0, import_react.createElement)(node.name, { key: `${node.name}-${i}` }));
				else {
					const occurrence = keepTagOccurrence[node.name] || 0;
					keepTagOccurrence[node.name] = occurrence + 1;
					let matched;
					let seen = 0;
					for (let r = 0; r < reactNodes.length; r += 1) {
						const rn = reactNodes[r];
						if ((0, import_react.isValidElement)(rn) && rn.type === node.name) {
							if (seen === occurrence) {
								matched = rn;
								break;
							}
							seen += 1;
						}
					}
					const innerScope = matched ? getAsArray(getChildren(matched)) : reactNodes;
					const inner = mapAST(innerScope, node.children, rootReactNode);
					mem.push((0, import_react.createElement)(node.name, { key: `${node.name}-${i}` }, inner));
				}
				else if (node.voidElement) mem.push(`<${node.name} />`);
				else {
					const inner = mapAST(reactNodes, node.children, rootReactNode);
					mem.push(`<${node.name}>${inner}</${node.name}>`);
				}
				else if (isObject(child) && !isElement) {
					const content = node.children[0] ? translationContent : null;
					if (content) mem.push(content);
				} else pushTranslatedJSX(child, translationContent, mem, i, node.children.length !== 1 || !translationContent);
			} else if (node.type === "text") {
				const wrapTextNodes = i18nOptions.transWrapTextNodes;
				const unescapeFn = typeof i18nOptions.unescape === "function" ? i18nOptions.unescape : getDefaults().unescape;
				const content = shouldUnescape ? unescapeFn(i18n.services.interpolator.interpolate(node.content, opts, i18n.language)) : i18n.services.interpolator.interpolate(node.content, opts, i18n.language);
				if (wrapTextNodes) mem.push((0, import_react.createElement)(wrapTextNodes, { key: `${node.name}-${i}` }, content));
				else mem.push(content);
			}
			return mem;
		}, []);
	};
	return getChildren(mapAST([{
		dummy: true,
		children: children || []
	}], ast, getAsArray(children || []))[0]);
};
var fixComponentProps = (component, index, translation) => {
	const componentKey = component.key || index;
	const comp = (0, import_react.cloneElement)(component, { key: componentKey });
	if (!comp.props || !comp.props.children || translation.indexOf(`${index}/>`) < 0 && translation.indexOf(`${index} />`) < 0) return comp;
	function Componentized() {
		return (0, import_react.createElement)(import_react.Fragment, null, comp);
	}
	return (0, import_react.createElement)(Componentized, { key: componentKey });
};
var generateArrayComponents = (components, translation) => components.map((c, index) => fixComponentProps(c, index, translation));
var generateObjectComponents = (components, translation) => {
	const componentMap = {};
	Object.keys(components).forEach((c) => {
		Object.assign(componentMap, { [c]: fixComponentProps(components[c], c, translation) });
	});
	return componentMap;
};
var generateComponents = (components, translation, i18n, i18nKey) => {
	if (!components) return null;
	if (Array.isArray(components)) return generateArrayComponents(components, translation);
	if (isObject(components)) return generateObjectComponents(components, translation);
	warnOnce(i18n, "TRANS_INVALID_COMPONENTS", `<Trans /> "components" prop expects an object or array`, { i18nKey });
	return null;
};
var isComponentsMap = (object) => {
	if (!isObject(object)) return false;
	if (Array.isArray(object)) return false;
	return Object.keys(object).reduce((acc, key) => acc && Number.isNaN(Number.parseFloat(key)), true);
};
function Trans$1({ children, count, parent, i18nKey, context, tOptions = {}, values, defaults, components, ns, i18n: i18nFromProps, t: tFromProps, shouldUnescape, ...additionalProps }) {
	const i18n = i18nFromProps || getI18n();
	if (!i18n) {
		warnOnce(i18n, "NO_I18NEXT_INSTANCE", `Trans: You need to pass in an i18next instance using i18nextReactModule`, { i18nKey });
		return children;
	}
	const t = tFromProps || i18n.t.bind(i18n) || ((k) => k);
	const reactI18nextOptions = {
		...getDefaults(),
		...i18n.options?.react
	};
	let namespaces = ns || t.ns || i18n.options?.defaultNS;
	namespaces = isString(namespaces) ? [namespaces] : namespaces || ["translation"];
	const { transDefaultProps } = reactI18nextOptions;
	const mergedTOptions = transDefaultProps?.tOptions ? {
		...transDefaultProps.tOptions,
		...tOptions
	} : tOptions;
	const mergedShouldUnescape = shouldUnescape ?? transDefaultProps?.shouldUnescape;
	const mergedValues = transDefaultProps?.values ? {
		...transDefaultProps.values,
		...values
	} : values;
	const mergedComponents = transDefaultProps?.components ? {
		...transDefaultProps.components,
		...components
	} : components;
	const nodeAsString = nodesToString(children, reactI18nextOptions, i18n, i18nKey);
	const defaultValue = defaults || mergedTOptions?.defaultValue || nodeAsString || reactI18nextOptions.transEmptyNodeValue || (typeof i18nKey === "function" ? keysFromSelector(i18nKey) : i18nKey);
	const { hashTransKey } = reactI18nextOptions;
	const key = i18nKey || (hashTransKey ? hashTransKey(nodeAsString || defaultValue) : nodeAsString || defaultValue);
	if (i18n.options?.interpolation?.defaultVariables) values = mergedValues && Object.keys(mergedValues).length > 0 ? {
		...mergedValues,
		...i18n.options.interpolation.defaultVariables
	} : { ...i18n.options.interpolation.defaultVariables };
	else values = mergedValues;
	const valuesFromChildren = getValuesFromChildren(children);
	if (valuesFromChildren && typeof valuesFromChildren.count === "number" && count === void 0) count = valuesFromChildren.count;
	const interpolationOverride = values || count !== void 0 && !i18n.options?.interpolation?.alwaysFormat || !children ? mergedTOptions.interpolation : { interpolation: {
		...mergedTOptions.interpolation,
		prefix: "#$?",
		suffix: "?$#"
	} };
	const combinedTOpts = {
		...mergedTOptions,
		context: context || mergedTOptions.context,
		count,
		...values,
		...interpolationOverride,
		defaultValue,
		ns: namespaces
	};
	let translation = key ? t(key, combinedTOpts) : defaultValue;
	if (translation === key && defaultValue) translation = defaultValue;
	const generatedComponents = generateComponents(mergedComponents, translation, i18n, i18nKey);
	let indexedChildren = generatedComponents || children;
	let componentsMap = null;
	if (isComponentsMap(generatedComponents)) {
		componentsMap = generatedComponents;
		indexedChildren = children;
	}
	const content = renderNodes(indexedChildren, componentsMap, translation, i18n, reactI18nextOptions, combinedTOpts, mergedShouldUnescape);
	const useAsParent = parent ?? reactI18nextOptions.defaultTransParent;
	return useAsParent ? (0, import_react.createElement)(useAsParent, additionalProps, content) : content;
}
//#endregion
//#region node_modules/react-i18next/dist/es/initReactI18next.js
var initReactI18next = {
	type: "3rdParty",
	init(instance) {
		setDefaults(instance.options.react);
		setI18n(instance);
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/context.js
var I18nContext = (0, import_react.createContext)();
var ReportNamespaces = class {
	constructor() {
		this.usedNamespaces = {};
	}
	addUsedNamespaces(namespaces) {
		namespaces.forEach((ns) => {
			if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
		});
	}
	getUsedNamespaces() {
		return Object.keys(this.usedNamespaces);
	}
};
var composeInitialProps = (ForComponent) => async (ctx) => {
	const componentsInitialProps = await ForComponent.getInitialProps?.(ctx) ?? {};
	const i18nInitialProps = getInitialProps();
	return {
		...componentsInitialProps,
		...i18nInitialProps
	};
};
var getInitialProps = () => {
	const i18n = getI18n();
	if (!i18n) {
		console.warn("react-i18next:: getInitialProps: You will need to pass in an i18next instance by using initReactI18next");
		return {};
	}
	const namespaces = i18n.reportNamespaces?.getUsedNamespaces() ?? [];
	const ret = {};
	const initialI18nStore = {};
	i18n.languages.forEach((l) => {
		initialI18nStore[l] = {};
		namespaces.forEach((ns) => {
			initialI18nStore[l][ns] = i18n.getResourceBundle(l, ns) || {};
		});
	});
	ret.initialI18nStore = initialI18nStore;
	ret.initialLanguage = i18n.language;
	return ret;
};
//#endregion
//#region node_modules/react-i18next/dist/es/Trans.js
function Trans({ children, count, parent, i18nKey, context, tOptions = {}, values, defaults, components, ns, i18n: i18nFromProps, t: tFromProps, shouldUnescape, ...additionalProps }) {
	const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	const t = tFromProps || i18n?.t.bind(i18n);
	return Trans$1({
		children,
		count,
		parent,
		i18nKey,
		context,
		tOptions,
		values,
		defaults,
		components,
		ns: ns || t?.ns || defaultNSFromContext || i18n?.options?.defaultNS,
		i18n,
		t: tFromProps,
		shouldUnescape,
		...additionalProps
	});
}
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTransUtils/TranslationParserError.js
var TranslationParserError = class TranslationParserError extends Error {
	constructor(message, position, translationString) {
		super(message);
		this.name = "TranslationParserError";
		this.position = position;
		this.translationString = translationString;
		if (Error.captureStackTrace) Error.captureStackTrace(this, TranslationParserError);
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTransUtils/htmlEntityDecoder.js
var commonEntities = {
	"&nbsp;": "\xA0",
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": "\"",
	"&apos;": "'",
	"&copy;": "©",
	"&reg;": "®",
	"&trade;": "™",
	"&hellip;": "…",
	"&ndash;": "–",
	"&mdash;": "—",
	"&lsquo;": "‘",
	"&rsquo;": "’",
	"&sbquo;": "‚",
	"&ldquo;": "“",
	"&rdquo;": "”",
	"&bdquo;": "„",
	"&dagger;": "†",
	"&Dagger;": "‡",
	"&bull;": "•",
	"&prime;": "′",
	"&Prime;": "″",
	"&lsaquo;": "‹",
	"&rsaquo;": "›",
	"&sect;": "§",
	"&para;": "¶",
	"&middot;": "·",
	"&ensp;": " ",
	"&emsp;": " ",
	"&thinsp;": " ",
	"&euro;": "€",
	"&pound;": "£",
	"&yen;": "¥",
	"&cent;": "¢",
	"&curren;": "¤",
	"&times;": "×",
	"&divide;": "÷",
	"&minus;": "−",
	"&plusmn;": "±",
	"&ne;": "≠",
	"&le;": "≤",
	"&ge;": "≥",
	"&asymp;": "≈",
	"&equiv;": "≡",
	"&infin;": "∞",
	"&int;": "∫",
	"&sum;": "∑",
	"&prod;": "∏",
	"&radic;": "√",
	"&part;": "∂",
	"&permil;": "‰",
	"&deg;": "°",
	"&micro;": "µ",
	"&larr;": "←",
	"&uarr;": "↑",
	"&rarr;": "→",
	"&darr;": "↓",
	"&harr;": "↔",
	"&crarr;": "↵",
	"&lArr;": "⇐",
	"&uArr;": "⇑",
	"&rArr;": "⇒",
	"&dArr;": "⇓",
	"&hArr;": "⇔",
	"&alpha;": "α",
	"&beta;": "β",
	"&gamma;": "γ",
	"&delta;": "δ",
	"&epsilon;": "ε",
	"&zeta;": "ζ",
	"&eta;": "η",
	"&theta;": "θ",
	"&iota;": "ι",
	"&kappa;": "κ",
	"&lambda;": "λ",
	"&mu;": "μ",
	"&nu;": "ν",
	"&xi;": "ξ",
	"&omicron;": "ο",
	"&pi;": "π",
	"&rho;": "ρ",
	"&sigma;": "σ",
	"&tau;": "τ",
	"&upsilon;": "υ",
	"&phi;": "φ",
	"&chi;": "χ",
	"&psi;": "ψ",
	"&omega;": "ω",
	"&Alpha;": "Α",
	"&Beta;": "Β",
	"&Gamma;": "Γ",
	"&Delta;": "Δ",
	"&Epsilon;": "Ε",
	"&Zeta;": "Ζ",
	"&Eta;": "Η",
	"&Theta;": "Θ",
	"&Iota;": "Ι",
	"&Kappa;": "Κ",
	"&Lambda;": "Λ",
	"&Mu;": "Μ",
	"&Nu;": "Ν",
	"&Xi;": "Ξ",
	"&Omicron;": "Ο",
	"&Pi;": "Π",
	"&Rho;": "Ρ",
	"&Sigma;": "Σ",
	"&Tau;": "Τ",
	"&Upsilon;": "Υ",
	"&Phi;": "Φ",
	"&Chi;": "Χ",
	"&Psi;": "Ψ",
	"&Omega;": "Ω",
	"&Agrave;": "À",
	"&Aacute;": "Á",
	"&Acirc;": "Â",
	"&Atilde;": "Ã",
	"&Auml;": "Ä",
	"&Aring;": "Å",
	"&AElig;": "Æ",
	"&Ccedil;": "Ç",
	"&Egrave;": "È",
	"&Eacute;": "É",
	"&Ecirc;": "Ê",
	"&Euml;": "Ë",
	"&Igrave;": "Ì",
	"&Iacute;": "Í",
	"&Icirc;": "Î",
	"&Iuml;": "Ï",
	"&ETH;": "Ð",
	"&Ntilde;": "Ñ",
	"&Ograve;": "Ò",
	"&Oacute;": "Ó",
	"&Ocirc;": "Ô",
	"&Otilde;": "Õ",
	"&Ouml;": "Ö",
	"&Oslash;": "Ø",
	"&Ugrave;": "Ù",
	"&Uacute;": "Ú",
	"&Ucirc;": "Û",
	"&Uuml;": "Ü",
	"&Yacute;": "Ý",
	"&THORN;": "Þ",
	"&szlig;": "ß",
	"&agrave;": "à",
	"&aacute;": "á",
	"&acirc;": "â",
	"&atilde;": "ã",
	"&auml;": "ä",
	"&aring;": "å",
	"&aelig;": "æ",
	"&ccedil;": "ç",
	"&egrave;": "è",
	"&eacute;": "é",
	"&ecirc;": "ê",
	"&euml;": "ë",
	"&igrave;": "ì",
	"&iacute;": "í",
	"&icirc;": "î",
	"&iuml;": "ï",
	"&eth;": "ð",
	"&ntilde;": "ñ",
	"&ograve;": "ò",
	"&oacute;": "ó",
	"&ocirc;": "ô",
	"&otilde;": "õ",
	"&ouml;": "ö",
	"&oslash;": "ø",
	"&ugrave;": "ù",
	"&uacute;": "ú",
	"&ucirc;": "û",
	"&uuml;": "ü",
	"&yacute;": "ý",
	"&thorn;": "þ",
	"&yuml;": "ÿ",
	"&iexcl;": "¡",
	"&iquest;": "¿",
	"&fnof;": "ƒ",
	"&circ;": "ˆ",
	"&tilde;": "˜",
	"&OElig;": "Œ",
	"&oelig;": "œ",
	"&Scaron;": "Š",
	"&scaron;": "š",
	"&Yuml;": "Ÿ",
	"&ordf;": "ª",
	"&ordm;": "º",
	"&macr;": "¯",
	"&acute;": "´",
	"&cedil;": "¸",
	"&sup1;": "¹",
	"&sup2;": "²",
	"&sup3;": "³",
	"&frac14;": "¼",
	"&frac12;": "½",
	"&frac34;": "¾",
	"&spades;": "♠",
	"&clubs;": "♣",
	"&hearts;": "♥",
	"&diams;": "♦",
	"&loz;": "◊",
	"&oline;": "‾",
	"&frasl;": "⁄",
	"&weierp;": "℘",
	"&image;": "ℑ",
	"&real;": "ℜ",
	"&alefsym;": "ℵ"
};
var entityPattern = new RegExp(Object.keys(commonEntities).map((entity) => entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
var decodeHtmlEntities = (text) => text.replace(entityPattern, (match) => commonEntities[match]).replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTransUtils/tokenizer.js
var tokenize = (translation) => {
	const tokens = [];
	let position = 0;
	let currentText = "";
	const flushText = () => {
		if (currentText) {
			tokens.push({
				type: "Text",
				value: currentText,
				position: position - currentText.length
			});
			currentText = "";
		}
	};
	while (position < translation.length) {
		const char = translation[position];
		if (char === "<") {
			const tagMatch = translation.slice(position).match(/^<(\d+)>/);
			if (tagMatch) {
				flushText();
				tokens.push({
					type: "TagOpen",
					value: tagMatch[0],
					position,
					tagNumber: parseInt(tagMatch[1], 10)
				});
				position += tagMatch[0].length;
			} else {
				const closeTagMatch = translation.slice(position).match(/^<\/(\d+)>/);
				if (closeTagMatch) {
					flushText();
					tokens.push({
						type: "TagClose",
						value: closeTagMatch[0],
						position,
						tagNumber: parseInt(closeTagMatch[1], 10)
					});
					position += closeTagMatch[0].length;
				} else {
					currentText += char;
					position += 1;
				}
			}
		} else {
			currentText += char;
			position += 1;
		}
	}
	flushText();
	return tokens;
};
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTransUtils/renderTranslation.js
var renderDeclarationNode = (declaration, children, childDeclarations) => {
	const { type, props = {} } = declaration;
	if (props.children && Array.isArray(props.children) && childDeclarations) {
		const { children: _childrenToRemove, ...propsWithoutChildren } = props;
		return import_react.createElement(type, propsWithoutChildren, ...children);
	}
	if (children.length === 0) return import_react.createElement(type, props);
	if (children.length === 1) return import_react.createElement(type, props, children[0]);
	return import_react.createElement(type, props, ...children);
};
var renderTranslation = (translation, declarations = []) => {
	if (!translation) return [];
	const tokens = tokenize(translation);
	const result = [];
	const stack = [];
	const literalTagNumbers = /* @__PURE__ */ new Set();
	const getCurrentDeclarations = () => {
		if (stack.length === 0) return declarations;
		const parentFrame = stack[stack.length - 1];
		if (parentFrame.declaration.props?.children && Array.isArray(parentFrame.declaration.props.children)) return parentFrame.declaration.props.children;
		return parentFrame.declarations;
	};
	tokens.forEach((token) => {
		switch (token.type) {
			case "Text":
				{
					const decoded = decodeHtmlEntities(token.value);
					(stack.length > 0 ? stack[stack.length - 1].children : result).push(decoded);
				}
				break;
			case "TagOpen":
				{
					const { tagNumber } = token;
					const currentDeclarations = getCurrentDeclarations();
					const declaration = currentDeclarations[tagNumber];
					if (!declaration) {
						literalTagNumbers.add(tagNumber);
						const literalText = `<${tagNumber}>`;
						(stack.length > 0 ? stack[stack.length - 1].children : result).push(literalText);
						break;
					}
					stack.push({
						tagNumber,
						children: [],
						position: token.position,
						declaration,
						declarations: currentDeclarations
					});
				}
				break;
			case "TagClose": {
				const { tagNumber } = token;
				if (literalTagNumbers.has(tagNumber)) {
					const literalText = `</${tagNumber}>`;
					(stack.length > 0 ? stack[stack.length - 1].children : result).push(literalText);
					literalTagNumbers.delete(tagNumber);
					break;
				}
				if (stack.length === 0) throw new TranslationParserError(`Unexpected closing tag </${tagNumber}> at position ${token.position}`, token.position, translation);
				const frame = stack.pop();
				if (frame.tagNumber !== tagNumber) throw new TranslationParserError(`Mismatched tags: expected </${frame.tagNumber}> but got </${tagNumber}> at position ${token.position}`, token.position, translation);
				const element = renderDeclarationNode(frame.declaration, frame.children, frame.declarations);
				(stack.length > 0 ? stack[stack.length - 1].children : result).push(element);
			}
		}
	});
	if (stack.length > 0) {
		const unclosed = stack[stack.length - 1];
		throw new TranslationParserError(`Unclosed tag <${unclosed.tagNumber}> at position ${unclosed.position}`, unclosed.position, translation);
	}
	return result;
};
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTransWithoutContext.js
function IcuTransWithoutContext({ i18nKey, defaultTranslation, content, ns, values = {}, i18n: i18nFromProps, t: tFromProps }) {
	const i18n = i18nFromProps || getI18n();
	if (!i18n) {
		warnOnce(i18n, "NO_I18NEXT_INSTANCE", `IcuTrans: You need to pass in an i18next instance using i18nextReactModule`, { i18nKey });
		return import_react.createElement(import_react.Fragment, {}, defaultTranslation);
	}
	const t = tFromProps || i18n.t?.bind(i18n) || ((k) => k);
	let namespaces = ns || t.ns || i18n.options?.defaultNS;
	namespaces = isString(namespaces) ? [namespaces] : namespaces || ["translation"];
	let mergedValues = values;
	if (i18n.options?.interpolation?.defaultVariables) mergedValues = values && Object.keys(values).length > 0 ? {
		...values,
		...i18n.options.interpolation.defaultVariables
	} : { ...i18n.options.interpolation.defaultVariables };
	const translation = t(i18nKey, {
		defaultValue: defaultTranslation,
		...mergedValues,
		ns: namespaces
	});
	try {
		const rendered = renderTranslation(translation, content);
		return import_react.createElement(import_react.Fragment, {}, ...rendered);
	} catch (error) {
		warn(i18n, "ICU_TRANS_RENDER_ERROR", `IcuTrans component error for key "${i18nKey}": ${error.message}`, {
			i18nKey,
			error
		});
		return import_react.createElement(import_react.Fragment, {}, translation);
	}
}
IcuTransWithoutContext.displayName = "IcuTransWithoutContext";
//#endregion
//#region node_modules/react-i18next/dist/es/IcuTrans.js
function IcuTrans({ i18nKey, defaultTranslation, content, ns, values = {}, i18n: i18nFromProps, t: tFromProps }) {
	const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	const t = tFromProps || i18n?.t.bind(i18n);
	return IcuTransWithoutContext({
		i18nKey,
		defaultTranslation,
		content,
		ns: ns || t?.ns || defaultNSFromContext || i18n?.options?.defaultNS,
		values,
		i18n,
		t: tFromProps
	});
}
IcuTrans.displayName = "IcuTrans";
//#endregion
//#region node_modules/react-i18next/dist/es/useTranslation.js
var import_shim = require_shim();
var notReadyT = (k, optsOrDefaultValue) => {
	if (isString(optsOrDefaultValue)) return optsOrDefaultValue;
	if (isObject(optsOrDefaultValue) && isString(optsOrDefaultValue.defaultValue)) return optsOrDefaultValue.defaultValue;
	if (typeof k === "function") return "";
	if (Array.isArray(k)) {
		const last = k[k.length - 1];
		return typeof last === "function" ? "" : last;
	}
	return k;
};
var notReadySnapshot = {
	t: notReadyT,
	ready: false
};
var dummySubscribe = () => () => {};
var useTranslation = (ns, props = {}) => {
	const { i18n: i18nFromProps } = props;
	const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	if (i18n && !i18n.reportNamespaces) i18n.reportNamespaces = new ReportNamespaces();
	if (!i18n) warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useTranslation: You will need to pass in an i18next instance by using initReactI18next");
	const i18nOptions = (0, import_react.useMemo)(() => ({
		...getDefaults(),
		...i18n?.options?.react,
		...props
	}), [i18n, props]);
	const { useSuspense, keyPrefix } = i18nOptions;
	const nsOrContext = ns || defaultNSFromContext || i18n?.options?.defaultNS;
	const unstableNamespaces = isString(nsOrContext) ? [nsOrContext] : nsOrContext || ["translation"];
	const namespaces = (0, import_react.useMemo)(() => unstableNamespaces, unstableNamespaces);
	i18n?.reportNamespaces?.addUsedNamespaces?.(namespaces);
	const revisionRef = (0, import_react.useRef)(0);
	const subscribe = (0, import_react.useCallback)((callback) => {
		if (!i18n) return dummySubscribe;
		const { bindI18n, bindI18nStore } = i18nOptions;
		const wrappedCallback = () => {
			revisionRef.current += 1;
			callback();
		};
		if (bindI18n) i18n.on(bindI18n, wrappedCallback);
		if (bindI18nStore) i18n.store.on(bindI18nStore, wrappedCallback);
		return () => {
			if (bindI18n) bindI18n.split(" ").forEach((e) => i18n.off(e, wrappedCallback));
			if (bindI18nStore) bindI18nStore.split(" ").forEach((e) => i18n.store.off(e, wrappedCallback));
		};
	}, [i18n, i18nOptions]);
	const snapshotRef = (0, import_react.useRef)();
	const getSnapshot = (0, import_react.useCallback)(() => {
		if (!i18n) return notReadySnapshot;
		const calculatedReady = !!(i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace(n, i18n, i18nOptions));
		const currentLng = props.lng || i18n.language;
		const currentRevision = revisionRef.current;
		const lastSnapshot = snapshotRef.current;
		if (lastSnapshot && lastSnapshot.ready === calculatedReady && lastSnapshot.lng === currentLng && lastSnapshot.keyPrefix === keyPrefix && lastSnapshot.revision === currentRevision) return lastSnapshot;
		const newSnapshot = {
			t: i18n.getFixedT(currentLng, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix, { scopeNs: namespaces }),
			ready: calculatedReady,
			lng: currentLng,
			keyPrefix,
			revision: currentRevision
		};
		snapshotRef.current = newSnapshot;
		return newSnapshot;
	}, [
		i18n,
		namespaces,
		keyPrefix,
		i18nOptions,
		props.lng
	]);
	const [loadCount, setLoadCount] = (0, import_react.useState)(0);
	const { t, ready } = (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
	(0, import_react.useEffect)(() => {
		if (i18n && !ready && !useSuspense) {
			const onLoaded = () => setLoadCount((c) => c + 1);
			if (props.lng) loadLanguages(i18n, props.lng, namespaces, onLoaded);
			else loadNamespaces(i18n, namespaces, onLoaded);
		}
	}, [
		i18n,
		props.lng,
		namespaces,
		ready,
		useSuspense,
		loadCount
	]);
	const finalI18n = i18n || {};
	const wrapperRef = (0, import_react.useRef)(null);
	const wrapperLangRef = (0, import_react.useRef)();
	const createI18nWrapper = (original) => {
		const descriptors = Object.getOwnPropertyDescriptors(original);
		if (descriptors.__original) delete descriptors.__original;
		const wrapper = Object.create(Object.getPrototypeOf(original), descriptors);
		if (!Object.prototype.hasOwnProperty.call(wrapper, "__original")) try {
			Object.defineProperty(wrapper, "__original", {
				value: original,
				writable: false,
				enumerable: false,
				configurable: false
			});
		} catch (_) {}
		return wrapper;
	};
	const ret = (0, import_react.useMemo)(() => {
		const original = finalI18n;
		const lang = original?.language;
		let i18nWrapper = original;
		if (original) if (wrapperRef.current && wrapperRef.current.__original === original) if (wrapperLangRef.current !== lang) {
			i18nWrapper = createI18nWrapper(original);
			wrapperRef.current = i18nWrapper;
			wrapperLangRef.current = lang;
		} else i18nWrapper = wrapperRef.current;
		else {
			i18nWrapper = createI18nWrapper(original);
			wrapperRef.current = i18nWrapper;
			wrapperLangRef.current = lang;
		}
		const effectiveT = !ready && !useSuspense ? (...args) => {
			warnOnce(i18n, "USE_T_BEFORE_READY", "useTranslation: t was called before ready. When using useSuspense: false, make sure to check the ready flag before using t.");
			return t(...args);
		} : t;
		const arr = [
			effectiveT,
			i18nWrapper,
			ready
		];
		arr.t = effectiveT;
		arr.i18n = i18nWrapper;
		arr.ready = ready;
		return arr;
	}, [
		t,
		finalI18n,
		ready,
		finalI18n.resolvedLanguage,
		finalI18n.language,
		finalI18n.languages
	]);
	if (i18n && useSuspense && !ready) throw new Promise((resolve) => {
		const onLoaded = () => resolve();
		if (props.lng) loadLanguages(i18n, props.lng, namespaces, onLoaded);
		else loadNamespaces(i18n, namespaces, onLoaded);
	});
	return ret;
};
//#endregion
//#region node_modules/react-i18next/dist/es/withTranslation.js
var withTranslation = (ns, options = {}) => function Extend(WrappedComponent) {
	function I18nextWithTranslation({ forwardedRef, ...rest }) {
		const [t, i18n, ready] = useTranslation(ns, {
			...rest,
			keyPrefix: options.keyPrefix
		});
		const passDownProps = {
			...rest,
			t,
			i18n,
			tReady: ready
		};
		if (options.withRef && forwardedRef) passDownProps.ref = forwardedRef;
		else if (!options.withRef && forwardedRef) passDownProps.forwardedRef = forwardedRef;
		return (0, import_react.createElement)(WrappedComponent, passDownProps);
	}
	I18nextWithTranslation.displayName = `withI18nextTranslation(${getDisplayName(WrappedComponent)})`;
	I18nextWithTranslation.WrappedComponent = WrappedComponent;
	const forwardRef = (props, ref) => (0, import_react.createElement)(I18nextWithTranslation, Object.assign({}, props, { forwardedRef: ref }));
	return options.withRef ? (0, import_react.forwardRef)(forwardRef) : I18nextWithTranslation;
};
//#endregion
//#region node_modules/react-i18next/dist/es/Translation.js
var Translation = ({ ns, children, ...options }) => {
	const [t, i18n, ready] = useTranslation(ns, options);
	return children(t, {
		i18n,
		lng: i18n?.language
	}, ready);
};
//#endregion
//#region node_modules/react-i18next/dist/es/I18nextProvider.js
function I18nextProvider({ i18n, defaultNS, children }) {
	const value = (0, import_react.useMemo)(() => ({
		i18n,
		defaultNS
	}), [i18n, defaultNS]);
	return (0, import_react.createElement)(I18nContext.Provider, { value }, children);
}
//#endregion
//#region node_modules/react-i18next/dist/es/useSSR.js
var useSSR = (initialI18nStore, initialLanguage, props = {}) => {
	const { i18n: i18nFromProps } = props;
	const { i18n: i18nFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	if (!i18n) {
		warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useSSR: You will need to pass in an i18next instance by using initReactI18next or by passing it via props or context. In monorepo setups, make sure there is only one instance of react-i18next.");
		return;
	}
	if (i18n.options?.isClone) return;
	if (initialI18nStore && !i18n.initializedStoreOnce) {
		if (!i18n.services?.resourceStore) {
			warnOnce(i18n, "I18N_NOT_INITIALIZED", "useSSR: i18n instance was found but not initialized (services.resourceStore is missing). Make sure you call i18next.init() before using useSSR — e.g. at module level, not only in getStaticProps/getServerSideProps.");
			return;
		}
		i18n.services.resourceStore.data = initialI18nStore;
		i18n.options.ns = Object.values(initialI18nStore).reduce((mem, lngResources) => {
			Object.keys(lngResources).forEach((ns) => {
				if (mem.indexOf(ns) < 0) mem.push(ns);
			});
			return mem;
		}, i18n.options.ns);
		i18n.initializedStoreOnce = true;
		i18n.isInitialized = true;
	}
	if (initialLanguage && !i18n.initializedLanguageOnce) {
		i18n.changeLanguage(initialLanguage);
		i18n.initializedLanguageOnce = true;
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/withSSR.js
var withSSR = () => function Extend(WrappedComponent) {
	function I18nextWithSSR({ initialI18nStore, initialLanguage, ...rest }) {
		useSSR(initialI18nStore, initialLanguage);
		return (0, import_react.createElement)(WrappedComponent, { ...rest });
	}
	I18nextWithSSR.getInitialProps = composeInitialProps(WrappedComponent);
	I18nextWithSSR.displayName = `withI18nextSSR(${getDisplayName(WrappedComponent)})`;
	I18nextWithSSR.WrappedComponent = WrappedComponent;
	return I18nextWithSSR;
};
//#endregion
//#region node_modules/react-i18next/dist/es/index.js
var date = () => "";
var time = () => "";
var number = () => "";
var select = () => "";
var plural = () => "";
var selectOrdinal = () => "";
//#endregion
export { I18nContext, I18nextProvider, IcuTrans, IcuTransWithoutContext, Trans, Trans$1 as TransWithoutContext, Translation, composeInitialProps, date, getDefaults, getI18n, getInitialProps, initReactI18next, nodesToString, number, plural, select, selectOrdinal, setDefaults, setI18n, time, useSSR, useTranslation, withSSR, withTranslation };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaTE4bmV4dC5qcyIsIm5hbWVzIjpbImUiLCJpc1ZhbGlkRWxlbWVudCIsIkhUTUwiLCJjbG9uZUVsZW1lbnQiLCJDaGlsZHJlbiIsIkZyYWdtZW50IiwiY3JlYXRlRWxlbWVudCIsIlRyYW5zIiwia2V5RnJvbVNlbGVjdG9yIiwiY3JlYXRlQ29udGV4dCIsInVzZUNvbnRleHQiLCJUcmFuc1dpdGhvdXRDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZUNvbnRleHQiLCJ1c2VNZW1vIiwidXNlUmVmIiwidXNlQ2FsbGJhY2siLCJ1c2VTdGF0ZSIsInVzZVN5bmNFeHRlcm5hbFN0b3JlIiwiY3JlYXRlRWxlbWVudCIsImZvcndhcmRSZWZSZWFjdCIsInVzZU1lbW8iLCJjcmVhdGVFbGVtZW50IiwidXNlQ29udGV4dCIsImNyZWF0ZUVsZW1lbnQiXSwic291cmNlcyI6WyIuLi8uLi92b2lkLWVsZW1lbnRzL2luZGV4LmpzIiwiLi4vLi4vaHRtbC1wYXJzZS1zdHJpbmdpZnkvZGlzdC9odG1sLXBhcnNlLXN0cmluZ2lmeS5tb2R1bGUuanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvdXRpbHMuanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvdW5lc2NhcGUuanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvZGVmYXVsdHMuanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvaTE4bkluc3RhbmNlLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL1RyYW5zV2l0aG91dENvbnRleHQuanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvaW5pdFJlYWN0STE4bmV4dC5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy9jb250ZXh0LmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL1RyYW5zLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL0ljdVRyYW5zVXRpbHMvVHJhbnNsYXRpb25QYXJzZXJFcnJvci5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy9JY3VUcmFuc1V0aWxzL2h0bWxFbnRpdHlEZWNvZGVyLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL0ljdVRyYW5zVXRpbHMvdG9rZW5pemVyLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL0ljdVRyYW5zVXRpbHMvcmVuZGVyVHJhbnNsYXRpb24uanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvSWN1VHJhbnNXaXRob3V0Q29udGV4dC5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy9JY3VUcmFucy5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy91c2VUcmFuc2xhdGlvbi5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy93aXRoVHJhbnNsYXRpb24uanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvVHJhbnNsYXRpb24uanMiLCIuLi8uLi9yZWFjdC1pMThuZXh0L2Rpc3QvZXMvSTE4bmV4dFByb3ZpZGVyLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL3VzZVNTUi5qcyIsIi4uLy4uL3JlYWN0LWkxOG5leHQvZGlzdC9lcy93aXRoU1NSLmpzIiwiLi4vLi4vcmVhY3QtaTE4bmV4dC9kaXN0L2VzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBmaWxlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGZyb20gYHByZS1wdWJsaXNoLmpzYC5cbiAqIERvIG5vdCBtYW51YWxseSBlZGl0LlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBcImFyZWFcIjogdHJ1ZSxcbiAgXCJiYXNlXCI6IHRydWUsXG4gIFwiYnJcIjogdHJ1ZSxcbiAgXCJjb2xcIjogdHJ1ZSxcbiAgXCJlbWJlZFwiOiB0cnVlLFxuICBcImhyXCI6IHRydWUsXG4gIFwiaW1nXCI6IHRydWUsXG4gIFwiaW5wdXRcIjogdHJ1ZSxcbiAgXCJsaW5rXCI6IHRydWUsXG4gIFwibWV0YVwiOiB0cnVlLFxuICBcInBhcmFtXCI6IHRydWUsXG4gIFwic291cmNlXCI6IHRydWUsXG4gIFwidHJhY2tcIjogdHJ1ZSxcbiAgXCJ3YnJcIjogdHJ1ZVxufTtcbiIsImltcG9ydCBlIGZyb21cInZvaWQtZWxlbWVudHNcIjt2YXIgdD0vXFxzKFteJ1wiL1xccz48XSs/KVtcXHMvPl18KFteXFxzPV0rKT1cXHM/KFwiLio/XCJ8Jy4qPycpL2c7ZnVuY3Rpb24gbihuKXt2YXIgcj17dHlwZTpcInRhZ1wiLG5hbWU6XCJcIix2b2lkRWxlbWVudDohMSxhdHRyczp7fSxjaGlsZHJlbjpbXX0saT1uLm1hdGNoKC88XFwvPyhbXlxcc10rPylbL1xccz5dLyk7aWYoaSYmKHIubmFtZT1pWzFdLChlW2lbMV1dfHxcIi9cIj09PW4uY2hhckF0KG4ubGVuZ3RoLTIpKSYmKHIudm9pZEVsZW1lbnQ9ITApLHIubmFtZS5zdGFydHNXaXRoKFwiIS0tXCIpKSl7dmFyIHM9bi5pbmRleE9mKFwiLS1cXHgzZVwiKTtyZXR1cm57dHlwZTpcImNvbW1lbnRcIixjb21tZW50Oi0xIT09cz9uLnNsaWNlKDQscyk6XCJcIn19Zm9yKHZhciBhPW5ldyBSZWdFeHAodCksYz1udWxsO251bGwhPT0oYz1hLmV4ZWMobikpOylpZihjWzBdLnRyaW0oKSlpZihjWzFdKXt2YXIgbz1jWzFdLnRyaW0oKSxsPVtvLFwiXCJdO28uaW5kZXhPZihcIj1cIik+LTEmJihsPW8uc3BsaXQoXCI9XCIpKSxyLmF0dHJzW2xbMF1dPWxbMV0sYS5sYXN0SW5kZXgtLX1lbHNlIGNbMl0mJihyLmF0dHJzW2NbMl1dPWNbM10udHJpbSgpLnN1YnN0cmluZygxLGNbM10ubGVuZ3RoLTEpKTtyZXR1cm4gcn12YXIgcj0vPFthLXpBLVowLTlcXC1cXCFcXC9dKD86XCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj4vZyxpPS9eXFxzKiQvLHM9T2JqZWN0LmNyZWF0ZShudWxsKTtmdW5jdGlvbiBhKGUsdCl7c3dpdGNoKHQudHlwZSl7Y2FzZVwidGV4dFwiOnJldHVybiBlK3QuY29udGVudDtjYXNlXCJ0YWdcIjpyZXR1cm4gZSs9XCI8XCIrdC5uYW1lKyh0LmF0dHJzP2Z1bmN0aW9uKGUpe3ZhciB0PVtdO2Zvcih2YXIgbiBpbiBlKXQucHVzaChuKyc9XCInK2Vbbl0rJ1wiJyk7cmV0dXJuIHQubGVuZ3RoP1wiIFwiK3Quam9pbihcIiBcIik6XCJcIn0odC5hdHRycyk6XCJcIikrKHQudm9pZEVsZW1lbnQ/XCIvPlwiOlwiPlwiKSx0LnZvaWRFbGVtZW50P2U6ZSt0LmNoaWxkcmVuLnJlZHVjZShhLFwiXCIpK1wiPC9cIit0Lm5hbWUrXCI+XCI7Y2FzZVwiY29tbWVudFwiOnJldHVybiBlK1wiXFx4M2MhLS1cIit0LmNvbW1lbnQrXCItLVxceDNlXCJ9fXZhciBjPXtwYXJzZTpmdW5jdGlvbihlLHQpe3R8fCh0PXt9KSx0LmNvbXBvbmVudHN8fCh0LmNvbXBvbmVudHM9cyk7dmFyIGEsYz1bXSxvPVtdLGw9LTEsbT0hMTtpZigwIT09ZS5pbmRleE9mKFwiPFwiKSl7dmFyIHU9ZS5pbmRleE9mKFwiPFwiKTtjLnB1c2goe3R5cGU6XCJ0ZXh0XCIsY29udGVudDotMT09PXU/ZTplLnN1YnN0cmluZygwLHUpfSl9cmV0dXJuIGUucmVwbGFjZShyLGZ1bmN0aW9uKHIscyl7aWYobSl7aWYociE9PVwiPC9cIithLm5hbWUrXCI+XCIpcmV0dXJuO209ITF9dmFyIHUsZj1cIi9cIiE9PXIuY2hhckF0KDEpLGg9ci5zdGFydHNXaXRoKFwiXFx4M2MhLS1cIikscD1zK3IubGVuZ3RoLGQ9ZS5jaGFyQXQocCk7aWYoaCl7dmFyIHY9bihyKTtyZXR1cm4gbDwwPyhjLnB1c2godiksYyk6KCh1PW9bbF0pLmNoaWxkcmVuLnB1c2godiksYyl9aWYoZiYmKGwrKyxcInRhZ1wiPT09KGE9bihyKSkudHlwZSYmdC5jb21wb25lbnRzW2EubmFtZV0mJihhLnR5cGU9XCJjb21wb25lbnRcIixtPSEwKSxhLnZvaWRFbGVtZW50fHxtfHwhZHx8XCI8XCI9PT1kfHxhLmNoaWxkcmVuLnB1c2goe3R5cGU6XCJ0ZXh0XCIsY29udGVudDplLnNsaWNlKHAsZS5pbmRleE9mKFwiPFwiLHApKX0pLDA9PT1sJiZjLnB1c2goYSksKHU9b1tsLTFdKSYmdS5jaGlsZHJlbi5wdXNoKGEpLG9bbF09YSksKCFmfHxhLnZvaWRFbGVtZW50KSYmKGw+LTEmJihhLnZvaWRFbGVtZW50fHxhLm5hbWU9PT1yLnNsaWNlKDIsLTEpKSYmKGwtLSxhPS0xPT09bD9jOm9bbF0pLCFtJiZcIjxcIiE9PWQmJmQpKXt1PS0xPT09bD9jOm9bbF0uY2hpbGRyZW47dmFyIHg9ZS5pbmRleE9mKFwiPFwiLHApLGc9ZS5zbGljZShwLC0xPT09eD92b2lkIDA6eCk7aS50ZXN0KGcpJiYoZz1cIiBcIiksKHg+LTEmJmwrdS5sZW5ndGg+PTB8fFwiIFwiIT09ZykmJnUucHVzaCh7dHlwZTpcInRleHRcIixjb250ZW50Omd9KX19KSxjfSxzdHJpbmdpZnk6ZnVuY3Rpb24oZSl7cmV0dXJuIGUucmVkdWNlKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUrYShcIlwiLHQpfSxcIlwiKX19O2V4cG9ydCBkZWZhdWx0IGM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sLXBhcnNlLXN0cmluZ2lmeS5tb2R1bGUuanMubWFwXG4iLCJleHBvcnQgY29uc3Qgd2FybiA9IChpMThuLCBjb2RlLCBtc2csIHJlc3QpID0+IHtcbiAgY29uc3QgYXJncyA9IFttc2csIHtcbiAgICBjb2RlLFxuICAgIC4uLihyZXN0IHx8IHt9KVxuICB9XTtcbiAgaWYgKGkxOG4/LnNlcnZpY2VzPy5sb2dnZXI/LmZvcndhcmQpIHtcbiAgICByZXR1cm4gaTE4bi5zZXJ2aWNlcy5sb2dnZXIuZm9yd2FyZChhcmdzLCAnd2FybicsICdyZWFjdC1pMThuZXh0OjonLCB0cnVlKTtcbiAgfVxuICBpZiAoaXNTdHJpbmcoYXJnc1swXSkpIGFyZ3NbMF0gPSBgcmVhY3QtaTE4bmV4dDo6ICR7YXJnc1swXX1gO1xuICBpZiAoaTE4bj8uc2VydmljZXM/LmxvZ2dlcj8ud2Fybikge1xuICAgIGkxOG4uc2VydmljZXMubG9nZ2VyLndhcm4oLi4uYXJncyk7XG4gIH0gZWxzZSBpZiAoY29uc29sZT8ud2Fybikge1xuICAgIGNvbnNvbGUud2FybiguLi5hcmdzKTtcbiAgfVxufTtcbmNvbnN0IGFscmVhZHlXYXJuZWQgPSB7fTtcbmV4cG9ydCBjb25zdCB3YXJuT25jZSA9IChpMThuLCBjb2RlLCBtc2csIHJlc3QpID0+IHtcbiAgaWYgKGlzU3RyaW5nKG1zZykgJiYgYWxyZWFkeVdhcm5lZFttc2ddKSByZXR1cm47XG4gIGlmIChpc1N0cmluZyhtc2cpKSBhbHJlYWR5V2FybmVkW21zZ10gPSBuZXcgRGF0ZSgpO1xuICB3YXJuKGkxOG4sIGNvZGUsIG1zZywgcmVzdCk7XG59O1xuY29uc3QgbG9hZGVkQ2xiID0gKGkxOG4sIGNiKSA9PiAoKSA9PiB7XG4gIGlmIChpMThuLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBjYigpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluaXRpYWxpemVkID0gKCkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGkxOG4ub2ZmKCdpbml0aWFsaXplZCcsIGluaXRpYWxpemVkKTtcbiAgICAgIH0sIDApO1xuICAgICAgY2IoKTtcbiAgICB9O1xuICAgIGkxOG4ub24oJ2luaXRpYWxpemVkJywgaW5pdGlhbGl6ZWQpO1xuICB9XG59O1xuZXhwb3J0IGNvbnN0IGxvYWROYW1lc3BhY2VzID0gKGkxOG4sIG5zLCBjYikgPT4ge1xuICBpMThuLmxvYWROYW1lc3BhY2VzKG5zLCBsb2FkZWRDbGIoaTE4biwgY2IpKTtcbn07XG5leHBvcnQgY29uc3QgbG9hZExhbmd1YWdlcyA9IChpMThuLCBsbmcsIG5zLCBjYikgPT4ge1xuICBpZiAoaXNTdHJpbmcobnMpKSBucyA9IFtuc107XG4gIGlmIChpMThuLm9wdGlvbnMucHJlbG9hZCAmJiBpMThuLm9wdGlvbnMucHJlbG9hZC5pbmRleE9mKGxuZykgPiAtMSkgcmV0dXJuIGxvYWROYW1lc3BhY2VzKGkxOG4sIG5zLCBjYik7XG4gIG5zLmZvckVhY2gobiA9PiB7XG4gICAgaWYgKGkxOG4ub3B0aW9ucy5ucy5pbmRleE9mKG4pIDwgMCkgaTE4bi5vcHRpb25zLm5zLnB1c2gobik7XG4gIH0pO1xuICBpMThuLmxvYWRMYW5ndWFnZXMobG5nLCBsb2FkZWRDbGIoaTE4biwgY2IpKTtcbn07XG5leHBvcnQgY29uc3QgaGFzTG9hZGVkTmFtZXNwYWNlID0gKG5zLCBpMThuLCBvcHRpb25zID0ge30pID0+IHtcbiAgaWYgKCFpMThuLmxhbmd1YWdlcyB8fCAhaTE4bi5sYW5ndWFnZXMubGVuZ3RoKSB7XG4gICAgd2Fybk9uY2UoaTE4biwgJ05PX0xBTkdVQUdFUycsICdpMThuLmxhbmd1YWdlcyB3ZXJlIHVuZGVmaW5lZCBvciBlbXB0eScsIHtcbiAgICAgIGxhbmd1YWdlczogaTE4bi5sYW5ndWFnZXNcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gaTE4bi5oYXNMb2FkZWROYW1lc3BhY2UobnMsIHtcbiAgICBsbmc6IG9wdGlvbnMubG5nLFxuICAgIHByZWNoZWNrOiAoaTE4bkluc3RhbmNlLCBsb2FkTm90UGVuZGluZykgPT4ge1xuICAgICAgaWYgKG9wdGlvbnMuYmluZEkxOG4gJiYgb3B0aW9ucy5iaW5kSTE4bi5pbmRleE9mKCdsYW5ndWFnZUNoYW5naW5nJykgPiAtMSAmJiBpMThuSW5zdGFuY2Uuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5iYWNrZW5kICYmIGkxOG5JbnN0YW5jZS5pc0xhbmd1YWdlQ2hhbmdpbmdUbyAmJiAhbG9hZE5vdFBlbmRpbmcoaTE4bkluc3RhbmNlLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvLCBucykpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xufTtcbmV4cG9ydCBjb25zdCBnZXREaXNwbGF5TmFtZSA9IENvbXBvbmVudCA9PiBDb21wb25lbnQuZGlzcGxheU5hbWUgfHwgQ29tcG9uZW50Lm5hbWUgfHwgKGlzU3RyaW5nKENvbXBvbmVudCkgJiYgQ29tcG9uZW50Lmxlbmd0aCA+IDAgPyBDb21wb25lbnQgOiAnVW5rbm93bicpO1xuZXhwb3J0IGNvbnN0IGlzU3RyaW5nID0gb2JqID0+IHR5cGVvZiBvYmogPT09ICdzdHJpbmcnO1xuZXhwb3J0IGNvbnN0IGlzT2JqZWN0ID0gb2JqID0+IHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiAhPT0gbnVsbDsiLCJjb25zdCBtYXRjaEh0bWxFbnRpdHkgPSAvJig/OmFtcHwjMzh8bHR8IzYwfGd0fCM2MnxhcG9zfCMzOXxxdW90fCMzNHxuYnNwfCMxNjB8Y29weXwjMTY5fHJlZ3wjMTc0fGhlbGxpcHwjODIzMHwjeDJGfCM0Nyk7L2c7XG5jb25zdCBodG1sRW50aXRpZXMgPSB7XG4gICcmYW1wOyc6ICcmJyxcbiAgJyYjMzg7JzogJyYnLFxuICAnJmx0Oyc6ICc8JyxcbiAgJyYjNjA7JzogJzwnLFxuICAnJmd0Oyc6ICc+JyxcbiAgJyYjNjI7JzogJz4nLFxuICAnJmFwb3M7JzogXCInXCIsXG4gICcmIzM5Oyc6IFwiJ1wiLFxuICAnJnF1b3Q7JzogJ1wiJyxcbiAgJyYjMzQ7JzogJ1wiJyxcbiAgJyZuYnNwOyc6ICcgJyxcbiAgJyYjMTYwOyc6ICcgJyxcbiAgJyZjb3B5Oyc6ICfCqScsXG4gICcmIzE2OTsnOiAnwqknLFxuICAnJnJlZzsnOiAnwq4nLFxuICAnJiMxNzQ7JzogJ8KuJyxcbiAgJyZoZWxsaXA7JzogJ+KApicsXG4gICcmIzgyMzA7JzogJ+KApicsXG4gICcmI3gyRjsnOiAnLycsXG4gICcmIzQ3Oyc6ICcvJ1xufTtcbmNvbnN0IHVuZXNjYXBlSHRtbEVudGl0eSA9IG0gPT4gaHRtbEVudGl0aWVzW21dO1xuZXhwb3J0IGNvbnN0IHVuZXNjYXBlID0gdGV4dCA9PiB0ZXh0LnJlcGxhY2UobWF0Y2hIdG1sRW50aXR5LCB1bmVzY2FwZUh0bWxFbnRpdHkpOyIsImltcG9ydCB7IHVuZXNjYXBlIH0gZnJvbSAnLi91bmVzY2FwZS5qcyc7XG5sZXQgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIGJpbmRJMThuOiAnbGFuZ3VhZ2VDaGFuZ2VkJyxcbiAgYmluZEkxOG5TdG9yZTogJycsXG4gIHRyYW5zRW1wdHlOb2RlVmFsdWU6ICcnLFxuICB0cmFuc1N1cHBvcnRCYXNpY0h0bWxOb2RlczogdHJ1ZSxcbiAgdHJhbnNXcmFwVGV4dE5vZGVzOiAnJyxcbiAgdHJhbnNLZWVwQmFzaWNIdG1sTm9kZXNGb3I6IFsnYnInLCAnc3Ryb25nJywgJ2knLCAncCddLFxuICB1c2VTdXNwZW5zZTogdHJ1ZSxcbiAgdW5lc2NhcGUsXG4gIHRyYW5zRGVmYXVsdFByb3BzOiB1bmRlZmluZWRcbn07XG5leHBvcnQgY29uc3Qgc2V0RGVmYXVsdHMgPSAob3B0aW9ucyA9IHt9KSA9PiB7XG4gIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIC4uLmRlZmF1bHRPcHRpb25zLFxuICAgIC4uLm9wdGlvbnNcbiAgfTtcbn07XG5leHBvcnQgY29uc3QgZ2V0RGVmYXVsdHMgPSAoKSA9PiBkZWZhdWx0T3B0aW9uczsiLCJsZXQgaTE4bkluc3RhbmNlO1xuZXhwb3J0IGNvbnN0IHNldEkxOG4gPSBpbnN0YW5jZSA9PiB7XG4gIGkxOG5JbnN0YW5jZSA9IGluc3RhbmNlO1xufTtcbmV4cG9ydCBjb25zdCBnZXRJMThuID0gKCkgPT4gaTE4bkluc3RhbmNlOyIsImltcG9ydCB7IEZyYWdtZW50LCBpc1ZhbGlkRWxlbWVudCwgY2xvbmVFbGVtZW50LCBjcmVhdGVFbGVtZW50LCBDaGlsZHJlbiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGtleUZyb21TZWxlY3RvciB9IGZyb20gJ2kxOG5leHQnO1xuaW1wb3J0IEhUTUwgZnJvbSAnaHRtbC1wYXJzZS1zdHJpbmdpZnknO1xuaW1wb3J0IHsgaXNPYmplY3QsIGlzU3RyaW5nLCB3YXJuLCB3YXJuT25jZSB9IGZyb20gJy4vdXRpbHMuanMnO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdHMgfSBmcm9tICcuL2RlZmF1bHRzLmpzJztcbmltcG9ydCB7IGdldEkxOG4gfSBmcm9tICcuL2kxOG5JbnN0YW5jZS5qcyc7XG5pbXBvcnQgeyB1bmVzY2FwZSB9IGZyb20gJy4vdW5lc2NhcGUuanMnO1xuY29uc3QgaGFzQ2hpbGRyZW4gPSAobm9kZSwgY2hlY2tMZW5ndGgpID0+IHtcbiAgaWYgKCFub2RlKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGJhc2UgPSBub2RlLnByb3BzPy5jaGlsZHJlbiA/PyBub2RlLmNoaWxkcmVuO1xuICBpZiAoY2hlY2tMZW5ndGgpIHJldHVybiBiYXNlLmxlbmd0aCA+IDA7XG4gIHJldHVybiAhIWJhc2U7XG59O1xuY29uc3QgZ2V0Q2hpbGRyZW4gPSBub2RlID0+IHtcbiAgaWYgKCFub2RlKSByZXR1cm4gW107XG4gIGNvbnN0IGNoaWxkcmVuID0gbm9kZS5wcm9wcz8uY2hpbGRyZW4gPz8gbm9kZS5jaGlsZHJlbjtcbiAgcmV0dXJuIG5vZGUucHJvcHM/LmkxOG5Jc0R5bmFtaWNMaXN0ID8gZ2V0QXNBcnJheShjaGlsZHJlbikgOiBjaGlsZHJlbjtcbn07XG5jb25zdCBoYXNWYWxpZFJlYWN0Q2hpbGRyZW4gPSBjaGlsZHJlbiA9PiBBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5ldmVyeShpc1ZhbGlkRWxlbWVudCk7XG5jb25zdCBnZXRBc0FycmF5ID0gZGF0YSA9PiBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXTtcbmNvbnN0IG1lcmdlUHJvcHMgPSAoc291cmNlLCB0YXJnZXQpID0+IHtcbiAgY29uc3QgbmV3VGFyZ2V0ID0ge1xuICAgIC4uLnRhcmdldFxuICB9O1xuICBuZXdUYXJnZXQucHJvcHMgPSB7XG4gICAgLi4udGFyZ2V0LnByb3BzLFxuICAgIC4uLnNvdXJjZS5wcm9wc1xuICB9O1xuICByZXR1cm4gbmV3VGFyZ2V0O1xufTtcbmNvbnN0IGdldFZhbHVlc0Zyb21DaGlsZHJlbiA9IGNoaWxkcmVuID0+IHtcbiAgY29uc3QgdmFsdWVzID0ge307XG4gIGlmICghY2hpbGRyZW4pIHJldHVybiB2YWx1ZXM7XG4gIGNvbnN0IGdldERhdGEgPSBjaGlsZHMgPT4ge1xuICAgIGNvbnN0IGNoaWxkcmVuQXJyYXkgPSBnZXRBc0FycmF5KGNoaWxkcyk7XG4gICAgY2hpbGRyZW5BcnJheS5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGlmIChpc1N0cmluZyhjaGlsZCkpIHJldHVybjtcbiAgICAgIGlmIChoYXNDaGlsZHJlbihjaGlsZCkpIGdldERhdGEoZ2V0Q2hpbGRyZW4oY2hpbGQpKTtlbHNlIGlmIChpc09iamVjdChjaGlsZCkgJiYgIWlzVmFsaWRFbGVtZW50KGNoaWxkKSkgT2JqZWN0LmFzc2lnbih2YWx1ZXMsIGNoaWxkKTtcbiAgICB9KTtcbiAgfTtcbiAgZ2V0RGF0YShjaGlsZHJlbik7XG4gIHJldHVybiB2YWx1ZXM7XG59O1xuZXhwb3J0IGNvbnN0IG5vZGVzVG9TdHJpbmcgPSAoY2hpbGRyZW4sIGkxOG5PcHRpb25zLCBpMThuLCBpMThuS2V5KSA9PiB7XG4gIGlmICghY2hpbGRyZW4pIHJldHVybiAnJztcbiAgbGV0IHN0cmluZ05vZGUgPSAnJztcbiAgY29uc3QgY2hpbGRyZW5BcnJheSA9IGdldEFzQXJyYXkoY2hpbGRyZW4pO1xuICBjb25zdCBrZWVwQXJyYXkgPSBpMThuT3B0aW9ucz8udHJhbnNTdXBwb3J0QmFzaWNIdG1sTm9kZXMgPyBpMThuT3B0aW9ucy50cmFuc0tlZXBCYXNpY0h0bWxOb2Rlc0ZvciA/PyBbXSA6IFtdO1xuICBjaGlsZHJlbkFycmF5LmZvckVhY2goKGNoaWxkLCBjaGlsZEluZGV4KSA9PiB7XG4gICAgaWYgKGlzU3RyaW5nKGNoaWxkKSkge1xuICAgICAgc3RyaW5nTm9kZSArPSBgJHtjaGlsZH1gO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXNWYWxpZEVsZW1lbnQoY2hpbGQpKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHByb3BzLFxuICAgICAgICB0eXBlXG4gICAgICB9ID0gY2hpbGQ7XG4gICAgICBjb25zdCBjaGlsZFByb3BzQ291bnQgPSBPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoO1xuICAgICAgY29uc3Qgc2hvdWxkS2VlcENoaWxkID0ga2VlcEFycmF5LmluZGV4T2YodHlwZSkgPiAtMTtcbiAgICAgIGNvbnN0IGNoaWxkQ2hpbGRyZW4gPSBwcm9wcy5jaGlsZHJlbjtcbiAgICAgIGlmICghY2hpbGRDaGlsZHJlbiAmJiBzaG91bGRLZWVwQ2hpbGQgJiYgIWNoaWxkUHJvcHNDb3VudCkge1xuICAgICAgICBzdHJpbmdOb2RlICs9IGA8JHt0eXBlfS8+YDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFjaGlsZENoaWxkcmVuICYmICghc2hvdWxkS2VlcENoaWxkIHx8IGNoaWxkUHJvcHNDb3VudCkgfHwgcHJvcHMuaTE4bklzRHluYW1pY0xpc3QpIHtcbiAgICAgICAgc3RyaW5nTm9kZSArPSBgPCR7Y2hpbGRJbmRleH0+PC8ke2NoaWxkSW5kZXh9PmA7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRLZWVwQ2hpbGQgJiYgY2hpbGRQcm9wc0NvdW50IDw9IDEpIHtcbiAgICAgICAgY29uc3QgY250ID0gaXNTdHJpbmcoY2hpbGRDaGlsZHJlbikgPyBjaGlsZENoaWxkcmVuIDogbm9kZXNUb1N0cmluZyhjaGlsZENoaWxkcmVuLCBpMThuT3B0aW9ucywgaTE4biwgaTE4bktleSk7XG4gICAgICAgIHN0cmluZ05vZGUgKz0gYDwke3R5cGV9PiR7Y250fTwvJHt0eXBlfT5gO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBjb250ZW50ID0gbm9kZXNUb1N0cmluZyhjaGlsZENoaWxkcmVuLCBpMThuT3B0aW9ucywgaTE4biwgaTE4bktleSk7XG4gICAgICBzdHJpbmdOb2RlICs9IGA8JHtjaGlsZEluZGV4fT4ke2NvbnRlbnR9PC8ke2NoaWxkSW5kZXh9PmA7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjaGlsZCA9PT0gbnVsbCkge1xuICAgICAgd2FybihpMThuLCAnVFJBTlNfTlVMTF9WQUxVRScsIGBQYXNzZWQgaW4gYSBudWxsIHZhbHVlIGFzIGNoaWxkYCwge1xuICAgICAgICBpMThuS2V5XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0KGNoaWxkKSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBmb3JtYXQsXG4gICAgICAgIC4uLmNsb25lXG4gICAgICB9ID0gY2hpbGQ7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoY2xvbmUpO1xuICAgICAgaWYgKGtleXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZm9ybWF0ID8gYCR7a2V5c1swXX0sICR7Zm9ybWF0fWAgOiBrZXlzWzBdO1xuICAgICAgICBzdHJpbmdOb2RlICs9IGB7eyR7dmFsdWV9fX1gO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3YXJuKGkxOG4sICdUUkFOU19JTlZBTElEX09CSicsIGBJbnZhbGlkIGNoaWxkIC0gT2JqZWN0IHNob3VsZCBvbmx5IGhhdmUga2V5cyB7eyB2YWx1ZSwgZm9ybWF0IH19IChmb3JtYXQgaXMgb3B0aW9uYWwpLmAsIHtcbiAgICAgICAgaTE4bktleSxcbiAgICAgICAgY2hpbGRcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB3YXJuKGkxOG4sICdUUkFOU19JTlZBTElEX1ZBUicsIGBQYXNzZWQgaW4gYSB2YXJpYWJsZSBsaWtlIHtudW1iZXJ9IC0gcGFzcyB2YXJpYWJsZXMgZm9yIGludGVycG9sYXRpb24gYXMgZnVsbCBvYmplY3RzIGxpa2Uge3tudW1iZXJ9fS5gLCB7XG4gICAgICBpMThuS2V5LFxuICAgICAgY2hpbGRcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBzdHJpbmdOb2RlO1xufTtcbmNvbnN0IGVzY2FwZUxpdGVyYWxMZXNzVGhhbiA9IChzdHIsIGtlZXBBcnJheSA9IFtdLCBrbm93bkNvbXBvbmVudHNNYXAgPSB7fSkgPT4ge1xuICBpZiAoIXN0cikgcmV0dXJuIHN0cjtcbiAgY29uc3Qga25vd25OYW1lcyA9IE9iamVjdC5rZXlzKGtub3duQ29tcG9uZW50c01hcCk7XG4gIGNvbnN0IGFsbFZhbGlkTmFtZXMgPSBbLi4ua2VlcEFycmF5LCAuLi5rbm93bk5hbWVzXTtcbiAgbGV0IHJlc3VsdCA9ICcnO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgc3RyLmxlbmd0aCkge1xuICAgIGlmIChzdHJbaV0gPT09ICc8Jykge1xuICAgICAgbGV0IGlzVmFsaWRUYWcgPSBmYWxzZTtcbiAgICAgIGNvbnN0IGNsb3NpbmdNYXRjaCA9IHN0ci5zbGljZShpKS5tYXRjaCgvXjxcXC8oXFxkK3xbYS16QS1aXVthLXpBLVowLTlfLV0qKT4vKTtcbiAgICAgIGlmIChjbG9zaW5nTWF0Y2gpIHtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IGNsb3NpbmdNYXRjaFsxXTtcbiAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QodGFnTmFtZSkgfHwgYWxsVmFsaWROYW1lcy5pbmNsdWRlcyh0YWdOYW1lKSkge1xuICAgICAgICAgIGlzVmFsaWRUYWcgPSB0cnVlO1xuICAgICAgICAgIHJlc3VsdCArPSBjbG9zaW5nTWF0Y2hbMF07XG4gICAgICAgICAgaSArPSBjbG9zaW5nTWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWlzVmFsaWRUYWcpIHtcbiAgICAgICAgY29uc3Qgb3BlbmluZ01hdGNoID0gc3RyLnNsaWNlKGkpLm1hdGNoKC9ePChcXGQrfFthLXpBLVpdW2EtekEtWjAtOV8tXSopKFxccytbXFx3LV0rKD86PSg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXlxccz5dKykpPykqXFxzKihcXC8pPz4vKTtcbiAgICAgICAgaWYgKG9wZW5pbmdNYXRjaCkge1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBvcGVuaW5nTWF0Y2hbMV07XG4gICAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QodGFnTmFtZSkgfHwgYWxsVmFsaWROYW1lcy5pbmNsdWRlcyh0YWdOYW1lKSkge1xuICAgICAgICAgICAgaXNWYWxpZFRhZyA9IHRydWU7XG4gICAgICAgICAgICByZXN1bHQgKz0gb3BlbmluZ01hdGNoWzBdO1xuICAgICAgICAgICAgaSArPSBvcGVuaW5nTWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFpc1ZhbGlkVGFnKSB7XG4gICAgICAgIHJlc3VsdCArPSAnJmx0Oyc7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IHN0cltpXTtcbiAgICAgIGkgKz0gMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5jb25zdCByZW5kZXJOb2RlcyA9IChjaGlsZHJlbiwga25vd25Db21wb25lbnRzTWFwLCB0YXJnZXRTdHJpbmcsIGkxOG4sIGkxOG5PcHRpb25zLCBjb21iaW5lZFRPcHRzLCBzaG91bGRVbmVzY2FwZSkgPT4ge1xuICBpZiAodGFyZ2V0U3RyaW5nID09PSAnJykgcmV0dXJuIFtdO1xuICBjb25zdCBrZWVwQXJyYXkgPSBpMThuT3B0aW9ucy50cmFuc0tlZXBCYXNpY0h0bWxOb2Rlc0ZvciB8fCBbXTtcbiAgY29uc3QgZW1wdHlDaGlsZHJlbkJ1dE5lZWRzSGFuZGxpbmcgPSB0YXJnZXRTdHJpbmcgJiYgbmV3IFJlZ0V4cChrZWVwQXJyYXkubWFwKGtlZXAgPT4gYDwke2tlZXB9YCkuam9pbignfCcpKS50ZXN0KHRhcmdldFN0cmluZyk7XG4gIGlmICghY2hpbGRyZW4gJiYgIWtub3duQ29tcG9uZW50c01hcCAmJiAhZW1wdHlDaGlsZHJlbkJ1dE5lZWRzSGFuZGxpbmcgJiYgIXNob3VsZFVuZXNjYXBlKSByZXR1cm4gW3RhcmdldFN0cmluZ107XG4gIGNvbnN0IGRhdGEgPSBrbm93bkNvbXBvbmVudHNNYXAgPz8ge307XG4gIGNvbnN0IGdldERhdGEgPSBjaGlsZHMgPT4ge1xuICAgIGNvbnN0IGNoaWxkcmVuQXJyYXkgPSBnZXRBc0FycmF5KGNoaWxkcyk7XG4gICAgY2hpbGRyZW5BcnJheS5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGlmIChpc1N0cmluZyhjaGlsZCkpIHJldHVybjtcbiAgICAgIGlmIChoYXNDaGlsZHJlbihjaGlsZCkpIGdldERhdGEoZ2V0Q2hpbGRyZW4oY2hpbGQpKTtlbHNlIGlmIChpc09iamVjdChjaGlsZCkgJiYgIWlzVmFsaWRFbGVtZW50KGNoaWxkKSkgT2JqZWN0LmFzc2lnbihkYXRhLCBjaGlsZCk7XG4gICAgfSk7XG4gIH07XG4gIGdldERhdGEoY2hpbGRyZW4pO1xuICBjb25zdCBlc2NhcGVkU3RyaW5nID0gZXNjYXBlTGl0ZXJhbExlc3NUaGFuKHRhcmdldFN0cmluZywga2VlcEFycmF5LCBkYXRhKTtcbiAgY29uc3QgYXN0ID0gSFRNTC5wYXJzZShgPDA+JHtlc2NhcGVkU3RyaW5nfTwvMD5gKTtcbiAgY29uc3Qgb3B0cyA9IHtcbiAgICAuLi5kYXRhLFxuICAgIC4uLmNvbWJpbmVkVE9wdHNcbiAgfTtcbiAgY29uc3QgcmVuZGVySW5uZXIgPSAoY2hpbGQsIG5vZGUsIHJvb3RSZWFjdE5vZGUpID0+IHtcbiAgICBjb25zdCBjaGlsZHMgPSBnZXRDaGlsZHJlbihjaGlsZCk7XG4gICAgY29uc3QgbWFwcGVkQ2hpbGRyZW4gPSBtYXBBU1QoY2hpbGRzLCBub2RlLmNoaWxkcmVuLCByb290UmVhY3ROb2RlKTtcbiAgICByZXR1cm4gaGFzVmFsaWRSZWFjdENoaWxkcmVuKGNoaWxkcykgJiYgbWFwcGVkQ2hpbGRyZW4ubGVuZ3RoID09PSAwIHx8IGNoaWxkLnByb3BzPy5pMThuSXNEeW5hbWljTGlzdCA/IGNoaWxkcyA6IG1hcHBlZENoaWxkcmVuO1xuICB9O1xuICBjb25zdCBwdXNoVHJhbnNsYXRlZEpTWCA9IChjaGlsZCwgaW5uZXIsIG1lbSwgaSwgaXNWb2lkKSA9PiB7XG4gICAgaWYgKGNoaWxkLmR1bW15KSB7XG4gICAgICBjaGlsZC5jaGlsZHJlbiA9IGlubmVyO1xuICAgICAgbWVtLnB1c2goY2xvbmVFbGVtZW50KGNoaWxkLCB7XG4gICAgICAgIGtleTogaVxuICAgICAgfSwgaXNWb2lkID8gdW5kZWZpbmVkIDogaW5uZXIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVtLnB1c2goLi4uQ2hpbGRyZW4ubWFwKFtjaGlsZF0sIGMgPT4ge1xuICAgICAgICBpZiAoYy50eXBlID09PSBGcmFnbWVudCB8fCBjLnByb3BzPy5pMThuSXNEeW5hbWljTGlzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgZnJlc2hQcm9wcyA9IHtcbiAgICAgICAgICAgIGtleTogaVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGMgJiYgYy5wcm9wcykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoYy5wcm9wcykuZm9yRWFjaChrID0+IHtcbiAgICAgICAgICAgICAgaWYgKGsgPT09ICdjaGlsZHJlbicgfHwgayA9PT0gJ2kxOG5Jc0R5bmFtaWNMaXN0JykgcmV0dXJuO1xuICAgICAgICAgICAgICBmcmVzaFByb3BzW2tdID0gYy5wcm9wc1trXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudChjLnR5cGUsIGZyZXNoUHJvcHMsIGlzVm9pZCA/IG51bGwgOiBpbm5lcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSB7XG4gICAgICAgICAga2V5OiBpXG4gICAgICAgIH07XG4gICAgICAgIGlmIChjICYmIGMucHJvcHMpIHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhjLnByb3BzKS5mb3JFYWNoKGsgPT4ge1xuICAgICAgICAgICAgaWYgKGsgPT09ICdyZWYnIHx8IGsgPT09ICdjaGlsZHJlbicpIHJldHVybjtcbiAgICAgICAgICAgIG92ZXJyaWRlW2tdID0gYy5wcm9wc1trXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvbmVFbGVtZW50KGMsIG92ZXJyaWRlLCBpc1ZvaWQgPyBudWxsIDogaW5uZXIpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgbWFwQVNUID0gKHJlYWN0Tm9kZSwgYXN0Tm9kZSwgcm9vdFJlYWN0Tm9kZSkgPT4ge1xuICAgIGNvbnN0IHJlYWN0Tm9kZXMgPSBnZXRBc0FycmF5KHJlYWN0Tm9kZSk7XG4gICAgY29uc3QgYXN0Tm9kZXMgPSBnZXRBc0FycmF5KGFzdE5vZGUpO1xuICAgIGNvbnN0IGtlZXBUYWdPY2N1cnJlbmNlID0ge307XG4gICAgcmV0dXJuIGFzdE5vZGVzLnJlZHVjZSgobWVtLCBub2RlLCBpKSA9PiB7XG4gICAgICBjb25zdCB0cmFuc2xhdGlvbkNvbnRlbnQgPSBub2RlLmNoaWxkcmVuPy5bMF0/LmNvbnRlbnQgJiYgaTE4bi5zZXJ2aWNlcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUobm9kZS5jaGlsZHJlblswXS5jb250ZW50LCBvcHRzLCBpMThuLmxhbmd1YWdlKTtcbiAgICAgIGlmIChub2RlLnR5cGUgPT09ICd0YWcnKSB7XG4gICAgICAgIGxldCB0bXAgPSByZWFjdE5vZGVzW3BhcnNlSW50KG5vZGUubmFtZSwgMTApXTtcbiAgICAgICAgaWYgKCF0bXAgJiYga25vd25Db21wb25lbnRzTWFwKSB0bXAgPSBrbm93bkNvbXBvbmVudHNNYXBbbm9kZS5uYW1lXTtcbiAgICAgICAgaWYgKHJvb3RSZWFjdE5vZGUubGVuZ3RoID09PSAxICYmICF0bXApIHRtcCA9IHJvb3RSZWFjdE5vZGVbMF1bbm9kZS5uYW1lXTtcbiAgICAgICAgaWYgKCF0bXApIHRtcCA9IHt9O1xuICAgICAgICBjb25zdCBwcm9wcyA9IHtcbiAgICAgICAgICAuLi5ub2RlLmF0dHJzXG4gICAgICAgIH07XG4gICAgICAgIGlmIChzaG91bGRVbmVzY2FwZSkge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gcHJvcHNbcF07XG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgICAgICBwcm9wc1twXSA9IHVuZXNjYXBlKHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2hpbGQgPSBPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoICE9PSAwID8gbWVyZ2VQcm9wcyh7XG4gICAgICAgICAgcHJvcHNcbiAgICAgICAgfSwgdG1wKSA6IHRtcDtcbiAgICAgICAgY29uc3QgaXNFbGVtZW50ID0gaXNWYWxpZEVsZW1lbnQoY2hpbGQpO1xuICAgICAgICBjb25zdCBpc1ZhbGlkVHJhbnNsYXRpb25XaXRoQ2hpbGRyZW4gPSBpc0VsZW1lbnQgJiYgaGFzQ2hpbGRyZW4obm9kZSwgdHJ1ZSkgJiYgIW5vZGUudm9pZEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGlzRW1wdHlUcmFuc1dpdGhIVE1MID0gZW1wdHlDaGlsZHJlbkJ1dE5lZWRzSGFuZGxpbmcgJiYgaXNPYmplY3QoY2hpbGQpICYmIGNoaWxkLmR1bW15ICYmICFpc0VsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGlzS25vd25Db21wb25lbnQgPSBpc09iamVjdChrbm93bkNvbXBvbmVudHNNYXApICYmIE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGtub3duQ29tcG9uZW50c01hcCwgbm9kZS5uYW1lKTtcbiAgICAgICAgaWYgKGlzU3RyaW5nKGNoaWxkKSkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gaTE4bi5zZXJ2aWNlcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUoY2hpbGQsIG9wdHMsIGkxOG4ubGFuZ3VhZ2UpO1xuICAgICAgICAgIG1lbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNDaGlsZHJlbihjaGlsZCkgfHwgaXNWYWxpZFRyYW5zbGF0aW9uV2l0aENoaWxkcmVuKSB7XG4gICAgICAgICAgY29uc3QgaW5uZXIgPSByZW5kZXJJbm5lcihjaGlsZCwgbm9kZSwgcm9vdFJlYWN0Tm9kZSk7XG4gICAgICAgICAgcHVzaFRyYW5zbGF0ZWRKU1goY2hpbGQsIGlubmVyLCBtZW0sIGkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRW1wdHlUcmFuc1dpdGhIVE1MKSB7XG4gICAgICAgICAgY29uc3QgaW5uZXIgPSBtYXBBU1QocmVhY3ROb2Rlcywgbm9kZS5jaGlsZHJlbiwgcm9vdFJlYWN0Tm9kZSk7XG4gICAgICAgICAgcHVzaFRyYW5zbGF0ZWRKU1goY2hpbGQsIGlubmVyLCBtZW0sIGkpO1xuICAgICAgICB9IGVsc2UgaWYgKE51bWJlci5pc05hTihwYXJzZUZsb2F0KG5vZGUubmFtZSkpKSB7XG4gICAgICAgICAgaWYgKGlzS25vd25Db21wb25lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGlubmVyID0gcmVuZGVySW5uZXIoY2hpbGQsIG5vZGUsIHJvb3RSZWFjdE5vZGUpO1xuICAgICAgICAgICAgcHVzaFRyYW5zbGF0ZWRKU1goY2hpbGQsIGlubmVyLCBtZW0sIGksIG5vZGUudm9pZEVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaTE4bk9wdGlvbnMudHJhbnNTdXBwb3J0QmFzaWNIdG1sTm9kZXMgJiYga2VlcEFycmF5LmluZGV4T2Yobm9kZS5uYW1lKSA+IC0xKSB7XG4gICAgICAgICAgICBpZiAobm9kZS52b2lkRWxlbWVudCkge1xuICAgICAgICAgICAgICBtZW0ucHVzaChjcmVhdGVFbGVtZW50KG5vZGUubmFtZSwge1xuICAgICAgICAgICAgICAgIGtleTogYCR7bm9kZS5uYW1lfS0ke2l9YFxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCBvY2N1cnJlbmNlID0ga2VlcFRhZ09jY3VycmVuY2Vbbm9kZS5uYW1lXSB8fCAwO1xuICAgICAgICAgICAgICBrZWVwVGFnT2NjdXJyZW5jZVtub2RlLm5hbWVdID0gb2NjdXJyZW5jZSArIDE7XG4gICAgICAgICAgICAgIGxldCBtYXRjaGVkO1xuICAgICAgICAgICAgICBsZXQgc2VlbiA9IDA7XG4gICAgICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgcmVhY3ROb2Rlcy5sZW5ndGg7IHIgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJuID0gcmVhY3ROb2Rlc1tyXTtcbiAgICAgICAgICAgICAgICBpZiAoaXNWYWxpZEVsZW1lbnQocm4pICYmIHJuLnR5cGUgPT09IG5vZGUubmFtZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKHNlZW4gPT09IG9jY3VycmVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHJuO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHNlZW4gKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgaW5uZXJTY29wZSA9IG1hdGNoZWQgPyBnZXRBc0FycmF5KGdldENoaWxkcmVuKG1hdGNoZWQpKSA6IHJlYWN0Tm9kZXM7XG4gICAgICAgICAgICAgIGNvbnN0IGlubmVyID0gbWFwQVNUKGlubmVyU2NvcGUsIG5vZGUuY2hpbGRyZW4sIHJvb3RSZWFjdE5vZGUpO1xuICAgICAgICAgICAgICBtZW0ucHVzaChjcmVhdGVFbGVtZW50KG5vZGUubmFtZSwge1xuICAgICAgICAgICAgICAgIGtleTogYCR7bm9kZS5uYW1lfS0ke2l9YFxuICAgICAgICAgICAgICB9LCBpbm5lcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS52b2lkRWxlbWVudCkge1xuICAgICAgICAgICAgbWVtLnB1c2goYDwke25vZGUubmFtZX0gLz5gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW5uZXIgPSBtYXBBU1QocmVhY3ROb2Rlcywgbm9kZS5jaGlsZHJlbiwgcm9vdFJlYWN0Tm9kZSk7XG4gICAgICAgICAgICBtZW0ucHVzaChgPCR7bm9kZS5uYW1lfT4ke2lubmVyfTwvJHtub2RlLm5hbWV9PmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpc09iamVjdChjaGlsZCkgJiYgIWlzRWxlbWVudCkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBub2RlLmNoaWxkcmVuWzBdID8gdHJhbnNsYXRpb25Db250ZW50IDogbnVsbDtcbiAgICAgICAgICBpZiAoY29udGVudCkgbWVtLnB1c2goY29udGVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHVzaFRyYW5zbGF0ZWRKU1goY2hpbGQsIHRyYW5zbGF0aW9uQ29udGVudCwgbWVtLCBpLCBub2RlLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCAhdHJhbnNsYXRpb25Db250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICBjb25zdCB3cmFwVGV4dE5vZGVzID0gaTE4bk9wdGlvbnMudHJhbnNXcmFwVGV4dE5vZGVzO1xuICAgICAgICBjb25zdCB1bmVzY2FwZUZuID0gdHlwZW9mIGkxOG5PcHRpb25zLnVuZXNjYXBlID09PSAnZnVuY3Rpb24nID8gaTE4bk9wdGlvbnMudW5lc2NhcGUgOiBnZXREZWZhdWx0cygpLnVuZXNjYXBlO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gc2hvdWxkVW5lc2NhcGUgPyB1bmVzY2FwZUZuKGkxOG4uc2VydmljZXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKG5vZGUuY29udGVudCwgb3B0cywgaTE4bi5sYW5ndWFnZSkpIDogaTE4bi5zZXJ2aWNlcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUobm9kZS5jb250ZW50LCBvcHRzLCBpMThuLmxhbmd1YWdlKTtcbiAgICAgICAgaWYgKHdyYXBUZXh0Tm9kZXMpIHtcbiAgICAgICAgICBtZW0ucHVzaChjcmVhdGVFbGVtZW50KHdyYXBUZXh0Tm9kZXMsIHtcbiAgICAgICAgICAgIGtleTogYCR7bm9kZS5uYW1lfS0ke2l9YFxuICAgICAgICAgIH0sIGNvbnRlbnQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtZW0ucHVzaChjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbTtcbiAgICB9LCBbXSk7XG4gIH07XG4gIGNvbnN0IHJlc3VsdCA9IG1hcEFTVChbe1xuICAgIGR1bW15OiB0cnVlLFxuICAgIGNoaWxkcmVuOiBjaGlsZHJlbiB8fCBbXVxuICB9XSwgYXN0LCBnZXRBc0FycmF5KGNoaWxkcmVuIHx8IFtdKSk7XG4gIHJldHVybiBnZXRDaGlsZHJlbihyZXN1bHRbMF0pO1xufTtcbmNvbnN0IGZpeENvbXBvbmVudFByb3BzID0gKGNvbXBvbmVudCwgaW5kZXgsIHRyYW5zbGF0aW9uKSA9PiB7XG4gIGNvbnN0IGNvbXBvbmVudEtleSA9IGNvbXBvbmVudC5rZXkgfHwgaW5kZXg7XG4gIGNvbnN0IGNvbXAgPSBjbG9uZUVsZW1lbnQoY29tcG9uZW50LCB7XG4gICAga2V5OiBjb21wb25lbnRLZXlcbiAgfSk7XG4gIGlmICghY29tcC5wcm9wcyB8fCAhY29tcC5wcm9wcy5jaGlsZHJlbiB8fCB0cmFuc2xhdGlvbi5pbmRleE9mKGAke2luZGV4fS8+YCkgPCAwICYmIHRyYW5zbGF0aW9uLmluZGV4T2YoYCR7aW5kZXh9IC8+YCkgPCAwKSB7XG4gICAgcmV0dXJuIGNvbXA7XG4gIH1cbiAgZnVuY3Rpb24gQ29tcG9uZW50aXplZCgpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudChGcmFnbWVudCwgbnVsbCwgY29tcCk7XG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnQoQ29tcG9uZW50aXplZCwge1xuICAgIGtleTogY29tcG9uZW50S2V5XG4gIH0pO1xufTtcbmNvbnN0IGdlbmVyYXRlQXJyYXlDb21wb25lbnRzID0gKGNvbXBvbmVudHMsIHRyYW5zbGF0aW9uKSA9PiBjb21wb25lbnRzLm1hcCgoYywgaW5kZXgpID0+IGZpeENvbXBvbmVudFByb3BzKGMsIGluZGV4LCB0cmFuc2xhdGlvbikpO1xuY29uc3QgZ2VuZXJhdGVPYmplY3RDb21wb25lbnRzID0gKGNvbXBvbmVudHMsIHRyYW5zbGF0aW9uKSA9PiB7XG4gIGNvbnN0IGNvbXBvbmVudE1hcCA9IHt9O1xuICBPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKGMgPT4ge1xuICAgIE9iamVjdC5hc3NpZ24oY29tcG9uZW50TWFwLCB7XG4gICAgICBbY106IGZpeENvbXBvbmVudFByb3BzKGNvbXBvbmVudHNbY10sIGMsIHRyYW5zbGF0aW9uKVxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIGNvbXBvbmVudE1hcDtcbn07XG5jb25zdCBnZW5lcmF0ZUNvbXBvbmVudHMgPSAoY29tcG9uZW50cywgdHJhbnNsYXRpb24sIGkxOG4sIGkxOG5LZXkpID0+IHtcbiAgaWYgKCFjb21wb25lbnRzKSByZXR1cm4gbnVsbDtcbiAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVBcnJheUNvbXBvbmVudHMoY29tcG9uZW50cywgdHJhbnNsYXRpb24pO1xuICB9XG4gIGlmIChpc09iamVjdChjb21wb25lbnRzKSkge1xuICAgIHJldHVybiBnZW5lcmF0ZU9iamVjdENvbXBvbmVudHMoY29tcG9uZW50cywgdHJhbnNsYXRpb24pO1xuICB9XG4gIHdhcm5PbmNlKGkxOG4sICdUUkFOU19JTlZBTElEX0NPTVBPTkVOVFMnLCBgPFRyYW5zIC8+IFwiY29tcG9uZW50c1wiIHByb3AgZXhwZWN0cyBhbiBvYmplY3Qgb3IgYXJyYXlgLCB7XG4gICAgaTE4bktleVxuICB9KTtcbiAgcmV0dXJuIG51bGw7XG59O1xuY29uc3QgaXNDb21wb25lbnRzTWFwID0gb2JqZWN0ID0+IHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSByZXR1cm4gZmFsc2U7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkucmVkdWNlKChhY2MsIGtleSkgPT4gYWNjICYmIE51bWJlci5pc05hTihOdW1iZXIucGFyc2VGbG9hdChrZXkpKSwgdHJ1ZSk7XG59O1xuZXhwb3J0IGZ1bmN0aW9uIFRyYW5zKHtcbiAgY2hpbGRyZW4sXG4gIGNvdW50LFxuICBwYXJlbnQsXG4gIGkxOG5LZXksXG4gIGNvbnRleHQsXG4gIHRPcHRpb25zID0ge30sXG4gIHZhbHVlcyxcbiAgZGVmYXVsdHMsXG4gIGNvbXBvbmVudHMsXG4gIG5zLFxuICBpMThuOiBpMThuRnJvbVByb3BzLFxuICB0OiB0RnJvbVByb3BzLFxuICBzaG91bGRVbmVzY2FwZSxcbiAgLi4uYWRkaXRpb25hbFByb3BzXG59KSB7XG4gIGNvbnN0IGkxOG4gPSBpMThuRnJvbVByb3BzIHx8IGdldEkxOG4oKTtcbiAgaWYgKCFpMThuKSB7XG4gICAgd2Fybk9uY2UoaTE4biwgJ05PX0kxOE5FWFRfSU5TVEFOQ0UnLCBgVHJhbnM6IFlvdSBuZWVkIHRvIHBhc3MgaW4gYW4gaTE4bmV4dCBpbnN0YW5jZSB1c2luZyBpMThuZXh0UmVhY3RNb2R1bGVgLCB7XG4gICAgICBpMThuS2V5XG4gICAgfSk7XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG4gIGNvbnN0IHQgPSB0RnJvbVByb3BzIHx8IGkxOG4udC5iaW5kKGkxOG4pIHx8IChrID0+IGspO1xuICBjb25zdCByZWFjdEkxOG5leHRPcHRpb25zID0ge1xuICAgIC4uLmdldERlZmF1bHRzKCksXG4gICAgLi4uaTE4bi5vcHRpb25zPy5yZWFjdFxuICB9O1xuICBsZXQgbmFtZXNwYWNlcyA9IG5zIHx8IHQubnMgfHwgaTE4bi5vcHRpb25zPy5kZWZhdWx0TlM7XG4gIG5hbWVzcGFjZXMgPSBpc1N0cmluZyhuYW1lc3BhY2VzKSA/IFtuYW1lc3BhY2VzXSA6IG5hbWVzcGFjZXMgfHwgWyd0cmFuc2xhdGlvbiddO1xuICBjb25zdCB7XG4gICAgdHJhbnNEZWZhdWx0UHJvcHNcbiAgfSA9IHJlYWN0STE4bmV4dE9wdGlvbnM7XG4gIGNvbnN0IG1lcmdlZFRPcHRpb25zID0gdHJhbnNEZWZhdWx0UHJvcHM/LnRPcHRpb25zID8ge1xuICAgIC4uLnRyYW5zRGVmYXVsdFByb3BzLnRPcHRpb25zLFxuICAgIC4uLnRPcHRpb25zXG4gIH0gOiB0T3B0aW9ucztcbiAgY29uc3QgbWVyZ2VkU2hvdWxkVW5lc2NhcGUgPSBzaG91bGRVbmVzY2FwZSA/PyB0cmFuc0RlZmF1bHRQcm9wcz8uc2hvdWxkVW5lc2NhcGU7XG4gIGNvbnN0IG1lcmdlZFZhbHVlcyA9IHRyYW5zRGVmYXVsdFByb3BzPy52YWx1ZXMgPyB7XG4gICAgLi4udHJhbnNEZWZhdWx0UHJvcHMudmFsdWVzLFxuICAgIC4uLnZhbHVlc1xuICB9IDogdmFsdWVzO1xuICBjb25zdCBtZXJnZWRDb21wb25lbnRzID0gdHJhbnNEZWZhdWx0UHJvcHM/LmNvbXBvbmVudHMgPyB7XG4gICAgLi4udHJhbnNEZWZhdWx0UHJvcHMuY29tcG9uZW50cyxcbiAgICAuLi5jb21wb25lbnRzXG4gIH0gOiBjb21wb25lbnRzO1xuICBjb25zdCBub2RlQXNTdHJpbmcgPSBub2Rlc1RvU3RyaW5nKGNoaWxkcmVuLCByZWFjdEkxOG5leHRPcHRpb25zLCBpMThuLCBpMThuS2V5KTtcbiAgY29uc3QgZGVmYXVsdFZhbHVlID0gZGVmYXVsdHMgfHwgbWVyZ2VkVE9wdGlvbnM/LmRlZmF1bHRWYWx1ZSB8fCBub2RlQXNTdHJpbmcgfHwgcmVhY3RJMThuZXh0T3B0aW9ucy50cmFuc0VtcHR5Tm9kZVZhbHVlIHx8ICh0eXBlb2YgaTE4bktleSA9PT0gJ2Z1bmN0aW9uJyA/IGtleUZyb21TZWxlY3RvcihpMThuS2V5KSA6IGkxOG5LZXkpO1xuICBjb25zdCB7XG4gICAgaGFzaFRyYW5zS2V5XG4gIH0gPSByZWFjdEkxOG5leHRPcHRpb25zO1xuICBjb25zdCBrZXkgPSBpMThuS2V5IHx8IChoYXNoVHJhbnNLZXkgPyBoYXNoVHJhbnNLZXkobm9kZUFzU3RyaW5nIHx8IGRlZmF1bHRWYWx1ZSkgOiBub2RlQXNTdHJpbmcgfHwgZGVmYXVsdFZhbHVlKTtcbiAgaWYgKGkxOG4ub3B0aW9ucz8uaW50ZXJwb2xhdGlvbj8uZGVmYXVsdFZhcmlhYmxlcykge1xuICAgIHZhbHVlcyA9IG1lcmdlZFZhbHVlcyAmJiBPYmplY3Qua2V5cyhtZXJnZWRWYWx1ZXMpLmxlbmd0aCA+IDAgPyB7XG4gICAgICAuLi5tZXJnZWRWYWx1ZXMsXG4gICAgICAuLi5pMThuLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzXG4gICAgfSA6IHtcbiAgICAgIC4uLmkxOG4ub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXNcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHZhbHVlcyA9IG1lcmdlZFZhbHVlcztcbiAgfVxuICBjb25zdCB2YWx1ZXNGcm9tQ2hpbGRyZW4gPSBnZXRWYWx1ZXNGcm9tQ2hpbGRyZW4oY2hpbGRyZW4pO1xuICBpZiAodmFsdWVzRnJvbUNoaWxkcmVuICYmIHR5cGVvZiB2YWx1ZXNGcm9tQ2hpbGRyZW4uY291bnQgPT09ICdudW1iZXInICYmIGNvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBjb3VudCA9IHZhbHVlc0Zyb21DaGlsZHJlbi5jb3VudDtcbiAgfVxuICBjb25zdCBpbnRlcnBvbGF0aW9uT3ZlcnJpZGUgPSB2YWx1ZXMgfHwgY291bnQgIT09IHVuZGVmaW5lZCAmJiAhaTE4bi5vcHRpb25zPy5pbnRlcnBvbGF0aW9uPy5hbHdheXNGb3JtYXQgfHwgIWNoaWxkcmVuID8gbWVyZ2VkVE9wdGlvbnMuaW50ZXJwb2xhdGlvbiA6IHtcbiAgICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgICAuLi5tZXJnZWRUT3B0aW9ucy5pbnRlcnBvbGF0aW9uLFxuICAgICAgcHJlZml4OiAnIyQ/JyxcbiAgICAgIHN1ZmZpeDogJz8kIydcbiAgICB9XG4gIH07XG4gIGNvbnN0IGNvbWJpbmVkVE9wdHMgPSB7XG4gICAgLi4ubWVyZ2VkVE9wdGlvbnMsXG4gICAgY29udGV4dDogY29udGV4dCB8fCBtZXJnZWRUT3B0aW9ucy5jb250ZXh0LFxuICAgIGNvdW50LFxuICAgIC4uLnZhbHVlcyxcbiAgICAuLi5pbnRlcnBvbGF0aW9uT3ZlcnJpZGUsXG4gICAgZGVmYXVsdFZhbHVlLFxuICAgIG5zOiBuYW1lc3BhY2VzXG4gIH07XG4gIGxldCB0cmFuc2xhdGlvbiA9IGtleSA/IHQoa2V5LCBjb21iaW5lZFRPcHRzKSA6IGRlZmF1bHRWYWx1ZTtcbiAgaWYgKHRyYW5zbGF0aW9uID09PSBrZXkgJiYgZGVmYXVsdFZhbHVlKSB0cmFuc2xhdGlvbiA9IGRlZmF1bHRWYWx1ZTtcbiAgY29uc3QgZ2VuZXJhdGVkQ29tcG9uZW50cyA9IGdlbmVyYXRlQ29tcG9uZW50cyhtZXJnZWRDb21wb25lbnRzLCB0cmFuc2xhdGlvbiwgaTE4biwgaTE4bktleSk7XG4gIGxldCBpbmRleGVkQ2hpbGRyZW4gPSBnZW5lcmF0ZWRDb21wb25lbnRzIHx8IGNoaWxkcmVuO1xuICBsZXQgY29tcG9uZW50c01hcCA9IG51bGw7XG4gIGlmIChpc0NvbXBvbmVudHNNYXAoZ2VuZXJhdGVkQ29tcG9uZW50cykpIHtcbiAgICBjb21wb25lbnRzTWFwID0gZ2VuZXJhdGVkQ29tcG9uZW50cztcbiAgICBpbmRleGVkQ2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gcmVuZGVyTm9kZXMoaW5kZXhlZENoaWxkcmVuLCBjb21wb25lbnRzTWFwLCB0cmFuc2xhdGlvbiwgaTE4biwgcmVhY3RJMThuZXh0T3B0aW9ucywgY29tYmluZWRUT3B0cywgbWVyZ2VkU2hvdWxkVW5lc2NhcGUpO1xuICBjb25zdCB1c2VBc1BhcmVudCA9IHBhcmVudCA/PyByZWFjdEkxOG5leHRPcHRpb25zLmRlZmF1bHRUcmFuc1BhcmVudDtcbiAgcmV0dXJuIHVzZUFzUGFyZW50ID8gY3JlYXRlRWxlbWVudCh1c2VBc1BhcmVudCwgYWRkaXRpb25hbFByb3BzLCBjb250ZW50KSA6IGNvbnRlbnQ7XG59IiwiaW1wb3J0IHsgc2V0RGVmYXVsdHMgfSBmcm9tICcuL2RlZmF1bHRzLmpzJztcbmltcG9ydCB7IHNldEkxOG4gfSBmcm9tICcuL2kxOG5JbnN0YW5jZS5qcyc7XG5leHBvcnQgY29uc3QgaW5pdFJlYWN0STE4bmV4dCA9IHtcbiAgdHlwZTogJzNyZFBhcnR5JyxcbiAgaW5pdChpbnN0YW5jZSkge1xuICAgIHNldERlZmF1bHRzKGluc3RhbmNlLm9wdGlvbnMucmVhY3QpO1xuICAgIHNldEkxOG4oaW5zdGFuY2UpO1xuICB9XG59OyIsImltcG9ydCB7IGNyZWF0ZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBnZXREZWZhdWx0cywgc2V0RGVmYXVsdHMgfSBmcm9tICcuL2RlZmF1bHRzLmpzJztcbmltcG9ydCB7IGdldEkxOG4sIHNldEkxOG4gfSBmcm9tICcuL2kxOG5JbnN0YW5jZS5qcyc7XG5pbXBvcnQgeyBpbml0UmVhY3RJMThuZXh0IH0gZnJvbSAnLi9pbml0UmVhY3RJMThuZXh0LmpzJztcbmV4cG9ydCB7IGdldERlZmF1bHRzLCBzZXREZWZhdWx0cywgZ2V0STE4biwgc2V0STE4biwgaW5pdFJlYWN0STE4bmV4dCB9O1xuZXhwb3J0IGNvbnN0IEkxOG5Db250ZXh0ID0gY3JlYXRlQ29udGV4dCgpO1xuZXhwb3J0IGNsYXNzIFJlcG9ydE5hbWVzcGFjZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnVzZWROYW1lc3BhY2VzID0ge307XG4gIH1cbiAgYWRkVXNlZE5hbWVzcGFjZXMobmFtZXNwYWNlcykge1xuICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICBpZiAoIXRoaXMudXNlZE5hbWVzcGFjZXNbbnNdKSB0aGlzLnVzZWROYW1lc3BhY2VzW25zXSA9IHRydWU7XG4gICAgfSk7XG4gIH1cbiAgZ2V0VXNlZE5hbWVzcGFjZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudXNlZE5hbWVzcGFjZXMpO1xuICB9XG59XG5leHBvcnQgY29uc3QgY29tcG9zZUluaXRpYWxQcm9wcyA9IEZvckNvbXBvbmVudCA9PiBhc3luYyBjdHggPT4ge1xuICBjb25zdCBjb21wb25lbnRzSW5pdGlhbFByb3BzID0gKGF3YWl0IEZvckNvbXBvbmVudC5nZXRJbml0aWFsUHJvcHM/LihjdHgpKSA/PyB7fTtcbiAgY29uc3QgaTE4bkluaXRpYWxQcm9wcyA9IGdldEluaXRpYWxQcm9wcygpO1xuICByZXR1cm4ge1xuICAgIC4uLmNvbXBvbmVudHNJbml0aWFsUHJvcHMsXG4gICAgLi4uaTE4bkluaXRpYWxQcm9wc1xuICB9O1xufTtcbmV4cG9ydCBjb25zdCBnZXRJbml0aWFsUHJvcHMgPSAoKSA9PiB7XG4gIGNvbnN0IGkxOG4gPSBnZXRJMThuKCk7XG4gIGlmICghaTE4bikge1xuICAgIGNvbnNvbGUud2FybigncmVhY3QtaTE4bmV4dDo6IGdldEluaXRpYWxQcm9wczogWW91IHdpbGwgbmVlZCB0byBwYXNzIGluIGFuIGkxOG5leHQgaW5zdGFuY2UgYnkgdXNpbmcgaW5pdFJlYWN0STE4bmV4dCcpO1xuICAgIHJldHVybiB7fTtcbiAgfVxuICBjb25zdCBuYW1lc3BhY2VzID0gaTE4bi5yZXBvcnROYW1lc3BhY2VzPy5nZXRVc2VkTmFtZXNwYWNlcygpID8/IFtdO1xuICBjb25zdCByZXQgPSB7fTtcbiAgY29uc3QgaW5pdGlhbEkxOG5TdG9yZSA9IHt9O1xuICBpMThuLmxhbmd1YWdlcy5mb3JFYWNoKGwgPT4ge1xuICAgIGluaXRpYWxJMThuU3RvcmVbbF0gPSB7fTtcbiAgICBuYW1lc3BhY2VzLmZvckVhY2gobnMgPT4ge1xuICAgICAgaW5pdGlhbEkxOG5TdG9yZVtsXVtuc10gPSBpMThuLmdldFJlc291cmNlQnVuZGxlKGwsIG5zKSB8fCB7fTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldC5pbml0aWFsSTE4blN0b3JlID0gaW5pdGlhbEkxOG5TdG9yZTtcbiAgcmV0LmluaXRpYWxMYW5ndWFnZSA9IGkxOG4ubGFuZ3VhZ2U7XG4gIHJldHVybiByZXQ7XG59OyIsImltcG9ydCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBub2Rlc1RvU3RyaW5nLCBUcmFucyBhcyBUcmFuc1dpdGhvdXRDb250ZXh0IH0gZnJvbSAnLi9UcmFuc1dpdGhvdXRDb250ZXh0LmpzJztcbmltcG9ydCB7IGdldEkxOG4sIEkxOG5Db250ZXh0IH0gZnJvbSAnLi9jb250ZXh0LmpzJztcbmV4cG9ydCB7IG5vZGVzVG9TdHJpbmcgfTtcbmV4cG9ydCBmdW5jdGlvbiBUcmFucyh7XG4gIGNoaWxkcmVuLFxuICBjb3VudCxcbiAgcGFyZW50LFxuICBpMThuS2V5LFxuICBjb250ZXh0LFxuICB0T3B0aW9ucyA9IHt9LFxuICB2YWx1ZXMsXG4gIGRlZmF1bHRzLFxuICBjb21wb25lbnRzLFxuICBucyxcbiAgaTE4bjogaTE4bkZyb21Qcm9wcyxcbiAgdDogdEZyb21Qcm9wcyxcbiAgc2hvdWxkVW5lc2NhcGUsXG4gIC4uLmFkZGl0aW9uYWxQcm9wc1xufSkge1xuICBjb25zdCB7XG4gICAgaTE4bjogaTE4bkZyb21Db250ZXh0LFxuICAgIGRlZmF1bHROUzogZGVmYXVsdE5TRnJvbUNvbnRleHRcbiAgfSA9IHVzZUNvbnRleHQoSTE4bkNvbnRleHQpIHx8IHt9O1xuICBjb25zdCBpMThuID0gaTE4bkZyb21Qcm9wcyB8fCBpMThuRnJvbUNvbnRleHQgfHwgZ2V0STE4bigpO1xuICBjb25zdCB0ID0gdEZyb21Qcm9wcyB8fCBpMThuPy50LmJpbmQoaTE4bik7XG4gIHJldHVybiBUcmFuc1dpdGhvdXRDb250ZXh0KHtcbiAgICBjaGlsZHJlbixcbiAgICBjb3VudCxcbiAgICBwYXJlbnQsXG4gICAgaTE4bktleSxcbiAgICBjb250ZXh0LFxuICAgIHRPcHRpb25zLFxuICAgIHZhbHVlcyxcbiAgICBkZWZhdWx0cyxcbiAgICBjb21wb25lbnRzLFxuICAgIG5zOiBucyB8fCB0Py5ucyB8fCBkZWZhdWx0TlNGcm9tQ29udGV4dCB8fCBpMThuPy5vcHRpb25zPy5kZWZhdWx0TlMsXG4gICAgaTE4bixcbiAgICB0OiB0RnJvbVByb3BzLFxuICAgIHNob3VsZFVuZXNjYXBlLFxuICAgIC4uLmFkZGl0aW9uYWxQcm9wc1xuICB9KTtcbn0iLCJleHBvcnQgY2xhc3MgVHJhbnNsYXRpb25QYXJzZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZSwgcG9zaXRpb24sIHRyYW5zbGF0aW9uU3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1RyYW5zbGF0aW9uUGFyc2VyRXJyb3InO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICB0aGlzLnRyYW5zbGF0aW9uU3RyaW5nID0gdHJhbnNsYXRpb25TdHJpbmc7XG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBUcmFuc2xhdGlvblBhcnNlckVycm9yKTtcbiAgICB9XG4gIH1cbn0iLCJjb25zdCBjb21tb25FbnRpdGllcyA9IHtcbiAgJyZuYnNwOyc6ICdcXHUwMEEwJyxcbiAgJyZhbXA7JzogJyYnLFxuICAnJmx0Oyc6ICc8JyxcbiAgJyZndDsnOiAnPicsXG4gICcmcXVvdDsnOiAnXCInLFxuICAnJmFwb3M7JzogXCInXCIsXG4gICcmY29weTsnOiAnwqknLFxuICAnJnJlZzsnOiAnwq4nLFxuICAnJnRyYWRlOyc6ICfihKInLFxuICAnJmhlbGxpcDsnOiAn4oCmJyxcbiAgJyZuZGFzaDsnOiAn4oCTJyxcbiAgJyZtZGFzaDsnOiAn4oCUJyxcbiAgJyZsc3F1bzsnOiAnXFx1MjAxOCcsXG4gICcmcnNxdW87JzogJ1xcdTIwMTknLFxuICAnJnNicXVvOyc6ICdcXHUyMDFBJyxcbiAgJyZsZHF1bzsnOiAnXFx1MjAxQycsXG4gICcmcmRxdW87JzogJ1xcdTIwMUQnLFxuICAnJmJkcXVvOyc6ICdcXHUyMDFFJyxcbiAgJyZkYWdnZXI7JzogJ+KAoCcsXG4gICcmRGFnZ2VyOyc6ICfigKEnLFxuICAnJmJ1bGw7JzogJ+KAoicsXG4gICcmcHJpbWU7JzogJ+KAsicsXG4gICcmUHJpbWU7JzogJ+KAsycsXG4gICcmbHNhcXVvOyc6ICfigLknLFxuICAnJnJzYXF1bzsnOiAn4oC6JyxcbiAgJyZzZWN0Oyc6ICfCpycsXG4gICcmcGFyYTsnOiAnwrYnLFxuICAnJm1pZGRvdDsnOiAnwrcnLFxuICAnJmVuc3A7JzogJ1xcdTIwMDInLFxuICAnJmVtc3A7JzogJ1xcdTIwMDMnLFxuICAnJnRoaW5zcDsnOiAnXFx1MjAwOScsXG4gICcmZXVybzsnOiAn4oKsJyxcbiAgJyZwb3VuZDsnOiAnwqMnLFxuICAnJnllbjsnOiAnwqUnLFxuICAnJmNlbnQ7JzogJ8KiJyxcbiAgJyZjdXJyZW47JzogJ8KkJyxcbiAgJyZ0aW1lczsnOiAnw5cnLFxuICAnJmRpdmlkZTsnOiAnw7cnLFxuICAnJm1pbnVzOyc6ICfiiJInLFxuICAnJnBsdXNtbjsnOiAnwrEnLFxuICAnJm5lOyc6ICfiiaAnLFxuICAnJmxlOyc6ICfiiaQnLFxuICAnJmdlOyc6ICfiiaUnLFxuICAnJmFzeW1wOyc6ICfiiYgnLFxuICAnJmVxdWl2Oyc6ICfiiaEnLFxuICAnJmluZmluOyc6ICfiiJ4nLFxuICAnJmludDsnOiAn4oirJyxcbiAgJyZzdW07JzogJ+KIkScsXG4gICcmcHJvZDsnOiAn4oiPJyxcbiAgJyZyYWRpYzsnOiAn4oiaJyxcbiAgJyZwYXJ0Oyc6ICfiiIInLFxuICAnJnBlcm1pbDsnOiAn4oCwJyxcbiAgJyZkZWc7JzogJ8KwJyxcbiAgJyZtaWNybzsnOiAnwrUnLFxuICAnJmxhcnI7JzogJ+KGkCcsXG4gICcmdWFycjsnOiAn4oaRJyxcbiAgJyZyYXJyOyc6ICfihpInLFxuICAnJmRhcnI7JzogJ+KGkycsXG4gICcmaGFycjsnOiAn4oaUJyxcbiAgJyZjcmFycjsnOiAn4oa1JyxcbiAgJyZsQXJyOyc6ICfih5AnLFxuICAnJnVBcnI7JzogJ+KHkScsXG4gICcmckFycjsnOiAn4oeSJyxcbiAgJyZkQXJyOyc6ICfih5MnLFxuICAnJmhBcnI7JzogJ+KHlCcsXG4gICcmYWxwaGE7JzogJ86xJyxcbiAgJyZiZXRhOyc6ICfOsicsXG4gICcmZ2FtbWE7JzogJ86zJyxcbiAgJyZkZWx0YTsnOiAnzrQnLFxuICAnJmVwc2lsb247JzogJ861JyxcbiAgJyZ6ZXRhOyc6ICfOticsXG4gICcmZXRhOyc6ICfOtycsXG4gICcmdGhldGE7JzogJ864JyxcbiAgJyZpb3RhOyc6ICfOuScsXG4gICcma2FwcGE7JzogJ866JyxcbiAgJyZsYW1iZGE7JzogJ867JyxcbiAgJyZtdTsnOiAnzrwnLFxuICAnJm51Oyc6ICfOvScsXG4gICcmeGk7JzogJ86+JyxcbiAgJyZvbWljcm9uOyc6ICfOvycsXG4gICcmcGk7JzogJ8+AJyxcbiAgJyZyaG87JzogJ8+BJyxcbiAgJyZzaWdtYTsnOiAnz4MnLFxuICAnJnRhdTsnOiAnz4QnLFxuICAnJnVwc2lsb247JzogJ8+FJyxcbiAgJyZwaGk7JzogJ8+GJyxcbiAgJyZjaGk7JzogJ8+HJyxcbiAgJyZwc2k7JzogJ8+IJyxcbiAgJyZvbWVnYTsnOiAnz4knLFxuICAnJkFscGhhOyc6ICfOkScsXG4gICcmQmV0YTsnOiAnzpInLFxuICAnJkdhbW1hOyc6ICfOkycsXG4gICcmRGVsdGE7JzogJ86UJyxcbiAgJyZFcHNpbG9uOyc6ICfOlScsXG4gICcmWmV0YTsnOiAnzpYnLFxuICAnJkV0YTsnOiAnzpcnLFxuICAnJlRoZXRhOyc6ICfOmCcsXG4gICcmSW90YTsnOiAnzpknLFxuICAnJkthcHBhOyc6ICfOmicsXG4gICcmTGFtYmRhOyc6ICfOmycsXG4gICcmTXU7JzogJ86cJyxcbiAgJyZOdTsnOiAnzp0nLFxuICAnJlhpOyc6ICfOnicsXG4gICcmT21pY3JvbjsnOiAnzp8nLFxuICAnJlBpOyc6ICfOoCcsXG4gICcmUmhvOyc6ICfOoScsXG4gICcmU2lnbWE7JzogJ86jJyxcbiAgJyZUYXU7JzogJ86kJyxcbiAgJyZVcHNpbG9uOyc6ICfOpScsXG4gICcmUGhpOyc6ICfOpicsXG4gICcmQ2hpOyc6ICfOpycsXG4gICcmUHNpOyc6ICfOqCcsXG4gICcmT21lZ2E7JzogJ86pJyxcbiAgJyZBZ3JhdmU7JzogJ8OAJyxcbiAgJyZBYWN1dGU7JzogJ8OBJyxcbiAgJyZBY2lyYzsnOiAnw4InLFxuICAnJkF0aWxkZTsnOiAnw4MnLFxuICAnJkF1bWw7JzogJ8OEJyxcbiAgJyZBcmluZzsnOiAnw4UnLFxuICAnJkFFbGlnOyc6ICfDhicsXG4gICcmQ2NlZGlsOyc6ICfDhycsXG4gICcmRWdyYXZlOyc6ICfDiCcsXG4gICcmRWFjdXRlOyc6ICfDiScsXG4gICcmRWNpcmM7JzogJ8OKJyxcbiAgJyZFdW1sOyc6ICfDiycsXG4gICcmSWdyYXZlOyc6ICfDjCcsXG4gICcmSWFjdXRlOyc6ICfDjScsXG4gICcmSWNpcmM7JzogJ8OOJyxcbiAgJyZJdW1sOyc6ICfDjycsXG4gICcmRVRIOyc6ICfDkCcsXG4gICcmTnRpbGRlOyc6ICfDkScsXG4gICcmT2dyYXZlOyc6ICfDkicsXG4gICcmT2FjdXRlOyc6ICfDkycsXG4gICcmT2NpcmM7JzogJ8OUJyxcbiAgJyZPdGlsZGU7JzogJ8OVJyxcbiAgJyZPdW1sOyc6ICfDlicsXG4gICcmT3NsYXNoOyc6ICfDmCcsXG4gICcmVWdyYXZlOyc6ICfDmScsXG4gICcmVWFjdXRlOyc6ICfDmicsXG4gICcmVWNpcmM7JzogJ8ObJyxcbiAgJyZVdW1sOyc6ICfDnCcsXG4gICcmWWFjdXRlOyc6ICfDnScsXG4gICcmVEhPUk47JzogJ8OeJyxcbiAgJyZzemxpZzsnOiAnw58nLFxuICAnJmFncmF2ZTsnOiAnw6AnLFxuICAnJmFhY3V0ZTsnOiAnw6EnLFxuICAnJmFjaXJjOyc6ICfDoicsXG4gICcmYXRpbGRlOyc6ICfDoycsXG4gICcmYXVtbDsnOiAnw6QnLFxuICAnJmFyaW5nOyc6ICfDpScsXG4gICcmYWVsaWc7JzogJ8OmJyxcbiAgJyZjY2VkaWw7JzogJ8OnJyxcbiAgJyZlZ3JhdmU7JzogJ8OoJyxcbiAgJyZlYWN1dGU7JzogJ8OpJyxcbiAgJyZlY2lyYzsnOiAnw6onLFxuICAnJmV1bWw7JzogJ8OrJyxcbiAgJyZpZ3JhdmU7JzogJ8OsJyxcbiAgJyZpYWN1dGU7JzogJ8OtJyxcbiAgJyZpY2lyYzsnOiAnw64nLFxuICAnJml1bWw7JzogJ8OvJyxcbiAgJyZldGg7JzogJ8OwJyxcbiAgJyZudGlsZGU7JzogJ8OxJyxcbiAgJyZvZ3JhdmU7JzogJ8OyJyxcbiAgJyZvYWN1dGU7JzogJ8OzJyxcbiAgJyZvY2lyYzsnOiAnw7QnLFxuICAnJm90aWxkZTsnOiAnw7UnLFxuICAnJm91bWw7JzogJ8O2JyxcbiAgJyZvc2xhc2g7JzogJ8O4JyxcbiAgJyZ1Z3JhdmU7JzogJ8O5JyxcbiAgJyZ1YWN1dGU7JzogJ8O6JyxcbiAgJyZ1Y2lyYzsnOiAnw7snLFxuICAnJnV1bWw7JzogJ8O8JyxcbiAgJyZ5YWN1dGU7JzogJ8O9JyxcbiAgJyZ0aG9ybjsnOiAnw74nLFxuICAnJnl1bWw7JzogJ8O/JyxcbiAgJyZpZXhjbDsnOiAnwqEnLFxuICAnJmlxdWVzdDsnOiAnwr8nLFxuICAnJmZub2Y7JzogJ8aSJyxcbiAgJyZjaXJjOyc6ICfLhicsXG4gICcmdGlsZGU7JzogJ8ucJyxcbiAgJyZPRWxpZzsnOiAnxZInLFxuICAnJm9lbGlnOyc6ICfFkycsXG4gICcmU2Nhcm9uOyc6ICfFoCcsXG4gICcmc2Nhcm9uOyc6ICfFoScsXG4gICcmWXVtbDsnOiAnxbgnLFxuICAnJm9yZGY7JzogJ8KqJyxcbiAgJyZvcmRtOyc6ICfCuicsXG4gICcmbWFjcjsnOiAnwq8nLFxuICAnJmFjdXRlOyc6ICfCtCcsXG4gICcmY2VkaWw7JzogJ8K4JyxcbiAgJyZzdXAxOyc6ICfCuScsXG4gICcmc3VwMjsnOiAnwrInLFxuICAnJnN1cDM7JzogJ8KzJyxcbiAgJyZmcmFjMTQ7JzogJ8K8JyxcbiAgJyZmcmFjMTI7JzogJ8K9JyxcbiAgJyZmcmFjMzQ7JzogJ8K+JyxcbiAgJyZzcGFkZXM7JzogJ+KZoCcsXG4gICcmY2x1YnM7JzogJ+KZoycsXG4gICcmaGVhcnRzOyc6ICfimaUnLFxuICAnJmRpYW1zOyc6ICfimaYnLFxuICAnJmxvejsnOiAn4peKJyxcbiAgJyZvbGluZTsnOiAn4oC+JyxcbiAgJyZmcmFzbDsnOiAn4oGEJyxcbiAgJyZ3ZWllcnA7JzogJ+KEmCcsXG4gICcmaW1hZ2U7JzogJ+KEkScsXG4gICcmcmVhbDsnOiAn4oScJyxcbiAgJyZhbGVmc3ltOyc6ICfihLUnXG59O1xuY29uc3QgZW50aXR5UGF0dGVybiA9IG5ldyBSZWdFeHAoT2JqZWN0LmtleXMoY29tbW9uRW50aXRpZXMpLm1hcChlbnRpdHkgPT4gZW50aXR5LnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJykpLmpvaW4oJ3wnKSwgJ2cnKTtcbmV4cG9ydCBjb25zdCBkZWNvZGVIdG1sRW50aXRpZXMgPSB0ZXh0ID0+IHRleHQucmVwbGFjZShlbnRpdHlQYXR0ZXJuLCBtYXRjaCA9PiBjb21tb25FbnRpdGllc1ttYXRjaF0pLnJlcGxhY2UoLyYjKFxcZCspOy9nLCAoXywgbnVtKSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KG51bSwgMTApKSkucmVwbGFjZSgvJiN4KFswLTlhLWZBLUZdKyk7L2csIChfLCBoZXgpID0+IFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQoaGV4LCAxNikpKTsiLCJleHBvcnQgY29uc3QgdG9rZW5pemUgPSB0cmFuc2xhdGlvbiA9PiB7XG4gIGNvbnN0IHRva2VucyA9IFtdO1xuICBsZXQgcG9zaXRpb24gPSAwO1xuICBsZXQgY3VycmVudFRleHQgPSAnJztcbiAgY29uc3QgZmx1c2hUZXh0ID0gKCkgPT4ge1xuICAgIGlmIChjdXJyZW50VGV4dCkge1xuICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnVGV4dCcsXG4gICAgICAgIHZhbHVlOiBjdXJyZW50VGV4dCxcbiAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uIC0gY3VycmVudFRleHQubGVuZ3RoXG4gICAgICB9KTtcbiAgICAgIGN1cnJlbnRUZXh0ID0gJyc7XG4gICAgfVxuICB9O1xuICB3aGlsZSAocG9zaXRpb24gPCB0cmFuc2xhdGlvbi5sZW5ndGgpIHtcbiAgICBjb25zdCBjaGFyID0gdHJhbnNsYXRpb25bcG9zaXRpb25dO1xuICAgIGlmIChjaGFyID09PSAnPCcpIHtcbiAgICAgIGNvbnN0IHRhZ01hdGNoID0gdHJhbnNsYXRpb24uc2xpY2UocG9zaXRpb24pLm1hdGNoKC9ePChcXGQrKT4vKTtcbiAgICAgIGlmICh0YWdNYXRjaCkge1xuICAgICAgICBmbHVzaFRleHQoKTtcbiAgICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdUYWdPcGVuJyxcbiAgICAgICAgICB2YWx1ZTogdGFnTWF0Y2hbMF0sXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgdGFnTnVtYmVyOiBwYXJzZUludCh0YWdNYXRjaFsxXSwgMTApXG4gICAgICAgIH0pO1xuICAgICAgICBwb3NpdGlvbiArPSB0YWdNYXRjaFswXS5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjbG9zZVRhZ01hdGNoID0gdHJhbnNsYXRpb24uc2xpY2UocG9zaXRpb24pLm1hdGNoKC9ePFxcLyhcXGQrKT4vKTtcbiAgICAgICAgaWYgKGNsb3NlVGFnTWF0Y2gpIHtcbiAgICAgICAgICBmbHVzaFRleHQoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAnVGFnQ2xvc2UnLFxuICAgICAgICAgICAgdmFsdWU6IGNsb3NlVGFnTWF0Y2hbMF0sXG4gICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgIHRhZ051bWJlcjogcGFyc2VJbnQoY2xvc2VUYWdNYXRjaFsxXSwgMTApXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcG9zaXRpb24gKz0gY2xvc2VUYWdNYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFRleHQgKz0gY2hhcjtcbiAgICAgICAgICBwb3NpdGlvbiArPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRUZXh0ICs9IGNoYXI7XG4gICAgICBwb3NpdGlvbiArPSAxO1xuICAgIH1cbiAgfVxuICBmbHVzaFRleHQoKTtcbiAgcmV0dXJuIHRva2Vucztcbn07IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFRyYW5zbGF0aW9uUGFyc2VyRXJyb3IgfSBmcm9tICcuL1RyYW5zbGF0aW9uUGFyc2VyRXJyb3IuanMnO1xuaW1wb3J0IHsgdG9rZW5pemUgfSBmcm9tICcuL3Rva2VuaXplci5qcyc7XG5pbXBvcnQgeyBkZWNvZGVIdG1sRW50aXRpZXMgfSBmcm9tICcuL2h0bWxFbnRpdHlEZWNvZGVyLmpzJztcbmNvbnN0IHJlbmRlckRlY2xhcmF0aW9uTm9kZSA9IChkZWNsYXJhdGlvbiwgY2hpbGRyZW4sIGNoaWxkRGVjbGFyYXRpb25zKSA9PiB7XG4gIGNvbnN0IHtcbiAgICB0eXBlLFxuICAgIHByb3BzID0ge31cbiAgfSA9IGRlY2xhcmF0aW9uO1xuICBpZiAocHJvcHMuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShwcm9wcy5jaGlsZHJlbikgJiYgY2hpbGREZWNsYXJhdGlvbnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBjaGlsZHJlbjogX2NoaWxkcmVuVG9SZW1vdmUsXG4gICAgICAuLi5wcm9wc1dpdGhvdXRDaGlsZHJlblxuICAgIH0gPSBwcm9wcztcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCh0eXBlLCBwcm9wc1dpdGhvdXRDaGlsZHJlbiwgLi4uY2hpbGRyZW4pO1xuICB9XG4gIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCh0eXBlLCBwcm9wcyk7XG4gIH1cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHR5cGUsIHByb3BzLCBjaGlsZHJlblswXSk7XG4gIH1cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQodHlwZSwgcHJvcHMsIC4uLmNoaWxkcmVuKTtcbn07XG5leHBvcnQgY29uc3QgcmVuZGVyVHJhbnNsYXRpb24gPSAodHJhbnNsYXRpb24sIGRlY2xhcmF0aW9ucyA9IFtdKSA9PiB7XG4gIGlmICghdHJhbnNsYXRpb24pIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUodHJhbnNsYXRpb24pO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgY29uc3QgbGl0ZXJhbFRhZ051bWJlcnMgPSBuZXcgU2V0KCk7XG4gIGNvbnN0IGdldEN1cnJlbnREZWNsYXJhdGlvbnMgPSAoKSA9PiB7XG4gICAgaWYgKHN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9ucztcbiAgICB9XG4gICAgY29uc3QgcGFyZW50RnJhbWUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICBpZiAocGFyZW50RnJhbWUuZGVjbGFyYXRpb24ucHJvcHM/LmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkocGFyZW50RnJhbWUuZGVjbGFyYXRpb24ucHJvcHMuY2hpbGRyZW4pKSB7XG4gICAgICByZXR1cm4gcGFyZW50RnJhbWUuZGVjbGFyYXRpb24ucHJvcHMuY2hpbGRyZW47XG4gICAgfVxuICAgIHJldHVybiBwYXJlbnRGcmFtZS5kZWNsYXJhdGlvbnM7XG4gIH07XG4gIHRva2Vucy5mb3JFYWNoKHRva2VuID0+IHtcbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgIGNhc2UgJ1RleHQnOlxuICAgICAgICB7XG4gICAgICAgICAgY29uc3QgZGVjb2RlZCA9IGRlY29kZUh0bWxFbnRpdGllcyh0b2tlbi52YWx1ZSk7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0QXJyYXkgPSBzdGFjay5sZW5ndGggPiAwID8gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uY2hpbGRyZW4gOiByZXN1bHQ7XG4gICAgICAgICAgdGFyZ2V0QXJyYXkucHVzaChkZWNvZGVkKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1RhZ09wZW4nOlxuICAgICAgICB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgdGFnTnVtYmVyXG4gICAgICAgICAgfSA9IHRva2VuO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnREZWNsYXJhdGlvbnMgPSBnZXRDdXJyZW50RGVjbGFyYXRpb25zKCk7XG4gICAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSBjdXJyZW50RGVjbGFyYXRpb25zW3RhZ051bWJlcl07XG4gICAgICAgICAgaWYgKCFkZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgbGl0ZXJhbFRhZ051bWJlcnMuYWRkKHRhZ051bWJlcik7XG4gICAgICAgICAgICBjb25zdCBsaXRlcmFsVGV4dCA9IGA8JHt0YWdOdW1iZXJ9PmA7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRBcnJheSA9IHN0YWNrLmxlbmd0aCA+IDAgPyBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5jaGlsZHJlbiA6IHJlc3VsdDtcbiAgICAgICAgICAgIHRhcmdldEFycmF5LnB1c2gobGl0ZXJhbFRleHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YWNrLnB1c2goe1xuICAgICAgICAgICAgdGFnTnVtYmVyLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgcG9zaXRpb246IHRva2VuLnBvc2l0aW9uLFxuICAgICAgICAgICAgZGVjbGFyYXRpb24sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGN1cnJlbnREZWNsYXJhdGlvbnNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1RhZ0Nsb3NlJzpcbiAgICAgICAge1xuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHRhZ051bWJlclxuICAgICAgICAgIH0gPSB0b2tlbjtcbiAgICAgICAgICBpZiAobGl0ZXJhbFRhZ051bWJlcnMuaGFzKHRhZ051bWJlcikpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpdGVyYWxUZXh0ID0gYDwvJHt0YWdOdW1iZXJ9PmA7XG4gICAgICAgICAgICBjb25zdCBsaXRlcmFsVGFyZ2V0QXJyYXkgPSBzdGFjay5sZW5ndGggPiAwID8gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uY2hpbGRyZW4gOiByZXN1bHQ7XG4gICAgICAgICAgICBsaXRlcmFsVGFyZ2V0QXJyYXkucHVzaChsaXRlcmFsVGV4dCk7XG4gICAgICAgICAgICBsaXRlcmFsVGFnTnVtYmVycy5kZWxldGUodGFnTnVtYmVyKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHJhbnNsYXRpb25QYXJzZXJFcnJvcihgVW5leHBlY3RlZCBjbG9zaW5nIHRhZyA8LyR7dGFnTnVtYmVyfT4gYXQgcG9zaXRpb24gJHt0b2tlbi5wb3NpdGlvbn1gLCB0b2tlbi5wb3NpdGlvbiwgdHJhbnNsYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBmcmFtZSA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgIGlmIChmcmFtZS50YWdOdW1iZXIgIT09IHRhZ051bWJlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFRyYW5zbGF0aW9uUGFyc2VyRXJyb3IoYE1pc21hdGNoZWQgdGFnczogZXhwZWN0ZWQgPC8ke2ZyYW1lLnRhZ051bWJlcn0+IGJ1dCBnb3QgPC8ke3RhZ051bWJlcn0+IGF0IHBvc2l0aW9uICR7dG9rZW4ucG9zaXRpb259YCwgdG9rZW4ucG9zaXRpb24sIHRyYW5zbGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHJlbmRlckRlY2xhcmF0aW9uTm9kZShmcmFtZS5kZWNsYXJhdGlvbiwgZnJhbWUuY2hpbGRyZW4sIGZyYW1lLmRlY2xhcmF0aW9ucyk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFRhcmdldEFycmF5ID0gc3RhY2subGVuZ3RoID4gMCA/IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLmNoaWxkcmVuIDogcmVzdWx0O1xuICAgICAgICAgIGVsZW1lbnRUYXJnZXRBcnJheS5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSk7XG4gIGlmIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgdW5jbG9zZWQgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICB0aHJvdyBuZXcgVHJhbnNsYXRpb25QYXJzZXJFcnJvcihgVW5jbG9zZWQgdGFnIDwke3VuY2xvc2VkLnRhZ051bWJlcn0+IGF0IHBvc2l0aW9uICR7dW5jbG9zZWQucG9zaXRpb259YCwgdW5jbG9zZWQucG9zaXRpb24sIHRyYW5zbGF0aW9uKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTsiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgd2Fybiwgd2Fybk9uY2UsIGlzU3RyaW5nIH0gZnJvbSAnLi91dGlscy5qcyc7XG5pbXBvcnQgeyBnZXRJMThuIH0gZnJvbSAnLi9pMThuSW5zdGFuY2UuanMnO1xuaW1wb3J0IHsgcmVuZGVyVHJhbnNsYXRpb24gfSBmcm9tICcuL0ljdVRyYW5zVXRpbHMvaW5kZXguanMnO1xuZXhwb3J0IGZ1bmN0aW9uIEljdVRyYW5zV2l0aG91dENvbnRleHQoe1xuICBpMThuS2V5LFxuICBkZWZhdWx0VHJhbnNsYXRpb24sXG4gIGNvbnRlbnQsXG4gIG5zLFxuICB2YWx1ZXMgPSB7fSxcbiAgaTE4bjogaTE4bkZyb21Qcm9wcyxcbiAgdDogdEZyb21Qcm9wc1xufSkge1xuICBjb25zdCBpMThuID0gaTE4bkZyb21Qcm9wcyB8fCBnZXRJMThuKCk7XG4gIGlmICghaTE4bikge1xuICAgIHdhcm5PbmNlKGkxOG4sICdOT19JMThORVhUX0lOU1RBTkNFJywgYEljdVRyYW5zOiBZb3UgbmVlZCB0byBwYXNzIGluIGFuIGkxOG5leHQgaW5zdGFuY2UgdXNpbmcgaTE4bmV4dFJlYWN0TW9kdWxlYCwge1xuICAgICAgaTE4bktleVxuICAgIH0pO1xuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFJlYWN0LkZyYWdtZW50LCB7fSwgZGVmYXVsdFRyYW5zbGF0aW9uKTtcbiAgfVxuICBjb25zdCB0ID0gdEZyb21Qcm9wcyB8fCBpMThuLnQ/LmJpbmQoaTE4bikgfHwgKGsgPT4gayk7XG4gIGxldCBuYW1lc3BhY2VzID0gbnMgfHwgdC5ucyB8fCBpMThuLm9wdGlvbnM/LmRlZmF1bHROUztcbiAgbmFtZXNwYWNlcyA9IGlzU3RyaW5nKG5hbWVzcGFjZXMpID8gW25hbWVzcGFjZXNdIDogbmFtZXNwYWNlcyB8fCBbJ3RyYW5zbGF0aW9uJ107XG4gIGxldCBtZXJnZWRWYWx1ZXMgPSB2YWx1ZXM7XG4gIGlmIChpMThuLm9wdGlvbnM/LmludGVycG9sYXRpb24/LmRlZmF1bHRWYXJpYWJsZXMpIHtcbiAgICBtZXJnZWRWYWx1ZXMgPSB2YWx1ZXMgJiYgT2JqZWN0LmtleXModmFsdWVzKS5sZW5ndGggPiAwID8ge1xuICAgICAgLi4udmFsdWVzLFxuICAgICAgLi4uaTE4bi5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlc1xuICAgIH0gOiB7XG4gICAgICAuLi5pMThuLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzXG4gICAgfTtcbiAgfVxuICBjb25zdCB0cmFuc2xhdGlvbiA9IHQoaTE4bktleSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZGVmYXVsdFRyYW5zbGF0aW9uLFxuICAgIC4uLm1lcmdlZFZhbHVlcyxcbiAgICBuczogbmFtZXNwYWNlc1xuICB9KTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZW5kZXJlZCA9IHJlbmRlclRyYW5zbGF0aW9uKHRyYW5zbGF0aW9uLCBjb250ZW50KTtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwge30sIC4uLnJlbmRlcmVkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB3YXJuKGkxOG4sICdJQ1VfVFJBTlNfUkVOREVSX0VSUk9SJywgYEljdVRyYW5zIGNvbXBvbmVudCBlcnJvciBmb3Iga2V5IFwiJHtpMThuS2V5fVwiOiAke2Vycm9yLm1lc3NhZ2V9YCwge1xuICAgICAgaTE4bktleSxcbiAgICAgIGVycm9yXG4gICAgfSk7XG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIHt9LCB0cmFuc2xhdGlvbik7XG4gIH1cbn1cbkljdVRyYW5zV2l0aG91dENvbnRleHQuZGlzcGxheU5hbWUgPSAnSWN1VHJhbnNXaXRob3V0Q29udGV4dCc7IiwiaW1wb3J0IHsgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEljdVRyYW5zV2l0aG91dENvbnRleHQgfSBmcm9tICcuL0ljdVRyYW5zV2l0aG91dENvbnRleHQuanMnO1xuaW1wb3J0IHsgZ2V0STE4biwgSTE4bkNvbnRleHQgfSBmcm9tICcuL2NvbnRleHQuanMnO1xuZXhwb3J0IGZ1bmN0aW9uIEljdVRyYW5zKHtcbiAgaTE4bktleSxcbiAgZGVmYXVsdFRyYW5zbGF0aW9uLFxuICBjb250ZW50LFxuICBucyxcbiAgdmFsdWVzID0ge30sXG4gIGkxOG46IGkxOG5Gcm9tUHJvcHMsXG4gIHQ6IHRGcm9tUHJvcHNcbn0pIHtcbiAgY29uc3Qge1xuICAgIGkxOG46IGkxOG5Gcm9tQ29udGV4dCxcbiAgICBkZWZhdWx0TlM6IGRlZmF1bHROU0Zyb21Db250ZXh0XG4gIH0gPSB1c2VDb250ZXh0KEkxOG5Db250ZXh0KSB8fCB7fTtcbiAgY29uc3QgaTE4biA9IGkxOG5Gcm9tUHJvcHMgfHwgaTE4bkZyb21Db250ZXh0IHx8IGdldEkxOG4oKTtcbiAgY29uc3QgdCA9IHRGcm9tUHJvcHMgfHwgaTE4bj8udC5iaW5kKGkxOG4pO1xuICByZXR1cm4gSWN1VHJhbnNXaXRob3V0Q29udGV4dCh7XG4gICAgaTE4bktleSxcbiAgICBkZWZhdWx0VHJhbnNsYXRpb24sXG4gICAgY29udGVudCxcbiAgICBuczogbnMgfHwgdD8ubnMgfHwgZGVmYXVsdE5TRnJvbUNvbnRleHQgfHwgaTE4bj8ub3B0aW9ucz8uZGVmYXVsdE5TLFxuICAgIHZhbHVlcyxcbiAgICBpMThuLFxuICAgIHQ6IHRGcm9tUHJvcHNcbiAgfSk7XG59XG5JY3VUcmFucy5kaXNwbGF5TmFtZSA9ICdJY3VUcmFucyc7IiwiaW1wb3J0IHsgdXNlQ29udGV4dCwgdXNlQ2FsbGJhY2ssIHVzZU1lbW8sIHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVN5bmNFeHRlcm5hbFN0b3JlIH0gZnJvbSAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUvc2hpbSc7XG5pbXBvcnQgeyBnZXRJMThuLCBnZXREZWZhdWx0cywgUmVwb3J0TmFtZXNwYWNlcywgSTE4bkNvbnRleHQgfSBmcm9tICcuL2NvbnRleHQuanMnO1xuaW1wb3J0IHsgd2Fybk9uY2UsIGxvYWROYW1lc3BhY2VzLCBsb2FkTGFuZ3VhZ2VzLCBoYXNMb2FkZWROYW1lc3BhY2UsIGlzU3RyaW5nLCBpc09iamVjdCB9IGZyb20gJy4vdXRpbHMuanMnO1xuY29uc3Qgbm90UmVhZHlUID0gKGssIG9wdHNPckRlZmF1bHRWYWx1ZSkgPT4ge1xuICBpZiAoaXNTdHJpbmcob3B0c09yRGVmYXVsdFZhbHVlKSkgcmV0dXJuIG9wdHNPckRlZmF1bHRWYWx1ZTtcbiAgaWYgKGlzT2JqZWN0KG9wdHNPckRlZmF1bHRWYWx1ZSkgJiYgaXNTdHJpbmcob3B0c09yRGVmYXVsdFZhbHVlLmRlZmF1bHRWYWx1ZSkpIHJldHVybiBvcHRzT3JEZWZhdWx0VmFsdWUuZGVmYXVsdFZhbHVlO1xuICBpZiAodHlwZW9mIGsgPT09ICdmdW5jdGlvbicpIHJldHVybiAnJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoaykpIHtcbiAgICBjb25zdCBsYXN0ID0ga1trLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiB0eXBlb2YgbGFzdCA9PT0gJ2Z1bmN0aW9uJyA/ICcnIDogbGFzdDtcbiAgfVxuICByZXR1cm4gaztcbn07XG5jb25zdCBub3RSZWFkeVNuYXBzaG90ID0ge1xuICB0OiBub3RSZWFkeVQsXG4gIHJlYWR5OiBmYWxzZVxufTtcbmNvbnN0IGR1bW15U3Vic2NyaWJlID0gKCkgPT4gKCkgPT4ge307XG5leHBvcnQgY29uc3QgdXNlVHJhbnNsYXRpb24gPSAobnMsIHByb3BzID0ge30pID0+IHtcbiAgY29uc3Qge1xuICAgIGkxOG46IGkxOG5Gcm9tUHJvcHNcbiAgfSA9IHByb3BzO1xuICBjb25zdCB7XG4gICAgaTE4bjogaTE4bkZyb21Db250ZXh0LFxuICAgIGRlZmF1bHROUzogZGVmYXVsdE5TRnJvbUNvbnRleHRcbiAgfSA9IHVzZUNvbnRleHQoSTE4bkNvbnRleHQpIHx8IHt9O1xuICBjb25zdCBpMThuID0gaTE4bkZyb21Qcm9wcyB8fCBpMThuRnJvbUNvbnRleHQgfHwgZ2V0STE4bigpO1xuICBpZiAoaTE4biAmJiAhaTE4bi5yZXBvcnROYW1lc3BhY2VzKSBpMThuLnJlcG9ydE5hbWVzcGFjZXMgPSBuZXcgUmVwb3J0TmFtZXNwYWNlcygpO1xuICBpZiAoIWkxOG4pIHtcbiAgICB3YXJuT25jZShpMThuLCAnTk9fSTE4TkVYVF9JTlNUQU5DRScsICd1c2VUcmFuc2xhdGlvbjogWW91IHdpbGwgbmVlZCB0byBwYXNzIGluIGFuIGkxOG5leHQgaW5zdGFuY2UgYnkgdXNpbmcgaW5pdFJlYWN0STE4bmV4dCcpO1xuICB9XG4gIGNvbnN0IGkxOG5PcHRpb25zID0gdXNlTWVtbygoKSA9PiAoe1xuICAgIC4uLmdldERlZmF1bHRzKCksXG4gICAgLi4uaTE4bj8ub3B0aW9ucz8ucmVhY3QsXG4gICAgLi4ucHJvcHNcbiAgfSksIFtpMThuLCBwcm9wc10pO1xuICBjb25zdCB7XG4gICAgdXNlU3VzcGVuc2UsXG4gICAga2V5UHJlZml4XG4gIH0gPSBpMThuT3B0aW9ucztcbiAgY29uc3QgbnNPckNvbnRleHQgPSBucyB8fCBkZWZhdWx0TlNGcm9tQ29udGV4dCB8fCBpMThuPy5vcHRpb25zPy5kZWZhdWx0TlM7XG4gIGNvbnN0IHVuc3RhYmxlTmFtZXNwYWNlcyA9IGlzU3RyaW5nKG5zT3JDb250ZXh0KSA/IFtuc09yQ29udGV4dF0gOiBuc09yQ29udGV4dCB8fCBbJ3RyYW5zbGF0aW9uJ107XG4gIGNvbnN0IG5hbWVzcGFjZXMgPSB1c2VNZW1vKCgpID0+IHVuc3RhYmxlTmFtZXNwYWNlcywgdW5zdGFibGVOYW1lc3BhY2VzKTtcbiAgaTE4bj8ucmVwb3J0TmFtZXNwYWNlcz8uYWRkVXNlZE5hbWVzcGFjZXM/LihuYW1lc3BhY2VzKTtcbiAgY29uc3QgcmV2aXNpb25SZWYgPSB1c2VSZWYoMCk7XG4gIGNvbnN0IHN1YnNjcmliZSA9IHVzZUNhbGxiYWNrKGNhbGxiYWNrID0+IHtcbiAgICBpZiAoIWkxOG4pIHJldHVybiBkdW1teVN1YnNjcmliZTtcbiAgICBjb25zdCB7XG4gICAgICBiaW5kSTE4bixcbiAgICAgIGJpbmRJMThuU3RvcmVcbiAgICB9ID0gaTE4bk9wdGlvbnM7XG4gICAgY29uc3Qgd3JhcHBlZENhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgcmV2aXNpb25SZWYuY3VycmVudCArPSAxO1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9O1xuICAgIGlmIChiaW5kSTE4bikgaTE4bi5vbihiaW5kSTE4biwgd3JhcHBlZENhbGxiYWNrKTtcbiAgICBpZiAoYmluZEkxOG5TdG9yZSkgaTE4bi5zdG9yZS5vbihiaW5kSTE4blN0b3JlLCB3cmFwcGVkQ2FsbGJhY2spO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoYmluZEkxOG4pIGJpbmRJMThuLnNwbGl0KCcgJykuZm9yRWFjaChlID0+IGkxOG4ub2ZmKGUsIHdyYXBwZWRDYWxsYmFjaykpO1xuICAgICAgaWYgKGJpbmRJMThuU3RvcmUpIGJpbmRJMThuU3RvcmUuc3BsaXQoJyAnKS5mb3JFYWNoKGUgPT4gaTE4bi5zdG9yZS5vZmYoZSwgd3JhcHBlZENhbGxiYWNrKSk7XG4gICAgfTtcbiAgfSwgW2kxOG4sIGkxOG5PcHRpb25zXSk7XG4gIGNvbnN0IHNuYXBzaG90UmVmID0gdXNlUmVmKCk7XG4gIGNvbnN0IGdldFNuYXBzaG90ID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmICghaTE4bikge1xuICAgICAgcmV0dXJuIG5vdFJlYWR5U25hcHNob3Q7XG4gICAgfVxuICAgIGNvbnN0IGNhbGN1bGF0ZWRSZWFkeSA9ICEhKGkxOG4uaXNJbml0aWFsaXplZCB8fCBpMThuLmluaXRpYWxpemVkU3RvcmVPbmNlKSAmJiBuYW1lc3BhY2VzLmV2ZXJ5KG4gPT4gaGFzTG9hZGVkTmFtZXNwYWNlKG4sIGkxOG4sIGkxOG5PcHRpb25zKSk7XG4gICAgY29uc3QgY3VycmVudExuZyA9IHByb3BzLmxuZyB8fCBpMThuLmxhbmd1YWdlO1xuICAgIGNvbnN0IGN1cnJlbnRSZXZpc2lvbiA9IHJldmlzaW9uUmVmLmN1cnJlbnQ7XG4gICAgY29uc3QgbGFzdFNuYXBzaG90ID0gc25hcHNob3RSZWYuY3VycmVudDtcbiAgICBpZiAobGFzdFNuYXBzaG90ICYmIGxhc3RTbmFwc2hvdC5yZWFkeSA9PT0gY2FsY3VsYXRlZFJlYWR5ICYmIGxhc3RTbmFwc2hvdC5sbmcgPT09IGN1cnJlbnRMbmcgJiYgbGFzdFNuYXBzaG90LmtleVByZWZpeCA9PT0ga2V5UHJlZml4ICYmIGxhc3RTbmFwc2hvdC5yZXZpc2lvbiA9PT0gY3VycmVudFJldmlzaW9uKSB7XG4gICAgICByZXR1cm4gbGFzdFNuYXBzaG90O1xuICAgIH1cbiAgICBjb25zdCBjYWxjdWxhdGVkVCA9IGkxOG4uZ2V0Rml4ZWRUKGN1cnJlbnRMbmcsIGkxOG5PcHRpb25zLm5zTW9kZSA9PT0gJ2ZhbGxiYWNrJyA/IG5hbWVzcGFjZXMgOiBuYW1lc3BhY2VzWzBdLCBrZXlQcmVmaXgsIHtcbiAgICAgIHNjb3BlTnM6IG5hbWVzcGFjZXNcbiAgICB9KTtcbiAgICBjb25zdCBuZXdTbmFwc2hvdCA9IHtcbiAgICAgIHQ6IGNhbGN1bGF0ZWRULFxuICAgICAgcmVhZHk6IGNhbGN1bGF0ZWRSZWFkeSxcbiAgICAgIGxuZzogY3VycmVudExuZyxcbiAgICAgIGtleVByZWZpeCxcbiAgICAgIHJldmlzaW9uOiBjdXJyZW50UmV2aXNpb25cbiAgICB9O1xuICAgIHNuYXBzaG90UmVmLmN1cnJlbnQgPSBuZXdTbmFwc2hvdDtcbiAgICByZXR1cm4gbmV3U25hcHNob3Q7XG4gIH0sIFtpMThuLCBuYW1lc3BhY2VzLCBrZXlQcmVmaXgsIGkxOG5PcHRpb25zLCBwcm9wcy5sbmddKTtcbiAgY29uc3QgW2xvYWRDb3VudCwgc2V0TG9hZENvdW50XSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCB7XG4gICAgdCxcbiAgICByZWFkeVxuICB9ID0gdXNlU3luY0V4dGVybmFsU3RvcmUoc3Vic2NyaWJlLCBnZXRTbmFwc2hvdCwgZ2V0U25hcHNob3QpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpMThuICYmICFyZWFkeSAmJiAhdXNlU3VzcGVuc2UpIHtcbiAgICAgIGNvbnN0IG9uTG9hZGVkID0gKCkgPT4gc2V0TG9hZENvdW50KGMgPT4gYyArIDEpO1xuICAgICAgaWYgKHByb3BzLmxuZykge1xuICAgICAgICBsb2FkTGFuZ3VhZ2VzKGkxOG4sIHByb3BzLmxuZywgbmFtZXNwYWNlcywgb25Mb2FkZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9hZE5hbWVzcGFjZXMoaTE4biwgbmFtZXNwYWNlcywgb25Mb2FkZWQpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW2kxOG4sIHByb3BzLmxuZywgbmFtZXNwYWNlcywgcmVhZHksIHVzZVN1c3BlbnNlLCBsb2FkQ291bnRdKTtcbiAgY29uc3QgZmluYWxJMThuID0gaTE4biB8fCB7fTtcbiAgY29uc3Qgd3JhcHBlclJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3Qgd3JhcHBlckxhbmdSZWYgPSB1c2VSZWYoKTtcbiAgY29uc3QgY3JlYXRlSTE4bldyYXBwZXIgPSBvcmlnaW5hbCA9PiB7XG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhvcmlnaW5hbCk7XG4gICAgaWYgKGRlc2NyaXB0b3JzLl9fb3JpZ2luYWwpIGRlbGV0ZSBkZXNjcmlwdG9ycy5fX29yaWdpbmFsO1xuICAgIGNvbnN0IHdyYXBwZXIgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihvcmlnaW5hbCksIGRlc2NyaXB0b3JzKTtcbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh3cmFwcGVyLCAnX19vcmlnaW5hbCcpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkod3JhcHBlciwgJ19fb3JpZ2luYWwnLCB7XG4gICAgICAgICAgdmFsdWU6IG9yaWdpbmFsLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoXykge31cbiAgICB9XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH07XG4gIGNvbnN0IHJldCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsID0gZmluYWxJMThuO1xuICAgIGNvbnN0IGxhbmcgPSBvcmlnaW5hbD8ubGFuZ3VhZ2U7XG4gICAgbGV0IGkxOG5XcmFwcGVyID0gb3JpZ2luYWw7XG4gICAgaWYgKG9yaWdpbmFsKSB7XG4gICAgICBpZiAod3JhcHBlclJlZi5jdXJyZW50ICYmIHdyYXBwZXJSZWYuY3VycmVudC5fX29yaWdpbmFsID09PSBvcmlnaW5hbCkge1xuICAgICAgICBpZiAod3JhcHBlckxhbmdSZWYuY3VycmVudCAhPT0gbGFuZykge1xuICAgICAgICAgIGkxOG5XcmFwcGVyID0gY3JlYXRlSTE4bldyYXBwZXIob3JpZ2luYWwpO1xuICAgICAgICAgIHdyYXBwZXJSZWYuY3VycmVudCA9IGkxOG5XcmFwcGVyO1xuICAgICAgICAgIHdyYXBwZXJMYW5nUmVmLmN1cnJlbnQgPSBsYW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGkxOG5XcmFwcGVyID0gd3JhcHBlclJlZi5jdXJyZW50O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpMThuV3JhcHBlciA9IGNyZWF0ZUkxOG5XcmFwcGVyKG9yaWdpbmFsKTtcbiAgICAgICAgd3JhcHBlclJlZi5jdXJyZW50ID0gaTE4bldyYXBwZXI7XG4gICAgICAgIHdyYXBwZXJMYW5nUmVmLmN1cnJlbnQgPSBsYW5nO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmVUID0gIXJlYWR5ICYmICF1c2VTdXNwZW5zZSA/ICguLi5hcmdzKSA9PiB7XG4gICAgICB3YXJuT25jZShpMThuLCAnVVNFX1RfQkVGT1JFX1JFQURZJywgJ3VzZVRyYW5zbGF0aW9uOiB0IHdhcyBjYWxsZWQgYmVmb3JlIHJlYWR5LiBXaGVuIHVzaW5nIHVzZVN1c3BlbnNlOiBmYWxzZSwgbWFrZSBzdXJlIHRvIGNoZWNrIHRoZSByZWFkeSBmbGFnIGJlZm9yZSB1c2luZyB0LicpO1xuICAgICAgcmV0dXJuIHQoLi4uYXJncyk7XG4gICAgfSA6IHQ7XG4gICAgY29uc3QgYXJyID0gW2VmZmVjdGl2ZVQsIGkxOG5XcmFwcGVyLCByZWFkeV07XG4gICAgYXJyLnQgPSBlZmZlY3RpdmVUO1xuICAgIGFyci5pMThuID0gaTE4bldyYXBwZXI7XG4gICAgYXJyLnJlYWR5ID0gcmVhZHk7XG4gICAgcmV0dXJuIGFycjtcbiAgfSwgW3QsIGZpbmFsSTE4biwgcmVhZHksIGZpbmFsSTE4bi5yZXNvbHZlZExhbmd1YWdlLCBmaW5hbEkxOG4ubGFuZ3VhZ2UsIGZpbmFsSTE4bi5sYW5ndWFnZXNdKTtcbiAgaWYgKGkxOG4gJiYgdXNlU3VzcGVuc2UgJiYgIXJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCBvbkxvYWRlZCA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgIGlmIChwcm9wcy5sbmcpIHtcbiAgICAgICAgbG9hZExhbmd1YWdlcyhpMThuLCBwcm9wcy5sbmcsIG5hbWVzcGFjZXMsIG9uTG9hZGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvYWROYW1lc3BhY2VzKGkxOG4sIG5hbWVzcGFjZXMsIG9uTG9hZGVkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTsiLCJpbXBvcnQgeyBjcmVhdGVFbGVtZW50LCBmb3J3YXJkUmVmIGFzIGZvcndhcmRSZWZSZWFjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi91c2VUcmFuc2xhdGlvbi5qcyc7XG5pbXBvcnQgeyBnZXREaXNwbGF5TmFtZSB9IGZyb20gJy4vdXRpbHMuanMnO1xuZXhwb3J0IGNvbnN0IHdpdGhUcmFuc2xhdGlvbiA9IChucywgb3B0aW9ucyA9IHt9KSA9PiBmdW5jdGlvbiBFeHRlbmQoV3JhcHBlZENvbXBvbmVudCkge1xuICBmdW5jdGlvbiBJMThuZXh0V2l0aFRyYW5zbGF0aW9uKHtcbiAgICBmb3J3YXJkZWRSZWYsXG4gICAgLi4ucmVzdFxuICB9KSB7XG4gICAgY29uc3QgW3QsIGkxOG4sIHJlYWR5XSA9IHVzZVRyYW5zbGF0aW9uKG5zLCB7XG4gICAgICAuLi5yZXN0LFxuICAgICAga2V5UHJlZml4OiBvcHRpb25zLmtleVByZWZpeFxuICAgIH0pO1xuICAgIGNvbnN0IHBhc3NEb3duUHJvcHMgPSB7XG4gICAgICAuLi5yZXN0LFxuICAgICAgdCxcbiAgICAgIGkxOG4sXG4gICAgICB0UmVhZHk6IHJlYWR5XG4gICAgfTtcbiAgICBpZiAob3B0aW9ucy53aXRoUmVmICYmIGZvcndhcmRlZFJlZikge1xuICAgICAgcGFzc0Rvd25Qcm9wcy5yZWYgPSBmb3J3YXJkZWRSZWY7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy53aXRoUmVmICYmIGZvcndhcmRlZFJlZikge1xuICAgICAgcGFzc0Rvd25Qcm9wcy5mb3J3YXJkZWRSZWYgPSBmb3J3YXJkZWRSZWY7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVFbGVtZW50KFdyYXBwZWRDb21wb25lbnQsIHBhc3NEb3duUHJvcHMpO1xuICB9XG4gIEkxOG5leHRXaXRoVHJhbnNsYXRpb24uZGlzcGxheU5hbWUgPSBgd2l0aEkxOG5leHRUcmFuc2xhdGlvbigke2dldERpc3BsYXlOYW1lKFdyYXBwZWRDb21wb25lbnQpfSlgO1xuICBJMThuZXh0V2l0aFRyYW5zbGF0aW9uLldyYXBwZWRDb21wb25lbnQgPSBXcmFwcGVkQ29tcG9uZW50O1xuICBjb25zdCBmb3J3YXJkUmVmID0gKHByb3BzLCByZWYpID0+IGNyZWF0ZUVsZW1lbnQoSTE4bmV4dFdpdGhUcmFuc2xhdGlvbiwgT2JqZWN0LmFzc2lnbih7fSwgcHJvcHMsIHtcbiAgICBmb3J3YXJkZWRSZWY6IHJlZlxuICB9KSk7XG4gIHJldHVybiBvcHRpb25zLndpdGhSZWYgPyBmb3J3YXJkUmVmUmVhY3QoZm9yd2FyZFJlZikgOiBJMThuZXh0V2l0aFRyYW5zbGF0aW9uO1xufTsiLCJpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4vdXNlVHJhbnNsYXRpb24uanMnO1xuZXhwb3J0IGNvbnN0IFRyYW5zbGF0aW9uID0gKHtcbiAgbnMsXG4gIGNoaWxkcmVuLFxuICAuLi5vcHRpb25zXG59KSA9PiB7XG4gIGNvbnN0IFt0LCBpMThuLCByZWFkeV0gPSB1c2VUcmFuc2xhdGlvbihucywgb3B0aW9ucyk7XG4gIHJldHVybiBjaGlsZHJlbih0LCB7XG4gICAgaTE4bixcbiAgICBsbmc6IGkxOG4/Lmxhbmd1YWdlXG4gIH0sIHJlYWR5KTtcbn07IiwiaW1wb3J0IHsgY3JlYXRlRWxlbWVudCwgdXNlTWVtbyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEkxOG5Db250ZXh0IH0gZnJvbSAnLi9jb250ZXh0LmpzJztcbmV4cG9ydCBmdW5jdGlvbiBJMThuZXh0UHJvdmlkZXIoe1xuICBpMThuLFxuICBkZWZhdWx0TlMsXG4gIGNoaWxkcmVuXG59KSB7XG4gIGNvbnN0IHZhbHVlID0gdXNlTWVtbygoKSA9PiAoe1xuICAgIGkxOG4sXG4gICAgZGVmYXVsdE5TXG4gIH0pLCBbaTE4biwgZGVmYXVsdE5TXSk7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50KEkxOG5Db250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWVcbiAgfSwgY2hpbGRyZW4pO1xufSIsImltcG9ydCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBnZXRJMThuLCBJMThuQ29udGV4dCB9IGZyb20gJy4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyB3YXJuT25jZSB9IGZyb20gJy4vdXRpbHMuanMnO1xuZXhwb3J0IGNvbnN0IHVzZVNTUiA9IChpbml0aWFsSTE4blN0b3JlLCBpbml0aWFsTGFuZ3VhZ2UsIHByb3BzID0ge30pID0+IHtcbiAgY29uc3Qge1xuICAgIGkxOG46IGkxOG5Gcm9tUHJvcHNcbiAgfSA9IHByb3BzO1xuICBjb25zdCB7XG4gICAgaTE4bjogaTE4bkZyb21Db250ZXh0XG4gIH0gPSB1c2VDb250ZXh0KEkxOG5Db250ZXh0KSB8fCB7fTtcbiAgY29uc3QgaTE4biA9IGkxOG5Gcm9tUHJvcHMgfHwgaTE4bkZyb21Db250ZXh0IHx8IGdldEkxOG4oKTtcbiAgaWYgKCFpMThuKSB7XG4gICAgd2Fybk9uY2UoaTE4biwgJ05PX0kxOE5FWFRfSU5TVEFOQ0UnLCAndXNlU1NSOiBZb3Ugd2lsbCBuZWVkIHRvIHBhc3MgaW4gYW4gaTE4bmV4dCBpbnN0YW5jZSBieSB1c2luZyBpbml0UmVhY3RJMThuZXh0IG9yIGJ5IHBhc3NpbmcgaXQgdmlhIHByb3BzIG9yIGNvbnRleHQuIEluIG1vbm9yZXBvIHNldHVwcywgbWFrZSBzdXJlIHRoZXJlIGlzIG9ubHkgb25lIGluc3RhbmNlIG9mIHJlYWN0LWkxOG5leHQuJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChpMThuLm9wdGlvbnM/LmlzQ2xvbmUpIHJldHVybjtcbiAgaWYgKGluaXRpYWxJMThuU3RvcmUgJiYgIWkxOG4uaW5pdGlhbGl6ZWRTdG9yZU9uY2UpIHtcbiAgICBpZiAoIWkxOG4uc2VydmljZXM/LnJlc291cmNlU3RvcmUpIHtcbiAgICAgIHdhcm5PbmNlKGkxOG4sICdJMThOX05PVF9JTklUSUFMSVpFRCcsICd1c2VTU1I6IGkxOG4gaW5zdGFuY2Ugd2FzIGZvdW5kIGJ1dCBub3QgaW5pdGlhbGl6ZWQgKHNlcnZpY2VzLnJlc291cmNlU3RvcmUgaXMgbWlzc2luZykuIE1ha2Ugc3VyZSB5b3UgY2FsbCBpMThuZXh0LmluaXQoKSBiZWZvcmUgdXNpbmcgdXNlU1NSIOKAlCBlLmcuIGF0IG1vZHVsZSBsZXZlbCwgbm90IG9ubHkgaW4gZ2V0U3RhdGljUHJvcHMvZ2V0U2VydmVyU2lkZVByb3BzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpMThuLnNlcnZpY2VzLnJlc291cmNlU3RvcmUuZGF0YSA9IGluaXRpYWxJMThuU3RvcmU7XG4gICAgaTE4bi5vcHRpb25zLm5zID0gT2JqZWN0LnZhbHVlcyhpbml0aWFsSTE4blN0b3JlKS5yZWR1Y2UoKG1lbSwgbG5nUmVzb3VyY2VzKSA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhsbmdSZXNvdXJjZXMpLmZvckVhY2gobnMgPT4ge1xuICAgICAgICBpZiAobWVtLmluZGV4T2YobnMpIDwgMCkgbWVtLnB1c2gobnMpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWVtO1xuICAgIH0sIGkxOG4ub3B0aW9ucy5ucyk7XG4gICAgaTE4bi5pbml0aWFsaXplZFN0b3JlT25jZSA9IHRydWU7XG4gICAgaTE4bi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuICBpZiAoaW5pdGlhbExhbmd1YWdlICYmICFpMThuLmluaXRpYWxpemVkTGFuZ3VhZ2VPbmNlKSB7XG4gICAgaTE4bi5jaGFuZ2VMYW5ndWFnZShpbml0aWFsTGFuZ3VhZ2UpO1xuICAgIGkxOG4uaW5pdGlhbGl6ZWRMYW5ndWFnZU9uY2UgPSB0cnVlO1xuICB9XG59OyIsImltcG9ydCB7IGNyZWF0ZUVsZW1lbnQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTU1IgfSBmcm9tICcuL3VzZVNTUi5qcyc7XG5pbXBvcnQgeyBjb21wb3NlSW5pdGlhbFByb3BzIH0gZnJvbSAnLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGdldERpc3BsYXlOYW1lIH0gZnJvbSAnLi91dGlscy5qcyc7XG5leHBvcnQgY29uc3Qgd2l0aFNTUiA9ICgpID0+IGZ1bmN0aW9uIEV4dGVuZChXcmFwcGVkQ29tcG9uZW50KSB7XG4gIGZ1bmN0aW9uIEkxOG5leHRXaXRoU1NSKHtcbiAgICBpbml0aWFsSTE4blN0b3JlLFxuICAgIGluaXRpYWxMYW5ndWFnZSxcbiAgICAuLi5yZXN0XG4gIH0pIHtcbiAgICB1c2VTU1IoaW5pdGlhbEkxOG5TdG9yZSwgaW5pdGlhbExhbmd1YWdlKTtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudChXcmFwcGVkQ29tcG9uZW50LCB7XG4gICAgICAuLi5yZXN0XG4gICAgfSk7XG4gIH1cbiAgSTE4bmV4dFdpdGhTU1IuZ2V0SW5pdGlhbFByb3BzID0gY29tcG9zZUluaXRpYWxQcm9wcyhXcmFwcGVkQ29tcG9uZW50KTtcbiAgSTE4bmV4dFdpdGhTU1IuZGlzcGxheU5hbWUgPSBgd2l0aEkxOG5leHRTU1IoJHtnZXREaXNwbGF5TmFtZShXcmFwcGVkQ29tcG9uZW50KX0pYDtcbiAgSTE4bmV4dFdpdGhTU1IuV3JhcHBlZENvbXBvbmVudCA9IFdyYXBwZWRDb21wb25lbnQ7XG4gIHJldHVybiBJMThuZXh0V2l0aFNTUjtcbn07IiwiZXhwb3J0IHsgVHJhbnMgfSBmcm9tICcuL1RyYW5zLmpzJztcbmV4cG9ydCB7IFRyYW5zIGFzIFRyYW5zV2l0aG91dENvbnRleHQgfSBmcm9tICcuL1RyYW5zV2l0aG91dENvbnRleHQuanMnO1xuZXhwb3J0IHsgSWN1VHJhbnMgfSBmcm9tICcuL0ljdVRyYW5zLmpzJztcbmV4cG9ydCB7IEljdVRyYW5zV2l0aG91dENvbnRleHQgfSBmcm9tICcuL0ljdVRyYW5zV2l0aG91dENvbnRleHQuanMnO1xuZXhwb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuL3VzZVRyYW5zbGF0aW9uLmpzJztcbmV4cG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJy4vd2l0aFRyYW5zbGF0aW9uLmpzJztcbmV4cG9ydCB7IFRyYW5zbGF0aW9uIH0gZnJvbSAnLi9UcmFuc2xhdGlvbi5qcyc7XG5leHBvcnQgeyBJMThuZXh0UHJvdmlkZXIgfSBmcm9tICcuL0kxOG5leHRQcm92aWRlci5qcyc7XG5leHBvcnQgeyB3aXRoU1NSIH0gZnJvbSAnLi93aXRoU1NSLmpzJztcbmV4cG9ydCB7IHVzZVNTUiB9IGZyb20gJy4vdXNlU1NSLmpzJztcbmV4cG9ydCB7IGluaXRSZWFjdEkxOG5leHQgfSBmcm9tICcuL2luaXRSZWFjdEkxOG5leHQuanMnO1xuZXhwb3J0IHsgc2V0RGVmYXVsdHMsIGdldERlZmF1bHRzIH0gZnJvbSAnLi9kZWZhdWx0cy5qcyc7XG5leHBvcnQgeyBzZXRJMThuLCBnZXRJMThuIH0gZnJvbSAnLi9pMThuSW5zdGFuY2UuanMnO1xuZXhwb3J0IHsgbm9kZXNUb1N0cmluZyB9IGZyb20gJy4vVHJhbnMuanMnO1xuZXhwb3J0IHsgSTE4bkNvbnRleHQsIGNvbXBvc2VJbml0aWFsUHJvcHMsIGdldEluaXRpYWxQcm9wcyB9IGZyb20gJy4vY29udGV4dC5qcyc7XG5leHBvcnQgY29uc3QgZGF0ZSA9ICgpID0+ICcnO1xuZXhwb3J0IGNvbnN0IHRpbWUgPSAoKSA9PiAnJztcbmV4cG9ydCBjb25zdCBudW1iZXIgPSAoKSA9PiAnJztcbmV4cG9ydCBjb25zdCBzZWxlY3QgPSAoKSA9PiAnJztcbmV4cG9ydCBjb25zdCBwbHVyYWwgPSAoKSA9PiAnJztcbmV4cG9ydCBjb25zdCBzZWxlY3RPcmRpbmFsID0gKCkgPT4gJyc7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0NBS0EsT0FBTyxVQUFVO0VBQ2YsUUFBUTtFQUNSLFFBQVE7RUFDUixNQUFNO0VBQ04sT0FBTztFQUNQLFNBQVM7RUFDVCxNQUFNO0VBQ04sT0FBTztFQUNQLFNBQVM7RUFDVCxRQUFRO0VBQ1IsUUFBUTtFQUNSLFNBQVM7RUFDVCxVQUFVO0VBQ1YsU0FBUztFQUNULE9BQU87Q0FDVDs7Ozs7O0FDcEI2QixJQUFJLElBQUU7QUFBcUQsU0FBUyxFQUFFLEdBQUU7Q0FBQyxJQUFJLElBQUU7RUFBQyxNQUFLO0VBQU0sTUFBSztFQUFHLGFBQVksQ0FBQztFQUFFLE9BQU0sQ0FBQztFQUFFLFVBQVMsQ0FBQztDQUFDLEdBQUUsSUFBRSxFQUFFLE1BQU0scUJBQXFCO0NBQUUsSUFBRyxNQUFJLEVBQUUsT0FBSyxFQUFFLEtBQUlBLHFCQUFBQSxRQUFFLEVBQUUsT0FBSyxRQUFNLEVBQUUsT0FBTyxFQUFFLFNBQU8sQ0FBQyxPQUFLLEVBQUUsY0FBWSxDQUFDLElBQUcsRUFBRSxLQUFLLFdBQVcsS0FBSyxJQUFHO0VBQUMsSUFBSSxJQUFFLEVBQUUsUUFBUSxLQUFRO0VBQUUsT0FBTTtHQUFDLE1BQUs7R0FBVSxTQUFRLE9BQUssSUFBRSxFQUFFLE1BQU0sR0FBRSxDQUFDLElBQUU7RUFBRTtDQUFDO0NBQUMsS0FBSSxJQUFJLElBQUUsSUFBSSxPQUFPLENBQUMsR0FBRSxJQUFFLE1BQUssVUFBUSxJQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUksSUFBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEdBQUUsSUFBRyxFQUFFLElBQUc7RUFBQyxJQUFJLElBQUUsRUFBRSxFQUFFLENBQUMsS0FBSyxHQUFFLElBQUUsQ0FBQyxHQUFFLEVBQUU7RUFBRSxFQUFFLFFBQVEsR0FBRyxJQUFFLE9BQUssSUFBRSxFQUFFLE1BQU0sR0FBRyxJQUFHLEVBQUUsTUFBTSxFQUFFLE1BQUksRUFBRSxJQUFHLEVBQUU7Q0FBVyxPQUFNLEVBQUUsT0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsR0FBRSxFQUFFLEVBQUUsQ0FBQyxTQUFPLENBQUM7Q0FBRyxPQUFPO0FBQUM7QUFBQyxJQUFJLElBQUU7QUFBa0QsSUFBQSxJQUFFO0FBQVEsSUFBQSxJQUFFLE9BQU8sT0FBTyxJQUFJO0FBQUUsU0FBUyxFQUFFLEdBQUUsR0FBRTtDQUFDLFFBQU8sRUFBRSxNQUFUO0VBQWUsS0FBSSxRQUFPLE9BQU8sSUFBRSxFQUFFO0VBQVEsS0FBSSxPQUFNLE9BQU8sS0FBRyxNQUFJLEVBQUUsUUFBTSxFQUFFLFFBQU0sU0FBUyxHQUFFO0dBQUMsSUFBSSxJQUFFLENBQUM7R0FBRSxLQUFJLElBQUksS0FBSyxHQUFFLEVBQUUsS0FBSyxJQUFFLFFBQUssRUFBRSxLQUFHLElBQUc7R0FBRSxPQUFPLEVBQUUsU0FBTyxNQUFJLEVBQUUsS0FBSyxHQUFHLElBQUU7RUFBRSxFQUFFLEVBQUUsS0FBSyxJQUFFLE9BQUssRUFBRSxjQUFZLE9BQUssTUFBSyxFQUFFLGNBQVksSUFBRSxJQUFFLEVBQUUsU0FBUyxPQUFPLEdBQUUsRUFBRSxJQUFFLE9BQUssRUFBRSxPQUFLO0VBQUksS0FBSSxXQUFVLE9BQU8sSUFBRSxTQUFVLEVBQUUsVUFBUTtDQUFRO0FBQUM7QUFBQyxJQUFJLElBQUU7Q0FBQyxPQUFNLFNBQVMsR0FBRSxHQUFFO0VBQUMsTUFBSSxJQUFFLENBQUMsSUFBRyxFQUFFLGVBQWEsRUFBRSxhQUFXO0VBQUcsSUFBSSxHQUFFLElBQUUsQ0FBQyxHQUFFLElBQUUsQ0FBQyxHQUFFLElBQUUsSUFBRyxJQUFFLENBQUM7RUFBRSxJQUFHLE1BQUksRUFBRSxRQUFRLEdBQUcsR0FBRTtHQUFDLElBQUksSUFBRSxFQUFFLFFBQVEsR0FBRztHQUFFLEVBQUUsS0FBSztJQUFDLE1BQUs7SUFBTyxTQUFRLE9BQUssSUFBRSxJQUFFLEVBQUUsVUFBVSxHQUFFLENBQUM7R0FBQyxDQUFDO0VBQUM7RUFBQyxPQUFPLEVBQUUsUUFBUSxHQUFFLFNBQVMsR0FBRSxHQUFFO0dBQUMsSUFBRyxHQUFFO0lBQUMsSUFBRyxNQUFJLE9BQUssRUFBRSxPQUFLLEtBQUk7SUFBTyxJQUFFLENBQUM7R0FBQztHQUFDLElBQUksR0FBRSxJQUFFLFFBQU0sRUFBRSxPQUFPLENBQUMsR0FBRSxJQUFFLEVBQUUsV0FBVyxNQUFTLEdBQUUsSUFBRSxJQUFFLEVBQUUsUUFBTyxJQUFFLEVBQUUsT0FBTyxDQUFDO0dBQUUsSUFBRyxHQUFFO0lBQUMsSUFBSSxJQUFFLEVBQUUsQ0FBQztJQUFFLE9BQU8sSUFBRSxLQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUUsT0FBSyxJQUFFLEVBQUUsR0FBQSxDQUFJLFNBQVMsS0FBSyxDQUFDLEdBQUU7R0FBRTtHQUFDLElBQUcsTUFBSSxLQUFJLFdBQVMsSUFBRSxFQUFFLENBQUMsRUFBQSxDQUFHLFFBQU0sRUFBRSxXQUFXLEVBQUUsVUFBUSxFQUFFLE9BQUssYUFBWSxJQUFFLENBQUMsSUFBRyxFQUFFLGVBQWEsS0FBRyxDQUFDLEtBQUcsUUFBTSxLQUFHLEVBQUUsU0FBUyxLQUFLO0lBQUMsTUFBSztJQUFPLFNBQVEsRUFBRSxNQUFNLEdBQUUsRUFBRSxRQUFRLEtBQUksQ0FBQyxDQUFDO0dBQUMsQ0FBQyxHQUFFLE1BQUksS0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFHLElBQUUsRUFBRSxJQUFFLE9BQUssRUFBRSxTQUFTLEtBQUssQ0FBQyxHQUFFLEVBQUUsS0FBRyxLQUFJLENBQUMsS0FBRyxFQUFFLGlCQUFlLElBQUUsT0FBSyxFQUFFLGVBQWEsRUFBRSxTQUFP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QVM7Q0FDVCxhQUFhO0NBQ2IsU0FBUztDQUNULFNBQVM7Q0FDVCxTQUFTO0NBQ1QsV0FBVztDQUNYLFdBQVc7Q0FDWCxVQUFVO0NBQ1YsV0FBVztDQUNYLFdBQVc7Q0FDWCxhQUFhO0NBQ2IsVUFBVTtDQUNWLFNBQVM7Q0FDVCxXQUFXO0NBQ1gsVUFBVTtDQUNWLFdBQVc7Q0FDWCxZQUFZO0NBQ1osUUFBUTtDQUNSLFFBQVE7Q0FDUixRQUFRO0NBQ1IsYUFBYTtDQUNiLFFBQVE7Q0FDUixTQUFTO0NBQ1QsV0FBVztDQUNYLFNBQVM7Q0FDVCxhQUFhO0NBQ2IsU0FBUztDQUNULFNBQVM7Q0FDVCxTQUFTO0NBQ1QsV0FBVztDQUNYLFlBQVk7Q0FDWixZQUFZO0NBQ1osV0FBVztDQUNYLFlBQVk7Q0FDWixVQUFVO0NBQ1YsV0FBVztDQUNYLFdBQVc7Q0FDWCxZQUFZO0NBQ1osWUFBWTtDQUNaLFlBQVk7Q0FDWixXQUFXO0NBQ1gsVUFBVTtDQUNWLFlBQVk7Q0FDWixZQUFZO0NBQ1osV0FBVztDQUNYLFVBQVU7Q0FDVixTQUFTO0NBQ1QsWUFBWTtDQUNaLFlBQVk7Q0FDWixZQUFZO0NBQ1osV0FBVztDQUNYLFlBQVk7Q0FDWixVQUFVO0NBQ1YsWUFBWTtDQUNaLFlBQVk7Q0FDWixZQUFZO0NBQ1osV0FBVztDQUNYLFVBQVU7Q0FDVixZQUFZO0NBQ1osV0FBVztDQUNYLFdBQVc7Q0FDWCxZQUFZO0NBQ1osWUFBWTtDQUNaLFdBQVc7Q0FDWCxZQUFZO0NBQ1osVUFBVTtDQUNWLFdBQVc7Q0FDWCxXQUFXO0NBQ1gsWUFBWTtDQUNaLFlBQVk7Q0FDWixZQUFZO0NBQ1osV0FBVztDQUNYLFVBQVU7Q0FDVixZQUFZO0NBQ1osWUFBWTtDQUNaLFdBQVc7Q0FDWCxVQUFVO0NBQ1YsU0FBUztDQUNULFlBQVk7Q0FDWixZQUFZO0NBQ1osWUFBWTtDQUNaLFdBQVc7Q0FDWCxZQUFZO0NBQ1osVUFBVTtDQUNWLFlBQVk7Q0FDWixZQUFZO0NBQ1osWUFBWTtDQUNaLFdBQVc7Q0FDWCxVQUFVO0NBQ1YsWUFBWTtDQUNaLFdB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RUFDekMsTUFDRixHQUFHLFFBQVE7QUFDYjs7O0FDWEEsSUFBYSxVQUFVLGtCQUFrQixpQkFBaUIsUUFBUSxDQUFDLE1BQU07Q0FDdkUsTUFBTSxFQUNKLE1BQU0sa0JBQ0o7Q0FDSixNQUFNLEVBQ0osTUFBTSxxQkFBQSxHQUNKQyxhQUFBQSxXQUFBQSxDQUFXLFdBQVcsS0FBSyxDQUFDO0NBQ2hDLE1BQU0sT0FBTyxpQkFBaUIsbUJBQW1CLFFBQVE7Q0FDekQsSUFBSSxDQUFDLE1BQU07RUFDVCxTQUFTLE1BQU0sdUJBQXVCLGtNQUFrTTtFQUN4TztDQUNGO0NBQ0EsSUFBSSxLQUFLLFNBQVMsU0FBUztDQUMzQixJQUFJLG9CQUFvQixDQUFDLEtBQUssc0JBQXNCO0VBQ2xELElBQUksQ0FBQyxLQUFLLFVBQVUsZUFBZTtHQUNqQyxTQUFTLE1BQU0sd0JBQXdCLHVOQUF1TjtHQUM5UDtFQUNGO0VBQ0EsS0FBSyxTQUFTLGNBQWMsT0FBTztFQUNuQyxLQUFLLFFBQVEsS0FBSyxPQUFPLE9BQU8sZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEtBQUssaUJBQWlCO0dBQzlFLE9BQU8sS0FBSyxZQUFZLENBQUMsQ0FBQyxTQUFRLE9BQU07SUFDdEMsSUFBSSxJQUFJLFFBQVEsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7R0FDdEMsQ0FBQztHQUNELE9BQU87RUFDVCxHQUFHLEtBQUssUUFBUSxFQUFFO0VBQ2xCLEtBQUssdUJBQXVCO0VBQzVCLEtBQUssZ0JBQWdCO0NBQ3ZCO0NBQ0EsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLHlCQUF5QjtFQUNwRCxLQUFLLGVBQWUsZUFBZTtFQUNuQyxLQUFLLDBCQUEwQjtDQUNqQztBQUNGOzs7QUMvQkEsSUFBYSxnQkFBZ0IsU0FBUyxPQUFPLGtCQUFrQjtDQUM3RCxTQUFTLGVBQWUsRUFDdEIsa0JBQ0EsaUJBQ0EsR0FBRyxRQUNGO0VBQ0QsT0FBTyxrQkFBa0IsZUFBZTtFQUN4QyxRQUFBLEdBQU9DLGFBQUFBLGNBQUFBLENBQWMsa0JBQWtCLEVBQ3JDLEdBQUcsS0FDTCxDQUFDO0NBQ0g7Q0FDQSxlQUFlLGtCQUFrQixvQkFBb0IsZ0JBQWdCO0NBQ3JFLGVBQWUsY0FBYyxrQkFBa0IsZUFBZSxnQkFBZ0IsRUFBRTtDQUNoRixlQUFlLG1CQUFtQjtDQUNsQyxPQUFPO0FBQ1Q7OztBQ0pBLElBQWEsYUFBYTtBQUMxQixJQUFhLGFBQWE7QUFDMUIsSUFBYSxlQUFlO0FBQzVCLElBQWEsZUFBZTtBQUM1QixJQUFhLGVBQWU7QUFDNUIsSUFBYSxzQkFBc0IiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMl19