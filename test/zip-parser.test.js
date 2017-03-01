require('./helpers');
var
  fs = require('fs'),
  path = require('path'),
  parseResponseZip = require('../lib/zip-parser').parseResponseZip;

  describe('`parseResponseZip` with valid response', function() {

    context('Parse ZIP from XML Response', function () {
      var responseXml, parsedZip, expectedZip;

      beforeEach('load mock response', function () {
        responseXml = fs.readFileSync(path.resolve(__dirname, 'mocks', 'download_file_response.xml'), {encoding: 'binary'});
      });

      beforeEach('load expected response', function () {
        expectedZip = fs.readFileSync(path.resolve(__dirname, 'mocks', 'expected_download_zip.zip'), {encoding: 'binary'});
      });

      beforeEach('extract the zip from the xml', function () {
        parsedZip = parseResponseZip(responseXml);
      });

      it('extracted the ZIP from the XML', function () {
        expect(parsedZip).to.not.be.null;
      });

      it('the ZIP mathced the expected data', function () {
        expect(parsedZip).to.equal(expectedZip);
      });
    });

  });

  describe('`parseResponseZip` with invalid response', function() {

    context('Parse ZIP from XML Response', function () {
      var responseXml, parsedZip, expectedZip;

      beforeEach('load mock response', function () {
        responseXml = "this is invalid"
      });

      beforeEach('extract the zip from the xml', function () {
        parsedZip = parseResponseZip(responseXml);
      });

      it('no zip in the response', function () {
        expect(parsedZip).to.be.null;
      });
    });

  });
