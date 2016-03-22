require('./helpers');

var
  request = require('request'),
  ebay = require('../index'),
  xmlRequest = ebay.xmlRequest;

describe('XML requests', function() {
  describe('building requests', function() {
    beforeEach('stub request', function () {
      this.sinon.stub(request, 'post', function (options, callback) {
        process.nextTick(function () {
          callback(null, {statusCode: 200}, {});
        });
      });
    });

    describe('Shopping: GetSingleItem', function () {
      beforeEach('build request', function () {
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
        }, function noop() {
        });
      });

      it('initiated request with expected parameters', function () {
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
          '</GetSingleItemRequest>',
          agentOptions: {
            ciphers: 'ALL',
            secureProtocol: 'TLSv1_method',
          },
        });
      });
    });


    describe('Shopping: GetMultipleItems', function () {
      beforeEach('build request', function () {
        xmlRequest({
          serviceName: 'Shopping',
          opType: 'GetMultipleItems',
          sandbox: true,
          appId: 'ABCDEF',
          raw: true,  // no parsing
          params: {
            'ItemID': ['123456', '345678']
          }
        }, function noop() {
        });
      });

      it('handles multiple parameter values', function () {
        expect(request.post).to.have.been.calledOnce;

        expect(request.post.lastCall.args[0]).to.have.property('body',
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<GetMultipleItemsRequest xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
          '    <ItemID>123456</ItemID>\n' +
          '    <ItemID>345678</ItemID>\n' +
          '</GetMultipleItemsRequest>'
        );
      });
    });


    describe('Trading: GetOrders (authenticated)', function () {
      beforeEach('build request', function () {
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
        }, function noop() {
        });
      });

      it('adds token to XML request', function () {
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


    describe('Finding: findItemsByKeywords', function () {
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

      it('initiated request with expected parameters', function () {
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
          body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
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
          '</findItemsByKeywordsRequest>',
          agentOptions: {
            ciphers: 'ALL',
            secureProtocol: 'TLSv1_method',
          },
        });
      });

    });


    describe('nested params', function () {
      beforeEach('build request', function () {
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
        }, function noop() {
        });
      });

      it('converts properly to nested XML', function () {
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
      });
    });

  });


  describe('response error handling', function() {
    var err, data;

    beforeEach(function() {
      err = null;
      data = null;
    });

    function _buildResponseCallback(errorCode, errorClassification, errorSeverity) {
      return function(options, callback) {
        process.nextTick(function() {
          callback(null, {
            statusCode: 200,
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<GetOrdersResponse xmlns="urn:ebay:apis:eBLBaseComponents">\n' +
              '  <Ack>' + (errorSeverity === 'Warning' ? 'Warning' : 'Failure') + '</Ack>\n' +
              '  <Errors>\n' +
              '    <ShortMessage>Something went wrong.</ShortMessage>\n' +
              '    <LongMessage>Something really went wrong.</LongMessage>\n' +
              '    <ErrorCode>' + errorCode + '</ErrorCode>\n' +
              '    <SeverityCode>' + errorSeverity + '</SeverityCode>\n' +
              '    <ErrorClassification>' + errorClassification + '</ErrorClassification>\n' +
              '  </Errors>' +
              '  <OrderArray><Order></Order></OrderArray>' +
              '</GetOrdersResponse>'   // (not comprehensive)
          });
        });
      };
    }

    describe('RequestError from response', function() {
      beforeEach('stub request', function() {
        this.sinon.stub(request, 'post', _buildResponseCallback('12345', 'RequestError', 'Error'));
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders'
        }, function(_err, _data) {
          err = _err;
          data = _data;
          done();
        });
      });

      it('throws an EbayRequestError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbayRequestError);
      });

      it('error has context properties', function() {
        expect(err).to.have.property('severityCode', 'Error');
        expect(err).to.have.property('classification', 'RequestError');
        expect(err).to.have.property('errors').that.is.instanceof(Array);
        expect(err).to.have.property('details');
        expect(err).to.have.property('requestContext');
        expect(err.requestContext).to.have.property('serviceName', 'Trading');
        expect(err.requestContext).to.have.property('reqOptions');
        expect(err.requestContext.reqOptions).to.have.property('body');
        expect(err.requestContext.reqOptions).to.have.property('url');
        expect(err.requestContext).to.have.property('response');
        expect(err.requestContext.response).to.have.property('statusCode', 200);
        expect(err.requestContext.response).to.have.property('body').that.match(/^<\?xml/);
        expect(err.requestContext).not.to.have.property('parser');  // no functions
      });

      it('also gets response data', function() {
        expect(data).to.be.ok;
        expect(data).to.have.property('Ack', 'Failure');
        expect(data).to.have.property('Orders').that.is.instanceof(Array);
      });
    });


    describe('Warning from response', function() {
      beforeEach('stub request', function() {
        this.sinon.stub(request, 'post', _buildResponseCallback('12345', 'RequestError', 'Warning'));
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders'
        }, function(_err, _data) {
          err = _err;
          data = _data;
          done();
        });
      });

      it('throws an EbayRequestError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbayRequestError);
      });

      it('error has context properties', function() {
        expect(err).to.have.property('severityCode', 'Warning');
        expect(err).to.have.property('classification', 'RequestError');
        expect(err).to.have.property('errors').that.is.instanceof(Array);
        expect(err).to.have.property('details');
        expect(err).to.have.property('requestContext');
        expect(err.requestContext).to.have.property('serviceName', 'Trading');
        expect(err.requestContext).to.have.property('reqOptions');
        expect(err.requestContext.reqOptions).to.have.property('body');
        expect(err.requestContext.reqOptions).to.have.property('url');
        expect(err.requestContext).to.have.property('response');
        expect(err.requestContext.response).to.have.property('statusCode', 200);
        expect(err.requestContext.response).to.have.property('body').that.match(/^<\?xml/);
        expect(err.requestContext).not.to.have.property('parser');  // no functions
      });

      it('also gets response data', function() {
        expect(data).to.be.ok;
        expect(data).to.have.property('Ack', 'Warning');
        expect(data).to.have.property('Orders').that.is.instanceof(Array);
      });
    });


    describe('SystemError from response', function() {
      beforeEach('stub request', function() {
        this.sinon.stub(request, 'post', _buildResponseCallback('12345', 'SystemError', 'Error'));
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders'
        }, function(_err, _data) {
          err = _err;
          data = _data;
          done();
        });
      });

      it('throws an EbaySystemError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbaySystemError);
      });
    });

    describe('XML parsing fails', function() {
      beforeEach('stub request', function() {
        // screw up XML body
        this.sinon.stub(request, 'post', _buildResponseCallback('<<<<', '>>>>', 'Error'));
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders'
        }, function(_err, _data) {
          err = _err;
          data = _data;
          done();
        });
      });

      it('throws an EbayClientError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbayClientError);
      });
    });

    describe('non-200 response code', function() {
      beforeEach('stub request', function () {
        this.sinon.stub(request, 'post', function (options, callback) {
          process.nextTick(function () {
            callback(null, {statusCode: 503});
          });
        });
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders'
        }, function(_err) {
          err = _err;
          done();
        });
      });

      it('throws an EbayClientError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbayClientError);
        expect(err.message).to.match(/503/);
      });
    });

    describe('other client error', function() {
      beforeEach('stub request', function () {
        this.sinon.stub(request, 'post', function (options, callback) {
          process.nextTick(function () {
            callback(null, {statusCode: 200, body: ''});
          });
        });
      });

      beforeEach('simulate request', function (done) {
        xmlRequest({
          serviceName: 'Trading',
          opType: 'GetOrders',
          parser: function(data, options, callback) {
            callback(new Error("Boo"));
          }
        }, function(_err) {
          err = _err;
          done();
        });
      });

      it('throws an EbayClientError', function() {
        expect(err).to.be.an.instanceOf(ebay.EbayClientError);
        expect(err.message).to.match(/Boo/);
      });

    });
  });
});
