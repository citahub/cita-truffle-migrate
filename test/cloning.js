var assert = require('assert')
var solc = require('solc')

// Clean up after solidity. Only remove solidity's listener,
// which happens to be the first.
process.removeListener('uncaughtException', process.listeners('uncaughtException')[0])

var fs = require('fs')
var contract = require('../dist/contract')


describe('Cloning', function() {
  var ExampleOne
  var ExampleTwo

  before('Compile and set up contracts', function(done) {
    this.timeout(10000)

    // Compile first
    var result = solc.compile(fs.readFileSync('./test/Example.sol', { encoding: 'utf8' }), 1)

    var compiled = result.contracts['Example']

    ExampleOne = contract(compiled)
    ExampleTwo = ExampleOne.clone()

    done()
  })

  it('produces two distinct objects', function() {
    assert(Object.keys(ExampleOne._json).length > 0)
    assert(Object.keys(ExampleTwo._json).length > 0)
    assert.notEqual(ExampleTwo._json, ExampleOne._json)
    assert.deepEqual(ExampleTwo._json, ExampleOne._json)
  })
})
