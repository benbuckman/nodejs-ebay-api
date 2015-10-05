var
  _ = require('lodash'),
  debug = require('debug')('ebay:request'),
  request = require('request'),
  util = require('util'),
  async = require('async'),
  xmlBuilder = require('xml'),
  xml2js = require('xml2js'),
  buildRequestUrl = require('./urls').buildRequestUrl,
  getDefaultHeaders = require('./defaults').getDefaultHeaders;


// build XML input for XML requests (POST)
// params should include: authToken(?), ... @TODO
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
  params = params || {};

  switch(opType) {
    // per-op ...?

    default:
      top = data[opType + 'Request'] = [];   // e.g. <GetOrdersRequest>
      top.push({ '_attr' : { 'xmlns' : "urn:ebay:apis:eBLBaseComponents" } });
  }

  if (params.authToken) {
    top.push({ 'RequesterCredentials' : [ { 'eBayAuthToken' : params.authToken } ] });
    delete params.authToken;
  }

  var key, values;
  for (key in params) {
    values = params[key];

    if (!_.isArray(values)) values = [values];

    values.forEach(function(value) {
      var el = {};
      el[key] = value;
      top.push(el);
    });
  }

  debug('Converting to XML', data);

  var xmlBody =
    '<?xml version="1.0" encoding="UTF-8"?>' + "\n" +
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

  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));

  options.reqOptions = options.reqOptions || {};
  options.reqOptions.headers = options.reqOptions.headers || {};
  _.defaults(options.reqOptions.headers, getDefaultHeaders(options));

  var reqOptions = _.extend({}, options.reqOptions, {
    url: buildRequestUrl(options.serviceName, {}, {}, options.sandbox || false),
    // @see note in buildXmlInput() re: nested elements (...??)
    body: buildXmlInput(options.opType, options.params || {}),
  });

  debug('XML request options', reqOptions);

  // options.parser = options.parser || ...;   // @todo

  // converts XML to JSON by default, but can also return raw XML
  options.raw = options.raw || false;

  var _request = request.post(reqOptions, function(error, response) {

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
        var parser = new xml2js.Parser();

        parser.parseString(response.body, function parseXmlCallback(error, data) {
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

  console.log('request headers', _request.headers);
};