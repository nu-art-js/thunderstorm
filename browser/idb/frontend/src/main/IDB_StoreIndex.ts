/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ReduceFunction} from '@nu-art/idb-shared';


/**
 * Index configuration options for IDB store indices
 */
export type IndexConfig = {
	unique?: boolean;
	multiEntry?: boolean;
};

/**
 * Keys type - single key or array of keys (readonly supported for 'as const')
 */
export type IndexKeys<ItemType extends object> = keyof ItemType | readonly (keyof ItemType)[];

/**
 * Internal index definition used by IDB_Database during store creation
 */
export type IndexDefinition<ItemType extends object, Keys extends IndexKeys<ItemType>> = {
	name: string;
	keys: Keys;
	config?: IndexConfig;
};

/**
 * Query executor interface - passed from IDB_Store to IDB_StoreIndex
 * This pattern allows IDB_Store's query methods to remain private
 */
export type IndexQueryExecutor<ItemType extends object> = {
	getAll: (indexName: string, value: IDBValidKey, limit?: number) => Promise<ItemType[]>;
	count: (indexName: string, value: IDBValidKey) => Promise<number>;
	filter: (indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean, limit?: number) => Promise<ItemType[]>;
	find: (indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean) => Promise<ItemType | undefined>;
	map: <T>(indexName: string, value: IDBValidKey, mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean) => Promise<T[]>;
	reduce: <T>(indexName: string, value: IDBValidKey, reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean) => Promise<T>;
};

/**
 * Utility type to extract the query value type from keys
 * - Single key: ItemType[Key]
 * - Array of keys: Tuple of values [ItemType[K1], ItemType[K2], ...]
 */
export type IndexQueryValue<ItemType extends object, Keys extends IndexKeys<ItemType>> =
	Keys extends readonly (keyof ItemType)[]
		? { [I in keyof Keys]: Keys[I] extends keyof ItemType ? ItemType[Keys[I]] : never }
		: Keys extends keyof ItemType
			? ItemType[Keys]
			: never;

/**
 * IDB_StoreIndex - Typed index accessor for querying by indexed fields
 *
 * Provides type-safe queries where the query value type is inferred from the indexed field(s).
 *
 * @template ItemType - The store's item type
 * @template Keys - The indexed field key(s) (keyof ItemType or array of keys)
 *
 * Usage:
 * ```typescript
 * // Single key index
 * const byEmail = store.createIndex('by-email', 'email', {unique: true});
 * const users = await byEmail.getAll('test@example.com');  // string required
 *
 * // Compound key index
 * const byNameDate = store.createIndex('by-name-date', ['lastName', 'createdAt'] as const);
 * const users = await byNameDate.getAll(['Smith', 1234567890]);  // [string, number] required
 * ```
 */
export class IDB_StoreIndex<ItemType extends object, Keys extends IndexKeys<ItemType>> {

	private readonly executor: IndexQueryExecutor<ItemType>;
	private readonly indexName: string;
	private readonly keys: Keys;
	private readonly config: IndexConfig;


	constructor(executor: IndexQueryExecutor<ItemType>, indexName: string, keys: Keys, config?: IndexConfig) {
		this.executor = executor;
		this.indexName = indexName;
		this.keys = keys;
		this.config = config ?? {};
	}

	/**
	 * Get the index name
	 */
	get name(): string {
		return this.indexName;
	}

	/**
	 * Get the indexed field key(s)
	 */
	get indexKeys(): Keys {
		return this.keys;
	}

	/**
	 * Get the index configuration
	 */
	getConfig(): IndexConfig {
		return this.config;
	}

	/**
	 * Get all items matching the index value
	 *
	 * @param value - The value to search for (type inferred from indexed field)
	 * @param limit - Optional limit on results
	 * @returns Array of matching items
	 */
	async getAll(value: IndexQueryValue<ItemType, Keys>, limit?: number): Promise<ItemType[]> {
		return this.executor.getAll(this.indexName, value as IDBValidKey, limit);
	}

	/**
	 * Get a single item by index value
	 *
	 * @param value - The value to search for
	 * @returns First matching item or undefined
	 */
	async get(value: IndexQueryValue<ItemType, Keys>): Promise<ItemType | undefined> {
		const results = await this.getAll(value, 1);
		return results[0];
	}

	/**
	 * Count items matching the index value
	 *
	 * @param value - The value to count
	 * @returns Number of matching items
	 */
	async count(value: IndexQueryValue<ItemType, Keys>): Promise<number> {
		return this.executor.count(this.indexName, value as IDBValidKey);
	}

	/**
	 * Filter items matching the index value
	 *
	 * @param value - The index value to search for
	 * @param filter - Filter function to apply to results
	 * @param limit - Optional limit on filtered results
	 * @returns Filtered array of items
	 */
	async filter(value: IndexQueryValue<ItemType, Keys>, filter: (item: ItemType) => boolean, limit?: number): Promise<ItemType[]> {
		return this.executor.filter(this.indexName, value as IDBValidKey, filter, limit);
	}

	/**
	 * Find first item matching filter within index results
	 *
	 * @param value - The index value to search for
	 * @param filter - Filter function to find match
	 * @returns First matching item or undefined
	 */
	async find(value: IndexQueryValue<ItemType, Keys>, filter: (item: ItemType) => boolean): Promise<ItemType | undefined> {
		return this.executor.find(this.indexName, value as IDBValidKey, filter);
	}

	/**
	 * Map items matching the index value
	 *
	 * @param value - The index value to search for
	 * @param mapper - Transform function
	 * @param filter - Optional filter to apply before mapping
	 * @returns Array of transformed values
	 */
	async map<T>(value: IndexQueryValue<ItemType, Keys>, mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean): Promise<T[]> {
		return this.executor.map(this.indexName, value as IDBValidKey, mapper, filter);
	}

	/**
	 * Reduce items matching the index value to a single value
	 *
	 * @param value - The index value to search for
	 * @param reducer - Reducer function
	 * @param initialValue - Initial accumulator value
	 * @param filter - Optional filter to apply before reducing
	 * @returns Reduced value
	 */
	async reduce<T>(value: IndexQueryValue<ItemType, Keys>, reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean): Promise<T> {
		return this.executor.reduce(this.indexName, value as IDBValidKey, reducer, initialValue, filter);
	}
}
