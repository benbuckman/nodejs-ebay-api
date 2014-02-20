// eBay API client for Node.js

var requestModule = require('request'),
    _ = require('underscore'),
    util = require('util'),
    async = require('async');


// [internal] convert params hash to url string.
// some items may be arrays, use key(0)..(n)
// param usage:
//  - use null values for plain params
//  - use arrays for repeating keys
var buildUrlParams = function buildUrlParams(params) {
  var urlFilters = [];  // string parts to be joined
  
  // (force each to be string w/ ''+var)
  _(params).each(function(value, key) {
    if (value === null) urlFilters.push('' + key);
    else if (_.isArray(value)) {
      _(value).each(function(subValue, subInd) {
        urlFilters.push('' + key + '(' + subInd + ')' + "=" + subValue);
      });
    }
    else urlFilters.push( '' + key + "=" + value );
  });
  
  return urlFilters.join('&');
};



// [helper] constructor for an 'itemFilter' filter (used by the Finding Service)
module.exports.ItemFilter = function ItemFilter(name, value, paramName, paramValue) {
  // required
  this.name = name;
  this.value = value;
  
  // optional
  this.paramName = _.isUndefined(paramName) ? '' : paramName;
  this.paramValue = _.isUndefined(paramValue) ? '' : paramValue;
};



// [internal] convert a filters array to a url string
// adapted from client-side JS example in ebay docs
var buildFilters = function buildFilters(filterType, filters) {
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
};


// build URL to API endpoints
// set sandbox=true for sandbox, otherwise production
// - params is a 1D obj
// - filters is an obj of { filterType:[filters] } (where filters is an array of ItemFilter)
// params,filters only apply to GET requests; for POST pass in empty {} or null
var buildRequestUrl = function buildRequestUrl(serviceName, params, filters, sandbox) {
  var url;
  
  params = params || {};
  filters = filters || {};
  sandbox = (typeof sandbox === 'boolean') ? sandbox : false;
  
  switch (serviceName) {
    case 'FindingService':
      if (sandbox) {
        // url =   // @todo
        throw new Error("Sandbox endpoint for FindingService not yet implemented. Please add.");
      }
      else url = "https://svcs.ebay.com/services/search/" + serviceName + "/v1?";
      break;
      
    case 'Shopping':
      if (sandbox) {
        // url =   // @todo
        throw new Error("Sandbox endpoint for Shopping service not yet implemented. Please add.");
      }
      else url = "http://open.api.ebay.com/shopping?";
      break;
    
    
    case 'Trading':   // ...and the other XML APIs
      if (sandbox) url = 'https://api.sandbox.ebay.com/ws/api.dll';
      else url = 'https://api.ebay.com/ws/api.dll';
      
      // params and filters don't apply to URLs w/ these
      return url;
      // break;
    
    default:
      if (sandbox) {
        // url =   // @todo
        throw new Error("Sandbox endpoint for " + serviceName + " service not yet implemented. Please add.");
      }
      else url = "https://svcs.ebay.com/" + serviceName + '?';
  }

  url += buildUrlParams(params);     // no trailing &
  
  _(filters).each(function(typeFilters, type) {
    url += buildFilters(type, typeFilters);     // each has leading &
  });
  
  return url;
};
module.exports.buildRequestUrl = buildRequestUrl;



// build XML input for XML-POST requests
// params should include: authToken, ...
//
// handle nested elements w/ array wrapper around each obj.
// (quirk of XmlBuilder lib)
// e.g. 'Pagination': [ { 'EntriesPerPage': '100' } ]
//
// for repeatable fields, use an array value (see below)
//
var buildXmlInput = function buildXmlInput(opType, params) {
  var xmlBuilder = require('xml');
  
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
    
    _(values).each(function(value){
      var el = {};
      el[key] = value;
      top.push(el);      
    });
  });

  // console.log(util.inspect(data,true,10));
  data = [ data ];

  return '<?xml version="1.0" encoding="UTF-8"?>' + "\n" + xmlBuilder(data, true);
};


