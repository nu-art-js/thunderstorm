import {
	tsValidate_OptionalArray,
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateOptionalAnyNumber,
	tsValidateOptionalAnyString,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitConfigJSON_Node, UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node';
import {Unit_FirebaseFunctionsApp} from '../../units/firebase/Unit_FirebaseFunctionsApp';
import {resolve} from 'path';
import {BaiParam_SetEnv} from '../../../core/params/params';


type EnvConfig = {
	defaultConfig?: string,
	envConfig?: string,
	projectId: string,
	isLocal?: boolean
};

type UnitConfigJSON_FirebaseFunction = UnitConfigJSON_Node & {
	debugPort?: number, basePort?: number
	envs: TypedMap<EnvConfig>
	ignore?: string[],
	sslKey?: string
	sslCert?: string
};

const valuesValidator = {
	defaultConfig: tsValidateOptionalAnyString,
	envConfig: tsValidateOptionalAnyString,
	projectId: tsValidateAnyString,
	isLocal: tsValidateBoolean(false),
};

export class UnitMapper_FirebaseFunction_Class
	extends UnitMapper_Node<Unit_FirebaseFunctionsApp, UnitConfigJSON_FirebaseFunction> {

	static tsValidator_FirebaseFunction = {
		type: tsValidateValue(['firebase-function']),
		ignore: tsValidate_OptionalArray(tsValidateOptionalAnyString),
		envs: tsValidateDynamicObject<TypedMap<EnvConfig>>(valuesValidator, tsValidateAnyString),
		debugPort: tsValidateOptionalAnyNumber,
		basePort: tsValidateOptionalAnyNumber,
		sslKey: tsValidateOptionalAnyString,
		sslCert: tsValidateOptionalAnyString,
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_FirebaseFunction_Class.tsValidator_FirebaseFunction);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext<UnitConfigJSON_FirebaseFunction>) {
		const outputDir = context.packageJson.publishConfig?.directory;

		const env = this.runtimeParams[BaiParam_SetEnv.keyName];
		const envUnitConfig = context.packageJson.unitConfig.envs[env];
		const envConfig = {
			defaultConfig: envUnitConfig.defaultConfig ?? 'default',
			envConfig: envUnitConfig.envConfig ?? env as string,
			projectId: envUnitConfig.projectId,
			isLocal: envUnitConfig.isLocal ?? env === 'local'
		};

		const {type, ...unitConfig} = context.packageJson.unitConfig;
		return new Unit_FirebaseFunctionsApp({
			...context.baseConfig,
			...Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction,
			...unitConfig,
			envConfig,
			packageJson: context.packageJson,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: resolve(context.baseConfig.fullPath, outputDir ?? Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction.output),
			sslCert: resolve(context.baseConfig.fullPath, unitConfig.sslCert ?? Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction.sslCert),
			sslKey: resolve(context.baseConfig.fullPath, unitConfig.sslKey ?? Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction.sslKey),
		});
	}
}

export const UnitMapper_FirebaseFunction = new UnitMapper_FirebaseFunction_Class();