/**
 * default response parser, for JSON.
 * (and supporting helpers)
 * for XML responses, should be run through `./xml-converter` first.
 */

var
  _ = require('lodash'),
  util = require('util'),
  debug = require('debug')('ebay:parser'),

  _errors = require('./errors'),
  EbaySystemError = _errors.EbaySystemError,
  EbayRequestError = _errors.EbayRequestError,
  EbayClientError = _errors.EbayClientError,

  knownArrayKeysByApiEndpoint = require('./key-lists').knownArrayKeysByApiEndpoint;


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
function _canFlattenKey(key, requestContext) {
  //debug('_canFlattenKey?', key, requestContext);

  // assume that '*Array' and '*List' elements are arrays.
  if (/Array$/.test(key) || /List$/.test(key)) return false;

  // per-endpoint blacklist of known array keys.
  if (requestContext != null && requestContext.serviceName && requestContext.opType &&
      knownArrayKeysByApiEndpoint[requestContext.serviceName] != null &&
      knownArrayKeysByApiEndpoint[requestContext.serviceName][requestContext.opType] != null &&
      _.contains(knownArrayKeysByApiEndpoint[requestContext.serviceName][requestContext.opType], key)) {
    return false;
  }

  // otherwise assume it can be flattened if there's a single value.
  return true;
}


/*
 convert `OrderArray: [ Order: [...] ]` structure to `Orders: []`.
 @param parentObj: the obj *containing* the key to be restructured.
 @param key: the key within the object to fix.
 modifies byref.
 @return new key.
*/
function _flattenSillyArray(parentObj, key, requestContext) {
  //debug('_flattenSillyArray', key, parentObj[key]);

  var subKey = key.replace(/Array$/, '');   // e.g. 'Order' from 'OrderArray'
  var newKey = subKey + 's';                // e.g. 'Orders'

  // `compact` avoids creating an array of `[undefined]`,
  // from input `['']` when xml "array" element was empty.
  parentObj[newKey] = _.compact(parentObj[key][0][subKey]);
  delete parentObj[key];

  // might have already been flattened...
  if (!_.isArray(parentObj[newKey])) parentObj[newKey] = [ parentObj[newKey] ];

  parentObj[newKey] = parentObj[newKey].map(function(subObj) {
    return exports.flatten(subObj, -1, requestContext);
  });

  return newKey;
}


function _convertAmountStructure(el, requestContext) {
  if (_.isArray(el)) {
    return el.map(function(subEl) {
      return _convertAmountStructure(subEl);
    });
  }

  if (el.hasOwnProperty('_') && el.hasOwnProperty('$')) {
    el.amount = +el._;
    delete el._;
    _.extend(el, el['$']);    // {currencyID}
    delete el['$'];
  }
  return el;
}


function _castTypes(el) {
  if (_.isString(el)) {
    if (!isNaN(el)) el = +el;   // numeric string to number
    else if (el === 'true') el = true;
    else if (el === 'false') el = false;
  }
  return el;
}


/*
 recursively turn 1-element arrays/objects into flat values/objects.
 intended to handle flaw of XML->JSON conversion, that everything becomes an array.
 NOTE this is risky/complicated, because it has to make assumptions
  about what *should* remain an array,
  so some items might be structured differently depending on number of values.
  helpers like `canFlattenKey()` try to mitigate this risk.

 also transforms numbers and booleans from strings to types.

 `maxDepth` of -1 equals infinity.
*/
exports.flatten = function flatten(el, maxDepth, requestContext, _depth) {
  if (_depth == null) _depth = 1;
  if (maxDepth == null) maxDepth = 10;  // default

  if (_depth === 1) debug('flattening', el, {maxDepth: maxDepth, requestContext: requestContext});

  if (maxDepth >= 0 && _depth > maxDepth) {
    return el;
  }

  // flatten 1-item arrays.
  // note: this is dangerous, means responses w/ single value can look different from multiple values.
  // trying to mitigate with `canFlattenKey()` check below.
  if (_.isArray(el) && el.length === 1) {
    el = _.first(el);
  }

  // weird value-pair structure:
  // turn `{ @key:KEY, __value__:VALUE }` into `{ KEY: VALUE }`
  if (_isValuePair(el)) {
    var values = _.values(el);
    debug('converting key-value pair', el);
    el = {};
    el[ values[0] ] = values[1];
  }

  //// previous fix just creates an array of these. we want a clean key:val obj.
  //// so, is this an array of special value-pairs?
  //// TODO - disabled this b/c old and inefficient - understand where it was needed, and try to optimize.
  //if (_isArrayOfValuePairs(el)) {
  //  var fixEl = {};
  //  _(el).each(function(pair) {
  //    _.extend(fixEl, flatten(pair, maxDepth, requestContext, _depth + 1));   // fix each, combine
  //  });
  //  el = fixEl;
  //}

  // flatten sub-elements
  if (_.isObject(el) && !_.isArray(el)) {
    _.forOwn(el, function(childEl, childKey) {
      // special cases
      if (/Array$/.test(childKey)) {
        childKey = _flattenSillyArray(el, childKey, requestContext);  // on parent, byref; childKey changes!
        childEl = el[childKey];  // ref to new element
      }
      else if (/(Amount|Cost|Price|Subtotal)/.test(childKey)) {
        el[childKey] = _convertAmountStructure(childEl, requestContext);
      }

      if (_canFlattenKey(childKey, requestContext)) {
        el[childKey] = flatten(childEl, maxDepth, requestContext, _depth + 1);
      }
      // can't flatten [presumed] array itself, but can still flatten its children.
      // @REVIEW: this causes weird skipping behavior, where grandchildren are flattened before higher levels,
      // so can't assume that lower levels haven't been flattened yet!
      else if (_.isArray(childEl)) {
        el[childKey] = childEl.map(function(grandChildEl) {
          return flatten(grandChildEl, maxDepth, requestContext, _depth + 1);
        });
      }
    });
  }

  if (_.isArray(el)) {
    el = el.map(function(childEl) {
      return flatten(childEl, maxDepth, requestContext, _depth + 1);
    });
  }

  // DISABLE - also casting IDs - fix.
  //el = _castTypes(el);

  debug('flattened to', el);
  return el;
};


