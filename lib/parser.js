var
  _ = require('lodash'),
  util = require('util'),
  flatten = require('./flatten').flatten,
  debug = require('debug')('ebay:parser');


/*
parse API responses. differs by query type.
@param data: response, converted to (or originally in) JSON.
@param options: context on the request.
@return parsed object.
@throws exception on failure, or if error message is parsed from response.
*/
exports.parseResponse = function(data, options) {
  debug('parsing items', data);

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

  //
  // PER-OP PARSING
  //
  // ...?


  //var items = [];
  //if (typeof data.Item !== 'undefined') {       // e.g. for Shopping::GetSingleItem
  //  items = [ data.Item ];    // preserve array for standardization (?)
  //}
  //
  //else if (typeof data.searchResult !== 'undefined') {    // e.g. for FindingService
  //  // reduce in steps so successful-but-empty responses don't throw error
  //  if (!_.isEmpty(data.searchResult)) {
  //    data = _(data.searchResult).first();
  //    if (typeof data !== 'undefined') {
  //      if (typeof data.item !== 'undefined') {
  //        items = data.item;
  //      }
  //    }
  //  }
  //}
  //else if (typeof data.itemRecommendations !== 'undefined') {
  //  if (typeof data.itemRecommendations !== 'undefined') {
  //    if (typeof data.itemRecommendations.item !== 'undefined') {
  //      items = _.isArray(data.itemRecommendations.item) ? data.itemRecommendations.item : [];
  //    }
  //  }
  //}
  //
  //// recursively flatten 1-level arrays and "@key:__VALUE__" pairs
  //items = _(items).map(function(item) {
  //  return flatten(item);
  //});

  return data;
};
