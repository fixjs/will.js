/*! will.js v0.0.1 - MIT license */
(function (global, definition) {

  if (typeof exports === 'object') {
    module.exports = definition(require('./lib/fix'), require('./lib/promise'));
  } else if (typeof fix === 'object' && fix && typeof fix.define === 'function') {
    fix.define(['lib/fix', 'lib/promise'], definition);
  } else if (typeof define === 'function' && define.amd) {
    define(['lib/fix', 'lib/promise'], definition);
  } else {
    global.will = definition(global.Promise);
  }

}(function () {
  return this;
}(), function (fix, Promise) {

  function will(obj) {
    if (obj instanceof Promise) {
      return obj;
    }

    if (fix.isFunction(obj)) {
      return new Promise(obj);
    }
  }


  will.all = all;

  function all(promises) {
    var accumulator = [];
    var ready = Promise.resolve(null);

    promises.forEach(function (promise) {
      ready = ready.then(function () {
        return promise;
      }).then(function (value) {
        accumulator.push(value);
      });
    });

    return ready.then(function () {
      return accumulator;
    });
  }

  function qrace(answerPs) {
    return promise(function (resolve, reject) {
      // Switch to this once we can assume at least ES5
      // answerPs.forEach(function(answerP) {
      //     Q(answerP).then(resolve, reject);
      // });
      // Use this in the meantime
      for (var i = 0, len = answerPs.length; i < len; i++) {
        Q(answerPs[i]).then(resolve, reject);
      }
    });
  }

  function race(values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  }

  function fulfill(value) {

  }

  return will;
}));
