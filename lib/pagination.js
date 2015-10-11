var
  _ = require('lodash'),
  debug = require('debug')('ebay:pagination'),
  //getRequest = require('./get-request').getRequest,
  parseResponseJson = require('./json-parser').parseResponseJson;


// PAGINATE multiple GET/JSON requests in parallel (max 100 per page, 100 pages = 10k items)
exports.paginatedRequest = function(options, callback) {
  throw new Error("TODO re-implement/refactor me!");

  //if (! options.serviceName) return callback(new Error("Missing serviceName"));
  //if (! options.opType) return callback(new Error("Missing opType"));
  //if (! options.appId) return callback(new Error("Missing appId"));
  //
  //options.params = options.params || {};
  //options.reqOptions = options.reqOptions || {};
  //options.pages = options.pages || 2;
  //options.perPage = options.perPage || 10;
  //options.parser = options.parser || parseResponseJson;
  //
  //debug('Paginated request to', options.serviceName, 'for', options.pages, 'pages of', options.perPage, 'items each');
  //
  //var mergedItems = [],   // to be merged
  //  pageParams = [],
  //  p;
  //
  //if (!(_.isNumber(options.pages) && options.pages > 0)) return callback(new Error("Invalid number of pages requested", options.pages));
  //
  //// index is pageInd-1. can't start array from 1, it just fills in 0 with undefined.
  //for (p = 0; p < options.pages; p++) {
  //  pageParams[p] = {
  //    'paginationInput.entriesPerPage': options.perPage,
  //    'paginationInput.pageNumber': p+1
  //  };
  //}
  //
  //debug(pageParams.length, 'pages:', pageParams);
  //
  //// run pagination requests in parallel
  //async.forEach(pageParams,
  //  function eachPage(thisPageParams, nextPage) {
  //
  //    // merge the pagination params. new var to avoid confusing scope.
  //    var thisPageOptions = _.extend({}, options);
  //    thisPageOptions.params = _.extend({}, thisPageOptions.params, thisPageParams);
  //
  //    debug("Requesting page", thisPageOptions.params['paginationInput.pageNumber'], 'with', thisPageOptions.params['paginationInput.entriesPerPage'], 'items...');
  //
  //    getRequest(thisPageOptions, function(error, items) {
  //      debug("Got response from page", thisPageOptions.params['paginationInput.pageNumber']);
  //
  //      if (error) {
  //        error.message = "Error on page " + thisPageOptions.params['paginationInput.pageNumber'] + ": " + error.message;
  //        return nextPage(error);
  //      }
  //
  //      if (!_.isArray(items)) {
  //        return nextPage(new Error("Parser did not return an array, returned a " + typeof items));
  //      }
  //
  //      debug('Got', items.length, 'items from page', thisPageOptions.params['paginationInput.pageNumber']);
  //
  //      debug('have', mergedItems.length, 'previous items, adding', items.length, 'new items...');
  //      mergedItems = mergedItems.concat(items);
  //      debug('now have', mergedItems.length, 'merged items');
  //
  //      nextPage(null);
  //    });
  //  },
  //  function(error) {
  //    debug('pagination complete', error, mergedItems);
  //    if (error) callback(error);
  //    else callback(null, mergedItems);
  //  }
  //);  //forEach
};
