import {DBDef_V3, tsValidateMustExist, tsValidateString} from '@nu-art/ts-common';
import {DBProto_AppConfig} from './types';


const Validator_ModifiableProps: DBProto_AppConfig['modifiablePropsValidator'] = {
	key: tsValidateString(),
	data: tsValidateMustExist,
};

const Validator_GeneratedProps: DBProto_AppConfig['generatedPropsValidator'] = {};

export const DBDef_AppConfig: DBDef_V3<DBProto_AppConfig> = {
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