// default params per service type.
// for GET requests these go into URL. for POST requests these go into headers.
// options differ by service, see below.
var defaultParams = function defaultParams(options) {
  options = options || {};
  
  return {
    'FindingService': {
      'X-EBAY-SOA-SECURITY-APPNAME': options.appId ? options.appId : null,
      'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON',
      'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
      'X-EBAY-SOA-GLOBAL-ID': options.globalId ? options.globalId : 'EBAY-US',
      'X-EBAY-SOA-SERVICE-VERSION': options.version ? options.version : '1.11.0',
      'X-EBAY-SOA-OPERATION-NAME': options.opType
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



// make a single GET request to a JSON service
var ebayApiGetRequest = function ebayApiGetRequest(options, callback) {
  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));
  if (! options.appId) return callback(new Error("Missing appId"));

  options.params = options.params || {}; 
  options.filters = options.filters || {};
  options.reqOptions = options.reqOptions || {};
  options.parser = options.parser || parseItemsFromResponse;
  options.sandbox = options.sandbox || false;
  
  options.raw = options.raw || false;
  
  if (options.serviceName === 'MerchandisingService') {
    options.reqOptions.decoding = 'buffer';   // otherwise fails to decode json. doesn't seem to be necessary w/ FindingService.
  }
  
  // fill in default params. explicit options above will override defaults.
  _.defaults(options.params, defaultParams(options));
  
  var url = buildRequestUrl(options.serviceName, options.params, options.filters, options.sandbox);
  // console.log('url for', options.opType, 'request:\n', url.replace(/\&/g, '\n&'));
  
  var request = requestModule.get({'url':url, 'headers': options.reqOptions}, function(error, response, result) {
    var data;

    if (error) {
      error.message = "Completed with error: " + error.message;
    }
    else if (response.statusCode !== 200) {
      return callback(new Error(util.format("Bad response status code", response.statusCode, result.toString())));
    }
    else if (options.raw === true) {
      return callback(null, result.toString());
    }
    
    try {
      data = JSON.parse(result);
      
      // drill down to item(s). each service has its own structure.
      if (options.serviceName !== 'Shopping') {
        var responseKey = options.opType + 'Response';
        if (_.isUndefined(data[responseKey])) {
          return callback(new Error("Response missing " + responseKey + " element"));
        }
        data = data[responseKey];
      }

      if (_.isArray(data)) {
        data = _(data).first();
      }
      
      // 'ack' and 'errMsg' indicate errors.
      // - in FindingService it's nested, in Merchandising it's flat - flatten to normalize
      if (!_.isUndefined(data.ack)) data.ack = flatten(data.ack);
      else if (!_.isUndefined(data.Ack)) {      // uppercase, standardize.
        data.ack = flatten(data.Ack);
        delete data.Ack;
      }

      if (_.isUndefined(data.ack) || data.ack !== 'Success') {
        var errMsg = _.isUndefined(data.errorMessage) ? null : flatten(data.errorMessage);
        return callback(new Error(util.format("Bad 'ack' code", data.ack, 'errorMessage?', util.inspect(errMsg, true, 3))));
      }
    }
    catch(error) {
      return callback(error);
    }
    // console.log('completed successfully:\n', util.inspect(data, true, 10, true));
    
    // parse the response
    options.parser(data, function(error, items) {
      callback(error, items);
    });
  });

  
};
module.exports.ebayApiGetRequest = ebayApiGetRequest;



// make a single POST request to an XML service
var ebayApiPostXmlRequest = function ebayApiPostXmlRequest(options, callback) {
  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));
  
  
  // @see note in buildXmlInput() re: nested elements
  options.params = options.params || {};
  
  options.reqOptions = options.reqOptions || {};
  options.sandbox = options.sandbox || false;

  // options.parser = options.parser || ...;   // @todo
  
  // converts XML to JSON by default, but can also return raw XML
  options.rawXml = options.rawXml || false;

  
  // app/auth params go into headers (see defaultParams())
  options.reqOptions.headers = options.reqOptions.headers || {};
  _.defaults(options.reqOptions.headers, defaultParams(options));
  // console.dir(options);

  var url = buildRequestUrl(options.serviceName, {}, {}, options.sandbox);
  // console.log('URL:', url);
  
  options.reqOptions.data = buildXmlInput(options.opType, options.params);
  // console.log(options.reqOptions.data);
  
  var request = requestModule.post({'url': url, 'headers': options.reqOptions}, function(error, response, result) {
    if (result instanceof Error) {
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
      function toJson(next) {
        var xml2js = require('xml2js'),
            parser = new xml2js.Parser();
        
        parser.parseString(result, function parseXmlCallback(error, data) {
          if (error) {
            error.message = "Error parsing XML: " + error.message;
            return next(error);
          }
          next(null, data);
        });
      },
      

      function parseData(data, next) {
        //// @todo parse the response
        // options.parser(data, next);
        
        next(null, data);
      }
      
    ],
    function(error, data){
      if (error) return callback(error);
      callback(null, data);
    });
    
  });
};
module.exports.ebayApiPostXmlRequest = ebayApiPostXmlRequest;



