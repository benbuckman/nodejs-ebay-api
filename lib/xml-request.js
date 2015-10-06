var
  _ = require('lodash'),
  debug = require('debug')('ebay:request'),
  request = require('request'),
  util = require('util'),
  async = require('async'),
  xmlBuilder = require('xml'),
  xml2js = require('xml2js'),
  buildRequestUrl = require('./urls').buildRequestUrl,
  getDefaultHeaders = require('./defaults').getDefaultHeaders,
  defaultParser = require('./parser').parseResponse;


// need arrays all the way down... (quirk of xml module).
exports._deepToArray = function _deepToArray(obj) {
  var key, value;
  if (_.isObject(obj)) {
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        value = obj[key];
        if (_.isArray(value)) {  // recurse over array children
          obj[key] = value.map(function(subValue) {
            return _deepToArray(subValue);
          });
        }
        else {  // make it an array
          obj[key] = [ _deepToArray(value) ];
        }
      }
    }
  }
  return obj;
};


/*
build XML input for XML requests (POST).
@param {object} options: request context.
  @option {object} params: custom input params.

for repeatable fields, use an array value (see below).
*/
function buildXmlInput(options) {
  debug('buildXmlInput', options);

  var data = {}, root;
  var params = options.params || {};

  switch(options.opType) {
    // per-op ...?

    default:
      root = data[options.opType + 'Request'] = [];   // e.g. <GetOrdersRequest>
      root.push({ '_attr' : { 'xmlns' : "urn:ebay:apis:eBLBaseComponents" } });
  }

  if (options.authToken) {
    root.push({ 'RequesterCredentials' : [ { 'eBayAuthToken' : options.authToken } ] });
  }

  params = exports._deepToArray(params);

  _.each(params, function(value, key) {   // keys in top object
    _.each(params[key], function(value) { // arrays
      root.push(_.set({}, key, [value]));
    });
  });

  debug('Converting to XML', data);

  var xmlBody =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    xmlBuilder([data], true);

  debug('XML body', xmlBody);

  return xmlBody;
}


/*
@param {object} @options
  @option reqOptions: passed to request
@param {function} callback: gets response
*/
exports.xmlRequest = function(options, callback) {
  debug('XML request', options);
  options = options || {};

  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));

  options.reqOptions = options.reqOptions || {};
  options.reqOptions.headers = options.reqOptions.headers || {};
  _.defaults(options.reqOptions.headers, getDefaultHeaders(options));

  var reqOptions = _.extend({}, options.reqOptions, {
    url: buildRequestUrl(options.serviceName, {}, {}, options.sandbox || false),
    // @see note in buildXmlInput() re: nested elements (...??)
    body: buildXmlInput(options),
  });

  debug('XML request options', reqOptions);

  options.parser = options.parser || defaultParser;

  request.post(reqOptions, function(error, response) {

    debug('response', {statusCode: response.statusCode, body: response.body});

    //if (response.body instanceof Error) {  // @review necessary?
    //  var error = response.body;
    //  error.message = "Completed with error: " + error.message;
    //  return callback(error);
    //}
    if (response.statusCode !== 200) {
      return callback(new Error(util.format("Bad response status code", response.statusCode, response.body.toString())));
    }

    // raw XML wanted?
    if (options.raw) {
      return callback(null, response.body);
    }

    async.waterfall([
      // convert xml to json
      function _toJson(next) {
        var xmlParser = new xml2js.Parser();
        xmlParser.parseString(response.body, function(error, data) {
          if (error) {
            error.message = "Error parsing XML: " + error.message;
            debug(error);
            return next(error);
          }
          debug('Parsed XML', data);
          next(null, data);
        });
      },

      function _parseJson(data, next) {
        var parsed;
        try {
          parsed = options.parser(data, options);
          next(null, parsed);
        }
        catch(error) {
          error.message = "Error parsing JSON: " + error.message;
          next(error)
        }
      }
    ],
    callback);
  });
};