#! /usr/bin/env node

/**
 * script for debugging: input XML from eBay,
 * gets run through xml->js converter and JSON parser,
 * and outputs JSON (as an app using this module would get when it calls `xmlRequest()`).
 *
 * use for example with XML retrieved from API via `curl`, or eBay's API test tool.
 *
 * usage: `cat ebay-response.xml | parse-input-xml.js > ebay-response-parsed.json`
 */

var
  async = require('async'),
  convertXmlToJson = require('../lib/xml-converter').convertXmlToJson,
  parseResponseJson = require('../lib/json-parser').parseResponseJson,
  inputXml = '';

process.stdin.on('data', function(chunk) {
  inputXml += chunk.toString();
});

process.stdin.on('end', function() {
  async.waterfall([
    function(next) {
      // (don't know the context of the request anymore,
      //  so anything `options`-specific in the parser won't work.)
      convertXmlToJson(inputXml, {}, next);
    },
    function(data, next) {
      parseResponseJson(data, {}, next);
    }
  ],
  function(error, parsedJson) {
    if (error) {
      console.log(error, error instanceof Error)
      throw error;
    }
    process.stdout.write(JSON.stringify(parsedJson));
  });
});