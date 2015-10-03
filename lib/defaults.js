var
  _ = require('lodash'),
  debug = require('debug')('ebay:defaults');


// default params per service type.
// for GET requests these go into URL. for POST requests these go into headers.
// options differ by service, see below.
exports.getDefaultParams = function getDefaultParams(options) {
  options = options || {};

  return {
    'Finding': {
      'X-EBAY-SOA-SECURITY-APPNAME': options.appId ? options.appId : null,
      'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON',
      'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
      'X-EBAY-SOA-GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
      'X-EBAY-SOA-SERVICE-VERSION': options.version ? options.version : '1.11.0',
      'X-EBAY-SOA-OPERATION-NAME': options.opType
    },
    'Product': {
      'SERVICE-NAME': options.opType,
      'SECURITY-APPNAME': options.appId ? options.appId : null,
      // based on response data
      'SERVICE-VERSION': options.version ? options.version : '1.5.0',
      'OPERATION-NAME': options.opType,
      'GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': null     // (not sure what this does)
    },
    'MerchandisingService': {
      'SERVICE-NAME': options.serviceName,
      'CONSUMER-ID': options.appId ? options.appId : null,
      // based on response data
      'SERVICE-VERSION': options.version ? options.version : '1.5.0',
      'OPERATION-NAME': options.opType,
      'GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': null     // (not sure what this does)
    },
    'Shopping': {
      'X-EBAY-API-APP-ID': options.appId ? options.appId : null,
      'X-EBAY-API-VERSION': options.version ? options.version : '771',
      'X-EBAY-API-SITE-ID': options.siteId ? options.siteId : '0', // US
      'X-EBAY-API-REQUEST-ENCODING': 'JSON',
      'X-EBAY-API-RESPONSE-ENCODING': 'JSON',
      'X-EBAY-API-VERSIONHANDLING': 'LatestEnumValues',
      'X-EBAY-API-CALL-NAME': options.opType
    },
    'Trading': {
      'X-EBAY-API-COMPATIBILITY-LEVEL' : options.version ? options.version : '775',
      'X-EBAY-API-SITEID' : options.siteId ? options.siteId : '0', // US
      'X-EBAY-API-DEV-NAME': options.devName,
      'X-EBAY-API-CERT-NAME': options.cert,
      'X-EBAY-API-APP-NAME': options.appName,
      'X-EBAY-API-CALL-NAME': options.opType
    }
  }[options.serviceName];
};