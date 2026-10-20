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


/** Mongo `createIndex` direction. Omitted means ascending. Same shape as `@nu-art/ts-common`. */
export type MongoIndexDirection = 1 | -1 | 'text';

export type MongoIndexKey = {
	/** Dotted paths are allowed (`target.id`). */
	field: string;
	direction?: MongoIndexDirection;
};

/**
 * Mongo spec used instead of {@link DBIndex.keys} when present.
 * IndexedDB does not read this.
 */
export type MongoIndexOptions = {
	keys: readonly MongoIndexKey[];
	/** Mongo text-index language. `none` disables stemming and stop-words. */
	defaultLanguage?: string;
	weights?: Readonly<Record<string, number>>;
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
	/** Optional index parameters. `multiEntry` is IndexedDB-only. */
	params?: {
		multiEntry: boolean;
		unique: boolean;
	};
	/**
	 * When set, Mongo indexes these keys instead of `keys`.
	 * IndexedDB still indexes `keys` and ignores this block.
	 */
	mongo?: MongoIndexOptions;
};
