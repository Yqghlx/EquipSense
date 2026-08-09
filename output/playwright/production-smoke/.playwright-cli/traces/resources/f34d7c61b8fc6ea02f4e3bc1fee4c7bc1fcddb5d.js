import { i as __toESM, t as __commonJSMin } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
//#region node_modules/tslib/tslib.es6.mjs
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var extendStatics = function(d, b) {
	extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
		d.__proto__ = b;
	} || function(d, b) {
		for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
	};
	return extendStatics(d, b);
};
function __extends(d, b) {
	if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	extendStatics(d, b);
	function __() {
		this.constructor = d;
	}
	d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
	__assign = Object.assign || function __assign(t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
		}
		return t;
	};
	return __assign.apply(this, arguments);
};
function __rest(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
}
function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}
function __generator(thisArg, body) {
	var _ = {
		label: 0,
		sent: function() {
			if (t[0] & 1) throw t[1];
			return t[1];
		},
		trys: [],
		ops: []
	}, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
	return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
		return this;
	}), g;
	function verb(n) {
		return function(v) {
			return step([n, v]);
		};
	}
	function step(op) {
		if (f) throw new TypeError("Generator is already executing.");
		while (g && (g = 0, op[0] && (_ = 0)), _) try {
			if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
			if (y = 0, t) op = [op[0] & 2, t.value];
			switch (op[0]) {
				case 0:
				case 1:
					t = op;
					break;
				case 4:
					_.label++;
					return {
						value: op[1],
						done: false
					};
				case 5:
					_.label++;
					y = op[1];
					op = [0];
					continue;
				case 7:
					op = _.ops.pop();
					_.trys.pop();
					continue;
				default:
					if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
						_ = 0;
						continue;
					}
					if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
						_.label = op[1];
						break;
					}
					if (op[0] === 6 && _.label < t[1]) {
						_.label = t[1];
						t = op;
						break;
					}
					if (t && _.label < t[2]) {
						_.label = t[2];
						_.ops.push(op);
						break;
					}
					if (t[2]) _.ops.pop();
					_.trys.pop();
					continue;
			}
			op = body.call(thisArg, _);
		} catch (e) {
			op = [6, e];
			y = 0;
		} finally {
			f = t = 0;
		}
		if (op[0] & 5) throw op[1];
		return {
			value: op[0] ? op[1] : void 0,
			done: true
		};
	}
}
//#endregion
//#region node_modules/size-sensor/lib/id.js
var require_id = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports["default"] = void 0;
	/**
	* Created by hustcc on 18/6/9.
	* Contract: i@hust.cc
	*/
	var id = 1;
	exports["default"] = function _default() {
		return "".concat(id++);
	};
}));
//#endregion
//#region node_modules/size-sensor/lib/debounce.js
var require_debounce = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports["default"] = void 0;
	exports["default"] = function _default(fn) {
		var delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 60;
		var timer = null;
		return function() {
			var _this = this;
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			clearTimeout(timer);
			timer = setTimeout(function() {
				fn.apply(_this, args);
			}, delay);
		};
	};
}));
//#endregion
//#region node_modules/size-sensor/lib/constant.js
var require_constant = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SizeSensorId = exports.SensorTabIndex = exports.SensorClassName = void 0;
	exports.SizeSensorId = "size-sensor-id";
	exports.SensorClassName = "size-sensor-object";
	exports.SensorTabIndex = "-1";
}));
//#endregion
//#region node_modules/size-sensor/lib/sensors/object.js
var require_object = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createSensor = void 0;
	var _debounce = _interopRequireDefault(require_debounce());
	var _constant = require_constant();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	exports.createSensor = function createSensor(element, whenDestroy) {
		var sensor = void 0;
		var listeners = [];
		/**
		* create object DOM of sensor
		* @returns {HTMLObjectElement}
		*/
		var newSensor = function newSensor() {
			if (getComputedStyle(element).position === "static") element.style.position = "relative";
			var obj = document.createElement("object");
			obj.onload = function() {
				obj.contentDocument.defaultView.addEventListener("resize", resizeListener);
				resizeListener();
			};
			obj.style.display = "block";
			obj.style.position = "absolute";
			obj.style.top = "0";
			obj.style.left = "0";
			obj.style.height = "100%";
			obj.style.width = "100%";
			obj.style.overflow = "hidden";
			obj.style.pointerEvents = "none";
			obj.style.zIndex = "-1";
			obj.style.opacity = "0";
			obj.setAttribute("class", _constant.SensorClassName);
			obj.setAttribute("tabindex", _constant.SensorTabIndex);
			obj.type = "text/html";
			element.appendChild(obj);
			obj.data = "about:blank";
			return obj;
		};
		/**
		* trigger listeners
		*/
		var resizeListener = (0, _debounce["default"])(function() {
			listeners.forEach(function(listener) {
				listener(element);
			});
		});
		/**
		* listen with one callback function
		* @param cb
		*/
		var bind = function bind(cb) {
			if (!sensor) sensor = newSensor();
			if (listeners.indexOf(cb) === -1) listeners.push(cb);
		};
		/**
		* destroy all
		*/
		var destroy = function destroy() {
			if (sensor && sensor.parentNode) {
				if (sensor.contentDocument) sensor.contentDocument.defaultView.removeEventListener("resize", resizeListener);
				sensor.parentNode.removeChild(sensor);
				element.removeAttribute(_constant.SizeSensorId);
				sensor = void 0;
				listeners = [];
				whenDestroy && whenDestroy();
			}
		};
		return {
			element,
			bind,
			destroy,
			unbind: function unbind(cb) {
				var idx = listeners.indexOf(cb);
				if (idx !== -1) listeners.splice(idx, 1);
				if (listeners.length === 0 && sensor) destroy();
			}
		};
	};
}));
//#endregion
//#region node_modules/size-sensor/lib/sensors/resizeObserver.js
var require_resizeObserver = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createSensor = void 0;
	var _constant = require_constant();
	var _debounce = _interopRequireDefault(require_debounce());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	exports.createSensor = function createSensor(element, whenDestroy) {
		var sensor = void 0;
		var listeners = [];
		/**
		* trigger listeners
		*/
		var resizeListener = (0, _debounce["default"])(function() {
			listeners.forEach(function(listener) {
				listener(element);
			});
		});
		/**
		* create ResizeObserver sensor
		* @returns
		*/
		var newSensor = function newSensor() {
			var s = new ResizeObserver(resizeListener);
			s.observe(element);
			resizeListener();
			return s;
		};
		/**
		* listen with callback
		* @param cb
		*/
		var bind = function bind(cb) {
			if (!sensor) sensor = newSensor();
			if (listeners.indexOf(cb) === -1) listeners.push(cb);
		};
		/**
		* destroy
		*/
		var destroy = function destroy() {
			if (sensor) sensor.disconnect();
			listeners = [];
			sensor = void 0;
			element.removeAttribute(_constant.SizeSensorId);
			whenDestroy && whenDestroy();
		};
		return {
			element,
			bind,
			destroy,
			unbind: function unbind(cb) {
				var idx = listeners.indexOf(cb);
				if (idx !== -1) listeners.splice(idx, 1);
				if (listeners.length === 0 && sensor) destroy();
			}
		};
	};
}));
//#endregion
//#region node_modules/size-sensor/lib/sensors/index.js
var require_sensors = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createSensor = void 0;
	var _object = require_object();
	var _resizeObserver = require_resizeObserver();
	exports.createSensor = typeof ResizeObserver !== "undefined" ? _resizeObserver.createSensor : _object.createSensor;
}));
//#endregion
//#region node_modules/size-sensor/lib/sensorPool.js
var require_sensorPool = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.removeSensor = exports.getSensor = exports.Sensors = void 0;
	var _id = _interopRequireDefault(require_id());
	var _sensors = require_sensors();
	var _constant = require_constant();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	/**
	* Created by hustcc on 18/6/9.
	* Contract: i@hust.cc
	*/
	/**
	* all the sensor objects.
	* sensor pool
	*/
	var Sensors = exports.Sensors = {};
	/**
	* When destroy the sensor, remove it from the pool
	*/
	function clean(sensorId) {
		if (sensorId && Sensors[sensorId]) delete Sensors[sensorId];
	}
	exports.getSensor = function getSensor(element) {
		var sensorId = element.getAttribute(_constant.SizeSensorId);
		if (sensorId && Sensors[sensorId]) return Sensors[sensorId];
		var newId = (0, _id["default"])();
		element.setAttribute(_constant.SizeSensorId, newId);
		var sensor = (0, _sensors.createSensor)(element, function() {
			return clean(newId);
		});
		Sensors[newId] = sensor;
		return sensor;
	};
	exports.removeSensor = function removeSensor(sensor) {
		var sensorId = sensor.element.getAttribute(_constant.SizeSensorId);
		sensor.destroy();
		clean(sensorId);
	};
}));
//#endregion
//#region node_modules/size-sensor/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ver = exports.clear = exports.bind = void 0;
	var _sensorPool = require_sensorPool();
	exports.bind = function bind(element, cb) {
		var sensor = (0, _sensorPool.getSensor)(element);
		sensor.bind(cb);
		return function() {
			sensor.unbind(cb);
		};
	};
	exports.clear = function clear(element) {
		var sensor = (0, _sensorPool.getSensor)(element);
		(0, _sensorPool.removeSensor)(sensor);
	};
	exports.ver = "1.0.3";
}));
//#endregion
//#region node_modules/echarts-for-react/esm/helper/pick.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_lib = require_lib();
/**
* 保留 object 中的部分内容
* @param obj
* @param keys
*/
function pick(obj, keys) {
	var r = {};
	keys.forEach(function(key) {
		r[key] = obj[key];
	});
	return r;
}
//#endregion
//#region node_modules/echarts-for-react/esm/helper/is-function.js
function isFunction(v) {
	return typeof v === "function";
}
//#endregion
//#region node_modules/echarts-for-react/esm/helper/is-string.js
function isString(v) {
	return typeof v === "string";
}
//#endregion
//#region node_modules/echarts-for-react/esm/helper/is-equal.js
var import_fast_deep_equal = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function equal(a, b) {
		if (a === b) return true;
		if (a && b && typeof a == "object" && typeof b == "object") {
			if (a.constructor !== b.constructor) return false;
			var length, i, keys;
			if (Array.isArray(a)) {
				length = a.length;
				if (length != b.length) return false;
				for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
				return true;
			}
			if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
			if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
			if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
			keys = Object.keys(a);
			length = keys.length;
			if (length !== Object.keys(b).length) return false;
			for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
			for (i = length; i-- !== 0;) {
				var key = keys[i];
				if (!equal(a[key], b[key])) return false;
			}
			return true;
		}
		return a !== a && b !== b;
	};
})))());
//#endregion
//#region node_modules/echarts-for-react/esm/core.js
/**
* core component for echarts binding
*/
var EChartsReactCore = function(_super) {
	__extends(EChartsReactCore, _super);
	function EChartsReactCore(props) {
		var _this = _super.call(this, props) || this;
		_this.echarts = props.echarts;
		_this.ele = null;
		_this.isInitialResize = true;
		_this.eventHandlerRefs = {};
		return _this;
	}
	EChartsReactCore.prototype.componentDidMount = function() {
		this.renderNewEcharts();
	};
	EChartsReactCore.prototype.componentDidUpdate = function(prevProps) {
		/**
		* if shouldSetOption return false, then return, not update echarts options
		* default is true
		*/
		var shouldSetOption = this.props.shouldSetOption;
		if (isFunction(shouldSetOption) && !shouldSetOption(prevProps, this.props)) return;
		if (!(0, import_fast_deep_equal.default)(prevProps.theme, this.props.theme) || !(0, import_fast_deep_equal.default)(prevProps.opts, this.props.opts)) {
			this.dispose();
			this.renderNewEcharts();
			return;
		}
		var echartsInstance = this.getEchartsInstance();
		if (!(0, import_fast_deep_equal.default)(prevProps.onEvents, this.props.onEvents)) {
			this.unbindEvents(echartsInstance);
			this.bindEvents(echartsInstance, this.props.onEvents);
		}
		var pickKeys = [
			"option",
			"notMerge",
			"replaceMerge",
			"lazyUpdate",
			"showLoading",
			"loadingOption"
		];
		if (!(0, import_fast_deep_equal.default)(pick(this.props, pickKeys), pick(prevProps, pickKeys))) this.updateEChartsOption();
		/**
		* when style or class name updated, change size.
		*/
		if (!(0, import_fast_deep_equal.default)(prevProps.style, this.props.style) || !(0, import_fast_deep_equal.default)(prevProps.className, this.props.className)) this.resize();
	};
	EChartsReactCore.prototype.componentWillUnmount = function() {
		this.dispose();
	};
	EChartsReactCore.prototype.initEchartsInstance = function() {
		return __awaiter(this, void 0, void 0, function() {
			var _this = this;
			return __generator(this, function(_a) {
				return [2, new Promise(function(resolve) {
					_this.echarts.init(_this.ele, _this.props.theme, _this.props.opts);
					_this.getEchartsInstance().on("finished", function() {
						var width = _this.ele.clientWidth;
						var height = _this.ele.clientHeight;
						_this.echarts.dispose(_this.ele);
						var opts = __assign({
							width,
							height
						}, _this.props.opts);
						resolve(_this.echarts.init(_this.ele, _this.props.theme, opts));
					});
				})];
			});
		});
	};
	/**
	* return the existing echart object
	*/
	EChartsReactCore.prototype.getEchartsInstance = function() {
		return this.echarts.getInstanceByDom(this.ele);
	};
	/**
	* dispose echarts and clear size-sensor
	*/
	EChartsReactCore.prototype.dispose = function() {
		if (this.ele) {
			try {
				(0, import_lib.clear)(this.ele);
			} catch (e) {
				console.warn(e);
			}
			this.echarts.dispose(this.ele);
		}
	};
	/**
	* render a new echarts instance
	*/
	EChartsReactCore.prototype.renderNewEcharts = function() {
		return __awaiter(this, void 0, void 0, function() {
			var _a, onEvents, onChartReady, _b, autoResize, echartsInstance;
			var _this = this;
			return __generator(this, function(_c) {
				switch (_c.label) {
					case 0:
						_a = this.props, onEvents = _a.onEvents, onChartReady = _a.onChartReady, _b = _a.autoResize, autoResize = _b === void 0 ? true : _b;
						return [4, this.initEchartsInstance()];
					case 1:
						_c.sent();
						echartsInstance = this.updateEChartsOption();
						this.bindEvents(echartsInstance, onEvents || {});
						if (isFunction(onChartReady)) onChartReady(echartsInstance);
						if (this.ele && autoResize) (0, import_lib.bind)(this.ele, function() {
							_this.resize();
						});
						return [2];
				}
			});
		});
	};
	EChartsReactCore.prototype.bindEvents = function(instance, events) {
		var _this = this;
		var _bindEvent = function(eventName, func) {
			if (isString(eventName) && isFunction(func)) {
				var handler = function(param) {
					func(param, instance);
				};
				instance.on(eventName, handler);
				_this.eventHandlerRefs[eventName] = handler;
			}
		};
		for (var eventName in events) if (Object.prototype.hasOwnProperty.call(events, eventName)) _bindEvent(eventName, events[eventName]);
	};
	/**
	* Unbind all currently bound event handlers. Importantly, this does not
	* unbind the `"finished"` event that is used for chart initialization.
	*/
	EChartsReactCore.prototype.unbindEvents = function(instance) {
		for (var _i = 0, _a = Object.entries(this.eventHandlerRefs); _i < _a.length; _i++) {
			var _b = _a[_i], eventName = _b[0], listener = _b[1];
			instance.off(eventName, listener);
		}
		this.eventHandlerRefs = {};
	};
	/**
	* render the echarts
	*/
	EChartsReactCore.prototype.updateEChartsOption = function() {
		var _a = this.props, option = _a.option, _b = _a.notMerge, notMerge = _b === void 0 ? false : _b, _c = _a.replaceMerge, replaceMerge = _c === void 0 ? null : _c, _d = _a.lazyUpdate, lazyUpdate = _d === void 0 ? false : _d, showLoading = _a.showLoading, _e = _a.loadingOption, loadingOption = _e === void 0 ? null : _e;
		var echartInstance = this.getEchartsInstance();
		echartInstance.setOption(option, {
			notMerge,
			replaceMerge,
			lazyUpdate
		});
		if (showLoading) echartInstance.showLoading(loadingOption);
		else echartInstance.hideLoading();
		return echartInstance;
	};
	/**
	* resize wrapper
	*/
	EChartsReactCore.prototype.resize = function() {
		var echartsInstance = this.getEchartsInstance();
		if (!this.isInitialResize) try {
			echartsInstance.resize({
				width: "auto",
				height: "auto"
			});
		} catch (e) {
			console.warn(e);
		}
		this.isInitialResize = false;
	};
	EChartsReactCore.prototype.render = function() {
		var _this = this, _a = this.props, style = _a.style, _b = _a.className, className = _b === void 0 ? "" : _b;
		_a.echarts;
		_a.option;
		_a.theme;
		_a.notMerge;
		_a.replaceMerge;
		_a.lazyUpdate;
		_a.showLoading;
		_a.loadingOption;
		_a.opts;
		_a.onChartReady;
		_a.onEvents;
		_a.shouldSetOption;
		_a.autoResize;
		var divHTMLAttributes = __rest(_a, [
			"style",
			"className",
			"echarts",
			"option",
			"theme",
			"notMerge",
			"replaceMerge",
			"lazyUpdate",
			"showLoading",
			"loadingOption",
			"opts",
			"onChartReady",
			"onEvents",
			"shouldSetOption",
			"autoResize"
		]);
		var newStyle = __assign({ height: 300 }, style);
		return import_react.createElement("div", __assign({
			ref: function(e) {
				_this.ele = e;
			},
			style: newStyle,
			className: "echarts-for-react ".concat(className)
		}, divHTMLAttributes));
	};
	return EChartsReactCore;
}(import_react.PureComponent);
//#endregion
export { EChartsReactCore as default };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNoYXJ0cy1mb3ItcmVhY3RfZXNtX2NvcmUuanMiLCJuYW1lcyI6WyJpc0VxdWFsIiwiUHVyZUNvbXBvbmVudCJdLCJzb3VyY2VzIjpbIi4uLy4uL3RzbGliL3RzbGliLmVzNi5tanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvaWQuanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvZGVib3VuY2UuanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvY29uc3RhbnQuanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvc2Vuc29ycy9vYmplY3QuanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvc2Vuc29ycy9yZXNpemVPYnNlcnZlci5qcyIsIi4uLy4uL3NpemUtc2Vuc29yL2xpYi9zZW5zb3JzL2luZGV4LmpzIiwiLi4vLi4vc2l6ZS1zZW5zb3IvbGliL3NlbnNvclBvb2wuanMiLCIuLi8uLi9zaXplLXNlbnNvci9saWIvaW5kZXguanMiLCIuLi8uLi9lY2hhcnRzLWZvci1yZWFjdC9lc20vaGVscGVyL3BpY2suanMiLCIuLi8uLi9lY2hhcnRzLWZvci1yZWFjdC9lc20vaGVscGVyL2lzLWZ1bmN0aW9uLmpzIiwiLi4vLi4vZWNoYXJ0cy1mb3ItcmVhY3QvZXNtL2hlbHBlci9pcy1zdHJpbmcuanMiLCIuLi8uLi9mYXN0LWRlZXAtZXF1YWwvaW5kZXguanMiLCIuLi8uLi9lY2hhcnRzLWZvci1yZWFjdC9lc20vaGVscGVyL2lzLWVxdWFsLmpzIiwiLi4vLi4vZWNoYXJ0cy1mb3ItcmVhY3QvZXNtL2NvcmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG5cblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1Jcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UsIFN1cHByZXNzZWRFcnJvciwgU3ltYm9sLCBJdGVyYXRvciAqL1xuXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcbiAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcbiAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcbiAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcbiAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn1cblxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xuICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xuICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHQ7XG4gIH1cbiAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xuICB2YXIgdCA9IHt9O1xuICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcbiAgICAgIHRbcF0gPSBzW3BdO1xuICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxuICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcbiAgICAgIH1cbiAgcmV0dXJuIHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xuICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fZXNEZWNvcmF0ZShjdG9yLCBkZXNjcmlwdG9ySW4sIGRlY29yYXRvcnMsIGNvbnRleHRJbiwgaW5pdGlhbGl6ZXJzLCBleHRyYUluaXRpYWxpemVycykge1xuICBmdW5jdGlvbiBhY2NlcHQoZikgeyBpZiAoZiAhPT0gdm9pZCAwICYmIHR5cGVvZiBmICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbiBleHBlY3RlZFwiKTsgcmV0dXJuIGY7IH1cbiAgdmFyIGtpbmQgPSBjb250ZXh0SW4ua2luZCwga2V5ID0ga2luZCA9PT0gXCJnZXR0ZXJcIiA/IFwiZ2V0XCIgOiBraW5kID09PSBcInNldHRlclwiID8gXCJzZXRcIiA6IFwidmFsdWVcIjtcbiAgdmFyIHRhcmdldCA9ICFkZXNjcmlwdG9ySW4gJiYgY3RvciA/IGNvbnRleHRJbltcInN0YXRpY1wiXSA/IGN0b3IgOiBjdG9yLnByb3RvdHlwZSA6IG51bGw7XG4gIHZhciBkZXNjcmlwdG9yID0gZGVzY3JpcHRvckluIHx8ICh0YXJnZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgY29udGV4dEluLm5hbWUpIDoge30pO1xuICB2YXIgXywgZG9uZSA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGNvbnRleHQgPSB7fTtcbiAgICAgIGZvciAodmFyIHAgaW4gY29udGV4dEluKSBjb250ZXh0W3BdID0gcCA9PT0gXCJhY2Nlc3NcIiA/IHt9IDogY29udGV4dEluW3BdO1xuICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4uYWNjZXNzKSBjb250ZXh0LmFjY2Vzc1twXSA9IGNvbnRleHRJbi5hY2Nlc3NbcF07XG4gICAgICBjb250ZXh0LmFkZEluaXRpYWxpemVyID0gZnVuY3Rpb24gKGYpIHsgaWYgKGRvbmUpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgYWRkIGluaXRpYWxpemVycyBhZnRlciBkZWNvcmF0aW9uIGhhcyBjb21wbGV0ZWRcIik7IGV4dHJhSW5pdGlhbGl6ZXJzLnB1c2goYWNjZXB0KGYgfHwgbnVsbCkpOyB9O1xuICAgICAgdmFyIHJlc3VsdCA9ICgwLCBkZWNvcmF0b3JzW2ldKShraW5kID09PSBcImFjY2Vzc29yXCIgPyB7IGdldDogZGVzY3JpcHRvci5nZXQsIHNldDogZGVzY3JpcHRvci5zZXQgfSA6IGRlc2NyaXB0b3Jba2V5XSwgY29udGV4dCk7XG4gICAgICBpZiAoa2luZCA9PT0gXCJhY2Nlc3NvclwiKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwKSBjb250aW51ZTtcbiAgICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsIHx8IHR5cGVvZiByZXN1bHQgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgZXhwZWN0ZWRcIik7XG4gICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmdldCkpIGRlc2NyaXB0b3IuZ2V0ID0gXztcbiAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuc2V0KSkgZGVzY3JpcHRvci5zZXQgPSBfO1xuICAgICAgICAgIGlmIChfID0gYWNjZXB0KHJlc3VsdC5pbml0KSkgaW5pdGlhbGl6ZXJzLnVuc2hpZnQoXyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChfID0gYWNjZXB0KHJlc3VsdCkpIHtcbiAgICAgICAgICBpZiAoa2luZCA9PT0gXCJmaWVsZFwiKSBpbml0aWFsaXplcnMudW5zaGlmdChfKTtcbiAgICAgICAgICBlbHNlIGRlc2NyaXB0b3Jba2V5XSA9IF87XG4gICAgICB9XG4gIH1cbiAgaWYgKHRhcmdldCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29udGV4dEluLm5hbWUsIGRlc2NyaXB0b3IpO1xuICBkb25lID0gdHJ1ZTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3J1bkluaXRpYWxpemVycyh0aGlzQXJnLCBpbml0aWFsaXplcnMsIHZhbHVlKSB7XG4gIHZhciB1c2VWYWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGluaXRpYWxpemVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWUgPSB1c2VWYWx1ZSA/IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcsIHZhbHVlKSA6IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcpO1xuICB9XG4gIHJldHVybiB1c2VWYWx1ZSA/IHZhbHVlIDogdm9pZCAwO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIF9fcHJvcEtleSh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIiA/IHggOiBcIlwiLmNvbmNhdCh4KTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3NldEZ1bmN0aW9uTmFtZShmLCBuYW1lLCBwcmVmaXgpIHtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN5bWJvbFwiKSBuYW1lID0gbmFtZS5kZXNjcmlwdGlvbiA/IFwiW1wiLmNvbmNhdChuYW1lLmRlc2NyaXB0aW9uLCBcIl1cIikgOiBcIlwiO1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGYsIFwibmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHByZWZpeCA/IFwiXCIuY29uY2F0KHByZWZpeCwgXCIgXCIsIG5hbWUpIDogbmFtZSB9KTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XG4gIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XG4gIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xuICByZXR1cm4gZy5uZXh0ID0gdmVyYigwKSwgZ1tcInRocm93XCJdID0gdmVyYigxKSwgZ1tcInJldHVyblwiXSA9IHZlcmIoMiksIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcbiAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XG4gIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcbiAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XG4gICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcbiAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XG4gICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgfVxufVxuXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcbiAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xuICBpZiAoIWRlc2MgfHwgKFwiZ2V0XCIgaW4gZGVzYyA/ICFtLl9fZXNNb2R1bGUgOiBkZXNjLndyaXRhYmxlIHx8IGRlc2MuY29uZmlndXJhYmxlKSkge1xuICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcbiAgfVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcbiAgb1trMl0gPSBtW2tdO1xufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xuICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XG4gIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XG4gIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xuICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XG4gICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcbiAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XG4gICAgICB9XG4gIH07XG4gIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XG4gIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcbiAgaWYgKCFtKSByZXR1cm4gbztcbiAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XG4gIHRyeSB7XG4gICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcbiAgfVxuICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cbiAgZmluYWxseSB7XG4gICAgICB0cnkge1xuICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xuICAgICAgfVxuICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XG4gIH1cbiAgcmV0dXJuIGFyO1xufVxuXG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcbiAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXG4gICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XG4gIHJldHVybiBhcjtcbn1cblxuLyoqIEBkZXByZWNhdGVkICovXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XG4gIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xuICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXG4gICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcbiAgICAgICAgICByW2tdID0gYVtqXTtcbiAgcmV0dXJuIHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XG4gIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XG4gICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcbiAgICAgICAgICBhcltpXSA9IGZyb21baV07XG4gICAgICB9XG4gIH1cbiAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcbiAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xuICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xuICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xuICByZXR1cm4gaSA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBBc3luY0l0ZXJhdG9yID09PSBcImZ1bmN0aW9uXCIgPyBBc3luY0l0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpLCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIsIGF3YWl0UmV0dXJuKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xuICBmdW5jdGlvbiBhd2FpdFJldHVybihmKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZiwgcmVqZWN0KTsgfTsgfVxuICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaWYgKGdbbl0pIHsgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgaWYgKGYpIGlbbl0gPSBmKGlbbl0pOyB9IH1cbiAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxuICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cbiAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxuICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XG4gIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xuICB2YXIgaSwgcDtcbiAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcbiAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogZmFsc2UgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xuICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xuICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xuICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XG4gIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cbiAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcbiAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cbiAgcmV0dXJuIGNvb2tlZDtcbn07XG5cbnZhciBfX3NldE1vZHVsZURlZmF1bHQgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIHYpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xufSkgOiBmdW5jdGlvbihvLCB2KSB7XG4gIG9bXCJkZWZhdWx0XCJdID0gdjtcbn07XG5cbnZhciBvd25LZXlzID0gZnVuY3Rpb24obykge1xuICBvd25LZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG8pIHtcbiAgICB2YXIgYXIgPSBbXTtcbiAgICBmb3IgKHZhciBrIGluIG8pIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgaykpIGFyW2FyLmxlbmd0aF0gPSBrO1xuICAgIHJldHVybiBhcjtcbiAgfTtcbiAgcmV0dXJuIG93bktleXMobyk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xuICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xuICB2YXIgcmVzdWx0ID0ge307XG4gIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayA9IG93bktleXMobW9kKSwgaSA9IDA7IGkgPCBrLmxlbmd0aDsgaSsrKSBpZiAoa1tpXSAhPT0gXCJkZWZhdWx0XCIpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwga1tpXSk7XG4gIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XG4gIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xuICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBnZXR0ZXJcIik7XG4gIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHJlYWQgcHJpdmF0ZSBtZW1iZXIgZnJvbSBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xuICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XG4gIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcbiAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgc2V0dGVyXCIpO1xuICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xuICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRJbihzdGF0ZSwgcmVjZWl2ZXIpIHtcbiAgaWYgKHJlY2VpdmVyID09PSBudWxsIHx8ICh0eXBlb2YgcmVjZWl2ZXIgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHJlY2VpdmVyICE9PSBcImZ1bmN0aW9uXCIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHVzZSAnaW4nIG9wZXJhdG9yIG9uIG5vbi1vYmplY3RcIik7XG4gIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZShlbnYsIHZhbHVlLCBhc3luYykge1xuICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgZXhwZWN0ZWQuXCIpO1xuICAgIHZhciBkaXNwb3NlLCBpbm5lcjtcbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgIGlmICghU3ltYm9sLmFzeW5jRGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0Rpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xuICAgICAgZGlzcG9zZSA9IHZhbHVlW1N5bWJvbC5hc3luY0Rpc3Bvc2VdO1xuICAgIH1cbiAgICBpZiAoZGlzcG9zZSA9PT0gdm9pZCAwKSB7XG4gICAgICBpZiAoIVN5bWJvbC5kaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmRpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xuICAgICAgZGlzcG9zZSA9IHZhbHVlW1N5bWJvbC5kaXNwb3NlXTtcbiAgICAgIGlmIChhc3luYykgaW5uZXIgPSBkaXNwb3NlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRpc3Bvc2UgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBub3QgZGlzcG9zYWJsZS5cIik7XG4gICAgaWYgKGlubmVyKSBkaXNwb3NlID0gZnVuY3Rpb24oKSB7IHRyeSB7IGlubmVyLmNhbGwodGhpcyk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpOyB9IH07XG4gICAgZW52LnN0YWNrLnB1c2goeyB2YWx1ZTogdmFsdWUsIGRpc3Bvc2U6IGRpc3Bvc2UsIGFzeW5jOiBhc3luYyB9KTtcbiAgfVxuICBlbHNlIGlmIChhc3luYykge1xuICAgIGVudi5zdGFjay5wdXNoKHsgYXN5bmM6IHRydWUgfSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG52YXIgX1N1cHByZXNzZWRFcnJvciA9IHR5cGVvZiBTdXBwcmVzc2VkRXJyb3IgPT09IFwiZnVuY3Rpb25cIiA/IFN1cHByZXNzZWRFcnJvciA6IGZ1bmN0aW9uIChlcnJvciwgc3VwcHJlc3NlZCwgbWVzc2FnZSkge1xuICB2YXIgZSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgcmV0dXJuIGUubmFtZSA9IFwiU3VwcHJlc3NlZEVycm9yXCIsIGUuZXJyb3IgPSBlcnJvciwgZS5zdXBwcmVzc2VkID0gc3VwcHJlc3NlZCwgZTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2Rpc3Bvc2VSZXNvdXJjZXMoZW52KSB7XG4gIGZ1bmN0aW9uIGZhaWwoZSkge1xuICAgIGVudi5lcnJvciA9IGVudi5oYXNFcnJvciA/IG5ldyBfU3VwcHJlc3NlZEVycm9yKGUsIGVudi5lcnJvciwgXCJBbiBlcnJvciB3YXMgc3VwcHJlc3NlZCBkdXJpbmcgZGlzcG9zYWwuXCIpIDogZTtcbiAgICBlbnYuaGFzRXJyb3IgPSB0cnVlO1xuICB9XG4gIHZhciByLCBzID0gMDtcbiAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICB3aGlsZSAociA9IGVudi5zdGFjay5wb3AoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFyLmFzeW5jICYmIHMgPT09IDEpIHJldHVybiBzID0gMCwgZW52LnN0YWNrLnB1c2gociksIFByb21pc2UucmVzb2x2ZSgpLnRoZW4obmV4dCk7XG4gICAgICAgIGlmIChyLmRpc3Bvc2UpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gci5kaXNwb3NlLmNhbGwoci52YWx1ZSk7XG4gICAgICAgICAgaWYgKHIuYXN5bmMpIHJldHVybiBzIHw9IDIsIFByb21pc2UucmVzb2x2ZShyZXN1bHQpLnRoZW4obmV4dCwgZnVuY3Rpb24oZSkgeyBmYWlsKGUpOyByZXR1cm4gbmV4dCgpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHMgfD0gMTtcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGZhaWwoZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzID09PSAxKSByZXR1cm4gZW52Lmhhc0Vycm9yID8gUHJvbWlzZS5yZWplY3QoZW52LmVycm9yKSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIGlmIChlbnYuaGFzRXJyb3IpIHRocm93IGVudi5lcnJvcjtcbiAgfVxuICByZXR1cm4gbmV4dCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24ocGF0aCwgcHJlc2VydmVKc3gpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiICYmIC9eXFwuXFwuP1xcLy8udGVzdChwYXRoKSkge1xuICAgICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFwuKHRzeCkkfCgoPzpcXC5kKT8pKCg/OlxcLlteLi9dKz8pPylcXC4oW2NtXT8pdHMkL2ksIGZ1bmN0aW9uIChtLCB0c3gsIGQsIGV4dCwgY20pIHtcbiAgICAgICAgICByZXR1cm4gdHN4ID8gcHJlc2VydmVKc3ggPyBcIi5qc3hcIiA6IFwiLmpzXCIgOiBkICYmICghZXh0IHx8ICFjbSkgPyBtIDogKGQgKyBleHQgKyBcIi5cIiArIGNtLnRvTG93ZXJDYXNlKCkgKyBcImpzXCIpO1xuICAgICAgfSk7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgX19leHRlbmRzLFxuICBfX2Fzc2lnbixcbiAgX19yZXN0LFxuICBfX2RlY29yYXRlLFxuICBfX3BhcmFtLFxuICBfX2VzRGVjb3JhdGUsXG4gIF9fcnVuSW5pdGlhbGl6ZXJzLFxuICBfX3Byb3BLZXksXG4gIF9fc2V0RnVuY3Rpb25OYW1lLFxuICBfX21ldGFkYXRhLFxuICBfX2F3YWl0ZXIsXG4gIF9fZ2VuZXJhdG9yLFxuICBfX2NyZWF0ZUJpbmRpbmcsXG4gIF9fZXhwb3J0U3RhcixcbiAgX192YWx1ZXMsXG4gIF9fcmVhZCxcbiAgX19zcHJlYWQsXG4gIF9fc3ByZWFkQXJyYXlzLFxuICBfX3NwcmVhZEFycmF5LFxuICBfX2F3YWl0LFxuICBfX2FzeW5jR2VuZXJhdG9yLFxuICBfX2FzeW5jRGVsZWdhdG9yLFxuICBfX2FzeW5jVmFsdWVzLFxuICBfX21ha2VUZW1wbGF0ZU9iamVjdCxcbiAgX19pbXBvcnRTdGFyLFxuICBfX2ltcG9ydERlZmF1bHQsXG4gIF9fY2xhc3NQcml2YXRlRmllbGRHZXQsXG4gIF9fY2xhc3NQcml2YXRlRmllbGRTZXQsXG4gIF9fY2xhc3NQcml2YXRlRmllbGRJbixcbiAgX19hZGREaXNwb3NhYmxlUmVzb3VyY2UsXG4gIF9fZGlzcG9zZVJlc291cmNlcyxcbiAgX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24sXG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcbi8qKlxuICogQ3JlYXRlZCBieSBodXN0Y2Mgb24gMTgvNi85LlxuICogQ29udHJhY3Q6IGlAaHVzdC5jY1xuICovXG5cbnZhciBpZCA9IDE7XG5cbi8qKlxuICogZ2VuZXJhdGUgdW5pcXVlIGlkIGluIGFwcGxpY2F0aW9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbnZhciBfZGVmYXVsdCA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gX2RlZmF1bHQoKSB7XG4gIHJldHVybiBcIlwiLmNvbmNhdChpZCsrKTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcbi8qKlxuICogQ3JlYXRlZCBieSBodXN0Y2Mgb24gMTgvNi85LlxuICogQ29udHJhY3Q6IGlAaHVzdC5jY1xuICovXG52YXIgX2RlZmF1bHQgPSBleHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIF9kZWZhdWx0KGZuKSB7XG4gIHZhciBkZWxheSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogNjA7XG4gIHZhciB0aW1lciA9IG51bGw7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICB9LCBkZWxheSk7XG4gIH07XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5TaXplU2Vuc29ySWQgPSBleHBvcnRzLlNlbnNvclRhYkluZGV4ID0gZXhwb3J0cy5TZW5zb3JDbGFzc05hbWUgPSB2b2lkIDA7XG4vKipcbiAqIENyZWF0ZWQgYnkgaHVzdGNjIG9uIDE4LzYvOS5cbiAqIENvbnRyYWN0OiBpQGh1c3QuY2NcbiAqL1xuXG52YXIgU2l6ZVNlbnNvcklkID0gZXhwb3J0cy5TaXplU2Vuc29ySWQgPSAnc2l6ZS1zZW5zb3ItaWQnO1xudmFyIFNlbnNvckNsYXNzTmFtZSA9IGV4cG9ydHMuU2Vuc29yQ2xhc3NOYW1lID0gJ3NpemUtc2Vuc29yLW9iamVjdCc7XG52YXIgU2Vuc29yVGFiSW5kZXggPSBleHBvcnRzLlNlbnNvclRhYkluZGV4ID0gJy0xJzsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuY3JlYXRlU2Vuc29yID0gdm9pZCAwO1xudmFyIF9kZWJvdW5jZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4uL2RlYm91bmNlXCIpKTtcbnZhciBfY29uc3RhbnQgPSByZXF1aXJlKFwiLi4vY29uc3RhbnRcIik7XG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KGUpIHsgcmV0dXJuIGUgJiYgZS5fX2VzTW9kdWxlID8gZSA6IHsgXCJkZWZhdWx0XCI6IGUgfTsgfVxuLyoqXG4gKiBDcmVhdGVkIGJ5IGh1c3RjYyBvbiAxOC82LzkuXG4gKiBDb250cmFjdDogaUBodXN0LmNjXG4gKi9cblxudmFyIGNyZWF0ZVNlbnNvciA9IGV4cG9ydHMuY3JlYXRlU2Vuc29yID0gZnVuY3Rpb24gY3JlYXRlU2Vuc29yKGVsZW1lbnQsIHdoZW5EZXN0cm95KSB7XG4gIHZhciBzZW5zb3IgPSB1bmRlZmluZWQ7XG4gIC8vIGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5lcnMgPSBbXTtcblxuICAvKipcbiAgICogY3JlYXRlIG9iamVjdCBET00gb2Ygc2Vuc29yXG4gICAqIEByZXR1cm5zIHtIVE1MT2JqZWN0RWxlbWVudH1cbiAgICovXG4gIHZhciBuZXdTZW5zb3IgPSBmdW5jdGlvbiBuZXdTZW5zb3IoKSB7XG4gICAgLy8gYWRqdXN0IHN0eWxlXG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG4gICAgdmFyIG9iaiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29iamVjdCcpO1xuICAgIG9iai5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBvYmouY29udGVudERvY3VtZW50LmRlZmF1bHRWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZUxpc3RlbmVyKTtcbiAgICAgIC8vIOebtOaOpeinpuWPkeS4gOasoSByZXNpemVcbiAgICAgIHJlc2l6ZUxpc3RlbmVyKCk7XG4gICAgfTtcbiAgICBvYmouc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgb2JqLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBvYmouc3R5bGUudG9wID0gJzAnO1xuICAgIG9iai5zdHlsZS5sZWZ0ID0gJzAnO1xuICAgIG9iai5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgb2JqLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIG9iai5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgIG9iai5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgIG9iai5zdHlsZS56SW5kZXggPSAnLTEnO1xuICAgIG9iai5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgIG9iai5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgX2NvbnN0YW50LlNlbnNvckNsYXNzTmFtZSk7XG4gICAgb2JqLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCBfY29uc3RhbnQuU2Vuc29yVGFiSW5kZXgpO1xuICAgIG9iai50eXBlID0gJ3RleHQvaHRtbCc7XG5cbiAgICAvLyBhcHBlbmQgaW50byBkb21cbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKG9iaik7XG4gICAgLy8gZm9yIGllLCBzaG91bGQgc2V0IGRhdGEgYXR0cmlidXRlIGRlbGF5LCBvciB3aWxsIGJlIHdoaXRlIHNjcmVlblxuICAgIG9iai5kYXRhID0gJ2Fib3V0OmJsYW5rJztcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8qKlxuICAgKiB0cmlnZ2VyIGxpc3RlbmVyc1xuICAgKi9cbiAgdmFyIHJlc2l6ZUxpc3RlbmVyID0gKDAsIF9kZWJvdW5jZVtcImRlZmF1bHRcIl0pKGZ1bmN0aW9uICgpIHtcbiAgICAvLyB0cmlnZ2VyIGFsbCBsaXN0ZW5lclxuICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgbGlzdGVuZXIoZWxlbWVudCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBsaXN0ZW4gd2l0aCBvbmUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHBhcmFtIGNiXG4gICAqL1xuICB2YXIgYmluZCA9IGZ1bmN0aW9uIGJpbmQoY2IpIHtcbiAgICAvLyBpZiBub3QgZXhpc3Qgc2Vuc29yLCB0aGVuIGNyZWF0ZSBvbmVcbiAgICBpZiAoIXNlbnNvcikge1xuICAgICAgc2Vuc29yID0gbmV3U2Vuc29yKCk7XG4gICAgfVxuICAgIGlmIChsaXN0ZW5lcnMuaW5kZXhPZihjYikgPT09IC0xKSB7XG4gICAgICBsaXN0ZW5lcnMucHVzaChjYik7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBkZXN0cm95IGFsbFxuICAgKi9cbiAgdmFyIGRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmIChzZW5zb3IgJiYgc2Vuc29yLnBhcmVudE5vZGUpIHtcbiAgICAgIGlmIChzZW5zb3IuY29udGVudERvY3VtZW50KSB7XG4gICAgICAgIC8vIHJlbW90ZSBldmVudFxuICAgICAgICBzZW5zb3IuY29udGVudERvY3VtZW50LmRlZmF1bHRWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZUxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIC8vIHJlbW92ZSBkb21cbiAgICAgIHNlbnNvci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNlbnNvcik7XG4gICAgICAvLyBpbml0aWFsIHZhcmlhYmxlXG4gICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShfY29uc3RhbnQuU2l6ZVNlbnNvcklkKTtcbiAgICAgIHNlbnNvciA9IHVuZGVmaW5lZDtcbiAgICAgIGxpc3RlbmVycyA9IFtdO1xuICAgICAgd2hlbkRlc3Ryb3kgJiYgd2hlbkRlc3Ryb3koKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIGNhbmNlbCBsaXN0ZW5lciBiaW5kXG4gICAqIEBwYXJhbSBjYlxuICAgKi9cbiAgdmFyIHVuYmluZCA9IGZ1bmN0aW9uIHVuYmluZChjYikge1xuICAgIHZhciBpZHggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYik7XG4gICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgIGxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBubyBsaXN0ZW5lciwgYW5kIHNlbnNvciBpcyBleGlzdFxuICAgIC8vIHRoZW4gZGVzdHJveSB0aGUgc2Vuc29yXG4gICAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDAgJiYgc2Vuc29yKSB7XG4gICAgICBkZXN0cm95KCk7XG4gICAgfVxuICB9O1xuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgYmluZDogYmluZCxcbiAgICBkZXN0cm95OiBkZXN0cm95LFxuICAgIHVuYmluZDogdW5iaW5kXG4gIH07XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5jcmVhdGVTZW5zb3IgPSB2b2lkIDA7XG52YXIgX2NvbnN0YW50ID0gcmVxdWlyZShcIi4uL2NvbnN0YW50XCIpO1xudmFyIF9kZWJvdW5jZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4uL2RlYm91bmNlXCIpKTtcbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoZSkgeyByZXR1cm4gZSAmJiBlLl9fZXNNb2R1bGUgPyBlIDogeyBcImRlZmF1bHRcIjogZSB9OyB9XG4vKipcbiAqIENyZWF0ZWQgYnkgaHVzdGNjIG9uIDE4LzcvNS5cbiAqIENvbnRyYWN0OiBpQGh1c3QuY2NcbiAqL1xuXG52YXIgY3JlYXRlU2Vuc29yID0gZXhwb3J0cy5jcmVhdGVTZW5zb3IgPSBmdW5jdGlvbiBjcmVhdGVTZW5zb3IoZWxlbWVudCwgd2hlbkRlc3Ryb3kpIHtcbiAgdmFyIHNlbnNvciA9IHVuZGVmaW5lZDtcbiAgLy8gY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmVycyA9IFtdO1xuXG4gIC8qKlxuICAgKiB0cmlnZ2VyIGxpc3RlbmVyc1xuICAgKi9cbiAgdmFyIHJlc2l6ZUxpc3RlbmVyID0gKDAsIF9kZWJvdW5jZVtcImRlZmF1bHRcIl0pKGZ1bmN0aW9uICgpIHtcbiAgICAvLyB0cmlnZ2VyIGFsbFxuICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgbGlzdGVuZXIoZWxlbWVudCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBjcmVhdGUgUmVzaXplT2JzZXJ2ZXIgc2Vuc29yXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICB2YXIgbmV3U2Vuc29yID0gZnVuY3Rpb24gbmV3U2Vuc29yKCkge1xuICAgIHZhciBzID0gbmV3IFJlc2l6ZU9ic2VydmVyKHJlc2l6ZUxpc3RlbmVyKTtcbiAgICAvLyBsaXN0ZW4gZWxlbWVudFxuICAgIHMub2JzZXJ2ZShlbGVtZW50KTtcblxuICAgIC8vIHRyaWdnZXIgb25jZVxuICAgIHJlc2l6ZUxpc3RlbmVyKCk7XG4gICAgcmV0dXJuIHM7XG4gIH07XG5cbiAgLyoqXG4gICAqIGxpc3RlbiB3aXRoIGNhbGxiYWNrXG4gICAqIEBwYXJhbSBjYlxuICAgKi9cbiAgdmFyIGJpbmQgPSBmdW5jdGlvbiBiaW5kKGNiKSB7XG4gICAgaWYgKCFzZW5zb3IpIHtcbiAgICAgIHNlbnNvciA9IG5ld1NlbnNvcigpO1xuICAgIH1cbiAgICBpZiAobGlzdGVuZXJzLmluZGV4T2YoY2IpID09PSAtMSkge1xuICAgICAgbGlzdGVuZXJzLnB1c2goY2IpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogZGVzdHJveVxuICAgKi9cbiAgdmFyIGRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmIChzZW5zb3IpIHtcbiAgICAgIHNlbnNvci5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIGxpc3RlbmVycyA9IFtdO1xuICAgIHNlbnNvciA9IHVuZGVmaW5lZDtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShfY29uc3RhbnQuU2l6ZVNlbnNvcklkKTtcbiAgICB3aGVuRGVzdHJveSAmJiB3aGVuRGVzdHJveSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBjYW5jZWwgYmluZFxuICAgKiBAcGFyYW0gY2JcbiAgICovXG4gIHZhciB1bmJpbmQgPSBmdW5jdGlvbiB1bmJpbmQoY2IpIHtcbiAgICB2YXIgaWR4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2IpO1xuICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICBsaXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgfVxuXG4gICAgLy8gbm8gbGlzdGVuZXIsIGFuZCBzZW5zb3IgaXMgZXhpc3RcbiAgICAvLyB0aGVuIGRlc3Ryb3kgdGhlIHNlbnNvclxuICAgIGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAwICYmIHNlbnNvcikge1xuICAgICAgZGVzdHJveSgpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgIGJpbmQ6IGJpbmQsXG4gICAgZGVzdHJveTogZGVzdHJveSxcbiAgICB1bmJpbmQ6IHVuYmluZFxuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuY3JlYXRlU2Vuc29yID0gdm9pZCAwO1xudmFyIF9vYmplY3QgPSByZXF1aXJlKFwiLi9vYmplY3RcIik7XG52YXIgX3Jlc2l6ZU9ic2VydmVyID0gcmVxdWlyZShcIi4vcmVzaXplT2JzZXJ2ZXJcIik7XG4vKipcbiAqIENyZWF0ZWQgYnkgaHVzdGNjIG9uIDE4LzcvNS5cbiAqIENvbnRyYWN0OiBpQGh1c3QuY2NcbiAqL1xuXG4vKipcbiAqIHNlbnNvciBzdHJhdGVnaWVzXG4gKi9cbi8vIGV4cG9ydCBjb25zdCBjcmVhdGVTZW5zb3IgPSBjcmVhdGVPYmplY3RTZW5zb3I7XG52YXIgY3JlYXRlU2Vuc29yID0gZXhwb3J0cy5jcmVhdGVTZW5zb3IgPSB0eXBlb2YgUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnID8gX3Jlc2l6ZU9ic2VydmVyLmNyZWF0ZVNlbnNvciA6IF9vYmplY3QuY3JlYXRlU2Vuc29yOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5yZW1vdmVTZW5zb3IgPSBleHBvcnRzLmdldFNlbnNvciA9IGV4cG9ydHMuU2Vuc29ycyA9IHZvaWQgMDtcbnZhciBfaWQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2lkXCIpKTtcbnZhciBfc2Vuc29ycyA9IHJlcXVpcmUoXCIuL3NlbnNvcnNcIik7XG52YXIgX2NvbnN0YW50ID0gcmVxdWlyZShcIi4vY29uc3RhbnRcIik7XG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KGUpIHsgcmV0dXJuIGUgJiYgZS5fX2VzTW9kdWxlID8gZSA6IHsgXCJkZWZhdWx0XCI6IGUgfTsgfVxuLyoqXG4gKiBDcmVhdGVkIGJ5IGh1c3RjYyBvbiAxOC82LzkuXG4gKiBDb250cmFjdDogaUBodXN0LmNjXG4gKi9cblxuLyoqXG4gKiBhbGwgdGhlIHNlbnNvciBvYmplY3RzLlxuICogc2Vuc29yIHBvb2xcbiAqL1xudmFyIFNlbnNvcnMgPSBleHBvcnRzLlNlbnNvcnMgPSB7fTtcblxuLyoqXG4gKiBXaGVuIGRlc3Ryb3kgdGhlIHNlbnNvciwgcmVtb3ZlIGl0IGZyb20gdGhlIHBvb2xcbiAqL1xuZnVuY3Rpb24gY2xlYW4oc2Vuc29ySWQpIHtcbiAgLy8gZXhpc3QsIHRoZW4gcmVtb3ZlIGZyb20gcG9vbFxuICBpZiAoc2Vuc29ySWQgJiYgU2Vuc29yc1tzZW5zb3JJZF0pIHtcbiAgICBkZWxldGUgU2Vuc29yc1tzZW5zb3JJZF07XG4gIH1cbn1cblxuLyoqXG4gKiBnZXQgb25lIHNlbnNvclxuICogQHBhcmFtIGVsZW1lbnRcbiAqIEByZXR1cm5zIHsqfVxuICovXG52YXIgZ2V0U2Vuc29yID0gZXhwb3J0cy5nZXRTZW5zb3IgPSBmdW5jdGlvbiBnZXRTZW5zb3IoZWxlbWVudCkge1xuICB2YXIgc2Vuc29ySWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShfY29uc3RhbnQuU2l6ZVNlbnNvcklkKTtcblxuICAvLyAxLiBpZiB0aGUgc2Vuc29yIGV4aXN0cywgdGhlbiB1c2UgaXRcbiAgaWYgKHNlbnNvcklkICYmIFNlbnNvcnNbc2Vuc29ySWRdKSB7XG4gICAgcmV0dXJuIFNlbnNvcnNbc2Vuc29ySWRdO1xuICB9XG5cbiAgLy8gMi4gbm90IGV4aXN0LCB0aGVuIGNyZWF0ZSBvbmVcbiAgdmFyIG5ld0lkID0gKDAsIF9pZFtcImRlZmF1bHRcIl0pKCk7XG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKF9jb25zdGFudC5TaXplU2Vuc29ySWQsIG5ld0lkKTtcbiAgdmFyIHNlbnNvciA9ICgwLCBfc2Vuc29ycy5jcmVhdGVTZW5zb3IpKGVsZW1lbnQsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2xlYW4obmV3SWQpO1xuICB9KTtcbiAgLy8gYWRkIHNlbnNvciBpbnRvIHBvb2xcbiAgU2Vuc29yc1tuZXdJZF0gPSBzZW5zb3I7XG4gIHJldHVybiBzZW5zb3I7XG59O1xuXG4vKipcbiAqIOenu+mZpCBzZW5zb3JcbiAqIEBwYXJhbSBzZW5zb3JcbiAqL1xudmFyIHJlbW92ZVNlbnNvciA9IGV4cG9ydHMucmVtb3ZlU2Vuc29yID0gZnVuY3Rpb24gcmVtb3ZlU2Vuc29yKHNlbnNvcikge1xuICB2YXIgc2Vuc29ySWQgPSBzZW5zb3IuZWxlbWVudC5nZXRBdHRyaWJ1dGUoX2NvbnN0YW50LlNpemVTZW5zb3JJZCk7XG4gIC8vIHJlbW92ZSBldmVudCwgZG9tIG9mIHRoZSBzZW5zb3IgdXNlZFxuICBzZW5zb3IuZGVzdHJveSgpO1xuICBjbGVhbihzZW5zb3JJZCk7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy52ZXIgPSBleHBvcnRzLmNsZWFyID0gZXhwb3J0cy5iaW5kID0gdm9pZCAwO1xudmFyIF9zZW5zb3JQb29sID0gcmVxdWlyZShcIi4vc2Vuc29yUG9vbFwiKTtcbi8qKlxuICogQ3JlYXRlZCBieSBodXN0Y2Mgb24gMTgvNi85Llvpq5jogIPml7bpl7RdXG4gKiBDb250cmFjdDogaUBodXN0LmNjXG4gKi9cblxuLyoqXG4gKiBiaW5kIGFuIGVsZW1lbnQgd2l0aCByZXNpemUgY2FsbGJhY2sgZnVuY3Rpb25cbiAqIEBwYXJhbSB7Kn0gZWxlbWVudFxuICogQHBhcmFtIHsqfSBjYlxuICovXG52YXIgYmluZCA9IGV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uIGJpbmQoZWxlbWVudCwgY2IpIHtcbiAgdmFyIHNlbnNvciA9ICgwLCBfc2Vuc29yUG9vbC5nZXRTZW5zb3IpKGVsZW1lbnQpO1xuXG4gIC8vIGxpc3RlbiB3aXRoIGNhbGxiYWNrXG4gIHNlbnNvci5iaW5kKGNiKTtcblxuICAvLyByZXR1cm4gdW5iaW5kIGZ1bmN0aW9uXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgc2Vuc29yLnVuYmluZChjYik7XG4gIH07XG59O1xuXG4vKipcbiAqIGNsZWFyIGFsbCB0aGUgbGlzdGVuZXIgYW5kIHNlbnNvciBvZiBhbiBlbGVtZW50XG4gKiBAcGFyYW0gZWxlbWVudFxuICovXG52YXIgY2xlYXIgPSBleHBvcnRzLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoZWxlbWVudCkge1xuICB2YXIgc2Vuc29yID0gKDAsIF9zZW5zb3JQb29sLmdldFNlbnNvcikoZWxlbWVudCk7XG4gICgwLCBfc2Vuc29yUG9vbC5yZW1vdmVTZW5zb3IpKHNlbnNvcik7XG59O1xudmFyIHZlciA9IGV4cG9ydHMudmVyID0gXCIxLjAuM1wiOyIsIi8qKlxuICog5L+d55WZIG9iamVjdCDkuK3nmoTpg6jliIblhoXlrrlcbiAqIEBwYXJhbSBvYmpcbiAqIEBwYXJhbSBrZXlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaWNrKG9iaiwga2V5cykge1xuICAgIHZhciByID0ge307XG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcltrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIHI7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrLmpzLm1hcCIsImV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy1mdW5jdGlvbi5qcy5tYXAiLCJleHBvcnQgZnVuY3Rpb24gaXNTdHJpbmcodikge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gJ3N0cmluZyc7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy1zdHJpbmcuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBkbyBub3QgZWRpdCAuanMgZmlsZXMgZGlyZWN0bHkgLSBlZGl0IHNyYy9pbmRleC5qc3RcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXF1YWwoYSwgYikge1xuICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGEgJiYgYiAmJiB0eXBlb2YgYSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PSAnb2JqZWN0Jykge1xuICAgIGlmIChhLmNvbnN0cnVjdG9yICE9PSBiLmNvbnN0cnVjdG9yKSByZXR1cm4gZmFsc2U7XG5cbiAgICB2YXIgbGVuZ3RoLCBpLCBrZXlzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggIT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tICE9PSAwOylcbiAgICAgICAgaWYgKCFlcXVhbChhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG5cblxuICAgIGlmIChhLmNvbnN0cnVjdG9yID09PSBSZWdFeHApIHJldHVybiBhLnNvdXJjZSA9PT0gYi5zb3VyY2UgJiYgYS5mbGFncyA9PT0gYi5mbGFncztcbiAgICBpZiAoYS52YWx1ZU9mICE9PSBPYmplY3QucHJvdG90eXBlLnZhbHVlT2YpIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gICAgaWYgKGEudG9TdHJpbmcgIT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpIHJldHVybiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKTtcblxuICAgIGtleXMgPSBPYmplY3Qua2V5cyhhKTtcbiAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tICE9PSAwOylcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleXNbaV0pKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSAhPT0gMDspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuXG4gICAgICBpZiAoIWVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gdHJ1ZSBpZiBib3RoIE5hTiwgZmFsc2Ugb3RoZXJ3aXNlXG4gIHJldHVybiBhIT09YSAmJiBiIT09Yjtcbn07XG4iLCJpbXBvcnQgaXNFcXVhbCBmcm9tICdmYXN0LWRlZXAtZXF1YWwnO1xuZXhwb3J0IHsgaXNFcXVhbCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXMtZXF1YWwuanMubWFwIiwiaW1wb3J0IHsgX19hc3NpZ24sIF9fYXdhaXRlciwgX19leHRlbmRzLCBfX2dlbmVyYXRvciwgX19yZXN0IH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgUmVhY3QsIHsgUHVyZUNvbXBvbmVudCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGJpbmQsIGNsZWFyIH0gZnJvbSAnc2l6ZS1zZW5zb3InO1xuaW1wb3J0IHsgcGljayB9IGZyb20gJy4vaGVscGVyL3BpY2snO1xuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gJy4vaGVscGVyL2lzLWZ1bmN0aW9uJztcbmltcG9ydCB7IGlzU3RyaW5nIH0gZnJvbSAnLi9oZWxwZXIvaXMtc3RyaW5nJztcbmltcG9ydCB7IGlzRXF1YWwgfSBmcm9tICcuL2hlbHBlci9pcy1lcXVhbCc7XG4vKipcbiAqIGNvcmUgY29tcG9uZW50IGZvciBlY2hhcnRzIGJpbmRpbmdcbiAqL1xudmFyIEVDaGFydHNSZWFjdENvcmUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEVDaGFydHNSZWFjdENvcmUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRUNoYXJ0c1JlYWN0Q29yZShwcm9wcykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBwcm9wcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZWNoYXJ0cyA9IHByb3BzLmVjaGFydHM7XG4gICAgICAgIF90aGlzLmVsZSA9IG51bGw7XG4gICAgICAgIF90aGlzLmlzSW5pdGlhbFJlc2l6ZSA9IHRydWU7XG4gICAgICAgIF90aGlzLmV2ZW50SGFuZGxlclJlZnMgPSB7fTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5jb21wb25lbnREaWRNb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJOZXdFY2hhcnRzKCk7XG4gICAgfTtcbiAgICAvLyB1cGRhdGVcbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5jb21wb25lbnREaWRVcGRhdGUgPSBmdW5jdGlvbiAocHJldlByb3BzKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBpZiBzaG91bGRTZXRPcHRpb24gcmV0dXJuIGZhbHNlLCB0aGVuIHJldHVybiwgbm90IHVwZGF0ZSBlY2hhcnRzIG9wdGlvbnNcbiAgICAgICAgICogZGVmYXVsdCBpcyB0cnVlXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc2hvdWxkU2V0T3B0aW9uID0gdGhpcy5wcm9wcy5zaG91bGRTZXRPcHRpb247XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNob3VsZFNldE9wdGlvbikgJiYgIXNob3VsZFNldE9wdGlvbihwcmV2UHJvcHMsIHRoaXMucHJvcHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5Lul5LiL5bGe5oCn5L+u5pS555qE5pe25YCZ77yM6ZyA6KaBIGRpc3Bvc2Ug5LmL5ZCO5YaN5paw5bu6XG4gICAgICAgIC8vIDEuIOWIh+aNoiB0aGVtZSDnmoTml7blgJlcbiAgICAgICAgLy8gMi4g5L+u5pS5IG9wdHMg55qE5pe25YCZXG4gICAgICAgIGlmICghaXNFcXVhbChwcmV2UHJvcHMudGhlbWUsIHRoaXMucHJvcHMudGhlbWUpIHx8ICFpc0VxdWFsKHByZXZQcm9wcy5vcHRzLCB0aGlzLnByb3BzLm9wdHMpKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTmV3RWNoYXJ0cygpOyAvLyDph43lu7pcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDkv67mlLkgb25FdmVudCDnmoTml7blgJnlhYjnp7vpmaTljoblj7Lkuovku7blho3mt7vliqBcbiAgICAgICAgdmFyIGVjaGFydHNJbnN0YW5jZSA9IHRoaXMuZ2V0RWNoYXJ0c0luc3RhbmNlKCk7XG4gICAgICAgIGlmICghaXNFcXVhbChwcmV2UHJvcHMub25FdmVudHMsIHRoaXMucHJvcHMub25FdmVudHMpKSB7XG4gICAgICAgICAgICB0aGlzLnVuYmluZEV2ZW50cyhlY2hhcnRzSW5zdGFuY2UpO1xuICAgICAgICAgICAgdGhpcy5iaW5kRXZlbnRzKGVjaGFydHNJbnN0YW5jZSwgdGhpcy5wcm9wcy5vbkV2ZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gd2hlbiB0aGVzZSBwcm9wcyBhcmUgbm90IGlzRXF1YWwsIHVwZGF0ZSBlY2hhcnRzXG4gICAgICAgIHZhciBwaWNrS2V5cyA9IFsnb3B0aW9uJywgJ25vdE1lcmdlJywgJ3JlcGxhY2VNZXJnZScsICdsYXp5VXBkYXRlJywgJ3Nob3dMb2FkaW5nJywgJ2xvYWRpbmdPcHRpb24nXTtcbiAgICAgICAgaWYgKCFpc0VxdWFsKHBpY2sodGhpcy5wcm9wcywgcGlja0tleXMpLCBwaWNrKHByZXZQcm9wcywgcGlja0tleXMpKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFQ2hhcnRzT3B0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHdoZW4gc3R5bGUgb3IgY2xhc3MgbmFtZSB1cGRhdGVkLCBjaGFuZ2Ugc2l6ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlmICghaXNFcXVhbChwcmV2UHJvcHMuc3R5bGUsIHRoaXMucHJvcHMuc3R5bGUpIHx8ICFpc0VxdWFsKHByZXZQcm9wcy5jbGFzc05hbWUsIHRoaXMucHJvcHMuY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRUNoYXJ0c1JlYWN0Q29yZS5wcm90b3R5cGUuY29tcG9uZW50V2lsbFVubW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgIH07XG4gICAgLypcbiAgICAgKiBpbml0aWFsaXNlIGFuIGVjaGFydHMgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5pbml0RWNoYXJ0c0luc3RhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHRlbXBvcmFyeSBlY2hhcnQgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmVjaGFydHMuaW5pdChfdGhpcy5lbGUsIF90aGlzLnByb3BzLnRoZW1lLCBfdGhpcy5wcm9wcy5vcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlY2hhcnRzSW5zdGFuY2UgPSBfdGhpcy5nZXRFY2hhcnRzSW5zdGFuY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVjaGFydHNJbnN0YW5jZS5vbignZmluaXNoZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGZpbmFsIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBfdGhpcy5lbGUuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IF90aGlzLmVsZS5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlzcG9zZSB0ZW1wb3JhcnkgZWNoYXJ0IGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZWNoYXJ0cy5kaXNwb3NlKF90aGlzLmVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjcmVhdGUgZWNoYXJ0IGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UgdXNlIGZpbmFsIHdpZHRoIGFuZCBoZWlnaHQgb25seSBpZiBub3Qgb3JpZ2luYWxseSBwcm92aWRlZCBhcyBvcHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9wdHMgPSBfX2Fzc2lnbih7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSwgX3RoaXMucHJvcHMub3B0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShfdGhpcy5lY2hhcnRzLmluaXQoX3RoaXMuZWxlLCBfdGhpcy5wcm9wcy50aGVtZSwgb3B0cykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgZXhpc3RpbmcgZWNoYXJ0IG9iamVjdFxuICAgICAqL1xuICAgIEVDaGFydHNSZWFjdENvcmUucHJvdG90eXBlLmdldEVjaGFydHNJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWNoYXJ0cy5nZXRJbnN0YW5jZUJ5RG9tKHRoaXMuZWxlKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIGRpc3Bvc2UgZWNoYXJ0cyBhbmQgY2xlYXIgc2l6ZS1zZW5zb3JcbiAgICAgKi9cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5lbGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2xlYXIodGhpcy5lbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkaXNwb3NlIGVjaGFydHMgaW5zdGFuY2VcbiAgICAgICAgICAgIHRoaXMuZWNoYXJ0cy5kaXNwb3NlKHRoaXMuZWxlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogcmVuZGVyIGEgbmV3IGVjaGFydHMgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5yZW5kZXJOZXdFY2hhcnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX2EsIG9uRXZlbnRzLCBvbkNoYXJ0UmVhZHksIF9iLCBhdXRvUmVzaXplLCBlY2hhcnRzSW5zdGFuY2U7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoX2MubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgX2EgPSB0aGlzLnByb3BzLCBvbkV2ZW50cyA9IF9hLm9uRXZlbnRzLCBvbkNoYXJ0UmVhZHkgPSBfYS5vbkNoYXJ0UmVhZHksIF9iID0gX2EuYXV0b1Jlc2l6ZSwgYXV0b1Jlc2l6ZSA9IF9iID09PSB2b2lkIDAgPyB0cnVlIDogX2I7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAxLiBpbml0IGVjaGFydHMgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbNCAvKnlpZWxkKi8sIHRoaXMuaW5pdEVjaGFydHNJbnN0YW5jZSgpXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gMS4gaW5pdCBlY2hhcnRzIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBfYy5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlY2hhcnRzSW5zdGFuY2UgPSB0aGlzLnVwZGF0ZUVDaGFydHNPcHRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDMuIGJpbmQgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRFdmVudHMoZWNoYXJ0c0luc3RhbmNlLCBvbkV2ZW50cyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyA0LiBvbiBjaGFydCByZWFkeVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ob25DaGFydFJlYWR5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYXJ0UmVhZHkoZWNoYXJ0c0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDUuIG9uIHJlc2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlICYmIGF1dG9SZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5kKHRoaXMuZWxlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlc2l6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIGJpbmQgdGhlIGV2ZW50c1xuICAgIEVDaGFydHNSZWFjdENvcmUucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIGV2ZW50cykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgX2JpbmRFdmVudCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZSB0aGUgZXZlbnQgY29uZmlnIHdoaWNoIG5vdCBzYXRpc2Z5XG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoZXZlbnROYW1lKSAmJiBpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgICAgICAgICAgLy8gYmluZGluZyBldmVudFxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmMocGFyYW0sIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLm9uKGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgY3VycmVudGx5IGJvdW5kIGV2ZW50IGhhbmRsZXJzLiBUaGlzIHdheSB3ZSBjYW4gdW5iaW5kIHRoZW1cbiAgICAgICAgICAgICAgICAvLyBvbiBuZXh0IGNvbXBvbmVudCB1cGRhdGUsIGJlZm9yZSBiaW5kaW5nIHRoZSBuZXcgaGFuZGxlcnMuXG4gICAgICAgICAgICAgICAgX3RoaXMuZXZlbnRIYW5kbGVyUmVmc1tldmVudE5hbWVdID0gaGFuZGxlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gbG9vcCBhbmQgYmluZFxuICAgICAgICBmb3IgKHZhciBldmVudE5hbWUgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV2ZW50cywgZXZlbnROYW1lKSkge1xuICAgICAgICAgICAgICAgIF9iaW5kRXZlbnQoZXZlbnROYW1lLCBldmVudHNbZXZlbnROYW1lXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVuYmluZCBhbGwgY3VycmVudGx5IGJvdW5kIGV2ZW50IGhhbmRsZXJzLiBJbXBvcnRhbnRseSwgdGhpcyBkb2VzIG5vdFxuICAgICAqIHVuYmluZCB0aGUgYFwiZmluaXNoZWRcImAgZXZlbnQgdGhhdCBpcyB1c2VkIGZvciBjaGFydCBpbml0aWFsaXphdGlvbi5cbiAgICAgKi9cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS51bmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZXZlbnRIYW5kbGVyUmVmcyk7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgX2IgPSBfYVtfaV0sIGV2ZW50TmFtZSA9IF9iWzBdLCBsaXN0ZW5lciA9IF9iWzFdO1xuICAgICAgICAgICAgaW5zdGFuY2Uub2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyUmVmcyA9IHt9O1xuICAgIH07XG4gICAgLyoqXG4gICAgICogcmVuZGVyIHRoZSBlY2hhcnRzXG4gICAgICovXG4gICAgRUNoYXJ0c1JlYWN0Q29yZS5wcm90b3R5cGUudXBkYXRlRUNoYXJ0c09wdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF9hID0gdGhpcy5wcm9wcywgb3B0aW9uID0gX2Eub3B0aW9uLCBfYiA9IF9hLm5vdE1lcmdlLCBub3RNZXJnZSA9IF9iID09PSB2b2lkIDAgPyBmYWxzZSA6IF9iLCBfYyA9IF9hLnJlcGxhY2VNZXJnZSwgcmVwbGFjZU1lcmdlID0gX2MgPT09IHZvaWQgMCA/IG51bGwgOiBfYywgX2QgPSBfYS5sYXp5VXBkYXRlLCBsYXp5VXBkYXRlID0gX2QgPT09IHZvaWQgMCA/IGZhbHNlIDogX2QsIHNob3dMb2FkaW5nID0gX2Euc2hvd0xvYWRpbmcsIF9lID0gX2EubG9hZGluZ09wdGlvbiwgbG9hZGluZ09wdGlvbiA9IF9lID09PSB2b2lkIDAgPyBudWxsIDogX2U7XG4gICAgICAgIC8vIDEuIGdldCBvciBpbml0aWFsIHRoZSBlY2hhcnRzIG9iamVjdFxuICAgICAgICB2YXIgZWNoYXJ0SW5zdGFuY2UgPSB0aGlzLmdldEVjaGFydHNJbnN0YW5jZSgpO1xuICAgICAgICAvLyAyLiBzZXQgdGhlIGVjaGFydHMgb3B0aW9uXG4gICAgICAgIGVjaGFydEluc3RhbmNlLnNldE9wdGlvbihvcHRpb24sIHsgbm90TWVyZ2U6IG5vdE1lcmdlLCByZXBsYWNlTWVyZ2U6IHJlcGxhY2VNZXJnZSwgbGF6eVVwZGF0ZTogbGF6eVVwZGF0ZSB9KTtcbiAgICAgICAgLy8gMy4gc2V0IGxvYWRpbmcgbWFza1xuICAgICAgICBpZiAoc2hvd0xvYWRpbmcpXG4gICAgICAgICAgICBlY2hhcnRJbnN0YW5jZS5zaG93TG9hZGluZyhsb2FkaW5nT3B0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZWNoYXJ0SW5zdGFuY2UuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgcmV0dXJuIGVjaGFydEluc3RhbmNlO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogcmVzaXplIHdyYXBwZXJcbiAgICAgKi9cbiAgICBFQ2hhcnRzUmVhY3RDb3JlLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIDEuIGdldCB0aGUgZWNoYXJ0cyBvYmplY3RcbiAgICAgICAgdmFyIGVjaGFydHNJbnN0YW5jZSA9IHRoaXMuZ2V0RWNoYXJ0c0luc3RhbmNlKCk7XG4gICAgICAgIC8vIDIuIGNhbGwgZWNoYXJ0cyBpbnN0YW5jZSByZXNpemUgaWYgbm90IHRoZSBpbml0aWFsIHJlc2l6ZVxuICAgICAgICAvLyByZXNpemUgc2hvdWxkIG5vdCBoYXBwZW4gb24gZmlyc3QgcmVuZGVyIGFzIGl0IHdpbGwgY2FuY2VsIGluaXRpYWwgZWNoYXJ0cyBhbmltYXRpb25zXG4gICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxSZXNpemUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZWNoYXJ0c0luc3RhbmNlLnJlc2l6ZSh7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4gdXBkYXRlIHZhcmlhYmxlIGZvciBmdXR1cmUgY2FsbHNcbiAgICAgICAgdGhpcy5pc0luaXRpYWxSZXNpemUgPSBmYWxzZTtcbiAgICB9O1xuICAgIEVDaGFydHNSZWFjdENvcmUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIF9hID0gdGhpcy5wcm9wcywgc3R5bGUgPSBfYS5zdHlsZSwgX2IgPSBfYS5jbGFzc05hbWUsIGNsYXNzTmFtZSA9IF9iID09PSB2b2lkIDAgPyAnJyA6IF9iLCBlY2hhcnRzID0gX2EuZWNoYXJ0cywgb3B0aW9uID0gX2Eub3B0aW9uLCB0aGVtZSA9IF9hLnRoZW1lLCBub3RNZXJnZSA9IF9hLm5vdE1lcmdlLCByZXBsYWNlTWVyZ2UgPSBfYS5yZXBsYWNlTWVyZ2UsIGxhenlVcGRhdGUgPSBfYS5sYXp5VXBkYXRlLCBzaG93TG9hZGluZyA9IF9hLnNob3dMb2FkaW5nLCBsb2FkaW5nT3B0aW9uID0gX2EubG9hZGluZ09wdGlvbiwgb3B0cyA9IF9hLm9wdHMsIG9uQ2hhcnRSZWFkeSA9IF9hLm9uQ2hhcnRSZWFkeSwgb25FdmVudHMgPSBfYS5vbkV2ZW50cywgc2hvdWxkU2V0T3B0aW9uID0gX2Euc2hvdWxkU2V0T3B0aW9uLCBhdXRvUmVzaXplID0gX2EuYXV0b1Jlc2l6ZSwgZGl2SFRNTEF0dHJpYnV0ZXMgPSBfX3Jlc3QoX2EsIFtcInN0eWxlXCIsIFwiY2xhc3NOYW1lXCIsIFwiZWNoYXJ0c1wiLCBcIm9wdGlvblwiLCBcInRoZW1lXCIsIFwibm90TWVyZ2VcIiwgXCJyZXBsYWNlTWVyZ2VcIiwgXCJsYXp5VXBkYXRlXCIsIFwic2hvd0xvYWRpbmdcIiwgXCJsb2FkaW5nT3B0aW9uXCIsIFwib3B0c1wiLCBcIm9uQ2hhcnRSZWFkeVwiLCBcIm9uRXZlbnRzXCIsIFwic2hvdWxkU2V0T3B0aW9uXCIsIFwiYXV0b1Jlc2l6ZVwiXSk7XG4gICAgICAgIC8vIGRlZmF1bHQgaGVpZ2h0ID0gMzAwXG4gICAgICAgIHZhciBuZXdTdHlsZSA9IF9fYXNzaWduKHsgaGVpZ2h0OiAzMDAgfSwgc3R5bGUpO1xuICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgX19hc3NpZ24oeyByZWY6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZWxlID0gZTtcbiAgICAgICAgICAgIH0sIHN0eWxlOiBuZXdTdHlsZSwgY2xhc3NOYW1lOiBcImVjaGFydHMtZm9yLXJlYWN0IFwiLmNvbmNhdChjbGFzc05hbWUpIH0sIGRpdkhUTUxBdHRyaWJ1dGVzKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIEVDaGFydHNSZWFjdENvcmU7XG59KFB1cmVDb21wb25lbnQpKTtcbmV4cG9ydCBkZWZhdWx0IEVDaGFydHNSZWFjdENvcmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb3JlLmpzLm1hcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsSUFBSSxnQkFBZ0IsU0FBUyxHQUFHLEdBQUc7Q0FDakMsZ0JBQWdCLE9BQU8sa0JBQ2xCLEVBQUUsV0FBVyxDQUFDLEVBQUUsYUFBYSxTQUFTLFNBQVUsR0FBRyxHQUFHO0VBQUUsRUFBRSxZQUFZO0NBQUcsS0FDMUUsU0FBVSxHQUFHLEdBQUc7RUFBRSxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksT0FBTyxVQUFVLGVBQWUsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRTtDQUFJO0NBQ3BHLE9BQU8sY0FBYyxHQUFHLENBQUM7QUFDM0I7QUFFQSxTQUFnQixVQUFVLEdBQUcsR0FBRztDQUM5QixJQUFJLE9BQU8sTUFBTSxjQUFjLE1BQU0sTUFDakMsTUFBTSxJQUFJLFVBQVUseUJBQXlCLE9BQU8sQ0FBQyxJQUFJLCtCQUErQjtDQUM1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SUFBSSxPQUFPLElBQUksS0FBSyxHQUFHLFlBQVksYUFBYSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksY0FBYyxHQUFHLGFBQWEsS0FBSyxHQUFHLGVBQWUsZ0JBQWdCLE9BQU8sS0FBSyxJQUFJLE9BQU87RUFFM1QsSUFBSSxpQkFBaUIsS0FBSyxtQkFBbUI7RUFFN0MsZUFBZSxVQUFVLFFBQVE7R0FBWTtHQUF3QjtHQUEwQjtFQUFXLENBQUM7RUFFM0csSUFBSSxhQUNBLGVBQWUsWUFBWSxhQUFhO09BRXhDLGVBQWUsWUFBWTtFQUMvQixPQUFPO0NBQ1g7Ozs7Q0FJQSxpQkFBaUIsVUFBVSxTQUFTLFdBQVk7RUFFNUMsSUFBSSxrQkFBa0IsS0FBSyxtQkFBbUI7RUFHOUMsSUFBSSxDQUFDLEtBQUssaUJBQ04sSUFBSTtHQUNBLGdCQUFnQixPQUFPO0lBQ25CLE9BQU87SUFDUCxRQUFRO0dBQ1osQ0FBQztFQUNMLFNBQ08sR0FBRztHQUNOLFFBQVEsS0FBSyxDQUFDO0VBQ2xCO0VBR0osS0FBSyxrQkFBa0I7Q0FDM0I7Q0FDQSxpQkFBaUIsVUFBVSxTQUFTLFdBQVk7RUFDNUMsSUFBSSxRQUFRLE1BQ1IsS0FBSyxLQUFLLE9BQU8sUUFBUSxHQUFHLE9BQU8sS0FBSyxHQUFHLFdBQVcsWUFBWSxPQUFPLEtBQUssSUFBSSxLQUFLO0VBQWMsR0FBRztFQUFrQixHQUFHO0VBQWdCLEdBQUc7RUFBa0IsR0FBRztFQUF5QixHQUFHO0VBQTJCLEdBQUc7RUFBMEIsR0FBRztFQUE2QixHQUFHO0VBQXNCLEdBQUc7RUFBcUIsR0FBRztFQUF5QixHQUFHO0VBQTRCLEdBQUc7RUFBOEIsR0FBRztFQUE3YSxJQUF5YixvQkFBb0IsT0FBTyxJQUFJO0dBQUM7R0FBUztHQUFhO0dBQVc7R0FBVTtHQUFTO0dBQVk7R0FBZ0I7R0FBYztHQUFlO0dBQWlCO0dBQVE7R0FBZ0I7R0FBWTtHQUFtQjtFQUFZLENBQUM7RUFFM3BCLElBQUksV0FBVyxTQUFTLEVBQUUsUUFBUSxJQUFJLEdBQUcsS0FBSztFQUM5QyxPQUFBLGFBQWMsY0FBYyxPQUFPLFNBQVM7R0FBRSxLQUFLLFNBQVUsR0FBRztJQUN4RCxNQUFNLE1BQU07R0FDaEI7R0FBRyxPQUFPO0dBQVUsV0FBVyxxQkFBcUIsT0FBTyxTQUFTO0VBQUUsR0FBRyxpQkFBaUIsQ0FBQztDQUNuRztDQUNBLE9BQU87QUFDWCxFQUFFQyxhQUFBQSxhQUFhIiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTRdfQ==