(function () {
    'use strict';

    /**
     * Make a map and return a function for checking if a key
     * is in that map.
     * IMPORTANT: all calls of this function must be prefixed with
     * \/\*#\_\_PURE\_\_\*\/
     * So that rollup can tree-shake them if necessary.
     */
    function makeMap(str, expectsLowerCase) {
        const map = Object.create(null);
        const list = str.split(',');
        for (let i = 0; i < list.length; i++) {
            map[list[i]] = true;
        }
        return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
    }

    const GLOBALS_WHITE_LISTED = 'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
        'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
        'Object,Boolean,String,RegExp,Map,Set,JSON,Intl';
    const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED);

    /**
     * On the client we only need to offer special cases for boolean attributes that
     * have different names from their corresponding dom properties:
     * - itemscope -> N/A
     * - allowfullscreen -> allowFullscreen
     * - formnovalidate -> formNoValidate
     * - ismap -> isMap
     * - nomodule -> noModule
     * - novalidate -> noValidate
     * - readonly -> readOnly
     */
    const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
    const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs);

    function normalizeStyle(value) {
        if (isArray(value)) {
            const res = {};
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const normalized = normalizeStyle(isString(item) ? parseStringStyle(item) : item);
                if (normalized) {
                    for (const key in normalized) {
                        res[key] = normalized[key];
                    }
                }
            }
            return res;
        }
        else if (isObject(value)) {
            return value;
        }
    }
    const listDelimiterRE = /;(?![^(]*\))/g;
    const propertyDelimiterRE = /:(.+)/;
    function parseStringStyle(cssText) {
        const ret = {};
        cssText.split(listDelimiterRE).forEach(item => {
            if (item) {
                const tmp = item.split(propertyDelimiterRE);
                tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
            }
        });
        return ret;
    }
    function normalizeClass(value) {
        let res = '';
        if (isString(value)) {
            res = value;
        }
        else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                res += normalizeClass(value[i]) + ' ';
            }
        }
        else if (isObject(value)) {
            for (const name in value) {
                if (value[name]) {
                    res += name + ' ';
                }
            }
        }
        return res.trim();
    }

    /**
     * For converting {{ interpolation }} values to displayed strings.
     * @private
     */
    const toDisplayString = (val) => {
        return val == null
            ? ''
            : isObject(val)
                ? JSON.stringify(val, replacer, 2)
                : String(val);
    };
    const replacer = (_key, val) => {
        if (isMap(val)) {
            return {
                [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
                    entries[`${key} =>`] = val;
                    return entries;
                }, {})
            };
        }
        else if (isSet(val)) {
            return {
                [`Set(${val.size})`]: [...val.values()]
            };
        }
        else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
            return String(val);
        }
        return val;
    };
    const EMPTY_OBJ =  {};
    const EMPTY_ARR = [];
    const NOOP = () => { };
    /**
     * Always return false.
     */
    const NO = () => false;
    const onRE = /^on[^a-z]/;
    const isOn = (key) => onRE.test(key);
    const isModelListener = (key) => key.startsWith('onUpdate:');
    const extend = Object.assign;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = (val) => toTypeString(val) === '[object Map]';
    const isSet = (val) => toTypeString(val) === '[object Set]';
    const isFunction = (val) => typeof val === 'function';
    const isString = (val) => typeof val === 'string';
    const isSymbol = (val) => typeof val === 'symbol';
    const isObject = (val) => val !== null && typeof val === 'object';
    const isPromise = (val) => {
        return isObject(val) && isFunction(val.then) && isFunction(val.catch);
    };
    const objectToString = Object.prototype.toString;
    const toTypeString = (value) => objectToString.call(value);
    const toRawType = (value) => {
        return toTypeString(value).slice(8, -1);
    };
    const isPlainObject = (val) => toTypeString(val) === '[object Object]';
    const isIntegerKey = (key) => isString(key) &&
        key !== 'NaN' &&
        key[0] !== '-' &&
        '' + parseInt(key, 10) === key;
    const isReservedProp = /*#__PURE__*/ makeMap('key,ref,' +
        'onVnodeBeforeMount,onVnodeMounted,' +
        'onVnodeBeforeUpdate,onVnodeUpdated,' +
        'onVnodeBeforeUnmount,onVnodeUnmounted');
    const cacheStringFunction = (fn) => {
        const cache = Object.create(null);
        return ((str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        });
    };
    const camelizeRE = /-(\w)/g;
    /**
     * @private
     */
    const camelize = cacheStringFunction((str) => {
        return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
    });
    const hyphenateRE = /\B([A-Z])/g;
    /**
     * @private
     */
    const hyphenate = cacheStringFunction((str) => {
        return str.replace(hyphenateRE, '-$1').toLowerCase();
    });
    /**
     * @private
     */
    const capitalize = cacheStringFunction((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    // compare whether a value has changed, accounting for NaN.
    const hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
    const invokeArrayFns = (fns, arg) => {
        for (let i = 0; i < fns.length; i++) {
            fns[i](arg);
        }
    };
    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };

    const targetMap = new WeakMap();
    const effectStack = [];
    let activeEffect;
    const ITERATE_KEY = Symbol( '');
    const MAP_KEY_ITERATE_KEY = Symbol( '');
    function isEffect(fn) {
        return fn && fn._isEffect === true;
    }
    function effect(fn, options = EMPTY_OBJ) {
        if (isEffect(fn)) {
            fn = fn.raw;
        }
        const effect = createReactiveEffect(fn, options);
        if (!options.lazy) {
            effect();
        }
        return effect;
    }
    function stop(effect) {
        if (effect.active) {
            cleanup(effect);
            if (effect.options.onStop) {
                effect.options.onStop();
            }
            effect.active = false;
        }
    }
    let uid = 0;
    function createReactiveEffect(fn, options) {
        const effect = function reactiveEffect() {
            if (!effect.active) {
                return options.scheduler ? undefined : fn();
            }
            if (!effectStack.includes(effect)) {
                cleanup(effect);
                try {
                    enableTracking();
                    effectStack.push(effect);
                    activeEffect = effect;
                    return fn();
                }
                finally {
                    effectStack.pop();
                    resetTracking();
                    activeEffect = effectStack[effectStack.length - 1];
                }
            }
        };
        effect.id = uid++;
        effect._isEffect = true;
        effect.active = true;
        effect.raw = fn;
        effect.deps = [];
        effect.options = options;
        return effect;
    }
    function cleanup(effect) {
        const { deps } = effect;
        if (deps.length) {
            for (let i = 0; i < deps.length; i++) {
                deps[i].delete(effect);
            }
            deps.length = 0;
        }
    }
    let shouldTrack = true;
    const trackStack = [];
    function pauseTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = false;
    }
    function enableTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = true;
    }
    function resetTracking() {
        const last = trackStack.pop();
        shouldTrack = last === undefined ? true : last;
    }
    function track(target, type, key) {
        if (!shouldTrack || activeEffect === undefined) {
            return;
        }
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
        }
    }
    function trigger(target, type, key, newValue, oldValue, oldTarget) {
        const depsMap = targetMap.get(target);
        if (!depsMap) {
            // never been tracked
            return;
        }
        const effects = new Set();
        const add = (effectsToAdd) => {
            if (effectsToAdd) {
                effectsToAdd.forEach(effect => {
                    if (effect !== activeEffect || effect.options.allowRecurse) {
                        effects.add(effect);
                    }
                });
            }
        };
        if (type === "clear" /* CLEAR */) {
            // collection being cleared
            // trigger all effects for target
            depsMap.forEach(add);
        }
        else if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key >= newValue) {
                    add(dep);
                }
            });
        }
        else {
            // schedule runs for SET | ADD | DELETE
            if (key !== void 0) {
                add(depsMap.get(key));
            }
            // also run for iteration key on ADD | DELETE | Map.SET
            switch (type) {
                case "add" /* ADD */:
                    if (!isArray(target)) {
                        add(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            add(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    else if (isIntegerKey(key)) {
                        // new index added to array -> length changes
                        add(depsMap.get('length'));
                    }
                    break;
                case "delete" /* DELETE */:
                    if (!isArray(target)) {
                        add(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            add(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    break;
                case "set" /* SET */:
                    if (isMap(target)) {
                        add(depsMap.get(ITERATE_KEY));
                    }
                    break;
            }
        }
        const run = (effect) => {
            if (effect.options.scheduler) {
                effect.options.scheduler(effect);
            }
            else {
                effect();
            }
        };
        effects.forEach(run);
    }

    const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
        .map(key => Symbol[key])
        .filter(isSymbol));
    const get = /*#__PURE__*/ createGetter();
    const shallowGet = /*#__PURE__*/ createGetter(false, true);
    const readonlyGet = /*#__PURE__*/ createGetter(true);
    const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
    const arrayInstrumentations = {};
    ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
        const method = Array.prototype[key];
        arrayInstrumentations[key] = function (...args) {
            const arr = toRaw(this);
            for (let i = 0, l = this.length; i < l; i++) {
                track(arr, "get" /* GET */, i + '');
            }
            // we run the method using the original args first (which may be reactive)
            const res = method.apply(arr, args);
            if (res === -1 || res === false) {
                // if that didn't work, run it again using raw values.
                return method.apply(arr, args.map(toRaw));
            }
            else {
                return res;
            }
        };
    });
    ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
        const method = Array.prototype[key];
        arrayInstrumentations[key] = function (...args) {
            pauseTracking();
            const res = method.apply(this, args);
            enableTracking();
            return res;
        };
    });
    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_raw" /* RAW */ &&
                receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
                return target;
            }
            const targetIsArray = isArray(target);
            if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
                return Reflect.get(arrayInstrumentations, key, receiver);
            }
            const res = Reflect.get(target, key, receiver);
            const keyIsSymbol = isSymbol(key);
            if (keyIsSymbol
                ? builtInSymbols.has(key)
                : key === `__proto__` || key === `__v_isRef`) {
                return res;
            }
            if (!isReadonly) {
                track(target, "get" /* GET */, key);
            }
            if (shallow) {
                return res;
            }
            if (isRef(res)) {
                // ref unwrapping - does not apply for Array + integer key.
                const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
                return shouldUnwrap ? res.value : res;
            }
            if (isObject(res)) {
                // Convert returned value into a proxy as well. we do the isObject check
                // here to avoid invalid value warning. Also need to lazy access readonly
                // and reactive here to avoid circular dependency.
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        };
    }
    const set = /*#__PURE__*/ createSetter();
    const shallowSet = /*#__PURE__*/ createSetter(true);
    function createSetter(shallow = false) {
        return function set(target, key, value, receiver) {
            const oldValue = target[key];
            if (!shallow) {
                value = toRaw(value);
                if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                    oldValue.value = value;
                    return true;
                }
            }
            const hadKey = isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key);
            const result = Reflect.set(target, key, value, receiver);
            // don't trigger if target is something up in the prototype chain of original
            if (target === toRaw(receiver)) {
                if (!hadKey) {
                    trigger(target, "add" /* ADD */, key, value);
                }
                else if (hasChanged(value, oldValue)) {
                    trigger(target, "set" /* SET */, key, value);
                }
            }
            return result;
        };
    }
    function deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined);
        }
        return result;
    }
    function has(target, key) {
        const result = Reflect.has(target, key);
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, "has" /* HAS */, key);
        }
        return result;
    }
    function ownKeys(target) {
        track(target, "iterate" /* ITERATE */, ITERATE_KEY);
        return Reflect.ownKeys(target);
    }
    const mutableHandlers = {
        get,
        set,
        deleteProperty,
        has,
        ownKeys
    };
    const readonlyHandlers = {
        get: readonlyGet,
        set(target, key) {
            return true;
        },
        deleteProperty(target, key) {
            return true;
        }
    };
    const shallowReactiveHandlers = extend({}, mutableHandlers, {
        get: shallowGet,
        set: shallowSet
    });
    // Props handlers are special in the sense that it should not unwrap top-level
    // refs (in order to allow refs to be explicitly passed down), but should
    // retain the reactivity of the normal readonly object.
    const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
        get: shallowReadonlyGet
    });

    const toReactive = (value) => isObject(value) ? reactive(value) : value;
    const toReadonly = (value) => isObject(value) ? readonly(value) : value;
    const toShallow = (value) => value;
    const getProto = (v) => Reflect.getPrototypeOf(v);
    function get$1(target, key, isReadonly = false, isShallow = false) {
        // #1772: readonly(reactive(Map)) should return readonly + reactive version
        // of the value
        target = target["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "get" /* GET */, key);
        }
        !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
        const { has } = getProto(rawTarget);
        const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
        if (has.call(rawTarget, key)) {
            return wrap(target.get(key));
        }
        else if (has.call(rawTarget, rawKey)) {
            return wrap(target.get(rawKey));
        }
    }
    function has$1(key, isReadonly = false) {
        const target = this["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "has" /* HAS */, key);
        }
        !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
        return key === rawKey
            ? target.has(key)
            : target.has(key) || target.has(rawKey);
    }
    function size(target, isReadonly = false) {
        target = target["__v_raw" /* RAW */];
        !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
        return Reflect.get(target, 'size', target);
    }
    function add(value) {
        value = toRaw(value);
        const target = toRaw(this);
        const proto = getProto(target);
        const hadKey = proto.has.call(target, value);
        const result = target.add(value);
        if (!hadKey) {
            trigger(target, "add" /* ADD */, value, value);
        }
        return result;
    }
    function set$1(key, value) {
        value = toRaw(value);
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        const result = target.set(key, value);
        if (!hadKey) {
            trigger(target, "add" /* ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            trigger(target, "set" /* SET */, key, value);
        }
        return result;
    }
    function deleteEntry(key) {
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        const oldValue = get ? get.call(target, key) : undefined;
        // forward the operation before queueing reactions
        const result = target.delete(key);
        if (hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined);
        }
        return result;
    }
    function clear() {
        const target = toRaw(this);
        const hadItems = target.size !== 0;
        // forward the operation before queueing reactions
        const result = target.clear();
        if (hadItems) {
            trigger(target, "clear" /* CLEAR */, undefined, undefined);
        }
        return result;
    }
    function createForEach(isReadonly, isShallow) {
        return function forEach(callback, thisArg) {
            const observed = this;
            const target = observed["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
            !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
            return target.forEach((value, key) => {
                // important: make sure the callback is
                // 1. invoked with the reactive map as `this` and 3rd arg
                // 2. the value received should be a corresponding reactive/readonly.
                return callback.call(thisArg, wrap(value), wrap(key), observed);
            });
        };
    }
    function createIterableMethod(method, isReadonly, isShallow) {
        return function (...args) {
            const target = this["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const targetIsMap = isMap(rawTarget);
            const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
            const isKeyOnly = method === 'keys' && targetIsMap;
            const innerIterator = target[method](...args);
            const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
            !isReadonly &&
                track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
            // return a wrapped iterator which returns observed versions of the
            // values emitted from the real iterator
            return {
                // iterator protocol
                next() {
                    const { value, done } = innerIterator.next();
                    return done
                        ? { value, done }
                        : {
                            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                            done
                        };
                },
                // iterable protocol
                [Symbol.iterator]() {
                    return this;
                }
            };
        };
    }
    function createReadonlyMethod(type) {
        return function (...args) {
            return type === "delete" /* DELETE */ ? false : this;
        };
    }
    const mutableInstrumentations = {
        get(key) {
            return get$1(this, key);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, false)
    };
    const shallowInstrumentations = {
        get(key) {
            return get$1(this, key, false, true);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, true)
    };
    const readonlyInstrumentations = {
        get(key) {
            return get$1(this, key, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has$1.call(this, key, true);
        },
        add: createReadonlyMethod("add" /* ADD */),
        set: createReadonlyMethod("set" /* SET */),
        delete: createReadonlyMethod("delete" /* DELETE */),
        clear: createReadonlyMethod("clear" /* CLEAR */),
        forEach: createForEach(true, false)
    };
    const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
    iteratorMethods.forEach(method => {
        mutableInstrumentations[method] = createIterableMethod(method, false, false);
        readonlyInstrumentations[method] = createIterableMethod(method, true, false);
        shallowInstrumentations[method] = createIterableMethod(method, false, true);
    });
    function createInstrumentationGetter(isReadonly, shallow) {
        const instrumentations = shallow
            ? shallowInstrumentations
            : isReadonly
                ? readonlyInstrumentations
                : mutableInstrumentations;
        return (target, key, receiver) => {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_raw" /* RAW */) {
                return target;
            }
            return Reflect.get(hasOwn(instrumentations, key) && key in target
                ? instrumentations
                : target, key, receiver);
        };
    }
    const mutableCollectionHandlers = {
        get: createInstrumentationGetter(false, false)
    };
    const shallowCollectionHandlers = {
        get: createInstrumentationGetter(false, true)
    };
    const readonlyCollectionHandlers = {
        get: createInstrumentationGetter(true, false)
    };

    const reactiveMap = new WeakMap();
    const readonlyMap = new WeakMap();
    function targetTypeMap(rawType) {
        switch (rawType) {
            case 'Object':
            case 'Array':
                return 1 /* COMMON */;
            case 'Map':
            case 'Set':
            case 'WeakMap':
            case 'WeakSet':
                return 2 /* COLLECTION */;
            default:
                return 0 /* INVALID */;
        }
    }
    function getTargetType(value) {
        return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
            ? 0 /* INVALID */
            : targetTypeMap(toRawType(value));
    }
    function reactive(target) {
        // if trying to observe a readonly proxy, return the readonly version.
        if (target && target["__v_isReadonly" /* IS_READONLY */]) {
            return target;
        }
        return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
    }
    // Return a reactive-copy of the original object, where only the root level
    // properties are reactive, and does NOT unwrap refs nor recursively convert
    // returned properties.
    function shallowReactive(target) {
        return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers);
    }
    function readonly(target) {
        return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers);
    }
    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
        if (!isObject(target)) {
            return target;
        }
        // target is already a Proxy, return it.
        // exception: calling readonly() on a reactive object
        if (target["__v_raw" /* RAW */] &&
            !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
            return target;
        }
        // target already has corresponding Proxy
        const proxyMap = isReadonly ? readonlyMap : reactiveMap;
        const existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // only a whitelist of value types can be observed.
        const targetType = getTargetType(target);
        if (targetType === 0 /* INVALID */) {
            return target;
        }
        const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }
    function isReactive(value) {
        if (isReadonly(value)) {
            return isReactive(value["__v_raw" /* RAW */]);
        }
        return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
    }
    function isReadonly(value) {
        return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
    }
    function isProxy(value) {
        return isReactive(value) || isReadonly(value);
    }
    function toRaw(observed) {
        return ((observed && toRaw(observed["__v_raw" /* RAW */])) || observed);
    }
    function isRef(r) {
        return Boolean(r && r.__v_isRef === true);
    }
    function unref(ref) {
        return isRef(ref) ? ref.value : ref;
    }
    const shallowUnwrapHandlers = {
        get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
        set: (target, key, value, receiver) => {
            const oldValue = target[key];
            if (isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    };
    function proxyRefs(objectWithRefs) {
        return isReactive(objectWithRefs)
            ? objectWithRefs
            : new Proxy(objectWithRefs, shallowUnwrapHandlers);
    }

    class ComputedRefImpl {
        constructor(getter, _setter, isReadonly) {
            this._setter = _setter;
            this._dirty = true;
            this.__v_isRef = true;
            this.effect = effect(getter, {
                lazy: true,
                scheduler: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                        trigger(toRaw(this), "set" /* SET */, 'value');
                    }
                }
            });
            this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
        }
        get value() {
            if (this._dirty) {
                this._value = this.effect();
                this._dirty = false;
            }
            track(toRaw(this), "get" /* GET */, 'value');
            return this._value;
        }
        set value(newValue) {
            this._setter(newValue);
        }
    }
    function computed(getterOrOptions) {
        let getter;
        let setter;
        if (isFunction(getterOrOptions)) {
            getter = getterOrOptions;
            setter =  NOOP;
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
    }

    const stack = [];
    function warn(msg, ...args) {
        // avoid props formatting or warn handler tracking deps that might be mutated
        // during patch, leading to infinite recursion.
        pauseTracking();
        const instance = stack.length ? stack[stack.length - 1].component : null;
        const appWarnHandler = instance && instance.appContext.config.warnHandler;
        const trace = getComponentTrace();
        if (appWarnHandler) {
            callWithErrorHandling(appWarnHandler, instance, 11 /* APP_WARN_HANDLER */, [
                msg + args.join(''),
                instance && instance.proxy,
                trace
                    .map(({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`)
                    .join('\n'),
                trace
            ]);
        }
        else {
            const warnArgs = [`[Vue warn]: ${msg}`, ...args];
            /* istanbul ignore if */
            if (trace.length &&
                // avoid spamming console during tests
                !false) {
                warnArgs.push(`\n`, ...formatTrace(trace));
            }
            console.warn(...warnArgs);
        }
        resetTracking();
    }
    function getComponentTrace() {
        let currentVNode = stack[stack.length - 1];
        if (!currentVNode) {
            return [];
        }
        // we can't just use the stack because it will be incomplete during updates
        // that did not start from the root. Re-construct the parent chain using
        // instance parent pointers.
        const normalizedStack = [];
        while (currentVNode) {
            const last = normalizedStack[0];
            if (last && last.vnode === currentVNode) {
                last.recurseCount++;
            }
            else {
                normalizedStack.push({
                    vnode: currentVNode,
                    recurseCount: 0
                });
            }
            const parentInstance = currentVNode.component && currentVNode.component.parent;
            currentVNode = parentInstance && parentInstance.vnode;
        }
        return normalizedStack;
    }
    /* istanbul ignore next */
    function formatTrace(trace) {
        const logs = [];
        trace.forEach((entry, i) => {
            logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry));
        });
        return logs;
    }
    function formatTraceEntry({ vnode, recurseCount }) {
        const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
        const isRoot = vnode.component ? vnode.component.parent == null : false;
        const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
        const close = `>` + postfix;
        return vnode.props
            ? [open, ...formatProps(vnode.props), close]
            : [open + close];
    }
    /* istanbul ignore next */
    function formatProps(props) {
        const res = [];
        const keys = Object.keys(props);
        keys.slice(0, 3).forEach(key => {
            res.push(...formatProp(key, props[key]));
        });
        if (keys.length > 3) {
            res.push(` ...`);
        }
        return res;
    }
    /* istanbul ignore next */
    function formatProp(key, value, raw) {
        if (isString(value)) {
            value = JSON.stringify(value);
            return raw ? value : [`${key}=${value}`];
        }
        else if (typeof value === 'number' ||
            typeof value === 'boolean' ||
            value == null) {
            return raw ? value : [`${key}=${value}`];
        }
        else if (isRef(value)) {
            value = formatProp(key, toRaw(value.value), true);
            return raw ? value : [`${key}=Ref<`, value, `>`];
        }
        else if (isFunction(value)) {
            return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
        }
        else {
            value = toRaw(value);
            return raw ? value : [`${key}=`, value];
        }
    }
    function callWithErrorHandling(fn, instance, type, args) {
        let res;
        try {
            res = args ? fn(...args) : fn();
        }
        catch (err) {
            handleError(err, instance, type);
        }
        return res;
    }
    function callWithAsyncErrorHandling(fn, instance, type, args) {
        if (isFunction(fn)) {
            const res = callWithErrorHandling(fn, instance, type, args);
            if (res && isPromise(res)) {
                res.catch(err => {
                    handleError(err, instance, type);
                });
            }
            return res;
        }
        const values = [];
        for (let i = 0; i < fn.length; i++) {
            values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
        }
        return values;
    }
    function handleError(err, instance, type, throwInDev = true) {
        const contextVNode = instance ? instance.vnode : null;
        if (instance) {
            let cur = instance.parent;
            // the exposed instance is the render proxy to keep it consistent with 2.x
            const exposedInstance = instance.proxy;
            // in production the hook receives only the error code
            const errorInfo =  type;
            while (cur) {
                const errorCapturedHooks = cur.ec;
                if (errorCapturedHooks) {
                    for (let i = 0; i < errorCapturedHooks.length; i++) {
                        if (errorCapturedHooks[i](err, exposedInstance, errorInfo)) {
                            return;
                        }
                    }
                }
                cur = cur.parent;
            }
            // app-level handling
            const appErrorHandler = instance.appContext.config.errorHandler;
            if (appErrorHandler) {
                callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
                return;
            }
        }
        logError(err, type, contextVNode, throwInDev);
    }
    function logError(err, type, contextVNode, throwInDev = true) {
        {
            // recover in prod to reduce the impact on end-user
            console.error(err);
        }
    }

    let isFlushing = false;
    let isFlushPending = false;
    const queue = [];
    let flushIndex = 0;
    const pendingPreFlushCbs = [];
    let activePreFlushCbs = null;
    let preFlushIndex = 0;
    const pendingPostFlushCbs = [];
    let activePostFlushCbs = null;
    let postFlushIndex = 0;
    const resolvedPromise = Promise.resolve();
    let currentFlushPromise = null;
    let currentPreFlushParentJob = null;
    const RECURSION_LIMIT = 100;
    function nextTick(fn) {
        const p = currentFlushPromise || resolvedPromise;
        return fn ? p.then(fn) : p;
    }
    function queueJob(job) {
        // the dedupe search uses the startIndex argument of Array.includes()
        // by default the search index includes the current job that is being run
        // so it cannot recursively trigger itself again.
        // if the job is a watch() callback, the search will start with a +1 index to
        // allow it recursively trigger itself - it is the user's responsibility to
        // ensure it doesn't end up in an infinite loop.
        if ((!queue.length ||
            !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
            job !== currentPreFlushParentJob) {
            queue.push(job);
            queueFlush();
        }
    }
    function queueFlush() {
        if (!isFlushing && !isFlushPending) {
            isFlushPending = true;
            currentFlushPromise = resolvedPromise.then(flushJobs);
        }
    }
    function invalidateJob(job) {
        const i = queue.indexOf(job);
        if (i > -1) {
            queue[i] = null;
        }
    }
    function queueCb(cb, activeQueue, pendingQueue, index) {
        if (!isArray(cb)) {
            if (!activeQueue ||
                !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
                pendingQueue.push(cb);
            }
        }
        else {
            // if cb is an array, it is a component lifecycle hook which can only be
            // triggered by a job, which is already deduped in the main queue, so
            // we can skip duplicate check here to improve perf
            pendingQueue.push(...cb);
        }
        queueFlush();
    }
    function queuePostFlushCb(cb) {
        queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
    }
    function flushPreFlushCbs(seen, parentJob = null) {
        if (pendingPreFlushCbs.length) {
            currentPreFlushParentJob = parentJob;
            activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
            pendingPreFlushCbs.length = 0;
            for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
                activePreFlushCbs[preFlushIndex]();
            }
            activePreFlushCbs = null;
            preFlushIndex = 0;
            currentPreFlushParentJob = null;
            // recursively flush until it drains
            flushPreFlushCbs(seen, parentJob);
        }
    }
    function flushPostFlushCbs(seen) {
        if (pendingPostFlushCbs.length) {
            const deduped = [...new Set(pendingPostFlushCbs)];
            pendingPostFlushCbs.length = 0;
            // #1947 already has active queue, nested flushPostFlushCbs call
            if (activePostFlushCbs) {
                activePostFlushCbs.push(...deduped);
                return;
            }
            activePostFlushCbs = deduped;
            activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
            for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
                activePostFlushCbs[postFlushIndex]();
            }
            activePostFlushCbs = null;
            postFlushIndex = 0;
        }
    }
    const getId = (job) => job.id == null ? Infinity : job.id;
    function flushJobs(seen) {
        isFlushPending = false;
        isFlushing = true;
        flushPreFlushCbs(seen);
        // Sort queue before flush.
        // This ensures that:
        // 1. Components are updated from parent to child. (because parent is always
        //    created before the child so its render effect will have smaller
        //    priority number)
        // 2. If a component is unmounted during a parent component's update,
        //    its update can be skipped.
        // Jobs can never be null before flush starts, since they are only invalidated
        // during execution of another flushed job.
        queue.sort((a, b) => getId(a) - getId(b));
        try {
            for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
                const job = queue[flushIndex];
                if (job) {
                    if (("production" !== 'production')) ;
                    callWithErrorHandling(job, null, 14 /* SCHEDULER */);
                }
            }
        }
        finally {
            flushIndex = 0;
            queue.length = 0;
            flushPostFlushCbs();
            isFlushing = false;
            currentFlushPromise = null;
            // some postFlushCb queued jobs!
            // keep flushing until it drains.
            if (queue.length || pendingPostFlushCbs.length) {
                flushJobs(seen);
            }
        }
    }
    function checkRecursiveUpdates(seen, fn) {
        if (!seen.has(fn)) {
            seen.set(fn, 1);
        }
        else {
            const count = seen.get(fn);
            if (count > RECURSION_LIMIT) {
                throw new Error(`Maximum recursive updates exceeded. ` +
                    `This means you have a reactive effect that is mutating its own ` +
                    `dependencies and thus recursively triggering itself. Possible sources ` +
                    `include component template, render function, updated hook or ` +
                    `watcher source function.`);
            }
            else {
                seen.set(fn, count + 1);
            }
        }
    }

    function emit(instance, event, ...args) {
        const props = instance.vnode.props || EMPTY_OBJ;
        let handlerName = `on${capitalize(event)}`;
        let handler = props[handlerName];
        // for v-model update:xxx events, also trigger kebab-case equivalent
        // for props passed via kebab-case
        if (!handler && event.startsWith('update:')) {
            handlerName = `on${capitalize(hyphenate(event))}`;
            handler = props[handlerName];
        }
        if (!handler) {
            handler = props[handlerName + `Once`];
            if (!instance.emitted) {
                (instance.emitted = {})[handlerName] = true;
            }
            else if (instance.emitted[handlerName]) {
                return;
            }
        }
        if (handler) {
            callWithAsyncErrorHandling(handler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
        }
    }
    function normalizeEmitsOptions(comp, appContext, asMixin = false) {
        const appId = appContext.app ? appContext.app._uid : -1;
        const cache = comp.__emits || (comp.__emits = {});
        const cached = cache[appId];
        if (cached !== undefined) {
            return cached;
        }
        const raw = comp.emits;
        let normalized = {};
        // apply mixin/extends props
        let hasExtends = false;
        if (!raw && !hasExtends) {
            return (cache[appId] = null);
        }
        if (isArray(raw)) {
            raw.forEach(key => (normalized[key] = null));
        }
        else {
            extend(normalized, raw);
        }
        return (cache[appId] = normalized);
    }
    // Check if an incoming prop key is a declared emit event listener.
    // e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
    // both considered matched listeners.
    function isEmitListener(options, key) {
        if (!options || !isOn(key)) {
            return false;
        }
        key = key.replace(/Once$/, '');
        return (hasOwn(options, key[2].toLowerCase() + key.slice(3)) ||
            hasOwn(options, key.slice(2)));
    }

    // mark the current rendering instance for asset resolution (e.g.
    // resolveComponent, resolveDirective) during render
    let currentRenderingInstance = null;
    function setCurrentRenderingInstance(instance) {
        currentRenderingInstance = instance;
    }
    // dev only flag to track whether $attrs was used during render.
    // If $attrs was used during render then the warning for failed attrs
    // fallthrough can be suppressed.
    let accessedAttrs = false;
    function markAttrsAccessed() {
        accessedAttrs = true;
    }
    function renderComponentRoot(instance) {
        const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx } = instance;
        let result;
        currentRenderingInstance = instance;
        try {
            let fallthroughAttrs;
            if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                // withProxy is a proxy with a different `has` trap only for
                // runtime-compiled render functions using `with` block.
                const proxyToUse = withProxy || proxy;
                result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
                fallthroughAttrs = attrs;
            }
            else {
                // functional
                const render = Component;
                // in dev, mark attrs accessed if optional props (attrs === props)
                if (("production" !== 'production') && attrs === props) ;
                result = normalizeVNode(render.length > 1
                    ? render(props, ("production" !== 'production')
                        ? {
                            get attrs() {
                                markAttrsAccessed();
                                return attrs;
                            },
                            slots,
                            emit
                        }
                        : { attrs, slots, emit })
                    : render(props, null /* we know it doesn't need it */));
                fallthroughAttrs = Component.props
                    ? attrs
                    : getFunctionalFallthrough(attrs);
            }
            // attr merging
            // in dev mode, comments are preserved, and it's possible for a template
            // to have comments along side the root element which makes it a fragment
            let root = result;
            let setRoot = undefined;
            if (("production" !== 'production')) ;
            if (Component.inheritAttrs !== false && fallthroughAttrs) {
                const keys = Object.keys(fallthroughAttrs);
                const { shapeFlag } = root;
                if (keys.length) {
                    if (shapeFlag & 1 /* ELEMENT */ ||
                        shapeFlag & 6 /* COMPONENT */) {
                        if (propsOptions && keys.some(isModelListener)) {
                            // If a v-model listener (onUpdate:xxx) has a corresponding declared
                            // prop, it indicates this component expects to handle v-model and
                            // it should not fallthrough.
                            // related: #1543, #1643, #1989
                            fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                        }
                        root = cloneVNode(root, fallthroughAttrs);
                    }
                    else if (("production" !== 'production') && !accessedAttrs && root.type !== Comment) ;
                }
            }
            // inherit directives
            if (vnode.dirs) {
                if (("production" !== 'production') && !isElementRoot(root)) ;
                root.dirs = vnode.dirs;
            }
            // inherit transition data
            if (vnode.transition) {
                if (("production" !== 'production') && !isElementRoot(root)) ;
                root.transition = vnode.transition;
            }
            if (("production" !== 'production') && setRoot) ;
            else {
                result = root;
            }
        }
        catch (err) {
            handleError(err, instance, 1 /* RENDER_FUNCTION */);
            result = createVNode(Comment);
        }
        currentRenderingInstance = null;
        return result;
    }
    /**
     * dev only
     * In dev mode, template root level comments are rendered, which turns the
     * template into a fragment root, but we need to locate the single element
     * root for attrs and scope id processing.
     */
    const getChildRoot = (vnode) => {
        if (vnode.type !== Fragment) {
            return [vnode, undefined];
        }
        const rawChildren = vnode.children;
        const dynamicChildren = vnode.dynamicChildren;
        const childRoot = filterSingleRoot(rawChildren);
        if (!childRoot) {
            return [vnode, undefined];
        }
        const index = rawChildren.indexOf(childRoot);
        const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1;
        const setRoot = (updatedRoot) => {
            rawChildren[index] = updatedRoot;
            if (dynamicIndex > -1) {
                dynamicChildren[dynamicIndex] = updatedRoot;
            }
            else if (dynamicChildren && updatedRoot.patchFlag > 0) {
                dynamicChildren.push(updatedRoot);
            }
        };
        return [normalizeVNode(childRoot), setRoot];
    };
    /**
     * dev only
     */
    function filterSingleRoot(children) {
        const filtered = children.filter(child => {
            return !(isVNode(child) &&
                child.type === Comment &&
                child.children !== 'v-if');
        });
        return filtered.length === 1 && isVNode(filtered[0]) ? filtered[0] : null;
    }
    const getFunctionalFallthrough = (attrs) => {
        let res;
        for (const key in attrs) {
            if (key === 'class' || key === 'style' || isOn(key)) {
                (res || (res = {}))[key] = attrs[key];
            }
        }
        return res;
    };
    const filterModelListeners = (attrs, props) => {
        const res = {};
        for (const key in attrs) {
            if (!isModelListener(key) || !(key.slice(9) in props)) {
                res[key] = attrs[key];
            }
        }
        return res;
    };
    const isElementRoot = (vnode) => {
        return (vnode.shapeFlag & 6 /* COMPONENT */ ||
            vnode.shapeFlag & 1 /* ELEMENT */ ||
            vnode.type === Comment // potential v-if branch switch
        );
    };
    function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
        const { props: prevProps, children: prevChildren, component } = prevVNode;
        const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
        const emits = component.emitsOptions;
        // force child update for runtime directive or transition on component vnode.
        if (nextVNode.dirs || nextVNode.transition) {
            return true;
        }
        if (optimized && patchFlag > 0) {
            if (patchFlag & 1024 /* DYNAMIC_SLOTS */) {
                // slot content that references values that might have changed,
                // e.g. in a v-for
                return true;
            }
            if (patchFlag & 16 /* FULL_PROPS */) {
                if (!prevProps) {
                    return !!nextProps;
                }
                // presence of this flag indicates props are always non-null
                return hasPropsChanged(prevProps, nextProps, emits);
            }
            else if (patchFlag & 8 /* PROPS */) {
                const dynamicProps = nextVNode.dynamicProps;
                for (let i = 0; i < dynamicProps.length; i++) {
                    const key = dynamicProps[i];
                    if (nextProps[key] !== prevProps[key] &&
                        !isEmitListener(emits, key)) {
                        return true;
                    }
                }
            }
        }
        else {
            // this path is only taken by manually written render functions
            // so presence of any children leads to a forced update
            if (prevChildren || nextChildren) {
                if (!nextChildren || !nextChildren.$stable) {
                    return true;
                }
            }
            if (prevProps === nextProps) {
                return false;
            }
            if (!prevProps) {
                return !!nextProps;
            }
            if (!nextProps) {
                return true;
            }
            return hasPropsChanged(prevProps, nextProps, emits);
        }
        return false;
    }
    function hasPropsChanged(prevProps, nextProps, emitsOptions) {
        const nextKeys = Object.keys(nextProps);
        if (nextKeys.length !== Object.keys(prevProps).length) {
            return true;
        }
        for (let i = 0; i < nextKeys.length; i++) {
            const key = nextKeys[i];
            if (nextProps[key] !== prevProps[key] &&
                !isEmitListener(emitsOptions, key)) {
                return true;
            }
        }
        return false;
    }
    function updateHOCHostEl({ vnode, parent }, el // HostNode
    ) {
        while (parent && parent.subTree === vnode) {
            (vnode = parent.vnode).el = el;
            parent = parent.parent;
        }
    }

    const isSuspense = (type) => type.__isSuspense;
    function normalizeSuspenseChildren(vnode) {
        const { shapeFlag, children } = vnode;
        let content;
        let fallback;
        if (shapeFlag & 32 /* SLOTS_CHILDREN */) {
            content = normalizeSuspenseSlot(children.default);
            fallback = normalizeSuspenseSlot(children.fallback);
        }
        else {
            content = normalizeSuspenseSlot(children);
            fallback = normalizeVNode(null);
        }
        return {
            content,
            fallback
        };
    }
    function normalizeSuspenseSlot(s) {
        if (isFunction(s)) {
            s = s();
        }
        if (isArray(s)) {
            const singleChild = filterSingleRoot(s);
            s = singleChild;
        }
        return normalizeVNode(s);
    }
    function queueEffectWithSuspense(fn, suspense) {
        if (suspense && suspense.pendingBranch) {
            if (isArray(fn)) {
                suspense.effects.push(...fn);
            }
            else {
                suspense.effects.push(fn);
            }
        }
        else {
            queuePostFlushCb(fn);
        }
    }

    let isRenderingCompiledSlot = 0;
    const setCompiledSlotRendering = (n) => (isRenderingCompiledSlot += n);
    /**
     * Compiler runtime helper for rendering `<slot/>`
     * @private
     */
    function renderSlot(slots, name, props = {}, 
    // this is not a user-facing function, so the fallback is always generated by
    // the compiler and guaranteed to be a function returning an array
    fallback) {
        let slot = slots[name];
        // a compiled slot disables block tracking by default to avoid manual
        // invocation interfering with template-based block tracking, but in
        // `renderSlot` we can be sure that it's template-based so we can force
        // enable it.
        isRenderingCompiledSlot++;
        const rendered = (openBlock(),
            createBlock(Fragment, { key: props.key }, slot ? slot(props) : fallback ? fallback() : [], slots._ === 1 /* STABLE */
                ? 64 /* STABLE_FRAGMENT */
                : -2 /* BAIL */));
        isRenderingCompiledSlot--;
        return rendered;
    }

    /**
     * Wrap a slot function to memoize current rendering instance
     * @private
     */
    function withCtx(fn, ctx = currentRenderingInstance) {
        if (!ctx)
            return fn;
        const renderFnWithContext = (...args) => {
            // If a user calls a compiled slot inside a template expression (#1745), it
            // can mess up block tracking, so by default we need to push a null block to
            // avoid that. This isn't necessary if rendering a compiled `<slot>`.
            if (!isRenderingCompiledSlot) {
                openBlock(true /* null block that disables tracking */);
            }
            const owner = currentRenderingInstance;
            setCurrentRenderingInstance(ctx);
            const res = fn(...args);
            setCurrentRenderingInstance(owner);
            if (!isRenderingCompiledSlot) {
                closeBlock();
            }
            return res;
        };
        renderFnWithContext._c = true;
        return renderFnWithContext;
    }

    // SFC scoped style ID management.
    let currentScopeId = null;

    const isTeleport = (type) => type.__isTeleport;

    const COMPONENTS = 'components';
    /**
     * @private
     */
    function resolveComponent(name) {
        return resolveAsset(COMPONENTS, name) || name;
    }
    const NULL_DYNAMIC_COMPONENT = Symbol();
    /**
     * @private
     */
    function resolveDynamicComponent(component) {
        if (isString(component)) {
            return resolveAsset(COMPONENTS, component, false) || component;
        }
        else {
            // invalid types will fallthrough to createVNode and raise warning
            return (component || NULL_DYNAMIC_COMPONENT);
        }
    }
    // implementation
    function resolveAsset(type, name, warnMissing = true) {
        const instance = currentRenderingInstance || currentInstance;
        if (instance) {
            const Component = instance.type;
            // self name has highest priority
            if (type === COMPONENTS) {
                const selfName = Component.displayName || Component.name;
                if (selfName &&
                    (selfName === name ||
                        selfName === camelize(name) ||
                        selfName === capitalize(camelize(name)))) {
                    return Component;
                }
            }
            const res = 
            // local registration
            // check instance[type] first for components with mixin or extends.
            resolve(instance[type] || Component[type], name) ||
                // global registration
                resolve(instance.appContext[type], name);
            return res;
        }
    }
    function resolve(registry, name) {
        return (registry &&
            (registry[name] ||
                registry[camelize(name)] ||
                registry[capitalize(camelize(name))]));
    }

    const Fragment = Symbol( undefined);
    const Text = Symbol( undefined);
    const Comment = Symbol( undefined);
    const Static = Symbol( undefined);
    // Since v-if and v-for are the two possible ways node structure can dynamically
    // change, once we consider v-if branches and each v-for fragment a block, we
    // can divide a template into nested blocks, and within each block the node
    // structure would be stable. This allows us to skip most children diffing
    // and only worry about the dynamic nodes (indicated by patch flags).
    const blockStack = [];
    let currentBlock = null;
    /**
     * Open a block.
     * This must be called before `createBlock`. It cannot be part of `createBlock`
     * because the children of the block are evaluated before `createBlock` itself
     * is called. The generated code typically looks like this:
     *
     * ```js
     * function render() {
     *   return (openBlock(),createBlock('div', null, [...]))
     * }
     * ```
     * disableTracking is true when creating a v-for fragment block, since a v-for
     * fragment always diffs its children.
     *
     * @private
     */
    function openBlock(disableTracking = false) {
        blockStack.push((currentBlock = disableTracking ? null : []));
    }
    function closeBlock() {
        blockStack.pop();
        currentBlock = blockStack[blockStack.length - 1] || null;
    }
    /**
     * Create a block root vnode. Takes the same exact arguments as `createVNode`.
     * A block root keeps track of dynamic nodes within the block in the
     * `dynamicChildren` array.
     *
     * @private
     */
    function createBlock(type, props, children, patchFlag, dynamicProps) {
        const vnode = createVNode(type, props, children, patchFlag, dynamicProps, true /* isBlock: prevent a block from tracking itself */);
        // save current block children on the block vnode
        vnode.dynamicChildren = currentBlock || EMPTY_ARR;
        // close block
        closeBlock();
        // a block is always going to be patched, so track it as a child of its
        // parent block
        if ( currentBlock) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    const InternalObjectKey = `__vInternal`;
    const normalizeKey = ({ key }) => key != null ? key : null;
    const normalizeRef = ({ ref }) => {
        return (ref != null
            ? isArray(ref)
                ? ref
                : { i: currentRenderingInstance, r: ref }
            : null);
    };
    const createVNode = ( _createVNode);
    function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (!type || type === NULL_DYNAMIC_COMPONENT) {
            type = Comment;
        }
        if (isVNode(type)) {
            // createVNode receiving an existing vnode. This happens in cases like
            // <component :is="vnode"/>
            // #2078 make sure to merge refs during the clone instead of overwriting it
            const cloned = cloneVNode(type, props, true /* mergeRef: true */);
            if (children) {
                normalizeChildren(cloned, children);
            }
            return cloned;
        }
        // class component normalization.
        if (isClassComponent(type)) {
            type = type.__vccOpts;
        }
        // class & style normalization.
        if (props) {
            // for reactive or proxy objects, we need to clone it to enable mutation.
            if (isProxy(props) || InternalObjectKey in props) {
                props = extend({}, props);
            }
            let { class: klass, style } = props;
            if (klass && !isString(klass)) {
                props.class = normalizeClass(klass);
            }
            if (isObject(style)) {
                // reactive state objects need to be cloned since they are likely to be
                // mutated
                if (isProxy(style) && !isArray(style)) {
                    style = extend({}, style);
                }
                props.style = normalizeStyle(style);
            }
        }
        // encode the vnode type information into a bitmap
        const shapeFlag = isString(type)
            ? 1 /* ELEMENT */
            :  isSuspense(type)
                ? 128 /* SUSPENSE */
                : isTeleport(type)
                    ? 64 /* TELEPORT */
                    : isObject(type)
                        ? 4 /* STATEFUL_COMPONENT */
                        : isFunction(type)
                            ? 2 /* FUNCTIONAL_COMPONENT */
                            : 0;
        const vnode = {
            __v_isVNode: true,
            ["__v_skip" /* SKIP */]: true,
            type,
            props,
            key: props && normalizeKey(props),
            ref: props && normalizeRef(props),
            scopeId: currentScopeId,
            children: null,
            component: null,
            suspense: null,
            ssContent: null,
            ssFallback: null,
            dirs: null,
            transition: null,
            el: null,
            anchor: null,
            target: null,
            targetAnchor: null,
            staticCount: 0,
            shapeFlag,
            patchFlag,
            dynamicProps,
            dynamicChildren: null,
            appContext: null
        };
        normalizeChildren(vnode, children);
        // normalize suspense children
        if ( shapeFlag & 128 /* SUSPENSE */) {
            const { content, fallback } = normalizeSuspenseChildren(vnode);
            vnode.ssContent = content;
            vnode.ssFallback = fallback;
        }
        if (
            // avoid a block node from tracking itself
            !isBlockNode &&
            // has current parent block
            currentBlock &&
            // presence of a patch flag indicates this node needs patching on updates.
            // component nodes also should always be patched, because even if the
            // component doesn't need to update, it needs to persist the instance on to
            // the next vnode so that it can be properly unmounted later.
            (patchFlag > 0 || shapeFlag & 6 /* COMPONENT */) &&
            // the EVENTS flag is only for hydration and if it is the only flag, the
            // vnode should not be considered dynamic due to handler caching.
            patchFlag !== 32 /* HYDRATE_EVENTS */) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    function cloneVNode(vnode, extraProps, mergeRef = false) {
        // This is intentionally NOT using spread or extend to avoid the runtime
        // key enumeration cost.
        const { props, ref, patchFlag } = vnode;
        const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
        return {
            __v_isVNode: true,
            ["__v_skip" /* SKIP */]: true,
            type: vnode.type,
            props: mergedProps,
            key: mergedProps && normalizeKey(mergedProps),
            ref: extraProps && extraProps.ref
                ? // #2078 in the case of <component :is="vnode" ref="extra"/>
                    // if the vnode itself already has a ref, cloneVNode will need to merge
                    // the refs so the single vnode can be set on multiple refs
                    mergeRef && ref
                        ? isArray(ref)
                            ? ref.concat(normalizeRef(extraProps))
                            : [ref, normalizeRef(extraProps)]
                        : normalizeRef(extraProps)
                : ref,
            scopeId: vnode.scopeId,
            children: vnode.children,
            target: vnode.target,
            targetAnchor: vnode.targetAnchor,
            staticCount: vnode.staticCount,
            shapeFlag: vnode.shapeFlag,
            // if the vnode is cloned with extra props, we can no longer assume its
            // existing patch flag to be reliable and need to add the FULL_PROPS flag.
            // note: perserve flag for fragments since they use the flag for children
            // fast paths only.
            patchFlag: extraProps && vnode.type !== Fragment
                ? patchFlag === -1 // hoisted node
                    ? 16 /* FULL_PROPS */
                    : patchFlag | 16 /* FULL_PROPS */
                : patchFlag,
            dynamicProps: vnode.dynamicProps,
            dynamicChildren: vnode.dynamicChildren,
            appContext: vnode.appContext,
            dirs: vnode.dirs,
            transition: vnode.transition,
            // These should technically only be non-null on mounted VNodes. However,
            // they *should* be copied for kept-alive vnodes. So we just always copy
            // them since them being non-null during a mount doesn't affect the logic as
            // they will simply be overwritten.
            component: vnode.component,
            suspense: vnode.suspense,
            ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
            ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
            el: vnode.el,
            anchor: vnode.anchor
        };
    }
    /**
     * @private
     */
    function createTextVNode(text = ' ', flag = 0) {
        return createVNode(Text, null, text, flag);
    }
    /**
     * @private
     */
    function createCommentVNode(text = '', 
    // when used as the v-else branch, the comment node must be created as a
    // block to ensure correct updates.
    asBlock = false) {
        return asBlock
            ? (openBlock(), createBlock(Comment, null, text))
            : createVNode(Comment, null, text);
    }
    function normalizeVNode(child) {
        if (child == null || typeof child === 'boolean') {
            // empty placeholder
            return createVNode(Comment);
        }
        else if (isArray(child)) {
            // fragment
            return createVNode(Fragment, null, child);
        }
        else if (typeof child === 'object') {
            // already vnode, this should be the most common since compiled templates
            // always produce all-vnode children arrays
            return child.el === null ? child : cloneVNode(child);
        }
        else {
            // strings and numbers
            return createVNode(Text, null, String(child));
        }
    }
    // optimized normalization for template-compiled render fns
    function cloneIfMounted(child) {
        return child.el === null ? child : cloneVNode(child);
    }
    function normalizeChildren(vnode, children) {
        let type = 0;
        const { shapeFlag } = vnode;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') {
            if (shapeFlag & 1 /* ELEMENT */ || shapeFlag & 64 /* TELEPORT */) {
                // Normalize slot to plain children for plain element and Teleport
                const slot = children.default;
                if (slot) {
                    // _c marker is added by withCtx() indicating this is a compiled slot
                    slot._c && setCompiledSlotRendering(1);
                    normalizeChildren(vnode, slot());
                    slot._c && setCompiledSlotRendering(-1);
                }
                return;
            }
            else {
                type = 32 /* SLOTS_CHILDREN */;
                const slotFlag = children._;
                if (!slotFlag && !(InternalObjectKey in children)) {
                    children._ctx = currentRenderingInstance;
                }
                else if (slotFlag === 3 /* FORWARDED */ && currentRenderingInstance) {
                    // a child component receives forwarded slots from the parent.
                    // its slot type is determined by its parent's slot type.
                    if (currentRenderingInstance.vnode.patchFlag & 1024 /* DYNAMIC_SLOTS */) {
                        children._ = 2 /* DYNAMIC */;
                        vnode.patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                    }
                    else {
                        children._ = 1 /* STABLE */;
                    }
                }
            }
        }
        else if (isFunction(children)) {
            children = { default: children, _ctx: currentRenderingInstance };
            type = 32 /* SLOTS_CHILDREN */;
        }
        else {
            children = String(children);
            // force teleport children to array so it can be moved around
            if (shapeFlag & 64 /* TELEPORT */) {
                type = 16 /* ARRAY_CHILDREN */;
                children = [createTextVNode(children)];
            }
            else {
                type = 8 /* TEXT_CHILDREN */;
            }
        }
        vnode.children = children;
        vnode.shapeFlag |= type;
    }
    function mergeProps(...args) {
        const ret = extend({}, args[0]);
        for (let i = 1; i < args.length; i++) {
            const toMerge = args[i];
            for (const key in toMerge) {
                if (key === 'class') {
                    if (ret.class !== toMerge.class) {
                        ret.class = normalizeClass([ret.class, toMerge.class]);
                    }
                }
                else if (key === 'style') {
                    ret.style = normalizeStyle([ret.style, toMerge.style]);
                }
                else if (isOn(key)) {
                    const existing = ret[key];
                    const incoming = toMerge[key];
                    if (existing !== incoming) {
                        ret[key] = existing
                            ? [].concat(existing, toMerge[key])
                            : incoming;
                    }
                }
                else {
                    ret[key] = toMerge[key];
                }
            }
        }
        return ret;
    }

    function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
    isSSR = false) {
        const props = {};
        const attrs = {};
        def(attrs, InternalObjectKey, 1);
        setFullProps(instance, rawProps, props, attrs);
        if (isStateful) {
            // stateful
            instance.props = isSSR ? props : shallowReactive(props);
        }
        else {
            if (!instance.type.props) {
                // functional w/ optional props, props === attrs
                instance.props = attrs;
            }
            else {
                // functional w/ declared props
                instance.props = props;
            }
        }
        instance.attrs = attrs;
    }
    function updateProps(instance, rawProps, rawPrevProps, optimized) {
        const { props, attrs, vnode: { patchFlag } } = instance;
        const rawCurrentProps = toRaw(props);
        const [options] = instance.propsOptions;
        if (
        // always force full diff if hmr is enabled
        
            (optimized || patchFlag > 0) &&
            !(patchFlag & 16 /* FULL_PROPS */)) {
            if (patchFlag & 8 /* PROPS */) {
                // Compiler-generated props & no keys change, just set the updated
                // the props.
                const propsToUpdate = instance.vnode.dynamicProps;
                for (let i = 0; i < propsToUpdate.length; i++) {
                    const key = propsToUpdate[i];
                    // PROPS flag guarantees rawProps to be non-null
                    const value = rawProps[key];
                    if (options) {
                        // attr / props separation was done on init and will be consistent
                        // in this code path, so just check if attrs have it.
                        if (hasOwn(attrs, key)) {
                            attrs[key] = value;
                        }
                        else {
                            const camelizedKey = camelize(key);
                            props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance);
                        }
                    }
                    else {
                        attrs[key] = value;
                    }
                }
            }
        }
        else {
            // full props update.
            setFullProps(instance, rawProps, props, attrs);
            // in case of dynamic props, check if we need to delete keys from
            // the props object
            let kebabKey;
            for (const key in rawCurrentProps) {
                if (!rawProps ||
                    // for camelCase
                    (!hasOwn(rawProps, key) &&
                        // it's possible the original props was passed in as kebab-case
                        // and converted to camelCase (#955)
                        ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))) {
                    if (options) {
                        if (rawPrevProps &&
                            // for camelCase
                            (rawPrevProps[key] !== undefined ||
                                // for kebab-case
                                rawPrevProps[kebabKey] !== undefined)) {
                            props[key] = resolvePropValue(options, rawProps || EMPTY_OBJ, key, undefined, instance);
                        }
                    }
                    else {
                        delete props[key];
                    }
                }
            }
            // in the case of functional component w/o props declaration, props and
            // attrs point to the same object so it should already have been updated.
            if (attrs !== rawCurrentProps) {
                for (const key in attrs) {
                    if (!rawProps || !hasOwn(rawProps, key)) {
                        delete attrs[key];
                    }
                }
            }
        }
        // trigger updates for $attrs in case it's used in component slots
        trigger(instance, "set" /* SET */, '$attrs');
    }
    function setFullProps(instance, rawProps, props, attrs) {
        const [options, needCastKeys] = instance.propsOptions;
        if (rawProps) {
            for (const key in rawProps) {
                const value = rawProps[key];
                // key, ref are reserved and never passed down
                if (isReservedProp(key)) {
                    continue;
                }
                // prop option names are camelized during normalization, so to support
                // kebab -> camel conversion here we need to camelize the key.
                let camelKey;
                if (options && hasOwn(options, (camelKey = camelize(key)))) {
                    props[camelKey] = value;
                }
                else if (!isEmitListener(instance.emitsOptions, key)) {
                    // Any non-declared (either as a prop or an emitted event) props are put
                    // into a separate `attrs` object for spreading. Make sure to preserve
                    // original key casing
                    attrs[key] = value;
                }
            }
        }
        if (needCastKeys) {
            const rawCurrentProps = toRaw(props);
            for (let i = 0; i < needCastKeys.length; i++) {
                const key = needCastKeys[i];
                props[key] = resolvePropValue(options, rawCurrentProps, key, rawCurrentProps[key], instance);
            }
        }
    }
    function resolvePropValue(options, props, key, value, instance) {
        const opt = options[key];
        if (opt != null) {
            const hasDefault = hasOwn(opt, 'default');
            // default values
            if (hasDefault && value === undefined) {
                const defaultValue = opt.default;
                if (opt.type !== Function && isFunction(defaultValue)) {
                    setCurrentInstance(instance);
                    value = defaultValue(props);
                    setCurrentInstance(null);
                }
                else {
                    value = defaultValue;
                }
            }
            // boolean casting
            if (opt[0 /* shouldCast */]) {
                if (!hasOwn(props, key) && !hasDefault) {
                    value = false;
                }
                else if (opt[1 /* shouldCastTrue */] &&
                    (value === '' || value === hyphenate(key))) {
                    value = true;
                }
            }
        }
        return value;
    }
    function normalizePropsOptions(comp, appContext, asMixin = false) {
        const appId = appContext.app ? appContext.app._uid : -1;
        const cache = comp.__props || (comp.__props = {});
        const cached = cache[appId];
        if (cached) {
            return cached;
        }
        const raw = comp.props;
        const normalized = {};
        const needCastKeys = [];
        // apply mixin/extends props
        let hasExtends = false;
        if (!raw && !hasExtends) {
            return (cache[appId] = EMPTY_ARR);
        }
        if (isArray(raw)) {
            for (let i = 0; i < raw.length; i++) {
                const normalizedKey = camelize(raw[i]);
                if (validatePropName(normalizedKey)) {
                    normalized[normalizedKey] = EMPTY_OBJ;
                }
            }
        }
        else if (raw) {
            for (const key in raw) {
                const normalizedKey = camelize(key);
                if (validatePropName(normalizedKey)) {
                    const opt = raw[key];
                    const prop = (normalized[normalizedKey] =
                        isArray(opt) || isFunction(opt) ? { type: opt } : opt);
                    if (prop) {
                        const booleanIndex = getTypeIndex(Boolean, prop.type);
                        const stringIndex = getTypeIndex(String, prop.type);
                        prop[0 /* shouldCast */] = booleanIndex > -1;
                        prop[1 /* shouldCastTrue */] =
                            stringIndex < 0 || booleanIndex < stringIndex;
                        // if the prop needs boolean casting or default value
                        if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                            needCastKeys.push(normalizedKey);
                        }
                    }
                }
            }
        }
        return (cache[appId] = [normalized, needCastKeys]);
    }
    // use function string name to check type constructors
    // so that it works across vms / iframes.
    function getType(ctor) {
        const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
        return match ? match[1] : '';
    }
    function isSameType(a, b) {
        return getType(a) === getType(b);
    }
    function getTypeIndex(type, expectedTypes) {
        if (isArray(expectedTypes)) {
            for (let i = 0, len = expectedTypes.length; i < len; i++) {
                if (isSameType(expectedTypes[i], type)) {
                    return i;
                }
            }
        }
        else if (isFunction(expectedTypes)) {
            return isSameType(expectedTypes, type) ? 0 : -1;
        }
        return -1;
    }
    /**
     * dev only
     */
    function validatePropName(key) {
        if (key[0] !== '$') {
            return true;
        }
        return false;
    }

    const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

    const isInternalKey = (key) => key[0] === '_' || key === '$stable';
    const normalizeSlotValue = (value) => isArray(value)
        ? value.map(normalizeVNode)
        : [normalizeVNode(value)];
    const normalizeSlot = (key, rawSlot, ctx) => withCtx((props) => {
        return normalizeSlotValue(rawSlot(props));
    }, ctx);
    const normalizeObjectSlots = (rawSlots, slots) => {
        const ctx = rawSlots._ctx;
        for (const key in rawSlots) {
            if (isInternalKey(key))
                continue;
            const value = rawSlots[key];
            if (isFunction(value)) {
                slots[key] = normalizeSlot(key, value, ctx);
            }
            else if (value != null) {
                const normalized = normalizeSlotValue(value);
                slots[key] = () => normalized;
            }
        }
    };
    const normalizeVNodeSlots = (instance, children) => {
        const normalized = normalizeSlotValue(children);
        instance.slots.default = () => normalized;
    };
    const initSlots = (instance, children) => {
        if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                instance.slots = children;
                // make compiler marker non-enumerable
                def(children, '_', type);
            }
            else {
                normalizeObjectSlots(children, (instance.slots = {}));
            }
        }
        else {
            instance.slots = {};
            if (children) {
                normalizeVNodeSlots(instance, children);
            }
        }
        def(instance.slots, InternalObjectKey, 1);
    };
    const updateSlots = (instance, children) => {
        const { vnode, slots } = instance;
        let needDeletionCheck = true;
        let deletionComparisonTarget = EMPTY_OBJ;
        if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                // compiled slots.
                if (type === 1 /* STABLE */) {
                    // compiled AND stable.
                    // no need to update, and skip stale slots removal.
                    needDeletionCheck = false;
                }
                else {
                    // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                    // normalization.
                    extend(slots, children);
                }
            }
            else {
                needDeletionCheck = !children.$stable;
                normalizeObjectSlots(children, slots);
            }
            deletionComparisonTarget = children;
        }
        else if (children) {
            // non slot object children (direct value) passed to a component
            normalizeVNodeSlots(instance, children);
            deletionComparisonTarget = { default: 1 };
        }
        // delete stale slots
        if (needDeletionCheck) {
            for (const key in slots) {
                if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
                    delete slots[key];
                }
            }
        }
    };
    function invokeDirectiveHook(vnode, prevVNode, instance, name) {
        const bindings = vnode.dirs;
        const oldBindings = prevVNode && prevVNode.dirs;
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (oldBindings) {
                binding.oldValue = oldBindings[i].value;
            }
            const hook = binding.dir[name];
            if (hook) {
                callWithAsyncErrorHandling(hook, instance, 8 /* DIRECTIVE_HOOK */, [
                    vnode.el,
                    binding,
                    vnode,
                    prevVNode
                ]);
            }
        }
    }

    function createAppContext() {
        return {
            app: null,
            config: {
                isNativeTag: NO,
                performance: false,
                globalProperties: {},
                optionMergeStrategies: {},
                isCustomElement: NO,
                errorHandler: undefined,
                warnHandler: undefined
            },
            mixins: [],
            components: {},
            directives: {},
            provides: Object.create(null)
        };
    }
    let uid$1 = 0;
    function createAppAPI(render, hydrate) {
        return function createApp(rootComponent, rootProps = null) {
            if (rootProps != null && !isObject(rootProps)) {
                rootProps = null;
            }
            const context = createAppContext();
            const installedPlugins = new Set();
            let isMounted = false;
            const app = (context.app = {
                _uid: uid$1++,
                _component: rootComponent,
                _props: rootProps,
                _container: null,
                _context: context,
                version,
                get config() {
                    return context.config;
                },
                set config(v) {
                },
                use(plugin, ...options) {
                    if (installedPlugins.has(plugin)) ;
                    else if (plugin && isFunction(plugin.install)) {
                        installedPlugins.add(plugin);
                        plugin.install(app, ...options);
                    }
                    else if (isFunction(plugin)) {
                        installedPlugins.add(plugin);
                        plugin(app, ...options);
                    }
                    else ;
                    return app;
                },
                mixin(mixin) {
                    return app;
                },
                component(name, component) {
                    if (!component) {
                        return context.components[name];
                    }
                    context.components[name] = component;
                    return app;
                },
                directive(name, directive) {
                    if (!directive) {
                        return context.directives[name];
                    }
                    context.directives[name] = directive;
                    return app;
                },
                mount(rootContainer, isHydrate) {
                    if (!isMounted) {
                        const vnode = createVNode(rootComponent, rootProps);
                        // store app context on the root VNode.
                        // this will be set on the root instance on initial mount.
                        vnode.appContext = context;
                        if (isHydrate && hydrate) {
                            hydrate(vnode, rootContainer);
                        }
                        else {
                            render(vnode, rootContainer);
                        }
                        isMounted = true;
                        app._container = rootContainer;
                        rootContainer.__vue_app__ = app;
                        return vnode.component.proxy;
                    }
                },
                unmount() {
                    if (isMounted) {
                        render(null, app._container);
                    }
                },
                provide(key, value) {
                    // TypeScript doesn't allow symbols as index type
                    // https://github.com/Microsoft/TypeScript/issues/24587
                    context.provides[key] = value;
                    return app;
                }
            });
            return app;
        };
    }

    const prodEffectOptions = {
        scheduler: queueJob,
        // #1801, #2043 component render effects should allow recursive updates
        allowRecurse: true
    };
    const queuePostRenderEffect =  queueEffectWithSuspense
        ;
    const setRef = (rawRef, oldRawRef, parentComponent, parentSuspense, vnode) => {
        if (isArray(rawRef)) {
            rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentComponent, parentSuspense, vnode));
            return;
        }
        let value;
        if (!vnode) {
            value = null;
        }
        else {
            if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                value = vnode.component.proxy;
            }
            else {
                value = vnode.el;
            }
        }
        const { i: owner, r: ref } = rawRef;
        const oldRef = oldRawRef && oldRawRef.r;
        const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs;
        const setupState = owner.setupState;
        // unset old ref
        if (oldRef != null && oldRef !== ref) {
            if (isString(oldRef)) {
                refs[oldRef] = null;
                if (hasOwn(setupState, oldRef)) {
                    setupState[oldRef] = null;
                }
            }
            else if (isRef(oldRef)) {
                oldRef.value = null;
            }
        }
        if (isString(ref)) {
            const doSet = () => {
                refs[ref] = value;
                if (hasOwn(setupState, ref)) {
                    setupState[ref] = value;
                }
            };
            // #1789: for non-null values, set them after render
            // null values means this is unmount and it should not overwrite another
            // ref with the same key
            if (value) {
                doSet.id = -1;
                queuePostRenderEffect(doSet, parentSuspense);
            }
            else {
                doSet();
            }
        }
        else if (isRef(ref)) {
            const doSet = () => {
                ref.value = value;
            };
            if (value) {
                doSet.id = -1;
                queuePostRenderEffect(doSet, parentSuspense);
            }
            else {
                doSet();
            }
        }
        else if (isFunction(ref)) {
            callWithErrorHandling(ref, parentComponent, 12 /* FUNCTION_REF */, [
                value,
                refs
            ]);
        }
        else ;
    };
    /**
     * The createRenderer function accepts two generic arguments:
     * HostNode and HostElement, corresponding to Node and Element types in the
     * host environment. For example, for runtime-dom, HostNode would be the DOM
     * `Node` interface and HostElement would be the DOM `Element` interface.
     *
     * Custom renderers can pass in the platform specific types like this:
     *
     * ``` js
     * const { render, createApp } = createRenderer<Node, Element>({
     *   patchProp,
     *   ...nodeOps
     * })
     * ```
     */
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    // implementation
    function baseCreateRenderer(options, createHydrationFns) {
        const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, forcePatchProp: hostForcePatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
        // Note: functions inside this closure should use `const xxx = () => {}`
        // style in order to prevent being inlined by minifiers.
        const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, optimized = false) => {
            // patching & not same type, unmount old tree
            if (n1 && !isSameVNodeType(n1, n2)) {
                anchor = getNextHostNode(n1);
                unmount(n1, parentComponent, parentSuspense, true);
                n1 = null;
            }
            if (n2.patchFlag === -2 /* BAIL */) {
                optimized = false;
                n2.dynamicChildren = null;
            }
            const { type, ref, shapeFlag } = n2;
            switch (type) {
                case Text:
                    processText(n1, n2, container, anchor);
                    break;
                case Comment:
                    processCommentNode(n1, n2, container, anchor);
                    break;
                case Static:
                    if (n1 == null) {
                        mountStaticNode(n2, container, anchor, isSVG);
                    }
                    break;
                case Fragment:
                    processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else if (shapeFlag & 6 /* COMPONENT */) {
                        processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else if (shapeFlag & 64 /* TELEPORT */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
                    }
                    else if ( shapeFlag & 128 /* SUSPENSE */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
                    }
                    else ;
            }
            // set ref
            if (ref != null && parentComponent) {
                setRef(ref, n1 && n1.ref, parentComponent, parentSuspense, n2);
            }
        };
        const processText = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
            }
            else {
                const el = (n2.el = n1.el);
                if (n2.children !== n1.children) {
                    hostSetText(el, n2.children);
                }
            }
        };
        const processCommentNode = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateComment(n2.children || '')), container, anchor);
            }
            else {
                // there's no support for dynamic comments
                n2.el = n1.el;
            }
        };
        const mountStaticNode = (n2, container, anchor, isSVG) => {
            [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
        };
        const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            isSVG = isSVG || n2.type === 'svg';
            if (n1 == null) {
                mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
            }
            else {
                patchElement(n1, n2, parentComponent, parentSuspense, isSVG, optimized);
            }
        };
        const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            let el;
            let vnodeHook;
            const { type, props, shapeFlag, transition, scopeId, patchFlag, dirs } = vnode;
            if (
                vnode.el &&
                hostCloneNode !== undefined &&
                patchFlag === -1 /* HOISTED */) {
                // If a vnode has non-null el, it means it's being reused.
                // Only static vnodes can be reused, so its mounted DOM nodes should be
                // exactly the same, and we can simply do a clone here.
                // only do this in production since cloned trees cannot be HMR updated.
                el = vnode.el = hostCloneNode(vnode.el);
            }
            else {
                el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is);
                // mount children first, since some props may rely on child content
                // being already rendered, e.g. `<select value>`
                if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                    hostSetElementText(el, vnode.children);
                }
                else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', optimized || !!vnode.dynamicChildren);
                }
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'created');
                }
                // props
                if (props) {
                    for (const key in props) {
                        if (!isReservedProp(key)) {
                            hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                    if ((vnodeHook = props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    }
                }
                // scopeId
                setScopeId(el, scopeId, vnode, parentComponent);
            }
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
            }
            // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
            // #1689 For inside suspense + suspense resolved case, just call it
            const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
                transition &&
                !transition.persisted;
            if (needCallTransitionHooks) {
                transition.beforeEnter(el);
            }
            hostInsert(el, container, anchor);
            if ((vnodeHook = props && props.onVnodeMounted) ||
                needCallTransitionHooks ||
                dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    needCallTransitionHooks && transition.enter(el);
                    dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                }, parentSuspense);
            }
        };
        const setScopeId = (el, scopeId, vnode, parentComponent) => {
            if (scopeId) {
                hostSetScopeId(el, scopeId);
            }
            if (parentComponent) {
                const treeOwnerId = parentComponent.type.__scopeId;
                // vnode's own scopeId and the current patched component's scopeId is
                // different - this is a slot content node.
                if (treeOwnerId && treeOwnerId !== scopeId) {
                    hostSetScopeId(el, treeOwnerId + '-s');
                }
                let subTree = parentComponent.subTree;
                if (vnode === subTree) {
                    setScopeId(el, parentComponent.vnode.scopeId, parentComponent.vnode, parentComponent.parent);
                }
            }
        };
        const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, optimized, start = 0) => {
            for (let i = start; i < children.length; i++) {
                const child = (children[i] = optimized
                    ? cloneIfMounted(children[i])
                    : normalizeVNode(children[i]));
                patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
            }
        };
        const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, optimized) => {
            const el = (n2.el = n1.el);
            let { patchFlag, dynamicChildren, dirs } = n2;
            // #1426 take the old vnode's patch flag into account since user may clone a
            // compiler-generated vnode, which de-opts to FULL_PROPS
            patchFlag |= n1.patchFlag & 16 /* FULL_PROPS */;
            const oldProps = n1.props || EMPTY_OBJ;
            const newProps = n2.props || EMPTY_OBJ;
            let vnodeHook;
            if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
                invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
            }
            if (dirs) {
                invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
            }
            if (patchFlag > 0) {
                // the presence of a patchFlag means this element's render code was
                // generated by the compiler and can take the fast path.
                // in this path old node and new node are guaranteed to have the same shape
                // (i.e. at the exact same position in the source template)
                if (patchFlag & 16 /* FULL_PROPS */) {
                    // element props contain dynamic keys, full diff needed
                    patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
                }
                else {
                    // class
                    // this flag is matched when the element has dynamic class bindings.
                    if (patchFlag & 2 /* CLASS */) {
                        if (oldProps.class !== newProps.class) {
                            hostPatchProp(el, 'class', null, newProps.class, isSVG);
                        }
                    }
                    // style
                    // this flag is matched when the element has dynamic style bindings
                    if (patchFlag & 4 /* STYLE */) {
                        hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG);
                    }
                    // props
                    // This flag is matched when the element has dynamic prop/attr bindings
                    // other than class and style. The keys of dynamic prop/attrs are saved for
                    // faster iteration.
                    // Note dynamic keys like :[foo]="bar" will cause this optimization to
                    // bail out and go through a full diff because we need to unset the old key
                    if (patchFlag & 8 /* PROPS */) {
                        // if the flag is present then dynamicProps must be non-null
                        const propsToUpdate = n2.dynamicProps;
                        for (let i = 0; i < propsToUpdate.length; i++) {
                            const key = propsToUpdate[i];
                            const prev = oldProps[key];
                            const next = newProps[key];
                            if (next !== prev ||
                                (hostForcePatchProp && hostForcePatchProp(el, key))) {
                                hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
                            }
                        }
                    }
                }
                // text
                // This flag is matched when the element has only dynamic text children.
                if (patchFlag & 1 /* TEXT */) {
                    if (n1.children !== n2.children) {
                        hostSetElementText(el, n2.children);
                    }
                }
            }
            else if (!optimized && dynamicChildren == null) {
                // unoptimized, full diff
                patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
            }
            const areChildrenSVG = isSVG && n2.type !== 'foreignObject';
            if (dynamicChildren) {
                patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG);
            }
            else if (!optimized) {
                // full diff
                patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG);
            }
            if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
                    dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
                }, parentSuspense);
            }
        };
        // The fast path for blocks.
        const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG) => {
            for (let i = 0; i < newChildren.length; i++) {
                const oldVNode = oldChildren[i];
                const newVNode = newChildren[i];
                // Determine the container (parent element) for the patch.
                const container = 
                // - In the case of a Fragment, we need to provide the actual parent
                // of the Fragment itself so it can move its children.
                oldVNode.type === Fragment ||
                    // - In the case of different nodes, there is going to be a replacement
                    // which also requires the correct parent container
                    !isSameVNodeType(oldVNode, newVNode) ||
                    // - In the case of a component, it could contain anything.
                    oldVNode.shapeFlag & 6 /* COMPONENT */ ||
                    oldVNode.shapeFlag & 64 /* TELEPORT */
                    ? hostParentNode(oldVNode.el)
                    : // In other cases, the parent container is not actually used so we
                        // just pass the block element here to avoid a DOM parentNode call.
                        fallbackContainer;
                patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, true);
            }
        };
        const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
            if (oldProps !== newProps) {
                for (const key in newProps) {
                    if (isReservedProp(key))
                        continue;
                    const next = newProps[key];
                    const prev = oldProps[key];
                    if (next !== prev ||
                        (hostForcePatchProp && hostForcePatchProp(el, key))) {
                        hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                    }
                }
                if (oldProps !== EMPTY_OBJ) {
                    for (const key in oldProps) {
                        if (!isReservedProp(key) && !(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                }
            }
        };
        const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
            const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
            let { patchFlag, dynamicChildren } = n2;
            if (patchFlag > 0) {
                optimized = true;
            }
            if (n1 == null) {
                hostInsert(fragmentStartAnchor, container, anchor);
                hostInsert(fragmentEndAnchor, container, anchor);
                // a fragment can only have array children
                // since they are either generated by the compiler, or implicitly created
                // from arrays.
                mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
            }
            else {
                if (patchFlag > 0 &&
                    patchFlag & 64 /* STABLE_FRAGMENT */ &&
                    dynamicChildren) {
                    // a stable fragment (template root or <template v-for>) doesn't need to
                    // patch children order, but it may contain dynamicChildren.
                    patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG);
                    if (
                    // #2080 if the stable fragment has a key, it's a <template v-for> that may
                    //  get moved around. Make sure all root level vnodes inherit el.
                    // #2134 or if it's a component root, it may also get moved around
                    // as the component is being moved.
                    n2.key != null ||
                        (parentComponent && n2 === parentComponent.subTree)) {
                        traverseStaticChildren(n1, n2, true /* shallow */);
                    }
                }
                else {
                    // keyed / unkeyed, or manual fragments.
                    // for keyed & unkeyed, since they are compiler generated from v-for,
                    // each child is guaranteed to be a block so the fragment will never
                    // have dynamicChildren.
                    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
                }
            }
        };
        const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            if (n1 == null) {
                if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
                    parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
                }
                else {
                    mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                }
            }
            else {
                updateComponent(n1, n2, optimized);
            }
        };
        const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
            // inject renderer internals for keepAlive
            if (isKeepAlive(initialVNode)) {
                instance.ctx.renderer = internals;
            }
            setupComponent(instance);
            // setup() is async. This component relies on async logic to be resolved
            // before proceeding
            if ( instance.asyncDep) {
                parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
                // Give it a placeholder if this is not hydration
                // TODO handle self-defined fallback
                if (!initialVNode.el) {
                    const placeholder = (instance.subTree = createVNode(Comment));
                    processCommentNode(null, placeholder, container, anchor);
                }
                return;
            }
            setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
        };
        const updateComponent = (n1, n2, optimized) => {
            const instance = (n2.component = n1.component);
            if (shouldUpdateComponent(n1, n2, optimized)) {
                if (
                    instance.asyncDep &&
                    !instance.asyncResolved) {
                    updateComponentPreRender(instance, n2, optimized);
                    return;
                }
                else {
                    // normal update
                    instance.next = n2;
                    // in case the child component is also queued, remove it to avoid
                    // double updating the same child component in the same flush.
                    invalidateJob(instance.update);
                    // instance.update is the reactive effect runner.
                    instance.update();
                }
            }
            else {
                // no update needed. just copy over properties
                n2.component = n1.component;
                n2.el = n1.el;
                instance.vnode = n2;
            }
        };
        const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
            // create reactive effect for rendering
            instance.update = effect(function componentEffect() {
                if (!instance.isMounted) {
                    let vnodeHook;
                    const { el, props } = initialVNode;
                    const { bm, m, parent } = instance;
                    // beforeMount hook
                    if (bm) {
                        invokeArrayFns(bm);
                    }
                    // onVnodeBeforeMount
                    if ((vnodeHook = props && props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parent, initialVNode);
                    }
                    const subTree = (instance.subTree = renderComponentRoot(instance));
                    if (el && hydrateNode) {
                        // vnode has adopted host node - perform hydration instead of mount.
                        hydrateNode(initialVNode.el, subTree, instance, parentSuspense);
                    }
                    else {
                        patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                        initialVNode.el = subTree.el;
                    }
                    // mounted hook
                    if (m) {
                        queuePostRenderEffect(m, parentSuspense);
                    }
                    // onVnodeMounted
                    if ((vnodeHook = props && props.onVnodeMounted)) {
                        queuePostRenderEffect(() => {
                            invokeVNodeHook(vnodeHook, parent, initialVNode);
                        }, parentSuspense);
                    }
                    // activated hook for keep-alive roots.
                    // #1742 activated hook must be accessed after first render
                    // since the hook may be injected by a child keep-alive
                    const { a } = instance;
                    if (a &&
                        initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                        queuePostRenderEffect(a, parentSuspense);
                    }
                    instance.isMounted = true;
                }
                else {
                    // updateComponent
                    // This is triggered by mutation of component's own state (next: null)
                    // OR parent calling processComponent (next: VNode)
                    let { next, bu, u, parent, vnode } = instance;
                    let originNext = next;
                    let vnodeHook;
                    if (next) {
                        updateComponentPreRender(instance, next, optimized);
                    }
                    else {
                        next = vnode;
                    }
                    next.el = vnode.el;
                    // beforeUpdate hook
                    if (bu) {
                        invokeArrayFns(bu);
                    }
                    // onVnodeBeforeUpdate
                    if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                        invokeVNodeHook(vnodeHook, parent, next, vnode);
                    }
                    const nextTree = renderComponentRoot(instance);
                    const prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    // reset refs
                    // only needed if previous patch had refs
                    if (instance.refs !== EMPTY_OBJ) {
                        instance.refs = {};
                    }
                    patch(prevTree, nextTree, 
                    // parent may have changed if it's in a teleport
                    hostParentNode(prevTree.el), 
                    // anchor may have changed if it's in a fragment
                    getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                    next.el = nextTree.el;
                    if (originNext === null) {
                        // self-triggered update. In case of HOC, update parent component
                        // vnode el. HOC is indicated by parent instance's subTree pointing
                        // to child component's vnode
                        updateHOCHostEl(instance, nextTree.el);
                    }
                    // updated hook
                    if (u) {
                        queuePostRenderEffect(u, parentSuspense);
                    }
                    // onVnodeUpdated
                    if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
                        queuePostRenderEffect(() => {
                            invokeVNodeHook(vnodeHook, parent, next, vnode);
                        }, parentSuspense);
                    }
                }
            },  prodEffectOptions);
        };
        const updateComponentPreRender = (instance, nextVNode, optimized) => {
            nextVNode.component = instance;
            const prevProps = instance.vnode.props;
            instance.vnode = nextVNode;
            instance.next = null;
            updateProps(instance, nextVNode.props, prevProps, optimized);
            updateSlots(instance, nextVNode.children);
            // props update may have triggered pre-flush watchers.
            // flush them before the render update.
            flushPreFlushCbs(undefined, instance.update);
        };
        const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized = false) => {
            const c1 = n1 && n1.children;
            const prevShapeFlag = n1 ? n1.shapeFlag : 0;
            const c2 = n2.children;
            const { patchFlag, shapeFlag } = n2;
            // fast path
            if (patchFlag > 0) {
                if (patchFlag & 128 /* KEYED_FRAGMENT */) {
                    // this could be either fully-keyed or mixed (some keyed some not)
                    // presence of patchFlag means children are guaranteed to be arrays
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    return;
                }
                else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
                    // unkeyed
                    patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    return;
                }
            }
            // children has 3 possibilities: text, array or no children.
            if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                // text children fast path
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    unmountChildren(c1, parentComponent, parentSuspense);
                }
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    // prev children was array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        // two arrays, cannot assume anything, do full diff
                        patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else {
                        // no new children, just unmount old
                        unmountChildren(c1, parentComponent, parentSuspense, true);
                    }
                }
                else {
                    // prev children was text OR null
                    // new children is array OR null
                    if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                        hostSetElementText(container, '');
                    }
                    // mount new if array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                }
            }
        };
        const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            c1 = c1 || EMPTY_ARR;
            c2 = c2 || EMPTY_ARR;
            const oldLength = c1.length;
            const newLength = c2.length;
            const commonLength = Math.min(oldLength, newLength);
            let i;
            for (i = 0; i < commonLength; i++) {
                const nextChild = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, optimized);
            }
            if (oldLength > newLength) {
                // remove old
                unmountChildren(c1, parentComponent, parentSuspense, true, commonLength);
            }
            else {
                // mount new
                mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, commonLength);
            }
        };
        // can be all-keyed or mixed
        const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, optimized) => {
            let i = 0;
            const l2 = c2.length;
            let e1 = c1.length - 1; // prev ending index
            let e2 = l2 - 1; // next ending index
            // 1. sync from start
            // (a b) c
            // (a b) d e
            while (i <= e1 && i <= e2) {
                const n1 = c1[i];
                const n2 = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
                }
                else {
                    break;
                }
                i++;
            }
            // 2. sync from end
            // a (b c)
            // d e (b c)
            while (i <= e1 && i <= e2) {
                const n1 = c1[e1];
                const n2 = (c2[e2] = optimized
                    ? cloneIfMounted(c2[e2])
                    : normalizeVNode(c2[e2]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
                }
                else {
                    break;
                }
                e1--;
                e2--;
            }
            // 3. common sequence + mount
            // (a b)
            // (a b) c
            // i = 2, e1 = 1, e2 = 2
            // (a b)
            // c (a b)
            // i = 0, e1 = -1, e2 = 0
            if (i > e1) {
                if (i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                    while (i <= e2) {
                        patch(null, (c2[i] = optimized
                            ? cloneIfMounted(c2[i])
                            : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG);
                        i++;
                    }
                }
            }
            // 4. common sequence + unmount
            // (a b) c
            // (a b)
            // i = 2, e1 = 2, e2 = 1
            // a (b c)
            // (b c)
            // i = 0, e1 = 0, e2 = -1
            else if (i > e2) {
                while (i <= e1) {
                    unmount(c1[i], parentComponent, parentSuspense, true);
                    i++;
                }
            }
            // 5. unknown sequence
            // [i ... e1 + 1]: a b [c d e] f g
            // [i ... e2 + 1]: a b [e d c h] f g
            // i = 2, e1 = 4, e2 = 5
            else {
                const s1 = i; // prev starting index
                const s2 = i; // next starting index
                // 5.1 build key:index map for newChildren
                const keyToNewIndexMap = new Map();
                for (i = s2; i <= e2; i++) {
                    const nextChild = (c2[i] = optimized
                        ? cloneIfMounted(c2[i])
                        : normalizeVNode(c2[i]));
                    if (nextChild.key != null) {
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2 loop through old children left to be patched and try to patch
                // matching nodes & remove nodes that are no longer present
                let j;
                let patched = 0;
                const toBePatched = e2 - s2 + 1;
                let moved = false;
                // used to track whether any node has moved
                let maxNewIndexSoFar = 0;
                // works as Map<newIndex, oldIndex>
                // Note that oldIndex is offset by +1
                // and oldIndex = 0 is a special value indicating the new node has
                // no corresponding old node.
                // used for determining longest stable subsequence
                const newIndexToOldIndexMap = new Array(toBePatched);
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                for (i = s1; i <= e1; i++) {
                    const prevChild = c1[i];
                    if (patched >= toBePatched) {
                        // all new children have been patched so this can only be a removal
                        unmount(prevChild, parentComponent, parentSuspense, true);
                        continue;
                    }
                    let newIndex;
                    if (prevChild.key != null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        // key-less node, try to locate a key-less node of the same type
                        for (j = s2; j <= e2; j++) {
                            if (newIndexToOldIndexMap[j - s2] === 0 &&
                                isSameVNodeType(prevChild, c2[j])) {
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    if (newIndex === undefined) {
                        unmount(prevChild, parentComponent, parentSuspense, true);
                    }
                    else {
                        newIndexToOldIndexMap[newIndex - s2] = i + 1;
                        if (newIndex >= maxNewIndexSoFar) {
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            moved = true;
                        }
                        patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, optimized);
                        patched++;
                    }
                }
                // 5.3 move and mount
                // generate longest stable subsequence only when nodes have moved
                const increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : EMPTY_ARR;
                j = increasingNewIndexSequence.length - 1;
                // looping backwards so that we can use last patched node as anchor
                for (i = toBePatched - 1; i >= 0; i--) {
                    const nextIndex = s2 + i;
                    const nextChild = c2[nextIndex];
                    const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                    if (newIndexToOldIndexMap[i] === 0) {
                        // mount new
                        patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG);
                    }
                    else if (moved) {
                        // move if:
                        // There is no stable subsequence (e.g. a reverse)
                        // OR current node is not among the stable sequence
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor, 2 /* REORDER */);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
        };
        const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
            const { el, type, transition, children, shapeFlag } = vnode;
            if (shapeFlag & 6 /* COMPONENT */) {
                move(vnode.component.subTree, container, anchor, moveType);
                return;
            }
            if ( shapeFlag & 128 /* SUSPENSE */) {
                vnode.suspense.move(container, anchor, moveType);
                return;
            }
            if (shapeFlag & 64 /* TELEPORT */) {
                type.move(vnode, container, anchor, internals);
                return;
            }
            if (type === Fragment) {
                hostInsert(el, container, anchor);
                for (let i = 0; i < children.length; i++) {
                    move(children[i], container, anchor, moveType);
                }
                hostInsert(vnode.anchor, container, anchor);
                return;
            }
            // single nodes
            const needTransition = moveType !== 2 /* REORDER */ &&
                shapeFlag & 1 /* ELEMENT */ &&
                transition;
            if (needTransition) {
                if (moveType === 0 /* ENTER */) {
                    transition.beforeEnter(el);
                    hostInsert(el, container, anchor);
                    queuePostRenderEffect(() => transition.enter(el), parentSuspense);
                }
                else {
                    const { leave, delayLeave, afterLeave } = transition;
                    const remove = () => hostInsert(el, container, anchor);
                    const performLeave = () => {
                        leave(el, () => {
                            remove();
                            afterLeave && afterLeave();
                        });
                    };
                    if (delayLeave) {
                        delayLeave(el, remove, performLeave);
                    }
                    else {
                        performLeave();
                    }
                }
            }
            else {
                hostInsert(el, container, anchor);
            }
        };
        const unmount = (vnode, parentComponent, parentSuspense, doRemove = false) => {
            const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
            // unset ref
            if (ref != null && parentComponent) {
                setRef(ref, null, parentComponent, parentSuspense, null);
            }
            if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                parentComponent.ctx.deactivate(vnode);
                return;
            }
            const shouldInvokeDirs = shapeFlag & 1 /* ELEMENT */ && dirs;
            let vnodeHook;
            if ((vnodeHook = props && props.onVnodeBeforeUnmount)) {
                invokeVNodeHook(vnodeHook, parentComponent, vnode);
            }
            if (shapeFlag & 6 /* COMPONENT */) {
                unmountComponent(vnode.component, parentSuspense, doRemove);
            }
            else {
                if ( shapeFlag & 128 /* SUSPENSE */) {
                    vnode.suspense.unmount(parentSuspense, doRemove);
                    return;
                }
                if (shouldInvokeDirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount');
                }
                if (dynamicChildren &&
                    // #1153: fast path should not be taken for non-stable (v-for) fragments
                    (type !== Fragment ||
                        (patchFlag > 0 && patchFlag & 64 /* STABLE_FRAGMENT */))) {
                    // fast path for block nodes: only need to unmount dynamic children.
                    unmountChildren(dynamicChildren, parentComponent, parentSuspense);
                }
                else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    unmountChildren(children, parentComponent, parentSuspense);
                }
                // an unmounted teleport should always remove its children
                if (shapeFlag & 64 /* TELEPORT */) {
                    vnode.type.remove(vnode, internals);
                }
                if (doRemove) {
                    remove(vnode);
                }
            }
            if ((vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    shouldInvokeDirs &&
                        invokeDirectiveHook(vnode, null, parentComponent, 'unmounted');
                }, parentSuspense);
            }
        };
        const remove = vnode => {
            const { type, el, anchor, transition } = vnode;
            if (type === Fragment) {
                removeFragment(el, anchor);
                return;
            }
            const performRemove = () => {
                hostRemove(el);
                if (transition && !transition.persisted && transition.afterLeave) {
                    transition.afterLeave();
                }
            };
            if (vnode.shapeFlag & 1 /* ELEMENT */ &&
                transition &&
                !transition.persisted) {
                const { leave, delayLeave } = transition;
                const performLeave = () => leave(el, performRemove);
                if (delayLeave) {
                    delayLeave(vnode.el, performRemove, performLeave);
                }
                else {
                    performLeave();
                }
            }
            else {
                performRemove();
            }
        };
        const removeFragment = (cur, end) => {
            // For fragments, directly remove all contained DOM nodes.
            // (fragment child nodes cannot have transition)
            let next;
            while (cur !== end) {
                next = hostNextSibling(cur);
                hostRemove(cur);
                cur = next;
            }
            hostRemove(end);
        };
        const unmountComponent = (instance, parentSuspense, doRemove) => {
            const { bum, effects, update, subTree, um } = instance;
            // beforeUnmount hook
            if (bum) {
                invokeArrayFns(bum);
            }
            if (effects) {
                for (let i = 0; i < effects.length; i++) {
                    stop(effects[i]);
                }
            }
            // update may be null if a component is unmounted before its async
            // setup has resolved.
            if (update) {
                stop(update);
                unmount(subTree, instance, parentSuspense, doRemove);
            }
            // unmounted hook
            if (um) {
                queuePostRenderEffect(um, parentSuspense);
            }
            queuePostRenderEffect(() => {
                instance.isUnmounted = true;
            }, parentSuspense);
            // A component with async dep inside a pending suspense is unmounted before
            // its async dep resolves. This should remove the dep from the suspense, and
            // cause the suspense to resolve immediately if that was the last dep.
            if (
                parentSuspense &&
                parentSuspense.pendingBranch &&
                !parentSuspense.isUnmounted &&
                instance.asyncDep &&
                !instance.asyncResolved &&
                instance.suspenseId === parentSuspense.pendingId) {
                parentSuspense.deps--;
                if (parentSuspense.deps === 0) {
                    parentSuspense.resolve();
                }
            }
        };
        const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, start = 0) => {
            for (let i = start; i < children.length; i++) {
                unmount(children[i], parentComponent, parentSuspense, doRemove);
            }
        };
        const getNextHostNode = vnode => {
            if (vnode.shapeFlag & 6 /* COMPONENT */) {
                return getNextHostNode(vnode.component.subTree);
            }
            if ( vnode.shapeFlag & 128 /* SUSPENSE */) {
                return vnode.suspense.next();
            }
            return hostNextSibling((vnode.anchor || vnode.el));
        };
        /**
         * #1156
         * When a component is HMR-enabled, we need to make sure that all static nodes
         * inside a block also inherit the DOM element from the previous tree so that
         * HMR updates (which are full updates) can retrieve the element for patching.
         *
         * #2080
         * Inside keyed `template` fragment static children, if a fragment is moved,
         * the children will always moved so that need inherit el form previous nodes
         * to ensure correct moved position.
         */
        const traverseStaticChildren = (n1, n2, shallow = false) => {
            const ch1 = n1.children;
            const ch2 = n2.children;
            if (isArray(ch1) && isArray(ch2)) {
                for (let i = 0; i < ch1.length; i++) {
                    // this is only called in the optimized path so array children are
                    // guaranteed to be vnodes
                    const c1 = ch1[i];
                    const c2 = (ch2[i] = cloneIfMounted(ch2[i]));
                    if (c2.shapeFlag & 1 /* ELEMENT */ && !c2.dynamicChildren) {
                        if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* HYDRATE_EVENTS */) {
                            c2.el = c1.el;
                        }
                        if (!shallow)
                            traverseStaticChildren(c1, c2);
                    }
                }
            }
        };
        const render = (vnode, container) => {
            if (vnode == null) {
                if (container._vnode) {
                    unmount(container._vnode, null, null, true);
                }
            }
            else {
                patch(container._vnode || null, vnode, container);
            }
            flushPostFlushCbs();
            container._vnode = vnode;
        };
        const internals = {
            p: patch,
            um: unmount,
            m: move,
            r: remove,
            mt: mountComponent,
            mc: mountChildren,
            pc: patchChildren,
            pbc: patchBlockChildren,
            n: getNextHostNode,
            o: options
        };
        let hydrate;
        let hydrateNode;
        if (createHydrationFns) {
            [hydrate, hydrateNode] = createHydrationFns(internals);
        }
        return {
            render,
            hydrate,
            createApp: createAppAPI(render, hydrate)
        };
    }
    function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
        callWithAsyncErrorHandling(hook, instance, 7 /* VNODE_HOOK */, [
            vnode,
            prevVNode
        ]);
    }
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = ((u + v) / 2) | 0;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    const publicPropertiesMap = extend(Object.create(null), {
        $: i => i,
        $el: i => i.vnode.el,
        $data: i => i.data,
        $props: i => ( i.props),
        $attrs: i => ( i.attrs),
        $slots: i => ( i.slots),
        $refs: i => ( i.refs),
        $parent: i => i.parent && i.parent.proxy,
        $root: i => i.root && i.root.proxy,
        $emit: i => i.emit,
        $options: i => ( i.type),
        $forceUpdate: i => () => queueJob(i.update),
        $nextTick: () => nextTick,
        $watch: i => ( NOOP)
    });
    const PublicInstanceProxyHandlers = {
        get({ _: instance }, key) {
            const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
            // let @vue/reactivity know it should never observe Vue public instances.
            if (key === "__v_skip" /* SKIP */) {
                return true;
            }
            // data / props / ctx
            // This getter gets called for every property access on the render context
            // during render and is a major hotspot. The most expensive part of this
            // is the multiple hasOwn() calls. It's much faster to do a simple property
            // access on a plain object, so we use an accessCache object (with null
            // prototype) to memoize what access type a key corresponds to.
            let normalizedProps;
            if (key[0] !== '$') {
                const n = accessCache[key];
                if (n !== undefined) {
                    switch (n) {
                        case 0 /* SETUP */:
                            return setupState[key];
                        case 1 /* DATA */:
                            return data[key];
                        case 3 /* CONTEXT */:
                            return ctx[key];
                        case 2 /* PROPS */:
                            return props[key];
                        // default: just fallthrough
                    }
                }
                else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                    accessCache[key] = 0 /* SETUP */;
                    return setupState[key];
                }
                else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                    accessCache[key] = 1 /* DATA */;
                    return data[key];
                }
                else if (
                // only cache other properties when instance has declared (thus stable)
                // props
                (normalizedProps = instance.propsOptions[0]) &&
                    hasOwn(normalizedProps, key)) {
                    accessCache[key] = 2 /* PROPS */;
                    return props[key];
                }
                else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                    accessCache[key] = 3 /* CONTEXT */;
                    return ctx[key];
                }
                else {
                    accessCache[key] = 4 /* OTHER */;
                }
            }
            const publicGetter = publicPropertiesMap[key];
            let cssModule, globalProperties;
            // public $xxx properties
            if (publicGetter) {
                if (key === '$attrs') {
                    track(instance, "get" /* GET */, key);
                }
                return publicGetter(instance);
            }
            else if (
            // css module (injected by vue-loader)
            (cssModule = type.__cssModules) &&
                (cssModule = cssModule[key])) {
                return cssModule;
            }
            else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                // user may set custom properties to `this` that start with `$`
                accessCache[key] = 3 /* CONTEXT */;
                return ctx[key];
            }
            else if (
            // global properties
            ((globalProperties = appContext.config.globalProperties),
                hasOwn(globalProperties, key))) {
                return globalProperties[key];
            }
            else ;
        },
        set({ _: instance }, key, value) {
            const { data, setupState, ctx } = instance;
            if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                setupState[key] = value;
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                data[key] = value;
            }
            else if (key in instance.props) {
                return false;
            }
            if (key[0] === '$' && key.slice(1) in instance) {
                return false;
            }
            else {
                {
                    ctx[key] = value;
                }
            }
            return true;
        },
        has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
            let normalizedProps;
            return (accessCache[key] !== undefined ||
                (data !== EMPTY_OBJ && hasOwn(data, key)) ||
                (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
                ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
                hasOwn(ctx, key) ||
                hasOwn(publicPropertiesMap, key) ||
                hasOwn(appContext.config.globalProperties, key));
        }
    };
    const RuntimeCompiledPublicInstanceProxyHandlers = extend({}, PublicInstanceProxyHandlers, {
        get(target, key) {
            // fast path for unscopables when using `with` block
            if (key === Symbol.unscopables) {
                return;
            }
            return PublicInstanceProxyHandlers.get(target, key, target);
        },
        has(_, key) {
            const has = key[0] !== '_' && !isGloballyWhitelisted(key);
            return has;
        }
    });

    const emptyAppContext = createAppContext();
    let uid$1$1 = 0;
    function createComponentInstance(vnode, parent, suspense) {
        const type = vnode.type;
        // inherit parent app context - or - if root, adopt from root vnode
        const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
        const instance = {
            uid: uid$1$1++,
            vnode,
            type,
            parent,
            appContext,
            root: null,
            next: null,
            subTree: null,
            update: null,
            render: null,
            proxy: null,
            withProxy: null,
            effects: null,
            provides: parent ? parent.provides : Object.create(appContext.provides),
            accessCache: null,
            renderCache: [],
            // local resovled assets
            components: null,
            directives: null,
            // resolved props and emits options
            propsOptions: normalizePropsOptions(type, appContext),
            emitsOptions: normalizeEmitsOptions(type, appContext),
            // emit
            emit: null,
            emitted: null,
            // state
            ctx: EMPTY_OBJ,
            data: EMPTY_OBJ,
            props: EMPTY_OBJ,
            attrs: EMPTY_OBJ,
            slots: EMPTY_OBJ,
            refs: EMPTY_OBJ,
            setupState: EMPTY_OBJ,
            setupContext: null,
            // suspense related
            suspense,
            suspenseId: suspense ? suspense.pendingId : 0,
            asyncDep: null,
            asyncResolved: false,
            // lifecycle hooks
            // not using enums here because it results in computed properties
            isMounted: false,
            isUnmounted: false,
            isDeactivated: false,
            bc: null,
            c: null,
            bm: null,
            m: null,
            bu: null,
            u: null,
            um: null,
            bum: null,
            da: null,
            a: null,
            rtg: null,
            rtc: null,
            ec: null
        };
        {
            instance.ctx = { _: instance };
        }
        instance.root = parent ? parent.root : instance;
        instance.emit = emit.bind(null, instance);
        return instance;
    }
    let currentInstance = null;
    const setCurrentInstance = (instance) => {
        currentInstance = instance;
    };
    function setupComponent(instance, isSSR = false) {
        const { props, children, shapeFlag } = instance.vnode;
        const isStateful = shapeFlag & 4 /* STATEFUL_COMPONENT */;
        initProps(instance, props, isStateful, isSSR);
        initSlots(instance, children);
        const setupResult = isStateful
            ? setupStatefulComponent(instance, isSSR)
            : undefined;
        return setupResult;
    }
    function setupStatefulComponent(instance, isSSR) {
        const Component = instance.type;
        // 0. create render proxy property access cache
        instance.accessCache = {};
        // 1. create public instance / render proxy
        // also mark it raw so it's never observed
        instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
        // 2. call setup()
        const { setup } = Component;
        if (setup) {
            const setupContext = (instance.setupContext =
                setup.length > 1 ? createSetupContext(instance) : null);
            currentInstance = instance;
            pauseTracking();
            const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [ instance.props, setupContext]);
            resetTracking();
            currentInstance = null;
            if (isPromise(setupResult)) {
                if (isSSR) {
                    // return the promise so server-renderer can wait on it
                    return setupResult.then((resolvedResult) => {
                        handleSetupResult(instance, resolvedResult);
                    });
                }
                else {
                    // async setup returned Promise.
                    // bail here and wait for re-entry.
                    instance.asyncDep = setupResult;
                }
            }
            else {
                handleSetupResult(instance, setupResult);
            }
        }
        else {
            finishComponentSetup(instance);
        }
    }
    function handleSetupResult(instance, setupResult, isSSR) {
        if (isFunction(setupResult)) {
            // setup returned an inline render function
            instance.render = setupResult;
        }
        else if (isObject(setupResult)) {
            instance.setupState = proxyRefs(setupResult);
        }
        else ;
        finishComponentSetup(instance);
    }
    function finishComponentSetup(instance, isSSR) {
        const Component = instance.type;
        // template / render function normalization
        if (!instance.render) {
            instance.render = (Component.render || NOOP);
            // for runtime-compiled render functions using `with` blocks, the render
            // proxy used needs a different `has` handler which is more performant and
            // also only allows a whitelist of globals to fallthrough.
            if (instance.render._rc) {
                instance.withProxy = new Proxy(instance.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
            }
        }
    }
    function createSetupContext(instance) {
        {
            return {
                attrs: instance.attrs,
                slots: instance.slots,
                emit: instance.emit
            };
        }
    }
    // record effects created during a component's setup() so that they can be
    // stopped when the component unmounts
    function recordInstanceBoundEffect(effect) {
        if (currentInstance) {
            (currentInstance.effects || (currentInstance.effects = [])).push(effect);
        }
    }
    const classifyRE = /(?:^|[-_])(\w)/g;
    const classify = (str) => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');
    /* istanbul ignore next */
    function formatComponentName(instance, Component, isRoot = false) {
        let name = isFunction(Component)
            ? Component.displayName || Component.name
            : Component.name;
        if (!name && Component.__file) {
            const match = Component.__file.match(/([^/\\]+)\.vue$/);
            if (match) {
                name = match[1];
            }
        }
        if (!name && instance && instance.parent) {
            // try to infer the name based on reverse resolution
            const inferFromRegistry = (registry) => {
                for (const key in registry) {
                    if (registry[key] === Component) {
                        return key;
                    }
                }
            };
            name =
                inferFromRegistry(instance.components ||
                    instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
        }
        return name ? classify(name) : isRoot ? `App` : `Anonymous`;
    }
    function isClassComponent(value) {
        return isFunction(value) && '__vccOpts' in value;
    }

    function computed$1(getterOrOptions) {
        const c = computed(getterOrOptions);
        recordInstanceBoundEffect(c.effect);
        return c;
    }

    // Core API ------------------------------------------------------------------
    const version = "3.0.0";

    const svgNS = 'http://www.w3.org/2000/svg';
    const doc = (typeof document !== 'undefined' ? document : null);
    let tempContainer;
    let tempSVGContainer;
    const nodeOps = {
        insert: (child, parent, anchor) => {
            parent.insertBefore(child, anchor || null);
        },
        remove: child => {
            const parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        createElement: (tag, isSVG, is) => isSVG
            ? doc.createElementNS(svgNS, tag)
            : doc.createElement(tag, is ? { is } : undefined),
        createText: text => doc.createTextNode(text),
        createComment: text => doc.createComment(text),
        setText: (node, text) => {
            node.nodeValue = text;
        },
        setElementText: (el, text) => {
            el.textContent = text;
        },
        parentNode: node => node.parentNode,
        nextSibling: node => node.nextSibling,
        querySelector: selector => doc.querySelector(selector),
        setScopeId(el, id) {
            el.setAttribute(id, '');
        },
        cloneNode(el) {
            return el.cloneNode(true);
        },
        // __UNSAFE__
        // Reason: innerHTML.
        // Static content here can only come from compiled templates.
        // As long as the user only uses trusted templates, this is safe.
        insertStaticContent(content, parent, anchor, isSVG) {
            const temp = isSVG
                ? tempSVGContainer ||
                    (tempSVGContainer = doc.createElementNS(svgNS, 'svg'))
                : tempContainer || (tempContainer = doc.createElement('div'));
            temp.innerHTML = content;
            const first = temp.firstChild;
            let node = first;
            let last = node;
            while (node) {
                last = node;
                nodeOps.insert(node, parent, anchor);
                node = temp.firstChild;
            }
            return [first, last];
        }
    };

    // compiler should normalize class + :class bindings on the same element
    // into a single binding ['staticClass', dynamic]
    function patchClass(el, value, isSVG) {
        if (value == null) {
            value = '';
        }
        if (isSVG) {
            el.setAttribute('class', value);
        }
        else {
            // directly setting className should be faster than setAttribute in theory
            // if this is an element during a transition, take the temporary transition
            // classes into account.
            const transitionClasses = el._vtc;
            if (transitionClasses) {
                value = (value
                    ? [value, ...transitionClasses]
                    : [...transitionClasses]).join(' ');
            }
            el.className = value;
        }
    }

    function patchStyle(el, prev, next) {
        const style = el.style;
        if (!next) {
            el.removeAttribute('style');
        }
        else if (isString(next)) {
            if (prev !== next) {
                style.cssText = next;
            }
        }
        else {
            for (const key in next) {
                setStyle(style, key, next[key]);
            }
            if (prev && !isString(prev)) {
                for (const key in prev) {
                    if (next[key] == null) {
                        setStyle(style, key, '');
                    }
                }
            }
        }
    }
    const importantRE = /\s*!important$/;
    function setStyle(style, name, val) {
        if (isArray(val)) {
            val.forEach(v => setStyle(style, name, v));
        }
        else {
            if (name.startsWith('--')) {
                // custom property definition
                style.setProperty(name, val);
            }
            else {
                const prefixed = autoPrefix(style, name);
                if (importantRE.test(val)) {
                    // !important
                    style.setProperty(hyphenate(prefixed), val.replace(importantRE, ''), 'important');
                }
                else {
                    style[prefixed] = val;
                }
            }
        }
    }
    const prefixes = ['Webkit', 'Moz', 'ms'];
    const prefixCache = {};
    function autoPrefix(style, rawName) {
        const cached = prefixCache[rawName];
        if (cached) {
            return cached;
        }
        let name = camelize(rawName);
        if (name !== 'filter' && name in style) {
            return (prefixCache[rawName] = name);
        }
        name = capitalize(name);
        for (let i = 0; i < prefixes.length; i++) {
            const prefixed = prefixes[i] + name;
            if (prefixed in style) {
                return (prefixCache[rawName] = prefixed);
            }
        }
        return rawName;
    }

    const xlinkNS = 'http://www.w3.org/1999/xlink';
    function patchAttr(el, key, value, isSVG) {
        if (isSVG && key.startsWith('xlink:')) {
            if (value == null) {
                el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
            }
            else {
                el.setAttributeNS(xlinkNS, key, value);
            }
        }
        else {
            // note we are only checking boolean attributes that don't have a
            // corresponding dom prop of the same name here.
            const isBoolean = isSpecialBooleanAttr(key);
            if (value == null || (isBoolean && value === false)) {
                el.removeAttribute(key);
            }
            else {
                el.setAttribute(key, isBoolean ? '' : value);
            }
        }
    }

    // __UNSAFE__
    // functions. The user is responsible for using them with only trusted content.
    function patchDOMProp(el, key, value, 
    // the following args are passed only due to potential innerHTML/textContent
    // overriding existing VNodes, in which case the old tree must be properly
    // unmounted.
    prevChildren, parentComponent, parentSuspense, unmountChildren) {
        if (key === 'innerHTML' || key === 'textContent') {
            if (prevChildren) {
                unmountChildren(prevChildren, parentComponent, parentSuspense);
            }
            el[key] = value == null ? '' : value;
            return;
        }
        if (key === 'value' && el.tagName !== 'PROGRESS') {
            // store value as _value as well since
            // non-string values will be stringified.
            el._value = value;
            const newValue = value == null ? '' : value;
            if (el.value !== newValue) {
                el.value = newValue;
            }
            return;
        }
        if (value === '' && typeof el[key] === 'boolean') {
            // e.g. <select multiple> compiles to { multiple: '' }
            el[key] = true;
        }
        else if (value == null && typeof el[key] === 'string') {
            // e.g. <div :id="null">
            el[key] = '';
            el.removeAttribute(key);
        }
        else {
            // some properties perform value validation and throw
            try {
                el[key] = value;
            }
            catch (e) {
            }
        }
    }

    // Async edge case fix requires storing an event listener's attach timestamp.
    let _getNow = Date.now;
    // Determine what event timestamp the browser is using. Annoyingly, the
    // timestamp can either be hi-res (relative to page load) or low-res
    // (relative to UNIX epoch), so in order to compare time we have to use the
    // same timestamp type when saving the flush timestamp.
    if (typeof document !== 'undefined' &&
        _getNow() > document.createEvent('Event').timeStamp) {
        // if the low-res timestamp which is bigger than the event timestamp
        // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
        // and we need to use the hi-res version for event listeners as well.
        _getNow = () => performance.now();
    }
    // To avoid the overhead of repeatedly calling performance.now(), we cache
    // and use the same timestamp for all event listeners attached in the same tick.
    let cachedNow = 0;
    const p = Promise.resolve();
    const reset = () => {
        cachedNow = 0;
    };
    const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()));
    function addEventListener(el, event, handler, options) {
        el.addEventListener(event, handler, options);
    }
    function removeEventListener(el, event, handler, options) {
        el.removeEventListener(event, handler, options);
    }
    function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
        // vei = vue event invokers
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            // patch
            existingInvoker.value = nextValue;
        }
        else {
            const [name, options] = parseName(rawName);
            if (nextValue) {
                // add
                const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
                addEventListener(el, name, invoker, options);
            }
            else if (existingInvoker) {
                // remove
                removeEventListener(el, name, existingInvoker, options);
                invokers[rawName] = undefined;
            }
        }
    }
    const optionsModifierRE = /(?:Once|Passive|Capture)$/;
    function parseName(name) {
        let options;
        if (optionsModifierRE.test(name)) {
            options = {};
            let m;
            while ((m = name.match(optionsModifierRE))) {
                name = name.slice(0, name.length - m[0].length);
                options[m[0].toLowerCase()] = true;
            }
        }
        return [name.slice(2).toLowerCase(), options];
    }
    function createInvoker(initialValue, instance) {
        const invoker = (e) => {
            // async edge case #6566: inner click event triggers patch, event handler
            // attached to outer element during patch, and triggered again. This
            // happens because browsers fire microtask ticks between event propagation.
            // the solution is simple: we save the timestamp when a handler is attached,
            // and the handler would only fire if the event passed to it was fired
            // AFTER it was attached.
            const timeStamp = e.timeStamp || _getNow();
            if (timeStamp >= invoker.attached - 1) {
                callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5 /* NATIVE_EVENT_HANDLER */, [e]);
            }
        };
        invoker.value = initialValue;
        invoker.attached = getNow();
        return invoker;
    }
    function patchStopImmediatePropagation(e, value) {
        if (isArray(value)) {
            const originalStop = e.stopImmediatePropagation;
            e.stopImmediatePropagation = () => {
                originalStop.call(e);
                e._stopped = true;
            };
            return value.map(fn => (e) => !e._stopped && fn(e));
        }
        else {
            return value;
        }
    }

    const nativeOnRE = /^on[a-z]/;
    const forcePatchProp = (_, key) => key === 'value';
    const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
        switch (key) {
            // special
            case 'class':
                patchClass(el, nextValue, isSVG);
                break;
            case 'style':
                patchStyle(el, prevValue, nextValue);
                break;
            default:
                if (isOn(key)) {
                    // ignore v-model listeners
                    if (!isModelListener(key)) {
                        patchEvent(el, key, prevValue, nextValue, parentComponent);
                    }
                }
                else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
                    patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
                }
                else {
                    // special case for <input v-model type="checkbox"> with
                    // :true-value & :false-value
                    // store value as dom properties since non-string values will be
                    // stringified.
                    if (key === 'true-value') {
                        el._trueValue = nextValue;
                    }
                    else if (key === 'false-value') {
                        el._falseValue = nextValue;
                    }
                    patchAttr(el, key, nextValue, isSVG);
                }
                break;
        }
    };
    function shouldSetAsProp(el, key, value, isSVG) {
        if (isSVG) {
            // most keys must be set as attribute on svg elements to work
            // ...except innerHTML
            if (key === 'innerHTML') {
                return true;
            }
            // or native onclick with function values
            if (key in el && nativeOnRE.test(key) && isFunction(value)) {
                return true;
            }
            return false;
        }
        // spellcheck and draggable are numerated attrs, however their
        // corresponding DOM properties are actually booleans - this leads to
        // setting it with a string "false" value leading it to be coerced to
        // `true`, so we need to always treat them as attributes.
        // Note that `contentEditable` doesn't have this problem: its DOM
        // property is also enumerated string values.
        if (key === 'spellcheck' || key === 'draggable') {
            return false;
        }
        // #1787 form as an attribute must be a string, while it accepts an Element as
        // a prop
        if (key === 'form' && typeof value === 'string') {
            return false;
        }
        // #1526 <input list> must be set as attribute
        if (key === 'list' && el.tagName === 'INPUT') {
            return false;
        }
        // native onclick with string value, must be set as attribute
        if (nativeOnRE.test(key) && isString(value)) {
            return false;
        }
        return key in el;
    }

    const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps);
    // lazy create the renderer - this makes core renderer logic tree-shakable
    // in case the user only imports reactivity utilities from Vue.
    let renderer;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    const createApp = ((...args) => {
        const app = ensureRenderer().createApp(...args);
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (!container)
                return;
            const component = app._component;
            if (!isFunction(component) && !component.render && !component.template) {
                component.template = container.innerHTML;
            }
            // clear content before mounting
            container.innerHTML = '';
            const proxy = mount(container);
            container.removeAttribute('v-cloak');
            container.setAttribute('data-v-app', '');
            return proxy;
        };
        return app;
    });
    function normalizeContainer(container) {
        if (isString(container)) {
            const res = document.querySelector(container);
            return res;
        }
        return container;
    }

    // import { useGlobalSettings } from '../../global-settings';

    var script = {
      name: 'VButton',
      props: {
        type: {
          type: String,
          default: 'button'
        },
        size: String,
        label: String,
        rounded: Boolean,
        loading: Boolean,
        outlined: Boolean,
        expanded: Boolean,
        inverted: Boolean,
        focused: Boolean,
        active: Boolean,
        hovered: Boolean,
        selected: Boolean,
        nativeType: {
          type: String,
          default: 'button'
        },
        tag: {
          type: String,
          default: 'button'
        },
        light: Boolean
      },
      setup(props, { attrs }) {
      /*
      const settings = useGlobalSettings()
      const computedRounded = computed(() => props.rounded === null && settings ? settings.button.rounded : props.rounded)
      */
        const computedTag = computed$1(() => attrs.disabled ? 'button' : props.tag);
        const rootClasses = computed$1(() => {
          return [
            props.size,
            props.type,
            {
              'is-rounded': props.rounded,
              'is-loading': props.loading,
              'is-outlined': props.outlined,
              'is-fullwidth': props.expanded,
              'is-inverted': props.inverted,
              'is-focused': props.focused,
              'is-active': props.active,
              'is-hovered': props.hovered,
              'is-selected': props.selected,
              'is-light': props.light
            }
          ]
        });
        return { computedTag, rootClasses }
      }
    };

    const _hoisted_1 = { key: 0 };

    function render(_ctx, _cache, $props, $setup, $data, $options) {
      return (openBlock(), createBlock(resolveDynamicComponent($setup.computedTag), {
        class: ["button", $setup.rootClasses],
        type: $props.nativeType
      }, {
        default: withCtx(() => [
          ($props.label)
            ? (openBlock(), createBlock("span", _hoisted_1, toDisplayString($props.label), 1))
            : createCommentVNode("", true),
          renderSlot(_ctx.$slots, "default")
        ]),
        _: 3
      }, 8, ["type", "class"]))
    }

    script.render = render;

    var script$1 = {
      name: 'DevShowcaseButton',
      components: {
        VButton: script
      }
    };

    const _hoisted_1$1 = { class: "buttons" };
    const _hoisted_2 = /*#__PURE__*/createTextVNode(" Primary ");
    const _hoisted_3 = /*#__PURE__*/createTextVNode(" Success ");
    const _hoisted_4 = /*#__PURE__*/createTextVNode(" Danger ");
    const _hoisted_5 = /*#__PURE__*/createTextVNode(" Warning ");
    const _hoisted_6 = /*#__PURE__*/createTextVNode(" Info ");
    const _hoisted_7 = /*#__PURE__*/createTextVNode(" Link ");
    const _hoisted_8 = /*#__PURE__*/createTextVNode(" Light ");
    const _hoisted_9 = /*#__PURE__*/createTextVNode(" Dark ");
    const _hoisted_10 = /*#__PURE__*/createTextVNode(" Text ");
    const _hoisted_11 = { class: "buttons" };
    const _hoisted_12 = /*#__PURE__*/createTextVNode(" Disabled ");
    const _hoisted_13 = /*#__PURE__*/createTextVNode(" Loading ");
    const _hoisted_14 = /*#__PURE__*/createTextVNode(" Rounded ");
    const _hoisted_15 = { class: "buttons" };
    const _hoisted_16 = /*#__PURE__*/createTextVNode(" Outlined ");
    const _hoisted_17 = /*#__PURE__*/createTextVNode(" Outlined ");
    const _hoisted_18 = /*#__PURE__*/createTextVNode(" Outlined ");
    const _hoisted_19 = /*#__PURE__*/createTextVNode(" Outlined ");
    const _hoisted_20 = { class: "buttons" };
    const _hoisted_21 = /*#__PURE__*/createTextVNode(" Expanded ");
    const _hoisted_22 = { class: "notification is-primary" };
    const _hoisted_23 = { class: "buttons" };
    const _hoisted_24 = /*#__PURE__*/createTextVNode(" Inverted ");
    const _hoisted_25 = /*#__PURE__*/createTextVNode(" Invert Outlined ");
    const _hoisted_26 = { class: "buttons" };
    const _hoisted_27 = /*#__PURE__*/createTextVNode(" Small ");
    const _hoisted_28 = /*#__PURE__*/createTextVNode("Default");
    const _hoisted_29 = /*#__PURE__*/createTextVNode(" Medium ");
    const _hoisted_30 = /*#__PURE__*/createTextVNode(" Large ");

    function render$1(_ctx, _cache, $props, $setup, $data, $options) {
      const _component_v_button = resolveComponent("v-button");

      return (openBlock(), createBlock("section", null, [
        createVNode("div", _hoisted_1$1, [
          createVNode(_component_v_button, { type: "is-primary" }, {
            default: withCtx(() => [
              _hoisted_2
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-success" }, {
            default: withCtx(() => [
              _hoisted_3
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-danger" }, {
            default: withCtx(() => [
              _hoisted_4
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-warning" }, {
            default: withCtx(() => [
              _hoisted_5
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-info" }, {
            default: withCtx(() => [
              _hoisted_6
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-link" }, {
            default: withCtx(() => [
              _hoisted_7
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-light" }, {
            default: withCtx(() => [
              _hoisted_8
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-dark" }, {
            default: withCtx(() => [
              _hoisted_9
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { type: "is-text" }, {
            default: withCtx(() => [
              _hoisted_10
            ]),
            _: 1
          })
        ]),
        createVNode("div", _hoisted_11, [
          createVNode(_component_v_button, { disabled: "" }, {
            default: withCtx(() => [
              _hoisted_12
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { loading: "" }, {
            default: withCtx(() => [
              _hoisted_13
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { rounded: "" }, {
            default: withCtx(() => [
              _hoisted_14
            ]),
            _: 1
          })
        ]),
        createVNode("div", _hoisted_15, [
          createVNode(_component_v_button, {
            type: "is-primary",
            outlined: ""
          }, {
            default: withCtx(() => [
              _hoisted_16
            ]),
            _: 1
          }),
          createVNode(_component_v_button, {
            type: "is-success",
            outlined: ""
          }, {
            default: withCtx(() => [
              _hoisted_17
            ]),
            _: 1
          }),
          createVNode(_component_v_button, {
            type: "is-danger",
            outlined: ""
          }, {
            default: withCtx(() => [
              _hoisted_18
            ]),
            _: 1
          }),
          createVNode(_component_v_button, {
            type: "is-warning",
            outlined: ""
          }, {
            default: withCtx(() => [
              _hoisted_19
            ]),
            _: 1
          })
        ]),
        createVNode("div", _hoisted_20, [
          createVNode(_component_v_button, {
            type: "is-primary",
            expanded: ""
          }, {
            default: withCtx(() => [
              _hoisted_21
            ]),
            _: 1
          })
        ]),
        createVNode("div", _hoisted_22, [
          createVNode("div", _hoisted_23, [
            createVNode(_component_v_button, {
              type: "is-primary",
              inverted: ""
            }, {
              default: withCtx(() => [
                _hoisted_24
              ]),
              _: 1
            }),
            createVNode(_component_v_button, {
              type: "is-primary",
              inverted: "",
              outlined: ""
            }, {
              default: withCtx(() => [
                _hoisted_25
              ]),
              _: 1
            })
          ])
        ]),
        createVNode("div", _hoisted_26, [
          createVNode(_component_v_button, { size: "is-small" }, {
            default: withCtx(() => [
              _hoisted_27
            ]),
            _: 1
          }),
          createVNode(_component_v_button, null, {
            default: withCtx(() => [
              _hoisted_28
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { size: "is-medium" }, {
            default: withCtx(() => [
              _hoisted_29
            ]),
            _: 1
          }),
          createVNode(_component_v_button, { size: "is-large" }, {
            default: withCtx(() => [
              _hoisted_30
            ]),
            _: 1
          })
        ])
      ]))
    }

    script$1.render = render$1;

    var script$2 = {
      name: 'App',
      components: {
        HelloWorld: script$1
      }
    };

    const _hoisted_1$2 = { id: "app" };

    function render$2(_ctx, _cache, $props, $setup, $data, $options) {
      const _component_hello_world = resolveComponent("hello-world");

      return (openBlock(), createBlock("div", _hoisted_1$2, [
        createVNode(_component_hello_world, { msg: "Welcome to Your Vue.js App" })
      ]))
    }

    var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

    var css = "\n#app {\n  font-family: Avenir, Helvetica, Arial, sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  text-align: center;\n  color: #2c3e50;\n  margin-top: 60px;\n}\n";
    n(css,{});

    script$2.render = render$2;

    var css$1 = "/*! bulma.io v0.9.0 | MIT License | github.com/jgthms/bulma */\n@-webkit-keyframes spinAround {\n  to {\n    transform: rotate(359deg);\n  }\n}\n@keyframes spinAround {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(359deg);\n  }\n}\n\n.button {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  align-items: center;\n  border: var(--blm-ctrl-bd-width) solid transparent;\n  border-radius: var(--blm-ctrl-radius);\n  box-shadow: none;\n  display: inline-flex;\n  font-size: var(--blm-s-normal);\n  height: var(--blm-ctrl-height);\n  justify-content: flex-start;\n  line-height: var(--blm-ctrl-line-height);\n  padding: var(--blm-ctrl-p-vertical) var(--blm-ctrl-p-horizontal);\n  position: relative;\n  vertical-align: top;\n}\n\n.button:focus, .is-focused.button, .is-focused.input, .is-focused.textarea, .is-focused.file-cta,\n.is-focused.file-name, .is-focused.pagination-previous,\n.is-focused.pagination-next,\n.is-focused.pagination-link,\n.is-focused.pagination-ellipsis, .button:active, .is-active.button, .is-active.input, .is-active.textarea, .is-active.file-cta,\n.is-active.file-name, .is-active.pagination-previous,\n.is-active.pagination-next,\n.is-active.pagination-link,\n.is-active.pagination-ellipsis {\n  outline: none;\n}\n\n.button[disabled] {\n  cursor: not-allowed;\n}\n\n .button {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n .notification:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.is-small.delete, .is-small.modal-close {\n  height: 16px;\n  max-height: 16px;\n  max-width: 16px;\n  min-height: 16px;\n  min-width: 16px;\n  width: 16px;\n}\n\n.is-medium.delete, .is-medium.modal-close {\n  height: 24px;\n  max-height: 24px;\n  max-width: 24px;\n  min-height: 24px;\n  min-width: 24px;\n  width: 24px;\n}\n\n.is-large.delete, .is-large.modal-close {\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\n\n.button.is-loading::after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid var(--blm-grey-lighter);\n  border-radius: var(--blm-radius-rounded);\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n}\n\n/*! minireset.css v0.0.6 | MIT License | github.com/jgthms/minireset.css */\nhtml,\nbody {\n  margin: 0;\n  padding: 0;\n}\n\nbutton {\n  margin: 0;\n}\n\nhtml {\n  box-sizing: border-box;\n}\n\n*, *::before, *::after {\n  box-sizing: inherit;\n}\n\nhtml {\n  background-color: var(--blm-sch-main);\n  font-size: 16px;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  min-width: 300px;\n  overflow-x: hidden;\n  overflow-y: scroll;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n     -moz-text-size-adjust: 100%;\n      -ms-text-size-adjust: 100%;\n          text-size-adjust: 100%;\n}\n\n\nsection {\n  display: block;\n}\n\nbody,\nbutton {\n  font-family: var(--blm-family-prim);\n}\n\nbody {\n  color: var(--blm-txt);\n  font-size: 1em;\n  font-weight: var(--blm-weight-normal);\n  line-height: 1.5;\n}\n\nspan {\n  font-style: inherit;\n  font-weight: inherit;\n}\n\n.button {\n  background-color: var(--blm-bt-bg-clr);\n  border-color: var(--blm-bt-bd-clr);\n  border-width: var(--blm-bt-bd-width);\n  color: var(--blm-bt-clr);\n  cursor: pointer;\n  font-family: var(--blm-bt-family);\n  justify-content: center;\n  padding: var(--blm-bt-p-vertical) var(--blm-bt-p-horizontal);\n  text-align: center;\n  white-space: nowrap;\n}\n\n.button strong {\n  color: inherit;\n}\n\n.button .icon, .button .icon.is-small, .button .icon.is-medium, .button .icon.is-large {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.button .icon:first-child:not(:last-child) {\n  margin-left: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n  margin-right: calc(var(--blm-bt-p-horizontal)/4);\n}\n\n.button .icon:last-child:not(:first-child) {\n  margin-left: calc(var(--blm-bt-p-horizontal)/4);\n  margin-right: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n}\n\n.button .icon:first-child:last-child {\n  margin-left: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n  margin-right: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n}\n\n.button:hover, .button.is-hovered {\n  border-color: var(--blm-bt-hov-bd-clr);\n  color: var(--blm-bt-hov-clr);\n}\n\n.button:focus, .button.is-focused {\n  border-color: var(--blm-bt-foc-bd-clr);\n  color: var(--blm-bt-foc-clr);\n}\n\n.button:focus:not(:active), .button.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) var(--blm-bt-foc-box-shadow-clr);\n}\n\n.button:active, .button.is-active {\n  border-color: var(--blm-bt-act-bd-clr);\n  color: var(--blm-bt-act-clr);\n}\n\n.button.is-text {\n  background-color: transparent;\n  border-color: transparent;\n  color: var(--blm-bt-txt-clr);\n  -webkit-text-decoration: var(--blm-bt-txt-decoration);\n          text-decoration: var(--blm-bt-txt-decoration);\n}\n\n.button.is-text:hover, .button.is-text.is-hovered, .button.is-text:focus, .button.is-text.is-focused {\n  background-color: var(--blm-bt-txt-hov-bg-clr);\n  color: var(--blm-bt-txt-hov-clr);\n}\n\n.button.is-text:active, .button.is-text.is-active {\n  background-color: hsla(var(--blm-bt-txt-hov-bg-clr-h), var(--blm-bt-txt-hov-bg-clr-s), calc(var(--blm-bt-txt-hov-bg-clr-l) - 5%), var(--blm-bt-txt-hov-bg-clr-a));\n  color: var(--blm-bt-txt-hov-clr);\n}\n\n.button.is-text[disabled] {\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white {\n  background-color: var(--blm-white);\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:hover, .button.is-white.is-hovered {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 2.5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:focus, .button.is-white.is-focused {\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:focus:not(:active), .button.is-white.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), 0.25);\n}\n\n.button.is-white:active, .button.is-white.is-active {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white[disabled] {\n  background-color: var(--blm-white);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white.is-inverted {\n  background-color: var(--blm-white-inv);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted:hover, .button.is-white.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), calc(var(--blm-white-inv-l) - 5%), var(--blm-white-inv-a));\n}\n\n.button.is-white.is-inverted[disabled] {\n  background-color: var(--blm-white-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-white);\n}\n\n.button.is-white.is-loading::after {\n  border-color: transparent transparent var(--blm-white-inv) var(--blm-white-inv) !important;\n}\n\n.button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-outlined:hover, .button.is-white.is-outlined.is-hovered, .button.is-white.is-outlined:focus, .button.is-white.is-outlined.is-focused {\n  background-color: var(--blm-white);\n  border-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.button.is-white.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-white) var(--blm-white) !important;\n}\n\n.button.is-white.is-outlined.is-loading:hover::after, .button.is-white.is-outlined.is-loading.is-hovered::after, .button.is-white.is-outlined.is-loading:focus::after, .button.is-white.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-white-inv) var(--blm-white-inv) !important;\n}\n\n.button.is-white.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-white);\n  box-shadow: none;\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white-inv);\n  color: var(--blm-white-inv);\n}\n\n.button.is-white.is-inverted.is-outlined:hover, .button.is-white.is-inverted.is-outlined.is-hovered, .button.is-white.is-inverted.is-outlined:focus, .button.is-white.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-white-inv);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted.is-outlined.is-loading:hover::after, .button.is-white.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-white.is-inverted.is-outlined.is-loading:focus::after, .button.is-white.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-white) var(--blm-white) !important;\n}\n\n.button.is-white.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-white-inv);\n  box-shadow: none;\n  color: var(--blm-white-inv);\n}\n\n.button.is-black {\n  background-color: var(--blm-black);\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:hover, .button.is-black.is-hovered {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 2.5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:focus, .button.is-black.is-focused {\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:focus:not(:active), .button.is-black.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), 0.25);\n}\n\n.button.is-black:active, .button.is-black.is-active {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black[disabled] {\n  background-color: var(--blm-black);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-black.is-inverted {\n  background-color: var(--blm-black-inv);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted:hover, .button.is-black.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), calc(var(--blm-black-inv-l) - 5%), var(--blm-black-inv-a));\n}\n\n.button.is-black.is-inverted[disabled] {\n  background-color: var(--blm-black-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-black);\n}\n\n.button.is-black.is-loading::after {\n  border-color: transparent transparent var(--blm-black-inv) var(--blm-black-inv) !important;\n}\n\n.button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-outlined:hover, .button.is-black.is-outlined.is-hovered, .button.is-black.is-outlined:focus, .button.is-black.is-outlined.is-focused {\n  background-color: var(--blm-black);\n  border-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.button.is-black.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-black) var(--blm-black) !important;\n}\n\n.button.is-black.is-outlined.is-loading:hover::after, .button.is-black.is-outlined.is-loading.is-hovered::after, .button.is-black.is-outlined.is-loading:focus::after, .button.is-black.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-black-inv) var(--blm-black-inv) !important;\n}\n\n.button.is-black.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-black);\n  box-shadow: none;\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black-inv);\n  color: var(--blm-black-inv);\n}\n\n.button.is-black.is-inverted.is-outlined:hover, .button.is-black.is-inverted.is-outlined.is-hovered, .button.is-black.is-inverted.is-outlined:focus, .button.is-black.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-black-inv);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted.is-outlined.is-loading:hover::after, .button.is-black.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-black.is-inverted.is-outlined.is-loading:focus::after, .button.is-black.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-black) var(--blm-black) !important;\n}\n\n.button.is-black.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-black-inv);\n  box-shadow: none;\n  color: var(--blm-black-inv);\n}\n\n.button.is-light {\n  background-color: var(--blm-light);\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:hover, .button.is-light.is-hovered {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 2.5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:focus, .button.is-light.is-focused {\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:focus:not(:active), .button.is-light.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n}\n\n.button.is-light:active, .button.is-light.is-active {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light[disabled] {\n  background-color: var(--blm-light);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-light.is-inverted {\n  background-color: var(--blm-light-inv);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted:hover, .button.is-light.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), calc(var(--blm-light-inv-l) - 5%), var(--blm-light-inv-a));\n}\n\n.button.is-light.is-inverted[disabled] {\n  background-color: var(--blm-light-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-light);\n}\n\n.button.is-light.is-loading::after {\n  border-color: transparent transparent var(--blm-light-inv) var(--blm-light-inv) !important;\n}\n\n.button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-outlined:hover, .button.is-light.is-outlined.is-hovered, .button.is-light.is-outlined:focus, .button.is-light.is-outlined.is-focused {\n  background-color: var(--blm-light);\n  border-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.button.is-light.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-light) var(--blm-light) !important;\n}\n\n.button.is-light.is-outlined.is-loading:hover::after, .button.is-light.is-outlined.is-loading.is-hovered::after, .button.is-light.is-outlined.is-loading:focus::after, .button.is-light.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-light-inv) var(--blm-light-inv) !important;\n}\n\n.button.is-light.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-light);\n  box-shadow: none;\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light-inv);\n  color: var(--blm-light-inv);\n}\n\n.button.is-light.is-inverted.is-outlined:hover, .button.is-light.is-inverted.is-outlined.is-hovered, .button.is-light.is-inverted.is-outlined:focus, .button.is-light.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-light-inv);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted.is-outlined.is-loading:hover::after, .button.is-light.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-light.is-inverted.is-outlined.is-loading:focus::after, .button.is-light.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-light) var(--blm-light) !important;\n}\n\n.button.is-light.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-light-inv);\n  box-shadow: none;\n  color: var(--blm-light-inv);\n}\n\n.button.is-dark {\n  background-color: var(--blm-dark);\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:hover, .button.is-dark.is-hovered {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 2.5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:focus, .button.is-dark.is-focused {\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:focus:not(:active), .button.is-dark.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n}\n\n.button.is-dark:active, .button.is-dark.is-active {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark[disabled] {\n  background-color: var(--blm-dark);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-dark.is-inverted {\n  background-color: var(--blm-dark-inv);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted:hover, .button.is-dark.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), calc(var(--blm-dark-inv-l) - 5%), var(--blm-dark-inv-a));\n}\n\n.button.is-dark.is-inverted[disabled] {\n  background-color: var(--blm-dark-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-loading::after {\n  border-color: transparent transparent var(--blm-dark-inv) var(--blm-dark-inv) !important;\n}\n\n.button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-outlined:hover, .button.is-dark.is-outlined.is-hovered, .button.is-dark.is-outlined:focus, .button.is-dark.is-outlined.is-focused {\n  background-color: var(--blm-dark);\n  border-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-dark) var(--blm-dark) !important;\n}\n\n.button.is-dark.is-outlined.is-loading:hover::after, .button.is-dark.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-outlined.is-loading:focus::after, .button.is-dark.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dark-inv) var(--blm-dark-inv) !important;\n}\n\n.button.is-dark.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-dark);\n  box-shadow: none;\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark-inv);\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark.is-inverted.is-outlined:hover, .button.is-dark.is-inverted.is-outlined.is-hovered, .button.is-dark.is-inverted.is-outlined:focus, .button.is-dark.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-dark-inv);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted.is-outlined.is-loading:hover::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-inverted.is-outlined.is-loading:focus::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dark) var(--blm-dark) !important;\n}\n\n.button.is-dark.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-dark-inv);\n  box-shadow: none;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-primary {\n  background-color: var(--blm-prim);\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:hover, .button.is-primary.is-hovered {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 2.5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:focus, .button.is-primary.is-focused {\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:focus:not(:active), .button.is-primary.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n}\n\n.button.is-primary:active, .button.is-primary.is-active {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary[disabled] {\n  background-color: var(--blm-prim);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-primary.is-inverted {\n  background-color: var(--blm-prim-inv);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted:hover, .button.is-primary.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), calc(var(--blm-prim-inv-l) - 5%), var(--blm-prim-inv-a));\n}\n\n.button.is-primary.is-inverted[disabled] {\n  background-color: var(--blm-prim-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-loading::after {\n  border-color: transparent transparent var(--blm-prim-inv) var(--blm-prim-inv) !important;\n}\n\n.button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-outlined:hover, .button.is-primary.is-outlined.is-hovered, .button.is-primary.is-outlined:focus, .button.is-primary.is-outlined.is-focused {\n  background-color: var(--blm-prim);\n  border-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-prim) var(--blm-prim) !important;\n}\n\n.button.is-primary.is-outlined.is-loading:hover::after, .button.is-primary.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-outlined.is-loading:focus::after, .button.is-primary.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-prim-inv) var(--blm-prim-inv) !important;\n}\n\n.button.is-primary.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-prim);\n  box-shadow: none;\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim-inv);\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-inverted.is-outlined:hover, .button.is-primary.is-inverted.is-outlined.is-hovered, .button.is-primary.is-inverted.is-outlined:focus, .button.is-primary.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-prim-inv);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted.is-outlined.is-loading:hover::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-inverted.is-outlined.is-loading:focus::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-prim) var(--blm-prim) !important;\n}\n\n.button.is-primary.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-prim-inv);\n  box-shadow: none;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-light {\n  background-color: var(--blm-prim-light);\n  color: var(--blm-prim-dark);\n}\n\n.button.is-primary.is-light:hover, .button.is-primary.is-light.is-hovered {\n  background-color: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), calc(var(--blm-prim-light-l) - 2.5%), var(--blm-prim-light-a));\n  border-color: transparent;\n  color: var(--blm-prim-dark);\n}\n\n.button.is-primary.is-light:active, .button.is-primary.is-light.is-active {\n  background-color: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), calc(var(--blm-prim-light-l) - 5%), var(--blm-prim-light-a));\n  border-color: transparent;\n  color: var(--blm-prim-dark);\n}\n\n.button.is-link {\n  background-color: var(--blm-link);\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:hover, .button.is-link.is-hovered {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 2.5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:focus, .button.is-link.is-focused {\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:focus:not(:active), .button.is-link.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n}\n\n.button.is-link:active, .button.is-link.is-active {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link[disabled] {\n  background-color: var(--blm-link);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-link.is-inverted {\n  background-color: var(--blm-link-inv);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted:hover, .button.is-link.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), calc(var(--blm-link-inv-l) - 5%), var(--blm-link-inv-a));\n}\n\n.button.is-link.is-inverted[disabled] {\n  background-color: var(--blm-link-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-link);\n}\n\n.button.is-link.is-loading::after {\n  border-color: transparent transparent var(--blm-link-inv) var(--blm-link-inv) !important;\n}\n\n.button.is-link.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-outlined:hover, .button.is-link.is-outlined.is-hovered, .button.is-link.is-outlined:focus, .button.is-link.is-outlined.is-focused {\n  background-color: var(--blm-link);\n  border-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-link) var(--blm-link) !important;\n}\n\n.button.is-link.is-outlined.is-loading:hover::after, .button.is-link.is-outlined.is-loading.is-hovered::after, .button.is-link.is-outlined.is-loading:focus::after, .button.is-link.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-link-inv) var(--blm-link-inv) !important;\n}\n\n.button.is-link.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-link);\n  box-shadow: none;\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link-inv);\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-inverted.is-outlined:hover, .button.is-link.is-inverted.is-outlined.is-hovered, .button.is-link.is-inverted.is-outlined:focus, .button.is-link.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-link-inv);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted.is-outlined.is-loading:hover::after, .button.is-link.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-link.is-inverted.is-outlined.is-loading:focus::after, .button.is-link.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-link) var(--blm-link) !important;\n}\n\n.button.is-link.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-link-inv);\n  box-shadow: none;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-light {\n  background-color: var(--blm-link-light);\n  color: var(--blm-link-dark);\n}\n\n.button.is-link.is-light:hover, .button.is-link.is-light.is-hovered {\n  background-color: hsla(var(--blm-link-light-h), var(--blm-link-light-s), calc(var(--blm-link-light-l) - 2.5%), var(--blm-link-light-a));\n  border-color: transparent;\n  color: var(--blm-link-dark);\n}\n\n.button.is-link.is-light:active, .button.is-link.is-light.is-active {\n  background-color: hsla(var(--blm-link-light-h), var(--blm-link-light-s), calc(var(--blm-link-light-l) - 5%), var(--blm-link-light-a));\n  border-color: transparent;\n  color: var(--blm-link-dark);\n}\n\n.button.is-info {\n  background-color: var(--blm-info);\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:hover, .button.is-info.is-hovered {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 2.5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:focus, .button.is-info.is-focused {\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:focus:not(:active), .button.is-info.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n}\n\n.button.is-info:active, .button.is-info.is-active {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info[disabled] {\n  background-color: var(--blm-info);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-info.is-inverted {\n  background-color: var(--blm-info-inv);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted:hover, .button.is-info.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), calc(var(--blm-info-inv-l) - 5%), var(--blm-info-inv-a));\n}\n\n.button.is-info.is-inverted[disabled] {\n  background-color: var(--blm-info-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-info);\n}\n\n.button.is-info.is-loading::after {\n  border-color: transparent transparent var(--blm-info-inv) var(--blm-info-inv) !important;\n}\n\n.button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-outlined:hover, .button.is-info.is-outlined.is-hovered, .button.is-info.is-outlined:focus, .button.is-info.is-outlined.is-focused {\n  background-color: var(--blm-info);\n  border-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-info) var(--blm-info) !important;\n}\n\n.button.is-info.is-outlined.is-loading:hover::after, .button.is-info.is-outlined.is-loading.is-hovered::after, .button.is-info.is-outlined.is-loading:focus::after, .button.is-info.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-info-inv) var(--blm-info-inv) !important;\n}\n\n.button.is-info.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-info);\n  box-shadow: none;\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info-inv);\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-inverted.is-outlined:hover, .button.is-info.is-inverted.is-outlined.is-hovered, .button.is-info.is-inverted.is-outlined:focus, .button.is-info.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-info-inv);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted.is-outlined.is-loading:hover::after, .button.is-info.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-info.is-inverted.is-outlined.is-loading:focus::after, .button.is-info.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-info) var(--blm-info) !important;\n}\n\n.button.is-info.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-info-inv);\n  box-shadow: none;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-light {\n  background-color: var(--blm-info-light);\n  color: var(--blm-info-dark);\n}\n\n.button.is-info.is-light:hover, .button.is-info.is-light.is-hovered {\n  background-color: hsla(var(--blm-info-light-h), var(--blm-info-light-s), calc(var(--blm-info-light-l) - 2.5%), var(--blm-info-light-a));\n  border-color: transparent;\n  color: var(--blm-info-dark);\n}\n\n.button.is-info.is-light:active, .button.is-info.is-light.is-active {\n  background-color: hsla(var(--blm-info-light-h), var(--blm-info-light-s), calc(var(--blm-info-light-l) - 5%), var(--blm-info-light-a));\n  border-color: transparent;\n  color: var(--blm-info-dark);\n}\n\n.button.is-success {\n  background-color: var(--blm-sucs);\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:hover, .button.is-success.is-hovered {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 2.5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:focus, .button.is-success.is-focused {\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:focus:not(:active), .button.is-success.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n}\n\n.button.is-success:active, .button.is-success.is-active {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success[disabled] {\n  background-color: var(--blm-sucs);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-success.is-inverted {\n  background-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted:hover, .button.is-success.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), calc(var(--blm-sucs-inv-l) - 5%), var(--blm-sucs-inv-a));\n}\n\n.button.is-success.is-inverted[disabled] {\n  background-color: var(--blm-sucs-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-loading::after {\n  border-color: transparent transparent var(--blm-sucs-inv) var(--blm-sucs-inv) !important;\n}\n\n.button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-outlined:hover, .button.is-success.is-outlined.is-hovered, .button.is-success.is-outlined:focus, .button.is-success.is-outlined.is-focused {\n  background-color: var(--blm-sucs);\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-sucs) var(--blm-sucs) !important;\n}\n\n.button.is-success.is-outlined.is-loading:hover::after, .button.is-success.is-outlined.is-loading.is-hovered::after, .button.is-success.is-outlined.is-loading:focus::after, .button.is-success.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-sucs-inv) var(--blm-sucs-inv) !important;\n}\n\n.button.is-success.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-sucs);\n  box-shadow: none;\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-inverted.is-outlined:hover, .button.is-success.is-inverted.is-outlined.is-hovered, .button.is-success.is-inverted.is-outlined:focus, .button.is-success.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted.is-outlined.is-loading:hover::after, .button.is-success.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-success.is-inverted.is-outlined.is-loading:focus::after, .button.is-success.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-sucs) var(--blm-sucs) !important;\n}\n\n.button.is-success.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-sucs-inv);\n  box-shadow: none;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-light {\n  background-color: var(--blm-sucs-light);\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-success.is-light:hover, .button.is-success.is-light.is-hovered {\n  background-color: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), calc(var(--blm-sucs-light-l) - 2.5%), var(--blm-sucs-light-a));\n  border-color: transparent;\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-success.is-light:active, .button.is-success.is-light.is-active {\n  background-color: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), calc(var(--blm-sucs-light-l) - 5%), var(--blm-sucs-light-a));\n  border-color: transparent;\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-warning {\n  background-color: var(--blm-warn);\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:hover, .button.is-warning.is-hovered {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 2.5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:focus, .button.is-warning.is-focused {\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:focus:not(:active), .button.is-warning.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n}\n\n.button.is-warning:active, .button.is-warning.is-active {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning[disabled] {\n  background-color: var(--blm-warn);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-warning.is-inverted {\n  background-color: var(--blm-warn-inv);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted:hover, .button.is-warning.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), calc(var(--blm-warn-inv-l) - 5%), var(--blm-warn-inv-a));\n}\n\n.button.is-warning.is-inverted[disabled] {\n  background-color: var(--blm-warn-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-loading::after {\n  border-color: transparent transparent var(--blm-warn-inv) var(--blm-warn-inv) !important;\n}\n\n.button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-outlined:hover, .button.is-warning.is-outlined.is-hovered, .button.is-warning.is-outlined:focus, .button.is-warning.is-outlined.is-focused {\n  background-color: var(--blm-warn);\n  border-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-warn) var(--blm-warn) !important;\n}\n\n.button.is-warning.is-outlined.is-loading:hover::after, .button.is-warning.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-outlined.is-loading:focus::after, .button.is-warning.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-warn-inv) var(--blm-warn-inv) !important;\n}\n\n.button.is-warning.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-warn);\n  box-shadow: none;\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn-inv);\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-inverted.is-outlined:hover, .button.is-warning.is-inverted.is-outlined.is-hovered, .button.is-warning.is-inverted.is-outlined:focus, .button.is-warning.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-warn-inv);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted.is-outlined.is-loading:hover::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-inverted.is-outlined.is-loading:focus::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-warn) var(--blm-warn) !important;\n}\n\n.button.is-warning.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-warn-inv);\n  box-shadow: none;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-light {\n  background-color: var(--blm-warn-light);\n  color: var(--blm-warn-dark);\n}\n\n.button.is-warning.is-light:hover, .button.is-warning.is-light.is-hovered {\n  background-color: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), calc(var(--blm-warn-light-l) - 2.5%), var(--blm-warn-light-a));\n  border-color: transparent;\n  color: var(--blm-warn-dark);\n}\n\n.button.is-warning.is-light:active, .button.is-warning.is-light.is-active {\n  background-color: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), calc(var(--blm-warn-light-l) - 5%), var(--blm-warn-light-a));\n  border-color: transparent;\n  color: var(--blm-warn-dark);\n}\n\n.button.is-danger {\n  background-color: var(--blm-dang);\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:hover, .button.is-danger.is-hovered {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 2.5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:focus, .button.is-danger.is-focused {\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:focus:not(:active), .button.is-danger.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n}\n\n.button.is-danger:active, .button.is-danger.is-active {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger[disabled] {\n  background-color: var(--blm-dang);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-danger.is-inverted {\n  background-color: var(--blm-dang-inv);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted:hover, .button.is-danger.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), calc(var(--blm-dang-inv-l) - 5%), var(--blm-dang-inv-a));\n}\n\n.button.is-danger.is-inverted[disabled] {\n  background-color: var(--blm-dang-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-loading::after {\n  border-color: transparent transparent var(--blm-dang-inv) var(--blm-dang-inv) !important;\n}\n\n.button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-outlined:hover, .button.is-danger.is-outlined.is-hovered, .button.is-danger.is-outlined:focus, .button.is-danger.is-outlined.is-focused {\n  background-color: var(--blm-dang);\n  border-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-dang) var(--blm-dang) !important;\n}\n\n.button.is-danger.is-outlined.is-loading:hover::after, .button.is-danger.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-outlined.is-loading:focus::after, .button.is-danger.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dang-inv) var(--blm-dang-inv) !important;\n}\n\n.button.is-danger.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-dang);\n  box-shadow: none;\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang-inv);\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-inverted.is-outlined:hover, .button.is-danger.is-inverted.is-outlined.is-hovered, .button.is-danger.is-inverted.is-outlined:focus, .button.is-danger.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-dang-inv);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted.is-outlined.is-loading:hover::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-inverted.is-outlined.is-loading:focus::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dang) var(--blm-dang) !important;\n}\n\n.button.is-danger.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: var(--blm-dang-inv);\n  box-shadow: none;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-light {\n  background-color: var(--blm-dang-light);\n  color: var(--blm-dang-dark);\n}\n\n.button.is-danger.is-light:hover, .button.is-danger.is-light.is-hovered {\n  background-color: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), calc(var(--blm-dang-light-l) - 2.5%), var(--blm-dang-light-a));\n  border-color: transparent;\n  color: var(--blm-dang-dark);\n}\n\n.button.is-danger.is-light:active, .button.is-danger.is-light.is-active {\n  background-color: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), calc(var(--blm-dang-light-l) - 5%), var(--blm-dang-light-a));\n  border-color: transparent;\n  color: var(--blm-dang-dark);\n}\n\n.button.is-small {\n  border-radius: var(--blm-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.button.is-normal {\n  font-size: var(--blm-s-normal);\n}\n\n.button.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.button.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.button[disabled] {\n  background-color: var(--blm-bt-dsbl-bg-clr);\n  border-color: var(--blm-bt-dsbl-bd-clr);\n  box-shadow: var(--blm-bt-dsbl-shadow);\n  opacity: var(--blm-bt-dsbl-opacity);\n}\n\n.button.is-fullwidth {\n  display: flex;\n  width: 100%;\n}\n\n.button.is-loading {\n  color: transparent !important;\n  pointer-events: none;\n}\n\n.button.is-loading::after {\n  position: absolute;\n  left: calc(50% - 0.5em);\n  top: calc(50% - 0.5em);\n  position: absolute !important;\n}\n\n.button.is-static {\n  background-color: var(--blm-bt-static-bg-clr);\n  border-color: var(--blm-bt-static-bd-clr);\n  color: var(--blm-bt-static-clr);\n  box-shadow: none;\n  pointer-events: none;\n}\n\n.button.is-rounded {\n  border-radius: var(--blm-radius-rounded);\n  padding-left: calc(var(--blm-bt-p-horizontal) + 0.25em);\n  padding-right: 1.25em;\n}\n\n.buttons {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.buttons .button {\n  margin-bottom: 0.5rem;\n}\n\n.buttons .button:not(:last-child):not(.is-fullwidth) {\n  margin-right: 0.5rem;\n}\n\n.buttons:last-child {\n  margin-bottom: -0.5rem;\n}\n\n.buttons:not(:last-child) {\n  margin-bottom: 1rem;\n}\n\n.buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large) {\n  border-radius: var(--blm-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.buttons.are-medium .button:not(.is-small):not(.is-normal):not(.is-large) {\n  font-size: var(--blm-s-medium);\n}\n\n.buttons.are-large .button:not(.is-small):not(.is-normal):not(.is-medium) {\n  font-size: var(--blm-s-lg);\n}\n\n.buttons.has-addons .button:not(:first-child) {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.buttons.has-addons .button:not(:last-child) {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n  margin-right: -1px;\n}\n\n.buttons.has-addons .button:last-child {\n  margin-right: 0;\n}\n\n.buttons.has-addons .button:hover, .buttons.has-addons .button.is-hovered {\n  z-index: 2;\n}\n\n.buttons.has-addons .button:focus, .buttons.has-addons .button.is-focused, .buttons.has-addons .button:active, .buttons.has-addons .button.is-active, .buttons.has-addons .button.is-selected {\n  z-index: 3;\n}\n\n.buttons.has-addons .button:focus:hover, .buttons.has-addons .button.is-focused:hover, .buttons.has-addons .button:active:hover, .buttons.has-addons .button.is-active:hover, .buttons.has-addons .button.is-selected:hover {\n  z-index: 4;\n}\n\n.buttons.has-addons .button.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.buttons.is-centered {\n  justify-content: center;\n}\n\n.buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.buttons.is-right {\n  justify-content: flex-end;\n}\n\n.buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.notification {\n  background-color: var(--blm-noti-bg-clr);\n  border-radius: var(--blm-noti-radius);\n  position: relative;\n  padding: var(--blm-noti-p-vertical) var(--blm-noti-p-right) var(--blm-noti-p-vertical) var(--blm-noti-p-left);\n}\n\n.notification a:not(.button):not(.dropdown-item) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.notification strong {\n  color: currentColor;\n}\n\n.notification code,\n.notification pre {\n  background: var(--blm-noti-code-bg-clr);\n}\n\n.notification pre code {\n  background: transparent;\n}\n\n.notification > .delete {\n  right: 0.5rem;\n  position: absolute;\n  top: 0.5rem;\n}\n\n.notification .title,\n.notification .subtitle,\n.notification .content {\n  color: currentColor;\n}\n\n.notification.is-white {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.notification.is-black {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.notification.is-light {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.notification.is-dark {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.notification.is-primary {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.notification.is-primary.is-light {\n  background-color: var(--blm-prim-light);\n  color: var(--blm-prim-dark);\n}\n\n.notification.is-link {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.notification.is-link.is-light {\n  background-color: var(--blm-link-light);\n  color: var(--blm-link-dark);\n}\n\n.notification.is-info {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.notification.is-info.is-light {\n  background-color: var(--blm-info-light);\n  color: var(--blm-info-dark);\n}\n\n.notification.is-success {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.notification.is-success.is-light {\n  background-color: var(--blm-sucs-light);\n  color: var(--blm-sucs-dark);\n}\n\n.notification.is-warning {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.notification.is-warning.is-light {\n  background-color: var(--blm-warn-light);\n  color: var(--blm-warn-dark);\n}\n\n.notification.is-danger {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.notification.is-danger.is-light {\n  background-color: var(--blm-dang-light);\n  color: var(--blm-dang-dark);\n}\n\n@-webkit-keyframes moveIndeterminate {\n  to {\n    background-position: -200% 0;\n  }\n}\n\n@keyframes moveIndeterminate {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}\n\n .is-hovered.input, .is-hovered.textarea {\n  border-color: var(--blm-input-hov-bd-clr);\n}\n\n .is-focused.input, .is-focused.textarea, .is-active.input, .is-active.textarea {\n  border-color: var(--blm-input-foc-bd-clr);\n  box-shadow: var(--blm-input-foc-box-shadow-s) var(--blm-input-foc-box-shadow-clr);\n}\n\n.is-light.input, .is-light.textarea {\n  border-color: var(--blm-light);\n}\n\n.is-light.input:focus, .is-light.textarea:focus, .is-light.is-focused.input, .is-light.is-focused.textarea, .is-light.input:active, .is-light.textarea:active, .is-light.is-active.input, .is-light.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n}\n\n.is-dark.input, .is-dark.textarea {\n  border-color: var(--blm-dark);\n}\n\n.is-dark.input:focus, .is-dark.textarea:focus, .is-dark.is-focused.input, .is-dark.is-focused.textarea, .is-dark.input:active, .is-dark.textarea:active, .is-dark.is-active.input, .is-dark.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n}\n\n.is-primary.input, .is-primary.textarea {\n  border-color: var(--blm-prim);\n}\n\n.is-primary.input:focus, .is-primary.textarea:focus, .is-primary.is-focused.input, .is-primary.is-focused.textarea, .is-primary.input:active, .is-primary.textarea:active, .is-primary.is-active.input, .is-primary.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n}\n\n.is-link.input, .is-link.textarea {\n  border-color: var(--blm-link);\n}\n\n.is-link.input:focus, .is-link.textarea:focus, .is-link.is-focused.input, .is-link.is-focused.textarea, .is-link.input:active, .is-link.textarea:active, .is-link.is-active.input, .is-link.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n}\n\n.is-info.input, .is-info.textarea {\n  border-color: var(--blm-info);\n}\n\n.is-info.input:focus, .is-info.textarea:focus, .is-info.is-focused.input, .is-info.is-focused.textarea, .is-info.input:active, .is-info.textarea:active, .is-info.is-active.input, .is-info.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n}\n\n.is-success.input, .is-success.textarea {\n  border-color: var(--blm-sucs);\n}\n\n.is-success.input:focus, .is-success.textarea:focus, .is-success.is-focused.input, .is-success.is-focused.textarea, .is-success.input:active, .is-success.textarea:active, .is-success.is-active.input, .is-success.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n}\n\n.is-warning.input, .is-warning.textarea {\n  border-color: var(--blm-warn);\n}\n\n.is-warning.input:focus, .is-warning.textarea:focus, .is-warning.is-focused.input, .is-warning.is-focused.textarea, .is-warning.input:active, .is-warning.textarea:active, .is-warning.is-active.input, .is-warning.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n}\n\n.is-danger.input, .is-danger.textarea {\n  border-color: var(--blm-dang);\n}\n\n.is-danger.input:focus, .is-danger.textarea:focus, .is-danger.is-focused.input, .is-danger.is-focused.textarea, .is-danger.input:active, .is-danger.textarea:active, .is-danger.is-active.input, .is-danger.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n}\n\n.is-small.input, .is-small.textarea {\n  border-radius: var(--blm-ctrl-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.is-medium.input, .is-medium.textarea {\n  font-size: var(--blm-s-medium);\n}\n\n.is-large.input, .is-large.textarea {\n  font-size: var(--blm-s-lg);\n}\n\n.is-fullwidth.input, .is-fullwidth.textarea {\n  display: block;\n  width: 100%;\n}\n\n\nbutton.dropdown-item {\n  padding-right: 3rem;\n  text-align: inherit;\n  white-space: nowrap;\n  width: 100%;\n}\n\n\nbutton.dropdown-item:hover {\n  background-color: var(--blm-drp-itm-hov-bg-clr);\n  color: var(--blm-drp-itm-hov-clr);\n}\n\n\nbutton.dropdown-item.is-active {\n  background-color: var(--blm-drp-itm-act-bg-clr);\n  color: var(--blm-drp-itm-act-clr);\n}\n\nhtml.has-navbar-fixed-top,\nbody.has-navbar-fixed-top {\n  padding-top: var(--blm-nav-height);\n}\n\nhtml.has-navbar-fixed-bottom,\nbody.has-navbar-fixed-bottom {\n  padding-bottom: var(--blm-nav-height);\n}\n\n@media screen and (max-width: 1023px) {\n  html.has-navbar-fixed-top-touch,\n  body.has-navbar-fixed-top-touch {\n    padding-top: var(--blm-nav-height);\n  }\n  html.has-navbar-fixed-bottom-touch,\n  body.has-navbar-fixed-bottom-touch {\n    padding-bottom: var(--blm-nav-height);\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  html.has-navbar-fixed-top-desktop,\n  body.has-navbar-fixed-top-desktop {\n    padding-top: var(--blm-nav-height);\n  }\n  html.has-navbar-fixed-bottom-desktop,\n  body.has-navbar-fixed-bottom-desktop {\n    padding-bottom: var(--blm-nav-height);\n  }\n  html.has-spaced-navbar-fixed-top,\n  body.has-spaced-navbar-fixed-top {\n    padding-top: calc(var(--blm-nav-height) + var(--blm-nav-p-vertical)*2);\n  }\n  html.has-spaced-navbar-fixed-bottom,\n  body.has-spaced-navbar-fixed-bottom {\n    padding-bottom: calc(var(--blm-nav-height) + var(--blm-nav-p-vertical)*2);\n  }\n}\n\n.section {\n  padding: var(--blm-sct-p);\n}\n\n@media screen and (min-width: 1024px) {\n  .section.is-medium {\n    padding: var(--blm-sct-p-medium);\n  }\n  .section.is-large {\n    padding: var(--blm-sct-p-lg);\n  }\n}\n\n :root {\n  --blm-turquoise: hsla(var(--blm-turquoise-h), var(--blm-turquoise-s), var(--blm-turquoise-l), var(--blm-turquoise-a));\n  --blm-turquoise-h: 171;\n  --blm-turquoise-s: 100%;\n  --blm-turquoise-l: 41%;\n  --blm-turquoise-a: 1;\n  --blm-cyan: hsla(var(--blm-cyan-h), var(--blm-cyan-s), var(--blm-cyan-l), var(--blm-cyan-a));\n  --blm-cyan-h: 204;\n  --blm-cyan-s: 71%;\n  --blm-cyan-l: 53%;\n  --blm-cyan-a: 1;\n  --blm-green: hsla(var(--blm-green-h), var(--blm-green-s), var(--blm-green-l), var(--blm-green-a));\n  --blm-green-h: 141;\n  --blm-green-s: 53%;\n  --blm-green-l: 53%;\n  --blm-green-a: 1;\n  --blm-yellow: hsla(var(--blm-yellow-h), var(--blm-yellow-s), var(--blm-yellow-l), var(--blm-yellow-a));\n  --blm-yellow-h: 48;\n  --blm-yellow-s: 100%;\n  --blm-yellow-l: 67%;\n  --blm-yellow-a: 1;\n  --blm-red: hsla(var(--blm-red-h), var(--blm-red-s), var(--blm-red-l), var(--blm-red-a));\n  --blm-red-h: 348;\n  --blm-red-s: 86%;\n  --blm-red-l: 61%;\n  --blm-red-a: 1;\n  --blm-white-ter: hsla(var(--blm-white-ter-h), var(--blm-white-ter-s), var(--blm-white-ter-l), var(--blm-white-ter-a));\n  --blm-white-ter-h: 0;\n  --blm-white-ter-s: 0%;\n  --blm-white-ter-l: 96%;\n  --blm-white-ter-a: 1;\n  --blm-grey-darker: hsla(var(--blm-grey-darker-h), var(--blm-grey-darker-s), var(--blm-grey-darker-l), var(--blm-grey-darker-a));\n  --blm-grey-darker-h: 0;\n  --blm-grey-darker-s: 0%;\n  --blm-grey-darker-l: 21%;\n  --blm-grey-darker-a: 1;\n  --blm-orange: hsla(var(--blm-orange-h), var(--blm-orange-s), var(--blm-orange-l), var(--blm-orange-a));\n  --blm-orange-h: 14;\n  --blm-orange-s: 100%;\n  --blm-orange-l: 53%;\n  --blm-orange-a: 1;\n  --blm-blue: hsla(var(--blm-blue-h), var(--blm-blue-s), var(--blm-blue-l), var(--blm-blue-a));\n  --blm-blue-h: 217;\n  --blm-blue-s: 71%;\n  --blm-blue-l: 53%;\n  --blm-blue-a: 1;\n  --blm-purple: hsla(var(--blm-purple-h), var(--blm-purple-s), var(--blm-purple-l), var(--blm-purple-a));\n  --blm-purple-h: 271;\n  --blm-purple-s: 100%;\n  --blm-purple-l: 71%;\n  --blm-purple-a: 1;\n  --blm-prim: hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), var(--blm-prim-a));\n  --blm-prim-h: var(--blm-turquoise-h);\n  --blm-prim-s: var(--blm-turquoise-s);\n  --blm-prim-l: var(--blm-turquoise-l);\n  --blm-prim-a: var(--blm-turquoise-a);\n  --blm-info: hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), var(--blm-info-a));\n  --blm-info-h: var(--blm-cyan-h);\n  --blm-info-s: var(--blm-cyan-s);\n  --blm-info-l: var(--blm-cyan-l);\n  --blm-info-a: var(--blm-cyan-a);\n  --blm-sucs: hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), var(--blm-sucs-a));\n  --blm-sucs-h: var(--blm-green-h);\n  --blm-sucs-s: var(--blm-green-s);\n  --blm-sucs-l: var(--blm-green-l);\n  --blm-sucs-a: var(--blm-green-a);\n  --blm-warn: hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), var(--blm-warn-a));\n  --blm-warn-h: var(--blm-yellow-h);\n  --blm-warn-s: var(--blm-yellow-s);\n  --blm-warn-l: var(--blm-yellow-l);\n  --blm-warn-a: var(--blm-yellow-a);\n  --blm-dang: hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), var(--blm-dang-a));\n  --blm-dang-h: var(--blm-red-h);\n  --blm-dang-s: var(--blm-red-s);\n  --blm-dang-l: var(--blm-red-l);\n  --blm-dang-a: var(--blm-red-a);\n  --blm-light: hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), var(--blm-light-a));\n  --blm-light-h: var(--blm-white-ter-h);\n  --blm-light-s: var(--blm-white-ter-s);\n  --blm-light-l: var(--blm-white-ter-l);\n  --blm-light-a: var(--blm-white-ter-a);\n  --blm-dark: hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), var(--blm-dark-a));\n  --blm-dark-h: var(--blm-grey-darker-h);\n  --blm-dark-s: var(--blm-grey-darker-s);\n  --blm-dark-l: var(--blm-grey-darker-l);\n  --blm-dark-a: var(--blm-grey-darker-a);\n  --blm-black: hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), var(--blm-black-a));\n  --blm-black-h: 0;\n  --blm-black-s: 0%;\n  --blm-black-l: 4%;\n  --blm-black-a: 1;\n  --blm-white: hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), var(--blm-white-a));\n  --blm-white-h: 0;\n  --blm-white-s: 0%;\n  --blm-white-l: 100%;\n  --blm-white-a: 1;\n  --blm-white-bis: hsla(var(--blm-white-bis-h), var(--blm-white-bis-s), var(--blm-white-bis-l), var(--blm-white-bis-a));\n  --blm-white-bis-h: 0;\n  --blm-white-bis-s: 0%;\n  --blm-white-bis-l: 98%;\n  --blm-white-bis-a: 1;\n  --blm-black-bis: hsla(var(--blm-black-bis-h), var(--blm-black-bis-s), var(--blm-black-bis-l), var(--blm-black-bis-a));\n  --blm-black-bis-h: 0;\n  --blm-black-bis-s: 0%;\n  --blm-black-bis-l: 7%;\n  --blm-black-bis-a: 1;\n  --blm-black-ter: hsla(var(--blm-black-ter-h), var(--blm-black-ter-s), var(--blm-black-ter-l), var(--blm-black-ter-a));\n  --blm-black-ter-h: 0;\n  --blm-black-ter-s: 0%;\n  --blm-black-ter-l: 14%;\n  --blm-black-ter-a: 1;\n  --blm-grey-lighter: hsla(var(--blm-grey-lighter-h), var(--blm-grey-lighter-s), var(--blm-grey-lighter-l), var(--blm-grey-lighter-a));\n  --blm-grey-lighter-h: 0;\n  --blm-grey-lighter-s: 0%;\n  --blm-grey-lighter-l: 86%;\n  --blm-grey-lighter-a: 1;\n  --blm-grey-light: hsla(var(--blm-grey-light-h), var(--blm-grey-light-s), var(--blm-grey-light-l), var(--blm-grey-light-a));\n  --blm-grey-light-h: 0;\n  --blm-grey-light-s: 0%;\n  --blm-grey-light-l: 71%;\n  --blm-grey-light-a: 1;\n  --blm-grey-lightest: hsla(var(--blm-grey-lightest-h), var(--blm-grey-lightest-s), var(--blm-grey-lightest-l), var(--blm-grey-lightest-a));\n  --blm-grey-lightest-h: 0;\n  --blm-grey-lightest-s: 0%;\n  --blm-grey-lightest-l: 93%;\n  --blm-grey-lightest-a: 1;\n  --blm-grey-dark: hsla(var(--blm-grey-dark-h), var(--blm-grey-dark-s), var(--blm-grey-dark-l), var(--blm-grey-dark-a));\n  --blm-grey-dark-h: 0;\n  --blm-grey-dark-s: 0%;\n  --blm-grey-dark-l: 29%;\n  --blm-grey-dark-a: 1;\n  --blm-txt: hsla(var(--blm-txt-h), var(--blm-txt-s), var(--blm-txt-l), var(--blm-txt-a));\n  --blm-txt-h: var(--blm-grey-dark-h);\n  --blm-txt-s: var(--blm-grey-dark-s);\n  --blm-txt-l: var(--blm-grey-dark-l);\n  --blm-txt-a: var(--blm-grey-dark-a);\n  --blm-grey: hsla(var(--blm-grey-h), var(--blm-grey-s), var(--blm-grey-l), var(--blm-grey-a));\n  --blm-grey-h: 0;\n  --blm-grey-s: 0%;\n  --blm-grey-l: 48%;\n  --blm-grey-a: 1;\n  --blm-bg: hsla(var(--blm-bg-h), var(--blm-bg-s), var(--blm-bg-l), var(--blm-bg-a));\n  --blm-bg-h: var(--blm-white-ter-h);\n  --blm-bg-s: var(--blm-white-ter-s);\n  --blm-bg-l: var(--blm-white-ter-l);\n  --blm-bg-a: var(--blm-white-ter-a);\n  --blm-link: hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), var(--blm-link-a));\n  --blm-link-h: var(--blm-blue-h);\n  --blm-link-s: var(--blm-blue-s);\n  --blm-link-l: var(--blm-blue-l);\n  --blm-link-a: var(--blm-blue-a);\n  --blm-family-sans-serif: BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Helvetica, Arial, sans-serif;\n  --blm-family-monospace: monospace;\n  --blm-s-7: 0.75rem;\n  --blm-s-6: 1rem;\n  --blm-s-5: 1.25rem;\n  --blm-s-4: 1.5rem;\n  --blm-s-1: 3rem;\n  --blm-s-2: 2.5rem;\n  --blm-s-3: 2rem;\n  --blm-radius: 4px;\n  --blm-radius-small: 2px;\n  --blm-ctrl-bd-width: 1px;\n  --blm-ctrl-radius: var(--blm-radius);\n  --blm-s-normal: var(--blm-s-6);\n  --blm-ctrl-height: 2.5em;\n  --blm-ctrl-line-height: 1.5;\n  --blm-ctrl-p-vertical: calc(0.5em - var(--blm-ctrl-bd-width));\n  --blm-ctrl-p-horizontal: calc(0.75em - var(--blm-ctrl-bd-width));\n  --blm-sch-inv: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), var(--blm-sch-inv-a));\n  --blm-sch-inv-h: var(--blm-black-h);\n  --blm-sch-inv-s: var(--blm-black-s);\n  --blm-sch-inv-l: var(--blm-black-l);\n  --blm-sch-inv-a: var(--blm-black-a);\n  --blm-radius-rounded: 290486px;\n  --blm-sch-main: hsla(var(--blm-sch-main-h), var(--blm-sch-main-s), var(--blm-sch-main-l), var(--blm-sch-main-a));\n  --blm-sch-main-h: var(--blm-white-h);\n  --blm-sch-main-s: var(--blm-white-s);\n  --blm-sch-main-l: var(--blm-white-l);\n  --blm-sch-main-a: var(--blm-white-a);\n  --blm-family-prim: var(--blm-family-sans-serif);\n  --blm-weight-normal: 400;\n  --blm-family-code: var(--blm-family-monospace);\n  --blm-txt-strong: hsla(var(--blm-txt-strong-h), var(--blm-txt-strong-s), var(--blm-txt-strong-l), var(--blm-txt-strong-a));\n  --blm-txt-strong-h: var(--blm-grey-darker-h);\n  --blm-txt-strong-s: var(--blm-grey-darker-s);\n  --blm-txt-strong-l: var(--blm-grey-darker-l);\n  --blm-txt-strong-a: var(--blm-grey-darker-a);\n  --blm-weight-bold: 700;\n  --blm-radius-lg: 6px;\n  --blm-box-bg-clr: hsla(var(--blm-box-bg-clr-h), var(--blm-box-bg-clr-s), var(--blm-box-bg-clr-l), var(--blm-box-bg-clr-a));\n  --blm-box-bg-clr-h: var(--blm-sch-main-h);\n  --blm-box-bg-clr-s: var(--blm-sch-main-s);\n  --blm-box-bg-clr-l: var(--blm-sch-main-l);\n  --blm-box-bg-clr-a: var(--blm-sch-main-a);\n  --blm-box-radius: var(--blm-radius-lg);\n  --blm-box-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-box-clr: hsla(var(--blm-box-clr-h), var(--blm-box-clr-s), var(--blm-box-clr-l), var(--blm-box-clr-a));\n  --blm-box-clr-h: var(--blm-txt-h);\n  --blm-box-clr-s: var(--blm-txt-s);\n  --blm-box-clr-l: var(--blm-txt-l);\n  --blm-box-clr-a: var(--blm-txt-a);\n  --blm-box-p: 1.25rem;\n  --blm-box-link-hov-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0 0 1px var(--blm-link);\n  --blm-box-link-act-shadow: inset 0 1px 2px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.2), 0 0 0 1px var(--blm-link);\n  --blm-bd: hsla(var(--blm-bd-h), var(--blm-bd-s), var(--blm-bd-l), var(--blm-bd-a));\n  --blm-bd-h: var(--blm-grey-lighter-h);\n  --blm-bd-s: var(--blm-grey-lighter-s);\n  --blm-bd-l: var(--blm-grey-lighter-l);\n  --blm-bd-a: var(--blm-grey-lighter-a);\n  --blm-bt-bd-width: var(--blm-ctrl-bd-width);\n  --blm-link-hov: hsla(var(--blm-link-hov-h), var(--blm-link-hov-s), var(--blm-link-hov-l), var(--blm-link-hov-a));\n  --blm-link-hov-h: var(--blm-grey-darker-h);\n  --blm-link-hov-s: var(--blm-grey-darker-s);\n  --blm-link-hov-l: var(--blm-grey-darker-l);\n  --blm-link-hov-a: var(--blm-grey-darker-a);\n  --blm-link-hov-bd: hsla(var(--blm-link-hov-bd-h), var(--blm-link-hov-bd-s), var(--blm-link-hov-bd-l), var(--blm-link-hov-bd-a));\n  --blm-link-hov-bd-h: var(--blm-grey-light-h);\n  --blm-link-hov-bd-s: var(--blm-grey-light-s);\n  --blm-link-hov-bd-l: var(--blm-grey-light-l);\n  --blm-link-hov-bd-a: var(--blm-grey-light-a);\n  --blm-link-foc: hsla(var(--blm-link-foc-h), var(--blm-link-foc-s), var(--blm-link-foc-l), var(--blm-link-foc-a));\n  --blm-link-foc-h: var(--blm-grey-darker-h);\n  --blm-link-foc-s: var(--blm-grey-darker-s);\n  --blm-link-foc-l: var(--blm-grey-darker-l);\n  --blm-link-foc-a: var(--blm-grey-darker-a);\n  --blm-link-foc-bd: hsla(var(--blm-link-foc-bd-h), var(--blm-link-foc-bd-s), var(--blm-link-foc-bd-l), var(--blm-link-foc-bd-a));\n  --blm-link-foc-bd-h: var(--blm-blue-h);\n  --blm-link-foc-bd-s: var(--blm-blue-s);\n  --blm-link-foc-bd-l: var(--blm-blue-l);\n  --blm-link-foc-bd-a: var(--blm-blue-a);\n  --blm-link-act: hsla(var(--blm-link-act-h), var(--blm-link-act-s), var(--blm-link-act-l), var(--blm-link-act-a));\n  --blm-link-act-h: var(--blm-grey-darker-h);\n  --blm-link-act-s: var(--blm-grey-darker-s);\n  --blm-link-act-l: var(--blm-grey-darker-l);\n  --blm-link-act-a: var(--blm-grey-darker-a);\n  --blm-link-act-bd: hsla(var(--blm-link-act-bd-h), var(--blm-link-act-bd-s), var(--blm-link-act-bd-l), var(--blm-link-act-bd-a));\n  --blm-link-act-bd-h: var(--blm-grey-dark-h);\n  --blm-link-act-bd-s: var(--blm-grey-dark-s);\n  --blm-link-act-bd-l: var(--blm-grey-dark-l);\n  --blm-link-act-bd-a: var(--blm-grey-dark-a);\n  --blm-txt-light: hsla(var(--blm-txt-light-h), var(--blm-txt-light-s), var(--blm-txt-light-l), var(--blm-txt-light-a));\n  --blm-txt-light-h: var(--blm-grey-h);\n  --blm-txt-light-s: var(--blm-grey-s);\n  --blm-txt-light-l: var(--blm-grey-l);\n  --blm-txt-light-a: var(--blm-grey-a);\n  --blm-sch-main-ter: hsla(var(--blm-sch-main-ter-h), var(--blm-sch-main-ter-s), var(--blm-sch-main-ter-l), var(--blm-sch-main-ter-a));\n  --blm-sch-main-ter-h: var(--blm-white-ter-h);\n  --blm-sch-main-ter-s: var(--blm-white-ter-s);\n  --blm-sch-main-ter-l: var(--blm-white-ter-l);\n  --blm-sch-main-ter-a: var(--blm-white-ter-a);\n  --blm-bt-bg-clr: hsla(var(--blm-bt-bg-clr-h), var(--blm-bt-bg-clr-s), var(--blm-bt-bg-clr-l), var(--blm-bt-bg-clr-a));\n  --blm-bt-bg-clr-h: var(--blm-sch-main-h);\n  --blm-bt-bg-clr-s: var(--blm-sch-main-s);\n  --blm-bt-bg-clr-l: var(--blm-sch-main-l);\n  --blm-bt-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bt-bd-clr: hsla(var(--blm-bt-bd-clr-h), var(--blm-bt-bd-clr-s), var(--blm-bt-bd-clr-l), var(--blm-bt-bd-clr-a));\n  --blm-bt-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-clr: hsla(var(--blm-bt-clr-h), var(--blm-bt-clr-s), var(--blm-bt-clr-l), var(--blm-bt-clr-a));\n  --blm-bt-clr-h: var(--blm-txt-strong-h);\n  --blm-bt-clr-s: var(--blm-txt-strong-s);\n  --blm-bt-clr-l: var(--blm-txt-strong-l);\n  --blm-bt-clr-a: var(--blm-txt-strong-a);\n  --blm-bt-family: inherit;\n  --blm-bt-p-vertical: calc(0.5em - var(--blm-bt-bd-width));\n  --blm-bt-p-horizontal: 1em;\n  --blm-bt-hov-bd-clr: hsla(var(--blm-bt-hov-bd-clr-h), var(--blm-bt-hov-bd-clr-s), var(--blm-bt-hov-bd-clr-l), var(--blm-bt-hov-bd-clr-a));\n  --blm-bt-hov-bd-clr-h: var(--blm-link-hov-bd-h);\n  --blm-bt-hov-bd-clr-s: var(--blm-link-hov-bd-s);\n  --blm-bt-hov-bd-clr-l: var(--blm-link-hov-bd-l);\n  --blm-bt-hov-bd-clr-a: var(--blm-link-hov-bd-a);\n  --blm-bt-hov-clr: hsla(var(--blm-bt-hov-clr-h), var(--blm-bt-hov-clr-s), var(--blm-bt-hov-clr-l), var(--blm-bt-hov-clr-a));\n  --blm-bt-hov-clr-h: var(--blm-link-hov-h);\n  --blm-bt-hov-clr-s: var(--blm-link-hov-s);\n  --blm-bt-hov-clr-l: var(--blm-link-hov-l);\n  --blm-bt-hov-clr-a: var(--blm-link-hov-a);\n  --blm-bt-foc-bd-clr: hsla(var(--blm-bt-foc-bd-clr-h), var(--blm-bt-foc-bd-clr-s), var(--blm-bt-foc-bd-clr-l), var(--blm-bt-foc-bd-clr-a));\n  --blm-bt-foc-bd-clr-h: var(--blm-link-foc-bd-h);\n  --blm-bt-foc-bd-clr-s: var(--blm-link-foc-bd-s);\n  --blm-bt-foc-bd-clr-l: var(--blm-link-foc-bd-l);\n  --blm-bt-foc-bd-clr-a: var(--blm-link-foc-bd-a);\n  --blm-bt-foc-clr: hsla(var(--blm-bt-foc-clr-h), var(--blm-bt-foc-clr-s), var(--blm-bt-foc-clr-l), var(--blm-bt-foc-clr-a));\n  --blm-bt-foc-clr-h: var(--blm-link-foc-h);\n  --blm-bt-foc-clr-s: var(--blm-link-foc-s);\n  --blm-bt-foc-clr-l: var(--blm-link-foc-l);\n  --blm-bt-foc-clr-a: var(--blm-link-foc-a);\n  --blm-bt-foc-box-shadow-s: 0 0 0 0.125em;\n  --blm-bt-foc-box-shadow-clr: hsla(var(--blm-bt-foc-box-shadow-clr-h), var(--blm-bt-foc-box-shadow-clr-s), var(--blm-bt-foc-box-shadow-clr-l), var(--blm-bt-foc-box-shadow-clr-a));\n  --blm-bt-foc-box-shadow-clr-h: var(--blm-link-h);\n  --blm-bt-foc-box-shadow-clr-s: var(--blm-link-s);\n  --blm-bt-foc-box-shadow-clr-l: var(--blm-link-l);\n  --blm-bt-foc-box-shadow-clr-a: 0.25;\n  --blm-bt-act-bd-clr: hsla(var(--blm-bt-act-bd-clr-h), var(--blm-bt-act-bd-clr-s), var(--blm-bt-act-bd-clr-l), var(--blm-bt-act-bd-clr-a));\n  --blm-bt-act-bd-clr-h: var(--blm-link-act-bd-h);\n  --blm-bt-act-bd-clr-s: var(--blm-link-act-bd-s);\n  --blm-bt-act-bd-clr-l: var(--blm-link-act-bd-l);\n  --blm-bt-act-bd-clr-a: var(--blm-link-act-bd-a);\n  --blm-bt-act-clr: hsla(var(--blm-bt-act-clr-h), var(--blm-bt-act-clr-s), var(--blm-bt-act-clr-l), var(--blm-bt-act-clr-a));\n  --blm-bt-act-clr-h: var(--blm-link-act-h);\n  --blm-bt-act-clr-s: var(--blm-link-act-s);\n  --blm-bt-act-clr-l: var(--blm-link-act-l);\n  --blm-bt-act-clr-a: var(--blm-link-act-a);\n  --blm-bt-txt-clr: hsla(var(--blm-bt-txt-clr-h), var(--blm-bt-txt-clr-s), var(--blm-bt-txt-clr-l), var(--blm-bt-txt-clr-a));\n  --blm-bt-txt-clr-h: var(--blm-txt-h);\n  --blm-bt-txt-clr-s: var(--blm-txt-s);\n  --blm-bt-txt-clr-l: var(--blm-txt-l);\n  --blm-bt-txt-clr-a: var(--blm-txt-a);\n  --blm-bt-txt-decoration: underline;\n  --blm-bt-txt-hov-bg-clr: hsla(var(--blm-bt-txt-hov-bg-clr-h), var(--blm-bt-txt-hov-bg-clr-s), var(--blm-bt-txt-hov-bg-clr-l), var(--blm-bt-txt-hov-bg-clr-a));\n  --blm-bt-txt-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-bt-txt-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-bt-txt-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-bt-txt-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-bt-txt-hov-clr: hsla(var(--blm-bt-txt-hov-clr-h), var(--blm-bt-txt-hov-clr-s), var(--blm-bt-txt-hov-clr-l), var(--blm-bt-txt-hov-clr-a));\n  --blm-bt-txt-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-bt-txt-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-bt-txt-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-bt-txt-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-white-inv: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), var(--blm-white-inv-l), var(--blm-white-inv-a));\n  --blm-white-inv-h: var(--blm-black-h);\n  --blm-white-inv-s: var(--blm-black-s);\n  --blm-white-inv-l: var(--blm-black-l);\n  --blm-white-inv-a: var(--blm-black-a);\n  --blm-black-inv: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), var(--blm-black-inv-l), var(--blm-black-inv-a));\n  --blm-black-inv-h: var(--blm-white-h);\n  --blm-black-inv-s: var(--blm-white-s);\n  --blm-black-inv-l: var(--blm-white-l);\n  --blm-black-inv-a: var(--blm-white-a);\n  --blm-light-inv: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), var(--blm-light-inv-l), var(--blm-light-inv-a));\n  --blm-light-inv-h: 0;\n  --blm-light-inv-s: 0%;\n  --blm-light-inv-l: 0%;\n  --blm-light-inv-a: 0.7;\n  --blm-dark-inv: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), var(--blm-dark-inv-l), var(--blm-dark-inv-a));\n  --blm-dark-inv-h: 0;\n  --blm-dark-inv-s: 0%;\n  --blm-dark-inv-l: 100%;\n  --blm-dark-inv-a: 1;\n  --blm-prim-inv: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), var(--blm-prim-inv-l), var(--blm-prim-inv-a));\n  --blm-prim-inv-h: 0;\n  --blm-prim-inv-s: 0%;\n  --blm-prim-inv-l: 100%;\n  --blm-prim-inv-a: 1;\n  --blm-prim-light: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), var(--blm-prim-light-l), var(--blm-prim-light-a));\n  --blm-prim-light-h: 171;\n  --blm-prim-light-s: 100%;\n  --blm-prim-light-l: 96%;\n  --blm-prim-light-a: 1;\n  --blm-prim-dark: hsla(var(--blm-prim-dark-h), var(--blm-prim-dark-s), var(--blm-prim-dark-l), var(--blm-prim-dark-a));\n  --blm-prim-dark-h: 171;\n  --blm-prim-dark-s: 100%;\n  --blm-prim-dark-l: 29%;\n  --blm-prim-dark-a: 1;\n  --blm-link-inv: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), var(--blm-link-inv-l), var(--blm-link-inv-a));\n  --blm-link-inv-h: 0;\n  --blm-link-inv-s: 0%;\n  --blm-link-inv-l: 100%;\n  --blm-link-inv-a: 1;\n  --blm-link-light: hsla(var(--blm-link-light-h), var(--blm-link-light-s), var(--blm-link-light-l), var(--blm-link-light-a));\n  --blm-link-light-h: 217;\n  --blm-link-light-s: 71%;\n  --blm-link-light-l: 96%;\n  --blm-link-light-a: 1;\n  --blm-link-dark: hsla(var(--blm-link-dark-h), var(--blm-link-dark-s), var(--blm-link-dark-l), var(--blm-link-dark-a));\n  --blm-link-dark-h: 217;\n  --blm-link-dark-s: 71%;\n  --blm-link-dark-l: 45%;\n  --blm-link-dark-a: 1;\n  --blm-info-inv: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), var(--blm-info-inv-l), var(--blm-info-inv-a));\n  --blm-info-inv-h: 0;\n  --blm-info-inv-s: 0%;\n  --blm-info-inv-l: 100%;\n  --blm-info-inv-a: 1;\n  --blm-info-light: hsla(var(--blm-info-light-h), var(--blm-info-light-s), var(--blm-info-light-l), var(--blm-info-light-a));\n  --blm-info-light-h: 204;\n  --blm-info-light-s: 71%;\n  --blm-info-light-l: 96%;\n  --blm-info-light-a: 1;\n  --blm-info-dark: hsla(var(--blm-info-dark-h), var(--blm-info-dark-s), var(--blm-info-dark-l), var(--blm-info-dark-a));\n  --blm-info-dark-h: 204;\n  --blm-info-dark-s: 71%;\n  --blm-info-dark-l: 39%;\n  --blm-info-dark-a: 1;\n  --blm-sucs-inv: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), var(--blm-sucs-inv-l), var(--blm-sucs-inv-a));\n  --blm-sucs-inv-h: 0;\n  --blm-sucs-inv-s: 0%;\n  --blm-sucs-inv-l: 100%;\n  --blm-sucs-inv-a: 1;\n  --blm-sucs-light: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), var(--blm-sucs-light-l), var(--blm-sucs-light-a));\n  --blm-sucs-light-h: 141;\n  --blm-sucs-light-s: 53%;\n  --blm-sucs-light-l: 96%;\n  --blm-sucs-light-a: 1;\n  --blm-sucs-dark: hsla(var(--blm-sucs-dark-h), var(--blm-sucs-dark-s), var(--blm-sucs-dark-l), var(--blm-sucs-dark-a));\n  --blm-sucs-dark-h: 141;\n  --blm-sucs-dark-s: 53%;\n  --blm-sucs-dark-l: 31%;\n  --blm-sucs-dark-a: 1;\n  --blm-warn-inv: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), var(--blm-warn-inv-l), var(--blm-warn-inv-a));\n  --blm-warn-inv-h: 0;\n  --blm-warn-inv-s: 0%;\n  --blm-warn-inv-l: 0%;\n  --blm-warn-inv-a: 0.7;\n  --blm-warn-light: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), var(--blm-warn-light-l), var(--blm-warn-light-a));\n  --blm-warn-light-h: 48;\n  --blm-warn-light-s: 100%;\n  --blm-warn-light-l: 96%;\n  --blm-warn-light-a: 1;\n  --blm-warn-dark: hsla(var(--blm-warn-dark-h), var(--blm-warn-dark-s), var(--blm-warn-dark-l), var(--blm-warn-dark-a));\n  --blm-warn-dark-h: 48;\n  --blm-warn-dark-s: 100%;\n  --blm-warn-dark-l: 29%;\n  --blm-warn-dark-a: 1;\n  --blm-dang-inv: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), var(--blm-dang-inv-l), var(--blm-dang-inv-a));\n  --blm-dang-inv-h: 0;\n  --blm-dang-inv-s: 0%;\n  --blm-dang-inv-l: 100%;\n  --blm-dang-inv-a: 1;\n  --blm-dang-light: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), var(--blm-dang-light-l), var(--blm-dang-light-a));\n  --blm-dang-light-h: 348;\n  --blm-dang-light-s: 86%;\n  --blm-dang-light-l: 96%;\n  --blm-dang-light-a: 1;\n  --blm-dang-dark: hsla(var(--blm-dang-dark-h), var(--blm-dang-dark-s), var(--blm-dang-dark-l), var(--blm-dang-dark-a));\n  --blm-dang-dark-h: 348;\n  --blm-dang-dark-s: 86%;\n  --blm-dang-dark-l: 43%;\n  --blm-dang-dark-a: 1;\n  --blm-s-small: var(--blm-s-7);\n  --blm-s-medium: var(--blm-s-5);\n  --blm-s-lg: var(--blm-s-4);\n  --blm-bt-dsbl-bg-clr: hsla(var(--blm-bt-dsbl-bg-clr-h), var(--blm-bt-dsbl-bg-clr-s), var(--blm-bt-dsbl-bg-clr-l), var(--blm-bt-dsbl-bg-clr-a));\n  --blm-bt-dsbl-bg-clr-h: var(--blm-sch-main-h);\n  --blm-bt-dsbl-bg-clr-s: var(--blm-sch-main-s);\n  --blm-bt-dsbl-bg-clr-l: var(--blm-sch-main-l);\n  --blm-bt-dsbl-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bt-dsbl-bd-clr: hsla(var(--blm-bt-dsbl-bd-clr-h), var(--blm-bt-dsbl-bd-clr-s), var(--blm-bt-dsbl-bd-clr-l), var(--blm-bt-dsbl-bd-clr-a));\n  --blm-bt-dsbl-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-dsbl-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-dsbl-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-dsbl-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-dsbl-shadow: none;\n  --blm-bt-dsbl-opacity: 0.5;\n  --blm-bt-static-bg-clr: hsla(var(--blm-bt-static-bg-clr-h), var(--blm-bt-static-bg-clr-s), var(--blm-bt-static-bg-clr-l), var(--blm-bt-static-bg-clr-a));\n  --blm-bt-static-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-bt-static-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-bt-static-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-bt-static-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-bt-static-bd-clr: hsla(var(--blm-bt-static-bd-clr-h), var(--blm-bt-static-bd-clr-s), var(--blm-bt-static-bd-clr-l), var(--blm-bt-static-bd-clr-a));\n  --blm-bt-static-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-static-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-static-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-static-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-static-clr: hsla(var(--blm-bt-static-clr-h), var(--blm-bt-static-clr-s), var(--blm-bt-static-clr-l), var(--blm-bt-static-clr-a));\n  --blm-bt-static-clr-h: var(--blm-txt-light-h);\n  --blm-bt-static-clr-s: var(--blm-txt-light-s);\n  --blm-bt-static-clr-l: var(--blm-txt-light-l);\n  --blm-bt-static-clr-a: var(--blm-txt-light-a);\n  --blm-weight-semibold: 600;\n  --blm-ct-hdg-clr: hsla(var(--blm-ct-hdg-clr-h), var(--blm-ct-hdg-clr-s), var(--blm-ct-hdg-clr-l), var(--blm-ct-hdg-clr-a));\n  --blm-ct-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-hdg-weight: var(--blm-weight-semibold);\n  --blm-ct-hdg-line-height: 1.125;\n  --blm-ct-blockquote-bg-clr: hsla(var(--blm-ct-blockquote-bg-clr-h), var(--blm-ct-blockquote-bg-clr-s), var(--blm-ct-blockquote-bg-clr-l), var(--blm-ct-blockquote-bg-clr-a));\n  --blm-ct-blockquote-bg-clr-h: var(--blm-bg-h);\n  --blm-ct-blockquote-bg-clr-s: var(--blm-bg-s);\n  --blm-ct-blockquote-bg-clr-l: var(--blm-bg-l);\n  --blm-ct-blockquote-bg-clr-a: var(--blm-bg-a);\n  --blm-ct-blockquote-bd-left: 5px solid var(--blm-bd);\n  --blm-ct-blockquote-p: 1.25em 1.5em;\n  --blm-ct-pre-p: 1.25em 1.5em;\n  --blm-ct-table-cell-bd: 1px solid var(--blm-bd);\n  --blm-ct-table-cell-bd-width: 0 0 1px;\n  --blm-ct-table-cell-p: 0.5em 0.75em;\n  --blm-ct-table-cell-hdg-clr: hsla(var(--blm-ct-table-cell-hdg-clr-h), var(--blm-ct-table-cell-hdg-clr-s), var(--blm-ct-table-cell-hdg-clr-l), var(--blm-ct-table-cell-hdg-clr-a));\n  --blm-ct-table-cell-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-cell-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-cell-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-cell-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-table-head-cell-bd-width: 0 0 2px;\n  --blm-ct-table-head-cell-clr: hsla(var(--blm-ct-table-head-cell-clr-h), var(--blm-ct-table-head-cell-clr-s), var(--blm-ct-table-head-cell-clr-l), var(--blm-ct-table-head-cell-clr-a));\n  --blm-ct-table-head-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-head-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-head-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-head-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-table-foot-cell-bd-width: 2px 0 0;\n  --blm-ct-table-foot-cell-clr: hsla(var(--blm-ct-table-foot-cell-clr-h), var(--blm-ct-table-foot-cell-clr-s), var(--blm-ct-table-foot-cell-clr-l), var(--blm-ct-table-foot-cell-clr-a));\n  --blm-ct-table-foot-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-foot-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-foot-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-foot-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-icon-dim: 1.5rem;\n  --blm-icon-dim-small: 1rem;\n  --blm-icon-dim-medium: 2rem;\n  --blm-icon-dim-lg: 3rem;\n  --blm-noti-bg-clr: hsla(var(--blm-noti-bg-clr-h), var(--blm-noti-bg-clr-s), var(--blm-noti-bg-clr-l), var(--blm-noti-bg-clr-a));\n  --blm-noti-bg-clr-h: var(--blm-bg-h);\n  --blm-noti-bg-clr-s: var(--blm-bg-s);\n  --blm-noti-bg-clr-l: var(--blm-bg-l);\n  --blm-noti-bg-clr-a: var(--blm-bg-a);\n  --blm-noti-radius: var(--blm-radius);\n  --blm-noti-p-vertical: 1.25rem;\n  --blm-noti-p-right: 2.5rem;\n  --blm-noti-p-left: 1.5rem;\n  --blm-noti-code-bg-clr: hsla(var(--blm-noti-code-bg-clr-h), var(--blm-noti-code-bg-clr-s), var(--blm-noti-code-bg-clr-l), var(--blm-noti-code-bg-clr-a));\n  --blm-noti-code-bg-clr-h: var(--blm-sch-main-h);\n  --blm-noti-code-bg-clr-s: var(--blm-sch-main-s);\n  --blm-noti-code-bg-clr-l: var(--blm-sch-main-l);\n  --blm-noti-code-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bd-light: hsla(var(--blm-bd-light-h), var(--blm-bd-light-s), var(--blm-bd-light-l), var(--blm-bd-light-a));\n  --blm-bd-light-h: var(--blm-grey-lightest-h);\n  --blm-bd-light-s: var(--blm-grey-lightest-s);\n  --blm-bd-light-l: var(--blm-grey-lightest-l);\n  --blm-bd-light-a: var(--blm-grey-lightest-a);\n  --blm-prg-bd-radius: var(--blm-radius-rounded);\n  --blm-prg-bar-bg-clr: hsla(var(--blm-prg-bar-bg-clr-h), var(--blm-prg-bar-bg-clr-s), var(--blm-prg-bar-bg-clr-l), var(--blm-prg-bar-bg-clr-a));\n  --blm-prg-bar-bg-clr-h: var(--blm-bd-light-h);\n  --blm-prg-bar-bg-clr-s: var(--blm-bd-light-s);\n  --blm-prg-bar-bg-clr-l: var(--blm-bd-light-l);\n  --blm-prg-bar-bg-clr-a: var(--blm-bd-light-a);\n  --blm-prg-value-bg-clr: hsla(var(--blm-prg-value-bg-clr-h), var(--blm-prg-value-bg-clr-s), var(--blm-prg-value-bg-clr-l), var(--blm-prg-value-bg-clr-a));\n  --blm-prg-value-bg-clr-h: var(--blm-txt-h);\n  --blm-prg-value-bg-clr-s: var(--blm-txt-s);\n  --blm-prg-value-bg-clr-l: var(--blm-txt-l);\n  --blm-prg-value-bg-clr-a: var(--blm-txt-a);\n  --blm-prg-indeterminate-duration: 1.5s;\n  --blm-sch-main-bis: hsla(var(--blm-sch-main-bis-h), var(--blm-sch-main-bis-s), var(--blm-sch-main-bis-l), var(--blm-sch-main-bis-a));\n  --blm-sch-main-bis-h: var(--blm-white-bis-h);\n  --blm-sch-main-bis-s: var(--blm-white-bis-s);\n  --blm-sch-main-bis-l: var(--blm-white-bis-l);\n  --blm-sch-main-bis-a: var(--blm-white-bis-a);\n  --blm-table-bg-clr: hsla(var(--blm-table-bg-clr-h), var(--blm-table-bg-clr-s), var(--blm-table-bg-clr-l), var(--blm-table-bg-clr-a));\n  --blm-table-bg-clr-h: var(--blm-sch-main-h);\n  --blm-table-bg-clr-s: var(--blm-sch-main-s);\n  --blm-table-bg-clr-l: var(--blm-sch-main-l);\n  --blm-table-bg-clr-a: var(--blm-sch-main-a);\n  --blm-table-clr: hsla(var(--blm-table-clr-h), var(--blm-table-clr-s), var(--blm-table-clr-l), var(--blm-table-clr-a));\n  --blm-table-clr-h: var(--blm-txt-strong-h);\n  --blm-table-clr-s: var(--blm-txt-strong-s);\n  --blm-table-clr-l: var(--blm-txt-strong-l);\n  --blm-table-clr-a: var(--blm-txt-strong-a);\n  --blm-table-cell-bd: 1px solid var(--blm-bd);\n  --blm-table-cell-bd-width: 0 0 1px;\n  --blm-table-cell-p: 0.5em 0.75em;\n  --blm-table-row-act-bg-clr: hsla(var(--blm-table-row-act-bg-clr-h), var(--blm-table-row-act-bg-clr-s), var(--blm-table-row-act-bg-clr-l), var(--blm-table-row-act-bg-clr-a));\n  --blm-table-row-act-bg-clr-h: var(--blm-prim-h);\n  --blm-table-row-act-bg-clr-s: var(--blm-prim-s);\n  --blm-table-row-act-bg-clr-l: var(--blm-prim-l);\n  --blm-table-row-act-bg-clr-a: var(--blm-prim-a);\n  --blm-table-row-act-clr: hsla(var(--blm-table-row-act-clr-h), var(--blm-table-row-act-clr-s), var(--blm-table-row-act-clr-l), var(--blm-table-row-act-clr-a));\n  --blm-table-row-act-clr-h: var(--blm-prim-inv-h);\n  --blm-table-row-act-clr-s: var(--blm-prim-inv-s);\n  --blm-table-row-act-clr-l: var(--blm-prim-inv-l);\n  --blm-table-row-act-clr-a: var(--blm-prim-inv-a);\n  --blm-table-cell-hdg-clr: hsla(var(--blm-table-cell-hdg-clr-h), var(--blm-table-cell-hdg-clr-s), var(--blm-table-cell-hdg-clr-l), var(--blm-table-cell-hdg-clr-a));\n  --blm-table-cell-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-table-cell-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-table-cell-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-table-cell-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-table-head-bg-clr: hsla(var(--blm-table-head-bg-clr-h), var(--blm-table-head-bg-clr-s), var(--blm-table-head-bg-clr-l), var(--blm-table-head-bg-clr-a));\n  --blm-table-head-bg-clr-h: 0;\n  --blm-table-head-bg-clr-s: 0%;\n  --blm-table-head-bg-clr-l: 0%;\n  --blm-table-head-bg-clr-a: 0;\n  --blm-table-head-cell-bd-width: 0 0 2px;\n  --blm-table-head-cell-clr: hsla(var(--blm-table-head-cell-clr-h), var(--blm-table-head-cell-clr-s), var(--blm-table-head-cell-clr-l), var(--blm-table-head-cell-clr-a));\n  --blm-table-head-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-table-head-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-table-head-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-table-head-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-table-foot-bg-clr: hsla(var(--blm-table-foot-bg-clr-h), var(--blm-table-foot-bg-clr-s), var(--blm-table-foot-bg-clr-l), var(--blm-table-foot-bg-clr-a));\n  --blm-table-foot-bg-clr-h: 0;\n  --blm-table-foot-bg-clr-s: 0%;\n  --blm-table-foot-bg-clr-l: 0%;\n  --blm-table-foot-bg-clr-a: 0;\n  --blm-table-foot-cell-bd-width: 2px 0 0;\n  --blm-table-foot-cell-clr: hsla(var(--blm-table-foot-cell-clr-h), var(--blm-table-foot-cell-clr-s), var(--blm-table-foot-cell-clr-l), var(--blm-table-foot-cell-clr-a));\n  --blm-table-foot-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-table-foot-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-table-foot-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-table-foot-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-table-body-bg-clr: hsla(var(--blm-table-body-bg-clr-h), var(--blm-table-body-bg-clr-s), var(--blm-table-body-bg-clr-l), var(--blm-table-body-bg-clr-a));\n  --blm-table-body-bg-clr-h: 0;\n  --blm-table-body-bg-clr-s: 0%;\n  --blm-table-body-bg-clr-l: 0%;\n  --blm-table-body-bg-clr-a: 0;\n  --blm-table-row-hov-bg-clr: hsla(var(--blm-table-row-hov-bg-clr-h), var(--blm-table-row-hov-bg-clr-s), var(--blm-table-row-hov-bg-clr-l), var(--blm-table-row-hov-bg-clr-a));\n  --blm-table-row-hov-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-table-row-hov-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-table-row-hov-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-table-row-hov-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-table-striped-row-even-hov-bg-clr: hsla(var(--blm-table-striped-row-even-hov-bg-clr-h), var(--blm-table-striped-row-even-hov-bg-clr-s), var(--blm-table-striped-row-even-hov-bg-clr-l), var(--blm-table-striped-row-even-hov-bg-clr-a));\n  --blm-table-striped-row-even-hov-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-table-striped-row-even-hov-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-table-striped-row-even-hov-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-table-striped-row-even-hov-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-table-striped-row-even-bg-clr: hsla(var(--blm-table-striped-row-even-bg-clr-h), var(--blm-table-striped-row-even-bg-clr-s), var(--blm-table-striped-row-even-bg-clr-l), var(--blm-table-striped-row-even-bg-clr-a));\n  --blm-table-striped-row-even-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-table-striped-row-even-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-table-striped-row-even-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-table-striped-row-even-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-tag-bg-clr: hsla(var(--blm-tag-bg-clr-h), var(--blm-tag-bg-clr-s), var(--blm-tag-bg-clr-l), var(--blm-tag-bg-clr-a));\n  --blm-tag-bg-clr-h: var(--blm-bg-h);\n  --blm-tag-bg-clr-s: var(--blm-bg-s);\n  --blm-tag-bg-clr-l: var(--blm-bg-l);\n  --blm-tag-bg-clr-a: var(--blm-bg-a);\n  --blm-tag-radius: var(--blm-radius);\n  --blm-tag-clr: hsla(var(--blm-tag-clr-h), var(--blm-tag-clr-s), var(--blm-tag-clr-l), var(--blm-tag-clr-a));\n  --blm-tag-clr-h: var(--blm-txt-h);\n  --blm-tag-clr-s: var(--blm-txt-s);\n  --blm-tag-clr-l: var(--blm-txt-l);\n  --blm-tag-clr-a: var(--blm-txt-a);\n  --blm-tag-delete-m: 1px;\n  --blm-title-sub-s: 0.75em;\n  --blm-title-sup-s: 0.75em;\n  --blm-title-clr: hsla(var(--blm-title-clr-h), var(--blm-title-clr-s), var(--blm-title-clr-l), var(--blm-title-clr-a));\n  --blm-title-clr-h: var(--blm-txt-strong-h);\n  --blm-title-clr-s: var(--blm-txt-strong-s);\n  --blm-title-clr-l: var(--blm-txt-strong-l);\n  --blm-title-clr-a: var(--blm-txt-strong-a);\n  --blm-title-family: inherit;\n  --blm-title-s: var(--blm-s-3);\n  --blm-title-weight: var(--blm-weight-semibold);\n  --blm-title-line-height: 1.125;\n  --blm-title-strong-clr: inherit;\n  --blm-title-strong-weight: inherit;\n  --blm-subtitle-negative-m: -1.25rem;\n  --blm-subtitle-clr: hsla(var(--blm-subtitle-clr-h), var(--blm-subtitle-clr-s), var(--blm-subtitle-clr-l), var(--blm-subtitle-clr-a));\n  --blm-subtitle-clr-h: var(--blm-txt-h);\n  --blm-subtitle-clr-s: var(--blm-txt-s);\n  --blm-subtitle-clr-l: var(--blm-txt-l);\n  --blm-subtitle-clr-a: var(--blm-txt-a);\n  --blm-subtitle-family: inherit;\n  --blm-subtitle-s: var(--blm-s-5);\n  --blm-subtitle-weight: var(--blm-weight-normal);\n  --blm-subtitle-line-height: 1.25;\n  --blm-subtitle-strong-clr: hsla(var(--blm-subtitle-strong-clr-h), var(--blm-subtitle-strong-clr-s), var(--blm-subtitle-strong-clr-l), var(--blm-subtitle-strong-clr-a));\n  --blm-subtitle-strong-clr-h: var(--blm-txt-strong-h);\n  --blm-subtitle-strong-clr-s: var(--blm-txt-strong-s);\n  --blm-subtitle-strong-clr-l: var(--blm-txt-strong-l);\n  --blm-subtitle-strong-clr-a: var(--blm-txt-strong-a);\n  --blm-subtitle-strong-weight: var(--blm-weight-semibold);\n  --blm-input-clr: hsla(var(--blm-input-clr-h), var(--blm-input-clr-s), var(--blm-input-clr-l), var(--blm-input-clr-a));\n  --blm-input-clr-h: var(--blm-txt-strong-h);\n  --blm-input-clr-s: var(--blm-txt-strong-s);\n  --blm-input-clr-l: var(--blm-txt-strong-l);\n  --blm-bd-hov: hsla(var(--blm-bd-hov-h), var(--blm-bd-hov-s), var(--blm-bd-hov-l), var(--blm-bd-hov-a));\n  --blm-bd-hov-h: var(--blm-grey-light-h);\n  --blm-bd-hov-s: var(--blm-grey-light-s);\n  --blm-bd-hov-l: var(--blm-grey-light-l);\n  --blm-bd-hov-a: var(--blm-grey-light-a);\n  --blm-input-dsbl-clr: hsla(var(--blm-input-dsbl-clr-h), var(--blm-input-dsbl-clr-s), var(--blm-input-dsbl-clr-l), var(--blm-input-dsbl-clr-a));\n  --blm-input-dsbl-clr-h: var(--blm-txt-light-h);\n  --blm-input-dsbl-clr-s: var(--blm-txt-light-s);\n  --blm-input-dsbl-clr-l: var(--blm-txt-light-l);\n  --blm-input-bg-clr: hsla(var(--blm-input-bg-clr-h), var(--blm-input-bg-clr-s), var(--blm-input-bg-clr-l), var(--blm-input-bg-clr-a));\n  --blm-input-bg-clr-h: var(--blm-sch-main-h);\n  --blm-input-bg-clr-s: var(--blm-sch-main-s);\n  --blm-input-bg-clr-l: var(--blm-sch-main-l);\n  --blm-input-bg-clr-a: var(--blm-sch-main-a);\n  --blm-input-bd-clr: hsla(var(--blm-input-bd-clr-h), var(--blm-input-bd-clr-s), var(--blm-input-bd-clr-l), var(--blm-input-bd-clr-a));\n  --blm-input-bd-clr-h: var(--blm-bd-h);\n  --blm-input-bd-clr-s: var(--blm-bd-s);\n  --blm-input-bd-clr-l: var(--blm-bd-l);\n  --blm-input-bd-clr-a: var(--blm-bd-a);\n  --blm-input-radius: var(--blm-radius);\n  --blm-input-clr-a: var(--blm-txt-strong-a);\n  --blm-input-placeholder-clr: hsla(var(--blm-input-placeholder-clr-h), var(--blm-input-placeholder-clr-s), var(--blm-input-placeholder-clr-l), var(--blm-input-placeholder-clr-a));\n  --blm-input-placeholder-clr-h: var(--blm-input-clr-h);\n  --blm-input-placeholder-clr-s: var(--blm-input-clr-s);\n  --blm-input-placeholder-clr-l: var(--blm-input-clr-l);\n  --blm-input-placeholder-clr-a: 0.3;\n  --blm-input-hov-bd-clr: hsla(var(--blm-input-hov-bd-clr-h), var(--blm-input-hov-bd-clr-s), var(--blm-input-hov-bd-clr-l), var(--blm-input-hov-bd-clr-a));\n  --blm-input-hov-bd-clr-h: var(--blm-bd-hov-h);\n  --blm-input-hov-bd-clr-s: var(--blm-bd-hov-s);\n  --blm-input-hov-bd-clr-l: var(--blm-bd-hov-l);\n  --blm-input-hov-bd-clr-a: var(--blm-bd-hov-a);\n  --blm-input-foc-bd-clr: hsla(var(--blm-input-foc-bd-clr-h), var(--blm-input-foc-bd-clr-s), var(--blm-input-foc-bd-clr-l), var(--blm-input-foc-bd-clr-a));\n  --blm-input-foc-bd-clr-h: var(--blm-link-h);\n  --blm-input-foc-bd-clr-s: var(--blm-link-s);\n  --blm-input-foc-bd-clr-l: var(--blm-link-l);\n  --blm-input-foc-bd-clr-a: var(--blm-link-a);\n  --blm-input-foc-box-shadow-s: 0 0 0 0.125em;\n  --blm-input-foc-box-shadow-clr: hsla(var(--blm-input-foc-box-shadow-clr-h), var(--blm-input-foc-box-shadow-clr-s), var(--blm-input-foc-box-shadow-clr-l), var(--blm-input-foc-box-shadow-clr-a));\n  --blm-input-foc-box-shadow-clr-h: var(--blm-link-h);\n  --blm-input-foc-box-shadow-clr-s: var(--blm-link-s);\n  --blm-input-foc-box-shadow-clr-l: var(--blm-link-l);\n  --blm-input-foc-box-shadow-clr-a: 0.25;\n  --blm-input-dsbl-bg-clr: hsla(var(--blm-input-dsbl-bg-clr-h), var(--blm-input-dsbl-bg-clr-s), var(--blm-input-dsbl-bg-clr-l), var(--blm-input-dsbl-bg-clr-a));\n  --blm-input-dsbl-bg-clr-h: var(--blm-bg-h);\n  --blm-input-dsbl-bg-clr-s: var(--blm-bg-s);\n  --blm-input-dsbl-bg-clr-l: var(--blm-bg-l);\n  --blm-input-dsbl-bg-clr-a: var(--blm-bg-a);\n  --blm-input-dsbl-bd-clr: hsla(var(--blm-input-dsbl-bd-clr-h), var(--blm-input-dsbl-bd-clr-s), var(--blm-input-dsbl-bd-clr-l), var(--blm-input-dsbl-bd-clr-a));\n  --blm-input-dsbl-bd-clr-h: var(--blm-bg-h);\n  --blm-input-dsbl-bd-clr-s: var(--blm-bg-s);\n  --blm-input-dsbl-bd-clr-l: var(--blm-bg-l);\n  --blm-input-dsbl-bd-clr-a: var(--blm-bg-a);\n  --blm-input-dsbl-clr-a: var(--blm-txt-light-a);\n  --blm-input-dsbl-placeholder-clr: hsla(var(--blm-input-dsbl-placeholder-clr-h), var(--blm-input-dsbl-placeholder-clr-s), var(--blm-input-dsbl-placeholder-clr-l), var(--blm-input-dsbl-placeholder-clr-a));\n  --blm-input-dsbl-placeholder-clr-h: var(--blm-input-dsbl-clr-h);\n  --blm-input-dsbl-placeholder-clr-s: var(--blm-input-dsbl-clr-s);\n  --blm-input-dsbl-placeholder-clr-l: var(--blm-input-dsbl-clr-l);\n  --blm-input-dsbl-placeholder-clr-a: 0.3;\n  --blm-input-shadow: inset 0 0.0625em 0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.05);\n  --blm-ctrl-radius-small: var(--blm-radius-small);\n  --blm-txtarea-p: var(--blm-ctrl-p-horizontal);\n  --blm-txtarea-max-height: 40em;\n  --blm-txtarea-min-height: 8em;\n  --blm-input-hov-clr: hsla(var(--blm-input-hov-clr-h), var(--blm-input-hov-clr-s), var(--blm-input-hov-clr-l), var(--blm-input-hov-clr-a));\n  --blm-input-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-input-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-input-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-input-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-input-height: var(--blm-ctrl-height);\n  --blm-input-arrow: hsla(var(--blm-input-arrow-h), var(--blm-input-arrow-s), var(--blm-input-arrow-l), var(--blm-input-arrow-a));\n  --blm-input-arrow-h: var(--blm-link-h);\n  --blm-input-arrow-s: var(--blm-link-s);\n  --blm-input-arrow-l: var(--blm-link-l);\n  --blm-input-arrow-a: var(--blm-link-a);\n  --blm-file-radius: var(--blm-radius);\n  --blm-file-cta-bg-clr: hsla(var(--blm-file-cta-bg-clr-h), var(--blm-file-cta-bg-clr-s), var(--blm-file-cta-bg-clr-l), var(--blm-file-cta-bg-clr-a));\n  --blm-file-cta-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-file-cta-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-file-cta-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-file-cta-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-file-cta-hov-clr: hsla(var(--blm-file-cta-hov-clr-h), var(--blm-file-cta-hov-clr-s), var(--blm-file-cta-hov-clr-l), var(--blm-file-cta-hov-clr-a));\n  --blm-file-cta-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-file-cta-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-file-cta-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-file-cta-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-file-name-bd-clr: hsla(var(--blm-file-name-bd-clr-h), var(--blm-file-name-bd-clr-s), var(--blm-file-name-bd-clr-l), var(--blm-file-name-bd-clr-a));\n  --blm-file-name-bd-clr-h: var(--blm-bd-h);\n  --blm-file-name-bd-clr-s: var(--blm-bd-s);\n  --blm-file-name-bd-clr-l: var(--blm-bd-l);\n  --blm-file-name-bd-clr-a: var(--blm-bd-a);\n  --blm-file-cta-act-clr: hsla(var(--blm-file-cta-act-clr-h), var(--blm-file-cta-act-clr-s), var(--blm-file-cta-act-clr-l), var(--blm-file-cta-act-clr-a));\n  --blm-file-cta-act-clr-h: var(--blm-txt-strong-h);\n  --blm-file-cta-act-clr-s: var(--blm-txt-strong-s);\n  --blm-file-cta-act-clr-l: var(--blm-txt-strong-l);\n  --blm-file-cta-act-clr-a: var(--blm-txt-strong-a);\n  --blm-file-bd-clr: hsla(var(--blm-file-bd-clr-h), var(--blm-file-bd-clr-s), var(--blm-file-bd-clr-l), var(--blm-file-bd-clr-a));\n  --blm-file-bd-clr-h: var(--blm-bd-h);\n  --blm-file-bd-clr-s: var(--blm-bd-s);\n  --blm-file-bd-clr-l: var(--blm-bd-l);\n  --blm-file-bd-clr-a: var(--blm-bd-a);\n  --blm-file-cta-clr: hsla(var(--blm-file-cta-clr-h), var(--blm-file-cta-clr-s), var(--blm-file-cta-clr-l), var(--blm-file-cta-clr-a));\n  --blm-file-cta-clr-h: var(--blm-txt-h);\n  --blm-file-cta-clr-s: var(--blm-txt-s);\n  --blm-file-cta-clr-l: var(--blm-txt-l);\n  --blm-file-cta-clr-a: var(--blm-txt-a);\n  --blm-file-name-bd-style: solid;\n  --blm-file-name-bd-width: 1px 1px 1px 0;\n  --blm-file-name-max-width: 16em;\n  --blm-label-clr: hsla(var(--blm-label-clr-h), var(--blm-label-clr-s), var(--blm-label-clr-l), var(--blm-label-clr-a));\n  --blm-label-clr-h: var(--blm-txt-strong-h);\n  --blm-label-clr-s: var(--blm-txt-strong-s);\n  --blm-label-clr-l: var(--blm-txt-strong-l);\n  --blm-label-clr-a: var(--blm-txt-strong-a);\n  --blm-label-weight: var(--blm-weight-bold);\n  --blm-help-s: var(--blm-s-small);\n  --blm-input-icon-act-clr: hsla(var(--blm-input-icon-act-clr-h), var(--blm-input-icon-act-clr-s), var(--blm-input-icon-act-clr-l), var(--blm-input-icon-act-clr-a));\n  --blm-input-icon-act-clr-h: var(--blm-txt-h);\n  --blm-input-icon-act-clr-s: var(--blm-txt-s);\n  --blm-input-icon-act-clr-l: var(--blm-txt-l);\n  --blm-input-icon-act-clr-a: var(--blm-txt-a);\n  --blm-input-icon-clr: hsla(var(--blm-input-icon-clr-h), var(--blm-input-icon-clr-s), var(--blm-input-icon-clr-l), var(--blm-input-icon-clr-a));\n  --blm-input-icon-clr-h: var(--blm-bd-h);\n  --blm-input-icon-clr-s: var(--blm-bd-s);\n  --blm-input-icon-clr-l: var(--blm-bd-l);\n  --blm-input-icon-clr-a: var(--blm-bd-a);\n  --blm-bread-itm-clr: hsla(var(--blm-bread-itm-clr-h), var(--blm-bread-itm-clr-s), var(--blm-bread-itm-clr-l), var(--blm-bread-itm-clr-a));\n  --blm-bread-itm-clr-h: var(--blm-link-h);\n  --blm-bread-itm-clr-s: var(--blm-link-s);\n  --blm-bread-itm-clr-l: var(--blm-link-l);\n  --blm-bread-itm-clr-a: var(--blm-link-a);\n  --blm-bread-itm-p-vertical: 0;\n  --blm-bread-itm-p-horizontal: 0.75em;\n  --blm-bread-itm-hov-clr: hsla(var(--blm-bread-itm-hov-clr-h), var(--blm-bread-itm-hov-clr-s), var(--blm-bread-itm-hov-clr-l), var(--blm-bread-itm-hov-clr-a));\n  --blm-bread-itm-hov-clr-h: var(--blm-link-hov-h);\n  --blm-bread-itm-hov-clr-s: var(--blm-link-hov-s);\n  --blm-bread-itm-hov-clr-l: var(--blm-link-hov-l);\n  --blm-bread-itm-hov-clr-a: var(--blm-link-hov-a);\n  --blm-bread-itm-act-clr: hsla(var(--blm-bread-itm-act-clr-h), var(--blm-bread-itm-act-clr-s), var(--blm-bread-itm-act-clr-l), var(--blm-bread-itm-act-clr-a));\n  --blm-bread-itm-act-clr-h: var(--blm-txt-strong-h);\n  --blm-bread-itm-act-clr-s: var(--blm-txt-strong-s);\n  --blm-bread-itm-act-clr-l: var(--blm-txt-strong-l);\n  --blm-bread-itm-act-clr-a: var(--blm-txt-strong-a);\n  --blm-bread-itm-separator-clr: hsla(var(--blm-bread-itm-separator-clr-h), var(--blm-bread-itm-separator-clr-s), var(--blm-bread-itm-separator-clr-l), var(--blm-bread-itm-separator-clr-a));\n  --blm-bread-itm-separator-clr-h: var(--blm-bd-hov-h);\n  --blm-bread-itm-separator-clr-s: var(--blm-bd-hov-s);\n  --blm-bread-itm-separator-clr-l: var(--blm-bd-hov-l);\n  --blm-bread-itm-separator-clr-a: var(--blm-bd-hov-a);\n  --blm-block-spacing: 1.5rem;\n  --blm-card-bg-clr: hsla(var(--blm-card-bg-clr-h), var(--blm-card-bg-clr-s), var(--blm-card-bg-clr-l), var(--blm-card-bg-clr-a));\n  --blm-card-bg-clr-h: var(--blm-sch-main-h);\n  --blm-card-bg-clr-s: var(--blm-sch-main-s);\n  --blm-card-bg-clr-l: var(--blm-sch-main-l);\n  --blm-card-bg-clr-a: var(--blm-sch-main-a);\n  --blm-card-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-card-clr: hsla(var(--blm-card-clr-h), var(--blm-card-clr-s), var(--blm-card-clr-l), var(--blm-card-clr-a));\n  --blm-card-clr-h: var(--blm-txt-h);\n  --blm-card-clr-s: var(--blm-txt-s);\n  --blm-card-clr-l: var(--blm-txt-l);\n  --blm-card-clr-a: var(--blm-txt-a);\n  --blm-card-hd-bg-clr: hsla(var(--blm-card-hd-bg-clr-h), var(--blm-card-hd-bg-clr-s), var(--blm-card-hd-bg-clr-l), var(--blm-card-hd-bg-clr-a));\n  --blm-card-hd-bg-clr-h: 0;\n  --blm-card-hd-bg-clr-s: 0%;\n  --blm-card-hd-bg-clr-l: 0%;\n  --blm-card-hd-bg-clr-a: 0;\n  --blm-card-hd-shadow: 0 0.125em 0.25em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  --blm-card-hd-clr: hsla(var(--blm-card-hd-clr-h), var(--blm-card-hd-clr-s), var(--blm-card-hd-clr-l), var(--blm-card-hd-clr-a));\n  --blm-card-hd-clr-h: var(--blm-txt-strong-h);\n  --blm-card-hd-clr-s: var(--blm-txt-strong-s);\n  --blm-card-hd-clr-l: var(--blm-txt-strong-l);\n  --blm-card-hd-clr-a: var(--blm-txt-strong-a);\n  --blm-card-hd-weight: var(--blm-weight-bold);\n  --blm-card-hd-p: 0.75rem 1rem;\n  --blm-card-ct-bg-clr: hsla(var(--blm-card-ct-bg-clr-h), var(--blm-card-ct-bg-clr-s), var(--blm-card-ct-bg-clr-l), var(--blm-card-ct-bg-clr-a));\n  --blm-card-ct-bg-clr-h: 0;\n  --blm-card-ct-bg-clr-s: 0%;\n  --blm-card-ct-bg-clr-l: 0%;\n  --blm-card-ct-bg-clr-a: 0;\n  --blm-card-ct-p: 1.5rem;\n  --blm-card-ft-bg-clr: hsla(var(--blm-card-ft-bg-clr-h), var(--blm-card-ft-bg-clr-s), var(--blm-card-ft-bg-clr-l), var(--blm-card-ft-bg-clr-a));\n  --blm-card-ft-bg-clr-h: 0;\n  --blm-card-ft-bg-clr-s: 0%;\n  --blm-card-ft-bg-clr-l: 0%;\n  --blm-card-ft-bg-clr-a: 0;\n  --blm-card-ft-bd-top: 1px solid var(--blm-bd-light);\n  --blm-card-ft-p: 0.75rem;\n  --blm-card-media-m: var(--blm-block-spacing);\n  --blm-drp-ct-offset: 4px;\n  --blm-drp-menu-min-width: 12rem;\n  --blm-drp-ct-z: 20;\n  --blm-drp-ct-bg-clr: hsla(var(--blm-drp-ct-bg-clr-h), var(--blm-drp-ct-bg-clr-s), var(--blm-drp-ct-bg-clr-l), var(--blm-drp-ct-bg-clr-a));\n  --blm-drp-ct-bg-clr-h: var(--blm-sch-main-h);\n  --blm-drp-ct-bg-clr-s: var(--blm-sch-main-s);\n  --blm-drp-ct-bg-clr-l: var(--blm-sch-main-l);\n  --blm-drp-ct-bg-clr-a: var(--blm-sch-main-a);\n  --blm-drp-ct-radius: var(--blm-radius);\n  --blm-drp-ct-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-drp-ct-p-bottom: 0.5rem;\n  --blm-drp-ct-p-top: 0.5rem;\n  --blm-drp-itm-clr: hsla(var(--blm-drp-itm-clr-h), var(--blm-drp-itm-clr-s), var(--blm-drp-itm-clr-l), var(--blm-drp-itm-clr-a));\n  --blm-drp-itm-clr-h: var(--blm-txt-h);\n  --blm-drp-itm-clr-s: var(--blm-txt-s);\n  --blm-drp-itm-clr-l: var(--blm-txt-l);\n  --blm-drp-itm-clr-a: var(--blm-txt-a);\n  --blm-drp-itm-hov-bg-clr: hsla(var(--blm-drp-itm-hov-bg-clr-h), var(--blm-drp-itm-hov-bg-clr-s), var(--blm-drp-itm-hov-bg-clr-l), var(--blm-drp-itm-hov-bg-clr-a));\n  --blm-drp-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-drp-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-drp-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-drp-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-drp-itm-hov-clr: hsla(var(--blm-drp-itm-hov-clr-h), var(--blm-drp-itm-hov-clr-s), var(--blm-drp-itm-hov-clr-l), var(--blm-drp-itm-hov-clr-a));\n  --blm-drp-itm-hov-clr-h: var(--blm-sch-inv-h);\n  --blm-drp-itm-hov-clr-s: var(--blm-sch-inv-s);\n  --blm-drp-itm-hov-clr-l: var(--blm-sch-inv-l);\n  --blm-drp-itm-hov-clr-a: var(--blm-sch-inv-a);\n  --blm-drp-itm-act-bg-clr: hsla(var(--blm-drp-itm-act-bg-clr-h), var(--blm-drp-itm-act-bg-clr-s), var(--blm-drp-itm-act-bg-clr-l), var(--blm-drp-itm-act-bg-clr-a));\n  --blm-drp-itm-act-bg-clr-h: var(--blm-link-h);\n  --blm-drp-itm-act-bg-clr-s: var(--blm-link-s);\n  --blm-drp-itm-act-bg-clr-l: var(--blm-link-l);\n  --blm-drp-itm-act-bg-clr-a: var(--blm-link-a);\n  --blm-drp-itm-act-clr: hsla(var(--blm-drp-itm-act-clr-h), var(--blm-drp-itm-act-clr-s), var(--blm-drp-itm-act-clr-l), var(--blm-drp-itm-act-clr-a));\n  --blm-drp-itm-act-clr-h: var(--blm-link-inv-h);\n  --blm-drp-itm-act-clr-s: var(--blm-link-inv-s);\n  --blm-drp-itm-act-clr-l: var(--blm-link-inv-l);\n  --blm-drp-itm-act-clr-a: var(--blm-link-inv-a);\n  --blm-drp-dvd-bg-clr: hsla(var(--blm-drp-dvd-bg-clr-h), var(--blm-drp-dvd-bg-clr-s), var(--blm-drp-dvd-bg-clr-l), var(--blm-drp-dvd-bg-clr-a));\n  --blm-drp-dvd-bg-clr-h: var(--blm-bd-light-h);\n  --blm-drp-dvd-bg-clr-s: var(--blm-bd-light-s);\n  --blm-drp-dvd-bg-clr-l: var(--blm-bd-light-l);\n  --blm-drp-dvd-bg-clr-a: var(--blm-bd-light-a);\n  --blm-level-itm-spacing: calc(var(--blm-block-spacing)/2);\n  --blm-media-bd-clr: hsla(var(--blm-media-bd-clr-h), var(--blm-media-bd-clr-s), var(--blm-media-bd-clr-l), var(--blm-media-bd-clr-a));\n  --blm-media-bd-clr-h: var(--blm-bd-h);\n  --blm-media-bd-clr-s: var(--blm-bd-s);\n  --blm-media-bd-clr-l: var(--blm-bd-l);\n  --blm-media-bd-clr-a: 0.5;\n  --blm-media-spacing: 1rem;\n  --blm-media-spacing-lg: 1.5rem;\n  --blm-menu-list-line-height: 1.25;\n  --blm-menu-itm-radius: var(--blm-radius-small);\n  --blm-menu-itm-clr: hsla(var(--blm-menu-itm-clr-h), var(--blm-menu-itm-clr-s), var(--blm-menu-itm-clr-l), var(--blm-menu-itm-clr-a));\n  --blm-menu-itm-clr-h: var(--blm-txt-h);\n  --blm-menu-itm-clr-s: var(--blm-txt-s);\n  --blm-menu-itm-clr-l: var(--blm-txt-l);\n  --blm-menu-itm-clr-a: var(--blm-txt-a);\n  --blm-menu-list-link-p: 0.5em 0.75em;\n  --blm-menu-itm-hov-bg-clr: hsla(var(--blm-menu-itm-hov-bg-clr-h), var(--blm-menu-itm-hov-bg-clr-s), var(--blm-menu-itm-hov-bg-clr-l), var(--blm-menu-itm-hov-bg-clr-a));\n  --blm-menu-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-menu-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-menu-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-menu-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-menu-itm-hov-clr: hsla(var(--blm-menu-itm-hov-clr-h), var(--blm-menu-itm-hov-clr-s), var(--blm-menu-itm-hov-clr-l), var(--blm-menu-itm-hov-clr-a));\n  --blm-menu-itm-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-menu-itm-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-menu-itm-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-menu-itm-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-menu-itm-act-bg-clr: hsla(var(--blm-menu-itm-act-bg-clr-h), var(--blm-menu-itm-act-bg-clr-s), var(--blm-menu-itm-act-bg-clr-l), var(--blm-menu-itm-act-bg-clr-a));\n  --blm-menu-itm-act-bg-clr-h: var(--blm-link-h);\n  --blm-menu-itm-act-bg-clr-s: var(--blm-link-s);\n  --blm-menu-itm-act-bg-clr-l: var(--blm-link-l);\n  --blm-menu-itm-act-bg-clr-a: var(--blm-link-a);\n  --blm-menu-itm-act-clr: hsla(var(--blm-menu-itm-act-clr-h), var(--blm-menu-itm-act-clr-s), var(--blm-menu-itm-act-clr-l), var(--blm-menu-itm-act-clr-a));\n  --blm-menu-itm-act-clr-h: var(--blm-link-inv-h);\n  --blm-menu-itm-act-clr-s: var(--blm-link-inv-s);\n  --blm-menu-itm-act-clr-l: var(--blm-link-inv-l);\n  --blm-menu-itm-act-clr-a: var(--blm-link-inv-a);\n  --blm-menu-list-bd-left: 1px solid var(--blm-bd);\n  --blm-menu-nested-list-m: 0.75em;\n  --blm-menu-nested-list-p-left: 0.75em;\n  --blm-menu-label-clr: hsla(var(--blm-menu-label-clr-h), var(--blm-menu-label-clr-s), var(--blm-menu-label-clr-l), var(--blm-menu-label-clr-a));\n  --blm-menu-label-clr-h: var(--blm-txt-light-h);\n  --blm-menu-label-clr-s: var(--blm-txt-light-s);\n  --blm-menu-label-clr-l: var(--blm-txt-light-l);\n  --blm-menu-label-clr-a: var(--blm-txt-light-a);\n  --blm-menu-label-font-s: 0.75em;\n  --blm-menu-label-letter-spacing: 0.1em;\n  --blm-menu-label-spacing: 1em;\n  --blm-txt-inv: hsla(var(--blm-txt-inv-h), var(--blm-txt-inv-s), var(--blm-txt-inv-l), var(--blm-txt-inv-a));\n  --blm-txt-inv-h: 0;\n  --blm-txt-inv-s: 0%;\n  --blm-txt-inv-l: 100%;\n  --blm-txt-inv-a: 1;\n  --blm-msg-bg-clr: hsla(var(--blm-msg-bg-clr-h), var(--blm-msg-bg-clr-s), var(--blm-msg-bg-clr-l), var(--blm-msg-bg-clr-a));\n  --blm-msg-bg-clr-h: var(--blm-bg-h);\n  --blm-msg-bg-clr-s: var(--blm-bg-s);\n  --blm-msg-bg-clr-l: var(--blm-bg-l);\n  --blm-msg-bg-clr-a: var(--blm-bg-a);\n  --blm-msg-radius: var(--blm-radius);\n  --blm-msg-hd-bg-clr: hsla(var(--blm-msg-hd-bg-clr-h), var(--blm-msg-hd-bg-clr-s), var(--blm-msg-hd-bg-clr-l), var(--blm-msg-hd-bg-clr-a));\n  --blm-msg-hd-bg-clr-h: var(--blm-txt-h);\n  --blm-msg-hd-bg-clr-s: var(--blm-txt-s);\n  --blm-msg-hd-bg-clr-l: var(--blm-txt-l);\n  --blm-msg-hd-bg-clr-a: var(--blm-txt-a);\n  --blm-msg-hd-radius: var(--blm-radius);\n  --blm-msg-hd-clr: hsla(var(--blm-msg-hd-clr-h), var(--blm-msg-hd-clr-s), var(--blm-msg-hd-clr-l), var(--blm-msg-hd-clr-a));\n  --blm-msg-hd-clr-h: var(--blm-txt-inv-h);\n  --blm-msg-hd-clr-s: var(--blm-txt-inv-s);\n  --blm-msg-hd-clr-l: var(--blm-txt-inv-l);\n  --blm-msg-hd-clr-a: var(--blm-txt-inv-a);\n  --blm-msg-hd-weight: var(--blm-weight-bold);\n  --blm-msg-hd-p: 0.75em 1em;\n  --blm-msg-hd-body-bd-width: 0;\n  --blm-msg-body-bd-clr: hsla(var(--blm-msg-body-bd-clr-h), var(--blm-msg-body-bd-clr-s), var(--blm-msg-body-bd-clr-l), var(--blm-msg-body-bd-clr-a));\n  --blm-msg-body-bd-clr-h: var(--blm-bd-h);\n  --blm-msg-body-bd-clr-s: var(--blm-bd-s);\n  --blm-msg-body-bd-clr-l: var(--blm-bd-l);\n  --blm-msg-body-bd-clr-a: var(--blm-bd-a);\n  --blm-msg-body-radius: var(--blm-radius);\n  --blm-msg-body-bd-width: 0 0 0 4px;\n  --blm-msg-body-clr: hsla(var(--blm-msg-body-clr-h), var(--blm-msg-body-clr-s), var(--blm-msg-body-clr-l), var(--blm-msg-body-clr-a));\n  --blm-msg-body-clr-h: var(--blm-txt-h);\n  --blm-msg-body-clr-s: var(--blm-txt-s);\n  --blm-msg-body-clr-l: var(--blm-txt-l);\n  --blm-msg-body-clr-a: var(--blm-txt-a);\n  --blm-msg-body-p: 1.25em 1.5em;\n  --blm-msg-body-pre-bg-clr: hsla(var(--blm-msg-body-pre-bg-clr-h), var(--blm-msg-body-pre-bg-clr-s), var(--blm-msg-body-pre-bg-clr-l), var(--blm-msg-body-pre-bg-clr-a));\n  --blm-msg-body-pre-bg-clr-h: var(--blm-sch-main-h);\n  --blm-msg-body-pre-bg-clr-s: var(--blm-sch-main-s);\n  --blm-msg-body-pre-bg-clr-l: var(--blm-sch-main-l);\n  --blm-msg-body-pre-bg-clr-a: var(--blm-sch-main-a);\n  --blm-msg-body-pre-code-bg-clr: hsla(var(--blm-msg-body-pre-code-bg-clr-h), var(--blm-msg-body-pre-code-bg-clr-s), var(--blm-msg-body-pre-code-bg-clr-l), var(--blm-msg-body-pre-code-bg-clr-a));\n  --blm-msg-body-pre-code-bg-clr-h: 0;\n  --blm-msg-body-pre-code-bg-clr-s: 0%;\n  --blm-msg-body-pre-code-bg-clr-l: 0%;\n  --blm-msg-body-pre-code-bg-clr-a: 0;\n  --blm-modal-z: 40;\n  --blm-modal-bg-bg-clr: hsla(var(--blm-modal-bg-bg-clr-h), var(--blm-modal-bg-bg-clr-s), var(--blm-modal-bg-bg-clr-l), var(--blm-modal-bg-bg-clr-a));\n  --blm-modal-bg-bg-clr-h: var(--blm-sch-inv-h);\n  --blm-modal-bg-bg-clr-s: var(--blm-sch-inv-s);\n  --blm-modal-bg-bg-clr-l: var(--blm-sch-inv-l);\n  --blm-modal-bg-bg-clr-a: 0.86;\n  --blm-modal-ct-m-mobile: 20px;\n  --blm-modal-ct-spacing-mobile: 160px;\n  --blm-modal-ct-spacing-tablet: 40px;\n  --blm-modal-ct-width: 640px;\n  --blm-modal-close-dim: 40px;\n  --blm-modal-close-right: 20px;\n  --blm-modal-close-top: 20px;\n  --blm-modal-card-spacing: 40px;\n  --blm-modal-card-head-bg-clr: hsla(var(--blm-modal-card-head-bg-clr-h), var(--blm-modal-card-head-bg-clr-s), var(--blm-modal-card-head-bg-clr-l), var(--blm-modal-card-head-bg-clr-a));\n  --blm-modal-card-head-bg-clr-h: var(--blm-bg-h);\n  --blm-modal-card-head-bg-clr-s: var(--blm-bg-s);\n  --blm-modal-card-head-bg-clr-l: var(--blm-bg-l);\n  --blm-modal-card-head-bg-clr-a: var(--blm-bg-a);\n  --blm-modal-card-head-p: 20px;\n  --blm-modal-card-head-bd-bottom: 1px solid var(--blm-bd);\n  --blm-modal-card-head-radius: var(--blm-radius-lg);\n  --blm-modal-card-title-clr: hsla(var(--blm-modal-card-title-clr-h), var(--blm-modal-card-title-clr-s), var(--blm-modal-card-title-clr-l), var(--blm-modal-card-title-clr-a));\n  --blm-modal-card-title-clr-h: var(--blm-txt-strong-h);\n  --blm-modal-card-title-clr-s: var(--blm-txt-strong-s);\n  --blm-modal-card-title-clr-l: var(--blm-txt-strong-l);\n  --blm-modal-card-title-clr-a: var(--blm-txt-strong-a);\n  --blm-modal-card-title-s: var(--blm-s-4);\n  --blm-modal-card-title-line-height: 1;\n  --blm-modal-card-foot-radius: var(--blm-radius-lg);\n  --blm-modal-card-foot-bd-top: 1px solid var(--blm-bd);\n  --blm-modal-card-body-bg-clr: hsla(var(--blm-modal-card-body-bg-clr-h), var(--blm-modal-card-body-bg-clr-s), var(--blm-modal-card-body-bg-clr-l), var(--blm-modal-card-body-bg-clr-a));\n  --blm-modal-card-body-bg-clr-h: var(--blm-sch-main-h);\n  --blm-modal-card-body-bg-clr-s: var(--blm-sch-main-s);\n  --blm-modal-card-body-bg-clr-l: var(--blm-sch-main-l);\n  --blm-modal-card-body-bg-clr-a: var(--blm-sch-main-a);\n  --blm-modal-card-body-p: 20px;\n  --blm-nav-itm-clr: hsla(var(--blm-nav-itm-clr-h), var(--blm-nav-itm-clr-s), var(--blm-nav-itm-clr-l), var(--blm-nav-itm-clr-a));\n  --blm-nav-itm-clr-h: var(--blm-txt-h);\n  --blm-nav-itm-clr-s: var(--blm-txt-s);\n  --blm-nav-itm-clr-l: var(--blm-txt-l);\n  --blm-nav-itm-clr-a: var(--blm-txt-a);\n  --blm-nav-bg-clr: hsla(var(--blm-nav-bg-clr-h), var(--blm-nav-bg-clr-s), var(--blm-nav-bg-clr-l), var(--blm-nav-bg-clr-a));\n  --blm-nav-bg-clr-h: var(--blm-sch-main-h);\n  --blm-nav-bg-clr-s: var(--blm-sch-main-s);\n  --blm-nav-bg-clr-l: var(--blm-sch-main-l);\n  --blm-nav-bg-clr-a: var(--blm-sch-main-a);\n  --blm-nav-height: 3.25rem;\n  --blm-nav-z: 30;\n  --blm-nav-box-shadow-s: 0 2px 0 0;\n  --blm-nav-box-shadow-clr: hsla(var(--blm-nav-box-shadow-clr-h), var(--blm-nav-box-shadow-clr-s), var(--blm-nav-box-shadow-clr-l), var(--blm-nav-box-shadow-clr-a));\n  --blm-nav-box-shadow-clr-h: var(--blm-bg-h);\n  --blm-nav-box-shadow-clr-s: var(--blm-bg-s);\n  --blm-nav-box-shadow-clr-l: var(--blm-bg-l);\n  --blm-nav-box-shadow-clr-a: var(--blm-bg-a);\n  --blm-nav-fixed-z: 30;\n  --blm-nav-bottom-box-shadow-s: 0 -2px 0 0;\n  --blm-nav-burger-clr: hsla(var(--blm-nav-burger-clr-h), var(--blm-nav-burger-clr-s), var(--blm-nav-burger-clr-l), var(--blm-nav-burger-clr-a));\n  --blm-nav-burger-clr-h: var(--blm-nav-itm-clr-h);\n  --blm-nav-burger-clr-s: var(--blm-nav-itm-clr-s);\n  --blm-nav-burger-clr-l: var(--blm-nav-itm-clr-l);\n  --blm-nav-burger-clr-a: var(--blm-nav-itm-clr-a);\n  --blm-speed: 86ms;\n  --blm-easing: ease-out;\n  --blm-nav-itm-hov-bg-clr: hsla(var(--blm-nav-itm-hov-bg-clr-h), var(--blm-nav-itm-hov-bg-clr-s), var(--blm-nav-itm-hov-bg-clr-l), var(--blm-nav-itm-hov-bg-clr-a));\n  --blm-nav-itm-hov-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-nav-itm-hov-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-nav-itm-hov-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-nav-itm-hov-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-nav-itm-hov-clr: hsla(var(--blm-nav-itm-hov-clr-h), var(--blm-nav-itm-hov-clr-s), var(--blm-nav-itm-hov-clr-l), var(--blm-nav-itm-hov-clr-a));\n  --blm-nav-itm-hov-clr-h: var(--blm-link-h);\n  --blm-nav-itm-hov-clr-s: var(--blm-link-s);\n  --blm-nav-itm-hov-clr-l: var(--blm-link-l);\n  --blm-nav-itm-hov-clr-a: var(--blm-link-a);\n  --blm-nav-itm-img-max-height: 1.75rem;\n  --blm-nav-tab-hov-bg-clr: hsla(var(--blm-nav-tab-hov-bg-clr-h), var(--blm-nav-tab-hov-bg-clr-s), var(--blm-nav-tab-hov-bg-clr-l), var(--blm-nav-tab-hov-bg-clr-a));\n  --blm-nav-tab-hov-bg-clr-h: 0;\n  --blm-nav-tab-hov-bg-clr-s: 0%;\n  --blm-nav-tab-hov-bg-clr-l: 0%;\n  --blm-nav-tab-hov-bg-clr-a: 0;\n  --blm-nav-tab-hov-bd-bottom-clr: hsla(var(--blm-nav-tab-hov-bd-bottom-clr-h), var(--blm-nav-tab-hov-bd-bottom-clr-s), var(--blm-nav-tab-hov-bd-bottom-clr-l), var(--blm-nav-tab-hov-bd-bottom-clr-a));\n  --blm-nav-tab-hov-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-nav-tab-hov-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-nav-tab-hov-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-nav-tab-hov-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-nav-tab-act-bg-clr: hsla(var(--blm-nav-tab-act-bg-clr-h), var(--blm-nav-tab-act-bg-clr-s), var(--blm-nav-tab-act-bg-clr-l), var(--blm-nav-tab-act-bg-clr-a));\n  --blm-nav-tab-act-bg-clr-h: 0;\n  --blm-nav-tab-act-bg-clr-s: 0%;\n  --blm-nav-tab-act-bg-clr-l: 0%;\n  --blm-nav-tab-act-bg-clr-a: 0;\n  --blm-nav-tab-act-bd-bottom-clr: hsla(var(--blm-nav-tab-act-bd-bottom-clr-h), var(--blm-nav-tab-act-bd-bottom-clr-s), var(--blm-nav-tab-act-bd-bottom-clr-l), var(--blm-nav-tab-act-bd-bottom-clr-a));\n  --blm-nav-tab-act-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-nav-tab-act-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-nav-tab-act-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-nav-tab-act-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-nav-tab-act-bd-bottom-style: solid;\n  --blm-nav-tab-act-bd-bottom-width: 3px;\n  --blm-nav-tab-act-clr: hsla(var(--blm-nav-tab-act-clr-h), var(--blm-nav-tab-act-clr-s), var(--blm-nav-tab-act-clr-l), var(--blm-nav-tab-act-clr-a));\n  --blm-nav-tab-act-clr-h: var(--blm-link-h);\n  --blm-nav-tab-act-clr-s: var(--blm-link-s);\n  --blm-nav-tab-act-clr-l: var(--blm-link-l);\n  --blm-nav-tab-act-clr-a: var(--blm-link-a);\n  --blm-nav-drp-arrow: hsla(var(--blm-nav-drp-arrow-h), var(--blm-nav-drp-arrow-s), var(--blm-nav-drp-arrow-l), var(--blm-nav-drp-arrow-a));\n  --blm-nav-drp-arrow-h: var(--blm-link-h);\n  --blm-nav-drp-arrow-s: var(--blm-link-s);\n  --blm-nav-drp-arrow-l: var(--blm-link-l);\n  --blm-nav-drp-arrow-a: var(--blm-link-a);\n  --blm-nav-dvd-bg-clr: hsla(var(--blm-nav-dvd-bg-clr-h), var(--blm-nav-dvd-bg-clr-s), var(--blm-nav-dvd-bg-clr-l), var(--blm-nav-dvd-bg-clr-a));\n  --blm-nav-dvd-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-dvd-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-dvd-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-dvd-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-dvd-height: 2px;\n  --blm-nav-p-vertical: 1rem;\n  --blm-nav-p-horizontal: 2rem;\n  --blm-nav-drp-itm-hov-bg-clr: hsla(var(--blm-nav-drp-itm-hov-bg-clr-h), var(--blm-nav-drp-itm-hov-bg-clr-s), var(--blm-nav-drp-itm-hov-bg-clr-l), var(--blm-nav-drp-itm-hov-bg-clr-a));\n  --blm-nav-drp-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-drp-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-drp-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-drp-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-drp-itm-hov-clr: hsla(var(--blm-nav-drp-itm-hov-clr-h), var(--blm-nav-drp-itm-hov-clr-s), var(--blm-nav-drp-itm-hov-clr-l), var(--blm-nav-drp-itm-hov-clr-a));\n  --blm-nav-drp-itm-hov-clr-h: var(--blm-sch-inv-h);\n  --blm-nav-drp-itm-hov-clr-s: var(--blm-sch-inv-s);\n  --blm-nav-drp-itm-hov-clr-l: var(--blm-sch-inv-l);\n  --blm-nav-drp-itm-hov-clr-a: var(--blm-sch-inv-a);\n  --blm-nav-drp-itm-act-bg-clr: hsla(var(--blm-nav-drp-itm-act-bg-clr-h), var(--blm-nav-drp-itm-act-bg-clr-s), var(--blm-nav-drp-itm-act-bg-clr-l), var(--blm-nav-drp-itm-act-bg-clr-a));\n  --blm-nav-drp-itm-act-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-drp-itm-act-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-drp-itm-act-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-drp-itm-act-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-drp-itm-act-clr: hsla(var(--blm-nav-drp-itm-act-clr-h), var(--blm-nav-drp-itm-act-clr-s), var(--blm-nav-drp-itm-act-clr-l), var(--blm-nav-drp-itm-act-clr-a));\n  --blm-nav-drp-itm-act-clr-h: var(--blm-link-h);\n  --blm-nav-drp-itm-act-clr-s: var(--blm-link-s);\n  --blm-nav-drp-itm-act-clr-l: var(--blm-link-l);\n  --blm-nav-drp-itm-act-clr-a: var(--blm-link-a);\n  --blm-nav-drp-bd-top: 2px solid var(--blm-bd);\n  --blm-nav-drp-radius: var(--blm-radius-lg);\n  --blm-nav-drp-bg-clr: hsla(var(--blm-nav-drp-bg-clr-h), var(--blm-nav-drp-bg-clr-s), var(--blm-nav-drp-bg-clr-l), var(--blm-nav-drp-bg-clr-a));\n  --blm-nav-drp-bg-clr-h: var(--blm-sch-main-h);\n  --blm-nav-drp-bg-clr-s: var(--blm-sch-main-s);\n  --blm-nav-drp-bg-clr-l: var(--blm-sch-main-l);\n  --blm-nav-drp-bg-clr-a: var(--blm-sch-main-a);\n  --blm-nav-drp-z: 20;\n  --blm-nav-drp-boxed-radius: var(--blm-radius-lg);\n  --blm-nav-drp-boxed-shadow: 0 8px 8px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  --blm-nav-drp-offset: -4px;\n  --blm-nav-itm-act-clr: hsla(var(--blm-nav-itm-act-clr-h), var(--blm-nav-itm-act-clr-s), var(--blm-nav-itm-act-clr-l), var(--blm-nav-itm-act-clr-a));\n  --blm-nav-itm-act-clr-h: var(--blm-sch-inv-h);\n  --blm-nav-itm-act-clr-s: var(--blm-sch-inv-s);\n  --blm-nav-itm-act-clr-l: var(--blm-sch-inv-l);\n  --blm-nav-itm-act-clr-a: var(--blm-sch-inv-a);\n  --blm-nav-itm-act-bg-clr: hsla(var(--blm-nav-itm-act-bg-clr-h), var(--blm-nav-itm-act-bg-clr-s), var(--blm-nav-itm-act-bg-clr-l), var(--blm-nav-itm-act-bg-clr-a));\n  --blm-nav-itm-act-bg-clr-h: 0;\n  --blm-nav-itm-act-bg-clr-s: 0%;\n  --blm-nav-itm-act-bg-clr-l: 0%;\n  --blm-nav-itm-act-bg-clr-a: 0;\n  --blm-pag-m: -0.25rem;\n  --blm-pag-itm-font-s: 1em;\n  --blm-pag-itm-m: 0.25rem;\n  --blm-pag-itm-p-left: 0.5em;\n  --blm-pag-itm-p-right: 0.5em;\n  --blm-pag-bd-clr: hsla(var(--blm-pag-bd-clr-h), var(--blm-pag-bd-clr-s), var(--blm-pag-bd-clr-l), var(--blm-pag-bd-clr-a));\n  --blm-pag-bd-clr-h: var(--blm-bd-h);\n  --blm-pag-bd-clr-s: var(--blm-bd-s);\n  --blm-pag-bd-clr-l: var(--blm-bd-l);\n  --blm-pag-bd-clr-a: var(--blm-bd-a);\n  --blm-pag-clr: hsla(var(--blm-pag-clr-h), var(--blm-pag-clr-s), var(--blm-pag-clr-l), var(--blm-pag-clr-a));\n  --blm-pag-clr-h: var(--blm-txt-strong-h);\n  --blm-pag-clr-s: var(--blm-txt-strong-s);\n  --blm-pag-clr-l: var(--blm-txt-strong-l);\n  --blm-pag-clr-a: var(--blm-txt-strong-a);\n  --blm-pag-min-width: var(--blm-ctrl-height);\n  --blm-pag-hov-bd-clr: hsla(var(--blm-pag-hov-bd-clr-h), var(--blm-pag-hov-bd-clr-s), var(--blm-pag-hov-bd-clr-l), var(--blm-pag-hov-bd-clr-a));\n  --blm-pag-hov-bd-clr-h: var(--blm-link-hov-bd-h);\n  --blm-pag-hov-bd-clr-s: var(--blm-link-hov-bd-s);\n  --blm-pag-hov-bd-clr-l: var(--blm-link-hov-bd-l);\n  --blm-pag-hov-bd-clr-a: var(--blm-link-hov-bd-a);\n  --blm-pag-hov-clr: hsla(var(--blm-pag-hov-clr-h), var(--blm-pag-hov-clr-s), var(--blm-pag-hov-clr-l), var(--blm-pag-hov-clr-a));\n  --blm-pag-hov-clr-h: var(--blm-link-hov-h);\n  --blm-pag-hov-clr-s: var(--blm-link-hov-s);\n  --blm-pag-hov-clr-l: var(--blm-link-hov-l);\n  --blm-pag-hov-clr-a: var(--blm-link-hov-a);\n  --blm-pag-foc-bd-clr: hsla(var(--blm-pag-foc-bd-clr-h), var(--blm-pag-foc-bd-clr-s), var(--blm-pag-foc-bd-clr-l), var(--blm-pag-foc-bd-clr-a));\n  --blm-pag-foc-bd-clr-h: var(--blm-link-foc-bd-h);\n  --blm-pag-foc-bd-clr-s: var(--blm-link-foc-bd-s);\n  --blm-pag-foc-bd-clr-l: var(--blm-link-foc-bd-l);\n  --blm-pag-foc-bd-clr-a: var(--blm-link-foc-bd-a);\n  --blm-pag-shadow-inset: inset 0 1px 2px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.2);\n  --blm-pag-dsbl-bg-clr: hsla(var(--blm-pag-dsbl-bg-clr-h), var(--blm-pag-dsbl-bg-clr-s), var(--blm-pag-dsbl-bg-clr-l), var(--blm-pag-dsbl-bg-clr-a));\n  --blm-pag-dsbl-bg-clr-h: var(--blm-bd-h);\n  --blm-pag-dsbl-bg-clr-s: var(--blm-bd-s);\n  --blm-pag-dsbl-bg-clr-l: var(--blm-bd-l);\n  --blm-pag-dsbl-bg-clr-a: var(--blm-bd-a);\n  --blm-pag-dsbl-bd-clr: hsla(var(--blm-pag-dsbl-bd-clr-h), var(--blm-pag-dsbl-bd-clr-s), var(--blm-pag-dsbl-bd-clr-l), var(--blm-pag-dsbl-bd-clr-a));\n  --blm-pag-dsbl-bd-clr-h: var(--blm-bd-h);\n  --blm-pag-dsbl-bd-clr-s: var(--blm-bd-s);\n  --blm-pag-dsbl-bd-clr-l: var(--blm-bd-l);\n  --blm-pag-dsbl-bd-clr-a: var(--blm-bd-a);\n  --blm-pag-dsbl-clr: hsla(var(--blm-pag-dsbl-clr-h), var(--blm-pag-dsbl-clr-s), var(--blm-pag-dsbl-clr-l), var(--blm-pag-dsbl-clr-a));\n  --blm-pag-dsbl-clr-h: var(--blm-txt-light-h);\n  --blm-pag-dsbl-clr-s: var(--blm-txt-light-s);\n  --blm-pag-dsbl-clr-l: var(--blm-txt-light-l);\n  --blm-pag-dsbl-clr-a: var(--blm-txt-light-a);\n  --blm-pag-cur-bg-clr: hsla(var(--blm-pag-cur-bg-clr-h), var(--blm-pag-cur-bg-clr-s), var(--blm-pag-cur-bg-clr-l), var(--blm-pag-cur-bg-clr-a));\n  --blm-pag-cur-bg-clr-h: var(--blm-link-h);\n  --blm-pag-cur-bg-clr-s: var(--blm-link-s);\n  --blm-pag-cur-bg-clr-l: var(--blm-link-l);\n  --blm-pag-cur-bg-clr-a: var(--blm-link-a);\n  --blm-pag-cur-bd-clr: hsla(var(--blm-pag-cur-bd-clr-h), var(--blm-pag-cur-bd-clr-s), var(--blm-pag-cur-bd-clr-l), var(--blm-pag-cur-bd-clr-a));\n  --blm-pag-cur-bd-clr-h: var(--blm-link-h);\n  --blm-pag-cur-bd-clr-s: var(--blm-link-s);\n  --blm-pag-cur-bd-clr-l: var(--blm-link-l);\n  --blm-pag-cur-bd-clr-a: var(--blm-link-a);\n  --blm-pag-cur-clr: hsla(var(--blm-pag-cur-clr-h), var(--blm-pag-cur-clr-s), var(--blm-pag-cur-clr-l), var(--blm-pag-cur-clr-a));\n  --blm-pag-cur-clr-h: var(--blm-link-inv-h);\n  --blm-pag-cur-clr-s: var(--blm-link-inv-s);\n  --blm-pag-cur-clr-l: var(--blm-link-inv-l);\n  --blm-pag-cur-clr-a: var(--blm-link-inv-a);\n  --blm-pag-ellipsis-clr: hsla(var(--blm-pag-ellipsis-clr-h), var(--blm-pag-ellipsis-clr-s), var(--blm-pag-ellipsis-clr-l), var(--blm-pag-ellipsis-clr-a));\n  --blm-pag-ellipsis-clr-h: var(--blm-grey-light-h);\n  --blm-pag-ellipsis-clr-s: var(--blm-grey-light-s);\n  --blm-pag-ellipsis-clr-l: var(--blm-grey-light-l);\n  --blm-pag-ellipsis-clr-a: var(--blm-grey-light-a);\n  --blm-pnl-radius: var(--blm-radius-lg);\n  --blm-pnl-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-pnl-m: var(--blm-block-spacing);\n  --blm-pnl-itm-bd: 1px solid var(--blm-bd-light);\n  --blm-pnl-hdg-bg-clr: hsla(var(--blm-pnl-hdg-bg-clr-h), var(--blm-pnl-hdg-bg-clr-s), var(--blm-pnl-hdg-bg-clr-l), var(--blm-pnl-hdg-bg-clr-a));\n  --blm-pnl-hdg-bg-clr-h: var(--blm-bd-light-h);\n  --blm-pnl-hdg-bg-clr-s: var(--blm-bd-light-s);\n  --blm-pnl-hdg-bg-clr-l: var(--blm-bd-light-l);\n  --blm-pnl-hdg-bg-clr-a: var(--blm-bd-light-a);\n  --blm-pnl-hdg-clr: hsla(var(--blm-pnl-hdg-clr-h), var(--blm-pnl-hdg-clr-s), var(--blm-pnl-hdg-clr-l), var(--blm-pnl-hdg-clr-a));\n  --blm-pnl-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-pnl-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-pnl-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-pnl-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-pnl-hdg-s: 1.25em;\n  --blm-pnl-hdg-weight: var(--blm-weight-bold);\n  --blm-pnl-hdg-line-height: 1.25;\n  --blm-pnl-hdg-p: 0.75em 1em;\n  --blm-pnl-tabs-font-s: 0.875em;\n  --blm-pnl-tab-bd-bottom: 1px solid var(--blm-bd);\n  --blm-pnl-tab-act-bd-bottom-clr: hsla(var(--blm-pnl-tab-act-bd-bottom-clr-h), var(--blm-pnl-tab-act-bd-bottom-clr-s), var(--blm-pnl-tab-act-bd-bottom-clr-l), var(--blm-pnl-tab-act-bd-bottom-clr-a));\n  --blm-pnl-tab-act-bd-bottom-clr-h: var(--blm-link-act-bd-h);\n  --blm-pnl-tab-act-bd-bottom-clr-s: var(--blm-link-act-bd-s);\n  --blm-pnl-tab-act-bd-bottom-clr-l: var(--blm-link-act-bd-l);\n  --blm-pnl-tab-act-bd-bottom-clr-a: var(--blm-link-act-bd-a);\n  --blm-pnl-tab-act-clr: hsla(var(--blm-pnl-tab-act-clr-h), var(--blm-pnl-tab-act-clr-s), var(--blm-pnl-tab-act-clr-l), var(--blm-pnl-tab-act-clr-a));\n  --blm-pnl-tab-act-clr-h: var(--blm-link-act-h);\n  --blm-pnl-tab-act-clr-s: var(--blm-link-act-s);\n  --blm-pnl-tab-act-clr-l: var(--blm-link-act-l);\n  --blm-pnl-tab-act-clr-a: var(--blm-link-act-a);\n  --blm-pnl-list-itm-clr: hsla(var(--blm-pnl-list-itm-clr-h), var(--blm-pnl-list-itm-clr-s), var(--blm-pnl-list-itm-clr-l), var(--blm-pnl-list-itm-clr-a));\n  --blm-pnl-list-itm-clr-h: var(--blm-txt-h);\n  --blm-pnl-list-itm-clr-s: var(--blm-txt-s);\n  --blm-pnl-list-itm-clr-l: var(--blm-txt-l);\n  --blm-pnl-list-itm-clr-a: var(--blm-txt-a);\n  --blm-pnl-list-itm-hov-clr: hsla(var(--blm-pnl-list-itm-hov-clr-h), var(--blm-pnl-list-itm-hov-clr-s), var(--blm-pnl-list-itm-hov-clr-l), var(--blm-pnl-list-itm-hov-clr-a));\n  --blm-pnl-list-itm-hov-clr-h: var(--blm-link-h);\n  --blm-pnl-list-itm-hov-clr-s: var(--blm-link-s);\n  --blm-pnl-list-itm-hov-clr-l: var(--blm-link-l);\n  --blm-pnl-list-itm-hov-clr-a: var(--blm-link-a);\n  --blm-pnl-block-clr: hsla(var(--blm-pnl-block-clr-h), var(--blm-pnl-block-clr-s), var(--blm-pnl-block-clr-l), var(--blm-pnl-block-clr-a));\n  --blm-pnl-block-clr-h: var(--blm-txt-strong-h);\n  --blm-pnl-block-clr-s: var(--blm-txt-strong-s);\n  --blm-pnl-block-clr-l: var(--blm-txt-strong-l);\n  --blm-pnl-block-clr-a: var(--blm-txt-strong-a);\n  --blm-pnl-block-act-bd-left-clr: hsla(var(--blm-pnl-block-act-bd-left-clr-h), var(--blm-pnl-block-act-bd-left-clr-s), var(--blm-pnl-block-act-bd-left-clr-l), var(--blm-pnl-block-act-bd-left-clr-a));\n  --blm-pnl-block-act-bd-left-clr-h: var(--blm-link-h);\n  --blm-pnl-block-act-bd-left-clr-s: var(--blm-link-s);\n  --blm-pnl-block-act-bd-left-clr-l: var(--blm-link-l);\n  --blm-pnl-block-act-bd-left-clr-a: var(--blm-link-a);\n  --blm-pnl-block-act-clr: hsla(var(--blm-pnl-block-act-clr-h), var(--blm-pnl-block-act-clr-s), var(--blm-pnl-block-act-clr-l), var(--blm-pnl-block-act-clr-a));\n  --blm-pnl-block-act-clr-h: var(--blm-link-act-h);\n  --blm-pnl-block-act-clr-s: var(--blm-link-act-s);\n  --blm-pnl-block-act-clr-l: var(--blm-link-act-l);\n  --blm-pnl-block-act-clr-a: var(--blm-link-act-a);\n  --blm-pnl-block-act-icon-clr: hsla(var(--blm-pnl-block-act-icon-clr-h), var(--blm-pnl-block-act-icon-clr-s), var(--blm-pnl-block-act-icon-clr-l), var(--blm-pnl-block-act-icon-clr-a));\n  --blm-pnl-block-act-icon-clr-h: var(--blm-link-h);\n  --blm-pnl-block-act-icon-clr-s: var(--blm-link-s);\n  --blm-pnl-block-act-icon-clr-l: var(--blm-link-l);\n  --blm-pnl-block-act-icon-clr-a: var(--blm-link-a);\n  --blm-pnl-block-hov-bg-clr: hsla(var(--blm-pnl-block-hov-bg-clr-h), var(--blm-pnl-block-hov-bg-clr-s), var(--blm-pnl-block-hov-bg-clr-l), var(--blm-pnl-block-hov-bg-clr-a));\n  --blm-pnl-block-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-pnl-block-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-pnl-block-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-pnl-block-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-pnl-icon-clr: hsla(var(--blm-pnl-icon-clr-h), var(--blm-pnl-icon-clr-s), var(--blm-pnl-icon-clr-l), var(--blm-pnl-icon-clr-a));\n  --blm-pnl-icon-clr-h: var(--blm-txt-light-h);\n  --blm-pnl-icon-clr-s: var(--blm-txt-light-s);\n  --blm-pnl-icon-clr-l: var(--blm-txt-light-l);\n  --blm-pnl-icon-clr-a: var(--blm-txt-light-a);\n  --blm-tabs-bd-bottom-clr: hsla(var(--blm-tabs-bd-bottom-clr-h), var(--blm-tabs-bd-bottom-clr-s), var(--blm-tabs-bd-bottom-clr-l), var(--blm-tabs-bd-bottom-clr-a));\n  --blm-tabs-bd-bottom-clr-h: var(--blm-bd-h);\n  --blm-tabs-bd-bottom-clr-s: var(--blm-bd-s);\n  --blm-tabs-bd-bottom-clr-l: var(--blm-bd-l);\n  --blm-tabs-bd-bottom-clr-a: var(--blm-bd-a);\n  --blm-tabs-bd-bottom-style: solid;\n  --blm-tabs-bd-bottom-width: 1px;\n  --blm-tabs-link-clr: hsla(var(--blm-tabs-link-clr-h), var(--blm-tabs-link-clr-s), var(--blm-tabs-link-clr-l), var(--blm-tabs-link-clr-a));\n  --blm-tabs-link-clr-h: var(--blm-txt-h);\n  --blm-tabs-link-clr-s: var(--blm-txt-s);\n  --blm-tabs-link-clr-l: var(--blm-txt-l);\n  --blm-tabs-link-clr-a: var(--blm-txt-a);\n  --blm-tabs-link-p: 0.5em 1em;\n  --blm-tabs-link-hov-bd-bottom-clr: hsla(var(--blm-tabs-link-hov-bd-bottom-clr-h), var(--blm-tabs-link-hov-bd-bottom-clr-s), var(--blm-tabs-link-hov-bd-bottom-clr-l), var(--blm-tabs-link-hov-bd-bottom-clr-a));\n  --blm-tabs-link-hov-bd-bottom-clr-h: var(--blm-txt-strong-h);\n  --blm-tabs-link-hov-bd-bottom-clr-s: var(--blm-txt-strong-s);\n  --blm-tabs-link-hov-bd-bottom-clr-l: var(--blm-txt-strong-l);\n  --blm-tabs-link-hov-bd-bottom-clr-a: var(--blm-txt-strong-a);\n  --blm-tabs-link-hov-clr: hsla(var(--blm-tabs-link-hov-clr-h), var(--blm-tabs-link-hov-clr-s), var(--blm-tabs-link-hov-clr-l), var(--blm-tabs-link-hov-clr-a));\n  --blm-tabs-link-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-tabs-link-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-tabs-link-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-tabs-link-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-tabs-link-act-bd-bottom-clr: hsla(var(--blm-tabs-link-act-bd-bottom-clr-h), var(--blm-tabs-link-act-bd-bottom-clr-s), var(--blm-tabs-link-act-bd-bottom-clr-l), var(--blm-tabs-link-act-bd-bottom-clr-a));\n  --blm-tabs-link-act-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-tabs-link-act-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-tabs-link-act-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-tabs-link-act-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-tabs-link-act-clr: hsla(var(--blm-tabs-link-act-clr-h), var(--blm-tabs-link-act-clr-s), var(--blm-tabs-link-act-clr-l), var(--blm-tabs-link-act-clr-a));\n  --blm-tabs-link-act-clr-h: var(--blm-link-h);\n  --blm-tabs-link-act-clr-s: var(--blm-link-s);\n  --blm-tabs-link-act-clr-l: var(--blm-link-l);\n  --blm-tabs-link-act-clr-a: var(--blm-link-a);\n  --blm-tabs-boxed-link-radius: var(--blm-radius);\n  --blm-tabs-boxed-link-hov-bg-clr: hsla(var(--blm-tabs-boxed-link-hov-bg-clr-h), var(--blm-tabs-boxed-link-hov-bg-clr-s), var(--blm-tabs-boxed-link-hov-bg-clr-l), var(--blm-tabs-boxed-link-hov-bg-clr-a));\n  --blm-tabs-boxed-link-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-tabs-boxed-link-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-tabs-boxed-link-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-tabs-boxed-link-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr: hsla(var(--blm-tabs-boxed-link-hov-bd-bottom-clr-h), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-s), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-l), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-a));\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-h: var(--blm-bd-h);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-s: var(--blm-bd-s);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-l: var(--blm-bd-l);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-a: var(--blm-bd-a);\n  --blm-tabs-boxed-link-act-bg-clr: hsla(var(--blm-tabs-boxed-link-act-bg-clr-h), var(--blm-tabs-boxed-link-act-bg-clr-s), var(--blm-tabs-boxed-link-act-bg-clr-l), var(--blm-tabs-boxed-link-act-bg-clr-a));\n  --blm-tabs-boxed-link-act-bg-clr-h: var(--blm-sch-main-h);\n  --blm-tabs-boxed-link-act-bg-clr-s: var(--blm-sch-main-s);\n  --blm-tabs-boxed-link-act-bg-clr-l: var(--blm-sch-main-l);\n  --blm-tabs-boxed-link-act-bg-clr-a: var(--blm-sch-main-a);\n  --blm-tabs-boxed-link-act-bd-clr: hsla(var(--blm-tabs-boxed-link-act-bd-clr-h), var(--blm-tabs-boxed-link-act-bd-clr-s), var(--blm-tabs-boxed-link-act-bd-clr-l), var(--blm-tabs-boxed-link-act-bd-clr-a));\n  --blm-tabs-boxed-link-act-bd-clr-h: var(--blm-bd-h);\n  --blm-tabs-boxed-link-act-bd-clr-s: var(--blm-bd-s);\n  --blm-tabs-boxed-link-act-bd-clr-l: var(--blm-bd-l);\n  --blm-tabs-boxed-link-act-bd-clr-a: var(--blm-bd-a);\n  --blm-tabs-boxed-link-act-bd-bottom-clr: hsla(var(--blm-tabs-boxed-link-act-bd-bottom-clr-h), var(--blm-tabs-boxed-link-act-bd-bottom-clr-s), var(--blm-tabs-boxed-link-act-bd-bottom-clr-l), var(--blm-tabs-boxed-link-act-bd-bottom-clr-a));\n  --blm-tabs-boxed-link-act-bd-bottom-clr-h: 0;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-s: 0%;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-l: 0%;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-a: 0;\n  --blm-tabs-tgl-link-bd-clr: hsla(var(--blm-tabs-tgl-link-bd-clr-h), var(--blm-tabs-tgl-link-bd-clr-s), var(--blm-tabs-tgl-link-bd-clr-l), var(--blm-tabs-tgl-link-bd-clr-a));\n  --blm-tabs-tgl-link-bd-clr-h: var(--blm-bd-h);\n  --blm-tabs-tgl-link-bd-clr-s: var(--blm-bd-s);\n  --blm-tabs-tgl-link-bd-clr-l: var(--blm-bd-l);\n  --blm-tabs-tgl-link-bd-clr-a: var(--blm-bd-a);\n  --blm-tabs-tgl-link-bd-style: solid;\n  --blm-tabs-tgl-link-bd-width: 1px;\n  --blm-tabs-tgl-link-hov-bg-clr: hsla(var(--blm-tabs-tgl-link-hov-bg-clr-h), var(--blm-tabs-tgl-link-hov-bg-clr-s), var(--blm-tabs-tgl-link-hov-bg-clr-l), var(--blm-tabs-tgl-link-hov-bg-clr-a));\n  --blm-tabs-tgl-link-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-tabs-tgl-link-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-tabs-tgl-link-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-tabs-tgl-link-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-tabs-tgl-link-hov-bd-clr: hsla(var(--blm-tabs-tgl-link-hov-bd-clr-h), var(--blm-tabs-tgl-link-hov-bd-clr-s), var(--blm-tabs-tgl-link-hov-bd-clr-l), var(--blm-tabs-tgl-link-hov-bd-clr-a));\n  --blm-tabs-tgl-link-hov-bd-clr-h: var(--blm-bd-hov-h);\n  --blm-tabs-tgl-link-hov-bd-clr-s: var(--blm-bd-hov-s);\n  --blm-tabs-tgl-link-hov-bd-clr-l: var(--blm-bd-hov-l);\n  --blm-tabs-tgl-link-hov-bd-clr-a: var(--blm-bd-hov-a);\n  --blm-tabs-tgl-link-radius: var(--blm-radius);\n  --blm-tabs-tgl-link-act-bg-clr: hsla(var(--blm-tabs-tgl-link-act-bg-clr-h), var(--blm-tabs-tgl-link-act-bg-clr-s), var(--blm-tabs-tgl-link-act-bg-clr-l), var(--blm-tabs-tgl-link-act-bg-clr-a));\n  --blm-tabs-tgl-link-act-bg-clr-h: var(--blm-link-h);\n  --blm-tabs-tgl-link-act-bg-clr-s: var(--blm-link-s);\n  --blm-tabs-tgl-link-act-bg-clr-l: var(--blm-link-l);\n  --blm-tabs-tgl-link-act-bg-clr-a: var(--blm-link-a);\n  --blm-tabs-tgl-link-act-bd-clr: hsla(var(--blm-tabs-tgl-link-act-bd-clr-h), var(--blm-tabs-tgl-link-act-bd-clr-s), var(--blm-tabs-tgl-link-act-bd-clr-l), var(--blm-tabs-tgl-link-act-bd-clr-a));\n  --blm-tabs-tgl-link-act-bd-clr-h: var(--blm-link-h);\n  --blm-tabs-tgl-link-act-bd-clr-s: var(--blm-link-s);\n  --blm-tabs-tgl-link-act-bd-clr-l: var(--blm-link-l);\n  --blm-tabs-tgl-link-act-bd-clr-a: var(--blm-link-a);\n  --blm-tabs-tgl-link-act-clr: hsla(var(--blm-tabs-tgl-link-act-clr-h), var(--blm-tabs-tgl-link-act-clr-s), var(--blm-tabs-tgl-link-act-clr-l), var(--blm-tabs-tgl-link-act-clr-a));\n  --blm-tabs-tgl-link-act-clr-h: var(--blm-link-inv-h);\n  --blm-tabs-tgl-link-act-clr-s: var(--blm-link-inv-s);\n  --blm-tabs-tgl-link-act-clr-l: var(--blm-link-inv-l);\n  --blm-tabs-tgl-link-act-clr-a: var(--blm-link-inv-a);\n  --blm-column-gap: 0.75rem;\n  --blm-tile-spacing: 0.75rem;\n  --blm-weight-light: 300;\n  --blm-weight-medium: 500;\n  --blm-family-secondary: var(--blm-family-sans-serif);\n  --blm-hero-body-p-small: 1.5rem;\n  --blm-hero-body-p-medium: 9rem 1.5rem;\n  --blm-hero-body-p-lg: 18rem 1.5rem;\n  --blm-hero-body-p: 3rem 1.5rem;\n  --blm-sct-p: 3rem 1.5rem;\n  --blm-sct-p-medium: 9rem 1.5rem;\n  --blm-sct-p-lg: 18rem 1.5rem;\n  --blm-ft-bg-clr: hsla(var(--blm-ft-bg-clr-h), var(--blm-ft-bg-clr-s), var(--blm-ft-bg-clr-l), var(--blm-ft-bg-clr-a));\n  --blm-ft-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-ft-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-ft-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-ft-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-ft-p: 3rem 1.5rem 6rem;\n  --blm-ft-clr: inherit;\n}";
    n(css$1,{});

    var css$2 = "/* Animations */\n\n@keyframes fadeInOpacity {\n  0% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n\n@keyframes slide-in-right {\n  0% {\n    transform: translateX(-1000px);\n  }\n  100% {\n    transform: translateX(0);\n  }\n}\n\n/* Controls */\n\n/* v-sidebar */\n\n/* v-tooltip */\n\n/* v-switch */\n\n/* v-accordion */\n\n/* Messages */\n\n\n/* Table */\n\n/* Progress */";
    n(css$2,{});

    createApp(script$2).mount('#app');

}());
