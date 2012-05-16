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



var ebayApiGetRequest = function(serviceName, opType, appId, params, filters, callback) {
  var reqOptions = {
    // headers: {},
  };
  
  if (serviceName === 'MerchandisingService') {
    reqOptions.decoding = 'buffer';   // otherwise fails to decode json. doesn't seem to be necessary w/ FindingService.
  }
  
  _.defaults(params, defaultParams(serviceName, opType, appId));
  
  var url = buildRequestUrl(serviceName, params, filters);
  // console.log('url for', opType, 'request:\n', url.replace(/\&/g, '\n&'));
  
  
  var request = restler.get(url, reqOptions);
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
      return callback(new Error(util.format("Bad response status code", response.statusCode)));
    }

    try {
      data = JSON.parse(result);
      // console.log('Data:', data);
      
      // reduce
      var responseKey = opType + 'Response';
      if (_.isUndefined(data[responseKey])) {
        return callback(new Error("Response missing " + responseKey + " element"));
      }
      data = data[responseKey];
      
      if (_.isArray(data)) {
        // console.log('Data is an array of', data.length, 'element(s). Taking 1st');
        data = _(data).first();
      }
      // console.log(data);
      
      // 'ack' and 'errMsg' indicate errors.
      // - in FindingService it's nested, in Merchandising it's flat - flatten to normalize
      if (!_.isUndefined(data.ack)) data.ack = flatten(data.ack);
      
      if (_.isUndefined(data.ack) || data.ack !== 'Success') {
        var errMsg = _.isUndefined(data.errorMessage) ? null : flatten(data.errorMessage);
        // (errMsg.error[0].message[0] is the message)
        return callback(new Error(util.format("Bad 'ack' code", data.ack, 'errorMessage?', util.inspect(errMsg, true, 3))));
      }
    }
    catch(error) {
      return callback(error);
    }
    // console.log('completed successfully:\n', util.inspect(data, true, 10, true));
    
    callback(null, data);
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
var paginateGetRequest = function(serviceName, opType, appId, params, filters, pages, perPage, parserFunc, finalCallback) {
  console.log('Paginated request to', serviceName, 'for', pages, 'pages of', perPage, 'items each');
  
  var mergedItems = [],   // to be merged
      pageParams = [],
      p;
  
  if (!(_.isNumber(pages) && pages > 0)) return finalCallback(new Error("Invalid number of pages requested", pages));
  
  // index is pageInd-1. can't start array from 1, it just fills in 0 with undefined.
  for(p = 0; p < pages; p++) {
    pageParams[p] = {
      'paginationInput.entriesPerPage': perPage,
      'paginationInput.pageNumber': p+1
    };
  }
  // console.log(pageParams.length, 'pages:', pageParams);
  
  // run pagination requests in parallel
  async.forEach(pageParams,
    function eachPage(page, nextPage) {
      
      // merge the pagination params. new var to avoid confusing scope.
      var thisPageParams = _.extend({}, params, page);
      // console.log('params for request:', params);

      console.log("Requesting page", thisPageParams['paginationInput.pageNumber'], 'with', thisPageParams['paginationInput.entriesPerPage'], 'items...');

      ebayApiGetRequest(serviceName, opType, appId, thisPageParams, filters, function(error, response) {
        // console.log("Got response from page", thisPageParams['paginationInput.pageNumber']);
        
        if (error) {
          error.message = "Error on page " + thisPageParams['paginationInput.pageNumber'] + ": " + error.message;
          return nextPage(error);
        }

        parserFunc(response, function(error, items) {
          if (error) return nextPage(error);

          console.log('Got', items.length, 'items from page', thisPageParams['paginationInput.pageNumber']);

          // console.log('have', mergedItems.length, 'previous items, adding', items.length, 'new items...');
          mergedItems = mergedItems.concat(items);
          // console.log('now have', mergedItems.length, 'merged items');

          nextPage(null);
        });
      });
    },
    
    function pagesDone(error) {
      // console.log('pages are done');
      if (error) finalCallback(error);
      else finalCallback(null, mergedItems);
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


// parse json data from FindingService. callback gets array of items.
module.exports.parseFindingServiceResponse = function(data, callback) {
  var items = _(data.searchResult).first().item || [];

  // note: _map returns numeric keys. in this case it's already that way.
  items = _(items).map( function reduceItems(item, itemInd) {
    // recursively flatten 1-level arrays and "@key:__VALUE__" pairs
    return flatten(item);
  });
  
  callback(null, items);

}; //parseFindingServiceResponse



// parse json data from MerchandisingService. callback gets array of items.
// stopOnError should be boolean, if true runs callback(error) on any error, otherwise passes empty items
module.exports.parseMerchandisingServiceResponse = function(data, callback) {
  // console.log('parsing', util.inspect(data, false, 10, true));
  var items;
  try {
    // @todo this is what getMostWatchedItems returns, what about others?
    items = data.itemRecommendations.item;
  }
  catch(error) {
    // @todo this is probably benign if 'ack' passed earlier test... good to return as error?
    error.message = util.format("Missing itemRecommendations. ", error.message, "in:", util.inspect(data,false,3));
    return callback(error);
  }
  
  callback(null, items);
};
