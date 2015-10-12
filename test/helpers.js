/**
 * test helpers. run once.
 */

module.exports = (function() {

  var chai = require('chai');
  global.expect = chai.expect;

  global.sinon = require('sinon');

  chai.use(require("sinon-chai"));

  beforeEach('sandbox', function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach('unstub', function() {
    this.sinon.restore();
  });

})();