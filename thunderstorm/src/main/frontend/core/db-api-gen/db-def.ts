import {Const_UniqueKey, DBDef_V3, DBProto, DefaultDBVersion} from '@nu-art/ts-common';
import {DBConfigV3} from '../IndexedDBV4/types';

export type DBApiFEConfig<Proto extends DBProto<any>> = {
	key: string
	versions: Proto['versions']
	validator: Proto['modifiablePropsValidator']
	dbConfig: DBConfigV3<Proto>
}

export const getModuleFEConfigV3 = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): DBApiFEConfig<Proto> => {
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