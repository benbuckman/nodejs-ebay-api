// eBay API client for Node.js

var _ = require('lodash');

module.exports = _.extend({},
  require('./lib/xml-request'),
  require('./lib/pagination'),
  require('./lib/xml-converter'),
  require('./lib/json-parser'),
  require('./lib/errors')
);
