(function (global, definition) {

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = definition(require('./fix'), require('./setImmediate'));
  } else if (typeof fix === 'object' && fix && typeof fix.define === 'function') {
    fix.define(['lib/fix', 'lib/setImmediate'], definition);
  } else if (typeof define === 'function' && define.amd) {
    define(['lib/fix', 'lib/setImmediate'], definition);
  } else {
    global.Promise = definition(global.fix, global.setImmediate);
  }

}(function () {
  return this;
}(), function (fix) {
  var setImmediate = fix.global('setImmediate'),
    Promise = fix.global('Promise');

  if (fix.isFunction(Promise)) {
    donePolyfill(Promise);
    return Promise;
  }

  function donePolyfill(BasePromise) {
    if (!BasePromise.prototype.done) {
      BasePromise.prototype.done = function (cb, eb) {
        var promise = (fix.isFunction(cb) || fix.isFunction(eb)) ?
          this.then(cb, eb) : this;
        promise.then(null, function (err) {
          setImmediate(function () {
            throw err;
          });
        });
      };
    }
  }

  Promise = function Promise(fn) {
    if (!fix.isObject(this)) {
      throw new TypeError('Promises must be constructed via new');
    }
    if (!fix.isObject(fn)) {
      throw new TypeError('not a function');
    }
    this._state = null;
    this._value = null;
    this._deferreds = [];

    doResolve(fn, fix.bind(resolve, this), fix.bind(reject, this));
  };

  function handle(deferred) {
    var me = this;
    if (this._state === null) {
      this._deferreds.push(deferred);
      return;
    }
    setImmediate(function () {
      var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (me._state ? deferred.resolve : deferred.reject)(me._value);
        return;
      }
      var ret;
      try {
        ret = cb(me._value);
      } catch (e) {
        deferred.reject(e);
        return;
      }
      deferred.resolve(ret);
    });
  }

  function resolve(newValue) {
    try {
      if (newValue === this) {
        throw new TypeError('A promise cannot be resolved with itself.');
      }
      if (newValue && (fix.isObject(newValue) || fix.isFunction(newValue))) {
        var then = newValue.then;
        if (fix.isFunction(then)) {
          doResolve(fix.bind(then, newValue), fix.bind(resolve, this), fix.bind(reject, this));
          return;
        }
      }
      this._state = true;
      this._value = newValue;
      finale.call(this);
    } catch (e) {
      reject.call(this, e);
    }
  }

  function reject(newValue) {
    this._state = false;
    this._value = newValue;
    finale.call(this);
  }

  function finale() {
    var i = 0,
      len = this._deferreds.length;

    for (; i < len; i += 1) {
      handle.call(this, this._deferreds[i]);
    }
    this._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, resolve, reject) {
    this.onFulfilled = fix.isFunction(onFulfilled) ? onFulfilled : null;
    this.onRejected = fix.isFunction(onRejected) ? onRejected : null;
    this.resolve = resolve;
    this.reject = reject;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, onFulfilled, onRejected) {
    var done = false;
    try {
      fn(function (value) {
        if (done) {
          return;
        }
        done = true;
        onFulfilled(value);
      }, function (reason) {
        if (done) {
          return;
        }
        done = true;
        onRejected(reason);
      });
    } catch (ex) {
      if (done) {
        return;
      }
      done = true;
      onRejected(ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var me = this;
    return new Promise(function (resolve, reject) {
      handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
    });
  };

  Promise.all = function () {
    var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] :
      arguments);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) {
        return resolve([]);
      }

      var remaining = args.length,
        i = 0,
        len = args.length;

      function res(i, val) {
        try {
          if (val && (fix.isObject(val) || fix.isFunction(val))) {
            var then = val.then;
            if (fix.isFunction(then)) {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }
      for (; i < len; i += 1) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (fix.isObject(value) && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  donePolyfill(Promise);
  return Promise;
}));
