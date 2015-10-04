var
  _ = require('lodash'),
  debug = require('debug')('ebay:defaults');


/*
default params per service type.
for GET requests these go into URL. for POST requests these go into headers.
options differ by service, see below.

@option appId
@option opType
@option version

@option globalId  ?
@option siteId    ?

@option devName
@option cert

...
*/
exports.getDefaultParams = function(options) {
  if (!options || !options.serviceName) throw new Error("Need serviceName for default params");

  switch (options.serviceName) {
    case 'Finding':
      return {
        'X-EBAY-SOA-SECURITY-APPNAME': options.appId ? options.appId : null,
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON',
        'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
        'X-EBAY-SOA-GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
        'X-EBAY-SOA-SERVICE-VERSION': options.version ? options.version : '1.11.0',
        'X-EBAY-SOA-OPERATION-NAME': options.opType
      };

    case 'Product':
      return {
        'SERVICE-NAME': options.opType,
        'SECURITY-APPNAME': options.appId ? options.appId : null,
        // based on response data
        'SERVICE-VERSION': options.version ? options.version : '1.5.0',
        'OPERATION-NAME': options.opType,
        'GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': null     // (not sure what this does)
      };

    case 'MerchandisingService':
      return {
        'SERVICE-NAME': options.serviceName,
        'CONSUMER-ID': options.appId ? options.appId : null,
        // based on response data
        'SERVICE-VERSION': options.version ? options.version : '1.5.0',
        'OPERATION-NAME': options.opType,
        'GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': null     // (not sure what this does)
      };

    case 'Shopping':
      return {
        'X-EBAY-API-APP-ID': options.appId ? options.appId : null,
        'X-EBAY-API-CALL-NAME': options.opType,
        'X-EBAY-API-VERSION': options.version ? options.version : '771',
        'X-EBAY-API-SITE-ID': options.siteId ? options.siteId : '0', // US
        'X-EBAY-API-REQUEST-ENCODING': 'JSON',
        'X-EBAY-API-RESPONSE-ENCODING': 'JSON',
        'X-EBAY-API-VERSIONHANDLING': 'LatestEnumValues',
      };

    case 'Trading':
      return {
        'X-EBAY-API-APP-NAME': options.appId,
        'X-EBAY-API-CALL-NAME': options.opType,
        'X-EBAY-API-COMPATIBILITY-LEVEL': options.version ? options.version : '775',
        'X-EBAY-API-SITEID': options.siteId ? options.siteId : '0', // US
        'X-EBAY-API-DEV-NAME': options.devName,
        'X-EBAY-API-CERT-NAME': options.cert,
      };
  }
};