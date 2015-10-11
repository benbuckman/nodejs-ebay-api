eBay API client for Node.js
===============

[![Build Status](https://travis-ci.org/benbuckman/nodejs-ebay-api.svg)](https://travis-ci.org/benbuckman/nodejs-ebay-api)

## Intro

This module aims to support all of eBay's APIs (Trading, Shopping, Finding, Merchandising, etc),
with an interface that is both a) somewhat consistent across APIs
and b) not too different from the underlying interface.

eBay's APIs are primarily XML-based, so this module unfortunately has to do a lot of JSON<->XML conversion.

### History

1. I created this module in 2012, for one of the first Node.js apps I ever launched,
  and built it out enough to handle my use cases at the time.
2. Since then, [several other people][network] have contributed to the module.
3. I decided, after reviewing the alternatives and finding nothing better,
  to revive this module again for a project in October 2015. I've pulled in improvements from various forks,
  refactored most of the code, and started adding tests.  
  It is possible that in adding support for new APIs/endpoints, others that used to work no longer work.

I don't have time to build this out to support every endpoint, so 
**if you are using this module, or would like to use this module, please submit pull requests!**


## Usage

`npm install ebay-api`

`var ebay = require('ebay-api');`

(See the [examples][examples])


## A word on the eBay APIs

eBay has an enormous collection of APIs built over the years. 
Enter the labyrinth here: [http://developer.ebay.com](http://developer.ebay.com) 
or here: [https://www.x.com/developers/ebay/products](https://www.x.com/developers/ebay/products)

Sign up for an API key here: [https://publisher.ebaypartnernetwork.com/PublisherToolsAPI](https://publisher.ebaypartnernetwork.com/PublisherToolsAPI)
(You'll need a key to run the examples.)

Make sure to obey the eBay API [License](http://developer.ebay.com/join/licenses/individual/) and [Terms](https://www.x.com/developers/ebay/programs/affiliates/terms) when using this library.


## Methods

### `xmlRequest(options, callback)`

Makes an XML POST to an eBay API endpoints.

`options` must contain:
  
  - `serviceName`: e.g. 'Finding'
  - `opType`: e.g. 'findItemsAdvanced'
  - `appId`: your eBay API application ID

and can optionally contain:

  - `params`: (see [examples][examples] and API documentation)
  - `reqOptions`: passed to the [request][request] module, 
    e.g. for additional `headers`, or `timeout`.
  - `xmlConverter`: function which takes the response XML and converts to JSON. 
    _Module uses [xml2js](https://www.npmjs.com/package/xml2js) by default, but can be overridden._
  - `parser`: function which takes the response data (as JSON object) and extracts items
    (or other units depending on the query). 
    _Module includes a default parser._
  - `sandbox`: boolean (default false = production). May need to add additional endpoint URLs to the code as needed.
  - `raw`: boolean, set `true` to skip parsing and return the raw XML response.
  
_for authentication, include:_

  - `devId`
  - `certId`
  - `authToken`

`callback` gets `(error, data)`.


### `paginateGetRequest(options, callback)`

Make a multi-page request to a GET service, running them in parallel and combining the results.

_Note: this is currently broken in 1.x. Fixes/refactors are welcome._

`options` contains the same parameters as `ebayApiGetRequest`, plus:

- pages: # of pages to query
- perPage: items per page

`parser` here needs to return an array, so the results can be concatenated and passed to `callback`.

Note: Because the pages all run in parallel, they can cause spikes on CPU and network activity. In the future, I might switch this to using an [async](https://github.com/caolan/async) `queue` (instead of `forEach`) with a variable concurrency. (A `forEachSeries` can also be used, but negates the purpose of running the requests asynchronously.)

`callback` gets `(error, items)`


## Helpers

### `flatten(obj)`

Simplifies the JSON format of the API responses:

- Single-element arrays and objects are flatted to their key:value pair.
- The structure of the format `{ @key:KEY, __value__:VALUE }` is flattened to its key:value pair.
- Other weird structures (from the API itself, or the XML->JSON conversion) are simplified. _(See the code for details.)_

Its purpose is to make the data easier to handle in code, and to model/query in MongoDB.

Runs synchronously, returns flattened object.

The default parser will `flatten()` the response to a finite depth
(because infinite recursion on an indeterminate response size would cause an unnecessary performance hit).  
If you want to flatten further, use this method directly.


### `parseResponseJson(data, options, callback)`

The default parser. Can be overridden (see `options` on `xmlRequest()`). 


### `convertXmlToJson(xmlBody, options, callback)`

The default XML->JS converter. Uses xml2js. Can be overridden (see `options` on `xmlRequest()`). 


### `getLatestApiVersions(callback)`

_Disabled in 1.x. Please submit a PR with a fix/refactor if you use this._

Get the version numbers of the APIs that make their version available.


## Errors

The client exports and attempts to differentiate between `EbaySystemError`, `EbayRequestError`, and `EbayClientError`.

See http://developer.ebay.com/DevZone/Shopping/docs/CallRef/types/ErrorClassificationCodeType.html
and http://developer.ebay.com/devzone/xml/docs/Reference/ebay/Errors/ErrorMessages.htm.


## Examples

See the [examples][examples] directory.
There are two examples, one with a single-page `findItemsByKeywords` request,
the other a paginated `findItemsAdvanced` request. It should be reasonably apparent from the examples 
how these functions are used.
To run the examples, you need to add your own app key (I don't want my keys to be disabled for abuse!) - 
you can get one [here](https://publisher.ebaypartnernetwork.com/PublisherToolsAPI).


## Debugging

This module uses the [debug](https://github.com/visionmedia/debug) module for internal logging.

Run your app (or node REPL) with `DEBUG=ebay* ...` to see output. 


Enjoy!

[network]: https://github.com/benbuckman/nodejs-ebay-api/network
[examples]: https://github.com/benbuckman/nodejs-ebay-api/tree/master/examples
[request]: https://github.com/request/request