/**
 * lists of known keys for parsing.
 *
 * TODO fill this out more -- PR's welcome!
 */

exports.knownArrayKeysByApiEndpoint = {

  /*
  e.g.
   {
     serviceName1: {
       opType1: [...]  // known array keys
       opType2: [...]
       ...
     },
     serviceName2: {...}
   }
  */

  'Trading': {

    // see http://developer.ebay.com/devzone/xml/docs/reference/ebay/GetOrders.html#Response.OrderArray.Order.PaidTime
    'GetOrders': [
      'AddressAttribute',
      'Attribute',
      'BuyerPackageEnclosure',
      'BuyerPackageEnclosure',
      'BuyerTaxIdentifier',
      'CancelDetail',
      'ErrorParameters',
      'Errors',
      'ExternalTransaction',
      'InternationalShippingServiceOption',
      'NameValueList',
      'Orders',
      'Payment',
      'PaymentReferenceID',
      'PickupOptions',
      'Refund',
      'RequiredSellerAction',
      'ShipToLocation',
      'ShipmentTrackingDetails',
      'ShippingPackageInfo',
      'ShippingPackageInfo',
      'ShippingServiceOptions',
      'TaxDetails',
      'TaxJurisdiction',
      'Transactions',
      'Value',
      'VariationSpecifics'
    ]
  },

  'Shopping': {

    'GetMultipleItems': [
      'Item',
      // ...
    ]
  }

  // TODO others...
};