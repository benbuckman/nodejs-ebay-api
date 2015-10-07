/**
 * Custom error types to differentiate eBay response errors and client-level errors.
 *
 * @see http://developer.ebay.com/devzone/xml/docs/Reference/ebay/Errors/ErrorMessages.htm
 */

exports.EbayClientError = function EbayClientError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
};

exports.EbaySystemError = function EbaySystemError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
};

exports.EbayRequestError = function EbayRequestError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
};
