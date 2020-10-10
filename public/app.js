
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
    const isHTMLTag = /*#__PURE__*/ makeMap(HTML_TAGS);
    const isSVGTag = /*#__PURE__*/ makeMap(SVG_TAGS);

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
    const EMPTY_OBJ =  Object.freeze({})
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
    let _globalThis;
    const getGlobalThis = () => {
        return (_globalThis ||
            (_globalThis =
                typeof globalThis !== 'undefined'
                    ? globalThis
                    : typeof self !== 'undefined'
                        ? self
                        : typeof window !== 'undefined'
                            ? window
                            : typeof global !== 'undefined'
                                ? global
                                : {}));
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
                `versions of the same object${type === `Map` ? `as keys` : ``}, ` +
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
            const errorInfo =  ErrorTypeStrings[type] ;
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
                extend(comp, newComp);
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
        const props = instance.vnode.props || EMPTY_OBJ;
        {
            const { emitsOptions, propsOptions: [propsOptions] } = instance;
            if (emitsOptions) {
                if (!(event in emitsOptions)) {
                    if (!propsOptions || !(`on` + capitalize(event) in propsOptions)) {
                        warn(`Component emitted event "${event}" but it is neither declared in ` +
                            `the emits option nor as an "on${capitalize(event)}" prop.`);
                    }
                }
                else {
                    const validator = emitsOptions[event];
                    if (isFunction(validator)) {
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
                root.dirs = vnode.dirs;
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
            if ( !singleChild) {
                warn(`<Suspense> slots expect a single root node.`);
            }
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
            if ( warnMissing && !res) {
                warn(`Failed to resolve ${type.slice(0, -1)}: ${name}`);
            }
            return res;
        }
        else {
            warn(`resolve${capitalize(type.slice(0, -1))} ` +
                `can only be used in render() or setup().`);
        }
    }
    function resolve(registry, name) {
        return (registry &&
            (registry[name] ||
                registry[camelize(name)] ||
                registry[capitalize(camelize(name))]));
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
        if (
            n2.shapeFlag & 6 /* COMPONENT */ &&
            hmrDirtyComponents.has(n2.type)) {
            // HMR only: if the component has been hot-updated, force a reload.
            return false;
        }
        return n1.type === n2.type && n1.key === n2.key;
    }
    const createVNodeWithArgsTransform = (...args) => {
        return _createVNode(...( args));
    };
    const InternalObjectKey = `__vInternal`;
    const normalizeKey = ({ key }) => key != null ? key : null;
    const normalizeRef = ({ ref }) => {
        return (ref != null
            ? isArray(ref)
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
        // always force full diff if hmr is enabled
        !( instance.type.__hmrId) &&
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
                if ( !isString(raw[i])) {
                    warn(`props must be strings when using array syntax.`, raw[i]);
                }
                const normalizedKey = camelize(raw[i]);
                if (validatePropName(normalizedKey)) {
                    normalized[normalizedKey] = EMPTY_OBJ;
                }
            }
        }
        else if (raw) {
            if ( !isObject(raw)) {
                warn(`invalid props options`, raw);
            }
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
    function validateProps(props, instance) {
        const rawValues = toRaw(props);
        const options = instance.propsOptions[0];
        for (const key in options) {
            let opt = options[key];
            if (opt == null)
                continue;
            validateProp(key, rawValues[key], opt, !hasOwn(rawValues, key));
        }
    }
    /**
     * dev only
     */
    function validatePropName(key) {
        if (key[0] !== '$') {
            return true;
        }
        else {
            warn(`Invalid prop name: "${key}" is a reserved property.`);
        }
        return false;
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
            const types = isArray(type) ? type : [type];
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
            valid = isObject(value);
        }
        else if (expectedType === 'Array') {
            valid = isArray(value);
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
            ` Expected ${expectedTypes.map(capitalize).join(', ')}`;
        const expectedType = expectedTypes[0];
        const receivedType = toRawType(value);
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

    const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

    const isInternalKey = (key) => key[0] === '_' || key === '$stable';
    const normalizeSlotValue = (value) => isArray(value)
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
            if (isFunction(value)) {
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
                if ( isHmrUpdating) {
                    // Parent was HMR updated so slot content may have changed.
                    // force update slots and mark instance for hmr as well
                    extend(slots, children);
                }
                else if (type === 1 /* STABLE */) {
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
                    else if (plugin && isFunction(plugin.install)) {
                        installedPlugins.add(plugin);
                        plugin.install(app, ...options);
                    }
                    else if (isFunction(plugin)) {
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
        if ( !owner) {
            warn(`Missing ref owner context. ref cannot be used on hoisted vnodes. ` +
                `A vnode with ref must be created inside the render function.`);
            return;
        }
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
            const oldProps = n1.props || EMPTY_OBJ;
            const newProps = n2.props || EMPTY_OBJ;
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
                if ( parentComponent && parentComponent.type.__hmrId) {
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
                    // reset refs
                    // only needed if previous patch had refs
                    if (instance.refs !== EMPTY_OBJ) {
                        instance.refs = {};
                    }
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
                    if ( c2.type === Comment) {
                        c2.el = c1.el;
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
        $props: i => ( shallowReadonly(i.props) ),
        $attrs: i => ( shallowReadonly(i.attrs) ),
        $slots: i => ( shallowReadonly(i.slots) ),
        $refs: i => ( shallowReadonly(i.refs) ),
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
            else if (
                currentRenderingInstance &&
                (!isString(key) ||
                    // #1091 avoid internal isRef/isVNode checks on component instance leading
                    // to infinite warning loop
                    key.indexOf('__v') !== 0)) {
                if (data !== EMPTY_OBJ &&
                    (key[0] === '$' || key[0] === '_') &&
                    hasOwn(data, key)) {
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
            if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                setupState[key] = value;
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
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
                (data !== EMPTY_OBJ && hasOwn(data, key)) ||
                (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
                ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
                hasOwn(ctx, key) ||
                hasOwn(publicPropertiesMap, key) ||
                hasOwn(appContext.config.globalProperties, key));
        }
    };
    {
        PublicInstanceProxyHandlers.ownKeys = (target) => {
            warn(`Avoid app logic that relies on enumerating keys on a component instance. ` +
                `The keys will be empty in production mode to avoid performance overhead.`);
            return Reflect.ownKeys(target);
        };
    }
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
        if (isFunction(setupResult)) {
            // setup returned an inline render function
            instance.render = setupResult;
        }
        else if (isObject(setupResult)) {
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
        // warn missing template/render
        if ( !Component.render && instance.render === NOOP) {
            /* istanbul ignore if */
            if ( Component.template) {
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
        {
            injectNativeTagCheck(app);
        }
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
    function injectNativeTagCheck(app) {
        // Inject `isNativeTag`
        // this is used for component name validation (dev only)
        Object.defineProperty(app.config, 'isNativeTag', {
            value: (tag) => isHTMLTag(tag) || isSVGTag(tag),
            writable: false
        });
    }
    function normalizeContainer(container) {
        if (isString(container)) {
            const res = document.querySelector(container);
            if ( !res) {
                warn(`Failed to mount app: mount target selector returned null.`);
            }
            return res;
        }
        return container;
    }

    function initDev() {
        const target = getGlobalThis();
        target.__VUE__ = true;
        setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__);
        {
            console.info(`You are running a development build of Vue.\n` +
                `Make sure to use the production build (*.prod.js) when deploying for production.`);
        }
    }

    // This entry exports the runtime only, and is built as
     initDev();

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
    script$1.__file = "src/components/HelloWorld.vue";

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
    script$2.__file = "src/App.vue";

    var css$1 = "/*! bulma.io v0.9.0 | MIT License | github.com/jgthms/bulma */\n@-webkit-keyframes spinAround {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(359deg);\n  }\n}\n@keyframes spinAround {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(359deg);\n  }\n}\n\n.button, .input, .textarea, .select select, .file-cta,\n.file-name, .pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  align-items: center;\n  border: var(--blm-ctrl-bd-width) solid transparent;\n  border-radius: var(--blm-ctrl-radius);\n  box-shadow: none;\n  display: inline-flex;\n  font-size: var(--blm-s-normal);\n  height: var(--blm-ctrl-height);\n  justify-content: flex-start;\n  line-height: var(--blm-ctrl-line-height);\n  padding: var(--blm-ctrl-p-vertical) var(--blm-ctrl-p-horizontal);\n  position: relative;\n  vertical-align: top;\n}\n\n.button:focus, .input:focus, .textarea:focus, .select select:focus, .file-cta:focus,\n.file-name:focus, .pagination-previous:focus,\n.pagination-next:focus,\n.pagination-link:focus,\n.pagination-ellipsis:focus, .is-focused.button, .is-focused.input, .is-focused.textarea, .select select.is-focused, .is-focused.file-cta,\n.is-focused.file-name, .is-focused.pagination-previous,\n.is-focused.pagination-next,\n.is-focused.pagination-link,\n.is-focused.pagination-ellipsis, .button:active, .input:active, .textarea:active, .select select:active, .file-cta:active,\n.file-name:active, .pagination-previous:active,\n.pagination-next:active,\n.pagination-link:active,\n.pagination-ellipsis:active, .is-active.button, .is-active.input, .is-active.textarea, .select select.is-active, .is-active.file-cta,\n.is-active.file-name, .is-active.pagination-previous,\n.is-active.pagination-next,\n.is-active.pagination-link,\n.is-active.pagination-ellipsis {\n  outline: none;\n}\n\n.button[disabled], .input[disabled], .textarea[disabled], .select select[disabled], .file-cta[disabled],\n.file-name[disabled], .pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled],\n.pagination-ellipsis[disabled],\nfieldset[disabled] .button,\nfieldset[disabled] .input,\nfieldset[disabled] .textarea,\nfieldset[disabled] .select select,\n.select fieldset[disabled] select,\nfieldset[disabled] .file-cta,\nfieldset[disabled] .file-name,\nfieldset[disabled] .pagination-previous,\nfieldset[disabled] .pagination-next,\nfieldset[disabled] .pagination-link,\nfieldset[disabled] .pagination-ellipsis {\n  cursor: not-allowed;\n}\n\n.delete, .modal-close, .button, .file, .breadcrumb, .pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis, .tabs, .is-unselectable {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.select:not(.is-multiple):not(.is-loading)::after, .navbar-link:not(.is-arrowless)::after {\n  border: 3px solid transparent;\n  border-radius: 2px;\n  border-right: 0;\n  border-top: 0;\n  content: \" \";\n  display: block;\n  height: 0.625em;\n  margin-top: -0.4375em;\n  pointer-events: none;\n  position: absolute;\n  top: 50%;\n  transform: rotate(-45deg);\n  transform-origin: center;\n  width: 0.625em;\n}\n\n.box:not(:last-child), .content:not(:last-child), .notification:not(:last-child), .progress:not(:last-child), .table:not(:last-child), .table-container:not(:last-child), .title:not(:last-child),\n.subtitle:not(:last-child), .block:not(:last-child), .highlight:not(:last-child), .breadcrumb:not(:last-child), .level:not(:last-child), .message:not(:last-child), .pagination:not(:last-child), .tabs:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.delete, .modal-close {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), calc(var(--blm-sch-inv-a)*0.2));\n  border: none;\n  border-radius: var(--blm-radius-rounded);\n  cursor: pointer;\n  pointer-events: auto;\n  display: inline-block;\n  flex-grow: 0;\n  flex-shrink: 0;\n  font-size: 0;\n  height: 20px;\n  max-height: 20px;\n  max-width: 20px;\n  min-height: 20px;\n  min-width: 20px;\n  outline: none;\n  position: relative;\n  vertical-align: top;\n  width: 20px;\n}\n\n.delete::before, .modal-close::before, .delete::after, .modal-close::after {\n  background-color: var(--blm-sch-main);\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\n\n.delete::before, .modal-close::before {\n  height: 2px;\n  width: 50%;\n}\n\n.delete::after, .modal-close::after {\n  height: 50%;\n  width: 2px;\n}\n\n.delete:hover, .modal-close:hover, .delete:focus, .modal-close:focus {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), calc(var(--blm-sch-inv-a)*0.3));\n}\n\n.delete:active, .modal-close:active {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), calc(var(--blm-sch-inv-a)*0.4));\n}\n\n.is-small.delete, .is-small.modal-close {\n  height: 16px;\n  max-height: 16px;\n  max-width: 16px;\n  min-height: 16px;\n  min-width: 16px;\n  width: 16px;\n}\n\n.is-medium.delete, .is-medium.modal-close {\n  height: 24px;\n  max-height: 24px;\n  max-width: 24px;\n  min-height: 24px;\n  min-width: 24px;\n  width: 24px;\n}\n\n.is-large.delete, .is-large.modal-close {\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\n\n.button.is-loading::after, .loader, .select.is-loading::after, .control.is-loading::after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid var(--blm-grey-lighter);\n  border-radius: var(--blm-radius-rounded);\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n}\n\n.image.is-square img,\n.image.is-square .has-ratio, .image.is-1by1 img,\n.image.is-1by1 .has-ratio, .image.is-5by4 img,\n.image.is-5by4 .has-ratio, .image.is-4by3 img,\n.image.is-4by3 .has-ratio, .image.is-3by2 img,\n.image.is-3by2 .has-ratio, .image.is-5by3 img,\n.image.is-5by3 .has-ratio, .image.is-16by9 img,\n.image.is-16by9 .has-ratio, .image.is-2by1 img,\n.image.is-2by1 .has-ratio, .image.is-3by1 img,\n.image.is-3by1 .has-ratio, .image.is-4by5 img,\n.image.is-4by5 .has-ratio, .image.is-3by4 img,\n.image.is-3by4 .has-ratio, .image.is-2by3 img,\n.image.is-2by3 .has-ratio, .image.is-3by5 img,\n.image.is-3by5 .has-ratio, .image.is-9by16 img,\n.image.is-9by16 .has-ratio, .image.is-1by2 img,\n.image.is-1by2 .has-ratio, .image.is-1by3 img,\n.image.is-1by3 .has-ratio, .modal, .modal-background, .is-overlay, .hero-video {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n/*! minireset.css v0.0.6 | MIT License | github.com/jgthms/minireset.css */\nhtml,\nbody,\np,\nol,\nul,\nli,\ndl,\ndt,\ndd,\nblockquote,\nfigure,\nfieldset,\nlegend,\ntextarea,\npre,\niframe,\nhr,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  margin: 0;\n  padding: 0;\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: 100%;\n  font-weight: normal;\n}\n\nul {\n  list-style: none;\n}\n\nbutton,\ninput,\nselect,\ntextarea {\n  margin: 0;\n}\n\nhtml {\n  box-sizing: border-box;\n}\n\n*, *::before, *::after {\n  box-sizing: inherit;\n}\n\nimg,\nvideo {\n  height: auto;\n  max-width: 100%;\n}\n\niframe {\n  border: 0;\n}\n\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\n\ntd,\nth {\n  padding: 0;\n}\n\ntd:not([align]),\nth:not([align]) {\n  text-align: inherit;\n}\n\nhtml {\n  background-color: var(--blm-sch-main);\n  font-size: 16px;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  min-width: 300px;\n  overflow-x: hidden;\n  overflow-y: scroll;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n     -moz-text-size-adjust: 100%;\n      -ms-text-size-adjust: 100%;\n          text-size-adjust: 100%;\n}\n\narticle,\naside,\nfigure,\nfooter,\nheader,\nhgroup,\nsection {\n  display: block;\n}\n\nbody,\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: var(--blm-family-prim);\n}\n\ncode,\npre {\n  -moz-osx-font-smoothing: auto;\n  -webkit-font-smoothing: auto;\n  font-family: var(--blm-family-code);\n}\n\nbody {\n  color: var(--blm-txt);\n  font-size: 1em;\n  font-weight: var(--blm-weight-normal);\n  line-height: 1.5;\n}\n\na {\n  color: var(--blm-blue);\n  cursor: pointer;\n  text-decoration: none;\n}\n\na strong {\n  color: currentColor;\n}\n\na:hover {\n  color: var(--blm-grey-darker);\n}\n\ncode {\n  background-color: var(--blm-bg);\n  color: var(--blm-red);\n  font-size: 0.875em;\n  font-weight: normal;\n  padding: 0.25em 0.5em 0.25em;\n}\n\nhr {\n  background-color: var(--blm-bg);\n  border: none;\n  display: block;\n  height: 2px;\n  margin: 1.5rem 0;\n}\n\nimg {\n  height: auto;\n  max-width: 100%;\n}\n\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  vertical-align: baseline;\n}\n\nsmall {\n  font-size: 0.875em;\n}\n\nspan {\n  font-style: inherit;\n  font-weight: inherit;\n}\n\nstrong {\n  color: var(--blm-txt-strong);\n  font-weight: var(--blm-weight-bold);\n}\n\nfieldset {\n  border: none;\n}\n\npre {\n  -webkit-overflow-scrolling: touch;\n  background-color: var(--blm-bg);\n  color: var(--blm-txt);\n  font-size: 0.875em;\n  overflow-x: auto;\n  padding: 1.25rem 1.5rem;\n  white-space: pre;\n  word-wrap: normal;\n}\n\npre code {\n  background-color: transparent;\n  color: currentColor;\n  font-size: 1em;\n  padding: 0;\n}\n\ntable td,\ntable th {\n  vertical-align: top;\n}\n\ntable td:not([align]),\ntable th:not([align]) {\n  text-align: inherit;\n}\n\ntable th {\n  color: var(--blm-grey-darker);\n}\n\n.box {\n  background-color: var(--blm-box-bg-clr);\n  border-radius: var(--blm-box-radius);\n  box-shadow: var(--blm-box-shadow);\n  color: var(--blm-box-clr);\n  display: block;\n  padding: var(--blm-box-p);\n}\n\na.box:hover, a.box:focus {\n  box-shadow: var(--blm-box-link-hov-shadow);\n}\n\na.box:active {\n  box-shadow: var(--blm-box-link-act-shadow);\n}\n\n.button {\n  background-color: var(--blm-bt-bg-clr);\n  border-color: var(--blm-bt-bd-clr);\n  border-width: var(--blm-bt-bd-width);\n  color: var(--blm-bt-clr);\n  cursor: pointer;\n  font-family: var(--blm-bt-family);\n  justify-content: center;\n  padding: var(--blm-bt-p-vertical) var(--blm-bt-p-horizontal);\n  text-align: center;\n  white-space: nowrap;\n}\n\n.button strong {\n  color: inherit;\n}\n\n.button .icon, .button .icon.is-small, .button .icon.is-medium, .button .icon.is-large {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.button .icon:first-child:not(:last-child) {\n  margin-left: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n  margin-right: calc(var(--blm-bt-p-horizontal)/4);\n}\n\n.button .icon:last-child:not(:first-child) {\n  margin-left: calc(var(--blm-bt-p-horizontal)/4);\n  margin-right: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n}\n\n.button .icon:first-child:last-child {\n  margin-left: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n  margin-right: calc(-0.5*var(--blm-bt-p-horizontal) - var(--blm-bt-bd-width));\n}\n\n.button:hover, .button.is-hovered {\n  border-color: var(--blm-bt-hov-bd-clr);\n  color: var(--blm-bt-hov-clr);\n}\n\n.button:focus, .button.is-focused {\n  border-color: var(--blm-bt-foc-bd-clr);\n  color: var(--blm-bt-foc-clr);\n}\n\n.button:focus:not(:active), .button.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) var(--blm-bt-foc-box-shadow-clr);\n}\n\n.button:active, .button.is-active {\n  border-color: var(--blm-bt-act-bd-clr);\n  color: var(--blm-bt-act-clr);\n}\n\n.button.is-text {\n  background-color: transparent;\n  border-color: transparent;\n  color: var(--blm-bt-txt-clr);\n  -webkit-text-decoration: var(--blm-bt-txt-decoration);\n          text-decoration: var(--blm-bt-txt-decoration);\n}\n\n.button.is-text:hover, .button.is-text.is-hovered, .button.is-text:focus, .button.is-text.is-focused {\n  background-color: var(--blm-bt-txt-hov-bg-clr);\n  color: var(--blm-bt-txt-hov-clr);\n}\n\n.button.is-text:active, .button.is-text.is-active {\n  background-color: hsla(var(--blm-bt-txt-hov-bg-clr-h), var(--blm-bt-txt-hov-bg-clr-s), calc(var(--blm-bt-txt-hov-bg-clr-l) - 5%), var(--blm-bt-txt-hov-bg-clr-a));\n  color: var(--blm-bt-txt-hov-clr);\n}\n\n.button.is-text[disabled],\nfieldset[disabled] .button.is-text {\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white {\n  background-color: var(--blm-white);\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:hover, .button.is-white.is-hovered {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 2.5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:focus, .button.is-white.is-focused {\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white:focus:not(:active), .button.is-white.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), 0.25);\n}\n\n.button.is-white:active, .button.is-white.is-active {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.button.is-white[disabled],\nfieldset[disabled] .button.is-white {\n  background-color: var(--blm-white);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white.is-inverted {\n  background-color: var(--blm-white-inv);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted:hover, .button.is-white.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), calc(var(--blm-white-inv-l) - 5%), var(--blm-white-inv-a));\n}\n\n.button.is-white.is-inverted[disabled],\nfieldset[disabled] .button.is-white.is-inverted {\n  background-color: var(--blm-white-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-white);\n}\n\n.button.is-white.is-loading::after {\n  border-color: transparent transparent var(--blm-white-inv) var(--blm-white-inv) !important;\n}\n\n.button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-outlined:hover, .button.is-white.is-outlined.is-hovered, .button.is-white.is-outlined:focus, .button.is-white.is-outlined.is-focused {\n  background-color: var(--blm-white);\n  border-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.button.is-white.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-white) var(--blm-white) !important;\n}\n\n.button.is-white.is-outlined.is-loading:hover::after, .button.is-white.is-outlined.is-loading.is-hovered::after, .button.is-white.is-outlined.is-loading:focus::after, .button.is-white.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-white-inv) var(--blm-white-inv) !important;\n}\n\n.button.is-white.is-outlined[disabled],\nfieldset[disabled] .button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white);\n  box-shadow: none;\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white-inv);\n  color: var(--blm-white-inv);\n}\n\n.button.is-white.is-inverted.is-outlined:hover, .button.is-white.is-inverted.is-outlined.is-hovered, .button.is-white.is-inverted.is-outlined:focus, .button.is-white.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-white-inv);\n  color: var(--blm-white);\n}\n\n.button.is-white.is-inverted.is-outlined.is-loading:hover::after, .button.is-white.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-white.is-inverted.is-outlined.is-loading:focus::after, .button.is-white.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-white) var(--blm-white) !important;\n}\n\n.button.is-white.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-white-inv);\n  box-shadow: none;\n  color: var(--blm-white-inv);\n}\n\n.button.is-black {\n  background-color: var(--blm-black);\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:hover, .button.is-black.is-hovered {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 2.5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:focus, .button.is-black.is-focused {\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black:focus:not(:active), .button.is-black.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), 0.25);\n}\n\n.button.is-black:active, .button.is-black.is-active {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.button.is-black[disabled],\nfieldset[disabled] .button.is-black {\n  background-color: var(--blm-black);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-black.is-inverted {\n  background-color: var(--blm-black-inv);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted:hover, .button.is-black.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), calc(var(--blm-black-inv-l) - 5%), var(--blm-black-inv-a));\n}\n\n.button.is-black.is-inverted[disabled],\nfieldset[disabled] .button.is-black.is-inverted {\n  background-color: var(--blm-black-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-black);\n}\n\n.button.is-black.is-loading::after {\n  border-color: transparent transparent var(--blm-black-inv) var(--blm-black-inv) !important;\n}\n\n.button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-outlined:hover, .button.is-black.is-outlined.is-hovered, .button.is-black.is-outlined:focus, .button.is-black.is-outlined.is-focused {\n  background-color: var(--blm-black);\n  border-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.button.is-black.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-black) var(--blm-black) !important;\n}\n\n.button.is-black.is-outlined.is-loading:hover::after, .button.is-black.is-outlined.is-loading.is-hovered::after, .button.is-black.is-outlined.is-loading:focus::after, .button.is-black.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-black-inv) var(--blm-black-inv) !important;\n}\n\n.button.is-black.is-outlined[disabled],\nfieldset[disabled] .button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black);\n  box-shadow: none;\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black-inv);\n  color: var(--blm-black-inv);\n}\n\n.button.is-black.is-inverted.is-outlined:hover, .button.is-black.is-inverted.is-outlined.is-hovered, .button.is-black.is-inverted.is-outlined:focus, .button.is-black.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-black-inv);\n  color: var(--blm-black);\n}\n\n.button.is-black.is-inverted.is-outlined.is-loading:hover::after, .button.is-black.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-black.is-inverted.is-outlined.is-loading:focus::after, .button.is-black.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-black) var(--blm-black) !important;\n}\n\n.button.is-black.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-black-inv);\n  box-shadow: none;\n  color: var(--blm-black-inv);\n}\n\n.button.is-light {\n  background-color: var(--blm-light);\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:hover, .button.is-light.is-hovered {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 2.5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:focus, .button.is-light.is-focused {\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light:focus:not(:active), .button.is-light.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n}\n\n.button.is-light:active, .button.is-light.is-active {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.button.is-light[disabled],\nfieldset[disabled] .button.is-light {\n  background-color: var(--blm-light);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-light.is-inverted {\n  background-color: var(--blm-light-inv);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted:hover, .button.is-light.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), calc(var(--blm-light-inv-l) - 5%), var(--blm-light-inv-a));\n}\n\n.button.is-light.is-inverted[disabled],\nfieldset[disabled] .button.is-light.is-inverted {\n  background-color: var(--blm-light-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-light);\n}\n\n.button.is-light.is-loading::after {\n  border-color: transparent transparent var(--blm-light-inv) var(--blm-light-inv) !important;\n}\n\n.button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-outlined:hover, .button.is-light.is-outlined.is-hovered, .button.is-light.is-outlined:focus, .button.is-light.is-outlined.is-focused {\n  background-color: var(--blm-light);\n  border-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.button.is-light.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-light) var(--blm-light) !important;\n}\n\n.button.is-light.is-outlined.is-loading:hover::after, .button.is-light.is-outlined.is-loading.is-hovered::after, .button.is-light.is-outlined.is-loading:focus::after, .button.is-light.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-light-inv) var(--blm-light-inv) !important;\n}\n\n.button.is-light.is-outlined[disabled],\nfieldset[disabled] .button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light);\n  box-shadow: none;\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light-inv);\n  color: var(--blm-light-inv);\n}\n\n.button.is-light.is-inverted.is-outlined:hover, .button.is-light.is-inverted.is-outlined.is-hovered, .button.is-light.is-inverted.is-outlined:focus, .button.is-light.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-light-inv);\n  color: var(--blm-light);\n}\n\n.button.is-light.is-inverted.is-outlined.is-loading:hover::after, .button.is-light.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-light.is-inverted.is-outlined.is-loading:focus::after, .button.is-light.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-light) var(--blm-light) !important;\n}\n\n.button.is-light.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-light-inv);\n  box-shadow: none;\n  color: var(--blm-light-inv);\n}\n\n.button.is-dark {\n  background-color: var(--blm-dark);\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:hover, .button.is-dark.is-hovered {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 2.5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:focus, .button.is-dark.is-focused {\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark:focus:not(:active), .button.is-dark.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n}\n\n.button.is-dark:active, .button.is-dark.is-active {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark[disabled],\nfieldset[disabled] .button.is-dark {\n  background-color: var(--blm-dark);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-dark.is-inverted {\n  background-color: var(--blm-dark-inv);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted:hover, .button.is-dark.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), calc(var(--blm-dark-inv-l) - 5%), var(--blm-dark-inv-a));\n}\n\n.button.is-dark.is-inverted[disabled],\nfieldset[disabled] .button.is-dark.is-inverted {\n  background-color: var(--blm-dark-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-loading::after {\n  border-color: transparent transparent var(--blm-dark-inv) var(--blm-dark-inv) !important;\n}\n\n.button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-outlined:hover, .button.is-dark.is-outlined.is-hovered, .button.is-dark.is-outlined:focus, .button.is-dark.is-outlined.is-focused {\n  background-color: var(--blm-dark);\n  border-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-dark) var(--blm-dark) !important;\n}\n\n.button.is-dark.is-outlined.is-loading:hover::after, .button.is-dark.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-outlined.is-loading:focus::after, .button.is-dark.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dark-inv) var(--blm-dark-inv) !important;\n}\n\n.button.is-dark.is-outlined[disabled],\nfieldset[disabled] .button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark);\n  box-shadow: none;\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark-inv);\n  color: var(--blm-dark-inv);\n}\n\n.button.is-dark.is-inverted.is-outlined:hover, .button.is-dark.is-inverted.is-outlined.is-hovered, .button.is-dark.is-inverted.is-outlined:focus, .button.is-dark.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-dark-inv);\n  color: var(--blm-dark);\n}\n\n.button.is-dark.is-inverted.is-outlined.is-loading:hover::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-inverted.is-outlined.is-loading:focus::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dark) var(--blm-dark) !important;\n}\n\n.button.is-dark.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dark-inv);\n  box-shadow: none;\n  color: var(--blm-dark-inv);\n}\n\n.button.is-primary {\n  background-color: var(--blm-prim);\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:hover, .button.is-primary.is-hovered {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 2.5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:focus, .button.is-primary.is-focused {\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary:focus:not(:active), .button.is-primary.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n}\n\n.button.is-primary:active, .button.is-primary.is-active {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary[disabled],\nfieldset[disabled] .button.is-primary {\n  background-color: var(--blm-prim);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-primary.is-inverted {\n  background-color: var(--blm-prim-inv);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted:hover, .button.is-primary.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), calc(var(--blm-prim-inv-l) - 5%), var(--blm-prim-inv-a));\n}\n\n.button.is-primary.is-inverted[disabled],\nfieldset[disabled] .button.is-primary.is-inverted {\n  background-color: var(--blm-prim-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-loading::after {\n  border-color: transparent transparent var(--blm-prim-inv) var(--blm-prim-inv) !important;\n}\n\n.button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-outlined:hover, .button.is-primary.is-outlined.is-hovered, .button.is-primary.is-outlined:focus, .button.is-primary.is-outlined.is-focused {\n  background-color: var(--blm-prim);\n  border-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-prim) var(--blm-prim) !important;\n}\n\n.button.is-primary.is-outlined.is-loading:hover::after, .button.is-primary.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-outlined.is-loading:focus::after, .button.is-primary.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-prim-inv) var(--blm-prim-inv) !important;\n}\n\n.button.is-primary.is-outlined[disabled],\nfieldset[disabled] .button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim);\n  box-shadow: none;\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim-inv);\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-inverted.is-outlined:hover, .button.is-primary.is-inverted.is-outlined.is-hovered, .button.is-primary.is-inverted.is-outlined:focus, .button.is-primary.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-prim-inv);\n  color: var(--blm-prim);\n}\n\n.button.is-primary.is-inverted.is-outlined.is-loading:hover::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-inverted.is-outlined.is-loading:focus::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-prim) var(--blm-prim) !important;\n}\n\n.button.is-primary.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-prim-inv);\n  box-shadow: none;\n  color: var(--blm-prim-inv);\n}\n\n.button.is-primary.is-light {\n  background-color: var(--blm-prim-light);\n  color: var(--blm-prim-dark);\n}\n\n.button.is-primary.is-light:hover, .button.is-primary.is-light.is-hovered {\n  background-color: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), calc(var(--blm-prim-light-l) - 2.5%), var(--blm-prim-light-a));\n  border-color: transparent;\n  color: var(--blm-prim-dark);\n}\n\n.button.is-primary.is-light:active, .button.is-primary.is-light.is-active {\n  background-color: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), calc(var(--blm-prim-light-l) - 5%), var(--blm-prim-light-a));\n  border-color: transparent;\n  color: var(--blm-prim-dark);\n}\n\n.button.is-link {\n  background-color: var(--blm-link);\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:hover, .button.is-link.is-hovered {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 2.5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:focus, .button.is-link.is-focused {\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link:focus:not(:active), .button.is-link.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n}\n\n.button.is-link:active, .button.is-link.is-active {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link[disabled],\nfieldset[disabled] .button.is-link {\n  background-color: var(--blm-link);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-link.is-inverted {\n  background-color: var(--blm-link-inv);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted:hover, .button.is-link.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), calc(var(--blm-link-inv-l) - 5%), var(--blm-link-inv-a));\n}\n\n.button.is-link.is-inverted[disabled],\nfieldset[disabled] .button.is-link.is-inverted {\n  background-color: var(--blm-link-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-link);\n}\n\n.button.is-link.is-loading::after {\n  border-color: transparent transparent var(--blm-link-inv) var(--blm-link-inv) !important;\n}\n\n.button.is-link.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-outlined:hover, .button.is-link.is-outlined.is-hovered, .button.is-link.is-outlined:focus, .button.is-link.is-outlined.is-focused {\n  background-color: var(--blm-link);\n  border-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-link) var(--blm-link) !important;\n}\n\n.button.is-link.is-outlined.is-loading:hover::after, .button.is-link.is-outlined.is-loading.is-hovered::after, .button.is-link.is-outlined.is-loading:focus::after, .button.is-link.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-link-inv) var(--blm-link-inv) !important;\n}\n\n.button.is-link.is-outlined[disabled],\nfieldset[disabled] .button.is-link.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link);\n  box-shadow: none;\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link-inv);\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-inverted.is-outlined:hover, .button.is-link.is-inverted.is-outlined.is-hovered, .button.is-link.is-inverted.is-outlined:focus, .button.is-link.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-link-inv);\n  color: var(--blm-link);\n}\n\n.button.is-link.is-inverted.is-outlined.is-loading:hover::after, .button.is-link.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-link.is-inverted.is-outlined.is-loading:focus::after, .button.is-link.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-link) var(--blm-link) !important;\n}\n\n.button.is-link.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-link.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-link-inv);\n  box-shadow: none;\n  color: var(--blm-link-inv);\n}\n\n.button.is-link.is-light {\n  background-color: var(--blm-link-light);\n  color: var(--blm-link-dark);\n}\n\n.button.is-link.is-light:hover, .button.is-link.is-light.is-hovered {\n  background-color: hsla(var(--blm-link-light-h), var(--blm-link-light-s), calc(var(--blm-link-light-l) - 2.5%), var(--blm-link-light-a));\n  border-color: transparent;\n  color: var(--blm-link-dark);\n}\n\n.button.is-link.is-light:active, .button.is-link.is-light.is-active {\n  background-color: hsla(var(--blm-link-light-h), var(--blm-link-light-s), calc(var(--blm-link-light-l) - 5%), var(--blm-link-light-a));\n  border-color: transparent;\n  color: var(--blm-link-dark);\n}\n\n.button.is-info {\n  background-color: var(--blm-info);\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:hover, .button.is-info.is-hovered {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 2.5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:focus, .button.is-info.is-focused {\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info:focus:not(:active), .button.is-info.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n}\n\n.button.is-info:active, .button.is-info.is-active {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info[disabled],\nfieldset[disabled] .button.is-info {\n  background-color: var(--blm-info);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-info.is-inverted {\n  background-color: var(--blm-info-inv);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted:hover, .button.is-info.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), calc(var(--blm-info-inv-l) - 5%), var(--blm-info-inv-a));\n}\n\n.button.is-info.is-inverted[disabled],\nfieldset[disabled] .button.is-info.is-inverted {\n  background-color: var(--blm-info-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-info);\n}\n\n.button.is-info.is-loading::after {\n  border-color: transparent transparent var(--blm-info-inv) var(--blm-info-inv) !important;\n}\n\n.button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-outlined:hover, .button.is-info.is-outlined.is-hovered, .button.is-info.is-outlined:focus, .button.is-info.is-outlined.is-focused {\n  background-color: var(--blm-info);\n  border-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-info) var(--blm-info) !important;\n}\n\n.button.is-info.is-outlined.is-loading:hover::after, .button.is-info.is-outlined.is-loading.is-hovered::after, .button.is-info.is-outlined.is-loading:focus::after, .button.is-info.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-info-inv) var(--blm-info-inv) !important;\n}\n\n.button.is-info.is-outlined[disabled],\nfieldset[disabled] .button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info);\n  box-shadow: none;\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info-inv);\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-inverted.is-outlined:hover, .button.is-info.is-inverted.is-outlined.is-hovered, .button.is-info.is-inverted.is-outlined:focus, .button.is-info.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-info-inv);\n  color: var(--blm-info);\n}\n\n.button.is-info.is-inverted.is-outlined.is-loading:hover::after, .button.is-info.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-info.is-inverted.is-outlined.is-loading:focus::after, .button.is-info.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-info) var(--blm-info) !important;\n}\n\n.button.is-info.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-info-inv);\n  box-shadow: none;\n  color: var(--blm-info-inv);\n}\n\n.button.is-info.is-light {\n  background-color: var(--blm-info-light);\n  color: var(--blm-info-dark);\n}\n\n.button.is-info.is-light:hover, .button.is-info.is-light.is-hovered {\n  background-color: hsla(var(--blm-info-light-h), var(--blm-info-light-s), calc(var(--blm-info-light-l) - 2.5%), var(--blm-info-light-a));\n  border-color: transparent;\n  color: var(--blm-info-dark);\n}\n\n.button.is-info.is-light:active, .button.is-info.is-light.is-active {\n  background-color: hsla(var(--blm-info-light-h), var(--blm-info-light-s), calc(var(--blm-info-light-l) - 5%), var(--blm-info-light-a));\n  border-color: transparent;\n  color: var(--blm-info-dark);\n}\n\n.button.is-success {\n  background-color: var(--blm-sucs);\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:hover, .button.is-success.is-hovered {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 2.5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:focus, .button.is-success.is-focused {\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success:focus:not(:active), .button.is-success.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n}\n\n.button.is-success:active, .button.is-success.is-active {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success[disabled],\nfieldset[disabled] .button.is-success {\n  background-color: var(--blm-sucs);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-success.is-inverted {\n  background-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted:hover, .button.is-success.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), calc(var(--blm-sucs-inv-l) - 5%), var(--blm-sucs-inv-a));\n}\n\n.button.is-success.is-inverted[disabled],\nfieldset[disabled] .button.is-success.is-inverted {\n  background-color: var(--blm-sucs-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-loading::after {\n  border-color: transparent transparent var(--blm-sucs-inv) var(--blm-sucs-inv) !important;\n}\n\n.button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-outlined:hover, .button.is-success.is-outlined.is-hovered, .button.is-success.is-outlined:focus, .button.is-success.is-outlined.is-focused {\n  background-color: var(--blm-sucs);\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-sucs) var(--blm-sucs) !important;\n}\n\n.button.is-success.is-outlined.is-loading:hover::after, .button.is-success.is-outlined.is-loading.is-hovered::after, .button.is-success.is-outlined.is-loading:focus::after, .button.is-success.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-sucs-inv) var(--blm-sucs-inv) !important;\n}\n\n.button.is-success.is-outlined[disabled],\nfieldset[disabled] .button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs);\n  box-shadow: none;\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-inverted.is-outlined:hover, .button.is-success.is-inverted.is-outlined.is-hovered, .button.is-success.is-inverted.is-outlined:focus, .button.is-success.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs);\n}\n\n.button.is-success.is-inverted.is-outlined.is-loading:hover::after, .button.is-success.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-success.is-inverted.is-outlined.is-loading:focus::after, .button.is-success.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-sucs) var(--blm-sucs) !important;\n}\n\n.button.is-success.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-sucs-inv);\n  box-shadow: none;\n  color: var(--blm-sucs-inv);\n}\n\n.button.is-success.is-light {\n  background-color: var(--blm-sucs-light);\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-success.is-light:hover, .button.is-success.is-light.is-hovered {\n  background-color: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), calc(var(--blm-sucs-light-l) - 2.5%), var(--blm-sucs-light-a));\n  border-color: transparent;\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-success.is-light:active, .button.is-success.is-light.is-active {\n  background-color: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), calc(var(--blm-sucs-light-l) - 5%), var(--blm-sucs-light-a));\n  border-color: transparent;\n  color: var(--blm-sucs-dark);\n}\n\n.button.is-warning {\n  background-color: var(--blm-warn);\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:hover, .button.is-warning.is-hovered {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 2.5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:focus, .button.is-warning.is-focused {\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning:focus:not(:active), .button.is-warning.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n}\n\n.button.is-warning:active, .button.is-warning.is-active {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning[disabled],\nfieldset[disabled] .button.is-warning {\n  background-color: var(--blm-warn);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-warning.is-inverted {\n  background-color: var(--blm-warn-inv);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted:hover, .button.is-warning.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), calc(var(--blm-warn-inv-l) - 5%), var(--blm-warn-inv-a));\n}\n\n.button.is-warning.is-inverted[disabled],\nfieldset[disabled] .button.is-warning.is-inverted {\n  background-color: var(--blm-warn-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-loading::after {\n  border-color: transparent transparent var(--blm-warn-inv) var(--blm-warn-inv) !important;\n}\n\n.button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-outlined:hover, .button.is-warning.is-outlined.is-hovered, .button.is-warning.is-outlined:focus, .button.is-warning.is-outlined.is-focused {\n  background-color: var(--blm-warn);\n  border-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-warn) var(--blm-warn) !important;\n}\n\n.button.is-warning.is-outlined.is-loading:hover::after, .button.is-warning.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-outlined.is-loading:focus::after, .button.is-warning.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-warn-inv) var(--blm-warn-inv) !important;\n}\n\n.button.is-warning.is-outlined[disabled],\nfieldset[disabled] .button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn);\n  box-shadow: none;\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn-inv);\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-inverted.is-outlined:hover, .button.is-warning.is-inverted.is-outlined.is-hovered, .button.is-warning.is-inverted.is-outlined:focus, .button.is-warning.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-warn-inv);\n  color: var(--blm-warn);\n}\n\n.button.is-warning.is-inverted.is-outlined.is-loading:hover::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-inverted.is-outlined.is-loading:focus::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-warn) var(--blm-warn) !important;\n}\n\n.button.is-warning.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-warn-inv);\n  box-shadow: none;\n  color: var(--blm-warn-inv);\n}\n\n.button.is-warning.is-light {\n  background-color: var(--blm-warn-light);\n  color: var(--blm-warn-dark);\n}\n\n.button.is-warning.is-light:hover, .button.is-warning.is-light.is-hovered {\n  background-color: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), calc(var(--blm-warn-light-l) - 2.5%), var(--blm-warn-light-a));\n  border-color: transparent;\n  color: var(--blm-warn-dark);\n}\n\n.button.is-warning.is-light:active, .button.is-warning.is-light.is-active {\n  background-color: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), calc(var(--blm-warn-light-l) - 5%), var(--blm-warn-light-a));\n  border-color: transparent;\n  color: var(--blm-warn-dark);\n}\n\n.button.is-danger {\n  background-color: var(--blm-dang);\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:hover, .button.is-danger.is-hovered {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 2.5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:focus, .button.is-danger.is-focused {\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger:focus:not(:active), .button.is-danger.is-focused:not(:active) {\n  box-shadow: var(--blm-bt-foc-box-shadow-s) hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n}\n\n.button.is-danger:active, .button.is-danger.is-active {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger[disabled],\nfieldset[disabled] .button.is-danger {\n  background-color: var(--blm-dang);\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-danger.is-inverted {\n  background-color: var(--blm-dang-inv);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted:hover, .button.is-danger.is-inverted.is-hovered {\n  background-color: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), calc(var(--blm-dang-inv-l) - 5%), var(--blm-dang-inv-a));\n}\n\n.button.is-danger.is-inverted[disabled],\nfieldset[disabled] .button.is-danger.is-inverted {\n  background-color: var(--blm-dang-inv);\n  border-color: transparent;\n  box-shadow: none;\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-loading::after {\n  border-color: transparent transparent var(--blm-dang-inv) var(--blm-dang-inv) !important;\n}\n\n.button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-outlined:hover, .button.is-danger.is-outlined.is-hovered, .button.is-danger.is-outlined:focus, .button.is-danger.is-outlined.is-focused {\n  background-color: var(--blm-dang);\n  border-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-outlined.is-loading::after {\n  border-color: transparent transparent var(--blm-dang) var(--blm-dang) !important;\n}\n\n.button.is-danger.is-outlined.is-loading:hover::after, .button.is-danger.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-outlined.is-loading:focus::after, .button.is-danger.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dang-inv) var(--blm-dang-inv) !important;\n}\n\n.button.is-danger.is-outlined[disabled],\nfieldset[disabled] .button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang);\n  box-shadow: none;\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang-inv);\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-inverted.is-outlined:hover, .button.is-danger.is-inverted.is-outlined.is-hovered, .button.is-danger.is-inverted.is-outlined:focus, .button.is-danger.is-inverted.is-outlined.is-focused {\n  background-color: var(--blm-dang-inv);\n  color: var(--blm-dang);\n}\n\n.button.is-danger.is-inverted.is-outlined.is-loading:hover::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-inverted.is-outlined.is-loading:focus::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent var(--blm-dang) var(--blm-dang) !important;\n}\n\n.button.is-danger.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: var(--blm-dang-inv);\n  box-shadow: none;\n  color: var(--blm-dang-inv);\n}\n\n.button.is-danger.is-light {\n  background-color: var(--blm-dang-light);\n  color: var(--blm-dang-dark);\n}\n\n.button.is-danger.is-light:hover, .button.is-danger.is-light.is-hovered {\n  background-color: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), calc(var(--blm-dang-light-l) - 2.5%), var(--blm-dang-light-a));\n  border-color: transparent;\n  color: var(--blm-dang-dark);\n}\n\n.button.is-danger.is-light:active, .button.is-danger.is-light.is-active {\n  background-color: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), calc(var(--blm-dang-light-l) - 5%), var(--blm-dang-light-a));\n  border-color: transparent;\n  color: var(--blm-dang-dark);\n}\n\n.button.is-small {\n  border-radius: var(--blm-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.button.is-normal {\n  font-size: var(--blm-s-normal);\n}\n\n.button.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.button.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.button[disabled],\nfieldset[disabled] .button {\n  background-color: var(--blm-bt-dsbl-bg-clr);\n  border-color: var(--blm-bt-dsbl-bd-clr);\n  box-shadow: var(--blm-bt-dsbl-shadow);\n  opacity: var(--blm-bt-dsbl-opacity);\n}\n\n.button.is-fullwidth {\n  display: flex;\n  width: 100%;\n}\n\n.button.is-loading {\n  color: transparent !important;\n  pointer-events: none;\n}\n\n.button.is-loading::after {\n  position: absolute;\n  left: calc(50% - 0.5em);\n  top: calc(50% - 0.5em);\n  position: absolute !important;\n}\n\n.button.is-static {\n  background-color: var(--blm-bt-static-bg-clr);\n  border-color: var(--blm-bt-static-bd-clr);\n  color: var(--blm-bt-static-clr);\n  box-shadow: none;\n  pointer-events: none;\n}\n\n.button.is-rounded {\n  border-radius: var(--blm-radius-rounded);\n  padding-left: calc(var(--blm-bt-p-horizontal) + 0.25em);\n  padding-right: 1.25em;\n}\n\n.buttons {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.buttons .button {\n  margin-bottom: 0.5rem;\n}\n\n.buttons .button:not(:last-child):not(.is-fullwidth) {\n  margin-right: 0.5rem;\n}\n\n.buttons:last-child {\n  margin-bottom: -0.5rem;\n}\n\n.buttons:not(:last-child) {\n  margin-bottom: 1rem;\n}\n\n.buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large) {\n  border-radius: var(--blm-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.buttons.are-medium .button:not(.is-small):not(.is-normal):not(.is-large) {\n  font-size: var(--blm-s-medium);\n}\n\n.buttons.are-large .button:not(.is-small):not(.is-normal):not(.is-medium) {\n  font-size: var(--blm-s-lg);\n}\n\n.buttons.has-addons .button:not(:first-child) {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.buttons.has-addons .button:not(:last-child) {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n  margin-right: -1px;\n}\n\n.buttons.has-addons .button:last-child {\n  margin-right: 0;\n}\n\n.buttons.has-addons .button:hover, .buttons.has-addons .button.is-hovered {\n  z-index: 2;\n}\n\n.buttons.has-addons .button:focus, .buttons.has-addons .button.is-focused, .buttons.has-addons .button:active, .buttons.has-addons .button.is-active, .buttons.has-addons .button.is-selected {\n  z-index: 3;\n}\n\n.buttons.has-addons .button:focus:hover, .buttons.has-addons .button.is-focused:hover, .buttons.has-addons .button:active:hover, .buttons.has-addons .button.is-active:hover, .buttons.has-addons .button.is-selected:hover {\n  z-index: 4;\n}\n\n.buttons.has-addons .button.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.buttons.is-centered {\n  justify-content: center;\n}\n\n.buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.buttons.is-right {\n  justify-content: flex-end;\n}\n\n.buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.container {\n  flex-grow: 1;\n  margin: 0 auto;\n  position: relative;\n  width: auto;\n}\n\n@media screen and (min-width: 1024px) {\n  .container {\n    max-width: 960px;\n  }\n  .container.is-fluid {\n    margin-left: 32px;\n    margin-right: 32px;\n    max-width: none;\n  }\n}\n\n.container.is-fluid {\n  margin-left: 32px;\n  margin-right: 32px;\n  max-width: none;\n  width: auto;\n}\n\n@media screen and (min-width: 1024px) {\n  .container {\n    max-width: 960px;\n  }\n}\n\n@media screen and (max-width: 1215px) {\n  .container.is-widescreen {\n    max-width: 1152px;\n  }\n}\n\n@media screen and (max-width: 1407px) {\n  .container.is-fullhd {\n    max-width: 1344px;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .container {\n    max-width: 1152px;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .container {\n    max-width: 1344px;\n  }\n}\n\n.content li + li {\n  margin-top: 0.25em;\n}\n\n.content p:not(:last-child),\n.content dl:not(:last-child),\n.content ol:not(:last-child),\n.content ul:not(:last-child),\n.content blockquote:not(:last-child),\n.content pre:not(:last-child),\n.content table:not(:last-child) {\n  margin-bottom: 1em;\n}\n\n.content h1,\n.content h2,\n.content h3,\n.content h4,\n.content h5,\n.content h6 {\n  color: var(--blm-ct-hdg-clr);\n  font-weight: var(--blm-ct-hdg-weight);\n  line-height: var(--blm-ct-hdg-line-height);\n}\n\n.content h1 {\n  font-size: 2em;\n  margin-bottom: 0.5em;\n}\n\n.content h1:not(:first-child) {\n  margin-top: 1em;\n}\n\n.content h2 {\n  font-size: 1.75em;\n  margin-bottom: 0.5714em;\n}\n\n.content h2:not(:first-child) {\n  margin-top: 1.1428em;\n}\n\n.content h3 {\n  font-size: 1.5em;\n  margin-bottom: 0.6666em;\n}\n\n.content h3:not(:first-child) {\n  margin-top: 1.3333em;\n}\n\n.content h4 {\n  font-size: 1.25em;\n  margin-bottom: 0.8em;\n}\n\n.content h5 {\n  font-size: 1.125em;\n  margin-bottom: 0.8888em;\n}\n\n.content h6 {\n  font-size: 1em;\n  margin-bottom: 1em;\n}\n\n.content blockquote {\n  background-color: var(--blm-ct-blockquote-bg-clr);\n  border-left: var(--blm-ct-blockquote-bd-left);\n  padding: var(--blm-ct-blockquote-p);\n}\n\n.content ol {\n  list-style-position: outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ol:not([type]) {\n  list-style-type: decimal;\n}\n\n.content ol:not([type]).is-lower-alpha {\n  list-style-type: lower-alpha;\n}\n\n.content ol:not([type]).is-lower-roman {\n  list-style-type: lower-roman;\n}\n\n.content ol:not([type]).is-upper-alpha {\n  list-style-type: upper-alpha;\n}\n\n.content ol:not([type]).is-upper-roman {\n  list-style-type: upper-roman;\n}\n\n.content ul {\n  list-style: disc outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ul ul {\n  list-style-type: circle;\n  margin-top: 0.5em;\n}\n\n.content ul ul ul {\n  list-style-type: square;\n}\n\n.content dd {\n  margin-left: 2em;\n}\n\n.content figure {\n  margin-left: 2em;\n  margin-right: 2em;\n  text-align: center;\n}\n\n.content figure:not(:first-child) {\n  margin-top: 2em;\n}\n\n.content figure:not(:last-child) {\n  margin-bottom: 2em;\n}\n\n.content figure img {\n  display: inline-block;\n}\n\n.content figure figcaption {\n  font-style: italic;\n}\n\n.content pre {\n  -webkit-overflow-scrolling: touch;\n  overflow-x: auto;\n  padding: var(--blm-ct-pre-p);\n  white-space: pre;\n  word-wrap: normal;\n}\n\n.content sup,\n.content sub {\n  font-size: 75%;\n}\n\n.content table {\n  width: 100%;\n}\n\n.content table td,\n.content table th {\n  border: var(--blm-ct-table-cell-bd);\n  border-width: var(--blm-ct-table-cell-bd-width);\n  padding: var(--blm-ct-table-cell-p);\n  vertical-align: top;\n}\n\n.content table th {\n  color: var(--blm-ct-table-cell-hdg-clr);\n}\n\n.content table th:not([align]) {\n  text-align: inherit;\n}\n\n.content table thead td,\n.content table thead th {\n  border-width: var(--blm-ct-table-head-cell-bd-width);\n  color: var(--blm-ct-table-head-cell-clr);\n}\n\n.content table tfoot td,\n.content table tfoot th {\n  border-width: var(--blm-ct-table-foot-cell-bd-width);\n  color: var(--blm-ct-table-foot-cell-clr);\n}\n\n.content table tbody tr:last-child td,\n.content table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.content .tabs li + li {\n  margin-top: 0;\n}\n\n.content.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.content.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.content.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.icon {\n  align-items: center;\n  display: inline-flex;\n  justify-content: center;\n  height: var(--blm-icon-dim);\n  width: var(--blm-icon-dim);\n}\n\n.icon.is-small {\n  height: var(--blm-icon-dim-small);\n  width: var(--blm-icon-dim-small);\n}\n\n.icon.is-medium {\n  height: var(--blm-icon-dim-medium);\n  width: var(--blm-icon-dim-medium);\n}\n\n.icon.is-large {\n  height: var(--blm-icon-dim-lg);\n  width: var(--blm-icon-dim-lg);\n}\n\n.image {\n  display: block;\n  position: relative;\n}\n\n.image img {\n  display: block;\n  height: auto;\n  width: 100%;\n}\n\n.image img.is-rounded {\n  border-radius: var(--blm-radius-rounded);\n}\n\n.image.is-fullwidth {\n  width: 100%;\n}\n\n.image.is-square img,\n.image.is-square .has-ratio, .image.is-1by1 img,\n.image.is-1by1 .has-ratio, .image.is-5by4 img,\n.image.is-5by4 .has-ratio, .image.is-4by3 img,\n.image.is-4by3 .has-ratio, .image.is-3by2 img,\n.image.is-3by2 .has-ratio, .image.is-5by3 img,\n.image.is-5by3 .has-ratio, .image.is-16by9 img,\n.image.is-16by9 .has-ratio, .image.is-2by1 img,\n.image.is-2by1 .has-ratio, .image.is-3by1 img,\n.image.is-3by1 .has-ratio, .image.is-4by5 img,\n.image.is-4by5 .has-ratio, .image.is-3by4 img,\n.image.is-3by4 .has-ratio, .image.is-2by3 img,\n.image.is-2by3 .has-ratio, .image.is-3by5 img,\n.image.is-3by5 .has-ratio, .image.is-9by16 img,\n.image.is-9by16 .has-ratio, .image.is-1by2 img,\n.image.is-1by2 .has-ratio, .image.is-1by3 img,\n.image.is-1by3 .has-ratio {\n  height: 100%;\n  width: 100%;\n}\n\n.image.is-square, .image.is-1by1 {\n  padding-top: 100%;\n}\n\n.image.is-5by4 {\n  padding-top: 80%;\n}\n\n.image.is-4by3 {\n  padding-top: 75%;\n}\n\n.image.is-3by2 {\n  padding-top: 66.6666%;\n}\n\n.image.is-5by3 {\n  padding-top: 60%;\n}\n\n.image.is-16by9 {\n  padding-top: 56.25%;\n}\n\n.image.is-2by1 {\n  padding-top: 50%;\n}\n\n.image.is-3by1 {\n  padding-top: 33.3333%;\n}\n\n.image.is-4by5 {\n  padding-top: 125%;\n}\n\n.image.is-3by4 {\n  padding-top: 133.3333%;\n}\n\n.image.is-2by3 {\n  padding-top: 150%;\n}\n\n.image.is-3by5 {\n  padding-top: 166.6666%;\n}\n\n.image.is-9by16 {\n  padding-top: 177.7777%;\n}\n\n.image.is-1by2 {\n  padding-top: 200%;\n}\n\n.image.is-1by3 {\n  padding-top: 300%;\n}\n\n.image.is-16x16 {\n  height: 16px;\n  width: 16px;\n}\n\n.image.is-24x24 {\n  height: 24px;\n  width: 24px;\n}\n\n.image.is-32x32 {\n  height: 32px;\n  width: 32px;\n}\n\n.image.is-48x48 {\n  height: 48px;\n  width: 48px;\n}\n\n.image.is-64x64 {\n  height: 64px;\n  width: 64px;\n}\n\n.image.is-96x96 {\n  height: 96px;\n  width: 96px;\n}\n\n.image.is-128x128 {\n  height: 128px;\n  width: 128px;\n}\n\n.notification {\n  background-color: var(--blm-noti-bg-clr);\n  border-radius: var(--blm-noti-radius);\n  position: relative;\n  padding: var(--blm-noti-p-vertical) var(--blm-noti-p-right) var(--blm-noti-p-vertical) var(--blm-noti-p-left);\n}\n\n.notification a:not(.button):not(.dropdown-item) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.notification strong {\n  color: currentColor;\n}\n\n.notification code,\n.notification pre {\n  background: var(--blm-noti-code-bg-clr);\n}\n\n.notification pre code {\n  background: transparent;\n}\n\n.notification > .delete {\n  right: 0.5rem;\n  position: absolute;\n  top: 0.5rem;\n}\n\n.notification .title,\n.notification .subtitle,\n.notification .content {\n  color: currentColor;\n}\n\n.notification.is-white {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.notification.is-black {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.notification.is-light {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.notification.is-dark {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.notification.is-primary {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.notification.is-primary.is-light {\n  background-color: var(--blm-prim-light);\n  color: var(--blm-prim-dark);\n}\n\n.notification.is-link {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.notification.is-link.is-light {\n  background-color: var(--blm-link-light);\n  color: var(--blm-link-dark);\n}\n\n.notification.is-info {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.notification.is-info.is-light {\n  background-color: var(--blm-info-light);\n  color: var(--blm-info-dark);\n}\n\n.notification.is-success {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.notification.is-success.is-light {\n  background-color: var(--blm-sucs-light);\n  color: var(--blm-sucs-dark);\n}\n\n.notification.is-warning {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.notification.is-warning.is-light {\n  background-color: var(--blm-warn-light);\n  color: var(--blm-warn-dark);\n}\n\n.notification.is-danger {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.notification.is-danger.is-light {\n  background-color: var(--blm-dang-light);\n  color: var(--blm-dang-dark);\n}\n\n.progress {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  border: none;\n  border-radius: var(--blm-prg-bd-radius);\n  display: block;\n  height: var(--blm-s-normal);\n  overflow: hidden;\n  padding: 0;\n  width: 100%;\n}\n\n.progress::-webkit-progress-bar {\n  background-color: var(--blm-prg-bar-bg-clr);\n}\n\n.progress::-webkit-progress-value {\n  background-color: var(--blm-prg-value-bg-clr);\n}\n\n.progress::-moz-progress-bar {\n  background-color: var(--blm-prg-value-bg-clr);\n}\n\n.progress::-ms-fill {\n  background-color: var(--blm-prg-value-bg-clr);\n  border: none;\n}\n\n.progress.is-white::-webkit-progress-value {\n  background-color: var(--blm-white);\n}\n\n.progress.is-white::-moz-progress-bar {\n  background-color: var(--blm-white);\n}\n\n.progress.is-white::-ms-fill {\n  background-color: var(--blm-white);\n}\n\n.progress.is-white:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-white) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-black::-webkit-progress-value {\n  background-color: var(--blm-black);\n}\n\n.progress.is-black::-moz-progress-bar {\n  background-color: var(--blm-black);\n}\n\n.progress.is-black::-ms-fill {\n  background-color: var(--blm-black);\n}\n\n.progress.is-black:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-black) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-light::-webkit-progress-value {\n  background-color: var(--blm-light);\n}\n\n.progress.is-light::-moz-progress-bar {\n  background-color: var(--blm-light);\n}\n\n.progress.is-light::-ms-fill {\n  background-color: var(--blm-light);\n}\n\n.progress.is-light:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-light) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-dark::-webkit-progress-value {\n  background-color: var(--blm-dark);\n}\n\n.progress.is-dark::-moz-progress-bar {\n  background-color: var(--blm-dark);\n}\n\n.progress.is-dark::-ms-fill {\n  background-color: var(--blm-dark);\n}\n\n.progress.is-dark:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-dark) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-primary::-webkit-progress-value {\n  background-color: var(--blm-prim);\n}\n\n.progress.is-primary::-moz-progress-bar {\n  background-color: var(--blm-prim);\n}\n\n.progress.is-primary::-ms-fill {\n  background-color: var(--blm-prim);\n}\n\n.progress.is-primary:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-prim) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-link::-webkit-progress-value {\n  background-color: var(--blm-link);\n}\n\n.progress.is-link::-moz-progress-bar {\n  background-color: var(--blm-link);\n}\n\n.progress.is-link::-ms-fill {\n  background-color: var(--blm-link);\n}\n\n.progress.is-link:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-link) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-info::-webkit-progress-value {\n  background-color: var(--blm-info);\n}\n\n.progress.is-info::-moz-progress-bar {\n  background-color: var(--blm-info);\n}\n\n.progress.is-info::-ms-fill {\n  background-color: var(--blm-info);\n}\n\n.progress.is-info:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-info) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-success::-webkit-progress-value {\n  background-color: var(--blm-sucs);\n}\n\n.progress.is-success::-moz-progress-bar {\n  background-color: var(--blm-sucs);\n}\n\n.progress.is-success::-ms-fill {\n  background-color: var(--blm-sucs);\n}\n\n.progress.is-success:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-sucs) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-warning::-webkit-progress-value {\n  background-color: var(--blm-warn);\n}\n\n.progress.is-warning::-moz-progress-bar {\n  background-color: var(--blm-warn);\n}\n\n.progress.is-warning::-ms-fill {\n  background-color: var(--blm-warn);\n}\n\n.progress.is-warning:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-warn) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress.is-danger::-webkit-progress-value {\n  background-color: var(--blm-dang);\n}\n\n.progress.is-danger::-moz-progress-bar {\n  background-color: var(--blm-dang);\n}\n\n.progress.is-danger::-ms-fill {\n  background-color: var(--blm-dang);\n}\n\n.progress.is-danger:indeterminate {\n  background-image: linear-gradient(to right, var(--blm-dang) 30%, var(--blm-prg-bar-bg-clr) 30%);\n}\n\n.progress:indeterminate {\n  -webkit-animation-duration: var(--blm-prg-indeterminate-duration);\n          animation-duration: var(--blm-prg-indeterminate-duration);\n  -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n  -webkit-animation-name: moveIndeterminate;\n          animation-name: moveIndeterminate;\n  -webkit-animation-timing-function: linear;\n          animation-timing-function: linear;\n  background-color: var(--blm-prg-bar-bg-clr);\n  background-image: linear-gradient(to right, var(--blm-txt) 30%, var(--blm-prg-bar-bg-clr) 30%);\n  background-position: top left;\n  background-repeat: no-repeat;\n  background-size: 150% 150%;\n}\n\n.progress:indeterminate::-webkit-progress-bar {\n  background-color: transparent;\n}\n\n.progress:indeterminate::-moz-progress-bar {\n  background-color: transparent;\n}\n\n.progress.is-small {\n  height: var(--blm-s-small);\n}\n\n.progress.is-medium {\n  height: var(--blm-s-medium);\n}\n\n.progress.is-large {\n  height: var(--blm-s-lg);\n}\n\n@-webkit-keyframes moveIndeterminate {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}\n\n@keyframes moveIndeterminate {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}\n\n.table {\n  background-color: var(--blm-table-bg-clr);\n  color: var(--blm-table-clr);\n}\n\n.table td,\n.table th {\n  border: var(--blm-table-cell-bd);\n  border-width: var(--blm-table-cell-bd-width);\n  padding: var(--blm-table-cell-p);\n  vertical-align: top;\n}\n\n.table td.is-white,\n.table th.is-white {\n  background-color: var(--blm-white);\n  border-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.table td.is-black,\n.table th.is-black {\n  background-color: var(--blm-black);\n  border-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.table td.is-light,\n.table th.is-light {\n  background-color: var(--blm-light);\n  border-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.table td.is-dark,\n.table th.is-dark {\n  background-color: var(--blm-dark);\n  border-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.table td.is-primary,\n.table th.is-primary {\n  background-color: var(--blm-prim);\n  border-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.table td.is-link,\n.table th.is-link {\n  background-color: var(--blm-link);\n  border-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.table td.is-info,\n.table th.is-info {\n  background-color: var(--blm-info);\n  border-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.table td.is-success,\n.table th.is-success {\n  background-color: var(--blm-sucs);\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.table td.is-warning,\n.table th.is-warning {\n  background-color: var(--blm-warn);\n  border-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.table td.is-danger,\n.table th.is-danger {\n  background-color: var(--blm-dang);\n  border-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.table td.is-narrow,\n.table th.is-narrow {\n  white-space: nowrap;\n  width: 1%;\n}\n\n.table td.is-selected,\n.table th.is-selected {\n  background-color: var(--blm-table-row-act-bg-clr);\n  color: var(--blm-table-row-act-clr);\n}\n\n.table td.is-selected a,\n.table td.is-selected strong,\n.table th.is-selected a,\n.table th.is-selected strong {\n  color: currentColor;\n}\n\n.table td.is-vcentered,\n.table th.is-vcentered {\n  vertical-align: middle;\n}\n\n.table th {\n  color: var(--blm-table-cell-hdg-clr);\n}\n\n.table th:not([align]) {\n  text-align: inherit;\n}\n\n.table tr.is-selected {\n  background-color: var(--blm-table-row-act-bg-clr);\n  color: var(--blm-table-row-act-clr);\n}\n\n.table tr.is-selected a,\n.table tr.is-selected strong {\n  color: currentColor;\n}\n\n.table tr.is-selected td,\n.table tr.is-selected th {\n  border-color: var(--blm-table-row-act-clr);\n  color: currentColor;\n}\n\n.table thead {\n  background-color: var(--blm-table-head-bg-clr);\n}\n\n.table thead td,\n.table thead th {\n  border-width: var(--blm-table-head-cell-bd-width);\n  color: var(--blm-table-head-cell-clr);\n}\n\n.table tfoot {\n  background-color: var(--blm-table-foot-bg-clr);\n}\n\n.table tfoot td,\n.table tfoot th {\n  border-width: var(--blm-table-foot-cell-bd-width);\n  color: var(--blm-table-foot-cell-clr);\n}\n\n.table tbody {\n  background-color: var(--blm-table-body-bg-clr);\n}\n\n.table tbody tr:last-child td,\n.table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.table.is-bordered td,\n.table.is-bordered th {\n  border-width: 1px;\n}\n\n.table.is-bordered tr:last-child td,\n.table.is-bordered tr:last-child th {\n  border-bottom-width: 1px;\n}\n\n.table.is-fullwidth {\n  width: 100%;\n}\n\n.table.is-hoverable tbody tr:not(.is-selected):hover {\n  background-color: var(--blm-table-row-hov-bg-clr);\n}\n\n.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover {\n  background-color: var(--blm-table-row-hov-bg-clr);\n}\n\n.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover:nth-child(even) {\n  background-color: var(--blm-table-striped-row-even-hov-bg-clr);\n}\n\n.table.is-narrow td,\n.table.is-narrow th {\n  padding: 0.25em 0.5em;\n}\n\n.table.is-striped tbody tr:not(.is-selected):nth-child(even) {\n  background-color: var(--blm-table-striped-row-even-bg-clr);\n}\n\n.table-container {\n  -webkit-overflow-scrolling: touch;\n  overflow: auto;\n  overflow-y: hidden;\n  max-width: 100%;\n}\n\n.tags {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.tags .tag {\n  margin-bottom: 0.5rem;\n}\n\n.tags .tag:not(:last-child) {\n  margin-right: 0.5rem;\n}\n\n.tags:last-child {\n  margin-bottom: -0.5rem;\n}\n\n.tags:not(:last-child) {\n  margin-bottom: 1rem;\n}\n\n.tags.are-medium .tag:not(.is-normal):not(.is-large) {\n  font-size: var(--blm-s-normal);\n}\n\n.tags.are-large .tag:not(.is-normal):not(.is-medium) {\n  font-size: var(--blm-s-medium);\n}\n\n.tags.is-centered {\n  justify-content: center;\n}\n\n.tags.is-centered .tag {\n  margin-right: 0.25rem;\n  margin-left: 0.25rem;\n}\n\n.tags.is-right {\n  justify-content: flex-end;\n}\n\n.tags.is-right .tag:not(:first-child) {\n  margin-left: 0.5rem;\n}\n\n.tags.is-right .tag:not(:last-child) {\n  margin-right: 0;\n}\n\n.tags.has-addons .tag {\n  margin-right: 0;\n}\n\n.tags.has-addons .tag:not(:first-child) {\n  margin-left: 0;\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n\n.tags.has-addons .tag:not(:last-child) {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n\n.tag:not(body) {\n  align-items: center;\n  background-color: var(--blm-tag-bg-clr);\n  border-radius: var(--blm-tag-radius);\n  color: var(--blm-tag-clr);\n  display: inline-flex;\n  font-size: var(--blm-s-small);\n  height: 2em;\n  justify-content: center;\n  line-height: 1.5;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  white-space: nowrap;\n}\n\n.tag:not(body) .delete {\n  margin-left: 0.25rem;\n  margin-right: -0.375rem;\n}\n\n.tag:not(body).is-white {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.tag:not(body).is-black {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.tag:not(body).is-light {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.tag:not(body).is-dark {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.tag:not(body).is-primary {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.tag:not(body).is-primary.is-light {\n  background-color: var(--blm-prim-light);\n  color: var(--blm-prim-dark);\n}\n\n.tag:not(body).is-link {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.tag:not(body).is-link.is-light {\n  background-color: var(--blm-link-light);\n  color: var(--blm-link-dark);\n}\n\n.tag:not(body).is-info {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.tag:not(body).is-info.is-light {\n  background-color: var(--blm-info-light);\n  color: var(--blm-info-dark);\n}\n\n.tag:not(body).is-success {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.tag:not(body).is-success.is-light {\n  background-color: var(--blm-sucs-light);\n  color: var(--blm-sucs-dark);\n}\n\n.tag:not(body).is-warning {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.tag:not(body).is-warning.is-light {\n  background-color: var(--blm-warn-light);\n  color: var(--blm-warn-dark);\n}\n\n.tag:not(body).is-danger {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.tag:not(body).is-danger.is-light {\n  background-color: var(--blm-dang-light);\n  color: var(--blm-dang-dark);\n}\n\n.tag:not(body).is-normal {\n  font-size: var(--blm-s-small);\n}\n\n.tag:not(body).is-medium {\n  font-size: var(--blm-s-normal);\n}\n\n.tag:not(body).is-large {\n  font-size: var(--blm-s-medium);\n}\n\n.tag:not(body) .icon:first-child:not(:last-child) {\n  margin-left: -0.375em;\n  margin-right: 0.1875em;\n}\n\n.tag:not(body) .icon:last-child:not(:first-child) {\n  margin-left: 0.1875em;\n  margin-right: -0.375em;\n}\n\n.tag:not(body) .icon:first-child:last-child {\n  margin-left: -0.375em;\n  margin-right: -0.375em;\n}\n\n.tag:not(body).is-delete {\n  margin-left: var(--blm-tag-delete-m);\n  padding: 0;\n  position: relative;\n  width: 2em;\n}\n\n.tag:not(body).is-delete::before, .tag:not(body).is-delete::after {\n  background-color: currentColor;\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\n\n.tag:not(body).is-delete::before {\n  height: 1px;\n  width: 50%;\n}\n\n.tag:not(body).is-delete::after {\n  height: 50%;\n  width: 1px;\n}\n\n.tag:not(body).is-delete:hover, .tag:not(body).is-delete:focus {\n  background-color: hsla(var(--blm-tag-bg-clr-h), var(--blm-tag-bg-clr-s), calc(var(--blm-tag-bg-clr-l) - 5%), var(--blm-tag-bg-clr-a));\n}\n\n.tag:not(body).is-delete:active {\n  background-color: hsla(var(--blm-tag-bg-clr-h), var(--blm-tag-bg-clr-s), calc(var(--blm-tag-bg-clr-l) - 10%), var(--blm-tag-bg-clr-a));\n}\n\n.tag:not(body).is-rounded {\n  border-radius: var(--blm-radius-rounded);\n}\n\na.tag:hover {\n  text-decoration: underline;\n}\n\n.title,\n.subtitle {\n  word-break: break-word;\n}\n\n.title em,\n.title span,\n.subtitle em,\n.subtitle span {\n  font-weight: inherit;\n}\n\n.title sub,\n.subtitle sub {\n  font-size: var(--blm-title-sub-s);\n}\n\n.title sup,\n.subtitle sup {\n  font-size: var(--blm-title-sup-s);\n}\n\n.title .tag,\n.subtitle .tag {\n  vertical-align: middle;\n}\n\n.title {\n  color: var(--blm-title-clr);\n  font-family: var(--blm-title-family);\n  font-size: var(--blm-title-s);\n  font-weight: var(--blm-title-weight);\n  line-height: var(--blm-title-line-height);\n}\n\n.title strong {\n  color: var(--blm-title-strong-clr);\n  font-weight: var(--blm-title-strong-weight);\n}\n\n.title + .highlight {\n  margin-top: -0.75rem;\n}\n\n.title:not(.is-spaced) + .subtitle {\n  margin-top: var(--blm-subtitle-negative-m);\n}\n\n.title.is-1 {\n  font-size: var(--blm-s-1);\n}\n\n.title.is-2 {\n  font-size: var(--blm-s-2);\n}\n\n.title.is-3 {\n  font-size: var(--blm-s-3);\n}\n\n.title.is-4 {\n  font-size: var(--blm-s-4);\n}\n\n.title.is-5 {\n  font-size: var(--blm-s-5);\n}\n\n.title.is-6 {\n  font-size: var(--blm-s-6);\n}\n\n.title.is-7 {\n  font-size: var(--blm-s-7);\n}\n\n.subtitle {\n  color: var(--blm-subtitle-clr);\n  font-family: var(--blm-subtitle-family);\n  font-size: var(--blm-subtitle-s);\n  font-weight: var(--blm-subtitle-weight);\n  line-height: var(--blm-subtitle-line-height);\n}\n\n.subtitle strong {\n  color: var(--blm-subtitle-strong-clr);\n  font-weight: var(--blm-subtitle-strong-weight);\n}\n\n.subtitle:not(.is-spaced) + .title {\n  margin-top: var(--blm-subtitle-negative-m);\n}\n\n.subtitle.is-1 {\n  font-size: var(--blm-s-1);\n}\n\n.subtitle.is-2 {\n  font-size: var(--blm-s-2);\n}\n\n.subtitle.is-3 {\n  font-size: var(--blm-s-3);\n}\n\n.subtitle.is-4 {\n  font-size: var(--blm-s-4);\n}\n\n.subtitle.is-5 {\n  font-size: var(--blm-s-5);\n}\n\n.subtitle.is-6 {\n  font-size: var(--blm-s-6);\n}\n\n.subtitle.is-7 {\n  font-size: var(--blm-s-7);\n}\n\n.heading {\n  display: block;\n  font-size: 11px;\n  letter-spacing: 1px;\n  margin-bottom: 5px;\n  text-transform: uppercase;\n}\n\n.highlight {\n  font-weight: var(--blm-weight-normal);\n  max-width: 100%;\n  overflow: hidden;\n  padding: 0;\n}\n\n.highlight pre {\n  overflow: auto;\n  max-width: 100%;\n}\n\n.number {\n  align-items: center;\n  background-color: var(--blm-bg);\n  border-radius: var(--blm-radius-rounded);\n  display: inline-flex;\n  font-size: var(--blm-s-medium);\n  height: 2em;\n  justify-content: center;\n  margin-right: 1.5rem;\n  min-width: 2.5em;\n  padding: 0.25rem 0.5rem;\n  text-align: center;\n  vertical-align: top;\n}\n\n.input, .textarea, .select select {\n  background-color: var(--blm-input-bg-clr);\n  border-color: var(--blm-input-bd-clr);\n  border-radius: var(--blm-input-radius);\n  color: var(--blm-input-clr);\n}\n\n.input::-moz-placeholder, .textarea::-moz-placeholder, .select select::-moz-placeholder {\n  color: var(--blm-input-placeholder-clr);\n}\n\n.input::-webkit-input-placeholder, .textarea::-webkit-input-placeholder, .select select::-webkit-input-placeholder {\n  color: var(--blm-input-placeholder-clr);\n}\n\n.input:-moz-placeholder, .textarea:-moz-placeholder, .select select:-moz-placeholder {\n  color: var(--blm-input-placeholder-clr);\n}\n\n.input:-ms-input-placeholder, .textarea:-ms-input-placeholder, .select select:-ms-input-placeholder {\n  color: var(--blm-input-placeholder-clr);\n}\n\n.input:hover, .textarea:hover, .select select:hover, .is-hovered.input, .is-hovered.textarea, .select select.is-hovered {\n  border-color: var(--blm-input-hov-bd-clr);\n}\n\n.input:focus, .textarea:focus, .select select:focus, .is-focused.input, .is-focused.textarea, .select select.is-focused, .input:active, .textarea:active, .select select:active, .is-active.input, .is-active.textarea, .select select.is-active {\n  border-color: var(--blm-input-foc-bd-clr);\n  box-shadow: var(--blm-input-foc-box-shadow-s) var(--blm-input-foc-box-shadow-clr);\n}\n\n.input[disabled], .textarea[disabled], .select select[disabled],\nfieldset[disabled] .input,\nfieldset[disabled] .textarea,\nfieldset[disabled] .select select,\n.select fieldset[disabled] select {\n  background-color: var(--blm-input-dsbl-bg-clr);\n  border-color: var(--blm-input-dsbl-bd-clr);\n  box-shadow: none;\n  color: var(--blm-input-dsbl-clr);\n}\n\n.input[disabled]::-moz-placeholder, .textarea[disabled]::-moz-placeholder, .select select[disabled]::-moz-placeholder,\nfieldset[disabled] .input::-moz-placeholder,\nfieldset[disabled] .textarea::-moz-placeholder,\nfieldset[disabled] .select select::-moz-placeholder,\n.select fieldset[disabled] select::-moz-placeholder {\n  color: var(--blm-input-dsbl-placeholder-clr);\n}\n\n.input[disabled]::-webkit-input-placeholder, .textarea[disabled]::-webkit-input-placeholder, .select select[disabled]::-webkit-input-placeholder,\nfieldset[disabled] .input::-webkit-input-placeholder,\nfieldset[disabled] .textarea::-webkit-input-placeholder,\nfieldset[disabled] .select select::-webkit-input-placeholder,\n.select fieldset[disabled] select::-webkit-input-placeholder {\n  color: var(--blm-input-dsbl-placeholder-clr);\n}\n\n.input[disabled]:-moz-placeholder, .textarea[disabled]:-moz-placeholder, .select select[disabled]:-moz-placeholder,\nfieldset[disabled] .input:-moz-placeholder,\nfieldset[disabled] .textarea:-moz-placeholder,\nfieldset[disabled] .select select:-moz-placeholder,\n.select fieldset[disabled] select:-moz-placeholder {\n  color: var(--blm-input-dsbl-placeholder-clr);\n}\n\n.input[disabled]:-ms-input-placeholder, .textarea[disabled]:-ms-input-placeholder, .select select[disabled]:-ms-input-placeholder,\nfieldset[disabled] .input:-ms-input-placeholder,\nfieldset[disabled] .textarea:-ms-input-placeholder,\nfieldset[disabled] .select select:-ms-input-placeholder,\n.select fieldset[disabled] select:-ms-input-placeholder {\n  color: var(--blm-input-dsbl-placeholder-clr);\n}\n\n.input, .textarea {\n  box-shadow: var(--blm-input-shadow);\n  max-width: 100%;\n  width: 100%;\n}\n\n.input[readonly], .textarea[readonly] {\n  box-shadow: none;\n}\n\n.is-white.input, .is-white.textarea {\n  border-color: var(--blm-white);\n}\n\n.is-white.input:focus, .is-white.textarea:focus, .is-white.is-focused.input, .is-white.is-focused.textarea, .is-white.input:active, .is-white.textarea:active, .is-white.is-active.input, .is-white.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), 0.25);\n}\n\n.is-black.input, .is-black.textarea {\n  border-color: var(--blm-black);\n}\n\n.is-black.input:focus, .is-black.textarea:focus, .is-black.is-focused.input, .is-black.is-focused.textarea, .is-black.input:active, .is-black.textarea:active, .is-black.is-active.input, .is-black.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), 0.25);\n}\n\n.is-light.input, .is-light.textarea {\n  border-color: var(--blm-light);\n}\n\n.is-light.input:focus, .is-light.textarea:focus, .is-light.is-focused.input, .is-light.is-focused.textarea, .is-light.input:active, .is-light.textarea:active, .is-light.is-active.input, .is-light.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n}\n\n.is-dark.input, .is-dark.textarea {\n  border-color: var(--blm-dark);\n}\n\n.is-dark.input:focus, .is-dark.textarea:focus, .is-dark.is-focused.input, .is-dark.is-focused.textarea, .is-dark.input:active, .is-dark.textarea:active, .is-dark.is-active.input, .is-dark.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n}\n\n.is-primary.input, .is-primary.textarea {\n  border-color: var(--blm-prim);\n}\n\n.is-primary.input:focus, .is-primary.textarea:focus, .is-primary.is-focused.input, .is-primary.is-focused.textarea, .is-primary.input:active, .is-primary.textarea:active, .is-primary.is-active.input, .is-primary.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n}\n\n.is-link.input, .is-link.textarea {\n  border-color: var(--blm-link);\n}\n\n.is-link.input:focus, .is-link.textarea:focus, .is-link.is-focused.input, .is-link.is-focused.textarea, .is-link.input:active, .is-link.textarea:active, .is-link.is-active.input, .is-link.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n}\n\n.is-info.input, .is-info.textarea {\n  border-color: var(--blm-info);\n}\n\n.is-info.input:focus, .is-info.textarea:focus, .is-info.is-focused.input, .is-info.is-focused.textarea, .is-info.input:active, .is-info.textarea:active, .is-info.is-active.input, .is-info.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n}\n\n.is-success.input, .is-success.textarea {\n  border-color: var(--blm-sucs);\n}\n\n.is-success.input:focus, .is-success.textarea:focus, .is-success.is-focused.input, .is-success.is-focused.textarea, .is-success.input:active, .is-success.textarea:active, .is-success.is-active.input, .is-success.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n}\n\n.is-warning.input, .is-warning.textarea {\n  border-color: var(--blm-warn);\n}\n\n.is-warning.input:focus, .is-warning.textarea:focus, .is-warning.is-focused.input, .is-warning.is-focused.textarea, .is-warning.input:active, .is-warning.textarea:active, .is-warning.is-active.input, .is-warning.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n}\n\n.is-danger.input, .is-danger.textarea {\n  border-color: var(--blm-dang);\n}\n\n.is-danger.input:focus, .is-danger.textarea:focus, .is-danger.is-focused.input, .is-danger.is-focused.textarea, .is-danger.input:active, .is-danger.textarea:active, .is-danger.is-active.input, .is-danger.is-active.textarea {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n}\n\n.is-small.input, .is-small.textarea {\n  border-radius: var(--blm-ctrl-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.is-medium.input, .is-medium.textarea {\n  font-size: var(--blm-s-medium);\n}\n\n.is-large.input, .is-large.textarea {\n  font-size: var(--blm-s-lg);\n}\n\n.is-fullwidth.input, .is-fullwidth.textarea {\n  display: block;\n  width: 100%;\n}\n\n.is-inline.input, .is-inline.textarea {\n  display: inline;\n  width: auto;\n}\n\n.input.is-rounded {\n  border-radius: var(--blm-radius-rounded);\n  padding-left: calc(var(--blm-ctrl-p-horizontal) + 0.375em);\n  padding-right: calc(var(--blm-ctrl-p-horizontal) + 0.375em);\n}\n\n.input.is-static {\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n  padding-left: 0;\n  padding-right: 0;\n}\n\n.textarea {\n  display: block;\n  max-width: 100%;\n  min-width: 100%;\n  padding: var(--blm-txtarea-p);\n  resize: vertical;\n}\n\n.textarea:not([rows]) {\n  max-height: var(--blm-txtarea-max-height);\n  min-height: var(--blm-txtarea-min-height);\n}\n\n.textarea[rows] {\n  height: initial;\n}\n\n.textarea.has-fixed-size {\n  resize: none;\n}\n\n.checkbox, .radio {\n  cursor: pointer;\n  display: inline-block;\n  line-height: 1.25;\n  position: relative;\n}\n\n.checkbox input, .radio input {\n  cursor: pointer;\n}\n\n.checkbox:hover, .radio:hover {\n  color: var(--blm-input-hov-clr);\n}\n\n.checkbox[disabled], .radio[disabled],\nfieldset[disabled] .checkbox,\nfieldset[disabled] .radio {\n  color: var(--blm-input-dsbl-clr);\n  cursor: not-allowed;\n}\n\n.radio + .radio {\n  margin-left: 0.5em;\n}\n\n.select {\n  display: inline-block;\n  max-width: 100%;\n  position: relative;\n  vertical-align: top;\n}\n\n.select:not(.is-multiple) {\n  height: var(--blm-input-height);\n}\n\n.select:not(.is-multiple):not(.is-loading)::after {\n  border-color: var(--blm-input-arrow);\n  right: 1.125em;\n  z-index: 4;\n}\n\n.select.is-rounded select {\n  border-radius: var(--blm-radius-rounded);\n  padding-left: 1em;\n}\n\n.select select {\n  cursor: pointer;\n  display: block;\n  font-size: 1em;\n  max-width: 100%;\n  outline: none;\n}\n\n.select select::-ms-expand {\n  display: none;\n}\n\n.select select[disabled]:hover,\nfieldset[disabled] .select select:hover {\n  border-color: var(--blm-input-dsbl-bd-clr);\n}\n\n.select select:not([multiple]) {\n  padding-right: 2.5em;\n}\n\n.select select[multiple] {\n  height: auto;\n  padding: 0;\n}\n\n.select select[multiple] option {\n  padding: 0.5em 1em;\n}\n\n.select:not(.is-multiple):not(.is-loading):hover::after {\n  border-color: var(--blm-input-hov-clr);\n}\n\n.select.is-white:not(:hover)::after {\n  border-color: var(--blm-white);\n}\n\n.select.is-white select {\n  border-color: var(--blm-white);\n}\n\n.select.is-white select:hover, .select.is-white select.is-hovered {\n  border-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n}\n\n.select.is-white select:focus, .select.is-white select.is-focused, .select.is-white select:active, .select.is-white select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), 0.25);\n}\n\n.select.is-black:not(:hover)::after {\n  border-color: var(--blm-black);\n}\n\n.select.is-black select {\n  border-color: var(--blm-black);\n}\n\n.select.is-black select:hover, .select.is-black select.is-hovered {\n  border-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n}\n\n.select.is-black select:focus, .select.is-black select.is-focused, .select.is-black select:active, .select.is-black select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), 0.25);\n}\n\n.select.is-light:not(:hover)::after {\n  border-color: var(--blm-light);\n}\n\n.select.is-light select {\n  border-color: var(--blm-light);\n}\n\n.select.is-light select:hover, .select.is-light select.is-hovered {\n  border-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n}\n\n.select.is-light select:focus, .select.is-light select.is-focused, .select.is-light select:active, .select.is-light select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n}\n\n.select.is-dark:not(:hover)::after {\n  border-color: var(--blm-dark);\n}\n\n.select.is-dark select {\n  border-color: var(--blm-dark);\n}\n\n.select.is-dark select:hover, .select.is-dark select.is-hovered {\n  border-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n}\n\n.select.is-dark select:focus, .select.is-dark select.is-focused, .select.is-dark select:active, .select.is-dark select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n}\n\n.select.is-primary:not(:hover)::after {\n  border-color: var(--blm-prim);\n}\n\n.select.is-primary select {\n  border-color: var(--blm-prim);\n}\n\n.select.is-primary select:hover, .select.is-primary select.is-hovered {\n  border-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n}\n\n.select.is-primary select:focus, .select.is-primary select.is-focused, .select.is-primary select:active, .select.is-primary select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n}\n\n.select.is-link:not(:hover)::after {\n  border-color: var(--blm-link);\n}\n\n.select.is-link select {\n  border-color: var(--blm-link);\n}\n\n.select.is-link select:hover, .select.is-link select.is-hovered {\n  border-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n}\n\n.select.is-link select:focus, .select.is-link select.is-focused, .select.is-link select:active, .select.is-link select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n}\n\n.select.is-info:not(:hover)::after {\n  border-color: var(--blm-info);\n}\n\n.select.is-info select {\n  border-color: var(--blm-info);\n}\n\n.select.is-info select:hover, .select.is-info select.is-hovered {\n  border-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n}\n\n.select.is-info select:focus, .select.is-info select.is-focused, .select.is-info select:active, .select.is-info select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n}\n\n.select.is-success:not(:hover)::after {\n  border-color: var(--blm-sucs);\n}\n\n.select.is-success select {\n  border-color: var(--blm-sucs);\n}\n\n.select.is-success select:hover, .select.is-success select.is-hovered {\n  border-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n}\n\n.select.is-success select:focus, .select.is-success select.is-focused, .select.is-success select:active, .select.is-success select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n}\n\n.select.is-warning:not(:hover)::after {\n  border-color: var(--blm-warn);\n}\n\n.select.is-warning select {\n  border-color: var(--blm-warn);\n}\n\n.select.is-warning select:hover, .select.is-warning select.is-hovered {\n  border-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n}\n\n.select.is-warning select:focus, .select.is-warning select.is-focused, .select.is-warning select:active, .select.is-warning select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n}\n\n.select.is-danger:not(:hover)::after {\n  border-color: var(--blm-dang);\n}\n\n.select.is-danger select {\n  border-color: var(--blm-dang);\n}\n\n.select.is-danger select:hover, .select.is-danger select.is-hovered {\n  border-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n}\n\n.select.is-danger select:focus, .select.is-danger select.is-focused, .select.is-danger select:active, .select.is-danger select.is-active {\n  box-shadow: var(--blm-input-foc-box-shadow-s) hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n}\n\n.select.is-small {\n  border-radius: var(--blm-ctrl-radius-small);\n  font-size: var(--blm-s-small);\n}\n\n.select.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.select.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.select.is-disabled::after {\n  border-color: var(--blm-input-dsbl-clr);\n}\n\n.select.is-fullwidth {\n  width: 100%;\n}\n\n.select.is-fullwidth select {\n  width: 100%;\n}\n\n.select.is-loading::after {\n  margin-top: 0;\n  position: absolute;\n  right: 0.625em;\n  top: 0.625em;\n  transform: none;\n}\n\n.select.is-loading.is-small:after {\n  font-size: var(--blm-s-small);\n}\n\n.select.is-loading.is-medium:after {\n  font-size: var(--blm-s-medium);\n}\n\n.select.is-loading.is-large:after {\n  font-size: var(--blm-s-lg);\n}\n\n.file {\n  align-items: stretch;\n  display: flex;\n  justify-content: flex-start;\n  position: relative;\n}\n\n.file.is-white .file-cta {\n  background-color: var(--blm-white);\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.file.is-white:hover .file-cta, .file.is-white.is-hovered .file-cta {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 2.5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.file.is-white:focus .file-cta, .file.is-white.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), 0.25);\n  color: var(--blm-white-inv);\n}\n\n.file.is-white:active .file-cta, .file.is-white.is-active .file-cta {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n  border-color: transparent;\n  color: var(--blm-white-inv);\n}\n\n.file.is-black .file-cta {\n  background-color: var(--blm-black);\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.file.is-black:hover .file-cta, .file.is-black.is-hovered .file-cta {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 2.5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.file.is-black:focus .file-cta, .file.is-black.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), 0.25);\n  color: var(--blm-black-inv);\n}\n\n.file.is-black:active .file-cta, .file.is-black.is-active .file-cta {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n  border-color: transparent;\n  color: var(--blm-black-inv);\n}\n\n.file.is-light .file-cta {\n  background-color: var(--blm-light);\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.file.is-light:hover .file-cta, .file.is-light.is-hovered .file-cta {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 2.5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.file.is-light:focus .file-cta, .file.is-light.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), 0.25);\n  color: var(--blm-light-inv);\n}\n\n.file.is-light:active .file-cta, .file.is-light.is-active .file-cta {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n  border-color: transparent;\n  color: var(--blm-light-inv);\n}\n\n.file.is-dark .file-cta {\n  background-color: var(--blm-dark);\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.file.is-dark:hover .file-cta, .file.is-dark.is-hovered .file-cta {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 2.5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.file.is-dark:focus .file-cta, .file.is-dark.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), 0.25);\n  color: var(--blm-dark-inv);\n}\n\n.file.is-dark:active .file-cta, .file.is-dark.is-active .file-cta {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n  border-color: transparent;\n  color: var(--blm-dark-inv);\n}\n\n.file.is-primary .file-cta {\n  background-color: var(--blm-prim);\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.file.is-primary:hover .file-cta, .file.is-primary.is-hovered .file-cta {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 2.5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.file.is-primary:focus .file-cta, .file.is-primary.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), 0.25);\n  color: var(--blm-prim-inv);\n}\n\n.file.is-primary:active .file-cta, .file.is-primary.is-active .file-cta {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n  border-color: transparent;\n  color: var(--blm-prim-inv);\n}\n\n.file.is-link .file-cta {\n  background-color: var(--blm-link);\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.file.is-link:hover .file-cta, .file.is-link.is-hovered .file-cta {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 2.5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.file.is-link:focus .file-cta, .file.is-link.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), 0.25);\n  color: var(--blm-link-inv);\n}\n\n.file.is-link:active .file-cta, .file.is-link.is-active .file-cta {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n  border-color: transparent;\n  color: var(--blm-link-inv);\n}\n\n.file.is-info .file-cta {\n  background-color: var(--blm-info);\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.file.is-info:hover .file-cta, .file.is-info.is-hovered .file-cta {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 2.5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.file.is-info:focus .file-cta, .file.is-info.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), 0.25);\n  color: var(--blm-info-inv);\n}\n\n.file.is-info:active .file-cta, .file.is-info.is-active .file-cta {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n  border-color: transparent;\n  color: var(--blm-info-inv);\n}\n\n.file.is-success .file-cta {\n  background-color: var(--blm-sucs);\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.file.is-success:hover .file-cta, .file.is-success.is-hovered .file-cta {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 2.5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.file.is-success:focus .file-cta, .file.is-success.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), 0.25);\n  color: var(--blm-sucs-inv);\n}\n\n.file.is-success:active .file-cta, .file.is-success.is-active .file-cta {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n  border-color: transparent;\n  color: var(--blm-sucs-inv);\n}\n\n.file.is-warning .file-cta {\n  background-color: var(--blm-warn);\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.file.is-warning:hover .file-cta, .file.is-warning.is-hovered .file-cta {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 2.5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.file.is-warning:focus .file-cta, .file.is-warning.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), 0.25);\n  color: var(--blm-warn-inv);\n}\n\n.file.is-warning:active .file-cta, .file.is-warning.is-active .file-cta {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n  border-color: transparent;\n  color: var(--blm-warn-inv);\n}\n\n.file.is-danger .file-cta {\n  background-color: var(--blm-dang);\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.file.is-danger:hover .file-cta, .file.is-danger.is-hovered .file-cta {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 2.5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.file.is-danger:focus .file-cta, .file.is-danger.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), 0.25);\n  color: var(--blm-dang-inv);\n}\n\n.file.is-danger:active .file-cta, .file.is-danger.is-active .file-cta {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n  border-color: transparent;\n  color: var(--blm-dang-inv);\n}\n\n.file.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.file.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.file.is-medium .file-icon .fa {\n  font-size: 21px;\n}\n\n.file.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.file.is-large .file-icon .fa {\n  font-size: 28px;\n}\n\n.file.has-name .file-cta {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.file.has-name .file-name {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.file.has-name.is-empty .file-cta {\n  border-radius: var(--blm-file-radius);\n}\n\n.file.has-name.is-empty .file-name {\n  display: none;\n}\n\n.file.is-boxed .file-label {\n  flex-direction: column;\n}\n\n.file.is-boxed .file-cta {\n  flex-direction: column;\n  height: auto;\n  padding: 1em 3em;\n}\n\n.file.is-boxed .file-name {\n  border-width: 0 1px 1px;\n}\n\n.file.is-boxed .file-icon {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.file.is-boxed .file-icon .fa {\n  font-size: 21px;\n}\n\n.file.is-boxed.is-small .file-icon .fa {\n  font-size: 14px;\n}\n\n.file.is-boxed.is-medium .file-icon .fa {\n  font-size: 28px;\n}\n\n.file.is-boxed.is-large .file-icon .fa {\n  font-size: 35px;\n}\n\n.file.is-boxed.has-name .file-cta {\n  border-radius: var(--blm-file-radius) var(--blm-file-radius) 0 0;\n}\n\n.file.is-boxed.has-name .file-name {\n  border-radius: 0 0 var(--blm-file-radius) var(--blm-file-radius);\n  border-width: 0 1px 1px;\n}\n\n.file.is-centered {\n  justify-content: center;\n}\n\n.file.is-fullwidth .file-label {\n  width: 100%;\n}\n\n.file.is-fullwidth .file-name {\n  flex-grow: 1;\n  max-width: none;\n}\n\n.file.is-right {\n  justify-content: flex-end;\n}\n\n.file.is-right .file-cta {\n  border-radius: 0 var(--blm-file-radius) var(--blm-file-radius) 0;\n}\n\n.file.is-right .file-name {\n  border-radius: var(--blm-file-radius) 0 0 var(--blm-file-radius);\n  border-width: 1px 0 1px 1px;\n  order: -1;\n}\n\n.file-label {\n  align-items: stretch;\n  display: flex;\n  cursor: pointer;\n  justify-content: flex-start;\n  overflow: hidden;\n  position: relative;\n}\n\n.file-label:hover .file-cta {\n  background-color: hsla(var(--blm-file-cta-bg-clr-h), var(--blm-file-cta-bg-clr-s), calc(var(--blm-file-cta-bg-clr-l) - 2.5%), var(--blm-file-cta-bg-clr-a));\n  color: var(--blm-file-cta-hov-clr);\n}\n\n.file-label:hover .file-name {\n  border-color: hsla(var(--blm-file-name-bd-clr-h), var(--blm-file-name-bd-clr-s), calc(var(--blm-file-name-bd-clr-l) - 2.5%), var(--blm-file-name-bd-clr-a));\n}\n\n.file-label:active .file-cta {\n  background-color: hsla(var(--blm-file-cta-bg-clr-h), var(--blm-file-cta-bg-clr-s), calc(var(--blm-file-cta-bg-clr-l) - 5%), var(--blm-file-cta-bg-clr-a));\n  color: var(--blm-file-cta-act-clr);\n}\n\n.file-label:active .file-name {\n  border-color: hsla(var(--blm-file-name-bd-clr-h), var(--blm-file-name-bd-clr-s), calc(var(--blm-file-name-bd-clr-l) - 5%), var(--blm-file-name-bd-clr-a));\n}\n\n.file-input {\n  height: 100%;\n  left: 0;\n  opacity: 0;\n  outline: none;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n\n.file-cta,\n.file-name {\n  border-color: var(--blm-file-bd-clr);\n  border-radius: var(--blm-file-radius);\n  font-size: 1em;\n  padding-left: 1em;\n  padding-right: 1em;\n  white-space: nowrap;\n}\n\n.file-cta {\n  background-color: var(--blm-file-cta-bg-clr);\n  color: var(--blm-file-cta-clr);\n}\n\n.file-name {\n  border-color: var(--blm-file-name-bd-clr);\n  border-style: var(--blm-file-name-bd-style);\n  border-width: var(--blm-file-name-bd-width);\n  display: block;\n  max-width: var(--blm-file-name-max-width);\n  overflow: hidden;\n  text-align: inherit;\n  text-overflow: ellipsis;\n}\n\n.file-icon {\n  align-items: center;\n  display: flex;\n  height: 1em;\n  justify-content: center;\n  margin-right: 0.5em;\n  width: 1em;\n}\n\n.file-icon .fa {\n  font-size: 14px;\n}\n\n.label {\n  color: var(--blm-label-clr);\n  display: block;\n  font-size: var(--blm-s-normal);\n  font-weight: var(--blm-label-weight);\n}\n\n.label:not(:last-child) {\n  margin-bottom: 0.5em;\n}\n\n.label.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.label.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.label.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.help {\n  display: block;\n  font-size: var(--blm-help-s);\n  margin-top: 0.25rem;\n}\n\n.help.is-white {\n  color: var(--blm-white);\n}\n\n.help.is-black {\n  color: var(--blm-black);\n}\n\n.help.is-light {\n  color: var(--blm-light);\n}\n\n.help.is-dark {\n  color: var(--blm-dark);\n}\n\n.help.is-primary {\n  color: var(--blm-prim);\n}\n\n.help.is-link {\n  color: var(--blm-link);\n}\n\n.help.is-info {\n  color: var(--blm-info);\n}\n\n.help.is-success {\n  color: var(--blm-sucs);\n}\n\n.help.is-warning {\n  color: var(--blm-warn);\n}\n\n.help.is-danger {\n  color: var(--blm-dang);\n}\n\n.field:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.field.has-addons {\n  display: flex;\n  justify-content: flex-start;\n}\n\n.field.has-addons .control:not(:last-child) {\n  margin-right: -1px;\n}\n\n.field.has-addons .control:not(:first-child):not(:last-child) .button,\n.field.has-addons .control:not(:first-child):not(:last-child) .input,\n.field.has-addons .control:not(:first-child):not(:last-child) .select select {\n  border-radius: 0;\n}\n\n.field.has-addons .control:first-child:not(:only-child) .button,\n.field.has-addons .control:first-child:not(:only-child) .input,\n.field.has-addons .control:first-child:not(:only-child) .select select {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.field.has-addons .control:last-child:not(:only-child) .button,\n.field.has-addons .control:last-child:not(:only-child) .input,\n.field.has-addons .control:last-child:not(:only-child) .select select {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.field.has-addons .control .button:not([disabled]):hover, .field.has-addons .control .button:not([disabled]).is-hovered,\n.field.has-addons .control .input:not([disabled]):hover,\n.field.has-addons .control .input:not([disabled]).is-hovered,\n.field.has-addons .control .select select:not([disabled]):hover,\n.field.has-addons .control .select select:not([disabled]).is-hovered {\n  z-index: 2;\n}\n\n.field.has-addons .control .button:not([disabled]):focus, .field.has-addons .control .button:not([disabled]).is-focused, .field.has-addons .control .button:not([disabled]):active, .field.has-addons .control .button:not([disabled]).is-active,\n.field.has-addons .control .input:not([disabled]):focus,\n.field.has-addons .control .input:not([disabled]).is-focused,\n.field.has-addons .control .input:not([disabled]):active,\n.field.has-addons .control .input:not([disabled]).is-active,\n.field.has-addons .control .select select:not([disabled]):focus,\n.field.has-addons .control .select select:not([disabled]).is-focused,\n.field.has-addons .control .select select:not([disabled]):active,\n.field.has-addons .control .select select:not([disabled]).is-active {\n  z-index: 3;\n}\n\n.field.has-addons .control .button:not([disabled]):focus:hover, .field.has-addons .control .button:not([disabled]).is-focused:hover, .field.has-addons .control .button:not([disabled]):active:hover, .field.has-addons .control .button:not([disabled]).is-active:hover,\n.field.has-addons .control .input:not([disabled]):focus:hover,\n.field.has-addons .control .input:not([disabled]).is-focused:hover,\n.field.has-addons .control .input:not([disabled]):active:hover,\n.field.has-addons .control .input:not([disabled]).is-active:hover,\n.field.has-addons .control .select select:not([disabled]):focus:hover,\n.field.has-addons .control .select select:not([disabled]).is-focused:hover,\n.field.has-addons .control .select select:not([disabled]):active:hover,\n.field.has-addons .control .select select:not([disabled]).is-active:hover {\n  z-index: 4;\n}\n\n.field.has-addons .control.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.field.has-addons.has-addons-centered {\n  justify-content: center;\n}\n\n.field.has-addons.has-addons-right {\n  justify-content: flex-end;\n}\n\n.field.has-addons.has-addons-fullwidth .control {\n  flex-grow: 1;\n  flex-shrink: 0;\n}\n\n.field.is-grouped {\n  display: flex;\n  justify-content: flex-start;\n}\n\n.field.is-grouped > .control {\n  flex-shrink: 0;\n}\n\n.field.is-grouped > .control:not(:last-child) {\n  margin-bottom: 0;\n  margin-right: 0.75rem;\n}\n\n.field.is-grouped > .control.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.field.is-grouped.is-grouped-centered {\n  justify-content: center;\n}\n\n.field.is-grouped.is-grouped-right {\n  justify-content: flex-end;\n}\n\n.field.is-grouped.is-grouped-multiline {\n  flex-wrap: wrap;\n}\n\n.field.is-grouped.is-grouped-multiline > .control:last-child, .field.is-grouped.is-grouped-multiline > .control:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.field.is-grouped.is-grouped-multiline:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.field.is-grouped.is-grouped-multiline:not(:last-child) {\n  margin-bottom: 0;\n}\n\n@media screen and (min-width: 769px), print {\n  .field.is-horizontal {\n    display: flex;\n  }\n}\n\n.field-label .label {\n  font-size: inherit;\n}\n\n@media screen and (max-width: 768px) {\n  .field-label {\n    margin-bottom: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .field-label {\n    flex-basis: 0;\n    flex-grow: 1;\n    flex-shrink: 0;\n    margin-right: 1.5rem;\n    text-align: right;\n  }\n  .field-label.is-small {\n    font-size: var(--blm-s-small);\n    padding-top: 0.375em;\n  }\n  .field-label.is-normal {\n    padding-top: 0.375em;\n  }\n  .field-label.is-medium {\n    font-size: var(--blm-s-medium);\n    padding-top: 0.375em;\n  }\n  .field-label.is-large {\n    font-size: var(--blm-s-lg);\n    padding-top: 0.375em;\n  }\n}\n\n.field-body .field .field {\n  margin-bottom: 0;\n}\n\n@media screen and (min-width: 769px), print {\n  .field-body {\n    display: flex;\n    flex-basis: 0;\n    flex-grow: 5;\n    flex-shrink: 1;\n  }\n  .field-body .field {\n    margin-bottom: 0;\n  }\n  .field-body > .field {\n    flex-shrink: 1;\n  }\n  .field-body > .field:not(.is-narrow) {\n    flex-grow: 1;\n  }\n  .field-body > .field:not(:last-child) {\n    margin-right: 0.75rem;\n  }\n}\n\n.control {\n  box-sizing: border-box;\n  clear: both;\n  font-size: var(--blm-s-normal);\n  position: relative;\n  text-align: inherit;\n}\n\n.control.has-icons-left .input:focus ~ .icon,\n.control.has-icons-left .select:focus ~ .icon, .control.has-icons-right .input:focus ~ .icon,\n.control.has-icons-right .select:focus ~ .icon {\n  color: var(--blm-input-icon-act-clr);\n}\n\n.control.has-icons-left .input.is-small ~ .icon,\n.control.has-icons-left .select.is-small ~ .icon, .control.has-icons-right .input.is-small ~ .icon,\n.control.has-icons-right .select.is-small ~ .icon {\n  font-size: var(--blm-s-small);\n}\n\n.control.has-icons-left .input.is-medium ~ .icon,\n.control.has-icons-left .select.is-medium ~ .icon, .control.has-icons-right .input.is-medium ~ .icon,\n.control.has-icons-right .select.is-medium ~ .icon {\n  font-size: var(--blm-s-medium);\n}\n\n.control.has-icons-left .input.is-large ~ .icon,\n.control.has-icons-left .select.is-large ~ .icon, .control.has-icons-right .input.is-large ~ .icon,\n.control.has-icons-right .select.is-large ~ .icon {\n  font-size: var(--blm-s-lg);\n}\n\n.control.has-icons-left .icon, .control.has-icons-right .icon {\n  color: var(--blm-input-icon-clr);\n  height: var(--blm-input-height);\n  pointer-events: none;\n  position: absolute;\n  top: 0;\n  width: var(--blm-input-height);\n  z-index: 4;\n}\n\n.control.has-icons-left .input,\n.control.has-icons-left .select select {\n  padding-left: var(--blm-input-height);\n}\n\n.control.has-icons-left .icon.is-left {\n  left: 0;\n}\n\n.control.has-icons-right .input,\n.control.has-icons-right .select select {\n  padding-right: var(--blm-input-height);\n}\n\n.control.has-icons-right .icon.is-right {\n  right: 0;\n}\n\n.control.is-loading::after {\n  position: absolute !important;\n  right: 0.625em;\n  top: 0.625em;\n  z-index: 4;\n}\n\n.control.is-loading.is-small:after {\n  font-size: var(--blm-s-small);\n}\n\n.control.is-loading.is-medium:after {\n  font-size: var(--blm-s-medium);\n}\n\n.control.is-loading.is-large:after {\n  font-size: var(--blm-s-lg);\n}\n\n.breadcrumb {\n  font-size: var(--blm-s-normal);\n  white-space: nowrap;\n}\n\n.breadcrumb a {\n  align-items: center;\n  color: var(--blm-bread-itm-clr);\n  display: flex;\n  justify-content: center;\n  padding: var(--blm-bread-itm-p-vertical) var(--blm-bread-itm-p-horizontal);\n}\n\n.breadcrumb a:hover {\n  color: var(--blm-bread-itm-hov-clr);\n}\n\n.breadcrumb li {\n  align-items: center;\n  display: flex;\n}\n\n.breadcrumb li:first-child a {\n  padding-left: 0;\n}\n\n.breadcrumb li.is-active a {\n  color: var(--blm-bread-itm-act-clr);\n  cursor: default;\n  pointer-events: none;\n}\n\n.breadcrumb li + li::before {\n  color: var(--blm-bread-itm-separator-clr);\n  content: \"\\0002f\";\n}\n\n.breadcrumb ul,\n.breadcrumb ol {\n  align-items: flex-start;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.breadcrumb .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.breadcrumb .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.breadcrumb.is-centered ol,\n.breadcrumb.is-centered ul {\n  justify-content: center;\n}\n\n.breadcrumb.is-right ol,\n.breadcrumb.is-right ul {\n  justify-content: flex-end;\n}\n\n.breadcrumb.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.breadcrumb.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.breadcrumb.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.breadcrumb.has-arrow-separator li + li::before {\n  content: \"\\02192\";\n}\n\n.breadcrumb.has-bullet-separator li + li::before {\n  content: \"\\02022\";\n}\n\n.breadcrumb.has-dot-separator li + li::before {\n  content: \"\\000b7\";\n}\n\n.breadcrumb.has-succeeds-separator li + li::before {\n  content: \"\\0227B\";\n}\n\n.card {\n  background-color: var(--blm-card-bg-clr);\n  box-shadow: var(--blm-card-shadow);\n  color: var(--blm-card-clr);\n  max-width: 100%;\n  position: relative;\n}\n\n.card-header {\n  background-color: var(--blm-card-hd-bg-clr);\n  align-items: stretch;\n  box-shadow: var(--blm-card-hd-shadow);\n  display: flex;\n}\n\n.card-header-title {\n  align-items: center;\n  color: var(--blm-card-hd-clr);\n  display: flex;\n  flex-grow: 1;\n  font-weight: var(--blm-card-hd-weight);\n  padding: var(--blm-card-hd-p);\n}\n\n.card-header-title.is-centered {\n  justify-content: center;\n}\n\n.card-header-icon {\n  align-items: center;\n  cursor: pointer;\n  display: flex;\n  justify-content: center;\n  padding: var(--blm-card-hd-p);\n}\n\n.card-image {\n  display: block;\n  position: relative;\n}\n\n.card-content {\n  background-color: var(--blm-card-ct-bg-clr);\n  padding: var(--blm-card-ct-p);\n}\n\n.card-footer {\n  background-color: var(--blm-card-ft-bg-clr);\n  border-top: var(--blm-card-ft-bd-top);\n  align-items: stretch;\n  display: flex;\n}\n\n.card-footer-item {\n  align-items: center;\n  display: flex;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 0;\n  justify-content: center;\n  padding: var(--blm-card-ft-p);\n}\n\n.card-footer-item:not(:last-child) {\n  border-right: var(--blm-card-ft-bd-top);\n}\n\n.card .media:not(:last-child) {\n  margin-bottom: var(--blm-card-media-m);\n}\n\n.dropdown {\n  display: inline-flex;\n  position: relative;\n  vertical-align: top;\n}\n\n.dropdown.is-active .dropdown-menu, .dropdown.is-hoverable:hover .dropdown-menu {\n  display: block;\n}\n\n.dropdown.is-right .dropdown-menu {\n  left: auto;\n  right: 0;\n}\n\n.dropdown.is-up .dropdown-menu {\n  bottom: 100%;\n  padding-bottom: var(--blm-drp-ct-offset);\n  padding-top: initial;\n  top: auto;\n}\n\n.dropdown-menu {\n  display: none;\n  left: 0;\n  min-width: var(--blm-drp-menu-min-width);\n  padding-top: var(--blm-drp-ct-offset);\n  position: absolute;\n  top: 100%;\n  z-index: var(--blm-drp-ct-z);\n}\n\n.dropdown-content {\n  background-color: var(--blm-drp-ct-bg-clr);\n  border-radius: var(--blm-drp-ct-radius);\n  box-shadow: var(--blm-drp-ct-shadow);\n  padding-bottom: var(--blm-drp-ct-p-bottom);\n  padding-top: var(--blm-drp-ct-p-top);\n}\n\n.dropdown-item {\n  color: var(--blm-drp-itm-clr);\n  display: block;\n  font-size: 0.875rem;\n  line-height: 1.5;\n  padding: 0.375rem 1rem;\n  position: relative;\n}\n\na.dropdown-item,\nbutton.dropdown-item {\n  padding-right: 3rem;\n  text-align: inherit;\n  white-space: nowrap;\n  width: 100%;\n}\n\na.dropdown-item:hover,\nbutton.dropdown-item:hover {\n  background-color: var(--blm-drp-itm-hov-bg-clr);\n  color: var(--blm-drp-itm-hov-clr);\n}\n\na.dropdown-item.is-active,\nbutton.dropdown-item.is-active {\n  background-color: var(--blm-drp-itm-act-bg-clr);\n  color: var(--blm-drp-itm-act-clr);\n}\n\n.dropdown-divider {\n  background-color: var(--blm-drp-dvd-bg-clr);\n  border: none;\n  display: block;\n  height: 1px;\n  margin: 0.5rem 0;\n}\n\n.level {\n  align-items: center;\n  justify-content: space-between;\n}\n\n.level code {\n  border-radius: var(--blm-radius);\n}\n\n.level img {\n  display: inline-block;\n  vertical-align: top;\n}\n\n.level.is-mobile {\n  display: flex;\n}\n\n.level.is-mobile .level-left,\n.level.is-mobile .level-right {\n  display: flex;\n}\n\n.level.is-mobile .level-left + .level-right {\n  margin-top: 0;\n}\n\n.level.is-mobile .level-item:not(:last-child) {\n  margin-bottom: 0;\n  margin-right: var(--blm-level-itm-spacing);\n}\n\n.level.is-mobile .level-item:not(.is-narrow) {\n  flex-grow: 1;\n}\n\n@media screen and (min-width: 769px), print {\n  .level {\n    display: flex;\n  }\n  .level > .level-item:not(.is-narrow) {\n    flex-grow: 1;\n  }\n}\n\n.level-item {\n  align-items: center;\n  display: flex;\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n  justify-content: center;\n}\n\n.level-item .title,\n.level-item .subtitle {\n  margin-bottom: 0;\n}\n\n@media screen and (max-width: 768px) {\n  .level-item:not(:last-child) {\n    margin-bottom: var(--blm-level-itm-spacing);\n  }\n}\n\n.level-left,\n.level-right {\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.level-left .level-item.is-flexible,\n.level-right .level-item.is-flexible {\n  flex-grow: 1;\n}\n\n@media screen and (min-width: 769px), print {\n  .level-left .level-item:not(:last-child),\n  .level-right .level-item:not(:last-child) {\n    margin-right: var(--blm-level-itm-spacing);\n  }\n}\n\n.level-left {\n  align-items: center;\n  justify-content: flex-start;\n}\n\n@media screen and (max-width: 768px) {\n  .level-left + .level-right {\n    margin-top: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .level-left {\n    display: flex;\n  }\n}\n\n.level-right {\n  align-items: center;\n  justify-content: flex-end;\n}\n\n@media screen and (min-width: 769px), print {\n  .level-right {\n    display: flex;\n  }\n}\n\n.media {\n  align-items: flex-start;\n  display: flex;\n  text-align: inherit;\n}\n\n.media .content:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.media .media {\n  border-top: 1px solid var(--blm-media-bd-clr);\n  display: flex;\n  padding-top: 0.75rem;\n}\n\n.media .media .content:not(:last-child),\n.media .media .control:not(:last-child) {\n  margin-bottom: 0.5rem;\n}\n\n.media .media .media {\n  padding-top: 0.5rem;\n}\n\n.media .media .media + .media {\n  margin-top: 0.5rem;\n}\n\n.media + .media {\n  border-top: 1px solid var(--blm-media-bd-clr);\n  margin-top: var(--blm-media-spacing);\n  padding-top: var(--blm-media-spacing);\n}\n\n.media.is-large + .media {\n  margin-top: var(--blm-media-spacing-lg);\n  padding-top: var(--blm-media-spacing-lg);\n}\n\n.media-left,\n.media-right {\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.media-left {\n  margin-right: var(--blm-media-spacing);\n}\n\n.media-right {\n  margin-left: var(--blm-media-spacing);\n}\n\n.media-content {\n  flex-basis: auto;\n  flex-grow: 1;\n  flex-shrink: 1;\n  text-align: inherit;\n}\n\n@media screen and (max-width: 768px) {\n  .media-content {\n    overflow-x: auto;\n  }\n}\n\n.menu {\n  font-size: var(--blm-s-normal);\n}\n\n.menu.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.menu.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.menu.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.menu-list {\n  line-height: var(--blm-menu-list-line-height);\n}\n\n.menu-list a {\n  border-radius: var(--blm-menu-itm-radius);\n  color: var(--blm-menu-itm-clr);\n  display: block;\n  padding: var(--blm-menu-list-link-p);\n}\n\n.menu-list a:hover {\n  background-color: var(--blm-menu-itm-hov-bg-clr);\n  color: var(--blm-menu-itm-hov-clr);\n}\n\n.menu-list a.is-active {\n  background-color: var(--blm-menu-itm-act-bg-clr);\n  color: var(--blm-menu-itm-act-clr);\n}\n\n.menu-list li ul {\n  border-left: var(--blm-menu-list-bd-left);\n  margin: var(--blm-menu-nested-list-m);\n  padding-left: var(--blm-menu-nested-list-p-left);\n}\n\n.menu-label {\n  color: var(--blm-menu-label-clr);\n  font-size: var(--blm-menu-label-font-s);\n  letter-spacing: var(--blm-menu-label-letter-spacing);\n  text-transform: uppercase;\n}\n\n.menu-label:not(:first-child) {\n  margin-top: var(--blm-menu-label-spacing);\n}\n\n.menu-label:not(:last-child) {\n  margin-bottom: var(--blm-menu-label-spacing);\n}\n\n.message {\n  background-color: var(--blm-msg-bg-clr);\n  border-radius: var(--blm-msg-radius);\n  font-size: var(--blm-s-normal);\n}\n\n.message strong {\n  color: currentColor;\n}\n\n.message a:not(.button):not(.tag):not(.dropdown-item) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.message.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.message.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.message.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.message.is-white .message-header {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.message.is-white .message-body {\n  border-color: var(--blm-white);\n  background-color: var(--blm-white);\n}\n\n.message.is-black .message-header {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.message.is-black .message-body {\n  border-color: var(--blm-black);\n  background-color: var(--blm-sch-main-bis);\n}\n\n.message.is-light .message-header {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.message.is-light .message-body {\n  border-color: var(--blm-light);\n  background-color: var(--blm-sch-main-bis);\n}\n\n.message.is-dark .message-header {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.message.is-dark .message-body {\n  border-color: var(--blm-dark);\n  background-color: var(--blm-sch-main-bis);\n}\n\n.message.is-primary .message-header {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.message.is-primary .message-body {\n  border-color: var(--blm-prim);\n  color: var(--blm-prim-dark);\n  background-color: var(--blm-prim-light);\n}\n\n.message.is-link .message-header {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.message.is-link .message-body {\n  border-color: var(--blm-link);\n  color: var(--blm-link-dark);\n  background-color: var(--blm-link-light);\n}\n\n.message.is-info .message-header {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.message.is-info .message-body {\n  border-color: var(--blm-info);\n  color: var(--blm-info-dark);\n  background-color: var(--blm-info-light);\n}\n\n.message.is-success .message-header {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.message.is-success .message-body {\n  border-color: var(--blm-sucs);\n  color: var(--blm-sucs-dark);\n  background-color: var(--blm-sucs-light);\n}\n\n.message.is-warning .message-header {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.message.is-warning .message-body {\n  border-color: var(--blm-warn);\n  color: var(--blm-warn-dark);\n  background-color: var(--blm-warn-light);\n}\n\n.message.is-danger .message-header {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.message.is-danger .message-body {\n  border-color: var(--blm-dang);\n  color: var(--blm-dang-dark);\n  background-color: var(--blm-dang-light);\n}\n\n.message-header {\n  align-items: center;\n  background-color: var(--blm-msg-hd-bg-clr);\n  border-radius: var(--blm-msg-hd-radius) var(--blm-msg-hd-radius) 0 0;\n  color: var(--blm-msg-hd-clr);\n  display: flex;\n  font-weight: var(--blm-msg-hd-weight);\n  justify-content: space-between;\n  line-height: 1.25;\n  padding: var(--blm-msg-hd-p);\n  position: relative;\n}\n\n.message-header .delete {\n  flex-grow: 0;\n  flex-shrink: 0;\n  margin-left: 0.75em;\n}\n\n.message-header + .message-body {\n  border-width: var(--blm-msg-hd-body-bd-width);\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.message-header.has-no-body {\n  border-radius: var(--blm-msg-hd-radius);\n}\n\n.message-body {\n  border-color: var(--blm-msg-body-bd-clr);\n  border-radius: var(--blm-msg-body-radius);\n  border-style: solid;\n  border-width: var(--blm-msg-body-bd-width);\n  color: var(--blm-msg-body-clr);\n  padding: var(--blm-msg-body-p);\n}\n\n.message-body code,\n.message-body pre {\n  background-color: var(--blm-msg-body-pre-bg-clr);\n}\n\n.message-body pre code {\n  background-color: var(--blm-msg-body-pre-code-bg-clr);\n}\n\n.modal {\n  align-items: center;\n  display: none;\n  flex-direction: column;\n  justify-content: center;\n  overflow: hidden;\n  position: fixed;\n  z-index: var(--blm-modal-z);\n}\n\n.modal.is-active {\n  display: flex;\n}\n\n.modal-background {\n  background-color: var(--blm-modal-bg-bg-clr);\n}\n\n.modal-content,\n.modal-card {\n  margin: 0 var(--blm-modal-ct-m-mobile);\n  max-height: calc(100vh - var(--blm-modal-ct-spacing-mobile));\n  overflow: auto;\n  position: relative;\n  width: 100%;\n}\n\n@media screen and (min-width: 769px), print {\n  .modal-content,\n  .modal-card {\n    margin: 0 auto;\n    max-height: calc(100vh - var(--blm-modal-ct-spacing-tablet));\n    width: var(--blm-modal-ct-width);\n  }\n}\n\n.modal-close {\n  background: none;\n  height: var(--blm-modal-close-dim);\n  position: fixed;\n  right: var(--blm-modal-close-right);\n  top: var(--blm-modal-close-top);\n  width: var(--blm-modal-close-dim);\n}\n\n.modal-card {\n  display: flex;\n  flex-direction: column;\n  max-height: calc(100vh - var(--blm-modal-card-spacing));\n  overflow: hidden;\n  -ms-overflow-y: visible;\n}\n\n.modal-card-head,\n.modal-card-foot {\n  align-items: center;\n  background-color: var(--blm-modal-card-head-bg-clr);\n  display: flex;\n  flex-shrink: 0;\n  justify-content: flex-start;\n  padding: var(--blm-modal-card-head-p);\n  position: relative;\n}\n\n.modal-card-head {\n  border-bottom: var(--blm-modal-card-head-bd-bottom);\n  border-top-left-radius: var(--blm-modal-card-head-radius);\n  border-top-right-radius: var(--blm-modal-card-head-radius);\n}\n\n.modal-card-title {\n  color: var(--blm-modal-card-title-clr);\n  flex-grow: 1;\n  flex-shrink: 0;\n  font-size: var(--blm-modal-card-title-s);\n  line-height: var(--blm-modal-card-title-line-height);\n}\n\n.modal-card-foot {\n  border-bottom-left-radius: var(--blm-modal-card-foot-radius);\n  border-bottom-right-radius: var(--blm-modal-card-foot-radius);\n  border-top: var(--blm-modal-card-foot-bd-top);\n}\n\n.modal-card-foot .button:not(:last-child) {\n  margin-right: 0.5em;\n}\n\n.modal-card-body {\n  -webkit-overflow-scrolling: touch;\n  background-color: var(--blm-modal-card-body-bg-clr);\n  flex-grow: 1;\n  flex-shrink: 1;\n  overflow: auto;\n  padding: var(--blm-modal-card-body-p);\n}\n\n.navbar {\n  background-color: var(--blm-nav-bg-clr);\n  min-height: var(--blm-nav-height);\n  position: relative;\n  z-index: var(--blm-nav-z);\n}\n\n.navbar.is-white {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.navbar.is-white .navbar-brand > .navbar-item,\n.navbar.is-white .navbar-brand .navbar-link {\n  color: var(--blm-white-inv);\n}\n\n.navbar.is-white .navbar-brand > a.navbar-item:focus, .navbar.is-white .navbar-brand > a.navbar-item:hover, .navbar.is-white .navbar-brand > a.navbar-item.is-active,\n.navbar.is-white .navbar-brand .navbar-link:focus,\n.navbar.is-white .navbar-brand .navbar-link:hover,\n.navbar.is-white .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n  color: var(--blm-white-inv);\n}\n\n.navbar.is-white .navbar-brand .navbar-link::after {\n  border-color: var(--blm-white-inv);\n}\n\n.navbar.is-white .navbar-burger {\n  color: var(--blm-white-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-white .navbar-start > .navbar-item,\n  .navbar.is-white .navbar-start .navbar-link,\n  .navbar.is-white .navbar-end > .navbar-item,\n  .navbar.is-white .navbar-end .navbar-link {\n    color: var(--blm-white-inv);\n  }\n  .navbar.is-white .navbar-start > a.navbar-item:focus, .navbar.is-white .navbar-start > a.navbar-item:hover, .navbar.is-white .navbar-start > a.navbar-item.is-active,\n  .navbar.is-white .navbar-start .navbar-link:focus,\n  .navbar.is-white .navbar-start .navbar-link:hover,\n  .navbar.is-white .navbar-start .navbar-link.is-active,\n  .navbar.is-white .navbar-end > a.navbar-item:focus,\n  .navbar.is-white .navbar-end > a.navbar-item:hover,\n  .navbar.is-white .navbar-end > a.navbar-item.is-active,\n  .navbar.is-white .navbar-end .navbar-link:focus,\n  .navbar.is-white .navbar-end .navbar-link:hover,\n  .navbar.is-white .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n    color: var(--blm-white-inv);\n  }\n  .navbar.is-white .navbar-start .navbar-link::after,\n  .navbar.is-white .navbar-end .navbar-link::after {\n    border-color: var(--blm-white-inv);\n  }\n  .navbar.is-white .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-white .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-white .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n    color: var(--blm-white-inv);\n  }\n  .navbar.is-white .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-white);\n    color: var(--blm-white-inv);\n  }\n}\n\n.navbar.is-black {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.navbar.is-black .navbar-brand > .navbar-item,\n.navbar.is-black .navbar-brand .navbar-link {\n  color: var(--blm-black-inv);\n}\n\n.navbar.is-black .navbar-brand > a.navbar-item:focus, .navbar.is-black .navbar-brand > a.navbar-item:hover, .navbar.is-black .navbar-brand > a.navbar-item.is-active,\n.navbar.is-black .navbar-brand .navbar-link:focus,\n.navbar.is-black .navbar-brand .navbar-link:hover,\n.navbar.is-black .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n  color: var(--blm-black-inv);\n}\n\n.navbar.is-black .navbar-brand .navbar-link::after {\n  border-color: var(--blm-black-inv);\n}\n\n.navbar.is-black .navbar-burger {\n  color: var(--blm-black-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-black .navbar-start > .navbar-item,\n  .navbar.is-black .navbar-start .navbar-link,\n  .navbar.is-black .navbar-end > .navbar-item,\n  .navbar.is-black .navbar-end .navbar-link {\n    color: var(--blm-black-inv);\n  }\n  .navbar.is-black .navbar-start > a.navbar-item:focus, .navbar.is-black .navbar-start > a.navbar-item:hover, .navbar.is-black .navbar-start > a.navbar-item.is-active,\n  .navbar.is-black .navbar-start .navbar-link:focus,\n  .navbar.is-black .navbar-start .navbar-link:hover,\n  .navbar.is-black .navbar-start .navbar-link.is-active,\n  .navbar.is-black .navbar-end > a.navbar-item:focus,\n  .navbar.is-black .navbar-end > a.navbar-item:hover,\n  .navbar.is-black .navbar-end > a.navbar-item.is-active,\n  .navbar.is-black .navbar-end .navbar-link:focus,\n  .navbar.is-black .navbar-end .navbar-link:hover,\n  .navbar.is-black .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n    color: var(--blm-black-inv);\n  }\n  .navbar.is-black .navbar-start .navbar-link::after,\n  .navbar.is-black .navbar-end .navbar-link::after {\n    border-color: var(--blm-black-inv);\n  }\n  .navbar.is-black .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-black .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-black .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n    color: var(--blm-black-inv);\n  }\n  .navbar.is-black .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-black);\n    color: var(--blm-black-inv);\n  }\n}\n\n.navbar.is-light {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.navbar.is-light .navbar-brand > .navbar-item,\n.navbar.is-light .navbar-brand .navbar-link {\n  color: var(--blm-light-inv);\n}\n\n.navbar.is-light .navbar-brand > a.navbar-item:focus, .navbar.is-light .navbar-brand > a.navbar-item:hover, .navbar.is-light .navbar-brand > a.navbar-item.is-active,\n.navbar.is-light .navbar-brand .navbar-link:focus,\n.navbar.is-light .navbar-brand .navbar-link:hover,\n.navbar.is-light .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n  color: var(--blm-light-inv);\n}\n\n.navbar.is-light .navbar-brand .navbar-link::after {\n  border-color: var(--blm-light-inv);\n}\n\n.navbar.is-light .navbar-burger {\n  color: var(--blm-light-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-light .navbar-start > .navbar-item,\n  .navbar.is-light .navbar-start .navbar-link,\n  .navbar.is-light .navbar-end > .navbar-item,\n  .navbar.is-light .navbar-end .navbar-link {\n    color: var(--blm-light-inv);\n  }\n  .navbar.is-light .navbar-start > a.navbar-item:focus, .navbar.is-light .navbar-start > a.navbar-item:hover, .navbar.is-light .navbar-start > a.navbar-item.is-active,\n  .navbar.is-light .navbar-start .navbar-link:focus,\n  .navbar.is-light .navbar-start .navbar-link:hover,\n  .navbar.is-light .navbar-start .navbar-link.is-active,\n  .navbar.is-light .navbar-end > a.navbar-item:focus,\n  .navbar.is-light .navbar-end > a.navbar-item:hover,\n  .navbar.is-light .navbar-end > a.navbar-item.is-active,\n  .navbar.is-light .navbar-end .navbar-link:focus,\n  .navbar.is-light .navbar-end .navbar-link:hover,\n  .navbar.is-light .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n    color: var(--blm-light-inv);\n  }\n  .navbar.is-light .navbar-start .navbar-link::after,\n  .navbar.is-light .navbar-end .navbar-link::after {\n    border-color: var(--blm-light-inv);\n  }\n  .navbar.is-light .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-light .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-light .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n    color: var(--blm-light-inv);\n  }\n  .navbar.is-light .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-light);\n    color: var(--blm-light-inv);\n  }\n}\n\n.navbar.is-dark {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.navbar.is-dark .navbar-brand > .navbar-item,\n.navbar.is-dark .navbar-brand .navbar-link {\n  color: var(--blm-dark-inv);\n}\n\n.navbar.is-dark .navbar-brand > a.navbar-item:focus, .navbar.is-dark .navbar-brand > a.navbar-item:hover, .navbar.is-dark .navbar-brand > a.navbar-item.is-active,\n.navbar.is-dark .navbar-brand .navbar-link:focus,\n.navbar.is-dark .navbar-brand .navbar-link:hover,\n.navbar.is-dark .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n  color: var(--blm-dark-inv);\n}\n\n.navbar.is-dark .navbar-brand .navbar-link::after {\n  border-color: var(--blm-dark-inv);\n}\n\n.navbar.is-dark .navbar-burger {\n  color: var(--blm-dark-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-dark .navbar-start > .navbar-item,\n  .navbar.is-dark .navbar-start .navbar-link,\n  .navbar.is-dark .navbar-end > .navbar-item,\n  .navbar.is-dark .navbar-end .navbar-link {\n    color: var(--blm-dark-inv);\n  }\n  .navbar.is-dark .navbar-start > a.navbar-item:focus, .navbar.is-dark .navbar-start > a.navbar-item:hover, .navbar.is-dark .navbar-start > a.navbar-item.is-active,\n  .navbar.is-dark .navbar-start .navbar-link:focus,\n  .navbar.is-dark .navbar-start .navbar-link:hover,\n  .navbar.is-dark .navbar-start .navbar-link.is-active,\n  .navbar.is-dark .navbar-end > a.navbar-item:focus,\n  .navbar.is-dark .navbar-end > a.navbar-item:hover,\n  .navbar.is-dark .navbar-end > a.navbar-item.is-active,\n  .navbar.is-dark .navbar-end .navbar-link:focus,\n  .navbar.is-dark .navbar-end .navbar-link:hover,\n  .navbar.is-dark .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n    color: var(--blm-dark-inv);\n  }\n  .navbar.is-dark .navbar-start .navbar-link::after,\n  .navbar.is-dark .navbar-end .navbar-link::after {\n    border-color: var(--blm-dark-inv);\n  }\n  .navbar.is-dark .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-dark .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-dark .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n    color: var(--blm-dark-inv);\n  }\n  .navbar.is-dark .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-dark);\n    color: var(--blm-dark-inv);\n  }\n}\n\n.navbar.is-primary {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.navbar.is-primary .navbar-brand > .navbar-item,\n.navbar.is-primary .navbar-brand .navbar-link {\n  color: var(--blm-prim-inv);\n}\n\n.navbar.is-primary .navbar-brand > a.navbar-item:focus, .navbar.is-primary .navbar-brand > a.navbar-item:hover, .navbar.is-primary .navbar-brand > a.navbar-item.is-active,\n.navbar.is-primary .navbar-brand .navbar-link:focus,\n.navbar.is-primary .navbar-brand .navbar-link:hover,\n.navbar.is-primary .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n  color: var(--blm-prim-inv);\n}\n\n.navbar.is-primary .navbar-brand .navbar-link::after {\n  border-color: var(--blm-prim-inv);\n}\n\n.navbar.is-primary .navbar-burger {\n  color: var(--blm-prim-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-primary .navbar-start > .navbar-item,\n  .navbar.is-primary .navbar-start .navbar-link,\n  .navbar.is-primary .navbar-end > .navbar-item,\n  .navbar.is-primary .navbar-end .navbar-link {\n    color: var(--blm-prim-inv);\n  }\n  .navbar.is-primary .navbar-start > a.navbar-item:focus, .navbar.is-primary .navbar-start > a.navbar-item:hover, .navbar.is-primary .navbar-start > a.navbar-item.is-active,\n  .navbar.is-primary .navbar-start .navbar-link:focus,\n  .navbar.is-primary .navbar-start .navbar-link:hover,\n  .navbar.is-primary .navbar-start .navbar-link.is-active,\n  .navbar.is-primary .navbar-end > a.navbar-item:focus,\n  .navbar.is-primary .navbar-end > a.navbar-item:hover,\n  .navbar.is-primary .navbar-end > a.navbar-item.is-active,\n  .navbar.is-primary .navbar-end .navbar-link:focus,\n  .navbar.is-primary .navbar-end .navbar-link:hover,\n  .navbar.is-primary .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n    color: var(--blm-prim-inv);\n  }\n  .navbar.is-primary .navbar-start .navbar-link::after,\n  .navbar.is-primary .navbar-end .navbar-link::after {\n    border-color: var(--blm-prim-inv);\n  }\n  .navbar.is-primary .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-primary .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-primary .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n    color: var(--blm-prim-inv);\n  }\n  .navbar.is-primary .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-prim);\n    color: var(--blm-prim-inv);\n  }\n}\n\n.navbar.is-link {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.navbar.is-link .navbar-brand > .navbar-item,\n.navbar.is-link .navbar-brand .navbar-link {\n  color: var(--blm-link-inv);\n}\n\n.navbar.is-link .navbar-brand > a.navbar-item:focus, .navbar.is-link .navbar-brand > a.navbar-item:hover, .navbar.is-link .navbar-brand > a.navbar-item.is-active,\n.navbar.is-link .navbar-brand .navbar-link:focus,\n.navbar.is-link .navbar-brand .navbar-link:hover,\n.navbar.is-link .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n  color: var(--blm-link-inv);\n}\n\n.navbar.is-link .navbar-brand .navbar-link::after {\n  border-color: var(--blm-link-inv);\n}\n\n.navbar.is-link .navbar-burger {\n  color: var(--blm-link-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-link .navbar-start > .navbar-item,\n  .navbar.is-link .navbar-start .navbar-link,\n  .navbar.is-link .navbar-end > .navbar-item,\n  .navbar.is-link .navbar-end .navbar-link {\n    color: var(--blm-link-inv);\n  }\n  .navbar.is-link .navbar-start > a.navbar-item:focus, .navbar.is-link .navbar-start > a.navbar-item:hover, .navbar.is-link .navbar-start > a.navbar-item.is-active,\n  .navbar.is-link .navbar-start .navbar-link:focus,\n  .navbar.is-link .navbar-start .navbar-link:hover,\n  .navbar.is-link .navbar-start .navbar-link.is-active,\n  .navbar.is-link .navbar-end > a.navbar-item:focus,\n  .navbar.is-link .navbar-end > a.navbar-item:hover,\n  .navbar.is-link .navbar-end > a.navbar-item.is-active,\n  .navbar.is-link .navbar-end .navbar-link:focus,\n  .navbar.is-link .navbar-end .navbar-link:hover,\n  .navbar.is-link .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n    color: var(--blm-link-inv);\n  }\n  .navbar.is-link .navbar-start .navbar-link::after,\n  .navbar.is-link .navbar-end .navbar-link::after {\n    border-color: var(--blm-link-inv);\n  }\n  .navbar.is-link .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-link .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-link .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n    color: var(--blm-link-inv);\n  }\n  .navbar.is-link .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-link);\n    color: var(--blm-link-inv);\n  }\n}\n\n.navbar.is-info {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.navbar.is-info .navbar-brand > .navbar-item,\n.navbar.is-info .navbar-brand .navbar-link {\n  color: var(--blm-info-inv);\n}\n\n.navbar.is-info .navbar-brand > a.navbar-item:focus, .navbar.is-info .navbar-brand > a.navbar-item:hover, .navbar.is-info .navbar-brand > a.navbar-item.is-active,\n.navbar.is-info .navbar-brand .navbar-link:focus,\n.navbar.is-info .navbar-brand .navbar-link:hover,\n.navbar.is-info .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n  color: var(--blm-info-inv);\n}\n\n.navbar.is-info .navbar-brand .navbar-link::after {\n  border-color: var(--blm-info-inv);\n}\n\n.navbar.is-info .navbar-burger {\n  color: var(--blm-info-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-info .navbar-start > .navbar-item,\n  .navbar.is-info .navbar-start .navbar-link,\n  .navbar.is-info .navbar-end > .navbar-item,\n  .navbar.is-info .navbar-end .navbar-link {\n    color: var(--blm-info-inv);\n  }\n  .navbar.is-info .navbar-start > a.navbar-item:focus, .navbar.is-info .navbar-start > a.navbar-item:hover, .navbar.is-info .navbar-start > a.navbar-item.is-active,\n  .navbar.is-info .navbar-start .navbar-link:focus,\n  .navbar.is-info .navbar-start .navbar-link:hover,\n  .navbar.is-info .navbar-start .navbar-link.is-active,\n  .navbar.is-info .navbar-end > a.navbar-item:focus,\n  .navbar.is-info .navbar-end > a.navbar-item:hover,\n  .navbar.is-info .navbar-end > a.navbar-item.is-active,\n  .navbar.is-info .navbar-end .navbar-link:focus,\n  .navbar.is-info .navbar-end .navbar-link:hover,\n  .navbar.is-info .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n    color: var(--blm-info-inv);\n  }\n  .navbar.is-info .navbar-start .navbar-link::after,\n  .navbar.is-info .navbar-end .navbar-link::after {\n    border-color: var(--blm-info-inv);\n  }\n  .navbar.is-info .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-info .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-info .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n    color: var(--blm-info-inv);\n  }\n  .navbar.is-info .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-info);\n    color: var(--blm-info-inv);\n  }\n}\n\n.navbar.is-success {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.navbar.is-success .navbar-brand > .navbar-item,\n.navbar.is-success .navbar-brand .navbar-link {\n  color: var(--blm-sucs-inv);\n}\n\n.navbar.is-success .navbar-brand > a.navbar-item:focus, .navbar.is-success .navbar-brand > a.navbar-item:hover, .navbar.is-success .navbar-brand > a.navbar-item.is-active,\n.navbar.is-success .navbar-brand .navbar-link:focus,\n.navbar.is-success .navbar-brand .navbar-link:hover,\n.navbar.is-success .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n  color: var(--blm-sucs-inv);\n}\n\n.navbar.is-success .navbar-brand .navbar-link::after {\n  border-color: var(--blm-sucs-inv);\n}\n\n.navbar.is-success .navbar-burger {\n  color: var(--blm-sucs-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-success .navbar-start > .navbar-item,\n  .navbar.is-success .navbar-start .navbar-link,\n  .navbar.is-success .navbar-end > .navbar-item,\n  .navbar.is-success .navbar-end .navbar-link {\n    color: var(--blm-sucs-inv);\n  }\n  .navbar.is-success .navbar-start > a.navbar-item:focus, .navbar.is-success .navbar-start > a.navbar-item:hover, .navbar.is-success .navbar-start > a.navbar-item.is-active,\n  .navbar.is-success .navbar-start .navbar-link:focus,\n  .navbar.is-success .navbar-start .navbar-link:hover,\n  .navbar.is-success .navbar-start .navbar-link.is-active,\n  .navbar.is-success .navbar-end > a.navbar-item:focus,\n  .navbar.is-success .navbar-end > a.navbar-item:hover,\n  .navbar.is-success .navbar-end > a.navbar-item.is-active,\n  .navbar.is-success .navbar-end .navbar-link:focus,\n  .navbar.is-success .navbar-end .navbar-link:hover,\n  .navbar.is-success .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n    color: var(--blm-sucs-inv);\n  }\n  .navbar.is-success .navbar-start .navbar-link::after,\n  .navbar.is-success .navbar-end .navbar-link::after {\n    border-color: var(--blm-sucs-inv);\n  }\n  .navbar.is-success .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-success .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-success .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n    color: var(--blm-sucs-inv);\n  }\n  .navbar.is-success .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-sucs);\n    color: var(--blm-sucs-inv);\n  }\n}\n\n.navbar.is-warning {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.navbar.is-warning .navbar-brand > .navbar-item,\n.navbar.is-warning .navbar-brand .navbar-link {\n  color: var(--blm-warn-inv);\n}\n\n.navbar.is-warning .navbar-brand > a.navbar-item:focus, .navbar.is-warning .navbar-brand > a.navbar-item:hover, .navbar.is-warning .navbar-brand > a.navbar-item.is-active,\n.navbar.is-warning .navbar-brand .navbar-link:focus,\n.navbar.is-warning .navbar-brand .navbar-link:hover,\n.navbar.is-warning .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n  color: var(--blm-warn-inv);\n}\n\n.navbar.is-warning .navbar-brand .navbar-link::after {\n  border-color: var(--blm-warn-inv);\n}\n\n.navbar.is-warning .navbar-burger {\n  color: var(--blm-warn-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-warning .navbar-start > .navbar-item,\n  .navbar.is-warning .navbar-start .navbar-link,\n  .navbar.is-warning .navbar-end > .navbar-item,\n  .navbar.is-warning .navbar-end .navbar-link {\n    color: var(--blm-warn-inv);\n  }\n  .navbar.is-warning .navbar-start > a.navbar-item:focus, .navbar.is-warning .navbar-start > a.navbar-item:hover, .navbar.is-warning .navbar-start > a.navbar-item.is-active,\n  .navbar.is-warning .navbar-start .navbar-link:focus,\n  .navbar.is-warning .navbar-start .navbar-link:hover,\n  .navbar.is-warning .navbar-start .navbar-link.is-active,\n  .navbar.is-warning .navbar-end > a.navbar-item:focus,\n  .navbar.is-warning .navbar-end > a.navbar-item:hover,\n  .navbar.is-warning .navbar-end > a.navbar-item.is-active,\n  .navbar.is-warning .navbar-end .navbar-link:focus,\n  .navbar.is-warning .navbar-end .navbar-link:hover,\n  .navbar.is-warning .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n    color: var(--blm-warn-inv);\n  }\n  .navbar.is-warning .navbar-start .navbar-link::after,\n  .navbar.is-warning .navbar-end .navbar-link::after {\n    border-color: var(--blm-warn-inv);\n  }\n  .navbar.is-warning .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-warning .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-warning .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n    color: var(--blm-warn-inv);\n  }\n  .navbar.is-warning .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-warn);\n    color: var(--blm-warn-inv);\n  }\n}\n\n.navbar.is-danger {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.navbar.is-danger .navbar-brand > .navbar-item,\n.navbar.is-danger .navbar-brand .navbar-link {\n  color: var(--blm-dang-inv);\n}\n\n.navbar.is-danger .navbar-brand > a.navbar-item:focus, .navbar.is-danger .navbar-brand > a.navbar-item:hover, .navbar.is-danger .navbar-brand > a.navbar-item.is-active,\n.navbar.is-danger .navbar-brand .navbar-link:focus,\n.navbar.is-danger .navbar-brand .navbar-link:hover,\n.navbar.is-danger .navbar-brand .navbar-link.is-active {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n  color: var(--blm-dang-inv);\n}\n\n.navbar.is-danger .navbar-brand .navbar-link::after {\n  border-color: var(--blm-dang-inv);\n}\n\n.navbar.is-danger .navbar-burger {\n  color: var(--blm-dang-inv);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-danger .navbar-start > .navbar-item,\n  .navbar.is-danger .navbar-start .navbar-link,\n  .navbar.is-danger .navbar-end > .navbar-item,\n  .navbar.is-danger .navbar-end .navbar-link {\n    color: var(--blm-dang-inv);\n  }\n  .navbar.is-danger .navbar-start > a.navbar-item:focus, .navbar.is-danger .navbar-start > a.navbar-item:hover, .navbar.is-danger .navbar-start > a.navbar-item.is-active,\n  .navbar.is-danger .navbar-start .navbar-link:focus,\n  .navbar.is-danger .navbar-start .navbar-link:hover,\n  .navbar.is-danger .navbar-start .navbar-link.is-active,\n  .navbar.is-danger .navbar-end > a.navbar-item:focus,\n  .navbar.is-danger .navbar-end > a.navbar-item:hover,\n  .navbar.is-danger .navbar-end > a.navbar-item.is-active,\n  .navbar.is-danger .navbar-end .navbar-link:focus,\n  .navbar.is-danger .navbar-end .navbar-link:hover,\n  .navbar.is-danger .navbar-end .navbar-link.is-active {\n    background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n    color: var(--blm-dang-inv);\n  }\n  .navbar.is-danger .navbar-start .navbar-link::after,\n  .navbar.is-danger .navbar-end .navbar-link::after {\n    border-color: var(--blm-dang-inv);\n  }\n  .navbar.is-danger .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-danger .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-danger .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n    color: var(--blm-dang-inv);\n  }\n  .navbar.is-danger .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-dang);\n    color: var(--blm-dang-inv);\n  }\n}\n\n.navbar > .container {\n  align-items: stretch;\n  display: flex;\n  min-height: var(--blm-nav-height);\n  width: 100%;\n}\n\n.navbar.has-shadow {\n  box-shadow: var(--blm-nav-box-shadow-s) var(--blm-nav-box-shadow-clr);\n}\n\n.navbar.is-fixed-bottom, .navbar.is-fixed-top {\n  left: 0;\n  position: fixed;\n  right: 0;\n  z-index: var(--blm-nav-fixed-z);\n}\n\n.navbar.is-fixed-bottom {\n  bottom: 0;\n}\n\n.navbar.is-fixed-bottom.has-shadow {\n  box-shadow: var(--blm-nav-bottom-box-shadow-s) var(--blm-nav-box-shadow-clr);\n}\n\n.navbar.is-fixed-top {\n  top: 0;\n}\n\nhtml.has-navbar-fixed-top,\nbody.has-navbar-fixed-top {\n  padding-top: var(--blm-nav-height);\n}\n\nhtml.has-navbar-fixed-bottom,\nbody.has-navbar-fixed-bottom {\n  padding-bottom: var(--blm-nav-height);\n}\n\n.navbar-brand,\n.navbar-tabs {\n  align-items: stretch;\n  display: flex;\n  flex-shrink: 0;\n  min-height: var(--blm-nav-height);\n}\n\n.navbar-brand a.navbar-item:focus, .navbar-brand a.navbar-item:hover {\n  background-color: transparent;\n}\n\n.navbar-tabs {\n  -webkit-overflow-scrolling: touch;\n  max-width: 100vw;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n\n.navbar-burger {\n  color: var(--blm-nav-burger-clr);\n  cursor: pointer;\n  display: block;\n  height: var(--blm-nav-height);\n  position: relative;\n  width: var(--blm-nav-height);\n  margin-left: auto;\n}\n\n.navbar-burger span {\n  background-color: currentColor;\n  display: block;\n  height: 1px;\n  left: calc(50% - 8px);\n  position: absolute;\n  transform-origin: center;\n  transition-duration: var(--blm-speed);\n  transition-property: background-color, opacity, transform;\n  transition-timing-function: var(--blm-easing);\n  width: 16px;\n}\n\n.navbar-burger span:nth-child(1) {\n  top: calc(50% - 6px);\n}\n\n.navbar-burger span:nth-child(2) {\n  top: calc(50% - 1px);\n}\n\n.navbar-burger span:nth-child(3) {\n  top: calc(50% + 4px);\n}\n\n.navbar-burger:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.05);\n}\n\n.navbar-burger.is-active span:nth-child(1) {\n  transform: translateY(5px) rotate(45deg);\n}\n\n.navbar-burger.is-active span:nth-child(2) {\n  opacity: 0;\n}\n\n.navbar-burger.is-active span:nth-child(3) {\n  transform: translateY(-5px) rotate(-45deg);\n}\n\n.navbar-menu {\n  display: none;\n}\n\n.navbar-item,\n.navbar-link {\n  color: var(--blm-nav-itm-clr);\n  display: block;\n  line-height: 1.5;\n  padding: 0.5rem 0.75rem;\n  position: relative;\n}\n\n.navbar-item .icon:only-child,\n.navbar-link .icon:only-child {\n  margin-left: -0.25rem;\n  margin-right: -0.25rem;\n}\n\na.navbar-item,\n.navbar-link {\n  cursor: pointer;\n}\n\na.navbar-item:focus, a.navbar-item:focus-within, a.navbar-item:hover, a.navbar-item.is-active,\n.navbar-link:focus,\n.navbar-link:focus-within,\n.navbar-link:hover,\n.navbar-link.is-active {\n  background-color: var(--blm-nav-itm-hov-bg-clr);\n  color: var(--blm-nav-itm-hov-clr);\n}\n\n.navbar-item {\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.navbar-item img {\n  max-height: var(--blm-nav-itm-img-max-height);\n}\n\n.navbar-item.has-dropdown {\n  padding: 0;\n}\n\n.navbar-item.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.navbar-item.is-tab {\n  border-bottom: 1px solid transparent;\n  min-height: var(--blm-nav-height);\n  padding-bottom: calc(0.5rem - 1px);\n}\n\n.navbar-item.is-tab:focus, .navbar-item.is-tab:hover {\n  background-color: var(--blm-nav-tab-hov-bg-clr);\n  border-bottom-color: var(--blm-nav-tab-hov-bd-bottom-clr);\n}\n\n.navbar-item.is-tab.is-active {\n  background-color: var(--blm-nav-tab-act-bg-clr);\n  border-bottom-color: var(--blm-nav-tab-act-bd-bottom-clr);\n  border-bottom-style: var(--blm-nav-tab-act-bd-bottom-style);\n  border-bottom-width: var(--blm-nav-tab-act-bd-bottom-width);\n  color: var(--blm-nav-tab-act-clr);\n  padding-bottom: calc(0.5rem - var(--blm-nav-tab-act-bd-bottom-width));\n}\n\n.navbar-content {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.navbar-link:not(.is-arrowless) {\n  padding-right: 2.5em;\n}\n\n.navbar-link:not(.is-arrowless)::after {\n  border-color: var(--blm-nav-drp-arrow);\n  margin-top: -0.375em;\n  right: 1.125em;\n}\n\n.navbar-dropdown {\n  font-size: 0.875rem;\n  padding-bottom: 0.5rem;\n  padding-top: 0.5rem;\n}\n\n.navbar-dropdown .navbar-item {\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n}\n\n.navbar-divider {\n  background-color: var(--blm-nav-dvd-bg-clr);\n  border: none;\n  display: none;\n  height: var(--blm-nav-dvd-height);\n  margin: 0.5rem 0;\n}\n\n@media screen and (max-width: 1023px) {\n  .navbar > .container {\n    display: block;\n  }\n  .navbar-brand .navbar-item,\n  .navbar-tabs .navbar-item {\n    align-items: center;\n    display: flex;\n  }\n  .navbar-link::after {\n    display: none;\n  }\n  .navbar-menu {\n    background-color: var(--blm-nav-bg-clr);\n    box-shadow: 0 8px 16px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n    padding: 0.5rem 0;\n  }\n  .navbar-menu.is-active {\n    display: block;\n  }\n  .navbar.is-fixed-bottom-touch, .navbar.is-fixed-top-touch {\n    left: 0;\n    position: fixed;\n    right: 0;\n    z-index: var(--blm-nav-fixed-z);\n  }\n  .navbar.is-fixed-bottom-touch {\n    bottom: 0;\n  }\n  .navbar.is-fixed-bottom-touch.has-shadow {\n    box-shadow: 0 -2px 3px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  }\n  .navbar.is-fixed-top-touch {\n    top: 0;\n  }\n  .navbar.is-fixed-top .navbar-menu, .navbar.is-fixed-top-touch .navbar-menu {\n    -webkit-overflow-scrolling: touch;\n    max-height: calc(100vh - var(--blm-nav-height));\n    overflow: auto;\n  }\n  html.has-navbar-fixed-top-touch,\n  body.has-navbar-fixed-top-touch {\n    padding-top: var(--blm-nav-height);\n  }\n  html.has-navbar-fixed-bottom-touch,\n  body.has-navbar-fixed-bottom-touch {\n    padding-bottom: var(--blm-nav-height);\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar,\n  .navbar-menu,\n  .navbar-start,\n  .navbar-end {\n    align-items: stretch;\n    display: flex;\n  }\n  .navbar {\n    min-height: var(--blm-nav-height);\n  }\n  .navbar.is-spaced {\n    padding: var(--blm-nav-p-vertical) var(--blm-nav-p-horizontal);\n  }\n  .navbar.is-spaced .navbar-start,\n  .navbar.is-spaced .navbar-end {\n    align-items: center;\n  }\n  .navbar.is-spaced a.navbar-item,\n  .navbar.is-spaced .navbar-link {\n    border-radius: var(--blm-radius);\n  }\n  .navbar.is-transparent a.navbar-item:focus, .navbar.is-transparent a.navbar-item:hover, .navbar.is-transparent a.navbar-item.is-active,\n  .navbar.is-transparent .navbar-link:focus,\n  .navbar.is-transparent .navbar-link:hover,\n  .navbar.is-transparent .navbar-link.is-active {\n    background-color: transparent !important;\n  }\n  .navbar.is-transparent .navbar-item.has-dropdown.is-active .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus-within .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:hover .navbar-link {\n    background-color: transparent !important;\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item:focus, .navbar.is-transparent .navbar-dropdown a.navbar-item:hover {\n    background-color: var(--blm-nav-drp-itm-hov-bg-clr);\n    color: var(--blm-nav-drp-itm-hov-clr);\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-nav-drp-itm-act-bg-clr);\n    color: var(--blm-nav-drp-itm-act-clr);\n  }\n  .navbar-burger {\n    display: none;\n  }\n  .navbar-item,\n  .navbar-link {\n    align-items: center;\n    display: flex;\n  }\n  .navbar-item.has-dropdown {\n    align-items: stretch;\n  }\n  .navbar-item.has-dropdown-up .navbar-link::after {\n    transform: rotate(135deg) translate(0.25em, -0.25em);\n  }\n  .navbar-item.has-dropdown-up .navbar-dropdown {\n    border-bottom: var(--blm-nav-drp-bd-top);\n    border-radius: var(--blm-nav-drp-radius) var(--blm-nav-drp-radius) 0 0;\n    border-top: none;\n    bottom: 100%;\n    box-shadow: 0 -8px 8px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n    top: auto;\n  }\n  .navbar-item.is-active .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown {\n    display: block;\n  }\n  .navbar.is-spaced .navbar-item.is-active .navbar-dropdown, .navbar-item.is-active .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:hover .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown.is-boxed {\n    opacity: 1;\n    pointer-events: auto;\n    transform: translateY(0);\n  }\n  .navbar-menu {\n    flex-grow: 1;\n    flex-shrink: 0;\n  }\n  .navbar-start {\n    justify-content: flex-start;\n    margin-right: auto;\n  }\n  .navbar-end {\n    justify-content: flex-end;\n    margin-left: auto;\n  }\n  .navbar-dropdown {\n    background-color: var(--blm-nav-drp-bg-clr);\n    border-bottom-left-radius: var(--blm-nav-drp-radius);\n    border-bottom-right-radius: var(--blm-nav-drp-radius);\n    border-top: var(--blm-nav-drp-bd-top);\n    box-shadow: 0 8px 8px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n    display: none;\n    font-size: 0.875rem;\n    left: 0;\n    min-width: 100%;\n    position: absolute;\n    top: 100%;\n    z-index: var(--blm-nav-drp-z);\n  }\n  .navbar-dropdown .navbar-item {\n    padding: 0.375rem 1rem;\n    white-space: nowrap;\n  }\n  .navbar-dropdown a.navbar-item {\n    padding-right: 3rem;\n  }\n  .navbar-dropdown a.navbar-item:focus, .navbar-dropdown a.navbar-item:hover {\n    background-color: var(--blm-nav-drp-itm-hov-bg-clr);\n    color: var(--blm-nav-drp-itm-hov-clr);\n  }\n  .navbar-dropdown a.navbar-item.is-active {\n    background-color: var(--blm-nav-drp-itm-act-bg-clr);\n    color: var(--blm-nav-drp-itm-act-clr);\n  }\n  .navbar.is-spaced .navbar-dropdown, .navbar-dropdown.is-boxed {\n    border-radius: var(--blm-nav-drp-boxed-radius);\n    border-top: none;\n    box-shadow: var(--blm-nav-drp-boxed-shadow);\n    display: block;\n    opacity: 0;\n    pointer-events: none;\n    top: calc(100% + var(--blm-nav-drp-offset));\n    transform: translateY(-5px);\n    transition-duration: var(--blm-speed);\n    transition-property: opacity, transform;\n  }\n  .navbar-dropdown.is-right {\n    left: auto;\n    right: 0;\n  }\n  .navbar-divider {\n    display: block;\n  }\n  .navbar > .container .navbar-brand,\n  .container > .navbar .navbar-brand {\n    margin-left: -0.75rem;\n  }\n  .navbar > .container .navbar-menu,\n  .container > .navbar .navbar-menu {\n    margin-right: -0.75rem;\n  }\n  .navbar.is-fixed-bottom-desktop, .navbar.is-fixed-top-desktop {\n    left: 0;\n    position: fixed;\n    right: 0;\n    z-index: var(--blm-nav-fixed-z);\n  }\n  .navbar.is-fixed-bottom-desktop {\n    bottom: 0;\n  }\n  .navbar.is-fixed-bottom-desktop.has-shadow {\n    box-shadow: 0 -2px 3px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  }\n  .navbar.is-fixed-top-desktop {\n    top: 0;\n  }\n  html.has-navbar-fixed-top-desktop,\n  body.has-navbar-fixed-top-desktop {\n    padding-top: var(--blm-nav-height);\n  }\n  html.has-navbar-fixed-bottom-desktop,\n  body.has-navbar-fixed-bottom-desktop {\n    padding-bottom: var(--blm-nav-height);\n  }\n  html.has-spaced-navbar-fixed-top,\n  body.has-spaced-navbar-fixed-top {\n    padding-top: calc(var(--blm-nav-height) + var(--blm-nav-p-vertical)*2);\n  }\n  html.has-spaced-navbar-fixed-bottom,\n  body.has-spaced-navbar-fixed-bottom {\n    padding-bottom: calc(var(--blm-nav-height) + var(--blm-nav-p-vertical)*2);\n  }\n  a.navbar-item.is-active,\n  .navbar-link.is-active {\n    color: var(--blm-nav-itm-act-clr);\n  }\n  a.navbar-item.is-active:not(:focus):not(:hover),\n  .navbar-link.is-active:not(:focus):not(:hover) {\n    background-color: var(--blm-nav-itm-act-bg-clr);\n  }\n  .navbar-item.has-dropdown:focus .navbar-link, .navbar-item.has-dropdown:hover .navbar-link, .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: var(--blm-nav-itm-hov-bg-clr);\n  }\n}\n\n.hero.is-fullheight-with-navbar {\n  min-height: calc(100vh - var(--blm-nav-height));\n}\n\n.pagination {\n  font-size: var(--blm-s-normal);\n  margin: var(--blm-pag-m);\n}\n\n.pagination.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.pagination.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.pagination.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.pagination.is-rounded .pagination-previous,\n.pagination.is-rounded .pagination-next {\n  padding-left: 1em;\n  padding-right: 1em;\n  border-radius: var(--blm-radius-rounded);\n}\n\n.pagination.is-rounded .pagination-link {\n  border-radius: var(--blm-radius-rounded);\n}\n\n.pagination,\n.pagination-list {\n  align-items: center;\n  display: flex;\n  justify-content: center;\n  text-align: center;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis {\n  font-size: var(--blm-pag-itm-font-s);\n  justify-content: center;\n  margin: var(--blm-pag-itm-m);\n  padding-left: var(--blm-pag-itm-p-left);\n  padding-right: var(--blm-pag-itm-p-right);\n  text-align: center;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link {\n  border-color: var(--blm-pag-bd-clr);\n  color: var(--blm-pag-clr);\n  min-width: var(--blm-pag-min-width);\n}\n\n.pagination-previous:hover,\n.pagination-next:hover,\n.pagination-link:hover {\n  border-color: var(--blm-pag-hov-bd-clr);\n  color: var(--blm-pag-hov-clr);\n}\n\n.pagination-previous:focus,\n.pagination-next:focus,\n.pagination-link:focus {\n  border-color: var(--blm-pag-foc-bd-clr);\n}\n\n.pagination-previous:active,\n.pagination-next:active,\n.pagination-link:active {\n  box-shadow: var(--blm-pag-shadow-inset);\n}\n\n.pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled] {\n  background-color: var(--blm-pag-dsbl-bg-clr);\n  border-color: var(--blm-pag-dsbl-bd-clr);\n  box-shadow: none;\n  color: var(--blm-pag-dsbl-clr);\n  opacity: 0.5;\n}\n\n.pagination-previous,\n.pagination-next {\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  white-space: nowrap;\n}\n\n.pagination-link.is-current {\n  background-color: var(--blm-pag-cur-bg-clr);\n  border-color: var(--blm-pag-cur-bd-clr);\n  color: var(--blm-pag-cur-clr);\n}\n\n.pagination-ellipsis {\n  color: var(--blm-pag-ellipsis-clr);\n  pointer-events: none;\n}\n\n.pagination-list {\n  flex-wrap: wrap;\n}\n\n@media screen and (max-width: 768px) {\n  .pagination {\n    flex-wrap: wrap;\n  }\n  .pagination-previous,\n  .pagination-next {\n    flex-grow: 1;\n    flex-shrink: 1;\n  }\n  .pagination-list li {\n    flex-grow: 1;\n    flex-shrink: 1;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .pagination-list {\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-content: flex-start;\n    order: 1;\n  }\n  .pagination-previous {\n    order: 2;\n  }\n  .pagination-next {\n    order: 3;\n  }\n  .pagination {\n    justify-content: space-between;\n  }\n  .pagination.is-centered .pagination-previous {\n    order: 1;\n  }\n  .pagination.is-centered .pagination-list {\n    justify-content: center;\n    order: 2;\n  }\n  .pagination.is-centered .pagination-next {\n    order: 3;\n  }\n  .pagination.is-right .pagination-previous {\n    order: 1;\n  }\n  .pagination.is-right .pagination-next {\n    order: 2;\n  }\n  .pagination.is-right .pagination-list {\n    justify-content: flex-end;\n    order: 3;\n  }\n}\n\n.panel {\n  border-radius: var(--blm-pnl-radius);\n  box-shadow: var(--blm-pnl-shadow);\n  font-size: var(--blm-s-normal);\n}\n\n.panel:not(:last-child) {\n  margin-bottom: var(--blm-pnl-m);\n}\n\n.panel.is-white .panel-heading {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.panel.is-white .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-white);\n}\n\n.panel.is-white .panel-block.is-active .panel-icon {\n  color: var(--blm-white);\n}\n\n.panel.is-black .panel-heading {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.panel.is-black .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-black);\n}\n\n.panel.is-black .panel-block.is-active .panel-icon {\n  color: var(--blm-black);\n}\n\n.panel.is-light .panel-heading {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.panel.is-light .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-light);\n}\n\n.panel.is-light .panel-block.is-active .panel-icon {\n  color: var(--blm-light);\n}\n\n.panel.is-dark .panel-heading {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.panel.is-dark .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-dark);\n}\n\n.panel.is-dark .panel-block.is-active .panel-icon {\n  color: var(--blm-dark);\n}\n\n.panel.is-primary .panel-heading {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.panel.is-primary .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-prim);\n}\n\n.panel.is-primary .panel-block.is-active .panel-icon {\n  color: var(--blm-prim);\n}\n\n.panel.is-link .panel-heading {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.panel.is-link .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-link);\n}\n\n.panel.is-link .panel-block.is-active .panel-icon {\n  color: var(--blm-link);\n}\n\n.panel.is-info .panel-heading {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.panel.is-info .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-info);\n}\n\n.panel.is-info .panel-block.is-active .panel-icon {\n  color: var(--blm-info);\n}\n\n.panel.is-success .panel-heading {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.panel.is-success .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-sucs);\n}\n\n.panel.is-success .panel-block.is-active .panel-icon {\n  color: var(--blm-sucs);\n}\n\n.panel.is-warning .panel-heading {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.panel.is-warning .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-warn);\n}\n\n.panel.is-warning .panel-block.is-active .panel-icon {\n  color: var(--blm-warn);\n}\n\n.panel.is-danger .panel-heading {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.panel.is-danger .panel-tabs a.is-active {\n  border-bottom-color: var(--blm-dang);\n}\n\n.panel.is-danger .panel-block.is-active .panel-icon {\n  color: var(--blm-dang);\n}\n\n.panel-tabs:not(:last-child),\n.panel-block:not(:last-child) {\n  border-bottom: var(--blm-pnl-itm-bd);\n}\n\n.panel-heading {\n  background-color: var(--blm-pnl-hdg-bg-clr);\n  border-radius: var(--blm-pnl-radius) var(--blm-pnl-radius) 0 0;\n  color: var(--blm-pnl-hdg-clr);\n  font-size: var(--blm-pnl-hdg-s);\n  font-weight: var(--blm-pnl-hdg-weight);\n  line-height: var(--blm-pnl-hdg-line-height);\n  padding: var(--blm-pnl-hdg-p);\n}\n\n.panel-tabs {\n  align-items: flex-end;\n  display: flex;\n  font-size: var(--blm-pnl-tabs-font-s);\n  justify-content: center;\n}\n\n.panel-tabs a {\n  border-bottom: var(--blm-pnl-tab-bd-bottom);\n  margin-bottom: -1px;\n  padding: 0.5em;\n}\n\n.panel-tabs a.is-active {\n  border-bottom-color: var(--blm-pnl-tab-act-bd-bottom-clr);\n  color: var(--blm-pnl-tab-act-clr);\n}\n\n.panel-list a {\n  color: var(--blm-pnl-list-itm-clr);\n}\n\n.panel-list a:hover {\n  color: var(--blm-pnl-list-itm-hov-clr);\n}\n\n.panel-block {\n  align-items: center;\n  color: var(--blm-pnl-block-clr);\n  display: flex;\n  justify-content: flex-start;\n  padding: 0.5em 0.75em;\n}\n\n.panel-block input[type=\"checkbox\"] {\n  margin-right: 0.75em;\n}\n\n.panel-block > .control {\n  flex-grow: 1;\n  flex-shrink: 1;\n  width: 100%;\n}\n\n.panel-block.is-wrapped {\n  flex-wrap: wrap;\n}\n\n.panel-block.is-active {\n  border-left-color: var(--blm-pnl-block-act-bd-left-clr);\n  color: var(--blm-pnl-block-act-clr);\n}\n\n.panel-block.is-active .panel-icon {\n  color: var(--blm-pnl-block-act-icon-clr);\n}\n\n.panel-block:last-child {\n  border-bottom-left-radius: var(--blm-pnl-radius);\n  border-bottom-right-radius: var(--blm-pnl-radius);\n}\n\na.panel-block,\nlabel.panel-block {\n  cursor: pointer;\n}\n\na.panel-block:hover,\nlabel.panel-block:hover {\n  background-color: var(--blm-pnl-block-hov-bg-clr);\n}\n\n.panel-icon {\n  display: inline-block;\n  font-size: 14px;\n  height: 1em;\n  line-height: 1em;\n  text-align: center;\n  vertical-align: top;\n  width: 1em;\n  color: var(--blm-pnl-icon-clr);\n  margin-right: 0.75em;\n}\n\n.panel-icon .fa {\n  font-size: inherit;\n  line-height: inherit;\n}\n\n.tabs {\n  -webkit-overflow-scrolling: touch;\n  align-items: stretch;\n  display: flex;\n  font-size: var(--blm-s-normal);\n  justify-content: space-between;\n  overflow: hidden;\n  overflow-x: auto;\n  white-space: nowrap;\n}\n\n.tabs a {\n  align-items: center;\n  border-bottom-color: var(--blm-tabs-bd-bottom-clr);\n  border-bottom-style: var(--blm-tabs-bd-bottom-style);\n  border-bottom-width: var(--blm-tabs-bd-bottom-width);\n  color: var(--blm-tabs-link-clr);\n  display: flex;\n  justify-content: center;\n  margin-bottom: calc(-1*var(--blm-tabs-bd-bottom-width));\n  padding: var(--blm-tabs-link-p);\n  vertical-align: top;\n}\n\n.tabs a:hover {\n  border-bottom-color: var(--blm-tabs-link-hov-bd-bottom-clr);\n  color: var(--blm-tabs-link-hov-clr);\n}\n\n.tabs li {\n  display: block;\n}\n\n.tabs li.is-active a {\n  border-bottom-color: var(--blm-tabs-link-act-bd-bottom-clr);\n  color: var(--blm-tabs-link-act-clr);\n}\n\n.tabs ul {\n  align-items: center;\n  border-bottom-color: var(--blm-tabs-bd-bottom-clr);\n  border-bottom-style: var(--blm-tabs-bd-bottom-style);\n  border-bottom-width: var(--blm-tabs-bd-bottom-width);\n  display: flex;\n  flex-grow: 1;\n  flex-shrink: 0;\n  justify-content: flex-start;\n}\n\n.tabs ul.is-left {\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-center {\n  flex: none;\n  justify-content: center;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-right {\n  justify-content: flex-end;\n  padding-left: 0.75em;\n}\n\n.tabs .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.tabs .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.tabs.is-centered ul {\n  justify-content: center;\n}\n\n.tabs.is-right ul {\n  justify-content: flex-end;\n}\n\n.tabs.is-boxed a {\n  border: 1px solid transparent;\n  border-radius: var(--blm-tabs-boxed-link-radius) var(--blm-tabs-boxed-link-radius) 0 0;\n}\n\n.tabs.is-boxed a:hover {\n  background-color: var(--blm-tabs-boxed-link-hov-bg-clr);\n  border-bottom-color: var(--blm-tabs-boxed-link-hov-bd-bottom-clr);\n}\n\n.tabs.is-boxed li.is-active a {\n  background-color: var(--blm-tabs-boxed-link-act-bg-clr);\n  border-color: var(--blm-tabs-boxed-link-act-bd-clr);\n  border-bottom-color: var(--blm-tabs-boxed-link-act-bd-bottom-clr) !important;\n}\n\n.tabs.is-fullwidth li {\n  flex-grow: 1;\n  flex-shrink: 0;\n}\n\n.tabs.is-toggle a {\n  border-color: var(--blm-tabs-tgl-link-bd-clr);\n  border-style: var(--blm-tabs-tgl-link-bd-style);\n  border-width: var(--blm-tabs-tgl-link-bd-width);\n  margin-bottom: 0;\n  position: relative;\n}\n\n.tabs.is-toggle a:hover {\n  background-color: var(--blm-tabs-tgl-link-hov-bg-clr);\n  border-color: var(--blm-tabs-tgl-link-hov-bd-clr);\n  z-index: 2;\n}\n\n.tabs.is-toggle li + li {\n  margin-left: calc(-1*var(--blm-tabs-tgl-link-bd-width));\n}\n\n.tabs.is-toggle li:first-child a {\n  border-top-left-radius: var(--blm-tabs-tgl-link-radius);\n  border-bottom-left-radius: var(--blm-tabs-tgl-link-radius);\n}\n\n.tabs.is-toggle li:last-child a {\n  border-bottom-right-radius: var(--blm-tabs-tgl-link-radius);\n  border-top-right-radius: var(--blm-tabs-tgl-link-radius);\n}\n\n.tabs.is-toggle li.is-active a {\n  background-color: var(--blm-tabs-tgl-link-act-bg-clr);\n  border-color: var(--blm-tabs-tgl-link-act-bd-clr);\n  color: var(--blm-tabs-tgl-link-act-clr);\n  z-index: 1;\n}\n\n.tabs.is-toggle ul {\n  border-bottom: none;\n}\n\n.tabs.is-toggle.is-toggle-rounded li:first-child a {\n  border-bottom-left-radius: var(--blm-radius-rounded);\n  border-top-left-radius: var(--blm-radius-rounded);\n  padding-left: 1.25em;\n}\n\n.tabs.is-toggle.is-toggle-rounded li:last-child a {\n  border-bottom-right-radius: var(--blm-radius-rounded);\n  border-top-right-radius: var(--blm-radius-rounded);\n  padding-right: 1.25em;\n}\n\n.tabs.is-small {\n  font-size: var(--blm-s-small);\n}\n\n.tabs.is-medium {\n  font-size: var(--blm-s-medium);\n}\n\n.tabs.is-large {\n  font-size: var(--blm-s-lg);\n}\n\n.column {\n  display: block;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 1;\n  padding: var(--blm-column-gap);\n}\n\n.columns.is-mobile > .column.is-narrow {\n  flex: none;\n}\n\n.columns.is-mobile > .column.is-full {\n  flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-three-quarters {\n  flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-two-thirds {\n  flex: none;\n  width: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-half {\n  flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-one-third {\n  flex: none;\n  width: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-one-quarter {\n  flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-one-fifth {\n  flex: none;\n  width: 20%;\n}\n\n.columns.is-mobile > .column.is-two-fifths {\n  flex: none;\n  width: 40%;\n}\n\n.columns.is-mobile > .column.is-three-fifths {\n  flex: none;\n  width: 60%;\n}\n\n.columns.is-mobile > .column.is-four-fifths {\n  flex: none;\n  width: 80%;\n}\n\n.columns.is-mobile > .column.is-offset-three-quarters {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-two-thirds {\n  margin-left: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-offset-half {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-one-third {\n  margin-left: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-offset-one-quarter {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-one-fifth {\n  margin-left: 20%;\n}\n\n.columns.is-mobile > .column.is-offset-two-fifths {\n  margin-left: 40%;\n}\n\n.columns.is-mobile > .column.is-offset-three-fifths {\n  margin-left: 60%;\n}\n\n.columns.is-mobile > .column.is-offset-four-fifths {\n  margin-left: 80%;\n}\n\n.columns.is-mobile > .column.is-0 {\n  flex: none;\n  width: 0%;\n}\n\n.columns.is-mobile > .column.is-offset-0 {\n  margin-left: 0%;\n}\n\n.columns.is-mobile > .column.is-1 {\n  flex: none;\n  width: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-1 {\n  margin-left: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-2 {\n  flex: none;\n  width: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-2 {\n  margin-left: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-3 {\n  flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-3 {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-4 {\n  flex: none;\n  width: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-4 {\n  margin-left: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-5 {\n  flex: none;\n  width: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-5 {\n  margin-left: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-6 {\n  flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-6 {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-7 {\n  flex: none;\n  width: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-7 {\n  margin-left: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-8 {\n  flex: none;\n  width: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-8 {\n  margin-left: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-9 {\n  flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-9 {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-10 {\n  flex: none;\n  width: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-10 {\n  margin-left: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-11 {\n  flex: none;\n  width: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-11 {\n  margin-left: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-12 {\n  flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-offset-12 {\n  margin-left: 100%;\n}\n\n@media screen and (max-width: 768px) {\n  .column.is-narrow-mobile {\n    flex: none;\n  }\n  .column.is-full-mobile {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-mobile {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-mobile {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-mobile {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-mobile {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-mobile {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-mobile {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-mobile {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-mobile {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-mobile {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-mobile {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-mobile {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-mobile {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-mobile {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-mobile {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-mobile {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-mobile {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-mobile {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-mobile {\n    margin-left: 80%;\n  }\n  .column.is-0-mobile {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-mobile {\n    margin-left: 0%;\n  }\n  .column.is-1-mobile {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-mobile {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-mobile {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-mobile {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-mobile {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-mobile {\n    margin-left: 25%;\n  }\n  .column.is-4-mobile {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-mobile {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-mobile {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-mobile {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-mobile {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-mobile {\n    margin-left: 50%;\n  }\n  .column.is-7-mobile {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-mobile {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-mobile {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-mobile {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-mobile {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-mobile {\n    margin-left: 75%;\n  }\n  .column.is-10-mobile {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-mobile {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-mobile {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-mobile {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-mobile {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-mobile {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .column.is-narrow, .column.is-narrow-tablet {\n    flex: none;\n  }\n  .column.is-full, .column.is-full-tablet {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters, .column.is-three-quarters-tablet {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds, .column.is-two-thirds-tablet {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half, .column.is-half-tablet {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third, .column.is-one-third-tablet {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter, .column.is-one-quarter-tablet {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth, .column.is-one-fifth-tablet {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths, .column.is-two-fifths-tablet {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths, .column.is-three-fifths-tablet {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths, .column.is-four-fifths-tablet {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters, .column.is-offset-three-quarters-tablet {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds, .column.is-offset-two-thirds-tablet {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half, .column.is-offset-half-tablet {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third, .column.is-offset-one-third-tablet {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter, .column.is-offset-one-quarter-tablet {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth, .column.is-offset-one-fifth-tablet {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths, .column.is-offset-two-fifths-tablet {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths, .column.is-offset-three-fifths-tablet {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths, .column.is-offset-four-fifths-tablet {\n    margin-left: 80%;\n  }\n  .column.is-0, .column.is-0-tablet {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0, .column.is-offset-0-tablet {\n    margin-left: 0%;\n  }\n  .column.is-1, .column.is-1-tablet {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1, .column.is-offset-1-tablet {\n    margin-left: 8.33333%;\n  }\n  .column.is-2, .column.is-2-tablet {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2, .column.is-offset-2-tablet {\n    margin-left: 16.66667%;\n  }\n  .column.is-3, .column.is-3-tablet {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3, .column.is-offset-3-tablet {\n    margin-left: 25%;\n  }\n  .column.is-4, .column.is-4-tablet {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4, .column.is-offset-4-tablet {\n    margin-left: 33.33333%;\n  }\n  .column.is-5, .column.is-5-tablet {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5, .column.is-offset-5-tablet {\n    margin-left: 41.66667%;\n  }\n  .column.is-6, .column.is-6-tablet {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6, .column.is-offset-6-tablet {\n    margin-left: 50%;\n  }\n  .column.is-7, .column.is-7-tablet {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7, .column.is-offset-7-tablet {\n    margin-left: 58.33333%;\n  }\n  .column.is-8, .column.is-8-tablet {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8, .column.is-offset-8-tablet {\n    margin-left: 66.66667%;\n  }\n  .column.is-9, .column.is-9-tablet {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9, .column.is-offset-9-tablet {\n    margin-left: 75%;\n  }\n  .column.is-10, .column.is-10-tablet {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10, .column.is-offset-10-tablet {\n    margin-left: 83.33333%;\n  }\n  .column.is-11, .column.is-11-tablet {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11, .column.is-offset-11-tablet {\n    margin-left: 91.66667%;\n  }\n  .column.is-12, .column.is-12-tablet {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12, .column.is-offset-12-tablet {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .column.is-narrow-touch {\n    flex: none;\n  }\n  .column.is-full-touch {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-touch {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-touch {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-touch {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-touch {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-touch {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-touch {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-touch {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-touch {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-touch {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-touch {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-touch {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-touch {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-touch {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-touch {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-touch {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-touch {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-touch {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-touch {\n    margin-left: 80%;\n  }\n  .column.is-0-touch {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-touch {\n    margin-left: 0%;\n  }\n  .column.is-1-touch {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-touch {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-touch {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-touch {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-touch {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-touch {\n    margin-left: 25%;\n  }\n  .column.is-4-touch {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-touch {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-touch {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-touch {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-touch {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-touch {\n    margin-left: 50%;\n  }\n  .column.is-7-touch {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-touch {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-touch {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-touch {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-touch {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-touch {\n    margin-left: 75%;\n  }\n  .column.is-10-touch {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-touch {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-touch {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-touch {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-touch {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-touch {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .column.is-narrow-desktop {\n    flex: none;\n  }\n  .column.is-full-desktop {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-desktop {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-desktop {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-desktop {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-desktop {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-desktop {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-desktop {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-desktop {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-desktop {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-desktop {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-desktop {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-desktop {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-desktop {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-desktop {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-desktop {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-desktop {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-desktop {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-desktop {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-desktop {\n    margin-left: 80%;\n  }\n  .column.is-0-desktop {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-desktop {\n    margin-left: 0%;\n  }\n  .column.is-1-desktop {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-desktop {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-desktop {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-desktop {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-desktop {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-desktop {\n    margin-left: 25%;\n  }\n  .column.is-4-desktop {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-desktop {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-desktop {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-desktop {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-desktop {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-desktop {\n    margin-left: 50%;\n  }\n  .column.is-7-desktop {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-desktop {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-desktop {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-desktop {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-desktop {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-desktop {\n    margin-left: 75%;\n  }\n  .column.is-10-desktop {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-desktop {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-desktop {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-desktop {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-desktop {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-desktop {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .column.is-narrow-widescreen {\n    flex: none;\n  }\n  .column.is-full-widescreen {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-widescreen {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-widescreen {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-widescreen {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-widescreen {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-widescreen {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-widescreen {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-widescreen {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-widescreen {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-widescreen {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-widescreen {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-widescreen {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-widescreen {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-widescreen {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-widescreen {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-widescreen {\n    margin-left: 80%;\n  }\n  .column.is-0-widescreen {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-widescreen {\n    margin-left: 0%;\n  }\n  .column.is-1-widescreen {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-widescreen {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-widescreen {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-widescreen {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-widescreen {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-4-widescreen {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-widescreen {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-widescreen {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-widescreen {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-widescreen {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-7-widescreen {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-widescreen {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-widescreen {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-widescreen {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-widescreen {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-10-widescreen {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-widescreen {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-widescreen {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-widescreen {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-widescreen {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-widescreen {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .column.is-narrow-fullhd {\n    flex: none;\n  }\n  .column.is-full-fullhd {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-fullhd {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-fullhd {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-fullhd {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-fullhd {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-fullhd {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-fullhd {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-fullhd {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-fullhd {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-fullhd {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-fullhd {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-fullhd {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-fullhd {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-fullhd {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-fullhd {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-fullhd {\n    margin-left: 80%;\n  }\n  .column.is-0-fullhd {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-fullhd {\n    margin-left: 0%;\n  }\n  .column.is-1-fullhd {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-fullhd {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-fullhd {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-fullhd {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-fullhd {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-4-fullhd {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-fullhd {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-fullhd {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-fullhd {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-fullhd {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-7-fullhd {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-fullhd {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-fullhd {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-fullhd {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-fullhd {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-10-fullhd {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-fullhd {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-fullhd {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-fullhd {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-fullhd {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-fullhd {\n    margin-left: 100%;\n  }\n}\n\n.columns {\n  margin: calc(-1*var(--blm-column-gap));\n}\n\n.columns:not(:last-child) {\n  margin-bottom: calc(1.5rem - var(--blm-column-gap));\n}\n\n.columns.is-centered {\n  justify-content: center;\n}\n\n.columns.is-gapless {\n  margin-left: 0;\n  margin-right: 0;\n  margin-top: 0;\n}\n\n.columns.is-gapless > .column {\n  margin: 0;\n  padding: 0 !important;\n}\n\n.columns.is-gapless:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.columns.is-gapless:last-child {\n  margin-bottom: 0;\n}\n\n.columns.is-mobile {\n  display: flex;\n}\n\n.columns.is-multiline {\n  flex-wrap: wrap;\n}\n\n.columns.is-vcentered {\n  align-items: center;\n}\n\n@media screen and (min-width: 769px), print {\n  .columns:not(.is-desktop) {\n    display: flex;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-desktop {\n    display: flex;\n  }\n}\n\n.columns.is-variable {\n  --columnGap: 0.75rem;\n  margin-left: calc(-1*var(--columnGap));\n  margin-right: calc(-1*var(--columnGap));\n}\n\n.columns.is-variable .column {\n  padding-left: var(--columnGap);\n  padding-right: var(--columnGap);\n}\n\n.columns.is-variable.is-0 {\n  --columnGap: 0rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-0-mobile {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-0-tablet {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-0-tablet-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-0-touch {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-0-desktop {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-0-desktop-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-0-widescreen {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-0-widescreen-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-0-fullhd {\n    --columnGap: 0rem;\n  }\n}\n\n.columns.is-variable.is-1 {\n  --columnGap: 0.25rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-1-mobile {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-1-tablet {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-1-tablet-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-1-touch {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-1-desktop {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-1-desktop-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-1-widescreen {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-1-widescreen-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-1-fullhd {\n    --columnGap: 0.25rem;\n  }\n}\n\n.columns.is-variable.is-2 {\n  --columnGap: 0.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-2-mobile {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-2-tablet {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-2-tablet-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-2-touch {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-2-desktop {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-2-desktop-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-2-widescreen {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-2-widescreen-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-2-fullhd {\n    --columnGap: 0.5rem;\n  }\n}\n\n.columns.is-variable.is-3 {\n  --columnGap: 0.75rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-3-mobile {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-3-tablet {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-3-tablet-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-3-touch {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-3-desktop {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-3-desktop-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-3-widescreen {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-3-widescreen-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-3-fullhd {\n    --columnGap: 0.75rem;\n  }\n}\n\n.columns.is-variable.is-4 {\n  --columnGap: 1rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-4-mobile {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-4-tablet {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-4-tablet-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-4-touch {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-4-desktop {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-4-desktop-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-4-widescreen {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-4-widescreen-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-4-fullhd {\n    --columnGap: 1rem;\n  }\n}\n\n.columns.is-variable.is-5 {\n  --columnGap: 1.25rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-5-mobile {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-5-tablet {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-5-tablet-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-5-touch {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-5-desktop {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-5-desktop-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-5-widescreen {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-5-widescreen-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-5-fullhd {\n    --columnGap: 1.25rem;\n  }\n}\n\n.columns.is-variable.is-6 {\n  --columnGap: 1.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-6-mobile {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-6-tablet {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-6-tablet-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-6-touch {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-6-desktop {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-6-desktop-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-6-widescreen {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-6-widescreen-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-6-fullhd {\n    --columnGap: 1.5rem;\n  }\n}\n\n.columns.is-variable.is-7 {\n  --columnGap: 1.75rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-7-mobile {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-7-tablet {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-7-tablet-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-7-touch {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-7-desktop {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-7-desktop-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-7-widescreen {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-7-widescreen-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-7-fullhd {\n    --columnGap: 1.75rem;\n  }\n}\n\n.columns.is-variable.is-8 {\n  --columnGap: 2rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-8-mobile {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-8-tablet {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-8-tablet-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-8-touch {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-8-desktop {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-8-desktop-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-8-widescreen {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-8-widescreen-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-8-fullhd {\n    --columnGap: 2rem;\n  }\n}\n\n.tile {\n  align-items: stretch;\n  display: block;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 1;\n  min-height: -webkit-min-content;\n  min-height: -moz-min-content;\n  min-height: min-content;\n}\n\n.tile.is-ancestor {\n  margin: calc(var(--blm-tile-spacing)*-1);\n}\n\n.tile.is-ancestor:not(:last-child) {\n  margin-bottom: var(--blm-tile-spacing);\n}\n\n.tile.is-child {\n  margin: 0 !important;\n}\n\n.tile.is-parent {\n  padding: var(--blm-tile-spacing);\n}\n\n.tile.is-vertical {\n  flex-direction: column;\n}\n\n.tile.is-vertical > .tile.is-child:not(:last-child) {\n  margin-bottom: 1.5rem !important;\n}\n\n@media screen and (min-width: 769px), print {\n  .tile:not(.is-child) {\n    display: flex;\n  }\n  .tile.is-1 {\n    flex: none;\n    width: 8.33333%;\n  }\n  .tile.is-2 {\n    flex: none;\n    width: 16.66667%;\n  }\n  .tile.is-3 {\n    flex: none;\n    width: 25%;\n  }\n  .tile.is-4 {\n    flex: none;\n    width: 33.33333%;\n  }\n  .tile.is-5 {\n    flex: none;\n    width: 41.66667%;\n  }\n  .tile.is-6 {\n    flex: none;\n    width: 50%;\n  }\n  .tile.is-7 {\n    flex: none;\n    width: 58.33333%;\n  }\n  .tile.is-8 {\n    flex: none;\n    width: 66.66667%;\n  }\n  .tile.is-9 {\n    flex: none;\n    width: 75%;\n  }\n  .tile.is-10 {\n    flex: none;\n    width: 83.33333%;\n  }\n  .tile.is-11 {\n    flex: none;\n    width: 91.66667%;\n  }\n  .tile.is-12 {\n    flex: none;\n    width: 100%;\n  }\n}\n\n.has-text-white {\n  color: var(--blm-white) !important;\n}\n\na.has-text-white:hover, a.has-text-white:focus {\n  color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 10%), var(--blm-white-a)) !important;\n}\n\n.has-background-white {\n  background-color: var(--blm-white) !important;\n}\n\n.has-text-black {\n  color: var(--blm-black) !important;\n}\n\na.has-text-black:hover, a.has-text-black:focus {\n  color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 10%), var(--blm-black-a)) !important;\n}\n\n.has-background-black {\n  background-color: var(--blm-black) !important;\n}\n\n.has-text-light {\n  color: var(--blm-light) !important;\n}\n\na.has-text-light:hover, a.has-text-light:focus {\n  color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 10%), var(--blm-light-a)) !important;\n}\n\n.has-background-light {\n  background-color: var(--blm-light) !important;\n}\n\n.has-text-dark {\n  color: var(--blm-dark) !important;\n}\n\na.has-text-dark:hover, a.has-text-dark:focus {\n  color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 10%), var(--blm-dark-a)) !important;\n}\n\n.has-background-dark {\n  background-color: var(--blm-dark) !important;\n}\n\n.has-text-primary {\n  color: var(--blm-prim) !important;\n}\n\na.has-text-primary:hover, a.has-text-primary:focus {\n  color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 10%), var(--blm-prim-a)) !important;\n}\n\n.has-background-primary {\n  background-color: var(--blm-prim) !important;\n}\n\n.has-text-primary-light {\n  color: var(--blm-prim-light) !important;\n}\n\na.has-text-primary-light:hover, a.has-text-primary-light:focus {\n  color: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), calc(var(--blm-prim-light-l) - 10%), var(--blm-prim-light-a)) !important;\n}\n\n.has-background-primary-light {\n  background-color: var(--blm-prim-light) !important;\n}\n\n.has-text-primary-dark {\n  color: var(--blm-prim-dark) !important;\n}\n\na.has-text-primary-dark:hover, a.has-text-primary-dark:focus {\n  color: hsla(var(--blm-prim-dark-h), var(--blm-prim-dark-s), calc(var(--blm-prim-dark-l) + 10%), var(--blm-prim-dark-a)) !important;\n}\n\n.has-background-primary-dark {\n  background-color: var(--blm-prim-dark) !important;\n}\n\n.has-text-link {\n  color: var(--blm-link) !important;\n}\n\na.has-text-link:hover, a.has-text-link:focus {\n  color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 10%), var(--blm-link-a)) !important;\n}\n\n.has-background-link {\n  background-color: var(--blm-link) !important;\n}\n\n.has-text-link-light {\n  color: var(--blm-link-light) !important;\n}\n\na.has-text-link-light:hover, a.has-text-link-light:focus {\n  color: hsla(var(--blm-link-light-h), var(--blm-link-light-s), calc(var(--blm-link-light-l) - 10%), var(--blm-link-light-a)) !important;\n}\n\n.has-background-link-light {\n  background-color: var(--blm-link-light) !important;\n}\n\n.has-text-link-dark {\n  color: var(--blm-link-dark) !important;\n}\n\na.has-text-link-dark:hover, a.has-text-link-dark:focus {\n  color: hsla(var(--blm-link-dark-h), var(--blm-link-dark-s), calc(var(--blm-link-dark-l) + 10%), var(--blm-link-dark-a)) !important;\n}\n\n.has-background-link-dark {\n  background-color: var(--blm-link-dark) !important;\n}\n\n.has-text-info {\n  color: var(--blm-info) !important;\n}\n\na.has-text-info:hover, a.has-text-info:focus {\n  color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 10%), var(--blm-info-a)) !important;\n}\n\n.has-background-info {\n  background-color: var(--blm-info) !important;\n}\n\n.has-text-info-light {\n  color: var(--blm-info-light) !important;\n}\n\na.has-text-info-light:hover, a.has-text-info-light:focus {\n  color: hsla(var(--blm-info-light-h), var(--blm-info-light-s), calc(var(--blm-info-light-l) - 10%), var(--blm-info-light-a)) !important;\n}\n\n.has-background-info-light {\n  background-color: var(--blm-info-light) !important;\n}\n\n.has-text-info-dark {\n  color: var(--blm-info-dark) !important;\n}\n\na.has-text-info-dark:hover, a.has-text-info-dark:focus {\n  color: hsla(var(--blm-info-dark-h), var(--blm-info-dark-s), calc(var(--blm-info-dark-l) + 10%), var(--blm-info-dark-a)) !important;\n}\n\n.has-background-info-dark {\n  background-color: var(--blm-info-dark) !important;\n}\n\n.has-text-success {\n  color: var(--blm-sucs) !important;\n}\n\na.has-text-success:hover, a.has-text-success:focus {\n  color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 10%), var(--blm-sucs-a)) !important;\n}\n\n.has-background-success {\n  background-color: var(--blm-sucs) !important;\n}\n\n.has-text-success-light {\n  color: var(--blm-sucs-light) !important;\n}\n\na.has-text-success-light:hover, a.has-text-success-light:focus {\n  color: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), calc(var(--blm-sucs-light-l) - 10%), var(--blm-sucs-light-a)) !important;\n}\n\n.has-background-success-light {\n  background-color: var(--blm-sucs-light) !important;\n}\n\n.has-text-success-dark {\n  color: var(--blm-sucs-dark) !important;\n}\n\na.has-text-success-dark:hover, a.has-text-success-dark:focus {\n  color: hsla(var(--blm-sucs-dark-h), var(--blm-sucs-dark-s), calc(var(--blm-sucs-dark-l) + 10%), var(--blm-sucs-dark-a)) !important;\n}\n\n.has-background-success-dark {\n  background-color: var(--blm-sucs-dark) !important;\n}\n\n.has-text-warning {\n  color: var(--blm-warn) !important;\n}\n\na.has-text-warning:hover, a.has-text-warning:focus {\n  color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 10%), var(--blm-warn-a)) !important;\n}\n\n.has-background-warning {\n  background-color: var(--blm-warn) !important;\n}\n\n.has-text-warning-light {\n  color: var(--blm-warn-light) !important;\n}\n\na.has-text-warning-light:hover, a.has-text-warning-light:focus {\n  color: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), calc(var(--blm-warn-light-l) - 10%), var(--blm-warn-light-a)) !important;\n}\n\n.has-background-warning-light {\n  background-color: var(--blm-warn-light) !important;\n}\n\n.has-text-warning-dark {\n  color: var(--blm-warn-dark) !important;\n}\n\na.has-text-warning-dark:hover, a.has-text-warning-dark:focus {\n  color: hsla(var(--blm-warn-dark-h), var(--blm-warn-dark-s), calc(var(--blm-warn-dark-l) + 10%), var(--blm-warn-dark-a)) !important;\n}\n\n.has-background-warning-dark {\n  background-color: var(--blm-warn-dark) !important;\n}\n\n.has-text-danger {\n  color: var(--blm-dang) !important;\n}\n\na.has-text-danger:hover, a.has-text-danger:focus {\n  color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 10%), var(--blm-dang-a)) !important;\n}\n\n.has-background-danger {\n  background-color: var(--blm-dang) !important;\n}\n\n.has-text-danger-light {\n  color: var(--blm-dang-light) !important;\n}\n\na.has-text-danger-light:hover, a.has-text-danger-light:focus {\n  color: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), calc(var(--blm-dang-light-l) - 10%), var(--blm-dang-light-a)) !important;\n}\n\n.has-background-danger-light {\n  background-color: var(--blm-dang-light) !important;\n}\n\n.has-text-danger-dark {\n  color: var(--blm-dang-dark) !important;\n}\n\na.has-text-danger-dark:hover, a.has-text-danger-dark:focus {\n  color: hsla(var(--blm-dang-dark-h), var(--blm-dang-dark-s), calc(var(--blm-dang-dark-l) + 10%), var(--blm-dang-dark-a)) !important;\n}\n\n.has-background-danger-dark {\n  background-color: var(--blm-dang-dark) !important;\n}\n\n.has-text-black-bis {\n  color: var(--blm-black-bis) !important;\n}\n\n.has-background-black-bis {\n  background-color: var(--blm-black-bis) !important;\n}\n\n.has-text-black-ter {\n  color: var(--blm-black-ter) !important;\n}\n\n.has-background-black-ter {\n  background-color: var(--blm-black-ter) !important;\n}\n\n.has-text-grey-darker {\n  color: var(--blm-grey-darker) !important;\n}\n\n.has-background-grey-darker {\n  background-color: var(--blm-grey-darker) !important;\n}\n\n.has-text-grey-dark {\n  color: var(--blm-grey-dark) !important;\n}\n\n.has-background-grey-dark {\n  background-color: var(--blm-grey-dark) !important;\n}\n\n.has-text-grey {\n  color: var(--blm-grey) !important;\n}\n\n.has-background-grey {\n  background-color: var(--blm-grey) !important;\n}\n\n.has-text-grey-light {\n  color: var(--blm-grey-light) !important;\n}\n\n.has-background-grey-light {\n  background-color: var(--blm-grey-light) !important;\n}\n\n.has-text-grey-lighter {\n  color: var(--blm-grey-lighter) !important;\n}\n\n.has-background-grey-lighter {\n  background-color: var(--blm-grey-lighter) !important;\n}\n\n.has-text-white-ter {\n  color: var(--blm-white-ter) !important;\n}\n\n.has-background-white-ter {\n  background-color: var(--blm-white-ter) !important;\n}\n\n.has-text-white-bis {\n  color: var(--blm-white-bis) !important;\n}\n\n.has-background-white-bis {\n  background-color: var(--blm-white-bis) !important;\n}\n\n.is-clearfix::after {\n  clear: both;\n  content: \" \";\n  display: table;\n}\n\n.is-pulled-left {\n  float: left !important;\n}\n\n.is-pulled-right {\n  float: right !important;\n}\n\n.is-radiusless {\n  border-radius: 0 !important;\n}\n\n.is-shadowless {\n  box-shadow: none !important;\n}\n\n.is-clipped {\n  overflow: hidden !important;\n}\n\n.is-relative {\n  position: relative !important;\n}\n\n.is-marginless {\n  margin: 0 !important;\n}\n\n.is-paddingless {\n  padding: 0 !important;\n}\n\n.mt-0 {\n  margin-top: 0 !important;\n}\n\n.mr-0 {\n  margin-right: 0 !important;\n}\n\n.mb-0 {\n  margin-bottom: 0 !important;\n}\n\n.ml-0 {\n  margin-left: 0 !important;\n}\n\n.mx-0 {\n  margin-left: 0 !important;\n  margin-right: 0 !important;\n}\n\n.my-0 {\n  margin-top: 0 !important;\n  margin-bottom: 0 !important;\n}\n\n.mt-1 {\n  margin-top: 0.25rem !important;\n}\n\n.mr-1 {\n  margin-right: 0.25rem !important;\n}\n\n.mb-1 {\n  margin-bottom: 0.25rem !important;\n}\n\n.ml-1 {\n  margin-left: 0.25rem !important;\n}\n\n.mx-1 {\n  margin-left: 0.25rem !important;\n  margin-right: 0.25rem !important;\n}\n\n.my-1 {\n  margin-top: 0.25rem !important;\n  margin-bottom: 0.25rem !important;\n}\n\n.mt-2 {\n  margin-top: 0.5rem !important;\n}\n\n.mr-2 {\n  margin-right: 0.5rem !important;\n}\n\n.mb-2 {\n  margin-bottom: 0.5rem !important;\n}\n\n.ml-2 {\n  margin-left: 0.5rem !important;\n}\n\n.mx-2 {\n  margin-left: 0.5rem !important;\n  margin-right: 0.5rem !important;\n}\n\n.my-2 {\n  margin-top: 0.5rem !important;\n  margin-bottom: 0.5rem !important;\n}\n\n.mt-3 {\n  margin-top: 0.75rem !important;\n}\n\n.mr-3 {\n  margin-right: 0.75rem !important;\n}\n\n.mb-3 {\n  margin-bottom: 0.75rem !important;\n}\n\n.ml-3 {\n  margin-left: 0.75rem !important;\n}\n\n.mx-3 {\n  margin-left: 0.75rem !important;\n  margin-right: 0.75rem !important;\n}\n\n.my-3 {\n  margin-top: 0.75rem !important;\n  margin-bottom: 0.75rem !important;\n}\n\n.mt-4 {\n  margin-top: 1rem !important;\n}\n\n.mr-4 {\n  margin-right: 1rem !important;\n}\n\n.mb-4 {\n  margin-bottom: 1rem !important;\n}\n\n.ml-4 {\n  margin-left: 1rem !important;\n}\n\n.mx-4 {\n  margin-left: 1rem !important;\n  margin-right: 1rem !important;\n}\n\n.my-4 {\n  margin-top: 1rem !important;\n  margin-bottom: 1rem !important;\n}\n\n.mt-5 {\n  margin-top: 1.5rem !important;\n}\n\n.mr-5 {\n  margin-right: 1.5rem !important;\n}\n\n.mb-5 {\n  margin-bottom: 1.5rem !important;\n}\n\n.ml-5 {\n  margin-left: 1.5rem !important;\n}\n\n.mx-5 {\n  margin-left: 1.5rem !important;\n  margin-right: 1.5rem !important;\n}\n\n.my-5 {\n  margin-top: 1.5rem !important;\n  margin-bottom: 1.5rem !important;\n}\n\n.mt-6 {\n  margin-top: 3rem !important;\n}\n\n.mr-6 {\n  margin-right: 3rem !important;\n}\n\n.mb-6 {\n  margin-bottom: 3rem !important;\n}\n\n.ml-6 {\n  margin-left: 3rem !important;\n}\n\n.mx-6 {\n  margin-left: 3rem !important;\n  margin-right: 3rem !important;\n}\n\n.my-6 {\n  margin-top: 3rem !important;\n  margin-bottom: 3rem !important;\n}\n\n.pt-0 {\n  padding-top: 0 !important;\n}\n\n.pr-0 {\n  padding-right: 0 !important;\n}\n\n.pb-0 {\n  padding-bottom: 0 !important;\n}\n\n.pl-0 {\n  padding-left: 0 !important;\n}\n\n.px-0 {\n  padding-left: 0 !important;\n  padding-right: 0 !important;\n}\n\n.py-0 {\n  padding-top: 0 !important;\n  padding-bottom: 0 !important;\n}\n\n.pt-1 {\n  padding-top: 0.25rem !important;\n}\n\n.pr-1 {\n  padding-right: 0.25rem !important;\n}\n\n.pb-1 {\n  padding-bottom: 0.25rem !important;\n}\n\n.pl-1 {\n  padding-left: 0.25rem !important;\n}\n\n.px-1 {\n  padding-left: 0.25rem !important;\n  padding-right: 0.25rem !important;\n}\n\n.py-1 {\n  padding-top: 0.25rem !important;\n  padding-bottom: 0.25rem !important;\n}\n\n.pt-2 {\n  padding-top: 0.5rem !important;\n}\n\n.pr-2 {\n  padding-right: 0.5rem !important;\n}\n\n.pb-2 {\n  padding-bottom: 0.5rem !important;\n}\n\n.pl-2 {\n  padding-left: 0.5rem !important;\n}\n\n.px-2 {\n  padding-left: 0.5rem !important;\n  padding-right: 0.5rem !important;\n}\n\n.py-2 {\n  padding-top: 0.5rem !important;\n  padding-bottom: 0.5rem !important;\n}\n\n.pt-3 {\n  padding-top: 0.75rem !important;\n}\n\n.pr-3 {\n  padding-right: 0.75rem !important;\n}\n\n.pb-3 {\n  padding-bottom: 0.75rem !important;\n}\n\n.pl-3 {\n  padding-left: 0.75rem !important;\n}\n\n.px-3 {\n  padding-left: 0.75rem !important;\n  padding-right: 0.75rem !important;\n}\n\n.py-3 {\n  padding-top: 0.75rem !important;\n  padding-bottom: 0.75rem !important;\n}\n\n.pt-4 {\n  padding-top: 1rem !important;\n}\n\n.pr-4 {\n  padding-right: 1rem !important;\n}\n\n.pb-4 {\n  padding-bottom: 1rem !important;\n}\n\n.pl-4 {\n  padding-left: 1rem !important;\n}\n\n.px-4 {\n  padding-left: 1rem !important;\n  padding-right: 1rem !important;\n}\n\n.py-4 {\n  padding-top: 1rem !important;\n  padding-bottom: 1rem !important;\n}\n\n.pt-5 {\n  padding-top: 1.5rem !important;\n}\n\n.pr-5 {\n  padding-right: 1.5rem !important;\n}\n\n.pb-5 {\n  padding-bottom: 1.5rem !important;\n}\n\n.pl-5 {\n  padding-left: 1.5rem !important;\n}\n\n.px-5 {\n  padding-left: 1.5rem !important;\n  padding-right: 1.5rem !important;\n}\n\n.py-5 {\n  padding-top: 1.5rem !important;\n  padding-bottom: 1.5rem !important;\n}\n\n.pt-6 {\n  padding-top: 3rem !important;\n}\n\n.pr-6 {\n  padding-right: 3rem !important;\n}\n\n.pb-6 {\n  padding-bottom: 3rem !important;\n}\n\n.pl-6 {\n  padding-left: 3rem !important;\n}\n\n.px-6 {\n  padding-left: 3rem !important;\n  padding-right: 3rem !important;\n}\n\n.py-6 {\n  padding-top: 3rem !important;\n  padding-bottom: 3rem !important;\n}\n\n.is-size-1 {\n  font-size: var(--blm-s-1) !important;\n}\n\n.is-size-2 {\n  font-size: var(--blm-s-2) !important;\n}\n\n.is-size-3 {\n  font-size: var(--blm-s-3) !important;\n}\n\n.is-size-4 {\n  font-size: var(--blm-s-4) !important;\n}\n\n.is-size-5 {\n  font-size: var(--blm-s-5) !important;\n}\n\n.is-size-6 {\n  font-size: var(--blm-s-6) !important;\n}\n\n.is-size-7 {\n  font-size: var(--blm-s-7) !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-size-1-mobile {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-mobile {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-mobile {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-mobile {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-mobile {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-mobile {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-mobile {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-size-1-tablet {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-tablet {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-tablet {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-tablet {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-tablet {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-tablet {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-tablet {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-size-1-touch {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-touch {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-touch {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-touch {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-touch {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-touch {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-touch {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-size-1-desktop {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-desktop {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-desktop {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-desktop {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-desktop {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-desktop {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-desktop {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-size-1-widescreen {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-widescreen {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-widescreen {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-widescreen {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-widescreen {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-widescreen {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-widescreen {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-size-1-fullhd {\n    font-size: var(--blm-s-1) !important;\n  }\n  .is-size-2-fullhd {\n    font-size: var(--blm-s-2) !important;\n  }\n  .is-size-3-fullhd {\n    font-size: var(--blm-s-3) !important;\n  }\n  .is-size-4-fullhd {\n    font-size: var(--blm-s-4) !important;\n  }\n  .is-size-5-fullhd {\n    font-size: var(--blm-s-5) !important;\n  }\n  .is-size-6-fullhd {\n    font-size: var(--blm-s-6) !important;\n  }\n  .is-size-7-fullhd {\n    font-size: var(--blm-s-7) !important;\n  }\n}\n\n.has-text-centered {\n  text-align: center !important;\n}\n\n.has-text-justified {\n  text-align: justify !important;\n}\n\n.has-text-left {\n  text-align: left !important;\n}\n\n.has-text-right {\n  text-align: right !important;\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-centered-mobile {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-centered-tablet {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-centered-tablet-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-centered-touch {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-centered-desktop {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-centered-desktop-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-centered-widescreen {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-centered-widescreen-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-centered-fullhd {\n    text-align: center !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-justified-mobile {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-justified-tablet {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-justified-tablet-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-justified-touch {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-justified-desktop {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-justified-desktop-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-justified-widescreen {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-justified-widescreen-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-justified-fullhd {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-left-mobile {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-left-tablet {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-left-tablet-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-left-touch {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-left-desktop {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-left-desktop-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-left-widescreen {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-left-widescreen-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-left-fullhd {\n    text-align: left !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-right-mobile {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-right-tablet {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-right-tablet-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-right-touch {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-right-desktop {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-right-desktop-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-right-widescreen {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-right-widescreen-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-right-fullhd {\n    text-align: right !important;\n  }\n}\n\n.is-capitalized {\n  text-transform: capitalize !important;\n}\n\n.is-lowercase {\n  text-transform: lowercase !important;\n}\n\n.is-uppercase {\n  text-transform: uppercase !important;\n}\n\n.is-italic {\n  font-style: italic !important;\n}\n\n.has-text-weight-light {\n  font-weight: var(--blm-weight-light) !important;\n}\n\n.has-text-weight-normal {\n  font-weight: var(--blm-weight-normal) !important;\n}\n\n.has-text-weight-medium {\n  font-weight: var(--blm-weight-medium) !important;\n}\n\n.has-text-weight-semibold {\n  font-weight: var(--blm-weight-semibold) !important;\n}\n\n.has-text-weight-bold {\n  font-weight: var(--blm-weight-bold) !important;\n}\n\n.is-family-primary {\n  font-family: var(--blm-family-prim) !important;\n}\n\n.is-family-secondary {\n  font-family: var(--blm-family-secondary) !important;\n}\n\n.is-family-sans-serif {\n  font-family: var(--blm-family-sans-serif) !important;\n}\n\n.is-family-monospace {\n  font-family: var(--blm-family-monospace) !important;\n}\n\n.is-family-code {\n  font-family: var(--blm-family-code) !important;\n}\n\n.is-block {\n  display: block !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-block-mobile {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-block-tablet {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-block-tablet-only {\n    display: block !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-block-touch {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-block-desktop {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-block-desktop-only {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-block-widescreen {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-block-widescreen-only {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-block-fullhd {\n    display: block !important;\n  }\n}\n\n.is-flex {\n  display: flex !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-flex-mobile {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-flex-tablet {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-flex-tablet-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-flex-touch {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-flex-desktop {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-flex-desktop-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-flex-widescreen {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-flex-widescreen-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-flex-fullhd {\n    display: flex !important;\n  }\n}\n\n.is-inline {\n  display: inline !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-mobile {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-tablet {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-tablet-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-touch {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-desktop {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-desktop-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-widescreen {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-widescreen-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-fullhd {\n    display: inline !important;\n  }\n}\n\n.is-inline-block {\n  display: inline-block !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-block-mobile {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-block-tablet {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-block-tablet-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-block-touch {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-block-desktop {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-block-desktop-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-block-widescreen {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-block-widescreen-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-block-fullhd {\n    display: inline-block !important;\n  }\n}\n\n.is-inline-flex {\n  display: inline-flex !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-flex-mobile {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-flex-tablet {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-flex-tablet-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-flex-touch {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-flex-desktop {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-flex-desktop-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-flex-widescreen {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-flex-widescreen-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-flex-fullhd {\n    display: inline-flex !important;\n  }\n}\n\n.is-hidden {\n  display: none !important;\n}\n\n.is-sr-only {\n  border: none !important;\n  clip: rect(0, 0, 0, 0) !important;\n  height: 0.01em !important;\n  overflow: hidden !important;\n  padding: 0 !important;\n  position: absolute !important;\n  white-space: nowrap !important;\n  width: 0.01em !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-hidden-mobile {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-hidden-tablet {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-hidden-tablet-only {\n    display: none !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-hidden-touch {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-hidden-desktop {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-hidden-desktop-only {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-hidden-widescreen {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-hidden-widescreen-only {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-hidden-fullhd {\n    display: none !important;\n  }\n}\n\n.is-invisible {\n  visibility: hidden !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-invisible-mobile {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-invisible-tablet {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-invisible-tablet-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-invisible-touch {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-invisible-desktop {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-invisible-desktop-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-invisible-widescreen {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-invisible-widescreen-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-invisible-fullhd {\n    visibility: hidden !important;\n  }\n}\n\n.hero {\n  align-items: stretch;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n}\n\n.hero .navbar {\n  background: none;\n}\n\n.hero .tabs ul {\n  border-bottom: none;\n}\n\n.hero.is-white {\n  background-color: var(--blm-white);\n  color: var(--blm-white-inv);\n}\n\n.hero.is-white a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-white strong {\n  color: inherit;\n}\n\n.hero.is-white .title {\n  color: var(--blm-white-inv);\n}\n\n.hero.is-white .subtitle {\n  color: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), var(--blm-white-inv-l), 0.9);\n}\n\n.hero.is-white .subtitle a:not(.button),\n.hero.is-white .subtitle strong {\n  color: var(--blm-white-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-white .navbar-menu {\n    background-color: var(--blm-white);\n  }\n}\n\n.hero.is-white .navbar-item,\n.hero.is-white .navbar-link {\n  color: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), var(--blm-white-inv-l), 0.7);\n}\n\n.hero.is-white a.navbar-item:hover, .hero.is-white a.navbar-item.is-active,\n.hero.is-white .navbar-link:hover,\n.hero.is-white .navbar-link.is-active {\n  background-color: hsla(var(--blm-white-h), var(--blm-white-s), calc(var(--blm-white-l) - 5%), var(--blm-white-a));\n  color: var(--blm-white-inv);\n}\n\n.hero.is-white .tabs a {\n  color: var(--blm-white-inv);\n  opacity: 0.9;\n}\n\n.hero.is-white .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-white .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-white .tabs.is-boxed a, .hero.is-white .tabs.is-toggle a {\n  color: var(--blm-white-inv);\n}\n\n.hero.is-white .tabs.is-boxed a:hover, .hero.is-white .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-white .tabs.is-boxed li.is-active a, .hero.is-white .tabs.is-boxed li.is-active a:hover, .hero.is-white .tabs.is-toggle li.is-active a, .hero.is-white .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-white-inv);\n  border-color: var(--blm-white-inv);\n  color: var(--blm-white);\n}\n\n.hero.is-white.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-white-h) - 10), calc(var(--blm-white-s) + 10%), calc(var(--blm-white-l) - 10%), var(--blm-white-a)) 0%, var(--blm-white) 71%, hsla(calc(var(--blm-white-h) + 10), calc(var(--blm-white-s) + 5%), calc(var(--blm-white-l) + 5%), var(--blm-white-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-white.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-white-h) - 10), calc(var(--blm-white-s) + 10%), calc(var(--blm-white-l) - 10%), var(--blm-white-a)) 0%, var(--blm-white) 71%, hsla(calc(var(--blm-white-h) + 10), calc(var(--blm-white-s) + 5%), calc(var(--blm-white-l) + 5%), var(--blm-white-a)) 100%);\n  }\n}\n\n.hero.is-black {\n  background-color: var(--blm-black);\n  color: var(--blm-black-inv);\n}\n\n.hero.is-black a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-black strong {\n  color: inherit;\n}\n\n.hero.is-black .title {\n  color: var(--blm-black-inv);\n}\n\n.hero.is-black .subtitle {\n  color: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), var(--blm-black-inv-l), 0.9);\n}\n\n.hero.is-black .subtitle a:not(.button),\n.hero.is-black .subtitle strong {\n  color: var(--blm-black-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-black .navbar-menu {\n    background-color: var(--blm-black);\n  }\n}\n\n.hero.is-black .navbar-item,\n.hero.is-black .navbar-link {\n  color: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), var(--blm-black-inv-l), 0.7);\n}\n\n.hero.is-black a.navbar-item:hover, .hero.is-black a.navbar-item.is-active,\n.hero.is-black .navbar-link:hover,\n.hero.is-black .navbar-link.is-active {\n  background-color: hsla(var(--blm-black-h), var(--blm-black-s), calc(var(--blm-black-l) - 5%), var(--blm-black-a));\n  color: var(--blm-black-inv);\n}\n\n.hero.is-black .tabs a {\n  color: var(--blm-black-inv);\n  opacity: 0.9;\n}\n\n.hero.is-black .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-black .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-black .tabs.is-boxed a, .hero.is-black .tabs.is-toggle a {\n  color: var(--blm-black-inv);\n}\n\n.hero.is-black .tabs.is-boxed a:hover, .hero.is-black .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-black .tabs.is-boxed li.is-active a, .hero.is-black .tabs.is-boxed li.is-active a:hover, .hero.is-black .tabs.is-toggle li.is-active a, .hero.is-black .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-black-inv);\n  border-color: var(--blm-black-inv);\n  color: var(--blm-black);\n}\n\n.hero.is-black.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-black-h) - 10), calc(var(--blm-black-s) + 10%), calc(var(--blm-black-l) - 10%), var(--blm-black-a)) 0%, var(--blm-black) 71%, hsla(calc(var(--blm-black-h) + 10), calc(var(--blm-black-s) + 5%), calc(var(--blm-black-l) + 5%), var(--blm-black-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-black.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-black-h) - 10), calc(var(--blm-black-s) + 10%), calc(var(--blm-black-l) - 10%), var(--blm-black-a)) 0%, var(--blm-black) 71%, hsla(calc(var(--blm-black-h) + 10), calc(var(--blm-black-s) + 5%), calc(var(--blm-black-l) + 5%), var(--blm-black-a)) 100%);\n  }\n}\n\n.hero.is-light {\n  background-color: var(--blm-light);\n  color: var(--blm-light-inv);\n}\n\n.hero.is-light a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-light strong {\n  color: inherit;\n}\n\n.hero.is-light .title {\n  color: var(--blm-light-inv);\n}\n\n.hero.is-light .subtitle {\n  color: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), var(--blm-light-inv-l), 0.9);\n}\n\n.hero.is-light .subtitle a:not(.button),\n.hero.is-light .subtitle strong {\n  color: var(--blm-light-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-light .navbar-menu {\n    background-color: var(--blm-light);\n  }\n}\n\n.hero.is-light .navbar-item,\n.hero.is-light .navbar-link {\n  color: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), var(--blm-light-inv-l), 0.7);\n}\n\n.hero.is-light a.navbar-item:hover, .hero.is-light a.navbar-item.is-active,\n.hero.is-light .navbar-link:hover,\n.hero.is-light .navbar-link.is-active {\n  background-color: hsla(var(--blm-light-h), var(--blm-light-s), calc(var(--blm-light-l) - 5%), var(--blm-light-a));\n  color: var(--blm-light-inv);\n}\n\n.hero.is-light .tabs a {\n  color: var(--blm-light-inv);\n  opacity: 0.9;\n}\n\n.hero.is-light .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-light .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-light .tabs.is-boxed a, .hero.is-light .tabs.is-toggle a {\n  color: var(--blm-light-inv);\n}\n\n.hero.is-light .tabs.is-boxed a:hover, .hero.is-light .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-light .tabs.is-boxed li.is-active a, .hero.is-light .tabs.is-boxed li.is-active a:hover, .hero.is-light .tabs.is-toggle li.is-active a, .hero.is-light .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-light-inv);\n  border-color: var(--blm-light-inv);\n  color: var(--blm-light);\n}\n\n.hero.is-light.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-light-h) - 10), calc(var(--blm-light-s) + 10%), calc(var(--blm-light-l) - 10%), var(--blm-light-a)) 0%, var(--blm-light) 71%, hsla(calc(var(--blm-light-h) + 10), calc(var(--blm-light-s) + 5%), calc(var(--blm-light-l) + 5%), var(--blm-light-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-light.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-light-h) - 10), calc(var(--blm-light-s) + 10%), calc(var(--blm-light-l) - 10%), var(--blm-light-a)) 0%, var(--blm-light) 71%, hsla(calc(var(--blm-light-h) + 10), calc(var(--blm-light-s) + 5%), calc(var(--blm-light-l) + 5%), var(--blm-light-a)) 100%);\n  }\n}\n\n.hero.is-dark {\n  background-color: var(--blm-dark);\n  color: var(--blm-dark-inv);\n}\n\n.hero.is-dark a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-dark strong {\n  color: inherit;\n}\n\n.hero.is-dark .title {\n  color: var(--blm-dark-inv);\n}\n\n.hero.is-dark .subtitle {\n  color: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), var(--blm-dark-inv-l), 0.9);\n}\n\n.hero.is-dark .subtitle a:not(.button),\n.hero.is-dark .subtitle strong {\n  color: var(--blm-dark-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-dark .navbar-menu {\n    background-color: var(--blm-dark);\n  }\n}\n\n.hero.is-dark .navbar-item,\n.hero.is-dark .navbar-link {\n  color: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), var(--blm-dark-inv-l), 0.7);\n}\n\n.hero.is-dark a.navbar-item:hover, .hero.is-dark a.navbar-item.is-active,\n.hero.is-dark .navbar-link:hover,\n.hero.is-dark .navbar-link.is-active {\n  background-color: hsla(var(--blm-dark-h), var(--blm-dark-s), calc(var(--blm-dark-l) - 5%), var(--blm-dark-a));\n  color: var(--blm-dark-inv);\n}\n\n.hero.is-dark .tabs a {\n  color: var(--blm-dark-inv);\n  opacity: 0.9;\n}\n\n.hero.is-dark .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs.is-boxed a, .hero.is-dark .tabs.is-toggle a {\n  color: var(--blm-dark-inv);\n}\n\n.hero.is-dark .tabs.is-boxed a:hover, .hero.is-dark .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-dark .tabs.is-boxed li.is-active a, .hero.is-dark .tabs.is-boxed li.is-active a:hover, .hero.is-dark .tabs.is-toggle li.is-active a, .hero.is-dark .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-dark-inv);\n  border-color: var(--blm-dark-inv);\n  color: var(--blm-dark);\n}\n\n.hero.is-dark.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-dark-h) - 10), calc(var(--blm-dark-s) + 10%), calc(var(--blm-dark-l) - 10%), var(--blm-dark-a)) 0%, var(--blm-dark) 71%, hsla(calc(var(--blm-dark-h) + 10), calc(var(--blm-dark-s) + 5%), calc(var(--blm-dark-l) + 5%), var(--blm-dark-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-dark.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-dark-h) - 10), calc(var(--blm-dark-s) + 10%), calc(var(--blm-dark-l) - 10%), var(--blm-dark-a)) 0%, var(--blm-dark) 71%, hsla(calc(var(--blm-dark-h) + 10), calc(var(--blm-dark-s) + 5%), calc(var(--blm-dark-l) + 5%), var(--blm-dark-a)) 100%);\n  }\n}\n\n.hero.is-primary {\n  background-color: var(--blm-prim);\n  color: var(--blm-prim-inv);\n}\n\n.hero.is-primary a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-primary strong {\n  color: inherit;\n}\n\n.hero.is-primary .title {\n  color: var(--blm-prim-inv);\n}\n\n.hero.is-primary .subtitle {\n  color: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), var(--blm-prim-inv-l), 0.9);\n}\n\n.hero.is-primary .subtitle a:not(.button),\n.hero.is-primary .subtitle strong {\n  color: var(--blm-prim-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-primary .navbar-menu {\n    background-color: var(--blm-prim);\n  }\n}\n\n.hero.is-primary .navbar-item,\n.hero.is-primary .navbar-link {\n  color: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), var(--blm-prim-inv-l), 0.7);\n}\n\n.hero.is-primary a.navbar-item:hover, .hero.is-primary a.navbar-item.is-active,\n.hero.is-primary .navbar-link:hover,\n.hero.is-primary .navbar-link.is-active {\n  background-color: hsla(var(--blm-prim-h), var(--blm-prim-s), calc(var(--blm-prim-l) - 5%), var(--blm-prim-a));\n  color: var(--blm-prim-inv);\n}\n\n.hero.is-primary .tabs a {\n  color: var(--blm-prim-inv);\n  opacity: 0.9;\n}\n\n.hero.is-primary .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs.is-boxed a, .hero.is-primary .tabs.is-toggle a {\n  color: var(--blm-prim-inv);\n}\n\n.hero.is-primary .tabs.is-boxed a:hover, .hero.is-primary .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-primary .tabs.is-boxed li.is-active a, .hero.is-primary .tabs.is-boxed li.is-active a:hover, .hero.is-primary .tabs.is-toggle li.is-active a, .hero.is-primary .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-prim-inv);\n  border-color: var(--blm-prim-inv);\n  color: var(--blm-prim);\n}\n\n.hero.is-primary.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-prim-h) - 10), calc(var(--blm-prim-s) + 10%), calc(var(--blm-prim-l) - 10%), var(--blm-prim-a)) 0%, var(--blm-prim) 71%, hsla(calc(var(--blm-prim-h) + 10), calc(var(--blm-prim-s) + 5%), calc(var(--blm-prim-l) + 5%), var(--blm-prim-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-primary.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-prim-h) - 10), calc(var(--blm-prim-s) + 10%), calc(var(--blm-prim-l) - 10%), var(--blm-prim-a)) 0%, var(--blm-prim) 71%, hsla(calc(var(--blm-prim-h) + 10), calc(var(--blm-prim-s) + 5%), calc(var(--blm-prim-l) + 5%), var(--blm-prim-a)) 100%);\n  }\n}\n\n.hero.is-link {\n  background-color: var(--blm-link);\n  color: var(--blm-link-inv);\n}\n\n.hero.is-link a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-link strong {\n  color: inherit;\n}\n\n.hero.is-link .title {\n  color: var(--blm-link-inv);\n}\n\n.hero.is-link .subtitle {\n  color: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), var(--blm-link-inv-l), 0.9);\n}\n\n.hero.is-link .subtitle a:not(.button),\n.hero.is-link .subtitle strong {\n  color: var(--blm-link-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-link .navbar-menu {\n    background-color: var(--blm-link);\n  }\n}\n\n.hero.is-link .navbar-item,\n.hero.is-link .navbar-link {\n  color: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), var(--blm-link-inv-l), 0.7);\n}\n\n.hero.is-link a.navbar-item:hover, .hero.is-link a.navbar-item.is-active,\n.hero.is-link .navbar-link:hover,\n.hero.is-link .navbar-link.is-active {\n  background-color: hsla(var(--blm-link-h), var(--blm-link-s), calc(var(--blm-link-l) - 5%), var(--blm-link-a));\n  color: var(--blm-link-inv);\n}\n\n.hero.is-link .tabs a {\n  color: var(--blm-link-inv);\n  opacity: 0.9;\n}\n\n.hero.is-link .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-link .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-link .tabs.is-boxed a, .hero.is-link .tabs.is-toggle a {\n  color: var(--blm-link-inv);\n}\n\n.hero.is-link .tabs.is-boxed a:hover, .hero.is-link .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-link .tabs.is-boxed li.is-active a, .hero.is-link .tabs.is-boxed li.is-active a:hover, .hero.is-link .tabs.is-toggle li.is-active a, .hero.is-link .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-link-inv);\n  border-color: var(--blm-link-inv);\n  color: var(--blm-link);\n}\n\n.hero.is-link.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-link-h) - 10), calc(var(--blm-link-s) + 10%), calc(var(--blm-link-l) - 10%), var(--blm-link-a)) 0%, var(--blm-link) 71%, hsla(calc(var(--blm-link-h) + 10), calc(var(--blm-link-s) + 5%), calc(var(--blm-link-l) + 5%), var(--blm-link-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-link.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-link-h) - 10), calc(var(--blm-link-s) + 10%), calc(var(--blm-link-l) - 10%), var(--blm-link-a)) 0%, var(--blm-link) 71%, hsla(calc(var(--blm-link-h) + 10), calc(var(--blm-link-s) + 5%), calc(var(--blm-link-l) + 5%), var(--blm-link-a)) 100%);\n  }\n}\n\n.hero.is-info {\n  background-color: var(--blm-info);\n  color: var(--blm-info-inv);\n}\n\n.hero.is-info a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-info strong {\n  color: inherit;\n}\n\n.hero.is-info .title {\n  color: var(--blm-info-inv);\n}\n\n.hero.is-info .subtitle {\n  color: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), var(--blm-info-inv-l), 0.9);\n}\n\n.hero.is-info .subtitle a:not(.button),\n.hero.is-info .subtitle strong {\n  color: var(--blm-info-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-info .navbar-menu {\n    background-color: var(--blm-info);\n  }\n}\n\n.hero.is-info .navbar-item,\n.hero.is-info .navbar-link {\n  color: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), var(--blm-info-inv-l), 0.7);\n}\n\n.hero.is-info a.navbar-item:hover, .hero.is-info a.navbar-item.is-active,\n.hero.is-info .navbar-link:hover,\n.hero.is-info .navbar-link.is-active {\n  background-color: hsla(var(--blm-info-h), var(--blm-info-s), calc(var(--blm-info-l) - 5%), var(--blm-info-a));\n  color: var(--blm-info-inv);\n}\n\n.hero.is-info .tabs a {\n  color: var(--blm-info-inv);\n  opacity: 0.9;\n}\n\n.hero.is-info .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-info .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-info .tabs.is-boxed a, .hero.is-info .tabs.is-toggle a {\n  color: var(--blm-info-inv);\n}\n\n.hero.is-info .tabs.is-boxed a:hover, .hero.is-info .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-info .tabs.is-boxed li.is-active a, .hero.is-info .tabs.is-boxed li.is-active a:hover, .hero.is-info .tabs.is-toggle li.is-active a, .hero.is-info .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-info-inv);\n  border-color: var(--blm-info-inv);\n  color: var(--blm-info);\n}\n\n.hero.is-info.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-info-h) - 10), calc(var(--blm-info-s) + 10%), calc(var(--blm-info-l) - 10%), var(--blm-info-a)) 0%, var(--blm-info) 71%, hsla(calc(var(--blm-info-h) + 10), calc(var(--blm-info-s) + 5%), calc(var(--blm-info-l) + 5%), var(--blm-info-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-info.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-info-h) - 10), calc(var(--blm-info-s) + 10%), calc(var(--blm-info-l) - 10%), var(--blm-info-a)) 0%, var(--blm-info) 71%, hsla(calc(var(--blm-info-h) + 10), calc(var(--blm-info-s) + 5%), calc(var(--blm-info-l) + 5%), var(--blm-info-a)) 100%);\n  }\n}\n\n.hero.is-success {\n  background-color: var(--blm-sucs);\n  color: var(--blm-sucs-inv);\n}\n\n.hero.is-success a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-success strong {\n  color: inherit;\n}\n\n.hero.is-success .title {\n  color: var(--blm-sucs-inv);\n}\n\n.hero.is-success .subtitle {\n  color: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), var(--blm-sucs-inv-l), 0.9);\n}\n\n.hero.is-success .subtitle a:not(.button),\n.hero.is-success .subtitle strong {\n  color: var(--blm-sucs-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-success .navbar-menu {\n    background-color: var(--blm-sucs);\n  }\n}\n\n.hero.is-success .navbar-item,\n.hero.is-success .navbar-link {\n  color: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), var(--blm-sucs-inv-l), 0.7);\n}\n\n.hero.is-success a.navbar-item:hover, .hero.is-success a.navbar-item.is-active,\n.hero.is-success .navbar-link:hover,\n.hero.is-success .navbar-link.is-active {\n  background-color: hsla(var(--blm-sucs-h), var(--blm-sucs-s), calc(var(--blm-sucs-l) - 5%), var(--blm-sucs-a));\n  color: var(--blm-sucs-inv);\n}\n\n.hero.is-success .tabs a {\n  color: var(--blm-sucs-inv);\n  opacity: 0.9;\n}\n\n.hero.is-success .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-success .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-success .tabs.is-boxed a, .hero.is-success .tabs.is-toggle a {\n  color: var(--blm-sucs-inv);\n}\n\n.hero.is-success .tabs.is-boxed a:hover, .hero.is-success .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-success .tabs.is-boxed li.is-active a, .hero.is-success .tabs.is-boxed li.is-active a:hover, .hero.is-success .tabs.is-toggle li.is-active a, .hero.is-success .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-sucs-inv);\n  border-color: var(--blm-sucs-inv);\n  color: var(--blm-sucs);\n}\n\n.hero.is-success.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-sucs-h) - 10), calc(var(--blm-sucs-s) + 10%), calc(var(--blm-sucs-l) - 10%), var(--blm-sucs-a)) 0%, var(--blm-sucs) 71%, hsla(calc(var(--blm-sucs-h) + 10), calc(var(--blm-sucs-s) + 5%), calc(var(--blm-sucs-l) + 5%), var(--blm-sucs-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-success.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-sucs-h) - 10), calc(var(--blm-sucs-s) + 10%), calc(var(--blm-sucs-l) - 10%), var(--blm-sucs-a)) 0%, var(--blm-sucs) 71%, hsla(calc(var(--blm-sucs-h) + 10), calc(var(--blm-sucs-s) + 5%), calc(var(--blm-sucs-l) + 5%), var(--blm-sucs-a)) 100%);\n  }\n}\n\n.hero.is-warning {\n  background-color: var(--blm-warn);\n  color: var(--blm-warn-inv);\n}\n\n.hero.is-warning a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-warning strong {\n  color: inherit;\n}\n\n.hero.is-warning .title {\n  color: var(--blm-warn-inv);\n}\n\n.hero.is-warning .subtitle {\n  color: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), var(--blm-warn-inv-l), 0.9);\n}\n\n.hero.is-warning .subtitle a:not(.button),\n.hero.is-warning .subtitle strong {\n  color: var(--blm-warn-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-warning .navbar-menu {\n    background-color: var(--blm-warn);\n  }\n}\n\n.hero.is-warning .navbar-item,\n.hero.is-warning .navbar-link {\n  color: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), var(--blm-warn-inv-l), 0.7);\n}\n\n.hero.is-warning a.navbar-item:hover, .hero.is-warning a.navbar-item.is-active,\n.hero.is-warning .navbar-link:hover,\n.hero.is-warning .navbar-link.is-active {\n  background-color: hsla(var(--blm-warn-h), var(--blm-warn-s), calc(var(--blm-warn-l) - 5%), var(--blm-warn-a));\n  color: var(--blm-warn-inv);\n}\n\n.hero.is-warning .tabs a {\n  color: var(--blm-warn-inv);\n  opacity: 0.9;\n}\n\n.hero.is-warning .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs.is-boxed a, .hero.is-warning .tabs.is-toggle a {\n  color: var(--blm-warn-inv);\n}\n\n.hero.is-warning .tabs.is-boxed a:hover, .hero.is-warning .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-warning .tabs.is-boxed li.is-active a, .hero.is-warning .tabs.is-boxed li.is-active a:hover, .hero.is-warning .tabs.is-toggle li.is-active a, .hero.is-warning .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-warn-inv);\n  border-color: var(--blm-warn-inv);\n  color: var(--blm-warn);\n}\n\n.hero.is-warning.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-warn-h) - 10), calc(var(--blm-warn-s) + 10%), calc(var(--blm-warn-l) - 10%), var(--blm-warn-a)) 0%, var(--blm-warn) 71%, hsla(calc(var(--blm-warn-h) + 10), calc(var(--blm-warn-s) + 5%), calc(var(--blm-warn-l) + 5%), var(--blm-warn-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-warning.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-warn-h) - 10), calc(var(--blm-warn-s) + 10%), calc(var(--blm-warn-l) - 10%), var(--blm-warn-a)) 0%, var(--blm-warn) 71%, hsla(calc(var(--blm-warn-h) + 10), calc(var(--blm-warn-s) + 5%), calc(var(--blm-warn-l) + 5%), var(--blm-warn-a)) 100%);\n  }\n}\n\n.hero.is-danger {\n  background-color: var(--blm-dang);\n  color: var(--blm-dang-inv);\n}\n\n.hero.is-danger a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-danger strong {\n  color: inherit;\n}\n\n.hero.is-danger .title {\n  color: var(--blm-dang-inv);\n}\n\n.hero.is-danger .subtitle {\n  color: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), var(--blm-dang-inv-l), 0.9);\n}\n\n.hero.is-danger .subtitle a:not(.button),\n.hero.is-danger .subtitle strong {\n  color: var(--blm-dang-inv);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-danger .navbar-menu {\n    background-color: var(--blm-dang);\n  }\n}\n\n.hero.is-danger .navbar-item,\n.hero.is-danger .navbar-link {\n  color: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), var(--blm-dang-inv-l), 0.7);\n}\n\n.hero.is-danger a.navbar-item:hover, .hero.is-danger a.navbar-item.is-active,\n.hero.is-danger .navbar-link:hover,\n.hero.is-danger .navbar-link.is-active {\n  background-color: hsla(var(--blm-dang-h), var(--blm-dang-s), calc(var(--blm-dang-l) - 5%), var(--blm-dang-a));\n  color: var(--blm-dang-inv);\n}\n\n.hero.is-danger .tabs a {\n  color: var(--blm-dang-inv);\n  opacity: 0.9;\n}\n\n.hero.is-danger .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs.is-boxed a, .hero.is-danger .tabs.is-toggle a {\n  color: var(--blm-dang-inv);\n}\n\n.hero.is-danger .tabs.is-boxed a:hover, .hero.is-danger .tabs.is-toggle a:hover {\n  background-color: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n}\n\n.hero.is-danger .tabs.is-boxed li.is-active a, .hero.is-danger .tabs.is-boxed li.is-active a:hover, .hero.is-danger .tabs.is-toggle li.is-active a, .hero.is-danger .tabs.is-toggle li.is-active a:hover {\n  background-color: var(--blm-dang-inv);\n  border-color: var(--blm-dang-inv);\n  color: var(--blm-dang);\n}\n\n.hero.is-danger.is-bold {\n  background-image: linear-gradient(141deg, hsla(calc(var(--blm-dang-h) - 10), calc(var(--blm-dang-s) + 10%), calc(var(--blm-dang-l) - 10%), var(--blm-dang-a)) 0%, var(--blm-dang) 71%, hsla(calc(var(--blm-dang-h) + 10), calc(var(--blm-dang-s) + 5%), calc(var(--blm-dang-l) + 5%), var(--blm-dang-a)) 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-danger.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, hsla(calc(var(--blm-dang-h) - 10), calc(var(--blm-dang-s) + 10%), calc(var(--blm-dang-l) - 10%), var(--blm-dang-a)) 0%, var(--blm-dang) 71%, hsla(calc(var(--blm-dang-h) + 10), calc(var(--blm-dang-s) + 5%), calc(var(--blm-dang-l) + 5%), var(--blm-dang-a)) 100%);\n  }\n}\n\n.hero.is-small .hero-body {\n  padding: var(--blm-hero-body-p-small);\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-medium .hero-body {\n    padding: var(--blm-hero-body-p-medium);\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-large .hero-body {\n    padding: var(--blm-hero-body-p-lg);\n  }\n}\n\n.hero.is-halfheight .hero-body, .hero.is-fullheight .hero-body, .hero.is-fullheight-with-navbar .hero-body {\n  align-items: center;\n  display: flex;\n}\n\n.hero.is-halfheight .hero-body > .container, .hero.is-fullheight .hero-body > .container, .hero.is-fullheight-with-navbar .hero-body > .container {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.hero.is-halfheight {\n  min-height: 50vh;\n}\n\n.hero.is-fullheight {\n  min-height: 100vh;\n}\n\n.hero-video {\n  overflow: hidden;\n}\n\n.hero-video video {\n  left: 50%;\n  min-height: 100%;\n  min-width: 100%;\n  position: absolute;\n  top: 50%;\n  transform: translate3d(-50%, -50%, 0);\n}\n\n.hero-video.is-transparent {\n  opacity: 0.3;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-video {\n    display: none;\n  }\n}\n\n.hero-buttons {\n  margin-top: 1.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-buttons .button {\n    display: flex;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-bottom: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero-buttons {\n    display: flex;\n    justify-content: center;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-right: 1.5rem;\n  }\n}\n\n.hero-head,\n.hero-foot {\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.hero-body {\n  flex-grow: 1;\n  flex-shrink: 0;\n  padding: var(--blm-hero-body-p);\n}\n\n.section {\n  padding: var(--blm-sct-p);\n}\n\n@media screen and (min-width: 1024px) {\n  .section.is-medium {\n    padding: var(--blm-sct-p-medium);\n  }\n  .section.is-large {\n    padding: var(--blm-sct-p-lg);\n  }\n}\n\n.footer {\n  background-color: var(--blm-ft-bg-clr);\n  padding: var(--blm-ft-p);\n  color: var(--blm-ft-clr);\n}\n\n[data-theme], :root {\n  --blm-turquoise: hsla(var(--blm-turquoise-h), var(--blm-turquoise-s), var(--blm-turquoise-l), var(--blm-turquoise-a));\n  --blm-turquoise-h: 171;\n  --blm-turquoise-s: 100%;\n  --blm-turquoise-l: 41%;\n  --blm-turquoise-a: 1;\n  --blm-cyan: hsla(var(--blm-cyan-h), var(--blm-cyan-s), var(--blm-cyan-l), var(--blm-cyan-a));\n  --blm-cyan-h: 204;\n  --blm-cyan-s: 71%;\n  --blm-cyan-l: 53%;\n  --blm-cyan-a: 1;\n  --blm-green: hsla(var(--blm-green-h), var(--blm-green-s), var(--blm-green-l), var(--blm-green-a));\n  --blm-green-h: 141;\n  --blm-green-s: 53%;\n  --blm-green-l: 53%;\n  --blm-green-a: 1;\n  --blm-yellow: hsla(var(--blm-yellow-h), var(--blm-yellow-s), var(--blm-yellow-l), var(--blm-yellow-a));\n  --blm-yellow-h: 48;\n  --blm-yellow-s: 100%;\n  --blm-yellow-l: 67%;\n  --blm-yellow-a: 1;\n  --blm-red: hsla(var(--blm-red-h), var(--blm-red-s), var(--blm-red-l), var(--blm-red-a));\n  --blm-red-h: 348;\n  --blm-red-s: 86%;\n  --blm-red-l: 61%;\n  --blm-red-a: 1;\n  --blm-white-ter: hsla(var(--blm-white-ter-h), var(--blm-white-ter-s), var(--blm-white-ter-l), var(--blm-white-ter-a));\n  --blm-white-ter-h: 0;\n  --blm-white-ter-s: 0%;\n  --blm-white-ter-l: 96%;\n  --blm-white-ter-a: 1;\n  --blm-grey-darker: hsla(var(--blm-grey-darker-h), var(--blm-grey-darker-s), var(--blm-grey-darker-l), var(--blm-grey-darker-a));\n  --blm-grey-darker-h: 0;\n  --blm-grey-darker-s: 0%;\n  --blm-grey-darker-l: 21%;\n  --blm-grey-darker-a: 1;\n  --blm-orange: hsla(var(--blm-orange-h), var(--blm-orange-s), var(--blm-orange-l), var(--blm-orange-a));\n  --blm-orange-h: 14;\n  --blm-orange-s: 100%;\n  --blm-orange-l: 53%;\n  --blm-orange-a: 1;\n  --blm-blue: hsla(var(--blm-blue-h), var(--blm-blue-s), var(--blm-blue-l), var(--blm-blue-a));\n  --blm-blue-h: 217;\n  --blm-blue-s: 71%;\n  --blm-blue-l: 53%;\n  --blm-blue-a: 1;\n  --blm-purple: hsla(var(--blm-purple-h), var(--blm-purple-s), var(--blm-purple-l), var(--blm-purple-a));\n  --blm-purple-h: 271;\n  --blm-purple-s: 100%;\n  --blm-purple-l: 71%;\n  --blm-purple-a: 1;\n  --blm-prim: hsla(var(--blm-prim-h), var(--blm-prim-s), var(--blm-prim-l), var(--blm-prim-a));\n  --blm-prim-h: var(--blm-turquoise-h);\n  --blm-prim-s: var(--blm-turquoise-s);\n  --blm-prim-l: var(--blm-turquoise-l);\n  --blm-prim-a: var(--blm-turquoise-a);\n  --blm-info: hsla(var(--blm-info-h), var(--blm-info-s), var(--blm-info-l), var(--blm-info-a));\n  --blm-info-h: var(--blm-cyan-h);\n  --blm-info-s: var(--blm-cyan-s);\n  --blm-info-l: var(--blm-cyan-l);\n  --blm-info-a: var(--blm-cyan-a);\n  --blm-sucs: hsla(var(--blm-sucs-h), var(--blm-sucs-s), var(--blm-sucs-l), var(--blm-sucs-a));\n  --blm-sucs-h: var(--blm-green-h);\n  --blm-sucs-s: var(--blm-green-s);\n  --blm-sucs-l: var(--blm-green-l);\n  --blm-sucs-a: var(--blm-green-a);\n  --blm-warn: hsla(var(--blm-warn-h), var(--blm-warn-s), var(--blm-warn-l), var(--blm-warn-a));\n  --blm-warn-h: var(--blm-yellow-h);\n  --blm-warn-s: var(--blm-yellow-s);\n  --blm-warn-l: var(--blm-yellow-l);\n  --blm-warn-a: var(--blm-yellow-a);\n  --blm-dang: hsla(var(--blm-dang-h), var(--blm-dang-s), var(--blm-dang-l), var(--blm-dang-a));\n  --blm-dang-h: var(--blm-red-h);\n  --blm-dang-s: var(--blm-red-s);\n  --blm-dang-l: var(--blm-red-l);\n  --blm-dang-a: var(--blm-red-a);\n  --blm-light: hsla(var(--blm-light-h), var(--blm-light-s), var(--blm-light-l), var(--blm-light-a));\n  --blm-light-h: var(--blm-white-ter-h);\n  --blm-light-s: var(--blm-white-ter-s);\n  --blm-light-l: var(--blm-white-ter-l);\n  --blm-light-a: var(--blm-white-ter-a);\n  --blm-dark: hsla(var(--blm-dark-h), var(--blm-dark-s), var(--blm-dark-l), var(--blm-dark-a));\n  --blm-dark-h: var(--blm-grey-darker-h);\n  --blm-dark-s: var(--blm-grey-darker-s);\n  --blm-dark-l: var(--blm-grey-darker-l);\n  --blm-dark-a: var(--blm-grey-darker-a);\n  --blm-black: hsla(var(--blm-black-h), var(--blm-black-s), var(--blm-black-l), var(--blm-black-a));\n  --blm-black-h: 0;\n  --blm-black-s: 0%;\n  --blm-black-l: 4%;\n  --blm-black-a: 1;\n  --blm-white: hsla(var(--blm-white-h), var(--blm-white-s), var(--blm-white-l), var(--blm-white-a));\n  --blm-white-h: 0;\n  --blm-white-s: 0%;\n  --blm-white-l: 100%;\n  --blm-white-a: 1;\n  --blm-white-bis: hsla(var(--blm-white-bis-h), var(--blm-white-bis-s), var(--blm-white-bis-l), var(--blm-white-bis-a));\n  --blm-white-bis-h: 0;\n  --blm-white-bis-s: 0%;\n  --blm-white-bis-l: 98%;\n  --blm-white-bis-a: 1;\n  --blm-black-bis: hsla(var(--blm-black-bis-h), var(--blm-black-bis-s), var(--blm-black-bis-l), var(--blm-black-bis-a));\n  --blm-black-bis-h: 0;\n  --blm-black-bis-s: 0%;\n  --blm-black-bis-l: 7%;\n  --blm-black-bis-a: 1;\n  --blm-black-ter: hsla(var(--blm-black-ter-h), var(--blm-black-ter-s), var(--blm-black-ter-l), var(--blm-black-ter-a));\n  --blm-black-ter-h: 0;\n  --blm-black-ter-s: 0%;\n  --blm-black-ter-l: 14%;\n  --blm-black-ter-a: 1;\n  --blm-grey-lighter: hsla(var(--blm-grey-lighter-h), var(--blm-grey-lighter-s), var(--blm-grey-lighter-l), var(--blm-grey-lighter-a));\n  --blm-grey-lighter-h: 0;\n  --blm-grey-lighter-s: 0%;\n  --blm-grey-lighter-l: 86%;\n  --blm-grey-lighter-a: 1;\n  --blm-grey-light: hsla(var(--blm-grey-light-h), var(--blm-grey-light-s), var(--blm-grey-light-l), var(--blm-grey-light-a));\n  --blm-grey-light-h: 0;\n  --blm-grey-light-s: 0%;\n  --blm-grey-light-l: 71%;\n  --blm-grey-light-a: 1;\n  --blm-grey-lightest: hsla(var(--blm-grey-lightest-h), var(--blm-grey-lightest-s), var(--blm-grey-lightest-l), var(--blm-grey-lightest-a));\n  --blm-grey-lightest-h: 0;\n  --blm-grey-lightest-s: 0%;\n  --blm-grey-lightest-l: 93%;\n  --blm-grey-lightest-a: 1;\n  --blm-grey-dark: hsla(var(--blm-grey-dark-h), var(--blm-grey-dark-s), var(--blm-grey-dark-l), var(--blm-grey-dark-a));\n  --blm-grey-dark-h: 0;\n  --blm-grey-dark-s: 0%;\n  --blm-grey-dark-l: 29%;\n  --blm-grey-dark-a: 1;\n  --blm-txt: hsla(var(--blm-txt-h), var(--blm-txt-s), var(--blm-txt-l), var(--blm-txt-a));\n  --blm-txt-h: var(--blm-grey-dark-h);\n  --blm-txt-s: var(--blm-grey-dark-s);\n  --blm-txt-l: var(--blm-grey-dark-l);\n  --blm-txt-a: var(--blm-grey-dark-a);\n  --blm-grey: hsla(var(--blm-grey-h), var(--blm-grey-s), var(--blm-grey-l), var(--blm-grey-a));\n  --blm-grey-h: 0;\n  --blm-grey-s: 0%;\n  --blm-grey-l: 48%;\n  --blm-grey-a: 1;\n  --blm-bg: hsla(var(--blm-bg-h), var(--blm-bg-s), var(--blm-bg-l), var(--blm-bg-a));\n  --blm-bg-h: var(--blm-white-ter-h);\n  --blm-bg-s: var(--blm-white-ter-s);\n  --blm-bg-l: var(--blm-white-ter-l);\n  --blm-bg-a: var(--blm-white-ter-a);\n  --blm-link: hsla(var(--blm-link-h), var(--blm-link-s), var(--blm-link-l), var(--blm-link-a));\n  --blm-link-h: var(--blm-blue-h);\n  --blm-link-s: var(--blm-blue-s);\n  --blm-link-l: var(--blm-blue-l);\n  --blm-link-a: var(--blm-blue-a);\n  --blm-family-sans-serif: BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Helvetica, Arial, sans-serif;\n  --blm-family-monospace: monospace;\n  --blm-s-7: 0.75rem;\n  --blm-s-6: 1rem;\n  --blm-s-5: 1.25rem;\n  --blm-s-4: 1.5rem;\n  --blm-s-1: 3rem;\n  --blm-s-2: 2.5rem;\n  --blm-s-3: 2rem;\n  --blm-radius: 4px;\n  --blm-radius-small: 2px;\n  --blm-ctrl-bd-width: 1px;\n  --blm-ctrl-radius: var(--blm-radius);\n  --blm-s-normal: var(--blm-s-6);\n  --blm-ctrl-height: 2.5em;\n  --blm-ctrl-line-height: 1.5;\n  --blm-ctrl-p-vertical: calc(0.5em - var(--blm-ctrl-bd-width));\n  --blm-ctrl-p-horizontal: calc(0.75em - var(--blm-ctrl-bd-width));\n  --blm-sch-inv: hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), var(--blm-sch-inv-a));\n  --blm-sch-inv-h: var(--blm-black-h);\n  --blm-sch-inv-s: var(--blm-black-s);\n  --blm-sch-inv-l: var(--blm-black-l);\n  --blm-sch-inv-a: var(--blm-black-a);\n  --blm-radius-rounded: 290486px;\n  --blm-sch-main: hsla(var(--blm-sch-main-h), var(--blm-sch-main-s), var(--blm-sch-main-l), var(--blm-sch-main-a));\n  --blm-sch-main-h: var(--blm-white-h);\n  --blm-sch-main-s: var(--blm-white-s);\n  --blm-sch-main-l: var(--blm-white-l);\n  --blm-sch-main-a: var(--blm-white-a);\n  --blm-family-prim: var(--blm-family-sans-serif);\n  --blm-weight-normal: 400;\n  --blm-family-code: var(--blm-family-monospace);\n  --blm-txt-strong: hsla(var(--blm-txt-strong-h), var(--blm-txt-strong-s), var(--blm-txt-strong-l), var(--blm-txt-strong-a));\n  --blm-txt-strong-h: var(--blm-grey-darker-h);\n  --blm-txt-strong-s: var(--blm-grey-darker-s);\n  --blm-txt-strong-l: var(--blm-grey-darker-l);\n  --blm-txt-strong-a: var(--blm-grey-darker-a);\n  --blm-weight-bold: 700;\n  --blm-radius-lg: 6px;\n  --blm-box-bg-clr: hsla(var(--blm-box-bg-clr-h), var(--blm-box-bg-clr-s), var(--blm-box-bg-clr-l), var(--blm-box-bg-clr-a));\n  --blm-box-bg-clr-h: var(--blm-sch-main-h);\n  --blm-box-bg-clr-s: var(--blm-sch-main-s);\n  --blm-box-bg-clr-l: var(--blm-sch-main-l);\n  --blm-box-bg-clr-a: var(--blm-sch-main-a);\n  --blm-box-radius: var(--blm-radius-lg);\n  --blm-box-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-box-clr: hsla(var(--blm-box-clr-h), var(--blm-box-clr-s), var(--blm-box-clr-l), var(--blm-box-clr-a));\n  --blm-box-clr-h: var(--blm-txt-h);\n  --blm-box-clr-s: var(--blm-txt-s);\n  --blm-box-clr-l: var(--blm-txt-l);\n  --blm-box-clr-a: var(--blm-txt-a);\n  --blm-box-p: 1.25rem;\n  --blm-box-link-hov-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0 0 1px var(--blm-link);\n  --blm-box-link-act-shadow: inset 0 1px 2px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.2), 0 0 0 1px var(--blm-link);\n  --blm-bd: hsla(var(--blm-bd-h), var(--blm-bd-s), var(--blm-bd-l), var(--blm-bd-a));\n  --blm-bd-h: var(--blm-grey-lighter-h);\n  --blm-bd-s: var(--blm-grey-lighter-s);\n  --blm-bd-l: var(--blm-grey-lighter-l);\n  --blm-bd-a: var(--blm-grey-lighter-a);\n  --blm-bt-bd-width: var(--blm-ctrl-bd-width);\n  --blm-link-hov: hsla(var(--blm-link-hov-h), var(--blm-link-hov-s), var(--blm-link-hov-l), var(--blm-link-hov-a));\n  --blm-link-hov-h: var(--blm-grey-darker-h);\n  --blm-link-hov-s: var(--blm-grey-darker-s);\n  --blm-link-hov-l: var(--blm-grey-darker-l);\n  --blm-link-hov-a: var(--blm-grey-darker-a);\n  --blm-link-hov-bd: hsla(var(--blm-link-hov-bd-h), var(--blm-link-hov-bd-s), var(--blm-link-hov-bd-l), var(--blm-link-hov-bd-a));\n  --blm-link-hov-bd-h: var(--blm-grey-light-h);\n  --blm-link-hov-bd-s: var(--blm-grey-light-s);\n  --blm-link-hov-bd-l: var(--blm-grey-light-l);\n  --blm-link-hov-bd-a: var(--blm-grey-light-a);\n  --blm-link-foc: hsla(var(--blm-link-foc-h), var(--blm-link-foc-s), var(--blm-link-foc-l), var(--blm-link-foc-a));\n  --blm-link-foc-h: var(--blm-grey-darker-h);\n  --blm-link-foc-s: var(--blm-grey-darker-s);\n  --blm-link-foc-l: var(--blm-grey-darker-l);\n  --blm-link-foc-a: var(--blm-grey-darker-a);\n  --blm-link-foc-bd: hsla(var(--blm-link-foc-bd-h), var(--blm-link-foc-bd-s), var(--blm-link-foc-bd-l), var(--blm-link-foc-bd-a));\n  --blm-link-foc-bd-h: var(--blm-blue-h);\n  --blm-link-foc-bd-s: var(--blm-blue-s);\n  --blm-link-foc-bd-l: var(--blm-blue-l);\n  --blm-link-foc-bd-a: var(--blm-blue-a);\n  --blm-link-act: hsla(var(--blm-link-act-h), var(--blm-link-act-s), var(--blm-link-act-l), var(--blm-link-act-a));\n  --blm-link-act-h: var(--blm-grey-darker-h);\n  --blm-link-act-s: var(--blm-grey-darker-s);\n  --blm-link-act-l: var(--blm-grey-darker-l);\n  --blm-link-act-a: var(--blm-grey-darker-a);\n  --blm-link-act-bd: hsla(var(--blm-link-act-bd-h), var(--blm-link-act-bd-s), var(--blm-link-act-bd-l), var(--blm-link-act-bd-a));\n  --blm-link-act-bd-h: var(--blm-grey-dark-h);\n  --blm-link-act-bd-s: var(--blm-grey-dark-s);\n  --blm-link-act-bd-l: var(--blm-grey-dark-l);\n  --blm-link-act-bd-a: var(--blm-grey-dark-a);\n  --blm-txt-light: hsla(var(--blm-txt-light-h), var(--blm-txt-light-s), var(--blm-txt-light-l), var(--blm-txt-light-a));\n  --blm-txt-light-h: var(--blm-grey-h);\n  --blm-txt-light-s: var(--blm-grey-s);\n  --blm-txt-light-l: var(--blm-grey-l);\n  --blm-txt-light-a: var(--blm-grey-a);\n  --blm-sch-main-ter: hsla(var(--blm-sch-main-ter-h), var(--blm-sch-main-ter-s), var(--blm-sch-main-ter-l), var(--blm-sch-main-ter-a));\n  --blm-sch-main-ter-h: var(--blm-white-ter-h);\n  --blm-sch-main-ter-s: var(--blm-white-ter-s);\n  --blm-sch-main-ter-l: var(--blm-white-ter-l);\n  --blm-sch-main-ter-a: var(--blm-white-ter-a);\n  --blm-bt-bg-clr: hsla(var(--blm-bt-bg-clr-h), var(--blm-bt-bg-clr-s), var(--blm-bt-bg-clr-l), var(--blm-bt-bg-clr-a));\n  --blm-bt-bg-clr-h: var(--blm-sch-main-h);\n  --blm-bt-bg-clr-s: var(--blm-sch-main-s);\n  --blm-bt-bg-clr-l: var(--blm-sch-main-l);\n  --blm-bt-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bt-bd-clr: hsla(var(--blm-bt-bd-clr-h), var(--blm-bt-bd-clr-s), var(--blm-bt-bd-clr-l), var(--blm-bt-bd-clr-a));\n  --blm-bt-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-clr: hsla(var(--blm-bt-clr-h), var(--blm-bt-clr-s), var(--blm-bt-clr-l), var(--blm-bt-clr-a));\n  --blm-bt-clr-h: var(--blm-txt-strong-h);\n  --blm-bt-clr-s: var(--blm-txt-strong-s);\n  --blm-bt-clr-l: var(--blm-txt-strong-l);\n  --blm-bt-clr-a: var(--blm-txt-strong-a);\n  --blm-bt-family: inherit;\n  --blm-bt-p-vertical: calc(0.5em - var(--blm-bt-bd-width));\n  --blm-bt-p-horizontal: 1em;\n  --blm-bt-hov-bd-clr: hsla(var(--blm-bt-hov-bd-clr-h), var(--blm-bt-hov-bd-clr-s), var(--blm-bt-hov-bd-clr-l), var(--blm-bt-hov-bd-clr-a));\n  --blm-bt-hov-bd-clr-h: var(--blm-link-hov-bd-h);\n  --blm-bt-hov-bd-clr-s: var(--blm-link-hov-bd-s);\n  --blm-bt-hov-bd-clr-l: var(--blm-link-hov-bd-l);\n  --blm-bt-hov-bd-clr-a: var(--blm-link-hov-bd-a);\n  --blm-bt-hov-clr: hsla(var(--blm-bt-hov-clr-h), var(--blm-bt-hov-clr-s), var(--blm-bt-hov-clr-l), var(--blm-bt-hov-clr-a));\n  --blm-bt-hov-clr-h: var(--blm-link-hov-h);\n  --blm-bt-hov-clr-s: var(--blm-link-hov-s);\n  --blm-bt-hov-clr-l: var(--blm-link-hov-l);\n  --blm-bt-hov-clr-a: var(--blm-link-hov-a);\n  --blm-bt-foc-bd-clr: hsla(var(--blm-bt-foc-bd-clr-h), var(--blm-bt-foc-bd-clr-s), var(--blm-bt-foc-bd-clr-l), var(--blm-bt-foc-bd-clr-a));\n  --blm-bt-foc-bd-clr-h: var(--blm-link-foc-bd-h);\n  --blm-bt-foc-bd-clr-s: var(--blm-link-foc-bd-s);\n  --blm-bt-foc-bd-clr-l: var(--blm-link-foc-bd-l);\n  --blm-bt-foc-bd-clr-a: var(--blm-link-foc-bd-a);\n  --blm-bt-foc-clr: hsla(var(--blm-bt-foc-clr-h), var(--blm-bt-foc-clr-s), var(--blm-bt-foc-clr-l), var(--blm-bt-foc-clr-a));\n  --blm-bt-foc-clr-h: var(--blm-link-foc-h);\n  --blm-bt-foc-clr-s: var(--blm-link-foc-s);\n  --blm-bt-foc-clr-l: var(--blm-link-foc-l);\n  --blm-bt-foc-clr-a: var(--blm-link-foc-a);\n  --blm-bt-foc-box-shadow-s: 0 0 0 0.125em;\n  --blm-bt-foc-box-shadow-clr: hsla(var(--blm-bt-foc-box-shadow-clr-h), var(--blm-bt-foc-box-shadow-clr-s), var(--blm-bt-foc-box-shadow-clr-l), var(--blm-bt-foc-box-shadow-clr-a));\n  --blm-bt-foc-box-shadow-clr-h: var(--blm-link-h);\n  --blm-bt-foc-box-shadow-clr-s: var(--blm-link-s);\n  --blm-bt-foc-box-shadow-clr-l: var(--blm-link-l);\n  --blm-bt-foc-box-shadow-clr-a: 0.25;\n  --blm-bt-act-bd-clr: hsla(var(--blm-bt-act-bd-clr-h), var(--blm-bt-act-bd-clr-s), var(--blm-bt-act-bd-clr-l), var(--blm-bt-act-bd-clr-a));\n  --blm-bt-act-bd-clr-h: var(--blm-link-act-bd-h);\n  --blm-bt-act-bd-clr-s: var(--blm-link-act-bd-s);\n  --blm-bt-act-bd-clr-l: var(--blm-link-act-bd-l);\n  --blm-bt-act-bd-clr-a: var(--blm-link-act-bd-a);\n  --blm-bt-act-clr: hsla(var(--blm-bt-act-clr-h), var(--blm-bt-act-clr-s), var(--blm-bt-act-clr-l), var(--blm-bt-act-clr-a));\n  --blm-bt-act-clr-h: var(--blm-link-act-h);\n  --blm-bt-act-clr-s: var(--blm-link-act-s);\n  --blm-bt-act-clr-l: var(--blm-link-act-l);\n  --blm-bt-act-clr-a: var(--blm-link-act-a);\n  --blm-bt-txt-clr: hsla(var(--blm-bt-txt-clr-h), var(--blm-bt-txt-clr-s), var(--blm-bt-txt-clr-l), var(--blm-bt-txt-clr-a));\n  --blm-bt-txt-clr-h: var(--blm-txt-h);\n  --blm-bt-txt-clr-s: var(--blm-txt-s);\n  --blm-bt-txt-clr-l: var(--blm-txt-l);\n  --blm-bt-txt-clr-a: var(--blm-txt-a);\n  --blm-bt-txt-decoration: underline;\n  --blm-bt-txt-hov-bg-clr: hsla(var(--blm-bt-txt-hov-bg-clr-h), var(--blm-bt-txt-hov-bg-clr-s), var(--blm-bt-txt-hov-bg-clr-l), var(--blm-bt-txt-hov-bg-clr-a));\n  --blm-bt-txt-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-bt-txt-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-bt-txt-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-bt-txt-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-bt-txt-hov-clr: hsla(var(--blm-bt-txt-hov-clr-h), var(--blm-bt-txt-hov-clr-s), var(--blm-bt-txt-hov-clr-l), var(--blm-bt-txt-hov-clr-a));\n  --blm-bt-txt-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-bt-txt-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-bt-txt-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-bt-txt-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-white-inv: hsla(var(--blm-white-inv-h), var(--blm-white-inv-s), var(--blm-white-inv-l), var(--blm-white-inv-a));\n  --blm-white-inv-h: var(--blm-black-h);\n  --blm-white-inv-s: var(--blm-black-s);\n  --blm-white-inv-l: var(--blm-black-l);\n  --blm-white-inv-a: var(--blm-black-a);\n  --blm-black-inv: hsla(var(--blm-black-inv-h), var(--blm-black-inv-s), var(--blm-black-inv-l), var(--blm-black-inv-a));\n  --blm-black-inv-h: var(--blm-white-h);\n  --blm-black-inv-s: var(--blm-white-s);\n  --blm-black-inv-l: var(--blm-white-l);\n  --blm-black-inv-a: var(--blm-white-a);\n  --blm-light-inv: hsla(var(--blm-light-inv-h), var(--blm-light-inv-s), var(--blm-light-inv-l), var(--blm-light-inv-a));\n  --blm-light-inv-h: 0;\n  --blm-light-inv-s: 0%;\n  --blm-light-inv-l: 0%;\n  --blm-light-inv-a: 0.7;\n  --blm-dark-inv: hsla(var(--blm-dark-inv-h), var(--blm-dark-inv-s), var(--blm-dark-inv-l), var(--blm-dark-inv-a));\n  --blm-dark-inv-h: 0;\n  --blm-dark-inv-s: 0%;\n  --blm-dark-inv-l: 100%;\n  --blm-dark-inv-a: 1;\n  --blm-prim-inv: hsla(var(--blm-prim-inv-h), var(--blm-prim-inv-s), var(--blm-prim-inv-l), var(--blm-prim-inv-a));\n  --blm-prim-inv-h: 0;\n  --blm-prim-inv-s: 0%;\n  --blm-prim-inv-l: 100%;\n  --blm-prim-inv-a: 1;\n  --blm-prim-light: hsla(var(--blm-prim-light-h), var(--blm-prim-light-s), var(--blm-prim-light-l), var(--blm-prim-light-a));\n  --blm-prim-light-h: 171;\n  --blm-prim-light-s: 100%;\n  --blm-prim-light-l: 96%;\n  --blm-prim-light-a: 1;\n  --blm-prim-dark: hsla(var(--blm-prim-dark-h), var(--blm-prim-dark-s), var(--blm-prim-dark-l), var(--blm-prim-dark-a));\n  --blm-prim-dark-h: 171;\n  --blm-prim-dark-s: 100%;\n  --blm-prim-dark-l: 29%;\n  --blm-prim-dark-a: 1;\n  --blm-link-inv: hsla(var(--blm-link-inv-h), var(--blm-link-inv-s), var(--blm-link-inv-l), var(--blm-link-inv-a));\n  --blm-link-inv-h: 0;\n  --blm-link-inv-s: 0%;\n  --blm-link-inv-l: 100%;\n  --blm-link-inv-a: 1;\n  --blm-link-light: hsla(var(--blm-link-light-h), var(--blm-link-light-s), var(--blm-link-light-l), var(--blm-link-light-a));\n  --blm-link-light-h: 217;\n  --blm-link-light-s: 71%;\n  --blm-link-light-l: 96%;\n  --blm-link-light-a: 1;\n  --blm-link-dark: hsla(var(--blm-link-dark-h), var(--blm-link-dark-s), var(--blm-link-dark-l), var(--blm-link-dark-a));\n  --blm-link-dark-h: 217;\n  --blm-link-dark-s: 71%;\n  --blm-link-dark-l: 45%;\n  --blm-link-dark-a: 1;\n  --blm-info-inv: hsla(var(--blm-info-inv-h), var(--blm-info-inv-s), var(--blm-info-inv-l), var(--blm-info-inv-a));\n  --blm-info-inv-h: 0;\n  --blm-info-inv-s: 0%;\n  --blm-info-inv-l: 100%;\n  --blm-info-inv-a: 1;\n  --blm-info-light: hsla(var(--blm-info-light-h), var(--blm-info-light-s), var(--blm-info-light-l), var(--blm-info-light-a));\n  --blm-info-light-h: 204;\n  --blm-info-light-s: 71%;\n  --blm-info-light-l: 96%;\n  --blm-info-light-a: 1;\n  --blm-info-dark: hsla(var(--blm-info-dark-h), var(--blm-info-dark-s), var(--blm-info-dark-l), var(--blm-info-dark-a));\n  --blm-info-dark-h: 204;\n  --blm-info-dark-s: 71%;\n  --blm-info-dark-l: 39%;\n  --blm-info-dark-a: 1;\n  --blm-sucs-inv: hsla(var(--blm-sucs-inv-h), var(--blm-sucs-inv-s), var(--blm-sucs-inv-l), var(--blm-sucs-inv-a));\n  --blm-sucs-inv-h: 0;\n  --blm-sucs-inv-s: 0%;\n  --blm-sucs-inv-l: 100%;\n  --blm-sucs-inv-a: 1;\n  --blm-sucs-light: hsla(var(--blm-sucs-light-h), var(--blm-sucs-light-s), var(--blm-sucs-light-l), var(--blm-sucs-light-a));\n  --blm-sucs-light-h: 141;\n  --blm-sucs-light-s: 53%;\n  --blm-sucs-light-l: 96%;\n  --blm-sucs-light-a: 1;\n  --blm-sucs-dark: hsla(var(--blm-sucs-dark-h), var(--blm-sucs-dark-s), var(--blm-sucs-dark-l), var(--blm-sucs-dark-a));\n  --blm-sucs-dark-h: 141;\n  --blm-sucs-dark-s: 53%;\n  --blm-sucs-dark-l: 31%;\n  --blm-sucs-dark-a: 1;\n  --blm-warn-inv: hsla(var(--blm-warn-inv-h), var(--blm-warn-inv-s), var(--blm-warn-inv-l), var(--blm-warn-inv-a));\n  --blm-warn-inv-h: 0;\n  --blm-warn-inv-s: 0%;\n  --blm-warn-inv-l: 0%;\n  --blm-warn-inv-a: 0.7;\n  --blm-warn-light: hsla(var(--blm-warn-light-h), var(--blm-warn-light-s), var(--blm-warn-light-l), var(--blm-warn-light-a));\n  --blm-warn-light-h: 48;\n  --blm-warn-light-s: 100%;\n  --blm-warn-light-l: 96%;\n  --blm-warn-light-a: 1;\n  --blm-warn-dark: hsla(var(--blm-warn-dark-h), var(--blm-warn-dark-s), var(--blm-warn-dark-l), var(--blm-warn-dark-a));\n  --blm-warn-dark-h: 48;\n  --blm-warn-dark-s: 100%;\n  --blm-warn-dark-l: 29%;\n  --blm-warn-dark-a: 1;\n  --blm-dang-inv: hsla(var(--blm-dang-inv-h), var(--blm-dang-inv-s), var(--blm-dang-inv-l), var(--blm-dang-inv-a));\n  --blm-dang-inv-h: 0;\n  --blm-dang-inv-s: 0%;\n  --blm-dang-inv-l: 100%;\n  --blm-dang-inv-a: 1;\n  --blm-dang-light: hsla(var(--blm-dang-light-h), var(--blm-dang-light-s), var(--blm-dang-light-l), var(--blm-dang-light-a));\n  --blm-dang-light-h: 348;\n  --blm-dang-light-s: 86%;\n  --blm-dang-light-l: 96%;\n  --blm-dang-light-a: 1;\n  --blm-dang-dark: hsla(var(--blm-dang-dark-h), var(--blm-dang-dark-s), var(--blm-dang-dark-l), var(--blm-dang-dark-a));\n  --blm-dang-dark-h: 348;\n  --blm-dang-dark-s: 86%;\n  --blm-dang-dark-l: 43%;\n  --blm-dang-dark-a: 1;\n  --blm-s-small: var(--blm-s-7);\n  --blm-s-medium: var(--blm-s-5);\n  --blm-s-lg: var(--blm-s-4);\n  --blm-bt-dsbl-bg-clr: hsla(var(--blm-bt-dsbl-bg-clr-h), var(--blm-bt-dsbl-bg-clr-s), var(--blm-bt-dsbl-bg-clr-l), var(--blm-bt-dsbl-bg-clr-a));\n  --blm-bt-dsbl-bg-clr-h: var(--blm-sch-main-h);\n  --blm-bt-dsbl-bg-clr-s: var(--blm-sch-main-s);\n  --blm-bt-dsbl-bg-clr-l: var(--blm-sch-main-l);\n  --blm-bt-dsbl-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bt-dsbl-bd-clr: hsla(var(--blm-bt-dsbl-bd-clr-h), var(--blm-bt-dsbl-bd-clr-s), var(--blm-bt-dsbl-bd-clr-l), var(--blm-bt-dsbl-bd-clr-a));\n  --blm-bt-dsbl-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-dsbl-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-dsbl-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-dsbl-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-dsbl-shadow: none;\n  --blm-bt-dsbl-opacity: 0.5;\n  --blm-bt-static-bg-clr: hsla(var(--blm-bt-static-bg-clr-h), var(--blm-bt-static-bg-clr-s), var(--blm-bt-static-bg-clr-l), var(--blm-bt-static-bg-clr-a));\n  --blm-bt-static-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-bt-static-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-bt-static-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-bt-static-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-bt-static-bd-clr: hsla(var(--blm-bt-static-bd-clr-h), var(--blm-bt-static-bd-clr-s), var(--blm-bt-static-bd-clr-l), var(--blm-bt-static-bd-clr-a));\n  --blm-bt-static-bd-clr-h: var(--blm-bd-h);\n  --blm-bt-static-bd-clr-s: var(--blm-bd-s);\n  --blm-bt-static-bd-clr-l: var(--blm-bd-l);\n  --blm-bt-static-bd-clr-a: var(--blm-bd-a);\n  --blm-bt-static-clr: hsla(var(--blm-bt-static-clr-h), var(--blm-bt-static-clr-s), var(--blm-bt-static-clr-l), var(--blm-bt-static-clr-a));\n  --blm-bt-static-clr-h: var(--blm-txt-light-h);\n  --blm-bt-static-clr-s: var(--blm-txt-light-s);\n  --blm-bt-static-clr-l: var(--blm-txt-light-l);\n  --blm-bt-static-clr-a: var(--blm-txt-light-a);\n  --blm-weight-semibold: 600;\n  --blm-ct-hdg-clr: hsla(var(--blm-ct-hdg-clr-h), var(--blm-ct-hdg-clr-s), var(--blm-ct-hdg-clr-l), var(--blm-ct-hdg-clr-a));\n  --blm-ct-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-hdg-weight: var(--blm-weight-semibold);\n  --blm-ct-hdg-line-height: 1.125;\n  --blm-ct-blockquote-bg-clr: hsla(var(--blm-ct-blockquote-bg-clr-h), var(--blm-ct-blockquote-bg-clr-s), var(--blm-ct-blockquote-bg-clr-l), var(--blm-ct-blockquote-bg-clr-a));\n  --blm-ct-blockquote-bg-clr-h: var(--blm-bg-h);\n  --blm-ct-blockquote-bg-clr-s: var(--blm-bg-s);\n  --blm-ct-blockquote-bg-clr-l: var(--blm-bg-l);\n  --blm-ct-blockquote-bg-clr-a: var(--blm-bg-a);\n  --blm-ct-blockquote-bd-left: 5px solid var(--blm-bd);\n  --blm-ct-blockquote-p: 1.25em 1.5em;\n  --blm-ct-pre-p: 1.25em 1.5em;\n  --blm-ct-table-cell-bd: 1px solid var(--blm-bd);\n  --blm-ct-table-cell-bd-width: 0 0 1px;\n  --blm-ct-table-cell-p: 0.5em 0.75em;\n  --blm-ct-table-cell-hdg-clr: hsla(var(--blm-ct-table-cell-hdg-clr-h), var(--blm-ct-table-cell-hdg-clr-s), var(--blm-ct-table-cell-hdg-clr-l), var(--blm-ct-table-cell-hdg-clr-a));\n  --blm-ct-table-cell-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-cell-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-cell-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-cell-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-table-head-cell-bd-width: 0 0 2px;\n  --blm-ct-table-head-cell-clr: hsla(var(--blm-ct-table-head-cell-clr-h), var(--blm-ct-table-head-cell-clr-s), var(--blm-ct-table-head-cell-clr-l), var(--blm-ct-table-head-cell-clr-a));\n  --blm-ct-table-head-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-head-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-head-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-head-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-ct-table-foot-cell-bd-width: 2px 0 0;\n  --blm-ct-table-foot-cell-clr: hsla(var(--blm-ct-table-foot-cell-clr-h), var(--blm-ct-table-foot-cell-clr-s), var(--blm-ct-table-foot-cell-clr-l), var(--blm-ct-table-foot-cell-clr-a));\n  --blm-ct-table-foot-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-ct-table-foot-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-ct-table-foot-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-ct-table-foot-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-icon-dim: 1.5rem;\n  --blm-icon-dim-small: 1rem;\n  --blm-icon-dim-medium: 2rem;\n  --blm-icon-dim-lg: 3rem;\n  --blm-noti-bg-clr: hsla(var(--blm-noti-bg-clr-h), var(--blm-noti-bg-clr-s), var(--blm-noti-bg-clr-l), var(--blm-noti-bg-clr-a));\n  --blm-noti-bg-clr-h: var(--blm-bg-h);\n  --blm-noti-bg-clr-s: var(--blm-bg-s);\n  --blm-noti-bg-clr-l: var(--blm-bg-l);\n  --blm-noti-bg-clr-a: var(--blm-bg-a);\n  --blm-noti-radius: var(--blm-radius);\n  --blm-noti-p-vertical: 1.25rem;\n  --blm-noti-p-right: 2.5rem;\n  --blm-noti-p-left: 1.5rem;\n  --blm-noti-code-bg-clr: hsla(var(--blm-noti-code-bg-clr-h), var(--blm-noti-code-bg-clr-s), var(--blm-noti-code-bg-clr-l), var(--blm-noti-code-bg-clr-a));\n  --blm-noti-code-bg-clr-h: var(--blm-sch-main-h);\n  --blm-noti-code-bg-clr-s: var(--blm-sch-main-s);\n  --blm-noti-code-bg-clr-l: var(--blm-sch-main-l);\n  --blm-noti-code-bg-clr-a: var(--blm-sch-main-a);\n  --blm-bd-light: hsla(var(--blm-bd-light-h), var(--blm-bd-light-s), var(--blm-bd-light-l), var(--blm-bd-light-a));\n  --blm-bd-light-h: var(--blm-grey-lightest-h);\n  --blm-bd-light-s: var(--blm-grey-lightest-s);\n  --blm-bd-light-l: var(--blm-grey-lightest-l);\n  --blm-bd-light-a: var(--blm-grey-lightest-a);\n  --blm-prg-bd-radius: var(--blm-radius-rounded);\n  --blm-prg-bar-bg-clr: hsla(var(--blm-prg-bar-bg-clr-h), var(--blm-prg-bar-bg-clr-s), var(--blm-prg-bar-bg-clr-l), var(--blm-prg-bar-bg-clr-a));\n  --blm-prg-bar-bg-clr-h: var(--blm-bd-light-h);\n  --blm-prg-bar-bg-clr-s: var(--blm-bd-light-s);\n  --blm-prg-bar-bg-clr-l: var(--blm-bd-light-l);\n  --blm-prg-bar-bg-clr-a: var(--blm-bd-light-a);\n  --blm-prg-value-bg-clr: hsla(var(--blm-prg-value-bg-clr-h), var(--blm-prg-value-bg-clr-s), var(--blm-prg-value-bg-clr-l), var(--blm-prg-value-bg-clr-a));\n  --blm-prg-value-bg-clr-h: var(--blm-txt-h);\n  --blm-prg-value-bg-clr-s: var(--blm-txt-s);\n  --blm-prg-value-bg-clr-l: var(--blm-txt-l);\n  --blm-prg-value-bg-clr-a: var(--blm-txt-a);\n  --blm-prg-indeterminate-duration: 1.5s;\n  --blm-sch-main-bis: hsla(var(--blm-sch-main-bis-h), var(--blm-sch-main-bis-s), var(--blm-sch-main-bis-l), var(--blm-sch-main-bis-a));\n  --blm-sch-main-bis-h: var(--blm-white-bis-h);\n  --blm-sch-main-bis-s: var(--blm-white-bis-s);\n  --blm-sch-main-bis-l: var(--blm-white-bis-l);\n  --blm-sch-main-bis-a: var(--blm-white-bis-a);\n  --blm-table-bg-clr: hsla(var(--blm-table-bg-clr-h), var(--blm-table-bg-clr-s), var(--blm-table-bg-clr-l), var(--blm-table-bg-clr-a));\n  --blm-table-bg-clr-h: var(--blm-sch-main-h);\n  --blm-table-bg-clr-s: var(--blm-sch-main-s);\n  --blm-table-bg-clr-l: var(--blm-sch-main-l);\n  --blm-table-bg-clr-a: var(--blm-sch-main-a);\n  --blm-table-clr: hsla(var(--blm-table-clr-h), var(--blm-table-clr-s), var(--blm-table-clr-l), var(--blm-table-clr-a));\n  --blm-table-clr-h: var(--blm-txt-strong-h);\n  --blm-table-clr-s: var(--blm-txt-strong-s);\n  --blm-table-clr-l: var(--blm-txt-strong-l);\n  --blm-table-clr-a: var(--blm-txt-strong-a);\n  --blm-table-cell-bd: 1px solid var(--blm-bd);\n  --blm-table-cell-bd-width: 0 0 1px;\n  --blm-table-cell-p: 0.5em 0.75em;\n  --blm-table-row-act-bg-clr: hsla(var(--blm-table-row-act-bg-clr-h), var(--blm-table-row-act-bg-clr-s), var(--blm-table-row-act-bg-clr-l), var(--blm-table-row-act-bg-clr-a));\n  --blm-table-row-act-bg-clr-h: var(--blm-prim-h);\n  --blm-table-row-act-bg-clr-s: var(--blm-prim-s);\n  --blm-table-row-act-bg-clr-l: var(--blm-prim-l);\n  --blm-table-row-act-bg-clr-a: var(--blm-prim-a);\n  --blm-table-row-act-clr: hsla(var(--blm-table-row-act-clr-h), var(--blm-table-row-act-clr-s), var(--blm-table-row-act-clr-l), var(--blm-table-row-act-clr-a));\n  --blm-table-row-act-clr-h: var(--blm-prim-inv-h);\n  --blm-table-row-act-clr-s: var(--blm-prim-inv-s);\n  --blm-table-row-act-clr-l: var(--blm-prim-inv-l);\n  --blm-table-row-act-clr-a: var(--blm-prim-inv-a);\n  --blm-table-cell-hdg-clr: hsla(var(--blm-table-cell-hdg-clr-h), var(--blm-table-cell-hdg-clr-s), var(--blm-table-cell-hdg-clr-l), var(--blm-table-cell-hdg-clr-a));\n  --blm-table-cell-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-table-cell-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-table-cell-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-table-cell-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-table-head-bg-clr: hsla(var(--blm-table-head-bg-clr-h), var(--blm-table-head-bg-clr-s), var(--blm-table-head-bg-clr-l), var(--blm-table-head-bg-clr-a));\n  --blm-table-head-bg-clr-h: 0;\n  --blm-table-head-bg-clr-s: 0%;\n  --blm-table-head-bg-clr-l: 0%;\n  --blm-table-head-bg-clr-a: 0;\n  --blm-table-head-cell-bd-width: 0 0 2px;\n  --blm-table-head-cell-clr: hsla(var(--blm-table-head-cell-clr-h), var(--blm-table-head-cell-clr-s), var(--blm-table-head-cell-clr-l), var(--blm-table-head-cell-clr-a));\n  --blm-table-head-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-table-head-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-table-head-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-table-head-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-table-foot-bg-clr: hsla(var(--blm-table-foot-bg-clr-h), var(--blm-table-foot-bg-clr-s), var(--blm-table-foot-bg-clr-l), var(--blm-table-foot-bg-clr-a));\n  --blm-table-foot-bg-clr-h: 0;\n  --blm-table-foot-bg-clr-s: 0%;\n  --blm-table-foot-bg-clr-l: 0%;\n  --blm-table-foot-bg-clr-a: 0;\n  --blm-table-foot-cell-bd-width: 2px 0 0;\n  --blm-table-foot-cell-clr: hsla(var(--blm-table-foot-cell-clr-h), var(--blm-table-foot-cell-clr-s), var(--blm-table-foot-cell-clr-l), var(--blm-table-foot-cell-clr-a));\n  --blm-table-foot-cell-clr-h: var(--blm-txt-strong-h);\n  --blm-table-foot-cell-clr-s: var(--blm-txt-strong-s);\n  --blm-table-foot-cell-clr-l: var(--blm-txt-strong-l);\n  --blm-table-foot-cell-clr-a: var(--blm-txt-strong-a);\n  --blm-table-body-bg-clr: hsla(var(--blm-table-body-bg-clr-h), var(--blm-table-body-bg-clr-s), var(--blm-table-body-bg-clr-l), var(--blm-table-body-bg-clr-a));\n  --blm-table-body-bg-clr-h: 0;\n  --blm-table-body-bg-clr-s: 0%;\n  --blm-table-body-bg-clr-l: 0%;\n  --blm-table-body-bg-clr-a: 0;\n  --blm-table-row-hov-bg-clr: hsla(var(--blm-table-row-hov-bg-clr-h), var(--blm-table-row-hov-bg-clr-s), var(--blm-table-row-hov-bg-clr-l), var(--blm-table-row-hov-bg-clr-a));\n  --blm-table-row-hov-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-table-row-hov-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-table-row-hov-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-table-row-hov-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-table-striped-row-even-hov-bg-clr: hsla(var(--blm-table-striped-row-even-hov-bg-clr-h), var(--blm-table-striped-row-even-hov-bg-clr-s), var(--blm-table-striped-row-even-hov-bg-clr-l), var(--blm-table-striped-row-even-hov-bg-clr-a));\n  --blm-table-striped-row-even-hov-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-table-striped-row-even-hov-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-table-striped-row-even-hov-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-table-striped-row-even-hov-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-table-striped-row-even-bg-clr: hsla(var(--blm-table-striped-row-even-bg-clr-h), var(--blm-table-striped-row-even-bg-clr-s), var(--blm-table-striped-row-even-bg-clr-l), var(--blm-table-striped-row-even-bg-clr-a));\n  --blm-table-striped-row-even-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-table-striped-row-even-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-table-striped-row-even-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-table-striped-row-even-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-tag-bg-clr: hsla(var(--blm-tag-bg-clr-h), var(--blm-tag-bg-clr-s), var(--blm-tag-bg-clr-l), var(--blm-tag-bg-clr-a));\n  --blm-tag-bg-clr-h: var(--blm-bg-h);\n  --blm-tag-bg-clr-s: var(--blm-bg-s);\n  --blm-tag-bg-clr-l: var(--blm-bg-l);\n  --blm-tag-bg-clr-a: var(--blm-bg-a);\n  --blm-tag-radius: var(--blm-radius);\n  --blm-tag-clr: hsla(var(--blm-tag-clr-h), var(--blm-tag-clr-s), var(--blm-tag-clr-l), var(--blm-tag-clr-a));\n  --blm-tag-clr-h: var(--blm-txt-h);\n  --blm-tag-clr-s: var(--blm-txt-s);\n  --blm-tag-clr-l: var(--blm-txt-l);\n  --blm-tag-clr-a: var(--blm-txt-a);\n  --blm-tag-delete-m: 1px;\n  --blm-title-sub-s: 0.75em;\n  --blm-title-sup-s: 0.75em;\n  --blm-title-clr: hsla(var(--blm-title-clr-h), var(--blm-title-clr-s), var(--blm-title-clr-l), var(--blm-title-clr-a));\n  --blm-title-clr-h: var(--blm-txt-strong-h);\n  --blm-title-clr-s: var(--blm-txt-strong-s);\n  --blm-title-clr-l: var(--blm-txt-strong-l);\n  --blm-title-clr-a: var(--blm-txt-strong-a);\n  --blm-title-family: inherit;\n  --blm-title-s: var(--blm-s-3);\n  --blm-title-weight: var(--blm-weight-semibold);\n  --blm-title-line-height: 1.125;\n  --blm-title-strong-clr: inherit;\n  --blm-title-strong-weight: inherit;\n  --blm-subtitle-negative-m: -1.25rem;\n  --blm-subtitle-clr: hsla(var(--blm-subtitle-clr-h), var(--blm-subtitle-clr-s), var(--blm-subtitle-clr-l), var(--blm-subtitle-clr-a));\n  --blm-subtitle-clr-h: var(--blm-txt-h);\n  --blm-subtitle-clr-s: var(--blm-txt-s);\n  --blm-subtitle-clr-l: var(--blm-txt-l);\n  --blm-subtitle-clr-a: var(--blm-txt-a);\n  --blm-subtitle-family: inherit;\n  --blm-subtitle-s: var(--blm-s-5);\n  --blm-subtitle-weight: var(--blm-weight-normal);\n  --blm-subtitle-line-height: 1.25;\n  --blm-subtitle-strong-clr: hsla(var(--blm-subtitle-strong-clr-h), var(--blm-subtitle-strong-clr-s), var(--blm-subtitle-strong-clr-l), var(--blm-subtitle-strong-clr-a));\n  --blm-subtitle-strong-clr-h: var(--blm-txt-strong-h);\n  --blm-subtitle-strong-clr-s: var(--blm-txt-strong-s);\n  --blm-subtitle-strong-clr-l: var(--blm-txt-strong-l);\n  --blm-subtitle-strong-clr-a: var(--blm-txt-strong-a);\n  --blm-subtitle-strong-weight: var(--blm-weight-semibold);\n  --blm-input-clr: hsla(var(--blm-input-clr-h), var(--blm-input-clr-s), var(--blm-input-clr-l), var(--blm-input-clr-a));\n  --blm-input-clr-h: var(--blm-txt-strong-h);\n  --blm-input-clr-s: var(--blm-txt-strong-s);\n  --blm-input-clr-l: var(--blm-txt-strong-l);\n  --blm-bd-hov: hsla(var(--blm-bd-hov-h), var(--blm-bd-hov-s), var(--blm-bd-hov-l), var(--blm-bd-hov-a));\n  --blm-bd-hov-h: var(--blm-grey-light-h);\n  --blm-bd-hov-s: var(--blm-grey-light-s);\n  --blm-bd-hov-l: var(--blm-grey-light-l);\n  --blm-bd-hov-a: var(--blm-grey-light-a);\n  --blm-input-dsbl-clr: hsla(var(--blm-input-dsbl-clr-h), var(--blm-input-dsbl-clr-s), var(--blm-input-dsbl-clr-l), var(--blm-input-dsbl-clr-a));\n  --blm-input-dsbl-clr-h: var(--blm-txt-light-h);\n  --blm-input-dsbl-clr-s: var(--blm-txt-light-s);\n  --blm-input-dsbl-clr-l: var(--blm-txt-light-l);\n  --blm-input-bg-clr: hsla(var(--blm-input-bg-clr-h), var(--blm-input-bg-clr-s), var(--blm-input-bg-clr-l), var(--blm-input-bg-clr-a));\n  --blm-input-bg-clr-h: var(--blm-sch-main-h);\n  --blm-input-bg-clr-s: var(--blm-sch-main-s);\n  --blm-input-bg-clr-l: var(--blm-sch-main-l);\n  --blm-input-bg-clr-a: var(--blm-sch-main-a);\n  --blm-input-bd-clr: hsla(var(--blm-input-bd-clr-h), var(--blm-input-bd-clr-s), var(--blm-input-bd-clr-l), var(--blm-input-bd-clr-a));\n  --blm-input-bd-clr-h: var(--blm-bd-h);\n  --blm-input-bd-clr-s: var(--blm-bd-s);\n  --blm-input-bd-clr-l: var(--blm-bd-l);\n  --blm-input-bd-clr-a: var(--blm-bd-a);\n  --blm-input-radius: var(--blm-radius);\n  --blm-input-clr-a: var(--blm-txt-strong-a);\n  --blm-input-placeholder-clr: hsla(var(--blm-input-placeholder-clr-h), var(--blm-input-placeholder-clr-s), var(--blm-input-placeholder-clr-l), var(--blm-input-placeholder-clr-a));\n  --blm-input-placeholder-clr-h: var(--blm-input-clr-h);\n  --blm-input-placeholder-clr-s: var(--blm-input-clr-s);\n  --blm-input-placeholder-clr-l: var(--blm-input-clr-l);\n  --blm-input-placeholder-clr-a: 0.3;\n  --blm-input-hov-bd-clr: hsla(var(--blm-input-hov-bd-clr-h), var(--blm-input-hov-bd-clr-s), var(--blm-input-hov-bd-clr-l), var(--blm-input-hov-bd-clr-a));\n  --blm-input-hov-bd-clr-h: var(--blm-bd-hov-h);\n  --blm-input-hov-bd-clr-s: var(--blm-bd-hov-s);\n  --blm-input-hov-bd-clr-l: var(--blm-bd-hov-l);\n  --blm-input-hov-bd-clr-a: var(--blm-bd-hov-a);\n  --blm-input-foc-bd-clr: hsla(var(--blm-input-foc-bd-clr-h), var(--blm-input-foc-bd-clr-s), var(--blm-input-foc-bd-clr-l), var(--blm-input-foc-bd-clr-a));\n  --blm-input-foc-bd-clr-h: var(--blm-link-h);\n  --blm-input-foc-bd-clr-s: var(--blm-link-s);\n  --blm-input-foc-bd-clr-l: var(--blm-link-l);\n  --blm-input-foc-bd-clr-a: var(--blm-link-a);\n  --blm-input-foc-box-shadow-s: 0 0 0 0.125em;\n  --blm-input-foc-box-shadow-clr: hsla(var(--blm-input-foc-box-shadow-clr-h), var(--blm-input-foc-box-shadow-clr-s), var(--blm-input-foc-box-shadow-clr-l), var(--blm-input-foc-box-shadow-clr-a));\n  --blm-input-foc-box-shadow-clr-h: var(--blm-link-h);\n  --blm-input-foc-box-shadow-clr-s: var(--blm-link-s);\n  --blm-input-foc-box-shadow-clr-l: var(--blm-link-l);\n  --blm-input-foc-box-shadow-clr-a: 0.25;\n  --blm-input-dsbl-bg-clr: hsla(var(--blm-input-dsbl-bg-clr-h), var(--blm-input-dsbl-bg-clr-s), var(--blm-input-dsbl-bg-clr-l), var(--blm-input-dsbl-bg-clr-a));\n  --blm-input-dsbl-bg-clr-h: var(--blm-bg-h);\n  --blm-input-dsbl-bg-clr-s: var(--blm-bg-s);\n  --blm-input-dsbl-bg-clr-l: var(--blm-bg-l);\n  --blm-input-dsbl-bg-clr-a: var(--blm-bg-a);\n  --blm-input-dsbl-bd-clr: hsla(var(--blm-input-dsbl-bd-clr-h), var(--blm-input-dsbl-bd-clr-s), var(--blm-input-dsbl-bd-clr-l), var(--blm-input-dsbl-bd-clr-a));\n  --blm-input-dsbl-bd-clr-h: var(--blm-bg-h);\n  --blm-input-dsbl-bd-clr-s: var(--blm-bg-s);\n  --blm-input-dsbl-bd-clr-l: var(--blm-bg-l);\n  --blm-input-dsbl-bd-clr-a: var(--blm-bg-a);\n  --blm-input-dsbl-clr-a: var(--blm-txt-light-a);\n  --blm-input-dsbl-placeholder-clr: hsla(var(--blm-input-dsbl-placeholder-clr-h), var(--blm-input-dsbl-placeholder-clr-s), var(--blm-input-dsbl-placeholder-clr-l), var(--blm-input-dsbl-placeholder-clr-a));\n  --blm-input-dsbl-placeholder-clr-h: var(--blm-input-dsbl-clr-h);\n  --blm-input-dsbl-placeholder-clr-s: var(--blm-input-dsbl-clr-s);\n  --blm-input-dsbl-placeholder-clr-l: var(--blm-input-dsbl-clr-l);\n  --blm-input-dsbl-placeholder-clr-a: 0.3;\n  --blm-input-shadow: inset 0 0.0625em 0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.05);\n  --blm-ctrl-radius-small: var(--blm-radius-small);\n  --blm-txtarea-p: var(--blm-ctrl-p-horizontal);\n  --blm-txtarea-max-height: 40em;\n  --blm-txtarea-min-height: 8em;\n  --blm-input-hov-clr: hsla(var(--blm-input-hov-clr-h), var(--blm-input-hov-clr-s), var(--blm-input-hov-clr-l), var(--blm-input-hov-clr-a));\n  --blm-input-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-input-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-input-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-input-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-input-height: var(--blm-ctrl-height);\n  --blm-input-arrow: hsla(var(--blm-input-arrow-h), var(--blm-input-arrow-s), var(--blm-input-arrow-l), var(--blm-input-arrow-a));\n  --blm-input-arrow-h: var(--blm-link-h);\n  --blm-input-arrow-s: var(--blm-link-s);\n  --blm-input-arrow-l: var(--blm-link-l);\n  --blm-input-arrow-a: var(--blm-link-a);\n  --blm-file-radius: var(--blm-radius);\n  --blm-file-cta-bg-clr: hsla(var(--blm-file-cta-bg-clr-h), var(--blm-file-cta-bg-clr-s), var(--blm-file-cta-bg-clr-l), var(--blm-file-cta-bg-clr-a));\n  --blm-file-cta-bg-clr-h: var(--blm-sch-main-ter-h);\n  --blm-file-cta-bg-clr-s: var(--blm-sch-main-ter-s);\n  --blm-file-cta-bg-clr-l: var(--blm-sch-main-ter-l);\n  --blm-file-cta-bg-clr-a: var(--blm-sch-main-ter-a);\n  --blm-file-cta-hov-clr: hsla(var(--blm-file-cta-hov-clr-h), var(--blm-file-cta-hov-clr-s), var(--blm-file-cta-hov-clr-l), var(--blm-file-cta-hov-clr-a));\n  --blm-file-cta-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-file-cta-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-file-cta-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-file-cta-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-file-name-bd-clr: hsla(var(--blm-file-name-bd-clr-h), var(--blm-file-name-bd-clr-s), var(--blm-file-name-bd-clr-l), var(--blm-file-name-bd-clr-a));\n  --blm-file-name-bd-clr-h: var(--blm-bd-h);\n  --blm-file-name-bd-clr-s: var(--blm-bd-s);\n  --blm-file-name-bd-clr-l: var(--blm-bd-l);\n  --blm-file-name-bd-clr-a: var(--blm-bd-a);\n  --blm-file-cta-act-clr: hsla(var(--blm-file-cta-act-clr-h), var(--blm-file-cta-act-clr-s), var(--blm-file-cta-act-clr-l), var(--blm-file-cta-act-clr-a));\n  --blm-file-cta-act-clr-h: var(--blm-txt-strong-h);\n  --blm-file-cta-act-clr-s: var(--blm-txt-strong-s);\n  --blm-file-cta-act-clr-l: var(--blm-txt-strong-l);\n  --blm-file-cta-act-clr-a: var(--blm-txt-strong-a);\n  --blm-file-bd-clr: hsla(var(--blm-file-bd-clr-h), var(--blm-file-bd-clr-s), var(--blm-file-bd-clr-l), var(--blm-file-bd-clr-a));\n  --blm-file-bd-clr-h: var(--blm-bd-h);\n  --blm-file-bd-clr-s: var(--blm-bd-s);\n  --blm-file-bd-clr-l: var(--blm-bd-l);\n  --blm-file-bd-clr-a: var(--blm-bd-a);\n  --blm-file-cta-clr: hsla(var(--blm-file-cta-clr-h), var(--blm-file-cta-clr-s), var(--blm-file-cta-clr-l), var(--blm-file-cta-clr-a));\n  --blm-file-cta-clr-h: var(--blm-txt-h);\n  --blm-file-cta-clr-s: var(--blm-txt-s);\n  --blm-file-cta-clr-l: var(--blm-txt-l);\n  --blm-file-cta-clr-a: var(--blm-txt-a);\n  --blm-file-name-bd-style: solid;\n  --blm-file-name-bd-width: 1px 1px 1px 0;\n  --blm-file-name-max-width: 16em;\n  --blm-label-clr: hsla(var(--blm-label-clr-h), var(--blm-label-clr-s), var(--blm-label-clr-l), var(--blm-label-clr-a));\n  --blm-label-clr-h: var(--blm-txt-strong-h);\n  --blm-label-clr-s: var(--blm-txt-strong-s);\n  --blm-label-clr-l: var(--blm-txt-strong-l);\n  --blm-label-clr-a: var(--blm-txt-strong-a);\n  --blm-label-weight: var(--blm-weight-bold);\n  --blm-help-s: var(--blm-s-small);\n  --blm-input-icon-act-clr: hsla(var(--blm-input-icon-act-clr-h), var(--blm-input-icon-act-clr-s), var(--blm-input-icon-act-clr-l), var(--blm-input-icon-act-clr-a));\n  --blm-input-icon-act-clr-h: var(--blm-txt-h);\n  --blm-input-icon-act-clr-s: var(--blm-txt-s);\n  --blm-input-icon-act-clr-l: var(--blm-txt-l);\n  --blm-input-icon-act-clr-a: var(--blm-txt-a);\n  --blm-input-icon-clr: hsla(var(--blm-input-icon-clr-h), var(--blm-input-icon-clr-s), var(--blm-input-icon-clr-l), var(--blm-input-icon-clr-a));\n  --blm-input-icon-clr-h: var(--blm-bd-h);\n  --blm-input-icon-clr-s: var(--blm-bd-s);\n  --blm-input-icon-clr-l: var(--blm-bd-l);\n  --blm-input-icon-clr-a: var(--blm-bd-a);\n  --blm-bread-itm-clr: hsla(var(--blm-bread-itm-clr-h), var(--blm-bread-itm-clr-s), var(--blm-bread-itm-clr-l), var(--blm-bread-itm-clr-a));\n  --blm-bread-itm-clr-h: var(--blm-link-h);\n  --blm-bread-itm-clr-s: var(--blm-link-s);\n  --blm-bread-itm-clr-l: var(--blm-link-l);\n  --blm-bread-itm-clr-a: var(--blm-link-a);\n  --blm-bread-itm-p-vertical: 0;\n  --blm-bread-itm-p-horizontal: 0.75em;\n  --blm-bread-itm-hov-clr: hsla(var(--blm-bread-itm-hov-clr-h), var(--blm-bread-itm-hov-clr-s), var(--blm-bread-itm-hov-clr-l), var(--blm-bread-itm-hov-clr-a));\n  --blm-bread-itm-hov-clr-h: var(--blm-link-hov-h);\n  --blm-bread-itm-hov-clr-s: var(--blm-link-hov-s);\n  --blm-bread-itm-hov-clr-l: var(--blm-link-hov-l);\n  --blm-bread-itm-hov-clr-a: var(--blm-link-hov-a);\n  --blm-bread-itm-act-clr: hsla(var(--blm-bread-itm-act-clr-h), var(--blm-bread-itm-act-clr-s), var(--blm-bread-itm-act-clr-l), var(--blm-bread-itm-act-clr-a));\n  --blm-bread-itm-act-clr-h: var(--blm-txt-strong-h);\n  --blm-bread-itm-act-clr-s: var(--blm-txt-strong-s);\n  --blm-bread-itm-act-clr-l: var(--blm-txt-strong-l);\n  --blm-bread-itm-act-clr-a: var(--blm-txt-strong-a);\n  --blm-bread-itm-separator-clr: hsla(var(--blm-bread-itm-separator-clr-h), var(--blm-bread-itm-separator-clr-s), var(--blm-bread-itm-separator-clr-l), var(--blm-bread-itm-separator-clr-a));\n  --blm-bread-itm-separator-clr-h: var(--blm-bd-hov-h);\n  --blm-bread-itm-separator-clr-s: var(--blm-bd-hov-s);\n  --blm-bread-itm-separator-clr-l: var(--blm-bd-hov-l);\n  --blm-bread-itm-separator-clr-a: var(--blm-bd-hov-a);\n  --blm-block-spacing: 1.5rem;\n  --blm-card-bg-clr: hsla(var(--blm-card-bg-clr-h), var(--blm-card-bg-clr-s), var(--blm-card-bg-clr-l), var(--blm-card-bg-clr-a));\n  --blm-card-bg-clr-h: var(--blm-sch-main-h);\n  --blm-card-bg-clr-s: var(--blm-sch-main-s);\n  --blm-card-bg-clr-l: var(--blm-sch-main-l);\n  --blm-card-bg-clr-a: var(--blm-sch-main-a);\n  --blm-card-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-card-clr: hsla(var(--blm-card-clr-h), var(--blm-card-clr-s), var(--blm-card-clr-l), var(--blm-card-clr-a));\n  --blm-card-clr-h: var(--blm-txt-h);\n  --blm-card-clr-s: var(--blm-txt-s);\n  --blm-card-clr-l: var(--blm-txt-l);\n  --blm-card-clr-a: var(--blm-txt-a);\n  --blm-card-hd-bg-clr: hsla(var(--blm-card-hd-bg-clr-h), var(--blm-card-hd-bg-clr-s), var(--blm-card-hd-bg-clr-l), var(--blm-card-hd-bg-clr-a));\n  --blm-card-hd-bg-clr-h: 0;\n  --blm-card-hd-bg-clr-s: 0%;\n  --blm-card-hd-bg-clr-l: 0%;\n  --blm-card-hd-bg-clr-a: 0;\n  --blm-card-hd-shadow: 0 0.125em 0.25em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  --blm-card-hd-clr: hsla(var(--blm-card-hd-clr-h), var(--blm-card-hd-clr-s), var(--blm-card-hd-clr-l), var(--blm-card-hd-clr-a));\n  --blm-card-hd-clr-h: var(--blm-txt-strong-h);\n  --blm-card-hd-clr-s: var(--blm-txt-strong-s);\n  --blm-card-hd-clr-l: var(--blm-txt-strong-l);\n  --blm-card-hd-clr-a: var(--blm-txt-strong-a);\n  --blm-card-hd-weight: var(--blm-weight-bold);\n  --blm-card-hd-p: 0.75rem 1rem;\n  --blm-card-ct-bg-clr: hsla(var(--blm-card-ct-bg-clr-h), var(--blm-card-ct-bg-clr-s), var(--blm-card-ct-bg-clr-l), var(--blm-card-ct-bg-clr-a));\n  --blm-card-ct-bg-clr-h: 0;\n  --blm-card-ct-bg-clr-s: 0%;\n  --blm-card-ct-bg-clr-l: 0%;\n  --blm-card-ct-bg-clr-a: 0;\n  --blm-card-ct-p: 1.5rem;\n  --blm-card-ft-bg-clr: hsla(var(--blm-card-ft-bg-clr-h), var(--blm-card-ft-bg-clr-s), var(--blm-card-ft-bg-clr-l), var(--blm-card-ft-bg-clr-a));\n  --blm-card-ft-bg-clr-h: 0;\n  --blm-card-ft-bg-clr-s: 0%;\n  --blm-card-ft-bg-clr-l: 0%;\n  --blm-card-ft-bg-clr-a: 0;\n  --blm-card-ft-bd-top: 1px solid var(--blm-bd-light);\n  --blm-card-ft-p: 0.75rem;\n  --blm-card-media-m: var(--blm-block-spacing);\n  --blm-drp-ct-offset: 4px;\n  --blm-drp-menu-min-width: 12rem;\n  --blm-drp-ct-z: 20;\n  --blm-drp-ct-bg-clr: hsla(var(--blm-drp-ct-bg-clr-h), var(--blm-drp-ct-bg-clr-s), var(--blm-drp-ct-bg-clr-l), var(--blm-drp-ct-bg-clr-a));\n  --blm-drp-ct-bg-clr-h: var(--blm-sch-main-h);\n  --blm-drp-ct-bg-clr-s: var(--blm-sch-main-s);\n  --blm-drp-ct-bg-clr-l: var(--blm-sch-main-l);\n  --blm-drp-ct-bg-clr-a: var(--blm-sch-main-a);\n  --blm-drp-ct-radius: var(--blm-radius);\n  --blm-drp-ct-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-drp-ct-p-bottom: 0.5rem;\n  --blm-drp-ct-p-top: 0.5rem;\n  --blm-drp-itm-clr: hsla(var(--blm-drp-itm-clr-h), var(--blm-drp-itm-clr-s), var(--blm-drp-itm-clr-l), var(--blm-drp-itm-clr-a));\n  --blm-drp-itm-clr-h: var(--blm-txt-h);\n  --blm-drp-itm-clr-s: var(--blm-txt-s);\n  --blm-drp-itm-clr-l: var(--blm-txt-l);\n  --blm-drp-itm-clr-a: var(--blm-txt-a);\n  --blm-drp-itm-hov-bg-clr: hsla(var(--blm-drp-itm-hov-bg-clr-h), var(--blm-drp-itm-hov-bg-clr-s), var(--blm-drp-itm-hov-bg-clr-l), var(--blm-drp-itm-hov-bg-clr-a));\n  --blm-drp-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-drp-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-drp-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-drp-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-drp-itm-hov-clr: hsla(var(--blm-drp-itm-hov-clr-h), var(--blm-drp-itm-hov-clr-s), var(--blm-drp-itm-hov-clr-l), var(--blm-drp-itm-hov-clr-a));\n  --blm-drp-itm-hov-clr-h: var(--blm-sch-inv-h);\n  --blm-drp-itm-hov-clr-s: var(--blm-sch-inv-s);\n  --blm-drp-itm-hov-clr-l: var(--blm-sch-inv-l);\n  --blm-drp-itm-hov-clr-a: var(--blm-sch-inv-a);\n  --blm-drp-itm-act-bg-clr: hsla(var(--blm-drp-itm-act-bg-clr-h), var(--blm-drp-itm-act-bg-clr-s), var(--blm-drp-itm-act-bg-clr-l), var(--blm-drp-itm-act-bg-clr-a));\n  --blm-drp-itm-act-bg-clr-h: var(--blm-link-h);\n  --blm-drp-itm-act-bg-clr-s: var(--blm-link-s);\n  --blm-drp-itm-act-bg-clr-l: var(--blm-link-l);\n  --blm-drp-itm-act-bg-clr-a: var(--blm-link-a);\n  --blm-drp-itm-act-clr: hsla(var(--blm-drp-itm-act-clr-h), var(--blm-drp-itm-act-clr-s), var(--blm-drp-itm-act-clr-l), var(--blm-drp-itm-act-clr-a));\n  --blm-drp-itm-act-clr-h: var(--blm-link-inv-h);\n  --blm-drp-itm-act-clr-s: var(--blm-link-inv-s);\n  --blm-drp-itm-act-clr-l: var(--blm-link-inv-l);\n  --blm-drp-itm-act-clr-a: var(--blm-link-inv-a);\n  --blm-drp-dvd-bg-clr: hsla(var(--blm-drp-dvd-bg-clr-h), var(--blm-drp-dvd-bg-clr-s), var(--blm-drp-dvd-bg-clr-l), var(--blm-drp-dvd-bg-clr-a));\n  --blm-drp-dvd-bg-clr-h: var(--blm-bd-light-h);\n  --blm-drp-dvd-bg-clr-s: var(--blm-bd-light-s);\n  --blm-drp-dvd-bg-clr-l: var(--blm-bd-light-l);\n  --blm-drp-dvd-bg-clr-a: var(--blm-bd-light-a);\n  --blm-level-itm-spacing: calc(var(--blm-block-spacing)/2);\n  --blm-media-bd-clr: hsla(var(--blm-media-bd-clr-h), var(--blm-media-bd-clr-s), var(--blm-media-bd-clr-l), var(--blm-media-bd-clr-a));\n  --blm-media-bd-clr-h: var(--blm-bd-h);\n  --blm-media-bd-clr-s: var(--blm-bd-s);\n  --blm-media-bd-clr-l: var(--blm-bd-l);\n  --blm-media-bd-clr-a: 0.5;\n  --blm-media-spacing: 1rem;\n  --blm-media-spacing-lg: 1.5rem;\n  --blm-menu-list-line-height: 1.25;\n  --blm-menu-itm-radius: var(--blm-radius-small);\n  --blm-menu-itm-clr: hsla(var(--blm-menu-itm-clr-h), var(--blm-menu-itm-clr-s), var(--blm-menu-itm-clr-l), var(--blm-menu-itm-clr-a));\n  --blm-menu-itm-clr-h: var(--blm-txt-h);\n  --blm-menu-itm-clr-s: var(--blm-txt-s);\n  --blm-menu-itm-clr-l: var(--blm-txt-l);\n  --blm-menu-itm-clr-a: var(--blm-txt-a);\n  --blm-menu-list-link-p: 0.5em 0.75em;\n  --blm-menu-itm-hov-bg-clr: hsla(var(--blm-menu-itm-hov-bg-clr-h), var(--blm-menu-itm-hov-bg-clr-s), var(--blm-menu-itm-hov-bg-clr-l), var(--blm-menu-itm-hov-bg-clr-a));\n  --blm-menu-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-menu-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-menu-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-menu-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-menu-itm-hov-clr: hsla(var(--blm-menu-itm-hov-clr-h), var(--blm-menu-itm-hov-clr-s), var(--blm-menu-itm-hov-clr-l), var(--blm-menu-itm-hov-clr-a));\n  --blm-menu-itm-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-menu-itm-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-menu-itm-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-menu-itm-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-menu-itm-act-bg-clr: hsla(var(--blm-menu-itm-act-bg-clr-h), var(--blm-menu-itm-act-bg-clr-s), var(--blm-menu-itm-act-bg-clr-l), var(--blm-menu-itm-act-bg-clr-a));\n  --blm-menu-itm-act-bg-clr-h: var(--blm-link-h);\n  --blm-menu-itm-act-bg-clr-s: var(--blm-link-s);\n  --blm-menu-itm-act-bg-clr-l: var(--blm-link-l);\n  --blm-menu-itm-act-bg-clr-a: var(--blm-link-a);\n  --blm-menu-itm-act-clr: hsla(var(--blm-menu-itm-act-clr-h), var(--blm-menu-itm-act-clr-s), var(--blm-menu-itm-act-clr-l), var(--blm-menu-itm-act-clr-a));\n  --blm-menu-itm-act-clr-h: var(--blm-link-inv-h);\n  --blm-menu-itm-act-clr-s: var(--blm-link-inv-s);\n  --blm-menu-itm-act-clr-l: var(--blm-link-inv-l);\n  --blm-menu-itm-act-clr-a: var(--blm-link-inv-a);\n  --blm-menu-list-bd-left: 1px solid var(--blm-bd);\n  --blm-menu-nested-list-m: 0.75em;\n  --blm-menu-nested-list-p-left: 0.75em;\n  --blm-menu-label-clr: hsla(var(--blm-menu-label-clr-h), var(--blm-menu-label-clr-s), var(--blm-menu-label-clr-l), var(--blm-menu-label-clr-a));\n  --blm-menu-label-clr-h: var(--blm-txt-light-h);\n  --blm-menu-label-clr-s: var(--blm-txt-light-s);\n  --blm-menu-label-clr-l: var(--blm-txt-light-l);\n  --blm-menu-label-clr-a: var(--blm-txt-light-a);\n  --blm-menu-label-font-s: 0.75em;\n  --blm-menu-label-letter-spacing: 0.1em;\n  --blm-menu-label-spacing: 1em;\n  --blm-txt-inv: hsla(var(--blm-txt-inv-h), var(--blm-txt-inv-s), var(--blm-txt-inv-l), var(--blm-txt-inv-a));\n  --blm-txt-inv-h: 0;\n  --blm-txt-inv-s: 0%;\n  --blm-txt-inv-l: 100%;\n  --blm-txt-inv-a: 1;\n  --blm-msg-bg-clr: hsla(var(--blm-msg-bg-clr-h), var(--blm-msg-bg-clr-s), var(--blm-msg-bg-clr-l), var(--blm-msg-bg-clr-a));\n  --blm-msg-bg-clr-h: var(--blm-bg-h);\n  --blm-msg-bg-clr-s: var(--blm-bg-s);\n  --blm-msg-bg-clr-l: var(--blm-bg-l);\n  --blm-msg-bg-clr-a: var(--blm-bg-a);\n  --blm-msg-radius: var(--blm-radius);\n  --blm-msg-hd-bg-clr: hsla(var(--blm-msg-hd-bg-clr-h), var(--blm-msg-hd-bg-clr-s), var(--blm-msg-hd-bg-clr-l), var(--blm-msg-hd-bg-clr-a));\n  --blm-msg-hd-bg-clr-h: var(--blm-txt-h);\n  --blm-msg-hd-bg-clr-s: var(--blm-txt-s);\n  --blm-msg-hd-bg-clr-l: var(--blm-txt-l);\n  --blm-msg-hd-bg-clr-a: var(--blm-txt-a);\n  --blm-msg-hd-radius: var(--blm-radius);\n  --blm-msg-hd-clr: hsla(var(--blm-msg-hd-clr-h), var(--blm-msg-hd-clr-s), var(--blm-msg-hd-clr-l), var(--blm-msg-hd-clr-a));\n  --blm-msg-hd-clr-h: var(--blm-txt-inv-h);\n  --blm-msg-hd-clr-s: var(--blm-txt-inv-s);\n  --blm-msg-hd-clr-l: var(--blm-txt-inv-l);\n  --blm-msg-hd-clr-a: var(--blm-txt-inv-a);\n  --blm-msg-hd-weight: var(--blm-weight-bold);\n  --blm-msg-hd-p: 0.75em 1em;\n  --blm-msg-hd-body-bd-width: 0;\n  --blm-msg-body-bd-clr: hsla(var(--blm-msg-body-bd-clr-h), var(--blm-msg-body-bd-clr-s), var(--blm-msg-body-bd-clr-l), var(--blm-msg-body-bd-clr-a));\n  --blm-msg-body-bd-clr-h: var(--blm-bd-h);\n  --blm-msg-body-bd-clr-s: var(--blm-bd-s);\n  --blm-msg-body-bd-clr-l: var(--blm-bd-l);\n  --blm-msg-body-bd-clr-a: var(--blm-bd-a);\n  --blm-msg-body-radius: var(--blm-radius);\n  --blm-msg-body-bd-width: 0 0 0 4px;\n  --blm-msg-body-clr: hsla(var(--blm-msg-body-clr-h), var(--blm-msg-body-clr-s), var(--blm-msg-body-clr-l), var(--blm-msg-body-clr-a));\n  --blm-msg-body-clr-h: var(--blm-txt-h);\n  --blm-msg-body-clr-s: var(--blm-txt-s);\n  --blm-msg-body-clr-l: var(--blm-txt-l);\n  --blm-msg-body-clr-a: var(--blm-txt-a);\n  --blm-msg-body-p: 1.25em 1.5em;\n  --blm-msg-body-pre-bg-clr: hsla(var(--blm-msg-body-pre-bg-clr-h), var(--blm-msg-body-pre-bg-clr-s), var(--blm-msg-body-pre-bg-clr-l), var(--blm-msg-body-pre-bg-clr-a));\n  --blm-msg-body-pre-bg-clr-h: var(--blm-sch-main-h);\n  --blm-msg-body-pre-bg-clr-s: var(--blm-sch-main-s);\n  --blm-msg-body-pre-bg-clr-l: var(--blm-sch-main-l);\n  --blm-msg-body-pre-bg-clr-a: var(--blm-sch-main-a);\n  --blm-msg-body-pre-code-bg-clr: hsla(var(--blm-msg-body-pre-code-bg-clr-h), var(--blm-msg-body-pre-code-bg-clr-s), var(--blm-msg-body-pre-code-bg-clr-l), var(--blm-msg-body-pre-code-bg-clr-a));\n  --blm-msg-body-pre-code-bg-clr-h: 0;\n  --blm-msg-body-pre-code-bg-clr-s: 0%;\n  --blm-msg-body-pre-code-bg-clr-l: 0%;\n  --blm-msg-body-pre-code-bg-clr-a: 0;\n  --blm-modal-z: 40;\n  --blm-modal-bg-bg-clr: hsla(var(--blm-modal-bg-bg-clr-h), var(--blm-modal-bg-bg-clr-s), var(--blm-modal-bg-bg-clr-l), var(--blm-modal-bg-bg-clr-a));\n  --blm-modal-bg-bg-clr-h: var(--blm-sch-inv-h);\n  --blm-modal-bg-bg-clr-s: var(--blm-sch-inv-s);\n  --blm-modal-bg-bg-clr-l: var(--blm-sch-inv-l);\n  --blm-modal-bg-bg-clr-a: 0.86;\n  --blm-modal-ct-m-mobile: 20px;\n  --blm-modal-ct-spacing-mobile: 160px;\n  --blm-modal-ct-spacing-tablet: 40px;\n  --blm-modal-ct-width: 640px;\n  --blm-modal-close-dim: 40px;\n  --blm-modal-close-right: 20px;\n  --blm-modal-close-top: 20px;\n  --blm-modal-card-spacing: 40px;\n  --blm-modal-card-head-bg-clr: hsla(var(--blm-modal-card-head-bg-clr-h), var(--blm-modal-card-head-bg-clr-s), var(--blm-modal-card-head-bg-clr-l), var(--blm-modal-card-head-bg-clr-a));\n  --blm-modal-card-head-bg-clr-h: var(--blm-bg-h);\n  --blm-modal-card-head-bg-clr-s: var(--blm-bg-s);\n  --blm-modal-card-head-bg-clr-l: var(--blm-bg-l);\n  --blm-modal-card-head-bg-clr-a: var(--blm-bg-a);\n  --blm-modal-card-head-p: 20px;\n  --blm-modal-card-head-bd-bottom: 1px solid var(--blm-bd);\n  --blm-modal-card-head-radius: var(--blm-radius-lg);\n  --blm-modal-card-title-clr: hsla(var(--blm-modal-card-title-clr-h), var(--blm-modal-card-title-clr-s), var(--blm-modal-card-title-clr-l), var(--blm-modal-card-title-clr-a));\n  --blm-modal-card-title-clr-h: var(--blm-txt-strong-h);\n  --blm-modal-card-title-clr-s: var(--blm-txt-strong-s);\n  --blm-modal-card-title-clr-l: var(--blm-txt-strong-l);\n  --blm-modal-card-title-clr-a: var(--blm-txt-strong-a);\n  --blm-modal-card-title-s: var(--blm-s-4);\n  --blm-modal-card-title-line-height: 1;\n  --blm-modal-card-foot-radius: var(--blm-radius-lg);\n  --blm-modal-card-foot-bd-top: 1px solid var(--blm-bd);\n  --blm-modal-card-body-bg-clr: hsla(var(--blm-modal-card-body-bg-clr-h), var(--blm-modal-card-body-bg-clr-s), var(--blm-modal-card-body-bg-clr-l), var(--blm-modal-card-body-bg-clr-a));\n  --blm-modal-card-body-bg-clr-h: var(--blm-sch-main-h);\n  --blm-modal-card-body-bg-clr-s: var(--blm-sch-main-s);\n  --blm-modal-card-body-bg-clr-l: var(--blm-sch-main-l);\n  --blm-modal-card-body-bg-clr-a: var(--blm-sch-main-a);\n  --blm-modal-card-body-p: 20px;\n  --blm-nav-itm-clr: hsla(var(--blm-nav-itm-clr-h), var(--blm-nav-itm-clr-s), var(--blm-nav-itm-clr-l), var(--blm-nav-itm-clr-a));\n  --blm-nav-itm-clr-h: var(--blm-txt-h);\n  --blm-nav-itm-clr-s: var(--blm-txt-s);\n  --blm-nav-itm-clr-l: var(--blm-txt-l);\n  --blm-nav-itm-clr-a: var(--blm-txt-a);\n  --blm-nav-bg-clr: hsla(var(--blm-nav-bg-clr-h), var(--blm-nav-bg-clr-s), var(--blm-nav-bg-clr-l), var(--blm-nav-bg-clr-a));\n  --blm-nav-bg-clr-h: var(--blm-sch-main-h);\n  --blm-nav-bg-clr-s: var(--blm-sch-main-s);\n  --blm-nav-bg-clr-l: var(--blm-sch-main-l);\n  --blm-nav-bg-clr-a: var(--blm-sch-main-a);\n  --blm-nav-height: 3.25rem;\n  --blm-nav-z: 30;\n  --blm-nav-box-shadow-s: 0 2px 0 0;\n  --blm-nav-box-shadow-clr: hsla(var(--blm-nav-box-shadow-clr-h), var(--blm-nav-box-shadow-clr-s), var(--blm-nav-box-shadow-clr-l), var(--blm-nav-box-shadow-clr-a));\n  --blm-nav-box-shadow-clr-h: var(--blm-bg-h);\n  --blm-nav-box-shadow-clr-s: var(--blm-bg-s);\n  --blm-nav-box-shadow-clr-l: var(--blm-bg-l);\n  --blm-nav-box-shadow-clr-a: var(--blm-bg-a);\n  --blm-nav-fixed-z: 30;\n  --blm-nav-bottom-box-shadow-s: 0 -2px 0 0;\n  --blm-nav-burger-clr: hsla(var(--blm-nav-burger-clr-h), var(--blm-nav-burger-clr-s), var(--blm-nav-burger-clr-l), var(--blm-nav-burger-clr-a));\n  --blm-nav-burger-clr-h: var(--blm-nav-itm-clr-h);\n  --blm-nav-burger-clr-s: var(--blm-nav-itm-clr-s);\n  --blm-nav-burger-clr-l: var(--blm-nav-itm-clr-l);\n  --blm-nav-burger-clr-a: var(--blm-nav-itm-clr-a);\n  --blm-speed: 86ms;\n  --blm-easing: ease-out;\n  --blm-nav-itm-hov-bg-clr: hsla(var(--blm-nav-itm-hov-bg-clr-h), var(--blm-nav-itm-hov-bg-clr-s), var(--blm-nav-itm-hov-bg-clr-l), var(--blm-nav-itm-hov-bg-clr-a));\n  --blm-nav-itm-hov-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-nav-itm-hov-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-nav-itm-hov-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-nav-itm-hov-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-nav-itm-hov-clr: hsla(var(--blm-nav-itm-hov-clr-h), var(--blm-nav-itm-hov-clr-s), var(--blm-nav-itm-hov-clr-l), var(--blm-nav-itm-hov-clr-a));\n  --blm-nav-itm-hov-clr-h: var(--blm-link-h);\n  --blm-nav-itm-hov-clr-s: var(--blm-link-s);\n  --blm-nav-itm-hov-clr-l: var(--blm-link-l);\n  --blm-nav-itm-hov-clr-a: var(--blm-link-a);\n  --blm-nav-itm-img-max-height: 1.75rem;\n  --blm-nav-tab-hov-bg-clr: hsla(var(--blm-nav-tab-hov-bg-clr-h), var(--blm-nav-tab-hov-bg-clr-s), var(--blm-nav-tab-hov-bg-clr-l), var(--blm-nav-tab-hov-bg-clr-a));\n  --blm-nav-tab-hov-bg-clr-h: 0;\n  --blm-nav-tab-hov-bg-clr-s: 0%;\n  --blm-nav-tab-hov-bg-clr-l: 0%;\n  --blm-nav-tab-hov-bg-clr-a: 0;\n  --blm-nav-tab-hov-bd-bottom-clr: hsla(var(--blm-nav-tab-hov-bd-bottom-clr-h), var(--blm-nav-tab-hov-bd-bottom-clr-s), var(--blm-nav-tab-hov-bd-bottom-clr-l), var(--blm-nav-tab-hov-bd-bottom-clr-a));\n  --blm-nav-tab-hov-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-nav-tab-hov-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-nav-tab-hov-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-nav-tab-hov-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-nav-tab-act-bg-clr: hsla(var(--blm-nav-tab-act-bg-clr-h), var(--blm-nav-tab-act-bg-clr-s), var(--blm-nav-tab-act-bg-clr-l), var(--blm-nav-tab-act-bg-clr-a));\n  --blm-nav-tab-act-bg-clr-h: 0;\n  --blm-nav-tab-act-bg-clr-s: 0%;\n  --blm-nav-tab-act-bg-clr-l: 0%;\n  --blm-nav-tab-act-bg-clr-a: 0;\n  --blm-nav-tab-act-bd-bottom-clr: hsla(var(--blm-nav-tab-act-bd-bottom-clr-h), var(--blm-nav-tab-act-bd-bottom-clr-s), var(--blm-nav-tab-act-bd-bottom-clr-l), var(--blm-nav-tab-act-bd-bottom-clr-a));\n  --blm-nav-tab-act-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-nav-tab-act-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-nav-tab-act-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-nav-tab-act-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-nav-tab-act-bd-bottom-style: solid;\n  --blm-nav-tab-act-bd-bottom-width: 3px;\n  --blm-nav-tab-act-clr: hsla(var(--blm-nav-tab-act-clr-h), var(--blm-nav-tab-act-clr-s), var(--blm-nav-tab-act-clr-l), var(--blm-nav-tab-act-clr-a));\n  --blm-nav-tab-act-clr-h: var(--blm-link-h);\n  --blm-nav-tab-act-clr-s: var(--blm-link-s);\n  --blm-nav-tab-act-clr-l: var(--blm-link-l);\n  --blm-nav-tab-act-clr-a: var(--blm-link-a);\n  --blm-nav-drp-arrow: hsla(var(--blm-nav-drp-arrow-h), var(--blm-nav-drp-arrow-s), var(--blm-nav-drp-arrow-l), var(--blm-nav-drp-arrow-a));\n  --blm-nav-drp-arrow-h: var(--blm-link-h);\n  --blm-nav-drp-arrow-s: var(--blm-link-s);\n  --blm-nav-drp-arrow-l: var(--blm-link-l);\n  --blm-nav-drp-arrow-a: var(--blm-link-a);\n  --blm-nav-dvd-bg-clr: hsla(var(--blm-nav-dvd-bg-clr-h), var(--blm-nav-dvd-bg-clr-s), var(--blm-nav-dvd-bg-clr-l), var(--blm-nav-dvd-bg-clr-a));\n  --blm-nav-dvd-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-dvd-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-dvd-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-dvd-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-dvd-height: 2px;\n  --blm-nav-p-vertical: 1rem;\n  --blm-nav-p-horizontal: 2rem;\n  --blm-nav-drp-itm-hov-bg-clr: hsla(var(--blm-nav-drp-itm-hov-bg-clr-h), var(--blm-nav-drp-itm-hov-bg-clr-s), var(--blm-nav-drp-itm-hov-bg-clr-l), var(--blm-nav-drp-itm-hov-bg-clr-a));\n  --blm-nav-drp-itm-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-drp-itm-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-drp-itm-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-drp-itm-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-drp-itm-hov-clr: hsla(var(--blm-nav-drp-itm-hov-clr-h), var(--blm-nav-drp-itm-hov-clr-s), var(--blm-nav-drp-itm-hov-clr-l), var(--blm-nav-drp-itm-hov-clr-a));\n  --blm-nav-drp-itm-hov-clr-h: var(--blm-sch-inv-h);\n  --blm-nav-drp-itm-hov-clr-s: var(--blm-sch-inv-s);\n  --blm-nav-drp-itm-hov-clr-l: var(--blm-sch-inv-l);\n  --blm-nav-drp-itm-hov-clr-a: var(--blm-sch-inv-a);\n  --blm-nav-drp-itm-act-bg-clr: hsla(var(--blm-nav-drp-itm-act-bg-clr-h), var(--blm-nav-drp-itm-act-bg-clr-s), var(--blm-nav-drp-itm-act-bg-clr-l), var(--blm-nav-drp-itm-act-bg-clr-a));\n  --blm-nav-drp-itm-act-bg-clr-h: var(--blm-bg-h);\n  --blm-nav-drp-itm-act-bg-clr-s: var(--blm-bg-s);\n  --blm-nav-drp-itm-act-bg-clr-l: var(--blm-bg-l);\n  --blm-nav-drp-itm-act-bg-clr-a: var(--blm-bg-a);\n  --blm-nav-drp-itm-act-clr: hsla(var(--blm-nav-drp-itm-act-clr-h), var(--blm-nav-drp-itm-act-clr-s), var(--blm-nav-drp-itm-act-clr-l), var(--blm-nav-drp-itm-act-clr-a));\n  --blm-nav-drp-itm-act-clr-h: var(--blm-link-h);\n  --blm-nav-drp-itm-act-clr-s: var(--blm-link-s);\n  --blm-nav-drp-itm-act-clr-l: var(--blm-link-l);\n  --blm-nav-drp-itm-act-clr-a: var(--blm-link-a);\n  --blm-nav-drp-bd-top: 2px solid var(--blm-bd);\n  --blm-nav-drp-radius: var(--blm-radius-lg);\n  --blm-nav-drp-bg-clr: hsla(var(--blm-nav-drp-bg-clr-h), var(--blm-nav-drp-bg-clr-s), var(--blm-nav-drp-bg-clr-l), var(--blm-nav-drp-bg-clr-a));\n  --blm-nav-drp-bg-clr-h: var(--blm-sch-main-h);\n  --blm-nav-drp-bg-clr-s: var(--blm-sch-main-s);\n  --blm-nav-drp-bg-clr-l: var(--blm-sch-main-l);\n  --blm-nav-drp-bg-clr-a: var(--blm-sch-main-a);\n  --blm-nav-drp-z: 20;\n  --blm-nav-drp-boxed-radius: var(--blm-radius-lg);\n  --blm-nav-drp-boxed-shadow: 0 8px 8px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1);\n  --blm-nav-drp-offset: -4px;\n  --blm-nav-itm-act-clr: hsla(var(--blm-nav-itm-act-clr-h), var(--blm-nav-itm-act-clr-s), var(--blm-nav-itm-act-clr-l), var(--blm-nav-itm-act-clr-a));\n  --blm-nav-itm-act-clr-h: var(--blm-sch-inv-h);\n  --blm-nav-itm-act-clr-s: var(--blm-sch-inv-s);\n  --blm-nav-itm-act-clr-l: var(--blm-sch-inv-l);\n  --blm-nav-itm-act-clr-a: var(--blm-sch-inv-a);\n  --blm-nav-itm-act-bg-clr: hsla(var(--blm-nav-itm-act-bg-clr-h), var(--blm-nav-itm-act-bg-clr-s), var(--blm-nav-itm-act-bg-clr-l), var(--blm-nav-itm-act-bg-clr-a));\n  --blm-nav-itm-act-bg-clr-h: 0;\n  --blm-nav-itm-act-bg-clr-s: 0%;\n  --blm-nav-itm-act-bg-clr-l: 0%;\n  --blm-nav-itm-act-bg-clr-a: 0;\n  --blm-pag-m: -0.25rem;\n  --blm-pag-itm-font-s: 1em;\n  --blm-pag-itm-m: 0.25rem;\n  --blm-pag-itm-p-left: 0.5em;\n  --blm-pag-itm-p-right: 0.5em;\n  --blm-pag-bd-clr: hsla(var(--blm-pag-bd-clr-h), var(--blm-pag-bd-clr-s), var(--blm-pag-bd-clr-l), var(--blm-pag-bd-clr-a));\n  --blm-pag-bd-clr-h: var(--blm-bd-h);\n  --blm-pag-bd-clr-s: var(--blm-bd-s);\n  --blm-pag-bd-clr-l: var(--blm-bd-l);\n  --blm-pag-bd-clr-a: var(--blm-bd-a);\n  --blm-pag-clr: hsla(var(--blm-pag-clr-h), var(--blm-pag-clr-s), var(--blm-pag-clr-l), var(--blm-pag-clr-a));\n  --blm-pag-clr-h: var(--blm-txt-strong-h);\n  --blm-pag-clr-s: var(--blm-txt-strong-s);\n  --blm-pag-clr-l: var(--blm-txt-strong-l);\n  --blm-pag-clr-a: var(--blm-txt-strong-a);\n  --blm-pag-min-width: var(--blm-ctrl-height);\n  --blm-pag-hov-bd-clr: hsla(var(--blm-pag-hov-bd-clr-h), var(--blm-pag-hov-bd-clr-s), var(--blm-pag-hov-bd-clr-l), var(--blm-pag-hov-bd-clr-a));\n  --blm-pag-hov-bd-clr-h: var(--blm-link-hov-bd-h);\n  --blm-pag-hov-bd-clr-s: var(--blm-link-hov-bd-s);\n  --blm-pag-hov-bd-clr-l: var(--blm-link-hov-bd-l);\n  --blm-pag-hov-bd-clr-a: var(--blm-link-hov-bd-a);\n  --blm-pag-hov-clr: hsla(var(--blm-pag-hov-clr-h), var(--blm-pag-hov-clr-s), var(--blm-pag-hov-clr-l), var(--blm-pag-hov-clr-a));\n  --blm-pag-hov-clr-h: var(--blm-link-hov-h);\n  --blm-pag-hov-clr-s: var(--blm-link-hov-s);\n  --blm-pag-hov-clr-l: var(--blm-link-hov-l);\n  --blm-pag-hov-clr-a: var(--blm-link-hov-a);\n  --blm-pag-foc-bd-clr: hsla(var(--blm-pag-foc-bd-clr-h), var(--blm-pag-foc-bd-clr-s), var(--blm-pag-foc-bd-clr-l), var(--blm-pag-foc-bd-clr-a));\n  --blm-pag-foc-bd-clr-h: var(--blm-link-foc-bd-h);\n  --blm-pag-foc-bd-clr-s: var(--blm-link-foc-bd-s);\n  --blm-pag-foc-bd-clr-l: var(--blm-link-foc-bd-l);\n  --blm-pag-foc-bd-clr-a: var(--blm-link-foc-bd-a);\n  --blm-pag-shadow-inset: inset 0 1px 2px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.2);\n  --blm-pag-dsbl-bg-clr: hsla(var(--blm-pag-dsbl-bg-clr-h), var(--blm-pag-dsbl-bg-clr-s), var(--blm-pag-dsbl-bg-clr-l), var(--blm-pag-dsbl-bg-clr-a));\n  --blm-pag-dsbl-bg-clr-h: var(--blm-bd-h);\n  --blm-pag-dsbl-bg-clr-s: var(--blm-bd-s);\n  --blm-pag-dsbl-bg-clr-l: var(--blm-bd-l);\n  --blm-pag-dsbl-bg-clr-a: var(--blm-bd-a);\n  --blm-pag-dsbl-bd-clr: hsla(var(--blm-pag-dsbl-bd-clr-h), var(--blm-pag-dsbl-bd-clr-s), var(--blm-pag-dsbl-bd-clr-l), var(--blm-pag-dsbl-bd-clr-a));\n  --blm-pag-dsbl-bd-clr-h: var(--blm-bd-h);\n  --blm-pag-dsbl-bd-clr-s: var(--blm-bd-s);\n  --blm-pag-dsbl-bd-clr-l: var(--blm-bd-l);\n  --blm-pag-dsbl-bd-clr-a: var(--blm-bd-a);\n  --blm-pag-dsbl-clr: hsla(var(--blm-pag-dsbl-clr-h), var(--blm-pag-dsbl-clr-s), var(--blm-pag-dsbl-clr-l), var(--blm-pag-dsbl-clr-a));\n  --blm-pag-dsbl-clr-h: var(--blm-txt-light-h);\n  --blm-pag-dsbl-clr-s: var(--blm-txt-light-s);\n  --blm-pag-dsbl-clr-l: var(--blm-txt-light-l);\n  --blm-pag-dsbl-clr-a: var(--blm-txt-light-a);\n  --blm-pag-cur-bg-clr: hsla(var(--blm-pag-cur-bg-clr-h), var(--blm-pag-cur-bg-clr-s), var(--blm-pag-cur-bg-clr-l), var(--blm-pag-cur-bg-clr-a));\n  --blm-pag-cur-bg-clr-h: var(--blm-link-h);\n  --blm-pag-cur-bg-clr-s: var(--blm-link-s);\n  --blm-pag-cur-bg-clr-l: var(--blm-link-l);\n  --blm-pag-cur-bg-clr-a: var(--blm-link-a);\n  --blm-pag-cur-bd-clr: hsla(var(--blm-pag-cur-bd-clr-h), var(--blm-pag-cur-bd-clr-s), var(--blm-pag-cur-bd-clr-l), var(--blm-pag-cur-bd-clr-a));\n  --blm-pag-cur-bd-clr-h: var(--blm-link-h);\n  --blm-pag-cur-bd-clr-s: var(--blm-link-s);\n  --blm-pag-cur-bd-clr-l: var(--blm-link-l);\n  --blm-pag-cur-bd-clr-a: var(--blm-link-a);\n  --blm-pag-cur-clr: hsla(var(--blm-pag-cur-clr-h), var(--blm-pag-cur-clr-s), var(--blm-pag-cur-clr-l), var(--blm-pag-cur-clr-a));\n  --blm-pag-cur-clr-h: var(--blm-link-inv-h);\n  --blm-pag-cur-clr-s: var(--blm-link-inv-s);\n  --blm-pag-cur-clr-l: var(--blm-link-inv-l);\n  --blm-pag-cur-clr-a: var(--blm-link-inv-a);\n  --blm-pag-ellipsis-clr: hsla(var(--blm-pag-ellipsis-clr-h), var(--blm-pag-ellipsis-clr-s), var(--blm-pag-ellipsis-clr-l), var(--blm-pag-ellipsis-clr-a));\n  --blm-pag-ellipsis-clr-h: var(--blm-grey-light-h);\n  --blm-pag-ellipsis-clr-s: var(--blm-grey-light-s);\n  --blm-pag-ellipsis-clr-l: var(--blm-grey-light-l);\n  --blm-pag-ellipsis-clr-a: var(--blm-grey-light-a);\n  --blm-pnl-radius: var(--blm-radius-lg);\n  --blm-pnl-shadow: 0 0.5em 1em -0.125em hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.1), 0 0px 0 1px hsla(var(--blm-sch-inv-h), var(--blm-sch-inv-s), var(--blm-sch-inv-l), 0.02);\n  --blm-pnl-m: var(--blm-block-spacing);\n  --blm-pnl-itm-bd: 1px solid var(--blm-bd-light);\n  --blm-pnl-hdg-bg-clr: hsla(var(--blm-pnl-hdg-bg-clr-h), var(--blm-pnl-hdg-bg-clr-s), var(--blm-pnl-hdg-bg-clr-l), var(--blm-pnl-hdg-bg-clr-a));\n  --blm-pnl-hdg-bg-clr-h: var(--blm-bd-light-h);\n  --blm-pnl-hdg-bg-clr-s: var(--blm-bd-light-s);\n  --blm-pnl-hdg-bg-clr-l: var(--blm-bd-light-l);\n  --blm-pnl-hdg-bg-clr-a: var(--blm-bd-light-a);\n  --blm-pnl-hdg-clr: hsla(var(--blm-pnl-hdg-clr-h), var(--blm-pnl-hdg-clr-s), var(--blm-pnl-hdg-clr-l), var(--blm-pnl-hdg-clr-a));\n  --blm-pnl-hdg-clr-h: var(--blm-txt-strong-h);\n  --blm-pnl-hdg-clr-s: var(--blm-txt-strong-s);\n  --blm-pnl-hdg-clr-l: var(--blm-txt-strong-l);\n  --blm-pnl-hdg-clr-a: var(--blm-txt-strong-a);\n  --blm-pnl-hdg-s: 1.25em;\n  --blm-pnl-hdg-weight: var(--blm-weight-bold);\n  --blm-pnl-hdg-line-height: 1.25;\n  --blm-pnl-hdg-p: 0.75em 1em;\n  --blm-pnl-tabs-font-s: 0.875em;\n  --blm-pnl-tab-bd-bottom: 1px solid var(--blm-bd);\n  --blm-pnl-tab-act-bd-bottom-clr: hsla(var(--blm-pnl-tab-act-bd-bottom-clr-h), var(--blm-pnl-tab-act-bd-bottom-clr-s), var(--blm-pnl-tab-act-bd-bottom-clr-l), var(--blm-pnl-tab-act-bd-bottom-clr-a));\n  --blm-pnl-tab-act-bd-bottom-clr-h: var(--blm-link-act-bd-h);\n  --blm-pnl-tab-act-bd-bottom-clr-s: var(--blm-link-act-bd-s);\n  --blm-pnl-tab-act-bd-bottom-clr-l: var(--blm-link-act-bd-l);\n  --blm-pnl-tab-act-bd-bottom-clr-a: var(--blm-link-act-bd-a);\n  --blm-pnl-tab-act-clr: hsla(var(--blm-pnl-tab-act-clr-h), var(--blm-pnl-tab-act-clr-s), var(--blm-pnl-tab-act-clr-l), var(--blm-pnl-tab-act-clr-a));\n  --blm-pnl-tab-act-clr-h: var(--blm-link-act-h);\n  --blm-pnl-tab-act-clr-s: var(--blm-link-act-s);\n  --blm-pnl-tab-act-clr-l: var(--blm-link-act-l);\n  --blm-pnl-tab-act-clr-a: var(--blm-link-act-a);\n  --blm-pnl-list-itm-clr: hsla(var(--blm-pnl-list-itm-clr-h), var(--blm-pnl-list-itm-clr-s), var(--blm-pnl-list-itm-clr-l), var(--blm-pnl-list-itm-clr-a));\n  --blm-pnl-list-itm-clr-h: var(--blm-txt-h);\n  --blm-pnl-list-itm-clr-s: var(--blm-txt-s);\n  --blm-pnl-list-itm-clr-l: var(--blm-txt-l);\n  --blm-pnl-list-itm-clr-a: var(--blm-txt-a);\n  --blm-pnl-list-itm-hov-clr: hsla(var(--blm-pnl-list-itm-hov-clr-h), var(--blm-pnl-list-itm-hov-clr-s), var(--blm-pnl-list-itm-hov-clr-l), var(--blm-pnl-list-itm-hov-clr-a));\n  --blm-pnl-list-itm-hov-clr-h: var(--blm-link-h);\n  --blm-pnl-list-itm-hov-clr-s: var(--blm-link-s);\n  --blm-pnl-list-itm-hov-clr-l: var(--blm-link-l);\n  --blm-pnl-list-itm-hov-clr-a: var(--blm-link-a);\n  --blm-pnl-block-clr: hsla(var(--blm-pnl-block-clr-h), var(--blm-pnl-block-clr-s), var(--blm-pnl-block-clr-l), var(--blm-pnl-block-clr-a));\n  --blm-pnl-block-clr-h: var(--blm-txt-strong-h);\n  --blm-pnl-block-clr-s: var(--blm-txt-strong-s);\n  --blm-pnl-block-clr-l: var(--blm-txt-strong-l);\n  --blm-pnl-block-clr-a: var(--blm-txt-strong-a);\n  --blm-pnl-block-act-bd-left-clr: hsla(var(--blm-pnl-block-act-bd-left-clr-h), var(--blm-pnl-block-act-bd-left-clr-s), var(--blm-pnl-block-act-bd-left-clr-l), var(--blm-pnl-block-act-bd-left-clr-a));\n  --blm-pnl-block-act-bd-left-clr-h: var(--blm-link-h);\n  --blm-pnl-block-act-bd-left-clr-s: var(--blm-link-s);\n  --blm-pnl-block-act-bd-left-clr-l: var(--blm-link-l);\n  --blm-pnl-block-act-bd-left-clr-a: var(--blm-link-a);\n  --blm-pnl-block-act-clr: hsla(var(--blm-pnl-block-act-clr-h), var(--blm-pnl-block-act-clr-s), var(--blm-pnl-block-act-clr-l), var(--blm-pnl-block-act-clr-a));\n  --blm-pnl-block-act-clr-h: var(--blm-link-act-h);\n  --blm-pnl-block-act-clr-s: var(--blm-link-act-s);\n  --blm-pnl-block-act-clr-l: var(--blm-link-act-l);\n  --blm-pnl-block-act-clr-a: var(--blm-link-act-a);\n  --blm-pnl-block-act-icon-clr: hsla(var(--blm-pnl-block-act-icon-clr-h), var(--blm-pnl-block-act-icon-clr-s), var(--blm-pnl-block-act-icon-clr-l), var(--blm-pnl-block-act-icon-clr-a));\n  --blm-pnl-block-act-icon-clr-h: var(--blm-link-h);\n  --blm-pnl-block-act-icon-clr-s: var(--blm-link-s);\n  --blm-pnl-block-act-icon-clr-l: var(--blm-link-l);\n  --blm-pnl-block-act-icon-clr-a: var(--blm-link-a);\n  --blm-pnl-block-hov-bg-clr: hsla(var(--blm-pnl-block-hov-bg-clr-h), var(--blm-pnl-block-hov-bg-clr-s), var(--blm-pnl-block-hov-bg-clr-l), var(--blm-pnl-block-hov-bg-clr-a));\n  --blm-pnl-block-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-pnl-block-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-pnl-block-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-pnl-block-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-pnl-icon-clr: hsla(var(--blm-pnl-icon-clr-h), var(--blm-pnl-icon-clr-s), var(--blm-pnl-icon-clr-l), var(--blm-pnl-icon-clr-a));\n  --blm-pnl-icon-clr-h: var(--blm-txt-light-h);\n  --blm-pnl-icon-clr-s: var(--blm-txt-light-s);\n  --blm-pnl-icon-clr-l: var(--blm-txt-light-l);\n  --blm-pnl-icon-clr-a: var(--blm-txt-light-a);\n  --blm-tabs-bd-bottom-clr: hsla(var(--blm-tabs-bd-bottom-clr-h), var(--blm-tabs-bd-bottom-clr-s), var(--blm-tabs-bd-bottom-clr-l), var(--blm-tabs-bd-bottom-clr-a));\n  --blm-tabs-bd-bottom-clr-h: var(--blm-bd-h);\n  --blm-tabs-bd-bottom-clr-s: var(--blm-bd-s);\n  --blm-tabs-bd-bottom-clr-l: var(--blm-bd-l);\n  --blm-tabs-bd-bottom-clr-a: var(--blm-bd-a);\n  --blm-tabs-bd-bottom-style: solid;\n  --blm-tabs-bd-bottom-width: 1px;\n  --blm-tabs-link-clr: hsla(var(--blm-tabs-link-clr-h), var(--blm-tabs-link-clr-s), var(--blm-tabs-link-clr-l), var(--blm-tabs-link-clr-a));\n  --blm-tabs-link-clr-h: var(--blm-txt-h);\n  --blm-tabs-link-clr-s: var(--blm-txt-s);\n  --blm-tabs-link-clr-l: var(--blm-txt-l);\n  --blm-tabs-link-clr-a: var(--blm-txt-a);\n  --blm-tabs-link-p: 0.5em 1em;\n  --blm-tabs-link-hov-bd-bottom-clr: hsla(var(--blm-tabs-link-hov-bd-bottom-clr-h), var(--blm-tabs-link-hov-bd-bottom-clr-s), var(--blm-tabs-link-hov-bd-bottom-clr-l), var(--blm-tabs-link-hov-bd-bottom-clr-a));\n  --blm-tabs-link-hov-bd-bottom-clr-h: var(--blm-txt-strong-h);\n  --blm-tabs-link-hov-bd-bottom-clr-s: var(--blm-txt-strong-s);\n  --blm-tabs-link-hov-bd-bottom-clr-l: var(--blm-txt-strong-l);\n  --blm-tabs-link-hov-bd-bottom-clr-a: var(--blm-txt-strong-a);\n  --blm-tabs-link-hov-clr: hsla(var(--blm-tabs-link-hov-clr-h), var(--blm-tabs-link-hov-clr-s), var(--blm-tabs-link-hov-clr-l), var(--blm-tabs-link-hov-clr-a));\n  --blm-tabs-link-hov-clr-h: var(--blm-txt-strong-h);\n  --blm-tabs-link-hov-clr-s: var(--blm-txt-strong-s);\n  --blm-tabs-link-hov-clr-l: var(--blm-txt-strong-l);\n  --blm-tabs-link-hov-clr-a: var(--blm-txt-strong-a);\n  --blm-tabs-link-act-bd-bottom-clr: hsla(var(--blm-tabs-link-act-bd-bottom-clr-h), var(--blm-tabs-link-act-bd-bottom-clr-s), var(--blm-tabs-link-act-bd-bottom-clr-l), var(--blm-tabs-link-act-bd-bottom-clr-a));\n  --blm-tabs-link-act-bd-bottom-clr-h: var(--blm-link-h);\n  --blm-tabs-link-act-bd-bottom-clr-s: var(--blm-link-s);\n  --blm-tabs-link-act-bd-bottom-clr-l: var(--blm-link-l);\n  --blm-tabs-link-act-bd-bottom-clr-a: var(--blm-link-a);\n  --blm-tabs-link-act-clr: hsla(var(--blm-tabs-link-act-clr-h), var(--blm-tabs-link-act-clr-s), var(--blm-tabs-link-act-clr-l), var(--blm-tabs-link-act-clr-a));\n  --blm-tabs-link-act-clr-h: var(--blm-link-h);\n  --blm-tabs-link-act-clr-s: var(--blm-link-s);\n  --blm-tabs-link-act-clr-l: var(--blm-link-l);\n  --blm-tabs-link-act-clr-a: var(--blm-link-a);\n  --blm-tabs-boxed-link-radius: var(--blm-radius);\n  --blm-tabs-boxed-link-hov-bg-clr: hsla(var(--blm-tabs-boxed-link-hov-bg-clr-h), var(--blm-tabs-boxed-link-hov-bg-clr-s), var(--blm-tabs-boxed-link-hov-bg-clr-l), var(--blm-tabs-boxed-link-hov-bg-clr-a));\n  --blm-tabs-boxed-link-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-tabs-boxed-link-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-tabs-boxed-link-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-tabs-boxed-link-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr: hsla(var(--blm-tabs-boxed-link-hov-bd-bottom-clr-h), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-s), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-l), var(--blm-tabs-boxed-link-hov-bd-bottom-clr-a));\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-h: var(--blm-bd-h);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-s: var(--blm-bd-s);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-l: var(--blm-bd-l);\n  --blm-tabs-boxed-link-hov-bd-bottom-clr-a: var(--blm-bd-a);\n  --blm-tabs-boxed-link-act-bg-clr: hsla(var(--blm-tabs-boxed-link-act-bg-clr-h), var(--blm-tabs-boxed-link-act-bg-clr-s), var(--blm-tabs-boxed-link-act-bg-clr-l), var(--blm-tabs-boxed-link-act-bg-clr-a));\n  --blm-tabs-boxed-link-act-bg-clr-h: var(--blm-sch-main-h);\n  --blm-tabs-boxed-link-act-bg-clr-s: var(--blm-sch-main-s);\n  --blm-tabs-boxed-link-act-bg-clr-l: var(--blm-sch-main-l);\n  --blm-tabs-boxed-link-act-bg-clr-a: var(--blm-sch-main-a);\n  --blm-tabs-boxed-link-act-bd-clr: hsla(var(--blm-tabs-boxed-link-act-bd-clr-h), var(--blm-tabs-boxed-link-act-bd-clr-s), var(--blm-tabs-boxed-link-act-bd-clr-l), var(--blm-tabs-boxed-link-act-bd-clr-a));\n  --blm-tabs-boxed-link-act-bd-clr-h: var(--blm-bd-h);\n  --blm-tabs-boxed-link-act-bd-clr-s: var(--blm-bd-s);\n  --blm-tabs-boxed-link-act-bd-clr-l: var(--blm-bd-l);\n  --blm-tabs-boxed-link-act-bd-clr-a: var(--blm-bd-a);\n  --blm-tabs-boxed-link-act-bd-bottom-clr: hsla(var(--blm-tabs-boxed-link-act-bd-bottom-clr-h), var(--blm-tabs-boxed-link-act-bd-bottom-clr-s), var(--blm-tabs-boxed-link-act-bd-bottom-clr-l), var(--blm-tabs-boxed-link-act-bd-bottom-clr-a));\n  --blm-tabs-boxed-link-act-bd-bottom-clr-h: 0;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-s: 0%;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-l: 0%;\n  --blm-tabs-boxed-link-act-bd-bottom-clr-a: 0;\n  --blm-tabs-tgl-link-bd-clr: hsla(var(--blm-tabs-tgl-link-bd-clr-h), var(--blm-tabs-tgl-link-bd-clr-s), var(--blm-tabs-tgl-link-bd-clr-l), var(--blm-tabs-tgl-link-bd-clr-a));\n  --blm-tabs-tgl-link-bd-clr-h: var(--blm-bd-h);\n  --blm-tabs-tgl-link-bd-clr-s: var(--blm-bd-s);\n  --blm-tabs-tgl-link-bd-clr-l: var(--blm-bd-l);\n  --blm-tabs-tgl-link-bd-clr-a: var(--blm-bd-a);\n  --blm-tabs-tgl-link-bd-style: solid;\n  --blm-tabs-tgl-link-bd-width: 1px;\n  --blm-tabs-tgl-link-hov-bg-clr: hsla(var(--blm-tabs-tgl-link-hov-bg-clr-h), var(--blm-tabs-tgl-link-hov-bg-clr-s), var(--blm-tabs-tgl-link-hov-bg-clr-l), var(--blm-tabs-tgl-link-hov-bg-clr-a));\n  --blm-tabs-tgl-link-hov-bg-clr-h: var(--blm-bg-h);\n  --blm-tabs-tgl-link-hov-bg-clr-s: var(--blm-bg-s);\n  --blm-tabs-tgl-link-hov-bg-clr-l: var(--blm-bg-l);\n  --blm-tabs-tgl-link-hov-bg-clr-a: var(--blm-bg-a);\n  --blm-tabs-tgl-link-hov-bd-clr: hsla(var(--blm-tabs-tgl-link-hov-bd-clr-h), var(--blm-tabs-tgl-link-hov-bd-clr-s), var(--blm-tabs-tgl-link-hov-bd-clr-l), var(--blm-tabs-tgl-link-hov-bd-clr-a));\n  --blm-tabs-tgl-link-hov-bd-clr-h: var(--blm-bd-hov-h);\n  --blm-tabs-tgl-link-hov-bd-clr-s: var(--blm-bd-hov-s);\n  --blm-tabs-tgl-link-hov-bd-clr-l: var(--blm-bd-hov-l);\n  --blm-tabs-tgl-link-hov-bd-clr-a: var(--blm-bd-hov-a);\n  --blm-tabs-tgl-link-radius: var(--blm-radius);\n  --blm-tabs-tgl-link-act-bg-clr: hsla(var(--blm-tabs-tgl-link-act-bg-clr-h), var(--blm-tabs-tgl-link-act-bg-clr-s), var(--blm-tabs-tgl-link-act-bg-clr-l), var(--blm-tabs-tgl-link-act-bg-clr-a));\n  --blm-tabs-tgl-link-act-bg-clr-h: var(--blm-link-h);\n  --blm-tabs-tgl-link-act-bg-clr-s: var(--blm-link-s);\n  --blm-tabs-tgl-link-act-bg-clr-l: var(--blm-link-l);\n  --blm-tabs-tgl-link-act-bg-clr-a: var(--blm-link-a);\n  --blm-tabs-tgl-link-act-bd-clr: hsla(var(--blm-tabs-tgl-link-act-bd-clr-h), var(--blm-tabs-tgl-link-act-bd-clr-s), var(--blm-tabs-tgl-link-act-bd-clr-l), var(--blm-tabs-tgl-link-act-bd-clr-a));\n  --blm-tabs-tgl-link-act-bd-clr-h: var(--blm-link-h);\n  --blm-tabs-tgl-link-act-bd-clr-s: var(--blm-link-s);\n  --blm-tabs-tgl-link-act-bd-clr-l: var(--blm-link-l);\n  --blm-tabs-tgl-link-act-bd-clr-a: var(--blm-link-a);\n  --blm-tabs-tgl-link-act-clr: hsla(var(--blm-tabs-tgl-link-act-clr-h), var(--blm-tabs-tgl-link-act-clr-s), var(--blm-tabs-tgl-link-act-clr-l), var(--blm-tabs-tgl-link-act-clr-a));\n  --blm-tabs-tgl-link-act-clr-h: var(--blm-link-inv-h);\n  --blm-tabs-tgl-link-act-clr-s: var(--blm-link-inv-s);\n  --blm-tabs-tgl-link-act-clr-l: var(--blm-link-inv-l);\n  --blm-tabs-tgl-link-act-clr-a: var(--blm-link-inv-a);\n  --blm-column-gap: 0.75rem;\n  --blm-tile-spacing: 0.75rem;\n  --blm-weight-light: 300;\n  --blm-weight-medium: 500;\n  --blm-family-secondary: var(--blm-family-sans-serif);\n  --blm-hero-body-p-small: 1.5rem;\n  --blm-hero-body-p-medium: 9rem 1.5rem;\n  --blm-hero-body-p-lg: 18rem 1.5rem;\n  --blm-hero-body-p: 3rem 1.5rem;\n  --blm-sct-p: 3rem 1.5rem;\n  --blm-sct-p-medium: 9rem 1.5rem;\n  --blm-sct-p-lg: 18rem 1.5rem;\n  --blm-ft-bg-clr: hsla(var(--blm-ft-bg-clr-h), var(--blm-ft-bg-clr-s), var(--blm-ft-bg-clr-l), var(--blm-ft-bg-clr-a));\n  --blm-ft-bg-clr-h: var(--blm-sch-main-bis-h);\n  --blm-ft-bg-clr-s: var(--blm-sch-main-bis-s);\n  --blm-ft-bg-clr-l: var(--blm-sch-main-bis-l);\n  --blm-ft-bg-clr-a: var(--blm-sch-main-bis-a);\n  --blm-ft-p: 3rem 1.5rem 6rem;\n  --blm-ft-clr: inherit;\n}";
    n(css$1,{});

    var css$2 = "/* Animations */\n\n.is-height-animated {\n  transition: height 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-max-height-animated {\n  transition: max-height 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-max-width-animated {\n  transition: max-width 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-min-height-animated {\n  transition: min-height 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-min-width-animated {\n  transition: min-width 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-width-animated {\n  transition: width 0.5s ease-in;\n  overflow: hidden;\n}\n\n.is-fade {\n  opacity: 1;\n  -webkit-animation-name: fadeInOpacity;\n          animation-name: fadeInOpacity;\n  -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n  -webkit-animation-timing-function: ease-in;\n          animation-timing-function: ease-in;\n  -webkit-animation-duration: 0.75s;\n          animation-duration: 0.75s;\n}\n\n@-webkit-keyframes fadeInOpacity {\n  0% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n\n@keyframes fadeInOpacity {\n  0% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n\n.slide-enter-active {\n  transition: max-height 0.5s ease-in;\n  max-height: 0;\n  overflow: hidden;\n}\n\n.slide-leave-active {\n  transition: max-height 0.5s ease-in;\n  max-height: 1000px;\n  overflow: hidden;\n}\n\n.slide-enter-to, .slide-leave {\n  max-height: 1000px;\n}\n\n.slide-enter, .slide-leave-to {\n  max-height: 0;\n}\n\n.slide-right-enter-active {\n  -webkit-animation: slide-in-right 0.5s ease-out both;\n          animation: slide-in-right 0.5s ease-out both;\n}\n\n@-webkit-keyframes slide-in-right {\n  0% {\n    transform: translateX(-1000px);\n  }\n  100% {\n    transform: translateX(0);\n  }\n}\n\n@keyframes slide-in-right {\n  0% {\n    transform: translateX(-1000px);\n  }\n  100% {\n    transform: translateX(0);\n  }\n}\n\n.slide-left-enter-active,\n.slide-left-leave-active {\n  transition: transform 200ms ease-in;\n}\n\n.slide-left-leave-to {\n  transform: translate3d(-100%, 0, 0);\n}\n\n.slide-left-enter {\n  transform: translate3d(100%, 0, 0);\n}\n\n/* Controls */\n\n.is-disabled {\n  pointer-events: none;\n  opacity: 0.5;\n}\n\n/* v-sidebar */\n\n.v-sidebar .sidebar-content {\n  background-color: var(--blm-white-ter);\n  box-shadow: 5px 0px 13px 3px rgba(10, 10, 10, 0.1);\n  width: 260px;\n  z-index: 41;\n}\n\n.v-sidebar .sidebar-content.is-white {\n  background-color: white;\n}\n\n.v-sidebar .sidebar-content.is-black {\n  background-color: #0a0a0a;\n}\n\n.v-sidebar .sidebar-content.is-light {\n  background-color: var(--blm-white-ter);\n}\n\n.v-sidebar .sidebar-content.is-dark {\n  background-color: var(--blm-grey-darker);\n}\n\n.v-sidebar .sidebar-content.is-primary {\n  background-color: var(--blm-turquoise);\n}\n\n.v-sidebar .sidebar-content.is-link {\n  background-color: var(--blm-blue);\n}\n\n.v-sidebar .sidebar-content.is-info {\n  background-color: var(--blm-cyan);\n}\n\n.v-sidebar .sidebar-content.is-success {\n  background-color: var(--blm-green);\n}\n\n.v-sidebar .sidebar-content.is-warning {\n  background-color: var(--blm-yellow);\n}\n\n.v-sidebar .sidebar-content.is-danger {\n  background-color: var(--blm-red);\n}\n\n.v-sidebar .sidebar-content.is-fixed {\n  position: fixed;\n  left: 0;\n  top: 0;\n}\n\n.v-sidebar .sidebar-content.is-fixed.is-right {\n  left: auto;\n  right: 0;\n}\n\n.v-sidebar .sidebar-content.is-absolute {\n  position: absolute;\n  left: 0;\n  top: 0;\n}\n\n.v-sidebar .sidebar-content.is-absolute.is-right {\n  left: auto;\n  right: 0;\n}\n\n.v-sidebar .sidebar-content.is-mini {\n  width: 80px;\n}\n\n.v-sidebar .sidebar-content.is-mini.is-mini-expand:hover {\n  transition: width 0.5s ease-out;\n}\n\n.v-sidebar .sidebar-content.is-mini.is-mini-expand:hover:not(.is-fullwidth) {\n  width: 260px;\n}\n\n.v-sidebar .sidebar-content.is-mini.is-mini-expand:hover:not(.is-fullwidth).is-mini-expand-fixed {\n  position: fixed;\n}\n\n.v-sidebar .sidebar-content.is-mini:not(.is-mini-expand) .menu-list li a span:nth-child(2), .v-sidebar .sidebar-content.is-mini.is-mini-expand:not(:hover) .menu-list li a span:nth-child(2) {\n  display: none;\n}\n\n.v-sidebar .sidebar-content.is-mini:not(.is-mini-expand) .menu-list li ul, .v-sidebar .sidebar-content.is-mini.is-mini-expand:not(:hover) .menu-list li ul {\n  padding-left: 0;\n}\n\n.v-sidebar .sidebar-content.is-mini:not(.is-mini-expand) .menu-list li ul li a, .v-sidebar .sidebar-content.is-mini.is-mini-expand:not(:hover) .menu-list li ul li a {\n  display: inline-block;\n}\n\n.v-sidebar .sidebar-content.is-mini:not(.is-mini-expand) .menu-label:not(:last-child), .v-sidebar .sidebar-content.is-mini.is-mini-expand:not(:hover) .menu-label:not(:last-child) {\n  margin-bottom: 0;\n}\n\n.v-sidebar .sidebar-content.is-static {\n  position: static;\n}\n\n.v-sidebar .sidebar-content.is-absolute, .v-sidebar .sidebar-content.is-static {\n  transition: width 0.5s ease-out;\n}\n\n.v-sidebar .sidebar-content.is-fullwidth {\n  width: 100%;\n  max-width: 100%;\n}\n\n.v-sidebar .sidebar-content.is-fullheight {\n  height: 100%;\n  max-height: 100%;\n  overflow: hidden;\n  overflow-y: auto;\n  display: flex;\n  flex-direction: column;\n  align-content: stretch;\n}\n\n@media screen and (max-width: 768px) {\n  .v-sidebar .sidebar-content.is-mini-mobile {\n    width: 80px;\n  }\n  .v-sidebar .sidebar-content.is-mini-mobile.is-mini-expand:hover:not(.is-fullwidth-mobile) {\n    width: 260px;\n  }\n  .v-sidebar .sidebar-content.is-mini-mobile.is-mini-expand:hover:not(.is-fullwidth-mobile).is-mini-expand-fixed {\n    position: fixed;\n  }\n  .v-sidebar .sidebar-content.is-hidden-mobile {\n    width: 0;\n    height: 0;\n    overflow: hidden;\n  }\n  .v-sidebar .sidebar-content.is-fullwidth-mobile {\n    width: 100%;\n    max-width: 100%;\n  }\n}\n\n.v-sidebar .sidebar-background {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  background: var(--blm-modal-bg-bg-clr);\n  position: fixed;\n  z-index: 40;\n}\n\n/* v-tooltip */\n\n.v-tooltip {\n  position: relative;\n  display: inline-flex;\n}\n\n.v-tooltip.is-top:before, .v-tooltip.is-top:after {\n  top: auto;\n  right: auto;\n  bottom: calc(100% + 7px);\n  left: 50%;\n  transform: translateX(-50%);\n}\n\n.v-tooltip.is-top.is-white:before {\n  border-top: 5px solid white;\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-black:before {\n  border-top: 5px solid #0a0a0a;\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-light:before {\n  border-top: 5px solid var(--blm-white-ter);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-dark:before {\n  border-top: 5px solid var(--blm-grey-darker);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-primary:before {\n  border-top: 5px solid var(--blm-turquoise);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-link:before {\n  border-top: 5px solid var(--blm-blue);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-info:before {\n  border-top: 5px solid var(--blm-cyan);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-success:before {\n  border-top: 5px solid var(--blm-green);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-warning:before {\n  border-top: 5px solid var(--blm-yellow);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-danger:before {\n  border-top: 5px solid var(--blm-red);\n  border-right: 5px solid transparent;\n  border-left: 5px solid transparent;\n  bottom: calc(100% + 2px);\n}\n\n.v-tooltip.is-top.is-multiline.is-small:after {\n  width: 180px;\n}\n\n.v-tooltip.is-top.is-multiline.is-medium:after {\n  width: 240px;\n}\n\n.v-tooltip.is-top.is-multiline.is-large:after {\n  width: 300px;\n}\n\n.v-tooltip.is-right:before, .v-tooltip.is-right:after {\n  top: 50%;\n  right: auto;\n  bottom: auto;\n  left: calc(100% + 7px);\n  transform: translateY(-50%);\n}\n\n.v-tooltip.is-right.is-white:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid white;\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-black:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid #0a0a0a;\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-light:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-white-ter);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-dark:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-grey-darker);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-primary:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-turquoise);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-link:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-blue);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-info:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-cyan);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-success:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-green);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-warning:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-yellow);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-danger:before {\n  border-top: 5px solid transparent;\n  border-right: 5px solid var(--blm-red);\n  border-bottom: 5px solid transparent;\n  left: calc(100% + 2px);\n}\n\n.v-tooltip.is-right.is-multiline.is-small:after {\n  width: 180px;\n}\n\n.v-tooltip.is-right.is-multiline.is-medium:after {\n  width: 240px;\n}\n\n.v-tooltip.is-right.is-multiline.is-large:after {\n  width: 300px;\n}\n\n.v-tooltip.is-bottom:before, .v-tooltip.is-bottom:after {\n  top: calc(100% + 7px);\n  right: auto;\n  bottom: auto;\n  left: 50%;\n  transform: translateX(-50%);\n}\n\n.v-tooltip.is-bottom.is-white:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid white;\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-black:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid #0a0a0a;\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-light:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-white-ter);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-dark:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-grey-darker);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-primary:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-turquoise);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-link:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-blue);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-info:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-cyan);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-success:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-green);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-warning:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-yellow);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-danger:before {\n  border-right: 5px solid transparent;\n  border-bottom: 5px solid var(--blm-red);\n  border-left: 5px solid transparent;\n  top: calc(100% + 2px);\n}\n\n.v-tooltip.is-bottom.is-multiline.is-small:after {\n  width: 180px;\n}\n\n.v-tooltip.is-bottom.is-multiline.is-medium:after {\n  width: 240px;\n}\n\n.v-tooltip.is-bottom.is-multiline.is-large:after {\n  width: 300px;\n}\n\n.v-tooltip.is-left:before, .v-tooltip.is-left:after {\n  top: 50%;\n  right: calc(100% + 7px);\n  bottom: auto;\n  left: auto;\n  transform: translateY(-50%);\n}\n\n.v-tooltip.is-left.is-white:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid white;\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-black:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid #0a0a0a;\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-light:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-white-ter);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-dark:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-grey-darker);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-primary:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-turquoise);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-link:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-blue);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-info:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-cyan);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-success:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-green);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-warning:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-yellow);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-danger:before {\n  border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent;\n  border-left: 5px solid var(--blm-red);\n  right: calc(100% + 2px);\n}\n\n.v-tooltip.is-left.is-multiline.is-small:after {\n  width: 180px;\n}\n\n.v-tooltip.is-left.is-multiline.is-medium:after {\n  width: 240px;\n}\n\n.v-tooltip.is-left.is-multiline.is-large:after {\n  width: 300px;\n}\n\n.v-tooltip:before, .v-tooltip:after {\n  position: absolute;\n  content: \"\";\n  opacity: 0;\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.v-tooltip:before {\n  z-index: 39;\n}\n\n.v-tooltip:after {\n  content: attr(data-label);\n  width: auto;\n  padding: 0.35rem 0.75rem;\n  border-radius: 6px;\n  font-size: 0.85rem;\n  font-weight: 400;\n  box-shadow: 0px 1px 2px 1px rgba(0, 1, 0, 0.2);\n  z-index: 38;\n  white-space: nowrap;\n}\n\n.v-tooltip:not([data-label=\"\"]):hover:before, .v-tooltip:not([data-label=\"\"]):hover:after {\n  transition-delay: inherit;\n  opacity: 1;\n  visibility: visible;\n}\n\n.v-tooltip.is-white:after {\n  background: white;\n  color: #0a0a0a;\n}\n\n.v-tooltip.is-black:after {\n  background: #0a0a0a;\n  color: white;\n}\n\n.v-tooltip.is-light:after {\n  background: var(--blm-white-ter);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.v-tooltip.is-dark:after {\n  background: var(--blm-grey-darker);\n  color: #fff;\n}\n\n.v-tooltip.is-primary:after {\n  background: var(--blm-turquoise);\n  color: #fff;\n}\n\n.v-tooltip.is-link:after {\n  background: var(--blm-blue);\n  color: #fff;\n}\n\n.v-tooltip.is-info:after {\n  background: var(--blm-cyan);\n  color: #fff;\n}\n\n.v-tooltip.is-success:after {\n  background: var(--blm-green);\n  color: #fff;\n}\n\n.v-tooltip.is-warning:after {\n  background: var(--blm-yellow);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.v-tooltip.is-danger:after {\n  background: var(--blm-red);\n  color: #fff;\n}\n\n.v-tooltip:not([data-label=\"\"]).is-always:before, .v-tooltip:not([data-label=\"\"]).is-always:after {\n  opacity: 1;\n  visibility: visible;\n}\n\n.v-tooltip.is-multiline:after {\n  display: flex-block;\n  text-align: center;\n  white-space: normal;\n}\n\n.v-tooltip.is-dashed {\n  border-bottom: 1px dashed #b5b5b5;\n  cursor: default;\n}\n\n.v-tooltip.is-square:after {\n  border-radius: 0;\n}\n\n.v-tooltip.is-animated:before, .v-tooltip.is-animated:after {\n  transition: opacity 86ms ease-out, visibility 86ms ease-out;\n}\n\n/* v-switch */\n\n.switch {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.switch {\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n  position: relative;\n  margin-right: 0.5em;\n}\n\n.switch + .switch:last-child {\n  margin-right: 0;\n}\n\n.switch input[type=checkbox] {\n  position: absolute;\n  left: 0;\n  opacity: 0;\n  outline: none;\n  z-index: -1;\n}\n\n.switch input[type=checkbox] + .check {\n  display: flex;\n  align-items: center;\n  flex-shrink: 0;\n  width: 2.75em;\n  height: 1.575em;\n  padding: 0.2em;\n  background: #b5b5b5;\n  border-radius: 4px;\n  transition: background 0.5s ease-out, box-shadow 0.5s ease-out;\n}\n\n.switch input[type=checkbox] + .check.is-white-passive, .switch input[type=checkbox] + .check:hover {\n  background: white;\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-black-passive, .switch input[type=checkbox] + .check:hover {\n  background: #0a0a0a;\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-light-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-white-ter);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-dark-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-grey-darker);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-primary-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-turquoise);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-link-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-blue);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-info-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-cyan);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-success-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-green);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-warning-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-yellow);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check.is-danger-passive, .switch input[type=checkbox] + .check:hover {\n  background: var(--blm-red);\n}\n\n.switch input[type=checkbox] + .check.input[type=checkbox] + .switch input[type=checkbox] + .check.check {\n  background: 'pink';\n}\n\n.switch input[type=checkbox] + .check:before {\n  content: \"\";\n  display: block;\n  border-radius: 4px;\n  width: 1.175em;\n  height: 1.175em;\n  background: var(--blm-white-ter);\n  box-shadow: 0 3px 1px 0 rgba(0, 0, 0, 0.05), 0 2px 2px 0 rgba(0, 0, 0, 0.1), 0 3px 3px 0 rgba(0, 0, 0, 0.05);\n  transition: transform 0.5s ease-out;\n  will-change: transform;\n  transform-origin: left;\n}\n\n.switch input[type=checkbox] + .check.is-elastic:before {\n  transform: scaleX(1.5);\n  border-radius: 4px;\n}\n\n.switch input[type=checkbox]:checked + .check {\n  background: var(--blm-turquoise);\n}\n\n.switch input[type=checkbox]:checked + .check.is-white {\n  background: white;\n}\n\n.switch input[type=checkbox]:checked + .check.is-black {\n  background: #0a0a0a;\n}\n\n.switch input[type=checkbox]:checked + .check.is-light {\n  background: var(--blm-white-ter);\n}\n\n.switch input[type=checkbox]:checked + .check.is-dark {\n  background: var(--blm-grey-darker);\n}\n\n.switch input[type=checkbox]:checked + .check.is-primary {\n  background: var(--blm-turquoise);\n}\n\n.switch input[type=checkbox]:checked + .check.is-link {\n  background: var(--blm-blue);\n}\n\n.switch input[type=checkbox]:checked + .check.is-info {\n  background: var(--blm-cyan);\n}\n\n.switch input[type=checkbox]:checked + .check.is-success {\n  background: var(--blm-green);\n}\n\n.switch input[type=checkbox]:checked + .check.is-warning {\n  background: var(--blm-yellow);\n}\n\n.switch input[type=checkbox]:checked + .check.is-danger {\n  background: var(--blm-red);\n}\n\n.switch input[type=checkbox]:checked + .check:before {\n  transform: translate3d(100%, 0, 0);\n}\n\n.switch input[type=checkbox]:checked + .check.is-elastic:before {\n  transform: translate3d(50%, 0, 0) scaleX(1.5);\n}\n\n.switch input[type=checkbox]:focus, .switch input[type=checkbox]:active {\n  outline: none;\n}\n\n.switch input[type=checkbox]:focus + .check, .switch input[type=checkbox]:active + .check {\n  box-shadow: 0 0 0.5em rgba(122, 122, 122, 0.6);\n}\n\n.switch input[type=checkbox]:focus + .check.is-white-passive, .switch input[type=checkbox]:active + .check.is-white-passive {\n  box-shadow: 0 0 0.4em white, 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-black-passive, .switch input[type=checkbox]:active + .check.is-black-passive {\n  box-shadow: 0 0 0.4em #0a0a0a, 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-light-passive, .switch input[type=checkbox]:active + .check.is-light-passive {\n  box-shadow: 0 0 0.4em var(--blm-white-ter), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-dark-passive, .switch input[type=checkbox]:active + .check.is-dark-passive {\n  box-shadow: 0 0 0.4em var(--blm-grey-darker), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-primary-passive, .switch input[type=checkbox]:active + .check.is-primary-passive {\n  box-shadow: 0 0 0.4em var(--blm-turquoise), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-link-passive, .switch input[type=checkbox]:active + .check.is-link-passive {\n  box-shadow: 0 0 0.4em var(--blm-blue), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-info-passive, .switch input[type=checkbox]:active + .check.is-info-passive {\n  box-shadow: 0 0 0.4em var(--blm-cyan), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-success-passive, .switch input[type=checkbox]:active + .check.is-success-passive {\n  box-shadow: 0 0 0.4em var(--blm-green), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-warning-passive, .switch input[type=checkbox]:active + .check.is-warning-passive {\n  box-shadow: 0 0 0.4em var(--blm-yellow), 0.8;\n}\n\n.switch input[type=checkbox]:focus + .check.is-danger-passive, .switch input[type=checkbox]:active + .check.is-danger-passive {\n  box-shadow: 0 0 0.4em var(--blm-red), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check, .switch input[type=checkbox]:active:checked + .check {\n  box-shadow: 0 0 0.4em var(--blm-turquoise);\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-white, .switch input[type=checkbox]:active:checked + .check.is-white {\n  box-shadow: 0 0 0.4em white, 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-black, .switch input[type=checkbox]:active:checked + .check.is-black {\n  box-shadow: 0 0 0.4em #0a0a0a, 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-light, .switch input[type=checkbox]:active:checked + .check.is-light {\n  box-shadow: 0 0 0.4em var(--blm-white-ter), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-dark, .switch input[type=checkbox]:active:checked + .check.is-dark {\n  box-shadow: 0 0 0.4em var(--blm-grey-darker), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-primary, .switch input[type=checkbox]:active:checked + .check.is-primary {\n  box-shadow: 0 0 0.4em var(--blm-turquoise), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-link, .switch input[type=checkbox]:active:checked + .check.is-link {\n  box-shadow: 0 0 0.4em var(--blm-blue), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-info, .switch input[type=checkbox]:active:checked + .check.is-info {\n  box-shadow: 0 0 0.4em var(--blm-cyan), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-success, .switch input[type=checkbox]:active:checked + .check.is-success {\n  box-shadow: 0 0 0.4em var(--blm-green), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-warning, .switch input[type=checkbox]:active:checked + .check.is-warning {\n  box-shadow: 0 0 0.4em var(--blm-yellow), 0.8;\n}\n\n.switch input[type=checkbox]:focus:checked + .check.is-danger, .switch input[type=checkbox]:active:checked + .check.is-danger {\n  box-shadow: 0 0 0.4em var(--blm-red), 0.8;\n}\n\n.switch .control-label {\n  padding-left: 0.5em;\n}\n\n.switch:hover input[type=checkbox] + .check {\n  background: rgba(181, 181, 181, 0.9);\n}\n\n.switch:hover input[type=checkbox] + .check.is-white-passive {\n  background: white;\n}\n\n.switch:hover input[type=checkbox] + .check.is-black-passive {\n  background: #0a0a0a;\n}\n\n.switch:hover input[type=checkbox] + .check.is-light-passive {\n  background: var(--blm-white-ter);\n}\n\n.switch:hover input[type=checkbox] + .check.is-dark-passive {\n  background: var(--blm-grey-darker);\n}\n\n.switch:hover input[type=checkbox] + .check.is-primary-passive {\n  background: var(--blm-turquoise);\n}\n\n.switch:hover input[type=checkbox] + .check.is-link-passive {\n  background: var(--blm-blue);\n}\n\n.switch:hover input[type=checkbox] + .check.is-info-passive {\n  background: var(--blm-cyan);\n}\n\n.switch:hover input[type=checkbox] + .check.is-success-passive {\n  background: var(--blm-green);\n}\n\n.switch:hover input[type=checkbox] + .check.is-warning-passive {\n  background: var(--blm-yellow);\n}\n\n.switch:hover input[type=checkbox] + .check.is-danger-passive {\n  background: var(--blm-red);\n}\n\n.switch:hover input[type=checkbox]:checked + .check {\n  background: var(--blm-turquoise);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-white {\n  background: white;\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-black {\n  background: #0a0a0a;\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-light {\n  background: var(--blm-white-ter);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-dark {\n  background: var(--blm-grey-darker);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-primary {\n  background: var(--blm-turquoise);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-link {\n  background: var(--blm-blue);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-info {\n  background: var(--blm-cyan);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-success {\n  background: var(--blm-green);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-warning {\n  background: var(--blm-yellow);\n}\n\n.switch:hover input[type=checkbox]:checked + .check.is-danger {\n  background: var(--blm-red);\n}\n\n.switch.is-rounded input[type=checkbox] + .check {\n  border-radius: 290486px;\n}\n\n.switch.is-rounded input[type=checkbox] + .check:before {\n  border-radius: 290486px;\n}\n\n.switch.is-rounded input[type=checkbox].is-elastic:before {\n  transform: scaleX(1.5);\n  border-radius: 290486px;\n}\n\n.switch.is-outlined input[type=checkbox] + .check {\n  background: transparent;\n  border: 0.1rem solid #b5b5b5;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-white-passive {\n  border: 0.1rem solid white;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-white-passive:before {\n  background: white;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-white-passive:hover {\n  border-color: white;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-black-passive {\n  border: 0.1rem solid #0a0a0a;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-black-passive:before {\n  background: #0a0a0a;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-black-passive:hover {\n  border-color: #0a0a0a;\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-light-passive {\n  border: 0.1rem solid var(--blm-white-ter);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-light-passive:before {\n  background: var(--blm-white-ter);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-light-passive:hover {\n  border-color: var(--blm-white-ter);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-dark-passive {\n  border: 0.1rem solid var(--blm-grey-darker);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-dark-passive:before {\n  background: var(--blm-grey-darker);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-dark-passive:hover {\n  border-color: var(--blm-grey-darker);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-primary-passive {\n  border: 0.1rem solid var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-primary-passive:before {\n  background: var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-primary-passive:hover {\n  border-color: var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-link-passive {\n  border: 0.1rem solid var(--blm-blue);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-link-passive:before {\n  background: var(--blm-blue);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-link-passive:hover {\n  border-color: var(--blm-blue);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-info-passive {\n  border: 0.1rem solid var(--blm-cyan);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-info-passive:before {\n  background: var(--blm-cyan);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-info-passive:hover {\n  border-color: var(--blm-cyan);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-success-passive {\n  border: 0.1rem solid var(--blm-green);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-success-passive:before {\n  background: var(--blm-green);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-success-passive:hover {\n  border-color: var(--blm-green);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-warning-passive {\n  border: 0.1rem solid var(--blm-yellow);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-warning-passive:before {\n  background: var(--blm-yellow);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-warning-passive:hover {\n  border-color: var(--blm-yellow);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-danger-passive {\n  border: 0.1rem solid var(--blm-red);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-danger-passive:before {\n  background: var(--blm-red);\n}\n\n.switch.is-outlined input[type=checkbox] + .check.is-danger-passive:hover {\n  border-color: var(--blm-red);\n}\n\n.switch.is-outlined input[type=checkbox] + .check:before {\n  background: #b5b5b5;\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check {\n  border-color: var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-white {\n  background: transparent;\n  border-color: white;\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-white:before {\n  background: white;\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-black {\n  background: transparent;\n  border-color: #0a0a0a;\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-black:before {\n  background: #0a0a0a;\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-light {\n  background: transparent;\n  border-color: var(--blm-white-ter);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-light:before {\n  background: var(--blm-white-ter);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-dark {\n  background: transparent;\n  border-color: var(--blm-grey-darker);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-dark:before {\n  background: var(--blm-grey-darker);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-primary {\n  background: transparent;\n  border-color: var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-primary:before {\n  background: var(--blm-turquoise);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-link {\n  background: transparent;\n  border-color: var(--blm-blue);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-link:before {\n  background: var(--blm-blue);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-info {\n  background: transparent;\n  border-color: var(--blm-cyan);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-info:before {\n  background: var(--blm-cyan);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-success {\n  background: transparent;\n  border-color: var(--blm-green);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-success:before {\n  background: var(--blm-green);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-warning {\n  background: transparent;\n  border-color: var(--blm-yellow);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-warning:before {\n  background: var(--blm-yellow);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-danger {\n  background: transparent;\n  border-color: var(--blm-red);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check.is-danger:before {\n  background: var(--blm-red);\n}\n\n.switch.is-outlined input[type=checkbox]:checked + .check:before {\n  background: var(--blm-turquoise);\n}\n\n.switch.is-outlined:hover input[type=checkbox] + .check {\n  background: transparent;\n  border-color: rgba(181, 181, 181, 0.9);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check {\n  background: transparent;\n  border-color: var(--blm-turquoise);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-white {\n  border-color: white;\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-black {\n  border-color: #0a0a0a;\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-light {\n  border-color: var(--blm-white-ter);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-dark {\n  border-color: var(--blm-grey-darker);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-primary {\n  border-color: var(--blm-turquoise);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-link {\n  border-color: var(--blm-blue);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-info {\n  border-color: var(--blm-cyan);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-success {\n  border-color: var(--blm-green);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-warning {\n  border-color: var(--blm-yellow);\n}\n\n.switch.is-outlined:hover input[type=checkbox]:checked + .check.is-danger {\n  border-color: var(--blm-red);\n}\n\n.switch.is-small {\n  border-radius: 2px;\n  font-size: var(--blm-s-7);\n}\n\n.switch.is-medium {\n  font-size: var(--blm-s-5);\n}\n\n.switch.is-large {\n  font-size: var(--blm-s-4);\n}\n\n.switch[disabled] {\n  opacity: 0.5;\n  cursor: not-allowed;\n  color: #7a7a7a;\n}\n\n/* v-accordion */\n\n.accordion-menu {\n  display: flex;\n  flex-direction: row;\n}\n\n.accordion-menu:hover .accordion-active {\n  flex: 1;\n}\n\n.accordion-menu:hover .accordion-active .accordion-trigger .accordion-content {\n  display: none;\n}\n\n.accordion-menu:hover .accordion-active:hover {\n  flex: 4;\n}\n\n.accordion-menu:hover .accordion-active:hover .accordion-trigger .accordion-content {\n  display: inline-block;\n}\n\n.accordion-type-hover {\n  flex: 1;\n  height: 100%;\n  transition: flex 0.8s ease;\n  width: 106px;\n  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);\n}\n\n.accordion-type-hover .accordion-trigger {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  line-height: normal;\n  position: relative;\n  padding: 0px 8px;\n  min-width: 32px;\n  height: 100%;\n  width: 100%;\n  border-radius: 0;\n}\n\n.accordion-default:hover {\n  background-color: #2F3133;\n  flex: 4;\n}\n\n.accordion-default:hover .accordion-active {\n  flex: 1;\n}\n\n.accordion-default:hover .accordion-active .accordion-content {\n  display: none;\n}\n\n.accordion-default:hover .accordion-content {\n  display: inline-block;\n}\n\n.accordion-active {\n  background-color: #868a88;\n  flex: 4;\n}\n\n.accordion-active .accordion-content {\n  display: inline-block;\n}\n\n.accordion-content {\n  padding: 0px 8px;\n  display: none;\n}\n\n.accordion-type-click {\n  width: 100%;\n}\n\n.accordion-header {\n  display: block;\n}\n\n.trigger-right {\n  float: right;\n}\n\n.trigger-left {\n  float: left;\n}\n\n.header-is-trigger {\n  cursor: pointer;\n}\n\n/* Messages */\n\n.message-wrapper {\n  padding: 10px;\n  margin: 0;\n  display: flex;\n  flex-direction: column;\n}\n\n.msg-left {\n  align-self: flex-start;\n}\n\n.msg-right {\n  align-self: flex-end;\n}\n\n.msg-time {\n  margin: 0px 10px 0px 10px;\n}\n\n\n/* Table */\n.data-grid {\n  background-color: white;\n}\n\n.tableHeader {\n  display: block;\n}\n\n.sticky-table {\n  height: 300px;\n  overflow-y: auto !important;\n}\n\n.sticky-row {\n  position: -webkit-sticky;\n  position: sticky;\n  top: 0;\n  background-color: var(--blm-prim);\n  color: white !important;\n}\n\n.sticky-column {\n  position: -webkit-sticky;\n  position: sticky;\n  left: 0;\n  background-color: var(--blm-prim);\n  color: white;\n}\n\n.pagination-container {\n  display: flex;\n  justify-content: flex-end;\n}\n\n/* Progress */\n.progress-wrapper {\n  position: relative;\n}\n\n.progress-value {\n  position: absolute;\n  top: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  font-size: .6rem;\n}\n\n.progress-value.more-than-half {\n  color: white;\n}\n";
    n(css$2,{});

    createApp(script$2).mount('#app');

}());
