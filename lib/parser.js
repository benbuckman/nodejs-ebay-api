var
  _ = require('lodash'),
  util = require('util'),
  debug = require('debug')('ebay:parser');


/*
helper: find an array containing only special key-value pairs
e.g. 'galleryURL' (makes it easier to handle in DB)
*/
function _isArrayOfValuePairs(el) {
  if (_.isArray(el)) {
    if (_.all(el, _isValuePair)) return true;
  }
  return false;
}

/*
helper: identify a structure returned from the API:
  { @key:KEY, __value__:VALUE } => want to turn into { KEY: VALUE }
  (and array of these into single obj)
*/
function _isValuePair(el) {
  if (_.isObject(el) && _.size(el) === 2) {
    var keys = _.keys(el);
    if (new RegExp(/^@/).test(keys[0]) && keys[1] === '__value__') {
      return true;
    }
  }
  return false;
}


/*
helper to filter the keys that get flattened.
*/
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

  obj[newKey] = obj[key][0][subKey];
  delete obj[key];

  obj[newKey] = obj[newKey].map(function(subObj) {
    return exports.flatten(subObj);
  });

  return obj;
}


function _convertAmountStructure(obj) {
  if (obj.hasOwnProperty('_')) {
    obj.amount = obj._;
    delete obj._;
  }
  if (obj.hasOwnProperty('$')) {
    _.extend(obj, obj['$']);
    delete obj['$'];
  }
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
  if (_isValuePair(el)) {
    var values = _.values(el);
    debug('found special element', el);
    el = {};
    el[ values[0] ] = values[1];
    debug('converted element:', el);
  }

  // previous fix just creates an array of these. we want a clean key:val obj.
  // so, is this an array of special value-pairs?
  if (_isArrayOfValuePairs(el)) {
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
      else if (/Amount/.test(subKey)) {
        el[subKey] = _convertAmountStructure(el[subKey]);
      }
      else if (_canFlattenKey(subKey)) {
        el[subKey] = flatten(el[subKey], maxDepth, _depth + 1);
      }
    });
  }

  return el;
};


/*
parse API responses. differs by query type.
@param data: response, converted to (or originally in) JSON.
@param options: context on the request.
@return parsed object.
@throws exception on failure, or if error message is parsed from response.
*/
exports.parseResponse = function(data, options) {
  debug('parsing items', data);

  var flatten = exports.flatten;

  data = flatten(data, 1);   // top level first
  debug('flattened', data);

  var responseKey = options.opType + 'Response';
  data = flatten(data[responseKey], 1);   // drill down 1 more level
  if (_.isUndefined(data)) {
    throw new Error("Response missing " + responseKey + " element");
  }

  // 'ack' and 'errorMessage' indicate errors.
  // in FindingService it's nested (?), in others it's flat - flatten to normalize.
  var errorMessage, errors;
  if (!_.isUndefined(data.Ack)) {   // normalize to lowercase
    data.ack = data.Ack;
    delete data.Ack;
  }
  if (!_.isUndefined(data.ack)) {
    data.ack = flatten(data.ack);
  }
  if (_.isUndefined(data.ack) || data.ack !== 'Success') {
    if (!_.isUndefined(data.errorMessage)) {
      errorMessage = flatten(data.errorMessage);
      if (_.isObject(errorMessage)) errorMessage = util.inspect(errorMessage, true, 3);
    }
    else if (!_.isUndefined(data.Errors)) {
      errors = _.isArray(data.Errors) ? data.Errors : [data.Errors];
      errorMessage = errors.map(function(errorObj) {
        errorObj = flatten(errorObj);
        return errorObj.LongMessage + '(' + errorObj.ErrorCode + ').';
      }).join(' ');
    }
    debug('data errors', data.ack, errorMessage);
    throw new Error(util.format("Bad ack code: ", data.ack, errorMessage ? ' - ' + errorMessage : ''));
  }

  // flatten a little more.
  // see `_canFlattenKey()` for exceptions.
  data = flatten(data, 1);

  if (data.paginationOutput) {
    data.paginationOutput = flatten(data.paginationOutput);
  }

  //
  // PER-OP PARSING
  //
  // ...?

  return data;
};
