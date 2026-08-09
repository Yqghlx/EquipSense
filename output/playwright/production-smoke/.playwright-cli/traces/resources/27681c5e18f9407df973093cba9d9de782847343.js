import { n as __exportAll } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
//#region node_modules/zod/v4/core/core.js
var _a;
/** A special constant with type `never` */
var NEVER = /*@__PURE__*/ Object.freeze({ status: "aborted" });
function $constructor(name, initializer, params) {
	function init(inst, def) {
		if (!inst._zod) Object.defineProperty(inst, "_zod", {
			value: {
				def,
				constr: _,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: false
		});
		if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		const proto = _.prototype;
		const keys = Object.keys(proto);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		var _a;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $brand = Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region node_modules/zod/v4/core/util.js
var util_exports = /* @__PURE__ */ __exportAll({
	BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
	Class: () => Class,
	NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
	aborted: () => aborted,
	allowsEval: () => allowsEval,
	assert: () => assert,
	assertEqual: () => assertEqual,
	assertIs: () => assertIs,
	assertNever: () => assertNever,
	assertNotEqual: () => assertNotEqual,
	assignProp: () => assignProp,
	base64ToUint8Array: () => base64ToUint8Array,
	base64urlToUint8Array: () => base64urlToUint8Array,
	cached: () => cached,
	captureStackTrace: () => captureStackTrace,
	cleanEnum: () => cleanEnum,
	cleanRegex: () => cleanRegex,
	clone: () => clone,
	cloneDef: () => cloneDef,
	createTransparentProxy: () => createTransparentProxy,
	defineLazy: () => defineLazy,
	esc: () => esc,
	escapeRegex: () => escapeRegex,
	explicitlyAborted: () => explicitlyAborted,
	extend: () => extend,
	finalizeIssue: () => finalizeIssue,
	floatSafeRemainder: () => floatSafeRemainder,
	getElementAtPath: () => getElementAtPath,
	getEnumValues: () => getEnumValues,
	getLengthableOrigin: () => getLengthableOrigin,
	getParsedType: () => getParsedType,
	getSizableOrigin: () => getSizableOrigin,
	hexToUint8Array: () => hexToUint8Array,
	isObject: () => isObject,
	isPlainObject: () => isPlainObject,
	issue: () => issue,
	joinValues: () => joinValues,
	jsonStringifyReplacer: () => jsonStringifyReplacer,
	merge: () => merge,
	mergeDefs: () => mergeDefs,
	normalizeParams: () => normalizeParams,
	nullish: () => nullish,
	numKeys: () => numKeys,
	objectClone: () => objectClone,
	omit: () => omit,
	optionalKeys: () => optionalKeys,
	parsedType: () => parsedType,
	partial: () => partial,
	pick: () => pick,
	prefixIssues: () => prefixIssues,
	primitiveTypes: () => primitiveTypes,
	promiseAllObject: () => promiseAllObject,
	propertyKeyTypes: () => propertyKeyTypes,
	randomString: () => randomString,
	required: () => required,
	safeExtend: () => safeExtend,
	shallowClone: () => shallowClone,
	slugify: () => slugify,
	stringifyPrimitive: () => stringifyPrimitive,
	uint8ArrayToBase64: () => uint8ArrayToBase64,
	uint8ArrayToBase64url: () => uint8ArrayToBase64url,
	uint8ArrayToHex: () => uint8ArrayToHex,
	unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
	return val;
}
function assertNotEqual(val) {
	return val;
}
function assertIs(_arg) {}
function assertNever(_x) {
	throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {}
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__*/ Symbol("evaluating");
function defineLazy(object, key, getter) {
	let value = void 0;
	Object.defineProperty(object, key, {
		get() {
			if (value === EVALUATING) return;
			if (value === void 0) {
				value = EVALUATING;
				value = getter();
			}
			return value;
		},
		set(v) {
			Object.defineProperty(object, key, { value: v });
		},
		configurable: true
	});
}
function objectClone(obj) {
	return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
	return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
	if (!path) return obj;
	return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
	const keys = Object.keys(promisesObj);
	const promises = keys.map((key) => promisesObj[key]);
	return Promise.all(promises).then((results) => {
		const resolvedObj = {};
		for (let i = 0; i < keys.length; i++) resolvedObj[keys[i]] = results[i];
		return resolvedObj;
	});
}
function randomString(length = 10) {
	const chars = "abcdefghijklmnopqrstuvwxyz";
	let str = "";
	for (let i = 0; i < length; i++) str += chars[Math.floor(Math.random() * 26)];
	return str;
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
function numKeys(data) {
	let keyCount = 0;
	for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) keyCount++;
	return keyCount;
}
var getParsedType = (data) => {
	const t = typeof data;
	switch (t) {
		case "undefined": return "undefined";
		case "string": return "string";
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "boolean": return "boolean";
		case "function": return "function";
		case "bigint": return "bigint";
		case "symbol": return "symbol";
		case "object":
			if (Array.isArray(data)) return "array";
			if (data === null) return "null";
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return "promise";
			if (typeof Map !== "undefined" && data instanceof Map) return "map";
			if (typeof Set !== "undefined" && data instanceof Set) return "set";
			if (typeof Date !== "undefined" && data instanceof Date) return "date";
			if (typeof File !== "undefined" && data instanceof File) return "file";
			return "object";
		default: throw new Error(`Unknown data type: ${t}`);
	}
};
var propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
var primitiveTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"bigint",
	"boolean",
	"symbol",
	"undefined"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function createTransparentProxy(getter) {
	let target;
	return new Proxy({}, {
		get(_, prop, receiver) {
			target ?? (target = getter());
			return Reflect.get(target, prop, receiver);
		},
		set(_, prop, value, receiver) {
			target ?? (target = getter());
			return Reflect.set(target, prop, value, receiver);
		},
		has(_, prop) {
			target ?? (target = getter());
			return Reflect.has(target, prop);
		},
		deleteProperty(_, prop) {
			target ?? (target = getter());
			return Reflect.deleteProperty(target, prop);
		},
		ownKeys(_) {
			target ?? (target = getter());
			return Reflect.ownKeys(target);
		},
		getOwnPropertyDescriptor(_, prop) {
			target ?? (target = getter());
			return Reflect.getOwnPropertyDescriptor(target, prop);
		},
		defineProperty(_, prop, descriptor) {
			target ?? (target = getter());
			return Reflect.defineProperty(target, prop, descriptor);
		}
	});
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				newShape[key] = currDef.shape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask) {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key in mask) {
				if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key in oldShape) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key in mask) {
			if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key in oldShape) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
	rest.path ?? (rest.path = []);
	rest.message = message;
	if (ctx?.reportInput) rest.input = _input;
	return rest;
}
function getSizableOrigin(input) {
	if (input instanceof Set) return "set";
	if (input instanceof Map) return "map";
	if (input instanceof File) return "file";
	return "unknown";
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
function cleanEnum(obj) {
	return Object.entries(obj).filter(([k, _]) => {
		return Number.isNaN(Number.parseInt(k, 10));
	}).map((el) => el[1]);
}
function base64ToUint8Array(base64) {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
	return bytes;
}
function uint8ArrayToBase64(bytes) {
	let binaryString = "";
	for (let i = 0; i < bytes.length; i++) binaryString += String.fromCharCode(bytes[i]);
	return btoa(binaryString);
}
function base64urlToUint8Array(base64url) {
	const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	return base64ToUint8Array(base64 + "=".repeat((4 - base64.length % 4) % 4));
}
function uint8ArrayToBase64url(bytes) {
	return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
	const cleanHex = hex.replace(/^0x/, "");
	if (cleanHex.length % 2 !== 0) throw new Error("Invalid hex string length");
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	return bytes;
}
function uint8ArrayToHex(bytes) {
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
	constructor(..._args) {}
};
//#endregion
//#region node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					if (!(i === fullpath.length - 1)) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue));
					}
					curr = curr[el];
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
function treeifyError(error, mapper = (issue) => issue.message) {
	const result = { errors: [] };
	const processError = (error, path = []) => {
		var _a, _b;
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) {
				result.errors.push(mapper(issue));
				continue;
			}
			let curr = result;
			let i = 0;
			while (i < fullpath.length) {
				const el = fullpath[i];
				const terminal = i === fullpath.length - 1;
				if (typeof el === "string") {
					curr.properties ?? (curr.properties = {});
					(_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
					curr = curr.properties[el];
				} else {
					curr.items ?? (curr.items = []);
					(_b = curr.items)[el] ?? (_b[el] = { errors: [] });
					curr = curr.items[el];
				}
				if (terminal) curr.errors.push(mapper(issue));
				i++;
			}
		}
	};
	processError(error);
	return result;
}
/** Format a ZodError as a human-readable string in the following form.
*
* From
*
* ```ts
* ZodError {
*   issues: [
*     {
*       expected: 'string',
*       code: 'invalid_type',
*       path: [ 'username' ],
*       message: 'Invalid input: expected string'
*     },
*     {
*       expected: 'number',
*       code: 'invalid_type',
*       path: [ 'favoriteNumbers', 1 ],
*       message: 'Invalid input: expected number'
*     }
*   ];
* }
* ```
*
* to
*
* ```
* username
*   ✖ Expected number, received string at "username
* favoriteNumbers[0]
*   ✖ Invalid input: expected number
* ```
*/
function toDotPath(_path) {
	const segs = [];
	const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
	for (const seg of path) if (typeof seg === "number") segs.push(`[${seg}]`);
	else if (typeof seg === "symbol") segs.push(`[${JSON.stringify(String(seg))}]`);
	else if (/[^\w$]/.test(seg)) segs.push(`[${JSON.stringify(seg)}]`);
	else {
		if (segs.length) segs.push(".");
		segs.push(seg);
	}
	return segs.join("");
}
function prettifyError(error) {
	const lines = [];
	const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
	for (const issue of issues) {
		lines.push(`✖ ${issue.message}`);
		if (issue.path?.length) lines.push(`  → at ${toDotPath(issue.path)}`);
	}
	return lines.join("\n");
}
//#endregion
//#region node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
var parse = /* @__PURE__*/ _parse($ZodRealError);
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
var parseAsync = /* @__PURE__*/ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParse = /* @__PURE__*/ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParseAsync = /* @__PURE__*/ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _parse(_Err)(schema, value, ctx);
};
var encode = /* @__PURE__*/ _encode($ZodRealError);
var _decode = (_Err) => (schema, value, _ctx) => {
	return _parse(_Err)(schema, value, _ctx);
};
var decode = /* @__PURE__*/ _decode($ZodRealError);
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _parseAsync(_Err)(schema, value, ctx);
};
var encodeAsync = /* @__PURE__*/ _encodeAsync($ZodRealError);
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _parseAsync(_Err)(schema, value, _ctx);
};
var decodeAsync = /* @__PURE__*/ _decodeAsync($ZodRealError);
var _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
var safeEncode = /* @__PURE__*/ _safeEncode($ZodRealError);
var _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
var safeDecode = /* @__PURE__*/ _safeDecode($ZodRealError);
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
var safeEncodeAsync = /* @__PURE__*/ _safeEncodeAsync($ZodRealError);
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
var safeDecodeAsync = /* @__PURE__*/ _safeDecodeAsync($ZodRealError);
//#endregion
export { jsonStringifyReplacer as $, toDotPath as A, esc as B, safeParse as C, config as Ct, flattenError as D, $ZodRealError as E, allowsEval as F, floatSafeRemainder as G, explicitlyAborted as H, cached as I, getSizableOrigin as J, getEnumValues as K, cleanRegex as L, BIGINT_FORMAT_RANGES as M, NUMBER_FORMAT_RANGES as N, formatError as O, aborted as P, joinValues as Q, clone as R, safeEncodeAsync as S, NEVER as St, $ZodError as T, extend as U, escapeRegex as V, finalizeIssue as W, isPlainObject as X, isObject as Y, issue as Z, parse as _, util_exports as _t, _parse as a, optionalKeys as at, safeDecodeAsync as b, $brand as bt, _safeDecodeAsync as c, pick as ct, _safeParse as d, propertyKeyTypes as dt, merge as et, _safeParseAsync as f, required as ft, encodeAsync as g, stringifyPrimitive as gt, encode as h, slugify as ht, _encodeAsync as i, omit as it, treeifyError as j, prettifyError as k, _safeEncode as l, prefixIssues as lt, decodeAsync as m, shallowClone as mt, _decodeAsync as n, normalizeParams as nt, _parseAsync as o, parsedType as ot, decode as p, safeExtend as pt, getLengthableOrigin as q, _encode as r, nullish as rt, _safeDecode as s, partial as st, _decode as t, mergeDefs as tt, _safeEncodeAsync as u, primitiveTypes as ut, parseAsync as v, $ZodAsyncError as vt, safeParseAsync as w, globalConfig as wt, safeEncode as x, $constructor as xt, safeDecode as y, $ZodEncodeError as yt, defineLazy as z };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtQzMxZFhoUnMuanMiLCJuYW1lcyI6WyJGIiwidXRpbC5qc29uU3RyaW5naWZ5UmVwbGFjZXIiLCJjb3JlLiRab2RBc3luY0Vycm9yIiwidXRpbC5maW5hbGl6ZUlzc3VlIiwiY29yZS5jb25maWciLCJlcnJvcnMuJFpvZFJlYWxFcnJvciIsImVycm9ycy4kWm9kRXJyb3IiXSwic291cmNlcyI6WyIuLi8uLi96b2QvdjQvY29yZS9jb3JlLmpzIiwiLi4vLi4vem9kL3Y0L2NvcmUvdXRpbC5qcyIsIi4uLy4uL3pvZC92NC9jb3JlL2Vycm9ycy5qcyIsIi4uLy4uL3pvZC92NC9jb3JlL3BhcnNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBfYTtcbi8qKiBBIHNwZWNpYWwgY29uc3RhbnQgd2l0aCB0eXBlIGBuZXZlcmAgKi9cbmV4cG9ydCBjb25zdCBORVZFUiA9IC8qQF9fUFVSRV9fKi8gT2JqZWN0LmZyZWV6ZSh7XG4gICAgc3RhdHVzOiBcImFib3J0ZWRcIixcbn0pO1xuZXhwb3J0IC8qQF9fTk9fU0lERV9FRkZFQ1RTX18qLyBmdW5jdGlvbiAkY29uc3RydWN0b3IobmFtZSwgaW5pdGlhbGl6ZXIsIHBhcmFtcykge1xuICAgIGZ1bmN0aW9uIGluaXQoaW5zdCwgZGVmKSB7XG4gICAgICAgIGlmICghaW5zdC5fem9kKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5zdCwgXCJfem9kXCIsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICBkZWYsXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0cjogXyxcbiAgICAgICAgICAgICAgICAgICAgdHJhaXRzOiBuZXcgU2V0KCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnN0Ll96b2QudHJhaXRzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGluc3QuX3pvZC50cmFpdHMuYWRkKG5hbWUpO1xuICAgICAgICBpbml0aWFsaXplcihpbnN0LCBkZWYpO1xuICAgICAgICAvLyBzdXBwb3J0IHByb3RvdHlwZSBtb2RpZmljYXRpb25zXG4gICAgICAgIGNvbnN0IHByb3RvID0gXy5wcm90b3R5cGU7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm90byk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgayA9IGtleXNbaV07XG4gICAgICAgICAgICBpZiAoIShrIGluIGluc3QpKSB7XG4gICAgICAgICAgICAgICAgaW5zdFtrXSA9IHByb3RvW2tdLmJpbmQoaW5zdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gZG9lc24ndCB3b3JrIGlmIFBhcmVudCBoYXMgYSBjb25zdHJ1Y3RvciB3aXRoIGFyZ3VtZW50c1xuICAgIGNvbnN0IFBhcmVudCA9IHBhcmFtcz8uUGFyZW50ID8/IE9iamVjdDtcbiAgICBjbGFzcyBEZWZpbml0aW9uIGV4dGVuZHMgUGFyZW50IHtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERlZmluaXRpb24sIFwibmFtZVwiLCB7IHZhbHVlOiBuYW1lIH0pO1xuICAgIGZ1bmN0aW9uIF8oZGVmKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgY29uc3QgaW5zdCA9IHBhcmFtcz8uUGFyZW50ID8gbmV3IERlZmluaXRpb24oKSA6IHRoaXM7XG4gICAgICAgIGluaXQoaW5zdCwgZGVmKTtcbiAgICAgICAgKF9hID0gaW5zdC5fem9kKS5kZWZlcnJlZCA/PyAoX2EuZGVmZXJyZWQgPSBbXSk7XG4gICAgICAgIGZvciAoY29uc3QgZm4gb2YgaW5zdC5fem9kLmRlZmVycmVkKSB7XG4gICAgICAgICAgICBmbigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0O1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXywgXCJpbml0XCIsIHsgdmFsdWU6IGluaXQgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF8sIFN5bWJvbC5oYXNJbnN0YW5jZSwge1xuICAgICAgICB2YWx1ZTogKGluc3QpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJhbXM/LlBhcmVudCAmJiBpbnN0IGluc3RhbmNlb2YgcGFyYW1zLlBhcmVudClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBpbnN0Py5fem9kPy50cmFpdHM/LmhhcyhuYW1lKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXywgXCJuYW1lXCIsIHsgdmFsdWU6IG5hbWUgfSk7XG4gICAgcmV0dXJuIF87XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gICBVVElMSVRJRVMgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjb25zdCAkYnJhbmQgPSBTeW1ib2woXCJ6b2RfYnJhbmRcIik7XG5leHBvcnQgY2xhc3MgJFpvZEFzeW5jRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKGBFbmNvdW50ZXJlZCBQcm9taXNlIGR1cmluZyBzeW5jaHJvbm91cyBwYXJzZS4gVXNlIC5wYXJzZUFzeW5jKCkgaW5zdGVhZC5gKTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgJFpvZEVuY29kZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG5hbWUpIHtcbiAgICAgICAgc3VwZXIoYEVuY291bnRlcmVkIHVuaWRpcmVjdGlvbmFsIHRyYW5zZm9ybSBkdXJpbmcgZW5jb2RlOiAke25hbWV9YCk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiWm9kRW5jb2RlRXJyb3JcIjtcbiAgICB9XG59XG4oX2EgPSBnbG9iYWxUaGlzKS5fX3pvZF9nbG9iYWxDb25maWcgPz8gKF9hLl9fem9kX2dsb2JhbENvbmZpZyA9IHt9KTtcbmV4cG9ydCBjb25zdCBnbG9iYWxDb25maWcgPSBnbG9iYWxUaGlzLl9fem9kX2dsb2JhbENvbmZpZztcbmV4cG9ydCBmdW5jdGlvbiBjb25maWcobmV3Q29uZmlnKSB7XG4gICAgaWYgKG5ld0NvbmZpZylcbiAgICAgICAgT2JqZWN0LmFzc2lnbihnbG9iYWxDb25maWcsIG5ld0NvbmZpZyk7XG4gICAgcmV0dXJuIGdsb2JhbENvbmZpZztcbn1cbiIsImltcG9ydCB7IGdsb2JhbENvbmZpZyB9IGZyb20gXCIuL2NvcmUuanNcIjtcbi8vIGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsKHZhbCkge1xuICAgIHJldHVybiB2YWw7XG59XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWwodmFsKSB7XG4gICAgcmV0dXJuIHZhbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRJcyhfYXJnKSB7IH1cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROZXZlcihfeCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgdmFsdWUgaW4gZXhoYXVzdGl2ZSBjaGVja1wiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoXykgeyB9XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW51bVZhbHVlcyhlbnRyaWVzKSB7XG4gICAgY29uc3QgbnVtZXJpY1ZhbHVlcyA9IE9iamVjdC52YWx1ZXMoZW50cmllcykuZmlsdGVyKCh2KSA9PiB0eXBlb2YgdiA9PT0gXCJudW1iZXJcIik7XG4gICAgY29uc3QgdmFsdWVzID0gT2JqZWN0LmVudHJpZXMoZW50cmllcylcbiAgICAgICAgLmZpbHRlcigoW2ssIF9dKSA9PiBudW1lcmljVmFsdWVzLmluZGV4T2YoK2spID09PSAtMSlcbiAgICAgICAgLm1hcCgoW18sIHZdKSA9PiB2KTtcbiAgICByZXR1cm4gdmFsdWVzO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5WYWx1ZXMoYXJyYXksIHNlcGFyYXRvciA9IFwifFwiKSB7XG4gICAgcmV0dXJuIGFycmF5Lm1hcCgodmFsKSA9PiBzdHJpbmdpZnlQcmltaXRpdmUodmFsKSkuam9pbihzZXBhcmF0b3IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGpzb25TdHJpbmdpZnlSZXBsYWNlcihfLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYmlnaW50XCIpXG4gICAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjYWNoZWQoZ2V0dGVyKSB7XG4gICAgY29uc3Qgc2V0ID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICAgICAgaWYgKCFzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldHRlcigpO1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInZhbHVlXCIsIHsgdmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FjaGVkIHZhbHVlIGFscmVhZHkgc2V0XCIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnQgZnVuY3Rpb24gbnVsbGlzaChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuUmVnZXgoc291cmNlKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBzb3VyY2Uuc3RhcnRzV2l0aChcIl5cIikgPyAxIDogMDtcbiAgICBjb25zdCBlbmQgPSBzb3VyY2UuZW5kc1dpdGgoXCIkXCIpID8gc291cmNlLmxlbmd0aCAtIDEgOiBzb3VyY2UubGVuZ3RoO1xuICAgIHJldHVybiBzb3VyY2Uuc2xpY2Uoc3RhcnQsIGVuZCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZmxvYXRTYWZlUmVtYWluZGVyKHZhbCwgc3RlcCkge1xuICAgIGNvbnN0IHJhdGlvID0gdmFsIC8gc3RlcDtcbiAgICBjb25zdCByb3VuZGVkUmF0aW8gPSBNYXRoLnJvdW5kKHJhdGlvKTtcbiAgICAvLyBVc2UgYSByZWxhdGl2ZSBlcHNpbG9uIHNjYWxlZCB0byB0aGUgbWFnbml0dWRlIG9mIHRoZSByZXN1bHRcbiAgICBjb25zdCB0b2xlcmFuY2UgPSBOdW1iZXIuRVBTSUxPTiAqIE1hdGgubWF4KE1hdGguYWJzKHJhdGlvKSwgMSk7XG4gICAgaWYgKE1hdGguYWJzKHJhdGlvIC0gcm91bmRlZFJhdGlvKSA8IHRvbGVyYW5jZSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgcmV0dXJuIHJhdGlvIC0gcm91bmRlZFJhdGlvO1xufVxuY29uc3QgRVZBTFVBVElORyA9IC8qIEBfX1BVUkVfXyovIFN5bWJvbChcImV2YWx1YXRpbmdcIik7XG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lTGF6eShvYmplY3QsIGtleSwgZ2V0dGVyKSB7XG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIGtleSwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IEVWQUxVQVRJTkcpIHtcbiAgICAgICAgICAgICAgICAvLyBDaXJjdWxhciByZWZlcmVuY2UgZGV0ZWN0ZWQsIHJldHVybiB1bmRlZmluZWQgdG8gYnJlYWsgdGhlIGN5Y2xlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBFVkFMVUFUSU5HO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZ2V0dGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2KSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdixcbiAgICAgICAgICAgICAgICAvLyBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIG9iamVjdFtrZXldID0gdjtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdENsb25lKG9iaikge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhvYmopKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25Qcm9wKHRhcmdldCwgcHJvcCwgdmFsdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wLCB7XG4gICAgICAgIHZhbHVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlRGVmcyguLi5kZWZzKSB7XG4gICAgY29uc3QgbWVyZ2VkRGVzY3JpcHRvcnMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGRlZiBvZiBkZWZzKSB7XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoZGVmKTtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihtZXJnZWREZXNjcmlwdG9ycywgZGVzY3JpcHRvcnMpO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoe30sIG1lcmdlZERlc2NyaXB0b3JzKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZURlZihzY2hlbWEpIHtcbiAgICByZXR1cm4gbWVyZ2VEZWZzKHNjaGVtYS5fem9kLmRlZik7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudEF0UGF0aChvYmosIHBhdGgpIHtcbiAgICBpZiAoIXBhdGgpXG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIHBhdGgucmVkdWNlKChhY2MsIGtleSkgPT4gYWNjPy5ba2V5XSwgb2JqKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwcm9taXNlQWxsT2JqZWN0KHByb21pc2VzT2JqKSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb21pc2VzT2JqKTtcbiAgICBjb25zdCBwcm9taXNlcyA9IGtleXMubWFwKChrZXkpID0+IHByb21pc2VzT2JqW2tleV0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICBjb25zdCByZXNvbHZlZE9iaiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlc29sdmVkT2JqW2tleXNbaV1dID0gcmVzdWx0c1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRPYmo7XG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tU3RyaW5nKGxlbmd0aCA9IDEwKSB7XG4gICAgY29uc3QgY2hhcnMgPSBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBzdHIgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5leHBvcnQgZnVuY3Rpb24gZXNjKHN0cikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHIpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnRyaW0oKVxuICAgICAgICAucmVwbGFjZSgvW15cXHdcXHMtXS9nLCBcIlwiKVxuICAgICAgICAucmVwbGFjZSgvW1xcc18tXSsvZywgXCItXCIpXG4gICAgICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpO1xufVxuZXhwb3J0IGNvbnN0IGNhcHR1cmVTdGFja1RyYWNlID0gKFwiY2FwdHVyZVN0YWNrVHJhY2VcIiBpbiBFcnJvciA/IEVycm9yLmNhcHR1cmVTdGFja1RyYWNlIDogKC4uLl9hcmdzKSA9PiB7IH0pO1xuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KGRhdGEpIHtcbiAgICByZXR1cm4gdHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgJiYgZGF0YSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheShkYXRhKTtcbn1cbmV4cG9ydCBjb25zdCBhbGxvd3NFdmFsID0gLyogQF9fUFVSRV9fKi8gY2FjaGVkKCgpID0+IHtcbiAgICAvLyBTa2lwIHRoZSBwcm9iZSB1bmRlciBgaml0bGVzc2A6IHN0cmljdCBDU1BzIHJlcG9ydCB0aGUgY2F1Z2h0IGBuZXcgRnVuY3Rpb25gXG4gICAgLy8gYXMgYSBgc2VjdXJpdHlwb2xpY3l2aW9sYXRpb25gIGV2ZW4gdGhvdWdoIHRoZSB0aHJvdyBpcyBzd2FsbG93ZWQuXG4gICAgaWYgKGdsb2JhbENvbmZpZy5qaXRsZXNzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdmlnYXRvcj8udXNlckFnZW50Py5pbmNsdWRlcyhcIkNsb3VkZmxhcmVcIikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBGID0gRnVuY3Rpb247XG4gICAgICAgIG5ldyBGKFwiXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY2F0Y2ggKF8pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn0pO1xuZXhwb3J0IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qobykge1xuICAgIGlmIChpc09iamVjdChvKSA9PT0gZmFsc2UpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyBtb2RpZmllZCBjb25zdHJ1Y3RvclxuICAgIGNvbnN0IGN0b3IgPSBvLmNvbnN0cnVjdG9yO1xuICAgIGlmIChjdG9yID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICh0eXBlb2YgY3RvciAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAvLyBtb2RpZmllZCBwcm90b3R5cGVcbiAgICBjb25zdCBwcm90ID0gY3Rvci5wcm90b3R5cGU7XG4gICAgaWYgKGlzT2JqZWN0KHByb3QpID09PSBmYWxzZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vIGN0b3IgZG9lc24ndCBoYXZlIHN0YXRpYyBgaXNQcm90b3R5cGVPZmBcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3QsIFwiaXNQcm90b3R5cGVPZlwiKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzaGFsbG93Q2xvbmUobykge1xuICAgIGlmIChpc1BsYWluT2JqZWN0KG8pKVxuICAgICAgICByZXR1cm4geyAuLi5vIH07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobykpXG4gICAgICAgIHJldHVybiBbLi4ub107XG4gICAgaWYgKG8gaW5zdGFuY2VvZiBNYXApXG4gICAgICAgIHJldHVybiBuZXcgTWFwKG8pO1xuICAgIGlmIChvIGluc3RhbmNlb2YgU2V0KVxuICAgICAgICByZXR1cm4gbmV3IFNldChvKTtcbiAgICByZXR1cm4gbztcbn1cbmV4cG9ydCBmdW5jdGlvbiBudW1LZXlzKGRhdGEpIHtcbiAgICBsZXQga2V5Q291bnQgPSAwO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlDb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlDb3VudDtcbn1cbmV4cG9ydCBjb25zdCBnZXRQYXJzZWRUeXBlID0gKGRhdGEpID0+IHtcbiAgICBjb25zdCB0ID0gdHlwZW9mIGRhdGE7XG4gICAgc3dpdGNoICh0KSB7XG4gICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgICAgIHJldHVybiBcInVuZGVmaW5lZFwiO1xuICAgICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJzdHJpbmdcIjtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgcmV0dXJuIE51bWJlci5pc05hTihkYXRhKSA/IFwibmFuXCIgOiBcIm51bWJlclwiO1xuICAgICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICAgICAgcmV0dXJuIFwiYm9vbGVhblwiO1xuICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIHJldHVybiBcImZ1bmN0aW9uXCI7XG4gICAgICAgIGNhc2UgXCJiaWdpbnRcIjpcbiAgICAgICAgICAgIHJldHVybiBcImJpZ2ludFwiO1xuICAgICAgICBjYXNlIFwic3ltYm9sXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJzeW1ib2xcIjtcbiAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJhcnJheVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0YS50aGVuICYmIHR5cGVvZiBkYXRhLnRoZW4gPT09IFwiZnVuY3Rpb25cIiAmJiBkYXRhLmNhdGNoICYmIHR5cGVvZiBkYXRhLmNhdGNoID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJwcm9taXNlXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIE1hcCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibWFwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIFNldCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic2V0XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIERhdGUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGF0YSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJkYXRlXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBpZiAodHlwZW9mIEZpbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGF0YSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJmaWxlXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJvYmplY3RcIjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBkYXRhIHR5cGU6ICR7dH1gKTtcbiAgICB9XG59O1xuZXhwb3J0IGNvbnN0IHByb3BlcnR5S2V5VHlwZXMgPSAvKiBAX19QVVJFX18qLyBuZXcgU2V0KFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcInN5bWJvbFwiXSk7XG5leHBvcnQgY29uc3QgcHJpbWl0aXZlVHlwZXMgPSAvKiBAX19QVVJFX18qLyBuZXcgU2V0KFtcbiAgICBcInN0cmluZ1wiLFxuICAgIFwibnVtYmVyXCIsXG4gICAgXCJiaWdpbnRcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICBcInN5bWJvbFwiLFxuICAgIFwidW5kZWZpbmVkXCIsXG5dKTtcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVSZWdleChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbi8vIHpvZC1zcGVjaWZpYyB1dGlsc1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lKGluc3QsIGRlZiwgcGFyYW1zKSB7XG4gICAgY29uc3QgY2wgPSBuZXcgaW5zdC5fem9kLmNvbnN0cihkZWYgPz8gaW5zdC5fem9kLmRlZik7XG4gICAgaWYgKCFkZWYgfHwgcGFyYW1zPy5wYXJlbnQpXG4gICAgICAgIGNsLl96b2QucGFyZW50ID0gaW5zdDtcbiAgICByZXR1cm4gY2w7XG59XG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUGFyYW1zKF9wYXJhbXMpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBfcGFyYW1zO1xuICAgIGlmICghcGFyYW1zKVxuICAgICAgICByZXR1cm4ge307XG4gICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldHVybiB7IGVycm9yOiAoKSA9PiBwYXJhbXMgfTtcbiAgICBpZiAocGFyYW1zPy5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHBhcmFtcz8uZXJyb3IgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGJvdGggYG1lc3NhZ2VgIGFuZCBgZXJyb3JgIHBhcmFtc1wiKTtcbiAgICAgICAgcGFyYW1zLmVycm9yID0gcGFyYW1zLm1lc3NhZ2U7XG4gICAgfVxuICAgIGRlbGV0ZSBwYXJhbXMubWVzc2FnZTtcbiAgICBpZiAodHlwZW9mIHBhcmFtcy5lcnJvciA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgcmV0dXJuIHsgLi4ucGFyYW1zLCBlcnJvcjogKCkgPT4gcGFyYW1zLmVycm9yIH07XG4gICAgcmV0dXJuIHBhcmFtcztcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc3BhcmVudFByb3h5KGdldHRlcikge1xuICAgIGxldCB0YXJnZXQ7XG4gICAgcmV0dXJuIG5ldyBQcm94eSh7fSwge1xuICAgICAgICBnZXQoXywgcHJvcCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIHRhcmdldCA/PyAodGFyZ2V0ID0gZ2V0dGVyKCkpO1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpO1xuICAgICAgICB9LFxuICAgICAgICBzZXQoXywgcHJvcCwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gICAgICAgICAgICB0YXJnZXQgPz8gKHRhcmdldCA9IGdldHRlcigpKTtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LnNldCh0YXJnZXQsIHByb3AsIHZhbHVlLCByZWNlaXZlcik7XG4gICAgICAgIH0sXG4gICAgICAgIGhhcyhfLCBwcm9wKSB7XG4gICAgICAgICAgICB0YXJnZXQgPz8gKHRhcmdldCA9IGdldHRlcigpKTtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0Lmhhcyh0YXJnZXQsIHByb3ApO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGVQcm9wZXJ0eShfLCBwcm9wKSB7XG4gICAgICAgICAgICB0YXJnZXQgPz8gKHRhcmdldCA9IGdldHRlcigpKTtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHRhcmdldCwgcHJvcCk7XG4gICAgICAgIH0sXG4gICAgICAgIG93bktleXMoXykge1xuICAgICAgICAgICAgdGFyZ2V0ID8/ICh0YXJnZXQgPSBnZXR0ZXIoKSk7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5vd25LZXlzKHRhcmdldCk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihfLCBwcm9wKSB7XG4gICAgICAgICAgICB0YXJnZXQgPz8gKHRhcmdldCA9IGdldHRlcigpKTtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIHByb3ApO1xuICAgICAgICB9LFxuICAgICAgICBkZWZpbmVQcm9wZXJ0eShfLCBwcm9wLCBkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICB0YXJnZXQgPz8gKHRhcmdldCA9IGdldHRlcigpKTtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICAgIH0sXG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5UHJpbWl0aXZlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIilcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCkgKyBcIm5cIjtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKVxuICAgICAgICByZXR1cm4gYFwiJHt2YWx1ZX1cImA7XG4gICAgcmV0dXJuIGAke3ZhbHVlfWA7XG59XG5leHBvcnQgZnVuY3Rpb24gb3B0aW9uYWxLZXlzKHNoYXBlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHNoYXBlKS5maWx0ZXIoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIHNoYXBlW2tdLl96b2Qub3B0aW4gPT09IFwib3B0aW9uYWxcIiAmJiBzaGFwZVtrXS5fem9kLm9wdG91dCA9PT0gXCJvcHRpb25hbFwiO1xuICAgIH0pO1xufVxuZXhwb3J0IGNvbnN0IE5VTUJFUl9GT1JNQVRfUkFOR0VTID0ge1xuICAgIHNhZmVpbnQ6IFtOdW1iZXIuTUlOX1NBRkVfSU5URUdFUiwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJdLFxuICAgIGludDMyOiBbLTIxNDc0ODM2NDgsIDIxNDc0ODM2NDddLFxuICAgIHVpbnQzMjogWzAsIDQyOTQ5NjcyOTVdLFxuICAgIGZsb2F0MzI6IFstMy40MDI4MjM0NjYzODUyODg2ZTM4LCAzLjQwMjgyMzQ2NjM4NTI4ODZlMzhdLFxuICAgIGZsb2F0NjQ6IFstTnVtYmVyLk1BWF9WQUxVRSwgTnVtYmVyLk1BWF9WQUxVRV0sXG59O1xuZXhwb3J0IGNvbnN0IEJJR0lOVF9GT1JNQVRfUkFOR0VTID0ge1xuICAgIGludDY0OiBbLyogQF9fUFVSRV9fKi8gQmlnSW50KFwiLTkyMjMzNzIwMzY4NTQ3NzU4MDhcIiksIC8qIEBfX1BVUkVfXyovIEJpZ0ludChcIjkyMjMzNzIwMzY4NTQ3NzU4MDdcIildLFxuICAgIHVpbnQ2NDogWy8qIEBfX1BVUkVfXyovIEJpZ0ludCgwKSwgLyogQF9fUFVSRV9fKi8gQmlnSW50KFwiMTg0NDY3NDQwNzM3MDk1NTE2MTVcIildLFxufTtcbmV4cG9ydCBmdW5jdGlvbiBwaWNrKHNjaGVtYSwgbWFzaykge1xuICAgIGNvbnN0IGN1cnJEZWYgPSBzY2hlbWEuX3pvZC5kZWY7XG4gICAgY29uc3QgY2hlY2tzID0gY3VyckRlZi5jaGVja3M7XG4gICAgY29uc3QgaGFzQ2hlY2tzID0gY2hlY2tzICYmIGNoZWNrcy5sZW5ndGggPiAwO1xuICAgIGlmIChoYXNDaGVja3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiLnBpY2soKSBjYW5ub3QgYmUgdXNlZCBvbiBvYmplY3Qgc2NoZW1hcyBjb250YWluaW5nIHJlZmluZW1lbnRzXCIpO1xuICAgIH1cbiAgICBjb25zdCBkZWYgPSBtZXJnZURlZnMoc2NoZW1hLl96b2QuZGVmLCB7XG4gICAgICAgIGdldCBzaGFwZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NoYXBlID0ge307XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBtYXNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIGN1cnJEZWYuc2hhcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGtleTogXCIke2tleX1cImApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW1hc2tba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgbmV3U2hhcGVba2V5XSA9IGN1cnJEZWYuc2hhcGVba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2lnblByb3AodGhpcywgXCJzaGFwZVwiLCBuZXdTaGFwZSk7IC8vIHNlbGYtY2FjaGluZ1xuICAgICAgICAgICAgcmV0dXJuIG5ld1NoYXBlO1xuICAgICAgICB9LFxuICAgICAgICBjaGVja3M6IFtdLFxuICAgIH0pO1xuICAgIHJldHVybiBjbG9uZShzY2hlbWEsIGRlZik7XG59XG5leHBvcnQgZnVuY3Rpb24gb21pdChzY2hlbWEsIG1hc2spIHtcbiAgICBjb25zdCBjdXJyRGVmID0gc2NoZW1hLl96b2QuZGVmO1xuICAgIGNvbnN0IGNoZWNrcyA9IGN1cnJEZWYuY2hlY2tzO1xuICAgIGNvbnN0IGhhc0NoZWNrcyA9IGNoZWNrcyAmJiBjaGVja3MubGVuZ3RoID4gMDtcbiAgICBpZiAoaGFzQ2hlY2tzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIi5vbWl0KCkgY2Fubm90IGJlIHVzZWQgb24gb2JqZWN0IHNjaGVtYXMgY29udGFpbmluZyByZWZpbmVtZW50c1wiKTtcbiAgICB9XG4gICAgY29uc3QgZGVmID0gbWVyZ2VEZWZzKHNjaGVtYS5fem9kLmRlZiwge1xuICAgICAgICBnZXQgc2hhcGUoKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTaGFwZSA9IHsgLi4uc2NoZW1hLl96b2QuZGVmLnNoYXBlIH07XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBtYXNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIGN1cnJEZWYuc2hhcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGtleTogXCIke2tleX1cImApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW1hc2tba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG5ld1NoYXBlW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3NpZ25Qcm9wKHRoaXMsIFwic2hhcGVcIiwgbmV3U2hhcGUpOyAvLyBzZWxmLWNhY2hpbmdcbiAgICAgICAgICAgIHJldHVybiBuZXdTaGFwZTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hlY2tzOiBbXSxcbiAgICB9KTtcbiAgICByZXR1cm4gY2xvbmUoc2NoZW1hLCBkZWYpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZChzY2hlbWEsIHNoYXBlKSB7XG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHNoYXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGlucHV0IHRvIGV4dGVuZDogZXhwZWN0ZWQgYSBwbGFpbiBvYmplY3RcIik7XG4gICAgfVxuICAgIGNvbnN0IGNoZWNrcyA9IHNjaGVtYS5fem9kLmRlZi5jaGVja3M7XG4gICAgY29uc3QgaGFzQ2hlY2tzID0gY2hlY2tzICYmIGNoZWNrcy5sZW5ndGggPiAwO1xuICAgIGlmIChoYXNDaGVja3MpIHtcbiAgICAgICAgLy8gT25seSB0aHJvdyBpZiBuZXcgc2hhcGUgb3ZlcmxhcHMgd2l0aCBleGlzdGluZyBzaGFwZVxuICAgICAgICAvLyBVc2UgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHRvIGNoZWNrIGtleSBleGlzdGVuY2Ugd2l0aG91dCBhY2Nlc3NpbmcgdmFsdWVzXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU2hhcGUgPSBzY2hlbWEuX3pvZC5kZWYuc2hhcGU7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHNoYXBlKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihleGlzdGluZ1NoYXBlLCBrZXkpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgb3ZlcndyaXRlIGtleXMgb24gb2JqZWN0IHNjaGVtYXMgY29udGFpbmluZyByZWZpbmVtZW50cy4gVXNlIGAuc2FmZUV4dGVuZCgpYCBpbnN0ZWFkLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWYgPSBtZXJnZURlZnMoc2NoZW1hLl96b2QuZGVmLCB7XG4gICAgICAgIGdldCBzaGFwZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IF9zaGFwZSA9IHsgLi4uc2NoZW1hLl96b2QuZGVmLnNoYXBlLCAuLi5zaGFwZSB9O1xuICAgICAgICAgICAgYXNzaWduUHJvcCh0aGlzLCBcInNoYXBlXCIsIF9zaGFwZSk7IC8vIHNlbGYtY2FjaGluZ1xuICAgICAgICAgICAgcmV0dXJuIF9zaGFwZTtcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gY2xvbmUoc2NoZW1hLCBkZWYpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVFeHRlbmQoc2NoZW1hLCBzaGFwZSkge1xuICAgIGlmICghaXNQbGFpbk9iamVjdChzaGFwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnB1dCB0byBzYWZlRXh0ZW5kOiBleHBlY3RlZCBhIHBsYWluIG9iamVjdFwiKTtcbiAgICB9XG4gICAgY29uc3QgZGVmID0gbWVyZ2VEZWZzKHNjaGVtYS5fem9kLmRlZiwge1xuICAgICAgICBnZXQgc2hhcGUoKSB7XG4gICAgICAgICAgICBjb25zdCBfc2hhcGUgPSB7IC4uLnNjaGVtYS5fem9kLmRlZi5zaGFwZSwgLi4uc2hhcGUgfTtcbiAgICAgICAgICAgIGFzc2lnblByb3AodGhpcywgXCJzaGFwZVwiLCBfc2hhcGUpOyAvLyBzZWxmLWNhY2hpbmdcbiAgICAgICAgICAgIHJldHVybiBfc2hhcGU7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGNsb25lKHNjaGVtYSwgZGVmKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZShhLCBiKSB7XG4gICAgaWYgKGEuX3pvZC5kZWYuY2hlY2tzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiLm1lcmdlKCkgY2Fubm90IGJlIHVzZWQgb24gb2JqZWN0IHNjaGVtYXMgY29udGFpbmluZyByZWZpbmVtZW50cy4gVXNlIC5zYWZlRXh0ZW5kKCkgaW5zdGVhZC5cIik7XG4gICAgfVxuICAgIGNvbnN0IGRlZiA9IG1lcmdlRGVmcyhhLl96b2QuZGVmLCB7XG4gICAgICAgIGdldCBzaGFwZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IF9zaGFwZSA9IHsgLi4uYS5fem9kLmRlZi5zaGFwZSwgLi4uYi5fem9kLmRlZi5zaGFwZSB9O1xuICAgICAgICAgICAgYXNzaWduUHJvcCh0aGlzLCBcInNoYXBlXCIsIF9zaGFwZSk7IC8vIHNlbGYtY2FjaGluZ1xuICAgICAgICAgICAgcmV0dXJuIF9zaGFwZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IGNhdGNoYWxsKCkge1xuICAgICAgICAgICAgcmV0dXJuIGIuX3pvZC5kZWYuY2F0Y2hhbGw7XG4gICAgICAgIH0sXG4gICAgICAgIGNoZWNrczogYi5fem9kLmRlZi5jaGVja3MgPz8gW10sXG4gICAgfSk7XG4gICAgcmV0dXJuIGNsb25lKGEsIGRlZik7XG59XG5leHBvcnQgZnVuY3Rpb24gcGFydGlhbChDbGFzcywgc2NoZW1hLCBtYXNrKSB7XG4gICAgY29uc3QgY3VyckRlZiA9IHNjaGVtYS5fem9kLmRlZjtcbiAgICBjb25zdCBjaGVja3MgPSBjdXJyRGVmLmNoZWNrcztcbiAgICBjb25zdCBoYXNDaGVja3MgPSBjaGVja3MgJiYgY2hlY2tzLmxlbmd0aCA+IDA7XG4gICAgaWYgKGhhc0NoZWNrcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIucGFydGlhbCgpIGNhbm5vdCBiZSB1c2VkIG9uIG9iamVjdCBzY2hlbWFzIGNvbnRhaW5pbmcgcmVmaW5lbWVudHNcIik7XG4gICAgfVxuICAgIGNvbnN0IGRlZiA9IG1lcmdlRGVmcyhzY2hlbWEuX3pvZC5kZWYsIHtcbiAgICAgICAgZ2V0IHNoYXBlKCkge1xuICAgICAgICAgICAgY29uc3Qgb2xkU2hhcGUgPSBzY2hlbWEuX3pvZC5kZWYuc2hhcGU7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHsgLi4ub2xkU2hhcGUgfTtcbiAgICAgICAgICAgIGlmIChtYXNrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWFzaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gb2xkU2hhcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBrZXk6IFwiJHtrZXl9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hc2tba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAob2xkU2hhcGVba2V5XSEuX3pvZC5vcHRpbiA9PT0gXCJvcHRpb25hbFwiKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgc2hhcGVba2V5XSA9IENsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5ldyBDbGFzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvcHRpb25hbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyVHlwZTogb2xkU2hhcGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG9sZFNoYXBlW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gb2xkU2hhcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKG9sZFNoYXBlW2tleV0hLl96b2Qub3B0aW4gPT09IFwib3B0aW9uYWxcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlW2tleV0gPSBDbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBuZXcgQ2xhc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib3B0aW9uYWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbm5lclR5cGU6IG9sZFNoYXBlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBvbGRTaGFwZVtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2lnblByb3AodGhpcywgXCJzaGFwZVwiLCBzaGFwZSk7IC8vIHNlbGYtY2FjaGluZ1xuICAgICAgICAgICAgcmV0dXJuIHNoYXBlO1xuICAgICAgICB9LFxuICAgICAgICBjaGVja3M6IFtdLFxuICAgIH0pO1xuICAgIHJldHVybiBjbG9uZShzY2hlbWEsIGRlZik7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZWQoQ2xhc3MsIHNjaGVtYSwgbWFzaykge1xuICAgIGNvbnN0IGRlZiA9IG1lcmdlRGVmcyhzY2hlbWEuX3pvZC5kZWYsIHtcbiAgICAgICAgZ2V0IHNoYXBlKCkge1xuICAgICAgICAgICAgY29uc3Qgb2xkU2hhcGUgPSBzY2hlbWEuX3pvZC5kZWYuc2hhcGU7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHsgLi4ub2xkU2hhcGUgfTtcbiAgICAgICAgICAgIGlmIChtYXNrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWFzaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gc2hhcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBrZXk6IFwiJHtrZXl9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hc2tba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBvdmVyd3JpdGUgd2l0aCBub24tb3B0aW9uYWxcbiAgICAgICAgICAgICAgICAgICAgc2hhcGVba2V5XSA9IG5ldyBDbGFzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm5vbm9wdGlvbmFsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbm5lclR5cGU6IG9sZFNoYXBlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9sZFNoYXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG92ZXJ3cml0ZSB3aXRoIG5vbi1vcHRpb25hbFxuICAgICAgICAgICAgICAgICAgICBzaGFwZVtrZXldID0gbmV3IENsYXNzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibm9ub3B0aW9uYWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyVHlwZTogb2xkU2hhcGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzaWduUHJvcCh0aGlzLCBcInNoYXBlXCIsIHNoYXBlKTsgLy8gc2VsZi1jYWNoaW5nXG4gICAgICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGNsb25lKHNjaGVtYSwgZGVmKTtcbn1cbi8vIGludmFsaWRfdHlwZSB8IHRvb19iaWcgfCB0b29fc21hbGwgfCBpbnZhbGlkX2Zvcm1hdCB8IG5vdF9tdWx0aXBsZV9vZiB8IHVucmVjb2duaXplZF9rZXlzIHwgaW52YWxpZF91bmlvbiB8IGludmFsaWRfa2V5IHwgaW52YWxpZF9lbGVtZW50IHwgaW52YWxpZF92YWx1ZSB8IGN1c3RvbVxuZXhwb3J0IGZ1bmN0aW9uIGFib3J0ZWQoeCwgc3RhcnRJbmRleCA9IDApIHtcbiAgICBpZiAoeC5hYm9ydGVkID09PSB0cnVlKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IHguaXNzdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4Lmlzc3Vlc1tpXT8uY29udGludWUgIT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbi8vIENoZWNrcyBmb3IgZXhwbGljaXQgYWJvcnQgKGNvbnRpbnVlID09PSBmYWxzZSksIGFzIG9wcG9zZWQgdG8gaW1wbGljaXQgYWJvcnQgKGNvbnRpbnVlID09PSB1bmRlZmluZWQpLlxuLy8gVXNlZCB0byByZXNwZWN0IGBhYm9ydDogdHJ1ZWAgaW4gLnJlZmluZSgpIGV2ZW4gZm9yIGNoZWNrcyB0aGF0IGhhdmUgYSBgd2hlbmAgZnVuY3Rpb24uXG5leHBvcnQgZnVuY3Rpb24gZXhwbGljaXRseUFib3J0ZWQoeCwgc3RhcnRJbmRleCA9IDApIHtcbiAgICBpZiAoeC5hYm9ydGVkID09PSB0cnVlKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IHguaXNzdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4Lmlzc3Vlc1tpXT8uY29udGludWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gcHJlZml4SXNzdWVzKHBhdGgsIGlzc3Vlcykge1xuICAgIHJldHVybiBpc3N1ZXMubWFwKChpc3MpID0+IHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICAoX2EgPSBpc3MpLnBhdGggPz8gKF9hLnBhdGggPSBbXSk7XG4gICAgICAgIGlzcy5wYXRoLnVuc2hpZnQocGF0aCk7XG4gICAgICAgIHJldHVybiBpc3M7XG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gdW53cmFwTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiID8gbWVzc2FnZSA6IG1lc3NhZ2U/Lm1lc3NhZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZmluYWxpemVJc3N1ZShpc3MsIGN0eCwgY29uZmlnKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGlzcy5tZXNzYWdlXG4gICAgICAgID8gaXNzLm1lc3NhZ2VcbiAgICAgICAgOiAodW53cmFwTWVzc2FnZShpc3MuaW5zdD8uX3pvZC5kZWY/LmVycm9yPy4oaXNzKSkgPz9cbiAgICAgICAgICAgIHVud3JhcE1lc3NhZ2UoY3R4Py5lcnJvcj8uKGlzcykpID8/XG4gICAgICAgICAgICB1bndyYXBNZXNzYWdlKGNvbmZpZy5jdXN0b21FcnJvcj8uKGlzcykpID8/XG4gICAgICAgICAgICB1bndyYXBNZXNzYWdlKGNvbmZpZy5sb2NhbGVFcnJvcj8uKGlzcykpID8/XG4gICAgICAgICAgICBcIkludmFsaWQgaW5wdXRcIik7XG4gICAgY29uc3QgeyBpbnN0OiBfaW5zdCwgY29udGludWU6IF9jb250aW51ZSwgaW5wdXQ6IF9pbnB1dCwgLi4ucmVzdCB9ID0gaXNzO1xuICAgIHJlc3QucGF0aCA/PyAocmVzdC5wYXRoID0gW10pO1xuICAgIHJlc3QubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgaWYgKGN0eD8ucmVwb3J0SW5wdXQpIHtcbiAgICAgICAgcmVzdC5pbnB1dCA9IF9pbnB1dDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3Q7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0U2l6YWJsZU9yaWdpbihpbnB1dCkge1xuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFNldClcbiAgICAgICAgcmV0dXJuIFwic2V0XCI7XG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgTWFwKVxuICAgICAgICByZXR1cm4gXCJtYXBcIjtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRmlsZSlcbiAgICAgICAgcmV0dXJuIFwiZmlsZVwiO1xuICAgIHJldHVybiBcInVua25vd25cIjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMZW5ndGhhYmxlT3JpZ2luKGlucHV0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgICByZXR1cm4gXCJhcnJheVwiO1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldHVybiBcInN0cmluZ1wiO1xuICAgIHJldHVybiBcInVua25vd25cIjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZWRUeXBlKGRhdGEpIHtcbiAgICBjb25zdCB0ID0gdHlwZW9mIGRhdGE7XG4gICAgc3dpdGNoICh0KSB7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjoge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlci5pc05hTihkYXRhKSA/IFwibmFuXCIgOiBcIm51bWJlclwiO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJvYmplY3RcIjoge1xuICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImFycmF5XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvYmogPSBkYXRhO1xuICAgICAgICAgICAgaWYgKG9iaiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBcImNvbnN0cnVjdG9yXCIgaW4gb2JqICYmIG9iai5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmouY29uc3RydWN0b3IubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc3N1ZSguLi5hcmdzKSB7XG4gICAgY29uc3QgW2lzcywgaW5wdXQsIGluc3RdID0gYXJncztcbiAgICBpZiAodHlwZW9mIGlzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWVzc2FnZTogaXNzLFxuICAgICAgICAgICAgY29kZTogXCJjdXN0b21cIixcbiAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgaW5zdCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgLi4uaXNzIH07XG59XG5leHBvcnQgZnVuY3Rpb24gY2xlYW5FbnVtKG9iaikge1xuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhvYmopXG4gICAgICAgIC5maWx0ZXIoKFtrLCBfXSkgPT4ge1xuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBpZiBOYU4sIG1lYW5pbmcgaXQncyBub3QgYSBudW1iZXIsIHRodXMgYSBzdHJpbmcga2V5XG4gICAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4oTnVtYmVyLnBhcnNlSW50KGssIDEwKSk7XG4gICAgfSlcbiAgICAgICAgLm1hcCgoZWwpID0+IGVsWzFdKTtcbn1cbi8vIENvZGVjIHV0aWxpdHkgZnVuY3Rpb25zXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0VG9VaW50OEFycmF5KGJhc2U2NCkge1xuICAgIGNvbnN0IGJpbmFyeVN0cmluZyA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJpbmFyeVN0cmluZy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5U3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJ5dGVzW2ldID0gYmluYXJ5U3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbn1cbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9CYXNlNjQoYnl0ZXMpIHtcbiAgICBsZXQgYmluYXJ5U3RyaW5nID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJpbmFyeVN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ0b2EoYmluYXJ5U3RyaW5nKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjR1cmxUb1VpbnQ4QXJyYXkoYmFzZTY0dXJsKSB7XG4gICAgY29uc3QgYmFzZTY0ID0gYmFzZTY0dXJsLnJlcGxhY2UoLy0vZywgXCIrXCIpLnJlcGxhY2UoL18vZywgXCIvXCIpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSBcIj1cIi5yZXBlYXQoKDQgLSAoYmFzZTY0Lmxlbmd0aCAlIDQpKSAlIDQpO1xuICAgIHJldHVybiBiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0ICsgcGFkZGluZyk7XG59XG5leHBvcnQgZnVuY3Rpb24gdWludDhBcnJheVRvQmFzZTY0dXJsKGJ5dGVzKSB7XG4gICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0Jhc2U2NChieXRlcykucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0vZywgXCJcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gaGV4VG9VaW50OEFycmF5KGhleCkge1xuICAgIGNvbnN0IGNsZWFuSGV4ID0gaGV4LnJlcGxhY2UoL14weC8sIFwiXCIpO1xuICAgIGlmIChjbGVhbkhleC5sZW5ndGggJSAyICE9PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaGV4IHN0cmluZyBsZW5ndGhcIik7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoY2xlYW5IZXgubGVuZ3RoIC8gMik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbkhleC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBieXRlc1tpIC8gMl0gPSBOdW1iZXIucGFyc2VJbnQoY2xlYW5IZXguc2xpY2UoaSwgaSArIDIpLCAxNik7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbn1cbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9IZXgoYnl0ZXMpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShieXRlcylcbiAgICAgICAgLm1hcCgoYikgPT4gYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpKVxuICAgICAgICAuam9pbihcIlwiKTtcbn1cbi8vIGluc3RhbmNlb2ZcbmV4cG9ydCBjbGFzcyBDbGFzcyB7XG4gICAgY29uc3RydWN0b3IoLi4uX2FyZ3MpIHsgfVxufVxuIiwiaW1wb3J0IHsgJGNvbnN0cnVjdG9yIH0gZnJvbSBcIi4vY29yZS5qc1wiO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwiLi91dGlsLmpzXCI7XG5jb25zdCBpbml0aWFsaXplciA9IChpbnN0LCBkZWYpID0+IHtcbiAgICBpbnN0Lm5hbWUgPSBcIiRab2RFcnJvclwiO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpbnN0LCBcIl96b2RcIiwge1xuICAgICAgICB2YWx1ZTogaW5zdC5fem9kLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5zdCwgXCJpc3N1ZXNcIiwge1xuICAgICAgICB2YWx1ZTogZGVmLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcbiAgICBpbnN0Lm1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShkZWYsIHV0aWwuanNvblN0cmluZ2lmeVJlcGxhY2VyLCAyKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5zdCwgXCJ0b1N0cmluZ1wiLCB7XG4gICAgICAgIHZhbHVlOiAoKSA9PiBpbnN0Lm1lc3NhZ2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIH0pO1xufTtcbmV4cG9ydCBjb25zdCAkWm9kRXJyb3IgPSAkY29uc3RydWN0b3IoXCIkWm9kRXJyb3JcIiwgaW5pdGlhbGl6ZXIpO1xuZXhwb3J0IGNvbnN0ICRab2RSZWFsRXJyb3IgPSAkY29uc3RydWN0b3IoXCIkWm9kRXJyb3JcIiwgaW5pdGlhbGl6ZXIsIHsgUGFyZW50OiBFcnJvciB9KTtcbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuRXJyb3IoZXJyb3IsIG1hcHBlciA9IChpc3N1ZSkgPT4gaXNzdWUubWVzc2FnZSkge1xuICAgIGNvbnN0IGZpZWxkRXJyb3JzID0ge307XG4gICAgY29uc3QgZm9ybUVycm9ycyA9IFtdO1xuICAgIGZvciAoY29uc3Qgc3ViIG9mIGVycm9yLmlzc3Vlcykge1xuICAgICAgICBpZiAoc3ViLnBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZmllbGRFcnJvcnNbc3ViLnBhdGhbMF1dID0gZmllbGRFcnJvcnNbc3ViLnBhdGhbMF1dIHx8IFtdO1xuICAgICAgICAgICAgZmllbGRFcnJvcnNbc3ViLnBhdGhbMF1dLnB1c2gobWFwcGVyKHN1YikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9ybUVycm9ycy5wdXNoKG1hcHBlcihzdWIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBmb3JtRXJyb3JzLCBmaWVsZEVycm9ycyB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEVycm9yKGVycm9yLCBtYXBwZXIgPSAoaXNzdWUpID0+IGlzc3VlLm1lc3NhZ2UpIHtcbiAgICBjb25zdCBmaWVsZEVycm9ycyA9IHsgX2Vycm9yczogW10gfTtcbiAgICBjb25zdCBwcm9jZXNzRXJyb3IgPSAoZXJyb3IsIHBhdGggPSBbXSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGVycm9yLmlzc3Vlcykge1xuICAgICAgICAgICAgaWYgKGlzc3VlLmNvZGUgPT09IFwiaW52YWxpZF91bmlvblwiICYmIGlzc3VlLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZS5lcnJvcnMubWFwKChpc3N1ZXMpID0+IHByb2Nlc3NFcnJvcih7IGlzc3VlcyB9LCBbLi4ucGF0aCwgLi4uaXNzdWUucGF0aF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzc3VlLmNvZGUgPT09IFwiaW52YWxpZF9rZXlcIikge1xuICAgICAgICAgICAgICAgIHByb2Nlc3NFcnJvcih7IGlzc3VlczogaXNzdWUuaXNzdWVzIH0sIFsuLi5wYXRoLCAuLi5pc3N1ZS5wYXRoXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS5jb2RlID09PSBcImludmFsaWRfZWxlbWVudFwiKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0Vycm9yKHsgaXNzdWVzOiBpc3N1ZS5pc3N1ZXMgfSwgWy4uLnBhdGgsIC4uLmlzc3VlLnBhdGhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxwYXRoID0gWy4uLnBhdGgsIC4uLmlzc3VlLnBhdGhdO1xuICAgICAgICAgICAgICAgIGlmIChmdWxscGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRFcnJvcnMuX2Vycm9ycy5wdXNoKG1hcHBlcihpc3N1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnIgPSBmaWVsZEVycm9ycztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGZ1bGxwYXRoLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBmdWxscGF0aFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlcm1pbmFsID0gaSA9PT0gZnVsbHBhdGgubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGVybWluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IHsgX2Vycm9yczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJbZWxdID0gY3VycltlbF0gfHwgeyBfZXJyb3JzOiBbXSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJbZWxdLl9lcnJvcnMucHVzaChtYXBwZXIoaXNzdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSBjdXJyW2VsXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcHJvY2Vzc0Vycm9yKGVycm9yKTtcbiAgICByZXR1cm4gZmllbGRFcnJvcnM7XG59XG5leHBvcnQgZnVuY3Rpb24gdHJlZWlmeUVycm9yKGVycm9yLCBtYXBwZXIgPSAoaXNzdWUpID0+IGlzc3VlLm1lc3NhZ2UpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7IGVycm9yczogW10gfTtcbiAgICBjb25zdCBwcm9jZXNzRXJyb3IgPSAoZXJyb3IsIHBhdGggPSBbXSkgPT4ge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGVycm9yLmlzc3Vlcykge1xuICAgICAgICAgICAgaWYgKGlzc3VlLmNvZGUgPT09IFwiaW52YWxpZF91bmlvblwiICYmIGlzc3VlLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyByZWd1bGFyIHVuaW9uIGVycm9yXG4gICAgICAgICAgICAgICAgaXNzdWUuZXJyb3JzLm1hcCgoaXNzdWVzKSA9PiBwcm9jZXNzRXJyb3IoeyBpc3N1ZXMgfSwgWy4uLnBhdGgsIC4uLmlzc3VlLnBhdGhdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc3N1ZS5jb2RlID09PSBcImludmFsaWRfa2V5XCIpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRXJyb3IoeyBpc3N1ZXM6IGlzc3VlLmlzc3VlcyB9LCBbLi4ucGF0aCwgLi4uaXNzdWUucGF0aF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNzdWUuY29kZSA9PT0gXCJpbnZhbGlkX2VsZW1lbnRcIikge1xuICAgICAgICAgICAgICAgIHByb2Nlc3NFcnJvcih7IGlzc3VlczogaXNzdWUuaXNzdWVzIH0sIFsuLi5wYXRoLCAuLi5pc3N1ZS5wYXRoXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxscGF0aCA9IFsuLi5wYXRoLCAuLi5pc3N1ZS5wYXRoXTtcbiAgICAgICAgICAgICAgICBpZiAoZnVsbHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaChtYXBwZXIoaXNzdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBjdXJyID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGZ1bGxwYXRoLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGZ1bGxwYXRoW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXJtaW5hbCA9IGkgPT09IGZ1bGxwYXRoLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIucHJvcGVydGllcyA/PyAoY3Vyci5wcm9wZXJ0aWVzID0ge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgKF9hID0gY3Vyci5wcm9wZXJ0aWVzKVtlbF0gPz8gKF9hW2VsXSA9IHsgZXJyb3JzOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSBjdXJyLnByb3BlcnRpZXNbZWxdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyci5pdGVtcyA/PyAoY3Vyci5pdGVtcyA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChfYiA9IGN1cnIuaXRlbXMpW2VsXSA/PyAoX2JbZWxdID0geyBlcnJvcnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyciA9IGN1cnIuaXRlbXNbZWxdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXJtaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyci5lcnJvcnMucHVzaChtYXBwZXIoaXNzdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBwcm9jZXNzRXJyb3IoZXJyb3IpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG4vKiogRm9ybWF0IGEgWm9kRXJyb3IgYXMgYSBodW1hbi1yZWFkYWJsZSBzdHJpbmcgaW4gdGhlIGZvbGxvd2luZyBmb3JtLlxuICpcbiAqIEZyb21cbiAqXG4gKiBgYGB0c1xuICogWm9kRXJyb3Ige1xuICogICBpc3N1ZXM6IFtcbiAqICAgICB7XG4gKiAgICAgICBleHBlY3RlZDogJ3N0cmluZycsXG4gKiAgICAgICBjb2RlOiAnaW52YWxpZF90eXBlJyxcbiAqICAgICAgIHBhdGg6IFsgJ3VzZXJuYW1lJyBdLFxuICogICAgICAgbWVzc2FnZTogJ0ludmFsaWQgaW5wdXQ6IGV4cGVjdGVkIHN0cmluZydcbiAqICAgICB9LFxuICogICAgIHtcbiAqICAgICAgIGV4cGVjdGVkOiAnbnVtYmVyJyxcbiAqICAgICAgIGNvZGU6ICdpbnZhbGlkX3R5cGUnLFxuICogICAgICAgcGF0aDogWyAnZmF2b3JpdGVOdW1iZXJzJywgMSBdLFxuICogICAgICAgbWVzc2FnZTogJ0ludmFsaWQgaW5wdXQ6IGV4cGVjdGVkIG51bWJlcidcbiAqICAgICB9XG4gKiAgIF07XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiB0b1xuICpcbiAqIGBgYFxuICogdXNlcm5hbWVcbiAqICAg4pyWIEV4cGVjdGVkIG51bWJlciwgcmVjZWl2ZWQgc3RyaW5nIGF0IFwidXNlcm5hbWVcbiAqIGZhdm9yaXRlTnVtYmVyc1swXVxuICogICDinJYgSW52YWxpZCBpbnB1dDogZXhwZWN0ZWQgbnVtYmVyXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRG90UGF0aChfcGF0aCkge1xuICAgIGNvbnN0IHNlZ3MgPSBbXTtcbiAgICBjb25zdCBwYXRoID0gX3BhdGgubWFwKChzZWcpID0+ICh0eXBlb2Ygc2VnID09PSBcIm9iamVjdFwiID8gc2VnLmtleSA6IHNlZykpO1xuICAgIGZvciAoY29uc3Qgc2VnIG9mIHBhdGgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWcgPT09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICBzZWdzLnB1c2goYFske3NlZ31dYCk7XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzZWcgPT09IFwic3ltYm9sXCIpXG4gICAgICAgICAgICBzZWdzLnB1c2goYFske0pTT04uc3RyaW5naWZ5KFN0cmluZyhzZWcpKX1dYCk7XG4gICAgICAgIGVsc2UgaWYgKC9bXlxcdyRdLy50ZXN0KHNlZykpXG4gICAgICAgICAgICBzZWdzLnB1c2goYFske0pTT04uc3RyaW5naWZ5KHNlZyl9XWApO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzZWdzLmxlbmd0aClcbiAgICAgICAgICAgICAgICBzZWdzLnB1c2goXCIuXCIpO1xuICAgICAgICAgICAgc2Vncy5wdXNoKHNlZyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlZ3Muam9pbihcIlwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwcmV0dGlmeUVycm9yKGVycm9yKSB7XG4gICAgY29uc3QgbGluZXMgPSBbXTtcbiAgICAvLyBzb3J0IGJ5IHBhdGggbGVuZ3RoXG4gICAgY29uc3QgaXNzdWVzID0gWy4uLmVycm9yLmlzc3Vlc10uc29ydCgoYSwgYikgPT4gKGEucGF0aCA/PyBbXSkubGVuZ3RoIC0gKGIucGF0aCA/PyBbXSkubGVuZ3RoKTtcbiAgICAvLyBQcm9jZXNzIGVhY2ggaXNzdWVcbiAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGlzc3Vlcykge1xuICAgICAgICBsaW5lcy5wdXNoKGDinJYgJHtpc3N1ZS5tZXNzYWdlfWApO1xuICAgICAgICBpZiAoaXNzdWUucGF0aD8ubGVuZ3RoKVxuICAgICAgICAgICAgbGluZXMucHVzaChgICDihpIgYXQgJHt0b0RvdFBhdGgoaXNzdWUucGF0aCl9YCk7XG4gICAgfVxuICAgIC8vIENvbnZlcnQgTWFwIHRvIGZvcm1hdHRlZCBzdHJpbmdcbiAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cbiIsImltcG9ydCAqIGFzIGNvcmUgZnJvbSBcIi4vY29yZS5qc1wiO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gXCIuL2Vycm9ycy5qc1wiO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwiLi91dGlsLmpzXCI7XG5leHBvcnQgY29uc3QgX3BhcnNlID0gKF9FcnIpID0+IChzY2hlbWEsIHZhbHVlLCBfY3R4LCBfcGFyYW1zKSA9PiB7XG4gICAgY29uc3QgY3R4ID0gX2N0eCA/IHsgLi4uX2N0eCwgYXN5bmM6IGZhbHNlIH0gOiB7IGFzeW5jOiBmYWxzZSB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5fem9kLnJ1bih7IHZhbHVlLCBpc3N1ZXM6IFtdIH0sIGN0eCk7XG4gICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IGNvcmUuJFpvZEFzeW5jRXJyb3IoKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5pc3N1ZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGUgPSBuZXcgKF9wYXJhbXM/LkVyciA/PyBfRXJyKShyZXN1bHQuaXNzdWVzLm1hcCgoaXNzKSA9PiB1dGlsLmZpbmFsaXplSXNzdWUoaXNzLCBjdHgsIGNvcmUuY29uZmlnKCkpKSk7XG4gICAgICAgIHV0aWwuY2FwdHVyZVN0YWNrVHJhY2UoZSwgX3BhcmFtcz8uY2FsbGVlKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbn07XG5leHBvcnQgY29uc3QgcGFyc2UgPSAvKiBAX19QVVJFX18qLyBfcGFyc2UoZXJyb3JzLiRab2RSZWFsRXJyb3IpO1xuZXhwb3J0IGNvbnN0IF9wYXJzZUFzeW5jID0gKF9FcnIpID0+IGFzeW5jIChzY2hlbWEsIHZhbHVlLCBfY3R4LCBwYXJhbXMpID0+IHtcbiAgICBjb25zdCBjdHggPSBfY3R4ID8geyAuLi5fY3R4LCBhc3luYzogdHJ1ZSB9IDogeyBhc3luYzogdHJ1ZSB9O1xuICAgIGxldCByZXN1bHQgPSBzY2hlbWEuX3pvZC5ydW4oeyB2YWx1ZSwgaXNzdWVzOiBbXSB9LCBjdHgpO1xuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKVxuICAgICAgICByZXN1bHQgPSBhd2FpdCByZXN1bHQ7XG4gICAgaWYgKHJlc3VsdC5pc3N1ZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGUgPSBuZXcgKHBhcmFtcz8uRXJyID8/IF9FcnIpKHJlc3VsdC5pc3N1ZXMubWFwKChpc3MpID0+IHV0aWwuZmluYWxpemVJc3N1ZShpc3MsIGN0eCwgY29yZS5jb25maWcoKSkpKTtcbiAgICAgICAgdXRpbC5jYXB0dXJlU3RhY2tUcmFjZShlLCBwYXJhbXM/LmNhbGxlZSk7XG4gICAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG59O1xuZXhwb3J0IGNvbnN0IHBhcnNlQXN5bmMgPSAvKiBAX19QVVJFX18qLyBfcGFyc2VBc3luYyhlcnJvcnMuJFpvZFJlYWxFcnJvcik7XG5leHBvcnQgY29uc3QgX3NhZmVQYXJzZSA9IChfRXJyKSA9PiAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIGNvbnN0IGN0eCA9IF9jdHggPyB7IC4uLl9jdHgsIGFzeW5jOiBmYWxzZSB9IDogeyBhc3luYzogZmFsc2UgfTtcbiAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuX3pvZC5ydW4oeyB2YWx1ZSwgaXNzdWVzOiBbXSB9LCBjdHgpO1xuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHRocm93IG5ldyBjb3JlLiRab2RBc3luY0Vycm9yKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuaXNzdWVzLmxlbmd0aFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IG5ldyAoX0VyciA/PyBlcnJvcnMuJFpvZEVycm9yKShyZXN1bHQuaXNzdWVzLm1hcCgoaXNzKSA9PiB1dGlsLmZpbmFsaXplSXNzdWUoaXNzLCBjdHgsIGNvcmUuY29uZmlnKCkpKSksXG4gICAgICAgIH1cbiAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC52YWx1ZSB9O1xufTtcbmV4cG9ydCBjb25zdCBzYWZlUGFyc2UgPSAvKiBAX19QVVJFX18qLyBfc2FmZVBhcnNlKGVycm9ycy4kWm9kUmVhbEVycm9yKTtcbmV4cG9ydCBjb25zdCBfc2FmZVBhcnNlQXN5bmMgPSAoX0VycikgPT4gYXN5bmMgKHNjaGVtYSwgdmFsdWUsIF9jdHgpID0+IHtcbiAgICBjb25zdCBjdHggPSBfY3R4ID8geyAuLi5fY3R4LCBhc3luYzogdHJ1ZSB9IDogeyBhc3luYzogdHJ1ZSB9O1xuICAgIGxldCByZXN1bHQgPSBzY2hlbWEuX3pvZC5ydW4oeyB2YWx1ZSwgaXNzdWVzOiBbXSB9LCBjdHgpO1xuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKVxuICAgICAgICByZXN1bHQgPSBhd2FpdCByZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5pc3N1ZXMubGVuZ3RoXG4gICAgICAgID8ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogbmV3IF9FcnIocmVzdWx0Lmlzc3Vlcy5tYXAoKGlzcykgPT4gdXRpbC5maW5hbGl6ZUlzc3VlKGlzcywgY3R4LCBjb3JlLmNvbmZpZygpKSkpLFxuICAgICAgICB9XG4gICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQudmFsdWUgfTtcbn07XG5leHBvcnQgY29uc3Qgc2FmZVBhcnNlQXN5bmMgPSAvKiBAX19QVVJFX18qLyBfc2FmZVBhcnNlQXN5bmMoZXJyb3JzLiRab2RSZWFsRXJyb3IpO1xuZXhwb3J0IGNvbnN0IF9lbmNvZGUgPSAoX0VycikgPT4gKHNjaGVtYSwgdmFsdWUsIF9jdHgpID0+IHtcbiAgICBjb25zdCBjdHggPSBfY3R4ID8geyAuLi5fY3R4LCBkaXJlY3Rpb246IFwiYmFja3dhcmRcIiB9IDogeyBkaXJlY3Rpb246IFwiYmFja3dhcmRcIiB9O1xuICAgIHJldHVybiBfcGFyc2UoX0Vycikoc2NoZW1hLCB2YWx1ZSwgY3R4KTtcbn07XG5leHBvcnQgY29uc3QgZW5jb2RlID0gLyogQF9fUFVSRV9fKi8gX2VuY29kZShlcnJvcnMuJFpvZFJlYWxFcnJvcik7XG5leHBvcnQgY29uc3QgX2RlY29kZSA9IChfRXJyKSA9PiAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIHJldHVybiBfcGFyc2UoX0Vycikoc2NoZW1hLCB2YWx1ZSwgX2N0eCk7XG59O1xuZXhwb3J0IGNvbnN0IGRlY29kZSA9IC8qIEBfX1BVUkVfXyovIF9kZWNvZGUoZXJyb3JzLiRab2RSZWFsRXJyb3IpO1xuZXhwb3J0IGNvbnN0IF9lbmNvZGVBc3luYyA9IChfRXJyKSA9PiBhc3luYyAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIGNvbnN0IGN0eCA9IF9jdHggPyB7IC4uLl9jdHgsIGRpcmVjdGlvbjogXCJiYWNrd2FyZFwiIH0gOiB7IGRpcmVjdGlvbjogXCJiYWNrd2FyZFwiIH07XG4gICAgcmV0dXJuIF9wYXJzZUFzeW5jKF9FcnIpKHNjaGVtYSwgdmFsdWUsIGN0eCk7XG59O1xuZXhwb3J0IGNvbnN0IGVuY29kZUFzeW5jID0gLyogQF9fUFVSRV9fKi8gX2VuY29kZUFzeW5jKGVycm9ycy4kWm9kUmVhbEVycm9yKTtcbmV4cG9ydCBjb25zdCBfZGVjb2RlQXN5bmMgPSAoX0VycikgPT4gYXN5bmMgKHNjaGVtYSwgdmFsdWUsIF9jdHgpID0+IHtcbiAgICByZXR1cm4gX3BhcnNlQXN5bmMoX0Vycikoc2NoZW1hLCB2YWx1ZSwgX2N0eCk7XG59O1xuZXhwb3J0IGNvbnN0IGRlY29kZUFzeW5jID0gLyogQF9fUFVSRV9fKi8gX2RlY29kZUFzeW5jKGVycm9ycy4kWm9kUmVhbEVycm9yKTtcbmV4cG9ydCBjb25zdCBfc2FmZUVuY29kZSA9IChfRXJyKSA9PiAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIGNvbnN0IGN0eCA9IF9jdHggPyB7IC4uLl9jdHgsIGRpcmVjdGlvbjogXCJiYWNrd2FyZFwiIH0gOiB7IGRpcmVjdGlvbjogXCJiYWNrd2FyZFwiIH07XG4gICAgcmV0dXJuIF9zYWZlUGFyc2UoX0Vycikoc2NoZW1hLCB2YWx1ZSwgY3R4KTtcbn07XG5leHBvcnQgY29uc3Qgc2FmZUVuY29kZSA9IC8qIEBfX1BVUkVfXyovIF9zYWZlRW5jb2RlKGVycm9ycy4kWm9kUmVhbEVycm9yKTtcbmV4cG9ydCBjb25zdCBfc2FmZURlY29kZSA9IChfRXJyKSA9PiAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIHJldHVybiBfc2FmZVBhcnNlKF9FcnIpKHNjaGVtYSwgdmFsdWUsIF9jdHgpO1xufTtcbmV4cG9ydCBjb25zdCBzYWZlRGVjb2RlID0gLyogQF9fUFVSRV9fKi8gX3NhZmVEZWNvZGUoZXJyb3JzLiRab2RSZWFsRXJyb3IpO1xuZXhwb3J0IGNvbnN0IF9zYWZlRW5jb2RlQXN5bmMgPSAoX0VycikgPT4gYXN5bmMgKHNjaGVtYSwgdmFsdWUsIF9jdHgpID0+IHtcbiAgICBjb25zdCBjdHggPSBfY3R4ID8geyAuLi5fY3R4LCBkaXJlY3Rpb246IFwiYmFja3dhcmRcIiB9IDogeyBkaXJlY3Rpb246IFwiYmFja3dhcmRcIiB9O1xuICAgIHJldHVybiBfc2FmZVBhcnNlQXN5bmMoX0Vycikoc2NoZW1hLCB2YWx1ZSwgY3R4KTtcbn07XG5leHBvcnQgY29uc3Qgc2FmZUVuY29kZUFzeW5jID0gLyogQF9fUFVSRV9fKi8gX3NhZmVFbmNvZGVBc3luYyhlcnJvcnMuJFpvZFJlYWxFcnJvcik7XG5leHBvcnQgY29uc3QgX3NhZmVEZWNvZGVBc3luYyA9IChfRXJyKSA9PiBhc3luYyAoc2NoZW1hLCB2YWx1ZSwgX2N0eCkgPT4ge1xuICAgIHJldHVybiBfc2FmZVBhcnNlQXN5bmMoX0Vycikoc2NoZW1hLCB2YWx1ZSwgX2N0eCk7XG59O1xuZXhwb3J0IGNvbnN0IHNhZmVEZWNvZGVBc3luYyA9IC8qIEBfX1BVUkVfXyovIF9zYWZlRGVjb2RlQXN5bmMoZXJyb3JzLiRab2RSZWFsRXJyb3IpO1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUk7O0FBRUosSUFBYSxRQUFzQixxQkFBTyxPQUFPLEVBQzdDLFFBQVEsVUFDWixDQUFDO0FBQ0QsU0FBeUMsYUFBYSxNQUFNLGFBQWEsUUFBUTtDQUM3RSxTQUFTLEtBQUssTUFBTSxLQUFLO0VBQ3JCLElBQUksQ0FBQyxLQUFLLE1BQ04sT0FBTyxlQUFlLE1BQU0sUUFBUTtHQUNoQyxPQUFPO0lBQ0g7SUFDQSxRQUFRO0lBQ1Isd0JBQVEsSUFBSSxJQUFJO0dBQ3BCO0dBQ0EsWUFBWTtFQUNoQixDQUFDO0VBRUwsSUFBSSxLQUFLLEtBQUssT0FBTyxJQUFJLElBQUksR0FDekI7RUFFSixLQUFLLEtBQUssT0FBTyxJQUFJLElBQUk7RUFDekIsWUFBWSxNQUFNLEdBQUc7RUFFckIsTUFBTSxRQUFRLEVBQUU7RUFDaEIsTUFBTSxPQUFPLE9BQU8sS0FBSyxLQUFLO0VBQzlCLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsS0FBSztHQUNsQyxNQUFNLElBQUksS0FBSztHQUNmLElBQUksRUFBRSxLQUFLLE9BQ1AsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDLEtBQUssSUFBSTtFQUVwQztDQUNKO0NBRUEsTUFBTSxTQUFTLFFBQVEsVUFBVTtDQUNqQyxNQUFNLG1CQUFtQixPQUFPLENBQ2hDO0NBQ0EsT0FBTyxlQUFlLFlBQVksUUFBUSxFQUFFLE9BQU8sS0FBSyxDQUFDO0NBQ3pELFNBQVMsRUFBRSxLQUFLO0VBQ1osSUFBSTtFQUNKLE1BQU0sT0FBTyxRQUFRLFNBQVMsSUFBSSxXQUFXLElBQUk7RUFDakQsS0FBSyxNQUFNLEdBQUc7RUFDZCxDQUFDLEtBQUssS0FBSyxLQUFBLENBQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQztFQUM3QyxLQUFLLE1BQU0sTUFBTSxLQUFLLEtBQUssVUFDdkIsR0FBRztFQUVQLE9BQU87Q0FDWDtDQUNBLE9BQU8sZUFBZSxHQUFHLFFBQVEsRUFBRSxPQUFPLEtBQUssQ0FBQztDQUNoRCxPQUFPLGVBQWUsR0FBRyxPQUFPLGFBQWEsRUFDekMsUUFBUSxTQUFTO0VBQ2IsSUFBSSxRQUFRLFVBQVUsZ0JBQWdCLE9BQU8sUUFDekMsT0FBTztFQUNYLE9BQU8sTUFBTSxNQUFNLFFBQVEsSUFBSSxJQUFJO0NBQ3ZDLEVBQ0osQ0FBQztDQUNELE9BQU8sZUFBZSxHQUFHLFFBQVEsRUFBRSxPQUFPLEtBQUssQ0FBQztDQUNoRCxPQUFPO0FBQ1g7QUFFQSxJQUFhLFNBQVMsT0FBTyxXQUFXO0FBQ3hDLElBQWEsaUJBQWIsY0FBb0MsTUFBTTtDQUN0QyxjQUFjO0VBQ1YsTUFBTSwwRUFBMEU7Q0FDcEY7QUFDSjtBQUNBLElBQWEsa0JBQWIsY0FBcUMsTUFBTTtDQUN2QyxZQUFZLE1BQU07RUFDZCxNQUFNLHVEQUF1RCxNQUFNO0VBQ25FLEtBQUssT0FBTztDQUNoQjtBQUNKO0NBQ0MsS0FBSyxXQUFBLENBQVksdUJBQXVCLEdBQUcscUJBQXFCLENBQUM7QUFDbEUsSUFBYSxlQUFlLFdBQVc7QUFDdkMsU0FBZ0IsT0FBTyxXQUFXO0NBQzlCLElBQUksV0FDQSxPQUFPLE9BQU8sY0FBYyxTQUFTO0NBQ3pDLE9BQU87QUFDWDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMzRUEsU0FBZ0IsWUFBWSxLQUFLO0NBQzdCLE9BQU87QUFDWDtBQUNBLFNBQWdCLGVBQWUsS0FBSztDQUNoQyxPQUFPO0FBQ1g7QUFDQSxTQUFnQixTQUFTLE1BQU0sQ0FBRTtBQUNqQyxTQUFnQixZQUFZLElBQUk7Q0FDNUIsTUFBTSxJQUFJLE1BQU0sc0NBQXNDO0FBQzFEO0FBQ0EsU0FBZ0IsT0FBTyxHQUFHLENBQUU7QUFDNUIsU0FBZ0IsY0FBYyxTQUFTO0NBQ25DLE1BQU0sZ0JBQWdCLE9BQU8sT0FBTyxPQUFPLENBQUMsQ0FBQyxRQUFRLE1BQU0sT0FBTyxNQUFNLFFBQVE7Q0FJaEYsT0FIZSxPQUFPLFFBQVEsT0FBTyxDQUFDLENBQ2pDLFFBQVEsQ0FBQyxHQUFHLE9BQU8sY0FBYyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUNwRCxLQUFLLENBQUMsR0FBRyxPQUFPLENBQ1Q7QUFDaEI7QUFDQSxTQUFnQixXQUFXLE9BQU8sWUFBWSxLQUFLO0NBQy9DLE9BQU8sTUFBTSxLQUFLLFFBQVEsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTO0FBQ3JFO0FBQ0EsU0FBZ0Isc0JBQXNCLEdBQUcsT0FBTztDQUM1QyxJQUFJLE9BQU8sVUFBVSxVQUNqQixPQUFPLE1BQU0sU0FBUztDQUMxQixPQUFPO0FBQ1g7QUFDQSxTQUFnQixPQUFPLFFBQVE7Q0FFM0IsT0FBTyxFQUNILElBQUksUUFBUTtFQUNFO0dBQ04sTUFBTSxRQUFRLE9BQU87R0FDckIsT0FBTyxlQUFlLE1BQU0sU0FBUyxFQUFFLE1BQU0sQ0FBQztHQUM5QyxPQUFPO0VBQ1g7Q0FFSixFQUNKO0FBQ0o7QUFDQSxTQUFnQixRQUFRLE9BQU87Q0FDM0IsT0FBTyxVQUFVLFFBQVEsVUFBVSxLQUFBO0FBQ3ZDO0FBQ0EsU0FBZ0IsV0FBVyxRQUFRO0NBQy9CLE1BQU0sUUFBUSxPQUFPLFdBQVcsR0FBRyxJQUFJLElBQUk7Q0FDM0MsTUFBTSxNQUFNLE9BQU8sU0FBUyxHQUFHLElBQUksT0FBTyxTQUFTLElBQUksT0FBTztDQUM5RCxPQUFPLE9BQU8sTUFBTSxPQUFPLEdBQUc7QUFDbEM7QUFDQSxTQUFnQixtQkFBbUIsS0FBSyxNQUFNO0NBQzFDLE1BQU0sUUFBUSxNQUFNO0NBQ3BCLE1BQU0sZUFBZSxLQUFLLE1BQU0sS0FBSztDQUVyQyxNQUFNLFlBQVksT0FBTyxVQUFVLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUM7Q0FDOUQsSUFBSSxLQUFLLElBQUksUUFBUSxZQUFZLElBQUksV0FDakMsT0FBTztDQUNYLE9BQU8sUUFBUTtBQUNuQjtBQUNBLElBQU0sYUFBNEIsc0JBQU8sWUFBWTtBQUNyRCxTQUFnQixXQUFXLFFBQVEsS0FBSyxRQUFRO0NBQzVDLElBQUksUUFBUSxLQUFBO0NBQ1osT0FBTyxlQUFlLFFBQVEsS0FBSztFQUMvQixNQUFNO0dBQ0YsSUFBSSxVQUFVLFlBRVY7R0FFSixJQUFJLFVBQVUsS0FBQSxHQUFXO0lBQ3JCLFFBQVE7SUFDUixRQUFRLE9BQU87R0FDbkI7R0FDQSxPQUFPO0VBQ1g7RUFDQSxJQUFJLEdBQUc7R0FDSCxPQUFPLGVBQWUsUUFBUSxLQUFLLEVBQy9CLE9BQU8sRUFFWCxDQUFDO0VBRUw7RUFDQSxjQUFjO0NBQ2xCLENBQUM7QUFDTDtBQUNBLFNBQWdCLFlBQVksS0FBSztDQUM3QixPQUFPLE9BQU8sT0FBTyxPQUFPLGVBQWUsR0FBRyxHQUFHLE9BQU8sMEJBQTBCLEdBQUcsQ0FBQztBQUMxRjtBQUNBLFNBQWdCLFdBQVcsUUFBUSxNQUFNLE9BQU87Q0FDNUMsT0FBTyxlQUFlLFFBQVEsTUFBTTtFQUNoQztFQUNBLFVBQVU7RUFDVixZQUFZO0VBQ1osY0FBYztDQUNsQixDQUFDO0FBQ0w7QUFDQSxTQUFnQixVQUFVLEdBQUcsTUFBTTtDQUMvQixNQUFNLG9CQUFvQixDQUFDO0NBQzNCLEtBQUssTUFBTSxPQUFPLE1BQU07RUFDcEIsTUFBTSxjQUFjLE9BQU8sMEJBQTBCLEdBQUc7RUFDeEQsT0FBTyxPQUFPLG1CQUFtQixXQUFXO0NBQ2hEO0NBQ0EsT0FBTyxPQUFPLGlCQUFpQixDQUFDLEdBQUcsaUJBQWlCO0FBQ3hEO0FBQ0EsU0FBZ0IsU0FBUyxRQUFRO0NBQzdCLE9BQU8sVUFBVSxPQUFPLEtBQUssR0FBRztBQUNwQztBQUNBLFNBQWdCLGlCQUFpQixLQUFLLE1BQU07Q0FDeEMsSUFBSSxDQUFDLE1BQ0QsT0FBTztDQUNYLE9BQU8sS0FBSyxRQUFRLEtBQUssUUFBUSxNQUFNLE1BQU0sR0FBRztBQUNwRDtBQUNBLFNBQWdCLGlCQUFpQixhQUFhO0NBQzFDLE1BQU0sT0FBTyxPQUFPLEtBQUssV0FBVztDQUNwQyxNQUFNLFdBQVcsS0FBSyxLQUFLLFFBQVEsWUFBWSxJQUFJO0NBQ25ELE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDLE1BQU0sWUFBWTtFQUMzQyxNQUFNLGNBQWMsQ0FBQztFQUNyQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxRQUFRLEtBQzdCLFlBQVksS0FBSyxNQUFNLFFBQVE7RUFFbkMsT0FBTztDQUNYLENBQUM7QUFDTDtBQUNBLFNBQWdCLGFBQWEsU0FBUyxJQUFJO0NBQ3RDLE1BQU0sUUFBUTtDQUNkLElBQUksTUFBTTtDQUNWLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxRQUFRLEtBQ3hCLE9BQU8sTUFBTSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksRUFBWTtDQUV4RCxPQUFPO0FBQ1g7QUFDQSxTQUFnQixJQUFJLEtBQUs7Q0FDckIsT0FBTyxLQUFLLFVBQVUsR0FBRztBQUM3QjtBQUNBLFNBQWdCLFFBQVEsT0FBTztDQUMzQixPQUFPLE1BQ0YsWUFBWSxDQUFDLENBQ2IsS0FBSyxDQUFDLENBQ04sUUFBUSxhQUFhLEVBQUUsQ0FBQyxDQUN4QixRQUFRLFlBQVksR0FBRyxDQUFDLENBQ3hCLFFBQVEsWUFBWSxFQUFFO0FBQy9CO0FBQ0EsSUFBYSxvQkFBcUIsdUJBQXVCLFFBQVEsTUFBTSxxQkFBcUIsR0FBRyxVQUFVLENBQUU7QUFDM0csU0FBZ0IsU0FBUyxNQUFNO0NBQzNCLE9BQU8sT0FBTyxTQUFTLFlBQVksU0FBUyxRQUFRLENBQUMsTUFBTSxRQUFRLElBQUk7QUFDM0U7QUFDQSxJQUFhLGFBQTRCLDRCQUFhO0NBR2xELElBQUksYUFBYSxTQUNiLE9BQU87Q0FHWCxJQUFJLE9BQU8sY0FBYyxlQUFlLFdBQVcsV0FBVyxTQUFTLFlBQVksR0FDL0UsT0FBTztDQUVYLElBQUk7RUFFQSxJQUFJQSxTQUFFLEVBQUU7RUFDUixPQUFPO0NBQ1gsU0FDTyxHQUFHO0VBQ04sT0FBTztDQUNYO0FBQ0osQ0FBQztBQUNELFNBQWdCLGNBQWMsR0FBRztDQUM3QixJQUFJLFNBQVMsQ0FBQyxNQUFNLE9BQ2hCLE9BQU87Q0FFWCxNQUFNLE9BQU8sRUFBRTtDQUNmLElBQUksU0FBUyxLQUFBLEdBQ1QsT0FBTztDQUNYLElBQUksT0FBTyxTQUFTLFlBQ2hCLE9BQU87Q0FFWCxNQUFNLE9BQU8sS0FBSztDQUNsQixJQUFJLFNBQVMsSUFBSSxNQUFNLE9BQ25CLE9BQU87Q0FFWCxJQUFJLE9BQU8sVUFBVSxlQUFlLEtBQUssTUFBTSxlQUFlLE1BQU0sT0FDaEUsT0FBTztDQUVYLE9BQU87QUFDWDtBQUNBLFNBQWdCLGFBQWEsR0FBRztDQUM1QixJQUFJLGNBQWMsQ0FBQyxHQUNmLE9BQU8sRUFBRSxHQUFHLEVBQUU7Q0FDbEIsSUFBSSxNQUFNLFFBQVEsQ0FBQyxHQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUM7Q0FDaEIsSUFBSSxhQUFhLEtBQ2IsT0FBTyxJQUFJLElBQUksQ0FBQztDQUNwQixJQUFJLGFBQWEsS0FDYixPQUFPLElBQUksSUFBSSxDQUFDO0NBQ3BCLE9BQU87QUFDWDtBQUNBLFNBQWdCLFFBQVEsTUFBTTtDQUMxQixJQUFJLFdBQVc7Q0FDZixLQUFLLE1BQU0sT0FBTyxNQUNkLElBQUksT0FBTyxVQUFVLGVBQWUsS0FBSyxNQUFNLEdBQUcsR0FDOUM7Q0FHUixPQUFPO0FBQ1g7QUFDQSxJQUFhLGlCQUFpQixTQUFTO0NBQ25DLE1BQU0sSUFBSSxPQUFPO0NBQ2pCLFFBQVEsR0FBUjtFQUNJLEtBQUssYUFDRCxPQUFPO0VBQ1gsS0FBSyxVQUNELE9BQU87RUFDWCxLQUFLLFVBQ0QsT0FBTyxPQUFPLE1BQU0sSUFBSSxJQUFJLFFBQVE7RUFDeEMsS0FBSyxXQUNELE9BQU87RUFDWCxLQUFLLFlBQ0QsT0FBTztFQUNYLEtBQUssVUFDRCxPQUFPO0VBQ1gsS0FBSyxVQUNELE9BQU87RUFDWCxLQUFLO0dBQ0QsSUFBSSxNQUFNLFFBQVEsSUFBSSxHQUNsQixPQUFPO0dBRVgsSUFBSSxTQUFTLE1BQ1QsT0FBTztHQUVYLElBQUksS0FBSyxRQUFRLE9BQU8sS0FBSyxTQUFTLGNBQWMsS0FBSyxTQUFTLE9BQU8sS0FBSyxVQUFVLFlBQ3BGLE9BQU87R0FFWCxJQUFJLE9BQU8sUUFBUSxlQUFlLGdCQUFnQixLQUM5QyxPQUFPO0dBRVgsSUFBSSxPQUFPLFFBQVEsZUFBZSxnQkFBZ0IsS0FDOUMsT0FBTztHQUVYLElBQUksT0FBTyxTQUFTLGVBQWUsZ0JBQWdCLE1BQy9DLE9BQU87R0FHWCxJQUFJLE9BQU8sU0FBUyxlQUFlLGdCQUFnQixNQUMvQyxPQUFPO0dBRVgsT0FBTztFQUNYLFNBQ0ksTUFBTSxJQUFJLE1BQU0sc0JBQXNCLEdBQUc7Q0FDakQ7QUFDSjtBQUNBLElBQWEsa0NBQWtDLElBQUksSUFBSTtDQUFDO0NBQVU7Q0FBVTtBQUFRLENBQUM7QUFDckYsSUFBYSxnQ0FBZ0MsSUFBSSxJQUFJO0NBQ2pEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNKLENBQUM7QUFDRCxTQUFnQixZQUFZLEtBQUs7Q0FDN0IsT0FBTyxJQUFJLFFBQVEsdUJBQXVCLE1BQU07QUFDcEQ7QUFFQSxTQUFnQixNQUFNLE1BQU0sS0FBSyxRQUFRO0NBQ3JDLE1BQU0sS0FBSyxJQUFJLEtBQUssS0FBSyxPQUFPLE9BQU8sS0FBSyxLQUFLLEdBQUc7Q0FDcEQsSUFBSSxDQUFDLE9BQU8sUUFBUSxRQUNoQixHQUFHLEtBQUssU0FBUztDQUNyQixPQUFPO0FBQ1g7QUFDQSxTQUFnQixnQkFBZ0IsU0FBUztDQUNyQyxNQUFNLFNBQVM7Q0FDZixJQUFJLENBQUMsUUFDRCxPQUFPLENBQUM7Q0FDWixJQUFJLE9BQU8sV0FBVyxVQUNsQixPQUFPLEVBQUUsYUFBYSxPQUFPO0NBQ2pDLElBQUksUUFBUSxZQUFZLEtBQUEsR0FBVztFQUMvQixJQUFJLFFBQVEsVUFBVSxLQUFBLEdBQ2xCLE1BQU0sSUFBSSxNQUFNLGtEQUFrRDtFQUN0RSxPQUFPLFFBQVEsT0FBTztDQUMxQjtDQUNBLE9BQU8sT0FBTztDQUNkLElBQUksT0FBTyxPQUFPLFVBQVUsVUFDeEIsT0FBTztFQUFFLEdBQUc7RUFBUSxhQUFhLE9BQU87Q0FBTTtDQUNsRCxPQUFPO0FBQ1g7QUFDQSxTQUFnQix1QkFBdUIsUUFBUTtDQUMzQyxJQUFJO0NBQ0osT0FBTyxJQUFJLE1BQU0sQ0FBQyxHQUFHO0VBQ2pCLElBQUksR0FBRyxNQUFNLFVBQVU7R0FDbkIsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLElBQUksUUFBUSxNQUFNLFFBQVE7RUFDN0M7RUFDQSxJQUFJLEdBQUcsTUFBTSxPQUFPLFVBQVU7R0FDMUIsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLElBQUksUUFBUSxNQUFNLE9BQU8sUUFBUTtFQUNwRDtFQUNBLElBQUksR0FBRyxNQUFNO0dBQ1QsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLElBQUksUUFBUSxJQUFJO0VBQ25DO0VBQ0EsZUFBZSxHQUFHLE1BQU07R0FDcEIsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLGVBQWUsUUFBUSxJQUFJO0VBQzlDO0VBQ0EsUUFBUSxHQUFHO0dBQ1AsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLFFBQVEsTUFBTTtFQUNqQztFQUNBLHlCQUF5QixHQUFHLE1BQU07R0FDOUIsV0FBVyxTQUFTLE9BQU87R0FDM0IsT0FBTyxRQUFRLHlCQUF5QixRQUFRLElBQUk7RUFDeEQ7RUFDQSxlQUFlLEdBQUcsTUFBTSxZQUFZO0dBQ2hDLFdBQVcsU0FBUyxPQUFPO0dBQzNCLE9BQU8sUUFBUSxlQUFlLFFBQVEsTUFBTSxVQUFVO0VBQzFEO0NBQ0osQ0FBQztBQUNMO0FBQ0EsU0FBZ0IsbUJBQW1CLE9BQU87Q0FDdEMsSUFBSSxPQUFPLFVBQVUsVUFDakIsT0FBTyxNQUFNLFNBQVMsSUFBSTtDQUM5QixJQUFJLE9BQU8sVUFBVSxVQUNqQixPQUFPLElBQUksTUFBTTtDQUNyQixPQUFPLEdBQUc7QUFDZDtBQUNBLFNBQWdCLGFBQWEsT0FBTztDQUNoQyxPQUFPLE9BQU8sS0FBSyxLQUFLLENBQUMsQ0FBQyxRQUFRLE1BQU07RUFDcEMsT0FBTyxNQUFNLEVBQUUsQ0FBQyxLQUFLLFVBQVUsY0FBYyxNQUFNLEVBQUUsQ0FBQyxLQUFLLFdBQVc7Q0FDMUUsQ0FBQztBQUNMO0FBQ0EsSUFBYSx1QkFBdUI7Q0FDaEMsU0FBUyxDQUFDLE9BQU8sa0JBQWtCLE9BQU8sZ0JBQWdCO0NBQzFELE9BQU8sQ0FBQyxhQUFhLFVBQVU7Q0FDL0IsUUFBUSxDQUFDLEdBQUcsVUFBVTtDQUN0QixTQUFTLENBQUMsdUJBQXdCLG9CQUFxQjtDQUN2RCxTQUFTLENBQUMsQ0FBQyxPQUFPLFdBQVcsT0FBTyxTQUFTO0FBQ2pEO0FBQ0EsSUFBYSx1QkFBdUI7Q0FDaEMsT0FBTyxDQUFnQixzQkFBTyxzQkFBc0IsR0FBa0Isc0JBQU8scUJBQXFCLENBQUM7Q0FDbkcsUUFBUSxDQUFnQixzQkFBTyxDQUFDLEdBQWtCLHNCQUFPLHNCQUFzQixDQUFDO0FBQ3BGO0FBQ0EsU0FBZ0IsS0FBSyxRQUFRLE1BQU07Q0FDL0IsTUFBTSxVQUFVLE9BQU8sS0FBSztDQUM1QixNQUFNLFNBQVMsUUFBUTtDQUV2QixJQURrQixVQUFVLE9BQU8sU0FBUyxHQUV4QyxNQUFNLElBQUksTUFBTSxpRUFBaUU7Q0FrQnJGLE9BQU8sTUFBTSxRQWhCRCxVQUFVLE9BQU8sS0FBSyxLQUFLO0VBQ25DLElBQUksUUFBUTtHQUNSLE1BQU0sV0FBVyxDQUFDO0dBQ2xCLEtBQUssTUFBTSxPQUFPLE1BQU07SUFDcEIsSUFBSSxFQUFFLE9BQU8sUUFBUSxRQUNqQixNQUFNLElBQUksTUFBTSxzQkFBc0IsSUFBSSxFQUFFO0lBRWhELElBQUksQ0FBQyxLQUFLLE1BQ047SUFDSixTQUFTLE9BQU8sUUFBUSxNQUFNO0dBQ2xDO0dBQ0EsV0FBVyxNQUFNLFNBQVMsUUFBUTtHQUNsQyxPQUFPO0VBQ1g7RUFDQSxRQUFRLENBQUM7Q0FDYixDQUN1QixDQUFDO0FBQzVCO0FBQ0EsU0FBZ0IsS0FBSyxRQUFRLE1BQU07Q0FDL0IsTUFBTSxVQUFVLE9BQU8sS0FBSztDQUM1QixNQUFNLFNBQVMsUUFBUTtDQUV2QixJQURrQixVQUFVLE9BQU8sU0FBUyxHQUV4QyxNQUFNLElBQUksTUFBTSxpRUFBaUU7Q0FrQnJGLE9BQU8sTUFBTSxRQWhCRCxVQUFVLE9BQU8sS0FBSyxLQUFLO0VBQ25DLElBQUksUUFBUTtHQUNSLE1BQU0sV0FBVyxFQUFFLEdBQUcsT0FBTyxLQUFLLElBQUksTUFBTTtHQUM1QyxLQUFLLE1BQU0sT0FBTyxNQUFNO0lBQ3BCLElBQUksRUFBRSxPQUFPLFFBQVEsUUFDakIsTUFBTSxJQUFJLE1BQU0sc0JBQXNCLElBQUksRUFBRTtJQUVoRCxJQUFJLENBQUMsS0FBSyxNQUNOO0lBQ0osT0FBTyxTQUFTO0dBQ3BCO0dBQ0EsV0FBVyxNQUFNLFNBQVMsUUFBUTtHQUNsQyxPQUFPO0VBQ1g7RUFDQSxRQUFRLENBQUM7Q0FDYixDQUN1QixDQUFDO0FBQzVCO0FBQ0EsU0FBZ0IsT0FBTyxRQUFRLE9BQU87Q0FDbEMsSUFBSSxDQUFDLGNBQWMsS0FBSyxHQUNwQixNQUFNLElBQUksTUFBTSxrREFBa0Q7Q0FFdEUsTUFBTSxTQUFTLE9BQU8sS0FBSyxJQUFJO0NBRS9CLElBRGtCLFVBQVUsT0FBTyxTQUFTLEdBQzdCO0VBR1gsTUFBTSxnQkFBZ0IsT0FBTyxLQUFLLElBQUk7RUFDdEMsS0FBSyxNQUFNLE9BQU8sT0FDZCxJQUFJLE9BQU8seUJBQXlCLGVBQWUsR0FBRyxNQUFNLEtBQUEsR0FDeEQsTUFBTSxJQUFJLE1BQU0sOEZBQThGO0NBRzFIO0NBUUEsT0FBTyxNQUFNLFFBUEQsVUFBVSxPQUFPLEtBQUssS0FBSyxFQUNuQyxJQUFJLFFBQVE7RUFDUixNQUFNLFNBQVM7R0FBRSxHQUFHLE9BQU8sS0FBSyxJQUFJO0dBQU8sR0FBRztFQUFNO0VBQ3BELFdBQVcsTUFBTSxTQUFTLE1BQU07RUFDaEMsT0FBTztDQUNYLEVBQ0osQ0FDdUIsQ0FBQztBQUM1QjtBQUNBLFNBQWdCLFdBQVcsUUFBUSxPQUFPO0NBQ3RDLElBQUksQ0FBQyxjQUFjLEtBQUssR0FDcEIsTUFBTSxJQUFJLE1BQU0sc0RBQXNEO0NBUzFFLE9BQU8sTUFBTSxRQVBELFVBQVUsT0FBTyxLQUFLLEtBQUssRUFDbkMsSUFBSSxRQUFRO0VBQ1IsTUFBTSxTQUFTO0dBQUUsR0FBRyxPQUFPLEtBQUssSUFBSTtHQUFPLEdBQUc7RUFBTTtFQUNwRCxXQUFXLE1BQU0sU0FBUyxNQUFNO0VBQ2hDLE9BQU87Q0FDWCxFQUNKLENBQ3VCLENBQUM7QUFDNUI7QUFDQSxTQUFnQixNQUFNLEdBQUcsR0FBRztDQUN4QixJQUFJLEVBQUUsS0FBSyxJQUFJLFFBQVEsUUFDbkIsTUFBTSxJQUFJLE1BQU0sOEZBQThGO0NBYWxILE9BQU8sTUFBTSxHQVhELFVBQVUsRUFBRSxLQUFLLEtBQUs7RUFDOUIsSUFBSSxRQUFRO0dBQ1IsTUFBTSxTQUFTO0lBQUUsR0FBRyxFQUFFLEtBQUssSUFBSTtJQUFPLEdBQUcsRUFBRSxLQUFLLElBQUk7R0FBTTtHQUMxRCxXQUFXLE1BQU0sU0FBUyxNQUFNO0dBQ2hDLE9BQU87RUFDWDtFQUNBLElBQUksV0FBVztHQUNYLE9BQU8sRUFBRSxLQUFLLElBQUk7RUFDdEI7RUFDQSxRQUFRLEVBQUUsS0FBSyxJQUFJLFVBQVUsQ0FBQztDQUNsQyxDQUNrQixDQUFDO0FBQ3ZCO0FBQ0EsU0FBZ0IsUUFBUSxPQUFPLFFBQVEsTUFBTTtDQUV6QyxNQUFNLFNBRFUsT0FBTyxLQUFLLElBQ0w7Q0FFdkIsSUFEa0IsVUFBVSxPQUFPLFNBQVMsR0FFeEMsTUFBTSxJQUFJLE1BQU0sb0VBQW9FO0NBc0N4RixPQUFPLE1BQU0sUUFwQ0QsVUFBVSxPQUFPLEtBQUssS0FBSztFQUNuQyxJQUFJLFFBQVE7R0FDUixNQUFNLFdBQVcsT0FBTyxLQUFLLElBQUk7R0FDakMsTUFBTSxRQUFRLEVBQUUsR0FBRyxTQUFTO0dBQzVCLElBQUksTUFDQSxLQUFLLE1BQU0sT0FBTyxNQUFNO0lBQ3BCLElBQUksRUFBRSxPQUFPLFdBQ1QsTUFBTSxJQUFJLE1BQU0sc0JBQXNCLElBQUksRUFBRTtJQUVoRCxJQUFJLENBQUMsS0FBSyxNQUNOO0lBRUosTUFBTSxPQUFPLFFBQ1AsSUFBSSxNQUFNO0tBQ1IsTUFBTTtLQUNOLFdBQVcsU0FBUztJQUN4QixDQUFDLElBQ0MsU0FBUztHQUNuQjtRQUdBLEtBQUssTUFBTSxPQUFPLFVBRWQsTUFBTSxPQUFPLFFBQ1AsSUFBSSxNQUFNO0lBQ1IsTUFBTTtJQUNOLFdBQVcsU0FBUztHQUN4QixDQUFDLElBQ0MsU0FBUztHQUd2QixXQUFXLE1BQU0sU0FBUyxLQUFLO0dBQy9CLE9BQU87RUFDWDtFQUNBLFFBQVEsQ0FBQztDQUNiLENBQ3VCLENBQUM7QUFDNUI7QUFDQSxTQUFnQixTQUFTLE9BQU8sUUFBUSxNQUFNO0NBZ0MxQyxPQUFPLE1BQU0sUUEvQkQsVUFBVSxPQUFPLEtBQUssS0FBSyxFQUNuQyxJQUFJLFFBQVE7RUFDUixNQUFNLFdBQVcsT0FBTyxLQUFLLElBQUk7RUFDakMsTUFBTSxRQUFRLEVBQUUsR0FBRyxTQUFTO0VBQzVCLElBQUksTUFDQSxLQUFLLE1BQU0sT0FBTyxNQUFNO0dBQ3BCLElBQUksRUFBRSxPQUFPLFFBQ1QsTUFBTSxJQUFJLE1BQU0sc0JBQXNCLElBQUksRUFBRTtHQUVoRCxJQUFJLENBQUMsS0FBSyxNQUNOO0dBRUosTUFBTSxPQUFPLElBQUksTUFBTTtJQUNuQixNQUFNO0lBQ04sV0FBVyxTQUFTO0dBQ3hCLENBQUM7RUFDTDtPQUdBLEtBQUssTUFBTSxPQUFPLFVBRWQsTUFBTSxPQUFPLElBQUksTUFBTTtHQUNuQixNQUFNO0dBQ04sV0FBVyxTQUFTO0VBQ3hCLENBQUM7RUFHVCxXQUFXLE1BQU0sU0FBUyxLQUFLO0VBQy9CLE9BQU87Q0FDWCxFQUNKLENBQ3VCLENBQUM7QUFDNUI7QUFFQSxTQUFnQixRQUFRLEdBQUcsYUFBYSxHQUFHO0NBQ3ZDLElBQUksRUFBRSxZQUFZLE1BQ2QsT0FBTztDQUNYLEtBQUssSUFBSSxJQUFJLFlBQVksSUFBSSxFQUFFLE9BQU8sUUFBUSxLQUMxQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxNQUMxQixPQUFPO0NBR2YsT0FBTztBQUNYO0FBR0EsU0FBZ0Isa0JBQWtCLEdBQUcsYUFBYSxHQUFHO0NBQ2pELElBQUksRUFBRSxZQUFZLE1BQ2QsT0FBTztDQUNYLEtBQUssSUFBSSxJQUFJLFlBQVksSUFBSSxFQUFFLE9BQU8sUUFBUSxLQUMxQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxPQUMxQixPQUFPO0NBR2YsT0FBTztBQUNYO0FBQ0EsU0FBZ0IsYUFBYSxNQUFNLFFBQVE7Q0FDdkMsT0FBTyxPQUFPLEtBQUssUUFBUTtFQUN2QixJQUFJO0VBQ0osQ0FBQyxLQUFLLElBQUEsQ0FBSyxTQUFTLEdBQUcsT0FBTyxDQUFDO0VBQy9CLElBQUksS0FBSyxRQUFRLElBQUk7RUFDckIsT0FBTztDQUNYLENBQUM7QUFDTDtBQUNBLFNBQWdCLGNBQWMsU0FBUztDQUNuQyxPQUFPLE9BQU8sWUFBWSxXQUFXLFVBQVUsU0FBUztBQUM1RDtBQUNBLFNBQWdCLGNBQWMsS0FBSyxLQUFLLFFBQVE7Q0FDNUMsTUFBTSxVQUFVLElBQUksVUFDZCxJQUFJLFVBQ0gsY0FBYyxJQUFJLE1BQU0sS0FBSyxLQUFLLFFBQVEsR0FBRyxDQUFDLEtBQzdDLGNBQWMsS0FBSyxRQUFRLEdBQUcsQ0FBQyxLQUMvQixjQUFjLE9BQU8sY0FBYyxHQUFHLENBQUMsS0FDdkMsY0FBYyxPQUFPLGNBQWMsR0FBRyxDQUFDLEtBQ3ZDO0NBQ1IsTUFBTSxFQUFFLE1BQU0sT0FBTyxVQUFVLFdBQVcsT0FBTyxRQUFRLEdBQUcsU0FBUztDQUNyRSxLQUFLLFNBQVMsS0FBSyxPQUFPLENBQUM7Q0FDM0IsS0FBSyxVQUFVO0NBQ2YsSUFBSSxLQUFLLGFBQ0wsS0FBSyxRQUFRO0NBRWpCLE9BQU87QUFDWDtBQUNBLFNBQWdCLGlCQUFpQixPQUFPO0NBQ3BDLElBQUksaUJBQWlCLEtBQ2pCLE9BQU87Q0FDWCxJQUFJLGlCQUFpQixLQUNqQixPQUFPO0NBRVgsSUFBSSxpQkFBaUIsTUFDakIsT0FBTztDQUNYLE9BQU87QUFDWDtBQUNBLFNBQWdCLG9CQUFvQixPQUFPO0NBQ3ZDLElBQUksTUFBTSxRQUFRLEtBQUssR0FDbkIsT0FBTztDQUNYLElBQUksT0FBTyxVQUFVLFVBQ2pCLE9BQU87Q0FDWCxPQUFPO0FBQ1g7QUFDQSxTQUFnQixXQUFXLE1BQU07Q0FDN0IsTUFBTSxJQUFJLE9BQU87Q0FDakIsUUFBUSxHQUFSO0VBQ0ksS0FBSyxVQUNELE9BQU8sT0FBTyxNQUFNLElBQUksSUFBSSxRQUFRO0VBRXhDLEtBQUssVUFBVTtHQUNYLElBQUksU0FBUyxNQUNULE9BQU87R0FFWCxJQUFJLE1BQU0sUUFBUSxJQUFJLEdBQ2xCLE9BQU87R0FFWCxNQUFNLE1BQU07R0FDWixJQUFJLE9BQU8sT0FBTyxlQUFlLEdBQUcsTUFBTSxPQUFPLGFBQWEsaUJBQWlCLE9BQU8sSUFBSSxhQUN0RixPQUFPLElBQUksWUFBWTtFQUUvQjtDQUNKO0NBQ0EsT0FBTztBQUNYO0FBQ0EsU0FBZ0IsTUFBTSxHQUFHLE1BQU07Q0FDM0IsTUFBTSxDQUFDLEtBQUssT0FBTyxRQUFRO0NBQzNCLElBQUksT0FBTyxRQUFRLFVBQ2YsT0FBTztFQUNILFNBQVM7RUFDVCxNQUFNO0VBQ047RUFDQTtDQUNKO0NBRUosT0FBTyxFQUFFLEdBQUcsSUFBSTtBQUNwQjtBQUNBLFNBQWdCLFVBQVUsS0FBSztDQUMzQixPQUFPLE9BQU8sUUFBUSxHQUFHLENBQUMsQ0FDckIsUUFBUSxDQUFDLEdBQUcsT0FBTztFQUVwQixPQUFPLE9BQU8sTUFBTSxPQUFPLFNBQVMsR0FBRyxFQUFFLENBQUM7Q0FDOUMsQ0FBQyxDQUFDLENBQ0csS0FBSyxPQUFPLEdBQUcsRUFBRTtBQUMxQjtBQUVBLFNBQWdCLG1CQUFtQixRQUFRO0NBQ3ZDLE1BQU0sZUFBZSxLQUFLLE1BQU07Q0FDaEMsTUFBTSxRQUFRLElBQUksV0FBVyxhQUFhLE1BQU07Q0FDaEQsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLGFBQWEsUUFBUSxLQUNyQyxNQUFNLEtBQUssYUFBYSxXQUFXLENBQUM7Q0FFeEMsT0FBTztBQUNYO0FBQ0EsU0FBZ0IsbUJBQW1CLE9BQU87Q0FDdEMsSUFBSSxlQUFlO0NBQ25CLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxNQUFNLFFBQVEsS0FDOUIsZ0JBQWdCLE9BQU8sYUFBYSxNQUFNLEVBQUU7Q0FFaEQsT0FBTyxLQUFLLFlBQVk7QUFDNUI7QUFDQSxTQUFnQixzQkFBc0IsV0FBVztDQUM3QyxNQUFNLFNBQVMsVUFBVSxRQUFRLE1BQU0sR0FBRyxDQUFDLENBQUMsUUFBUSxNQUFNLEdBQUc7Q0FFN0QsT0FBTyxtQkFBbUIsU0FEVixJQUFJLFFBQVEsSUFBSyxPQUFPLFNBQVMsS0FBTSxDQUNkLENBQUM7QUFDOUM7QUFDQSxTQUFnQixzQkFBc0IsT0FBTztDQUN6QyxPQUFPLG1CQUFtQixLQUFLLENBQUMsQ0FBQyxRQUFRLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsTUFBTSxFQUFFO0FBQzdGO0FBQ0EsU0FBZ0IsZ0JBQWdCLEtBQUs7Q0FDakMsTUFBTSxXQUFXLElBQUksUUFBUSxPQUFPLEVBQUU7Q0FDdEMsSUFBSSxTQUFTLFNBQVMsTUFBTSxHQUN4QixNQUFNLElBQUksTUFBTSwyQkFBMkI7Q0FFL0MsTUFBTSxRQUFRLElBQUksV0FBVyxTQUFTLFNBQVMsQ0FBQztDQUNoRCxLQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FBUyxRQUFRLEtBQUssR0FDdEMsTUFBTSxJQUFJLEtBQUssT0FBTyxTQUFTLFNBQVMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUU7Q0FFL0QsT0FBTztBQUNYO0FBQ0EsU0FBZ0IsZ0JBQWdCLE9BQU87Q0FDbkMsT0FBTyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQ25CLEtBQUssTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQzNDLEtBQUssRUFBRTtBQUNoQjtBQUVBLElBQWEsUUFBYixNQUFtQjtDQUNmLFlBQVksR0FBRyxPQUFPLENBQUU7QUFDNUI7OztBQy9wQkEsSUFBTSxlQUFlLE1BQU0sUUFBUTtDQUMvQixLQUFLLE9BQU87Q0FDWixPQUFPLGVBQWUsTUFBTSxRQUFRO0VBQ2hDLE9BQU8sS0FBSztFQUNaLFlBQVk7Q0FDaEIsQ0FBQztDQUNELE9BQU8sZUFBZSxNQUFNLFVBQVU7RUFDbEMsT0FBTztFQUNQLFlBQVk7Q0FDaEIsQ0FBQztDQUNELEtBQUssVUFBVSxLQUFLLFVBQVUsS0FBS0MsdUJBQTRCLENBQUM7Q0FDaEUsT0FBTyxlQUFlLE1BQU0sWUFBWTtFQUNwQyxhQUFhLEtBQUs7RUFDbEIsWUFBWTtDQUNoQixDQUFDO0FBQ0w7QUFDQSxJQUFhLFlBQVksYUFBYSxhQUFhLFdBQVc7QUFDOUQsSUFBYSxnQkFBZ0IsYUFBYSxhQUFhLGFBQWEsRUFBRSxRQUFRLE1BQU0sQ0FBQztBQUNyRixTQUFnQixhQUFhLE9BQU8sVUFBVSxVQUFVLE1BQU0sU0FBUztDQUNuRSxNQUFNLGNBQWMsQ0FBQztDQUNyQixNQUFNLGFBQWEsQ0FBQztDQUNwQixLQUFLLE1BQU0sT0FBTyxNQUFNLFFBQ3BCLElBQUksSUFBSSxLQUFLLFNBQVMsR0FBRztFQUNyQixZQUFZLElBQUksS0FBSyxNQUFNLFlBQVksSUFBSSxLQUFLLE9BQU8sQ0FBQztFQUN4RCxZQUFZLElBQUksS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLEdBQUcsQ0FBQztDQUM3QyxPQUVJLFdBQVcsS0FBSyxPQUFPLEdBQUcsQ0FBQztDQUduQyxPQUFPO0VBQUU7RUFBWTtDQUFZO0FBQ3JDO0FBQ0EsU0FBZ0IsWUFBWSxPQUFPLFVBQVUsVUFBVSxNQUFNLFNBQVM7Q0FDbEUsTUFBTSxjQUFjLEVBQUUsU0FBUyxDQUFDLEVBQUU7Q0FDbEMsTUFBTSxnQkFBZ0IsT0FBTyxPQUFPLENBQUMsTUFBTTtFQUN2QyxLQUFLLE1BQU0sU0FBUyxNQUFNLFFBQ3RCLElBQUksTUFBTSxTQUFTLG1CQUFtQixNQUFNLE9BQU8sUUFDL0MsTUFBTSxPQUFPLEtBQUssV0FBVyxhQUFhLEVBQUUsT0FBTyxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztPQUU5RSxJQUFJLE1BQU0sU0FBUyxlQUNwQixhQUFhLEVBQUUsUUFBUSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDO09BRTlELElBQUksTUFBTSxTQUFTLG1CQUNwQixhQUFhLEVBQUUsUUFBUSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDO09BRTlEO0dBQ0QsTUFBTSxXQUFXLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxJQUFJO0dBQ3hDLElBQUksU0FBUyxXQUFXLEdBQ3BCLFlBQVksUUFBUSxLQUFLLE9BQU8sS0FBSyxDQUFDO1FBRXJDO0lBQ0QsSUFBSSxPQUFPO0lBQ1gsSUFBSSxJQUFJO0lBQ1IsT0FBTyxJQUFJLFNBQVMsUUFBUTtLQUN4QixNQUFNLEtBQUssU0FBUztLQUVwQixJQUFJLEVBRGEsTUFBTSxTQUFTLFNBQVMsSUFFckMsS0FBSyxNQUFNLEtBQUssT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1VBRXBDO01BQ0QsS0FBSyxNQUFNLEtBQUssT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFO01BQ3JDLEtBQUssR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLEtBQUssQ0FBQztLQUN2QztLQUNBLE9BQU8sS0FBSztLQUNaO0lBQ0o7R0FDSjtFQUNKO0NBRVI7Q0FDQSxhQUFhLEtBQUs7Q0FDbEIsT0FBTztBQUNYO0FBQ0EsU0FBZ0IsYUFBYSxPQUFPLFVBQVUsVUFBVSxNQUFNLFNBQVM7Q0FDbkUsTUFBTSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUU7Q0FDNUIsTUFBTSxnQkFBZ0IsT0FBTyxPQUFPLENBQUMsTUFBTTtFQUN2QyxJQUFJLElBQUk7RUFDUixLQUFLLE1BQU0sU0FBUyxNQUFNLFFBQ3RCLElBQUksTUFBTSxTQUFTLG1CQUFtQixNQUFNLE9BQU8sUUFFL0MsTUFBTSxPQUFPLEtBQUssV0FBVyxhQUFhLEVBQUUsT0FBTyxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztPQUU5RSxJQUFJLE1BQU0sU0FBUyxlQUNwQixhQUFhLEVBQUUsUUFBUSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDO09BRTlELElBQUksTUFBTSxTQUFTLG1CQUNwQixhQUFhLEVBQUUsUUFBUSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDO09BRTlEO0dBQ0QsTUFBTSxXQUFXLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxJQUFJO0dBQ3hDLElBQUksU0FBUyxXQUFXLEdBQUc7SUFDdkIsT0FBTyxPQUFPLEtBQUssT0FBTyxLQUFLLENBQUM7SUFDaEM7R0FDSjtHQUNBLElBQUksT0FBTztHQUNYLElBQUksSUFBSTtHQUNSLE9BQU8sSUFBSSxTQUFTLFFBQVE7SUFDeEIsTUFBTSxLQUFLLFNBQVM7SUFDcEIsTUFBTSxXQUFXLE1BQU0sU0FBUyxTQUFTO0lBQ3pDLElBQUksT0FBTyxPQUFPLFVBQVU7S0FDeEIsS0FBSyxlQUFlLEtBQUssYUFBYSxDQUFDO0tBQ3ZDLENBQUMsS0FBSyxLQUFLLFdBQUEsQ0FBWSxRQUFRLEdBQUcsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFO0tBQ3JELE9BQU8sS0FBSyxXQUFXO0lBQzNCLE9BQ0s7S0FDRCxLQUFLLFVBQVUsS0FBSyxRQUFRLENBQUM7S0FDN0IsQ0FBQyxLQUFLLEtBQUssTUFBQSxDQUFPLFFBQVEsR0FBRyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUU7S0FDaEQsT0FBTyxLQUFLLE1BQU07SUFDdEI7SUFDQSxJQUFJLFVBQ0EsS0FBSyxPQUFPLEtBQUssT0FBTyxLQUFLLENBQUM7SUFFbEM7R0FDSjtFQUNKO0NBRVI7Q0FDQSxhQUFhLEtBQUs7Q0FDbEIsT0FBTztBQUNYOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQ0EsU0FBZ0IsVUFBVSxPQUFPO0NBQzdCLE1BQU0sT0FBTyxDQUFDO0NBQ2QsTUFBTSxPQUFPLE1BQU0sS0FBSyxRQUFTLE9BQU8sUUFBUSxXQUFXLElBQUksTUFBTSxHQUFJO0NBQ3pFLEtBQUssTUFBTSxPQUFPLE1BQ2QsSUFBSSxPQUFPLFFBQVEsVUFDZixLQUFLLEtBQUssSUFBSSxJQUFJLEVBQUU7TUFDbkIsSUFBSSxPQUFPLFFBQVEsVUFDcEIsS0FBSyxLQUFLLElBQUksS0FBSyxVQUFVLE9BQU8sR0FBRyxDQUFDLEVBQUUsRUFBRTtNQUMzQyxJQUFJLFNBQVMsS0FBSyxHQUFHLEdBQ3RCLEtBQUssS0FBSyxJQUFJLEtBQUssVUFBVSxHQUFHLEVBQUUsRUFBRTtNQUNuQztFQUNELElBQUksS0FBSyxRQUNMLEtBQUssS0FBSyxHQUFHO0VBQ2pCLEtBQUssS0FBSyxHQUFHO0NBQ2pCO0NBRUosT0FBTyxLQUFLLEtBQUssRUFBRTtBQUN2QjtBQUNBLFNBQWdCLGNBQWMsT0FBTztDQUNqQyxNQUFNLFFBQVEsQ0FBQztDQUVmLE1BQU0sU0FBUyxDQUFDLEdBQUcsTUFBTSxNQUFNLENBQUMsQ0FBQyxNQUFNLEdBQUcsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFBLENBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFBLENBQUcsTUFBTTtDQUU3RixLQUFLLE1BQU0sU0FBUyxRQUFRO0VBQ3hCLE1BQU0sS0FBSyxLQUFLLE1BQU0sU0FBUztFQUMvQixJQUFJLE1BQU0sTUFBTSxRQUNaLE1BQU0sS0FBSyxVQUFVLFVBQVUsTUFBTSxJQUFJLEdBQUc7Q0FDcEQ7Q0FFQSxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQzFCOzs7QUNyTEEsSUFBYSxVQUFVLFVBQVUsUUFBUSxPQUFPLE1BQU0sWUFBWTtDQUM5RCxNQUFNLE1BQU0sT0FBTztFQUFFLEdBQUc7RUFBTSxPQUFPO0NBQU0sSUFBSSxFQUFFLE9BQU8sTUFBTTtDQUM5RCxNQUFNLFNBQVMsT0FBTyxLQUFLLElBQUk7RUFBRTtFQUFPLFFBQVEsQ0FBQztDQUFFLEdBQUcsR0FBRztDQUN6RCxJQUFJLGtCQUFrQixTQUNsQixNQUFNLElBQUlDLGVBQW9CO0NBRWxDLElBQUksT0FBTyxPQUFPLFFBQVE7RUFDdEIsTUFBTSxJQUFJLE1BQUssU0FBUyxRQUFPLE1BQU0sT0FBTyxPQUFPLEtBQUssUUFBUUMsY0FBbUIsS0FBSyxLQUFLQyxPQUFZLENBQUMsQ0FBQyxDQUFDO0VBQzVHLGtCQUF1QixHQUFHLFNBQVMsTUFBTTtFQUN6QyxNQUFNO0NBQ1Y7Q0FDQSxPQUFPLE9BQU87QUFDbEI7QUFDQSxJQUFhLFFBQXVCLHNCQUFPQyxhQUFvQjtBQUMvRCxJQUFhLGVBQWUsU0FBUyxPQUFPLFFBQVEsT0FBTyxNQUFNLFdBQVc7Q0FDeEUsTUFBTSxNQUFNLE9BQU87RUFBRSxHQUFHO0VBQU0sT0FBTztDQUFLLElBQUksRUFBRSxPQUFPLEtBQUs7Q0FDNUQsSUFBSSxTQUFTLE9BQU8sS0FBSyxJQUFJO0VBQUU7RUFBTyxRQUFRLENBQUM7Q0FBRSxHQUFHLEdBQUc7Q0FDdkQsSUFBSSxrQkFBa0IsU0FDbEIsU0FBUyxNQUFNO0NBQ25CLElBQUksT0FBTyxPQUFPLFFBQVE7RUFDdEIsTUFBTSxJQUFJLE1BQUssUUFBUSxRQUFPLE1BQU0sT0FBTyxPQUFPLEtBQUssUUFBUUYsY0FBbUIsS0FBSyxLQUFLQyxPQUFZLENBQUMsQ0FBQyxDQUFDO0VBQzNHLGtCQUF1QixHQUFHLFFBQVEsTUFBTTtFQUN4QyxNQUFNO0NBQ1Y7Q0FDQSxPQUFPLE9BQU87QUFDbEI7QUFDQSxJQUFhLGFBQTRCLDJCQUFZQyxhQUFvQjtBQUN6RSxJQUFhLGNBQWMsVUFBVSxRQUFRLE9BQU8sU0FBUztDQUN6RCxNQUFNLE1BQU0sT0FBTztFQUFFLEdBQUc7RUFBTSxPQUFPO0NBQU0sSUFBSSxFQUFFLE9BQU8sTUFBTTtDQUM5RCxNQUFNLFNBQVMsT0FBTyxLQUFLLElBQUk7RUFBRTtFQUFPLFFBQVEsQ0FBQztDQUFFLEdBQUcsR0FBRztDQUN6RCxJQUFJLGtCQUFrQixTQUNsQixNQUFNLElBQUlILGVBQW9CO0NBRWxDLE9BQU8sT0FBTyxPQUFPLFNBQ2Y7RUFDRSxTQUFTO0VBQ1QsT0FBTyxLQUFLLFFBQVFJLFdBQWtCLE9BQU8sT0FBTyxLQUFLLFFBQVFILGNBQW1CLEtBQUssS0FBS0MsT0FBWSxDQUFDLENBQUMsQ0FBQztDQUNqSCxJQUNFO0VBQUUsU0FBUztFQUFNLE1BQU0sT0FBTztDQUFNO0FBQzlDO0FBQ0EsSUFBYSxZQUEyQiwwQkFBV0MsYUFBb0I7QUFDdkUsSUFBYSxtQkFBbUIsU0FBUyxPQUFPLFFBQVEsT0FBTyxTQUFTO0NBQ3BFLE1BQU0sTUFBTSxPQUFPO0VBQUUsR0FBRztFQUFNLE9BQU87Q0FBSyxJQUFJLEVBQUUsT0FBTyxLQUFLO0NBQzVELElBQUksU0FBUyxPQUFPLEtBQUssSUFBSTtFQUFFO0VBQU8sUUFBUSxDQUFDO0NBQUUsR0FBRyxHQUFHO0NBQ3ZELElBQUksa0JBQWtCLFNBQ2xCLFNBQVMsTUFBTTtDQUNuQixPQUFPLE9BQU8sT0FBTyxTQUNmO0VBQ0UsU0FBUztFQUNULE9BQU8sSUFBSSxLQUFLLE9BQU8sT0FBTyxLQUFLLFFBQVFGLGNBQW1CLEtBQUssS0FBS0MsT0FBWSxDQUFDLENBQUMsQ0FBQztDQUMzRixJQUNFO0VBQUUsU0FBUztFQUFNLE1BQU0sT0FBTztDQUFNO0FBQzlDO0FBQ0EsSUFBYSxpQkFBZ0MsK0JBQWdCQyxhQUFvQjtBQUNqRixJQUFhLFdBQVcsVUFBVSxRQUFRLE9BQU8sU0FBUztDQUN0RCxNQUFNLE1BQU0sT0FBTztFQUFFLEdBQUc7RUFBTSxXQUFXO0NBQVcsSUFBSSxFQUFFLFdBQVcsV0FBVztDQUNoRixPQUFPLE9BQU8sSUFBSSxDQUFDLENBQUMsUUFBUSxPQUFPLEdBQUc7QUFDMUM7QUFDQSxJQUFhLFNBQXdCLHVCQUFRQSxhQUFvQjtBQUNqRSxJQUFhLFdBQVcsVUFBVSxRQUFRLE9BQU8sU0FBUztDQUN0RCxPQUFPLE9BQU8sSUFBSSxDQUFDLENBQUMsUUFBUSxPQUFPLElBQUk7QUFDM0M7QUFDQSxJQUFhLFNBQXdCLHVCQUFRQSxhQUFvQjtBQUNqRSxJQUFhLGdCQUFnQixTQUFTLE9BQU8sUUFBUSxPQUFPLFNBQVM7Q0FDakUsTUFBTSxNQUFNLE9BQU87RUFBRSxHQUFHO0VBQU0sV0FBVztDQUFXLElBQUksRUFBRSxXQUFXLFdBQVc7Q0FDaEYsT0FBTyxZQUFZLElBQUksQ0FBQyxDQUFDLFFBQVEsT0FBTyxHQUFHO0FBQy9DO0FBQ0EsSUFBYSxjQUE2Qiw0QkFBYUEsYUFBb0I7QUFDM0UsSUFBYSxnQkFBZ0IsU0FBUyxPQUFPLFFBQVEsT0FBTyxTQUFTO0NBQ2pFLE9BQU8sWUFBWSxJQUFJLENBQUMsQ0FBQyxRQUFRLE9BQU8sSUFBSTtBQUNoRDtBQUNBLElBQWEsY0FBNkIsNEJBQWFBLGFBQW9CO0FBQzNFLElBQWEsZUFBZSxVQUFVLFFBQVEsT0FBTyxTQUFTO0NBQzFELE1BQU0sTUFBTSxPQUFPO0VBQUUsR0FBRztFQUFNLFdBQVc7Q0FBVyxJQUFJLEVBQUUsV0FBVyxXQUFXO0NBQ2hGLE9BQU8sV0FBVyxJQUFJLENBQUMsQ0FBQyxRQUFRLE9BQU8sR0FBRztBQUM5QztBQUNBLElBQWEsYUFBNEIsMkJBQVlBLGFBQW9CO0FBQ3pFLElBQWEsZUFBZSxVQUFVLFFBQVEsT0FBTyxTQUFTO0NBQzFELE9BQU8sV0FBVyxJQUFJLENBQUMsQ0FBQyxRQUFRLE9BQU8sSUFBSTtBQUMvQztBQUNBLElBQWEsYUFBNEIsMkJBQVlBLGFBQW9CO0FBQ3pFLElBQWEsb0JBQW9CLFNBQVMsT0FBTyxRQUFRLE9BQU8sU0FBUztDQUNyRSxNQUFNLE1BQU0sT0FBTztFQUFFLEdBQUc7RUFBTSxXQUFXO0NBQVcsSUFBSSxFQUFFLFdBQVcsV0FBVztDQUNoRixPQUFPLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxRQUFRLE9BQU8sR0FBRztBQUNuRDtBQUNBLElBQWEsa0JBQWlDLGdDQUFpQkEsYUFBb0I7QUFDbkYsSUFBYSxvQkFBb0IsU0FBUyxPQUFPLFFBQVEsT0FBTyxTQUFTO0NBQ3JFLE9BQU8sZ0JBQWdCLElBQUksQ0FBQyxDQUFDLFFBQVEsT0FBTyxJQUFJO0FBQ3BEO0FBQ0EsSUFBYSxrQkFBaUMsZ0NBQWlCQSxhQUFvQiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzXX0=