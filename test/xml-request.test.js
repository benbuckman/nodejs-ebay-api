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
        url: 'http://open.api.sandbox.ebay.com/shopping',
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


  describe('Finding: findItemsByKeywords', function() {
    beforeEach('build request', function () {
      xmlRequest({
        serviceName: 'Finding',
        opType: 'findItemsByKeywords',
        sandbox: true,
        appId: 'ABCDEF',
        raw: true,  // no parsing
        params: {
          keywords: ['Canon', 'Powershot'],
          outputSelector: ['AspectHistogram'],
          itemFilter: [
            {name: 'FreeShippingOnly', value: 'true'},
            {name: 'MaxPrice', value: '150'},
          ],
          domainFilter: [
            {name: 'domainName', value: 'Digital_Cameras'}
          ],
          paginationInput: {
            entriesPerPage: '5'
          }
        }
      }, function noop() {
      });
    });

    it('initiated request with expected parameters', function() {
      expect(request.post).to.have.been.calledOnce;

      expect(request.post.lastCall.args[0]).to.deep.equal({
        url: 'http://svcs.sandbox.ebay.com/services/search/FindingService/v1',
        headers: {
          'X-EBAY-SOA-SECURITY-APPNAME': 'ABCDEF',
          'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'XML',
          'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'XML',
          'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
          'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
          'X-EBAY-SOA-OPERATION-NAME': 'findItemsByKeywords'
        },
        body:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<findItemsByKeywordsRequest xmlns="http://www.ebay.com/marketplace/search/v1/services">\n' +
          '    <keywords>Canon</keywords>\n' +
          '    <keywords>Powershot</keywords>\n' +
          '    <outputSelector>AspectHistogram</outputSelector>\n' +
          '    <itemFilter>\n' +
          '        <name>FreeShippingOnly</name>\n' +
          '        <value>true</value>\n' +
          '    </itemFilter>\n' +
          '    <itemFilter>\n' +
          '        <name>MaxPrice</name>\n' +
          '        <value>150</value>\n' +
          '    </itemFilter>\n' +
          '    <domainFilter>\n' +
          '        <name>domainName</name>\n' +
          '        <value>Digital_Cameras</value>\n' +
          '    </domainFilter>\n' +
          '    <paginationInput>\n' +
          '        <entriesPerPage>5</entriesPerPage>\n' +
          '    </paginationInput>\n' +
          '</findItemsByKeywordsRequest>'
      });
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
              'OrderLineItemID': '12345-67890',
              'SomeOtherID': 'ABCDEF'
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
        '            <SomeOtherID>ABCDEF</SomeOtherID>\n' +
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

  it('converts plain value to array', function() {
    expect(_deepToArray(5)).to.deep.equal([5]);
  });

  it('converts object to array', function() {
    expect(_deepToArray({
      'a': '1',
      'b': '2'
    })).to.deep.equal(
      [
        {'a': ['1']},
        {'b': ['2']}
      ]
    );
  });

  it('splits out array elements into objects', function() {
    expect(_deepToArray(
      {
        thing: ['a', 'b', 'c'],
        itemFilter: [
          {name: 'FreeShippingOnly', value: 'true'},
          {name: 'MaxPrice', value: '150'},
        ]
      }
    )).to.deep.equal(
      [
        {thing: ['a']},
        {thing: ['b']},
        {thing: ['c']},
        {
          itemFilter: [
            {name: ['FreeShippingOnly']},
            {value: ['true']},
          ]
        },
        {
          itemFilter: [
            {name: ['MaxPrice']},
            {value: ['150']},
          ]
        }
      ]
    );
  });

  it('converts everything recursively to arrays', function() {
    expect(_deepToArray({
      'Thing': {
        'Has': {
          'Weird': 'Structure',
          'Strange': 'Data'
        }
      },
      'Things': [
        {'foo': 'bar'}
      ],
      'More': 'Things',
      'Finally': ['Thing1', 'Thing2'],
      'Already': [{'An': 'Array'}]
    }))
    .to.deep.equal(
      [
        {
          'Thing': [{
            'Has': [
              {'Weird': ['Structure']},
              {'Strange': ['Data']}
            ]
          }]
        },
        {
          'Things': [
            {'foo': ['bar']}
          ]
        },
        {
          'More': ['Things']
        },
        {
          'Finally': ['Thing1']
        },
        {
          'Finally': ['Thing2']
        },
        {
          'Already': [
            {'An': ['Array']}
          ]
        }
      ]
    );
  });

});