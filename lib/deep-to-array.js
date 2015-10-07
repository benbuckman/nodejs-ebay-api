var _ = require('lodash');

  /**
 * handle quirk of 'xml' module:
 * need arrays all the way down,
 * and objects can only have a single key:value,
 * e.g. {k1:v1,k2:v2} need to become [{k1:[v1]}, {k2:[v2]}].
 * @see tests in xml-request.test.js.
 */
exports.deepToArray = function deepToArray(obj) {
  var key, value, arr = [];

  if (_.isArray(obj)) {
    // not sure about this: arrays within objects are handled below;
    // top level should never be an array;
    // but seems ok. change/fix if a scenario comes up that this breaks.
    return obj.map(function(value) {
      return deepToArray(value);
    });
  }
  else if (_.isObject(obj)) {
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        value = obj[key];

        // `{foo: [a,b,c]}` => `[{foo:a},{foo:b},{foo:c}]`
        if (_.isArray(value)) {
          value.forEach(function(subValue) {
            arr.push(_.set({}, key, deepToArray(subValue)));
          });
        }
        else {
          arr.push(_.set({}, key, deepToArray(value)));
        }
      }
    }
  }
  else {
    arr = [obj];
  }
  return arr;
};
