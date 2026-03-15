import {Database, DB_Prototype} from '@nu-art/db-api-shared';
import {Const_UniqueKeys, Day, Hour} from '@nu-art/ts-common';

export type DBApiBEConfig<Proto extends DB_Prototype> = {
	uniqueKeys: Proto['uniqueKeys']
	itemName: string;
	versions: Proto['versions'];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: Proto['lockKeys']
}

export const getModuleBEConfig = <Proto extends DB_Prototype>(dbDef: Database<Proto>): DBApiBEConfig<Proto> => {
	return {
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Proto['uniqueKeys'],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day,
	};
};

