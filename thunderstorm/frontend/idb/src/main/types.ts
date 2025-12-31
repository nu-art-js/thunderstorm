import {DBIndex, DBProto} from '@nu-art/ts-common';


export type IDB_ReduceFunction<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

export type IDB_Config<Proto extends DBProto<any>> = {
	name: string
	group: string;
	version: string
	autoIncrement?: boolean,
	uniqueKeys: (keyof Proto['dbType'])[]
	indices?: DBIndex<Proto['dbType']>[]
	upgradeProcessor?: (store: IDBObjectStore) => void
};

export type IDb_Query = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};