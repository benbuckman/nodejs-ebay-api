// a basic GetOrders request to the Trading API via XML-POST
// fill in keys from your eBay API account
// see http://developer.ebay.com/devzone/xml/docs/reference/ebay/GetOrders.html

var ebay = require('../index.js');

ebay.ebayApiPostXmlRequest({
  serviceName : 'Trading',
  opType : 'GetOrders',
  
  devName: '...........',
  cert: '...........',
  appName: '...........',
  
  sandbox: true,
  
  params: {
    'authToken': '...........',    // (very long string)
    'OrderStatus': 'Active',
    'NumberOfDays': 1
  }
  
}, function(error, results) {
  if (error) {
    console.dir(error);
    process.exit(1);
  }
  console.dir(results);
});