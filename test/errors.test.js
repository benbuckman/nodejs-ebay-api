require('./helpers');

var
  errors = require('../lib/errors'),
  _ = require('lodash');


describe('error classes', function() {

  [
    'EbayClientError',
    'EbaySystemError',
    'EbayRequestError',
    'EbayAuthenticationError'
  ]
  .forEach(function(errorClassName) {
    describe(errorClassName, function() {
      var errorClass = errors[errorClassName];

      it('exists', function() {
        expect(errorClass).to.be.ok;
      });

      it('is an Error', function() {
        var err = new errorClass('Test');
        expect(err).to.be.instanceOf(Error);
      });

      it('is an EbayClientError', function() {
        var err = new errorClass('Test');
        expect(err).to.be.instanceOf(errors.EbayClientError);
      });

      it('can have a message', function() {
        var err = new errorClass('Test');
        expect(err).to.have.property('message', 'Test');
      });

      it('has a stack', function() {
        var err = new errorClass('Test');
        expect(err).to.have.property('stack');
        var stackLines = err.stack.split('\n');
        expect(stackLines[0]).to.equal(errorClassName + ': Test')
        expect(stackLines[1]).to.contain(__dirname);
      });

      it('can have arbitrary properties assigned', function() {
        var err = new errorClass('Test', {
          foo: 'bar',
          details: {errorCode: '123'},
          errors: ['um', 'hm']
        });

        expect(_.pick(err, ['foo', 'details', 'errors'])).to.deep.equal({
          foo: 'bar',
          details: {errorCode: '123'},
          errors: ['um', 'hm']
        });
      });

      it('can\'t overwrite base properties with extra properties', function() {
        var err = new errorClass('Original message', {
          message: 'New message',
          name: 'UhOh',
          stack: 'ByeBye'
        });

        expect(err.message).to.equal('Original message');
        expect(err.name).to.equal(errorClassName);
        expect(err.stack).not.to.equal('ByeBye');
      });

    });
  });
});
