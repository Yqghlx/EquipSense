//#region node_modules/i18next/dist/esm/i18next.js
var isString = (obj) => typeof obj === "string";
var defer = () => {
	let res;
	let rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	promise.resolve = res;
	promise.reject = rej;
	return promise;
};
var makeString = (object) => {
	if (object == null) return "";
	return String(object);
};
var copy = (a, s, t) => {
	a.forEach((m) => {
		if (s[m]) t[m] = s[m];
	});
};
var lastOfPathSeparatorRegExp = /###/g;
var cleanKey = (key) => key && key.includes("###") ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
var canNotTraverseDeeper = (object) => !object || isString(object);
var getLastOfPath = (object, path, Empty) => {
	const stack = !isString(path) ? path : path.split(".");
	let stackIndex = 0;
	while (stackIndex < stack.length - 1) {
		if (canNotTraverseDeeper(object)) return {};
		const key = cleanKey(stack[stackIndex]);
		if (!object[key] && Empty) object[key] = new Empty();
		if (Object.prototype.hasOwnProperty.call(object, key)) object = object[key];
		else object = {};
		++stackIndex;
	}
	if (canNotTraverseDeeper(object)) return {};
	return {
		obj: object,
		k: cleanKey(stack[stackIndex])
	};
};
var setPath = (object, path, newValue) => {
	const { obj, k } = getLastOfPath(object, path, Object);
	if (obj !== void 0 || path.length === 1) {
		obj[k] = newValue;
		return;
	}
	let e = path[path.length - 1];
	let p = path.slice(0, path.length - 1);
	let last = getLastOfPath(object, p, Object);
	while (last.obj === void 0 && p.length) {
		e = `${p[p.length - 1]}.${e}`;
		p = p.slice(0, p.length - 1);
		last = getLastOfPath(object, p, Object);
		if (last?.obj && typeof last.obj[`${last.k}.${e}`] !== "undefined") last.obj = void 0;
	}
	last.obj[`${last.k}.${e}`] = newValue;
};
var pushPath = (object, path, newValue, concat) => {
	const { obj, k } = getLastOfPath(object, path, Object);
	obj[k] = obj[k] || [];
	obj[k].push(newValue);
};
var getPath = (object, path) => {
	const { obj, k } = getLastOfPath(object, path);
	if (!obj) return void 0;
	if (!Object.prototype.hasOwnProperty.call(obj, k)) return void 0;
	return obj[k];
};
var getPathWithDefaults = (data, defaultData, key) => {
	const value = getPath(data, key);
	if (value !== void 0) return value;
	return getPath(defaultData, key);
};
var deepExtend = (target, source, overwrite) => {
	for (const prop in source) if (prop !== "__proto__" && prop !== "constructor") if (prop in target) if (isString(target[prop]) || target[prop] instanceof String || isString(source[prop]) || source[prop] instanceof String) {
		if (overwrite) target[prop] = source[prop];
	} else deepExtend(target[prop], source[prop], overwrite);
	else target[prop] = source[prop];
	return target;
};
var regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var _entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"/": "&#x2F;"
};
var escape = (data) => {
	if (isString(data)) return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
	return data;
};
var RegExpCache = class {
	constructor(capacity) {
		this.capacity = capacity;
		this.regExpMap = /* @__PURE__ */ new Map();
		this.regExpQueue = [];
	}
	getRegExp(pattern) {
		const regExpFromCache = this.regExpMap.get(pattern);
		if (regExpFromCache !== void 0) return regExpFromCache;
		const regExpNew = new RegExp(pattern);
		if (this.regExpQueue.length === this.capacity) this.regExpMap.delete(this.regExpQueue.shift());
		this.regExpMap.set(pattern, regExpNew);
		this.regExpQueue.push(pattern);
		return regExpNew;
	}
};
var chars = [
	" ",
	",",
	"?",
	"!",
	";"
];
var looksLikeObjectPathRegExpCache = new RegExpCache(20);
var looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
	nsSeparator = nsSeparator || "";
	keySeparator = keySeparator || "";
	const possibleChars = chars.filter((c) => !nsSeparator.includes(c) && !keySeparator.includes(c));
	if (possibleChars.length === 0) return true;
	const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
	let matched = !r.test(key);
	if (!matched) {
		const ki = key.indexOf(keySeparator);
		if (ki > 0 && !r.test(key.substring(0, ki))) matched = true;
	}
	return matched;
};
var deepFind = (obj, path, keySeparator = ".") => {
	if (!obj) return void 0;
	if (obj[path]) {
		if (!Object.prototype.hasOwnProperty.call(obj, path)) return void 0;
		return obj[path];
	}
	const tokens = path.split(keySeparator);
	let current = obj;
	for (let i = 0; i < tokens.length;) {
		if (!current || typeof current !== "object") return;
		let next;
		let nextPath = "";
		for (let j = i; j < tokens.length; ++j) {
			if (j !== i) nextPath += keySeparator;
			nextPath += tokens[j];
			next = current[nextPath];
			if (next !== void 0) {
				if ([
					"string",
					"number",
					"boolean"
				].includes(typeof next) && j < tokens.length - 1) continue;
				i += j - i + 1;
				break;
			}
		}
		current = next;
	}
	return current;
};
var getCleanedCode = (code) => code?.replace(/_/g, "-");
var consoleLogger = {
	type: "logger",
	log(args) {
		this.output("log", args);
	},
	warn(args) {
		this.output("warn", args);
	},
	error(args) {
		this.output("error", args);
	},
	output(type, args) {
		console?.[type]?.apply?.(console, args);
	}
};
var baseLogger = new class Logger {
	constructor(concreteLogger, options = {}) {
		this.init(concreteLogger, options);
	}
	init(concreteLogger, options = {}) {
		this.prefix = options.prefix || "i18next:";
		this.logger = concreteLogger || consoleLogger;
		this.options = options;
		this.debug = options.debug;
	}
	log(...args) {
		return this.forward(args, "log", "", true);
	}
	warn(...args) {
		return this.forward(args, "warn", "", true);
	}
	error(...args) {
		return this.forward(args, "error", "");
	}
	deprecate(...args) {
		return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
	}
	forward(args, lvl, prefix, debugOnly) {
		if (debugOnly && !this.debug) return null;
		args = args.map((a) => isString(a) ? a.replace(/[\r\n\x00-\x1F\x7F]/g, " ") : a);
		if (isString(args[0])) args[0] = `${prefix}${this.prefix} ${args[0]}`;
		return this.logger[lvl](args);
	}
	create(moduleName) {
		return new Logger(this.logger, {
			prefix: `${this.prefix}:${moduleName}:`,
			...this.options
		});
	}
	clone(options) {
		options = options || this.options;
		options.prefix = options.prefix || this.prefix;
		return new Logger(this.logger, options);
	}
}();
var EventEmitter = class {
	constructor() {
		this.observers = {};
	}
	on(events, listener) {
		events.split(" ").forEach((event) => {
			if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
			const numListeners = this.observers[event].get(listener) || 0;
			this.observers[event].set(listener, numListeners + 1);
		});
		return this;
	}
	off(event, listener) {
		if (!this.observers[event]) return;
		if (!listener) {
			delete this.observers[event];
			return;
		}
		this.observers[event].delete(listener);
	}
	once(event, listener) {
		const wrapper = (...args) => {
			listener(...args);
			this.off(event, wrapper);
		};
		this.on(event, wrapper);
		return this;
	}
	emit(event, ...args) {
		if (this.observers[event]) Array.from(this.observers[event].entries()).forEach(([observer, numTimesAdded]) => {
			for (let i = 0; i < numTimesAdded; i++) observer(...args);
		});
		if (this.observers["*"]) Array.from(this.observers["*"].entries()).forEach(([observer, numTimesAdded]) => {
			for (let i = 0; i < numTimesAdded; i++) observer(event, ...args);
		});
	}
};
var ResourceStore = class extends EventEmitter {
	constructor(data, options = {
		ns: ["translation"],
		defaultNS: "translation"
	}) {
		super();
		this.data = data || {};
		this.options = options;
		if (this.options.keySeparator === void 0) this.options.keySeparator = ".";
		if (this.options.ignoreJSONStructure === void 0) this.options.ignoreJSONStructure = true;
	}
	addNamespaces(ns) {
		if (!this.options.ns.includes(ns)) this.options.ns.push(ns);
	}
	removeNamespaces(ns) {
		const index = this.options.ns.indexOf(ns);
		if (index > -1) this.options.ns.splice(index, 1);
	}
	getResource(lng, ns, key, options = {}) {
		const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
		const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
		let path;
		if (lng.includes(".")) path = lng.split(".");
		else {
			path = [lng, ns];
			if (key) if (Array.isArray(key)) path.push(...key);
			else if (isString(key) && keySeparator) path.push(...key.split(keySeparator));
			else path.push(key);
		}
		const result = getPath(this.data, path);
		if (!result && !ns && !key && lng.includes(".")) {
			lng = path[0];
			ns = path[1];
			key = path.slice(2).join(".");
		}
		if (result || !ignoreJSONStructure || !isString(key)) return result;
		return deepFind(this.data?.[lng]?.[ns], key, keySeparator);
	}
	addResource(lng, ns, key, value, options = { silent: false }) {
		const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
		let path = [lng, ns];
		if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);
		if (lng.includes(".")) {
			path = lng.split(".");
			value = ns;
			ns = path[1];
		}
		this.addNamespaces(ns);
		setPath(this.data, path, value);
		if (!options.silent) this.emit("added", lng, ns, key, value);
	}
	addResources(lng, ns, resources, options = { silent: false }) {
		for (const m in resources) if (isString(resources[m]) || Array.isArray(resources[m])) this.addResource(lng, ns, m, resources[m], { silent: true });
		if (!options.silent) this.emit("added", lng, ns, resources);
	}
	addResourceBundle(lng, ns, resources, deep, overwrite, options = {
		silent: false,
		skipCopy: false
	}) {
		let path = [lng, ns];
		if (lng.includes(".")) {
			path = lng.split(".");
			deep = resources;
			resources = ns;
			ns = path[1];
		}
		this.addNamespaces(ns);
		let pack = getPath(this.data, path) || {};
		if (!options.skipCopy) resources = JSON.parse(JSON.stringify(resources));
		if (deep) deepExtend(pack, resources, overwrite);
		else pack = {
			...pack,
			...resources
		};
		setPath(this.data, path, pack);
		if (!options.silent) this.emit("added", lng, ns, resources);
	}
	removeResourceBundle(lng, ns) {
		if (this.hasResourceBundle(lng, ns)) delete this.data[lng][ns];
		this.removeNamespaces(ns);
		this.emit("removed", lng, ns);
	}
	hasResourceBundle(lng, ns) {
		return this.getResource(lng, ns) !== void 0;
	}
	getResourceBundle(lng, ns) {
		if (!ns) ns = this.options.defaultNS;
		return this.getResource(lng, ns);
	}
	getDataByLanguage(lng) {
		return this.data[lng];
	}
	hasLanguageSomeTranslations(lng) {
		const data = this.getDataByLanguage(lng);
		return !!(data && Object.keys(data) || []).find((v) => data[v] && Object.keys(data[v]).length > 0);
	}
	toJSON() {
		return this.data;
	}
};
var postProcessor = {
	processors: {},
	addPostProcessor(module) {
		this.processors[module.name] = module;
	},
	handle(processors, value, key, options, translator) {
		processors.forEach((processor) => {
			value = this.processors[processor]?.process(value, key, options, translator) ?? value;
		});
		return value;
	}
};
var PATH_KEY = Symbol("i18next/PATH_KEY");
function createProxy() {
	const state = [];
	const handler = Object.create(null);
	let proxy;
	handler.get = (target, key) => {
		proxy?.revoke?.();
		if (key === PATH_KEY) return state;
		state.push(key);
		proxy = Proxy.revocable(target, handler);
		return proxy.proxy;
	};
	return Proxy.revocable(Object.create(null), handler).proxy;
}
function keysFromSelector(selector, opts) {
	const { [PATH_KEY]: path } = selector(createProxy());
	const keySeparator = opts?.keySeparator ?? ".";
	const nsSeparator = opts?.nsSeparator ?? ":";
	const strict = opts?.enableSelector === "strict";
	if (path.length > 1 && nsSeparator) {
		const ns = opts?.ns;
		const nsList = strict ? Array.isArray(ns) ? ns : ns ? [ns] : null : Array.isArray(ns) ? ns : null;
		if (nsList) {
			if ((strict ? nsList : nsList.length > 1 ? nsList.slice(1) : []).includes(path[0])) return `${path[0]}${nsSeparator}${path.slice(1).join(keySeparator)}`;
		}
	}
	return path.join(keySeparator);
}
var shouldHandleAsObject = (res) => !isString(res) && typeof res !== "boolean" && typeof res !== "number";
var Translator = class Translator extends EventEmitter {
	constructor(services, options = {}) {
		super();
		copy([
			"resourceStore",
			"languageUtils",
			"pluralResolver",
			"interpolator",
			"backendConnector",
			"i18nFormat",
			"utils"
		], services, this);
		this.options = options;
		if (this.options.keySeparator === void 0) this.options.keySeparator = ".";
		this.logger = baseLogger.create("translator");
		this.checkedLoadedFor = {};
	}
	changeLanguage(lng) {
		if (lng) this.language = lng;
	}
	exists(key, o = { interpolation: {} }) {
		const opt = { ...o };
		if (key == null) return false;
		const resolved = this.resolve(key, opt);
		if (resolved?.res === void 0) return false;
		const isObject = shouldHandleAsObject(resolved.res);
		if (opt.returnObjects === false && isObject) return false;
		return true;
	}
	extractFromKey(key, opt) {
		let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
		if (nsSeparator === void 0) nsSeparator = ":";
		const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
		let namespaces = opt.ns || this.options.defaultNS || [];
		const wouldCheckForNsInKey = nsSeparator && key.includes(nsSeparator);
		const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !opt.keySeparator && !this.options.userDefinedNsSeparator && !opt.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
		if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
			const m = key.match(this.interpolator.nestingRegexp);
			if (m && m.length > 0) return {
				key,
				namespaces: isString(namespaces) ? [namespaces] : namespaces
			};
			const parts = key.split(nsSeparator);
			if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.includes(parts[0])) namespaces = parts.shift();
			key = parts.join(keySeparator);
		}
		return {
			key,
			namespaces: isString(namespaces) ? [namespaces] : namespaces
		};
	}
	translate(keys, o, lastKey) {
		let opt = typeof o === "object" ? { ...o } : o;
		if (typeof opt !== "object" && this.options.overloadTranslationOptionHandler) opt = this.options.overloadTranslationOptionHandler(arguments);
		if (typeof opt === "object") opt = { ...opt };
		if (!opt) opt = {};
		if (keys == null) return "";
		if (typeof keys === "function") keys = keysFromSelector(keys, {
			...this.options,
			...opt
		});
		if (!Array.isArray(keys)) keys = [String(keys)];
		keys = keys.map((k) => typeof k === "function" ? keysFromSelector(k, {
			...this.options,
			...opt
		}) : String(k));
		const returnDetails = opt.returnDetails !== void 0 ? opt.returnDetails : this.options.returnDetails;
		const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
		const { key, namespaces } = this.extractFromKey(keys[keys.length - 1], opt);
		const namespace = namespaces[namespaces.length - 1];
		let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
		if (nsSeparator === void 0) nsSeparator = ":";
		const lng = opt.lng || this.language;
		const appendNamespaceToCIMode = opt.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
		if (lng?.toLowerCase() === "cimode") {
			if (appendNamespaceToCIMode) {
				if (returnDetails) return {
					res: `${namespace}${nsSeparator}${key}`,
					usedKey: key,
					exactUsedKey: key,
					usedLng: lng,
					usedNS: namespace,
					usedParams: this.getUsedParamsDetails(opt)
				};
				return `${namespace}${nsSeparator}${key}`;
			}
			if (returnDetails) return {
				res: key,
				usedKey: key,
				exactUsedKey: key,
				usedLng: lng,
				usedNS: namespace,
				usedParams: this.getUsedParamsDetails(opt)
			};
			return key;
		}
		const resolved = this.resolve(keys, opt);
		let res = resolved?.res;
		const resUsedKey = resolved?.usedKey || key;
		const resExactUsedKey = resolved?.exactUsedKey || key;
		const noObject = [
			"[object Number]",
			"[object Function]",
			"[object RegExp]"
		];
		const joinArrays = opt.joinArrays !== void 0 ? opt.joinArrays : this.options.joinArrays;
		const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
		const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
		const hasDefaultValue = Translator.hasDefaultValue(opt);
		const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, opt) : "";
		const defaultValueSuffixOrdinalFallback = opt.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, { ordinal: false }) : "";
		const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
		const defaultValue = needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] || opt[`defaultValue${defaultValueSuffix}`] || opt[`defaultValue${defaultValueSuffixOrdinalFallback}`] || opt.defaultValue;
		let resForObjHndl = res;
		if (handleAsObjectInI18nFormat && !res && hasDefaultValue) resForObjHndl = defaultValue;
		const handleAsObject = shouldHandleAsObject(resForObjHndl);
		const resType = Object.prototype.toString.apply(resForObjHndl);
		if (handleAsObjectInI18nFormat && resForObjHndl && handleAsObject && !noObject.includes(resType) && !(isString(joinArrays) && Array.isArray(resForObjHndl))) {
			if (!opt.returnObjects && !this.options.returnObjects) {
				if (!this.options.returnedObjectHandler) this.logger.warn("accessing an object - but returnObjects options is not enabled!");
				const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, resForObjHndl, {
					...opt,
					ns: namespaces
				}) : `key '${key} (${this.language})' returned an object instead of string.`;
				if (returnDetails) {
					resolved.res = r;
					resolved.usedParams = this.getUsedParamsDetails(opt);
					return resolved;
				}
				return r;
			}
			if (keySeparator) {
				const resTypeIsArray = Array.isArray(resForObjHndl);
				const copy = resTypeIsArray ? [] : {};
				const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
				for (const m in resForObjHndl) if (Object.prototype.hasOwnProperty.call(resForObjHndl, m)) {
					const deepKey = `${newKeyToUse}${keySeparator}${m}`;
					if (hasDefaultValue && !res) copy[m] = this.translate(deepKey, {
						...opt,
						defaultValue: shouldHandleAsObject(defaultValue) ? defaultValue[m] : void 0,
						joinArrays: false,
						ns: namespaces
					});
					else copy[m] = this.translate(deepKey, {
						...opt,
						joinArrays: false,
						ns: namespaces
					});
					if (copy[m] === deepKey) copy[m] = resForObjHndl[m];
				}
				res = copy;
			}
		} else if (handleAsObjectInI18nFormat && isString(joinArrays) && Array.isArray(res)) {
			res = res.join(joinArrays);
			if (res) res = this.extendTranslation(res, keys, opt, lastKey);
		} else {
			let usedDefault = false;
			let usedKey = false;
			if (!this.isValidLookup(res) && hasDefaultValue) {
				usedDefault = true;
				res = defaultValue;
			}
			if (!this.isValidLookup(res)) {
				usedKey = true;
				res = key;
			}
			const resForMissing = (opt.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && usedKey ? void 0 : res;
			const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
			if (usedKey || usedDefault || updateMissing) {
				this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, needsPluralHandling && !updateMissing ? `${key}${this.pluralResolver.getSuffix(lng, opt.count, opt)}` : key, updateMissing ? defaultValue : res);
				if (keySeparator) {
					const fk = this.resolve(key, {
						...opt,
						keySeparator: false
					});
					if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
				}
				let lngs = [];
				const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, opt.lng || this.language);
				if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) for (let i = 0; i < fallbackLngs.length; i++) lngs.push(fallbackLngs[i]);
				else if (this.options.saveMissingTo === "all") lngs = this.languageUtils.toResolveHierarchy(opt.lng || this.language);
				else lngs.push(opt.lng || this.language);
				const send = (l, k, specificDefaultValue) => {
					const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
					if (this.options.missingKeyHandler) this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, opt);
					else if (this.backendConnector?.saveMissing) this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, opt);
					this.emit("missingKey", l, namespace, k, res);
				};
				if (this.options.saveMissing) if (this.options.saveMissingPlurals && needsPluralHandling) lngs.forEach((language) => {
					const suffixes = this.pluralResolver.getSuffixes(language, opt);
					if (needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] && !suffixes.includes(`${this.options.pluralSeparator}zero`)) suffixes.push(`${this.options.pluralSeparator}zero`);
					suffixes.forEach((suffix) => {
						send([language], key + suffix, opt[`defaultValue${suffix}`] || defaultValue);
					});
				});
				else send(lngs, key, defaultValue);
			}
			res = this.extendTranslation(res, keys, opt, resolved, lastKey);
			if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = `${namespace}${nsSeparator}${key}`;
			if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}${nsSeparator}${key}` : key, usedDefault ? res : void 0, opt);
		}
		if (returnDetails) {
			resolved.res = res;
			resolved.usedParams = this.getUsedParamsDetails(opt);
			return resolved;
		}
		return res;
	}
	extendTranslation(res, key, opt, resolved, lastKey) {
		if (this.i18nFormat?.parse) res = this.i18nFormat.parse(res, {
			...this.options.interpolation.defaultVariables,
			...opt
		}, opt.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, { resolved });
		else if (!opt.skipInterpolation) {
			if (opt.interpolation) this.interpolator.init({
				...opt,
				interpolation: {
					...this.options.interpolation,
					...opt.interpolation
				}
			});
			const skipOnVariables = isString(res) && (opt?.interpolation?.skipOnVariables !== void 0 ? opt.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
			let nestBef;
			if (skipOnVariables) {
				const nb = res.match(this.interpolator.nestingRegexp);
				nestBef = nb && nb.length;
			}
			let data = opt.replace && !isString(opt.replace) ? opt.replace : opt;
			if (this.options.interpolation.defaultVariables) data = {
				...this.options.interpolation.defaultVariables,
				...data
			};
			res = this.interpolator.interpolate(res, data, opt.lng || this.language || resolved.usedLng, opt);
			if (skipOnVariables) {
				const na = res.match(this.interpolator.nestingRegexp);
				const nestAft = na && na.length;
				if (nestBef < nestAft) opt.nest = false;
			}
			if (!opt.lng && resolved && resolved.res) opt.lng = this.language || resolved.usedLng;
			if (opt.nest !== false) res = this.interpolator.nest(res, (...args) => {
				if (lastKey?.[0] === args[0] && !opt.context) {
					this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
					return null;
				}
				return this.translate(...args, key);
			}, opt);
			if (opt.interpolation) this.interpolator.reset();
		}
		const postProcess = opt.postProcess || this.options.postProcess;
		const postProcessorNames = isString(postProcess) ? [postProcess] : postProcess;
		if (res != null && postProcessorNames?.length && opt.applyPostProcessor !== false) res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
			i18nResolved: {
				...resolved,
				usedParams: this.getUsedParamsDetails(opt)
			},
			...opt
		} : opt, this);
		return res;
	}
	resolve(keys, opt = {}) {
		let found;
		let usedKey;
		let exactUsedKey;
		let usedLng;
		let usedNS;
		if (isString(keys)) keys = [keys];
		if (Array.isArray(keys)) keys = keys.map((k) => typeof k === "function" ? keysFromSelector(k, {
			...this.options,
			...opt
		}) : k);
		keys.forEach((k) => {
			if (this.isValidLookup(found)) return;
			const extracted = this.extractFromKey(k, opt);
			const key = extracted.key;
			usedKey = key;
			let namespaces = extracted.namespaces;
			if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
			const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
			const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
			const needsContextHandling = opt.context !== void 0 && (isString(opt.context) || typeof opt.context === "number") && opt.context !== "";
			const codes = opt.lngs ? opt.lngs : this.languageUtils.toResolveHierarchy(opt.lng || this.language, opt.fallbackLng);
			namespaces.forEach((ns) => {
				if (this.isValidLookup(found)) return;
				usedNS = ns;
				if (!this.checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(usedNS)) {
					this.checkedLoadedFor[`${codes[0]}-${ns}`] = true;
					this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
				}
				codes.forEach((code) => {
					if (this.isValidLookup(found)) return;
					usedLng = code;
					const finalKeys = [key];
					if (this.i18nFormat?.addLookupKeys) this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, opt);
					else {
						let pluralSuffix;
						if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, opt.count, opt);
						const zeroSuffix = `${this.options.pluralSeparator}zero`;
						const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
						if (needsPluralHandling) {
							if (opt.ordinal && pluralSuffix.startsWith(ordinalPrefix)) finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
							finalKeys.push(key + pluralSuffix);
							if (needsZeroSuffixLookup) finalKeys.push(key + zeroSuffix);
						}
						if (needsContextHandling) {
							const contextKey = `${key}${this.options.contextSeparator || "_"}${opt.context}`;
							finalKeys.push(contextKey);
							if (needsPluralHandling) {
								if (opt.ordinal && pluralSuffix.startsWith(ordinalPrefix)) finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
								finalKeys.push(contextKey + pluralSuffix);
								if (needsZeroSuffixLookup) finalKeys.push(contextKey + zeroSuffix);
							}
						}
					}
					let possibleKey;
					while (possibleKey = finalKeys.pop()) if (!this.isValidLookup(found)) {
						exactUsedKey = possibleKey;
						found = this.getResource(code, ns, possibleKey, opt);
					}
				});
			});
		});
		return {
			res: found,
			usedKey,
			exactUsedKey,
			usedLng,
			usedNS
		};
	}
	isValidLookup(res) {
		return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
	}
	getResource(code, ns, key, options = {}) {
		if (this.i18nFormat?.getResource) return this.i18nFormat.getResource(code, ns, key, options);
		return this.resourceStore.getResource(code, ns, key, options);
	}
	getUsedParamsDetails(options = {}) {
		const optionsKeys = [
			"defaultValue",
			"ordinal",
			"context",
			"replace",
			"lng",
			"lngs",
			"fallbackLng",
			"ns",
			"keySeparator",
			"nsSeparator",
			"returnObjects",
			"returnDetails",
			"joinArrays",
			"postProcess",
			"interpolation"
		];
		const useOptionsReplaceForData = options.replace && !isString(options.replace);
		let data = useOptionsReplaceForData ? options.replace : options;
		if (useOptionsReplaceForData && typeof options.count !== "undefined") data.count = options.count;
		if (this.options.interpolation.defaultVariables) data = {
			...this.options.interpolation.defaultVariables,
			...data
		};
		if (!useOptionsReplaceForData) {
			data = { ...data };
			for (const key of optionsKeys) delete data[key];
		}
		return data;
	}
	static hasDefaultValue(options) {
		const prefix = "defaultValue";
		for (const option in options) if (Object.prototype.hasOwnProperty.call(options, option) && option.startsWith(prefix) && void 0 !== options[option]) return true;
		return false;
	}
};
var LanguageUtil = class {
	constructor(options) {
		this.options = options;
		this.supportedLngs = this.options.supportedLngs || false;
		this.logger = baseLogger.create("languageUtils");
	}
	getScriptPartFromCode(code) {
		code = getCleanedCode(code);
		if (!code || !code.includes("-")) return null;
		const p = code.split("-");
		if (p.length === 2) return null;
		p.pop();
		if (p[p.length - 1].toLowerCase() === "x") return null;
		return this.formatLanguageCode(p.join("-"));
	}
	getLanguagePartFromCode(code) {
		code = getCleanedCode(code);
		if (!code || !code.includes("-")) return code;
		const p = code.split("-");
		return this.formatLanguageCode(p[0]);
	}
	formatLanguageCode(code) {
		if (isString(code) && code.includes("-")) {
			let formattedCode;
			try {
				formattedCode = Intl.getCanonicalLocales(code)[0];
			} catch (e) {}
			if (formattedCode && this.options.lowerCaseLng) formattedCode = formattedCode.toLowerCase();
			if (formattedCode) return formattedCode;
			if (this.options.lowerCaseLng) return code.toLowerCase();
			return code;
		}
		return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
	}
	isSupportedCode(code) {
		if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) code = this.getLanguagePartFromCode(code);
		return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.includes(code);
	}
	getBestMatchFromCodes(codes) {
		if (!codes) return null;
		let found;
		codes.forEach((code) => {
			if (found) return;
			const cleanedLng = this.formatLanguageCode(code);
			if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
		});
		if (!found && this.options.supportedLngs) codes.forEach((code) => {
			if (found) return;
			const lngScOnly = this.getScriptPartFromCode(code);
			if (this.isSupportedCode(lngScOnly)) return found = lngScOnly;
			const lngOnly = this.getLanguagePartFromCode(code);
			if (this.isSupportedCode(lngOnly)) return found = lngOnly;
			found = this.options.supportedLngs.find((supportedLng) => {
				if (supportedLng === lngOnly) return true;
				if (!supportedLng.includes("-") && !lngOnly.includes("-")) return false;
				if (supportedLng.includes("-") && !lngOnly.includes("-") && supportedLng.slice(0, supportedLng.indexOf("-")) === lngOnly) return true;
				if (supportedLng.startsWith(lngOnly) && lngOnly.length > 1) return true;
				return false;
			});
		});
		if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
		return found;
	}
	getFallbackCodes(fallbacks, code) {
		if (!fallbacks) return [];
		if (typeof fallbacks === "function") fallbacks = fallbacks(code);
		if (isString(fallbacks)) fallbacks = [fallbacks];
		if (Array.isArray(fallbacks)) return fallbacks;
		if (!code) return fallbacks.default || [];
		let found = fallbacks[code];
		if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
		if (!found) found = fallbacks[this.formatLanguageCode(code)];
		if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
		if (!found) found = fallbacks.default;
		return found || [];
	}
	toResolveHierarchy(code, fallbackCode) {
		const fallbackCodes = this.getFallbackCodes((fallbackCode === false ? [] : fallbackCode) || this.options.fallbackLng || [], code);
		const codes = [];
		const addCode = (c) => {
			if (!c) return;
			if (this.isSupportedCode(c)) codes.push(c);
			else this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
		};
		if (isString(code) && (code.includes("-") || code.includes("_"))) {
			if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
			if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
			if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
		} else if (isString(code)) addCode(this.formatLanguageCode(code));
		fallbackCodes.forEach((fc) => {
			if (!codes.includes(fc)) addCode(this.formatLanguageCode(fc));
		});
		return codes;
	}
};
var suffixesOrder = {
	zero: 0,
	one: 1,
	two: 2,
	few: 3,
	many: 4,
	other: 5
};
var dummyRule = {
	select: (count) => count === 1 ? "one" : "other",
	resolvedOptions: () => ({ pluralCategories: ["one", "other"] })
};
var PluralResolver = class {
	constructor(languageUtils, options = {}) {
		this.languageUtils = languageUtils;
		this.options = options;
		this.logger = baseLogger.create("pluralResolver");
		this.pluralRulesCache = {};
	}
	clearCache() {
		this.pluralRulesCache = {};
	}
	getRule(code, options = {}) {
		const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
		const type = options.ordinal ? "ordinal" : "cardinal";
		const cacheKey = JSON.stringify({
			cleanedCode,
			type
		});
		if (cacheKey in this.pluralRulesCache) return this.pluralRulesCache[cacheKey];
		let rule;
		try {
			rule = new Intl.PluralRules(cleanedCode, { type });
		} catch (err) {
			if (typeof Intl === "undefined") {
				this.logger.error("No Intl support, please use an Intl polyfill!");
				return dummyRule;
			}
			if (!code.match(/-|_/)) return dummyRule;
			const lngPart = this.languageUtils.getLanguagePartFromCode(code);
			rule = this.getRule(lngPart, options);
		}
		this.pluralRulesCache[cacheKey] = rule;
		return rule;
	}
	needsPlural(code, options = {}) {
		let rule = this.getRule(code, options);
		if (!rule) rule = this.getRule("dev", options);
		return rule?.resolvedOptions().pluralCategories.length > 1;
	}
	getPluralFormsOfKey(code, key, options = {}) {
		return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
	}
	getSuffixes(code, options = {}) {
		let rule = this.getRule(code, options);
		if (!rule) rule = this.getRule("dev", options);
		if (!rule) return [];
		return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
	}
	getSuffix(code, count, options = {}) {
		const rule = this.getRule(code, options);
		if (rule) return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
		this.logger.warn(`no plural rule found for: ${code}`);
		return this.getSuffix("dev", count, options);
	}
};
var deepFindWithDefaults = (data, defaultData, key, keySeparator = ".", ignoreJSONStructure = true) => {
	let path = getPathWithDefaults(data, defaultData, key);
	if (!path && ignoreJSONStructure && isString(key)) {
		path = deepFind(data, key, keySeparator);
		if (path === void 0) path = deepFind(defaultData, key, keySeparator);
	}
	return path;
};
var regexSafe = (val) => val.replace(/\$/g, "$$$$");
var Interpolator = class {
	constructor(options = {}) {
		this.logger = baseLogger.create("interpolator");
		this.options = options;
		this.format = options?.interpolation?.format || ((value) => value);
		this.init(options);
	}
	init(options = {}) {
		if (!options.interpolation) options.interpolation = { escapeValue: true };
		const { escape: escape$1, escapeValue, useRawValueToEscape, prefix, prefixEscaped, suffix, suffixEscaped, formatSeparator, unescapeSuffix, unescapePrefix, nestingPrefix, nestingPrefixEscaped, nestingSuffix, nestingSuffixEscaped, nestingOptionsSeparator, maxReplaces, alwaysFormat } = options.interpolation;
		this.escape = escape$1 !== void 0 ? escape$1 : escape;
		this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
		this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
		this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
		this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
		this.formatSeparator = formatSeparator || ",";
		this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix ? regexEscape(unescapePrefix) : "-";
		this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix ? regexEscape(unescapeSuffix) : "";
		this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
		this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
		this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
		this.maxReplaces = maxReplaces || 1e3;
		this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
		this.resetRegExp();
	}
	reset() {
		if (this.options) this.init(this.options);
	}
	resetRegExp() {
		const getOrResetRegExp = (existingRegExp, pattern) => {
			if (existingRegExp?.source === pattern) {
				existingRegExp.lastIndex = 0;
				return existingRegExp;
			}
			return new RegExp(pattern, "g");
		};
		this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
		this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
		this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`);
	}
	interpolate(str, data, lng, options) {
		let match;
		let value;
		let replaces;
		const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
		const handleFormat = (key) => {
			if (!key.includes(this.formatSeparator)) {
				const path = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
				return this.alwaysFormat ? this.format(path, void 0, lng, {
					...options,
					...data,
					interpolationkey: key
				}) : path;
			}
			const p = key.split(this.formatSeparator);
			const k = p.shift().trim();
			const f = p.join(this.formatSeparator).trim();
			return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
				...options,
				...data,
				interpolationkey: k
			});
		};
		this.resetRegExp();
		if (!this.escapeValue && typeof str === "string" && /\$t\([^)]*\{[^}]*\{\{/.test(str)) this.logger.warn("nesting options string contains interpolated variables with escapeValue: false — if any of those values are attacker-controlled they can inject additional nesting options (e.g. redirect lng/ns). Sanitise untrusted input before passing it to t(), or keep escapeValue: true.");
		const missingInterpolationHandler = options?.missingInterpolationHandler || this.options.missingInterpolationHandler;
		const skipOnVariables = options?.interpolation?.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
		[{
			regex: this.regexpUnescape,
			safeValue: (val) => regexSafe(val)
		}, {
			regex: this.regexp,
			safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
		}].forEach((todo) => {
			replaces = 0;
			while (match = todo.regex.exec(str)) {
				const matchedVar = match[1].trim();
				value = handleFormat(matchedVar);
				if (value === void 0) if (typeof missingInterpolationHandler === "function") {
					const temp = missingInterpolationHandler(str, match, options);
					value = isString(temp) ? temp : "";
				} else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) value = "";
				else if (skipOnVariables) {
					value = match[0];
					continue;
				} else {
					this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
					value = "";
				}
				else if (!isString(value) && !this.useRawValueToEscape) value = makeString(value);
				const safeValue = todo.safeValue(value);
				str = str.replace(match[0], safeValue);
				if (skipOnVariables) {
					todo.regex.lastIndex += value.length;
					todo.regex.lastIndex -= match[0].length;
				} else todo.regex.lastIndex = 0;
				replaces++;
				if (replaces >= this.maxReplaces) break;
			}
		});
		return str;
	}
	nest(str, fc, options = {}) {
		let match;
		let value;
		let clonedOptions;
		const handleHasOptions = (key, inheritedOptions) => {
			const sep = this.nestingOptionsSeparator;
			if (!key.includes(sep)) return key;
			const c = key.split(new RegExp(`${regexEscape(sep)}[ ]*{`));
			let optionsString = `{${c[1]}`;
			key = c[0];
			optionsString = this.interpolate(optionsString, clonedOptions);
			const matchedSingleQuotes = optionsString.match(/'/g);
			const matchedDoubleQuotes = optionsString.match(/"/g);
			if ((matchedSingleQuotes?.length ?? 0) % 2 === 0 && !matchedDoubleQuotes || (matchedDoubleQuotes?.length ?? 0) % 2 !== 0) optionsString = optionsString.replace(/'/g, "\"");
			try {
				clonedOptions = JSON.parse(optionsString);
				if (inheritedOptions) clonedOptions = {
					...inheritedOptions,
					...clonedOptions
				};
			} catch (e) {
				this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
				return `${key}${sep}${optionsString}`;
			}
			if (clonedOptions.defaultValue && clonedOptions.defaultValue.includes(this.prefix)) delete clonedOptions.defaultValue;
			return key;
		};
		while (match = this.nestingRegexp.exec(str)) {
			let formatters = [];
			clonedOptions = { ...options };
			clonedOptions = clonedOptions.replace && !isString(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
			clonedOptions.applyPostProcessor = false;
			delete clonedOptions.defaultValue;
			const keyEndIndex = /{.*}/.test(match[1]) ? match[1].lastIndexOf("}") + 1 : match[1].indexOf(this.formatSeparator);
			if (keyEndIndex !== -1) {
				formatters = match[1].slice(keyEndIndex).split(this.formatSeparator).map((elem) => elem.trim()).filter(Boolean);
				match[1] = match[1].slice(0, keyEndIndex);
			}
			value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
			if (value && match[0] === str && !isString(value)) return value;
			if (!isString(value)) value = makeString(value);
			if (!value) {
				this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
				value = "";
			}
			if (formatters.length) value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
				...options,
				interpolationkey: match[1].trim()
			}), value.trim());
			str = str.replace(match[0], value);
			this.regexp.lastIndex = 0;
		}
		return str;
	}
};
var parseFormatStr = (formatStr) => {
	let formatName = formatStr.toLowerCase().trim();
	const formatOptions = {};
	if (formatStr.includes("(")) {
		const p = formatStr.split("(");
		formatName = p[0].toLowerCase().trim();
		const optStr = p[1].slice(0, -1);
		if (formatName === "currency" && !optStr.includes(":")) {
			if (!formatOptions.currency) formatOptions.currency = optStr.trim();
		} else if (formatName === "relativetime" && !optStr.includes(":")) {
			if (!formatOptions.range) formatOptions.range = optStr.trim();
		} else optStr.split(";").forEach((opt) => {
			if (opt) {
				const [key, ...rest] = opt.split(":");
				const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
				const trimmedKey = key.trim();
				if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
				if (val === "false") formatOptions[trimmedKey] = false;
				if (val === "true") formatOptions[trimmedKey] = true;
				if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
			}
		});
	}
	return {
		formatName,
		formatOptions
	};
};
var createCachedFormatter = (fn) => {
	const cache = {};
	return (v, l, o) => {
		let optForCache = o;
		if (o && o.interpolationkey && o.formatParams && o.formatParams[o.interpolationkey] && o[o.interpolationkey]) optForCache = {
			...optForCache,
			[o.interpolationkey]: void 0
		};
		const key = l + JSON.stringify(optForCache);
		let frm = cache[key];
		if (!frm) {
			frm = fn(getCleanedCode(l), o);
			cache[key] = frm;
		}
		return frm(v);
	};
};
var createNonCachedFormatter = (fn) => (v, l, o) => fn(getCleanedCode(l), o)(v);
var Formatter = class {
	constructor(options = {}) {
		this.logger = baseLogger.create("formatter");
		this.options = options;
		this.init(options);
	}
	init(services, options = { interpolation: {} }) {
		this.formatSeparator = options.interpolation.formatSeparator || ",";
		const cf = options.cacheInBuiltFormats ? createCachedFormatter : createNonCachedFormatter;
		this.formats = {
			number: cf((lng, opt) => {
				const formatter = new Intl.NumberFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			}),
			currency: cf((lng, opt) => {
				const formatter = new Intl.NumberFormat(lng, {
					...opt,
					style: "currency"
				});
				return (val) => formatter.format(val);
			}),
			datetime: cf((lng, opt) => {
				const formatter = new Intl.DateTimeFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			}),
			relativetime: cf((lng, opt) => {
				const formatter = new Intl.RelativeTimeFormat(lng, { ...opt });
				return (val) => formatter.format(val, opt.range || "day");
			}),
			list: cf((lng, opt) => {
				const formatter = new Intl.ListFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			})
		};
	}
	add(name, fc) {
		this.formats[name.toLowerCase().trim()] = fc;
	}
	addCached(name, fc) {
		this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
	}
	format(value, format, lng, options = {}) {
		if (!format) return value;
		if (value == null) return value;
		const formats = format.split(this.formatSeparator);
		if (formats.length > 1 && formats[0].indexOf("(") > 1 && !formats[0].includes(")") && formats.find((f) => f.includes(")"))) {
			const lastIndex = formats.findIndex((f) => f.includes(")"));
			formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
		}
		return formats.reduce((mem, f) => {
			const { formatName, formatOptions } = parseFormatStr(f);
			if (this.formats[formatName]) {
				let formatted = mem;
				try {
					const valOptions = options?.formatParams?.[options.interpolationkey] || {};
					const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
					formatted = this.formats[formatName](mem, l, {
						...formatOptions,
						...options,
						...valOptions
					});
				} catch (error) {
					this.logger.warn(error);
				}
				return formatted;
			} else this.logger.warn(`there was no format function for ${formatName}`);
			return mem;
		}, value);
	}
};
var removePending = (q, name) => {
	if (q.pending[name] !== void 0) {
		delete q.pending[name];
		q.pendingCount--;
	}
};
var Connector = class extends EventEmitter {
	constructor(backend, store, services, options = {}) {
		super();
		this.backend = backend;
		this.store = store;
		this.services = services;
		this.languageUtils = services.languageUtils;
		this.options = options;
		this.logger = baseLogger.create("backendConnector");
		this.waitingReads = [];
		this.maxParallelReads = options.maxParallelReads || 10;
		this.readingCalls = 0;
		this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
		this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
		this.state = {};
		this.queue = [];
		this.backend?.init?.(services, options.backend, options);
	}
	queueLoad(languages, namespaces, options, callback) {
		const toLoad = {};
		const pending = {};
		const toLoadLanguages = {};
		const toLoadNamespaces = {};
		languages.forEach((lng) => {
			let hasAllNamespaces = true;
			namespaces.forEach((ns) => {
				const name = `${lng}|${ns}`;
				if (!options.reload && this.store.hasResourceBundle(lng, ns)) this.state[name] = 2;
				else if (this.state[name] < 0);
				else if (this.state[name] === 1) {
					if (pending[name] === void 0) pending[name] = true;
				} else {
					this.state[name] = 1;
					hasAllNamespaces = false;
					if (pending[name] === void 0) pending[name] = true;
					if (toLoad[name] === void 0) toLoad[name] = true;
					if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
				}
			});
			if (!hasAllNamespaces) toLoadLanguages[lng] = true;
		});
		if (Object.keys(toLoad).length || Object.keys(pending).length) this.queue.push({
			pending,
			pendingCount: Object.keys(pending).length,
			loaded: {},
			errors: [],
			callback
		});
		return {
			toLoad: Object.keys(toLoad),
			pending: Object.keys(pending),
			toLoadLanguages: Object.keys(toLoadLanguages),
			toLoadNamespaces: Object.keys(toLoadNamespaces)
		};
	}
	loaded(name, err, data) {
		const s = name.split("|");
		const lng = s[0];
		const ns = s[1];
		if (err) this.emit("failedLoading", lng, ns, err);
		if (!err && data) this.store.addResourceBundle(lng, ns, data, void 0, void 0, { skipCopy: true });
		this.state[name] = err ? -1 : 2;
		if (err && data) this.state[name] = 0;
		const loaded = {};
		this.queue.forEach((q) => {
			pushPath(q.loaded, [lng], ns);
			removePending(q, name);
			if (err) q.errors.push(err);
			if (q.pendingCount === 0 && !q.done) {
				Object.keys(q.loaded).forEach((l) => {
					if (!loaded[l]) loaded[l] = {};
					const loadedKeys = q.loaded[l];
					if (loadedKeys.length) loadedKeys.forEach((n) => {
						if (loaded[l][n] === void 0) loaded[l][n] = true;
					});
				});
				q.done = true;
				if (q.errors.length) q.callback(q.errors);
				else q.callback();
			}
		});
		this.emit("loaded", loaded);
		this.queue = this.queue.filter((q) => !q.done);
	}
	read(lng, ns, fcName, tried = 0, wait = this.retryTimeout, callback) {
		if (!lng.length) return callback(null, {});
		if (this.readingCalls >= this.maxParallelReads) {
			this.waitingReads.push({
				lng,
				ns,
				fcName,
				tried,
				wait,
				callback
			});
			return;
		}
		this.readingCalls++;
		const resolver = (err, data) => {
			this.readingCalls--;
			if (this.waitingReads.length > 0) {
				const next = this.waitingReads.shift();
				this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
			}
			if (err && data && tried < this.maxRetries) {
				setTimeout(() => {
					this.read(lng, ns, fcName, tried + 1, wait * 2, callback);
				}, wait);
				return;
			}
			callback(err, data);
		};
		const fc = this.backend[fcName].bind(this.backend);
		if (fc.length === 2) {
			try {
				const r = fc(lng, ns);
				if (r && typeof r.then === "function") r.then((data) => resolver(null, data)).catch(resolver);
				else resolver(null, r);
			} catch (err) {
				resolver(err);
			}
			return;
		}
		return fc(lng, ns, resolver);
	}
	prepareLoading(languages, namespaces, options = {}, callback) {
		if (!this.backend) {
			this.logger.warn("No backend was added via i18next.use. Will not load resources.");
			return callback && callback();
		}
		if (isString(languages)) languages = this.languageUtils.toResolveHierarchy(languages);
		if (isString(namespaces)) namespaces = [namespaces];
		const toLoad = this.queueLoad(languages, namespaces, options, callback);
		if (!toLoad.toLoad.length) {
			if (!toLoad.pending.length) callback();
			return null;
		}
		toLoad.toLoad.forEach((name) => {
			this.loadOne(name);
		});
	}
	load(languages, namespaces, callback) {
		this.prepareLoading(languages, namespaces, {}, callback);
	}
	reload(languages, namespaces, callback) {
		this.prepareLoading(languages, namespaces, { reload: true }, callback);
	}
	loadOne(name, prefix = "") {
		const s = name.split("|");
		const lng = s[0];
		const ns = s[1];
		this.read(lng, ns, "read", void 0, void 0, (err, data) => {
			if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
			if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
			this.loaded(name, err, data);
		});
	}
	saveMissing(languages, namespace, key, fallbackValue, isUpdate, options = {}, clb = () => {}) {
		if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(namespace)) {
			this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
			return;
		}
		if (key === void 0 || key === null || key === "") return;
		if (this.backend?.create) {
			const opts = {
				...options,
				isUpdate
			};
			const fc = this.backend.create.bind(this.backend);
			if (fc.length < 6) try {
				let r;
				if (fc.length === 5) r = fc(languages, namespace, key, fallbackValue, opts);
				else r = fc(languages, namespace, key, fallbackValue);
				if (r && typeof r.then === "function") r.then((data) => clb(null, data)).catch(clb);
				else clb(null, r);
			} catch (err) {
				clb(err);
			}
			else fc(languages, namespace, key, fallbackValue, clb, opts);
		}
		if (!languages || !languages[0]) return;
		this.store.addResource(languages[0], namespace, key, fallbackValue);
	}
};
var get = () => ({
	debug: false,
	initAsync: true,
	ns: ["translation"],
	defaultNS: ["translation"],
	fallbackLng: ["dev"],
	fallbackNS: false,
	supportedLngs: false,
	nonExplicitSupportedLngs: false,
	load: "all",
	preload: false,
	keySeparator: ".",
	nsSeparator: ":",
	pluralSeparator: "_",
	contextSeparator: "_",
	enableSelector: false,
	partialBundledLanguages: false,
	saveMissing: false,
	updateMissing: false,
	saveMissingTo: "fallback",
	saveMissingPlurals: true,
	missingKeyHandler: false,
	missingInterpolationHandler: false,
	postProcess: false,
	postProcessPassResolved: false,
	returnNull: false,
	returnEmptyString: true,
	returnObjects: false,
	joinArrays: false,
	returnedObjectHandler: false,
	parseMissingKeyHandler: false,
	appendNamespaceToMissingKey: false,
	appendNamespaceToCIMode: false,
	overloadTranslationOptionHandler: (args) => {
		let ret = {};
		if (typeof args[1] === "object") ret = args[1];
		if (isString(args[1])) ret.defaultValue = args[1];
		if (isString(args[2])) ret.tDescription = args[2];
		if (typeof args[2] === "object" || typeof args[3] === "object") {
			const options = args[3] || args[2];
			Object.keys(options).forEach((key) => {
				ret[key] = options[key];
			});
		}
		return ret;
	},
	interpolation: {
		escapeValue: true,
		prefix: "{{",
		suffix: "}}",
		formatSeparator: ",",
		unescapePrefix: "-",
		nestingPrefix: "$t(",
		nestingSuffix: ")",
		nestingOptionsSeparator: ",",
		maxReplaces: 1e3,
		skipOnVariables: true
	},
	cacheInBuiltFormats: true
});
var transformOptions = (options) => {
	if (isString(options.ns)) options.ns = [options.ns];
	if (isString(options.fallbackLng)) options.fallbackLng = [options.fallbackLng];
	if (isString(options.fallbackNS)) options.fallbackNS = [options.fallbackNS];
	if (options.supportedLngs && !options.supportedLngs.includes("cimode")) options.supportedLngs = options.supportedLngs.concat(["cimode"]);
	return options;
};
var noop = () => {};
var bindMemberFunctions = (inst) => {
	Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).forEach((mem) => {
		if (typeof inst[mem] === "function") inst[mem] = inst[mem].bind(inst);
	});
};
var instance = class I18n extends EventEmitter {
	constructor(options = {}, callback) {
		super();
		this.options = transformOptions(options);
		this.services = {};
		this.logger = baseLogger;
		this.modules = { external: [] };
		bindMemberFunctions(this);
		if (callback && !this.isInitialized && !options.isClone) {
			if (!this.options.initAsync) {
				this.init(options, callback);
				return this;
			}
			setTimeout(() => {
				this.init(options, callback);
			}, 0);
		}
	}
	init(options = {}, callback) {
		this.isInitializing = true;
		if (typeof options === "function") {
			callback = options;
			options = {};
		}
		if (options.defaultNS == null && options.ns) {
			if (isString(options.ns)) options.defaultNS = options.ns;
			else if (!options.ns.includes("translation")) options.defaultNS = options.ns[0];
		}
		const defOpts = get();
		this.options = {
			...defOpts,
			...this.options,
			...transformOptions(options)
		};
		this.options.interpolation = {
			...defOpts.interpolation,
			...this.options.interpolation
		};
		if (options.keySeparator !== void 0) this.options.userDefinedKeySeparator = options.keySeparator;
		if (options.nsSeparator !== void 0) this.options.userDefinedNsSeparator = options.nsSeparator;
		if (typeof this.options.overloadTranslationOptionHandler !== "function") this.options.overloadTranslationOptionHandler = defOpts.overloadTranslationOptionHandler;
		const createClassOnDemand = (ClassOrObject) => {
			if (!ClassOrObject) return null;
			if (typeof ClassOrObject === "function") return new ClassOrObject();
			return ClassOrObject;
		};
		if (!this.options.isClone) {
			if (this.modules.logger) baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
			else baseLogger.init(null, this.options);
			let formatter;
			if (this.modules.formatter) formatter = this.modules.formatter;
			else formatter = Formatter;
			const lu = new LanguageUtil(this.options);
			this.store = new ResourceStore(this.options.resources, this.options);
			const s = this.services;
			s.logger = baseLogger;
			s.resourceStore = this.store;
			s.languageUtils = lu;
			s.pluralResolver = new PluralResolver(lu, { prepend: this.options.pluralSeparator });
			if (formatter) {
				s.formatter = createClassOnDemand(formatter);
				if (s.formatter.init) s.formatter.init(s, this.options);
				this.options.interpolation.format = s.formatter.format.bind(s.formatter);
			}
			s.interpolator = new Interpolator(this.options);
			s.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) };
			s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
			s.backendConnector.on("*", (event, ...args) => {
				this.emit(event, ...args);
			});
			if (this.modules.languageDetector) {
				s.languageDetector = createClassOnDemand(this.modules.languageDetector);
				if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
			}
			if (this.modules.i18nFormat) {
				s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
				if (s.i18nFormat.init) s.i18nFormat.init(this);
			}
			this.translator = new Translator(this.services, this.options);
			this.translator.on("*", (event, ...args) => {
				this.emit(event, ...args);
			});
			this.modules.external.forEach((m) => {
				if (m.init) m.init(this);
			});
		}
		this.format = this.options.interpolation.format;
		if (!callback) callback = noop;
		if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
			const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
			if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
		}
		if (!this.services.languageDetector && !this.options.lng) this.logger.warn("init: no languageDetector is used and no lng is defined");
		[
			"getResource",
			"hasResourceBundle",
			"getResourceBundle",
			"getDataByLanguage"
		].forEach((fcName) => {
			this[fcName] = (...args) => this.store[fcName](...args);
		});
		[
			"addResource",
			"addResources",
			"addResourceBundle",
			"removeResourceBundle"
		].forEach((fcName) => {
			this[fcName] = (...args) => {
				this.store[fcName](...args);
				return this;
			};
		});
		const deferred = defer();
		const load = () => {
			const finish = (err, t) => {
				this.isInitializing = false;
				if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
				this.isInitialized = true;
				if (!this.options.isClone) this.logger.log("initialized", this.options);
				this.emit("initialized", this.options);
				deferred.resolve(t);
				callback(err, t);
			};
			if ((this.languages || this.isLanguageChangingTo) && !this.isInitialized) return finish(null, this.t.bind(this));
			this.changeLanguage(this.options.lng, finish);
		};
		if (this.options.resources || !this.options.initAsync) load();
		else setTimeout(load, 0);
		return deferred;
	}
	loadResources(language, callback = noop) {
		let usedCallback = callback;
		const usedLng = isString(language) ? language : this.language;
		if (typeof language === "function") usedCallback = language;
		if (!this.options.resources || this.options.partialBundledLanguages) {
			if (usedLng?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
			const toLoad = [];
			const append = (lng) => {
				if (!lng) return;
				if (lng === "cimode") return;
				this.services.languageUtils.toResolveHierarchy(lng).forEach((l) => {
					if (l === "cimode") return;
					if (!toLoad.includes(l)) toLoad.push(l);
				});
			};
			if (!usedLng) this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach((l) => append(l));
			else append(usedLng);
			this.options.preload?.forEach?.((l) => append(l));
			this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
				if (!e && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
				usedCallback(e);
			});
		} else usedCallback(null);
	}
	reloadResources(lngs, ns, callback) {
		const deferred = defer();
		if (typeof lngs === "function") {
			callback = lngs;
			lngs = void 0;
		}
		if (typeof ns === "function") {
			callback = ns;
			ns = void 0;
		}
		if (!lngs) lngs = this.languages;
		if (!ns) ns = this.options.ns;
		if (!callback) callback = noop;
		this.services.backendConnector.reload(lngs, ns, (err) => {
			deferred.resolve();
			callback(err);
		});
		return deferred;
	}
	use(module) {
		if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
		if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
		if (module.type === "backend") this.modules.backend = module;
		if (module.type === "logger" || module.log && module.warn && module.error) this.modules.logger = module;
		if (module.type === "languageDetector") this.modules.languageDetector = module;
		if (module.type === "i18nFormat") this.modules.i18nFormat = module;
		if (module.type === "postProcessor") postProcessor.addPostProcessor(module);
		if (module.type === "formatter") this.modules.formatter = module;
		if (module.type === "3rdParty") this.modules.external.push(module);
		return this;
	}
	setResolvedLanguage(l) {
		if (!l || !this.languages) return;
		if (["cimode", "dev"].includes(l)) return;
		for (let li = 0; li < this.languages.length; li++) {
			const lngInLngs = this.languages[li];
			if (["cimode", "dev"].includes(lngInLngs)) continue;
			if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
				this.resolvedLanguage = lngInLngs;
				break;
			}
		}
		if (!this.resolvedLanguage && !this.languages.includes(l) && this.store.hasLanguageSomeTranslations(l)) {
			this.resolvedLanguage = l;
			this.languages.unshift(l);
		}
	}
	changeLanguage(lng, callback) {
		this.isLanguageChangingTo = lng;
		const deferred = defer();
		this.emit("languageChanging", lng);
		const setLngProps = (l) => {
			this.language = l;
			this.languages = this.services.languageUtils.toResolveHierarchy(l);
			this.resolvedLanguage = void 0;
			this.setResolvedLanguage(l);
		};
		const done = (err, l) => {
			if (l) {
				if (this.isLanguageChangingTo === lng) {
					setLngProps(l);
					this.translator.changeLanguage(l);
					this.isLanguageChangingTo = void 0;
					this.emit("languageChanged", l);
					this.logger.log("languageChanged", l);
				}
			} else this.isLanguageChangingTo = void 0;
			deferred.resolve((...args) => this.t(...args));
			if (callback) callback(err, (...args) => this.t(...args));
		};
		const setLng = (lngs) => {
			if (!lng && !lngs && this.services.languageDetector) lngs = [];
			const fl = isString(lngs) ? lngs : lngs && lngs[0];
			const l = this.store.hasLanguageSomeTranslations(fl) ? fl : this.services.languageUtils.getBestMatchFromCodes(isString(lngs) ? [lngs] : lngs);
			if (l) {
				if (!this.language) setLngProps(l);
				if (!this.translator.language) this.translator.changeLanguage(l);
				this.services.languageDetector?.cacheUserLanguage?.(l);
			}
			this.loadResources(l, (err) => {
				done(err, l);
			});
		};
		if (!lng && this.services.languageDetector && !this.services.languageDetector.async) setLng(this.services.languageDetector.detect());
		else if (!lng && this.services.languageDetector && this.services.languageDetector.async) if (this.services.languageDetector.detect.length === 0) this.services.languageDetector.detect().then(setLng);
		else this.services.languageDetector.detect(setLng);
		else setLng(lng);
		return deferred;
	}
	getFixedT(lng, ns, keyPrefix, fixedOpts) {
		const scopeNs = fixedOpts?.scopeNs;
		const fixedT = (key, opts, ...rest) => {
			let o;
			if (typeof opts !== "object") o = this.options.overloadTranslationOptionHandler([key, opts].concat(rest));
			else o = { ...opts };
			o.lng = o.lng || fixedT.lng;
			o.lngs = o.lngs || fixedT.lngs;
			const explicitCallNs = o.ns !== void 0 && o.ns !== null;
			o.ns = o.ns || fixedT.ns;
			if (o.keyPrefix !== "") o.keyPrefix = o.keyPrefix || keyPrefix || fixedT.keyPrefix;
			const selectorOpts = {
				...this.options,
				...o
			};
			if (Array.isArray(scopeNs) && !explicitCallNs) selectorOpts.ns = scopeNs;
			if (typeof o.keyPrefix === "function") o.keyPrefix = keysFromSelector(o.keyPrefix, selectorOpts);
			const keySeparator = this.options.keySeparator || ".";
			let resultKey;
			if (o.keyPrefix && Array.isArray(key)) resultKey = key.map((k) => {
				if (typeof k === "function") k = keysFromSelector(k, selectorOpts);
				return `${o.keyPrefix}${keySeparator}${k}`;
			});
			else {
				if (typeof key === "function") key = keysFromSelector(key, selectorOpts);
				resultKey = o.keyPrefix ? `${o.keyPrefix}${keySeparator}${key}` : key;
			}
			return this.t(resultKey, o);
		};
		if (isString(lng)) fixedT.lng = lng;
		else fixedT.lngs = lng;
		fixedT.ns = ns;
		fixedT.keyPrefix = keyPrefix;
		return fixedT;
	}
	t(...args) {
		return this.translator?.translate(...args);
	}
	exists(...args) {
		return this.translator?.exists(...args);
	}
	setDefaultNamespace(ns) {
		this.options.defaultNS = ns;
	}
	hasLoadedNamespace(ns, options = {}) {
		if (!this.isInitialized) {
			this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
			return false;
		}
		if (!this.languages || !this.languages.length) {
			this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
			return false;
		}
		const lng = options.lng || this.resolvedLanguage || this.languages[0];
		const fallbackLng = this.options ? this.options.fallbackLng : false;
		const lastLng = this.languages[this.languages.length - 1];
		if (lng.toLowerCase() === "cimode") return true;
		const loadNotPending = (l, n) => {
			const loadState = this.services.backendConnector.state[`${l}|${n}`];
			return loadState === -1 || loadState === 0 || loadState === 2;
		};
		if (options.precheck) {
			const preResult = options.precheck(this, loadNotPending);
			if (preResult !== void 0) return preResult;
		}
		if (this.hasResourceBundle(lng, ns)) return true;
		if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
		if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
		return false;
	}
	loadNamespaces(ns, callback) {
		const deferred = defer();
		if (!this.options.ns) {
			if (callback) callback();
			return Promise.resolve();
		}
		if (isString(ns)) ns = [ns];
		ns.forEach((n) => {
			if (!this.options.ns.includes(n)) this.options.ns.push(n);
		});
		this.loadResources((err) => {
			deferred.resolve();
			if (callback) callback(err);
		});
		return deferred;
	}
	loadLanguages(lngs, callback) {
		const deferred = defer();
		if (isString(lngs)) lngs = [lngs];
		const preloaded = this.options.preload || [];
		const newLngs = lngs.filter((lng) => !preloaded.includes(lng) && this.services.languageUtils.isSupportedCode(lng));
		if (!newLngs.length) {
			if (callback) callback();
			return Promise.resolve();
		}
		this.options.preload = preloaded.concat(newLngs);
		this.loadResources((err) => {
			deferred.resolve();
			if (callback) callback(err);
		});
		return deferred;
	}
	dir(lng) {
		if (!lng) lng = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language);
		if (!lng) return "rtl";
		try {
			const l = new Intl.Locale(lng);
			if (l && l.getTextInfo) {
				const ti = l.getTextInfo();
				if (ti && ti.direction) return ti.direction;
			}
		} catch (e) {}
		const rtlLngs = [
			"ar",
			"shu",
			"sqr",
			"ssh",
			"xaa",
			"yhd",
			"yud",
			"aao",
			"abh",
			"abv",
			"acm",
			"acq",
			"acw",
			"acx",
			"acy",
			"adf",
			"ads",
			"aeb",
			"aec",
			"afb",
			"ajp",
			"apc",
			"apd",
			"arb",
			"arq",
			"ars",
			"ary",
			"arz",
			"auz",
			"avl",
			"ayh",
			"ayl",
			"ayn",
			"ayp",
			"bbz",
			"pga",
			"he",
			"iw",
			"ps",
			"pbt",
			"pbu",
			"pst",
			"prp",
			"prd",
			"ug",
			"ur",
			"ydd",
			"yds",
			"yih",
			"ji",
			"yi",
			"hbo",
			"men",
			"xmn",
			"fa",
			"jpr",
			"peo",
			"pes",
			"prs",
			"dv",
			"sam",
			"ckb"
		];
		const languageUtils = this.services?.languageUtils || new LanguageUtil(get());
		if (lng.toLowerCase().indexOf("-latn") > 1) return "ltr";
		return rtlLngs.includes(languageUtils.getLanguagePartFromCode(lng)) || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
	}
	static createInstance(options = {}, callback) {
		const instance = new I18n(options, callback);
		instance.createInstance = I18n.createInstance;
		return instance;
	}
	cloneInstance(options = {}, callback = noop) {
		const forkResourceStore = options.forkResourceStore;
		if (forkResourceStore) delete options.forkResourceStore;
		const mergedOptions = {
			...this.options,
			...options,
			isClone: true
		};
		const clone = new I18n(mergedOptions);
		if (options.debug !== void 0 || options.prefix !== void 0) clone.logger = clone.logger.clone(options);
		[
			"store",
			"services",
			"language"
		].forEach((m) => {
			clone[m] = this[m];
		});
		clone.services = { ...this.services };
		clone.services.utils = { hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone) };
		if (forkResourceStore) {
			clone.store = new ResourceStore(Object.keys(this.store.data).reduce((prev, l) => {
				prev[l] = { ...this.store.data[l] };
				prev[l] = Object.keys(prev[l]).reduce((acc, n) => {
					acc[n] = { ...prev[l][n] };
					return acc;
				}, prev[l]);
				return prev;
			}, {}), mergedOptions);
			clone.services.resourceStore = clone.store;
		}
		if (options.interpolation) {
			const mergedInterpolation = {
				...get().interpolation,
				...this.options.interpolation,
				...options.interpolation
			};
			const mergedForInterpolator = {
				...mergedOptions,
				interpolation: mergedInterpolation
			};
			clone.services.interpolator = new Interpolator(mergedForInterpolator);
		}
		clone.translator = new Translator(clone.services, mergedOptions);
		clone.translator.on("*", (event, ...args) => {
			clone.emit(event, ...args);
		});
		clone.init(mergedOptions, callback);
		clone.translator.options = mergedOptions;
		clone.translator.backendConnector.services.utils = { hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone) };
		return clone;
	}
	toJSON() {
		return {
			options: this.options,
			store: this.store,
			language: this.language,
			languages: this.languages,
			resolvedLanguage: this.resolvedLanguage
		};
	}
}.createInstance();
var createInstance = instance.createInstance;
var dir = instance.dir;
var init = instance.init;
var loadResources = instance.loadResources;
var reloadResources = instance.reloadResources;
var use = instance.use;
var changeLanguage = instance.changeLanguage;
var getFixedT = instance.getFixedT;
var t = instance.t;
var exists = instance.exists;
var setDefaultNamespace = instance.setDefaultNamespace;
var hasLoadedNamespace = instance.hasLoadedNamespace;
var loadNamespaces = instance.loadNamespaces;
var loadLanguages = instance.loadLanguages;
//#endregion
export { changeLanguage, createInstance, instance as default, dir, exists, getFixedT, hasLoadedNamespace, init, keysFromSelector as keyFromSelector, loadLanguages, loadNamespaces, loadResources, reloadResources, setDefaultNamespace, t, use };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bmV4dC5qcyIsIm5hbWVzIjpbXSwic291cmNlcyI6WyIuLi8uLi9pMThuZXh0L2Rpc3QvZXNtL2kxOG5leHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaXNTdHJpbmcgPSBvYmogPT4gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZyc7XG5jb25zdCBkZWZlciA9ICgpID0+IHtcbiAgbGV0IHJlcztcbiAgbGV0IHJlajtcbiAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICByZXMgPSByZXNvbHZlO1xuICAgIHJlaiA9IHJlamVjdDtcbiAgfSk7XG4gIHByb21pc2UucmVzb2x2ZSA9IHJlcztcbiAgcHJvbWlzZS5yZWplY3QgPSByZWo7XG4gIHJldHVybiBwcm9taXNlO1xufTtcbmNvbnN0IG1ha2VTdHJpbmcgPSBvYmplY3QgPT4ge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuIFN0cmluZyhvYmplY3QpO1xufTtcbmNvbnN0IGNvcHkgPSAoYSwgcywgdCkgPT4ge1xuICBhLmZvckVhY2gobSA9PiB7XG4gICAgaWYgKHNbbV0pIHRbbV0gPSBzW21dO1xuICB9KTtcbn07XG5jb25zdCBsYXN0T2ZQYXRoU2VwYXJhdG9yUmVnRXhwID0gLyMjIy9nO1xuY29uc3QgY2xlYW5LZXkgPSBrZXkgPT4ga2V5ICYmIGtleS5pbmNsdWRlcygnIyMjJykgPyBrZXkucmVwbGFjZShsYXN0T2ZQYXRoU2VwYXJhdG9yUmVnRXhwLCAnLicpIDoga2V5O1xuY29uc3QgY2FuTm90VHJhdmVyc2VEZWVwZXIgPSBvYmplY3QgPT4gIW9iamVjdCB8fCBpc1N0cmluZyhvYmplY3QpO1xuY29uc3QgZ2V0TGFzdE9mUGF0aCA9IChvYmplY3QsIHBhdGgsIEVtcHR5KSA9PiB7XG4gIGNvbnN0IHN0YWNrID0gIWlzU3RyaW5nKHBhdGgpID8gcGF0aCA6IHBhdGguc3BsaXQoJy4nKTtcbiAgbGV0IHN0YWNrSW5kZXggPSAwO1xuICB3aGlsZSAoc3RhY2tJbmRleCA8IHN0YWNrLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAoY2FuTm90VHJhdmVyc2VEZWVwZXIob2JqZWN0KSkgcmV0dXJuIHt9O1xuICAgIGNvbnN0IGtleSA9IGNsZWFuS2V5KHN0YWNrW3N0YWNrSW5kZXhdKTtcbiAgICBpZiAoIW9iamVjdFtrZXldICYmIEVtcHR5KSBvYmplY3Rba2V5XSA9IG5ldyBFbXB0eSgpO1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICBvYmplY3QgPSBvYmplY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0ID0ge307XG4gICAgfVxuICAgICsrc3RhY2tJbmRleDtcbiAgfVxuICBpZiAoY2FuTm90VHJhdmVyc2VEZWVwZXIob2JqZWN0KSkgcmV0dXJuIHt9O1xuICByZXR1cm4ge1xuICAgIG9iajogb2JqZWN0LFxuICAgIGs6IGNsZWFuS2V5KHN0YWNrW3N0YWNrSW5kZXhdKVxuICB9O1xufTtcbmNvbnN0IHNldFBhdGggPSAob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSkgPT4ge1xuICBjb25zdCB7XG4gICAgb2JqLFxuICAgIGtcbiAgfSA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwYXRoLCBPYmplY3QpO1xuICBpZiAob2JqICE9PSB1bmRlZmluZWQgfHwgcGF0aC5sZW5ndGggPT09IDEpIHtcbiAgICBvYmpba10gPSBuZXdWYWx1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGUgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gIGxldCBwID0gcGF0aC5zbGljZSgwLCBwYXRoLmxlbmd0aCAtIDEpO1xuICBsZXQgbGFzdCA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwLCBPYmplY3QpO1xuICB3aGlsZSAobGFzdC5vYmogPT09IHVuZGVmaW5lZCAmJiBwLmxlbmd0aCkge1xuICAgIGUgPSBgJHtwW3AubGVuZ3RoIC0gMV19LiR7ZX1gO1xuICAgIHAgPSBwLnNsaWNlKDAsIHAubGVuZ3RoIC0gMSk7XG4gICAgbGFzdCA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwLCBPYmplY3QpO1xuICAgIGlmIChsYXN0Py5vYmogJiYgdHlwZW9mIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgbGFzdC5vYmogPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG4gIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdID0gbmV3VmFsdWU7XG59O1xuY29uc3QgcHVzaFBhdGggPSAob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSwgY29uY2F0KSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIG9ialtrXSA9IG9ialtrXSB8fCBbXTtcbiAgb2JqW2tdLnB1c2gobmV3VmFsdWUpO1xufTtcbmNvbnN0IGdldFBhdGggPSAob2JqZWN0LCBwYXRoKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgpO1xuICBpZiAoIW9iaikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIG9ialtrXTtcbn07XG5jb25zdCBnZXRQYXRoV2l0aERlZmF1bHRzID0gKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpID0+IHtcbiAgY29uc3QgdmFsdWUgPSBnZXRQYXRoKGRhdGEsIGtleSk7XG4gIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHJldHVybiBnZXRQYXRoKGRlZmF1bHREYXRhLCBrZXkpO1xufTtcbmNvbnN0IGRlZXBFeHRlbmQgPSAodGFyZ2V0LCBzb3VyY2UsIG92ZXJ3cml0ZSkgPT4ge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gc291cmNlKSB7XG4gICAgaWYgKHByb3AgIT09ICdfX3Byb3RvX18nICYmIHByb3AgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0W3Byb3BdKSB8fCB0YXJnZXRbcHJvcF0gaW5zdGFuY2VvZiBTdHJpbmcgfHwgaXNTdHJpbmcoc291cmNlW3Byb3BdKSB8fCBzb3VyY2VbcHJvcF0gaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICBpZiAob3ZlcndyaXRlKSB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVlcEV4dGVuZCh0YXJnZXRbcHJvcF0sIHNvdXJjZVtwcm9wXSwgb3ZlcndyaXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcbmNvbnN0IHJlZ2V4RXNjYXBlID0gc3RyID0+IHN0ci5yZXBsYWNlKC9bXFwtXFxbXFxdXFwvXFx7XFx9XFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcXlxcJFxcfF0vZywgJ1xcXFwkJicpO1xuY29uc3QgX2VudGl0eU1hcCA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7JyxcbiAgJy8nOiAnJiN4MkY7J1xufTtcbmNvbnN0IGVzY2FwZSA9IGRhdGEgPT4ge1xuICBpZiAoaXNTdHJpbmcoZGF0YSkpIHtcbiAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBzID0+IF9lbnRpdHlNYXBbc10pO1xuICB9XG4gIHJldHVybiBkYXRhO1xufTtcbmNsYXNzIFJlZ0V4cENhY2hlIHtcbiAgY29uc3RydWN0b3IoY2FwYWNpdHkpIHtcbiAgICB0aGlzLmNhcGFjaXR5ID0gY2FwYWNpdHk7XG4gICAgdGhpcy5yZWdFeHBNYXAgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5yZWdFeHBRdWV1ZSA9IFtdO1xuICB9XG4gIGdldFJlZ0V4cChwYXR0ZXJuKSB7XG4gICAgY29uc3QgcmVnRXhwRnJvbUNhY2hlID0gdGhpcy5yZWdFeHBNYXAuZ2V0KHBhdHRlcm4pO1xuICAgIGlmIChyZWdFeHBGcm9tQ2FjaGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHJlZ0V4cEZyb21DYWNoZTtcbiAgICB9XG4gICAgY29uc3QgcmVnRXhwTmV3ID0gbmV3IFJlZ0V4cChwYXR0ZXJuKTtcbiAgICBpZiAodGhpcy5yZWdFeHBRdWV1ZS5sZW5ndGggPT09IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgIHRoaXMucmVnRXhwTWFwLmRlbGV0ZSh0aGlzLnJlZ0V4cFF1ZXVlLnNoaWZ0KCkpO1xuICAgIH1cbiAgICB0aGlzLnJlZ0V4cE1hcC5zZXQocGF0dGVybiwgcmVnRXhwTmV3KTtcbiAgICB0aGlzLnJlZ0V4cFF1ZXVlLnB1c2gocGF0dGVybik7XG4gICAgcmV0dXJuIHJlZ0V4cE5ldztcbiAgfVxufVxuY29uc3QgY2hhcnMgPSBbJyAnLCAnLCcsICc/JywgJyEnLCAnOyddO1xuY29uc3QgbG9va3NMaWtlT2JqZWN0UGF0aFJlZ0V4cENhY2hlID0gbmV3IFJlZ0V4cENhY2hlKDIwKTtcbmNvbnN0IGxvb2tzTGlrZU9iamVjdFBhdGggPSAoa2V5LCBuc1NlcGFyYXRvciwga2V5U2VwYXJhdG9yKSA9PiB7XG4gIG5zU2VwYXJhdG9yID0gbnNTZXBhcmF0b3IgfHwgJyc7XG4gIGtleVNlcGFyYXRvciA9IGtleVNlcGFyYXRvciB8fCAnJztcbiAgY29uc3QgcG9zc2libGVDaGFycyA9IGNoYXJzLmZpbHRlcihjID0+ICFuc1NlcGFyYXRvci5pbmNsdWRlcyhjKSAmJiAha2V5U2VwYXJhdG9yLmluY2x1ZGVzKGMpKTtcbiAgaWYgKHBvc3NpYmxlQ2hhcnMubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgciA9IGxvb2tzTGlrZU9iamVjdFBhdGhSZWdFeHBDYWNoZS5nZXRSZWdFeHAoYCgke3Bvc3NpYmxlQ2hhcnMubWFwKGMgPT4gYyA9PT0gJz8nID8gJ1xcXFw/JyA6IGMpLmpvaW4oJ3wnKX0pYCk7XG4gIGxldCBtYXRjaGVkID0gIXIudGVzdChrZXkpO1xuICBpZiAoIW1hdGNoZWQpIHtcbiAgICBjb25zdCBraSA9IGtleS5pbmRleE9mKGtleVNlcGFyYXRvcik7XG4gICAgaWYgKGtpID4gMCAmJiAhci50ZXN0KGtleS5zdWJzdHJpbmcoMCwga2kpKSkge1xuICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVkO1xufTtcbmNvbnN0IGRlZXBGaW5kID0gKG9iaiwgcGF0aCwga2V5U2VwYXJhdG9yID0gJy4nKSA9PiB7XG4gIGlmICghb2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICBpZiAob2JqW3BhdGhdKSB7XG4gICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwYXRoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gb2JqW3BhdGhdO1xuICB9XG4gIGNvbnN0IHRva2VucyA9IHBhdGguc3BsaXQoa2V5U2VwYXJhdG9yKTtcbiAgbGV0IGN1cnJlbnQgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDspIHtcbiAgICBpZiAoIWN1cnJlbnQgfHwgdHlwZW9mIGN1cnJlbnQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgbmV4dDtcbiAgICBsZXQgbmV4dFBhdGggPSAnJztcbiAgICBmb3IgKGxldCBqID0gaTsgaiA8IHRva2Vucy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGogIT09IGkpIHtcbiAgICAgICAgbmV4dFBhdGggKz0ga2V5U2VwYXJhdG9yO1xuICAgICAgfVxuICAgICAgbmV4dFBhdGggKz0gdG9rZW5zW2pdO1xuICAgICAgbmV4dCA9IGN1cnJlbnRbbmV4dFBhdGhdO1xuICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoWydzdHJpbmcnLCAnbnVtYmVyJywgJ2Jvb2xlYW4nXS5pbmNsdWRlcyh0eXBlb2YgbmV4dCkgJiYgaiA8IHRva2Vucy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBqIC0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBjdXJyZW50ID0gbmV4dDtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn07XG5jb25zdCBnZXRDbGVhbmVkQ29kZSA9IGNvZGUgPT4gY29kZT8ucmVwbGFjZSgvXy9nLCAnLScpO1xuXG5jb25zdCBjb25zb2xlTG9nZ2VyID0ge1xuICB0eXBlOiAnbG9nZ2VyJyxcbiAgbG9nKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnbG9nJywgYXJncyk7XG4gIH0sXG4gIHdhcm4oYXJncykge1xuICAgIHRoaXMub3V0cHV0KCd3YXJuJywgYXJncyk7XG4gIH0sXG4gIGVycm9yKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnZXJyb3InLCBhcmdzKTtcbiAgfSxcbiAgb3V0cHV0KHR5cGUsIGFyZ3MpIHtcbiAgICBjb25zb2xlPy5bdHlwZV0/LmFwcGx5Py4oY29uc29sZSwgYXJncyk7XG4gIH1cbn07XG5jbGFzcyBMb2dnZXIge1xuICBjb25zdHJ1Y3Rvcihjb25jcmV0ZUxvZ2dlciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5pbml0KGNvbmNyZXRlTG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxuICBpbml0KGNvbmNyZXRlTG9nZ2VyLCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8ICdpMThuZXh0Oic7XG4gICAgdGhpcy5sb2dnZXIgPSBjb25jcmV0ZUxvZ2dlciB8fCBjb25zb2xlTG9nZ2VyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5kZWJ1ZyA9IG9wdGlvbnMuZGVidWc7XG4gIH1cbiAgbG9nKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdsb2cnLCAnJywgdHJ1ZSk7XG4gIH1cbiAgd2FybiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnd2FybicsICcnLCB0cnVlKTtcbiAgfVxuICBlcnJvciguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnZXJyb3InLCAnJyk7XG4gIH1cbiAgZGVwcmVjYXRlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJ1dBUk5JTkcgREVQUkVDQVRFRDogJywgdHJ1ZSk7XG4gIH1cbiAgZm9yd2FyZChhcmdzLCBsdmwsIHByZWZpeCwgZGVidWdPbmx5KSB7XG4gICAgaWYgKGRlYnVnT25seSAmJiAhdGhpcy5kZWJ1ZykgcmV0dXJuIG51bGw7XG4gICAgYXJncyA9IGFyZ3MubWFwKGEgPT4gaXNTdHJpbmcoYSkgPyBhLnJlcGxhY2UoL1tcXHJcXG5cXHgwMC1cXHgxRlxceDdGXS9nLCAnICcpIDogYSk7XG4gICAgaWYgKGlzU3RyaW5nKGFyZ3NbMF0pKSBhcmdzWzBdID0gYCR7cHJlZml4fSR7dGhpcy5wcmVmaXh9ICR7YXJnc1swXX1gO1xuICAgIHJldHVybiB0aGlzLmxvZ2dlcltsdmxdKGFyZ3MpO1xuICB9XG4gIGNyZWF0ZShtb2R1bGVOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBMb2dnZXIodGhpcy5sb2dnZXIsIHtcbiAgICAgIC4uLntcbiAgICAgICAgcHJlZml4OiBgJHt0aGlzLnByZWZpeH06JHttb2R1bGVOYW1lfTpgXG4gICAgICB9LFxuICAgICAgLi4udGhpcy5vcHRpb25zXG4gICAgfSk7XG4gIH1cbiAgY2xvbmUob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHRoaXMub3B0aW9ucztcbiAgICBvcHRpb25zLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8IHRoaXMucHJlZml4O1xuICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxufVxudmFyIGJhc2VMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMub2JzZXJ2ZXJzID0ge307XG4gIH1cbiAgb24oZXZlbnRzLCBsaXN0ZW5lcikge1xuICAgIGV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgaWYgKCF0aGlzLm9ic2VydmVyc1tldmVudF0pIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSA9IG5ldyBNYXAoKTtcbiAgICAgIGNvbnN0IG51bUxpc3RlbmVycyA9IHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5nZXQobGlzdGVuZXIpIHx8IDA7XG4gICAgICB0aGlzLm9ic2VydmVyc1tldmVudF0uc2V0KGxpc3RlbmVyLCBudW1MaXN0ZW5lcnMgKyAxKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBvZmYoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKCF0aGlzLm9ic2VydmVyc1tldmVudF0pIHJldHVybjtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICBkZWxldGUgdGhpcy5vYnNlcnZlcnNbZXZlbnRdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm9ic2VydmVyc1tldmVudF0uZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGNvbnN0IHdyYXBwZXIgPSAoLi4uYXJncykgPT4ge1xuICAgICAgbGlzdGVuZXIoLi4uYXJncyk7XG4gICAgICB0aGlzLm9mZihldmVudCwgd3JhcHBlcik7XG4gICAgfTtcbiAgICB0aGlzLm9uKGV2ZW50LCB3cmFwcGVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBlbWl0KGV2ZW50LCAuLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSkge1xuICAgICAgY29uc3QgY2xvbmVkID0gQXJyYXkuZnJvbSh0aGlzLm9ic2VydmVyc1tldmVudF0uZW50cmllcygpKTtcbiAgICAgIGNsb25lZC5mb3JFYWNoKChbb2JzZXJ2ZXIsIG51bVRpbWVzQWRkZWRdKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVGltZXNBZGRlZDsgaSsrKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIoLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vYnNlcnZlcnNbJyonXSkge1xuICAgICAgY29uc3QgY2xvbmVkID0gQXJyYXkuZnJvbSh0aGlzLm9ic2VydmVyc1snKiddLmVudHJpZXMoKSk7XG4gICAgICBjbG9uZWQuZm9yRWFjaCgoW29ic2VydmVyLCBudW1UaW1lc0FkZGVkXSkgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRpbWVzQWRkZWQ7IGkrKykge1xuICAgICAgICAgIG9ic2VydmVyKGV2ZW50LCAuLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFJlc291cmNlU3RvcmUgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihkYXRhLCBvcHRpb25zID0ge1xuICAgIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgZGVmYXVsdE5TOiAndHJhbnNsYXRpb24nXG4gIH0pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBhZGROYW1lc3BhY2VzKG5zKSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubnMuaW5jbHVkZXMobnMpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubnMucHVzaChucyk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU5hbWVzcGFjZXMobnMpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5vcHRpb25zLm5zLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIGdldFJlc291cmNlKGxuZywgbnMsIGtleSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBjb25zdCBpZ25vcmVKU09OU3RydWN0dXJlID0gb3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgOiB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZTtcbiAgICBsZXQgcGF0aDtcbiAgICBpZiAobG5nLmluY2x1ZGVzKCcuJykpIHtcbiAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgIHBhdGgucHVzaCguLi5rZXkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RyaW5nKGtleSkgJiYga2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKC4uLmtleS5zcGxpdChrZXlTZXBhcmF0b3IpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXRoLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCk7XG4gICAgaWYgKCFyZXN1bHQgJiYgIW5zICYmICFrZXkgJiYgbG5nLmluY2x1ZGVzKCcuJykpIHtcbiAgICAgIGxuZyA9IHBhdGhbMF07XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgICBrZXkgPSBwYXRoLnNsaWNlKDIpLmpvaW4oJy4nKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdCB8fCAhaWdub3JlSlNPTlN0cnVjdHVyZSB8fCAhaXNTdHJpbmcoa2V5KSkgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gZGVlcEZpbmQodGhpcy5kYXRhPy5bbG5nXT8uW25zXSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICB9XG4gIGFkZFJlc291cmNlKGxuZywgbnMsIGtleSwgdmFsdWUsIG9wdGlvbnMgPSB7XG4gICAgc2lsZW50OiBmYWxzZVxuICB9KSB7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAoa2V5KSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuICAgIGlmIChsbmcuaW5jbHVkZXMoJy4nKSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgdmFsdWUgPSBucztcbiAgICAgIG5zID0gcGF0aFsxXTtcbiAgICB9XG4gICAgdGhpcy5hZGROYW1lc3BhY2VzKG5zKTtcbiAgICBzZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCwgdmFsdWUpO1xuICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCBrZXksIHZhbHVlKTtcbiAgfVxuICBhZGRSZXNvdXJjZXMobG5nLCBucywgcmVzb3VyY2VzLCBvcHRpb25zID0ge1xuICAgIHNpbGVudDogZmFsc2VcbiAgfSkge1xuICAgIGZvciAoY29uc3QgbSBpbiByZXNvdXJjZXMpIHtcbiAgICAgIGlmIChpc1N0cmluZyhyZXNvdXJjZXNbbV0pIHx8IEFycmF5LmlzQXJyYXkocmVzb3VyY2VzW21dKSkgdGhpcy5hZGRSZXNvdXJjZShsbmcsIG5zLCBtLCByZXNvdXJjZXNbbV0sIHtcbiAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgcmVzb3VyY2VzLCBkZWVwLCBvdmVyd3JpdGUsIG9wdGlvbnMgPSB7XG4gICAgc2lsZW50OiBmYWxzZSxcbiAgICBza2lwQ29weTogZmFsc2VcbiAgfSkge1xuICAgIGxldCBwYXRoID0gW2xuZywgbnNdO1xuICAgIGlmIChsbmcuaW5jbHVkZXMoJy4nKSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgZGVlcCA9IHJlc291cmNlcztcbiAgICAgIHJlc291cmNlcyA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIGxldCBwYWNrID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpIHx8IHt9O1xuICAgIGlmICghb3B0aW9ucy5za2lwQ29weSkgcmVzb3VyY2VzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXNvdXJjZXMpKTtcbiAgICBpZiAoZGVlcCkge1xuICAgICAgZGVlcEV4dGVuZChwYWNrLCByZXNvdXJjZXMsIG92ZXJ3cml0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhY2sgPSB7XG4gICAgICAgIC4uLnBhY2ssXG4gICAgICAgIC4uLnJlc291cmNlc1xuICAgICAgfTtcbiAgICB9XG4gICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHBhY2spO1xuICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCByZXNvdXJjZXMpO1xuICB9XG4gIHJlbW92ZVJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgZGVsZXRlIHRoaXMuZGF0YVtsbmddW25zXTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVOYW1lc3BhY2VzKG5zKTtcbiAgICB0aGlzLmVtaXQoJ3JlbW92ZWQnLCBsbmcsIG5zKTtcbiAgfVxuICBoYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucykgIT09IHVuZGVmaW5lZDtcbiAgfVxuICBnZXRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TO1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlKGxuZywgbnMpO1xuICB9XG4gIGdldERhdGFCeUxhbmd1YWdlKGxuZykge1xuICAgIHJldHVybiB0aGlzLmRhdGFbbG5nXTtcbiAgfVxuICBoYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMobG5nKSB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuZ2V0RGF0YUJ5TGFuZ3VhZ2UobG5nKTtcbiAgICBjb25zdCBuID0gZGF0YSAmJiBPYmplY3Qua2V5cyhkYXRhKSB8fCBbXTtcbiAgICByZXR1cm4gISFuLmZpbmQodiA9PiBkYXRhW3ZdICYmIE9iamVjdC5rZXlzKGRhdGFbdl0pLmxlbmd0aCA+IDApO1xuICB9XG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG5cbnZhciBwb3N0UHJvY2Vzc29yID0ge1xuICBwcm9jZXNzb3JzOiB7fSxcbiAgYWRkUG9zdFByb2Nlc3Nvcihtb2R1bGUpIHtcbiAgICB0aGlzLnByb2Nlc3NvcnNbbW9kdWxlLm5hbWVdID0gbW9kdWxlO1xuICB9LFxuICBoYW5kbGUocHJvY2Vzc29ycywgdmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNsYXRvcikge1xuICAgIHByb2Nlc3NvcnMuZm9yRWFjaChwcm9jZXNzb3IgPT4ge1xuICAgICAgdmFsdWUgPSB0aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXT8ucHJvY2Vzcyh2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKSA/PyB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn07XG5cbmNvbnN0IFBBVEhfS0VZID0gU3ltYm9sKCdpMThuZXh0L1BBVEhfS0VZJyk7XG5mdW5jdGlvbiBjcmVhdGVQcm94eSgpIHtcbiAgY29uc3Qgc3RhdGUgPSBbXTtcbiAgY29uc3QgaGFuZGxlciA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCBwcm94eTtcbiAgaGFuZGxlci5nZXQgPSAodGFyZ2V0LCBrZXkpID0+IHtcbiAgICBwcm94eT8ucmV2b2tlPy4oKTtcbiAgICBpZiAoa2V5ID09PSBQQVRIX0tFWSkgcmV0dXJuIHN0YXRlO1xuICAgIHN0YXRlLnB1c2goa2V5KTtcbiAgICBwcm94eSA9IFByb3h5LnJldm9jYWJsZSh0YXJnZXQsIGhhbmRsZXIpO1xuICAgIHJldHVybiBwcm94eS5wcm94eTtcbiAgfTtcbiAgcmV0dXJuIFByb3h5LnJldm9jYWJsZShPYmplY3QuY3JlYXRlKG51bGwpLCBoYW5kbGVyKS5wcm94eTtcbn1cbmZ1bmN0aW9uIGtleXNGcm9tU2VsZWN0b3Ioc2VsZWN0b3IsIG9wdHMpIHtcbiAgY29uc3Qge1xuICAgIFtQQVRIX0tFWV06IHBhdGhcbiAgfSA9IHNlbGVjdG9yKGNyZWF0ZVByb3h5KCkpO1xuICBjb25zdCBrZXlTZXBhcmF0b3IgPSBvcHRzPy5rZXlTZXBhcmF0b3IgPz8gJy4nO1xuICBjb25zdCBuc1NlcGFyYXRvciA9IG9wdHM/Lm5zU2VwYXJhdG9yID8/ICc6JztcbiAgY29uc3Qgc3RyaWN0ID0gb3B0cz8uZW5hYmxlU2VsZWN0b3IgPT09ICdzdHJpY3QnO1xuICBpZiAocGF0aC5sZW5ndGggPiAxICYmIG5zU2VwYXJhdG9yKSB7XG4gICAgY29uc3QgbnMgPSBvcHRzPy5ucztcbiAgICBjb25zdCBuc0xpc3QgPSBzdHJpY3QgPyBBcnJheS5pc0FycmF5KG5zKSA/IG5zIDogbnMgPyBbbnNdIDogbnVsbCA6IEFycmF5LmlzQXJyYXkobnMpID8gbnMgOiBudWxsO1xuICAgIGlmIChuc0xpc3QpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBzdHJpY3QgPyBuc0xpc3QgOiBuc0xpc3QubGVuZ3RoID4gMSA/IG5zTGlzdC5zbGljZSgxKSA6IFtdO1xuICAgICAgaWYgKGNhbmRpZGF0ZXMuaW5jbHVkZXMocGF0aFswXSkpIHtcbiAgICAgICAgcmV0dXJuIGAke3BhdGhbMF19JHtuc1NlcGFyYXRvcn0ke3BhdGguc2xpY2UoMSkuam9pbihrZXlTZXBhcmF0b3IpfWA7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXRoLmpvaW4oa2V5U2VwYXJhdG9yKTtcbn1cblxuY29uc3Qgc2hvdWxkSGFuZGxlQXNPYmplY3QgPSByZXMgPT4gIWlzU3RyaW5nKHJlcykgJiYgdHlwZW9mIHJlcyAhPT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiByZXMgIT09ICdudW1iZXInO1xuY2xhc3MgVHJhbnNsYXRvciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKHNlcnZpY2VzLCBvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIGNvcHkoWydyZXNvdXJjZVN0b3JlJywgJ2xhbmd1YWdlVXRpbHMnLCAncGx1cmFsUmVzb2x2ZXInLCAnaW50ZXJwb2xhdG9yJywgJ2JhY2tlbmRDb25uZWN0b3InLCAnaTE4bkZvcm1hdCcsICd1dGlscyddLCBzZXJ2aWNlcywgdGhpcyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCd0cmFuc2xhdG9yJyk7XG4gICAgdGhpcy5jaGVja2VkTG9hZGVkRm9yID0ge307XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nKSB7XG4gICAgaWYgKGxuZykgdGhpcy5sYW5ndWFnZSA9IGxuZztcbiAgfVxuICBleGlzdHMoa2V5LCBvID0ge1xuICAgIGludGVycG9sYXRpb246IHt9XG4gIH0pIHtcbiAgICBjb25zdCBvcHQgPSB7XG4gICAgICAuLi5vXG4gICAgfTtcbiAgICBpZiAoa2V5ID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXksIG9wdCk7XG4gICAgaWYgKHJlc29sdmVkPy5yZXMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGlzT2JqZWN0ID0gc2hvdWxkSGFuZGxlQXNPYmplY3QocmVzb2x2ZWQucmVzKTtcbiAgICBpZiAob3B0LnJldHVybk9iamVjdHMgPT09IGZhbHNlICYmIGlzT2JqZWN0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGV4dHJhY3RGcm9tS2V5KGtleSwgb3B0KSB7XG4gICAgbGV0IG5zU2VwYXJhdG9yID0gb3B0Lm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHQubnNTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgaWYgKG5zU2VwYXJhdG9yID09PSB1bmRlZmluZWQpIG5zU2VwYXJhdG9yID0gJzonO1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdC5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdC5rZXlTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgIGxldCBuYW1lc3BhY2VzID0gb3B0Lm5zIHx8IHRoaXMub3B0aW9ucy5kZWZhdWx0TlMgfHwgW107XG4gICAgY29uc3Qgd291bGRDaGVja0Zvck5zSW5LZXkgPSBuc1NlcGFyYXRvciAmJiBrZXkuaW5jbHVkZXMobnNTZXBhcmF0b3IpO1xuICAgIGNvbnN0IHNlZW1zTmF0dXJhbExhbmd1YWdlID0gIXRoaXMub3B0aW9ucy51c2VyRGVmaW5lZEtleVNlcGFyYXRvciAmJiAhb3B0LmtleVNlcGFyYXRvciAmJiAhdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkTnNTZXBhcmF0b3IgJiYgIW9wdC5uc1NlcGFyYXRvciAmJiAhbG9va3NMaWtlT2JqZWN0UGF0aChrZXksIG5zU2VwYXJhdG9yLCBrZXlTZXBhcmF0b3IpO1xuICAgIGlmICh3b3VsZENoZWNrRm9yTnNJbktleSAmJiAhc2VlbXNOYXR1cmFsTGFuZ3VhZ2UpIHtcbiAgICAgIGNvbnN0IG0gPSBrZXkubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG4gICAgICBpZiAobSAmJiBtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbmFtZXNwYWNlczogaXNTdHJpbmcobmFtZXNwYWNlcykgPyBbbmFtZXNwYWNlc10gOiBuYW1lc3BhY2VzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdChuc1NlcGFyYXRvcik7XG4gICAgICBpZiAobnNTZXBhcmF0b3IgIT09IGtleVNlcGFyYXRvciB8fCBuc1NlcGFyYXRvciA9PT0ga2V5U2VwYXJhdG9yICYmIHRoaXMub3B0aW9ucy5ucy5pbmNsdWRlcyhwYXJ0c1swXSkpIG5hbWVzcGFjZXMgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAga2V5ID0gcGFydHMuam9pbihrZXlTZXBhcmF0b3IpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlczogaXNTdHJpbmcobmFtZXNwYWNlcykgPyBbbmFtZXNwYWNlc10gOiBuYW1lc3BhY2VzXG4gICAgfTtcbiAgfVxuICB0cmFuc2xhdGUoa2V5cywgbywgbGFzdEtleSkge1xuICAgIGxldCBvcHQgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyB7XG4gICAgICAuLi5vXG4gICAgfSA6IG87XG4gICAgaWYgKHR5cGVvZiBvcHQgIT09ICdvYmplY3QnICYmIHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcikge1xuICAgICAgb3B0ID0gdGhpcy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0ID09PSAnb2JqZWN0Jykgb3B0ID0ge1xuICAgICAgLi4ub3B0XG4gICAgfTtcbiAgICBpZiAoIW9wdCkgb3B0ID0ge307XG4gICAgaWYgKGtleXMgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ2Z1bmN0aW9uJykga2V5cyA9IGtleXNGcm9tU2VsZWN0b3Ioa2V5cywge1xuICAgICAgLi4udGhpcy5vcHRpb25zLFxuICAgICAgLi4ub3B0XG4gICAgfSk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSBrZXlzID0gW1N0cmluZyhrZXlzKV07XG4gICAga2V5cyA9IGtleXMubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdmdW5jdGlvbicgPyBrZXlzRnJvbVNlbGVjdG9yKGssIHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLm9wdFxuICAgIH0pIDogU3RyaW5nKGspKTtcbiAgICBjb25zdCByZXR1cm5EZXRhaWxzID0gb3B0LnJldHVybkRldGFpbHMgIT09IHVuZGVmaW5lZCA/IG9wdC5yZXR1cm5EZXRhaWxzIDogdGhpcy5vcHRpb25zLnJldHVybkRldGFpbHM7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0LmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0LmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgY29uc3Qge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlc1xuICAgIH0gPSB0aGlzLmV4dHJhY3RGcm9tS2V5KGtleXNba2V5cy5sZW5ndGggLSAxXSwgb3B0KTtcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzW25hbWVzcGFjZXMubGVuZ3RoIC0gMV07XG4gICAgbGV0IG5zU2VwYXJhdG9yID0gb3B0Lm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHQubnNTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgaWYgKG5zU2VwYXJhdG9yID09PSB1bmRlZmluZWQpIG5zU2VwYXJhdG9yID0gJzonO1xuICAgIGNvbnN0IGxuZyA9IG9wdC5sbmcgfHwgdGhpcy5sYW5ndWFnZTtcbiAgICBjb25zdCBhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSA9IG9wdC5hcHBlbmROYW1lc3BhY2VUb0NJTW9kZSB8fCB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU7XG4gICAgaWYgKGxuZz8udG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHtcbiAgICAgIGlmIChhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSkge1xuICAgICAgICBpZiAocmV0dXJuRGV0YWlscykge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXM6IGAke25hbWVzcGFjZX0ke25zU2VwYXJhdG9yfSR7a2V5fWAsXG4gICAgICAgICAgICB1c2VkS2V5OiBrZXksXG4gICAgICAgICAgICBleGFjdFVzZWRLZXk6IGtleSxcbiAgICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICAgIHVzZWROUzogbmFtZXNwYWNlLFxuICAgICAgICAgICAgdXNlZFBhcmFtczogdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHQpXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzOiBrZXksXG4gICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZSxcbiAgICAgICAgICB1c2VkUGFyYW1zOiB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdClcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlKGtleXMsIG9wdCk7XG4gICAgbGV0IHJlcyA9IHJlc29sdmVkPy5yZXM7XG4gICAgY29uc3QgcmVzVXNlZEtleSA9IHJlc29sdmVkPy51c2VkS2V5IHx8IGtleTtcbiAgICBjb25zdCByZXNFeGFjdFVzZWRLZXkgPSByZXNvbHZlZD8uZXhhY3RVc2VkS2V5IHx8IGtleTtcbiAgICBjb25zdCBub09iamVjdCA9IFsnW29iamVjdCBOdW1iZXJdJywgJ1tvYmplY3QgRnVuY3Rpb25dJywgJ1tvYmplY3QgUmVnRXhwXSddO1xuICAgIGNvbnN0IGpvaW5BcnJheXMgPSBvcHQuam9pbkFycmF5cyAhPT0gdW5kZWZpbmVkID8gb3B0LmpvaW5BcnJheXMgOiB0aGlzLm9wdGlvbnMuam9pbkFycmF5cztcbiAgICBjb25zdCBoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCA9ICF0aGlzLmkxOG5Gb3JtYXQgfHwgdGhpcy5pMThuRm9ybWF0LmhhbmRsZUFzT2JqZWN0O1xuICAgIGNvbnN0IG5lZWRzUGx1cmFsSGFuZGxpbmcgPSBvcHQuY291bnQgIT09IHVuZGVmaW5lZCAmJiAhaXNTdHJpbmcob3B0LmNvdW50KTtcbiAgICBjb25zdCBoYXNEZWZhdWx0VmFsdWUgPSBUcmFuc2xhdG9yLmhhc0RlZmF1bHRWYWx1ZShvcHQpO1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgPyB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChsbmcsIG9wdC5jb3VudCwgb3B0KSA6ICcnO1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFjayA9IG9wdC5vcmRpbmFsICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcgPyB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChsbmcsIG9wdC5jb3VudCwge1xuICAgICAgb3JkaW5hbDogZmFsc2VcbiAgICB9KSA6ICcnO1xuICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdC5vcmRpbmFsICYmIG9wdC5jb3VudCA9PT0gMDtcbiAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBuZWVkc1plcm9TdWZmaXhMb29rdXAgJiYgb3B0W2BkZWZhdWx0VmFsdWUke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2BdIHx8IG9wdFtgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXh9YF0gfHwgb3B0W2BkZWZhdWx0VmFsdWUke2RlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFja31gXSB8fCBvcHQuZGVmYXVsdFZhbHVlO1xuICAgIGxldCByZXNGb3JPYmpIbmRsID0gcmVzO1xuICAgIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiAhcmVzICYmIGhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgcmVzRm9yT2JqSG5kbCA9IGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGFuZGxlQXNPYmplY3QgPSBzaG91bGRIYW5kbGVBc09iamVjdChyZXNGb3JPYmpIbmRsKTtcbiAgICBjb25zdCByZXNUeXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShyZXNGb3JPYmpIbmRsKTtcbiAgICBpZiAoaGFuZGxlQXNPYmplY3RJbkkxOG5Gb3JtYXQgJiYgcmVzRm9yT2JqSG5kbCAmJiBoYW5kbGVBc09iamVjdCAmJiAhbm9PYmplY3QuaW5jbHVkZXMocmVzVHlwZSkgJiYgIShpc1N0cmluZyhqb2luQXJyYXlzKSAmJiBBcnJheS5pc0FycmF5KHJlc0Zvck9iakhuZGwpKSkge1xuICAgICAgaWYgKCFvcHQucmV0dXJuT2JqZWN0cyAmJiAhdGhpcy5vcHRpb25zLnJldHVybk9iamVjdHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignYWNjZXNzaW5nIGFuIG9iamVjdCAtIGJ1dCByZXR1cm5PYmplY3RzIG9wdGlvbnMgaXMgbm90IGVuYWJsZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgciA9IHRoaXMub3B0aW9ucy5yZXR1cm5lZE9iamVjdEhhbmRsZXIgPyB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKHJlc1VzZWRLZXksIHJlc0Zvck9iakhuZGwsIHtcbiAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgbnM6IG5hbWVzcGFjZXNcbiAgICAgICAgfSkgOiBga2V5ICcke2tleX0gKCR7dGhpcy5sYW5ndWFnZX0pJyByZXR1cm5lZCBhbiBvYmplY3QgaW5zdGVhZCBvZiBzdHJpbmcuYDtcbiAgICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgICByZXNvbHZlZC5yZXMgPSByO1xuICAgICAgICAgIHJlc29sdmVkLnVzZWRQYXJhbXMgPSB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdCk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfVxuICAgICAgaWYgKGtleVNlcGFyYXRvcikge1xuICAgICAgICBjb25zdCByZXNUeXBlSXNBcnJheSA9IEFycmF5LmlzQXJyYXkocmVzRm9yT2JqSG5kbCk7XG4gICAgICAgIGNvbnN0IGNvcHkgPSByZXNUeXBlSXNBcnJheSA/IFtdIDoge307XG4gICAgICAgIGNvbnN0IG5ld0tleVRvVXNlID0gcmVzVHlwZUlzQXJyYXkgPyByZXNFeGFjdFVzZWRLZXkgOiByZXNVc2VkS2V5O1xuICAgICAgICBmb3IgKGNvbnN0IG0gaW4gcmVzRm9yT2JqSG5kbCkge1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzRm9yT2JqSG5kbCwgbSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZXBLZXkgPSBgJHtuZXdLZXlUb1VzZX0ke2tleVNlcGFyYXRvcn0ke219YDtcbiAgICAgICAgICAgIGlmIChoYXNEZWZhdWx0VmFsdWUgJiYgIXJlcykge1xuICAgICAgICAgICAgICBjb3B5W21dID0gdGhpcy50cmFuc2xhdGUoZGVlcEtleSwge1xuICAgICAgICAgICAgICAgIC4uLm9wdCxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IHNob3VsZEhhbmRsZUFzT2JqZWN0KGRlZmF1bHRWYWx1ZSkgPyBkZWZhdWx0VmFsdWVbbV0gOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgLi4ue1xuICAgICAgICAgICAgICAgICAgam9pbkFycmF5czogZmFsc2UsXG4gICAgICAgICAgICAgICAgICBuczogbmFtZXNwYWNlc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb3B5W21dID0gdGhpcy50cmFuc2xhdGUoZGVlcEtleSwge1xuICAgICAgICAgICAgICAgIC4uLm9wdCxcbiAgICAgICAgICAgICAgICAuLi57XG4gICAgICAgICAgICAgICAgICBqb2luQXJyYXlzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb3B5W21dID09PSBkZWVwS2V5KSBjb3B5W21dID0gcmVzRm9yT2JqSG5kbFttXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gY29weTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ICYmIGlzU3RyaW5nKGpvaW5BcnJheXMpICYmIEFycmF5LmlzQXJyYXkocmVzKSkge1xuICAgICAgcmVzID0gcmVzLmpvaW4oam9pbkFycmF5cyk7XG4gICAgICBpZiAocmVzKSByZXMgPSB0aGlzLmV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5cywgb3B0LCBsYXN0S2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHVzZWREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBsZXQgdXNlZEtleSA9IGZhbHNlO1xuICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAocmVzKSAmJiBoYXNEZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgdXNlZERlZmF1bHQgPSB0cnVlO1xuICAgICAgICByZXMgPSBkZWZhdWx0VmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChyZXMpKSB7XG4gICAgICAgIHVzZWRLZXkgPSB0cnVlO1xuICAgICAgICByZXMgPSBrZXk7XG4gICAgICB9XG4gICAgICBjb25zdCBtaXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXkgPSBvcHQubWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5IHx8IHRoaXMub3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXk7XG4gICAgICBjb25zdCByZXNGb3JNaXNzaW5nID0gbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ICYmIHVzZWRLZXkgPyB1bmRlZmluZWQgOiByZXM7XG4gICAgICBjb25zdCB1cGRhdGVNaXNzaW5nID0gaGFzRGVmYXVsdFZhbHVlICYmIGRlZmF1bHRWYWx1ZSAhPT0gcmVzICYmIHRoaXMub3B0aW9ucy51cGRhdGVNaXNzaW5nO1xuICAgICAgaWYgKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQgfHwgdXBkYXRlTWlzc2luZykge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2codXBkYXRlTWlzc2luZyA/ICd1cGRhdGVLZXknIDogJ21pc3NpbmdLZXknLCBsbmcsIG5hbWVzcGFjZSwgbmVlZHNQbHVyYWxIYW5kbGluZyAmJiAhdXBkYXRlTWlzc2luZyA/IGAke2tleX0ke3RoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0LmNvdW50LCBvcHQpfWAgOiBrZXksIHVwZGF0ZU1pc3NpbmcgPyBkZWZhdWx0VmFsdWUgOiByZXMpO1xuICAgICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgY29uc3QgZmsgPSB0aGlzLnJlc29sdmUoa2V5LCB7XG4gICAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgICBrZXlTZXBhcmF0b3I6IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKGZrICYmIGZrLnJlcykgdGhpcy5sb2dnZXIud2FybignU2VlbXMgdGhlIGxvYWRlZCB0cmFuc2xhdGlvbnMgd2VyZSBpbiBmbGF0IEpTT04gZm9ybWF0IGluc3RlYWQgb2YgbmVzdGVkLiBFaXRoZXIgc2V0IGtleVNlcGFyYXRvcjogZmFsc2Ugb24gaW5pdCBvciBtYWtlIHN1cmUgeW91ciB0cmFuc2xhdGlvbnMgYXJlIHB1Ymxpc2hlZCBpbiBuZXN0ZWQgZm9ybWF0LicpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsbmdzID0gW107XG4gICAgICAgIGNvbnN0IGZhbGxiYWNrTG5ncyA9IHRoaXMubGFuZ3VhZ2VVdGlscy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZywgb3B0LmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnZmFsbGJhY2snICYmIGZhbGxiYWNrTG5ncyAmJiBmYWxsYmFja0xuZ3NbMF0pIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhbGxiYWNrTG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG5ncy5wdXNoKGZhbGxiYWNrTG5nc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnYWxsJykge1xuICAgICAgICAgIGxuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdC5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG5ncy5wdXNoKG9wdC5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VuZCA9IChsLCBrLCBzcGVjaWZpY0RlZmF1bHRWYWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRlZmF1bHRGb3JNaXNzaW5nID0gaGFzRGVmYXVsdFZhbHVlICYmIHNwZWNpZmljRGVmYXVsdFZhbHVlICE9PSByZXMgPyBzcGVjaWZpY0RlZmF1bHRWYWx1ZSA6IHJlc0Zvck1pc3Npbmc7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taXNzaW5nS2V5SGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm1pc3NpbmdLZXlIYW5kbGVyKGwsIG5hbWVzcGFjZSwgaywgZGVmYXVsdEZvck1pc3NpbmcsIHVwZGF0ZU1pc3NpbmcsIG9wdCk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJhY2tlbmRDb25uZWN0b3I/LnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbWl0KCdtaXNzaW5nS2V5JywgbCwgbmFtZXNwYWNlLCBrLCByZXMpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1BsdXJhbHMgJiYgbmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgbG5ncy5mb3JFYWNoKGxhbmd1YWdlID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ZXMgPSB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeGVzKGxhbmd1YWdlLCBvcHQpO1xuICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwICYmIG9wdFtgZGVmYXVsdFZhbHVlJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gXSAmJiAhc3VmZml4ZXMuaW5jbHVkZXMoYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYCkpIHtcbiAgICAgICAgICAgICAgICBzdWZmaXhlcy5wdXNoKGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2ApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN1ZmZpeGVzLmZvckVhY2goc3VmZml4ID0+IHtcbiAgICAgICAgICAgICAgICBzZW5kKFtsYW5ndWFnZV0sIGtleSArIHN1ZmZpeCwgb3B0W2BkZWZhdWx0VmFsdWUke3N1ZmZpeH1gXSB8fCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kKGxuZ3MsIGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHQsIHJlc29sdmVkLCBsYXN0S2V5KTtcbiAgICAgIGlmICh1c2VkS2V5ICYmIHJlcyA9PT0ga2V5ICYmIHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkpIHtcbiAgICAgICAgcmVzID0gYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YDtcbiAgICAgIH1cbiAgICAgIGlmICgodXNlZEtleSB8fCB1c2VkRGVmYXVsdCkgJiYgdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIpIHtcbiAgICAgICAgcmVzID0gdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIodGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleSA/IGAke25hbWVzcGFjZX0ke25zU2VwYXJhdG9yfSR7a2V5fWAgOiBrZXksIHVzZWREZWZhdWx0ID8gcmVzIDogdW5kZWZpbmVkLCBvcHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmV0dXJuRGV0YWlscykge1xuICAgICAgcmVzb2x2ZWQucmVzID0gcmVzO1xuICAgICAgcmVzb2x2ZWQudXNlZFBhcmFtcyA9IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0KTtcbiAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBleHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleSwgb3B0LCByZXNvbHZlZCwgbGFzdEtleSkge1xuICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQ/LnBhcnNlKSB7XG4gICAgICByZXMgPSB0aGlzLmkxOG5Gb3JtYXQucGFyc2UocmVzLCB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMsXG4gICAgICAgIC4uLm9wdFxuICAgICAgfSwgb3B0LmxuZyB8fCB0aGlzLmxhbmd1YWdlIHx8IHJlc29sdmVkLnVzZWRMbmcsIHJlc29sdmVkLnVzZWROUywgcmVzb2x2ZWQudXNlZEtleSwge1xuICAgICAgICByZXNvbHZlZFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghb3B0LnNraXBJbnRlcnBvbGF0aW9uKSB7XG4gICAgICBpZiAob3B0LmludGVycG9sYXRpb24pIHRoaXMuaW50ZXJwb2xhdG9yLmluaXQoe1xuICAgICAgICAuLi5vcHQsXG4gICAgICAgIC4uLntcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICAgIC4uLm9wdC5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IGlzU3RyaW5nKHJlcykgJiYgKG9wdD8uaW50ZXJwb2xhdGlvbj8uc2tpcE9uVmFyaWFibGVzICE9PSB1bmRlZmluZWQgPyBvcHQuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMpO1xuICAgICAgbGV0IG5lc3RCZWY7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5iID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBuZXN0QmVmID0gbmIgJiYgbmIubGVuZ3RoO1xuICAgICAgfVxuICAgICAgbGV0IGRhdGEgPSBvcHQucmVwbGFjZSAmJiAhaXNTdHJpbmcob3B0LnJlcGxhY2UpID8gb3B0LnJlcGxhY2UgOiBvcHQ7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcykgZGF0YSA9IHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICAgIHJlcyA9IHRoaXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKHJlcywgZGF0YSwgb3B0LmxuZyB8fCB0aGlzLmxhbmd1YWdlIHx8IHJlc29sdmVkLnVzZWRMbmcsIG9wdCk7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5hID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBjb25zdCBuZXN0QWZ0ID0gbmEgJiYgbmEubGVuZ3RoO1xuICAgICAgICBpZiAobmVzdEJlZiA8IG5lc3RBZnQpIG9wdC5uZXN0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIW9wdC5sbmcgJiYgcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzKSBvcHQubG5nID0gdGhpcy5sYW5ndWFnZSB8fCByZXNvbHZlZC51c2VkTG5nO1xuICAgICAgaWYgKG9wdC5uZXN0ICE9PSBmYWxzZSkgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IubmVzdChyZXMsICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmIChsYXN0S2V5Py5bMF0gPT09IGFyZ3NbMF0gJiYgIW9wdC5jb250ZXh0KSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgSXQgc2VlbXMgeW91IGFyZSBuZXN0aW5nIHJlY3Vyc2l2ZWx5IGtleTogJHthcmdzWzBdfSBpbiBrZXk6ICR7a2V5WzBdfWApO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZSguLi5hcmdzLCBrZXkpO1xuICAgICAgfSwgb3B0KTtcbiAgICAgIGlmIChvcHQuaW50ZXJwb2xhdGlvbikgdGhpcy5pbnRlcnBvbGF0b3IucmVzZXQoKTtcbiAgICB9XG4gICAgY29uc3QgcG9zdFByb2Nlc3MgPSBvcHQucG9zdFByb2Nlc3MgfHwgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzO1xuICAgIGNvbnN0IHBvc3RQcm9jZXNzb3JOYW1lcyA9IGlzU3RyaW5nKHBvc3RQcm9jZXNzKSA/IFtwb3N0UHJvY2Vzc10gOiBwb3N0UHJvY2VzcztcbiAgICBpZiAocmVzICE9IG51bGwgJiYgcG9zdFByb2Nlc3Nvck5hbWVzPy5sZW5ndGggJiYgb3B0LmFwcGx5UG9zdFByb2Nlc3NvciAhPT0gZmFsc2UpIHtcbiAgICAgIHJlcyA9IHBvc3RQcm9jZXNzb3IuaGFuZGxlKHBvc3RQcm9jZXNzb3JOYW1lcywgcmVzLCBrZXksIHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQgPyB7XG4gICAgICAgIGkxOG5SZXNvbHZlZDoge1xuICAgICAgICAgIC4uLnJlc29sdmVkLFxuICAgICAgICAgIHVzZWRQYXJhbXM6IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0KVxuICAgICAgICB9LFxuICAgICAgICAuLi5vcHRcbiAgICAgIH0gOiBvcHQsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIHJlc29sdmUoa2V5cywgb3B0ID0ge30pIHtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IHVzZWRLZXk7XG4gICAgbGV0IGV4YWN0VXNlZEtleTtcbiAgICBsZXQgdXNlZExuZztcbiAgICBsZXQgdXNlZE5TO1xuICAgIGlmIChpc1N0cmluZyhrZXlzKSkga2V5cyA9IFtrZXlzXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkga2V5cyA9IGtleXMubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdmdW5jdGlvbicgPyBrZXlzRnJvbVNlbGVjdG9yKGssIHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLm9wdFxuICAgIH0pIDogayk7XG4gICAga2V5cy5mb3JFYWNoKGsgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IGV4dHJhY3RlZCA9IHRoaXMuZXh0cmFjdEZyb21LZXkoaywgb3B0KTtcbiAgICAgIGNvbnN0IGtleSA9IGV4dHJhY3RlZC5rZXk7XG4gICAgICB1c2VkS2V5ID0ga2V5O1xuICAgICAgbGV0IG5hbWVzcGFjZXMgPSBleHRyYWN0ZWQubmFtZXNwYWNlcztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZmFsbGJhY2tOUykgbmFtZXNwYWNlcyA9IG5hbWVzcGFjZXMuY29uY2F0KHRoaXMub3B0aW9ucy5mYWxsYmFja05TKTtcbiAgICAgIGNvbnN0IG5lZWRzUGx1cmFsSGFuZGxpbmcgPSBvcHQuY291bnQgIT09IHVuZGVmaW5lZCAmJiAhaXNTdHJpbmcob3B0LmNvdW50KTtcbiAgICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdC5vcmRpbmFsICYmIG9wdC5jb3VudCA9PT0gMDtcbiAgICAgIGNvbnN0IG5lZWRzQ29udGV4dEhhbmRsaW5nID0gb3B0LmNvbnRleHQgIT09IHVuZGVmaW5lZCAmJiAoaXNTdHJpbmcob3B0LmNvbnRleHQpIHx8IHR5cGVvZiBvcHQuY29udGV4dCA9PT0gJ251bWJlcicpICYmIG9wdC5jb250ZXh0ICE9PSAnJztcbiAgICAgIGNvbnN0IGNvZGVzID0gb3B0LmxuZ3MgPyBvcHQubG5ncyA6IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkob3B0LmxuZyB8fCB0aGlzLmxhbmd1YWdlLCBvcHQuZmFsbGJhY2tMbmcpO1xuICAgICAgbmFtZXNwYWNlcy5mb3JFYWNoKG5zID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgICAgdXNlZE5TID0gbnM7XG4gICAgICAgIGlmICghdGhpcy5jaGVja2VkTG9hZGVkRm9yW2Ake2NvZGVzWzBdfS0ke25zfWBdICYmIHRoaXMudXRpbHM/Lmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy51dGlscz8uaGFzTG9hZGVkTmFtZXNwYWNlKHVzZWROUykpIHtcbiAgICAgICAgICB0aGlzLmNoZWNrZWRMb2FkZWRGb3JbYCR7Y29kZXNbMF19LSR7bnN9YF0gPSB0cnVlO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYGtleSBcIiR7dXNlZEtleX1cIiBmb3IgbGFuZ3VhZ2VzIFwiJHtjb2Rlcy5qb2luKCcsICcpfVwiIHdvbid0IGdldCByZXNvbHZlZCBhcyBuYW1lc3BhY2UgXCIke3VzZWROU31cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICAgIHVzZWRMbmcgPSBjb2RlO1xuICAgICAgICAgIGNvbnN0IGZpbmFsS2V5cyA9IFtrZXldO1xuICAgICAgICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQ/LmFkZExvb2t1cEtleXMpIHtcbiAgICAgICAgICAgIHRoaXMuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKGZpbmFsS2V5cywga2V5LCBjb2RlLCBucywgb3B0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHBsdXJhbFN1ZmZpeDtcbiAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSBwbHVyYWxTdWZmaXggPSB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChjb2RlLCBvcHQuY291bnQsIG9wdCk7XG4gICAgICAgICAgICBjb25zdCB6ZXJvU3VmZml4ID0gYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYDtcbiAgICAgICAgICAgIGNvbnN0IG9yZGluYWxQcmVmaXggPSBgJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfW9yZGluYWwke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9YDtcbiAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgIGlmIChvcHQub3JkaW5hbCAmJiBwbHVyYWxTdWZmaXguc3RhcnRzV2l0aChvcmRpbmFsUHJlZml4KSkge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHBsdXJhbFN1ZmZpeC5yZXBsYWNlKG9yZGluYWxQcmVmaXgsIHRoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3IpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwKSB7XG4gICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goa2V5ICsgemVyb1N1ZmZpeCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZWVkc0NvbnRleHRIYW5kbGluZykge1xuICAgICAgICAgICAgICBjb25zdCBjb250ZXh0S2V5ID0gYCR7a2V5fSR7dGhpcy5vcHRpb25zLmNvbnRleHRTZXBhcmF0b3IgfHwgJ18nfSR7b3B0LmNvbnRleHR9YDtcbiAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goY29udGV4dEtleSk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdC5vcmRpbmFsICYmIHBsdXJhbFN1ZmZpeC5zdGFydHNXaXRoKG9yZGluYWxQcmVmaXgpKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4LnJlcGxhY2Uob3JkaW5hbFByZWZpeCwgdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgemVyb1N1ZmZpeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBwb3NzaWJsZUtleTtcbiAgICAgICAgICB3aGlsZSAocG9zc2libGVLZXkgPSBmaW5hbEtleXMucG9wKCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkge1xuICAgICAgICAgICAgICBleGFjdFVzZWRLZXkgPSBwb3NzaWJsZUtleTtcbiAgICAgICAgICAgICAgZm91bmQgPSB0aGlzLmdldFJlc291cmNlKGNvZGUsIG5zLCBwb3NzaWJsZUtleSwgb3B0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlczogZm91bmQsXG4gICAgICB1c2VkS2V5LFxuICAgICAgZXhhY3RVc2VkS2V5LFxuICAgICAgdXNlZExuZyxcbiAgICAgIHVzZWROU1xuICAgIH07XG4gIH1cbiAgaXNWYWxpZExvb2t1cChyZXMpIHtcbiAgICByZXR1cm4gcmVzICE9PSB1bmRlZmluZWQgJiYgISghdGhpcy5vcHRpb25zLnJldHVybk51bGwgJiYgcmVzID09PSBudWxsKSAmJiAhKCF0aGlzLm9wdGlvbnMucmV0dXJuRW1wdHlTdHJpbmcgJiYgcmVzID09PSAnJyk7XG4gIH1cbiAgZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKHRoaXMuaTE4bkZvcm1hdD8uZ2V0UmVzb3VyY2UpIHJldHVybiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VTdG9yZS5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgfVxuICBnZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zS2V5cyA9IFsnZGVmYXVsdFZhbHVlJywgJ29yZGluYWwnLCAnY29udGV4dCcsICdyZXBsYWNlJywgJ2xuZycsICdsbmdzJywgJ2ZhbGxiYWNrTG5nJywgJ25zJywgJ2tleVNlcGFyYXRvcicsICduc1NlcGFyYXRvcicsICdyZXR1cm5PYmplY3RzJywgJ3JldHVybkRldGFpbHMnLCAnam9pbkFycmF5cycsICdwb3N0UHJvY2VzcycsICdpbnRlcnBvbGF0aW9uJ107XG4gICAgY29uc3QgdXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhID0gb3B0aW9ucy5yZXBsYWNlICYmICFpc1N0cmluZyhvcHRpb25zLnJlcGxhY2UpO1xuICAgIGxldCBkYXRhID0gdXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhID8gb3B0aW9ucy5yZXBsYWNlIDogb3B0aW9ucztcbiAgICBpZiAodXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgZGF0YS5jb3VudCA9IG9wdGlvbnMuY291bnQ7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzKSB7XG4gICAgICBkYXRhID0ge1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLFxuICAgICAgICAuLi5kYXRhXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoIXVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSkge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIG9wdGlvbnNLZXlzKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9XG4gIHN0YXRpYyBoYXNEZWZhdWx0VmFsdWUob3B0aW9ucykge1xuICAgIGNvbnN0IHByZWZpeCA9ICdkZWZhdWx0VmFsdWUnO1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgb3B0aW9uKSAmJiBvcHRpb24uc3RhcnRzV2l0aChwcmVmaXgpICYmIHVuZGVmaW5lZCAhPT0gb3B0aW9uc1tvcHRpb25dKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuY2xhc3MgTGFuZ3VhZ2VVdGlsIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zdXBwb3J0ZWRMbmdzID0gdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgZmFsc2U7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnbGFuZ3VhZ2VVdGlscycpO1xuICB9XG4gIGdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgY29kZSA9IGdldENsZWFuZWRDb2RlKGNvZGUpO1xuICAgIGlmICghY29kZSB8fCAhY29kZS5pbmNsdWRlcygnLScpKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIGlmIChwLmxlbmd0aCA9PT0gMikgcmV0dXJuIG51bGw7XG4gICAgcC5wb3AoKTtcbiAgICBpZiAocFtwLmxlbmd0aCAtIDFdLnRvTG93ZXJDYXNlKCkgPT09ICd4JykgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKHAuam9pbignLScpKTtcbiAgfVxuICBnZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgY29kZSA9IGdldENsZWFuZWRDb2RlKGNvZGUpO1xuICAgIGlmICghY29kZSB8fCAhY29kZS5pbmNsdWRlcygnLScpKSByZXR1cm4gY29kZTtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwWzBdKTtcbiAgfVxuICBmb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkge1xuICAgIGlmIChpc1N0cmluZyhjb2RlKSAmJiBjb2RlLmluY2x1ZGVzKCctJykpIHtcbiAgICAgIGxldCBmb3JtYXR0ZWRDb2RlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkQ29kZSA9IEludGwuZ2V0Q2Fub25pY2FsTG9jYWxlcyhjb2RlKVswXTtcbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICBpZiAoZm9ybWF0dGVkQ29kZSAmJiB0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nKSB7XG4gICAgICAgIGZvcm1hdHRlZENvZGUgPSBmb3JtYXR0ZWRDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG4gICAgICBpZiAoZm9ybWF0dGVkQ29kZSkgcmV0dXJuIGZvcm1hdHRlZENvZGU7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvd2VyQ2FzZUxuZykge1xuICAgICAgICByZXR1cm4gY29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xlYW5Db2RlIHx8IHRoaXMub3B0aW9ucy5sb3dlckNhc2VMbmcgPyBjb2RlLnRvTG93ZXJDYXNlKCkgOiBjb2RlO1xuICB9XG4gIGlzU3VwcG9ydGVkQ29kZShjb2RlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkID09PSAnbGFuZ3VhZ2VPbmx5JyB8fCB0aGlzLm9wdGlvbnMubm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzKSB7XG4gICAgICBjb2RlID0gdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuICF0aGlzLnN1cHBvcnRlZExuZ3MgfHwgIXRoaXMuc3VwcG9ydGVkTG5ncy5sZW5ndGggfHwgdGhpcy5zdXBwb3J0ZWRMbmdzLmluY2x1ZGVzKGNvZGUpO1xuICB9XG4gIGdldEJlc3RNYXRjaEZyb21Db2Rlcyhjb2Rlcykge1xuICAgIGlmICghY29kZXMpIHJldHVybiBudWxsO1xuICAgIGxldCBmb3VuZDtcbiAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG4gICAgICBjb25zdCBjbGVhbmVkTG5nID0gdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSk7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGNsZWFuZWRMbmcpKSBmb3VuZCA9IGNsZWFuZWRMbmc7XG4gICAgfSk7XG4gICAgaWYgKCFmb3VuZCAmJiB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncykge1xuICAgICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGxuZ1NjT25seSA9IHRoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpO1xuICAgICAgICBpZiAodGhpcy5pc1N1cHBvcnRlZENvZGUobG5nU2NPbmx5KSkgcmV0dXJuIGZvdW5kID0gbG5nU2NPbmx5O1xuICAgICAgICBjb25zdCBsbmdPbmx5ID0gdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcbiAgICAgICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGxuZ09ubHkpKSByZXR1cm4gZm91bmQgPSBsbmdPbmx5O1xuICAgICAgICBmb3VuZCA9IHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmZpbmQoc3VwcG9ydGVkTG5nID0+IHtcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nID09PSBsbmdPbmx5KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBpZiAoIXN1cHBvcnRlZExuZy5pbmNsdWRlcygnLScpICYmICFsbmdPbmx5LmluY2x1ZGVzKCctJykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluY2x1ZGVzKCctJykgJiYgIWxuZ09ubHkuaW5jbHVkZXMoJy0nKSAmJiBzdXBwb3J0ZWRMbmcuc2xpY2UoMCwgc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSkgPT09IGxuZ09ubHkpIHJldHVybiB0cnVlO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuc3RhcnRzV2l0aChsbmdPbmx5KSAmJiBsbmdPbmx5Lmxlbmd0aCA+IDEpIHJldHVybiB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKVswXTtcbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbiAgZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja3MsIGNvZGUpIHtcbiAgICBpZiAoIWZhbGxiYWNrcykgcmV0dXJuIFtdO1xuICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnZnVuY3Rpb24nKSBmYWxsYmFja3MgPSBmYWxsYmFja3MoY29kZSk7XG4gICAgaWYgKGlzU3RyaW5nKGZhbGxiYWNrcykpIGZhbGxiYWNrcyA9IFtmYWxsYmFja3NdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGZhbGxiYWNrcykpIHJldHVybiBmYWxsYmFja3M7XG4gICAgaWYgKCFjb2RlKSByZXR1cm4gZmFsbGJhY2tzLmRlZmF1bHQgfHwgW107XG4gICAgbGV0IGZvdW5kID0gZmFsbGJhY2tzW2NvZGVdO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3MuZGVmYXVsdDtcbiAgICByZXR1cm4gZm91bmQgfHwgW107XG4gIH1cbiAgdG9SZXNvbHZlSGllcmFyY2h5KGNvZGUsIGZhbGxiYWNrQ29kZSkge1xuICAgIGNvbnN0IGZhbGxiYWNrQ29kZXMgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXMoKGZhbGxiYWNrQ29kZSA9PT0gZmFsc2UgPyBbXSA6IGZhbGxiYWNrQ29kZSkgfHwgdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIHx8IFtdLCBjb2RlKTtcbiAgICBjb25zdCBjb2RlcyA9IFtdO1xuICAgIGNvbnN0IGFkZENvZGUgPSBjID0+IHtcbiAgICAgIGlmICghYykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGMpKSB7XG4gICAgICAgIGNvZGVzLnB1c2goYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGByZWplY3RpbmcgbGFuZ3VhZ2UgY29kZSBub3QgZm91bmQgaW4gc3VwcG9ydGVkTG5nczogJHtjfWApO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKGlzU3RyaW5nKGNvZGUpICYmIChjb2RlLmluY2x1ZGVzKCctJykgfHwgY29kZS5pbmNsdWRlcygnXycpKSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnbGFuZ3VhZ2VPbmx5JykgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknICYmIHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2N1cnJlbnRPbmx5JykgYWRkQ29kZSh0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICB9IGVsc2UgaWYgKGlzU3RyaW5nKGNvZGUpKSB7XG4gICAgICBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICB9XG4gICAgZmFsbGJhY2tDb2Rlcy5mb3JFYWNoKGZjID0+IHtcbiAgICAgIGlmICghY29kZXMuaW5jbHVkZXMoZmMpKSBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGZjKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvZGVzO1xuICB9XG59XG5cbmNvbnN0IHN1ZmZpeGVzT3JkZXIgPSB7XG4gIHplcm86IDAsXG4gIG9uZTogMSxcbiAgdHdvOiAyLFxuICBmZXc6IDMsXG4gIG1hbnk6IDQsXG4gIG90aGVyOiA1XG59O1xuY29uc3QgZHVtbXlSdWxlID0ge1xuICBzZWxlY3Q6IGNvdW50ID0+IGNvdW50ID09PSAxID8gJ29uZScgOiAnb3RoZXInLFxuICByZXNvbHZlZE9wdGlvbnM6ICgpID0+ICh7XG4gICAgcGx1cmFsQ2F0ZWdvcmllczogWydvbmUnLCAnb3RoZXInXVxuICB9KVxufTtcbmNsYXNzIFBsdXJhbFJlc29sdmVyIHtcbiAgY29uc3RydWN0b3IobGFuZ3VhZ2VVdGlscywgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gbGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3BsdXJhbFJlc29sdmVyJyk7XG4gICAgdGhpcy5wbHVyYWxSdWxlc0NhY2hlID0ge307XG4gIH1cbiAgY2xlYXJDYWNoZSgpIHtcbiAgICB0aGlzLnBsdXJhbFJ1bGVzQ2FjaGUgPSB7fTtcbiAgfVxuICBnZXRSdWxlKGNvZGUsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGNsZWFuZWRDb2RlID0gZ2V0Q2xlYW5lZENvZGUoY29kZSA9PT0gJ2RldicgPyAnZW4nIDogY29kZSk7XG4gICAgY29uc3QgdHlwZSA9IG9wdGlvbnMub3JkaW5hbCA/ICdvcmRpbmFsJyA6ICdjYXJkaW5hbCc7XG4gICAgY29uc3QgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBjbGVhbmVkQ29kZSxcbiAgICAgIHR5cGVcbiAgICB9KTtcbiAgICBpZiAoY2FjaGVLZXkgaW4gdGhpcy5wbHVyYWxSdWxlc0NhY2hlKSB7XG4gICAgICByZXR1cm4gdGhpcy5wbHVyYWxSdWxlc0NhY2hlW2NhY2hlS2V5XTtcbiAgICB9XG4gICAgbGV0IHJ1bGU7XG4gICAgdHJ5IHtcbiAgICAgIHJ1bGUgPSBuZXcgSW50bC5QbHVyYWxSdWxlcyhjbGVhbmVkQ29kZSwge1xuICAgICAgICB0eXBlXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmICh0eXBlb2YgSW50bCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ05vIEludGwgc3VwcG9ydCwgcGxlYXNlIHVzZSBhbiBJbnRsIHBvbHlmaWxsIScpO1xuICAgICAgICByZXR1cm4gZHVtbXlSdWxlO1xuICAgICAgfVxuICAgICAgaWYgKCFjb2RlLm1hdGNoKC8tfF8vKSkgcmV0dXJuIGR1bW15UnVsZTtcbiAgICAgIGNvbnN0IGxuZ1BhcnQgPSB0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgICBydWxlID0gdGhpcy5nZXRSdWxlKGxuZ1BhcnQsIG9wdGlvbnMpO1xuICAgIH1cbiAgICB0aGlzLnBsdXJhbFJ1bGVzQ2FjaGVbY2FjaGVLZXldID0gcnVsZTtcbiAgICByZXR1cm4gcnVsZTtcbiAgfVxuICBuZWVkc1BsdXJhbChjb2RlLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAoIXJ1bGUpIHJ1bGUgPSB0aGlzLmdldFJ1bGUoJ2RldicsIG9wdGlvbnMpO1xuICAgIHJldHVybiBydWxlPy5yZXNvbHZlZE9wdGlvbnMoKS5wbHVyYWxDYXRlZ29yaWVzLmxlbmd0aCA+IDE7XG4gIH1cbiAgZ2V0UGx1cmFsRm9ybXNPZktleShjb2RlLCBrZXksIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeGVzKGNvZGUsIG9wdGlvbnMpLm1hcChzdWZmaXggPT4gYCR7a2V5fSR7c3VmZml4fWApO1xuICB9XG4gIGdldFN1ZmZpeGVzKGNvZGUsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmICghcnVsZSkgcnVsZSA9IHRoaXMuZ2V0UnVsZSgnZGV2Jywgb3B0aW9ucyk7XG4gICAgaWYgKCFydWxlKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJ1bGUucmVzb2x2ZWRPcHRpb25zKCkucGx1cmFsQ2F0ZWdvcmllcy5zb3J0KChwbHVyYWxDYXRlZ29yeTEsIHBsdXJhbENhdGVnb3J5MikgPT4gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTFdIC0gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTJdKS5tYXAocGx1cmFsQ2F0ZWdvcnkgPT4gYCR7dGhpcy5vcHRpb25zLnByZXBlbmR9JHtvcHRpb25zLm9yZGluYWwgPyBgb3JkaW5hbCR7dGhpcy5vcHRpb25zLnByZXBlbmR9YCA6ICcnfSR7cGx1cmFsQ2F0ZWdvcnl9YCk7XG4gIH1cbiAgZ2V0U3VmZml4KGNvZGUsIGNvdW50LCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmIChydWxlKSB7XG4gICAgICByZXR1cm4gYCR7dGhpcy5vcHRpb25zLnByZXBlbmR9JHtvcHRpb25zLm9yZGluYWwgPyBgb3JkaW5hbCR7dGhpcy5vcHRpb25zLnByZXBlbmR9YCA6ICcnfSR7cnVsZS5zZWxlY3QoY291bnQpfWA7XG4gICAgfVxuICAgIHRoaXMubG9nZ2VyLndhcm4oYG5vIHBsdXJhbCBydWxlIGZvdW5kIGZvcjogJHtjb2RlfWApO1xuICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeCgnZGV2JywgY291bnQsIG9wdGlvbnMpO1xuICB9XG59XG5cbmNvbnN0IGRlZXBGaW5kV2l0aERlZmF1bHRzID0gKGRhdGEsIGRlZmF1bHREYXRhLCBrZXksIGtleVNlcGFyYXRvciA9ICcuJywgaWdub3JlSlNPTlN0cnVjdHVyZSA9IHRydWUpID0+IHtcbiAgbGV0IHBhdGggPSBnZXRQYXRoV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpO1xuICBpZiAoIXBhdGggJiYgaWdub3JlSlNPTlN0cnVjdHVyZSAmJiBpc1N0cmluZyhrZXkpKSB7XG4gICAgcGF0aCA9IGRlZXBGaW5kKGRhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgICBpZiAocGF0aCA9PT0gdW5kZWZpbmVkKSBwYXRoID0gZGVlcEZpbmQoZGVmYXVsdERhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICByZXR1cm4gcGF0aDtcbn07XG5jb25zdCByZWdleFNhZmUgPSB2YWwgPT4gdmFsLnJlcGxhY2UoL1xcJC9nLCAnJCQkJCcpO1xuY2xhc3MgSW50ZXJwb2xhdG9yIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnaW50ZXJwb2xhdG9yJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZvcm1hdCA9IG9wdGlvbnM/LmludGVycG9sYXRpb24/LmZvcm1hdCB8fCAodmFsdWUgPT4gdmFsdWUpO1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghb3B0aW9ucy5pbnRlcnBvbGF0aW9uKSBvcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICBlc2NhcGVWYWx1ZTogdHJ1ZVxuICAgIH07XG4gICAgY29uc3Qge1xuICAgICAgZXNjYXBlOiBlc2NhcGUkMSxcbiAgICAgIGVzY2FwZVZhbHVlLFxuICAgICAgdXNlUmF3VmFsdWVUb0VzY2FwZSxcbiAgICAgIHByZWZpeCxcbiAgICAgIHByZWZpeEVzY2FwZWQsXG4gICAgICBzdWZmaXgsXG4gICAgICBzdWZmaXhFc2NhcGVkLFxuICAgICAgZm9ybWF0U2VwYXJhdG9yLFxuICAgICAgdW5lc2NhcGVTdWZmaXgsXG4gICAgICB1bmVzY2FwZVByZWZpeCxcbiAgICAgIG5lc3RpbmdQcmVmaXgsXG4gICAgICBuZXN0aW5nUHJlZml4RXNjYXBlZCxcbiAgICAgIG5lc3RpbmdTdWZmaXgsXG4gICAgICBuZXN0aW5nU3VmZml4RXNjYXBlZCxcbiAgICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yLFxuICAgICAgbWF4UmVwbGFjZXMsXG4gICAgICBhbHdheXNGb3JtYXRcbiAgICB9ID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMuZXNjYXBlID0gZXNjYXBlJDEgIT09IHVuZGVmaW5lZCA/IGVzY2FwZSQxIDogZXNjYXBlO1xuICAgIHRoaXMuZXNjYXBlVmFsdWUgPSBlc2NhcGVWYWx1ZSAhPT0gdW5kZWZpbmVkID8gZXNjYXBlVmFsdWUgOiB0cnVlO1xuICAgIHRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSA9IHVzZVJhd1ZhbHVlVG9Fc2NhcGUgIT09IHVuZGVmaW5lZCA/IHVzZVJhd1ZhbHVlVG9Fc2NhcGUgOiBmYWxzZTtcbiAgICB0aGlzLnByZWZpeCA9IHByZWZpeCA/IHJlZ2V4RXNjYXBlKHByZWZpeCkgOiBwcmVmaXhFc2NhcGVkIHx8ICd7eyc7XG4gICAgdGhpcy5zdWZmaXggPSBzdWZmaXggPyByZWdleEVzY2FwZShzdWZmaXgpIDogc3VmZml4RXNjYXBlZCB8fCAnfX0nO1xuICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gZm9ybWF0U2VwYXJhdG9yIHx8ICcsJztcbiAgICB0aGlzLnVuZXNjYXBlUHJlZml4ID0gdW5lc2NhcGVTdWZmaXggPyAnJyA6IHVuZXNjYXBlUHJlZml4ID8gcmVnZXhFc2NhcGUodW5lc2NhcGVQcmVmaXgpIDogJy0nO1xuICAgIHRoaXMudW5lc2NhcGVTdWZmaXggPSB0aGlzLnVuZXNjYXBlUHJlZml4ID8gJycgOiB1bmVzY2FwZVN1ZmZpeCA/IHJlZ2V4RXNjYXBlKHVuZXNjYXBlU3VmZml4KSA6ICcnO1xuICAgIHRoaXMubmVzdGluZ1ByZWZpeCA9IG5lc3RpbmdQcmVmaXggPyByZWdleEVzY2FwZShuZXN0aW5nUHJlZml4KSA6IG5lc3RpbmdQcmVmaXhFc2NhcGVkIHx8IHJlZ2V4RXNjYXBlKCckdCgnKTtcbiAgICB0aGlzLm5lc3RpbmdTdWZmaXggPSBuZXN0aW5nU3VmZml4ID8gcmVnZXhFc2NhcGUobmVzdGluZ1N1ZmZpeCkgOiBuZXN0aW5nU3VmZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnKScpO1xuICAgIHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPSBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy5tYXhSZXBsYWNlcyA9IG1heFJlcGxhY2VzIHx8IDEwMDA7XG4gICAgdGhpcy5hbHdheXNGb3JtYXQgPSBhbHdheXNGb3JtYXQgIT09IHVuZGVmaW5lZCA/IGFsd2F5c0Zvcm1hdCA6IGZhbHNlO1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgfVxuICByZXNldCgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zKSB0aGlzLmluaXQodGhpcy5vcHRpb25zKTtcbiAgfVxuICByZXNldFJlZ0V4cCgpIHtcbiAgICBjb25zdCBnZXRPclJlc2V0UmVnRXhwID0gKGV4aXN0aW5nUmVnRXhwLCBwYXR0ZXJuKSA9PiB7XG4gICAgICBpZiAoZXhpc3RpbmdSZWdFeHA/LnNvdXJjZSA9PT0gcGF0dGVybikge1xuICAgICAgICBleGlzdGluZ1JlZ0V4cC5sYXN0SW5kZXggPSAwO1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdSZWdFeHA7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChwYXR0ZXJuLCAnZycpO1xuICAgIH07XG4gICAgdGhpcy5yZWdleHAgPSBnZXRPclJlc2V0UmVnRXhwKHRoaXMucmVnZXhwLCBgJHt0aGlzLnByZWZpeH0oLis/KSR7dGhpcy5zdWZmaXh9YCk7XG4gICAgdGhpcy5yZWdleHBVbmVzY2FwZSA9IGdldE9yUmVzZXRSZWdFeHAodGhpcy5yZWdleHBVbmVzY2FwZSwgYCR7dGhpcy5wcmVmaXh9JHt0aGlzLnVuZXNjYXBlUHJlZml4fSguKz8pJHt0aGlzLnVuZXNjYXBlU3VmZml4fSR7dGhpcy5zdWZmaXh9YCk7XG4gICAgdGhpcy5uZXN0aW5nUmVnZXhwID0gZ2V0T3JSZXNldFJlZ0V4cCh0aGlzLm5lc3RpbmdSZWdleHAsIGAke3RoaXMubmVzdGluZ1ByZWZpeH0oKD86W14oKVwiJ10rfFwiW15cIl0qXCJ8J1teJ10qJ3xcXFxcKCg/OlteKCldfFwiW15cIl0qXCJ8J1teJ10qJykqXFxcXCkpKj8pJHt0aGlzLm5lc3RpbmdTdWZmaXh9YCk7XG4gIH1cbiAgaW50ZXJwb2xhdGUoc3RyLCBkYXRhLCBsbmcsIG9wdGlvbnMpIHtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCByZXBsYWNlcztcbiAgICBjb25zdCBkZWZhdWx0RGF0YSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzIHx8IHt9O1xuICAgIGNvbnN0IGhhbmRsZUZvcm1hdCA9IGtleSA9PiB7XG4gICAgICBpZiAoIWtleS5pbmNsdWRlcyh0aGlzLmZvcm1hdFNlcGFyYXRvcikpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGRlZXBGaW5kV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrZXksIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IsIHRoaXMub3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWx3YXlzRm9ybWF0ID8gdGhpcy5mb3JtYXQocGF0aCwgdW5kZWZpbmVkLCBsbmcsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIC4uLmRhdGEsXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbmtleToga2V5XG4gICAgICAgIH0pIDogcGF0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHAgPSBrZXkuc3BsaXQodGhpcy5mb3JtYXRTZXBhcmF0b3IpO1xuICAgICAgY29uc3QgayA9IHAuc2hpZnQoKS50cmltKCk7XG4gICAgICBjb25zdCBmID0gcC5qb2luKHRoaXMuZm9ybWF0U2VwYXJhdG9yKS50cmltKCk7XG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXQoZGVlcEZpbmRXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGssIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IsIHRoaXMub3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlKSwgZiwgbG5nLCB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIC4uLmRhdGEsXG4gICAgICAgIGludGVycG9sYXRpb25rZXk6IGtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgdGhpcy5yZXNldFJlZ0V4cCgpO1xuICAgIGlmICghdGhpcy5lc2NhcGVWYWx1ZSAmJiB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyAmJiAvXFwkdFxcKFteKV0qXFx7W159XSpcXHtcXHsvLnRlc3Qoc3RyKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignbmVzdGluZyBvcHRpb25zIHN0cmluZyBjb250YWlucyBpbnRlcnBvbGF0ZWQgdmFyaWFibGVzIHdpdGggZXNjYXBlVmFsdWU6IGZhbHNlIOKAlCAnICsgJ2lmIGFueSBvZiB0aG9zZSB2YWx1ZXMgYXJlIGF0dGFja2VyLWNvbnRyb2xsZWQgdGhleSBjYW4gaW5qZWN0IGFkZGl0aW9uYWwgJyArICduZXN0aW5nIG9wdGlvbnMgKGUuZy4gcmVkaXJlY3QgbG5nL25zKS4gU2FuaXRpc2UgdW50cnVzdGVkIGlucHV0IGJlZm9yZSBwYXNzaW5nICcgKyAnaXQgdG8gdCgpLCBvciBrZWVwIGVzY2FwZVZhbHVlOiB0cnVlLicpO1xuICAgIH1cbiAgICBjb25zdCBtaXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgPSBvcHRpb25zPy5taXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgfHwgdGhpcy5vcHRpb25zLm1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjtcbiAgICBjb25zdCBza2lwT25WYXJpYWJsZXMgPSBvcHRpb25zPy5pbnRlcnBvbGF0aW9uPy5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgY29uc3QgdG9kb3MgPSBbe1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwVW5lc2NhcGUsXG4gICAgICBzYWZlVmFsdWU6IHZhbCA9PiByZWdleFNhZmUodmFsKVxuICAgIH0sIHtcbiAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cCxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHRoaXMuZXNjYXBlVmFsdWUgPyByZWdleFNhZmUodGhpcy5lc2NhcGUodmFsKSkgOiByZWdleFNhZmUodmFsKVxuICAgIH1dO1xuICAgIHRvZG9zLmZvckVhY2godG9kbyA9PiB7XG4gICAgICByZXBsYWNlcyA9IDA7XG4gICAgICB3aGlsZSAobWF0Y2ggPSB0b2RvLnJlZ2V4LmV4ZWMoc3RyKSkge1xuICAgICAgICBjb25zdCBtYXRjaGVkVmFyID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICB2YWx1ZSA9IGhhbmRsZUZvcm1hdChtYXRjaGVkVmFyKTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcihzdHIsIG1hdGNoLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhbHVlID0gaXNTdHJpbmcodGVtcCkgPyB0ZW1wIDogJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBtYXRjaGVkVmFyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgICAgdmFsdWUgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBtaXNzZWQgdG8gcGFzcyBpbiB2YXJpYWJsZSAke21hdGNoZWRWYXJ9IGZvciBpbnRlcnBvbGF0aW5nICR7c3RyfWApO1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzU3RyaW5nKHZhbHVlKSAmJiAhdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlKSB7XG4gICAgICAgICAgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzYWZlVmFsdWUgPSB0b2RvLnNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCBzYWZlVmFsdWUpO1xuICAgICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggKz0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4IC09IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmVwbGFjZXMrKztcbiAgICAgICAgaWYgKHJlcGxhY2VzID49IHRoaXMubWF4UmVwbGFjZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgbmVzdChzdHIsIGZjLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCBjbG9uZWRPcHRpb25zO1xuICAgIGNvbnN0IGhhbmRsZUhhc09wdGlvbnMgPSAoa2V5LCBpbmhlcml0ZWRPcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBzZXAgPSB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yO1xuICAgICAgaWYgKCFrZXkuaW5jbHVkZXMoc2VwKSkgcmV0dXJuIGtleTtcbiAgICAgIGNvbnN0IGMgPSBrZXkuc3BsaXQobmV3IFJlZ0V4cChgJHtyZWdleEVzY2FwZShzZXApfVsgXSp7YCkpO1xuICAgICAgbGV0IG9wdGlvbnNTdHJpbmcgPSBgeyR7Y1sxXX1gO1xuICAgICAga2V5ID0gY1swXTtcbiAgICAgIG9wdGlvbnNTdHJpbmcgPSB0aGlzLmludGVycG9sYXRlKG9wdGlvbnNTdHJpbmcsIGNsb25lZE9wdGlvbnMpO1xuICAgICAgY29uc3QgbWF0Y2hlZFNpbmdsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goLycvZyk7XG4gICAgICBjb25zdCBtYXRjaGVkRG91YmxlUXVvdGVzID0gb3B0aW9uc1N0cmluZy5tYXRjaCgvXCIvZyk7XG4gICAgICBpZiAoKG1hdGNoZWRTaW5nbGVRdW90ZXM/Lmxlbmd0aCA/PyAwKSAlIDIgPT09IDAgJiYgIW1hdGNoZWREb3VibGVRdW90ZXMgfHwgKG1hdGNoZWREb3VibGVRdW90ZXM/Lmxlbmd0aCA/PyAwKSAlIDIgIT09IDApIHtcbiAgICAgICAgb3B0aW9uc1N0cmluZyA9IG9wdGlvbnNTdHJpbmcucmVwbGFjZSgvJy9nLCAnXCInKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNsb25lZE9wdGlvbnMgPSBKU09OLnBhcnNlKG9wdGlvbnNTdHJpbmcpO1xuICAgICAgICBpZiAoaW5oZXJpdGVkT3B0aW9ucykgY2xvbmVkT3B0aW9ucyA9IHtcbiAgICAgICAgICAuLi5pbmhlcml0ZWRPcHRpb25zLFxuICAgICAgICAgIC4uLmNsb25lZE9wdGlvbnNcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgZmFpbGVkIHBhcnNpbmcgb3B0aW9ucyBzdHJpbmcgaW4gbmVzdGluZyBmb3Iga2V5ICR7a2V5fWAsIGUpO1xuICAgICAgICByZXR1cm4gYCR7a2V5fSR7c2VwfSR7b3B0aW9uc1N0cmluZ31gO1xuICAgICAgfVxuICAgICAgaWYgKGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlICYmIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlLmluY2x1ZGVzKHRoaXMucHJlZml4KSkgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9O1xuICAgIHdoaWxlIChtYXRjaCA9IHRoaXMubmVzdGluZ1JlZ2V4cC5leGVjKHN0cikpIHtcbiAgICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgICBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9O1xuICAgICAgY2xvbmVkT3B0aW9ucyA9IGNsb25lZE9wdGlvbnMucmVwbGFjZSAmJiAhaXNTdHJpbmcoY2xvbmVkT3B0aW9ucy5yZXBsYWNlKSA/IGNsb25lZE9wdGlvbnMucmVwbGFjZSA6IGNsb25lZE9wdGlvbnM7XG4gICAgICBjbG9uZWRPcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciA9IGZhbHNlO1xuICAgICAgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgY29uc3Qga2V5RW5kSW5kZXggPSAvey4qfS8udGVzdChtYXRjaFsxXSkgPyBtYXRjaFsxXS5sYXN0SW5kZXhPZignfScpICsgMSA6IG1hdGNoWzFdLmluZGV4T2YodGhpcy5mb3JtYXRTZXBhcmF0b3IpO1xuICAgICAgaWYgKGtleUVuZEluZGV4ICE9PSAtMSkge1xuICAgICAgICBmb3JtYXR0ZXJzID0gbWF0Y2hbMV0uc2xpY2Uoa2V5RW5kSW5kZXgpLnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKS5tYXAoZWxlbSA9PiBlbGVtLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnNsaWNlKDAsIGtleUVuZEluZGV4KTtcbiAgICAgIH1cbiAgICAgIHZhbHVlID0gZmMoaGFuZGxlSGFzT3B0aW9ucy5jYWxsKHRoaXMsIG1hdGNoWzFdLnRyaW0oKSwgY2xvbmVkT3B0aW9ucyksIGNsb25lZE9wdGlvbnMpO1xuICAgICAgaWYgKHZhbHVlICYmIG1hdGNoWzBdID09PSBzdHIgJiYgIWlzU3RyaW5nKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYG1pc3NlZCB0byByZXNvbHZlICR7bWF0Y2hbMV19IGZvciBuZXN0aW5nICR7c3RyfWApO1xuICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKGZvcm1hdHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHZhbHVlID0gZm9ybWF0dGVycy5yZWR1Y2UoKHYsIGYpID0+IHRoaXMuZm9ybWF0KHYsIGYsIG9wdGlvbnMubG5nLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBtYXRjaFsxXS50cmltKClcbiAgICAgICAgfSksIHZhbHVlLnRyaW0oKSk7XG4gICAgICB9XG4gICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgdmFsdWUpO1xuICAgICAgdGhpcy5yZWdleHAubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5jb25zdCBwYXJzZUZvcm1hdFN0ciA9IGZvcm1hdFN0ciA9PiB7XG4gIGxldCBmb3JtYXROYW1lID0gZm9ybWF0U3RyLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICBjb25zdCBmb3JtYXRPcHRpb25zID0ge307XG4gIGlmIChmb3JtYXRTdHIuaW5jbHVkZXMoJygnKSkge1xuICAgIGNvbnN0IHAgPSBmb3JtYXRTdHIuc3BsaXQoJygnKTtcbiAgICBmb3JtYXROYW1lID0gcFswXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBjb25zdCBvcHRTdHIgPSBwWzFdLnNsaWNlKDAsIC0xKTtcbiAgICBpZiAoZm9ybWF0TmFtZSA9PT0gJ2N1cnJlbmN5JyAmJiAhb3B0U3RyLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSkgZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXROYW1lID09PSAncmVsYXRpdmV0aW1lJyAmJiAhb3B0U3RyLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5yYW5nZSkgZm9ybWF0T3B0aW9ucy5yYW5nZSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG9wdHMgPSBvcHRTdHIuc3BsaXQoJzsnKTtcbiAgICAgIG9wdHMuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICBpZiAob3B0KSB7XG4gICAgICAgICAgY29uc3QgW2tleSwgLi4ucmVzdF0gPSBvcHQuc3BsaXQoJzonKTtcbiAgICAgICAgICBjb25zdCB2YWwgPSByZXN0LmpvaW4oJzonKS50cmltKCkucmVwbGFjZSgvXicrfCcrJC9nLCAnJyk7XG4gICAgICAgICAgY29uc3QgdHJpbW1lZEtleSA9IGtleS50cmltKCk7XG4gICAgICAgICAgaWYgKCFmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldKSBmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldID0gdmFsO1xuICAgICAgICAgIGlmICh2YWwgPT09ICdmYWxzZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSBmYWxzZTtcbiAgICAgICAgICBpZiAodmFsID09PSAndHJ1ZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSB0cnVlO1xuICAgICAgICAgIGlmICghaXNOYU4odmFsKSkgZm9ybWF0T3B0aW9uc1t0cmltbWVkS2V5XSA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBmb3JtYXROYW1lLFxuICAgIGZvcm1hdE9wdGlvbnNcbiAgfTtcbn07XG5jb25zdCBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIgPSBmbiA9PiB7XG4gIGNvbnN0IGNhY2hlID0ge307XG4gIHJldHVybiAodiwgbCwgbykgPT4ge1xuICAgIGxldCBvcHRGb3JDYWNoZSA9IG87XG4gICAgaWYgKG8gJiYgby5pbnRlcnBvbGF0aW9ua2V5ICYmIG8uZm9ybWF0UGFyYW1zICYmIG8uZm9ybWF0UGFyYW1zW28uaW50ZXJwb2xhdGlvbmtleV0gJiYgb1tvLmludGVycG9sYXRpb25rZXldKSB7XG4gICAgICBvcHRGb3JDYWNoZSA9IHtcbiAgICAgICAgLi4ub3B0Rm9yQ2FjaGUsXG4gICAgICAgIFtvLmludGVycG9sYXRpb25rZXldOiB1bmRlZmluZWRcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IGwgKyBKU09OLnN0cmluZ2lmeShvcHRGb3JDYWNoZSk7XG4gICAgbGV0IGZybSA9IGNhY2hlW2tleV07XG4gICAgaWYgKCFmcm0pIHtcbiAgICAgIGZybSA9IGZuKGdldENsZWFuZWRDb2RlKGwpLCBvKTtcbiAgICAgIGNhY2hlW2tleV0gPSBmcm07XG4gICAgfVxuICAgIHJldHVybiBmcm0odik7XG4gIH07XG59O1xuY29uc3QgY3JlYXRlTm9uQ2FjaGVkRm9ybWF0dGVyID0gZm4gPT4gKHYsIGwsIG8pID0+IGZuKGdldENsZWFuZWRDb2RlKGwpLCBvKSh2KTtcbmNsYXNzIEZvcm1hdHRlciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2Zvcm1hdHRlcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5pbml0KG9wdGlvbnMpO1xuICB9XG4gIGluaXQoc2VydmljZXMsIG9wdGlvbnMgPSB7XG4gICAgaW50ZXJwb2xhdGlvbjoge31cbiAgfSkge1xuICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gICAgY29uc3QgY2YgPSBvcHRpb25zLmNhY2hlSW5CdWlsdEZvcm1hdHMgPyBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIgOiBjcmVhdGVOb25DYWNoZWRGb3JtYXR0ZXI7XG4gICAgdGhpcy5mb3JtYXRzID0ge1xuICAgICAgbnVtYmVyOiBjZigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIGN1cnJlbmN5OiBjZigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdCxcbiAgICAgICAgICBzdHlsZTogJ2N1cnJlbmN5J1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIGRhdGV0aW1lOiBjZigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgcmVsYXRpdmV0aW1lOiBjZigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCwgb3B0LnJhbmdlIHx8ICdkYXknKTtcbiAgICAgIH0pLFxuICAgICAgbGlzdDogY2YoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLkxpc3RGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pXG4gICAgfTtcbiAgfVxuICBhZGQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBmYztcbiAgfVxuICBhZGRDYWNoZWQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoZmMpO1xuICB9XG4gIGZvcm1hdCh2YWx1ZSwgZm9ybWF0LCBsbmcsIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghZm9ybWF0KSByZXR1cm4gdmFsdWU7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiB2YWx1ZTtcbiAgICBjb25zdCBmb3JtYXRzID0gZm9ybWF0LnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICBpZiAoZm9ybWF0cy5sZW5ndGggPiAxICYmIGZvcm1hdHNbMF0uaW5kZXhPZignKCcpID4gMSAmJiAhZm9ybWF0c1swXS5pbmNsdWRlcygnKScpICYmIGZvcm1hdHMuZmluZChmID0+IGYuaW5jbHVkZXMoJyknKSkpIHtcbiAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGZvcm1hdHMuZmluZEluZGV4KGYgPT4gZi5pbmNsdWRlcygnKScpKTtcbiAgICAgIGZvcm1hdHNbMF0gPSBbZm9ybWF0c1swXSwgLi4uZm9ybWF0cy5zcGxpY2UoMSwgbGFzdEluZGV4KV0uam9pbih0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGZvcm1hdHMucmVkdWNlKChtZW0sIGYpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZm9ybWF0TmFtZSxcbiAgICAgICAgZm9ybWF0T3B0aW9uc1xuICAgICAgfSA9IHBhcnNlRm9ybWF0U3RyKGYpO1xuICAgICAgaWYgKHRoaXMuZm9ybWF0c1tmb3JtYXROYW1lXSkge1xuICAgICAgICBsZXQgZm9ybWF0dGVkID0gbWVtO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHZhbE9wdGlvbnMgPSBvcHRpb25zPy5mb3JtYXRQYXJhbXM/LltvcHRpb25zLmludGVycG9sYXRpb25rZXldIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGwgPSB2YWxPcHRpb25zLmxvY2FsZSB8fCB2YWxPcHRpb25zLmxuZyB8fCBvcHRpb25zLmxvY2FsZSB8fCBvcHRpb25zLmxuZyB8fCBsbmc7XG4gICAgICAgICAgZm9ybWF0dGVkID0gdGhpcy5mb3JtYXRzW2Zvcm1hdE5hbWVdKG1lbSwgbCwge1xuICAgICAgICAgICAgLi4uZm9ybWF0T3B0aW9ucyxcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICAuLi52YWxPcHRpb25zXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYHRoZXJlIHdhcyBubyBmb3JtYXQgZnVuY3Rpb24gZm9yICR7Zm9ybWF0TmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZW07XG4gICAgfSwgdmFsdWUpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuY29uc3QgcmVtb3ZlUGVuZGluZyA9IChxLCBuYW1lKSA9PiB7XG4gIGlmIChxLnBlbmRpbmdbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgIGRlbGV0ZSBxLnBlbmRpbmdbbmFtZV07XG4gICAgcS5wZW5kaW5nQ291bnQtLTtcbiAgfVxufTtcbmNsYXNzIENvbm5lY3RvciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGJhY2tlbmQsIHN0b3JlLCBzZXJ2aWNlcywgb3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmJhY2tlbmQgPSBiYWNrZW5kO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gc2VydmljZXMubGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2JhY2tlbmRDb25uZWN0b3InKTtcbiAgICB0aGlzLndhaXRpbmdSZWFkcyA9IFtdO1xuICAgIHRoaXMubWF4UGFyYWxsZWxSZWFkcyA9IG9wdGlvbnMubWF4UGFyYWxsZWxSZWFkcyB8fCAxMDtcbiAgICB0aGlzLnJlYWRpbmdDYWxscyA9IDA7XG4gICAgdGhpcy5tYXhSZXRyaWVzID0gb3B0aW9ucy5tYXhSZXRyaWVzID49IDAgPyBvcHRpb25zLm1heFJldHJpZXMgOiA1O1xuICAgIHRoaXMucmV0cnlUaW1lb3V0ID0gb3B0aW9ucy5yZXRyeVRpbWVvdXQgPj0gMSA/IG9wdGlvbnMucmV0cnlUaW1lb3V0IDogMzUwO1xuICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgdGhpcy5iYWNrZW5kPy5pbml0Py4oc2VydmljZXMsIG9wdGlvbnMuYmFja2VuZCwgb3B0aW9ucyk7XG4gIH1cbiAgcXVldWVMb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBjb25zdCB0b0xvYWQgPSB7fTtcbiAgICBjb25zdCBwZW5kaW5nID0ge307XG4gICAgY29uc3QgdG9Mb2FkTGFuZ3VhZ2VzID0ge307XG4gICAgY29uc3QgdG9Mb2FkTmFtZXNwYWNlcyA9IHt9O1xuICAgIGxhbmd1YWdlcy5mb3JFYWNoKGxuZyA9PiB7XG4gICAgICBsZXQgaGFzQWxsTmFtZXNwYWNlcyA9IHRydWU7XG4gICAgICBuYW1lc3BhY2VzLmZvckVhY2gobnMgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gYCR7bG5nfXwke25zfWA7XG4gICAgICAgIGlmICghb3B0aW9ucy5yZWxvYWQgJiYgdGhpcy5zdG9yZS5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGVbbmFtZV0gPCAwKSA7IGVsc2UgaWYgKHRoaXMuc3RhdGVbbmFtZV0gPT09IDEpIHtcbiAgICAgICAgICBpZiAocGVuZGluZ1tuYW1lXSA9PT0gdW5kZWZpbmVkKSBwZW5kaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0YXRlW25hbWVdID0gMTtcbiAgICAgICAgICBoYXNBbGxOYW1lc3BhY2VzID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHBlbmRpbmdbbmFtZV0gPT09IHVuZGVmaW5lZCkgcGVuZGluZ1tuYW1lXSA9IHRydWU7XG4gICAgICAgICAgaWYgKHRvTG9hZFtuYW1lXSA9PT0gdW5kZWZpbmVkKSB0b0xvYWRbbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIGlmICh0b0xvYWROYW1lc3BhY2VzW25zXSA9PT0gdW5kZWZpbmVkKSB0b0xvYWROYW1lc3BhY2VzW25zXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCFoYXNBbGxOYW1lc3BhY2VzKSB0b0xvYWRMYW5ndWFnZXNbbG5nXSA9IHRydWU7XG4gICAgfSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHRvTG9hZCkubGVuZ3RoIHx8IE9iamVjdC5rZXlzKHBlbmRpbmcpLmxlbmd0aCkge1xuICAgICAgdGhpcy5xdWV1ZS5wdXNoKHtcbiAgICAgICAgcGVuZGluZyxcbiAgICAgICAgcGVuZGluZ0NvdW50OiBPYmplY3Qua2V5cyhwZW5kaW5nKS5sZW5ndGgsXG4gICAgICAgIGxvYWRlZDoge30sXG4gICAgICAgIGVycm9yczogW10sXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvTG9hZDogT2JqZWN0LmtleXModG9Mb2FkKSxcbiAgICAgIHBlbmRpbmc6IE9iamVjdC5rZXlzKHBlbmRpbmcpLFxuICAgICAgdG9Mb2FkTGFuZ3VhZ2VzOiBPYmplY3Qua2V5cyh0b0xvYWRMYW5ndWFnZXMpLFxuICAgICAgdG9Mb2FkTmFtZXNwYWNlczogT2JqZWN0LmtleXModG9Mb2FkTmFtZXNwYWNlcylcbiAgICB9O1xuICB9XG4gIGxvYWRlZChuYW1lLCBlcnIsIGRhdGEpIHtcbiAgICBjb25zdCBzID0gbmFtZS5zcGxpdCgnfCcpO1xuICAgIGNvbnN0IGxuZyA9IHNbMF07XG4gICAgY29uc3QgbnMgPSBzWzFdO1xuICAgIGlmIChlcnIpIHRoaXMuZW1pdCgnZmFpbGVkTG9hZGluZycsIGxuZywgbnMsIGVycik7XG4gICAgaWYgKCFlcnIgJiYgZGF0YSkge1xuICAgICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCBkYXRhLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwge1xuICAgICAgICBza2lwQ29weTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGVbbmFtZV0gPSBlcnIgPyAtMSA6IDI7XG4gICAgaWYgKGVyciAmJiBkYXRhKSB0aGlzLnN0YXRlW25hbWVdID0gMDtcbiAgICBjb25zdCBsb2FkZWQgPSB7fTtcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2gocSA9PiB7XG4gICAgICBwdXNoUGF0aChxLmxvYWRlZCwgW2xuZ10sIG5zKTtcbiAgICAgIHJlbW92ZVBlbmRpbmcocSwgbmFtZSk7XG4gICAgICBpZiAoZXJyKSBxLmVycm9ycy5wdXNoKGVycik7XG4gICAgICBpZiAocS5wZW5kaW5nQ291bnQgPT09IDAgJiYgIXEuZG9uZSkge1xuICAgICAgICBPYmplY3Qua2V5cyhxLmxvYWRlZCkuZm9yRWFjaChsID0+IHtcbiAgICAgICAgICBpZiAoIWxvYWRlZFtsXSkgbG9hZGVkW2xdID0ge307XG4gICAgICAgICAgY29uc3QgbG9hZGVkS2V5cyA9IHEubG9hZGVkW2xdO1xuICAgICAgICAgIGlmIChsb2FkZWRLZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgbG9hZGVkS2V5cy5mb3JFYWNoKG4gPT4ge1xuICAgICAgICAgICAgICBpZiAobG9hZGVkW2xdW25dID09PSB1bmRlZmluZWQpIGxvYWRlZFtsXVtuXSA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxLmRvbmUgPSB0cnVlO1xuICAgICAgICBpZiAocS5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcS5jYWxsYmFjayhxLmVycm9ycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcS5jYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5lbWl0KCdsb2FkZWQnLCBsb2FkZWQpO1xuICAgIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLmZpbHRlcihxID0+ICFxLmRvbmUpO1xuICB9XG4gIHJlYWQobG5nLCBucywgZmNOYW1lLCB0cmllZCA9IDAsIHdhaXQgPSB0aGlzLnJldHJ5VGltZW91dCwgY2FsbGJhY2spIHtcbiAgICBpZiAoIWxuZy5sZW5ndGgpIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSk7XG4gICAgaWYgKHRoaXMucmVhZGluZ0NhbGxzID49IHRoaXMubWF4UGFyYWxsZWxSZWFkcykge1xuICAgICAgdGhpcy53YWl0aW5nUmVhZHMucHVzaCh7XG4gICAgICAgIGxuZyxcbiAgICAgICAgbnMsXG4gICAgICAgIGZjTmFtZSxcbiAgICAgICAgdHJpZWQsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMrKztcbiAgICBjb25zdCByZXNvbHZlciA9IChlcnIsIGRhdGEpID0+IHtcbiAgICAgIHRoaXMucmVhZGluZ0NhbGxzLS07XG4gICAgICBpZiAodGhpcy53YWl0aW5nUmVhZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gdGhpcy53YWl0aW5nUmVhZHMuc2hpZnQoKTtcbiAgICAgICAgdGhpcy5yZWFkKG5leHQubG5nLCBuZXh0Lm5zLCBuZXh0LmZjTmFtZSwgbmV4dC50cmllZCwgbmV4dC53YWl0LCBuZXh0LmNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIGlmIChlcnIgJiYgZGF0YSAmJiB0cmllZCA8IHRoaXMubWF4UmV0cmllcykge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnJlYWQobG5nLCBucywgZmNOYW1lLCB0cmllZCArIDEsIHdhaXQgKiAyLCBjYWxsYmFjayk7XG4gICAgICAgIH0sIHdhaXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhlcnIsIGRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZmMgPSB0aGlzLmJhY2tlbmRbZmNOYW1lXS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgaWYgKGZjLmxlbmd0aCA9PT0gMikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgciA9IGZjKGxuZywgbnMpO1xuICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgci50aGVuKGRhdGEgPT4gcmVzb2x2ZXIobnVsbCwgZGF0YSkpLmNhdGNoKHJlc29sdmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlcihudWxsLCByKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc29sdmVyKGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmYyhsbmcsIG5zLCByZXNvbHZlcik7XG4gIH1cbiAgcHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zID0ge30sIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLmJhY2tlbmQpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ05vIGJhY2tlbmQgd2FzIGFkZGVkIHZpYSBpMThuZXh0LnVzZS4gV2lsbCBub3QgbG9hZCByZXNvdXJjZXMuJyk7XG4gICAgICByZXR1cm4gY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgaWYgKGlzU3RyaW5nKGxhbmd1YWdlcykpIGxhbmd1YWdlcyA9IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobGFuZ3VhZ2VzKTtcbiAgICBpZiAoaXNTdHJpbmcobmFtZXNwYWNlcykpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgY29uc3QgdG9Mb2FkID0gdGhpcy5xdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgaWYgKCF0b0xvYWQudG9Mb2FkLmxlbmd0aCkge1xuICAgICAgaWYgKCF0b0xvYWQucGVuZGluZy5sZW5ndGgpIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdG9Mb2FkLnRvTG9hZC5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgdGhpcy5sb2FkT25lKG5hbWUpO1xuICAgIH0pO1xuICB9XG4gIGxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7fSwgY2FsbGJhY2spO1xuICB9XG4gIHJlbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHtcbiAgICAgIHJlbG9hZDogdHJ1ZVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfVxuICBsb2FkT25lKG5hbWUsIHByZWZpeCA9ICcnKSB7XG4gICAgY29uc3QgcyA9IG5hbWUuc3BsaXQoJ3wnKTtcbiAgICBjb25zdCBsbmcgPSBzWzBdO1xuICAgIGNvbnN0IG5zID0gc1sxXTtcbiAgICB0aGlzLnJlYWQobG5nLCBucywgJ3JlYWQnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGVycikgdGhpcy5sb2dnZXIud2FybihgJHtwcmVmaXh9bG9hZGluZyBuYW1lc3BhY2UgJHtuc30gZm9yIGxhbmd1YWdlICR7bG5nfSBmYWlsZWRgLCBlcnIpO1xuICAgICAgaWYgKCFlcnIgJiYgZGF0YSkgdGhpcy5sb2dnZXIubG9nKGAke3ByZWZpeH1sb2FkZWQgbmFtZXNwYWNlICR7bnN9IGZvciBsYW5ndWFnZSAke2xuZ31gLCBkYXRhKTtcbiAgICAgIHRoaXMubG9hZGVkKG5hbWUsIGVyciwgZGF0YSk7XG4gICAgfSk7XG4gIH1cbiAgc2F2ZU1pc3NpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgaXNVcGRhdGUsIG9wdGlvbnMgPSB7fSwgY2xiID0gKCkgPT4ge30pIHtcbiAgICBpZiAodGhpcy5zZXJ2aWNlcz8udXRpbHM/Lmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy5zZXJ2aWNlcz8udXRpbHM/Lmhhc0xvYWRlZE5hbWVzcGFjZShuYW1lc3BhY2UpKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBkaWQgbm90IHNhdmUga2V5IFwiJHtrZXl9XCIgYXMgdGhlIG5hbWVzcGFjZSBcIiR7bmFtZXNwYWNlfVwiIHdhcyBub3QgeWV0IGxvYWRlZGAsICdUaGlzIG1lYW5zIHNvbWV0aGluZyBJUyBXUk9ORyBpbiB5b3VyIHNldHVwLiBZb3UgYWNjZXNzIHRoZSB0IGZ1bmN0aW9uIGJlZm9yZSBpMThuZXh0LmluaXQgLyBpMThuZXh0LmxvYWROYW1lc3BhY2UgLyBpMThuZXh0LmNoYW5nZUxhbmd1YWdlIHdhcyBkb25lLiBXYWl0IGZvciB0aGUgY2FsbGJhY2sgb3IgUHJvbWlzZSB0byByZXNvbHZlIGJlZm9yZSBhY2Nlc3NpbmcgaXQhISEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkIHx8IGtleSA9PT0gbnVsbCB8fCBrZXkgPT09ICcnKSByZXR1cm47XG4gICAgaWYgKHRoaXMuYmFja2VuZD8uY3JlYXRlKSB7XG4gICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBpc1VwZGF0ZVxuICAgICAgfTtcbiAgICAgIGNvbnN0IGZjID0gdGhpcy5iYWNrZW5kLmNyZWF0ZS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgICBpZiAoZmMubGVuZ3RoIDwgNikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxldCByO1xuICAgICAgICAgIGlmIChmYy5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBvcHRzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgciA9IGZjKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByLnRoZW4oZGF0YSA9PiBjbGIobnVsbCwgZGF0YSkpLmNhdGNoKGNsYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsYihudWxsLCByKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNsYihlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBjbGIsIG9wdHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWxhbmd1YWdlcyB8fCAhbGFuZ3VhZ2VzWzBdKSByZXR1cm47XG4gICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZShsYW5ndWFnZXNbMF0sIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgfVxufVxuXG5jb25zdCBnZXQgPSAoKSA9PiAoe1xuICBkZWJ1ZzogZmFsc2UsXG4gIGluaXRBc3luYzogdHJ1ZSxcbiAgbnM6IFsndHJhbnNsYXRpb24nXSxcbiAgZGVmYXVsdE5TOiBbJ3RyYW5zbGF0aW9uJ10sXG4gIGZhbGxiYWNrTG5nOiBbJ2RldiddLFxuICBmYWxsYmFja05TOiBmYWxzZSxcbiAgc3VwcG9ydGVkTG5nczogZmFsc2UsXG4gIG5vbkV4cGxpY2l0U3VwcG9ydGVkTG5nczogZmFsc2UsXG4gIGxvYWQ6ICdhbGwnLFxuICBwcmVsb2FkOiBmYWxzZSxcbiAga2V5U2VwYXJhdG9yOiAnLicsXG4gIG5zU2VwYXJhdG9yOiAnOicsXG4gIHBsdXJhbFNlcGFyYXRvcjogJ18nLFxuICBjb250ZXh0U2VwYXJhdG9yOiAnXycsXG4gIGVuYWJsZVNlbGVjdG9yOiBmYWxzZSxcbiAgcGFydGlhbEJ1bmRsZWRMYW5ndWFnZXM6IGZhbHNlLFxuICBzYXZlTWlzc2luZzogZmFsc2UsXG4gIHVwZGF0ZU1pc3Npbmc6IGZhbHNlLFxuICBzYXZlTWlzc2luZ1RvOiAnZmFsbGJhY2snLFxuICBzYXZlTWlzc2luZ1BsdXJhbHM6IHRydWUsXG4gIG1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyOiBmYWxzZSxcbiAgcG9zdFByb2Nlc3M6IGZhbHNlLFxuICBwb3N0UHJvY2Vzc1Bhc3NSZXNvbHZlZDogZmFsc2UsXG4gIHJldHVybk51bGw6IGZhbHNlLFxuICByZXR1cm5FbXB0eVN0cmluZzogdHJ1ZSxcbiAgcmV0dXJuT2JqZWN0czogZmFsc2UsXG4gIGpvaW5BcnJheXM6IGZhbHNlLFxuICByZXR1cm5lZE9iamVjdEhhbmRsZXI6IGZhbHNlLFxuICBwYXJzZU1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5OiBmYWxzZSxcbiAgYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU6IGZhbHNlLFxuICBvdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcjogYXJncyA9PiB7XG4gICAgbGV0IHJldCA9IHt9O1xuICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ29iamVjdCcpIHJldCA9IGFyZ3NbMV07XG4gICAgaWYgKGlzU3RyaW5nKGFyZ3NbMV0pKSByZXQuZGVmYXVsdFZhbHVlID0gYXJnc1sxXTtcbiAgICBpZiAoaXNTdHJpbmcoYXJnc1syXSkpIHJldC50RGVzY3JpcHRpb24gPSBhcmdzWzJdO1xuICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGFyZ3NbM10gPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gYXJnc1szXSB8fCBhcmdzWzJdO1xuICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICByZXRba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgZXNjYXBlVmFsdWU6IHRydWUsXG4gICAgcHJlZml4OiAne3snLFxuICAgIHN1ZmZpeDogJ319JyxcbiAgICBmb3JtYXRTZXBhcmF0b3I6ICcsJyxcbiAgICB1bmVzY2FwZVByZWZpeDogJy0nLFxuICAgIG5lc3RpbmdQcmVmaXg6ICckdCgnLFxuICAgIG5lc3RpbmdTdWZmaXg6ICcpJyxcbiAgICBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvcjogJywnLFxuICAgIG1heFJlcGxhY2VzOiAxMDAwLFxuICAgIHNraXBPblZhcmlhYmxlczogdHJ1ZVxuICB9LFxuICBjYWNoZUluQnVpbHRGb3JtYXRzOiB0cnVlXG59KTtcbmNvbnN0IHRyYW5zZm9ybU9wdGlvbnMgPSBvcHRpb25zID0+IHtcbiAgaWYgKGlzU3RyaW5nKG9wdGlvbnMubnMpKSBvcHRpb25zLm5zID0gW29wdGlvbnMubnNdO1xuICBpZiAoaXNTdHJpbmcob3B0aW9ucy5mYWxsYmFja0xuZykpIG9wdGlvbnMuZmFsbGJhY2tMbmcgPSBbb3B0aW9ucy5mYWxsYmFja0xuZ107XG4gIGlmIChpc1N0cmluZyhvcHRpb25zLmZhbGxiYWNrTlMpKSBvcHRpb25zLmZhbGxiYWNrTlMgPSBbb3B0aW9ucy5mYWxsYmFja05TXTtcbiAgaWYgKG9wdGlvbnMuc3VwcG9ydGVkTG5ncyAmJiAhb3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmluY2x1ZGVzKCdjaW1vZGUnKSkge1xuICAgIG9wdGlvbnMuc3VwcG9ydGVkTG5ncyA9IG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5jb25jYXQoWydjaW1vZGUnXSk7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnM7XG59O1xuXG5jb25zdCBub29wID0gKCkgPT4ge307XG5jb25zdCBiaW5kTWVtYmVyRnVuY3Rpb25zID0gaW5zdCA9PiB7XG4gIGNvbnN0IG1lbXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdCkpO1xuICBtZW1zLmZvckVhY2gobWVtID0+IHtcbiAgICBpZiAodHlwZW9mIGluc3RbbWVtXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaW5zdFttZW1dID0gaW5zdFttZW1dLmJpbmQoaW5zdCk7XG4gICAgfVxuICB9KTtcbn07XG5jbGFzcyBJMThuIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9LCBjYWxsYmFjaykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLnNlcnZpY2VzID0ge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgIHRoaXMubW9kdWxlcyA9IHtcbiAgICAgIGV4dGVybmFsOiBbXVxuICAgIH07XG4gICAgYmluZE1lbWJlckZ1bmN0aW9ucyh0aGlzKTtcbiAgICBpZiAoY2FsbGJhY2sgJiYgIXRoaXMuaXNJbml0aWFsaXplZCAmJiAhb3B0aW9ucy5pc0Nsb25lKSB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbml0QXN5bmMpIHtcbiAgICAgICAgdGhpcy5pbml0KG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5pbml0KG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfVxuICBpbml0KG9wdGlvbnMgPSB7fSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmlzSW5pdGlhbGl6aW5nID0gdHJ1ZTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZGVmYXVsdE5TID09IG51bGwgJiYgb3B0aW9ucy5ucykge1xuICAgICAgaWYgKGlzU3RyaW5nKG9wdGlvbnMubnMpKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE5TID0gb3B0aW9ucy5ucztcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMubnMuaW5jbHVkZXMoJ3RyYW5zbGF0aW9uJykpIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TlMgPSBvcHRpb25zLm5zWzBdO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWZPcHRzID0gZ2V0KCk7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uZGVmT3B0cyxcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLnRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucylcbiAgICB9O1xuICAgIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgLi4uZGVmT3B0cy5pbnRlcnBvbGF0aW9uLFxuICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb25cbiAgICB9O1xuICAgIGlmIChvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlckRlZmluZWRLZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkTnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyID0gZGVmT3B0cy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcjtcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlQ2xhc3NPbkRlbWFuZCA9IENsYXNzT3JPYmplY3QgPT4ge1xuICAgICAgaWYgKCFDbGFzc09yT2JqZWN0KSByZXR1cm4gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgQ2xhc3NPck9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG5ldyBDbGFzc09yT2JqZWN0KCk7XG4gICAgICByZXR1cm4gQ2xhc3NPck9iamVjdDtcbiAgICB9O1xuICAgIGlmICghdGhpcy5vcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubG9nZ2VyKSB7XG4gICAgICAgIGJhc2VMb2dnZXIuaW5pdChjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sb2dnZXIpLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KG51bGwsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBsZXQgZm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gdGhpcy5tb2R1bGVzLmZvcm1hdHRlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcm1hdHRlciA9IEZvcm1hdHRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGx1ID0gbmV3IExhbmd1YWdlVXRpbCh0aGlzLm9wdGlvbnMpO1xuICAgICAgdGhpcy5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBjb25zdCBzID0gdGhpcy5zZXJ2aWNlcztcbiAgICAgIHMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICAgIHMucmVzb3VyY2VTdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICBzLmxhbmd1YWdlVXRpbHMgPSBsdTtcbiAgICAgIHMucGx1cmFsUmVzb2x2ZXIgPSBuZXcgUGx1cmFsUmVzb2x2ZXIobHUsIHtcbiAgICAgICAgcHJlcGVuZDogdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvclxuICAgICAgfSk7XG4gICAgICBpZiAoZm9ybWF0dGVyKSB7XG4gICAgICAgIHMuZm9ybWF0dGVyID0gY3JlYXRlQ2xhc3NPbkRlbWFuZChmb3JtYXR0ZXIpO1xuICAgICAgICBpZiAocy5mb3JtYXR0ZXIuaW5pdCkgcy5mb3JtYXR0ZXIuaW5pdChzLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgPSBzLmZvcm1hdHRlci5mb3JtYXQuYmluZChzLmZvcm1hdHRlcik7XG4gICAgICB9XG4gICAgICBzLmludGVycG9sYXRvciA9IG5ldyBJbnRlcnBvbGF0b3IodGhpcy5vcHRpb25zKTtcbiAgICAgIHMudXRpbHMgPSB7XG4gICAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogdGhpcy5oYXNMb2FkZWROYW1lc3BhY2UuYmluZCh0aGlzKVxuICAgICAgfTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3RvciA9IG5ldyBDb25uZWN0b3IoY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMuYmFja2VuZCksIHMucmVzb3VyY2VTdG9yZSwgcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3Rvci5vbignKicsIChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpIHtcbiAgICAgICAgcy5sYW5ndWFnZURldGVjdG9yID0gY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcik7XG4gICAgICAgIGlmIChzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdCkgcy5sYW5ndWFnZURldGVjdG9yLmluaXQocywgdGhpcy5vcHRpb25zLmRldGVjdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCkge1xuICAgICAgICBzLmkxOG5Gb3JtYXQgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KTtcbiAgICAgICAgaWYgKHMuaTE4bkZvcm1hdC5pbml0KSBzLmkxOG5Gb3JtYXQuaW5pdCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKHRoaXMuc2VydmljZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnRyYW5zbGF0b3Iub24oJyonLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLmZvckVhY2gobSA9PiB7XG4gICAgICAgIGlmIChtLmluaXQpIG0uaW5pdCh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmZvcm1hdCA9IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdDtcbiAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyAmJiAhdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLm9wdGlvbnMubG5nKSB7XG4gICAgICBjb25zdCBjb2RlcyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICBpZiAoY29kZXMubGVuZ3RoID4gMCAmJiBjb2Rlc1swXSAhPT0gJ2RldicpIHRoaXMub3B0aW9ucy5sbmcgPSBjb2Rlc1swXTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMub3B0aW9ucy5sbmcpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2luaXQ6IG5vIGxhbmd1YWdlRGV0ZWN0b3IgaXMgdXNlZCBhbmQgbm8gbG5nIGlzIGRlZmluZWQnKTtcbiAgICB9XG4gICAgY29uc3Qgc3RvcmVBcGkgPSBbJ2dldFJlc291cmNlJywgJ2hhc1Jlc291cmNlQnVuZGxlJywgJ2dldFJlc291cmNlQnVuZGxlJywgJ2dldERhdGFCeUxhbmd1YWdlJ107XG4gICAgc3RvcmVBcGkuZm9yRWFjaChmY05hbWUgPT4ge1xuICAgICAgdGhpc1tmY05hbWVdID0gKC4uLmFyZ3MpID0+IHRoaXMuc3RvcmVbZmNOYW1lXSguLi5hcmdzKTtcbiAgICB9KTtcbiAgICBjb25zdCBzdG9yZUFwaUNoYWluZWQgPSBbJ2FkZFJlc291cmNlJywgJ2FkZFJlc291cmNlcycsICdhZGRSZXNvdXJjZUJ1bmRsZScsICdyZW1vdmVSZXNvdXJjZUJ1bmRsZSddO1xuICAgIHN0b3JlQXBpQ2hhaW5lZC5mb3JFYWNoKGZjTmFtZSA9PiB7XG4gICAgICB0aGlzW2ZjTmFtZV0gPSAoLi4uYXJncykgPT4ge1xuICAgICAgICB0aGlzLnN0b3JlW2ZjTmFtZV0oLi4uYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfTtcbiAgICB9KTtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgY29uc3QgbG9hZCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbmlzaCA9IChlcnIsIHQpID0+IHtcbiAgICAgICAgdGhpcy5pc0luaXRpYWxpemluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkICYmICF0aGlzLmluaXRpYWxpemVkU3RvcmVPbmNlKSB0aGlzLmxvZ2dlci53YXJuKCdpbml0OiBpMThuZXh0IGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQuIFlvdSBzaG91bGQgY2FsbCBpbml0IGp1c3Qgb25jZSEnKTtcbiAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuaXNDbG9uZSkgdGhpcy5sb2dnZXIubG9nKCdpbml0aWFsaXplZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZW1pdCgnaW5pdGlhbGl6ZWQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHQpO1xuICAgICAgICBjYWxsYmFjayhlcnIsIHQpO1xuICAgICAgfTtcbiAgICAgIGlmICgodGhpcy5sYW5ndWFnZXMgfHwgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbykgJiYgIXRoaXMuaXNJbml0aWFsaXplZCkgcmV0dXJuIGZpbmlzaChudWxsLCB0aGlzLnQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmNoYW5nZUxhbmd1YWdlKHRoaXMub3B0aW9ucy5sbmcsIGZpbmlzaCk7XG4gICAgfTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc291cmNlcyB8fCAhdGhpcy5vcHRpb25zLmluaXRBc3luYykge1xuICAgICAgbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGxvYWQsIDApO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgbG9hZFJlc291cmNlcyhsYW5ndWFnZSwgY2FsbGJhY2sgPSBub29wKSB7XG4gICAgbGV0IHVzZWRDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIGNvbnN0IHVzZWRMbmcgPSBpc1N0cmluZyhsYW5ndWFnZSkgPyBsYW5ndWFnZSA6IHRoaXMubGFuZ3VhZ2U7XG4gICAgaWYgKHR5cGVvZiBsYW5ndWFnZSA9PT0gJ2Z1bmN0aW9uJykgdXNlZENhbGxiYWNrID0gbGFuZ3VhZ2U7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucmVzb3VyY2VzIHx8IHRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykge1xuICAgICAgaWYgKHVzZWRMbmc/LnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnICYmICghdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgdGhpcy5vcHRpb25zLnByZWxvYWQubGVuZ3RoID09PSAwKSkgcmV0dXJuIHVzZWRDYWxsYmFjaygpO1xuICAgICAgY29uc3QgdG9Mb2FkID0gW107XG4gICAgICBjb25zdCBhcHBlbmQgPSBsbmcgPT4ge1xuICAgICAgICBpZiAoIWxuZykgcmV0dXJuO1xuICAgICAgICBpZiAobG5nID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgICBjb25zdCBsbmdzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsbmcpO1xuICAgICAgICBsbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKGwgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICAgICAgaWYgKCF0b0xvYWQuaW5jbHVkZXMobCkpIHRvTG9hZC5wdXNoKGwpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBpZiAoIXVzZWRMbmcpIHtcbiAgICAgICAgY29uc3QgZmFsbGJhY2tzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgICAgZmFsbGJhY2tzLmZvckVhY2gobCA9PiBhcHBlbmQobCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwZW5kKHVzZWRMbmcpO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQ/LmZvckVhY2g/LihsID0+IGFwcGVuZChsKSk7XG4gICAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IubG9hZCh0b0xvYWQsIHRoaXMub3B0aW9ucy5ucywgZSA9PiB7XG4gICAgICAgIGlmICghZSAmJiAhdGhpcy5yZXNvbHZlZExhbmd1YWdlICYmIHRoaXMubGFuZ3VhZ2UpIHRoaXMuc2V0UmVzb2x2ZWRMYW5ndWFnZSh0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgdXNlZENhbGxiYWNrKGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVzZWRDYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH1cbiAgcmVsb2FkUmVzb3VyY2VzKGxuZ3MsIG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAodHlwZW9mIGxuZ3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gbG5ncztcbiAgICAgIGxuZ3MgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gbnM7XG4gICAgICBucyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCFsbmdzKSBsbmdzID0gdGhpcy5sYW5ndWFnZXM7XG4gICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMubnM7XG4gICAgaWYgKCFjYWxsYmFjaykgY2FsbGJhY2sgPSBub29wO1xuICAgIHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5yZWxvYWQobG5ncywgbnMsIGVyciA9PiB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICB1c2UobW9kdWxlKSB7XG4gICAgaWYgKCFtb2R1bGUpIHRocm93IG5ldyBFcnJvcignWW91IGFyZSBwYXNzaW5nIGFuIHVuZGVmaW5lZCBtb2R1bGUhIFBsZWFzZSBjaGVjayB0aGUgb2JqZWN0IHlvdSBhcmUgcGFzc2luZyB0byBpMThuZXh0LnVzZSgpJyk7XG4gICAgaWYgKCFtb2R1bGUudHlwZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYSB3cm9uZyBtb2R1bGUhIFBsZWFzZSBjaGVjayB0aGUgb2JqZWN0IHlvdSBhcmUgcGFzc2luZyB0byBpMThuZXh0LnVzZSgpJyk7XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnYmFja2VuZCcpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5iYWNrZW5kID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdsb2dnZXInIHx8IG1vZHVsZS5sb2cgJiYgbW9kdWxlLndhcm4gJiYgbW9kdWxlLmVycm9yKSB7XG4gICAgICB0aGlzLm1vZHVsZXMubG9nZ2VyID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdsYW5ndWFnZURldGVjdG9yJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2kxOG5Gb3JtYXQnKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAncG9zdFByb2Nlc3NvcicpIHtcbiAgICAgIHBvc3RQcm9jZXNzb3IuYWRkUG9zdFByb2Nlc3Nvcihtb2R1bGUpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdmb3JtYXR0ZXInKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuZm9ybWF0dGVyID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICczcmRQYXJ0eScpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5leHRlcm5hbC5wdXNoKG1vZHVsZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHNldFJlc29sdmVkTGFuZ3VhZ2UobCkge1xuICAgIGlmICghbCB8fCAhdGhpcy5sYW5ndWFnZXMpIHJldHVybjtcbiAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5jbHVkZXMobCkpIHJldHVybjtcbiAgICBmb3IgKGxldCBsaSA9IDA7IGxpIDwgdGhpcy5sYW5ndWFnZXMubGVuZ3RoOyBsaSsrKSB7XG4gICAgICBjb25zdCBsbmdJbkxuZ3MgPSB0aGlzLmxhbmd1YWdlc1tsaV07XG4gICAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5jbHVkZXMobG5nSW5MbmdzKSkgY29udGludWU7XG4gICAgICBpZiAodGhpcy5zdG9yZS5oYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMobG5nSW5MbmdzKSkge1xuICAgICAgICB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgPSBsbmdJbkxuZ3M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMucmVzb2x2ZWRMYW5ndWFnZSAmJiAhdGhpcy5sYW5ndWFnZXMuaW5jbHVkZXMobCkgJiYgdGhpcy5zdG9yZS5oYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMobCkpIHtcbiAgICAgIHRoaXMucmVzb2x2ZWRMYW5ndWFnZSA9IGw7XG4gICAgICB0aGlzLmxhbmd1YWdlcy51bnNoaWZ0KGwpO1xuICAgIH1cbiAgfVxuICBjaGFuZ2VMYW5ndWFnZShsbmcsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IGxuZztcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdGhpcy5lbWl0KCdsYW5ndWFnZUNoYW5naW5nJywgbG5nKTtcbiAgICBjb25zdCBzZXRMbmdQcm9wcyA9IGwgPT4ge1xuICAgICAgdGhpcy5sYW5ndWFnZSA9IGw7XG4gICAgICB0aGlzLmxhbmd1YWdlcyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobCk7XG4gICAgICB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnNldFJlc29sdmVkTGFuZ3VhZ2UobCk7XG4gICAgfTtcbiAgICBjb25zdCBkb25lID0gKGVyciwgbCkgPT4ge1xuICAgICAgaWYgKGwpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPT09IGxuZykge1xuICAgICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICAgIHRoaXMudHJhbnNsYXRvci5jaGFuZ2VMYW5ndWFnZShsKTtcbiAgICAgICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICAgICAgdGhpcy5sb2dnZXIubG9nKCdsYW5ndWFnZUNoYW5nZWQnLCBsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKC4uLmFyZ3MpID0+IHRoaXMudCguLi5hcmdzKSk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVyciwgKC4uLmFyZ3MpID0+IHRoaXMudCguLi5hcmdzKSk7XG4gICAgfTtcbiAgICBjb25zdCBzZXRMbmcgPSBsbmdzID0+IHtcbiAgICAgIGlmICghbG5nICYmICFsbmdzICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvcikgbG5ncyA9IFtdO1xuICAgICAgY29uc3QgZmwgPSBpc1N0cmluZyhsbmdzKSA/IGxuZ3MgOiBsbmdzICYmIGxuZ3NbMF07XG4gICAgICBjb25zdCBsID0gdGhpcy5zdG9yZS5oYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMoZmwpID8gZmwgOiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGlzU3RyaW5nKGxuZ3MpID8gW2xuZ3NdIDogbG5ncyk7XG4gICAgICBpZiAobCkge1xuICAgICAgICBpZiAoIXRoaXMubGFuZ3VhZ2UpIHtcbiAgICAgICAgICBzZXRMbmdQcm9wcyhsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudHJhbnNsYXRvci5sYW5ndWFnZSkgdGhpcy50cmFuc2xhdG9yLmNoYW5nZUxhbmd1YWdlKGwpO1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3I/LmNhY2hlVXNlckxhbmd1YWdlPy4obCk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvYWRSZXNvdXJjZXMobCwgZXJyID0+IHtcbiAgICAgICAgZG9uZShlcnIsIGwpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoIWxuZyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgc2V0TG5nKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKSk7XG4gICAgfSBlbHNlIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkudGhlbihzZXRMbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdChzZXRMbmcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRMbmcobG5nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGdldEZpeGVkVChsbmcsIG5zLCBrZXlQcmVmaXgsIGZpeGVkT3B0cykge1xuICAgIGNvbnN0IHNjb3BlTnMgPSBmaXhlZE9wdHM/LnNjb3BlTnM7XG4gICAgY29uc3QgZml4ZWRUID0gKGtleSwgb3B0cywgLi4ucmVzdCkgPT4ge1xuICAgICAgbGV0IG87XG4gICAgICBpZiAodHlwZW9mIG9wdHMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIG8gPSB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoW2tleSwgb3B0c10uY29uY2F0KHJlc3QpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG8gPSB7XG4gICAgICAgICAgLi4ub3B0c1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgby5sbmcgPSBvLmxuZyB8fCBmaXhlZFQubG5nO1xuICAgICAgby5sbmdzID0gby5sbmdzIHx8IGZpeGVkVC5sbmdzO1xuICAgICAgY29uc3QgZXhwbGljaXRDYWxsTnMgPSBvLm5zICE9PSB1bmRlZmluZWQgJiYgby5ucyAhPT0gbnVsbDtcbiAgICAgIG8ubnMgPSBvLm5zIHx8IGZpeGVkVC5ucztcbiAgICAgIGlmIChvLmtleVByZWZpeCAhPT0gJycpIG8ua2V5UHJlZml4ID0gby5rZXlQcmVmaXggfHwga2V5UHJlZml4IHx8IGZpeGVkVC5rZXlQcmVmaXg7XG4gICAgICBjb25zdCBzZWxlY3Rvck9wdHMgPSB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgICAgLi4ub1xuICAgICAgfTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjb3BlTnMpICYmICFleHBsaWNpdENhbGxOcykgc2VsZWN0b3JPcHRzLm5zID0gc2NvcGVOcztcbiAgICAgIGlmICh0eXBlb2Ygby5rZXlQcmVmaXggPT09ICdmdW5jdGlvbicpIG8ua2V5UHJlZml4ID0ga2V5c0Zyb21TZWxlY3RvcihvLmtleVByZWZpeCwgc2VsZWN0b3JPcHRzKTtcbiAgICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgfHwgJy4nO1xuICAgICAgbGV0IHJlc3VsdEtleTtcbiAgICAgIGlmIChvLmtleVByZWZpeCAmJiBBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgcmVzdWx0S2V5ID0ga2V5Lm1hcChrID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGsgPT09ICdmdW5jdGlvbicpIGsgPSBrZXlzRnJvbVNlbGVjdG9yKGssIHNlbGVjdG9yT3B0cyk7XG4gICAgICAgICAgcmV0dXJuIGAke28ua2V5UHJlZml4fSR7a2V5U2VwYXJhdG9yfSR7a31gO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nKSBrZXkgPSBrZXlzRnJvbVNlbGVjdG9yKGtleSwgc2VsZWN0b3JPcHRzKTtcbiAgICAgICAgcmVzdWx0S2V5ID0gby5rZXlQcmVmaXggPyBgJHtvLmtleVByZWZpeH0ke2tleVNlcGFyYXRvcn0ke2tleX1gIDoga2V5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudChyZXN1bHRLZXksIG8pO1xuICAgIH07XG4gICAgaWYgKGlzU3RyaW5nKGxuZykpIHtcbiAgICAgIGZpeGVkVC5sbmcgPSBsbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVkVC5sbmdzID0gbG5nO1xuICAgIH1cbiAgICBmaXhlZFQubnMgPSBucztcbiAgICBmaXhlZFQua2V5UHJlZml4ID0ga2V5UHJlZml4O1xuICAgIHJldHVybiBmaXhlZFQ7XG4gIH1cbiAgdCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNsYXRvcj8udHJhbnNsYXRlKC4uLmFyZ3MpO1xuICB9XG4gIGV4aXN0cyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNsYXRvcj8uZXhpc3RzKC4uLmFyZ3MpO1xuICB9XG4gIHNldERlZmF1bHROYW1lc3BhY2UobnMpIHtcbiAgICB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TID0gbnM7XG4gIH1cbiAgaGFzTG9hZGVkTmFtZXNwYWNlKG5zLCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuZXh0IHdhcyBub3QgaW5pdGlhbGl6ZWQnLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy5sYW5ndWFnZXMgfHwgIXRoaXMubGFuZ3VhZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuLmxhbmd1YWdlcyB3ZXJlIHVuZGVmaW5lZCBvciBlbXB0eScsIHRoaXMubGFuZ3VhZ2VzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5yZXNvbHZlZExhbmd1YWdlIHx8IHRoaXMubGFuZ3VhZ2VzWzBdO1xuICAgIGNvbnN0IGZhbGxiYWNrTG5nID0gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIDogZmFsc2U7XG4gICAgY29uc3QgbGFzdExuZyA9IHRoaXMubGFuZ3VhZ2VzW3RoaXMubGFuZ3VhZ2VzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGxvYWROb3RQZW5kaW5nID0gKGwsIG4pID0+IHtcbiAgICAgIGNvbnN0IGxvYWRTdGF0ZSA9IHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5zdGF0ZVtgJHtsfXwke259YF07XG4gICAgICByZXR1cm4gbG9hZFN0YXRlID09PSAtMSB8fCBsb2FkU3RhdGUgPT09IDAgfHwgbG9hZFN0YXRlID09PSAyO1xuICAgIH07XG4gICAgaWYgKG9wdGlvbnMucHJlY2hlY2spIHtcbiAgICAgIGNvbnN0IHByZVJlc3VsdCA9IG9wdGlvbnMucHJlY2hlY2sodGhpcywgbG9hZE5vdFBlbmRpbmcpO1xuICAgICAgaWYgKHByZVJlc3VsdCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJlUmVzdWx0O1xuICAgIH1cbiAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKCF0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IuYmFja2VuZCB8fCB0aGlzLm9wdGlvbnMucmVzb3VyY2VzICYmICF0aGlzLm9wdGlvbnMucGFydGlhbEJ1bmRsZWRMYW5ndWFnZXMpIHJldHVybiB0cnVlO1xuICAgIGlmIChsb2FkTm90UGVuZGluZyhsbmcsIG5zKSAmJiAoIWZhbGxiYWNrTG5nIHx8IGxvYWROb3RQZW5kaW5nKGxhc3RMbmcsIG5zKSkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBsb2FkTmFtZXNwYWNlcyhucywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubnMpIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgaWYgKGlzU3RyaW5nKG5zKSkgbnMgPSBbbnNdO1xuICAgIG5zLmZvckVhY2gobiA9PiB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5ucy5pbmNsdWRlcyhuKSkgdGhpcy5vcHRpb25zLm5zLnB1c2gobik7XG4gICAgfSk7XG4gICAgdGhpcy5sb2FkUmVzb3VyY2VzKGVyciA9PiB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGxvYWRMYW5ndWFnZXMobG5ncywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgaWYgKGlzU3RyaW5nKGxuZ3MpKSBsbmdzID0gW2xuZ3NdO1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IHRoaXMub3B0aW9ucy5wcmVsb2FkIHx8IFtdO1xuICAgIGNvbnN0IG5ld0xuZ3MgPSBsbmdzLmZpbHRlcihsbmcgPT4gIXByZWxvYWRlZC5pbmNsdWRlcyhsbmcpICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5pc1N1cHBvcnRlZENvZGUobG5nKSk7XG4gICAgaWYgKCFuZXdMbmdzLmxlbmd0aCkge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICB0aGlzLm9wdGlvbnMucHJlbG9hZCA9IHByZWxvYWRlZC5jb25jYXQobmV3TG5ncyk7XG4gICAgdGhpcy5sb2FkUmVzb3VyY2VzKGVyciA9PiB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGRpcihsbmcpIHtcbiAgICBpZiAoIWxuZykgbG5nID0gdGhpcy5yZXNvbHZlZExhbmd1YWdlIHx8ICh0aGlzLmxhbmd1YWdlcz8ubGVuZ3RoID4gMCA/IHRoaXMubGFuZ3VhZ2VzWzBdIDogdGhpcy5sYW5ndWFnZSk7XG4gICAgaWYgKCFsbmcpIHJldHVybiAncnRsJztcbiAgICB0cnkge1xuICAgICAgY29uc3QgbCA9IG5ldyBJbnRsLkxvY2FsZShsbmcpO1xuICAgICAgaWYgKGwgJiYgbC5nZXRUZXh0SW5mbykge1xuICAgICAgICBjb25zdCB0aSA9IGwuZ2V0VGV4dEluZm8oKTtcbiAgICAgICAgaWYgKHRpICYmIHRpLmRpcmVjdGlvbikgcmV0dXJuIHRpLmRpcmVjdGlvbjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIGNvbnN0IHJ0bExuZ3MgPSBbJ2FyJywgJ3NodScsICdzcXInLCAnc3NoJywgJ3hhYScsICd5aGQnLCAneXVkJywgJ2FhbycsICdhYmgnLCAnYWJ2JywgJ2FjbScsICdhY3EnLCAnYWN3JywgJ2FjeCcsICdhY3knLCAnYWRmJywgJ2FkcycsICdhZWInLCAnYWVjJywgJ2FmYicsICdhanAnLCAnYXBjJywgJ2FwZCcsICdhcmInLCAnYXJxJywgJ2FycycsICdhcnknLCAnYXJ6JywgJ2F1eicsICdhdmwnLCAnYXloJywgJ2F5bCcsICdheW4nLCAnYXlwJywgJ2JieicsICdwZ2EnLCAnaGUnLCAnaXcnLCAncHMnLCAncGJ0JywgJ3BidScsICdwc3QnLCAncHJwJywgJ3ByZCcsICd1ZycsICd1cicsICd5ZGQnLCAneWRzJywgJ3lpaCcsICdqaScsICd5aScsICdoYm8nLCAnbWVuJywgJ3htbicsICdmYScsICdqcHInLCAncGVvJywgJ3BlcycsICdwcnMnLCAnZHYnLCAnc2FtJywgJ2NrYiddO1xuICAgIGNvbnN0IGxhbmd1YWdlVXRpbHMgPSB0aGlzLnNlcnZpY2VzPy5sYW5ndWFnZVV0aWxzIHx8IG5ldyBMYW5ndWFnZVV0aWwoZ2V0KCkpO1xuICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKS5pbmRleE9mKCctbGF0bicpID4gMSkgcmV0dXJuICdsdHInO1xuICAgIHJldHVybiBydGxMbmdzLmluY2x1ZGVzKGxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUobG5nKSkgfHwgbG5nLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignLWFyYWInKSA+IDEgPyAncnRsJyA6ICdsdHInO1xuICB9XG4gIHN0YXRpYyBjcmVhdGVJbnN0YW5jZShvcHRpb25zID0ge30sIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgSTE4bihvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuICBjbG9uZUluc3RhbmNlKG9wdGlvbnMgPSB7fSwgY2FsbGJhY2sgPSBub29wKSB7XG4gICAgY29uc3QgZm9ya1Jlc291cmNlU3RvcmUgPSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkgZGVsZXRlIG9wdGlvbnMuZm9ya1Jlc291cmNlU3RvcmU7XG4gICAgY29uc3QgbWVyZ2VkT3B0aW9ucyA9IHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAuLi57XG4gICAgICAgIGlzQ2xvbmU6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGNsb25lID0gbmV3IEkxOG4obWVyZ2VkT3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuZGVidWcgIT09IHVuZGVmaW5lZCB8fCBvcHRpb25zLnByZWZpeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbG9uZS5sb2dnZXIgPSBjbG9uZS5sb2dnZXIuY2xvbmUob3B0aW9ucyk7XG4gICAgfVxuICAgIGNvbnN0IG1lbWJlcnNUb0NvcHkgPSBbJ3N0b3JlJywgJ3NlcnZpY2VzJywgJ2xhbmd1YWdlJ107XG4gICAgbWVtYmVyc1RvQ29weS5mb3JFYWNoKG0gPT4ge1xuICAgICAgY2xvbmVbbV0gPSB0aGlzW21dO1xuICAgIH0pO1xuICAgIGNsb25lLnNlcnZpY2VzID0ge1xuICAgICAgLi4udGhpcy5zZXJ2aWNlc1xuICAgIH07XG4gICAgY2xvbmUuc2VydmljZXMudXRpbHMgPSB7XG4gICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IGNsb25lLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKGNsb25lKVxuICAgIH07XG4gICAgaWYgKGZvcmtSZXNvdXJjZVN0b3JlKSB7XG4gICAgICBjb25zdCBjbG9uZWREYXRhID0gT2JqZWN0LmtleXModGhpcy5zdG9yZS5kYXRhKS5yZWR1Y2UoKHByZXYsIGwpID0+IHtcbiAgICAgICAgcHJldltsXSA9IHtcbiAgICAgICAgICAuLi50aGlzLnN0b3JlLmRhdGFbbF1cbiAgICAgICAgfTtcbiAgICAgICAgcHJldltsXSA9IE9iamVjdC5rZXlzKHByZXZbbF0pLnJlZHVjZSgoYWNjLCBuKSA9PiB7XG4gICAgICAgICAgYWNjW25dID0ge1xuICAgICAgICAgICAgLi4ucHJldltsXVtuXVxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwgcHJldltsXSk7XG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfSwge30pO1xuICAgICAgY2xvbmUuc3RvcmUgPSBuZXcgUmVzb3VyY2VTdG9yZShjbG9uZWREYXRhLCBtZXJnZWRPcHRpb25zKTtcbiAgICAgIGNsb25lLnNlcnZpY2VzLnJlc291cmNlU3RvcmUgPSBjbG9uZS5zdG9yZTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuaW50ZXJwb2xhdGlvbikge1xuICAgICAgY29uc3QgZGVmT3B0cyA9IGdldCgpO1xuICAgICAgY29uc3QgbWVyZ2VkSW50ZXJwb2xhdGlvbiA9IHtcbiAgICAgICAgLi4uZGVmT3B0cy5pbnRlcnBvbGF0aW9uLFxuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgLi4ub3B0aW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICB9O1xuICAgICAgY29uc3QgbWVyZ2VkRm9ySW50ZXJwb2xhdG9yID0ge1xuICAgICAgICAuLi5tZXJnZWRPcHRpb25zLFxuICAgICAgICBpbnRlcnBvbGF0aW9uOiBtZXJnZWRJbnRlcnBvbGF0aW9uXG4gICAgICB9O1xuICAgICAgY2xvbmUuc2VydmljZXMuaW50ZXJwb2xhdG9yID0gbmV3IEludGVycG9sYXRvcihtZXJnZWRGb3JJbnRlcnBvbGF0b3IpO1xuICAgIH1cbiAgICBjbG9uZS50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoY2xvbmUuc2VydmljZXMsIG1lcmdlZE9wdGlvbnMpO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub24oJyonLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgIGNsb25lLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH0pO1xuICAgIGNsb25lLmluaXQobWVyZ2VkT3B0aW9ucywgY2FsbGJhY2spO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub3B0aW9ucyA9IG1lcmdlZE9wdGlvbnM7XG4gICAgY2xvbmUudHJhbnNsYXRvci5iYWNrZW5kQ29ubmVjdG9yLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgIHN0b3JlOiB0aGlzLnN0b3JlLFxuICAgICAgbGFuZ3VhZ2U6IHRoaXMubGFuZ3VhZ2UsXG4gICAgICBsYW5ndWFnZXM6IHRoaXMubGFuZ3VhZ2VzLFxuICAgICAgcmVzb2x2ZWRMYW5ndWFnZTogdGhpcy5yZXNvbHZlZExhbmd1YWdlXG4gICAgfTtcbiAgfVxufVxuY29uc3QgaW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlKCk7XG5cbmNvbnN0IGNyZWF0ZUluc3RhbmNlID0gaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2U7XG5jb25zdCBkaXIgPSBpbnN0YW5jZS5kaXI7XG5jb25zdCBpbml0ID0gaW5zdGFuY2UuaW5pdDtcbmNvbnN0IGxvYWRSZXNvdXJjZXMgPSBpbnN0YW5jZS5sb2FkUmVzb3VyY2VzO1xuY29uc3QgcmVsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UucmVsb2FkUmVzb3VyY2VzO1xuY29uc3QgdXNlID0gaW5zdGFuY2UudXNlO1xuY29uc3QgY2hhbmdlTGFuZ3VhZ2UgPSBpbnN0YW5jZS5jaGFuZ2VMYW5ndWFnZTtcbmNvbnN0IGdldEZpeGVkVCA9IGluc3RhbmNlLmdldEZpeGVkVDtcbmNvbnN0IHQgPSBpbnN0YW5jZS50O1xuY29uc3QgZXhpc3RzID0gaW5zdGFuY2UuZXhpc3RzO1xuY29uc3Qgc2V0RGVmYXVsdE5hbWVzcGFjZSA9IGluc3RhbmNlLnNldERlZmF1bHROYW1lc3BhY2U7XG5jb25zdCBoYXNMb2FkZWROYW1lc3BhY2UgPSBpbnN0YW5jZS5oYXNMb2FkZWROYW1lc3BhY2U7XG5jb25zdCBsb2FkTmFtZXNwYWNlcyA9IGluc3RhbmNlLmxvYWROYW1lc3BhY2VzO1xuY29uc3QgbG9hZExhbmd1YWdlcyA9IGluc3RhbmNlLmxvYWRMYW5ndWFnZXM7XG5cbmV4cG9ydCB7IGNoYW5nZUxhbmd1YWdlLCBjcmVhdGVJbnN0YW5jZSwgaW5zdGFuY2UgYXMgZGVmYXVsdCwgZGlyLCBleGlzdHMsIGdldEZpeGVkVCwgaGFzTG9hZGVkTmFtZXNwYWNlLCBpbml0LCBrZXlzRnJvbVNlbGVjdG9yIGFzIGtleUZyb21TZWxlY3RvciwgbG9hZExhbmd1YWdlcywgbG9hZE5hbWVzcGFjZXMsIGxvYWRSZXNvdXJjZXMsIHJlbG9hZFJlc291cmNlcywgc2V0RGVmYXVsdE5hbWVzcGFjZSwgdCwgdXNlIH07XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFNLFlBQVcsUUFBTyxPQUFPLFFBQVE7QUFDdkMsSUFBTSxjQUFjO0NBQ2xCLElBQUk7Q0FDSixJQUFJO0NBQ0osTUFBTSxVQUFVLElBQUksU0FBUyxTQUFTLFdBQVc7RUFDL0MsTUFBTTtFQUNOLE1BQU07Q0FDUixDQUFDO0NBQ0QsUUFBUSxVQUFVO0NBQ2xCLFFBQVEsU0FBUztDQUNqQixPQUFPO0FBQ1Q7QUFDQSxJQUFNLGNBQWEsV0FBVTtDQUMzQixJQUFJLFVBQVUsTUFBTSxPQUFPO0NBQzNCLE9BQU8sT0FBTyxNQUFNO0FBQ3RCO0FBQ0EsSUFBTSxRQUFRLEdBQUcsR0FBRyxNQUFNO0NBQ3hCLEVBQUUsU0FBUSxNQUFLO0VBQ2IsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Q0FDckIsQ0FBQztBQUNIO0FB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QUNBLElBQUksbUJBQW1CO0dBYXJCLE1BQU0sUUFBUSxJQUFJLGNBWkMsT0FBTyxLQUFLLEtBQUssTUFBTSxJQUFJLENBQUMsQ0FBQyxRQUFRLE1BQU0sTUFBTTtJQUNsRSxLQUFLLEtBQUssRUFDUixHQUFHLEtBQUssTUFBTSxLQUFLLEdBQ3JCO0lBQ0EsS0FBSyxLQUFLLE9BQU8sS0FBSyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxNQUFNO0tBQ2hELElBQUksS0FBSyxFQUNQLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FDYjtLQUNBLE9BQU87SUFDVCxHQUFHLEtBQUssRUFBRTtJQUNWLE9BQU87R0FDVCxHQUFHLENBQUMsQ0FDNEIsR0FBWSxhQUFhO0dBQ3pELE1BQU0sU0FBUyxnQkFBZ0IsTUFBTTtFQUN2QztFQUNBLElBQUksUUFBUSxlQUFlO0dBRXpCLE1BQU0sc0JBQXNCO0lBQzFCLEdBRmMsSUFFTCxDQUFDLENBQUM7SUFDWCxHQUFHLEtBQUssUUFBUTtJQUNoQixHQUFHLFFBQVE7R0FDYjtHQUNBLE1BQU0sd0JBQXdCO0lBQzVCLEdBQUc7SUFDSCxlQUFlO0dBQ2pCO0dBQ0EsTUFBTSxTQUFTLGVBQWUsSUFBSSxhQUFhLHFCQUFxQjtFQUN0RTtFQUNBLE1BQU0sYUFBYSxJQUFJLFdBQVcsTUFBTSxVQUFVLGFBQWE7RUFDL0QsTUFBTSxXQUFXLEdBQUcsTUFBTSxPQUFPLEdBQUcsU0FBUztHQUMzQyxNQUFNLEtBQUssT0FBTyxHQUFHLElBQUk7RUFDM0IsQ0FBQztFQUNELE1BQU0sS0FBSyxlQUFlLFFBQVE7RUFDbEMsTUFBTSxXQUFXLFVBQVU7RUFDM0IsTUFBTSxXQUFXLGlCQUFpQixTQUFTLFFBQVEsRUFDakQsb0JBQW9CLE1BQU0sbUJBQW1CLEtBQUssS0FBSyxFQUN6RDtFQUNBLE9BQU87Q0FDVDtDQUNBLFNBQVM7RUFDUCxPQUFPO0dBQ0wsU0FBUyxLQUFLO0dBQ2QsT0FBTyxLQUFLO0dBQ1osVUFBVSxLQUFLO0dBQ2YsV0FBVyxLQUFLO0dBQ2hCLGtCQUFrQixLQUFLO0VBQ3pCO0NBQ0Y7QUFDRixFQUNzQixlQUFlO0FBRXJDLElBQU0saUJBQWlCLFNBQVM7QUFDaEMsSUFBTSxNQUFNLFNBQVM7QUFDckIsSUFBTSxPQUFPLFNBQVM7QUFDdEIsSUFBTSxnQkFBZ0IsU0FBUztBQUMvQixJQUFNLGtCQUFrQixTQUFTO0FBQ2pDLElBQU0sTUFBTSxTQUFTO0FBQ3JCLElBQU0saUJBQWlCLFNBQVM7QUFDaEMsSUFBTSxZQUFZLFNBQVM7QUFDM0IsSUFBTSxJQUFJLFNBQVM7QUFDbkIsSUFBTSxTQUFTLFNBQVM7QUFDeEIsSUFBTSxzQkFBc0IsU0FBUztBQUNyQyxJQUFNLHFCQUFxQixTQUFTO0FBQ3BDLElBQU0saUJBQWlCLFNBQVM7QUFDaEMsSUFBTSxnQkFBZ0IsU0FBUyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=