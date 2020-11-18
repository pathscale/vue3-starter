
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    /**
     * Make a map and return a function for checking if a key
     * is in that map.
     * IMPORTANT: all calls of this function must be prefixed with
     * \/\*#\_\_PURE\_\_\*\/
     * So that rollup can tree-shake them if necessary.
     */
    const EMPTY_OBJ =  Object.freeze({})
        ;
    const extend = Object.assign;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = (val) => toTypeString(val) === '[object Map]';
    const isFunction = (val) => typeof val === 'function';
    const isString = (val) => typeof val === 'string';
    const isSymbol = (val) => typeof val === 'symbol';
    const isObject = (val) => val !== null && typeof val === 'object';
    const objectToString = Object.prototype.toString;
    const toTypeString = (value) => objectToString.call(value);
    const toRawType = (value) => {
        // extract "RawType" from strings like "[object RawType]"
        return toTypeString(value).slice(8, -1);
    };
    const isIntegerKey = (key) => isString(key) &&
        key !== 'NaN' &&
        key[0] !== '-' &&
        '' + parseInt(key, 10) === key;
    const cacheStringFunction = (fn) => {
        const cache = Object.create(null);
        return ((str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        });
    };
    /**
     * @private
     */
    const capitalize = cacheStringFunction((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    // compare whether a value has changed, accounting for NaN.
    const hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
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
    const ITERATE_KEY = Symbol( 'iterate' );
    const MAP_KEY_ITERATE_KEY = Symbol( 'Map key iterate' );
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
        effect.allowRecurse = !!options.allowRecurse;
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
            if ( activeEffect.options.onTrack) {
                activeEffect.options.onTrack({
                    effect: activeEffect,
                    target,
                    type,
                    key
                });
            }
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
                    if (effect !== activeEffect || effect.allowRecurse) {
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
            if ( effect.options.onTrigger) {
                effect.options.onTrigger({
                    effect,
                    target,
                    key,
                    type,
                    newValue,
                    oldValue,
                    oldTarget
                });
            }
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
            resetTracking();
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
            if (isSymbol(key)
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
                    trigger(target, "set" /* SET */, key, value, oldValue);
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
            trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
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
            {
                console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
            }
            return true;
        },
        deleteProperty(target, key) {
            {
                console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
            }
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
        else {
            checkIdentityKeys(target, has, key);
        }
        const oldValue = get.call(target, key);
        const result = target.set(key, value);
        if (!hadKey) {
            trigger(target, "add" /* ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            trigger(target, "set" /* SET */, key, value, oldValue);
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
        else {
            checkIdentityKeys(target, has, key);
        }
        const oldValue = get ? get.call(target, key) : undefined;
        // forward the operation before queueing reactions
        const result = target.delete(key);
        if (hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
        }
        return result;
    }
    function clear() {
        const target = toRaw(this);
        const hadItems = target.size !== 0;
        const oldTarget =  isMap(target)
                ? new Map(target)
                : new Set(target)
            ;
        // forward the operation before queueing reactions
        const result = target.clear();
        if (hadItems) {
            trigger(target, "clear" /* CLEAR */, undefined, undefined, oldTarget);
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
            {
                const key = args[0] ? `on key "${args[0]}" ` : ``;
                console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
            }
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
    function checkIdentityKeys(target, has, key) {
        const rawKey = toRaw(key);
        if (rawKey !== key && has.call(target, rawKey)) {
            const type = toRawType(target);
            console.warn(`Reactive ${type} contains both the raw and reactive ` +
                `versions of the same object${type === `Map` ? ` as keys` : ``}, ` +
                `which can lead to inconsistencies. ` +
                `Avoid differentiating between the raw and reactive versions ` +
                `of an object and only use the reactive version if possible.`);
        }
    }

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
    // Return a reactive-copy of the original object, where only the root level
    // properties are readonly, and does NOT unwrap refs nor recursively convert
    // returned properties.
    // This is used for creating the props proxy object for stateful components.
    function shallowReadonly(target) {
        return createReactiveObject(target, true, shallowReadonlyHandlers, readonlyCollectionHandlers);
    }
    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
        if (!isObject(target)) {
            {
                console.warn(`value cannot be made reactive: ${String(target)}`);
            }
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
    function markRaw(value) {
        def(value, "__v_skip" /* SKIP */, true);
        return value;
    }

    const convert = (val) => isObject(val) ? reactive(val) : val;
    function isRef(r) {
        return Boolean(r && r.__v_isRef === true);
    }
    function ref(value) {
        return createRef(value);
    }
    function shallowRef(value) {
        return createRef(value, true);
    }
    class RefImpl {
        constructor(_rawValue, _shallow = false) {
            this._rawValue = _rawValue;
            this._shallow = _shallow;
            this.__v_isRef = true;
            this._value = _shallow ? _rawValue : convert(_rawValue);
        }
        get value() {
            track(toRaw(this), "get" /* GET */, 'value');
            return this._value;
        }
        set value(newVal) {
            if (hasChanged(toRaw(newVal), this._rawValue)) {
                this._rawValue = newVal;
                this._value = this._shallow ? newVal : convert(newVal);
                trigger(toRaw(this), "set" /* SET */, 'value', newVal);
            }
        }
    }
    function createRef(rawValue, shallow = false) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    function triggerRef(ref) {
        trigger(toRaw(ref), "set" /* SET */, 'value',  ref.value );
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
    class CustomRefImpl {
        constructor(factory) {
            this.__v_isRef = true;
            const { get, set } = factory(() => track(this, "get" /* GET */, 'value'), () => trigger(this, "set" /* SET */, 'value'));
            this._get = get;
            this._set = set;
        }
        get value() {
            return this._get();
        }
        set value(newVal) {
            this._set(newVal);
        }
    }
    function customRef(factory) {
        return new CustomRefImpl(factory);
    }
    function toRefs(object) {
        if ( !isProxy(object)) {
            console.warn(`toRefs() expects a reactive object but received a plain one.`);
        }
        const ret = isArray(object) ? new Array(object.length) : {};
        for (const key in object) {
            ret[key] = toRef(object, key);
        }
        return ret;
    }
    class ObjectRefImpl {
        constructor(_object, _key) {
            this._object = _object;
            this._key = _key;
            this.__v_isRef = true;
        }
        get value() {
            return this._object[this._key];
        }
        set value(newVal) {
            this._object[this._key] = newVal;
        }
    }
    function toRef(object, key) {
        return isRef(object[key])
            ? object[key]
            : new ObjectRefImpl(object, key);
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
            setter =  () => {
                    console.warn('Write operation failed: computed value is readonly');
                }
                ;
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
    }

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

    function normalizeStyle(value) {
        if (isArray$1(value)) {
            const res = {};
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const normalized = normalizeStyle(isString$1(item) ? parseStringStyle(item) : item);
                if (normalized) {
                    for (const key in normalized) {
                        res[key] = normalized[key];
                    }
                }
            }
            return res;
        }
        else if (isObject$1(value)) {
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
        if (isString$1(value)) {
            res = value;
        }
        else if (isArray$1(value)) {
            for (let i = 0; i < value.length; i++) {
                res += normalizeClass(value[i]) + ' ';
            }
        }
        else if (isObject$1(value)) {
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
            : isObject$1(val)
                ? JSON.stringify(val, replacer, 2)
                : String(val);
    };
    const replacer = (_key, val) => {
        if (isMap$1(val)) {
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
        else if (isObject$1(val) && !isArray$1(val) && !isPlainObject(val)) {
            return String(val);
        }
        return val;
    };
    const EMPTY_OBJ$1 =  Object.freeze({})
        ;
    const EMPTY_ARR = [];
    const NOOP = () => { };
    /**
     * Always return false.
     */
    const NO = () => false;
    const onRE = /^on[^a-z]/;
    const isOn = (key) => onRE.test(key);
    const isModelListener = (key) => key.startsWith('onUpdate:');
    const extend$1 = Object.assign;
    const remove = (arr, el) => {
        const i = arr.indexOf(el);
        if (i > -1) {
            arr.splice(i, 1);
        }
    };
    const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    const hasOwn$1 = (val, key) => hasOwnProperty$1.call(val, key);
    const isArray$1 = Array.isArray;
    const isMap$1 = (val) => toTypeString$1(val) === '[object Map]';
    const isSet = (val) => toTypeString$1(val) === '[object Set]';
    const isFunction$1 = (val) => typeof val === 'function';
    const isString$1 = (val) => typeof val === 'string';
    const isObject$1 = (val) => val !== null && typeof val === 'object';
    const isPromise = (val) => {
        return isObject$1(val) && isFunction$1(val.then) && isFunction$1(val.catch);
    };
    const objectToString$1 = Object.prototype.toString;
    const toTypeString$1 = (value) => objectToString$1.call(value);
    const toRawType$1 = (value) => {
        // extract "RawType" from strings like "[object RawType]"
        return toTypeString$1(value).slice(8, -1);
    };
    const isPlainObject = (val) => toTypeString$1(val) === '[object Object]';
    const isReservedProp = /*#__PURE__*/ makeMap('key,ref,' +
        'onVnodeBeforeMount,onVnodeMounted,' +
        'onVnodeBeforeUpdate,onVnodeUpdated,' +
        'onVnodeBeforeUnmount,onVnodeUnmounted');
    const cacheStringFunction$1 = (fn) => {
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
    const camelize = cacheStringFunction$1((str) => {
        return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
    });
    const hyphenateRE = /\B([A-Z])/g;
    /**
     * @private
     */
    const hyphenate = cacheStringFunction$1((str) => {
        return str.replace(hyphenateRE, '-$1').toLowerCase();
    });
    /**
     * @private
     */
    const capitalize$1 = cacheStringFunction$1((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    // compare whether a value has changed, accounting for NaN.
    const hasChanged$1 = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
    const invokeArrayFns = (fns, arg) => {
        for (let i = 0; i < fns.length; i++) {
            fns[i](arg);
        }
    };
    const def$1 = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };
    const toNumber = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? val : n;
    };

    const stack = [];
    function pushWarningContext(vnode) {
        stack.push(vnode);
    }
    function popWarningContext() {
        stack.pop();
    }
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
        if (isString$1(value)) {
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
        else if (isFunction$1(value)) {
            return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
        }
        else {
            value = toRaw(value);
            return raw ? value : [`${key}=`, value];
        }
    }

    const ErrorTypeStrings = {
        ["bc" /* BEFORE_CREATE */]: 'beforeCreate hook',
        ["c" /* CREATED */]: 'created hook',
        ["bm" /* BEFORE_MOUNT */]: 'beforeMount hook',
        ["m" /* MOUNTED */]: 'mounted hook',
        ["bu" /* BEFORE_UPDATE */]: 'beforeUpdate hook',
        ["u" /* UPDATED */]: 'updated',
        ["bum" /* BEFORE_UNMOUNT */]: 'beforeUnmount hook',
        ["um" /* UNMOUNTED */]: 'unmounted hook',
        ["a" /* ACTIVATED */]: 'activated hook',
        ["da" /* DEACTIVATED */]: 'deactivated hook',
        ["ec" /* ERROR_CAPTURED */]: 'errorCaptured hook',
        ["rtc" /* RENDER_TRACKED */]: 'renderTracked hook',
        ["rtg" /* RENDER_TRIGGERED */]: 'renderTriggered hook',
        [0 /* SETUP_FUNCTION */]: 'setup function',
        [1 /* RENDER_FUNCTION */]: 'render function',
        [2 /* WATCH_GETTER */]: 'watcher getter',
        [3 /* WATCH_CALLBACK */]: 'watcher callback',
        [4 /* WATCH_CLEANUP */]: 'watcher cleanup function',
        [5 /* NATIVE_EVENT_HANDLER */]: 'native event handler',
        [6 /* COMPONENT_EVENT_HANDLER */]: 'component event handler',
        [7 /* VNODE_HOOK */]: 'vnode hook',
        [8 /* DIRECTIVE_HOOK */]: 'directive hook',
        [9 /* TRANSITION_HOOK */]: 'transition hook',
        [10 /* APP_ERROR_HANDLER */]: 'app errorHandler',
        [11 /* APP_WARN_HANDLER */]: 'app warnHandler',
        [12 /* FUNCTION_REF */]: 'ref function',
        [13 /* ASYNC_COMPONENT_LOADER */]: 'async component loader',
        [14 /* SCHEDULER */]: 'scheduler flush. This is likely a Vue internals bug. ' +
            'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next'
    };
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
        if (isFunction$1(fn)) {
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
            const errorInfo =  ErrorTypeStrings[type] ;
            while (cur) {
                const errorCapturedHooks = cur.ec;
                if (errorCapturedHooks) {
                    for (let i = 0; i < errorCapturedHooks.length; i++) {
                        if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
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
            const info = ErrorTypeStrings[type];
            if (contextVNode) {
                pushWarningContext(contextVNode);
            }
            warn(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
            if (contextVNode) {
                popWarningContext();
            }
            // crash in dev by default so it's more noticeable
            if (throwInDev) {
                throw err;
            }
            else {
                console.error(err);
            }
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
        return fn ? p.then(this ? fn.bind(this) : fn) : p;
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
        if (!isArray$1(cb)) {
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
    function queuePreFlushCb(cb) {
        queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
    }
    function queuePostFlushCb(cb) {
        queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
    }
    function flushPreFlushCbs(seen, parentJob = null) {
        if (pendingPreFlushCbs.length) {
            currentPreFlushParentJob = parentJob;
            activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
            pendingPreFlushCbs.length = 0;
            {
                seen = seen || new Map();
            }
            for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
                {
                    checkRecursiveUpdates(seen, activePreFlushCbs[preFlushIndex]);
                }
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
            {
                seen = seen || new Map();
            }
            activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
            for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
                {
                    checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex]);
                }
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
        {
            seen = seen || new Map();
        }
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
                    if (("development" !== 'production')) {
                        checkRecursiveUpdates(seen, job);
                    }
                    callWithErrorHandling(job, null, 14 /* SCHEDULER */);
                }
            }
        }
        finally {
            flushIndex = 0;
            queue.length = 0;
            flushPostFlushCbs(seen);
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

    /* eslint-disable no-restricted-globals */
    let isHmrUpdating = false;
    const hmrDirtyComponents = new Set();
    // Expose the HMR runtime on the global object
    // This makes it entirely tree-shakable without polluting the exports and makes
    // it easier to be used in toolings like vue-loader
    // Note: for a component to be eligible for HMR it also needs the __hmrId option
    // to be set so that its instances can be registered / removed.
    {
        const globalObject = typeof global !== 'undefined'
            ? global
            : typeof self !== 'undefined'
                ? self
                : typeof window !== 'undefined'
                    ? window
                    : {};
        globalObject.__VUE_HMR_RUNTIME__ = {
            createRecord: tryWrap(createRecord),
            rerender: tryWrap(rerender),
            reload: tryWrap(reload)
        };
    }
    const map = new Map();
    function registerHMR(instance) {
        const id = instance.type.__hmrId;
        let record = map.get(id);
        if (!record) {
            createRecord(id);
            record = map.get(id);
        }
        record.add(instance);
    }
    function unregisterHMR(instance) {
        map.get(instance.type.__hmrId).delete(instance);
    }
    function createRecord(id) {
        if (map.has(id)) {
            return false;
        }
        map.set(id, new Set());
        return true;
    }
    function rerender(id, newRender) {
        const record = map.get(id);
        if (!record)
            return;
        // Array.from creates a snapshot which avoids the set being mutated during
        // updates
        Array.from(record).forEach(instance => {
            if (newRender) {
                instance.render = newRender;
            }
            instance.renderCache = [];
            // this flag forces child components with slot content to update
            isHmrUpdating = true;
            instance.update();
            isHmrUpdating = false;
        });
    }
    function reload(id, newComp) {
        const record = map.get(id);
        if (!record)
            return;
        // Array.from creates a snapshot which avoids the set being mutated during
        // updates
        Array.from(record).forEach(instance => {
            const comp = instance.type;
            if (!hmrDirtyComponents.has(comp)) {
                // 1. Update existing comp definition to match new one
                newComp = isClassComponent(newComp) ? newComp.__vccOpts : newComp;
                extend$1(comp, newComp);
                for (const key in comp) {
                    if (!(key in newComp)) {
                        delete comp[key];
                    }
                }
                // 2. Mark component dirty. This forces the renderer to replace the component
                // on patch.
                hmrDirtyComponents.add(comp);
                // 3. Make sure to unmark the component after the reload.
                queuePostFlushCb(() => {
                    hmrDirtyComponents.delete(comp);
                });
            }
            if (instance.parent) {
                // 4. Force the parent instance to re-render. This will cause all updated
                // components to be unmounted and re-mounted. Queue the update so that we
                // don't end up forcing the same parent to re-render multiple times.
                queueJob(instance.parent.update);
            }
            else if (instance.appContext.reload) {
                // root instance mounted via createApp() has a reload method
                instance.appContext.reload();
            }
            else if (typeof window !== 'undefined') {
                // root instance inside tree created via raw render(). Force reload.
                window.location.reload();
            }
            else {
                console.warn('[HMR] Root or manually mounted instance modified. Full reload required.');
            }
        });
    }
    function tryWrap(fn) {
        return (id, arg) => {
            try {
                return fn(id, arg);
            }
            catch (e) {
                console.error(e);
                console.warn(`[HMR] Something went wrong during Vue component hot-reload. ` +
                    `Full reload required.`);
            }
        };
    }

    let devtools;
    function setDevtoolsHook(hook) {
        devtools = hook;
    }
    function devtoolsInitApp(app, version) {
        // TODO queue if devtools is undefined
        if (!devtools)
            return;
        devtools.emit("app:init" /* APP_INIT */, app, version, {
            Fragment,
            Text,
            Comment,
            Static
        });
    }
    function devtoolsUnmountApp(app) {
        if (!devtools)
            return;
        devtools.emit("app:unmount" /* APP_UNMOUNT */, app);
    }
    const devtoolsComponentAdded = /*#__PURE__*/ createDevtoolsComponentHook("component:added" /* COMPONENT_ADDED */);
    const devtoolsComponentUpdated = /*#__PURE__*/ createDevtoolsComponentHook("component:updated" /* COMPONENT_UPDATED */);
    const devtoolsComponentRemoved = /*#__PURE__*/ createDevtoolsComponentHook("component:removed" /* COMPONENT_REMOVED */);
    function createDevtoolsComponentHook(hook) {
        return (component) => {
            if (!devtools)
                return;
            devtools.emit(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined);
        };
    }
    function devtoolsComponentEmit(component, event, params) {
        if (!devtools)
            return;
        devtools.emit("component:emit" /* COMPONENT_EMIT */, component.appContext.app, component, event, params);
    }

    function emit(instance, event, ...args) {
        const props = instance.vnode.props || EMPTY_OBJ$1;
        {
            const { emitsOptions, propsOptions: [propsOptions] } = instance;
            if (emitsOptions) {
                if (!(event in emitsOptions)) {
                    if (!propsOptions || !(`on` + capitalize$1(event) in propsOptions)) {
                        warn(`Component emitted event "${event}" but it is neither declared in ` +
                            `the emits option nor as an "on${capitalize$1(event)}" prop.`);
                    }
                }
                else {
                    const validator = emitsOptions[event];
                    if (isFunction$1(validator)) {
                        const isValid = validator(...args);
                        if (!isValid) {
                            warn(`Invalid event arguments: event validation failed for event "${event}".`);
                        }
                    }
                }
            }
        }
        {
            devtoolsComponentEmit(instance, event, args);
        }
        {
            const lowerCaseEvent = event.toLowerCase();
            if (lowerCaseEvent !== event && props[`on` + capitalize$1(lowerCaseEvent)]) {
                warn(`Event "${lowerCaseEvent}" is emitted in component ` +
                    `${formatComponentName(instance, instance.type)} but the handler is registered for "${event}". ` +
                    `Note that HTML attributes are case-insensitive and you cannot use ` +
                    `v-on to listen to camelCase events when using in-DOM templates. ` +
                    `You should probably use "${hyphenate(event)}" instead of "${event}".`);
            }
        }
        // convert handler name to camelCase. See issue #2249
        let handlerName = `on${capitalize$1(camelize(event))}`;
        let handler = props[handlerName];
        // for v-model update:xxx events, also trigger kebab-case equivalent
        // for props passed via kebab-case
        if (!handler && event.startsWith('update:')) {
            handlerName = `on${capitalize$1(hyphenate(event))}`;
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
        if (!appContext.deopt && comp.__emits !== undefined) {
            return comp.__emits;
        }
        const raw = comp.emits;
        let normalized = {};
        // apply mixin/extends props
        let hasExtends = false;
        if (!raw && !hasExtends) {
            return (comp.__emits = null);
        }
        if (isArray$1(raw)) {
            raw.forEach(key => (normalized[key] = null));
        }
        else {
            extend$1(normalized, raw);
        }
        return (comp.__emits = normalized);
    }
    // Check if an incoming prop key is a declared emit event listener.
    // e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
    // both considered matched listeners.
    function isEmitListener(options, key) {
        if (!options || !isOn(key)) {
            return false;
        }
        key = key.replace(/Once$/, '');
        return (hasOwn$1(options, key[2].toLowerCase() + key.slice(3)) ||
            hasOwn$1(options, key.slice(2)));
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
        {
            accessedAttrs = false;
        }
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
                if (("development" !== 'production') && attrs === props) {
                    markAttrsAccessed();
                }
                result = normalizeVNode(render.length > 1
                    ? render(props, ("development" !== 'production')
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
            if (("development" !== 'production')) {
                ;
                [root, setRoot] = getChildRoot(result);
            }
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
                    else if (("development" !== 'production') && !accessedAttrs && root.type !== Comment) {
                        const allAttrs = Object.keys(attrs);
                        const eventAttrs = [];
                        const extraAttrs = [];
                        for (let i = 0, l = allAttrs.length; i < l; i++) {
                            const key = allAttrs[i];
                            if (isOn(key)) {
                                // ignore v-model handlers when they fail to fallthrough
                                if (!isModelListener(key)) {
                                    // remove `on`, lowercase first letter to reflect event casing
                                    // accurately
                                    eventAttrs.push(key[2].toLowerCase() + key.slice(3));
                                }
                            }
                            else {
                                extraAttrs.push(key);
                            }
                        }
                        if (extraAttrs.length) {
                            warn(`Extraneous non-props attributes (` +
                                `${extraAttrs.join(', ')}) ` +
                                `were passed to component but could not be automatically inherited ` +
                                `because component renders fragment or text root nodes.`);
                        }
                        if (eventAttrs.length) {
                            warn(`Extraneous non-emits event listeners (` +
                                `${eventAttrs.join(', ')}) ` +
                                `were passed to component but could not be automatically inherited ` +
                                `because component renders fragment or text root nodes. ` +
                                `If the listener is intended to be a component custom event listener only, ` +
                                `declare it using the "emits" option.`);
                        }
                    }
                }
            }
            // inherit directives
            if (vnode.dirs) {
                if (("development" !== 'production') && !isElementRoot(root)) {
                    warn(`Runtime directive used on component with non-element root node. ` +
                        `The directives will not function as intended.`);
                }
                root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
            }
            // inherit transition data
            if (vnode.transition) {
                if (("development" !== 'production') && !isElementRoot(root)) {
                    warn(`Component inside <Transition> renders non-element root node ` +
                        `that cannot be animated.`);
                }
                root.transition = vnode.transition;
            }
            if (("development" !== 'production') && setRoot) {
                setRoot(root);
            }
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
        // Parent component's render function was hot-updated. Since this may have
        // caused the child component's slots content to have changed, we need to
        // force the child to update as well.
        if ( (prevChildren || nextChildren) && isHmrUpdating) {
            return true;
        }
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
    // Suspense exposes a component-like API, and is treated like a component
    // in the compiler, but internally it's a special built-in type that hooks
    // directly into the renderer.
    const SuspenseImpl = {
        // In order to make Suspense tree-shakable, we need to avoid importing it
        // directly in the renderer. The renderer checks for the __isSuspense flag
        // on a vnode's type and calls the `process` method, passing in renderer
        // internals.
        __isSuspense: true,
        process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, 
        // platform-specific impl passed from renderer
        rendererInternals) {
            if (n1 == null) {
                mountSuspense(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, rendererInternals);
            }
            else {
                patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, optimized, rendererInternals);
            }
        },
        hydrate: hydrateSuspense,
        create: createSuspenseBoundary
    };
    // Force-casted public typing for h and TSX props inference
    const Suspense = ( SuspenseImpl
        );
    function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, isSVG, optimized, rendererInternals) {
        const { p: patch, o: { createElement } } = rendererInternals;
        const hiddenContainer = createElement('div');
        const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, isSVG, optimized, rendererInternals));
        // start mounting the content subtree in an off-dom container
        patch(null, (suspense.pendingBranch = vnode.ssContent), hiddenContainer, null, parentComponent, suspense, isSVG, optimized);
        // now check if we have encountered any async deps
        if (suspense.deps > 0) {
            // has async
            // mount the fallback tree
            patch(null, vnode.ssFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
            isSVG, optimized);
            setActiveBranch(suspense, vnode.ssFallback);
        }
        else {
            // Suspense has no async deps. Just resolve.
            suspense.resolve();
        }
    }
    function patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, optimized, { p: patch, um: unmount, o: { createElement } }) {
        const suspense = (n2.suspense = n1.suspense);
        suspense.vnode = n2;
        n2.el = n1.el;
        const newBranch = n2.ssContent;
        const newFallback = n2.ssFallback;
        const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
        if (pendingBranch) {
            suspense.pendingBranch = newBranch;
            if (isSameVNodeType(newBranch, pendingBranch)) {
                // same root type but content may have changed.
                patch(pendingBranch, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, optimized);
                if (suspense.deps <= 0) {
                    suspense.resolve();
                }
                else if (isInFallback) {
                    patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                    isSVG, optimized);
                    setActiveBranch(suspense, newFallback);
                }
            }
            else {
                // toggled before pending tree is resolved
                suspense.pendingId++;
                if (isHydrating) {
                    // if toggled before hydration is finished, the current DOM tree is
                    // no longer valid. set it as the active branch so it will be unmounted
                    // when resolved
                    suspense.isHydrating = false;
                    suspense.activeBranch = pendingBranch;
                }
                else {
                    unmount(pendingBranch, parentComponent, suspense);
                }
                // increment pending ID. this is used to invalidate async callbacks
                // reset suspense state
                suspense.deps = 0;
                // discard effects from pending branch
                suspense.effects.length = 0;
                // discard previous container
                suspense.hiddenContainer = createElement('div');
                if (isInFallback) {
                    // already in fallback state
                    patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, optimized);
                    if (suspense.deps <= 0) {
                        suspense.resolve();
                    }
                    else {
                        patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                        isSVG, optimized);
                        setActiveBranch(suspense, newFallback);
                    }
                }
                else if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
                    // toggled "back" to current active branch
                    patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, optimized);
                    // force resolve
                    suspense.resolve(true);
                }
                else {
                    // switched to a 3rd branch
                    patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, optimized);
                    if (suspense.deps <= 0) {
                        suspense.resolve();
                    }
                }
            }
        }
        else {
            if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
                // root did not change, just normal patch
                patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, optimized);
                setActiveBranch(suspense, newBranch);
            }
            else {
                // root node toggled
                // invoke @pending event
                const onPending = n2.props && n2.props.onPending;
                if (isFunction$1(onPending)) {
                    onPending();
                }
                // mount pending branch in off-dom container
                suspense.pendingBranch = newBranch;
                suspense.pendingId++;
                patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, optimized);
                if (suspense.deps <= 0) {
                    // incoming branch has no async deps, resolve now.
                    suspense.resolve();
                }
                else {
                    const { timeout, pendingId } = suspense;
                    if (timeout > 0) {
                        setTimeout(() => {
                            if (suspense.pendingId === pendingId) {
                                suspense.fallback(newFallback);
                            }
                        }, timeout);
                    }
                    else if (timeout === 0) {
                        suspense.fallback(newFallback);
                    }
                }
            }
        }
    }
    let hasWarned = false;
    function createSuspenseBoundary(vnode, parent, parentComponent, container, hiddenContainer, anchor, isSVG, optimized, rendererInternals, isHydrating = false) {
        /* istanbul ignore if */
        if ( !hasWarned) {
            hasWarned = true;
            // @ts-ignore `console.info` cannot be null error
            console[console.info ? 'info' : 'log'](`<Suspense> is an experimental feature and its API will likely change.`);
        }
        const { p: patch, m: move, um: unmount, n: next, o: { parentNode, remove } } = rendererInternals;
        const timeout = toNumber(vnode.props && vnode.props.timeout);
        const suspense = {
            vnode,
            parent,
            parentComponent,
            isSVG,
            optimized,
            container,
            hiddenContainer,
            anchor,
            deps: 0,
            pendingId: 0,
            timeout: typeof timeout === 'number' ? timeout : -1,
            activeBranch: null,
            pendingBranch: null,
            isInFallback: true,
            isHydrating,
            isUnmounted: false,
            effects: [],
            resolve(resume = false) {
                {
                    if (!resume && !suspense.pendingBranch) {
                        throw new Error(`suspense.resolve() is called without a pending branch.`);
                    }
                    if (suspense.isUnmounted) {
                        throw new Error(`suspense.resolve() is called on an already unmounted suspense boundary.`);
                    }
                }
                const { vnode, activeBranch, pendingBranch, pendingId, effects, parentComponent, container } = suspense;
                if (suspense.isHydrating) {
                    suspense.isHydrating = false;
                }
                else if (!resume) {
                    const delayEnter = activeBranch &&
                        pendingBranch.transition &&
                        pendingBranch.transition.mode === 'out-in';
                    if (delayEnter) {
                        activeBranch.transition.afterLeave = () => {
                            if (pendingId === suspense.pendingId) {
                                move(pendingBranch, container, anchor, 0 /* ENTER */);
                            }
                        };
                    }
                    // this is initial anchor on mount
                    let { anchor } = suspense;
                    // unmount current active tree
                    if (activeBranch) {
                        // if the fallback tree was mounted, it may have been moved
                        // as part of a parent suspense. get the latest anchor for insertion
                        anchor = next(activeBranch);
                        unmount(activeBranch, parentComponent, suspense, true);
                    }
                    if (!delayEnter) {
                        // move content from off-dom container to actual container
                        move(pendingBranch, container, anchor, 0 /* ENTER */);
                    }
                }
                setActiveBranch(suspense, pendingBranch);
                suspense.pendingBranch = null;
                suspense.isInFallback = false;
                // flush buffered effects
                // check if there is a pending parent suspense
                let parent = suspense.parent;
                let hasUnresolvedAncestor = false;
                while (parent) {
                    if (parent.pendingBranch) {
                        // found a pending parent suspense, merge buffered post jobs
                        // into that parent
                        parent.effects.push(...effects);
                        hasUnresolvedAncestor = true;
                        break;
                    }
                    parent = parent.parent;
                }
                // no pending parent suspense, flush all jobs
                if (!hasUnresolvedAncestor) {
                    queuePostFlushCb(effects);
                }
                suspense.effects = [];
                // invoke @resolve event
                const onResolve = vnode.props && vnode.props.onResolve;
                if (isFunction$1(onResolve)) {
                    onResolve();
                }
            },
            fallback(fallbackVNode) {
                if (!suspense.pendingBranch) {
                    return;
                }
                const { vnode, activeBranch, parentComponent, container, isSVG, optimized } = suspense;
                // invoke @fallback event
                const onFallback = vnode.props && vnode.props.onFallback;
                if (isFunction$1(onFallback)) {
                    onFallback();
                }
                const anchor = next(activeBranch);
                const mountFallback = () => {
                    if (!suspense.isInFallback) {
                        return;
                    }
                    // mount the fallback tree
                    patch(null, fallbackVNode, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                    isSVG, optimized);
                    setActiveBranch(suspense, fallbackVNode);
                };
                const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === 'out-in';
                if (delayEnter) {
                    activeBranch.transition.afterLeave = mountFallback;
                }
                // unmount current active branch
                unmount(activeBranch, parentComponent, null, // no suspense so unmount hooks fire now
                true // shouldRemove
                );
                suspense.isInFallback = true;
                if (!delayEnter) {
                    mountFallback();
                }
            },
            move(container, anchor, type) {
                suspense.activeBranch &&
                    move(suspense.activeBranch, container, anchor, type);
                suspense.container = container;
            },
            next() {
                return suspense.activeBranch && next(suspense.activeBranch);
            },
            registerDep(instance, setupRenderEffect) {
                if (!suspense.pendingBranch) {
                    return;
                }
                const hydratedEl = instance.vnode.el;
                suspense.deps++;
                instance
                    .asyncDep.catch(err => {
                    handleError(err, instance, 0 /* SETUP_FUNCTION */);
                })
                    .then(asyncSetupResult => {
                    // retry when the setup() promise resolves.
                    // component may have been unmounted before resolve.
                    if (instance.isUnmounted ||
                        suspense.isUnmounted ||
                        suspense.pendingId !== instance.suspenseId) {
                        return;
                    }
                    suspense.deps--;
                    // retry from this component
                    instance.asyncResolved = true;
                    const { vnode } = instance;
                    {
                        pushWarningContext(vnode);
                    }
                    handleSetupResult(instance, asyncSetupResult);
                    if (hydratedEl) {
                        // vnode may have been replaced if an update happened before the
                        // async dep is resolved.
                        vnode.el = hydratedEl;
                    }
                    const placeholder = !hydratedEl && instance.subTree.el;
                    setupRenderEffect(instance, vnode, 
                    // component may have been moved before resolve.
                    // if this is not a hydration, instance.subTree will be the comment
                    // placeholder.
                    parentNode(hydratedEl || instance.subTree.el), 
                    // anchor will not be used if this is hydration, so only need to
                    // consider the comment placeholder case.
                    hydratedEl ? null : next(instance.subTree), suspense, isSVG, optimized);
                    if (placeholder) {
                        remove(placeholder);
                    }
                    updateHOCHostEl(instance, vnode.el);
                    {
                        popWarningContext();
                    }
                    if (suspense.deps === 0) {
                        suspense.resolve();
                    }
                });
            },
            unmount(parentSuspense, doRemove) {
                suspense.isUnmounted = true;
                if (suspense.activeBranch) {
                    unmount(suspense.activeBranch, parentComponent, parentSuspense, doRemove);
                }
                if (suspense.pendingBranch) {
                    unmount(suspense.pendingBranch, parentComponent, parentSuspense, doRemove);
                }
            }
        };
        return suspense;
    }
    function hydrateSuspense(node, vnode, parentComponent, parentSuspense, isSVG, optimized, rendererInternals, hydrateNode) {
        /* eslint-disable no-restricted-globals */
        const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, node.parentNode, document.createElement('div'), null, isSVG, optimized, rendererInternals, true /* hydrating */));
        // there are two possible scenarios for server-rendered suspense:
        // - success: ssr content should be fully resolved
        // - failure: ssr content should be the fallback branch.
        // however, on the client we don't really know if it has failed or not
        // attempt to hydrate the DOM assuming it has succeeded, but we still
        // need to construct a suspense boundary first
        const result = hydrateNode(node, (suspense.pendingBranch = vnode.ssContent), parentComponent, suspense, optimized);
        if (suspense.deps === 0) {
            suspense.resolve();
        }
        return result;
        /* eslint-enable no-restricted-globals */
    }
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
        if (isFunction$1(s)) {
            s = s();
        }
        if (isArray$1(s)) {
            const singleChild = filterSingleRoot(s);
            if ( !singleChild) {
                warn(`<Suspense> slots expect a single root node.`);
            }
            s = singleChild;
        }
        return normalizeVNode(s);
    }
    function queueEffectWithSuspense(fn, suspense) {
        if (suspense && suspense.pendingBranch) {
            if (isArray$1(fn)) {
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
    function setActiveBranch(suspense, branch) {
        suspense.activeBranch = branch;
        const { vnode, parentComponent } = suspense;
        const el = (vnode.el = branch.el);
        // in case suspense is the root node of a component,
        // recursively update the HOC el
        if (parentComponent && parentComponent.subTree === vnode) {
            parentComponent.vnode.el = el;
            updateHOCHostEl(parentComponent, el);
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
        if ( slot && slot.length > 1) {
            warn(`SSR-optimized slot function detected in a non-SSR-optimized render ` +
                `function. You need to mark this component with $dynamic-slots in the ` +
                `parent template.`);
            slot = () => [];
        }
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
    const scopeIdStack = [];
    /**
     * @private
     */
    function pushScopeId(id) {
        scopeIdStack.push((currentScopeId = id));
    }
    /**
     * @private
     */
    function popScopeId() {
        scopeIdStack.pop();
        currentScopeId = scopeIdStack[scopeIdStack.length - 1] || null;
    }
    /**
     * @private
     */
    function withScopeId(id) {
        return ((fn) => withCtx(function () {
            pushScopeId(id);
            const res = fn.apply(this, arguments);
            popScopeId();
            return res;
        }));
    }

    function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
    isSSR = false) {
        const props = {};
        const attrs = {};
        def$1(attrs, InternalObjectKey, 1);
        setFullProps(instance, rawProps, props, attrs);
        // validation
        {
            validateProps(props, instance);
        }
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
        // always force full diff in dev
        // - #1942 if hmr is enabled with sfc component
        // - vite#872 non-sfc component used by sfc component
        !(
            (instance.type.__hmrId ||
                (instance.parent && instance.parent.type.__hmrId))) &&
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
                        if (hasOwn$1(attrs, key)) {
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
                    (!hasOwn$1(rawProps, key) &&
                        // it's possible the original props was passed in as kebab-case
                        // and converted to camelCase (#955)
                        ((kebabKey = hyphenate(key)) === key || !hasOwn$1(rawProps, kebabKey)))) {
                    if (options) {
                        if (rawPrevProps &&
                            // for camelCase
                            (rawPrevProps[key] !== undefined ||
                                // for kebab-case
                                rawPrevProps[kebabKey] !== undefined)) {
                            props[key] = resolvePropValue(options, rawProps || EMPTY_OBJ$1, key, undefined, instance);
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
                    if (!rawProps || !hasOwn$1(rawProps, key)) {
                        delete attrs[key];
                    }
                }
            }
        }
        // trigger updates for $attrs in case it's used in component slots
        trigger(instance, "set" /* SET */, '$attrs');
        if ( rawProps) {
            validateProps(props, instance);
        }
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
                if (options && hasOwn$1(options, (camelKey = camelize(key)))) {
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
            const hasDefault = hasOwn$1(opt, 'default');
            // default values
            if (hasDefault && value === undefined) {
                const defaultValue = opt.default;
                if (opt.type !== Function && isFunction$1(defaultValue)) {
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
                if (!hasOwn$1(props, key) && !hasDefault) {
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
        if (!appContext.deopt && comp.__props) {
            return comp.__props;
        }
        const raw = comp.props;
        const normalized = {};
        const needCastKeys = [];
        // apply mixin/extends props
        let hasExtends = false;
        if (!raw && !hasExtends) {
            return (comp.__props = EMPTY_ARR);
        }
        if (isArray$1(raw)) {
            for (let i = 0; i < raw.length; i++) {
                if ( !isString$1(raw[i])) {
                    warn(`props must be strings when using array syntax.`, raw[i]);
                }
                const normalizedKey = camelize(raw[i]);
                if (validatePropName(normalizedKey)) {
                    normalized[normalizedKey] = EMPTY_OBJ$1;
                }
            }
        }
        else if (raw) {
            if ( !isObject$1(raw)) {
                warn(`invalid props options`, raw);
            }
            for (const key in raw) {
                const normalizedKey = camelize(key);
                if (validatePropName(normalizedKey)) {
                    const opt = raw[key];
                    const prop = (normalized[normalizedKey] =
                        isArray$1(opt) || isFunction$1(opt) ? { type: opt } : opt);
                    if (prop) {
                        const booleanIndex = getTypeIndex(Boolean, prop.type);
                        const stringIndex = getTypeIndex(String, prop.type);
                        prop[0 /* shouldCast */] = booleanIndex > -1;
                        prop[1 /* shouldCastTrue */] =
                            stringIndex < 0 || booleanIndex < stringIndex;
                        // if the prop needs boolean casting or default value
                        if (booleanIndex > -1 || hasOwn$1(prop, 'default')) {
                            needCastKeys.push(normalizedKey);
                        }
                    }
                }
            }
        }
        return (comp.__props = [normalized, needCastKeys]);
    }
    function validatePropName(key) {
        if (key[0] !== '$') {
            return true;
        }
        else {
            warn(`Invalid prop name: "${key}" is a reserved property.`);
        }
        return false;
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
        if (isArray$1(expectedTypes)) {
            for (let i = 0, len = expectedTypes.length; i < len; i++) {
                if (isSameType(expectedTypes[i], type)) {
                    return i;
                }
            }
        }
        else if (isFunction$1(expectedTypes)) {
            return isSameType(expectedTypes, type) ? 0 : -1;
        }
        return -1;
    }
    /**
     * dev only
     */
    function validateProps(props, instance) {
        const rawValues = toRaw(props);
        const options = instance.propsOptions[0];
        for (const key in options) {
            let opt = options[key];
            if (opt == null)
                continue;
            validateProp(key, rawValues[key], opt, !hasOwn$1(rawValues, key));
        }
    }
    /**
     * dev only
     */
    function validateProp(name, value, prop, isAbsent) {
        const { type, required, validator } = prop;
        // required!
        if (required && isAbsent) {
            warn('Missing required prop: "' + name + '"');
            return;
        }
        // missing but optional
        if (value == null && !prop.required) {
            return;
        }
        // type check
        if (type != null && type !== true) {
            let isValid = false;
            const types = isArray$1(type) ? type : [type];
            const expectedTypes = [];
            // value is valid as long as one of the specified types match
            for (let i = 0; i < types.length && !isValid; i++) {
                const { valid, expectedType } = assertType(value, types[i]);
                expectedTypes.push(expectedType || '');
                isValid = valid;
            }
            if (!isValid) {
                warn(getInvalidTypeMessage(name, value, expectedTypes));
                return;
            }
        }
        // custom validator
        if (validator && !validator(value)) {
            warn('Invalid prop: custom validator check failed for prop "' + name + '".');
        }
    }
    const isSimpleType = /*#__PURE__*/ makeMap('String,Number,Boolean,Function,Symbol');
    /**
     * dev only
     */
    function assertType(value, type) {
        let valid;
        const expectedType = getType(type);
        if (isSimpleType(expectedType)) {
            const t = typeof value;
            valid = t === expectedType.toLowerCase();
            // for primitive wrapper objects
            if (!valid && t === 'object') {
                valid = value instanceof type;
            }
        }
        else if (expectedType === 'Object') {
            valid = isObject$1(value);
        }
        else if (expectedType === 'Array') {
            valid = isArray$1(value);
        }
        else {
            valid = value instanceof type;
        }
        return {
            valid,
            expectedType
        };
    }
    /**
     * dev only
     */
    function getInvalidTypeMessage(name, value, expectedTypes) {
        let message = `Invalid prop: type check failed for prop "${name}".` +
            ` Expected ${expectedTypes.map(capitalize$1).join(', ')}`;
        const expectedType = expectedTypes[0];
        const receivedType = toRawType$1(value);
        const expectedValue = styleValue(value, expectedType);
        const receivedValue = styleValue(value, receivedType);
        // check if we need to specify expected value
        if (expectedTypes.length === 1 &&
            isExplicable(expectedType) &&
            !isBoolean(expectedType, receivedType)) {
            message += ` with value ${expectedValue}`;
        }
        message += `, got ${receivedType} `;
        // check if we need to specify received value
        if (isExplicable(receivedType)) {
            message += `with value ${receivedValue}.`;
        }
        return message;
    }
    /**
     * dev only
     */
    function styleValue(value, type) {
        if (type === 'String') {
            return `"${value}"`;
        }
        else if (type === 'Number') {
            return `${Number(value)}`;
        }
        else {
            return `${value}`;
        }
    }
    /**
     * dev only
     */
    function isExplicable(type) {
        const explicitTypes = ['string', 'number', 'boolean'];
        return explicitTypes.some(elem => type.toLowerCase() === elem);
    }
    /**
     * dev only
     */
    function isBoolean(...args) {
        return args.some(elem => elem.toLowerCase() === 'boolean');
    }

    function injectHook(type, hook, target = currentInstance, prepend = false) {
        if (target) {
            const hooks = target[type] || (target[type] = []);
            // cache the error handling wrapper for injected hooks so the same hook
            // can be properly deduped by the scheduler. "__weh" stands for "with error
            // handling".
            const wrappedHook = hook.__weh ||
                (hook.__weh = (...args) => {
                    if (target.isUnmounted) {
                        return;
                    }
                    // disable tracking inside all lifecycle hooks
                    // since they can potentially be called inside effects.
                    pauseTracking();
                    // Set currentInstance during hook invocation.
                    // This assumes the hook does not synchronously trigger other hooks, which
                    // can only be false when the user does something really funky.
                    setCurrentInstance(target);
                    const res = callWithAsyncErrorHandling(hook, target, type, args);
                    setCurrentInstance(null);
                    resetTracking();
                    return res;
                });
            if (prepend) {
                hooks.unshift(wrappedHook);
            }
            else {
                hooks.push(wrappedHook);
            }
            return wrappedHook;
        }
        else {
            const apiName = `on${capitalize$1(ErrorTypeStrings[type].replace(/ hook$/, ''))}`;
            warn(`${apiName} is called when there is no active component instance to be ` +
                `associated with. ` +
                `Lifecycle injection APIs can only be used during execution of setup().` +
                ( ` If you are using async setup(), make sure to register lifecycle ` +
                        `hooks before the first await statement.`
                    ));
        }
    }
    const createHook = (lifecycle) => (hook, target = currentInstance) => 
    // post-create lifecycle registrations are noops during SSR
    !isInSSRComponentSetup && injectHook(lifecycle, hook, target);
    const onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
    const onMounted = createHook("m" /* MOUNTED */);
    const onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
    const onUpdated = createHook("u" /* UPDATED */);
    const onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
    const onUnmounted = createHook("um" /* UNMOUNTED */);
    const onRenderTriggered = createHook("rtg" /* RENDER_TRIGGERED */);
    const onRenderTracked = createHook("rtc" /* RENDER_TRACKED */);
    const onErrorCaptured = (hook, target = currentInstance) => {
        injectHook("ec" /* ERROR_CAPTURED */, hook, target);
    };

    // Simple effect.
    function watchEffect(effect, options) {
        return doWatch(effect, null, options);
    }
    // initial value for watchers to trigger on undefined initial values
    const INITIAL_WATCHER_VALUE = {};
    // implementation
    function watch(source, cb, options) {
        if ( !isFunction$1(cb)) {
            warn(`\`watch(fn, options?)\` signature has been moved to a separate API. ` +
                `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
                `supports \`watch(source, cb, options?) signature.`);
        }
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ$1, instance = currentInstance) {
        if ( !cb) {
            if (immediate !== undefined) {
                warn(`watch() "immediate" option is only respected when using the ` +
                    `watch(source, callback, options?) signature.`);
            }
            if (deep !== undefined) {
                warn(`watch() "deep" option is only respected when using the ` +
                    `watch(source, callback, options?) signature.`);
            }
        }
        const warnInvalidSource = (s) => {
            warn(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` +
                `a reactive object, or an array of these types.`);
        };
        let getter;
        let forceTrigger = false;
        if (isRef(source)) {
            getter = () => source.value;
            forceTrigger = !!source._shallow;
        }
        else if (isReactive(source)) {
            getter = () => source;
            deep = true;
        }
        else if (isArray$1(source)) {
            getter = () => source.map(s => {
                if (isRef(s)) {
                    return s.value;
                }
                else if (isReactive(s)) {
                    return traverse(s);
                }
                else if (isFunction$1(s)) {
                    return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */);
                }
                else {
                     warnInvalidSource(s);
                }
            });
        }
        else if (isFunction$1(source)) {
            if (cb) {
                // getter with cb
                getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */);
            }
            else {
                // no cb -> simple effect
                getter = () => {
                    if (instance && instance.isUnmounted) {
                        return;
                    }
                    if (cleanup) {
                        cleanup();
                    }
                    return callWithErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onInvalidate]);
                };
            }
        }
        else {
            getter = NOOP;
             warnInvalidSource(source);
        }
        if (cb && deep) {
            const baseGetter = getter;
            getter = () => traverse(baseGetter());
        }
        let cleanup;
        const onInvalidate = (fn) => {
            cleanup = runner.options.onStop = () => {
                callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
            };
        };
        let oldValue = isArray$1(source) ? [] : INITIAL_WATCHER_VALUE;
        const job = () => {
            if (!runner.active) {
                return;
            }
            if (cb) {
                // watch(source, cb)
                const newValue = runner();
                if (deep || forceTrigger || hasChanged$1(newValue, oldValue)) {
                    // cleanup before running cb again
                    if (cleanup) {
                        cleanup();
                    }
                    callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                        newValue,
                        // pass undefined as the old value when it's changed for the first time
                        oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                        onInvalidate
                    ]);
                    oldValue = newValue;
                }
            }
            else {
                // watchEffect
                runner();
            }
        };
        // important: mark the job as a watcher callback so that scheduler knows
        // it is allowed to self-trigger (#1727)
        job.allowRecurse = !!cb;
        let scheduler;
        if (flush === 'sync') {
            scheduler = job;
        }
        else if (flush === 'post') {
            scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
        }
        else {
            // default: 'pre'
            scheduler = () => {
                if (!instance || instance.isMounted) {
                    queuePreFlushCb(job);
                }
                else {
                    // with 'pre' option, the first call must happen before
                    // the component is mounted so it is called synchronously.
                    job();
                }
            };
        }
        const runner = effect(getter, {
            lazy: true,
            onTrack,
            onTrigger,
            scheduler
        });
        recordInstanceBoundEffect(runner);
        // initial run
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = runner();
            }
        }
        else if (flush === 'post') {
            queuePostRenderEffect(runner, instance && instance.suspense);
        }
        else {
            runner();
        }
        return () => {
            stop(runner);
            if (instance) {
                remove(instance.effects, runner);
            }
        };
    }
    function traverse(value, seen = new Set()) {
        if (!isObject$1(value) || seen.has(value)) {
            return value;
        }
        seen.add(value);
        if (isRef(value)) {
            traverse(value.value, seen);
        }
        else if (isArray$1(value)) {
            for (let i = 0; i < value.length; i++) {
                traverse(value[i], seen);
            }
        }
        else if (isSet(value) || isMap$1(value)) {
            value.forEach((v) => {
                traverse(v, seen);
            });
        }
        else {
            for (const key in value) {
                traverse(value[key], seen);
            }
        }
        return value;
    }

    function useTransitionState() {
        const state = {
            isMounted: false,
            isLeaving: false,
            isUnmounting: false,
            leavingVNodes: new Map()
        };
        onMounted(() => {
            state.isMounted = true;
        });
        onBeforeUnmount(() => {
            state.isUnmounting = true;
        });
        return state;
    }
    const TransitionHookValidator = [Function, Array];
    const BaseTransitionImpl = {
        name: `BaseTransition`,
        props: {
            mode: String,
            appear: Boolean,
            persisted: Boolean,
            // enter
            onBeforeEnter: TransitionHookValidator,
            onEnter: TransitionHookValidator,
            onAfterEnter: TransitionHookValidator,
            onEnterCancelled: TransitionHookValidator,
            // leave
            onBeforeLeave: TransitionHookValidator,
            onLeave: TransitionHookValidator,
            onAfterLeave: TransitionHookValidator,
            onLeaveCancelled: TransitionHookValidator,
            // appear
            onBeforeAppear: TransitionHookValidator,
            onAppear: TransitionHookValidator,
            onAfterAppear: TransitionHookValidator,
            onAppearCancelled: TransitionHookValidator
        },
        setup(props, { slots }) {
            const instance = getCurrentInstance();
            const state = useTransitionState();
            let prevTransitionKey;
            return () => {
                const children = slots.default && getTransitionRawChildren(slots.default(), true);
                if (!children || !children.length) {
                    return;
                }
                // warn multiple elements
                if ( children.length > 1) {
                    warn('<transition> can only be used on a single element or component. Use ' +
                        '<transition-group> for lists.');
                }
                // there's no need to track reactivity for these props so use the raw
                // props for a bit better perf
                const rawProps = toRaw(props);
                const { mode } = rawProps;
                // check mode
                if ( mode && !['in-out', 'out-in', 'default'].includes(mode)) {
                    warn(`invalid <transition> mode: ${mode}`);
                }
                // at this point children has a guaranteed length of 1.
                const child = children[0];
                if (state.isLeaving) {
                    return emptyPlaceholder(child);
                }
                // in the case of <transition><keep-alive/></transition>, we need to
                // compare the type of the kept-alive children.
                const innerChild = getKeepAliveChild(child);
                if (!innerChild) {
                    return emptyPlaceholder(child);
                }
                const enterHooks = resolveTransitionHooks(innerChild, rawProps, state, instance);
                setTransitionHooks(innerChild, enterHooks);
                const oldChild = instance.subTree;
                const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
                let transitionKeyChanged = false;
                const { getTransitionKey } = innerChild.type;
                if (getTransitionKey) {
                    const key = getTransitionKey();
                    if (prevTransitionKey === undefined) {
                        prevTransitionKey = key;
                    }
                    else if (key !== prevTransitionKey) {
                        prevTransitionKey = key;
                        transitionKeyChanged = true;
                    }
                }
                // handle mode
                if (oldInnerChild &&
                    oldInnerChild.type !== Comment &&
                    (!isSameVNodeType(innerChild, oldInnerChild) || transitionKeyChanged)) {
                    const leavingHooks = resolveTransitionHooks(oldInnerChild, rawProps, state, instance);
                    // update old tree's hooks in case of dynamic transition
                    setTransitionHooks(oldInnerChild, leavingHooks);
                    // switching between different views
                    if (mode === 'out-in') {
                        state.isLeaving = true;
                        // return placeholder node and queue update when leave finishes
                        leavingHooks.afterLeave = () => {
                            state.isLeaving = false;
                            instance.update();
                        };
                        return emptyPlaceholder(child);
                    }
                    else if (mode === 'in-out') {
                        leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
                            const leavingVNodesCache = getLeavingNodesForType(state, oldInnerChild);
                            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
                            // early removal callback
                            el._leaveCb = () => {
                                earlyRemove();
                                el._leaveCb = undefined;
                                delete enterHooks.delayedLeave;
                            };
                            enterHooks.delayedLeave = delayedLeave;
                        };
                    }
                }
                return child;
            };
        }
    };
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    const BaseTransition = BaseTransitionImpl;
    function getLeavingNodesForType(state, vnode) {
        const { leavingVNodes } = state;
        let leavingVNodesCache = leavingVNodes.get(vnode.type);
        if (!leavingVNodesCache) {
            leavingVNodesCache = Object.create(null);
            leavingVNodes.set(vnode.type, leavingVNodesCache);
        }
        return leavingVNodesCache;
    }
    // The transition hooks are attached to the vnode as vnode.transition
    // and will be called at appropriate timing in the renderer.
    function resolveTransitionHooks(vnode, props, state, instance) {
        const { appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled } = props;
        const key = String(vnode.key);
        const leavingVNodesCache = getLeavingNodesForType(state, vnode);
        const callHook = (hook, args) => {
            hook &&
                callWithAsyncErrorHandling(hook, instance, 9 /* TRANSITION_HOOK */, args);
        };
        const hooks = {
            mode,
            persisted,
            beforeEnter(el) {
                let hook = onBeforeEnter;
                if (!state.isMounted) {
                    if (appear) {
                        hook = onBeforeAppear || onBeforeEnter;
                    }
                    else {
                        return;
                    }
                }
                // for same element (v-show)
                if (el._leaveCb) {
                    el._leaveCb(true /* cancelled */);
                }
                // for toggled element with same key (v-if)
                const leavingVNode = leavingVNodesCache[key];
                if (leavingVNode &&
                    isSameVNodeType(vnode, leavingVNode) &&
                    leavingVNode.el._leaveCb) {
                    // force early removal (not cancelled)
                    leavingVNode.el._leaveCb();
                }
                callHook(hook, [el]);
            },
            enter(el) {
                let hook = onEnter;
                let afterHook = onAfterEnter;
                let cancelHook = onEnterCancelled;
                if (!state.isMounted) {
                    if (appear) {
                        hook = onAppear || onEnter;
                        afterHook = onAfterAppear || onAfterEnter;
                        cancelHook = onAppearCancelled || onEnterCancelled;
                    }
                    else {
                        return;
                    }
                }
                let called = false;
                const done = (el._enterCb = (cancelled) => {
                    if (called)
                        return;
                    called = true;
                    if (cancelled) {
                        callHook(cancelHook, [el]);
                    }
                    else {
                        callHook(afterHook, [el]);
                    }
                    if (hooks.delayedLeave) {
                        hooks.delayedLeave();
                    }
                    el._enterCb = undefined;
                });
                if (hook) {
                    hook(el, done);
                    if (hook.length <= 1) {
                        done();
                    }
                }
                else {
                    done();
                }
            },
            leave(el, remove) {
                const key = String(vnode.key);
                if (el._enterCb) {
                    el._enterCb(true /* cancelled */);
                }
                if (state.isUnmounting) {
                    return remove();
                }
                callHook(onBeforeLeave, [el]);
                let called = false;
                const done = (el._leaveCb = (cancelled) => {
                    if (called)
                        return;
                    called = true;
                    remove();
                    if (cancelled) {
                        callHook(onLeaveCancelled, [el]);
                    }
                    else {
                        callHook(onAfterLeave, [el]);
                    }
                    el._leaveCb = undefined;
                    if (leavingVNodesCache[key] === vnode) {
                        delete leavingVNodesCache[key];
                    }
                });
                leavingVNodesCache[key] = vnode;
                if (onLeave) {
                    onLeave(el, done);
                    if (onLeave.length <= 1) {
                        done();
                    }
                }
                else {
                    done();
                }
            },
            clone(vnode) {
                return resolveTransitionHooks(vnode, props, state, instance);
            }
        };
        return hooks;
    }
    // the placeholder really only handles one special case: KeepAlive
    // in the case of a KeepAlive in a leave phase we need to return a KeepAlive
    // placeholder with empty content to avoid the KeepAlive instance from being
    // unmounted.
    function emptyPlaceholder(vnode) {
        if (isKeepAlive(vnode)) {
            vnode = cloneVNode(vnode);
            vnode.children = null;
            return vnode;
        }
    }
    function getKeepAliveChild(vnode) {
        return isKeepAlive(vnode)
            ? vnode.children
                ? vnode.children[0]
                : undefined
            : vnode;
    }
    function setTransitionHooks(vnode, hooks) {
        if (vnode.shapeFlag & 6 /* COMPONENT */ && vnode.component) {
            setTransitionHooks(vnode.component.subTree, hooks);
        }
        else if ( vnode.shapeFlag & 128 /* SUSPENSE */) {
            vnode.ssContent.transition = hooks.clone(vnode.ssContent);
            vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
        }
        else {
            vnode.transition = hooks;
        }
    }
    function getTransitionRawChildren(children, keepComment = false) {
        let ret = [];
        let keyedFragmentCount = 0;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // handle fragment children case, e.g. v-for
            if (child.type === Fragment) {
                if (child.patchFlag & 128 /* KEYED_FRAGMENT */)
                    keyedFragmentCount++;
                ret = ret.concat(getTransitionRawChildren(child.children, keepComment));
            }
            // comment placeholders should be skipped, e.g. v-if
            else if (keepComment || child.type !== Comment) {
                ret.push(child);
            }
        }
        // #1126 if a transition children list contains multiple sub fragments, these
        // fragments will be merged into a flat children array. Since each v-for
        // fragment may contain different static bindings inside, we need to de-top
        // these children to force full diffs to ensure correct behavior.
        if (keyedFragmentCount > 1) {
            for (let i = 0; i < ret.length; i++) {
                ret[i].patchFlag = -2 /* BAIL */;
            }
        }
        return ret;
    }

    const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
    const KeepAliveImpl = {
        name: `KeepAlive`,
        // Marker for special handling inside the renderer. We are not using a ===
        // check directly on KeepAlive in the renderer, because importing it directly
        // would prevent it from being tree-shaken.
        __isKeepAlive: true,
        inheritRef: true,
        props: {
            include: [String, RegExp, Array],
            exclude: [String, RegExp, Array],
            max: [String, Number]
        },
        setup(props, { slots }) {
            const cache = new Map();
            const keys = new Set();
            let current = null;
            const instance = getCurrentInstance();
            const parentSuspense = instance.suspense;
            // KeepAlive communicates with the instantiated renderer via the
            // ctx where the renderer passes in its internals,
            // and the KeepAlive instance exposes activate/deactivate implementations.
            // The whole point of this is to avoid importing KeepAlive directly in the
            // renderer to facilitate tree-shaking.
            const sharedContext = instance.ctx;
            const { renderer: { p: patch, m: move, um: _unmount, o: { createElement } } } = sharedContext;
            const storageContainer = createElement('div');
            sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
                const instance = vnode.component;
                move(vnode, container, anchor, 0 /* ENTER */, parentSuspense);
                // in case props have changed
                patch(instance.vnode, vnode, container, anchor, instance, parentSuspense, isSVG, optimized);
                queuePostRenderEffect(() => {
                    instance.isDeactivated = false;
                    if (instance.a) {
                        invokeArrayFns(instance.a);
                    }
                    const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
                    if (vnodeHook) {
                        invokeVNodeHook(vnodeHook, instance.parent, vnode);
                    }
                }, parentSuspense);
            };
            sharedContext.deactivate = (vnode) => {
                const instance = vnode.component;
                move(vnode, storageContainer, null, 1 /* LEAVE */, parentSuspense);
                queuePostRenderEffect(() => {
                    if (instance.da) {
                        invokeArrayFns(instance.da);
                    }
                    const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
                    if (vnodeHook) {
                        invokeVNodeHook(vnodeHook, instance.parent, vnode);
                    }
                    instance.isDeactivated = true;
                }, parentSuspense);
            };
            function unmount(vnode) {
                // reset the shapeFlag so it can be properly unmounted
                resetShapeFlag(vnode);
                _unmount(vnode, instance, parentSuspense);
            }
            function pruneCache(filter) {
                cache.forEach((vnode, key) => {
                    const name = getName(vnode.type);
                    if (name && (!filter || !filter(name))) {
                        pruneCacheEntry(key);
                    }
                });
            }
            function pruneCacheEntry(key) {
                const cached = cache.get(key);
                if (!current || cached.type !== current.type) {
                    unmount(cached);
                }
                else if (current) {
                    // current active instance should no longer be kept-alive.
                    // we can't unmount it now but it might be later, so reset its flag now.
                    resetShapeFlag(current);
                }
                cache.delete(key);
                keys.delete(key);
            }
            // prune cache on include/exclude prop change
            watch(() => [props.include, props.exclude], ([include, exclude]) => {
                include && pruneCache(name => matches(include, name));
                exclude && pruneCache(name => !matches(exclude, name));
            }, 
            // prune post-render after `current` has been updated
            { flush: 'post' });
            // cache sub tree after render
            let pendingCacheKey = null;
            const cacheSubtree = () => {
                // fix #1621, the pendingCacheKey could be 0
                if (pendingCacheKey != null) {
                    cache.set(pendingCacheKey, getInnerChild(instance.subTree));
                }
            };
            onMounted(cacheSubtree);
            onUpdated(cacheSubtree);
            onBeforeUnmount(() => {
                cache.forEach(cached => {
                    const { subTree, suspense } = instance;
                    const vnode = getInnerChild(subTree);
                    if (cached.type === vnode.type) {
                        // current instance will be unmounted as part of keep-alive's unmount
                        resetShapeFlag(vnode);
                        // but invoke its deactivated hook here
                        const da = vnode.component.da;
                        da && queuePostRenderEffect(da, suspense);
                        return;
                    }
                    unmount(cached);
                });
            });
            return () => {
                pendingCacheKey = null;
                if (!slots.default) {
                    return null;
                }
                const children = slots.default();
                const rawVNode = children[0];
                if (children.length > 1) {
                    {
                        warn(`KeepAlive should contain exactly one component child.`);
                    }
                    current = null;
                    return children;
                }
                else if (!isVNode(rawVNode) ||
                    (!(rawVNode.shapeFlag & 4 /* STATEFUL_COMPONENT */) &&
                        !(rawVNode.shapeFlag & 128 /* SUSPENSE */))) {
                    current = null;
                    return rawVNode;
                }
                let vnode = getInnerChild(rawVNode);
                const comp = vnode.type;
                const name = getName(comp);
                const { include, exclude, max } = props;
                if ((include && (!name || !matches(include, name))) ||
                    (exclude && name && matches(exclude, name))) {
                    current = vnode;
                    return rawVNode;
                }
                const key = vnode.key == null ? comp : vnode.key;
                const cachedVNode = cache.get(key);
                // clone vnode if it's reused because we are going to mutate it
                if (vnode.el) {
                    vnode = cloneVNode(vnode);
                    if (rawVNode.shapeFlag & 128 /* SUSPENSE */) {
                        rawVNode.ssContent = vnode;
                    }
                }
                // #1513 it's possible for the returned vnode to be cloned due to attr
                // fallthrough or scopeId, so the vnode here may not be the final vnode
                // that is mounted. Instead of caching it directly, we store the pending
                // key and cache `instance.subTree` (the normalized vnode) in
                // beforeMount/beforeUpdate hooks.
                pendingCacheKey = key;
                if (cachedVNode) {
                    // copy over mounted state
                    vnode.el = cachedVNode.el;
                    vnode.component = cachedVNode.component;
                    if (vnode.transition) {
                        // recursively update transition hooks on subTree
                        setTransitionHooks(vnode, vnode.transition);
                    }
                    // avoid vnode being mounted as fresh
                    vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
                    // make this key the freshest
                    keys.delete(key);
                    keys.add(key);
                }
                else {
                    keys.add(key);
                    // prune oldest entry
                    if (max && keys.size > parseInt(max, 10)) {
                        pruneCacheEntry(keys.values().next().value);
                    }
                }
                // avoid vnode being unmounted
                vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
                current = vnode;
                return rawVNode;
            };
        }
    };
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    const KeepAlive = KeepAliveImpl;
    function getName(comp) {
        return comp.displayName || comp.name;
    }
    function matches(pattern, name) {
        if (isArray$1(pattern)) {
            return pattern.some((p) => matches(p, name));
        }
        else if (isString$1(pattern)) {
            return pattern.split(',').indexOf(name) > -1;
        }
        else if (pattern.test) {
            return pattern.test(name);
        }
        /* istanbul ignore next */
        return false;
    }
    function onActivated(hook, target) {
        registerKeepAliveHook(hook, "a" /* ACTIVATED */, target);
    }
    function onDeactivated(hook, target) {
        registerKeepAliveHook(hook, "da" /* DEACTIVATED */, target);
    }
    function registerKeepAliveHook(hook, type, target = currentInstance) {
        // cache the deactivate branch check wrapper for injected hooks so the same
        // hook can be properly deduped by the scheduler. "__wdc" stands for "with
        // deactivation check".
        const wrappedHook = hook.__wdc ||
            (hook.__wdc = () => {
                // only fire the hook if the target instance is NOT in a deactivated branch.
                let current = target;
                while (current) {
                    if (current.isDeactivated) {
                        return;
                    }
                    current = current.parent;
                }
                hook();
            });
        injectHook(type, wrappedHook, target);
        // In addition to registering it on the target instance, we walk up the parent
        // chain and register it on all ancestor instances that are keep-alive roots.
        // This avoids the need to walk the entire component tree when invoking these
        // hooks, and more importantly, avoids the need to track child components in
        // arrays.
        if (target) {
            let current = target.parent;
            while (current && current.parent) {
                if (isKeepAlive(current.parent.vnode)) {
                    injectToKeepAliveRoot(wrappedHook, type, target, current);
                }
                current = current.parent;
            }
        }
    }
    function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
        // injectHook wraps the original for error handling, so make sure to remove
        // the wrapped version.
        const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */);
        onUnmounted(() => {
            remove(keepAliveRoot[type], injected);
        }, target);
    }
    function resetShapeFlag(vnode) {
        let shapeFlag = vnode.shapeFlag;
        if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
            shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        }
        if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
            shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
        }
        vnode.shapeFlag = shapeFlag;
    }
    function getInnerChild(vnode) {
        return vnode.shapeFlag & 128 /* SUSPENSE */ ? vnode.ssContent : vnode;
    }

    const isInternalKey = (key) => key[0] === '_' || key === '$stable';
    const normalizeSlotValue = (value) => isArray$1(value)
        ? value.map(normalizeVNode)
        : [normalizeVNode(value)];
    const normalizeSlot = (key, rawSlot, ctx) => withCtx((props) => {
        if ( currentInstance) {
            warn(`Slot "${key}" invoked outside of the render function: ` +
                `this will not track dependencies used in the slot. ` +
                `Invoke the slot function inside the render function instead.`);
        }
        return normalizeSlotValue(rawSlot(props));
    }, ctx);
    const normalizeObjectSlots = (rawSlots, slots) => {
        const ctx = rawSlots._ctx;
        for (const key in rawSlots) {
            if (isInternalKey(key))
                continue;
            const value = rawSlots[key];
            if (isFunction$1(value)) {
                slots[key] = normalizeSlot(key, value, ctx);
            }
            else if (value != null) {
                {
                    warn(`Non-function value encountered for slot "${key}". ` +
                        `Prefer function slots for better performance.`);
                }
                const normalized = normalizeSlotValue(value);
                slots[key] = () => normalized;
            }
        }
    };
    const normalizeVNodeSlots = (instance, children) => {
        if ( !isKeepAlive(instance.vnode)) {
            warn(`Non-function value encountered for default slot. ` +
                `Prefer function slots for better performance.`);
        }
        const normalized = normalizeSlotValue(children);
        instance.slots.default = () => normalized;
    };
    const initSlots = (instance, children) => {
        if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                instance.slots = children;
                // make compiler marker non-enumerable
                def$1(children, '_', type);
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
        def$1(instance.slots, InternalObjectKey, 1);
    };
    const updateSlots = (instance, children) => {
        const { vnode, slots } = instance;
        let needDeletionCheck = true;
        let deletionComparisonTarget = EMPTY_OBJ$1;
        if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                // compiled slots.
                if ( isHmrUpdating) {
                    // Parent was HMR updated so slot content may have changed.
                    // force update slots and mark instance for hmr as well
                    extend$1(slots, children);
                }
                else if (type === 1 /* STABLE */) {
                    // compiled AND stable.
                    // no need to update, and skip stale slots removal.
                    needDeletionCheck = false;
                }
                else {
                    // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                    // normalization.
                    extend$1(slots, children);
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

    /**
    Runtime helper for applying directives to a vnode. Example usage:

    const comp = resolveComponent('comp')
    const foo = resolveDirective('foo')
    const bar = resolveDirective('bar')

    return withDirectives(h(comp), [
      [foo, this.x],
      [bar, this.y]
    ])
    */
    const isBuiltInDirective = /*#__PURE__*/ makeMap('bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text');
    function validateDirectiveName(name) {
        if (isBuiltInDirective(name)) {
            warn('Do not use built-in directive ids as custom directive id: ' + name);
        }
    }
    /**
     * Adds directives to a VNode.
     */
    function withDirectives(vnode, directives) {
        const internalInstance = currentRenderingInstance;
        if (internalInstance === null) {
             warn(`withDirectives can only be used inside render functions.`);
            return vnode;
        }
        const instance = internalInstance.proxy;
        const bindings = vnode.dirs || (vnode.dirs = []);
        for (let i = 0; i < directives.length; i++) {
            let [dir, value, arg, modifiers = EMPTY_OBJ$1] = directives[i];
            if (isFunction$1(dir)) {
                dir = {
                    mounted: dir,
                    updated: dir
                };
            }
            bindings.push({
                dir,
                instance,
                value,
                oldValue: void 0,
                arg,
                modifiers
            });
        }
        return vnode;
    }
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
            if (rootProps != null && !isObject$1(rootProps)) {
                 warn(`root props passed to app.mount() must be an object.`);
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
                    {
                        warn(`app.config cannot be replaced. Modify individual options instead.`);
                    }
                },
                use(plugin, ...options) {
                    if (installedPlugins.has(plugin)) {
                         warn(`Plugin has already been applied to target app.`);
                    }
                    else if (plugin && isFunction$1(plugin.install)) {
                        installedPlugins.add(plugin);
                        plugin.install(app, ...options);
                    }
                    else if (isFunction$1(plugin)) {
                        installedPlugins.add(plugin);
                        plugin(app, ...options);
                    }
                    else {
                        warn(`A plugin must either be a function or an object with an "install" ` +
                            `function.`);
                    }
                    return app;
                },
                mixin(mixin) {
                    {
                        warn('Mixins are only available in builds supporting Options API');
                    }
                    return app;
                },
                component(name, component) {
                    {
                        validateComponentName(name, context.config);
                    }
                    if (!component) {
                        return context.components[name];
                    }
                    if ( context.components[name]) {
                        warn(`Component "${name}" has already been registered in target app.`);
                    }
                    context.components[name] = component;
                    return app;
                },
                directive(name, directive) {
                    {
                        validateDirectiveName(name);
                    }
                    if (!directive) {
                        return context.directives[name];
                    }
                    if ( context.directives[name]) {
                        warn(`Directive "${name}" has already been registered in target app.`);
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
                        // HMR root reload
                        {
                            context.reload = () => {
                                render(cloneVNode(vnode), rootContainer);
                            };
                        }
                        if (isHydrate && hydrate) {
                            hydrate(vnode, rootContainer);
                        }
                        else {
                            render(vnode, rootContainer);
                        }
                        isMounted = true;
                        app._container = rootContainer;
                        rootContainer.__vue_app__ = app;
                        {
                            devtoolsInitApp(app, version);
                        }
                        return vnode.component.proxy;
                    }
                    else {
                        warn(`App has already been mounted.\n` +
                            `If you want to remount the same app, move your app creation logic ` +
                            `into a factory function and create fresh app instances for each ` +
                            `mount - e.g. \`const createMyApp = () => createApp(App)\``);
                    }
                },
                unmount() {
                    if (isMounted) {
                        render(null, app._container);
                        {
                            devtoolsUnmountApp(app);
                        }
                    }
                    else {
                        warn(`Cannot unmount an app that is not mounted.`);
                    }
                },
                provide(key, value) {
                    if ( key in context.provides) {
                        warn(`App already provides property with key "${String(key)}". ` +
                            `It will be overwritten with the new value.`);
                    }
                    // TypeScript doesn't allow symbols as index type
                    // https://github.com/Microsoft/TypeScript/issues/24587
                    context.provides[key] = value;
                    return app;
                }
            });
            return app;
        };
    }

    let hasMismatch = false;
    const isSVGContainer = (container) => /svg/.test(container.namespaceURI) && container.tagName !== 'foreignObject';
    const isComment = (node) => node.nodeType === 8 /* COMMENT */;
    // Note: hydration is DOM-specific
    // But we have to place it in core due to tight coupling with core - splitting
    // it out creates a ton of unnecessary complexity.
    // Hydration also depends on some renderer internal logic which needs to be
    // passed in via arguments.
    function createHydrationFunctions(rendererInternals) {
        const { mt: mountComponent, p: patch, o: { patchProp, nextSibling, parentNode, remove, insert, createComment } } = rendererInternals;
        const hydrate = (vnode, container) => {
            if ( !container.hasChildNodes()) {
                warn(`Attempting to hydrate existing markup but container is empty. ` +
                    `Performing full mount instead.`);
                patch(null, vnode, container);
                return;
            }
            hasMismatch = false;
            hydrateNode(container.firstChild, vnode, null, null);
            flushPostFlushCbs();
            if (hasMismatch && !false) {
                // this error should show up in production
                console.error(`Hydration completed but contains mismatches.`);
            }
        };
        const hydrateNode = (node, vnode, parentComponent, parentSuspense, optimized = false) => {
            const isFragmentStart = isComment(node) && node.data === '[';
            const onMismatch = () => handleMismatch(node, vnode, parentComponent, parentSuspense, isFragmentStart);
            const { type, ref, shapeFlag } = vnode;
            const domType = node.nodeType;
            vnode.el = node;
            let nextNode = null;
            switch (type) {
                case Text:
                    if (domType !== 3 /* TEXT */) {
                        nextNode = onMismatch();
                    }
                    else {
                        if (node.data !== vnode.children) {
                            hasMismatch = true;
                            
                                warn(`Hydration text mismatch:` +
                                    `\n- Client: ${JSON.stringify(node.data)}` +
                                    `\n- Server: ${JSON.stringify(vnode.children)}`);
                            node.data = vnode.children;
                        }
                        nextNode = nextSibling(node);
                    }
                    break;
                case Comment:
                    if (domType !== 8 /* COMMENT */ || isFragmentStart) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = nextSibling(node);
                    }
                    break;
                case Static:
                    if (domType !== 1 /* ELEMENT */) {
                        nextNode = onMismatch();
                    }
                    else {
                        // determine anchor, adopt content
                        nextNode = node;
                        // if the static vnode has its content stripped during build,
                        // adopt it from the server-rendered HTML.
                        const needToAdoptContent = !vnode.children.length;
                        for (let i = 0; i < vnode.staticCount; i++) {
                            if (needToAdoptContent)
                                vnode.children += nextNode.outerHTML;
                            if (i === vnode.staticCount - 1) {
                                vnode.anchor = nextNode;
                            }
                            nextNode = nextSibling(nextNode);
                        }
                        return nextNode;
                    }
                    break;
                case Fragment:
                    if (!isFragmentStart) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = hydrateFragment(node, vnode, parentComponent, parentSuspense, optimized);
                    }
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        if (domType !== 1 /* ELEMENT */ ||
                            vnode.type !== node.tagName.toLowerCase()) {
                            nextNode = onMismatch();
                        }
                        else {
                            nextNode = hydrateElement(node, vnode, parentComponent, parentSuspense, optimized);
                        }
                    }
                    else if (shapeFlag & 6 /* COMPONENT */) {
                        // when setting up the render effect, if the initial vnode already
                        // has .el set, the component will perform hydration instead of mount
                        // on its sub-tree.
                        const container = parentNode(node);
                        const hydrateComponent = () => {
                            mountComponent(vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), optimized);
                        };
                        // async component
                        const loadAsync = vnode.type.__asyncLoader;
                        if (loadAsync) {
                            loadAsync().then(hydrateComponent);
                        }
                        else {
                            hydrateComponent();
                        }
                        // component may be async, so in the case of fragments we cannot rely
                        // on component's rendered output to determine the end of the fragment
                        // instead, we do a lookahead to find the end anchor node.
                        nextNode = isFragmentStart
                            ? locateClosingAsyncAnchor(node)
                            : nextSibling(node);
                    }
                    else if (shapeFlag & 64 /* TELEPORT */) {
                        if (domType !== 8 /* COMMENT */) {
                            nextNode = onMismatch();
                        }
                        else {
                            nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, optimized, rendererInternals, hydrateChildren);
                        }
                    }
                    else if ( shapeFlag & 128 /* SUSPENSE */) {
                        nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, isSVGContainer(parentNode(node)), optimized, rendererInternals, hydrateNode);
                    }
                    else {
                        warn('Invalid HostVNode type:', type, `(${typeof type})`);
                    }
            }
            if (ref != null && parentComponent) {
                setRef(ref, null, parentComponent, parentSuspense, vnode);
            }
            return nextNode;
        };
        const hydrateElement = (el, vnode, parentComponent, parentSuspense, optimized) => {
            optimized = optimized || !!vnode.dynamicChildren;
            const { props, patchFlag, shapeFlag, dirs } = vnode;
            // skip props & children if this is hoisted static nodes
            if (patchFlag !== -1 /* HOISTED */) {
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'created');
                }
                // props
                if (props) {
                    if (!optimized ||
                        (patchFlag & 16 /* FULL_PROPS */ ||
                            patchFlag & 32 /* HYDRATE_EVENTS */)) {
                        for (const key in props) {
                            if (!isReservedProp(key) && isOn(key)) {
                                patchProp(el, key, null, props[key]);
                            }
                        }
                    }
                    else if (props.onClick) {
                        // Fast path for click listeners (which is most often) to avoid
                        // iterating through props.
                        patchProp(el, 'onClick', null, props.onClick);
                    }
                }
                // vnode / directive hooks
                let vnodeHooks;
                if ((vnodeHooks = props && props.onVnodeBeforeMount)) {
                    invokeVNodeHook(vnodeHooks, parentComponent, vnode);
                }
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
                }
                if ((vnodeHooks = props && props.onVnodeMounted) || dirs) {
                    queueEffectWithSuspense(() => {
                        vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
                        dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                    }, parentSuspense);
                }
                // children
                if (shapeFlag & 16 /* ARRAY_CHILDREN */ &&
                    // skip if element has innerHTML / textContent
                    !(props && (props.innerHTML || props.textContent))) {
                    let next = hydrateChildren(el.firstChild, vnode, el, parentComponent, parentSuspense, optimized);
                    let hasWarned = false;
                    while (next) {
                        hasMismatch = true;
                        if ( !hasWarned) {
                            warn(`Hydration children mismatch in <${vnode.type}>: ` +
                                `server rendered element contains more child nodes than client vdom.`);
                            hasWarned = true;
                        }
                        // The SSRed DOM contains more nodes than it should. Remove them.
                        const cur = next;
                        next = next.nextSibling;
                        remove(cur);
                    }
                }
                else if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                    if (el.textContent !== vnode.children) {
                        hasMismatch = true;
                        
                            warn(`Hydration text content mismatch in <${vnode.type}>:\n` +
                                `- Client: ${el.textContent}\n` +
                                `- Server: ${vnode.children}`);
                        el.textContent = vnode.children;
                    }
                }
            }
            return el.nextSibling;
        };
        const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, optimized) => {
            optimized = optimized || !!parentVNode.dynamicChildren;
            const children = parentVNode.children;
            const l = children.length;
            let hasWarned = false;
            for (let i = 0; i < l; i++) {
                const vnode = optimized
                    ? children[i]
                    : (children[i] = normalizeVNode(children[i]));
                if (node) {
                    node = hydrateNode(node, vnode, parentComponent, parentSuspense, optimized);
                }
                else {
                    hasMismatch = true;
                    if ( !hasWarned) {
                        warn(`Hydration children mismatch in <${container.tagName.toLowerCase()}>: ` +
                            `server rendered element contains fewer child nodes than client vdom.`);
                        hasWarned = true;
                    }
                    // the SSRed DOM didn't contain enough nodes. Mount the missing ones.
                    patch(null, vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container));
                }
            }
            return node;
        };
        const hydrateFragment = (node, vnode, parentComponent, parentSuspense, optimized) => {
            const container = parentNode(node);
            const next = hydrateChildren(nextSibling(node), vnode, container, parentComponent, parentSuspense, optimized);
            if (next && isComment(next) && next.data === ']') {
                return nextSibling((vnode.anchor = next));
            }
            else {
                // fragment didn't hydrate successfully, since we didn't get a end anchor
                // back. This should have led to node/children mismatch warnings.
                hasMismatch = true;
                // since the anchor is missing, we need to create one and insert it
                insert((vnode.anchor = createComment(`]`)), container, next);
                return next;
            }
        };
        const handleMismatch = (node, vnode, parentComponent, parentSuspense, isFragment) => {
            hasMismatch = true;
            
                warn(`Hydration node mismatch:\n- Client vnode:`, vnode.type, `\n- Server rendered DOM:`, node, node.nodeType === 3 /* TEXT */
                    ? `(text)`
                    : isComment(node) && node.data === '['
                        ? `(start of fragment)`
                        : ``);
            vnode.el = null;
            if (isFragment) {
                // remove excessive fragment nodes
                const end = locateClosingAsyncAnchor(node);
                while (true) {
                    const next = nextSibling(node);
                    if (next && next !== end) {
                        remove(next);
                    }
                    else {
                        break;
                    }
                }
            }
            const next = nextSibling(node);
            const container = parentNode(node);
            remove(node);
            patch(null, vnode, container, next, parentComponent, parentSuspense, isSVGContainer(container));
            return next;
        };
        const locateClosingAsyncAnchor = (node) => {
            let match = 0;
            while (node) {
                node = nextSibling(node);
                if (node && isComment(node)) {
                    if (node.data === '[')
                        match++;
                    if (node.data === ']') {
                        if (match === 0) {
                            return nextSibling(node);
                        }
                        else {
                            match--;
                        }
                    }
                }
            }
            return node;
        };
        return [hydrate, hydrateNode];
    }

    let supported;
    let perf;
    function startMeasure(instance, type) {
        if (instance.appContext.config.performance && isSupported()) {
            perf.mark(`vue-${type}-${instance.uid}`);
        }
    }
    function endMeasure(instance, type) {
        if (instance.appContext.config.performance && isSupported()) {
            const startTag = `vue-${type}-${instance.uid}`;
            const endTag = startTag + `:end`;
            perf.mark(endTag);
            perf.measure(`<${formatComponentName(instance, instance.type)}> ${type}`, startTag, endTag);
            perf.clearMarks(startTag);
            perf.clearMarks(endTag);
        }
    }
    function isSupported() {
        if (supported !== undefined) {
            return supported;
        }
        /* eslint-disable no-restricted-globals */
        if (typeof window !== 'undefined' && window.performance) {
            supported = true;
            perf = window.performance;
        }
        else {
            supported = false;
        }
        /* eslint-enable no-restricted-globals */
        return supported;
    }
    function createDevEffectOptions(instance) {
        return {
            scheduler: queueJob,
            allowRecurse: true,
            onTrack: instance.rtc ? e => invokeArrayFns(instance.rtc, e) : void 0,
            onTrigger: instance.rtg ? e => invokeArrayFns(instance.rtg, e) : void 0
        };
    }
    const queuePostRenderEffect =  queueEffectWithSuspense
        ;
    const setRef = (rawRef, oldRawRef, parentComponent, parentSuspense, vnode) => {
        if (isArray$1(rawRef)) {
            rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray$1(oldRawRef) ? oldRawRef[i] : oldRawRef), parentComponent, parentSuspense, vnode));
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
        if ( !owner) {
            warn(`Missing ref owner context. ref cannot be used on hoisted vnodes. ` +
                `A vnode with ref must be created inside the render function.`);
            return;
        }
        const oldRef = oldRawRef && oldRawRef.r;
        const refs = owner.refs === EMPTY_OBJ$1 ? (owner.refs = {}) : owner.refs;
        const setupState = owner.setupState;
        // unset old ref
        if (oldRef != null && oldRef !== ref) {
            if (isString$1(oldRef)) {
                refs[oldRef] = null;
                if (hasOwn$1(setupState, oldRef)) {
                    setupState[oldRef] = null;
                }
            }
            else if (isRef(oldRef)) {
                oldRef.value = null;
            }
        }
        if (isString$1(ref)) {
            const doSet = () => {
                refs[ref] = value;
                if (hasOwn$1(setupState, ref)) {
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
        else if (isFunction$1(ref)) {
            callWithErrorHandling(ref, parentComponent, 12 /* FUNCTION_REF */, [
                value,
                refs
            ]);
        }
        else {
            warn('Invalid template ref type:', value, `(${typeof value})`);
        }
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
    // Separate API for creating hydration-enabled renderer.
    // Hydration logic is only used when calling this function, making it
    // tree-shakable.
    function createHydrationRenderer(options) {
        return baseCreateRenderer(options, createHydrationFunctions);
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
                    else {
                        patchStaticNode(n1, n2, container, isSVG);
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
                    else {
                        warn('Invalid VNode type:', type, `(${typeof type})`);
                    }
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
        /**
         * Dev / HMR only
         */
        const patchStaticNode = (n1, n2, container, isSVG) => {
            // static nodes are only patched during dev for HMR
            if (n2.children !== n1.children) {
                const anchor = hostNextSibling(n1.anchor);
                // remove existing
                removeStaticNode(n1);
                [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
            }
            else {
                n2.el = n1.el;
                n2.anchor = n1.anchor;
            }
        };
        /**
         * Dev / HMR only
         */
        const moveStaticNode = (vnode, container, anchor) => {
            let cur = vnode.el;
            const end = vnode.anchor;
            while (cur && cur !== end) {
                const next = hostNextSibling(cur);
                hostInsert(cur, container, anchor);
                cur = next;
            }
            hostInsert(end, container, anchor);
        };
        /**
         * Dev / HMR only
         */
        const removeStaticNode = (vnode) => {
            let cur = vnode.el;
            while (cur && cur !== vnode.anchor) {
                const next = hostNextSibling(cur);
                hostRemove(cur);
                cur = next;
            }
            hostRemove(vnode.anchor);
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
            {
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
            {
                Object.defineProperty(el, '__vnode', {
                    value: vnode,
                    enumerable: false
                });
                Object.defineProperty(el, '__vueParentComponent', {
                    value: parentComponent,
                    enumerable: false
                });
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
                if ( subTree.type === Fragment) {
                    subTree =
                        filterSingleRoot(subTree.children) || subTree;
                }
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
            const oldProps = n1.props || EMPTY_OBJ$1;
            const newProps = n2.props || EMPTY_OBJ$1;
            let vnodeHook;
            if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
                invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
            }
            if (dirs) {
                invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
            }
            if ( isHmrUpdating) {
                // HMR updated, force full diff
                patchFlag = 0;
                optimized = false;
                dynamicChildren = null;
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
                if (
                    parentComponent &&
                    parentComponent.type.__hmrId) {
                    traverseStaticChildren(n1, n2);
                }
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
                if (oldProps !== EMPTY_OBJ$1) {
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
            if ( isHmrUpdating) {
                // HMR updated, force full diff
                patchFlag = 0;
                optimized = false;
                dynamicChildren = null;
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
                    if ( parentComponent && parentComponent.type.__hmrId) {
                        traverseStaticChildren(n1, n2);
                    }
                    else if (
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
            if ( instance.type.__hmrId) {
                registerHMR(instance);
            }
            {
                pushWarningContext(initialVNode);
                startMeasure(instance, `mount`);
            }
            // inject renderer internals for keepAlive
            if (isKeepAlive(initialVNode)) {
                instance.ctx.renderer = internals;
            }
            // resolve props and slots for setup context
            {
                startMeasure(instance, `init`);
            }
            setupComponent(instance);
            {
                endMeasure(instance, `init`);
            }
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
            {
                popWarningContext();
                endMeasure(instance, `mount`);
            }
        };
        const updateComponent = (n1, n2, optimized) => {
            const instance = (n2.component = n1.component);
            if (shouldUpdateComponent(n1, n2, optimized)) {
                if (
                    instance.asyncDep &&
                    !instance.asyncResolved) {
                    // async & still pending - just update props and slots
                    // since the component's reactive effect for render isn't set-up yet
                    {
                        pushWarningContext(n2);
                    }
                    updateComponentPreRender(instance, n2, optimized);
                    {
                        popWarningContext();
                    }
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
                    // render
                    {
                        startMeasure(instance, `render`);
                    }
                    const subTree = (instance.subTree = renderComponentRoot(instance));
                    {
                        endMeasure(instance, `render`);
                    }
                    if (el && hydrateNode) {
                        {
                            startMeasure(instance, `hydrate`);
                        }
                        // vnode has adopted host node - perform hydration instead of mount.
                        hydrateNode(initialVNode.el, subTree, instance, parentSuspense);
                        {
                            endMeasure(instance, `hydrate`);
                        }
                    }
                    else {
                        {
                            startMeasure(instance, `patch`);
                        }
                        patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                        {
                            endMeasure(instance, `patch`);
                        }
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
                    {
                        pushWarningContext(next || instance.vnode);
                    }
                    if (next) {
                        next.el = vnode.el;
                        updateComponentPreRender(instance, next, optimized);
                    }
                    else {
                        next = vnode;
                    }
                    // beforeUpdate hook
                    if (bu) {
                        invokeArrayFns(bu);
                    }
                    // onVnodeBeforeUpdate
                    if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                        invokeVNodeHook(vnodeHook, parent, next, vnode);
                    }
                    // render
                    {
                        startMeasure(instance, `render`);
                    }
                    const nextTree = renderComponentRoot(instance);
                    {
                        endMeasure(instance, `render`);
                    }
                    const prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    {
                        startMeasure(instance, `patch`);
                    }
                    patch(prevTree, nextTree, 
                    // parent may have changed if it's in a teleport
                    hostParentNode(prevTree.el), 
                    // anchor may have changed if it's in a fragment
                    getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                    {
                        endMeasure(instance, `patch`);
                    }
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
                    {
                        devtoolsComponentUpdated(instance);
                    }
                    {
                        popWarningContext();
                    }
                }
            },  createDevEffectOptions(instance) );
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
                unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
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
                        if ( keyToNewIndexMap.has(nextChild.key)) {
                            warn(`Duplicate keys found during update:`, JSON.stringify(nextChild.key), `Make sure keys are unique.`);
                        }
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
            // static node move can only happen when force updating HMR
            if ( type === Static) {
                moveStaticNode(vnode, container, anchor);
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
        const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
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
                    unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
                }
                else if (!optimized && shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    unmountChildren(children, parentComponent, parentSuspense);
                }
                // an unmounted teleport should always remove its children if not disabled
                if (shapeFlag & 64 /* TELEPORT */ &&
                    (doRemove || !isTeleportDisabled(vnode.props))) {
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
            if ( type === Static) {
                removeStaticNode(vnode);
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
            if ( instance.type.__hmrId) {
                unregisterHMR(instance);
            }
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
            {
                devtoolsComponentRemoved(instance);
            }
        };
        const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
            for (let i = start; i < children.length; i++) {
                unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
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
    function traverseStaticChildren(n1, n2, shallow = false) {
        const ch1 = n1.children;
        const ch2 = n2.children;
        if (isArray$1(ch1) && isArray$1(ch2)) {
            for (let i = 0; i < ch1.length; i++) {
                // this is only called in the optimized path so array children are
                // guaranteed to be vnodes
                const c1 = ch1[i];
                let c2 = ch2[i];
                if (c2.shapeFlag & 1 /* ELEMENT */ && !c2.dynamicChildren) {
                    if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* HYDRATE_EVENTS */) {
                        c2 = ch2[i] = cloneIfMounted(ch2[i]);
                        c2.el = c1.el;
                    }
                    if (!shallow)
                        traverseStaticChildren(c1, c2);
                }
                // also inherit for comment nodes, but not placeholders (e.g. v-if which
                // would have received .el during block patch)
                if ( c2.type === Comment && !c2.el) {
                    c2.el = c1.el;
                }
            }
        }
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

    const isTeleport = (type) => type.__isTeleport;
    const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === '');
    const resolveTarget = (props, select) => {
        const targetSelector = props && props.to;
        if (isString$1(targetSelector)) {
            if (!select) {
                
                    warn(`Current renderer does not support string target for Teleports. ` +
                        `(missing querySelector renderer option)`);
                return null;
            }
            else {
                const target = select(targetSelector);
                if (!target) {
                    
                        warn(`Failed to locate Teleport target with selector "${targetSelector}". ` +
                            `Note the target element must exist before the component is mounted - ` +
                            `i.e. the target cannot be rendered by the component itself, and ` +
                            `ideally should be outside of the entire Vue component tree.`);
                }
                return target;
            }
        }
        else {
            if ( !targetSelector && !isTeleportDisabled(props)) {
                warn(`Invalid Teleport target: ${targetSelector}`);
            }
            return targetSelector;
        }
    };
    const TeleportImpl = {
        __isTeleport: true,
        process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals) {
            const { mc: mountChildren, pc: patchChildren, pbc: patchBlockChildren, o: { insert, querySelector, createText, createComment } } = internals;
            const disabled = isTeleportDisabled(n2.props);
            const { shapeFlag, children } = n2;
            if (n1 == null) {
                // insert anchors in the main view
                const placeholder = (n2.el =  createComment('teleport start')
                    );
                const mainAnchor = (n2.anchor =  createComment('teleport end')
                    );
                insert(placeholder, container, anchor);
                insert(mainAnchor, container, anchor);
                const target = (n2.target = resolveTarget(n2.props, querySelector));
                const targetAnchor = (n2.targetAnchor = createText(''));
                if (target) {
                    insert(targetAnchor, target);
                }
                else if ( !disabled) {
                    warn('Invalid Teleport target on mount:', target, `(${typeof target})`);
                }
                const mount = (container, anchor) => {
                    // Teleport *always* has Array children. This is enforced in both the
                    // compiler and vnode children normalization.
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        mountChildren(children, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                };
                if (disabled) {
                    mount(container, mainAnchor);
                }
                else if (target) {
                    mount(target, targetAnchor);
                }
            }
            else {
                // update content
                n2.el = n1.el;
                const mainAnchor = (n2.anchor = n1.anchor);
                const target = (n2.target = n1.target);
                const targetAnchor = (n2.targetAnchor = n1.targetAnchor);
                const wasDisabled = isTeleportDisabled(n1.props);
                const currentContainer = wasDisabled ? container : target;
                const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
                if (n2.dynamicChildren) {
                    // fast path when the teleport happens to be a block root
                    patchBlockChildren(n1.dynamicChildren, n2.dynamicChildren, currentContainer, parentComponent, parentSuspense, isSVG);
                    // even in block tree mode we need to make sure all root-level nodes
                    // in the teleport inherit previous DOM references so that they can
                    // be moved in future patches.
                    traverseStaticChildren(n1, n2, true);
                }
                else if (!optimized) {
                    patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent, parentSuspense, isSVG);
                }
                if (disabled) {
                    if (!wasDisabled) {
                        // enabled -> disabled
                        // move into main container
                        moveTeleport(n2, container, mainAnchor, internals, 1 /* TOGGLE */);
                    }
                }
                else {
                    // target changed
                    if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
                        const nextTarget = (n2.target = resolveTarget(n2.props, querySelector));
                        if (nextTarget) {
                            moveTeleport(n2, nextTarget, null, internals, 0 /* TARGET_CHANGE */);
                        }
                        else {
                            warn('Invalid Teleport target on update:', target, `(${typeof target})`);
                        }
                    }
                    else if (wasDisabled) {
                        // disabled -> enabled
                        // move into teleport target
                        moveTeleport(n2, target, targetAnchor, internals, 1 /* TOGGLE */);
                    }
                }
            }
        },
        remove(vnode, { r: remove, o: { remove: hostRemove } }) {
            const { shapeFlag, children, anchor } = vnode;
            hostRemove(anchor);
            if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                for (let i = 0; i < children.length; i++) {
                    remove(children[i]);
                }
            }
        },
        move: moveTeleport,
        hydrate: hydrateTeleport
    };
    function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2 /* REORDER */) {
        // move target anchor if this is a target change.
        if (moveType === 0 /* TARGET_CHANGE */) {
            insert(vnode.targetAnchor, container, parentAnchor);
        }
        const { el, anchor, shapeFlag, children, props } = vnode;
        const isReorder = moveType === 2 /* REORDER */;
        // move main view anchor if this is a re-order.
        if (isReorder) {
            insert(el, container, parentAnchor);
        }
        // if this is a re-order and teleport is enabled (content is in target)
        // do not move children. So the opposite is: only move children if this
        // is not a reorder, or the teleport is disabled
        if (!isReorder || isTeleportDisabled(props)) {
            // Teleport has either Array children or no children.
            if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                for (let i = 0; i < children.length; i++) {
                    move(children[i], container, parentAnchor, 2 /* REORDER */);
                }
            }
        }
        // move main view anchor if this is a re-order.
        if (isReorder) {
            insert(anchor, container, parentAnchor);
        }
    }
    function hydrateTeleport(node, vnode, parentComponent, parentSuspense, optimized, { o: { nextSibling, parentNode, querySelector } }, hydrateChildren) {
        const target = (vnode.target = resolveTarget(vnode.props, querySelector));
        if (target) {
            // if multiple teleports rendered to the same target element, we need to
            // pick up from where the last teleport finished instead of the first node
            const targetNode = target._lpa || target.firstChild;
            if (vnode.shapeFlag & 16 /* ARRAY_CHILDREN */) {
                if (isTeleportDisabled(vnode.props)) {
                    vnode.anchor = hydrateChildren(nextSibling(node), vnode, parentNode(node), parentComponent, parentSuspense, optimized);
                    vnode.targetAnchor = targetNode;
                }
                else {
                    vnode.anchor = nextSibling(node);
                    vnode.targetAnchor = hydrateChildren(targetNode, vnode, target, parentComponent, parentSuspense, optimized);
                }
                target._lpa =
                    vnode.targetAnchor && nextSibling(vnode.targetAnchor);
            }
        }
        return vnode.anchor && nextSibling(vnode.anchor);
    }
    // Force-casted public typing for h and TSX props inference
    const Teleport = TeleportImpl;

    const COMPONENTS = 'components';
    const DIRECTIVES = 'directives';
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
        if (isString$1(component)) {
            return resolveAsset(COMPONENTS, component, false) || component;
        }
        else {
            // invalid types will fallthrough to createVNode and raise warning
            return (component || NULL_DYNAMIC_COMPONENT);
        }
    }
    /**
     * @private
     */
    function resolveDirective(name) {
        return resolveAsset(DIRECTIVES, name);
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
                        selfName === capitalize$1(camelize(name)))) {
                    return Component;
                }
            }
            const res = 
            // local registration
            // check instance[type] first for components with mixin or extends.
            resolve(instance[type] || Component[type], name) ||
                // global registration
                resolve(instance.appContext[type], name);
            if ( warnMissing && !res) {
                warn(`Failed to resolve ${type.slice(0, -1)}: ${name}`);
            }
            return res;
        }
        else {
            warn(`resolve${capitalize$1(type.slice(0, -1))} ` +
                `can only be used in render() or setup().`);
        }
    }
    function resolve(registry, name) {
        return (registry &&
            (registry[name] ||
                registry[camelize(name)] ||
                registry[capitalize$1(camelize(name))]));
    }

    const Fragment = Symbol( 'Fragment' );
    const Text = Symbol( 'Text' );
    const Comment = Symbol( 'Comment' );
    const Static = Symbol( 'Static' );
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
    // Whether we should be tracking dynamic child nodes inside a block.
    // Only tracks when this value is > 0
    // We are not using a simple boolean because this value may need to be
    // incremented/decremented by nested usage of v-once (see below)
    let shouldTrack$1 = 1;
    /**
     * Block tracking sometimes needs to be disabled, for example during the
     * creation of a tree that needs to be cached by v-once. The compiler generates
     * code like this:
     *
     * ``` js
     * _cache[1] || (
     *   setBlockTracking(-1),
     *   _cache[1] = createVNode(...),
     *   setBlockTracking(1),
     *   _cache[1]
     * )
     * ```
     *
     * @private
     */
    function setBlockTracking(value) {
        shouldTrack$1 += value;
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
        if (shouldTrack$1 > 0 && currentBlock) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    function isSameVNodeType(n1, n2) {
        if (
            n2.shapeFlag & 6 /* COMPONENT */ &&
            hmrDirtyComponents.has(n2.type)) {
            // HMR only: if the component has been hot-updated, force a reload.
            return false;
        }
        return n1.type === n2.type && n1.key === n2.key;
    }
    let vnodeArgsTransformer;
    /**
     * Internal API for registering an arguments transform for createVNode
     * used for creating stubs in the test-utils
     * It is *internal* but needs to be exposed for test-utils to pick up proper
     * typings
     */
    function transformVNodeArgs(transformer) {
        vnodeArgsTransformer = transformer;
    }
    const createVNodeWithArgsTransform = (...args) => {
        return _createVNode(...(vnodeArgsTransformer
            ? vnodeArgsTransformer(args, currentRenderingInstance)
            : args));
    };
    const InternalObjectKey = `__vInternal`;
    const normalizeKey = ({ key }) => key != null ? key : null;
    const normalizeRef = ({ ref }) => {
        return (ref != null
            ? isArray$1(ref)
                ? ref
                : { i: currentRenderingInstance, r: ref }
            : null);
    };
    const createVNode = ( createVNodeWithArgsTransform
        );
    function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (!type || type === NULL_DYNAMIC_COMPONENT) {
            if ( !type) {
                warn(`Invalid vnode type when creating vnode: ${type}.`);
            }
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
                props = extend$1({}, props);
            }
            let { class: klass, style } = props;
            if (klass && !isString$1(klass)) {
                props.class = normalizeClass(klass);
            }
            if (isObject$1(style)) {
                // reactive state objects need to be cloned since they are likely to be
                // mutated
                if (isProxy(style) && !isArray$1(style)) {
                    style = extend$1({}, style);
                }
                props.style = normalizeStyle(style);
            }
        }
        // encode the vnode type information into a bitmap
        const shapeFlag = isString$1(type)
            ? 1 /* ELEMENT */
            :  isSuspense(type)
                ? 128 /* SUSPENSE */
                : isTeleport(type)
                    ? 64 /* TELEPORT */
                    : isObject$1(type)
                        ? 4 /* STATEFUL_COMPONENT */
                        : isFunction$1(type)
                            ? 2 /* FUNCTIONAL_COMPONENT */
                            : 0;
        if ( shapeFlag & 4 /* STATEFUL_COMPONENT */ && isProxy(type)) {
            type = toRaw(type);
            warn(`Vue received a Component which was made a reactive object. This can ` +
                `lead to unnecessary performance overhead, and should be avoided by ` +
                `marking the component with \`markRaw\` or using \`shallowRef\` ` +
                `instead of \`ref\`.`, `\nComponent that was made reactive: `, type);
        }
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
        // validate key
        if ( vnode.key !== vnode.key) {
            warn(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
        }
        normalizeChildren(vnode, children);
        // normalize suspense children
        if ( shapeFlag & 128 /* SUSPENSE */) {
            const { content, fallback } = normalizeSuspenseChildren(vnode);
            vnode.ssContent = content;
            vnode.ssFallback = fallback;
        }
        if (shouldTrack$1 > 0 &&
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
                        ? isArray$1(ref)
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
    function createStaticVNode(content, numberOfNodes) {
        // A static vnode can contain multiple stringified elements, and the number
        // of elements is necessary for hydration.
        const vnode = createVNode(Static, null, content);
        vnode.staticCount = numberOfNodes;
        return vnode;
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
        else if (isArray$1(child)) {
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
        else if (isArray$1(children)) {
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
        else if (isFunction$1(children)) {
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
        const ret = extend$1({}, args[0]);
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

    function provide(key, value) {
        if (!currentInstance) {
            {
                warn(`provide() can only be used inside setup().`);
            }
        }
        else {
            let provides = currentInstance.provides;
            // by default an instance inherits its parent's provides object
            // but when it needs to provide values of its own, it creates its
            // own provides object using parent provides object as prototype.
            // this way in `inject` we can simply look up injections from direct
            // parent and let the prototype chain do the work.
            const parentProvides = currentInstance.parent && currentInstance.parent.provides;
            if (parentProvides === provides) {
                provides = currentInstance.provides = Object.create(parentProvides);
            }
            // TS doesn't allow symbol as index type
            provides[key] = value;
        }
    }
    function inject(key, defaultValue, treatDefaultAsFactory = false) {
        // fallback to `currentRenderingInstance` so that this can be called in
        // a functional component
        const instance = currentInstance || currentRenderingInstance;
        if (instance) {
            const provides = instance.provides;
            if (key in provides) {
                // TS doesn't allow symbol as index type
                return provides[key];
            }
            else if (arguments.length > 1) {
                return treatDefaultAsFactory && isFunction$1(defaultValue)
                    ? defaultValue()
                    : defaultValue;
            }
            else {
                warn(`injection "${String(key)}" not found.`);
            }
        }
        else {
            warn(`inject() can only be used inside setup() or functional components.`);
        }
    }

    const publicPropertiesMap = extend$1(Object.create(null), {
        $: i => i,
        $el: i => i.vnode.el,
        $data: i => i.data,
        $props: i => ( shallowReadonly(i.props) ),
        $attrs: i => ( shallowReadonly(i.attrs) ),
        $slots: i => ( shallowReadonly(i.slots) ),
        $refs: i => ( shallowReadonly(i.refs) ),
        $parent: i => i.parent && i.parent.proxy,
        $root: i => i.root && i.root.proxy,
        $emit: i => i.emit,
        $options: i => ( i.type),
        $forceUpdate: i => () => queueJob(i.update),
        $nextTick: i => nextTick.bind(i.proxy),
        $watch: i => ( NOOP)
    });
    const PublicInstanceProxyHandlers = {
        get({ _: instance }, key) {
            const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
            // let @vue/reactivity know it should never observe Vue public instances.
            if (key === "__v_skip" /* SKIP */) {
                return true;
            }
            // for internal formatters to know that this is a Vue instance
            if ( key === '__isVue') {
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
                else if (setupState !== EMPTY_OBJ$1 && hasOwn$1(setupState, key)) {
                    accessCache[key] = 0 /* SETUP */;
                    return setupState[key];
                }
                else if (data !== EMPTY_OBJ$1 && hasOwn$1(data, key)) {
                    accessCache[key] = 1 /* DATA */;
                    return data[key];
                }
                else if (
                // only cache other properties when instance has declared (thus stable)
                // props
                (normalizedProps = instance.propsOptions[0]) &&
                    hasOwn$1(normalizedProps, key)) {
                    accessCache[key] = 2 /* PROPS */;
                    return props[key];
                }
                else if (ctx !== EMPTY_OBJ$1 && hasOwn$1(ctx, key)) {
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
                     markAttrsAccessed();
                }
                return publicGetter(instance);
            }
            else if (
            // css module (injected by vue-loader)
            (cssModule = type.__cssModules) &&
                (cssModule = cssModule[key])) {
                return cssModule;
            }
            else if (ctx !== EMPTY_OBJ$1 && hasOwn$1(ctx, key)) {
                // user may set custom properties to `this` that start with `$`
                accessCache[key] = 3 /* CONTEXT */;
                return ctx[key];
            }
            else if (
            // global properties
            ((globalProperties = appContext.config.globalProperties),
                hasOwn$1(globalProperties, key))) {
                return globalProperties[key];
            }
            else if (
                currentRenderingInstance &&
                (!isString$1(key) ||
                    // #1091 avoid internal isRef/isVNode checks on component instance leading
                    // to infinite warning loop
                    key.indexOf('__v') !== 0)) {
                if (data !== EMPTY_OBJ$1 &&
                    (key[0] === '$' || key[0] === '_') &&
                    hasOwn$1(data, key)) {
                    warn(`Property ${JSON.stringify(key)} must be accessed via $data because it starts with a reserved ` +
                        `character ("$" or "_") and is not proxied on the render context.`);
                }
                else {
                    warn(`Property ${JSON.stringify(key)} was accessed during render ` +
                        `but is not defined on instance.`);
                }
            }
        },
        set({ _: instance }, key, value) {
            const { data, setupState, ctx } = instance;
            if (setupState !== EMPTY_OBJ$1 && hasOwn$1(setupState, key)) {
                setupState[key] = value;
            }
            else if (data !== EMPTY_OBJ$1 && hasOwn$1(data, key)) {
                data[key] = value;
            }
            else if (key in instance.props) {
                
                    warn(`Attempting to mutate prop "${key}". Props are readonly.`, instance);
                return false;
            }
            if (key[0] === '$' && key.slice(1) in instance) {
                
                    warn(`Attempting to mutate public property "${key}". ` +
                        `Properties starting with $ are reserved and readonly.`, instance);
                return false;
            }
            else {
                if ( key in instance.appContext.config.globalProperties) {
                    Object.defineProperty(ctx, key, {
                        enumerable: true,
                        configurable: true,
                        value
                    });
                }
                else {
                    ctx[key] = value;
                }
            }
            return true;
        },
        has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
            let normalizedProps;
            return (accessCache[key] !== undefined ||
                (data !== EMPTY_OBJ$1 && hasOwn$1(data, key)) ||
                (setupState !== EMPTY_OBJ$1 && hasOwn$1(setupState, key)) ||
                ((normalizedProps = propsOptions[0]) && hasOwn$1(normalizedProps, key)) ||
                hasOwn$1(ctx, key) ||
                hasOwn$1(publicPropertiesMap, key) ||
                hasOwn$1(appContext.config.globalProperties, key));
        }
    };
    {
        PublicInstanceProxyHandlers.ownKeys = (target) => {
            warn(`Avoid app logic that relies on enumerating keys on a component instance. ` +
                `The keys will be empty in production mode to avoid performance overhead.`);
            return Reflect.ownKeys(target);
        };
    }
    const RuntimeCompiledPublicInstanceProxyHandlers = extend$1({}, PublicInstanceProxyHandlers, {
        get(target, key) {
            // fast path for unscopables when using `with` block
            if (key === Symbol.unscopables) {
                return;
            }
            return PublicInstanceProxyHandlers.get(target, key, target);
        },
        has(_, key) {
            const has = key[0] !== '_' && !isGloballyWhitelisted(key);
            if ( !has && PublicInstanceProxyHandlers.has(_, key)) {
                warn(`Property ${JSON.stringify(key)} should not start with _ which is a reserved prefix for Vue internals.`);
            }
            return has;
        }
    });
    // In dev mode, the proxy target exposes the same properties as seen on `this`
    // for easier console inspection. In prod mode it will be an empty object so
    // these properties definitions can be skipped.
    function createRenderContext(instance) {
        const target = {};
        // expose internal instance for proxy handlers
        Object.defineProperty(target, `_`, {
            configurable: true,
            enumerable: false,
            get: () => instance
        });
        // expose public properties
        Object.keys(publicPropertiesMap).forEach(key => {
            Object.defineProperty(target, key, {
                configurable: true,
                enumerable: false,
                get: () => publicPropertiesMap[key](instance),
                // intercepted by the proxy so no need for implementation,
                // but needed to prevent set errors
                set: NOOP
            });
        });
        // expose global properties
        const { globalProperties } = instance.appContext.config;
        Object.keys(globalProperties).forEach(key => {
            Object.defineProperty(target, key, {
                configurable: true,
                enumerable: false,
                get: () => globalProperties[key],
                set: NOOP
            });
        });
        return target;
    }
    // dev only
    function exposePropsOnRenderContext(instance) {
        const { ctx, propsOptions: [propsOptions] } = instance;
        if (propsOptions) {
            Object.keys(propsOptions).forEach(key => {
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => instance.props[key],
                    set: NOOP
                });
            });
        }
    }
    // dev only
    function exposeSetupStateOnRenderContext(instance) {
        const { ctx, setupState } = instance;
        Object.keys(toRaw(setupState)).forEach(key => {
            if (key[0] === '$' || key[0] === '_') {
                warn(`setup() return property ${JSON.stringify(key)} should not start with "$" or "_" ` +
                    `which are reserved prefixes for Vue internals.`);
                return;
            }
            Object.defineProperty(ctx, key, {
                enumerable: true,
                configurable: true,
                get: () => setupState[key],
                set: NOOP
            });
        });
    }

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
            ctx: EMPTY_OBJ$1,
            data: EMPTY_OBJ$1,
            props: EMPTY_OBJ$1,
            attrs: EMPTY_OBJ$1,
            slots: EMPTY_OBJ$1,
            refs: EMPTY_OBJ$1,
            setupState: EMPTY_OBJ$1,
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
            instance.ctx = createRenderContext(instance);
        }
        instance.root = parent ? parent.root : instance;
        instance.emit = emit.bind(null, instance);
        {
            devtoolsComponentAdded(instance);
        }
        return instance;
    }
    let currentInstance = null;
    const getCurrentInstance = () => currentInstance || currentRenderingInstance;
    const setCurrentInstance = (instance) => {
        currentInstance = instance;
    };
    const isBuiltInTag = /*#__PURE__*/ makeMap('slot,component');
    function validateComponentName(name, config) {
        const appIsNativeTag = config.isNativeTag || NO;
        if (isBuiltInTag(name) || appIsNativeTag(name)) {
            warn('Do not use built-in or reserved HTML elements as component id: ' + name);
        }
    }
    let isInSSRComponentSetup = false;
    function setupComponent(instance, isSSR = false) {
        isInSSRComponentSetup = isSSR;
        const { props, children, shapeFlag } = instance.vnode;
        const isStateful = shapeFlag & 4 /* STATEFUL_COMPONENT */;
        initProps(instance, props, isStateful, isSSR);
        initSlots(instance, children);
        const setupResult = isStateful
            ? setupStatefulComponent(instance, isSSR)
            : undefined;
        isInSSRComponentSetup = false;
        return setupResult;
    }
    function setupStatefulComponent(instance, isSSR) {
        const Component = instance.type;
        {
            if (Component.name) {
                validateComponentName(Component.name, instance.appContext.config);
            }
            if (Component.components) {
                const names = Object.keys(Component.components);
                for (let i = 0; i < names.length; i++) {
                    validateComponentName(names[i], instance.appContext.config);
                }
            }
            if (Component.directives) {
                const names = Object.keys(Component.directives);
                for (let i = 0; i < names.length; i++) {
                    validateDirectiveName(names[i]);
                }
            }
        }
        // 0. create render proxy property access cache
        instance.accessCache = {};
        // 1. create public instance / render proxy
        // also mark it raw so it's never observed
        instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
        {
            exposePropsOnRenderContext(instance);
        }
        // 2. call setup()
        const { setup } = Component;
        if (setup) {
            const setupContext = (instance.setupContext =
                setup.length > 1 ? createSetupContext(instance) : null);
            currentInstance = instance;
            pauseTracking();
            const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [ shallowReadonly(instance.props) , setupContext]);
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
        if (isFunction$1(setupResult)) {
            // setup returned an inline render function
            instance.render = setupResult;
        }
        else if (isObject$1(setupResult)) {
            if ( isVNode(setupResult)) {
                warn(`setup() should not return VNodes directly - ` +
                    `return a render function instead.`);
            }
            // setup returned bindings.
            // assuming a render function compiled from template is present.
            {
                instance.devtoolsRawSetupState = setupResult;
            }
            instance.setupState = proxyRefs(setupResult);
            {
                exposeSetupStateOnRenderContext(instance);
            }
        }
        else if ( setupResult !== undefined) {
            warn(`setup() should return an object. Received: ${setupResult === null ? 'null' : typeof setupResult}`);
        }
        finishComponentSetup(instance);
    }
    let compile;
    /**
     * For runtime-dom to register the compiler.
     * Note the exported method uses any to avoid d.ts relying on the compiler types.
     */
    function registerRuntimeCompiler(_compile) {
        compile = _compile;
    }
    function finishComponentSetup(instance, isSSR) {
        const Component = instance.type;
        // template / render function normalization
        if (!instance.render) {
            // could be set from setup()
            if (compile && Component.template && !Component.render) {
                {
                    startMeasure(instance, `compile`);
                }
                Component.render = compile(Component.template, {
                    isCustomElement: instance.appContext.config.isCustomElement,
                    delimiters: Component.delimiters
                });
                {
                    endMeasure(instance, `compile`);
                }
            }
            instance.render = (Component.render || NOOP);
            // for runtime-compiled render functions using `with` blocks, the render
            // proxy used needs a different `has` handler which is more performant and
            // also only allows a whitelist of globals to fallthrough.
            if (instance.render._rc) {
                instance.withProxy = new Proxy(instance.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
            }
        }
        // warn missing template/render
        if ( !Component.render && instance.render === NOOP) {
            /* istanbul ignore if */
            if (!compile && Component.template) {
                warn(`Component provided template option but ` +
                    `runtime compilation is not supported in this build of Vue.` +
                    ( ` Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`
                        ) /* should not happen */);
            }
            else {
                warn(`Component is missing template or render function.`);
            }
        }
    }
    const attrHandlers = {
        get: (target, key) => {
            {
                markAttrsAccessed();
            }
            return target[key];
        },
        set: () => {
            warn(`setupContext.attrs is readonly.`);
            return false;
        },
        deleteProperty: () => {
            warn(`setupContext.attrs is readonly.`);
            return false;
        }
    };
    function createSetupContext(instance) {
        {
            // We use getters in dev in case libs like test-utils overwrite instance
            // properties (overwrites should not be done in prod)
            return Object.freeze({
                get attrs() {
                    return new Proxy(instance.attrs, attrHandlers);
                },
                get slots() {
                    return shallowReadonly(instance.slots);
                },
                get emit() {
                    return (event, ...args) => instance.emit(event, ...args);
                }
            });
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
        let name = isFunction$1(Component)
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
        return isFunction$1(value) && '__vccOpts' in value;
    }

    function computed$1(getterOrOptions) {
        const c = computed(getterOrOptions);
        recordInstanceBoundEffect(c.effect);
        return c;
    }

    // implementation, close to no-op
    function defineComponent(options) {
        return isFunction$1(options) ? { setup: options, name: options.name } : options;
    }

    function defineAsyncComponent(source) {
        if (isFunction$1(source)) {
            source = { loader: source };
        }
        const { loader, loadingComponent: loadingComponent, errorComponent: errorComponent, delay = 200, timeout, // undefined = never times out
        suspensible = true, onError: userOnError } = source;
        let pendingRequest = null;
        let resolvedComp;
        let retries = 0;
        const retry = () => {
            retries++;
            pendingRequest = null;
            return load();
        };
        const load = () => {
            let thisRequest;
            return (pendingRequest ||
                (thisRequest = pendingRequest = loader()
                    .catch(err => {
                    err = err instanceof Error ? err : new Error(String(err));
                    if (userOnError) {
                        return new Promise((resolve, reject) => {
                            const userRetry = () => resolve(retry());
                            const userFail = () => reject(err);
                            userOnError(err, userRetry, userFail, retries + 1);
                        });
                    }
                    else {
                        throw err;
                    }
                })
                    .then((comp) => {
                    if (thisRequest !== pendingRequest && pendingRequest) {
                        return pendingRequest;
                    }
                    if ( !comp) {
                        warn(`Async component loader resolved to undefined. ` +
                            `If you are using retry(), make sure to return its return value.`);
                    }
                    // interop module default
                    if (comp &&
                        (comp.__esModule || comp[Symbol.toStringTag] === 'Module')) {
                        comp = comp.default;
                    }
                    if ( comp && !isObject$1(comp) && !isFunction$1(comp)) {
                        throw new Error(`Invalid async component load result: ${comp}`);
                    }
                    resolvedComp = comp;
                    return comp;
                })));
        };
        return defineComponent({
            __asyncLoader: load,
            name: 'AsyncComponentWrapper',
            setup() {
                const instance = currentInstance;
                // already resolved
                if (resolvedComp) {
                    return () => createInnerComp(resolvedComp, instance);
                }
                const onError = (err) => {
                    pendingRequest = null;
                    handleError(err, instance, 13 /* ASYNC_COMPONENT_LOADER */, !errorComponent /* do not throw in dev if user provided error component */);
                };
                // suspense-controlled or SSR.
                if (( suspensible && instance.suspense) ||
                    (false )) {
                    return load()
                        .then(comp => {
                        return () => createInnerComp(comp, instance);
                    })
                        .catch(err => {
                        onError(err);
                        return () => errorComponent
                            ? createVNode(errorComponent, {
                                error: err
                            })
                            : null;
                    });
                }
                const loaded = ref(false);
                const error = ref();
                const delayed = ref(!!delay);
                if (delay) {
                    setTimeout(() => {
                        delayed.value = false;
                    }, delay);
                }
                if (timeout != null) {
                    setTimeout(() => {
                        if (!loaded.value && !error.value) {
                            const err = new Error(`Async component timed out after ${timeout}ms.`);
                            onError(err);
                            error.value = err;
                        }
                    }, timeout);
                }
                load()
                    .then(() => {
                    loaded.value = true;
                })
                    .catch(err => {
                    onError(err);
                    error.value = err;
                });
                return () => {
                    if (loaded.value && resolvedComp) {
                        return createInnerComp(resolvedComp, instance);
                    }
                    else if (error.value && errorComponent) {
                        return createVNode(errorComponent, {
                            error: error.value
                        });
                    }
                    else if (loadingComponent && !delayed.value) {
                        return createVNode(loadingComponent);
                    }
                };
            }
        });
    }
    function createInnerComp(comp, { vnode: { props, children } }) {
        return createVNode(comp, props, children);
    }

    // Actual implementation
    function h(type, propsOrChildren, children) {
        const l = arguments.length;
        if (l === 2) {
            if (isObject$1(propsOrChildren) && !isArray$1(propsOrChildren)) {
                // single vnode without props
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                // props without children
                return createVNode(type, propsOrChildren);
            }
            else {
                // omit props
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    const ssrContextKey = Symbol( `ssrContext` );
    const useSSRContext = () => {
        {
            const ctx = inject(ssrContextKey);
            if (!ctx) {
                warn(`Server rendering context not provided. Make sure to only call ` +
                    `useSsrContext() conditionally in the server build.`);
            }
            return ctx;
        }
    };

    function initCustomFormatter() {
        const vueStyle = { style: 'color:#3ba776' };
        const numberStyle = { style: 'color:#0b1bc9' };
        const stringStyle = { style: 'color:#b62e24' };
        const keywordStyle = { style: 'color:#9d288c' };
        // custom formatter for Chrome
        // https://www.mattzeunert.com/2016/02/19/custom-chrome-devtools-object-formatters.html
        const formatter = {
            header(obj) {
                // TODO also format ComponentPublicInstance & ctx.slots/attrs in setup
                if (!isObject$1(obj)) {
                    return null;
                }
                if (obj.__isVue) {
                    return ['div', vueStyle, `VueInstance`];
                }
                else if (isRef(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, genRefFlag(obj)],
                        '<',
                        formatValue(obj.value),
                        `>`
                    ];
                }
                else if (isReactive(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, 'Reactive'],
                        '<',
                        formatValue(obj),
                        `>${isReadonly(obj) ? ` (readonly)` : ``}`
                    ];
                }
                else if (isReadonly(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, 'Readonly'],
                        '<',
                        formatValue(obj),
                        '>'
                    ];
                }
                return null;
            },
            hasBody(obj) {
                return obj && obj.__isVue;
            },
            body(obj) {
                if (obj && obj.__isVue) {
                    return [
                        'div',
                        {},
                        ...formatInstance(obj.$)
                    ];
                }
            }
        };
        function formatInstance(instance) {
            const blocks = [];
            if (instance.type.props && instance.props) {
                blocks.push(createInstanceBlock('props', toRaw(instance.props)));
            }
            if (instance.setupState !== EMPTY_OBJ$1) {
                blocks.push(createInstanceBlock('setup', instance.setupState));
            }
            if (instance.data !== EMPTY_OBJ$1) {
                blocks.push(createInstanceBlock('data', toRaw(instance.data)));
            }
            const computed = extractKeys(instance, 'computed');
            if (computed) {
                blocks.push(createInstanceBlock('computed', computed));
            }
            const injected = extractKeys(instance, 'inject');
            if (injected) {
                blocks.push(createInstanceBlock('injected', injected));
            }
            blocks.push([
                'div',
                {},
                [
                    'span',
                    {
                        style: keywordStyle.style + ';opacity:0.66'
                    },
                    '$ (internal): '
                ],
                ['object', { object: instance }]
            ]);
            return blocks;
        }
        function createInstanceBlock(type, target) {
            target = extend$1({}, target);
            if (!Object.keys(target).length) {
                return ['span', {}];
            }
            return [
                'div',
                { style: 'line-height:1.25em;margin-bottom:0.6em' },
                [
                    'div',
                    {
                        style: 'color:#476582'
                    },
                    type
                ],
                [
                    'div',
                    {
                        style: 'padding-left:1.25em'
                    },
                    ...Object.keys(target).map(key => {
                        return [
                            'div',
                            {},
                            ['span', keywordStyle, key + ': '],
                            formatValue(target[key], false)
                        ];
                    })
                ]
            ];
        }
        function formatValue(v, asRaw = true) {
            if (typeof v === 'number') {
                return ['span', numberStyle, v];
            }
            else if (typeof v === 'string') {
                return ['span', stringStyle, JSON.stringify(v)];
            }
            else if (typeof v === 'boolean') {
                return ['span', keywordStyle, v];
            }
            else if (isObject$1(v)) {
                return ['object', { object: asRaw ? toRaw(v) : v }];
            }
            else {
                return ['span', stringStyle, String(v)];
            }
        }
        function extractKeys(instance, type) {
            const Comp = instance.type;
            if (isFunction$1(Comp)) {
                return;
            }
            const extracted = {};
            for (const key in instance.ctx) {
                if (isKeyOfType(Comp, key, type)) {
                    extracted[key] = instance.ctx[key];
                }
            }
            return extracted;
        }
        function isKeyOfType(Comp, key, type) {
            const opts = Comp[type];
            if ((isArray$1(opts) && opts.includes(key)) ||
                (isObject$1(opts) && key in opts)) {
                return true;
            }
            if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
                return true;
            }
            if (Comp.mixins && Comp.mixins.some(m => isKeyOfType(m, key, type))) {
                return true;
            }
        }
        function genRefFlag(v) {
            if (v._shallow) {
                return `ShallowRef`;
            }
            if (v.effect) {
                return `ComputedRef`;
            }
            return `Ref`;
        }
        /* eslint-disable no-restricted-globals */
        if (window.devtoolsFormatters) {
            window.devtoolsFormatters.push(formatter);
        }
        else {
            window.devtoolsFormatters = [formatter];
        }
    }

    /**
     * Actual implementation
     */
    function renderList(source, renderItem) {
        let ret;
        if (isArray$1(source) || isString$1(source)) {
            ret = new Array(source.length);
            for (let i = 0, l = source.length; i < l; i++) {
                ret[i] = renderItem(source[i], i);
            }
        }
        else if (typeof source === 'number') {
            if ( !Number.isInteger(source)) {
                warn(`The v-for range expect an integer value but got ${source}.`);
                return [];
            }
            ret = new Array(source);
            for (let i = 0; i < source; i++) {
                ret[i] = renderItem(i + 1, i);
            }
        }
        else if (isObject$1(source)) {
            if (source[Symbol.iterator]) {
                ret = Array.from(source, renderItem);
            }
            else {
                const keys = Object.keys(source);
                ret = new Array(keys.length);
                for (let i = 0, l = keys.length; i < l; i++) {
                    const key = keys[i];
                    ret[i] = renderItem(source[key], key, i);
                }
            }
        }
        else {
            ret = [];
        }
        return ret;
    }

    /**
     * For prefixing keys in v-on="obj" with "on"
     * @private
     */
    function toHandlers(obj) {
        const ret = {};
        if ( !isObject$1(obj)) {
            warn(`v-on with no argument expects an object value.`);
            return ret;
        }
        for (const key in obj) {
            ret[`on${capitalize$1(key)}`] = obj[key];
        }
        return ret;
    }

    /**
     * Compiler runtime helper for creating dynamic slots object
     * @private
     */
    function createSlots(slots, dynamicSlots) {
        for (let i = 0; i < dynamicSlots.length; i++) {
            const slot = dynamicSlots[i];
            // array of dynamic slot generated by <template v-for="..." #[...]>
            if (isArray$1(slot)) {
                for (let j = 0; j < slot.length; j++) {
                    slots[slot[j].name] = slot[j].fn;
                }
            }
            else if (slot) {
                // conditional single slot generated by <template v-if="..." #foo>
                slots[slot.name] = slot.fn;
            }
        }
        return slots;
    }

    // Core API ------------------------------------------------------------------
    const version = "3.0.1";
    /**
     * SSR utils for \@vue/server-renderer. Only exposed in cjs builds.
     * @internal
     */
    const ssrUtils = ( null);

    /**
     * Make a map and return a function for checking if a key
     * is in that map.
     * IMPORTANT: all calls of this function must be prefixed with
     * \/\*#\_\_PURE\_\_\*\/
     * So that rollup can tree-shake them if necessary.
     */
    function makeMap$1(str, expectsLowerCase) {
        const map = Object.create(null);
        const list = str.split(',');
        for (let i = 0; i < list.length; i++) {
            map[list[i]] = true;
        }
        return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
    }

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
    const isSpecialBooleanAttr = /*#__PURE__*/ makeMap$1(specialBooleanAttrs);

    // These tag configs are shared between compiler-dom and runtime-dom, so they
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
    const HTML_TAGS = 'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
        'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
        'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
        'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
        'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
        'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
        'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
        'option,output,progress,select,textarea,details,dialog,menu,' +
        'summary,template,blockquote,iframe,tfoot';
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Element
    const SVG_TAGS = 'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
        'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
        'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
        'feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
        'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
        'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
        'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
        'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
        'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
        'text,textPath,title,tspan,unknown,use,view';
    const isHTMLTag = /*#__PURE__*/ makeMap$1(HTML_TAGS);
    const isSVGTag = /*#__PURE__*/ makeMap$1(SVG_TAGS);

    function looseCompareArrays(a, b) {
        if (a.length !== b.length)
            return false;
        let equal = true;
        for (let i = 0; equal && i < a.length; i++) {
            equal = looseEqual(a[i], b[i]);
        }
        return equal;
    }
    function looseEqual(a, b) {
        if (a === b)
            return true;
        let aValidType = isDate(a);
        let bValidType = isDate(b);
        if (aValidType || bValidType) {
            return aValidType && bValidType ? a.getTime() === b.getTime() : false;
        }
        aValidType = isArray$2(a);
        bValidType = isArray$2(b);
        if (aValidType || bValidType) {
            return aValidType && bValidType ? looseCompareArrays(a, b) : false;
        }
        aValidType = isObject$2(a);
        bValidType = isObject$2(b);
        if (aValidType || bValidType) {
            /* istanbul ignore if: this if will probably never be called */
            if (!aValidType || !bValidType) {
                return false;
            }
            const aKeysCount = Object.keys(a).length;
            const bKeysCount = Object.keys(b).length;
            if (aKeysCount !== bKeysCount) {
                return false;
            }
            for (const key in a) {
                const aHasKey = a.hasOwnProperty(key);
                const bHasKey = b.hasOwnProperty(key);
                if ((aHasKey && !bHasKey) ||
                    (!aHasKey && bHasKey) ||
                    !looseEqual(a[key], b[key])) {
                    return false;
                }
            }
        }
        return String(a) === String(b);
    }
    function looseIndexOf(arr, val) {
        return arr.findIndex(item => looseEqual(item, val));
    }
    const EMPTY_OBJ$2 =  Object.freeze({})
        ;
    const onRE$1 = /^on[^a-z]/;
    const isOn$1 = (key) => onRE$1.test(key);
    const isModelListener$1 = (key) => key.startsWith('onUpdate:');
    const extend$2 = Object.assign;
    const isArray$2 = Array.isArray;
    const isSet$1 = (val) => toTypeString$2(val) === '[object Set]';
    const isDate = (val) => val instanceof Date;
    const isFunction$2 = (val) => typeof val === 'function';
    const isString$2 = (val) => typeof val === 'string';
    const isObject$2 = (val) => val !== null && typeof val === 'object';
    const objectToString$2 = Object.prototype.toString;
    const toTypeString$2 = (value) => objectToString$2.call(value);
    const cacheStringFunction$2 = (fn) => {
        const cache = Object.create(null);
        return ((str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        });
    };
    const hyphenateRE$1 = /\B([A-Z])/g;
    /**
     * @private
     */
    const hyphenate$1 = cacheStringFunction$2((str) => {
        return str.replace(hyphenateRE$1, '-$1').toLowerCase();
    });
    /**
     * @private
     */
    const capitalize$2 = cacheStringFunction$2((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    const invokeArrayFns$1 = (fns, arg) => {
        for (let i = 0; i < fns.length; i++) {
            fns[i](arg);
        }
    };
    const toNumber$1 = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? val : n;
    };

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
        else if (isString$2(next)) {
            if (prev !== next) {
                style.cssText = next;
            }
        }
        else {
            for (const key in next) {
                setStyle(style, key, next[key]);
            }
            if (prev && !isString$2(prev)) {
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
        if (isArray$2(val)) {
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
                    style.setProperty(hyphenate$1(prefixed), val.replace(importantRE, ''), 'important');
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
        name = capitalize$2(name);
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
                {
                    warn(`Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
                        `value ${value} is invalid.`, e);
                }
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
        if (isArray$2(value)) {
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
                if (isOn$1(key)) {
                    // ignore v-model listeners
                    if (!isModelListener$1(key)) {
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
            if (key in el && nativeOnRE.test(key) && isFunction$2(value)) {
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
        if (nativeOnRE.test(key) && isString$2(value)) {
            return false;
        }
        return key in el;
    }

    function useCssModule(name = '$style') {
        /* istanbul ignore else */
        {
            const instance = getCurrentInstance();
            if (!instance) {
                 warn(`useCssModule must be called inside setup()`);
                return EMPTY_OBJ$2;
            }
            const modules = instance.type.__cssModules;
            if (!modules) {
                 warn(`Current instance does not have CSS modules injected.`);
                return EMPTY_OBJ$2;
            }
            const mod = modules[name];
            if (!mod) {
                
                    warn(`Current instance does not have CSS module named "${name}".`);
                return EMPTY_OBJ$2;
            }
            return mod;
        }
    }

    function useCssVars(getter, scoped = false) {
        const instance = getCurrentInstance();
        /* istanbul ignore next */
        if (!instance) {
            
                warn(`useCssVars is called without current active component instance.`);
            return;
        }
        const prefix = scoped && instance.type.__scopeId
            ? `${instance.type.__scopeId.replace(/^data-v-/, '')}-`
            : ``;
        const setVars = () => setVarsOnVNode(instance.subTree, getter(instance.proxy), prefix);
        onMounted(() => watchEffect(setVars));
        onUpdated(setVars);
    }
    function setVarsOnVNode(vnode, vars, prefix) {
        if ( vnode.shapeFlag & 128 /* SUSPENSE */) {
            const suspense = vnode.suspense;
            vnode = suspense.activeBranch;
            if (suspense.pendingBranch && !suspense.isHydrating) {
                suspense.effects.push(() => {
                    setVarsOnVNode(suspense.activeBranch, vars, prefix);
                });
            }
        }
        // drill down HOCs until it's a non-component vnode
        while (vnode.component) {
            vnode = vnode.component.subTree;
        }
        if (vnode.shapeFlag & 1 /* ELEMENT */ && vnode.el) {
            const style = vnode.el.style;
            for (const key in vars) {
                style.setProperty(`--${prefix}${key}`, unref(vars[key]));
            }
        }
        else if (vnode.type === Fragment) {
            vnode.children.forEach(c => setVarsOnVNode(c, vars, prefix));
        }
    }

    const TRANSITION = 'transition';
    const ANIMATION = 'animation';
    // DOM Transition is a higher-order-component based on the platform-agnostic
    // base Transition component, with DOM-specific logic.
    const Transition = (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots);
    Transition.displayName = 'Transition';
    const DOMTransitionPropsValidators = {
        name: String,
        type: String,
        css: {
            type: Boolean,
            default: true
        },
        duration: [String, Number, Object],
        enterFromClass: String,
        enterActiveClass: String,
        enterToClass: String,
        appearFromClass: String,
        appearActiveClass: String,
        appearToClass: String,
        leaveFromClass: String,
        leaveActiveClass: String,
        leaveToClass: String
    };
    const TransitionPropsValidators = (Transition.props = /*#__PURE__*/ extend$2({}, BaseTransition.props, DOMTransitionPropsValidators));
    function resolveTransitionProps(rawProps) {
        let { name = 'v', type, css = true, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to` } = rawProps;
        const baseProps = {};
        for (const key in rawProps) {
            if (!(key in DOMTransitionPropsValidators)) {
                baseProps[key] = rawProps[key];
            }
        }
        if (!css) {
            return baseProps;
        }
        const durations = normalizeDuration(duration);
        const enterDuration = durations && durations[0];
        const leaveDuration = durations && durations[1];
        const { onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled } = baseProps;
        const finishEnter = (el, isAppear, done) => {
            removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
            removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
            done && done();
        };
        const finishLeave = (el, done) => {
            removeTransitionClass(el, leaveToClass);
            removeTransitionClass(el, leaveActiveClass);
            done && done();
        };
        const makeEnterHook = (isAppear) => {
            return (el, done) => {
                const hook = isAppear ? onAppear : onEnter;
                const resolve = () => finishEnter(el, isAppear, done);
                hook && hook(el, resolve);
                nextFrame(() => {
                    removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
                    addTransitionClass(el, isAppear ? appearToClass : enterToClass);
                    if (!(hook && hook.length > 1)) {
                        if (enterDuration) {
                            setTimeout(resolve, enterDuration);
                        }
                        else {
                            whenTransitionEnds(el, type, resolve);
                        }
                    }
                });
            };
        };
        return extend$2(baseProps, {
            onBeforeEnter(el) {
                onBeforeEnter && onBeforeEnter(el);
                addTransitionClass(el, enterActiveClass);
                addTransitionClass(el, enterFromClass);
            },
            onBeforeAppear(el) {
                onBeforeAppear && onBeforeAppear(el);
                addTransitionClass(el, appearActiveClass);
                addTransitionClass(el, appearFromClass);
            },
            onEnter: makeEnterHook(false),
            onAppear: makeEnterHook(true),
            onLeave(el, done) {
                const resolve = () => finishLeave(el, done);
                addTransitionClass(el, leaveActiveClass);
                addTransitionClass(el, leaveFromClass);
                nextFrame(() => {
                    removeTransitionClass(el, leaveFromClass);
                    addTransitionClass(el, leaveToClass);
                    if (!(onLeave && onLeave.length > 1)) {
                        if (leaveDuration) {
                            setTimeout(resolve, leaveDuration);
                        }
                        else {
                            whenTransitionEnds(el, type, resolve);
                        }
                    }
                });
                onLeave && onLeave(el, resolve);
            },
            onEnterCancelled(el) {
                finishEnter(el, false);
                onEnterCancelled && onEnterCancelled(el);
            },
            onAppearCancelled(el) {
                finishEnter(el, true);
                onAppearCancelled && onAppearCancelled(el);
            },
            onLeaveCancelled(el) {
                finishLeave(el);
                onLeaveCancelled && onLeaveCancelled(el);
            }
        });
    }
    function normalizeDuration(duration) {
        if (duration == null) {
            return null;
        }
        else if (isObject$2(duration)) {
            return [NumberOf(duration.enter), NumberOf(duration.leave)];
        }
        else {
            const n = NumberOf(duration);
            return [n, n];
        }
    }
    function NumberOf(val) {
        const res = toNumber$1(val);
        validateDuration(res);
        return res;
    }
    function validateDuration(val) {
        if (typeof val !== 'number') {
            warn(`<transition> explicit duration is not a valid number - ` +
                `got ${JSON.stringify(val)}.`);
        }
        else if (isNaN(val)) {
            warn(`<transition> explicit duration is NaN - ` +
                'the duration expression might be incorrect.');
        }
    }
    function addTransitionClass(el, cls) {
        cls.split(/\s+/).forEach(c => c && el.classList.add(c));
        (el._vtc ||
            (el._vtc = new Set())).add(cls);
    }
    function removeTransitionClass(el, cls) {
        cls.split(/\s+/).forEach(c => c && el.classList.remove(c));
        const { _vtc } = el;
        if (_vtc) {
            _vtc.delete(cls);
            if (!_vtc.size) {
                el._vtc = undefined;
            }
        }
    }
    function nextFrame(cb) {
        requestAnimationFrame(() => {
            requestAnimationFrame(cb);
        });
    }
    function whenTransitionEnds(el, expectedType, cb) {
        const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
        if (!type) {
            return cb();
        }
        const endEvent = type + 'end';
        let ended = 0;
        const end = () => {
            el.removeEventListener(endEvent, onEnd);
            cb();
        };
        const onEnd = (e) => {
            if (e.target === el) {
                if (++ended >= propCount) {
                    end();
                }
            }
        };
        setTimeout(() => {
            if (ended < propCount) {
                end();
            }
        }, timeout + 1);
        el.addEventListener(endEvent, onEnd);
    }
    function getTransitionInfo(el, expectedType) {
        const styles = window.getComputedStyle(el);
        // JSDOM may return undefined for transition properties
        const getStyleProperties = (key) => (styles[key] || '').split(', ');
        const transitionDelays = getStyleProperties(TRANSITION + 'Delay');
        const transitionDurations = getStyleProperties(TRANSITION + 'Duration');
        const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
        const animationDelays = getStyleProperties(ANIMATION + 'Delay');
        const animationDurations = getStyleProperties(ANIMATION + 'Duration');
        const animationTimeout = getTimeout(animationDelays, animationDurations);
        let type = null;
        let timeout = 0;
        let propCount = 0;
        /* istanbul ignore if */
        if (expectedType === TRANSITION) {
            if (transitionTimeout > 0) {
                type = TRANSITION;
                timeout = transitionTimeout;
                propCount = transitionDurations.length;
            }
        }
        else if (expectedType === ANIMATION) {
            if (animationTimeout > 0) {
                type = ANIMATION;
                timeout = animationTimeout;
                propCount = animationDurations.length;
            }
        }
        else {
            timeout = Math.max(transitionTimeout, animationTimeout);
            type =
                timeout > 0
                    ? transitionTimeout > animationTimeout
                        ? TRANSITION
                        : ANIMATION
                    : null;
            propCount = type
                ? type === TRANSITION
                    ? transitionDurations.length
                    : animationDurations.length
                : 0;
        }
        const hasTransform = type === TRANSITION &&
            /\b(transform|all)(,|$)/.test(styles[TRANSITION + 'Property']);
        return {
            type,
            timeout,
            propCount,
            hasTransform
        };
    }
    function getTimeout(delays, durations) {
        while (delays.length < durations.length) {
            delays = delays.concat(delays);
        }
        return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
    }
    // Old versions of Chromium (below 61.0.3163.100) formats floating pointer
    // numbers in a locale-dependent way, using a comma instead of a dot.
    // If comma is not replaced with a dot, the input will be rounded down
    // (i.e. acting as a floor function) causing unexpected behaviors
    function toMs(s) {
        return Number(s.slice(0, -1).replace(',', '.')) * 1000;
    }

    function toRaw$1(observed) {
        return ((observed && toRaw$1(observed["__v_raw" /* RAW */])) || observed);
    }

    const positionMap = new WeakMap();
    const newPositionMap = new WeakMap();
    const TransitionGroupImpl = {
        name: 'TransitionGroup',
        props: /*#__PURE__*/ extend$2({}, TransitionPropsValidators, {
            tag: String,
            moveClass: String
        }),
        setup(props, { slots }) {
            const instance = getCurrentInstance();
            const state = useTransitionState();
            let prevChildren;
            let children;
            onUpdated(() => {
                // children is guaranteed to exist after initial render
                if (!prevChildren.length) {
                    return;
                }
                const moveClass = props.moveClass || `${props.name || 'v'}-move`;
                if (!hasCSSTransform(prevChildren[0].el, instance.vnode.el, moveClass)) {
                    return;
                }
                // we divide the work into three loops to avoid mixing DOM reads and writes
                // in each iteration - which helps prevent layout thrashing.
                prevChildren.forEach(callPendingCbs);
                prevChildren.forEach(recordPosition);
                const movedChildren = prevChildren.filter(applyTranslation);
                // force reflow to put everything in position
                forceReflow();
                movedChildren.forEach(c => {
                    const el = c.el;
                    const style = el.style;
                    addTransitionClass(el, moveClass);
                    style.transform = style.webkitTransform = style.transitionDuration = '';
                    const cb = (el._moveCb = (e) => {
                        if (e && e.target !== el) {
                            return;
                        }
                        if (!e || /transform$/.test(e.propertyName)) {
                            el.removeEventListener('transitionend', cb);
                            el._moveCb = null;
                            removeTransitionClass(el, moveClass);
                        }
                    });
                    el.addEventListener('transitionend', cb);
                });
            });
            return () => {
                const rawProps = toRaw$1(props);
                const cssTransitionProps = resolveTransitionProps(rawProps);
                const tag = rawProps.tag || Fragment;
                prevChildren = children;
                children = slots.default ? getTransitionRawChildren(slots.default()) : [];
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (child.key != null) {
                        setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                    }
                    else {
                        warn(`<TransitionGroup> children must be keyed.`);
                    }
                }
                if (prevChildren) {
                    for (let i = 0; i < prevChildren.length; i++) {
                        const child = prevChildren[i];
                        setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                        positionMap.set(child, child.el.getBoundingClientRect());
                    }
                }
                return createVNode(tag, null, children);
            };
        }
    };
    const TransitionGroup = TransitionGroupImpl;
    function callPendingCbs(c) {
        const el = c.el;
        if (el._moveCb) {
            el._moveCb();
        }
        if (el._enterCb) {
            el._enterCb();
        }
    }
    function recordPosition(c) {
        newPositionMap.set(c, c.el.getBoundingClientRect());
    }
    function applyTranslation(c) {
        const oldPos = positionMap.get(c);
        const newPos = newPositionMap.get(c);
        const dx = oldPos.left - newPos.left;
        const dy = oldPos.top - newPos.top;
        if (dx || dy) {
            const s = c.el.style;
            s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
            s.transitionDuration = '0s';
            return c;
        }
    }
    // this is put in a dedicated function to avoid the line from being treeshaken
    function forceReflow() {
        return document.body.offsetHeight;
    }
    function hasCSSTransform(el, root, moveClass) {
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        const clone = el.cloneNode();
        if (el._vtc) {
            el._vtc.forEach(cls => {
                cls.split(/\s+/).forEach(c => c && clone.classList.remove(c));
            });
        }
        moveClass.split(/\s+/).forEach(c => c && clone.classList.add(c));
        clone.style.display = 'none';
        const container = (root.nodeType === 1
            ? root
            : root.parentNode);
        container.appendChild(clone);
        const { hasTransform } = getTransitionInfo(clone);
        container.removeChild(clone);
        return hasTransform;
    }

    const getModelAssigner = (vnode) => {
        const fn = vnode.props['onUpdate:modelValue'];
        return isArray$2(fn) ? value => invokeArrayFns$1(fn, value) : fn;
    };
    function onCompositionStart(e) {
        e.target.composing = true;
    }
    function onCompositionEnd(e) {
        const target = e.target;
        if (target.composing) {
            target.composing = false;
            trigger$1(target, 'input');
        }
    }
    function trigger$1(el, type) {
        const e = document.createEvent('HTMLEvents');
        e.initEvent(type, true, true);
        el.dispatchEvent(e);
    }
    // We are exporting the v-model runtime directly as vnode hooks so that it can
    // be tree-shaken in case v-model is never used.
    const vModelText = {
        created(el, { modifiers: { lazy, trim, number } }, vnode) {
            el._assign = getModelAssigner(vnode);
            const castToNumber = number || el.type === 'number';
            addEventListener(el, lazy ? 'change' : 'input', e => {
                if (e.target.composing)
                    return;
                let domValue = el.value;
                if (trim) {
                    domValue = domValue.trim();
                }
                else if (castToNumber) {
                    domValue = toNumber$1(domValue);
                }
                el._assign(domValue);
            });
            if (trim) {
                addEventListener(el, 'change', () => {
                    el.value = el.value.trim();
                });
            }
            if (!lazy) {
                addEventListener(el, 'compositionstart', onCompositionStart);
                addEventListener(el, 'compositionend', onCompositionEnd);
                // Safari < 10.2 & UIWebView doesn't fire compositionend when
                // switching focus before confirming composition choice
                // this also fixes the issue where some browsers e.g. iOS Chrome
                // fires "change" instead of "input" on autocomplete.
                addEventListener(el, 'change', onCompositionEnd);
            }
        },
        // set value on mounted so it's after min/max for type="range"
        mounted(el, { value }) {
            el.value = value == null ? '' : value;
        },
        beforeUpdate(el, { value, modifiers: { trim, number } }, vnode) {
            el._assign = getModelAssigner(vnode);
            // avoid clearing unresolved text. #2302
            if (el.composing)
                return;
            if (document.activeElement === el) {
                if (trim && el.value.trim() === value) {
                    return;
                }
                if ((number || el.type === 'number') && toNumber$1(el.value) === value) {
                    return;
                }
            }
            const newValue = value == null ? '' : value;
            if (el.value !== newValue) {
                el.value = newValue;
            }
        }
    };
    const vModelCheckbox = {
        created(el, binding, vnode) {
            setChecked(el, binding, vnode);
            el._assign = getModelAssigner(vnode);
            addEventListener(el, 'change', () => {
                const modelValue = el._modelValue;
                const elementValue = getValue(el);
                const checked = el.checked;
                const assign = el._assign;
                if (isArray$2(modelValue)) {
                    const index = looseIndexOf(modelValue, elementValue);
                    const found = index !== -1;
                    if (checked && !found) {
                        assign(modelValue.concat(elementValue));
                    }
                    else if (!checked && found) {
                        const filtered = [...modelValue];
                        filtered.splice(index, 1);
                        assign(filtered);
                    }
                }
                else if (isSet$1(modelValue)) {
                    if (checked) {
                        modelValue.add(elementValue);
                    }
                    else {
                        modelValue.delete(elementValue);
                    }
                }
                else {
                    assign(getCheckboxValue(el, checked));
                }
            });
        },
        beforeUpdate(el, binding, vnode) {
            el._assign = getModelAssigner(vnode);
            setChecked(el, binding, vnode);
        }
    };
    function setChecked(el, { value, oldValue }, vnode) {
        el._modelValue = value;
        if (isArray$2(value)) {
            el.checked = looseIndexOf(value, vnode.props.value) > -1;
        }
        else if (isSet$1(value)) {
            el.checked = value.has(vnode.props.value);
        }
        else if (value !== oldValue) {
            el.checked = looseEqual(value, getCheckboxValue(el, true));
        }
    }
    const vModelRadio = {
        created(el, { value }, vnode) {
            el.checked = looseEqual(value, vnode.props.value);
            el._assign = getModelAssigner(vnode);
            addEventListener(el, 'change', () => {
                el._assign(getValue(el));
            });
        },
        beforeUpdate(el, { value, oldValue }, vnode) {
            el._assign = getModelAssigner(vnode);
            if (value !== oldValue) {
                el.checked = looseEqual(value, vnode.props.value);
            }
        }
    };
    const vModelSelect = {
        created(el, { modifiers: { number } }, vnode) {
            addEventListener(el, 'change', () => {
                const selectedVal = Array.prototype.filter
                    .call(el.options, (o) => o.selected)
                    .map((o) => number ? toNumber$1(getValue(o)) : getValue(o));
                el._assign(el.multiple ? selectedVal : selectedVal[0]);
            });
            el._assign = getModelAssigner(vnode);
        },
        // set value in mounted & updated because <select> relies on its children
        // <option>s.
        mounted(el, { value }) {
            setSelected(el, value);
        },
        beforeUpdate(el, _binding, vnode) {
            el._assign = getModelAssigner(vnode);
        },
        updated(el, { value }) {
            setSelected(el, value);
        }
    };
    function setSelected(el, value) {
        const isMultiple = el.multiple;
        if (isMultiple && !isArray$2(value) && !isSet$1(value)) {
            
                warn(`<select multiple v-model> expects an Array or Set value for its binding, ` +
                    `but got ${Object.prototype.toString.call(value).slice(8, -1)}.`);
            return;
        }
        for (let i = 0, l = el.options.length; i < l; i++) {
            const option = el.options[i];
            const optionValue = getValue(option);
            if (isMultiple) {
                if (isArray$2(value)) {
                    option.selected = looseIndexOf(value, optionValue) > -1;
                }
                else {
                    option.selected = value.has(optionValue);
                }
            }
            else {
                if (looseEqual(getValue(option), value)) {
                    el.selectedIndex = i;
                    return;
                }
            }
        }
        if (!isMultiple) {
            el.selectedIndex = -1;
        }
    }
    // retrieve raw value set via :value bindings
    function getValue(el) {
        return '_value' in el ? el._value : el.value;
    }
    // retrieve raw value for true-value and false-value set via :true-value or :false-value bindings
    function getCheckboxValue(el, checked) {
        const key = checked ? '_trueValue' : '_falseValue';
        return key in el ? el[key] : checked;
    }
    const vModelDynamic = {
        created(el, binding, vnode) {
            callModelHook(el, binding, vnode, null, 'created');
        },
        mounted(el, binding, vnode) {
            callModelHook(el, binding, vnode, null, 'mounted');
        },
        beforeUpdate(el, binding, vnode, prevVNode) {
            callModelHook(el, binding, vnode, prevVNode, 'beforeUpdate');
        },
        updated(el, binding, vnode, prevVNode) {
            callModelHook(el, binding, vnode, prevVNode, 'updated');
        }
    };
    function callModelHook(el, binding, vnode, prevVNode, hook) {
        let modelToUse;
        switch (el.tagName) {
            case 'SELECT':
                modelToUse = vModelSelect;
                break;
            case 'TEXTAREA':
                modelToUse = vModelText;
                break;
            default:
                switch (vnode.props && vnode.props.type) {
                    case 'checkbox':
                        modelToUse = vModelCheckbox;
                        break;
                    case 'radio':
                        modelToUse = vModelRadio;
                        break;
                    default:
                        modelToUse = vModelText;
                }
        }
        const fn = modelToUse[hook];
        fn && fn(el, binding, vnode, prevVNode);
    }

    const systemModifiers = ['ctrl', 'shift', 'alt', 'meta'];
    const modifierGuards = {
        stop: e => e.stopPropagation(),
        prevent: e => e.preventDefault(),
        self: e => e.target !== e.currentTarget,
        ctrl: e => !e.ctrlKey,
        shift: e => !e.shiftKey,
        alt: e => !e.altKey,
        meta: e => !e.metaKey,
        left: e => 'button' in e && e.button !== 0,
        middle: e => 'button' in e && e.button !== 1,
        right: e => 'button' in e && e.button !== 2,
        exact: (e, modifiers) => systemModifiers.some(m => e[`${m}Key`] && !modifiers.includes(m))
    };
    /**
     * @private
     */
    const withModifiers = (fn, modifiers) => {
        return (event, ...args) => {
            for (let i = 0; i < modifiers.length; i++) {
                const guard = modifierGuards[modifiers[i]];
                if (guard && guard(event, modifiers))
                    return;
            }
            return fn(event, ...args);
        };
    };
    // Kept for 2.x compat.
    // Note: IE11 compat for `spacebar` and `del` is removed for now.
    const keyNames = {
        esc: 'escape',
        space: ' ',
        up: 'arrow-up',
        left: 'arrow-left',
        right: 'arrow-right',
        down: 'arrow-down',
        delete: 'backspace'
    };
    /**
     * @private
     */
    const withKeys = (fn, modifiers) => {
        return (event) => {
            if (!('key' in event))
                return;
            const eventKey = hyphenate$1(event.key);
            if (
            // None of the provided key modifiers match the current event key
            !modifiers.some(k => k === eventKey || keyNames[k] === eventKey)) {
                return;
            }
            return fn(event);
        };
    };

    const vShow = {
        beforeMount(el, { value }, { transition }) {
            el._vod = el.style.display === 'none' ? '' : el.style.display;
            if (transition && value) {
                transition.beforeEnter(el);
            }
            else {
                setDisplay(el, value);
            }
        },
        mounted(el, { value }, { transition }) {
            if (transition && value) {
                transition.enter(el);
            }
        },
        updated(el, { value, oldValue }, { transition }) {
            if (!value === !oldValue)
                return;
            if (transition) {
                if (value) {
                    transition.beforeEnter(el);
                    setDisplay(el, true);
                    transition.enter(el);
                }
                else {
                    transition.leave(el, () => {
                        setDisplay(el, false);
                    });
                }
            }
            else {
                setDisplay(el, value);
            }
        },
        beforeUnmount(el, { value }) {
            setDisplay(el, value);
        }
    };
    function setDisplay(el, value) {
        el.style.display = value ? el._vod : 'none';
    }

    const rendererOptions = extend$2({ patchProp, forcePatchProp }, nodeOps);
    // lazy create the renderer - this makes core renderer logic tree-shakable
    // in case the user only imports reactivity utilities from Vue.
    let renderer;
    let enabledHydration = false;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    function ensureHydrationRenderer() {
        renderer = enabledHydration
            ? renderer
            : createHydrationRenderer(rendererOptions);
        enabledHydration = true;
        return renderer;
    }
    // use explicit type casts here to avoid import() calls in rolled-up d.ts
    const render = ((...args) => {
        ensureRenderer().render(...args);
    });
    const hydrate = ((...args) => {
        ensureHydrationRenderer().hydrate(...args);
    });
    const createApp = ((...args) => {
        const app = ensureRenderer().createApp(...args);
        {
            injectNativeTagCheck(app);
        }
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (!container)
                return;
            const component = app._component;
            if (!isFunction$2(component) && !component.render && !component.template) {
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
    const createSSRApp = ((...args) => {
        const app = ensureHydrationRenderer().createApp(...args);
        {
            injectNativeTagCheck(app);
        }
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (container) {
                return mount(container, true);
            }
        };
        return app;
    });
    function injectNativeTagCheck(app) {
        // Inject `isNativeTag`
        // this is used for component name validation (dev only)
        Object.defineProperty(app.config, 'isNativeTag', {
            value: (tag) => isHTMLTag(tag) || isSVGTag(tag),
            writable: false
        });
    }
    function normalizeContainer(container) {
        if (isString$2(container)) {
            const res = document.querySelector(container);
            if ( !res) {
                warn(`Failed to mount app: mount target selector returned null.`);
            }
            return res;
        }
        return container;
    }

    var runtimeDom_esmBundler = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Transition: Transition,
        TransitionGroup: TransitionGroup,
        createApp: createApp,
        createSSRApp: createSSRApp,
        hydrate: hydrate,
        render: render,
        useCssModule: useCssModule,
        useCssVars: useCssVars,
        vModelCheckbox: vModelCheckbox,
        vModelDynamic: vModelDynamic,
        vModelRadio: vModelRadio,
        vModelSelect: vModelSelect,
        vModelText: vModelText,
        vShow: vShow,
        withKeys: withKeys,
        withModifiers: withModifiers,
        customRef: customRef,
        isProxy: isProxy,
        isReactive: isReactive,
        isReadonly: isReadonly,
        isRef: isRef,
        markRaw: markRaw,
        proxyRefs: proxyRefs,
        reactive: reactive,
        readonly: readonly,
        ref: ref,
        shallowReactive: shallowReactive,
        shallowReadonly: shallowReadonly,
        shallowRef: shallowRef,
        toRaw: toRaw,
        toRef: toRef,
        toRefs: toRefs,
        triggerRef: triggerRef,
        unref: unref,
        camelize: camelize,
        capitalize: capitalize$1,
        toDisplayString: toDisplayString,
        BaseTransition: BaseTransition,
        Comment: Comment,
        Fragment: Fragment,
        KeepAlive: KeepAlive,
        Static: Static,
        Suspense: Suspense,
        Teleport: Teleport,
        Text: Text,
        callWithAsyncErrorHandling: callWithAsyncErrorHandling,
        callWithErrorHandling: callWithErrorHandling,
        cloneVNode: cloneVNode,
        computed: computed$1,
        createBlock: createBlock,
        createCommentVNode: createCommentVNode,
        createHydrationRenderer: createHydrationRenderer,
        createRenderer: createRenderer,
        createSlots: createSlots,
        createStaticVNode: createStaticVNode,
        createTextVNode: createTextVNode,
        createVNode: createVNode,
        defineAsyncComponent: defineAsyncComponent,
        defineComponent: defineComponent,
        get devtools () { return devtools; },
        getCurrentInstance: getCurrentInstance,
        getTransitionRawChildren: getTransitionRawChildren,
        h: h,
        handleError: handleError,
        initCustomFormatter: initCustomFormatter,
        inject: inject,
        isVNode: isVNode,
        mergeProps: mergeProps,
        nextTick: nextTick,
        onActivated: onActivated,
        onBeforeMount: onBeforeMount,
        onBeforeUnmount: onBeforeUnmount,
        onBeforeUpdate: onBeforeUpdate,
        onDeactivated: onDeactivated,
        onErrorCaptured: onErrorCaptured,
        onMounted: onMounted,
        onRenderTracked: onRenderTracked,
        onRenderTriggered: onRenderTriggered,
        onUnmounted: onUnmounted,
        onUpdated: onUpdated,
        openBlock: openBlock,
        popScopeId: popScopeId,
        provide: provide,
        pushScopeId: pushScopeId,
        queuePostFlushCb: queuePostFlushCb,
        registerRuntimeCompiler: registerRuntimeCompiler,
        renderList: renderList,
        renderSlot: renderSlot,
        resolveComponent: resolveComponent,
        resolveDirective: resolveDirective,
        resolveDynamicComponent: resolveDynamicComponent,
        resolveTransitionHooks: resolveTransitionHooks,
        setBlockTracking: setBlockTracking,
        setDevtoolsHook: setDevtoolsHook,
        setTransitionHooks: setTransitionHooks,
        ssrContextKey: ssrContextKey,
        ssrUtils: ssrUtils,
        toHandlers: toHandlers,
        transformVNodeArgs: transformVNodeArgs,
        useSSRContext: useSSRContext,
        useTransitionState: useTransitionState,
        version: version,
        warn: warn,
        watch: watch,
        watchEffect: watchEffect,
        withCtx: withCtx,
        withDirectives: withDirectives,
        withScopeId: withScopeId
    });

    var script = {
      name: 'HelloWord',
      setup() {
        const state = reactive({ a: 1 });

        setInterval(() => {
          state.a += 1;
        }, 3000);

        watchEffect(() => {
          console.log('changed ', state.a);
        });

        return { state }
      }
    };

    const _hoisted_1 = { class: "title is-1" };

    function render$1(_ctx, _cache, $props, $setup, $data, $options) {
      return (openBlock(), createBlock("h1", _hoisted_1, toDisplayString($setup.state.a), 1 /* TEXT */))
    }

    script.render = render$1;
    script.__file = "src/components/HelloWorld.vue";

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var vue = /*@__PURE__*/getAugmentedNamespace(runtimeDom_esmBundler);

    var dist = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, '__esModule', { value: true });



    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    // const logger = console
    var logger =  {
        log: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
        },
        warn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
        },
        error: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            logger.log.apply(logger, args);
        }
    };
    /**
     * Special symbol which is used as a property to switch
     * between [StateMethods](#interfacesstatemethodsmd) and the corresponding [State](#state).
     *
     * [Learn more...](https://vue3.dev/docs/nested-state)
     */
    var self = Symbol('self');
    /**
     * Special symbol which might be returned by onPromised callback of [StateMethods.map](#map) function.
     *
     * [Learn more...](https://vue3.dev/docs/asynchronous-state#executing-an-action-when-state-is-loaded)
     */
    var postpone = Symbol('postpone');
    /**
     * Special symbol which might be used to delete properties
     * from an object calling [StateMethods.set](#set) or [StateMethods.merge](#merge).
     *
     * [Learn more...](https://vue3.dev/docs/nested-state#deleting-existing-element)
     */
    var none = Symbol('none');
    /**
     * Creates new state and returns it.
     *
     * You can create as many global states as you need.
     *
     * When you the state is not needed anymore,
     * it should be destroyed by calling
     * `destroy()` method of the returned instance.
     * This is necessary for some plugins,
     * which allocate native resources,
     * like subscription to databases, broadcast channels, etc.
     * In most cases, a global state is used during
     * whole life time of an application and would not require
     * destruction. However, if you have got, for example,
     * a catalog of dynamically created and destroyed global states,
     * the states should be destroyed as advised above.
     *
     * @param initial Initial value of the state.
     * It can be a value OR a promise,
     * which asynchronously resolves to a value,
     * OR a function returning a value or a promise.
     *
     * @typeparam S Type of a value of the state
     *
     * @returns [State](#state) instance,
     * which can be used directly to get and set state value
     * outside of React components.
     * When you need to use the state in a functional `React` component,
     * pass the created state to [useState](#usestate) function and
     * use the returned result in the component's logic.
     */
    function createState(initial) {
        var methods = createStore(initial).toMethods();
        var devtools = createState[DevToolsID];
        if (devtools) {
            methods.attach(devtools);
        }
        return methods[self];
    }
    function useState(source) {
        var parentMethods = typeof source === 'object' && source !== null ?
            source[self] :
            undefined;
        if (parentMethods) {
            if (parentMethods.isMounted) {
                // Scoped state mount
                logger.log('%c create vue ref (scoped)', 'background: #222; color: #bada55');
                return useSubscribedStateMethods(parentMethods.state, parentMethods.path, parentMethods, parentMethods.onGetUsed)[self];
            }
            else {
                // Global state mount or destroyed link
                logger.log('create vue ref (global)');
                return useSubscribedStateMethods(parentMethods.state, parentMethods.path, parentMethods.state)[self];
            }
        }
        else {
            // Local state mount
            logger.log('create vue ref (local)');
            var store_1 = createStore(source);
            vue.onUnmounted(function () { return store_1.destroy(); });
            var result = useSubscribedStateMethods(store_1, RootPath, store_1);
            var devtools = useState[DevToolsID];
            if (devtools) {
                result.attach(devtools);
            }
            return result[self];
        }
    }
    // TODO StateFragment is applicable in Vue3 too, it should go to it's own Vue component
    /**
     * Allows to use a state without defining a functional react component.
     * It can be also used in class-based React components. It is also
     * particularly usefull for creating *scoped* states.
     *
     * [Learn more...](https://vue3.dev/docs/using-without-statehook)
     *
     * @typeparam S Type of a value of a state
     */
    // export function StateFragment<S>(
    //     props: {
    //         state: State<S>,
    //         children: (state: State<S>) => React.ReactElement,
    //     }
    // ): React.ReactElement;
    /**
     * Allows to use a state without defining a functional react component.
     * See more at [StateFragment](#statefragment)
     *
     * [Learn more...](https://vue3.dev/docs/using-without-statehook)
     *
     * @typeparam S Type of a value of a state
     */
    // export function StateFragment<S>(
    //     props: {
    //         state: SetInitialStateAction<S>,
    //         children: (state: State<S>) => React.ReactElement,
    //     }
    // ): React.ReactElement;
    // export function StateFragment<S>(
    //     props: {
    //         state: State<S> | SetInitialStateAction<S>,
    //         children: (state: State<S>) => React.ReactElement,
    //     }
    // ): React.ReactElement {
    //     const scoped = useState(props.state as State<S>);
    //     return props.children(scoped);
    // }
    function StateFragment(props) {
        var scoped = useState(props.state);
        return props.children(scoped);
    }
    /**
     * A plugin which allows to opt-out from usage of Javascript proxies for
     * state usage tracking. It is useful for performance tuning.
     *
     * [Learn more...](https://vue3.dev/docs/performance-managed-rendering#downgraded-plugin)
     */
    function Downgraded() {
        // TODO Vue specific makes Downgrade affecting behaviour
        // In React Downgrade does not change the results of rendering
        // In Vue Downgrade effectively converts customRef to shallowRef Vue hook,
        // which might result in missed rendering for nested components
        // This is likely a documentation issue only
        return {
            id: DowngradedID
        };
    }
    /**
     * For plugin developers only.
     * Reserved plugin ID for developers tools extension.
     *
     * @hidden
     * @ignore
     */
    var DevToolsID = Symbol('DevTools');
    /**
     * Returns access to the development tools for a given state.
     * Development tools are delivered as optional plugins.
     * You can activate development tools from `@appstate-fast/devtools`package,
     * for example. If no development tools are activated,
     * it returns an instance of dummy tools, which do nothing, when called.
     *
     * [Learn more...](https://vue3.dev/docs/devtools)
     *
     * @param state A state to relate to the extension.
     *
     * @returns Interface to interact with the development tools for a given state.
     *
     * @typeparam S Type of a value of a state
     */
    function DevTools(state) {
        var plugin = state[self].attach(DevToolsID);
        if (plugin[0] instanceof Error) {
            return EmptyDevToolsExtensions;
        }
        return plugin[0];
    }
    ///
    /// INTERNAL SYMBOLS (LIBRARY IMPLEMENTATION)
    ///
    var EmptyDevToolsExtensions = {
        label: function () { },
        log: function () { }
    };
    var ErrorId;
    (function (ErrorId) {
        ErrorId[ErrorId["InitStateToValueFromState"] = 101] = "InitStateToValueFromState";
        ErrorId[ErrorId["SetStateToValueFromState"] = 102] = "SetStateToValueFromState";
        ErrorId[ErrorId["GetStateWhenPromised"] = 103] = "GetStateWhenPromised";
        ErrorId[ErrorId["SetStateWhenPromised"] = 104] = "SetStateWhenPromised";
        ErrorId[ErrorId["SetStateNestedToPromised"] = 105] = "SetStateNestedToPromised";
        ErrorId[ErrorId["SetStateWhenDestroyed"] = 106] = "SetStateWhenDestroyed";
        ErrorId[ErrorId["GetStatePropertyWhenPrimitive"] = 107] = "GetStatePropertyWhenPrimitive";
        ErrorId[ErrorId["ToJson_Value"] = 108] = "ToJson_Value";
        ErrorId[ErrorId["ToJson_State"] = 109] = "ToJson_State";
        ErrorId[ErrorId["GetUnknownPlugin"] = 120] = "GetUnknownPlugin";
        ErrorId[ErrorId["SetProperty_State"] = 201] = "SetProperty_State";
        ErrorId[ErrorId["SetProperty_Value"] = 202] = "SetProperty_Value";
        ErrorId[ErrorId["SetPrototypeOf_State"] = 203] = "SetPrototypeOf_State";
        ErrorId[ErrorId["SetPrototypeOf_Value"] = 204] = "SetPrototypeOf_Value";
        ErrorId[ErrorId["PreventExtensions_State"] = 205] = "PreventExtensions_State";
        ErrorId[ErrorId["PreventExtensions_Value"] = 206] = "PreventExtensions_Value";
        ErrorId[ErrorId["DefineProperty_State"] = 207] = "DefineProperty_State";
        ErrorId[ErrorId["DefineProperty_Value"] = 208] = "DefineProperty_Value";
        ErrorId[ErrorId["DeleteProperty_State"] = 209] = "DeleteProperty_State";
        ErrorId[ErrorId["DeleteProperty_Value"] = 210] = "DeleteProperty_Value";
        ErrorId[ErrorId["Construct_State"] = 211] = "Construct_State";
        ErrorId[ErrorId["Construct_Value"] = 212] = "Construct_Value";
        ErrorId[ErrorId["Apply_State"] = 213] = "Apply_State";
        ErrorId[ErrorId["Apply_Value"] = 214] = "Apply_Value";
    })(ErrorId || (ErrorId = {}));
    var StateInvalidUsageError = /** @class */ (function (_super) {
        __extends(StateInvalidUsageError, _super);
        function StateInvalidUsageError(path, id, details) {
            return _super.call(this, "Error: APPSTATE-FAST-" + id + " [path: /" + path.join('/') + (details ? ", details: " + details : '') + "]. " +
                ("See https://vue3.dev/docs/exceptions#appastate-fast-" + id)) || this;
        }
        return StateInvalidUsageError;
    }(Error));
    var DowngradedID = Symbol('Downgraded');
    var SelfMethodsID = Symbol('ProxyMarker');
    var RootPath = [];
    var DestroyedEdition = -1;
    var Store = /** @class */ (function () {
        function Store(_value) {
            this._value = _value;
            this._edition = 0;
            this._subscribers = new Set();
            this._setSubscribers = new Set();
            this._destroySubscribers = new Set();
            this._batchStartSubscribers = new Set();
            this._batchFinishSubscribers = new Set();
            this._plugins = new Map();
            this._batches = 0;
            if (typeof _value === 'object' &&
                Promise.resolve(_value) === _value) {
                this._promised = this.createPromised(_value);
                this._value = none;
            }
            else if (_value === none) {
                this._promised = this.createPromised(undefined);
            }
        }
        Store.prototype.createPromised = function (newValue) {
            var _this = this;
            var promised = new Promised(newValue ? Promise.resolve(newValue) : undefined, function (r) {
                if (_this.promised === promised && _this.edition !== DestroyedEdition) {
                    _this._promised = undefined;
                    _this.set(RootPath, r, undefined);
                    _this.update([RootPath]);
                }
            }, function () {
                if (_this.promised === promised && _this.edition !== DestroyedEdition) {
                    _this._edition += 1;
                    _this.update([RootPath]);
                }
            }, function () {
                if (_this._batchesPendingActions &&
                    _this._value !== none &&
                    _this.edition !== DestroyedEdition) {
                    var actions = _this._batchesPendingActions;
                    _this._batchesPendingActions = undefined;
                    actions.forEach(function (a) { return a(); });
                }
            });
            return promised;
        };
        Object.defineProperty(Store.prototype, "edition", {
            get: function () {
                return this._edition;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Store.prototype, "promised", {
            get: function () {
                return this._promised;
            },
            enumerable: false,
            configurable: true
        });
        Store.prototype.get = function (path) {
            var result = this._value;
            if (result === none) {
                return result;
            }
            path.forEach(function (p) {
                result = result[p];
            });
            return result;
        };
        Store.prototype.set = function (path, value, mergeValue) {
            if (this._edition < 0) {
                throw new StateInvalidUsageError(path, ErrorId.SetStateWhenDestroyed);
            }
            if (path.length === 0) {
                // Root value UPDATE case,
                var onSetArg = {
                    path: path,
                    state: value,
                    value: value,
                    previous: this._value,
                    merged: mergeValue
                };
                if (value === none) {
                    this._promised = this.createPromised(undefined);
                    delete onSetArg.value;
                    delete onSetArg.state;
                }
                else if (typeof value === 'object' && Promise.resolve(value) === value) {
                    this._promised = this.createPromised(value);
                    value = none;
                    delete onSetArg.value;
                    delete onSetArg.state;
                }
                else if (this._promised && !this._promised.resolver) {
                    throw new StateInvalidUsageError(path, ErrorId.SetStateWhenPromised);
                }
                var prevValue = this._value;
                if (prevValue === none) {
                    delete onSetArg.previous;
                }
                this._value = value;
                this.afterSet(onSetArg);
                if (prevValue === none && this._value !== none &&
                    this.promised && this.promised.resolver) {
                    this.promised.resolver();
                }
                return path;
            }
            if (typeof value === 'object' && Promise.resolve(value) === value) {
                throw new StateInvalidUsageError(path, ErrorId.SetStateNestedToPromised);
            }
            var target = this._value;
            for (var i = 0; i < path.length - 1; i += 1) {
                target = target[path[i]];
            }
            var p = path[path.length - 1];
            if (p in target) {
                if (value !== none) {
                    // Property UPDATE case
                    var prevValue = target[p];
                    target[p] = value;
                    this.afterSet({
                        path: path,
                        state: this._value,
                        value: value,
                        previous: prevValue,
                        merged: mergeValue
                    });
                    return path;
                }
                else {
                    // Property DELETE case
                    var prevValue = target[p];
                    if (Array.isArray(target) && typeof p === 'number') {
                        target.splice(p, 1);
                    }
                    else {
                        delete target[p];
                    }
                    this.afterSet({
                        path: path,
                        state: this._value,
                        previous: prevValue,
                        merged: mergeValue
                    });
                    // if an array of object is about to loose existing property
                    // we consider it is the whole object is changed
                    // which is identified by upper path
                    return path.slice(0, -1);
                }
            }
            if (value !== none) {
                // Property INSERT case
                target[p] = value;
                this.afterSet({
                    path: path,
                    state: this._value,
                    value: value,
                    merged: mergeValue
                });
                // if an array of object is about to be extended by new property
                // we consider it is the whole object is changed
                // which is identified by upper path
                return path.slice(0, -1);
            }
            // Non-existing property DELETE case
            // no-op
            return path;
        };
        Store.prototype.update = function (paths) {
            logger.log('update paths', paths);
            if (this._batches) {
                this._batchesPendingPaths = this._batchesPendingPaths || [];
                this._batchesPendingPaths = this._batchesPendingPaths.concat(paths);
                return;
            }
            var actions = [];
            this._subscribers.forEach(function (s) { return s.onSet(paths, actions); });
            actions.forEach(function (a) { return a(); });
        };
        Store.prototype.afterSet = function (params) {
            if (this._edition !== DestroyedEdition) {
                this._edition += 1;
                this._setSubscribers.forEach(function (cb) { return cb(params); });
            }
        };
        Store.prototype.startBatch = function (path, options) {
            this._batches += 1;
            var cbArgument = {
                path: path
            };
            if (options && 'context' in options) {
                cbArgument.context = options.context;
            }
            if (this._value !== none) {
                cbArgument.state = this._value;
            }
            this._batchStartSubscribers.forEach(function (cb) { return cb(cbArgument); });
        };
        Store.prototype.finishBatch = function (path, options) {
            var cbArgument = {
                path: path
            };
            if (options && 'context' in options) {
                cbArgument.context = options.context;
            }
            if (this._value !== none) {
                cbArgument.state = this._value;
            }
            this._batchFinishSubscribers.forEach(function (cb) { return cb(cbArgument); });
            this._batches -= 1;
            if (this._batches === 0) {
                if (this._batchesPendingPaths) {
                    var paths = this._batchesPendingPaths;
                    this._batchesPendingPaths = undefined;
                    this.update(paths);
                }
            }
        };
        Store.prototype.postponeBatch = function (action) {
            this._batchesPendingActions = this._batchesPendingActions || [];
            this._batchesPendingActions.push(action);
        };
        Store.prototype.getPlugin = function (pluginId) {
            return this._plugins.get(pluginId);
        };
        Store.prototype.register = function (plugin) {
            var existingInstance = this._plugins.get(plugin.id);
            if (existingInstance) {
                return;
            }
            var pluginCallbacks = plugin.init ? plugin.init(this.toMethods()[self]) : {};
            this._plugins.set(plugin.id, pluginCallbacks);
            if (pluginCallbacks.onSet) {
                this._setSubscribers.add(function (p) { return pluginCallbacks.onSet(p); });
            }
            if (pluginCallbacks.onDestroy) {
                this._destroySubscribers.add(function (p) { return pluginCallbacks.onDestroy(p); });
            }
            if (pluginCallbacks.onBatchStart) {
                this._batchStartSubscribers.add(function (p) { return pluginCallbacks.onBatchStart(p); });
            }
            if (pluginCallbacks.onBatchFinish) {
                this._batchFinishSubscribers.add(function (p) { return pluginCallbacks.onBatchFinish(p); });
            }
        };
        Store.prototype.toMethods = function () {
            return new StateMethodsImpl(this, RootPath, this.get(RootPath), this.edition, OnGetUsedNoAction, OnSetUsedNoAction);
        };
        Store.prototype.subscribe = function (l) {
            this._subscribers.add(l);
        };
        Store.prototype.unsubscribe = function (l) {
            this._subscribers.delete(l);
        };
        Store.prototype.destroy = function () {
            var _this = this;
            this._destroySubscribers.forEach(function (cb) { return cb(_this._value !== none ? { state: _this._value } : {}); });
            this._edition = DestroyedEdition;
        };
        Store.prototype.toJSON = function () {
            throw new StateInvalidUsageError(RootPath, ErrorId.ToJson_Value);
        };
        return Store;
    }());
    var Promised = /** @class */ (function () {
        function Promised(promise, onResolve, onReject, onPostResolve) {
            var _this = this;
            this.promise = promise;
            if (!promise) {
                promise = new Promise(function (resolve) {
                    _this.resolver = resolve;
                });
            }
            this.promise = promise
                .then(function (r) {
                _this.fullfilled = true;
                if (!_this.resolver) {
                    onResolve(r);
                }
            })
                .catch(function (err) {
                _this.fullfilled = true;
                _this.error = err;
                onReject();
            })
                .then(function () { return onPostResolve(); });
        }
        return Promised;
    }());
    // use symbol property to allow for easier reference finding
    var ValueCacheProperty = Symbol('ValueCache');
    function OnGetUsedNoAction() { }
    function OnSetUsedNoAction() { }
    // use symbol to mark that a function has no effect anymore
    var UnmountedMarker = Symbol('UnmountedMarker');
    OnGetUsedNoAction[UnmountedMarker] = true;
    OnSetUsedNoAction[UnmountedMarker] = true;
    var StateMethodsImpl = /** @class */ (function () {
        function StateMethodsImpl(state, path, valueSource, valueEdition, onGetUsed, onSetUsed) {
            this.state = state;
            this.path = path;
            this.valueSource = valueSource;
            this.valueEdition = valueEdition;
            this.onGetUsed = onGetUsed;
            this.onSetUsed = onSetUsed;
        }
        StateMethodsImpl.prototype.resetTracesBeforeRerender = function () {
            delete this[ValueCacheProperty];
            delete this.childrenCache;
            delete this.selfCache;
        };
        StateMethodsImpl.prototype.getUntracked = function (allowPromised) {
            this.onGetUsed();
            if (this.valueEdition !== this.state.edition) {
                this.valueSource = this.state.get(this.path);
                this.valueEdition = this.state.edition;
                if (this.isMounted) {
                    // this link is still mounted to a component
                    // populate cache again to ensure correct tracking of usage
                    // when React scans which states to rerender on update
                    if (ValueCacheProperty in this) {
                        delete this[ValueCacheProperty];
                        this.get(true); // renew cache to keep it marked used
                    }
                }
                else {
                    // This link is not mounted to a component
                    // for example, it might be global link or
                    // a link which has been discarded after rerender
                    // but still captured by some callback or an effect.
                    // If we are here and if it was mounted before,
                    // it means it has not been garbage collected
                    // when a component unmounted.
                    // We take this opportunity to clean up caches
                    // to avoid memory leaks via stale children states cache.
                    delete this[ValueCacheProperty];
                    delete this.childrenCache;
                    delete this.selfCache;
                }
            }
            if (this.valueSource === none && !allowPromised) {
                if (this.state.promised && this.state.promised.error) {
                    throw this.state.promised.error;
                }
                throw new StateInvalidUsageError(this.path, ErrorId.GetStateWhenPromised);
            }
            return this.valueSource;
        };
        StateMethodsImpl.prototype.get = function (allowPromised) {
            var currentValue = this.getUntracked(allowPromised);
            if (!(ValueCacheProperty in this)) {
                if (this.isDowngraded) {
                    this[ValueCacheProperty] = currentValue;
                }
                else if (Array.isArray(currentValue)) {
                    this[ValueCacheProperty] = this.valueArrayImpl(currentValue);
                }
                else if (typeof currentValue === 'object' && currentValue !== null) {
                    this[ValueCacheProperty] = this.valueObjectImpl(currentValue);
                }
                else {
                    this[ValueCacheProperty] = currentValue;
                }
            }
            return this[ValueCacheProperty];
        };
        Object.defineProperty(StateMethodsImpl.prototype, "value", {
            get: function () {
                return this.get();
            },
            enumerable: false,
            configurable: true
        });
        StateMethodsImpl.prototype.setUntracked = function (newValue, mergeValue) {
            if (typeof newValue === 'function') {
                newValue = newValue(this.getUntracked());
            }
            if (typeof newValue === 'object' && newValue !== null && newValue[SelfMethodsID]) {
                throw new StateInvalidUsageError(this.path, ErrorId.SetStateToValueFromState);
            }
            return [this.state.set(this.path, newValue, mergeValue)];
        };
        StateMethodsImpl.prototype.set = function (newValue) {
            this.state.update(this.setUntracked(newValue));
        };
        StateMethodsImpl.prototype.mergeUntracked = function (sourceValue) {
            var currentValue = this.getUntracked();
            if (typeof sourceValue === 'function') {
                sourceValue = sourceValue(currentValue);
            }
            var updatedPaths;
            var deletedOrInsertedProps = false;
            if (Array.isArray(currentValue)) {
                if (Array.isArray(sourceValue)) {
                    return this.setUntracked(currentValue.concat(sourceValue), sourceValue);
                }
                else {
                    var deletedIndexes_1 = [];
                    Object.keys(sourceValue).sort().forEach(function (i) {
                        var index = Number(i);
                        var newPropValue = sourceValue[index];
                        if (newPropValue === none) {
                            deletedOrInsertedProps = true;
                            deletedIndexes_1.push(index);
                        }
                        else {
                            deletedOrInsertedProps = deletedOrInsertedProps || !(index in currentValue);
                            currentValue[index] = newPropValue;
                        }
                    });
                    // indexes are ascending sorted as per above
                    // so, delete one by one from the end
                    // this way index positions do not change
                    deletedIndexes_1.reverse().forEach(function (p) {
                        currentValue.splice(p, 1);
                    });
                    updatedPaths = this.setUntracked(currentValue, sourceValue);
                }
            }
            else if (typeof currentValue === 'object' && currentValue !== null) {
                Object.keys(sourceValue).forEach(function (key) {
                    var newPropValue = sourceValue[key];
                    if (newPropValue === none) {
                        deletedOrInsertedProps = true;
                        delete currentValue[key];
                    }
                    else {
                        deletedOrInsertedProps = deletedOrInsertedProps || !(key in currentValue);
                        currentValue[key] = newPropValue;
                    }
                });
                updatedPaths = this.setUntracked(currentValue, sourceValue);
            }
            else if (typeof currentValue === 'string') {
                return this.setUntracked((currentValue + String(sourceValue)), sourceValue);
            }
            else {
                return this.setUntracked(sourceValue);
            }
            if (updatedPaths.length !== 1 || updatedPaths[0] !== this.path || deletedOrInsertedProps) {
                return updatedPaths;
            }
            var updatedPath = updatedPaths[0];
            return Object.keys(sourceValue).map(function (p) { return updatedPath.slice().concat(p); });
        };
        StateMethodsImpl.prototype.merge = function (sourceValue) {
            this.state.update(this.mergeUntracked(sourceValue));
        };
        StateMethodsImpl.prototype.rerender = function (paths) {
            this.state.update(paths);
        };
        StateMethodsImpl.prototype.destroy = function () {
            this.state.destroy();
        };
        StateMethodsImpl.prototype.subscribe = function (l) {
            if (this.subscribers === undefined) {
                this.subscribers = new Set();
            }
            this.subscribers.add(l);
        };
        StateMethodsImpl.prototype.unsubscribe = function (l) {
            this.subscribers.delete(l);
        };
        Object.defineProperty(StateMethodsImpl.prototype, "isMounted", {
            get: function () {
                return !this.onSetUsed[UnmountedMarker];
            },
            enumerable: false,
            configurable: true
        });
        StateMethodsImpl.prototype.onUnmount = function () {
            this.onSetUsed[UnmountedMarker] = true;
        };
        StateMethodsImpl.prototype.onSet = function (paths, actions) {
            var _this = this;
            var update = function () {
                if (_this.isDowngraded && (ValueCacheProperty in _this)) {
                    actions.push(_this.onSetUsed);
                    return true;
                }
                for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
                    var path = paths_1[_i];
                    var firstChildKey = path[_this.path.length];
                    if (firstChildKey === undefined) {
                        if (ValueCacheProperty in _this) {
                            actions.push(_this.onSetUsed);
                            return true;
                        }
                    }
                    else {
                        var firstChildValue = _this.childrenCache && _this.childrenCache[firstChildKey];
                        if (firstChildValue && firstChildValue.onSet(paths, actions)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            var updated = update();
            if (!updated && this.subscribers !== undefined) {
                this.subscribers.forEach(function (s) {
                    s.onSet(paths, actions);
                });
            }
            return updated;
        };
        Object.defineProperty(StateMethodsImpl.prototype, "keys", {
            get: function () {
                var value = this.get();
                if (Array.isArray(value)) {
                    return Object.keys(value).map(function (i) { return Number(i); }).filter(function (i) { return Number.isInteger(i); });
                }
                if (typeof value === 'object' && value !== null) {
                    return Object.keys(value);
                }
                return undefined;
            },
            enumerable: false,
            configurable: true
        });
        StateMethodsImpl.prototype.child = function (key) {
            // if this state is not mounted to a hook,
            // we do not cache children to avoid unnecessary memory leaks
            if (this.isMounted) {
                this.childrenCache = this.childrenCache || {};
                var cachehit = this.childrenCache[key];
                if (cachehit) {
                    return cachehit;
                }
            }
            var r = new StateMethodsImpl(this.state, this.path.slice().concat(key), this.valueSource[key], this.valueEdition, this.onGetUsed, this.onSetUsed);
            if (this.isDowngraded) {
                r.isDowngraded = true;
            }
            if (this.childrenCache) {
                this.childrenCache[key] = r;
            }
            return r;
        };
        StateMethodsImpl.prototype.valueArrayImpl = function (currentValue) {
            var _this = this;
            return proxyWrap(this.path, currentValue, function () { return currentValue; }, function (target, key) {
                if (key === 'length') {
                    return target.length;
                }
                if (key in Array.prototype) {
                    return Array.prototype[key];
                }
                if (key === SelfMethodsID) {
                    return _this;
                }
                if (typeof key === 'symbol') {
                    // allow clients to associate hidden cache with state values
                    return target[key];
                }
                var index = Number(key);
                if (!Number.isInteger(index)) {
                    return undefined;
                }
                return _this.child(index).get();
            }, function (target, key, value) {
                if (typeof key === 'symbol') {
                    // allow clients to associate hidden cache with state values
                    target[key] = value;
                    return true;
                }
                throw new StateInvalidUsageError(_this.path, ErrorId.SetProperty_Value);
            }, true);
        };
        StateMethodsImpl.prototype.valueObjectImpl = function (currentValue) {
            var _this = this;
            return proxyWrap(this.path, currentValue, function () { return currentValue; }, function (target, key) {
                if (key === SelfMethodsID) {
                    return _this;
                }
                if (typeof key === 'symbol') {
                    // allow clients to associate hidden cache with state values
                    return target[key];
                }
                return _this.child(key).get();
            }, function (target, key, value) {
                if (typeof key === 'symbol') {
                    // allow clients to associate hidden cache with state values
                    target[key] = value;
                    return true;
                }
                throw new StateInvalidUsageError(_this.path, ErrorId.SetProperty_Value);
            }, true);
        };
        Object.defineProperty(StateMethodsImpl.prototype, self, {
            get: function () {
                var _this = this;
                if (this.selfCache) {
                    return this.selfCache;
                }
                this.selfCache = proxyWrap(this.path, this.valueSource, function () {
                    _this.get(); // get latest & mark used
                    return _this.valueSource;
                }, function (_, key) {
                    if (typeof key === 'symbol') {
                        if (key === self) {
                            return _this;
                        }
                        else {
                            return undefined;
                        }
                    }
                    else {
                        if (key === 'toJSON') {
                            // TODO in React it is explicitly forbidden to serialize state to JSON;
                            // A client is required to serialize state values instead
                            // In Vue, enabling custom toJSON returning a value (not a string as required by spec)
                            // allows to replace {{ state.value }} by {{ state }} in Vue html templates
                            // This enables nice syntax sugar, but are there negative side effects
                            // from violating the expeciations of return type from toJSON?
                            // Note: Returning undefined here, makes Vue thinking that states of primitive values
                            // are objects without properties, so it renders '{}' instead of an action primitive state.value
                            return function () { return _this.value; };
                            // throw new StateInvalidUsageError(this.path, ErrorId.ToJson_State);
                        }
                        // TODO this allows to unwrap state from props proxy,
                        // but what other negative side effects it might have?
                        if (key === "__v_raw") {
                            return _this;
                        }
                        var currentValue = _this.getUntracked(true);
                        if ( // if currentValue is primitive type
                        (typeof currentValue !== 'object' || currentValue === null) &&
                            // if promised, it will be none
                            currentValue !== none) {
                            switch (key) {
                                case 'path':
                                    return _this.path;
                                case 'keys':
                                    return _this.keys;
                                case 'value':
                                    return _this.value;
                                case 'get':
                                    return function () { return _this.get(); };
                                case 'set':
                                    return function (p) { return _this.set(p); };
                                case 'merge':
                                    return function (p) { return _this.merge(p); };
                                case 'map':
                                    // tslint:disable-next-line: no-any
                                    return function () {
                                        var args = [];
                                        for (var _i = 0; _i < arguments.length; _i++) {
                                            args[_i] = arguments[_i];
                                        }
                                        return _this.map(args[0], args[1], args[2], args[3]);
                                    };
                                case 'attach':
                                    return function (p) { return _this.attach(p); };
                                // TODO for consistency, it is possible to enable
                                // Symbol.toPrimitive with similar behavior.
                                // But it is only minor performance enhancement for Vue
                                // when state is used in expressions like {{ state + 1 }}
                                // Also, it is unclear if such constructions should be allowed.
                                // Currently it is allowed for consistency with enabled toJSON for a state
                                case 'valueOf':
                                    return function () { return _this.value; };
                                // TODO same questions as for valueOf above
                                // Currently it is allowed for consistency with enabled toJSON for a state
                                case 'toString':
                                    // toString for a number can come with an argument
                                    return function (arg) {
                                        if (arg !== undefined && _this.value) {
                                            return _this.value.toString(arg);
                                        }
                                        return String(_this.value);
                                    };
                                default:
                                    // Overall it is an error that users asks props of a primitive state,
                                    // but we need to enable Vue rendering:
                                    // when Vue encounters and object in template,
                                    // it asks for 2 known properties:
                                    if (key === '__v_isRef' || key === '__v_isReadonly') {
                                        return undefined;
                                    }
                                    _this.get(); // mark used
                                    throw new StateInvalidUsageError(_this.path, ErrorId.GetStatePropertyWhenPrimitive);
                            }
                        }
                        // TODO if this is promised state
                        // it will throw, better to add new error code
                        // and explain that state.map(...) should be replaced by state[self].map(...)
                        // which is the most common oversight with promised states.
                        _this.get(); // mark used
                        if (Array.isArray(currentValue)) {
                            if (key === 'length') {
                                // logger.log('called get for array length', key)
                                return currentValue.length;
                            }
                            if (key in Array.prototype) {
                                // logger.log('called get for array prototype', key)
                                return Array.prototype[key];
                            }
                            var index = Number(key);
                            if (!Number.isInteger(index)) {
                                // logger.log('called get for array named prop', key)
                                return undefined;
                            }
                            // logger.log('called get for array index', key)
                            return _this.child(index)[self];
                        }
                        // logger.log('called get return child', key)
                        return _this.child(key.toString())[self];
                    }
                }, function (_, key, value) {
                    throw new StateInvalidUsageError(_this.path, ErrorId.SetProperty_State);
                }, false);
                return this.selfCache;
            },
            enumerable: false,
            configurable: true
        });
        StateMethodsImpl.prototype.map = function (action, onPromised, onError, context) {
            var _this = this;
            var promised = function () {
                var currentValue = _this.get(true); // marks used
                if (currentValue === none && _this.state.promised && !_this.state.promised.fullfilled) {
                    return true;
                }
                return false;
            };
            var error = function () {
                var currentValue = _this.get(true); // marks used
                if (currentValue === none) {
                    if (_this.state.promised && _this.state.promised.fullfilled) {
                        return _this.state.promised.error;
                    }
                    _this.get(); // will throw 'read while promised' exception
                }
                return undefined;
            };
            if (!action) {
                if (promised()) {
                    return [true, undefined, undefined];
                }
                if (error()) {
                    return [false, error(), undefined];
                }
                return [false, undefined, this.value];
            }
            var contextArg = typeof onPromised === 'function'
                ? (typeof onError === 'function' ? context : onError)
                : onPromised;
            var runBatch = (function (actionArg) {
                if (contextArg !== undefined) {
                    var opts = { context: contextArg };
                    try {
                        _this.state.startBatch(_this.path, opts);
                        return actionArg();
                    }
                    finally {
                        _this.state.finishBatch(_this.path, opts);
                    }
                }
                else {
                    return actionArg();
                }
            });
            if (typeof onPromised === 'function' && promised()) {
                return runBatch(function () {
                    var r = onPromised(_this[self]);
                    if (r === postpone) {
                        // tslint:disable-next-line: no-any
                        _this.state.postponeBatch(function () { return _this.map(action, onPromised, onError, context); });
                    }
                    return r;
                });
            }
            if (typeof onError === 'function' && error()) {
                return runBatch(function () { return onError(error(), _this[self]); });
            }
            return runBatch(function () { return action(_this[self]); });
        };
        Object.defineProperty(StateMethodsImpl.prototype, "ornull", {
            get: function () {
                var value = this.get();
                if (value === null || value === undefined) {
                    return value;
                }
                return this[self];
            },
            enumerable: false,
            configurable: true
        });
        StateMethodsImpl.prototype.attach = function (p) {
            if (typeof p === 'function') {
                var pluginMeta = p();
                if (pluginMeta.id === DowngradedID) {
                    this.isDowngraded = true;
                    return this[self];
                }
                this.state.register(pluginMeta);
                return this[self];
            }
            else {
                return [
                    this.state.getPlugin(p) ||
                        (new StateInvalidUsageError(this.path, ErrorId.GetUnknownPlugin, p.toString())),
                    this
                ];
            }
        };
        return StateMethodsImpl;
    }());
    function proxyWrap(path, 
    // tslint:disable-next-line: no-any
    targetBootstrap, 
    // tslint:disable-next-line: no-any
    targetGetter, 
    // tslint:disable-next-line: no-any
    propertyGetter, 
    // tslint:disable-next-line: no-any
    propertySetter, isValueProxy) {
        var onInvalidUsage = function (op) {
            throw new StateInvalidUsageError(path, op);
        };
        if (typeof targetBootstrap !== 'object' || targetBootstrap === null) {
            targetBootstrap = {};
        }
        return new Proxy(targetBootstrap, {
            getPrototypeOf: function (target) {
                logger.log('called getPrototypeOf');
                // should satisfy the invariants:
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getPrototypeOf#Invariants
                var targetReal = targetGetter();
                if (targetReal === undefined || targetReal === null) {
                    return null;
                }
                return Object.getPrototypeOf(targetReal);
            },
            setPrototypeOf: function (target, v) {
                logger.log('called setPrototypeOf');
                return onInvalidUsage(isValueProxy ?
                    ErrorId.SetPrototypeOf_State :
                    ErrorId.SetPrototypeOf_Value);
            },
            isExtensible: function (target) {
                logger.log('called isExtensible');
                // should satisfy the invariants:
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/isExtensible#Invariants
                return true; // required to satisfy the invariants of the getPrototypeOf
                // return Object.isExtensible(target);
            },
            preventExtensions: function (target) {
                logger.log('called preventExtensions');
                return onInvalidUsage(isValueProxy ?
                    ErrorId.PreventExtensions_State :
                    ErrorId.PreventExtensions_Value);
            },
            getOwnPropertyDescriptor: function (target, p) {
                logger.log('called getOwnPropertyDescriptor', p);
                var targetReal = targetGetter();
                if (targetReal === undefined || targetReal === null) {
                    return undefined;
                }
                var origin = Object.getOwnPropertyDescriptor(targetReal, p);
                if (origin && Array.isArray(targetReal) && p in Array.prototype) {
                    return origin;
                }
                return origin && {
                    configurable: true,
                    enumerable: origin.enumerable,
                    get: function () { return propertyGetter(targetReal, p); },
                    set: undefined
                };
            },
            has: function (target, p) {
                logger.log('called has', p);
                if (typeof p === 'symbol') {
                    return false;
                }
                var targetReal = targetGetter();
                if (typeof targetReal === 'object' && targetReal !== null) {
                    return p in targetReal;
                }
                return false;
            },
            get: function (target, p) {
                logger.log('called get', p);
                return propertyGetter(target, p);
            },
            set: function (target, p, v, r) {
                logger.log('called set', p, v);
                return propertySetter(target, p, v, r);
            },
            deleteProperty: function (target, p) {
                logger.log('called deleteProperty');
                return onInvalidUsage(isValueProxy ?
                    ErrorId.DeleteProperty_State :
                    ErrorId.DeleteProperty_Value);
            },
            defineProperty: function (target, p, attributes) {
                logger.log('called defineProperty', p, attributes);
                // TODO temporary allow to mark objects as Vue raw
                if (p === "__v_skip") {
                    return Object.defineProperty(target, p, attributes);
                }
                if (p === "__v_reactive") {
                    return Object.defineProperty(target, p, attributes);
                }
                return onInvalidUsage(isValueProxy ?
                    ErrorId.DefineProperty_State :
                    ErrorId.DefineProperty_Value);
            },
            enumerate: function (target) {
                logger.log('called enumerate');
                var targetReal = targetGetter();
                if (Array.isArray(targetReal)) {
                    return Object.keys(targetReal).concat('length');
                }
                if (targetReal === undefined || targetReal === null) {
                    return [];
                }
                return Object.keys(targetReal);
            },
            ownKeys: function (target) {
                logger.log('called ownKeys');
                var targetReal = targetGetter();
                if (Array.isArray(targetReal)) {
                    return Object.keys(targetReal).concat('length');
                }
                if (targetReal === undefined || targetReal === null) {
                    return [];
                }
                return Object.keys(targetReal);
            },
            apply: function (target, thisArg, argArray) {
                logger.log('called apply');
                return onInvalidUsage(isValueProxy ?
                    ErrorId.Apply_State :
                    ErrorId.Apply_Value);
            },
            construct: function (target, argArray, newTarget) {
                logger.log('called construct');
                return onInvalidUsage(isValueProxy ?
                    ErrorId.Construct_State :
                    ErrorId.Construct_Value);
            }
        });
    }
    function createStore(initial) {
        var initialValue = initial;
        if (typeof initial === 'function') {
            initialValue = initial();
        }
        if (typeof initialValue === 'object' && initialValue !== null && initialValue[SelfMethodsID]) {
            throw new StateInvalidUsageError(RootPath, ErrorId.InitStateToValueFromState);
        }
        return new Store(initialValue);
    }
    function useSubscribedStateMethods(state, path, subscribeTarget, parentOnGetUsed) {
        var capturedTrack;
        var capturedTrigger;
        vue.customRef(function (track, trigger) {
            capturedTrack = track;
            capturedTrigger = trigger;
            return { get: function () { }, set: function () { } };
        });
        var renderTimes = 0;
        var renderWatcher = vue.computed(function () {
            renderTimes += 1;
            capturedTrack();
            logger.warn('called renderWatcher', renderTimes);
            // TODO need to disable this and rethink cache clean up strategy
            // because this leaves broken chain to nested states which are not
            // "rebuilt" like in react during rerender from parent to child
            // link.resetTracesBeforeRerender()
            return renderTimes;
        });
        var link = new StateMethodsImpl(state, path, state.get(path), state.edition, function () {
            // TODO not sure how efficient it will be for Vue
            // but it is the only way to force rerender for nested components
            // when parent is rerendered
            // (effectively this line ensures that the customRef from parent
            // is also tracked when child's scoped state is used,
            // which is correct - child's state is a substate of a parent's state)
            parentOnGetUsed && parentOnGetUsed();
            // TODO if link.resetTracesBeforeRerender is not used above
            // it is possible to use here
            // capturedTrack(),
            // instead of renderWatcher.value below
            // but keep the current scheme until things get 100% clear
            // regarding cache clean up strategy
            // TODO call to value has got a side effect, although it is a property
            // need to make sure this is not deleted by an optimizer,
            // which might decide the return value is not used.
            // but how?
            renderWatcher.value;
        }, capturedTrigger);
        // in vue this is executed only once during setup
        subscribeTarget.subscribe(link);
        // and this will be executed when unmounted, which also happens only once
        vue.onUnmounted(function () { return subscribeTarget.unsubscribe(link); });
        return link;
    }

    exports.DevTools = DevTools;
    exports.DevToolsID = DevToolsID;
    exports.Downgraded = Downgraded;
    exports.StateFragment = StateFragment;
    exports.createState = createState;
    exports.none = none;
    exports.postpone = postpone;
    exports.self = self;
    exports.useState = useState;

    });

    /* Mutating A triggers B side effects which is incorrect (main issue) */
    var script$1 = {
      name: 'AppStateTest',
      setup() {
        const state = dist.useState({ a: 1, b: 2 });

        watchEffect(() => {
          console.log('b was updated incorrectly [only should run once]', state.b.value);
          // state.failed = true // uncomment to trigger StateInvalidUsageError on appstate-fast
        });

        setInterval(() => {
          state.a.set(p => p + 1);
        }, 1000);

        return { state }
      }
    };

    const _hoisted_1$1 = { class: "title is-1" };

    function render$2(_ctx, _cache, $props, $setup, $data, $options) {
      return (openBlock(), createBlock("h1", _hoisted_1$1, toDisplayString($setup.state.a), 1 /* TEXT */))
    }

    script$1.render = render$2;
    script$1.__file = "src/components/AppState.vue";

    var script$2 = {
      name: 'App',
      components: {
        HelloWorld: script,
        AppState: script$1
      }
    };

    const _hoisted_1$2 = { id: "app" };

    function render$3(_ctx, _cache, $props, $setup, $data, $options) {
      const _component_app_state = resolveComponent("app-state");

      return (openBlock(), createBlock("div", _hoisted_1$2, [
        createCommentVNode(" <hello-world /> "),
        createVNode(_component_app_state)
      ]))
    }

    script$2.render = render$3;
    script$2.__file = "src/App.vue";

    createApp(script$2).mount('#app');

}());
