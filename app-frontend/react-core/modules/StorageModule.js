/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';

class StorageModule
	extends Module {

	constructor() {
		super();
		this.storage = {};
	}

	store(key, value) {
		this.storage[key] = value;
		if (!value)
			return this.remove(key);

		localStorage.setItem(key, JSON.stringify(value));
	}

	remove(key) {
		this.release(key);
		localStorage.removeItem(key);
	}

	release(key) {
		delete this.storage[key];
	}

	static _store(key, value) {

	}

	load(key, defaultValue) {
		let value = this.storage[key];
		if (value)
			return value;

		value = localStorage.getItem(key);
		if (!value)
			return defaultValue;

		return this.storage[key] = JSON.parse(value);
	}
}

export default new StorageModule();
