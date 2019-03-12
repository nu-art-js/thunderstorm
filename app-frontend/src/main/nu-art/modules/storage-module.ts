/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module} from "@nu-art/core";

export class StorageModule
	extends Module<void> {
	private cache: { [s: string]: string | object } = {};

	store(key: string, value: string | object) {
		if (!value)
			return this.remove(key);

		this.cache[key] = value;
		localStorage.setItem(key, JSON.stringify(value));
	}

	remove(key: string) {
		this.release(key);
		localStorage.removeItem(key);
	}

	release(key: string) {
		delete this.cache[key];
	}

	static _store(key: string, value: string | object) {

	}

	public load(key: string, defaultValue: string | object): string | object | null {
		let value: string | object | null = this.cache[key];
		if (value)
			return value;

		value = localStorage.getItem(key);
		if (!value)
			return defaultValue;

		return this.cache[key] = JSON.parse(value);
	}
}
