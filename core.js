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

// std lib

core.toJson = function toJson(value, indent) {
  return JSON.stringify(value, null, indent === true ? 2 : indent);
};

core.fromJson = function fromJson(text) {
  return JSON.parse(text);
};

core.print = function fromJson() {
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(console, args);
};
