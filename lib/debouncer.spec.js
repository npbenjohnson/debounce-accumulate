import Debouncer from './debouncer.js'
import q from 'q'
describe('debounce', function() {
	it('should call onCanceled handler when debouncing', function() {
		var cancelled = this.sinon.spy();
		var fired = this.sinon.spy();
		var tester = new Debouncer(fired, 100, cancelled);
		tester();
		tester();
		tester();
		tester();
		return expect(q.delay(600).then(function() {
			expect(cancelled.callCount).to.equal(3);
			expect(fired.callCount).to.equal(1);
		})).to.eventually.resolve
	})
	it('should pass args to functions', function() {
		var cancelled = this.sinon.spy();
		var fired = this.sinon.spy();
		var tester = new Debouncer(fired, 100, cancelled);
		tester(true);
		tester(false);
		tester('foo');
		return expect(q.delay(500).then(function() {
			expect(cancelled.getCall(0).args[0]).to.equal(true);
			expect(cancelled.getCall(1).args[0]).to.equal(false);
			expect(fired.getCall(0).args[0]).to.equal('foo');
		})).to.eventually.resolve
	})
	it('should preserve context', function() {
		var c1 = null;
		var c2 = null;
		var ctx = {
			test: 'test'
		};
		var func = new Debouncer(function() {
			c1 = this;
		}, 50, function() {
			c2 = this
		}, ctx);
		func();
		func();
		return expect(q.delay(100).then(function() {
			return [c1, c2];
		})).to.eventually.deep.equal([ctx, ctx]);
	})
})
