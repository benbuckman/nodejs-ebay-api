var
  chai = require('chai'),
  expect = chai.expect,

  flatten = require('../lib/flatten').flatten;


describe('flatten', function() {
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


});
