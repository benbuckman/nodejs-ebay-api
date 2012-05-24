// example of GetSingleItem request to Shopping API.
// see http://developer.ebay.com/DevZone/shopping/docs/CallRef/GetSingleItem.html

var ebay = require('../index.js');

ebay.ebayApiGetRequest({
  'serviceName': 'Shopping',
  'opType': 'GetSingleItem',
  'appId': '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
  
  params: {
    'ItemId': '1234567890'      // FILL IN A REAL ItemID
  }
},
function(error, data) {
  if (error) throw error;
  console.dir(data);
});