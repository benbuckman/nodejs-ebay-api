//var
//  _ = require('lodash'),
//  debug = require('debug')('ebay:get'),
//  request = require('request'),
//  parseItemsFromResponse = require('./parser').parseItemsFromResponse,
//  buildRequestUrl = require('./urls').buildRequestUrl,
//  flatten = require('./flatten').flatten,
//  getDefaultHeaders = require('./defaults').getDefaultHeaders;
//
//
//// make a single GET request to a JSON service
//exports.getRequest = function(options, callback) {
//  debug('GET request', options);
//
//  if (! options.serviceName) return callback(new Error("Missing serviceName"));
//  if (! options.opType) return callback(new Error("Missing opType"));
//  if (! options.appId) return callback(new Error("Missing appId"));
//
//  options.params = options.params || {};
//  options.filters = options.filters || {};
//  options.reqOptions = options.reqOptions || {};
//  options.parser = options.parser || parseItemsFromResponse;
//  options.sandbox = options.sandbox || false;
//
//  options.raw = options.raw || false;
//
//  if (options.serviceName === 'Merchandising') {
//    options.reqOptions.decoding = 'buffer';   // otherwise fails to decode json. doesn't seem to be necessary w/ FindingService.
//  }
//
//  // fill in default params. explicit options above will override defaults.
//  var params = _.extend({}, getDefaultHeaders(options), options.params);
//  debug('GET request params', params);
//
//  var url = buildRequestUrl(options.serviceName, params, options.filters, options.sandbox);
//  debug('GET request URL', url);
//
//  debug('GET request options', options.reqOptions);
//
//  request.get({
//    'url': url,
//    'headers': options.reqOptions.headers
//  },
//  function(error, response, result) {
//    debug('response', response.statusCode, result);
//
//    var data;
//
//    if (error) {
//      error.message = "Completed with error: " + error.message;
//    }
//    else if (response.statusCode !== 200) {
//      return callback(new Error(util.format("Bad response status code", response.statusCode, result.toString())));
//    }
//    else if (options.raw === true) {
//      return callback(null, result.toString());
//    }
//
//    try {
//      data = JSON.parse(result);
//
//      // drill down to item(s). each service has its own structure.
//      if (options.serviceName !== 'Shopping') {
//        var responseKey = options.opType + 'Response';
//        if (_.isUndefined(data[responseKey])) {
//          return callback(new Error("Response missing " + responseKey + " element"));
//        }
//        data = data[responseKey];
//      }
//
//      if (_.isArray(data)) {
//        data = _.first(data);
//      }
//
//      // 'ack' and 'errMsg' indicate errors.
//      // - in FindingService it's nested, in Merchandising it's flat - flatten to normalize
//      if (!_.isUndefined(data.ack)) data.ack = flatten(data.ack);
//      else if (!_.isUndefined(data.Ack)) {      // uppercase, standardize.
//        data.ack = flatten(data.Ack);
//        delete data.Ack;
//      }
//
//      if (_.isUndefined(data.ack) || data.ack !== 'Success') {
//        var errMsg = _.isUndefined(data.errorMessage) ? null : flatten(data.errorMessage);
//        return callback(new Error(util.format("Bad 'ack' code", data.ack, 'errorMessage?', util.inspect(errMsg, true, 3))));
//      }
//    }
//    catch (error) {
//      debug('Failed to handle response', error);
//      return callback(error);
//    }
//
//    // parse the response
//    options.parser(data, function(error, items) {
//      if (error) debug('Error parsing response', error);
//      else debug('Parsed response', items);
//      callback(error, items);
//    });
//  });
//};