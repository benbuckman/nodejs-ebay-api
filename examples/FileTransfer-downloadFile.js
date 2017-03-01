/**
 * example ebay API request to FileTransfer:downloadFile
 */

var ebay = require('../index.js');
var fs = require('fs');

ebay.xmlRequest({
  serviceName : 'FileTransfer',
  opType : 'downloadFile',

  // app/environment
  sandbox: true,

  // per user
  authToken: '...........',

  // in order to extract the zip from the response,
  // we need the raw binary data
  raw: true,
  reqOptions: {
    encoding: 'binary'
  },

  params: {
    'fileReferenceId': '1234',
    'taskReferenceId': '5678'
  }
}, function(error, data) {

    if (error) {
      // ...
    } else {
      // Get the zip data from the raw response
      var zip = parseResponseZip(data);

      // do something with the zip, e.g. save it into a file.
      fs.writeFile("/path/to/zip", zip, 'binary', function(err) {

      });
    }
});
