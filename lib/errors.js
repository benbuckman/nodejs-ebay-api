/**
 * Custom error types to differentiate eBay response errors and client-level errors.
 *
 * @see http://developer.ebay.com/devzone/xml/docs/Reference/ebay/Errors/ErrorMessages.htm
 */

var
  inherits = require('util').inherits,
  _ = require('lodash');

function EbayClientError(message, extraProps) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  _.defaults(this, extraProps);
}
inherits(EbayClientError, Error);

function EbaySystemError(message, extraProps) {
  EbayClientError.apply(this, arguments);
  this.name = this.constructor.name;
}
inherits(EbaySystemError, EbayClientError);

function EbayRequestError(message) {
  EbayClientError.apply(this, arguments);
  this.name = this.constructor.name;
}
inherits(EbayRequestError, EbayClientError);

function EbayAuthenticationError(message) {
  EbayClientError.apply(this, arguments);
  this.name = this.constructor.name;
}
inherits(EbayAuthenticationError, EbayClientError);


module.exports = {
  EbayClientError: EbayClientError,
  EbaySystemError: EbaySystemError,
  EbayRequestError: EbayRequestError,
  EbayAuthenticationError: EbayAuthenticationError,
};
