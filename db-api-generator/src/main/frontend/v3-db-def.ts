import {Const_UniqueKey, DBDef_V3, DBProto, DefaultDBVersion} from '@nu-art/ts-common';
import {DBConfigV3} from '@nu-art/thunderstorm/frontend';

export type DBApiFEConfigV3<Proto extends DBProto<any>> = {
	key: string
	versions: Proto['versions']
	validator: Proto['modifiablePropsValidator']
	dbConfig: DBConfigV3<Proto>
}

export const getModuleFEConfigV3 = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): DBApiFEConfigV3<Proto> => {
	return {
		key: dbDef.dbName,
		versions: dbDef.versions || [DefaultDBVersion],
		validator: dbDef.modifiablePropsValidator,
		dbConfig: {
			version: 1,
			name: dbDef.dbName,
			indices: dbDef.indices,
			autoIncrement: false,
			uniqueKeys: dbDef.uniqueKeys || [Const_UniqueKey] as (keyof Proto['dbType'])[]
		},
	};
};