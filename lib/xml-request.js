var
  _ = require('lodash'),
  debug = require('debug')('ebay:request'),
  timer = require('debug')('ebay:timer'),
  request = require('request'),
  util = require('util'),
  async = require('async'),
  xmlBuilder = require('xml'),
  buildRequestUrl = require('./urls').buildRequestUrl,
  getDefaultHeaders = require('./defaults').getDefaultHeaders,
  convertXmlToJson = require('./xml-converter').convertXmlToJson,
  parseResponseJson = require('./json-parser').parseResponseJson,
  deepToArray = require('./deep-to-array').deepToArray,
  EbayClientError = require('./errors').EbayClientError;


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
  root.push.apply(root, deepToArray(params));

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

 @option {string} devId
 @option {string} certId
 @option {string} authToken

 @option {string} globalId
 @option {string} siteId

 @option {object} params: this gets converted to an XML body with request parameters.
   - all filters go in here. use nested objects where appropriate. see the API docs.

 @option {int} parseDepth: how many levels down to try to parse/interpret the response.
   - see `parseResponseJson()` and its tests.
   - higher number can make app-level code easier, but is riskier;
     lower number here shifts the parsing burden to the application.

 ...

 note, `options` may be modified by ref.

@param {function} callback: gets response
*/
exports.xmlRequest = function(options, callback) {
  var _startTime = Date.now();

  debug('XML request', options);
  options = options || {};

  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));

  options.xmlConverter = options.xmlConverter || convertXmlToJson;
  options.parser = options.parser || parseResponseJson;

  // for default parser
  options.parseDepth = options.parseDepth != null ? options.parseDepth : -1;  // default parse all the way

  options.reqOptions = options.reqOptions || {};
  options.reqOptions.headers = options.reqOptions.headers || {};
  _.defaults(options.reqOptions.headers, getDefaultHeaders(options));

  // allow options to override default url (and body) if they want to.
  options.reqOptions = _.extend({
    url: buildRequestUrl(options),
    body: buildXmlInput(options),
    // As of 3/22/2016, the eBay API has several servers that can only
    // negotiate TLS v1.0 sessions, and several servers that can negotiate TLS
    // v1.0, v1.1 and v1.2. Node/OpenSSL get confused by this, and occasionally
    // attempt to parse a v1.2 response using TLS v1.0 and vice versa. The
    // error you get back from the request looks something like this:
    //
    // { [Error: write EPROTO 140113357338496:error:1408F10B:SSL
    //    routines:SSL3_GET_RECORD:wrong version number:../deps/openssl/openssl/ssl/s3_pkt.c:362:
    //    ] code: 'EPROTO',
    //    errno: 'EPROTO',
    //    syscall: 'write' }
    //
    // As far as I can tell, this isn't patched yet, in Node or OpenSSL. But
    // setting the following options forces all connections to be negotiated
    // with TLS v1.0, effectively fixing the issue.
    //
    // More reading:
    //
    // https://github.com/aws/aws-sdk-js/issues/862
    // https://github.com/nodejs/node/issues/3692
    // https://www.ssllabs.com/ssltest/analyze.html?d=api.ebay.com
    agentOptions: {
      ciphers: 'ALL',
      secureProtocol: 'TLSv1_method',
    },
  }, options.reqOptions);

  debug('XML request options', options.reqOptions);
  timer('time to initiate request', Date.now() - _startTime);

  request.post(options.reqOptions, function(error, response) {

    debug('response', error ? {error: error} : {statusCode: response.statusCode, body: response.body});
    timer('time to response', Date.now() - _startTime);

    if (error) {
      return callback(error);
    }

    // this is tricky -- API should return 200 with body in every valid scenario,
    // so a non-200 probably means something's wrong on the client side with the request.
    // so expect an EbayClientError.
    if (response.statusCode !== 200) {
      return callback(new EbayClientError(
        util.format("Bad response status code", response.statusCode, (response.body ? response.body.toString() : null))
      ));
    }

    // raw XML wanted?
    if (options.raw) {
      return callback(null, response.body);
    }

    async.waterfall([
      // convert xml to json
      function _toJson(next) {
        options.xmlConverter(response.body, options, function(error, data) {
          if (error) return next(error);
          debug('Parsed XML', data);
          timer('time to parsed XML', Date.now() - _startTime);
          next(null, data);
        });
      },

      function _parseJson(data, next) {
        // will pass error if response includes an error message,
        // or if actually can't parse.
        // `options.parseDepth` is very important here.
        options.parser(data, options, next);
      }
    ],
    function _done(error, data) {
      timer('time to parsed JSON', Date.now() - _startTime);
      var extraErrorProps = {};

      if (error) {
        // as much context as possible for forensic debugging.
        // (includes `serviceName`, `reqOptions`, etc; not functions.)
        extraErrorProps.requestContext = _.omit(options, _.functions(options));
        extraErrorProps.requestContext.response = _.pick(response, ['statusCode', 'body']);

        if (/Ebay/i.test(error.name)) {
          // already differentiated into custom error classes.
          _.extend(error, extraErrorProps);
          callback(error, data);
        }
        else {
          // some other parsing error
          // @review - is the original stack trace lost here?
          error = new EbayClientError("Error parsing JSON: " + error.message, extraErrorProps);
          callback(error, data);
        }
      }
      else {
        callback(null, data);
      }
    });

  });
};
