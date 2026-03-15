import {Database} from '@nu-art/db-api-shared';
import {tsValidateMustExist, tsValidateString} from '@nu-art/ts-common';
import {DatabaseDef_AppConfig} from './types.js';


const Validator_ModifiableProps: DatabaseDef_AppConfig['modifiablePropsValidator'] = {
	key: tsValidateString(),
	data: tsValidateMustExist,
};

const Validator_GeneratedProps: DatabaseDef_AppConfig['generatedPropsValidator'] = {};

export const DBDef_AppConfig: Database<DatabaseDef_AppConfig> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'app-configs',
	entityName: 'AppConfig',
	frontend: {
		group: 'app',
		name: 'config'
	},
	backend: {
		name: 'app-configs'
	}
};