// eBay API client for Node.js

exports.xmlRequest = require('./lib/xml-request').xmlRequest;

exports.paginatedRequest = require('./lib/pagination').paginatedRequest;

exports.parseResponse = require('./lib/parser').parseResponse;