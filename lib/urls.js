var
  _ = require('lodash'),
  debug = require('debug')('ebay:urls');


// [internal] convert params hash to url string.
// some items may be arrays, use key(0)..(n)
// param usage:
//  - use null values for plain params
//  - use arrays for repeating keys
function buildUrlParams(obj, prefix) {
  var i, k, keys, str, _fn, _i, _j, _len, _len1;
  str = [];
  if (typeof prefix === "undefined") {
    prefix = "";
  }
  if (obj === null) { return prefix; }

  if (obj.constructor.toString().match(/^function\sarray/i)) {
    _fn = function(o) {
      return str.push(buildUrlParams(o, prefix + "(" + i + ")"));
    };
    for (i = _i = 0, _len = obj.length; _i < _len; i = ++_i) {
      k = obj[i];
      _fn(k);
    }
  } else if (obj.constructor.toString().match(/^function\sobject/i)) {
    if (prefix !== "") {
      prefix += ".";
    }
    keys = Object.keys(obj);
    for (i = _j = 0, _len1 = keys.length; _j < _len1; i = ++_j) {
      k = keys[i];
      str.push(buildUrlParams(obj[k], prefix + k));
    }
  } else {
    str.push(prefix + "=" + obj);
    debug(prefix + " = " + obj);
  }
  return str.join("&");
}


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
build URL to API endpoints
set sandbox=true for sandbox, otherwise production
- params is a 1D obj
- filters is an obj of { filterType:[filters] } (where filters is an array of ItemFilter)
params,filters only apply to GET requests; for POST pass in empty {} or null

@TODO does this need `params` or `filters` anymore? -- if everything is XML??
*/
exports.buildRequestUrl = function(serviceName, params, filters, sandbox) {
  var url;

  params = params || {};
  filters = filters || {};
  sandbox = (typeof sandbox === 'boolean') ? sandbox : false;

  switch (serviceName) {
    case 'Finding':
      if (sandbox) {
        throw new Error("There is no sandbox environment for the FindingService.");
      }
      else url = "https://svcs.ebay.com/services/search/FindingService/v1?";
      break;

    case 'Product':
      if (sandbox) url = "http://svcs.sandbox.ebay.com/services/marketplacecatalog/" + serviceName + "/v1?";
      else url = "http://svcs.ebay.com/services/marketplacecatalog/" + serviceName + "/v1?";
      break;

    case 'Shopping':
      if (sandbox) url = 'http://open.api.sandbox.ebay.com/shopping?';
      else url = "https://open.api.ebay.com/shopping?";
      break;


    case 'Trading':   // ...and the other XML APIs
      if (sandbox) url = 'https://api.sandbox.ebay.com/ws/api.dll';
      else url = 'https://api.ebay.com/ws/api.dll';

      // params and filters don't apply to URLs w/ these
      return url;
    // break;

    default:
      if (sandbox) {
        throw new Error("Sandbox endpoint for " + serviceName + " service not yet implemented. Please add.");
      }
      else url = "https://svcs.ebay.com/" + serviceName + 'Service?';
  }

  url += buildUrlParams(params);     // no trailing &

  _(filters).each(function(typeFilters, type) {
    url += buildFilters(type, typeFilters);     // each has leading &
  });

  return url;
};
