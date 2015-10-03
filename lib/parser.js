var _ = require('lodash');

// extract an array of items from responses. differs by query type.
// @todo build this out as more queries are added...
exports.parseItemsFromResponse = function parseItemsFromResponse(data, callback) {
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
