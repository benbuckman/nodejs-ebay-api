// eBay API client for Node.js

var _ = require('lodash');

module.exports = _.extend({},
  require('./lib/xml-request'),
  require('./lib/pagination'),
  require('./lib/parser'),
  require('./lib/errors')
);