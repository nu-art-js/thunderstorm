import {__stringify, exists} from '../utils/tools.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {merge} from '../utils/merge-tools.js';

import {AsyncLocalStorage} from 'async_hooks';
import {ValidationException} from '../validator/validator-core.js';


/** AsyncLocalStorage instance for storing MemStorage per async context */
const asyncLocalStorage = new AsyncLocalStorage<MemStorage>();

/**
 * In-memory storage scoped to async execution context.
 *
 * Uses Node.js AsyncLocalStorage to provide storage that is automatically
 * scoped to the current async execution context. This allows passing data
 * through async call chains without explicitly threading it through parameters.
 *
 * **Use cases**:
 * - Request context storage (user, session, etc.)
 * - Transaction context
 * - Async operation metadata
 *
 * **Key features**:
 * - Automatic context isolation (each async context has its own storage)
 * - Context inheritance (child contexts can access parent storage)
 * - Type-safe keys via MemKey
 * - Unique key enforcement (optional)
 */
export class MemStorage {
	/** Internal cache object */
	private readonly cache: any = {};

	constructor() {
	}

	/**
	 * Gets the MemStorage instance for the current async context.
	 *
	 * Returns undefined if called outside of an `init()` or `initSync()` context.
	 *
	 * @returns Current MemStorage instance, or undefined
	 */
	static getStore() {
		return asyncLocalStorage.getStore();
	}

	/**
	 * Initializes a new async context with this MemStorage instance.
	 *
	 * Runs the provided function in a new async context where this MemStorage
	 * is available via `getStore()`. Optionally inherits data from an enclosing
	 * context storage.
	 *
	 * **Context inheritance**: If `enclosingContextStorage` is provided, its
	 * cache entries are copied to this storage. If the enclosing context is
	 * the same as this one, the function runs directly without creating a new context.
	 *
	 * @template R - Return type
	 * @param makeItContext - Async function to run in the new context
	 * @param enclosingContextStorage - Optional parent context to inherit from
	 * @returns Promise resolving to the function's return value
	 */
	async init<R>(makeItContext: () => Promise<R>, enclosingContextStorage?: MemStorage): Promise<R> {
		let isSameContext = false;

		const response = await asyncLocalStorage.run(this, async () => {
			const currentStorage = MemStorage.getStore()!;

			if (currentStorage === enclosingContextStorage) {
				isSameContext = true;
				return;
			}

			if (enclosingContextStorage)
				for (const key in enclosingContextStorage.cache) {
					currentStorage.cache[key] = enclosingContextStorage.cache[key];
				}

			return makeItContext();
		});

		if (isSameContext)
			return makeItContext();

		return response as R;
	}

	/**
	 * Initializes a new async context synchronously.
	 *
	 * Synchronous version of `init()` for non-async functions.
	 *
	 * @template R - Return type
	 * @param makeItContext - Function to run in the new context
	 * @returns Function's return value
	 */
	initSync<R>(makeItContext: () => R) {
		return asyncLocalStorage.run(this, makeItContext);
	}

	/**
	 * Sets a value in the cache.
	 *
	 * If the key is marked as unique and a different value already exists,
	 * throws an exception.
	 *
	 * @template T - Value type
	 * @param key - MemKey to set
	 * @param value - Value to store
	 * @returns The stored value
	 * @throws BadImplementationException if unique key is being overridden
	 */
	private set = <T>(key: MemKey<T>, value: T): T => {
		const currentValue = this.cache[key.key];
		if (exists(currentValue) && key.unique && value !== currentValue) {
			throw new BadImplementationException(`Unique storage key is being overridden for key: ${key.key}
			\ncurrent: ${__stringify(currentValue)}
			\nnew: ${__stringify(value as any)}`);
		}

		return this.cache[key.key] = value;
	};

	/**
	 * Gets a value from the cache.
	 *
	 * Returns the stored value, or the default value if not set.
	 *
	 * @template T - Value type
	 * @param key - MemKey to get
	 * @param defaultValue - Optional default value if key is not set
	 * @returns Stored value or default
	 */
	private get = <T>(key: MemKey<T>, defaultValue?: T): T => {
		let currentValue = this.cache[key.key];
		if (!exists(currentValue))
			currentValue = defaultValue;

		return currentValue;
	};
}

