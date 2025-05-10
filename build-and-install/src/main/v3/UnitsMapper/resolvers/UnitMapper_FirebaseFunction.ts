import {
	_keys,
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
import {Unit_FirebaseFunctionsApp, Unit_FirebaseFunctionsApp_Config} from '../../units/firebase/Unit_FirebaseFunctionsApp';


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

		const envsConfig = _keys(context.packageJson.unitConfig.envs).reduce((carry, env) => {
			const envConfig = context.packageJson.unitConfig.envs[env];
			carry[env as string] = {
				defaultConfig: envConfig.defaultConfig ?? 'default',
				envConfig: envConfig.envConfig ?? env as string,
				projectId: envConfig.projectId,
				isLocal: envConfig.isLocal ?? env === 'local'
			};
			return carry;
		}, {} as Unit_FirebaseFunctionsApp_Config['envs']);

		const {type, ...unitConfig} = context.packageJson.unitConfig;
		return new Unit_FirebaseFunctionsApp({
			...context.baseConfig,
			...Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction,
			...unitConfig,
			envs: envsConfig,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: outputDir ?? Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction.output,
		});
	}
}

export const UnitMapper_FirebaseFunction = new UnitMapper_FirebaseFunction_Class();