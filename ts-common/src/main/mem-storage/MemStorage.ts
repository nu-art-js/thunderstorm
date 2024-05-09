import {__stringify, exists} from '../utils/tools';
import {BadImplementationException} from '../core/exceptions/exceptions';

import {AsyncLocalStorage} from 'async_hooks';
import {generateHex} from '../utils/random-tools';
import {ValidationException} from '../validator/validator-core';


const asyncLocalStorage = new AsyncLocalStorage<MemStorage>();

export class MemStorage {
	private readonly cache: any = {__myId: generateHex(4)};

	constructor() {
		// console.log(`---- ${this.cache.__myId} created`);

	}

	async init<R>(makeItContext: () => Promise<R>) {
		return asyncLocalStorage.run(this, makeItContext);
	}

	initSync<R>(makeItContext: () => R) {
		return asyncLocalStorage.run(this, makeItContext);
	}

	private set = <T>(key: MemKey<T>, value: T): T => {
		// console.log(`-- ${this.cache.__myId} set: ${key.key} -> `, value);
		const currentValue = this.cache[key.key];
		if (exists(currentValue) && key.unique && value !== currentValue) {
			throw new BadImplementationException(`Unique storage key is being overridden for key: ${key.key}
			\ncurrent: ${__stringify(currentValue)}
			\nnew: ${__stringify(value as any)}`);
		}

		return this.cache[key.key] = value;
	};

	private get = <T>(key: MemKey<T>, defaultValue?: T): T => {
		let currentValue = this.cache[key.key];
		if (!exists(currentValue))
			currentValue = defaultValue;

		return currentValue;
	};
}

export class MemKey<T> {

	readonly key: string;
	readonly unique: boolean;
	private resolver?: (storage: MemStorage) => T;

	constructor(key: string, unique = false) {
		this.key = key;
		this.unique = unique;
	}

	setResolver = (resolver?: (storage: MemStorage) => T) => {
		this.resolver = resolver;
		return this;
	};

	resolve = async (storage: MemStorage) => {
		const value = this.resolver?.(storage);
		if (!exists(value))
			return;

		this.set(value as T);
	};

	assert = (value?: T) => {
		const storedValue = this.get();
		if (!exists(value))
			return storedValue;

		if (value !== storedValue) {
			throw new ValidationException(`Asserting MemKey(${this.key}) ${value} !== ${storedValue}!`);
		}

		return storedValue;
	};

	get = (value?: T): T => {
		// @ts-ignore
		const memValue = asyncLocalStorage.getStore().get(this, value);
		if (!exists(memValue))
			throw new BadImplementationException(`Trying to access MemKey(${this.key}) before it was set!`);

		return memValue;
	};

	set = (value: T) => {
		// console.log(this.key, value);
		if (!exists(value))
			throw new BadImplementationException(`Cannot set MemKey(${this.key}) to undefined or null!`);

		// @ts-ignore
		return asyncLocalStorage.getStore().set(this, value);
	};

	merge = (value: T) => {
		const currentValue = this.get();
		// @ts-ignore
		return asyncLocalStorage.getStore().set(this, merge(currentValue, value));
	};
}