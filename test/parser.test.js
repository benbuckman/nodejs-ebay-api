var
  chai = require('chai'),
  expect = chai.expect,
  flatten = require('../lib/parser').flatten;


describe('`flatten`', function() {
  it('converts single-element arrays to individual elements', function() {
    expect(flatten({
      data: {
        thing: ['abc']
      }
    })).to.deep.equal({
        data: {
          thing: 'abc'
        }
    });
  });

  it('can be limited to max depth', function() {
    expect(flatten({
      L1: [{
        d: 1,
        L2: [{
          d: 2,
          L3: [{
            d: 3,
            L4: [{
              d: 4,
              L5: [{
                d: 5,
                L6: [{
                  d: 6
                }]
              }]
            }]
          }]
        }]
      }]
    }, 5))
    .to.deep.equal({
      L1: {
        d: 1,
        L2: {
          d: 2,
          L3: {
            d: 3,
            L4: {
              d: 4,
              L5: {
                d: 5,
                L6: [{    // still an array!
                  d: 6
                }]
              }
            }
          }
        }
      }
    });
  });

  it('can flatten only top level', function() {
    expect(flatten({
      L1: [{
        d: 1,
        L2: [{
          d: 2
        }]
      }]
    }, 1))
    .to.deep.equal({
      L1: {
        d: 1,
        L2: [{
          d: 2
        }]
      }
    });
  });

  it('converts `{@key,__value}` structures', function() {
    expect(flatten({
      data: {
        '@key': 'foo',
        '__value__': 'bar'
      }
    })).to.deep.equal({
        data: {
          'foo': 'bar'
        }
      });
  });

  it('flattens silly `FooArray:Foo` structures', function() {
    expect(flatten({
      'ThingResponse': {
        'OrderArray': [{
          'Order': [
            {OrderId: '123'},
            {OrderId: '456'}
          ]
        }]
      }
    }))
    .to.deep.equal({
      'ThingResponse': {
        'Orders': [
          {OrderId: '123'},
          {OrderId: '456'}
        ]
      }
    });
  });

  it('converts \{_, $}` amount structures', function() {
    expect(flatten({
      'ThingResponse': {
        'AdjustmentAmount': {
          _: '100.00',
          '$': { currencyID: 'USD' }    // @todo - is the key a Euro symbol (etc) depending on the key??
        },
        'AmountPaid': {
          _: '50.00',
          '$': { currencyID: 'USD' }
        }
      }
    }))
    .to.deep.equal({
      'ThingResponse': {
        'AdjustmentAmount': {
          amount: '100.00',
          currencyID: 'USD'
        },
        'AmountPaid': {
          amount: '50.00',
          currencyID: 'USD'
        }

      }
    });
  });
});


describe('`parseResponse`', function() {
  // @TODO
});