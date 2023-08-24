import {
	_keys,
	Const_UniqueKey,
	Const_UniqueKeys,
	Day,
	DB_Object,
	DBDef_V3,
	DBProto,
	Hour,
	keepPartialObject, tsValidateResult
} from '@nu-art/ts-common';

export const Const_LockKeys: (keyof DB_Object)[] = [Const_UniqueKey, '_v', '__created', '__updated'];

export type DBApiBEConfigV3<Proto extends DBProto<any>> = {
	collectionName: string;
	validator: [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']] | Proto['generatedPropsValidator'] & Proto['modifiablePropsValidator'];
	uniqueKeys: Proto['uniqueKeys']
	itemName: string;
	versions: Proto['versions'];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: Proto['lockKeys']
}

export const getDbDefValidator = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): DBApiBEConfigV3<Proto>['validator'] => {
	if (typeof dbDef.modifiablePropsValidator === 'object' && typeof dbDef.generatedPropsValidator === 'object')
		return {...dbDef.generatedPropsValidator, ...dbDef.modifiablePropsValidator};
	else if (typeof dbDef.modifiablePropsValidator === 'function' && typeof dbDef.generatedPropsValidator === 'function')
		return [dbDef.modifiablePropsValidator, dbDef.generatedPropsValidator];
	else {
		if (typeof dbDef.modifiablePropsValidator === 'function')
			return [dbDef.modifiablePropsValidator, <T extends Proto['dbType']>(instance: T) => tsValidateResult(keepPartialObject(instance, _keys(dbDef.generatedPropsValidator)), dbDef.generatedPropsValidator)];

		return [dbDef.generatedPropsValidator, <T extends Proto['dbType']>(instance: T) => tsValidateResult(keepPartialObject(instance, _keys(dbDef.modifiablePropsValidator)), dbDef.modifiablePropsValidator)];
	}
};


export const getModuleBEConfigV3 = <Proto extends DBProto<any, any, any>>(dbDef: DBDef_V3<Proto>): DBApiBEConfigV3<Proto> => {
	return {
		collectionName: dbDef.dbName,
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Proto['uniqueKeys'],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day,
		validator: getDbDefValidator(dbDef)
	};
};

