/**
 * example ebay API request to Shopping:GetSingleItem
 */

var ebay = require('../index.js');

ebay.xmlRequest({
  'serviceName': 'Shopping',
  'opType': 'GetSingleItem',
  'appId': '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
  
  params: {
    'ItemId': '1234567890'      // FILL IN A REAL ItemID
  }
},
function(error, data) {
  // ...
});