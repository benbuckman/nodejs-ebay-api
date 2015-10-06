var
  _ = require('lodash'),
  debug = require('debug')('ebay:urls');


// [internal] convert a filters array to a url string
// adapted from client-side JS example in ebay docs
function buildFilters(filterType, filters) {
  var urlFilter = '';
  _(filters).each(function eachItemFilter(filter, filterInd) {
    // each parameter in each item filter
    _(filter).each(function eachItemParam(paramVal, paramKey) {
      // Check to see if the paramter has a value (some don't)
      if (paramVal !== "") {
        // multi-value param
        if (_.isArray(paramVal)) {
          _(paramVal).each(function eachSubFilter(paramSubVal, paramSubIndex) {
            urlFilter += '&' + filterType + '(' + filterInd + ').' + paramKey + '(' + paramSubIndex + ')=' + paramSubVal;
          });
        }
        // single-value param
        else {
          urlFilter += '&' + filterType + '(' + filterInd + ').' + paramKey + '=' + paramVal;
        }
      }
    });
  });
  return urlFilter;
}


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

  // @TODO remove??
  _(options.filters).each(function(typeFilters, type) {
    url += buildFilters(type, typeFilters);     // each has leading &
  });

  return url;
};
