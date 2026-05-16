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
	uniqueKeys: (keyof ItemType | string)[]
	indices?: DBIndex<ItemType>[]
	upgradeProcessor?: (store: IDBObjectStore) => void
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
