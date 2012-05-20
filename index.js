// eBay API client for Node.js

var restler = require('restler'),
    _ = require('underscore'),
    util = require('util'),
    async = require('async');


// [internal] convert params hash to url string.
// some items may be arrays, use key(0)..(n)
// param usage:
//  - use null values for plain params
//  - use arrays for repeating keys
var buildParams = function(params) {
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
module.exports.ItemFilter = function(name, value, paramName, paramValue) {
  // required
  this.name = name;
  this.value = value;
  
  // optional
  this.paramName = _.isUndefined(paramName) ? '' : paramName;
  this.paramValue = _.isUndefined(paramValue) ? '' : paramValue;
};



// [internal] convert a filters array to a url string
// adapted from client-side JS example in ebay docs
var buildFilters = function(filterType, filters) {
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


// build URL to PRODUCTION endpoint of GET APIs
// - params is a 1D obj
// - filters is an obj of { filterType:[filters] } (where filters is an array of ItemFilter)
var buildRequestUrl = function(serviceName, params, filters) {  
  var url;
  
  if (serviceName === 'FindingService') {
    url = "https://svcs.ebay.com/services/search/" + serviceName + "/v1?";
  }
  else {
    url = "https://svcs.ebay.com/" + serviceName + '?';
  }

  url += buildParams(params);     // no trailing &
  
  _(filters).each(function(typeFilters, type) {
    url += buildFilters(type, typeFilters);     // each has leading &
  });
  
  return url;
};
module.exports.buildRequestUrl = buildRequestUrl;



// default params per service type
var defaultParams = function(serviceName, opType, appId) {
  var params = {
    'OPERATION-NAME': opType,
    'GLOBAL-ID': 'EBAY-US',
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': null     // (not sure what this does)
  };
  
  switch (serviceName) {
    case 'FindingService':
      _.extend(params, {
        'SECURITY-APPNAME': appId,
        'SERVICE-VERSION': '1.11.0'
      });
      break;
      
    case 'MerchandisingService':
      _.extend(params, {
        'SERVICE-NAME': serviceName,
        'CONSUMER-ID': appId,
        'SERVICE-VERSION': '1.5.0'   // based on response data
      });
      break;
  }
  
  return params;
};



// make a single GET request to a service
var ebayApiGetRequest = function(options, callback) {
  if (! options.serviceName) return callback(new Error("Missing serviceName"));
  if (! options.opType) return callback(new Error("Missing opType"));
  if (! options.appId) return callback(new Error("Missing appId"));
  options.params = options.params || {}; 
  options.filters = options.filters || {};
  options.reqOptions = options.reqOptions || {};
  options.parser = options.parser || parseItemsFromResponse;
    
  if (options.serviceName === 'MerchandisingService') {
    options.reqOptions.decoding = 'buffer';   // otherwise fails to decode json. doesn't seem to be necessary w/ FindingService.
  }
  
  _.defaults(options.params, defaultParams(options.serviceName, options.opType, options.appId));
  
  var url = buildRequestUrl(options.serviceName, options.params, options.filters);
  // console.log('url for', options.opType, 'request:\n', url.replace(/\&/g, '\n&'));
  
  var request = restler.get(url, options.reqOptions);
  var data;

  // emitted when the request has finished whether it was successful or not
  request.on('complete', function(result, response) {
    // [restler docs] 'If some error has occurred, result is always instance of Error'
    if (result instanceof Error) {
      var error = result;
      error.message = "Completed with error: " + error.message;
      return callback(error);
    }
    else if (response.statusCode !== 200) {
      return callback(new Error(util.format("Bad response status code", response.statusCode, result)));
    }

    try {
      data = JSON.parse(result);
      
      // reduce
      var responseKey = options.opType + 'Response';
      if (_.isUndefined(data[responseKey])) {
        return callback(new Error("Response missing " + responseKey + " element"));
      }
      data = data[responseKey];

      if (_.isArray(data)) {
        data = _(data).first();
      }
      
      // 'ack' and 'errMsg' indicate errors.
      // - in FindingService it's nested, in Merchandising it's flat - flatten to normalize
      if (!_.isUndefined(data.ack)) data.ack = flatten(data.ack);
      
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


  // emitted when some errors have occurred
  // either this OR 'completed' should fire
  request.on('error', function(error, response) {
    error.message = "Request error: " + error.message;
    callback(error);
  });

  // emitted when the request was successful
  // -- overlaps w/ 'completed', don't use
  // request.on('success', function(data, response) {
  // });

  // emitted when the request was successful, but 4xx status code returned
  // -- overlaps w/ 'completed', don't use
  // request.on('fail', function(data, response) {
  // });
  
};
module.exports.ebayApiGetRequest = ebayApiGetRequest;



// PAGINATE multiple requests in parallel (max 100 per page, 100 pages = 10k items)
var paginateGetRequest = function(options, callback) {
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
var flatten = function(el, iter) {
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
var isValuePair = function(el) {
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
var isArrayOfValuePairs = function(el) {
  if (_.isArray(el)) {
    if (_.all(el, isValuePair)) return true;
  }
  return false;
};


// extract an array of items from responses. differs by query type.
// @todo build this out as more queries are added...
var parseItemsFromResponse = function(data, callback) {
  // console.log('parse data', data);
  
  var items = [];
  try {
    if (data.searchResult) {
      // reduce in steps so successful but empty responses don't throw error
      data = !_.isEmpty(data.searchResult) ? _(data.searchResult).first() : null;
      items = (data && data.item) || [];      // e.g. for FindingService
    }
    else if (data.itemRecommendations.item) {
      items = data.itemRecommendations.item || [];          // e.g. for getMostWatched
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
module.exports.checkAffiliateUrl = function(url) {
  var regexAffil = /http\:\/\/rover\.ebay\.com\/rover/,
      regexNonAffil = /http\:\/\/www\.ebay\.com/,
      regexCampaign = /campid=[0-9]{5}/;

  return (regexAffil.test(url) && !regexNonAffil.test(url) && regexCampaign.test(url));
};

