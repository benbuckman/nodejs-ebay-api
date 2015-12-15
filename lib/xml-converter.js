/**
 * convert XML from responses to JSON,
 * to be parsed as JSON.
 */

var
  debug = require('debug')('ebay:xml-converter'),
  xml2js = require('xml2js'),
  EbayClientError = require('./errors').EbayClientError;


exports.convertXmlToJson = function(xmlBody, options, callback) {
  var xmlParser = new xml2js.Parser();
  xmlParser.parseString(xmlBody, function(error, data) {
    if (error) {
      debug(error);
      return callback(new EbayClientError("Error parsing XML: " + error.message));
    }
    callback(null, data);
  });
};
