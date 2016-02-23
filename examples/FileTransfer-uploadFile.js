/**
 * example ebay API request to FileTransfer:uploadFile
 */

var ebay = require('../index.js');
var fs = require('fs');

// a zip file with an xml file containing the updates/inserts
// see http://developer.ebay.com/DevZone/large-merchant-services/Concepts/LMS_APIGuide.html
var zipFile = fs.readFileSync('./file.zip');

ebay.xmlRequest({
  serviceName : 'FileTransfer',
  opType : 'uploadFile',

  // app/environment
  sandbox: true,

  // per user
  authToken: '...........',

  params: {
    'fileAttachment': {
      'Data': zipFile.toString('base64'),
      'Size': zipFile.length,
    },
    'fileFormat': 'zip',
    'fileReferenceId': '1234',
    'taskReferenceId': '5678'
  }
}, function(error, results) {
  // ...
});
