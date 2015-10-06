/**
 * example ebay API request to Merchandising:getMostWatchedItems
 */

var ebay = require('../index.js');

ebay.xmlRequest({
  'serviceName': 'Merchandising',
  'opType': 'getMostWatchedItems',
  'appId': '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI

  params: {}
},
function(error, data) {
  // ...
});