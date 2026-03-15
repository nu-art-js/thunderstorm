import {DB_Prototype} from '@nu-art/db-api-shared';
import {DBIndex} from '@nu-art/ts-common';


export type ReduceFunction_V3<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

export type DBConfigV3<Proto extends DB_Prototype> = {
	name: string
	group: string;
	version: string
	autoIncrement?: boolean,
	uniqueKeys: (keyof Proto['dbType'])[]
	indices?: DBIndex<Proto['dbType']>[]
	upgradeProcessor?: (store: IDBObjectStore) => void
};

export type IndexDb_Query_V3 = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};