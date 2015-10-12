require('./helpers');

describe('`deepToArray`', function() {
  var deepToArray = require('../lib/deep-to-array').deepToArray;

  it('converts plain value to array', function() {
    expect(deepToArray(5)).to.deep.equal([5]);
  });

  it('converts object to array', function() {
    expect(deepToArray({
      'a': '1',
      'b': '2'
    })).to.deep.equal(
      [
        {'a': ['1']},
        {'b': ['2']}
      ]
    );
  });

  it('splits out array elements into objects', function() {
    expect(deepToArray(
      {
        thing: ['a', 'b', 'c'],
        itemFilter: [
          {name: 'FreeShippingOnly', value: 'true'},
          {name: 'MaxPrice', value: '150'},
        ]
      }
    )).to.deep.equal(
      [
        {thing: ['a']},
        {thing: ['b']},
        {thing: ['c']},
        {
          itemFilter: [
            {name: ['FreeShippingOnly']},
            {value: ['true']},
          ]
        },
        {
          itemFilter: [
            {name: ['MaxPrice']},
            {value: ['150']},
          ]
        }
      ]
    );
  });

  it('converts everything recursively to arrays', function() {
    expect(deepToArray({
      'Thing': {
        'Has': {
          'Weird': 'Structure',
          'Strange': 'Data'
        }
      },
      'Things': [
        {'foo': 'bar'}
      ],
      'More': 'Things',
      'Finally': ['Thing1', 'Thing2'],
      'Already': [{'An': 'Array'}]
    }))
      .to.deep.equal(
      [
        {
          'Thing': [{
            'Has': [
              {'Weird': ['Structure']},
              {'Strange': ['Data']}
            ]
          }]
        },
        {
          'Things': [
            {'foo': ['bar']}
          ]
        },
        {
          'More': ['Things']
        },
        {
          'Finally': ['Thing1']
        },
        {
          'Finally': ['Thing2']
        },
        {
          'Already': [
            {'An': ['Array']}
          ]
        }
      ]
    );
  });

});