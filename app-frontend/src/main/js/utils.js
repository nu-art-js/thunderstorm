/**
 * Created by tacb0ss on 27/07/2018.
 */

if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] !== 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}

if (!Object.isString) {
  Object.prototype.isString = function () {
    return typeof this === "string" || this instanceof String;
  };

  Object.defineProperty(Object.prototype, "isString", {enumerable: false});
}

