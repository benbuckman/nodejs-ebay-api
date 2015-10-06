eBay API client for Node.js
===============

## Intro

This module aims to support all of eBay's APIs (Trading, Shopping, Finding, Merchandising, etc),
with an interface that is both a) somewhat consistent across APIs
and b) not too different from the underlying interface.

eBay's APIs are primarily XML-based, so this module unfortunately has to do a lot of JSON<->XML conversion.

### History

1. I created this module in 2012, for one of the first Node.js apps I ever launched,
  and built it out enough to handle my use cases at the time.
2. Since then, [several other people](https://github.com/benbuckman/nodejs-ebay-api/network) have contributed to the module.
3. I decided, after reviewing the alternatives and finding nothing better,
  to revive this module again for a project in October 2015. I've pulled in improvements from various forks,
  refactored most of the code, and started adding tests.  
  It is possible that in adding support for new APIs/endpoints, others that used to work no longer work.

I don't have time to build this out to support every endpoint, so 
**if you are using this module, or would like to use this module, please submit pull requests!**


## Usage

`npm install ebay-api`

`var ebay = require('ebay-api');`

(See the examples)


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

  - `params`: (see examples and API documentation)
  - `filters`: (see examples and API documentation.) _might no longer work in 1.x: if you're using this, please submit a PR!_
  - `reqOptions`: passed to the [request](https://github.com/request/request) module, e.g. for additional `headers`.
  - `parser`: function which takes the response data and extracts items (or other units depending on the query). 
    _Module includes a default parser._
  - `sandbox`: boolean (default false = production). May need to add additional endpoint URLs to the code as needed.
  - `raw`: boolean, set `true` to skip parsing and return the raw XML response.
  
_for authentication, include:_

  - `devName`
  - `cert`
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

Its purpose is to make the data easier to handle in code, and to model/query in MongoDB.

Runs synchronously, returns flattened object.


### `ItemFilter(name, value, paramName, paramValue)`

A class constructor to simplify creating filters. (See the examples)


### `getLatestApiVersions(callback)`

_Disabled in 1.x. Please submit a PR with a fix/refactor if you use this._

Get the version numbers of the APIs that make their version available.


## Examples

See the /examples directory. There are two examples, one with a single-page `findItemsByKeywords` request,
the other a paginated `findItemsAdvanced` request. It should be reasonably apparent from the examples 
how these functions are used.
To run the examples, you need to add your own app key (I don't want my keys to be disabled for abuse!) - 
you can get one [here](https://publisher.ebaypartnernetwork.com/PublisherToolsAPI).


Enjoy!