/**
 * Type-safe key for MemStorage.
 *
 * Provides a type-safe interface for accessing MemStorage values.
 * Supports unique keys (prevent overwriting), lazy resolution, and assertions.
 *
 * **Design – never set nothing**: MemKeys must never be set to undefined or null.
 * There is no point in setting something that is nothing; it would be like deleting
 * or overwriting relevant state that should persist. Callers must use a meaningful
 * empty value for their type (e.g. `''` for string, `{}` for object) when the logical
 * value is "absent". `set()` throws if given undefined or null.
 *
 * **Usage**:
 * ```typescript
 * const userKey = new MemKey<User>('user', true); // unique key
 * userKey.set(user);
 * const user = userKey.get(); // TypeScript knows this is User
 * ```
 *
 * @template T - Value type stored under this key
 */
export class MemKey<T> {

	/** Key name (string identifier) */
	readonly key: string;
	/** Whether this key is unique (cannot be overwritten) */
	readonly unique: boolean;
	/** Optional resolver function for lazy initialization */
	private resolver?: (storage: MemStorage) => T;

	/**
	 * Creates a new MemKey.
	 *
	 * @param key - Key name (string identifier)
	 * @param unique - If true, prevents overwriting existing values (default: false)
	 */
	constructor(key: string, unique = false) {
		this.key = key;
		this.unique = unique;
	}

	/**
	 * Sets a resolver function for lazy initialization.
	 *
	 * The resolver is called by `resolve()` to compute the value if it's not set.
	 *
	 * @param resolver - Function that computes the value from storage
	 * @returns This instance for method chaining
	 */
	setResolver = (resolver?: (storage: MemStorage) => T) => {
		this.resolver = resolver;
		return this;
	};

	/**
	 * Resolves the value using the resolver function if set.
	 *
	 * Calls the resolver and stores the result if the value is not already set.
	 *
	 * @param storage - MemStorage instance to use
	 */
	resolve = async (storage: MemStorage) => {
		const value = this.resolver?.(storage);
		if (!exists(value))
			return;

		this.set(value as T);
	};

	/**
	 * Asserts that the stored value matches the expected value.
	 *
	 * If no value is provided, returns the stored value.
	 * If a value is provided and it doesn't match the stored value, throws.
	 *
	 * @param value - Optional expected value to assert
	 * @returns The stored value
	 * @throws ValidationException if value is provided and doesn't match stored value
	 */
	assert = (value?: T) => {
		const storedValue = this.get();
		if (!exists(value))
			return storedValue;

		if (value !== storedValue) {
			throw new ValidationException(`Asserting MemKey(${this.key}) ${value} !== ${storedValue}!`);
		}

		return storedValue;
	};

	/**
	 * Peaks at the stored value without throwing if not set.
	 *
	 * Returns undefined if the value is not set, unlike `get()` which throws.
	 *
	 * @returns Stored value or undefined
	 */
	peak = (): (T | undefined) => {
		// @ts-ignore
		const memValue = asyncLocalStorage.getStore().get(this);
		return memValue;
	};

	/**
	 * Gets the stored value.
	 *
	 * If the value is not set and a default is provided, returns the default.
	 * Otherwise throws an exception.
	 *
	 * @param value - Optional default value if key is not set
	 * @returns Stored value or default
	 * @throws BadImplementationException if value is not set and no default provided
	 */
	get = (value?: T): T => {
		// @ts-ignore
		const memValue = asyncLocalStorage.getStore().get(this, value);
		if (!exists(memValue))
			throw new BadImplementationException(`Trying to access MemKey(${this.key}) before it was set!`);

		return memValue;
	};

	/**
	 * Sets the value in the current async context's storage.
	 *
	 * @param value - Value to store (cannot be null or undefined)
	 * @returns The stored value
	 * @throws BadImplementationException if value is null or undefined
	 */
	set = (value: T) => {
		// console.log(this.key, value);
		if (!exists(value))
			throw new BadImplementationException(`Cannot set MemKey(${this.key}) to undefined or null!`);

		// @ts-ignore
		return asyncLocalStorage.getStore().set(this, value);
	};

	/**
	 * Merges the value with the existing stored value.
	 *
	 * Uses the `merge()` utility function to deep merge objects.
	 * The current value must exist (will throw if not set).
	 *
	 * @param value - Value to merge with existing value
	 * @returns The merged value
	 * @throws BadImplementationException if current value is not set
	 */
	merge = (value: T) => {
		const currentValue = this.get();
		// @ts-ignore
		return asyncLocalStorage.getStore().set(this, merge(currentValue, value));
	};
}