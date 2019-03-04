/**
 * Created by tacb0ss on 27/07/2018.
 */
//TODO extend Logger and print config per module

class EventDispatcher {

	constructor() {
		this.listeners = [];
	}

	validateListener(listener) {
		if (!listener._implements)
			throw new Error("listener MUST respect the _implements method");
	}

	register(listener) {
		this.validateListener(listener);

		if (this.listeners.indexOf(listener) !== -1)
			return;

		this.listeners = this.listeners.concat(listener);
		// console.log("added listener: " + listener);
	}

	unregister(listener) {
		const index = this.listeners.indexOf(listener);
		if (index === -1)
			return;

		this.listeners = this.listeners.filter(function (item) {
			return item !== listener
		});

		// console.log("removed listener: " + listener);
	}

	dispatchEvent(_interface, method, ...params) {
		let called = false;
		this.listeners.forEach((listener) => {
			if (!listener._implements(_interface))
				return;

			called = true;
			listener[method](...params);
		});

		if (!called)
			console.error(`BEWARE... no listeners for interface: ${_interface.name}.${method}`)
	}
}

export default new EventDispatcher();
