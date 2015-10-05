var
  _ = require('lodash'),
  debug = require('debug')('ebay:flatten');

// helper: find an array containing only special key-value pairs
// e.g. 'galleryURL' (makes it easier to handle in DB)
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


// helper to filter the keys that get flattened.
function _canFlattenKey(key) {
  if (/Array$/.test(key)) return false;
  if (key === 'Item') return false;
  return true;
}


/*
convert `OrderArray: [ Order: [...] ]` structure to `Orders: []`.
@param obj: the obj *containing* the key to be restructured.
@param key: the key within the object to fix.
*/
function _flattenSillyArray(obj, key) {
  var subKey = key.replace(/Array$/, '');   // e.g. 'Order' from 'OrderArray'
  var newKey = subKey + 's';                // e.g. 'Orders'
  debug('**newKey', newKey);

  obj[newKey] = obj[key][0][subKey];
  delete obj[key];

  obj[newKey] = obj[newKey].map(function(subObj) {
    return exports.flatten(subObj);
  });

  return obj;
}


/*
helper: RECURSIVELY turn 1-element arrays/objects into flat vars
(different from _.flatten() which returns an array)
*/
exports.flatten = function flatten(el, maxDepth, _depth) {
  if (_.isUndefined(_depth)) _depth = 0;
  if (_.isUndefined(maxDepth)) maxDepth = 10;

  if (_depth === 0) debug('flattening', el, {maxDepth: maxDepth});

  if (_depth > maxDepth) return el;

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
      _.extend(fixEl, flatten(pair, maxDepth, _depth+1));   // fix each, combine
    });
    el = fixEl;
  }

  // flatten sub-elements
  if (_.isArray(el)) {
    _.each(el, function(subEl, subInd) {
      el[subInd] = flatten(el[subInd], maxDepth, _depth+1);
    });
  }
  else if (_.isObject(el)) {
    _.each(el, function(subEl, subKey) {
      // special cases
      if (/Array$/.test(subKey)) {
        el = _flattenSillyArray(el, subKey);
      }
      else if (_canFlattenKey(subKey)) {
        el[subKey] = flatten(el[subKey], maxDepth, _depth + 1);
      }
    });
  }

  return el;
};
