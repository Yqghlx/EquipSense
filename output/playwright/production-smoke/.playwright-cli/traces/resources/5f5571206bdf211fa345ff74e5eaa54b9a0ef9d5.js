import { i as __toESM } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { t as require_jsx_runtime } from "/node_modules/.vite/deps/react_jsx-runtime.js?v=1d2f6f90";
//#region node_modules/@tanstack/query-core/build/modern/subscribable.js
var Subscribable = class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Set();
		this.subscribe = this.subscribe.bind(this);
	}
	subscribe(listener) {
		this.listeners.add(listener);
		this.onSubscribe();
		return () => {
			this.listeners.delete(listener);
			this.onUnsubscribe();
		};
	}
	hasListeners() {
		return this.listeners.size > 0;
	}
	onSubscribe() {}
	onUnsubscribe() {}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/focusManager.js
var FocusManager = class extends Subscribable {
	#focused;
	#cleanup;
	#setup;
	constructor() {
		super();
		this.#setup = (onFocus) => {
			if (typeof window !== "undefined" && window.addEventListener) {
				const listener = () => onFocus();
				window.addEventListener("visibilitychange", listener, false);
				return () => {
					window.removeEventListener("visibilitychange", listener);
				};
			}
		};
	}
	onSubscribe() {
		if (!this.#cleanup) this.setEventListener(this.#setup);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			this.#cleanup?.();
			this.#cleanup = void 0;
		}
	}
	setEventListener(setup) {
		this.#setup = setup;
		this.#cleanup?.();
		this.#cleanup = setup((focused) => {
			if (typeof focused === "boolean") this.setFocused(focused);
			else this.onFocus();
		});
	}
	setFocused(focused) {
		if (this.#focused !== focused) {
			this.#focused = focused;
			this.onFocus();
		}
	}
	onFocus() {
		const isFocused = this.isFocused();
		this.listeners.forEach((listener) => {
			listener(isFocused);
		});
	}
	isFocused() {
		if (typeof this.#focused === "boolean") return this.#focused;
		return globalThis.document?.visibilityState !== "hidden";
	}
};
var focusManager = new FocusManager();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/timeoutManager.js
var defaultTimeoutProvider = {
	setTimeout: (callback, delay) => setTimeout(callback, delay),
	clearTimeout: (timeoutId) => clearTimeout(timeoutId),
	setInterval: (callback, delay) => setInterval(callback, delay),
	clearInterval: (intervalId) => clearInterval(intervalId)
};
var TimeoutManager = class {
	#provider = defaultTimeoutProvider;
	#providerCalled = false;
	setTimeoutProvider(provider) {
		if (this.#providerCalled && provider !== this.#provider) console.error(`[timeoutManager]: Switching provider after calls to previous provider might result in unexpected behavior.`, {
			previous: this.#provider,
			provider
		});
		this.#provider = provider;
		this.#providerCalled = false;
	}
	setTimeout(callback, delay) {
		this.#providerCalled = true;
		return this.#provider.setTimeout(callback, delay);
	}
	clearTimeout(timeoutId) {
		this.#provider.clearTimeout(timeoutId);
	}
	setInterval(callback, delay) {
		this.#providerCalled = true;
		return this.#provider.setInterval(callback, delay);
	}
	clearInterval(intervalId) {
		this.#provider.clearInterval(intervalId);
	}
};
var timeoutManager = new TimeoutManager();
function systemSetTimeoutZero(callback) {
	setTimeout(callback, 0);
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/utils.js
var isServer = typeof window === "undefined" || "Deno" in globalThis;
function noop() {}
function functionalUpdate(updater, input) {
	return typeof updater === "function" ? updater(input) : updater;
}
function isValidTimeout(value) {
	return typeof value === "number" && value >= 0 && value !== Infinity;
}
function timeUntilStale(updatedAt, staleTime) {
	return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
function resolveStaleTime(staleTime, query) {
	return typeof staleTime === "function" ? staleTime(query) : staleTime;
}
function resolveQueryBoolean(option, query) {
	return typeof option === "function" ? option(query) : option;
}
function matchQuery(filters, query) {
	const { type = "all", exact, fetchStatus, predicate, queryKey, stale } = filters;
	if (queryKey) {
		if (exact) {
			if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) return false;
		} else if (!partialMatchKey(query.queryKey, queryKey)) return false;
	}
	if (type !== "all") {
		const isActive = query.isActive();
		if (type === "active" && !isActive) return false;
		if (type === "inactive" && isActive) return false;
	}
	if (typeof stale === "boolean" && query.isStale() !== stale) return false;
	if (fetchStatus && fetchStatus !== query.state.fetchStatus) return false;
	if (predicate && !predicate(query)) return false;
	return true;
}
function matchMutation(filters, mutation) {
	const { exact, status, predicate, mutationKey } = filters;
	if (mutationKey) {
		if (!mutation.options.mutationKey) return false;
		if (exact) {
			if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) return false;
		} else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) return false;
	}
	if (status && mutation.state.status !== status) return false;
	if (predicate && !predicate(mutation)) return false;
	return true;
}
function hashQueryKeyByOptions(queryKey, options) {
	return (options?.queryKeyHashFn || hashKey)(queryKey);
}
function hashKey(queryKey) {
	return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
		result[key] = val[key];
		return result;
	}, {}) : val);
}
function partialMatchKey(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a && b && typeof a === "object" && typeof b === "object") return Object.keys(b).every((key) => partialMatchKey(a[key], b[key]));
	return false;
}
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(a, b, depth = 0) {
	if (a === b) return a;
	if (depth > 500) return b;
	const array = isPlainArray(a) && isPlainArray(b);
	if (!array && !(isPlainObject(a) && isPlainObject(b))) return b;
	const aSize = (array ? a : Object.keys(a)).length;
	const bItems = array ? b : Object.keys(b);
	const bSize = bItems.length;
	const copy = array ? new Array(bSize) : {};
	let equalItems = 0;
	for (let i = 0; i < bSize; i++) {
		const key = array ? i : bItems[i];
		const aItem = a[key];
		const bItem = b[key];
		if (aItem === bItem) {
			copy[key] = aItem;
			if (array ? i < aSize : hasOwn.call(a, key)) equalItems++;
			continue;
		}
		if (aItem === null || bItem === null || typeof aItem !== "object" || typeof bItem !== "object") {
			copy[key] = bItem;
			continue;
		}
		const v = replaceEqualDeep(aItem, bItem, depth + 1);
		copy[key] = v;
		if (v === aItem) equalItems++;
	}
	return aSize === bSize && equalItems === aSize ? a : copy;
}
function shallowEqualObjects(a, b) {
	if (!b || Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) if (a[key] !== b[key]) return false;
	return true;
}
function isPlainArray(value) {
	return Array.isArray(value) && value.length === Object.keys(value).length;
}
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	if (Object.getPrototypeOf(o) !== Object.prototype) return false;
	return true;
}
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
function sleep(timeout) {
	return new Promise((resolve) => {
		timeoutManager.setTimeout(resolve, timeout);
	});
}
function replaceData(prevData, data, options) {
	if (typeof options.structuralSharing === "function") return options.structuralSharing(prevData, data);
	else if (options.structuralSharing !== false) try {
		return replaceEqualDeep(prevData, data);
	} catch (error) {
		console.error(`Structural sharing requires data to be JSON serializable. To fix this, turn off structuralSharing or return JSON-serializable data from your queryFn. [${options.queryHash}]: ${error}`);
		throw error;
	}
	return data;
}
function keepPreviousData(previousData) {
	return previousData;
}
function addToEnd(items, item, max = 0) {
	const newItems = [...items, item];
	return max && newItems.length > max ? newItems.slice(1) : newItems;
}
function addToStart(items, item, max = 0) {
	const newItems = [item, ...items];
	return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
}
var skipToken = /* @__PURE__ */ Symbol();
function ensureQueryFn(options, fetchOptions) {
	if (options.queryFn === skipToken) console.error(`Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${options.queryHash}'`);
	if (!options.queryFn && fetchOptions?.initialPromise) return () => fetchOptions.initialPromise;
	if (!options.queryFn || options.queryFn === skipToken) return () => Promise.reject(/* @__PURE__ */ new Error(`Missing queryFn: '${options.queryHash}'`));
	return options.queryFn;
}
function shouldThrowError(throwOnError, params) {
	if (typeof throwOnError === "function") return throwOnError(...params);
	return !!throwOnError;
}
function addConsumeAwareSignal(object, getSignal, onCancelled) {
	let consumed = false;
	let signal;
	Object.defineProperty(object, "signal", {
		enumerable: true,
		get: () => {
			signal ??= getSignal();
			if (consumed) return signal;
			consumed = true;
			if (signal.aborted) onCancelled();
			else signal.addEventListener("abort", onCancelled, { once: true });
			return signal;
		}
	});
	return object;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/environmentManager.js
var environmentManager = /* @__PURE__ */ (() => {
	let isServerFn = () => isServer;
	return {
		/**
		* Returns whether the current runtime should be treated as a server environment.
		*/
		isServer() {
			return isServerFn();
		},
		/**
		* Overrides the server check globally.
		*/
		setIsServer(isServerValue) {
			isServerFn = isServerValue;
		}
	};
})();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/thenable.js
function pendingThenable() {
	let resolve;
	let reject;
	const thenable = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	thenable.status = "pending";
	thenable.catch(() => {});
	function finalize(data) {
		Object.assign(thenable, data);
		delete thenable.resolve;
		delete thenable.reject;
	}
	thenable.resolve = (value) => {
		finalize({
			status: "fulfilled",
			value
		});
		resolve(value);
	};
	thenable.reject = (reason) => {
		finalize({
			status: "rejected",
			reason
		});
		reject(reason);
	};
	return thenable;
}
function tryResolveSync(promise) {
	let data;
	promise.then((result) => {
		data = result;
		return result;
	}, noop)?.catch(noop);
	if (data !== void 0) return { data };
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/hydration.js
function defaultTransformerFn(data) {
	return data;
}
function dehydrateMutation(mutation) {
	return {
		mutationKey: mutation.options.mutationKey,
		state: mutation.state,
		...mutation.options.scope && { scope: mutation.options.scope },
		...mutation.meta && { meta: mutation.meta }
	};
}
function dehydrateQuery(query, serializeData, shouldRedactErrors) {
	const dehydratePromise = () => {
		const promise = query.promise?.then(serializeData).catch((error) => {
			if (!shouldRedactErrors(error)) return Promise.reject(error);
			console.error(`A query that was dehydrated as pending ended up rejecting. [${query.queryHash}]: ${error}; The error will be redacted in production builds`);
			return Promise.reject(/* @__PURE__ */ new Error("redacted"));
		});
		promise?.catch(noop);
		return promise;
	};
	return {
		dehydratedAt: Date.now(),
		state: {
			...query.state,
			...query.state.data !== void 0 && { data: serializeData(query.state.data) }
		},
		queryKey: query.queryKey,
		queryHash: query.queryHash,
		...query.state.status === "pending" && { promise: dehydratePromise() },
		...query.meta && { meta: query.meta },
		...query.queryType && { queryType: query.queryType }
	};
}
function defaultShouldDehydrateMutation(mutation) {
	return mutation.state.isPaused;
}
function defaultShouldDehydrateQuery(query) {
	return query.state.status === "success";
}
function defaultShouldRedactErrors(_) {
	return true;
}
function dehydrate(client, options = {}) {
	const filterMutation = options.shouldDehydrateMutation ?? client.getDefaultOptions().dehydrate?.shouldDehydrateMutation ?? defaultShouldDehydrateMutation;
	const mutations = client.getMutationCache().getAll().flatMap((mutation) => filterMutation(mutation) ? [dehydrateMutation(mutation)] : []);
	const filterQuery = options.shouldDehydrateQuery ?? client.getDefaultOptions().dehydrate?.shouldDehydrateQuery ?? defaultShouldDehydrateQuery;
	const shouldRedactErrors = options.shouldRedactErrors ?? client.getDefaultOptions().dehydrate?.shouldRedactErrors ?? defaultShouldRedactErrors;
	const serializeData = options.serializeData ?? client.getDefaultOptions().dehydrate?.serializeData ?? defaultTransformerFn;
	return {
		mutations,
		queries: client.getQueryCache().getAll().flatMap((query) => filterQuery(query) ? [dehydrateQuery(query, serializeData, shouldRedactErrors)] : [])
	};
}
function hydrate(client, dehydratedState, options) {
	if (typeof dehydratedState !== "object" || dehydratedState === null) return;
	const mutationCache = client.getMutationCache();
	const queryCache = client.getQueryCache();
	const deserializeData = options?.defaultOptions?.deserializeData ?? client.getDefaultOptions().hydrate?.deserializeData ?? defaultTransformerFn;
	const mutations = dehydratedState.mutations || [];
	const queries = dehydratedState.queries || [];
	mutations.forEach(({ state, ...mutationOptions }) => {
		mutationCache.build(client, {
			...client.getDefaultOptions().hydrate?.mutations,
			...options?.defaultOptions?.mutations,
			...mutationOptions
		}, state);
	});
	queries.forEach(({ queryKey, state, queryHash, meta, promise, dehydratedAt, queryType }) => {
		const syncData = promise ? tryResolveSync(promise) : void 0;
		const rawData = state.data === void 0 ? syncData?.data : state.data;
		const data = rawData === void 0 ? rawData : deserializeData(rawData);
		let query = queryCache.get(queryHash);
		const existingQueryIsPending = query?.state.status === "pending";
		const existingQueryIsFetching = query?.state.fetchStatus === "fetching";
		if (query) {
			const hasNewerSyncData = syncData && dehydratedAt !== void 0 && dehydratedAt > query.state.dataUpdatedAt;
			if (state.dataUpdatedAt > query.state.dataUpdatedAt || hasNewerSyncData) {
				const { fetchStatus: _ignored, ...serializedState } = state;
				query.setState({
					...serializedState,
					data,
					...state.status === "pending" && data !== void 0 && {
						status: "success",
						...!existingQueryIsFetching && { fetchStatus: "idle" }
					}
				});
			}
		} else query = queryCache.build(client, {
			...client.getDefaultOptions().hydrate?.queries,
			...options?.defaultOptions?.queries,
			queryKey,
			queryHash,
			meta,
			_type: queryType
		}, {
			...state,
			data,
			fetchStatus: "idle",
			status: state.status === "pending" && data !== void 0 ? "success" : state.status
		});
		if (promise && !syncData && !existingQueryIsPending && !existingQueryIsFetching && (dehydratedAt === void 0 || dehydratedAt > query.state.dataUpdatedAt)) query.fetch(void 0, { initialPromise: Promise.resolve(promise).then(deserializeData) }).catch(noop);
	});
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/notifyManager.js
var defaultScheduler = systemSetTimeoutZero;
function createNotifyManager() {
	let queue = [];
	let transactions = 0;
	let notifyFn = (callback) => {
		callback();
	};
	let batchNotifyFn = (callback) => {
		callback();
	};
	let scheduleFn = defaultScheduler;
	const schedule = (callback) => {
		if (transactions) queue.push(callback);
		else scheduleFn(() => {
			notifyFn(callback);
		});
	};
	const flush = () => {
		const originalQueue = queue;
		queue = [];
		if (originalQueue.length) scheduleFn(() => {
			batchNotifyFn(() => {
				originalQueue.forEach((callback) => {
					notifyFn(callback);
				});
			});
		});
	};
	return {
		batch: (callback) => {
			let result;
			transactions++;
			try {
				result = callback();
			} finally {
				transactions--;
				if (!transactions) flush();
			}
			return result;
		},
		/**
		* All calls to the wrapped function will be batched.
		*/
		batchCalls: (callback) => {
			return (...args) => {
				schedule(() => {
					callback(...args);
				});
			};
		},
		schedule,
		/**
		* Use this method to set a custom notify function.
		* This can be used to for example wrap notifications with `React.act` while running tests.
		*/
		setNotifyFunction: (fn) => {
			notifyFn = fn;
		},
		/**
		* Use this method to set a custom function to batch notifications together into a single tick.
		* By default React Query will use the batch function provided by ReactDOM or React Native.
		*/
		setBatchNotifyFunction: (fn) => {
			batchNotifyFn = fn;
		},
		setScheduler: (fn) => {
			scheduleFn = fn;
		}
	};
}
var notifyManager = createNotifyManager();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/onlineManager.js
var OnlineManager = class extends Subscribable {
	#online = true;
	#cleanup;
	#setup;
	constructor() {
		super();
		this.#setup = (onOnline) => {
			if (typeof window !== "undefined" && window.addEventListener) {
				const onlineListener = () => onOnline(true);
				const offlineListener = () => onOnline(false);
				window.addEventListener("online", onlineListener, false);
				window.addEventListener("offline", offlineListener, false);
				return () => {
					window.removeEventListener("online", onlineListener);
					window.removeEventListener("offline", offlineListener);
				};
			}
		};
	}
	onSubscribe() {
		if (!this.#cleanup) this.setEventListener(this.#setup);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			this.#cleanup?.();
			this.#cleanup = void 0;
		}
	}
	setEventListener(setup) {
		this.#setup = setup;
		this.#cleanup?.();
		this.#cleanup = setup(this.setOnline.bind(this));
	}
	setOnline(online) {
		if (this.#online !== online) {
			this.#online = online;
			this.listeners.forEach((listener) => {
				listener(online);
			});
		}
	}
	isOnline() {
		return this.#online;
	}
};
var onlineManager = new OnlineManager();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/retryer.js
function defaultRetryDelay(failureCount) {
	return Math.min(1e3 * 2 ** failureCount, 3e4);
}
function canFetch(networkMode) {
	return (networkMode ?? "online") === "online" ? onlineManager.isOnline() : true;
}
var CancelledError = class extends Error {
	constructor(options) {
		super("CancelledError");
		this.revert = options?.revert;
		this.silent = options?.silent;
	}
};
function isCancelledError(value) {
	return value instanceof CancelledError;
}
function createRetryer(config) {
	let isRetryCancelled = false;
	let failureCount = 0;
	let continueFn;
	const thenable = pendingThenable();
	const isResolved = () => thenable.status !== "pending";
	const cancel = (cancelOptions) => {
		if (!isResolved()) {
			const error = new CancelledError(cancelOptions);
			reject(error);
			config.onCancel?.(error);
		}
	};
	const cancelRetry = () => {
		isRetryCancelled = true;
	};
	const continueRetry = () => {
		isRetryCancelled = false;
	};
	const canContinue = () => focusManager.isFocused() && (config.networkMode === "always" || onlineManager.isOnline()) && config.canRun();
	const canStart = () => canFetch(config.networkMode) && config.canRun();
	const resolve = (value) => {
		if (!isResolved()) {
			continueFn?.();
			thenable.resolve(value);
		}
	};
	const reject = (value) => {
		if (!isResolved()) {
			continueFn?.();
			thenable.reject(value);
		}
	};
	const pause = () => {
		return new Promise((continueResolve) => {
			continueFn = (value) => {
				if (isResolved() || canContinue()) continueResolve(value);
			};
			config.onPause?.();
		}).then(() => {
			continueFn = void 0;
			if (!isResolved()) config.onContinue?.();
		});
	};
	const run = () => {
		if (isResolved()) return;
		let promiseOrValue;
		const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
		try {
			promiseOrValue = initialPromise ?? config.fn();
		} catch (error) {
			promiseOrValue = Promise.reject(error);
		}
		Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
			if (isResolved()) return;
			const retry = config.retry ?? (environmentManager.isServer() ? 0 : 3);
			const retryDelay = config.retryDelay ?? defaultRetryDelay;
			const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
			const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
			if (isRetryCancelled || !shouldRetry) {
				reject(error);
				return;
			}
			failureCount++;
			config.onFail?.(failureCount, error);
			sleep(delay).then(() => {
				return canContinue() ? void 0 : pause();
			}).then(() => {
				if (isRetryCancelled) reject(error);
				else run();
			});
		});
	};
	return {
		promise: thenable,
		status: () => thenable.status,
		cancel,
		continue: () => {
			continueFn?.();
			return thenable;
		},
		cancelRetry,
		continueRetry,
		canStart,
		start: () => {
			if (canStart()) run();
			else pause().then(run);
			return thenable;
		}
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/removable.js
var Removable = class {
	#gcTimeout;
	destroy() {
		this.clearGcTimeout();
	}
	scheduleGc() {
		this.clearGcTimeout();
		if (isValidTimeout(this.gcTime)) this.#gcTimeout = timeoutManager.setTimeout(() => {
			this.optionalRemove();
		}, this.gcTime);
	}
	updateGcTime(newGcTime) {
		this.gcTime = Math.max(this.gcTime || 0, newGcTime ?? (environmentManager.isServer() ? Infinity : 3e5));
	}
	clearGcTimeout() {
		if (this.#gcTimeout !== void 0) {
			timeoutManager.clearTimeout(this.#gcTimeout);
			this.#gcTimeout = void 0;
		}
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
function infiniteQueryBehavior(pages) {
	return { onFetch: (context, query) => {
		const options = context.options;
		const direction = context.fetchOptions?.meta?.fetchMore?.direction;
		const oldPages = context.state.data?.pages || [];
		const oldPageParams = context.state.data?.pageParams || [];
		let result = {
			pages: [],
			pageParams: []
		};
		let currentPage = 0;
		const fetchFn = async () => {
			let cancelled = false;
			const addSignalProperty = (object) => {
				addConsumeAwareSignal(object, () => context.signal, () => cancelled = true);
			};
			const queryFn = ensureQueryFn(context.options, context.fetchOptions);
			const fetchPage = async (data, param, previous) => {
				if (cancelled) return Promise.reject(context.signal.reason);
				if (param == null && data.pages.length) return Promise.resolve(data);
				const createQueryFnContext = () => {
					const queryFnContext2 = {
						client: context.client,
						queryKey: context.queryKey,
						pageParam: param,
						direction: previous ? "backward" : "forward",
						meta: context.options.meta
					};
					addSignalProperty(queryFnContext2);
					return queryFnContext2;
				};
				const queryFnContext = createQueryFnContext();
				const page = await queryFn(queryFnContext);
				const { maxPages } = context.options;
				const addTo = previous ? addToStart : addToEnd;
				return {
					pages: addTo(data.pages, page, maxPages),
					pageParams: addTo(data.pageParams, param, maxPages)
				};
			};
			if (direction && oldPages.length) {
				const previous = direction === "backward";
				const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
				const oldData = {
					pages: oldPages,
					pageParams: oldPageParams
				};
				result = await fetchPage(oldData, pageParamFn(options, oldData), previous);
			} else {
				const remainingPages = pages ?? oldPages.length;
				do {
					const param = currentPage === 0 ? oldPageParams[0] ?? options.initialPageParam : getNextPageParam(options, result);
					if (currentPage > 0 && param == null) break;
					result = await fetchPage(result, param);
					currentPage++;
				} while (currentPage < remainingPages);
			}
			return result;
		};
		if (context.options.persister) context.fetchFn = () => {
			return context.options.persister?.(fetchFn, {
				client: context.client,
				queryKey: context.queryKey,
				meta: context.options.meta,
				signal: context.signal
			}, query);
		};
		else context.fetchFn = fetchFn;
	} };
}
function getNextPageParam(options, { pages, pageParams }) {
	const lastIndex = pages.length - 1;
	return pages.length > 0 ? options.getNextPageParam(pages[lastIndex], pages, pageParams[lastIndex], pageParams) : void 0;
}
function getPreviousPageParam(options, { pages, pageParams }) {
	return pages.length > 0 ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams) : void 0;
}
function hasNextPage(options, data) {
	if (!data) return false;
	return getNextPageParam(options, data) != null;
}
function hasPreviousPage(options, data) {
	if (!data || !options.getPreviousPageParam) return false;
	return getPreviousPageParam(options, data) != null;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/query.js
var Query = class extends Removable {
	#queryType;
	#initialState;
	#revertState;
	#cache;
	#client;
	#retryer;
	#defaultOptions;
	#abortSignalConsumed;
	constructor(config) {
		super();
		this.#abortSignalConsumed = false;
		this.#defaultOptions = config.defaultOptions;
		this.setOptions(config.options);
		this.observers = [];
		this.#client = config.client;
		this.#cache = this.#client.getQueryCache();
		this.queryKey = config.queryKey;
		this.queryHash = config.queryHash;
		this.#initialState = getDefaultState$1(this.options);
		this.state = config.state ?? this.#initialState;
		this.scheduleGc();
	}
	get meta() {
		return this.options.meta;
	}
	get queryType() {
		return this.#queryType;
	}
	get promise() {
		return this.#retryer?.promise;
	}
	setOptions(options) {
		this.options = {
			...this.#defaultOptions,
			...options
		};
		if (options?._type) this.#queryType = options._type;
		this.updateGcTime(this.options.gcTime);
		if (this.state && this.state.data === void 0) {
			const defaultState = getDefaultState$1(this.options);
			if (defaultState.data !== void 0) {
				this.setState(successState(defaultState.data, defaultState.dataUpdatedAt));
				this.#initialState = defaultState;
			}
		}
	}
	optionalRemove() {
		if (!this.observers.length && this.state.fetchStatus === "idle") this.#cache.remove(this);
	}
	setData(newData, options) {
		const data = replaceData(this.state.data, newData, this.options);
		this.#dispatch({
			data,
			type: "success",
			dataUpdatedAt: options?.updatedAt,
			manual: options?.manual
		});
		return data;
	}
	setState(state) {
		this.#dispatch({
			type: "setState",
			state
		});
	}
	cancel(options) {
		const promise = this.#retryer?.promise;
		this.#retryer?.cancel(options);
		return promise ? promise.then(noop).catch(noop) : Promise.resolve();
	}
	destroy() {
		super.destroy();
		this.cancel({ silent: true });
	}
	get resetState() {
		return this.#initialState;
	}
	reset() {
		this.destroy();
		this.setState(this.resetState);
	}
	isActive() {
		return this.observers.some((observer) => resolveQueryBoolean(observer.options.enabled, this) !== false);
	}
	isDisabled() {
		if (this.getObserversCount() > 0) return !this.isActive();
		return this.options.queryFn === skipToken || !this.isFetched();
	}
	isFetched() {
		return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
	}
	isStatic() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => resolveStaleTime(observer.options.staleTime, this) === "static");
		return false;
	}
	isStale() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => observer.getCurrentResult().isStale);
		return this.state.data === void 0 || this.state.isInvalidated;
	}
	isStaleByTime(staleTime = 0) {
		if (this.state.data === void 0) return true;
		if (staleTime === "static") return false;
		if (this.state.isInvalidated) return true;
		return !timeUntilStale(this.state.dataUpdatedAt, staleTime);
	}
	onFocus() {
		this.observers.find((x) => x.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: false });
		this.#retryer?.continue();
	}
	onOnline() {
		this.observers.find((x) => x.shouldFetchOnReconnect())?.refetch({ cancelRefetch: false });
		this.#retryer?.continue();
	}
	addObserver(observer) {
		if (!this.observers.includes(observer)) {
			this.observers.push(observer);
			this.clearGcTimeout();
			this.#cache.notify({
				type: "observerAdded",
				query: this,
				observer
			});
		}
	}
	removeObserver(observer) {
		if (this.observers.includes(observer)) {
			this.observers = this.observers.filter((x) => x !== observer);
			if (!this.observers.length) {
				if (this.#retryer) if (this.#abortSignalConsumed || this.#isInitialPausedFetch()) this.#retryer.cancel({ revert: true });
				else this.#retryer.cancelRetry();
				this.scheduleGc();
			}
			this.#cache.notify({
				type: "observerRemoved",
				query: this,
				observer
			});
		}
	}
	getObserversCount() {
		return this.observers.length;
	}
	#isInitialPausedFetch() {
		return this.state.fetchStatus === "paused" && this.state.status === "pending";
	}
	invalidate() {
		if (!this.state.isInvalidated) this.#dispatch({ type: "invalidate" });
	}
	async fetch(options, fetchOptions) {
		if (this.state.fetchStatus !== "idle" && this.#retryer?.status() !== "rejected") {
			if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) this.cancel({ silent: true });
			else if (this.#retryer) {
				this.#retryer.continueRetry();
				return this.#retryer.promise;
			}
		}
		if (options) this.setOptions(options);
		if (!this.options.queryFn) {
			const observer = this.observers.find((x) => x.options.queryFn);
			if (observer) this.setOptions(observer.options);
		}
		if (!Array.isArray(this.options.queryKey)) console.error(`As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`);
		const abortController = new AbortController();
		const addSignalProperty = (object) => {
			Object.defineProperty(object, "signal", {
				enumerable: true,
				get: () => {
					this.#abortSignalConsumed = true;
					return abortController.signal;
				}
			});
		};
		const fetchFn = () => {
			const queryFn = ensureQueryFn(this.options, fetchOptions);
			const createQueryFnContext = () => {
				const queryFnContext2 = {
					client: this.#client,
					queryKey: this.queryKey,
					meta: this.meta
				};
				addSignalProperty(queryFnContext2);
				return queryFnContext2;
			};
			const queryFnContext = createQueryFnContext();
			this.#abortSignalConsumed = false;
			if (this.options.persister) return this.options.persister(queryFn, queryFnContext, this);
			return queryFn(queryFnContext);
		};
		const createFetchContext = () => {
			const context2 = {
				fetchOptions,
				options: this.options,
				queryKey: this.queryKey,
				client: this.#client,
				state: this.state,
				fetchFn
			};
			addSignalProperty(context2);
			return context2;
		};
		const context = createFetchContext();
		(this.#queryType === "infinite" ? infiniteQueryBehavior(this.options.pages) : this.options.behavior)?.onFetch(context, this);
		this.#revertState = this.state;
		if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== context.fetchOptions?.meta) this.#dispatch({
			type: "fetch",
			meta: context.fetchOptions?.meta
		});
		this.#retryer = createRetryer({
			initialPromise: fetchOptions?.initialPromise,
			fn: context.fetchFn,
			onCancel: (error) => {
				if (error instanceof CancelledError && error.revert) this.setState({
					...this.#revertState,
					fetchStatus: "idle"
				});
				abortController.abort();
			},
			onFail: (failureCount, error) => {
				this.#dispatch({
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				this.#dispatch({ type: "pause" });
			},
			onContinue: () => {
				this.#dispatch({ type: "continue" });
			},
			retry: context.options.retry,
			retryDelay: context.options.retryDelay,
			networkMode: context.options.networkMode,
			canRun: () => true
		});
		try {
			const data = await this.#retryer.start();
			if (data === void 0) {
				console.error(`Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`);
				throw new Error(`${this.queryHash} data is undefined`);
			}
			this.setData(data);
			this.#cache.config.onSuccess?.(data, this);
			this.#cache.config.onSettled?.(data, this.state.error, this);
			return data;
		} catch (error) {
			if (error instanceof CancelledError) {
				if (error.silent) return this.#retryer.promise;
				else if (error.revert) {
					if (this.state.data === void 0) throw error;
					return this.state.data;
				}
			}
			this.#dispatch({
				type: "error",
				error
			});
			this.#cache.config.onError?.(error, this);
			this.#cache.config.onSettled?.(this.state.data, error, this);
			throw error;
		} finally {
			this.scheduleGc();
		}
	}
	#dispatch(action) {
		const reducer = (state) => {
			switch (action.type) {
				case "failed": return {
					...state,
					fetchFailureCount: action.failureCount,
					fetchFailureReason: action.error
				};
				case "pause": return {
					...state,
					fetchStatus: "paused"
				};
				case "continue": return {
					...state,
					fetchStatus: "fetching"
				};
				case "fetch": return {
					...state,
					...fetchState(state.data, this.options),
					fetchMeta: action.meta ?? null
				};
				case "success":
					const newState = {
						...state,
						...successState(action.data, action.dataUpdatedAt),
						dataUpdateCount: state.dataUpdateCount + 1,
						...!action.manual && {
							fetchStatus: "idle",
							fetchFailureCount: 0,
							fetchFailureReason: null
						}
					};
					this.#revertState = action.manual ? newState : void 0;
					return newState;
				case "error":
					const error = action.error;
					return {
						...state,
						error,
						errorUpdateCount: state.errorUpdateCount + 1,
						errorUpdatedAt: Date.now(),
						fetchFailureCount: state.fetchFailureCount + 1,
						fetchFailureReason: error,
						fetchStatus: "idle",
						status: "error",
						isInvalidated: true
					};
				case "invalidate": return {
					...state,
					isInvalidated: true
				};
				case "setState": return {
					...state,
					...action.state
				};
			}
		};
		this.state = reducer(this.state);
		notifyManager.batch(() => {
			this.observers.forEach((observer) => {
				observer.onQueryUpdate();
			});
			this.#cache.notify({
				query: this,
				type: "updated",
				action
			});
		});
	}
};
function fetchState(data, options) {
	return {
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchStatus: canFetch(options.networkMode) ? "fetching" : "paused",
		...data === void 0 && {
			error: null,
			status: "pending"
		}
	};
}
function successState(data, dataUpdatedAt) {
	return {
		data,
		dataUpdatedAt: dataUpdatedAt ?? Date.now(),
		error: null,
		isInvalidated: false,
		status: "success"
	};
}
function getDefaultState$1(options) {
	const data = typeof options.initialData === "function" ? options.initialData() : options.initialData;
	const hasData = data !== void 0;
	const initialDataUpdatedAt = hasData ? typeof options.initialDataUpdatedAt === "function" ? options.initialDataUpdatedAt() : options.initialDataUpdatedAt : 0;
	return {
		data,
		dataUpdateCount: 0,
		dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
		error: null,
		errorUpdateCount: 0,
		errorUpdatedAt: 0,
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchMeta: null,
		isInvalidated: false,
		status: hasData ? "success" : "pending",
		fetchStatus: "idle"
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryObserver.js
var QueryObserver = class extends Subscribable {
	constructor(client, options) {
		super();
		this.options = options;
		this.#client = client;
		this.#selectError = null;
		this.#currentThenable = pendingThenable();
		this.bindMethods();
		this.setOptions(options);
	}
	#client;
	#currentQuery = void 0;
	#currentQueryInitialState = void 0;
	#currentResult = void 0;
	#currentResultState;
	#currentResultOptions;
	#currentThenable;
	#selectError;
	#selectFn;
	#selectResult;
	#lastQueryWithDefinedData;
	#staleTimeoutId;
	#refetchIntervalId;
	#currentRefetchInterval;
	#trackedProps = /* @__PURE__ */ new Set();
	bindMethods() {
		this.refetch = this.refetch.bind(this);
	}
	onSubscribe() {
		if (this.listeners.size === 1) {
			this.#currentQuery.addObserver(this);
			if (shouldFetchOnMount(this.#currentQuery, this.options)) this.#executeFetch();
			else this.updateResult();
			this.#updateTimers();
		}
	}
	onUnsubscribe() {
		if (!this.hasListeners()) this.destroy();
	}
	shouldFetchOnReconnect() {
		return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnReconnect);
	}
	shouldFetchOnWindowFocus() {
		return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnWindowFocus);
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set();
		this.#clearStaleTimeout();
		this.#clearRefetchInterval();
		this.#currentQuery.removeObserver(this);
	}
	setOptions(options) {
		const prevOptions = this.options;
		const prevQuery = this.#currentQuery;
		this.options = this.#client.defaultQueryOptions(options);
		if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveQueryBoolean(this.options.enabled, this.#currentQuery) !== "boolean") throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");
		this.#updateQuery();
		this.#currentQuery.setOptions(this.options);
		if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) this.#client.getQueryCache().notify({
			type: "observerOptionsUpdated",
			query: this.#currentQuery,
			observer: this
		});
		const mounted = this.hasListeners();
		if (mounted && shouldFetchOptionally(this.#currentQuery, prevQuery, this.options, prevOptions)) this.#executeFetch();
		this.updateResult();
		if (mounted && (this.#currentQuery !== prevQuery || resolveQueryBoolean(this.options.enabled, this.#currentQuery) !== resolveQueryBoolean(prevOptions.enabled, this.#currentQuery) || resolveStaleTime(this.options.staleTime, this.#currentQuery) !== resolveStaleTime(prevOptions.staleTime, this.#currentQuery))) this.#updateStaleTimeout();
		const nextRefetchInterval = this.#computeRefetchInterval();
		if (mounted && (this.#currentQuery !== prevQuery || resolveQueryBoolean(this.options.enabled, this.#currentQuery) !== resolveQueryBoolean(prevOptions.enabled, this.#currentQuery) || nextRefetchInterval !== this.#currentRefetchInterval)) this.#updateRefetchInterval(nextRefetchInterval);
	}
	getOptimisticResult(options) {
		const query = this.#client.getQueryCache().build(this.#client, options);
		const result = this.createResult(query, options);
		if (shouldAssignObserverCurrentProperties(this, result)) {
			this.#currentResult = result;
			this.#currentResultOptions = this.options;
			this.#currentResultState = this.#currentQuery.state;
		}
		return result;
	}
	getCurrentResult() {
		return this.#currentResult;
	}
	trackResult(result, onPropTracked) {
		return new Proxy(result, { get: (target, key) => {
			this.trackProp(key);
			onPropTracked?.(key);
			if (key === "promise") {
				this.trackProp("data");
				if (!this.options.experimental_prefetchInRender && this.#currentThenable.status === "pending") this.#currentThenable.reject(/* @__PURE__ */ new Error("experimental_prefetchInRender feature flag is not enabled"));
			}
			return Reflect.get(target, key);
		} });
	}
	trackProp(key) {
		this.#trackedProps.add(key);
	}
	getCurrentQuery() {
		return this.#currentQuery;
	}
	refetch({ ...options } = {}) {
		return this.fetch({ ...options });
	}
	fetchOptimistic(options) {
		const defaultedOptions = this.#client.defaultQueryOptions(options);
		const query = this.#client.getQueryCache().build(this.#client, defaultedOptions);
		return query.fetch().then(() => this.createResult(query, defaultedOptions));
	}
	fetch(fetchOptions) {
		return this.#executeFetch({
			...fetchOptions,
			cancelRefetch: fetchOptions.cancelRefetch ?? true
		}).then(() => {
			this.updateResult();
			return this.#currentResult;
		});
	}
	#executeFetch(fetchOptions) {
		this.#updateQuery();
		let promise = this.#currentQuery.fetch(this.options, fetchOptions);
		if (!fetchOptions?.throwOnError) promise = promise.catch(noop);
		return promise;
	}
	#updateStaleTimeout() {
		this.#clearStaleTimeout();
		const staleTime = resolveStaleTime(this.options.staleTime, this.#currentQuery);
		if (environmentManager.isServer() || this.#currentResult.isStale || !isValidTimeout(staleTime)) return;
		const timeout = timeUntilStale(this.#currentResult.dataUpdatedAt, staleTime) + 1;
		this.#staleTimeoutId = timeoutManager.setTimeout(() => {
			if (!this.#currentResult.isStale) this.updateResult();
		}, timeout);
	}
	#computeRefetchInterval() {
		return (typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(this.#currentQuery) : this.options.refetchInterval) ?? false;
	}
	#updateRefetchInterval(nextInterval) {
		this.#clearRefetchInterval();
		this.#currentRefetchInterval = nextInterval;
		if (environmentManager.isServer() || resolveQueryBoolean(this.options.enabled, this.#currentQuery) === false || !isValidTimeout(this.#currentRefetchInterval) || this.#currentRefetchInterval === 0) return;
		this.#refetchIntervalId = timeoutManager.setInterval(() => {
			if (this.options.refetchIntervalInBackground || focusManager.isFocused()) this.#executeFetch();
		}, this.#currentRefetchInterval);
	}
	#updateTimers() {
		this.#updateStaleTimeout();
		this.#updateRefetchInterval(this.#computeRefetchInterval());
	}
	#clearStaleTimeout() {
		if (this.#staleTimeoutId !== void 0) {
			timeoutManager.clearTimeout(this.#staleTimeoutId);
			this.#staleTimeoutId = void 0;
		}
	}
	#clearRefetchInterval() {
		if (this.#refetchIntervalId !== void 0) {
			timeoutManager.clearInterval(this.#refetchIntervalId);
			this.#refetchIntervalId = void 0;
		}
	}
	createResult(query, options) {
		const prevQuery = this.#currentQuery;
		const prevOptions = this.options;
		const prevResult = this.#currentResult;
		const prevResultState = this.#currentResultState;
		const prevResultOptions = this.#currentResultOptions;
		const queryInitialState = query !== prevQuery ? query.state : this.#currentQueryInitialState;
		const { state } = query;
		let newState = { ...state };
		let isPlaceholderData = false;
		let data;
		if (options._optimisticResults) {
			const mounted = this.hasListeners();
			const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
			const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
			if (fetchOnMount || fetchOptionally) newState = {
				...newState,
				...fetchState(state.data, query.options)
			};
			if (options._optimisticResults === "isRestoring") newState.fetchStatus = "idle";
		}
		let { error, errorUpdatedAt, status } = newState;
		data = newState.data;
		let skipSelect = false;
		if (options.placeholderData !== void 0 && data === void 0 && status === "pending") {
			let placeholderData;
			if (prevResult?.isPlaceholderData && options.placeholderData === prevResultOptions?.placeholderData) {
				placeholderData = prevResult.data;
				skipSelect = true;
			} else placeholderData = typeof options.placeholderData === "function" ? options.placeholderData(this.#lastQueryWithDefinedData?.state.data, this.#lastQueryWithDefinedData) : options.placeholderData;
			if (placeholderData !== void 0) {
				status = "success";
				data = replaceData(prevResult?.data, placeholderData, options);
				isPlaceholderData = true;
			}
		}
		if (options.select && data !== void 0 && !skipSelect) if (prevResult && data === prevResultState?.data && options.select === this.#selectFn) data = this.#selectResult;
		else try {
			this.#selectFn = options.select;
			data = options.select(data);
			data = replaceData(prevResult?.data, data, options);
			this.#selectResult = data;
			this.#selectError = null;
		} catch (selectError) {
			this.#selectError = selectError;
		}
		if (this.#selectError) {
			error = this.#selectError;
			data = this.#selectResult;
			errorUpdatedAt = Date.now();
			status = "error";
		}
		const isFetching = newState.fetchStatus === "fetching";
		const isPending = status === "pending";
		const isError = status === "error";
		const isLoading = isPending && isFetching;
		const hasData = data !== void 0;
		const nextResult = {
			status,
			fetchStatus: newState.fetchStatus,
			isPending,
			isSuccess: status === "success",
			isError,
			isInitialLoading: isLoading,
			isLoading,
			data,
			dataUpdatedAt: newState.dataUpdatedAt,
			error,
			errorUpdatedAt,
			failureCount: newState.fetchFailureCount,
			failureReason: newState.fetchFailureReason,
			errorUpdateCount: newState.errorUpdateCount,
			isFetched: query.isFetched(),
			isFetchedAfterMount: newState.dataUpdateCount > queryInitialState.dataUpdateCount || newState.errorUpdateCount > queryInitialState.errorUpdateCount,
			isFetching,
			isRefetching: isFetching && !isPending,
			isLoadingError: isError && !hasData,
			isPaused: newState.fetchStatus === "paused",
			isPlaceholderData,
			isRefetchError: isError && hasData,
			isStale: isStale(query, options),
			refetch: this.refetch,
			promise: this.#currentThenable,
			isEnabled: resolveQueryBoolean(options.enabled, query) !== false
		};
		if (this.options.experimental_prefetchInRender) {
			const hasResultData = nextResult.data !== void 0;
			const isErrorWithoutData = nextResult.status === "error" && !hasResultData;
			const finalizeThenableIfPossible = (thenable) => {
				if (isErrorWithoutData) thenable.reject(nextResult.error);
				else if (hasResultData) thenable.resolve(nextResult.data);
			};
			const recreateThenable = () => {
				const pending = this.#currentThenable = nextResult.promise = pendingThenable();
				finalizeThenableIfPossible(pending);
			};
			const prevThenable = this.#currentThenable;
			switch (prevThenable.status) {
				case "pending":
					if (query.queryHash === prevQuery.queryHash) finalizeThenableIfPossible(prevThenable);
					break;
				case "fulfilled":
					if (isErrorWithoutData || nextResult.data !== prevThenable.value) recreateThenable();
					break;
				case "rejected": if (!isErrorWithoutData || nextResult.error !== prevThenable.reason) recreateThenable();
			}
		}
		return nextResult;
	}
	updateResult() {
		const prevResult = this.#currentResult;
		const nextResult = this.createResult(this.#currentQuery, this.options);
		this.#currentResultState = this.#currentQuery.state;
		this.#currentResultOptions = this.options;
		if (this.#currentResultState.data !== void 0) this.#lastQueryWithDefinedData = this.#currentQuery;
		if (shallowEqualObjects(nextResult, prevResult)) return;
		this.#currentResult = nextResult;
		const shouldNotifyListeners = () => {
			if (!prevResult) return true;
			const { notifyOnChangeProps } = this.options;
			const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
			if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !this.#trackedProps.size) return true;
			const includedProps = new Set(notifyOnChangePropsValue ?? this.#trackedProps);
			if (this.options.throwOnError) includedProps.add("error");
			return Object.keys(this.#currentResult).some((key) => {
				const typedKey = key;
				return this.#currentResult[typedKey] !== prevResult[typedKey] && includedProps.has(typedKey);
			});
		};
		this.#notify({ listeners: shouldNotifyListeners() });
	}
	#updateQuery() {
		const query = this.#client.getQueryCache().build(this.#client, this.options);
		if (query === this.#currentQuery) return;
		const prevQuery = this.#currentQuery;
		this.#currentQuery = query;
		this.#currentQueryInitialState = query.state;
		if (this.hasListeners()) {
			prevQuery?.removeObserver(this);
			query.addObserver(this);
		}
	}
	onQueryUpdate() {
		this.updateResult();
		if (this.hasListeners()) this.#updateTimers();
	}
	#notify(notifyOptions) {
		notifyManager.batch(() => {
			if (notifyOptions.listeners) this.listeners.forEach((listener) => {
				listener(this.#currentResult);
			});
			this.#client.getQueryCache().notify({
				query: this.#currentQuery,
				type: "observerResultsUpdated"
			});
		});
	}
};
function shouldLoadOnMount(query, options) {
	return resolveQueryBoolean(options.enabled, query) !== false && query.state.data === void 0 && !(query.state.status === "error" && resolveQueryBoolean(options.retryOnMount, query) === false);
}
function shouldFetchOnMount(query, options) {
	return shouldLoadOnMount(query, options) || query.state.data !== void 0 && shouldFetchOn(query, options, options.refetchOnMount);
}
function shouldFetchOn(query, options, field) {
	if (resolveQueryBoolean(options.enabled, query) !== false && resolveStaleTime(options.staleTime, query) !== "static") {
		const value = typeof field === "function" ? field(query) : field;
		return value === "always" || value !== false && isStale(query, options);
	}
	return false;
}
function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
	return (query !== prevQuery || resolveQueryBoolean(prevOptions.enabled, query) === false) && (!options.suspense || query.state.status !== "error") && isStale(query, options);
}
function isStale(query, options) {
	return resolveQueryBoolean(options.enabled, query) !== false && query.isStaleByTime(resolveStaleTime(options.staleTime, query));
}
function shouldAssignObserverCurrentProperties(observer, optimisticResult) {
	if (!shallowEqualObjects(observer.getCurrentResult(), optimisticResult)) return true;
	return false;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/infiniteQueryObserver.js
var InfiniteQueryObserver = class extends QueryObserver {
	constructor(client, options) {
		super(client, options);
	}
	bindMethods() {
		super.bindMethods();
		this.fetchNextPage = this.fetchNextPage.bind(this);
		this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
	}
	setOptions(options) {
		options._type = "infinite";
		super.setOptions(options);
	}
	getOptimisticResult(options) {
		options._type = "infinite";
		return super.getOptimisticResult(options);
	}
	fetchNextPage(options) {
		return this.fetch({
			...options,
			meta: { fetchMore: { direction: "forward" } }
		});
	}
	fetchPreviousPage(options) {
		return this.fetch({
			...options,
			meta: { fetchMore: { direction: "backward" } }
		});
	}
	createResult(query, options) {
		const { state } = query;
		const parentResult = super.createResult(query, options);
		const { isFetching, isRefetching, isError, isRefetchError } = parentResult;
		const fetchDirection = state.fetchMeta?.fetchMore?.direction;
		const isFetchNextPageError = isError && fetchDirection === "forward";
		const isFetchingNextPage = isFetching && fetchDirection === "forward";
		const isFetchPreviousPageError = isError && fetchDirection === "backward";
		const isFetchingPreviousPage = isFetching && fetchDirection === "backward";
		return {
			...parentResult,
			fetchNextPage: this.fetchNextPage,
			fetchPreviousPage: this.fetchPreviousPage,
			hasNextPage: hasNextPage(options, state.data),
			hasPreviousPage: hasPreviousPage(options, state.data),
			isFetchNextPageError,
			isFetchingNextPage,
			isFetchPreviousPageError,
			isFetchingPreviousPage,
			isRefetchError: isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
			isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
		};
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutation.js
var Mutation = class extends Removable {
	#client;
	#observers;
	#mutationCache;
	#retryer;
	constructor(config) {
		super();
		this.#client = config.client;
		this.mutationId = config.mutationId;
		this.#mutationCache = config.mutationCache;
		this.#observers = [];
		this.state = config.state || getDefaultState();
		this.setOptions(config.options);
		this.scheduleGc();
	}
	setOptions(options) {
		this.options = options;
		this.updateGcTime(this.options.gcTime);
	}
	get meta() {
		return this.options.meta;
	}
	addObserver(observer) {
		if (!this.#observers.includes(observer)) {
			this.#observers.push(observer);
			this.clearGcTimeout();
			this.#mutationCache.notify({
				type: "observerAdded",
				mutation: this,
				observer
			});
		}
	}
	removeObserver(observer) {
		this.#observers = this.#observers.filter((x) => x !== observer);
		this.scheduleGc();
		this.#mutationCache.notify({
			type: "observerRemoved",
			mutation: this,
			observer
		});
	}
	optionalRemove() {
		if (!this.#observers.length) if (this.state.status === "pending") this.scheduleGc();
		else this.#mutationCache.remove(this);
	}
	continue() {
		return this.#retryer?.continue() ?? this.execute(this.state.variables);
	}
	async execute(variables) {
		const onContinue = () => {
			this.#dispatch({ type: "continue" });
		};
		const mutationFnContext = {
			client: this.#client,
			meta: this.options.meta,
			mutationKey: this.options.mutationKey
		};
		this.#retryer = createRetryer({
			fn: () => {
				if (!this.options.mutationFn) return Promise.reject(/* @__PURE__ */ new Error("No mutationFn found"));
				return this.options.mutationFn(variables, mutationFnContext);
			},
			onFail: (failureCount, error) => {
				this.#dispatch({
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				this.#dispatch({ type: "pause" });
			},
			onContinue,
			retry: this.options.retry ?? 0,
			retryDelay: this.options.retryDelay,
			networkMode: this.options.networkMode,
			canRun: () => this.#mutationCache.canRun(this)
		});
		const restored = this.state.status === "pending";
		const isPaused = !this.#retryer.canStart();
		try {
			if (restored) onContinue();
			else {
				this.#dispatch({
					type: "pending",
					variables,
					isPaused
				});
				if (this.#mutationCache.config.onMutate) await this.#mutationCache.config.onMutate(variables, this, mutationFnContext);
				const context = await this.options.onMutate?.(variables, mutationFnContext);
				if (context !== this.state.context) this.#dispatch({
					type: "pending",
					context,
					variables,
					isPaused
				});
			}
			const data = await this.#retryer.start();
			await this.#mutationCache.config.onSuccess?.(data, variables, this.state.context, this, mutationFnContext);
			await this.options.onSuccess?.(data, variables, this.state.context, mutationFnContext);
			await this.#mutationCache.config.onSettled?.(data, null, this.state.variables, this.state.context, this, mutationFnContext);
			await this.options.onSettled?.(data, null, variables, this.state.context, mutationFnContext);
			this.#dispatch({
				type: "success",
				data
			});
			return data;
		} catch (error) {
			try {
				await this.#mutationCache.config.onError?.(error, variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onError?.(error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.#mutationCache.config.onSettled?.(void 0, error, this.state.variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onSettled?.(void 0, error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			this.#dispatch({
				type: "error",
				error
			});
			throw error;
		} finally {
			this.#mutationCache.runNext(this);
		}
	}
	#dispatch(action) {
		const reducer = (state) => {
			switch (action.type) {
				case "failed": return {
					...state,
					failureCount: action.failureCount,
					failureReason: action.error
				};
				case "pause": return {
					...state,
					isPaused: true
				};
				case "continue": return {
					...state,
					isPaused: false
				};
				case "pending": return {
					...state,
					context: action.context,
					data: void 0,
					failureCount: 0,
					failureReason: null,
					error: null,
					isPaused: action.isPaused,
					status: "pending",
					variables: action.variables,
					submittedAt: Date.now()
				};
				case "success": return {
					...state,
					data: action.data,
					failureCount: 0,
					failureReason: null,
					error: null,
					status: "success",
					isPaused: false
				};
				case "error": return {
					...state,
					data: void 0,
					error: action.error,
					failureCount: state.failureCount + 1,
					failureReason: action.error,
					isPaused: false,
					status: "error"
				};
			}
		};
		this.state = reducer(this.state);
		notifyManager.batch(() => {
			this.#observers.forEach((observer) => {
				observer.onMutationUpdate(action);
			});
			this.#mutationCache.notify({
				mutation: this,
				type: "updated",
				action
			});
		});
	}
};
function getDefaultState() {
	return {
		context: void 0,
		data: void 0,
		error: null,
		failureCount: 0,
		failureReason: null,
		isPaused: false,
		status: "idle",
		variables: void 0,
		submittedAt: 0
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationCache.js
var MutationCache = class extends Subscribable {
	constructor(config = {}) {
		super();
		this.config = config;
		this.#mutations = /* @__PURE__ */ new Set();
		this.#scopes = /* @__PURE__ */ new Map();
		this.#mutationId = 0;
	}
	#mutations;
	#scopes;
	#mutationId;
	build(client, options, state) {
		const mutation = new Mutation({
			client,
			mutationCache: this,
			mutationId: ++this.#mutationId,
			options: client.defaultMutationOptions(options),
			state
		});
		this.add(mutation);
		return mutation;
	}
	add(mutation) {
		this.#mutations.add(mutation);
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const scopedMutations = this.#scopes.get(scope);
			if (scopedMutations) scopedMutations.push(mutation);
			else this.#scopes.set(scope, [mutation]);
		}
		this.notify({
			type: "added",
			mutation
		});
	}
	remove(mutation) {
		if (this.#mutations.delete(mutation)) {
			const scope = scopeFor(mutation);
			if (typeof scope === "string") {
				const scopedMutations = this.#scopes.get(scope);
				if (scopedMutations) {
					if (scopedMutations.length > 1) {
						const index = scopedMutations.indexOf(mutation);
						if (index !== -1) scopedMutations.splice(index, 1);
					} else if (scopedMutations[0] === mutation) this.#scopes.delete(scope);
				}
			}
		}
		this.notify({
			type: "removed",
			mutation
		});
	}
	canRun(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const firstPendingMutation = this.#scopes.get(scope)?.find((m) => m.state.status === "pending");
			return !firstPendingMutation || firstPendingMutation === mutation;
		} else return true;
	}
	runNext(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") return (this.#scopes.get(scope)?.find((m) => m !== mutation && m.state.isPaused))?.continue() ?? Promise.resolve();
		else return Promise.resolve();
	}
	clear() {
		notifyManager.batch(() => {
			this.#mutations.forEach((mutation) => {
				this.notify({
					type: "removed",
					mutation
				});
			});
			this.#mutations.clear();
			this.#scopes.clear();
		});
	}
	getAll() {
		return Array.from(this.#mutations);
	}
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((mutation) => matchMutation(defaultedFilters, mutation));
	}
	findAll(filters = {}) {
		return this.getAll().filter((mutation) => matchMutation(filters, mutation));
	}
	notify(event) {
		notifyManager.batch(() => {
			this.listeners.forEach((listener) => {
				listener(event);
			});
		});
	}
	resumePausedMutations() {
		const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
		return notifyManager.batch(() => Promise.all(pausedMutations.map((mutation) => mutation.continue().catch(noop))));
	}
};
function scopeFor(mutation) {
	return mutation.options.scope?.id;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationObserver.js
var MutationObserver = class extends Subscribable {
	#client;
	#currentResult = void 0;
	#currentMutation;
	#mutateOptions;
	constructor(client, options) {
		super();
		this.#client = client;
		this.setOptions(options);
		this.bindMethods();
		this.#updateResult();
	}
	bindMethods() {
		this.mutate = this.mutate.bind(this);
		this.reset = this.reset.bind(this);
	}
	setOptions(options) {
		const prevOptions = this.options;
		this.options = this.#client.defaultMutationOptions(options);
		if (!shallowEqualObjects(this.options, prevOptions)) this.#client.getMutationCache().notify({
			type: "observerOptionsUpdated",
			mutation: this.#currentMutation,
			observer: this
		});
		if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) this.reset();
		else if (this.#currentMutation?.state.status === "pending") this.#currentMutation.setOptions(this.options);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) this.#currentMutation?.removeObserver(this);
	}
	onMutationUpdate(action) {
		this.#updateResult();
		this.#notify(action);
	}
	getCurrentResult() {
		return this.#currentResult;
	}
	reset() {
		this.#currentMutation?.removeObserver(this);
		this.#currentMutation = void 0;
		this.#updateResult();
		this.#notify();
	}
	mutate(variables, options) {
		this.#mutateOptions = options;
		this.#currentMutation?.removeObserver(this);
		this.#currentMutation = this.#client.getMutationCache().build(this.#client, this.options);
		this.#currentMutation.addObserver(this);
		return this.#currentMutation.execute(variables);
	}
	#updateResult() {
		const state = this.#currentMutation?.state ?? getDefaultState();
		this.#currentResult = {
			...state,
			isPending: state.status === "pending",
			isSuccess: state.status === "success",
			isError: state.status === "error",
			isIdle: state.status === "idle",
			mutate: this.mutate,
			reset: this.reset
		};
	}
	#notify(action) {
		notifyManager.batch(() => {
			if (this.#mutateOptions && this.hasListeners()) {
				const variables = this.#currentResult.variables;
				const onMutateResult = this.#currentResult.context;
				const context = {
					client: this.#client,
					meta: this.options.meta,
					mutationKey: this.options.mutationKey
				};
				if (action?.type === "success") {
					try {
						this.#mutateOptions.onSuccess?.(action.data, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						this.#mutateOptions.onSettled?.(action.data, null, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
				} else if (action?.type === "error") {
					try {
						this.#mutateOptions.onError?.(action.error, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						this.#mutateOptions.onSettled?.(void 0, action.error, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
				}
			}
			this.listeners.forEach((listener) => {
				listener(this.#currentResult);
			});
		});
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queriesObserver.js
function difference(array1, array2) {
	const excludeSet = new Set(array2);
	return array1.filter((x) => !excludeSet.has(x));
}
function replaceAt(array, index, value) {
	const copy = array.slice(0);
	copy[index] = value;
	return copy;
}
var QueriesObserver = class extends Subscribable {
	#client;
	#result;
	#queries;
	#options;
	#observers;
	#combinedResult;
	#lastCombine;
	#lastResult;
	#lastQueryHashes;
	#observerMatches = [];
	constructor(client, queries, options) {
		super();
		this.#client = client;
		this.#options = options;
		this.#queries = [];
		this.#observers = [];
		this.#result = [];
		this.setQueries(queries);
	}
	onSubscribe() {
		if (this.listeners.size === 1) this.#observers.forEach((observer) => {
			observer.subscribe((result) => {
				this.#onUpdate(observer, result);
			});
		});
	}
	onUnsubscribe() {
		if (!this.listeners.size) this.destroy();
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set();
		this.#observers.forEach((observer) => {
			observer.destroy();
		});
	}
	setQueries(queries, options) {
		this.#queries = queries;
		this.#options = options;
		{
			const queryHashes = queries.map((query) => this.#client.defaultQueryOptions(query).queryHash);
			if (new Set(queryHashes).size !== queryHashes.length) console.warn("[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.");
		}
		notifyManager.batch(() => {
			const prevObservers = this.#observers;
			const newObserverMatches = this.#findMatchingObservers(this.#queries);
			newObserverMatches.forEach((match) => match.observer.setOptions(match.defaultedQueryOptions));
			const newObservers = newObserverMatches.map((match) => match.observer);
			const newResult = newObservers.map((observer) => observer.getCurrentResult());
			const hasLengthChange = prevObservers.length !== newObservers.length;
			const hasIndexChange = newObservers.some((observer, index) => observer !== prevObservers[index]);
			const hasStructuralChange = hasLengthChange || hasIndexChange;
			const hasResultChange = hasStructuralChange ? true : newResult.some((result, index) => {
				const prev = this.#result[index];
				return !prev || !shallowEqualObjects(result, prev);
			});
			if (!hasStructuralChange && !hasResultChange) return;
			if (hasStructuralChange) {
				this.#observerMatches = newObserverMatches;
				this.#observers = newObservers;
			}
			this.#result = newResult;
			if (!this.hasListeners()) return;
			if (hasStructuralChange) {
				difference(prevObservers, newObservers).forEach((observer) => {
					observer.destroy();
				});
				difference(newObservers, prevObservers).forEach((observer) => {
					observer.subscribe((result) => {
						this.#onUpdate(observer, result);
					});
				});
			}
			this.#notify();
		});
	}
	getCurrentResult() {
		return this.#result;
	}
	getQueries() {
		return this.#observers.map((observer) => observer.getCurrentQuery());
	}
	getObservers() {
		return this.#observers;
	}
	getOptimisticResult(queries, combine) {
		const matches = this.#findMatchingObservers(queries);
		const result = matches.map((match) => match.observer.getOptimisticResult(match.defaultedQueryOptions));
		const queryHashes = matches.map((match) => match.defaultedQueryOptions.queryHash);
		return [
			result,
			(r) => {
				return this.#combineResult(r ?? result, combine, queryHashes);
			},
			() => {
				return this.#trackResult(result, matches);
			}
		];
	}
	#trackResult(result, matches) {
		return matches.map((match, index) => {
			const observerResult = result[index];
			return !match.defaultedQueryOptions.notifyOnChangeProps ? match.observer.trackResult(observerResult, (accessedProp) => {
				matches.forEach((m) => {
					m.observer.trackProp(accessedProp);
				});
			}) : observerResult;
		});
	}
	#combineResult(input, combine, queryHashes) {
		if (combine) {
			const lastHashes = this.#lastQueryHashes;
			const queryHashesChanged = queryHashes !== void 0 && lastHashes !== void 0 && (lastHashes.length !== queryHashes.length || queryHashes.some((hash, i) => hash !== lastHashes[i]));
			if (!this.#combinedResult || this.#result !== this.#lastResult || queryHashesChanged || combine !== this.#lastCombine) {
				this.#lastCombine = combine;
				this.#lastResult = this.#result;
				if (queryHashes !== void 0) this.#lastQueryHashes = queryHashes;
				this.#combinedResult = replaceEqualDeep(this.#combinedResult, combine(input));
			}
			return this.#combinedResult;
		}
		return input;
	}
	#shouldSkipCombine() {
		return this.#options?.combine !== void 0 && this.#observers.some((observer, index) => {
			return observer.options.suspense && this.#result[index]?.data === void 0;
		});
	}
	#findMatchingObservers(queries) {
		const prevObserversMap = /* @__PURE__ */ new Map();
		this.#observers.forEach((observer) => {
			const key = observer.options.queryHash;
			if (!key) return;
			const previousObservers = prevObserversMap.get(key);
			if (previousObservers) previousObservers.push(observer);
			else prevObserversMap.set(key, [observer]);
		});
		const observers = [];
		queries.forEach((options) => {
			const defaultedOptions = this.#client.defaultQueryOptions(options);
			const observer = prevObserversMap.get(defaultedOptions.queryHash)?.shift() ?? new QueryObserver(this.#client, defaultedOptions);
			observers.push({
				defaultedQueryOptions: defaultedOptions,
				observer
			});
		});
		return observers;
	}
	#onUpdate(observer, result) {
		const index = this.#observers.indexOf(observer);
		if (index !== -1) {
			this.#result = replaceAt(this.#result, index, result);
			this.#notify();
		}
	}
	#notify() {
		if (this.hasListeners()) {
			const newTracked = this.#trackResult(this.#result, this.#observerMatches);
			const shouldSkipCombine = this.#shouldSkipCombine();
			const previousResult = this.#combinedResult;
			const newResult = shouldSkipCombine ? previousResult : this.#combineResult(newTracked, this.#options?.combine);
			if (shouldSkipCombine || previousResult !== newResult) notifyManager.batch(() => {
				this.listeners.forEach((listener) => {
					listener(this.#result);
				});
			});
		}
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryCache.js
var QueryCache = class extends Subscribable {
	constructor(config = {}) {
		super();
		this.config = config;
		this.#queries = /* @__PURE__ */ new Map();
	}
	#queries;
	build(client, options, state) {
		const queryKey = options.queryKey;
		const queryHash = options.queryHash ?? hashQueryKeyByOptions(queryKey, options);
		let query = this.get(queryHash);
		if (!query) {
			query = new Query({
				client,
				queryKey,
				queryHash,
				options: client.defaultQueryOptions(options),
				state,
				defaultOptions: client.getQueryDefaults(queryKey)
			});
			this.add(query);
		}
		return query;
	}
	add(query) {
		if (!this.#queries.has(query.queryHash)) {
			this.#queries.set(query.queryHash, query);
			this.notify({
				type: "added",
				query
			});
		}
	}
	remove(query) {
		const queryInMap = this.#queries.get(query.queryHash);
		if (queryInMap) {
			query.destroy();
			if (queryInMap === query) this.#queries.delete(query.queryHash);
			this.notify({
				type: "removed",
				query
			});
		}
	}
	clear() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				this.remove(query);
			});
		});
	}
	get(queryHash) {
		return this.#queries.get(queryHash);
	}
	getAll() {
		return [...this.#queries.values()];
	}
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((query) => matchQuery(defaultedFilters, query));
	}
	findAll(filters = {}) {
		const queries = this.getAll();
		return Object.keys(filters).length > 0 ? queries.filter((query) => matchQuery(filters, query)) : queries;
	}
	notify(event) {
		notifyManager.batch(() => {
			this.listeners.forEach((listener) => {
				listener(event);
			});
		});
	}
	onFocus() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				query.onFocus();
			});
		});
	}
	onOnline() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				query.onOnline();
			});
		});
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryClient.js
var QueryClient = class {
	#queryCache;
	#mutationCache;
	#defaultOptions;
	#queryDefaults;
	#mutationDefaults;
	#mountCount;
	#unsubscribeFocus;
	#unsubscribeOnline;
	constructor(config = {}) {
		this.#queryCache = config.queryCache || new QueryCache();
		this.#mutationCache = config.mutationCache || new MutationCache();
		this.#defaultOptions = config.defaultOptions || {};
		this.#queryDefaults = /* @__PURE__ */ new Map();
		this.#mutationDefaults = /* @__PURE__ */ new Map();
		this.#mountCount = 0;
	}
	mount() {
		this.#mountCount++;
		if (this.#mountCount !== 1) return;
		this.#unsubscribeFocus = focusManager.subscribe(async (focused) => {
			if (focused) {
				await this.resumePausedMutations();
				this.#queryCache.onFocus();
			}
		});
		this.#unsubscribeOnline = onlineManager.subscribe(async (online) => {
			if (online) {
				await this.resumePausedMutations();
				this.#queryCache.onOnline();
			}
		});
	}
	unmount() {
		this.#mountCount--;
		if (this.#mountCount !== 0) return;
		this.#unsubscribeFocus?.();
		this.#unsubscribeFocus = void 0;
		this.#unsubscribeOnline?.();
		this.#unsubscribeOnline = void 0;
	}
	isFetching(filters) {
		return this.#queryCache.findAll({
			...filters,
			fetchStatus: "fetching"
		}).length;
	}
	isMutating(filters) {
		return this.#mutationCache.findAll({
			...filters,
			status: "pending"
		}).length;
	}
	/**
	* Imperative (non-reactive) way to retrieve data for a QueryKey.
	* Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
	*
	* Hint: Do not use this function inside a component, because it won't receive updates.
	* Use `useQuery` to create a `QueryObserver` that subscribes to changes.
	*/
	getQueryData(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return this.#queryCache.get(options.queryHash)?.state.data;
	}
	ensureQueryData(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		const query = this.#queryCache.build(this, defaultedOptions);
		const cachedData = query.state.data;
		if (cachedData === void 0) return this.fetchQuery(options);
		if (options.revalidateIfStale && query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))) this.prefetchQuery(defaultedOptions);
		return Promise.resolve(cachedData);
	}
	getQueriesData(filters) {
		return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
			return [queryKey, state.data];
		});
	}
	setQueryData(queryKey, updater, options) {
		const defaultedOptions = this.defaultQueryOptions({ queryKey });
		const prevData = this.#queryCache.get(defaultedOptions.queryHash)?.state.data;
		const data = functionalUpdate(updater, prevData);
		if (data === void 0) return;
		return this.#queryCache.build(this, defaultedOptions).setData(data, {
			...options,
			manual: true
		});
	}
	setQueriesData(filters, updater, options) {
		return notifyManager.batch(() => this.#queryCache.findAll(filters).map(({ queryKey }) => [queryKey, this.setQueryData(queryKey, updater, options)]));
	}
	getQueryState(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return this.#queryCache.get(options.queryHash)?.state;
	}
	removeQueries(filters) {
		const queryCache = this.#queryCache;
		notifyManager.batch(() => {
			queryCache.findAll(filters).forEach((query) => {
				queryCache.remove(query);
			});
		});
	}
	resetQueries(filters, options) {
		const queryCache = this.#queryCache;
		return notifyManager.batch(() => {
			queryCache.findAll(filters).forEach((query) => {
				query.reset();
			});
			return this.refetchQueries({
				type: "active",
				...filters
			}, options);
		});
	}
	cancelQueries(filters, cancelOptions = {}) {
		const defaultedCancelOptions = {
			revert: true,
			...cancelOptions
		};
		const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions)));
		return Promise.all(promises).then(noop).catch(noop);
	}
	invalidateQueries(filters, options = {}) {
		return notifyManager.batch(() => {
			this.#queryCache.findAll(filters).forEach((query) => {
				query.invalidate();
			});
			if (filters?.refetchType === "none") return Promise.resolve();
			return this.refetchQueries({
				...filters,
				type: filters?.refetchType ?? filters?.type ?? "active"
			}, options);
		});
	}
	refetchQueries(filters, options = {}) {
		const fetchOptions = {
			...options,
			cancelRefetch: options.cancelRefetch ?? true
		};
		const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).filter((query) => !query.isDisabled() && !query.isStatic()).map((query) => {
			let promise = query.fetch(void 0, fetchOptions);
			if (!fetchOptions.throwOnError) promise = promise.catch(noop);
			return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
		}));
		return Promise.all(promises).then(noop);
	}
	fetchQuery(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
		const query = this.#queryCache.build(this, defaultedOptions);
		return query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query)) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
	}
	prefetchQuery(options) {
		return this.fetchQuery(options).then(noop).catch(noop);
	}
	fetchInfiniteQuery(options) {
		options._type = "infinite";
		return this.fetchQuery(options);
	}
	prefetchInfiniteQuery(options) {
		return this.fetchInfiniteQuery(options).then(noop).catch(noop);
	}
	ensureInfiniteQueryData(options) {
		options._type = "infinite";
		return this.ensureQueryData(options);
	}
	resumePausedMutations() {
		if (onlineManager.isOnline()) return this.#mutationCache.resumePausedMutations();
		return Promise.resolve();
	}
	getQueryCache() {
		return this.#queryCache;
	}
	getMutationCache() {
		return this.#mutationCache;
	}
	getDefaultOptions() {
		return this.#defaultOptions;
	}
	setDefaultOptions(options) {
		this.#defaultOptions = options;
	}
	setQueryDefaults(queryKey, options) {
		this.#queryDefaults.set(hashKey(queryKey), {
			queryKey,
			defaultOptions: options
		});
	}
	getQueryDefaults(queryKey) {
		const defaults = [...this.#queryDefaults.values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(queryKey, queryDefault.queryKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	setMutationDefaults(mutationKey, options) {
		this.#mutationDefaults.set(hashKey(mutationKey), {
			mutationKey,
			defaultOptions: options
		});
	}
	getMutationDefaults(mutationKey) {
		const defaults = [...this.#mutationDefaults.values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(mutationKey, queryDefault.mutationKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	defaultQueryOptions(options) {
		if (options._defaulted) return options;
		const defaultedOptions = {
			...this.#defaultOptions.queries,
			...this.getQueryDefaults(options.queryKey),
			...options,
			_defaulted: true
		};
		if (!defaultedOptions.queryHash) defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
		if (defaultedOptions.refetchOnReconnect === void 0) defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
		if (defaultedOptions.throwOnError === void 0) defaultedOptions.throwOnError = !!defaultedOptions.suspense;
		if (!defaultedOptions.networkMode && defaultedOptions.persister) defaultedOptions.networkMode = "offlineFirst";
		if (defaultedOptions.queryFn === skipToken) defaultedOptions.enabled = false;
		return defaultedOptions;
	}
	defaultMutationOptions(options) {
		if (options?._defaulted) return options;
		return {
			...this.#defaultOptions.mutations,
			...options?.mutationKey && this.getMutationDefaults(options.mutationKey),
			...options,
			_defaulted: true
		};
	}
	clear() {
		this.#queryCache.clear();
		this.#mutationCache.clear();
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/streamedQuery.js
function streamedQuery({ streamFn, refetchMode = "reset", reducer = (items, chunk) => addToEnd(items, chunk), initialValue = [] }) {
	return async (context) => {
		const query = context.client.getQueryCache().find({
			queryKey: context.queryKey,
			exact: true
		});
		const isRefetch = !!query && query.isFetched();
		if (isRefetch && refetchMode === "reset") query.setState({
			...query.resetState,
			fetchStatus: "fetching"
		});
		let result = initialValue;
		let cancelled = false;
		const stream = await streamFn(addConsumeAwareSignal({
			client: context.client,
			meta: context.meta,
			queryKey: context.queryKey,
			pageParam: context.pageParam,
			direction: context.direction
		}, () => context.signal, () => cancelled = true));
		const isReplaceRefetch = isRefetch && refetchMode === "replace";
		for await (const chunk of stream) {
			if (cancelled) break;
			if (isReplaceRefetch) result = reducer(result, chunk);
			else context.client.setQueryData(context.queryKey, (prev) => reducer(prev === void 0 ? initialValue : prev, chunk));
		}
		if (isReplaceRefetch && !cancelled) context.client.setQueryData(context.queryKey, result);
		return context.client.getQueryData(context.queryKey) ?? initialValue;
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/types.js
var dataTagSymbol = /* @__PURE__ */ Symbol("dataTagSymbol");
var dataTagErrorSymbol = /* @__PURE__ */ Symbol("dataTagErrorSymbol");
var unsetMarker = /* @__PURE__ */ Symbol("unsetMarker");
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var QueryClientContext = import_react.createContext(void 0);
var useQueryClient = (queryClient) => {
	const client = import_react.useContext(QueryClientContext);
	if (queryClient) return queryClient;
	if (!client) throw new Error("No QueryClient set, use QueryClientProvider to set one");
	return client;
};
var QueryClientProvider = ({ client, children }) => {
	import_react.useEffect(() => {
		client.mount();
		return () => {
			client.unmount();
		};
	}, [client]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientContext.Provider, {
		value: client,
		children
	});
};
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/IsRestoringProvider.js
var IsRestoringContext = import_react.createContext(false);
var useIsRestoring = () => import_react.useContext(IsRestoringContext);
var IsRestoringProvider = IsRestoringContext.Provider;
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/QueryErrorResetBoundary.js
function createValue() {
	let isReset = false;
	return {
		clearReset: () => {
			isReset = false;
		},
		reset: () => {
			isReset = true;
		},
		isReset: () => {
			return isReset;
		}
	};
}
var QueryErrorResetBoundaryContext = import_react.createContext(createValue());
var useQueryErrorResetBoundary = () => import_react.useContext(QueryErrorResetBoundaryContext);
var QueryErrorResetBoundary = ({ children }) => {
	const [value] = import_react.useState(() => createValue());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryErrorResetBoundaryContext.Provider, {
		value,
		children: typeof children === "function" ? children(value) : children
	});
};
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/errorBoundaryUtils.js
var ensurePreventErrorBoundaryRetry = (options, errorResetBoundary, query) => {
	const throwOnError = query?.state.error && typeof options.throwOnError === "function" ? shouldThrowError(options.throwOnError, [query.state.error, query]) : options.throwOnError;
	if (options.suspense || options.experimental_prefetchInRender || throwOnError) {
		if (!errorResetBoundary.isReset()) options.retryOnMount = false;
	}
};
var useClearResetErrorBoundary = (errorResetBoundary) => {
	import_react.useEffect(() => {
		errorResetBoundary.clearReset();
	}, [errorResetBoundary]);
};
var getHasError = ({ result, errorResetBoundary, throwOnError, query, suspense }) => {
	return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && (suspense && result.data === void 0 || shouldThrowError(throwOnError, [result.error, query]));
};
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/suspense.js
var defaultThrowOnError = (_error, query) => query.state.data === void 0;
var ensureSuspenseTimers = (defaultedOptions) => {
	if (defaultedOptions.suspense) {
		const MIN_SUSPENSE_TIME_MS = 1e3;
		const clamp = (value) => value === "static" ? value : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS);
		const originalStaleTime = defaultedOptions.staleTime;
		defaultedOptions.staleTime = typeof originalStaleTime === "function" ? (...args) => clamp(originalStaleTime(...args)) : clamp(originalStaleTime);
		if (typeof defaultedOptions.gcTime === "number") defaultedOptions.gcTime = Math.max(defaultedOptions.gcTime, MIN_SUSPENSE_TIME_MS);
	}
};
var willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
var shouldSuspend = (defaultedOptions, result) => defaultedOptions?.suspense && result.isPending;
var fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
	errorResetBoundary.clearReset();
});
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useQueries.js
function useQueries({ queries, ...options }, queryClient) {
	const client = useQueryClient(queryClient);
	const isRestoring = useIsRestoring();
	const errorResetBoundary = useQueryErrorResetBoundary();
	const defaultedQueries = import_react.useMemo(() => queries.map((opts) => {
		const defaultedOptions = client.defaultQueryOptions(opts);
		defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
		return defaultedOptions;
	}), [
		queries,
		client,
		isRestoring
	]);
	defaultedQueries.forEach((queryOptions) => {
		ensureSuspenseTimers(queryOptions);
		const query = client.getQueryCache().get(queryOptions.queryHash);
		ensurePreventErrorBoundaryRetry(queryOptions, errorResetBoundary, query);
	});
	useClearResetErrorBoundary(errorResetBoundary);
	const [observer] = import_react.useState(() => new QueriesObserver(client, defaultedQueries, options));
	const [optimisticResult, getCombinedResult, trackResult] = observer.getOptimisticResult(defaultedQueries, options.combine);
	const shouldSubscribe = !isRestoring && options.subscribed !== false;
	import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop, [observer, shouldSubscribe]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
	import_react.useEffect(() => {
		observer.setQueries(defaultedQueries, options);
	}, [
		defaultedQueries,
		options,
		observer
	]);
	const suspensePromises = optimisticResult.some((result, index) => shouldSuspend(defaultedQueries[index], result)) ? optimisticResult.flatMap((result, index) => {
		const opts = defaultedQueries[index];
		if (opts && shouldSuspend(opts, result)) return fetchOptimistic(opts, new QueryObserver(client, opts), errorResetBoundary);
		return [];
	}) : [];
	if (suspensePromises.length > 0) throw Promise.all(suspensePromises);
	const firstSingleResultWhichShouldThrow = optimisticResult.find((result, index) => {
		const query = defaultedQueries[index];
		return query && getHasError({
			result,
			errorResetBoundary,
			throwOnError: query.throwOnError,
			query: client.getQueryCache().get(query.queryHash),
			suspense: query.suspense
		});
	});
	if (firstSingleResultWhichShouldThrow?.error) throw firstSingleResultWhichShouldThrow.error;
	return getCombinedResult(trackResult());
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useBaseQuery.js
function useBaseQuery(options, Observer, queryClient) {
	if (typeof options !== "object" || Array.isArray(options)) throw new Error("Bad argument type. Starting with v5, only the \"Object\" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object");
	const isRestoring = useIsRestoring();
	const errorResetBoundary = useQueryErrorResetBoundary();
	const client = useQueryClient(queryClient);
	const defaultedOptions = client.defaultQueryOptions(options);
	client.getDefaultOptions().queries?._experimental_beforeQuery?.(defaultedOptions);
	const query = client.getQueryCache().get(defaultedOptions.queryHash);
	if (!defaultedOptions.queryFn) console.error(`[${defaultedOptions.queryHash}]: No queryFn was passed as an option, and no default queryFn was found. The queryFn parameter is only optional when using a default queryFn. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`);
	const subscribed = options.subscribed !== false;
	defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : subscribed ? "optimistic" : void 0;
	ensureSuspenseTimers(defaultedOptions);
	ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query);
	useClearResetErrorBoundary(errorResetBoundary);
	const isNewCacheEntry = !client.getQueryCache().get(defaultedOptions.queryHash);
	const [observer] = import_react.useState(() => new Observer(client, defaultedOptions));
	const result = observer.getOptimisticResult(defaultedOptions);
	const shouldSubscribe = !isRestoring && subscribed;
	import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => {
		const unsubscribe = shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop;
		observer.updateResult();
		return unsubscribe;
	}, [observer, shouldSubscribe]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
	import_react.useEffect(() => {
		observer.setOptions(defaultedOptions);
	}, [defaultedOptions, observer]);
	if (shouldSuspend(defaultedOptions, result)) throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
	if (getHasError({
		result,
		errorResetBoundary,
		throwOnError: defaultedOptions.throwOnError,
		query,
		suspense: defaultedOptions.suspense
	})) throw result.error;
	client.getDefaultOptions().queries?._experimental_afterQuery?.(defaultedOptions, result);
	if (defaultedOptions.experimental_prefetchInRender && !environmentManager.isServer() && willFetch(result, isRestoring)) (isNewCacheEntry ? fetchOptimistic(defaultedOptions, observer, errorResetBoundary) : query?.promise)?.catch(noop).finally(() => {
		observer.updateResult();
	});
	return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useQuery.js
function useQuery(options, queryClient) {
	return useBaseQuery(options, QueryObserver, queryClient);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useSuspenseQuery.js
function useSuspenseQuery(options, queryClient) {
	if (options.queryFn === skipToken) console.error("skipToken is not allowed for useSuspenseQuery");
	return useBaseQuery({
		...options,
		enabled: true,
		suspense: true,
		throwOnError: defaultThrowOnError,
		placeholderData: void 0
	}, QueryObserver, queryClient);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useSuspenseInfiniteQuery.js
function useSuspenseInfiniteQuery(options, queryClient) {
	if (options.queryFn === skipToken) console.error("skipToken is not allowed for useSuspenseInfiniteQuery");
	return useBaseQuery({
		...options,
		enabled: true,
		suspense: true,
		throwOnError: defaultThrowOnError
	}, InfiniteQueryObserver, queryClient);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useSuspenseQueries.js
function useSuspenseQueries(options, queryClient) {
	return useQueries({
		...options,
		queries: options.queries.map((query) => {
			if (query.queryFn === skipToken) console.error("skipToken is not allowed for useSuspenseQueries");
			return {
				...query,
				suspense: true,
				throwOnError: defaultThrowOnError,
				enabled: true,
				placeholderData: void 0
			};
		})
	}, queryClient);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/usePrefetchQuery.js
function usePrefetchQuery(options, queryClient) {
	const client = useQueryClient(queryClient);
	if (!client.getQueryState(options.queryKey)) client.prefetchQuery(options);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/usePrefetchInfiniteQuery.js
function usePrefetchInfiniteQuery(options, queryClient) {
	const client = useQueryClient(queryClient);
	if (!client.getQueryState(options.queryKey)) client.prefetchInfiniteQuery(options);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/queryOptions.js
function queryOptions(options) {
	return options;
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/infiniteQueryOptions.js
function infiniteQueryOptions(options) {
	return options;
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/HydrationBoundary.js
var HydrationBoundary = ({ children, options = {}, state, queryClient }) => {
	const client = useQueryClient(queryClient);
	const optionsRef = import_react.useRef(options);
	import_react.useEffect(() => {
		optionsRef.current = options;
	});
	const hydrationQueue = import_react.useMemo(() => {
		if (state) {
			if (typeof state !== "object") return;
			const queryCache = client.getQueryCache();
			const queries = state.queries || [];
			const newQueries = [];
			const existingQueries = [];
			for (const dehydratedQuery of queries) {
				const existingQuery = queryCache.get(dehydratedQuery.queryHash);
				if (!existingQuery) newQueries.push(dehydratedQuery);
				else if (dehydratedQuery.state.dataUpdatedAt > existingQuery.state.dataUpdatedAt || dehydratedQuery.promise && existingQuery.state.status !== "pending" && existingQuery.state.fetchStatus !== "fetching" && dehydratedQuery.dehydratedAt !== void 0 && dehydratedQuery.dehydratedAt > existingQuery.state.dataUpdatedAt) existingQueries.push(dehydratedQuery);
			}
			if (newQueries.length > 0) hydrate(client, { queries: newQueries }, optionsRef.current);
			if (existingQueries.length > 0) return existingQueries;
		}
	}, [client, state]);
	import_react.useEffect(() => {
		if (hydrationQueue) hydrate(client, { queries: hydrationQueue }, optionsRef.current);
	}, [client, hydrationQueue]);
	return children;
};
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useIsFetching.js
function useIsFetching(filters, queryClient) {
	const client = useQueryClient(queryClient);
	const queryCache = client.getQueryCache();
	return import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => queryCache.subscribe(notifyManager.batchCalls(onStoreChange)), [queryCache]), () => client.isFetching(filters), () => client.isFetching(filters));
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useMutationState.js
function useIsMutating(filters, queryClient) {
	const client = useQueryClient(queryClient);
	return useMutationState({ filters: {
		...filters,
		status: "pending"
	} }, client).length;
}
function getResult(mutationCache, options) {
	return mutationCache.findAll(options.filters).map((mutation) => options.select ? options.select(mutation) : mutation.state);
}
function useMutationState(options = {}, queryClient) {
	const mutationCache = useQueryClient(queryClient).getMutationCache();
	const optionsRef = import_react.useRef(options);
	const result = import_react.useRef(null);
	if (result.current === null) result.current = getResult(mutationCache, options);
	import_react.useEffect(() => {
		optionsRef.current = options;
	});
	return import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => mutationCache.subscribe(() => {
		const nextResult = replaceEqualDeep(result.current, getResult(mutationCache, optionsRef.current));
		if (result.current !== nextResult) {
			result.current = nextResult;
			notifyManager.schedule(onStoreChange);
		}
	}), [mutationCache]), () => result.current, () => result.current);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useMutation.js
function useMutation(options, queryClient) {
	const client = useQueryClient(queryClient);
	const [observer] = import_react.useState(() => new MutationObserver(client, options));
	import_react.useEffect(() => {
		observer.setOptions(options);
	}, [observer, options]);
	const result = import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)), [observer]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
	const mutate = import_react.useCallback((variables, mutateOptions) => {
		observer.mutate(variables, mutateOptions).catch(noop);
	}, [observer]);
	if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) throw result.error;
	return {
		...result,
		mutate,
		mutateAsync: result.mutate
	};
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/mutationOptions.js
function mutationOptions(options) {
	return options;
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useInfiniteQuery.js
function useInfiniteQuery(options, queryClient) {
	return useBaseQuery(options, InfiniteQueryObserver, queryClient);
}
//#endregion
export { CancelledError, HydrationBoundary, InfiniteQueryObserver, IsRestoringProvider, Mutation, MutationCache, MutationObserver, QueriesObserver, Query, QueryCache, QueryClient, QueryClientContext, QueryClientProvider, QueryErrorResetBoundary, QueryObserver, dataTagErrorSymbol, dataTagSymbol, defaultScheduler, defaultShouldDehydrateMutation, defaultShouldDehydrateQuery, dehydrate, environmentManager, streamedQuery as experimental_streamedQuery, focusManager, hashKey, hydrate, infiniteQueryOptions, isCancelledError, isServer, keepPreviousData, matchMutation, matchQuery, mutationOptions, noop, notifyManager, onlineManager, partialMatchKey, queryOptions, replaceEqualDeep, shouldThrowError, skipToken, timeoutManager, unsetMarker, useInfiniteQuery, useIsFetching, useIsMutating, useIsRestoring, useMutation, useMutationState, usePrefetchInfiniteQuery, usePrefetchQuery, useQueries, useQuery, useQueryClient, useQueryErrorResetBoundary, useSuspenseInfiniteQuery, useSuspenseQueries, useSuspenseQuery };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQHRhbnN0YWNrX3JlYWN0LXF1ZXJ5LmpzIiwibmFtZXMiOlsiI3NldHVwIiwiI2NsZWFudXAiLCIjZm9jdXNlZCIsIiNwcm92aWRlckNhbGxlZCIsIiNwcm92aWRlciIsIiNzZXR1cCIsIiNjbGVhbnVwIiwiI29ubGluZSIsIiNnY1RpbWVvdXQiLCIjYWJvcnRTaWduYWxDb25zdW1lZCIsIiNkZWZhdWx0T3B0aW9ucyIsIiNjbGllbnQiLCIjY2FjaGUiLCIjaW5pdGlhbFN0YXRlIiwiZ2V0RGVmYXVsdFN0YXRlIiwiI3F1ZXJ5VHlwZSIsIiNyZXRyeWVyIiwiI2Rpc3BhdGNoIiwiI2lzSW5pdGlhbFBhdXNlZEZldGNoIiwiI3JldmVydFN0YXRlIiwiI2NsaWVudCIsIiNzZWxlY3RFcnJvciIsIiNjdXJyZW50VGhlbmFibGUiLCIjY3VycmVudFF1ZXJ5IiwiI2V4ZWN1dGVGZXRjaCIsIiN1cGRhdGVUaW1lcnMiLCIjY2xlYXJTdGFsZVRpbWVvdXQiLCIjY2xlYXJSZWZldGNoSW50ZXJ2YWwiLCIjdXBkYXRlUXVlcnkiLCIjdXBkYXRlU3RhbGVUaW1lb3V0IiwiI2NvbXB1dGVSZWZldGNoSW50ZXJ2YWwiLCIjY3VycmVudFJlZmV0Y2hJbnRlcnZhbCIsIiN1cGRhdGVSZWZldGNoSW50ZXJ2YWwiLCIjY3VycmVudFJlc3VsdCIsIiNjdXJyZW50UmVzdWx0T3B0aW9ucyIsIiNjdXJyZW50UmVzdWx0U3RhdGUiLCIjdHJhY2tlZFByb3BzIiwiI3N0YWxlVGltZW91dElkIiwiI3JlZmV0Y2hJbnRlcnZhbElkIiwiI2N1cnJlbnRRdWVyeUluaXRpYWxTdGF0ZSIsIiNsYXN0UXVlcnlXaXRoRGVmaW5lZERhdGEiLCIjc2VsZWN0Rm4iLCIjc2VsZWN0UmVzdWx0IiwiI25vdGlmeSIsIiNjbGllbnQiLCIjbXV0YXRpb25DYWNoZSIsIiNvYnNlcnZlcnMiLCIjcmV0cnllciIsIiNkaXNwYXRjaCIsIiNtdXRhdGlvbnMiLCIjc2NvcGVzIiwiI211dGF0aW9uSWQiLCIjY2xpZW50IiwiI3VwZGF0ZVJlc3VsdCIsIiNjdXJyZW50TXV0YXRpb24iLCIjbm90aWZ5IiwiI2N1cnJlbnRSZXN1bHQiLCIjbXV0YXRlT3B0aW9ucyIsIiNjbGllbnQiLCIjb3B0aW9ucyIsIiNxdWVyaWVzIiwiI29ic2VydmVycyIsIiNyZXN1bHQiLCIjb25VcGRhdGUiLCIjZmluZE1hdGNoaW5nT2JzZXJ2ZXJzIiwiI29ic2VydmVyTWF0Y2hlcyIsIiNub3RpZnkiLCIjY29tYmluZVJlc3VsdCIsIiN0cmFja1Jlc3VsdCIsIiNsYXN0UXVlcnlIYXNoZXMiLCIjY29tYmluZWRSZXN1bHQiLCIjbGFzdFJlc3VsdCIsIiNsYXN0Q29tYmluZSIsIiNzaG91bGRTa2lwQ29tYmluZSIsIiNxdWVyaWVzIiwiI3F1ZXJ5Q2FjaGUiLCIjbXV0YXRpb25DYWNoZSIsIiNkZWZhdWx0T3B0aW9ucyIsIiNxdWVyeURlZmF1bHRzIiwiI211dGF0aW9uRGVmYXVsdHMiLCIjbW91bnRDb3VudCIsIiN1bnN1YnNjcmliZUZvY3VzIiwiI3Vuc3Vic2NyaWJlT25saW5lIl0sInNvdXJjZXMiOlsiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL3N1YnNjcmliYWJsZS5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9mb2N1c01hbmFnZXIuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vdGltZW91dE1hbmFnZXIuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vdXRpbHMuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vZW52aXJvbm1lbnRNYW5hZ2VyLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL3RoZW5hYmxlLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL2h5ZHJhdGlvbi5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9ub3RpZnlNYW5hZ2VyLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL29ubGluZU1hbmFnZXIuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vcmV0cnllci5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9yZW1vdmFibGUuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vaW5maW5pdGVRdWVyeUJlaGF2aW9yLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL3F1ZXJ5LmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL3F1ZXJ5T2JzZXJ2ZXIuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vaW5maW5pdGVRdWVyeU9ic2VydmVyLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL211dGF0aW9uLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL211dGF0aW9uQ2FjaGUuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vbXV0YXRpb25PYnNlcnZlci5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9xdWVyaWVzT2JzZXJ2ZXIuanMiLCIuLi8uLi9AdGFuc3RhY2svcXVlcnktY29yZS9idWlsZC9tb2Rlcm4vcXVlcnlDYWNoZS5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9xdWVyeUNsaWVudC5qcyIsIi4uLy4uL0B0YW5zdGFjay9xdWVyeS1jb3JlL2J1aWxkL21vZGVybi9zdHJlYW1lZFF1ZXJ5LmpzIiwiLi4vLi4vQHRhbnN0YWNrL3F1ZXJ5LWNvcmUvYnVpbGQvbW9kZXJuL3R5cGVzLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9RdWVyeUNsaWVudFByb3ZpZGVyLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9Jc1Jlc3RvcmluZ1Byb3ZpZGVyLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9RdWVyeUVycm9yUmVzZXRCb3VuZGFyeS5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vZXJyb3JCb3VuZGFyeVV0aWxzLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9zdXNwZW5zZS5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vdXNlUXVlcmllcy5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vdXNlQmFzZVF1ZXJ5LmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi91c2VRdWVyeS5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vdXNlU3VzcGVuc2VRdWVyeS5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vdXNlU3VzcGVuc2VJbmZpbml0ZVF1ZXJ5LmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi91c2VTdXNwZW5zZVF1ZXJpZXMuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZVByZWZldGNoUXVlcnkuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZVByZWZldGNoSW5maW5pdGVRdWVyeS5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vcXVlcnlPcHRpb25zLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9pbmZpbml0ZVF1ZXJ5T3B0aW9ucy5qcyIsIi4uLy4uL0B0YW5zdGFjay9yZWFjdC1xdWVyeS9idWlsZC9tb2Rlcm4vSHlkcmF0aW9uQm91bmRhcnkuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZUlzRmV0Y2hpbmcuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZU11dGF0aW9uU3RhdGUuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZU11dGF0aW9uLmpzIiwiLi4vLi4vQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5L2J1aWxkL21vZGVybi9tdXRhdGlvbk9wdGlvbnMuanMiLCIuLi8uLi9AdGFuc3RhY2svcmVhY3QtcXVlcnkvYnVpbGQvbW9kZXJuL3VzZUluZmluaXRlUXVlcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL3N1YnNjcmliYWJsZS50c1xudmFyIFN1YnNjcmliYWJsZSA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuICAgIHRoaXMuc3Vic2NyaWJlID0gdGhpcy5zdWJzY3JpYmUuYmluZCh0aGlzKTtcbiAgfVxuICBzdWJzY3JpYmUobGlzdGVuZXIpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHRoaXMub25TdWJzY3JpYmUoKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICAgIHRoaXMub25VbnN1YnNjcmliZSgpO1xuICAgIH07XG4gIH1cbiAgaGFzTGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5zaXplID4gMDtcbiAgfVxuICBvblN1YnNjcmliZSgpIHtcbiAgfVxuICBvblVuc3Vic2NyaWJlKCkge1xuICB9XG59O1xuZXhwb3J0IHtcbiAgU3Vic2NyaWJhYmxlXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3Vic2NyaWJhYmxlLmpzLm1hcCIsIi8vIHNyYy9mb2N1c01hbmFnZXIudHNcbmltcG9ydCB7IFN1YnNjcmliYWJsZSB9IGZyb20gXCIuL3N1YnNjcmliYWJsZS5qc1wiO1xudmFyIEZvY3VzTWFuYWdlciA9IGNsYXNzIGV4dGVuZHMgU3Vic2NyaWJhYmxlIHtcbiAgI2ZvY3VzZWQ7XG4gICNjbGVhbnVwO1xuICAjc2V0dXA7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jc2V0dXAgPSAob25Gb2N1cykgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSAoKSA9PiBvbkZvY3VzKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBsaXN0ZW5lcik7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfTtcbiAgfVxuICBvblN1YnNjcmliZSgpIHtcbiAgICBpZiAoIXRoaXMuI2NsZWFudXApIHtcbiAgICAgIHRoaXMuc2V0RXZlbnRMaXN0ZW5lcih0aGlzLiNzZXR1cCk7XG4gICAgfVxuICB9XG4gIG9uVW5zdWJzY3JpYmUoKSB7XG4gICAgaWYgKCF0aGlzLmhhc0xpc3RlbmVycygpKSB7XG4gICAgICB0aGlzLiNjbGVhbnVwPy4oKTtcbiAgICAgIHRoaXMuI2NsZWFudXAgPSB2b2lkIDA7XG4gICAgfVxuICB9XG4gIHNldEV2ZW50TGlzdGVuZXIoc2V0dXApIHtcbiAgICB0aGlzLiNzZXR1cCA9IHNldHVwO1xuICAgIHRoaXMuI2NsZWFudXA/LigpO1xuICAgIHRoaXMuI2NsZWFudXAgPSBzZXR1cCgoZm9jdXNlZCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBmb2N1c2VkID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICB0aGlzLnNldEZvY3VzZWQoZm9jdXNlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBzZXRGb2N1c2VkKGZvY3VzZWQpIHtcbiAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy4jZm9jdXNlZCAhPT0gZm9jdXNlZDtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy4jZm9jdXNlZCA9IGZvY3VzZWQ7XG4gICAgICB0aGlzLm9uRm9jdXMoKTtcbiAgICB9XG4gIH1cbiAgb25Gb2N1cygpIHtcbiAgICBjb25zdCBpc0ZvY3VzZWQgPSB0aGlzLmlzRm9jdXNlZCgpO1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihpc0ZvY3VzZWQpO1xuICAgIH0pO1xuICB9XG4gIGlzRm9jdXNlZCgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuI2ZvY3VzZWQgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICByZXR1cm4gdGhpcy4jZm9jdXNlZDtcbiAgICB9XG4gICAgcmV0dXJuIGdsb2JhbFRoaXMuZG9jdW1lbnQ/LnZpc2liaWxpdHlTdGF0ZSAhPT0gXCJoaWRkZW5cIjtcbiAgfVxufTtcbnZhciBmb2N1c01hbmFnZXIgPSBuZXcgRm9jdXNNYW5hZ2VyKCk7XG5leHBvcnQge1xuICBGb2N1c01hbmFnZXIsXG4gIGZvY3VzTWFuYWdlclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZvY3VzTWFuYWdlci5qcy5tYXAiLCIvLyBzcmMvdGltZW91dE1hbmFnZXIudHNcbnZhciBkZWZhdWx0VGltZW91dFByb3ZpZGVyID0ge1xuICAvLyBXZSBuZWVkIHRoZSB3cmFwcGVyIGZ1bmN0aW9uIHN5bnRheCBiZWxvdyBpbnN0ZWFkIG9mIGRpcmVjdCByZWZlcmVuY2VzIHRvXG4gIC8vIGdsb2JhbCBzZXRUaW1lb3V0IGV0Yy5cbiAgLy9cbiAgLy8gQkFEOiBgc2V0VGltZW91dDogc2V0VGltZW91dGBcbiAgLy8gR09PRDogYHNldFRpbWVvdXQ6IChjYiwgZGVsYXkpID0+IHNldFRpbWVvdXQoY2IsIGRlbGF5KWBcbiAgLy9cbiAgLy8gSWYgd2UgdXNlIGRpcmVjdCByZWZlcmVuY2VzIGhlcmUsIHRoZW4gYW55dGhpbmcgdGhhdCB3YW50cyB0byBzcHkgb24gb3JcbiAgLy8gcmVwbGFjZSB0aGUgZ2xvYmFsIHNldFRpbWVvdXQgKGxpa2UgdGVzdHMpIHdvbid0IHdvcmsgc2luY2Ugd2UnbGwgYWxyZWFkeVxuICAvLyBoYXZlIGEgaGFyZCByZWZlcmVuY2UgdG8gdGhlIG9yaWdpbmFsIGltcGxlbWVudGF0aW9uIGF0IHRoZSB0aW1lIHdoZW4gdGhpc1xuICAvLyBmaWxlIHdhcyBpbXBvcnRlZC5cbiAgc2V0VGltZW91dDogKGNhbGxiYWNrLCBkZWxheSkgPT4gc2V0VGltZW91dChjYWxsYmFjaywgZGVsYXkpLFxuICBjbGVhclRpbWVvdXQ6ICh0aW1lb3V0SWQpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpLFxuICBzZXRJbnRlcnZhbDogKGNhbGxiYWNrLCBkZWxheSkgPT4gc2V0SW50ZXJ2YWwoY2FsbGJhY2ssIGRlbGF5KSxcbiAgY2xlYXJJbnRlcnZhbDogKGludGVydmFsSWQpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJZClcbn07XG52YXIgVGltZW91dE1hbmFnZXIgPSBjbGFzcyB7XG4gIC8vIFdlIGNhbm5vdCBoYXZlIFRpbWVvdXRNYW5hZ2VyPFQ+IGFzIHdlIG11c3QgaW5zdGFudGlhdGUgaXQgd2l0aCBhIGNvbmNyZXRlXG4gIC8vIHR5cGUgYXQgYXBwIGJvb3Q7IGFuZCBpZiB3ZSBsZWF2ZSB0aGF0IHR5cGUsIHRoZW4gYW55IG5ldyB0aW1lciBwcm92aWRlclxuICAvLyB3b3VsZCBuZWVkIHRvIHN1cHBvcnQgdGhlIGRlZmF1bHQgcHJvdmlkZXIncyBjb25jcmV0ZSB0aW1lciBJRCwgd2hpY2ggaXNcbiAgLy8gaW5mZWFzaWJsZSBhY3Jvc3MgZW52aXJvbm1lbnRzLlxuICAvL1xuICAvLyBXZSBzZXR0bGUgZm9yIHR5cGUgc2FmZXR5IGZvciB0aGUgVGltZW91dFByb3ZpZGVyIHR5cGUsIGFuZCBhY2NlcHQgdGhhdFxuICAvLyB0aGlzIGNsYXNzIGlzIHVuc2FmZSBpbnRlcm5hbGx5IHRvIGFsbG93IGZvciBleHRlbnNpb24uXG4gICNwcm92aWRlciA9IGRlZmF1bHRUaW1lb3V0UHJvdmlkZXI7XG4gICNwcm92aWRlckNhbGxlZCA9IGZhbHNlO1xuICBzZXRUaW1lb3V0UHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICBpZiAodGhpcy4jcHJvdmlkZXJDYWxsZWQgJiYgcHJvdmlkZXIgIT09IHRoaXMuI3Byb3ZpZGVyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFt0aW1lb3V0TWFuYWdlcl06IFN3aXRjaGluZyBwcm92aWRlciBhZnRlciBjYWxscyB0byBwcmV2aW91cyBwcm92aWRlciBtaWdodCByZXN1bHQgaW4gdW5leHBlY3RlZCBiZWhhdmlvci5gLFxuICAgICAgICAgIHsgcHJldmlvdXM6IHRoaXMuI3Byb3ZpZGVyLCBwcm92aWRlciB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuI3Byb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgdGhpcy4jcHJvdmlkZXJDYWxsZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgc2V0VGltZW91dChjYWxsYmFjaywgZGVsYXkpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICB0aGlzLiNwcm92aWRlckNhbGxlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNwcm92aWRlci5zZXRUaW1lb3V0KGNhbGxiYWNrLCBkZWxheSk7XG4gIH1cbiAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCkge1xuICAgIHRoaXMuI3Byb3ZpZGVyLmNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICB9XG4gIHNldEludGVydmFsKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICAgIHRoaXMuI3Byb3ZpZGVyQ2FsbGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Byb3ZpZGVyLnNldEludGVydmFsKGNhbGxiYWNrLCBkZWxheSk7XG4gIH1cbiAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKSB7XG4gICAgdGhpcy4jcHJvdmlkZXIuY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcbiAgfVxufTtcbnZhciB0aW1lb3V0TWFuYWdlciA9IG5ldyBUaW1lb3V0TWFuYWdlcigpO1xuZnVuY3Rpb24gc3lzdGVtU2V0VGltZW91dFplcm8oY2FsbGJhY2spIHtcbiAgc2V0VGltZW91dChjYWxsYmFjaywgMCk7XG59XG5leHBvcnQge1xuICBUaW1lb3V0TWFuYWdlcixcbiAgZGVmYXVsdFRpbWVvdXRQcm92aWRlcixcbiAgc3lzdGVtU2V0VGltZW91dFplcm8sXG4gIHRpbWVvdXRNYW5hZ2VyXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZW91dE1hbmFnZXIuanMubWFwIiwiLy8gc3JjL3V0aWxzLnRzXG5pbXBvcnQgeyB0aW1lb3V0TWFuYWdlciB9IGZyb20gXCIuL3RpbWVvdXRNYW5hZ2VyLmpzXCI7XG52YXIgaXNTZXJ2ZXIgPSB0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiIHx8IFwiRGVub1wiIGluIGdsb2JhbFRoaXM7XG5mdW5jdGlvbiBub29wKCkge1xufVxuZnVuY3Rpb24gZnVuY3Rpb25hbFVwZGF0ZSh1cGRhdGVyLCBpbnB1dCkge1xuICByZXR1cm4gdHlwZW9mIHVwZGF0ZXIgPT09IFwiZnVuY3Rpb25cIiA/IHVwZGF0ZXIoaW5wdXQpIDogdXBkYXRlcjtcbn1cbmZ1bmN0aW9uIGlzVmFsaWRUaW1lb3V0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgdmFsdWUgPj0gMCAmJiB2YWx1ZSAhPT0gSW5maW5pdHk7XG59XG5mdW5jdGlvbiB0aW1lVW50aWxTdGFsZSh1cGRhdGVkQXQsIHN0YWxlVGltZSkge1xuICByZXR1cm4gTWF0aC5tYXgodXBkYXRlZEF0ICsgKHN0YWxlVGltZSB8fCAwKSAtIERhdGUubm93KCksIDApO1xufVxuZnVuY3Rpb24gcmVzb2x2ZVN0YWxlVGltZShzdGFsZVRpbWUsIHF1ZXJ5KSB7XG4gIHJldHVybiB0eXBlb2Ygc3RhbGVUaW1lID09PSBcImZ1bmN0aW9uXCIgPyBzdGFsZVRpbWUocXVlcnkpIDogc3RhbGVUaW1lO1xufVxuZnVuY3Rpb24gcmVzb2x2ZVF1ZXJ5Qm9vbGVhbihvcHRpb24sIHF1ZXJ5KSB7XG4gIHJldHVybiB0eXBlb2Ygb3B0aW9uID09PSBcImZ1bmN0aW9uXCIgPyBvcHRpb24ocXVlcnkpIDogb3B0aW9uO1xufVxuZnVuY3Rpb24gbWF0Y2hRdWVyeShmaWx0ZXJzLCBxdWVyeSkge1xuICBjb25zdCB7XG4gICAgdHlwZSA9IFwiYWxsXCIsXG4gICAgZXhhY3QsXG4gICAgZmV0Y2hTdGF0dXMsXG4gICAgcHJlZGljYXRlLFxuICAgIHF1ZXJ5S2V5LFxuICAgIHN0YWxlXG4gIH0gPSBmaWx0ZXJzO1xuICBpZiAocXVlcnlLZXkpIHtcbiAgICBpZiAoZXhhY3QpIHtcbiAgICAgIGlmIChxdWVyeS5xdWVyeUhhc2ggIT09IGhhc2hRdWVyeUtleUJ5T3B0aW9ucyhxdWVyeUtleSwgcXVlcnkub3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXBhcnRpYWxNYXRjaEtleShxdWVyeS5xdWVyeUtleSwgcXVlcnlLZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGlmICh0eXBlICE9PSBcImFsbFwiKSB7XG4gICAgY29uc3QgaXNBY3RpdmUgPSBxdWVyeS5pc0FjdGl2ZSgpO1xuICAgIGlmICh0eXBlID09PSBcImFjdGl2ZVwiICYmICFpc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJpbmFjdGl2ZVwiICYmIGlzQWN0aXZlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGlmICh0eXBlb2Ygc3RhbGUgPT09IFwiYm9vbGVhblwiICYmIHF1ZXJ5LmlzU3RhbGUoKSAhPT0gc3RhbGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGZldGNoU3RhdHVzICYmIGZldGNoU3RhdHVzICE9PSBxdWVyeS5zdGF0ZS5mZXRjaFN0YXR1cykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocHJlZGljYXRlICYmICFwcmVkaWNhdGUocXVlcnkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gbWF0Y2hNdXRhdGlvbihmaWx0ZXJzLCBtdXRhdGlvbikge1xuICBjb25zdCB7IGV4YWN0LCBzdGF0dXMsIHByZWRpY2F0ZSwgbXV0YXRpb25LZXkgfSA9IGZpbHRlcnM7XG4gIGlmIChtdXRhdGlvbktleSkge1xuICAgIGlmICghbXV0YXRpb24ub3B0aW9ucy5tdXRhdGlvbktleSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZXhhY3QpIHtcbiAgICAgIGlmIChoYXNoS2V5KG11dGF0aW9uLm9wdGlvbnMubXV0YXRpb25LZXkpICE9PSBoYXNoS2V5KG11dGF0aW9uS2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghcGFydGlhbE1hdGNoS2V5KG11dGF0aW9uLm9wdGlvbnMubXV0YXRpb25LZXksIG11dGF0aW9uS2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpZiAoc3RhdHVzICYmIG11dGF0aW9uLnN0YXRlLnN0YXR1cyAhPT0gc3RhdHVzKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChwcmVkaWNhdGUgJiYgIXByZWRpY2F0ZShtdXRhdGlvbikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBoYXNoUXVlcnlLZXlCeU9wdGlvbnMocXVlcnlLZXksIG9wdGlvbnMpIHtcbiAgY29uc3QgaGFzaEZuID0gb3B0aW9ucz8ucXVlcnlLZXlIYXNoRm4gfHwgaGFzaEtleTtcbiAgcmV0dXJuIGhhc2hGbihxdWVyeUtleSk7XG59XG5mdW5jdGlvbiBoYXNoS2V5KHF1ZXJ5S2V5KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShcbiAgICBxdWVyeUtleSxcbiAgICAoXywgdmFsKSA9PiBpc1BsYWluT2JqZWN0KHZhbCkgPyBPYmplY3Qua2V5cyh2YWwpLnNvcnQoKS5yZWR1Y2UoKHJlc3VsdCwga2V5KSA9PiB7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbFtrZXldO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCB7fSkgOiB2YWxcbiAgKTtcbn1cbmZ1bmN0aW9uIHBhcnRpYWxNYXRjaEtleShhLCBiKSB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiBhICE9PSB0eXBlb2YgYikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYSAmJiBiICYmIHR5cGVvZiBhID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBiID09PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGIpLmV2ZXJ5KChrZXkpID0+IHBhcnRpYWxNYXRjaEtleShhW2tleV0sIGJba2V5XSkpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gcmVwbGFjZUVxdWFsRGVlcChhLCBiLCBkZXB0aCA9IDApIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gYTtcbiAgfVxuICBpZiAoZGVwdGggPiA1MDApIHJldHVybiBiO1xuICBjb25zdCBhcnJheSA9IGlzUGxhaW5BcnJheShhKSAmJiBpc1BsYWluQXJyYXkoYik7XG4gIGlmICghYXJyYXkgJiYgIShpc1BsYWluT2JqZWN0KGEpICYmIGlzUGxhaW5PYmplY3QoYikpKSByZXR1cm4gYjtcbiAgY29uc3QgYUl0ZW1zID0gYXJyYXkgPyBhIDogT2JqZWN0LmtleXMoYSk7XG4gIGNvbnN0IGFTaXplID0gYUl0ZW1zLmxlbmd0aDtcbiAgY29uc3QgYkl0ZW1zID0gYXJyYXkgPyBiIDogT2JqZWN0LmtleXMoYik7XG4gIGNvbnN0IGJTaXplID0gYkl0ZW1zLmxlbmd0aDtcbiAgY29uc3QgY29weSA9IGFycmF5ID8gbmV3IEFycmF5KGJTaXplKSA6IHt9O1xuICBsZXQgZXF1YWxJdGVtcyA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYlNpemU7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGFycmF5ID8gaSA6IGJJdGVtc1tpXTtcbiAgICBjb25zdCBhSXRlbSA9IGFba2V5XTtcbiAgICBjb25zdCBiSXRlbSA9IGJba2V5XTtcbiAgICBpZiAoYUl0ZW0gPT09IGJJdGVtKSB7XG4gICAgICBjb3B5W2tleV0gPSBhSXRlbTtcbiAgICAgIGlmIChhcnJheSA/IGkgPCBhU2l6ZSA6IGhhc093bi5jYWxsKGEsIGtleSkpIGVxdWFsSXRlbXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoYUl0ZW0gPT09IG51bGwgfHwgYkl0ZW0gPT09IG51bGwgfHwgdHlwZW9mIGFJdGVtICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBiSXRlbSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgY29weVtrZXldID0gYkl0ZW07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgdiA9IHJlcGxhY2VFcXVhbERlZXAoYUl0ZW0sIGJJdGVtLCBkZXB0aCArIDEpO1xuICAgIGNvcHlba2V5XSA9IHY7XG4gICAgaWYgKHYgPT09IGFJdGVtKSBlcXVhbEl0ZW1zKys7XG4gIH1cbiAgcmV0dXJuIGFTaXplID09PSBiU2l6ZSAmJiBlcXVhbEl0ZW1zID09PSBhU2l6ZSA/IGEgOiBjb3B5O1xufVxuZnVuY3Rpb24gc2hhbGxvd0VxdWFsT2JqZWN0cyhhLCBiKSB7XG4gIGlmICghYiB8fCBPYmplY3Qua2V5cyhhKS5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIpLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IGtleSBpbiBhKSB7XG4gICAgaWYgKGFba2V5XSAhPT0gYltrZXldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gaXNQbGFpbkFycmF5KHZhbHVlKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG59XG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG8pIHtcbiAgaWYgKCFoYXNPYmplY3RQcm90b3R5cGUobykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY3RvciA9IG8uY29uc3RydWN0b3I7XG4gIGlmIChjdG9yID09PSB2b2lkIDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBjb25zdCBwcm90ID0gY3Rvci5wcm90b3R5cGU7XG4gIGlmICghaGFzT2JqZWN0UHJvdG90eXBlKHByb3QpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICghcHJvdC5oYXNPd25Qcm9wZXJ0eShcImlzUHJvdG90eXBlT2ZcIikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihvKSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGhhc09iamVjdFByb3RvdHlwZShvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykgPT09IFwiW29iamVjdCBPYmplY3RdXCI7XG59XG5mdW5jdGlvbiBzbGVlcCh0aW1lb3V0KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHRpbWVvdXRNYW5hZ2VyLnNldFRpbWVvdXQocmVzb2x2ZSwgdGltZW91dCk7XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVwbGFjZURhdGEocHJldkRhdGEsIGRhdGEsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBvcHRpb25zLnN0cnVjdHVyYWxTaGFyaW5nID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5zdHJ1Y3R1cmFsU2hhcmluZyhwcmV2RGF0YSwgZGF0YSk7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5zdHJ1Y3R1cmFsU2hhcmluZyAhPT0gZmFsc2UpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVwbGFjZUVxdWFsRGVlcChwcmV2RGF0YSwgZGF0YSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBTdHJ1Y3R1cmFsIHNoYXJpbmcgcmVxdWlyZXMgZGF0YSB0byBiZSBKU09OIHNlcmlhbGl6YWJsZS4gVG8gZml4IHRoaXMsIHR1cm4gb2ZmIHN0cnVjdHVyYWxTaGFyaW5nIG9yIHJldHVybiBKU09OLXNlcmlhbGl6YWJsZSBkYXRhIGZyb20geW91ciBxdWVyeUZuLiBbJHtvcHRpb25zLnF1ZXJ5SGFzaH1dOiAke2Vycm9yfWBcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXBsYWNlRXF1YWxEZWVwKHByZXZEYXRhLCBkYXRhKTtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn1cbmZ1bmN0aW9uIGtlZXBQcmV2aW91c0RhdGEocHJldmlvdXNEYXRhKSB7XG4gIHJldHVybiBwcmV2aW91c0RhdGE7XG59XG5mdW5jdGlvbiBhZGRUb0VuZChpdGVtcywgaXRlbSwgbWF4ID0gMCkge1xuICBjb25zdCBuZXdJdGVtcyA9IFsuLi5pdGVtcywgaXRlbV07XG4gIHJldHVybiBtYXggJiYgbmV3SXRlbXMubGVuZ3RoID4gbWF4ID8gbmV3SXRlbXMuc2xpY2UoMSkgOiBuZXdJdGVtcztcbn1cbmZ1bmN0aW9uIGFkZFRvU3RhcnQoaXRlbXMsIGl0ZW0sIG1heCA9IDApIHtcbiAgY29uc3QgbmV3SXRlbXMgPSBbaXRlbSwgLi4uaXRlbXNdO1xuICByZXR1cm4gbWF4ICYmIG5ld0l0ZW1zLmxlbmd0aCA+IG1heCA/IG5ld0l0ZW1zLnNsaWNlKDAsIC0xKSA6IG5ld0l0ZW1zO1xufVxudmFyIHNraXBUb2tlbiA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woKTtcbmZ1bmN0aW9uIGVuc3VyZVF1ZXJ5Rm4ob3B0aW9ucywgZmV0Y2hPcHRpb25zKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICBpZiAob3B0aW9ucy5xdWVyeUZuID09PSBza2lwVG9rZW4pIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBBdHRlbXB0ZWQgdG8gaW52b2tlIHF1ZXJ5Rm4gd2hlbiBzZXQgdG8gc2tpcFRva2VuLiBUaGlzIGlzIGxpa2VseSBhIGNvbmZpZ3VyYXRpb24gZXJyb3IuIFF1ZXJ5IGhhc2g6ICcke29wdGlvbnMucXVlcnlIYXNofSdgXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBpZiAoIW9wdGlvbnMucXVlcnlGbiAmJiBmZXRjaE9wdGlvbnM/LmluaXRpYWxQcm9taXNlKSB7XG4gICAgcmV0dXJuICgpID0+IGZldGNoT3B0aW9ucy5pbml0aWFsUHJvbWlzZTtcbiAgfVxuICBpZiAoIW9wdGlvbnMucXVlcnlGbiB8fCBvcHRpb25zLnF1ZXJ5Rm4gPT09IHNraXBUb2tlbikge1xuICAgIHJldHVybiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYE1pc3NpbmcgcXVlcnlGbjogJyR7b3B0aW9ucy5xdWVyeUhhc2h9J2ApKTtcbiAgfVxuICByZXR1cm4gb3B0aW9ucy5xdWVyeUZuO1xufVxuZnVuY3Rpb24gc2hvdWxkVGhyb3dFcnJvcih0aHJvd09uRXJyb3IsIHBhcmFtcykge1xuICBpZiAodHlwZW9mIHRocm93T25FcnJvciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHRocm93T25FcnJvciguLi5wYXJhbXMpO1xuICB9XG4gIHJldHVybiAhIXRocm93T25FcnJvcjtcbn1cbmZ1bmN0aW9uIGFkZENvbnN1bWVBd2FyZVNpZ25hbChvYmplY3QsIGdldFNpZ25hbCwgb25DYW5jZWxsZWQpIHtcbiAgbGV0IGNvbnN1bWVkID0gZmFsc2U7XG4gIGxldCBzaWduYWw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIFwic2lnbmFsXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgc2lnbmFsID8/PSBnZXRTaWduYWwoKTtcbiAgICAgIGlmIChjb25zdW1lZCkge1xuICAgICAgICByZXR1cm4gc2lnbmFsO1xuICAgICAgfVxuICAgICAgY29uc3VtZWQgPSB0cnVlO1xuICAgICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICAgIG9uQ2FuY2VsbGVkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIG9uQ2FuY2VsbGVkLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2lnbmFsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmplY3Q7XG59XG5leHBvcnQge1xuICBhZGRDb25zdW1lQXdhcmVTaWduYWwsXG4gIGFkZFRvRW5kLFxuICBhZGRUb1N0YXJ0LFxuICBlbnN1cmVRdWVyeUZuLFxuICBmdW5jdGlvbmFsVXBkYXRlLFxuICBoYXNoS2V5LFxuICBoYXNoUXVlcnlLZXlCeU9wdGlvbnMsXG4gIGlzUGxhaW5BcnJheSxcbiAgaXNQbGFpbk9iamVjdCxcbiAgaXNTZXJ2ZXIsXG4gIGlzVmFsaWRUaW1lb3V0LFxuICBrZWVwUHJldmlvdXNEYXRhLFxuICBtYXRjaE11dGF0aW9uLFxuICBtYXRjaFF1ZXJ5LFxuICBub29wLFxuICBwYXJ0aWFsTWF0Y2hLZXksXG4gIHJlcGxhY2VEYXRhLFxuICByZXBsYWNlRXF1YWxEZWVwLFxuICByZXNvbHZlUXVlcnlCb29sZWFuLFxuICByZXNvbHZlU3RhbGVUaW1lLFxuICBzaGFsbG93RXF1YWxPYmplY3RzLFxuICBzaG91bGRUaHJvd0Vycm9yLFxuICBza2lwVG9rZW4sXG4gIHNsZWVwLFxuICB0aW1lVW50aWxTdGFsZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIi8vIHNyYy9lbnZpcm9ubWVudE1hbmFnZXIudHNcbmltcG9ydCB7IGlzU2VydmVyIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcbnZhciBlbnZpcm9ubWVudE1hbmFnZXIgPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IHtcbiAgbGV0IGlzU2VydmVyRm4gPSAoKSA9PiBpc1NlcnZlcjtcbiAgcmV0dXJuIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGN1cnJlbnQgcnVudGltZSBzaG91bGQgYmUgdHJlYXRlZCBhcyBhIHNlcnZlciBlbnZpcm9ubWVudC5cbiAgICAgKi9cbiAgICBpc1NlcnZlcigpIHtcbiAgICAgIHJldHVybiBpc1NlcnZlckZuKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBPdmVycmlkZXMgdGhlIHNlcnZlciBjaGVjayBnbG9iYWxseS5cbiAgICAgKi9cbiAgICBzZXRJc1NlcnZlcihpc1NlcnZlclZhbHVlKSB7XG4gICAgICBpc1NlcnZlckZuID0gaXNTZXJ2ZXJWYWx1ZTtcbiAgICB9XG4gIH07XG59KSgpO1xuZXhwb3J0IHtcbiAgZW52aXJvbm1lbnRNYW5hZ2VyXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZW52aXJvbm1lbnRNYW5hZ2VyLmpzLm1hcCIsIi8vIHNyYy90aGVuYWJsZS50c1xuaW1wb3J0IHsgbm9vcCB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5mdW5jdGlvbiBwZW5kaW5nVGhlbmFibGUoKSB7XG4gIGxldCByZXNvbHZlO1xuICBsZXQgcmVqZWN0O1xuICBjb25zdCB0aGVuYWJsZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSwgX3JlamVjdCkgPT4ge1xuICAgIHJlc29sdmUgPSBfcmVzb2x2ZTtcbiAgICByZWplY3QgPSBfcmVqZWN0O1xuICB9KTtcbiAgdGhlbmFibGUuc3RhdHVzID0gXCJwZW5kaW5nXCI7XG4gIHRoZW5hYmxlLmNhdGNoKCgpID0+IHtcbiAgfSk7XG4gIGZ1bmN0aW9uIGZpbmFsaXplKGRhdGEpIHtcbiAgICBPYmplY3QuYXNzaWduKHRoZW5hYmxlLCBkYXRhKTtcbiAgICBkZWxldGUgdGhlbmFibGUucmVzb2x2ZTtcbiAgICBkZWxldGUgdGhlbmFibGUucmVqZWN0O1xuICB9XG4gIHRoZW5hYmxlLnJlc29sdmUgPSAodmFsdWUpID0+IHtcbiAgICBmaW5hbGl6ZSh7XG4gICAgICBzdGF0dXM6IFwiZnVsZmlsbGVkXCIsXG4gICAgICB2YWx1ZVxuICAgIH0pO1xuICAgIHJlc29sdmUodmFsdWUpO1xuICB9O1xuICB0aGVuYWJsZS5yZWplY3QgPSAocmVhc29uKSA9PiB7XG4gICAgZmluYWxpemUoe1xuICAgICAgc3RhdHVzOiBcInJlamVjdGVkXCIsXG4gICAgICByZWFzb25cbiAgICB9KTtcbiAgICByZWplY3QocmVhc29uKTtcbiAgfTtcbiAgcmV0dXJuIHRoZW5hYmxlO1xufVxuZnVuY3Rpb24gdHJ5UmVzb2x2ZVN5bmMocHJvbWlzZSkge1xuICBsZXQgZGF0YTtcbiAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcbiAgICBkYXRhID0gcmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIG5vb3ApPy5jYXRjaChub29wKTtcbiAgaWYgKGRhdGEgIT09IHZvaWQgMCkge1xuICAgIHJldHVybiB7IGRhdGEgfTtcbiAgfVxuICByZXR1cm4gdm9pZCAwO1xufVxuZXhwb3J0IHtcbiAgcGVuZGluZ1RoZW5hYmxlLFxuICB0cnlSZXNvbHZlU3luY1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRoZW5hYmxlLmpzLm1hcCIsIi8vIHNyYy9oeWRyYXRpb24udHNcbmltcG9ydCB7IHRyeVJlc29sdmVTeW5jIH0gZnJvbSBcIi4vdGhlbmFibGUuanNcIjtcbmltcG9ydCB7IG5vb3AgfSBmcm9tIFwiLi91dGlscy5qc1wiO1xuZnVuY3Rpb24gZGVmYXVsdFRyYW5zZm9ybWVyRm4oZGF0YSkge1xuICByZXR1cm4gZGF0YTtcbn1cbmZ1bmN0aW9uIGRlaHlkcmF0ZU11dGF0aW9uKG11dGF0aW9uKSB7XG4gIHJldHVybiB7XG4gICAgbXV0YXRpb25LZXk6IG11dGF0aW9uLm9wdGlvbnMubXV0YXRpb25LZXksXG4gICAgc3RhdGU6IG11dGF0aW9uLnN0YXRlLFxuICAgIC4uLm11dGF0aW9uLm9wdGlvbnMuc2NvcGUgJiYgeyBzY29wZTogbXV0YXRpb24ub3B0aW9ucy5zY29wZSB9LFxuICAgIC4uLm11dGF0aW9uLm1ldGEgJiYgeyBtZXRhOiBtdXRhdGlvbi5tZXRhIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIGRlaHlkcmF0ZVF1ZXJ5KHF1ZXJ5LCBzZXJpYWxpemVEYXRhLCBzaG91bGRSZWRhY3RFcnJvcnMpIHtcbiAgY29uc3QgZGVoeWRyYXRlUHJvbWlzZSA9ICgpID0+IHtcbiAgICBjb25zdCBwcm9taXNlID0gcXVlcnkucHJvbWlzZT8udGhlbihzZXJpYWxpemVEYXRhKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGlmICghc2hvdWxkUmVkYWN0RXJyb3JzKGVycm9yKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBBIHF1ZXJ5IHRoYXQgd2FzIGRlaHlkcmF0ZWQgYXMgcGVuZGluZyBlbmRlZCB1cCByZWplY3RpbmcuIFske3F1ZXJ5LnF1ZXJ5SGFzaH1dOiAke2Vycm9yfTsgVGhlIGVycm9yIHdpbGwgYmUgcmVkYWN0ZWQgaW4gcHJvZHVjdGlvbiBidWlsZHNgXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwicmVkYWN0ZWRcIikpO1xuICAgIH0pO1xuICAgIHByb21pc2U/LmNhdGNoKG5vb3ApO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9O1xuICByZXR1cm4ge1xuICAgIGRlaHlkcmF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICBzdGF0ZToge1xuICAgICAgLi4ucXVlcnkuc3RhdGUsXG4gICAgICAuLi5xdWVyeS5zdGF0ZS5kYXRhICE9PSB2b2lkIDAgJiYge1xuICAgICAgICBkYXRhOiBzZXJpYWxpemVEYXRhKHF1ZXJ5LnN0YXRlLmRhdGEpXG4gICAgICB9XG4gICAgfSxcbiAgICBxdWVyeUtleTogcXVlcnkucXVlcnlLZXksXG4gICAgcXVlcnlIYXNoOiBxdWVyeS5xdWVyeUhhc2gsXG4gICAgLi4ucXVlcnkuc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIiAmJiB7XG4gICAgICBwcm9taXNlOiBkZWh5ZHJhdGVQcm9taXNlKClcbiAgICB9LFxuICAgIC4uLnF1ZXJ5Lm1ldGEgJiYgeyBtZXRhOiBxdWVyeS5tZXRhIH0sXG4gICAgLi4ucXVlcnkucXVlcnlUeXBlICYmIHsgcXVlcnlUeXBlOiBxdWVyeS5xdWVyeVR5cGUgfVxuICB9O1xufVxuZnVuY3Rpb24gZGVmYXVsdFNob3VsZERlaHlkcmF0ZU11dGF0aW9uKG11dGF0aW9uKSB7XG4gIHJldHVybiBtdXRhdGlvbi5zdGF0ZS5pc1BhdXNlZDtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRTaG91bGREZWh5ZHJhdGVRdWVyeShxdWVyeSkge1xuICByZXR1cm4gcXVlcnkuc3RhdGUuc3RhdHVzID09PSBcInN1Y2Nlc3NcIjtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRTaG91bGRSZWRhY3RFcnJvcnMoXykge1xuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGRlaHlkcmF0ZShjbGllbnQsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBmaWx0ZXJNdXRhdGlvbiA9IG9wdGlvbnMuc2hvdWxkRGVoeWRyYXRlTXV0YXRpb24gPz8gY2xpZW50LmdldERlZmF1bHRPcHRpb25zKCkuZGVoeWRyYXRlPy5zaG91bGREZWh5ZHJhdGVNdXRhdGlvbiA/PyBkZWZhdWx0U2hvdWxkRGVoeWRyYXRlTXV0YXRpb247XG4gIGNvbnN0IG11dGF0aW9ucyA9IGNsaWVudC5nZXRNdXRhdGlvbkNhY2hlKCkuZ2V0QWxsKCkuZmxhdE1hcChcbiAgICAobXV0YXRpb24pID0+IGZpbHRlck11dGF0aW9uKG11dGF0aW9uKSA/IFtkZWh5ZHJhdGVNdXRhdGlvbihtdXRhdGlvbildIDogW11cbiAgKTtcbiAgY29uc3QgZmlsdGVyUXVlcnkgPSBvcHRpb25zLnNob3VsZERlaHlkcmF0ZVF1ZXJ5ID8/IGNsaWVudC5nZXREZWZhdWx0T3B0aW9ucygpLmRlaHlkcmF0ZT8uc2hvdWxkRGVoeWRyYXRlUXVlcnkgPz8gZGVmYXVsdFNob3VsZERlaHlkcmF0ZVF1ZXJ5O1xuICBjb25zdCBzaG91bGRSZWRhY3RFcnJvcnMgPSBvcHRpb25zLnNob3VsZFJlZGFjdEVycm9ycyA/PyBjbGllbnQuZ2V0RGVmYXVsdE9wdGlvbnMoKS5kZWh5ZHJhdGU/LnNob3VsZFJlZGFjdEVycm9ycyA/PyBkZWZhdWx0U2hvdWxkUmVkYWN0RXJyb3JzO1xuICBjb25zdCBzZXJpYWxpemVEYXRhID0gb3B0aW9ucy5zZXJpYWxpemVEYXRhID8/IGNsaWVudC5nZXREZWZhdWx0T3B0aW9ucygpLmRlaHlkcmF0ZT8uc2VyaWFsaXplRGF0YSA/PyBkZWZhdWx0VHJhbnNmb3JtZXJGbjtcbiAgY29uc3QgcXVlcmllcyA9IGNsaWVudC5nZXRRdWVyeUNhY2hlKCkuZ2V0QWxsKCkuZmxhdE1hcChcbiAgICAocXVlcnkpID0+IGZpbHRlclF1ZXJ5KHF1ZXJ5KSA/IFtkZWh5ZHJhdGVRdWVyeShxdWVyeSwgc2VyaWFsaXplRGF0YSwgc2hvdWxkUmVkYWN0RXJyb3JzKV0gOiBbXVxuICApO1xuICByZXR1cm4geyBtdXRhdGlvbnMsIHF1ZXJpZXMgfTtcbn1cbmZ1bmN0aW9uIGh5ZHJhdGUoY2xpZW50LCBkZWh5ZHJhdGVkU3RhdGUsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBkZWh5ZHJhdGVkU3RhdGUgIT09IFwib2JqZWN0XCIgfHwgZGVoeWRyYXRlZFN0YXRlID09PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG11dGF0aW9uQ2FjaGUgPSBjbGllbnQuZ2V0TXV0YXRpb25DYWNoZSgpO1xuICBjb25zdCBxdWVyeUNhY2hlID0gY2xpZW50LmdldFF1ZXJ5Q2FjaGUoKTtcbiAgY29uc3QgZGVzZXJpYWxpemVEYXRhID0gb3B0aW9ucz8uZGVmYXVsdE9wdGlvbnM/LmRlc2VyaWFsaXplRGF0YSA/PyBjbGllbnQuZ2V0RGVmYXVsdE9wdGlvbnMoKS5oeWRyYXRlPy5kZXNlcmlhbGl6ZURhdGEgPz8gZGVmYXVsdFRyYW5zZm9ybWVyRm47XG4gIGNvbnN0IG11dGF0aW9ucyA9IGRlaHlkcmF0ZWRTdGF0ZS5tdXRhdGlvbnMgfHwgW107XG4gIGNvbnN0IHF1ZXJpZXMgPSBkZWh5ZHJhdGVkU3RhdGUucXVlcmllcyB8fCBbXTtcbiAgbXV0YXRpb25zLmZvckVhY2goKHsgc3RhdGUsIC4uLm11dGF0aW9uT3B0aW9ucyB9KSA9PiB7XG4gICAgbXV0YXRpb25DYWNoZS5idWlsZChcbiAgICAgIGNsaWVudCxcbiAgICAgIHtcbiAgICAgICAgLi4uY2xpZW50LmdldERlZmF1bHRPcHRpb25zKCkuaHlkcmF0ZT8ubXV0YXRpb25zLFxuICAgICAgICAuLi5vcHRpb25zPy5kZWZhdWx0T3B0aW9ucz8ubXV0YXRpb25zLFxuICAgICAgICAuLi5tdXRhdGlvbk9wdGlvbnNcbiAgICAgIH0sXG4gICAgICBzdGF0ZVxuICAgICk7XG4gIH0pO1xuICBxdWVyaWVzLmZvckVhY2goXG4gICAgKHtcbiAgICAgIHF1ZXJ5S2V5LFxuICAgICAgc3RhdGUsXG4gICAgICBxdWVyeUhhc2gsXG4gICAgICBtZXRhLFxuICAgICAgcHJvbWlzZSxcbiAgICAgIGRlaHlkcmF0ZWRBdCxcbiAgICAgIHF1ZXJ5VHlwZVxuICAgIH0pID0+IHtcbiAgICAgIGNvbnN0IHN5bmNEYXRhID0gcHJvbWlzZSA/IHRyeVJlc29sdmVTeW5jKHByb21pc2UpIDogdm9pZCAwO1xuICAgICAgY29uc3QgcmF3RGF0YSA9IHN0YXRlLmRhdGEgPT09IHZvaWQgMCA/IHN5bmNEYXRhPy5kYXRhIDogc3RhdGUuZGF0YTtcbiAgICAgIGNvbnN0IGRhdGEgPSByYXdEYXRhID09PSB2b2lkIDAgPyByYXdEYXRhIDogZGVzZXJpYWxpemVEYXRhKHJhd0RhdGEpO1xuICAgICAgbGV0IHF1ZXJ5ID0gcXVlcnlDYWNoZS5nZXQocXVlcnlIYXNoKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nUXVlcnlJc1BlbmRpbmcgPSBxdWVyeT8uc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIjtcbiAgICAgIGNvbnN0IGV4aXN0aW5nUXVlcnlJc0ZldGNoaW5nID0gcXVlcnk/LnN0YXRlLmZldGNoU3RhdHVzID09PSBcImZldGNoaW5nXCI7XG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgY29uc3QgaGFzTmV3ZXJTeW5jRGF0YSA9IHN5bmNEYXRhICYmIC8vIFdlIG9ubHkgbmVlZCB0aGlzIHVuZGVmaW5lZCBjaGVjayB0byBoYW5kbGUgb2xkZXIgZGVoeWRyYXRpb25cbiAgICAgICAgLy8gcGF5bG9hZHMgdGhhdCBtaWdodCBub3QgaGF2ZSBkZWh5ZHJhdGVkQXRcbiAgICAgICAgZGVoeWRyYXRlZEF0ICE9PSB2b2lkIDAgJiYgZGVoeWRyYXRlZEF0ID4gcXVlcnkuc3RhdGUuZGF0YVVwZGF0ZWRBdDtcbiAgICAgICAgaWYgKHN0YXRlLmRhdGFVcGRhdGVkQXQgPiBxdWVyeS5zdGF0ZS5kYXRhVXBkYXRlZEF0IHx8IGhhc05ld2VyU3luY0RhdGEpIHtcbiAgICAgICAgICBjb25zdCB7IGZldGNoU3RhdHVzOiBfaWdub3JlZCwgLi4uc2VyaWFsaXplZFN0YXRlIH0gPSBzdGF0ZTtcbiAgICAgICAgICBxdWVyeS5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAuLi5zZXJpYWxpemVkU3RhdGUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgLy8gSWYgdGhlIHF1ZXJ5IHdhcyBwZW5kaW5nIGF0IHRoZSBtb21lbnQgb2YgZGVoeWRyYXRpb24sIGJ1dCByZXNvbHZlZCB0byBoYXZlIGRhdGFcbiAgICAgICAgICAgIC8vIGJlZm9yZSBoeWRyYXRpb24sIHdlIGNhbiBhc3N1bWUgdGhlIHF1ZXJ5IHNob3VsZCBiZSBoeWRyYXRlZCBhcyBzdWNjZXNzZnVsLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFNpbmNlIHlvdSBjYW4gb3B0IGludG8gZGVoeWRyYXRpbmcgZmFpbGVkIHF1ZXJpZXMsIGFuZCB0aG9zZSBjYW4gaGF2ZSBkYXRhIGZyb21cbiAgICAgICAgICAgIC8vIHByZXZpb3VzIHN1Y2Nlc3NmdWwgZmV0Y2hlcywgd2UgbWFrZSBzdXJlIHdlIG9ubHkgZG8gdGhpcyBmb3IgcGVuZGluZyBxdWVyaWVzLlxuICAgICAgICAgICAgLi4uc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIiAmJiBkYXRhICE9PSB2b2lkIDAgJiYge1xuICAgICAgICAgICAgICBzdGF0dXM6IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgICAvLyBQcmVzZXJ2ZSBleGlzdGluZyBmZXRjaFN0YXR1cyBpZiB0aGUgZXhpc3RpbmcgcXVlcnkgaXMgYWN0aXZlbHkgZmV0Y2hpbmcuXG4gICAgICAgICAgICAgIC4uLiFleGlzdGluZ1F1ZXJ5SXNGZXRjaGluZyAmJiB7XG4gICAgICAgICAgICAgICAgZmV0Y2hTdGF0dXM6IFwiaWRsZVwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkgPSBxdWVyeUNhY2hlLmJ1aWxkKFxuICAgICAgICAgIGNsaWVudCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAuLi5jbGllbnQuZ2V0RGVmYXVsdE9wdGlvbnMoKS5oeWRyYXRlPy5xdWVyaWVzLFxuICAgICAgICAgICAgLi4ub3B0aW9ucz8uZGVmYXVsdE9wdGlvbnM/LnF1ZXJpZXMsXG4gICAgICAgICAgICBxdWVyeUtleSxcbiAgICAgICAgICAgIHF1ZXJ5SGFzaCxcbiAgICAgICAgICAgIG1ldGEsXG4gICAgICAgICAgICBfdHlwZTogcXVlcnlUeXBlXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBSZXNldCBmZXRjaCBzdGF0dXMgdG8gaWRsZSB0byBhdm9pZFxuICAgICAgICAgIC8vIHF1ZXJ5IGJlaW5nIHN0dWNrIGluIGZldGNoaW5nIHN0YXRlIHVwb24gaHlkcmF0aW9uXG4gICAgICAgICAge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgZmV0Y2hTdGF0dXM6IFwiaWRsZVwiLFxuICAgICAgICAgICAgLy8gTGlrZSBhYm92ZSwgaWYgdGhlIHF1ZXJ5IHdhcyBwZW5kaW5nIGF0IHRoZSBtb21lbnQgb2YgZGVoeWRyYXRpb24gYnV0IGhhcyBkYXRhLFxuICAgICAgICAgICAgLy8gd2UgY2FuIGFzc3VtZSBpdCBzaG91bGQgYmUgaHlkcmF0ZWQgYXMgc3VjY2Vzc2Z1bC5cbiAgICAgICAgICAgIHN0YXR1czogc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIiAmJiBkYXRhICE9PSB2b2lkIDAgPyBcInN1Y2Nlc3NcIiA6IHN0YXRlLnN0YXR1c1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcm9taXNlICYmIC8vIElmIHRoZSBkYXRhIHdhcyBzeW5jaHJvbm91c2x5IGF2YWlsYWJsZSwgdGhlcmUgaXMgbm8gbmVlZCB0byBzZXQgdXBcbiAgICAgIC8vIGEgcmV0cnllciBhbmQgdGh1cyBubyByZWFzb24gdG8gY2FsbCBmZXRjaFxuICAgICAgIXN5bmNEYXRhICYmICFleGlzdGluZ1F1ZXJ5SXNQZW5kaW5nICYmICFleGlzdGluZ1F1ZXJ5SXNGZXRjaGluZyAmJiAvLyBPbmx5IGh5ZHJhdGUgaWYgZGVoeWRyYXRpb24gaXMgbmV3ZXIgdGhhbiBhbnkgZXhpc3RpbmcgZGF0YSxcbiAgICAgIC8vIHRoaXMgaXMgYWx3YXlzIHRydWUgZm9yIG5ldyBxdWVyaWVzXG4gICAgICAoZGVoeWRyYXRlZEF0ID09PSB2b2lkIDAgfHwgZGVoeWRyYXRlZEF0ID4gcXVlcnkuc3RhdGUuZGF0YVVwZGF0ZWRBdCkpIHtcbiAgICAgICAgcXVlcnkuZmV0Y2godm9pZCAwLCB7XG4gICAgICAgICAgLy8gUlNDIHRyYW5zZm9ybWVkIHByb21pc2VzIGFyZSBub3QgdGhlbmFibGVcbiAgICAgICAgICBpbml0aWFsUHJvbWlzZTogUHJvbWlzZS5yZXNvbHZlKHByb21pc2UpLnRoZW4oZGVzZXJpYWxpemVEYXRhKVxuICAgICAgICB9KS5jYXRjaChub29wKTtcbiAgICAgIH1cbiAgICB9XG4gICk7XG59XG5leHBvcnQge1xuICBkZWZhdWx0U2hvdWxkRGVoeWRyYXRlTXV0YXRpb24sXG4gIGRlZmF1bHRTaG91bGREZWh5ZHJhdGVRdWVyeSxcbiAgZGVoeWRyYXRlLFxuICBoeWRyYXRlXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHlkcmF0aW9uLmpzLm1hcCIsIi8vIHNyYy9ub3RpZnlNYW5hZ2VyLnRzXG5pbXBvcnQgeyBzeXN0ZW1TZXRUaW1lb3V0WmVybyB9IGZyb20gXCIuL3RpbWVvdXRNYW5hZ2VyLmpzXCI7XG52YXIgZGVmYXVsdFNjaGVkdWxlciA9IHN5c3RlbVNldFRpbWVvdXRaZXJvO1xuZnVuY3Rpb24gY3JlYXRlTm90aWZ5TWFuYWdlcigpIHtcbiAgbGV0IHF1ZXVlID0gW107XG4gIGxldCB0cmFuc2FjdGlvbnMgPSAwO1xuICBsZXQgbm90aWZ5Rm4gPSAoY2FsbGJhY2spID0+IHtcbiAgICBjYWxsYmFjaygpO1xuICB9O1xuICBsZXQgYmF0Y2hOb3RpZnlGbiA9IChjYWxsYmFjaykgPT4ge1xuICAgIGNhbGxiYWNrKCk7XG4gIH07XG4gIGxldCBzY2hlZHVsZUZuID0gZGVmYXVsdFNjaGVkdWxlcjtcbiAgY29uc3Qgc2NoZWR1bGUgPSAoY2FsbGJhY2spID0+IHtcbiAgICBpZiAodHJhbnNhY3Rpb25zKSB7XG4gICAgICBxdWV1ZS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVGbigoKSA9PiB7XG4gICAgICAgIG5vdGlmeUZuKGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgZmx1c2ggPSAoKSA9PiB7XG4gICAgY29uc3Qgb3JpZ2luYWxRdWV1ZSA9IHF1ZXVlO1xuICAgIHF1ZXVlID0gW107XG4gICAgaWYgKG9yaWdpbmFsUXVldWUubGVuZ3RoKSB7XG4gICAgICBzY2hlZHVsZUZuKCgpID0+IHtcbiAgICAgICAgYmF0Y2hOb3RpZnlGbigoKSA9PiB7XG4gICAgICAgICAgb3JpZ2luYWxRdWV1ZS5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgICAgICAgbm90aWZ5Rm4oY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBiYXRjaDogKGNhbGxiYWNrKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0O1xuICAgICAgdHJhbnNhY3Rpb25zKys7XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBjYWxsYmFjaygpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdHJhbnNhY3Rpb25zLS07XG4gICAgICAgIGlmICghdHJhbnNhY3Rpb25zKSB7XG4gICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEFsbCBjYWxscyB0byB0aGUgd3JhcHBlZCBmdW5jdGlvbiB3aWxsIGJlIGJhdGNoZWQuXG4gICAgICovXG4gICAgYmF0Y2hDYWxsczogKGNhbGxiYWNrKSA9PiB7XG4gICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSxcbiAgICBzY2hlZHVsZSxcbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IGEgY3VzdG9tIG5vdGlmeSBmdW5jdGlvbi5cbiAgICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGZvciBleGFtcGxlIHdyYXAgbm90aWZpY2F0aW9ucyB3aXRoIGBSZWFjdC5hY3RgIHdoaWxlIHJ1bm5pbmcgdGVzdHMuXG4gICAgICovXG4gICAgc2V0Tm90aWZ5RnVuY3Rpb246IChmbikgPT4ge1xuICAgICAgbm90aWZ5Rm4gPSBmbjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBjdXN0b20gZnVuY3Rpb24gdG8gYmF0Y2ggbm90aWZpY2F0aW9ucyB0b2dldGhlciBpbnRvIGEgc2luZ2xlIHRpY2suXG4gICAgICogQnkgZGVmYXVsdCBSZWFjdCBRdWVyeSB3aWxsIHVzZSB0aGUgYmF0Y2ggZnVuY3Rpb24gcHJvdmlkZWQgYnkgUmVhY3RET00gb3IgUmVhY3QgTmF0aXZlLlxuICAgICAqL1xuICAgIHNldEJhdGNoTm90aWZ5RnVuY3Rpb246IChmbikgPT4ge1xuICAgICAgYmF0Y2hOb3RpZnlGbiA9IGZuO1xuICAgIH0sXG4gICAgc2V0U2NoZWR1bGVyOiAoZm4pID0+IHtcbiAgICAgIHNjaGVkdWxlRm4gPSBmbjtcbiAgICB9XG4gIH07XG59XG52YXIgbm90aWZ5TWFuYWdlciA9IGNyZWF0ZU5vdGlmeU1hbmFnZXIoKTtcbmV4cG9ydCB7XG4gIGNyZWF0ZU5vdGlmeU1hbmFnZXIsXG4gIGRlZmF1bHRTY2hlZHVsZXIsXG4gIG5vdGlmeU1hbmFnZXJcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3RpZnlNYW5hZ2VyLmpzLm1hcCIsIi8vIHNyYy9vbmxpbmVNYW5hZ2VyLnRzXG5pbXBvcnQgeyBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi9zdWJzY3JpYmFibGUuanNcIjtcbnZhciBPbmxpbmVNYW5hZ2VyID0gY2xhc3MgZXh0ZW5kcyBTdWJzY3JpYmFibGUge1xuICAjb25saW5lID0gdHJ1ZTtcbiAgI2NsZWFudXA7XG4gICNzZXR1cDtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNzZXR1cCA9IChvbk9ubGluZSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3Qgb25saW5lTGlzdGVuZXIgPSAoKSA9PiBvbk9ubGluZSh0cnVlKTtcbiAgICAgICAgY29uc3Qgb2ZmbGluZUxpc3RlbmVyID0gKCkgPT4gb25PbmxpbmUoZmFsc2UpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm9ubGluZVwiLCBvbmxpbmVMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm9mZmxpbmVcIiwgb2ZmbGluZUxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvbmxpbmVcIiwgb25saW5lTGlzdGVuZXIpO1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwib2ZmbGluZVwiLCBvZmZsaW5lTGlzdGVuZXIpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH07XG4gIH1cbiAgb25TdWJzY3JpYmUoKSB7XG4gICAgaWYgKCF0aGlzLiNjbGVhbnVwKSB7XG4gICAgICB0aGlzLnNldEV2ZW50TGlzdGVuZXIodGhpcy4jc2V0dXApO1xuICAgIH1cbiAgfVxuICBvblVuc3Vic2NyaWJlKCkge1xuICAgIGlmICghdGhpcy5oYXNMaXN0ZW5lcnMoKSkge1xuICAgICAgdGhpcy4jY2xlYW51cD8uKCk7XG4gICAgICB0aGlzLiNjbGVhbnVwID0gdm9pZCAwO1xuICAgIH1cbiAgfVxuICBzZXRFdmVudExpc3RlbmVyKHNldHVwKSB7XG4gICAgdGhpcy4jc2V0dXAgPSBzZXR1cDtcbiAgICB0aGlzLiNjbGVhbnVwPy4oKTtcbiAgICB0aGlzLiNjbGVhbnVwID0gc2V0dXAodGhpcy5zZXRPbmxpbmUuYmluZCh0aGlzKSk7XG4gIH1cbiAgc2V0T25saW5lKG9ubGluZSkge1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLiNvbmxpbmUgIT09IG9ubGluZTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy4jb25saW5lID0gb25saW5lO1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIob25saW5lKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpc09ubGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jb25saW5lO1xuICB9XG59O1xudmFyIG9ubGluZU1hbmFnZXIgPSBuZXcgT25saW5lTWFuYWdlcigpO1xuZXhwb3J0IHtcbiAgT25saW5lTWFuYWdlcixcbiAgb25saW5lTWFuYWdlclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9ubGluZU1hbmFnZXIuanMubWFwIiwiLy8gc3JjL3JldHJ5ZXIudHNcbmltcG9ydCB7IGZvY3VzTWFuYWdlciB9IGZyb20gXCIuL2ZvY3VzTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgb25saW5lTWFuYWdlciB9IGZyb20gXCIuL29ubGluZU1hbmFnZXIuanNcIjtcbmltcG9ydCB7IHBlbmRpbmdUaGVuYWJsZSB9IGZyb20gXCIuL3RoZW5hYmxlLmpzXCI7XG5pbXBvcnQgeyBlbnZpcm9ubWVudE1hbmFnZXIgfSBmcm9tIFwiLi9lbnZpcm9ubWVudE1hbmFnZXIuanNcIjtcbmltcG9ydCB7IHNsZWVwIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcbmZ1bmN0aW9uIGRlZmF1bHRSZXRyeURlbGF5KGZhaWx1cmVDb3VudCkge1xuICByZXR1cm4gTWF0aC5taW4oMWUzICogMiAqKiBmYWlsdXJlQ291bnQsIDNlNCk7XG59XG5mdW5jdGlvbiBjYW5GZXRjaChuZXR3b3JrTW9kZSkge1xuICByZXR1cm4gKG5ldHdvcmtNb2RlID8/IFwib25saW5lXCIpID09PSBcIm9ubGluZVwiID8gb25saW5lTWFuYWdlci5pc09ubGluZSgpIDogdHJ1ZTtcbn1cbnZhciBDYW5jZWxsZWRFcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoXCJDYW5jZWxsZWRFcnJvclwiKTtcbiAgICB0aGlzLnJldmVydCA9IG9wdGlvbnM/LnJldmVydDtcbiAgICB0aGlzLnNpbGVudCA9IG9wdGlvbnM/LnNpbGVudDtcbiAgfVxufTtcbmZ1bmN0aW9uIGlzQ2FuY2VsbGVkRXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQ2FuY2VsbGVkRXJyb3I7XG59XG5mdW5jdGlvbiBjcmVhdGVSZXRyeWVyKGNvbmZpZykge1xuICBsZXQgaXNSZXRyeUNhbmNlbGxlZCA9IGZhbHNlO1xuICBsZXQgZmFpbHVyZUNvdW50ID0gMDtcbiAgbGV0IGNvbnRpbnVlRm47XG4gIGNvbnN0IHRoZW5hYmxlID0gcGVuZGluZ1RoZW5hYmxlKCk7XG4gIGNvbnN0IGlzUmVzb2x2ZWQgPSAoKSA9PiB0aGVuYWJsZS5zdGF0dXMgIT09IFwicGVuZGluZ1wiO1xuICBjb25zdCBjYW5jZWwgPSAoY2FuY2VsT3B0aW9ucykgPT4ge1xuICAgIGlmICghaXNSZXNvbHZlZCgpKSB7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBDYW5jZWxsZWRFcnJvcihjYW5jZWxPcHRpb25zKTtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICBjb25maWcub25DYW5jZWw/LihlcnJvcik7XG4gICAgfVxuICB9O1xuICBjb25zdCBjYW5jZWxSZXRyeSA9ICgpID0+IHtcbiAgICBpc1JldHJ5Q2FuY2VsbGVkID0gdHJ1ZTtcbiAgfTtcbiAgY29uc3QgY29udGludWVSZXRyeSA9ICgpID0+IHtcbiAgICBpc1JldHJ5Q2FuY2VsbGVkID0gZmFsc2U7XG4gIH07XG4gIGNvbnN0IGNhbkNvbnRpbnVlID0gKCkgPT4gZm9jdXNNYW5hZ2VyLmlzRm9jdXNlZCgpICYmIChjb25maWcubmV0d29ya01vZGUgPT09IFwiYWx3YXlzXCIgfHwgb25saW5lTWFuYWdlci5pc09ubGluZSgpKSAmJiBjb25maWcuY2FuUnVuKCk7XG4gIGNvbnN0IGNhblN0YXJ0ID0gKCkgPT4gY2FuRmV0Y2goY29uZmlnLm5ldHdvcmtNb2RlKSAmJiBjb25maWcuY2FuUnVuKCk7XG4gIGNvbnN0IHJlc29sdmUgPSAodmFsdWUpID0+IHtcbiAgICBpZiAoIWlzUmVzb2x2ZWQoKSkge1xuICAgICAgY29udGludWVGbj8uKCk7XG4gICAgICB0aGVuYWJsZS5yZXNvbHZlKHZhbHVlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlamVjdCA9ICh2YWx1ZSkgPT4ge1xuICAgIGlmICghaXNSZXNvbHZlZCgpKSB7XG4gICAgICBjb250aW51ZUZuPy4oKTtcbiAgICAgIHRoZW5hYmxlLnJlamVjdCh2YWx1ZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXVzZSA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKGNvbnRpbnVlUmVzb2x2ZSkgPT4ge1xuICAgICAgY29udGludWVGbiA9ICh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAoaXNSZXNvbHZlZCgpIHx8IGNhbkNvbnRpbnVlKCkpIHtcbiAgICAgICAgICBjb250aW51ZVJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uZmlnLm9uUGF1c2U/LigpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29udGludWVGbiA9IHZvaWQgMDtcbiAgICAgIGlmICghaXNSZXNvbHZlZCgpKSB7XG4gICAgICAgIGNvbmZpZy5vbkNvbnRpbnVlPy4oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbiAgY29uc3QgcnVuID0gKCkgPT4ge1xuICAgIGlmIChpc1Jlc29sdmVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHByb21pc2VPclZhbHVlO1xuICAgIGNvbnN0IGluaXRpYWxQcm9taXNlID0gZmFpbHVyZUNvdW50ID09PSAwID8gY29uZmlnLmluaXRpYWxQcm9taXNlIDogdm9pZCAwO1xuICAgIHRyeSB7XG4gICAgICBwcm9taXNlT3JWYWx1ZSA9IGluaXRpYWxQcm9taXNlID8/IGNvbmZpZy5mbigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBwcm9taXNlT3JWYWx1ZSA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICB9XG4gICAgUHJvbWlzZS5yZXNvbHZlKHByb21pc2VPclZhbHVlKS50aGVuKHJlc29sdmUpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGlzUmVzb2x2ZWQoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByZXRyeSA9IGNvbmZpZy5yZXRyeSA/PyAoZW52aXJvbm1lbnRNYW5hZ2VyLmlzU2VydmVyKCkgPyAwIDogMyk7XG4gICAgICBjb25zdCByZXRyeURlbGF5ID0gY29uZmlnLnJldHJ5RGVsYXkgPz8gZGVmYXVsdFJldHJ5RGVsYXk7XG4gICAgICBjb25zdCBkZWxheSA9IHR5cGVvZiByZXRyeURlbGF5ID09PSBcImZ1bmN0aW9uXCIgPyByZXRyeURlbGF5KGZhaWx1cmVDb3VudCwgZXJyb3IpIDogcmV0cnlEZWxheTtcbiAgICAgIGNvbnN0IHNob3VsZFJldHJ5ID0gcmV0cnkgPT09IHRydWUgfHwgdHlwZW9mIHJldHJ5ID09PSBcIm51bWJlclwiICYmIGZhaWx1cmVDb3VudCA8IHJldHJ5IHx8IHR5cGVvZiByZXRyeSA9PT0gXCJmdW5jdGlvblwiICYmIHJldHJ5KGZhaWx1cmVDb3VudCwgZXJyb3IpO1xuICAgICAgaWYgKGlzUmV0cnlDYW5jZWxsZWQgfHwgIXNob3VsZFJldHJ5KSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZhaWx1cmVDb3VudCsrO1xuICAgICAgY29uZmlnLm9uRmFpbD8uKGZhaWx1cmVDb3VudCwgZXJyb3IpO1xuICAgICAgc2xlZXAoZGVsYXkpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gY2FuQ29udGludWUoKSA/IHZvaWQgMCA6IHBhdXNlKCk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKGlzUmV0cnlDYW5jZWxsZWQpIHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJ1bigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBwcm9taXNlOiB0aGVuYWJsZSxcbiAgICBzdGF0dXM6ICgpID0+IHRoZW5hYmxlLnN0YXR1cyxcbiAgICBjYW5jZWwsXG4gICAgY29udGludWU6ICgpID0+IHtcbiAgICAgIGNvbnRpbnVlRm4/LigpO1xuICAgICAgcmV0dXJuIHRoZW5hYmxlO1xuICAgIH0sXG4gICAgY2FuY2VsUmV0cnksXG4gICAgY29udGludWVSZXRyeSxcbiAgICBjYW5TdGFydCxcbiAgICBzdGFydDogKCkgPT4ge1xuICAgICAgaWYgKGNhblN0YXJ0KCkpIHtcbiAgICAgICAgcnVuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXVzZSgpLnRoZW4ocnVuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGVuYWJsZTtcbiAgICB9XG4gIH07XG59XG5leHBvcnQge1xuICBDYW5jZWxsZWRFcnJvcixcbiAgY2FuRmV0Y2gsXG4gIGNyZWF0ZVJldHJ5ZXIsXG4gIGlzQ2FuY2VsbGVkRXJyb3Jcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZXRyeWVyLmpzLm1hcCIsIi8vIHNyYy9yZW1vdmFibGUudHNcbmltcG9ydCB7IHRpbWVvdXRNYW5hZ2VyIH0gZnJvbSBcIi4vdGltZW91dE1hbmFnZXIuanNcIjtcbmltcG9ydCB7IGVudmlyb25tZW50TWFuYWdlciB9IGZyb20gXCIuL2Vudmlyb25tZW50TWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgaXNWYWxpZFRpbWVvdXQgfSBmcm9tIFwiLi91dGlscy5qc1wiO1xudmFyIFJlbW92YWJsZSA9IGNsYXNzIHtcbiAgI2djVGltZW91dDtcbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmNsZWFyR2NUaW1lb3V0KCk7XG4gIH1cbiAgc2NoZWR1bGVHYygpIHtcbiAgICB0aGlzLmNsZWFyR2NUaW1lb3V0KCk7XG4gICAgaWYgKGlzVmFsaWRUaW1lb3V0KHRoaXMuZ2NUaW1lKSkge1xuICAgICAgdGhpcy4jZ2NUaW1lb3V0ID0gdGltZW91dE1hbmFnZXIuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMub3B0aW9uYWxSZW1vdmUoKTtcbiAgICAgIH0sIHRoaXMuZ2NUaW1lKTtcbiAgICB9XG4gIH1cbiAgdXBkYXRlR2NUaW1lKG5ld0djVGltZSkge1xuICAgIHRoaXMuZ2NUaW1lID0gTWF0aC5tYXgoXG4gICAgICB0aGlzLmdjVGltZSB8fCAwLFxuICAgICAgbmV3R2NUaW1lID8/IChlbnZpcm9ubWVudE1hbmFnZXIuaXNTZXJ2ZXIoKSA/IEluZmluaXR5IDogNSAqIDYwICogMWUzKVxuICAgICk7XG4gIH1cbiAgY2xlYXJHY1RpbWVvdXQoKSB7XG4gICAgaWYgKHRoaXMuI2djVGltZW91dCAhPT0gdm9pZCAwKSB7XG4gICAgICB0aW1lb3V0TWFuYWdlci5jbGVhclRpbWVvdXQodGhpcy4jZ2NUaW1lb3V0KTtcbiAgICAgIHRoaXMuI2djVGltZW91dCA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbn07XG5leHBvcnQge1xuICBSZW1vdmFibGVcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZW1vdmFibGUuanMubWFwIiwiLy8gc3JjL2luZmluaXRlUXVlcnlCZWhhdmlvci50c1xuaW1wb3J0IHtcbiAgYWRkQ29uc3VtZUF3YXJlU2lnbmFsLFxuICBhZGRUb0VuZCxcbiAgYWRkVG9TdGFydCxcbiAgZW5zdXJlUXVlcnlGblxufSBmcm9tIFwiLi91dGlscy5qc1wiO1xuZnVuY3Rpb24gaW5maW5pdGVRdWVyeUJlaGF2aW9yKHBhZ2VzKSB7XG4gIHJldHVybiB7XG4gICAgb25GZXRjaDogKGNvbnRleHQsIHF1ZXJ5KSA9PiB7XG4gICAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gY29udGV4dC5mZXRjaE9wdGlvbnM/Lm1ldGE/LmZldGNoTW9yZT8uZGlyZWN0aW9uO1xuICAgICAgY29uc3Qgb2xkUGFnZXMgPSBjb250ZXh0LnN0YXRlLmRhdGE/LnBhZ2VzIHx8IFtdO1xuICAgICAgY29uc3Qgb2xkUGFnZVBhcmFtcyA9IGNvbnRleHQuc3RhdGUuZGF0YT8ucGFnZVBhcmFtcyB8fCBbXTtcbiAgICAgIGxldCByZXN1bHQgPSB7IHBhZ2VzOiBbXSwgcGFnZVBhcmFtczogW10gfTtcbiAgICAgIGxldCBjdXJyZW50UGFnZSA9IDA7XG4gICAgICBjb25zdCBmZXRjaEZuID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGFkZFNpZ25hbFByb3BlcnR5ID0gKG9iamVjdCkgPT4ge1xuICAgICAgICAgIGFkZENvbnN1bWVBd2FyZVNpZ25hbChcbiAgICAgICAgICAgIG9iamVjdCxcbiAgICAgICAgICAgICgpID0+IGNvbnRleHQuc2lnbmFsLFxuICAgICAgICAgICAgKCkgPT4gY2FuY2VsbGVkID0gdHJ1ZVxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHF1ZXJ5Rm4gPSBlbnN1cmVRdWVyeUZuKGNvbnRleHQub3B0aW9ucywgY29udGV4dC5mZXRjaE9wdGlvbnMpO1xuICAgICAgICBjb25zdCBmZXRjaFBhZ2UgPSBhc3luYyAoZGF0YSwgcGFyYW0sIHByZXZpb3VzKSA9PiB7XG4gICAgICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnRleHQuc2lnbmFsLnJlYXNvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXJhbSA9PSBudWxsICYmIGRhdGEucGFnZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBjcmVhdGVRdWVyeUZuQ29udGV4dCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5Rm5Db250ZXh0MiA9IHtcbiAgICAgICAgICAgICAgY2xpZW50OiBjb250ZXh0LmNsaWVudCxcbiAgICAgICAgICAgICAgcXVlcnlLZXk6IGNvbnRleHQucXVlcnlLZXksXG4gICAgICAgICAgICAgIHBhZ2VQYXJhbTogcGFyYW0sXG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogcHJldmlvdXMgPyBcImJhY2t3YXJkXCIgOiBcImZvcndhcmRcIixcbiAgICAgICAgICAgICAgbWV0YTogY29udGV4dC5vcHRpb25zLm1ldGFcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRTaWduYWxQcm9wZXJ0eShxdWVyeUZuQ29udGV4dDIpO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5Rm5Db250ZXh0MjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IHF1ZXJ5Rm5Db250ZXh0ID0gY3JlYXRlUXVlcnlGbkNvbnRleHQoKTtcbiAgICAgICAgICBjb25zdCBwYWdlID0gYXdhaXQgcXVlcnlGbihxdWVyeUZuQ29udGV4dCk7XG4gICAgICAgICAgY29uc3QgeyBtYXhQYWdlcyB9ID0gY29udGV4dC5vcHRpb25zO1xuICAgICAgICAgIGNvbnN0IGFkZFRvID0gcHJldmlvdXMgPyBhZGRUb1N0YXJ0IDogYWRkVG9FbmQ7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhZ2VzOiBhZGRUbyhkYXRhLnBhZ2VzLCBwYWdlLCBtYXhQYWdlcyksXG4gICAgICAgICAgICBwYWdlUGFyYW1zOiBhZGRUbyhkYXRhLnBhZ2VQYXJhbXMsIHBhcmFtLCBtYXhQYWdlcylcbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBpZiAoZGlyZWN0aW9uICYmIG9sZFBhZ2VzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IHByZXZpb3VzID0gZGlyZWN0aW9uID09PSBcImJhY2t3YXJkXCI7XG4gICAgICAgICAgY29uc3QgcGFnZVBhcmFtRm4gPSBwcmV2aW91cyA/IGdldFByZXZpb3VzUGFnZVBhcmFtIDogZ2V0TmV4dFBhZ2VQYXJhbTtcbiAgICAgICAgICBjb25zdCBvbGREYXRhID0ge1xuICAgICAgICAgICAgcGFnZXM6IG9sZFBhZ2VzLFxuICAgICAgICAgICAgcGFnZVBhcmFtczogb2xkUGFnZVBhcmFtc1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgcGFyYW0gPSBwYWdlUGFyYW1GbihvcHRpb25zLCBvbGREYXRhKTtcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBmZXRjaFBhZ2Uob2xkRGF0YSwgcGFyYW0sIHByZXZpb3VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCByZW1haW5pbmdQYWdlcyA9IHBhZ2VzID8/IG9sZFBhZ2VzLmxlbmd0aDtcbiAgICAgICAgICBkbyB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbSA9IGN1cnJlbnRQYWdlID09PSAwID8gb2xkUGFnZVBhcmFtc1swXSA/PyBvcHRpb25zLmluaXRpYWxQYWdlUGFyYW0gOiBnZXROZXh0UGFnZVBhcmFtKG9wdGlvbnMsIHJlc3VsdCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBhZ2UgPiAwICYmIHBhcmFtID09IG51bGwpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBmZXRjaFBhZ2UocmVzdWx0LCBwYXJhbSk7XG4gICAgICAgICAgICBjdXJyZW50UGFnZSsrO1xuICAgICAgICAgIH0gd2hpbGUgKGN1cnJlbnRQYWdlIDwgcmVtYWluaW5nUGFnZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgICAgaWYgKGNvbnRleHQub3B0aW9ucy5wZXJzaXN0ZXIpIHtcbiAgICAgICAgY29udGV4dC5mZXRjaEZuID0gKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0Lm9wdGlvbnMucGVyc2lzdGVyPy4oXG4gICAgICAgICAgICBmZXRjaEZuLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjbGllbnQ6IGNvbnRleHQuY2xpZW50LFxuICAgICAgICAgICAgICBxdWVyeUtleTogY29udGV4dC5xdWVyeUtleSxcbiAgICAgICAgICAgICAgbWV0YTogY29udGV4dC5vcHRpb25zLm1ldGEsXG4gICAgICAgICAgICAgIHNpZ25hbDogY29udGV4dC5zaWduYWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxdWVyeVxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmZldGNoRm4gPSBmZXRjaEZuO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIGdldE5leHRQYWdlUGFyYW0ob3B0aW9ucywgeyBwYWdlcywgcGFnZVBhcmFtcyB9KSB7XG4gIGNvbnN0IGxhc3RJbmRleCA9IHBhZ2VzLmxlbmd0aCAtIDE7XG4gIHJldHVybiBwYWdlcy5sZW5ndGggPiAwID8gb3B0aW9ucy5nZXROZXh0UGFnZVBhcmFtKFxuICAgIHBhZ2VzW2xhc3RJbmRleF0sXG4gICAgcGFnZXMsXG4gICAgcGFnZVBhcmFtc1tsYXN0SW5kZXhdLFxuICAgIHBhZ2VQYXJhbXNcbiAgKSA6IHZvaWQgMDtcbn1cbmZ1bmN0aW9uIGdldFByZXZpb3VzUGFnZVBhcmFtKG9wdGlvbnMsIHsgcGFnZXMsIHBhZ2VQYXJhbXMgfSkge1xuICByZXR1cm4gcGFnZXMubGVuZ3RoID4gMCA/IG9wdGlvbnMuZ2V0UHJldmlvdXNQYWdlUGFyYW0/LihwYWdlc1swXSwgcGFnZXMsIHBhZ2VQYXJhbXNbMF0sIHBhZ2VQYXJhbXMpIDogdm9pZCAwO1xufVxuZnVuY3Rpb24gaGFzTmV4dFBhZ2Uob3B0aW9ucywgZGF0YSkge1xuICBpZiAoIWRhdGEpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGdldE5leHRQYWdlUGFyYW0ob3B0aW9ucywgZGF0YSkgIT0gbnVsbDtcbn1cbmZ1bmN0aW9uIGhhc1ByZXZpb3VzUGFnZShvcHRpb25zLCBkYXRhKSB7XG4gIGlmICghZGF0YSB8fCAhb3B0aW9ucy5nZXRQcmV2aW91c1BhZ2VQYXJhbSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gZ2V0UHJldmlvdXNQYWdlUGFyYW0ob3B0aW9ucywgZGF0YSkgIT0gbnVsbDtcbn1cbmV4cG9ydCB7XG4gIGhhc05leHRQYWdlLFxuICBoYXNQcmV2aW91c1BhZ2UsXG4gIGluZmluaXRlUXVlcnlCZWhhdmlvclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZmluaXRlUXVlcnlCZWhhdmlvci5qcy5tYXAiLCIvLyBzcmMvcXVlcnkudHNcbmltcG9ydCB7XG4gIGVuc3VyZVF1ZXJ5Rm4sXG4gIG5vb3AsXG4gIHJlcGxhY2VEYXRhLFxuICByZXNvbHZlUXVlcnlCb29sZWFuLFxuICByZXNvbHZlU3RhbGVUaW1lLFxuICBza2lwVG9rZW4sXG4gIHRpbWVVbnRpbFN0YWxlXG59IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBub3RpZnlNYW5hZ2VyIH0gZnJvbSBcIi4vbm90aWZ5TWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IsIGNhbkZldGNoLCBjcmVhdGVSZXRyeWVyIH0gZnJvbSBcIi4vcmV0cnllci5qc1wiO1xuaW1wb3J0IHsgUmVtb3ZhYmxlIH0gZnJvbSBcIi4vcmVtb3ZhYmxlLmpzXCI7XG5pbXBvcnQgeyBpbmZpbml0ZVF1ZXJ5QmVoYXZpb3IgfSBmcm9tIFwiLi9pbmZpbml0ZVF1ZXJ5QmVoYXZpb3IuanNcIjtcbnZhciBRdWVyeSA9IGNsYXNzIGV4dGVuZHMgUmVtb3ZhYmxlIHtcbiAgI3F1ZXJ5VHlwZTtcbiAgI2luaXRpYWxTdGF0ZTtcbiAgI3JldmVydFN0YXRlO1xuICAjY2FjaGU7XG4gICNjbGllbnQ7XG4gICNyZXRyeWVyO1xuICAjZGVmYXVsdE9wdGlvbnM7XG4gICNhYm9ydFNpZ25hbENvbnN1bWVkO1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2Fib3J0U2lnbmFsQ29uc3VtZWQgPSBmYWxzZTtcbiAgICB0aGlzLiNkZWZhdWx0T3B0aW9ucyA9IGNvbmZpZy5kZWZhdWx0T3B0aW9ucztcbiAgICB0aGlzLnNldE9wdGlvbnMoY29uZmlnLm9wdGlvbnMpO1xuICAgIHRoaXMub2JzZXJ2ZXJzID0gW107XG4gICAgdGhpcy4jY2xpZW50ID0gY29uZmlnLmNsaWVudDtcbiAgICB0aGlzLiNjYWNoZSA9IHRoaXMuI2NsaWVudC5nZXRRdWVyeUNhY2hlKCk7XG4gICAgdGhpcy5xdWVyeUtleSA9IGNvbmZpZy5xdWVyeUtleTtcbiAgICB0aGlzLnF1ZXJ5SGFzaCA9IGNvbmZpZy5xdWVyeUhhc2g7XG4gICAgdGhpcy4jaW5pdGlhbFN0YXRlID0gZ2V0RGVmYXVsdFN0YXRlKHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5zdGF0ZSA9IGNvbmZpZy5zdGF0ZSA/PyB0aGlzLiNpbml0aWFsU3RhdGU7XG4gICAgdGhpcy5zY2hlZHVsZUdjKCk7XG4gIH1cbiAgZ2V0IG1ldGEoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tZXRhO1xuICB9XG4gIGdldCBxdWVyeVR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3F1ZXJ5VHlwZTtcbiAgfVxuICBnZXQgcHJvbWlzZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jcmV0cnllcj8ucHJvbWlzZTtcbiAgfVxuICBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSB7IC4uLnRoaXMuI2RlZmF1bHRPcHRpb25zLCAuLi5vcHRpb25zIH07XG4gICAgaWYgKG9wdGlvbnM/Ll90eXBlKSB7XG4gICAgICB0aGlzLiNxdWVyeVR5cGUgPSBvcHRpb25zLl90eXBlO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUdjVGltZSh0aGlzLm9wdGlvbnMuZ2NUaW1lKTtcbiAgICBpZiAodGhpcy5zdGF0ZSAmJiB0aGlzLnN0YXRlLmRhdGEgPT09IHZvaWQgMCkge1xuICAgICAgY29uc3QgZGVmYXVsdFN0YXRlID0gZ2V0RGVmYXVsdFN0YXRlKHRoaXMub3B0aW9ucyk7XG4gICAgICBpZiAoZGVmYXVsdFN0YXRlLmRhdGEgIT09IHZvaWQgMCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFxuICAgICAgICAgIHN1Y2Nlc3NTdGF0ZShkZWZhdWx0U3RhdGUuZGF0YSwgZGVmYXVsdFN0YXRlLmRhdGFVcGRhdGVkQXQpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuI2luaXRpYWxTdGF0ZSA9IGRlZmF1bHRTdGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uYWxSZW1vdmUoKSB7XG4gICAgaWYgKCF0aGlzLm9ic2VydmVycy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5mZXRjaFN0YXR1cyA9PT0gXCJpZGxlXCIpIHtcbiAgICAgIHRoaXMuI2NhY2hlLnJlbW92ZSh0aGlzKTtcbiAgICB9XG4gIH1cbiAgc2V0RGF0YShuZXdEYXRhLCBvcHRpb25zKSB7XG4gICAgY29uc3QgZGF0YSA9IHJlcGxhY2VEYXRhKHRoaXMuc3RhdGUuZGF0YSwgbmV3RGF0YSwgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLiNkaXNwYXRjaCh7XG4gICAgICBkYXRhLFxuICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICBkYXRhVXBkYXRlZEF0OiBvcHRpb25zPy51cGRhdGVkQXQsXG4gICAgICBtYW51YWw6IG9wdGlvbnM/Lm1hbnVhbFxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG4gIHNldFN0YXRlKHN0YXRlKSB7XG4gICAgdGhpcy4jZGlzcGF0Y2goeyB0eXBlOiBcInNldFN0YXRlXCIsIHN0YXRlIH0pO1xuICB9XG4gIGNhbmNlbChvcHRpb25zKSB7XG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuI3JldHJ5ZXI/LnByb21pc2U7XG4gICAgdGhpcy4jcmV0cnllcj8uY2FuY2VsKG9wdGlvbnMpO1xuICAgIHJldHVybiBwcm9taXNlID8gcHJvbWlzZS50aGVuKG5vb3ApLmNhdGNoKG5vb3ApIDogUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgZGVzdHJveSgpIHtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgdGhpcy5jYW5jZWwoeyBzaWxlbnQ6IHRydWUgfSk7XG4gIH1cbiAgZ2V0IHJlc2V0U3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2luaXRpYWxTdGF0ZTtcbiAgfVxuICByZXNldCgpIHtcbiAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICB0aGlzLnNldFN0YXRlKHRoaXMucmVzZXRTdGF0ZSk7XG4gIH1cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMub2JzZXJ2ZXJzLnNvbWUoXG4gICAgICAob2JzZXJ2ZXIpID0+IHJlc29sdmVRdWVyeUJvb2xlYW4ob2JzZXJ2ZXIub3B0aW9ucy5lbmFibGVkLCB0aGlzKSAhPT0gZmFsc2VcbiAgICApO1xuICB9XG4gIGlzRGlzYWJsZWQoKSB7XG4gICAgaWYgKHRoaXMuZ2V0T2JzZXJ2ZXJzQ291bnQoKSA+IDApIHtcbiAgICAgIHJldHVybiAhdGhpcy5pc0FjdGl2ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnF1ZXJ5Rm4gPT09IHNraXBUb2tlbiB8fCAhdGhpcy5pc0ZldGNoZWQoKTtcbiAgfVxuICBpc0ZldGNoZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUuZGF0YVVwZGF0ZUNvdW50ICsgdGhpcy5zdGF0ZS5lcnJvclVwZGF0ZUNvdW50ID4gMDtcbiAgfVxuICBpc1N0YXRpYygpIHtcbiAgICBpZiAodGhpcy5nZXRPYnNlcnZlcnNDb3VudCgpID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZXJzLnNvbWUoXG4gICAgICAgIChvYnNlcnZlcikgPT4gcmVzb2x2ZVN0YWxlVGltZShvYnNlcnZlci5vcHRpb25zLnN0YWxlVGltZSwgdGhpcykgPT09IFwic3RhdGljXCJcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpc1N0YWxlKCkge1xuICAgIGlmICh0aGlzLmdldE9ic2VydmVyc0NvdW50KCkgPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5vYnNlcnZlcnMuc29tZShcbiAgICAgICAgKG9ic2VydmVyKSA9PiBvYnNlcnZlci5nZXRDdXJyZW50UmVzdWx0KCkuaXNTdGFsZVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUuZGF0YSA9PT0gdm9pZCAwIHx8IHRoaXMuc3RhdGUuaXNJbnZhbGlkYXRlZDtcbiAgfVxuICBpc1N0YWxlQnlUaW1lKHN0YWxlVGltZSA9IDApIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5kYXRhID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoc3RhbGVUaW1lID09PSBcInN0YXRpY1wiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlLmlzSW52YWxpZGF0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gIXRpbWVVbnRpbFN0YWxlKHRoaXMuc3RhdGUuZGF0YVVwZGF0ZWRBdCwgc3RhbGVUaW1lKTtcbiAgfVxuICBvbkZvY3VzKCkge1xuICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5vYnNlcnZlcnMuZmluZCgoeCkgPT4geC5zaG91bGRGZXRjaE9uV2luZG93Rm9jdXMoKSk7XG4gICAgb2JzZXJ2ZXI/LnJlZmV0Y2goeyBjYW5jZWxSZWZldGNoOiBmYWxzZSB9KTtcbiAgICB0aGlzLiNyZXRyeWVyPy5jb250aW51ZSgpO1xuICB9XG4gIG9uT25saW5lKCkge1xuICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5vYnNlcnZlcnMuZmluZCgoeCkgPT4geC5zaG91bGRGZXRjaE9uUmVjb25uZWN0KCkpO1xuICAgIG9ic2VydmVyPy5yZWZldGNoKHsgY2FuY2VsUmVmZXRjaDogZmFsc2UgfSk7XG4gICAgdGhpcy4jcmV0cnllcj8uY29udGludWUoKTtcbiAgfVxuICBhZGRPYnNlcnZlcihvYnNlcnZlcikge1xuICAgIGlmICghdGhpcy5vYnNlcnZlcnMuaW5jbHVkZXMob2JzZXJ2ZXIpKSB7XG4gICAgICB0aGlzLm9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbiAgICAgIHRoaXMuY2xlYXJHY1RpbWVvdXQoKTtcbiAgICAgIHRoaXMuI2NhY2hlLm5vdGlmeSh7IHR5cGU6IFwib2JzZXJ2ZXJBZGRlZFwiLCBxdWVyeTogdGhpcywgb2JzZXJ2ZXIgfSk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU9ic2VydmVyKG9ic2VydmVyKSB7XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXJzLmluY2x1ZGVzKG9ic2VydmVyKSkge1xuICAgICAgdGhpcy5vYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVycy5maWx0ZXIoKHgpID0+IHggIT09IG9ic2VydmVyKTtcbiAgICAgIGlmICghdGhpcy5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLiNyZXRyeWVyKSB7XG4gICAgICAgICAgaWYgKHRoaXMuI2Fib3J0U2lnbmFsQ29uc3VtZWQgfHwgdGhpcy4jaXNJbml0aWFsUGF1c2VkRmV0Y2goKSkge1xuICAgICAgICAgICAgdGhpcy4jcmV0cnllci5jYW5jZWwoeyByZXZlcnQ6IHRydWUgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuI3JldHJ5ZXIuY2FuY2VsUmV0cnkoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlZHVsZUdjKCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNjYWNoZS5ub3RpZnkoeyB0eXBlOiBcIm9ic2VydmVyUmVtb3ZlZFwiLCBxdWVyeTogdGhpcywgb2JzZXJ2ZXIgfSk7XG4gICAgfVxuICB9XG4gIGdldE9ic2VydmVyc0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLm9ic2VydmVycy5sZW5ndGg7XG4gIH1cbiAgI2lzSW5pdGlhbFBhdXNlZEZldGNoKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLmZldGNoU3RhdHVzID09PSBcInBhdXNlZFwiICYmIHRoaXMuc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIjtcbiAgfVxuICBpbnZhbGlkYXRlKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc0ludmFsaWRhdGVkKSB7XG4gICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwiaW52YWxpZGF0ZVwiIH0pO1xuICAgIH1cbiAgfVxuICBhc3luYyBmZXRjaChvcHRpb25zLCBmZXRjaE9wdGlvbnMpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5mZXRjaFN0YXR1cyAhPT0gXCJpZGxlXCIgJiYgLy8gSWYgdGhlIHByb21pc2UgaW4gdGhlIHJldHJ5ZXIgaXMgYWxyZWFkeSByZWplY3RlZCwgd2UgaGF2ZSB0byBkZWZpbml0ZWx5XG4gICAgLy8gcmUtc3RhcnQgdGhlIGZldGNoOyB0aGVyZSBpcyBhIGNoYW5jZSB0aGF0IHRoZSBxdWVyeSBpcyBzdGlsbCBpbiBhXG4gICAgLy8gcGVuZGluZyBzdGF0ZSB3aGVuIHRoYXQgaGFwcGVuc1xuICAgIHRoaXMuI3JldHJ5ZXI/LnN0YXR1cygpICE9PSBcInJlamVjdGVkXCIpIHtcbiAgICAgIGlmICh0aGlzLnN0YXRlLmRhdGEgIT09IHZvaWQgMCAmJiBmZXRjaE9wdGlvbnM/LmNhbmNlbFJlZmV0Y2gpIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoeyBzaWxlbnQ6IHRydWUgfSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuI3JldHJ5ZXIpIHtcbiAgICAgICAgdGhpcy4jcmV0cnllci5jb250aW51ZVJldHJ5KCk7XG4gICAgICAgIHJldHVybiB0aGlzLiNyZXRyeWVyLnByb21pc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnF1ZXJ5Rm4pIHtcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5vYnNlcnZlcnMuZmluZCgoeCkgPT4geC5vcHRpb25zLnF1ZXJ5Rm4pO1xuICAgICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhvYnNlcnZlci5vcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRoaXMub3B0aW9ucy5xdWVyeUtleSkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgQXMgb2YgdjQsIHF1ZXJ5S2V5IG5lZWRzIHRvIGJlIGFuIEFycmF5LiBJZiB5b3UgYXJlIHVzaW5nIGEgc3RyaW5nIGxpa2UgJ3JlcG9EYXRhJywgcGxlYXNlIGNoYW5nZSBpdCB0byBhbiBBcnJheSwgZS5nLiBbJ3JlcG9EYXRhJ11gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCBhZGRTaWduYWxQcm9wZXJ0eSA9IChvYmplY3QpID0+IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIFwic2lnbmFsXCIsIHtcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy4jYWJvcnRTaWduYWxDb25zdW1lZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGFib3J0Q29udHJvbGxlci5zaWduYWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgZmV0Y2hGbiA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5Rm4gPSBlbnN1cmVRdWVyeUZuKHRoaXMub3B0aW9ucywgZmV0Y2hPcHRpb25zKTtcbiAgICAgIGNvbnN0IGNyZWF0ZVF1ZXJ5Rm5Db250ZXh0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBxdWVyeUZuQ29udGV4dDIgPSB7XG4gICAgICAgICAgY2xpZW50OiB0aGlzLiNjbGllbnQsXG4gICAgICAgICAgcXVlcnlLZXk6IHRoaXMucXVlcnlLZXksXG4gICAgICAgICAgbWV0YTogdGhpcy5tZXRhXG4gICAgICAgIH07XG4gICAgICAgIGFkZFNpZ25hbFByb3BlcnR5KHF1ZXJ5Rm5Db250ZXh0Mik7XG4gICAgICAgIHJldHVybiBxdWVyeUZuQ29udGV4dDI7XG4gICAgICB9O1xuICAgICAgY29uc3QgcXVlcnlGbkNvbnRleHQgPSBjcmVhdGVRdWVyeUZuQ29udGV4dCgpO1xuICAgICAgdGhpcy4jYWJvcnRTaWduYWxDb25zdW1lZCA9IGZhbHNlO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZXJzaXN0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wZXJzaXN0ZXIoXG4gICAgICAgICAgcXVlcnlGbixcbiAgICAgICAgICBxdWVyeUZuQ29udGV4dCxcbiAgICAgICAgICB0aGlzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcXVlcnlGbihxdWVyeUZuQ29udGV4dCk7XG4gICAgfTtcbiAgICBjb25zdCBjcmVhdGVGZXRjaENvbnRleHQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0MiA9IHtcbiAgICAgICAgZmV0Y2hPcHRpb25zLFxuICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgIHF1ZXJ5S2V5OiB0aGlzLnF1ZXJ5S2V5LFxuICAgICAgICBjbGllbnQ6IHRoaXMuI2NsaWVudCxcbiAgICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXG4gICAgICAgIGZldGNoRm5cbiAgICAgIH07XG4gICAgICBhZGRTaWduYWxQcm9wZXJ0eShjb250ZXh0Mik7XG4gICAgICByZXR1cm4gY29udGV4dDI7XG4gICAgfTtcbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlRmV0Y2hDb250ZXh0KCk7XG4gICAgY29uc3QgYmVoYXZpb3IgPSB0aGlzLiNxdWVyeVR5cGUgPT09IFwiaW5maW5pdGVcIiA/IGluZmluaXRlUXVlcnlCZWhhdmlvcihcbiAgICAgIHRoaXMub3B0aW9ucy5wYWdlc1xuICAgICkgOiB0aGlzLm9wdGlvbnMuYmVoYXZpb3I7XG4gICAgYmVoYXZpb3I/Lm9uRmV0Y2goY29udGV4dCwgdGhpcyk7XG4gICAgdGhpcy4jcmV2ZXJ0U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmICh0aGlzLnN0YXRlLmZldGNoU3RhdHVzID09PSBcImlkbGVcIiB8fCB0aGlzLnN0YXRlLmZldGNoTWV0YSAhPT0gY29udGV4dC5mZXRjaE9wdGlvbnM/Lm1ldGEpIHtcbiAgICAgIHRoaXMuI2Rpc3BhdGNoKHsgdHlwZTogXCJmZXRjaFwiLCBtZXRhOiBjb250ZXh0LmZldGNoT3B0aW9ucz8ubWV0YSB9KTtcbiAgICB9XG4gICAgdGhpcy4jcmV0cnllciA9IGNyZWF0ZVJldHJ5ZXIoe1xuICAgICAgaW5pdGlhbFByb21pc2U6IGZldGNoT3B0aW9ucz8uaW5pdGlhbFByb21pc2UsXG4gICAgICBmbjogY29udGV4dC5mZXRjaEZuLFxuICAgICAgb25DYW5jZWw6IChlcnJvcikgPT4ge1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBDYW5jZWxsZWRFcnJvciAmJiBlcnJvci5yZXZlcnQpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIC4uLnRoaXMuI3JldmVydFN0YXRlLFxuICAgICAgICAgICAgZmV0Y2hTdGF0dXM6IFwiaWRsZVwiXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICB9LFxuICAgICAgb25GYWlsOiAoZmFpbHVyZUNvdW50LCBlcnJvcikgPT4ge1xuICAgICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwiZmFpbGVkXCIsIGZhaWx1cmVDb3VudCwgZXJyb3IgfSk7XG4gICAgICB9LFxuICAgICAgb25QYXVzZTogKCkgPT4ge1xuICAgICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwicGF1c2VcIiB9KTtcbiAgICAgIH0sXG4gICAgICBvbkNvbnRpbnVlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuI2Rpc3BhdGNoKHsgdHlwZTogXCJjb250aW51ZVwiIH0pO1xuICAgICAgfSxcbiAgICAgIHJldHJ5OiBjb250ZXh0Lm9wdGlvbnMucmV0cnksXG4gICAgICByZXRyeURlbGF5OiBjb250ZXh0Lm9wdGlvbnMucmV0cnlEZWxheSxcbiAgICAgIG5ldHdvcmtNb2RlOiBjb250ZXh0Lm9wdGlvbnMubmV0d29ya01vZGUsXG4gICAgICBjYW5SdW46ICgpID0+IHRydWVcbiAgICB9KTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI3JldHJ5ZXIuc3RhcnQoKTtcbiAgICAgIGlmIChkYXRhID09PSB2b2lkIDApIHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBgUXVlcnkgZGF0YSBjYW5ub3QgYmUgdW5kZWZpbmVkLiBQbGVhc2UgbWFrZSBzdXJlIHRvIHJldHVybiBhIHZhbHVlIG90aGVyIHRoYW4gdW5kZWZpbmVkIGZyb20geW91ciBxdWVyeSBmdW5jdGlvbi4gQWZmZWN0ZWQgcXVlcnkga2V5OiAke3RoaXMucXVlcnlIYXNofWBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLnF1ZXJ5SGFzaH0gZGF0YSBpcyB1bmRlZmluZWRgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0RGF0YShkYXRhKTtcbiAgICAgIHRoaXMuI2NhY2hlLmNvbmZpZy5vblN1Y2Nlc3M/LihkYXRhLCB0aGlzKTtcbiAgICAgIHRoaXMuI2NhY2hlLmNvbmZpZy5vblNldHRsZWQ/LihcbiAgICAgICAgZGF0YSxcbiAgICAgICAgdGhpcy5zdGF0ZS5lcnJvcixcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBDYW5jZWxsZWRFcnJvcikge1xuICAgICAgICBpZiAoZXJyb3Iuc2lsZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuI3JldHJ5ZXIucHJvbWlzZTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5yZXZlcnQpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5kYXRhID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5kYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLiNkaXNwYXRjaCh7XG4gICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgZXJyb3JcbiAgICAgIH0pO1xuICAgICAgdGhpcy4jY2FjaGUuY29uZmlnLm9uRXJyb3I/LihcbiAgICAgICAgZXJyb3IsXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG4gICAgICB0aGlzLiNjYWNoZS5jb25maWcub25TZXR0bGVkPy4oXG4gICAgICAgIHRoaXMuc3RhdGUuZGF0YSxcbiAgICAgICAgZXJyb3IsXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5zY2hlZHVsZUdjKCk7XG4gICAgfVxuICB9XG4gICNkaXNwYXRjaChhY3Rpb24pIHtcbiAgICBjb25zdCByZWR1Y2VyID0gKHN0YXRlKSA9PiB7XG4gICAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJmYWlsZWRcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBmZXRjaEZhaWx1cmVDb3VudDogYWN0aW9uLmZhaWx1cmVDb3VudCxcbiAgICAgICAgICAgIGZldGNoRmFpbHVyZVJlYXNvbjogYWN0aW9uLmVycm9yXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcInBhdXNlXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgZmV0Y2hTdGF0dXM6IFwicGF1c2VkXCJcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBmZXRjaFN0YXR1czogXCJmZXRjaGluZ1wiXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcImZldGNoXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgLi4uZmV0Y2hTdGF0ZShzdGF0ZS5kYXRhLCB0aGlzLm9wdGlvbnMpLFxuICAgICAgICAgICAgZmV0Y2hNZXRhOiBhY3Rpb24ubWV0YSA/PyBudWxsXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcInN1Y2Nlc3NcIjpcbiAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgLi4uc3VjY2Vzc1N0YXRlKGFjdGlvbi5kYXRhLCBhY3Rpb24uZGF0YVVwZGF0ZWRBdCksXG4gICAgICAgICAgICBkYXRhVXBkYXRlQ291bnQ6IHN0YXRlLmRhdGFVcGRhdGVDb3VudCArIDEsXG4gICAgICAgICAgICAuLi4hYWN0aW9uLm1hbnVhbCAmJiB7XG4gICAgICAgICAgICAgIGZldGNoU3RhdHVzOiBcImlkbGVcIixcbiAgICAgICAgICAgICAgZmV0Y2hGYWlsdXJlQ291bnQ6IDAsXG4gICAgICAgICAgICAgIGZldGNoRmFpbHVyZVJlYXNvbjogbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy4jcmV2ZXJ0U3RhdGUgPSBhY3Rpb24ubWFudWFsID8gbmV3U3RhdGUgOiB2b2lkIDA7XG4gICAgICAgICAgcmV0dXJuIG5ld1N0YXRlO1xuICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICBjb25zdCBlcnJvciA9IGFjdGlvbi5lcnJvcjtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBlcnJvcixcbiAgICAgICAgICAgIGVycm9yVXBkYXRlQ291bnQ6IHN0YXRlLmVycm9yVXBkYXRlQ291bnQgKyAxLFxuICAgICAgICAgICAgZXJyb3JVcGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgICAgICAgICBmZXRjaEZhaWx1cmVDb3VudDogc3RhdGUuZmV0Y2hGYWlsdXJlQ291bnQgKyAxLFxuICAgICAgICAgICAgZmV0Y2hGYWlsdXJlUmVhc29uOiBlcnJvcixcbiAgICAgICAgICAgIGZldGNoU3RhdHVzOiBcImlkbGVcIixcbiAgICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgICAgLy8gZmxhZyBleGlzdGluZyBkYXRhIGFzIGludmFsaWRhdGVkIGlmIHdlIGdldCBhIGJhY2tncm91bmQgZXJyb3JcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCBcIm5vIGRhdGFcIiBhbHdheXMgbWVhbnMgc3RhbGUgc28gd2UgY2FuIHNldCB1bmNvbmRpdGlvbmFsbHkgaGVyZVxuICAgICAgICAgICAgaXNJbnZhbGlkYXRlZDogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgXCJpbnZhbGlkYXRlXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgaXNJbnZhbGlkYXRlZDogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgXCJzZXRTdGF0ZVwiOlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICAgIC4uLmFjdGlvbi5zdGF0ZVxuICAgICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnN0YXRlID0gcmVkdWNlcih0aGlzLnN0YXRlKTtcbiAgICBub3RpZnlNYW5hZ2VyLmJhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMub2JzZXJ2ZXJzLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLm9uUXVlcnlVcGRhdGUoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy4jY2FjaGUubm90aWZ5KHsgcXVlcnk6IHRoaXMsIHR5cGU6IFwidXBkYXRlZFwiLCBhY3Rpb24gfSk7XG4gICAgfSk7XG4gIH1cbn07XG5mdW5jdGlvbiBmZXRjaFN0YXRlKGRhdGEsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHtcbiAgICBmZXRjaEZhaWx1cmVDb3VudDogMCxcbiAgICBmZXRjaEZhaWx1cmVSZWFzb246IG51bGwsXG4gICAgZmV0Y2hTdGF0dXM6IGNhbkZldGNoKG9wdGlvbnMubmV0d29ya01vZGUpID8gXCJmZXRjaGluZ1wiIDogXCJwYXVzZWRcIixcbiAgICAuLi5kYXRhID09PSB2b2lkIDAgJiYge1xuICAgICAgZXJyb3I6IG51bGwsXG4gICAgICBzdGF0dXM6IFwicGVuZGluZ1wiXG4gICAgfVxuICB9O1xufVxuZnVuY3Rpb24gc3VjY2Vzc1N0YXRlKGRhdGEsIGRhdGFVcGRhdGVkQXQpIHtcbiAgcmV0dXJuIHtcbiAgICBkYXRhLFxuICAgIGRhdGFVcGRhdGVkQXQ6IGRhdGFVcGRhdGVkQXQgPz8gRGF0ZS5ub3coKSxcbiAgICBlcnJvcjogbnVsbCxcbiAgICBpc0ludmFsaWRhdGVkOiBmYWxzZSxcbiAgICBzdGF0dXM6IFwic3VjY2Vzc1wiXG4gIH07XG59XG5mdW5jdGlvbiBnZXREZWZhdWx0U3RhdGUob3B0aW9ucykge1xuICBjb25zdCBkYXRhID0gdHlwZW9mIG9wdGlvbnMuaW5pdGlhbERhdGEgPT09IFwiZnVuY3Rpb25cIiA/IG9wdGlvbnMuaW5pdGlhbERhdGEoKSA6IG9wdGlvbnMuaW5pdGlhbERhdGE7XG4gIGNvbnN0IGhhc0RhdGEgPSBkYXRhICE9PSB2b2lkIDA7XG4gIGNvbnN0IGluaXRpYWxEYXRhVXBkYXRlZEF0ID0gaGFzRGF0YSA/IHR5cGVvZiBvcHRpb25zLmluaXRpYWxEYXRhVXBkYXRlZEF0ID09PSBcImZ1bmN0aW9uXCIgPyBvcHRpb25zLmluaXRpYWxEYXRhVXBkYXRlZEF0KCkgOiBvcHRpb25zLmluaXRpYWxEYXRhVXBkYXRlZEF0IDogMDtcbiAgcmV0dXJuIHtcbiAgICBkYXRhLFxuICAgIGRhdGFVcGRhdGVDb3VudDogMCxcbiAgICBkYXRhVXBkYXRlZEF0OiBoYXNEYXRhID8gaW5pdGlhbERhdGFVcGRhdGVkQXQgPz8gRGF0ZS5ub3coKSA6IDAsXG4gICAgZXJyb3I6IG51bGwsXG4gICAgZXJyb3JVcGRhdGVDb3VudDogMCxcbiAgICBlcnJvclVwZGF0ZWRBdDogMCxcbiAgICBmZXRjaEZhaWx1cmVDb3VudDogMCxcbiAgICBmZXRjaEZhaWx1cmVSZWFzb246IG51bGwsXG4gICAgZmV0Y2hNZXRhOiBudWxsLFxuICAgIGlzSW52YWxpZGF0ZWQ6IGZhbHNlLFxuICAgIHN0YXR1czogaGFzRGF0YSA/IFwic3VjY2Vzc1wiIDogXCJwZW5kaW5nXCIsXG4gICAgZmV0Y2hTdGF0dXM6IFwiaWRsZVwiXG4gIH07XG59XG5leHBvcnQge1xuICBRdWVyeSxcbiAgZmV0Y2hTdGF0ZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5LmpzLm1hcCIsIi8vIHNyYy9xdWVyeU9ic2VydmVyLnRzXG5pbXBvcnQgeyBmb2N1c01hbmFnZXIgfSBmcm9tIFwiLi9mb2N1c01hbmFnZXIuanNcIjtcbmltcG9ydCB7IGVudmlyb25tZW50TWFuYWdlciB9IGZyb20gXCIuL2Vudmlyb25tZW50TWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgbm90aWZ5TWFuYWdlciB9IGZyb20gXCIuL25vdGlmeU1hbmFnZXIuanNcIjtcbmltcG9ydCB7IGZldGNoU3RhdGUgfSBmcm9tIFwiLi9xdWVyeS5qc1wiO1xuaW1wb3J0IHsgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4vc3Vic2NyaWJhYmxlLmpzXCI7XG5pbXBvcnQgeyBwZW5kaW5nVGhlbmFibGUgfSBmcm9tIFwiLi90aGVuYWJsZS5qc1wiO1xuaW1wb3J0IHtcbiAgaXNWYWxpZFRpbWVvdXQsXG4gIG5vb3AsXG4gIHJlcGxhY2VEYXRhLFxuICByZXNvbHZlUXVlcnlCb29sZWFuLFxuICByZXNvbHZlU3RhbGVUaW1lLFxuICBzaGFsbG93RXF1YWxPYmplY3RzLFxuICB0aW1lVW50aWxTdGFsZVxufSBmcm9tIFwiLi91dGlscy5qc1wiO1xuaW1wb3J0IHsgdGltZW91dE1hbmFnZXIgfSBmcm9tIFwiLi90aW1lb3V0TWFuYWdlci5qc1wiO1xudmFyIFF1ZXJ5T2JzZXJ2ZXIgPSBjbGFzcyBleHRlbmRzIFN1YnNjcmliYWJsZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgb3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLiNjbGllbnQgPSBjbGllbnQ7XG4gICAgdGhpcy4jc2VsZWN0RXJyb3IgPSBudWxsO1xuICAgIHRoaXMuI2N1cnJlbnRUaGVuYWJsZSA9IHBlbmRpbmdUaGVuYWJsZSgpO1xuICAgIHRoaXMuYmluZE1ldGhvZHMoKTtcbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gIH1cbiAgI2NsaWVudDtcbiAgI2N1cnJlbnRRdWVyeSA9IHZvaWQgMDtcbiAgI2N1cnJlbnRRdWVyeUluaXRpYWxTdGF0ZSA9IHZvaWQgMDtcbiAgI2N1cnJlbnRSZXN1bHQgPSB2b2lkIDA7XG4gICNjdXJyZW50UmVzdWx0U3RhdGU7XG4gICNjdXJyZW50UmVzdWx0T3B0aW9ucztcbiAgI2N1cnJlbnRUaGVuYWJsZTtcbiAgI3NlbGVjdEVycm9yO1xuICAjc2VsZWN0Rm47XG4gICNzZWxlY3RSZXN1bHQ7XG4gIC8vIFRoaXMgcHJvcGVydHkga2VlcHMgdHJhY2sgb2YgdGhlIGxhc3QgcXVlcnkgd2l0aCBkZWZpbmVkIGRhdGEuXG4gIC8vIEl0IHdpbGwgYmUgdXNlZCB0byBwYXNzIHRoZSBwcmV2aW91cyBkYXRhIGFuZCBxdWVyeSB0byB0aGUgcGxhY2Vob2xkZXIgZnVuY3Rpb24gYmV0d2VlbiByZW5kZXJzLlxuICAjbGFzdFF1ZXJ5V2l0aERlZmluZWREYXRhO1xuICAjc3RhbGVUaW1lb3V0SWQ7XG4gICNyZWZldGNoSW50ZXJ2YWxJZDtcbiAgI2N1cnJlbnRSZWZldGNoSW50ZXJ2YWw7XG4gICN0cmFja2VkUHJvcHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuICBiaW5kTWV0aG9kcygpIHtcbiAgICB0aGlzLnJlZmV0Y2ggPSB0aGlzLnJlZmV0Y2guYmluZCh0aGlzKTtcbiAgfVxuICBvblN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnMuc2l6ZSA9PT0gMSkge1xuICAgICAgdGhpcy4jY3VycmVudFF1ZXJ5LmFkZE9ic2VydmVyKHRoaXMpO1xuICAgICAgaWYgKHNob3VsZEZldGNoT25Nb3VudCh0aGlzLiNjdXJyZW50UXVlcnksIHRoaXMub3B0aW9ucykpIHtcbiAgICAgICAgdGhpcy4jZXhlY3V0ZUZldGNoKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwZGF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgICAgdGhpcy4jdXBkYXRlVGltZXJzKCk7XG4gICAgfVxuICB9XG4gIG9uVW5zdWJzY3JpYmUoKSB7XG4gICAgaWYgKCF0aGlzLmhhc0xpc3RlbmVycygpKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbiAgc2hvdWxkRmV0Y2hPblJlY29ubmVjdCgpIHtcbiAgICByZXR1cm4gc2hvdWxkRmV0Y2hPbihcbiAgICAgIHRoaXMuI2N1cnJlbnRRdWVyeSxcbiAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgIHRoaXMub3B0aW9ucy5yZWZldGNoT25SZWNvbm5lY3RcbiAgICApO1xuICB9XG4gIHNob3VsZEZldGNoT25XaW5kb3dGb2N1cygpIHtcbiAgICByZXR1cm4gc2hvdWxkRmV0Y2hPbihcbiAgICAgIHRoaXMuI2N1cnJlbnRRdWVyeSxcbiAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgIHRoaXMub3B0aW9ucy5yZWZldGNoT25XaW5kb3dGb2N1c1xuICAgICk7XG4gIH1cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gICAgdGhpcy4jY2xlYXJTdGFsZVRpbWVvdXQoKTtcbiAgICB0aGlzLiNjbGVhclJlZmV0Y2hJbnRlcnZhbCgpO1xuICAgIHRoaXMuI2N1cnJlbnRRdWVyeS5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbiAgfVxuICBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBjb25zdCBwcmV2T3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICBjb25zdCBwcmV2UXVlcnkgPSB0aGlzLiNjdXJyZW50UXVlcnk7XG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy4jY2xpZW50LmRlZmF1bHRRdWVyeU9wdGlvbnMob3B0aW9ucyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVkICE9PSB2b2lkIDAgJiYgdHlwZW9mIHRoaXMub3B0aW9ucy5lbmFibGVkICE9PSBcImJvb2xlYW5cIiAmJiB0eXBlb2YgdGhpcy5vcHRpb25zLmVuYWJsZWQgIT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgcmVzb2x2ZVF1ZXJ5Qm9vbGVhbih0aGlzLm9wdGlvbnMuZW5hYmxlZCwgdGhpcy4jY3VycmVudFF1ZXJ5KSAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJFeHBlY3RlZCBlbmFibGVkIHRvIGJlIGEgYm9vbGVhbiBvciBhIGNhbGxiYWNrIHRoYXQgcmV0dXJucyBhIGJvb2xlYW5cIlxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy4jdXBkYXRlUXVlcnkoKTtcbiAgICB0aGlzLiNjdXJyZW50UXVlcnkuc2V0T3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuICAgIGlmIChwcmV2T3B0aW9ucy5fZGVmYXVsdGVkICYmICFzaGFsbG93RXF1YWxPYmplY3RzKHRoaXMub3B0aW9ucywgcHJldk9wdGlvbnMpKSB7XG4gICAgICB0aGlzLiNjbGllbnQuZ2V0UXVlcnlDYWNoZSgpLm5vdGlmeSh7XG4gICAgICAgIHR5cGU6IFwib2JzZXJ2ZXJPcHRpb25zVXBkYXRlZFwiLFxuICAgICAgICBxdWVyeTogdGhpcy4jY3VycmVudFF1ZXJ5LFxuICAgICAgICBvYnNlcnZlcjogdGhpc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IG1vdW50ZWQgPSB0aGlzLmhhc0xpc3RlbmVycygpO1xuICAgIGlmIChtb3VudGVkICYmIHNob3VsZEZldGNoT3B0aW9uYWxseShcbiAgICAgIHRoaXMuI2N1cnJlbnRRdWVyeSxcbiAgICAgIHByZXZRdWVyeSxcbiAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgIHByZXZPcHRpb25zXG4gICAgKSkge1xuICAgICAgdGhpcy4jZXhlY3V0ZUZldGNoKCk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlUmVzdWx0KCk7XG4gICAgaWYgKG1vdW50ZWQgJiYgKHRoaXMuI2N1cnJlbnRRdWVyeSAhPT0gcHJldlF1ZXJ5IHx8IHJlc29sdmVRdWVyeUJvb2xlYW4odGhpcy5vcHRpb25zLmVuYWJsZWQsIHRoaXMuI2N1cnJlbnRRdWVyeSkgIT09IHJlc29sdmVRdWVyeUJvb2xlYW4ocHJldk9wdGlvbnMuZW5hYmxlZCwgdGhpcy4jY3VycmVudFF1ZXJ5KSB8fCByZXNvbHZlU3RhbGVUaW1lKHRoaXMub3B0aW9ucy5zdGFsZVRpbWUsIHRoaXMuI2N1cnJlbnRRdWVyeSkgIT09IHJlc29sdmVTdGFsZVRpbWUocHJldk9wdGlvbnMuc3RhbGVUaW1lLCB0aGlzLiNjdXJyZW50UXVlcnkpKSkge1xuICAgICAgdGhpcy4jdXBkYXRlU3RhbGVUaW1lb3V0KCk7XG4gICAgfVxuICAgIGNvbnN0IG5leHRSZWZldGNoSW50ZXJ2YWwgPSB0aGlzLiNjb21wdXRlUmVmZXRjaEludGVydmFsKCk7XG4gICAgaWYgKG1vdW50ZWQgJiYgKHRoaXMuI2N1cnJlbnRRdWVyeSAhPT0gcHJldlF1ZXJ5IHx8IHJlc29sdmVRdWVyeUJvb2xlYW4odGhpcy5vcHRpb25zLmVuYWJsZWQsIHRoaXMuI2N1cnJlbnRRdWVyeSkgIT09IHJlc29sdmVRdWVyeUJvb2xlYW4ocHJldk9wdGlvbnMuZW5hYmxlZCwgdGhpcy4jY3VycmVudFF1ZXJ5KSB8fCBuZXh0UmVmZXRjaEludGVydmFsICE9PSB0aGlzLiNjdXJyZW50UmVmZXRjaEludGVydmFsKSkge1xuICAgICAgdGhpcy4jdXBkYXRlUmVmZXRjaEludGVydmFsKG5leHRSZWZldGNoSW50ZXJ2YWwpO1xuICAgIH1cbiAgfVxuICBnZXRPcHRpbWlzdGljUmVzdWx0KG9wdGlvbnMpIHtcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuI2NsaWVudC5nZXRRdWVyeUNhY2hlKCkuYnVpbGQodGhpcy4jY2xpZW50LCBvcHRpb25zKTtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmNyZWF0ZVJlc3VsdChxdWVyeSwgb3B0aW9ucyk7XG4gICAgaWYgKHNob3VsZEFzc2lnbk9ic2VydmVyQ3VycmVudFByb3BlcnRpZXModGhpcywgcmVzdWx0KSkge1xuICAgICAgdGhpcy4jY3VycmVudFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIHRoaXMuI2N1cnJlbnRSZXN1bHRPcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgdGhpcy4jY3VycmVudFJlc3VsdFN0YXRlID0gdGhpcy4jY3VycmVudFF1ZXJ5LnN0YXRlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGdldEN1cnJlbnRSZXN1bHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRSZXN1bHQ7XG4gIH1cbiAgdHJhY2tSZXN1bHQocmVzdWx0LCBvblByb3BUcmFja2VkKSB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShyZXN1bHQsIHtcbiAgICAgIGdldDogKHRhcmdldCwga2V5KSA9PiB7XG4gICAgICAgIHRoaXMudHJhY2tQcm9wKGtleSk7XG4gICAgICAgIG9uUHJvcFRyYWNrZWQ/LihrZXkpO1xuICAgICAgICBpZiAoa2V5ID09PSBcInByb21pc2VcIikge1xuICAgICAgICAgIHRoaXMudHJhY2tQcm9wKFwiZGF0YVwiKTtcbiAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5leHBlcmltZW50YWxfcHJlZmV0Y2hJblJlbmRlciAmJiB0aGlzLiNjdXJyZW50VGhlbmFibGUuc3RhdHVzID09PSBcInBlbmRpbmdcIikge1xuICAgICAgICAgICAgdGhpcy4jY3VycmVudFRoZW5hYmxlLnJlamVjdChcbiAgICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiZXhwZXJpbWVudGFsX3ByZWZldGNoSW5SZW5kZXIgZmVhdHVyZSBmbGFnIGlzIG5vdCBlbmFibGVkXCJcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwga2V5KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICB0cmFja1Byb3Aoa2V5KSB7XG4gICAgdGhpcy4jdHJhY2tlZFByb3BzLmFkZChrZXkpO1xuICB9XG4gIGdldEN1cnJlbnRRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3VycmVudFF1ZXJ5O1xuICB9XG4gIHJlZmV0Y2goeyAuLi5vcHRpb25zIH0gPSB7fSkge1xuICAgIHJldHVybiB0aGlzLmZldGNoKHtcbiAgICAgIC4uLm9wdGlvbnNcbiAgICB9KTtcbiAgfVxuICBmZXRjaE9wdGltaXN0aWMob3B0aW9ucykge1xuICAgIGNvbnN0IGRlZmF1bHRlZE9wdGlvbnMgPSB0aGlzLiNjbGllbnQuZGVmYXVsdFF1ZXJ5T3B0aW9ucyhvcHRpb25zKTtcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuI2NsaWVudC5nZXRRdWVyeUNhY2hlKCkuYnVpbGQodGhpcy4jY2xpZW50LCBkZWZhdWx0ZWRPcHRpb25zKTtcbiAgICByZXR1cm4gcXVlcnkuZmV0Y2goKS50aGVuKCgpID0+IHRoaXMuY3JlYXRlUmVzdWx0KHF1ZXJ5LCBkZWZhdWx0ZWRPcHRpb25zKSk7XG4gIH1cbiAgZmV0Y2goZmV0Y2hPcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuI2V4ZWN1dGVGZXRjaCh7XG4gICAgICAuLi5mZXRjaE9wdGlvbnMsXG4gICAgICBjYW5jZWxSZWZldGNoOiBmZXRjaE9wdGlvbnMuY2FuY2VsUmVmZXRjaCA/PyB0cnVlXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZVJlc3VsdCgpO1xuICAgICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRSZXN1bHQ7XG4gICAgfSk7XG4gIH1cbiAgI2V4ZWN1dGVGZXRjaChmZXRjaE9wdGlvbnMpIHtcbiAgICB0aGlzLiN1cGRhdGVRdWVyeSgpO1xuICAgIGxldCBwcm9taXNlID0gdGhpcy4jY3VycmVudFF1ZXJ5LmZldGNoKFxuICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgZmV0Y2hPcHRpb25zXG4gICAgKTtcbiAgICBpZiAoIWZldGNoT3B0aW9ucz8udGhyb3dPbkVycm9yKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZS5jYXRjaChub29wKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgI3VwZGF0ZVN0YWxlVGltZW91dCgpIHtcbiAgICB0aGlzLiNjbGVhclN0YWxlVGltZW91dCgpO1xuICAgIGNvbnN0IHN0YWxlVGltZSA9IHJlc29sdmVTdGFsZVRpbWUoXG4gICAgICB0aGlzLm9wdGlvbnMuc3RhbGVUaW1lLFxuICAgICAgdGhpcy4jY3VycmVudFF1ZXJ5XG4gICAgKTtcbiAgICBpZiAoZW52aXJvbm1lbnRNYW5hZ2VyLmlzU2VydmVyKCkgfHwgdGhpcy4jY3VycmVudFJlc3VsdC5pc1N0YWxlIHx8ICFpc1ZhbGlkVGltZW91dChzdGFsZVRpbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRpbWUgPSB0aW1lVW50aWxTdGFsZSh0aGlzLiNjdXJyZW50UmVzdWx0LmRhdGFVcGRhdGVkQXQsIHN0YWxlVGltZSk7XG4gICAgY29uc3QgdGltZW91dCA9IHRpbWUgKyAxO1xuICAgIHRoaXMuI3N0YWxlVGltZW91dElkID0gdGltZW91dE1hbmFnZXIuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuI2N1cnJlbnRSZXN1bHQuaXNTdGFsZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgIH0sIHRpbWVvdXQpO1xuICB9XG4gICNjb21wdXRlUmVmZXRjaEludGVydmFsKCkge1xuICAgIHJldHVybiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWZldGNoSW50ZXJ2YWwgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMub3B0aW9ucy5yZWZldGNoSW50ZXJ2YWwodGhpcy4jY3VycmVudFF1ZXJ5KSA6IHRoaXMub3B0aW9ucy5yZWZldGNoSW50ZXJ2YWwpID8/IGZhbHNlO1xuICB9XG4gICN1cGRhdGVSZWZldGNoSW50ZXJ2YWwobmV4dEludGVydmFsKSB7XG4gICAgdGhpcy4jY2xlYXJSZWZldGNoSW50ZXJ2YWwoKTtcbiAgICB0aGlzLiNjdXJyZW50UmVmZXRjaEludGVydmFsID0gbmV4dEludGVydmFsO1xuICAgIGlmIChlbnZpcm9ubWVudE1hbmFnZXIuaXNTZXJ2ZXIoKSB8fCByZXNvbHZlUXVlcnlCb29sZWFuKHRoaXMub3B0aW9ucy5lbmFibGVkLCB0aGlzLiNjdXJyZW50UXVlcnkpID09PSBmYWxzZSB8fCAhaXNWYWxpZFRpbWVvdXQodGhpcy4jY3VycmVudFJlZmV0Y2hJbnRlcnZhbCkgfHwgdGhpcy4jY3VycmVudFJlZmV0Y2hJbnRlcnZhbCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLiNyZWZldGNoSW50ZXJ2YWxJZCA9IHRpbWVvdXRNYW5hZ2VyLnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVmZXRjaEludGVydmFsSW5CYWNrZ3JvdW5kIHx8IGZvY3VzTWFuYWdlci5pc0ZvY3VzZWQoKSkge1xuICAgICAgICB0aGlzLiNleGVjdXRlRmV0Y2goKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzLiNjdXJyZW50UmVmZXRjaEludGVydmFsKTtcbiAgfVxuICAjdXBkYXRlVGltZXJzKCkge1xuICAgIHRoaXMuI3VwZGF0ZVN0YWxlVGltZW91dCgpO1xuICAgIHRoaXMuI3VwZGF0ZVJlZmV0Y2hJbnRlcnZhbCh0aGlzLiNjb21wdXRlUmVmZXRjaEludGVydmFsKCkpO1xuICB9XG4gICNjbGVhclN0YWxlVGltZW91dCgpIHtcbiAgICBpZiAodGhpcy4jc3RhbGVUaW1lb3V0SWQgIT09IHZvaWQgMCkge1xuICAgICAgdGltZW91dE1hbmFnZXIuY2xlYXJUaW1lb3V0KHRoaXMuI3N0YWxlVGltZW91dElkKTtcbiAgICAgIHRoaXMuI3N0YWxlVGltZW91dElkID0gdm9pZCAwO1xuICAgIH1cbiAgfVxuICAjY2xlYXJSZWZldGNoSW50ZXJ2YWwoKSB7XG4gICAgaWYgKHRoaXMuI3JlZmV0Y2hJbnRlcnZhbElkICE9PSB2b2lkIDApIHtcbiAgICAgIHRpbWVvdXRNYW5hZ2VyLmNsZWFySW50ZXJ2YWwodGhpcy4jcmVmZXRjaEludGVydmFsSWQpO1xuICAgICAgdGhpcy4jcmVmZXRjaEludGVydmFsSWQgPSB2b2lkIDA7XG4gICAgfVxuICB9XG4gIGNyZWF0ZVJlc3VsdChxdWVyeSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHByZXZRdWVyeSA9IHRoaXMuI2N1cnJlbnRRdWVyeTtcbiAgICBjb25zdCBwcmV2T3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICBjb25zdCBwcmV2UmVzdWx0ID0gdGhpcy4jY3VycmVudFJlc3VsdDtcbiAgICBjb25zdCBwcmV2UmVzdWx0U3RhdGUgPSB0aGlzLiNjdXJyZW50UmVzdWx0U3RhdGU7XG4gICAgY29uc3QgcHJldlJlc3VsdE9wdGlvbnMgPSB0aGlzLiNjdXJyZW50UmVzdWx0T3B0aW9ucztcbiAgICBjb25zdCBxdWVyeUNoYW5nZSA9IHF1ZXJ5ICE9PSBwcmV2UXVlcnk7XG4gICAgY29uc3QgcXVlcnlJbml0aWFsU3RhdGUgPSBxdWVyeUNoYW5nZSA/IHF1ZXJ5LnN0YXRlIDogdGhpcy4jY3VycmVudFF1ZXJ5SW5pdGlhbFN0YXRlO1xuICAgIGNvbnN0IHsgc3RhdGUgfSA9IHF1ZXJ5O1xuICAgIGxldCBuZXdTdGF0ZSA9IHsgLi4uc3RhdGUgfTtcbiAgICBsZXQgaXNQbGFjZWhvbGRlckRhdGEgPSBmYWxzZTtcbiAgICBsZXQgZGF0YTtcbiAgICBpZiAob3B0aW9ucy5fb3B0aW1pc3RpY1Jlc3VsdHMpIHtcbiAgICAgIGNvbnN0IG1vdW50ZWQgPSB0aGlzLmhhc0xpc3RlbmVycygpO1xuICAgICAgY29uc3QgZmV0Y2hPbk1vdW50ID0gIW1vdW50ZWQgJiYgc2hvdWxkRmV0Y2hPbk1vdW50KHF1ZXJ5LCBvcHRpb25zKTtcbiAgICAgIGNvbnN0IGZldGNoT3B0aW9uYWxseSA9IG1vdW50ZWQgJiYgc2hvdWxkRmV0Y2hPcHRpb25hbGx5KHF1ZXJ5LCBwcmV2UXVlcnksIG9wdGlvbnMsIHByZXZPcHRpb25zKTtcbiAgICAgIGlmIChmZXRjaE9uTW91bnQgfHwgZmV0Y2hPcHRpb25hbGx5KSB7XG4gICAgICAgIG5ld1N0YXRlID0ge1xuICAgICAgICAgIC4uLm5ld1N0YXRlLFxuICAgICAgICAgIC4uLmZldGNoU3RhdGUoc3RhdGUuZGF0YSwgcXVlcnkub3B0aW9ucylcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLl9vcHRpbWlzdGljUmVzdWx0cyA9PT0gXCJpc1Jlc3RvcmluZ1wiKSB7XG4gICAgICAgIG5ld1N0YXRlLmZldGNoU3RhdHVzID0gXCJpZGxlXCI7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCB7IGVycm9yLCBlcnJvclVwZGF0ZWRBdCwgc3RhdHVzIH0gPSBuZXdTdGF0ZTtcbiAgICBkYXRhID0gbmV3U3RhdGUuZGF0YTtcbiAgICBsZXQgc2tpcFNlbGVjdCA9IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnBsYWNlaG9sZGVyRGF0YSAhPT0gdm9pZCAwICYmIGRhdGEgPT09IHZvaWQgMCAmJiBzdGF0dXMgPT09IFwicGVuZGluZ1wiKSB7XG4gICAgICBsZXQgcGxhY2Vob2xkZXJEYXRhO1xuICAgICAgaWYgKHByZXZSZXN1bHQ/LmlzUGxhY2Vob2xkZXJEYXRhICYmIG9wdGlvbnMucGxhY2Vob2xkZXJEYXRhID09PSBwcmV2UmVzdWx0T3B0aW9ucz8ucGxhY2Vob2xkZXJEYXRhKSB7XG4gICAgICAgIHBsYWNlaG9sZGVyRGF0YSA9IHByZXZSZXN1bHQuZGF0YTtcbiAgICAgICAgc2tpcFNlbGVjdCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGFjZWhvbGRlckRhdGEgPSB0eXBlb2Ygb3B0aW9ucy5wbGFjZWhvbGRlckRhdGEgPT09IFwiZnVuY3Rpb25cIiA/IG9wdGlvbnMucGxhY2Vob2xkZXJEYXRhKFxuICAgICAgICAgIHRoaXMuI2xhc3RRdWVyeVdpdGhEZWZpbmVkRGF0YT8uc3RhdGUuZGF0YSxcbiAgICAgICAgICB0aGlzLiNsYXN0UXVlcnlXaXRoRGVmaW5lZERhdGFcbiAgICAgICAgKSA6IG9wdGlvbnMucGxhY2Vob2xkZXJEYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHBsYWNlaG9sZGVyRGF0YSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHN0YXR1cyA9IFwic3VjY2Vzc1wiO1xuICAgICAgICBkYXRhID0gcmVwbGFjZURhdGEoXG4gICAgICAgICAgcHJldlJlc3VsdD8uZGF0YSxcbiAgICAgICAgICBwbGFjZWhvbGRlckRhdGEsXG4gICAgICAgICAgb3B0aW9uc1xuICAgICAgICApO1xuICAgICAgICBpc1BsYWNlaG9sZGVyRGF0YSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNlbGVjdCAmJiBkYXRhICE9PSB2b2lkIDAgJiYgIXNraXBTZWxlY3QpIHtcbiAgICAgIGlmIChwcmV2UmVzdWx0ICYmIGRhdGEgPT09IHByZXZSZXN1bHRTdGF0ZT8uZGF0YSAmJiBvcHRpb25zLnNlbGVjdCA9PT0gdGhpcy4jc2VsZWN0Rm4pIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuI3NlbGVjdFJlc3VsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy4jc2VsZWN0Rm4gPSBvcHRpb25zLnNlbGVjdDtcbiAgICAgICAgICBkYXRhID0gb3B0aW9ucy5zZWxlY3QoZGF0YSk7XG4gICAgICAgICAgZGF0YSA9IHJlcGxhY2VEYXRhKHByZXZSZXN1bHQ/LmRhdGEsIGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICAgIHRoaXMuI3NlbGVjdFJlc3VsdCA9IGRhdGE7XG4gICAgICAgICAgdGhpcy4jc2VsZWN0RXJyb3IgPSBudWxsO1xuICAgICAgICB9IGNhdGNoIChzZWxlY3RFcnJvcikge1xuICAgICAgICAgIHRoaXMuI3NlbGVjdEVycm9yID0gc2VsZWN0RXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuI3NlbGVjdEVycm9yKSB7XG4gICAgICBlcnJvciA9IHRoaXMuI3NlbGVjdEVycm9yO1xuICAgICAgZGF0YSA9IHRoaXMuI3NlbGVjdFJlc3VsdDtcbiAgICAgIGVycm9yVXBkYXRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHN0YXR1cyA9IFwiZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgaXNGZXRjaGluZyA9IG5ld1N0YXRlLmZldGNoU3RhdHVzID09PSBcImZldGNoaW5nXCI7XG4gICAgY29uc3QgaXNQZW5kaW5nID0gc3RhdHVzID09PSBcInBlbmRpbmdcIjtcbiAgICBjb25zdCBpc0Vycm9yID0gc3RhdHVzID09PSBcImVycm9yXCI7XG4gICAgY29uc3QgaXNMb2FkaW5nID0gaXNQZW5kaW5nICYmIGlzRmV0Y2hpbmc7XG4gICAgY29uc3QgaGFzRGF0YSA9IGRhdGEgIT09IHZvaWQgMDtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBzdGF0dXMsXG4gICAgICBmZXRjaFN0YXR1czogbmV3U3RhdGUuZmV0Y2hTdGF0dXMsXG4gICAgICBpc1BlbmRpbmcsXG4gICAgICBpc1N1Y2Nlc3M6IHN0YXR1cyA9PT0gXCJzdWNjZXNzXCIsXG4gICAgICBpc0Vycm9yLFxuICAgICAgaXNJbml0aWFsTG9hZGluZzogaXNMb2FkaW5nLFxuICAgICAgaXNMb2FkaW5nLFxuICAgICAgZGF0YSxcbiAgICAgIGRhdGFVcGRhdGVkQXQ6IG5ld1N0YXRlLmRhdGFVcGRhdGVkQXQsXG4gICAgICBlcnJvcixcbiAgICAgIGVycm9yVXBkYXRlZEF0LFxuICAgICAgZmFpbHVyZUNvdW50OiBuZXdTdGF0ZS5mZXRjaEZhaWx1cmVDb3VudCxcbiAgICAgIGZhaWx1cmVSZWFzb246IG5ld1N0YXRlLmZldGNoRmFpbHVyZVJlYXNvbixcbiAgICAgIGVycm9yVXBkYXRlQ291bnQ6IG5ld1N0YXRlLmVycm9yVXBkYXRlQ291bnQsXG4gICAgICBpc0ZldGNoZWQ6IHF1ZXJ5LmlzRmV0Y2hlZCgpLFxuICAgICAgaXNGZXRjaGVkQWZ0ZXJNb3VudDogbmV3U3RhdGUuZGF0YVVwZGF0ZUNvdW50ID4gcXVlcnlJbml0aWFsU3RhdGUuZGF0YVVwZGF0ZUNvdW50IHx8IG5ld1N0YXRlLmVycm9yVXBkYXRlQ291bnQgPiBxdWVyeUluaXRpYWxTdGF0ZS5lcnJvclVwZGF0ZUNvdW50LFxuICAgICAgaXNGZXRjaGluZyxcbiAgICAgIGlzUmVmZXRjaGluZzogaXNGZXRjaGluZyAmJiAhaXNQZW5kaW5nLFxuICAgICAgaXNMb2FkaW5nRXJyb3I6IGlzRXJyb3IgJiYgIWhhc0RhdGEsXG4gICAgICBpc1BhdXNlZDogbmV3U3RhdGUuZmV0Y2hTdGF0dXMgPT09IFwicGF1c2VkXCIsXG4gICAgICBpc1BsYWNlaG9sZGVyRGF0YSxcbiAgICAgIGlzUmVmZXRjaEVycm9yOiBpc0Vycm9yICYmIGhhc0RhdGEsXG4gICAgICBpc1N0YWxlOiBpc1N0YWxlKHF1ZXJ5LCBvcHRpb25zKSxcbiAgICAgIHJlZmV0Y2g6IHRoaXMucmVmZXRjaCxcbiAgICAgIHByb21pc2U6IHRoaXMuI2N1cnJlbnRUaGVuYWJsZSxcbiAgICAgIGlzRW5hYmxlZDogcmVzb2x2ZVF1ZXJ5Qm9vbGVhbihvcHRpb25zLmVuYWJsZWQsIHF1ZXJ5KSAhPT0gZmFsc2VcbiAgICB9O1xuICAgIGNvbnN0IG5leHRSZXN1bHQgPSByZXN1bHQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5leHBlcmltZW50YWxfcHJlZmV0Y2hJblJlbmRlcikge1xuICAgICAgY29uc3QgaGFzUmVzdWx0RGF0YSA9IG5leHRSZXN1bHQuZGF0YSAhPT0gdm9pZCAwO1xuICAgICAgY29uc3QgaXNFcnJvcldpdGhvdXREYXRhID0gbmV4dFJlc3VsdC5zdGF0dXMgPT09IFwiZXJyb3JcIiAmJiAhaGFzUmVzdWx0RGF0YTtcbiAgICAgIGNvbnN0IGZpbmFsaXplVGhlbmFibGVJZlBvc3NpYmxlID0gKHRoZW5hYmxlKSA9PiB7XG4gICAgICAgIGlmIChpc0Vycm9yV2l0aG91dERhdGEpIHtcbiAgICAgICAgICB0aGVuYWJsZS5yZWplY3QobmV4dFJlc3VsdC5lcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzUmVzdWx0RGF0YSkge1xuICAgICAgICAgIHRoZW5hYmxlLnJlc29sdmUobmV4dFJlc3VsdC5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlY3JlYXRlVGhlbmFibGUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBlbmRpbmcgPSB0aGlzLiNjdXJyZW50VGhlbmFibGUgPSBuZXh0UmVzdWx0LnByb21pc2UgPSBwZW5kaW5nVGhlbmFibGUoKTtcbiAgICAgICAgZmluYWxpemVUaGVuYWJsZUlmUG9zc2libGUocGVuZGluZyk7XG4gICAgICB9O1xuICAgICAgY29uc3QgcHJldlRoZW5hYmxlID0gdGhpcy4jY3VycmVudFRoZW5hYmxlO1xuICAgICAgc3dpdGNoIChwcmV2VGhlbmFibGUuc3RhdHVzKSB7XG4gICAgICAgIGNhc2UgXCJwZW5kaW5nXCI6XG4gICAgICAgICAgaWYgKHF1ZXJ5LnF1ZXJ5SGFzaCA9PT0gcHJldlF1ZXJ5LnF1ZXJ5SGFzaCkge1xuICAgICAgICAgICAgZmluYWxpemVUaGVuYWJsZUlmUG9zc2libGUocHJldlRoZW5hYmxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJmdWxmaWxsZWRcIjpcbiAgICAgICAgICBpZiAoaXNFcnJvcldpdGhvdXREYXRhIHx8IG5leHRSZXN1bHQuZGF0YSAhPT0gcHJldlRoZW5hYmxlLnZhbHVlKSB7XG4gICAgICAgICAgICByZWNyZWF0ZVRoZW5hYmxlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicmVqZWN0ZWRcIjpcbiAgICAgICAgICBpZiAoIWlzRXJyb3JXaXRob3V0RGF0YSB8fCBuZXh0UmVzdWx0LmVycm9yICE9PSBwcmV2VGhlbmFibGUucmVhc29uKSB7XG4gICAgICAgICAgICByZWNyZWF0ZVRoZW5hYmxlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV4dFJlc3VsdDtcbiAgfVxuICB1cGRhdGVSZXN1bHQoKSB7XG4gICAgY29uc3QgcHJldlJlc3VsdCA9IHRoaXMuI2N1cnJlbnRSZXN1bHQ7XG4gICAgY29uc3QgbmV4dFJlc3VsdCA9IHRoaXMuY3JlYXRlUmVzdWx0KHRoaXMuI2N1cnJlbnRRdWVyeSwgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLiNjdXJyZW50UmVzdWx0U3RhdGUgPSB0aGlzLiNjdXJyZW50UXVlcnkuc3RhdGU7XG4gICAgdGhpcy4jY3VycmVudFJlc3VsdE9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgaWYgKHRoaXMuI2N1cnJlbnRSZXN1bHRTdGF0ZS5kYXRhICE9PSB2b2lkIDApIHtcbiAgICAgIHRoaXMuI2xhc3RRdWVyeVdpdGhEZWZpbmVkRGF0YSA9IHRoaXMuI2N1cnJlbnRRdWVyeTtcbiAgICB9XG4gICAgaWYgKHNoYWxsb3dFcXVhbE9iamVjdHMobmV4dFJlc3VsdCwgcHJldlJlc3VsdCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy4jY3VycmVudFJlc3VsdCA9IG5leHRSZXN1bHQ7XG4gICAgY29uc3Qgc2hvdWxkTm90aWZ5TGlzdGVuZXJzID0gKCkgPT4ge1xuICAgICAgaWYgKCFwcmV2UmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgeyBub3RpZnlPbkNoYW5nZVByb3BzIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgICBjb25zdCBub3RpZnlPbkNoYW5nZVByb3BzVmFsdWUgPSB0eXBlb2Ygbm90aWZ5T25DaGFuZ2VQcm9wcyA9PT0gXCJmdW5jdGlvblwiID8gbm90aWZ5T25DaGFuZ2VQcm9wcygpIDogbm90aWZ5T25DaGFuZ2VQcm9wcztcbiAgICAgIGlmIChub3RpZnlPbkNoYW5nZVByb3BzVmFsdWUgPT09IFwiYWxsXCIgfHwgIW5vdGlmeU9uQ2hhbmdlUHJvcHNWYWx1ZSAmJiAhdGhpcy4jdHJhY2tlZFByb3BzLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBjb25zdCBpbmNsdWRlZFByb3BzID0gbmV3IFNldChcbiAgICAgICAgbm90aWZ5T25DaGFuZ2VQcm9wc1ZhbHVlID8/IHRoaXMuI3RyYWNrZWRQcm9wc1xuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudGhyb3dPbkVycm9yKSB7XG4gICAgICAgIGluY2x1ZGVkUHJvcHMuYWRkKFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy4jY3VycmVudFJlc3VsdCkuc29tZSgoa2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IHR5cGVkS2V5ID0ga2V5O1xuICAgICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy4jY3VycmVudFJlc3VsdFt0eXBlZEtleV0gIT09IHByZXZSZXN1bHRbdHlwZWRLZXldO1xuICAgICAgICByZXR1cm4gY2hhbmdlZCAmJiBpbmNsdWRlZFByb3BzLmhhcyh0eXBlZEtleSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHRoaXMuI25vdGlmeSh7IGxpc3RlbmVyczogc2hvdWxkTm90aWZ5TGlzdGVuZXJzKCkgfSk7XG4gIH1cbiAgI3VwZGF0ZVF1ZXJ5KCkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy4jY2xpZW50LmdldFF1ZXJ5Q2FjaGUoKS5idWlsZCh0aGlzLiNjbGllbnQsIHRoaXMub3B0aW9ucyk7XG4gICAgaWYgKHF1ZXJ5ID09PSB0aGlzLiNjdXJyZW50UXVlcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcHJldlF1ZXJ5ID0gdGhpcy4jY3VycmVudFF1ZXJ5O1xuICAgIHRoaXMuI2N1cnJlbnRRdWVyeSA9IHF1ZXJ5O1xuICAgIHRoaXMuI2N1cnJlbnRRdWVyeUluaXRpYWxTdGF0ZSA9IHF1ZXJ5LnN0YXRlO1xuICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycygpKSB7XG4gICAgICBwcmV2UXVlcnk/LnJlbW92ZU9ic2VydmVyKHRoaXMpO1xuICAgICAgcXVlcnkuYWRkT2JzZXJ2ZXIodGhpcyk7XG4gICAgfVxuICB9XG4gIG9uUXVlcnlVcGRhdGUoKSB7XG4gICAgdGhpcy51cGRhdGVSZXN1bHQoKTtcbiAgICBpZiAodGhpcy5oYXNMaXN0ZW5lcnMoKSkge1xuICAgICAgdGhpcy4jdXBkYXRlVGltZXJzKCk7XG4gICAgfVxuICB9XG4gICNub3RpZnkobm90aWZ5T3B0aW9ucykge1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgaWYgKG5vdGlmeU9wdGlvbnMubGlzdGVuZXJzKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICAgICAgbGlzdGVuZXIodGhpcy4jY3VycmVudFJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy4jY2xpZW50LmdldFF1ZXJ5Q2FjaGUoKS5ub3RpZnkoe1xuICAgICAgICBxdWVyeTogdGhpcy4jY3VycmVudFF1ZXJ5LFxuICAgICAgICB0eXBlOiBcIm9ic2VydmVyUmVzdWx0c1VwZGF0ZWRcIlxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG5mdW5jdGlvbiBzaG91bGRMb2FkT25Nb3VudChxdWVyeSwgb3B0aW9ucykge1xuICByZXR1cm4gcmVzb2x2ZVF1ZXJ5Qm9vbGVhbihvcHRpb25zLmVuYWJsZWQsIHF1ZXJ5KSAhPT0gZmFsc2UgJiYgcXVlcnkuc3RhdGUuZGF0YSA9PT0gdm9pZCAwICYmICEocXVlcnkuc3RhdGUuc3RhdHVzID09PSBcImVycm9yXCIgJiYgcmVzb2x2ZVF1ZXJ5Qm9vbGVhbihvcHRpb25zLnJldHJ5T25Nb3VudCwgcXVlcnkpID09PSBmYWxzZSk7XG59XG5mdW5jdGlvbiBzaG91bGRGZXRjaE9uTW91bnQocXVlcnksIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHNob3VsZExvYWRPbk1vdW50KHF1ZXJ5LCBvcHRpb25zKSB8fCBxdWVyeS5zdGF0ZS5kYXRhICE9PSB2b2lkIDAgJiYgc2hvdWxkRmV0Y2hPbihxdWVyeSwgb3B0aW9ucywgb3B0aW9ucy5yZWZldGNoT25Nb3VudCk7XG59XG5mdW5jdGlvbiBzaG91bGRGZXRjaE9uKHF1ZXJ5LCBvcHRpb25zLCBmaWVsZCkge1xuICBpZiAocmVzb2x2ZVF1ZXJ5Qm9vbGVhbihvcHRpb25zLmVuYWJsZWQsIHF1ZXJ5KSAhPT0gZmFsc2UgJiYgcmVzb2x2ZVN0YWxlVGltZShvcHRpb25zLnN0YWxlVGltZSwgcXVlcnkpICE9PSBcInN0YXRpY1wiKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0eXBlb2YgZmllbGQgPT09IFwiZnVuY3Rpb25cIiA/IGZpZWxkKHF1ZXJ5KSA6IGZpZWxkO1xuICAgIHJldHVybiB2YWx1ZSA9PT0gXCJhbHdheXNcIiB8fCB2YWx1ZSAhPT0gZmFsc2UgJiYgaXNTdGFsZShxdWVyeSwgb3B0aW9ucyk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gc2hvdWxkRmV0Y2hPcHRpb25hbGx5KHF1ZXJ5LCBwcmV2UXVlcnksIG9wdGlvbnMsIHByZXZPcHRpb25zKSB7XG4gIHJldHVybiAocXVlcnkgIT09IHByZXZRdWVyeSB8fCByZXNvbHZlUXVlcnlCb29sZWFuKHByZXZPcHRpb25zLmVuYWJsZWQsIHF1ZXJ5KSA9PT0gZmFsc2UpICYmICghb3B0aW9ucy5zdXNwZW5zZSB8fCBxdWVyeS5zdGF0ZS5zdGF0dXMgIT09IFwiZXJyb3JcIikgJiYgaXNTdGFsZShxdWVyeSwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBpc1N0YWxlKHF1ZXJ5LCBvcHRpb25zKSB7XG4gIHJldHVybiByZXNvbHZlUXVlcnlCb29sZWFuKG9wdGlvbnMuZW5hYmxlZCwgcXVlcnkpICE9PSBmYWxzZSAmJiBxdWVyeS5pc1N0YWxlQnlUaW1lKHJlc29sdmVTdGFsZVRpbWUob3B0aW9ucy5zdGFsZVRpbWUsIHF1ZXJ5KSk7XG59XG5mdW5jdGlvbiBzaG91bGRBc3NpZ25PYnNlcnZlckN1cnJlbnRQcm9wZXJ0aWVzKG9ic2VydmVyLCBvcHRpbWlzdGljUmVzdWx0KSB7XG4gIGlmICghc2hhbGxvd0VxdWFsT2JqZWN0cyhvYnNlcnZlci5nZXRDdXJyZW50UmVzdWx0KCksIG9wdGltaXN0aWNSZXN1bHQpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZXhwb3J0IHtcbiAgUXVlcnlPYnNlcnZlclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5T2JzZXJ2ZXIuanMubWFwIiwiLy8gc3JjL2luZmluaXRlUXVlcnlPYnNlcnZlci50c1xuaW1wb3J0IHsgUXVlcnlPYnNlcnZlciB9IGZyb20gXCIuL3F1ZXJ5T2JzZXJ2ZXIuanNcIjtcbmltcG9ydCB7IGhhc05leHRQYWdlLCBoYXNQcmV2aW91c1BhZ2UgfSBmcm9tIFwiLi9pbmZpbml0ZVF1ZXJ5QmVoYXZpb3IuanNcIjtcbnZhciBJbmZpbml0ZVF1ZXJ5T2JzZXJ2ZXIgPSBjbGFzcyBleHRlbmRzIFF1ZXJ5T2JzZXJ2ZXIge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIG9wdGlvbnMpIHtcbiAgICBzdXBlcihjbGllbnQsIG9wdGlvbnMpO1xuICB9XG4gIGJpbmRNZXRob2RzKCkge1xuICAgIHN1cGVyLmJpbmRNZXRob2RzKCk7XG4gICAgdGhpcy5mZXRjaE5leHRQYWdlID0gdGhpcy5mZXRjaE5leHRQYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5mZXRjaFByZXZpb3VzUGFnZSA9IHRoaXMuZmV0Y2hQcmV2aW91c1BhZ2UuYmluZCh0aGlzKTtcbiAgfVxuICBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zLl90eXBlID0gXCJpbmZpbml0ZVwiO1xuICAgIHN1cGVyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gIH1cbiAgZ2V0T3B0aW1pc3RpY1Jlc3VsdChvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5fdHlwZSA9IFwiaW5maW5pdGVcIjtcbiAgICByZXR1cm4gc3VwZXIuZ2V0T3B0aW1pc3RpY1Jlc3VsdChvcHRpb25zKTtcbiAgfVxuICBmZXRjaE5leHRQYWdlKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5mZXRjaCh7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbWV0YToge1xuICAgICAgICBmZXRjaE1vcmU6IHsgZGlyZWN0aW9uOiBcImZvcndhcmRcIiB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZmV0Y2hQcmV2aW91c1BhZ2Uob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmZldGNoKHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBtZXRhOiB7XG4gICAgICAgIGZldGNoTW9yZTogeyBkaXJlY3Rpb246IFwiYmFja3dhcmRcIiB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgY3JlYXRlUmVzdWx0KHF1ZXJ5LCBvcHRpb25zKSB7XG4gICAgY29uc3QgeyBzdGF0ZSB9ID0gcXVlcnk7XG4gICAgY29uc3QgcGFyZW50UmVzdWx0ID0gc3VwZXIuY3JlYXRlUmVzdWx0KHF1ZXJ5LCBvcHRpb25zKTtcbiAgICBjb25zdCB7IGlzRmV0Y2hpbmcsIGlzUmVmZXRjaGluZywgaXNFcnJvciwgaXNSZWZldGNoRXJyb3IgfSA9IHBhcmVudFJlc3VsdDtcbiAgICBjb25zdCBmZXRjaERpcmVjdGlvbiA9IHN0YXRlLmZldGNoTWV0YT8uZmV0Y2hNb3JlPy5kaXJlY3Rpb247XG4gICAgY29uc3QgaXNGZXRjaE5leHRQYWdlRXJyb3IgPSBpc0Vycm9yICYmIGZldGNoRGlyZWN0aW9uID09PSBcImZvcndhcmRcIjtcbiAgICBjb25zdCBpc0ZldGNoaW5nTmV4dFBhZ2UgPSBpc0ZldGNoaW5nICYmIGZldGNoRGlyZWN0aW9uID09PSBcImZvcndhcmRcIjtcbiAgICBjb25zdCBpc0ZldGNoUHJldmlvdXNQYWdlRXJyb3IgPSBpc0Vycm9yICYmIGZldGNoRGlyZWN0aW9uID09PSBcImJhY2t3YXJkXCI7XG4gICAgY29uc3QgaXNGZXRjaGluZ1ByZXZpb3VzUGFnZSA9IGlzRmV0Y2hpbmcgJiYgZmV0Y2hEaXJlY3Rpb24gPT09IFwiYmFja3dhcmRcIjtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAuLi5wYXJlbnRSZXN1bHQsXG4gICAgICBmZXRjaE5leHRQYWdlOiB0aGlzLmZldGNoTmV4dFBhZ2UsXG4gICAgICBmZXRjaFByZXZpb3VzUGFnZTogdGhpcy5mZXRjaFByZXZpb3VzUGFnZSxcbiAgICAgIGhhc05leHRQYWdlOiBoYXNOZXh0UGFnZShvcHRpb25zLCBzdGF0ZS5kYXRhKSxcbiAgICAgIGhhc1ByZXZpb3VzUGFnZTogaGFzUHJldmlvdXNQYWdlKG9wdGlvbnMsIHN0YXRlLmRhdGEpLFxuICAgICAgaXNGZXRjaE5leHRQYWdlRXJyb3IsXG4gICAgICBpc0ZldGNoaW5nTmV4dFBhZ2UsXG4gICAgICBpc0ZldGNoUHJldmlvdXNQYWdlRXJyb3IsXG4gICAgICBpc0ZldGNoaW5nUHJldmlvdXNQYWdlLFxuICAgICAgaXNSZWZldGNoRXJyb3I6IGlzUmVmZXRjaEVycm9yICYmICFpc0ZldGNoTmV4dFBhZ2VFcnJvciAmJiAhaXNGZXRjaFByZXZpb3VzUGFnZUVycm9yLFxuICAgICAgaXNSZWZldGNoaW5nOiBpc1JlZmV0Y2hpbmcgJiYgIWlzRmV0Y2hpbmdOZXh0UGFnZSAmJiAhaXNGZXRjaGluZ1ByZXZpb3VzUGFnZVxuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcbmV4cG9ydCB7XG4gIEluZmluaXRlUXVlcnlPYnNlcnZlclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZmluaXRlUXVlcnlPYnNlcnZlci5qcy5tYXAiLCIvLyBzcmMvbXV0YXRpb24udHNcbmltcG9ydCB7IG5vdGlmeU1hbmFnZXIgfSBmcm9tIFwiLi9ub3RpZnlNYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBSZW1vdmFibGUgfSBmcm9tIFwiLi9yZW1vdmFibGUuanNcIjtcbmltcG9ydCB7IGNyZWF0ZVJldHJ5ZXIgfSBmcm9tIFwiLi9yZXRyeWVyLmpzXCI7XG52YXIgTXV0YXRpb24gPSBjbGFzcyBleHRlbmRzIFJlbW92YWJsZSB7XG4gICNjbGllbnQ7XG4gICNvYnNlcnZlcnM7XG4gICNtdXRhdGlvbkNhY2hlO1xuICAjcmV0cnllcjtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNjbGllbnQgPSBjb25maWcuY2xpZW50O1xuICAgIHRoaXMubXV0YXRpb25JZCA9IGNvbmZpZy5tdXRhdGlvbklkO1xuICAgIHRoaXMuI211dGF0aW9uQ2FjaGUgPSBjb25maWcubXV0YXRpb25DYWNoZTtcbiAgICB0aGlzLiNvYnNlcnZlcnMgPSBbXTtcbiAgICB0aGlzLnN0YXRlID0gY29uZmlnLnN0YXRlIHx8IGdldERlZmF1bHRTdGF0ZSgpO1xuICAgIHRoaXMuc2V0T3B0aW9ucyhjb25maWcub3B0aW9ucyk7XG4gICAgdGhpcy5zY2hlZHVsZUdjKCk7XG4gIH1cbiAgc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnVwZGF0ZUdjVGltZSh0aGlzLm9wdGlvbnMuZ2NUaW1lKTtcbiAgfVxuICBnZXQgbWV0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1ldGE7XG4gIH1cbiAgYWRkT2JzZXJ2ZXIob2JzZXJ2ZXIpIHtcbiAgICBpZiAoIXRoaXMuI29ic2VydmVycy5pbmNsdWRlcyhvYnNlcnZlcikpIHtcbiAgICAgIHRoaXMuI29ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbiAgICAgIHRoaXMuY2xlYXJHY1RpbWVvdXQoKTtcbiAgICAgIHRoaXMuI211dGF0aW9uQ2FjaGUubm90aWZ5KHtcbiAgICAgICAgdHlwZTogXCJvYnNlcnZlckFkZGVkXCIsXG4gICAgICAgIG11dGF0aW9uOiB0aGlzLFxuICAgICAgICBvYnNlcnZlclxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU9ic2VydmVyKG9ic2VydmVyKSB7XG4gICAgdGhpcy4jb2JzZXJ2ZXJzID0gdGhpcy4jb2JzZXJ2ZXJzLmZpbHRlcigoeCkgPT4geCAhPT0gb2JzZXJ2ZXIpO1xuICAgIHRoaXMuc2NoZWR1bGVHYygpO1xuICAgIHRoaXMuI211dGF0aW9uQ2FjaGUubm90aWZ5KHtcbiAgICAgIHR5cGU6IFwib2JzZXJ2ZXJSZW1vdmVkXCIsXG4gICAgICBtdXRhdGlvbjogdGhpcyxcbiAgICAgIG9ic2VydmVyXG4gICAgfSk7XG4gIH1cbiAgb3B0aW9uYWxSZW1vdmUoKSB7XG4gICAgaWYgKCF0aGlzLiNvYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5zdGF0dXMgPT09IFwicGVuZGluZ1wiKSB7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVHYygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4jbXV0YXRpb25DYWNoZS5yZW1vdmUodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnRpbnVlKCkge1xuICAgIHJldHVybiB0aGlzLiNyZXRyeWVyPy5jb250aW51ZSgpID8/IC8vIGNvbnRpbnVpbmcgYSBtdXRhdGlvbiBhc3N1bWVzIHRoYXQgdmFyaWFibGVzIGFyZSBzZXQsIG11dGF0aW9uIG11c3QgaGF2ZSBiZWVuIGRlaHlkcmF0ZWQgYmVmb3JlXG4gICAgdGhpcy5leGVjdXRlKHRoaXMuc3RhdGUudmFyaWFibGVzKTtcbiAgfVxuICBhc3luYyBleGVjdXRlKHZhcmlhYmxlcykge1xuICAgIGNvbnN0IG9uQ29udGludWUgPSAoKSA9PiB7XG4gICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwiY29udGludWVcIiB9KTtcbiAgICB9O1xuICAgIGNvbnN0IG11dGF0aW9uRm5Db250ZXh0ID0ge1xuICAgICAgY2xpZW50OiB0aGlzLiNjbGllbnQsXG4gICAgICBtZXRhOiB0aGlzLm9wdGlvbnMubWV0YSxcbiAgICAgIG11dGF0aW9uS2V5OiB0aGlzLm9wdGlvbnMubXV0YXRpb25LZXlcbiAgICB9O1xuICAgIHRoaXMuI3JldHJ5ZXIgPSBjcmVhdGVSZXRyeWVyKHtcbiAgICAgIGZuOiAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLm11dGF0aW9uRm4pIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiTm8gbXV0YXRpb25GbiBmb3VuZFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tdXRhdGlvbkZuKHZhcmlhYmxlcywgbXV0YXRpb25GbkNvbnRleHQpO1xuICAgICAgfSxcbiAgICAgIG9uRmFpbDogKGZhaWx1cmVDb3VudCwgZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy4jZGlzcGF0Y2goeyB0eXBlOiBcImZhaWxlZFwiLCBmYWlsdXJlQ291bnQsIGVycm9yIH0pO1xuICAgICAgfSxcbiAgICAgIG9uUGF1c2U6ICgpID0+IHtcbiAgICAgICAgdGhpcy4jZGlzcGF0Y2goeyB0eXBlOiBcInBhdXNlXCIgfSk7XG4gICAgICB9LFxuICAgICAgb25Db250aW51ZSxcbiAgICAgIHJldHJ5OiB0aGlzLm9wdGlvbnMucmV0cnkgPz8gMCxcbiAgICAgIHJldHJ5RGVsYXk6IHRoaXMub3B0aW9ucy5yZXRyeURlbGF5LFxuICAgICAgbmV0d29ya01vZGU6IHRoaXMub3B0aW9ucy5uZXR3b3JrTW9kZSxcbiAgICAgIGNhblJ1bjogKCkgPT4gdGhpcy4jbXV0YXRpb25DYWNoZS5jYW5SdW4odGhpcylcbiAgICB9KTtcbiAgICBjb25zdCByZXN0b3JlZCA9IHRoaXMuc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIjtcbiAgICBjb25zdCBpc1BhdXNlZCA9ICF0aGlzLiNyZXRyeWVyLmNhblN0YXJ0KCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZXN0b3JlZCkge1xuICAgICAgICBvbkNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwicGVuZGluZ1wiLCB2YXJpYWJsZXMsIGlzUGF1c2VkIH0pO1xuICAgICAgICBpZiAodGhpcy4jbXV0YXRpb25DYWNoZS5jb25maWcub25NdXRhdGUpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNtdXRhdGlvbkNhY2hlLmNvbmZpZy5vbk11dGF0ZShcbiAgICAgICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBtdXRhdGlvbkZuQ29udGV4dFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMub3B0aW9ucy5vbk11dGF0ZT8uKFxuICAgICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgICBtdXRhdGlvbkZuQ29udGV4dFxuICAgICAgICApO1xuICAgICAgICBpZiAoY29udGV4dCAhPT0gdGhpcy5zdGF0ZS5jb250ZXh0KSB7XG4gICAgICAgICAgdGhpcy4jZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogXCJwZW5kaW5nXCIsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgdmFyaWFibGVzLFxuICAgICAgICAgICAgaXNQYXVzZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI3JldHJ5ZXIuc3RhcnQoKTtcbiAgICAgIGF3YWl0IHRoaXMuI211dGF0aW9uQ2FjaGUuY29uZmlnLm9uU3VjY2Vzcz8uKFxuICAgICAgICBkYXRhLFxuICAgICAgICB2YXJpYWJsZXMsXG4gICAgICAgIHRoaXMuc3RhdGUuY29udGV4dCxcbiAgICAgICAgdGhpcyxcbiAgICAgICAgbXV0YXRpb25GbkNvbnRleHRcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25TdWNjZXNzPy4oXG4gICAgICAgIGRhdGEsXG4gICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgdGhpcy5zdGF0ZS5jb250ZXh0LFxuICAgICAgICBtdXRhdGlvbkZuQ29udGV4dFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMuI211dGF0aW9uQ2FjaGUuY29uZmlnLm9uU2V0dGxlZD8uKFxuICAgICAgICBkYXRhLFxuICAgICAgICBudWxsLFxuICAgICAgICB0aGlzLnN0YXRlLnZhcmlhYmxlcyxcbiAgICAgICAgdGhpcy5zdGF0ZS5jb250ZXh0LFxuICAgICAgICB0aGlzLFxuICAgICAgICBtdXRhdGlvbkZuQ29udGV4dFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMub3B0aW9ucy5vblNldHRsZWQ/LihcbiAgICAgICAgZGF0YSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdmFyaWFibGVzLFxuICAgICAgICB0aGlzLnN0YXRlLmNvbnRleHQsXG4gICAgICAgIG11dGF0aW9uRm5Db250ZXh0XG4gICAgICApO1xuICAgICAgdGhpcy4jZGlzcGF0Y2goeyB0eXBlOiBcInN1Y2Nlc3NcIiwgZGF0YSB9KTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLiNtdXRhdGlvbkNhY2hlLmNvbmZpZy5vbkVycm9yPy4oXG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgdmFyaWFibGVzLFxuICAgICAgICAgIHRoaXMuc3RhdGUuY29udGV4dCxcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIG11dGF0aW9uRm5Db250ZXh0XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZvaWQgUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25FcnJvcj8uKFxuICAgICAgICAgIGVycm9yLFxuICAgICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgICB0aGlzLnN0YXRlLmNvbnRleHQsXG4gICAgICAgICAgbXV0YXRpb25GbkNvbnRleHRcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdm9pZCBQcm9taXNlLnJlamVjdChlKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI211dGF0aW9uQ2FjaGUuY29uZmlnLm9uU2V0dGxlZD8uKFxuICAgICAgICAgIHZvaWQgMCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgICB0aGlzLnN0YXRlLnZhcmlhYmxlcyxcbiAgICAgICAgICB0aGlzLnN0YXRlLmNvbnRleHQsXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBtdXRhdGlvbkZuQ29udGV4dFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2b2lkIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uU2V0dGxlZD8uKFxuICAgICAgICAgIHZvaWQgMCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgICB2YXJpYWJsZXMsXG4gICAgICAgICAgdGhpcy5zdGF0ZS5jb250ZXh0LFxuICAgICAgICAgIG11dGF0aW9uRm5Db250ZXh0XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZvaWQgUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgICB0aGlzLiNkaXNwYXRjaCh7IHR5cGU6IFwiZXJyb3JcIiwgZXJyb3IgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy4jbXV0YXRpb25DYWNoZS5ydW5OZXh0KHRoaXMpO1xuICAgIH1cbiAgfVxuICAjZGlzcGF0Y2goYWN0aW9uKSB7XG4gICAgY29uc3QgcmVkdWNlciA9IChzdGF0ZSkgPT4ge1xuICAgICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgICAgICBjYXNlIFwiZmFpbGVkXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgZmFpbHVyZUNvdW50OiBhY3Rpb24uZmFpbHVyZUNvdW50LFxuICAgICAgICAgICAgZmFpbHVyZVJlYXNvbjogYWN0aW9uLmVycm9yXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcInBhdXNlXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgaXNQYXVzZWQ6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBpc1BhdXNlZDogZmFsc2VcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwicGVuZGluZ1wiOlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICAgIGNvbnRleHQ6IGFjdGlvbi5jb250ZXh0LFxuICAgICAgICAgICAgZGF0YTogdm9pZCAwLFxuICAgICAgICAgICAgZmFpbHVyZUNvdW50OiAwLFxuICAgICAgICAgICAgZmFpbHVyZVJlYXNvbjogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgaXNQYXVzZWQ6IGFjdGlvbi5pc1BhdXNlZCxcbiAgICAgICAgICAgIHN0YXR1czogXCJwZW5kaW5nXCIsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IGFjdGlvbi52YXJpYWJsZXMsXG4gICAgICAgICAgICBzdWJtaXR0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgXCJzdWNjZXNzXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgZGF0YTogYWN0aW9uLmRhdGEsXG4gICAgICAgICAgICBmYWlsdXJlQ291bnQ6IDAsXG4gICAgICAgICAgICBmYWlsdXJlUmVhc29uOiBudWxsLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICBzdGF0dXM6IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgaXNQYXVzZWQ6IGZhbHNlXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgZGF0YTogdm9pZCAwLFxuICAgICAgICAgICAgZXJyb3I6IGFjdGlvbi5lcnJvcixcbiAgICAgICAgICAgIGZhaWx1cmVDb3VudDogc3RhdGUuZmFpbHVyZUNvdW50ICsgMSxcbiAgICAgICAgICAgIGZhaWx1cmVSZWFzb246IGFjdGlvbi5lcnJvcixcbiAgICAgICAgICAgIGlzUGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiXG4gICAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc3RhdGUgPSByZWR1Y2VyKHRoaXMuc3RhdGUpO1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgdGhpcy4jb2JzZXJ2ZXJzLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLm9uTXV0YXRpb25VcGRhdGUoYWN0aW9uKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy4jbXV0YXRpb25DYWNoZS5ub3RpZnkoe1xuICAgICAgICBtdXRhdGlvbjogdGhpcyxcbiAgICAgICAgdHlwZTogXCJ1cGRhdGVkXCIsXG4gICAgICAgIGFjdGlvblxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG5mdW5jdGlvbiBnZXREZWZhdWx0U3RhdGUoKSB7XG4gIHJldHVybiB7XG4gICAgY29udGV4dDogdm9pZCAwLFxuICAgIGRhdGE6IHZvaWQgMCxcbiAgICBlcnJvcjogbnVsbCxcbiAgICBmYWlsdXJlQ291bnQ6IDAsXG4gICAgZmFpbHVyZVJlYXNvbjogbnVsbCxcbiAgICBpc1BhdXNlZDogZmFsc2UsXG4gICAgc3RhdHVzOiBcImlkbGVcIixcbiAgICB2YXJpYWJsZXM6IHZvaWQgMCxcbiAgICBzdWJtaXR0ZWRBdDogMFxuICB9O1xufVxuZXhwb3J0IHtcbiAgTXV0YXRpb24sXG4gIGdldERlZmF1bHRTdGF0ZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW11dGF0aW9uLmpzLm1hcCIsIi8vIHNyYy9tdXRhdGlvbkNhY2hlLnRzXG5pbXBvcnQgeyBub3RpZnlNYW5hZ2VyIH0gZnJvbSBcIi4vbm90aWZ5TWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgTXV0YXRpb24gfSBmcm9tIFwiLi9tdXRhdGlvbi5qc1wiO1xuaW1wb3J0IHsgbWF0Y2hNdXRhdGlvbiwgbm9vcCB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi9zdWJzY3JpYmFibGUuanNcIjtcbnZhciBNdXRhdGlvbkNhY2hlID0gY2xhc3MgZXh0ZW5kcyBTdWJzY3JpYmFibGUge1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4jbXV0YXRpb25zID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgICB0aGlzLiNzY29wZXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgIHRoaXMuI211dGF0aW9uSWQgPSAwO1xuICB9XG4gICNtdXRhdGlvbnM7XG4gICNzY29wZXM7XG4gICNtdXRhdGlvbklkO1xuICBidWlsZChjbGllbnQsIG9wdGlvbnMsIHN0YXRlKSB7XG4gICAgY29uc3QgbXV0YXRpb24gPSBuZXcgTXV0YXRpb24oe1xuICAgICAgY2xpZW50LFxuICAgICAgbXV0YXRpb25DYWNoZTogdGhpcyxcbiAgICAgIG11dGF0aW9uSWQ6ICsrdGhpcy4jbXV0YXRpb25JZCxcbiAgICAgIG9wdGlvbnM6IGNsaWVudC5kZWZhdWx0TXV0YXRpb25PcHRpb25zKG9wdGlvbnMpLFxuICAgICAgc3RhdGVcbiAgICB9KTtcbiAgICB0aGlzLmFkZChtdXRhdGlvbik7XG4gICAgcmV0dXJuIG11dGF0aW9uO1xuICB9XG4gIGFkZChtdXRhdGlvbikge1xuICAgIHRoaXMuI211dGF0aW9ucy5hZGQobXV0YXRpb24pO1xuICAgIGNvbnN0IHNjb3BlID0gc2NvcGVGb3IobXV0YXRpb24pO1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IHNjb3BlZE11dGF0aW9ucyA9IHRoaXMuI3Njb3Blcy5nZXQoc2NvcGUpO1xuICAgICAgaWYgKHNjb3BlZE11dGF0aW9ucykge1xuICAgICAgICBzY29wZWRNdXRhdGlvbnMucHVzaChtdXRhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiNzY29wZXMuc2V0KHNjb3BlLCBbbXV0YXRpb25dKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ub3RpZnkoeyB0eXBlOiBcImFkZGVkXCIsIG11dGF0aW9uIH0pO1xuICB9XG4gIHJlbW92ZShtdXRhdGlvbikge1xuICAgIGlmICh0aGlzLiNtdXRhdGlvbnMuZGVsZXRlKG11dGF0aW9uKSkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBzY29wZUZvcihtdXRhdGlvbik7XG4gICAgICBpZiAodHlwZW9mIHNjb3BlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGNvbnN0IHNjb3BlZE11dGF0aW9ucyA9IHRoaXMuI3Njb3Blcy5nZXQoc2NvcGUpO1xuICAgICAgICBpZiAoc2NvcGVkTXV0YXRpb25zKSB7XG4gICAgICAgICAgaWYgKHNjb3BlZE11dGF0aW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHNjb3BlZE11dGF0aW9ucy5pbmRleE9mKG11dGF0aW9uKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgc2NvcGVkTXV0YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzY29wZWRNdXRhdGlvbnNbMF0gPT09IG11dGF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLiNzY29wZXMuZGVsZXRlKHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ub3RpZnkoeyB0eXBlOiBcInJlbW92ZWRcIiwgbXV0YXRpb24gfSk7XG4gIH1cbiAgY2FuUnVuKG11dGF0aW9uKSB7XG4gICAgY29uc3Qgc2NvcGUgPSBzY29wZUZvcihtdXRhdGlvbik7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgbXV0YXRpb25zV2l0aFNhbWVTY29wZSA9IHRoaXMuI3Njb3Blcy5nZXQoc2NvcGUpO1xuICAgICAgY29uc3QgZmlyc3RQZW5kaW5nTXV0YXRpb24gPSBtdXRhdGlvbnNXaXRoU2FtZVNjb3BlPy5maW5kKFxuICAgICAgICAobSkgPT4gbS5zdGF0ZS5zdGF0dXMgPT09IFwicGVuZGluZ1wiXG4gICAgICApO1xuICAgICAgcmV0dXJuICFmaXJzdFBlbmRpbmdNdXRhdGlvbiB8fCBmaXJzdFBlbmRpbmdNdXRhdGlvbiA9PT0gbXV0YXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICBydW5OZXh0KG11dGF0aW9uKSB7XG4gICAgY29uc3Qgc2NvcGUgPSBzY29wZUZvcihtdXRhdGlvbik7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgZm91bmRNdXRhdGlvbiA9IHRoaXMuI3Njb3Blcy5nZXQoc2NvcGUpPy5maW5kKChtKSA9PiBtICE9PSBtdXRhdGlvbiAmJiBtLnN0YXRlLmlzUGF1c2VkKTtcbiAgICAgIHJldHVybiBmb3VuZE11dGF0aW9uPy5jb250aW51ZSgpID8/IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG4gIGNsZWFyKCkge1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgdGhpcy4jbXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG4gICAgICAgIHRoaXMubm90aWZ5KHsgdHlwZTogXCJyZW1vdmVkXCIsIG11dGF0aW9uIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLiNtdXRhdGlvbnMuY2xlYXIoKTtcbiAgICAgIHRoaXMuI3Njb3Blcy5jbGVhcigpO1xuICAgIH0pO1xuICB9XG4gIGdldEFsbCgpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLiNtdXRhdGlvbnMpO1xuICB9XG4gIGZpbmQoZmlsdGVycykge1xuICAgIGNvbnN0IGRlZmF1bHRlZEZpbHRlcnMgPSB7IGV4YWN0OiB0cnVlLCAuLi5maWx0ZXJzIH07XG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsKCkuZmluZChcbiAgICAgIChtdXRhdGlvbikgPT4gbWF0Y2hNdXRhdGlvbihkZWZhdWx0ZWRGaWx0ZXJzLCBtdXRhdGlvbilcbiAgICApO1xuICB9XG4gIGZpbmRBbGwoZmlsdGVycyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsKCkuZmlsdGVyKChtdXRhdGlvbikgPT4gbWF0Y2hNdXRhdGlvbihmaWx0ZXJzLCBtdXRhdGlvbikpO1xuICB9XG4gIG5vdGlmeShldmVudCkge1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmVzdW1lUGF1c2VkTXV0YXRpb25zKCkge1xuICAgIGNvbnN0IHBhdXNlZE11dGF0aW9ucyA9IHRoaXMuZ2V0QWxsKCkuZmlsdGVyKCh4KSA9PiB4LnN0YXRlLmlzUGF1c2VkKTtcbiAgICByZXR1cm4gbm90aWZ5TWFuYWdlci5iYXRjaChcbiAgICAgICgpID0+IFByb21pc2UuYWxsKFxuICAgICAgICBwYXVzZWRNdXRhdGlvbnMubWFwKChtdXRhdGlvbikgPT4gbXV0YXRpb24uY29udGludWUoKS5jYXRjaChub29wKSlcbiAgICAgIClcbiAgICApO1xuICB9XG59O1xuZnVuY3Rpb24gc2NvcGVGb3IobXV0YXRpb24pIHtcbiAgcmV0dXJuIG11dGF0aW9uLm9wdGlvbnMuc2NvcGU/LmlkO1xufVxuZXhwb3J0IHtcbiAgTXV0YXRpb25DYWNoZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW11dGF0aW9uQ2FjaGUuanMubWFwIiwiLy8gc3JjL211dGF0aW9uT2JzZXJ2ZXIudHNcbmltcG9ydCB7IGdldERlZmF1bHRTdGF0ZSB9IGZyb20gXCIuL211dGF0aW9uLmpzXCI7XG5pbXBvcnQgeyBub3RpZnlNYW5hZ2VyIH0gZnJvbSBcIi4vbm90aWZ5TWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4vc3Vic2NyaWJhYmxlLmpzXCI7XG5pbXBvcnQgeyBoYXNoS2V5LCBzaGFsbG93RXF1YWxPYmplY3RzIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcbnZhciBNdXRhdGlvbk9ic2VydmVyID0gY2xhc3MgZXh0ZW5kcyBTdWJzY3JpYmFibGUge1xuICAjY2xpZW50O1xuICAjY3VycmVudFJlc3VsdCA9IHZvaWQgMDtcbiAgI2N1cnJlbnRNdXRhdGlvbjtcbiAgI211dGF0ZU9wdGlvbnM7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgb3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLmJpbmRNZXRob2RzKCk7XG4gICAgdGhpcy4jdXBkYXRlUmVzdWx0KCk7XG4gIH1cbiAgYmluZE1ldGhvZHMoKSB7XG4gICAgdGhpcy5tdXRhdGUgPSB0aGlzLm11dGF0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVzZXQgPSB0aGlzLnJlc2V0LmJpbmQodGhpcyk7XG4gIH1cbiAgc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgY29uc3QgcHJldk9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy4jY2xpZW50LmRlZmF1bHRNdXRhdGlvbk9wdGlvbnMob3B0aW9ucyk7XG4gICAgaWYgKCFzaGFsbG93RXF1YWxPYmplY3RzKHRoaXMub3B0aW9ucywgcHJldk9wdGlvbnMpKSB7XG4gICAgICB0aGlzLiNjbGllbnQuZ2V0TXV0YXRpb25DYWNoZSgpLm5vdGlmeSh7XG4gICAgICAgIHR5cGU6IFwib2JzZXJ2ZXJPcHRpb25zVXBkYXRlZFwiLFxuICAgICAgICBtdXRhdGlvbjogdGhpcy4jY3VycmVudE11dGF0aW9uLFxuICAgICAgICBvYnNlcnZlcjogdGhpc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwcmV2T3B0aW9ucz8ubXV0YXRpb25LZXkgJiYgdGhpcy5vcHRpb25zLm11dGF0aW9uS2V5ICYmIGhhc2hLZXkocHJldk9wdGlvbnMubXV0YXRpb25LZXkpICE9PSBoYXNoS2V5KHRoaXMub3B0aW9ucy5tdXRhdGlvbktleSkpIHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuI2N1cnJlbnRNdXRhdGlvbj8uc3RhdGUuc3RhdHVzID09PSBcInBlbmRpbmdcIikge1xuICAgICAgdGhpcy4jY3VycmVudE11dGF0aW9uLnNldE9wdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICB9XG4gIH1cbiAgb25VbnN1YnNjcmliZSgpIHtcbiAgICBpZiAoIXRoaXMuaGFzTGlzdGVuZXJzKCkpIHtcbiAgICAgIHRoaXMuI2N1cnJlbnRNdXRhdGlvbj8ucmVtb3ZlT2JzZXJ2ZXIodGhpcyk7XG4gICAgfVxuICB9XG4gIG9uTXV0YXRpb25VcGRhdGUoYWN0aW9uKSB7XG4gICAgdGhpcy4jdXBkYXRlUmVzdWx0KCk7XG4gICAgdGhpcy4jbm90aWZ5KGFjdGlvbik7XG4gIH1cbiAgZ2V0Q3VycmVudFJlc3VsdCgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3VycmVudFJlc3VsdDtcbiAgfVxuICByZXNldCgpIHtcbiAgICB0aGlzLiNjdXJyZW50TXV0YXRpb24/LnJlbW92ZU9ic2VydmVyKHRoaXMpO1xuICAgIHRoaXMuI2N1cnJlbnRNdXRhdGlvbiA9IHZvaWQgMDtcbiAgICB0aGlzLiN1cGRhdGVSZXN1bHQoKTtcbiAgICB0aGlzLiNub3RpZnkoKTtcbiAgfVxuICBtdXRhdGUodmFyaWFibGVzLCBvcHRpb25zKSB7XG4gICAgdGhpcy4jbXV0YXRlT3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy4jY3VycmVudE11dGF0aW9uPy5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbiAgICB0aGlzLiNjdXJyZW50TXV0YXRpb24gPSB0aGlzLiNjbGllbnQuZ2V0TXV0YXRpb25DYWNoZSgpLmJ1aWxkKHRoaXMuI2NsaWVudCwgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLiNjdXJyZW50TXV0YXRpb24uYWRkT2JzZXJ2ZXIodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRNdXRhdGlvbi5leGVjdXRlKHZhcmlhYmxlcyk7XG4gIH1cbiAgI3VwZGF0ZVJlc3VsdCgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuI2N1cnJlbnRNdXRhdGlvbj8uc3RhdGUgPz8gZ2V0RGVmYXVsdFN0YXRlKCk7XG4gICAgdGhpcy4jY3VycmVudFJlc3VsdCA9IHtcbiAgICAgIC4uLnN0YXRlLFxuICAgICAgaXNQZW5kaW5nOiBzdGF0ZS5zdGF0dXMgPT09IFwicGVuZGluZ1wiLFxuICAgICAgaXNTdWNjZXNzOiBzdGF0ZS5zdGF0dXMgPT09IFwic3VjY2Vzc1wiLFxuICAgICAgaXNFcnJvcjogc3RhdGUuc3RhdHVzID09PSBcImVycm9yXCIsXG4gICAgICBpc0lkbGU6IHN0YXRlLnN0YXR1cyA9PT0gXCJpZGxlXCIsXG4gICAgICBtdXRhdGU6IHRoaXMubXV0YXRlLFxuICAgICAgcmVzZXQ6IHRoaXMucmVzZXRcbiAgICB9O1xuICB9XG4gICNub3RpZnkoYWN0aW9uKSB7XG4gICAgbm90aWZ5TWFuYWdlci5iYXRjaCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy4jbXV0YXRlT3B0aW9ucyAmJiB0aGlzLmhhc0xpc3RlbmVycygpKSB7XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IHRoaXMuI2N1cnJlbnRSZXN1bHQudmFyaWFibGVzO1xuICAgICAgICBjb25zdCBvbk11dGF0ZVJlc3VsdCA9IHRoaXMuI2N1cnJlbnRSZXN1bHQuY29udGV4dDtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICBjbGllbnQ6IHRoaXMuI2NsaWVudCxcbiAgICAgICAgICBtZXRhOiB0aGlzLm9wdGlvbnMubWV0YSxcbiAgICAgICAgICBtdXRhdGlvbktleTogdGhpcy5vcHRpb25zLm11dGF0aW9uS2V5XG4gICAgICAgIH07XG4gICAgICAgIGlmIChhY3Rpb24/LnR5cGUgPT09IFwic3VjY2Vzc1wiKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuI211dGF0ZU9wdGlvbnMub25TdWNjZXNzPy4oXG4gICAgICAgICAgICAgIGFjdGlvbi5kYXRhLFxuICAgICAgICAgICAgICB2YXJpYWJsZXMsXG4gICAgICAgICAgICAgIG9uTXV0YXRlUmVzdWx0LFxuICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHZvaWQgUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLiNtdXRhdGVPcHRpb25zLm9uU2V0dGxlZD8uKFxuICAgICAgICAgICAgICBhY3Rpb24uZGF0YSxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgdmFyaWFibGVzLFxuICAgICAgICAgICAgICBvbk11dGF0ZVJlc3VsdCxcbiAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB2b2lkIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24/LnR5cGUgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLiNtdXRhdGVPcHRpb25zLm9uRXJyb3I/LihcbiAgICAgICAgICAgICAgYWN0aW9uLmVycm9yLFxuICAgICAgICAgICAgICB2YXJpYWJsZXMsXG4gICAgICAgICAgICAgIG9uTXV0YXRlUmVzdWx0LFxuICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHZvaWQgUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLiNtdXRhdGVPcHRpb25zLm9uU2V0dGxlZD8uKFxuICAgICAgICAgICAgICB2b2lkIDAsXG4gICAgICAgICAgICAgIGFjdGlvbi5lcnJvcixcbiAgICAgICAgICAgICAgdmFyaWFibGVzLFxuICAgICAgICAgICAgICBvbk11dGF0ZVJlc3VsdCxcbiAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB2b2lkIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIodGhpcy4jY3VycmVudFJlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcbmV4cG9ydCB7XG4gIE11dGF0aW9uT2JzZXJ2ZXJcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tdXRhdGlvbk9ic2VydmVyLmpzLm1hcCIsIi8vIHNyYy9xdWVyaWVzT2JzZXJ2ZXIudHNcbmltcG9ydCB7IG5vdGlmeU1hbmFnZXIgfSBmcm9tIFwiLi9ub3RpZnlNYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBRdWVyeU9ic2VydmVyIH0gZnJvbSBcIi4vcXVlcnlPYnNlcnZlci5qc1wiO1xuaW1wb3J0IHsgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4vc3Vic2NyaWJhYmxlLmpzXCI7XG5pbXBvcnQgeyByZXBsYWNlRXF1YWxEZWVwLCBzaGFsbG93RXF1YWxPYmplY3RzIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcbmZ1bmN0aW9uIGRpZmZlcmVuY2UoYXJyYXkxLCBhcnJheTIpIHtcbiAgY29uc3QgZXhjbHVkZVNldCA9IG5ldyBTZXQoYXJyYXkyKTtcbiAgcmV0dXJuIGFycmF5MS5maWx0ZXIoKHgpID0+ICFleGNsdWRlU2V0Lmhhcyh4KSk7XG59XG5mdW5jdGlvbiByZXBsYWNlQXQoYXJyYXksIGluZGV4LCB2YWx1ZSkge1xuICBjb25zdCBjb3B5ID0gYXJyYXkuc2xpY2UoMCk7XG4gIGNvcHlbaW5kZXhdID0gdmFsdWU7XG4gIHJldHVybiBjb3B5O1xufVxudmFyIFF1ZXJpZXNPYnNlcnZlciA9IGNsYXNzIGV4dGVuZHMgU3Vic2NyaWJhYmxlIHtcbiAgI2NsaWVudDtcbiAgI3Jlc3VsdDtcbiAgI3F1ZXJpZXM7XG4gICNvcHRpb25zO1xuICAjb2JzZXJ2ZXJzO1xuICAjY29tYmluZWRSZXN1bHQ7XG4gICNsYXN0Q29tYmluZTtcbiAgI2xhc3RSZXN1bHQ7XG4gICNsYXN0UXVlcnlIYXNoZXM7XG4gICNvYnNlcnZlck1hdGNoZXMgPSBbXTtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBxdWVyaWVzLCBvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNjbGllbnQgPSBjbGllbnQ7XG4gICAgdGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy4jcXVlcmllcyA9IFtdO1xuICAgIHRoaXMuI29ic2VydmVycyA9IFtdO1xuICAgIHRoaXMuI3Jlc3VsdCA9IFtdO1xuICAgIHRoaXMuc2V0UXVlcmllcyhxdWVyaWVzKTtcbiAgfVxuICBvblN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnMuc2l6ZSA9PT0gMSkge1xuICAgICAgdGhpcy4jb2JzZXJ2ZXJzLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgdGhpcy4jb25VcGRhdGUob2JzZXJ2ZXIsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIG9uVW5zdWJzY3JpYmUoKSB7XG4gICAgaWYgKCF0aGlzLmxpc3RlbmVycy5zaXplKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gICAgdGhpcy4jb2JzZXJ2ZXJzLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICBvYnNlcnZlci5kZXN0cm95KCk7XG4gICAgfSk7XG4gIH1cbiAgc2V0UXVlcmllcyhxdWVyaWVzLCBvcHRpb25zKSB7XG4gICAgdGhpcy4jcXVlcmllcyA9IHF1ZXJpZXM7XG4gICAgdGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgY29uc3QgcXVlcnlIYXNoZXMgPSBxdWVyaWVzLm1hcChcbiAgICAgICAgKHF1ZXJ5KSA9PiB0aGlzLiNjbGllbnQuZGVmYXVsdFF1ZXJ5T3B0aW9ucyhxdWVyeSkucXVlcnlIYXNoXG4gICAgICApO1xuICAgICAgaWYgKG5ldyBTZXQocXVlcnlIYXNoZXMpLnNpemUgIT09IHF1ZXJ5SGFzaGVzLmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgXCJbUXVlcmllc09ic2VydmVyXTogRHVwbGljYXRlIFF1ZXJpZXMgZm91bmQuIFRoaXMgbWlnaHQgcmVzdWx0IGluIHVuZXhwZWN0ZWQgYmVoYXZpb3IuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbm90aWZ5TWFuYWdlci5iYXRjaCgoKSA9PiB7XG4gICAgICBjb25zdCBwcmV2T2JzZXJ2ZXJzID0gdGhpcy4jb2JzZXJ2ZXJzO1xuICAgICAgY29uc3QgbmV3T2JzZXJ2ZXJNYXRjaGVzID0gdGhpcy4jZmluZE1hdGNoaW5nT2JzZXJ2ZXJzKHRoaXMuI3F1ZXJpZXMpO1xuICAgICAgbmV3T2JzZXJ2ZXJNYXRjaGVzLmZvckVhY2goXG4gICAgICAgIChtYXRjaCkgPT4gbWF0Y2gub2JzZXJ2ZXIuc2V0T3B0aW9ucyhtYXRjaC5kZWZhdWx0ZWRRdWVyeU9wdGlvbnMpXG4gICAgICApO1xuICAgICAgY29uc3QgbmV3T2JzZXJ2ZXJzID0gbmV3T2JzZXJ2ZXJNYXRjaGVzLm1hcCgobWF0Y2gpID0+IG1hdGNoLm9ic2VydmVyKTtcbiAgICAgIGNvbnN0IG5ld1Jlc3VsdCA9IG5ld09ic2VydmVycy5tYXAoXG4gICAgICAgIChvYnNlcnZlcikgPT4gb2JzZXJ2ZXIuZ2V0Q3VycmVudFJlc3VsdCgpXG4gICAgICApO1xuICAgICAgY29uc3QgaGFzTGVuZ3RoQ2hhbmdlID0gcHJldk9ic2VydmVycy5sZW5ndGggIT09IG5ld09ic2VydmVycy5sZW5ndGg7XG4gICAgICBjb25zdCBoYXNJbmRleENoYW5nZSA9IG5ld09ic2VydmVycy5zb21lKFxuICAgICAgICAob2JzZXJ2ZXIsIGluZGV4KSA9PiBvYnNlcnZlciAhPT0gcHJldk9ic2VydmVyc1tpbmRleF1cbiAgICAgICk7XG4gICAgICBjb25zdCBoYXNTdHJ1Y3R1cmFsQ2hhbmdlID0gaGFzTGVuZ3RoQ2hhbmdlIHx8IGhhc0luZGV4Q2hhbmdlO1xuICAgICAgY29uc3QgaGFzUmVzdWx0Q2hhbmdlID0gaGFzU3RydWN0dXJhbENoYW5nZSA/IHRydWUgOiBuZXdSZXN1bHQuc29tZSgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBwcmV2ID0gdGhpcy4jcmVzdWx0W2luZGV4XTtcbiAgICAgICAgcmV0dXJuICFwcmV2IHx8ICFzaGFsbG93RXF1YWxPYmplY3RzKHJlc3VsdCwgcHJldik7XG4gICAgICB9KTtcbiAgICAgIGlmICghaGFzU3RydWN0dXJhbENoYW5nZSAmJiAhaGFzUmVzdWx0Q2hhbmdlKSByZXR1cm47XG4gICAgICBpZiAoaGFzU3RydWN0dXJhbENoYW5nZSkge1xuICAgICAgICB0aGlzLiNvYnNlcnZlck1hdGNoZXMgPSBuZXdPYnNlcnZlck1hdGNoZXM7XG4gICAgICAgIHRoaXMuI29ic2VydmVycyA9IG5ld09ic2VydmVycztcbiAgICAgIH1cbiAgICAgIHRoaXMuI3Jlc3VsdCA9IG5ld1Jlc3VsdDtcbiAgICAgIGlmICghdGhpcy5oYXNMaXN0ZW5lcnMoKSkgcmV0dXJuO1xuICAgICAgaWYgKGhhc1N0cnVjdHVyYWxDaGFuZ2UpIHtcbiAgICAgICAgZGlmZmVyZW5jZShwcmV2T2JzZXJ2ZXJzLCBuZXdPYnNlcnZlcnMpLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgb2JzZXJ2ZXIuZGVzdHJveSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGlmZmVyZW5jZShuZXdPYnNlcnZlcnMsIHByZXZPYnNlcnZlcnMpLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgb2JzZXJ2ZXIuc3Vic2NyaWJlKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuI29uVXBkYXRlKG9ic2VydmVyLCByZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI25vdGlmeSgpO1xuICAgIH0pO1xuICB9XG4gIGdldEN1cnJlbnRSZXN1bHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3VsdDtcbiAgfVxuICBnZXRRdWVyaWVzKCkge1xuICAgIHJldHVybiB0aGlzLiNvYnNlcnZlcnMubWFwKChvYnNlcnZlcikgPT4gb2JzZXJ2ZXIuZ2V0Q3VycmVudFF1ZXJ5KCkpO1xuICB9XG4gIGdldE9ic2VydmVycygpIHtcbiAgICByZXR1cm4gdGhpcy4jb2JzZXJ2ZXJzO1xuICB9XG4gIGdldE9wdGltaXN0aWNSZXN1bHQocXVlcmllcywgY29tYmluZSkge1xuICAgIGNvbnN0IG1hdGNoZXMgPSB0aGlzLiNmaW5kTWF0Y2hpbmdPYnNlcnZlcnMocXVlcmllcyk7XG4gICAgY29uc3QgcmVzdWx0ID0gbWF0Y2hlcy5tYXAoXG4gICAgICAobWF0Y2gpID0+IG1hdGNoLm9ic2VydmVyLmdldE9wdGltaXN0aWNSZXN1bHQobWF0Y2guZGVmYXVsdGVkUXVlcnlPcHRpb25zKVxuICAgICk7XG4gICAgY29uc3QgcXVlcnlIYXNoZXMgPSBtYXRjaGVzLm1hcChcbiAgICAgIChtYXRjaCkgPT4gbWF0Y2guZGVmYXVsdGVkUXVlcnlPcHRpb25zLnF1ZXJ5SGFzaFxuICAgICk7XG4gICAgcmV0dXJuIFtcbiAgICAgIHJlc3VsdCxcbiAgICAgIChyKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLiNjb21iaW5lUmVzdWx0KHIgPz8gcmVzdWx0LCBjb21iaW5lLCBxdWVyeUhhc2hlcyk7XG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdHJhY2tSZXN1bHQocmVzdWx0LCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICBdO1xuICB9XG4gICN0cmFja1Jlc3VsdChyZXN1bHQsIG1hdGNoZXMpIHtcbiAgICByZXR1cm4gbWF0Y2hlcy5tYXAoKG1hdGNoLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qgb2JzZXJ2ZXJSZXN1bHQgPSByZXN1bHRbaW5kZXhdO1xuICAgICAgcmV0dXJuICFtYXRjaC5kZWZhdWx0ZWRRdWVyeU9wdGlvbnMubm90aWZ5T25DaGFuZ2VQcm9wcyA/IG1hdGNoLm9ic2VydmVyLnRyYWNrUmVzdWx0KG9ic2VydmVyUmVzdWx0LCAoYWNjZXNzZWRQcm9wKSA9PiB7XG4gICAgICAgIG1hdGNoZXMuZm9yRWFjaCgobSkgPT4ge1xuICAgICAgICAgIG0ub2JzZXJ2ZXIudHJhY2tQcm9wKGFjY2Vzc2VkUHJvcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSkgOiBvYnNlcnZlclJlc3VsdDtcbiAgICB9KTtcbiAgfVxuICAjY29tYmluZVJlc3VsdChpbnB1dCwgY29tYmluZSwgcXVlcnlIYXNoZXMpIHtcbiAgICBpZiAoY29tYmluZSkge1xuICAgICAgY29uc3QgbGFzdEhhc2hlcyA9IHRoaXMuI2xhc3RRdWVyeUhhc2hlcztcbiAgICAgIGNvbnN0IHF1ZXJ5SGFzaGVzQ2hhbmdlZCA9IHF1ZXJ5SGFzaGVzICE9PSB2b2lkIDAgJiYgbGFzdEhhc2hlcyAhPT0gdm9pZCAwICYmIChsYXN0SGFzaGVzLmxlbmd0aCAhPT0gcXVlcnlIYXNoZXMubGVuZ3RoIHx8IHF1ZXJ5SGFzaGVzLnNvbWUoKGhhc2gsIGkpID0+IGhhc2ggIT09IGxhc3RIYXNoZXNbaV0pKTtcbiAgICAgIGlmICghdGhpcy4jY29tYmluZWRSZXN1bHQgfHwgdGhpcy4jcmVzdWx0ICE9PSB0aGlzLiNsYXN0UmVzdWx0IHx8IHF1ZXJ5SGFzaGVzQ2hhbmdlZCB8fCBjb21iaW5lICE9PSB0aGlzLiNsYXN0Q29tYmluZSkge1xuICAgICAgICB0aGlzLiNsYXN0Q29tYmluZSA9IGNvbWJpbmU7XG4gICAgICAgIHRoaXMuI2xhc3RSZXN1bHQgPSB0aGlzLiNyZXN1bHQ7XG4gICAgICAgIGlmIChxdWVyeUhhc2hlcyAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgdGhpcy4jbGFzdFF1ZXJ5SGFzaGVzID0gcXVlcnlIYXNoZXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jY29tYmluZWRSZXN1bHQgPSByZXBsYWNlRXF1YWxEZWVwKFxuICAgICAgICAgIHRoaXMuI2NvbWJpbmVkUmVzdWx0LFxuICAgICAgICAgIGNvbWJpbmUoaW5wdXQpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4jY29tYmluZWRSZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dDtcbiAgfVxuICAjc2hvdWxkU2tpcENvbWJpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29wdGlvbnM/LmNvbWJpbmUgIT09IHZvaWQgMCAmJiB0aGlzLiNvYnNlcnZlcnMuc29tZSgob2JzZXJ2ZXIsIGluZGV4KSA9PiB7XG4gICAgICByZXR1cm4gb2JzZXJ2ZXIub3B0aW9ucy5zdXNwZW5zZSAmJiB0aGlzLiNyZXN1bHRbaW5kZXhdPy5kYXRhID09PSB2b2lkIDA7XG4gICAgfSk7XG4gIH1cbiAgI2ZpbmRNYXRjaGluZ09ic2VydmVycyhxdWVyaWVzKSB7XG4gICAgY29uc3QgcHJldk9ic2VydmVyc01hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gICAgdGhpcy4jb2JzZXJ2ZXJzLmZvckVhY2goKG9ic2VydmVyKSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSBvYnNlcnZlci5vcHRpb25zLnF1ZXJ5SGFzaDtcbiAgICAgIGlmICgha2V5KSByZXR1cm47XG4gICAgICBjb25zdCBwcmV2aW91c09ic2VydmVycyA9IHByZXZPYnNlcnZlcnNNYXAuZ2V0KGtleSk7XG4gICAgICBpZiAocHJldmlvdXNPYnNlcnZlcnMpIHtcbiAgICAgICAgcHJldmlvdXNPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2T2JzZXJ2ZXJzTWFwLnNldChrZXksIFtvYnNlcnZlcl0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IG9ic2VydmVycyA9IFtdO1xuICAgIHF1ZXJpZXMuZm9yRWFjaCgob3B0aW9ucykgPT4ge1xuICAgICAgY29uc3QgZGVmYXVsdGVkT3B0aW9ucyA9IHRoaXMuI2NsaWVudC5kZWZhdWx0UXVlcnlPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgY29uc3QgbWF0Y2ggPSBwcmV2T2JzZXJ2ZXJzTWFwLmdldChkZWZhdWx0ZWRPcHRpb25zLnF1ZXJ5SGFzaCk/LnNoaWZ0KCk7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IG1hdGNoID8/IG5ldyBRdWVyeU9ic2VydmVyKHRoaXMuI2NsaWVudCwgZGVmYXVsdGVkT3B0aW9ucyk7XG4gICAgICBvYnNlcnZlcnMucHVzaCh7XG4gICAgICAgIGRlZmF1bHRlZFF1ZXJ5T3B0aW9uczogZGVmYXVsdGVkT3B0aW9ucyxcbiAgICAgICAgb2JzZXJ2ZXJcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBvYnNlcnZlcnM7XG4gIH1cbiAgI29uVXBkYXRlKG9ic2VydmVyLCByZXN1bHQpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuI29ic2VydmVycy5pbmRleE9mKG9ic2VydmVyKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLiNyZXN1bHQgPSByZXBsYWNlQXQodGhpcy4jcmVzdWx0LCBpbmRleCwgcmVzdWx0KTtcbiAgICAgIHRoaXMuI25vdGlmeSgpO1xuICAgIH1cbiAgfVxuICAjbm90aWZ5KCkge1xuICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycygpKSB7XG4gICAgICBjb25zdCBuZXdUcmFja2VkID0gdGhpcy4jdHJhY2tSZXN1bHQodGhpcy4jcmVzdWx0LCB0aGlzLiNvYnNlcnZlck1hdGNoZXMpO1xuICAgICAgY29uc3Qgc2hvdWxkU2tpcENvbWJpbmUgPSB0aGlzLiNzaG91bGRTa2lwQ29tYmluZSgpO1xuICAgICAgY29uc3QgcHJldmlvdXNSZXN1bHQgPSB0aGlzLiNjb21iaW5lZFJlc3VsdDtcbiAgICAgIGNvbnN0IG5ld1Jlc3VsdCA9IHNob3VsZFNraXBDb21iaW5lID8gcHJldmlvdXNSZXN1bHQgOiB0aGlzLiNjb21iaW5lUmVzdWx0KG5ld1RyYWNrZWQsIHRoaXMuI29wdGlvbnM/LmNvbWJpbmUpO1xuICAgICAgaWYgKHNob3VsZFNraXBDb21iaW5lIHx8IHByZXZpb3VzUmVzdWx0ICE9PSBuZXdSZXN1bHQpIHtcbiAgICAgICAgbm90aWZ5TWFuYWdlci5iYXRjaCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKHRoaXMuI3Jlc3VsdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbmV4cG9ydCB7XG4gIFF1ZXJpZXNPYnNlcnZlclxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJpZXNPYnNlcnZlci5qcy5tYXAiLCIvLyBzcmMvcXVlcnlDYWNoZS50c1xuaW1wb3J0IHsgaGFzaFF1ZXJ5S2V5QnlPcHRpb25zLCBtYXRjaFF1ZXJ5IH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcbmltcG9ydCB7IFF1ZXJ5IH0gZnJvbSBcIi4vcXVlcnkuanNcIjtcbmltcG9ydCB7IG5vdGlmeU1hbmFnZXIgfSBmcm9tIFwiLi9ub3RpZnlNYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi9zdWJzY3JpYmFibGUuanNcIjtcbnZhciBRdWVyeUNhY2hlID0gY2xhc3MgZXh0ZW5kcyBTdWJzY3JpYmFibGUge1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4jcXVlcmllcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIH1cbiAgI3F1ZXJpZXM7XG4gIGJ1aWxkKGNsaWVudCwgb3B0aW9ucywgc3RhdGUpIHtcbiAgICBjb25zdCBxdWVyeUtleSA9IG9wdGlvbnMucXVlcnlLZXk7XG4gICAgY29uc3QgcXVlcnlIYXNoID0gb3B0aW9ucy5xdWVyeUhhc2ggPz8gaGFzaFF1ZXJ5S2V5QnlPcHRpb25zKHF1ZXJ5S2V5LCBvcHRpb25zKTtcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmdldChxdWVyeUhhc2gpO1xuICAgIGlmICghcXVlcnkpIHtcbiAgICAgIHF1ZXJ5ID0gbmV3IFF1ZXJ5KHtcbiAgICAgICAgY2xpZW50LFxuICAgICAgICBxdWVyeUtleSxcbiAgICAgICAgcXVlcnlIYXNoLFxuICAgICAgICBvcHRpb25zOiBjbGllbnQuZGVmYXVsdFF1ZXJ5T3B0aW9ucyhvcHRpb25zKSxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlZmF1bHRPcHRpb25zOiBjbGllbnQuZ2V0UXVlcnlEZWZhdWx0cyhxdWVyeUtleSlcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hZGQocXVlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgYWRkKHF1ZXJ5KSB7XG4gICAgaWYgKCF0aGlzLiNxdWVyaWVzLmhhcyhxdWVyeS5xdWVyeUhhc2gpKSB7XG4gICAgICB0aGlzLiNxdWVyaWVzLnNldChxdWVyeS5xdWVyeUhhc2gsIHF1ZXJ5KTtcbiAgICAgIHRoaXMubm90aWZ5KHtcbiAgICAgICAgdHlwZTogXCJhZGRlZFwiLFxuICAgICAgICBxdWVyeVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJlbW92ZShxdWVyeSkge1xuICAgIGNvbnN0IHF1ZXJ5SW5NYXAgPSB0aGlzLiNxdWVyaWVzLmdldChxdWVyeS5xdWVyeUhhc2gpO1xuICAgIGlmIChxdWVyeUluTWFwKSB7XG4gICAgICBxdWVyeS5kZXN0cm95KCk7XG4gICAgICBpZiAocXVlcnlJbk1hcCA9PT0gcXVlcnkpIHtcbiAgICAgICAgdGhpcy4jcXVlcmllcy5kZWxldGUocXVlcnkucXVlcnlIYXNoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubm90aWZ5KHsgdHlwZTogXCJyZW1vdmVkXCIsIHF1ZXJ5IH0pO1xuICAgIH1cbiAgfVxuICBjbGVhcigpIHtcbiAgICBub3RpZnlNYW5hZ2VyLmJhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMuZ2V0QWxsKCkuZm9yRWFjaCgocXVlcnkpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmUocXVlcnkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZ2V0KHF1ZXJ5SGFzaCkge1xuICAgIHJldHVybiB0aGlzLiNxdWVyaWVzLmdldChxdWVyeUhhc2gpO1xuICB9XG4gIGdldEFsbCgpIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuI3F1ZXJpZXMudmFsdWVzKCldO1xuICB9XG4gIGZpbmQoZmlsdGVycykge1xuICAgIGNvbnN0IGRlZmF1bHRlZEZpbHRlcnMgPSB7IGV4YWN0OiB0cnVlLCAuLi5maWx0ZXJzIH07XG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsKCkuZmluZChcbiAgICAgIChxdWVyeSkgPT4gbWF0Y2hRdWVyeShkZWZhdWx0ZWRGaWx0ZXJzLCBxdWVyeSlcbiAgICApO1xuICB9XG4gIGZpbmRBbGwoZmlsdGVycyA9IHt9KSB7XG4gICAgY29uc3QgcXVlcmllcyA9IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGZpbHRlcnMpLmxlbmd0aCA+IDAgPyBxdWVyaWVzLmZpbHRlcigocXVlcnkpID0+IG1hdGNoUXVlcnkoZmlsdGVycywgcXVlcnkpKSA6IHF1ZXJpZXM7XG4gIH1cbiAgbm90aWZ5KGV2ZW50KSB7XG4gICAgbm90aWZ5TWFuYWdlci5iYXRjaCgoKSA9PiB7XG4gICAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgICBsaXN0ZW5lcihldmVudCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBvbkZvY3VzKCkge1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgdGhpcy5nZXRBbGwoKS5mb3JFYWNoKChxdWVyeSkgPT4ge1xuICAgICAgICBxdWVyeS5vbkZvY3VzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBvbk9ubGluZSgpIHtcbiAgICBub3RpZnlNYW5hZ2VyLmJhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMuZ2V0QWxsKCkuZm9yRWFjaCgocXVlcnkpID0+IHtcbiAgICAgICAgcXVlcnkub25PbmxpbmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59O1xuZXhwb3J0IHtcbiAgUXVlcnlDYWNoZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5Q2FjaGUuanMubWFwIiwiLy8gc3JjL3F1ZXJ5Q2xpZW50LnRzXG5pbXBvcnQge1xuICBmdW5jdGlvbmFsVXBkYXRlLFxuICBoYXNoS2V5LFxuICBoYXNoUXVlcnlLZXlCeU9wdGlvbnMsXG4gIG5vb3AsXG4gIHBhcnRpYWxNYXRjaEtleSxcbiAgcmVzb2x2ZVN0YWxlVGltZSxcbiAgc2tpcFRva2VuXG59IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5pbXBvcnQgeyBRdWVyeUNhY2hlIH0gZnJvbSBcIi4vcXVlcnlDYWNoZS5qc1wiO1xuaW1wb3J0IHsgTXV0YXRpb25DYWNoZSB9IGZyb20gXCIuL211dGF0aW9uQ2FjaGUuanNcIjtcbmltcG9ydCB7IGZvY3VzTWFuYWdlciB9IGZyb20gXCIuL2ZvY3VzTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgb25saW5lTWFuYWdlciB9IGZyb20gXCIuL29ubGluZU1hbmFnZXIuanNcIjtcbmltcG9ydCB7IG5vdGlmeU1hbmFnZXIgfSBmcm9tIFwiLi9ub3RpZnlNYW5hZ2VyLmpzXCI7XG52YXIgUXVlcnlDbGllbnQgPSBjbGFzcyB7XG4gICNxdWVyeUNhY2hlO1xuICAjbXV0YXRpb25DYWNoZTtcbiAgI2RlZmF1bHRPcHRpb25zO1xuICAjcXVlcnlEZWZhdWx0cztcbiAgI211dGF0aW9uRGVmYXVsdHM7XG4gICNtb3VudENvdW50O1xuICAjdW5zdWJzY3JpYmVGb2N1cztcbiAgI3Vuc3Vic2NyaWJlT25saW5lO1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIHRoaXMuI3F1ZXJ5Q2FjaGUgPSBjb25maWcucXVlcnlDYWNoZSB8fCBuZXcgUXVlcnlDYWNoZSgpO1xuICAgIHRoaXMuI211dGF0aW9uQ2FjaGUgPSBjb25maWcubXV0YXRpb25DYWNoZSB8fCBuZXcgTXV0YXRpb25DYWNoZSgpO1xuICAgIHRoaXMuI2RlZmF1bHRPcHRpb25zID0gY29uZmlnLmRlZmF1bHRPcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuI3F1ZXJ5RGVmYXVsdHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgIHRoaXMuI211dGF0aW9uRGVmYXVsdHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgIHRoaXMuI21vdW50Q291bnQgPSAwO1xuICB9XG4gIG1vdW50KCkge1xuICAgIHRoaXMuI21vdW50Q291bnQrKztcbiAgICBpZiAodGhpcy4jbW91bnRDb3VudCAhPT0gMSkgcmV0dXJuO1xuICAgIHRoaXMuI3Vuc3Vic2NyaWJlRm9jdXMgPSBmb2N1c01hbmFnZXIuc3Vic2NyaWJlKGFzeW5jIChmb2N1c2VkKSA9PiB7XG4gICAgICBpZiAoZm9jdXNlZCkge1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3VtZVBhdXNlZE11dGF0aW9ucygpO1xuICAgICAgICB0aGlzLiNxdWVyeUNhY2hlLm9uRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiN1bnN1YnNjcmliZU9ubGluZSA9IG9ubGluZU1hbmFnZXIuc3Vic2NyaWJlKGFzeW5jIChvbmxpbmUpID0+IHtcbiAgICAgIGlmIChvbmxpbmUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN1bWVQYXVzZWRNdXRhdGlvbnMoKTtcbiAgICAgICAgdGhpcy4jcXVlcnlDYWNoZS5vbk9ubGluZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHVubW91bnQoKSB7XG4gICAgdGhpcy4jbW91bnRDb3VudC0tO1xuICAgIGlmICh0aGlzLiNtb3VudENvdW50ICE9PSAwKSByZXR1cm47XG4gICAgdGhpcy4jdW5zdWJzY3JpYmVGb2N1cz8uKCk7XG4gICAgdGhpcy4jdW5zdWJzY3JpYmVGb2N1cyA9IHZvaWQgMDtcbiAgICB0aGlzLiN1bnN1YnNjcmliZU9ubGluZT8uKCk7XG4gICAgdGhpcy4jdW5zdWJzY3JpYmVPbmxpbmUgPSB2b2lkIDA7XG4gIH1cbiAgaXNGZXRjaGluZyhmaWx0ZXJzKSB7XG4gICAgcmV0dXJuIHRoaXMuI3F1ZXJ5Q2FjaGUuZmluZEFsbCh7IC4uLmZpbHRlcnMsIGZldGNoU3RhdHVzOiBcImZldGNoaW5nXCIgfSkubGVuZ3RoO1xuICB9XG4gIGlzTXV0YXRpbmcoZmlsdGVycykge1xuICAgIHJldHVybiB0aGlzLiNtdXRhdGlvbkNhY2hlLmZpbmRBbGwoeyAuLi5maWx0ZXJzLCBzdGF0dXM6IFwicGVuZGluZ1wiIH0pLmxlbmd0aDtcbiAgfVxuICAvKipcbiAgICogSW1wZXJhdGl2ZSAobm9uLXJlYWN0aXZlKSB3YXkgdG8gcmV0cmlldmUgZGF0YSBmb3IgYSBRdWVyeUtleS5cbiAgICogU2hvdWxkIG9ubHkgYmUgdXNlZCBpbiBjYWxsYmFja3Mgb3IgZnVuY3Rpb25zIHdoZXJlIHJlYWRpbmcgdGhlIGxhdGVzdCBkYXRhIGlzIG5lY2Vzc2FyeSwgZS5nLiBmb3Igb3B0aW1pc3RpYyB1cGRhdGVzLlxuICAgKlxuICAgKiBIaW50OiBEbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gaW5zaWRlIGEgY29tcG9uZW50LCBiZWNhdXNlIGl0IHdvbid0IHJlY2VpdmUgdXBkYXRlcy5cbiAgICogVXNlIGB1c2VRdWVyeWAgdG8gY3JlYXRlIGEgYFF1ZXJ5T2JzZXJ2ZXJgIHRoYXQgc3Vic2NyaWJlcyB0byBjaGFuZ2VzLlxuICAgKi9cbiAgZ2V0UXVlcnlEYXRhKHF1ZXJ5S2V5KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZGVmYXVsdFF1ZXJ5T3B0aW9ucyh7IHF1ZXJ5S2V5IH0pO1xuICAgIHJldHVybiB0aGlzLiNxdWVyeUNhY2hlLmdldChvcHRpb25zLnF1ZXJ5SGFzaCk/LnN0YXRlLmRhdGE7XG4gIH1cbiAgZW5zdXJlUXVlcnlEYXRhKG9wdGlvbnMpIHtcbiAgICBjb25zdCBkZWZhdWx0ZWRPcHRpb25zID0gdGhpcy5kZWZhdWx0UXVlcnlPcHRpb25zKG9wdGlvbnMpO1xuICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy4jcXVlcnlDYWNoZS5idWlsZCh0aGlzLCBkZWZhdWx0ZWRPcHRpb25zKTtcbiAgICBjb25zdCBjYWNoZWREYXRhID0gcXVlcnkuc3RhdGUuZGF0YTtcbiAgICBpZiAoY2FjaGVkRGF0YSA9PT0gdm9pZCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5mZXRjaFF1ZXJ5KG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5yZXZhbGlkYXRlSWZTdGFsZSAmJiBxdWVyeS5pc1N0YWxlQnlUaW1lKHJlc29sdmVTdGFsZVRpbWUoZGVmYXVsdGVkT3B0aW9ucy5zdGFsZVRpbWUsIHF1ZXJ5KSkpIHtcbiAgICAgIHZvaWQgdGhpcy5wcmVmZXRjaFF1ZXJ5KGRlZmF1bHRlZE9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlZERhdGEpO1xuICB9XG4gIGdldFF1ZXJpZXNEYXRhKGZpbHRlcnMpIHtcbiAgICByZXR1cm4gdGhpcy4jcXVlcnlDYWNoZS5maW5kQWxsKGZpbHRlcnMpLm1hcCgoeyBxdWVyeUtleSwgc3RhdGUgfSkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHN0YXRlLmRhdGE7XG4gICAgICByZXR1cm4gW3F1ZXJ5S2V5LCBkYXRhXTtcbiAgICB9KTtcbiAgfVxuICBzZXRRdWVyeURhdGEocXVlcnlLZXksIHVwZGF0ZXIsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBkZWZhdWx0ZWRPcHRpb25zID0gdGhpcy5kZWZhdWx0UXVlcnlPcHRpb25zKHsgcXVlcnlLZXkgfSk7XG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLiNxdWVyeUNhY2hlLmdldChcbiAgICAgIGRlZmF1bHRlZE9wdGlvbnMucXVlcnlIYXNoXG4gICAgKTtcbiAgICBjb25zdCBwcmV2RGF0YSA9IHF1ZXJ5Py5zdGF0ZS5kYXRhO1xuICAgIGNvbnN0IGRhdGEgPSBmdW5jdGlvbmFsVXBkYXRlKHVwZGF0ZXIsIHByZXZEYXRhKTtcbiAgICBpZiAoZGF0YSA9PT0gdm9pZCAwKSB7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jcXVlcnlDYWNoZS5idWlsZCh0aGlzLCBkZWZhdWx0ZWRPcHRpb25zKS5zZXREYXRhKGRhdGEsIHsgLi4ub3B0aW9ucywgbWFudWFsOiB0cnVlIH0pO1xuICB9XG4gIHNldFF1ZXJpZXNEYXRhKGZpbHRlcnMsIHVwZGF0ZXIsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbm90aWZ5TWFuYWdlci5iYXRjaChcbiAgICAgICgpID0+IHRoaXMuI3F1ZXJ5Q2FjaGUuZmluZEFsbChmaWx0ZXJzKS5tYXAoKHsgcXVlcnlLZXkgfSkgPT4gW1xuICAgICAgICBxdWVyeUtleSxcbiAgICAgICAgdGhpcy5zZXRRdWVyeURhdGEocXVlcnlLZXksIHVwZGF0ZXIsIG9wdGlvbnMpXG4gICAgICBdKVxuICAgICk7XG4gIH1cbiAgZ2V0UXVlcnlTdGF0ZShxdWVyeUtleSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmRlZmF1bHRRdWVyeU9wdGlvbnMoeyBxdWVyeUtleSB9KTtcbiAgICByZXR1cm4gdGhpcy4jcXVlcnlDYWNoZS5nZXQoXG4gICAgICBvcHRpb25zLnF1ZXJ5SGFzaFxuICAgICk/LnN0YXRlO1xuICB9XG4gIHJlbW92ZVF1ZXJpZXMoZmlsdGVycykge1xuICAgIGNvbnN0IHF1ZXJ5Q2FjaGUgPSB0aGlzLiNxdWVyeUNhY2hlO1xuICAgIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgcXVlcnlDYWNoZS5maW5kQWxsKGZpbHRlcnMpLmZvckVhY2goKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHF1ZXJ5Q2FjaGUucmVtb3ZlKHF1ZXJ5KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHJlc2V0UXVlcmllcyhmaWx0ZXJzLCBvcHRpb25zKSB7XG4gICAgY29uc3QgcXVlcnlDYWNoZSA9IHRoaXMuI3F1ZXJ5Q2FjaGU7XG4gICAgcmV0dXJuIG5vdGlmeU1hbmFnZXIuYmF0Y2goKCkgPT4ge1xuICAgICAgcXVlcnlDYWNoZS5maW5kQWxsKGZpbHRlcnMpLmZvckVhY2goKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHF1ZXJ5LnJlc2V0KCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLnJlZmV0Y2hRdWVyaWVzKFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogXCJhY3RpdmVcIixcbiAgICAgICAgICAuLi5maWx0ZXJzXG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnNcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgY2FuY2VsUXVlcmllcyhmaWx0ZXJzLCBjYW5jZWxPcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBkZWZhdWx0ZWRDYW5jZWxPcHRpb25zID0geyByZXZlcnQ6IHRydWUsIC4uLmNhbmNlbE9wdGlvbnMgfTtcbiAgICBjb25zdCBwcm9taXNlcyA9IG5vdGlmeU1hbmFnZXIuYmF0Y2goXG4gICAgICAoKSA9PiB0aGlzLiNxdWVyeUNhY2hlLmZpbmRBbGwoZmlsdGVycykubWFwKChxdWVyeSkgPT4gcXVlcnkuY2FuY2VsKGRlZmF1bHRlZENhbmNlbE9wdGlvbnMpKVxuICAgICk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKG5vb3ApLmNhdGNoKG5vb3ApO1xuICB9XG4gIGludmFsaWRhdGVRdWVyaWVzKGZpbHRlcnMsIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBub3RpZnlNYW5hZ2VyLmJhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMuI3F1ZXJ5Q2FjaGUuZmluZEFsbChmaWx0ZXJzKS5mb3JFYWNoKChxdWVyeSkgPT4ge1xuICAgICAgICBxdWVyeS5pbnZhbGlkYXRlKCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChmaWx0ZXJzPy5yZWZldGNoVHlwZSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucmVmZXRjaFF1ZXJpZXMoXG4gICAgICAgIHtcbiAgICAgICAgICAuLi5maWx0ZXJzLFxuICAgICAgICAgIHR5cGU6IGZpbHRlcnM/LnJlZmV0Y2hUeXBlID8/IGZpbHRlcnM/LnR5cGUgPz8gXCJhY3RpdmVcIlxuICAgICAgICB9LFxuICAgICAgICBvcHRpb25zXG4gICAgICApO1xuICAgIH0pO1xuICB9XG4gIHJlZmV0Y2hRdWVyaWVzKGZpbHRlcnMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGZldGNoT3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBjYW5jZWxSZWZldGNoOiBvcHRpb25zLmNhbmNlbFJlZmV0Y2ggPz8gdHJ1ZVxuICAgIH07XG4gICAgY29uc3QgcHJvbWlzZXMgPSBub3RpZnlNYW5hZ2VyLmJhdGNoKFxuICAgICAgKCkgPT4gdGhpcy4jcXVlcnlDYWNoZS5maW5kQWxsKGZpbHRlcnMpLmZpbHRlcigocXVlcnkpID0+ICFxdWVyeS5pc0Rpc2FibGVkKCkgJiYgIXF1ZXJ5LmlzU3RhdGljKCkpLm1hcCgocXVlcnkpID0+IHtcbiAgICAgICAgbGV0IHByb21pc2UgPSBxdWVyeS5mZXRjaCh2b2lkIDAsIGZldGNoT3B0aW9ucyk7XG4gICAgICAgIGlmICghZmV0Y2hPcHRpb25zLnRocm93T25FcnJvcikge1xuICAgICAgICAgIHByb21pc2UgPSBwcm9taXNlLmNhdGNoKG5vb3ApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBxdWVyeS5zdGF0ZS5mZXRjaFN0YXR1cyA9PT0gXCJwYXVzZWRcIiA/IFByb21pc2UucmVzb2x2ZSgpIDogcHJvbWlzZTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4obm9vcCk7XG4gIH1cbiAgZmV0Y2hRdWVyeShvcHRpb25zKSB7XG4gICAgY29uc3QgZGVmYXVsdGVkT3B0aW9ucyA9IHRoaXMuZGVmYXVsdFF1ZXJ5T3B0aW9ucyhvcHRpb25zKTtcbiAgICBpZiAoZGVmYXVsdGVkT3B0aW9ucy5yZXRyeSA9PT0gdm9pZCAwKSB7XG4gICAgICBkZWZhdWx0ZWRPcHRpb25zLnJldHJ5ID0gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy4jcXVlcnlDYWNoZS5idWlsZCh0aGlzLCBkZWZhdWx0ZWRPcHRpb25zKTtcbiAgICByZXR1cm4gcXVlcnkuaXNTdGFsZUJ5VGltZShcbiAgICAgIHJlc29sdmVTdGFsZVRpbWUoZGVmYXVsdGVkT3B0aW9ucy5zdGFsZVRpbWUsIHF1ZXJ5KVxuICAgICkgPyBxdWVyeS5mZXRjaChkZWZhdWx0ZWRPcHRpb25zKSA6IFByb21pc2UucmVzb2x2ZShxdWVyeS5zdGF0ZS5kYXRhKTtcbiAgfVxuICBwcmVmZXRjaFF1ZXJ5KG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5mZXRjaFF1ZXJ5KG9wdGlvbnMpLnRoZW4obm9vcCkuY2F0Y2gobm9vcCk7XG4gIH1cbiAgZmV0Y2hJbmZpbml0ZVF1ZXJ5KG9wdGlvbnMpIHtcbiAgICBvcHRpb25zLl90eXBlID0gXCJpbmZpbml0ZVwiO1xuICAgIHJldHVybiB0aGlzLmZldGNoUXVlcnkob3B0aW9ucyk7XG4gIH1cbiAgcHJlZmV0Y2hJbmZpbml0ZVF1ZXJ5KG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5mZXRjaEluZmluaXRlUXVlcnkob3B0aW9ucykudGhlbihub29wKS5jYXRjaChub29wKTtcbiAgfVxuICBlbnN1cmVJbmZpbml0ZVF1ZXJ5RGF0YShvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5fdHlwZSA9IFwiaW5maW5pdGVcIjtcbiAgICByZXR1cm4gdGhpcy5lbnN1cmVRdWVyeURhdGEob3B0aW9ucyk7XG4gIH1cbiAgcmVzdW1lUGF1c2VkTXV0YXRpb25zKCkge1xuICAgIGlmIChvbmxpbmVNYW5hZ2VyLmlzT25saW5lKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLiNtdXRhdGlvbkNhY2hlLnJlc3VtZVBhdXNlZE11dGF0aW9ucygpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgZ2V0UXVlcnlDYWNoZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jcXVlcnlDYWNoZTtcbiAgfVxuICBnZXRNdXRhdGlvbkNhY2hlKCkge1xuICAgIHJldHVybiB0aGlzLiNtdXRhdGlvbkNhY2hlO1xuICB9XG4gIGdldERlZmF1bHRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLiNkZWZhdWx0T3B0aW9ucztcbiAgfVxuICBzZXREZWZhdWx0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgdGhpcy4jZGVmYXVsdE9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG4gIHNldFF1ZXJ5RGVmYXVsdHMocXVlcnlLZXksIG9wdGlvbnMpIHtcbiAgICB0aGlzLiNxdWVyeURlZmF1bHRzLnNldChoYXNoS2V5KHF1ZXJ5S2V5KSwge1xuICAgICAgcXVlcnlLZXksXG4gICAgICBkZWZhdWx0T3B0aW9uczogb3B0aW9uc1xuICAgIH0pO1xuICB9XG4gIGdldFF1ZXJ5RGVmYXVsdHMocXVlcnlLZXkpIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IFsuLi50aGlzLiNxdWVyeURlZmF1bHRzLnZhbHVlcygpXTtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBkZWZhdWx0cy5mb3JFYWNoKChxdWVyeURlZmF1bHQpID0+IHtcbiAgICAgIGlmIChwYXJ0aWFsTWF0Y2hLZXkocXVlcnlLZXksIHF1ZXJ5RGVmYXVsdC5xdWVyeUtleSkpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIHF1ZXJ5RGVmYXVsdC5kZWZhdWx0T3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBzZXRNdXRhdGlvbkRlZmF1bHRzKG11dGF0aW9uS2V5LCBvcHRpb25zKSB7XG4gICAgdGhpcy4jbXV0YXRpb25EZWZhdWx0cy5zZXQoaGFzaEtleShtdXRhdGlvbktleSksIHtcbiAgICAgIG11dGF0aW9uS2V5LFxuICAgICAgZGVmYXVsdE9wdGlvbnM6IG9wdGlvbnNcbiAgICB9KTtcbiAgfVxuICBnZXRNdXRhdGlvbkRlZmF1bHRzKG11dGF0aW9uS2V5KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSBbLi4udGhpcy4jbXV0YXRpb25EZWZhdWx0cy52YWx1ZXMoKV07XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZGVmYXVsdHMuZm9yRWFjaCgocXVlcnlEZWZhdWx0KSA9PiB7XG4gICAgICBpZiAocGFydGlhbE1hdGNoS2V5KG11dGF0aW9uS2V5LCBxdWVyeURlZmF1bHQubXV0YXRpb25LZXkpKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ocmVzdWx0LCBxdWVyeURlZmF1bHQuZGVmYXVsdE9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVmYXVsdFF1ZXJ5T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuX2RlZmF1bHRlZCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuICAgIGNvbnN0IGRlZmF1bHRlZE9wdGlvbnMgPSB7XG4gICAgICAuLi50aGlzLiNkZWZhdWx0T3B0aW9ucy5xdWVyaWVzLFxuICAgICAgLi4udGhpcy5nZXRRdWVyeURlZmF1bHRzKG9wdGlvbnMucXVlcnlLZXkpLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIF9kZWZhdWx0ZWQ6IHRydWVcbiAgICB9O1xuICAgIGlmICghZGVmYXVsdGVkT3B0aW9ucy5xdWVyeUhhc2gpIHtcbiAgICAgIGRlZmF1bHRlZE9wdGlvbnMucXVlcnlIYXNoID0gaGFzaFF1ZXJ5S2V5QnlPcHRpb25zKFxuICAgICAgICBkZWZhdWx0ZWRPcHRpb25zLnF1ZXJ5S2V5LFxuICAgICAgICBkZWZhdWx0ZWRPcHRpb25zXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGVmYXVsdGVkT3B0aW9ucy5yZWZldGNoT25SZWNvbm5lY3QgPT09IHZvaWQgMCkge1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy5yZWZldGNoT25SZWNvbm5lY3QgPSBkZWZhdWx0ZWRPcHRpb25zLm5ldHdvcmtNb2RlICE9PSBcImFsd2F5c1wiO1xuICAgIH1cbiAgICBpZiAoZGVmYXVsdGVkT3B0aW9ucy50aHJvd09uRXJyb3IgPT09IHZvaWQgMCkge1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy50aHJvd09uRXJyb3IgPSAhIWRlZmF1bHRlZE9wdGlvbnMuc3VzcGVuc2U7XG4gICAgfVxuICAgIGlmICghZGVmYXVsdGVkT3B0aW9ucy5uZXR3b3JrTW9kZSAmJiBkZWZhdWx0ZWRPcHRpb25zLnBlcnNpc3Rlcikge1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy5uZXR3b3JrTW9kZSA9IFwib2ZmbGluZUZpcnN0XCI7XG4gICAgfVxuICAgIGlmIChkZWZhdWx0ZWRPcHRpb25zLnF1ZXJ5Rm4gPT09IHNraXBUb2tlbikge1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0ZWRPcHRpb25zO1xuICB9XG4gIGRlZmF1bHRNdXRhdGlvbk9wdGlvbnMob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zPy5fZGVmYXVsdGVkKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuI2RlZmF1bHRPcHRpb25zLm11dGF0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnM/Lm11dGF0aW9uS2V5ICYmIHRoaXMuZ2V0TXV0YXRpb25EZWZhdWx0cyhvcHRpb25zLm11dGF0aW9uS2V5KSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBfZGVmYXVsdGVkOiB0cnVlXG4gICAgfTtcbiAgfVxuICBjbGVhcigpIHtcbiAgICB0aGlzLiNxdWVyeUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy4jbXV0YXRpb25DYWNoZS5jbGVhcigpO1xuICB9XG59O1xuZXhwb3J0IHtcbiAgUXVlcnlDbGllbnRcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeUNsaWVudC5qcy5tYXAiLCIvLyBzcmMvc3RyZWFtZWRRdWVyeS50c1xuaW1wb3J0IHsgYWRkQ29uc3VtZUF3YXJlU2lnbmFsLCBhZGRUb0VuZCB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5mdW5jdGlvbiBzdHJlYW1lZFF1ZXJ5KHtcbiAgc3RyZWFtRm4sXG4gIHJlZmV0Y2hNb2RlID0gXCJyZXNldFwiLFxuICByZWR1Y2VyID0gKGl0ZW1zLCBjaHVuaykgPT4gYWRkVG9FbmQoaXRlbXMsIGNodW5rKSxcbiAgaW5pdGlhbFZhbHVlID0gW11cbn0pIHtcbiAgcmV0dXJuIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcXVlcnkgPSBjb250ZXh0LmNsaWVudC5nZXRRdWVyeUNhY2hlKCkuZmluZCh7IHF1ZXJ5S2V5OiBjb250ZXh0LnF1ZXJ5S2V5LCBleGFjdDogdHJ1ZSB9KTtcbiAgICBjb25zdCBpc1JlZmV0Y2ggPSAhIXF1ZXJ5ICYmIHF1ZXJ5LmlzRmV0Y2hlZCgpO1xuICAgIGlmIChpc1JlZmV0Y2ggJiYgcmVmZXRjaE1vZGUgPT09IFwicmVzZXRcIikge1xuICAgICAgcXVlcnkuc2V0U3RhdGUoe1xuICAgICAgICAuLi5xdWVyeS5yZXNldFN0YXRlLFxuICAgICAgICBmZXRjaFN0YXR1czogXCJmZXRjaGluZ1wiXG4gICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IGluaXRpYWxWYWx1ZTtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgY29uc3Qgc3RyZWFtRm5Db250ZXh0ID0gYWRkQ29uc3VtZUF3YXJlU2lnbmFsKFxuICAgICAge1xuICAgICAgICBjbGllbnQ6IGNvbnRleHQuY2xpZW50LFxuICAgICAgICBtZXRhOiBjb250ZXh0Lm1ldGEsXG4gICAgICAgIHF1ZXJ5S2V5OiBjb250ZXh0LnF1ZXJ5S2V5LFxuICAgICAgICBwYWdlUGFyYW06IGNvbnRleHQucGFnZVBhcmFtLFxuICAgICAgICBkaXJlY3Rpb246IGNvbnRleHQuZGlyZWN0aW9uXG4gICAgICB9LFxuICAgICAgKCkgPT4gY29udGV4dC5zaWduYWwsXG4gICAgICAoKSA9PiBjYW5jZWxsZWQgPSB0cnVlXG4gICAgKTtcbiAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBzdHJlYW1GbihzdHJlYW1GbkNvbnRleHQpO1xuICAgIGNvbnN0IGlzUmVwbGFjZVJlZmV0Y2ggPSBpc1JlZmV0Y2ggJiYgcmVmZXRjaE1vZGUgPT09IFwicmVwbGFjZVwiO1xuICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3RyZWFtKSB7XG4gICAgICBpZiAoY2FuY2VsbGVkKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGlzUmVwbGFjZVJlZmV0Y2gpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVkdWNlcihyZXN1bHQsIGNodW5rKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuY2xpZW50LnNldFF1ZXJ5RGF0YShcbiAgICAgICAgICBjb250ZXh0LnF1ZXJ5S2V5LFxuICAgICAgICAgIChwcmV2KSA9PiByZWR1Y2VyKHByZXYgPT09IHZvaWQgMCA/IGluaXRpYWxWYWx1ZSA6IHByZXYsIGNodW5rKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNSZXBsYWNlUmVmZXRjaCAmJiAhY2FuY2VsbGVkKSB7XG4gICAgICBjb250ZXh0LmNsaWVudC5zZXRRdWVyeURhdGEoY29udGV4dC5xdWVyeUtleSwgcmVzdWx0KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQuY2xpZW50LmdldFF1ZXJ5RGF0YShjb250ZXh0LnF1ZXJ5S2V5KSA/PyBpbml0aWFsVmFsdWU7XG4gIH07XG59XG5leHBvcnQge1xuICBzdHJlYW1lZFF1ZXJ5XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RyZWFtZWRRdWVyeS5qcy5tYXAiLCIvLyBzcmMvdHlwZXMudHNcbnZhciBkYXRhVGFnU3ltYm9sID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcImRhdGFUYWdTeW1ib2xcIik7XG52YXIgZGF0YVRhZ0Vycm9yU3ltYm9sID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcImRhdGFUYWdFcnJvclN5bWJvbFwiKTtcbnZhciB1bnNldE1hcmtlciA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJ1bnNldE1hcmtlclwiKTtcbmV4cG9ydCB7XG4gIGRhdGFUYWdFcnJvclN5bWJvbCxcbiAgZGF0YVRhZ1N5bWJvbCxcbiAgdW5zZXRNYXJrZXJcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD10eXBlcy5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL1F1ZXJ5Q2xpZW50UHJvdmlkZXIudHN4XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IGpzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xudmFyIFF1ZXJ5Q2xpZW50Q29udGV4dCA9IFJlYWN0LmNyZWF0ZUNvbnRleHQoXG4gIHZvaWQgMFxuKTtcbnZhciB1c2VRdWVyeUNsaWVudCA9IChxdWVyeUNsaWVudCkgPT4ge1xuICBjb25zdCBjbGllbnQgPSBSZWFjdC51c2VDb250ZXh0KFF1ZXJ5Q2xpZW50Q29udGV4dCk7XG4gIGlmIChxdWVyeUNsaWVudCkge1xuICAgIHJldHVybiBxdWVyeUNsaWVudDtcbiAgfVxuICBpZiAoIWNsaWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vIFF1ZXJ5Q2xpZW50IHNldCwgdXNlIFF1ZXJ5Q2xpZW50UHJvdmlkZXIgdG8gc2V0IG9uZVwiKTtcbiAgfVxuICByZXR1cm4gY2xpZW50O1xufTtcbnZhciBRdWVyeUNsaWVudFByb3ZpZGVyID0gKHtcbiAgY2xpZW50LFxuICBjaGlsZHJlblxufSkgPT4ge1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNsaWVudC5tb3VudCgpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjbGllbnQudW5tb3VudCgpO1xuICAgIH07XG4gIH0sIFtjbGllbnRdKTtcbiAgcmV0dXJuIC8qIEBfX1BVUkVfXyAqLyBqc3goUXVlcnlDbGllbnRDb250ZXh0LlByb3ZpZGVyLCB7IHZhbHVlOiBjbGllbnQsIGNoaWxkcmVuIH0pO1xufTtcbmV4cG9ydCB7XG4gIFF1ZXJ5Q2xpZW50Q29udGV4dCxcbiAgUXVlcnlDbGllbnRQcm92aWRlcixcbiAgdXNlUXVlcnlDbGllbnRcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1RdWVyeUNsaWVudFByb3ZpZGVyLmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvSXNSZXN0b3JpbmdQcm92aWRlci50c1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG52YXIgSXNSZXN0b3JpbmdDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChmYWxzZSk7XG52YXIgdXNlSXNSZXN0b3JpbmcgPSAoKSA9PiBSZWFjdC51c2VDb250ZXh0KElzUmVzdG9yaW5nQ29udGV4dCk7XG52YXIgSXNSZXN0b3JpbmdQcm92aWRlciA9IElzUmVzdG9yaW5nQ29udGV4dC5Qcm92aWRlcjtcbmV4cG9ydCB7XG4gIElzUmVzdG9yaW5nUHJvdmlkZXIsXG4gIHVzZUlzUmVzdG9yaW5nXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SXNSZXN0b3JpbmdQcm92aWRlci5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL1F1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5LnRzeFxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBqc3ggfSBmcm9tIFwicmVhY3QvanN4LXJ1bnRpbWVcIjtcbmZ1bmN0aW9uIGNyZWF0ZVZhbHVlKCkge1xuICBsZXQgaXNSZXNldCA9IGZhbHNlO1xuICByZXR1cm4ge1xuICAgIGNsZWFyUmVzZXQ6ICgpID0+IHtcbiAgICAgIGlzUmVzZXQgPSBmYWxzZTtcbiAgICB9LFxuICAgIHJlc2V0OiAoKSA9PiB7XG4gICAgICBpc1Jlc2V0ID0gdHJ1ZTtcbiAgICB9LFxuICAgIGlzUmVzZXQ6ICgpID0+IHtcbiAgICAgIHJldHVybiBpc1Jlc2V0O1xuICAgIH1cbiAgfTtcbn1cbnZhciBRdWVyeUVycm9yUmVzZXRCb3VuZGFyeUNvbnRleHQgPSBSZWFjdC5jcmVhdGVDb250ZXh0KGNyZWF0ZVZhbHVlKCkpO1xudmFyIHVzZVF1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5ID0gKCkgPT4gUmVhY3QudXNlQ29udGV4dChRdWVyeUVycm9yUmVzZXRCb3VuZGFyeUNvbnRleHQpO1xudmFyIFF1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5ID0gKHtcbiAgY2hpbGRyZW5cbn0pID0+IHtcbiAgY29uc3QgW3ZhbHVlXSA9IFJlYWN0LnVzZVN0YXRlKCgpID0+IGNyZWF0ZVZhbHVlKCkpO1xuICByZXR1cm4gLyogQF9fUFVSRV9fICovIGpzeChRdWVyeUVycm9yUmVzZXRCb3VuZGFyeUNvbnRleHQuUHJvdmlkZXIsIHsgdmFsdWUsIGNoaWxkcmVuOiB0eXBlb2YgY2hpbGRyZW4gPT09IFwiZnVuY3Rpb25cIiA/IGNoaWxkcmVuKHZhbHVlKSA6IGNoaWxkcmVuIH0pO1xufTtcbmV4cG9ydCB7XG4gIFF1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5LFxuICB1c2VRdWVyeUVycm9yUmVzZXRCb3VuZGFyeVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVF1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5LmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvZXJyb3JCb3VuZGFyeVV0aWxzLnRzXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHNob3VsZFRocm93RXJyb3IgfSBmcm9tIFwiQHRhbnN0YWNrL3F1ZXJ5LWNvcmVcIjtcbnZhciBlbnN1cmVQcmV2ZW50RXJyb3JCb3VuZGFyeVJldHJ5ID0gKG9wdGlvbnMsIGVycm9yUmVzZXRCb3VuZGFyeSwgcXVlcnkpID0+IHtcbiAgY29uc3QgdGhyb3dPbkVycm9yID0gcXVlcnk/LnN0YXRlLmVycm9yICYmIHR5cGVvZiBvcHRpb25zLnRocm93T25FcnJvciA9PT0gXCJmdW5jdGlvblwiID8gc2hvdWxkVGhyb3dFcnJvcihvcHRpb25zLnRocm93T25FcnJvciwgW3F1ZXJ5LnN0YXRlLmVycm9yLCBxdWVyeV0pIDogb3B0aW9ucy50aHJvd09uRXJyb3I7XG4gIGlmIChvcHRpb25zLnN1c3BlbnNlIHx8IG9wdGlvbnMuZXhwZXJpbWVudGFsX3ByZWZldGNoSW5SZW5kZXIgfHwgdGhyb3dPbkVycm9yKSB7XG4gICAgaWYgKCFlcnJvclJlc2V0Qm91bmRhcnkuaXNSZXNldCgpKSB7XG4gICAgICBvcHRpb25zLnJldHJ5T25Nb3VudCA9IGZhbHNlO1xuICAgIH1cbiAgfVxufTtcbnZhciB1c2VDbGVhclJlc2V0RXJyb3JCb3VuZGFyeSA9IChlcnJvclJlc2V0Qm91bmRhcnkpID0+IHtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBlcnJvclJlc2V0Qm91bmRhcnkuY2xlYXJSZXNldCgpO1xuICB9LCBbZXJyb3JSZXNldEJvdW5kYXJ5XSk7XG59O1xudmFyIGdldEhhc0Vycm9yID0gKHtcbiAgcmVzdWx0LFxuICBlcnJvclJlc2V0Qm91bmRhcnksXG4gIHRocm93T25FcnJvcixcbiAgcXVlcnksXG4gIHN1c3BlbnNlXG59KSA9PiB7XG4gIHJldHVybiByZXN1bHQuaXNFcnJvciAmJiAhZXJyb3JSZXNldEJvdW5kYXJ5LmlzUmVzZXQoKSAmJiAhcmVzdWx0LmlzRmV0Y2hpbmcgJiYgcXVlcnkgJiYgKHN1c3BlbnNlICYmIHJlc3VsdC5kYXRhID09PSB2b2lkIDAgfHwgc2hvdWxkVGhyb3dFcnJvcih0aHJvd09uRXJyb3IsIFtyZXN1bHQuZXJyb3IsIHF1ZXJ5XSkpO1xufTtcbmV4cG9ydCB7XG4gIGVuc3VyZVByZXZlbnRFcnJvckJvdW5kYXJ5UmV0cnksXG4gIGdldEhhc0Vycm9yLFxuICB1c2VDbGVhclJlc2V0RXJyb3JCb3VuZGFyeVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVycm9yQm91bmRhcnlVdGlscy5qcy5tYXAiLCIvLyBzcmMvc3VzcGVuc2UudHNcbnZhciBkZWZhdWx0VGhyb3dPbkVycm9yID0gKF9lcnJvciwgcXVlcnkpID0+IHF1ZXJ5LnN0YXRlLmRhdGEgPT09IHZvaWQgMDtcbnZhciBlbnN1cmVTdXNwZW5zZVRpbWVycyA9IChkZWZhdWx0ZWRPcHRpb25zKSA9PiB7XG4gIGlmIChkZWZhdWx0ZWRPcHRpb25zLnN1c3BlbnNlKSB7XG4gICAgY29uc3QgTUlOX1NVU1BFTlNFX1RJTUVfTVMgPSAxZTM7XG4gICAgY29uc3QgY2xhbXAgPSAodmFsdWUpID0+IHZhbHVlID09PSBcInN0YXRpY1wiID8gdmFsdWUgOiBNYXRoLm1heCh2YWx1ZSA/PyBNSU5fU1VTUEVOU0VfVElNRV9NUywgTUlOX1NVU1BFTlNFX1RJTUVfTVMpO1xuICAgIGNvbnN0IG9yaWdpbmFsU3RhbGVUaW1lID0gZGVmYXVsdGVkT3B0aW9ucy5zdGFsZVRpbWU7XG4gICAgZGVmYXVsdGVkT3B0aW9ucy5zdGFsZVRpbWUgPSB0eXBlb2Ygb3JpZ2luYWxTdGFsZVRpbWUgPT09IFwiZnVuY3Rpb25cIiA/ICguLi5hcmdzKSA9PiBjbGFtcChvcmlnaW5hbFN0YWxlVGltZSguLi5hcmdzKSkgOiBjbGFtcChvcmlnaW5hbFN0YWxlVGltZSk7XG4gICAgaWYgKHR5cGVvZiBkZWZhdWx0ZWRPcHRpb25zLmdjVGltZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy5nY1RpbWUgPSBNYXRoLm1heChcbiAgICAgICAgZGVmYXVsdGVkT3B0aW9ucy5nY1RpbWUsXG4gICAgICAgIE1JTl9TVVNQRU5TRV9USU1FX01TXG4gICAgICApO1xuICAgIH1cbiAgfVxufTtcbnZhciB3aWxsRmV0Y2ggPSAocmVzdWx0LCBpc1Jlc3RvcmluZykgPT4gcmVzdWx0LmlzTG9hZGluZyAmJiByZXN1bHQuaXNGZXRjaGluZyAmJiAhaXNSZXN0b3Jpbmc7XG52YXIgc2hvdWxkU3VzcGVuZCA9IChkZWZhdWx0ZWRPcHRpb25zLCByZXN1bHQpID0+IGRlZmF1bHRlZE9wdGlvbnM/LnN1c3BlbnNlICYmIHJlc3VsdC5pc1BlbmRpbmc7XG52YXIgZmV0Y2hPcHRpbWlzdGljID0gKGRlZmF1bHRlZE9wdGlvbnMsIG9ic2VydmVyLCBlcnJvclJlc2V0Qm91bmRhcnkpID0+IG9ic2VydmVyLmZldGNoT3B0aW1pc3RpYyhkZWZhdWx0ZWRPcHRpb25zKS5jYXRjaCgoKSA9PiB7XG4gIGVycm9yUmVzZXRCb3VuZGFyeS5jbGVhclJlc2V0KCk7XG59KTtcbmV4cG9ydCB7XG4gIGRlZmF1bHRUaHJvd09uRXJyb3IsXG4gIGVuc3VyZVN1c3BlbnNlVGltZXJzLFxuICBmZXRjaE9wdGltaXN0aWMsXG4gIHNob3VsZFN1c3BlbmQsXG4gIHdpbGxGZXRjaFxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN1c3BlbnNlLmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvdXNlUXVlcmllcy50c1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQge1xuICBRdWVyaWVzT2JzZXJ2ZXIsXG4gIFF1ZXJ5T2JzZXJ2ZXIsXG4gIG5vb3AsXG4gIG5vdGlmeU1hbmFnZXJcbn0gZnJvbSBcIkB0YW5zdGFjay9xdWVyeS1jb3JlXCI7XG5pbXBvcnQgeyB1c2VRdWVyeUNsaWVudCB9IGZyb20gXCIuL1F1ZXJ5Q2xpZW50UHJvdmlkZXIuanNcIjtcbmltcG9ydCB7IHVzZUlzUmVzdG9yaW5nIH0gZnJvbSBcIi4vSXNSZXN0b3JpbmdQcm92aWRlci5qc1wiO1xuaW1wb3J0IHsgdXNlUXVlcnlFcnJvclJlc2V0Qm91bmRhcnkgfSBmcm9tIFwiLi9RdWVyeUVycm9yUmVzZXRCb3VuZGFyeS5qc1wiO1xuaW1wb3J0IHtcbiAgZW5zdXJlUHJldmVudEVycm9yQm91bmRhcnlSZXRyeSxcbiAgZ2V0SGFzRXJyb3IsXG4gIHVzZUNsZWFyUmVzZXRFcnJvckJvdW5kYXJ5XG59IGZyb20gXCIuL2Vycm9yQm91bmRhcnlVdGlscy5qc1wiO1xuaW1wb3J0IHtcbiAgZW5zdXJlU3VzcGVuc2VUaW1lcnMsXG4gIGZldGNoT3B0aW1pc3RpYyxcbiAgc2hvdWxkU3VzcGVuZFxufSBmcm9tIFwiLi9zdXNwZW5zZS5qc1wiO1xuZnVuY3Rpb24gdXNlUXVlcmllcyh7XG4gIHF1ZXJpZXMsXG4gIC4uLm9wdGlvbnNcbn0sIHF1ZXJ5Q2xpZW50KSB7XG4gIGNvbnN0IGNsaWVudCA9IHVzZVF1ZXJ5Q2xpZW50KHF1ZXJ5Q2xpZW50KTtcbiAgY29uc3QgaXNSZXN0b3JpbmcgPSB1c2VJc1Jlc3RvcmluZygpO1xuICBjb25zdCBlcnJvclJlc2V0Qm91bmRhcnkgPSB1c2VRdWVyeUVycm9yUmVzZXRCb3VuZGFyeSgpO1xuICBjb25zdCBkZWZhdWx0ZWRRdWVyaWVzID0gUmVhY3QudXNlTWVtbyhcbiAgICAoKSA9PiBxdWVyaWVzLm1hcCgob3B0cykgPT4ge1xuICAgICAgY29uc3QgZGVmYXVsdGVkT3B0aW9ucyA9IGNsaWVudC5kZWZhdWx0UXVlcnlPcHRpb25zKFxuICAgICAgICBvcHRzXG4gICAgICApO1xuICAgICAgZGVmYXVsdGVkT3B0aW9ucy5fb3B0aW1pc3RpY1Jlc3VsdHMgPSBpc1Jlc3RvcmluZyA/IFwiaXNSZXN0b3JpbmdcIiA6IFwib3B0aW1pc3RpY1wiO1xuICAgICAgcmV0dXJuIGRlZmF1bHRlZE9wdGlvbnM7XG4gICAgfSksXG4gICAgW3F1ZXJpZXMsIGNsaWVudCwgaXNSZXN0b3JpbmddXG4gICk7XG4gIGRlZmF1bHRlZFF1ZXJpZXMuZm9yRWFjaCgocXVlcnlPcHRpb25zKSA9PiB7XG4gICAgZW5zdXJlU3VzcGVuc2VUaW1lcnMocXVlcnlPcHRpb25zKTtcbiAgICBjb25zdCBxdWVyeSA9IGNsaWVudC5nZXRRdWVyeUNhY2hlKCkuZ2V0KHF1ZXJ5T3B0aW9ucy5xdWVyeUhhc2gpO1xuICAgIGVuc3VyZVByZXZlbnRFcnJvckJvdW5kYXJ5UmV0cnkocXVlcnlPcHRpb25zLCBlcnJvclJlc2V0Qm91bmRhcnksIHF1ZXJ5KTtcbiAgfSk7XG4gIHVzZUNsZWFyUmVzZXRFcnJvckJvdW5kYXJ5KGVycm9yUmVzZXRCb3VuZGFyeSk7XG4gIGNvbnN0IFtvYnNlcnZlcl0gPSBSZWFjdC51c2VTdGF0ZShcbiAgICAoKSA9PiBuZXcgUXVlcmllc09ic2VydmVyKFxuICAgICAgY2xpZW50LFxuICAgICAgZGVmYXVsdGVkUXVlcmllcyxcbiAgICAgIG9wdGlvbnNcbiAgICApXG4gICk7XG4gIGNvbnN0IFtvcHRpbWlzdGljUmVzdWx0LCBnZXRDb21iaW5lZFJlc3VsdCwgdHJhY2tSZXN1bHRdID0gb2JzZXJ2ZXIuZ2V0T3B0aW1pc3RpY1Jlc3VsdChcbiAgICBkZWZhdWx0ZWRRdWVyaWVzLFxuICAgIG9wdGlvbnMuY29tYmluZVxuICApO1xuICBjb25zdCBzaG91bGRTdWJzY3JpYmUgPSAhaXNSZXN0b3JpbmcgJiYgb3B0aW9ucy5zdWJzY3JpYmVkICE9PSBmYWxzZTtcbiAgUmVhY3QudXNlU3luY0V4dGVybmFsU3RvcmUoXG4gICAgUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgICAob25TdG9yZUNoYW5nZSkgPT4gc2hvdWxkU3Vic2NyaWJlID8gb2JzZXJ2ZXIuc3Vic2NyaWJlKG5vdGlmeU1hbmFnZXIuYmF0Y2hDYWxscyhvblN0b3JlQ2hhbmdlKSkgOiBub29wLFxuICAgICAgW29ic2VydmVyLCBzaG91bGRTdWJzY3JpYmVdXG4gICAgKSxcbiAgICAoKSA9PiBvYnNlcnZlci5nZXRDdXJyZW50UmVzdWx0KCksXG4gICAgKCkgPT4gb2JzZXJ2ZXIuZ2V0Q3VycmVudFJlc3VsdCgpXG4gICk7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb2JzZXJ2ZXIuc2V0UXVlcmllcyhcbiAgICAgIGRlZmF1bHRlZFF1ZXJpZXMsXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgfSwgW2RlZmF1bHRlZFF1ZXJpZXMsIG9wdGlvbnMsIG9ic2VydmVyXSk7XG4gIGNvbnN0IHNob3VsZEF0TGVhc3RPbmVTdXNwZW5kID0gb3B0aW1pc3RpY1Jlc3VsdC5zb21lKFxuICAgIChyZXN1bHQsIGluZGV4KSA9PiBzaG91bGRTdXNwZW5kKGRlZmF1bHRlZFF1ZXJpZXNbaW5kZXhdLCByZXN1bHQpXG4gICk7XG4gIGNvbnN0IHN1c3BlbnNlUHJvbWlzZXMgPSBzaG91bGRBdExlYXN0T25lU3VzcGVuZCA/IG9wdGltaXN0aWNSZXN1bHQuZmxhdE1hcCgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG9wdHMgPSBkZWZhdWx0ZWRRdWVyaWVzW2luZGV4XTtcbiAgICBpZiAob3B0cyAmJiBzaG91bGRTdXNwZW5kKG9wdHMsIHJlc3VsdCkpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5T2JzZXJ2ZXIgPSBuZXcgUXVlcnlPYnNlcnZlcihjbGllbnQsIG9wdHMpO1xuICAgICAgcmV0dXJuIGZldGNoT3B0aW1pc3RpYyhvcHRzLCBxdWVyeU9ic2VydmVyLCBlcnJvclJlc2V0Qm91bmRhcnkpO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH0pIDogW107XG4gIGlmIChzdXNwZW5zZVByb21pc2VzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBQcm9taXNlLmFsbChzdXNwZW5zZVByb21pc2VzKTtcbiAgfVxuICBjb25zdCBmaXJzdFNpbmdsZVJlc3VsdFdoaWNoU2hvdWxkVGhyb3cgPSBvcHRpbWlzdGljUmVzdWx0LmZpbmQoXG4gICAgKHJlc3VsdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gZGVmYXVsdGVkUXVlcmllc1tpbmRleF07XG4gICAgICByZXR1cm4gcXVlcnkgJiYgZ2V0SGFzRXJyb3Ioe1xuICAgICAgICByZXN1bHQsXG4gICAgICAgIGVycm9yUmVzZXRCb3VuZGFyeSxcbiAgICAgICAgdGhyb3dPbkVycm9yOiBxdWVyeS50aHJvd09uRXJyb3IsXG4gICAgICAgIHF1ZXJ5OiBjbGllbnQuZ2V0UXVlcnlDYWNoZSgpLmdldChxdWVyeS5xdWVyeUhhc2gpLFxuICAgICAgICBzdXNwZW5zZTogcXVlcnkuc3VzcGVuc2VcbiAgICAgIH0pO1xuICAgIH1cbiAgKTtcbiAgaWYgKGZpcnN0U2luZ2xlUmVzdWx0V2hpY2hTaG91bGRUaHJvdz8uZXJyb3IpIHtcbiAgICB0aHJvdyBmaXJzdFNpbmdsZVJlc3VsdFdoaWNoU2hvdWxkVGhyb3cuZXJyb3I7XG4gIH1cbiAgcmV0dXJuIGdldENvbWJpbmVkUmVzdWx0KHRyYWNrUmVzdWx0KCkpO1xufVxuZXhwb3J0IHtcbiAgdXNlUXVlcmllc1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZVF1ZXJpZXMuanMubWFwIiwiXCJ1c2UgY2xpZW50XCI7XG5cbi8vIHNyYy91c2VCYXNlUXVlcnkudHNcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgZW52aXJvbm1lbnRNYW5hZ2VyLCBub29wLCBub3RpZnlNYW5hZ2VyIH0gZnJvbSBcIkB0YW5zdGFjay9xdWVyeS1jb3JlXCI7XG5pbXBvcnQgeyB1c2VRdWVyeUNsaWVudCB9IGZyb20gXCIuL1F1ZXJ5Q2xpZW50UHJvdmlkZXIuanNcIjtcbmltcG9ydCB7IHVzZVF1ZXJ5RXJyb3JSZXNldEJvdW5kYXJ5IH0gZnJvbSBcIi4vUXVlcnlFcnJvclJlc2V0Qm91bmRhcnkuanNcIjtcbmltcG9ydCB7XG4gIGVuc3VyZVByZXZlbnRFcnJvckJvdW5kYXJ5UmV0cnksXG4gIGdldEhhc0Vycm9yLFxuICB1c2VDbGVhclJlc2V0RXJyb3JCb3VuZGFyeVxufSBmcm9tIFwiLi9lcnJvckJvdW5kYXJ5VXRpbHMuanNcIjtcbmltcG9ydCB7IHVzZUlzUmVzdG9yaW5nIH0gZnJvbSBcIi4vSXNSZXN0b3JpbmdQcm92aWRlci5qc1wiO1xuaW1wb3J0IHtcbiAgZW5zdXJlU3VzcGVuc2VUaW1lcnMsXG4gIGZldGNoT3B0aW1pc3RpYyxcbiAgc2hvdWxkU3VzcGVuZCxcbiAgd2lsbEZldGNoXG59IGZyb20gXCIuL3N1c3BlbnNlLmpzXCI7XG5mdW5jdGlvbiB1c2VCYXNlUXVlcnkob3B0aW9ucywgT2JzZXJ2ZXIsIHF1ZXJ5Q2xpZW50KSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQmFkIGFyZ3VtZW50IHR5cGUuIFN0YXJ0aW5nIHdpdGggdjUsIG9ubHkgdGhlIFwiT2JqZWN0XCIgZm9ybSBpcyBhbGxvd2VkIHdoZW4gY2FsbGluZyBxdWVyeSByZWxhdGVkIGZ1bmN0aW9ucy4gUGxlYXNlIHVzZSB0aGUgZXJyb3Igc3RhY2sgdG8gZmluZCB0aGUgY3VscHJpdCBjYWxsLiBNb3JlIGluZm8gaGVyZTogaHR0cHM6Ly90YW5zdGFjay5jb20vcXVlcnkvbGF0ZXN0L2RvY3MvcmVhY3QvZ3VpZGVzL21pZ3JhdGluZy10by12NSNzdXBwb3J0cy1hLXNpbmdsZS1zaWduYXR1cmUtb25lLW9iamVjdCdcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGNvbnN0IGlzUmVzdG9yaW5nID0gdXNlSXNSZXN0b3JpbmcoKTtcbiAgY29uc3QgZXJyb3JSZXNldEJvdW5kYXJ5ID0gdXNlUXVlcnlFcnJvclJlc2V0Qm91bmRhcnkoKTtcbiAgY29uc3QgY2xpZW50ID0gdXNlUXVlcnlDbGllbnQocXVlcnlDbGllbnQpO1xuICBjb25zdCBkZWZhdWx0ZWRPcHRpb25zID0gY2xpZW50LmRlZmF1bHRRdWVyeU9wdGlvbnMob3B0aW9ucyk7XG4gIGNsaWVudC5nZXREZWZhdWx0T3B0aW9ucygpLnF1ZXJpZXM/Ll9leHBlcmltZW50YWxfYmVmb3JlUXVlcnk/LihcbiAgICBkZWZhdWx0ZWRPcHRpb25zXG4gICk7XG4gIGNvbnN0IHF1ZXJ5ID0gY2xpZW50LmdldFF1ZXJ5Q2FjaGUoKS5nZXQoZGVmYXVsdGVkT3B0aW9ucy5xdWVyeUhhc2gpO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgaWYgKCFkZWZhdWx0ZWRPcHRpb25zLnF1ZXJ5Rm4pIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBbJHtkZWZhdWx0ZWRPcHRpb25zLnF1ZXJ5SGFzaH1dOiBObyBxdWVyeUZuIHdhcyBwYXNzZWQgYXMgYW4gb3B0aW9uLCBhbmQgbm8gZGVmYXVsdCBxdWVyeUZuIHdhcyBmb3VuZC4gVGhlIHF1ZXJ5Rm4gcGFyYW1ldGVyIGlzIG9ubHkgb3B0aW9uYWwgd2hlbiB1c2luZyBhIGRlZmF1bHQgcXVlcnlGbi4gTW9yZSBpbmZvIGhlcmU6IGh0dHBzOi8vdGFuc3RhY2suY29tL3F1ZXJ5L2xhdGVzdC9kb2NzL2ZyYW1ld29yay9yZWFjdC9ndWlkZXMvZGVmYXVsdC1xdWVyeS1mdW5jdGlvbmBcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHN1YnNjcmliZWQgPSBvcHRpb25zLnN1YnNjcmliZWQgIT09IGZhbHNlO1xuICBkZWZhdWx0ZWRPcHRpb25zLl9vcHRpbWlzdGljUmVzdWx0cyA9IGlzUmVzdG9yaW5nID8gXCJpc1Jlc3RvcmluZ1wiIDogc3Vic2NyaWJlZCA/IFwib3B0aW1pc3RpY1wiIDogdm9pZCAwO1xuICBlbnN1cmVTdXNwZW5zZVRpbWVycyhkZWZhdWx0ZWRPcHRpb25zKTtcbiAgZW5zdXJlUHJldmVudEVycm9yQm91bmRhcnlSZXRyeShkZWZhdWx0ZWRPcHRpb25zLCBlcnJvclJlc2V0Qm91bmRhcnksIHF1ZXJ5KTtcbiAgdXNlQ2xlYXJSZXNldEVycm9yQm91bmRhcnkoZXJyb3JSZXNldEJvdW5kYXJ5KTtcbiAgY29uc3QgaXNOZXdDYWNoZUVudHJ5ID0gIWNsaWVudC5nZXRRdWVyeUNhY2hlKCkuZ2V0KGRlZmF1bHRlZE9wdGlvbnMucXVlcnlIYXNoKTtcbiAgY29uc3QgW29ic2VydmVyXSA9IFJlYWN0LnVzZVN0YXRlKFxuICAgICgpID0+IG5ldyBPYnNlcnZlcihcbiAgICAgIGNsaWVudCxcbiAgICAgIGRlZmF1bHRlZE9wdGlvbnNcbiAgICApXG4gICk7XG4gIGNvbnN0IHJlc3VsdCA9IG9ic2VydmVyLmdldE9wdGltaXN0aWNSZXN1bHQoZGVmYXVsdGVkT3B0aW9ucyk7XG4gIGNvbnN0IHNob3VsZFN1YnNjcmliZSA9ICFpc1Jlc3RvcmluZyAmJiBzdWJzY3JpYmVkO1xuICBSZWFjdC51c2VTeW5jRXh0ZXJuYWxTdG9yZShcbiAgICBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAgIChvblN0b3JlQ2hhbmdlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlID0gc2hvdWxkU3Vic2NyaWJlID8gb2JzZXJ2ZXIuc3Vic2NyaWJlKG5vdGlmeU1hbmFnZXIuYmF0Y2hDYWxscyhvblN0b3JlQ2hhbmdlKSkgOiBub29wO1xuICAgICAgICBvYnNlcnZlci51cGRhdGVSZXN1bHQoKTtcbiAgICAgICAgcmV0dXJuIHVuc3Vic2NyaWJlO1xuICAgICAgfSxcbiAgICAgIFtvYnNlcnZlciwgc2hvdWxkU3Vic2NyaWJlXVxuICAgICksXG4gICAgKCkgPT4gb2JzZXJ2ZXIuZ2V0Q3VycmVudFJlc3VsdCgpLFxuICAgICgpID0+IG9ic2VydmVyLmdldEN1cnJlbnRSZXN1bHQoKVxuICApO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9ic2VydmVyLnNldE9wdGlvbnMoZGVmYXVsdGVkT3B0aW9ucyk7XG4gIH0sIFtkZWZhdWx0ZWRPcHRpb25zLCBvYnNlcnZlcl0pO1xuICBpZiAoc2hvdWxkU3VzcGVuZChkZWZhdWx0ZWRPcHRpb25zLCByZXN1bHQpKSB7XG4gICAgdGhyb3cgZmV0Y2hPcHRpbWlzdGljKGRlZmF1bHRlZE9wdGlvbnMsIG9ic2VydmVyLCBlcnJvclJlc2V0Qm91bmRhcnkpO1xuICB9XG4gIGlmIChnZXRIYXNFcnJvcih7XG4gICAgcmVzdWx0LFxuICAgIGVycm9yUmVzZXRCb3VuZGFyeSxcbiAgICB0aHJvd09uRXJyb3I6IGRlZmF1bHRlZE9wdGlvbnMudGhyb3dPbkVycm9yLFxuICAgIHF1ZXJ5LFxuICAgIHN1c3BlbnNlOiBkZWZhdWx0ZWRPcHRpb25zLnN1c3BlbnNlXG4gIH0pKSB7XG4gICAgdGhyb3cgcmVzdWx0LmVycm9yO1xuICB9XG4gIDtcbiAgY2xpZW50LmdldERlZmF1bHRPcHRpb25zKCkucXVlcmllcz8uX2V4cGVyaW1lbnRhbF9hZnRlclF1ZXJ5Py4oXG4gICAgZGVmYXVsdGVkT3B0aW9ucyxcbiAgICByZXN1bHRcbiAgKTtcbiAgaWYgKGRlZmF1bHRlZE9wdGlvbnMuZXhwZXJpbWVudGFsX3ByZWZldGNoSW5SZW5kZXIgJiYgIWVudmlyb25tZW50TWFuYWdlci5pc1NlcnZlcigpICYmIHdpbGxGZXRjaChyZXN1bHQsIGlzUmVzdG9yaW5nKSkge1xuICAgIGNvbnN0IHByb21pc2UgPSBpc05ld0NhY2hlRW50cnkgPyAoXG4gICAgICAvLyBGZXRjaCBpbW1lZGlhdGVseSBvbiByZW5kZXIgaW4gb3JkZXIgdG8gZW5zdXJlIGAucHJvbWlzZWAgaXMgcmVzb2x2ZWQgZXZlbiBpZiB0aGUgY29tcG9uZW50IGlzIHVubW91bnRlZFxuICAgICAgZmV0Y2hPcHRpbWlzdGljKGRlZmF1bHRlZE9wdGlvbnMsIG9ic2VydmVyLCBlcnJvclJlc2V0Qm91bmRhcnkpXG4gICAgKSA6IChcbiAgICAgIC8vIHN1YnNjcmliZSB0byB0aGUgXCJjYWNoZSBwcm9taXNlXCIgc28gdGhhdCB3ZSBjYW4gZmluYWxpemUgdGhlIGN1cnJlbnRUaGVuYWJsZSBvbmNlIGRhdGEgY29tZXMgaW5cbiAgICAgIHF1ZXJ5Py5wcm9taXNlXG4gICAgKTtcbiAgICBwcm9taXNlPy5jYXRjaChub29wKS5maW5hbGx5KCgpID0+IHtcbiAgICAgIG9ic2VydmVyLnVwZGF0ZVJlc3VsdCgpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiAhZGVmYXVsdGVkT3B0aW9ucy5ub3RpZnlPbkNoYW5nZVByb3BzID8gb2JzZXJ2ZXIudHJhY2tSZXN1bHQocmVzdWx0KSA6IHJlc3VsdDtcbn1cbmV4cG9ydCB7XG4gIHVzZUJhc2VRdWVyeVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZUJhc2VRdWVyeS5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL3VzZVF1ZXJ5LnRzXG5pbXBvcnQgeyBRdWVyeU9ic2VydmVyIH0gZnJvbSBcIkB0YW5zdGFjay9xdWVyeS1jb3JlXCI7XG5pbXBvcnQgeyB1c2VCYXNlUXVlcnkgfSBmcm9tIFwiLi91c2VCYXNlUXVlcnkuanNcIjtcbmZ1bmN0aW9uIHVzZVF1ZXJ5KG9wdGlvbnMsIHF1ZXJ5Q2xpZW50KSB7XG4gIHJldHVybiB1c2VCYXNlUXVlcnkob3B0aW9ucywgUXVlcnlPYnNlcnZlciwgcXVlcnlDbGllbnQpO1xufVxuZXhwb3J0IHtcbiAgdXNlUXVlcnlcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VRdWVyeS5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL3VzZVN1c3BlbnNlUXVlcnkudHNcbmltcG9ydCB7IFF1ZXJ5T2JzZXJ2ZXIsIHNraXBUb2tlbiB9IGZyb20gXCJAdGFuc3RhY2svcXVlcnktY29yZVwiO1xuaW1wb3J0IHsgdXNlQmFzZVF1ZXJ5IH0gZnJvbSBcIi4vdXNlQmFzZVF1ZXJ5LmpzXCI7XG5pbXBvcnQgeyBkZWZhdWx0VGhyb3dPbkVycm9yIH0gZnJvbSBcIi4vc3VzcGVuc2UuanNcIjtcbmZ1bmN0aW9uIHVzZVN1c3BlbnNlUXVlcnkob3B0aW9ucywgcXVlcnlDbGllbnQpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgIGlmIChvcHRpb25zLnF1ZXJ5Rm4gPT09IHNraXBUb2tlbikge1xuICAgICAgY29uc29sZS5lcnJvcihcInNraXBUb2tlbiBpcyBub3QgYWxsb3dlZCBmb3IgdXNlU3VzcGVuc2VRdWVyeVwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVzZUJhc2VRdWVyeShcbiAgICB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHN1c3BlbnNlOiB0cnVlLFxuICAgICAgdGhyb3dPbkVycm9yOiBkZWZhdWx0VGhyb3dPbkVycm9yLFxuICAgICAgcGxhY2Vob2xkZXJEYXRhOiB2b2lkIDBcbiAgICB9LFxuICAgIFF1ZXJ5T2JzZXJ2ZXIsXG4gICAgcXVlcnlDbGllbnRcbiAgKTtcbn1cbmV4cG9ydCB7XG4gIHVzZVN1c3BlbnNlUXVlcnlcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VTdXNwZW5zZVF1ZXJ5LmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvdXNlU3VzcGVuc2VJbmZpbml0ZVF1ZXJ5LnRzXG5pbXBvcnQgeyBJbmZpbml0ZVF1ZXJ5T2JzZXJ2ZXIsIHNraXBUb2tlbiB9IGZyb20gXCJAdGFuc3RhY2svcXVlcnktY29yZVwiO1xuaW1wb3J0IHsgdXNlQmFzZVF1ZXJ5IH0gZnJvbSBcIi4vdXNlQmFzZVF1ZXJ5LmpzXCI7XG5pbXBvcnQgeyBkZWZhdWx0VGhyb3dPbkVycm9yIH0gZnJvbSBcIi4vc3VzcGVuc2UuanNcIjtcbmZ1bmN0aW9uIHVzZVN1c3BlbnNlSW5maW5pdGVRdWVyeShvcHRpb25zLCBxdWVyeUNsaWVudCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgaWYgKG9wdGlvbnMucXVlcnlGbiA9PT0gc2tpcFRva2VuKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwic2tpcFRva2VuIGlzIG5vdCBhbGxvd2VkIGZvciB1c2VTdXNwZW5zZUluZmluaXRlUXVlcnlcIik7XG4gICAgfVxuICB9XG4gIHJldHVybiB1c2VCYXNlUXVlcnkoXG4gICAge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBzdXNwZW5zZTogdHJ1ZSxcbiAgICAgIHRocm93T25FcnJvcjogZGVmYXVsdFRocm93T25FcnJvclxuICAgIH0sXG4gICAgSW5maW5pdGVRdWVyeU9ic2VydmVyLFxuICAgIHF1ZXJ5Q2xpZW50XG4gICk7XG59XG5leHBvcnQge1xuICB1c2VTdXNwZW5zZUluZmluaXRlUXVlcnlcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VTdXNwZW5zZUluZmluaXRlUXVlcnkuanMubWFwIiwiXCJ1c2UgY2xpZW50XCI7XG5cbi8vIHNyYy91c2VTdXNwZW5zZVF1ZXJpZXMudHNcbmltcG9ydCB7IHNraXBUb2tlbiB9IGZyb20gXCJAdGFuc3RhY2svcXVlcnktY29yZVwiO1xuaW1wb3J0IHsgdXNlUXVlcmllcyB9IGZyb20gXCIuL3VzZVF1ZXJpZXMuanNcIjtcbmltcG9ydCB7IGRlZmF1bHRUaHJvd09uRXJyb3IgfSBmcm9tIFwiLi9zdXNwZW5zZS5qc1wiO1xuZnVuY3Rpb24gdXNlU3VzcGVuc2VRdWVyaWVzKG9wdGlvbnMsIHF1ZXJ5Q2xpZW50KSB7XG4gIHJldHVybiB1c2VRdWVyaWVzKFxuICAgIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBxdWVyaWVzOiBvcHRpb25zLnF1ZXJpZXMubWFwKChxdWVyeSkgPT4ge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICAgICAgaWYgKHF1ZXJ5LnF1ZXJ5Rm4gPT09IHNraXBUb2tlbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInNraXBUb2tlbiBpcyBub3QgYWxsb3dlZCBmb3IgdXNlU3VzcGVuc2VRdWVyaWVzXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIHN1c3BlbnNlOiB0cnVlLFxuICAgICAgICAgIHRocm93T25FcnJvcjogZGVmYXVsdFRocm93T25FcnJvcixcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHBsYWNlaG9sZGVyRGF0YTogdm9pZCAwXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgIH0sXG4gICAgcXVlcnlDbGllbnRcbiAgKTtcbn1cbmV4cG9ydCB7XG4gIHVzZVN1c3BlbnNlUXVlcmllc1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZVN1c3BlbnNlUXVlcmllcy5qcy5tYXAiLCIvLyBzcmMvdXNlUHJlZmV0Y2hRdWVyeS50c3hcbmltcG9ydCB7IHVzZVF1ZXJ5Q2xpZW50IH0gZnJvbSBcIi4vUXVlcnlDbGllbnRQcm92aWRlci5qc1wiO1xuZnVuY3Rpb24gdXNlUHJlZmV0Y2hRdWVyeShvcHRpb25zLCBxdWVyeUNsaWVudCkge1xuICBjb25zdCBjbGllbnQgPSB1c2VRdWVyeUNsaWVudChxdWVyeUNsaWVudCk7XG4gIGlmICghY2xpZW50LmdldFF1ZXJ5U3RhdGUob3B0aW9ucy5xdWVyeUtleSkpIHtcbiAgICBjbGllbnQucHJlZmV0Y2hRdWVyeShvcHRpb25zKTtcbiAgfVxufVxuZXhwb3J0IHtcbiAgdXNlUHJlZmV0Y2hRdWVyeVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZVByZWZldGNoUXVlcnkuanMubWFwIiwiLy8gc3JjL3VzZVByZWZldGNoSW5maW5pdGVRdWVyeS50c3hcbmltcG9ydCB7IHVzZVF1ZXJ5Q2xpZW50IH0gZnJvbSBcIi4vUXVlcnlDbGllbnRQcm92aWRlci5qc1wiO1xuZnVuY3Rpb24gdXNlUHJlZmV0Y2hJbmZpbml0ZVF1ZXJ5KG9wdGlvbnMsIHF1ZXJ5Q2xpZW50KSB7XG4gIGNvbnN0IGNsaWVudCA9IHVzZVF1ZXJ5Q2xpZW50KHF1ZXJ5Q2xpZW50KTtcbiAgaWYgKCFjbGllbnQuZ2V0UXVlcnlTdGF0ZShvcHRpb25zLnF1ZXJ5S2V5KSkge1xuICAgIGNsaWVudC5wcmVmZXRjaEluZmluaXRlUXVlcnkob3B0aW9ucyk7XG4gIH1cbn1cbmV4cG9ydCB7XG4gIHVzZVByZWZldGNoSW5maW5pdGVRdWVyeVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZVByZWZldGNoSW5maW5pdGVRdWVyeS5qcy5tYXAiLCIvLyBzcmMvcXVlcnlPcHRpb25zLnRzXG5mdW5jdGlvbiBxdWVyeU9wdGlvbnMob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucztcbn1cbmV4cG9ydCB7XG4gIHF1ZXJ5T3B0aW9uc1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5T3B0aW9ucy5qcy5tYXAiLCIvLyBzcmMvaW5maW5pdGVRdWVyeU9wdGlvbnMudHNcbmZ1bmN0aW9uIGluZmluaXRlUXVlcnlPcHRpb25zKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnM7XG59XG5leHBvcnQge1xuICBpbmZpbml0ZVF1ZXJ5T3B0aW9uc1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZmluaXRlUXVlcnlPcHRpb25zLmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvSHlkcmF0aW9uQm91bmRhcnkudHN4XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IGh5ZHJhdGUgfSBmcm9tIFwiQHRhbnN0YWNrL3F1ZXJ5LWNvcmVcIjtcbmltcG9ydCB7IHVzZVF1ZXJ5Q2xpZW50IH0gZnJvbSBcIi4vUXVlcnlDbGllbnRQcm92aWRlci5qc1wiO1xudmFyIEh5ZHJhdGlvbkJvdW5kYXJ5ID0gKHtcbiAgY2hpbGRyZW4sXG4gIG9wdGlvbnMgPSB7fSxcbiAgc3RhdGUsXG4gIHF1ZXJ5Q2xpZW50XG59KSA9PiB7XG4gIGNvbnN0IGNsaWVudCA9IHVzZVF1ZXJ5Q2xpZW50KHF1ZXJ5Q2xpZW50KTtcbiAgY29uc3Qgb3B0aW9uc1JlZiA9IFJlYWN0LnVzZVJlZihvcHRpb25zKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBvcHRpb25zUmVmLmN1cnJlbnQgPSBvcHRpb25zO1xuICB9KTtcbiAgY29uc3QgaHlkcmF0aW9uUXVldWUgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoc3RhdGUpIHtcbiAgICAgIGlmICh0eXBlb2Ygc3RhdGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcXVlcnlDYWNoZSA9IGNsaWVudC5nZXRRdWVyeUNhY2hlKCk7XG4gICAgICBjb25zdCBxdWVyaWVzID0gc3RhdGUucXVlcmllcyB8fCBbXTtcbiAgICAgIGNvbnN0IG5ld1F1ZXJpZXMgPSBbXTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nUXVlcmllcyA9IFtdO1xuICAgICAgZm9yIChjb25zdCBkZWh5ZHJhdGVkUXVlcnkgb2YgcXVlcmllcykge1xuICAgICAgICBjb25zdCBleGlzdGluZ1F1ZXJ5ID0gcXVlcnlDYWNoZS5nZXQoZGVoeWRyYXRlZFF1ZXJ5LnF1ZXJ5SGFzaCk7XG4gICAgICAgIGlmICghZXhpc3RpbmdRdWVyeSkge1xuICAgICAgICAgIG5ld1F1ZXJpZXMucHVzaChkZWh5ZHJhdGVkUXVlcnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGh5ZHJhdGlvbklzTmV3ZXIgPSBkZWh5ZHJhdGVkUXVlcnkuc3RhdGUuZGF0YVVwZGF0ZWRBdCA+IGV4aXN0aW5nUXVlcnkuc3RhdGUuZGF0YVVwZGF0ZWRBdCB8fCBkZWh5ZHJhdGVkUXVlcnkucHJvbWlzZSAmJiBleGlzdGluZ1F1ZXJ5LnN0YXRlLnN0YXR1cyAhPT0gXCJwZW5kaW5nXCIgJiYgZXhpc3RpbmdRdWVyeS5zdGF0ZS5mZXRjaFN0YXR1cyAhPT0gXCJmZXRjaGluZ1wiICYmIGRlaHlkcmF0ZWRRdWVyeS5kZWh5ZHJhdGVkQXQgIT09IHZvaWQgMCAmJiBkZWh5ZHJhdGVkUXVlcnkuZGVoeWRyYXRlZEF0ID4gZXhpc3RpbmdRdWVyeS5zdGF0ZS5kYXRhVXBkYXRlZEF0O1xuICAgICAgICAgIGlmIChoeWRyYXRpb25Jc05ld2VyKSB7XG4gICAgICAgICAgICBleGlzdGluZ1F1ZXJpZXMucHVzaChkZWh5ZHJhdGVkUXVlcnkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG5ld1F1ZXJpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBoeWRyYXRlKGNsaWVudCwgeyBxdWVyaWVzOiBuZXdRdWVyaWVzIH0sIG9wdGlvbnNSZWYuY3VycmVudCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdRdWVyaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nUXVlcmllcztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfSwgW2NsaWVudCwgc3RhdGVdKTtcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaHlkcmF0aW9uUXVldWUpIHtcbiAgICAgIGh5ZHJhdGUoY2xpZW50LCB7IHF1ZXJpZXM6IGh5ZHJhdGlvblF1ZXVlIH0sIG9wdGlvbnNSZWYuY3VycmVudCk7XG4gICAgfVxuICB9LCBbY2xpZW50LCBoeWRyYXRpb25RdWV1ZV0pO1xuICByZXR1cm4gY2hpbGRyZW47XG59O1xuZXhwb3J0IHtcbiAgSHlkcmF0aW9uQm91bmRhcnlcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1IeWRyYXRpb25Cb3VuZGFyeS5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL3VzZUlzRmV0Y2hpbmcudHNcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgbm90aWZ5TWFuYWdlciB9IGZyb20gXCJAdGFuc3RhY2svcXVlcnktY29yZVwiO1xuaW1wb3J0IHsgdXNlUXVlcnlDbGllbnQgfSBmcm9tIFwiLi9RdWVyeUNsaWVudFByb3ZpZGVyLmpzXCI7XG5mdW5jdGlvbiB1c2VJc0ZldGNoaW5nKGZpbHRlcnMsIHF1ZXJ5Q2xpZW50KSB7XG4gIGNvbnN0IGNsaWVudCA9IHVzZVF1ZXJ5Q2xpZW50KHF1ZXJ5Q2xpZW50KTtcbiAgY29uc3QgcXVlcnlDYWNoZSA9IGNsaWVudC5nZXRRdWVyeUNhY2hlKCk7XG4gIHJldHVybiBSZWFjdC51c2VTeW5jRXh0ZXJuYWxTdG9yZShcbiAgICBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAgIChvblN0b3JlQ2hhbmdlKSA9PiBxdWVyeUNhY2hlLnN1YnNjcmliZShub3RpZnlNYW5hZ2VyLmJhdGNoQ2FsbHMob25TdG9yZUNoYW5nZSkpLFxuICAgICAgW3F1ZXJ5Q2FjaGVdXG4gICAgKSxcbiAgICAoKSA9PiBjbGllbnQuaXNGZXRjaGluZyhmaWx0ZXJzKSxcbiAgICAoKSA9PiBjbGllbnQuaXNGZXRjaGluZyhmaWx0ZXJzKVxuICApO1xufVxuZXhwb3J0IHtcbiAgdXNlSXNGZXRjaGluZ1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXVzZUlzRmV0Y2hpbmcuanMubWFwIiwiXCJ1c2UgY2xpZW50XCI7XG5cbi8vIHNyYy91c2VNdXRhdGlvblN0YXRlLnRzXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IG5vdGlmeU1hbmFnZXIsIHJlcGxhY2VFcXVhbERlZXAgfSBmcm9tIFwiQHRhbnN0YWNrL3F1ZXJ5LWNvcmVcIjtcbmltcG9ydCB7IHVzZVF1ZXJ5Q2xpZW50IH0gZnJvbSBcIi4vUXVlcnlDbGllbnRQcm92aWRlci5qc1wiO1xuZnVuY3Rpb24gdXNlSXNNdXRhdGluZyhmaWx0ZXJzLCBxdWVyeUNsaWVudCkge1xuICBjb25zdCBjbGllbnQgPSB1c2VRdWVyeUNsaWVudChxdWVyeUNsaWVudCk7XG4gIHJldHVybiB1c2VNdXRhdGlvblN0YXRlKFxuICAgIHsgZmlsdGVyczogeyAuLi5maWx0ZXJzLCBzdGF0dXM6IFwicGVuZGluZ1wiIH0gfSxcbiAgICBjbGllbnRcbiAgKS5sZW5ndGg7XG59XG5mdW5jdGlvbiBnZXRSZXN1bHQobXV0YXRpb25DYWNoZSwgb3B0aW9ucykge1xuICByZXR1cm4gbXV0YXRpb25DYWNoZS5maW5kQWxsKG9wdGlvbnMuZmlsdGVycykubWFwKFxuICAgIChtdXRhdGlvbikgPT4gb3B0aW9ucy5zZWxlY3QgPyBvcHRpb25zLnNlbGVjdChtdXRhdGlvbikgOiBtdXRhdGlvbi5zdGF0ZVxuICApO1xufVxuZnVuY3Rpb24gdXNlTXV0YXRpb25TdGF0ZShvcHRpb25zID0ge30sIHF1ZXJ5Q2xpZW50KSB7XG4gIGNvbnN0IG11dGF0aW9uQ2FjaGUgPSB1c2VRdWVyeUNsaWVudChxdWVyeUNsaWVudCkuZ2V0TXV0YXRpb25DYWNoZSgpO1xuICBjb25zdCBvcHRpb25zUmVmID0gUmVhY3QudXNlUmVmKG9wdGlvbnMpO1xuICBjb25zdCByZXN1bHQgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGlmIChyZXN1bHQuY3VycmVudCA9PT0gbnVsbCkge1xuICAgIHJlc3VsdC5jdXJyZW50ID0gZ2V0UmVzdWx0KG11dGF0aW9uQ2FjaGUsIG9wdGlvbnMpO1xuICB9XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb3B0aW9uc1JlZi5jdXJyZW50ID0gb3B0aW9ucztcbiAgfSk7XG4gIHJldHVybiBSZWFjdC51c2VTeW5jRXh0ZXJuYWxTdG9yZShcbiAgICBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAgIChvblN0b3JlQ2hhbmdlKSA9PiBtdXRhdGlvbkNhY2hlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHRSZXN1bHQgPSByZXBsYWNlRXF1YWxEZWVwKFxuICAgICAgICAgIHJlc3VsdC5jdXJyZW50LFxuICAgICAgICAgIGdldFJlc3VsdChtdXRhdGlvbkNhY2hlLCBvcHRpb25zUmVmLmN1cnJlbnQpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChyZXN1bHQuY3VycmVudCAhPT0gbmV4dFJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdC5jdXJyZW50ID0gbmV4dFJlc3VsdDtcbiAgICAgICAgICBub3RpZnlNYW5hZ2VyLnNjaGVkdWxlKG9uU3RvcmVDaGFuZ2UpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIFttdXRhdGlvbkNhY2hlXVxuICAgICksXG4gICAgKCkgPT4gcmVzdWx0LmN1cnJlbnQsXG4gICAgKCkgPT4gcmVzdWx0LmN1cnJlbnRcbiAgKTtcbn1cbmV4cG9ydCB7XG4gIHVzZUlzTXV0YXRpbmcsXG4gIHVzZU11dGF0aW9uU3RhdGVcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VNdXRhdGlvblN0YXRlLmpzLm1hcCIsIlwidXNlIGNsaWVudFwiO1xuXG4vLyBzcmMvdXNlTXV0YXRpb24udHNcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHtcbiAgTXV0YXRpb25PYnNlcnZlcixcbiAgbm9vcCxcbiAgbm90aWZ5TWFuYWdlcixcbiAgc2hvdWxkVGhyb3dFcnJvclxufSBmcm9tIFwiQHRhbnN0YWNrL3F1ZXJ5LWNvcmVcIjtcbmltcG9ydCB7IHVzZVF1ZXJ5Q2xpZW50IH0gZnJvbSBcIi4vUXVlcnlDbGllbnRQcm92aWRlci5qc1wiO1xuZnVuY3Rpb24gdXNlTXV0YXRpb24ob3B0aW9ucywgcXVlcnlDbGllbnQpIHtcbiAgY29uc3QgY2xpZW50ID0gdXNlUXVlcnlDbGllbnQocXVlcnlDbGllbnQpO1xuICBjb25zdCBbb2JzZXJ2ZXJdID0gUmVhY3QudXNlU3RhdGUoXG4gICAgKCkgPT4gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoXG4gICAgICBjbGllbnQsXG4gICAgICBvcHRpb25zXG4gICAgKVxuICApO1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9ic2VydmVyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gIH0sIFtvYnNlcnZlciwgb3B0aW9uc10pO1xuICBjb25zdCByZXN1bHQgPSBSZWFjdC51c2VTeW5jRXh0ZXJuYWxTdG9yZShcbiAgICBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAgIChvblN0b3JlQ2hhbmdlKSA9PiBvYnNlcnZlci5zdWJzY3JpYmUobm90aWZ5TWFuYWdlci5iYXRjaENhbGxzKG9uU3RvcmVDaGFuZ2UpKSxcbiAgICAgIFtvYnNlcnZlcl1cbiAgICApLFxuICAgICgpID0+IG9ic2VydmVyLmdldEN1cnJlbnRSZXN1bHQoKSxcbiAgICAoKSA9PiBvYnNlcnZlci5nZXRDdXJyZW50UmVzdWx0KClcbiAgKTtcbiAgY29uc3QgbXV0YXRlID0gUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgKHZhcmlhYmxlcywgbXV0YXRlT3B0aW9ucykgPT4ge1xuICAgICAgb2JzZXJ2ZXIubXV0YXRlKHZhcmlhYmxlcywgbXV0YXRlT3B0aW9ucykuY2F0Y2gobm9vcCk7XG4gICAgfSxcbiAgICBbb2JzZXJ2ZXJdXG4gICk7XG4gIGlmIChyZXN1bHQuZXJyb3IgJiYgc2hvdWxkVGhyb3dFcnJvcihvYnNlcnZlci5vcHRpb25zLnRocm93T25FcnJvciwgW3Jlc3VsdC5lcnJvcl0pKSB7XG4gICAgdGhyb3cgcmVzdWx0LmVycm9yO1xuICB9XG4gIHJldHVybiB7IC4uLnJlc3VsdCwgbXV0YXRlLCBtdXRhdGVBc3luYzogcmVzdWx0Lm11dGF0ZSB9O1xufVxuZXhwb3J0IHtcbiAgdXNlTXV0YXRpb25cbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VNdXRhdGlvbi5qcy5tYXAiLCIvLyBzcmMvbXV0YXRpb25PcHRpb25zLnRzXG5mdW5jdGlvbiBtdXRhdGlvbk9wdGlvbnMob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucztcbn1cbmV4cG9ydCB7XG4gIG11dGF0aW9uT3B0aW9uc1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW11dGF0aW9uT3B0aW9ucy5qcy5tYXAiLCJcInVzZSBjbGllbnRcIjtcblxuLy8gc3JjL3VzZUluZmluaXRlUXVlcnkudHNcbmltcG9ydCB7IEluZmluaXRlUXVlcnlPYnNlcnZlciB9IGZyb20gXCJAdGFuc3RhY2svcXVlcnktY29yZVwiO1xuaW1wb3J0IHsgdXNlQmFzZVF1ZXJ5IH0gZnJvbSBcIi4vdXNlQmFzZVF1ZXJ5LmpzXCI7XG5mdW5jdGlvbiB1c2VJbmZpbml0ZVF1ZXJ5KG9wdGlvbnMsIHF1ZXJ5Q2xpZW50KSB7XG4gIHJldHVybiB1c2VCYXNlUXVlcnkoXG4gICAgb3B0aW9ucyxcbiAgICBJbmZpbml0ZVF1ZXJ5T2JzZXJ2ZXIsXG4gICAgcXVlcnlDbGllbnRcbiAgKTtcbn1cbmV4cG9ydCB7XG4gIHVzZUluZmluaXRlUXVlcnlcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11c2VJbmZpbml0ZVF1ZXJ5LmpzLm1hcCJdLCJtYXBwaW5ncyI6Ijs7OztBQUNBLElBQUksZUFBZSxNQUFNO0NBQ3ZCLGNBQWM7RUFDWixLQUFLLDRCQUE0QixJQUFJLElBQUk7RUFDekMsS0FBSyxZQUFZLEtBQUssVUFBVSxLQUFLLElBQUk7Q0FDM0M7Q0FDQSxVQUFVLFVBQVU7RUFDbEIsS0FBSyxVQUFVLElBQUksUUFBUTtFQUMzQixLQUFLLFlBQVk7RUFDakIsYUFBYTtHQUNYLEtBQUssVUFBVSxPQUFPLFFBQVE7R0FDOUIsS0FBSyxjQUFjO0VBQ3JCO0NBQ0Y7Q0FDQSxlQUFlO0VBQ2IsT0FBTyxLQUFLLFVBQVUsT0FBTztDQUMvQjtDQUNBLGNBQWMsQ0FDZDtDQUNBLGdCQUFnQixDQUNoQjtBQUNGOzs7QUNuQkEsSUFBSSxlQUFlLGNBQWMsYUFBYTtDQUM1QztDQUNBO0NBQ0E7Q0FDQSxjQUFjO0VBQ1osTUFBTTtFQUNOLEtBQUtBLFVBQVUsWUFBWTtHQUN6QixJQUFJLE9BQU8sV0FBVyxlQUFlLE9BQU8sa0JBQWtCO0lBQzVELE1BQU0saUJBQWlCLFFBQVE7SUFDL0IsT0FBTyxpQkFBaUIsb0JBQW9CLFVBQVUsS0FBSztJQUMzRCxhQUFhO0tBQ1gsT0FBTyxvQkFBb0Isb0JBQW9CLFFBQVE7SUFDekQ7R0FDRjtFQUVGO0NBQ0Y7Q0FDQSxjQUFjO0VBQ1osSUFBSSxDQUFDLEtBQUtDLFVBQ1IsS0FBSyxpQkFBaUIsS0FBS0QsTUFBTTtDQUVyQztDQUNBLGdCQUFnQjtFQUNkLElBQUksQ0FBQyxLQUFLLGFBQWEsR0FBRztHQUN4QixLQUFLQyxXQUFXO0dBQ2hCLEtBQUtBLFdBQVcsS0FBSztFQUN2QjtDQUNGO0NBQ0EsaUJBQWlCLE9BQU87RUFDdEIsS0FBS0QsU0FBUztFQUNkLEtBQUtDLFdBQVc7RUFDaEIsS0FBS0EsV0FBVyxPQUFPLFlBQVk7R0FDakMsSUFBSSxPQUFPLFlBQVksV0FDckIsS0FBSyxXQUFXLE9BQU87UUFFdkIsS0FBSyxRQUFRO0VBRWpCLENBQUM7Q0FDSDtDQUNBLFdBQVcsU0FBUztFQUVsQixJQURnQixLQUFLQyxhQUFhLFNBQ3JCO0dBQ1gsS0FBS0EsV0FBVztHQUNoQixLQUFLLFFBQVE7RUFDZjtDQUNGO0NBQ0EsVUFBVTtFQUNSLE1BQU0sWUFBWSxLQUFLLFVBQVU7RUFDakMsS0FBSyxVQUFVLFNBQVMsYUFBYTtHQUNuQyxTQUFTLFNBQVM7RUFDcEIsQ0FBQztDQUNIO0NBQ0EsWUFBWTtFQUNWLElBQUksT0FBTyxLQUFLQSxhQUFhLFdBQzNCLE9BQU8sS0FBS0E7RUFFZCxPQUFPLFdBQVcsVUFBVSxvQkFBb0I7Q0FDbEQ7QUFDRjtBQUNBLElBQUksZUFBZSxJQUFJLGFBQWE7OztBQzVEcEMsSUFBSSx5QkFBeUI7Q0FXM0IsYUFBYSxVQUFVLFVBQVUsV0FBVyxVQUFVLEtBQUs7Q0FDM0QsZUFBZSxjQUFjLGFBQWEsU0FBUztDQUNuRCxjQUFjLFVBQVUsVUFBVSxZQUFZLFVBQVUsS0FBSztDQUM3RCxnQkFBZ0IsZUFBZSxjQUFjLFVBQVU7QUFDekQ7QUFDQSxJQUFJLGlCQUFpQixNQUFNO0NBUXpCLFlBQVk7Q0FDWixrQkFBa0I7Q0FDbEIsbUJBQW1CLFVBQVU7RUFFekIsSUFBSSxLQUFLQyxtQkFBbUIsYUFBYSxLQUFLQyxXQUM1QyxRQUFRLE1BQ04sOEdBQ0E7R0FBRSxVQUFVLEtBQUtBO0dBQVc7RUFBUyxDQUN2QztFQUdKLEtBQUtBLFlBQVk7RUFFZixLQUFLRCxrQkFBa0I7Q0FFM0I7Q0FDQSxXQUFXLFVBQVUsT0FBTztFQUV4QixLQUFLQSxrQkFBa0I7RUFFekIsT0FBTyxLQUFLQyxVQUFVLFdBQVcsVUFBVSxLQUFLO0NBQ2xEO0NBQ0EsYUFBYSxXQUFXO0VBQ3RCLEtBQUtBLFVBQVUsYUFBYSxTQUFTO0NBQ3ZDO0NBQ0EsWUFBWSxVQUFVLE9BQU87RUFFekIsS0FBS0Qsa0JBQWtCO0VBRXpCLE9BQU8sS0FBS0MsVUFBVSxZQUFZLFVBQVUsS0FBSztDQUNuRDtDQUNBLGNBQWMsWUFBWTtFQUN4QixLQUFLQSxVQUFVLGNBQWMsVUFBVTtDQUN6QztBQUNGO0FBQ0EsSUFBSSxpQkFBaUIsSUFBSSxlQUFlO0FBQ3hDLFNBQVMscUJBQXFCLFVBQVU7Q0FDdEMsV0FBVyxVQUFVLENBQUM7QUFDeEI7OztBQzdEQSxJQUFJLFdBQVcsT0FBTyxXQUFXLGVBQWUsVUFBVTtBQUMxRCxTQUFTLE9BQU8sQ0FDaEI7QUFDQSxTQUFTLGlCQUFpQixTQUFTLE9BQU87Q0FDeEMsT0FBTyxPQUFPLFlBQVksYUFBYSxRQUFRLEtBQUssSUFBSTtBQUMxRDtBQUNBLFNBQVMsZUFBZSxPQUFPO0NBQzdCLE9BQU8sT0FBTyxVQUFVLFlBQVksU0FBUyxLQUFLLFVBQVU7QUFDOUQ7QUFDQSxTQUFTLGVBQWUsV0FBVyxXQUFXO0NBQzVDLE9BQU8sS0FBSyxJQUFJLGFBQWEsYUFBYSxLQUFLLEtBQUssSUFBSSxHQUFHLENBQUM7QUFDOUQ7QUFDQSxTQUFTLGlCQUFpQixXQUFXLE9BQU87Q0FDMUMsT0FBTyxPQUFPLGNBQWMsYUFBYSxVQUFVLEtBQUssSUFBSTtBQUM5RDtBQUNBLFNBQVMsb0JBQW9CLFFBQVEsT0FBTztDQUMxQyxPQUFPLE9BQU8sV0FBVyxhQUFhLE9BQU8sS0FBSyxJQUFJO0FBQ3hEO0FBQ0EsU0FBUyxXQUFXLFNBQVMsT0FBTztDQUNsQyxNQUFNLEVBQ0osT0FBTyxPQUNQLE9BQ0EsYUFDQSxXQUNBLFVBQ0EsVUFDRTtDQUNKLElBQUksVUFDRTtNQUFBLE9BQ0U7T0FBQSxNQUFNLGNBQWMsc0JBQXNCLFVBQVUsTUFBTSxPQUFPLEdBQ25FLE9BQU87RUFBQSxPQUVKLElBQUksQ0FBQyxnQkFBZ0IsTUFBTSxVQUFVLFFBQVEsR0FDbEQsT0FBTztDQUFBO0NBR1gsSUFBSSxTQUFTLE9BQU87RUFDbEIsTUFBTSxXQUFXLE1BQU0sU0FBUztFQUNoQyxJQUFJLFNBQVMsWUFBWSxDQUFDLFVBQ3hCLE9BQU87RUFFVCxJQUFJLFNBQVMsY0FBYyxVQUN6QixPQUFPO0NBRVg7Q0FDQSxJQUFJLE9BQU8sVUFBVSxhQUFhLE1BQU0sUUFBUSxNQUFNLE9BQ3BELE9BQU87Q0FFVCxJQUFJLGVBQWUsZ0JBQWdCLE1BQU0sTUFBTSxhQUM3QyxPQUFPO0NBRVQsSUFBSSxhQUFhLENBQUMsVUFBVSxLQUFLLEdBQy9CLE9BQU87Q0FFVCxPQUFPO0FBQ1Q7QUFDQSxTQUFTLGNBQWMsU0FBUyxVQUFVO0NBQ3hDLE1BQU0sRUFBRSxPQUFPLFFBQVEsV0FBVyxnQkFBZ0I7Q0FDbEQsSUFBSSxhQUFhO0VBQ2YsSUFBSSxDQUFDLFNBQVMsUUFBUSxhQUNwQixPQUFPO0VBRVQsSUFBSSxPQUNFO09BQUEsUUFBUSxTQUFTLFFBQVEsV0FBVyxNQUFNLFFBQVEsV0FBVyxHQUMvRCxPQUFPO0VBQUEsT0FFSixJQUFJLENBQUMsZ0JBQWdCLFNBQVMsUUFBUSxhQUFhLFdBQVcsR0FDbkUsT0FBTztDQUVYO0NBQ0EsSUFBSSxVQUFVLFNBQVMsTUFBTSxXQUFXLFFBQ3RDLE9BQU87Q0FFVCxJQUFJLGFBQWEsQ0FBQyxVQUFVLFFBQVEsR0FDbEMsT0FBTztDQUVULE9BQU87QUFDVDtBQUNBLFNBQVMsc0JBQXNCLFVBQVUsU0FBUztDQUVoRCxRQURlLFNBQVMsa0JBQWtCLFFBQUEsQ0FDNUIsUUFBUTtBQUN4QjtBQUNBLFNBQVMsUUFBUSxVQUFVO0NBQ3pCLE9BQU8sS0FBSyxVQUNWLFdBQ0MsR0FBRyxRQUFRLGNBQWMsR0FBRyxJQUFJLE9BQU8sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLFFBQVEsUUFBUTtFQUMvRSxPQUFPLE9BQU8sSUFBSTtFQUNsQixPQUFPO0NBQ1QsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUNYO0FBQ0Y7QUFDQSxTQUFTLGdCQUFnQixHQUFHLEdBQUc7Q0FDN0IsSUFBSSxNQUFNLEdBQ1IsT0FBTztDQUVULElBQUksT0FBTyxNQUFNLE9BQU8sR0FDdEIsT0FBTztDQUVULElBQUksS0FBSyxLQUFLLE9BQU8sTUFBTSxZQUFZLE9BQU8sTUFBTSxVQUNsRCxPQUFPLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLFFBQVEsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQztDQUV0RSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLFNBQVMsT0FBTyxVQUFVO0FBQzlCLFNBQVMsaUJBQWlCLEdBQUcsR0FBRyxRQUFRLEdBQUc7Q0FDekMsSUFBSSxNQUFNLEdBQ1IsT0FBTztDQUVULElBQUksUUFBUSxLQUFLLE9BQU87Q0FDeEIsTUFBTSxRQUFRLGFBQWEsQ0FBQyxLQUFLLGFBQWEsQ0FBQztDQUMvQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxLQUFLLGNBQWMsQ0FBQyxJQUFJLE9BQU87Q0FFOUQsTUFBTSxTQURTLFFBQVEsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFBLENBQ25CO0NBQ3JCLE1BQU0sU0FBUyxRQUFRLElBQUksT0FBTyxLQUFLLENBQUM7Q0FDeEMsTUFBTSxRQUFRLE9BQU87Q0FDckIsTUFBTSxPQUFPLFFBQVEsSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDO0NBQ3pDLElBQUksYUFBYTtDQUNqQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksT0FBTyxLQUFLO0VBQzlCLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTztFQUMvQixNQUFNLFFBQVEsRUFBRTtFQUNoQixNQUFNLFFBQVEsRUFBRTtFQUNoQixJQUFJLFVBQVUsT0FBTztHQUNuQixLQUFLLE9BQU87R0FDWixJQUFJLFFBQVEsSUFBSSxRQUFRLE9BQU8sS0FBSyxHQUFHLEdBQUcsR0FBRztHQUM3QztFQUNGO0VBQ0EsSUFBSSxVQUFVLFFBQVEsVUFBVSxRQUFRLE9BQU8sVUFBVSxZQUFZLE9BQU8sVUFBVSxVQUFVO0dBQzlGLEtBQUssT0FBTztHQUNaO0VBQ0Y7RUFDQSxNQUFNLElBQUksaUJBQWlCLE9BQU8sT0FBTyxRQUFRLENBQUM7RUFDbEQsS0FBSyxPQUFPO0VBQ1osSUFBSSxNQUFNLE9BQU87Q0FDbkI7Q0FDQSxPQUFPLFVBQVUsU0FBUyxlQUFlLFFBQVEsSUFBSTtBQUN2RDtBQUNBLFNBQVMsb0JBQW9CLEdBQUcsR0FBRztDQUNqQyxJQUFJLENBQUMsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsV0FBVyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFDakQsT0FBTztDQUVULEtBQUssTUFBTSxPQUFPLEdBQ2hCLElBQUksRUFBRSxTQUFTLEVBQUUsTUFDZixPQUFPO0NBR1gsT0FBTztBQUNUO0FBQ0EsU0FBUyxhQUFhLE9BQU87Q0FDM0IsT0FBTyxNQUFNLFFBQVEsS0FBSyxLQUFLLE1BQU0sV0FBVyxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDckU7QUFDQSxTQUFTLGNBQWMsR0FBRztDQUN4QixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FDdkIsT0FBTztDQUVULE1BQU0sT0FBTyxFQUFFO0NBQ2YsSUFBSSxTQUFTLEtBQUssR0FDaEIsT0FBTztDQUVULE1BQU0sT0FBTyxLQUFLO0NBQ2xCLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxHQUMxQixPQUFPO0NBRVQsSUFBSSxDQUFDLEtBQUssZUFBZSxlQUFlLEdBQ3RDLE9BQU87Q0FFVCxJQUFJLE9BQU8sZUFBZSxDQUFDLE1BQU0sT0FBTyxXQUN0QyxPQUFPO0NBRVQsT0FBTztBQUNUO0FBQ0EsU0FBUyxtQkFBbUIsR0FBRztDQUM3QixPQUFPLE9BQU8sVUFBVSxTQUFTLEtBQUssQ0FBQyxNQUFNO0FBQy9DO0FBQ0EsU0FBUyxNQUFNLFNBQVM7Q0FDdEIsT0FBTyxJQUFJLFNBQVMsWUFBWTtFQUM5QixlQUFlLFdBQVcsU0FBUyxPQUFPO0NBQzVDLENBQUM7QUFDSDtBQUNBLFNBQVMsWUFBWSxVQUFVLE1BQU0sU0FBUztDQUM1QyxJQUFJLE9BQU8sUUFBUSxzQkFBc0IsWUFDdkMsT0FBTyxRQUFRLGtCQUFrQixVQUFVLElBQUk7TUFDMUMsSUFBSSxRQUFRLHNCQUFzQixPQUVyQyxJQUFJO0VBQ0YsT0FBTyxpQkFBaUIsVUFBVSxJQUFJO0NBQ3hDLFNBQVMsT0FBTztFQUNkLFFBQVEsTUFDTiwwSkFBMEosUUFBUSxVQUFVLEtBQUssT0FDbkw7RUFDQSxNQUFNO0NBQ1I7Q0FJSixPQUFPO0FBQ1Q7QUFDQSxTQUFTLGlCQUFpQixjQUFjO0NBQ3RDLE9BQU87QUFDVDtBQUNBLFNBQVMsU0FBUyxPQUFPLE1BQU0sTUFBTSxHQUFHO0NBQ3RDLE1BQU0sV0FBVyxDQUFDLEdBQUcsT0FBTyxJQUFJO0NBQ2hDLE9BQU8sT0FBTyxTQUFTLFNBQVMsTUFBTSxTQUFTLE1BQU0sQ0FBQyxJQUFJO0FBQzVEO0FBQ0EsU0FBUyxXQUFXLE9BQU8sTUFBTSxNQUFNLEdBQUc7Q0FDeEMsTUFBTSxXQUFXLENBQUMsTUFBTSxHQUFHLEtBQUs7Q0FDaEMsT0FBTyxPQUFPLFNBQVMsU0FBUyxNQUFNLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSTtBQUNoRTtBQUNBLElBQUksWUFBNEIsdUJBQU87QUFDdkMsU0FBUyxjQUFjLFNBQVMsY0FBYztDQUUxQyxJQUFJLFFBQVEsWUFBWSxXQUN0QixRQUFRLE1BQ04seUdBQXlHLFFBQVEsVUFBVSxFQUM3SDtDQUdKLElBQUksQ0FBQyxRQUFRLFdBQVcsY0FBYyxnQkFDcEMsYUFBYSxhQUFhO0NBRTVCLElBQUksQ0FBQyxRQUFRLFdBQVcsUUFBUSxZQUFZLFdBQzFDLGFBQWEsUUFBUSx1QkFBTyxJQUFJLE1BQU0scUJBQXFCLFFBQVEsVUFBVSxFQUFFLENBQUM7Q0FFbEYsT0FBTyxRQUFRO0FBQ2pCO0FBQ0EsU0FBUyxpQkFBaUIsY0FBYyxRQUFRO0NBQzlDLElBQUksT0FBTyxpQkFBaUIsWUFDMUIsT0FBTyxhQUFhLEdBQUcsTUFBTTtDQUUvQixPQUFPLENBQUMsQ0FBQztBQUNYO0FBQ0EsU0FBUyxzQkFBc0IsUUFBUSxXQUFXLGFBQWE7Q0FDN0QsSUFBSSxXQUFXO0NBQ2YsSUFBSTtDQUNKLE9BQU8sZUFBZSxRQUFRLFVBQVU7RUFDdEMsWUFBWTtFQUNaLFdBQVc7R0FDVCxXQUFXLFVBQVU7R0FDckIsSUFBSSxVQUNGLE9BQU87R0FFVCxXQUFXO0dBQ1gsSUFBSSxPQUFPLFNBQ1QsWUFBWTtRQUVaLE9BQU8saUJBQWlCLFNBQVMsYUFBYSxFQUFFLE1BQU0sS0FBSyxDQUFDO0dBRTlELE9BQU87RUFDVDtDQUNGLENBQUM7Q0FDRCxPQUFPO0FBQ1Q7OztBQzFQQSxJQUFJLHFCQUFxQyx1QkFBTztDQUM5QyxJQUFJLG1CQUFtQjtDQUN2QixPQUFPOzs7O0VBSUwsV0FBVztHQUNULE9BQU8sV0FBVztFQUNwQjs7OztFQUlBLFlBQVksZUFBZTtHQUN6QixhQUFhO0VBQ2Y7Q0FDRjtBQUNGLEVBQUEsQ0FBRzs7O0FDaEJILFNBQVMsa0JBQWtCO0NBQ3pCLElBQUk7Q0FDSixJQUFJO0NBQ0osTUFBTSxXQUFXLElBQUksU0FBUyxVQUFVLFlBQVk7RUFDbEQsVUFBVTtFQUNWLFNBQVM7Q0FDWCxDQUFDO0NBQ0QsU0FBUyxTQUFTO0NBQ2xCLFNBQVMsWUFBWSxDQUNyQixDQUFDO0NBQ0QsU0FBUyxTQUFTLE1BQU07RUFDdEIsT0FBTyxPQUFPLFVBQVUsSUFBSTtFQUM1QixPQUFPLFNBQVM7RUFDaEIsT0FBTyxTQUFTO0NBQ2xCO0NBQ0EsU0FBUyxXQUFXLFVBQVU7RUFDNUIsU0FBUztHQUNQLFFBQVE7R0FDUjtFQUNGLENBQUM7RUFDRCxRQUFRLEtBQUs7Q0FDZjtDQUNBLFNBQVMsVUFBVSxXQUFXO0VBQzVCLFNBQVM7R0FDUCxRQUFRO0dBQ1I7RUFDRixDQUFDO0VBQ0QsT0FBTyxNQUFNO0NBQ2Y7Q0FDQSxPQUFPO0FBQ1Q7QUFDQSxTQUFTLGVBQWUsU0FBUztDQUMvQixJQUFJO0NBQ0osUUFBUSxNQUFNLFdBQVc7RUFDdkIsT0FBTztFQUNQLE9BQU87Q0FDVCxHQUFHLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSTtDQUNwQixJQUFJLFNBQVMsS0FBSyxHQUNoQixPQUFPLEVBQUUsS0FBSztBQUdsQjs7O0FDeENBLFNBQVMscUJBQXFCLE1BQU07Q0FDbEMsT0FBTztBQUNUO0FBQ0EsU0FBUyxrQkFBa0IsVUFBVTtDQUNuQyxPQUFPO0VBQ0wsYUFBYSxTQUFTLFFBQVE7RUFDOUIsT0FBTyxTQUFTO0VBQ2hCLEdBQUcsU0FBUyxRQUFRLFNBQVMsRUFBRSxPQUFPLFNBQVMsUUFBUSxNQUFNO0VBQzdELEdBQUcsU0FBUyxRQUFRLEVBQUUsTUFBTSxTQUFTLEtBQUs7Q0FDNUM7QUFDRjtBQUNBLFNBQVMsZUFBZSxPQUFPLGVBQWUsb0JBQW9CO0NBQ2hFLE1BQU0seUJBQXlCO0VBQzdCLE1BQU0sVUFBVSxNQUFNLFNBQVMsS0FBSyxhQUFhLENBQUMsQ0FBQyxPQUFPLFVBQVU7R0FDbEUsSUFBSSxDQUFDLG1CQUFtQixLQUFLLEdBQzNCLE9BQU8sUUFBUSxPQUFPLEtBQUs7R0FHM0IsUUFBUSxNQUNOLCtEQUErRCxNQUFNLFVBQVUsS0FBSyxNQUFNLGtEQUM1RjtHQUVGLE9BQU8sUUFBUSx1QkFBTyxJQUFJLE1BQU0sVUFBVSxDQUFDO0VBQzdDLENBQUM7RUFDRCxTQUFTLE1BQU0sSUFBSTtFQUNuQixPQUFPO0NBQ1Q7Q0FDQSxPQUFPO0VBQ0wsY0FBYyxLQUFLLElBQUk7RUFDdkIsT0FBTztHQUNMLEdBQUcsTUFBTTtHQUNULEdBQUcsTUFBTSxNQUFNLFNBQVMsS0FBSyxLQUFLLEVBQ2hDLE1BQU0sY0FBYyxNQUFNLE1BQU0sSUFBSSxFQUN0QztFQUNGO0VBQ0EsVUFBVSxNQUFNO0VBQ2hCLFdBQVcsTUFBTTtFQUNqQixHQUFHLE1BQU0sTUFBTSxXQUFXLGFBQWEsRUFDckMsU0FBUyxpQkFBaUIsRUFDNUI7RUFDQSxHQUFHLE1BQU0sUUFBUSxFQUFFLE1BQU0sTUFBTSxLQUFLO0VBQ3BDLEdBQUcsTUFBTSxhQUFhLEVBQUUsV0FBVyxNQUFNLFVBQVU7Q0FDckQ7QUFDRjtBQUNBLFNBQVMsK0JBQStCLFVBQVU7Q0FDaEQsT0FBTyxTQUFTLE1BQU07QUFDeEI7QUFDQSxTQUFTLDRCQUE0QixPQUFPO0NBQzFDLE9BQU8sTUFBTSxNQUFNLFdBQVc7QUFDaEM7QUFDQSxTQUFTLDBCQUEwQixHQUFHO0NBQ3BDLE9BQU87QUFDVDtBQUNBLFNBQVMsVUFBVSxRQUFRLFVBQVUsQ0FBQyxHQUFHO0NBQ3ZDLE1BQU0saUJBQWlCLFFBQVEsMkJBQTJCLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxXQUFXLDJCQUEyQjtDQUMzSCxNQUFNLFlBQVksT0FBTyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQ2xELGFBQWEsZUFBZSxRQUFRLElBQUksQ0FBQyxrQkFBa0IsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUM1RTtDQUNBLE1BQU0sY0FBYyxRQUFRLHdCQUF3QixPQUFPLGtCQUFrQixDQUFDLENBQUMsV0FBVyx3QkFBd0I7Q0FDbEgsTUFBTSxxQkFBcUIsUUFBUSxzQkFBc0IsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLFdBQVcsc0JBQXNCO0NBQ3JILE1BQU0sZ0JBQWdCLFFBQVEsaUJBQWlCLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxXQUFXLGlCQUFpQjtDQUl0RyxPQUFPO0VBQUU7RUFBVyxTQUhKLE9BQU8sY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FDN0MsVUFBVSxZQUFZLEtBQUssSUFBSSxDQUFDLGVBQWUsT0FBTyxlQUFlLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUV0RTtDQUFFO0FBQzlCO0FBQ0EsU0FBUyxRQUFRLFFBQVEsaUJBQWlCLFNBQVM7Q0FDakQsSUFBSSxPQUFPLG9CQUFvQixZQUFZLG9CQUFvQixNQUM3RDtDQUVGLE1BQU0sZ0JBQWdCLE9BQU8saUJBQWlCO0NBQzlDLE1BQU0sYUFBYSxPQUFPLGNBQWM7Q0FDeEMsTUFBTSxrQkFBa0IsU0FBUyxnQkFBZ0IsbUJBQW1CLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxTQUFTLG1CQUFtQjtDQUMzSCxNQUFNLFlBQVksZ0JBQWdCLGFBQWEsQ0FBQztDQUNoRCxNQUFNLFVBQVUsZ0JBQWdCLFdBQVcsQ0FBQztDQUM1QyxVQUFVLFNBQVMsRUFBRSxPQUFPLEdBQUcsc0JBQXNCO0VBQ25ELGNBQWMsTUFDWixRQUNBO0dBQ0UsR0FBRyxPQUFPLGtCQUFrQixDQUFDLENBQUMsU0FBUztHQUN2QyxHQUFHLFNBQVMsZ0JBQWdCO0dBQzVCLEdBQUc7RUFDTCxHQUNBLEtBQ0Y7Q0FDRixDQUFDO0NBQ0QsUUFBUSxTQUNMLEVBQ0MsVUFDQSxPQUNBLFdBQ0EsTUFDQSxTQUNBLGNBQ0EsZ0JBQ0k7RUFDSixNQUFNLFdBQVcsVUFBVSxlQUFlLE9BQU8sSUFBSSxLQUFLO0VBQzFELE1BQU0sVUFBVSxNQUFNLFNBQVMsS0FBSyxJQUFJLFVBQVUsT0FBTyxNQUFNO0VBQy9ELE1BQU0sT0FBTyxZQUFZLEtBQUssSUFBSSxVQUFVLGdCQUFnQixPQUFPO0VBQ25FLElBQUksUUFBUSxXQUFXLElBQUksU0FBUztFQUNwQyxNQUFNLHlCQUF5QixPQUFPLE1BQU0sV0FBVztFQUN2RCxNQUFNLDBCQUEwQixPQUFPLE1BQU0sZ0JBQWdCO0VBQzdELElBQUksT0FBTztHQUNULE1BQU0sbUJBQW1CLFlBRXpCLGlCQUFpQixLQUFLLEtBQUssZUFBZSxNQUFNLE1BQU07R0FDdEQsSUFBSSxNQUFNLGdCQUFnQixNQUFNLE1BQU0saUJBQWlCLGtCQUFrQjtJQUN2RSxNQUFNLEVBQUUsYUFBYSxVQUFVLEdBQUcsb0JBQW9CO0lBQ3RELE1BQU0sU0FBUztLQUNiLEdBQUc7S0FDSDtLQU1BLEdBQUcsTUFBTSxXQUFXLGFBQWEsU0FBUyxLQUFLLEtBQUs7TUFDbEQsUUFBUTtNQUVSLEdBQUcsQ0FBQywyQkFBMkIsRUFDN0IsYUFBYSxPQUNmO0tBQ0Y7SUFDRixDQUFDO0dBQ0g7RUFDRixPQUNFLFFBQVEsV0FBVyxNQUNqQixRQUNBO0dBQ0UsR0FBRyxPQUFPLGtCQUFrQixDQUFDLENBQUMsU0FBUztHQUN2QyxHQUFHLFNBQVMsZ0JBQWdCO0dBQzVCO0dBQ0E7R0FDQTtHQUNBLE9BQU87RUFDVCxHQUdBO0dBQ0UsR0FBRztHQUNIO0dBQ0EsYUFBYTtHQUdiLFFBQVEsTUFBTSxXQUFXLGFBQWEsU0FBUyxLQUFLLElBQUksWUFBWSxNQUFNO0VBQzVFLENBQ0Y7RUFFRixJQUFJLFdBRUosQ0FBQyxZQUFZLENBQUMsMEJBQTBCLENBQUMsNEJBRXhDLGlCQUFpQixLQUFLLEtBQUssZUFBZSxNQUFNLE1BQU0sZ0JBQ3JELE1BQU0sTUFBTSxLQUFLLEdBQUcsRUFFbEIsZ0JBQWdCLFFBQVEsUUFBUSxPQUFPLENBQUMsQ0FBQyxLQUFLLGVBQWUsRUFDL0QsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJO0NBRWpCLENBQ0Y7QUFDRjs7O0FDaktBLElBQUksbUJBQW1CO0FBQ3ZCLFNBQVMsc0JBQXNCO0NBQzdCLElBQUksUUFBUSxDQUFDO0NBQ2IsSUFBSSxlQUFlO0NBQ25CLElBQUksWUFBWSxhQUFhO0VBQzNCLFNBQVM7Q0FDWDtDQUNBLElBQUksaUJBQWlCLGFBQWE7RUFDaEMsU0FBUztDQUNYO0NBQ0EsSUFBSSxhQUFhO0NBQ2pCLE1BQU0sWUFBWSxhQUFhO0VBQzdCLElBQUksY0FDRixNQUFNLEtBQUssUUFBUTtPQUVuQixpQkFBaUI7R0FDZixTQUFTLFFBQVE7RUFDbkIsQ0FBQztDQUVMO0NBQ0EsTUFBTSxjQUFjO0VBQ2xCLE1BQU0sZ0JBQWdCO0VBQ3RCLFFBQVEsQ0FBQztFQUNULElBQUksY0FBYyxRQUNoQixpQkFBaUI7R0FDZixvQkFBb0I7SUFDbEIsY0FBYyxTQUFTLGFBQWE7S0FDbEMsU0FBUyxRQUFRO0lBQ25CLENBQUM7R0FDSCxDQUFDO0VBQ0gsQ0FBQztDQUVMO0NBQ0EsT0FBTztFQUNMLFFBQVEsYUFBYTtHQUNuQixJQUFJO0dBQ0o7R0FDQSxJQUFJO0lBQ0YsU0FBUyxTQUFTO0dBQ3BCLFVBQVU7SUFDUjtJQUNBLElBQUksQ0FBQyxjQUNILE1BQU07R0FFVjtHQUNBLE9BQU87RUFDVDs7OztFQUlBLGFBQWEsYUFBYTtHQUN4QixRQUFRLEdBQUcsU0FBUztJQUNsQixlQUFlO0tBQ2IsU0FBUyxHQUFHLElBQUk7SUFDbEIsQ0FBQztHQUNIO0VBQ0Y7RUFDQTs7Ozs7RUFLQSxvQkFBb0IsT0FBTztHQUN6QixXQUFXO0VBQ2I7Ozs7O0VBS0EseUJBQXlCLE9BQU87R0FDOUIsZ0JBQWdCO0VBQ2xCO0VBQ0EsZUFBZSxPQUFPO0dBQ3BCLGFBQWE7RUFDZjtDQUNGO0FBQ0Y7QUFDQSxJQUFJLGdCQUFnQixvQkFBb0I7OztBQzdFeEMsSUFBSSxnQkFBZ0IsY0FBYyxhQUFhO0NBQzdDLFVBQVU7Q0FDVjtDQUNBO0NBQ0EsY0FBYztFQUNaLE1BQU07RUFDTixLQUFLQyxVQUFVLGFBQWE7R0FDMUIsSUFBSSxPQUFPLFdBQVcsZUFBZSxPQUFPLGtCQUFrQjtJQUM1RCxNQUFNLHVCQUF1QixTQUFTLElBQUk7SUFDMUMsTUFBTSx3QkFBd0IsU0FBUyxLQUFLO0lBQzVDLE9BQU8saUJBQWlCLFVBQVUsZ0JBQWdCLEtBQUs7SUFDdkQsT0FBTyxpQkFBaUIsV0FBVyxpQkFBaUIsS0FBSztJQUN6RCxhQUFhO0tBQ1gsT0FBTyxvQkFBb0IsVUFBVSxjQUFjO0tBQ25ELE9BQU8sb0JBQW9CLFdBQVcsZUFBZTtJQUN2RDtHQUNGO0VBRUY7Q0FDRjtDQUNBLGNBQWM7RUFDWixJQUFJLENBQUMsS0FBS0MsVUFDUixLQUFLLGlCQUFpQixLQUFLRCxNQUFNO0NBRXJDO0NBQ0EsZ0JBQWdCO0VBQ2QsSUFBSSxDQUFDLEtBQUssYUFBYSxHQUFHO0dBQ3hCLEtBQUtDLFdBQVc7R0FDaEIsS0FBS0EsV0FBVyxLQUFLO0VBQ3ZCO0NBQ0Y7Q0FDQSxpQkFBaUIsT0FBTztFQUN0QixLQUFLRCxTQUFTO0VBQ2QsS0FBS0MsV0FBVztFQUNoQixLQUFLQSxXQUFXLE1BQU0sS0FBSyxVQUFVLEtBQUssSUFBSSxDQUFDO0NBQ2pEO0NBQ0EsVUFBVSxRQUFRO0VBRWhCLElBRGdCLEtBQUtDLFlBQVksUUFDcEI7R0FDWCxLQUFLQSxVQUFVO0dBQ2YsS0FBSyxVQUFVLFNBQVMsYUFBYTtJQUNuQyxTQUFTLE1BQU07R0FDakIsQ0FBQztFQUNIO0NBQ0Y7Q0FDQSxXQUFXO0VBQ1QsT0FBTyxLQUFLQTtDQUNkO0FBQ0Y7QUFDQSxJQUFJLGdCQUFnQixJQUFJLGNBQWM7OztBQzdDdEMsU0FBUyxrQkFBa0IsY0FBYztDQUN2QyxPQUFPLEtBQUssSUFBSSxNQUFNLEtBQUssY0FBYyxHQUFHO0FBQzlDO0FBQ0EsU0FBUyxTQUFTLGFBQWE7Q0FDN0IsUUFBUSxlQUFlLGNBQWMsV0FBVyxjQUFjLFNBQVMsSUFBSTtBQUM3RTtBQUNBLElBQUksaUJBQWlCLGNBQWMsTUFBTTtDQUN2QyxZQUFZLFNBQVM7RUFDbkIsTUFBTSxnQkFBZ0I7RUFDdEIsS0FBSyxTQUFTLFNBQVM7RUFDdkIsS0FBSyxTQUFTLFNBQVM7Q0FDekI7QUFDRjtBQUNBLFNBQVMsaUJBQWlCLE9BQU87Q0FDL0IsT0FBTyxpQkFBaUI7QUFDMUI7QUFDQSxTQUFTLGNBQWMsUUFBUTtDQUM3QixJQUFJLG1CQUFtQjtDQUN2QixJQUFJLGVBQWU7Q0FDbkIsSUFBSTtDQUNKLE1BQU0sV0FBVyxnQkFBZ0I7Q0FDakMsTUFBTSxtQkFBbUIsU0FBUyxXQUFXO0NBQzdDLE1BQU0sVUFBVSxrQkFBa0I7RUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRztHQUNqQixNQUFNLFFBQVEsSUFBSSxlQUFlLGFBQWE7R0FDOUMsT0FBTyxLQUFLO0dBQ1osT0FBTyxXQUFXLEtBQUs7RUFDekI7Q0FDRjtDQUNBLE1BQU0sb0JBQW9CO0VBQ3hCLG1CQUFtQjtDQUNyQjtDQUNBLE1BQU0sc0JBQXNCO0VBQzFCLG1CQUFtQjtDQUNyQjtDQUNBLE1BQU0sb0JBQW9CLGFBQWEsVUFBVSxNQUFNLE9BQU8sZ0JBQWdCLFlBQVksY0FBYyxTQUFTLE1BQU0sT0FBTyxPQUFPO0NBQ3JJLE1BQU0saUJBQWlCLFNBQVMsT0FBTyxXQUFXLEtBQUssT0FBTyxPQUFPO0NBQ3JFLE1BQU0sV0FBVyxVQUFVO0VBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUc7R0FDakIsYUFBYTtHQUNiLFNBQVMsUUFBUSxLQUFLO0VBQ3hCO0NBQ0Y7Q0FDQSxNQUFNLFVBQVUsVUFBVTtFQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHO0dBQ2pCLGFBQWE7R0FDYixTQUFTLE9BQU8sS0FBSztFQUN2QjtDQUNGO0NBQ0EsTUFBTSxjQUFjO0VBQ2xCLE9BQU8sSUFBSSxTQUFTLG9CQUFvQjtHQUN0QyxjQUFjLFVBQVU7SUFDdEIsSUFBSSxXQUFXLEtBQUssWUFBWSxHQUM5QixnQkFBZ0IsS0FBSztHQUV6QjtHQUNBLE9BQU8sVUFBVTtFQUNuQixDQUFDLENBQUMsQ0FBQyxXQUFXO0dBQ1osYUFBYSxLQUFLO0dBQ2xCLElBQUksQ0FBQyxXQUFXLEdBQ2QsT0FBTyxhQUFhO0VBRXhCLENBQUM7Q0FDSDtDQUNBLE1BQU0sWUFBWTtFQUNoQixJQUFJLFdBQVcsR0FDYjtFQUVGLElBQUk7RUFDSixNQUFNLGlCQUFpQixpQkFBaUIsSUFBSSxPQUFPLGlCQUFpQixLQUFLO0VBQ3pFLElBQUk7R0FDRixpQkFBaUIsa0JBQWtCLE9BQU8sR0FBRztFQUMvQyxTQUFTLE9BQU87R0FDZCxpQkFBaUIsUUFBUSxPQUFPLEtBQUs7RUFDdkM7RUFDQSxRQUFRLFFBQVEsY0FBYyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsQ0FBQyxPQUFPLFVBQVU7R0FDN0QsSUFBSSxXQUFXLEdBQ2I7R0FFRixNQUFNLFFBQVEsT0FBTyxVQUFVLG1CQUFtQixTQUFTLElBQUksSUFBSTtHQUNuRSxNQUFNLGFBQWEsT0FBTyxjQUFjO0dBQ3hDLE1BQU0sUUFBUSxPQUFPLGVBQWUsYUFBYSxXQUFXLGNBQWMsS0FBSyxJQUFJO0dBQ25GLE1BQU0sY0FBYyxVQUFVLFFBQVEsT0FBTyxVQUFVLFlBQVksZUFBZSxTQUFTLE9BQU8sVUFBVSxjQUFjLE1BQU0sY0FBYyxLQUFLO0dBQ25KLElBQUksb0JBQW9CLENBQUMsYUFBYTtJQUNwQyxPQUFPLEtBQUs7SUFDWjtHQUNGO0dBQ0E7R0FDQSxPQUFPLFNBQVMsY0FBYyxLQUFLO0dBQ25DLE1BQU0sS0FBSyxDQUFDLENBQUMsV0FBVztJQUN0QixPQUFPLFlBQVksSUFBSSxLQUFLLElBQUksTUFBTTtHQUN4QyxDQUFDLENBQUMsQ0FBQyxXQUFXO0lBQ1osSUFBSSxrQkFDRixPQUFPLEtBQUs7U0FFWixJQUFJO0dBRVIsQ0FBQztFQUNILENBQUM7Q0FDSDtDQUNBLE9BQU87RUFDTCxTQUFTO0VBQ1QsY0FBYyxTQUFTO0VBQ3ZCO0VBQ0EsZ0JBQWdCO0dBQ2QsYUFBYTtHQUNiLE9BQU87RUFDVDtFQUNBO0VBQ0E7RUFDQTtFQUNBLGFBQWE7R0FDWCxJQUFJLFNBQVMsR0FDWCxJQUFJO1FBRUosTUFBTSxDQUFDLENBQUMsS0FBSyxHQUFHO0dBRWxCLE9BQU87RUFDVDtDQUNGO0FBQ0Y7OztBQzFIQSxJQUFJLFlBQVksTUFBTTtDQUNwQjtDQUNBLFVBQVU7RUFDUixLQUFLLGVBQWU7Q0FDdEI7Q0FDQSxhQUFhO0VBQ1gsS0FBSyxlQUFlO0VBQ3BCLElBQUksZUFBZSxLQUFLLE1BQU0sR0FDNUIsS0FBS0MsYUFBYSxlQUFlLGlCQUFpQjtHQUNoRCxLQUFLLGVBQWU7RUFDdEIsR0FBRyxLQUFLLE1BQU07Q0FFbEI7Q0FDQSxhQUFhLFdBQVc7RUFDdEIsS0FBSyxTQUFTLEtBQUssSUFDakIsS0FBSyxVQUFVLEdBQ2YsY0FBYyxtQkFBbUIsU0FBUyxJQUFJLFdBQVcsSUFDM0Q7Q0FDRjtDQUNBLGlCQUFpQjtFQUNmLElBQUksS0FBS0EsZUFBZSxLQUFLLEdBQUc7R0FDOUIsZUFBZSxhQUFhLEtBQUtBLFVBQVU7R0FDM0MsS0FBS0EsYUFBYSxLQUFLO0VBQ3pCO0NBQ0Y7QUFDRjs7O0FDdEJBLFNBQVMsc0JBQXNCLE9BQU87Q0FDcEMsT0FBTyxFQUNMLFVBQVUsU0FBUyxVQUFVO0VBQzNCLE1BQU0sVUFBVSxRQUFRO0VBQ3hCLE1BQU0sWUFBWSxRQUFRLGNBQWMsTUFBTSxXQUFXO0VBQ3pELE1BQU0sV0FBVyxRQUFRLE1BQU0sTUFBTSxTQUFTLENBQUM7RUFDL0MsTUFBTSxnQkFBZ0IsUUFBUSxNQUFNLE1BQU0sY0FBYyxDQUFDO0VBQ3pELElBQUksU0FBUztHQUFFLE9BQU8sQ0FBQztHQUFHLFlBQVksQ0FBQztFQUFFO0VBQ3pDLElBQUksY0FBYztFQUNsQixNQUFNLFVBQVUsWUFBWTtHQUMxQixJQUFJLFlBQVk7R0FDaEIsTUFBTSxxQkFBcUIsV0FBVztJQUNwQyxzQkFDRSxjQUNNLFFBQVEsY0FDUixZQUFZLElBQ3BCO0dBQ0Y7R0FDQSxNQUFNLFVBQVUsY0FBYyxRQUFRLFNBQVMsUUFBUSxZQUFZO0dBQ25FLE1BQU0sWUFBWSxPQUFPLE1BQU0sT0FBTyxhQUFhO0lBQ2pELElBQUksV0FDRixPQUFPLFFBQVEsT0FBTyxRQUFRLE9BQU8sTUFBTTtJQUU3QyxJQUFJLFNBQVMsUUFBUSxLQUFLLE1BQU0sUUFDOUIsT0FBTyxRQUFRLFFBQVEsSUFBSTtJQUU3QixNQUFNLDZCQUE2QjtLQUNqQyxNQUFNLGtCQUFrQjtNQUN0QixRQUFRLFFBQVE7TUFDaEIsVUFBVSxRQUFRO01BQ2xCLFdBQVc7TUFDWCxXQUFXLFdBQVcsYUFBYTtNQUNuQyxNQUFNLFFBQVEsUUFBUTtLQUN4QjtLQUNBLGtCQUFrQixlQUFlO0tBQ2pDLE9BQU87SUFDVDtJQUNBLE1BQU0saUJBQWlCLHFCQUFxQjtJQUM1QyxNQUFNLE9BQU8sTUFBTSxRQUFRLGNBQWM7SUFDekMsTUFBTSxFQUFFLGFBQWEsUUFBUTtJQUM3QixNQUFNLFFBQVEsV0FBVyxhQUFhO0lBQ3RDLE9BQU87S0FDTCxPQUFPLE1BQU0sS0FBSyxPQUFPLE1BQU0sUUFBUTtLQUN2QyxZQUFZLE1BQU0sS0FBSyxZQUFZLE9BQU8sUUFBUTtJQUNwRDtHQUNGO0dBQ0EsSUFBSSxhQUFhLFNBQVMsUUFBUTtJQUNoQyxNQUFNLFdBQVcsY0FBYztJQUMvQixNQUFNLGNBQWMsV0FBVyx1QkFBdUI7SUFDdEQsTUFBTSxVQUFVO0tBQ2QsT0FBTztLQUNQLFlBQVk7SUFDZDtJQUVBLFNBQVMsTUFBTSxVQUFVLFNBRFgsWUFBWSxTQUFTLE9BQ0csR0FBRyxRQUFRO0dBQ25ELE9BQU87SUFDTCxNQUFNLGlCQUFpQixTQUFTLFNBQVM7SUFDekMsR0FBRztLQUNELE1BQU0sUUFBUSxnQkFBZ0IsSUFBSSxjQUFjLE1BQU0sUUFBUSxtQkFBbUIsaUJBQWlCLFNBQVMsTUFBTTtLQUNqSCxJQUFJLGNBQWMsS0FBSyxTQUFTLE1BQzlCO0tBRUYsU0FBUyxNQUFNLFVBQVUsUUFBUSxLQUFLO0tBQ3RDO0lBQ0YsU0FBUyxjQUFjO0dBQ3pCO0dBQ0EsT0FBTztFQUNUO0VBQ0EsSUFBSSxRQUFRLFFBQVEsV0FDbEIsUUFBUSxnQkFBZ0I7R0FDdEIsT0FBTyxRQUFRLFFBQVEsWUFDckIsU0FDQTtJQUNFLFFBQVEsUUFBUTtJQUNoQixVQUFVLFFBQVE7SUFDbEIsTUFBTSxRQUFRLFFBQVE7SUFDdEIsUUFBUSxRQUFRO0dBQ2xCLEdBQ0EsS0FDRjtFQUNGO09BRUEsUUFBUSxVQUFVO0NBRXRCLEVBQ0Y7QUFDRjtBQUNBLFNBQVMsaUJBQWlCLFNBQVMsRUFBRSxPQUFPLGNBQWM7Q0FDeEQsTUFBTSxZQUFZLE1BQU0sU0FBUztDQUNqQyxPQUFPLE1BQU0sU0FBUyxJQUFJLFFBQVEsaUJBQ2hDLE1BQU0sWUFDTixPQUNBLFdBQVcsWUFDWCxVQUNGLElBQUksS0FBSztBQUNYO0FBQ0EsU0FBUyxxQkFBcUIsU0FBUyxFQUFFLE9BQU8sY0FBYztDQUM1RCxPQUFPLE1BQU0sU0FBUyxJQUFJLFFBQVEsdUJBQXVCLE1BQU0sSUFBSSxPQUFPLFdBQVcsSUFBSSxVQUFVLElBQUksS0FBSztBQUM5RztBQUNBLFNBQVMsWUFBWSxTQUFTLE1BQU07Q0FDbEMsSUFBSSxDQUFDLE1BQU0sT0FBTztDQUNsQixPQUFPLGlCQUFpQixTQUFTLElBQUksS0FBSztBQUM1QztBQUNBLFNBQVMsZ0JBQWdCLFNBQVMsTUFBTTtDQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsc0JBQXNCLE9BQU87Q0FDbkQsT0FBTyxxQkFBcUIsU0FBUyxJQUFJLEtBQUs7QUFDaEQ7OztBQ25HQSxJQUFJLFFBQVEsY0FBYyxVQUFVO0NBQ2xDO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQSxZQUFZLFFBQVE7RUFDbEIsTUFBTTtFQUNOLEtBQUtDLHVCQUF1QjtFQUM1QixLQUFLQyxrQkFBa0IsT0FBTztFQUM5QixLQUFLLFdBQVcsT0FBTyxPQUFPO0VBQzlCLEtBQUssWUFBWSxDQUFDO0VBQ2xCLEtBQUtDLFVBQVUsT0FBTztFQUN0QixLQUFLQyxTQUFTLEtBQUtELFFBQVEsY0FBYztFQUN6QyxLQUFLLFdBQVcsT0FBTztFQUN2QixLQUFLLFlBQVksT0FBTztFQUN4QixLQUFLRSxnQkFBZ0JDLGtCQUFnQixLQUFLLE9BQU87RUFDakQsS0FBSyxRQUFRLE9BQU8sU0FBUyxLQUFLRDtFQUNsQyxLQUFLLFdBQVc7Q0FDbEI7Q0FDQSxJQUFJLE9BQU87RUFDVCxPQUFPLEtBQUssUUFBUTtDQUN0QjtDQUNBLElBQUksWUFBWTtFQUNkLE9BQU8sS0FBS0U7Q0FDZDtDQUNBLElBQUksVUFBVTtFQUNaLE9BQU8sS0FBS0MsVUFBVTtDQUN4QjtDQUNBLFdBQVcsU0FBUztFQUNsQixLQUFLLFVBQVU7R0FBRSxHQUFHLEtBQUtOO0dBQWlCLEdBQUc7RUFBUTtFQUNyRCxJQUFJLFNBQVMsT0FDWCxLQUFLSyxhQUFhLFFBQVE7RUFFNUIsS0FBSyxhQUFhLEtBQUssUUFBUSxNQUFNO0VBQ3JDLElBQUksS0FBSyxTQUFTLEtBQUssTUFBTSxTQUFTLEtBQUssR0FBRztHQUM1QyxNQUFNLGVBQWVELGtCQUFnQixLQUFLLE9BQU87R0FDakQsSUFBSSxhQUFhLFNBQVMsS0FBSyxHQUFHO0lBQ2hDLEtBQUssU0FDSCxhQUFhLGFBQWEsTUFBTSxhQUFhLGFBQWEsQ0FDNUQ7SUFDQSxLQUFLRCxnQkFBZ0I7R0FDdkI7RUFDRjtDQUNGO0NBQ0EsaUJBQWlCO0VBQ2YsSUFBSSxDQUFDLEtBQUssVUFBVSxVQUFVLEtBQUssTUFBTSxnQkFBZ0IsUUFDdkQsS0FBS0QsT0FBTyxPQUFPLElBQUk7Q0FFM0I7Q0FDQSxRQUFRLFNBQVMsU0FBUztFQUN4QixNQUFNLE9BQU8sWUFBWSxLQUFLLE1BQU0sTUFBTSxTQUFTLEtBQUssT0FBTztFQUMvRCxLQUFLSyxVQUFVO0dBQ2I7R0FDQSxNQUFNO0dBQ04sZUFBZSxTQUFTO0dBQ3hCLFFBQVEsU0FBUztFQUNuQixDQUFDO0VBQ0QsT0FBTztDQUNUO0NBQ0EsU0FBUyxPQUFPO0VBQ2QsS0FBS0EsVUFBVTtHQUFFLE1BQU07R0FBWTtFQUFNLENBQUM7Q0FDNUM7Q0FDQSxPQUFPLFNBQVM7RUFDZCxNQUFNLFVBQVUsS0FBS0QsVUFBVTtFQUMvQixLQUFLQSxVQUFVLE9BQU8sT0FBTztFQUM3QixPQUFPLFVBQVUsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLFFBQVEsUUFBUTtDQUNwRTtDQUNBLFVBQVU7RUFDUixNQUFNLFFBQVE7RUFDZCxLQUFLLE9BQU8sRUFBRSxRQUFRLEtBQUssQ0FBQztDQUM5QjtDQUNBLElBQUksYUFBYTtFQUNmLE9BQU8sS0FBS0g7Q0FDZDtDQUNBLFFBQVE7RUFDTixLQUFLLFFBQVE7RUFDYixLQUFLLFNBQVMsS0FBSyxVQUFVO0NBQy9CO0NBQ0EsV0FBVztFQUNULE9BQU8sS0FBSyxVQUFVLE1BQ25CLGFBQWEsb0JBQW9CLFNBQVMsUUFBUSxTQUFTLElBQUksTUFBTSxLQUN4RTtDQUNGO0NBQ0EsYUFBYTtFQUNYLElBQUksS0FBSyxrQkFBa0IsSUFBSSxHQUM3QixPQUFPLENBQUMsS0FBSyxTQUFTO0VBRXhCLE9BQU8sS0FBSyxRQUFRLFlBQVksYUFBYSxDQUFDLEtBQUssVUFBVTtDQUMvRDtDQUNBLFlBQVk7RUFDVixPQUFPLEtBQUssTUFBTSxrQkFBa0IsS0FBSyxNQUFNLG1CQUFtQjtDQUNwRTtDQUNBLFdBQVc7RUFDVCxJQUFJLEtBQUssa0JBQWtCLElBQUksR0FDN0IsT0FBTyxLQUFLLFVBQVUsTUFDbkIsYUFBYSxpQkFBaUIsU0FBUyxRQUFRLFdBQVcsSUFBSSxNQUFNLFFBQ3ZFO0VBRUYsT0FBTztDQUNUO0NBQ0EsVUFBVTtFQUNSLElBQUksS0FBSyxrQkFBa0IsSUFBSSxHQUM3QixPQUFPLEtBQUssVUFBVSxNQUNuQixhQUFhLFNBQVMsaUJBQWlCLENBQUMsQ0FBQyxPQUM1QztFQUVGLE9BQU8sS0FBSyxNQUFNLFNBQVMsS0FBSyxLQUFLLEtBQUssTUFBTTtDQUNsRDtDQUNBLGNBQWMsWUFBWSxHQUFHO0VBQzNCLElBQUksS0FBSyxNQUFNLFNBQVMsS0FBSyxHQUMzQixPQUFPO0VBRVQsSUFBSSxjQUFjLFVBQ2hCLE9BQU87RUFFVCxJQUFJLEtBQUssTUFBTSxlQUNiLE9BQU87RUFFVCxPQUFPLENBQUMsZUFBZSxLQUFLLE1BQU0sZUFBZSxTQUFTO0NBQzVEO0NBQ0EsVUFBVTtFQUVSLEtBRHNCLFVBQVUsTUFBTSxNQUFNLEVBQUUseUJBQXlCLENBQ2hFLENBQUMsRUFBRSxRQUFRLEVBQUUsZUFBZSxNQUFNLENBQUM7RUFDMUMsS0FBS0csVUFBVSxTQUFTO0NBQzFCO0NBQ0EsV0FBVztFQUVULEtBRHNCLFVBQVUsTUFBTSxNQUFNLEVBQUUsdUJBQXVCLENBQzlELENBQUMsRUFBRSxRQUFRLEVBQUUsZUFBZSxNQUFNLENBQUM7RUFDMUMsS0FBS0EsVUFBVSxTQUFTO0NBQzFCO0NBQ0EsWUFBWSxVQUFVO0VBQ3BCLElBQUksQ0FBQyxLQUFLLFVBQVUsU0FBUyxRQUFRLEdBQUc7R0FDdEMsS0FBSyxVQUFVLEtBQUssUUFBUTtHQUM1QixLQUFLLGVBQWU7R0FDcEIsS0FBS0osT0FBTyxPQUFPO0lBQUUsTUFBTTtJQUFpQixPQUFPO0lBQU07R0FBUyxDQUFDO0VBQ3JFO0NBQ0Y7Q0FDQSxlQUFlLFVBQVU7RUFDdkIsSUFBSSxLQUFLLFVBQVUsU0FBUyxRQUFRLEdBQUc7R0FDckMsS0FBSyxZQUFZLEtBQUssVUFBVSxRQUFRLE1BQU0sTUFBTSxRQUFRO0dBQzVELElBQUksQ0FBQyxLQUFLLFVBQVUsUUFBUTtJQUMxQixJQUFJLEtBQUtJLFVBQ1AsSUFBSSxLQUFLUCx3QkFBd0IsS0FBS1Msc0JBQXNCLEdBQzFELEtBQUtGLFNBQVMsT0FBTyxFQUFFLFFBQVEsS0FBSyxDQUFDO1NBRXJDLEtBQUtBLFNBQVMsWUFBWTtJQUc5QixLQUFLLFdBQVc7R0FDbEI7R0FDQSxLQUFLSixPQUFPLE9BQU87SUFBRSxNQUFNO0lBQW1CLE9BQU87SUFBTTtHQUFTLENBQUM7RUFDdkU7Q0FDRjtDQUNBLG9CQUFvQjtFQUNsQixPQUFPLEtBQUssVUFBVTtDQUN4QjtDQUNBLHdCQUF3QjtFQUN0QixPQUFPLEtBQUssTUFBTSxnQkFBZ0IsWUFBWSxLQUFLLE1BQU0sV0FBVztDQUN0RTtDQUNBLGFBQWE7RUFDWCxJQUFJLENBQUMsS0FBSyxNQUFNLGVBQ2QsS0FBS0ssVUFBVSxFQUFFLE1BQU0sYUFBYSxDQUFDO0NBRXpDO0NBQ0EsTUFBTSxNQUFNLFNBQVMsY0FBYztFQUNqQyxJQUFJLEtBQUssTUFBTSxnQkFBZ0IsVUFHL0IsS0FBS0QsVUFBVSxPQUFPLE1BQU0sWUFDdEI7T0FBQSxLQUFLLE1BQU0sU0FBUyxLQUFLLEtBQUssY0FBYyxlQUM5QyxLQUFLLE9BQU8sRUFBRSxRQUFRLEtBQUssQ0FBQztRQUN2QixJQUFJLEtBQUtBLFVBQVU7SUFDeEIsS0FBS0EsU0FBUyxjQUFjO0lBQzVCLE9BQU8sS0FBS0EsU0FBUztHQUN2Qjs7RUFFRixJQUFJLFNBQ0YsS0FBSyxXQUFXLE9BQU87RUFFekIsSUFBSSxDQUFDLEtBQUssUUFBUSxTQUFTO0dBQ3pCLE1BQU0sV0FBVyxLQUFLLFVBQVUsTUFBTSxNQUFNLEVBQUUsUUFBUSxPQUFPO0dBQzdELElBQUksVUFDRixLQUFLLFdBQVcsU0FBUyxPQUFPO0VBRXBDO0VBRUUsSUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLFFBQVEsUUFBUSxHQUN0QyxRQUFRLE1BQ04scUlBQ0Y7RUFHSixNQUFNLGtCQUFrQixJQUFJLGdCQUFnQjtFQUM1QyxNQUFNLHFCQUFxQixXQUFXO0dBQ3BDLE9BQU8sZUFBZSxRQUFRLFVBQVU7SUFDdEMsWUFBWTtJQUNaLFdBQVc7S0FDVCxLQUFLUCx1QkFBdUI7S0FDNUIsT0FBTyxnQkFBZ0I7SUFDekI7R0FDRixDQUFDO0VBQ0g7RUFDQSxNQUFNLGdCQUFnQjtHQUNwQixNQUFNLFVBQVUsY0FBYyxLQUFLLFNBQVMsWUFBWTtHQUN4RCxNQUFNLDZCQUE2QjtJQUNqQyxNQUFNLGtCQUFrQjtLQUN0QixRQUFRLEtBQUtFO0tBQ2IsVUFBVSxLQUFLO0tBQ2YsTUFBTSxLQUFLO0lBQ2I7SUFDQSxrQkFBa0IsZUFBZTtJQUNqQyxPQUFPO0dBQ1Q7R0FDQSxNQUFNLGlCQUFpQixxQkFBcUI7R0FDNUMsS0FBS0YsdUJBQXVCO0dBQzVCLElBQUksS0FBSyxRQUFRLFdBQ2YsT0FBTyxLQUFLLFFBQVEsVUFDbEIsU0FDQSxnQkFDQSxJQUNGO0dBRUYsT0FBTyxRQUFRLGNBQWM7RUFDL0I7RUFDQSxNQUFNLDJCQUEyQjtHQUMvQixNQUFNLFdBQVc7SUFDZjtJQUNBLFNBQVMsS0FBSztJQUNkLFVBQVUsS0FBSztJQUNmLFFBQVEsS0FBS0U7SUFDYixPQUFPLEtBQUs7SUFDWjtHQUNGO0dBQ0Esa0JBQWtCLFFBQVE7R0FDMUIsT0FBTztFQUNUO0VBQ0EsTUFBTSxVQUFVLG1CQUFtQjtFQUluQyxDQUhpQixLQUFLSSxlQUFlLGFBQWEsc0JBQ2hELEtBQUssUUFBUSxLQUNmLElBQUksS0FBSyxRQUFRLFNBQUEsRUFDUCxRQUFRLFNBQVMsSUFBSTtFQUMvQixLQUFLSSxlQUFlLEtBQUs7RUFDekIsSUFBSSxLQUFLLE1BQU0sZ0JBQWdCLFVBQVUsS0FBSyxNQUFNLGNBQWMsUUFBUSxjQUFjLE1BQ3RGLEtBQUtGLFVBQVU7R0FBRSxNQUFNO0dBQVMsTUFBTSxRQUFRLGNBQWM7RUFBSyxDQUFDO0VBRXBFLEtBQUtELFdBQVcsY0FBYztHQUM1QixnQkFBZ0IsY0FBYztHQUM5QixJQUFJLFFBQVE7R0FDWixXQUFXLFVBQVU7SUFDbkIsSUFBSSxpQkFBaUIsa0JBQWtCLE1BQU0sUUFDM0MsS0FBSyxTQUFTO0tBQ1osR0FBRyxLQUFLRztLQUNSLGFBQWE7SUFDZixDQUFDO0lBRUgsZ0JBQWdCLE1BQU07R0FDeEI7R0FDQSxTQUFTLGNBQWMsVUFBVTtJQUMvQixLQUFLRixVQUFVO0tBQUUsTUFBTTtLQUFVO0tBQWM7SUFBTSxDQUFDO0dBQ3hEO0dBQ0EsZUFBZTtJQUNiLEtBQUtBLFVBQVUsRUFBRSxNQUFNLFFBQVEsQ0FBQztHQUNsQztHQUNBLGtCQUFrQjtJQUNoQixLQUFLQSxVQUFVLEVBQUUsTUFBTSxXQUFXLENBQUM7R0FDckM7R0FDQSxPQUFPLFFBQVEsUUFBUTtHQUN2QixZQUFZLFFBQVEsUUFBUTtHQUM1QixhQUFhLFFBQVEsUUFBUTtHQUM3QixjQUFjO0VBQ2hCLENBQUM7RUFDRCxJQUFJO0dBQ0YsTUFBTSxPQUFPLE1BQU0sS0FBS0QsU0FBUyxNQUFNO0dBQ3ZDLElBQUksU0FBUyxLQUFLLEdBQUc7SUFFakIsUUFBUSxNQUNOLHlJQUF5SSxLQUFLLFdBQ2hKO0lBRUYsTUFBTSxJQUFJLE1BQU0sR0FBRyxLQUFLLFVBQVUsbUJBQW1CO0dBQ3ZEO0dBQ0EsS0FBSyxRQUFRLElBQUk7R0FDakIsS0FBS0osT0FBTyxPQUFPLFlBQVksTUFBTSxJQUFJO0dBQ3pDLEtBQUtBLE9BQU8sT0FBTyxZQUNqQixNQUNBLEtBQUssTUFBTSxPQUNYLElBQ0Y7R0FDQSxPQUFPO0VBQ1QsU0FBUyxPQUFPO0dBQ2QsSUFBSSxpQkFBaUIsZ0JBQ2Y7UUFBQSxNQUFNLFFBQ1IsT0FBTyxLQUFLSSxTQUFTO1NBQ2hCLElBQUksTUFBTSxRQUFRO0tBQ3ZCLElBQUksS0FBSyxNQUFNLFNBQVMsS0FBSyxHQUMzQixNQUFNO0tBRVIsT0FBTyxLQUFLLE1BQU07SUFDcEI7O0dBRUYsS0FBS0MsVUFBVTtJQUNiLE1BQU07SUFDTjtHQUNGLENBQUM7R0FDRCxLQUFLTCxPQUFPLE9BQU8sVUFDakIsT0FDQSxJQUNGO0dBQ0EsS0FBS0EsT0FBTyxPQUFPLFlBQ2pCLEtBQUssTUFBTSxNQUNYLE9BQ0EsSUFDRjtHQUNBLE1BQU07RUFDUixVQUFVO0dBQ1IsS0FBSyxXQUFXO0VBQ2xCO0NBQ0Y7Q0FDQSxVQUFVLFFBQVE7RUFDaEIsTUFBTSxXQUFXLFVBQVU7R0FDekIsUUFBUSxPQUFPLE1BQWY7SUFDRSxLQUFLLFVBQ0gsT0FBTztLQUNMLEdBQUc7S0FDSCxtQkFBbUIsT0FBTztLQUMxQixvQkFBb0IsT0FBTztJQUM3QjtJQUNGLEtBQUssU0FDSCxPQUFPO0tBQ0wsR0FBRztLQUNILGFBQWE7SUFDZjtJQUNGLEtBQUssWUFDSCxPQUFPO0tBQ0wsR0FBRztLQUNILGFBQWE7SUFDZjtJQUNGLEtBQUssU0FDSCxPQUFPO0tBQ0wsR0FBRztLQUNILEdBQUcsV0FBVyxNQUFNLE1BQU0sS0FBSyxPQUFPO0tBQ3RDLFdBQVcsT0FBTyxRQUFRO0lBQzVCO0lBQ0YsS0FBSztLQUNILE1BQU0sV0FBVztNQUNmLEdBQUc7TUFDSCxHQUFHLGFBQWEsT0FBTyxNQUFNLE9BQU8sYUFBYTtNQUNqRCxpQkFBaUIsTUFBTSxrQkFBa0I7TUFDekMsR0FBRyxDQUFDLE9BQU8sVUFBVTtPQUNuQixhQUFhO09BQ2IsbUJBQW1CO09BQ25CLG9CQUFvQjtNQUN0QjtLQUNGO0tBQ0EsS0FBS08sZUFBZSxPQUFPLFNBQVMsV0FBVyxLQUFLO0tBQ3BELE9BQU87SUFDVCxLQUFLO0tBQ0gsTUFBTSxRQUFRLE9BQU87S0FDckIsT0FBTztNQUNMLEdBQUc7TUFDSDtNQUNBLGtCQUFrQixNQUFNLG1CQUFtQjtNQUMzQyxnQkFBZ0IsS0FBSyxJQUFJO01BQ3pCLG1CQUFtQixNQUFNLG9CQUFvQjtNQUM3QyxvQkFBb0I7TUFDcEIsYUFBYTtNQUNiLFFBQVE7TUFHUixlQUFlO0tBQ2pCO0lBQ0YsS0FBSyxjQUNILE9BQU87S0FDTCxHQUFHO0tBQ0gsZUFBZTtJQUNqQjtJQUNGLEtBQUssWUFDSCxPQUFPO0tBQ0wsR0FBRztLQUNILEdBQUcsT0FBTztJQUNaO0dBQ0o7RUFDRjtFQUNBLEtBQUssUUFBUSxRQUFRLEtBQUssS0FBSztFQUMvQixjQUFjLFlBQVk7R0FDeEIsS0FBSyxVQUFVLFNBQVMsYUFBYTtJQUNuQyxTQUFTLGNBQWM7R0FDekIsQ0FBQztHQUNELEtBQUtQLE9BQU8sT0FBTztJQUFFLE9BQU87SUFBTSxNQUFNO0lBQVc7R0FBTyxDQUFDO0VBQzdELENBQUM7Q0FDSDtBQUNGO0FBQ0EsU0FBUyxXQUFXLE1BQU0sU0FBUztDQUNqQyxPQUFPO0VBQ0wsbUJBQW1CO0VBQ25CLG9CQUFvQjtFQUNwQixhQUFhLFNBQVMsUUFBUSxXQUFXLElBQUksYUFBYTtFQUMxRCxHQUFHLFNBQVMsS0FBSyxLQUFLO0dBQ3BCLE9BQU87R0FDUCxRQUFRO0VBQ1Y7Q0FDRjtBQUNGO0FBQ0EsU0FBUyxhQUFhLE1BQU0sZUFBZTtDQUN6QyxPQUFPO0VBQ0w7RUFDQSxlQUFlLGlCQUFpQixLQUFLLElBQUk7RUFDekMsT0FBTztFQUNQLGVBQWU7RUFDZixRQUFRO0NBQ1Y7QUFDRjtBQUNBLFNBQVNFLGtCQUFnQixTQUFTO0NBQ2hDLE1BQU0sT0FBTyxPQUFPLFFBQVEsZ0JBQWdCLGFBQWEsUUFBUSxZQUFZLElBQUksUUFBUTtDQUN6RixNQUFNLFVBQVUsU0FBUyxLQUFLO0NBQzlCLE1BQU0sdUJBQXVCLFVBQVUsT0FBTyxRQUFRLHlCQUF5QixhQUFhLFFBQVEscUJBQXFCLElBQUksUUFBUSx1QkFBdUI7Q0FDNUosT0FBTztFQUNMO0VBQ0EsaUJBQWlCO0VBQ2pCLGVBQWUsVUFBVSx3QkFBd0IsS0FBSyxJQUFJLElBQUk7RUFDOUQsT0FBTztFQUNQLGtCQUFrQjtFQUNsQixnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLG9CQUFvQjtFQUNwQixXQUFXO0VBQ1gsZUFBZTtFQUNmLFFBQVEsVUFBVSxZQUFZO0VBQzlCLGFBQWE7Q0FDZjtBQUNGOzs7QUMvYUEsSUFBSSxnQkFBZ0IsY0FBYyxhQUFhO0NBQzdDLFlBQVksUUFBUSxTQUFTO0VBQzNCLE1BQU07RUFDTixLQUFLLFVBQVU7RUFDZixLQUFLTSxVQUFVO0VBQ2YsS0FBS0MsZUFBZTtFQUNwQixLQUFLQyxtQkFBbUIsZ0JBQWdCO0VBQ3hDLEtBQUssWUFBWTtFQUNqQixLQUFLLFdBQVcsT0FBTztDQUN6QjtDQUNBO0NBQ0EsZ0JBQWdCLEtBQUs7Q0FDckIsNEJBQTRCLEtBQUs7Q0FDakMsaUJBQWlCLEtBQUs7Q0FDdEI7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBR0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQSxnQ0FBZ0MsSUFBSSxJQUFJO0NBQ3hDLGNBQWM7RUFDWixLQUFLLFVBQVUsS0FBSyxRQUFRLEtBQUssSUFBSTtDQUN2QztDQUNBLGNBQWM7RUFDWixJQUFJLEtBQUssVUFBVSxTQUFTLEdBQUc7R0FDN0IsS0FBS0MsY0FBYyxZQUFZLElBQUk7R0FDbkMsSUFBSSxtQkFBbUIsS0FBS0EsZUFBZSxLQUFLLE9BQU8sR0FDckQsS0FBS0MsY0FBYztRQUVuQixLQUFLLGFBQWE7R0FFcEIsS0FBS0MsY0FBYztFQUNyQjtDQUNGO0NBQ0EsZ0JBQWdCO0VBQ2QsSUFBSSxDQUFDLEtBQUssYUFBYSxHQUNyQixLQUFLLFFBQVE7Q0FFakI7Q0FDQSx5QkFBeUI7RUFDdkIsT0FBTyxjQUNMLEtBQUtGLGVBQ0wsS0FBSyxTQUNMLEtBQUssUUFBUSxrQkFDZjtDQUNGO0NBQ0EsMkJBQTJCO0VBQ3pCLE9BQU8sY0FDTCxLQUFLQSxlQUNMLEtBQUssU0FDTCxLQUFLLFFBQVEsb0JBQ2Y7Q0FDRjtDQUNBLFVBQVU7RUFDUixLQUFLLDRCQUE0QixJQUFJLElBQUk7RUFDekMsS0FBS0csbUJBQW1CO0VBQ3hCLEtBQUtDLHNCQUFzQjtFQUMzQixLQUFLSixjQUFjLGVBQWUsSUFBSTtDQUN4QztDQUNBLFdBQVcsU0FBUztFQUNsQixNQUFNLGNBQWMsS0FBSztFQUN6QixNQUFNLFlBQVksS0FBS0E7RUFDdkIsS0FBSyxVQUFVLEtBQUtILFFBQVEsb0JBQW9CLE9BQU87RUFDdkQsSUFBSSxLQUFLLFFBQVEsWUFBWSxLQUFLLEtBQUssT0FBTyxLQUFLLFFBQVEsWUFBWSxhQUFhLE9BQU8sS0FBSyxRQUFRLFlBQVksY0FBYyxPQUFPLG9CQUFvQixLQUFLLFFBQVEsU0FBUyxLQUFLRyxhQUFhLE1BQU0sV0FDek0sTUFBTSxJQUFJLE1BQ1IsdUVBQ0Y7RUFFRixLQUFLSyxhQUFhO0VBQ2xCLEtBQUtMLGNBQWMsV0FBVyxLQUFLLE9BQU87RUFDMUMsSUFBSSxZQUFZLGNBQWMsQ0FBQyxvQkFBb0IsS0FBSyxTQUFTLFdBQVcsR0FDMUUsS0FBS0gsUUFBUSxjQUFjLENBQUMsQ0FBQyxPQUFPO0dBQ2xDLE1BQU07R0FDTixPQUFPLEtBQUtHO0dBQ1osVUFBVTtFQUNaLENBQUM7RUFFSCxNQUFNLFVBQVUsS0FBSyxhQUFhO0VBQ2xDLElBQUksV0FBVyxzQkFDYixLQUFLQSxlQUNMLFdBQ0EsS0FBSyxTQUNMLFdBQ0YsR0FDRSxLQUFLQyxjQUFjO0VBRXJCLEtBQUssYUFBYTtFQUNsQixJQUFJLFlBQVksS0FBS0Qsa0JBQWtCLGFBQWEsb0JBQW9CLEtBQUssUUFBUSxTQUFTLEtBQUtBLGFBQWEsTUFBTSxvQkFBb0IsWUFBWSxTQUFTLEtBQUtBLGFBQWEsS0FBSyxpQkFBaUIsS0FBSyxRQUFRLFdBQVcsS0FBS0EsYUFBYSxNQUFNLGlCQUFpQixZQUFZLFdBQVcsS0FBS0EsYUFBYSxJQUMvUyxLQUFLTSxvQkFBb0I7RUFFM0IsTUFBTSxzQkFBc0IsS0FBS0Msd0JBQXdCO0VBQ3pELElBQUksWUFBWSxLQUFLUCxrQkFBa0IsYUFBYSxvQkFBb0IsS0FBSyxRQUFRLFNBQVMsS0FBS0EsYUFBYSxNQUFNLG9CQUFvQixZQUFZLFNBQVMsS0FBS0EsYUFBYSxLQUFLLHdCQUF3QixLQUFLUSwwQkFDak4sS0FBS0MsdUJBQXVCLG1CQUFtQjtDQUVuRDtDQUNBLG9CQUFvQixTQUFTO0VBQzNCLE1BQU0sUUFBUSxLQUFLWixRQUFRLGNBQWMsQ0FBQyxDQUFDLE1BQU0sS0FBS0EsU0FBUyxPQUFPO0VBQ3RFLE1BQU0sU0FBUyxLQUFLLGFBQWEsT0FBTyxPQUFPO0VBQy9DLElBQUksc0NBQXNDLE1BQU0sTUFBTSxHQUFHO0dBQ3ZELEtBQUthLGlCQUFpQjtHQUN0QixLQUFLQyx3QkFBd0IsS0FBSztHQUNsQyxLQUFLQyxzQkFBc0IsS0FBS1osY0FBYztFQUNoRDtFQUNBLE9BQU87Q0FDVDtDQUNBLG1CQUFtQjtFQUNqQixPQUFPLEtBQUtVO0NBQ2Q7Q0FDQSxZQUFZLFFBQVEsZUFBZTtFQUNqQyxPQUFPLElBQUksTUFBTSxRQUFRLEVBQ3ZCLE1BQU0sUUFBUSxRQUFRO0dBQ3BCLEtBQUssVUFBVSxHQUFHO0dBQ2xCLGdCQUFnQixHQUFHO0dBQ25CLElBQUksUUFBUSxXQUFXO0lBQ3JCLEtBQUssVUFBVSxNQUFNO0lBQ3JCLElBQUksQ0FBQyxLQUFLLFFBQVEsaUNBQWlDLEtBQUtYLGlCQUFpQixXQUFXLFdBQ2xGLEtBQUtBLGlCQUFpQix1QkFDcEIsSUFBSSxNQUNGLDJEQUNGLENBQ0Y7R0FFSjtHQUNBLE9BQU8sUUFBUSxJQUFJLFFBQVEsR0FBRztFQUNoQyxFQUNGLENBQUM7Q0FDSDtDQUNBLFVBQVUsS0FBSztFQUNiLEtBQUtjLGNBQWMsSUFBSSxHQUFHO0NBQzVCO0NBQ0Esa0JBQWtCO0VBQ2hCLE9BQU8sS0FBS2I7Q0FDZDtDQUNBLFFBQVEsRUFBRSxHQUFHLFlBQVksQ0FBQyxHQUFHO0VBQzNCLE9BQU8sS0FBSyxNQUFNLEVBQ2hCLEdBQUcsUUFDTCxDQUFDO0NBQ0g7Q0FDQSxnQkFBZ0IsU0FBUztFQUN2QixNQUFNLG1CQUFtQixLQUFLSCxRQUFRLG9CQUFvQixPQUFPO0VBQ2pFLE1BQU0sUUFBUSxLQUFLQSxRQUFRLGNBQWMsQ0FBQyxDQUFDLE1BQU0sS0FBS0EsU0FBUyxnQkFBZ0I7RUFDL0UsT0FBTyxNQUFNLE1BQU0sQ0FBQyxDQUFDLFdBQVcsS0FBSyxhQUFhLE9BQU8sZ0JBQWdCLENBQUM7Q0FDNUU7Q0FDQSxNQUFNLGNBQWM7RUFDbEIsT0FBTyxLQUFLSSxjQUFjO0dBQ3hCLEdBQUc7R0FDSCxlQUFlLGFBQWEsaUJBQWlCO0VBQy9DLENBQUMsQ0FBQyxDQUFDLFdBQVc7R0FDWixLQUFLLGFBQWE7R0FDbEIsT0FBTyxLQUFLUztFQUNkLENBQUM7Q0FDSDtDQUNBLGNBQWMsY0FBYztFQUMxQixLQUFLTCxhQUFhO0VBQ2xCLElBQUksVUFBVSxLQUFLTCxjQUFjLE1BQy9CLEtBQUssU0FDTCxZQUNGO0VBQ0EsSUFBSSxDQUFDLGNBQWMsY0FDakIsVUFBVSxRQUFRLE1BQU0sSUFBSTtFQUU5QixPQUFPO0NBQ1Q7Q0FDQSxzQkFBc0I7RUFDcEIsS0FBS0csbUJBQW1CO0VBQ3hCLE1BQU0sWUFBWSxpQkFDaEIsS0FBSyxRQUFRLFdBQ2IsS0FBS0gsYUFDUDtFQUNBLElBQUksbUJBQW1CLFNBQVMsS0FBSyxLQUFLVSxlQUFlLFdBQVcsQ0FBQyxlQUFlLFNBQVMsR0FDM0Y7RUFHRixNQUFNLFVBRE8sZUFBZSxLQUFLQSxlQUFlLGVBQWUsU0FDNUMsSUFBSTtFQUN2QixLQUFLSSxrQkFBa0IsZUFBZSxpQkFBaUI7R0FDckQsSUFBSSxDQUFDLEtBQUtKLGVBQWUsU0FDdkIsS0FBSyxhQUFhO0VBRXRCLEdBQUcsT0FBTztDQUNaO0NBQ0EsMEJBQTBCO0VBQ3hCLFFBQVEsT0FBTyxLQUFLLFFBQVEsb0JBQW9CLGFBQWEsS0FBSyxRQUFRLGdCQUFnQixLQUFLVixhQUFhLElBQUksS0FBSyxRQUFRLG9CQUFvQjtDQUNuSjtDQUNBLHVCQUF1QixjQUFjO0VBQ25DLEtBQUtJLHNCQUFzQjtFQUMzQixLQUFLSSwwQkFBMEI7RUFDL0IsSUFBSSxtQkFBbUIsU0FBUyxLQUFLLG9CQUFvQixLQUFLLFFBQVEsU0FBUyxLQUFLUixhQUFhLE1BQU0sU0FBUyxDQUFDLGVBQWUsS0FBS1EsdUJBQXVCLEtBQUssS0FBS0EsNEJBQTRCLEdBQ2hNO0VBRUYsS0FBS08scUJBQXFCLGVBQWUsa0JBQWtCO0dBQ3pELElBQUksS0FBSyxRQUFRLCtCQUErQixhQUFhLFVBQVUsR0FDckUsS0FBS2QsY0FBYztFQUV2QixHQUFHLEtBQUtPLHVCQUF1QjtDQUNqQztDQUNBLGdCQUFnQjtFQUNkLEtBQUtGLG9CQUFvQjtFQUN6QixLQUFLRyx1QkFBdUIsS0FBS0Ysd0JBQXdCLENBQUM7Q0FDNUQ7Q0FDQSxxQkFBcUI7RUFDbkIsSUFBSSxLQUFLTyxvQkFBb0IsS0FBSyxHQUFHO0dBQ25DLGVBQWUsYUFBYSxLQUFLQSxlQUFlO0dBQ2hELEtBQUtBLGtCQUFrQixLQUFLO0VBQzlCO0NBQ0Y7Q0FDQSx3QkFBd0I7RUFDdEIsSUFBSSxLQUFLQyx1QkFBdUIsS0FBSyxHQUFHO0dBQ3RDLGVBQWUsY0FBYyxLQUFLQSxrQkFBa0I7R0FDcEQsS0FBS0EscUJBQXFCLEtBQUs7RUFDakM7Q0FDRjtDQUNBLGFBQWEsT0FBTyxTQUFTO0VBQzNCLE1BQU0sWUFBWSxLQUFLZjtFQUN2QixNQUFNLGNBQWMsS0FBSztFQUN6QixNQUFNLGFBQWEsS0FBS1U7RUFDeEIsTUFBTSxrQkFBa0IsS0FBS0U7RUFDN0IsTUFBTSxvQkFBb0IsS0FBS0Q7RUFFL0IsTUFBTSxvQkFEYyxVQUFVLFlBQ1UsTUFBTSxRQUFRLEtBQUtLO0VBQzNELE1BQU0sRUFBRSxVQUFVO0VBQ2xCLElBQUksV0FBVyxFQUFFLEdBQUcsTUFBTTtFQUMxQixJQUFJLG9CQUFvQjtFQUN4QixJQUFJO0VBQ0osSUFBSSxRQUFRLG9CQUFvQjtHQUM5QixNQUFNLFVBQVUsS0FBSyxhQUFhO0dBQ2xDLE1BQU0sZUFBZSxDQUFDLFdBQVcsbUJBQW1CLE9BQU8sT0FBTztHQUNsRSxNQUFNLGtCQUFrQixXQUFXLHNCQUFzQixPQUFPLFdBQVcsU0FBUyxXQUFXO0dBQy9GLElBQUksZ0JBQWdCLGlCQUNsQixXQUFXO0lBQ1QsR0FBRztJQUNILEdBQUcsV0FBVyxNQUFNLE1BQU0sTUFBTSxPQUFPO0dBQ3pDO0dBRUYsSUFBSSxRQUFRLHVCQUF1QixlQUNqQyxTQUFTLGNBQWM7RUFFM0I7RUFDQSxJQUFJLEVBQUUsT0FBTyxnQkFBZ0IsV0FBVztFQUN4QyxPQUFPLFNBQVM7RUFDaEIsSUFBSSxhQUFhO0VBQ2pCLElBQUksUUFBUSxvQkFBb0IsS0FBSyxLQUFLLFNBQVMsS0FBSyxLQUFLLFdBQVcsV0FBVztHQUNqRixJQUFJO0dBQ0osSUFBSSxZQUFZLHFCQUFxQixRQUFRLG9CQUFvQixtQkFBbUIsaUJBQWlCO0lBQ25HLGtCQUFrQixXQUFXO0lBQzdCLGFBQWE7R0FDZixPQUNFLGtCQUFrQixPQUFPLFFBQVEsb0JBQW9CLGFBQWEsUUFBUSxnQkFDeEUsS0FBS0MsMkJBQTJCLE1BQU0sTUFDdEMsS0FBS0EseUJBQ1AsSUFBSSxRQUFRO0dBRWQsSUFBSSxvQkFBb0IsS0FBSyxHQUFHO0lBQzlCLFNBQVM7SUFDVCxPQUFPLFlBQ0wsWUFBWSxNQUNaLGlCQUNBLE9BQ0Y7SUFDQSxvQkFBb0I7R0FDdEI7RUFDRjtFQUNBLElBQUksUUFBUSxVQUFVLFNBQVMsS0FBSyxLQUFLLENBQUMsWUFDeEMsSUFBSSxjQUFjLFNBQVMsaUJBQWlCLFFBQVEsUUFBUSxXQUFXLEtBQUtDLFdBQzFFLE9BQU8sS0FBS0M7T0FFWixJQUFJO0dBQ0YsS0FBS0QsWUFBWSxRQUFRO0dBQ3pCLE9BQU8sUUFBUSxPQUFPLElBQUk7R0FDMUIsT0FBTyxZQUFZLFlBQVksTUFBTSxNQUFNLE9BQU87R0FDbEQsS0FBS0MsZ0JBQWdCO0dBQ3JCLEtBQUtyQixlQUFlO0VBQ3RCLFNBQVMsYUFBYTtHQUNwQixLQUFLQSxlQUFlO0VBQ3RCO0VBR0osSUFBSSxLQUFLQSxjQUFjO0dBQ3JCLFFBQVEsS0FBS0E7R0FDYixPQUFPLEtBQUtxQjtHQUNaLGlCQUFpQixLQUFLLElBQUk7R0FDMUIsU0FBUztFQUNYO0VBQ0EsTUFBTSxhQUFhLFNBQVMsZ0JBQWdCO0VBQzVDLE1BQU0sWUFBWSxXQUFXO0VBQzdCLE1BQU0sVUFBVSxXQUFXO0VBQzNCLE1BQU0sWUFBWSxhQUFhO0VBQy9CLE1BQU0sVUFBVSxTQUFTLEtBQUs7RUE2QjlCLE1BQU0sYUFBYTtHQTNCakI7R0FDQSxhQUFhLFNBQVM7R0FDdEI7R0FDQSxXQUFXLFdBQVc7R0FDdEI7R0FDQSxrQkFBa0I7R0FDbEI7R0FDQTtHQUNBLGVBQWUsU0FBUztHQUN4QjtHQUNBO0dBQ0EsY0FBYyxTQUFTO0dBQ3ZCLGVBQWUsU0FBUztHQUN4QixrQkFBa0IsU0FBUztHQUMzQixXQUFXLE1BQU0sVUFBVTtHQUMzQixxQkFBcUIsU0FBUyxrQkFBa0Isa0JBQWtCLG1CQUFtQixTQUFTLG1CQUFtQixrQkFBa0I7R0FDbkk7R0FDQSxjQUFjLGNBQWMsQ0FBQztHQUM3QixnQkFBZ0IsV0FBVyxDQUFDO0dBQzVCLFVBQVUsU0FBUyxnQkFBZ0I7R0FDbkM7R0FDQSxnQkFBZ0IsV0FBVztHQUMzQixTQUFTLFFBQVEsT0FBTyxPQUFPO0dBQy9CLFNBQVMsS0FBSztHQUNkLFNBQVMsS0FBS3BCO0dBQ2QsV0FBVyxvQkFBb0IsUUFBUSxTQUFTLEtBQUssTUFBTTtFQUVyQztFQUN4QixJQUFJLEtBQUssUUFBUSwrQkFBK0I7R0FDOUMsTUFBTSxnQkFBZ0IsV0FBVyxTQUFTLEtBQUs7R0FDL0MsTUFBTSxxQkFBcUIsV0FBVyxXQUFXLFdBQVcsQ0FBQztHQUM3RCxNQUFNLDhCQUE4QixhQUFhO0lBQy9DLElBQUksb0JBQ0YsU0FBUyxPQUFPLFdBQVcsS0FBSztTQUMzQixJQUFJLGVBQ1QsU0FBUyxRQUFRLFdBQVcsSUFBSTtHQUVwQztHQUNBLE1BQU0seUJBQXlCO0lBQzdCLE1BQU0sVUFBVSxLQUFLQSxtQkFBbUIsV0FBVyxVQUFVLGdCQUFnQjtJQUM3RSwyQkFBMkIsT0FBTztHQUNwQztHQUNBLE1BQU0sZUFBZSxLQUFLQTtHQUMxQixRQUFRLGFBQWEsUUFBckI7SUFDRSxLQUFLO0tBQ0gsSUFBSSxNQUFNLGNBQWMsVUFBVSxXQUNoQywyQkFBMkIsWUFBWTtLQUV6QztJQUNGLEtBQUs7S0FDSCxJQUFJLHNCQUFzQixXQUFXLFNBQVMsYUFBYSxPQUN6RCxpQkFBaUI7S0FFbkI7SUFDRixLQUFLLFlBQ0gsSUFBSSxDQUFDLHNCQUFzQixXQUFXLFVBQVUsYUFBYSxRQUMzRCxpQkFBaUI7R0FHdkI7RUFDRjtFQUNBLE9BQU87Q0FDVDtDQUNBLGVBQWU7RUFDYixNQUFNLGFBQWEsS0FBS1c7RUFDeEIsTUFBTSxhQUFhLEtBQUssYUFBYSxLQUFLVixlQUFlLEtBQUssT0FBTztFQUNyRSxLQUFLWSxzQkFBc0IsS0FBS1osY0FBYztFQUM5QyxLQUFLVyx3QkFBd0IsS0FBSztFQUNsQyxJQUFJLEtBQUtDLG9CQUFvQixTQUFTLEtBQUssR0FDekMsS0FBS0ssNEJBQTRCLEtBQUtqQjtFQUV4QyxJQUFJLG9CQUFvQixZQUFZLFVBQVUsR0FDNUM7RUFFRixLQUFLVSxpQkFBaUI7RUFDdEIsTUFBTSw4QkFBOEI7R0FDbEMsSUFBSSxDQUFDLFlBQ0gsT0FBTztHQUVULE1BQU0sRUFBRSx3QkFBd0IsS0FBSztHQUNyQyxNQUFNLDJCQUEyQixPQUFPLHdCQUF3QixhQUFhLG9CQUFvQixJQUFJO0dBQ3JHLElBQUksNkJBQTZCLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLRyxjQUFjLE1BQ3pGLE9BQU87R0FFVCxNQUFNLGdCQUFnQixJQUFJLElBQ3hCLDRCQUE0QixLQUFLQSxhQUNuQztHQUNBLElBQUksS0FBSyxRQUFRLGNBQ2YsY0FBYyxJQUFJLE9BQU87R0FFM0IsT0FBTyxPQUFPLEtBQUssS0FBS0gsY0FBYyxDQUFDLENBQUMsTUFBTSxRQUFRO0lBQ3BELE1BQU0sV0FBVztJQUVqQixPQURnQixLQUFLQSxlQUFlLGNBQWMsV0FBVyxhQUMzQyxjQUFjLElBQUksUUFBUTtHQUM5QyxDQUFDO0VBQ0g7RUFDQSxLQUFLVSxRQUFRLEVBQUUsV0FBVyxzQkFBc0IsRUFBRSxDQUFDO0NBQ3JEO0NBQ0EsZUFBZTtFQUNiLE1BQU0sUUFBUSxLQUFLdkIsUUFBUSxjQUFjLENBQUMsQ0FBQyxNQUFNLEtBQUtBLFNBQVMsS0FBSyxPQUFPO0VBQzNFLElBQUksVUFBVSxLQUFLRyxlQUNqQjtFQUVGLE1BQU0sWUFBWSxLQUFLQTtFQUN2QixLQUFLQSxnQkFBZ0I7RUFDckIsS0FBS2dCLDRCQUE0QixNQUFNO0VBQ3ZDLElBQUksS0FBSyxhQUFhLEdBQUc7R0FDdkIsV0FBVyxlQUFlLElBQUk7R0FDOUIsTUFBTSxZQUFZLElBQUk7RUFDeEI7Q0FDRjtDQUNBLGdCQUFnQjtFQUNkLEtBQUssYUFBYTtFQUNsQixJQUFJLEtBQUssYUFBYSxHQUNwQixLQUFLZCxjQUFjO0NBRXZCO0NBQ0EsUUFBUSxlQUFlO0VBQ3JCLGNBQWMsWUFBWTtHQUN4QixJQUFJLGNBQWMsV0FDaEIsS0FBSyxVQUFVLFNBQVMsYUFBYTtJQUNuQyxTQUFTLEtBQUtRLGNBQWM7R0FDOUIsQ0FBQztHQUVILEtBQUtiLFFBQVEsY0FBYyxDQUFDLENBQUMsT0FBTztJQUNsQyxPQUFPLEtBQUtHO0lBQ1osTUFBTTtHQUNSLENBQUM7RUFDSCxDQUFDO0NBQ0g7QUFDRjtBQUNBLFNBQVMsa0JBQWtCLE9BQU8sU0FBUztDQUN6QyxPQUFPLG9CQUFvQixRQUFRLFNBQVMsS0FBSyxNQUFNLFNBQVMsTUFBTSxNQUFNLFNBQVMsS0FBSyxLQUFLLEVBQUUsTUFBTSxNQUFNLFdBQVcsV0FBVyxvQkFBb0IsUUFBUSxjQUFjLEtBQUssTUFBTTtBQUMxTDtBQUNBLFNBQVMsbUJBQW1CLE9BQU8sU0FBUztDQUMxQyxPQUFPLGtCQUFrQixPQUFPLE9BQU8sS0FBSyxNQUFNLE1BQU0sU0FBUyxLQUFLLEtBQUssY0FBYyxPQUFPLFNBQVMsUUFBUSxjQUFjO0FBQ2pJO0FBQ0EsU0FBUyxjQUFjLE9BQU8sU0FBUyxPQUFPO0NBQzVDLElBQUksb0JBQW9CLFFBQVEsU0FBUyxLQUFLLE1BQU0sU0FBUyxpQkFBaUIsUUFBUSxXQUFXLEtBQUssTUFBTSxVQUFVO0VBQ3BILE1BQU0sUUFBUSxPQUFPLFVBQVUsYUFBYSxNQUFNLEtBQUssSUFBSTtFQUMzRCxPQUFPLFVBQVUsWUFBWSxVQUFVLFNBQVMsUUFBUSxPQUFPLE9BQU87Q0FDeEU7Q0FDQSxPQUFPO0FBQ1Q7QUFDQSxTQUFTLHNCQUFzQixPQUFPLFdBQVcsU0FBUyxhQUFhO0NBQ3JFLFFBQVEsVUFBVSxhQUFhLG9CQUFvQixZQUFZLFNBQVMsS0FBSyxNQUFNLFdBQVcsQ0FBQyxRQUFRLFlBQVksTUFBTSxNQUFNLFdBQVcsWUFBWSxRQUFRLE9BQU8sT0FBTztBQUM5SztBQUNBLFNBQVMsUUFBUSxPQUFPLFNBQVM7Q0FDL0IsT0FBTyxvQkFBb0IsUUFBUSxTQUFTLEtBQUssTUFBTSxTQUFTLE1BQU0sY0FBYyxpQkFBaUIsUUFBUSxXQUFXLEtBQUssQ0FBQztBQUNoSTtBQUNBLFNBQVMsc0NBQXNDLFVBQVUsa0JBQWtCO0NBQ3pFLElBQUksQ0FBQyxvQkFBb0IsU0FBUyxpQkFBaUIsR0FBRyxnQkFBZ0IsR0FDcEUsT0FBTztDQUVULE9BQU87QUFDVDs7O0FDaGRBLElBQUksd0JBQXdCLGNBQWMsY0FBYztDQUN0RCxZQUFZLFFBQVEsU0FBUztFQUMzQixNQUFNLFFBQVEsT0FBTztDQUN2QjtDQUNBLGNBQWM7RUFDWixNQUFNLFlBQVk7RUFDbEIsS0FBSyxnQkFBZ0IsS0FBSyxjQUFjLEtBQUssSUFBSTtFQUNqRCxLQUFLLG9CQUFvQixLQUFLLGtCQUFrQixLQUFLLElBQUk7Q0FDM0Q7Q0FDQSxXQUFXLFNBQVM7RUFDbEIsUUFBUSxRQUFRO0VBQ2hCLE1BQU0sV0FBVyxPQUFPO0NBQzFCO0NBQ0Esb0JBQW9CLFNBQVM7RUFDM0IsUUFBUSxRQUFRO0VBQ2hCLE9BQU8sTUFBTSxvQkFBb0IsT0FBTztDQUMxQztDQUNBLGNBQWMsU0FBUztFQUNyQixPQUFPLEtBQUssTUFBTTtHQUNoQixHQUFHO0dBQ0gsTUFBTSxFQUNKLFdBQVcsRUFBRSxXQUFXLFVBQVUsRUFDcEM7RUFDRixDQUFDO0NBQ0g7Q0FDQSxrQkFBa0IsU0FBUztFQUN6QixPQUFPLEtBQUssTUFBTTtHQUNoQixHQUFHO0dBQ0gsTUFBTSxFQUNKLFdBQVcsRUFBRSxXQUFXLFdBQVcsRUFDckM7RUFDRixDQUFDO0NBQ0g7Q0FDQSxhQUFhLE9BQU8sU0FBUztFQUMzQixNQUFNLEVBQUUsVUFBVTtFQUNsQixNQUFNLGVBQWUsTUFBTSxhQUFhLE9BQU8sT0FBTztFQUN0RCxNQUFNLEVBQUUsWUFBWSxjQUFjLFNBQVMsbUJBQW1CO0VBQzlELE1BQU0saUJBQWlCLE1BQU0sV0FBVyxXQUFXO0VBQ25ELE1BQU0sdUJBQXVCLFdBQVcsbUJBQW1CO0VBQzNELE1BQU0scUJBQXFCLGNBQWMsbUJBQW1CO0VBQzVELE1BQU0sMkJBQTJCLFdBQVcsbUJBQW1CO0VBQy9ELE1BQU0seUJBQXlCLGNBQWMsbUJBQW1CO0VBY2hFLE9BQU87R0FaTCxHQUFHO0dBQ0gsZUFBZSxLQUFLO0dBQ3BCLG1CQUFtQixLQUFLO0dBQ3hCLGFBQWEsWUFBWSxTQUFTLE1BQU0sSUFBSTtHQUM1QyxpQkFBaUIsZ0JBQWdCLFNBQVMsTUFBTSxJQUFJO0dBQ3BEO0dBQ0E7R0FDQTtHQUNBO0dBQ0EsZ0JBQWdCLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDO0dBQzVELGNBQWMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUM7RUFFNUM7Q0FDZDtBQUNGOzs7QUN4REEsSUFBSSxXQUFXLGNBQWMsVUFBVTtDQUNyQztDQUNBO0NBQ0E7Q0FDQTtDQUNBLFlBQVksUUFBUTtFQUNsQixNQUFNO0VBQ04sS0FBS3FCLFVBQVUsT0FBTztFQUN0QixLQUFLLGFBQWEsT0FBTztFQUN6QixLQUFLQyxpQkFBaUIsT0FBTztFQUM3QixLQUFLQyxhQUFhLENBQUM7RUFDbkIsS0FBSyxRQUFRLE9BQU8sU0FBUyxnQkFBZ0I7RUFDN0MsS0FBSyxXQUFXLE9BQU8sT0FBTztFQUM5QixLQUFLLFdBQVc7Q0FDbEI7Q0FDQSxXQUFXLFNBQVM7RUFDbEIsS0FBSyxVQUFVO0VBQ2YsS0FBSyxhQUFhLEtBQUssUUFBUSxNQUFNO0NBQ3ZDO0NBQ0EsSUFBSSxPQUFPO0VBQ1QsT0FBTyxLQUFLLFFBQVE7Q0FDdEI7Q0FDQSxZQUFZLFVBQVU7RUFDcEIsSUFBSSxDQUFDLEtBQUtBLFdBQVcsU0FBUyxRQUFRLEdBQUc7R0FDdkMsS0FBS0EsV0FBVyxLQUFLLFFBQVE7R0FDN0IsS0FBSyxlQUFlO0dBQ3BCLEtBQUtELGVBQWUsT0FBTztJQUN6QixNQUFNO0lBQ04sVUFBVTtJQUNWO0dBQ0YsQ0FBQztFQUNIO0NBQ0Y7Q0FDQSxlQUFlLFVBQVU7RUFDdkIsS0FBS0MsYUFBYSxLQUFLQSxXQUFXLFFBQVEsTUFBTSxNQUFNLFFBQVE7RUFDOUQsS0FBSyxXQUFXO0VBQ2hCLEtBQUtELGVBQWUsT0FBTztHQUN6QixNQUFNO0dBQ04sVUFBVTtHQUNWO0VBQ0YsQ0FBQztDQUNIO0NBQ0EsaUJBQWlCO0VBQ2YsSUFBSSxDQUFDLEtBQUtDLFdBQVcsUUFDbkIsSUFBSSxLQUFLLE1BQU0sV0FBVyxXQUN4QixLQUFLLFdBQVc7T0FFaEIsS0FBS0QsZUFBZSxPQUFPLElBQUk7Q0FHckM7Q0FDQSxXQUFXO0VBQ1QsT0FBTyxLQUFLRSxVQUFVLFNBQVMsS0FDL0IsS0FBSyxRQUFRLEtBQUssTUFBTSxTQUFTO0NBQ25DO0NBQ0EsTUFBTSxRQUFRLFdBQVc7RUFDdkIsTUFBTSxtQkFBbUI7R0FDdkIsS0FBS0MsVUFBVSxFQUFFLE1BQU0sV0FBVyxDQUFDO0VBQ3JDO0VBQ0EsTUFBTSxvQkFBb0I7R0FDeEIsUUFBUSxLQUFLSjtHQUNiLE1BQU0sS0FBSyxRQUFRO0dBQ25CLGFBQWEsS0FBSyxRQUFRO0VBQzVCO0VBQ0EsS0FBS0csV0FBVyxjQUFjO0dBQzVCLFVBQVU7SUFDUixJQUFJLENBQUMsS0FBSyxRQUFRLFlBQ2hCLE9BQU8sUUFBUSx1QkFBTyxJQUFJLE1BQU0scUJBQXFCLENBQUM7SUFFeEQsT0FBTyxLQUFLLFFBQVEsV0FBVyxXQUFXLGlCQUFpQjtHQUM3RDtHQUNBLFNBQVMsY0FBYyxVQUFVO0lBQy9CLEtBQUtDLFVBQVU7S0FBRSxNQUFNO0tBQVU7S0FBYztJQUFNLENBQUM7R0FDeEQ7R0FDQSxlQUFlO0lBQ2IsS0FBS0EsVUFBVSxFQUFFLE1BQU0sUUFBUSxDQUFDO0dBQ2xDO0dBQ0E7R0FDQSxPQUFPLEtBQUssUUFBUSxTQUFTO0dBQzdCLFlBQVksS0FBSyxRQUFRO0dBQ3pCLGFBQWEsS0FBSyxRQUFRO0dBQzFCLGNBQWMsS0FBS0gsZUFBZSxPQUFPLElBQUk7RUFDL0MsQ0FBQztFQUNELE1BQU0sV0FBVyxLQUFLLE1BQU0sV0FBVztFQUN2QyxNQUFNLFdBQVcsQ0FBQyxLQUFLRSxTQUFTLFNBQVM7RUFDekMsSUFBSTtHQUNGLElBQUksVUFDRixXQUFXO1FBQ047SUFDTCxLQUFLQyxVQUFVO0tBQUUsTUFBTTtLQUFXO0tBQVc7SUFBUyxDQUFDO0lBQ3ZELElBQUksS0FBS0gsZUFBZSxPQUFPLFVBQzdCLE1BQU0sS0FBS0EsZUFBZSxPQUFPLFNBQy9CLFdBQ0EsTUFDQSxpQkFDRjtJQUVGLE1BQU0sVUFBVSxNQUFNLEtBQUssUUFBUSxXQUNqQyxXQUNBLGlCQUNGO0lBQ0EsSUFBSSxZQUFZLEtBQUssTUFBTSxTQUN6QixLQUFLRyxVQUFVO0tBQ2IsTUFBTTtLQUNOO0tBQ0E7S0FDQTtJQUNGLENBQUM7R0FFTDtHQUNBLE1BQU0sT0FBTyxNQUFNLEtBQUtELFNBQVMsTUFBTTtHQUN2QyxNQUFNLEtBQUtGLGVBQWUsT0FBTyxZQUMvQixNQUNBLFdBQ0EsS0FBSyxNQUFNLFNBQ1gsTUFDQSxpQkFDRjtHQUNBLE1BQU0sS0FBSyxRQUFRLFlBQ2pCLE1BQ0EsV0FDQSxLQUFLLE1BQU0sU0FDWCxpQkFDRjtHQUNBLE1BQU0sS0FBS0EsZUFBZSxPQUFPLFlBQy9CLE1BQ0EsTUFDQSxLQUFLLE1BQU0sV0FDWCxLQUFLLE1BQU0sU0FDWCxNQUNBLGlCQUNGO0dBQ0EsTUFBTSxLQUFLLFFBQVEsWUFDakIsTUFDQSxNQUNBLFdBQ0EsS0FBSyxNQUFNLFNBQ1gsaUJBQ0Y7R0FDQSxLQUFLRyxVQUFVO0lBQUUsTUFBTTtJQUFXO0dBQUssQ0FBQztHQUN4QyxPQUFPO0VBQ1QsU0FBUyxPQUFPO0dBQ2QsSUFBSTtJQUNGLE1BQU0sS0FBS0gsZUFBZSxPQUFPLFVBQy9CLE9BQ0EsV0FDQSxLQUFLLE1BQU0sU0FDWCxNQUNBLGlCQUNGO0dBQ0YsU0FBUyxHQUFHO0lBQ1YsUUFBYSxPQUFPLENBQUM7R0FDdkI7R0FDQSxJQUFJO0lBQ0YsTUFBTSxLQUFLLFFBQVEsVUFDakIsT0FDQSxXQUNBLEtBQUssTUFBTSxTQUNYLGlCQUNGO0dBQ0YsU0FBUyxHQUFHO0lBQ1YsUUFBYSxPQUFPLENBQUM7R0FDdkI7R0FDQSxJQUFJO0lBQ0YsTUFBTSxLQUFLQSxlQUFlLE9BQU8sWUFDL0IsS0FBSyxHQUNMLE9BQ0EsS0FBSyxNQUFNLFdBQ1gsS0FBSyxNQUFNLFNBQ1gsTUFDQSxpQkFDRjtHQUNGLFNBQVMsR0FBRztJQUNWLFFBQWEsT0FBTyxDQUFDO0dBQ3ZCO0dBQ0EsSUFBSTtJQUNGLE1BQU0sS0FBSyxRQUFRLFlBQ2pCLEtBQUssR0FDTCxPQUNBLFdBQ0EsS0FBSyxNQUFNLFNBQ1gsaUJBQ0Y7R0FDRixTQUFTLEdBQUc7SUFDVixRQUFhLE9BQU8sQ0FBQztHQUN2QjtHQUNBLEtBQUtHLFVBQVU7SUFBRSxNQUFNO0lBQVM7R0FBTSxDQUFDO0dBQ3ZDLE1BQU07RUFDUixVQUFVO0dBQ1IsS0FBS0gsZUFBZSxRQUFRLElBQUk7RUFDbEM7Q0FDRjtDQUNBLFVBQVUsUUFBUTtFQUNoQixNQUFNLFdBQVcsVUFBVTtHQUN6QixRQUFRLE9BQU8sTUFBZjtJQUNFLEtBQUssVUFDSCxPQUFPO0tBQ0wsR0FBRztLQUNILGNBQWMsT0FBTztLQUNyQixlQUFlLE9BQU87SUFDeEI7SUFDRixLQUFLLFNBQ0gsT0FBTztLQUNMLEdBQUc7S0FDSCxVQUFVO0lBQ1o7SUFDRixLQUFLLFlBQ0gsT0FBTztLQUNMLEdBQUc7S0FDSCxVQUFVO0lBQ1o7SUFDRixLQUFLLFdBQ0gsT0FBTztLQUNMLEdBQUc7S0FDSCxTQUFTLE9BQU87S0FDaEIsTUFBTSxLQUFLO0tBQ1gsY0FBYztLQUNkLGVBQWU7S0FDZixPQUFPO0tBQ1AsVUFBVSxPQUFPO0tBQ2pCLFFBQVE7S0FDUixXQUFXLE9BQU87S0FDbEIsYUFBYSxLQUFLLElBQUk7SUFDeEI7SUFDRixLQUFLLFdBQ0gsT0FBTztLQUNMLEdBQUc7S0FDSCxNQUFNLE9BQU87S0FDYixjQUFjO0tBQ2QsZUFBZTtLQUNmLE9BQU87S0FDUCxRQUFRO0tBQ1IsVUFBVTtJQUNaO0lBQ0YsS0FBSyxTQUNILE9BQU87S0FDTCxHQUFHO0tBQ0gsTUFBTSxLQUFLO0tBQ1gsT0FBTyxPQUFPO0tBQ2QsY0FBYyxNQUFNLGVBQWU7S0FDbkMsZUFBZSxPQUFPO0tBQ3RCLFVBQVU7S0FDVixRQUFRO0lBQ1Y7R0FDSjtFQUNGO0VBQ0EsS0FBSyxRQUFRLFFBQVEsS0FBSyxLQUFLO0VBQy9CLGNBQWMsWUFBWTtHQUN4QixLQUFLQyxXQUFXLFNBQVMsYUFBYTtJQUNwQyxTQUFTLGlCQUFpQixNQUFNO0dBQ2xDLENBQUM7R0FDRCxLQUFLRCxlQUFlLE9BQU87SUFDekIsVUFBVTtJQUNWLE1BQU07SUFDTjtHQUNGLENBQUM7RUFDSCxDQUFDO0NBQ0g7QUFDRjtBQUNBLFNBQVMsa0JBQWtCO0NBQ3pCLE9BQU87RUFDTCxTQUFTLEtBQUs7RUFDZCxNQUFNLEtBQUs7RUFDWCxPQUFPO0VBQ1AsY0FBYztFQUNkLGVBQWU7RUFDZixVQUFVO0VBQ1YsUUFBUTtFQUNSLFdBQVcsS0FBSztFQUNoQixhQUFhO0NBQ2Y7QUFDRjs7O0FDOVFBLElBQUksZ0JBQWdCLGNBQWMsYUFBYTtDQUM3QyxZQUFZLFNBQVMsQ0FBQyxHQUFHO0VBQ3ZCLE1BQU07RUFDTixLQUFLLFNBQVM7RUFDZCxLQUFLSSw2QkFBNkIsSUFBSSxJQUFJO0VBQzFDLEtBQUtDLDBCQUEwQixJQUFJLElBQUk7RUFDdkMsS0FBS0MsY0FBYztDQUNyQjtDQUNBO0NBQ0E7Q0FDQTtDQUNBLE1BQU0sUUFBUSxTQUFTLE9BQU87RUFDNUIsTUFBTSxXQUFXLElBQUksU0FBUztHQUM1QjtHQUNBLGVBQWU7R0FDZixZQUFZLEVBQUUsS0FBS0E7R0FDbkIsU0FBUyxPQUFPLHVCQUF1QixPQUFPO0dBQzlDO0VBQ0YsQ0FBQztFQUNELEtBQUssSUFBSSxRQUFRO0VBQ2pCLE9BQU87Q0FDVDtDQUNBLElBQUksVUFBVTtFQUNaLEtBQUtGLFdBQVcsSUFBSSxRQUFRO0VBQzVCLE1BQU0sUUFBUSxTQUFTLFFBQVE7RUFDL0IsSUFBSSxPQUFPLFVBQVUsVUFBVTtHQUM3QixNQUFNLGtCQUFrQixLQUFLQyxRQUFRLElBQUksS0FBSztHQUM5QyxJQUFJLGlCQUNGLGdCQUFnQixLQUFLLFFBQVE7UUFFN0IsS0FBS0EsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7RUFFdEM7RUFDQSxLQUFLLE9BQU87R0FBRSxNQUFNO0dBQVM7RUFBUyxDQUFDO0NBQ3pDO0NBQ0EsT0FBTyxVQUFVO0VBQ2YsSUFBSSxLQUFLRCxXQUFXLE9BQU8sUUFBUSxHQUFHO0dBQ3BDLE1BQU0sUUFBUSxTQUFTLFFBQVE7R0FDL0IsSUFBSSxPQUFPLFVBQVUsVUFBVTtJQUM3QixNQUFNLGtCQUFrQixLQUFLQyxRQUFRLElBQUksS0FBSztJQUM5QyxJQUFJLGlCQUNFO1NBQUEsZ0JBQWdCLFNBQVMsR0FBRztNQUM5QixNQUFNLFFBQVEsZ0JBQWdCLFFBQVEsUUFBUTtNQUM5QyxJQUFJLFVBQVUsSUFDWixnQkFBZ0IsT0FBTyxPQUFPLENBQUM7S0FFbkMsT0FBTyxJQUFJLGdCQUFnQixPQUFPLFVBQ2hDLEtBQUtBLFFBQVEsT0FBTyxLQUFLO0lBQUE7R0FHL0I7RUFDRjtFQUNBLEtBQUssT0FBTztHQUFFLE1BQU07R0FBVztFQUFTLENBQUM7Q0FDM0M7Q0FDQSxPQUFPLFVBQVU7RUFDZixNQUFNLFFBQVEsU0FBUyxRQUFRO0VBQy9CLElBQUksT0FBTyxVQUFVLFVBQVU7R0FFN0IsTUFBTSx1QkFEeUIsS0FBS0EsUUFBUSxJQUFJLEtBQ0UsQ0FBQyxFQUFFLE1BQ2xELE1BQU0sRUFBRSxNQUFNLFdBQVcsU0FDNUI7R0FDQSxPQUFPLENBQUMsd0JBQXdCLHlCQUF5QjtFQUMzRCxPQUNFLE9BQU87Q0FFWDtDQUNBLFFBQVEsVUFBVTtFQUNoQixNQUFNLFFBQVEsU0FBUyxRQUFRO0VBQy9CLElBQUksT0FBTyxVQUFVLFVBRW5CLFFBRHNCLEtBQUtBLFFBQVEsSUFBSSxLQUFLLENBQUMsRUFBRSxNQUFNLE1BQU0sTUFBTSxZQUFZLEVBQUUsTUFBTSxRQUFRLEVBQUEsRUFDdkUsU0FBUyxLQUFLLFFBQVEsUUFBUTtPQUVwRCxPQUFPLFFBQVEsUUFBUTtDQUUzQjtDQUNBLFFBQVE7RUFDTixjQUFjLFlBQVk7R0FDeEIsS0FBS0QsV0FBVyxTQUFTLGFBQWE7SUFDcEMsS0FBSyxPQUFPO0tBQUUsTUFBTTtLQUFXO0lBQVMsQ0FBQztHQUMzQyxDQUFDO0dBQ0QsS0FBS0EsV0FBVyxNQUFNO0dBQ3RCLEtBQUtDLFFBQVEsTUFBTTtFQUNyQixDQUFDO0NBQ0g7Q0FDQSxTQUFTO0VBQ1AsT0FBTyxNQUFNLEtBQUssS0FBS0QsVUFBVTtDQUNuQztDQUNBLEtBQUssU0FBUztFQUNaLE1BQU0sbUJBQW1CO0dBQUUsT0FBTztHQUFNLEdBQUc7RUFBUTtFQUNuRCxPQUFPLEtBQUssT0FBTyxDQUFDLENBQUMsTUFDbEIsYUFBYSxjQUFjLGtCQUFrQixRQUFRLENBQ3hEO0NBQ0Y7Q0FDQSxRQUFRLFVBQVUsQ0FBQyxHQUFHO0VBQ3BCLE9BQU8sS0FBSyxPQUFPLENBQUMsQ0FBQyxRQUFRLGFBQWEsY0FBYyxTQUFTLFFBQVEsQ0FBQztDQUM1RTtDQUNBLE9BQU8sT0FBTztFQUNaLGNBQWMsWUFBWTtHQUN4QixLQUFLLFVBQVUsU0FBUyxhQUFhO0lBQ25DLFNBQVMsS0FBSztHQUNoQixDQUFDO0VBQ0gsQ0FBQztDQUNIO0NBQ0Esd0JBQXdCO0VBQ3RCLE1BQU0sa0JBQWtCLEtBQUssT0FBTyxDQUFDLENBQUMsUUFBUSxNQUFNLEVBQUUsTUFBTSxRQUFRO0VBQ3BFLE9BQU8sY0FBYyxZQUNiLFFBQVEsSUFDWixnQkFBZ0IsS0FBSyxhQUFhLFNBQVMsU0FBUyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FDbkUsQ0FDRjtDQUNGO0FBQ0Y7QUFDQSxTQUFTLFNBQVMsVUFBVTtDQUMxQixPQUFPLFNBQVMsUUFBUSxPQUFPO0FBQ2pDOzs7QUNsSEEsSUFBSSxtQkFBbUIsY0FBYyxhQUFhO0NBQ2hEO0NBQ0EsaUJBQWlCLEtBQUs7Q0FDdEI7Q0FDQTtDQUNBLFlBQVksUUFBUSxTQUFTO0VBQzNCLE1BQU07RUFDTixLQUFLRyxVQUFVO0VBQ2YsS0FBSyxXQUFXLE9BQU87RUFDdkIsS0FBSyxZQUFZO0VBQ2pCLEtBQUtDLGNBQWM7Q0FDckI7Q0FDQSxjQUFjO0VBQ1osS0FBSyxTQUFTLEtBQUssT0FBTyxLQUFLLElBQUk7RUFDbkMsS0FBSyxRQUFRLEtBQUssTUFBTSxLQUFLLElBQUk7Q0FDbkM7Q0FDQSxXQUFXLFNBQVM7RUFDbEIsTUFBTSxjQUFjLEtBQUs7RUFDekIsS0FBSyxVQUFVLEtBQUtELFFBQVEsdUJBQXVCLE9BQU87RUFDMUQsSUFBSSxDQUFDLG9CQUFvQixLQUFLLFNBQVMsV0FBVyxHQUNoRCxLQUFLQSxRQUFRLGlCQUFpQixDQUFDLENBQUMsT0FBTztHQUNyQyxNQUFNO0dBQ04sVUFBVSxLQUFLRTtHQUNmLFVBQVU7RUFDWixDQUFDO0VBRUgsSUFBSSxhQUFhLGVBQWUsS0FBSyxRQUFRLGVBQWUsUUFBUSxZQUFZLFdBQVcsTUFBTSxRQUFRLEtBQUssUUFBUSxXQUFXLEdBQy9ILEtBQUssTUFBTTtPQUNOLElBQUksS0FBS0Esa0JBQWtCLE1BQU0sV0FBVyxXQUNqRCxLQUFLQSxpQkFBaUIsV0FBVyxLQUFLLE9BQU87Q0FFakQ7Q0FDQSxnQkFBZ0I7RUFDZCxJQUFJLENBQUMsS0FBSyxhQUFhLEdBQ3JCLEtBQUtBLGtCQUFrQixlQUFlLElBQUk7Q0FFOUM7Q0FDQSxpQkFBaUIsUUFBUTtFQUN2QixLQUFLRCxjQUFjO0VBQ25CLEtBQUtFLFFBQVEsTUFBTTtDQUNyQjtDQUNBLG1CQUFtQjtFQUNqQixPQUFPLEtBQUtDO0NBQ2Q7Q0FDQSxRQUFRO0VBQ04sS0FBS0Ysa0JBQWtCLGVBQWUsSUFBSTtFQUMxQyxLQUFLQSxtQkFBbUIsS0FBSztFQUM3QixLQUFLRCxjQUFjO0VBQ25CLEtBQUtFLFFBQVE7Q0FDZjtDQUNBLE9BQU8sV0FBVyxTQUFTO0VBQ3pCLEtBQUtFLGlCQUFpQjtFQUN0QixLQUFLSCxrQkFBa0IsZUFBZSxJQUFJO0VBQzFDLEtBQUtBLG1CQUFtQixLQUFLRixRQUFRLGlCQUFpQixDQUFDLENBQUMsTUFBTSxLQUFLQSxTQUFTLEtBQUssT0FBTztFQUN4RixLQUFLRSxpQkFBaUIsWUFBWSxJQUFJO0VBQ3RDLE9BQU8sS0FBS0EsaUJBQWlCLFFBQVEsU0FBUztDQUNoRDtDQUNBLGdCQUFnQjtFQUNkLE1BQU0sUUFBUSxLQUFLQSxrQkFBa0IsU0FBUyxnQkFBZ0I7RUFDOUQsS0FBS0UsaUJBQWlCO0dBQ3BCLEdBQUc7R0FDSCxXQUFXLE1BQU0sV0FBVztHQUM1QixXQUFXLE1BQU0sV0FBVztHQUM1QixTQUFTLE1BQU0sV0FBVztHQUMxQixRQUFRLE1BQU0sV0FBVztHQUN6QixRQUFRLEtBQUs7R0FDYixPQUFPLEtBQUs7RUFDZDtDQUNGO0NBQ0EsUUFBUSxRQUFRO0VBQ2QsY0FBYyxZQUFZO0dBQ3hCLElBQUksS0FBS0Msa0JBQWtCLEtBQUssYUFBYSxHQUFHO0lBQzlDLE1BQU0sWUFBWSxLQUFLRCxlQUFlO0lBQ3RDLE1BQU0saUJBQWlCLEtBQUtBLGVBQWU7SUFDM0MsTUFBTSxVQUFVO0tBQ2QsUUFBUSxLQUFLSjtLQUNiLE1BQU0sS0FBSyxRQUFRO0tBQ25CLGFBQWEsS0FBSyxRQUFRO0lBQzVCO0lBQ0EsSUFBSSxRQUFRLFNBQVMsV0FBVztLQUM5QixJQUFJO01BQ0YsS0FBS0ssZUFBZSxZQUNsQixPQUFPLE1BQ1AsV0FDQSxnQkFDQSxPQUNGO0tBQ0YsU0FBUyxHQUFHO01BQ1YsUUFBYSxPQUFPLENBQUM7S0FDdkI7S0FDQSxJQUFJO01BQ0YsS0FBS0EsZUFBZSxZQUNsQixPQUFPLE1BQ1AsTUFDQSxXQUNBLGdCQUNBLE9BQ0Y7S0FDRixTQUFTLEdBQUc7TUFDVixRQUFhLE9BQU8sQ0FBQztLQUN2QjtJQUNGLE9BQU8sSUFBSSxRQUFRLFNBQVMsU0FBUztLQUNuQyxJQUFJO01BQ0YsS0FBS0EsZUFBZSxVQUNsQixPQUFPLE9BQ1AsV0FDQSxnQkFDQSxPQUNGO0tBQ0YsU0FBUyxHQUFHO01BQ1YsUUFBYSxPQUFPLENBQUM7S0FDdkI7S0FDQSxJQUFJO01BQ0YsS0FBS0EsZUFBZSxZQUNsQixLQUFLLEdBQ0wsT0FBTyxPQUNQLFdBQ0EsZ0JBQ0EsT0FDRjtLQUNGLFNBQVMsR0FBRztNQUNWLFFBQWEsT0FBTyxDQUFDO0tBQ3ZCO0lBQ0Y7R0FDRjtHQUNBLEtBQUssVUFBVSxTQUFTLGFBQWE7SUFDbkMsU0FBUyxLQUFLRCxjQUFjO0dBQzlCLENBQUM7RUFDSCxDQUFDO0NBQ0g7QUFDRjs7O0FDbElBLFNBQVMsV0FBVyxRQUFRLFFBQVE7Q0FDbEMsTUFBTSxhQUFhLElBQUksSUFBSSxNQUFNO0NBQ2pDLE9BQU8sT0FBTyxRQUFRLE1BQU0sQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDO0FBQ2hEO0FBQ0EsU0FBUyxVQUFVLE9BQU8sT0FBTyxPQUFPO0NBQ3RDLE1BQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQztDQUMxQixLQUFLLFNBQVM7Q0FDZCxPQUFPO0FBQ1Q7QUFDQSxJQUFJLGtCQUFrQixjQUFjLGFBQWE7Q0FDL0M7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0EsbUJBQW1CLENBQUM7Q0FDcEIsWUFBWSxRQUFRLFNBQVMsU0FBUztFQUNwQyxNQUFNO0VBQ04sS0FBS0UsVUFBVTtFQUNmLEtBQUtDLFdBQVc7RUFDaEIsS0FBS0MsV0FBVyxDQUFDO0VBQ2pCLEtBQUtDLGFBQWEsQ0FBQztFQUNuQixLQUFLQyxVQUFVLENBQUM7RUFDaEIsS0FBSyxXQUFXLE9BQU87Q0FDekI7Q0FDQSxjQUFjO0VBQ1osSUFBSSxLQUFLLFVBQVUsU0FBUyxHQUMxQixLQUFLRCxXQUFXLFNBQVMsYUFBYTtHQUNwQyxTQUFTLFdBQVcsV0FBVztJQUM3QixLQUFLRSxVQUFVLFVBQVUsTUFBTTtHQUNqQyxDQUFDO0VBQ0gsQ0FBQztDQUVMO0NBQ0EsZ0JBQWdCO0VBQ2QsSUFBSSxDQUFDLEtBQUssVUFBVSxNQUNsQixLQUFLLFFBQVE7Q0FFakI7Q0FDQSxVQUFVO0VBQ1IsS0FBSyw0QkFBNEIsSUFBSSxJQUFJO0VBQ3pDLEtBQUtGLFdBQVcsU0FBUyxhQUFhO0dBQ3BDLFNBQVMsUUFBUTtFQUNuQixDQUFDO0NBQ0g7Q0FDQSxXQUFXLFNBQVMsU0FBUztFQUMzQixLQUFLRCxXQUFXO0VBQ2hCLEtBQUtELFdBQVc7RUFDMkI7R0FDekMsTUFBTSxjQUFjLFFBQVEsS0FDekIsVUFBVSxLQUFLRCxRQUFRLG9CQUFvQixLQUFLLENBQUMsQ0FBQyxTQUNyRDtHQUNBLElBQUksSUFBSSxJQUFJLFdBQVcsQ0FBQyxDQUFDLFNBQVMsWUFBWSxRQUM1QyxRQUFRLEtBQ04sdUZBQ0Y7RUFFSjtFQUNBLGNBQWMsWUFBWTtHQUN4QixNQUFNLGdCQUFnQixLQUFLRztHQUMzQixNQUFNLHFCQUFxQixLQUFLRyx1QkFBdUIsS0FBS0osUUFBUTtHQUNwRSxtQkFBbUIsU0FDaEIsVUFBVSxNQUFNLFNBQVMsV0FBVyxNQUFNLHFCQUFxQixDQUNsRTtHQUNBLE1BQU0sZUFBZSxtQkFBbUIsS0FBSyxVQUFVLE1BQU0sUUFBUTtHQUNyRSxNQUFNLFlBQVksYUFBYSxLQUM1QixhQUFhLFNBQVMsaUJBQWlCLENBQzFDO0dBQ0EsTUFBTSxrQkFBa0IsY0FBYyxXQUFXLGFBQWE7R0FDOUQsTUFBTSxpQkFBaUIsYUFBYSxNQUNqQyxVQUFVLFVBQVUsYUFBYSxjQUFjLE1BQ2xEO0dBQ0EsTUFBTSxzQkFBc0IsbUJBQW1CO0dBQy9DLE1BQU0sa0JBQWtCLHNCQUFzQixPQUFPLFVBQVUsTUFBTSxRQUFRLFVBQVU7SUFDckYsTUFBTSxPQUFPLEtBQUtFLFFBQVE7SUFDMUIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsUUFBUSxJQUFJO0dBQ25ELENBQUM7R0FDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCO0dBQzlDLElBQUkscUJBQXFCO0lBQ3ZCLEtBQUtHLG1CQUFtQjtJQUN4QixLQUFLSixhQUFhO0dBQ3BCO0dBQ0EsS0FBS0MsVUFBVTtHQUNmLElBQUksQ0FBQyxLQUFLLGFBQWEsR0FBRztHQUMxQixJQUFJLHFCQUFxQjtJQUN2QixXQUFXLGVBQWUsWUFBWSxDQUFDLENBQUMsU0FBUyxhQUFhO0tBQzVELFNBQVMsUUFBUTtJQUNuQixDQUFDO0lBQ0QsV0FBVyxjQUFjLGFBQWEsQ0FBQyxDQUFDLFNBQVMsYUFBYTtLQUM1RCxTQUFTLFdBQVcsV0FBVztNQUM3QixLQUFLQyxVQUFVLFVBQVUsTUFBTTtLQUNqQyxDQUFDO0lBQ0gsQ0FBQztHQUNIO0dBQ0EsS0FBS0csUUFBUTtFQUNmLENBQUM7Q0FDSDtDQUNBLG1CQUFtQjtFQUNqQixPQUFPLEtBQUtKO0NBQ2Q7Q0FDQSxhQUFhO0VBQ1gsT0FBTyxLQUFLRCxXQUFXLEtBQUssYUFBYSxTQUFTLGdCQUFnQixDQUFDO0NBQ3JFO0NBQ0EsZUFBZTtFQUNiLE9BQU8sS0FBS0E7Q0FDZDtDQUNBLG9CQUFvQixTQUFTLFNBQVM7RUFDcEMsTUFBTSxVQUFVLEtBQUtHLHVCQUF1QixPQUFPO0VBQ25ELE1BQU0sU0FBUyxRQUFRLEtBQ3BCLFVBQVUsTUFBTSxTQUFTLG9CQUFvQixNQUFNLHFCQUFxQixDQUMzRTtFQUNBLE1BQU0sY0FBYyxRQUFRLEtBQ3pCLFVBQVUsTUFBTSxzQkFBc0IsU0FDekM7RUFDQSxPQUFPO0dBQ0w7SUFDQyxNQUFNO0lBQ0wsT0FBTyxLQUFLRyxlQUFlLEtBQUssUUFBUSxTQUFTLFdBQVc7R0FDOUQ7U0FDTTtJQUNKLE9BQU8sS0FBS0MsYUFBYSxRQUFRLE9BQU87R0FDMUM7RUFDRjtDQUNGO0NBQ0EsYUFBYSxRQUFRLFNBQVM7RUFDNUIsT0FBTyxRQUFRLEtBQUssT0FBTyxVQUFVO0dBQ25DLE1BQU0saUJBQWlCLE9BQU87R0FDOUIsT0FBTyxDQUFDLE1BQU0sc0JBQXNCLHNCQUFzQixNQUFNLFNBQVMsWUFBWSxpQkFBaUIsaUJBQWlCO0lBQ3JILFFBQVEsU0FBUyxNQUFNO0tBQ3JCLEVBQUUsU0FBUyxVQUFVLFlBQVk7SUFDbkMsQ0FBQztHQUNILENBQUMsSUFBSTtFQUNQLENBQUM7Q0FDSDtDQUNBLGVBQWUsT0FBTyxTQUFTLGFBQWE7RUFDMUMsSUFBSSxTQUFTO0dBQ1gsTUFBTSxhQUFhLEtBQUtDO0dBQ3hCLE1BQU0scUJBQXFCLGdCQUFnQixLQUFLLEtBQUssZUFBZSxLQUFLLE1BQU0sV0FBVyxXQUFXLFlBQVksVUFBVSxZQUFZLE1BQU0sTUFBTSxNQUFNLFNBQVMsV0FBVyxFQUFFO0dBQy9LLElBQUksQ0FBQyxLQUFLQyxtQkFBbUIsS0FBS1IsWUFBWSxLQUFLUyxlQUFlLHNCQUFzQixZQUFZLEtBQUtDLGNBQWM7SUFDckgsS0FBS0EsZUFBZTtJQUNwQixLQUFLRCxjQUFjLEtBQUtUO0lBQ3hCLElBQUksZ0JBQWdCLEtBQUssR0FDdkIsS0FBS08sbUJBQW1CO0lBRTFCLEtBQUtDLGtCQUFrQixpQkFDckIsS0FBS0EsaUJBQ0wsUUFBUSxLQUFLLENBQ2Y7R0FDRjtHQUNBLE9BQU8sS0FBS0E7RUFDZDtFQUNBLE9BQU87Q0FDVDtDQUNBLHFCQUFxQjtFQUNuQixPQUFPLEtBQUtYLFVBQVUsWUFBWSxLQUFLLEtBQUssS0FBS0UsV0FBVyxNQUFNLFVBQVUsVUFBVTtHQUNwRixPQUFPLFNBQVMsUUFBUSxZQUFZLEtBQUtDLFFBQVEsTUFBTSxFQUFFLFNBQVMsS0FBSztFQUN6RSxDQUFDO0NBQ0g7Q0FDQSx1QkFBdUIsU0FBUztFQUM5QixNQUFNLG1DQUFtQyxJQUFJLElBQUk7RUFDakQsS0FBS0QsV0FBVyxTQUFTLGFBQWE7R0FDcEMsTUFBTSxNQUFNLFNBQVMsUUFBUTtHQUM3QixJQUFJLENBQUMsS0FBSztHQUNWLE1BQU0sb0JBQW9CLGlCQUFpQixJQUFJLEdBQUc7R0FDbEQsSUFBSSxtQkFDRixrQkFBa0IsS0FBSyxRQUFRO1FBRS9CLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUM7RUFFeEMsQ0FBQztFQUNELE1BQU0sWUFBWSxDQUFDO0VBQ25CLFFBQVEsU0FBUyxZQUFZO0dBQzNCLE1BQU0sbUJBQW1CLEtBQUtILFFBQVEsb0JBQW9CLE9BQU87R0FFakUsTUFBTSxXQURRLGlCQUFpQixJQUFJLGlCQUFpQixTQUFTLENBQUMsRUFBRSxNQUFNLEtBQzVDLElBQUksY0FBYyxLQUFLQSxTQUFTLGdCQUFnQjtHQUMxRSxVQUFVLEtBQUs7SUFDYix1QkFBdUI7SUFDdkI7R0FDRixDQUFDO0VBQ0gsQ0FBQztFQUNELE9BQU87Q0FDVDtDQUNBLFVBQVUsVUFBVSxRQUFRO0VBQzFCLE1BQU0sUUFBUSxLQUFLRyxXQUFXLFFBQVEsUUFBUTtFQUM5QyxJQUFJLFVBQVUsSUFBSTtHQUNoQixLQUFLQyxVQUFVLFVBQVUsS0FBS0EsU0FBUyxPQUFPLE1BQU07R0FDcEQsS0FBS0ksUUFBUTtFQUNmO0NBQ0Y7Q0FDQSxVQUFVO0VBQ1IsSUFBSSxLQUFLLGFBQWEsR0FBRztHQUN2QixNQUFNLGFBQWEsS0FBS0UsYUFBYSxLQUFLTixTQUFTLEtBQUtHLGdCQUFnQjtHQUN4RSxNQUFNLG9CQUFvQixLQUFLUSxtQkFBbUI7R0FDbEQsTUFBTSxpQkFBaUIsS0FBS0g7R0FDNUIsTUFBTSxZQUFZLG9CQUFvQixpQkFBaUIsS0FBS0gsZUFBZSxZQUFZLEtBQUtSLFVBQVUsT0FBTztHQUM3RyxJQUFJLHFCQUFxQixtQkFBbUIsV0FDMUMsY0FBYyxZQUFZO0lBQ3hCLEtBQUssVUFBVSxTQUFTLGFBQWE7S0FDbkMsU0FBUyxLQUFLRyxPQUFPO0lBQ3ZCLENBQUM7R0FDSCxDQUFDO0VBRUw7Q0FDRjtBQUNGOzs7QUNoTkEsSUFBSSxhQUFhLGNBQWMsYUFBYTtDQUMxQyxZQUFZLFNBQVMsQ0FBQyxHQUFHO0VBQ3ZCLE1BQU07RUFDTixLQUFLLFNBQVM7RUFDZCxLQUFLWSwyQkFBMkIsSUFBSSxJQUFJO0NBQzFDO0NBQ0E7Q0FDQSxNQUFNLFFBQVEsU0FBUyxPQUFPO0VBQzVCLE1BQU0sV0FBVyxRQUFRO0VBQ3pCLE1BQU0sWUFBWSxRQUFRLGFBQWEsc0JBQXNCLFVBQVUsT0FBTztFQUM5RSxJQUFJLFFBQVEsS0FBSyxJQUFJLFNBQVM7RUFDOUIsSUFBSSxDQUFDLE9BQU87R0FDVixRQUFRLElBQUksTUFBTTtJQUNoQjtJQUNBO0lBQ0E7SUFDQSxTQUFTLE9BQU8sb0JBQW9CLE9BQU87SUFDM0M7SUFDQSxnQkFBZ0IsT0FBTyxpQkFBaUIsUUFBUTtHQUNsRCxDQUFDO0dBQ0QsS0FBSyxJQUFJLEtBQUs7RUFDaEI7RUFDQSxPQUFPO0NBQ1Q7Q0FDQSxJQUFJLE9BQU87RUFDVCxJQUFJLENBQUMsS0FBS0EsU0FBUyxJQUFJLE1BQU0sU0FBUyxHQUFHO0dBQ3ZDLEtBQUtBLFNBQVMsSUFBSSxNQUFNLFdBQVcsS0FBSztHQUN4QyxLQUFLLE9BQU87SUFDVixNQUFNO0lBQ047R0FDRixDQUFDO0VBQ0g7Q0FDRjtDQUNBLE9BQU8sT0FBTztFQUNaLE1BQU0sYUFBYSxLQUFLQSxTQUFTLElBQUksTUFBTSxTQUFTO0VBQ3BELElBQUksWUFBWTtHQUNkLE1BQU0sUUFBUTtHQUNkLElBQUksZUFBZSxPQUNqQixLQUFLQSxTQUFTLE9BQU8sTUFBTSxTQUFTO0dBRXRDLEtBQUssT0FBTztJQUFFLE1BQU07SUFBVztHQUFNLENBQUM7RUFDeEM7Q0FDRjtDQUNBLFFBQVE7RUFDTixjQUFjLFlBQVk7R0FDeEIsS0FBSyxPQUFPLENBQUMsQ0FBQyxTQUFTLFVBQVU7SUFDL0IsS0FBSyxPQUFPLEtBQUs7R0FDbkIsQ0FBQztFQUNILENBQUM7Q0FDSDtDQUNBLElBQUksV0FBVztFQUNiLE9BQU8sS0FBS0EsU0FBUyxJQUFJLFNBQVM7Q0FDcEM7Q0FDQSxTQUFTO0VBQ1AsT0FBTyxDQUFDLEdBQUcsS0FBS0EsU0FBUyxPQUFPLENBQUM7Q0FDbkM7Q0FDQSxLQUFLLFNBQVM7RUFDWixNQUFNLG1CQUFtQjtHQUFFLE9BQU87R0FBTSxHQUFHO0VBQVE7RUFDbkQsT0FBTyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE1BQ2xCLFVBQVUsV0FBVyxrQkFBa0IsS0FBSyxDQUMvQztDQUNGO0NBQ0EsUUFBUSxVQUFVLENBQUMsR0FBRztFQUNwQixNQUFNLFVBQVUsS0FBSyxPQUFPO0VBQzVCLE9BQU8sT0FBTyxLQUFLLE9BQU8sQ0FBQyxDQUFDLFNBQVMsSUFBSSxRQUFRLFFBQVEsVUFBVSxXQUFXLFNBQVMsS0FBSyxDQUFDLElBQUk7Q0FDbkc7Q0FDQSxPQUFPLE9BQU87RUFDWixjQUFjLFlBQVk7R0FDeEIsS0FBSyxVQUFVLFNBQVMsYUFBYTtJQUNuQyxTQUFTLEtBQUs7R0FDaEIsQ0FBQztFQUNILENBQUM7Q0FDSDtDQUNBLFVBQVU7RUFDUixjQUFjLFlBQVk7R0FDeEIsS0FBSyxPQUFPLENBQUMsQ0FBQyxTQUFTLFVBQVU7SUFDL0IsTUFBTSxRQUFRO0dBQ2hCLENBQUM7RUFDSCxDQUFDO0NBQ0g7Q0FDQSxXQUFXO0VBQ1QsY0FBYyxZQUFZO0dBQ3hCLEtBQUssT0FBTyxDQUFDLENBQUMsU0FBUyxVQUFVO0lBQy9CLE1BQU0sU0FBUztHQUNqQixDQUFDO0VBQ0gsQ0FBQztDQUNIO0FBQ0Y7OztBQzdFQSxJQUFJLGNBQWMsTUFBTTtDQUN0QjtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0EsWUFBWSxTQUFTLENBQUMsR0FBRztFQUN2QixLQUFLQyxjQUFjLE9BQU8sY0FBYyxJQUFJLFdBQVc7RUFDdkQsS0FBS0MsaUJBQWlCLE9BQU8saUJBQWlCLElBQUksY0FBYztFQUNoRSxLQUFLQyxrQkFBa0IsT0FBTyxrQkFBa0IsQ0FBQztFQUNqRCxLQUFLQyxpQ0FBaUMsSUFBSSxJQUFJO0VBQzlDLEtBQUtDLG9DQUFvQyxJQUFJLElBQUk7RUFDakQsS0FBS0MsY0FBYztDQUNyQjtDQUNBLFFBQVE7RUFDTixLQUFLQTtFQUNMLElBQUksS0FBS0EsZ0JBQWdCLEdBQUc7RUFDNUIsS0FBS0Msb0JBQW9CLGFBQWEsVUFBVSxPQUFPLFlBQVk7R0FDakUsSUFBSSxTQUFTO0lBQ1gsTUFBTSxLQUFLLHNCQUFzQjtJQUNqQyxLQUFLTixZQUFZLFFBQVE7R0FDM0I7RUFDRixDQUFDO0VBQ0QsS0FBS08scUJBQXFCLGNBQWMsVUFBVSxPQUFPLFdBQVc7R0FDbEUsSUFBSSxRQUFRO0lBQ1YsTUFBTSxLQUFLLHNCQUFzQjtJQUNqQyxLQUFLUCxZQUFZLFNBQVM7R0FDNUI7RUFDRixDQUFDO0NBQ0g7Q0FDQSxVQUFVO0VBQ1IsS0FBS0s7RUFDTCxJQUFJLEtBQUtBLGdCQUFnQixHQUFHO0VBQzVCLEtBQUtDLG9CQUFvQjtFQUN6QixLQUFLQSxvQkFBb0IsS0FBSztFQUM5QixLQUFLQyxxQkFBcUI7RUFDMUIsS0FBS0EscUJBQXFCLEtBQUs7Q0FDakM7Q0FDQSxXQUFXLFNBQVM7RUFDbEIsT0FBTyxLQUFLUCxZQUFZLFFBQVE7R0FBRSxHQUFHO0dBQVMsYUFBYTtFQUFXLENBQUMsQ0FBQyxDQUFDO0NBQzNFO0NBQ0EsV0FBVyxTQUFTO0VBQ2xCLE9BQU8sS0FBS0MsZUFBZSxRQUFRO0dBQUUsR0FBRztHQUFTLFFBQVE7RUFBVSxDQUFDLENBQUMsQ0FBQztDQUN4RTs7Ozs7Ozs7Q0FRQSxhQUFhLFVBQVU7RUFDckIsTUFBTSxVQUFVLEtBQUssb0JBQW9CLEVBQUUsU0FBUyxDQUFDO0VBQ3JELE9BQU8sS0FBS0QsWUFBWSxJQUFJLFFBQVEsU0FBUyxDQUFDLEVBQUUsTUFBTTtDQUN4RDtDQUNBLGdCQUFnQixTQUFTO0VBQ3ZCLE1BQU0sbUJBQW1CLEtBQUssb0JBQW9CLE9BQU87RUFDekQsTUFBTSxRQUFRLEtBQUtBLFlBQVksTUFBTSxNQUFNLGdCQUFnQjtFQUMzRCxNQUFNLGFBQWEsTUFBTSxNQUFNO0VBQy9CLElBQUksZUFBZSxLQUFLLEdBQ3RCLE9BQU8sS0FBSyxXQUFXLE9BQU87RUFFaEMsSUFBSSxRQUFRLHFCQUFxQixNQUFNLGNBQWMsaUJBQWlCLGlCQUFpQixXQUFXLEtBQUssQ0FBQyxHQUN0RyxLQUFVLGNBQWMsZ0JBQWdCO0VBRTFDLE9BQU8sUUFBUSxRQUFRLFVBQVU7Q0FDbkM7Q0FDQSxlQUFlLFNBQVM7RUFDdEIsT0FBTyxLQUFLQSxZQUFZLFFBQVEsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLFVBQVUsWUFBWTtHQUVwRSxPQUFPLENBQUMsVUFESyxNQUFNLElBQ0c7RUFDeEIsQ0FBQztDQUNIO0NBQ0EsYUFBYSxVQUFVLFNBQVMsU0FBUztFQUN2QyxNQUFNLG1CQUFtQixLQUFLLG9CQUFvQixFQUFFLFNBQVMsQ0FBQztFQUk5RCxNQUFNLFdBSFEsS0FBS0EsWUFBWSxJQUM3QixpQkFBaUIsU0FFRSxDQUFDLEVBQUUsTUFBTTtFQUM5QixNQUFNLE9BQU8saUJBQWlCLFNBQVMsUUFBUTtFQUMvQyxJQUFJLFNBQVMsS0FBSyxHQUNoQjtFQUVGLE9BQU8sS0FBS0EsWUFBWSxNQUFNLE1BQU0sZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLE1BQU07R0FBRSxHQUFHO0dBQVMsUUFBUTtFQUFLLENBQUM7Q0FDbEc7Q0FDQSxlQUFlLFNBQVMsU0FBUyxTQUFTO0VBQ3hDLE9BQU8sY0FBYyxZQUNiLEtBQUtBLFlBQVksUUFBUSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUM1RCxVQUNBLEtBQUssYUFBYSxVQUFVLFNBQVMsT0FBTyxDQUM5QyxDQUFDLENBQ0g7Q0FDRjtDQUNBLGNBQWMsVUFBVTtFQUN0QixNQUFNLFVBQVUsS0FBSyxvQkFBb0IsRUFBRSxTQUFTLENBQUM7RUFDckQsT0FBTyxLQUFLQSxZQUFZLElBQ3RCLFFBQVEsU0FDVixDQUFDLEVBQUU7Q0FDTDtDQUNBLGNBQWMsU0FBUztFQUNyQixNQUFNLGFBQWEsS0FBS0E7RUFDeEIsY0FBYyxZQUFZO0dBQ3hCLFdBQVcsUUFBUSxPQUFPLENBQUMsQ0FBQyxTQUFTLFVBQVU7SUFDN0MsV0FBVyxPQUFPLEtBQUs7R0FDekIsQ0FBQztFQUNILENBQUM7Q0FDSDtDQUNBLGFBQWEsU0FBUyxTQUFTO0VBQzdCLE1BQU0sYUFBYSxLQUFLQTtFQUN4QixPQUFPLGNBQWMsWUFBWTtHQUMvQixXQUFXLFFBQVEsT0FBTyxDQUFDLENBQUMsU0FBUyxVQUFVO0lBQzdDLE1BQU0sTUFBTTtHQUNkLENBQUM7R0FDRCxPQUFPLEtBQUssZUFDVjtJQUNFLE1BQU07SUFDTixHQUFHO0dBQ0wsR0FDQSxPQUNGO0VBQ0YsQ0FBQztDQUNIO0NBQ0EsY0FBYyxTQUFTLGdCQUFnQixDQUFDLEdBQUc7RUFDekMsTUFBTSx5QkFBeUI7R0FBRSxRQUFRO0dBQU0sR0FBRztFQUFjO0VBQ2hFLE1BQU0sV0FBVyxjQUFjLFlBQ3ZCLEtBQUtBLFlBQVksUUFBUSxPQUFPLENBQUMsQ0FBQyxLQUFLLFVBQVUsTUFBTSxPQUFPLHNCQUFzQixDQUFDLENBQzdGO0VBQ0EsT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUk7Q0FDcEQ7Q0FDQSxrQkFBa0IsU0FBUyxVQUFVLENBQUMsR0FBRztFQUN2QyxPQUFPLGNBQWMsWUFBWTtHQUMvQixLQUFLQSxZQUFZLFFBQVEsT0FBTyxDQUFDLENBQUMsU0FBUyxVQUFVO0lBQ25ELE1BQU0sV0FBVztHQUNuQixDQUFDO0dBQ0QsSUFBSSxTQUFTLGdCQUFnQixRQUMzQixPQUFPLFFBQVEsUUFBUTtHQUV6QixPQUFPLEtBQUssZUFDVjtJQUNFLEdBQUc7SUFDSCxNQUFNLFNBQVMsZUFBZSxTQUFTLFFBQVE7R0FDakQsR0FDQSxPQUNGO0VBQ0YsQ0FBQztDQUNIO0NBQ0EsZUFBZSxTQUFTLFVBQVUsQ0FBQyxHQUFHO0VBQ3BDLE1BQU0sZUFBZTtHQUNuQixHQUFHO0dBQ0gsZUFBZSxRQUFRLGlCQUFpQjtFQUMxQztFQUNBLE1BQU0sV0FBVyxjQUFjLFlBQ3ZCLEtBQUtBLFlBQVksUUFBUSxPQUFPLENBQUMsQ0FBQyxRQUFRLFVBQVUsQ0FBQyxNQUFNLFdBQVcsS0FBSyxDQUFDLE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVU7R0FDakgsSUFBSSxVQUFVLE1BQU0sTUFBTSxLQUFLLEdBQUcsWUFBWTtHQUM5QyxJQUFJLENBQUMsYUFBYSxjQUNoQixVQUFVLFFBQVEsTUFBTSxJQUFJO0dBRTlCLE9BQU8sTUFBTSxNQUFNLGdCQUFnQixXQUFXLFFBQVEsUUFBUSxJQUFJO0VBQ3BFLENBQUMsQ0FDSDtFQUNBLE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtDQUN4QztDQUNBLFdBQVcsU0FBUztFQUNsQixNQUFNLG1CQUFtQixLQUFLLG9CQUFvQixPQUFPO0VBQ3pELElBQUksaUJBQWlCLFVBQVUsS0FBSyxHQUNsQyxpQkFBaUIsUUFBUTtFQUUzQixNQUFNLFFBQVEsS0FBS0EsWUFBWSxNQUFNLE1BQU0sZ0JBQWdCO0VBQzNELE9BQU8sTUFBTSxjQUNYLGlCQUFpQixpQkFBaUIsV0FBVyxLQUFLLENBQ3BELElBQUksTUFBTSxNQUFNLGdCQUFnQixJQUFJLFFBQVEsUUFBUSxNQUFNLE1BQU0sSUFBSTtDQUN0RTtDQUNBLGNBQWMsU0FBUztFQUNyQixPQUFPLEtBQUssV0FBVyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSTtDQUN2RDtDQUNBLG1CQUFtQixTQUFTO0VBQzFCLFFBQVEsUUFBUTtFQUNoQixPQUFPLEtBQUssV0FBVyxPQUFPO0NBQ2hDO0NBQ0Esc0JBQXNCLFNBQVM7RUFDN0IsT0FBTyxLQUFLLG1CQUFtQixPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSTtDQUMvRDtDQUNBLHdCQUF3QixTQUFTO0VBQy9CLFFBQVEsUUFBUTtFQUNoQixPQUFPLEtBQUssZ0JBQWdCLE9BQU87Q0FDckM7Q0FDQSx3QkFBd0I7RUFDdEIsSUFBSSxjQUFjLFNBQVMsR0FDekIsT0FBTyxLQUFLQyxlQUFlLHNCQUFzQjtFQUVuRCxPQUFPLFFBQVEsUUFBUTtDQUN6QjtDQUNBLGdCQUFnQjtFQUNkLE9BQU8sS0FBS0Q7Q0FDZDtDQUNBLG1CQUFtQjtFQUNqQixPQUFPLEtBQUtDO0NBQ2Q7Q0FDQSxvQkFBb0I7RUFDbEIsT0FBTyxLQUFLQztDQUNkO0NBQ0Esa0JBQWtCLFNBQVM7RUFDekIsS0FBS0Esa0JBQWtCO0NBQ3pCO0NBQ0EsaUJBQWlCLFVBQVUsU0FBUztFQUNsQyxLQUFLQyxlQUFlLElBQUksUUFBUSxRQUFRLEdBQUc7R0FDekM7R0FDQSxnQkFBZ0I7RUFDbEIsQ0FBQztDQUNIO0NBQ0EsaUJBQWlCLFVBQVU7RUFDekIsTUFBTSxXQUFXLENBQUMsR0FBRyxLQUFLQSxlQUFlLE9BQU8sQ0FBQztFQUNqRCxNQUFNLFNBQVMsQ0FBQztFQUNoQixTQUFTLFNBQVMsaUJBQWlCO0dBQ2pDLElBQUksZ0JBQWdCLFVBQVUsYUFBYSxRQUFRLEdBQ2pELE9BQU8sT0FBTyxRQUFRLGFBQWEsY0FBYztFQUVyRCxDQUFDO0VBQ0QsT0FBTztDQUNUO0NBQ0Esb0JBQW9CLGFBQWEsU0FBUztFQUN4QyxLQUFLQyxrQkFBa0IsSUFBSSxRQUFRLFdBQVcsR0FBRztHQUMvQztHQUNBLGdCQUFnQjtFQUNsQixDQUFDO0NBQ0g7Q0FDQSxvQkFBb0IsYUFBYTtFQUMvQixNQUFNLFdBQVcsQ0FBQyxHQUFHLEtBQUtBLGtCQUFrQixPQUFPLENBQUM7RUFDcEQsTUFBTSxTQUFTLENBQUM7RUFDaEIsU0FBUyxTQUFTLGlCQUFpQjtHQUNqQyxJQUFJLGdCQUFnQixhQUFhLGFBQWEsV0FBVyxHQUN2RCxPQUFPLE9BQU8sUUFBUSxhQUFhLGNBQWM7RUFFckQsQ0FBQztFQUNELE9BQU87Q0FDVDtDQUNBLG9CQUFvQixTQUFTO0VBQzNCLElBQUksUUFBUSxZQUNWLE9BQU87RUFFVCxNQUFNLG1CQUFtQjtHQUN2QixHQUFHLEtBQUtGLGdCQUFnQjtHQUN4QixHQUFHLEtBQUssaUJBQWlCLFFBQVEsUUFBUTtHQUN6QyxHQUFHO0dBQ0gsWUFBWTtFQUNkO0VBQ0EsSUFBSSxDQUFDLGlCQUFpQixXQUNwQixpQkFBaUIsWUFBWSxzQkFDM0IsaUJBQWlCLFVBQ2pCLGdCQUNGO0VBRUYsSUFBSSxpQkFBaUIsdUJBQXVCLEtBQUssR0FDL0MsaUJBQWlCLHFCQUFxQixpQkFBaUIsZ0JBQWdCO0VBRXpFLElBQUksaUJBQWlCLGlCQUFpQixLQUFLLEdBQ3pDLGlCQUFpQixlQUFlLENBQUMsQ0FBQyxpQkFBaUI7RUFFckQsSUFBSSxDQUFDLGlCQUFpQixlQUFlLGlCQUFpQixXQUNwRCxpQkFBaUIsY0FBYztFQUVqQyxJQUFJLGlCQUFpQixZQUFZLFdBQy9CLGlCQUFpQixVQUFVO0VBRTdCLE9BQU87Q0FDVDtDQUNBLHVCQUF1QixTQUFTO0VBQzlCLElBQUksU0FBUyxZQUNYLE9BQU87RUFFVCxPQUFPO0dBQ0wsR0FBRyxLQUFLQSxnQkFBZ0I7R0FDeEIsR0FBRyxTQUFTLGVBQWUsS0FBSyxvQkFBb0IsUUFBUSxXQUFXO0dBQ3ZFLEdBQUc7R0FDSCxZQUFZO0VBQ2Q7Q0FDRjtDQUNBLFFBQVE7RUFDTixLQUFLRixZQUFZLE1BQU07RUFDdkIsS0FBS0MsZUFBZSxNQUFNO0NBQzVCO0FBQ0Y7OztBQ3pTQSxTQUFTLGNBQWMsRUFDckIsVUFDQSxjQUFjLFNBQ2QsV0FBVyxPQUFPLFVBQVUsU0FBUyxPQUFPLEtBQUssR0FDakQsZUFBZSxDQUFDLEtBQ2Y7Q0FDRCxPQUFPLE9BQU8sWUFBWTtFQUN4QixNQUFNLFFBQVEsUUFBUSxPQUFPLGNBQWMsQ0FBQyxDQUFDLEtBQUs7R0FBRSxVQUFVLFFBQVE7R0FBVSxPQUFPO0VBQUssQ0FBQztFQUM3RixNQUFNLFlBQVksQ0FBQyxDQUFDLFNBQVMsTUFBTSxVQUFVO0VBQzdDLElBQUksYUFBYSxnQkFBZ0IsU0FDL0IsTUFBTSxTQUFTO0dBQ2IsR0FBRyxNQUFNO0dBQ1QsYUFBYTtFQUNmLENBQUM7RUFFSCxJQUFJLFNBQVM7RUFDYixJQUFJLFlBQVk7RUFZaEIsTUFBTSxTQUFTLE1BQU0sU0FYRyxzQkFDdEI7R0FDRSxRQUFRLFFBQVE7R0FDaEIsTUFBTSxRQUFRO0dBQ2QsVUFBVSxRQUFRO0dBQ2xCLFdBQVcsUUFBUTtHQUNuQixXQUFXLFFBQVE7RUFDckIsU0FDTSxRQUFRLGNBQ1IsWUFBWSxJQUV3QixDQUFDO0VBQzdDLE1BQU0sbUJBQW1CLGFBQWEsZ0JBQWdCO0VBQ3RELFdBQVcsTUFBTSxTQUFTLFFBQVE7R0FDaEMsSUFBSSxXQUNGO0dBRUYsSUFBSSxrQkFDRixTQUFTLFFBQVEsUUFBUSxLQUFLO1FBRTlCLFFBQVEsT0FBTyxhQUNiLFFBQVEsV0FDUCxTQUFTLFFBQVEsU0FBUyxLQUFLLElBQUksZUFBZSxNQUFNLEtBQUssQ0FDaEU7RUFFSjtFQUNBLElBQUksb0JBQW9CLENBQUMsV0FDdkIsUUFBUSxPQUFPLGFBQWEsUUFBUSxVQUFVLE1BQU07RUFFdEQsT0FBTyxRQUFRLE9BQU8sYUFBYSxRQUFRLFFBQVEsS0FBSztDQUMxRDtBQUNGOzs7QUNqREEsSUFBSSxnQkFBZ0MsdUJBQU8sZUFBZTtBQUMxRCxJQUFJLHFCQUFxQyx1QkFBTyxvQkFBb0I7QUFDcEUsSUFBSSxjQUE4Qix1QkFBTyxhQUFhOzs7OztBQ0V0RCxJQUFJLHFCQUFBLGFBQTJCLGNBQzdCLEtBQUssQ0FDUDtBQUNBLElBQUksa0JBQWtCLGdCQUFnQjtDQUNwQyxNQUFNLFNBQUEsYUFBZSxXQUFXLGtCQUFrQjtDQUNsRCxJQUFJLGFBQ0YsT0FBTztDQUVULElBQUksQ0FBQyxRQUNILE1BQU0sSUFBSSxNQUFNLHdEQUF3RDtDQUUxRSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLHVCQUF1QixFQUN6QixRQUNBLGVBQ0k7Q0FDSixhQUFNLGdCQUFnQjtFQUNwQixPQUFPLE1BQU07RUFDYixhQUFhO0dBQ1gsT0FBTyxRQUFRO0VBQ2pCO0NBQ0YsR0FBRyxDQUFDLE1BQU0sQ0FBQztDQUNYLE9BQXVCLGlCQUFBLEdBQUEsbUJBQUEsSUFBQSxDQUFJLG1CQUFtQixVQUFVO0VBQUUsT0FBTztFQUFRO0NBQVMsQ0FBQztBQUNyRjs7O0FDekJBLElBQUkscUJBQUEsYUFBMkIsY0FBYyxLQUFLO0FBQ2xELElBQUksdUJBQUEsYUFBNkIsV0FBVyxrQkFBa0I7QUFDOUQsSUFBSSxzQkFBc0IsbUJBQW1COzs7QUNEN0MsU0FBUyxjQUFjO0NBQ3JCLElBQUksVUFBVTtDQUNkLE9BQU87RUFDTCxrQkFBa0I7R0FDaEIsVUFBVTtFQUNaO0VBQ0EsYUFBYTtHQUNYLFVBQVU7RUFDWjtFQUNBLGVBQWU7R0FDYixPQUFPO0VBQ1Q7Q0FDRjtBQUNGO0FBQ0EsSUFBSSxpQ0FBQSxhQUF1QyxjQUFjLFlBQVksQ0FBQztBQUN0RSxJQUFJLG1DQUFBLGFBQXlDLFdBQVcsOEJBQThCO0FBQ3RGLElBQUksMkJBQTJCLEVBQzdCLGVBQ0k7Q0FDSixNQUFNLENBQUMsU0FBQSxhQUFlLGVBQWUsWUFBWSxDQUFDO0NBQ2xELE9BQXVCLGlCQUFBLEdBQUEsbUJBQUEsSUFBQSxDQUFJLCtCQUErQixVQUFVO0VBQUU7RUFBTyxVQUFVLE9BQU8sYUFBYSxhQUFhLFNBQVMsS0FBSyxJQUFJO0NBQVMsQ0FBQztBQUN0Sjs7O0FDckJBLElBQUksbUNBQW1DLFNBQVMsb0JBQW9CLFVBQVU7Q0FDNUUsTUFBTSxlQUFlLE9BQU8sTUFBTSxTQUFTLE9BQU8sUUFBUSxpQkFBaUIsYUFBYSxpQkFBaUIsUUFBUSxjQUFjLENBQUMsTUFBTSxNQUFNLE9BQU8sS0FBSyxDQUFDLElBQUksUUFBUTtDQUNySyxJQUFJLFFBQVEsWUFBWSxRQUFRLGlDQUFpQyxjQUMzRDtNQUFBLENBQUMsbUJBQW1CLFFBQVEsR0FDOUIsUUFBUSxlQUFlO0NBQUE7QUFHN0I7QUFDQSxJQUFJLDhCQUE4Qix1QkFBdUI7Q0FDdkQsYUFBTSxnQkFBZ0I7RUFDcEIsbUJBQW1CLFdBQVc7Q0FDaEMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0FBQ3pCO0FBQ0EsSUFBSSxlQUFlLEVBQ2pCLFFBQ0Esb0JBQ0EsY0FDQSxPQUNBLGVBQ0k7Q0FDSixPQUFPLE9BQU8sV0FBVyxDQUFDLG1CQUFtQixRQUFRLEtBQUssQ0FBQyxPQUFPLGNBQWMsVUFBVSxZQUFZLE9BQU8sU0FBUyxLQUFLLEtBQUssaUJBQWlCLGNBQWMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxDQUFDO0FBQ3RMOzs7QUN6QkEsSUFBSSx1QkFBdUIsUUFBUSxVQUFVLE1BQU0sTUFBTSxTQUFTLEtBQUs7QUFDdkUsSUFBSSx3QkFBd0IscUJBQXFCO0NBQy9DLElBQUksaUJBQWlCLFVBQVU7RUFDN0IsTUFBTSx1QkFBdUI7RUFDN0IsTUFBTSxTQUFTLFVBQVUsVUFBVSxXQUFXLFFBQVEsS0FBSyxJQUFJLFNBQVMsc0JBQXNCLG9CQUFvQjtFQUNsSCxNQUFNLG9CQUFvQixpQkFBaUI7RUFDM0MsaUJBQWlCLFlBQVksT0FBTyxzQkFBc0IsY0FBYyxHQUFHLFNBQVMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxNQUFNLGlCQUFpQjtFQUMvSSxJQUFJLE9BQU8saUJBQWlCLFdBQVcsVUFDckMsaUJBQWlCLFNBQVMsS0FBSyxJQUM3QixpQkFBaUIsUUFDakIsb0JBQ0Y7Q0FFSjtBQUNGO0FBQ0EsSUFBSSxhQUFhLFFBQVEsZ0JBQWdCLE9BQU8sYUFBYSxPQUFPLGNBQWMsQ0FBQztBQUNuRixJQUFJLGlCQUFpQixrQkFBa0IsV0FBVyxrQkFBa0IsWUFBWSxPQUFPO0FBQ3ZGLElBQUksbUJBQW1CLGtCQUFrQixVQUFVLHVCQUF1QixTQUFTLGdCQUFnQixnQkFBZ0IsQ0FBQyxDQUFDLFlBQVk7Q0FDL0gsbUJBQW1CLFdBQVc7QUFDaEMsQ0FBQzs7O0FDR0QsU0FBUyxXQUFXLEVBQ2xCLFNBQ0EsR0FBRyxXQUNGLGFBQWE7Q0FDZCxNQUFNLFNBQVMsZUFBZSxXQUFXO0NBQ3pDLE1BQU0sY0FBYyxlQUFlO0NBQ25DLE1BQU0scUJBQXFCLDJCQUEyQjtDQUN0RCxNQUFNLG1CQUFBLGFBQXlCLGNBQ3ZCLFFBQVEsS0FBSyxTQUFTO0VBQzFCLE1BQU0sbUJBQW1CLE9BQU8sb0JBQzlCLElBQ0Y7RUFDQSxpQkFBaUIscUJBQXFCLGNBQWMsZ0JBQWdCO0VBQ3BFLE9BQU87Q0FDVCxDQUFDLEdBQ0Q7RUFBQztFQUFTO0VBQVE7Q0FBVyxDQUMvQjtDQUNBLGlCQUFpQixTQUFTLGlCQUFpQjtFQUN6QyxxQkFBcUIsWUFBWTtFQUNqQyxNQUFNLFFBQVEsT0FBTyxjQUFjLENBQUMsQ0FBQyxJQUFJLGFBQWEsU0FBUztFQUMvRCxnQ0FBZ0MsY0FBYyxvQkFBb0IsS0FBSztDQUN6RSxDQUFDO0NBQ0QsMkJBQTJCLGtCQUFrQjtDQUM3QyxNQUFNLENBQUMsWUFBQSxhQUFrQixlQUNqQixJQUFJLGdCQUNSLFFBQ0Esa0JBQ0EsT0FDRixDQUNGO0NBQ0EsTUFBTSxDQUFDLGtCQUFrQixtQkFBbUIsZUFBZSxTQUFTLG9CQUNsRSxrQkFDQSxRQUFRLE9BQ1Y7Q0FDQSxNQUFNLGtCQUFrQixDQUFDLGVBQWUsUUFBUSxlQUFlO0NBQy9ELGFBQU0scUJBQUEsYUFDRSxhQUNILGtCQUFrQixrQkFBa0IsU0FBUyxVQUFVLGNBQWMsV0FBVyxhQUFhLENBQUMsSUFBSSxNQUNuRyxDQUFDLFVBQVUsZUFBZSxDQUM1QixTQUNNLFNBQVMsaUJBQWlCLFNBQzFCLFNBQVMsaUJBQWlCLENBQ2xDO0NBQ0EsYUFBTSxnQkFBZ0I7RUFDcEIsU0FBUyxXQUNQLGtCQUNBLE9BQ0Y7Q0FDRixHQUFHO0VBQUM7RUFBa0I7RUFBUztDQUFRLENBQUM7Q0FJeEMsTUFBTSxtQkFIMEIsaUJBQWlCLE1BQzlDLFFBQVEsVUFBVSxjQUFjLGlCQUFpQixRQUFRLE1BQU0sQ0FFbkIsSUFBSSxpQkFBaUIsU0FBUyxRQUFRLFVBQVU7RUFDN0YsTUFBTSxPQUFPLGlCQUFpQjtFQUM5QixJQUFJLFFBQVEsY0FBYyxNQUFNLE1BQU0sR0FFcEMsT0FBTyxnQkFBZ0IsTUFBTSxJQURILGNBQWMsUUFBUSxJQUNuQixHQUFlLGtCQUFrQjtFQUVoRSxPQUFPLENBQUM7Q0FDVixDQUFDLElBQUksQ0FBQztDQUNOLElBQUksaUJBQWlCLFNBQVMsR0FDNUIsTUFBTSxRQUFRLElBQUksZ0JBQWdCO0NBRXBDLE1BQU0sb0NBQW9DLGlCQUFpQixNQUN4RCxRQUFRLFVBQVU7RUFDakIsTUFBTSxRQUFRLGlCQUFpQjtFQUMvQixPQUFPLFNBQVMsWUFBWTtHQUMxQjtHQUNBO0dBQ0EsY0FBYyxNQUFNO0dBQ3BCLE9BQU8sT0FBTyxjQUFjLENBQUMsQ0FBQyxJQUFJLE1BQU0sU0FBUztHQUNqRCxVQUFVLE1BQU07RUFDbEIsQ0FBQztDQUNILENBQ0Y7Q0FDQSxJQUFJLG1DQUFtQyxPQUNyQyxNQUFNLGtDQUFrQztDQUUxQyxPQUFPLGtCQUFrQixZQUFZLENBQUM7QUFDeEM7OztBQ25GQSxTQUFTLGFBQWEsU0FBUyxVQUFVLGFBQWE7Q0FFbEQsSUFBSSxPQUFPLFlBQVksWUFBWSxNQUFNLFFBQVEsT0FBTyxHQUN0RCxNQUFNLElBQUksTUFDUixnU0FDRjtDQUdKLE1BQU0sY0FBYyxlQUFlO0NBQ25DLE1BQU0scUJBQXFCLDJCQUEyQjtDQUN0RCxNQUFNLFNBQVMsZUFBZSxXQUFXO0NBQ3pDLE1BQU0sbUJBQW1CLE9BQU8sb0JBQW9CLE9BQU87Q0FDM0QsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLFNBQVMsNEJBQ2xDLGdCQUNGO0NBQ0EsTUFBTSxRQUFRLE9BQU8sY0FBYyxDQUFDLENBQUMsSUFBSSxpQkFBaUIsU0FBUztDQUVqRSxJQUFJLENBQUMsaUJBQWlCLFNBQ3BCLFFBQVEsTUFDTixJQUFJLGlCQUFpQixVQUFVLG1QQUNqQztDQUdKLE1BQU0sYUFBYSxRQUFRLGVBQWU7Q0FDMUMsaUJBQWlCLHFCQUFxQixjQUFjLGdCQUFnQixhQUFhLGVBQWUsS0FBSztDQUNyRyxxQkFBcUIsZ0JBQWdCO0NBQ3JDLGdDQUFnQyxrQkFBa0Isb0JBQW9CLEtBQUs7Q0FDM0UsMkJBQTJCLGtCQUFrQjtDQUM3QyxNQUFNLGtCQUFrQixDQUFDLE9BQU8sY0FBYyxDQUFDLENBQUMsSUFBSSxpQkFBaUIsU0FBUztDQUM5RSxNQUFNLENBQUMsWUFBQSxhQUFrQixlQUNqQixJQUFJLFNBQ1IsUUFDQSxnQkFDRixDQUNGO0NBQ0EsTUFBTSxTQUFTLFNBQVMsb0JBQW9CLGdCQUFnQjtDQUM1RCxNQUFNLGtCQUFrQixDQUFDLGVBQWU7Q0FDeEMsYUFBTSxxQkFBQSxhQUNFLGFBQ0gsa0JBQWtCO0VBQ2pCLE1BQU0sY0FBYyxrQkFBa0IsU0FBUyxVQUFVLGNBQWMsV0FBVyxhQUFhLENBQUMsSUFBSTtFQUNwRyxTQUFTLGFBQWE7RUFDdEIsT0FBTztDQUNULEdBQ0EsQ0FBQyxVQUFVLGVBQWUsQ0FDNUIsU0FDTSxTQUFTLGlCQUFpQixTQUMxQixTQUFTLGlCQUFpQixDQUNsQztDQUNBLGFBQU0sZ0JBQWdCO0VBQ3BCLFNBQVMsV0FBVyxnQkFBZ0I7Q0FDdEMsR0FBRyxDQUFDLGtCQUFrQixRQUFRLENBQUM7Q0FDL0IsSUFBSSxjQUFjLGtCQUFrQixNQUFNLEdBQ3hDLE1BQU0sZ0JBQWdCLGtCQUFrQixVQUFVLGtCQUFrQjtDQUV0RSxJQUFJLFlBQVk7RUFDZDtFQUNBO0VBQ0EsY0FBYyxpQkFBaUI7RUFDL0I7RUFDQSxVQUFVLGlCQUFpQjtDQUM3QixDQUFDLEdBQ0MsTUFBTSxPQUFPO0NBR2YsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLFNBQVMsMkJBQ2xDLGtCQUNBLE1BQ0Y7Q0FDQSxJQUFJLGlCQUFpQixpQ0FBaUMsQ0FBQyxtQkFBbUIsU0FBUyxLQUFLLFVBQVUsUUFBUSxXQUFXLEdBUW5ILENBUGdCLGtCQUVkLGdCQUFnQixrQkFBa0IsVUFBVSxrQkFBa0IsSUFHOUQsT0FBTyxRQUFBLEVBRUEsTUFBTSxJQUFJLENBQUMsQ0FBQyxjQUFjO0VBQ2pDLFNBQVMsYUFBYTtDQUN4QixDQUFDO0NBRUgsT0FBTyxDQUFDLGlCQUFpQixzQkFBc0IsU0FBUyxZQUFZLE1BQU0sSUFBSTtBQUNoRjs7O0FDaEdBLFNBQVMsU0FBUyxTQUFTLGFBQWE7Q0FDdEMsT0FBTyxhQUFhLFNBQVMsZUFBZSxXQUFXO0FBQ3pEOzs7QUNEQSxTQUFTLGlCQUFpQixTQUFTLGFBQWE7Q0FFNUMsSUFBSSxRQUFRLFlBQVksV0FDdEIsUUFBUSxNQUFNLCtDQUErQztDQUdqRSxPQUFPLGFBQ0w7RUFDRSxHQUFHO0VBQ0gsU0FBUztFQUNULFVBQVU7RUFDVixjQUFjO0VBQ2QsaUJBQWlCLEtBQUs7Q0FDeEIsR0FDQSxlQUNBLFdBQ0Y7QUFDRjs7O0FDakJBLFNBQVMseUJBQXlCLFNBQVMsYUFBYTtDQUVwRCxJQUFJLFFBQVEsWUFBWSxXQUN0QixRQUFRLE1BQU0sdURBQXVEO0NBR3pFLE9BQU8sYUFDTDtFQUNFLEdBQUc7RUFDSCxTQUFTO0VBQ1QsVUFBVTtFQUNWLGNBQWM7Q0FDaEIsR0FDQSx1QkFDQSxXQUNGO0FBQ0Y7OztBQ2hCQSxTQUFTLG1CQUFtQixTQUFTLGFBQWE7Q0FDaEQsT0FBTyxXQUNMO0VBQ0UsR0FBRztFQUNILFNBQVMsUUFBUSxRQUFRLEtBQUssVUFBVTtHQUVwQyxJQUFJLE1BQU0sWUFBWSxXQUNwQixRQUFRLE1BQU0saURBQWlEO0dBR25FLE9BQU87SUFDTCxHQUFHO0lBQ0gsVUFBVTtJQUNWLGNBQWM7SUFDZCxTQUFTO0lBQ1QsaUJBQWlCLEtBQUs7R0FDeEI7RUFDRixDQUFDO0NBQ0gsR0FDQSxXQUNGO0FBQ0Y7OztBQ3pCQSxTQUFTLGlCQUFpQixTQUFTLGFBQWE7Q0FDOUMsTUFBTSxTQUFTLGVBQWUsV0FBVztDQUN6QyxJQUFJLENBQUMsT0FBTyxjQUFjLFFBQVEsUUFBUSxHQUN4QyxPQUFPLGNBQWMsT0FBTztBQUVoQzs7O0FDTEEsU0FBUyx5QkFBeUIsU0FBUyxhQUFhO0NBQ3RELE1BQU0sU0FBUyxlQUFlLFdBQVc7Q0FDekMsSUFBSSxDQUFDLE9BQU8sY0FBYyxRQUFRLFFBQVEsR0FDeEMsT0FBTyxzQkFBc0IsT0FBTztBQUV4Qzs7O0FDTkEsU0FBUyxhQUFhLFNBQVM7Q0FDN0IsT0FBTztBQUNUOzs7QUNGQSxTQUFTLHFCQUFxQixTQUFTO0NBQ3JDLE9BQU87QUFDVDs7O0FDR0EsSUFBSSxxQkFBcUIsRUFDdkIsVUFDQSxVQUFVLENBQUMsR0FDWCxPQUNBLGtCQUNJO0NBQ0osTUFBTSxTQUFTLGVBQWUsV0FBVztDQUN6QyxNQUFNLGFBQUEsYUFBbUIsT0FBTyxPQUFPO0NBQ3ZDLGFBQU0sZ0JBQWdCO0VBQ3BCLFdBQVcsVUFBVTtDQUN2QixDQUFDO0NBQ0QsTUFBTSxpQkFBQSxhQUF1QixjQUFjO0VBQ3pDLElBQUksT0FBTztHQUNULElBQUksT0FBTyxVQUFVLFVBQ25CO0dBRUYsTUFBTSxhQUFhLE9BQU8sY0FBYztHQUN4QyxNQUFNLFVBQVUsTUFBTSxXQUFXLENBQUM7R0FDbEMsTUFBTSxhQUFhLENBQUM7R0FDcEIsTUFBTSxrQkFBa0IsQ0FBQztHQUN6QixLQUFLLE1BQU0sbUJBQW1CLFNBQVM7SUFDckMsTUFBTSxnQkFBZ0IsV0FBVyxJQUFJLGdCQUFnQixTQUFTO0lBQzlELElBQUksQ0FBQyxlQUNILFdBQVcsS0FBSyxlQUFlO1NBRy9CLElBRHlCLGdCQUFnQixNQUFNLGdCQUFnQixjQUFjLE1BQU0saUJBQWlCLGdCQUFnQixXQUFXLGNBQWMsTUFBTSxXQUFXLGFBQWEsY0FBYyxNQUFNLGdCQUFnQixjQUFjLGdCQUFnQixpQkFBaUIsS0FBSyxLQUFLLGdCQUFnQixlQUFlLGNBQWMsTUFBTSxlQUV6VCxnQkFBZ0IsS0FBSyxlQUFlO0dBRzFDO0dBQ0EsSUFBSSxXQUFXLFNBQVMsR0FDdEIsUUFBUSxRQUFRLEVBQUUsU0FBUyxXQUFXLEdBQUcsV0FBVyxPQUFPO0dBRTdELElBQUksZ0JBQWdCLFNBQVMsR0FDM0IsT0FBTztFQUVYO0NBRUYsR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDO0NBQ2xCLGFBQU0sZ0JBQWdCO0VBQ3BCLElBQUksZ0JBQ0YsUUFBUSxRQUFRLEVBQUUsU0FBUyxlQUFlLEdBQUcsV0FBVyxPQUFPO0NBRW5FLEdBQUcsQ0FBQyxRQUFRLGNBQWMsQ0FBQztDQUMzQixPQUFPO0FBQ1Q7OztBQzlDQSxTQUFTLGNBQWMsU0FBUyxhQUFhO0NBQzNDLE1BQU0sU0FBUyxlQUFlLFdBQVc7Q0FDekMsTUFBTSxhQUFhLE9BQU8sY0FBYztDQUN4QyxPQUFBLGFBQWEscUJBQUEsYUFDTCxhQUNILGtCQUFrQixXQUFXLFVBQVUsY0FBYyxXQUFXLGFBQWEsQ0FBQyxHQUMvRSxDQUFDLFVBQVUsQ0FDYixTQUNNLE9BQU8sV0FBVyxPQUFPLFNBQ3pCLE9BQU8sV0FBVyxPQUFPLENBQ2pDO0FBQ0Y7OztBQ1hBLFNBQVMsY0FBYyxTQUFTLGFBQWE7Q0FDM0MsTUFBTSxTQUFTLGVBQWUsV0FBVztDQUN6QyxPQUFPLGlCQUNMLEVBQUUsU0FBUztFQUFFLEdBQUc7RUFBUyxRQUFRO0NBQVUsRUFBRSxHQUM3QyxNQUNGLENBQUMsQ0FBQztBQUNKO0FBQ0EsU0FBUyxVQUFVLGVBQWUsU0FBUztDQUN6QyxPQUFPLGNBQWMsUUFBUSxRQUFRLE9BQU8sQ0FBQyxDQUFDLEtBQzNDLGFBQWEsUUFBUSxTQUFTLFFBQVEsT0FBTyxRQUFRLElBQUksU0FBUyxLQUNyRTtBQUNGO0FBQ0EsU0FBUyxpQkFBaUIsVUFBVSxDQUFDLEdBQUcsYUFBYTtDQUNuRCxNQUFNLGdCQUFnQixlQUFlLFdBQVcsQ0FBQyxDQUFDLGlCQUFpQjtDQUNuRSxNQUFNLGFBQUEsYUFBbUIsT0FBTyxPQUFPO0NBQ3ZDLE1BQU0sU0FBQSxhQUFlLE9BQU8sSUFBSTtDQUNoQyxJQUFJLE9BQU8sWUFBWSxNQUNyQixPQUFPLFVBQVUsVUFBVSxlQUFlLE9BQU87Q0FFbkQsYUFBTSxnQkFBZ0I7RUFDcEIsV0FBVyxVQUFVO0NBQ3ZCLENBQUM7Q0FDRCxPQUFBLGFBQWEscUJBQUEsYUFDTCxhQUNILGtCQUFrQixjQUFjLGdCQUFnQjtFQUMvQyxNQUFNLGFBQWEsaUJBQ2pCLE9BQU8sU0FDUCxVQUFVLGVBQWUsV0FBVyxPQUFPLENBQzdDO0VBQ0EsSUFBSSxPQUFPLFlBQVksWUFBWTtHQUNqQyxPQUFPLFVBQVU7R0FDakIsY0FBYyxTQUFTLGFBQWE7RUFDdEM7Q0FDRixDQUFDLEdBQ0QsQ0FBQyxhQUFhLENBQ2hCLFNBQ00sT0FBTyxlQUNQLE9BQU8sT0FDZjtBQUNGOzs7QUNsQ0EsU0FBUyxZQUFZLFNBQVMsYUFBYTtDQUN6QyxNQUFNLFNBQVMsZUFBZSxXQUFXO0NBQ3pDLE1BQU0sQ0FBQyxZQUFBLGFBQWtCLGVBQ2pCLElBQUksaUJBQ1IsUUFDQSxPQUNGLENBQ0Y7Q0FDQSxhQUFNLGdCQUFnQjtFQUNwQixTQUFTLFdBQVcsT0FBTztDQUM3QixHQUFHLENBQUMsVUFBVSxPQUFPLENBQUM7Q0FDdEIsTUFBTSxTQUFBLGFBQWUscUJBQUEsYUFDYixhQUNILGtCQUFrQixTQUFTLFVBQVUsY0FBYyxXQUFXLGFBQWEsQ0FBQyxHQUM3RSxDQUFDLFFBQVEsQ0FDWCxTQUNNLFNBQVMsaUJBQWlCLFNBQzFCLFNBQVMsaUJBQWlCLENBQ2xDO0NBQ0EsTUFBTSxTQUFBLGFBQWUsYUFDbEIsV0FBVyxrQkFBa0I7RUFDNUIsU0FBUyxPQUFPLFdBQVcsYUFBYSxDQUFDLENBQUMsTUFBTSxJQUFJO0NBQ3RELEdBQ0EsQ0FBQyxRQUFRLENBQ1g7Q0FDQSxJQUFJLE9BQU8sU0FBUyxpQkFBaUIsU0FBUyxRQUFRLGNBQWMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxHQUNoRixNQUFNLE9BQU87Q0FFZixPQUFPO0VBQUUsR0FBRztFQUFRO0VBQVEsYUFBYSxPQUFPO0NBQU87QUFDekQ7OztBQ3ZDQSxTQUFTLGdCQUFnQixTQUFTO0NBQ2hDLE9BQU87QUFDVDs7O0FDRUEsU0FBUyxpQkFBaUIsU0FBUyxhQUFhO0NBQzlDLE9BQU8sYUFDTCxTQUNBLHVCQUNBLFdBQ0Y7QUFDRiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwLDQxLDQyLDQzXX0=