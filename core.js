var R = require('ramda');

var core = module.exports = R;

// primitive / operator functions

core.eq = function eq(a, b) {
  return a === b;
};
core.notEq = function notEq(a, b) {
  return a !== b;
};
core.lowerOrEqual = function lowerOrEqual(a, b) {
  return a <= b;
};
core.greaterOrEqual = function greaterOrEqual(a, b) {
  return a >= b;
};
core.lower = function lower(a, b) {
  return a < b;
};
core.greater = function greater(a, b) {
  return a > b;
};

core._in = function _in(a, b) {
  return a in b;
};
core._instanceof = function _instanceof(a, b) {
  return a instanceof b;
};
core._new = function _new(Constructor) {
  var args = Array.prototype.slice.call(arguments, 1);
  var instance;

  // Create a new temporaty subclass
  var K = function () {};
  K.prototype = Constructor.prototype;
  instance = new K();

  // Call original constructor
  var ret = Constructor.apply(instance, args);

  // If the constructor returns an object use that, else use instance
  return Object(ret) === ret ? ret : instance;
};
core._throw = function _throw(a) {
  throw a;
};
core._try = function _try(tryFn, catchFn) {
  try {
    return tryFn();
  } catch (err) {
    return catchFn(err);
  }
};
core._typeof = function _typeof(a) {
  return typeof a;
};
core._void = function _viod(a) {
  return void a;
};
core._bang_ = function _bang_(a) {
  return !a;
};

// std lib

core.toJson = function toJson(value, indent) {
  return JSON.stringify(value, null, indent === true ? 2 : indent);
};

core.fromJson = function fromJson(text) {
  return JSON.parse(text);
};

core.assert = function assert(condition, message) {
  if (!condition) {
    throw new Error('Assertion error: ' + message);
  }
};

core.print = function print() {
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(console, args);
};

core.string = function string() {
  var args = Array.prototype.slice.call(arguments);
  return args.join('');
};

core.isPair = function isPair(x) {
  return x % 2 === 0;
};

core.isOdd = function isOdd(x) {
  return x % 2 === 1;
};

core.type = function type(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
};

core.isOfType = function isOfType(wantedType, value) {
  return core.type(value) === wantedType;
};

core.regexp = function regexp(re, options) {
  if (re instanceof RegExp) {
    return re;
  }
  return new RegExp(re, options || 'g');
};

core.regexpMatch = function regexpMatch(re, string) {
  return core.regexp(re).exec(string) || undefined;
};

core.regexpFind = function regexpFind(re, string) {
  var match = core.regexp(re).exec(string);
  return match ? core.head(match) : undefined;
};

core.regexpReplace = function regexpReplace(re, replacement, string) {
  return String(string).replace(core.regexp(re), replacement);
};

// Like `assoc` but still returns array when passed numeric keys
function arraySafeAssoc(key, value, target) {
    core.assert(
        Array.isArray(target) || (typeof target === 'object'),
        'arraySafeAssoc: target must be of type array or object got "' + typeof target + '"'
    );
    core.assert(
        core.contains(typeof key, ['number', 'string']),
        'arraySafeAssoc: key must be of type string or number'
    );

    var newTarget = core.clone(target);
    newTarget[key] = value;
    return newTarget;
}

// Takes a object and a path (array of keys) and return the value at the
// specified path in the object or null if non-existant
// (get-in {:a {:b 5}} [:a :b]) -> 5
core.getIn = function getIn(path, target) {
  return core.reduce(function (ret, k) {
    return ret && (k in ret) ? ret[k] : null;
  }, target, path);
};

// Returns a clone of the target with value set at the specified path (array
// of keys). Creates empty objects as necessary to get to path location.
core.setIn = core.curryN(3, function setIn(path, value, target) {
    core.assert(Array.isArray(path), 'setIn: path must be array');
    core.assert(path.length > 0, 'setIn: path length must be > 0');
    core.assert(typeof target === 'object', 'setIn: target must be an object');

    // Recursion end condition
    if (path.length === 1) {
        return arraySafeAssoc(path[0], value, target);
    }

    // Recurse removing one key from the path
    return arraySafeAssoc(
        path[0],
        core.setIn(path.slice(1), value, target[path[0]] || {}),
        target
    );
});

core.updateIn = core.curryN(3, function updateIn(path, updater, target) {
  return core.setIn(path, updater(core.getIn(path, target)), target);
});
