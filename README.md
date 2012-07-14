eBay API client for Node.js
===============

## Background

This was built to power the "eBay Picks" section of [AntiquesNearMe.com](http://antiquesnearme.com). It can currently query the FindingService, MerchandisingService, and Shopping API via JSON-GET requests, and the Trading API via XML-POST. Other services can be added as needed. (Pull requests welcome!)

## To use

`npm install ebay-api`

`var ebay = require('ebay-api');`

(See the examples)


## A word on the eBay APIs

eBay has an enormous collection of APIs built over the years. Enter the labyrinth here: [http://developer.ebay.com](http://developer.ebay.com) or here: [https://www.x.com/developers/ebay/products](https://www.x.com/developers/ebay/products)

Sign up for an API key here: [https://publisher.ebaypartnernetwork.com/PublisherToolsAPI](https://publisher.ebaypartnernetwork.com/PublisherToolsAPI)
(You'll need a key to run the examples.)

Make sure to obey the eBay API [License](http://developer.ebay.com/join/licenses/individual/) and [Terms](https://www.x.com/developers/ebay/programs/affiliates/terms) when using this library.


## Why use Node.js to do this?

Node.js is great at running HTTP requests asynchronously. If each request takes 5 seconds to run and 5 seconds to parse, for example, dozens of requests can run in parallel and only take 10 seconds total, instead of 10 seconds for each. (This module uses [restler](https://github.com/danwrong/restler) for the HTTP handling and the [async](https://github.com/caolan/async) library for flow control.)

Node.js speaks JSON natively, so the response data from the JSON APIs can be very easily parsed in code, or dumped into MongoDB.

Javascript is a little insane and a lot of fun.


## Methods

### `ebayApiGetRequest(options, callback)`

Make an individual request to a GET service.
`options` must contain:

- serviceName: e.g. 'FindingService'
- opType: e.g. 'findItemsAdvanced'
- appId: your eBay API application ID

and can optionally contain:

- params: (see examples and API documentation)
- filters: (see examples and API documentation)
- reqOptions: passed to the request, e.g. with custom headers
- parser: function which takes the response data and extracts items (or other units depending on the query). Defaults to `parseItemsFromResponse`. To return the raw data, pass in a function like `function(data, callback) { callback(null, data); }`.
- sandbox: true/false (default false = production). May need to add additional endpoint URLs to the code as needed.

`callback` gets `(error, items)` or `(error, data)` depending on the parser.


### `paginateGetRequest(options, callback)`

Make a multi-page request to a GET service, running them in parallel and combining the results.

`options` contains the same parameters as `ebayApiGetRequest`, plus:

- pages: # of pages to query
- perPage: items per page

`parser` here needs to return an array, so the results can be concatenated and passed to `callback`.

Note: Because the pages all run in parallel, they can cause spikes on CPU and network activity. In the future, I might switch this to using an [async](https://github.com/caolan/async) `queue` (instead of `forEach`) with a variable concurrency. (A `forEachSeries` can also be used, but negates the purpose of running the requests asynchronously.)

`callback` gets `(error, items)`


### `parseItemsFromResponse(data, callback)`

Default parser, takes the response from an API request and parses items or other units per request type.
Each response type is a little different, so this needs to be built out further.
Is used as the default `parser` option for `paginateGetRequest`.

`callback` gets `(error, items)` where `items` are the items parsed from `data`.


### `ebayApiPostXmlRequest(options, callback)`

Make an individual request to a POST-XML service.
`options` must contain:

- serviceName: e.g. 'FindingService'
- opType: e.g. 'findItemsAdvanced'

and can optionally contain:

- (for authentication)
  - devName
  - cert
  - appName

- params (for the XML input)
  - (Note: for `GetCategories` and possibly other services, pass the auth token as `params.authToken`, not `RequesterCredentials.eBayAuthToken` as indicated in the API documentation.)
  - See `buildXmlInput()` for ways to structure this.

- reqOptions: headers and other options to pass to the request
  - IMPT: Some parameters for these endpoints, such as _SITE-ID_ and _authToken_, should go into the headers, not into `params`. See the API documentation.
- sandbox: true/false (default false = production). May need to add additional endpoint URLs to the code as needed.
- rawXml: boolean. If `true`, passes the raw XML response back to callback. `false` means XML is converted to JSON (for consistency with other APIs). Default is `false`/JSON.

`callback` gets `(error, data)`. (There is not currently a default parser for these endpoints.)


## Helpers

### `flatten(obj)`

Simplifies the JSON format of the API responses:

- Single-element arrays and objects are flatted to their key:value pair.
- The structure of the format `{ @key:KEY, __value__:VALUE }` is flattened to its key:value pair.

Its purpose is to make the data easier to handle in code, and to model/query in MongoDB.

Runs synchronously, returns flattened object.


### `ItemFilter(name, value, paramName, paramValue)`

A class constructor to simplify creating filters. (See the examples)


### `checkAffiliateUrl(url)`

If you want your affiliate codes included in returned items (see the examples for how to do that), use this to verify that the URLs are of the right format.
e.g. `checkAffiliateUrl(item.viewItemURL)`

Returns boolean.


### `getLatestApiVersions(callback)`

Get the version numbers of the APIs that make their version available.


## Examples

See the /examples directory. There are two examples, one with a single-page `findItemsByKeywords` request, the other a paginated `findItemsAdvanced` request. It should be reasonably apparent from the examples how these functions are used.
To run the examples, you need to add your own app key (I don't want my keys to be disabled for abuse!) - you can get one [here](https://publisher.ebaypartnernetwork.com/PublisherToolsAPI).


## Possible Roadmap

1. Add more services and generally expand the functionality.
2. Add more links related to relevant eBay documentation.
3. Add a generic [Mongoose](http://mongoosejs.com) model. (Mine is currently too filled with custom business logic to be included.)
4. Switch from `async.forEach` to `async.queue` for more fine-grained concurrency control.
5. Suggestions...?


## Credits

Created by Ben Buckman of [New Leaf Digital](http://newleafdigital.com), an independent dev/consulting shop specializing in Node.js, Drupal, mapping, system architecture, and general "full stack" development. Ben writes a [dev blog](http://benbuckman.net) about Node.js and many other subjects.

Ben's other hat is co-founder and CTO of [Antiques Near Me](http://antiquesnearme.com), and this library was created for use there.

Enjoy!
