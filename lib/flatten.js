var
  _ = require('lodash'),
  debug = require('debug')('ebay:flatten');

// helper: find an array containing only special key-value pairs
// e.g. 'galleryURL' (makes it easier to handle in MongoDB)
function isArrayOfValuePairs(el) {
  if (_.isArray(el)) {
    if (_.all(el, isValuePair)) return true;
  }
  return false;
}

// helper: identify a structure returned from the API:
// { @key:KEY, __value__:VALUE } => want to turn into { KEY: VALUE }
// (and array of these into single obj)
function isValuePair(el) {
  if (_.isObject(el) && _.size(el) === 2) {
    var keys = _.keys(el);
    if (new RegExp(/^@/).test(keys[0]) && keys[1] === '__value__') {
      return true;
    }
  }
  return false;
}


// helper: RECURSIVELY turn 1-element arrays/objects into flat vars
// (different from _.flatten() which returns an array)
exports.flatten = function flatten(el, iter) {
  if (_.isUndefined(iter)) iter = 1;

  if (iter > 100) {
    throw new Error("recursion error, stop at " + iter);
  }

  // flatten 1-item arrays
  if (_.isArray(el) && el.length === 1) {
    el = _.first(el);
  }

  // special value-pair structure in the ebay API: turn { @key:KEY, __value__:VALUE } into { KEY: VALUE }
  if (isValuePair(el)) {
    var values = _.values(el);
    debug('found special element', el);
    el = {};
    el[ values[0] ] = values[1];
    debug('converted element:', el);
  }

  // previous fix just creates an array of these. we want a clean key:val obj.
  // so, is this an array of special value-pairs?
  if (isArrayOfValuePairs(el)) {
    var fixEl = {};
    _(el).each(function(pair) {
      _.extend(fixEl, flatten(pair));   // fix each, combine
    });
    el = fixEl;
  }

  // flatten sub-elements
  if (_.isArray(el) || _.isObject(el)) {
    _.each(el, function(subEl, subInd) {
      el[subInd] = flatten(el[subInd], iter++);
    });
  }

  return el;
};
