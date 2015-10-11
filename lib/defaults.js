var
  _ = require('lodash'),
  debug = require('debug')('ebay:defaults');


/*
default params per service type.
@param {object} options: request context. see `xmlRequest()` docs, and code below.
*/
exports.getDefaultHeaders = function(options) {
  if (!options || !options.serviceName) throw new Error("Need serviceName for default params");

  switch (options.serviceName) {
    case 'Finding':
      return {
        'X-EBAY-SOA-SECURITY-APPNAME': options.appId ? options.appId : null,
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'XML',
        'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'XML',
        'X-EBAY-SOA-GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
        'X-EBAY-SOA-SERVICE-VERSION': options.version ? options.version : '1.13.0',
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
        'RESPONSE-DATA-FORMAT': 'XML',
        'REST-PAYLOAD': null     // (not sure what this does)
      };

    case 'Merchandising':
      return {
        'X-EBAY-SOA-SERVICE-NAME': 'MerchandisingService',
        'X-EBAY-SOA-OPERATION-NAME': options.opType,
        'EBAY-SOA-CONSUMER-ID': options.appId ? options.appId : null,
        'SERVICE-VERSION': options.version ? options.version : '1.5.0',
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'XML',
        //'RESPONSE-DATA-FORMAT': 'XML',
        //'REST-PAYLOAD': null     // (not sure what this does)
      };

    case 'Shopping':
      return {
        'X-EBAY-API-APP-ID': options.appId ? options.appId : null,
        'X-EBAY-API-CALL-NAME': options.opType,
        'X-EBAY-API-VERSION': options.version ? options.version : '897',
        'X-EBAY-API-SITE-ID': options.siteId ? options.siteId : '0', // US
        'X-EBAY-API-REQUEST-ENCODING': 'XML',
        'X-EBAY-API-RESPONSE-ENCODING': 'XML',
        'Content-Type': 'text/xml',
        //'Accept': 'text/xml'
      };

    case 'Trading':
      return {
        'X-EBAY-API-APP-NAME': options.appId,
        'X-EBAY-API-CALL-NAME': options.opType,
        'X-EBAY-API-COMPATIBILITY-LEVEL': options.version ? options.version : '775',
        'X-EBAY-API-SITEID': options.siteId ? options.siteId : '0', // US
        'X-EBAY-API-DEV-NAME': options.devId,
        'X-EBAY-API-CERT-NAME': options.certId,
      };
  }
};
