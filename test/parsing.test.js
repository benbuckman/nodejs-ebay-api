require('./helpers');

var
  fs = require('fs'),
  path = require('path'),
  convertXmlToJson = require('../lib/xml-converter').convertXmlToJson,
  parseResponseJson = require('../lib/json-parser').parseResponseJson;


describe('`parseResponseJson` with unlimited depth', function() {

  context('GetOrders response', function () {
    var responseXml, responseJson, parsedResponse;

    var requestContext = {
      serviceName: 'Trading',
      opType: 'GetOrders',
      parseDepth: -1
    };

    beforeEach('load mock response', function () {
      responseXml = fs.readFileSync(path.resolve(__dirname, 'mocks', 'GetOrders.xml'), {encoding: 'utf8'});
    });

    beforeEach('convert xml to json', function (done) {
      convertXmlToJson(responseXml, requestContext, function (error, _json) {
        if (error) return done(error);
        responseJson = _json;
        done();
      });
    });

    beforeEach('parse json', function (done) {
      parseResponseJson(responseJson, requestContext, function (error, _data) {
        if (error) return done(error);
        parsedResponse = _data;
        done();
      });
    });

    it('converted XML to JSON', function () {
      expect(responseJson).to.have.property('GetOrdersResponse');
    });

    it('parsed data from JSON', function () {
      expect(parsedResponse).to.have.property('Timestamp', '2015-10-11T15:01:00.222Z');
      expect(parsedResponse).to.have.property('Ack', 'Success');
    });

    it('converted <OrderArray> to `Orders`', function() {
      expect(parsedResponse).to.have.property('Orders');
      expect(parsedResponse).not.to.have.property('OrderArray');
      expect(parsedResponse.Orders).to.have.length(2);
    });

    it('converted <TransactionArray> to `Transactions`', function() {
      var _orders = parsedResponse.Orders;

      expect(_orders[0]).to.have.property('Transactions');
      expect(_orders[0]).not.to.have.property('TransactionArray');


      // `Transactions` are always arrays
      expect(_orders[0].Transactions).to.have.length(1);
      expect(_orders[1].Transactions).to.have.length(2);

      expect(_orders[0].Transactions[0]).to.have.have.deep.property('Buyer.Email', 'ebay-buyer@mail.com');

      expect(_orders[1].Transactions[0]).to.have.deep.property('Item.Title', 'Penguin');
      expect(_orders[1].Transactions[1]).to.have.deep.property('Item.Title', 'Panda');
    });

    it('preserves certain fields known to be arrays, even with single value', function() {
      // NOTE: this gets into the thorny assumptions the parser makes,
      // where arrays turn into objects if there's only one value.
      // (exception tested here only applies to specially handled cases.)
      var _orders = parsedResponse.Orders;

      // `TaxDetails` are always arrays
      expect(_orders[0].Transactions[0]).to.have.deep.property('Taxes.TaxDetails')
        .that.is.a.instanceof(Array);

      expect(_orders[0].Transactions[0].Taxes.TaxDetails).to.have.length(1);
      expect(_orders[1].Transactions[0].Taxes.TaxDetails).to.have.length(2);
      expect(_orders[1].Transactions[1].Taxes.TaxDetails).to.have.length(2);
    });

    it('flattens sub-elements within known arrays', function() {
      expect(parsedResponse.Orders[0].Transactions[0].Taxes.TaxDetails[0])
        .to.have.property('Imposition', 'SalesTax');
      expect(parsedResponse.Orders[1].Transactions[1].Taxes.TaxDetails[0])
        .to.have.property('Imposition', 'SalesTax');
    });

    it('converts booleans', function() {
      expect(parsedResponse.Orders[0]).to.have.property('IsMultiLegShipping', false);
    });

    it('converts numbers', function() {
      expect(parsedResponse).to.have.deep.property('PaginationResult.TotalNumberOfPages', 1);
      expect(parsedResponse).to.have.deep.property('PaginationResult.TotalNumberOfEntries', 2);
    });

    it('converts currency amounts', function() {
      expect(parsedResponse.Orders[0]).to.have.property('AdjustmentAmount')
        .that.deep.equal({amount: 0, currencyID: 'USD'});
      expect(parsedResponse.Orders[0]).to.have.property('AmountPaid')
        .that.deep.equal({amount: 6, currencyID: 'USD'});
      expect(parsedResponse.Orders[0].Transactions[0]).to.have.property('TransactionPrice')
        .that.deep.equal({amount: 3, currencyID: 'USD'});
    });
  });


  // TODO test parseDepth:0, shouldn't transform at all


  context('GetSingleItem response', function () {
    var responseXml, responseJson, parsedResponse;

    it('#TODO');
  });

});