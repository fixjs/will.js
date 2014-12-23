(function (global, definition) {

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = definition();
  } else if (typeof fix === 'object' && fix && typeof fix.define === 'function') {
    fix.define([], definition);
  } else if (typeof define === 'function' && define.amd) {
    define([], definition);
  } else {
    global.fix = definition();
  }

}(function () {
  return this;
}(), function () {

  var fnCall = Function.call,
    objProto = Object.prototype,
    arrayProto = Array.prototype,
    funcProto = Function.prototype,
    g;

  function fix() {}

  //A faster alternative for Function.bind case but from the other way around,
  //instead of binding it to a specific object,
  //this allows to pass the this context as the first argument
  // http://jsperf.com/uncurrythis
  var uncurryThis = function (f) {
    return function () {
      return fnCall.apply(f, arguments);
    };
  };

  fix._toString = uncurryThis(objProto.hasOwnProperty);

  fix.hasOwn = uncurryThis(objProto.hasOwnProperty);

  fix.isObject = function (o) {
    return o === Object(o);
  };

  fix.isArray = Array.isArray || function (value) {
    return value && (typeof value == 'object') && (typeof value.length == 'number') &&
      fix._toString(value) == '[object Array]' || false;
  };

  fix.isFunction = function (value) {
    return typeof value == 'function';
  };

  fix.isString = function (value) {
    return typeof value == 'string' ||
      value && typeof value == 'object' && fix._toString(value) == '[object String]' || false;
  };

  fix.isUndefined = function (value) {
    return typeof value == 'undefined';
  };

  fix.bind = function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  };

  fix.slice = uncurryThis(arrayProto.slice);

  fix.indexOf = fix.isFunction(arrayProto.indexOf) ? uncurryThis(arrayProto.indexOf) :
    function (array, value, fromIndex) {
      var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    };

  fix.create = Object.create || function (prototype) {
    function Type() {}
    Type.prototype = prototype;
    return new Type();
  };

  fix.global = function (key, value) {
    if (!fix.isObject(g)) {
      if (typeof window === 'object' && fix._toString(window) === '[object global]') {
        g = window;
      } else if (typeof global === 'object' && fix._toString(global) === '[object global]') {
        g = global;
      } else {
        console.warn('Unknown platform!!');
        g = {};
      }
    }

    //fix.global()
    if (fix.isUndefined(key) & fix.isUndefined(value)) {
      return g;
    }

    //fix.global('Promise')
    if (fix.isString(key) && fix.isUndefined(value)) {
      return g[key];
    }

    //fix.global('Promise', function(){});
    if (fix.isString(key) && !fix.isUndefined(value)) {
      g[key] = value;
      return true;
    }
  };

  return fix;

}));
