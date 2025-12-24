import {
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateMustExist,
	tsValidateOptional,
	tsValidateOptionalAnyNumber,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {FirebaseHosting_EnvConfig, Unit_FirebaseHostingApp, UnitConfigJSON_FirebaseHosting} from '../../units/firebase/Unit_FirebaseHostingApp.js';
import {resolve} from 'path';
import {BaiParam_SetEnv} from '../../../core/params/params.js';

const valuesValidator = {
	config: tsValidateMustExist,
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
		const env = this.runtimeParams[BaiParam_SetEnv.keyName];
		let envUnitConfig = context.packageJson.unitConfig.envs[env];
		if (!envUnitConfig) {
			this.logWarning(`Missing EnvConfig in unit ${context.baseConfig.key}`);
			envUnitConfig = {
				config: {},
				projectId: '',
				isLocal: true
			};
		}


		const envConfig = {
			config: envUnitConfig.config,
			projectId: envUnitConfig.projectId,
			isLocal: envUnitConfig.isLocal ?? env === 'local'
		};


		const {type, ...unitConfig} = context.packageJson.unitConfig;
		return new Unit_FirebaseHostingApp({
			...context.baseConfig,
			...Unit_FirebaseHostingApp.DefaultConfig_FirebaseHosting,
			...unitConfig,
			envConfig,
			isTopLevelApp: true,
			hasSelfHotReload: unitConfig.hasSelfHotReload ?? false,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: resolve(context.baseConfig.fullPath, outputDir ?? Unit_FirebaseHostingApp.DefaultConfig_FirebaseHosting.output),
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_FirebaseHosting = new UnitMapper_FirebaseHosting_Class();