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

  switch (serviceName) {
    case 'Finding':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/services/search/FindingService/v1';
      else url = 'https://svcs.ebay.com/services/search/FindingService/v1';
      break;

    case 'Product':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/services/marketplacecatalog/' + serviceName + '/v1';
      else url = 'https://svcs.ebay.com/services/marketplacecatalog/' + serviceName + '/v1';
      break;

    case 'Shopping':
      if (options.sandbox) url = 'http://open.api.sandbox.ebay.com/shopping';
      else url = "https://open.api.ebay.com/shopping";
      break;

    case 'Trading':
      if (options.sandbox) url = 'https://api.sandbox.ebay.com/ws/api.dll';
      else url = 'https://api.ebay.com/ws/api.dll';
      break;

    case 'Merchandising':
      if (options.sandbox) url = 'http://svcs.sandbox.ebay.com/MerchandisingService';
      else url = "https://svcs.ebay.com/MerchandisingService";
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
