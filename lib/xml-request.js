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


/**
 * handle quirk of 'xml' module:
 * need arrays all the way down,
 * and objects can only have a single key:value,
 * e.g. {k1:v1,k2:v2} need to become [{k1:[v1]}, {k2:[v2]}].
 * @see tests in xml-request.test.js.
 */
exports._deepToArray = function _deepToArray(obj) {
  var key, value, arr = [];

  if (_.isArray(obj)) {
    // not sure about this: arrays within objects are handled below;
    // top level should never be an array;
    // but seems ok. change/fix if a scenario comes up that this breaks.
    return obj.map(function(value) {
      return _deepToArray(value);
    });
  }
  else if (_.isObject(obj)) {
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        value = obj[key];

        // `{foo: [a,b,c]}` => `[{foo:a},{foo:b},{foo:c}]`
        if (_.isArray(value)) {
          value.forEach(function(subValue) {
            arr.push(_.set({}, key, _deepToArray(subValue)));
          });
        }
        else {
          arr.push(_.set({}, key, _deepToArray(value)));
        }
      }
    }
  }
  else {
    arr = [obj];
  }
  return arr;
};


/*
build XML input for XML requests (POST).
@param {object} options: request context. see `xmlRequest()` docs.
for repeatable fields, use an array value (see below).
*/
function buildXmlInput(options) {
  debug('buildXmlInput', options);

  var data = {}, root;
  var params = options.params || {};

  root = data[options.opType + 'Request'] = [];   // e.g. <GetOrdersRequest>

  if (options.serviceName === 'Finding') {
    root.push({'_attr': {'xmlns': 'http://www.ebay.com/marketplace/search/v1/services'}});
  }
  else {
    root.push({'_attr': {'xmlns': 'urn:ebay:apis:eBLBaseComponents'}});
  }

  if (options.authToken) {
    root.push({ 'RequesterCredentials': [ { 'eBayAuthToken' : options.authToken } ] });
  }

  // concat
  root.push.apply(root, exports._deepToArray(params));

  debug('Converting to XML', data);

  var xmlBody =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    xmlBuilder([data], true);

  debug('XML body', xmlBody);

  return xmlBody;
}


/*
@param {object} @options:
 @option {object} reqOptions: passed to request

 @option {string} appId
 @option {string} opType
 @option {string} version

 @option {string} devName
 @option {string} cert
 @option {string} authToken

 @option {string} globalId
 @option {string} siteId

 @option {object} params: this gets converted to an XML body with request parameters.
  all filters go in here. use nested objects where appropriate. see the API docs.

 ...

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
    url: buildRequestUrl(options),
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