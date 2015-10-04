var _ = require('lodash');


// [helper] constructor for an 'itemFilter' filter (used by the Finding Service)
exports.ItemFilter = function(name, value, paramName, paramValue) {
  // required
  this.name = name;
  this.value = value;

  // optional
  this.paramName = _.isUndefined(paramName) ? '' : paramName;
  this.paramValue = _.isUndefined(paramValue) ? '' : paramValue;
};

