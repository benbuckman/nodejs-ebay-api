var
  _ = require('lodash'),
  debug = require('debug')('ebay:urls');


/*
build URL to API endpoints.
@param options: request context (see
*/
exports.buildRequestUrl = function(options) {
  var url;

  options = options || {};

  var serviceName = options.serviceName.replace(/Service$/, '');

  // note: sandboxes do not all support SSL.

  switch (serviceName) {
    case 'Finding':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/services/search/FindingService/v1';
      else url = 'http://svcs.ebay.com/services/search/FindingService/v1';     // no HTTPS support, really?!
      break;

    case 'Product':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/services/marketplacecatalog/' + serviceName + '/v1';
      else url = 'http://svcs.ebay.com/services/marketplacecatalog/' + serviceName + '/v1';  // no HTTPS support, really?!
      break;

    case 'Shopping':
      if (options.sandbox) url = 'http://open.api.sandbox.ebay.com/shopping';
      else url = "http://open.api.ebay.com/shopping";     // no HTTPS support, really?!
      break;

    case 'Trading':
      if (options.sandbox) url = 'https://api.sandbox.ebay.com/ws/api.dll';
      else url = 'https://api.ebay.com/ws/api.dll';
      break;

    case 'Merchandising':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/MerchandisingService';
      else url = "https://svcs.ebay.com/MerchandisingService";
      break;

    // this is not a real service, it's more of a meta-service. the name is made up here.
    // it's also not really an API - it's used for HTML consent pages -
    // but other URLs for eBay's systems are here, so including this here too.
    // @see http://developer.ebay.com/devzone/guides/ebayfeatures/Basics/Tokens-MultipleUsers.html
    case 'Signin':
      if (options.sandbox) url = 'https://signin.sandbox.ebay.com/ws/eBayISAPI.dll';
      else url = 'https://signin.ebay.com/ws/eBayISAPI.dll';
      break;

    default:
      if (options.sandbox) {
        throw new Error("Sandbox endpoint for " + serviceName + " service not yet implemented. Please add.");
      }
      else url = "https://svcs.ebay.com/" + serviceName + 'Service?';
  }

  // [removed URL params - all XML based now. if need to bring back, look in git history.]

  return url;
};
