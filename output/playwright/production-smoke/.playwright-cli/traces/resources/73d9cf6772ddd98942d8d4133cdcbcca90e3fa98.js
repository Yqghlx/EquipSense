import { i as __toESM } from "/node_modules/.vite/deps/rolldown-runtime-B-lAHAz2.js?v=1d2f6f90";
import { t as require_react } from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
//#region node_modules/react-hook-form/dist/index.esm.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var isCheckBoxInput = (element) => element.type === "checkbox";
var isDateObject = (value) => value instanceof Date;
var isNullOrUndefined = (value) => value == null;
var isObjectType = (value) => typeof value === "object";
var isObject = (value) => !isNullOrUndefined(value) && !Array.isArray(value) && isObjectType(value) && !isDateObject(value);
var getEventValue = (event) => isObject(event) && event.target ? isCheckBoxInput(event.target) ? event.target.checked : event.target.value : event;
var isNameInFieldArray = (names, name) => name.split(".").some((part, index, arr) => !isNaN(Number(part)) && names.has(arr.slice(0, index).join(".")));
var isPlainObject = (tempObject) => {
	const prototypeCopy = tempObject.constructor && tempObject.constructor.prototype;
	return isObject(prototypeCopy) && prototypeCopy.hasOwnProperty("isPrototypeOf");
};
var isWeb = typeof window !== "undefined" && typeof window.HTMLElement !== "undefined" && typeof document !== "undefined";
function cloneObject(data) {
	if (data instanceof Date) return new Date(data);
	const isFileListInstance = typeof FileList !== "undefined" && data instanceof FileList;
	if (isWeb && (data instanceof Blob || isFileListInstance)) return data;
	const isArray = Array.isArray(data);
	if (!isArray && !(isObject(data) && isPlainObject(data))) return data;
	const copy = isArray ? [] : Object.create(Object.getPrototypeOf(data));
	for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) copy[key] = cloneObject(data[key]);
	return copy;
}
var EVENTS = {
	BLUR: "blur",
	FOCUS_OUT: "focusout",
	CHANGE: "change",
	SUBMIT: "submit",
	TRIGGER: "trigger",
	VALID: "valid"
};
var VALIDATION_MODE = {
	onBlur: "onBlur",
	onChange: "onChange",
	onSubmit: "onSubmit",
	onTouched: "onTouched",
	all: "all"
};
var INPUT_VALIDATION_RULES = {
	max: "max",
	min: "min",
	maxLength: "maxLength",
	minLength: "minLength",
	pattern: "pattern",
	required: "required",
	validate: "validate"
};
var FORM_ERROR_TYPE = "form";
var ROOT_ERROR_TYPE = "root";
var PROTOTYPE_KEYWORDS = [
	"__proto__",
	"constructor",
	"prototype"
];
var isKey = (value) => /^\w*$/.test(value);
var isUndefined = (val) => val === void 0;
var stringToPath = (input) => input.split(/[.[\]'"]/g).filter(Boolean);
var get = (object, path, defaultValue) => {
	if (!path || !isObject(object)) return defaultValue;
	const paths = isKey(path) ? [path] : stringToPath(path);
	if (paths.some((key) => PROTOTYPE_KEYWORDS.includes(key))) return defaultValue;
	const result = paths.reduce((result, key) => {
		return isNullOrUndefined(result) ? void 0 : result[key];
	}, object);
	return isUndefined(result) || result === object ? isUndefined(object[path]) ? defaultValue : object[path] : result;
};
var isBoolean = (value) => typeof value === "boolean";
var isFunction = (value) => typeof value === "function";
var set = (object, path, value) => {
	let index = -1;
	const tempPath = isKey(path) ? [path] : stringToPath(path);
	const length = tempPath.length;
	const lastIndex = length - 1;
	while (++index < length) {
		const key = tempPath[index];
		let newValue = value;
		if (index !== lastIndex) {
			const objValue = object[key];
			newValue = isObject(objValue) || Array.isArray(objValue) ? objValue : !isNaN(+tempPath[index + 1]) ? [] : {};
		}
		if (PROTOTYPE_KEYWORDS.includes(key)) return;
		object[key] = newValue;
		object = object[key];
	}
};
/**
* Separate context for `control` to prevent unnecessary rerenders.
* Internal hooks that only need control use this instead of full form context.
*/
var HookFormControlContext = import_react.createContext(null);
HookFormControlContext.displayName = "HookFormControlContext";
/**
* @internal Internal hook to access only control from context.
*/
var useFormControlContext = () => import_react.useContext(HookFormControlContext);
var getProxyFormState = (formState, control, localProxyFormState, isRoot = true) => {
	const result = {};
	for (const key in formState) Object.defineProperty(result, key, { get: () => {
		const _key = key;
		if (control._proxyFormState[_key] !== VALIDATION_MODE.all) control._proxyFormState[_key] = !isRoot || VALIDATION_MODE.all;
		localProxyFormState && (localProxyFormState[_key] = true);
		return formState[_key];
	} });
	return result;
};
var useIsomorphicLayoutEffect = isWeb ? import_react.useLayoutEffect : import_react.useEffect;
/**
* This custom hook allows you to subscribe to each form state, and isolate the re-render at the custom hook level. It has its scope in terms of form state subscription, so it would not affect other useFormState and useForm. Using this hook can reduce the re-render impact on large and complex form application.
*
* @remarks
* [API](https://react-hook-form.com/docs/useformstate) • [Demo](https://codesandbox.io/s/useformstate-75xly)
*
* @param props - include options on specify fields to subscribe. {@link UseFormStateReturn}
*
* @example
* ```tsx
* function App() {
*   const { register, handleSubmit, control } = useForm({
*     defaultValues: {
*     firstName: "firstName"
*   }});
*   const { dirtyFields } = useFormState({
*     control
*   });
*   const onSubmit = (data) => console.log(data);
*
*   return (
*     <form onSubmit={handleSubmit(onSubmit)}>
*       <input {...register("firstName")} placeholder="First Name" />
*       {dirtyFields.firstName && <p>Field is dirty.</p>}
*       <input type="submit" />
*     </form>
*   );
* }
* ```
*/
function useFormState(props) {
	const formControl = useFormControlContext();
	const { control = formControl, disabled, name, exact } = props || {};
	const [formState, updateFormState] = import_react.useState(() => ({
		...control._formState,
		defaultValues: control._defaultValues
	}));
	const _localProxyFormState = import_react.useRef({
		isDirty: false,
		isLoading: false,
		dirtyFields: false,
		touchedFields: false,
		validatingFields: false,
		isValidating: false,
		isValid: false,
		errors: false
	});
	useIsomorphicLayoutEffect(() => control._subscribe({
		name,
		formState: _localProxyFormState.current,
		exact,
		callback: (formState) => {
			!disabled && updateFormState({
				...control._formState,
				...formState,
				defaultValues: control._defaultValues
			});
		}
	}), [
		name,
		disabled,
		exact
	]);
	import_react.useEffect(() => {
		_localProxyFormState.current.isValid && control._setValid(true);
	}, [control]);
	return import_react.useMemo(() => getProxyFormState(formState, control, _localProxyFormState.current, false), [formState, control]);
}
var isString = (value) => typeof value === "string";
var generateWatchOutput = (names, _names, formValues, isGlobal, defaultValue) => {
	if (isString(names)) {
		isGlobal && _names.watch.add(names);
		return get(formValues, names, defaultValue);
	}
	if (Array.isArray(names)) return names.map((fieldName) => (isGlobal && _names.watch.add(fieldName), get(formValues, fieldName)));
	isGlobal && (_names.watchAll = true);
	return formValues;
};
var isPrimitive = (value) => isNullOrUndefined(value) || !isObjectType(value);
function deepEqual(object1, object2, visited = /* @__PURE__ */ new WeakSet()) {
	if (object1 === object2) return true;
	if (isPrimitive(object1) || isPrimitive(object2)) return Object.is(object1, object2);
	if (isDateObject(object1) && isDateObject(object2)) return Object.is(object1.getTime(), object2.getTime());
	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);
	if (keys1.length !== keys2.length) return false;
	if (visited.has(object1) || visited.has(object2)) return true;
	visited.add(object1);
	visited.add(object2);
	for (const key of keys1) {
		const val1 = object1[key];
		if (!(key in object2)) return false;
		if (key !== "ref") {
			const val2 = object2[key];
			if (isDateObject(val1) && isDateObject(val2) || (isObject(val1) || Array.isArray(val1)) && (isObject(val2) || Array.isArray(val2)) ? !deepEqual(val1, val2, visited) : !Object.is(val1, val2)) return false;
		}
	}
	return true;
}
/**
* Custom hook to subscribe to field change and isolate re-rendering at the component level.
*
* @remarks
*
* [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
*
* @example
* ```tsx
* const { control } = useForm();
* const values = useWatch({
*   name: "fieldName"
*   control,
* })
* ```
*/
function useWatch(props) {
	const formControl = useFormControlContext();
	const { control = formControl, name, defaultValue, disabled, exact, compute } = props || {};
	const _defaultValue = import_react.useRef(defaultValue);
	const _compute = import_react.useRef(compute);
	const _computeFormValues = import_react.useRef(void 0);
	const _prevControl = import_react.useRef(control);
	const _prevName = import_react.useRef(name);
	_compute.current = compute;
	const [value, updateValue] = import_react.useState(() => {
		const defaultValue = control._getWatch(name, _defaultValue.current);
		return _compute.current ? _compute.current(defaultValue) : defaultValue;
	});
	const getCurrentOutput = import_react.useCallback((values) => {
		const formValues = generateWatchOutput(name, control._names, values || control._formValues, false, _defaultValue.current);
		return _compute.current ? _compute.current(formValues) : formValues;
	}, [
		control._formValues,
		control._names,
		name
	]);
	const refreshValue = import_react.useCallback((values) => {
		if (!disabled) {
			const formValues = generateWatchOutput(name, control._names, values || control._formValues, false, _defaultValue.current);
			if (_compute.current) {
				const computedFormValues = _compute.current(formValues);
				if (!deepEqual(computedFormValues, _computeFormValues.current)) {
					updateValue(computedFormValues);
					_computeFormValues.current = computedFormValues;
				}
			} else updateValue(formValues);
		}
	}, [
		control._formValues,
		control._names,
		disabled,
		name
	]);
	useIsomorphicLayoutEffect(() => {
		if (_prevControl.current !== control || !deepEqual(_prevName.current, name)) {
			_prevControl.current = control;
			_prevName.current = name;
			refreshValue();
		}
		return control._subscribe({
			name,
			formState: { values: true },
			exact,
			callback: (formState) => {
				refreshValue(formState.values);
			}
		});
	}, [
		control,
		exact,
		name,
		refreshValue
	]);
	import_react.useEffect(() => control._removeUnmounted());
	const controlChanged = _prevControl.current !== control;
	const prevName = _prevName.current;
	const computedOutput = import_react.useMemo(() => {
		if (disabled) return null;
		const nameChanged = !controlChanged && !deepEqual(prevName, name);
		return controlChanged || nameChanged ? getCurrentOutput() : null;
	}, [
		disabled,
		controlChanged,
		name,
		prevName,
		getCurrentOutput
	]);
	return computedOutput !== null ? computedOutput : value;
}
/**
* Custom hook to work with controlled component, this function provide you with both form and field level state. Re-render is isolated at the hook level.
*
* @remarks
* [API](https://react-hook-form.com/docs/usecontroller) • [Demo](https://codesandbox.io/s/usecontroller-0o8px)
*
* @param props - the path name to the form field value, and validation rules.
*
* @returns field properties, field and form state. {@link UseControllerReturn}
*
* @example
* ```tsx
* function Input(props) {
*   const { field, fieldState, formState } = useController(props);
*   return (
*     <div>
*       <input {...field} placeholder={props.name} />
*       <p>{fieldState.isTouched && "Touched"}</p>
*       <p>{formState.isSubmitted ? "submitted" : ""}</p>
*     </div>
*   );
* }
* ```
*/
function useController(props) {
	const formControl = useFormControlContext();
	const { name, disabled, control = formControl, shouldUnregister, defaultValue, exact = true } = props;
	const isArrayField = isNameInFieldArray(control._names.array, name);
	const value = useWatch({
		control,
		name,
		defaultValue: import_react.useMemo(() => get(control._formValues, name, get(control._defaultValues, name, defaultValue)), [
			control,
			name,
			defaultValue
		]),
		exact
	});
	const formState = useFormState({
		control,
		name,
		exact
	});
	const _props = import_react.useRef(props);
	const _registerProps = import_react.useRef(control.register(name, {
		...props.rules,
		value,
		...isBoolean(props.disabled) ? { disabled: props.disabled } : {}
	}));
	_props.current = props;
	const fieldState = import_react.useMemo(() => Object.defineProperties({}, {
		invalid: {
			enumerable: true,
			get: () => !!get(formState.errors, name)
		},
		isDirty: {
			enumerable: true,
			get: () => !!get(formState.dirtyFields, name)
		},
		isTouched: {
			enumerable: true,
			get: () => !!get(formState.touchedFields, name)
		},
		isValidating: {
			enumerable: true,
			get: () => !!get(formState.validatingFields, name)
		},
		error: {
			enumerable: true,
			get: () => get(formState.errors, name)
		}
	}), [formState, name]);
	const onChange = import_react.useCallback((event) => _registerProps.current.onChange({
		target: {
			value: getEventValue(event),
			name
		},
		type: EVENTS.CHANGE
	}), [name]);
	const onBlur = import_react.useCallback(() => _registerProps.current.onBlur({
		target: {
			value: get(control._formValues, name),
			name
		},
		type: EVENTS.BLUR
	}), [name, control._formValues]);
	const ref = import_react.useCallback((elm) => {
		const field = get(control._fields, name);
		if (field && field._f && elm) field._f.ref = {
			focus: () => isFunction(elm.focus) && elm.focus(),
			select: () => isFunction(elm.select) && elm.select(),
			setCustomValidity: (message) => isFunction(elm.setCustomValidity) && elm.setCustomValidity(message),
			reportValidity: () => isFunction(elm.reportValidity) && elm.reportValidity()
		};
	}, [control._fields, name]);
	const field = import_react.useMemo(() => ({
		name,
		value,
		...isBoolean(disabled) || formState.disabled ? { disabled: formState.disabled || disabled } : {},
		onChange,
		onBlur,
		ref
	}), [
		name,
		disabled,
		formState.disabled,
		onChange,
		onBlur,
		ref,
		value
	]);
	import_react.useEffect(() => {
		const _shouldUnregisterField = control._options.shouldUnregister || shouldUnregister;
		control.register(name, {
			..._props.current.rules,
			...isBoolean(_props.current.disabled) ? { disabled: _props.current.disabled } : {}
		});
		const updateMounted = (name, value) => {
			const field = get(control._fields, name);
			if (field && field._f) field._f.mount = value;
		};
		updateMounted(name, true);
		if (_shouldUnregisterField) {
			const value = cloneObject(get(control._defaultValues, name, get(control._options.defaultValues, name, _props.current.defaultValue)));
			set(control._defaultValues, name, value);
			if (isUndefined(get(control._formValues, name))) set(control._formValues, name, value);
		}
		!isArrayField && control.register(name);
		return () => {
			(isArrayField ? _shouldUnregisterField && !control._state.action : _shouldUnregisterField) ? control.unregister(name) : updateMounted(name, false);
		};
	}, [
		name,
		control,
		isArrayField,
		shouldUnregister
	]);
	import_react.useEffect(() => {
		control._setDisabledField({
			disabled,
			name
		});
	}, [
		disabled,
		name,
		control
	]);
	return import_react.useMemo(() => ({
		field,
		formState,
		fieldState
	}), [
		field,
		formState,
		fieldState
	]);
}
/**
* Component based on `useController` hook to work with controlled component.
*
* @remarks
* [API](https://react-hook-form.com/docs/usecontroller/controller) • [Demo](https://codesandbox.io/s/react-hook-form-v6-controller-ts-jwyzw) • [Video](https://www.youtube.com/watch?v=N2UNk_UCVyA)
*
* @param props - the path name to the form field value, and validation rules.
*
* @returns provide field handler functions, field and form state.
*
* @example
* ```tsx
* function App() {
*   const { control } = useForm<FormValues>({
*     defaultValues: {
*       test: ""
*     }
*   });
*
*   return (
*     <form>
*       <Controller
*         control={control}
*         name="test"
*         render={({ field: { onChange, onBlur, value, ref }, formState, fieldState }) => (
*           <>
*             <input
*               onChange={onChange} // send value to hook form
*               onBlur={onBlur} // notify when input is touched
*               value={value} // return updated value
*               ref={ref} // set ref for focus management
*             />
*             <p>{formState.isSubmitted ? "submitted" : ""}</p>
*             <p>{fieldState.isTouched ? "touched" : ""}</p>
*           </>
*         )}
*       />
*     </form>
*   );
* }
* ```
*/
var Controller = (props) => props.render(useController(props));
var flatten = (obj) => {
	const output = {};
	for (const key of Object.keys(obj)) if (isObjectType(obj[key]) && obj[key] !== null) {
		const nested = flatten(obj[key]);
		for (const nestedKey of Object.keys(nested)) output[`${key}.${nestedKey}`] = nested[nestedKey];
	} else output[key] = obj[key];
	return output;
};
var HookFormContext = import_react.createContext(null);
HookFormContext.displayName = "HookFormContext";
/**
* This custom hook allows you to access the form context. useFormContext is intended to be used in deeply nested structures, where it would become inconvenient to pass the context as a prop. To be used with {@link FormProvider}.
*
* @remarks
* [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
*
* @returns return all useForm methods
*
* @example
* ```tsx
* function App() {
*   const methods = useForm();
*   const onSubmit = data => console.log(data);
*
*   return (
*     <FormProvider {...methods} >
*       <form onSubmit={methods.handleSubmit(onSubmit)}>
*         <NestedInput />
*         <input type="submit" />
*       </form>
*     </FormProvider>
*   );
* }
*
*  function NestedInput() {
*   const { register } = useFormContext(); // retrieve all hook methods
*   return <input {...register("test")} />;
* }
* ```
*/
var useFormContext = () => import_react.useContext(HookFormContext);
/**
* A provider component that propagates the `useForm` methods to all children components via [React Context](https://react.dev/reference/react/useContext) API. To be used with {@link useFormContext}.
*
* @remarks
* [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
*
* @param props - all useForm methods
*
* @example
* ```tsx
* function App() {
*   const methods = useForm();
*   const onSubmit = data => console.log(data);
*
*   return (
*     <FormProvider {...methods} >
*       <form onSubmit={methods.handleSubmit(onSubmit)}>
*         <NestedInput />
*         <input type="submit" />
*       </form>
*     </FormProvider>
*   );
* }
*
*  function NestedInput() {
*   const { register } = useFormContext(); // retrieve all hook methods
*   return <input {...register("test")} />;
* }
* ```
*/
var FormProvider = ({ children, watch, getValues, getFieldState, setError, clearErrors, setValue, setValues, trigger, formState, resetField, reset, handleSubmit, unregister, control, register, setFocus, subscribe }) => {
	const memoizedValue = import_react.useMemo(() => ({
		watch,
		getValues,
		getFieldState,
		setError,
		clearErrors,
		setValue,
		setValues,
		trigger,
		formState,
		resetField,
		reset,
		handleSubmit,
		unregister,
		control,
		register,
		setFocus,
		subscribe
	}), [
		clearErrors,
		control,
		formState,
		getFieldState,
		getValues,
		handleSubmit,
		register,
		reset,
		resetField,
		setError,
		setFocus,
		setValue,
		setValues,
		subscribe,
		trigger,
		unregister,
		watch
	]);
	return import_react.createElement(HookFormContext.Provider, { value: memoizedValue }, import_react.createElement(HookFormControlContext.Provider, { value: memoizedValue.control }, children));
};
var POST_REQUEST = "post";
/**
* Form component to manage submission.
*
* @param props - to setup submission detail. {@link FormProps}
*
* @returns form component or headless render prop.
*
* @example
* ```tsx
* function App() {
*   const { control, formState: { errors } } = useForm();
*
*   return (
*     <Form action="/api" control={control}>
*       <input {...register("name")} />
*       <p>{errors?.root?.server && 'Server error'}</p>
*       <button>Submit</button>
*     </Form>
*   );
* }
* ```
*/
function Form(props) {
	const methods = useFormContext();
	const [mounted, setMounted] = import_react.useState(false);
	const { control = methods.control, onSubmit, children, action, method = POST_REQUEST, headers, encType, onError, render, onSuccess, validateStatus, ...rest } = props;
	const submit = import_react.useCallback(async (event) => {
		let hasError = false;
		let type = "";
		await control.handleSubmit(async (data) => {
			const formData = new FormData();
			let formDataJson = "";
			try {
				formDataJson = JSON.stringify(data);
			} catch (_a) {}
			const flattenFormValues = flatten(data);
			for (const key in flattenFormValues) formData.append(key, flattenFormValues[key]);
			if (onSubmit) await onSubmit({
				data,
				event,
				method,
				formData,
				formDataJson
			});
			if (action) try {
				const shouldStringifySubmissionData = [headers && headers["Content-Type"], encType].some((value) => value && value.includes("json"));
				const response = await fetch(String(action), {
					method,
					headers: {
						...headers,
						...encType && encType !== "multipart/form-data" ? { "Content-Type": encType } : {}
					},
					body: shouldStringifySubmissionData ? formDataJson : formData
				});
				if (response && (validateStatus ? !validateStatus(response.status) : response.status < 200 || response.status >= 300)) {
					hasError = true;
					onError && onError({ response });
					type = String(response.status);
				} else onSuccess && onSuccess({ response });
			} catch (error) {
				hasError = true;
				onError && onError({ error });
			}
		})(event);
		if (hasError && control) {
			control._subjects.state.next({ isSubmitSuccessful: false });
			control.setError("root.server", { type });
		}
	}, [
		control,
		onSubmit,
		method,
		action,
		headers,
		encType,
		validateStatus,
		onError,
		onSuccess
	]);
	import_react.useEffect(() => {
		setMounted(true);
	}, []);
	return render ? import_react.createElement(import_react.Fragment, null, render({ submit })) : import_react.createElement("form", {
		noValidate: mounted,
		action,
		method,
		encType,
		onSubmit: submit,
		...rest
	}, children);
}
var FormStateSubscribe = ({ control, disabled, exact, name, render }) => render(useFormState({
	control,
	name,
	disabled,
	exact
}));
var appendErrors = (name, validateAllFieldCriteria, errors, type, message) => validateAllFieldCriteria ? {
	...errors[name],
	types: {
		...errors[name] && errors[name].types ? errors[name].types : {},
		[type]: message || true
	}
} : {};
var compact = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
var convertToArrayPayload = (value) => Array.isArray(value) ? value : [value];
var createSubject = () => {
	let _observers = [];
	const next = (value) => {
		for (const observer of _observers) observer.next && observer.next(value);
	};
	const subscribe = (observer) => {
		_observers.push(observer);
		return { unsubscribe: () => {
			_observers = _observers.filter((o) => o !== observer);
		} };
	};
	const unsubscribe = () => {
		_observers = [];
	};
	return {
		get observers() {
			return _observers;
		},
		next,
		subscribe,
		unsubscribe
	};
};
function extractFormValues(fieldsState, formValues) {
	const values = {};
	for (const key in fieldsState) if (fieldsState.hasOwnProperty(key)) {
		const fieldState = fieldsState[key];
		const fieldValue = formValues[key];
		if (fieldState && isObject(fieldState) && fieldValue) {
			const nestedFieldsState = extractFormValues(fieldState, fieldValue);
			if (isObject(nestedFieldsState)) values[key] = nestedFieldsState;
		} else if (fieldsState[key]) values[key] = fieldValue;
	}
	return values;
}
var isEmptyObject = (value) => isObject(value) && !Object.keys(value).length;
var isFileInput = (element) => element.type === "file";
var isHTMLElement = (value) => {
	if (!isWeb) return false;
	const owner = value ? value.ownerDocument : 0;
	return value instanceof (owner && owner.defaultView ? owner.defaultView.HTMLElement : HTMLElement);
};
var isMultipleSelect = (element) => element.type === `select-multiple`;
var isRadioInput = (element) => element.type === "radio";
var isRadioOrCheckbox = (ref) => isRadioInput(ref) || isCheckBoxInput(ref);
var live = (ref) => isHTMLElement(ref) && ref.isConnected;
function baseGet(object, updatePath) {
	const length = updatePath.slice(0, -1).length;
	let index = 0;
	while (index < length) {
		if (isNullOrUndefined(object)) {
			object = void 0;
			break;
		}
		object = object[updatePath[index]];
		index++;
	}
	return object;
}
function isEmptyArray(obj) {
	for (const key in obj) if (obj.hasOwnProperty(key) && !isUndefined(obj[key])) return false;
	return true;
}
function unset(object, path) {
	if (isString(path) && Object.prototype.hasOwnProperty.call(object, path)) {
		delete object[path];
		return object;
	}
	const paths = Array.isArray(path) ? path : isKey(path) ? [path] : stringToPath(path);
	const childObject = paths.length === 1 ? object : baseGet(object, paths);
	const index = paths.length - 1;
	const key = paths[index];
	if (childObject) delete childObject[key];
	if (index !== 0 && (isObject(childObject) && isEmptyObject(childObject) || Array.isArray(childObject) && isEmptyArray(childObject))) unset(object, paths.slice(0, -1));
	return object;
}
var objectHasFunction = (data) => {
	for (const key in data) if (isFunction(data[key])) return true;
	return false;
};
function isTraversable(value) {
	return Array.isArray(value) || isObject(value) && !objectHasFunction(value);
}
function markFieldsDirty(data, fields = {}) {
	for (const key in data) {
		const value = data[key];
		if (isTraversable(value)) {
			fields[key] = Array.isArray(value) ? [] : {};
			markFieldsDirty(value, fields[key]);
		} else if (!isUndefined(value)) fields[key] = true;
	}
	return fields;
}
function pruneDirtyFields(value) {
	if (value === false) return;
	if (value === true) return true;
	if (Array.isArray(value)) {
		const result = value.map((value) => pruneDirtyFields(value));
		return result.some((value) => value !== void 0) ? result : void 0;
	}
	if (isObject(value)) {
		const result = {};
		for (const key in value) {
			const pruned = pruneDirtyFields(value[key]);
			if (!isUndefined(pruned)) result[key] = pruned;
		}
		return Object.keys(result).length ? result : void 0;
	}
}
function getDirtyFields(data, formValues, dirtyFieldsFromValues) {
	if (!dirtyFieldsFromValues) dirtyFieldsFromValues = markFieldsDirty(formValues);
	for (const key in data) {
		const value = data[key];
		if (isTraversable(value)) if (isUndefined(formValues) || isPrimitive(dirtyFieldsFromValues[key])) dirtyFieldsFromValues[key] = markFieldsDirty(value, Array.isArray(value) ? [] : {});
		else getDirtyFields(value, isNullOrUndefined(formValues) ? {} : formValues[key], dirtyFieldsFromValues[key]);
		else {
			const formValue = formValues[key];
			dirtyFieldsFromValues[key] = !deepEqual(value, formValue);
		}
	}
	return pruneDirtyFields(dirtyFieldsFromValues) || {};
}
var defaultResult = {
	value: false,
	isValid: false
};
var validResult = {
	value: true,
	isValid: true
};
var getCheckboxValue = (options) => {
	if (Array.isArray(options)) {
		if (options.length > 1) {
			const values = options.filter((option) => option && option.checked && !option.disabled).map((option) => option.value);
			return {
				value: values,
				isValid: !!values.length
			};
		}
		return options[0].checked && !options[0].disabled ? options[0].attributes && !isUndefined(options[0].attributes.value) ? isUndefined(options[0].value) || options[0].value === "" ? validResult : {
			value: options[0].value,
			isValid: true
		} : validResult : defaultResult;
	}
	return defaultResult;
};
var getFieldValueAs = (value, { valueAsNumber, valueAsDate, setValueAs }) => isUndefined(value) ? value : valueAsNumber ? value === "" ? NaN : value ? +value : value : valueAsDate && isString(value) ? new Date(value) : setValueAs ? setValueAs(value) : value;
var defaultReturn = {
	isValid: false,
	value: null
};
var getRadioValue = (options) => Array.isArray(options) ? options.reduce((previous, option) => option && option.checked && !option.disabled ? {
	isValid: true,
	value: option.value
} : previous, defaultReturn) : defaultReturn;
function getFieldValue(_f) {
	const ref = _f.ref;
	if (isFileInput(ref)) return ref.files;
	if (isRadioInput(ref)) return getRadioValue(_f.refs).value;
	if (isMultipleSelect(ref)) return [...ref.selectedOptions].map(({ value }) => value);
	if (isCheckBoxInput(ref)) return getCheckboxValue(_f.refs).value;
	return getFieldValueAs(isUndefined(ref.value) ? _f.ref.value : ref.value, _f);
}
var getResolverOptions = (fieldsNames, _fields, criteriaMode, shouldUseNativeValidation) => {
	const fields = {};
	for (const name of fieldsNames) {
		const field = get(_fields, name);
		field && set(fields, name, field._f);
	}
	return {
		criteriaMode,
		names: [...fieldsNames],
		fields,
		shouldUseNativeValidation
	};
};
var isRegex = (value) => value instanceof RegExp;
var getRuleValue = (rule) => isUndefined(rule) ? rule : isRegex(rule) ? rule.source : isObject(rule) ? isRegex(rule.value) ? rule.value.source : rule.value : rule;
var getValidationModes = (mode) => ({
	isOnSubmit: !mode || mode === VALIDATION_MODE.onSubmit,
	isOnBlur: mode === VALIDATION_MODE.onBlur,
	isOnChange: mode === VALIDATION_MODE.onChange,
	isOnAll: mode === VALIDATION_MODE.all,
	isOnTouch: mode === VALIDATION_MODE.onTouched
});
var ASYNC_FUNCTION = "AsyncFunction";
var hasPromiseValidation = (fieldReference) => !!fieldReference && !!fieldReference.validate && !!(isFunction(fieldReference.validate) && fieldReference.validate.constructor.name === ASYNC_FUNCTION || isObject(fieldReference.validate) && Object.values(fieldReference.validate).find((validateFunction) => validateFunction.constructor.name === ASYNC_FUNCTION));
var hasValidation = (options) => options.mount && (options.required || options.min || options.max || options.maxLength || options.minLength || options.pattern || options.validate);
var isWatched = (name, _names, isBlurEvent) => !isBlurEvent && (_names.watchAll || _names.watch.has(name) || [..._names.watch].some((watchName) => name.startsWith(`${watchName}.`)));
var iterateFieldsByAction = (fields, action, fieldsNames, abortEarly) => {
	for (const key of fieldsNames || Object.keys(fields)) {
		const field = get(fields, key);
		if (field) {
			const { _f, ...currentField } = field;
			if (_f) {
				if (_f.refs && _f.refs[0] && action(_f.refs[0], key) && !abortEarly) return true;
				else if (_f.ref && action(_f.ref, _f.name) && !abortEarly) return true;
				else if (iterateFieldsByAction(currentField, action)) break;
			} else if (isObject(currentField)) {
				if (iterateFieldsByAction(currentField, action)) break;
			}
		}
	}
};
function schemaErrorLookup(errors, _fields, name) {
	const error = get(errors, name);
	if (error || isKey(name)) return {
		error,
		name
	};
	const names = name.split(".");
	while (names.length) {
		const fieldName = names.join(".");
		const field = get(_fields, fieldName);
		const foundError = get(errors, fieldName);
		if (field && !Array.isArray(field) && name !== fieldName) return { name };
		if (foundError && foundError.type) return {
			name: fieldName,
			error: foundError
		};
		if (foundError && foundError.root && foundError.root.type) return {
			name: `${fieldName}.root`,
			error: foundError.root
		};
		names.pop();
	}
	return { name };
}
var shouldRenderFormState = (formStateData, _proxyFormState, updateFormState, isRoot) => {
	updateFormState(formStateData);
	const { name, ...formState } = formStateData;
	return isEmptyObject(formState) || isRoot && Object.keys(formState).length >= Object.keys(_proxyFormState).length || Object.keys(formState).find((key) => _proxyFormState[key] === (!isRoot || VALIDATION_MODE.all));
};
var shouldSubscribeByName = (name, signalName, exact) => !name || !signalName || name === signalName || convertToArrayPayload(name).some((currentName) => currentName && (exact ? currentName === signalName : currentName.startsWith(signalName) || signalName.startsWith(currentName)));
var skipValidation = (isBlurEvent, isTouched, isSubmitted, reValidateMode, mode) => {
	if (mode.isOnAll) return false;
	else if (!isSubmitted && mode.isOnTouch) return !(isTouched || isBlurEvent);
	else if (isSubmitted ? reValidateMode.isOnBlur : mode.isOnBlur) return !isBlurEvent;
	else if (isSubmitted ? reValidateMode.isOnChange : mode.isOnChange) return isBlurEvent;
	return true;
};
var unsetEmptyArray = (ref, name) => !compact(get(ref, name)).length && unset(ref, name);
var updateFieldArrayRootError = (errors, error, name) => {
	const existingErrors = get(errors, name);
	const fieldArrayErrors = Array.isArray(existingErrors) ? existingErrors : [];
	set(fieldArrayErrors, ROOT_ERROR_TYPE, error[name]);
	set(errors, name, fieldArrayErrors);
	return errors;
};
function getValidateError(result, ref, type = "validate") {
	if (isString(result) || Array.isArray(result) && result.every(isString) || isBoolean(result) && !result) return {
		type,
		message: isString(result) ? result : "",
		ref
	};
}
var getValueAndMessage = (validationData) => isObject(validationData) && !isRegex(validationData) ? validationData : {
	value: validationData,
	message: ""
};
var validateField = async (field, disabledFieldNames, formValues, validateAllFieldCriteria, shouldUseNativeValidation, isFieldArray) => {
	const { ref, refs, required, maxLength, minLength, min, max, pattern, validate, name, valueAsNumber, mount } = field._f;
	const inputValue = get(formValues, name);
	if (!mount || disabledFieldNames.has(name)) return {};
	const inputRef = refs ? refs[0] : ref;
	const setCustomValidity = (message) => {
		if (shouldUseNativeValidation && inputRef.reportValidity) {
			inputRef.setCustomValidity(isBoolean(message) ? "" : message || "");
			inputRef.reportValidity();
		}
	};
	const error = {};
	const isRadio = isRadioInput(ref);
	const isCheckBox = isCheckBoxInput(ref);
	const isRadioOrCheckbox = isRadio || isCheckBox;
	const isEmpty = (valueAsNumber || isFileInput(ref)) && isUndefined(ref.value) && isUndefined(inputValue) || isHTMLElement(ref) && ref.value === "" || inputValue === "" || Array.isArray(inputValue) && !inputValue.length;
	const appendErrorsCurry = appendErrors.bind(null, name, validateAllFieldCriteria, error);
	const getMinMaxMessage = (exceedMax, maxLengthMessage, minLengthMessage, maxType = INPUT_VALIDATION_RULES.maxLength, minType = INPUT_VALIDATION_RULES.minLength) => {
		const message = exceedMax ? maxLengthMessage : minLengthMessage;
		error[name] = {
			type: exceedMax ? maxType : minType,
			message,
			ref,
			...appendErrorsCurry(exceedMax ? maxType : minType, message)
		};
	};
	if (isFieldArray ? !Array.isArray(inputValue) || !inputValue.length : required && (!isRadioOrCheckbox && (isEmpty || isNullOrUndefined(inputValue)) || isBoolean(inputValue) && !inputValue || isCheckBox && !getCheckboxValue(refs).isValid || isRadio && !getRadioValue(refs).isValid)) {
		const { value, message } = isString(required) ? {
			value: !!required,
			message: required
		} : getValueAndMessage(required);
		if (value) {
			error[name] = {
				type: INPUT_VALIDATION_RULES.required,
				message,
				ref: inputRef,
				...appendErrorsCurry(INPUT_VALIDATION_RULES.required, message)
			};
			if (!validateAllFieldCriteria) {
				setCustomValidity(message);
				return error;
			}
		}
	}
	if (!isEmpty && (!isNullOrUndefined(min) || !isNullOrUndefined(max))) {
		let exceedMax;
		let exceedMin;
		const maxOutput = getValueAndMessage(max);
		const minOutput = getValueAndMessage(min);
		if (!isNullOrUndefined(inputValue) && !isNaN(inputValue)) {
			const valueNumber = ref.valueAsNumber || (inputValue ? +inputValue : inputValue);
			if (!isNullOrUndefined(maxOutput.value)) exceedMax = valueNumber > maxOutput.value;
			if (!isNullOrUndefined(minOutput.value)) exceedMin = valueNumber < minOutput.value;
		} else {
			const valueDate = ref.valueAsDate || new Date(inputValue);
			const convertTimeToDate = (time) => /* @__PURE__ */ new Date((/* @__PURE__ */ new Date()).toDateString() + " " + time);
			const isTime = ref.type == "time";
			const isWeek = ref.type == "week";
			if (isString(maxOutput.value) && inputValue) exceedMax = isTime ? convertTimeToDate(inputValue) > convertTimeToDate(maxOutput.value) : isWeek ? inputValue > maxOutput.value : valueDate > new Date(maxOutput.value);
			if (isString(minOutput.value) && inputValue) exceedMin = isTime ? convertTimeToDate(inputValue) < convertTimeToDate(minOutput.value) : isWeek ? inputValue < minOutput.value : valueDate < new Date(minOutput.value);
		}
		if (exceedMax || exceedMin) {
			getMinMaxMessage(!!exceedMax, maxOutput.message, minOutput.message, INPUT_VALIDATION_RULES.max, INPUT_VALIDATION_RULES.min);
			if (!validateAllFieldCriteria) {
				setCustomValidity(error[name].message);
				return error;
			}
		}
	}
	if ((maxLength || minLength) && !isEmpty && (isString(inputValue) || isFieldArray && Array.isArray(inputValue))) {
		const maxLengthOutput = getValueAndMessage(maxLength);
		const minLengthOutput = getValueAndMessage(minLength);
		const exceedMax = !isNullOrUndefined(maxLengthOutput.value) && inputValue.length > +maxLengthOutput.value;
		const exceedMin = !isNullOrUndefined(minLengthOutput.value) && inputValue.length < +minLengthOutput.value;
		if (exceedMax || exceedMin) {
			getMinMaxMessage(exceedMax, maxLengthOutput.message, minLengthOutput.message);
			if (!validateAllFieldCriteria) {
				setCustomValidity(error[name].message);
				return error;
			}
		}
	}
	if (pattern && !isEmpty && isString(inputValue)) {
		const { value: patternValue, message } = getValueAndMessage(pattern);
		if (isRegex(patternValue) && !inputValue.match(patternValue)) {
			error[name] = {
				type: INPUT_VALIDATION_RULES.pattern,
				message,
				ref,
				...appendErrorsCurry(INPUT_VALIDATION_RULES.pattern, message)
			};
			if (!validateAllFieldCriteria) {
				setCustomValidity(message);
				return error;
			}
		}
	}
	if (validate) {
		if (isFunction(validate)) {
			const validateError = getValidateError(await validate(inputValue, formValues), inputRef);
			if (validateError) {
				error[name] = {
					...validateError,
					...appendErrorsCurry(INPUT_VALIDATION_RULES.validate, validateError.message)
				};
				if (!validateAllFieldCriteria) {
					setCustomValidity(validateError.message);
					return error;
				}
			}
		} else if (isObject(validate)) {
			let validationResult = {};
			for (const key in validate) {
				if (!isEmptyObject(validationResult) && !validateAllFieldCriteria) break;
				const validateError = getValidateError(await validate[key](inputValue, formValues), inputRef, key);
				if (validateError) {
					validationResult = {
						...validateError,
						...appendErrorsCurry(key, validateError.message)
					};
					setCustomValidity(validateError.message);
					if (validateAllFieldCriteria) error[name] = validationResult;
				}
			}
			if (!isEmptyObject(validationResult)) {
				error[name] = {
					ref: inputRef,
					...validationResult
				};
				if (!validateAllFieldCriteria) return error;
			}
		}
	}
	setCustomValidity(true);
	return error;
};
var defaultOptions = {
	mode: VALIDATION_MODE.onSubmit,
	reValidateMode: VALIDATION_MODE.onChange,
	shouldFocusError: true
};
var DEFAULT_FORM_STATE = {
	submitCount: 0,
	isDirty: false,
	isReady: false,
	isValidating: false,
	isSubmitted: false,
	isSubmitting: false,
	isSubmitSuccessful: false,
	isValid: false,
	touchedFields: {},
	dirtyFields: {},
	validatingFields: {}
};
function createFormControl(props = {}) {
	let _options = {
		...defaultOptions,
		...props
	};
	let _formState = {
		...cloneObject(DEFAULT_FORM_STATE),
		isLoading: isFunction(_options.defaultValues),
		errors: _options.errors || {},
		disabled: _options.disabled || false
	};
	let _fields = {};
	let _defaultValues = isObject(_options.defaultValues) || isObject(_options.values) ? cloneObject(_options.defaultValues || _options.values) || {} : {};
	let _formValues = _options.shouldUnregister ? {} : cloneObject(_defaultValues);
	let _state = {
		action: false,
		mount: false,
		watch: false,
		keepIsValid: false
	};
	let _names = {
		mount: /* @__PURE__ */ new Set(),
		disabled: /* @__PURE__ */ new Set(),
		unMount: /* @__PURE__ */ new Set(),
		array: /* @__PURE__ */ new Set(),
		watch: /* @__PURE__ */ new Set(),
		registerName: /* @__PURE__ */ new Set()
	};
	let delayErrorCallback;
	let timer = 0;
	const defaultProxyFormState = {
		isDirty: false,
		dirtyFields: false,
		validatingFields: false,
		touchedFields: false,
		isValidating: false,
		isValid: false,
		errors: false
	};
	const _proxyFormState = { ...defaultProxyFormState };
	let _proxySubscribeFormState = { ..._proxyFormState };
	const _subjects = {
		array: createSubject(),
		state: createSubject()
	};
	const shouldDisplayAllAssociatedErrors = _options.criteriaMode === VALIDATION_MODE.all;
	const debounce = (callback) => (wait) => {
		clearTimeout(timer);
		timer = setTimeout(callback, wait);
	};
	const _setValid = async (shouldUpdateValid) => {
		if (_state.keepIsValid) return;
		if (!_options.disabled && (_proxyFormState.isValid || _proxySubscribeFormState.isValid || shouldUpdateValid)) {
			let isValid;
			if (_options.resolver) {
				isValid = isEmptyObject((await _runSchema()).errors);
				_updateIsValidating();
			} else isValid = await executeBuiltInValidation({
				fields: _fields,
				onlyCheckValid: true,
				eventType: EVENTS.VALID
			});
			if (isValid !== _formState.isValid) _subjects.state.next({ isValid });
		}
	};
	const _updateIsValidating = (names, isValidating) => {
		if (!_options.disabled && (_proxyFormState.isValidating || _proxyFormState.validatingFields || _proxySubscribeFormState.isValidating || _proxySubscribeFormState.validatingFields)) {
			(names || Array.from(_names.mount)).forEach((name) => {
				if (name) isValidating ? set(_formState.validatingFields, name, isValidating) : unset(_formState.validatingFields, name);
			});
			_subjects.state.next({
				validatingFields: _formState.validatingFields,
				isValidating: !isEmptyObject(_formState.validatingFields)
			});
		}
	};
	const _updateDirtyFields = () => {
		_formState.dirtyFields = getDirtyFields(_defaultValues, _formValues);
	};
	const _setFieldArray = (name, values = [], method, args, shouldSetValues = true, shouldUpdateFieldsAndState = true) => {
		if (args && method && !_options.disabled) {
			_state.action = true;
			if (shouldUpdateFieldsAndState && Array.isArray(get(_fields, name))) {
				const fieldValues = method(get(_fields, name), args.argA, args.argB);
				shouldSetValues && set(_fields, name, fieldValues);
			}
			if (shouldUpdateFieldsAndState && Array.isArray(get(_formState.errors, name))) {
				const errors = method(get(_formState.errors, name), args.argA, args.argB);
				shouldSetValues && set(_formState.errors, name, errors);
				unsetEmptyArray(_formState.errors, name);
			}
			if ((_proxyFormState.touchedFields || _proxySubscribeFormState.touchedFields) && shouldUpdateFieldsAndState && Array.isArray(get(_formState.touchedFields, name))) {
				const touchedFields = method(get(_formState.touchedFields, name), args.argA, args.argB);
				shouldSetValues && set(_formState.touchedFields, name, touchedFields);
			}
			if (_proxyFormState.dirtyFields || _proxySubscribeFormState.dirtyFields) _updateDirtyFields();
			_subjects.state.next({
				name,
				isDirty: _getDirty(name, values),
				dirtyFields: _formState.dirtyFields,
				errors: _formState.errors,
				isValid: _formState.isValid
			});
		} else set(_formValues, name, values);
	};
	const updateErrors = (name, error) => {
		set(_formState.errors, name, error);
		_subjects.state.next({ errors: _formState.errors });
	};
	const _setErrors = (errors) => {
		_formState.errors = errors;
		_subjects.state.next({
			errors: _formState.errors,
			isValid: false
		});
	};
	const hasExplicitNullIntermediate = (name) => {
		const segments = isKey(name) ? [name] : stringToPath(name);
		let formValues = _formValues;
		let defaultValues = _defaultValues;
		for (let i = 0; i < segments.length - 1; i++) {
			const key = segments[i];
			formValues = isNullOrUndefined(formValues) ? formValues : formValues[key];
			defaultValues = isNullOrUndefined(defaultValues) ? defaultValues : defaultValues[key];
			if (formValues === null && defaultValues !== null) return true;
		}
		return false;
	};
	const updateValidAndValue = (name, shouldSkipSetValueAs, value, ref) => {
		const field = get(_fields, name);
		if (field) {
			if (hasExplicitNullIntermediate(name)) return;
			const wasUnsetInFormValues = isUndefined(get(_formValues, name));
			const defaultValue = get(_formValues, name, isUndefined(value) ? get(_defaultValues, name) : value);
			isUndefined(defaultValue) || ref && ref.defaultChecked || shouldSkipSetValueAs ? set(_formValues, name, shouldSkipSetValueAs ? defaultValue : getFieldValue(field._f)) : setFieldValue(name, defaultValue);
			if (_state.mount && !_state.action) {
				_setValid();
				if (wasUnsetInFormValues && _formState.isDirty && (_proxyFormState.isDirty || _proxySubscribeFormState.isDirty)) {
					if (!_getDirty()) {
						_formState.isDirty = false;
						_subjects.state.next({ ..._formState });
					}
				}
			}
		}
	};
	const updateTouchAndDirty = (name, fieldValue, isBlurEvent, shouldDirty, shouldRender) => {
		let shouldUpdateField = false;
		let isPreviousDirty = false;
		const output = { name };
		if (!_options.disabled) {
			if (!isBlurEvent || shouldDirty) {
				if (_proxyFormState.isDirty || _proxySubscribeFormState.isDirty) {
					isPreviousDirty = _formState.isDirty;
					_formState.isDirty = output.isDirty = _getDirty();
					shouldUpdateField = isPreviousDirty !== output.isDirty;
				}
				const isCurrentFieldPristine = deepEqual(get(_defaultValues, name), fieldValue);
				isPreviousDirty = !!get(_formState.dirtyFields, name);
				if (isCurrentFieldPristine !== _formState.isDirty) _formState.dirtyFields = getDirtyFields(_defaultValues, _formValues);
				else isCurrentFieldPristine ? unset(_formState.dirtyFields, name) : set(_formState.dirtyFields, name, true);
				output.dirtyFields = _formState.dirtyFields;
				shouldUpdateField = shouldUpdateField || (_proxyFormState.dirtyFields || _proxySubscribeFormState.dirtyFields) && isPreviousDirty !== !isCurrentFieldPristine;
			}
			if (isBlurEvent) {
				const isPreviousFieldTouched = get(_formState.touchedFields, name);
				if (!isPreviousFieldTouched) {
					set(_formState.touchedFields, name, isBlurEvent);
					output.touchedFields = _formState.touchedFields;
					shouldUpdateField = shouldUpdateField || (_proxyFormState.touchedFields || _proxySubscribeFormState.touchedFields) && isPreviousFieldTouched !== isBlurEvent;
				}
			}
			shouldUpdateField && shouldRender && _subjects.state.next(output);
		}
		return shouldUpdateField ? output : {};
	};
	const shouldRenderByError = (name, isValid, error, fieldState) => {
		const previousFieldError = get(_formState.errors, name);
		const shouldUpdateValid = (_proxyFormState.isValid || _proxySubscribeFormState.isValid) && isBoolean(isValid) && _formState.isValid !== isValid;
		if (_options.delayError && error) {
			delayErrorCallback = debounce(() => updateErrors(name, error));
			delayErrorCallback(_options.delayError);
		} else {
			clearTimeout(timer);
			delayErrorCallback = null;
			error ? set(_formState.errors, name, error) : unset(_formState.errors, name);
		}
		if ((error ? !deepEqual(previousFieldError, error) : previousFieldError) || !isEmptyObject(fieldState) || shouldUpdateValid) {
			const updatedFormState = {
				...fieldState,
				...shouldUpdateValid && isBoolean(isValid) ? { isValid } : {},
				errors: _formState.errors,
				name
			};
			_formState = {
				..._formState,
				...updatedFormState
			};
			_subjects.state.next(updatedFormState);
		}
	};
	const _runSchema = async (name) => {
		_updateIsValidating(name, true);
		return await _options.resolver(_formValues, _options.context, getResolverOptions(name || _names.mount, _fields, _options.criteriaMode, _options.shouldUseNativeValidation));
	};
	const executeSchemaAndUpdateState = async (names) => {
		const { errors } = await _runSchema(names);
		_updateIsValidating(names);
		if (names) for (const name of names) {
			const error = get(errors, name);
			error ? _names.array.has(name) && isObject(error) && !Object.keys(error).some((key) => !Number.isNaN(Number(key))) ? updateFieldArrayRootError(_formState.errors, { [name]: error }, name) : set(_formState.errors, name, error) : unset(_formState.errors, name);
		}
		else _formState.errors = errors;
		return errors;
	};
	const validateForm = async ({ name, eventType }) => {
		if (props.validate) {
			const result = await props.validate({
				formValues: _formValues,
				formState: _formState,
				name,
				eventType
			});
			if (isObject(result)) for (const key in result) {
				const error = result[key];
				if (error) setError(`${FORM_ERROR_TYPE}.${key}`, {
					message: isString(error.message) ? error.message : "",
					type: error.type || INPUT_VALIDATION_RULES.validate
				});
			}
			else if (isString(result) || !result) setError(FORM_ERROR_TYPE, {
				message: result || "",
				type: INPUT_VALIDATION_RULES.validate
			});
			else clearErrors(FORM_ERROR_TYPE);
			return result;
		}
		return true;
	};
	const executeBuiltInValidation = async ({ fields, onlyCheckValid, name, eventType, context = {
		valid: true,
		runRootValidation: false
	} }) => {
		if (props.validate) {
			context.runRootValidation = true;
			if (!await validateForm({
				name,
				eventType
			})) {
				context.valid = false;
				if (onlyCheckValid) return context.valid;
			}
		}
		for (const name in fields) {
			const field = fields[name];
			if (field) {
				const { _f, ...fieldValue } = field;
				if (_f) {
					const isFieldArrayRoot = _names.array.has(_f.name);
					const isPromiseFunction = field._f && hasPromiseValidation(field._f);
					const shouldTrackIsValidatingState = _proxyFormState.validatingFields || _proxyFormState.isValidating || _proxySubscribeFormState.validatingFields || _proxySubscribeFormState.isValidating;
					if (isPromiseFunction && shouldTrackIsValidatingState) _updateIsValidating([_f.name], true);
					const fieldError = await validateField(field, _names.disabled, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation && !onlyCheckValid, isFieldArrayRoot);
					if (isPromiseFunction && shouldTrackIsValidatingState) _updateIsValidating([_f.name]);
					if (fieldError[_f.name]) {
						context.valid = false;
						if (onlyCheckValid) break;
					}
					!onlyCheckValid && (get(fieldError, _f.name) ? isFieldArrayRoot ? updateFieldArrayRootError(_formState.errors, fieldError, _f.name) : set(_formState.errors, _f.name, fieldError[_f.name]) : unset(_formState.errors, _f.name));
					if (props.shouldUseNativeValidation && fieldError[_f.name]) break;
				}
				!isEmptyObject(fieldValue) && await executeBuiltInValidation({
					context,
					onlyCheckValid,
					fields: fieldValue,
					name,
					eventType
				});
			}
		}
		return context.valid;
	};
	const _removeUnmounted = () => {
		for (const name of _names.unMount) {
			const field = get(_fields, name);
			field && (field._f.refs ? field._f.refs.every((ref) => !live(ref)) : !live(field._f.ref)) && unregister(name);
		}
		_names.unMount = /* @__PURE__ */ new Set();
	};
	const _getDirty = (name, data) => !_options.disabled && (name && data && set(_formValues, name, data), !deepEqual(getValues(), _defaultValues));
	const _getWatch = (names, defaultValue, isGlobal) => generateWatchOutput(names, _names, { ..._state.mount ? _formValues : isUndefined(defaultValue) ? _defaultValues : isString(names) ? { [names]: defaultValue } : defaultValue }, isGlobal, defaultValue);
	const _getFieldArray = (name) => compact(get(_state.mount ? _formValues : _defaultValues, name, _options.shouldUnregister ? get(_defaultValues, name, []) : []));
	const setFieldValue = (name, value, options = {}, skipClone = false) => {
		const field = get(_fields, name);
		let fieldValue = value;
		if (field) {
			const fieldReference = field._f;
			if (fieldReference) {
				!fieldReference.disabled && set(_formValues, name, getFieldValueAs(value, fieldReference));
				fieldValue = isHTMLElement(fieldReference.ref) && isNullOrUndefined(value) ? "" : value;
				if (isMultipleSelect(fieldReference.ref)) [...fieldReference.ref.options].forEach((optionRef) => optionRef.selected = fieldValue.includes(optionRef.value));
				else if (fieldReference.refs) if (isCheckBoxInput(fieldReference.ref)) fieldReference.refs.forEach((checkboxRef) => {
					if (!checkboxRef.defaultChecked || !checkboxRef.disabled) if (Array.isArray(fieldValue)) checkboxRef.checked = !!fieldValue.find((data) => data === checkboxRef.value);
					else checkboxRef.checked = fieldValue === checkboxRef.value || !!fieldValue;
				});
				else fieldReference.refs.forEach((radioRef) => radioRef.checked = radioRef.value === fieldValue);
				else if (isFileInput(fieldReference.ref)) fieldReference.ref.value = "";
				else {
					fieldReference.ref.value = fieldValue;
					if (!fieldReference.ref.type) _subjects.state.next({
						name,
						values: skipClone ? _formValues : cloneObject(_formValues)
					});
				}
			}
		}
		(options.shouldDirty || options.shouldTouch) && updateTouchAndDirty(name, fieldValue, options.shouldTouch, options.shouldDirty, true);
		options.shouldValidate && trigger(name);
	};
	const setFieldValues = (name, value, options, skipClone = false) => {
		for (const fieldKey in value) {
			if (!value.hasOwnProperty(fieldKey)) return;
			const fieldValue = value[fieldKey];
			const fieldName = name + "." + fieldKey;
			const field = get(_fields, fieldName);
			(_names.array.has(name) || isObject(fieldValue) || field && !field._f) && !isDateObject(fieldValue) ? setFieldValues(fieldName, fieldValue, options, skipClone) : setFieldValue(fieldName, fieldValue, options, skipClone);
		}
	};
	const _setValue = (name, value, options, skipClone) => {
		const field = get(_fields, name);
		const isFieldArray = _names.array.has(name);
		const cloneValue = skipClone ? value : cloneObject(value);
		const isValueUnchanged = deepEqual(get(_formValues, name), cloneValue);
		if (!isValueUnchanged) set(_formValues, name, cloneValue);
		if (isFieldArray) {
			_subjects.array.next({
				name,
				values: skipClone ? _formValues : cloneObject(_formValues)
			});
			if ((_proxyFormState.isDirty || _proxyFormState.dirtyFields || _proxySubscribeFormState.isDirty || _proxySubscribeFormState.dirtyFields) && options.shouldDirty) {
				_updateDirtyFields();
				_subjects.state.next({
					name,
					dirtyFields: _formState.dirtyFields,
					isDirty: _getDirty(name, cloneValue)
				});
			}
		} else {
			const isEmpty = Array.isArray(cloneValue) && !cloneValue.length || isEmptyObject(cloneValue);
			if (!field || field._f || isNullOrUndefined(cloneValue) || isEmpty) setFieldValue(name, cloneValue, options, skipClone);
			else setFieldValues(name, cloneValue, options, skipClone);
		}
		if (!isValueUnchanged) {
			const watched = isWatched(name, _names);
			const values = skipClone ? _formValues : cloneObject(_formValues);
			_subjects.state.next({
				...watched && _formState,
				name: _state.mount || watched ? name : void 0,
				values
			});
		}
	};
	const setValue = (name, value, options = {}) => _setValue(name, value, options, false);
	const setValues = (formValues, options = {}) => {
		const updatedFormValues = isFunction(formValues) ? formValues(_formValues) : formValues;
		if (!deepEqual(_formValues, updatedFormValues)) {
			_formValues = {
				..._formValues,
				...updatedFormValues
			};
			for (const fieldName of _names.mount) _setValue(fieldName, get(updatedFormValues, fieldName), options, true);
			_subjects.state.next({
				..._formState,
				name: void 0,
				type: void 0,
				values: _formValues
			});
			if (options.shouldValidate) _setValid();
		}
	};
	const onChange = async (event) => {
		_state.mount = true;
		const target = event.target;
		let name = target.name;
		let isFieldValueUpdated = true;
		const field = get(_fields, name);
		const _updateIsFieldValueUpdated = (fieldValue) => {
			isFieldValueUpdated = Number.isNaN(fieldValue) || isDateObject(fieldValue) && isNaN(fieldValue.getTime()) || deepEqual(fieldValue, get(_formValues, name, fieldValue));
		};
		const validationModeBeforeSubmit = getValidationModes(_options.mode);
		const validationModeAfterSubmit = getValidationModes(_options.reValidateMode);
		if (field) {
			let error;
			let isValid;
			const fieldValue = target.type ? getFieldValue(field._f) : getEventValue(event);
			const isBlurEvent = event.type === EVENTS.BLUR || event.type === EVENTS.FOCUS_OUT;
			const shouldSkipValidation = !hasValidation(field._f) && !props.validate && !_options.resolver && !get(_formState.errors, name) && !field._f.deps || skipValidation(isBlurEvent, get(_formState.touchedFields, name), _formState.isSubmitted, validationModeAfterSubmit, validationModeBeforeSubmit);
			const watched = isWatched(name, _names, isBlurEvent);
			set(_formValues, name, fieldValue);
			if (isBlurEvent) {
				if (!target || !target.readOnly) {
					field._f.onBlur && field._f.onBlur(event);
					delayErrorCallback && delayErrorCallback(0);
				}
			} else if (field._f.onChange) field._f.onChange(event);
			const fieldState = updateTouchAndDirty(name, fieldValue, isBlurEvent);
			const shouldRender = !isEmptyObject(fieldState) || watched;
			!isBlurEvent && _subjects.state.next({
				name,
				type: event.type,
				values: cloneObject(_formValues)
			});
			if (shouldSkipValidation) {
				if (_proxyFormState.isValid || _proxySubscribeFormState.isValid) {
					if (_options.mode === "onBlur") {
						if (isBlurEvent) _setValid();
					} else if (!isBlurEvent) _setValid();
				}
				return shouldRender && _subjects.state.next({
					name,
					...watched ? {} : fieldState
				});
			}
			if (!_options.resolver && props.validate) await validateForm({
				name,
				eventType: event.type
			});
			!isBlurEvent && watched && _subjects.state.next({ ..._formState });
			if (_options.resolver) {
				const { errors } = await _runSchema([name]);
				_updateIsValidating([name]);
				_updateIsFieldValueUpdated(fieldValue);
				if (isFieldValueUpdated) {
					const previousErrorLookupResult = schemaErrorLookup(_formState.errors, _fields, name);
					const errorLookupResult = schemaErrorLookup(errors, _fields, previousErrorLookupResult.name || name);
					error = errorLookupResult.error;
					name = errorLookupResult.name;
					isValid = isEmptyObject(errors);
				}
			} else {
				_updateIsValidating([name], true);
				error = (await validateField(field, _names.disabled, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation))[name];
				_updateIsValidating([name]);
				_updateIsFieldValueUpdated(fieldValue);
				if (isFieldValueUpdated) {
					if (error) isValid = false;
					else if (_proxyFormState.isValid || _proxySubscribeFormState.isValid) isValid = await executeBuiltInValidation({
						fields: _fields,
						onlyCheckValid: true,
						name,
						eventType: event.type
					});
				}
			}
			if (isFieldValueUpdated) {
				field._f.deps && (!Array.isArray(field._f.deps) || field._f.deps.length > 0) && trigger(field._f.deps);
				shouldRenderByError(name, isValid, error, fieldState);
			}
		}
	};
	const _focusInput = (ref, key) => {
		if (get(_formState.errors, key) && ref.focus) {
			ref.focus();
			return 1;
		}
	};
	const trigger = async (name, options = {}) => {
		let isValid;
		let validationResult;
		const fieldNames = convertToArrayPayload(name);
		if (_options.resolver) {
			const errors = await executeSchemaAndUpdateState(isUndefined(name) ? name : fieldNames);
			isValid = isEmptyObject(errors);
			validationResult = name ? !fieldNames.some((name) => get(errors, name)) : isValid;
		} else if (name) {
			validationResult = (await Promise.all(fieldNames.map(async (fieldName) => {
				const field = get(_fields, fieldName);
				return await executeBuiltInValidation({
					fields: field && field._f ? { [fieldName]: field } : field,
					eventType: EVENTS.TRIGGER
				});
			}))).every(Boolean);
			!(!validationResult && !_formState.isValid) && _setValid();
		} else validationResult = isValid = await executeBuiltInValidation({
			fields: _fields,
			name,
			eventType: EVENTS.TRIGGER
		});
		_subjects.state.next({
			...!isString(name) || (_proxyFormState.isValid || _proxySubscribeFormState.isValid) && isValid !== _formState.isValid ? {} : { name },
			..._options.resolver || !name ? { isValid } : {},
			errors: _formState.errors
		});
		options.shouldFocus && !validationResult && iterateFieldsByAction(_fields, _focusInput, name ? fieldNames : _names.mount);
		return validationResult;
	};
	const getValues = (fieldNames, config) => {
		let values = { ..._state.mount ? _formValues : _defaultValues };
		if (config) values = extractFormValues(config.dirtyFields ? _formState.dirtyFields : _formState.touchedFields, values);
		return isUndefined(fieldNames) ? values : isString(fieldNames) ? get(values, fieldNames) : fieldNames.map((name) => get(values, name));
	};
	const getFieldState = (name, formState) => ({
		invalid: !!get((formState || _formState).errors, name),
		isDirty: !!get((formState || _formState).dirtyFields, name),
		error: get((formState || _formState).errors, name),
		isValidating: !!get(_formState.validatingFields, name),
		isTouched: !!get((formState || _formState).touchedFields, name)
	});
	const clearErrors = (name) => {
		const names = name ? convertToArrayPayload(name) : void 0;
		names === null || names === void 0 || names.forEach((inputName) => unset(_formState.errors, inputName));
		if (names) names.forEach((inputName) => {
			_subjects.state.next({
				name: inputName,
				errors: _formState.errors
			});
		});
		else _subjects.state.next({ errors: {} });
	};
	const setError = (name, error, options) => {
		const ref = (get(_fields, name, { _f: {} })._f || {}).ref;
		const { ref: currentRef, message, type, ...restOfErrorTree } = get(_formState.errors, name) || {};
		set(_formState.errors, name, {
			...restOfErrorTree,
			...error,
			ref
		});
		_subjects.state.next({
			name,
			errors: _formState.errors,
			isValid: false
		});
		options && options.shouldFocus && ref && ref.focus && ref.focus();
	};
	const watch = (name, defaultValue) => isFunction(name) ? _subjects.state.subscribe({ next: (payload) => "values" in payload && name(payload.values || _getWatch(void 0, defaultValue), payload) }) : _getWatch(name, defaultValue, true);
	const _subscribe = (props) => _subjects.state.subscribe({ next: (formState) => {
		if (shouldSubscribeByName(props.name, formState.name, props.exact) && shouldRenderFormState(formState, props.formState || _proxyFormState, _setFormState, props.reRenderRoot)) {
			const snapshot = { ..._formValues };
			props.callback({
				values: snapshot,
				..._formState,
				...formState,
				defaultValues: _defaultValues
			});
		}
	} }).unsubscribe;
	const subscribe = (props) => {
		_state.mount = true;
		_proxySubscribeFormState = {
			..._proxySubscribeFormState,
			...props.formState
		};
		return _subscribe({
			...props,
			formState: {
				...defaultProxyFormState,
				...props.formState
			}
		});
	};
	const unregister = (name, options = {}) => {
		for (const fieldName of name ? convertToArrayPayload(name) : _names.mount) {
			_names.mount.delete(fieldName);
			_names.array.delete(fieldName);
			if (!options.keepValue) {
				unset(_fields, fieldName);
				unset(_formValues, fieldName);
			}
			!options.keepError && unset(_formState.errors, fieldName);
			!options.keepDirty && unset(_formState.dirtyFields, fieldName);
			!options.keepTouched && unset(_formState.touchedFields, fieldName);
			!options.keepIsValidating && unset(_formState.validatingFields, fieldName);
			!_options.shouldUnregister && !options.keepDefaultValue && unset(_defaultValues, fieldName);
		}
		_subjects.state.next({ values: cloneObject(_formValues) });
		_subjects.state.next({
			..._formState,
			...!options.keepDirty ? {} : { isDirty: _getDirty() }
		});
		!options.keepIsValid && _setValid();
	};
	const _setDisabledField = ({ disabled, name }) => {
		if (isBoolean(disabled) && _state.mount || !!disabled || _names.disabled.has(name)) {
			const disabledStateChanged = _names.disabled.has(name) !== !!disabled;
			disabled ? _names.disabled.add(name) : _names.disabled.delete(name);
			disabledStateChanged && _state.mount && !_state.action && _setValid();
		}
	};
	const register = (name, options = {}) => {
		let field = get(_fields, name);
		const disabledIsDefined = isBoolean(options.disabled) || isBoolean(_options.disabled);
		const shouldRevalidateRemount = !_names.registerName.has(name) && field && field._f && !field._f.mount;
		set(_fields, name, {
			...field || {},
			_f: {
				...field && field._f ? field._f : { ref: { name } },
				name,
				mount: true,
				...options
			}
		});
		_names.mount.add(name);
		if (field && !shouldRevalidateRemount) _setDisabledField({
			disabled: isBoolean(options.disabled) ? options.disabled : _options.disabled,
			name
		});
		else updateValidAndValue(name, true, options.value);
		return {
			...disabledIsDefined ? { disabled: options.disabled || _options.disabled } : {},
			..._options.progressive ? {
				required: !!options.required,
				min: getRuleValue(options.min),
				max: getRuleValue(options.max),
				minLength: getRuleValue(options.minLength),
				maxLength: getRuleValue(options.maxLength),
				pattern: getRuleValue(options.pattern)
			} : {},
			name,
			onChange,
			onBlur: onChange,
			ref: (ref) => {
				if (ref) {
					_names.registerName.add(name);
					register(name, options);
					_names.registerName.delete(name);
					field = get(_fields, name);
					const fieldRef = isUndefined(ref.value) ? ref.querySelectorAll ? ref.querySelectorAll("input,select,textarea")[0] || ref : ref : ref;
					const radioOrCheckbox = isRadioOrCheckbox(fieldRef);
					const refs = field._f.refs || [];
					if (radioOrCheckbox ? refs.find((option) => option === fieldRef) : fieldRef === field._f.ref) return;
					set(_fields, name, { _f: {
						...field._f,
						...radioOrCheckbox ? {
							refs: [
								...refs.filter(live),
								fieldRef,
								...Array.isArray(get(_defaultValues, name)) ? [{}] : []
							],
							ref: {
								type: fieldRef.type,
								name
							}
						} : { ref: fieldRef }
					} });
					updateValidAndValue(name, false, void 0, fieldRef);
				} else {
					field = get(_fields, name, {});
					if (field._f) field._f.mount = false;
					(_options.shouldUnregister || options.shouldUnregister) && !(isNameInFieldArray(_names.array, name) && _state.action) && _names.unMount.add(name);
				}
			}
		};
	};
	const _focusError = () => _options.shouldFocusError && !_options.shouldUseNativeValidation && iterateFieldsByAction(_fields, _focusInput, _names.mount);
	const _disableForm = (disabled) => {
		if (isBoolean(disabled)) {
			_subjects.state.next({ disabled });
			iterateFieldsByAction(_fields, (ref, name) => {
				const currentField = get(_fields, name);
				if (currentField) {
					ref.disabled = currentField._f.disabled || disabled;
					if (Array.isArray(currentField._f.refs)) currentField._f.refs.forEach((inputRef) => {
						inputRef.disabled = currentField._f.disabled || disabled;
					});
				}
			}, 0, false);
		}
	};
	const handleSubmit = (onValid, onInvalid) => async (e) => {
		let onValidError = void 0;
		if (e) {
			e.preventDefault && e.preventDefault();
			e.persist && e.persist();
		}
		let fieldValues = cloneObject(_formValues);
		_subjects.state.next({ isSubmitting: true });
		if (_options.resolver) {
			const { errors, values } = await _runSchema();
			_updateIsValidating();
			_formState.errors = errors;
			fieldValues = cloneObject(values);
		} else await executeBuiltInValidation({
			fields: _fields,
			eventType: EVENTS.SUBMIT
		});
		if (_names.disabled.size) for (const name of _names.disabled) unset(fieldValues, name);
		unset(_formState.errors, ROOT_ERROR_TYPE);
		if (isEmptyObject(_formState.errors)) {
			_subjects.state.next({ errors: {} });
			try {
				await onValid(fieldValues, e);
			} catch (error) {
				onValidError = error;
			}
		} else {
			if (onInvalid) await onInvalid({ ..._formState.errors }, e);
			_focusError();
			setTimeout(_focusError);
		}
		_subjects.state.next({
			isSubmitted: true,
			isSubmitting: false,
			isSubmitSuccessful: isEmptyObject(_formState.errors) && !onValidError,
			submitCount: _formState.submitCount + 1,
			errors: _formState.errors
		});
		if (onValidError) throw onValidError;
	};
	const resetField = (name, options = {}) => {
		if (get(_fields, name)) {
			if (isUndefined(options.defaultValue)) setValue(name, cloneObject(get(_defaultValues, name)));
			else {
				setValue(name, options.defaultValue);
				set(_defaultValues, name, cloneObject(options.defaultValue));
			}
			if (!options.keepTouched) unset(_formState.touchedFields, name);
			if (!options.keepDirty) {
				unset(_formState.dirtyFields, name);
				_formState.isDirty = options.defaultValue ? _getDirty(name, cloneObject(get(_defaultValues, name))) : _getDirty();
			}
			if (!options.keepError) {
				unset(_formState.errors, name);
				_proxyFormState.isValid && _setValid();
			}
			_subjects.state.next({ ..._formState });
		}
	};
	const _reset = (formValues, keepStateOptions = {}) => {
		const updatedValues = formValues ? cloneObject(formValues) : _defaultValues;
		const cloneUpdatedValues = cloneObject(updatedValues);
		const isEmptyResetValues = isEmptyObject(formValues);
		const values = cloneUpdatedValues;
		if (!keepStateOptions.keepDefaultValues) _defaultValues = updatedValues;
		if (!keepStateOptions.keepValues) {
			if (keepStateOptions.keepDirtyValues) {
				const fieldsToCheck = /* @__PURE__ */ new Set([..._names.mount, ...Object.keys(getDirtyFields(_defaultValues, _formValues))]);
				for (const fieldName of Array.from(fieldsToCheck)) {
					const isDirty = get(_formState.dirtyFields, fieldName);
					const existingValue = get(_formValues, fieldName);
					const newValue = get(values, fieldName);
					if (isDirty && !isUndefined(existingValue)) set(values, fieldName, existingValue);
					else if (!isDirty && !isUndefined(newValue)) setValue(fieldName, newValue);
				}
			} else {
				if (isWeb && isUndefined(formValues)) for (const name of _names.mount) {
					const field = get(_fields, name);
					if (field && field._f) {
						const fieldReference = Array.isArray(field._f.refs) ? field._f.refs[0] : field._f.ref;
						if (isHTMLElement(fieldReference)) {
							const form = fieldReference.closest("form");
							if (form) {
								form.reset();
								break;
							}
						}
					}
				}
				if (keepStateOptions.keepFieldsRef) for (const fieldName of _names.mount) setValue(fieldName, get(values, fieldName));
				else _fields = {};
			}
			if (_options.shouldUnregister) {
				_formValues = keepStateOptions.keepDefaultValues ? cloneObject(_defaultValues) : {};
				if (keepStateOptions.keepFieldsRef) for (const fieldName of _names.mount) set(_formValues, fieldName, get(values, fieldName));
			} else _formValues = cloneObject(values);
			_subjects.array.next({ values: { ...values } });
			_subjects.state.next({ values: { ...values } });
		}
		_names = {
			mount: keepStateOptions.keepDirtyValues ? _names.mount : /* @__PURE__ */ new Set(),
			unMount: /* @__PURE__ */ new Set(),
			array: /* @__PURE__ */ new Set(),
			registerName: /* @__PURE__ */ new Set(),
			disabled: /* @__PURE__ */ new Set(),
			watch: /* @__PURE__ */ new Set(),
			watchAll: false,
			focus: ""
		};
		_state.mount = !_proxyFormState.isValid || !!keepStateOptions.keepIsValid || !!keepStateOptions.keepDirtyValues || !_options.shouldUnregister && !isEmptyObject(values);
		_state.watch = !!_options.shouldUnregister;
		_state.keepIsValid = !!keepStateOptions.keepIsValid;
		_state.action = false;
		if (!keepStateOptions.keepErrors) _formState.errors = {};
		_subjects.state.next({
			submitCount: keepStateOptions.keepSubmitCount ? _formState.submitCount : 0,
			isDirty: isEmptyResetValues ? false : keepStateOptions.keepDirty ? _formState.isDirty : keepStateOptions.keepValues ? _getDirty() : !!(keepStateOptions.keepDefaultValues && !deepEqual(formValues, _defaultValues)),
			isSubmitted: keepStateOptions.keepIsSubmitted ? _formState.isSubmitted : false,
			dirtyFields: isEmptyResetValues ? {} : keepStateOptions.keepDirtyValues ? keepStateOptions.keepDefaultValues && _formValues ? getDirtyFields(_defaultValues, _formValues) : _formState.dirtyFields : keepStateOptions.keepDefaultValues && formValues ? getDirtyFields(_defaultValues, formValues) : keepStateOptions.keepDirty ? _formState.dirtyFields : {},
			touchedFields: keepStateOptions.keepTouched ? _formState.touchedFields : {},
			errors: keepStateOptions.keepErrors ? _formState.errors : {},
			isSubmitSuccessful: keepStateOptions.keepIsSubmitSuccessful ? _formState.isSubmitSuccessful : false,
			isSubmitting: false,
			defaultValues: _defaultValues
		});
	};
	const reset = (formValues, keepStateOptions) => _reset(isFunction(formValues) ? formValues(_formValues) : formValues, {
		..._options.resetOptions,
		...keepStateOptions
	});
	const setFocus = (name, options = {}) => {
		const field = get(_fields, name);
		const fieldReference = field && field._f;
		if (fieldReference) {
			const fieldRef = fieldReference.refs ? fieldReference.refs[0] : fieldReference.ref;
			if (fieldRef.focus) setTimeout(() => {
				fieldRef.focus();
				options.shouldSelect && isFunction(fieldRef.select) && fieldRef.select();
			});
		}
	};
	const _setFormState = (updatedFormState) => {
		_formState = {
			..._formState,
			...updatedFormState
		};
	};
	const _resetDefaultValues = () => isFunction(_options.defaultValues) && _options.defaultValues().then((values) => {
		reset(values, _options.resetOptions);
		_subjects.state.next({ isLoading: false });
	});
	const resetDefaultValues = (values, options = {}) => {
		_defaultValues = cloneObject(values);
		if (!options.keepDirty) {
			const newDirtyFields = getDirtyFields(_defaultValues, _formValues);
			_formState.dirtyFields = newDirtyFields;
			_formState.isDirty = !isEmptyObject(newDirtyFields);
		}
		if (!options.keepIsValid) _setValid();
		_subjects.state.next({
			..._formState,
			defaultValues: _defaultValues
		});
	};
	const methods = {
		control: {
			register,
			unregister,
			getFieldState,
			handleSubmit,
			setError,
			_subscribe,
			_runSchema,
			_updateIsValidating,
			_focusError,
			_getWatch,
			_getDirty,
			_setValid,
			_setFieldArray,
			_setDisabledField,
			_setErrors,
			_getFieldArray,
			_reset,
			_resetDefaultValues,
			_removeUnmounted,
			_disableForm,
			_subjects,
			_proxyFormState,
			get _fields() {
				return _fields;
			},
			get _formValues() {
				return _formValues;
			},
			get _state() {
				return _state;
			},
			set _state(value) {
				_state = value;
			},
			get _defaultValues() {
				return _defaultValues;
			},
			get _names() {
				return _names;
			},
			set _names(value) {
				_names = value;
			},
			get _formState() {
				return _formState;
			},
			get _options() {
				return _options;
			},
			set _options(value) {
				_options = {
					..._options,
					...value
				};
			}
		},
		subscribe,
		trigger,
		register,
		handleSubmit,
		watch,
		setValue,
		setValues,
		getValues,
		reset,
		resetField,
		resetDefaultValues,
		clearErrors,
		unregister,
		setError,
		setFocus,
		getFieldState
	};
	return {
		...methods,
		formControl: methods
	};
}
var generateId = () => {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	const d = typeof performance === "undefined" ? Date.now() : performance.now() * 1e3;
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16 + d) % 16 | 0;
		return (c == "x" ? r : r & 3 | 8).toString(16);
	});
};
var getFocusFieldName = (name, index, options = {}) => options.shouldFocus || isUndefined(options.shouldFocus) ? options.focusName || `${name}.${isUndefined(options.focusIndex) ? index : options.focusIndex}.` : "";
var appendAt = (data, value) => [...data, ...convertToArrayPayload(value)];
var fillEmptyArray = (value) => Array.isArray(value) ? value.map(() => void 0) : void 0;
function insert(data, index, value) {
	return [
		...data.slice(0, index),
		...convertToArrayPayload(value),
		...data.slice(index)
	];
}
var moveArrayAt = (data, from, to) => {
	if (!Array.isArray(data)) return [];
	if (isUndefined(data[to])) data[to] = void 0;
	data.splice(to, 0, data.splice(from, 1)[0]);
	return data;
};
var prependAt = (data, value) => [...convertToArrayPayload(value), ...convertToArrayPayload(data)];
function removeAtIndexes(data, indexes) {
	let i = 0;
	const temp = [...data];
	for (const index of indexes) {
		temp.splice(index - i, 1);
		i++;
	}
	return compact(temp).length ? temp : [];
}
var removeArrayAt = (data, index) => isUndefined(index) ? [] : removeAtIndexes(data, convertToArrayPayload(index).sort((a, b) => a - b));
var swapArrayAt = (data, indexA, indexB) => {
	[data[indexA], data[indexB]] = [data[indexB], data[indexA]];
};
var updateAt = (fieldValues, index, value) => {
	fieldValues[index] = value;
	return fieldValues;
};
/**
* A custom hook that exposes convenient methods to perform operations with a list of dynamic inputs that need to be appended, updated, removed etc. • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn) • [Video](https://youtu.be/4MrbfGSFY2A)
*
* @remarks
* [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn)
*
* @param props - useFieldArray props
*
* @returns methods - functions to manipulate with the Field Arrays (dynamic inputs) {@link UseFieldArrayReturn}
*
* @example
* ```tsx
* function App() {
*   const { register, control, handleSubmit, reset, trigger, setError } = useForm({
*     defaultValues: {
*       test: []
*     }
*   });
*   const { fields, append } = useFieldArray({
*     control,
*     name: "test"
*   });
*
*   return (
*     <form onSubmit={handleSubmit(data => console.log(data))}>
*       {fields.map((item, index) => (
*          <input key={item.id} {...register(`test.${index}.firstName`)}  />
*       ))}
*       <button type="button" onClick={() => append({ firstName: "bill" })}>
*         append
*       </button>
*       <input type="submit" />
*     </form>
*   );
* }
* ```
*/
function useFieldArray(props) {
	const formControl = useFormControlContext();
	const { control = formControl, name, keyName = "id", shouldUnregister, rules } = props;
	const [fields, setFields] = import_react.useState(control._getFieldArray(name));
	const ids = import_react.useRef(control._getFieldArray(name).map(generateId));
	const _actioned = import_react.useRef(false);
	control._names.array.add(name);
	import_react.useMemo(() => rules && fields.length >= 0 && control.register(name, rules), [
		control,
		name,
		fields.length,
		rules
	]);
	useIsomorphicLayoutEffect(() => control._subjects.array.subscribe({ next: ({ values, name: fieldArrayName }) => {
		if (fieldArrayName === name || !fieldArrayName) {
			const fieldValues = get(values, name);
			if (Array.isArray(fieldValues)) {
				setFields(fieldValues);
				ids.current = fieldValues.map(generateId);
			} else if (!fieldArrayName) {
				setFields([]);
				ids.current = [];
			}
		}
	} }).unsubscribe, [control, name]);
	const updateValues = import_react.useCallback((updatedFieldArrayValues) => {
		_actioned.current = true;
		control._setFieldArray(name, updatedFieldArrayValues);
	}, [control, name]);
	const append = (value, options) => {
		const appendValue = convertToArrayPayload(cloneObject(value));
		const updatedFieldArrayValues = appendAt(control._getFieldArray(name), appendValue);
		control._names.focus = getFocusFieldName(name, updatedFieldArrayValues.length - 1, options);
		ids.current = appendAt(ids.current, appendValue.map(generateId));
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		control._setFieldArray(name, updatedFieldArrayValues, appendAt, { argA: fillEmptyArray(value) });
	};
	const prepend = (value, options) => {
		const prependValue = convertToArrayPayload(cloneObject(value));
		const updatedFieldArrayValues = prependAt(control._getFieldArray(name), prependValue);
		control._names.focus = getFocusFieldName(name, 0, options);
		ids.current = prependAt(ids.current, prependValue.map(generateId));
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		control._setFieldArray(name, updatedFieldArrayValues, prependAt, { argA: fillEmptyArray(value) });
	};
	const remove = (index) => {
		const updatedFieldArrayValues = removeArrayAt(control._getFieldArray(name), index);
		ids.current = removeArrayAt(ids.current, index);
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		!Array.isArray(get(control._fields, name)) && set(control._fields, name, void 0);
		control._setFieldArray(name, updatedFieldArrayValues, removeArrayAt, { argA: index });
	};
	const insert$1 = (index, value, options) => {
		const insertValue = convertToArrayPayload(cloneObject(value));
		const updatedFieldArrayValues = insert(control._getFieldArray(name), index, insertValue);
		control._names.focus = getFocusFieldName(name, index, options);
		ids.current = insert(ids.current, index, insertValue.map(generateId));
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		control._setFieldArray(name, updatedFieldArrayValues, insert, {
			argA: index,
			argB: fillEmptyArray(value)
		});
	};
	const swap = (indexA, indexB) => {
		const updatedFieldArrayValues = control._getFieldArray(name);
		swapArrayAt(updatedFieldArrayValues, indexA, indexB);
		swapArrayAt(ids.current, indexA, indexB);
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		control._setFieldArray(name, updatedFieldArrayValues, swapArrayAt, {
			argA: indexA,
			argB: indexB
		}, false);
	};
	const move = (from, to) => {
		const updatedFieldArrayValues = control._getFieldArray(name);
		moveArrayAt(updatedFieldArrayValues, from, to);
		moveArrayAt(ids.current, from, to);
		updateValues(updatedFieldArrayValues);
		setFields(updatedFieldArrayValues);
		control._setFieldArray(name, updatedFieldArrayValues, moveArrayAt, {
			argA: from,
			argB: to
		}, false);
	};
	const update = (index, value) => {
		const updateValue = cloneObject(value);
		const updatedFieldArrayValues = updateAt(control._getFieldArray(name), index, updateValue);
		ids.current = [...updatedFieldArrayValues].map((item, i) => !item || i === index ? generateId() : ids.current[i]);
		updateValues(updatedFieldArrayValues);
		setFields([...updatedFieldArrayValues]);
		control._setFieldArray(name, updatedFieldArrayValues, updateAt, {
			argA: index,
			argB: updateValue
		}, true, false);
	};
	const replace = (value) => {
		const updatedFieldArrayValues = convertToArrayPayload(cloneObject(value));
		ids.current = updatedFieldArrayValues.map(generateId);
		updateValues([...updatedFieldArrayValues]);
		setFields([...updatedFieldArrayValues]);
		control._setFieldArray(name, [...updatedFieldArrayValues], (data) => data, {}, true, false);
	};
	import_react.useEffect(() => {
		control._state.action = false;
		isWatched(name, control._names) && control._subjects.state.next({ ...control._formState });
		const validationModes = getValidationModes(control._options.mode);
		if (_actioned.current && (!validationModes.isOnSubmit || control._formState.isSubmitted) && !getValidationModes(control._options.reValidateMode).isOnSubmit && !validationModes.isOnBlur) if (control._options.resolver) control._runSchema([name]).then((result) => {
			control._updateIsValidating([name]);
			const error = get(result.errors, name);
			const existingError = get(control._formState.errors, name);
			if (existingError ? !error && existingError.type || error && (existingError.type !== error.type || existingError.message !== error.message) : error && error.type) {
				error ? set(control._formState.errors, name, error) : unset(control._formState.errors, name);
				control._subjects.state.next({ errors: control._formState.errors });
			}
		});
		else {
			const field = get(control._fields, name);
			if (field && field._f && !(getValidationModes(control._options.reValidateMode).isOnSubmit && getValidationModes(control._options.mode).isOnSubmit)) validateField(field, control._names.disabled, control._formValues, control._options.criteriaMode === VALIDATION_MODE.all, control._options.shouldUseNativeValidation, true).then((error) => !isEmptyObject(error) && control._subjects.state.next({ errors: updateFieldArrayRootError(control._formState.errors, error, name) }));
		}
		control._subjects.state.next({
			name,
			values: cloneObject(control._formValues)
		});
		control._names.focus && iterateFieldsByAction(control._fields, (ref, key) => {
			if (control._names.focus && key.startsWith(control._names.focus) && ref.focus) {
				ref.focus();
				return 1;
			}
		});
		control._names.focus = "";
		control._setValid();
		_actioned.current = false;
	}, [
		fields,
		name,
		control
	]);
	import_react.useEffect(() => {
		!get(control._formValues, name) && control._setFieldArray(name);
		return () => {
			const shouldKeepFieldArrayValues = !(control._options.shouldUnregister || shouldUnregister);
			const updateMounted = (name, value) => {
				const field = get(control._fields, name);
				if (field && field._f) field._f.mount = value;
			};
			if (_actioned.current && shouldKeepFieldArrayValues) control._subjects.state.next({
				name,
				values: cloneObject(control._formValues)
			});
			shouldKeepFieldArrayValues ? updateMounted(name, false) : control.unregister(name);
		};
	}, [
		name,
		control,
		keyName,
		shouldUnregister
	]);
	return {
		swap: import_react.useCallback(swap, [
			updateValues,
			name,
			control
		]),
		move: import_react.useCallback(move, [
			updateValues,
			name,
			control
		]),
		prepend: import_react.useCallback(prepend, [
			updateValues,
			name,
			control
		]),
		append: import_react.useCallback(append, [
			updateValues,
			name,
			control
		]),
		remove: import_react.useCallback(remove, [
			updateValues,
			name,
			control
		]),
		insert: import_react.useCallback(insert$1, [
			updateValues,
			name,
			control
		]),
		update: import_react.useCallback(update, [
			updateValues,
			name,
			control
		]),
		replace: import_react.useCallback(replace, [
			updateValues,
			name,
			control
		]),
		fields: import_react.useMemo(() => fields.map((field, index) => ({
			...field,
			[keyName]: ids.current[index] || generateId()
		})), [fields, keyName])
	};
}
/**
* Custom hook to manage the entire form.
*
* @remarks
* [API](https://react-hook-form.com/docs/useform) • [Demo](https://codesandbox.io/s/react-hook-form-get-started-ts-5ksmm) • [Video](https://www.youtube.com/watch?v=RkXv4AXXC_4)
*
* @param props - form configuration and validation parameters.
*
* @returns methods - individual functions to manage the form state. {@link UseFormReturn}
*
* @example
* ```tsx
* function App() {
*   const { register, handleSubmit, watch, formState: { errors } } = useForm();
*   const onSubmit = data => console.log(data);
*
*   console.log(watch("example"));
*
*   return (
*     <form onSubmit={handleSubmit(onSubmit)}>
*       <input defaultValue="test" {...register("example")} />
*       <input {...register("exampleRequired", { required: true })} />
*       {errors.exampleRequired && <span>This field is required</span>}
*       <button>Submit</button>
*     </form>
*   );
* }
* ```
*/
function useForm(props = {}) {
	const _formControl = import_react.useRef(void 0);
	const _values = import_react.useRef(void 0);
	const [formState, updateFormState] = import_react.useState(() => ({
		...cloneObject(DEFAULT_FORM_STATE),
		isLoading: isFunction(props.defaultValues),
		errors: props.errors || {},
		disabled: props.disabled || false,
		defaultValues: isFunction(props.defaultValues) ? void 0 : props.defaultValues
	}));
	if (!_formControl.current) if (props.formControl) {
		_formControl.current = {
			...props.formControl,
			formState
		};
		if (props.defaultValues && !isFunction(props.defaultValues)) props.formControl.reset(props.defaultValues, props.resetOptions);
	} else {
		const { formControl, ...rest } = createFormControl(props);
		_formControl.current = {
			...rest,
			formState
		};
	}
	const control = _formControl.current.control;
	control._options = props;
	useIsomorphicLayoutEffect(() => {
		const sub = control._subscribe({
			formState: control._proxyFormState,
			callback: () => updateFormState({
				...control._formState,
				defaultValues: control._defaultValues
			}),
			reRenderRoot: true
		});
		updateFormState((data) => ({
			...data,
			isReady: true
		}));
		control._formState.isReady = true;
		return sub;
	}, [control]);
	import_react.useEffect(() => control._disableForm(props.disabled), [control, props.disabled]);
	import_react.useEffect(() => {
		if (props.mode) control._options.mode = props.mode;
		if (props.reValidateMode) control._options.reValidateMode = props.reValidateMode;
	}, [
		control,
		props.mode,
		props.reValidateMode
	]);
	import_react.useEffect(() => {
		if (props.errors) {
			control._setErrors(props.errors);
			control._focusError();
		}
	}, [control, props.errors]);
	import_react.useEffect(() => {
		props.shouldUnregister && control._subjects.state.next({ values: control._getWatch() });
	}, [control, props.shouldUnregister]);
	import_react.useEffect(() => {
		if (control._proxyFormState.isDirty) {
			const isDirty = control._getDirty();
			if (isDirty !== formState.isDirty) control._subjects.state.next({ isDirty });
		}
	}, [control, formState.isDirty]);
	import_react.useEffect(() => {
		var _a;
		if (props.values && !deepEqual(props.values, _values.current)) {
			control._reset(props.values, {
				keepFieldsRef: true,
				...control._options.resetOptions
			});
			if (!((_a = control._options.resetOptions) === null || _a === void 0 ? void 0 : _a.keepIsValid)) control._setValid();
			_values.current = props.values;
			updateFormState((state) => ({ ...state }));
		} else control._resetDefaultValues();
	}, [control, props.values]);
	import_react.useEffect(() => {
		if (!control._state.mount) {
			control._setValid();
			control._state.mount = true;
		}
		if (control._state.watch) {
			control._state.watch = false;
			control._subjects.state.next({ ...control._formState });
		}
		control._removeUnmounted();
	});
	_formControl.current.formState = import_react.useMemo(() => getProxyFormState(formState, control), [control, formState]);
	return _formControl.current;
}
/**
* Watch component that subscribes to form field changes and re-renders when watched fields update.
*
* @param control - The form control object from useForm
* @param name - Can be field name, array of field names, or undefined to watch the entire form
* @param disabled - Disable subscription
* @param exact - Whether to watch exact field names or not
* @param defaultValue - The default value to use if the field is not yet set
* @param compute - Function to compute derived values from watched fields
* @param render - The function that receives watched values and returns ReactNode
* @returns The result of calling render function with watched values
*
* @example
* The `Watch` component only re-render when the values of `foo`, `bar`, and `baz.qux` change.
* The types of `foo`, `bar`, and `baz.qux` are precisely inferred.
*
* ```tsx
* const { control } = useForm();
*
* <Watch
*   control={control}
*   names={['foo', 'bar', 'baz.qux']}
*   render={([foo, bar, baz_qux]) => <div>{foo}{bar}{baz_qux}</div>}
* />
* ```
*/
var Watch = (props) => props.render(useWatch({
	name: props.names,
	...props
}));
//#endregion
export { Controller, Form, FormProvider, FormStateSubscribe, Watch, appendErrors, createFormControl, get, set, useController, useFieldArray, useForm, useFormContext, useFormState, useWatch };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaG9vay1mb3JtLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL3JlYWN0LWhvb2stZm9ybS9kaXN0L2luZGV4LmVzbS5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxudmFyIGlzQ2hlY2tCb3hJbnB1dCA9IChlbGVtZW50KSA9PiBlbGVtZW50LnR5cGUgPT09ICdjaGVja2JveCc7XG5cbnZhciBpc0RhdGVPYmplY3QgPSAodmFsdWUpID0+IHZhbHVlIGluc3RhbmNlb2YgRGF0ZTtcblxudmFyIGlzTnVsbE9yVW5kZWZpbmVkID0gKHZhbHVlKSA9PiB2YWx1ZSA9PSBudWxsO1xuXG5jb25zdCBpc09iamVjdFR5cGUgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG52YXIgaXNPYmplY3QgPSAodmFsdWUpID0+ICFpc051bGxPclVuZGVmaW5lZCh2YWx1ZSkgJiZcbiAgICAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICBpc09iamVjdFR5cGUodmFsdWUpICYmXG4gICAgIWlzRGF0ZU9iamVjdCh2YWx1ZSk7XG5cbnZhciBnZXRFdmVudFZhbHVlID0gKGV2ZW50KSA9PiBpc09iamVjdChldmVudCkgJiYgZXZlbnQudGFyZ2V0XG4gICAgPyBpc0NoZWNrQm94SW5wdXQoZXZlbnQudGFyZ2V0KVxuICAgICAgICA/IGV2ZW50LnRhcmdldC5jaGVja2VkXG4gICAgICAgIDogZXZlbnQudGFyZ2V0LnZhbHVlXG4gICAgOiBldmVudDtcblxudmFyIGlzTmFtZUluRmllbGRBcnJheSA9IChuYW1lcywgbmFtZSkgPT4gbmFtZVxuICAgIC5zcGxpdCgnLicpXG4gICAgLnNvbWUoKHBhcnQsIGluZGV4LCBhcnIpID0+ICFpc05hTihOdW1iZXIocGFydCkpICYmIG5hbWVzLmhhcyhhcnIuc2xpY2UoMCwgaW5kZXgpLmpvaW4oJy4nKSkpO1xuXG52YXIgaXNQbGFpbk9iamVjdCA9ICh0ZW1wT2JqZWN0KSA9PiB7XG4gICAgY29uc3QgcHJvdG90eXBlQ29weSA9IHRlbXBPYmplY3QuY29uc3RydWN0b3IgJiYgdGVtcE9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIChpc09iamVjdChwcm90b3R5cGVDb3B5KSAmJiBwcm90b3R5cGVDb3B5Lmhhc093blByb3BlcnR5KCdpc1Byb3RvdHlwZU9mJykpO1xufTtcblxudmFyIGlzV2ViID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LkhUTUxFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5cbmZ1bmN0aW9uIGNsb25lT2JqZWN0KGRhdGEpIHtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGRhdGEpO1xuICAgIH1cbiAgICBjb25zdCBpc0ZpbGVMaXN0SW5zdGFuY2UgPSB0eXBlb2YgRmlsZUxpc3QgIT09ICd1bmRlZmluZWQnICYmIGRhdGEgaW5zdGFuY2VvZiBGaWxlTGlzdDtcbiAgICBpZiAoaXNXZWIgJiYgKGRhdGEgaW5zdGFuY2VvZiBCbG9iIHx8IGlzRmlsZUxpc3RJbnN0YW5jZSkpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGRhdGEpO1xuICAgIGlmICghaXNBcnJheSAmJiAhKGlzT2JqZWN0KGRhdGEpICYmIGlzUGxhaW5PYmplY3QoZGF0YSkpKSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBjb25zdCBjb3B5ID0gaXNBcnJheSA/IFtdIDogT2JqZWN0LmNyZWF0ZShPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGF0YSkpO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICBjb3B5W2tleV0gPSBjbG9uZU9iamVjdChkYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xufVxuXG5jb25zdCBFVkVOVFMgPSB7XG4gICAgQkxVUjogJ2JsdXInLFxuICAgIEZPQ1VTX09VVDogJ2ZvY3Vzb3V0JyxcbiAgICBDSEFOR0U6ICdjaGFuZ2UnLFxuICAgIFNVQk1JVDogJ3N1Ym1pdCcsXG4gICAgVFJJR0dFUjogJ3RyaWdnZXInLFxuICAgIFZBTElEOiAndmFsaWQnLFxufTtcbmNvbnN0IFZBTElEQVRJT05fTU9ERSA9IHtcbiAgICBvbkJsdXI6ICdvbkJsdXInLFxuICAgIG9uQ2hhbmdlOiAnb25DaGFuZ2UnLFxuICAgIG9uU3VibWl0OiAnb25TdWJtaXQnLFxuICAgIG9uVG91Y2hlZDogJ29uVG91Y2hlZCcsXG4gICAgYWxsOiAnYWxsJyxcbn07XG5jb25zdCBJTlBVVF9WQUxJREFUSU9OX1JVTEVTID0ge1xuICAgIG1heDogJ21heCcsXG4gICAgbWluOiAnbWluJyxcbiAgICBtYXhMZW5ndGg6ICdtYXhMZW5ndGgnLFxuICAgIG1pbkxlbmd0aDogJ21pbkxlbmd0aCcsXG4gICAgcGF0dGVybjogJ3BhdHRlcm4nLFxuICAgIHJlcXVpcmVkOiAncmVxdWlyZWQnLFxuICAgIHZhbGlkYXRlOiAndmFsaWRhdGUnLFxufTtcbmNvbnN0IEZPUk1fRVJST1JfVFlQRSA9ICdmb3JtJztcbmNvbnN0IFJPT1RfRVJST1JfVFlQRSA9ICdyb290JztcbmNvbnN0IFBST1RPVFlQRV9LRVlXT1JEUyA9IFsnX19wcm90b19fJywgJ2NvbnN0cnVjdG9yJywgJ3Byb3RvdHlwZSddO1xuXG52YXIgaXNLZXkgPSAodmFsdWUpID0+IC9eXFx3KiQvLnRlc3QodmFsdWUpO1xuXG52YXIgaXNVbmRlZmluZWQgPSAodmFsKSA9PiB2YWwgPT09IHVuZGVmaW5lZDtcblxudmFyIHN0cmluZ1RvUGF0aCA9IChpbnB1dCkgPT4gaW5wdXQuc3BsaXQoL1suW1xcXSdcIl0vZykuZmlsdGVyKEJvb2xlYW4pO1xuXG52YXIgZ2V0ID0gKG9iamVjdCwgcGF0aCwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKCFwYXRoIHx8ICFpc09iamVjdChvYmplY3QpKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IHBhdGhzID0gaXNLZXkocGF0aCkgPyBbcGF0aF0gOiBzdHJpbmdUb1BhdGgocGF0aCk7XG4gICAgaWYgKHBhdGhzLnNvbWUoKGtleSkgPT4gUFJPVE9UWVBFX0tFWVdPUkRTLmluY2x1ZGVzKGtleSkpKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHBhdGhzLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcbiAgICAgICAgcmV0dXJuIGlzTnVsbE9yVW5kZWZpbmVkKHJlc3VsdCkgPyB1bmRlZmluZWQgOiByZXN1bHRba2V5XTtcbiAgICB9LCBvYmplY3QpO1xuICAgIHJldHVybiBpc1VuZGVmaW5lZChyZXN1bHQpIHx8IHJlc3VsdCA9PT0gb2JqZWN0XG4gICAgICAgID8gaXNVbmRlZmluZWQob2JqZWN0W3BhdGhdKVxuICAgICAgICAgICAgPyBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgIDogb2JqZWN0W3BhdGhdXG4gICAgICAgIDogcmVzdWx0O1xufTtcblxudmFyIGlzQm9vbGVhbiA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG5cbnZhciBpc0Z1bmN0aW9uID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG5cbnZhciBzZXQgPSAob2JqZWN0LCBwYXRoLCB2YWx1ZSkgPT4ge1xuICAgIGxldCBpbmRleCA9IC0xO1xuICAgIGNvbnN0IHRlbXBQYXRoID0gaXNLZXkocGF0aCkgPyBbcGF0aF0gOiBzdHJpbmdUb1BhdGgocGF0aCk7XG4gICAgY29uc3QgbGVuZ3RoID0gdGVtcFBhdGgubGVuZ3RoO1xuICAgIGNvbnN0IGxhc3RJbmRleCA9IGxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gdGVtcFBhdGhbaW5kZXhdO1xuICAgICAgICBsZXQgbmV3VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9ialZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICBuZXdWYWx1ZSA9XG4gICAgICAgICAgICAgICAgaXNPYmplY3Qob2JqVmFsdWUpIHx8IEFycmF5LmlzQXJyYXkob2JqVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgID8gb2JqVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgOiAhaXNOYU4oK3RlbXBQYXRoW2luZGV4ICsgMV0pXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHt9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChQUk9UT1RZUEVfS0VZV09SRFMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9iamVjdFtrZXldID0gbmV3VmFsdWU7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICAgIH1cbn07XG5cbi8qKlxuICogU2VwYXJhdGUgY29udGV4dCBmb3IgYGNvbnRyb2xgIHRvIHByZXZlbnQgdW5uZWNlc3NhcnkgcmVyZW5kZXJzLlxuICogSW50ZXJuYWwgaG9va3MgdGhhdCBvbmx5IG5lZWQgY29udHJvbCB1c2UgdGhpcyBpbnN0ZWFkIG9mIGZ1bGwgZm9ybSBjb250ZXh0LlxuICovXG5jb25zdCBIb29rRm9ybUNvbnRyb2xDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChudWxsKTtcbkhvb2tGb3JtQ29udHJvbENvbnRleHQuZGlzcGxheU5hbWUgPSAnSG9va0Zvcm1Db250cm9sQ29udGV4dCc7XG4vKipcbiAqIEBpbnRlcm5hbCBJbnRlcm5hbCBob29rIHRvIGFjY2VzcyBvbmx5IGNvbnRyb2wgZnJvbSBjb250ZXh0LlxuICovXG5jb25zdCB1c2VGb3JtQ29udHJvbENvbnRleHQgPSAoKSA9PiBSZWFjdC51c2VDb250ZXh0KEhvb2tGb3JtQ29udHJvbENvbnRleHQpO1xuXG52YXIgZ2V0UHJveHlGb3JtU3RhdGUgPSAoZm9ybVN0YXRlLCBjb250cm9sLCBsb2NhbFByb3h5Rm9ybVN0YXRlLCBpc1Jvb3QgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybVN0YXRlKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXN1bHQsIGtleSwge1xuICAgICAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgX2tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbC5fcHJveHlGb3JtU3RhdGVbX2tleV0gIT09IFZBTElEQVRJT05fTU9ERS5hbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbC5fcHJveHlGb3JtU3RhdGVbX2tleV0gPSAhaXNSb290IHx8IFZBTElEQVRJT05fTU9ERS5hbGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxvY2FsUHJveHlGb3JtU3RhdGUgJiYgKGxvY2FsUHJveHlGb3JtU3RhdGVbX2tleV0gPSB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybVN0YXRlW19rZXldO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0ID0gaXNXZWJcbiAgICA/IFJlYWN0LnVzZUxheW91dEVmZmVjdFxuICAgIDogUmVhY3QudXNlRWZmZWN0O1xuXG4vKipcbiAqIFRoaXMgY3VzdG9tIGhvb2sgYWxsb3dzIHlvdSB0byBzdWJzY3JpYmUgdG8gZWFjaCBmb3JtIHN0YXRlLCBhbmQgaXNvbGF0ZSB0aGUgcmUtcmVuZGVyIGF0IHRoZSBjdXN0b20gaG9vayBsZXZlbC4gSXQgaGFzIGl0cyBzY29wZSBpbiB0ZXJtcyBvZiBmb3JtIHN0YXRlIHN1YnNjcmlwdGlvbiwgc28gaXQgd291bGQgbm90IGFmZmVjdCBvdGhlciB1c2VGb3JtU3RhdGUgYW5kIHVzZUZvcm0uIFVzaW5nIHRoaXMgaG9vayBjYW4gcmVkdWNlIHRoZSByZS1yZW5kZXIgaW1wYWN0IG9uIGxhcmdlIGFuZCBjb21wbGV4IGZvcm0gYXBwbGljYXRpb24uXG4gKlxuICogQHJlbWFya3NcbiAqIFtBUEldKGh0dHBzOi8vcmVhY3QtaG9vay1mb3JtLmNvbS9kb2NzL3VzZWZvcm1zdGF0ZSkg4oCiIFtEZW1vXShodHRwczovL2NvZGVzYW5kYm94LmlvL3MvdXNlZm9ybXN0YXRlLTc1eGx5KVxuICpcbiAqIEBwYXJhbSBwcm9wcyAtIGluY2x1ZGUgb3B0aW9ucyBvbiBzcGVjaWZ5IGZpZWxkcyB0byBzdWJzY3JpYmUuIHtAbGluayBVc2VGb3JtU3RhdGVSZXR1cm59XG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogZnVuY3Rpb24gQXBwKCkge1xuICogICBjb25zdCB7IHJlZ2lzdGVyLCBoYW5kbGVTdWJtaXQsIGNvbnRyb2wgfSA9IHVzZUZvcm0oe1xuICogICAgIGRlZmF1bHRWYWx1ZXM6IHtcbiAqICAgICBmaXJzdE5hbWU6IFwiZmlyc3ROYW1lXCJcbiAqICAgfX0pO1xuICogICBjb25zdCB7IGRpcnR5RmllbGRzIH0gPSB1c2VGb3JtU3RhdGUoe1xuICogICAgIGNvbnRyb2xcbiAqICAgfSk7XG4gKiAgIGNvbnN0IG9uU3VibWl0ID0gKGRhdGEpID0+IGNvbnNvbGUubG9nKGRhdGEpO1xuICpcbiAqICAgcmV0dXJuIChcbiAqICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KG9uU3VibWl0KX0+XG4gKiAgICAgICA8aW5wdXQgey4uLnJlZ2lzdGVyKFwiZmlyc3ROYW1lXCIpfSBwbGFjZWhvbGRlcj1cIkZpcnN0IE5hbWVcIiAvPlxuICogICAgICAge2RpcnR5RmllbGRzLmZpcnN0TmFtZSAmJiA8cD5GaWVsZCBpcyBkaXJ0eS48L3A+fVxuICogICAgICAgPGlucHV0IHR5cGU9XCJzdWJtaXRcIiAvPlxuICogICAgIDwvZm9ybT5cbiAqICAgKTtcbiAqIH1cbiAqIGBgYFxuICovXG5mdW5jdGlvbiB1c2VGb3JtU3RhdGUocHJvcHMpIHtcbiAgICBjb25zdCBmb3JtQ29udHJvbCA9IHVzZUZvcm1Db250cm9sQ29udGV4dCgpO1xuICAgIGNvbnN0IHsgY29udHJvbCA9IGZvcm1Db250cm9sLCBkaXNhYmxlZCwgbmFtZSwgZXhhY3QgfSA9IHByb3BzIHx8IHt9O1xuICAgIGNvbnN0IFtmb3JtU3RhdGUsIHVwZGF0ZUZvcm1TdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgoKSA9PiAoe1xuICAgICAgICAuLi5jb250cm9sLl9mb3JtU3RhdGUsXG4gICAgICAgIGRlZmF1bHRWYWx1ZXM6IGNvbnRyb2wuX2RlZmF1bHRWYWx1ZXMsXG4gICAgfSkpO1xuICAgIGNvbnN0IF9sb2NhbFByb3h5Rm9ybVN0YXRlID0gUmVhY3QudXNlUmVmKHtcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXG4gICAgICAgIGlzTG9hZGluZzogZmFsc2UsXG4gICAgICAgIGRpcnR5RmllbGRzOiBmYWxzZSxcbiAgICAgICAgdG91Y2hlZEZpZWxkczogZmFsc2UsXG4gICAgICAgIHZhbGlkYXRpbmdGaWVsZHM6IGZhbHNlLFxuICAgICAgICBpc1ZhbGlkYXRpbmc6IGZhbHNlLFxuICAgICAgICBpc1ZhbGlkOiBmYWxzZSxcbiAgICAgICAgZXJyb3JzOiBmYWxzZSxcbiAgICB9KTtcbiAgICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IGNvbnRyb2wuX3N1YnNjcmliZSh7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGZvcm1TdGF0ZTogX2xvY2FsUHJveHlGb3JtU3RhdGUuY3VycmVudCxcbiAgICAgICAgZXhhY3QsXG4gICAgICAgIGNhbGxiYWNrOiAoZm9ybVN0YXRlKSA9PiB7XG4gICAgICAgICAgICAhZGlzYWJsZWQgJiZcbiAgICAgICAgICAgICAgICB1cGRhdGVGb3JtU3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAuLi5jb250cm9sLl9mb3JtU3RhdGUsXG4gICAgICAgICAgICAgICAgICAgIC4uLmZvcm1TdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlczogY29udHJvbC5fZGVmYXVsdFZhbHVlcyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9KSwgW25hbWUsIGRpc2FibGVkLCBleGFjdF0pO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIF9sb2NhbFByb3h5Rm9ybVN0YXRlLmN1cnJlbnQuaXNWYWxpZCAmJiBjb250cm9sLl9zZXRWYWxpZCh0cnVlKTtcbiAgICB9LCBbY29udHJvbF0pO1xuICAgIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+IGdldFByb3h5Rm9ybVN0YXRlKGZvcm1TdGF0ZSwgY29udHJvbCwgX2xvY2FsUHJveHlGb3JtU3RhdGUuY3VycmVudCwgZmFsc2UpLCBbZm9ybVN0YXRlLCBjb250cm9sXSk7XG59XG5cbnZhciBpc1N0cmluZyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcblxudmFyIGdlbmVyYXRlV2F0Y2hPdXRwdXQgPSAobmFtZXMsIF9uYW1lcywgZm9ybVZhbHVlcywgaXNHbG9iYWwsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHtcbiAgICAgICAgaXNHbG9iYWwgJiYgX25hbWVzLndhdGNoLmFkZChuYW1lcyk7XG4gICAgICAgIHJldHVybiBnZXQoZm9ybVZhbHVlcywgbmFtZXMsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWVzKSkge1xuICAgICAgICByZXR1cm4gbmFtZXMubWFwKChmaWVsZE5hbWUpID0+IChpc0dsb2JhbCAmJiBfbmFtZXMud2F0Y2guYWRkKGZpZWxkTmFtZSksXG4gICAgICAgICAgICBnZXQoZm9ybVZhbHVlcywgZmllbGROYW1lKSkpO1xuICAgIH1cbiAgICBpc0dsb2JhbCAmJiAoX25hbWVzLndhdGNoQWxsID0gdHJ1ZSk7XG4gICAgcmV0dXJuIGZvcm1WYWx1ZXM7XG59O1xuXG52YXIgaXNQcmltaXRpdmUgPSAodmFsdWUpID0+IGlzTnVsbE9yVW5kZWZpbmVkKHZhbHVlKSB8fCAhaXNPYmplY3RUeXBlKHZhbHVlKTtcblxuZnVuY3Rpb24gZGVlcEVxdWFsKG9iamVjdDEsIG9iamVjdDIsIHZpc2l0ZWQgPSBuZXcgV2Vha1NldCgpKSB7XG4gICAgaWYgKG9iamVjdDEgPT09IG9iamVjdDIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChpc1ByaW1pdGl2ZShvYmplY3QxKSB8fCBpc1ByaW1pdGl2ZShvYmplY3QyKSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmlzKG9iamVjdDEsIG9iamVjdDIpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlT2JqZWN0KG9iamVjdDEpICYmIGlzRGF0ZU9iamVjdChvYmplY3QyKSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmlzKG9iamVjdDEuZ2V0VGltZSgpLCBvYmplY3QyLmdldFRpbWUoKSk7XG4gICAgfVxuICAgIGNvbnN0IGtleXMxID0gT2JqZWN0LmtleXMob2JqZWN0MSk7XG4gICAgY29uc3Qga2V5czIgPSBPYmplY3Qua2V5cyhvYmplY3QyKTtcbiAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBrZXlzMi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodmlzaXRlZC5oYXMob2JqZWN0MSkgfHwgdmlzaXRlZC5oYXMob2JqZWN0MikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHZpc2l0ZWQuYWRkKG9iamVjdDEpO1xuICAgIHZpc2l0ZWQuYWRkKG9iamVjdDIpO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMxKSB7XG4gICAgICAgIGNvbnN0IHZhbDEgPSBvYmplY3QxW2tleV07XG4gICAgICAgIGlmICghKGtleSBpbiBvYmplY3QyKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgIT09ICdyZWYnKSB7XG4gICAgICAgICAgICBjb25zdCB2YWwyID0gb2JqZWN0MltrZXldO1xuICAgICAgICAgICAgaWYgKChpc0RhdGVPYmplY3QodmFsMSkgJiYgaXNEYXRlT2JqZWN0KHZhbDIpKSB8fFxuICAgICAgICAgICAgICAgICgoaXNPYmplY3QodmFsMSkgfHwgQXJyYXkuaXNBcnJheSh2YWwxKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGlzT2JqZWN0KHZhbDIpIHx8IEFycmF5LmlzQXJyYXkodmFsMikpKVxuICAgICAgICAgICAgICAgID8gIWRlZXBFcXVhbCh2YWwxLCB2YWwyLCB2aXNpdGVkKVxuICAgICAgICAgICAgICAgIDogIU9iamVjdC5pcyh2YWwxLCB2YWwyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDdXN0b20gaG9vayB0byBzdWJzY3JpYmUgdG8gZmllbGQgY2hhbmdlIGFuZCBpc29sYXRlIHJlLXJlbmRlcmluZyBhdCB0aGUgY29tcG9uZW50IGxldmVsLlxuICpcbiAqIEByZW1hcmtzXG4gKlxuICogW0FQSV0oaHR0cHM6Ly9yZWFjdC1ob29rLWZvcm0uY29tL2RvY3MvdXNld2F0Y2gpIOKAoiBbRGVtb10oaHR0cHM6Ly9jb2Rlc2FuZGJveC5pby9zL3JlYWN0LWhvb2stZm9ybS12Ny10cy11c2V3YXRjaC1oOWk1ZSlcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBjb25zdCB7IGNvbnRyb2wgfSA9IHVzZUZvcm0oKTtcbiAqIGNvbnN0IHZhbHVlcyA9IHVzZVdhdGNoKHtcbiAqICAgbmFtZTogXCJmaWVsZE5hbWVcIlxuICogICBjb250cm9sLFxuICogfSlcbiAqIGBgYFxuICovXG5mdW5jdGlvbiB1c2VXYXRjaChwcm9wcykge1xuICAgIGNvbnN0IGZvcm1Db250cm9sID0gdXNlRm9ybUNvbnRyb2xDb250ZXh0KCk7XG4gICAgY29uc3QgeyBjb250cm9sID0gZm9ybUNvbnRyb2wsIG5hbWUsIGRlZmF1bHRWYWx1ZSwgZGlzYWJsZWQsIGV4YWN0LCBjb21wdXRlLCB9ID0gcHJvcHMgfHwge307XG4gICAgY29uc3QgX2RlZmF1bHRWYWx1ZSA9IFJlYWN0LnVzZVJlZihkZWZhdWx0VmFsdWUpO1xuICAgIGNvbnN0IF9jb21wdXRlID0gUmVhY3QudXNlUmVmKGNvbXB1dGUpO1xuICAgIGNvbnN0IF9jb21wdXRlRm9ybVZhbHVlcyA9IFJlYWN0LnVzZVJlZih1bmRlZmluZWQpO1xuICAgIGNvbnN0IF9wcmV2Q29udHJvbCA9IFJlYWN0LnVzZVJlZihjb250cm9sKTtcbiAgICBjb25zdCBfcHJldk5hbWUgPSBSZWFjdC51c2VSZWYobmFtZSk7XG4gICAgX2NvbXB1dGUuY3VycmVudCA9IGNvbXB1dGU7XG4gICAgY29uc3QgW3ZhbHVlLCB1cGRhdGVWYWx1ZV0gPSBSZWFjdC51c2VTdGF0ZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGNvbnRyb2wuX2dldFdhdGNoKG5hbWUsIF9kZWZhdWx0VmFsdWUuY3VycmVudCk7XG4gICAgICAgIHJldHVybiBfY29tcHV0ZS5jdXJyZW50ID8gX2NvbXB1dGUuY3VycmVudChkZWZhdWx0VmFsdWUpIDogZGVmYXVsdFZhbHVlO1xuICAgIH0pO1xuICAgIGNvbnN0IGdldEN1cnJlbnRPdXRwdXQgPSBSZWFjdC51c2VDYWxsYmFjaygodmFsdWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1WYWx1ZXMgPSBnZW5lcmF0ZVdhdGNoT3V0cHV0KG5hbWUsIGNvbnRyb2wuX25hbWVzLCB2YWx1ZXMgfHwgY29udHJvbC5fZm9ybVZhbHVlcywgZmFsc2UsIF9kZWZhdWx0VmFsdWUuY3VycmVudCk7XG4gICAgICAgIHJldHVybiBfY29tcHV0ZS5jdXJyZW50ID8gX2NvbXB1dGUuY3VycmVudChmb3JtVmFsdWVzKSA6IGZvcm1WYWx1ZXM7XG4gICAgfSwgW2NvbnRyb2wuX2Zvcm1WYWx1ZXMsIGNvbnRyb2wuX25hbWVzLCBuYW1lXSk7XG4gICAgY29uc3QgcmVmcmVzaFZhbHVlID0gUmVhY3QudXNlQ2FsbGJhY2soKHZhbHVlcykgPT4ge1xuICAgICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtVmFsdWVzID0gZ2VuZXJhdGVXYXRjaE91dHB1dChuYW1lLCBjb250cm9sLl9uYW1lcywgdmFsdWVzIHx8IGNvbnRyb2wuX2Zvcm1WYWx1ZXMsIGZhbHNlLCBfZGVmYXVsdFZhbHVlLmN1cnJlbnQpO1xuICAgICAgICAgICAgaWYgKF9jb21wdXRlLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wdXRlZEZvcm1WYWx1ZXMgPSBfY29tcHV0ZS5jdXJyZW50KGZvcm1WYWx1ZXMpO1xuICAgICAgICAgICAgICAgIGlmICghZGVlcEVxdWFsKGNvbXB1dGVkRm9ybVZhbHVlcywgX2NvbXB1dGVGb3JtVmFsdWVzLmN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVZhbHVlKGNvbXB1dGVkRm9ybVZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgIF9jb21wdXRlRm9ybVZhbHVlcy5jdXJyZW50ID0gY29tcHV0ZWRGb3JtVmFsdWVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVwZGF0ZVZhbHVlKGZvcm1WYWx1ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwgW2NvbnRyb2wuX2Zvcm1WYWx1ZXMsIGNvbnRyb2wuX25hbWVzLCBkaXNhYmxlZCwgbmFtZV0pO1xuICAgIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoX3ByZXZDb250cm9sLmN1cnJlbnQgIT09IGNvbnRyb2wgfHxcbiAgICAgICAgICAgICFkZWVwRXF1YWwoX3ByZXZOYW1lLmN1cnJlbnQsIG5hbWUpKSB7XG4gICAgICAgICAgICBfcHJldkNvbnRyb2wuY3VycmVudCA9IGNvbnRyb2w7XG4gICAgICAgICAgICBfcHJldk5hbWUuY3VycmVudCA9IG5hbWU7XG4gICAgICAgICAgICByZWZyZXNoVmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29udHJvbC5fc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBmb3JtU3RhdGU6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhhY3QsXG4gICAgICAgICAgICBjYWxsYmFjazogKGZvcm1TdGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlZnJlc2hWYWx1ZShmb3JtU3RhdGUudmFsdWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sIFtjb250cm9sLCBleGFjdCwgbmFtZSwgcmVmcmVzaFZhbHVlXSk7XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IGNvbnRyb2wuX3JlbW92ZVVubW91bnRlZCgpKTtcbiAgICAvLyBJZiBuYW1lIG9yIGNvbnRyb2wgY2hhbmdlZCBmb3IgdGhpcyByZW5kZXIsIHN5bmNocm9ub3VzbHkgcmVmbGVjdCB0aGVcbiAgICAvLyBsYXRlc3QgdmFsdWUgc28gY2FsbGVycyAobGlrZSB1c2VDb250cm9sbGVyKSBzZWUgdGhlIGNvcnJlY3QgdmFsdWVcbiAgICAvLyBpbW1lZGlhdGVseSBvbiB0aGUgc2FtZSByZW5kZXIuXG4gICAgLy8gT3B0aW1pemU6IENoZWNrIGNvbnRyb2wgcmVmZXJlbmNlIGZpcnN0IGJlZm9yZSBleHBlbnNpdmUgZGVlcEVxdWFsXG4gICAgY29uc3QgY29udHJvbENoYW5nZWQgPSBfcHJldkNvbnRyb2wuY3VycmVudCAhPT0gY29udHJvbDtcbiAgICBjb25zdCBwcmV2TmFtZSA9IF9wcmV2TmFtZS5jdXJyZW50O1xuICAgIC8vIENhY2hlIHRoZSBjb21wdXRlZCBvdXRwdXQgdG8gYXZvaWQgZHVwbGljYXRlIGNhbGxzIHdpdGhpbiB0aGUgc2FtZSByZW5kZXJcbiAgICAvLyBXZSBpbmNsdWRlIHNob3VsZFJldHVybkltbWVkaWF0ZSBpbiBkZXBzIHRvIGVuc3VyZSBwcm9wZXIgcmVjb21wdXRhdGlvblxuICAgIGNvbnN0IGNvbXB1dGVkT3V0cHV0ID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmFtZUNoYW5nZWQgPSAhY29udHJvbENoYW5nZWQgJiYgIWRlZXBFcXVhbChwcmV2TmFtZSwgbmFtZSk7XG4gICAgICAgIGNvbnN0IHNob3VsZFJldHVybkltbWVkaWF0ZSA9IGNvbnRyb2xDaGFuZ2VkIHx8IG5hbWVDaGFuZ2VkO1xuICAgICAgICByZXR1cm4gc2hvdWxkUmV0dXJuSW1tZWRpYXRlID8gZ2V0Q3VycmVudE91dHB1dCgpIDogbnVsbDtcbiAgICB9LCBbZGlzYWJsZWQsIGNvbnRyb2xDaGFuZ2VkLCBuYW1lLCBwcmV2TmFtZSwgZ2V0Q3VycmVudE91dHB1dF0pO1xuICAgIHJldHVybiBjb21wdXRlZE91dHB1dCAhPT0gbnVsbCA/IGNvbXB1dGVkT3V0cHV0IDogdmFsdWU7XG59XG5cbi8qKlxuICogQ3VzdG9tIGhvb2sgdG8gd29yayB3aXRoIGNvbnRyb2xsZWQgY29tcG9uZW50LCB0aGlzIGZ1bmN0aW9uIHByb3ZpZGUgeW91IHdpdGggYm90aCBmb3JtIGFuZCBmaWVsZCBsZXZlbCBzdGF0ZS4gUmUtcmVuZGVyIGlzIGlzb2xhdGVkIGF0IHRoZSBob29rIGxldmVsLlxuICpcbiAqIEByZW1hcmtzXG4gKiBbQVBJXShodHRwczovL3JlYWN0LWhvb2stZm9ybS5jb20vZG9jcy91c2Vjb250cm9sbGVyKSDigKIgW0RlbW9dKGh0dHBzOi8vY29kZXNhbmRib3guaW8vcy91c2Vjb250cm9sbGVyLTBvOHB4KVxuICpcbiAqIEBwYXJhbSBwcm9wcyAtIHRoZSBwYXRoIG5hbWUgdG8gdGhlIGZvcm0gZmllbGQgdmFsdWUsIGFuZCB2YWxpZGF0aW9uIHJ1bGVzLlxuICpcbiAqIEByZXR1cm5zIGZpZWxkIHByb3BlcnRpZXMsIGZpZWxkIGFuZCBmb3JtIHN0YXRlLiB7QGxpbmsgVXNlQ29udHJvbGxlclJldHVybn1cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBmdW5jdGlvbiBJbnB1dChwcm9wcykge1xuICogICBjb25zdCB7IGZpZWxkLCBmaWVsZFN0YXRlLCBmb3JtU3RhdGUgfSA9IHVzZUNvbnRyb2xsZXIocHJvcHMpO1xuICogICByZXR1cm4gKFxuICogICAgIDxkaXY+XG4gKiAgICAgICA8aW5wdXQgey4uLmZpZWxkfSBwbGFjZWhvbGRlcj17cHJvcHMubmFtZX0gLz5cbiAqICAgICAgIDxwPntmaWVsZFN0YXRlLmlzVG91Y2hlZCAmJiBcIlRvdWNoZWRcIn08L3A+XG4gKiAgICAgICA8cD57Zm9ybVN0YXRlLmlzU3VibWl0dGVkID8gXCJzdWJtaXR0ZWRcIiA6IFwiXCJ9PC9wPlxuICogICAgIDwvZGl2PlxuICogICApO1xuICogfVxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIHVzZUNvbnRyb2xsZXIocHJvcHMpIHtcbiAgICBjb25zdCBmb3JtQ29udHJvbCA9IHVzZUZvcm1Db250cm9sQ29udGV4dCgpO1xuICAgIGNvbnN0IHsgbmFtZSwgZGlzYWJsZWQsIGNvbnRyb2wgPSBmb3JtQ29udHJvbCwgc2hvdWxkVW5yZWdpc3RlciwgZGVmYXVsdFZhbHVlLCBleGFjdCA9IHRydWUsIH0gPSBwcm9wcztcbiAgICBjb25zdCBpc0FycmF5RmllbGQgPSBpc05hbWVJbkZpZWxkQXJyYXkoY29udHJvbC5fbmFtZXMuYXJyYXksIG5hbWUpO1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZU1lbW8gPSBSZWFjdC51c2VNZW1vKCgpID0+IGdldChjb250cm9sLl9mb3JtVmFsdWVzLCBuYW1lLCBnZXQoY29udHJvbC5fZGVmYXVsdFZhbHVlcywgbmFtZSwgZGVmYXVsdFZhbHVlKSksIFtjb250cm9sLCBuYW1lLCBkZWZhdWx0VmFsdWVdKTtcbiAgICBjb25zdCB2YWx1ZSA9IHVzZVdhdGNoKHtcbiAgICAgICAgY29udHJvbCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBkZWZhdWx0VmFsdWVNZW1vLFxuICAgICAgICBleGFjdCxcbiAgICB9KTtcbiAgICBjb25zdCBmb3JtU3RhdGUgPSB1c2VGb3JtU3RhdGUoe1xuICAgICAgICBjb250cm9sLFxuICAgICAgICBuYW1lLFxuICAgICAgICBleGFjdCxcbiAgICB9KTtcbiAgICBjb25zdCBfcHJvcHMgPSBSZWFjdC51c2VSZWYocHJvcHMpO1xuICAgIGNvbnN0IF9yZWdpc3RlclByb3BzID0gUmVhY3QudXNlUmVmKGNvbnRyb2wucmVnaXN0ZXIobmFtZSwge1xuICAgICAgICAuLi5wcm9wcy5ydWxlcyxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIC4uLihpc0Jvb2xlYW4ocHJvcHMuZGlzYWJsZWQpID8geyBkaXNhYmxlZDogcHJvcHMuZGlzYWJsZWQgfSA6IHt9KSxcbiAgICB9KSk7XG4gICAgX3Byb3BzLmN1cnJlbnQgPSBwcm9wcztcbiAgICBjb25zdCBmaWVsZFN0YXRlID0gUmVhY3QudXNlTWVtbygoKSA9PiBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh7fSwge1xuICAgICAgICBpbnZhbGlkOiB7XG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZ2V0OiAoKSA9PiAhIWdldChmb3JtU3RhdGUuZXJyb3JzLCBuYW1lKSxcbiAgICAgICAgfSxcbiAgICAgICAgaXNEaXJ0eToge1xuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldDogKCkgPT4gISFnZXQoZm9ybVN0YXRlLmRpcnR5RmllbGRzLCBuYW1lKSxcbiAgICAgICAgfSxcbiAgICAgICAgaXNUb3VjaGVkOiB7XG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZ2V0OiAoKSA9PiAhIWdldChmb3JtU3RhdGUudG91Y2hlZEZpZWxkcywgbmFtZSksXG4gICAgICAgIH0sXG4gICAgICAgIGlzVmFsaWRhdGluZzoge1xuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldDogKCkgPT4gISFnZXQoZm9ybVN0YXRlLnZhbGlkYXRpbmdGaWVsZHMsIG5hbWUpLFxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldDogKCkgPT4gZ2V0KGZvcm1TdGF0ZS5lcnJvcnMsIG5hbWUpLFxuICAgICAgICB9LFxuICAgIH0pLCBbZm9ybVN0YXRlLCBuYW1lXSk7XG4gICAgY29uc3Qgb25DaGFuZ2UgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQpID0+IF9yZWdpc3RlclByb3BzLmN1cnJlbnQub25DaGFuZ2Uoe1xuICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiBnZXRFdmVudFZhbHVlKGV2ZW50KSxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHR5cGU6IEVWRU5UUy5DSEFOR0UsXG4gICAgfSksIFtuYW1lXSk7XG4gICAgY29uc3Qgb25CbHVyID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4gX3JlZ2lzdGVyUHJvcHMuY3VycmVudC5vbkJsdXIoe1xuICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiBnZXQoY29udHJvbC5fZm9ybVZhbHVlcywgbmFtZSksXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0eXBlOiBFVkVOVFMuQkxVUixcbiAgICB9KSwgW25hbWUsIGNvbnRyb2wuX2Zvcm1WYWx1ZXNdKTtcbiAgICBjb25zdCByZWYgPSBSZWFjdC51c2VDYWxsYmFjaygoZWxtKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KGNvbnRyb2wuX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgIGlmIChmaWVsZCAmJiBmaWVsZC5fZiAmJiBlbG0pIHtcbiAgICAgICAgICAgIGZpZWxkLl9mLnJlZiA9IHtcbiAgICAgICAgICAgICAgICBmb2N1czogKCkgPT4gaXNGdW5jdGlvbihlbG0uZm9jdXMpICYmIGVsbS5mb2N1cygpLFxuICAgICAgICAgICAgICAgIHNlbGVjdDogKCkgPT4gaXNGdW5jdGlvbihlbG0uc2VsZWN0KSAmJiBlbG0uc2VsZWN0KCksXG4gICAgICAgICAgICAgICAgc2V0Q3VzdG9tVmFsaWRpdHk6IChtZXNzYWdlKSA9PiBpc0Z1bmN0aW9uKGVsbS5zZXRDdXN0b21WYWxpZGl0eSkgJiYgZWxtLnNldEN1c3RvbVZhbGlkaXR5KG1lc3NhZ2UpLFxuICAgICAgICAgICAgICAgIHJlcG9ydFZhbGlkaXR5OiAoKSA9PiBpc0Z1bmN0aW9uKGVsbS5yZXBvcnRWYWxpZGl0eSkgJiYgZWxtLnJlcG9ydFZhbGlkaXR5KCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSwgW2NvbnRyb2wuX2ZpZWxkcywgbmFtZV0pO1xuICAgIGNvbnN0IGZpZWxkID0gUmVhY3QudXNlTWVtbygoKSA9PiAoe1xuICAgICAgICBuYW1lLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgLi4uKGlzQm9vbGVhbihkaXNhYmxlZCkgfHwgZm9ybVN0YXRlLmRpc2FibGVkXG4gICAgICAgICAgICA/IHsgZGlzYWJsZWQ6IGZvcm1TdGF0ZS5kaXNhYmxlZCB8fCBkaXNhYmxlZCB9XG4gICAgICAgICAgICA6IHt9KSxcbiAgICAgICAgb25DaGFuZ2UsXG4gICAgICAgIG9uQmx1cixcbiAgICAgICAgcmVmLFxuICAgIH0pLCBbbmFtZSwgZGlzYWJsZWQsIGZvcm1TdGF0ZS5kaXNhYmxlZCwgb25DaGFuZ2UsIG9uQmx1ciwgcmVmLCB2YWx1ZV0pO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9zaG91bGRVbnJlZ2lzdGVyRmllbGQgPSBjb250cm9sLl9vcHRpb25zLnNob3VsZFVucmVnaXN0ZXIgfHwgc2hvdWxkVW5yZWdpc3RlcjtcbiAgICAgICAgY29udHJvbC5yZWdpc3RlcihuYW1lLCB7XG4gICAgICAgICAgICAuLi5fcHJvcHMuY3VycmVudC5ydWxlcyxcbiAgICAgICAgICAgIC4uLihpc0Jvb2xlYW4oX3Byb3BzLmN1cnJlbnQuZGlzYWJsZWQpXG4gICAgICAgICAgICAgICAgPyB7IGRpc2FibGVkOiBfcHJvcHMuY3VycmVudC5kaXNhYmxlZCB9XG4gICAgICAgICAgICAgICAgOiB7fSksXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1cGRhdGVNb3VudGVkID0gKG5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGdldChjb250cm9sLl9maWVsZHMsIG5hbWUpO1xuICAgICAgICAgICAgaWYgKGZpZWxkICYmIGZpZWxkLl9mKSB7XG4gICAgICAgICAgICAgICAgZmllbGQuX2YubW91bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdXBkYXRlTW91bnRlZChuYW1lLCB0cnVlKTtcbiAgICAgICAgaWYgKF9zaG91bGRVbnJlZ2lzdGVyRmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY2xvbmVPYmplY3QoZ2V0KGNvbnRyb2wuX2RlZmF1bHRWYWx1ZXMsIG5hbWUsIGdldChjb250cm9sLl9vcHRpb25zLmRlZmF1bHRWYWx1ZXMsIG5hbWUsIF9wcm9wcy5jdXJyZW50LmRlZmF1bHRWYWx1ZSkpKTtcbiAgICAgICAgICAgIHNldChjb250cm9sLl9kZWZhdWx0VmFsdWVzLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZmluZWQoZ2V0KGNvbnRyb2wuX2Zvcm1WYWx1ZXMsIG5hbWUpKSkge1xuICAgICAgICAgICAgICAgIHNldChjb250cm9sLl9mb3JtVmFsdWVzLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgIWlzQXJyYXlGaWVsZCAmJiBjb250cm9sLnJlZ2lzdGVyKG5hbWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgKGlzQXJyYXlGaWVsZFxuICAgICAgICAgICAgICAgID8gX3Nob3VsZFVucmVnaXN0ZXJGaWVsZCAmJiAhY29udHJvbC5fc3RhdGUuYWN0aW9uXG4gICAgICAgICAgICAgICAgOiBfc2hvdWxkVW5yZWdpc3RlckZpZWxkKVxuICAgICAgICAgICAgICAgID8gY29udHJvbC51bnJlZ2lzdGVyKG5hbWUpXG4gICAgICAgICAgICAgICAgOiB1cGRhdGVNb3VudGVkKG5hbWUsIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICB9LCBbbmFtZSwgY29udHJvbCwgaXNBcnJheUZpZWxkLCBzaG91bGRVbnJlZ2lzdGVyXSk7XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29udHJvbC5fc2V0RGlzYWJsZWRGaWVsZCh7XG4gICAgICAgICAgICBkaXNhYmxlZCxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgIH0pO1xuICAgIH0sIFtkaXNhYmxlZCwgbmFtZSwgY29udHJvbF0pO1xuICAgIHJldHVybiBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgICAgIGZpZWxkLFxuICAgICAgICBmb3JtU3RhdGUsXG4gICAgICAgIGZpZWxkU3RhdGUsXG4gICAgfSksIFtmaWVsZCwgZm9ybVN0YXRlLCBmaWVsZFN0YXRlXSk7XG59XG5cbi8qKlxuICogQ29tcG9uZW50IGJhc2VkIG9uIGB1c2VDb250cm9sbGVyYCBob29rIHRvIHdvcmsgd2l0aCBjb250cm9sbGVkIGNvbXBvbmVudC5cbiAqXG4gKiBAcmVtYXJrc1xuICogW0FQSV0oaHR0cHM6Ly9yZWFjdC1ob29rLWZvcm0uY29tL2RvY3MvdXNlY29udHJvbGxlci9jb250cm9sbGVyKSDigKIgW0RlbW9dKGh0dHBzOi8vY29kZXNhbmRib3guaW8vcy9yZWFjdC1ob29rLWZvcm0tdjYtY29udHJvbGxlci10cy1qd3l6dykg4oCiIFtWaWRlb10oaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1OMlVOa19VQ1Z5QSlcbiAqXG4gKiBAcGFyYW0gcHJvcHMgLSB0aGUgcGF0aCBuYW1lIHRvIHRoZSBmb3JtIGZpZWxkIHZhbHVlLCBhbmQgdmFsaWRhdGlvbiBydWxlcy5cbiAqXG4gKiBAcmV0dXJucyBwcm92aWRlIGZpZWxkIGhhbmRsZXIgZnVuY3Rpb25zLCBmaWVsZCBhbmQgZm9ybSBzdGF0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBmdW5jdGlvbiBBcHAoKSB7XG4gKiAgIGNvbnN0IHsgY29udHJvbCB9ID0gdXNlRm9ybTxGb3JtVmFsdWVzPih7XG4gKiAgICAgZGVmYXVsdFZhbHVlczoge1xuICogICAgICAgdGVzdDogXCJcIlxuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogICByZXR1cm4gKFxuICogICAgIDxmb3JtPlxuICogICAgICAgPENvbnRyb2xsZXJcbiAqICAgICAgICAgY29udHJvbD17Y29udHJvbH1cbiAqICAgICAgICAgbmFtZT1cInRlc3RcIlxuICogICAgICAgICByZW5kZXI9eyh7IGZpZWxkOiB7IG9uQ2hhbmdlLCBvbkJsdXIsIHZhbHVlLCByZWYgfSwgZm9ybVN0YXRlLCBmaWVsZFN0YXRlIH0pID0+IChcbiAqICAgICAgICAgICA8PlxuICogICAgICAgICAgICAgPGlucHV0XG4gKiAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtvbkNoYW5nZX0gLy8gc2VuZCB2YWx1ZSB0byBob29rIGZvcm1cbiAqICAgICAgICAgICAgICAgb25CbHVyPXtvbkJsdXJ9IC8vIG5vdGlmeSB3aGVuIGlucHV0IGlzIHRvdWNoZWRcbiAqICAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlfSAvLyByZXR1cm4gdXBkYXRlZCB2YWx1ZVxuICogICAgICAgICAgICAgICByZWY9e3JlZn0gLy8gc2V0IHJlZiBmb3IgZm9jdXMgbWFuYWdlbWVudFxuICogICAgICAgICAgICAgLz5cbiAqICAgICAgICAgICAgIDxwPntmb3JtU3RhdGUuaXNTdWJtaXR0ZWQgPyBcInN1Ym1pdHRlZFwiIDogXCJcIn08L3A+XG4gKiAgICAgICAgICAgICA8cD57ZmllbGRTdGF0ZS5pc1RvdWNoZWQgPyBcInRvdWNoZWRcIiA6IFwiXCJ9PC9wPlxuICogICAgICAgICAgIDwvPlxuICogICAgICAgICApfVxuICogICAgICAgLz5cbiAqICAgICA8L2Zvcm0+XG4gKiAgICk7XG4gKiB9XG4gKiBgYGBcbiAqL1xuY29uc3QgQ29udHJvbGxlciA9IChwcm9wcykgPT4gcHJvcHMucmVuZGVyKHVzZUNvbnRyb2xsZXIocHJvcHMpKTtcblxuY29uc3QgZmxhdHRlbiA9IChvYmopID0+IHtcbiAgICBjb25zdCBvdXRwdXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgICAgIGlmIChpc09iamVjdFR5cGUob2JqW2tleV0pICYmIG9ialtrZXldICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWQgPSBmbGF0dGVuKG9ialtrZXldKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmVzdGVkS2V5IG9mIE9iamVjdC5rZXlzKG5lc3RlZCkpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbYCR7a2V5fS4ke25lc3RlZEtleX1gXSA9IG5lc3RlZFtuZXN0ZWRLZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuY29uc3QgSG9va0Zvcm1Db250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChudWxsKTtcbkhvb2tGb3JtQ29udGV4dC5kaXNwbGF5TmFtZSA9ICdIb29rRm9ybUNvbnRleHQnO1xuLyoqXG4gKiBUaGlzIGN1c3RvbSBob29rIGFsbG93cyB5b3UgdG8gYWNjZXNzIHRoZSBmb3JtIGNvbnRleHQuIHVzZUZvcm1Db250ZXh0IGlzIGludGVuZGVkIHRvIGJlIHVzZWQgaW4gZGVlcGx5IG5lc3RlZCBzdHJ1Y3R1cmVzLCB3aGVyZSBpdCB3b3VsZCBiZWNvbWUgaW5jb252ZW5pZW50IHRvIHBhc3MgdGhlIGNvbnRleHQgYXMgYSBwcm9wLiBUbyBiZSB1c2VkIHdpdGgge0BsaW5rIEZvcm1Qcm92aWRlcn0uXG4gKlxuICogQHJlbWFya3NcbiAqIFtBUEldKGh0dHBzOi8vcmVhY3QtaG9vay1mb3JtLmNvbS9kb2NzL3VzZWZvcm1jb250ZXh0KSDigKIgW0RlbW9dKGh0dHBzOi8vY29kZXNhbmRib3guaW8vcy9yZWFjdC1ob29rLWZvcm0tdjctZm9ybS1jb250ZXh0LXl0dWRpKVxuICpcbiAqIEByZXR1cm5zIHJldHVybiBhbGwgdXNlRm9ybSBtZXRob2RzXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogZnVuY3Rpb24gQXBwKCkge1xuICogICBjb25zdCBtZXRob2RzID0gdXNlRm9ybSgpO1xuICogICBjb25zdCBvblN1Ym1pdCA9IGRhdGEgPT4gY29uc29sZS5sb2coZGF0YSk7XG4gKlxuICogICByZXR1cm4gKFxuICogICAgIDxGb3JtUHJvdmlkZXIgey4uLm1ldGhvZHN9ID5cbiAqICAgICAgIDxmb3JtIG9uU3VibWl0PXttZXRob2RzLmhhbmRsZVN1Ym1pdChvblN1Ym1pdCl9PlxuICogICAgICAgICA8TmVzdGVkSW5wdXQgLz5cbiAqICAgICAgICAgPGlucHV0IHR5cGU9XCJzdWJtaXRcIiAvPlxuICogICAgICAgPC9mb3JtPlxuICogICAgIDwvRm9ybVByb3ZpZGVyPlxuICogICApO1xuICogfVxuICpcbiAqICBmdW5jdGlvbiBOZXN0ZWRJbnB1dCgpIHtcbiAqICAgY29uc3QgeyByZWdpc3RlciB9ID0gdXNlRm9ybUNvbnRleHQoKTsgLy8gcmV0cmlldmUgYWxsIGhvb2sgbWV0aG9kc1xuICogICByZXR1cm4gPGlucHV0IHsuLi5yZWdpc3RlcihcInRlc3RcIil9IC8+O1xuICogfVxuICogYGBgXG4gKi9cbmNvbnN0IHVzZUZvcm1Db250ZXh0ID0gKCkgPT4gUmVhY3QudXNlQ29udGV4dChIb29rRm9ybUNvbnRleHQpO1xuLyoqXG4gKiBBIHByb3ZpZGVyIGNvbXBvbmVudCB0aGF0IHByb3BhZ2F0ZXMgdGhlIGB1c2VGb3JtYCBtZXRob2RzIHRvIGFsbCBjaGlsZHJlbiBjb21wb25lbnRzIHZpYSBbUmVhY3QgQ29udGV4dF0oaHR0cHM6Ly9yZWFjdC5kZXYvcmVmZXJlbmNlL3JlYWN0L3VzZUNvbnRleHQpIEFQSS4gVG8gYmUgdXNlZCB3aXRoIHtAbGluayB1c2VGb3JtQ29udGV4dH0uXG4gKlxuICogQHJlbWFya3NcbiAqIFtBUEldKGh0dHBzOi8vcmVhY3QtaG9vay1mb3JtLmNvbS9kb2NzL3VzZWZvcm1jb250ZXh0KSDigKIgW0RlbW9dKGh0dHBzOi8vY29kZXNhbmRib3guaW8vcy9yZWFjdC1ob29rLWZvcm0tdjctZm9ybS1jb250ZXh0LXl0dWRpKVxuICpcbiAqIEBwYXJhbSBwcm9wcyAtIGFsbCB1c2VGb3JtIG1ldGhvZHNcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBmdW5jdGlvbiBBcHAoKSB7XG4gKiAgIGNvbnN0IG1ldGhvZHMgPSB1c2VGb3JtKCk7XG4gKiAgIGNvbnN0IG9uU3VibWl0ID0gZGF0YSA9PiBjb25zb2xlLmxvZyhkYXRhKTtcbiAqXG4gKiAgIHJldHVybiAoXG4gKiAgICAgPEZvcm1Qcm92aWRlciB7Li4ubWV0aG9kc30gPlxuICogICAgICAgPGZvcm0gb25TdWJtaXQ9e21ldGhvZHMuaGFuZGxlU3VibWl0KG9uU3VibWl0KX0+XG4gKiAgICAgICAgIDxOZXN0ZWRJbnB1dCAvPlxuICogICAgICAgICA8aW5wdXQgdHlwZT1cInN1Ym1pdFwiIC8+XG4gKiAgICAgICA8L2Zvcm0+XG4gKiAgICAgPC9Gb3JtUHJvdmlkZXI+XG4gKiAgICk7XG4gKiB9XG4gKlxuICogIGZ1bmN0aW9uIE5lc3RlZElucHV0KCkge1xuICogICBjb25zdCB7IHJlZ2lzdGVyIH0gPSB1c2VGb3JtQ29udGV4dCgpOyAvLyByZXRyaWV2ZSBhbGwgaG9vayBtZXRob2RzXG4gKiAgIHJldHVybiA8aW5wdXQgey4uLnJlZ2lzdGVyKFwidGVzdFwiKX0gLz47XG4gKiB9XG4gKiBgYGBcbiAqL1xuY29uc3QgRm9ybVByb3ZpZGVyID0gKHsgY2hpbGRyZW4sIHdhdGNoLCBnZXRWYWx1ZXMsIGdldEZpZWxkU3RhdGUsIHNldEVycm9yLCBjbGVhckVycm9ycywgc2V0VmFsdWUsIHNldFZhbHVlcywgdHJpZ2dlciwgZm9ybVN0YXRlLCByZXNldEZpZWxkLCByZXNldCwgaGFuZGxlU3VibWl0LCB1bnJlZ2lzdGVyLCBjb250cm9sLCByZWdpc3Rlciwgc2V0Rm9jdXMsIHN1YnNjcmliZSwgfSkgPT4ge1xuICAgIGNvbnN0IG1lbW9pemVkVmFsdWUgPSBSZWFjdC51c2VNZW1vKCgpID0+ICh7XG4gICAgICAgIHdhdGNoLFxuICAgICAgICBnZXRWYWx1ZXMsXG4gICAgICAgIGdldEZpZWxkU3RhdGUsXG4gICAgICAgIHNldEVycm9yLFxuICAgICAgICBjbGVhckVycm9ycyxcbiAgICAgICAgc2V0VmFsdWUsXG4gICAgICAgIHNldFZhbHVlcyxcbiAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgZm9ybVN0YXRlLFxuICAgICAgICByZXNldEZpZWxkLFxuICAgICAgICByZXNldCxcbiAgICAgICAgaGFuZGxlU3VibWl0LFxuICAgICAgICB1bnJlZ2lzdGVyLFxuICAgICAgICBjb250cm9sLFxuICAgICAgICByZWdpc3RlcixcbiAgICAgICAgc2V0Rm9jdXMsXG4gICAgICAgIHN1YnNjcmliZSxcbiAgICB9KSwgW1xuICAgICAgICBjbGVhckVycm9ycyxcbiAgICAgICAgY29udHJvbCxcbiAgICAgICAgZm9ybVN0YXRlLFxuICAgICAgICBnZXRGaWVsZFN0YXRlLFxuICAgICAgICBnZXRWYWx1ZXMsXG4gICAgICAgIGhhbmRsZVN1Ym1pdCxcbiAgICAgICAgcmVnaXN0ZXIsXG4gICAgICAgIHJlc2V0LFxuICAgICAgICByZXNldEZpZWxkLFxuICAgICAgICBzZXRFcnJvcixcbiAgICAgICAgc2V0Rm9jdXMsXG4gICAgICAgIHNldFZhbHVlLFxuICAgICAgICBzZXRWYWx1ZXMsXG4gICAgICAgIHN1YnNjcmliZSxcbiAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgdW5yZWdpc3RlcixcbiAgICAgICAgd2F0Y2gsXG4gICAgXSk7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEhvb2tGb3JtQ29udGV4dC5Qcm92aWRlciwgeyB2YWx1ZTogbWVtb2l6ZWRWYWx1ZSB9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEhvb2tGb3JtQ29udHJvbENvbnRleHQuUHJvdmlkZXIsIHsgdmFsdWU6IG1lbW9pemVkVmFsdWUuY29udHJvbCB9LCBjaGlsZHJlbikpKTtcbn07XG5cbmNvbnN0IFBPU1RfUkVRVUVTVCA9ICdwb3N0Jztcbi8qKlxuICogRm9ybSBjb21wb25lbnQgdG8gbWFuYWdlIHN1Ym1pc3Npb24uXG4gKlxuICogQHBhcmFtIHByb3BzIC0gdG8gc2V0dXAgc3VibWlzc2lvbiBkZXRhaWwuIHtAbGluayBGb3JtUHJvcHN9XG4gKlxuICogQHJldHVybnMgZm9ybSBjb21wb25lbnQgb3IgaGVhZGxlc3MgcmVuZGVyIHByb3AuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogZnVuY3Rpb24gQXBwKCkge1xuICogICBjb25zdCB7IGNvbnRyb2wsIGZvcm1TdGF0ZTogeyBlcnJvcnMgfSB9ID0gdXNlRm9ybSgpO1xuICpcbiAqICAgcmV0dXJuIChcbiAqICAgICA8Rm9ybSBhY3Rpb249XCIvYXBpXCIgY29udHJvbD17Y29udHJvbH0+XG4gKiAgICAgICA8aW5wdXQgey4uLnJlZ2lzdGVyKFwibmFtZVwiKX0gLz5cbiAqICAgICAgIDxwPntlcnJvcnM/LnJvb3Q/LnNlcnZlciAmJiAnU2VydmVyIGVycm9yJ308L3A+XG4gKiAgICAgICA8YnV0dG9uPlN1Ym1pdDwvYnV0dG9uPlxuICogICAgIDwvRm9ybT5cbiAqICAgKTtcbiAqIH1cbiAqIGBgYFxuICovXG5mdW5jdGlvbiBGb3JtKHByb3BzKSB7XG4gICAgY29uc3QgbWV0aG9kcyA9IHVzZUZvcm1Db250ZXh0KCk7XG4gICAgY29uc3QgW21vdW50ZWQsIHNldE1vdW50ZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IHsgY29udHJvbCA9IG1ldGhvZHMuY29udHJvbCwgb25TdWJtaXQsIGNoaWxkcmVuLCBhY3Rpb24sIG1ldGhvZCA9IFBPU1RfUkVRVUVTVCwgaGVhZGVycywgZW5jVHlwZSwgb25FcnJvciwgcmVuZGVyLCBvblN1Y2Nlc3MsIHZhbGlkYXRlU3RhdHVzLCAuLi5yZXN0IH0gPSBwcm9wcztcbiAgICBjb25zdCBzdWJtaXQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgbGV0IGhhc0Vycm9yID0gZmFsc2U7XG4gICAgICAgIGxldCB0eXBlID0gJyc7XG4gICAgICAgIGF3YWl0IGNvbnRyb2wuaGFuZGxlU3VibWl0KGFzeW5jIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgbGV0IGZvcm1EYXRhSnNvbiA9ICcnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YUpzb24gPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfYSkgeyB9XG4gICAgICAgICAgICBjb25zdCBmbGF0dGVuRm9ybVZhbHVlcyA9IGZsYXR0ZW4oZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBmbGF0dGVuRm9ybVZhbHVlcykge1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChrZXksIGZsYXR0ZW5Gb3JtVmFsdWVzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9uU3VibWl0KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb25TdWJtaXQoe1xuICAgICAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGFKc29uLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNob3VsZFN0cmluZ2lmeVN1Ym1pc3Npb25EYXRhID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVycyAmJiBoZWFkZXJzWydDb250ZW50LVR5cGUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIF0uc29tZSgodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlLmluY2x1ZGVzKCdqc29uJykpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFN0cmluZyhhY3Rpb24pLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi4oZW5jVHlwZSAmJiBlbmNUeXBlICE9PSAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7ICdDb250ZW50LVR5cGUnOiBlbmNUeXBlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB7fSksXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogc2hvdWxkU3RyaW5naWZ5U3VibWlzc2lvbkRhdGEgPyBmb3JtRGF0YUpzb24gOiBmb3JtRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbGlkYXRlU3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAhdmFsaWRhdGVTdGF0dXMocmVzcG9uc2Uuc3RhdHVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkVycm9yICYmIG9uRXJyb3IoeyByZXNwb25zZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBTdHJpbmcocmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyAmJiBvblN1Y2Nlc3MoeyByZXNwb25zZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBvbkVycm9yICYmIG9uRXJyb3IoeyBlcnJvciB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKGV2ZW50KTtcbiAgICAgICAgaWYgKGhhc0Vycm9yICYmIGNvbnRyb2wpIHtcbiAgICAgICAgICAgIGNvbnRyb2wuX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgIGlzU3VibWl0U3VjY2Vzc2Z1bDogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRyb2wuc2V0RXJyb3IoJ3Jvb3Quc2VydmVyJywge1xuICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIFtcbiAgICAgICAgY29udHJvbCxcbiAgICAgICAgb25TdWJtaXQsXG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgYWN0aW9uLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBlbmNUeXBlLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1cyxcbiAgICAgICAgb25FcnJvcixcbiAgICAgICAgb25TdWNjZXNzLFxuICAgIF0pO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHNldE1vdW50ZWQodHJ1ZSk7XG4gICAgfSwgW10pO1xuICAgIHJldHVybiByZW5kZXIgPyAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgcmVuZGVyKHtcbiAgICAgICAgc3VibWl0LFxuICAgIH0pKSkgOiAoUmVhY3QuY3JlYXRlRWxlbWVudChcImZvcm1cIiwgeyBub1ZhbGlkYXRlOiBtb3VudGVkLCBhY3Rpb246IGFjdGlvbiwgbWV0aG9kOiBtZXRob2QsIGVuY1R5cGU6IGVuY1R5cGUsIG9uU3VibWl0OiBzdWJtaXQsIC4uLnJlc3QgfSwgY2hpbGRyZW4pKTtcbn1cblxuY29uc3QgRm9ybVN0YXRlU3Vic2NyaWJlID0gKHsgY29udHJvbCwgZGlzYWJsZWQsIGV4YWN0LCBuYW1lLCByZW5kZXIsIH0pID0+IHJlbmRlcih1c2VGb3JtU3RhdGUoeyBjb250cm9sLCBuYW1lLCBkaXNhYmxlZCwgZXhhY3QgfSkpO1xuXG52YXIgYXBwZW5kRXJyb3JzID0gKG5hbWUsIHZhbGlkYXRlQWxsRmllbGRDcml0ZXJpYSwgZXJyb3JzLCB0eXBlLCBtZXNzYWdlKSA9PiB2YWxpZGF0ZUFsbEZpZWxkQ3JpdGVyaWFcbiAgICA/IHtcbiAgICAgICAgLi4uZXJyb3JzW25hbWVdLFxuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgLi4uKGVycm9yc1tuYW1lXSAmJiBlcnJvcnNbbmFtZV0udHlwZXMgPyBlcnJvcnNbbmFtZV0udHlwZXMgOiB7fSksXG4gICAgICAgICAgICBbdHlwZV06IG1lc3NhZ2UgfHwgdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9XG4gICAgOiB7fTtcblxudmFyIGNvbXBhY3QgPSAodmFsdWUpID0+IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUuZmlsdGVyKEJvb2xlYW4pIDogW107XG5cbnZhciBjb252ZXJ0VG9BcnJheVBheWxvYWQgPSAodmFsdWUpID0+IChBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXSk7XG5cbnZhciBjcmVhdGVTdWJqZWN0ID0gKCkgPT4ge1xuICAgIGxldCBfb2JzZXJ2ZXJzID0gW107XG4gICAgY29uc3QgbmV4dCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IG9ic2VydmVyIG9mIF9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQgJiYgb2JzZXJ2ZXIubmV4dCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IHN1YnNjcmliZSA9IChvYnNlcnZlcikgPT4ge1xuICAgICAgICBfb2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBfb2JzZXJ2ZXJzID0gX29ic2VydmVycy5maWx0ZXIoKG8pID0+IG8gIT09IG9ic2VydmVyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBjb25zdCB1bnN1YnNjcmliZSA9ICgpID0+IHtcbiAgICAgICAgX29ic2VydmVycyA9IFtdO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0IG9ic2VydmVycygpIHtcbiAgICAgICAgICAgIHJldHVybiBfb2JzZXJ2ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBuZXh0LFxuICAgICAgICBzdWJzY3JpYmUsXG4gICAgICAgIHVuc3Vic2NyaWJlLFxuICAgIH07XG59O1xuXG5mdW5jdGlvbiBleHRyYWN0Rm9ybVZhbHVlcyhmaWVsZHNTdGF0ZSwgZm9ybVZhbHVlcykge1xuICAgIGNvbnN0IHZhbHVlcyA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIGZpZWxkc1N0YXRlKSB7XG4gICAgICAgIGlmIChmaWVsZHNTdGF0ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFN0YXRlID0gZmllbGRzU3RhdGVba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSBmb3JtVmFsdWVzW2tleV07XG4gICAgICAgICAgICBpZiAoZmllbGRTdGF0ZSAmJiBpc09iamVjdChmaWVsZFN0YXRlKSAmJiBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkRmllbGRzU3RhdGUgPSBleHRyYWN0Rm9ybVZhbHVlcyhmaWVsZFN0YXRlLCBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QobmVzdGVkRmllbGRzU3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1trZXldID0gbmVzdGVkRmllbGRzU3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZmllbGRzU3RhdGVba2V5XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlc1trZXldID0gZmllbGRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xufVxuXG52YXIgaXNFbXB0eU9iamVjdCA9ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpICYmICFPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xuXG52YXIgaXNGaWxlSW5wdXQgPSAoZWxlbWVudCkgPT4gZWxlbWVudC50eXBlID09PSAnZmlsZSc7XG5cbnZhciBpc0hUTUxFbGVtZW50ID0gKHZhbHVlKSA9PiB7XG4gICAgaWYgKCFpc1dlYikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IG93bmVyID0gdmFsdWUgPyB2YWx1ZS5vd25lckRvY3VtZW50IDogMDtcbiAgICByZXR1cm4gKHZhbHVlIGluc3RhbmNlb2ZcbiAgICAgICAgKG93bmVyICYmIG93bmVyLmRlZmF1bHRWaWV3ID8gb3duZXIuZGVmYXVsdFZpZXcuSFRNTEVsZW1lbnQgOiBIVE1MRWxlbWVudCkpO1xufTtcblxudmFyIGlzTXVsdGlwbGVTZWxlY3QgPSAoZWxlbWVudCkgPT4gZWxlbWVudC50eXBlID09PSBgc2VsZWN0LW11bHRpcGxlYDtcblxudmFyIGlzUmFkaW9JbnB1dCA9IChlbGVtZW50KSA9PiBlbGVtZW50LnR5cGUgPT09ICdyYWRpbyc7XG5cbnZhciBpc1JhZGlvT3JDaGVja2JveCA9IChyZWYpID0+IGlzUmFkaW9JbnB1dChyZWYpIHx8IGlzQ2hlY2tCb3hJbnB1dChyZWYpO1xuXG52YXIgbGl2ZSA9IChyZWYpID0+IGlzSFRNTEVsZW1lbnQocmVmKSAmJiByZWYuaXNDb25uZWN0ZWQ7XG5cbmZ1bmN0aW9uIGJhc2VHZXQob2JqZWN0LCB1cGRhdGVQYXRoKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdXBkYXRlUGF0aC5zbGljZSgwLCAtMSkubGVuZ3RoO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGlmIChpc051bGxPclVuZGVmaW5lZChvYmplY3QpKSB7XG4gICAgICAgICAgICBvYmplY3QgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBvYmplY3QgPSBvYmplY3RbdXBkYXRlUGF0aFtpbmRleF1dO1xuICAgICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xufVxuZnVuY3Rpb24gaXNFbXB0eUFycmF5KG9iaikge1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgIWlzVW5kZWZpbmVkKG9ialtrZXldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gdW5zZXQob2JqZWN0LCBwYXRoKSB7XG4gICAgaWYgKGlzU3RyaW5nKHBhdGgpICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHBhdGgpKSB7XG4gICAgICAgIGRlbGV0ZSBvYmplY3RbcGF0aF07XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfVxuICAgIGNvbnN0IHBhdGhzID0gQXJyYXkuaXNBcnJheShwYXRoKVxuICAgICAgICA/IHBhdGhcbiAgICAgICAgOiBpc0tleShwYXRoKVxuICAgICAgICAgICAgPyBbcGF0aF1cbiAgICAgICAgICAgIDogc3RyaW5nVG9QYXRoKHBhdGgpO1xuICAgIGNvbnN0IGNoaWxkT2JqZWN0ID0gcGF0aHMubGVuZ3RoID09PSAxID8gb2JqZWN0IDogYmFzZUdldChvYmplY3QsIHBhdGhzKTtcbiAgICBjb25zdCBpbmRleCA9IHBhdGhzLmxlbmd0aCAtIDE7XG4gICAgY29uc3Qga2V5ID0gcGF0aHNbaW5kZXhdO1xuICAgIGlmIChjaGlsZE9iamVjdCkge1xuICAgICAgICBkZWxldGUgY2hpbGRPYmplY3Rba2V5XTtcbiAgICB9XG4gICAgaWYgKGluZGV4ICE9PSAwICYmXG4gICAgICAgICgoaXNPYmplY3QoY2hpbGRPYmplY3QpICYmIGlzRW1wdHlPYmplY3QoY2hpbGRPYmplY3QpKSB8fFxuICAgICAgICAgICAgKEFycmF5LmlzQXJyYXkoY2hpbGRPYmplY3QpICYmIGlzRW1wdHlBcnJheShjaGlsZE9iamVjdCkpKSkge1xuICAgICAgICB1bnNldChvYmplY3QsIHBhdGhzLnNsaWNlKDAsIC0xKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59XG5cbnZhciBvYmplY3RIYXNGdW5jdGlvbiA9IChkYXRhKSA9PiB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihkYXRhW2tleV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiBpc1RyYXZlcnNhYmxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IChpc09iamVjdCh2YWx1ZSkgJiYgIW9iamVjdEhhc0Z1bmN0aW9uKHZhbHVlKSk7XG59XG5mdW5jdGlvbiBtYXJrRmllbGRzRGlydHkoZGF0YSwgZmllbGRzID0ge30pIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YVtrZXldO1xuICAgICAgICBpZiAoaXNUcmF2ZXJzYWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGZpZWxkc1trZXldID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgbWFya0ZpZWxkc0RpcnR5KHZhbHVlLCBmaWVsZHNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgZmllbGRzW2tleV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5mdW5jdGlvbiBwcnVuZURpcnR5RmllbGRzKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB2YWx1ZS5tYXAoKHZhbHVlKSA9PiBwcnVuZURpcnR5RmllbGRzKHZhbHVlKSk7XG4gICAgICAgIHJldHVybiAocmVzdWx0LnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHJlc3VsdCA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBwcnVuZWQgPSBwcnVuZURpcnR5RmllbGRzKHZhbHVlW2tleV0pO1xuICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChwcnVuZWQpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBwcnVuZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChPYmplY3Qua2V5cyhyZXN1bHQpLmxlbmd0aCA/IHJlc3VsdCA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5mdW5jdGlvbiBnZXREaXJ0eUZpZWxkcyhkYXRhLCBmb3JtVmFsdWVzLCBkaXJ0eUZpZWxkc0Zyb21WYWx1ZXMpIHtcbiAgICBpZiAoIWRpcnR5RmllbGRzRnJvbVZhbHVlcykge1xuICAgICAgICBkaXJ0eUZpZWxkc0Zyb21WYWx1ZXMgPSBtYXJrRmllbGRzRGlydHkoZm9ybVZhbHVlcyk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkYXRhW2tleV07XG4gICAgICAgIGlmIChpc1RyYXZlcnNhYmxlKHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKGlzVW5kZWZpbmVkKGZvcm1WYWx1ZXMpIHx8IGlzUHJpbWl0aXZlKGRpcnR5RmllbGRzRnJvbVZhbHVlc1trZXldKSkge1xuICAgICAgICAgICAgICAgIGRpcnR5RmllbGRzRnJvbVZhbHVlc1trZXldID0gbWFya0ZpZWxkc0RpcnR5KHZhbHVlLCBBcnJheS5pc0FycmF5KHZhbHVlKSA/IFtdIDoge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2V0RGlydHlGaWVsZHModmFsdWUsIGlzTnVsbE9yVW5kZWZpbmVkKGZvcm1WYWx1ZXMpID8ge30gOiBmb3JtVmFsdWVzW2tleV0sIGRpcnR5RmllbGRzRnJvbVZhbHVlc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1WYWx1ZSA9IGZvcm1WYWx1ZXNba2V5XTtcbiAgICAgICAgICAgIGRpcnR5RmllbGRzRnJvbVZhbHVlc1trZXldID0gIWRlZXBFcXVhbCh2YWx1ZSwgZm9ybVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJ1bmVEaXJ0eUZpZWxkcyhkaXJ0eUZpZWxkc0Zyb21WYWx1ZXMpIHx8IHt9O1xufVxuXG5jb25zdCBkZWZhdWx0UmVzdWx0ID0ge1xuICAgIHZhbHVlOiBmYWxzZSxcbiAgICBpc1ZhbGlkOiBmYWxzZSxcbn07XG5jb25zdCB2YWxpZFJlc3VsdCA9IHsgdmFsdWU6IHRydWUsIGlzVmFsaWQ6IHRydWUgfTtcbnZhciBnZXRDaGVja2JveFZhbHVlID0gKG9wdGlvbnMpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgICBpZiAob3B0aW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBvcHRpb25zXG4gICAgICAgICAgICAgICAgLmZpbHRlcigob3B0aW9uKSA9PiBvcHRpb24gJiYgb3B0aW9uLmNoZWNrZWQgJiYgIW9wdGlvbi5kaXNhYmxlZClcbiAgICAgICAgICAgICAgICAubWFwKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdmFsdWVzLCBpc1ZhbGlkOiAhIXZhbHVlcy5sZW5ndGggfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3B0aW9uc1swXS5jaGVja2VkICYmICFvcHRpb25zWzBdLmRpc2FibGVkXG4gICAgICAgICAgICA/IC8vIEB0cy1leHBlY3QtZXJyb3IgZXhwZWN0ZWQgdG8gd29yayBpbiB0aGUgYnJvd3NlclxuICAgICAgICAgICAgICAgIG9wdGlvbnNbMF0uYXR0cmlidXRlcyAmJiAhaXNVbmRlZmluZWQob3B0aW9uc1swXS5hdHRyaWJ1dGVzLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA/IGlzVW5kZWZpbmVkKG9wdGlvbnNbMF0udmFsdWUpIHx8IG9wdGlvbnNbMF0udmFsdWUgPT09ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHZhbGlkUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IG9wdGlvbnNbMF0udmFsdWUsIGlzVmFsaWQ6IHRydWUgfVxuICAgICAgICAgICAgICAgICAgICA6IHZhbGlkUmVzdWx0XG4gICAgICAgICAgICA6IGRlZmF1bHRSZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0UmVzdWx0O1xufTtcblxudmFyIGdldEZpZWxkVmFsdWVBcyA9ICh2YWx1ZSwgeyB2YWx1ZUFzTnVtYmVyLCB2YWx1ZUFzRGF0ZSwgc2V0VmFsdWVBcyB9KSA9PiBpc1VuZGVmaW5lZCh2YWx1ZSlcbiAgICA/IHZhbHVlXG4gICAgOiB2YWx1ZUFzTnVtYmVyXG4gICAgICAgID8gdmFsdWUgPT09ICcnXG4gICAgICAgICAgICA/IE5hTlxuICAgICAgICAgICAgOiB2YWx1ZVxuICAgICAgICAgICAgICAgID8gK3ZhbHVlXG4gICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICAgICA6IHZhbHVlQXNEYXRlICYmIGlzU3RyaW5nKHZhbHVlKVxuICAgICAgICAgICAgPyBuZXcgRGF0ZSh2YWx1ZSlcbiAgICAgICAgICAgIDogc2V0VmFsdWVBc1xuICAgICAgICAgICAgICAgID8gc2V0VmFsdWVBcyh2YWx1ZSlcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuXG5jb25zdCBkZWZhdWx0UmV0dXJuID0ge1xuICAgIGlzVmFsaWQ6IGZhbHNlLFxuICAgIHZhbHVlOiBudWxsLFxufTtcbnZhciBnZXRSYWRpb1ZhbHVlID0gKG9wdGlvbnMpID0+IEFycmF5LmlzQXJyYXkob3B0aW9ucylcbiAgICA/IG9wdGlvbnMucmVkdWNlKChwcmV2aW91cywgb3B0aW9uKSA9PiBvcHRpb24gJiYgb3B0aW9uLmNoZWNrZWQgJiYgIW9wdGlvbi5kaXNhYmxlZFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIGlzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlLFxuICAgICAgICB9XG4gICAgICAgIDogcHJldmlvdXMsIGRlZmF1bHRSZXR1cm4pXG4gICAgOiBkZWZhdWx0UmV0dXJuO1xuXG5mdW5jdGlvbiBnZXRGaWVsZFZhbHVlKF9mKSB7XG4gICAgY29uc3QgcmVmID0gX2YucmVmO1xuICAgIGlmIChpc0ZpbGVJbnB1dChyZWYpKSB7XG4gICAgICAgIHJldHVybiByZWYuZmlsZXM7XG4gICAgfVxuICAgIGlmIChpc1JhZGlvSW5wdXQocmVmKSkge1xuICAgICAgICByZXR1cm4gZ2V0UmFkaW9WYWx1ZShfZi5yZWZzKS52YWx1ZTtcbiAgICB9XG4gICAgaWYgKGlzTXVsdGlwbGVTZWxlY3QocmVmKSkge1xuICAgICAgICByZXR1cm4gWy4uLnJlZi5zZWxlY3RlZE9wdGlvbnNdLm1hcCgoeyB2YWx1ZSB9KSA9PiB2YWx1ZSk7XG4gICAgfVxuICAgIGlmIChpc0NoZWNrQm94SW5wdXQocmVmKSkge1xuICAgICAgICByZXR1cm4gZ2V0Q2hlY2tib3hWYWx1ZShfZi5yZWZzKS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGdldEZpZWxkVmFsdWVBcyhpc1VuZGVmaW5lZChyZWYudmFsdWUpID8gX2YucmVmLnZhbHVlIDogcmVmLnZhbHVlLCBfZik7XG59XG5cbnZhciBnZXRSZXNvbHZlck9wdGlvbnMgPSAoZmllbGRzTmFtZXMsIF9maWVsZHMsIGNyaXRlcmlhTW9kZSwgc2hvdWxkVXNlTmF0aXZlVmFsaWRhdGlvbikgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IHt9O1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBmaWVsZHNOYW1lcykge1xuICAgICAgICBjb25zdCBmaWVsZCA9IGdldChfZmllbGRzLCBuYW1lKTtcbiAgICAgICAgZmllbGQgJiYgc2V0KGZpZWxkcywgbmFtZSwgZmllbGQuX2YpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBjcml0ZXJpYU1vZGUsXG4gICAgICAgIG5hbWVzOiBbLi4uZmllbGRzTmFtZXNdLFxuICAgICAgICBmaWVsZHMsXG4gICAgICAgIHNob3VsZFVzZU5hdGl2ZVZhbGlkYXRpb24sXG4gICAgfTtcbn07XG5cbnZhciBpc1JlZ2V4ID0gKHZhbHVlKSA9PiB2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cDtcblxudmFyIGdldFJ1bGVWYWx1ZSA9IChydWxlKSA9PiBpc1VuZGVmaW5lZChydWxlKVxuICAgID8gcnVsZVxuICAgIDogaXNSZWdleChydWxlKVxuICAgICAgICA/IHJ1bGUuc291cmNlXG4gICAgICAgIDogaXNPYmplY3QocnVsZSlcbiAgICAgICAgICAgID8gaXNSZWdleChydWxlLnZhbHVlKVxuICAgICAgICAgICAgICAgID8gcnVsZS52YWx1ZS5zb3VyY2VcbiAgICAgICAgICAgICAgICA6IHJ1bGUudmFsdWVcbiAgICAgICAgICAgIDogcnVsZTtcblxudmFyIGdldFZhbGlkYXRpb25Nb2RlcyA9IChtb2RlKSA9PiAoe1xuICAgIGlzT25TdWJtaXQ6ICFtb2RlIHx8IG1vZGUgPT09IFZBTElEQVRJT05fTU9ERS5vblN1Ym1pdCxcbiAgICBpc09uQmx1cjogbW9kZSA9PT0gVkFMSURBVElPTl9NT0RFLm9uQmx1cixcbiAgICBpc09uQ2hhbmdlOiBtb2RlID09PSBWQUxJREFUSU9OX01PREUub25DaGFuZ2UsXG4gICAgaXNPbkFsbDogbW9kZSA9PT0gVkFMSURBVElPTl9NT0RFLmFsbCxcbiAgICBpc09uVG91Y2g6IG1vZGUgPT09IFZBTElEQVRJT05fTU9ERS5vblRvdWNoZWQsXG59KTtcblxuY29uc3QgQVNZTkNfRlVOQ1RJT04gPSAnQXN5bmNGdW5jdGlvbic7XG52YXIgaGFzUHJvbWlzZVZhbGlkYXRpb24gPSAoZmllbGRSZWZlcmVuY2UpID0+ICEhZmllbGRSZWZlcmVuY2UgJiZcbiAgICAhIWZpZWxkUmVmZXJlbmNlLnZhbGlkYXRlICYmXG4gICAgISEoKGlzRnVuY3Rpb24oZmllbGRSZWZlcmVuY2UudmFsaWRhdGUpICYmXG4gICAgICAgIGZpZWxkUmVmZXJlbmNlLnZhbGlkYXRlLmNvbnN0cnVjdG9yLm5hbWUgPT09IEFTWU5DX0ZVTkNUSU9OKSB8fFxuICAgICAgICAoaXNPYmplY3QoZmllbGRSZWZlcmVuY2UudmFsaWRhdGUpICYmXG4gICAgICAgICAgICBPYmplY3QudmFsdWVzKGZpZWxkUmVmZXJlbmNlLnZhbGlkYXRlKS5maW5kKCh2YWxpZGF0ZUZ1bmN0aW9uKSA9PiB2YWxpZGF0ZUZ1bmN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IEFTWU5DX0ZVTkNUSU9OKSkpO1xuXG52YXIgaGFzVmFsaWRhdGlvbiA9IChvcHRpb25zKSA9PiBvcHRpb25zLm1vdW50ICYmXG4gICAgKG9wdGlvbnMucmVxdWlyZWQgfHxcbiAgICAgICAgb3B0aW9ucy5taW4gfHxcbiAgICAgICAgb3B0aW9ucy5tYXggfHxcbiAgICAgICAgb3B0aW9ucy5tYXhMZW5ndGggfHxcbiAgICAgICAgb3B0aW9ucy5taW5MZW5ndGggfHxcbiAgICAgICAgb3B0aW9ucy5wYXR0ZXJuIHx8XG4gICAgICAgIG9wdGlvbnMudmFsaWRhdGUpO1xuXG52YXIgaXNXYXRjaGVkID0gKG5hbWUsIF9uYW1lcywgaXNCbHVyRXZlbnQpID0+ICFpc0JsdXJFdmVudCAmJlxuICAgIChfbmFtZXMud2F0Y2hBbGwgfHxcbiAgICAgICAgX25hbWVzLndhdGNoLmhhcyhuYW1lKSB8fFxuICAgICAgICBbLi4uX25hbWVzLndhdGNoXS5zb21lKCh3YXRjaE5hbWUpID0+IG5hbWUuc3RhcnRzV2l0aChgJHt3YXRjaE5hbWV9LmApKSk7XG5cbmNvbnN0IGl0ZXJhdGVGaWVsZHNCeUFjdGlvbiA9IChmaWVsZHMsIGFjdGlvbiwgZmllbGRzTmFtZXMsIGFib3J0RWFybHkpID0+IHtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBmaWVsZHNOYW1lcyB8fCBPYmplY3Qua2V5cyhmaWVsZHMpKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KGZpZWxkcywga2V5KTtcbiAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBjb25zdCB7IF9mLCAuLi5jdXJyZW50RmllbGQgfSA9IGZpZWxkO1xuICAgICAgICAgICAgaWYgKF9mKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9mLnJlZnMgJiYgX2YucmVmc1swXSAmJiBhY3Rpb24oX2YucmVmc1swXSwga2V5KSAmJiAhYWJvcnRFYXJseSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoX2YucmVmICYmIGFjdGlvbihfZi5yZWYsIF9mLm5hbWUpICYmICFhYm9ydEVhcmx5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZXJhdGVGaWVsZHNCeUFjdGlvbihjdXJyZW50RmllbGQsIGFjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNPYmplY3QoY3VycmVudEZpZWxkKSkge1xuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRlRmllbGRzQnlBY3Rpb24oY3VycmVudEZpZWxkLCBhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5mdW5jdGlvbiBzY2hlbWFFcnJvckxvb2t1cChlcnJvcnMsIF9maWVsZHMsIG5hbWUpIHtcbiAgICBjb25zdCBlcnJvciA9IGdldChlcnJvcnMsIG5hbWUpO1xuICAgIGlmIChlcnJvciB8fCBpc0tleShuYW1lKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBuYW1lcyA9IG5hbWUuc3BsaXQoJy4nKTtcbiAgICB3aGlsZSAobmFtZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IG5hbWVzLmpvaW4oJy4nKTtcbiAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoX2ZpZWxkcywgZmllbGROYW1lKTtcbiAgICAgICAgY29uc3QgZm91bmRFcnJvciA9IGdldChlcnJvcnMsIGZpZWxkTmFtZSk7XG4gICAgICAgIGlmIChmaWVsZCAmJiAhQXJyYXkuaXNBcnJheShmaWVsZCkgJiYgbmFtZSAhPT0gZmllbGROYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4geyBuYW1lIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdW5kRXJyb3IgJiYgZm91bmRFcnJvci50eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGZpZWxkTmFtZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZm91bmRFcnJvcixcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdW5kRXJyb3IgJiYgZm91bmRFcnJvci5yb290ICYmIGZvdW5kRXJyb3Iucm9vdC50eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGAke2ZpZWxkTmFtZX0ucm9vdGAsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZvdW5kRXJyb3Iucm9vdCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbmFtZXMucG9wKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgfTtcbn1cblxudmFyIHNob3VsZFJlbmRlckZvcm1TdGF0ZSA9IChmb3JtU3RhdGVEYXRhLCBfcHJveHlGb3JtU3RhdGUsIHVwZGF0ZUZvcm1TdGF0ZSwgaXNSb290KSA9PiB7XG4gICAgdXBkYXRlRm9ybVN0YXRlKGZvcm1TdGF0ZURhdGEpO1xuICAgIGNvbnN0IHsgbmFtZSwgLi4uZm9ybVN0YXRlIH0gPSBmb3JtU3RhdGVEYXRhO1xuICAgIHJldHVybiAoaXNFbXB0eU9iamVjdChmb3JtU3RhdGUpIHx8XG4gICAgICAgIChpc1Jvb3QgJiZcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGZvcm1TdGF0ZSkubGVuZ3RoID49IE9iamVjdC5rZXlzKF9wcm94eUZvcm1TdGF0ZSkubGVuZ3RoKSB8fFxuICAgICAgICBPYmplY3Qua2V5cyhmb3JtU3RhdGUpLmZpbmQoKGtleSkgPT4gX3Byb3h5Rm9ybVN0YXRlW2tleV0gPT09XG4gICAgICAgICAgICAoIWlzUm9vdCB8fCBWQUxJREFUSU9OX01PREUuYWxsKSkpO1xufTtcblxudmFyIHNob3VsZFN1YnNjcmliZUJ5TmFtZSA9IChuYW1lLCBzaWduYWxOYW1lLCBleGFjdCkgPT4gIW5hbWUgfHxcbiAgICAhc2lnbmFsTmFtZSB8fFxuICAgIG5hbWUgPT09IHNpZ25hbE5hbWUgfHxcbiAgICBjb252ZXJ0VG9BcnJheVBheWxvYWQobmFtZSkuc29tZSgoY3VycmVudE5hbWUpID0+IGN1cnJlbnROYW1lICYmXG4gICAgICAgIChleGFjdFxuICAgICAgICAgICAgPyBjdXJyZW50TmFtZSA9PT0gc2lnbmFsTmFtZVxuICAgICAgICAgICAgOiBjdXJyZW50TmFtZS5zdGFydHNXaXRoKHNpZ25hbE5hbWUpIHx8XG4gICAgICAgICAgICAgICAgc2lnbmFsTmFtZS5zdGFydHNXaXRoKGN1cnJlbnROYW1lKSkpO1xuXG52YXIgc2tpcFZhbGlkYXRpb24gPSAoaXNCbHVyRXZlbnQsIGlzVG91Y2hlZCwgaXNTdWJtaXR0ZWQsIHJlVmFsaWRhdGVNb2RlLCBtb2RlKSA9PiB7XG4gICAgaWYgKG1vZGUuaXNPbkFsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFpc1N1Ym1pdHRlZCAmJiBtb2RlLmlzT25Ub3VjaCkge1xuICAgICAgICByZXR1cm4gIShpc1RvdWNoZWQgfHwgaXNCbHVyRXZlbnQpO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc1N1Ym1pdHRlZCA/IHJlVmFsaWRhdGVNb2RlLmlzT25CbHVyIDogbW9kZS5pc09uQmx1cikge1xuICAgICAgICByZXR1cm4gIWlzQmx1ckV2ZW50O1xuICAgIH1cbiAgICBlbHNlIGlmIChpc1N1Ym1pdHRlZCA/IHJlVmFsaWRhdGVNb2RlLmlzT25DaGFuZ2UgOiBtb2RlLmlzT25DaGFuZ2UpIHtcbiAgICAgICAgcmV0dXJuIGlzQmx1ckV2ZW50O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB1bnNldEVtcHR5QXJyYXkgPSAocmVmLCBuYW1lKSA9PiAhY29tcGFjdChnZXQocmVmLCBuYW1lKSkubGVuZ3RoICYmIHVuc2V0KHJlZiwgbmFtZSk7XG5cbnZhciB1cGRhdGVGaWVsZEFycmF5Um9vdEVycm9yID0gKGVycm9ycywgZXJyb3IsIG5hbWUpID0+IHtcbiAgICBjb25zdCBleGlzdGluZ0Vycm9ycyA9IGdldChlcnJvcnMsIG5hbWUpO1xuICAgIGNvbnN0IGZpZWxkQXJyYXlFcnJvcnMgPSBBcnJheS5pc0FycmF5KGV4aXN0aW5nRXJyb3JzKSA/IGV4aXN0aW5nRXJyb3JzIDogW107XG4gICAgc2V0KGZpZWxkQXJyYXlFcnJvcnMsIFJPT1RfRVJST1JfVFlQRSwgZXJyb3JbbmFtZV0pO1xuICAgIHNldChlcnJvcnMsIG5hbWUsIGZpZWxkQXJyYXlFcnJvcnMpO1xuICAgIHJldHVybiBlcnJvcnM7XG59O1xuXG5mdW5jdGlvbiBnZXRWYWxpZGF0ZUVycm9yKHJlc3VsdCwgcmVmLCB0eXBlID0gJ3ZhbGlkYXRlJykge1xuICAgIGlmIChpc1N0cmluZyhyZXN1bHQpIHx8XG4gICAgICAgIChBcnJheS5pc0FycmF5KHJlc3VsdCkgJiYgcmVzdWx0LmV2ZXJ5KGlzU3RyaW5nKSkgfHxcbiAgICAgICAgKGlzQm9vbGVhbihyZXN1bHQpICYmICFyZXN1bHQpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgbWVzc2FnZTogaXNTdHJpbmcocmVzdWx0KSA/IHJlc3VsdCA6ICcnLFxuICAgICAgICAgICAgcmVmLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxudmFyIGdldFZhbHVlQW5kTWVzc2FnZSA9ICh2YWxpZGF0aW9uRGF0YSkgPT4gaXNPYmplY3QodmFsaWRhdGlvbkRhdGEpICYmICFpc1JlZ2V4KHZhbGlkYXRpb25EYXRhKVxuICAgID8gdmFsaWRhdGlvbkRhdGFcbiAgICA6IHtcbiAgICAgICAgdmFsdWU6IHZhbGlkYXRpb25EYXRhLFxuICAgICAgICBtZXNzYWdlOiAnJyxcbiAgICB9O1xuXG52YXIgdmFsaWRhdGVGaWVsZCA9IGFzeW5jIChmaWVsZCwgZGlzYWJsZWRGaWVsZE5hbWVzLCBmb3JtVmFsdWVzLCB2YWxpZGF0ZUFsbEZpZWxkQ3JpdGVyaWEsIHNob3VsZFVzZU5hdGl2ZVZhbGlkYXRpb24sIGlzRmllbGRBcnJheSkgPT4ge1xuICAgIGNvbnN0IHsgcmVmLCByZWZzLCByZXF1aXJlZCwgbWF4TGVuZ3RoLCBtaW5MZW5ndGgsIG1pbiwgbWF4LCBwYXR0ZXJuLCB2YWxpZGF0ZSwgbmFtZSwgdmFsdWVBc051bWJlciwgbW91bnQsIH0gPSBmaWVsZC5fZjtcbiAgICBjb25zdCBpbnB1dFZhbHVlID0gZ2V0KGZvcm1WYWx1ZXMsIG5hbWUpO1xuICAgIGlmICghbW91bnQgfHwgZGlzYWJsZWRGaWVsZE5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGNvbnN0IGlucHV0UmVmID0gcmVmcyA/IHJlZnNbMF0gOiByZWY7XG4gICAgY29uc3Qgc2V0Q3VzdG9tVmFsaWRpdHkgPSAobWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAoc2hvdWxkVXNlTmF0aXZlVmFsaWRhdGlvbiAmJiBpbnB1dFJlZi5yZXBvcnRWYWxpZGl0eSkge1xuICAgICAgICAgICAgaW5wdXRSZWYuc2V0Q3VzdG9tVmFsaWRpdHkoaXNCb29sZWFuKG1lc3NhZ2UpID8gJycgOiBtZXNzYWdlIHx8ICcnKTtcbiAgICAgICAgICAgIGlucHV0UmVmLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGVycm9yID0ge307XG4gICAgY29uc3QgaXNSYWRpbyA9IGlzUmFkaW9JbnB1dChyZWYpO1xuICAgIGNvbnN0IGlzQ2hlY2tCb3ggPSBpc0NoZWNrQm94SW5wdXQocmVmKTtcbiAgICBjb25zdCBpc1JhZGlvT3JDaGVja2JveCA9IGlzUmFkaW8gfHwgaXNDaGVja0JveDtcbiAgICBjb25zdCBpc0VtcHR5ID0gKCh2YWx1ZUFzTnVtYmVyIHx8IGlzRmlsZUlucHV0KHJlZikpICYmXG4gICAgICAgIGlzVW5kZWZpbmVkKHJlZi52YWx1ZSkgJiZcbiAgICAgICAgaXNVbmRlZmluZWQoaW5wdXRWYWx1ZSkpIHx8XG4gICAgICAgIChpc0hUTUxFbGVtZW50KHJlZikgJiYgcmVmLnZhbHVlID09PSAnJykgfHxcbiAgICAgICAgaW5wdXRWYWx1ZSA9PT0gJycgfHxcbiAgICAgICAgKEFycmF5LmlzQXJyYXkoaW5wdXRWYWx1ZSkgJiYgIWlucHV0VmFsdWUubGVuZ3RoKTtcbiAgICBjb25zdCBhcHBlbmRFcnJvcnNDdXJyeSA9IGFwcGVuZEVycm9ycy5iaW5kKG51bGwsIG5hbWUsIHZhbGlkYXRlQWxsRmllbGRDcml0ZXJpYSwgZXJyb3IpO1xuICAgIGNvbnN0IGdldE1pbk1heE1lc3NhZ2UgPSAoZXhjZWVkTWF4LCBtYXhMZW5ndGhNZXNzYWdlLCBtaW5MZW5ndGhNZXNzYWdlLCBtYXhUeXBlID0gSU5QVVRfVkFMSURBVElPTl9SVUxFUy5tYXhMZW5ndGgsIG1pblR5cGUgPSBJTlBVVF9WQUxJREFUSU9OX1JVTEVTLm1pbkxlbmd0aCkgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZXhjZWVkTWF4ID8gbWF4TGVuZ3RoTWVzc2FnZSA6IG1pbkxlbmd0aE1lc3NhZ2U7XG4gICAgICAgIGVycm9yW25hbWVdID0ge1xuICAgICAgICAgICAgdHlwZTogZXhjZWVkTWF4ID8gbWF4VHlwZSA6IG1pblR5cGUsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgcmVmLFxuICAgICAgICAgICAgLi4uYXBwZW5kRXJyb3JzQ3VycnkoZXhjZWVkTWF4ID8gbWF4VHlwZSA6IG1pblR5cGUsIG1lc3NhZ2UpLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgaWYgKGlzRmllbGRBcnJheVxuICAgICAgICA/ICFBcnJheS5pc0FycmF5KGlucHV0VmFsdWUpIHx8ICFpbnB1dFZhbHVlLmxlbmd0aFxuICAgICAgICA6IHJlcXVpcmVkICYmXG4gICAgICAgICAgICAoKCFpc1JhZGlvT3JDaGVja2JveCAmJiAoaXNFbXB0eSB8fCBpc051bGxPclVuZGVmaW5lZChpbnB1dFZhbHVlKSkpIHx8XG4gICAgICAgICAgICAgICAgKGlzQm9vbGVhbihpbnB1dFZhbHVlKSAmJiAhaW5wdXRWYWx1ZSkgfHxcbiAgICAgICAgICAgICAgICAoaXNDaGVja0JveCAmJiAhZ2V0Q2hlY2tib3hWYWx1ZShyZWZzKS5pc1ZhbGlkKSB8fFxuICAgICAgICAgICAgICAgIChpc1JhZGlvICYmICFnZXRSYWRpb1ZhbHVlKHJlZnMpLmlzVmFsaWQpKSkge1xuICAgICAgICBjb25zdCB7IHZhbHVlLCBtZXNzYWdlIH0gPSBpc1N0cmluZyhyZXF1aXJlZClcbiAgICAgICAgICAgID8geyB2YWx1ZTogISFyZXF1aXJlZCwgbWVzc2FnZTogcmVxdWlyZWQgfVxuICAgICAgICAgICAgOiBnZXRWYWx1ZUFuZE1lc3NhZ2UocmVxdWlyZWQpO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIGVycm9yW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElOUFVUX1ZBTElEQVRJT05fUlVMRVMucmVxdWlyZWQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICByZWY6IGlucHV0UmVmLFxuICAgICAgICAgICAgICAgIC4uLmFwcGVuZEVycm9yc0N1cnJ5KElOUFVUX1ZBTElEQVRJT05fUlVMRVMucmVxdWlyZWQsIG1lc3NhZ2UpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghdmFsaWRhdGVBbGxGaWVsZENyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgc2V0Q3VzdG9tVmFsaWRpdHkobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFbXB0eSAmJiAoIWlzTnVsbE9yVW5kZWZpbmVkKG1pbikgfHwgIWlzTnVsbE9yVW5kZWZpbmVkKG1heCkpKSB7XG4gICAgICAgIGxldCBleGNlZWRNYXg7XG4gICAgICAgIGxldCBleGNlZWRNaW47XG4gICAgICAgIGNvbnN0IG1heE91dHB1dCA9IGdldFZhbHVlQW5kTWVzc2FnZShtYXgpO1xuICAgICAgICBjb25zdCBtaW5PdXRwdXQgPSBnZXRWYWx1ZUFuZE1lc3NhZ2UobWluKTtcbiAgICAgICAgaWYgKCFpc051bGxPclVuZGVmaW5lZChpbnB1dFZhbHVlKSAmJiAhaXNOYU4oaW5wdXRWYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlTnVtYmVyID0gcmVmLnZhbHVlQXNOdW1iZXIgfHxcbiAgICAgICAgICAgICAgICAoaW5wdXRWYWx1ZSA/ICtpbnB1dFZhbHVlIDogaW5wdXRWYWx1ZSk7XG4gICAgICAgICAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKG1heE91dHB1dC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBleGNlZWRNYXggPSB2YWx1ZU51bWJlciA+IG1heE91dHB1dC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNOdWxsT3JVbmRlZmluZWQobWluT3V0cHV0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGV4Y2VlZE1pbiA9IHZhbHVlTnVtYmVyIDwgbWluT3V0cHV0LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdmFsdWVEYXRlID0gcmVmLnZhbHVlQXNEYXRlIHx8IG5ldyBEYXRlKGlucHV0VmFsdWUpO1xuICAgICAgICAgICAgY29uc3QgY29udmVydFRpbWVUb0RhdGUgPSAodGltZSkgPT4gbmV3IERhdGUobmV3IERhdGUoKS50b0RhdGVTdHJpbmcoKSArICcgJyArIHRpbWUpO1xuICAgICAgICAgICAgY29uc3QgaXNUaW1lID0gcmVmLnR5cGUgPT0gJ3RpbWUnO1xuICAgICAgICAgICAgY29uc3QgaXNXZWVrID0gcmVmLnR5cGUgPT0gJ3dlZWsnO1xuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKG1heE91dHB1dC52YWx1ZSkgJiYgaW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGV4Y2VlZE1heCA9IGlzVGltZVxuICAgICAgICAgICAgICAgICAgICA/IGNvbnZlcnRUaW1lVG9EYXRlKGlucHV0VmFsdWUpID4gY29udmVydFRpbWVUb0RhdGUobWF4T3V0cHV0LnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IGlzV2Vla1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlID4gbWF4T3V0cHV0LnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHZhbHVlRGF0ZSA+IG5ldyBEYXRlKG1heE91dHB1dC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcobWluT3V0cHV0LnZhbHVlKSAmJiBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZXhjZWVkTWluID0gaXNUaW1lXG4gICAgICAgICAgICAgICAgICAgID8gY29udmVydFRpbWVUb0RhdGUoaW5wdXRWYWx1ZSkgPCBjb252ZXJ0VGltZVRvRGF0ZShtaW5PdXRwdXQudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogaXNXZWVrXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUgPCBtaW5PdXRwdXQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdmFsdWVEYXRlIDwgbmV3IERhdGUobWluT3V0cHV0LnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhjZWVkTWF4IHx8IGV4Y2VlZE1pbikge1xuICAgICAgICAgICAgZ2V0TWluTWF4TWVzc2FnZSghIWV4Y2VlZE1heCwgbWF4T3V0cHV0Lm1lc3NhZ2UsIG1pbk91dHB1dC5tZXNzYWdlLCBJTlBVVF9WQUxJREFUSU9OX1JVTEVTLm1heCwgSU5QVVRfVkFMSURBVElPTl9SVUxFUy5taW4pO1xuICAgICAgICAgICAgaWYgKCF2YWxpZGF0ZUFsbEZpZWxkQ3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICBzZXRDdXN0b21WYWxpZGl0eShlcnJvcltuYW1lXS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKChtYXhMZW5ndGggfHwgbWluTGVuZ3RoKSAmJlxuICAgICAgICAhaXNFbXB0eSAmJlxuICAgICAgICAoaXNTdHJpbmcoaW5wdXRWYWx1ZSkgfHwgKGlzRmllbGRBcnJheSAmJiBBcnJheS5pc0FycmF5KGlucHV0VmFsdWUpKSkpIHtcbiAgICAgICAgY29uc3QgbWF4TGVuZ3RoT3V0cHV0ID0gZ2V0VmFsdWVBbmRNZXNzYWdlKG1heExlbmd0aCk7XG4gICAgICAgIGNvbnN0IG1pbkxlbmd0aE91dHB1dCA9IGdldFZhbHVlQW5kTWVzc2FnZShtaW5MZW5ndGgpO1xuICAgICAgICBjb25zdCBleGNlZWRNYXggPSAhaXNOdWxsT3JVbmRlZmluZWQobWF4TGVuZ3RoT3V0cHV0LnZhbHVlKSAmJlxuICAgICAgICAgICAgaW5wdXRWYWx1ZS5sZW5ndGggPiArbWF4TGVuZ3RoT3V0cHV0LnZhbHVlO1xuICAgICAgICBjb25zdCBleGNlZWRNaW4gPSAhaXNOdWxsT3JVbmRlZmluZWQobWluTGVuZ3RoT3V0cHV0LnZhbHVlKSAmJlxuICAgICAgICAgICAgaW5wdXRWYWx1ZS5sZW5ndGggPCArbWluTGVuZ3RoT3V0cHV0LnZhbHVlO1xuICAgICAgICBpZiAoZXhjZWVkTWF4IHx8IGV4Y2VlZE1pbikge1xuICAgICAgICAgICAgZ2V0TWluTWF4TWVzc2FnZShleGNlZWRNYXgsIG1heExlbmd0aE91dHB1dC5tZXNzYWdlLCBtaW5MZW5ndGhPdXRwdXQubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRlQWxsRmllbGRDcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIHNldEN1c3RvbVZhbGlkaXR5KGVycm9yW25hbWVdLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocGF0dGVybiAmJiAhaXNFbXB0eSAmJiBpc1N0cmluZyhpbnB1dFZhbHVlKSkge1xuICAgICAgICBjb25zdCB7IHZhbHVlOiBwYXR0ZXJuVmFsdWUsIG1lc3NhZ2UgfSA9IGdldFZhbHVlQW5kTWVzc2FnZShwYXR0ZXJuKTtcbiAgICAgICAgaWYgKGlzUmVnZXgocGF0dGVyblZhbHVlKSAmJiAhaW5wdXRWYWx1ZS5tYXRjaChwYXR0ZXJuVmFsdWUpKSB7XG4gICAgICAgICAgICBlcnJvcltuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJTlBVVF9WQUxJREFUSU9OX1JVTEVTLnBhdHRlcm4sXG4gICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICByZWYsXG4gICAgICAgICAgICAgICAgLi4uYXBwZW5kRXJyb3JzQ3VycnkoSU5QVVRfVkFMSURBVElPTl9SVUxFUy5wYXR0ZXJuLCBtZXNzYWdlKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRlQWxsRmllbGRDcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIHNldEN1c3RvbVZhbGlkaXR5KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodmFsaWRhdGUpIHtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsaWRhdGUpKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0ZShpbnB1dFZhbHVlLCBmb3JtVmFsdWVzKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRlRXJyb3IgPSBnZXRWYWxpZGF0ZUVycm9yKHJlc3VsdCwgaW5wdXRSZWYpO1xuICAgICAgICAgICAgaWYgKHZhbGlkYXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBlcnJvcltuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4udmFsaWRhdGVFcnJvcixcbiAgICAgICAgICAgICAgICAgICAgLi4uYXBwZW5kRXJyb3JzQ3VycnkoSU5QVVRfVkFMSURBVElPTl9SVUxFUy52YWxpZGF0ZSwgdmFsaWRhdGVFcnJvci5tZXNzYWdlKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICghdmFsaWRhdGVBbGxGaWVsZENyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbVZhbGlkaXR5KHZhbGlkYXRlRXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNPYmplY3QodmFsaWRhdGUpKSB7XG4gICAgICAgICAgICBsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsaWRhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRW1wdHlPYmplY3QodmFsaWRhdGlvblJlc3VsdCkgJiYgIXZhbGlkYXRlQWxsRmllbGRDcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGVFcnJvciA9IGdldFZhbGlkYXRlRXJyb3IoYXdhaXQgdmFsaWRhdGVba2V5XShpbnB1dFZhbHVlLCBmb3JtVmFsdWVzKSwgaW5wdXRSZWYsIGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnZhbGlkYXRlRXJyb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5hcHBlbmRFcnJvcnNDdXJyeShrZXksIHZhbGlkYXRlRXJyb3IubWVzc2FnZSksXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbVZhbGlkaXR5KHZhbGlkYXRlRXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWxpZGF0ZUFsbEZpZWxkQ3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yW25hbWVdID0gdmFsaWRhdGlvblJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNFbXB0eU9iamVjdCh2YWxpZGF0aW9uUmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIGVycm9yW25hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICByZWY6IGlucHV0UmVmLFxuICAgICAgICAgICAgICAgICAgICAuLi52YWxpZGF0aW9uUmVzdWx0LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZGF0ZUFsbEZpZWxkQ3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRDdXN0b21WYWxpZGl0eSh0cnVlKTtcbiAgICByZXR1cm4gZXJyb3I7XG59O1xuXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBtb2RlOiBWQUxJREFUSU9OX01PREUub25TdWJtaXQsXG4gICAgcmVWYWxpZGF0ZU1vZGU6IFZBTElEQVRJT05fTU9ERS5vbkNoYW5nZSxcbiAgICBzaG91bGRGb2N1c0Vycm9yOiB0cnVlLFxufTtcbmNvbnN0IERFRkFVTFRfRk9STV9TVEFURSA9IHtcbiAgICBzdWJtaXRDb3VudDogMCxcbiAgICBpc0RpcnR5OiBmYWxzZSxcbiAgICBpc1JlYWR5OiBmYWxzZSxcbiAgICBpc1ZhbGlkYXRpbmc6IGZhbHNlLFxuICAgIGlzU3VibWl0dGVkOiBmYWxzZSxcbiAgICBpc1N1Ym1pdHRpbmc6IGZhbHNlLFxuICAgIGlzU3VibWl0U3VjY2Vzc2Z1bDogZmFsc2UsXG4gICAgaXNWYWxpZDogZmFsc2UsXG4gICAgdG91Y2hlZEZpZWxkczoge30sXG4gICAgZGlydHlGaWVsZHM6IHt9LFxuICAgIHZhbGlkYXRpbmdGaWVsZHM6IHt9LFxufTtcbmZ1bmN0aW9uIGNyZWF0ZUZvcm1Db250cm9sKHByb3BzID0ge30pIHtcbiAgICBsZXQgX29wdGlvbnMgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICB9O1xuICAgIGxldCBfZm9ybVN0YXRlID0ge1xuICAgICAgICAuLi5jbG9uZU9iamVjdChERUZBVUxUX0ZPUk1fU1RBVEUpLFxuICAgICAgICBpc0xvYWRpbmc6IGlzRnVuY3Rpb24oX29wdGlvbnMuZGVmYXVsdFZhbHVlcyksXG4gICAgICAgIGVycm9yczogX29wdGlvbnMuZXJyb3JzIHx8IHt9LFxuICAgICAgICBkaXNhYmxlZDogX29wdGlvbnMuZGlzYWJsZWQgfHwgZmFsc2UsXG4gICAgfTtcbiAgICBsZXQgX2ZpZWxkcyA9IHt9O1xuICAgIGxldCBfZGVmYXVsdFZhbHVlcyA9IGlzT2JqZWN0KF9vcHRpb25zLmRlZmF1bHRWYWx1ZXMpIHx8IGlzT2JqZWN0KF9vcHRpb25zLnZhbHVlcylcbiAgICAgICAgPyBjbG9uZU9iamVjdChfb3B0aW9ucy5kZWZhdWx0VmFsdWVzIHx8IF9vcHRpb25zLnZhbHVlcykgfHwge31cbiAgICAgICAgOiB7fTtcbiAgICBsZXQgX2Zvcm1WYWx1ZXMgPSBfb3B0aW9ucy5zaG91bGRVbnJlZ2lzdGVyXG4gICAgICAgID8ge31cbiAgICAgICAgOiBjbG9uZU9iamVjdChfZGVmYXVsdFZhbHVlcyk7XG4gICAgbGV0IF9zdGF0ZSA9IHtcbiAgICAgICAgYWN0aW9uOiBmYWxzZSxcbiAgICAgICAgbW91bnQ6IGZhbHNlLFxuICAgICAgICB3YXRjaDogZmFsc2UsXG4gICAgICAgIGtlZXBJc1ZhbGlkOiBmYWxzZSxcbiAgICB9O1xuICAgIGxldCBfbmFtZXMgPSB7XG4gICAgICAgIG1vdW50OiBuZXcgU2V0KCksXG4gICAgICAgIGRpc2FibGVkOiBuZXcgU2V0KCksXG4gICAgICAgIHVuTW91bnQ6IG5ldyBTZXQoKSxcbiAgICAgICAgYXJyYXk6IG5ldyBTZXQoKSxcbiAgICAgICAgd2F0Y2g6IG5ldyBTZXQoKSxcbiAgICAgICAgcmVnaXN0ZXJOYW1lOiBuZXcgU2V0KCksXG4gICAgfTtcbiAgICBsZXQgZGVsYXlFcnJvckNhbGxiYWNrO1xuICAgIGxldCB0aW1lciA9IDA7XG4gICAgY29uc3QgZGVmYXVsdFByb3h5Rm9ybVN0YXRlID0ge1xuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcbiAgICAgICAgZGlydHlGaWVsZHM6IGZhbHNlLFxuICAgICAgICB2YWxpZGF0aW5nRmllbGRzOiBmYWxzZSxcbiAgICAgICAgdG91Y2hlZEZpZWxkczogZmFsc2UsXG4gICAgICAgIGlzVmFsaWRhdGluZzogZmFsc2UsXG4gICAgICAgIGlzVmFsaWQ6IGZhbHNlLFxuICAgICAgICBlcnJvcnM6IGZhbHNlLFxuICAgIH07XG4gICAgY29uc3QgX3Byb3h5Rm9ybVN0YXRlID0ge1xuICAgICAgICAuLi5kZWZhdWx0UHJveHlGb3JtU3RhdGUsXG4gICAgfTtcbiAgICBsZXQgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlID0ge1xuICAgICAgICAuLi5fcHJveHlGb3JtU3RhdGUsXG4gICAgfTtcbiAgICBjb25zdCBfc3ViamVjdHMgPSB7XG4gICAgICAgIGFycmF5OiBjcmVhdGVTdWJqZWN0KCksXG4gICAgICAgIHN0YXRlOiBjcmVhdGVTdWJqZWN0KCksXG4gICAgfTtcbiAgICBjb25zdCBzaG91bGREaXNwbGF5QWxsQXNzb2NpYXRlZEVycm9ycyA9IF9vcHRpb25zLmNyaXRlcmlhTW9kZSA9PT0gVkFMSURBVElPTl9NT0RFLmFsbDtcbiAgICBjb25zdCBkZWJvdW5jZSA9IChjYWxsYmFjaykgPT4gKHdhaXQpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGNhbGxiYWNrLCB3YWl0KTtcbiAgICB9O1xuICAgIGNvbnN0IF9zZXRWYWxpZCA9IGFzeW5jIChzaG91bGRVcGRhdGVWYWxpZCkgPT4ge1xuICAgICAgICBpZiAoX3N0YXRlLmtlZXBJc1ZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFfb3B0aW9ucy5kaXNhYmxlZCAmJlxuICAgICAgICAgICAgKF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkIHx8XG4gICAgICAgICAgICAgICAgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmlzVmFsaWQgfHxcbiAgICAgICAgICAgICAgICBzaG91bGRVcGRhdGVWYWxpZCkpIHtcbiAgICAgICAgICAgIGxldCBpc1ZhbGlkO1xuICAgICAgICAgICAgaWYgKF9vcHRpb25zLnJlc29sdmVyKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGlzRW1wdHlPYmplY3QoKGF3YWl0IF9ydW5TY2hlbWEoKSkuZXJyb3JzKTtcbiAgICAgICAgICAgICAgICBfdXBkYXRlSXNWYWxpZGF0aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gYXdhaXQgZXhlY3V0ZUJ1aWx0SW5WYWxpZGF0aW9uKHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBfZmllbGRzLFxuICAgICAgICAgICAgICAgICAgICBvbmx5Q2hlY2tWYWxpZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiBFVkVOVFMuVkFMSUQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNWYWxpZCAhPT0gX2Zvcm1TdGF0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBfdXBkYXRlSXNWYWxpZGF0aW5nID0gKG5hbWVzLCBpc1ZhbGlkYXRpbmcpID0+IHtcbiAgICAgICAgaWYgKCFfb3B0aW9ucy5kaXNhYmxlZCAmJlxuICAgICAgICAgICAgKF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkYXRpbmcgfHxcbiAgICAgICAgICAgICAgICBfcHJveHlGb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcyB8fFxuICAgICAgICAgICAgICAgIF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS5pc1ZhbGlkYXRpbmcgfHxcbiAgICAgICAgICAgICAgICBfcHJveHlTdWJzY3JpYmVGb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcykpIHtcbiAgICAgICAgICAgIChuYW1lcyB8fCBBcnJheS5mcm9tKF9uYW1lcy5tb3VudCkpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkYXRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgID8gc2V0KF9mb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcywgbmFtZSwgaXNWYWxpZGF0aW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB1bnNldChfZm9ybVN0YXRlLnZhbGlkYXRpbmdGaWVsZHMsIG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpbmdGaWVsZHM6IF9mb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcyxcbiAgICAgICAgICAgICAgICBpc1ZhbGlkYXRpbmc6ICFpc0VtcHR5T2JqZWN0KF9mb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgX3VwZGF0ZURpcnR5RmllbGRzID0gKCkgPT4ge1xuICAgICAgICBfZm9ybVN0YXRlLmRpcnR5RmllbGRzID0gZ2V0RGlydHlGaWVsZHMoX2RlZmF1bHRWYWx1ZXMsIF9mb3JtVmFsdWVzKTtcbiAgICB9O1xuICAgIGNvbnN0IF9zZXRGaWVsZEFycmF5ID0gKG5hbWUsIHZhbHVlcyA9IFtdLCBtZXRob2QsIGFyZ3MsIHNob3VsZFNldFZhbHVlcyA9IHRydWUsIHNob3VsZFVwZGF0ZUZpZWxkc0FuZFN0YXRlID0gdHJ1ZSkgPT4ge1xuICAgICAgICBpZiAoYXJncyAmJiBtZXRob2QgJiYgIV9vcHRpb25zLmRpc2FibGVkKSB7XG4gICAgICAgICAgICBfc3RhdGUuYWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChzaG91bGRVcGRhdGVGaWVsZHNBbmRTdGF0ZSAmJiBBcnJheS5pc0FycmF5KGdldChfZmllbGRzLCBuYW1lKSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlcyA9IG1ldGhvZChnZXQoX2ZpZWxkcywgbmFtZSksIGFyZ3MuYXJnQSwgYXJncy5hcmdCKTtcbiAgICAgICAgICAgICAgICBzaG91bGRTZXRWYWx1ZXMgJiYgc2V0KF9maWVsZHMsIG5hbWUsIGZpZWxkVmFsdWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzaG91bGRVcGRhdGVGaWVsZHNBbmRTdGF0ZSAmJlxuICAgICAgICAgICAgICAgIEFycmF5LmlzQXJyYXkoZ2V0KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lKSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvcnMgPSBtZXRob2QoZ2V0KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lKSwgYXJncy5hcmdBLCBhcmdzLmFyZ0IpO1xuICAgICAgICAgICAgICAgIHNob3VsZFNldFZhbHVlcyAmJiBzZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIG5hbWUsIGVycm9ycyk7XG4gICAgICAgICAgICAgICAgdW5zZXRFbXB0eUFycmF5KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoX3Byb3h5Rm9ybVN0YXRlLnRvdWNoZWRGaWVsZHMgfHxcbiAgICAgICAgICAgICAgICBfcHJveHlTdWJzY3JpYmVGb3JtU3RhdGUudG91Y2hlZEZpZWxkcykgJiZcbiAgICAgICAgICAgICAgICBzaG91bGRVcGRhdGVGaWVsZHNBbmRTdGF0ZSAmJlxuICAgICAgICAgICAgICAgIEFycmF5LmlzQXJyYXkoZ2V0KF9mb3JtU3RhdGUudG91Y2hlZEZpZWxkcywgbmFtZSkpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG91Y2hlZEZpZWxkcyA9IG1ldGhvZChnZXQoX2Zvcm1TdGF0ZS50b3VjaGVkRmllbGRzLCBuYW1lKSwgYXJncy5hcmdBLCBhcmdzLmFyZ0IpO1xuICAgICAgICAgICAgICAgIHNob3VsZFNldFZhbHVlcyAmJiBzZXQoX2Zvcm1TdGF0ZS50b3VjaGVkRmllbGRzLCBuYW1lLCB0b3VjaGVkRmllbGRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChfcHJveHlGb3JtU3RhdGUuZGlydHlGaWVsZHMgfHwgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmRpcnR5RmllbGRzKSB7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZURpcnR5RmllbGRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBpc0RpcnR5OiBfZ2V0RGlydHkobmFtZSwgdmFsdWVzKSxcbiAgICAgICAgICAgICAgICBkaXJ0eUZpZWxkczogX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkcyxcbiAgICAgICAgICAgICAgICBlcnJvcnM6IF9mb3JtU3RhdGUuZXJyb3JzLFxuICAgICAgICAgICAgICAgIGlzVmFsaWQ6IF9mb3JtU3RhdGUuaXNWYWxpZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0KF9mb3JtVmFsdWVzLCBuYW1lLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCB1cGRhdGVFcnJvcnMgPSAobmFtZSwgZXJyb3IpID0+IHtcbiAgICAgICAgc2V0KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lLCBlcnJvcik7XG4gICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIGVycm9yczogX2Zvcm1TdGF0ZS5lcnJvcnMsXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgX3NldEVycm9ycyA9IChlcnJvcnMpID0+IHtcbiAgICAgICAgX2Zvcm1TdGF0ZS5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIGVycm9yczogX2Zvcm1TdGF0ZS5lcnJvcnMsXG4gICAgICAgICAgICBpc1ZhbGlkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBoYXNFeHBsaWNpdE51bGxJbnRlcm1lZGlhdGUgPSAobmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGlzS2V5KG5hbWUpID8gW25hbWVdIDogc3RyaW5nVG9QYXRoKG5hbWUpO1xuICAgICAgICBsZXQgZm9ybVZhbHVlcyA9IF9mb3JtVmFsdWVzO1xuICAgICAgICBsZXQgZGVmYXVsdFZhbHVlcyA9IF9kZWZhdWx0VmFsdWVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gc2VnbWVudHNbaV07XG4gICAgICAgICAgICBmb3JtVmFsdWVzID0gaXNOdWxsT3JVbmRlZmluZWQoZm9ybVZhbHVlcykgPyBmb3JtVmFsdWVzIDogZm9ybVZhbHVlc1trZXldO1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlcyA9IGlzTnVsbE9yVW5kZWZpbmVkKGRlZmF1bHRWYWx1ZXMpXG4gICAgICAgICAgICAgICAgPyBkZWZhdWx0VmFsdWVzXG4gICAgICAgICAgICAgICAgOiBkZWZhdWx0VmFsdWVzW2tleV07XG4gICAgICAgICAgICBpZiAoZm9ybVZhbHVlcyA9PT0gbnVsbCAmJiBkZWZhdWx0VmFsdWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgY29uc3QgdXBkYXRlVmFsaWRBbmRWYWx1ZSA9IChuYW1lLCBzaG91bGRTa2lwU2V0VmFsdWVBcywgdmFsdWUsIHJlZikgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZCA9IGdldChfZmllbGRzLCBuYW1lKTtcbiAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBpZiAoaGFzRXhwbGljaXROdWxsSW50ZXJtZWRpYXRlKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgd2FzVW5zZXRJbkZvcm1WYWx1ZXMgPSBpc1VuZGVmaW5lZChnZXQoX2Zvcm1WYWx1ZXMsIG5hbWUpKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldChfZm9ybVZhbHVlcywgbmFtZSwgaXNVbmRlZmluZWQodmFsdWUpID8gZ2V0KF9kZWZhdWx0VmFsdWVzLCBuYW1lKSA6IHZhbHVlKTtcbiAgICAgICAgICAgIGlzVW5kZWZpbmVkKGRlZmF1bHRWYWx1ZSkgfHxcbiAgICAgICAgICAgICAgICAocmVmICYmIHJlZi5kZWZhdWx0Q2hlY2tlZCkgfHxcbiAgICAgICAgICAgICAgICBzaG91bGRTa2lwU2V0VmFsdWVBc1xuICAgICAgICAgICAgICAgID8gc2V0KF9mb3JtVmFsdWVzLCBuYW1lLCBzaG91bGRTa2lwU2V0VmFsdWVBcyA/IGRlZmF1bHRWYWx1ZSA6IGdldEZpZWxkVmFsdWUoZmllbGQuX2YpKVxuICAgICAgICAgICAgICAgIDogc2V0RmllbGRWYWx1ZShuYW1lLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgaWYgKF9zdGF0ZS5tb3VudCAmJiAhX3N0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgIF9zZXRWYWxpZCgpO1xuICAgICAgICAgICAgICAgIC8vIFJlLXJlZ2lzdGVyaW5nIGEgZmllbGQgYWZ0ZXIgYSBwcmlvciB1bnJlZ2lzdGVyIHB1dHMgaXRzIGtleSBiYWNrXG4gICAgICAgICAgICAgICAgLy8gaW50byBfZm9ybVZhbHVlcywgd2hpY2ggY2FuIGZsaXAgaXNEaXJ0eSBiYWNrIHRvIGZhbHNlICgjMTMzOTcpLlxuICAgICAgICAgICAgICAgIC8vIE9ubHkgcnVuIHdoZW4gd2UgYXJlIGN1cnJlbnRseSBkaXJ0eSwgb3RoZXJ3aXNlIGFuIGluaXRpYWwgcmVnaXN0ZXJcbiAgICAgICAgICAgICAgICAvLyBmb3IgYSBmaWVsZCB3aXRoIG5vIGRlZmF1bHRWYWx1ZSB3b3VsZCBmbGlwIGlzRGlydHkgdG8gdHJ1ZS4gUmVzZXRcbiAgICAgICAgICAgICAgICAvLyBwYXRocyByZXBvcHVsYXRlIF9mb3JtVmFsdWVzIGJlZm9yZSByZS1yZWdpc3Rlciwgc28gdGhlIGtleSBpc1xuICAgICAgICAgICAgICAgIC8vIHByZXNlbnQgdGhlbiBhbmQgdGhpcyBicmFuY2ggaXMgc2tpcHBlZCAocHJlc2VydmVzIGtlZXBEaXJ0eSkuXG4gICAgICAgICAgICAgICAgaWYgKHdhc1Vuc2V0SW5Gb3JtVmFsdWVzICYmXG4gICAgICAgICAgICAgICAgICAgIF9mb3JtU3RhdGUuaXNEaXJ0eSAmJlxuICAgICAgICAgICAgICAgICAgICAoX3Byb3h5Rm9ybVN0YXRlLmlzRGlydHkgfHwgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmlzRGlydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRGlydHkgPSBfZ2V0RGlydHkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0RpcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZm9ybVN0YXRlLmlzRGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHsgLi4uX2Zvcm1TdGF0ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgdXBkYXRlVG91Y2hBbmREaXJ0eSA9IChuYW1lLCBmaWVsZFZhbHVlLCBpc0JsdXJFdmVudCwgc2hvdWxkRGlydHksIHNob3VsZFJlbmRlcikgPT4ge1xuICAgICAgICBsZXQgc2hvdWxkVXBkYXRlRmllbGQgPSBmYWxzZTtcbiAgICAgICAgbGV0IGlzUHJldmlvdXNEaXJ0eSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIV9vcHRpb25zLmRpc2FibGVkKSB7XG4gICAgICAgICAgICBpZiAoIWlzQmx1ckV2ZW50IHx8IHNob3VsZERpcnR5KSB7XG4gICAgICAgICAgICAgICAgaWYgKF9wcm94eUZvcm1TdGF0ZS5pc0RpcnR5IHx8IF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS5pc0RpcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJldmlvdXNEaXJ0eSA9IF9mb3JtU3RhdGUuaXNEaXJ0eTtcbiAgICAgICAgICAgICAgICAgICAgX2Zvcm1TdGF0ZS5pc0RpcnR5ID0gb3V0cHV0LmlzRGlydHkgPSBfZ2V0RGlydHkoKTtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlRmllbGQgPSBpc1ByZXZpb3VzRGlydHkgIT09IG91dHB1dC5pc0RpcnR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0N1cnJlbnRGaWVsZFByaXN0aW5lID0gZGVlcEVxdWFsKGdldChfZGVmYXVsdFZhbHVlcywgbmFtZSksIGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlzUHJldmlvdXNEaXJ0eSA9ICEhZ2V0KF9mb3JtU3RhdGUuZGlydHlGaWVsZHMsIG5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChpc0N1cnJlbnRGaWVsZFByaXN0aW5lICE9PSBfZm9ybVN0YXRlLmlzRGlydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkcyA9IGdldERpcnR5RmllbGRzKF9kZWZhdWx0VmFsdWVzLCBfZm9ybVZhbHVlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpc0N1cnJlbnRGaWVsZFByaXN0aW5lXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHVuc2V0KF9mb3JtU3RhdGUuZGlydHlGaWVsZHMsIG5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHNldChfZm9ybVN0YXRlLmRpcnR5RmllbGRzLCBuYW1lLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LmRpcnR5RmllbGRzID0gX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkcztcbiAgICAgICAgICAgICAgICBzaG91bGRVcGRhdGVGaWVsZCA9XG4gICAgICAgICAgICAgICAgICAgIHNob3VsZFVwZGF0ZUZpZWxkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoKF9wcm94eUZvcm1TdGF0ZS5kaXJ0eUZpZWxkcyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS5kaXJ0eUZpZWxkcykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ByZXZpb3VzRGlydHkgIT09ICFpc0N1cnJlbnRGaWVsZFByaXN0aW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0JsdXJFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzUHJldmlvdXNGaWVsZFRvdWNoZWQgPSBnZXQoX2Zvcm1TdGF0ZS50b3VjaGVkRmllbGRzLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzUHJldmlvdXNGaWVsZFRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0KF9mb3JtU3RhdGUudG91Y2hlZEZpZWxkcywgbmFtZSwgaXNCbHVyRXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQudG91Y2hlZEZpZWxkcyA9IF9mb3JtU3RhdGUudG91Y2hlZEZpZWxkcztcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlRmllbGQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlRmllbGQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKF9wcm94eUZvcm1TdGF0ZS50b3VjaGVkRmllbGRzIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS50b3VjaGVkRmllbGRzKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ByZXZpb3VzRmllbGRUb3VjaGVkICE9PSBpc0JsdXJFdmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hvdWxkVXBkYXRlRmllbGQgJiYgc2hvdWxkUmVuZGVyICYmIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNob3VsZFVwZGF0ZUZpZWxkID8gb3V0cHV0IDoge307XG4gICAgfTtcbiAgICBjb25zdCBzaG91bGRSZW5kZXJCeUVycm9yID0gKG5hbWUsIGlzVmFsaWQsIGVycm9yLCBmaWVsZFN0YXRlKSA9PiB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzRmllbGRFcnJvciA9IGdldChfZm9ybVN0YXRlLmVycm9ycywgbmFtZSk7XG4gICAgICAgIGNvbnN0IHNob3VsZFVwZGF0ZVZhbGlkID0gKF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkIHx8IF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS5pc1ZhbGlkKSAmJlxuICAgICAgICAgICAgaXNCb29sZWFuKGlzVmFsaWQpICYmXG4gICAgICAgICAgICBfZm9ybVN0YXRlLmlzVmFsaWQgIT09IGlzVmFsaWQ7XG4gICAgICAgIGlmIChfb3B0aW9ucy5kZWxheUVycm9yICYmIGVycm9yKSB7XG4gICAgICAgICAgICBkZWxheUVycm9yQ2FsbGJhY2sgPSBkZWJvdW5jZSgoKSA9PiB1cGRhdGVFcnJvcnMobmFtZSwgZXJyb3IpKTtcbiAgICAgICAgICAgIGRlbGF5RXJyb3JDYWxsYmFjayhfb3B0aW9ucy5kZWxheUVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICBkZWxheUVycm9yQ2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICAgICA/IHNldChfZm9ybVN0YXRlLmVycm9ycywgbmFtZSwgZXJyb3IpXG4gICAgICAgICAgICAgICAgOiB1bnNldChfZm9ybVN0YXRlLmVycm9ycywgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChlcnJvciA/ICFkZWVwRXF1YWwocHJldmlvdXNGaWVsZEVycm9yLCBlcnJvcikgOiBwcmV2aW91c0ZpZWxkRXJyb3IpIHx8XG4gICAgICAgICAgICAhaXNFbXB0eU9iamVjdChmaWVsZFN0YXRlKSB8fFxuICAgICAgICAgICAgc2hvdWxkVXBkYXRlVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWRGb3JtU3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgLi4uZmllbGRTdGF0ZSxcbiAgICAgICAgICAgICAgICAuLi4oc2hvdWxkVXBkYXRlVmFsaWQgJiYgaXNCb29sZWFuKGlzVmFsaWQpID8geyBpc1ZhbGlkIH0gOiB7fSksXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBfZm9ybVN0YXRlLmVycm9ycyxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIF9mb3JtU3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgLi4uX2Zvcm1TdGF0ZSxcbiAgICAgICAgICAgICAgICAuLi51cGRhdGVkRm9ybVN0YXRlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHVwZGF0ZWRGb3JtU3RhdGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBfcnVuU2NoZW1hID0gYXN5bmMgKG5hbWUpID0+IHtcbiAgICAgICAgX3VwZGF0ZUlzVmFsaWRhdGluZyhuYW1lLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IF9vcHRpb25zLnJlc29sdmVyKF9mb3JtVmFsdWVzLCBfb3B0aW9ucy5jb250ZXh0LCBnZXRSZXNvbHZlck9wdGlvbnMobmFtZSB8fCBfbmFtZXMubW91bnQsIF9maWVsZHMsIF9vcHRpb25zLmNyaXRlcmlhTW9kZSwgX29wdGlvbnMuc2hvdWxkVXNlTmF0aXZlVmFsaWRhdGlvbikpO1xuICAgIH07XG4gICAgY29uc3QgZXhlY3V0ZVNjaGVtYUFuZFVwZGF0ZVN0YXRlID0gYXN5bmMgKG5hbWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3JzIH0gPSBhd2FpdCBfcnVuU2NoZW1hKG5hbWVzKTtcbiAgICAgICAgX3VwZGF0ZUlzVmFsaWRhdGluZyhuYW1lcyk7XG4gICAgICAgIGlmIChuYW1lcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBnZXQoZXJyb3JzLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBlcnJvclxuICAgICAgICAgICAgICAgICAgICA/IF9uYW1lcy5hcnJheS5oYXMobmFtZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzT2JqZWN0KGVycm9yKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIU9iamVjdC5rZXlzKGVycm9yKS5zb21lKChrZXkpID0+ICFOdW1iZXIuaXNOYU4oTnVtYmVyKGtleSkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyB1cGRhdGVGaWVsZEFycmF5Um9vdEVycm9yKF9mb3JtU3RhdGUuZXJyb3JzLCB7IFtuYW1lXTogZXJyb3IgfSwgbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogc2V0KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lLCBlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgOiB1bnNldChfZm9ybVN0YXRlLmVycm9ycywgbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfZm9ybVN0YXRlLmVycm9ycyA9IGVycm9ycztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH07XG4gICAgY29uc3QgdmFsaWRhdGVGb3JtID0gYXN5bmMgKHsgbmFtZSwgZXZlbnRUeXBlLCB9KSA9PiB7XG4gICAgICAgIGlmIChwcm9wcy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvcHMudmFsaWRhdGUoe1xuICAgICAgICAgICAgICAgIGZvcm1WYWx1ZXM6IF9mb3JtVmFsdWVzLFxuICAgICAgICAgICAgICAgIGZvcm1TdGF0ZTogX2Zvcm1TdGF0ZSxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV2ZW50VHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSByZXN1bHRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFcnJvcihgJHtGT1JNX0VSUk9SX1RZUEV9LiR7a2V5fWAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBpc1N0cmluZyhlcnJvci5tZXNzYWdlKSA/IGVycm9yLm1lc3NhZ2UgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBlcnJvci50eXBlIHx8IElOUFVUX1ZBTElEQVRJT05fUlVMRVMudmFsaWRhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzU3RyaW5nKHJlc3VsdCkgfHwgIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHNldEVycm9yKEZPUk1fRVJST1JfVFlQRSwge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IElOUFVUX1ZBTElEQVRJT05fUlVMRVMudmFsaWRhdGUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhckVycm9ycyhGT1JNX0VSUk9SX1RZUEUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIGNvbnN0IGV4ZWN1dGVCdWlsdEluVmFsaWRhdGlvbiA9IGFzeW5jICh7IGZpZWxkcywgb25seUNoZWNrVmFsaWQsIG5hbWUsIGV2ZW50VHlwZSwgY29udGV4dCA9IHtcbiAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgIHJ1blJvb3RWYWxpZGF0aW9uOiBmYWxzZSxcbiAgICB9LCB9KSA9PiB7XG4gICAgICAgIGlmIChwcm9wcy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgY29udGV4dC5ydW5Sb290VmFsaWRhdGlvbiA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0ZUZvcm0oe1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAob25seUNoZWNrVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQudmFsaWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBmaWVsZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW25hbWVdO1xuICAgICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBfZiwgLi4uZmllbGRWYWx1ZSB9ID0gZmllbGQ7XG4gICAgICAgICAgICAgICAgaWYgKF9mKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRmllbGRBcnJheVJvb3QgPSBfbmFtZXMuYXJyYXkuaGFzKF9mLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1Byb21pc2VGdW5jdGlvbiA9IGZpZWxkLl9mICYmIGhhc1Byb21pc2VWYWxpZGF0aW9uKGZpZWxkLl9mKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkVHJhY2tJc1ZhbGlkYXRpbmdTdGF0ZSA9IF9wcm94eUZvcm1TdGF0ZS52YWxpZGF0aW5nRmllbGRzIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHJveHlGb3JtU3RhdGUuaXNWYWxpZGF0aW5nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHJveHlTdWJzY3JpYmVGb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmlzVmFsaWRhdGluZztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUHJvbWlzZUZ1bmN0aW9uICYmIHNob3VsZFRyYWNrSXNWYWxpZGF0aW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF91cGRhdGVJc1ZhbGlkYXRpbmcoW19mLm5hbWVdLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZEVycm9yID0gYXdhaXQgdmFsaWRhdGVGaWVsZChmaWVsZCwgX25hbWVzLmRpc2FibGVkLCBfZm9ybVZhbHVlcywgc2hvdWxkRGlzcGxheUFsbEFzc29jaWF0ZWRFcnJvcnMsIF9vcHRpb25zLnNob3VsZFVzZU5hdGl2ZVZhbGlkYXRpb24gJiYgIW9ubHlDaGVja1ZhbGlkLCBpc0ZpZWxkQXJyYXlSb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUHJvbWlzZUZ1bmN0aW9uICYmIHNob3VsZFRyYWNrSXNWYWxpZGF0aW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF91cGRhdGVJc1ZhbGlkYXRpbmcoW19mLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRFcnJvcltfZi5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlDaGVja1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgIW9ubHlDaGVja1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoZ2V0KGZpZWxkRXJyb3IsIF9mLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBpc0ZpZWxkQXJyYXlSb290XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdXBkYXRlRmllbGRBcnJheVJvb3RFcnJvcihfZm9ybVN0YXRlLmVycm9ycywgZmllbGRFcnJvciwgX2YubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIF9mLm5hbWUsIGZpZWxkRXJyb3JbX2YubmFtZV0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB1bnNldChfZm9ybVN0YXRlLmVycm9ycywgX2YubmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHMuc2hvdWxkVXNlTmF0aXZlVmFsaWRhdGlvbiAmJiBmaWVsZEVycm9yW19mLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAhaXNFbXB0eU9iamVjdChmaWVsZFZhbHVlKSAmJlxuICAgICAgICAgICAgICAgICAgICAoYXdhaXQgZXhlY3V0ZUJ1aWx0SW5WYWxpZGF0aW9uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmx5Q2hlY2tWYWxpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkczogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29udGV4dC52YWxpZDtcbiAgICB9O1xuICAgIGNvbnN0IF9yZW1vdmVVbm1vdW50ZWQgPSAoKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBfbmFtZXMudW5Nb3VudCkge1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICBmaWVsZCAmJlxuICAgICAgICAgICAgICAgIChmaWVsZC5fZi5yZWZzXG4gICAgICAgICAgICAgICAgICAgID8gZmllbGQuX2YucmVmcy5ldmVyeSgocmVmKSA9PiAhbGl2ZShyZWYpKVxuICAgICAgICAgICAgICAgICAgICA6ICFsaXZlKGZpZWxkLl9mLnJlZikpICYmXG4gICAgICAgICAgICAgICAgdW5yZWdpc3RlcihuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBfbmFtZXMudW5Nb3VudCA9IG5ldyBTZXQoKTtcbiAgICB9O1xuICAgIGNvbnN0IF9nZXREaXJ0eSA9IChuYW1lLCBkYXRhKSA9PiAhX29wdGlvbnMuZGlzYWJsZWQgJiZcbiAgICAgICAgKG5hbWUgJiYgZGF0YSAmJiBzZXQoX2Zvcm1WYWx1ZXMsIG5hbWUsIGRhdGEpLFxuICAgICAgICAgICAgIWRlZXBFcXVhbChnZXRWYWx1ZXMoKSwgX2RlZmF1bHRWYWx1ZXMpKTtcbiAgICBjb25zdCBfZ2V0V2F0Y2ggPSAobmFtZXMsIGRlZmF1bHRWYWx1ZSwgaXNHbG9iYWwpID0+IGdlbmVyYXRlV2F0Y2hPdXRwdXQobmFtZXMsIF9uYW1lcywge1xuICAgICAgICAuLi4oX3N0YXRlLm1vdW50XG4gICAgICAgICAgICA/IF9mb3JtVmFsdWVzXG4gICAgICAgICAgICA6IGlzVW5kZWZpbmVkKGRlZmF1bHRWYWx1ZSlcbiAgICAgICAgICAgICAgICA/IF9kZWZhdWx0VmFsdWVzXG4gICAgICAgICAgICAgICAgOiBpc1N0cmluZyhuYW1lcylcbiAgICAgICAgICAgICAgICAgICAgPyB7IFtuYW1lc106IGRlZmF1bHRWYWx1ZSB9XG4gICAgICAgICAgICAgICAgICAgIDogZGVmYXVsdFZhbHVlKSxcbiAgICB9LCBpc0dsb2JhbCwgZGVmYXVsdFZhbHVlKTtcbiAgICBjb25zdCBfZ2V0RmllbGRBcnJheSA9IChuYW1lKSA9PiBjb21wYWN0KGdldChfc3RhdGUubW91bnQgPyBfZm9ybVZhbHVlcyA6IF9kZWZhdWx0VmFsdWVzLCBuYW1lLCBfb3B0aW9ucy5zaG91bGRVbnJlZ2lzdGVyID8gZ2V0KF9kZWZhdWx0VmFsdWVzLCBuYW1lLCBbXSkgOiBbXSkpO1xuICAgIGNvbnN0IHNldEZpZWxkVmFsdWUgPSAobmFtZSwgdmFsdWUsIG9wdGlvbnMgPSB7fSwgc2tpcENsb25lID0gZmFsc2UpID0+IHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgIGxldCBmaWVsZFZhbHVlID0gdmFsdWU7XG4gICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgY29uc3QgZmllbGRSZWZlcmVuY2UgPSBmaWVsZC5fZjtcbiAgICAgICAgICAgIGlmIChmaWVsZFJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICFmaWVsZFJlZmVyZW5jZS5kaXNhYmxlZCAmJlxuICAgICAgICAgICAgICAgICAgICBzZXQoX2Zvcm1WYWx1ZXMsIG5hbWUsIGdldEZpZWxkVmFsdWVBcyh2YWx1ZSwgZmllbGRSZWZlcmVuY2UpKTtcbiAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgaXNIVE1MRWxlbWVudChmaWVsZFJlZmVyZW5jZS5yZWYpICYmIGlzTnVsbE9yVW5kZWZpbmVkKHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoaXNNdWx0aXBsZVNlbGVjdChmaWVsZFJlZmVyZW5jZS5yZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIFsuLi5maWVsZFJlZmVyZW5jZS5yZWYub3B0aW9uc10uZm9yRWFjaCgob3B0aW9uUmVmKSA9PiAob3B0aW9uUmVmLnNlbGVjdGVkID0gZmllbGRWYWx1ZS5pbmNsdWRlcyhvcHRpb25SZWYudmFsdWUpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkUmVmZXJlbmNlLnJlZnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ2hlY2tCb3hJbnB1dChmaWVsZFJlZmVyZW5jZS5yZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFJlZmVyZW5jZS5yZWZzLmZvckVhY2goKGNoZWNrYm94UmVmKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2JveFJlZi5kZWZhdWx0Q2hlY2tlZCB8fCAhY2hlY2tib3hSZWYuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmllbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94UmVmLmNoZWNrZWQgPSAhIWZpZWxkVmFsdWUuZmluZCgoZGF0YSkgPT4gZGF0YSA9PT0gY2hlY2tib3hSZWYudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3hSZWYuY2hlY2tlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9PT0gY2hlY2tib3hSZWYudmFsdWUgfHwgISFmaWVsZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFJlZmVyZW5jZS5yZWZzLmZvckVhY2goKHJhZGlvUmVmKSA9PiAocmFkaW9SZWYuY2hlY2tlZCA9IHJhZGlvUmVmLnZhbHVlID09PSBmaWVsZFZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNGaWxlSW5wdXQoZmllbGRSZWZlcmVuY2UucmVmKSkge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFJlZmVyZW5jZS5yZWYudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkUmVmZXJlbmNlLnJlZi52YWx1ZSA9IGZpZWxkVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmllbGRSZWZlcmVuY2UucmVmLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogc2tpcENsb25lID8gX2Zvcm1WYWx1ZXMgOiBjbG9uZU9iamVjdChfZm9ybVZhbHVlcyksXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAob3B0aW9ucy5zaG91bGREaXJ0eSB8fCBvcHRpb25zLnNob3VsZFRvdWNoKSAmJlxuICAgICAgICAgICAgdXBkYXRlVG91Y2hBbmREaXJ0eShuYW1lLCBmaWVsZFZhbHVlLCBvcHRpb25zLnNob3VsZFRvdWNoLCBvcHRpb25zLnNob3VsZERpcnR5LCB0cnVlKTtcbiAgICAgICAgb3B0aW9ucy5zaG91bGRWYWxpZGF0ZSAmJiB0cmlnZ2VyKG5hbWUpO1xuICAgIH07XG4gICAgY29uc3Qgc2V0RmllbGRWYWx1ZXMgPSAobmFtZSwgdmFsdWUsIG9wdGlvbnMsIHNraXBDbG9uZSA9IGZhbHNlKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgZmllbGRLZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUuaGFzT3duUHJvcGVydHkoZmllbGRLZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHZhbHVlW2ZpZWxkS2V5XTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IG5hbWUgKyAnLicgKyBmaWVsZEtleTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KF9maWVsZHMsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAoX25hbWVzLmFycmF5LmhhcyhuYW1lKSB8fFxuICAgICAgICAgICAgICAgIGlzT2JqZWN0KGZpZWxkVmFsdWUpIHx8XG4gICAgICAgICAgICAgICAgKGZpZWxkICYmICFmaWVsZC5fZikpICYmXG4gICAgICAgICAgICAgICAgIWlzRGF0ZU9iamVjdChmaWVsZFZhbHVlKVxuICAgICAgICAgICAgICAgID8gc2V0RmllbGRWYWx1ZXMoZmllbGROYW1lLCBmaWVsZFZhbHVlLCBvcHRpb25zLCBza2lwQ2xvbmUpXG4gICAgICAgICAgICAgICAgOiBzZXRGaWVsZFZhbHVlKGZpZWxkTmFtZSwgZmllbGRWYWx1ZSwgb3B0aW9ucywgc2tpcENsb25lKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgX3NldFZhbHVlID0gKG5hbWUsIHZhbHVlLCBvcHRpb25zLCBza2lwQ2xvbmUpID0+IHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgIGNvbnN0IGlzRmllbGRBcnJheSA9IF9uYW1lcy5hcnJheS5oYXMobmFtZSk7XG4gICAgICAgIGNvbnN0IGNsb25lVmFsdWUgPSBza2lwQ2xvbmUgPyB2YWx1ZSA6IGNsb25lT2JqZWN0KHZhbHVlKTtcbiAgICAgICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGdldChfZm9ybVZhbHVlcywgbmFtZSk7XG4gICAgICAgIGNvbnN0IGlzVmFsdWVVbmNoYW5nZWQgPSBkZWVwRXF1YWwocHJldmlvdXNWYWx1ZSwgY2xvbmVWYWx1ZSk7XG4gICAgICAgIGlmICghaXNWYWx1ZVVuY2hhbmdlZCkge1xuICAgICAgICAgICAgc2V0KF9mb3JtVmFsdWVzLCBuYW1lLCBjbG9uZVZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNGaWVsZEFycmF5KSB7XG4gICAgICAgICAgICBfc3ViamVjdHMuYXJyYXkubmV4dCh7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IHNraXBDbG9uZSA/IF9mb3JtVmFsdWVzIDogY2xvbmVPYmplY3QoX2Zvcm1WYWx1ZXMpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoKF9wcm94eUZvcm1TdGF0ZS5pc0RpcnR5IHx8XG4gICAgICAgICAgICAgICAgX3Byb3h5Rm9ybVN0YXRlLmRpcnR5RmllbGRzIHx8XG4gICAgICAgICAgICAgICAgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmlzRGlydHkgfHxcbiAgICAgICAgICAgICAgICBfcHJveHlTdWJzY3JpYmVGb3JtU3RhdGUuZGlydHlGaWVsZHMpICYmXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zaG91bGREaXJ0eSkge1xuICAgICAgICAgICAgICAgIF91cGRhdGVEaXJ0eUZpZWxkcygpO1xuICAgICAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZGlydHlGaWVsZHM6IF9mb3JtU3RhdGUuZGlydHlGaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIGlzRGlydHk6IF9nZXREaXJ0eShuYW1lLCBjbG9uZVZhbHVlKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGlzRW1wdHkgPSAoQXJyYXkuaXNBcnJheShjbG9uZVZhbHVlKSAmJiAhY2xvbmVWYWx1ZS5sZW5ndGgpIHx8XG4gICAgICAgICAgICAgICAgaXNFbXB0eU9iamVjdChjbG9uZVZhbHVlKTtcbiAgICAgICAgICAgIGlmICghZmllbGQgfHwgZmllbGQuX2YgfHwgaXNOdWxsT3JVbmRlZmluZWQoY2xvbmVWYWx1ZSkgfHwgaXNFbXB0eSkge1xuICAgICAgICAgICAgICAgIHNldEZpZWxkVmFsdWUobmFtZSwgY2xvbmVWYWx1ZSwgb3B0aW9ucywgc2tpcENsb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldEZpZWxkVmFsdWVzKG5hbWUsIGNsb25lVmFsdWUsIG9wdGlvbnMsIHNraXBDbG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1ZhbHVlVW5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBjb25zdCB3YXRjaGVkID0gaXNXYXRjaGVkKG5hbWUsIF9uYW1lcyk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBza2lwQ2xvbmUgPyBfZm9ybVZhbHVlcyA6IGNsb25lT2JqZWN0KF9mb3JtVmFsdWVzKTtcbiAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICAuLi4od2F0Y2hlZCAmJiBfZm9ybVN0YXRlKSxcbiAgICAgICAgICAgICAgICBuYW1lOiBfc3RhdGUubW91bnQgfHwgd2F0Y2hlZCA/IG5hbWUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdmFsdWVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IHNldFZhbHVlID0gKG5hbWUsIHZhbHVlLCBvcHRpb25zID0ge30pID0+IF9zZXRWYWx1ZShuYW1lLCB2YWx1ZSwgb3B0aW9ucywgZmFsc2UpO1xuICAgIGNvbnN0IHNldFZhbHVlcyA9IChmb3JtVmFsdWVzLCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlZEZvcm1WYWx1ZXMgPSBpc0Z1bmN0aW9uKGZvcm1WYWx1ZXMpXG4gICAgICAgICAgICA/IGZvcm1WYWx1ZXMoX2Zvcm1WYWx1ZXMpXG4gICAgICAgICAgICA6IGZvcm1WYWx1ZXM7XG4gICAgICAgIGlmICghZGVlcEVxdWFsKF9mb3JtVmFsdWVzLCB1cGRhdGVkRm9ybVZhbHVlcykpIHtcbiAgICAgICAgICAgIF9mb3JtVmFsdWVzID0ge1xuICAgICAgICAgICAgICAgIC4uLl9mb3JtVmFsdWVzLFxuICAgICAgICAgICAgICAgIC4uLnVwZGF0ZWRGb3JtVmFsdWVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmllbGROYW1lIG9mIF9uYW1lcy5tb3VudCkge1xuICAgICAgICAgICAgICAgIF9zZXRWYWx1ZShmaWVsZE5hbWUsIGdldCh1cGRhdGVkRm9ybVZhbHVlcywgZmllbGROYW1lKSwgb3B0aW9ucywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgLi4uX2Zvcm1TdGF0ZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdHlwZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHZhbHVlczogX2Zvcm1WYWx1ZXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3VsZFZhbGlkYXRlKSB7XG4gICAgICAgICAgICAgICAgX3NldFZhbGlkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IG9uQ2hhbmdlID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgIF9zdGF0ZS5tb3VudCA9IHRydWU7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgbGV0IG5hbWUgPSB0YXJnZXQubmFtZTtcbiAgICAgICAgbGV0IGlzRmllbGRWYWx1ZVVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBmaWVsZCA9IGdldChfZmllbGRzLCBuYW1lKTtcbiAgICAgICAgY29uc3QgX3VwZGF0ZUlzRmllbGRWYWx1ZVVwZGF0ZWQgPSAoZmllbGRWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgaXNGaWVsZFZhbHVlVXBkYXRlZCA9XG4gICAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGZpZWxkVmFsdWUpIHx8XG4gICAgICAgICAgICAgICAgICAgIChpc0RhdGVPYmplY3QoZmllbGRWYWx1ZSkgJiYgaXNOYU4oZmllbGRWYWx1ZS5nZXRUaW1lKCkpKSB8fFxuICAgICAgICAgICAgICAgICAgICBkZWVwRXF1YWwoZmllbGRWYWx1ZSwgZ2V0KF9mb3JtVmFsdWVzLCBuYW1lLCBmaWVsZFZhbHVlKSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHZhbGlkYXRpb25Nb2RlQmVmb3JlU3VibWl0ID0gZ2V0VmFsaWRhdGlvbk1vZGVzKF9vcHRpb25zLm1vZGUpO1xuICAgICAgICBjb25zdCB2YWxpZGF0aW9uTW9kZUFmdGVyU3VibWl0ID0gZ2V0VmFsaWRhdGlvbk1vZGVzKF9vcHRpb25zLnJlVmFsaWRhdGVNb2RlKTtcbiAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgICBsZXQgaXNWYWxpZDtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSB0YXJnZXQudHlwZVxuICAgICAgICAgICAgICAgID8gZ2V0RmllbGRWYWx1ZShmaWVsZC5fZilcbiAgICAgICAgICAgICAgICA6IGdldEV2ZW50VmFsdWUoZXZlbnQpO1xuICAgICAgICAgICAgY29uc3QgaXNCbHVyRXZlbnQgPSBldmVudC50eXBlID09PSBFVkVOVFMuQkxVUiB8fCBldmVudC50eXBlID09PSBFVkVOVFMuRk9DVVNfT1VUO1xuICAgICAgICAgICAgY29uc3Qgc2hvdWxkU2tpcFZhbGlkYXRpb24gPSAoIWhhc1ZhbGlkYXRpb24oZmllbGQuX2YpICYmXG4gICAgICAgICAgICAgICAgIXByb3BzLnZhbGlkYXRlICYmXG4gICAgICAgICAgICAgICAgIV9vcHRpb25zLnJlc29sdmVyICYmXG4gICAgICAgICAgICAgICAgIWdldChfZm9ybVN0YXRlLmVycm9ycywgbmFtZSkgJiZcbiAgICAgICAgICAgICAgICAhZmllbGQuX2YuZGVwcykgfHxcbiAgICAgICAgICAgICAgICBza2lwVmFsaWRhdGlvbihpc0JsdXJFdmVudCwgZ2V0KF9mb3JtU3RhdGUudG91Y2hlZEZpZWxkcywgbmFtZSksIF9mb3JtU3RhdGUuaXNTdWJtaXR0ZWQsIHZhbGlkYXRpb25Nb2RlQWZ0ZXJTdWJtaXQsIHZhbGlkYXRpb25Nb2RlQmVmb3JlU3VibWl0KTtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZWQgPSBpc1dhdGNoZWQobmFtZSwgX25hbWVzLCBpc0JsdXJFdmVudCk7XG4gICAgICAgICAgICBzZXQoX2Zvcm1WYWx1ZXMsIG5hbWUsIGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgaWYgKGlzQmx1ckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQgfHwgIXRhcmdldC5yZWFkT25seSkge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC5fZi5vbkJsdXIgJiYgZmllbGQuX2Yub25CbHVyKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZGVsYXlFcnJvckNhbGxiYWNrICYmIGRlbGF5RXJyb3JDYWxsYmFjaygwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChmaWVsZC5fZi5vbkNoYW5nZSkge1xuICAgICAgICAgICAgICAgIGZpZWxkLl9mLm9uQ2hhbmdlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU3RhdGUgPSB1cGRhdGVUb3VjaEFuZERpcnR5KG5hbWUsIGZpZWxkVmFsdWUsIGlzQmx1ckV2ZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFJlbmRlciA9ICFpc0VtcHR5T2JqZWN0KGZpZWxkU3RhdGUpIHx8IHdhdGNoZWQ7XG4gICAgICAgICAgICAhaXNCbHVyRXZlbnQgJiZcbiAgICAgICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlczogY2xvbmVPYmplY3QoX2Zvcm1WYWx1ZXMpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHNob3VsZFNraXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkIHx8IF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfb3B0aW9ucy5tb2RlID09PSAnb25CbHVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQmx1ckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3NldFZhbGlkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWlzQmx1ckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0VmFsaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKHNob3VsZFJlbmRlciAmJlxuICAgICAgICAgICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7IG5hbWUsIC4uLih3YXRjaGVkID8ge30gOiBmaWVsZFN0YXRlKSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIV9vcHRpb25zLnJlc29sdmVyICYmIHByb3BzLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdmFsaWRhdGVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgIWlzQmx1ckV2ZW50ICYmIHdhdGNoZWQgJiYgX3N1YmplY3RzLnN0YXRlLm5leHQoeyAuLi5fZm9ybVN0YXRlIH0pO1xuICAgICAgICAgICAgaWYgKF9vcHRpb25zLnJlc29sdmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBlcnJvcnMgfSA9IGF3YWl0IF9ydW5TY2hlbWEoW25hbWVdKTtcbiAgICAgICAgICAgICAgICBfdXBkYXRlSXNWYWxpZGF0aW5nKFtuYW1lXSk7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZUlzRmllbGRWYWx1ZVVwZGF0ZWQoZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzRmllbGRWYWx1ZVVwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldmlvdXNFcnJvckxvb2t1cFJlc3VsdCA9IHNjaGVtYUVycm9yTG9va3VwKF9mb3JtU3RhdGUuZXJyb3JzLCBfZmllbGRzLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JMb29rdXBSZXN1bHQgPSBzY2hlbWFFcnJvckxvb2t1cChlcnJvcnMsIF9maWVsZHMsIHByZXZpb3VzRXJyb3JMb29rdXBSZXN1bHQubmFtZSB8fCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBlcnJvckxvb2t1cFJlc3VsdC5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGVycm9yTG9va3VwUmVzdWx0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBpc0VtcHR5T2JqZWN0KGVycm9ycyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZUlzVmFsaWRhdGluZyhbbmFtZV0sIHRydWUpO1xuICAgICAgICAgICAgICAgIGVycm9yID0gKGF3YWl0IHZhbGlkYXRlRmllbGQoZmllbGQsIF9uYW1lcy5kaXNhYmxlZCwgX2Zvcm1WYWx1ZXMsIHNob3VsZERpc3BsYXlBbGxBc3NvY2lhdGVkRXJyb3JzLCBfb3B0aW9ucy5zaG91bGRVc2VOYXRpdmVWYWxpZGF0aW9uKSlbbmFtZV07XG4gICAgICAgICAgICAgICAgX3VwZGF0ZUlzVmFsaWRhdGluZyhbbmFtZV0pO1xuICAgICAgICAgICAgICAgIF91cGRhdGVJc0ZpZWxkVmFsdWVVcGRhdGVkKGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChpc0ZpZWxkVmFsdWVVcGRhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHJveHlTdWJzY3JpYmVGb3JtU3RhdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IGF3YWl0IGV4ZWN1dGVCdWlsdEluVmFsaWRhdGlvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBfZmllbGRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubHlDaGVja1ZhbGlkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNGaWVsZFZhbHVlVXBkYXRlZCkge1xuICAgICAgICAgICAgICAgIGZpZWxkLl9mLmRlcHMgJiZcbiAgICAgICAgICAgICAgICAgICAgKCFBcnJheS5pc0FycmF5KGZpZWxkLl9mLmRlcHMpIHx8IGZpZWxkLl9mLmRlcHMubGVuZ3RoID4gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcihmaWVsZC5fZi5kZXBzKTtcbiAgICAgICAgICAgICAgICBzaG91bGRSZW5kZXJCeUVycm9yKG5hbWUsIGlzVmFsaWQsIGVycm9yLCBmaWVsZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgX2ZvY3VzSW5wdXQgPSAocmVmLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGdldChfZm9ybVN0YXRlLmVycm9ycywga2V5KSAmJiByZWYuZm9jdXMpIHtcbiAgICAgICAgICAgIHJlZi5mb2N1cygpO1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH07XG4gICAgY29uc3QgdHJpZ2dlciA9IGFzeW5jIChuYW1lLCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgbGV0IGlzVmFsaWQ7XG4gICAgICAgIGxldCB2YWxpZGF0aW9uUmVzdWx0O1xuICAgICAgICBjb25zdCBmaWVsZE5hbWVzID0gY29udmVydFRvQXJyYXlQYXlsb2FkKG5hbWUpO1xuICAgICAgICBpZiAoX29wdGlvbnMucmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9ycyA9IGF3YWl0IGV4ZWN1dGVTY2hlbWFBbmRVcGRhdGVTdGF0ZShpc1VuZGVmaW5lZChuYW1lKSA/IG5hbWUgOiBmaWVsZE5hbWVzKTtcbiAgICAgICAgICAgIGlzVmFsaWQgPSBpc0VtcHR5T2JqZWN0KGVycm9ycyk7XG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0ID0gbmFtZVxuICAgICAgICAgICAgICAgID8gIWZpZWxkTmFtZXMuc29tZSgobmFtZSkgPT4gZ2V0KGVycm9ycywgbmFtZSkpXG4gICAgICAgICAgICAgICAgOiBpc1ZhbGlkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQgPSAoYXdhaXQgUHJvbWlzZS5hbGwoZmllbGROYW1lcy5tYXAoYXN5bmMgKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KF9maWVsZHMsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGV4ZWN1dGVCdWlsdEluVmFsaWRhdGlvbih7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkczogZmllbGQgJiYgZmllbGQuX2YgPyB7IFtmaWVsZE5hbWVdOiBmaWVsZCB9IDogZmllbGQsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogRVZFTlRTLlRSSUdHRVIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KSkpLmV2ZXJ5KEJvb2xlYW4pO1xuICAgICAgICAgICAgISghdmFsaWRhdGlvblJlc3VsdCAmJiAhX2Zvcm1TdGF0ZS5pc1ZhbGlkKSAmJiBfc2V0VmFsaWQoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQgPSBpc1ZhbGlkID0gYXdhaXQgZXhlY3V0ZUJ1aWx0SW5WYWxpZGF0aW9uKHtcbiAgICAgICAgICAgICAgICBmaWVsZHM6IF9maWVsZHMsXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBldmVudFR5cGU6IEVWRU5UUy5UUklHR0VSLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgLi4uKCFpc1N0cmluZyhuYW1lKSB8fFxuICAgICAgICAgICAgICAgICgoX3Byb3h5Rm9ybVN0YXRlLmlzVmFsaWQgfHwgX3Byb3h5U3Vic2NyaWJlRm9ybVN0YXRlLmlzVmFsaWQpICYmXG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgIT09IF9mb3JtU3RhdGUuaXNWYWxpZClcbiAgICAgICAgICAgICAgICA/IHt9XG4gICAgICAgICAgICAgICAgOiB7IG5hbWUgfSksXG4gICAgICAgICAgICAuLi4oX29wdGlvbnMucmVzb2x2ZXIgfHwgIW5hbWUgPyB7IGlzVmFsaWQgfSA6IHt9KSxcbiAgICAgICAgICAgIGVycm9yczogX2Zvcm1TdGF0ZS5lcnJvcnMsXG4gICAgICAgIH0pO1xuICAgICAgICBvcHRpb25zLnNob3VsZEZvY3VzICYmXG4gICAgICAgICAgICAhdmFsaWRhdGlvblJlc3VsdCAmJlxuICAgICAgICAgICAgaXRlcmF0ZUZpZWxkc0J5QWN0aW9uKF9maWVsZHMsIF9mb2N1c0lucHV0LCBuYW1lID8gZmllbGROYW1lcyA6IF9uYW1lcy5tb3VudCk7XG4gICAgICAgIHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuICAgIH07XG4gICAgY29uc3QgZ2V0VmFsdWVzID0gKGZpZWxkTmFtZXMsIGNvbmZpZykgPT4ge1xuICAgICAgICBsZXQgdmFsdWVzID0ge1xuICAgICAgICAgICAgLi4uKF9zdGF0ZS5tb3VudCA/IF9mb3JtVmFsdWVzIDogX2RlZmF1bHRWYWx1ZXMpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29uZmlnKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSBleHRyYWN0Rm9ybVZhbHVlcyhjb25maWcuZGlydHlGaWVsZHMgPyBfZm9ybVN0YXRlLmRpcnR5RmllbGRzIDogX2Zvcm1TdGF0ZS50b3VjaGVkRmllbGRzLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc1VuZGVmaW5lZChmaWVsZE5hbWVzKVxuICAgICAgICAgICAgPyB2YWx1ZXNcbiAgICAgICAgICAgIDogaXNTdHJpbmcoZmllbGROYW1lcylcbiAgICAgICAgICAgICAgICA/IGdldCh2YWx1ZXMsIGZpZWxkTmFtZXMpXG4gICAgICAgICAgICAgICAgOiBmaWVsZE5hbWVzLm1hcCgobmFtZSkgPT4gZ2V0KHZhbHVlcywgbmFtZSkpO1xuICAgIH07XG4gICAgY29uc3QgZ2V0RmllbGRTdGF0ZSA9IChuYW1lLCBmb3JtU3RhdGUpID0+ICh7XG4gICAgICAgIGludmFsaWQ6ICEhZ2V0KChmb3JtU3RhdGUgfHwgX2Zvcm1TdGF0ZSkuZXJyb3JzLCBuYW1lKSxcbiAgICAgICAgaXNEaXJ0eTogISFnZXQoKGZvcm1TdGF0ZSB8fCBfZm9ybVN0YXRlKS5kaXJ0eUZpZWxkcywgbmFtZSksXG4gICAgICAgIGVycm9yOiBnZXQoKGZvcm1TdGF0ZSB8fCBfZm9ybVN0YXRlKS5lcnJvcnMsIG5hbWUpLFxuICAgICAgICBpc1ZhbGlkYXRpbmc6ICEhZ2V0KF9mb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcywgbmFtZSksXG4gICAgICAgIGlzVG91Y2hlZDogISFnZXQoKGZvcm1TdGF0ZSB8fCBfZm9ybVN0YXRlKS50b3VjaGVkRmllbGRzLCBuYW1lKSxcbiAgICB9KTtcbiAgICBjb25zdCBjbGVhckVycm9ycyA9IChuYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWVzID0gbmFtZSA/IGNvbnZlcnRUb0FycmF5UGF5bG9hZChuYW1lKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgbmFtZXMgPT09IG51bGwgfHwgbmFtZXMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IG5hbWVzLmZvckVhY2goKGlucHV0TmFtZSkgPT4gdW5zZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIGlucHV0TmFtZSkpO1xuICAgICAgICBpZiAobmFtZXMpIHtcbiAgICAgICAgICAgIC8vIEVtaXQgZm9yIGVhY2ggY2xlYXJlZCBmaWVsZCB3aXRoIHRoZSBmaWVsZCBuYW1lIHNvIHRoYXRcbiAgICAgICAgICAgIC8vIHNob3VsZFN1YnNjcmliZUJ5TmFtZSBjYW4gZmlsdGVyIGFuZCBhdm9pZCBicm9hZCByZS1yZW5kZXJzXG4gICAgICAgICAgICBuYW1lcy5mb3JFYWNoKChpbnB1dE5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGlucHV0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzOiBfZm9ybVN0YXRlLmVycm9ycyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2xlYXIgYWxsIGVycm9ycyAtIGVtaXQgd2l0aG91dCBuYW1lIHRvIG5vdGlmeSBhbGwgc3Vic2NyaWJlcnNcbiAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICBlcnJvcnM6IHt9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IHNldEVycm9yID0gKG5hbWUsIGVycm9yLCBvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IChnZXQoX2ZpZWxkcywgbmFtZSwgeyBfZjoge30gfSkuX2YgfHwge30pLnJlZjtcbiAgICAgICAgY29uc3QgY3VycmVudEVycm9yID0gZ2V0KF9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lKSB8fCB7fTtcbiAgICAgICAgLy8gRG9uJ3Qgb3ZlcnJpZGUgZXhpc3RpbmcgZXJyb3IgbWVzc2FnZXMgZWxzZXdoZXJlIGluIHRoZSBvYmplY3QgdHJlZS5cbiAgICAgICAgY29uc3QgeyByZWY6IGN1cnJlbnRSZWYsIG1lc3NhZ2UsIHR5cGUsIC4uLnJlc3RPZkVycm9yVHJlZSB9ID0gY3VycmVudEVycm9yO1xuICAgICAgICBzZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIG5hbWUsIHtcbiAgICAgICAgICAgIC4uLnJlc3RPZkVycm9yVHJlZSxcbiAgICAgICAgICAgIC4uLmVycm9yLFxuICAgICAgICAgICAgcmVmLFxuICAgICAgICB9KTtcbiAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGVycm9yczogX2Zvcm1TdGF0ZS5lcnJvcnMsXG4gICAgICAgICAgICBpc1ZhbGlkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIG9wdGlvbnMgJiYgb3B0aW9ucy5zaG91bGRGb2N1cyAmJiByZWYgJiYgcmVmLmZvY3VzICYmIHJlZi5mb2N1cygpO1xuICAgIH07XG4gICAgY29uc3Qgd2F0Y2ggPSAobmFtZSwgZGVmYXVsdFZhbHVlKSA9PiBpc0Z1bmN0aW9uKG5hbWUpXG4gICAgICAgID8gX3N1YmplY3RzLnN0YXRlLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBuZXh0OiAocGF5bG9hZCkgPT4gJ3ZhbHVlcycgaW4gcGF5bG9hZCAmJlxuICAgICAgICAgICAgICAgIG5hbWUocGF5bG9hZC52YWx1ZXMgfHwgX2dldFdhdGNoKHVuZGVmaW5lZCwgZGVmYXVsdFZhbHVlKSwgcGF5bG9hZCksXG4gICAgICAgIH0pXG4gICAgICAgIDogX2dldFdhdGNoKG5hbWUsIGRlZmF1bHRWYWx1ZSwgdHJ1ZSk7XG4gICAgY29uc3QgX3N1YnNjcmliZSA9IChwcm9wcykgPT4gX3N1YmplY3RzLnN0YXRlLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6IChmb3JtU3RhdGUpID0+IHtcbiAgICAgICAgICAgIGlmIChzaG91bGRTdWJzY3JpYmVCeU5hbWUocHJvcHMubmFtZSwgZm9ybVN0YXRlLm5hbWUsIHByb3BzLmV4YWN0KSAmJlxuICAgICAgICAgICAgICAgIHNob3VsZFJlbmRlckZvcm1TdGF0ZShmb3JtU3RhdGUsIHByb3BzLmZvcm1TdGF0ZSB8fCBfcHJveHlGb3JtU3RhdGUsIF9zZXRGb3JtU3RhdGUsIHByb3BzLnJlUmVuZGVyUm9vdCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzbmFwc2hvdCA9IHsgLi4uX2Zvcm1WYWx1ZXMgfTtcbiAgICAgICAgICAgICAgICBwcm9wcy5jYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlczogc25hcHNob3QsXG4gICAgICAgICAgICAgICAgICAgIC4uLl9mb3JtU3RhdGUsXG4gICAgICAgICAgICAgICAgICAgIC4uLmZvcm1TdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlczogX2RlZmF1bHRWYWx1ZXMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSkudW5zdWJzY3JpYmU7XG4gICAgY29uc3Qgc3Vic2NyaWJlID0gKHByb3BzKSA9PiB7XG4gICAgICAgIF9zdGF0ZS5tb3VudCA9IHRydWU7XG4gICAgICAgIF9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZSA9IHtcbiAgICAgICAgICAgIC4uLl9wcm94eVN1YnNjcmliZUZvcm1TdGF0ZSxcbiAgICAgICAgICAgIC4uLnByb3BzLmZvcm1TdGF0ZSxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9zdWJzY3JpYmUoe1xuICAgICAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgICAgICBmb3JtU3RhdGU6IHtcbiAgICAgICAgICAgICAgICAuLi5kZWZhdWx0UHJveHlGb3JtU3RhdGUsXG4gICAgICAgICAgICAgICAgLi4ucHJvcHMuZm9ybVN0YXRlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCB1bnJlZ2lzdGVyID0gKG5hbWUsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGZpZWxkTmFtZSBvZiBuYW1lID8gY29udmVydFRvQXJyYXlQYXlsb2FkKG5hbWUpIDogX25hbWVzLm1vdW50KSB7XG4gICAgICAgICAgICBfbmFtZXMubW91bnQuZGVsZXRlKGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBfbmFtZXMuYXJyYXkuZGVsZXRlKGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMua2VlcFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdW5zZXQoX2ZpZWxkcywgZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICB1bnNldChfZm9ybVZhbHVlcywgZmllbGROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICFvcHRpb25zLmtlZXBFcnJvciAmJiB1bnNldChfZm9ybVN0YXRlLmVycm9ycywgZmllbGROYW1lKTtcbiAgICAgICAgICAgICFvcHRpb25zLmtlZXBEaXJ0eSAmJiB1bnNldChfZm9ybVN0YXRlLmRpcnR5RmllbGRzLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgIW9wdGlvbnMua2VlcFRvdWNoZWQgJiYgdW5zZXQoX2Zvcm1TdGF0ZS50b3VjaGVkRmllbGRzLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgIW9wdGlvbnMua2VlcElzVmFsaWRhdGluZyAmJlxuICAgICAgICAgICAgICAgIHVuc2V0KF9mb3JtU3RhdGUudmFsaWRhdGluZ0ZpZWxkcywgZmllbGROYW1lKTtcbiAgICAgICAgICAgICFfb3B0aW9ucy5zaG91bGRVbnJlZ2lzdGVyICYmXG4gICAgICAgICAgICAgICAgIW9wdGlvbnMua2VlcERlZmF1bHRWYWx1ZSAmJlxuICAgICAgICAgICAgICAgIHVuc2V0KF9kZWZhdWx0VmFsdWVzLCBmaWVsZE5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIHZhbHVlczogY2xvbmVPYmplY3QoX2Zvcm1WYWx1ZXMpLFxuICAgICAgICB9KTtcbiAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgLi4uX2Zvcm1TdGF0ZSxcbiAgICAgICAgICAgIC4uLighb3B0aW9ucy5rZWVwRGlydHkgPyB7fSA6IHsgaXNEaXJ0eTogX2dldERpcnR5KCkgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAhb3B0aW9ucy5rZWVwSXNWYWxpZCAmJiBfc2V0VmFsaWQoKTtcbiAgICB9O1xuICAgIGNvbnN0IF9zZXREaXNhYmxlZEZpZWxkID0gKHsgZGlzYWJsZWQsIG5hbWUsIH0pID0+IHtcbiAgICAgICAgaWYgKChpc0Jvb2xlYW4oZGlzYWJsZWQpICYmIF9zdGF0ZS5tb3VudCkgfHxcbiAgICAgICAgICAgICEhZGlzYWJsZWQgfHxcbiAgICAgICAgICAgIF9uYW1lcy5kaXNhYmxlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhc0Rpc2FibGVkID0gX25hbWVzLmRpc2FibGVkLmhhcyhuYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGlzRGlzYWJsZWQgPSAhIWRpc2FibGVkO1xuICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRTdGF0ZUNoYW5nZWQgPSB3YXNEaXNhYmxlZCAhPT0gaXNEaXNhYmxlZDtcbiAgICAgICAgICAgIGRpc2FibGVkID8gX25hbWVzLmRpc2FibGVkLmFkZChuYW1lKSA6IF9uYW1lcy5kaXNhYmxlZC5kZWxldGUobmFtZSk7XG4gICAgICAgICAgICBkaXNhYmxlZFN0YXRlQ2hhbmdlZCAmJiBfc3RhdGUubW91bnQgJiYgIV9zdGF0ZS5hY3Rpb24gJiYgX3NldFZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IHJlZ2lzdGVyID0gKG5hbWUsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICBsZXQgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgIGNvbnN0IGRpc2FibGVkSXNEZWZpbmVkID0gaXNCb29sZWFuKG9wdGlvbnMuZGlzYWJsZWQpIHx8IGlzQm9vbGVhbihfb3B0aW9ucy5kaXNhYmxlZCk7XG4gICAgICAgIGNvbnN0IHNob3VsZFJldmFsaWRhdGVSZW1vdW50ID0gIV9uYW1lcy5yZWdpc3Rlck5hbWUuaGFzKG5hbWUpICYmIGZpZWxkICYmIGZpZWxkLl9mICYmICFmaWVsZC5fZi5tb3VudDtcbiAgICAgICAgc2V0KF9maWVsZHMsIG5hbWUsIHtcbiAgICAgICAgICAgIC4uLihmaWVsZCB8fCB7fSksXG4gICAgICAgICAgICBfZjoge1xuICAgICAgICAgICAgICAgIC4uLihmaWVsZCAmJiBmaWVsZC5fZiA/IGZpZWxkLl9mIDogeyByZWY6IHsgbmFtZSB9IH0pLFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgbW91bnQ6IHRydWUsXG4gICAgICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBfbmFtZXMubW91bnQuYWRkKG5hbWUpO1xuICAgICAgICBpZiAoZmllbGQgJiYgIXNob3VsZFJldmFsaWRhdGVSZW1vdW50KSB7XG4gICAgICAgICAgICBfc2V0RGlzYWJsZWRGaWVsZCh7XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGlzQm9vbGVhbihvcHRpb25zLmRpc2FibGVkKVxuICAgICAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZGlzYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgOiBfb3B0aW9ucy5kaXNhYmxlZCxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGVWYWxpZEFuZFZhbHVlKG5hbWUsIHRydWUsIG9wdGlvbnMudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi4oZGlzYWJsZWRJc0RlZmluZWRcbiAgICAgICAgICAgICAgICA/IHsgZGlzYWJsZWQ6IG9wdGlvbnMuZGlzYWJsZWQgfHwgX29wdGlvbnMuZGlzYWJsZWQgfVxuICAgICAgICAgICAgICAgIDoge30pLFxuICAgICAgICAgICAgLi4uKF9vcHRpb25zLnByb2dyZXNzaXZlXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiAhIW9wdGlvbnMucmVxdWlyZWQsXG4gICAgICAgICAgICAgICAgICAgIG1pbjogZ2V0UnVsZVZhbHVlKG9wdGlvbnMubWluKSxcbiAgICAgICAgICAgICAgICAgICAgbWF4OiBnZXRSdWxlVmFsdWUob3B0aW9ucy5tYXgpLFxuICAgICAgICAgICAgICAgICAgICBtaW5MZW5ndGg6IGdldFJ1bGVWYWx1ZShvcHRpb25zLm1pbkxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aDogZ2V0UnVsZVZhbHVlKG9wdGlvbnMubWF4TGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogZ2V0UnVsZVZhbHVlKG9wdGlvbnMucGF0dGVybiksXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDoge30pLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIG9uQ2hhbmdlLFxuICAgICAgICAgICAgb25CbHVyOiBvbkNoYW5nZSxcbiAgICAgICAgICAgIHJlZjogKHJlZikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgX25hbWVzLnJlZ2lzdGVyTmFtZS5hZGQobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyKG5hbWUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBfbmFtZXMucmVnaXN0ZXJOYW1lLmRlbGV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkUmVmID0gaXNVbmRlZmluZWQocmVmLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyByZWYucXVlcnlTZWxlY3RvckFsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcmVmLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0LHNlbGVjdCx0ZXh0YXJlYScpWzBdIHx8IHJlZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVmXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHJlZjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmFkaW9PckNoZWNrYm94ID0gaXNSYWRpb09yQ2hlY2tib3goZmllbGRSZWYpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZzID0gZmllbGQuX2YucmVmcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJhZGlvT3JDaGVja2JveFxuICAgICAgICAgICAgICAgICAgICAgICAgPyByZWZzLmZpbmQoKG9wdGlvbikgPT4gb3B0aW9uID09PSBmaWVsZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZmllbGRSZWYgPT09IGZpZWxkLl9mLnJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNldChfZmllbGRzLCBuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmZpZWxkLl9mLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLihyYWRpb09yQ2hlY2tib3hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ucmVmcy5maWx0ZXIobGl2ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRSZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uKEFycmF5LmlzQXJyYXkoZ2V0KF9kZWZhdWx0VmFsdWVzLCBuYW1lKSkgPyBbe31dIDogW10pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogeyB0eXBlOiBmaWVsZFJlZi50eXBlLCBuYW1lIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB7IHJlZjogZmllbGRSZWYgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlVmFsaWRBbmRWYWx1ZShuYW1lLCBmYWxzZSwgdW5kZWZpbmVkLCBmaWVsZFJlZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZCA9IGdldChfZmllbGRzLCBuYW1lLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC5fZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuX2YubW91bnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAoX29wdGlvbnMuc2hvdWxkVW5yZWdpc3RlciB8fCBvcHRpb25zLnNob3VsZFVucmVnaXN0ZXIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhKGlzTmFtZUluRmllbGRBcnJheShfbmFtZXMuYXJyYXksIG5hbWUpICYmIF9zdGF0ZS5hY3Rpb24pICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBfbmFtZXMudW5Nb3VudC5hZGQobmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IF9mb2N1c0Vycm9yID0gKCkgPT4gX29wdGlvbnMuc2hvdWxkRm9jdXNFcnJvciAmJlxuICAgICAgICAhX29wdGlvbnMuc2hvdWxkVXNlTmF0aXZlVmFsaWRhdGlvbiAmJlxuICAgICAgICBpdGVyYXRlRmllbGRzQnlBY3Rpb24oX2ZpZWxkcywgX2ZvY3VzSW5wdXQsIF9uYW1lcy5tb3VudCk7XG4gICAgY29uc3QgX2Rpc2FibGVGb3JtID0gKGRpc2FibGVkKSA9PiB7XG4gICAgICAgIGlmIChpc0Jvb2xlYW4oZGlzYWJsZWQpKSB7XG4gICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7IGRpc2FibGVkIH0pO1xuICAgICAgICAgICAgaXRlcmF0ZUZpZWxkc0J5QWN0aW9uKF9maWVsZHMsIChyZWYsIG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZCkge1xuICAgICAgICAgICAgICAgICAgICByZWYuZGlzYWJsZWQgPSBjdXJyZW50RmllbGQuX2YuZGlzYWJsZWQgfHwgZGlzYWJsZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnRGaWVsZC5fZi5yZWZzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEZpZWxkLl9mLnJlZnMuZm9yRWFjaCgoaW5wdXRSZWYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFJlZi5kaXNhYmxlZCA9IGN1cnJlbnRGaWVsZC5fZi5kaXNhYmxlZCB8fCBkaXNhYmxlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBoYW5kbGVTdWJtaXQgPSAob25WYWxpZCwgb25JbnZhbGlkKSA9PiBhc3luYyAoZSkgPT4ge1xuICAgICAgICBsZXQgb25WYWxpZEVycm9yID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCAmJiBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnBlcnNpc3QgJiZcbiAgICAgICAgICAgICAgICBlLnBlcnNpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZmllbGRWYWx1ZXMgPSBjbG9uZU9iamVjdChfZm9ybVZhbHVlcyk7XG4gICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIGlzU3VibWl0dGluZzogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChfb3B0aW9ucy5yZXNvbHZlcikge1xuICAgICAgICAgICAgY29uc3QgeyBlcnJvcnMsIHZhbHVlcyB9ID0gYXdhaXQgX3J1blNjaGVtYSgpO1xuICAgICAgICAgICAgX3VwZGF0ZUlzVmFsaWRhdGluZygpO1xuICAgICAgICAgICAgX2Zvcm1TdGF0ZS5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgICAgICBmaWVsZFZhbHVlcyA9IGNsb25lT2JqZWN0KHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBleGVjdXRlQnVpbHRJblZhbGlkYXRpb24oe1xuICAgICAgICAgICAgICAgIGZpZWxkczogX2ZpZWxkcyxcbiAgICAgICAgICAgICAgICBldmVudFR5cGU6IEVWRU5UUy5TVUJNSVQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoX25hbWVzLmRpc2FibGVkLnNpemUpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBfbmFtZXMuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICB1bnNldChmaWVsZFZhbHVlcywgbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdW5zZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIFJPT1RfRVJST1JfVFlQRSk7XG4gICAgICAgIGlmIChpc0VtcHR5T2JqZWN0KF9mb3JtU3RhdGUuZXJyb3JzKSkge1xuICAgICAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgIGVycm9yczoge30sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb25WYWxpZChmaWVsZFZhbHVlcywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBvblZhbGlkRXJyb3IgPSBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvbkludmFsaWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBvbkludmFsaWQoeyAuLi5fZm9ybVN0YXRlLmVycm9ycyB9LCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mb2N1c0Vycm9yKCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KF9mb2N1c0Vycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICBpc1N1Ym1pdHRlZDogdHJ1ZSxcbiAgICAgICAgICAgIGlzU3VibWl0dGluZzogZmFsc2UsXG4gICAgICAgICAgICBpc1N1Ym1pdFN1Y2Nlc3NmdWw6IGlzRW1wdHlPYmplY3QoX2Zvcm1TdGF0ZS5lcnJvcnMpICYmICFvblZhbGlkRXJyb3IsXG4gICAgICAgICAgICBzdWJtaXRDb3VudDogX2Zvcm1TdGF0ZS5zdWJtaXRDb3VudCArIDEsXG4gICAgICAgICAgICBlcnJvcnM6IF9mb3JtU3RhdGUuZXJyb3JzLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG9uVmFsaWRFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgb25WYWxpZEVycm9yO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCByZXNldEZpZWxkID0gKG5hbWUsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAoZ2V0KF9maWVsZHMsIG5hbWUpKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZmluZWQob3B0aW9ucy5kZWZhdWx0VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgc2V0VmFsdWUobmFtZSwgY2xvbmVPYmplY3QoZ2V0KF9kZWZhdWx0VmFsdWVzLCBuYW1lKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VmFsdWUobmFtZSwgb3B0aW9ucy5kZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgICAgIHNldChfZGVmYXVsdFZhbHVlcywgbmFtZSwgY2xvbmVPYmplY3Qob3B0aW9ucy5kZWZhdWx0VmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5rZWVwVG91Y2hlZCkge1xuICAgICAgICAgICAgICAgIHVuc2V0KF9mb3JtU3RhdGUudG91Y2hlZEZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMua2VlcERpcnR5KSB7XG4gICAgICAgICAgICAgICAgdW5zZXQoX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgX2Zvcm1TdGF0ZS5pc0RpcnR5ID0gb3B0aW9ucy5kZWZhdWx0VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgPyBfZ2V0RGlydHkobmFtZSwgY2xvbmVPYmplY3QoZ2V0KF9kZWZhdWx0VmFsdWVzLCBuYW1lKSkpXG4gICAgICAgICAgICAgICAgICAgIDogX2dldERpcnR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMua2VlcEVycm9yKSB7XG4gICAgICAgICAgICAgICAgdW5zZXQoX2Zvcm1TdGF0ZS5lcnJvcnMsIG5hbWUpO1xuICAgICAgICAgICAgICAgIF9wcm94eUZvcm1TdGF0ZS5pc1ZhbGlkICYmIF9zZXRWYWxpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3N1YmplY3RzLnN0YXRlLm5leHQoeyAuLi5fZm9ybVN0YXRlIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBfcmVzZXQgPSAoZm9ybVZhbHVlcywga2VlcFN0YXRlT3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRWYWx1ZXMgPSBmb3JtVmFsdWVzID8gY2xvbmVPYmplY3QoZm9ybVZhbHVlcykgOiBfZGVmYXVsdFZhbHVlcztcbiAgICAgICAgY29uc3QgY2xvbmVVcGRhdGVkVmFsdWVzID0gY2xvbmVPYmplY3QodXBkYXRlZFZhbHVlcyk7XG4gICAgICAgIGNvbnN0IGlzRW1wdHlSZXNldFZhbHVlcyA9IGlzRW1wdHlPYmplY3QoZm9ybVZhbHVlcyk7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGNsb25lVXBkYXRlZFZhbHVlcztcbiAgICAgICAgaWYgKCFrZWVwU3RhdGVPcHRpb25zLmtlZXBEZWZhdWx0VmFsdWVzKSB7XG4gICAgICAgICAgICBfZGVmYXVsdFZhbHVlcyA9IHVwZGF0ZWRWYWx1ZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFrZWVwU3RhdGVPcHRpb25zLmtlZXBWYWx1ZXMpIHtcbiAgICAgICAgICAgIGlmIChrZWVwU3RhdGVPcHRpb25zLmtlZXBEaXJ0eVZhbHVlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkc1RvQ2hlY2sgPSBuZXcgU2V0KFtcbiAgICAgICAgICAgICAgICAgICAgLi4uX25hbWVzLm1vdW50LFxuICAgICAgICAgICAgICAgICAgICAuLi5PYmplY3Qua2V5cyhnZXREaXJ0eUZpZWxkcyhfZGVmYXVsdFZhbHVlcywgX2Zvcm1WYWx1ZXMpKSxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkTmFtZSBvZiBBcnJheS5mcm9tKGZpZWxkc1RvQ2hlY2spKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRGlydHkgPSBnZXQoX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkcywgZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9IGdldChfZm9ybVZhbHVlcywgZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBnZXQodmFsdWVzLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNEaXJ0eSAmJiAhaXNVbmRlZmluZWQoZXhpc3RpbmdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldCh2YWx1ZXMsIGZpZWxkTmFtZSwgZXhpc3RpbmdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWlzRGlydHkgJiYgIWlzVW5kZWZpbmVkKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VmFsdWUoZmllbGROYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNXZWIgJiYgaXNVbmRlZmluZWQoZm9ybVZhbHVlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIF9uYW1lcy5tb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQgJiYgZmllbGQuX2YpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFJlZmVyZW5jZSA9IEFycmF5LmlzQXJyYXkoZmllbGQuX2YucmVmcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmaWVsZC5fZi5yZWZzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZmllbGQuX2YucmVmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0hUTUxFbGVtZW50KGZpZWxkUmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gZmllbGRSZWZlcmVuY2UuY2xvc2VzdCgnZm9ybScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXNldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGtlZXBTdGF0ZU9wdGlvbnMua2VlcEZpZWxkc1JlZikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkTmFtZSBvZiBfbmFtZXMubW91bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFZhbHVlKGZpZWxkTmFtZSwgZ2V0KHZhbHVlcywgZmllbGROYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF9maWVsZHMgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoX29wdGlvbnMuc2hvdWxkVW5yZWdpc3Rlcikge1xuICAgICAgICAgICAgICAgIF9mb3JtVmFsdWVzID0ga2VlcFN0YXRlT3B0aW9ucy5rZWVwRGVmYXVsdFZhbHVlc1xuICAgICAgICAgICAgICAgICAgICA/IGNsb25lT2JqZWN0KF9kZWZhdWx0VmFsdWVzKVxuICAgICAgICAgICAgICAgICAgICA6IHt9O1xuICAgICAgICAgICAgICAgIGlmIChrZWVwU3RhdGVPcHRpb25zLmtlZXBGaWVsZHNSZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWVsZE5hbWUgb2YgX25hbWVzLm1vdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQoX2Zvcm1WYWx1ZXMsIGZpZWxkTmFtZSwgZ2V0KHZhbHVlcywgZmllbGROYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfZm9ybVZhbHVlcyA9IGNsb25lT2JqZWN0KHZhbHVlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc3ViamVjdHMuYXJyYXkubmV4dCh7XG4gICAgICAgICAgICAgICAgdmFsdWVzOiB7IC4uLnZhbHVlcyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgdmFsdWVzOiB7IC4uLnZhbHVlcyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgX25hbWVzID0ge1xuICAgICAgICAgICAgbW91bnQ6IGtlZXBTdGF0ZU9wdGlvbnMua2VlcERpcnR5VmFsdWVzID8gX25hbWVzLm1vdW50IDogbmV3IFNldCgpLFxuICAgICAgICAgICAgdW5Nb3VudDogbmV3IFNldCgpLFxuICAgICAgICAgICAgYXJyYXk6IG5ldyBTZXQoKSxcbiAgICAgICAgICAgIHJlZ2lzdGVyTmFtZTogbmV3IFNldCgpLFxuICAgICAgICAgICAgZGlzYWJsZWQ6IG5ldyBTZXQoKSxcbiAgICAgICAgICAgIHdhdGNoOiBuZXcgU2V0KCksXG4gICAgICAgICAgICB3YXRjaEFsbDogZmFsc2UsXG4gICAgICAgICAgICBmb2N1czogJycsXG4gICAgICAgIH07XG4gICAgICAgIF9zdGF0ZS5tb3VudCA9XG4gICAgICAgICAgICAhX3Byb3h5Rm9ybVN0YXRlLmlzVmFsaWQgfHxcbiAgICAgICAgICAgICAgICAhIWtlZXBTdGF0ZU9wdGlvbnMua2VlcElzVmFsaWQgfHxcbiAgICAgICAgICAgICAgICAhIWtlZXBTdGF0ZU9wdGlvbnMua2VlcERpcnR5VmFsdWVzIHx8XG4gICAgICAgICAgICAgICAgKCFfb3B0aW9ucy5zaG91bGRVbnJlZ2lzdGVyICYmICFpc0VtcHR5T2JqZWN0KHZhbHVlcykpO1xuICAgICAgICBfc3RhdGUud2F0Y2ggPSAhIV9vcHRpb25zLnNob3VsZFVucmVnaXN0ZXI7XG4gICAgICAgIF9zdGF0ZS5rZWVwSXNWYWxpZCA9ICEha2VlcFN0YXRlT3B0aW9ucy5rZWVwSXNWYWxpZDtcbiAgICAgICAgX3N0YXRlLmFjdGlvbiA9IGZhbHNlO1xuICAgICAgICAvLyBDbGVhciBlcnJvcnMgc3luY2hyb25vdXNseSB0byBwcmV2ZW50IHZhbGlkYXRpb24gZXJyb3JzIG9uIHN1YnNlcXVlbnQgc3VibWlzc2lvbnNcbiAgICAgICAgLy8gVGhpcyBmaXhlcyB0aGUgaXNzdWUgd2hlcmUgZm9ybS5yZXNldCgpIGNhdXNlcyB2YWxpZGF0aW9uIGVycm9ycyBvbiBzdWJzZXF1ZW50XG4gICAgICAgIC8vIHN1Ym1pc3Npb25zIGluIE5leHQuanMgMTYgd2l0aCBTZXJ2ZXIgQWN0aW9uc1xuICAgICAgICBpZiAoIWtlZXBTdGF0ZU9wdGlvbnMua2VlcEVycm9ycykge1xuICAgICAgICAgICAgX2Zvcm1TdGF0ZS5lcnJvcnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBfc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICBzdWJtaXRDb3VudDoga2VlcFN0YXRlT3B0aW9ucy5rZWVwU3VibWl0Q291bnRcbiAgICAgICAgICAgICAgICA/IF9mb3JtU3RhdGUuc3VibWl0Q291bnRcbiAgICAgICAgICAgICAgICA6IDAsXG4gICAgICAgICAgICBpc0RpcnR5OiBpc0VtcHR5UmVzZXRWYWx1ZXNcbiAgICAgICAgICAgICAgICA/IGZhbHNlXG4gICAgICAgICAgICAgICAgOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBEaXJ0eVxuICAgICAgICAgICAgICAgICAgICA/IF9mb3JtU3RhdGUuaXNEaXJ0eVxuICAgICAgICAgICAgICAgICAgICA6IGtlZXBTdGF0ZU9wdGlvbnMua2VlcFZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBfZ2V0RGlydHkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiAhIShrZWVwU3RhdGVPcHRpb25zLmtlZXBEZWZhdWx0VmFsdWVzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIWRlZXBFcXVhbChmb3JtVmFsdWVzLCBfZGVmYXVsdFZhbHVlcykpLFxuICAgICAgICAgICAgaXNTdWJtaXR0ZWQ6IGtlZXBTdGF0ZU9wdGlvbnMua2VlcElzU3VibWl0dGVkXG4gICAgICAgICAgICAgICAgPyBfZm9ybVN0YXRlLmlzU3VibWl0dGVkXG4gICAgICAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGRpcnR5RmllbGRzOiBpc0VtcHR5UmVzZXRWYWx1ZXNcbiAgICAgICAgICAgICAgICA/IHt9XG4gICAgICAgICAgICAgICAgOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBEaXJ0eVZhbHVlc1xuICAgICAgICAgICAgICAgICAgICA/IGtlZXBTdGF0ZU9wdGlvbnMua2VlcERlZmF1bHRWYWx1ZXMgJiYgX2Zvcm1WYWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0RGlydHlGaWVsZHMoX2RlZmF1bHRWYWx1ZXMsIF9mb3JtVmFsdWVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBfZm9ybVN0YXRlLmRpcnR5RmllbGRzXG4gICAgICAgICAgICAgICAgICAgIDoga2VlcFN0YXRlT3B0aW9ucy5rZWVwRGVmYXVsdFZhbHVlcyAmJiBmb3JtVmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldERpcnR5RmllbGRzKF9kZWZhdWx0VmFsdWVzLCBmb3JtVmFsdWVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBEaXJ0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gX2Zvcm1TdGF0ZS5kaXJ0eUZpZWxkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDoge30sXG4gICAgICAgICAgICB0b3VjaGVkRmllbGRzOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBUb3VjaGVkXG4gICAgICAgICAgICAgICAgPyBfZm9ybVN0YXRlLnRvdWNoZWRGaWVsZHNcbiAgICAgICAgICAgICAgICA6IHt9LFxuICAgICAgICAgICAgZXJyb3JzOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBFcnJvcnMgPyBfZm9ybVN0YXRlLmVycm9ycyA6IHt9LFxuICAgICAgICAgICAgaXNTdWJtaXRTdWNjZXNzZnVsOiBrZWVwU3RhdGVPcHRpb25zLmtlZXBJc1N1Ym1pdFN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICA/IF9mb3JtU3RhdGUuaXNTdWJtaXRTdWNjZXNzZnVsXG4gICAgICAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3VibWl0dGluZzogZmFsc2UsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWVzOiBfZGVmYXVsdFZhbHVlcyxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCByZXNldCA9IChmb3JtVmFsdWVzLCBrZWVwU3RhdGVPcHRpb25zKSA9PiBfcmVzZXQoaXNGdW5jdGlvbihmb3JtVmFsdWVzKVxuICAgICAgICA/IGZvcm1WYWx1ZXMoX2Zvcm1WYWx1ZXMpXG4gICAgICAgIDogZm9ybVZhbHVlcywgeyAuLi5fb3B0aW9ucy5yZXNldE9wdGlvbnMsIC4uLmtlZXBTdGF0ZU9wdGlvbnMgfSk7XG4gICAgY29uc3Qgc2V0Rm9jdXMgPSAobmFtZSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KF9maWVsZHMsIG5hbWUpO1xuICAgICAgICBjb25zdCBmaWVsZFJlZmVyZW5jZSA9IGZpZWxkICYmIGZpZWxkLl9mO1xuICAgICAgICBpZiAoZmllbGRSZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkUmVmID0gZmllbGRSZWZlcmVuY2UucmVmc1xuICAgICAgICAgICAgICAgID8gZmllbGRSZWZlcmVuY2UucmVmc1swXVxuICAgICAgICAgICAgICAgIDogZmllbGRSZWZlcmVuY2UucmVmO1xuICAgICAgICAgICAgaWYgKGZpZWxkUmVmLmZvY3VzKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIHNldFRpbWVvdXQgdG8gZW5zdXJlIGZvY3VzIGhhcHBlbnMgYWZ0ZXIgYW55IHBlbmRpbmcgc3RhdGUgdXBkYXRlc1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgZml4ZXMgdGhlIGlzc3VlIHdoZXJlIHNldEZvY3VzIGRvZXNuJ3Qgd29yayBpbW1lZGlhdGVseSBhZnRlciBzZXRFcnJvclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFJlZi5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnNob3VsZFNlbGVjdCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaXNGdW5jdGlvbihmaWVsZFJlZi5zZWxlY3QpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFJlZi5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgX3NldEZvcm1TdGF0ZSA9ICh1cGRhdGVkRm9ybVN0YXRlKSA9PiB7XG4gICAgICAgIF9mb3JtU3RhdGUgPSB7XG4gICAgICAgICAgICAuLi5fZm9ybVN0YXRlLFxuICAgICAgICAgICAgLi4udXBkYXRlZEZvcm1TdGF0ZSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IF9yZXNldERlZmF1bHRWYWx1ZXMgPSAoKSA9PiBpc0Z1bmN0aW9uKF9vcHRpb25zLmRlZmF1bHRWYWx1ZXMpICYmXG4gICAgICAgIF9vcHRpb25zLmRlZmF1bHRWYWx1ZXMoKS50aGVuKCh2YWx1ZXMpID0+IHtcbiAgICAgICAgICAgIHJlc2V0KHZhbHVlcywgX29wdGlvbnMucmVzZXRPcHRpb25zKTtcbiAgICAgICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICBpc0xvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIGNvbnN0IHJlc2V0RGVmYXVsdFZhbHVlcyA9ICh2YWx1ZXMsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICBfZGVmYXVsdFZhbHVlcyA9IGNsb25lT2JqZWN0KHZhbHVlcyk7XG4gICAgICAgIGlmICghb3B0aW9ucy5rZWVwRGlydHkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld0RpcnR5RmllbGRzID0gZ2V0RGlydHlGaWVsZHMoX2RlZmF1bHRWYWx1ZXMsIF9mb3JtVmFsdWVzKTtcbiAgICAgICAgICAgIF9mb3JtU3RhdGUuZGlydHlGaWVsZHMgPSBuZXdEaXJ0eUZpZWxkcztcbiAgICAgICAgICAgIF9mb3JtU3RhdGUuaXNEaXJ0eSA9ICFpc0VtcHR5T2JqZWN0KG5ld0RpcnR5RmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMua2VlcElzVmFsaWQpIHtcbiAgICAgICAgICAgIF9zZXRWYWxpZCgpO1xuICAgICAgICB9XG4gICAgICAgIF9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIC4uLl9mb3JtU3RhdGUsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWVzOiBfZGVmYXVsdFZhbHVlcyxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBtZXRob2RzID0ge1xuICAgICAgICBjb250cm9sOiB7XG4gICAgICAgICAgICByZWdpc3RlcixcbiAgICAgICAgICAgIHVucmVnaXN0ZXIsXG4gICAgICAgICAgICBnZXRGaWVsZFN0YXRlLFxuICAgICAgICAgICAgaGFuZGxlU3VibWl0LFxuICAgICAgICAgICAgc2V0RXJyb3IsXG4gICAgICAgICAgICBfc3Vic2NyaWJlLFxuICAgICAgICAgICAgX3J1blNjaGVtYSxcbiAgICAgICAgICAgIF91cGRhdGVJc1ZhbGlkYXRpbmcsXG4gICAgICAgICAgICBfZm9jdXNFcnJvcixcbiAgICAgICAgICAgIF9nZXRXYXRjaCxcbiAgICAgICAgICAgIF9nZXREaXJ0eSxcbiAgICAgICAgICAgIF9zZXRWYWxpZCxcbiAgICAgICAgICAgIF9zZXRGaWVsZEFycmF5LFxuICAgICAgICAgICAgX3NldERpc2FibGVkRmllbGQsXG4gICAgICAgICAgICBfc2V0RXJyb3JzLFxuICAgICAgICAgICAgX2dldEZpZWxkQXJyYXksXG4gICAgICAgICAgICBfcmVzZXQsXG4gICAgICAgICAgICBfcmVzZXREZWZhdWx0VmFsdWVzLFxuICAgICAgICAgICAgX3JlbW92ZVVubW91bnRlZCxcbiAgICAgICAgICAgIF9kaXNhYmxlRm9ybSxcbiAgICAgICAgICAgIF9zdWJqZWN0cyxcbiAgICAgICAgICAgIF9wcm94eUZvcm1TdGF0ZSxcbiAgICAgICAgICAgIGdldCBfZmllbGRzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZmllbGRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldCBfZm9ybVZhbHVlcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Zvcm1WYWx1ZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IF9zdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0YXRlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCBfc3RhdGUodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBfc3RhdGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQgX2RlZmF1bHRWYWx1ZXMoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9kZWZhdWx0VmFsdWVzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldCBfbmFtZXMoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9uYW1lcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgX25hbWVzKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgX25hbWVzID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IF9mb3JtU3RhdGUoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9mb3JtU3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IF9vcHRpb25zKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfb3B0aW9ucztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgX29wdGlvbnModmFsdWUpIHtcbiAgICAgICAgICAgICAgICBfb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uX29wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIC4uLnZhbHVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBzdWJzY3JpYmUsXG4gICAgICAgIHRyaWdnZXIsXG4gICAgICAgIHJlZ2lzdGVyLFxuICAgICAgICBoYW5kbGVTdWJtaXQsXG4gICAgICAgIHdhdGNoLFxuICAgICAgICBzZXRWYWx1ZSxcbiAgICAgICAgc2V0VmFsdWVzLFxuICAgICAgICBnZXRWYWx1ZXMsXG4gICAgICAgIHJlc2V0LFxuICAgICAgICByZXNldEZpZWxkLFxuICAgICAgICByZXNldERlZmF1bHRWYWx1ZXMsXG4gICAgICAgIGNsZWFyRXJyb3JzLFxuICAgICAgICB1bnJlZ2lzdGVyLFxuICAgICAgICBzZXRFcnJvcixcbiAgICAgICAgc2V0Rm9jdXMsXG4gICAgICAgIGdldEZpZWxkU3RhdGUsXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5tZXRob2RzLFxuICAgICAgICBmb3JtQ29udHJvbDogbWV0aG9kcyxcbiAgICB9O1xufVxuXG52YXIgZ2VuZXJhdGVJZCA9ICgpID0+IHtcbiAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHtcbiAgICAgICAgcmV0dXJuIGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgfVxuICAgIGNvbnN0IGQgPSB0eXBlb2YgcGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnID8gRGF0ZS5ub3coKSA6IHBlcmZvcm1hbmNlLm5vdygpICogMTAwMDtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xuICAgICAgICBjb25zdCByID0gKChNYXRoLnJhbmRvbSgpICogMTYgKyBkKSAlIDE2KSB8IDA7XG4gICAgICAgIHJldHVybiAoYyA9PSAneCcgPyByIDogKHIgJiAweDMpIHwgMHg4KS50b1N0cmluZygxNik7XG4gICAgfSk7XG59O1xuXG52YXIgZ2V0Rm9jdXNGaWVsZE5hbWUgPSAobmFtZSwgaW5kZXgsIG9wdGlvbnMgPSB7fSkgPT4gb3B0aW9ucy5zaG91bGRGb2N1cyB8fCBpc1VuZGVmaW5lZChvcHRpb25zLnNob3VsZEZvY3VzKVxuICAgID8gb3B0aW9ucy5mb2N1c05hbWUgfHxcbiAgICAgICAgYCR7bmFtZX0uJHtpc1VuZGVmaW5lZChvcHRpb25zLmZvY3VzSW5kZXgpID8gaW5kZXggOiBvcHRpb25zLmZvY3VzSW5kZXh9LmBcbiAgICA6ICcnO1xuXG52YXIgYXBwZW5kQXQgPSAoZGF0YSwgdmFsdWUpID0+IFtcbiAgICAuLi5kYXRhLFxuICAgIC4uLmNvbnZlcnRUb0FycmF5UGF5bG9hZCh2YWx1ZSksXG5dO1xuXG52YXIgZmlsbEVtcHR5QXJyYXkgPSAodmFsdWUpID0+IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUubWFwKCgpID0+IHVuZGVmaW5lZCkgOiB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGluc2VydChkYXRhLCBpbmRleCwgdmFsdWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAuLi5kYXRhLnNsaWNlKDAsIGluZGV4KSxcbiAgICAgICAgLi4uY29udmVydFRvQXJyYXlQYXlsb2FkKHZhbHVlKSxcbiAgICAgICAgLi4uZGF0YS5zbGljZShpbmRleCksXG4gICAgXTtcbn1cblxudmFyIG1vdmVBcnJheUF0ID0gKGRhdGEsIGZyb20sIHRvKSA9PiB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKGlzVW5kZWZpbmVkKGRhdGFbdG9dKSkge1xuICAgICAgICBkYXRhW3RvXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZGF0YS5zcGxpY2UodG8sIDAsIGRhdGEuc3BsaWNlKGZyb20sIDEpWzBdKTtcbiAgICByZXR1cm4gZGF0YTtcbn07XG5cbnZhciBwcmVwZW5kQXQgPSAoZGF0YSwgdmFsdWUpID0+IFtcbiAgICAuLi5jb252ZXJ0VG9BcnJheVBheWxvYWQodmFsdWUpLFxuICAgIC4uLmNvbnZlcnRUb0FycmF5UGF5bG9hZChkYXRhKSxcbl07XG5cbmZ1bmN0aW9uIHJlbW92ZUF0SW5kZXhlcyhkYXRhLCBpbmRleGVzKSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IHRlbXAgPSBbLi4uZGF0YV07XG4gICAgZm9yIChjb25zdCBpbmRleCBvZiBpbmRleGVzKSB7XG4gICAgICAgIHRlbXAuc3BsaWNlKGluZGV4IC0gaSwgMSk7XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBhY3QodGVtcCkubGVuZ3RoID8gdGVtcCA6IFtdO1xufVxudmFyIHJlbW92ZUFycmF5QXQgPSAoZGF0YSwgaW5kZXgpID0+IGlzVW5kZWZpbmVkKGluZGV4KVxuICAgID8gW11cbiAgICA6IHJlbW92ZUF0SW5kZXhlcyhkYXRhLCBjb252ZXJ0VG9BcnJheVBheWxvYWQoaW5kZXgpLnNvcnQoKGEsIGIpID0+IGEgLSBiKSk7XG5cbnZhciBzd2FwQXJyYXlBdCA9IChkYXRhLCBpbmRleEEsIGluZGV4QikgPT4ge1xuICAgIFtkYXRhW2luZGV4QV0sIGRhdGFbaW5kZXhCXV0gPSBbZGF0YVtpbmRleEJdLCBkYXRhW2luZGV4QV1dO1xufTtcblxudmFyIHVwZGF0ZUF0ID0gKGZpZWxkVmFsdWVzLCBpbmRleCwgdmFsdWUpID0+IHtcbiAgICBmaWVsZFZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gZmllbGRWYWx1ZXM7XG59O1xuXG4vKipcbiAqIEEgY3VzdG9tIGhvb2sgdGhhdCBleHBvc2VzIGNvbnZlbmllbnQgbWV0aG9kcyB0byBwZXJmb3JtIG9wZXJhdGlvbnMgd2l0aCBhIGxpc3Qgb2YgZHluYW1pYyBpbnB1dHMgdGhhdCBuZWVkIHRvIGJlIGFwcGVuZGVkLCB1cGRhdGVkLCByZW1vdmVkIGV0Yy4g4oCiIFtEZW1vXShodHRwczovL2NvZGVzYW5kYm94LmlvL3MvcmVhY3QtaG9vay1mb3JtLXVzZWZpZWxkYXJyYXktc3N1Z24pIOKAoiBbVmlkZW9dKGh0dHBzOi8veW91dHUuYmUvNE1yYmZHU0ZZMkEpXG4gKlxuICogQHJlbWFya3NcbiAqIFtBUEldKGh0dHBzOi8vcmVhY3QtaG9vay1mb3JtLmNvbS9kb2NzL3VzZWZpZWxkYXJyYXkpIOKAoiBbRGVtb10oaHR0cHM6Ly9jb2Rlc2FuZGJveC5pby9zL3JlYWN0LWhvb2stZm9ybS11c2VmaWVsZGFycmF5LXNzdWduKVxuICpcbiAqIEBwYXJhbSBwcm9wcyAtIHVzZUZpZWxkQXJyYXkgcHJvcHNcbiAqXG4gKiBAcmV0dXJucyBtZXRob2RzIC0gZnVuY3Rpb25zIHRvIG1hbmlwdWxhdGUgd2l0aCB0aGUgRmllbGQgQXJyYXlzIChkeW5hbWljIGlucHV0cykge0BsaW5rIFVzZUZpZWxkQXJyYXlSZXR1cm59XG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogZnVuY3Rpb24gQXBwKCkge1xuICogICBjb25zdCB7IHJlZ2lzdGVyLCBjb250cm9sLCBoYW5kbGVTdWJtaXQsIHJlc2V0LCB0cmlnZ2VyLCBzZXRFcnJvciB9ID0gdXNlRm9ybSh7XG4gKiAgICAgZGVmYXVsdFZhbHVlczoge1xuICogICAgICAgdGVzdDogW11cbiAqICAgICB9XG4gKiAgIH0pO1xuICogICBjb25zdCB7IGZpZWxkcywgYXBwZW5kIH0gPSB1c2VGaWVsZEFycmF5KHtcbiAqICAgICBjb250cm9sLFxuICogICAgIG5hbWU6IFwidGVzdFwiXG4gKiAgIH0pO1xuICpcbiAqICAgcmV0dXJuIChcbiAqICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0KGRhdGEgPT4gY29uc29sZS5sb2coZGF0YSkpfT5cbiAqICAgICAgIHtmaWVsZHMubWFwKChpdGVtLCBpbmRleCkgPT4gKFxuICogICAgICAgICAgPGlucHV0IGtleT17aXRlbS5pZH0gey4uLnJlZ2lzdGVyKGB0ZXN0LiR7aW5kZXh9LmZpcnN0TmFtZWApfSAgLz5cbiAqICAgICAgICkpfVxuICogICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gYXBwZW5kKHsgZmlyc3ROYW1lOiBcImJpbGxcIiB9KX0+XG4gKiAgICAgICAgIGFwcGVuZFxuICogICAgICAgPC9idXR0b24+XG4gKiAgICAgICA8aW5wdXQgdHlwZT1cInN1Ym1pdFwiIC8+XG4gKiAgICAgPC9mb3JtPlxuICogICApO1xuICogfVxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIHVzZUZpZWxkQXJyYXkocHJvcHMpIHtcbiAgICBjb25zdCBmb3JtQ29udHJvbCA9IHVzZUZvcm1Db250cm9sQ29udGV4dCgpO1xuICAgIGNvbnN0IHsgY29udHJvbCA9IGZvcm1Db250cm9sLCBuYW1lLCBrZXlOYW1lID0gJ2lkJywgc2hvdWxkVW5yZWdpc3RlciwgcnVsZXMsIH0gPSBwcm9wcztcbiAgICBjb25zdCBbZmllbGRzLCBzZXRGaWVsZHNdID0gUmVhY3QudXNlU3RhdGUoY29udHJvbC5fZ2V0RmllbGRBcnJheShuYW1lKSk7XG4gICAgY29uc3QgaWRzID0gUmVhY3QudXNlUmVmKGNvbnRyb2wuX2dldEZpZWxkQXJyYXkobmFtZSkubWFwKGdlbmVyYXRlSWQpKTtcbiAgICBjb25zdCBfYWN0aW9uZWQgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICAgIGNvbnRyb2wuX25hbWVzLmFycmF5LmFkZChuYW1lKTtcbiAgICBSZWFjdC51c2VNZW1vKCgpID0+IHJ1bGVzICYmXG4gICAgICAgIGZpZWxkcy5sZW5ndGggPj0gMCAmJlxuICAgICAgICBjb250cm9sLnJlZ2lzdGVyKG5hbWUsIHJ1bGVzKSwgW2NvbnRyb2wsIG5hbWUsIGZpZWxkcy5sZW5ndGgsIHJ1bGVzXSk7XG4gICAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiBjb250cm9sLl9zdWJqZWN0cy5hcnJheS5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAoeyB2YWx1ZXMsIG5hbWU6IGZpZWxkQXJyYXlOYW1lLCB9KSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGRBcnJheU5hbWUgPT09IG5hbWUgfHwgIWZpZWxkQXJyYXlOYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZXMgPSBnZXQodmFsdWVzLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWVsZFZhbHVlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0RmllbGRzKGZpZWxkVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgaWRzLmN1cnJlbnQgPSBmaWVsZFZhbHVlcy5tYXAoZ2VuZXJhdGVJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFmaWVsZEFycmF5TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRGaWVsZHMoW10pO1xuICAgICAgICAgICAgICAgICAgICBpZHMuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9KS51bnN1YnNjcmliZSwgW2NvbnRyb2wsIG5hbWVdKTtcbiAgICBjb25zdCB1cGRhdGVWYWx1ZXMgPSBSZWFjdC51c2VDYWxsYmFjaygodXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMpID0+IHtcbiAgICAgICAgX2FjdGlvbmVkLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBjb250cm9sLl9zZXRGaWVsZEFycmF5KG5hbWUsIHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICB9LCBbY29udHJvbCwgbmFtZV0pO1xuICAgIGNvbnN0IGFwcGVuZCA9ICh2YWx1ZSwgb3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCBhcHBlbmRWYWx1ZSA9IGNvbnZlcnRUb0FycmF5UGF5bG9hZChjbG9uZU9iamVjdCh2YWx1ZSkpO1xuICAgICAgICBjb25zdCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcyA9IGFwcGVuZEF0KGNvbnRyb2wuX2dldEZpZWxkQXJyYXkobmFtZSksIGFwcGVuZFZhbHVlKTtcbiAgICAgICAgY29udHJvbC5fbmFtZXMuZm9jdXMgPSBnZXRGb2N1c0ZpZWxkTmFtZShuYW1lLCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcy5sZW5ndGggLSAxLCBvcHRpb25zKTtcbiAgICAgICAgaWRzLmN1cnJlbnQgPSBhcHBlbmRBdChpZHMuY3VycmVudCwgYXBwZW5kVmFsdWUubWFwKGdlbmVyYXRlSWQpKTtcbiAgICAgICAgdXBkYXRlVmFsdWVzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgc2V0RmllbGRzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgY29udHJvbC5fc2V0RmllbGRBcnJheShuYW1lLCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcywgYXBwZW5kQXQsIHtcbiAgICAgICAgICAgIGFyZ0E6IGZpbGxFbXB0eUFycmF5KHZhbHVlKSxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBwcmVwZW5kID0gKHZhbHVlLCBvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHByZXBlbmRWYWx1ZSA9IGNvbnZlcnRUb0FycmF5UGF5bG9hZChjbG9uZU9iamVjdCh2YWx1ZSkpO1xuICAgICAgICBjb25zdCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcyA9IHByZXBlbmRBdChjb250cm9sLl9nZXRGaWVsZEFycmF5KG5hbWUpLCBwcmVwZW5kVmFsdWUpO1xuICAgICAgICBjb250cm9sLl9uYW1lcy5mb2N1cyA9IGdldEZvY3VzRmllbGROYW1lKG5hbWUsIDAsIG9wdGlvbnMpO1xuICAgICAgICBpZHMuY3VycmVudCA9IHByZXBlbmRBdChpZHMuY3VycmVudCwgcHJlcGVuZFZhbHVlLm1hcChnZW5lcmF0ZUlkKSk7XG4gICAgICAgIHVwZGF0ZVZhbHVlcyh1cGRhdGVkRmllbGRBcnJheVZhbHVlcyk7XG4gICAgICAgIHNldEZpZWxkcyh1cGRhdGVkRmllbGRBcnJheVZhbHVlcyk7XG4gICAgICAgIGNvbnRyb2wuX3NldEZpZWxkQXJyYXkobmFtZSwgdXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMsIHByZXBlbmRBdCwge1xuICAgICAgICAgICAgYXJnQTogZmlsbEVtcHR5QXJyYXkodmFsdWUpLFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IHJlbW92ZSA9IChpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcyA9IHJlbW92ZUFycmF5QXQoY29udHJvbC5fZ2V0RmllbGRBcnJheShuYW1lKSwgaW5kZXgpO1xuICAgICAgICBpZHMuY3VycmVudCA9IHJlbW92ZUFycmF5QXQoaWRzLmN1cnJlbnQsIGluZGV4KTtcbiAgICAgICAgdXBkYXRlVmFsdWVzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgc2V0RmllbGRzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgIUFycmF5LmlzQXJyYXkoZ2V0KGNvbnRyb2wuX2ZpZWxkcywgbmFtZSkpICYmXG4gICAgICAgICAgICBzZXQoY29udHJvbC5fZmllbGRzLCBuYW1lLCB1bmRlZmluZWQpO1xuICAgICAgICBjb250cm9sLl9zZXRGaWVsZEFycmF5KG5hbWUsIHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzLCByZW1vdmVBcnJheUF0LCB7XG4gICAgICAgICAgICBhcmdBOiBpbmRleCxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBpbnNlcnQkMSA9IChpbmRleCwgdmFsdWUsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgaW5zZXJ0VmFsdWUgPSBjb252ZXJ0VG9BcnJheVBheWxvYWQoY2xvbmVPYmplY3QodmFsdWUpKTtcbiAgICAgICAgY29uc3QgdXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMgPSBpbnNlcnQoY29udHJvbC5fZ2V0RmllbGRBcnJheShuYW1lKSwgaW5kZXgsIGluc2VydFZhbHVlKTtcbiAgICAgICAgY29udHJvbC5fbmFtZXMuZm9jdXMgPSBnZXRGb2N1c0ZpZWxkTmFtZShuYW1lLCBpbmRleCwgb3B0aW9ucyk7XG4gICAgICAgIGlkcy5jdXJyZW50ID0gaW5zZXJ0KGlkcy5jdXJyZW50LCBpbmRleCwgaW5zZXJ0VmFsdWUubWFwKGdlbmVyYXRlSWQpKTtcbiAgICAgICAgdXBkYXRlVmFsdWVzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgc2V0RmllbGRzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgY29udHJvbC5fc2V0RmllbGRBcnJheShuYW1lLCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcywgaW5zZXJ0LCB7XG4gICAgICAgICAgICBhcmdBOiBpbmRleCxcbiAgICAgICAgICAgIGFyZ0I6IGZpbGxFbXB0eUFycmF5KHZhbHVlKSxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBzd2FwID0gKGluZGV4QSwgaW5kZXhCKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzID0gY29udHJvbC5fZ2V0RmllbGRBcnJheShuYW1lKTtcbiAgICAgICAgc3dhcEFycmF5QXQodXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMsIGluZGV4QSwgaW5kZXhCKTtcbiAgICAgICAgc3dhcEFycmF5QXQoaWRzLmN1cnJlbnQsIGluZGV4QSwgaW5kZXhCKTtcbiAgICAgICAgdXBkYXRlVmFsdWVzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgc2V0RmllbGRzKHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzKTtcbiAgICAgICAgY29udHJvbC5fc2V0RmllbGRBcnJheShuYW1lLCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcywgc3dhcEFycmF5QXQsIHtcbiAgICAgICAgICAgIGFyZ0E6IGluZGV4QSxcbiAgICAgICAgICAgIGFyZ0I6IGluZGV4QixcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgIH07XG4gICAgY29uc3QgbW92ZSA9IChmcm9tLCB0bykgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcyA9IGNvbnRyb2wuX2dldEZpZWxkQXJyYXkobmFtZSk7XG4gICAgICAgIG1vdmVBcnJheUF0KHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzLCBmcm9tLCB0byk7XG4gICAgICAgIG1vdmVBcnJheUF0KGlkcy5jdXJyZW50LCBmcm9tLCB0byk7XG4gICAgICAgIHVwZGF0ZVZhbHVlcyh1cGRhdGVkRmllbGRBcnJheVZhbHVlcyk7XG4gICAgICAgIHNldEZpZWxkcyh1cGRhdGVkRmllbGRBcnJheVZhbHVlcyk7XG4gICAgICAgIGNvbnRyb2wuX3NldEZpZWxkQXJyYXkobmFtZSwgdXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMsIG1vdmVBcnJheUF0LCB7XG4gICAgICAgICAgICBhcmdBOiBmcm9tLFxuICAgICAgICAgICAgYXJnQjogdG8sXG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9O1xuICAgIGNvbnN0IHVwZGF0ZSA9IChpbmRleCwgdmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlVmFsdWUgPSBjbG9uZU9iamVjdCh2YWx1ZSk7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRGaWVsZEFycmF5VmFsdWVzID0gdXBkYXRlQXQoY29udHJvbC5fZ2V0RmllbGRBcnJheShuYW1lKSwgaW5kZXgsIHVwZGF0ZVZhbHVlKTtcbiAgICAgICAgaWRzLmN1cnJlbnQgPSBbLi4udXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXNdLm1hcCgoaXRlbSwgaSkgPT4gIWl0ZW0gfHwgaSA9PT0gaW5kZXggPyBnZW5lcmF0ZUlkKCkgOiBpZHMuY3VycmVudFtpXSk7XG4gICAgICAgIHVwZGF0ZVZhbHVlcyh1cGRhdGVkRmllbGRBcnJheVZhbHVlcyk7XG4gICAgICAgIHNldEZpZWxkcyhbLi4udXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXNdKTtcbiAgICAgICAgY29udHJvbC5fc2V0RmllbGRBcnJheShuYW1lLCB1cGRhdGVkRmllbGRBcnJheVZhbHVlcywgdXBkYXRlQXQsIHtcbiAgICAgICAgICAgIGFyZ0E6IGluZGV4LFxuICAgICAgICAgICAgYXJnQjogdXBkYXRlVmFsdWUsXG4gICAgICAgIH0sIHRydWUsIGZhbHNlKTtcbiAgICB9O1xuICAgIGNvbnN0IHJlcGxhY2UgPSAodmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXMgPSBjb252ZXJ0VG9BcnJheVBheWxvYWQoY2xvbmVPYmplY3QodmFsdWUpKTtcbiAgICAgICAgaWRzLmN1cnJlbnQgPSB1cGRhdGVkRmllbGRBcnJheVZhbHVlcy5tYXAoZ2VuZXJhdGVJZCk7XG4gICAgICAgIHVwZGF0ZVZhbHVlcyhbLi4udXBkYXRlZEZpZWxkQXJyYXlWYWx1ZXNdKTtcbiAgICAgICAgc2V0RmllbGRzKFsuLi51cGRhdGVkRmllbGRBcnJheVZhbHVlc10pO1xuICAgICAgICBjb250cm9sLl9zZXRGaWVsZEFycmF5KG5hbWUsIFsuLi51cGRhdGVkRmllbGRBcnJheVZhbHVlc10sIChkYXRhKSA9PiBkYXRhLCB7fSwgdHJ1ZSwgZmFsc2UpO1xuICAgIH07XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29udHJvbC5fc3RhdGUuYWN0aW9uID0gZmFsc2U7XG4gICAgICAgIGlzV2F0Y2hlZChuYW1lLCBjb250cm9sLl9uYW1lcykgJiZcbiAgICAgICAgICAgIGNvbnRyb2wuX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgIC4uLmNvbnRyb2wuX2Zvcm1TdGF0ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBjb25zdCB2YWxpZGF0aW9uTW9kZXMgPSBnZXRWYWxpZGF0aW9uTW9kZXMoY29udHJvbC5fb3B0aW9ucy5tb2RlKTtcbiAgICAgICAgaWYgKF9hY3Rpb25lZC5jdXJyZW50ICYmXG4gICAgICAgICAgICAoIXZhbGlkYXRpb25Nb2Rlcy5pc09uU3VibWl0IHx8IGNvbnRyb2wuX2Zvcm1TdGF0ZS5pc1N1Ym1pdHRlZCkgJiZcbiAgICAgICAgICAgICFnZXRWYWxpZGF0aW9uTW9kZXMoY29udHJvbC5fb3B0aW9ucy5yZVZhbGlkYXRlTW9kZSkuaXNPblN1Ym1pdCAmJlxuICAgICAgICAgICAgIXZhbGlkYXRpb25Nb2Rlcy5pc09uQmx1cikge1xuICAgICAgICAgICAgaWYgKGNvbnRyb2wuX29wdGlvbnMucmVzb2x2ZXIpIHtcbiAgICAgICAgICAgICAgICBjb250cm9sLl9ydW5TY2hlbWEoW25hbWVdKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbC5fdXBkYXRlSXNWYWxpZGF0aW5nKFtuYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZ2V0KHJlc3VsdC5lcnJvcnMsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ0Vycm9yID0gZ2V0KGNvbnRyb2wuX2Zvcm1TdGF0ZS5lcnJvcnMsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgPyAoIWVycm9yICYmIGV4aXN0aW5nRXJyb3IudHlwZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV4aXN0aW5nRXJyb3IudHlwZSAhPT0gZXJyb3IudHlwZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdFcnJvci5tZXNzYWdlICE9PSBlcnJvci5tZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZXJyb3IgJiYgZXJyb3IudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHNldChjb250cm9sLl9mb3JtU3RhdGUuZXJyb3JzLCBuYW1lLCBlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuc2V0KGNvbnRyb2wuX2Zvcm1TdGF0ZS5lcnJvcnMsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbC5fc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzOiBjb250cm9sLl9mb3JtU3RhdGUuZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZ2V0KGNvbnRyb2wuX2ZpZWxkcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkICYmXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLl9mICYmXG4gICAgICAgICAgICAgICAgICAgICEoZ2V0VmFsaWRhdGlvbk1vZGVzKGNvbnRyb2wuX29wdGlvbnMucmVWYWxpZGF0ZU1vZGUpLmlzT25TdWJtaXQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFZhbGlkYXRpb25Nb2Rlcyhjb250cm9sLl9vcHRpb25zLm1vZGUpLmlzT25TdWJtaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRlRmllbGQoZmllbGQsIGNvbnRyb2wuX25hbWVzLmRpc2FibGVkLCBjb250cm9sLl9mb3JtVmFsdWVzLCBjb250cm9sLl9vcHRpb25zLmNyaXRlcmlhTW9kZSA9PT0gVkFMSURBVElPTl9NT0RFLmFsbCwgY29udHJvbC5fb3B0aW9ucy5zaG91bGRVc2VOYXRpdmVWYWxpZGF0aW9uLCB0cnVlKS50aGVuKChlcnJvcikgPT4gIWlzRW1wdHlPYmplY3QoZXJyb3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sLl9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnM6IHVwZGF0ZUZpZWxkQXJyYXlSb290RXJyb3IoY29udHJvbC5fZm9ybVN0YXRlLmVycm9ycywgZXJyb3IsIG5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250cm9sLl9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICB2YWx1ZXM6IGNsb25lT2JqZWN0KGNvbnRyb2wuX2Zvcm1WYWx1ZXMpLFxuICAgICAgICB9KTtcbiAgICAgICAgY29udHJvbC5fbmFtZXMuZm9jdXMgJiZcbiAgICAgICAgICAgIGl0ZXJhdGVGaWVsZHNCeUFjdGlvbihjb250cm9sLl9maWVsZHMsIChyZWYsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sLl9uYW1lcy5mb2N1cyAmJlxuICAgICAgICAgICAgICAgICAgICBrZXkuc3RhcnRzV2l0aChjb250cm9sLl9uYW1lcy5mb2N1cykgJiZcbiAgICAgICAgICAgICAgICAgICAgcmVmLmZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZi5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGNvbnRyb2wuX25hbWVzLmZvY3VzID0gJyc7XG4gICAgICAgIGNvbnRyb2wuX3NldFZhbGlkKCk7XG4gICAgICAgIF9hY3Rpb25lZC5jdXJyZW50ID0gZmFsc2U7XG4gICAgfSwgW2ZpZWxkcywgbmFtZSwgY29udHJvbF0pO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgICFnZXQoY29udHJvbC5fZm9ybVZhbHVlcywgbmFtZSkgJiYgY29udHJvbC5fc2V0RmllbGRBcnJheShuYW1lKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZEtlZXBGaWVsZEFycmF5VmFsdWVzID0gIShjb250cm9sLl9vcHRpb25zLnNob3VsZFVucmVnaXN0ZXIgfHwgc2hvdWxkVW5yZWdpc3Rlcik7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVNb3VudGVkID0gKG5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBnZXQoY29udHJvbC5fZmllbGRzLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQgJiYgZmllbGQuX2YpIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQuX2YubW91bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKF9hY3Rpb25lZC5jdXJyZW50ICYmIHNob3VsZEtlZXBGaWVsZEFycmF5VmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgY29udHJvbC5fc3ViamVjdHMuc3RhdGUubmV4dCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlczogY2xvbmVPYmplY3QoY29udHJvbC5fZm9ybVZhbHVlcyksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG91bGRLZWVwRmllbGRBcnJheVZhbHVlc1xuICAgICAgICAgICAgICAgID8gdXBkYXRlTW91bnRlZChuYW1lLCBmYWxzZSlcbiAgICAgICAgICAgICAgICA6IGNvbnRyb2wudW5yZWdpc3RlcihuYW1lKTtcbiAgICAgICAgfTtcbiAgICB9LCBbbmFtZSwgY29udHJvbCwga2V5TmFtZSwgc2hvdWxkVW5yZWdpc3Rlcl0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN3YXA6IFJlYWN0LnVzZUNhbGxiYWNrKHN3YXAsIFt1cGRhdGVWYWx1ZXMsIG5hbWUsIGNvbnRyb2xdKSxcbiAgICAgICAgbW92ZTogUmVhY3QudXNlQ2FsbGJhY2sobW92ZSwgW3VwZGF0ZVZhbHVlcywgbmFtZSwgY29udHJvbF0pLFxuICAgICAgICBwcmVwZW5kOiBSZWFjdC51c2VDYWxsYmFjayhwcmVwZW5kLCBbdXBkYXRlVmFsdWVzLCBuYW1lLCBjb250cm9sXSksXG4gICAgICAgIGFwcGVuZDogUmVhY3QudXNlQ2FsbGJhY2soYXBwZW5kLCBbdXBkYXRlVmFsdWVzLCBuYW1lLCBjb250cm9sXSksXG4gICAgICAgIHJlbW92ZTogUmVhY3QudXNlQ2FsbGJhY2socmVtb3ZlLCBbdXBkYXRlVmFsdWVzLCBuYW1lLCBjb250cm9sXSksXG4gICAgICAgIGluc2VydDogUmVhY3QudXNlQ2FsbGJhY2soaW5zZXJ0JDEsIFt1cGRhdGVWYWx1ZXMsIG5hbWUsIGNvbnRyb2xdKSxcbiAgICAgICAgdXBkYXRlOiBSZWFjdC51c2VDYWxsYmFjayh1cGRhdGUsIFt1cGRhdGVWYWx1ZXMsIG5hbWUsIGNvbnRyb2xdKSxcbiAgICAgICAgcmVwbGFjZTogUmVhY3QudXNlQ2FsbGJhY2socmVwbGFjZSwgW3VwZGF0ZVZhbHVlcywgbmFtZSwgY29udHJvbF0pLFxuICAgICAgICBmaWVsZHM6IFJlYWN0LnVzZU1lbW8oKCkgPT4gZmllbGRzLm1hcCgoZmllbGQsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgLi4uZmllbGQsXG4gICAgICAgICAgICBba2V5TmFtZV06IGlkcy5jdXJyZW50W2luZGV4XSB8fCBnZW5lcmF0ZUlkKCksXG4gICAgICAgIH0pKSwgW2ZpZWxkcywga2V5TmFtZV0pLFxuICAgIH07XG59XG5cbi8qKlxuICogQ3VzdG9tIGhvb2sgdG8gbWFuYWdlIHRoZSBlbnRpcmUgZm9ybS5cbiAqXG4gKiBAcmVtYXJrc1xuICogW0FQSV0oaHR0cHM6Ly9yZWFjdC1ob29rLWZvcm0uY29tL2RvY3MvdXNlZm9ybSkg4oCiIFtEZW1vXShodHRwczovL2NvZGVzYW5kYm94LmlvL3MvcmVhY3QtaG9vay1mb3JtLWdldC1zdGFydGVkLXRzLTVrc21tKSDigKIgW1ZpZGVvXShodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PVJrWHY0QVhYQ180KVxuICpcbiAqIEBwYXJhbSBwcm9wcyAtIGZvcm0gY29uZmlndXJhdGlvbiBhbmQgdmFsaWRhdGlvbiBwYXJhbWV0ZXJzLlxuICpcbiAqIEByZXR1cm5zIG1ldGhvZHMgLSBpbmRpdmlkdWFsIGZ1bmN0aW9ucyB0byBtYW5hZ2UgdGhlIGZvcm0gc3RhdGUuIHtAbGluayBVc2VGb3JtUmV0dXJufVxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c3hcbiAqIGZ1bmN0aW9uIEFwcCgpIHtcbiAqICAgY29uc3QgeyByZWdpc3RlciwgaGFuZGxlU3VibWl0LCB3YXRjaCwgZm9ybVN0YXRlOiB7IGVycm9ycyB9IH0gPSB1c2VGb3JtKCk7XG4gKiAgIGNvbnN0IG9uU3VibWl0ID0gZGF0YSA9PiBjb25zb2xlLmxvZyhkYXRhKTtcbiAqXG4gKiAgIGNvbnNvbGUubG9nKHdhdGNoKFwiZXhhbXBsZVwiKSk7XG4gKlxuICogICByZXR1cm4gKFxuICogICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXQob25TdWJtaXQpfT5cbiAqICAgICAgIDxpbnB1dCBkZWZhdWx0VmFsdWU9XCJ0ZXN0XCIgey4uLnJlZ2lzdGVyKFwiZXhhbXBsZVwiKX0gLz5cbiAqICAgICAgIDxpbnB1dCB7Li4ucmVnaXN0ZXIoXCJleGFtcGxlUmVxdWlyZWRcIiwgeyByZXF1aXJlZDogdHJ1ZSB9KX0gLz5cbiAqICAgICAgIHtlcnJvcnMuZXhhbXBsZVJlcXVpcmVkICYmIDxzcGFuPlRoaXMgZmllbGQgaXMgcmVxdWlyZWQ8L3NwYW4+fVxuICogICAgICAgPGJ1dHRvbj5TdWJtaXQ8L2J1dHRvbj5cbiAqICAgICA8L2Zvcm0+XG4gKiAgICk7XG4gKiB9XG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gdXNlRm9ybShwcm9wcyA9IHt9KSB7XG4gICAgY29uc3QgX2Zvcm1Db250cm9sID0gUmVhY3QudXNlUmVmKHVuZGVmaW5lZCk7XG4gICAgY29uc3QgX3ZhbHVlcyA9IFJlYWN0LnVzZVJlZih1bmRlZmluZWQpO1xuICAgIGNvbnN0IFtmb3JtU3RhdGUsIHVwZGF0ZUZvcm1TdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgoKSA9PiAoe1xuICAgICAgICAuLi5jbG9uZU9iamVjdChERUZBVUxUX0ZPUk1fU1RBVEUpLFxuICAgICAgICBpc0xvYWRpbmc6IGlzRnVuY3Rpb24ocHJvcHMuZGVmYXVsdFZhbHVlcyksXG4gICAgICAgIGVycm9yczogcHJvcHMuZXJyb3JzIHx8IHt9LFxuICAgICAgICBkaXNhYmxlZDogcHJvcHMuZGlzYWJsZWQgfHwgZmFsc2UsXG4gICAgICAgIGRlZmF1bHRWYWx1ZXM6IGlzRnVuY3Rpb24ocHJvcHMuZGVmYXVsdFZhbHVlcylcbiAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICA6IHByb3BzLmRlZmF1bHRWYWx1ZXMsXG4gICAgfSkpO1xuICAgIGlmICghX2Zvcm1Db250cm9sLmN1cnJlbnQpIHtcbiAgICAgICAgaWYgKHByb3BzLmZvcm1Db250cm9sKSB7XG4gICAgICAgICAgICBfZm9ybUNvbnRyb2wuY3VycmVudCA9IHtcbiAgICAgICAgICAgICAgICAuLi5wcm9wcy5mb3JtQ29udHJvbCxcbiAgICAgICAgICAgICAgICBmb3JtU3RhdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHByb3BzLmRlZmF1bHRWYWx1ZXMgJiYgIWlzRnVuY3Rpb24ocHJvcHMuZGVmYXVsdFZhbHVlcykpIHtcbiAgICAgICAgICAgICAgICBwcm9wcy5mb3JtQ29udHJvbC5yZXNldChwcm9wcy5kZWZhdWx0VmFsdWVzLCBwcm9wcy5yZXNldE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgeyBmb3JtQ29udHJvbCwgLi4ucmVzdCB9ID0gY3JlYXRlRm9ybUNvbnRyb2wocHJvcHMpO1xuICAgICAgICAgICAgX2Zvcm1Db250cm9sLmN1cnJlbnQgPSB7XG4gICAgICAgICAgICAgICAgLi4ucmVzdCxcbiAgICAgICAgICAgICAgICBmb3JtU3RhdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGNvbnRyb2wgPSBfZm9ybUNvbnRyb2wuY3VycmVudC5jb250cm9sO1xuICAgIGNvbnRyb2wuX29wdGlvbnMgPSBwcm9wcztcbiAgICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3ViID0gY29udHJvbC5fc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGZvcm1TdGF0ZTogY29udHJvbC5fcHJveHlGb3JtU3RhdGUsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdXBkYXRlRm9ybVN0YXRlKHtcbiAgICAgICAgICAgICAgICAuLi5jb250cm9sLl9mb3JtU3RhdGUsXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlczogY29udHJvbC5fZGVmYXVsdFZhbHVlcyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVSZW5kZXJSb290OiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgdXBkYXRlRm9ybVN0YXRlKChkYXRhKSA9PiAoe1xuICAgICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICAgIGlzUmVhZHk6IHRydWUsXG4gICAgICAgIH0pKTtcbiAgICAgICAgY29udHJvbC5fZm9ybVN0YXRlLmlzUmVhZHkgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc3ViO1xuICAgIH0sIFtjb250cm9sXSk7XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IGNvbnRyb2wuX2Rpc2FibGVGb3JtKHByb3BzLmRpc2FibGVkKSwgW2NvbnRyb2wsIHByb3BzLmRpc2FibGVkXSk7XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKHByb3BzLm1vZGUpIHtcbiAgICAgICAgICAgIGNvbnRyb2wuX29wdGlvbnMubW9kZSA9IHByb3BzLm1vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BzLnJlVmFsaWRhdGVNb2RlKSB7XG4gICAgICAgICAgICBjb250cm9sLl9vcHRpb25zLnJlVmFsaWRhdGVNb2RlID0gcHJvcHMucmVWYWxpZGF0ZU1vZGU7XG4gICAgICAgIH1cbiAgICB9LCBbY29udHJvbCwgcHJvcHMubW9kZSwgcHJvcHMucmVWYWxpZGF0ZU1vZGVdKTtcbiAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAocHJvcHMuZXJyb3JzKSB7XG4gICAgICAgICAgICBjb250cm9sLl9zZXRFcnJvcnMocHJvcHMuZXJyb3JzKTtcbiAgICAgICAgICAgIGNvbnRyb2wuX2ZvY3VzRXJyb3IoKTtcbiAgICAgICAgfVxuICAgIH0sIFtjb250cm9sLCBwcm9wcy5lcnJvcnNdKTtcbiAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBwcm9wcy5zaG91bGRVbnJlZ2lzdGVyICYmXG4gICAgICAgICAgICBjb250cm9sLl9zdWJqZWN0cy5zdGF0ZS5uZXh0KHtcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IGNvbnRyb2wuX2dldFdhdGNoKCksXG4gICAgICAgICAgICB9KTtcbiAgICB9LCBbY29udHJvbCwgcHJvcHMuc2hvdWxkVW5yZWdpc3Rlcl0pO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChjb250cm9sLl9wcm94eUZvcm1TdGF0ZS5pc0RpcnR5KSB7XG4gICAgICAgICAgICBjb25zdCBpc0RpcnR5ID0gY29udHJvbC5fZ2V0RGlydHkoKTtcbiAgICAgICAgICAgIGlmIChpc0RpcnR5ICE9PSBmb3JtU3RhdGUuaXNEaXJ0eSkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuX3N1YmplY3RzLnN0YXRlLm5leHQoe1xuICAgICAgICAgICAgICAgICAgICBpc0RpcnR5LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwgW2NvbnRyb2wsIGZvcm1TdGF0ZS5pc0RpcnR5XSk7XG4gICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBpZiAocHJvcHMudmFsdWVzICYmICFkZWVwRXF1YWwocHJvcHMudmFsdWVzLCBfdmFsdWVzLmN1cnJlbnQpKSB7XG4gICAgICAgICAgICBjb250cm9sLl9yZXNldChwcm9wcy52YWx1ZXMsIHtcbiAgICAgICAgICAgICAgICBrZWVwRmllbGRzUmVmOiB0cnVlLFxuICAgICAgICAgICAgICAgIC4uLmNvbnRyb2wuX29wdGlvbnMucmVzZXRPcHRpb25zLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoISgoX2EgPSBjb250cm9sLl9vcHRpb25zLnJlc2V0T3B0aW9ucykgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmtlZXBJc1ZhbGlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuX3NldFZhbGlkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdmFsdWVzLmN1cnJlbnQgPSBwcm9wcy52YWx1ZXM7XG4gICAgICAgICAgICB1cGRhdGVGb3JtU3RhdGUoKHN0YXRlKSA9PiAoeyAuLi5zdGF0ZSB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb250cm9sLl9yZXNldERlZmF1bHRWYWx1ZXMoKTtcbiAgICAgICAgfVxuICAgIH0sIFtjb250cm9sLCBwcm9wcy52YWx1ZXNdKTtcbiAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoIWNvbnRyb2wuX3N0YXRlLm1vdW50KSB7XG4gICAgICAgICAgICBjb250cm9sLl9zZXRWYWxpZCgpO1xuICAgICAgICAgICAgY29udHJvbC5fc3RhdGUubW91bnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250cm9sLl9zdGF0ZS53YXRjaCkge1xuICAgICAgICAgICAgY29udHJvbC5fc3RhdGUud2F0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnRyb2wuX3N1YmplY3RzLnN0YXRlLm5leHQoeyAuLi5jb250cm9sLl9mb3JtU3RhdGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udHJvbC5fcmVtb3ZlVW5tb3VudGVkKCk7XG4gICAgfSk7XG4gICAgX2Zvcm1Db250cm9sLmN1cnJlbnQuZm9ybVN0YXRlID0gUmVhY3QudXNlTWVtbygoKSA9PiBnZXRQcm94eUZvcm1TdGF0ZShmb3JtU3RhdGUsIGNvbnRyb2wpLCBbY29udHJvbCwgZm9ybVN0YXRlXSk7XG4gICAgcmV0dXJuIF9mb3JtQ29udHJvbC5jdXJyZW50O1xufVxuXG4vKipcbiAqIFdhdGNoIGNvbXBvbmVudCB0aGF0IHN1YnNjcmliZXMgdG8gZm9ybSBmaWVsZCBjaGFuZ2VzIGFuZCByZS1yZW5kZXJzIHdoZW4gd2F0Y2hlZCBmaWVsZHMgdXBkYXRlLlxuICpcbiAqIEBwYXJhbSBjb250cm9sIC0gVGhlIGZvcm0gY29udHJvbCBvYmplY3QgZnJvbSB1c2VGb3JtXG4gKiBAcGFyYW0gbmFtZSAtIENhbiBiZSBmaWVsZCBuYW1lLCBhcnJheSBvZiBmaWVsZCBuYW1lcywgb3IgdW5kZWZpbmVkIHRvIHdhdGNoIHRoZSBlbnRpcmUgZm9ybVxuICogQHBhcmFtIGRpc2FibGVkIC0gRGlzYWJsZSBzdWJzY3JpcHRpb25cbiAqIEBwYXJhbSBleGFjdCAtIFdoZXRoZXIgdG8gd2F0Y2ggZXhhY3QgZmllbGQgbmFtZXMgb3Igbm90XG4gKiBAcGFyYW0gZGVmYXVsdFZhbHVlIC0gVGhlIGRlZmF1bHQgdmFsdWUgdG8gdXNlIGlmIHRoZSBmaWVsZCBpcyBub3QgeWV0IHNldFxuICogQHBhcmFtIGNvbXB1dGUgLSBGdW5jdGlvbiB0byBjb21wdXRlIGRlcml2ZWQgdmFsdWVzIGZyb20gd2F0Y2hlZCBmaWVsZHNcbiAqIEBwYXJhbSByZW5kZXIgLSBUaGUgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB3YXRjaGVkIHZhbHVlcyBhbmQgcmV0dXJucyBSZWFjdE5vZGVcbiAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgY2FsbGluZyByZW5kZXIgZnVuY3Rpb24gd2l0aCB3YXRjaGVkIHZhbHVlc1xuICpcbiAqIEBleGFtcGxlXG4gKiBUaGUgYFdhdGNoYCBjb21wb25lbnQgb25seSByZS1yZW5kZXIgd2hlbiB0aGUgdmFsdWVzIG9mIGBmb29gLCBgYmFyYCwgYW5kIGBiYXoucXV4YCBjaGFuZ2UuXG4gKiBUaGUgdHlwZXMgb2YgYGZvb2AsIGBiYXJgLCBhbmQgYGJhei5xdXhgIGFyZSBwcmVjaXNlbHkgaW5mZXJyZWQuXG4gKlxuICogYGBgdHN4XG4gKiBjb25zdCB7IGNvbnRyb2wgfSA9IHVzZUZvcm0oKTtcbiAqXG4gKiA8V2F0Y2hcbiAqICAgY29udHJvbD17Y29udHJvbH1cbiAqICAgbmFtZXM9e1snZm9vJywgJ2JhcicsICdiYXoucXV4J119XG4gKiAgIHJlbmRlcj17KFtmb28sIGJhciwgYmF6X3F1eF0pID0+IDxkaXY+e2Zvb317YmFyfXtiYXpfcXV4fTwvZGl2Pn1cbiAqIC8+XG4gKiBgYGBcbiAqL1xuY29uc3QgV2F0Y2ggPSAocHJvcHMpID0+IHByb3BzLnJlbmRlcih1c2VXYXRjaCh7IG5hbWU6IHByb3BzLm5hbWVzLCAuLi5wcm9wcyB9KSk7XG5cbmV4cG9ydCB7IENvbnRyb2xsZXIsIEZvcm0sIEZvcm1Qcm92aWRlciwgRm9ybVN0YXRlU3Vic2NyaWJlLCBXYXRjaCwgYXBwZW5kRXJyb3JzLCBjcmVhdGVGb3JtQ29udHJvbCwgZ2V0LCBzZXQsIHVzZUNvbnRyb2xsZXIsIHVzZUZpZWxkQXJyYXksIHVzZUZvcm0sIHVzZUZvcm1Db250ZXh0LCB1c2VGb3JtU3RhdGUsIHVzZVdhdGNoIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5lc20ubWpzLm1hcFxuIl0sIm1hcHBpbmdzIjoiOzs7O0FBRUEsSUFBSSxtQkFBbUIsWUFBWSxRQUFRLFNBQVM7QUFFcEQsSUFBSSxnQkFBZ0IsVUFBVSxpQkFBaUI7QUFFL0MsSUFBSSxxQkFBcUIsVUFBVSxTQUFTO0FBRTVDLElBQU0sZ0JBQWdCLFVBQVUsT0FBTyxVQUFVO0FBQ2pELElBQUksWUFBWSxVQUFVLENBQUMsa0JBQWtCLEtBQUssS0FDOUMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUNwQixhQUFhLEtBQUssS0FDbEIsQ0FBQyxhQUFhLEtBQUs7QUFFdkIsSUFBSSxpQkFBaUIsVUFBVSxTQUFTLEtBQUssS0FBSyxN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TUFBTSxRQUFRO0dBQ2QsUUFBUSxXQUFXLE1BQU0sTUFBTTtHQUMvQixRQUFRLFlBQVk7RUFDeEI7Q0FDSixHQUFHLENBQUMsU0FBUyxNQUFNLE1BQU0sQ0FBQztDQUMxQixhQUFNLGdCQUFnQjtFQUNsQixNQUFNLG9CQUNGLFFBQVEsVUFBVSxNQUFNLEtBQUssRUFDekIsUUFBUSxRQUFRLFVBQVUsRUFDOUIsQ0FBQztDQUNULEdBQUcsQ0FBQyxTQUFTLE1BQU0sZ0JBQWdCLENBQUM7Q0FDcEMsYUFBTSxnQkFBZ0I7RUFDbEIsSUFBSSxRQUFRLGdCQUFnQixTQUFTO0dBQ2pDLE1BQU0sVUFBVSxRQUFRLFVBQVU7R0FDbEMsSUFBSSxZQUFZLFVBQVUsU0FDdEIsUUFBUSxVQUFVLE1BQU0sS0FBSyxFQUN6QixRQUNKLENBQUM7RUFFVDtDQUNKLEdBQUcsQ0FBQyxTQUFTLFVBQVUsT0FBTyxDQUFDO0NBQy9CLGFBQU0sZ0JBQWdCO0VBQ2xCLElBQUk7RUFDSixJQUFJLE1BQU0sVUFBVSxDQUFDLFVBQVUsTUFBTSxRQUFRLFFBQVEsT0FBTyxHQUFHO0dBQzNELFFBQVEsT0FBTyxNQUFNLFFBQVE7SUFDekIsZUFBZTtJQUNmLEdBQUcsUUFBUSxTQUFTO0dBQ3hCLENBQUM7R0FDRCxJQUFJLEdBQUcsS0FBSyxRQUFRLFNBQVMsa0JBQWtCLFFBQVEsT0FBTyxLQUFLLElBQUksS0FBSyxJQUFJLEdBQUcsY0FDL0UsUUFBUSxVQUFVO0dBRXRCLFFBQVEsVUFBVSxNQUFNO0dBQ3hCLGlCQUFpQixXQUFXLEVBQUUsR0FBRyxNQUFNLEVBQUU7RUFDN0MsT0FFSSxRQUFRLG9CQUFvQjtDQUVwQyxHQUFHLENBQUMsU0FBUyxNQUFNLE1BQU0sQ0FBQztDQUMxQixhQUFNLGdCQUFnQjtFQUNsQixJQUFJLENBQUMsUUFBUSxPQUFPLE9BQU87R0FDdkIsUUFBUSxVQUFVO0dBQ2xCLFFBQVEsT0FBTyxRQUFRO0VBQzNCO0VBQ0EsSUFBSSxRQUFRLE9BQU8sT0FBTztHQUN0QixRQUFRLE9BQU8sUUFBUTtHQUN2QixRQUFRLFVBQVUsTUFBTSxLQUFLLEVBQUUsR0FBRyxRQUFRLFdBQVcsQ0FBQztFQUMxRDtFQUNBLFFBQVEsaUJBQWlCO0NBQzdCLENBQUM7Q0FDRCxhQUFhLFFBQVEsWUFBQSxhQUFrQixjQUFjLGtCQUFrQixXQUFXLE9BQU8sR0FBRyxDQUFDLFNBQVMsU0FBUyxDQUFDO0NBQ2hILE9BQU8sYUFBYTtBQUN4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLElBQU0sU0FBUyxVQUFVLE1BQU0sT0FBTyxTQUFTO0NBQUUsTUFBTSxNQUFNO0NBQU8sR0FBRztBQUFNLENBQUMsQ0FBQyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=