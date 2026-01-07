import {
	ImplementationMissingException,
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateMustExist,
	tsValidateOptional,
	tsValidateOptionalAnyNumber,
	tsValidateOptionalObject,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {FirebaseHosting_EnvConfig, Unit_FirebaseHostingApp, UnitConfigJSON_FirebaseHosting} from '../../implementations/firebase/Unit_FirebaseHostingApp.js';
import {resolve} from 'path';
import {BaiParam_SetEnv} from '../../../core/params.js';

const valuesValidator = {
	config: tsValidateMustExist,
	projectId: tsValidateAnyString,
	isLocal: tsValidateBoolean(false),
};

const hostingDeploymentValidator = {
	artifactRegistry: {
		region: tsValidateAnyString,
		repository: tsValidateAnyString,
		projectId: tsValidateAnyString,
	},
};


export class UnitMapper_FirebaseHosting_Class
	extends UnitMapper_Node<Unit_FirebaseHostingApp, UnitConfigJSON_FirebaseHosting> {

	static tsValidator_FirebaseHosting = {
		type: tsValidateValue(['firebase-hosting']),
		servingPort: tsValidateOptionalAnyNumber,
		envs: tsValidateDynamicObject<TypedMap<FirebaseHosting_EnvConfig>>(valuesValidator, tsValidateAnyString),
		hostingConfig: tsValidateOptional,
		hostingDeployment: tsValidateOptionalObject(hostingDeploymentValidator),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_FirebaseHosting_Class.tsValidator_FirebaseHosting);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext<UnitConfigJSON_FirebaseHosting>) {
		const outputDir = context.packageJson.publishConfig?.directory;
		const env = this.runtimeParams[BaiParam_SetEnv.keyName];
		const envUnitConfig = context.packageJson.unitConfig.envs[env];
		if (!envUnitConfig) {
			this.logWarning('Package Json config:', context.packageJson.unitConfig);
			throw new ImplementationMissingException(`Missing configuration for env: ${env}`);
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