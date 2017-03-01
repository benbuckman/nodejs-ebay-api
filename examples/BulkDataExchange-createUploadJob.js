/**
 * example ebay API request to BulkDataExchange:createUploadJob
 */

var ebay = require('../index.js');

ebay.xmlRequest({
  serviceName : 'BulkDataExchange',
  opType : 'createUploadJob',

  // app/environment
  sandbox: true,

  // per user
  authToken: '...........',

  params: {
    'fileType': 'XML',
    'uploadJobType': 'AddFixedPriceItem',
    'UUID': '1234'
  }
}, function(error, results) {
  // ...
});
