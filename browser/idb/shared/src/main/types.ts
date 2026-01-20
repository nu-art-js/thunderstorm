/*
 * @nu-art/idb-shared - IndexedDB shared types and definitions
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DBIndex, DBProto} from '@nu-art/ts-common';


export type ReduceFunction<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

export type DBConfig<Proto extends DBProto<any>> = {
	name: string
	group: string;
	version: string
	autoIncrement?: boolean,
	uniqueKeys: (keyof Proto['dbType'])[]
	indices?: DBIndex<Proto['dbType']>[]
	upgradeProcessor?: (store: IDBObjectStore) => void
};

export type IndexDb_Query = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};
