var
  _ = require('lodash'),
  debug = require('debug')('ebay:post'),
  request = require('request'),
  util = require('util'),
  async = require('async'),
  xmlBuilder = require('xml'),
  xml2js = require('xml2js'),
  buildRequestUrl = require('./lib/urls').buildRequestUrl,
  getDefaultParams = require('./defaults').getDefaultParams;


// build XML input for XML-POST requests
// params should include: authToken, ...
//
// handle nested elements w/ array wrapper around each obj.
// (quirk of XmlBuilder lib)
// e.g. 'Pagination': [ { 'EntriesPerPage': '100' } ]
//
// for repeatable fields, use an array value (see below)
//
function buildXmlInput(opType, params) {
  debug('buildXmlInput', arguments);

  var data = {}, top;

  switch(opType) {
    // @todo others might have different top levels...
    case 'GetOrders':
    default:
      data[opType + 'Request'] = [];      // e.g. <GetOrdersRequest>
      top = data[opType + 'Request'];
      top.push({ '_attr' : { 'xmlns' : "urn:ebay:apis:eBLBaseComponents" } });
  }

  if (typeof params.authToken !== 'undefined') {
    top.push({ 'RequesterCredentials' : [ { 'eBayAuthToken' : params.authToken } ] });
    delete params.authToken;
  }

  // for repeatable fields, use array values.
  // to keep this simpler, treat everything as an array value.
  _(params).each(function(values, key) {
    if (!_.isArray(values)) values = [values];

    _(values).each(function(value) {
      var el = {};
      el[key] = value;
      top.push(el);
    });
  });

  debug('XML input', data);

  data = [ data ];

  return '<?xml version="1.0" encoding="UTF-8"?>' + "\n" + xmlBuilder(data, true);
}


// make a single POST request to an XML service
exports.postXmlRequest = function postXmlRequest(options, callback) {
  debug('POST XML request', options);

  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));

  // @see note in buildXmlInput() re: nested elements
  options.params = options.params || {};

  options.reqOptions = options.reqOptions || {};
  options.sandbox = options.sandbox || false;

  // options.parser = options.parser || ...;   // @todo

  // converts XML to JSON by default, but can also return raw XML
  options.rawXml = options.rawXml || false;

  // app/auth params go into headers (see getDefaultParams())
  options.reqOptions.headers = options.reqOptions.headers || {};

  _.defaults(options.reqOptions.headers, getDefaultParams(options));    // ???

  var url = buildRequestUrl(options.serviceName, {}, {}, options.sandbox);
  debug('POST URL', url);

  options.reqOptions.data = buildXmlInput(options.opType, options.params);
  debug('POST XML body', options.reqOptions.data);

  debug('POST options', reqOptions);

  request.post({
    'url': url,
    'body': options.reqOptions.data,
    'headers': options.reqOptions.headers
  },
  function(error, response, result) {
    debug('response', response.statusCode, result);

    if (result instanceof Error) {  // @review necessary?
      var error = result;
      error.message = "Completed with error: " + error.message;
      return callback(error);
    }
    else if (response.statusCode !== 200) {
      return callback(new Error(util.format("Bad response status code", response.statusCode, result.toString())));
    }

    // raw XML wanted?
    if (options.rawXml) {
      return callback(null, result);
    }

    async.waterfall([
      // convert xml to json
      function _toJson(next) {
        var parser = new xml2js.Parser();

        parser.parseString(result, function parseXmlCallback(error, data) {
          if (error) {
            error.message = "Error parsing XML: " + error.message;
            debug('Parse error', error);
            return next(error);
          }
          debug('Parsed XML', data);
          next(null, data);
        });
      },

      function _parseData(data, next) {
        //// @todo parse the response
        // options.parser(data, next);
        // ???

        next(null, data);
      }

    ],
    callback);
  });
};