/* eslint-disable */
module.exports = setup;

function setup(global) {
	// If this is a node test, SystemJs won't be set up, so initialize it
	if(!global.System) {
		global.System = eval("require('systemjs')");
		const configFile = require(process.cwd() + '/package.json').jspm.configFile || 'config.js';
		require(process.cwd() + '/' + configFile);
	}

	// Return a promise for tests to be chained off of.
	return createRunner();

	function createRunner() {
		var promise = global.Promise ? Promise.resolve() : System.import('q')
			// Import all of the libraries used for testing, and then load them into the
			// global namespace for tests to consume.
		return promise.then(function(q) {
				if(!global.Promise)
					global.Promise = q
				return Promise.all([
					System.import('chai'),
					System.import('sinon'),
					System.import('sinon-chai'),
					System.import('chai-as-promised')
				])
			})
			.then(function(globals) {
				return initGlobals.apply(null, globals);
			})
			.catch(function(ex) {
				console.error('Error Setting Up Test Loader:')
				console.error(ex.stack)
				throw ex;
			});
	}

	function initGlobals(chai, sinon, sinonChai, chaiAsPromised) {
		// Set up mocks
		chai.use(sinonChai);
		// Set up promise framework
		chai.use(chaiAsPromised);
		// Make should syntax available
		chai.should();
		global.expect = chai.expect;
		global.assert = chai.assert;
		if(global.mocha) {
			// Initialize mocha
			global.mocha.setup({
				ui: 'bdd',
				reporter: 'Spec'
			});
			var oldLog = console.log;
			global.testResults = []
			console.log = function() {
				oldLog.apply(console, arguments)
				global.testResults.push(Array.prototype.slice.call(arguments))
			}
		}
		// sinon (mocking framework) cleanup hooks
		beforeEach(function() {
			this.sinon = sinon.sandbox.create();
			this.test.parent.title = global.document ? "Web:" : "Node:"
		});
		afterEach(function() {
			this.sinon.restore();
		});
	}
}
