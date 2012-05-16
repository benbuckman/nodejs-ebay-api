// example paginated request to FindingService:findItemsAdvanced
// (find some gadgets)

var ebay = require('../index.js');

var params = {};

params.categoryId = [ "47123", "14948" ];   // Electronics & Gadgets

// include SellerInfo in response
params.outputSelector = [ 'SellerInfo' ];

//// for affiliate links (see https://www.x.com/developers/ebay/use-cases/affiliate-tracking)
// params['affiliate.trackingId'] = '1234567890';    // CAMPAIGN ID
// params['affiliate.networkId'] = '9';    // "If you are registered with eBay Partner Network, the networkId is 9"
// params['affiliate.customId'] = '1';     // arbitrary, to differentiate sub-campaigns

var filters = {};

filters.itemFilter = [
  // (most of these can be 1 item or array of multiple items, depending on the service)
  new ebay.ItemFilter("ExcludeCategory", ["14998"]),          // no Vintage Electronics
  // new ebay.ItemFilter("ExcludeSeller", ["somebadseller"]),
  new ebay.ItemFilter("ListingType", ["Auction"]),
  
  new ebay.ItemFilter('MinPrice', '20', 'Currency', 'USD'),
  new ebay.ItemFilter('MaxPrice', '300', 'Currency', 'USD'),  // example of 2-part filter  
];

// run it (paginated)
var pages = 2,
    perPage = 3;     // max 100x100 (10k items)

ebay.paginateGetRequest({
    serviceName: 'FindingService',
    opType: 'findItemsAdvanced',
    appId: '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
    params: params,
    filters: filters,
    pages: pages,
    perPage: perPage,
    parser: ebay.parseItemsFromResponse
  },
  // gets all the items together in a merged array
  function allItemsCallback(error, items) {
    if (error) throw error;
    
    console.log('Found', items.length, 'items from', pages, 'pages');
    
    for (var i = 0; i < items.length; i++) {
      console.log('- ' + items[i].title);
    }  
  }
);
