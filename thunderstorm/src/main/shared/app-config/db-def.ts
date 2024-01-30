import {DBDef, OmitDBObject, tsValidateMustExist, tsValidateString, ValidatorTypeResolver} from '@nu-art/ts-common';
import {DB_AppConfig} from './types';

// export const Validator_AppConfigData = {
// 	categoriesOrder: tsValidateDynamicObject<TypedMap<UniqueId[]>>(tsValidateArray(tsValidateUniqueId), tsValidateString()),
// 	sourceTag: tsValidateUniqueId,
// 	complaintsTag: tsValidateUniqueId,
// 	diseaseCategory: tsValidateUniqueId,
// 	dpViewsOrder: tsValidator_arrayOfUniqueIds
// };

const Validator_AppConfig: ValidatorTypeResolver<OmitDBObject<DB_AppConfig>> = {
	key: tsValidateString(),
	data: tsValidateMustExist,
};

export const DBDef_AppConfigs: DBDef<DB_AppConfig, 'key'> = {
	validator: Validator_AppConfig,
	dbName: 'app-configs',
	entityName: 'app-config',
	uniqueKeys: ['key']
};