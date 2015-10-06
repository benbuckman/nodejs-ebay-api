// example paginated request to FindingService:findItemsAdvanced
// (find some gadgets)

var ebay = require('../index.js');

var params = {
  categoryId: [ "47123", "14948" ],   // Electronics & Gadgets

  // include SellerInfo in response
  outputSelector: [ 'SellerInfo' ],

  //// for affiliate links (see https://www.x.com/developers/ebay/use-cases/affiliate-tracking)
  affiliate: {
    trackingID: '1234567890',    // CAMPAIGN ID
    networkId: '9',              // "If you are registered with eBay Partner Network, the networkId is 9"
    customId: '1'               // arbitrary, to differentiate sub-campaigns
  },

  itemFilter: [
    // (most of these can be 1 item or array of multiple items, depending on the service)
    {name: "ExcludeCategory", value: "14998"},          // no Vintage Electronics
    {name: "ListingType", value: "Auction"},

    // example of 2-part filter
    {name: 'MinPrice', value: '20', paramName: 'Currency', paramValue: 'USD'},
    {name: 'MaxPrice', value: '300', paramName: 'Currency', paramValue: 'USD'}
  ]
};


ebay.paginatedRequest({
    serviceName: 'Finding',
    opType: 'findItemsAdvanced',
    appId: '......................',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
    params: params,
    pages: 2,
    perPage: 3, // max 100x100 (10k items)
    parser: ebay.parseResponse
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
