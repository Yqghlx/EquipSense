import { r as __require } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
//#region node_modules/@microsoft/signalr/dist/esm/Errors.js
/** Error thrown when an HTTP request fails. */
var HttpError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
	*
	* @param {string} errorMessage A descriptive error message.
	* @param {number} statusCode The HTTP status code represented by this error.
	*/
	constructor(errorMessage, statusCode) {
		const trueProto = new.target.prototype;
		super(`${errorMessage}: Status code '${statusCode}'`);
		this.statusCode = statusCode;
		this.__proto__ = trueProto;
	}
};
/** Error thrown when a timeout elapses. */
var TimeoutError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
	*
	* @param {string} errorMessage A descriptive error message.
	*/
	constructor(errorMessage = "A timeout occurred.") {
		const trueProto = new.target.prototype;
		super(errorMessage);
		this.__proto__ = trueProto;
	}
};
/** Error thrown when an action is aborted. */
var AbortError = class extends Error {
	/** Constructs a new instance of {@link AbortError}.
	*
	* @param {string} errorMessage A descriptive error message.
	*/
	constructor(errorMessage = "An abort occurred.") {
		const trueProto = new.target.prototype;
		super(errorMessage);
		this.__proto__ = trueProto;
	}
};
/** Error thrown when the selected transport is unsupported by the browser. */
/** @private */
var UnsupportedTransportError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
	*
	* @param {string} message A descriptive error message.
	* @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	*/
	constructor(message, transport) {
		const trueProto = new.target.prototype;
		super(message);
		this.transport = transport;
		this.errorType = "UnsupportedTransportError";
		this.__proto__ = trueProto;
	}
};
/** Error thrown when the selected transport is disabled by the browser. */
/** @private */
var DisabledTransportError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
	*
	* @param {string} message A descriptive error message.
	* @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	*/
	constructor(message, transport) {
		const trueProto = new.target.prototype;
		super(message);
		this.transport = transport;
		this.errorType = "DisabledTransportError";
		this.__proto__ = trueProto;
	}
};
/** Error thrown when the selected transport cannot be started. */
/** @private */
var FailedToStartTransportError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
	*
	* @param {string} message A descriptive error message.
	* @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	*/
	constructor(message, transport) {
		const trueProto = new.target.prototype;
		super(message);
		this.transport = transport;
		this.errorType = "FailedToStartTransportError";
		this.__proto__ = trueProto;
	}
};
/** Error thrown when the negotiation with the server failed to complete. */
/** @private */
var FailedToNegotiateWithServerError = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
	*
	* @param {string} message A descriptive error message.
	*/
	constructor(message) {
		const trueProto = new.target.prototype;
		super(message);
		this.errorType = "FailedToNegotiateWithServerError";
		this.__proto__ = trueProto;
	}
};
/** Error thrown when multiple errors have occurred. */
/** @private */
var AggregateErrors = class extends Error {
	/** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
	*
	* @param {string} message A descriptive error message.
	* @param {Error[]} innerErrors The collection of errors this error is aggregating.
	*/
	constructor(message, innerErrors) {
		const trueProto = new.target.prototype;
		super(message);
		this.innerErrors = innerErrors;
		this.__proto__ = trueProto;
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HttpClient.js
/** Represents an HTTP response. */
var HttpResponse = class {
	constructor(statusCode, statusText, content) {
		this.statusCode = statusCode;
		this.statusText = statusText;
		this.content = content;
	}
};
/** Abstraction over an HTTP client.
*
* This class provides an abstraction over an HTTP client so that a different implementation can be provided on different platforms.
*/
var HttpClient = class {
	get(url, options) {
		return this.send({
			...options,
			method: "GET",
			url
		});
	}
	post(url, options) {
		return this.send({
			...options,
			method: "POST",
			url
		});
	}
	delete(url, options) {
		return this.send({
			...options,
			method: "DELETE",
			url
		});
	}
	/** Gets all cookies that apply to the specified URL.
	*
	* @param url The URL that the cookies are valid for.
	* @returns {string} A string containing all the key-value cookie pairs for the specified URL.
	*/
	getCookieString(url) {
		return "";
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/ILogger.js
/** Indicates the severity of a log message.
*
* Log Levels are ordered in increasing severity. So `Debug` is more severe than `Trace`, etc.
*/
var LogLevel;
(function(LogLevel) {
	/** Log level for very low severity diagnostic messages. */
	LogLevel[LogLevel["Trace"] = 0] = "Trace";
	/** Log level for low severity diagnostic messages. */
	LogLevel[LogLevel["Debug"] = 1] = "Debug";
	/** Log level for informational diagnostic messages. */
	LogLevel[LogLevel["Information"] = 2] = "Information";
	/** Log level for diagnostic messages that indicate a non-fatal problem. */
	LogLevel[LogLevel["Warning"] = 3] = "Warning";
	/** Log level for diagnostic messages that indicate a failure in the current operation. */
	LogLevel[LogLevel["Error"] = 4] = "Error";
	/** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
	LogLevel[LogLevel["Critical"] = 5] = "Critical";
	/** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
	LogLevel[LogLevel["None"] = 6] = "None";
})(LogLevel || (LogLevel = {}));
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/Loggers.js
/** A logger that does nothing when log messages are sent to it. */
var NullLogger = class {
	constructor() {}
	/** @inheritDoc */
	log(_logLevel, _message) {}
};
/** The singleton instance of the {@link @microsoft/signalr.NullLogger}. */
NullLogger.instance = new NullLogger();
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/pkg-version.js
var VERSION = "10.0.0";
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/Utils.js
/** @private */
var Arg = class {
	static isRequired(val, name) {
		if (val === null || val === void 0) throw new Error(`The '${name}' argument is required.`);
	}
	static isNotEmpty(val, name) {
		if (!val || val.match(/^\s*$/)) throw new Error(`The '${name}' argument should not be empty.`);
	}
	static isIn(val, values, name) {
		if (!(val in values)) throw new Error(`Unknown ${name} value: ${val}.`);
	}
};
/** @private */
var Platform = class Platform {
	static get isBrowser() {
		return !Platform.isNode && typeof window === "object" && typeof window.document === "object";
	}
	static get isWebWorker() {
		return !Platform.isNode && typeof self === "object" && "importScripts" in self;
	}
	static get isReactNative() {
		return !Platform.isNode && typeof window === "object" && typeof window.document === "undefined";
	}
	static get isNode() {
		return typeof process !== "undefined" && process.release && process.release.name === "node";
	}
};
/** @private */
function getDataDetail(data, includeContent) {
	let detail = "";
	if (isArrayBuffer(data)) {
		detail = `Binary data of length ${data.byteLength}`;
		if (includeContent) detail += `. Content: '${formatArrayBuffer(data)}'`;
	} else if (typeof data === "string") {
		detail = `String data of length ${data.length}`;
		if (includeContent) detail += `. Content: '${data}'`;
	}
	return detail;
}
/** @private */
function formatArrayBuffer(data) {
	const view = new Uint8Array(data);
	let str = "";
	view.forEach((num) => {
		str += `0x${num < 16 ? "0" : ""}${num.toString(16)} `;
	});
	return str.substring(0, str.length - 1);
}
/** @private */
function isArrayBuffer(val) {
	return val && typeof ArrayBuffer !== "undefined" && (val instanceof ArrayBuffer || val.constructor && val.constructor.name === "ArrayBuffer");
}
/** @private */
async function sendMessage(logger, transportName, httpClient, url, content, options) {
	const headers = {};
	const [name, value] = getUserAgentHeader();
	headers[name] = value;
	logger.log(LogLevel.Trace, `(${transportName} transport) sending data. ${getDataDetail(content, options.logMessageContent)}.`);
	const responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
	const response = await httpClient.post(url, {
		content,
		headers: {
			...headers,
			...options.headers
		},
		responseType,
		timeout: options.timeout,
		withCredentials: options.withCredentials
	});
	logger.log(LogLevel.Trace, `(${transportName} transport) request complete. Response status: ${response.statusCode}.`);
}
/** @private */
function createLogger(logger) {
	if (logger === void 0) return new ConsoleLogger(LogLevel.Information);
	if (logger === null) return NullLogger.instance;
	if (logger.log !== void 0) return logger;
	return new ConsoleLogger(logger);
}
/** @private */
var SubjectSubscription = class {
	constructor(subject, observer) {
		this._subject = subject;
		this._observer = observer;
	}
	dispose() {
		const index = this._subject.observers.indexOf(this._observer);
		if (index > -1) this._subject.observers.splice(index, 1);
		if (this._subject.observers.length === 0 && this._subject.cancelCallback) this._subject.cancelCallback().catch((_) => {});
	}
};
/** @private */
var ConsoleLogger = class {
	constructor(minimumLogLevel) {
		this._minLevel = minimumLogLevel;
		this.out = console;
	}
	log(logLevel, message) {
		if (logLevel >= this._minLevel) {
			const msg = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${LogLevel[logLevel]}: ${message}`;
			switch (logLevel) {
				case LogLevel.Critical:
				case LogLevel.Error:
					this.out.error(msg);
					break;
				case LogLevel.Warning:
					this.out.warn(msg);
					break;
				case LogLevel.Information:
					this.out.info(msg);
					break;
				default: this.out.log(msg);
			}
		}
	}
};
/** @private */
function getUserAgentHeader() {
	let userAgentHeaderName = "X-SignalR-User-Agent";
	if (Platform.isNode) userAgentHeaderName = "User-Agent";
	return [userAgentHeaderName, constructUserAgent(VERSION, getOsName(), getRuntime(), getRuntimeVersion())];
}
/** @private */
function constructUserAgent(version, os, runtime, runtimeVersion) {
	let userAgent = "Microsoft SignalR/";
	const majorAndMinor = version.split(".");
	userAgent += `${majorAndMinor[0]}.${majorAndMinor[1]}`;
	userAgent += ` (${version}; `;
	if (os && os !== "") userAgent += `${os}; `;
	else userAgent += "Unknown OS; ";
	userAgent += `${runtime}`;
	if (runtimeVersion) userAgent += `; ${runtimeVersion}`;
	else userAgent += "; Unknown Runtime Version";
	userAgent += ")";
	return userAgent;
}
/*#__PURE__*/ function getOsName() {
	if (Platform.isNode) switch (process.platform) {
		case "win32": return "Windows NT";
		case "darwin": return "macOS";
		case "linux": return "Linux";
		default: return process.platform;
	}
	else return "";
}
/*#__PURE__*/ function getRuntimeVersion() {
	if (Platform.isNode) return process.versions.node;
}
function getRuntime() {
	if (Platform.isNode) return "NodeJS";
	else return "Browser";
}
/** @private */
function getErrorString(e) {
	if (e.stack) return e.stack;
	else if (e.message) return e.message;
	return `${e}`;
}
/** @private */
function getGlobalThis() {
	if (typeof globalThis !== "undefined") return globalThis;
	if (typeof self !== "undefined") return self;
	if (typeof window !== "undefined") return window;
	if (typeof global !== "undefined") return global;
	throw new Error("could not find global");
}
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/FetchHttpClient.js
var FetchHttpClient = class extends HttpClient {
	constructor(logger) {
		super();
		this._logger = logger;
		if (typeof fetch === "undefined" || Platform.isNode) {
			const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
			this._jar = new (requireFunc("tough-cookie")).CookieJar();
			if (typeof fetch === "undefined") this._fetchType = requireFunc("node-fetch");
			else this._fetchType = fetch;
			this._fetchType = requireFunc("fetch-cookie")(this._fetchType, this._jar);
		} else this._fetchType = fetch.bind(getGlobalThis());
		if (typeof AbortController === "undefined") {
			const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
			this._abortControllerType = requireFunc("abort-controller");
		} else this._abortControllerType = AbortController;
	}
	/** @inheritDoc */
	async send(request) {
		if (request.abortSignal && request.abortSignal.aborted) throw new AbortError();
		if (!request.method) throw new Error("No method defined.");
		if (!request.url) throw new Error("No url defined.");
		const abortController = new this._abortControllerType();
		let error;
		if (request.abortSignal) request.abortSignal.onabort = () => {
			abortController.abort();
			error = new AbortError();
		};
		let timeoutId = null;
		if (request.timeout) {
			const msTimeout = request.timeout;
			timeoutId = setTimeout(() => {
				abortController.abort();
				this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
				error = new TimeoutError();
			}, msTimeout);
		}
		if (request.content === "") request.content = void 0;
		if (request.content) {
			request.headers = request.headers || {};
			if (isArrayBuffer(request.content)) request.headers["Content-Type"] = "application/octet-stream";
			else request.headers["Content-Type"] = "text/plain;charset=UTF-8";
		}
		let response;
		try {
			response = await this._fetchType(request.url, {
				body: request.content,
				cache: "no-cache",
				credentials: request.withCredentials === true ? "include" : "same-origin",
				headers: {
					"X-Requested-With": "XMLHttpRequest",
					...request.headers
				},
				method: request.method,
				mode: "cors",
				redirect: "follow",
				signal: abortController.signal
			});
		} catch (e) {
			if (error) throw error;
			this._logger.log(LogLevel.Warning, `Error from HTTP request. ${e}.`);
			throw e;
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
			if (request.abortSignal) request.abortSignal.onabort = null;
		}
		if (!response.ok) throw new HttpError(await deserializeContent(response, "text") || response.statusText, response.status);
		const payload = await deserializeContent(response, request.responseType);
		return new HttpResponse(response.status, response.statusText, payload);
	}
	getCookieString(url) {
		let cookies = "";
		if (Platform.isNode && this._jar) this._jar.getCookies(url, (e, c) => cookies = c.join("; "));
		return cookies;
	}
};
function deserializeContent(response, responseType) {
	let content;
	switch (responseType) {
		case "arraybuffer":
			content = response.arrayBuffer();
			break;
		case "text":
			content = response.text();
			break;
		case "blob":
		case "document":
		case "json": throw new Error(`${responseType} is not supported.`);
		default: content = response.text();
	}
	return content;
}
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/XhrHttpClient.js
var XhrHttpClient = class extends HttpClient {
	constructor(logger) {
		super();
		this._logger = logger;
	}
	/** @inheritDoc */
	send(request) {
		if (request.abortSignal && request.abortSignal.aborted) return Promise.reject(new AbortError());
		if (!request.method) return Promise.reject(/* @__PURE__ */ new Error("No method defined."));
		if (!request.url) return Promise.reject(/* @__PURE__ */ new Error("No url defined."));
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open(request.method, request.url, true);
			xhr.withCredentials = request.withCredentials === void 0 ? true : request.withCredentials;
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			if (request.content === "") request.content = void 0;
			if (request.content) if (isArrayBuffer(request.content)) xhr.setRequestHeader("Content-Type", "application/octet-stream");
			else xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
			const headers = request.headers;
			if (headers) Object.keys(headers).forEach((header) => {
				xhr.setRequestHeader(header, headers[header]);
			});
			if (request.responseType) xhr.responseType = request.responseType;
			if (request.abortSignal) request.abortSignal.onabort = () => {
				xhr.abort();
				reject(new AbortError());
			};
			if (request.timeout) xhr.timeout = request.timeout;
			xhr.onload = () => {
				if (request.abortSignal) request.abortSignal.onabort = null;
				if (xhr.status >= 200 && xhr.status < 300) resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
				else reject(new HttpError(xhr.response || xhr.responseText || xhr.statusText, xhr.status));
			};
			xhr.onerror = () => {
				this._logger.log(LogLevel.Warning, `Error from HTTP request. ${xhr.status}: ${xhr.statusText}.`);
				reject(new HttpError(xhr.statusText, xhr.status));
			};
			xhr.ontimeout = () => {
				this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
				reject(new TimeoutError());
			};
			xhr.send(request.content);
		});
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/DefaultHttpClient.js
/** Default implementation of {@link @microsoft/signalr.HttpClient}. */
var DefaultHttpClient = class extends HttpClient {
	/** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
	constructor(logger) {
		super();
		if (typeof fetch !== "undefined" || Platform.isNode) this._httpClient = new FetchHttpClient(logger);
		else if (typeof XMLHttpRequest !== "undefined") this._httpClient = new XhrHttpClient(logger);
		else throw new Error("No usable HttpClient found.");
	}
	/** @inheritDoc */
	send(request) {
		if (request.abortSignal && request.abortSignal.aborted) return Promise.reject(new AbortError());
		if (!request.method) return Promise.reject(/* @__PURE__ */ new Error("No method defined."));
		if (!request.url) return Promise.reject(/* @__PURE__ */ new Error("No url defined."));
		return this._httpClient.send(request);
	}
	getCookieString(url) {
		return this._httpClient.getCookieString(url);
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/TextMessageFormat.js
/** @private */
var TextMessageFormat = class TextMessageFormat {
	static write(output) {
		return `${output}${TextMessageFormat.RecordSeparator}`;
	}
	static parse(input) {
		if (input[input.length - 1] !== TextMessageFormat.RecordSeparator) throw new Error("Message is incomplete.");
		const messages = input.split(TextMessageFormat.RecordSeparator);
		messages.pop();
		return messages;
	}
};
TextMessageFormat.RecordSeparatorCode = 30;
TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HandshakeProtocol.js
/** @private */
var HandshakeProtocol = class {
	writeHandshakeRequest(handshakeRequest) {
		return TextMessageFormat.write(JSON.stringify(handshakeRequest));
	}
	parseHandshakeResponse(data) {
		let messageData;
		let remainingData;
		if (isArrayBuffer(data)) {
			const binaryData = new Uint8Array(data);
			const separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
			if (separatorIndex === -1) throw new Error("Message is incomplete.");
			const responseLength = separatorIndex + 1;
			messageData = String.fromCharCode.apply(null, Array.prototype.slice.call(binaryData.slice(0, responseLength)));
			remainingData = binaryData.byteLength > responseLength ? binaryData.slice(responseLength).buffer : null;
		} else {
			const textData = data;
			const separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
			if (separatorIndex === -1) throw new Error("Message is incomplete.");
			const responseLength = separatorIndex + 1;
			messageData = textData.substring(0, responseLength);
			remainingData = textData.length > responseLength ? textData.substring(responseLength) : null;
		}
		const messages = TextMessageFormat.parse(messageData);
		const response = JSON.parse(messages[0]);
		if (response.type) throw new Error("Expected a handshake response from the server.");
		return [remainingData, response];
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/IHubProtocol.js
/** Defines the type of a Hub Message. */
var MessageType;
(function(MessageType) {
	/** Indicates the message is an Invocation message and implements the {@link @microsoft/signalr.InvocationMessage} interface. */
	MessageType[MessageType["Invocation"] = 1] = "Invocation";
	/** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
	MessageType[MessageType["StreamItem"] = 2] = "StreamItem";
	/** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
	MessageType[MessageType["Completion"] = 3] = "Completion";
	/** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
	MessageType[MessageType["StreamInvocation"] = 4] = "StreamInvocation";
	/** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
	MessageType[MessageType["CancelInvocation"] = 5] = "CancelInvocation";
	/** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
	MessageType[MessageType["Ping"] = 6] = "Ping";
	/** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
	MessageType[MessageType["Close"] = 7] = "Close";
	MessageType[MessageType["Ack"] = 8] = "Ack";
	MessageType[MessageType["Sequence"] = 9] = "Sequence";
})(MessageType || (MessageType = {}));
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/Subject.js
/** Stream implementation to stream items to the server. */
var Subject = class {
	constructor() {
		this.observers = [];
	}
	next(item) {
		for (const observer of this.observers) observer.next(item);
	}
	error(err) {
		for (const observer of this.observers) if (observer.error) observer.error(err);
	}
	complete() {
		for (const observer of this.observers) if (observer.complete) observer.complete();
	}
	subscribe(observer) {
		this.observers.push(observer);
		return new SubjectSubscription(this, observer);
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/MessageBuffer.js
/** @private */
var MessageBuffer = class {
	constructor(protocol, connection, bufferSize) {
		this._bufferSize = 1e5;
		this._messages = [];
		this._totalMessageCount = 0;
		this._waitForSequenceMessage = false;
		this._nextReceivingSequenceId = 1;
		this._latestReceivedSequenceId = 0;
		this._bufferedByteCount = 0;
		this._reconnectInProgress = false;
		this._protocol = protocol;
		this._connection = connection;
		this._bufferSize = bufferSize;
	}
	async _send(message) {
		const serializedMessage = this._protocol.writeMessage(message);
		let backpressurePromise = Promise.resolve();
		if (this._isInvocationMessage(message)) {
			this._totalMessageCount++;
			let backpressurePromiseResolver = () => {};
			let backpressurePromiseRejector = () => {};
			if (isArrayBuffer(serializedMessage)) this._bufferedByteCount += serializedMessage.byteLength;
			else this._bufferedByteCount += serializedMessage.length;
			if (this._bufferedByteCount >= this._bufferSize) backpressurePromise = new Promise((resolve, reject) => {
				backpressurePromiseResolver = resolve;
				backpressurePromiseRejector = reject;
			});
			this._messages.push(new BufferedItem(serializedMessage, this._totalMessageCount, backpressurePromiseResolver, backpressurePromiseRejector));
		}
		try {
			if (!this._reconnectInProgress) await this._connection.send(serializedMessage);
		} catch {
			this._disconnected();
		}
		await backpressurePromise;
	}
	_ack(ackMessage) {
		let newestAckedMessage = -1;
		for (let index = 0; index < this._messages.length; index++) {
			const element = this._messages[index];
			if (element._id <= ackMessage.sequenceId) {
				newestAckedMessage = index;
				if (isArrayBuffer(element._message)) this._bufferedByteCount -= element._message.byteLength;
				else this._bufferedByteCount -= element._message.length;
				element._resolver();
			} else if (this._bufferedByteCount < this._bufferSize) element._resolver();
			else break;
		}
		if (newestAckedMessage !== -1) this._messages = this._messages.slice(newestAckedMessage + 1);
	}
	_shouldProcessMessage(message) {
		if (this._waitForSequenceMessage) if (message.type !== MessageType.Sequence) return false;
		else {
			this._waitForSequenceMessage = false;
			return true;
		}
		if (!this._isInvocationMessage(message)) return true;
		const currentId = this._nextReceivingSequenceId;
		this._nextReceivingSequenceId++;
		if (currentId <= this._latestReceivedSequenceId) {
			if (currentId === this._latestReceivedSequenceId) this._ackTimer();
			return false;
		}
		this._latestReceivedSequenceId = currentId;
		this._ackTimer();
		return true;
	}
	_resetSequence(message) {
		if (message.sequenceId > this._nextReceivingSequenceId) {
			this._connection.stop(/* @__PURE__ */ new Error("Sequence ID greater than amount of messages we've received."));
			return;
		}
		this._nextReceivingSequenceId = message.sequenceId;
	}
	_disconnected() {
		this._reconnectInProgress = true;
		this._waitForSequenceMessage = true;
	}
	async _resend() {
		const sequenceId = this._messages.length !== 0 ? this._messages[0]._id : this._totalMessageCount + 1;
		await this._connection.send(this._protocol.writeMessage({
			type: MessageType.Sequence,
			sequenceId
		}));
		const messages = this._messages;
		for (const element of messages) await this._connection.send(element._message);
		this._reconnectInProgress = false;
	}
	_dispose(error) {
		error !== null && error !== void 0 || (error = /* @__PURE__ */ new Error("Unable to reconnect to server."));
		for (const element of this._messages) element._rejector(error);
	}
	_isInvocationMessage(message) {
		switch (message.type) {
			case MessageType.Invocation:
			case MessageType.StreamItem:
			case MessageType.Completion:
			case MessageType.StreamInvocation:
			case MessageType.CancelInvocation: return true;
			case MessageType.Close:
			case MessageType.Sequence:
			case MessageType.Ping:
			case MessageType.Ack: return false;
		}
	}
	_ackTimer() {
		if (this._ackTimerHandle === void 0) this._ackTimerHandle = setTimeout(async () => {
			try {
				if (!this._reconnectInProgress) await this._connection.send(this._protocol.writeMessage({
					type: MessageType.Ack,
					sequenceId: this._latestReceivedSequenceId
				}));
			} catch {}
			clearTimeout(this._ackTimerHandle);
			this._ackTimerHandle = void 0;
		}, 1e3);
	}
};
var BufferedItem = class {
	constructor(message, id, resolver, rejector) {
		this._message = message;
		this._id = id;
		this._resolver = resolver;
		this._rejector = rejector;
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HubConnection.js
var DEFAULT_TIMEOUT_IN_MS = 3e4;
var DEFAULT_PING_INTERVAL_IN_MS = 15e3;
var DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE = 1e5;
/** Describes the current state of the {@link HubConnection} to the server. */
var HubConnectionState;
(function(HubConnectionState) {
	/** The hub connection is disconnected. */
	HubConnectionState["Disconnected"] = "Disconnected";
	/** The hub connection is connecting. */
	HubConnectionState["Connecting"] = "Connecting";
	/** The hub connection is connected. */
	HubConnectionState["Connected"] = "Connected";
	/** The hub connection is disconnecting. */
	HubConnectionState["Disconnecting"] = "Disconnecting";
	/** The hub connection is reconnecting. */
	HubConnectionState["Reconnecting"] = "Reconnecting";
})(HubConnectionState || (HubConnectionState = {}));
/** Represents a connection to a SignalR Hub. */
var HubConnection = class HubConnection {
	/** @internal */
	static create(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
		return new HubConnection(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize);
	}
	constructor(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
		this._nextKeepAlive = 0;
		this._freezeEventListener = () => {
			this._logger.log(LogLevel.Warning, "The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep");
		};
		Arg.isRequired(connection, "connection");
		Arg.isRequired(logger, "logger");
		Arg.isRequired(protocol, "protocol");
		this.serverTimeoutInMilliseconds = serverTimeoutInMilliseconds !== null && serverTimeoutInMilliseconds !== void 0 ? serverTimeoutInMilliseconds : DEFAULT_TIMEOUT_IN_MS;
		this.keepAliveIntervalInMilliseconds = keepAliveIntervalInMilliseconds !== null && keepAliveIntervalInMilliseconds !== void 0 ? keepAliveIntervalInMilliseconds : DEFAULT_PING_INTERVAL_IN_MS;
		this._statefulReconnectBufferSize = statefulReconnectBufferSize !== null && statefulReconnectBufferSize !== void 0 ? statefulReconnectBufferSize : DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE;
		this._logger = logger;
		this._protocol = protocol;
		this.connection = connection;
		this._reconnectPolicy = reconnectPolicy;
		this._handshakeProtocol = new HandshakeProtocol();
		this.connection.onreceive = (data) => this._processIncomingData(data);
		this.connection.onclose = (error) => this._connectionClosed(error);
		this._callbacks = {};
		this._methods = {};
		this._closedCallbacks = [];
		this._reconnectingCallbacks = [];
		this._reconnectedCallbacks = [];
		this._invocationId = 0;
		this._receivedHandshakeResponse = false;
		this._connectionState = HubConnectionState.Disconnected;
		this._connectionStarted = false;
		this._cachedPingMessage = this._protocol.writeMessage({ type: MessageType.Ping });
	}
	/** Indicates the state of the {@link HubConnection} to the server. */
	get state() {
		return this._connectionState;
	}
	/** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
	*  in the disconnected state or if the negotiation step was skipped.
	*/
	get connectionId() {
		return this.connection ? this.connection.connectionId || null : null;
	}
	/** Indicates the url of the {@link HubConnection} to the server. */
	get baseUrl() {
		return this.connection.baseUrl || "";
	}
	/**
	* Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
	* Reconnecting states.
	* @param {string} url The url to connect to.
	*/
	set baseUrl(url) {
		if (this._connectionState !== HubConnectionState.Disconnected && this._connectionState !== HubConnectionState.Reconnecting) throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
		if (!url) throw new Error("The HubConnection url must be a valid url.");
		this.connection.baseUrl = url;
	}
	/** Starts the connection.
	*
	* @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
	*/
	start() {
		this._startPromise = this._startWithStateTransitions();
		return this._startPromise;
	}
	async _startWithStateTransitions() {
		if (this._connectionState !== HubConnectionState.Disconnected) return Promise.reject(/* @__PURE__ */ new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
		this._connectionState = HubConnectionState.Connecting;
		this._logger.log(LogLevel.Debug, "Starting HubConnection.");
		try {
			await this._startInternal();
			if (Platform.isBrowser) window.document.addEventListener("freeze", this._freezeEventListener);
			this._connectionState = HubConnectionState.Connected;
			this._connectionStarted = true;
			this._logger.log(LogLevel.Debug, "HubConnection connected successfully.");
		} catch (e) {
			this._connectionState = HubConnectionState.Disconnected;
			this._logger.log(LogLevel.Debug, `HubConnection failed to start successfully because of error '${e}'.`);
			return Promise.reject(e);
		}
	}
	async _startInternal() {
		this._stopDuringStartError = void 0;
		this._receivedHandshakeResponse = false;
		const handshakePromise = new Promise((resolve, reject) => {
			this._handshakeResolver = resolve;
			this._handshakeRejecter = reject;
		});
		await this.connection.start(this._protocol.transferFormat);
		try {
			let version = this._protocol.version;
			if (!this.connection.features.reconnect) version = 1;
			const handshakeRequest = {
				protocol: this._protocol.name,
				version
			};
			this._logger.log(LogLevel.Debug, "Sending handshake request.");
			await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(handshakeRequest));
			this._logger.log(LogLevel.Information, `Using HubProtocol '${this._protocol.name}'.`);
			this._cleanupTimeout();
			this._resetTimeoutPeriod();
			this._resetKeepAliveInterval();
			await handshakePromise;
			if (this._stopDuringStartError) throw this._stopDuringStartError;
			if (this.connection.features.reconnect || false) {
				this._messageBuffer = new MessageBuffer(this._protocol, this.connection, this._statefulReconnectBufferSize);
				this.connection.features.disconnected = this._messageBuffer._disconnected.bind(this._messageBuffer);
				this.connection.features.resend = () => {
					if (this._messageBuffer) return this._messageBuffer._resend();
				};
			}
			if (!this.connection.features.inherentKeepAlive) await this._sendMessage(this._cachedPingMessage);
		} catch (e) {
			this._logger.log(LogLevel.Debug, `Hub handshake failed with error '${e}' during start(). Stopping HubConnection.`);
			this._cleanupTimeout();
			this._cleanupPingTimer();
			await this.connection.stop(e);
			throw e;
		}
	}
	/** Stops the connection.
	*
	* @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
	*/
	async stop() {
		const startPromise = this._startPromise;
		this.connection.features.reconnect = false;
		this._stopPromise = this._stopInternal();
		await this._stopPromise;
		try {
			await startPromise;
		} catch (e) {}
	}
	_stopInternal(error) {
		if (this._connectionState === HubConnectionState.Disconnected) {
			this._logger.log(LogLevel.Debug, `Call to HubConnection.stop(${error}) ignored because it is already in the disconnected state.`);
			return Promise.resolve();
		}
		if (this._connectionState === HubConnectionState.Disconnecting) {
			this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
			return this._stopPromise;
		}
		const state = this._connectionState;
		this._connectionState = HubConnectionState.Disconnecting;
		this._logger.log(LogLevel.Debug, "Stopping HubConnection.");
		if (this._reconnectDelayHandle) {
			this._logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
			clearTimeout(this._reconnectDelayHandle);
			this._reconnectDelayHandle = void 0;
			this._completeClose();
			return Promise.resolve();
		}
		if (state === HubConnectionState.Connected) this._sendCloseMessage();
		this._cleanupTimeout();
		this._cleanupPingTimer();
		this._stopDuringStartError = error || new AbortError("The connection was stopped before the hub handshake could complete.");
		return this.connection.stop(error);
	}
	async _sendCloseMessage() {
		try {
			await this._sendWithProtocol(this._createCloseMessage());
		} catch {}
	}
	/** Invokes a streaming hub method on the server using the specified name and arguments.
	*
	* @typeparam T The type of the items returned by the server.
	* @param {string} methodName The name of the server method to invoke.
	* @param {any[]} args The arguments used to invoke the server method.
	* @returns {IStreamResult<T>} An object that yields results from the server as they are received.
	*/
	stream(methodName, ...args) {
		const [streams, streamIds] = this._replaceStreamingParams(args);
		const invocationDescriptor = this._createStreamInvocation(methodName, args, streamIds);
		let promiseQueue;
		const subject = new Subject();
		subject.cancelCallback = () => {
			const cancelInvocation = this._createCancelInvocation(invocationDescriptor.invocationId);
			delete this._callbacks[invocationDescriptor.invocationId];
			return promiseQueue.then(() => {
				return this._sendWithProtocol(cancelInvocation);
			});
		};
		this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
			if (error) {
				subject.error(error);
				return;
			} else if (invocationEvent) if (invocationEvent.type === MessageType.Completion) if (invocationEvent.error) subject.error(new Error(invocationEvent.error));
			else subject.complete();
			else subject.next(invocationEvent.item);
		};
		promiseQueue = this._sendWithProtocol(invocationDescriptor).catch((e) => {
			subject.error(e);
			delete this._callbacks[invocationDescriptor.invocationId];
		});
		this._launchStreams(streams, promiseQueue);
		return subject;
	}
	_sendMessage(message) {
		this._resetKeepAliveInterval();
		return this.connection.send(message);
	}
	/**
	* Sends a js object to the server.
	* @param message The js object to serialize and send.
	*/
	_sendWithProtocol(message) {
		if (this._messageBuffer) return this._messageBuffer._send(message);
		else return this._sendMessage(this._protocol.writeMessage(message));
	}
	/** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
	*
	* The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
	* be processing the invocation.
	*
	* @param {string} methodName The name of the server method to invoke.
	* @param {any[]} args The arguments used to invoke the server method.
	* @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
	*/
	send(methodName, ...args) {
		const [streams, streamIds] = this._replaceStreamingParams(args);
		const sendPromise = this._sendWithProtocol(this._createInvocation(methodName, args, true, streamIds));
		this._launchStreams(streams, sendPromise);
		return sendPromise;
	}
	/** Invokes a hub method on the server using the specified name and arguments.
	*
	* The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
	* resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
	* resolving the Promise.
	*
	* @typeparam T The expected return type.
	* @param {string} methodName The name of the server method to invoke.
	* @param {any[]} args The arguments used to invoke the server method.
	* @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
	*/
	invoke(methodName, ...args) {
		const [streams, streamIds] = this._replaceStreamingParams(args);
		const invocationDescriptor = this._createInvocation(methodName, args, false, streamIds);
		return new Promise((resolve, reject) => {
			this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
				if (error) {
					reject(error);
					return;
				} else if (invocationEvent) if (invocationEvent.type === MessageType.Completion) if (invocationEvent.error) reject(new Error(invocationEvent.error));
				else resolve(invocationEvent.result);
				else reject(/* @__PURE__ */ new Error(`Unexpected message type: ${invocationEvent.type}`));
			};
			const promiseQueue = this._sendWithProtocol(invocationDescriptor).catch((e) => {
				reject(e);
				delete this._callbacks[invocationDescriptor.invocationId];
			});
			this._launchStreams(streams, promiseQueue);
		});
	}
	on(methodName, newMethod) {
		if (!methodName || !newMethod) return;
		methodName = methodName.toLowerCase();
		if (!this._methods[methodName]) this._methods[methodName] = [];
		if (this._methods[methodName].indexOf(newMethod) !== -1) return;
		this._methods[methodName].push(newMethod);
	}
	off(methodName, method) {
		if (!methodName) return;
		methodName = methodName.toLowerCase();
		const handlers = this._methods[methodName];
		if (!handlers) return;
		if (method) {
			const removeIdx = handlers.indexOf(method);
			if (removeIdx !== -1) {
				handlers.splice(removeIdx, 1);
				if (handlers.length === 0) delete this._methods[methodName];
			}
		} else delete this._methods[methodName];
	}
	/** Registers a handler that will be invoked when the connection is closed.
	*
	* @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
	*/
	onclose(callback) {
		if (callback) this._closedCallbacks.push(callback);
	}
	/** Registers a handler that will be invoked when the connection starts reconnecting.
	*
	* @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
	*/
	onreconnecting(callback) {
		if (callback) this._reconnectingCallbacks.push(callback);
	}
	/** Registers a handler that will be invoked when the connection successfully reconnects.
	*
	* @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
	*/
	onreconnected(callback) {
		if (callback) this._reconnectedCallbacks.push(callback);
	}
	_processIncomingData(data) {
		this._cleanupTimeout();
		if (!this._receivedHandshakeResponse) {
			data = this._processHandshakeResponse(data);
			this._receivedHandshakeResponse = true;
		}
		if (data) {
			const messages = this._protocol.parseMessages(data, this._logger);
			for (const message of messages) {
				if (this._messageBuffer && !this._messageBuffer._shouldProcessMessage(message)) continue;
				switch (message.type) {
					case MessageType.Invocation:
						this._invokeClientMethod(message).catch((e) => {
							this._logger.log(LogLevel.Error, `Invoke client method threw error: ${getErrorString(e)}`);
						});
						break;
					case MessageType.StreamItem:
					case MessageType.Completion: {
						const callback = this._callbacks[message.invocationId];
						if (callback) {
							if (message.type === MessageType.Completion) delete this._callbacks[message.invocationId];
							try {
								callback(message);
							} catch (e) {
								this._logger.log(LogLevel.Error, `Stream callback threw error: ${getErrorString(e)}`);
							}
						}
						break;
					}
					case MessageType.Ping: break;
					case MessageType.Close: {
						this._logger.log(LogLevel.Information, "Close message received from server.");
						const error = message.error ? /* @__PURE__ */ new Error("Server returned an error on close: " + message.error) : void 0;
						if (message.allowReconnect === true) this.connection.stop(error);
						else this._stopPromise = this._stopInternal(error);
						break;
					}
					case MessageType.Ack:
						if (this._messageBuffer) this._messageBuffer._ack(message);
						break;
					case MessageType.Sequence:
						if (this._messageBuffer) this._messageBuffer._resetSequence(message);
						break;
					default: this._logger.log(LogLevel.Warning, `Invalid message type: ${message.type}.`);
				}
			}
		}
		this._resetTimeoutPeriod();
	}
	_processHandshakeResponse(data) {
		let responseMessage;
		let remainingData;
		try {
			[remainingData, responseMessage] = this._handshakeProtocol.parseHandshakeResponse(data);
		} catch (e) {
			const message = "Error parsing handshake response: " + e;
			this._logger.log(LogLevel.Error, message);
			const error = new Error(message);
			this._handshakeRejecter(error);
			throw error;
		}
		if (responseMessage.error) {
			const message = "Server returned handshake error: " + responseMessage.error;
			this._logger.log(LogLevel.Error, message);
			const error = new Error(message);
			this._handshakeRejecter(error);
			throw error;
		} else this._logger.log(LogLevel.Debug, "Server handshake complete.");
		this._handshakeResolver();
		return remainingData;
	}
	_resetKeepAliveInterval() {
		if (this.connection.features.inherentKeepAlive) return;
		this._nextKeepAlive = (/* @__PURE__ */ new Date()).getTime() + this.keepAliveIntervalInMilliseconds;
		this._cleanupPingTimer();
	}
	_resetTimeoutPeriod() {
		if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
			this._timeoutHandle = setTimeout(() => this.serverTimeout(), this.serverTimeoutInMilliseconds);
			let nextPing = this._nextKeepAlive - (/* @__PURE__ */ new Date()).getTime();
			if (nextPing < 0) {
				if (this._connectionState === HubConnectionState.Connected) this._trySendPingMessage();
				return;
			}
			if (this._pingServerHandle === void 0) {
				if (nextPing < 0) nextPing = 0;
				this._pingServerHandle = setTimeout(async () => {
					if (this._connectionState === HubConnectionState.Connected) await this._trySendPingMessage();
				}, nextPing);
			}
		}
	}
	serverTimeout() {
		this.connection.stop(/* @__PURE__ */ new Error("Server timeout elapsed without receiving a message from the server."));
	}
	async _invokeClientMethod(invocationMessage) {
		const methodName = invocationMessage.target.toLowerCase();
		const methods = this._methods[methodName];
		if (!methods) {
			this._logger.log(LogLevel.Warning, `No client method with the name '${methodName}' found.`);
			if (invocationMessage.invocationId) {
				this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
				await this._sendWithProtocol(this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null));
			}
			return;
		}
		const methodsCopy = methods.slice();
		const expectsResponse = invocationMessage.invocationId ? true : false;
		let res;
		let exception;
		let completionMessage;
		for (const m of methodsCopy) try {
			const prevRes = res;
			res = await m.apply(this, invocationMessage.arguments);
			if (expectsResponse && res && prevRes) {
				this._logger.log(LogLevel.Error, `Multiple results provided for '${methodName}'. Sending error to server.`);
				completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `Client provided multiple results.`, null);
			}
			exception = void 0;
		} catch (e) {
			exception = e;
			this._logger.log(LogLevel.Error, `A callback for the method '${methodName}' threw error '${e}'.`);
		}
		if (completionMessage) await this._sendWithProtocol(completionMessage);
		else if (expectsResponse) {
			if (exception) completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `${exception}`, null);
			else if (res !== void 0) completionMessage = this._createCompletionMessage(invocationMessage.invocationId, null, res);
			else {
				this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
				completionMessage = this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null);
			}
			await this._sendWithProtocol(completionMessage);
		} else if (res) this._logger.log(LogLevel.Error, `Result given for '${methodName}' method but server is not expecting a result.`);
	}
	_connectionClosed(error) {
		this._logger.log(LogLevel.Debug, `HubConnection.connectionClosed(${error}) called while in state ${this._connectionState}.`);
		this._stopDuringStartError = this._stopDuringStartError || error || new AbortError("The underlying connection was closed before the hub handshake could complete.");
		if (this._handshakeResolver) this._handshakeResolver();
		this._cancelCallbacksWithError(error || /* @__PURE__ */ new Error("Invocation canceled due to the underlying connection being closed."));
		this._cleanupTimeout();
		this._cleanupPingTimer();
		if (this._connectionState === HubConnectionState.Disconnecting) this._completeClose(error);
		else if (this._connectionState === HubConnectionState.Connected && this._reconnectPolicy) this._reconnect(error);
		else if (this._connectionState === HubConnectionState.Connected) this._completeClose(error);
	}
	_completeClose(error) {
		if (this._connectionStarted) {
			this._connectionState = HubConnectionState.Disconnected;
			this._connectionStarted = false;
			if (this._messageBuffer) {
				this._messageBuffer._dispose(error !== null && error !== void 0 ? error : /* @__PURE__ */ new Error("Connection closed."));
				this._messageBuffer = void 0;
			}
			if (Platform.isBrowser) window.document.removeEventListener("freeze", this._freezeEventListener);
			try {
				this._closedCallbacks.forEach((c) => c.apply(this, [error]));
			} catch (e) {
				this._logger.log(LogLevel.Error, `An onclose callback called with error '${error}' threw error '${e}'.`);
			}
		}
	}
	async _reconnect(error) {
		const reconnectStartTime = Date.now();
		let previousReconnectAttempts = 0;
		let retryError = error !== void 0 ? error : /* @__PURE__ */ new Error("Attempting to reconnect due to a unknown error.");
		let nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts, 0, retryError);
		if (nextRetryDelay === null) {
			this._logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
			this._completeClose(error);
			return;
		}
		this._connectionState = HubConnectionState.Reconnecting;
		if (error) this._logger.log(LogLevel.Information, `Connection reconnecting because of error '${error}'.`);
		else this._logger.log(LogLevel.Information, "Connection reconnecting.");
		if (this._reconnectingCallbacks.length !== 0) {
			try {
				this._reconnectingCallbacks.forEach((c) => c.apply(this, [error]));
			} catch (e) {
				this._logger.log(LogLevel.Error, `An onreconnecting callback called with error '${error}' threw error '${e}'.`);
			}
			if (this._connectionState !== HubConnectionState.Reconnecting) {
				this._logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
				return;
			}
		}
		while (nextRetryDelay !== null) {
			this._logger.log(LogLevel.Information, `Reconnect attempt number ${previousReconnectAttempts + 1} will start in ${nextRetryDelay} ms.`);
			await new Promise((resolve) => {
				this._reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
			});
			this._reconnectDelayHandle = void 0;
			if (this._connectionState !== HubConnectionState.Reconnecting) {
				this._logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
				return;
			}
			try {
				await this._startInternal();
				this._connectionState = HubConnectionState.Connected;
				this._logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
				if (this._reconnectedCallbacks.length !== 0) try {
					this._reconnectedCallbacks.forEach((c) => c.apply(this, [this.connection.connectionId]));
				} catch (e) {
					this._logger.log(LogLevel.Error, `An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${e}'.`);
				}
				return;
			} catch (e) {
				this._logger.log(LogLevel.Information, `Reconnect attempt failed because of error '${e}'.`);
				if (this._connectionState !== HubConnectionState.Reconnecting) {
					this._logger.log(LogLevel.Debug, `Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`);
					if (this._connectionState === HubConnectionState.Disconnecting) this._completeClose();
					return;
				}
				previousReconnectAttempts++;
				retryError = e instanceof Error ? e : new Error(e.toString());
				nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts, Date.now() - reconnectStartTime, retryError);
			}
		}
		this._logger.log(LogLevel.Information, `Reconnect retries have been exhausted after ${Date.now() - reconnectStartTime} ms and ${previousReconnectAttempts} failed attempts. Connection disconnecting.`);
		this._completeClose();
	}
	_getNextRetryDelay(previousRetryCount, elapsedMilliseconds, retryReason) {
		try {
			return this._reconnectPolicy.nextRetryDelayInMilliseconds({
				elapsedMilliseconds,
				previousRetryCount,
				retryReason
			});
		} catch (e) {
			this._logger.log(LogLevel.Error, `IRetryPolicy.nextRetryDelayInMilliseconds(${previousRetryCount}, ${elapsedMilliseconds}) threw error '${e}'.`);
			return null;
		}
	}
	_cancelCallbacksWithError(error) {
		const callbacks = this._callbacks;
		this._callbacks = {};
		Object.keys(callbacks).forEach((key) => {
			const callback = callbacks[key];
			try {
				callback(null, error);
			} catch (e) {
				this._logger.log(LogLevel.Error, `Stream 'error' callback called with '${error}' threw error: ${getErrorString(e)}`);
			}
		});
	}
	_cleanupPingTimer() {
		if (this._pingServerHandle) {
			clearTimeout(this._pingServerHandle);
			this._pingServerHandle = void 0;
		}
	}
	_cleanupTimeout() {
		if (this._timeoutHandle) clearTimeout(this._timeoutHandle);
	}
	_createInvocation(methodName, args, nonblocking, streamIds) {
		if (nonblocking) if (streamIds.length !== 0) return {
			target: methodName,
			arguments: args,
			streamIds,
			type: MessageType.Invocation
		};
		else return {
			target: methodName,
			arguments: args,
			type: MessageType.Invocation
		};
		else {
			const invocationId = this._invocationId;
			this._invocationId++;
			if (streamIds.length !== 0) return {
				target: methodName,
				arguments: args,
				invocationId: invocationId.toString(),
				streamIds,
				type: MessageType.Invocation
			};
			else return {
				target: methodName,
				arguments: args,
				invocationId: invocationId.toString(),
				type: MessageType.Invocation
			};
		}
	}
	_launchStreams(streams, promiseQueue) {
		if (streams.length === 0) return;
		if (!promiseQueue) promiseQueue = Promise.resolve();
		for (const streamId in streams) streams[streamId].subscribe({
			complete: () => {
				promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId)));
			},
			error: (err) => {
				let message;
				if (err instanceof Error) message = err.message;
				else if (err && err.toString) message = err.toString();
				else message = "Unknown error";
				promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId, message)));
			},
			next: (item) => {
				promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createStreamItemMessage(streamId, item)));
			}
		});
	}
	_replaceStreamingParams(args) {
		const streams = [];
		const streamIds = [];
		for (let i = 0; i < args.length; i++) {
			const argument = args[i];
			if (this._isObservable(argument)) {
				const streamId = this._invocationId;
				this._invocationId++;
				streams[streamId] = argument;
				streamIds.push(streamId.toString());
				args.splice(i, 1);
			}
		}
		return [streams, streamIds];
	}
	_isObservable(arg) {
		return arg && arg.subscribe && typeof arg.subscribe === "function";
	}
	_createStreamInvocation(methodName, args, streamIds) {
		const invocationId = this._invocationId;
		this._invocationId++;
		if (streamIds.length !== 0) return {
			target: methodName,
			arguments: args,
			invocationId: invocationId.toString(),
			streamIds,
			type: MessageType.StreamInvocation
		};
		else return {
			target: methodName,
			arguments: args,
			invocationId: invocationId.toString(),
			type: MessageType.StreamInvocation
		};
	}
	_createCancelInvocation(id) {
		return {
			invocationId: id,
			type: MessageType.CancelInvocation
		};
	}
	_createStreamItemMessage(id, item) {
		return {
			invocationId: id,
			item,
			type: MessageType.StreamItem
		};
	}
	_createCompletionMessage(id, error, result) {
		if (error) return {
			error,
			invocationId: id,
			type: MessageType.Completion
		};
		return {
			invocationId: id,
			result,
			type: MessageType.Completion
		};
	}
	_createCloseMessage() {
		return { type: MessageType.Close };
	}
	async _trySendPingMessage() {
		try {
			await this._sendMessage(this._cachedPingMessage);
		} catch {
			this._cleanupPingTimer();
		}
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/DefaultReconnectPolicy.js
var DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [
	0,
	2e3,
	1e4,
	3e4,
	null
];
/** @private */
var DefaultReconnectPolicy = class {
	constructor(retryDelays) {
		this._retryDelays = retryDelays !== void 0 ? [...retryDelays, null] : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
	}
	nextRetryDelayInMilliseconds(retryContext) {
		return this._retryDelays[retryContext.previousRetryCount];
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HeaderNames.js
var HeaderNames = class {};
HeaderNames.Authorization = "Authorization";
HeaderNames.Cookie = "Cookie";
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/AccessTokenHttpClient.js
/** @private */
var AccessTokenHttpClient = class extends HttpClient {
	constructor(innerClient, accessTokenFactory) {
		super();
		this._innerClient = innerClient;
		this._accessTokenFactory = accessTokenFactory;
	}
	async send(request) {
		let allowRetry = true;
		if (this._accessTokenFactory && (!this._accessToken || request.url && request.url.indexOf("/negotiate?") > 0)) {
			allowRetry = false;
			this._accessToken = await this._accessTokenFactory();
		}
		this._setAuthorizationHeader(request);
		const response = await this._innerClient.send(request);
		if (allowRetry && response.statusCode === 401 && this._accessTokenFactory) {
			this._accessToken = await this._accessTokenFactory();
			this._setAuthorizationHeader(request);
			return await this._innerClient.send(request);
		}
		return response;
	}
	_setAuthorizationHeader(request) {
		if (!request.headers) request.headers = {};
		if (this._accessToken) request.headers[HeaderNames.Authorization] = `Bearer ${this._accessToken}`;
		else if (this._accessTokenFactory) {
			if (request.headers[HeaderNames.Authorization]) delete request.headers[HeaderNames.Authorization];
		}
	}
	getCookieString(url) {
		return this._innerClient.getCookieString(url);
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/ITransport.js
/** Specifies a specific HTTP transport type. */
var HttpTransportType;
(function(HttpTransportType) {
	/** Specifies no transport preference. */
	HttpTransportType[HttpTransportType["None"] = 0] = "None";
	/** Specifies the WebSockets transport. */
	HttpTransportType[HttpTransportType["WebSockets"] = 1] = "WebSockets";
	/** Specifies the Server-Sent Events transport. */
	HttpTransportType[HttpTransportType["ServerSentEvents"] = 2] = "ServerSentEvents";
	/** Specifies the Long Polling transport. */
	HttpTransportType[HttpTransportType["LongPolling"] = 4] = "LongPolling";
})(HttpTransportType || (HttpTransportType = {}));
/** Specifies the transfer format for a connection. */
var TransferFormat;
(function(TransferFormat) {
	/** Specifies that only text data will be transmitted over the connection. */
	TransferFormat[TransferFormat["Text"] = 1] = "Text";
	/** Specifies that binary data will be transmitted over the connection. */
	TransferFormat[TransferFormat["Binary"] = 2] = "Binary";
})(TransferFormat || (TransferFormat = {}));
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/AbortController.js
/** @private */
var AbortController$1 = class {
	constructor() {
		this._isAborted = false;
		this.onabort = null;
	}
	abort() {
		if (!this._isAborted) {
			this._isAborted = true;
			if (this.onabort) this.onabort();
		}
	}
	get signal() {
		return this;
	}
	get aborted() {
		return this._isAborted;
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/LongPollingTransport.js
/** @private */
var LongPollingTransport = class {
	get pollAborted() {
		return this._pollAbort.aborted;
	}
	constructor(httpClient, logger, options) {
		this._httpClient = httpClient;
		this._logger = logger;
		this._pollAbort = new AbortController$1();
		this._options = options;
		this._running = false;
		this.onreceive = null;
		this.onclose = null;
	}
	async connect(url, transferFormat) {
		Arg.isRequired(url, "url");
		Arg.isRequired(transferFormat, "transferFormat");
		Arg.isIn(transferFormat, TransferFormat, "transferFormat");
		this._url = url;
		this._logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
		if (transferFormat === TransferFormat.Binary && typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string") throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
		const [name, value] = getUserAgentHeader();
		const headers = {
			[name]: value,
			...this._options.headers
		};
		const pollOptions = {
			abortSignal: this._pollAbort.signal,
			headers,
			timeout: 1e5,
			withCredentials: this._options.withCredentials
		};
		if (transferFormat === TransferFormat.Binary) pollOptions.responseType = "arraybuffer";
		const pollUrl = `${url}&_=${Date.now()}`;
		this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
		const response = await this._httpClient.get(pollUrl, pollOptions);
		if (response.statusCode !== 200) {
			this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
			this._closeError = new HttpError(response.statusText || "", response.statusCode);
			this._running = false;
		} else this._running = true;
		this._receiving = this._poll(this._url, pollOptions);
	}
	async _poll(url, pollOptions) {
		try {
			while (this._running) try {
				const pollUrl = `${url}&_=${Date.now()}`;
				this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
				const response = await this._httpClient.get(pollUrl, pollOptions);
				if (response.statusCode === 204) {
					this._logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
					this._running = false;
				} else if (response.statusCode !== 200) {
					this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
					this._closeError = new HttpError(response.statusText || "", response.statusCode);
					this._running = false;
				} else if (response.content) {
					this._logger.log(LogLevel.Trace, `(LongPolling transport) data received. ${getDataDetail(response.content, this._options.logMessageContent)}.`);
					if (this.onreceive) this.onreceive(response.content);
				} else this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
			} catch (e) {
				if (!this._running) this._logger.log(LogLevel.Trace, `(LongPolling transport) Poll errored after shutdown: ${e.message}`);
				else if (e instanceof TimeoutError) this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
				else {
					this._closeError = e;
					this._running = false;
				}
			}
		} finally {
			this._logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
			if (!this.pollAborted) this._raiseOnClose();
		}
	}
	async send(data) {
		if (!this._running) return Promise.reject(/* @__PURE__ */ new Error("Cannot send until the transport is connected"));
		return sendMessage(this._logger, "LongPolling", this._httpClient, this._url, data, this._options);
	}
	async stop() {
		this._logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
		this._running = false;
		this._pollAbort.abort();
		try {
			await this._receiving;
			this._logger.log(LogLevel.Trace, `(LongPolling transport) sending DELETE request to ${this._url}.`);
			const headers = {};
			const [name, value] = getUserAgentHeader();
			headers[name] = value;
			const deleteOptions = {
				headers: {
					...headers,
					...this._options.headers
				},
				timeout: this._options.timeout,
				withCredentials: this._options.withCredentials
			};
			let error;
			try {
				await this._httpClient.delete(this._url, deleteOptions);
			} catch (err) {
				error = err;
			}
			if (error) {
				if (error instanceof HttpError) if (error.statusCode === 404) this._logger.log(LogLevel.Trace, "(LongPolling transport) A 404 response was returned from sending a DELETE request.");
				else this._logger.log(LogLevel.Trace, `(LongPolling transport) Error sending a DELETE request: ${error}`);
			} else this._logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request accepted.");
		} finally {
			this._logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
			this._raiseOnClose();
		}
	}
	_raiseOnClose() {
		if (this.onclose) {
			let logMessage = "(LongPolling transport) Firing onclose event.";
			if (this._closeError) logMessage += " Error: " + this._closeError;
			this._logger.log(LogLevel.Trace, logMessage);
			this.onclose(this._closeError);
		}
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/ServerSentEventsTransport.js
/** @private */
var ServerSentEventsTransport = class {
	constructor(httpClient, accessToken, logger, options) {
		this._httpClient = httpClient;
		this._accessToken = accessToken;
		this._logger = logger;
		this._options = options;
		this.onreceive = null;
		this.onclose = null;
	}
	async connect(url, transferFormat) {
		Arg.isRequired(url, "url");
		Arg.isRequired(transferFormat, "transferFormat");
		Arg.isIn(transferFormat, TransferFormat, "transferFormat");
		this._logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
		this._url = url;
		if (this._accessToken) url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(this._accessToken)}`;
		return new Promise((resolve, reject) => {
			let opened = false;
			if (transferFormat !== TransferFormat.Text) {
				reject(/* @__PURE__ */ new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
				return;
			}
			let eventSource;
			if (Platform.isBrowser || Platform.isWebWorker) eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials });
			else {
				const cookies = this._httpClient.getCookieString(url);
				const headers = {};
				headers.Cookie = cookies;
				const [name, value] = getUserAgentHeader();
				headers[name] = value;
				eventSource = new this._options.EventSource(url, {
					withCredentials: this._options.withCredentials,
					headers: {
						...headers,
						...this._options.headers
					}
				});
			}
			try {
				eventSource.onmessage = (e) => {
					if (this.onreceive) try {
						this._logger.log(LogLevel.Trace, `(SSE transport) data received. ${getDataDetail(e.data, this._options.logMessageContent)}.`);
						this.onreceive(e.data);
					} catch (error) {
						this._close(error);
						return;
					}
				};
				eventSource.onerror = (e) => {
					if (opened) this._close();
					else reject(/* @__PURE__ */ new Error("EventSource failed to connect. The connection could not be found on the server, either the connection ID is not present on the server, or a proxy is refusing/buffering the connection. If you have multiple servers check that sticky sessions are enabled."));
				};
				eventSource.onopen = () => {
					this._logger.log(LogLevel.Information, `SSE connected to ${this._url}`);
					this._eventSource = eventSource;
					opened = true;
					resolve();
				};
			} catch (e) {
				reject(e);
				return;
			}
		});
	}
	async send(data) {
		if (!this._eventSource) return Promise.reject(/* @__PURE__ */ new Error("Cannot send until the transport is connected"));
		return sendMessage(this._logger, "SSE", this._httpClient, this._url, data, this._options);
	}
	stop() {
		this._close();
		return Promise.resolve();
	}
	_close(e) {
		if (this._eventSource) {
			this._eventSource.close();
			this._eventSource = void 0;
			if (this.onclose) this.onclose(e);
		}
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/WebSocketTransport.js
/** @private */
var WebSocketTransport = class {
	constructor(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
		this._logger = logger;
		this._accessTokenFactory = accessTokenFactory;
		this._logMessageContent = logMessageContent;
		this._webSocketConstructor = webSocketConstructor;
		this._httpClient = httpClient;
		this.onreceive = null;
		this.onclose = null;
		this._headers = headers;
	}
	async connect(url, transferFormat) {
		Arg.isRequired(url, "url");
		Arg.isRequired(transferFormat, "transferFormat");
		Arg.isIn(transferFormat, TransferFormat, "transferFormat");
		this._logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
		let token;
		if (this._accessTokenFactory) token = await this._accessTokenFactory();
		return new Promise((resolve, reject) => {
			url = url.replace(/^http/, "ws");
			let webSocket;
			const cookies = this._httpClient.getCookieString(url);
			let opened = false;
			if (Platform.isNode || Platform.isReactNative) {
				const headers = {};
				const [name, value] = getUserAgentHeader();
				headers[name] = value;
				if (token) headers[HeaderNames.Authorization] = `Bearer ${token}`;
				if (cookies) headers[HeaderNames.Cookie] = cookies;
				webSocket = new this._webSocketConstructor(url, void 0, { headers: {
					...headers,
					...this._headers
				} });
			} else if (token) url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(token)}`;
			if (!webSocket) webSocket = new this._webSocketConstructor(url);
			if (transferFormat === TransferFormat.Binary) webSocket.binaryType = "arraybuffer";
			webSocket.onopen = (_event) => {
				this._logger.log(LogLevel.Information, `WebSocket connected to ${url}.`);
				this._webSocket = webSocket;
				opened = true;
				resolve();
			};
			webSocket.onerror = (event) => {
				let error = null;
				if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) error = event.error;
				else error = "There was an error with the transport";
				this._logger.log(LogLevel.Information, `(WebSockets transport) ${error}.`);
			};
			webSocket.onmessage = (message) => {
				this._logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this._logMessageContent)}.`);
				if (this.onreceive) try {
					this.onreceive(message.data);
				} catch (error) {
					this._close(error);
					return;
				}
			};
			webSocket.onclose = (event) => {
				if (opened) this._close(event);
				else {
					let error = null;
					if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) error = event.error;
					else error = "WebSocket failed to connect. The connection could not be found on the server, either the endpoint may not be a SignalR endpoint, the connection ID is not present on the server, or there is a proxy blocking WebSockets. If you have multiple servers check that sticky sessions are enabled.";
					reject(new Error(error));
				}
			};
		});
	}
	send(data) {
		if (this._webSocket && this._webSocket.readyState === this._webSocketConstructor.OPEN) {
			this._logger.log(LogLevel.Trace, `(WebSockets transport) sending data. ${getDataDetail(data, this._logMessageContent)}.`);
			this._webSocket.send(data);
			return Promise.resolve();
		}
		return Promise.reject("WebSocket is not in the OPEN state");
	}
	stop() {
		if (this._webSocket) this._close(void 0);
		return Promise.resolve();
	}
	_close(event) {
		if (this._webSocket) {
			this._webSocket.onclose = () => {};
			this._webSocket.onmessage = () => {};
			this._webSocket.onerror = () => {};
			this._webSocket.close();
			this._webSocket = void 0;
		}
		this._logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
		if (this.onclose) if (this._isCloseEvent(event) && (event.wasClean === false || event.code !== 1e3)) this.onclose(/* @__PURE__ */ new Error(`WebSocket closed with status code: ${event.code} (${event.reason || "no reason given"}).`));
		else if (event instanceof Error) this.onclose(event);
		else this.onclose();
	}
	_isCloseEvent(event) {
		return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HttpConnection.js
var MAX_REDIRECTS = 100;
/** @private */
var HttpConnection = class {
	constructor(url, options = {}) {
		this._stopPromiseResolver = () => {};
		this.features = {};
		this._negotiateVersion = 1;
		Arg.isRequired(url, "url");
		this._logger = createLogger(options.logger);
		this.baseUrl = this._resolveUrl(url);
		options = options || {};
		options.logMessageContent = options.logMessageContent === void 0 ? false : options.logMessageContent;
		if (typeof options.withCredentials === "boolean" || options.withCredentials === void 0) options.withCredentials = options.withCredentials === void 0 ? true : options.withCredentials;
		else throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
		options.timeout = options.timeout === void 0 ? 1e5 : options.timeout;
		let webSocketModule = null;
		let eventSourceModule = null;
		if (Platform.isNode && typeof __require !== "undefined") {
			const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
			webSocketModule = requireFunc("ws");
			eventSourceModule = requireFunc("eventsource");
		}
		if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) options.WebSocket = WebSocket;
		else if (Platform.isNode && !options.WebSocket) {
			if (webSocketModule) options.WebSocket = webSocketModule;
		}
		if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) options.EventSource = EventSource;
		else if (Platform.isNode && !options.EventSource) {
			if (typeof eventSourceModule !== "undefined") options.EventSource = eventSourceModule;
		}
		this._httpClient = new AccessTokenHttpClient(options.httpClient || new DefaultHttpClient(this._logger), options.accessTokenFactory);
		this._connectionState = "Disconnected";
		this._connectionStarted = false;
		this._options = options;
		this.onreceive = null;
		this.onclose = null;
	}
	async start(transferFormat) {
		transferFormat = transferFormat || TransferFormat.Binary;
		Arg.isIn(transferFormat, TransferFormat, "transferFormat");
		this._logger.log(LogLevel.Debug, `Starting connection with transfer format '${TransferFormat[transferFormat]}'.`);
		if (this._connectionState !== "Disconnected") return Promise.reject(/* @__PURE__ */ new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
		this._connectionState = "Connecting";
		this._startInternalPromise = this._startInternal(transferFormat);
		await this._startInternalPromise;
		if (this._connectionState === "Disconnecting") {
			const message = "Failed to start the HttpConnection before stop() was called.";
			this._logger.log(LogLevel.Error, message);
			await this._stopPromise;
			return Promise.reject(new AbortError(message));
		} else if (this._connectionState !== "Connected") {
			const message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
			this._logger.log(LogLevel.Error, message);
			return Promise.reject(new AbortError(message));
		}
		this._connectionStarted = true;
	}
	send(data) {
		if (this._connectionState !== "Connected") return Promise.reject(/* @__PURE__ */ new Error("Cannot send data if the connection is not in the 'Connected' State."));
		if (!this._sendQueue) this._sendQueue = new TransportSendQueue(this.transport);
		return this._sendQueue.send(data);
	}
	async stop(error) {
		if (this._connectionState === "Disconnected") {
			this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnected state.`);
			return Promise.resolve();
		}
		if (this._connectionState === "Disconnecting") {
			this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
			return this._stopPromise;
		}
		this._connectionState = "Disconnecting";
		this._stopPromise = new Promise((resolve) => {
			this._stopPromiseResolver = resolve;
		});
		await this._stopInternal(error);
		await this._stopPromise;
	}
	async _stopInternal(error) {
		this._stopError = error;
		try {
			await this._startInternalPromise;
		} catch (e) {}
		if (this.transport) {
			try {
				await this.transport.stop();
			} catch (e) {
				this._logger.log(LogLevel.Error, `HttpConnection.transport.stop() threw error '${e}'.`);
				this._stopConnection();
			}
			this.transport = void 0;
		} else this._logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
	}
	async _startInternal(transferFormat) {
		let url = this.baseUrl;
		this._accessTokenFactory = this._options.accessTokenFactory;
		this._httpClient._accessTokenFactory = this._accessTokenFactory;
		try {
			if (this._options.skipNegotiation) if (this._options.transport === HttpTransportType.WebSockets) {
				this.transport = this._constructTransport(HttpTransportType.WebSockets);
				await this._startTransport(url, transferFormat);
			} else throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
			else {
				let negotiateResponse = null;
				let redirects = 0;
				do {
					negotiateResponse = await this._getNegotiationResponse(url);
					if (this._connectionState === "Disconnecting" || this._connectionState === "Disconnected") throw new AbortError("The connection was stopped during negotiation.");
					if (negotiateResponse.error) throw new Error(negotiateResponse.error);
					if (negotiateResponse.ProtocolVersion) throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
					if (negotiateResponse.url) url = negotiateResponse.url;
					if (negotiateResponse.accessToken) {
						const accessToken = negotiateResponse.accessToken;
						this._accessTokenFactory = () => accessToken;
						this._httpClient._accessToken = accessToken;
						this._httpClient._accessTokenFactory = void 0;
					}
					redirects++;
				} while (negotiateResponse.url && redirects < MAX_REDIRECTS);
				if (redirects === MAX_REDIRECTS && negotiateResponse.url) throw new Error("Negotiate redirection limit exceeded.");
				await this._createTransport(url, this._options.transport, negotiateResponse, transferFormat);
			}
			if (this.transport instanceof LongPollingTransport) this.features.inherentKeepAlive = true;
			if (this._connectionState === "Connecting") {
				this._logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
				this._connectionState = "Connected";
			}
		} catch (e) {
			this._logger.log(LogLevel.Error, "Failed to start the connection: " + e);
			this._connectionState = "Disconnected";
			this.transport = void 0;
			this._stopPromiseResolver();
			return Promise.reject(e);
		}
	}
	async _getNegotiationResponse(url) {
		const headers = {};
		const [name, value] = getUserAgentHeader();
		headers[name] = value;
		const negotiateUrl = this._resolveNegotiateUrl(url);
		this._logger.log(LogLevel.Debug, `Sending negotiation request: ${negotiateUrl}.`);
		try {
			const response = await this._httpClient.post(negotiateUrl, {
				content: "",
				headers: {
					...headers,
					...this._options.headers
				},
				timeout: this._options.timeout,
				withCredentials: this._options.withCredentials
			});
			if (response.statusCode !== 200) return Promise.reject(/* @__PURE__ */ new Error(`Unexpected status code returned from negotiate '${response.statusCode}'`));
			const negotiateResponse = JSON.parse(response.content);
			if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) negotiateResponse.connectionToken = negotiateResponse.connectionId;
			if (negotiateResponse.useStatefulReconnect && this._options._useStatefulReconnect !== true) return Promise.reject(new FailedToNegotiateWithServerError("Client didn't negotiate Stateful Reconnect but the server did."));
			return negotiateResponse;
		} catch (e) {
			let errorMessage = "Failed to complete negotiation with the server: " + e;
			if (e instanceof HttpError) {
				if (e.statusCode === 404) errorMessage = errorMessage + " Either this is not a SignalR endpoint or there is a proxy blocking the connection.";
			}
			this._logger.log(LogLevel.Error, errorMessage);
			return Promise.reject(new FailedToNegotiateWithServerError(errorMessage));
		}
	}
	_createConnectUrl(url, connectionToken) {
		if (!connectionToken) return url;
		return url + (url.indexOf("?") === -1 ? "?" : "&") + `id=${connectionToken}`;
	}
	async _createTransport(url, requestedTransport, negotiateResponse, requestedTransferFormat) {
		let connectUrl = this._createConnectUrl(url, negotiateResponse.connectionToken);
		if (this._isITransport(requestedTransport)) {
			this._logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
			this.transport = requestedTransport;
			await this._startTransport(connectUrl, requestedTransferFormat);
			this.connectionId = negotiateResponse.connectionId;
			return;
		}
		const transportExceptions = [];
		const transports = negotiateResponse.availableTransports || [];
		let negotiate = negotiateResponse;
		for (const endpoint of transports) {
			const transportOrError = this._resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, (negotiate === null || negotiate === void 0 ? void 0 : negotiate.useStatefulReconnect) === true);
			if (transportOrError instanceof Error) {
				transportExceptions.push(`${endpoint.transport} failed:`);
				transportExceptions.push(transportOrError);
			} else if (this._isITransport(transportOrError)) {
				this.transport = transportOrError;
				if (!negotiate) {
					try {
						negotiate = await this._getNegotiationResponse(url);
					} catch (ex) {
						return Promise.reject(ex);
					}
					connectUrl = this._createConnectUrl(url, negotiate.connectionToken);
				}
				try {
					await this._startTransport(connectUrl, requestedTransferFormat);
					this.connectionId = negotiate.connectionId;
					return;
				} catch (ex) {
					this._logger.log(LogLevel.Error, `Failed to start the transport '${endpoint.transport}': ${ex}`);
					negotiate = void 0;
					transportExceptions.push(new FailedToStartTransportError(`${endpoint.transport} failed: ${ex}`, HttpTransportType[endpoint.transport]));
					if (this._connectionState !== "Connecting") {
						const message = "Failed to select transport before stop() was called.";
						this._logger.log(LogLevel.Debug, message);
						return Promise.reject(new AbortError(message));
					}
				}
			}
		}
		if (transportExceptions.length > 0) return Promise.reject(new AggregateErrors(`Unable to connect to the server with any of the available transports. ${transportExceptions.join(" ")}`, transportExceptions));
		return Promise.reject(/* @__PURE__ */ new Error("None of the transports supported by the client are supported by the server."));
	}
	_constructTransport(transport) {
		switch (transport) {
			case HttpTransportType.WebSockets:
				if (!this._options.WebSocket) throw new Error("'WebSocket' is not supported in your environment.");
				return new WebSocketTransport(this._httpClient, this._accessTokenFactory, this._logger, this._options.logMessageContent, this._options.WebSocket, this._options.headers || {});
			case HttpTransportType.ServerSentEvents:
				if (!this._options.EventSource) throw new Error("'EventSource' is not supported in your environment.");
				return new ServerSentEventsTransport(this._httpClient, this._httpClient._accessToken, this._logger, this._options);
			case HttpTransportType.LongPolling: return new LongPollingTransport(this._httpClient, this._logger, this._options);
			default: throw new Error(`Unknown transport: ${transport}.`);
		}
	}
	_startTransport(url, transferFormat) {
		this.transport.onreceive = this.onreceive;
		if (this.features.reconnect) this.transport.onclose = async (e) => {
			let callStop = false;
			if (this.features.reconnect) try {
				this.features.disconnected();
				await this.transport.connect(url, transferFormat);
				await this.features.resend();
			} catch {
				callStop = true;
			}
			else {
				this._stopConnection(e);
				return;
			}
			if (callStop) this._stopConnection(e);
		};
		else this.transport.onclose = (e) => this._stopConnection(e);
		return this.transport.connect(url, transferFormat);
	}
	_resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, useStatefulReconnect) {
		const transport = HttpTransportType[endpoint.transport];
		if (transport === null || transport === void 0) {
			this._logger.log(LogLevel.Debug, `Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
			return /* @__PURE__ */ new Error(`Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
		} else if (transportMatches(requestedTransport, transport)) if (endpoint.transferFormats.map((s) => TransferFormat[s]).indexOf(requestedTransferFormat) >= 0) if (transport === HttpTransportType.WebSockets && !this._options.WebSocket || transport === HttpTransportType.ServerSentEvents && !this._options.EventSource) {
			this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it is not supported in your environment.'`);
			return new UnsupportedTransportError(`'${HttpTransportType[transport]}' is not supported in your environment.`, transport);
		} else {
			this._logger.log(LogLevel.Debug, `Selecting transport '${HttpTransportType[transport]}'.`);
			try {
				this.features.reconnect = transport === HttpTransportType.WebSockets ? useStatefulReconnect : void 0;
				return this._constructTransport(transport);
			} catch (ex) {
				return ex;
			}
		}
		else {
			this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it does not support the requested transfer format '${TransferFormat[requestedTransferFormat]}'.`);
			return /* @__PURE__ */ new Error(`'${HttpTransportType[transport]}' does not support ${TransferFormat[requestedTransferFormat]}.`);
		}
		else {
			this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it was disabled by the client.`);
			return new DisabledTransportError(`'${HttpTransportType[transport]}' is disabled by the client.`, transport);
		}
	}
	_isITransport(transport) {
		return transport && typeof transport === "object" && "connect" in transport;
	}
	_stopConnection(error) {
		this._logger.log(LogLevel.Debug, `HttpConnection.stopConnection(${error}) called while in state ${this._connectionState}.`);
		this.transport = void 0;
		error = this._stopError || error;
		this._stopError = void 0;
		if (this._connectionState === "Disconnected") {
			this._logger.log(LogLevel.Debug, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is already in the disconnected state.`);
			return;
		}
		if (this._connectionState === "Connecting") {
			this._logger.log(LogLevel.Warning, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is still in the connecting state.`);
			throw new Error(`HttpConnection.stopConnection(${error}) was called while the connection is still in the connecting state.`);
		}
		if (this._connectionState === "Disconnecting") this._stopPromiseResolver();
		if (error) this._logger.log(LogLevel.Error, `Connection disconnected with error '${error}'.`);
		else this._logger.log(LogLevel.Information, "Connection disconnected.");
		if (this._sendQueue) {
			this._sendQueue.stop().catch((e) => {
				this._logger.log(LogLevel.Error, `TransportSendQueue.stop() threw error '${e}'.`);
			});
			this._sendQueue = void 0;
		}
		this.connectionId = void 0;
		this._connectionState = "Disconnected";
		if (this._connectionStarted) {
			this._connectionStarted = false;
			try {
				if (this.onclose) this.onclose(error);
			} catch (e) {
				this._logger.log(LogLevel.Error, `HttpConnection.onclose(${error}) threw error '${e}'.`);
			}
		}
	}
	_resolveUrl(url) {
		if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) return url;
		if (!Platform.isBrowser) throw new Error(`Cannot resolve '${url}'.`);
		const aTag = window.document.createElement("a");
		aTag.href = url;
		this._logger.log(LogLevel.Information, `Normalizing '${url}' to '${aTag.href}'.`);
		return aTag.href;
	}
	_resolveNegotiateUrl(url) {
		const negotiateUrl = new URL(url);
		if (negotiateUrl.pathname.endsWith("/")) negotiateUrl.pathname += "negotiate";
		else negotiateUrl.pathname += "/negotiate";
		const searchParams = new URLSearchParams(negotiateUrl.searchParams);
		if (!searchParams.has("negotiateVersion")) searchParams.append("negotiateVersion", this._negotiateVersion.toString());
		if (searchParams.has("useStatefulReconnect")) {
			if (searchParams.get("useStatefulReconnect") === "true") this._options._useStatefulReconnect = true;
		} else if (this._options._useStatefulReconnect === true) searchParams.append("useStatefulReconnect", "true");
		negotiateUrl.search = searchParams.toString();
		return negotiateUrl.toString();
	}
};
function transportMatches(requestedTransport, actualTransport) {
	return !requestedTransport || (actualTransport & requestedTransport) !== 0;
}
/** @private */
var TransportSendQueue = class TransportSendQueue {
	constructor(_transport) {
		this._transport = _transport;
		this._buffer = [];
		this._executing = true;
		this._sendBufferedData = new PromiseSource();
		this._transportResult = new PromiseSource();
		this._sendLoopPromise = this._sendLoop();
	}
	send(data) {
		this._bufferData(data);
		if (!this._transportResult) this._transportResult = new PromiseSource();
		return this._transportResult.promise;
	}
	stop() {
		this._executing = false;
		this._sendBufferedData.resolve();
		return this._sendLoopPromise;
	}
	_bufferData(data) {
		if (this._buffer.length && typeof this._buffer[0] !== typeof data) throw new Error(`Expected data to be of type ${typeof this._buffer} but was of type ${typeof data}`);
		this._buffer.push(data);
		this._sendBufferedData.resolve();
	}
	async _sendLoop() {
		while (true) {
			await this._sendBufferedData.promise;
			if (!this._executing) {
				if (this._transportResult) this._transportResult.reject("Connection stopped.");
				break;
			}
			this._sendBufferedData = new PromiseSource();
			const transportResult = this._transportResult;
			this._transportResult = void 0;
			const data = typeof this._buffer[0] === "string" ? this._buffer.join("") : TransportSendQueue._concatBuffers(this._buffer);
			this._buffer.length = 0;
			try {
				await this._transport.send(data);
				transportResult.resolve();
			} catch (error) {
				transportResult.reject(error);
			}
		}
	}
	static _concatBuffers(arrayBuffers) {
		const totalLength = arrayBuffers.map((b) => b.byteLength).reduce((a, b) => a + b);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const item of arrayBuffers) {
			result.set(new Uint8Array(item), offset);
			offset += item.byteLength;
		}
		return result.buffer;
	}
};
var PromiseSource = class {
	constructor() {
		this.promise = new Promise((resolve, reject) => [this._resolver, this._rejecter] = [resolve, reject]);
	}
	resolve() {
		this._resolver();
	}
	reject(reason) {
		this._rejecter(reason);
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/JsonHubProtocol.js
var JSON_HUB_PROTOCOL_NAME = "json";
/** Implements the JSON Hub Protocol. */
var JsonHubProtocol = class {
	constructor() {
		/** @inheritDoc */
		this.name = JSON_HUB_PROTOCOL_NAME;
		/** @inheritDoc */
		this.version = 2;
		/** @inheritDoc */
		this.transferFormat = TransferFormat.Text;
	}
	/** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
	*
	* @param {string} input A string containing the serialized representation.
	* @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
	*/
	parseMessages(input, logger) {
		if (typeof input !== "string") throw new Error("Invalid input for JSON hub protocol. Expected a string.");
		if (!input) return [];
		if (logger === null) logger = NullLogger.instance;
		const messages = TextMessageFormat.parse(input);
		const hubMessages = [];
		for (const message of messages) {
			const parsedMessage = JSON.parse(message);
			if (typeof parsedMessage.type !== "number") throw new Error("Invalid payload.");
			switch (parsedMessage.type) {
				case MessageType.Invocation:
					this._isInvocationMessage(parsedMessage);
					break;
				case MessageType.StreamItem:
					this._isStreamItemMessage(parsedMessage);
					break;
				case MessageType.Completion:
					this._isCompletionMessage(parsedMessage);
					break;
				case MessageType.Ping: break;
				case MessageType.Close: break;
				case MessageType.Ack:
					this._isAckMessage(parsedMessage);
					break;
				case MessageType.Sequence:
					this._isSequenceMessage(parsedMessage);
					break;
				default:
					logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
					continue;
			}
			hubMessages.push(parsedMessage);
		}
		return hubMessages;
	}
	/** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
	*
	* @param {HubMessage} message The message to write.
	* @returns {string} A string containing the serialized representation of the message.
	*/
	writeMessage(message) {
		return TextMessageFormat.write(JSON.stringify(message));
	}
	_isInvocationMessage(message) {
		this._assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
		if (message.invocationId !== void 0) this._assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
	}
	_isStreamItemMessage(message) {
		this._assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
		if (message.item === void 0) throw new Error("Invalid payload for StreamItem message.");
	}
	_isCompletionMessage(message) {
		if (message.result && message.error) throw new Error("Invalid payload for Completion message.");
		if (!message.result && message.error) this._assertNotEmptyString(message.error, "Invalid payload for Completion message.");
		this._assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
	}
	_isAckMessage(message) {
		if (typeof message.sequenceId !== "number") throw new Error("Invalid SequenceId for Ack message.");
	}
	_isSequenceMessage(message) {
		if (typeof message.sequenceId !== "number") throw new Error("Invalid SequenceId for Sequence message.");
	}
	_assertNotEmptyString(value, errorMessage) {
		if (typeof value !== "string" || value === "") throw new Error(errorMessage);
	}
};
//#endregion
//#region node_modules/@microsoft/signalr/dist/esm/HubConnectionBuilder.js
var LogLevelNameMapping = {
	trace: LogLevel.Trace,
	debug: LogLevel.Debug,
	info: LogLevel.Information,
	information: LogLevel.Information,
	warn: LogLevel.Warning,
	warning: LogLevel.Warning,
	error: LogLevel.Error,
	critical: LogLevel.Critical,
	none: LogLevel.None
};
function parseLogLevel(name) {
	const mapping = LogLevelNameMapping[name.toLowerCase()];
	if (typeof mapping !== "undefined") return mapping;
	else throw new Error(`Unknown log level: ${name}`);
}
/** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
var HubConnectionBuilder = class {
	configureLogging(logging) {
		Arg.isRequired(logging, "logging");
		if (isLogger(logging)) this.logger = logging;
		else if (typeof logging === "string") {
			const logLevel = parseLogLevel(logging);
			this.logger = new ConsoleLogger(logLevel);
		} else this.logger = new ConsoleLogger(logging);
		return this;
	}
	withUrl(url, transportTypeOrOptions) {
		Arg.isRequired(url, "url");
		Arg.isNotEmpty(url, "url");
		this.url = url;
		if (typeof transportTypeOrOptions === "object") this.httpConnectionOptions = {
			...this.httpConnectionOptions,
			...transportTypeOrOptions
		};
		else this.httpConnectionOptions = {
			...this.httpConnectionOptions,
			transport: transportTypeOrOptions
		};
		return this;
	}
	/** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
	*
	* @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
	*/
	withHubProtocol(protocol) {
		Arg.isRequired(protocol, "protocol");
		this.protocol = protocol;
		return this;
	}
	withAutomaticReconnect(retryDelaysOrReconnectPolicy) {
		if (this.reconnectPolicy) throw new Error("A reconnectPolicy has already been set.");
		if (!retryDelaysOrReconnectPolicy) this.reconnectPolicy = new DefaultReconnectPolicy();
		else if (Array.isArray(retryDelaysOrReconnectPolicy)) this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
		else this.reconnectPolicy = retryDelaysOrReconnectPolicy;
		return this;
	}
	/** Configures {@link @microsoft/signalr.HubConnection.serverTimeoutInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
	*
	* @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	*/
	withServerTimeout(milliseconds) {
		Arg.isRequired(milliseconds, "milliseconds");
		this._serverTimeoutInMilliseconds = milliseconds;
		return this;
	}
	/** Configures {@link @microsoft/signalr.HubConnection.keepAliveIntervalInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
	*
	* @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	*/
	withKeepAliveInterval(milliseconds) {
		Arg.isRequired(milliseconds, "milliseconds");
		this._keepAliveIntervalInMilliseconds = milliseconds;
		return this;
	}
	/** Enables and configures options for the Stateful Reconnect feature.
	*
	* @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	*/
	withStatefulReconnect(options) {
		if (this.httpConnectionOptions === void 0) this.httpConnectionOptions = {};
		this.httpConnectionOptions._useStatefulReconnect = true;
		this._statefulReconnectBufferSize = options === null || options === void 0 ? void 0 : options.bufferSize;
		return this;
	}
	/** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
	*
	* @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
	*/
	build() {
		const httpConnectionOptions = this.httpConnectionOptions || {};
		if (httpConnectionOptions.logger === void 0) httpConnectionOptions.logger = this.logger;
		if (!this.url) throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
		const connection = new HttpConnection(this.url, httpConnectionOptions);
		return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy, this._serverTimeoutInMilliseconds, this._keepAliveIntervalInMilliseconds, this._statefulReconnectBufferSize);
	}
};
function isLogger(logger) {
	return logger.log !== void 0;
}
//#endregion
export { AbortError, DefaultHttpClient, HttpClient, HttpError, HttpResponse, HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, JsonHubProtocol, LogLevel, MessageType, NullLogger, Subject, TimeoutError, TransferFormat, VERSION };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQG1pY3Jvc29mdF9zaWduYWxyLmpzIiwibmFtZXMiOlsicmVzcG9uc2VNZXNzYWdlIiwiQWJvcnRDb250cm9sbGVyIiwiQWJvcnRDb250cm9sbGVyIl0sInNvdXJjZXMiOlsiLi4vLi4vQG1pY3Jvc29mdC9zaWduYWxyL2Rpc3QvZXNtL0Vycm9ycy5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9IdHRwQ2xpZW50LmpzIiwiLi4vLi4vQG1pY3Jvc29mdC9zaWduYWxyL2Rpc3QvZXNtL0lMb2dnZXIuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vTG9nZ2Vycy5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9wa2ctdmVyc2lvbi5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9VdGlscy5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9GZXRjaEh0dHBDbGllbnQuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vWGhySHR0cENsaWVudC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9EZWZhdWx0SHR0cENsaWVudC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9UZXh0TWVzc2FnZUZvcm1hdC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9IYW5kc2hha2VQcm90b2NvbC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9JSHViUHJvdG9jb2wuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vU3ViamVjdC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9NZXNzYWdlQnVmZmVyLmpzIiwiLi4vLi4vQG1pY3Jvc29mdC9zaWduYWxyL2Rpc3QvZXNtL0h1YkNvbm5lY3Rpb24uanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vRGVmYXVsdFJlY29ubmVjdFBvbGljeS5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9IZWFkZXJOYW1lcy5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9BY2Nlc3NUb2tlbkh0dHBDbGllbnQuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vSVRyYW5zcG9ydC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9BYm9ydENvbnRyb2xsZXIuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vTG9uZ1BvbGxpbmdUcmFuc3BvcnQuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vU2VydmVyU2VudEV2ZW50c1RyYW5zcG9ydC5qcyIsIi4uLy4uL0BtaWNyb3NvZnQvc2lnbmFsci9kaXN0L2VzbS9XZWJTb2NrZXRUcmFuc3BvcnQuanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vSHR0cENvbm5lY3Rpb24uanMiLCIuLi8uLi9AbWljcm9zb2Z0L3NpZ25hbHIvZGlzdC9lc20vSnNvbkh1YlByb3RvY29sLmpzIiwiLi4vLi4vQG1pY3Jvc29mdC9zaWduYWxyL2Rpc3QvZXNtL0h1YkNvbm5lY3Rpb25CdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLyoqIEVycm9yIHRocm93biB3aGVuIGFuIEhUVFAgcmVxdWVzdCBmYWlscy4gKi9cclxuZXhwb3J0IGNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHR0cEVycm9yfS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JNZXNzYWdlIEEgZGVzY3JpcHRpdmUgZXJyb3IgbWVzc2FnZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNDb2RlIFRoZSBIVFRQIHN0YXR1cyBjb2RlIHJlcHJlc2VudGVkIGJ5IHRoaXMgZXJyb3IuXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGVycm9yTWVzc2FnZSwgc3RhdHVzQ29kZSkge1xyXG4gICAgICAgIGNvbnN0IHRydWVQcm90byA9IG5ldy50YXJnZXQucHJvdG90eXBlO1xyXG4gICAgICAgIHN1cGVyKGAke2Vycm9yTWVzc2FnZX06IFN0YXR1cyBjb2RlICcke3N0YXR1c0NvZGV9J2ApO1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQ29kZSA9IHN0YXR1c0NvZGU7XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBpc3N1ZSBpbiBUeXBlc2NyaXB0IGNvbXBpbGVyXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzk2NSNpc3N1ZWNvbW1lbnQtMjc4NTcwMjAwXHJcbiAgICAgICAgdGhpcy5fX3Byb3RvX18gPSB0cnVlUHJvdG87XHJcbiAgICB9XHJcbn1cclxuLyoqIEVycm9yIHRocm93biB3aGVuIGEgdGltZW91dCBlbGFwc2VzLiAqL1xyXG5leHBvcnQgY2xhc3MgVGltZW91dEVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgLyoqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2Ugb2Yge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5UaW1lb3V0RXJyb3J9LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBlcnJvck1lc3NhZ2UgQSBkZXNjcmlwdGl2ZSBlcnJvciBtZXNzYWdlLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihlcnJvck1lc3NhZ2UgPSBcIkEgdGltZW91dCBvY2N1cnJlZC5cIikge1xyXG4gICAgICAgIGNvbnN0IHRydWVQcm90byA9IG5ldy50YXJnZXQucHJvdG90eXBlO1xyXG4gICAgICAgIHN1cGVyKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBpc3N1ZSBpbiBUeXBlc2NyaXB0IGNvbXBpbGVyXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzk2NSNpc3N1ZWNvbW1lbnQtMjc4NTcwMjAwXHJcbiAgICAgICAgdGhpcy5fX3Byb3RvX18gPSB0cnVlUHJvdG87XHJcbiAgICB9XHJcbn1cclxuLyoqIEVycm9yIHRocm93biB3aGVuIGFuIGFjdGlvbiBpcyBhYm9ydGVkLiAqL1xyXG5leHBvcnQgY2xhc3MgQWJvcnRFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIHtAbGluayBBYm9ydEVycm9yfS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JNZXNzYWdlIEEgZGVzY3JpcHRpdmUgZXJyb3IgbWVzc2FnZS5cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZXJyb3JNZXNzYWdlID0gXCJBbiBhYm9ydCBvY2N1cnJlZC5cIikge1xyXG4gICAgICAgIGNvbnN0IHRydWVQcm90byA9IG5ldy50YXJnZXQucHJvdG90eXBlO1xyXG4gICAgICAgIHN1cGVyKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBpc3N1ZSBpbiBUeXBlc2NyaXB0IGNvbXBpbGVyXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzk2NSNpc3N1ZWNvbW1lbnQtMjc4NTcwMjAwXHJcbiAgICAgICAgdGhpcy5fX3Byb3RvX18gPSB0cnVlUHJvdG87XHJcbiAgICB9XHJcbn1cclxuLyoqIEVycm9yIHRocm93biB3aGVuIHRoZSBzZWxlY3RlZCB0cmFuc3BvcnQgaXMgdW5zdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuICovXHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgY2xhc3MgVW5zdXBwb3J0ZWRUcmFuc3BvcnRFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuVW5zdXBwb3J0ZWRUcmFuc3BvcnRFcnJvcn0uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgQSBkZXNjcmlwdGl2ZSBlcnJvciBtZXNzYWdlLlxyXG4gICAgICogQHBhcmFtIHtIdHRwVHJhbnNwb3J0VHlwZX0gdHJhbnNwb3J0IFRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkh0dHBUcmFuc3BvcnRUeXBlfSB0aGlzIGVycm9yIG9jY3VycmVkIG9uLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCB0cmFuc3BvcnQpIHtcclxuICAgICAgICBjb25zdCB0cnVlUHJvdG8gPSBuZXcudGFyZ2V0LnByb3RvdHlwZTtcclxuICAgICAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgICAgICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydDtcclxuICAgICAgICB0aGlzLmVycm9yVHlwZSA9ICdVbnN1cHBvcnRlZFRyYW5zcG9ydEVycm9yJztcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGlzc3VlIGluIFR5cGVzY3JpcHQgY29tcGlsZXJcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzEzOTY1I2lzc3VlY29tbWVudC0yNzg1NzAyMDBcclxuICAgICAgICB0aGlzLl9fcHJvdG9fXyA9IHRydWVQcm90bztcclxuICAgIH1cclxufVxyXG4vKiogRXJyb3IgdGhyb3duIHdoZW4gdGhlIHNlbGVjdGVkIHRyYW5zcG9ydCBpcyBkaXNhYmxlZCBieSB0aGUgYnJvd3Nlci4gKi9cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBEaXNhYmxlZFRyYW5zcG9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgLyoqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2Ugb2Yge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5EaXNhYmxlZFRyYW5zcG9ydEVycm9yfS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBBIGRlc2NyaXB0aXZlIGVycm9yIG1lc3NhZ2UuXHJcbiAgICAgKiBAcGFyYW0ge0h0dHBUcmFuc3BvcnRUeXBlfSB0cmFuc3BvcnQgVGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHR0cFRyYW5zcG9ydFR5cGV9IHRoaXMgZXJyb3Igb2NjdXJyZWQgb24uXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIHRyYW5zcG9ydCkge1xyXG4gICAgICAgIGNvbnN0IHRydWVQcm90byA9IG5ldy50YXJnZXQucHJvdG90eXBlO1xyXG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG4gICAgICAgIHRoaXMuZXJyb3JUeXBlID0gJ0Rpc2FibGVkVHJhbnNwb3J0RXJyb3InO1xyXG4gICAgICAgIC8vIFdvcmthcm91bmQgaXNzdWUgaW4gVHlwZXNjcmlwdCBjb21waWxlclxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTM5NjUjaXNzdWVjb21tZW50LTI3ODU3MDIwMFxyXG4gICAgICAgIHRoaXMuX19wcm90b19fID0gdHJ1ZVByb3RvO1xyXG4gICAgfVxyXG59XHJcbi8qKiBFcnJvciB0aHJvd24gd2hlbiB0aGUgc2VsZWN0ZWQgdHJhbnNwb3J0IGNhbm5vdCBiZSBzdGFydGVkLiAqL1xyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIEZhaWxlZFRvU3RhcnRUcmFuc3BvcnRFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuRmFpbGVkVG9TdGFydFRyYW5zcG9ydEVycm9yfS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBBIGRlc2NyaXB0aXZlIGVycm9yIG1lc3NhZ2UuXHJcbiAgICAgKiBAcGFyYW0ge0h0dHBUcmFuc3BvcnRUeXBlfSB0cmFuc3BvcnQgVGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHR0cFRyYW5zcG9ydFR5cGV9IHRoaXMgZXJyb3Igb2NjdXJyZWQgb24uXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIHRyYW5zcG9ydCkge1xyXG4gICAgICAgIGNvbnN0IHRydWVQcm90byA9IG5ldy50YXJnZXQucHJvdG90eXBlO1xyXG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG4gICAgICAgIHRoaXMuZXJyb3JUeXBlID0gJ0ZhaWxlZFRvU3RhcnRUcmFuc3BvcnRFcnJvcic7XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBpc3N1ZSBpbiBUeXBlc2NyaXB0IGNvbXBpbGVyXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzk2NSNpc3N1ZWNvbW1lbnQtMjc4NTcwMjAwXHJcbiAgICAgICAgdGhpcy5fX3Byb3RvX18gPSB0cnVlUHJvdG87XHJcbiAgICB9XHJcbn1cclxuLyoqIEVycm9yIHRocm93biB3aGVuIHRoZSBuZWdvdGlhdGlvbiB3aXRoIHRoZSBzZXJ2ZXIgZmFpbGVkIHRvIGNvbXBsZXRlLiAqL1xyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIEZhaWxlZFRvTmVnb3RpYXRlV2l0aFNlcnZlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgLyoqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2Ugb2Yge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5GYWlsZWRUb05lZ290aWF0ZVdpdGhTZXJ2ZXJFcnJvcn0uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgQSBkZXNjcmlwdGl2ZSBlcnJvciBtZXNzYWdlLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICAgICAgY29uc3QgdHJ1ZVByb3RvID0gbmV3LnRhcmdldC5wcm90b3R5cGU7XHJcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICAgICAgdGhpcy5lcnJvclR5cGUgPSAnRmFpbGVkVG9OZWdvdGlhdGVXaXRoU2VydmVyRXJyb3InO1xyXG4gICAgICAgIC8vIFdvcmthcm91bmQgaXNzdWUgaW4gVHlwZXNjcmlwdCBjb21waWxlclxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTM5NjUjaXNzdWVjb21tZW50LTI3ODU3MDIwMFxyXG4gICAgICAgIHRoaXMuX19wcm90b19fID0gdHJ1ZVByb3RvO1xyXG4gICAgfVxyXG59XHJcbi8qKiBFcnJvciB0aHJvd24gd2hlbiBtdWx0aXBsZSBlcnJvcnMgaGF2ZSBvY2N1cnJlZC4gKi9cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBBZ2dyZWdhdGVFcnJvcnMgZXh0ZW5kcyBFcnJvciB7XHJcbiAgICAvKiogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZSBvZiB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkFnZ3JlZ2F0ZUVycm9yc30uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgQSBkZXNjcmlwdGl2ZSBlcnJvciBtZXNzYWdlLlxyXG4gICAgICogQHBhcmFtIHtFcnJvcltdfSBpbm5lckVycm9ycyBUaGUgY29sbGVjdGlvbiBvZiBlcnJvcnMgdGhpcyBlcnJvciBpcyBhZ2dyZWdhdGluZy5cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSwgaW5uZXJFcnJvcnMpIHtcclxuICAgICAgICBjb25zdCB0cnVlUHJvdG8gPSBuZXcudGFyZ2V0LnByb3RvdHlwZTtcclxuICAgICAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgICAgICB0aGlzLmlubmVyRXJyb3JzID0gaW5uZXJFcnJvcnM7XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBpc3N1ZSBpbiBUeXBlc2NyaXB0IGNvbXBpbGVyXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzk2NSNpc3N1ZWNvbW1lbnQtMjc4NTcwMjAwXHJcbiAgICAgICAgdGhpcy5fX3Byb3RvX18gPSB0cnVlUHJvdG87XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXJyb3JzLmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLyoqIFJlcHJlc2VudHMgYW4gSFRUUCByZXNwb25zZS4gKi9cclxuZXhwb3J0IGNsYXNzIEh0dHBSZXNwb25zZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihzdGF0dXNDb2RlLCBzdGF0dXNUZXh0LCBjb250ZW50KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNDb2RlID0gc3RhdHVzQ29kZTtcclxuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBzdGF0dXNUZXh0O1xyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICB9XHJcbn1cclxuLyoqIEFic3RyYWN0aW9uIG92ZXIgYW4gSFRUUCBjbGllbnQuXHJcbiAqXHJcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYW4gYWJzdHJhY3Rpb24gb3ZlciBhbiBIVFRQIGNsaWVudCBzbyB0aGF0IGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uIGNhbiBiZSBwcm92aWRlZCBvbiBkaWZmZXJlbnQgcGxhdGZvcm1zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEh0dHBDbGllbnQge1xyXG4gICAgZ2V0KHVybCwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlbmQoe1xyXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgICAgICAgIHVybCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHBvc3QodXJsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VuZCh7XHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIHVybCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGRlbGV0ZSh1cmwsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZW5kKHtcclxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiLFxyXG4gICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvKiogR2V0cyBhbGwgY29va2llcyB0aGF0IGFwcGx5IHRvIHRoZSBzcGVjaWZpZWQgVVJMLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB1cmwgVGhlIFVSTCB0aGF0IHRoZSBjb29raWVzIGFyZSB2YWxpZCBmb3IuXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBBIHN0cmluZyBjb250YWluaW5nIGFsbCB0aGUga2V5LXZhbHVlIGNvb2tpZSBwYWlycyBmb3IgdGhlIHNwZWNpZmllZCBVUkwuXHJcbiAgICAgKi9cclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIGdldENvb2tpZVN0cmluZyh1cmwpIHtcclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1IdHRwQ2xpZW50LmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLy8gVGhlc2UgdmFsdWVzIGFyZSBkZXNpZ25lZCB0byBtYXRjaCB0aGUgQVNQLk5FVCBMb2cgTGV2ZWxzIHNpbmNlIHRoYXQncyB0aGUgcGF0dGVybiB3ZSdyZSBlbXVsYXRpbmcgaGVyZS5cclxuLyoqIEluZGljYXRlcyB0aGUgc2V2ZXJpdHkgb2YgYSBsb2cgbWVzc2FnZS5cclxuICpcclxuICogTG9nIExldmVscyBhcmUgb3JkZXJlZCBpbiBpbmNyZWFzaW5nIHNldmVyaXR5LiBTbyBgRGVidWdgIGlzIG1vcmUgc2V2ZXJlIHRoYW4gYFRyYWNlYCwgZXRjLlxyXG4gKi9cclxuZXhwb3J0IHZhciBMb2dMZXZlbDtcclxuKGZ1bmN0aW9uIChMb2dMZXZlbCkge1xyXG4gICAgLyoqIExvZyBsZXZlbCBmb3IgdmVyeSBsb3cgc2V2ZXJpdHkgZGlhZ25vc3RpYyBtZXNzYWdlcy4gKi9cclxuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiVHJhY2VcIl0gPSAwXSA9IFwiVHJhY2VcIjtcclxuICAgIC8qKiBMb2cgbGV2ZWwgZm9yIGxvdyBzZXZlcml0eSBkaWFnbm9zdGljIG1lc3NhZ2VzLiAqL1xyXG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJEZWJ1Z1wiXSA9IDFdID0gXCJEZWJ1Z1wiO1xyXG4gICAgLyoqIExvZyBsZXZlbCBmb3IgaW5mb3JtYXRpb25hbCBkaWFnbm9zdGljIG1lc3NhZ2VzLiAqL1xyXG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJJbmZvcm1hdGlvblwiXSA9IDJdID0gXCJJbmZvcm1hdGlvblwiO1xyXG4gICAgLyoqIExvZyBsZXZlbCBmb3IgZGlhZ25vc3RpYyBtZXNzYWdlcyB0aGF0IGluZGljYXRlIGEgbm9uLWZhdGFsIHByb2JsZW0uICovXHJcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIldhcm5pbmdcIl0gPSAzXSA9IFwiV2FybmluZ1wiO1xyXG4gICAgLyoqIExvZyBsZXZlbCBmb3IgZGlhZ25vc3RpYyBtZXNzYWdlcyB0aGF0IGluZGljYXRlIGEgZmFpbHVyZSBpbiB0aGUgY3VycmVudCBvcGVyYXRpb24uICovXHJcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIkVycm9yXCJdID0gNF0gPSBcIkVycm9yXCI7XHJcbiAgICAvKiogTG9nIGxldmVsIGZvciBkaWFnbm9zdGljIG1lc3NhZ2VzIHRoYXQgaW5kaWNhdGUgYSBmYWlsdXJlIHRoYXQgd2lsbCB0ZXJtaW5hdGUgdGhlIGVudGlyZSBhcHBsaWNhdGlvbi4gKi9cclxuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiQ3JpdGljYWxcIl0gPSA1XSA9IFwiQ3JpdGljYWxcIjtcclxuICAgIC8qKiBUaGUgaGlnaGVzdCBwb3NzaWJsZSBsb2cgbGV2ZWwuIFVzZWQgd2hlbiBjb25maWd1cmluZyBsb2dnaW5nIHRvIGluZGljYXRlIHRoYXQgbm8gbG9nIG1lc3NhZ2VzIHNob3VsZCBiZSBlbWl0dGVkLiAqL1xyXG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJOb25lXCJdID0gNl0gPSBcIk5vbmVcIjtcclxufSkoTG9nTGV2ZWwgfHwgKExvZ0xldmVsID0ge30pKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SUxvZ2dlci5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbi8qKiBBIGxvZ2dlciB0aGF0IGRvZXMgbm90aGluZyB3aGVuIGxvZyBtZXNzYWdlcyBhcmUgc2VudCB0byBpdC4gKi9cclxuZXhwb3J0IGNsYXNzIE51bGxMb2dnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7IH1cclxuICAgIC8qKiBAaW5oZXJpdERvYyAqL1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXHJcbiAgICBsb2coX2xvZ0xldmVsLCBfbWVzc2FnZSkge1xyXG4gICAgfVxyXG59XHJcbi8qKiBUaGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLk51bGxMb2dnZXJ9LiAqL1xyXG5OdWxsTG9nZ2VyLmluc3RhbmNlID0gbmV3IE51bGxMb2dnZXIoKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9nZ2Vycy5qcy5tYXAiLCJleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcxMC4wLjAnO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wa2ctdmVyc2lvbi5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBOdWxsTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2Vyc1wiO1xyXG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSBcIi4vcGtnLXZlcnNpb25cIjtcclxuLy8gVmVyc2lvbiB0b2tlbiB0aGF0IHdpbGwgYmUgcmVwbGFjZWQgYnkgdGhlIHByZXBhY2sgY29tbWFuZFxyXG4vKiogVGhlIHZlcnNpb24gb2YgdGhlIFNpZ25hbFIgY2xpZW50LiAqL1xyXG5leHBvcnQgeyBWRVJTSU9OIH07XHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgY2xhc3MgQXJnIHtcclxuICAgIHN0YXRpYyBpc1JlcXVpcmVkKHZhbCwgbmFtZSkge1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgJyR7bmFtZX0nIGFyZ3VtZW50IGlzIHJlcXVpcmVkLmApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyBpc05vdEVtcHR5KHZhbCwgbmFtZSkge1xyXG4gICAgICAgIGlmICghdmFsIHx8IHZhbC5tYXRjaCgvXlxccyokLykpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgJyR7bmFtZX0nIGFyZ3VtZW50IHNob3VsZCBub3QgYmUgZW1wdHkuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc3RhdGljIGlzSW4odmFsLCB2YWx1ZXMsIG5hbWUpIHtcclxuICAgICAgICAvLyBUeXBlU2NyaXB0IGVudW1zIGhhdmUga2V5cyBmb3IgKipib3RoKiogdGhlIG5hbWUgYW5kIHRoZSB2YWx1ZSBvZiBlYWNoIGVudW0gbWVtYmVyIG9uIHRoZSB0eXBlIGl0c2VsZi5cclxuICAgICAgICBpZiAoISh2YWwgaW4gdmFsdWVzKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gJHtuYW1lfSB2YWx1ZTogJHt2YWx9LmApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtIHtcclxuICAgIC8vIHJlYWN0LW5hdGl2ZSBoYXMgYSB3aW5kb3cgYnV0IG5vIGRvY3VtZW50IHNvIHdlIHNob3VsZCBjaGVjayBib3RoXHJcbiAgICBzdGF0aWMgZ2V0IGlzQnJvd3NlcigpIHtcclxuICAgICAgICByZXR1cm4gIVBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgPT09IFwib2JqZWN0XCI7XHJcbiAgICB9XHJcbiAgICAvLyBXZWJXb3JrZXJzIGRvbid0IGhhdmUgYSB3aW5kb3cgb2JqZWN0IHNvIHRoZSBpc0Jyb3dzZXIgY2hlY2sgd291bGQgZmFpbFxyXG4gICAgc3RhdGljIGdldCBpc1dlYldvcmtlcigpIHtcclxuICAgICAgICByZXR1cm4gIVBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2Ygc2VsZiA9PT0gXCJvYmplY3RcIiAmJiBcImltcG9ydFNjcmlwdHNcIiBpbiBzZWxmO1xyXG4gICAgfVxyXG4gICAgLy8gcmVhY3QtbmF0aXZlIGhhcyBhIHdpbmRvdyBidXQgbm8gZG9jdW1lbnRcclxuICAgIHN0YXRpYyBnZXQgaXNSZWFjdE5hdGl2ZSgpIHtcclxuICAgICAgICByZXR1cm4gIVBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCI7XHJcbiAgICB9XHJcbiAgICAvLyBOb2RlIGFwcHMgc2hvdWxkbid0IGhhdmUgYSB3aW5kb3cgb2JqZWN0LCBidXQgV2ViV29ya2VycyBkb24ndCBlaXRoZXJcclxuICAgIC8vIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yIGJvdGggV2ViV29ya2VyIGFuZCB3aW5kb3dcclxuICAgIHN0YXRpYyBnZXQgaXNOb2RlKCkge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLnJlbGVhc2UgJiYgcHJvY2Vzcy5yZWxlYXNlLm5hbWUgPT09IFwibm9kZVwiO1xyXG4gICAgfVxyXG59XHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0YURldGFpbChkYXRhLCBpbmNsdWRlQ29udGVudCkge1xyXG4gICAgbGV0IGRldGFpbCA9IFwiXCI7XHJcbiAgICBpZiAoaXNBcnJheUJ1ZmZlcihkYXRhKSkge1xyXG4gICAgICAgIGRldGFpbCA9IGBCaW5hcnkgZGF0YSBvZiBsZW5ndGggJHtkYXRhLmJ5dGVMZW5ndGh9YDtcclxuICAgICAgICBpZiAoaW5jbHVkZUNvbnRlbnQpIHtcclxuICAgICAgICAgICAgZGV0YWlsICs9IGAuIENvbnRlbnQ6ICcke2Zvcm1hdEFycmF5QnVmZmVyKGRhdGEpfSdgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgZGV0YWlsID0gYFN0cmluZyBkYXRhIG9mIGxlbmd0aCAke2RhdGEubGVuZ3RofWA7XHJcbiAgICAgICAgaWYgKGluY2x1ZGVDb250ZW50KSB7XHJcbiAgICAgICAgICAgIGRldGFpbCArPSBgLiBDb250ZW50OiAnJHtkYXRhfSdgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBkZXRhaWw7XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBcnJheUJ1ZmZlcihkYXRhKSB7XHJcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XHJcbiAgICAvLyBVaW50OEFycmF5Lm1hcCBvbmx5IHN1cHBvcnRzIHJldHVybmluZyBhbm90aGVyIFVpbnQ4QXJyYXk/XHJcbiAgICBsZXQgc3RyID0gXCJcIjtcclxuICAgIHZpZXcuZm9yRWFjaCgobnVtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcGFkID0gbnVtIDwgMTYgPyBcIjBcIiA6IFwiXCI7XHJcbiAgICAgICAgc3RyICs9IGAweCR7cGFkfSR7bnVtLnRvU3RyaW5nKDE2KX0gYDtcclxuICAgIH0pO1xyXG4gICAgLy8gVHJpbSBvZiB0cmFpbGluZyBzcGFjZS5cclxuICAgIHJldHVybiBzdHIuc3Vic3RyaW5nKDAsIHN0ci5sZW5ndGggLSAxKTtcclxufVxyXG4vLyBBbHNvIGluIHNpZ25hbHItcHJvdG9jb2wtbXNncGFjay9VdGlscy50c1xyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJyYXlCdWZmZXIodmFsKSB7XHJcbiAgICByZXR1cm4gdmFsICYmIHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICAgICh2YWwgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fFxyXG4gICAgICAgICAgICAvLyBTb21ldGltZXMgd2UgZ2V0IGFuIEFycmF5QnVmZmVyIHRoYXQgZG9lc24ndCBzYXRpc2Z5IGluc3RhbmNlb2ZcclxuICAgICAgICAgICAgKHZhbC5jb25zdHJ1Y3RvciAmJiB2YWwuY29uc3RydWN0b3IubmFtZSA9PT0gXCJBcnJheUJ1ZmZlclwiKSk7XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kTWVzc2FnZShsb2dnZXIsIHRyYW5zcG9ydE5hbWUsIGh0dHBDbGllbnQsIHVybCwgY29udGVudCwgb3B0aW9ucykge1xyXG4gICAgY29uc3QgaGVhZGVycyA9IHt9O1xyXG4gICAgY29uc3QgW25hbWUsIHZhbHVlXSA9IGdldFVzZXJBZ2VudEhlYWRlcigpO1xyXG4gICAgaGVhZGVyc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgYCgke3RyYW5zcG9ydE5hbWV9IHRyYW5zcG9ydCkgc2VuZGluZyBkYXRhLiAke2dldERhdGFEZXRhaWwoY29udGVudCwgb3B0aW9ucy5sb2dNZXNzYWdlQ29udGVudCl9LmApO1xyXG4gICAgY29uc3QgcmVzcG9uc2VUeXBlID0gaXNBcnJheUJ1ZmZlcihjb250ZW50KSA/IFwiYXJyYXlidWZmZXJcIiA6IFwidGV4dFwiO1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBodHRwQ2xpZW50LnBvc3QodXJsLCB7XHJcbiAgICAgICAgY29udGVudCxcclxuICAgICAgICBoZWFkZXJzOiB7IC4uLmhlYWRlcnMsIC4uLm9wdGlvbnMuaGVhZGVycyB9LFxyXG4gICAgICAgIHJlc3BvbnNlVHlwZSxcclxuICAgICAgICB0aW1lb3V0OiBvcHRpb25zLnRpbWVvdXQsXHJcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiBvcHRpb25zLndpdGhDcmVkZW50aWFscyxcclxuICAgIH0pO1xyXG4gICAgbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgYCgke3RyYW5zcG9ydE5hbWV9IHRyYW5zcG9ydCkgcmVxdWVzdCBjb21wbGV0ZS4gUmVzcG9uc2Ugc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c0NvZGV9LmApO1xyXG59XHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTG9nZ2VyKGxvZ2dlcikge1xyXG4gICAgaWYgKGxvZ2dlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zb2xlTG9nZ2VyKExvZ0xldmVsLkluZm9ybWF0aW9uKTtcclxuICAgIH1cclxuICAgIGlmIChsb2dnZXIgPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gTnVsbExvZ2dlci5pbnN0YW5jZTtcclxuICAgIH1cclxuICAgIGlmIChsb2dnZXIubG9nICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gbG9nZ2VyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBDb25zb2xlTG9nZ2VyKGxvZ2dlcik7XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBTdWJqZWN0U3Vic2NyaXB0aW9uIHtcclxuICAgIGNvbnN0cnVjdG9yKHN1YmplY3QsIG9ic2VydmVyKSB7XHJcbiAgICAgICAgdGhpcy5fc3ViamVjdCA9IHN1YmplY3Q7XHJcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBvYnNlcnZlcjtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9zdWJqZWN0Lm9ic2VydmVycy5pbmRleE9mKHRoaXMuX29ic2VydmVyKTtcclxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdWJqZWN0Lm9ic2VydmVycy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fc3ViamVjdC5vYnNlcnZlcnMubGVuZ3RoID09PSAwICYmIHRoaXMuX3N1YmplY3QuY2FuY2VsQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ViamVjdC5jYW5jZWxDYWxsYmFjaygpLmNhdGNoKChfKSA9PiB7IH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIENvbnNvbGVMb2dnZXIge1xyXG4gICAgY29uc3RydWN0b3IobWluaW11bUxvZ0xldmVsKSB7XHJcbiAgICAgICAgdGhpcy5fbWluTGV2ZWwgPSBtaW5pbXVtTG9nTGV2ZWw7XHJcbiAgICAgICAgdGhpcy5vdXQgPSBjb25zb2xlO1xyXG4gICAgfVxyXG4gICAgbG9nKGxvZ0xldmVsLCBtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKGxvZ0xldmVsID49IHRoaXMuX21pbkxldmVsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGBbJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XSAke0xvZ0xldmVsW2xvZ0xldmVsXX06ICR7bWVzc2FnZX1gO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGxvZ0xldmVsKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIExvZ0xldmVsLkNyaXRpY2FsOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBMb2dMZXZlbC5FcnJvcjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dC5lcnJvcihtc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBMb2dMZXZlbC5XYXJuaW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3V0Lndhcm4obXNnKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgTG9nTGV2ZWwuSW5mb3JtYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXQuaW5mbyhtc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRlYnVnIG9ubHkgZ29lcyB0byBhdHRhY2hlZCBkZWJ1Z2dlcnMgaW4gTm9kZSwgc28gd2UgdXNlIGNvbnNvbGUubG9nIGZvciBUcmFjZSBhbmQgRGVidWdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dC5sb2cobXNnKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVzZXJBZ2VudEhlYWRlcigpIHtcclxuICAgIGxldCB1c2VyQWdlbnRIZWFkZXJOYW1lID0gXCJYLVNpZ25hbFItVXNlci1BZ2VudFwiO1xyXG4gICAgaWYgKFBsYXRmb3JtLmlzTm9kZSkge1xyXG4gICAgICAgIHVzZXJBZ2VudEhlYWRlck5hbWUgPSBcIlVzZXItQWdlbnRcIjtcclxuICAgIH1cclxuICAgIHJldHVybiBbdXNlckFnZW50SGVhZGVyTmFtZSwgY29uc3RydWN0VXNlckFnZW50KFZFUlNJT04sIGdldE9zTmFtZSgpLCBnZXRSdW50aW1lKCksIGdldFJ1bnRpbWVWZXJzaW9uKCkpXTtcclxufVxyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdFVzZXJBZ2VudCh2ZXJzaW9uLCBvcywgcnVudGltZSwgcnVudGltZVZlcnNpb24pIHtcclxuICAgIC8vIE1pY3Jvc29mdCBTaWduYWxSL1tWZXJzaW9uXSAoW0RldGFpbGVkIFZlcnNpb25dOyBbT3BlcmF0aW5nIFN5c3RlbV07IFtSdW50aW1lXTsgW1J1bnRpbWUgVmVyc2lvbl0pXHJcbiAgICBsZXQgdXNlckFnZW50ID0gXCJNaWNyb3NvZnQgU2lnbmFsUi9cIjtcclxuICAgIGNvbnN0IG1ham9yQW5kTWlub3IgPSB2ZXJzaW9uLnNwbGl0KFwiLlwiKTtcclxuICAgIHVzZXJBZ2VudCArPSBgJHttYWpvckFuZE1pbm9yWzBdfS4ke21ham9yQW5kTWlub3JbMV19YDtcclxuICAgIHVzZXJBZ2VudCArPSBgICgke3ZlcnNpb259OyBgO1xyXG4gICAgaWYgKG9zICYmIG9zICE9PSBcIlwiKSB7XHJcbiAgICAgICAgdXNlckFnZW50ICs9IGAke29zfTsgYDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVzZXJBZ2VudCArPSBcIlVua25vd24gT1M7IFwiO1xyXG4gICAgfVxyXG4gICAgdXNlckFnZW50ICs9IGAke3J1bnRpbWV9YDtcclxuICAgIGlmIChydW50aW1lVmVyc2lvbikge1xyXG4gICAgICAgIHVzZXJBZ2VudCArPSBgOyAke3J1bnRpbWVWZXJzaW9ufWA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB1c2VyQWdlbnQgKz0gXCI7IFVua25vd24gUnVudGltZSBWZXJzaW9uXCI7XHJcbiAgICB9XHJcbiAgICB1c2VyQWdlbnQgKz0gXCIpXCI7XHJcbiAgICByZXR1cm4gdXNlckFnZW50O1xyXG59XHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBzcGFjZWQtY29tbWVudFxyXG4vKiNfX1BVUkVfXyovIGZ1bmN0aW9uIGdldE9zTmFtZSgpIHtcclxuICAgIGlmIChQbGF0Zm9ybS5pc05vZGUpIHtcclxuICAgICAgICBzd2l0Y2ggKHByb2Nlc3MucGxhdGZvcm0pIHtcclxuICAgICAgICAgICAgY2FzZSBcIndpbjMyXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJXaW5kb3dzIE5UXCI7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkYXJ3aW5cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIm1hY09TXCI7XHJcbiAgICAgICAgICAgIGNhc2UgXCJsaW51eFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTGludXhcIjtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG59XHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBzcGFjZWQtY29tbWVudFxyXG4vKiNfX1BVUkVfXyovIGZ1bmN0aW9uIGdldFJ1bnRpbWVWZXJzaW9uKCkge1xyXG4gICAgaWYgKFBsYXRmb3JtLmlzTm9kZSkge1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzLnZlcnNpb25zLm5vZGU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcbmZ1bmN0aW9uIGdldFJ1bnRpbWUoKSB7XHJcbiAgICBpZiAoUGxhdGZvcm0uaXNOb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiTm9kZUpTXCI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gXCJCcm93c2VyXCI7XHJcbiAgICB9XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFcnJvclN0cmluZyhlKSB7XHJcbiAgICBpZiAoZS5zdGFjaykge1xyXG4gICAgICAgIHJldHVybiBlLnN0YWNrO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZS5tZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIGUubWVzc2FnZTtcclxuICAgIH1cclxuICAgIHJldHVybiBgJHtlfWA7XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHbG9iYWxUaGlzKCkge1xyXG4gICAgLy8gZ2xvYmFsVGhpcyBpcyBzZW1pLW5ldyBhbmQgbm90IGF2YWlsYWJsZSBpbiBOb2RlIHVudGlsIHYxMlxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbFRoaXM7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICByZXR1cm4gc2VsZjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbDtcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCBmaW5kIGdsb2JhbFwiKTtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1VdGlscy5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IEFib3J0RXJyb3IsIEh0dHBFcnJvciwgVGltZW91dEVycm9yIH0gZnJvbSBcIi4vRXJyb3JzXCI7XHJcbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBSZXNwb25zZSB9IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcclxuaW1wb3J0IHsgTG9nTGV2ZWwgfSBmcm9tIFwiLi9JTG9nZ2VyXCI7XHJcbmltcG9ydCB7IFBsYXRmb3JtLCBnZXRHbG9iYWxUaGlzLCBpc0FycmF5QnVmZmVyIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuZXhwb3J0IGNsYXNzIEZldGNoSHR0cENsaWVudCBleHRlbmRzIEh0dHBDbGllbnQge1xyXG4gICAgY29uc3RydWN0b3IobG9nZ2VyKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9sb2dnZXIgPSBsb2dnZXI7XHJcbiAgICAgICAgLy8gTm9kZSBhZGRlZCBhIGZldGNoIGltcGxlbWVudGF0aW9uIHRvIHRoZSBnbG9iYWwgc2NvcGUgc3RhcnRpbmcgaW4gdjE4LlxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gYWRkIGEgY29va2llIGphciBpbiBub2RlIHRvIGJlIGFibGUgdG8gc2hhcmUgY29va2llcyB3aXRoIFdlYlNvY2tldFxyXG4gICAgICAgIGlmICh0eXBlb2YgZmV0Y2ggPT09IFwidW5kZWZpbmVkXCIgfHwgUGxhdGZvcm0uaXNOb2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEluIG9yZGVyIHRvIGlnbm9yZSB0aGUgZHluYW1pYyByZXF1aXJlIGluIHdlYnBhY2sgYnVpbGRzIHdlIG5lZWQgdG8gZG8gdGhpcyBtYWdpY1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlOiBUUyBkb2Vzbid0IGtub3cgYWJvdXQgdGhlc2UgbmFtZXNcclxuICAgICAgICAgICAgY29uc3QgcmVxdWlyZUZ1bmMgPSB0eXBlb2YgX193ZWJwYWNrX3JlcXVpcmVfXyA9PT0gXCJmdW5jdGlvblwiID8gX19ub25fd2VicGFja19yZXF1aXJlX18gOiByZXF1aXJlO1xyXG4gICAgICAgICAgICAvLyBDb29raWVzIGFyZW4ndCBhdXRvbWF0aWNhbGx5IGhhbmRsZWQgaW4gTm9kZSBzbyB3ZSBuZWVkIHRvIGFkZCBhIENvb2tpZUphciB0byBwcmVzZXJ2ZSBjb29raWVzIGFjcm9zcyByZXF1ZXN0c1xyXG4gICAgICAgICAgICB0aGlzLl9qYXIgPSBuZXcgKHJlcXVpcmVGdW5jKFwidG91Z2gtY29va2llXCIpKS5Db29raWVKYXIoKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmZXRjaCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZmV0Y2hUeXBlID0gcmVxdWlyZUZ1bmMoXCJub2RlLWZldGNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVXNlIGZldGNoIGZyb20gTm9kZSBpZiBhdmFpbGFibGVcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZldGNoVHlwZSA9IGZldGNoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIG5vZGUtZmV0Y2ggZG9lc24ndCBoYXZlIGEgbmljZSBBUEkgZm9yIGdldHRpbmcgYW5kIHNldHRpbmcgY29va2llc1xyXG4gICAgICAgICAgICAvLyBmZXRjaC1jb29raWUgd2lsbCB3cmFwIGEgZmV0Y2ggaW1wbGVtZW50YXRpb24gd2l0aCBhIGRlZmF1bHQgQ29va2llSmFyIG9yIGEgcHJvdmlkZWQgb25lXHJcbiAgICAgICAgICAgIHRoaXMuX2ZldGNoVHlwZSA9IHJlcXVpcmVGdW5jKFwiZmV0Y2gtY29va2llXCIpKHRoaXMuX2ZldGNoVHlwZSwgdGhpcy5famFyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZldGNoVHlwZSA9IGZldGNoLmJpbmQoZ2V0R2xvYmFsVGhpcygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBBYm9ydENvbnRyb2xsZXIgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgLy8gSW4gb3JkZXIgdG8gaWdub3JlIHRoZSBkeW5hbWljIHJlcXVpcmUgaW4gd2VicGFjayBidWlsZHMgd2UgbmVlZCB0byBkbyB0aGlzIG1hZ2ljXHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmU6IFRTIGRvZXNuJ3Qga25vdyBhYm91dCB0aGVzZSBuYW1lc1xyXG4gICAgICAgICAgICBjb25zdCByZXF1aXJlRnVuYyA9IHR5cGVvZiBfX3dlYnBhY2tfcmVxdWlyZV9fID09PSBcImZ1bmN0aW9uXCIgPyBfX25vbl93ZWJwYWNrX3JlcXVpcmVfXyA6IHJlcXVpcmU7XHJcbiAgICAgICAgICAgIC8vIE5vZGUgbmVlZHMgRXZlbnRMaXN0ZW5lciBtZXRob2RzIG9uIEFib3J0Q29udHJvbGxlciB3aGljaCBvdXIgY3VzdG9tIHBvbHlmaWxsIGRvZXNuJ3QgcHJvdmlkZVxyXG4gICAgICAgICAgICB0aGlzLl9hYm9ydENvbnRyb2xsZXJUeXBlID0gcmVxdWlyZUZ1bmMoXCJhYm9ydC1jb250cm9sbGVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fYWJvcnRDb250cm9sbGVyVHlwZSA9IEFib3J0Q29udHJvbGxlcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiogQGluaGVyaXREb2MgKi9cclxuICAgIGFzeW5jIHNlbmQocmVxdWVzdCkge1xyXG4gICAgICAgIC8vIENoZWNrIHRoYXQgYWJvcnQgd2FzIG5vdCBzaWduYWxlZCBiZWZvcmUgY2FsbGluZyBzZW5kXHJcbiAgICAgICAgaWYgKHJlcXVlc3QuYWJvcnRTaWduYWwgJiYgcmVxdWVzdC5hYm9ydFNpZ25hbC5hYm9ydGVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBBYm9ydEVycm9yKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghcmVxdWVzdC5tZXRob2QpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWV0aG9kIGRlZmluZWQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJlcXVlc3QudXJsKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHVybCBkZWZpbmVkLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgYWJvcnRDb250cm9sbGVyID0gbmV3IHRoaXMuX2Fib3J0Q29udHJvbGxlclR5cGUoKTtcclxuICAgICAgICBsZXQgZXJyb3I7XHJcbiAgICAgICAgLy8gSG9vayBvdXIgYWJvcnRTaWduYWwgaW50byB0aGUgYWJvcnQgY29udHJvbGxlclxyXG4gICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsKSB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuYWJvcnRTaWduYWwub25hYm9ydCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgQWJvcnRFcnJvcigpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBJZiBhIHRpbWVvdXQgaGFzIGJlZW4gcGFzc2VkIGluLCBzZXR1cCBhIHRpbWVvdXQgdG8gY2FsbCBhYm9ydFxyXG4gICAgICAgIC8vIFR5cGUgbmVlZHMgdG8gYmUgYW55IHRvIGZpdCB3aW5kb3cuc2V0VGltZW91dCBhbmQgTm9kZUpTLnNldFRpbWVvdXRcclxuICAgICAgICBsZXQgdGltZW91dElkID0gbnVsbDtcclxuICAgICAgICBpZiAocmVxdWVzdC50aW1lb3V0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1zVGltZW91dCA9IHJlcXVlc3QudGltZW91dDtcclxuICAgICAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhYm9ydENvbnRyb2xsZXIuYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuV2FybmluZywgYFRpbWVvdXQgZnJvbSBIVFRQIHJlcXVlc3QuYCk7XHJcbiAgICAgICAgICAgICAgICBlcnJvciA9IG5ldyBUaW1lb3V0RXJyb3IoKTtcclxuICAgICAgICAgICAgfSwgbXNUaW1lb3V0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlcXVlc3QuY29udGVudCA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICByZXF1ZXN0LmNvbnRlbnQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZXF1ZXN0LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgLy8gRXhwbGljaXRseSBzZXR0aW5nIHRoZSBDb250ZW50LVR5cGUgaGVhZGVyIGZvciBSZWFjdCBOYXRpdmUgb24gQW5kcm9pZCBwbGF0Zm9ybS5cclxuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0gcmVxdWVzdC5oZWFkZXJzIHx8IHt9O1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheUJ1ZmZlcihyZXF1ZXN0LmNvbnRlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gXCJ0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLThcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9mZXRjaFR5cGUocmVxdWVzdC51cmwsIHtcclxuICAgICAgICAgICAgICAgIGJvZHk6IHJlcXVlc3QuY29udGVudCxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiBcIm5vLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFsczogcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPT09IHRydWUgPyBcImluY2x1ZGVcIiA6IFwic2FtZS1vcmlnaW5cIixcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIlgtUmVxdWVzdGVkLVdpdGhcIjogXCJYTUxIdHRwUmVxdWVzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIC4uLnJlcXVlc3QuaGVhZGVycyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IHJlcXVlc3QubWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdDogXCJmb2xsb3dcIixcclxuICAgICAgICAgICAgICAgIHNpZ25hbDogYWJvcnRDb250cm9sbGVyLnNpZ25hbCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5XYXJuaW5nLCBgRXJyb3IgZnJvbSBIVFRQIHJlcXVlc3QuICR7ZX0uYCk7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICBpZiAodGltZW91dElkKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5hYm9ydFNpZ25hbCkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5hYm9ydFNpZ25hbC5vbmFib3J0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGF3YWl0IGRlc2VyaWFsaXplQ29udGVudChyZXNwb25zZSwgXCJ0ZXh0XCIpO1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKGVycm9yTWVzc2FnZSB8fCByZXNwb25zZS5zdGF0dXNUZXh0LCByZXNwb25zZS5zdGF0dXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjb250ZW50ID0gZGVzZXJpYWxpemVDb250ZW50KHJlc3BvbnNlLCByZXF1ZXN0LnJlc3BvbnNlVHlwZSk7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IGNvbnRlbnQ7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwUmVzcG9uc2UocmVzcG9uc2Uuc3RhdHVzLCByZXNwb25zZS5zdGF0dXNUZXh0LCBwYXlsb2FkKTtcclxuICAgIH1cclxuICAgIGdldENvb2tpZVN0cmluZyh1cmwpIHtcclxuICAgICAgICBsZXQgY29va2llcyA9IFwiXCI7XHJcbiAgICAgICAgaWYgKFBsYXRmb3JtLmlzTm9kZSAmJiB0aGlzLl9qYXIpIHtcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZTogdW51c2VkIHZhcmlhYmxlXHJcbiAgICAgICAgICAgIHRoaXMuX2phci5nZXRDb29raWVzKHVybCwgKGUsIGMpID0+IGNvb2tpZXMgPSBjLmpvaW4oXCI7IFwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb29raWVzO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGRlc2VyaWFsaXplQ29udGVudChyZXNwb25zZSwgcmVzcG9uc2VUeXBlKSB7XHJcbiAgICBsZXQgY29udGVudDtcclxuICAgIHN3aXRjaCAocmVzcG9uc2VUeXBlKSB7XHJcbiAgICAgICAgY2FzZSBcImFycmF5YnVmZmVyXCI6XHJcbiAgICAgICAgICAgIGNvbnRlbnQgPSByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwidGV4dFwiOlxyXG4gICAgICAgICAgICBjb250ZW50ID0gcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiYmxvYlwiOlxyXG4gICAgICAgIGNhc2UgXCJkb2N1bWVudFwiOlxyXG4gICAgICAgIGNhc2UgXCJqc29uXCI6XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtyZXNwb25zZVR5cGV9IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY29udGVudCA9IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY29udGVudDtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1GZXRjaEh0dHBDbGllbnQuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBBYm9ydEVycm9yLCBIdHRwRXJyb3IsIFRpbWVvdXRFcnJvciB9IGZyb20gXCIuL0Vycm9yc1wiO1xyXG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwUmVzcG9uc2UgfSBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBpc0FycmF5QnVmZmVyIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuZXhwb3J0IGNsYXNzIFhockh0dHBDbGllbnQgZXh0ZW5kcyBIdHRwQ2xpZW50IHtcclxuICAgIGNvbnN0cnVjdG9yKGxvZ2dlcikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyID0gbG9nZ2VyO1xyXG4gICAgfVxyXG4gICAgLyoqIEBpbmhlcml0RG9jICovXHJcbiAgICBzZW5kKHJlcXVlc3QpIHtcclxuICAgICAgICAvLyBDaGVjayB0aGF0IGFib3J0IHdhcyBub3Qgc2lnbmFsZWQgYmVmb3JlIGNhbGxpbmcgc2VuZFxyXG4gICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsICYmIHJlcXVlc3QuYWJvcnRTaWduYWwuYWJvcnRlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEFib3J0RXJyb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghcmVxdWVzdC5tZXRob2QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIk5vIG1ldGhvZCBkZWZpbmVkLlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghcmVxdWVzdC51cmwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIk5vIHVybCBkZWZpbmVkLlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpO1xyXG4gICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPT09IHVuZGVmaW5lZCA/IHRydWUgOiByZXF1ZXN0LndpdGhDcmVkZW50aWFscztcclxuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJYLVJlcXVlc3RlZC1XaXRoXCIsIFwiWE1MSHR0cFJlcXVlc3RcIik7XHJcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmNvbnRlbnQgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3QuY29udGVudCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFeHBsaWNpdGx5IHNldHRpbmcgdGhlIENvbnRlbnQtVHlwZSBoZWFkZXIgZm9yIFJlYWN0IE5hdGl2ZSBvbiBBbmRyb2lkIHBsYXRmb3JtLlxyXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXlCdWZmZXIocmVxdWVzdC5jb250ZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLThcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IHJlcXVlc3QuaGVhZGVycztcclxuICAgICAgICAgICAgaWYgKGhlYWRlcnMpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGhlYWRlcnMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGhlYWRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgaGVhZGVyc1toZWFkZXJdKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnJlc3BvbnNlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHJlcXVlc3QucmVzcG9uc2VUeXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0U2lnbmFsLm9uYWJvcnQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBBYm9ydEVycm9yKCkpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxdWVzdC50aW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICB4aHIudGltZW91dCA9IHJlcXVlc3QudGltZW91dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4aHIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuYWJvcnRTaWduYWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0U2lnbmFsLm9uYWJvcnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ldyBIdHRwUmVzcG9uc2UoeGhyLnN0YXR1cywgeGhyLnN0YXR1c1RleHQsIHhoci5yZXNwb25zZSB8fCB4aHIucmVzcG9uc2VUZXh0KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEh0dHBFcnJvcih4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dCB8fCB4aHIuc3RhdHVzVGV4dCwgeGhyLnN0YXR1cykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB4aHIub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuV2FybmluZywgYEVycm9yIGZyb20gSFRUUCByZXF1ZXN0LiAke3hoci5zdGF0dXN9OiAke3hoci5zdGF0dXNUZXh0fS5gKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgSHR0cEVycm9yKHhoci5zdGF0dXNUZXh0LCB4aHIuc3RhdHVzKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHhoci5vbnRpbWVvdXQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLldhcm5pbmcsIGBUaW1lb3V0IGZyb20gSFRUUCByZXF1ZXN0LmApO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBUaW1lb3V0RXJyb3IoKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHhoci5zZW5kKHJlcXVlc3QuY29udGVudCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9WGhySHR0cENsaWVudC5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IEFib3J0RXJyb3IgfSBmcm9tIFwiLi9FcnJvcnNcIjtcclxuaW1wb3J0IHsgRmV0Y2hIdHRwQ2xpZW50IH0gZnJvbSBcIi4vRmV0Y2hIdHRwQ2xpZW50XCI7XHJcbmltcG9ydCB7IEh0dHBDbGllbnQgfSBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XHJcbmltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuaW1wb3J0IHsgWGhySHR0cENsaWVudCB9IGZyb20gXCIuL1hockh0dHBDbGllbnRcIjtcclxuLyoqIERlZmF1bHQgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5IdHRwQ2xpZW50fS4gKi9cclxuZXhwb3J0IGNsYXNzIERlZmF1bHRIdHRwQ2xpZW50IGV4dGVuZHMgSHR0cENsaWVudCB7XHJcbiAgICAvKiogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5EZWZhdWx0SHR0cENsaWVudH0sIHVzaW5nIHRoZSBwcm92aWRlZCB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLklMb2dnZXJ9IHRvIGxvZyBtZXNzYWdlcy4gKi9cclxuICAgIGNvbnN0cnVjdG9yKGxvZ2dlcikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmZXRjaCAhPT0gXCJ1bmRlZmluZWRcIiB8fCBQbGF0Zm9ybS5pc05vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5faHR0cENsaWVudCA9IG5ldyBGZXRjaEh0dHBDbGllbnQobG9nZ2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2h0dHBDbGllbnQgPSBuZXcgWGhySHR0cENsaWVudChsb2dnZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gdXNhYmxlIEh0dHBDbGllbnQgZm91bmQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKiBAaW5oZXJpdERvYyAqL1xyXG4gICAgc2VuZChyZXF1ZXN0KSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBhYm9ydCB3YXMgbm90IHNpZ25hbGVkIGJlZm9yZSBjYWxsaW5nIHNlbmRcclxuICAgICAgICBpZiAocmVxdWVzdC5hYm9ydFNpZ25hbCAmJiByZXF1ZXN0LmFib3J0U2lnbmFsLmFib3J0ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBBYm9ydEVycm9yKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJlcXVlc3QubWV0aG9kKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJObyBtZXRob2QgZGVmaW5lZC5cIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJlcXVlc3QudXJsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJObyB1cmwgZGVmaW5lZC5cIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5faHR0cENsaWVudC5zZW5kKHJlcXVlc3QpO1xyXG4gICAgfVxyXG4gICAgZ2V0Q29va2llU3RyaW5nKHVybCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9odHRwQ2xpZW50LmdldENvb2tpZVN0cmluZyh1cmwpO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURlZmF1bHRIdHRwQ2xpZW50LmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLy8gTm90IGV4cG9ydGVkIGZyb20gaW5kZXhcclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBUZXh0TWVzc2FnZUZvcm1hdCB7XHJcbiAgICBzdGF0aWMgd3JpdGUob3V0cHV0KSB7XHJcbiAgICAgICAgcmV0dXJuIGAke291dHB1dH0ke1RleHRNZXNzYWdlRm9ybWF0LlJlY29yZFNlcGFyYXRvcn1gO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHBhcnNlKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKGlucHV0W2lucHV0Lmxlbmd0aCAtIDFdICE9PSBUZXh0TWVzc2FnZUZvcm1hdC5SZWNvcmRTZXBhcmF0b3IpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWVzc2FnZSBpcyBpbmNvbXBsZXRlLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBpbnB1dC5zcGxpdChUZXh0TWVzc2FnZUZvcm1hdC5SZWNvcmRTZXBhcmF0b3IpO1xyXG4gICAgICAgIG1lc3NhZ2VzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiBtZXNzYWdlcztcclxuICAgIH1cclxufVxyXG5UZXh0TWVzc2FnZUZvcm1hdC5SZWNvcmRTZXBhcmF0b3JDb2RlID0gMHgxZTtcclxuVGV4dE1lc3NhZ2VGb3JtYXQuUmVjb3JkU2VwYXJhdG9yID0gU3RyaW5nLmZyb21DaGFyQ29kZShUZXh0TWVzc2FnZUZvcm1hdC5SZWNvcmRTZXBhcmF0b3JDb2RlKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9VGV4dE1lc3NhZ2VGb3JtYXQuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBUZXh0TWVzc2FnZUZvcm1hdCB9IGZyb20gXCIuL1RleHRNZXNzYWdlRm9ybWF0XCI7XHJcbmltcG9ydCB7IGlzQXJyYXlCdWZmZXIgfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIEhhbmRzaGFrZVByb3RvY29sIHtcclxuICAgIC8vIEhhbmRzaGFrZSByZXF1ZXN0IGlzIGFsd2F5cyBKU09OXHJcbiAgICB3cml0ZUhhbmRzaGFrZVJlcXVlc3QoaGFuZHNoYWtlUmVxdWVzdCkge1xyXG4gICAgICAgIHJldHVybiBUZXh0TWVzc2FnZUZvcm1hdC53cml0ZShKU09OLnN0cmluZ2lmeShoYW5kc2hha2VSZXF1ZXN0KSk7XHJcbiAgICB9XHJcbiAgICBwYXJzZUhhbmRzaGFrZVJlc3BvbnNlKGRhdGEpIHtcclxuICAgICAgICBsZXQgbWVzc2FnZURhdGE7XHJcbiAgICAgICAgbGV0IHJlbWFpbmluZ0RhdGE7XHJcbiAgICAgICAgaWYgKGlzQXJyYXlCdWZmZXIoZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gRm9ybWF0IGlzIGJpbmFyeSBidXQgc3RpbGwgbmVlZCB0byByZWFkIEpTT04gdGV4dCBmcm9tIGhhbmRzaGFrZSByZXNwb25zZVxyXG4gICAgICAgICAgICBjb25zdCBiaW5hcnlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvckluZGV4ID0gYmluYXJ5RGF0YS5pbmRleE9mKFRleHRNZXNzYWdlRm9ybWF0LlJlY29yZFNlcGFyYXRvckNvZGUpO1xyXG4gICAgICAgICAgICBpZiAoc2VwYXJhdG9ySW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXNzYWdlIGlzIGluY29tcGxldGUuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNvbnRlbnQgYmVmb3JlIHNlcGFyYXRvciBpcyBoYW5kc2hha2UgcmVzcG9uc2VcclxuICAgICAgICAgICAgLy8gb3B0aW9uYWwgY29udGVudCBhZnRlciBpcyBhZGRpdGlvbmFsIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGVuZ3RoID0gc2VwYXJhdG9ySW5kZXggKyAxO1xyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYmluYXJ5RGF0YS5zbGljZSgwLCByZXNwb25zZUxlbmd0aCkpKTtcclxuICAgICAgICAgICAgcmVtYWluaW5nRGF0YSA9IChiaW5hcnlEYXRhLmJ5dGVMZW5ndGggPiByZXNwb25zZUxlbmd0aCkgPyBiaW5hcnlEYXRhLnNsaWNlKHJlc3BvbnNlTGVuZ3RoKS5idWZmZXIgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dERhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICBjb25zdCBzZXBhcmF0b3JJbmRleCA9IHRleHREYXRhLmluZGV4T2YoVGV4dE1lc3NhZ2VGb3JtYXQuUmVjb3JkU2VwYXJhdG9yKTtcclxuICAgICAgICAgICAgaWYgKHNlcGFyYXRvckluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWVzc2FnZSBpcyBpbmNvbXBsZXRlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjb250ZW50IGJlZm9yZSBzZXBhcmF0b3IgaXMgaGFuZHNoYWtlIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIG9wdGlvbmFsIGNvbnRlbnQgYWZ0ZXIgaXMgYWRkaXRpb25hbCBtZXNzYWdlc1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUxlbmd0aCA9IHNlcGFyYXRvckluZGV4ICsgMTtcclxuICAgICAgICAgICAgbWVzc2FnZURhdGEgPSB0ZXh0RGF0YS5zdWJzdHJpbmcoMCwgcmVzcG9uc2VMZW5ndGgpO1xyXG4gICAgICAgICAgICByZW1haW5pbmdEYXRhID0gKHRleHREYXRhLmxlbmd0aCA+IHJlc3BvbnNlTGVuZ3RoKSA/IHRleHREYXRhLnN1YnN0cmluZyhyZXNwb25zZUxlbmd0aCkgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIHNob3VsZCBoYXZlIGp1c3QgdGhlIHNpbmdsZSBoYW5kc2hha2UgbWVzc2FnZVxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gVGV4dE1lc3NhZ2VGb3JtYXQucGFyc2UobWVzc2FnZURhdGEpO1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gSlNPTi5wYXJzZShtZXNzYWdlc1swXSk7XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgYSBoYW5kc2hha2UgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2VNZXNzYWdlID0gcmVzcG9uc2U7XHJcbiAgICAgICAgLy8gbXVsdGlwbGUgbWVzc2FnZXMgY291bGQgaGF2ZSBhcnJpdmVkIHdpdGggaGFuZHNoYWtlXHJcbiAgICAgICAgLy8gcmV0dXJuIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBwYXJzZWQgYXMgdXN1YWwsIG9yIG51bGwgaWYgYWxsIHBhcnNlZFxyXG4gICAgICAgIHJldHVybiBbcmVtYWluaW5nRGF0YSwgcmVzcG9uc2VNZXNzYWdlXTtcclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1IYW5kc2hha2VQcm90b2NvbC5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbi8qKiBEZWZpbmVzIHRoZSB0eXBlIG9mIGEgSHViIE1lc3NhZ2UuICovXHJcbmV4cG9ydCB2YXIgTWVzc2FnZVR5cGU7XHJcbihmdW5jdGlvbiAoTWVzc2FnZVR5cGUpIHtcclxuICAgIC8qKiBJbmRpY2F0ZXMgdGhlIG1lc3NhZ2UgaXMgYW4gSW52b2NhdGlvbiBtZXNzYWdlIGFuZCBpbXBsZW1lbnRzIHRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkludm9jYXRpb25NZXNzYWdlfSBpbnRlcmZhY2UuICovXHJcbiAgICBNZXNzYWdlVHlwZVtNZXNzYWdlVHlwZVtcIkludm9jYXRpb25cIl0gPSAxXSA9IFwiSW52b2NhdGlvblwiO1xyXG4gICAgLyoqIEluZGljYXRlcyB0aGUgbWVzc2FnZSBpcyBhIFN0cmVhbUl0ZW0gbWVzc2FnZSBhbmQgaW1wbGVtZW50cyB0aGUge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5TdHJlYW1JdGVtTWVzc2FnZX0gaW50ZXJmYWNlLiAqL1xyXG4gICAgTWVzc2FnZVR5cGVbTWVzc2FnZVR5cGVbXCJTdHJlYW1JdGVtXCJdID0gMl0gPSBcIlN0cmVhbUl0ZW1cIjtcclxuICAgIC8qKiBJbmRpY2F0ZXMgdGhlIG1lc3NhZ2UgaXMgYSBDb21wbGV0aW9uIG1lc3NhZ2UgYW5kIGltcGxlbWVudHMgdGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuQ29tcGxldGlvbk1lc3NhZ2V9IGludGVyZmFjZS4gKi9cclxuICAgIE1lc3NhZ2VUeXBlW01lc3NhZ2VUeXBlW1wiQ29tcGxldGlvblwiXSA9IDNdID0gXCJDb21wbGV0aW9uXCI7XHJcbiAgICAvKiogSW5kaWNhdGVzIHRoZSBtZXNzYWdlIGlzIGEgU3RyZWFtIEludm9jYXRpb24gbWVzc2FnZSBhbmQgaW1wbGVtZW50cyB0aGUge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5TdHJlYW1JbnZvY2F0aW9uTWVzc2FnZX0gaW50ZXJmYWNlLiAqL1xyXG4gICAgTWVzc2FnZVR5cGVbTWVzc2FnZVR5cGVbXCJTdHJlYW1JbnZvY2F0aW9uXCJdID0gNF0gPSBcIlN0cmVhbUludm9jYXRpb25cIjtcclxuICAgIC8qKiBJbmRpY2F0ZXMgdGhlIG1lc3NhZ2UgaXMgYSBDYW5jZWwgSW52b2NhdGlvbiBtZXNzYWdlIGFuZCBpbXBsZW1lbnRzIHRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkNhbmNlbEludm9jYXRpb25NZXNzYWdlfSBpbnRlcmZhY2UuICovXHJcbiAgICBNZXNzYWdlVHlwZVtNZXNzYWdlVHlwZVtcIkNhbmNlbEludm9jYXRpb25cIl0gPSA1XSA9IFwiQ2FuY2VsSW52b2NhdGlvblwiO1xyXG4gICAgLyoqIEluZGljYXRlcyB0aGUgbWVzc2FnZSBpcyBhIFBpbmcgbWVzc2FnZSBhbmQgaW1wbGVtZW50cyB0aGUge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5QaW5nTWVzc2FnZX0gaW50ZXJmYWNlLiAqL1xyXG4gICAgTWVzc2FnZVR5cGVbTWVzc2FnZVR5cGVbXCJQaW5nXCJdID0gNl0gPSBcIlBpbmdcIjtcclxuICAgIC8qKiBJbmRpY2F0ZXMgdGhlIG1lc3NhZ2UgaXMgYSBDbG9zZSBtZXNzYWdlIGFuZCBpbXBsZW1lbnRzIHRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkNsb3NlTWVzc2FnZX0gaW50ZXJmYWNlLiAqL1xyXG4gICAgTWVzc2FnZVR5cGVbTWVzc2FnZVR5cGVbXCJDbG9zZVwiXSA9IDddID0gXCJDbG9zZVwiO1xyXG4gICAgTWVzc2FnZVR5cGVbTWVzc2FnZVR5cGVbXCJBY2tcIl0gPSA4XSA9IFwiQWNrXCI7XHJcbiAgICBNZXNzYWdlVHlwZVtNZXNzYWdlVHlwZVtcIlNlcXVlbmNlXCJdID0gOV0gPSBcIlNlcXVlbmNlXCI7XHJcbn0pKE1lc3NhZ2VUeXBlIHx8IChNZXNzYWdlVHlwZSA9IHt9KSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUlIdWJQcm90b2NvbC5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IFN1YmplY3RTdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG4vKiogU3RyZWFtIGltcGxlbWVudGF0aW9uIHRvIHN0cmVhbSBpdGVtcyB0byB0aGUgc2VydmVyLiAqL1xyXG5leHBvcnQgY2xhc3MgU3ViamVjdCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm9ic2VydmVycyA9IFtdO1xyXG4gICAgfVxyXG4gICAgbmV4dChpdGVtKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBvYnNlcnZlciBvZiB0aGlzLm9ic2VydmVycykge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVycm9yKGVycikge1xyXG4gICAgICAgIGZvciAoY29uc3Qgb2JzZXJ2ZXIgb2YgdGhpcy5vYnNlcnZlcnMpIHtcclxuICAgICAgICAgICAgaWYgKG9ic2VydmVyLmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5lcnJvcihlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29tcGxldGUoKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBvYnNlcnZlciBvZiB0aGlzLm9ic2VydmVycykge1xyXG4gICAgICAgICAgICBpZiAob2JzZXJ2ZXIuY29tcGxldGUpIHtcclxuICAgICAgICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXIpIHtcclxuICAgICAgICB0aGlzLm9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcclxuICAgICAgICByZXR1cm4gbmV3IFN1YmplY3RTdWJzY3JpcHRpb24odGhpcywgb2JzZXJ2ZXIpO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN1YmplY3QuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBNZXNzYWdlVHlwZSB9IGZyb20gXCIuL0lIdWJQcm90b2NvbFwiO1xyXG5pbXBvcnQgeyBpc0FycmF5QnVmZmVyIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBNZXNzYWdlQnVmZmVyIHtcclxuICAgIGNvbnN0cnVjdG9yKHByb3RvY29sLCBjb25uZWN0aW9uLCBidWZmZXJTaXplKSB7XHJcbiAgICAgICAgdGhpcy5fYnVmZmVyU2l6ZSA9IDEwMDAwMDtcclxuICAgICAgICB0aGlzLl9tZXNzYWdlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3RvdGFsTWVzc2FnZUNvdW50ID0gMDtcclxuICAgICAgICB0aGlzLl93YWl0Rm9yU2VxdWVuY2VNZXNzYWdlID0gZmFsc2U7XHJcbiAgICAgICAgLy8gTWVzc2FnZSBJRHMgc3RhcnQgYXQgMSBhbmQgYWx3YXlzIGluY3JlbWVudCBieSAxXHJcbiAgICAgICAgdGhpcy5fbmV4dFJlY2VpdmluZ1NlcXVlbmNlSWQgPSAxO1xyXG4gICAgICAgIHRoaXMuX2xhdGVzdFJlY2VpdmVkU2VxdWVuY2VJZCA9IDA7XHJcbiAgICAgICAgdGhpcy5fYnVmZmVyZWRCeXRlQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdEluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9wcm90b2NvbCA9IHByb3RvY29sO1xyXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlclNpemUgPSBidWZmZXJTaXplO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgX3NlbmQobWVzc2FnZSkge1xyXG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRNZXNzYWdlID0gdGhpcy5fcHJvdG9jb2wud3JpdGVNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIGxldCBiYWNrcHJlc3N1cmVQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgLy8gT25seSBjb3VudCBpbnZvY2F0aW9uIG1lc3NhZ2VzLiBBY2tzLCBwaW5ncywgZXRjLiBkb24ndCBuZWVkIHRvIGJlIHJlc2VudCBvbiByZWNvbm5lY3RcclxuICAgICAgICBpZiAodGhpcy5faXNJbnZvY2F0aW9uTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICB0aGlzLl90b3RhbE1lc3NhZ2VDb3VudCsrO1xyXG4gICAgICAgICAgICBsZXQgYmFja3ByZXNzdXJlUHJvbWlzZVJlc29sdmVyID0gKCkgPT4geyB9O1xyXG4gICAgICAgICAgICBsZXQgYmFja3ByZXNzdXJlUHJvbWlzZVJlamVjdG9yID0gKCkgPT4geyB9O1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheUJ1ZmZlcihzZXJpYWxpemVkTWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2J1ZmZlcmVkQnl0ZUNvdW50ICs9IHNlcmlhbGl6ZWRNZXNzYWdlLmJ5dGVMZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXJlZEJ5dGVDb3VudCArPSBzZXJpYWxpemVkTWVzc2FnZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX2J1ZmZlcmVkQnl0ZUNvdW50ID49IHRoaXMuX2J1ZmZlclNpemUpIHtcclxuICAgICAgICAgICAgICAgIGJhY2twcmVzc3VyZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja3ByZXNzdXJlUHJvbWlzZVJlc29sdmVyID0gcmVzb2x2ZTtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrcHJlc3N1cmVQcm9taXNlUmVqZWN0b3IgPSByZWplY3Q7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9tZXNzYWdlcy5wdXNoKG5ldyBCdWZmZXJlZEl0ZW0oc2VyaWFsaXplZE1lc3NhZ2UsIHRoaXMuX3RvdGFsTWVzc2FnZUNvdW50LCBiYWNrcHJlc3N1cmVQcm9taXNlUmVzb2x2ZXIsIGJhY2twcmVzc3VyZVByb21pc2VSZWplY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIHNldCBpdCBtZWFucyB3ZSBhcmUgcmVjb25uZWN0aW5nIG9yIHJlc2VuZGluZ1xyXG4gICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIHNlbmQgb24gYSBkaXNjb25uZWN0ZWQgY29ubmVjdGlvblxyXG4gICAgICAgICAgICAvLyBBbmQgd2UgZG9uJ3Qgd2FudCB0byBzZW5kIGlmIHJlc2VuZCBpcyBydW5uaW5nIHNpbmNlIHRoYXQgd291bGQgbWVhbiBzZW5kaW5nXHJcbiAgICAgICAgICAgIC8vIHRoaXMgbWVzc2FnZSB0d2ljZVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3JlY29ubmVjdEluUHJvZ3Jlc3MpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Nvbm5lY3Rpb24uc2VuZChzZXJpYWxpemVkTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2gge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNjb25uZWN0ZWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgYmFja3ByZXNzdXJlUHJvbWlzZTtcclxuICAgIH1cclxuICAgIF9hY2soYWNrTWVzc2FnZSkge1xyXG4gICAgICAgIGxldCBuZXdlc3RBY2tlZE1lc3NhZ2UgPSAtMTtcclxuICAgICAgICAvLyBGaW5kIGluZGV4IG9mIG5ld2VzdCBtZXNzYWdlIGJlaW5nIGFja2VkXHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuX21lc3NhZ2VzLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fbWVzc2FnZXNbaW5kZXhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5faWQgPD0gYWNrTWVzc2FnZS5zZXF1ZW5jZUlkKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdlc3RBY2tlZE1lc3NhZ2UgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5QnVmZmVyKGVsZW1lbnQuX21lc3NhZ2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyZWRCeXRlQ291bnQgLT0gZWxlbWVudC5fbWVzc2FnZS5ieXRlTGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyZWRCeXRlQ291bnQgLT0gZWxlbWVudC5fbWVzc2FnZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlIGl0ZW1zIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gc2VudCBhbmQgYWNrZWRcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuX3Jlc29sdmVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fYnVmZmVyZWRCeXRlQ291bnQgPCB0aGlzLl9idWZmZXJTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlIGl0ZW1zIHRoYXQgbm93IGZhbGwgdW5kZXIgdGhlIGJ1ZmZlciBsaW1pdCBidXQgaGF2ZW4ndCBiZWVuIGFja2VkXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50Ll9yZXNvbHZlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5ld2VzdEFja2VkTWVzc2FnZSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgLy8gV2UncmUgcmVtb3ZpbmcgZXZlcnl0aGluZyBpbmNsdWRpbmcgdGhlIG1lc3NhZ2UgcG9pbnRlZCB0bywgc28gYWRkIDFcclxuICAgICAgICAgICAgdGhpcy5fbWVzc2FnZXMgPSB0aGlzLl9tZXNzYWdlcy5zbGljZShuZXdlc3RBY2tlZE1lc3NhZ2UgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfc2hvdWxkUHJvY2Vzc01lc3NhZ2UobWVzc2FnZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl93YWl0Rm9yU2VxdWVuY2VNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnR5cGUgIT09IE1lc3NhZ2VUeXBlLlNlcXVlbmNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93YWl0Rm9yU2VxdWVuY2VNZXNzYWdlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBObyBzcGVjaWFsIHByb2Nlc3NpbmcgZm9yIGFja3MsIHBpbmdzLCBldGMuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9pc0ludm9jYXRpb25NZXNzYWdlKG1lc3NhZ2UpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjdXJyZW50SWQgPSB0aGlzLl9uZXh0UmVjZWl2aW5nU2VxdWVuY2VJZDtcclxuICAgICAgICB0aGlzLl9uZXh0UmVjZWl2aW5nU2VxdWVuY2VJZCsrO1xyXG4gICAgICAgIGlmIChjdXJyZW50SWQgPD0gdGhpcy5fbGF0ZXN0UmVjZWl2ZWRTZXF1ZW5jZUlkKSB7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50SWQgPT09IHRoaXMuX2xhdGVzdFJlY2VpdmVkU2VxdWVuY2VJZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2hvdWxkIG9ubHkgaGl0IHRoaXMgaWYgd2UganVzdCByZWNvbm5lY3RlZCBhbmQgdGhlIHNlcnZlciBpcyBzZW5kaW5nXHJcbiAgICAgICAgICAgICAgICAvLyBNZXNzYWdlcyBpdCBoYXMgYnVmZmVyZWQsIHdoaWNoIHdvdWxkIG1lYW4gaXQgaGFzbid0IHNlZW4gYW4gQWNrIGZvciB0aGVzZSBtZXNzYWdlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWNrVGltZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZ25vcmUsIHRoaXMgaXMgYSBkdXBsaWNhdGUgbWVzc2FnZVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2xhdGVzdFJlY2VpdmVkU2VxdWVuY2VJZCA9IGN1cnJlbnRJZDtcclxuICAgICAgICAvLyBPbmx5IHN0YXJ0IHRoZSB0aW1lciBmb3Igc2VuZGluZyBhbiBBY2sgbWVzc2FnZSB3aGVuIHdlIGhhdmUgYSBtZXNzYWdlIHRvIGFjay4gVGhpcyBhbHNvIGNvbnZlbmllbnRseSBzb2x2ZXNcclxuICAgICAgICAvLyB0aW1lciB0aHJvdHRsaW5nIGJ5IG5vdCBoYXZpbmcgYSByZWN1cnNpdmUgdGltZXIsIGFuZCBieSBzdGFydGluZyB0aGUgdGltZXIgdmlhIGEgbmV0d29yayBjYWxsIChyZWN2KVxyXG4gICAgICAgIHRoaXMuX2Fja1RpbWVyKCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBfcmVzZXRTZXF1ZW5jZShtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc2VxdWVuY2VJZCA+IHRoaXMuX25leHRSZWNlaXZpbmdTZXF1ZW5jZUlkKSB7XHJcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZmxvYXRpbmctcHJvbWlzZXNcclxuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5zdG9wKG5ldyBFcnJvcihcIlNlcXVlbmNlIElEIGdyZWF0ZXIgdGhhbiBhbW91bnQgb2YgbWVzc2FnZXMgd2UndmUgcmVjZWl2ZWQuXCIpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9uZXh0UmVjZWl2aW5nU2VxdWVuY2VJZCA9IG1lc3NhZ2Uuc2VxdWVuY2VJZDtcclxuICAgIH1cclxuICAgIF9kaXNjb25uZWN0ZWQoKSB7XHJcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0SW5Qcm9ncmVzcyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fd2FpdEZvclNlcXVlbmNlTWVzc2FnZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBhc3luYyBfcmVzZW5kKCkge1xyXG4gICAgICAgIGNvbnN0IHNlcXVlbmNlSWQgPSB0aGlzLl9tZXNzYWdlcy5sZW5ndGggIT09IDBcclxuICAgICAgICAgICAgPyB0aGlzLl9tZXNzYWdlc1swXS5faWRcclxuICAgICAgICAgICAgOiB0aGlzLl90b3RhbE1lc3NhZ2VDb3VudCArIDE7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5fY29ubmVjdGlvbi5zZW5kKHRoaXMuX3Byb3RvY29sLndyaXRlTWVzc2FnZSh7IHR5cGU6IE1lc3NhZ2VUeXBlLlNlcXVlbmNlLCBzZXF1ZW5jZUlkIH0pKTtcclxuICAgICAgICAvLyBHZXQgYSBsb2NhbCB2YXJpYWJsZSB0byB0aGUgX21lc3NhZ2VzLCBqdXN0IGluIGNhc2UgbWVzc2FnZXMgYXJlIGFja2VkIHdoaWxlIHJlc2VuZGluZ1xyXG4gICAgICAgIC8vIFdoaWNoIHdvdWxkIHNsaWNlIHRoZSBfbWVzc2FnZXMgYXJyYXkgKHdoaWNoIGNyZWF0ZXMgYSBuZXcgY29weSlcclxuICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMuX21lc3NhZ2VzO1xyXG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBtZXNzYWdlcykge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9jb25uZWN0aW9uLnNlbmQoZWxlbWVudC5fbWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdEluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIF9kaXNwb3NlKGVycm9yKSB7XHJcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiYgZXJyb3IgIT09IHZvaWQgMCA/IGVycm9yIDogKGVycm9yID0gbmV3IEVycm9yKFwiVW5hYmxlIHRvIHJlY29ubmVjdCB0byBzZXJ2ZXIuXCIpKTtcclxuICAgICAgICAvLyBVbmJsb2NrIGJhY2twcmVzc3VyZSBpZiBhbnlcclxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgdGhpcy5fbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5fcmVqZWN0b3IoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pc0ludm9jYXRpb25NZXNzYWdlKG1lc3NhZ2UpIHtcclxuICAgICAgICAvLyBUaGVyZSBpcyBubyB3YXkgdG8gY2hlY2sgaWYgc29tZXRoaW5nIGltcGxlbWVudHMgYW4gaW50ZXJmYWNlLlxyXG4gICAgICAgIC8vIFNvIHdlIGluZGl2aWR1YWxseSBjaGVjayB0aGUgbWVzc2FnZXMgaW4gYSBzd2l0Y2ggc3RhdGVtZW50LlxyXG4gICAgICAgIC8vIFRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBtaXNzIGFueSBtZXNzYWdlIHR5cGVzIHdlIHJlbHkgb24gdGhlIGNvbXBpbGVyXHJcbiAgICAgICAgLy8gc2VlaW5nIHRoZSBmdW5jdGlvbiByZXR1cm5zIGEgdmFsdWUgYW5kIGl0IHdpbGwgZG8gdGhlXHJcbiAgICAgICAgLy8gZXhoYXVzdGl2ZSBjaGVjayBmb3IgdXMgb24gdGhlIHN3aXRjaCBzdGF0ZW1lbnQsIHNpbmNlIHdlIGRvbid0IHVzZSAnY2FzZSBkZWZhdWx0J1xyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuSW52b2NhdGlvbjpcclxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TdHJlYW1JdGVtOlxyXG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNvbXBsZXRpb246XHJcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU3RyZWFtSW52b2NhdGlvbjpcclxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5DYW5jZWxJbnZvY2F0aW9uOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQ2xvc2U6XHJcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU2VxdWVuY2U6XHJcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUGluZzpcclxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5BY2s6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2Fja1RpbWVyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9hY2tUaW1lckhhbmRsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Fja1RpbWVySGFuZGxlID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcmVjb25uZWN0SW5Qcm9ncmVzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9jb25uZWN0aW9uLnNlbmQodGhpcy5fcHJvdG9jb2wud3JpdGVNZXNzYWdlKHsgdHlwZTogTWVzc2FnZVR5cGUuQWNrLCBzZXF1ZW5jZUlkOiB0aGlzLl9sYXRlc3RSZWNlaXZlZFNlcXVlbmNlSWQgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgZXJyb3JzLCB0aGF0IG1lYW5zIHRoZSBjb25uZWN0aW9uIGlzIGNsb3NlZCBhbmQgd2UgZG9uJ3QgY2FyZSBhYm91dCB0aGUgQWNrIG1lc3NhZ2UgYW55bW9yZS5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIHsgfVxyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2Fja1RpbWVySGFuZGxlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Fja1RpbWVySGFuZGxlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgLy8gMSBzZWNvbmQgZGVsYXkgc28gd2UgZG9uJ3Qgc3BhbSBBY2sgbWVzc2FnZXMgaWYgdGhlcmUgYXJlIG1hbnkgbWVzc2FnZXMgYmVpbmcgcmVjZWl2ZWQgYXQgb25jZS5cclxuICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmNsYXNzIEJ1ZmZlcmVkSXRlbSB7XHJcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBpZCwgcmVzb2x2ZXIsIHJlamVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy5fbWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgICAgdGhpcy5faWQgPSBpZDtcclxuICAgICAgICB0aGlzLl9yZXNvbHZlciA9IHJlc29sdmVyO1xyXG4gICAgICAgIHRoaXMuX3JlamVjdG9yID0gcmVqZWN0b3I7XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWVzc2FnZUJ1ZmZlci5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IEhhbmRzaGFrZVByb3RvY29sIH0gZnJvbSBcIi4vSGFuZHNoYWtlUHJvdG9jb2xcIjtcclxuaW1wb3J0IHsgQWJvcnRFcnJvciB9IGZyb20gXCIuL0Vycm9yc1wiO1xyXG5pbXBvcnQgeyBNZXNzYWdlVHlwZSB9IGZyb20gXCIuL0lIdWJQcm90b2NvbFwiO1xyXG5pbXBvcnQgeyBMb2dMZXZlbCB9IGZyb20gXCIuL0lMb2dnZXJcIjtcclxuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gXCIuL1N1YmplY3RcIjtcclxuaW1wb3J0IHsgQXJnLCBnZXRFcnJvclN0cmluZywgUGxhdGZvcm0gfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG5pbXBvcnQgeyBNZXNzYWdlQnVmZmVyIH0gZnJvbSBcIi4vTWVzc2FnZUJ1ZmZlclwiO1xyXG5jb25zdCBERUZBVUxUX1RJTUVPVVRfSU5fTVMgPSAzMCAqIDEwMDA7XHJcbmNvbnN0IERFRkFVTFRfUElOR19JTlRFUlZBTF9JTl9NUyA9IDE1ICogMTAwMDtcclxuY29uc3QgREVGQVVMVF9TVEFURUZVTF9SRUNPTk5FQ1RfQlVGRkVSX1NJWkUgPSAxMDAwMDA7XHJcbi8qKiBEZXNjcmliZXMgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHtAbGluayBIdWJDb25uZWN0aW9ufSB0byB0aGUgc2VydmVyLiAqL1xyXG5leHBvcnQgdmFyIEh1YkNvbm5lY3Rpb25TdGF0ZTtcclxuKGZ1bmN0aW9uIChIdWJDb25uZWN0aW9uU3RhdGUpIHtcclxuICAgIC8qKiBUaGUgaHViIGNvbm5lY3Rpb24gaXMgZGlzY29ubmVjdGVkLiAqL1xyXG4gICAgSHViQ29ubmVjdGlvblN0YXRlW1wiRGlzY29ubmVjdGVkXCJdID0gXCJEaXNjb25uZWN0ZWRcIjtcclxuICAgIC8qKiBUaGUgaHViIGNvbm5lY3Rpb24gaXMgY29ubmVjdGluZy4gKi9cclxuICAgIEh1YkNvbm5lY3Rpb25TdGF0ZVtcIkNvbm5lY3RpbmdcIl0gPSBcIkNvbm5lY3RpbmdcIjtcclxuICAgIC8qKiBUaGUgaHViIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkLiAqL1xyXG4gICAgSHViQ29ubmVjdGlvblN0YXRlW1wiQ29ubmVjdGVkXCJdID0gXCJDb25uZWN0ZWRcIjtcclxuICAgIC8qKiBUaGUgaHViIGNvbm5lY3Rpb24gaXMgZGlzY29ubmVjdGluZy4gKi9cclxuICAgIEh1YkNvbm5lY3Rpb25TdGF0ZVtcIkRpc2Nvbm5lY3RpbmdcIl0gPSBcIkRpc2Nvbm5lY3RpbmdcIjtcclxuICAgIC8qKiBUaGUgaHViIGNvbm5lY3Rpb24gaXMgcmVjb25uZWN0aW5nLiAqL1xyXG4gICAgSHViQ29ubmVjdGlvblN0YXRlW1wiUmVjb25uZWN0aW5nXCJdID0gXCJSZWNvbm5lY3RpbmdcIjtcclxufSkoSHViQ29ubmVjdGlvblN0YXRlIHx8IChIdWJDb25uZWN0aW9uU3RhdGUgPSB7fSkpO1xyXG4vKiogUmVwcmVzZW50cyBhIGNvbm5lY3Rpb24gdG8gYSBTaWduYWxSIEh1Yi4gKi9cclxuZXhwb3J0IGNsYXNzIEh1YkNvbm5lY3Rpb24ge1xyXG4gICAgLyoqIEBpbnRlcm5hbCAqL1xyXG4gICAgLy8gVXNpbmcgYSBwdWJsaWMgc3RhdGljIGZhY3RvcnkgbWV0aG9kIG1lYW5zIHdlIGNhbiBoYXZlIGEgcHJpdmF0ZSBjb25zdHJ1Y3RvciBhbmQgYW4gX2ludGVybmFsX1xyXG4gICAgLy8gY3JlYXRlIG1ldGhvZCB0aGF0IGNhbiBiZSB1c2VkIGJ5IEh1YkNvbm5lY3Rpb25CdWlsZGVyLiBBbiBcImludGVybmFsXCIgY29uc3RydWN0b3Igd291bGQganVzdFxyXG4gICAgLy8gYmUgc3RyaXBwZWQgYXdheSBhbmQgdGhlICcuZC50cycgZmlsZSB3b3VsZCBoYXZlIG5vIGNvbnN0cnVjdG9yLCB3aGljaCBpcyBpbnRlcnByZXRlZCBhcyBhXHJcbiAgICAvLyBwdWJsaWMgcGFyYW1ldGVyLWxlc3MgY29uc3RydWN0b3IuXHJcbiAgICBzdGF0aWMgY3JlYXRlKGNvbm5lY3Rpb24sIGxvZ2dlciwgcHJvdG9jb2wsIHJlY29ubmVjdFBvbGljeSwgc2VydmVyVGltZW91dEluTWlsbGlzZWNvbmRzLCBrZWVwQWxpdmVJbnRlcnZhbEluTWlsbGlzZWNvbmRzLCBzdGF0ZWZ1bFJlY29ubmVjdEJ1ZmZlclNpemUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEh1YkNvbm5lY3Rpb24oY29ubmVjdGlvbiwgbG9nZ2VyLCBwcm90b2NvbCwgcmVjb25uZWN0UG9saWN5LCBzZXJ2ZXJUaW1lb3V0SW5NaWxsaXNlY29uZHMsIGtlZXBBbGl2ZUludGVydmFsSW5NaWxsaXNlY29uZHMsIHN0YXRlZnVsUmVjb25uZWN0QnVmZmVyU2l6ZSk7XHJcbiAgICB9XHJcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uLCBsb2dnZXIsIHByb3RvY29sLCByZWNvbm5lY3RQb2xpY3ksIHNlcnZlclRpbWVvdXRJbk1pbGxpc2Vjb25kcywga2VlcEFsaXZlSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcywgc3RhdGVmdWxSZWNvbm5lY3RCdWZmZXJTaXplKSB7XHJcbiAgICAgICAgdGhpcy5fbmV4dEtlZXBBbGl2ZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fZnJlZXplRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5XYXJuaW5nLCBcIlRoZSBwYWdlIGlzIGJlaW5nIGZyb3plbiwgdGhpcyB3aWxsIGxpa2VseSBsZWFkIHRvIHRoZSBjb25uZWN0aW9uIGJlaW5nIGNsb3NlZCBhbmQgbWVzc2FnZXMgYmVpbmcgbG9zdC4gRm9yIG1vcmUgaW5mb3JtYXRpb24gc2VlIHRoZSBkb2NzIGF0IGh0dHBzOi8vbGVhcm4ubWljcm9zb2Z0LmNvbS9hc3BuZXQvY29yZS9zaWduYWxyL2phdmFzY3JpcHQtY2xpZW50I2JzbGVlcFwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKGNvbm5lY3Rpb24sIFwiY29ubmVjdGlvblwiKTtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZChsb2dnZXIsIFwibG9nZ2VyXCIpO1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKHByb3RvY29sLCBcInByb3RvY29sXCIpO1xyXG4gICAgICAgIHRoaXMuc2VydmVyVGltZW91dEluTWlsbGlzZWNvbmRzID0gc2VydmVyVGltZW91dEluTWlsbGlzZWNvbmRzICE9PSBudWxsICYmIHNlcnZlclRpbWVvdXRJbk1pbGxpc2Vjb25kcyAhPT0gdm9pZCAwID8gc2VydmVyVGltZW91dEluTWlsbGlzZWNvbmRzIDogREVGQVVMVF9USU1FT1VUX0lOX01TO1xyXG4gICAgICAgIHRoaXMua2VlcEFsaXZlSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcyA9IGtlZXBBbGl2ZUludGVydmFsSW5NaWxsaXNlY29uZHMgIT09IG51bGwgJiYga2VlcEFsaXZlSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcyAhPT0gdm9pZCAwID8ga2VlcEFsaXZlSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcyA6IERFRkFVTFRfUElOR19JTlRFUlZBTF9JTl9NUztcclxuICAgICAgICB0aGlzLl9zdGF0ZWZ1bFJlY29ubmVjdEJ1ZmZlclNpemUgPSBzdGF0ZWZ1bFJlY29ubmVjdEJ1ZmZlclNpemUgIT09IG51bGwgJiYgc3RhdGVmdWxSZWNvbm5lY3RCdWZmZXJTaXplICE9PSB2b2lkIDAgPyBzdGF0ZWZ1bFJlY29ubmVjdEJ1ZmZlclNpemUgOiBERUZBVUxUX1NUQVRFRlVMX1JFQ09OTkVDVF9CVUZGRVJfU0laRTtcclxuICAgICAgICB0aGlzLl9sb2dnZXIgPSBsb2dnZXI7XHJcbiAgICAgICAgdGhpcy5fcHJvdG9jb2wgPSBwcm90b2NvbDtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xyXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdFBvbGljeSA9IHJlY29ubmVjdFBvbGljeTtcclxuICAgICAgICB0aGlzLl9oYW5kc2hha2VQcm90b2NvbCA9IG5ldyBIYW5kc2hha2VQcm90b2NvbCgpO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbnJlY2VpdmUgPSAoZGF0YSkgPT4gdGhpcy5fcHJvY2Vzc0luY29taW5nRGF0YShkYXRhKTtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ub25jbG9zZSA9IChlcnJvcikgPT4gdGhpcy5fY29ubmVjdGlvbkNsb3NlZChlcnJvcik7XHJcbiAgICAgICAgdGhpcy5fY2FsbGJhY2tzID0ge307XHJcbiAgICAgICAgdGhpcy5fbWV0aG9kcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2Nsb3NlZENhbGxiYWNrcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGluZ0NhbGxiYWNrcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGVkQ2FsbGJhY2tzID0gW107XHJcbiAgICAgICAgdGhpcy5faW52b2NhdGlvbklkID0gMDtcclxuICAgICAgICB0aGlzLl9yZWNlaXZlZEhhbmRzaGFrZVJlc3BvbnNlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvblN0YXRlID0gSHViQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RlZDtcclxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX2NhY2hlZFBpbmdNZXNzYWdlID0gdGhpcy5fcHJvdG9jb2wud3JpdGVNZXNzYWdlKHsgdHlwZTogTWVzc2FnZVR5cGUuUGluZyB9KTtcclxuICAgIH1cclxuICAgIC8qKiBJbmRpY2F0ZXMgdGhlIHN0YXRlIG9mIHRoZSB7QGxpbmsgSHViQ29ubmVjdGlvbn0gdG8gdGhlIHNlcnZlci4gKi9cclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvblN0YXRlO1xyXG4gICAgfVxyXG4gICAgLyoqIFJlcHJlc2VudHMgdGhlIGNvbm5lY3Rpb24gaWQgb2YgdGhlIHtAbGluayBIdWJDb25uZWN0aW9ufSBvbiB0aGUgc2VydmVyLiBUaGUgY29ubmVjdGlvbiBpZCB3aWxsIGJlIG51bGwgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBlaXRoZXJcclxuICAgICAqICBpbiB0aGUgZGlzY29ubmVjdGVkIHN0YXRlIG9yIGlmIHRoZSBuZWdvdGlhdGlvbiBzdGVwIHdhcyBza2lwcGVkLlxyXG4gICAgICovXHJcbiAgICBnZXQgY29ubmVjdGlvbklkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24gPyAodGhpcy5jb25uZWN0aW9uLmNvbm5lY3Rpb25JZCB8fCBudWxsKSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICAvKiogSW5kaWNhdGVzIHRoZSB1cmwgb2YgdGhlIHtAbGluayBIdWJDb25uZWN0aW9ufSB0byB0aGUgc2VydmVyLiAqL1xyXG4gICAgZ2V0IGJhc2VVcmwoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5iYXNlVXJsIHx8IFwiXCI7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFNldHMgYSBuZXcgdXJsIGZvciB0aGUgSHViQ29ubmVjdGlvbi4gTm90ZSB0aGF0IHRoZSB1cmwgY2FuIG9ubHkgYmUgY2hhbmdlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIGluIGVpdGhlciB0aGUgRGlzY29ubmVjdGVkIG9yXHJcbiAgICAgKiBSZWNvbm5lY3Rpbmcgc3RhdGVzLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgdXJsIHRvIGNvbm5lY3QgdG8uXHJcbiAgICAgKi9cclxuICAgIHNldCBiYXNlVXJsKHVybCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgIT09IEh1YkNvbm5lY3Rpb25TdGF0ZS5EaXNjb25uZWN0ZWQgJiYgdGhpcy5fY29ubmVjdGlvblN0YXRlICE9PSBIdWJDb25uZWN0aW9uU3RhdGUuUmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBIdWJDb25uZWN0aW9uIG11c3QgYmUgaW4gdGhlIERpc2Nvbm5lY3RlZCBvciBSZWNvbm5lY3Rpbmcgc3RhdGUgdG8gY2hhbmdlIHRoZSB1cmwuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXVybCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgSHViQ29ubmVjdGlvbiB1cmwgbXVzdCBiZSBhIHZhbGlkIHVybC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5iYXNlVXJsID0gdXJsO1xyXG4gICAgfVxyXG4gICAgLyoqIFN0YXJ0cyB0aGUgY29ubmVjdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZXN0YWJsaXNoZWQsIG9yIHJlamVjdHMgd2l0aCBhbiBlcnJvci5cclxuICAgICAqL1xyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRQcm9taXNlID0gdGhpcy5fc3RhcnRXaXRoU3RhdGVUcmFuc2l0aW9ucygpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdGFydFByb21pc2U7XHJcbiAgICB9XHJcbiAgICBhc3luYyBfc3RhcnRXaXRoU3RhdGVUcmFuc2l0aW9ucygpIHtcclxuICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlICE9PSBIdWJDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3Qgc3RhcnQgYSBIdWJDb25uZWN0aW9uIHRoYXQgaXMgbm90IGluIHRoZSAnRGlzY29ubmVjdGVkJyBzdGF0ZS5cIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBIdWJDb25uZWN0aW9uU3RhdGUuQ29ubmVjdGluZztcclxuICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBcIlN0YXJ0aW5nIEh1YkNvbm5lY3Rpb24uXCIpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3N0YXJ0SW50ZXJuYWwoKTtcclxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzQnJvd3Nlcikge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nIHdoZW4gdGhlIGJyb3dzZXIgZnJlZXplcyB0aGUgdGFiIHNvIHVzZXJzIGtub3cgd2h5IHRoZWlyIGNvbm5lY3Rpb24gdW5leHBlY3RlZGx5IHN0b3BwZWQgd29ya2luZ1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJmcmVlemVcIiwgdGhpcy5fZnJlZXplRXZlbnRMaXN0ZW5lcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGlvblN0YXRlID0gSHViQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RlZDtcclxuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGlvblN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBcIkh1YkNvbm5lY3Rpb24gY29ubmVjdGVkIHN1Y2Nlc3NmdWxseS5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9IEh1YkNvbm5lY3Rpb25TdGF0ZS5EaXNjb25uZWN0ZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIGBIdWJDb25uZWN0aW9uIGZhaWxlZCB0byBzdGFydCBzdWNjZXNzZnVsbHkgYmVjYXVzZSBvZiBlcnJvciAnJHtlfScuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBfc3RhcnRJbnRlcm5hbCgpIHtcclxuICAgICAgICB0aGlzLl9zdG9wRHVyaW5nU3RhcnRFcnJvciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9yZWNlaXZlZEhhbmRzaGFrZVJlc3BvbnNlID0gZmFsc2U7XHJcbiAgICAgICAgLy8gU2V0IHVwIHRoZSBwcm9taXNlIGJlZm9yZSBhbnkgY29ubmVjdGlvbiBpcyAocmUpc3RhcnRlZCBvdGhlcndpc2UgaXQgY291bGQgcmFjZSB3aXRoIHJlY2VpdmVkIG1lc3NhZ2VzXHJcbiAgICAgICAgY29uc3QgaGFuZHNoYWtlUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5faGFuZHNoYWtlUmVzb2x2ZXIgPSByZXNvbHZlO1xyXG4gICAgICAgICAgICB0aGlzLl9oYW5kc2hha2VSZWplY3RlciA9IHJlamVjdDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBhd2FpdCB0aGlzLmNvbm5lY3Rpb24uc3RhcnQodGhpcy5fcHJvdG9jb2wudHJhbnNmZXJGb3JtYXQpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCB2ZXJzaW9uID0gdGhpcy5fcHJvdG9jb2wudmVyc2lvbjtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3Rpb24uZmVhdHVyZXMucmVjb25uZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdGF0ZWZ1bCBSZWNvbm5lY3Qgc3RhcnRzIHdpdGggSHViUHJvdG9jb2wgdmVyc2lvbiAyLCBuZXdlciBjbGllbnRzIGNvbm5lY3RpbmcgdG8gb2xkZXIgc2VydmVycyB3aWxsIGZhaWwgdG8gY29ubmVjdCBkdWUgdG9cclxuICAgICAgICAgICAgICAgIC8vIHRoZSBoYW5kc2hha2Ugb25seSBzdXBwb3J0aW5nIHZlcnNpb24gMSwgc28gd2Ugd2lsbCB0cnkgdG8gc2VuZCB2ZXJzaW9uIDEgZHVyaW5nIHRoZSBoYW5kc2hha2UgdG8ga2VlcCBvbGQgc2VydmVycyB3b3JraW5nLlxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgaGFuZHNoYWtlUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHByb3RvY29sOiB0aGlzLl9wcm90b2NvbC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbixcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgXCJTZW5kaW5nIGhhbmRzaGFrZSByZXF1ZXN0LlwiKTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2VuZE1lc3NhZ2UodGhpcy5faGFuZHNoYWtlUHJvdG9jb2wud3JpdGVIYW5kc2hha2VSZXF1ZXN0KGhhbmRzaGFrZVJlcXVlc3QpKTtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgYFVzaW5nIEh1YlByb3RvY29sICcke3RoaXMuX3Byb3RvY29sLm5hbWV9Jy5gKTtcclxuICAgICAgICAgICAgLy8gZGVmZW5zaXZlbHkgY2xlYW51cCB0aW1lb3V0IGluIGNhc2Ugd2UgcmVjZWl2ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgc2VydmVyIGJlZm9yZSB3ZSBmaW5pc2ggc3RhcnRcclxuICAgICAgICAgICAgdGhpcy5fY2xlYW51cFRpbWVvdXQoKTtcclxuICAgICAgICAgICAgdGhpcy5fcmVzZXRUaW1lb3V0UGVyaW9kKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0S2VlcEFsaXZlSW50ZXJ2YWwoKTtcclxuICAgICAgICAgICAgYXdhaXQgaGFuZHNoYWtlUHJvbWlzZTtcclxuICAgICAgICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdG8gY2hlY2sgdGhlIHN0b3BEdXJpbmdTdGFydEVycm9yIGluc3RlYWQgb2YganVzdCByZWx5aW5nIG9uIHRoZSBoYW5kc2hha2VQcm9taXNlXHJcbiAgICAgICAgICAgIC8vIGJlaW5nIHJlamVjdGVkIG9uIGNsb3NlLCBiZWNhdXNlIHRoaXMgY29udGludWF0aW9uIGNhbiBydW4gYWZ0ZXIgYm90aCB0aGUgaGFuZHNoYWtlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHlcclxuICAgICAgICAgICAgLy8gYW5kIHRoZSBjb25uZWN0aW9uIHdhcyBjbG9zZWQuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdG9wRHVyaW5nU3RhcnRFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdG8gdGhyb3cgaW5zdGVhZCBvZiByZXR1cm5pbmcgYSByZWplY3RlZCBwcm9taXNlLCBiZWNhdXNlIHdlIGRvbid0IHdhbnQgdG8gYWxsb3cgYW55IHN0YXRlXHJcbiAgICAgICAgICAgICAgICAvLyB0cmFuc2l0aW9ucyB0byBvY2N1ciBiZXR3ZWVuIG5vdyBhbmQgdGhlIGNhbGxpbmcgY29kZSBvYnNlcnZpbmcgdGhlIGV4Y2VwdGlvbnMuIFJldHVybmluZyBhIHJlamVjdGVkIHByb21pc2VcclxuICAgICAgICAgICAgICAgIC8vIHdpbGwgY2F1c2UgdGhlIGNhbGxpbmcgY29udGludWF0aW9uIHRvIGdldCBzY2hlZHVsZWQgdG8gcnVuIGxhdGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aHJvdy1saXRlcmFsXHJcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLl9zdG9wRHVyaW5nU3RhcnRFcnJvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB1c2VTdGF0ZWZ1bFJlY29ubmVjdCA9IHRoaXMuY29ubmVjdGlvbi5mZWF0dXJlcy5yZWNvbm5lY3QgfHwgZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh1c2VTdGF0ZWZ1bFJlY29ubmVjdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZUJ1ZmZlciA9IG5ldyBNZXNzYWdlQnVmZmVyKHRoaXMuX3Byb3RvY29sLCB0aGlzLmNvbm5lY3Rpb24sIHRoaXMuX3N0YXRlZnVsUmVjb25uZWN0QnVmZmVyU2l6ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZmVhdHVyZXMuZGlzY29ubmVjdGVkID0gdGhpcy5fbWVzc2FnZUJ1ZmZlci5fZGlzY29ubmVjdGVkLmJpbmQodGhpcy5fbWVzc2FnZUJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZmVhdHVyZXMucmVzZW5kID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tZXNzYWdlQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlQnVmZmVyLl9yZXNlbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb25uZWN0aW9uLmZlYXR1cmVzLmluaGVyZW50S2VlcEFsaXZlKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9zZW5kTWVzc2FnZSh0aGlzLl9jYWNoZWRQaW5nTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYEh1YiBoYW5kc2hha2UgZmFpbGVkIHdpdGggZXJyb3IgJyR7ZX0nIGR1cmluZyBzdGFydCgpLiBTdG9wcGluZyBIdWJDb25uZWN0aW9uLmApO1xyXG4gICAgICAgICAgICB0aGlzLl9jbGVhbnVwVGltZW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9jbGVhbnVwUGluZ1RpbWVyKCk7XHJcbiAgICAgICAgICAgIC8vIEh0dHBDb25uZWN0aW9uLnN0b3AoKSBzaG91bGQgbm90IGNvbXBsZXRlIHVudGlsIGFmdGVyIHRoZSBvbmNsb3NlIGNhbGxiYWNrIGlzIGludm9rZWQuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgd2lsbCB0cmFuc2l0aW9uIHRoZSBIdWJDb25uZWN0aW9uIHRvIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGUgYmVmb3JlIEh0dHBDb25uZWN0aW9uLnN0b3AoKSBjb21wbGV0ZXMuXHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29ubmVjdGlvbi5zdG9wKGUpO1xyXG4gICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKiBTdG9wcyB0aGUgY29ubmVjdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgdGVybWluYXRlZCwgb3IgcmVqZWN0cyB3aXRoIGFuIGVycm9yLlxyXG4gICAgICovXHJcbiAgICBhc3luYyBzdG9wKCkge1xyXG4gICAgICAgIC8vIENhcHR1cmUgdGhlIHN0YXJ0IHByb21pc2UgYmVmb3JlIHRoZSBjb25uZWN0aW9uIG1pZ2h0IGJlIHJlc3RhcnRlZCBpbiBhbiBvbmNsb3NlIGNhbGxiYWNrLlxyXG4gICAgICAgIGNvbnN0IHN0YXJ0UHJvbWlzZSA9IHRoaXMuX3N0YXJ0UHJvbWlzZTtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZmVhdHVyZXMucmVjb25uZWN0ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fc3RvcFByb21pc2UgPSB0aGlzLl9zdG9wSW50ZXJuYWwoKTtcclxuICAgICAgICBhd2FpdCB0aGlzLl9zdG9wUHJvbWlzZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBBd2FpdGluZyB1bmRlZmluZWQgY29udGludWVzIGltbWVkaWF0ZWx5XHJcbiAgICAgICAgICAgIGF3YWl0IHN0YXJ0UHJvbWlzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgLy8gVGhpcyBleGNlcHRpb24gaXMgcmV0dXJuZWQgdG8gdGhlIHVzZXIgYXMgYSByZWplY3RlZCBQcm9taXNlIGZyb20gdGhlIHN0YXJ0IG1ldGhvZC5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfc3RvcEludGVybmFsKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gSHViQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBgQ2FsbCB0byBIdWJDb25uZWN0aW9uLnN0b3AoJHtlcnJvcn0pIGlnbm9yZWQgYmVjYXVzZSBpdCBpcyBhbHJlYWR5IGluIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGUuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gSHViQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYENhbGwgdG8gSHR0cENvbm5lY3Rpb24uc3RvcCgke2Vycm9yfSkgaWdub3JlZCBiZWNhdXNlIHRoZSBjb25uZWN0aW9uIGlzIGFscmVhZHkgaW4gdGhlIGRpc2Nvbm5lY3Rpbmcgc3RhdGUuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdG9wUHJvbWlzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9jb25uZWN0aW9uU3RhdGU7XHJcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvblN0YXRlID0gSHViQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3Rpbmc7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgXCJTdG9wcGluZyBIdWJDb25uZWN0aW9uLlwiKTtcclxuICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0RGVsYXlIYW5kbGUpIHtcclxuICAgICAgICAgICAgLy8gV2UncmUgaW4gYSByZWNvbm5lY3QgZGVsYXkgd2hpY2ggbWVhbnMgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbiBpcyBjdXJyZW50bHkgYWxyZWFkeSBzdG9wcGVkLlxyXG4gICAgICAgICAgICAvLyBKdXN0IGNsZWFyIHRoZSBoYW5kbGUgdG8gc3RvcCB0aGUgcmVjb25uZWN0IGxvb3AgKHdoaWNoIG5vIG9uZSBpcyB3YWl0aW5nIG9uIHRoYW5rZnVsbHkpIGFuZFxyXG4gICAgICAgICAgICAvLyBmaXJlIHRoZSBvbmNsb3NlIGNhbGxiYWNrcy5cclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgXCJDb25uZWN0aW9uIHN0b3BwZWQgZHVyaW5nIHJlY29ubmVjdCBkZWxheS4gRG9uZSByZWNvbm5lY3RpbmcuXCIpO1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVjb25uZWN0RGVsYXlIYW5kbGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3REZWxheUhhbmRsZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgdGhpcy5fY29tcGxldGVDbG9zZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gSHViQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWZsb2F0aW5nLXByb21pc2VzXHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmRDbG9zZU1lc3NhZ2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fY2xlYW51cFRpbWVvdXQoKTtcclxuICAgICAgICB0aGlzLl9jbGVhbnVwUGluZ1RpbWVyKCk7XHJcbiAgICAgICAgdGhpcy5fc3RvcER1cmluZ1N0YXJ0RXJyb3IgPSBlcnJvciB8fCBuZXcgQWJvcnRFcnJvcihcIlRoZSBjb25uZWN0aW9uIHdhcyBzdG9wcGVkIGJlZm9yZSB0aGUgaHViIGhhbmRzaGFrZSBjb3VsZCBjb21wbGV0ZS5cIik7XHJcbiAgICAgICAgLy8gSHR0cENvbm5lY3Rpb24uc3RvcCgpIHNob3VsZCBub3QgY29tcGxldGUgdW50aWwgYWZ0ZXIgZWl0aGVyIEh0dHBDb25uZWN0aW9uLnN0YXJ0KCkgZmFpbHNcclxuICAgICAgICAvLyBvciB0aGUgb25jbG9zZSBjYWxsYmFjayBpcyBpbnZva2VkLiBUaGUgb25jbG9zZSBjYWxsYmFjayB3aWxsIHRyYW5zaXRpb24gdGhlIEh1YkNvbm5lY3Rpb25cclxuICAgICAgICAvLyB0byB0aGUgZGlzY29ubmVjdGVkIHN0YXRlIGlmIG5lZWQgYmUgYmVmb3JlIEh0dHBDb25uZWN0aW9uLnN0b3AoKSBjb21wbGV0ZXMuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5zdG9wKGVycm9yKTtcclxuICAgIH1cclxuICAgIGFzeW5jIF9zZW5kQ2xvc2VNZXNzYWdlKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NlbmRXaXRoUHJvdG9jb2wodGhpcy5fY3JlYXRlQ2xvc2VNZXNzYWdlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSwgdGhpcyBpcyBhIGJlc3QgZWZmb3J0IGF0dGVtcHQgdG8gbGV0IHRoZSBzZXJ2ZXIga25vdyB0aGUgY2xpZW50IGNsb3NlZCBncmFjZWZ1bGx5LlxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKiBJbnZva2VzIGEgc3RyZWFtaW5nIGh1YiBtZXRob2Qgb24gdGhlIHNlcnZlciB1c2luZyB0aGUgc3BlY2lmaWVkIG5hbWUgYW5kIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBAdHlwZXBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGl0ZW1zIHJldHVybmVkIGJ5IHRoZSBzZXJ2ZXIuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2VydmVyIG1ldGhvZCB0byBpbnZva2UuXHJcbiAgICAgKiBAcGFyYW0ge2FueVtdfSBhcmdzIFRoZSBhcmd1bWVudHMgdXNlZCB0byBpbnZva2UgdGhlIHNlcnZlciBtZXRob2QuXHJcbiAgICAgKiBAcmV0dXJucyB7SVN0cmVhbVJlc3VsdDxUPn0gQW4gb2JqZWN0IHRoYXQgeWllbGRzIHJlc3VsdHMgZnJvbSB0aGUgc2VydmVyIGFzIHRoZXkgYXJlIHJlY2VpdmVkLlxyXG4gICAgICovXHJcbiAgICBzdHJlYW0obWV0aG9kTmFtZSwgLi4uYXJncykge1xyXG4gICAgICAgIGNvbnN0IFtzdHJlYW1zLCBzdHJlYW1JZHNdID0gdGhpcy5fcmVwbGFjZVN0cmVhbWluZ1BhcmFtcyhhcmdzKTtcclxuICAgICAgICBjb25zdCBpbnZvY2F0aW9uRGVzY3JpcHRvciA9IHRoaXMuX2NyZWF0ZVN0cmVhbUludm9jYXRpb24obWV0aG9kTmFtZSwgYXJncywgc3RyZWFtSWRzKTtcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLWNvbnN0XHJcbiAgICAgICAgbGV0IHByb21pc2VRdWV1ZTtcclxuICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcclxuICAgICAgICBzdWJqZWN0LmNhbmNlbENhbGxiYWNrID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjYW5jZWxJbnZvY2F0aW9uID0gdGhpcy5fY3JlYXRlQ2FuY2VsSW52b2NhdGlvbihpbnZvY2F0aW9uRGVzY3JpcHRvci5pbnZvY2F0aW9uSWQpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2ludm9jYXRpb25EZXNjcmlwdG9yLmludm9jYXRpb25JZF07XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlUXVldWUudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc2VuZFdpdGhQcm90b2NvbChjYW5jZWxJbnZvY2F0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9jYWxsYmFja3NbaW52b2NhdGlvbkRlc2NyaXB0b3IuaW52b2NhdGlvbklkXSA9IChpbnZvY2F0aW9uRXZlbnQsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgc3ViamVjdC5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaW52b2NhdGlvbkV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpbnZvY2F0aW9uRXZlbnQgd2lsbCBub3QgYmUgbnVsbCB3aGVuIGFuIGVycm9yIGlzIG5vdCBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAgICBpZiAoaW52b2NhdGlvbkV2ZW50LnR5cGUgPT09IE1lc3NhZ2VUeXBlLkNvbXBsZXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW52b2NhdGlvbkV2ZW50LmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QuZXJyb3IobmV3IEVycm9yKGludm9jYXRpb25FdmVudC5lcnJvcikpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dCgoaW52b2NhdGlvbkV2ZW50Lml0ZW0pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcHJvbWlzZVF1ZXVlID0gdGhpcy5fc2VuZFdpdGhQcm90b2NvbChpbnZvY2F0aW9uRGVzY3JpcHRvcilcclxuICAgICAgICAgICAgLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgICAgICAgIHN1YmplY3QuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbaW52b2NhdGlvbkRlc2NyaXB0b3IuaW52b2NhdGlvbklkXTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9sYXVuY2hTdHJlYW1zKHN0cmVhbXMsIHByb21pc2VRdWV1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XHJcbiAgICB9XHJcbiAgICBfc2VuZE1lc3NhZ2UobWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMuX3Jlc2V0S2VlcEFsaXZlSW50ZXJ2YWwoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnNlbmQobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFNlbmRzIGEganMgb2JqZWN0IHRvIHRoZSBzZXJ2ZXIuXHJcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUganMgb2JqZWN0IHRvIHNlcmlhbGl6ZSBhbmQgc2VuZC5cclxuICAgICAqL1xyXG4gICAgX3NlbmRXaXRoUHJvdG9jb2wobWVzc2FnZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9tZXNzYWdlQnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlQnVmZmVyLl9zZW5kKG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmRNZXNzYWdlKHRoaXMuX3Byb3RvY29sLndyaXRlTWVzc2FnZShtZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqIEludm9rZXMgYSBodWIgbWV0aG9kIG9uIHRoZSBzZXJ2ZXIgdXNpbmcgdGhlIHNwZWNpZmllZCBuYW1lIGFuZCBhcmd1bWVudHMuIERvZXMgbm90IHdhaXQgZm9yIGEgcmVzcG9uc2UgZnJvbSB0aGUgcmVjZWl2ZXIuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIFByb21pc2UgcmV0dXJuZWQgYnkgdGhpcyBtZXRob2QgcmVzb2x2ZXMgd2hlbiB0aGUgY2xpZW50IGhhcyBzZW50IHRoZSBpbnZvY2F0aW9uIHRvIHRoZSBzZXJ2ZXIuIFRoZSBzZXJ2ZXIgbWF5IHN0aWxsXHJcbiAgICAgKiBiZSBwcm9jZXNzaW5nIHRoZSBpbnZvY2F0aW9uLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lIFRoZSBuYW1lIG9mIHRoZSBzZXJ2ZXIgbWV0aG9kIHRvIGludm9rZS5cclxuICAgICAqIEBwYXJhbSB7YW55W119IGFyZ3MgVGhlIGFyZ3VtZW50cyB1c2VkIHRvIGludm9rZSB0aGUgc2VydmVyIG1ldGhvZC5cclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBpbnZvY2F0aW9uIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBzZW50LCBvciByZWplY3RzIHdpdGggYW4gZXJyb3IuXHJcbiAgICAgKi9cclxuICAgIHNlbmQobWV0aG9kTmFtZSwgLi4uYXJncykge1xyXG4gICAgICAgIGNvbnN0IFtzdHJlYW1zLCBzdHJlYW1JZHNdID0gdGhpcy5fcmVwbGFjZVN0cmVhbWluZ1BhcmFtcyhhcmdzKTtcclxuICAgICAgICBjb25zdCBzZW5kUHJvbWlzZSA9IHRoaXMuX3NlbmRXaXRoUHJvdG9jb2wodGhpcy5fY3JlYXRlSW52b2NhdGlvbihtZXRob2ROYW1lLCBhcmdzLCB0cnVlLCBzdHJlYW1JZHMpKTtcclxuICAgICAgICB0aGlzLl9sYXVuY2hTdHJlYW1zKHN0cmVhbXMsIHNlbmRQcm9taXNlKTtcclxuICAgICAgICByZXR1cm4gc2VuZFByb21pc2U7XHJcbiAgICB9XHJcbiAgICAvKiogSW52b2tlcyBhIGh1YiBtZXRob2Qgb24gdGhlIHNlcnZlciB1c2luZyB0aGUgc3BlY2lmaWVkIG5hbWUgYW5kIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgUHJvbWlzZSByZXR1cm5lZCBieSB0aGlzIG1ldGhvZCByZXNvbHZlcyB3aGVuIHRoZSBzZXJ2ZXIgaW5kaWNhdGVzIGl0IGhhcyBmaW5pc2hlZCBpbnZva2luZyB0aGUgbWV0aG9kLiBXaGVuIHRoZSBwcm9taXNlXHJcbiAgICAgKiByZXNvbHZlcywgdGhlIHNlcnZlciBoYXMgZmluaXNoZWQgaW52b2tpbmcgdGhlIG1ldGhvZC4gSWYgdGhlIHNlcnZlciBtZXRob2QgcmV0dXJucyBhIHJlc3VsdCwgaXQgaXMgcHJvZHVjZWQgYXMgdGhlIHJlc3VsdCBvZlxyXG4gICAgICogcmVzb2x2aW5nIHRoZSBQcm9taXNlLlxyXG4gICAgICpcclxuICAgICAqIEB0eXBlcGFyYW0gVCBUaGUgZXhwZWN0ZWQgcmV0dXJuIHR5cGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2VydmVyIG1ldGhvZCB0byBpbnZva2UuXHJcbiAgICAgKiBAcGFyYW0ge2FueVtdfSBhcmdzIFRoZSBhcmd1bWVudHMgdXNlZCB0byBpbnZva2UgdGhlIHNlcnZlciBtZXRob2QuXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxUPn0gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBzZXJ2ZXIgbWV0aG9kIChpZiBhbnkpLCBvciByZWplY3RzIHdpdGggYW4gZXJyb3IuXHJcbiAgICAgKi9cclxuICAgIGludm9rZShtZXRob2ROYW1lLCAuLi5hcmdzKSB7XHJcbiAgICAgICAgY29uc3QgW3N0cmVhbXMsIHN0cmVhbUlkc10gPSB0aGlzLl9yZXBsYWNlU3RyZWFtaW5nUGFyYW1zKGFyZ3MpO1xyXG4gICAgICAgIGNvbnN0IGludm9jYXRpb25EZXNjcmlwdG9yID0gdGhpcy5fY3JlYXRlSW52b2NhdGlvbihtZXRob2ROYW1lLCBhcmdzLCBmYWxzZSwgc3RyZWFtSWRzKTtcclxuICAgICAgICBjb25zdCBwID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBpbnZvY2F0aW9uSWQgd2lsbCBhbHdheXMgaGF2ZSBhIHZhbHVlIGZvciBhIG5vbi1ibG9ja2luZyBpbnZvY2F0aW9uXHJcbiAgICAgICAgICAgIHRoaXMuX2NhbGxiYWNrc1tpbnZvY2F0aW9uRGVzY3JpcHRvci5pbnZvY2F0aW9uSWRdID0gKGludm9jYXRpb25FdmVudCwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaW52b2NhdGlvbkV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW52b2NhdGlvbkV2ZW50IHdpbGwgbm90IGJlIG51bGwgd2hlbiBhbiBlcnJvciBpcyBub3QgcGFzc2VkIHRvIHRoZSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnZvY2F0aW9uRXZlbnQudHlwZSA9PT0gTWVzc2FnZVR5cGUuQ29tcGxldGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW52b2NhdGlvbkV2ZW50LmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGludm9jYXRpb25FdmVudC5lcnJvcikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbnZvY2F0aW9uRXZlbnQucmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgVW5leHBlY3RlZCBtZXNzYWdlIHR5cGU6ICR7aW52b2NhdGlvbkV2ZW50LnR5cGV9YCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgcHJvbWlzZVF1ZXVlID0gdGhpcy5fc2VuZFdpdGhQcm90b2NvbChpbnZvY2F0aW9uRGVzY3JpcHRvcilcclxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW52b2NhdGlvbklkIHdpbGwgYWx3YXlzIGhhdmUgYSB2YWx1ZSBmb3IgYSBub24tYmxvY2tpbmcgaW52b2NhdGlvblxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tpbnZvY2F0aW9uRGVzY3JpcHRvci5pbnZvY2F0aW9uSWRdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fbGF1bmNoU3RyZWFtcyhzdHJlYW1zLCBwcm9taXNlUXVldWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwO1xyXG4gICAgfVxyXG4gICAgb24obWV0aG9kTmFtZSwgbmV3TWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKCFtZXRob2ROYW1lIHx8ICFuZXdNZXRob2QpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtZXRob2ROYW1lID0gbWV0aG9kTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5fbWV0aG9kc1ttZXRob2ROYW1lXSkge1xyXG4gICAgICAgICAgICB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFByZXZlbnRpbmcgYWRkaW5nIHRoZSBzYW1lIGhhbmRsZXIgbXVsdGlwbGUgdGltZXMuXHJcbiAgICAgICAgaWYgKHRoaXMuX21ldGhvZHNbbWV0aG9kTmFtZV0uaW5kZXhPZihuZXdNZXRob2QpICE9PSAtMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX21ldGhvZHNbbWV0aG9kTmFtZV0ucHVzaChuZXdNZXRob2QpO1xyXG4gICAgfVxyXG4gICAgb2ZmKG1ldGhvZE5hbWUsIG1ldGhvZCkge1xyXG4gICAgICAgIGlmICghbWV0aG9kTmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1ldGhvZE5hbWUgPSBtZXRob2ROYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgY29uc3QgaGFuZGxlcnMgPSB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdO1xyXG4gICAgICAgIGlmICghaGFuZGxlcnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWV0aG9kKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZUlkeCA9IGhhbmRsZXJzLmluZGV4T2YobWV0aG9kKTtcclxuICAgICAgICAgICAgaWYgKHJlbW92ZUlkeCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZXJzLnNwbGljZShyZW1vdmVJZHgsIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbWV0aG9kc1ttZXRob2ROYW1lXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiogUmVnaXN0ZXJzIGEgaGFuZGxlciB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIGNsb3NlZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgaGFuZGxlciB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIGNsb3NlZC4gT3B0aW9uYWxseSByZWNlaXZlcyBhIHNpbmdsZSBhcmd1bWVudCBjb250YWluaW5nIHRoZSBlcnJvciB0aGF0IGNhdXNlZCB0aGUgY29ubmVjdGlvbiB0byBjbG9zZSAoaWYgYW55KS5cclxuICAgICAqL1xyXG4gICAgb25jbG9zZShjYWxsYmFjaykge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWRDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqIFJlZ2lzdGVycyBhIGhhbmRsZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBzdGFydHMgcmVjb25uZWN0aW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBoYW5kbGVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIGNvbm5lY3Rpb24gc3RhcnRzIHJlY29ubmVjdGluZy4gT3B0aW9uYWxseSByZWNlaXZlcyBhIHNpbmdsZSBhcmd1bWVudCBjb250YWluaW5nIHRoZSBlcnJvciB0aGF0IGNhdXNlZCB0aGUgY29ubmVjdGlvbiB0byBzdGFydCByZWNvbm5lY3RpbmcgKGlmIGFueSkuXHJcbiAgICAgKi9cclxuICAgIG9ucmVjb25uZWN0aW5nKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGluZ0NhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiogUmVnaXN0ZXJzIGEgaGFuZGxlciB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjb25uZWN0aW9uIHN1Y2Nlc3NmdWxseSByZWNvbm5lY3RzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBoYW5kbGVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIGNvbm5lY3Rpb24gc3VjY2Vzc2Z1bGx5IHJlY29ubmVjdHMuXHJcbiAgICAgKi9cclxuICAgIG9ucmVjb25uZWN0ZWQoY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0ZWRDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX3Byb2Nlc3NJbmNvbWluZ0RhdGEoZGF0YSkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFudXBUaW1lb3V0KCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZWNlaXZlZEhhbmRzaGFrZVJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9wcm9jZXNzSGFuZHNoYWtlUmVzcG9uc2UoZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlY2VpdmVkSGFuZHNoYWtlUmVzcG9uc2UgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBEYXRhIG1heSBoYXZlIGFsbCBiZWVuIHJlYWQgd2hlbiBwcm9jZXNzaW5nIGhhbmRzaGFrZSByZXNwb25zZVxyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBtZXNzYWdlc1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMuX3Byb3RvY29sLnBhcnNlTWVzc2FnZXMoZGF0YSwgdGhpcy5fbG9nZ2VyKTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWVzc2FnZUJ1ZmZlciAmJiAhdGhpcy5fbWVzc2FnZUJ1ZmZlci5fc2hvdWxkUHJvY2Vzc01lc3NhZ2UobWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBwcm9jZXNzIHRoZSBtZXNzYWdlLCB3ZSBhcmUgZWl0aGVyIHdhaXRpbmcgZm9yIGEgU2VxdWVuY2VNZXNzYWdlIG9yIHJlY2VpdmVkIGEgZHVwbGljYXRlIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5JbnZvY2F0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnZva2VDbGllbnRNZXRob2QobWVzc2FnZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYEludm9rZSBjbGllbnQgbWV0aG9kIHRocmV3IGVycm9yOiAke2dldEVycm9yU3RyaW5nKGUpfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TdHJlYW1JdGVtOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQ29tcGxldGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrc1ttZXNzYWdlLmludm9jYXRpb25JZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gTWVzc2FnZVR5cGUuQ29tcGxldGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbbWVzc2FnZS5pbnZvY2F0aW9uSWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYFN0cmVhbSBjYWxsYmFjayB0aHJldyBlcnJvcjogJHtnZXRFcnJvclN0cmluZyhlKX1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QaW5nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBjYXJlIGFib3V0IHBpbmdzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQ2xvc2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCJDbG9zZSBtZXNzYWdlIHJlY2VpdmVkIGZyb20gc2VydmVyLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBtZXNzYWdlLmVycm9yID8gbmV3IEVycm9yKFwiU2VydmVyIHJldHVybmVkIGFuIGVycm9yIG9uIGNsb3NlOiBcIiArIG1lc3NhZ2UuZXJyb3IpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZS5hbGxvd1JlY29ubmVjdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQgZmVlbHMgd3Jvbmcgbm90IHRvIGF3YWl0IGNvbm5lY3Rpb24uc3RvcCgpIGhlcmUsIGJ1dCBwcm9jZXNzSW5jb21pbmdEYXRhIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIGFuIG9ucmVjZWl2ZSBjYWxsYmFjayB3aGljaCBpcyBub3QgYXN5bmMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGFscmVhZHkgdGhlIGJlaGF2aW9yIGZvciBzZXJ2ZXJUaW1lb3V0KCksIGFuZCBIdHRwQ29ubmVjdGlvbi5TdG9wKCkgc2hvdWxkIGNhdGNoIGFuZCBsb2cgYWxsIHBvc3NpYmxlIGV4Y2VwdGlvbnMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWZsb2F0aW5nLXByb21pc2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc3RvcChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW5ub3QgYXdhaXQgc3RvcEludGVybmFsKCkgaGVyZSwgYnV0IHN1YnNlcXVlbnQgY2FsbHMgdG8gc3RvcCgpIHdpbGwgYXdhaXQgdGhpcyBpZiBzdG9wSW50ZXJuYWwoKSBpcyBzdGlsbCBvbmdvaW5nLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcFByb21pc2UgPSB0aGlzLl9zdG9wSW50ZXJuYWwoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkFjazpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX21lc3NhZ2VCdWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VCdWZmZXIuX2FjayhtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlNlcXVlbmNlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWVzc2FnZUJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZUJ1ZmZlci5fcmVzZXRTZXF1ZW5jZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLldhcm5pbmcsIGBJbnZhbGlkIG1lc3NhZ2UgdHlwZTogJHttZXNzYWdlLnR5cGV9LmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZXNldFRpbWVvdXRQZXJpb2QoKTtcclxuICAgIH1cclxuICAgIF9wcm9jZXNzSGFuZHNoYWtlUmVzcG9uc2UoZGF0YSkge1xyXG4gICAgICAgIGxldCByZXNwb25zZU1lc3NhZ2U7XHJcbiAgICAgICAgbGV0IHJlbWFpbmluZ0RhdGE7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgW3JlbWFpbmluZ0RhdGEsIHJlc3BvbnNlTWVzc2FnZV0gPSB0aGlzLl9oYW5kc2hha2VQcm90b2NvbC5wYXJzZUhhbmRzaGFrZVJlc3BvbnNlKGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gXCJFcnJvciBwYXJzaW5nIGhhbmRzaGFrZSByZXNwb25zZTogXCIgKyBlO1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkVycm9yLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2hhbmRzaGFrZVJlamVjdGVyKGVycm9yKTtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZXNwb25zZU1lc3NhZ2UuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IFwiU2VydmVyIHJldHVybmVkIGhhbmRzaGFrZSBlcnJvcjogXCIgKyByZXNwb25zZU1lc3NhZ2UuZXJyb3I7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuICAgICAgICAgICAgdGhpcy5faGFuZHNoYWtlUmVqZWN0ZXIoZXJyb3IpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIFwiU2VydmVyIGhhbmRzaGFrZSBjb21wbGV0ZS5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2hhbmRzaGFrZVJlc29sdmVyKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZ0RhdGE7XHJcbiAgICB9XHJcbiAgICBfcmVzZXRLZWVwQWxpdmVJbnRlcnZhbCgpIHtcclxuICAgICAgICBpZiAodGhpcy5jb25uZWN0aW9uLmZlYXR1cmVzLmluaGVyZW50S2VlcEFsaXZlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gU2V0IHRoZSB0aW1lIHdlIHdhbnQgdGhlIG5leHQga2VlcCBhbGl2ZSB0byBiZSBzZW50XHJcbiAgICAgICAgLy8gVGltZXIgd2lsbCBiZSBzZXR1cCBvbiBuZXh0IG1lc3NhZ2UgcmVjZWl2ZVxyXG4gICAgICAgIHRoaXMuX25leHRLZWVwQWxpdmUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIHRoaXMua2VlcEFsaXZlSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcztcclxuICAgICAgICB0aGlzLl9jbGVhbnVwUGluZ1RpbWVyKCk7XHJcbiAgICB9XHJcbiAgICBfcmVzZXRUaW1lb3V0UGVyaW9kKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0aW9uLmZlYXR1cmVzIHx8ICF0aGlzLmNvbm5lY3Rpb24uZmVhdHVyZXMuaW5oZXJlbnRLZWVwQWxpdmUpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRoZSB0aW1lb3V0IHRpbWVyXHJcbiAgICAgICAgICAgIHRoaXMuX3RpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2VydmVyVGltZW91dCgpLCB0aGlzLnNlcnZlclRpbWVvdXRJbk1pbGxpc2Vjb25kcyk7XHJcbiAgICAgICAgICAgIC8vIEltbWVkaWF0ZWx5IGZpcmUgS2VlcC1BbGl2ZSBwaW5nIGlmIG5leHRQaW5nIGlzIG92ZXJkdWUgdG8gYXZvaWQgZGVwZW5kZW5jeSBvbiBKUyB0aW1lcnNcclxuICAgICAgICAgICAgbGV0IG5leHRQaW5nID0gdGhpcy5fbmV4dEtlZXBBbGl2ZSAtIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICBpZiAobmV4dFBpbmcgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBIdWJDb25uZWN0aW9uU3RhdGUuQ29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1mbG9hdGluZy1wcm9taXNlc1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RyeVNlbmRQaW5nTWVzc2FnZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFNldCBrZWVwQWxpdmUgdGltZXIgaWYgdGhlcmUgaXNuJ3Qgb25lXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9waW5nU2VydmVySGFuZGxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0UGluZyA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0UGluZyA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgdGltZXIgbmVlZHMgdG8gYmUgc2V0IGZyb20gYSBuZXR3b3JraW5nIGNhbGxiYWNrIHRvIGF2b2lkIENocm9tZSB0aW1lciB0aHJvdHRsaW5nIGZyb20gY2F1c2luZyB0aW1lcnMgdG8gcnVuIG9uY2UgYSBtaW51dGVcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BpbmdTZXJ2ZXJIYW5kbGUgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBIdWJDb25uZWN0aW9uU3RhdGUuQ29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3RyeVNlbmRQaW5nTWVzc2FnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIG5leHRQaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cclxuICAgIHNlcnZlclRpbWVvdXQoKSB7XHJcbiAgICAgICAgLy8gVGhlIHNlcnZlciBoYXNuJ3QgdGFsa2VkIHRvIHVzIGluIGEgd2hpbGUuIEl0IGRvZXNuJ3QgbGlrZSB1cyBhbnltb3JlIC4uLiA6KFxyXG4gICAgICAgIC8vIFRlcm1pbmF0ZSB0aGUgY29ubmVjdGlvbiwgYnV0IHdlIGRvbid0IG5lZWQgdG8gd2FpdCBvbiB0aGUgcHJvbWlzZS4gVGhpcyBjb3VsZCB0cmlnZ2VyIHJlY29ubmVjdGluZy5cclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWZsb2F0aW5nLXByb21pc2VzXHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnN0b3AobmV3IEVycm9yKFwiU2VydmVyIHRpbWVvdXQgZWxhcHNlZCB3aXRob3V0IHJlY2VpdmluZyBhIG1lc3NhZ2UgZnJvbSB0aGUgc2VydmVyLlwiKSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBfaW52b2tlQ2xpZW50TWV0aG9kKGludm9jYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IGludm9jYXRpb25NZXNzYWdlLnRhcmdldC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGNvbnN0IG1ldGhvZHMgPSB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdO1xyXG4gICAgICAgIGlmICghbWV0aG9kcykge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLldhcm5pbmcsIGBObyBjbGllbnQgbWV0aG9kIHdpdGggdGhlIG5hbWUgJyR7bWV0aG9kTmFtZX0nIGZvdW5kLmApO1xyXG4gICAgICAgICAgICAvLyBObyBoYW5kbGVycyBwcm92aWRlZCBieSBjbGllbnQgYnV0IHRoZSBzZXJ2ZXIgaXMgZXhwZWN0aW5nIGEgcmVzcG9uc2Ugc3RpbGwsIHNvIHdlIHNlbmQgYW4gZXJyb3JcclxuICAgICAgICAgICAgaWYgKGludm9jYXRpb25NZXNzYWdlLmludm9jYXRpb25JZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5XYXJuaW5nLCBgTm8gcmVzdWx0IGdpdmVuIGZvciAnJHttZXRob2ROYW1lfScgbWV0aG9kIGFuZCBpbnZvY2F0aW9uIElEICcke2ludm9jYXRpb25NZXNzYWdlLmludm9jYXRpb25JZH0nLmApO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2VuZFdpdGhQcm90b2NvbCh0aGlzLl9jcmVhdGVDb21wbGV0aW9uTWVzc2FnZShpbnZvY2F0aW9uTWVzc2FnZS5pbnZvY2F0aW9uSWQsIFwiQ2xpZW50IGRpZG4ndCBwcm92aWRlIGEgcmVzdWx0LlwiLCBudWxsKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBBdm9pZCBpc3N1ZXMgd2l0aCBoYW5kbGVycyByZW1vdmluZyB0aGVtc2VsdmVzIHRodXMgbW9kaWZ5aW5nIHRoZSBsaXN0IHdoaWxlIGl0ZXJhdGluZyB0aHJvdWdoIGl0XHJcbiAgICAgICAgY29uc3QgbWV0aG9kc0NvcHkgPSBtZXRob2RzLnNsaWNlKCk7XHJcbiAgICAgICAgLy8gU2VydmVyIGV4cGVjdHMgYSByZXNwb25zZVxyXG4gICAgICAgIGNvbnN0IGV4cGVjdHNSZXNwb25zZSA9IGludm9jYXRpb25NZXNzYWdlLmludm9jYXRpb25JZCA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgICAvLyBXZSBwcmVzZXJ2ZSB0aGUgbGFzdCByZXN1bHQgb3IgZXhjZXB0aW9uIGJ1dCBzdGlsbCBjYWxsIGFsbCBoYW5kbGVyc1xyXG4gICAgICAgIGxldCByZXM7XHJcbiAgICAgICAgbGV0IGV4Y2VwdGlvbjtcclxuICAgICAgICBsZXQgY29tcGxldGlvbk1lc3NhZ2U7XHJcbiAgICAgICAgZm9yIChjb25zdCBtIG9mIG1ldGhvZHNDb3B5KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2UmVzID0gcmVzO1xyXG4gICAgICAgICAgICAgICAgcmVzID0gYXdhaXQgbS5hcHBseSh0aGlzLCBpbnZvY2F0aW9uTWVzc2FnZS5hcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4cGVjdHNSZXNwb25zZSAmJiByZXMgJiYgcHJldlJlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBNdWx0aXBsZSByZXN1bHRzIHByb3ZpZGVkIGZvciAnJHttZXRob2ROYW1lfScuIFNlbmRpbmcgZXJyb3IgdG8gc2VydmVyLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRpb25NZXNzYWdlID0gdGhpcy5fY3JlYXRlQ29tcGxldGlvbk1lc3NhZ2UoaW52b2NhdGlvbk1lc3NhZ2UuaW52b2NhdGlvbklkLCBgQ2xpZW50IHByb3ZpZGVkIG11bHRpcGxlIHJlc3VsdHMuYCwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBJZ25vcmUgZXhjZXB0aW9uIGlmIHdlIGdvdCBhIHJlc3VsdCBhZnRlciwgdGhlIGV4Y2VwdGlvbiB3aWxsIGJlIGxvZ2dlZFxyXG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYEEgY2FsbGJhY2sgZm9yIHRoZSBtZXRob2QgJyR7bWV0aG9kTmFtZX0nIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29tcGxldGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2VuZFdpdGhQcm90b2NvbChjb21wbGV0aW9uTWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGV4cGVjdHNSZXNwb25zZSkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBleGNlcHRpb24gdGhhdCBtZWFucyBlaXRoZXIgbm8gcmVzdWx0IHdhcyBnaXZlbiBvciBhIGhhbmRsZXIgYWZ0ZXIgYSByZXN1bHQgdGhyZXdcclxuICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGlvbk1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVDb21wbGV0aW9uTWVzc2FnZShpbnZvY2F0aW9uTWVzc2FnZS5pbnZvY2F0aW9uSWQsIGAke2V4Y2VwdGlvbn1gLCBudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGlvbk1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVDb21wbGV0aW9uTWVzc2FnZShpbnZvY2F0aW9uTWVzc2FnZS5pbnZvY2F0aW9uSWQsIG51bGwsIHJlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLldhcm5pbmcsIGBObyByZXN1bHQgZ2l2ZW4gZm9yICcke21ldGhvZE5hbWV9JyBtZXRob2QgYW5kIGludm9jYXRpb24gSUQgJyR7aW52b2NhdGlvbk1lc3NhZ2UuaW52b2NhdGlvbklkfScuYCk7XHJcbiAgICAgICAgICAgICAgICAvLyBDbGllbnQgZGlkbid0IHByb3ZpZGUgYSByZXN1bHQgb3IgdGhyb3cgZnJvbSBhIGhhbmRsZXIsIHNlcnZlciBleHBlY3RzIGEgcmVzcG9uc2Ugc28gd2Ugc2VuZCBhbiBlcnJvclxyXG4gICAgICAgICAgICAgICAgY29tcGxldGlvbk1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVDb21wbGV0aW9uTWVzc2FnZShpbnZvY2F0aW9uTWVzc2FnZS5pbnZvY2F0aW9uSWQsIFwiQ2xpZW50IGRpZG4ndCBwcm92aWRlIGEgcmVzdWx0LlwiLCBudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9zZW5kV2l0aFByb3RvY29sKGNvbXBsZXRpb25NZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBSZXN1bHQgZ2l2ZW4gZm9yICcke21ldGhvZE5hbWV9JyBtZXRob2QgYnV0IHNlcnZlciBpcyBub3QgZXhwZWN0aW5nIGEgcmVzdWx0LmApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2Nvbm5lY3Rpb25DbG9zZWQoZXJyb3IpIHtcclxuICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBgSHViQ29ubmVjdGlvbi5jb25uZWN0aW9uQ2xvc2VkKCR7ZXJyb3J9KSBjYWxsZWQgd2hpbGUgaW4gc3RhdGUgJHt0aGlzLl9jb25uZWN0aW9uU3RhdGV9LmApO1xyXG4gICAgICAgIC8vIFRyaWdnZXJpbmcgdGhpcy5oYW5kc2hha2VSZWplY3RlciBpcyBpbnN1ZmZpY2llbnQgYmVjYXVzZSBpdCBjb3VsZCBhbHJlYWR5IGJlIHJlc29sdmVkIHdpdGhvdXQgdGhlIGNvbnRpbnVhdGlvbiBoYXZpbmcgcnVuIHlldC5cclxuICAgICAgICB0aGlzLl9zdG9wRHVyaW5nU3RhcnRFcnJvciA9IHRoaXMuX3N0b3BEdXJpbmdTdGFydEVycm9yIHx8IGVycm9yIHx8IG5ldyBBYm9ydEVycm9yKFwiVGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbiB3YXMgY2xvc2VkIGJlZm9yZSB0aGUgaHViIGhhbmRzaGFrZSBjb3VsZCBjb21wbGV0ZS5cIik7XHJcbiAgICAgICAgLy8gSWYgdGhlIGhhbmRzaGFrZSBpcyBpbiBwcm9ncmVzcywgc3RhcnQgd2lsbCBiZSB3YWl0aW5nIGZvciB0aGUgaGFuZHNoYWtlIHByb21pc2UsIHNvIHdlIGNvbXBsZXRlIGl0LlxyXG4gICAgICAgIC8vIElmIGl0IGhhcyBhbHJlYWR5IGNvbXBsZXRlZCwgdGhpcyBzaG91bGQganVzdCBub29wLlxyXG4gICAgICAgIGlmICh0aGlzLl9oYW5kc2hha2VSZXNvbHZlcikge1xyXG4gICAgICAgICAgICB0aGlzLl9oYW5kc2hha2VSZXNvbHZlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9jYW5jZWxDYWxsYmFja3NXaXRoRXJyb3IoZXJyb3IgfHwgbmV3IEVycm9yKFwiSW52b2NhdGlvbiBjYW5jZWxlZCBkdWUgdG8gdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbiBiZWluZyBjbG9zZWQuXCIpKTtcclxuICAgICAgICB0aGlzLl9jbGVhbnVwVGltZW91dCgpO1xyXG4gICAgICAgIHRoaXMuX2NsZWFudXBQaW5nVGltZXIoKTtcclxuICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBIdWJDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wbGV0ZUNsb3NlKGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBIdWJDb25uZWN0aW9uU3RhdGUuQ29ubmVjdGVkICYmIHRoaXMuX3JlY29ubmVjdFBvbGljeSkge1xyXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWZsb2F0aW5nLXByb21pc2VzXHJcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdChlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gSHViQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wbGV0ZUNsb3NlKGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSWYgbm9uZSBvZiB0aGUgYWJvdmUgaWYgY29uZGl0aW9ucyB3ZXJlIHRydWUgd2VyZSBjYWxsZWQgdGhlIEh1YkNvbm5lY3Rpb24gbXVzdCBiZSBpbiBlaXRoZXI6XHJcbiAgICAgICAgLy8gMS4gVGhlIENvbm5lY3Rpbmcgc3RhdGUgaW4gd2hpY2ggY2FzZSB0aGUgaGFuZHNoYWtlUmVzb2x2ZXIgd2lsbCBjb21wbGV0ZSBpdCBhbmQgc3RvcER1cmluZ1N0YXJ0RXJyb3Igd2lsbCBmYWlsIGl0LlxyXG4gICAgICAgIC8vIDIuIFRoZSBSZWNvbm5lY3Rpbmcgc3RhdGUgaW4gd2hpY2ggY2FzZSB0aGUgaGFuZHNoYWtlUmVzb2x2ZXIgd2lsbCBjb21wbGV0ZSBpdCBhbmQgc3RvcER1cmluZ1N0YXJ0RXJyb3Igd2lsbCBmYWlsIHRoZSBjdXJyZW50IHJlY29ubmVjdCBhdHRlbXB0XHJcbiAgICAgICAgLy8gICAgYW5kIHBvdGVudGlhbGx5IGNvbnRpbnVlIHRoZSByZWNvbm5lY3QoKSBsb29wLlxyXG4gICAgICAgIC8vIDMuIFRoZSBEaXNjb25uZWN0ZWQgc3RhdGUgaW4gd2hpY2ggY2FzZSB3ZSdyZSBhbHJlYWR5IGRvbmUuXHJcbiAgICB9XHJcbiAgICBfY29tcGxldGVDbG9zZShlcnJvcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBIdWJDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGVkO1xyXG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbWVzc2FnZUJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZUJ1ZmZlci5fZGlzcG9zZShlcnJvciAhPT0gbnVsbCAmJiBlcnJvciAhPT0gdm9pZCAwID8gZXJyb3IgOiBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGNsb3NlZC5cIikpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZUJ1ZmZlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNCcm93c2VyKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZyZWV6ZVwiLCB0aGlzLl9mcmVlemVFdmVudExpc3RlbmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VkQ2FsbGJhY2tzLmZvckVhY2goKGMpID0+IGMuYXBwbHkodGhpcywgW2Vycm9yXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkVycm9yLCBgQW4gb25jbG9zZSBjYWxsYmFjayBjYWxsZWQgd2l0aCBlcnJvciAnJHtlcnJvcn0nIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGFzeW5jIF9yZWNvbm5lY3QoZXJyb3IpIHtcclxuICAgICAgICBjb25zdCByZWNvbm5lY3RTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGxldCBwcmV2aW91c1JlY29ubmVjdEF0dGVtcHRzID0gMDtcclxuICAgICAgICBsZXQgcmV0cnlFcnJvciA9IGVycm9yICE9PSB1bmRlZmluZWQgPyBlcnJvciA6IG5ldyBFcnJvcihcIkF0dGVtcHRpbmcgdG8gcmVjb25uZWN0IGR1ZSB0byBhIHVua25vd24gZXJyb3IuXCIpO1xyXG4gICAgICAgIGxldCBuZXh0UmV0cnlEZWxheSA9IHRoaXMuX2dldE5leHRSZXRyeURlbGF5KHByZXZpb3VzUmVjb25uZWN0QXR0ZW1wdHMsIDAsIHJldHJ5RXJyb3IpO1xyXG4gICAgICAgIGlmIChuZXh0UmV0cnlEZWxheSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBcIkNvbm5lY3Rpb24gbm90IHJlY29ubmVjdGluZyBiZWNhdXNlIHRoZSBJUmV0cnlQb2xpY3kgcmV0dXJuZWQgbnVsbCBvbiB0aGUgZmlyc3QgcmVjb25uZWN0IGF0dGVtcHQuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wbGV0ZUNsb3NlKGVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBIdWJDb25uZWN0aW9uU3RhdGUuUmVjb25uZWN0aW5nO1xyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkluZm9ybWF0aW9uLCBgQ29ubmVjdGlvbiByZWNvbm5lY3RpbmcgYmVjYXVzZSBvZiBlcnJvciAnJHtlcnJvcn0nLmApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCJDb25uZWN0aW9uIHJlY29ubmVjdGluZy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RpbmdDYWxsYmFja3MubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmdDYWxsYmFja3MuZm9yRWFjaCgoYykgPT4gYy5hcHBseSh0aGlzLCBbZXJyb3JdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBBbiBvbnJlY29ubmVjdGluZyBjYWxsYmFjayBjYWxsZWQgd2l0aCBlcnJvciAnJHtlcnJvcn0nIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBFeGl0IGVhcmx5IGlmIGFuIG9ucmVjb25uZWN0aW5nIGNhbGxiYWNrIGNhbGxlZCBjb25uZWN0aW9uLnN0b3AoKS5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSAhPT0gSHViQ29ubmVjdGlvblN0YXRlLlJlY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgXCJDb25uZWN0aW9uIGxlZnQgdGhlIHJlY29ubmVjdGluZyBzdGF0ZSBpbiBvbnJlY29ubmVjdGluZyBjYWxsYmFjay4gRG9uZSByZWNvbm5lY3RpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlIChuZXh0UmV0cnlEZWxheSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkluZm9ybWF0aW9uLCBgUmVjb25uZWN0IGF0dGVtcHQgbnVtYmVyICR7cHJldmlvdXNSZWNvbm5lY3RBdHRlbXB0cyArIDF9IHdpbGwgc3RhcnQgaW4gJHtuZXh0UmV0cnlEZWxheX0gbXMuYCk7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3REZWxheUhhbmRsZSA9IHNldFRpbWVvdXQocmVzb2x2ZSwgbmV4dFJldHJ5RGVsYXkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0RGVsYXlIYW5kbGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgIT09IEh1YkNvbm5lY3Rpb25TdGF0ZS5SZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIFwiQ29ubmVjdGlvbiBsZWZ0IHRoZSByZWNvbm5lY3Rpbmcgc3RhdGUgZHVyaW5nIHJlY29ubmVjdCBkZWxheS4gRG9uZSByZWNvbm5lY3RpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydEludGVybmFsKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBIdWJDb25uZWN0aW9uU3RhdGUuQ29ubmVjdGVkO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCJIdWJDb25uZWN0aW9uIHJlY29ubmVjdGVkIHN1Y2Nlc3NmdWxseS5cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0ZWRDYWxsYmFja3MubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0ZWRDYWxsYmFja3MuZm9yRWFjaCgoYykgPT4gYy5hcHBseSh0aGlzLCBbdGhpcy5jb25uZWN0aW9uLmNvbm5lY3Rpb25JZF0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYEFuIG9ucmVjb25uZWN0ZWQgY2FsbGJhY2sgY2FsbGVkIHdpdGggY29ubmVjdGlvbklkICcke3RoaXMuY29ubmVjdGlvbi5jb25uZWN0aW9uSWR9OyB0aHJldyBlcnJvciAnJHtlfScuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkluZm9ybWF0aW9uLCBgUmVjb25uZWN0IGF0dGVtcHQgZmFpbGVkIGJlY2F1c2Ugb2YgZXJyb3IgJyR7ZX0nLmApO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSAhPT0gSHViQ29ubmVjdGlvblN0YXRlLlJlY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIGBDb25uZWN0aW9uIG1vdmVkIHRvIHRoZSAnJHt0aGlzLl9jb25uZWN0aW9uU3RhdGV9JyBmcm9tIHRoZSByZWNvbm5lY3Rpbmcgc3RhdGUgZHVyaW5nIHJlY29ubmVjdCBhdHRlbXB0LiBEb25lIHJlY29ubmVjdGluZy5gKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgVHlwZVNjcmlwdCBjb21waWxlciB0aGlua3MgdGhhdCBjb25uZWN0aW9uU3RhdGUgbXVzdCBiZSBDb25uZWN0ZWQgaGVyZS4gVGhlIFR5cGVTY3JpcHQgY29tcGlsZXIgaXMgd3JvbmcuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gSHViQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29tcGxldGVDbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91c1JlY29ubmVjdEF0dGVtcHRzKys7XHJcbiAgICAgICAgICAgICAgICByZXRyeUVycm9yID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgbmV4dFJldHJ5RGVsYXkgPSB0aGlzLl9nZXROZXh0UmV0cnlEZWxheShwcmV2aW91c1JlY29ubmVjdEF0dGVtcHRzLCBEYXRlLm5vdygpIC0gcmVjb25uZWN0U3RhcnRUaW1lLCByZXRyeUVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkluZm9ybWF0aW9uLCBgUmVjb25uZWN0IHJldHJpZXMgaGF2ZSBiZWVuIGV4aGF1c3RlZCBhZnRlciAke0RhdGUubm93KCkgLSByZWNvbm5lY3RTdGFydFRpbWV9IG1zIGFuZCAke3ByZXZpb3VzUmVjb25uZWN0QXR0ZW1wdHN9IGZhaWxlZCBhdHRlbXB0cy4gQ29ubmVjdGlvbiBkaXNjb25uZWN0aW5nLmApO1xyXG4gICAgICAgIHRoaXMuX2NvbXBsZXRlQ2xvc2UoKTtcclxuICAgIH1cclxuICAgIF9nZXROZXh0UmV0cnlEZWxheShwcmV2aW91c1JldHJ5Q291bnQsIGVsYXBzZWRNaWxsaXNlY29uZHMsIHJldHJ5UmVhc29uKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdFBvbGljeS5uZXh0UmV0cnlEZWxheUluTWlsbGlzZWNvbmRzKHtcclxuICAgICAgICAgICAgICAgIGVsYXBzZWRNaWxsaXNlY29uZHMsXHJcbiAgICAgICAgICAgICAgICBwcmV2aW91c1JldHJ5Q291bnQsXHJcbiAgICAgICAgICAgICAgICByZXRyeVJlYXNvbixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBJUmV0cnlQb2xpY3kubmV4dFJldHJ5RGVsYXlJbk1pbGxpc2Vjb25kcygke3ByZXZpb3VzUmV0cnlDb3VudH0sICR7ZWxhcHNlZE1pbGxpc2Vjb25kc30pIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2NhbmNlbENhbGxiYWNrc1dpdGhFcnJvcihlcnJvcikge1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcztcclxuICAgICAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcclxuICAgICAgICBPYmplY3Qua2V5cyhjYWxsYmFja3MpXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSBjYWxsYmFja3Nba2V5XTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYFN0cmVhbSAnZXJyb3InIGNhbGxiYWNrIGNhbGxlZCB3aXRoICcke2Vycm9yfScgdGhyZXcgZXJyb3I6ICR7Z2V0RXJyb3JTdHJpbmcoZSl9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIF9jbGVhbnVwUGluZ1RpbWVyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9waW5nU2VydmVySGFuZGxlKSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9waW5nU2VydmVySGFuZGxlKTtcclxuICAgICAgICAgICAgdGhpcy5fcGluZ1NlcnZlckhhbmRsZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfY2xlYW51cFRpbWVvdXQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3RpbWVvdXRIYW5kbGUpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVvdXRIYW5kbGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9jcmVhdGVJbnZvY2F0aW9uKG1ldGhvZE5hbWUsIGFyZ3MsIG5vbmJsb2NraW5nLCBzdHJlYW1JZHMpIHtcclxuICAgICAgICBpZiAobm9uYmxvY2tpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbUlkcy5sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBtZXRob2ROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogYXJncyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW1JZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuSW52b2NhdGlvbixcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuSW52b2NhdGlvbixcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGludm9jYXRpb25JZCA9IHRoaXMuX2ludm9jYXRpb25JZDtcclxuICAgICAgICAgICAgdGhpcy5faW52b2NhdGlvbklkKys7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW1JZHMubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbklkOiBpbnZvY2F0aW9uSWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW1JZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuSW52b2NhdGlvbixcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbklkOiBpbnZvY2F0aW9uSWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5JbnZvY2F0aW9uLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9sYXVuY2hTdHJlYW1zKHN0cmVhbXMsIHByb21pc2VRdWV1ZSkge1xyXG4gICAgICAgIGlmIChzdHJlYW1zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFN5bmNocm9uaXplIHN0cmVhbSBkYXRhIHNvIHRoZXkgYXJyaXZlIGluLW9yZGVyIG9uIHRoZSBzZXJ2ZXJcclxuICAgICAgICBpZiAoIXByb21pc2VRdWV1ZSkge1xyXG4gICAgICAgICAgICBwcm9taXNlUXVldWUgPSBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gV2Ugd2FudCB0byBpdGVyYXRlIG92ZXIgdGhlIGtleXMsIHNpbmNlIHRoZSBrZXlzIGFyZSB0aGUgc3RyZWFtIGlkc1xyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBndWFyZC1mb3ItaW5cclxuICAgICAgICBmb3IgKGNvbnN0IHN0cmVhbUlkIGluIHN0cmVhbXMpIHtcclxuICAgICAgICAgICAgc3RyZWFtc1tzdHJlYW1JZF0uc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVF1ZXVlID0gcHJvbWlzZVF1ZXVlLnRoZW4oKCkgPT4gdGhpcy5fc2VuZFdpdGhQcm90b2NvbCh0aGlzLl9jcmVhdGVDb21wbGV0aW9uTWVzc2FnZShzdHJlYW1JZCkpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGVyciAmJiBlcnIudG9TdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IGVyci50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiVW5rbm93biBlcnJvclwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlUXVldWUgPSBwcm9taXNlUXVldWUudGhlbigoKSA9PiB0aGlzLl9zZW5kV2l0aFByb3RvY29sKHRoaXMuX2NyZWF0ZUNvbXBsZXRpb25NZXNzYWdlKHN0cmVhbUlkLCBtZXNzYWdlKSkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG5leHQ6IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVF1ZXVlID0gcHJvbWlzZVF1ZXVlLnRoZW4oKCkgPT4gdGhpcy5fc2VuZFdpdGhQcm90b2NvbCh0aGlzLl9jcmVhdGVTdHJlYW1JdGVtTWVzc2FnZShzdHJlYW1JZCwgaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9yZXBsYWNlU3RyZWFtaW5nUGFyYW1zKGFyZ3MpIHtcclxuICAgICAgICBjb25zdCBzdHJlYW1zID0gW107XHJcbiAgICAgICAgY29uc3Qgc3RyZWFtSWRzID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyZ3VtZW50ID0gYXJnc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzT2JzZXJ2YWJsZShhcmd1bWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cmVhbUlkID0gdGhpcy5faW52b2NhdGlvbklkO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW52b2NhdGlvbklkKys7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgc3RyZWFtIGZvciBsYXRlciB1c2VcclxuICAgICAgICAgICAgICAgIHN0cmVhbXNbc3RyZWFtSWRdID0gYXJndW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW1JZHMucHVzaChzdHJlYW1JZC50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBzdHJlYW0gZnJvbSBhcmdzXHJcbiAgICAgICAgICAgICAgICBhcmdzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW3N0cmVhbXMsIHN0cmVhbUlkc107XHJcbiAgICB9XHJcbiAgICBfaXNPYnNlcnZhYmxlKGFyZykge1xyXG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIG90aGVyIHN0cmVhbSBpbXBsZW1lbnRhdGlvbnMgdG8ganVzdCB3b3JrIChsaWtlIHJ4anMpXHJcbiAgICAgICAgcmV0dXJuIGFyZyAmJiBhcmcuc3Vic2NyaWJlICYmIHR5cGVvZiBhcmcuc3Vic2NyaWJlID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICB9XHJcbiAgICBfY3JlYXRlU3RyZWFtSW52b2NhdGlvbihtZXRob2ROYW1lLCBhcmdzLCBzdHJlYW1JZHMpIHtcclxuICAgICAgICBjb25zdCBpbnZvY2F0aW9uSWQgPSB0aGlzLl9pbnZvY2F0aW9uSWQ7XHJcbiAgICAgICAgdGhpcy5faW52b2NhdGlvbklkKys7XHJcbiAgICAgICAgaWYgKHN0cmVhbUlkcy5sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogYXJncyxcclxuICAgICAgICAgICAgICAgIGludm9jYXRpb25JZDogaW52b2NhdGlvbklkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICBzdHJlYW1JZHMsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5TdHJlYW1JbnZvY2F0aW9uLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogYXJncyxcclxuICAgICAgICAgICAgICAgIGludm9jYXRpb25JZDogaW52b2NhdGlvbklkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5TdHJlYW1JbnZvY2F0aW9uLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9jcmVhdGVDYW5jZWxJbnZvY2F0aW9uKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaW52b2NhdGlvbklkOiBpZCxcclxuICAgICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuQ2FuY2VsSW52b2NhdGlvbixcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgX2NyZWF0ZVN0cmVhbUl0ZW1NZXNzYWdlKGlkLCBpdGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaW52b2NhdGlvbklkOiBpZCxcclxuICAgICAgICAgICAgaXRlbSxcclxuICAgICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuU3RyZWFtSXRlbSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgX2NyZWF0ZUNvbXBsZXRpb25NZXNzYWdlKGlkLCBlcnJvciwgcmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBlcnJvcixcclxuICAgICAgICAgICAgICAgIGludm9jYXRpb25JZDogaWQsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5Db21wbGV0aW9uLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpbnZvY2F0aW9uSWQ6IGlkLFxyXG4gICAgICAgICAgICByZXN1bHQsXHJcbiAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNvbXBsZXRpb24sXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIF9jcmVhdGVDbG9zZU1lc3NhZ2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogTWVzc2FnZVR5cGUuQ2xvc2UgfTtcclxuICAgIH1cclxuICAgIGFzeW5jIF90cnlTZW5kUGluZ01lc3NhZ2UoKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2VuZE1lc3NhZ2UodGhpcy5fY2FjaGVkUGluZ01lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IGNhcmUgYWJvdXQgdGhlIGVycm9yLiBJdCBzaG91bGQgYmUgc2VlbiBlbHNld2hlcmUgaW4gdGhlIGNsaWVudC5cclxuICAgICAgICAgICAgLy8gVGhlIGNvbm5lY3Rpb24gaXMgcHJvYmFibHkgaW4gYSBiYWQgb3IgY2xvc2VkIHN0YXRlIG5vdywgY2xlYW51cCB0aGUgdGltZXIgc28gaXQgc3RvcHMgdHJpZ2dlcmluZ1xyXG4gICAgICAgICAgICB0aGlzLl9jbGVhbnVwUGluZ1RpbWVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUh1YkNvbm5lY3Rpb24uanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG4vLyAwLCAyLCAxMCwgMzAgc2Vjb25kIGRlbGF5cyBiZWZvcmUgcmVjb25uZWN0IGF0dGVtcHRzLlxyXG5jb25zdCBERUZBVUxUX1JFVFJZX0RFTEFZU19JTl9NSUxMSVNFQ09ORFMgPSBbMCwgMjAwMCwgMTAwMDAsIDMwMDAwLCBudWxsXTtcclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0UmVjb25uZWN0UG9saWN5IHtcclxuICAgIGNvbnN0cnVjdG9yKHJldHJ5RGVsYXlzKSB7XHJcbiAgICAgICAgdGhpcy5fcmV0cnlEZWxheXMgPSByZXRyeURlbGF5cyAhPT0gdW5kZWZpbmVkID8gWy4uLnJldHJ5RGVsYXlzLCBudWxsXSA6IERFRkFVTFRfUkVUUllfREVMQVlTX0lOX01JTExJU0VDT05EUztcclxuICAgIH1cclxuICAgIG5leHRSZXRyeURlbGF5SW5NaWxsaXNlY29uZHMocmV0cnlDb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldHJ5RGVsYXlzW3JldHJ5Q29udGV4dC5wcmV2aW91c1JldHJ5Q291bnRdO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURlZmF1bHRSZWNvbm5lY3RQb2xpY3kuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5leHBvcnQgY2xhc3MgSGVhZGVyTmFtZXMge1xyXG59XHJcbkhlYWRlck5hbWVzLkF1dGhvcml6YXRpb24gPSBcIkF1dGhvcml6YXRpb25cIjtcclxuSGVhZGVyTmFtZXMuQ29va2llID0gXCJDb29raWVcIjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SGVhZGVyTmFtZXMuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBIZWFkZXJOYW1lcyB9IGZyb20gXCIuL0hlYWRlck5hbWVzXCI7XHJcbmltcG9ydCB7IEh0dHBDbGllbnQgfSBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5IdHRwQ2xpZW50IGV4dGVuZHMgSHR0cENsaWVudCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihpbm5lckNsaWVudCwgYWNjZXNzVG9rZW5GYWN0b3J5KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9pbm5lckNsaWVudCA9IGlubmVyQ2xpZW50O1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuRmFjdG9yeSA9IGFjY2Vzc1Rva2VuRmFjdG9yeTtcclxuICAgIH1cclxuICAgIGFzeW5jIHNlbmQocmVxdWVzdCkge1xyXG4gICAgICAgIGxldCBhbGxvd1JldHJ5ID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5ICYmICghdGhpcy5fYWNjZXNzVG9rZW4gfHwgKHJlcXVlc3QudXJsICYmIHJlcXVlc3QudXJsLmluZGV4T2YoXCIvbmVnb3RpYXRlP1wiKSA+IDApKSkge1xyXG4gICAgICAgICAgICAvLyBkb24ndCByZXRyeSBpZiB0aGUgcmVxdWVzdCBpcyBhIG5lZ290aWF0ZSBvciBpZiB3ZSBqdXN0IGdvdCBhIHBvdGVudGlhbGx5IG5ldyB0b2tlbiBmcm9tIHRoZSBhY2Nlc3MgdG9rZW4gZmFjdG9yeVxyXG4gICAgICAgICAgICBhbGxvd1JldHJ5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuID0gYXdhaXQgdGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3NldEF1dGhvcml6YXRpb25IZWFkZXIocmVxdWVzdCk7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9pbm5lckNsaWVudC5zZW5kKHJlcXVlc3QpO1xyXG4gICAgICAgIGlmIChhbGxvd1JldHJ5ICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDQwMSAmJiB0aGlzLl9hY2Nlc3NUb2tlbkZhY3RvcnkpIHtcclxuICAgICAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW4gPSBhd2FpdCB0aGlzLl9hY2Nlc3NUb2tlbkZhY3RvcnkoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0QXV0aG9yaXphdGlvbkhlYWRlcihyZXF1ZXN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2lubmVyQ2xpZW50LnNlbmQocmVxdWVzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgIH1cclxuICAgIF9zZXRBdXRob3JpemF0aW9uSGVhZGVyKHJlcXVlc3QpIHtcclxuICAgICAgICBpZiAoIXJlcXVlc3QuaGVhZGVycykge1xyXG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjY2Vzc1Rva2VuKSB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1tIZWFkZXJOYW1lcy5BdXRob3JpemF0aW9uXSA9IGBCZWFyZXIgJHt0aGlzLl9hY2Nlc3NUb2tlbn1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkb24ndCByZW1vdmUgdGhlIGhlYWRlciBpZiB0aGVyZSBpc24ndCBhbiBhY2Nlc3MgdG9rZW4gZmFjdG9yeSwgdGhlIHVzZXIgbWFudWFsbHkgYWRkZWQgdGhlIGhlYWRlciBpbiB0aGlzIGNhc2VcclxuICAgICAgICBlbHNlIGlmICh0aGlzLl9hY2Nlc3NUb2tlbkZhY3RvcnkpIHtcclxuICAgICAgICAgICAgaWYgKHJlcXVlc3QuaGVhZGVyc1tIZWFkZXJOYW1lcy5BdXRob3JpemF0aW9uXSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlcXVlc3QuaGVhZGVyc1tIZWFkZXJOYW1lcy5BdXRob3JpemF0aW9uXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGdldENvb2tpZVN0cmluZyh1cmwpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW5uZXJDbGllbnQuZ2V0Q29va2llU3RyaW5nKHVybCk7XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9QWNjZXNzVG9rZW5IdHRwQ2xpZW50LmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLy8gVGhpcyB3aWxsIGJlIHRyZWF0ZWQgYXMgYSBiaXQgZmxhZyBpbiB0aGUgZnV0dXJlLCBzbyB3ZSBrZWVwIGl0IHVzaW5nIHBvd2VyLW9mLXR3byB2YWx1ZXMuXHJcbi8qKiBTcGVjaWZpZXMgYSBzcGVjaWZpYyBIVFRQIHRyYW5zcG9ydCB0eXBlLiAqL1xyXG5leHBvcnQgdmFyIEh0dHBUcmFuc3BvcnRUeXBlO1xyXG4oZnVuY3Rpb24gKEh0dHBUcmFuc3BvcnRUeXBlKSB7XHJcbiAgICAvKiogU3BlY2lmaWVzIG5vIHRyYW5zcG9ydCBwcmVmZXJlbmNlLiAqL1xyXG4gICAgSHR0cFRyYW5zcG9ydFR5cGVbSHR0cFRyYW5zcG9ydFR5cGVbXCJOb25lXCJdID0gMF0gPSBcIk5vbmVcIjtcclxuICAgIC8qKiBTcGVjaWZpZXMgdGhlIFdlYlNvY2tldHMgdHJhbnNwb3J0LiAqL1xyXG4gICAgSHR0cFRyYW5zcG9ydFR5cGVbSHR0cFRyYW5zcG9ydFR5cGVbXCJXZWJTb2NrZXRzXCJdID0gMV0gPSBcIldlYlNvY2tldHNcIjtcclxuICAgIC8qKiBTcGVjaWZpZXMgdGhlIFNlcnZlci1TZW50IEV2ZW50cyB0cmFuc3BvcnQuICovXHJcbiAgICBIdHRwVHJhbnNwb3J0VHlwZVtIdHRwVHJhbnNwb3J0VHlwZVtcIlNlcnZlclNlbnRFdmVudHNcIl0gPSAyXSA9IFwiU2VydmVyU2VudEV2ZW50c1wiO1xyXG4gICAgLyoqIFNwZWNpZmllcyB0aGUgTG9uZyBQb2xsaW5nIHRyYW5zcG9ydC4gKi9cclxuICAgIEh0dHBUcmFuc3BvcnRUeXBlW0h0dHBUcmFuc3BvcnRUeXBlW1wiTG9uZ1BvbGxpbmdcIl0gPSA0XSA9IFwiTG9uZ1BvbGxpbmdcIjtcclxufSkoSHR0cFRyYW5zcG9ydFR5cGUgfHwgKEh0dHBUcmFuc3BvcnRUeXBlID0ge30pKTtcclxuLyoqIFNwZWNpZmllcyB0aGUgdHJhbnNmZXIgZm9ybWF0IGZvciBhIGNvbm5lY3Rpb24uICovXHJcbmV4cG9ydCB2YXIgVHJhbnNmZXJGb3JtYXQ7XHJcbihmdW5jdGlvbiAoVHJhbnNmZXJGb3JtYXQpIHtcclxuICAgIC8qKiBTcGVjaWZpZXMgdGhhdCBvbmx5IHRleHQgZGF0YSB3aWxsIGJlIHRyYW5zbWl0dGVkIG92ZXIgdGhlIGNvbm5lY3Rpb24uICovXHJcbiAgICBUcmFuc2ZlckZvcm1hdFtUcmFuc2ZlckZvcm1hdFtcIlRleHRcIl0gPSAxXSA9IFwiVGV4dFwiO1xyXG4gICAgLyoqIFNwZWNpZmllcyB0aGF0IGJpbmFyeSBkYXRhIHdpbGwgYmUgdHJhbnNtaXR0ZWQgb3ZlciB0aGUgY29ubmVjdGlvbi4gKi9cclxuICAgIFRyYW5zZmVyRm9ybWF0W1RyYW5zZmVyRm9ybWF0W1wiQmluYXJ5XCJdID0gMl0gPSBcIkJpbmFyeVwiO1xyXG59KShUcmFuc2ZlckZvcm1hdCB8fCAoVHJhbnNmZXJGb3JtYXQgPSB7fSkpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1JVHJhbnNwb3J0LmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuLy8gUm91Z2ggcG9seWZpbGwgb2YgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0Q29udHJvbGxlclxyXG4vLyBXZSBkb24ndCBhY3R1YWxseSBldmVyIHVzZSB0aGUgQVBJIGJlaW5nIHBvbHlmaWxsZWQsIHdlIGFsd2F5cyB1c2UgdGhlIHBvbHlmaWxsIGJlY2F1c2VcclxuLy8gaXQncyBhIHZlcnkgbmV3IEFQSSByaWdodCBub3cuXHJcbi8vIE5vdCBleHBvcnRlZCBmcm9tIGluZGV4LlxyXG4vKiogQHByaXZhdGUgKi9cclxuZXhwb3J0IGNsYXNzIEFib3J0Q29udHJvbGxlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9pc0Fib3J0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm9uYWJvcnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgYWJvcnQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9pc0Fib3J0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5faXNBYm9ydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub25hYm9ydCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmFib3J0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXQgc2lnbmFsKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgZ2V0IGFib3J0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQWJvcnRlZDtcclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1BYm9ydENvbnRyb2xsZXIuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBBYm9ydENvbnRyb2xsZXIgfSBmcm9tIFwiLi9BYm9ydENvbnRyb2xsZXJcIjtcclxuaW1wb3J0IHsgSHR0cEVycm9yLCBUaW1lb3V0RXJyb3IgfSBmcm9tIFwiLi9FcnJvcnNcIjtcclxuaW1wb3J0IHsgTG9nTGV2ZWwgfSBmcm9tIFwiLi9JTG9nZ2VyXCI7XHJcbmltcG9ydCB7IFRyYW5zZmVyRm9ybWF0IH0gZnJvbSBcIi4vSVRyYW5zcG9ydFwiO1xyXG5pbXBvcnQgeyBBcmcsIGdldERhdGFEZXRhaWwsIGdldFVzZXJBZ2VudEhlYWRlciwgc2VuZE1lc3NhZ2UgfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG4vLyBOb3QgZXhwb3J0ZWQgZnJvbSAnaW5kZXgnLCB0aGlzIHR5cGUgaXMgaW50ZXJuYWwuXHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgY2xhc3MgTG9uZ1BvbGxpbmdUcmFuc3BvcnQge1xyXG4gICAgLy8gVGhpcyBpcyBhbiBpbnRlcm5hbCB0eXBlLCBub3QgZXhwb3J0ZWQgZnJvbSAnaW5kZXgnIHNvIHRoaXMgaXMgcmVhbGx5IGp1c3QgaW50ZXJuYWwuXHJcbiAgICBnZXQgcG9sbEFib3J0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BvbGxBYm9ydC5hYm9ydGVkO1xyXG4gICAgfVxyXG4gICAgY29uc3RydWN0b3IoaHR0cENsaWVudCwgbG9nZ2VyLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5faHR0cENsaWVudCA9IGh0dHBDbGllbnQ7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyID0gbG9nZ2VyO1xyXG4gICAgICAgIHRoaXMuX3BvbGxBYm9ydCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgICAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbnJlY2VpdmUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMub25jbG9zZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjb25uZWN0KHVybCwgdHJhbnNmZXJGb3JtYXQpIHtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZCh1cmwsIFwidXJsXCIpO1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKHRyYW5zZmVyRm9ybWF0LCBcInRyYW5zZmVyRm9ybWF0XCIpO1xyXG4gICAgICAgIEFyZy5pc0luKHRyYW5zZmVyRm9ybWF0LCBUcmFuc2ZlckZvcm1hdCwgXCJ0cmFuc2ZlckZvcm1hdFwiKTtcclxuICAgICAgICB0aGlzLl91cmwgPSB1cmw7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgXCIoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBDb25uZWN0aW5nLlwiKTtcclxuICAgICAgICAvLyBBbGxvdyBiaW5hcnkgZm9ybWF0IG9uIE5vZGUgYW5kIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCBiaW5hcnkgY29udGVudCAoaW5kaWNhdGVkIGJ5IHRoZSBwcmVzZW5jZSBvZiByZXNwb25zZVR5cGUgcHJvcGVydHkpXHJcbiAgICAgICAgaWYgKHRyYW5zZmVyRm9ybWF0ID09PSBUcmFuc2ZlckZvcm1hdC5CaW5hcnkgJiZcclxuICAgICAgICAgICAgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgbmV3IFhNTEh0dHBSZXF1ZXN0KCkucmVzcG9uc2VUeXBlICE9PSBcInN0cmluZ1wiKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCaW5hcnkgcHJvdG9jb2xzIG92ZXIgWG1sSHR0cFJlcXVlc3Qgbm90IGltcGxlbWVudGluZyBhZHZhbmNlZCBmZWF0dXJlcyBhcmUgbm90IHN1cHBvcnRlZC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IFtuYW1lLCB2YWx1ZV0gPSBnZXRVc2VyQWdlbnRIZWFkZXIoKTtcclxuICAgICAgICBjb25zdCBoZWFkZXJzID0geyBbbmFtZV06IHZhbHVlLCAuLi50aGlzLl9vcHRpb25zLmhlYWRlcnMgfTtcclxuICAgICAgICBjb25zdCBwb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgYWJvcnRTaWduYWw6IHRoaXMuX3BvbGxBYm9ydC5zaWduYWwsXHJcbiAgICAgICAgICAgIGhlYWRlcnMsXHJcbiAgICAgICAgICAgIHRpbWVvdXQ6IDEwMDAwMCxcclxuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0aGlzLl9vcHRpb25zLndpdGhDcmVkZW50aWFscyxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0cmFuc2ZlckZvcm1hdCA9PT0gVHJhbnNmZXJGb3JtYXQuQmluYXJ5KSB7XHJcbiAgICAgICAgICAgIHBvbGxPcHRpb25zLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTWFrZSBpbml0aWFsIGxvbmcgcG9sbGluZyByZXF1ZXN0XHJcbiAgICAgICAgLy8gU2VydmVyIHVzZXMgZmlyc3QgbG9uZyBwb2xsaW5nIHJlcXVlc3QgdG8gZmluaXNoIGluaXRpYWxpemluZyBjb25uZWN0aW9uIGFuZCBpdCByZXR1cm5zIHdpdGhvdXQgZGF0YVxyXG4gICAgICAgIGNvbnN0IHBvbGxVcmwgPSBgJHt1cmx9Jl89JHtEYXRlLm5vdygpfWA7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgYChMb25nUG9sbGluZyB0cmFuc3BvcnQpIHBvbGxpbmc6ICR7cG9sbFVybH0uYCk7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9odHRwQ2xpZW50LmdldChwb2xsVXJsLCBwb2xsT3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkVycm9yLCBgKExvbmdQb2xsaW5nIHRyYW5zcG9ydCkgVW5leHBlY3RlZCByZXNwb25zZSBjb2RlOiAke3Jlc3BvbnNlLnN0YXR1c0NvZGV9LmApO1xyXG4gICAgICAgICAgICAvLyBNYXJrIHJ1bm5pbmcgYXMgZmFsc2Ugc28gdGhhdCB0aGUgcG9sbCBpbW1lZGlhdGVseSBlbmRzIGFuZCBydW5zIHRoZSBjbG9zZSBsb2dpY1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZUVycm9yID0gbmV3IEh0dHBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0IHx8IFwiXCIsIHJlc3BvbnNlLnN0YXR1c0NvZGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVjZWl2aW5nID0gdGhpcy5fcG9sbCh0aGlzLl91cmwsIHBvbGxPcHRpb25zKTtcclxuICAgIH1cclxuICAgIGFzeW5jIF9wb2xsKHVybCwgcG9sbE9wdGlvbnMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5fcnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2xsVXJsID0gYCR7dXJsfSZfPSR7RGF0ZS5ub3coKX1gO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIGAoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBwb2xsaW5nOiAke3BvbGxVcmx9LmApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faHR0cENsaWVudC5nZXQocG9sbFVybCwgcG9sbE9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCIoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBQb2xsIHRlcm1pbmF0ZWQgYnkgc2VydmVyLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYChMb25nUG9sbGluZyB0cmFuc3BvcnQpIFVuZXhwZWN0ZWQgcmVzcG9uc2UgY29kZTogJHtyZXNwb25zZS5zdGF0dXNDb2RlfS5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBzdGF0dXMgY29kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZUVycm9yID0gbmV3IEh0dHBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0IHx8IFwiXCIsIHJlc3BvbnNlLnN0YXR1c0NvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIHRoZSByZXNwb25zZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgYChMb25nUG9sbGluZyB0cmFuc3BvcnQpIGRhdGEgcmVjZWl2ZWQuICR7Z2V0RGF0YURldGFpbChyZXNwb25zZS5jb250ZW50LCB0aGlzLl9vcHRpb25zLmxvZ01lc3NhZ2VDb250ZW50KX0uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbnJlY2VpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9ucmVjZWl2ZShyZXNwb25zZS5jb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYW5vdGhlciB3YXkgdGltZW91dCBtYW5pZmVzdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIFwiKExvbmdQb2xsaW5nIHRyYW5zcG9ydCkgUG9sbCB0aW1lZCBvdXQsIHJlaXNzdWluZy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMb2cgYnV0IGRpc3JlZ2FyZCBlcnJvcnMgdGhhdCBvY2N1ciBhZnRlciBzdG9wcGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBgKExvbmdQb2xsaW5nIHRyYW5zcG9ydCkgUG9sbCBlcnJvcmVkIGFmdGVyIHNodXRkb3duOiAke2UubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgVGltZW91dEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGltZW91dHMgYW5kIHJlaXNzdWUgdGhlIHBvbGwuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihMb25nUG9sbGluZyB0cmFuc3BvcnQpIFBvbGwgdGltZWQgb3V0LCByZWlzc3VpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xvc2UgdGhlIGNvbm5lY3Rpb24gd2l0aCB0aGUgZXJyb3IgYXMgdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlRXJyb3IgPSBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihMb25nUG9sbGluZyB0cmFuc3BvcnQpIFBvbGxpbmcgY29tcGxldGUuXCIpO1xyXG4gICAgICAgICAgICAvLyBXZSB3aWxsIHJlYWNoIGhlcmUgd2l0aCBwb2xsQWJvcnRlZD09ZmFsc2Ugd2hlbiB0aGUgc2VydmVyIHJldHVybmVkIGEgcmVzcG9uc2UgY2F1c2luZyB0aGUgdHJhbnNwb3J0IHRvIHN0b3AuXHJcbiAgICAgICAgICAgIC8vIElmIHBvbGxBYm9ydGVkPT10cnVlIHRoZW4gY2xpZW50IGluaXRpYXRlZCB0aGUgc3RvcCBhbmQgdGhlIHN0b3AgbWV0aG9kIHdpbGwgcmFpc2UgdGhlIGNsb3NlIGV2ZW50IGFmdGVyIERFTEVURSBpcyBzZW50LlxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucG9sbEFib3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JhaXNlT25DbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgYXN5bmMgc2VuZChkYXRhKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3Qgc2VuZCB1bnRpbCB0aGUgdHJhbnNwb3J0IGlzIGNvbm5lY3RlZFwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzZW5kTWVzc2FnZSh0aGlzLl9sb2dnZXIsIFwiTG9uZ1BvbGxpbmdcIiwgdGhpcy5faHR0cENsaWVudCwgdGhpcy5fdXJsLCBkYXRhLCB0aGlzLl9vcHRpb25zKTtcclxuICAgIH1cclxuICAgIGFzeW5jIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgXCIoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBTdG9wcGluZyBwb2xsaW5nLlwiKTtcclxuICAgICAgICAvLyBUZWxsIHJlY2VpdmluZyBsb29wIHRvIHN0b3AsIGFib3J0IGFueSBjdXJyZW50IHJlcXVlc3QsIGFuZCB0aGVuIHdhaXQgZm9yIGl0IHRvIGZpbmlzaFxyXG4gICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9wb2xsQWJvcnQuYWJvcnQoKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZWNlaXZpbmc7XHJcbiAgICAgICAgICAgIC8vIFNlbmQgREVMRVRFIHRvIGNsZWFuIHVwIGxvbmcgcG9sbGluZyBvbiB0aGUgc2VydmVyXHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIGAoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBzZW5kaW5nIERFTEVURSByZXF1ZXN0IHRvICR7dGhpcy5fdXJsfS5gKTtcclxuICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IHt9O1xyXG4gICAgICAgICAgICBjb25zdCBbbmFtZSwgdmFsdWVdID0gZ2V0VXNlckFnZW50SGVhZGVyKCk7XHJcbiAgICAgICAgICAgIGhlYWRlcnNbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgY29uc3QgZGVsZXRlT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uaGVhZGVycywgLi4udGhpcy5fb3B0aW9ucy5oZWFkZXJzIH0sXHJcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aGlzLl9vcHRpb25zLnRpbWVvdXQsXHJcbiAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRoaXMuX29wdGlvbnMud2l0aENyZWRlbnRpYWxzLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgZXJyb3I7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9odHRwQ2xpZW50LmRlbGV0ZSh0aGlzLl91cmwsIGRlbGV0ZU9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGVycm9yID0gZXJyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSHR0cEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1c0NvZGUgPT09IDQwNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihMb25nUG9sbGluZyB0cmFuc3BvcnQpIEEgNDA0IHJlc3BvbnNlIHdhcyByZXR1cm5lZCBmcm9tIHNlbmRpbmcgYSBERUxFVEUgcmVxdWVzdC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBgKExvbmdQb2xsaW5nIHRyYW5zcG9ydCkgRXJyb3Igc2VuZGluZyBhIERFTEVURSByZXF1ZXN0OiAke2Vycm9yfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIFwiKExvbmdQb2xsaW5nIHRyYW5zcG9ydCkgREVMRVRFIHJlcXVlc3QgYWNjZXB0ZWQuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihMb25nUG9sbGluZyB0cmFuc3BvcnQpIFN0b3AgZmluaXNoZWQuXCIpO1xyXG4gICAgICAgICAgICAvLyBSYWlzZSBjbG9zZSBldmVudCBoZXJlIGluc3RlYWQgb2YgaW4gcG9sbGluZ1xyXG4gICAgICAgICAgICAvLyBJdCBuZWVkcyB0byBoYXBwZW4gYWZ0ZXIgdGhlIERFTEVURSByZXF1ZXN0IGlzIHNlbnRcclxuICAgICAgICAgICAgdGhpcy5fcmFpc2VPbkNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX3JhaXNlT25DbG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5vbmNsb3NlKSB7XHJcbiAgICAgICAgICAgIGxldCBsb2dNZXNzYWdlID0gXCIoTG9uZ1BvbGxpbmcgdHJhbnNwb3J0KSBGaXJpbmcgb25jbG9zZSBldmVudC5cIjtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGxvZ01lc3NhZ2UgKz0gXCIgRXJyb3I6IFwiICsgdGhpcy5fY2xvc2VFcnJvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBsb2dNZXNzYWdlKTtcclxuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKHRoaXMuX2Nsb3NlRXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Mb25nUG9sbGluZ1RyYW5zcG9ydC5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBUcmFuc2ZlckZvcm1hdCB9IGZyb20gXCIuL0lUcmFuc3BvcnRcIjtcclxuaW1wb3J0IHsgQXJnLCBnZXREYXRhRGV0YWlsLCBnZXRVc2VyQWdlbnRIZWFkZXIsIFBsYXRmb3JtLCBzZW5kTWVzc2FnZSB9IGZyb20gXCIuL1V0aWxzXCI7XHJcbi8qKiBAcHJpdmF0ZSAqL1xyXG5leHBvcnQgY2xhc3MgU2VydmVyU2VudEV2ZW50c1RyYW5zcG9ydCB7XHJcbiAgICBjb25zdHJ1Y3RvcihodHRwQ2xpZW50LCBhY2Nlc3NUb2tlbiwgbG9nZ2VyLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5faHR0cENsaWVudCA9IGh0dHBDbGllbnQ7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW4gPSBhY2Nlc3NUb2tlbjtcclxuICAgICAgICB0aGlzLl9sb2dnZXIgPSBsb2dnZXI7XHJcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgdGhpcy5vbnJlY2VpdmUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMub25jbG9zZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjb25uZWN0KHVybCwgdHJhbnNmZXJGb3JtYXQpIHtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZCh1cmwsIFwidXJsXCIpO1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKHRyYW5zZmVyRm9ybWF0LCBcInRyYW5zZmVyRm9ybWF0XCIpO1xyXG4gICAgICAgIEFyZy5pc0luKHRyYW5zZmVyRm9ybWF0LCBUcmFuc2ZlckZvcm1hdCwgXCJ0cmFuc2ZlckZvcm1hdFwiKTtcclxuICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihTU0UgdHJhbnNwb3J0KSBDb25uZWN0aW5nLlwiKTtcclxuICAgICAgICAvLyBzZXQgdXJsIGJlZm9yZSBhY2Nlc3NUb2tlbkZhY3RvcnkgYmVjYXVzZSB0aGlzLl91cmwgaXMgb25seSBmb3Igc2VuZCBhbmQgd2Ugc2V0IHRoZSBhdXRoIGhlYWRlciBpbnN0ZWFkIG9mIHRoZSBxdWVyeSBzdHJpbmcgZm9yIHNlbmRcclxuICAgICAgICB0aGlzLl91cmwgPSB1cmw7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjY2Vzc1Rva2VuKSB7XHJcbiAgICAgICAgICAgIHVybCArPSAodXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCIpICsgYGFjY2Vzc190b2tlbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLl9hY2Nlc3NUb2tlbil9YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgbGV0IG9wZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodHJhbnNmZXJGb3JtYXQgIT09IFRyYW5zZmVyRm9ybWF0LlRleHQpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJUaGUgU2VydmVyLVNlbnQgRXZlbnRzIHRyYW5zcG9ydCBvbmx5IHN1cHBvcnRzIHRoZSAnVGV4dCcgdHJhbnNmZXIgZm9ybWF0XCIpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgZXZlbnRTb3VyY2U7XHJcbiAgICAgICAgICAgIGlmIChQbGF0Zm9ybS5pc0Jyb3dzZXIgfHwgUGxhdGZvcm0uaXNXZWJXb3JrZXIpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50U291cmNlID0gbmV3IHRoaXMuX29wdGlvbnMuRXZlbnRTb3VyY2UodXJsLCB7IHdpdGhDcmVkZW50aWFsczogdGhpcy5fb3B0aW9ucy53aXRoQ3JlZGVudGlhbHMgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBOb24tYnJvd3NlciBwYXNzZXMgY29va2llcyB2aWEgdGhlIGRpY3Rpb25hcnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvb2tpZXMgPSB0aGlzLl9odHRwQ2xpZW50LmdldENvb2tpZVN0cmluZyh1cmwpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgaGVhZGVycy5Db29raWUgPSBjb29raWVzO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgW25hbWUsIHZhbHVlXSA9IGdldFVzZXJBZ2VudEhlYWRlcigpO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZXZlbnRTb3VyY2UgPSBuZXcgdGhpcy5fb3B0aW9ucy5FdmVudFNvdXJjZSh1cmwsIHsgd2l0aENyZWRlbnRpYWxzOiB0aGlzLl9vcHRpb25zLndpdGhDcmVkZW50aWFscywgaGVhZGVyczogeyAuLi5oZWFkZXJzLCAuLi50aGlzLl9vcHRpb25zLmhlYWRlcnMgfSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRTb3VyY2Uub25tZXNzYWdlID0gKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbnJlY2VpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIGAoU1NFIHRyYW5zcG9ydCkgZGF0YSByZWNlaXZlZC4gJHtnZXREYXRhRGV0YWlsKGUuZGF0YSwgdGhpcy5fb3B0aW9ucy5sb2dNZXNzYWdlQ29udGVudCl9LmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbnJlY2VpdmUoZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlKGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlOiBub3QgdXNpbmcgZXZlbnQgb24gcHVycG9zZVxyXG4gICAgICAgICAgICAgICAgZXZlbnRTb3VyY2Uub25lcnJvciA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRXZlbnRTb3VyY2UgZG9lc24ndCBnaXZlIGFueSB1c2VmdWwgaW5mb3JtYXRpb24gYWJvdXQgc2VydmVyIHNpZGUgY2xvc2VzLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJFdmVudFNvdXJjZSBmYWlsZWQgdG8gY29ubmVjdC4gVGhlIGNvbm5lY3Rpb24gY291bGQgbm90IGJlIGZvdW5kIG9uIHRoZSBzZXJ2ZXIsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIgZWl0aGVyIHRoZSBjb25uZWN0aW9uIElEIGlzIG5vdCBwcmVzZW50IG9uIHRoZSBzZXJ2ZXIsIG9yIGEgcHJveHkgaXMgcmVmdXNpbmcvYnVmZmVyaW5nIHRoZSBjb25uZWN0aW9uLlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiIElmIHlvdSBoYXZlIG11bHRpcGxlIHNlcnZlcnMgY2hlY2sgdGhhdCBzdGlja3kgc2Vzc2lvbnMgYXJlIGVuYWJsZWQuXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZXZlbnRTb3VyY2Uub25vcGVuID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuSW5mb3JtYXRpb24sIGBTU0UgY29ubmVjdGVkIHRvICR7dGhpcy5fdXJsfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50U291cmNlID0gZXZlbnRTb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGFzeW5jIHNlbmQoZGF0YSkge1xyXG4gICAgICAgIGlmICghdGhpcy5fZXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBzZW5kIHVudGlsIHRoZSB0cmFuc3BvcnQgaXMgY29ubmVjdGVkXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNlbmRNZXNzYWdlKHRoaXMuX2xvZ2dlciwgXCJTU0VcIiwgdGhpcy5faHR0cENsaWVudCwgdGhpcy5fdXJsLCBkYXRhLCB0aGlzLl9vcHRpb25zKTtcclxuICAgIH1cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fY2xvc2UoKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBfY2xvc2UoZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9ldmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9ldmVudFNvdXJjZS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9ldmVudFNvdXJjZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKHRoaXMub25jbG9zZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmNsb3NlKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNlcnZlclNlbnRFdmVudHNUcmFuc3BvcnQuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBIZWFkZXJOYW1lcyB9IGZyb20gXCIuL0hlYWRlck5hbWVzXCI7XHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBUcmFuc2ZlckZvcm1hdCB9IGZyb20gXCIuL0lUcmFuc3BvcnRcIjtcclxuaW1wb3J0IHsgQXJnLCBnZXREYXRhRGV0YWlsLCBnZXRVc2VyQWdlbnRIZWFkZXIsIFBsYXRmb3JtIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBXZWJTb2NrZXRUcmFuc3BvcnQge1xyXG4gICAgY29uc3RydWN0b3IoaHR0cENsaWVudCwgYWNjZXNzVG9rZW5GYWN0b3J5LCBsb2dnZXIsIGxvZ01lc3NhZ2VDb250ZW50LCB3ZWJTb2NrZXRDb25zdHJ1Y3RvciwgaGVhZGVycykge1xyXG4gICAgICAgIHRoaXMuX2xvZ2dlciA9IGxvZ2dlcjtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbkZhY3RvcnkgPSBhY2Nlc3NUb2tlbkZhY3Rvcnk7XHJcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZUNvbnRlbnQgPSBsb2dNZXNzYWdlQ29udGVudDtcclxuICAgICAgICB0aGlzLl93ZWJTb2NrZXRDb25zdHJ1Y3RvciA9IHdlYlNvY2tldENvbnN0cnVjdG9yO1xyXG4gICAgICAgIHRoaXMuX2h0dHBDbGllbnQgPSBodHRwQ2xpZW50O1xyXG4gICAgICAgIHRoaXMub25yZWNlaXZlID0gbnVsbDtcclxuICAgICAgICB0aGlzLm9uY2xvc2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2hlYWRlcnMgPSBoZWFkZXJzO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgY29ubmVjdCh1cmwsIHRyYW5zZmVyRm9ybWF0KSB7XHJcbiAgICAgICAgQXJnLmlzUmVxdWlyZWQodXJsLCBcInVybFwiKTtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZCh0cmFuc2ZlckZvcm1hdCwgXCJ0cmFuc2ZlckZvcm1hdFwiKTtcclxuICAgICAgICBBcmcuaXNJbih0cmFuc2ZlckZvcm1hdCwgVHJhbnNmZXJGb3JtYXQsIFwidHJhbnNmZXJGb3JtYXRcIik7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgXCIoV2ViU29ja2V0cyB0cmFuc3BvcnQpIENvbm5lY3RpbmcuXCIpO1xyXG4gICAgICAgIGxldCB0b2tlbjtcclxuICAgICAgICBpZiAodGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIHRva2VuID0gYXdhaXQgdGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHVybCA9IHVybC5yZXBsYWNlKC9eaHR0cC8sIFwid3NcIik7XHJcbiAgICAgICAgICAgIGxldCB3ZWJTb2NrZXQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvb2tpZXMgPSB0aGlzLl9odHRwQ2xpZW50LmdldENvb2tpZVN0cmluZyh1cmwpO1xyXG4gICAgICAgICAgICBsZXQgb3BlbmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChQbGF0Zm9ybS5pc05vZGUgfHwgUGxhdGZvcm0uaXNSZWFjdE5hdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgW25hbWUsIHZhbHVlXSA9IGdldFVzZXJBZ2VudEhlYWRlcigpO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1tIZWFkZXJOYW1lcy5BdXRob3JpemF0aW9uXSA9IGBCZWFyZXIgJHt0b2tlbn1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGNvb2tpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzW0hlYWRlck5hbWVzLkNvb2tpZV0gPSBjb29raWVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gT25seSBwYXNzIGhlYWRlcnMgd2hlbiBpbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHNcclxuICAgICAgICAgICAgICAgIHdlYlNvY2tldCA9IG5ldyB0aGlzLl93ZWJTb2NrZXRDb25zdHJ1Y3Rvcih1cmwsIHVuZGVmaW5lZCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uaGVhZGVycywgLi4udGhpcy5faGVhZGVycyB9LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gKHVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiKSArIGBhY2Nlc3NfdG9rZW49JHtlbmNvZGVVUklDb21wb25lbnQodG9rZW4pfWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF3ZWJTb2NrZXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIENocm9tZSBpcyBub3QgaGFwcHkgd2l0aCBwYXNzaW5nICd1bmRlZmluZWQnIGFzIHByb3RvY29sXHJcbiAgICAgICAgICAgICAgICB3ZWJTb2NrZXQgPSBuZXcgdGhpcy5fd2ViU29ja2V0Q29uc3RydWN0b3IodXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHJhbnNmZXJGb3JtYXQgPT09IFRyYW5zZmVyRm9ybWF0LkJpbmFyeSkge1xyXG4gICAgICAgICAgICAgICAgd2ViU29ja2V0LmJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2ViU29ja2V0Lm9ub3BlbiA9IChfZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuSW5mb3JtYXRpb24sIGBXZWJTb2NrZXQgY29ubmVjdGVkIHRvICR7dXJsfS5gKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dlYlNvY2tldCA9IHdlYlNvY2tldDtcclxuICAgICAgICAgICAgICAgIG9wZW5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHdlYlNvY2tldC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgLy8gRXJyb3JFdmVudCBpcyBhIGJyb3dzZXIgb25seSB0eXBlIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIHR5cGUgZXhpc3RzIGJlZm9yZSB1c2luZyBpdFxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBFcnJvckV2ZW50ICE9PSBcInVuZGVmaW5lZFwiICYmIGV2ZW50IGluc3RhbmNlb2YgRXJyb3JFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gZXZlbnQuZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IFwiVGhlcmUgd2FzIGFuIGVycm9yIHdpdGggdGhlIHRyYW5zcG9ydFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgYChXZWJTb2NrZXRzIHRyYW5zcG9ydCkgJHtlcnJvcn0uYCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHdlYlNvY2tldC5vbm1lc3NhZ2UgPSAobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5UcmFjZSwgYChXZWJTb2NrZXRzIHRyYW5zcG9ydCkgZGF0YSByZWNlaXZlZC4gJHtnZXREYXRhRGV0YWlsKG1lc3NhZ2UuZGF0YSwgdGhpcy5fbG9nTWVzc2FnZUNvbnRlbnQpfS5gKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9ucmVjZWl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25yZWNlaXZlKG1lc3NhZ2UuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZShlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHdlYlNvY2tldC5vbmNsb3NlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBjYWxsIGNsb3NlIGhhbmRsZXIgaWYgY29ubmVjdGlvbiB3YXMgbmV2ZXIgZXN0YWJsaXNoZWRcclxuICAgICAgICAgICAgICAgIC8vIFdlJ2xsIHJlamVjdCB0aGUgY29ubmVjdCBjYWxsIGluc3RlYWRcclxuICAgICAgICAgICAgICAgIGlmIChvcGVuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZShldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVycm9yRXZlbnQgaXMgYSBicm93c2VyIG9ubHkgdHlwZSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSB0eXBlIGV4aXN0cyBiZWZvcmUgdXNpbmcgaXRcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIEVycm9yRXZlbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgZXZlbnQgaW5zdGFuY2VvZiBFcnJvckV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yID0gZXZlbnQuZXJyb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvciA9IFwiV2ViU29ja2V0IGZhaWxlZCB0byBjb25uZWN0LiBUaGUgY29ubmVjdGlvbiBjb3VsZCBub3QgYmUgZm91bmQgb24gdGhlIHNlcnZlcixcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiBlaXRoZXIgdGhlIGVuZHBvaW50IG1heSBub3QgYmUgYSBTaWduYWxSIGVuZHBvaW50LFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiIHRoZSBjb25uZWN0aW9uIElEIGlzIG5vdCBwcmVzZW50IG9uIHRoZSBzZXJ2ZXIsIG9yIHRoZXJlIGlzIGEgcHJveHkgYmxvY2tpbmcgV2ViU29ja2V0cy5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiBJZiB5b3UgaGF2ZSBtdWx0aXBsZSBzZXJ2ZXJzIGNoZWNrIHRoYXQgc3RpY2t5IHNlc3Npb25zIGFyZSBlbmFibGVkLlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycm9yKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBzZW5kKGRhdGEpIHtcclxuICAgICAgICBpZiAodGhpcy5fd2ViU29ja2V0ICYmIHRoaXMuX3dlYlNvY2tldC5yZWFkeVN0YXRlID09PSB0aGlzLl93ZWJTb2NrZXRDb25zdHJ1Y3Rvci5PUEVOKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuVHJhY2UsIGAoV2ViU29ja2V0cyB0cmFuc3BvcnQpIHNlbmRpbmcgZGF0YS4gJHtnZXREYXRhRGV0YWlsKGRhdGEsIHRoaXMuX2xvZ01lc3NhZ2VDb250ZW50KX0uYCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3dlYlNvY2tldC5zZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIldlYlNvY2tldCBpcyBub3QgaW4gdGhlIE9QRU4gc3RhdGVcIik7XHJcbiAgICB9XHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl93ZWJTb2NrZXQpIHtcclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIG9uY2xvc2UgY2FsbGJhY2sgaW5saW5lIHNvIHdlIGtub3cgdGhlIEh0dHBDb25uZWN0aW9uIHdhcyBjbG9zZWQgcHJvcGVybHkgYmVmb3JlIHJldHVybmluZ1xyXG4gICAgICAgICAgICAvLyBUaGlzIGFsc28gc29sdmVzIGFuIGlzc3VlIHdoZXJlIHdlYnNvY2tldC5vbmNsb3NlIGNvdWxkIHRha2UgMTgrIHNlY29uZHMgdG8gdHJpZ2dlciBkdXJpbmcgbmV0d29yayBkaXNjb25uZWN0c1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZSh1bmRlZmluZWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBfY2xvc2UoZXZlbnQpIHtcclxuICAgICAgICAvLyB3ZWJTb2NrZXQgd2lsbCBiZSBudWxsIGlmIHRoZSB0cmFuc3BvcnQgZGlkIG5vdCBzdGFydCBzdWNjZXNzZnVsbHlcclxuICAgICAgICBpZiAodGhpcy5fd2ViU29ja2V0KSB7XHJcbiAgICAgICAgICAgIC8vIENsZWFyIHdlYnNvY2tldCBoYW5kbGVycyBiZWNhdXNlIHdlIGFyZSBjb25zaWRlcmluZyB0aGUgc29ja2V0IGNsb3NlZCBub3dcclxuICAgICAgICAgICAgdGhpcy5fd2ViU29ja2V0Lm9uY2xvc2UgPSAoKSA9PiB7IH07XHJcbiAgICAgICAgICAgIHRoaXMuX3dlYlNvY2tldC5vbm1lc3NhZ2UgPSAoKSA9PiB7IH07XHJcbiAgICAgICAgICAgIHRoaXMuX3dlYlNvY2tldC5vbmVycm9yID0gKCkgPT4geyB9O1xyXG4gICAgICAgICAgICB0aGlzLl93ZWJTb2NrZXQuY2xvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5fd2ViU29ja2V0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLlRyYWNlLCBcIihXZWJTb2NrZXRzIHRyYW5zcG9ydCkgc29ja2V0IGNsb3NlZC5cIik7XHJcbiAgICAgICAgaWYgKHRoaXMub25jbG9zZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5faXNDbG9zZUV2ZW50KGV2ZW50KSAmJiAoZXZlbnQud2FzQ2xlYW4gPT09IGZhbHNlIHx8IGV2ZW50LmNvZGUgIT09IDEwMDApKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2xvc2UobmV3IEVycm9yKGBXZWJTb2NrZXQgY2xvc2VkIHdpdGggc3RhdHVzIGNvZGU6ICR7ZXZlbnQuY29kZX0gKCR7ZXZlbnQucmVhc29uIHx8IFwibm8gcmVhc29uIGdpdmVuXCJ9KS5gKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnQgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmNsb3NlKGV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2lzQ2xvc2VFdmVudChldmVudCkge1xyXG4gICAgICAgIHJldHVybiBldmVudCAmJiB0eXBlb2YgZXZlbnQud2FzQ2xlYW4gPT09IFwiYm9vbGVhblwiICYmIHR5cGVvZiBldmVudC5jb2RlID09PSBcIm51bWJlclwiO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVdlYlNvY2tldFRyYW5zcG9ydC5qcy5tYXAiLCIvLyBMaWNlbnNlZCB0byB0aGUgLk5FVCBGb3VuZGF0aW9uIHVuZGVyIG9uZSBvciBtb3JlIGFncmVlbWVudHMuXHJcbi8vIFRoZSAuTkVUIEZvdW5kYXRpb24gbGljZW5zZXMgdGhpcyBmaWxlIHRvIHlvdSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmltcG9ydCB7IEFjY2Vzc1Rva2VuSHR0cENsaWVudCB9IGZyb20gXCIuL0FjY2Vzc1Rva2VuSHR0cENsaWVudFwiO1xyXG5pbXBvcnQgeyBEZWZhdWx0SHR0cENsaWVudCB9IGZyb20gXCIuL0RlZmF1bHRIdHRwQ2xpZW50XCI7XHJcbmltcG9ydCB7IEFnZ3JlZ2F0ZUVycm9ycywgRGlzYWJsZWRUcmFuc3BvcnRFcnJvciwgRmFpbGVkVG9OZWdvdGlhdGVXaXRoU2VydmVyRXJyb3IsIEZhaWxlZFRvU3RhcnRUcmFuc3BvcnRFcnJvciwgSHR0cEVycm9yLCBVbnN1cHBvcnRlZFRyYW5zcG9ydEVycm9yLCBBYm9ydEVycm9yIH0gZnJvbSBcIi4vRXJyb3JzXCI7XHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBIdHRwVHJhbnNwb3J0VHlwZSwgVHJhbnNmZXJGb3JtYXQgfSBmcm9tIFwiLi9JVHJhbnNwb3J0XCI7XHJcbmltcG9ydCB7IExvbmdQb2xsaW5nVHJhbnNwb3J0IH0gZnJvbSBcIi4vTG9uZ1BvbGxpbmdUcmFuc3BvcnRcIjtcclxuaW1wb3J0IHsgU2VydmVyU2VudEV2ZW50c1RyYW5zcG9ydCB9IGZyb20gXCIuL1NlcnZlclNlbnRFdmVudHNUcmFuc3BvcnRcIjtcclxuaW1wb3J0IHsgQXJnLCBjcmVhdGVMb2dnZXIsIGdldFVzZXJBZ2VudEhlYWRlciwgUGxhdGZvcm0gfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG5pbXBvcnQgeyBXZWJTb2NrZXRUcmFuc3BvcnQgfSBmcm9tIFwiLi9XZWJTb2NrZXRUcmFuc3BvcnRcIjtcclxuY29uc3QgTUFYX1JFRElSRUNUUyA9IDEwMDtcclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBIdHRwQ29ubmVjdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3Rvcih1cmwsIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgICAgIHRoaXMuX3N0b3BQcm9taXNlUmVzb2x2ZXIgPSAoKSA9PiB7IH07XHJcbiAgICAgICAgdGhpcy5mZWF0dXJlcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX25lZ290aWF0ZVZlcnNpb24gPSAxO1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKHVybCwgXCJ1cmxcIik7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKG9wdGlvbnMubG9nZ2VyKTtcclxuICAgICAgICB0aGlzLmJhc2VVcmwgPSB0aGlzLl9yZXNvbHZlVXJsKHVybCk7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgb3B0aW9ucy5sb2dNZXNzYWdlQ29udGVudCA9IG9wdGlvbnMubG9nTWVzc2FnZUNvbnRlbnQgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogb3B0aW9ucy5sb2dNZXNzYWdlQ29udGVudDtcclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMud2l0aENyZWRlbnRpYWxzID09PSBcImJvb2xlYW5cIiB8fCBvcHRpb25zLndpdGhDcmVkZW50aWFscyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMud2l0aENyZWRlbnRpYWxzID0gb3B0aW9ucy53aXRoQ3JlZGVudGlhbHMgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRpb25zLndpdGhDcmVkZW50aWFscztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIndpdGhDcmVkZW50aWFscyBvcHRpb24gd2FzIG5vdCBhICdib29sZWFuJyBvciAndW5kZWZpbmVkJyB2YWx1ZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3B0aW9ucy50aW1lb3V0ID0gb3B0aW9ucy50aW1lb3V0ID09PSB1bmRlZmluZWQgPyAxMDAgKiAxMDAwIDogb3B0aW9ucy50aW1lb3V0O1xyXG4gICAgICAgIGxldCB3ZWJTb2NrZXRNb2R1bGUgPSBudWxsO1xyXG4gICAgICAgIGxldCBldmVudFNvdXJjZU1vZHVsZSA9IG51bGw7XHJcbiAgICAgICAgaWYgKFBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2YgcmVxdWlyZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAvLyBJbiBvcmRlciB0byBpZ25vcmUgdGhlIGR5bmFtaWMgcmVxdWlyZSBpbiB3ZWJwYWNrIGJ1aWxkcyB3ZSBuZWVkIHRvIGRvIHRoaXMgbWFnaWNcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZTogVFMgZG9lc24ndCBrbm93IGFib3V0IHRoZXNlIG5hbWVzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVpcmVGdW5jID0gdHlwZW9mIF9fd2VicGFja19yZXF1aXJlX18gPT09IFwiZnVuY3Rpb25cIiA/IF9fbm9uX3dlYnBhY2tfcmVxdWlyZV9fIDogcmVxdWlyZTtcclxuICAgICAgICAgICAgd2ViU29ja2V0TW9kdWxlID0gcmVxdWlyZUZ1bmMoXCJ3c1wiKTtcclxuICAgICAgICAgICAgZXZlbnRTb3VyY2VNb2R1bGUgPSByZXF1aXJlRnVuYyhcImV2ZW50c291cmNlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIVBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2YgV2ViU29ja2V0ICE9PSBcInVuZGVmaW5lZFwiICYmICFvcHRpb25zLldlYlNvY2tldCkge1xyXG4gICAgICAgICAgICBvcHRpb25zLldlYlNvY2tldCA9IFdlYlNvY2tldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoUGxhdGZvcm0uaXNOb2RlICYmICFvcHRpb25zLldlYlNvY2tldCkge1xyXG4gICAgICAgICAgICBpZiAod2ViU29ja2V0TW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLldlYlNvY2tldCA9IHdlYlNvY2tldE1vZHVsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIVBsYXRmb3JtLmlzTm9kZSAmJiB0eXBlb2YgRXZlbnRTb3VyY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgIW9wdGlvbnMuRXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5FdmVudFNvdXJjZSA9IEV2ZW50U291cmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChQbGF0Zm9ybS5pc05vZGUgJiYgIW9wdGlvbnMuRXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBldmVudFNvdXJjZU1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5FdmVudFNvdXJjZSA9IGV2ZW50U291cmNlTW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2h0dHBDbGllbnQgPSBuZXcgQWNjZXNzVG9rZW5IdHRwQ2xpZW50KG9wdGlvbnMuaHR0cENsaWVudCB8fCBuZXcgRGVmYXVsdEh0dHBDbGllbnQodGhpcy5fbG9nZ2VyKSwgb3B0aW9ucy5hY2Nlc3NUb2tlbkZhY3RvcnkpO1xyXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9IFwiRGlzY29ubmVjdGVkXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RlZCAqLztcclxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIHRoaXMub25yZWNlaXZlID0gbnVsbDtcclxuICAgICAgICB0aGlzLm9uY2xvc2UgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgc3RhcnQodHJhbnNmZXJGb3JtYXQpIHtcclxuICAgICAgICB0cmFuc2ZlckZvcm1hdCA9IHRyYW5zZmVyRm9ybWF0IHx8IFRyYW5zZmVyRm9ybWF0LkJpbmFyeTtcclxuICAgICAgICBBcmcuaXNJbih0cmFuc2ZlckZvcm1hdCwgVHJhbnNmZXJGb3JtYXQsIFwidHJhbnNmZXJGb3JtYXRcIik7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYFN0YXJ0aW5nIGNvbm5lY3Rpb24gd2l0aCB0cmFuc2ZlciBmb3JtYXQgJyR7VHJhbnNmZXJGb3JtYXRbdHJhbnNmZXJGb3JtYXRdfScuYCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSAhPT0gXCJEaXNjb25uZWN0ZWRcIiAvKiBDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGVkICovKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3Qgc3RhcnQgYW4gSHR0cENvbm5lY3Rpb24gdGhhdCBpcyBub3QgaW4gdGhlICdEaXNjb25uZWN0ZWQnIHN0YXRlLlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9IFwiQ29ubmVjdGluZ1wiIC8qIENvbm5lY3Rpb25TdGF0ZS5Db25uZWN0aW5nICovO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0SW50ZXJuYWxQcm9taXNlID0gdGhpcy5fc3RhcnRJbnRlcm5hbCh0cmFuc2ZlckZvcm1hdCk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5fc3RhcnRJbnRlcm5hbFByb21pc2U7XHJcbiAgICAgICAgLy8gVGhlIFR5cGVTY3JpcHQgY29tcGlsZXIgdGhpbmtzIHRoYXQgY29ubmVjdGlvblN0YXRlIG11c3QgYmUgQ29ubmVjdGluZyBoZXJlLiBUaGUgVHlwZVNjcmlwdCBjb21waWxlciBpcyB3cm9uZy5cclxuICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBcIkRpc2Nvbm5lY3RpbmdcIiAvKiBDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGluZyAqLykge1xyXG4gICAgICAgICAgICAvLyBzdG9wKCkgd2FzIGNhbGxlZCBhbmQgdHJhbnNpdGlvbmVkIHRoZSBjbGllbnQgaW50byB0aGUgRGlzY29ubmVjdGluZyBzdGF0ZS5cclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IFwiRmFpbGVkIHRvIHN0YXJ0IHRoZSBIdHRwQ29ubmVjdGlvbiBiZWZvcmUgc3RvcCgpIHdhcyBjYWxsZWQuXCI7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3QgYXdhaXQgc3RvcFByb21pc2UgaW5zaWRlIHN0YXJ0SW50ZXJuYWwgc2luY2Ugc3RvcEludGVybmFsIGF3YWl0cyB0aGUgc3RhcnRJbnRlcm5hbFByb21pc2UuXHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3N0b3BQcm9taXNlO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEFib3J0RXJyb3IobWVzc2FnZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgIT09IFwiQ29ubmVjdGVkXCIgLyogQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RlZCAqLykge1xyXG4gICAgICAgICAgICAvLyBzdG9wKCkgd2FzIGNhbGxlZCBhbmQgdHJhbnNpdGlvbmVkIHRoZSBjbGllbnQgaW50byB0aGUgRGlzY29ubmVjdGluZyBzdGF0ZS5cclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IFwiSHR0cENvbm5lY3Rpb24uc3RhcnRJbnRlcm5hbCBjb21wbGV0ZWQgZ3JhY2VmdWxseSBidXQgZGlkbid0IGVudGVyIHRoZSBjb25uZWN0aW9uIGludG8gdGhlIGNvbm5lY3RlZCBzdGF0ZSFcIjtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQWJvcnRFcnJvcihtZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25TdGFydGVkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHNlbmQoZGF0YSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgIT09IFwiQ29ubmVjdGVkXCIgLyogQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RlZCAqLykge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IHNlbmQgZGF0YSBpZiB0aGUgY29ubmVjdGlvbiBpcyBub3QgaW4gdGhlICdDb25uZWN0ZWQnIFN0YXRlLlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5fc2VuZFF1ZXVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmRRdWV1ZSA9IG5ldyBUcmFuc3BvcnRTZW5kUXVldWUodGhpcy50cmFuc3BvcnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUcmFuc3BvcnQgd2lsbCBub3QgYmUgbnVsbCBpZiBzdGF0ZSBpcyBjb25uZWN0ZWRcclxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZFF1ZXVlLnNlbmQoZGF0YSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBzdG9wKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gXCJEaXNjb25uZWN0ZWRcIiAvKiBDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGVkICovKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIGBDYWxsIHRvIEh0dHBDb25uZWN0aW9uLnN0b3AoJHtlcnJvcn0pIGlnbm9yZWQgYmVjYXVzZSB0aGUgY29ubmVjdGlvbiBpcyBhbHJlYWR5IGluIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGUuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gXCJEaXNjb25uZWN0aW5nXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RpbmcgKi8pIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYENhbGwgdG8gSHR0cENvbm5lY3Rpb24uc3RvcCgke2Vycm9yfSkgaWdub3JlZCBiZWNhdXNlIHRoZSBjb25uZWN0aW9uIGlzIGFscmVhZHkgaW4gdGhlIGRpc2Nvbm5lY3Rpbmcgc3RhdGUuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdG9wUHJvbWlzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvblN0YXRlID0gXCJEaXNjb25uZWN0aW5nXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RpbmcgKi87XHJcbiAgICAgICAgdGhpcy5fc3RvcFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBEb24ndCBjb21wbGV0ZSBzdG9wKCkgdW50aWwgc3RvcENvbm5lY3Rpb24oKSBjb21wbGV0ZXMuXHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BQcm9taXNlUmVzb2x2ZXIgPSByZXNvbHZlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIHN0b3BJbnRlcm5hbCBzaG91bGQgbmV2ZXIgdGhyb3cgc28ganVzdCBvYnNlcnZlIGl0LlxyXG4gICAgICAgIGF3YWl0IHRoaXMuX3N0b3BJbnRlcm5hbChlcnJvcik7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5fc3RvcFByb21pc2U7XHJcbiAgICB9XHJcbiAgICBhc3luYyBfc3RvcEludGVybmFsKGVycm9yKSB7XHJcbiAgICAgICAgLy8gU2V0IGVycm9yIGFzIHNvb24gYXMgcG9zc2libGUgb3RoZXJ3aXNlIHRoZXJlIGlzIGEgcmFjZSBiZXR3ZWVuXHJcbiAgICAgICAgLy8gdGhlIHRyYW5zcG9ydCBjbG9zaW5nIGFuZCBwcm92aWRpbmcgYW4gZXJyb3IgYW5kIHRoZSBlcnJvciBmcm9tIGEgY2xvc2UgbWVzc2FnZVxyXG4gICAgICAgIC8vIFdlIHdvdWxkIHByZWZlciB0aGUgY2xvc2UgbWVzc2FnZSBlcnJvci5cclxuICAgICAgICB0aGlzLl9zdG9wRXJyb3IgPSBlcnJvcjtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydEludGVybmFsUHJvbWlzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgLy8gVGhpcyBleGNlcHRpb24gaXMgcmV0dXJuZWQgdG8gdGhlIHVzZXIgYXMgYSByZWplY3RlZCBQcm9taXNlIGZyb20gdGhlIHN0YXJ0IG1ldGhvZC5cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVGhlIHRyYW5zcG9ydCdzIG9uY2xvc2Ugd2lsbCB0cmlnZ2VyIHN0b3BDb25uZWN0aW9uIHdoaWNoIHdpbGwgcnVuIG91ciBvbmNsb3NlIGV2ZW50LlxyXG4gICAgICAgIC8vIFRoZSB0cmFuc3BvcnQgc2hvdWxkIGFsd2F5cyBiZSBzZXQgaWYgY3VycmVudGx5IGNvbm5lY3RlZC4gSWYgaXQgd2Fzbid0IHNldCwgaXQncyBsaWtlbHkgYmVjYXVzZVxyXG4gICAgICAgIC8vIHN0b3Agd2FzIGNhbGxlZCBkdXJpbmcgc3RhcnQoKSBhbmQgc3RhcnQoKSBmYWlsZWQuXHJcbiAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBIdHRwQ29ubmVjdGlvbi50cmFuc3BvcnQuc3RvcCgpIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BDb25uZWN0aW9uKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBcIkh0dHBDb25uZWN0aW9uLnRyYW5zcG9ydCBpcyB1bmRlZmluZWQgaW4gSHR0cENvbm5lY3Rpb24uc3RvcCgpIGJlY2F1c2Ugc3RhcnQoKSBmYWlsZWQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGFzeW5jIF9zdGFydEludGVybmFsKHRyYW5zZmVyRm9ybWF0KSB7XHJcbiAgICAgICAgLy8gU3RvcmUgdGhlIG9yaWdpbmFsIGJhc2UgdXJsIGFuZCB0aGUgYWNjZXNzIHRva2VuIGZhY3Rvcnkgc2luY2UgdGhleSBtYXkgY2hhbmdlXHJcbiAgICAgICAgLy8gYXMgcGFydCBvZiBuZWdvdGlhdGluZ1xyXG4gICAgICAgIGxldCB1cmwgPSB0aGlzLmJhc2VVcmw7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5ID0gdGhpcy5fb3B0aW9ucy5hY2Nlc3NUb2tlbkZhY3Rvcnk7XHJcbiAgICAgICAgdGhpcy5faHR0cENsaWVudC5fYWNjZXNzVG9rZW5GYWN0b3J5ID0gdGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNraXBOZWdvdGlhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMudHJhbnNwb3J0ID09PSBIdHRwVHJhbnNwb3J0VHlwZS5XZWJTb2NrZXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gbmVlZCB0byBhZGQgYSBjb25uZWN0aW9uIElEIGluIHRoaXMgY2FzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdGhpcy5fY29uc3RydWN0VHJhbnNwb3J0KEh0dHBUcmFuc3BvcnRUeXBlLldlYlNvY2tldHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHNob3VsZCBqdXN0IGNhbGwgY29ubmVjdCBkaXJlY3RseSBpbiB0aGlzIGNhc2UuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gZmFsbGJhY2sgb3IgbmVnb3RpYXRlIGluIHRoaXMgY2FzZS5cclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydFRyYW5zcG9ydCh1cmwsIHRyYW5zZmVyRm9ybWF0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZ290aWF0aW9uIGNhbiBvbmx5IGJlIHNraXBwZWQgd2hlbiB1c2luZyB0aGUgV2ViU29ja2V0IHRyYW5zcG9ydCBkaXJlY3RseS5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmVnb3RpYXRlUmVzcG9uc2UgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlZGlyZWN0cyA9IDA7XHJcbiAgICAgICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmVnb3RpYXRlUmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9nZXROZWdvdGlhdGlvblJlc3BvbnNlKHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHVzZXIgdHJpZXMgdG8gc3RvcCB0aGUgY29ubmVjdGlvbiB3aGVuIGl0IGlzIGJlaW5nIHN0YXJ0ZWRcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvblN0YXRlID09PSBcIkRpc2Nvbm5lY3RpbmdcIiAvKiBDb25uZWN0aW9uU3RhdGUuRGlzY29ubmVjdGluZyAqLyB8fCB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPT09IFwiRGlzY29ubmVjdGVkXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RlZCAqLykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgQWJvcnRFcnJvcihcIlRoZSBjb25uZWN0aW9uIHdhcyBzdG9wcGVkIGR1cmluZyBuZWdvdGlhdGlvbi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWdvdGlhdGVSZXNwb25zZS5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobmVnb3RpYXRlUmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobmVnb3RpYXRlUmVzcG9uc2UuUHJvdG9jb2xWZXJzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRldGVjdGVkIGEgY29ubmVjdGlvbiBhdHRlbXB0IHRvIGFuIEFTUC5ORVQgU2lnbmFsUiBTZXJ2ZXIuIFRoaXMgY2xpZW50IG9ubHkgc3VwcG9ydHMgY29ubmVjdGluZyB0byBhbiBBU1AuTkVUIENvcmUgU2lnbmFsUiBTZXJ2ZXIuIFNlZSBodHRwczovL2FrYS5tcy9zaWduYWxyLWNvcmUtZGlmZmVyZW5jZXMgZm9yIGRldGFpbHMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobmVnb3RpYXRlUmVzcG9uc2UudXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IG5lZ290aWF0ZVJlc3BvbnNlLnVybDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZ290aWF0ZVJlc3BvbnNlLmFjY2Vzc1Rva2VuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGN1cnJlbnQgYWNjZXNzIHRva2VuIGZhY3Rvcnkgd2l0aCBvbmUgdGhhdCB1c2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSByZXR1cm5lZCBhY2Nlc3MgdG9rZW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzVG9rZW4gPSBuZWdvdGlhdGVSZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5GYWN0b3J5ID0gKCkgPT4gYWNjZXNzVG9rZW47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgZmFjdG9yeSB0byB1bmRlZmluZWQgc28gdGhlIEFjY2Vzc1Rva2VuSHR0cENsaWVudCB3b24ndCByZXRyeSB3aXRoIHRoZSBzYW1lIHRva2VuLCBzaW5jZSB3ZSBrbm93IGl0IHdvbid0IGNoYW5nZSB1bnRpbCBhIGNvbm5lY3Rpb24gcmVzdGFydFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9odHRwQ2xpZW50Ll9hY2Nlc3NUb2tlbiA9IGFjY2Vzc1Rva2VuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9odHRwQ2xpZW50Ll9hY2Nlc3NUb2tlbkZhY3RvcnkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0cysrO1xyXG4gICAgICAgICAgICAgICAgfSB3aGlsZSAobmVnb3RpYXRlUmVzcG9uc2UudXJsICYmIHJlZGlyZWN0cyA8IE1BWF9SRURJUkVDVFMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZGlyZWN0cyA9PT0gTUFYX1JFRElSRUNUUyAmJiBuZWdvdGlhdGVSZXNwb25zZS51cmwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWdvdGlhdGUgcmVkaXJlY3Rpb24gbGltaXQgZXhjZWVkZWQuXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fY3JlYXRlVHJhbnNwb3J0KHVybCwgdGhpcy5fb3B0aW9ucy50cmFuc3BvcnQsIG5lZ290aWF0ZVJlc3BvbnNlLCB0cmFuc2ZlckZvcm1hdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0IGluc3RhbmNlb2YgTG9uZ1BvbGxpbmdUcmFuc3BvcnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXMuaW5oZXJlbnRLZWVwQWxpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgPT09IFwiQ29ubmVjdGluZ1wiIC8qIENvbm5lY3Rpb25TdGF0ZS5Db25uZWN0aW5nICovKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIGNvbm5lY3Rpb24gdHJhbnNpdGlvbnMgdG8gdGhlIGNvbm5lY3RlZCBzdGF0ZSBwcmlvciB0byBjb21wbGV0aW5nIHRoaXMuc3RhcnRJbnRlcm5hbFByb21pc2UuXHJcbiAgICAgICAgICAgICAgICAvLyBzdGFydCgpIHdpbGwgaGFuZGxlIHRoZSBjYXNlIHdoZW4gc3RvcCB3YXMgY2FsbGVkIGFuZCBzdGFydEludGVybmFsIGV4aXRzIHN0aWxsIGluIHRoZSBkaXNjb25uZWN0aW5nIHN0YXRlLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgXCJUaGUgSHR0cENvbm5lY3Rpb24gY29ubmVjdGVkIHN1Y2Nlc3NmdWxseS5cIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBcIkNvbm5lY3RlZFwiIC8qIENvbm5lY3Rpb25TdGF0ZS5Db25uZWN0ZWQgKi87XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gc3RvcCgpIGlzIHdhaXRpbmcgb24gdXMgdmlhIHRoaXMuc3RhcnRJbnRlcm5hbFByb21pc2Ugc28ga2VlcCB0aGlzLnRyYW5zcG9ydCBhcm91bmQgc28gaXQgY2FuIGNsZWFuIHVwLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGNhc2Ugc3RhcnRJbnRlcm5hbCBjYW4gZXhpdCBpbiBuZWl0aGVyIHRoZSBjb25uZWN0ZWQgbm9yIGRpc2Nvbm5lY3RlZCBzdGF0ZSBiZWNhdXNlIHN0b3BDb25uZWN0aW9uKClcclxuICAgICAgICAgICAgLy8gd2lsbCB0cmFuc2l0aW9uIHRvIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGUuIHN0YXJ0KCkgd2lsbCB3YWl0IGZvciB0aGUgdHJhbnNpdGlvbiB1c2luZyB0aGUgc3RvcFByb21pc2UuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIFwiRmFpbGVkIHRvIHN0YXJ0IHRoZSBjb25uZWN0aW9uOiBcIiArIGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBcIkRpc2Nvbm5lY3RlZFwiIC8qIENvbm5lY3Rpb25TdGF0ZS5EaXNjb25uZWN0ZWQgKi87XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAvLyBpZiBzdGFydCBmYWlscywgYW55IGFjdGl2ZSBjYWxscyB0byBzdG9wIGFzc3VtZSB0aGF0IHN0YXJ0IHdpbGwgY29tcGxldGUgdGhlIHN0b3AgcHJvbWlzZVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wUHJvbWlzZVJlc29sdmVyKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBfZ2V0TmVnb3RpYXRpb25SZXNwb25zZSh1cmwpIHtcclxuICAgICAgICBjb25zdCBoZWFkZXJzID0ge307XHJcbiAgICAgICAgY29uc3QgW25hbWUsIHZhbHVlXSA9IGdldFVzZXJBZ2VudEhlYWRlcigpO1xyXG4gICAgICAgIGhlYWRlcnNbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICBjb25zdCBuZWdvdGlhdGVVcmwgPSB0aGlzLl9yZXNvbHZlTmVnb3RpYXRlVXJsKHVybCk7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYFNlbmRpbmcgbmVnb3RpYXRpb24gcmVxdWVzdDogJHtuZWdvdGlhdGVVcmx9LmApO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faHR0cENsaWVudC5wb3N0KG5lZ290aWF0ZVVybCwge1xyXG4gICAgICAgICAgICAgICAgY29udGVudDogXCJcIixcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uaGVhZGVycywgLi4udGhpcy5fb3B0aW9ucy5oZWFkZXJzIH0sXHJcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aGlzLl9vcHRpb25zLnRpbWVvdXQsXHJcbiAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRoaXMuX29wdGlvbnMud2l0aENyZWRlbnRpYWxzLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5leHBlY3RlZCBzdGF0dXMgY29kZSByZXR1cm5lZCBmcm9tIG5lZ290aWF0ZSAnJHtyZXNwb25zZS5zdGF0dXNDb2RlfSdgKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmVnb3RpYXRlUmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICBpZiAoIW5lZ290aWF0ZVJlc3BvbnNlLm5lZ290aWF0ZVZlcnNpb24gfHwgbmVnb3RpYXRlUmVzcG9uc2UubmVnb3RpYXRlVmVyc2lvbiA8IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5lZ290aWF0ZSB2ZXJzaW9uIDAgZG9lc24ndCB1c2UgY29ubmVjdGlvblRva2VuXHJcbiAgICAgICAgICAgICAgICAvLyBTbyB3ZSBzZXQgaXQgZXF1YWwgdG8gY29ubmVjdGlvbklkIHNvIGFsbCBvdXIgbG9naWMgY2FuIHVzZSBjb25uZWN0aW9uVG9rZW4gd2l0aG91dCBiZWluZyBhd2FyZSBvZiB0aGUgbmVnb3RpYXRlIHZlcnNpb25cclxuICAgICAgICAgICAgICAgIG5lZ290aWF0ZVJlc3BvbnNlLmNvbm5lY3Rpb25Ub2tlbiA9IG5lZ290aWF0ZVJlc3BvbnNlLmNvbm5lY3Rpb25JZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobmVnb3RpYXRlUmVzcG9uc2UudXNlU3RhdGVmdWxSZWNvbm5lY3QgJiYgdGhpcy5fb3B0aW9ucy5fdXNlU3RhdGVmdWxSZWNvbm5lY3QgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRmFpbGVkVG9OZWdvdGlhdGVXaXRoU2VydmVyRXJyb3IoXCJDbGllbnQgZGlkbid0IG5lZ290aWF0ZSBTdGF0ZWZ1bCBSZWNvbm5lY3QgYnV0IHRoZSBzZXJ2ZXIgZGlkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5lZ290aWF0ZVJlc3BvbnNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gXCJGYWlsZWQgdG8gY29tcGxldGUgbmVnb3RpYXRpb24gd2l0aCB0aGUgc2VydmVyOiBcIiArIGU7XHJcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgSHR0cEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5zdGF0dXNDb2RlID09PSA0MDQpIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UgKyBcIiBFaXRoZXIgdGhpcyBpcyBub3QgYSBTaWduYWxSIGVuZHBvaW50IG9yIHRoZXJlIGlzIGEgcHJveHkgYmxvY2tpbmcgdGhlIGNvbm5lY3Rpb24uXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBGYWlsZWRUb05lZ290aWF0ZVdpdGhTZXJ2ZXJFcnJvcihlcnJvck1lc3NhZ2UpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfY3JlYXRlQ29ubmVjdFVybCh1cmwsIGNvbm5lY3Rpb25Ub2tlbikge1xyXG4gICAgICAgIGlmICghY29ubmVjdGlvblRva2VuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1cmwgKyAodXJsLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICsgYGlkPSR7Y29ubmVjdGlvblRva2VufWA7XHJcbiAgICB9XHJcbiAgICBhc3luYyBfY3JlYXRlVHJhbnNwb3J0KHVybCwgcmVxdWVzdGVkVHJhbnNwb3J0LCBuZWdvdGlhdGVSZXNwb25zZSwgcmVxdWVzdGVkVHJhbnNmZXJGb3JtYXQpIHtcclxuICAgICAgICBsZXQgY29ubmVjdFVybCA9IHRoaXMuX2NyZWF0ZUNvbm5lY3RVcmwodXJsLCBuZWdvdGlhdGVSZXNwb25zZS5jb25uZWN0aW9uVG9rZW4pO1xyXG4gICAgICAgIGlmICh0aGlzLl9pc0lUcmFuc3BvcnQocmVxdWVzdGVkVHJhbnNwb3J0KSkge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBcIkNvbm5lY3Rpb24gd2FzIHByb3ZpZGVkIGFuIGluc3RhbmNlIG9mIElUcmFuc3BvcnQsIHVzaW5nIHRoYXQgZGlyZWN0bHkuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydCA9IHJlcXVlc3RlZFRyYW5zcG9ydDtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc3RhcnRUcmFuc3BvcnQoY29ubmVjdFVybCwgcmVxdWVzdGVkVHJhbnNmZXJGb3JtYXQpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb25JZCA9IG5lZ290aWF0ZVJlc3BvbnNlLmNvbm5lY3Rpb25JZDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0cmFuc3BvcnRFeGNlcHRpb25zID0gW107XHJcbiAgICAgICAgY29uc3QgdHJhbnNwb3J0cyA9IG5lZ290aWF0ZVJlc3BvbnNlLmF2YWlsYWJsZVRyYW5zcG9ydHMgfHwgW107XHJcbiAgICAgICAgbGV0IG5lZ290aWF0ZSA9IG5lZ290aWF0ZVJlc3BvbnNlO1xyXG4gICAgICAgIGZvciAoY29uc3QgZW5kcG9pbnQgb2YgdHJhbnNwb3J0cykge1xyXG4gICAgICAgICAgICBjb25zdCB0cmFuc3BvcnRPckVycm9yID0gdGhpcy5fcmVzb2x2ZVRyYW5zcG9ydE9yRXJyb3IoZW5kcG9pbnQsIHJlcXVlc3RlZFRyYW5zcG9ydCwgcmVxdWVzdGVkVHJhbnNmZXJGb3JtYXQsIChuZWdvdGlhdGUgPT09IG51bGwgfHwgbmVnb3RpYXRlID09PSB2b2lkIDAgPyB2b2lkIDAgOiBuZWdvdGlhdGUudXNlU3RhdGVmdWxSZWNvbm5lY3QpID09PSB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKHRyYW5zcG9ydE9yRXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlIGVycm9yIGFuZCBjb250aW51ZSwgd2UgZG9uJ3Qgd2FudCB0byBjYXVzZSBhIHJlLW5lZ290aWF0ZSBpbiB0aGVzZSBjYXNlc1xyXG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0RXhjZXB0aW9ucy5wdXNoKGAke2VuZHBvaW50LnRyYW5zcG9ydH0gZmFpbGVkOmApO1xyXG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0RXhjZXB0aW9ucy5wdXNoKHRyYW5zcG9ydE9yRXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX2lzSVRyYW5zcG9ydCh0cmFuc3BvcnRPckVycm9yKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnRPckVycm9yO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuZWdvdGlhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWdvdGlhdGUgPSBhd2FpdCB0aGlzLl9nZXROZWdvdGlhdGlvblJlc3BvbnNlKHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0VXJsID0gdGhpcy5fY3JlYXRlQ29ubmVjdFVybCh1cmwsIG5lZ290aWF0ZS5jb25uZWN0aW9uVG9rZW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydFRyYW5zcG9ydChjb25uZWN0VXJsLCByZXF1ZXN0ZWRUcmFuc2ZlckZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uSWQgPSBuZWdvdGlhdGUuY29ubmVjdGlvbklkO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRXJyb3IsIGBGYWlsZWQgdG8gc3RhcnQgdGhlIHRyYW5zcG9ydCAnJHtlbmRwb2ludC50cmFuc3BvcnR9JzogJHtleH1gKTtcclxuICAgICAgICAgICAgICAgICAgICBuZWdvdGlhdGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0RXhjZXB0aW9ucy5wdXNoKG5ldyBGYWlsZWRUb1N0YXJ0VHJhbnNwb3J0RXJyb3IoYCR7ZW5kcG9pbnQudHJhbnNwb3J0fSBmYWlsZWQ6ICR7ZXh9YCwgSHR0cFRyYW5zcG9ydFR5cGVbZW5kcG9pbnQudHJhbnNwb3J0XSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgIT09IFwiQ29ubmVjdGluZ1wiIC8qIENvbm5lY3Rpb25TdGF0ZS5Db25uZWN0aW5nICovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBcIkZhaWxlZCB0byBzZWxlY3QgdHJhbnNwb3J0IGJlZm9yZSBzdG9wKCkgd2FzIGNhbGxlZC5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQWJvcnRFcnJvcihtZXNzYWdlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0cmFuc3BvcnRFeGNlcHRpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBBZ2dyZWdhdGVFcnJvcnMoYFVuYWJsZSB0byBjb25uZWN0IHRvIHRoZSBzZXJ2ZXIgd2l0aCBhbnkgb2YgdGhlIGF2YWlsYWJsZSB0cmFuc3BvcnRzLiAke3RyYW5zcG9ydEV4Y2VwdGlvbnMuam9pbihcIiBcIil9YCwgdHJhbnNwb3J0RXhjZXB0aW9ucykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiTm9uZSBvZiB0aGUgdHJhbnNwb3J0cyBzdXBwb3J0ZWQgYnkgdGhlIGNsaWVudCBhcmUgc3VwcG9ydGVkIGJ5IHRoZSBzZXJ2ZXIuXCIpKTtcclxuICAgIH1cclxuICAgIF9jb25zdHJ1Y3RUcmFuc3BvcnQodHJhbnNwb3J0KSB7XHJcbiAgICAgICAgc3dpdGNoICh0cmFuc3BvcnQpIHtcclxuICAgICAgICAgICAgY2FzZSBIdHRwVHJhbnNwb3J0VHlwZS5XZWJTb2NrZXRzOlxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9vcHRpb25zLldlYlNvY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidXZWJTb2NrZXQnIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBlbnZpcm9ubWVudC5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdlYlNvY2tldFRyYW5zcG9ydCh0aGlzLl9odHRwQ2xpZW50LCB0aGlzLl9hY2Nlc3NUb2tlbkZhY3RvcnksIHRoaXMuX2xvZ2dlciwgdGhpcy5fb3B0aW9ucy5sb2dNZXNzYWdlQ29udGVudCwgdGhpcy5fb3B0aW9ucy5XZWJTb2NrZXQsIHRoaXMuX29wdGlvbnMuaGVhZGVycyB8fCB7fSk7XHJcbiAgICAgICAgICAgIGNhc2UgSHR0cFRyYW5zcG9ydFR5cGUuU2VydmVyU2VudEV2ZW50czpcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fb3B0aW9ucy5FdmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidFdmVudFNvdXJjZScgaXMgbm90IHN1cHBvcnRlZCBpbiB5b3VyIGVudmlyb25tZW50LlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2VydmVyU2VudEV2ZW50c1RyYW5zcG9ydCh0aGlzLl9odHRwQ2xpZW50LCB0aGlzLl9odHRwQ2xpZW50Ll9hY2Nlc3NUb2tlbiwgdGhpcy5fbG9nZ2VyLCB0aGlzLl9vcHRpb25zKTtcclxuICAgICAgICAgICAgY2FzZSBIdHRwVHJhbnNwb3J0VHlwZS5Mb25nUG9sbGluZzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTG9uZ1BvbGxpbmdUcmFuc3BvcnQodGhpcy5faHR0cENsaWVudCwgdGhpcy5fbG9nZ2VyLCB0aGlzLl9vcHRpb25zKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0cmFuc3BvcnQ6ICR7dHJhbnNwb3J0fS5gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfc3RhcnRUcmFuc3BvcnQodXJsLCB0cmFuc2ZlckZvcm1hdCkge1xyXG4gICAgICAgIHRoaXMudHJhbnNwb3J0Lm9ucmVjZWl2ZSA9IHRoaXMub25yZWNlaXZlO1xyXG4gICAgICAgIGlmICh0aGlzLmZlYXR1cmVzLnJlY29ubmVjdCkge1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5vbmNsb3NlID0gYXN5bmMgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBjYWxsU3RvcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmVhdHVyZXMucmVjb25uZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlcy5kaXNjb25uZWN0ZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy50cmFuc3BvcnQuY29ubmVjdCh1cmwsIHRyYW5zZmVyRm9ybWF0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mZWF0dXJlcy5yZXNlbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2gge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsU3RvcCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcENvbm5lY3Rpb24oZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxTdG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcENvbm5lY3Rpb24oZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5vbmNsb3NlID0gKGUpID0+IHRoaXMuX3N0b3BDb25uZWN0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuY29ubmVjdCh1cmwsIHRyYW5zZmVyRm9ybWF0KTtcclxuICAgIH1cclxuICAgIF9yZXNvbHZlVHJhbnNwb3J0T3JFcnJvcihlbmRwb2ludCwgcmVxdWVzdGVkVHJhbnNwb3J0LCByZXF1ZXN0ZWRUcmFuc2ZlckZvcm1hdCwgdXNlU3RhdGVmdWxSZWNvbm5lY3QpIHtcclxuICAgICAgICBjb25zdCB0cmFuc3BvcnQgPSBIdHRwVHJhbnNwb3J0VHlwZVtlbmRwb2ludC50cmFuc3BvcnRdO1xyXG4gICAgICAgIGlmICh0cmFuc3BvcnQgPT09IG51bGwgfHwgdHJhbnNwb3J0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYFNraXBwaW5nIHRyYW5zcG9ydCAnJHtlbmRwb2ludC50cmFuc3BvcnR9JyBiZWNhdXNlIGl0IGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBjbGllbnQuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoYFNraXBwaW5nIHRyYW5zcG9ydCAnJHtlbmRwb2ludC50cmFuc3BvcnR9JyBiZWNhdXNlIGl0IGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBjbGllbnQuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodHJhbnNwb3J0TWF0Y2hlcyhyZXF1ZXN0ZWRUcmFuc3BvcnQsIHRyYW5zcG9ydCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zZmVyRm9ybWF0cyA9IGVuZHBvaW50LnRyYW5zZmVyRm9ybWF0cy5tYXAoKHMpID0+IFRyYW5zZmVyRm9ybWF0W3NdKTtcclxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2ZlckZvcm1hdHMuaW5kZXhPZihyZXF1ZXN0ZWRUcmFuc2ZlckZvcm1hdCkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgodHJhbnNwb3J0ID09PSBIdHRwVHJhbnNwb3J0VHlwZS5XZWJTb2NrZXRzICYmICF0aGlzLl9vcHRpb25zLldlYlNvY2tldCkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHRyYW5zcG9ydCA9PT0gSHR0cFRyYW5zcG9ydFR5cGUuU2VydmVyU2VudEV2ZW50cyAmJiAhdGhpcy5fb3B0aW9ucy5FdmVudFNvdXJjZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYFNraXBwaW5nIHRyYW5zcG9ydCAnJHtIdHRwVHJhbnNwb3J0VHlwZVt0cmFuc3BvcnRdfScgYmVjYXVzZSBpdCBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgZW52aXJvbm1lbnQuJ2ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVuc3VwcG9ydGVkVHJhbnNwb3J0RXJyb3IoYCcke0h0dHBUcmFuc3BvcnRUeXBlW3RyYW5zcG9ydF19JyBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgZW52aXJvbm1lbnQuYCwgdHJhbnNwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuRGVidWcsIGBTZWxlY3RpbmcgdHJhbnNwb3J0ICcke0h0dHBUcmFuc3BvcnRUeXBlW3RyYW5zcG9ydF19Jy5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXMucmVjb25uZWN0ID0gdHJhbnNwb3J0ID09PSBIdHRwVHJhbnNwb3J0VHlwZS5XZWJTb2NrZXRzID8gdXNlU3RhdGVmdWxSZWNvbm5lY3QgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uc3RydWN0VHJhbnNwb3J0KHRyYW5zcG9ydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBgU2tpcHBpbmcgdHJhbnNwb3J0ICcke0h0dHBUcmFuc3BvcnRUeXBlW3RyYW5zcG9ydF19JyBiZWNhdXNlIGl0IGRvZXMgbm90IHN1cHBvcnQgdGhlIHJlcXVlc3RlZCB0cmFuc2ZlciBmb3JtYXQgJyR7VHJhbnNmZXJGb3JtYXRbcmVxdWVzdGVkVHJhbnNmZXJGb3JtYXRdfScuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgJyR7SHR0cFRyYW5zcG9ydFR5cGVbdHJhbnNwb3J0XX0nIGRvZXMgbm90IHN1cHBvcnQgJHtUcmFuc2ZlckZvcm1hdFtyZXF1ZXN0ZWRUcmFuc2ZlckZvcm1hdF19LmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYFNraXBwaW5nIHRyYW5zcG9ydCAnJHtIdHRwVHJhbnNwb3J0VHlwZVt0cmFuc3BvcnRdfScgYmVjYXVzZSBpdCB3YXMgZGlzYWJsZWQgYnkgdGhlIGNsaWVudC5gKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGlzYWJsZWRUcmFuc3BvcnRFcnJvcihgJyR7SHR0cFRyYW5zcG9ydFR5cGVbdHJhbnNwb3J0XX0nIGlzIGRpc2FibGVkIGJ5IHRoZSBjbGllbnQuYCwgdHJhbnNwb3J0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pc0lUcmFuc3BvcnQodHJhbnNwb3J0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRyYW5zcG9ydCAmJiB0eXBlb2YgKHRyYW5zcG9ydCkgPT09IFwib2JqZWN0XCIgJiYgXCJjb25uZWN0XCIgaW4gdHJhbnNwb3J0O1xyXG4gICAgfVxyXG4gICAgX3N0b3BDb25uZWN0aW9uKGVycm9yKSB7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5EZWJ1ZywgYEh0dHBDb25uZWN0aW9uLnN0b3BDb25uZWN0aW9uKCR7ZXJyb3J9KSBjYWxsZWQgd2hpbGUgaW4gc3RhdGUgJHt0aGlzLl9jb25uZWN0aW9uU3RhdGV9LmApO1xyXG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBzdG9wRXJyb3IsIGl0IHRha2VzIHByZWNlZGVuY2Ugb3ZlciB0aGUgZXJyb3IgZnJvbSB0aGUgdHJhbnNwb3J0XHJcbiAgICAgICAgZXJyb3IgPSB0aGlzLl9zdG9wRXJyb3IgfHwgZXJyb3I7XHJcbiAgICAgICAgdGhpcy5fc3RvcEVycm9yID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uU3RhdGUgPT09IFwiRGlzY29ubmVjdGVkXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RlZCAqLykge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkRlYnVnLCBgQ2FsbCB0byBIdHRwQ29ubmVjdGlvbi5zdG9wQ29ubmVjdGlvbigke2Vycm9yfSkgd2FzIGlnbm9yZWQgYmVjYXVzZSB0aGUgY29ubmVjdGlvbiBpcyBhbHJlYWR5IGluIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGUuYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gXCJDb25uZWN0aW5nXCIgLyogQ29ubmVjdGlvblN0YXRlLkNvbm5lY3RpbmcgKi8pIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5XYXJuaW5nLCBgQ2FsbCB0byBIdHRwQ29ubmVjdGlvbi5zdG9wQ29ubmVjdGlvbigke2Vycm9yfSkgd2FzIGlnbm9yZWQgYmVjYXVzZSB0aGUgY29ubmVjdGlvbiBpcyBzdGlsbCBpbiB0aGUgY29ubmVjdGluZyBzdGF0ZS5gKTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIdHRwQ29ubmVjdGlvbi5zdG9wQ29ubmVjdGlvbigke2Vycm9yfSkgd2FzIGNhbGxlZCB3aGlsZSB0aGUgY29ubmVjdGlvbiBpcyBzdGlsbCBpbiB0aGUgY29ubmVjdGluZyBzdGF0ZS5gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGF0ZSA9PT0gXCJEaXNjb25uZWN0aW5nXCIgLyogQ29ubmVjdGlvblN0YXRlLkRpc2Nvbm5lY3RpbmcgKi8pIHtcclxuICAgICAgICAgICAgLy8gQSBjYWxsIHRvIHN0b3AoKSBpbmR1Y2VkIHRoaXMgY2FsbCB0byBzdG9wQ29ubmVjdGlvbiBhbmQgbmVlZHMgdG8gYmUgY29tcGxldGVkLlxyXG4gICAgICAgICAgICAvLyBBbnkgc3RvcCgpIGF3YWl0ZXJzIHdpbGwgYmUgc2NoZWR1bGVkIHRvIGNvbnRpbnVlIGFmdGVyIHRoZSBvbmNsb3NlIGNhbGxiYWNrIGZpcmVzLlxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wUHJvbWlzZVJlc29sdmVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIubG9nKExvZ0xldmVsLkVycm9yLCBgQ29ubmVjdGlvbiBkaXNjb25uZWN0ZWQgd2l0aCBlcnJvciAnJHtlcnJvcn0nLmApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCJDb25uZWN0aW9uIGRpc2Nvbm5lY3RlZC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9zZW5kUXVldWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZFF1ZXVlLnN0b3AoKS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYFRyYW5zcG9ydFNlbmRRdWV1ZS5zdG9wKCkgdGhyZXcgZXJyb3IgJyR7ZX0nLmApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZFF1ZXVlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25JZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uU3RhdGUgPSBcIkRpc2Nvbm5lY3RlZFwiIC8qIENvbm5lY3Rpb25TdGF0ZS5EaXNjb25uZWN0ZWQgKi87XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25TdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25TdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbmNsb3NlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmNsb3NlKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmxvZyhMb2dMZXZlbC5FcnJvciwgYEh0dHBDb25uZWN0aW9uLm9uY2xvc2UoJHtlcnJvcn0pIHRocmV3IGVycm9yICcke2V9Jy5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9yZXNvbHZlVXJsKHVybCkge1xyXG4gICAgICAgIC8vIHN0YXJ0c1dpdGggaXMgbm90IHN1cHBvcnRlZCBpbiBJRVxyXG4gICAgICAgIGlmICh1cmwubGFzdEluZGV4T2YoXCJodHRwczovL1wiLCAwKSA9PT0gMCB8fCB1cmwubGFzdEluZGV4T2YoXCJodHRwOi8vXCIsIDApID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghUGxhdGZvcm0uaXNCcm93c2VyKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHJlc29sdmUgJyR7dXJsfScuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFNldHRpbmcgdGhlIHVybCB0byB0aGUgaHJlZiBwcm9wZXJ5IG9mIGFuIGFuY2hvciB0YWcgaGFuZGxlcyBub3JtYWxpemF0aW9uXHJcbiAgICAgICAgLy8gZm9yIHVzLiBUaGVyZSBhcmUgMyBtYWluIGNhc2VzLlxyXG4gICAgICAgIC8vIDEuIFJlbGF0aXZlIHBhdGggbm9ybWFsaXphdGlvbiBlLmcgXCJiXCIgLT4gXCJodHRwOi8vbG9jYWxob3N0OjUwMDAvYS9iXCJcclxuICAgICAgICAvLyAyLiBBYnNvbHV0ZSBwYXRoIG5vcm1hbGl6YXRpb24gZS5nIFwiL2EvYlwiIC0+IFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwL2EvYlwiXHJcbiAgICAgICAgLy8gMy4gTmV0d29ya3BhdGggcmVmZXJlbmNlIG5vcm1hbGl6YXRpb24gZS5nIFwiLy9sb2NhbGhvc3Q6NTAwMC9hL2JcIiAtPiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9hL2JcIlxyXG4gICAgICAgIGNvbnN0IGFUYWcgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgYVRhZy5ocmVmID0gdXJsO1xyXG4gICAgICAgIHRoaXMuX2xvZ2dlci5sb2coTG9nTGV2ZWwuSW5mb3JtYXRpb24sIGBOb3JtYWxpemluZyAnJHt1cmx9JyB0byAnJHthVGFnLmhyZWZ9Jy5gKTtcclxuICAgICAgICByZXR1cm4gYVRhZy5ocmVmO1xyXG4gICAgfVxyXG4gICAgX3Jlc29sdmVOZWdvdGlhdGVVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc3QgbmVnb3RpYXRlVXJsID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgICAgIGlmIChuZWdvdGlhdGVVcmwucGF0aG5hbWUuZW5kc1dpdGgoJy8nKSkge1xyXG4gICAgICAgICAgICBuZWdvdGlhdGVVcmwucGF0aG5hbWUgKz0gXCJuZWdvdGlhdGVcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG5lZ290aWF0ZVVybC5wYXRobmFtZSArPSBcIi9uZWdvdGlhdGVcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhuZWdvdGlhdGVVcmwuc2VhcmNoUGFyYW1zKTtcclxuICAgICAgICBpZiAoIXNlYXJjaFBhcmFtcy5oYXMoXCJuZWdvdGlhdGVWZXJzaW9uXCIpKSB7XHJcbiAgICAgICAgICAgIHNlYXJjaFBhcmFtcy5hcHBlbmQoXCJuZWdvdGlhdGVWZXJzaW9uXCIsIHRoaXMuX25lZ290aWF0ZVZlcnNpb24udG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzZWFyY2hQYXJhbXMuaGFzKFwidXNlU3RhdGVmdWxSZWNvbm5lY3RcIikpIHtcclxuICAgICAgICAgICAgaWYgKHNlYXJjaFBhcmFtcy5nZXQoXCJ1c2VTdGF0ZWZ1bFJlY29ubmVjdFwiKSA9PT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMuX3VzZVN0YXRlZnVsUmVjb25uZWN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLl9vcHRpb25zLl91c2VTdGF0ZWZ1bFJlY29ubmVjdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBzZWFyY2hQYXJhbXMuYXBwZW5kKFwidXNlU3RhdGVmdWxSZWNvbm5lY3RcIiwgXCJ0cnVlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBuZWdvdGlhdGVVcmwuc2VhcmNoID0gc2VhcmNoUGFyYW1zLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgcmV0dXJuIG5lZ290aWF0ZVVybC50b1N0cmluZygpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHRyYW5zcG9ydE1hdGNoZXMocmVxdWVzdGVkVHJhbnNwb3J0LCBhY3R1YWxUcmFuc3BvcnQpIHtcclxuICAgIHJldHVybiAhcmVxdWVzdGVkVHJhbnNwb3J0IHx8ICgoYWN0dWFsVHJhbnNwb3J0ICYgcmVxdWVzdGVkVHJhbnNwb3J0KSAhPT0gMCk7XHJcbn1cclxuLyoqIEBwcml2YXRlICovXHJcbmV4cG9ydCBjbGFzcyBUcmFuc3BvcnRTZW5kUXVldWUge1xyXG4gICAgY29uc3RydWN0b3IoX3RyYW5zcG9ydCkge1xyXG4gICAgICAgIHRoaXMuX3RyYW5zcG9ydCA9IF90cmFuc3BvcnQ7XHJcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gW107XHJcbiAgICAgICAgdGhpcy5fZXhlY3V0aW5nID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9zZW5kQnVmZmVyZWREYXRhID0gbmV3IFByb21pc2VTb3VyY2UoKTtcclxuICAgICAgICB0aGlzLl90cmFuc3BvcnRSZXN1bHQgPSBuZXcgUHJvbWlzZVNvdXJjZSgpO1xyXG4gICAgICAgIHRoaXMuX3NlbmRMb29wUHJvbWlzZSA9IHRoaXMuX3NlbmRMb29wKCk7XHJcbiAgICB9XHJcbiAgICBzZW5kKGRhdGEpIHtcclxuICAgICAgICB0aGlzLl9idWZmZXJEYXRhKGRhdGEpO1xyXG4gICAgICAgIGlmICghdGhpcy5fdHJhbnNwb3J0UmVzdWx0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zcG9ydFJlc3VsdCA9IG5ldyBQcm9taXNlU291cmNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl90cmFuc3BvcnRSZXN1bHQucHJvbWlzZTtcclxuICAgIH1cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fZXhlY3V0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fc2VuZEJ1ZmZlcmVkRGF0YS5yZXNvbHZlKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmRMb29wUHJvbWlzZTtcclxuICAgIH1cclxuICAgIF9idWZmZXJEYXRhKGRhdGEpIHtcclxuICAgICAgICBpZiAodGhpcy5fYnVmZmVyLmxlbmd0aCAmJiB0eXBlb2YgKHRoaXMuX2J1ZmZlclswXSkgIT09IHR5cGVvZiAoZGF0YSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBkYXRhIHRvIGJlIG9mIHR5cGUgJHt0eXBlb2YgKHRoaXMuX2J1ZmZlcil9IGJ1dCB3YXMgb2YgdHlwZSAke3R5cGVvZiAoZGF0YSl9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2J1ZmZlci5wdXNoKGRhdGEpO1xyXG4gICAgICAgIHRoaXMuX3NlbmRCdWZmZXJlZERhdGEucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgX3NlbmRMb29wKCkge1xyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NlbmRCdWZmZXJlZERhdGEucHJvbWlzZTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9leGVjdXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl90cmFuc3BvcnRSZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90cmFuc3BvcnRSZXN1bHQucmVqZWN0KFwiQ29ubmVjdGlvbiBzdG9wcGVkLlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmRCdWZmZXJlZERhdGEgPSBuZXcgUHJvbWlzZVNvdXJjZSgpO1xyXG4gICAgICAgICAgICBjb25zdCB0cmFuc3BvcnRSZXN1bHQgPSB0aGlzLl90cmFuc3BvcnRSZXN1bHQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zcG9ydFJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHR5cGVvZiAodGhpcy5fYnVmZmVyWzBdKSA9PT0gXCJzdHJpbmdcIiA/XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIuam9pbihcIlwiKSA6XHJcbiAgICAgICAgICAgICAgICBUcmFuc3BvcnRTZW5kUXVldWUuX2NvbmNhdEJ1ZmZlcnModGhpcy5fYnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5fYnVmZmVyLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl90cmFuc3BvcnQuc2VuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgIHRyYW5zcG9ydFJlc3VsdC5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc3BvcnRSZXN1bHQucmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyBfY29uY2F0QnVmZmVycyhhcnJheUJ1ZmZlcnMpIHtcclxuICAgICAgICBjb25zdCB0b3RhbExlbmd0aCA9IGFycmF5QnVmZmVycy5tYXAoKGIpID0+IGIuYnl0ZUxlbmd0aCkucmVkdWNlKChhLCBiKSA9PiBhICsgYik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xyXG4gICAgICAgIGxldCBvZmZzZXQgPSAwO1xyXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhcnJheUJ1ZmZlcnMpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnNldChuZXcgVWludDhBcnJheShpdGVtKSwgb2Zmc2V0KTtcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IGl0ZW0uYnl0ZUxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5idWZmZXI7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgUHJvbWlzZVNvdXJjZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiBbdGhpcy5fcmVzb2x2ZXIsIHRoaXMuX3JlamVjdGVyXSA9IFtyZXNvbHZlLCByZWplY3RdKTtcclxuICAgIH1cclxuICAgIHJlc29sdmUoKSB7XHJcbiAgICAgICAgdGhpcy5fcmVzb2x2ZXIoKTtcclxuICAgIH1cclxuICAgIHJlamVjdChyZWFzb24pIHtcclxuICAgICAgICB0aGlzLl9yZWplY3RlcihyZWFzb24pO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUh0dHBDb25uZWN0aW9uLmpzLm1hcCIsIi8vIExpY2Vuc2VkIHRvIHRoZSAuTkVUIEZvdW5kYXRpb24gdW5kZXIgb25lIG9yIG1vcmUgYWdyZWVtZW50cy5cclxuLy8gVGhlIC5ORVQgRm91bmRhdGlvbiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tIFwiLi9JSHViUHJvdG9jb2xcIjtcclxuaW1wb3J0IHsgTG9nTGV2ZWwgfSBmcm9tIFwiLi9JTG9nZ2VyXCI7XHJcbmltcG9ydCB7IFRyYW5zZmVyRm9ybWF0IH0gZnJvbSBcIi4vSVRyYW5zcG9ydFwiO1xyXG5pbXBvcnQgeyBOdWxsTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2Vyc1wiO1xyXG5pbXBvcnQgeyBUZXh0TWVzc2FnZUZvcm1hdCB9IGZyb20gXCIuL1RleHRNZXNzYWdlRm9ybWF0XCI7XHJcbmNvbnN0IEpTT05fSFVCX1BST1RPQ09MX05BTUUgPSBcImpzb25cIjtcclxuLyoqIEltcGxlbWVudHMgdGhlIEpTT04gSHViIFByb3RvY29sLiAqL1xyXG5leHBvcnQgY2xhc3MgSnNvbkh1YlByb3RvY29sIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIC8qKiBAaW5oZXJpdERvYyAqL1xyXG4gICAgICAgIHRoaXMubmFtZSA9IEpTT05fSFVCX1BST1RPQ09MX05BTUU7XHJcbiAgICAgICAgLyoqIEBpbmhlcml0RG9jICovXHJcbiAgICAgICAgdGhpcy52ZXJzaW9uID0gMjtcclxuICAgICAgICAvKiogQGluaGVyaXREb2MgKi9cclxuICAgICAgICB0aGlzLnRyYW5zZmVyRm9ybWF0ID0gVHJhbnNmZXJGb3JtYXQuVGV4dDtcclxuICAgIH1cclxuICAgIC8qKiBDcmVhdGVzIGFuIGFycmF5IG9mIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViTWVzc2FnZX0gb2JqZWN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXQgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgICAqIEBwYXJhbSB7SUxvZ2dlcn0gbG9nZ2VyIEEgbG9nZ2VyIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGxvZyBtZXNzYWdlcyB0aGF0IG9jY3VyIGR1cmluZyBwYXJzaW5nLlxyXG4gICAgICovXHJcbiAgICBwYXJzZU1lc3NhZ2VzKGlucHV0LCBsb2dnZXIpIHtcclxuICAgICAgICAvLyBUaGUgaW50ZXJmYWNlIGRvZXMgYWxsb3cgXCJBcnJheUJ1ZmZlclwiIHRvIGJlIHBhc3NlZCBpbiwgYnV0IHRoaXMgaW1wbGVtZW50YXRpb24gZG9lcyBub3QuIFNvIGxldCdzIHRocm93IGEgdXNlZnVsIGVycm9yLlxyXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgSlNPTiBodWIgcHJvdG9jb2wuIEV4cGVjdGVkIGEgc3RyaW5nLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFpbnB1dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsb2dnZXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgbG9nZ2VyID0gTnVsbExvZ2dlci5pbnN0YW5jZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gUGFyc2UgdGhlIG1lc3NhZ2VzXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBUZXh0TWVzc2FnZUZvcm1hdC5wYXJzZShpbnB1dCk7XHJcbiAgICAgICAgY29uc3QgaHViTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgcGFyc2VkTWVzc2FnZSA9IEpTT04ucGFyc2UobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VkTWVzc2FnZS50eXBlICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHBheWxvYWQuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaCAocGFyc2VkTWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkludm9jYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faXNJbnZvY2F0aW9uTWVzc2FnZShwYXJzZWRNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU3RyZWFtSXRlbTpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pc1N0cmVhbUl0ZW1NZXNzYWdlKHBhcnNlZE1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5Db21wbGV0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lzQ29tcGxldGlvbk1lc3NhZ2UocGFyc2VkTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2luZ2xlIHZhbHVlLCBubyBuZWVkIHRvIHZhbGlkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNsb3NlOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFsbCBvcHRpb25hbCB2YWx1ZXMsIG5vIG5lZWQgdG8gdmFsaWRhdGVcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQWNrOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lzQWNrTWVzc2FnZShwYXJzZWRNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU2VxdWVuY2U6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faXNTZXF1ZW5jZU1lc3NhZ2UocGFyc2VkTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZ1dHVyZSBwcm90b2NvbCBjaGFuZ2VzIGNhbiBhZGQgbWVzc2FnZSB0eXBlcywgb2xkIGNsaWVudHMgY2FuIGlnbm9yZSB0aGVtXHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhMb2dMZXZlbC5JbmZvcm1hdGlvbiwgXCJVbmtub3duIG1lc3NhZ2UgdHlwZSAnXCIgKyBwYXJzZWRNZXNzYWdlLnR5cGUgKyBcIicgaWdub3JlZC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaHViTWVzc2FnZXMucHVzaChwYXJzZWRNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGh1Yk1lc3NhZ2VzO1xyXG4gICAgfVxyXG4gICAgLyoqIFdyaXRlcyB0aGUgc3BlY2lmaWVkIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViTWVzc2FnZX0gdG8gYSBzdHJpbmcgYW5kIHJldHVybnMgaXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIdWJNZXNzYWdlfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHdyaXRlLlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gQSBzdHJpbmcgY29udGFpbmluZyB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWVzc2FnZS5cclxuICAgICAqL1xyXG4gICAgd3JpdGVNZXNzYWdlKG1lc3NhZ2UpIHtcclxuICAgICAgICByZXR1cm4gVGV4dE1lc3NhZ2VGb3JtYXQud3JpdGUoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xyXG4gICAgfVxyXG4gICAgX2lzSW52b2NhdGlvbk1lc3NhZ2UobWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdEVtcHR5U3RyaW5nKG1lc3NhZ2UudGFyZ2V0LCBcIkludmFsaWQgcGF5bG9hZCBmb3IgSW52b2NhdGlvbiBtZXNzYWdlLlwiKTtcclxuICAgICAgICBpZiAobWVzc2FnZS5pbnZvY2F0aW9uSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9hc3NlcnROb3RFbXB0eVN0cmluZyhtZXNzYWdlLmludm9jYXRpb25JZCwgXCJJbnZhbGlkIHBheWxvYWQgZm9yIEludm9jYXRpb24gbWVzc2FnZS5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2lzU3RyZWFtSXRlbU1lc3NhZ2UobWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdEVtcHR5U3RyaW5nKG1lc3NhZ2UuaW52b2NhdGlvbklkLCBcIkludmFsaWQgcGF5bG9hZCBmb3IgU3RyZWFtSXRlbSBtZXNzYWdlLlwiKTtcclxuICAgICAgICBpZiAobWVzc2FnZS5pdGVtID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwYXlsb2FkIGZvciBTdHJlYW1JdGVtIG1lc3NhZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pc0NvbXBsZXRpb25NZXNzYWdlKG1lc3NhZ2UpIHtcclxuICAgICAgICBpZiAobWVzc2FnZS5yZXN1bHQgJiYgbWVzc2FnZS5lcnJvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHBheWxvYWQgZm9yIENvbXBsZXRpb24gbWVzc2FnZS5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghbWVzc2FnZS5yZXN1bHQgJiYgbWVzc2FnZS5lcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9hc3NlcnROb3RFbXB0eVN0cmluZyhtZXNzYWdlLmVycm9yLCBcIkludmFsaWQgcGF5bG9hZCBmb3IgQ29tcGxldGlvbiBtZXNzYWdlLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90RW1wdHlTdHJpbmcobWVzc2FnZS5pbnZvY2F0aW9uSWQsIFwiSW52YWxpZCBwYXlsb2FkIGZvciBDb21wbGV0aW9uIG1lc3NhZ2UuXCIpO1xyXG4gICAgfVxyXG4gICAgX2lzQWNrTWVzc2FnZShtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLnNlcXVlbmNlSWQgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgU2VxdWVuY2VJZCBmb3IgQWNrIG1lc3NhZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pc1NlcXVlbmNlTWVzc2FnZShtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLnNlcXVlbmNlSWQgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgU2VxdWVuY2VJZCBmb3IgU2VxdWVuY2UgbWVzc2FnZS5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2Fzc2VydE5vdEVtcHR5U3RyaW5nKHZhbHVlLCBlcnJvck1lc3NhZ2UpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8IHZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Kc29uSHViUHJvdG9jb2wuanMubWFwIiwiLy8gTGljZW5zZWQgdG8gdGhlIC5ORVQgRm91bmRhdGlvbiB1bmRlciBvbmUgb3IgbW9yZSBhZ3JlZW1lbnRzLlxyXG4vLyBUaGUgLk5FVCBGb3VuZGF0aW9uIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG5pbXBvcnQgeyBEZWZhdWx0UmVjb25uZWN0UG9saWN5IH0gZnJvbSBcIi4vRGVmYXVsdFJlY29ubmVjdFBvbGljeVwiO1xyXG5pbXBvcnQgeyBIdHRwQ29ubmVjdGlvbiB9IGZyb20gXCIuL0h0dHBDb25uZWN0aW9uXCI7XHJcbmltcG9ydCB7IEh1YkNvbm5lY3Rpb24gfSBmcm9tIFwiLi9IdWJDb25uZWN0aW9uXCI7XHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcIi4vSUxvZ2dlclwiO1xyXG5pbXBvcnQgeyBKc29uSHViUHJvdG9jb2wgfSBmcm9tIFwiLi9Kc29uSHViUHJvdG9jb2xcIjtcclxuaW1wb3J0IHsgTnVsbExvZ2dlciB9IGZyb20gXCIuL0xvZ2dlcnNcIjtcclxuaW1wb3J0IHsgQXJnLCBDb25zb2xlTG9nZ2VyIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuY29uc3QgTG9nTGV2ZWxOYW1lTWFwcGluZyA9IHtcclxuICAgIHRyYWNlOiBMb2dMZXZlbC5UcmFjZSxcclxuICAgIGRlYnVnOiBMb2dMZXZlbC5EZWJ1ZyxcclxuICAgIGluZm86IExvZ0xldmVsLkluZm9ybWF0aW9uLFxyXG4gICAgaW5mb3JtYXRpb246IExvZ0xldmVsLkluZm9ybWF0aW9uLFxyXG4gICAgd2FybjogTG9nTGV2ZWwuV2FybmluZyxcclxuICAgIHdhcm5pbmc6IExvZ0xldmVsLldhcm5pbmcsXHJcbiAgICBlcnJvcjogTG9nTGV2ZWwuRXJyb3IsXHJcbiAgICBjcml0aWNhbDogTG9nTGV2ZWwuQ3JpdGljYWwsXHJcbiAgICBub25lOiBMb2dMZXZlbC5Ob25lLFxyXG59O1xyXG5mdW5jdGlvbiBwYXJzZUxvZ0xldmVsKG5hbWUpIHtcclxuICAgIC8vIENhc2UtaW5zZW5zaXRpdmUgbWF0Y2hpbmcgdmlhIGxvd2VyLWNhc2luZ1xyXG4gICAgLy8gWWVzLCBJIGtub3cgY2FzZS1mb2xkaW5nIGlzIGEgY29tcGxpY2F0ZWQgcHJvYmxlbSBpbiBVbmljb2RlLCBidXQgd2Ugb25seSBzdXBwb3J0XHJcbiAgICAvLyB0aGUgQVNDSUkgc3RyaW5ncyBkZWZpbmVkIGluIExvZ0xldmVsTmFtZU1hcHBpbmcgYW55d2F5LCBzbyBpdCdzIGZpbmUgLWFudXJzZS5cclxuICAgIGNvbnN0IG1hcHBpbmcgPSBMb2dMZXZlbE5hbWVNYXBwaW5nW25hbWUudG9Mb3dlckNhc2UoKV07XHJcbiAgICBpZiAodHlwZW9mIG1hcHBpbmcgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICByZXR1cm4gbWFwcGluZztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBsb2cgbGV2ZWw6ICR7bmFtZX1gKTtcclxuICAgIH1cclxufVxyXG4vKiogQSBidWlsZGVyIGZvciBjb25maWd1cmluZyB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkh1YkNvbm5lY3Rpb259IGluc3RhbmNlcy4gKi9cclxuZXhwb3J0IGNsYXNzIEh1YkNvbm5lY3Rpb25CdWlsZGVyIHtcclxuICAgIGNvbmZpZ3VyZUxvZ2dpbmcobG9nZ2luZykge1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKGxvZ2dpbmcsIFwibG9nZ2luZ1wiKTtcclxuICAgICAgICBpZiAoaXNMb2dnZXIobG9nZ2luZykpIHtcclxuICAgICAgICAgICAgdGhpcy5sb2dnZXIgPSBsb2dnaW5nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgbG9nZ2luZyA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBjb25zdCBsb2dMZXZlbCA9IHBhcnNlTG9nTGV2ZWwobG9nZ2luZyk7XHJcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyID0gbmV3IENvbnNvbGVMb2dnZXIobG9nTGV2ZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5sb2dnZXIgPSBuZXcgQ29uc29sZUxvZ2dlcihsb2dnaW5nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICB3aXRoVXJsKHVybCwgdHJhbnNwb3J0VHlwZU9yT3B0aW9ucykge1xyXG4gICAgICAgIEFyZy5pc1JlcXVpcmVkKHVybCwgXCJ1cmxcIik7XHJcbiAgICAgICAgQXJnLmlzTm90RW1wdHkodXJsLCBcInVybFwiKTtcclxuICAgICAgICB0aGlzLnVybCA9IHVybDtcclxuICAgICAgICAvLyBGbG93LXR5cGluZyBrbm93cyB3aGVyZSBpdCdzIGF0LiBTaW5jZSBIdHRwVHJhbnNwb3J0VHlwZSBpcyBhIG51bWJlciBhbmQgSUh0dHBDb25uZWN0aW9uT3B0aW9ucyBpcyBndWFyYW50ZWVkXHJcbiAgICAgICAgLy8gdG8gYmUgYW4gb2JqZWN0LCB3ZSBrbm93IChhcyBkb2VzIFR5cGVTY3JpcHQpIHRoaXMgY29tcGFyaXNvbiBpcyBhbGwgd2UgbmVlZCB0byBmaWd1cmUgb3V0IHdoaWNoIG92ZXJsb2FkIHdhcyBjYWxsZWQuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB0cmFuc3BvcnRUeXBlT3JPcHRpb25zID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaHR0cENvbm5lY3Rpb25PcHRpb25zID0geyAuLi50aGlzLmh0dHBDb25uZWN0aW9uT3B0aW9ucywgLi4udHJhbnNwb3J0VHlwZU9yT3B0aW9ucyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5odHRwQ29ubmVjdGlvbk9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi50aGlzLmh0dHBDb25uZWN0aW9uT3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHRyYW5zcG9ydDogdHJhbnNwb3J0VHlwZU9yT3B0aW9ucyxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICAvKiogQ29uZmlndXJlcyB0aGUge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5IdWJDb25uZWN0aW9ufSB0byB1c2UgdGhlIHNwZWNpZmllZCBIdWIgUHJvdG9jb2wuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtJSHViUHJvdG9jb2x9IHByb3RvY29sIFRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLklIdWJQcm90b2NvbH0gaW1wbGVtZW50YXRpb24gdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICB3aXRoSHViUHJvdG9jb2wocHJvdG9jb2wpIHtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZChwcm90b2NvbCwgXCJwcm90b2NvbFwiKTtcclxuICAgICAgICB0aGlzLnByb3RvY29sID0gcHJvdG9jb2w7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICB3aXRoQXV0b21hdGljUmVjb25uZWN0KHJldHJ5RGVsYXlzT3JSZWNvbm5lY3RQb2xpY3kpIHtcclxuICAgICAgICBpZiAodGhpcy5yZWNvbm5lY3RQb2xpY3kpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSByZWNvbm5lY3RQb2xpY3kgaGFzIGFscmVhZHkgYmVlbiBzZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJldHJ5RGVsYXlzT3JSZWNvbm5lY3RQb2xpY3kpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3RQb2xpY3kgPSBuZXcgRGVmYXVsdFJlY29ubmVjdFBvbGljeSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldHJ5RGVsYXlzT3JSZWNvbm5lY3RQb2xpY3kpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0UG9saWN5ID0gbmV3IERlZmF1bHRSZWNvbm5lY3RQb2xpY3kocmV0cnlEZWxheXNPclJlY29ubmVjdFBvbGljeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdFBvbGljeSA9IHJldHJ5RGVsYXlzT3JSZWNvbm5lY3RQb2xpY3k7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgLyoqIENvbmZpZ3VyZXMge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5IdWJDb25uZWN0aW9uLnNlcnZlclRpbWVvdXRJbk1pbGxpc2Vjb25kc30gZm9yIHRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkh1YkNvbm5lY3Rpb259LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIFRoZSB7QGxpbmsgQG1pY3Jvc29mdC9zaWduYWxyLkh1YkNvbm5lY3Rpb25CdWlsZGVyfSBpbnN0YW5jZSwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICB3aXRoU2VydmVyVGltZW91dChtaWxsaXNlY29uZHMpIHtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZChtaWxsaXNlY29uZHMsIFwibWlsbGlzZWNvbmRzXCIpO1xyXG4gICAgICAgIHRoaXMuX3NlcnZlclRpbWVvdXRJbk1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIC8qKiBDb25maWd1cmVzIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViQ29ubmVjdGlvbi5rZWVwQWxpdmVJbnRlcnZhbEluTWlsbGlzZWNvbmRzfSBmb3IgdGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViQ29ubmVjdGlvbn0uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMgVGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViQ29ubmVjdGlvbkJ1aWxkZXJ9IGluc3RhbmNlLCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIHdpdGhLZWVwQWxpdmVJbnRlcnZhbChtaWxsaXNlY29uZHMpIHtcclxuICAgICAgICBBcmcuaXNSZXF1aXJlZChtaWxsaXNlY29uZHMsIFwibWlsbGlzZWNvbmRzXCIpO1xyXG4gICAgICAgIHRoaXMuX2tlZXBBbGl2ZUludGVydmFsSW5NaWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICAvKiogRW5hYmxlcyBhbmQgY29uZmlndXJlcyBvcHRpb25zIGZvciB0aGUgU3RhdGVmdWwgUmVjb25uZWN0IGZlYXR1cmUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMgVGhlIHtAbGluayBAbWljcm9zb2Z0L3NpZ25hbHIuSHViQ29ubmVjdGlvbkJ1aWxkZXJ9IGluc3RhbmNlLCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIHdpdGhTdGF0ZWZ1bFJlY29ubmVjdChvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaHR0cENvbm5lY3Rpb25PcHRpb25zID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5odHRwQ29ubmVjdGlvbk9wdGlvbnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5odHRwQ29ubmVjdGlvbk9wdGlvbnMuX3VzZVN0YXRlZnVsUmVjb25uZWN0ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9zdGF0ZWZ1bFJlY29ubmVjdEJ1ZmZlclNpemUgPSBvcHRpb25zID09PSBudWxsIHx8IG9wdGlvbnMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IG9wdGlvbnMuYnVmZmVyU2l6ZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIC8qKiBDcmVhdGVzIGEge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5IdWJDb25uZWN0aW9ufSBmcm9tIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgc3BlY2lmaWVkIGluIHRoaXMgYnVpbGRlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SHViQ29ubmVjdGlvbn0gVGhlIGNvbmZpZ3VyZWQge0BsaW5rIEBtaWNyb3NvZnQvc2lnbmFsci5IdWJDb25uZWN0aW9ufS5cclxuICAgICAqL1xyXG4gICAgYnVpbGQoKSB7XHJcbiAgICAgICAgLy8gSWYgaHR0cENvbm5lY3Rpb25PcHRpb25zIGhhcyBhIGxvZ2dlciwgdXNlIGl0LiBPdGhlcndpc2UsIG92ZXJyaWRlIGl0IHdpdGggdGhlIG9uZVxyXG4gICAgICAgIC8vIHByb3ZpZGVkIHRvIGNvbmZpZ3VyZUxvZ2dlclxyXG4gICAgICAgIGNvbnN0IGh0dHBDb25uZWN0aW9uT3B0aW9ucyA9IHRoaXMuaHR0cENvbm5lY3Rpb25PcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIC8vIElmIGl0J3MgJ251bGwnLCB0aGUgdXNlciAqKmV4cGxpY2l0bHkqKiBhc2tlZCBmb3IgbnVsbCwgZG9uJ3QgbWVzcyB3aXRoIGl0LlxyXG4gICAgICAgIGlmIChodHRwQ29ubmVjdGlvbk9wdGlvbnMubG9nZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gSWYgb3VyIGxvZ2dlciBpcyB1bmRlZmluZWQgb3IgbnVsbCwgdGhhdCdzIE9LLCB0aGUgSHR0cENvbm5lY3Rpb24gY29uc3RydWN0b3Igd2lsbCBoYW5kbGUgaXQuXHJcbiAgICAgICAgICAgIGh0dHBDb25uZWN0aW9uT3B0aW9ucy5sb2dnZXIgPSB0aGlzLmxvZ2dlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTm93IGNyZWF0ZSB0aGUgY29ubmVjdGlvblxyXG4gICAgICAgIGlmICghdGhpcy51cmwpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlICdIdWJDb25uZWN0aW9uQnVpbGRlci53aXRoVXJsJyBtZXRob2QgbXVzdCBiZSBjYWxsZWQgYmVmb3JlIGJ1aWxkaW5nIHRoZSBjb25uZWN0aW9uLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBIdHRwQ29ubmVjdGlvbih0aGlzLnVybCwgaHR0cENvbm5lY3Rpb25PcHRpb25zKTtcclxuICAgICAgICByZXR1cm4gSHViQ29ubmVjdGlvbi5jcmVhdGUoY29ubmVjdGlvbiwgdGhpcy5sb2dnZXIgfHwgTnVsbExvZ2dlci5pbnN0YW5jZSwgdGhpcy5wcm90b2NvbCB8fCBuZXcgSnNvbkh1YlByb3RvY29sKCksIHRoaXMucmVjb25uZWN0UG9saWN5LCB0aGlzLl9zZXJ2ZXJUaW1lb3V0SW5NaWxsaXNlY29uZHMsIHRoaXMuX2tlZXBBbGl2ZUludGVydmFsSW5NaWxsaXNlY29uZHMsIHRoaXMuX3N0YXRlZnVsUmVjb25uZWN0QnVmZmVyU2l6ZSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gaXNMb2dnZXIobG9nZ2VyKSB7XHJcbiAgICByZXR1cm4gbG9nZ2VyLmxvZyAhPT0gdW5kZWZpbmVkO1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUh1YkNvbm5lY3Rpb25CdWlsZGVyLmpzLm1hcCJdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsSUFBYSxZQUFiLGNBQStCLE1BQU07Ozs7OztDQU1qQyxZQUFZLGNBQWMsWUFBWTtFQUNsQyxNQUFNLFlBQVksV0FBVztFQUM3QixNQUFNLEdBQUcsYUFBYSxpQkFBaUIsV0FBVyxFQUFFO0VBQ3BELEtBQUssYUFBYTtFQUdsQixLQUFLLFlBQVk7Q0FDckI7QUFDSjs7QUFFQSxJQUFhLGVBQWIsY0FBa0MsTUFBTTs7Ozs7Q0FLcEMsWUFBWSxlQUFlLHVCQUF1QjtFQUM5QyxNQUFNLFlBQVksV0FBVztFQUM3QixNQUFNLFlBQVk7RUFHbEIsS0FBSyxZQUFZO0NBQ3JCO0FBQ0o7O0FBRUEsSUFBYSxhQUFiLGNBQWdDLE1BQU07Ozs7O0NBS2xDLFlBQVksZUFBZSxzQkFBc0I7RUFDN0MsTUFBTSxZQUFZLFdBQVc7RUFDN0IsTUFBTSxZQUFZO0VBR2xCLEtBQUssWUFBWTtDQUNyQjtBQUNKOzs7QUFHQSxJQUFhLDRCQUFiLGNBQStDLE1BQU07Ozs7OztDQU1qRCxZQUFZLFNBQVMsV0FBVztFQUM1QixNQUFNLFlBQVksV0FBVztFQUM3QixNQUFNLE9BQU87RUFDYixLQUFLLFlBQVk7RUFDakIsS0FBSyxZQUFZO0VBR2pCLEtBQUssWUFBWTtDQUNyQjtBQUNKOzs7QUFHQSxJQUFhLHlCQUFiLGNBQTRDLE1BQU07Ozs7OztDQU05QyxZQUFZLFNBQVMsV0FBVztFQUM1QixNQUFNLFlBQVksV0FBVztFQUM3QixNQUFNLE9BQU87RUFDYixL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