/*
parse API responses. differs by query type.
@param data: response, converted to (or originally in) JSON.
@param requestContext: context on the request.
  - same as `options` in `xmlRequest()`, see docs there.
@param callback: gets `null, data` in success case, and `error, data` on error case.
  - error can be from response or parsing failure. (see error types.)
  - callback is actually called immediately/synchronously - just using to have 2 return values in error case.
*/
exports.parseResponseJson = function(data, requestContext, callback) {
  debug('parsing response json', data, requestContext);

  var flatten = exports.flatten;

  requestContext = requestContext || {};

  // flattening can be slow with big responses;
  // don't necessarily want to flatten all the way up front.
  // (maybe better to let app pick the keys it wants and flatten only them.)
  data = flatten(data, requestContext.parseDepth, requestContext);

  // find the response key.
  // (is probably `{requestContext.opType}Response`)
  var responseKey = _(data).keys().find(function(key) {
    return /[a-zA-Z]+Response$/.test(key);
  }) || requestContext.opType + 'Response';

  debug('looking for response key', responseKey);

  data = data[responseKey];

  if (_.isUndefined(data)) {
    // assume this is a failure of the client to parse the response properly.
    throw new EbayClientError("Response missing " + responseKey + " element");
  }

  //
  // 'Ack', 'Errors', (and maybe 'errorMessage'?) indicate errors.
  // see http://developer.ebay.com/devzone/xml/docs/Reference/ebay/Errors/ErrorMessages.htm
  //
  var
    ack,
    errorMessage,   // build a string
    errorClassification = 'RequestError',  // 'RequestError' or 'SystemError'
    errorSeverityCode = 'Warning',         // 'Warning' or 'Error'
    errors,         // error object(s) in response.
    extraErrorProps,
    error = null;   // final Error instance

  if (!_.isUndefined(data.Ack)) ack = data.Ack;
  else if (!_.isUndefined(data.ack)) ack = data.ack;

  if (ack != null) ack = flatten(ack, -1, requestContext);

  // note: docs say,
  //  "Both Success and Warning indicate that the request was successful.
  //   However, a value of Warning means that something occurred
  //   that may affect your application or the user."
  // treating Warning as an error,
  // but caller still gets the data, and the 'SeverityCode', so it can choose to ignore.
  //
  if (_.isUndefined(ack) || ack !== 'Success') {
    //
    // handle all different ways errors can be represented
    //

    // Trading, Shopping, Finding(?)
    if (!_.isUndefined(data.Errors)) {
      errors = _.isArray(data.Errors) ? data.Errors : [data.Errors];

      // build composite message.
      errorMessage = errors.map(function(errorObj) {
        errorObj = flatten(errorObj, -1, requestContext);
        if (errorObj.ErrorClassification === 'SystemError') {
          errorClassification = errorObj.ErrorClassification;  // SystemError trumps RequestError
        }
        if (errorObj.SeverityCode === 'Error') {
          errorSeverityCode = errorObj.SeverityCode;           // Error trumps Warning
        }
        return (errorObj.SeverityCode || 'Error') + ': ' + errorObj.LongMessage + (errorObj.ErrorCode ? ' (' + errorObj.ErrorCode + ')' : '');
      }).join(', ');
    }

    // @review which API is this for?
    // (maybe a relic of JSON response, no longer relevant?)
    else if (!_.isUndefined(data.errorMessage)) {
      errorMessage = flatten(data.errorMessage, -1, requestContext);
      if (_.isObject(errorMessage)) errorMessage = util.inspect(errorMessage, true, 3);
      // TODO error code and classification in this format?
    }

    debug('response error', errorClassification, errorSeverityCode, ack, errorMessage);

    // fallback
    if (errorMessage == null) {
      errorMessage = util.format("Bad ack code: ", ack);
      errorSeverityCode = 'Error';
    }

    // more context for programatically interpreting the error
    extraErrorProps = {
      severityCode: errorSeverityCode,
      classification: errorClassification,
      errors: errors,
      details: _.clone(ack)
    };

    // still pass back the data! so client can ignore the warning/error if it chooses.
    if (errorClassification === 'SystemError') {
      error = new EbaySystemError("eBay API system " + errorSeverityCode.toLowerCase() + ": " + errorMessage, extraErrorProps);
    }
    else {
      error = new EbayRequestError("eBay API request " + errorSeverityCode.toLowerCase() + ": " + errorMessage, extraErrorProps);
    }
  }

  //
  // PER-OP PARSING
  //
  // ...?

  callback(error, data);
};
