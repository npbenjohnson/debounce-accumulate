/* eslint-disable */
'use strict';
// Test libraries
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
chai.use(chaiAsPromised);
global.expect = chai.expect;
global.assert = chai.assert;
beforeEach(function() {
	this.sinon = sinon.sandbox.create();
});
afterEach(function() {
	this.sinon.restore();
});

// Systemjs
global.System = require('systemjs');
const configFile = require(process.cwd() + '/package.json').jspm.configFile || 'config.js';
require(process.cwd() + '/' + configFile); // load config file

// filesystem
const fs = require('fs');
const denodeify = require('denodeify');
const writeFile = denodeify(fs.writeFile);
const glob = denodeify(require('glob'));

// selenium
const webdriver = require('selenium-webdriver');
const Builder = webdriver.Builder;
const until = webdriver.until;
const connect = require('connect');
const server = connect();
const port = process.env.SAUCE_LABS_USER ? 80 : 9435;
server.use(require('serve-static')(process.cwd()));
server.listen(port);

let nodeTests = []
let webTests = []

// Find tests
glob('lib/**/*.spec.js').then((tests) => {
		nodeTests = tests.filter(test => !test.endsWith('.web.spec.js'))
		webTests = tests.filter(test => !test.endsWith('.node.spec.js'))
		return createWebTestScript()
	})
	.then(() => {
		// Run web tests in each browser
		if(webTests.length > 0) {
			console.log('Testing IE: ')
			return runWebTest('ie')
				.then(() => {
					console.log('Testing FF: ')
					return runWebTest('firefox')
				})
				.then(() => {
					console.log('Testing Chrome: ')
					return runWebTest('chrome')
				})
		}
	})
	.then(() => {
		// Run node tests
		if(nodeTests.length > 0) {
			console.log('Testing Node: ')
			return Promise.all(nodeTests.map((test) => System.import(test)))
		}
	})
	.then(run)
	.catch(function(err) {
		if(err instanceof Error)
			console.error(err.stack)
		else
			console.error(err)
	});

function runWebTest(browser) {
	const builder = new Builder();
	let driver = builder.forBrowser(browser);
	if(process.env.SAUCE_LABS_USER !== undefined)
		driver = driver.usingServer('http://' + process.env.SAUCE_LABS_USER + ':' + process.env.SAUCE_LABS_AUTH_TOKEN + '@ondemand.saucelabs.com/wd/hub')
	driver = driver.build();
	let task = null;
	if(process.env.SAUCE_LABS_USER !== undefined || !process.env.TRAVIS_JOB_NUMBER)
		task = driver.get('http://localhost:' + port + '/test/testrunner.html')
	else
		return; // TODO: phantomjs?

	return task.then(function() {
			return driver.wait(new until.Condition('Waiting for tests...', function() {
				return driver.executeScript('return window.testsFinished;')
			}), 60000)
		})
		.then(function(result) {
			return driver.executeScript('return testResults;')
		})
		.then(function(results) {
			results.forEach(function(result) {
				if(result && result[0] !== 'stdout:') // swallow undefined and color info :(
					if(!Array.isArray(result)) {
						// Log regular calls
						console.log(result);
					} else {
						// Trap error output
						if(result[0] === '%d failing' && result[1] > 0)
							process.exitCode = 1
							// Write info
						console.log.apply(console, result);
					}
			})
			return driver.quit();
		})
		.catch(function(err) {
			if(err instanceof Error)
				console.error(err.stack)
			else
				console.error(err)
		});
}

function createWebTestScript() {
	var output = '/* eslint-disable */\r\nmodule.exports = loadTests;\r\n function loadTests(){ return [\r\n'
	output += webTests.map((test) => '\r\n\tSystem.import("' + test + '")').join(',')
	output += '\r\n]}'
	return writeFile('test/tests.generated.js', output)
}
