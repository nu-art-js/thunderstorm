/*
 * @nu-art/idb-shared - IndexedDB shared types and definitions
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */


export type ReduceFunction<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

export type DBConfig<ItemType extends object> = {
	name: string
	group: string;
	version: string
	autoIncrement?: boolean,
	uniqueKeys: (keyof ItemType)[]
	indices?: DBIndex<ItemType>[]
	upgradeProcessor?: (store: IDBObjectStore) => void
};

export type IndexDb_Query = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};


/**
 * Database index definition.
 *
 * Defines an index on one or more fields of a database object.
 *
 * @template ItemType - Database object type
 */
export type DBIndex<ItemType extends object> = {
	/** Index identifier */
	id: string;
	/** Field(s) to index (single key or array of keys) */
	keys: keyof ItemType | (keyof ItemType)[];
	/** Optional index parameters */
	params?: {
		multiEntry: boolean;
		unique: boolean;
	};
};

/**
 * Index keys type for querying by indexed fields.
 *
 * Allows querying by any combination of indexed keys.
 *
 * @template T - Object type
 * @template Ks - Indexed keys
 */
export type IndexKeys<T extends Object, Ks extends keyof T> = { [K in Ks]?: T[K] }; // {_id:'all bases belong to us'} || {label: 'all items with this label'}
