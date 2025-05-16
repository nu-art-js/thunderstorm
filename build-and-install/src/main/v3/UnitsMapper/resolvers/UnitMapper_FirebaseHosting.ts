import {
	_keys,
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateOptional,
	tsValidateOptionalAnyNumber,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node';
import {
	FirebaseHosting_EnvConfig,
	Unit_FirebaseHostingApp,
	Unit_FirebaseHostingApp_Config,
	UnitConfigJSON_FirebaseHosting
} from '../../units/firebase/Unit_FirebaseHostingApp';

const valuesValidator = {
	configUrl: tsValidateAnyString,
	projectId: tsValidateAnyString,
	isLocal: tsValidateBoolean(false),
};


export class UnitMapper_FirebaseHosting_Class
	extends UnitMapper_Node<Unit_FirebaseHostingApp, UnitConfigJSON_FirebaseHosting> {

	static tsValidator_FirebaseHosting = {
		type: tsValidateValue(['firebase-hosting']),
		servingPort: tsValidateOptionalAnyNumber,
		envs: tsValidateDynamicObject<TypedMap<FirebaseHosting_EnvConfig>>(valuesValidator, tsValidateAnyString),
		hostingConfig: tsValidateOptional,
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_FirebaseHosting_Class.tsValidator_FirebaseHosting);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext<UnitConfigJSON_FirebaseHosting>) {
		const outputDir = context.packageJson.publishConfig?.directory;

		const envsConfig = _keys(context.packageJson.unitConfig.envs).reduce((carry, env) => {
			const envConfig = context.packageJson.unitConfig.envs[env];
			carry[env as string] = {
				configUrl: envConfig.configUrl,
				projectId: envConfig.projectId,
				isLocal: envConfig.isLocal ?? env === 'local'
			};
			return carry;
		}, {} as Unit_FirebaseHostingApp_Config['envs']);

		const {type, ...unitConfig} = context.packageJson.unitConfig;
		return new Unit_FirebaseHostingApp({
			...context.baseConfig,
			...Unit_FirebaseHostingApp.DefaultConfig_FirebaseHosting,
			...unitConfig,
			envs: envsConfig,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: outputDir ?? Unit_FirebaseHostingApp.DefaultConfig_FirebaseHosting.output,
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_FirebaseHosting = new UnitMapper_FirebaseHosting_Class();