// PAGINATE multiple GET/JSON requests in parallel (max 100 per page, 100 pages = 10k items)
var paginateGetRequest = function paginateGetRequest(options, callback) {
  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));
  if (! options.appId) return callback(new Error("Missing appId"));
  options.params = options.params || {};
  options.filters = options.filters || {};
  options.reqOptions = options.reqOptions || {};
  options.pages = options.pages || 2;
  options.perPage = options.perPage || 10;
  options.parser = options.parser || parseItemsFromResponse;
  
  console.log('Paginated request to', options.serviceName, 'for', options.pages, 'pages of', options.perPage, 'items each');
  
  var mergedItems = [],   // to be merged
      pageParams = [],
      p;
  
  if (!(_.isNumber(options.pages) && options.pages > 0)) return callback(new Error("Invalid number of pages requested", options.pages));
  
  // index is pageInd-1. can't start array from 1, it just fills in 0 with undefined.
  for(p = 0; p < options.pages; p++) {
    pageParams[p] = {
      'paginationInput.entriesPerPage': options.perPage,
      'paginationInput.pageNumber': p+1
    };
  }
  // console.log(pageParams.length, 'pages:', pageParams);
  
  // run pagination requests in parallel
  async.forEach(pageParams,
    function eachPage(thisPageParams, nextPage) {
      
      // merge the pagination params. new var to avoid confusing scope.
      var thisPageOptions = _.extend({}, options);
      thisPageOptions.params = _.extend({}, thisPageOptions.params, thisPageParams);

      console.log("Requesting page", thisPageOptions.params['paginationInput.pageNumber'], 'with', thisPageOptions.params['paginationInput.entriesPerPage'], 'items...');

      ebayApiGetRequest(thisPageOptions, function(error, items) {
        // console.log("Got response from page", thisPageOptions.params['paginationInput.pageNumber']);
        
        if (error) {
          error.message = "Error on page " + thisPageOptions.params['paginationInput.pageNumber'] + ": " + error.message;
          return nextPage(error);
        }

        if (!_.isArray(items)) {
          return nextPage(new Error("Parser did not return an array, returned a " + typeof items));
        }

        console.log('Got', items.length, 'items from page', thisPageOptions.params['paginationInput.pageNumber']);

        // console.log('have', mergedItems.length, 'previous items, adding', items.length, 'new items...');
        mergedItems = mergedItems.concat(items);
        // console.log('now have', mergedItems.length, 'merged items');

        nextPage(null);
      });
    },
    
    function pagesDone(error) {
      // console.log('pages are done');
      if (error) callback(error);
      else callback(null, mergedItems);
    }
  );  //forEach
  
};
module.exports.paginateGetRequest = paginateGetRequest;


// helper: RECURSIVELY turn 1-element arrays/objects into flat vars
// (different from _.flatten() which returns an array)
var flatten = function flatten(el, iter) {
  // sanity check
  if (_.isUndefined(iter)) var iter = 1;
  if (iter > 100) {
    console.error("recursion error, stop at", iter);
    return;
  }
  
  // flatten 1-item arrays
  if (_.isArray(el) && el.length === 1) {
    el = _.first(el);
  }
  
  // special value-pair structure in the ebay API: turn { @key:KEY, __value__:VALUE } into { KEY: VALUE }
  if (isValuePair(el)) {
    var values = _.values(el);
    // console.log('found special:', el);
    el = {};
    el[ values[0] ] = values[1];
    // console.log('handled special:', el);
  }
  
  // previous fix just creates an array of these. we want a clean key:val obj.
  // so, is this an array of special value-pairs?
  if (isArrayOfValuePairs(el)) {
    var fixEl = {};
    _(el).each(function(pair) {
      _.extend(fixEl, flatten(pair));   // fix each, combine
    });
    el = fixEl;
  }
  
  // flatten sub-elements
  if (_.isArray(el) || _.isObject(el)) {
    _.each(el, function(subEl, subInd) {
      el[subInd] = flatten(el[subInd], iter++);
    });    
  }
    
  return el;
};
module.exports.flatten = flatten;


