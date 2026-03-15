import {Database, DB_Prototype} from '@nu-art/db-api-shared';
import {Const_UniqueKey, DefaultDBVersion} from '@nu-art/ts-common';
import {DBConfigV3} from '../IndexedDBV4/types.js';

export type DBApiFEConfig<Proto extends DB_Prototype> = {
	key: string
	versions: Proto['versions']
	validator: Proto['modifiablePropsValidator']
	dbConfig: DBConfigV3<Proto>
}

export const getModuleFEConfigV3 = <Proto extends DB_Prototype>(dbDef: Database<Proto>): DBApiFEConfig<Proto> => {
	return {
		key: dbDef.dbKey,
		versions: dbDef.versions || [DefaultDBVersion],
		validator: dbDef.modifiablePropsValidator,
		dbConfig: {
			version: dbDef.versions[0],
			name: dbDef.frontend.name,
			group: dbDef.frontend.group,
			indices: dbDef.indices,
			autoIncrement: false,
			uniqueKeys: dbDef.uniqueKeys || [Const_UniqueKey] as (keyof Proto['dbType'])[]
		},
	};
};