import {__stringify, exists} from '../utils/tools';
import {BadImplementationException} from '../core/exceptions';


export class MemStorage {
	private readonly cache: any = {};

	private set = <T>(key: MemKey<T>, value: T): T => {
		const currentValue = this.cache[key.key];
		if (exists(currentValue) && key.unique) {
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

		this.set(storage, value as T);
	};

	get = (storage: MemStorage, value?: T): T => {
		// @ts-ignore
		return storage.get(this, value);
	};

	set = (storage: MemStorage, value: T) => {
		// @ts-ignore
		return storage.set(this, value);
	};
}