// helper: identify a structure returned from the API:
// { @key:KEY, __value__:VALUE } => want to turn into { KEY: VALUE }
// (and array of these into single obj)
var isValuePair = function isValuePair(el) {
  if (_.isObject(el) && _.size(el) === 2) {
    var keys = _.keys(el);
    if (new RegExp(/^@/).test(keys[0]) && keys[1] === '__value__') {
      return true;
    }
  }
  return false;
};


// helper: find an array containing only special key-value pairs
// e.g. 'galleryURL' (makes it easier to handle in MongoDB)
var isArrayOfValuePairs = function isArrayOfValuePairs(el) {
  if (_.isArray(el)) {
    if (_.all(el, isValuePair)) return true;
  }
  return false;
};


// extract an array of items from responses. differs by query type.
// @todo build this out as more queries are added...
var parseItemsFromResponse = function parseItemsFromResponse(data, callback) {
  // console.log('parse data', data);
  
  var items = [];
  try {
    if (typeof data.Item !== 'undefined') {       // e.g. for Shopping::GetSingleItem
      items = [ data.Item ];    // preserve array for standardization (?)
    }
    
    else if (typeof data.searchResult !== 'undefined') {    // e.g. for FindingService
      // reduce in steps so successful-but-empty responses don't throw error
      if (!_.isEmpty(data.searchResult)) {
        data = _(data.searchResult).first();
        if (typeof data !== 'undefined') {
          if (typeof data.item !== 'undefined') {
            items = data.item;
          }
        }
      }
    }
    else if (typeof data.itemRecommendations !== 'undefined') {
      if (typeof data.itemRecommendations !== 'undefined') {
        if (typeof data.itemRecommendations.item !== 'undefined') {
          items = _.isArray(data.itemRecommendations.item) ? data.itemRecommendations.item : [];
        }
      }
    }

    // recursively flatten 1-level arrays and "@key:__VALUE__" pairs
    items = _(items).map(function(item) {
      return flatten(item);
    });
  }
  catch(error) {
    callback(error);
  }
  
  callback(null, items);
};
module.exports.parseItemsFromResponse = parseItemsFromResponse;



// check if an item URL is an affiliate URL
// non-affil URLs look like 'http://www.ebay.com...', affil URLs look like 'http://rover.ebay.com/rover...'
//  and have param &campid=TRACKINGID (campid=1234567890)
module.exports.checkAffiliateUrl = function checkAffiliateUrl(url) {
  var regexAffil = /http\:\/\/rover\.ebay\.com\/rover/,
      regexNonAffil = /http\:\/\/www\.ebay\.com/,
      regexCampaign = /campid=[0-9]{5}/;

  return (regexAffil.test(url) && !regexNonAffil.test(url) && regexCampaign.test(url));
};



// check the latest API versions (to update the code accordingly)
// callback gets hash of APIs:versions
module.exports.getLatestApiVersions = function getLatestApiVersions(options, callback) {
  var versionParser = function versionParser(data, callback) {
    callback(null, data.version);
  };
  
  var checkVersion = function checkVersion(serviceName, next) {
    console.log('checkVersion for', serviceName);
    ebayApiGetRequest({
      serviceName: serviceName,
      opType: 'getVersion',
      appId: options.appId,
      parser: versionParser
    },
    next);
  };
  
  async.series({
    'finding': async.apply(checkVersion, 'FindingService'),
    'merchandising': async.apply(checkVersion, 'MerchandisingService'),
    // 'shopping': async.apply(checkVersion, 'Shopping'),   // doesn't have this call!
    // 'trading': async.apply(checkVersion, 'Trading')     // doesn't have this call!
    
    // ... which others have it?
  },
  callback);
};
