var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon');

chai.use(require("sinon-chai"));

var
  request = require('request'),
  xmlRequest = require('../index').xmlRequest;

describe('XML requests', function() {
  beforeEach(function() {
    sinon.stub(request, 'post', function(options, callback) {
      process.nextTick(function() {
        callback(null, {statusCode: 200}, {});
      });
    });
  });

  afterEach(function() {
    request.post.restore();
  });

  describe('Shopping: GetSingleItem', function() {
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
      expect(request.post).to.have.been.calledOnce;

      expect(request.post.lastCall.args[0]).to.deep.equal({
        url: 'http://open.api.sandbox.ebay.com/shopping?',
        headers: {
          'Content-Type': 'text/xml',
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

  describe('Shopping: GetMultipleItems', function() {
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
      expect(request.post).to.have.been.calledOnce;

      expect(request.post.lastCall.args[0]).to.have.property('body',
       '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<GetMultipleItemsRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <ItemID>123456</ItemID>\n' +
        '    <ItemID>345678</ItemID>\n' +
        '</GetMultipleItemsRequest>'
      );
    })
  });


  describe('Trading: GetOrders (authenticated)', function() {
    beforeEach('build request', function() {
      xmlRequest({
        serviceName: 'Trading',
        opType: 'GetOrders',
        sandbox: true,
        appId: 'ABCDEF',
        authToken: 'super-secret',
        raw: true,  // no parsing
        params: {
          'NumberOfDays': '30'
        }
      }, function noop(){});
    });

    it('adds token to XML request', function() {
      expect(request.post.lastCall.args[0]).to.have.property('body',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <RequesterCredentials>\n' +
        '        <eBayAuthToken>super-secret</eBayAuthToken>\n' +
        '    </RequesterCredentials>\n' +
        '    <NumberOfDays>30</NumberOfDays>\n' +
        '</GetOrdersRequest>'
      );
    });
  });


  describe('nested params', function() {
    beforeEach('build request', function() {
      xmlRequest({
        serviceName: 'Trading',
        opType: 'GetOrderTransactions',
        appId: 'ABCDEF',
        raw: true,  // no parsing
        params: {
          'ItemTransactionIDArray': [{
            'ItemTransactionID': {
              'OrderLineItemID': '12345-67890'
            }
          }]
        }
      }, function noop(){});
    });

    it('converts properly to nested XML', function() {
      expect(request.post.lastCall.args[0]).to.have.property('body',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<GetOrderTransactionsRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
        '    <ItemTransactionIDArray>\n' +
        '        <ItemTransactionID>\n' +
        '            <OrderLineItemID>12345-67890</OrderLineItemID>\n' +
        '        </ItemTransactionID>\n' +
        '    </ItemTransactionIDArray>\n' +
        '</GetOrderTransactionsRequest>'
      );
    })
  });
});


// @TODO try to hit an actual sandbox endpoint ...?
// (can a sandbox key be hard-coded in this module?)


describe('`_deepToArray`', function() {
  var _deepToArray = require('../lib/xml-request')._deepToArray;

  it('converts everything to an array', function() {
    expect(_deepToArray({
      'Thing': {
        'Has': {
          'Weird': 'Structure'
        }
      },
      'Things': [
        {'foo': 'bar'}
      ],
      'More': 'Things',
      'Finally': ['Thing1', 'Thing2']
    }))
    .to.deep.equal({
      'Thing': [{
        'Has': [{
          'Weird': ['Structure']
        }]
      }],
      'Things': [
        {'foo': ['bar']}
      ],
      'More': ['Things'],
      'Finally': ['Thing1', 'Thing2']
    });
  });

});