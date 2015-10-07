// eBay API client for Node.js

exports.xmlRequest = require('./lib/xml-request').xmlRequest;

exports.paginatedRequest = require('./lib/pagination').paginatedRequest;

var parser = require('./lib/parser');
exports.parseResponse = parser.parseResponse;
exports.flatten = parser.flatten;