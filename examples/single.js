// example simple request to FindingService:findItemsByKeywords

var ebay = require('../index.js');

var params = {};

params.keywords = [ "Canon", "Powershot" ];

// add additional fields
params.outputSelector = [ 'AspectHistogram' ];

params['paginationInput.entriesPerPage'] = 10;


var filters = {};

filters.itemFilter = [
  new ebay.ItemFilter("FreeShippingOnly", true)
];

filters.domainFilter = [
  new ebay.ItemFilter("domainName", "Digital_Cameras")
];


ebay.ebayApiGetRequest({
    serviceName: 'FindingService',
    opType: 'findItemsByKeywords',
    appId: '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
    params: params,
    filters: filters,
    parser: ebay.parseItemsFromResponse    // (default)
  },
  // gets all the items together in a merged array
  function itemsCallback(error, items) {
    if (error) throw error;
    
    console.log('Found', items.length, 'items');
    
    for (var i = 0; i < items.length; i++) {
      console.log('- ' + items[i].title);
    }  
  }
);
