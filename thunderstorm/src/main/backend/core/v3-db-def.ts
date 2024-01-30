import {Const_UniqueKey, Const_UniqueKeys, Day, DB_Object, DBDef_V3, DBProto, Hour} from '@nu-art/ts-common';


export const Const_LockKeys: (keyof DB_Object)[] = [Const_UniqueKey, '_v', '__created', '__updated'];

export type DBApiBEConfigV3<Proto extends DBProto<any>> = {
	collectionName: string;
	uniqueKeys: Proto['uniqueKeys']
	itemName: string;
	versions: Proto['versions'];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: Proto['lockKeys']
}

export const getModuleBEConfigV3 = <Proto extends DBProto<any, any, any>>(dbDef: DBDef_V3<Proto>): DBApiBEConfigV3<Proto> => {
	return {
		collectionName: dbDef.dbName,
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Proto['uniqueKeys'],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day,
	};
};

