var
  _ = require('lodash'),
  debug = require('debug')('ebay:versions');
  //getRequest = require('./get-request').getRequest;


// check the latest API versions (to update the code accordingly)
// callback gets hash of APIs:versions
exports.getLatestApiVersions = function(options, callback) {
  throw new Error("TODO re-implement/refactor me!");

  //var checkVersion = function(serviceName, next) {
  //  debug('checkVersion for', serviceName);
  //
  //  getRequest({
  //    serviceName: serviceName,
  //    opType: 'getVersion',
  //    appId: options.appId,
  //    parser: function versionParser(data, callback) {
  //      callback(null, data.version);
  //    }
  //  },
  //  next);
  //};
  //
  //async.series({
  //    'finding': async.apply(checkVersion, 'Finding'),
  //    'merchandising': async.apply(checkVersion, 'Merchandising'),
  //    // 'shopping': async.apply(checkVersion, 'Shopping'),   // doesn't have this call!
  //    // 'trading': async.apply(checkVersion, 'Trading')     // doesn't have this call!
  //
  //    // ... which others have it?
  //  },
  //  callback);
};
