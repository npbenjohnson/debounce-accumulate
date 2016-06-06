class Debouncer {
	constructor(fulfill, waitMs, reject, thisArg) {
		this.fulfill = fulfill;
		this.waitMs = waitMs;
		this.reject = reject;
		this.thisArg = thisArg;
		this.pendingCall = null;
		this.pendingTimeout = null;
		return this.call.bind(this)
	}

	call() {
		// If there is an outstanding call, debounce it
		if(this.pendingCall)
			this.pendingCall.reject();

		// Set the current call as pending
		this.pendingCall = {
			fulfill: this.fulfilled.bind(this, arguments),
			reject: this.rejected.bind(this, arguments)
		};
		this.pendingTimeout = setTimeout(this.pendingCall.fulfill, this.waitMs);
	}

	fulfilled(args) {
		// Clear pending status and call provided func
		this.pendingCall = null;
		// run func with provided context and args
		this.fulfill.apply(this.thisArg, args);
	}

	rejected(args) {
		// Clear the pending call
		clearTimeout(this.pendingTimeout);
		this.pendingCall = null;
		if(this.reject)
		// Call onDebounce with provided arguments
			this.reject.apply(this.thisArg, args);
	}
}

export default Debouncer
