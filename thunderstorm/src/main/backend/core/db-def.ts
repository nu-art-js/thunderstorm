import {Const_UniqueKeys, Day, DBDef_V3, DBProto, Hour} from '@nu-art/ts-common';


export type DBApiBEConfig<Proto extends DBProto<any>> = {
	uniqueKeys: Proto['uniqueKeys']
	itemName: string;
	versions: Proto['versions'];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: Proto['lockKeys']
}

export const getModuleBEConfig = <Proto extends DBProto<any, any, any>>(dbDef: DBDef_V3<Proto>): DBApiBEConfig<Proto> => {
	return {
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Proto['uniqueKeys'],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day,
	};
};

