var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon');

chai.use(require("sinon-chai"));

var
  request = require('request'),
  xmlRequest = require('../index').xmlRequest;

describe('GET request to Shopping service', function() {
  beforeEach(function() {
    sinon.stub(request, 'get', function(options, callback) {
      process.nextTick(function() {
        callback(null, {statusCode: 200}, {});
      });
    });
  });

  afterEach(function() {
    request.get.restore();
  });

  describe('GetSingleItem', function() {
    beforeEach('build request', function() {
      xmlRequest({
        serviceName: 'Shopping',
        opType: 'GetSingleItem',
        sandbox: true,
        appId: 'ABCDEF',
        raw: true,  // no parsing
        params: {
          'ItemID': '123456'
        },
        reqOptions: {
          headers: {
            'X-Extra': 'um'
          }
        }
      }, function noop(){});
    });

    it('initiated request with expected parameters', function() {
      expect(request.get).to.have.been.calledOnce;

      expect(request.get.lastCall.args[0]).to.deep.equal({
        url: 'http://open.api.sandbox.ebay.com/shopping?',
        headers: {
          'X-EBAY-API-APP-ID': 'ABCDEF',
          'X-EBAY-API-CALL-NAME': 'GetSingleItem',
          'X-EBAY-API-VERSION': '897',
          'X-EBAY-API-SITE-ID': '0',
          'X-EBAY-API-REQUEST-ENCODING': 'XML',
          'X-EBAY-API-RESPONSE-ENCODING': 'XML',
          'X-Extra': 'um'
        },
        body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<GetSingleItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <ItemID>123456</ItemID>\n' +
        '</GetSingleItemRequest>'
      });
    })
  });

  describe('GetMultipleItems', function() {
    beforeEach('build request', function() {
      xmlRequest({
        serviceName: 'Shopping',
        opType: 'GetMultipleItems',
        sandbox: true,
        appId: 'ABCDEF',
        raw: true,  // no parsing
        params: {
          'ItemID': ['123456', '345678']
        }
      }, function noop(){});
    });

    it('handles multiple parameter values', function() {
      expect(request.get).to.have.been.calledOnce;

      expect(request.get.lastCall.args[0]).to.have.property('body',
       '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<GetMultipleItemsRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <ItemID>123456</ItemID>\n' +
        '    <ItemID>345678</ItemID>\n' +
        '</GetMultipleItemsRequest>'
      );
    })
  });

  describe.skip('nested params', function() {
    // @REVIEW does this need to be supported?

    beforeEach('build request', function() {
      xmlRequest({
        serviceName: 'Shopping',
        opType: 'SomeOp',
        appId: 'ABCDEF',
        raw: true,  // no parsing
        params: {
          'L1': {
            'L2': 'foo'
          }
        }
      }, function noop(){});
    });

    it('nests params in XML', function() {
      expect(request.get.lastCall.args[0]).to.have.property('body',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<SomeOpRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <L1>\n' +
        '        <L2>foo</L2>\n' +
        '    </L1>\n' +
        '</SomeOpRequest>'
      );
    })
  });







  // then try to hit an actual sandbox endpoint ...?
  // (can a sandbox key be hard-coded in this module?)

});